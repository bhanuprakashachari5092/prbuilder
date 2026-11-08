// Vercel Serverless Function: /api/cashfree-verify
// Authoritative Cashfree PG Payment Verification

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const orderId = (req.body && (req.body.orderId || req.body.order_id)) || ''
    if (!orderId) return res.status(400).json({ error: 'orderId is required' })

    let appId = process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID
    let secretKey = process.env.CASHFREE_SECRET_KEY

    if (!appId || !secretKey) {
      try {
        const fs = await import('node:fs')
        const path = await import('node:path')
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
    const isSandbox =
      (process.env.CASHFREE_ENV || '').toLowerCase() === 'sandbox' ||
      (secretKey && secretKey.startsWith('cfsk_ma_test_')) ||
      (appId && appId.startsWith('TEST'))

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
