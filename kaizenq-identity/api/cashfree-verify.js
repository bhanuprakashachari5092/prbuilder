// Vercel Serverless Function: /api/cashfree-verify
// Authoritative Cashfree PG Payment Verification

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { orderId } = req.body || {}
    if (!orderId) return res.status(400).json({ error: 'orderId is required' })

    const appId = process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID
    const secretKey = process.env.CASHFREE_SECRET_KEY
    const apiVersion = process.env.CASHFREE_API_VERSION || '2023-08-01'
    const isSandbox = (process.env.CASHFREE_ENV || 'production') === 'sandbox'

    if (!appId || !secretKey) {
      return res.status(500).json({ error: 'Cashfree credentials not configured in server environment' })
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
      return res.status(200).json({ success: false, status: 'pending', orderId })
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

    return res.status(200).json({
      success: isPaid,
      status: orderData.order_status ? orderData.order_status.toLowerCase() : 'pending',
      orderId,
      utr: bankReference || (isPaid ? `CF_${orderData.cf_order_id || Date.now()}` : undefined),
    })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
