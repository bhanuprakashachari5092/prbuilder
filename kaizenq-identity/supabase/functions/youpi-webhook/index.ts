// @ts-nocheck
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This code runs in a trusted Supabase Edge Function environment on Deno.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Constant-time byte equality check to prevent timing side-channel attacks
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

async function computeHmacSha256Hex(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  const hashArray = Array.from(new Uint8Array(signatureBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req: Request) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const rawBody = await req.text()
    const signatureHeader = req.headers.get('x-gateway-signature')

    // Secret must be configured in Supabase Vault / Edge Function environment
    const webhookSecret = Deno.env.get('YOUPI_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.error('Missing YOUPI_WEBHOOK_SECRET in environment')
      return new Response(JSON.stringify({ error: 'Gateway configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!signatureHeader) {
      return new Response(JSON.stringify({ error: 'Missing x-gateway-signature header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Verify HMAC-SHA256 signature
    let actualHex = signatureHeader.trim()
    if (actualHex.startsWith('sha256=')) {
      actualHex = actualHex.slice(7)
    }

    const calculatedHex = await computeHmacSha256Hex(rawBody, webhookSecret)
    const isAuthentic = constantTimeCompare(calculatedHex, actualHex)

    if (!isAuthentic) {
      console.warn('HMAC-SHA256 signature mismatch detected. Rejecting webhook.')
      return new Response(JSON.stringify({ error: 'Invalid cryptographic signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Parse payload
    const payload = JSON.parse(rawBody)
    const { orderId, status, utr } = payload

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Missing orderId in payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // If payment succeeded, invoke the authoritative verify_and_fulfill_payment RPC
    if (status === 'SUCCESS' || status === 'PAID') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })

      const { data, error } = await supabaseAdmin.rpc('verify_and_fulfill_payment', {
        p_order_id: orderId,
        p_utr: utr || null,
        p_signature: signatureHeader,
        p_raw_payload: rawBody,
        p_is_sandbox: false,
      })

      if (error) {
        console.error('Fulfillment error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ success: true, fulfillment: data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ received: true, status }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Webhook execution failure:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
