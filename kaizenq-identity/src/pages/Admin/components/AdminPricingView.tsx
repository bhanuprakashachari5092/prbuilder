import React, { useState, useEffect, useCallback } from 'react'
import {
  DollarSign,
  PackageCheck,
  CheckCircle2,
  RefreshCw,
  Search,
  Edit2,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button.tsx'
import {
  paymentService,
  type AdminProductRow,
} from '../../../services/paymentService.ts'

export const AdminPricingView: React.FC = () => {
  const [products, setProducts] = useState<AdminProductRow[]>(() =>
    paymentService.getDefaultPricingCatalog(),
  )
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Edit Price Modal
  const [editingProduct, setEditingProduct] = useState<AdminProductRow | null>(null)
  const [editPriceRupees, setEditPriceRupees] = useState<string>('')
  const [editReason, setEditReason] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const loadCatalog = useCallback(async () => {
    try {
      setLoading(true)
      const res = await paymentService.getAdminPricingCatalog()
      if (res.data && res.data.length > 0) {
        setProducts(res.data)
      } else {
        setProducts(paymentService.getDefaultPricingCatalog())
      }
    } catch (err) {
      console.warn('Error loading admin pricing catalog:', err)
      setProducts(paymentService.getDefaultPricingCatalog())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCatalog()

    const unsubscribe = paymentService.subscribeToRevenueUpdates(() => {
      loadCatalog()
    })

    return () => {
      unsubscribe()
    }
  }, [loadCatalog])

  const handleOpenEditModal = (p: AdminProductRow) => {
    setEditingProduct(p)
    setEditPriceRupees(((p.pricePaise || 0) / 100).toString())
    setEditReason('')
    setEditError(null)
  }

  const handleCloseEditModal = () => {
    setEditingProduct(null)
    setEditError(null)
  }

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    const parsedRupees = parseFloat(editPriceRupees)
    if (isNaN(parsedRupees) || parsedRupees < 0) {
      setEditError('Price must be a valid positive number.')
      return
    }

    const newPaise = Math.round(parsedRupees * 100)
    if (!editReason.trim()) {
      setEditError('An audit justification reason is required for security.')
      return
    }

    setIsUpdating(true)
    setEditError(null)

    const res = await paymentService.updateProductPrice(
      editingProduct.productId || editingProduct.id,
      newPaise,
      editReason.trim(),
    )

    if (res.error) {
      setEditError(res.error.message)
      setIsUpdating(false)
      return
    }

    setIsUpdating(false)
    setSuccessMsg(`Successfully updated price for ${editingProduct.title || editingProduct.name} to ₹${parsedRupees.toFixed(2)}.`)
    setTimeout(() => setSuccessMsg(null), 4000)
    handleCloseEditModal()
    loadCatalog()
  }

  const handleToggleStatus = async (p: AdminProductRow) => {
    const newStatus = !p.isActive
    const res = await paymentService.toggleProductStatus(p.productId || p.id, newStatus)
    if (res.error) {
      alert(`Failed to update product status: ${res.error.message}`)
      return
    }
    setSuccessMsg(`Product ${p.title || p.name} is now ${newStatus ? 'Active' : 'Disabled'}.`)
    setTimeout(() => setSuccessMsg(null), 3000)
    loadCatalog()
  }

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const titleStr = (p.title || p.name || '').toLowerCase()
    const idStr = (p.productId || p.id || '').toLowerCase()
    const keyStr = (p.entitlementKey || '').toLowerCase()
    const query = searchQuery.trim().toLowerCase()

    const matchesSearch =
      !query || titleStr.includes(query) || idStr.includes(query) || keyStr.includes(query)

    const catStr = (p.category || '').toLowerCase()
    const matchesCategory =
      categoryFilter === 'all' || catStr === categoryFilter.toLowerCase()

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && p.isActive) ||
      (statusFilter === 'inactive' && !p.isActive)

    return matchesSearch && matchesCategory && matchesStatus
  })

  // KPI calculations
  const totalProducts = products.length
  const activeProducts = products.filter((p) => p.isActive).length
  const totalVerifiedRevenuePaise = products.reduce((acc, p) => acc + (p.totalRevenuePaise || 0), 0)
  const totalSalesCount = products.reduce((acc, p) => acc + (p.salesCount || 0), 0)
  const allAccessProduct = products.find((p) => (p.productId || p.id) === 'pro-all-access-pass')

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Pricing & Product Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative catalog, integer paise pricing, bundle configurations, and audit logging.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const res = await paymentService.simulateRealtimePayment(999, 'PR Builder Pro All-Access Pass')
              setSuccessMsg(`⚡ Live Real-Time Sale Verified: +₹${res.amountRupees} for All-Access Pass! Counters updated.`)
              setTimeout(() => setSuccessMsg(null), 4000)
              loadCatalog()
            }}
            leftIcon={<Zap className="w-3.5 h-3.5 text-amber-500" />}
            className="text-xs border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 text-amber-900"
          >
            Simulate +₹999 Sale
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadCatalog}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            className="text-xs border-slate-200"
          >
            Refresh Catalog
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Catalog Products</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalProducts}</span>
            <span className="text-xs text-emerald-600 font-semibold">{activeProducts} Active</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Sales Fulfilled</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalSalesCount}</span>
            <span className="text-xs text-slate-500">Orders verified</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-700">Verified Revenue (Real-Time)</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ₹{(totalVerifiedRevenuePaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-medium">
              LIVE
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Lifetime Pass Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ₹{(((allAccessProduct?.totalRevenuePaise || 0)) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-amber-700 font-semibold">
              {allAccessProduct?.salesCount || 0} passes
            </span>
          </div>
        </div>
      </div>

      {/* Bundle Architecture & Savings Insight Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
              Configured Bundles & Savings Policy
            </span>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
              Authoritative
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
            <strong>PR Builder Pro All-Access Lifetime Pass</strong> (₹999 / 99900 paise) maps to{' '}
            <code className="text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-[11px]">
              bundle:all_access
            </code>
            , unlocking all 2 resume templates (₹398), 2 portfolio themes (₹598), and the custom domain pass (₹499)
            with a total component value of ₹1,495. Customer bundle discount is ₹496.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="p-2.5 rounded-xl bg-white border border-blue-200 text-right">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Bundle Savings</span>
            <span className="text-sm font-bold text-emerald-600">₹496.00</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, entitlements..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="resume_template">Resume Templates</option>
            <option value="portfolio_theme">Portfolio Themes</option>
            <option value="domain_pass">Domain Passes</option>
            <option value="bundle">Bundles</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Disabled Only</option>
          </select>
        </div>
      </div>

      {/* Products Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Product & Category</th>
                <th className="px-4 py-3.5 font-semibold">Catalog Price</th>
                <th className="px-4 py-3.5 font-semibold">Entitlement Key</th>
                <th className="px-4 py-3.5 font-semibold text-center">Verified Sales</th>
                <th className="px-4 py-3.5 font-semibold">Total Revenue</th>
                <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-xs">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading product catalog...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs space-y-2">
                    <p>No products found matching filters.</p>
                    {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('')
                          setCategoryFilter('all')
                          setStatusFilter('all')
                        }}
                        className="text-xs border-slate-200 mt-2"
                      >
                        Reset Filters
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const priceRupees = (((p.pricePaise || 0)) / 100).toFixed(2)
                  const revenueRupees = (((p.totalRevenuePaise || 0)) / 100).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })

                  return (
                    <tr key={p.productId || p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{p.title || p.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                          <span>{p.productId || p.id}</span>
                          <span>•</span>
                          <span className="capitalize">{(p.category || 'product').replace('_', ' ')}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900 font-mono text-sm">
                          ₹{priceRupees}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {p.pricePaise} paise
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[11px] font-semibold">
                          {p.entitlementKey}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-slate-800">{p.salesCount}</span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-semibold text-emerald-700 font-mono">
                          ₹{revenueRupees}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                            p.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          }`}
                          title="Click to toggle status"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {p.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(p)}
                          leftIcon={<Edit2 className="w-3 h-3 text-blue-600" />}
                          className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                          Edit Price
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Draft Proposed Products (Admin Review & Approval) */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">
              Draft Proposed Add-on Products (Review &amp; Approval)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Enforces Zero Charge until Formally Approved by Admin
          </span>
        </div>

        <p className="text-xs text-slate-600">
          Proposed customization add-ons remain strictly unconfigured in the customer checkout engine until an authorized administrator reviews and approves them into the live database catalog.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Draft 1 */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2">
            <div className="space-y-1">
              <div className="flex items-start justify-between">
                <span className="font-bold text-slate-800">Custom Font Upload</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  Proposed ₹49
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Support user-uploaded .woff2 / .ttf font assets for custom resume branding.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-mono text-[10px]">draft-custom-fonts</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleOpenEditModal({
                    id: 'draft-custom-fonts',
                    productId: 'draft-custom-fonts',
                    name: 'Custom Font File Upload',
                    title: 'Custom Font File Upload (.woff2 / .ttf)',
                    description: 'Upload custom brand typography fonts',
                    category: 'resume_addon',
                    targetId: 'custom-fonts',
                    pricePaise: 4900,
                    priceRupees: 49,
                    currency: 'INR',
                    isActive: false,
                    salesCount: 0,
                    totalRevenuePaise: 0,
                    totalRevenueRupees: 0,
                    entitlementKey: 'addon:custom_fonts',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  })
                }}
                className="text-xs py-1 px-2.5 h-6 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                Configure &amp; Approve
              </Button>
            </div>
          </div>

          {/* Draft 2 */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2">
            <div className="space-y-1">
              <div className="flex items-start justify-between">
                <span className="font-bold text-slate-800">Custom CSS Stylesheet</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  Proposed ₹99
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Advanced stylesheet override editor for portfolio power users.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-mono text-[10px]">draft-custom-css</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleOpenEditModal({
                    id: 'draft-custom-css',
                    productId: 'draft-custom-css',
                    name: 'Custom CSS Stylesheet Injection',
                    title: 'Custom CSS Stylesheet Injection',
                    description: 'Custom CSS override stylesheet editor',
                    category: 'portfolio_addon',
                    targetId: 'custom-css',
                    pricePaise: 9900,
                    priceRupees: 99,
                    currency: 'INR',
                    isActive: false,
                    salesCount: 0,
                    totalRevenuePaise: 0,
                    totalRevenueRupees: 0,
                    entitlementKey: 'addon:custom_css',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  })
                }}
                className="text-xs py-1 px-2.5 h-6 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                Configure &amp; Approve
              </Button>
            </div>
          </div>

          {/* Draft 3 */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2">
            <div className="space-y-1">
              <div className="flex items-start justify-between">
                <span className="font-bold text-slate-800">Priority Recruiter Review</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  Proposed ₹149
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Human recruiter review and ATS checklist feedback within 24 hours.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-mono text-[10px]">draft-recruiter-review</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleOpenEditModal({
                    id: 'draft-recruiter-review',
                    productId: 'draft-recruiter-review',
                    name: 'Priority Recruiter Review Pass',
                    title: 'Priority Recruiter Review Pass',
                    description: 'Human recruiter review within 24 hours',
                    category: 'service',
                    targetId: 'recruiter-review',
                    pricePaise: 14900,
                    priceRupees: 149,
                    currency: 'INR',
                    isActive: false,
                    salesCount: 0,
                    totalRevenuePaise: 0,
                    totalRevenueRupees: 0,
                    entitlementKey: 'service:recruiter_review',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  })
                }}
                className="text-xs py-1 px-2.5 h-6 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                Configure &amp; Approve
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Free Tier Guarantee Card */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Protected Free Tiers (Hard-Coded Invariants)
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
              Always-Free Resume Templates
            </span>
            <p className="font-mono text-[11px] text-blue-600">
              classic-ats, minimal, classic, modern
            </p>
            <p className="text-[11px] text-slate-500">
              Full ATS formatting, drag-and-drop sections, cloud draft sync, and browser print/export remain completely free.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
              Always-Free Portfolio Themes
            </span>
            <p className="font-mono text-[11px] text-blue-600">
              developer, minimal, midnight
            </p>
            <p className="text-[11px] text-slate-500">
              Unlimited project showcases, work experience, skill matrices, and instant hosting on kaizenq.me remain free.
            </p>
          </div>
        </div>
      </div>

      {/* Edit Price Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Update Catalog Price</h3>
                <p className="text-xs text-slate-500">{editingProduct.title}</p>
              </div>
              <button
                onClick={handleCloseEditModal}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrice} className="p-6 space-y-4 text-xs">
              {editError && (
                <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  New Price in INR (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={editPriceRupees}
                    onChange={(e) => setEditPriceRupees(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Stored as {Math.round((parseFloat(editPriceRupees) || 0) * 100)} integer paise in database.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Audit Justification Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g. Approved promotional pricing update for Q4 tech hiring season"
                  rows={3}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400">
                  Logged permanently to <code>payment_audit_logs</code>. Existing orders retain their agreed historical price.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseEditModal}
                  className="border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                >
                  {isUpdating ? 'Saving...' : 'Confirm & Save Price'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPricingView
