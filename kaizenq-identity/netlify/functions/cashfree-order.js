// Netlify Serverless Function: /.netlify/functions/cashfree-order
// Authoritative Cashfree PG Order Creation with secure server-side credentials

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

    const { productId, amountRupees, productTitle, couponCode, customerPhone } = body

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

    const baseUrl = isSandbox ? 'https://sandbox.cashfree.com/pg' : 'https://api.cashfree.com/pg'

    const CATALOG = {
      'pro-template-modern-professional': 199.0,
      'pro-template-technical': 199.0,
      'pro-theme-creative': 299.0,
      'pro-theme-modern': 299.0,
      'custom-domain-pass': 499.0,
      'pro-all-access-pass': 999.0,
    }

    let finalAmount = CATALOG[productId] || (amountRupees ? Number(amountRupees) : 199.0)

    if (couponCode) {
      const code = String(couponCode).toUpperCase().trim()
      if (code === 'WELCOME10') {
        finalAmount = Number((finalAmount * 0.9).toFixed(2))
      } else if (code === 'RESUME50' && String(productId).includes('template')) {
        finalAmount = Math.max(1.0, finalAmount - 50.0)
      } else if (code === 'PORTFOLIO20' && String(productId).includes('theme')) {
        finalAmount = Number((finalAmount * 0.8).toFixed(2))
      }
    }

    const orderId =
      (body && body.orderId) ||
      'ORD_PRB_' + Date.now() + '_' + Math.random().toString(16).slice(2, 8).toUpperCase()

    let phone = String(customerPhone || '9999999999').replace(/\D/g, '')
    if (phone.length < 10) phone = '9999999999'
    if (phone.length > 10) phone = phone.slice(-10)

    const customerEmail = (body && body.customerEmail) || 'customer@prbuilder.xyz'
    const customerName = (body && body.customerName) || 'PR Builder Customer'
    const customerId = (body && body.customerId) || ('cust_' + Date.now())

    let origin = 'https://www.prbuilder.xyz'
    if (event.headers) {
      if (event.headers.origin) {
        origin = event.headers.origin
      } else if (event.headers.referer) {
        try {
          origin = new URL(event.headers.referer).origin
        } catch {
          // Fall back
        }
      }
    }

    const cfPayload = {
      order_id: orderId,
      order_amount: finalAmount,
      order_currency: 'INR',
      customer_details: {
        customer_id: customerId,
        customer_email: customerEmail,
        customer_phone: phone,
        customer_name: customerName,
      },
      order_meta: {
        return_url: `${origin}/dashboard?order_id=${orderId}`,
      },
      order_note: productTitle || 'PR Builder Pro Upgrade',
    }
        customer_name: 'PR Builder Customer',
      },
      order_meta: {
        return_url: `https://www.prbuilder.xyz/dashboard?order_id=${orderId}`,
      },
      order_note: productTitle || 'PR Builder Pro Upgrade',
    }

    const cfRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'x-api-version': apiVersion,
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cfPayload),
    })

    const cfData = await cfRes.json()

    if (!cfRes.ok || !cfData.payment_session_id) {
      return {
        statusCode: cfRes.status || 502,
        headers,
        body: JSON.stringify({
          error: cfData.message || 'Cashfree order creation failed',
          details: cfData,
        }),
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        orderId,
        cfOrderId: cfData.cf_order_id,
        paymentSessionId: cfData.payment_session_id,
        amountRupees: finalAmount,
        amountPaise: Math.round(finalAmount * 100),
        currency: 'INR',
        orderStatus: cfData.order_status || 'ACTIVE',
        expiresAt: cfData.order_expiry_time,
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
