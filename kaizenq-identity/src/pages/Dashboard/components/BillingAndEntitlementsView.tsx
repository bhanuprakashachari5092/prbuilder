import React, { useState, useEffect } from 'react'
import {
  CheckCircle2,
  CreditCard,
  Lock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button.tsx'
import { Badge } from '../../../components/ui/Badge.tsx'
import { useAuth } from '../../../app/providers/AuthContext.tsx'
import { useEntitlements } from '../../../hooks/useEntitlements.ts'
import { usePricingCatalog } from '../../../hooks/usePricingCatalog.ts'
import { paymentService, type PaymentOrderRow } from '../../../services/paymentService.ts'

export interface BillingAndEntitlementsViewProps {
  onOpenCheckout?: (params: {
    productId: string
    productTitle: string
    pricePaise: number
  }) => void
}

export const BillingAndEntitlementsView: React.FC<BillingAndEntitlementsViewProps> = ({
  onOpenCheckout,
}) => {
  const { user } = useAuth()
  const {
    hasAllAccessPass,
    hasDomainPass,
    isTemplateUnlocked,
    isThemeUnlocked,
    refreshEntitlements,
  } = useEntitlements()
  const { getProPassPrice, getDomainPassPrice, getTemplatePrice, getThemePrice } = usePricingCatalog()

  const [orders, setOrders] = useState<PaymentOrderRow[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true)

  const loadHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const res = await paymentService.getUserPaymentHistory()
      if (res.data?.orders) {
        setOrders(res.data.orders)
      }
    } catch (err) {
      console.warn('Failed to fetch payment history:', err)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [user?.id])

  const proPass = getProPassPrice()
  const domainPass = getDomainPassPrice()
  const techTemplate = getTemplatePrice('technical')
  const creativeTheme = getThemePrice('creative')

  return (
    <div className="space-y-8 animate-fadeIn text-[#111827]">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-[#111827]">
              Pricing &amp; Purchased Entitlements
            </h2>
            <Badge variant={hasAllAccessPass ? 'success' : 'default'} size="sm">
              {hasAllAccessPass ? 'Pro All-Access Active' : 'Free Tier'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 max-w-xl leading-relaxed">
            Review your active feature entitlements, platform passes, and verified UPI transaction history.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refreshEntitlements()
            loadHistory()
          }}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="border-[#E2E8F0] text-[#111827] hover:bg-[#F8FAFC]"
        >
          Sync Entitlements
        </Button>
      </div>

      {/* Active Passes Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pass 1: Pro All-Access Pass */}
        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Platform Pass
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  hasAllAccessPass
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {hasAllAccessPass ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active Lifetime
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 text-slate-400" /> Available for {proPass.formatted}
                  </>
                )}
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#111827]">
              PR Builder Pro All-Access Lifetime Pass
            </h3>
            <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
              Unlocks all current and future ATS resume templates, interactive portfolio themes, and custom domain edge routing for life.
            </p>

            <div className="mt-4 space-y-2 text-xs text-[#111827]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All Pro Resume Templates (Technical, Modern Professional)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All Pro Portfolio Themes (Creative, Modern)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Lifetime Custom Domain Routing (.com, .in, .xyz)</span>
              </div>
            </div>
          </div>

          {!hasAllAccessPass && onOpenCheckout && (
            <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
              <Button
                variant="primary"
                fullWidth
                size="md"
                onClick={() =>
                  onOpenCheckout({
                    productId: 'pro-all-access-pass',
                    productTitle: 'PR Builder Pro All-Access Lifetime Pass',
                    pricePaise: proPass.paise,
                  })
                }
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
              >
                Unlock Pro Lifetime Pass for {proPass.formatted}
              </Button>
            </div>
          )}
        </div>

        {/* Pass 2: Custom Domain Pass */}
        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Infrastructure Pass
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  hasDomainPass || hasAllAccessPass
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {hasDomainPass || hasAllAccessPass ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 text-slate-400" /> Available for {domainPass.formatted}
                  </>
                )}
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#111827]">
              Custom Domain Connection Pass
            </h3>
            <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
              Connect your own purchased domain (e.g. yourname.com, alex.xyz) with automated SSL certificate provisioning and global edge CDN routing.
            </p>

            <div className="mt-4 space-y-2 text-xs text-[#111827]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant DNS CNAME &amp; A-record verification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Automatic Let's Encrypt SSL HTTPS encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero recurring hosting charges</span>
              </div>
            </div>
          </div>

          {!hasDomainPass && !hasAllAccessPass && onOpenCheckout && (
            <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
              <Button
                variant="outline"
                fullWidth
                size="md"
                onClick={() =>
                  onOpenCheckout({
                    productId: 'custom-domain-pass',
                    productTitle: 'Custom Domain Pass',
                    pricePaise: domainPass.paise,
                  })
                }
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="border-[#E2E8F0] text-[#111827] hover:bg-[#F8FAFC] font-semibold text-xs"
              >
                Get Domain Pass for {domainPass.formatted}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Feature Entitlements Breakdown */}
      <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#111827]">Feature Access Matrix</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] font-mono uppercase text-[#64748B]">Resume Templates</span>
            <div className="font-bold text-[#111827] mt-1">Classic &amp; Minimal (Free)</div>
            <div className="text-emerald-600 font-semibold mt-1">Guaranteed Free</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] font-mono uppercase text-[#64748B]">Pro Templates</span>
            <div className="font-bold text-[#111827] mt-1">Technical &amp; Modern</div>
            <div className={isTemplateUnlocked('technical') ? 'text-emerald-600 font-semibold mt-1' : 'text-[#64748B] mt-1'}>
              {isTemplateUnlocked('technical') ? 'Unlocked' : `Requires Pass (${techTemplate.formatted})`}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] font-mono uppercase text-[#64748B]">Portfolio Themes</span>
            <div className="font-bold text-[#111827] mt-1">Developer &amp; Midnight</div>
            <div className="text-emerald-600 font-semibold mt-1">Guaranteed Free</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] font-mono uppercase text-[#64748B]">Pro Themes</span>
            <div className="font-bold text-[#111827] mt-1">Creative &amp; Modern Pro</div>
            <div className={isThemeUnlocked('creative') ? 'text-emerald-600 font-semibold mt-1' : 'text-[#64748B] mt-1'}>
              {isThemeUnlocked('creative') ? 'Unlocked' : `Requires Pass (${creativeTheme.formatted})`}
            </div>
          </div>
        </div>
      </div>

      {/* Payment History Section */}
      <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#111827]">Verified Payment History</h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Official records of settled UPI orders and applied entitlements.
            </p>
          </div>
          <span className="text-xs text-[#64748B] font-mono">
            {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
          </span>
        </div>

        {isLoadingHistory ? (
          <div className="py-8 text-center text-xs text-[#64748B]">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading transaction history...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-8 text-center rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <CreditCard className="w-8 h-8 text-[#94A3B8] mx-auto" />
            <p className="text-xs sm:text-sm font-semibold text-[#111827]">
              No payment transactions found
            </p>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              You are currently utilizing PR Builder's free tier. All standard resume templates and portfolio themes are 100% free.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-[#64748B]">
                      {o.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-3 font-medium text-[#111827]">
                      {(o as unknown as { productName?: string }).productName || o.product_id}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#111827]">
                      ₹{(o.amount_paise / 100).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-[#64748B]">
                      {new Date(o.created_at).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          o.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : o.status === 'cancelled'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {o.status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                        {(o.status || 'pending').toUpperCase()}
                      </span>
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
