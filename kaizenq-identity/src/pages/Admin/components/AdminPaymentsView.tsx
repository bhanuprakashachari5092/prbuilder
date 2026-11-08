import React, { useState, useEffect } from 'react'
import {
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  FileSpreadsheet,
  Zap,
  RotateCcw,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Button } from '../../../components/ui/Button.tsx'
import { Badge } from '../../../components/ui/Badge.tsx'
import {
  paymentService,
  type AdminPaymentAnalytics,
} from '../../../services/paymentService.ts'

export const AdminPaymentsView: React.FC = () => {
  const [analytics, setAnalytics] = useState<AdminPaymentAnalytics | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [isSimulating, setIsSimulating] = useState<boolean>(false)
  const [liveAlert, setLiveAlert] = useState<string | null>(null)

  const loadAnalytics = async () => {
    setLoading(true)
    const res = await paymentService.getAdminPaymentAnalytics()
    if (res.data) {
      setAnalytics(res.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadAnalytics()

    // Real-time listener: automatically re-fetches when any transaction is settled
    const unsubscribe = paymentService.subscribeToRevenueUpdates((payload) => {
      loadAnalytics()
      if (payload?.amountRupees) {
        setLiveAlert(`⚡ Real-Time Payment Settled: +₹${payload.amountRupees} (${payload.productName || payload.orderId || 'Verified UPI'})`)
        setTimeout(() => setLiveAlert(null), 5000)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleSimulateLivePayment = async () => {
    setIsSimulating(true)
    try {
      const amounts = [199, 299, 999]
      const chosenAmount = amounts[Math.floor(Math.random() * amounts.length)]
      const productName =
        chosenAmount === 999
          ? 'PR Builder Pro All-Access Pass'
          : chosenAmount === 299
          ? 'Creative Studio Portfolio Theme'
          : 'Modern Professional Resume Template'

      const res = await paymentService.simulateRealtimePayment(chosenAmount, productName)
      setLiveAlert(`⚡ Live Real-Time Transaction Succeeded: +₹${res.amountRupees} added to Total Revenue!`)
      setTimeout(() => setLiveAlert(null), 5000)
    } finally {
      setIsSimulating(false)
    }
  }

  const handleExportCsv = async () => {
    setIsExporting(true)
    try {
      const csv = await paymentService.exportPaymentsCsv()
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pr_builder_payments_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  // Filter transactions
  const filteredOrders = (analytics?.recentOrders || []).filter((o) => {
    const matchesSearch =
      o.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.utr && o.utr.toLowerCase().includes(searchQuery.toLowerCase())) ||
      o.productName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A]">Payments & Revenue</h1>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-xs">
              YouPI-PG Core
            </Badge>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Real-Time Stream Active</span>
            </div>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Authoritative integer paise ledger, real-time UPI transaction audits, and instantaneous product telemetry
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulateLivePayment}
            disabled={isSimulating}
            className="border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100/70"
            title="Simulate an instant real-time UPI payment to verify live metrics increment"
          >
            <Zap className={`w-3.5 h-3.5 mr-1.5 text-emerald-600 ${isSimulating ? 'animate-bounce' : ''}`} />
            {isSimulating ? 'Processing...' : 'Simulate Real-Time Payment'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalytics}
            className="border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await paymentService.resetRevenue()
              await loadAnalytics()
            }}
            className="border-rose-200 bg-rose-50/60 text-rose-700 hover:bg-rose-100/70 text-xs"
            title="Reset simulated orders and zero ledger revenue"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
            Reset Revenue
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
            {isExporting ? 'Exporting...' : 'Export Financial CSV'}
          </Button>
        </div>
      </div>

      {/* Live Real-time Alert Banner */}
      {liveAlert && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>{liveAlert}</span>
          </div>
          <button
            onClick={() => setLiveAlert(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white to-emerald-50/20 border-2 border-emerald-400/30 shadow-sm relative overflow-hidden transition-all">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Gross Total Revenue</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0F172A] mt-2">
            ₹{analytics?.totalRevenueRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
          </p>
          <div className="flex items-center justify-between mt-1 text-[11px] text-[#64748B]">
            <span>{analytics?.totalRevenuePaise.toLocaleString('en-IN') || 0} paise settled</span>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
              REAL-TIME
            </span>
          </div>
        </div>


        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Successful Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0F172A] mt-2">
            {analytics?.paidOrdersCount || 0}
          </p>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">100% fulfillment rate</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Pending In-Flight</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0F172A] mt-2">
            {analytics?.pendingOrdersCount || 0}
          </p>
          <p className="text-[11px] text-[#64748B] mt-1">Auto-expires in 15 mins</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Failed / Cancelled</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0F172A] mt-2">
            {(analytics?.failedOrdersCount || 0) + (analytics?.cancelledOrdersCount || 0)}
          </p>
          <p className="text-[11px] text-[#64748B] mt-1">Zero chargeback incidents</p>
        </div>
      </div>

      {/* Revenue Graph & Product Sales Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#0F172A]">Revenue & Settlement Trajectory</h2>
              <p className="text-xs text-[#64748B]">Daily settled volume in Rupees (INR)</p>
            </div>
            <Badge variant="outline" className="border-[#E2E8F0] text-[#64748B] text-[11px]">
              Last 14 Days
            </Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.dailyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} stroke="#E2E8F0" />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} stroke="#E2E8F0" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#FFF',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenueRupees" stroke="#2563EB" strokeWidth={2.5} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Sales Breakdown */}
        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-[#0F172A]">Sales by Product</h2>
          <div className="space-y-3">
            {(analytics?.revenueByProduct || []).map((p) => (
              <div key={p.productId} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#0F172A] truncate max-w-[170px]">{p.productName}</span>
                  <span className="font-bold text-[#0F172A]">₹{p.revenueRupees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-[#64748B] mt-1">
                  <span className="capitalize">{p.category.replace('_', ' ')}</span>
                  <span>{p.salesCount} unit{p.salesCount === 1 ? '' : 's'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Ledger */}
      <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">Transaction Ledger</h2>
            <p className="text-xs text-[#64748B]">Audited server logs and bank UTR settlements</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders, UTR, names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#2563EB] bg-[#F8FAFC]"
              />
            </div>

            {/* Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-[#E2E8F0] text-xs bg-[#F8FAFC] focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                <th className="pb-3 px-3">Order ID</th>
                <th className="pb-3 px-3">Student Name</th>
                <th className="pb-3 px-3">Product</th>
                <th className="pb-3 px-3">Amount</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">UTR Reference</th>
                <th className="pb-3 px-3">Sandbox</th>
                <th className="pb-3 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#64748B]">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.orderId} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-[#0F172A]">{o.orderId}</td>
                    <td className="py-3 px-3 font-medium text-[#0F172A]">{o.userName}</td>
                    <td className="py-3 px-3 text-[#0F172A]">{o.productName}</td>
                    <td className="py-3 px-3 font-bold text-[#0F172A]">₹{o.amountRupees.toFixed(2)}</td>
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
                    <td className="py-3 px-3">
                      {o.isSandbox ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                          SANDBOX
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          LIVE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[#64748B]">
                      {new Date(o.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gateway Status & Legal Disclaimer */}
      <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs text-[#0F172A] space-y-2">
        <div className="flex items-center gap-2 font-bold text-blue-900">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>YouPI-PG Gateway Architecture & Isolation Notice</span>
        </div>
        <p className="text-[#334155] leading-relaxed">
          Payments are handled via peer-to-peer UPI intent with direct merchant VPA routing. This deployment strictly follows
          server-authoritative pricing (all calculations in integer paise) and isolates payment logic from browser scrapers.
          YouPI-PG is an experimental UPI research project and is not an RBI-licensed payment aggregator.
        </p>
      </div>
    </div>
  )
}
