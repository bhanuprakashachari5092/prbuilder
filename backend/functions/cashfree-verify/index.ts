// @ts-nocheck
// Supabase Edge Function: cashfree-verify
// Verifies Cashfree payment status authoritative via Cashfree PG API and fulfills entitlements.

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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    const payload = await req.json()
    const { orderId } = payload

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const appId = Deno.env.get('CASHFREE_APP_ID')
    const secretKey = Deno.env.get('CASHFREE_SECRET_KEY')
    const apiVersion = Deno.env.get('CASHFREE_API_VERSION') || '2023-08-01'
    const isSandboxEnv = Deno.env.get('CASHFREE_ENV') === 'sandbox'
    const baseUrl = isSandboxEnv ? 'https://sandbox.cashfree.com/pg' : 'https://api.cashfree.com/pg'

    // 1. Fetch order status from Cashfree
    const orderRes = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: {
        'x-api-version': apiVersion,
        'x-client-id': appId,
        'x-client-secret': secretKey,
      },
    })

    if (!orderRes.ok) {
      const errData = await orderRes.json().catch(() => ({}))
      return new Response(
        JSON.stringify({
          error: errData.message || 'Unable to check order with Cashfree',
          status: 'pending',
        }),
        {
          status: orderRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const orderData = await orderRes.json()

    // 2. If PAID, fetch payment details for UTR / bank reference
    if (orderData.order_status === 'PAID') {
      let bankReference = ''
      try {
        const paymentsRes = await fetch(
          `${baseUrl}/orders/${encodeURIComponent(orderId)}/payments`,
          {
            method: 'GET',
            headers: {
              'x-api-version': apiVersion,
              'x-client-id': appId,
              'x-client-secret': secretKey,
            },
          },
        )
        if (paymentsRes.ok) {
          const payments = await paymentsRes.json()
          if (Array.isArray(payments) && payments.length > 0) {
            const successfulPayment = payments.find((p) => p.payment_status === 'SUCCESS') || payments[0]
            bankReference =
              successfulPayment.bank_reference ||
              String(successfulPayment.cf_payment_id || '')
          }
        }
      } catch (e) {
        console.warn('Could not fetch payment reference:', e)
      }

      // Fulfill via Supabase Admin RPC
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })

      const { data: fulfillResult, error: fulfillError } = await supabaseAdmin.rpc(
        'verify_and_fulfill_payment',
        {
          p_order_id: orderId,
          p_utr: bankReference || `CF_${orderData.cf_order_id || Date.now()}`,
          p_signature: null,
          p_raw_payload: JSON.stringify(orderData),
          p_is_sandbox: isSandboxEnv,
        },
      )

      if (fulfillError) {
        console.error('Fulfillment RPC error:', fulfillError)
        return new Response(JSON.stringify({ error: fulfillError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: 'paid',
          orderId,
          utr: bankReference || fulfillResult?.utr,
          entitlementKey: fulfillResult?.entitlementKey,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // 3. Otherwise return current state
    return new Response(
      JSON.stringify({
        success: false,
        status: orderData.order_status?.toLowerCase() || 'pending',
        orderId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err: any) {
    console.error('Cashfree verification exception:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
