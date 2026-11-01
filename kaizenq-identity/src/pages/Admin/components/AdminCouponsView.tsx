import React, { useState, useEffect } from 'react'
import {
  Tag,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  Edit2,
  Copy,
  Check,
  Percent,
  DollarSign,
  Users,
  Eye,
  X,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button.tsx'
import { Badge } from '../../../components/ui/Badge.tsx'
import {
  couponService,
  type CouponRow,
  type AdminCouponFormData,
} from '../../../services/couponService.ts'
import { paymentService, type PaymentProduct } from '../../../services/paymentService.ts'

export const AdminCouponsView: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponRow[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState<boolean>(false)

  // Products catalog for eligibility selection
  const [products, setProducts] = useState<PaymentProduct[]>([])

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)
  const [isRedemptionsModalOpen, setIsRedemptionsModalOpen] = useState<boolean>(false)
  const [selectedCouponForRedemptions, setSelectedCouponForRedemptions] = useState<CouponRow | null>(
    null,
  )
  const [redemptionsList, setRedemptionsList] = useState<
    Array<{
      id: string
      couponId: string
      couponCode: string
      orderId: string
      userId: string
      userName: string
      userEmail: string
      originalAmountPaise: number
      discountAmountPaise: number
      finalAmountPaise: number
      status: 'reserved' | 'fulfilled' | 'cancelled'
      createdAt: string
      fulfilledAt: string | null
    }>
  >([])
  const [isRedemptionsLoading, setIsRedemptionsLoading] = useState<boolean>(false)

  // Form State
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [formData, setFormData] = useState<AdminCouponFormData>({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmountRupees: 0,
    maxTotalRedemptions: null,
    maxRedemptionsPerUser: 1,
    eligibleProductIds: null,
    eligibleUserGroups: null,
    firstPurchaseOnly: false,
    startDate: null,
    expiryDate: null,
    isActive: true,
  })

  // Load coupons and products
  const loadCoupons = async () => {
    setLoading(true)
    const [coupRes, prodRes] = await Promise.all([
      couponService.getAdminCoupons({ search: searchQuery, statusFilter, typeFilter }),
      paymentService.getProducts(),
    ])

    if (coupRes.data) {
      setCoupons(coupRes.data)
    }
    if (prodRes.data) {
      setProducts(prodRes.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCoupons()
  }, [statusFilter, typeFilter])

  // Copy code handler
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Toggle active status
  const handleToggleActive = async (coupon: CouponRow) => {
    const nextStatus = !coupon.is_active
    const res = await couponService.toggleCouponActive(coupon.id, nextStatus)
    if (res.success) {
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, is_active: nextStatus } : c)),
      )
    }
  }

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormError(null)
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 20,
      minOrderAmountRupees: 0,
      maxTotalRedemptions: 100,
      maxRedemptionsPerUser: 1,
      eligibleProductIds: null,
      eligibleUserGroups: null,
      firstPurchaseOnly: false,
      startDate: null,
      expiryDate: null,
      isActive: true,
    })
    setIsEditModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEditModal = (coupon: CouponRow) => {
    setFormError(null)
    setFormData({
      id: coupon.id,
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discount_type,
      discountValue:
        coupon.discount_type === 'fixed'
          ? Math.round(coupon.discount_value / 100)
          : coupon.discount_value,
      minOrderAmountRupees: Math.round(coupon.min_order_amount_paise / 100),
      maxTotalRedemptions: coupon.max_redemptions_total,
      maxRedemptionsPerUser: coupon.max_redemptions_per_user || 1,
      eligibleProductIds: coupon.eligible_product_ids,
      eligibleUserGroups: coupon.eligible_user_groups,
      firstPurchaseOnly: coupon.first_purchase_only,
      startDate: coupon.start_date ? coupon.start_date.slice(0, 16) : null,
      expiryDate: coupon.expiry_date ? coupon.expiry_date.slice(0, 16) : null,
      isActive: coupon.is_active,
    })
    setIsEditModalOpen(true)
  }

  // Save Coupon Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.code.trim()) {
      setFormError('Coupon code is required.')
      return
    }

    if (formData.discountValue <= 0) {
      setFormError('Discount value must be greater than 0.')
      return
    }

    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      setFormError('Percentage discount cannot exceed 100%.')
      return
    }

    setIsSubmitting(true)
    const res = await couponService.createOrUpdateCoupon(formData)
    setIsSubmitting(false)

    if (res.error) {
      setFormError(res.error.message || 'Failed to save coupon.')
      return
    }

    setIsEditModalOpen(false)
    loadCoupons()
  }

  // Open Redemptions Audit Modal
  const handleOpenRedemptionsModal = async (coupon?: CouponRow) => {
    setSelectedCouponForRedemptions(coupon || null)
    setIsRedemptionsModalOpen(true)
    setIsRedemptionsLoading(true)

    const res = await couponService.getAdminRedemptions({
      couponId: coupon?.id,
      pageSize: 100,
    })

    if (res.data) {
      setRedemptionsList(res.data)
    }
    setIsRedemptionsLoading(false)
  }

  // Export Redemptions CSV
  const handleExportCsv = async () => {
    setIsExporting(true)
    try {
      const csv = await couponService.exportRedemptionsCsv(selectedCouponForRedemptions?.id)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `coupon_redemptions_${
        selectedCouponForRedemptions?.code || 'all'
      }_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  // Filtered coupons
  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = typeFilter === 'all' || c.discount_type === typeFilter

    return matchesSearch && matchesType
  })

  // KPI calculations
  const totalCoupons = coupons.length
  const activeCoupons = coupons.filter((c) => c.is_active).length
  const totalRedemptions = coupons.reduce((acc, c) => acc + (c.redemptions_count || 0), 0)

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A]">Coupons & Promotions</h1>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-xs">
              SaaS Discount Engine
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Authoritative coupon lifecycle, campaign eligibility, limits, and redemption telemetry
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCoupons}
            className="border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenRedemptionsModal()}
            className="border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
            Audit Redemptions
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateModal}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Coupon
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Total Coupons</span>
            <Tag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#0F172A]">{totalCoupons}</span>
            <span className="text-xs text-[#64748B]">campaigns</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Active Coupons</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{activeCoupons}</span>
            <span className="text-xs text-[#64748B]">enabled</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Total Redemptions</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-900">{totalRedemptions}</span>
            <span className="text-xs text-[#64748B]">orders</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Security Model</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-xs font-bold text-emerald-700 block">Server-Verified RLS</span>
            <span className="text-[11px] text-[#64748B]">Anti-tamper & rate limited</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search coupon code or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-[#64748B] ml-2">
            <span>Type:</span>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed (₹)</option>
          </select>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold">
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Redemptions / Cap</th>
                <th className="py-3 px-4">Eligibility / Min Spend</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#2563EB] mb-2" />
                    Loading coupons...
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    No coupons match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => {
                  const isExpired =
                    coupon.expiry_date && new Date(coupon.expiry_date).getTime() < Date.now()

                  return (
                    <tr key={coupon.id} className="hover:bg-[#F8FAFC] transition-colors">
                      {/* Code & Description */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#0F172A] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-200">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="p-1 text-[#94A3B8] hover:text-[#0F172A] rounded-md transition-colors cursor-pointer"
                            title="Copy code"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {coupon.description && (
                          <p className="text-[11px] text-[#64748B] mt-0.5 max-w-xs truncate">
                            {coupon.description}
                          </p>
                        )}
                      </td>

                      {/* Discount Type & Value */}
                      <td className="py-3 px-4">
                        {coupon.discount_type === 'percentage' ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-50 text-emerald-700 font-bold"
                          >
                            {coupon.discount_value}% OFF
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-indigo-200 bg-indigo-50 text-indigo-700 font-bold"
                          >
                            ₹{(coupon.discount_value / 100).toFixed(2)} OFF
                          </Badge>
                        )}
                        {coupon.first_purchase_only && (
                          <span className="block text-[10px] text-amber-700 font-medium mt-1">
                            1st Purchase Only
                          </span>
                        )}
                      </td>

                      {/* Redemptions / Cap */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0F172A]">
                          {coupon.redemptions_count || 0}
                          <span className="text-[#64748B] font-normal">
                            {' '}
                            / {coupon.max_redemptions_total ? coupon.max_redemptions_total : '∞'}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#64748B]">
                          Max {coupon.max_redemptions_per_user || 1}/user
                        </span>
                      </td>

                      {/* Eligibility & Min Spend */}
                      <td className="py-3 px-4">
                        <div className="text-[11px] text-[#0F172A] font-medium">
                          {coupon.eligible_product_ids && coupon.eligible_product_ids.length > 0
                            ? `${coupon.eligible_product_ids.length} specific product(s)`
                            : 'All Store Products'}
                        </div>
                        {coupon.min_order_amount_paise > 0 ? (
                          <span className="text-[10px] text-[#64748B]">
                            Min spend: ₹{(coupon.min_order_amount_paise / 100).toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#64748B]">No minimum</span>
                        )}
                      </td>

                      {/* Expiry */}
                      <td className="py-3 px-4">
                        {coupon.expiry_date ? (
                          <div>
                            <span
                              className={`text-[11px] font-medium ${
                                isExpired ? 'text-rose-600 line-through' : 'text-[#0F172A]'
                              }`}
                            >
                              {new Date(coupon.expiry_date).toLocaleDateString()}
                            </span>
                            {isExpired && (
                              <span className="block text-[10px] text-rose-600 font-bold">
                                Expired
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#64748B]">Never expires</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(coupon)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                            coupon.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              coupon.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {coupon.is_active ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenRedemptionsModal(coupon)}
                          className="p-1.5 text-[#64748B] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="View Redemptions"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(coupon)}
                          className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Coupon"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Coupon Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-[#0F172A] text-base">
                  {formData.id ? 'Edit Coupon' : 'Create New Coupon'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Code & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WELCOME20"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 font-mono uppercase bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">
                    Campaign Note / Purpose
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Winter Hackathon 2026"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Discount Type and Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Discount Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, discountType: 'percentage' })}
                      className={`flex-1 py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        formData.discountType === 'percentage'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Percent className="w-3.5 h-3.5" />
                      Percentage (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, discountType: 'fixed' })}
                      className={`flex-1 py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        formData.discountType === 'fixed'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Fixed (₹)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">
                    {formData.discountType === 'percentage'
                      ? 'Discount Percentage (1 - 100%)'
                      : 'Fixed Amount in ₹ (Rupees)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={formData.discountType === 'percentage' ? 100 : 100000}
                    step={formData.discountType === 'percentage' ? 1 : 0.01}
                    required
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({ ...formData, discountValue: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {formData.discountType === 'percentage' && formData.discountValue === 100 && (
                    <span className="block text-[11px] text-emerald-700 font-semibold mt-1">
                      ★ 100% discount enables atomic free-order claim (zero UPI friction)
                    </span>
                  )}
                </div>
              </div>

              {/* Limits and Minimum Spend */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">
                    Max Total Redemptions
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Unlimited"
                    value={formData.maxTotalRedemptions ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxTotalRedemptions: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Max Per User</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxRedemptionsPerUser ?? 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxRedemptionsPerUser: Number(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">
                    Min Spend in ₹ (Paise)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0 = No minimum"
                    value={formData.minOrderAmountRupees ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minOrderAmountRupees: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Eligible Products */}
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">
                  Product Restrictions
                </label>
                <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl space-y-2 max-h-36 overflow-y-auto">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                    <input
                      type="checkbox"
                      id="all_products"
                      checked={!formData.eligibleProductIds || formData.eligibleProductIds.length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, eligibleProductIds: null })
                        }
                      }}
                      className="rounded text-blue-600"
                    />
                    <label htmlFor="all_products" className="font-semibold text-slate-800">
                      All Store Products (Universal)
                    </label>
                  </div>
                  {products.map((p) => {
                    const isSelected =
                      formData.eligibleProductIds && formData.eligibleProductIds.includes(p.id)
                    return (
                      <div key={p.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`prod_${p.id}`}
                          checked={!!isSelected}
                          onChange={(e) => {
                            let current = formData.eligibleProductIds ? [...formData.eligibleProductIds] : []
                            if (e.target.checked) {
                              current.push(p.id)
                            } else {
                              current = current.filter((id) => id !== p.id)
                            }
                            setFormData({
                              ...formData,
                              eligibleProductIds: current.length > 0 ? current : null,
                            })
                          }}
                          className="rounded text-blue-600"
                        />
                        <label htmlFor={`prod_${p.id}`} className="text-slate-700">
                          {p.name} (₹{(p.price_paise / 100).toFixed(0)})
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Validity Timestamps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">
                    Starts At (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value ? new Date(e.target.value).toISOString() : null })
                    }
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">
                    Expires At (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expiryDate || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value ? new Date(e.target.value).toISOString() : null })
                    }
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Checkboxes: First purchase only & Active */}
              <div className="flex flex-col sm:flex-row gap-4 pt-1">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.firstPurchaseOnly}
                    onChange={(e) =>
                      setFormData({ ...formData, firstPurchaseOnly: e.target.checked })
                    }
                    className="rounded text-blue-600"
                  />
                  <span>First Purchase Only (New Customers)</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Immediately Active</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E2E8F0]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="border-[#CBD5E1] text-[#0F172A]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    'Save Coupon'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Redemptions Audit Modal */}
      {isRedemptionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-[#0F172A] text-base">
                    Redemption Audit Ledger{' '}
                    {selectedCouponForRedemptions ? `(${selectedCouponForRedemptions.code})` : ''}
                  </h3>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Immutable transactional record of every reservation and fulfillment
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCsv}
                  disabled={isExporting || redemptionsList.length === 0}
                  className="border-[#CBD5E1] text-xs font-semibold"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                  {isExporting ? 'Exporting...' : 'Export CSV'}
                </Button>
                <button
                  onClick={() => setIsRedemptionsModalOpen(false)}
                  className="p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto">
              <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold">
                      <th className="py-2.5 px-3">Order Ref</th>
                      <th className="py-2.5 px-3">Coupon</th>
                      <th className="py-2.5 px-3">User</th>
                      <th className="py-2.5 px-3">Original</th>
                      <th className="py-2.5 px-3">Discount</th>
                      <th className="py-2.5 px-3">Final Settled</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {isRedemptionsLoading ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-[#64748B]">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                          Loading redemption ledger...
                        </td>
                      </tr>
                    ) : redemptionsList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-[#64748B]">
                          No redemptions recorded for this selection yet.
                        </td>
                      </tr>
                    ) : (
                      redemptionsList.map((r) => (
                        <tr key={r.id} className="hover:bg-[#F8FAFC]">
                          <td className="py-2.5 px-3 font-mono text-slate-800 font-medium">
                            {r.orderId}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                            {r.couponCode}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            <div>{r.userName}</div>
                            <span className="text-[10px] text-slate-400">{r.userEmail}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            ₹{(r.originalAmountPaise / 100).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-emerald-600">
                            -₹{(r.discountAmountPaise / 100).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            ₹{(r.finalAmountPaise / 100).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                r.status === 'fulfilled'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : r.status === 'reserved'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                            {new Date(r.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
