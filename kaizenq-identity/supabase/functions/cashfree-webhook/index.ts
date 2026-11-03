// @ts-nocheck
// Supabase Edge Function: cashfree-webhook
// Securely processes Cashfree webhook notifications with HMAC-SHA256 signature verification.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Constant-time byte equality comparison
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

// Computes Base64-encoded HMAC-SHA256 signature according to Cashfree PG spec
async function computeCashfreeSignature(timestamp: string, rawBody: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const data = enc.encode(timestamp + rawBody)
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, data)
  const bytes = new Uint8Array(signatureBuffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-webhook-signature')
    const timestamp = req.headers.get('x-webhook-timestamp')

    const secretKey = Deno.env.get('CASHFREE_SECRET_KEY')
    if (!secretKey) {
      console.error('Missing CASHFREE_SECRET_KEY in server environment')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!signature || !timestamp) {
      return new Response(JSON.stringify({ error: 'Missing webhook signature or timestamp header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Verify HMAC signature
    const computedSignature = await computeCashfreeSignature(timestamp, rawBody, secretKey)
    const isValid = constantTimeCompare(computedSignature, signature.trim())

    if (!isValid) {
      console.warn('Cashfree webhook signature mismatch. Rejecting webhook.')
      return new Response(JSON.stringify({ error: 'Invalid cryptographic signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const event = JSON.parse(rawBody)
    const eventType = event.type || event.event_type || ''
    const data = event.data || {}
    const order = data.order || {}
    const payment = data.payment || {}

    const orderId = order.order_id || data.order_id
    const paymentStatus = payment.payment_status || data.payment_status || ''
    const bankReference = payment.bank_reference || payment.cf_payment_id || data.bank_reference || ''

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Missing order_id in webhook payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check if event represents successful payment
    const isSuccess =
      eventType === 'PAYMENT_SUCCESS_WEBHOOK' ||
      eventType === 'ORDER_PAID' ||
      paymentStatus === 'SUCCESS' ||
      order.order_status === 'PAID'

    if (isSuccess) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })

      const isSandboxEnv = Deno.env.get('CASHFREE_ENV') === 'sandbox'

      const { data: fulfillData, error: fulfillError } = await supabaseAdmin.rpc(
        'verify_and_fulfill_payment',
        {
          p_order_id: orderId,
          p_utr: bankReference || `CF_WH_${Date.now()}`,
          p_signature: signature,
          p_raw_payload: rawBody,
          p_is_sandbox: isSandboxEnv,
        },
      )

      if (fulfillError) {
        console.error('Webhook fulfill error:', fulfillError)
        return new Response(JSON.stringify({ error: fulfillError.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      console.log(`Order ${orderId} successfully fulfilled via Cashfree webhook`)
    }

    return new Response(JSON.stringify({ received: true, eventType, orderId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('Webhook processing exception:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

