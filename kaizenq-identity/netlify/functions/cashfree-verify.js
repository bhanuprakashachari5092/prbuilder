// Netlify Serverless Function: /.netlify/functions/cashfree-verify
// Authoritative Cashfree PG Payment Verification

exports.handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type, authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    let body = {}
    if (event.body) {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body
    }

    const { orderId } = body
    if (!orderId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'orderId is required' }) }
    }

    let appId = process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID
    let secretKey = process.env.CASHFREE_SECRET_KEY

    if (!appId || !secretKey) {
      try {
        const fs = require('node:fs')
        const path = require('node:path')
        const envCandidates = [
          path.resolve(process.cwd(), '.env'),
          path.resolve(process.cwd(), 'kaizenq-identity', '.env'),
        ]
        for (const envPath of envCandidates) {
          if (fs.existsSync(envPath)) {
            const lines = fs.readFileSync(envPath, 'utf8').split('\n')
            for (const line of lines) {
              const m = line.match(/^([^=]+)=(.*)$/)
              if (m) {
                const k = m[1].trim()
                const v = m[2].trim()
                if (k === 'CASHFREE_APP_ID' && !appId) appId = v
                if (k === 'CASHFREE_SECRET_KEY' && !secretKey) secretKey = v
                if (k === 'VITE_CASHFREE_APP_ID' && !appId) appId = v
              }
            }
          }
        }
      } catch (e) {
        // Fall through
      }
    }

    const apiVersion = process.env.CASHFREE_API_VERSION || '2023-08-01'
    const isSandbox = (process.env.CASHFREE_ENV || 'production') === 'sandbox'

    if (!appId || !secretKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Cashfree credentials not configured in server environment' }),
      }
    }

    const baseUrl = isSandbox ? 'https://sandbox.cashfree.com/pg' : 'https://api.cashfree.com/pg'

    const orderRes = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: {
        'x-api-version': apiVersion,
        'x-client-id': appId,
        'x-client-secret': secretKey,
      },
    })

    if (!orderRes.ok) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: false, status: 'pending', orderId }),
      }
    }

    const orderData = await orderRes.json()
    const isPaid = orderData.order_status === 'PAID'

    let bankReference = ''
    if (isPaid) {
      try {
        const paymentsRes = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}/payments`, {
          method: 'GET',
          headers: {
            'x-api-version': apiVersion,
            'x-client-id': appId,
            'x-client-secret': secretKey,
          },
        })
        if (paymentsRes.ok) {
          const payments = await paymentsRes.json()
          if (Array.isArray(payments) && payments.length > 0) {
            const successP = payments.find((p) => p.payment_status === 'SUCCESS') || payments[0]
            bankReference = successP.bank_reference || String(successP.cf_payment_id || '')
          }
        }
      } catch (e) {
        // Ignored
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: isPaid,
        status: orderData.order_status ? orderData.order_status.toLowerCase() : 'pending',
        orderId,
        utr: bankReference || (isPaid ? `CF_${orderData.cf_order_id || Date.now()}` : undefined),
      }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    }
  }
}
