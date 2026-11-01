import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import { Badge } from '../../../components/ui/Badge.tsx'
import { Button } from '../../../components/ui/Button.tsx'
import {
  paymentService,
  type PaymentOrderRow,
  type UserEntitlement,
} from '../../../services/paymentService.ts'

export const PaymentHistoryView: React.FC = () => {
  const [orders, setOrders] = useState<(PaymentOrderRow & { productName: string; amountRupees: number })[]>([])
  const [entitlements, setEntitlements] = useState<(UserEntitlement & { productName: string })[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const loadHistory = async () => {
    setLoading(true)
    const res = await paymentService.getUserPaymentHistory()
    if (res.data) {
      setOrders(res.data.orders)
      setEntitlements(res.data.entitlements)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadHistory()
  }, [])

  return (
    <div className="space-y-6">
      {/* Active Entitlements Card */}
      <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#2563EB]" />
            <h2 className="text-base font-bold text-[#111827]">Unlocked Features & Entitlements</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadHistory}
            className="text-xs text-[#64748B] hover:text-[#111827]"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {entitlements.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <p className="text-xs text-[#64748B]">
              No paid add-ons unlocked yet. Free resume ATS templates and portfolio themes are 100% active.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {entitlements.map((e, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#F0FDF4] border border-emerald-200 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-emerald-950">{e.productName}</p>
                  <p className="text-[11px] font-mono text-emerald-700 mt-0.5">{e.entitlement_key}</p>
                </div>
                <Badge variant="outline" className="border-emerald-300 bg-white text-emerald-700 text-[10px]">
                  Active
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orders Ledger */}
      <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-[#2563EB]" />
          <h2 className="text-base font-bold text-[#111827]">Transaction & Order Ledger</h2>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <CreditCard className="w-8 h-8 text-[#94A3B8] mx-auto" />
            <p className="text-sm font-medium text-[#111827]">No transaction history</p>
            <p className="text-xs text-[#64748B]">All your UPI payments and invoice receipts will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                  <th className="pb-3 px-3">Order ID</th>
                  <th className="pb-3 px-3">Product</th>
                  <th className="pb-3 px-3">Amount</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">UTR Reference</th>
                  <th className="pb-3 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]/60">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-[#111827]">{o.id}</td>
                    <td className="py-3 px-3 font-semibold text-[#111827]">{o.productName}</td>
                    <td className="py-3 px-3 font-bold text-[#111827]">₹{o.amountRupees.toFixed(2)}</td>
                    <td className="py-3 px-3">
                      {o.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Paid
                        </span>
                      ) : o.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" />
                          {o.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-[#64748B]">{o.utr || '—'}</td>
                    <td className="py-3 px-3 text-[#64748B]">
                      {new Date(o.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
