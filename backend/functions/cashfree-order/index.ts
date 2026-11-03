// @ts-nocheck
// Supabase Edge Function: cashfree-order
// Handles authoritative Cashfree order creation with server-side pricing and secrets protection.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    // 1. Authenticate user from Bearer token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    })

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized user session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = await req.json()
    const { productId, couponCode, customerPhone } = payload

    if (!productId) {
      return new Response(JSON.stringify({ error: 'productId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Authoritative Database Order Creation via RPC
    const isSandboxEnv = Deno.env.get('CASHFREE_ENV') === 'sandbox'
    const { data: dbOrder, error: orderError } = await supabaseUser.rpc('create_payment_order', {
      p_product_id: productId,
      p_is_sandbox: isSandboxEnv,
      p_coupon_code: couponCode ? String(couponCode).trim().toUpperCase() : null,
    })

    if (orderError || !dbOrder) {
      return new Response(
        JSON.stringify({ error: orderError?.message || 'Failed to initialize payment order' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const orderId = dbOrder.orderId
    const amountPaise = dbOrder.amountPaise
    const amountRupees = Number((amountPaise / 100).toFixed(2))

    // 3. Cashfree Credentials Check
    const appId = Deno.env.get('CASHFREE_APP_ID')
    const secretKey = Deno.env.get('CASHFREE_SECRET_KEY')
    const apiVersion = Deno.env.get('CASHFREE_API_VERSION') || '2023-08-01'

    if (!appId || !secretKey) {
      return new Response(
        JSON.stringify({ error: 'Cashfree PG credentials not configured on server' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const baseUrl = isSandboxEnv ? 'https://sandbox.cashfree.com/pg' : 'https://api.cashfree.com/pg'

    // Customer details formatting
    const customerId = user.id.replace(/-/g, '').slice(0, 36)
    const customerEmail = user.email || 'customer@prbuilder.xyz'
    const customerName = (user.user_metadata?.full_name || 'PR Builder User').slice(0, 100)
    // Clean phone number (default 10 digits if unspecified)
    let sanitizedPhone = String(customerPhone || user.phone || '9999999999').replace(/\D/g, '')
    if (sanitizedPhone.length < 10) sanitizedPhone = '9999999999'
    if (sanitizedPhone.length > 10) sanitizedPhone = sanitizedPhone.slice(-10)

    const cfOrderPayload = {
      order_id: orderId,
      order_amount: amountRupees,
      order_currency: 'INR',
      customer_details: {
        customer_id: customerId,
        customer_email: customerEmail,
        customer_phone: sanitizedPhone,
        customer_name: customerName,
      },
      order_meta: {
        return_url: `https://www.prbuilder.xyz/dashboard?order_id=${orderId}`,
      },
      order_note: dbOrder.productName || 'PR Builder Premium Upgrade',
    }

    // 4. Invoke Cashfree Order API
    const cfRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'x-api-version': apiVersion,
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cfOrderPayload),
    })

    const cfData = await cfRes.json()

    if (!cfRes.ok || !cfData.payment_session_id) {
      console.error('Cashfree PG order error:', cfData)
      return new Response(
        JSON.stringify({
          error: cfData.message || 'Cashfree payment gateway order creation failed',
          details: cfData,
        }),
        {
          status: cfRes.status || 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // 5. Update payment_orders metadata with Cashfree order info (via admin client)
    if (supabaseServiceKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
      await supabaseAdmin
        .from('payment_orders')
        .update({
          gateway_order_id: String(cfData.cf_order_id || cfData.order_id),
          metadata: {
            ...((dbOrder.metadata as Record<string, unknown>) || {}),
            cfOrderId: cfData.cf_order_id,
            paymentSessionId: cfData.payment_session_id,
            gateway: 'cashfree',
          },
        })
        .eq('id', orderId)
    }

    // 6. Return response to client
    return new Response(
      JSON.stringify({
        orderId,
        cfOrderId: cfData.cf_order_id,
        paymentSessionId: cfData.payment_session_id,
        amountRupees,
        amountPaise,
        currency: 'INR',
        orderStatus: cfData.order_status,
        expiresAt: cfData.order_expiry_time || dbOrder.expiresAt,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err: any) {
    console.error('Cashfree order handler exception:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

