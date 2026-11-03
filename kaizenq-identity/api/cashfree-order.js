// Vercel Serverless Function: /api/cashfree-order
// Authoritative Cashfree PG Order Creation with secure server-side environment credentials

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { productId, amountRupees, productTitle, couponCode, customerPhone } = req.body || {}

    const appId = process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID
    const secretKey = process.env.CASHFREE_SECRET_KEY
    const apiVersion = process.env.CASHFREE_API_VERSION || '2023-08-01'
    const isSandbox = (process.env.CASHFREE_ENV || 'production') === 'sandbox'

    if (!appId || !secretKey) {
      return res.status(500).json({ error: 'Cashfree credentials not configured in server environment' })
    }

    const baseUrl = isSandbox ? 'https://sandbox.cashfree.com/pg' : 'https://api.cashfree.com/pg'

    // Authoritative catalog price fallback
    const CATALOG = {
      'pro-template-modern-professional': 199.0,
      'pro-template-technical': 199.0,
      'pro-theme-creative': 299.0,
      'pro-theme-modern': 299.0,
      'custom-domain-pass': 499.0,
      'pro-all-access-pass': 999.0,
    }

    let finalAmount = CATALOG[productId] || (amountRupees ? Number(amountRupees) : 199.0)

    // Apply coupon discount if provided
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
      'ORD_PRB_' + Date.now() + '_' + Math.random().toString(16).slice(2, 8).toUpperCase()

    let phone = String(customerPhone || '9999999999').replace(/\D/g, '')
    if (phone.length < 10) phone = '9999999999'
    if (phone.length > 10) phone = phone.slice(-10)

    const cfPayload = {
      order_id: orderId,
      order_amount: finalAmount,
      order_currency: 'INR',
      customer_details: {
        customer_id: 'cust_' + Date.now(),
        customer_email: 'customer@prbuilder.xyz',
        customer_phone: phone,
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
      return res.status(cfRes.status || 502).json({
        error: cfData.message || 'Cashfree order creation failed',
        details: cfData,
      })
    }

    return res.status(200).json({
      orderId,
      cfOrderId: cfData.cf_order_id,
      paymentSessionId: cfData.payment_session_id,
      amountRupees: finalAmount,
      amountPaise: Math.round(finalAmount * 100),
      currency: 'INR',
      orderStatus: cfData.order_status,
      expiresAt: cfData.order_expiry_time,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
