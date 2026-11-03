import React from 'react'
import {
  Globe,
  CheckCircle2,
  ShieldCheck,
  Server,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react'
import { Button } from '../ui/Button.tsx'
import { Badge } from '../ui/Badge.tsx'
import { formatINR } from '../../hooks/usePricingCatalog.ts'

export interface CustomDomainPricingCardProps {
  priceRupees: number
  isOwned: boolean
  onUnlock: () => void
  onNavigateToDomainManager?: () => void
  className?: string
}

export const CustomDomainPricingCard: React.FC<CustomDomainPricingCardProps> = ({
  priceRupees,
  isOwned,
  onUnlock,
  onNavigateToDomainManager,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow text-[#111827] space-y-5 ${className}`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-[#0F172A]">Instant Custom Domain Pass</h4>
              <Badge variant="accent" size="sm">
                CATALOG • {formatINR(priceRupees)}
              </Badge>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Connect your personal domain (e.g. yourname.dev) to your portfolio with automated SSL.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwned ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Unlocked & Active</span>
            </div>
          ) : (
            <div className="text-right">
              <div className="text-xs text-[#64748B]">Catalog Price</div>
              <div className="text-xl font-bold text-[#0F172A]">{formatINR(priceRupees)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Two-Column Explanation: Connection vs Registration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Panel 1: What PR Builder Provides (Custom Domain Connection) */}
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-[#0F172A]">
            <Server className="w-4 h-4 text-[#2563EB]" />
            <span>1. Custom Domain Connection (Included for {formatINR(priceRupees)})</span>
          </div>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            PR Builder manages the edge server routing, DNS verification, and SSL certificates so your portfolio is always fast and secure.
          </p>
          <ul className="space-y-1.5 text-[#334155] text-[11px]">
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Instant DNS CNAME & A-record edge routing to PR Builder</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Automated Let's Encrypt TLS/SSL certificates with auto-renewal</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Zero wait — no hackathon sponsorship or voucher approval required</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Live DNS verification and propagation status diagnostics</span>
            </li>
          </ul>
        </div>

        {/* Panel 2: What You Own (Domain Registration) */}
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-[#0F172A]">
            <Globe className="w-4 h-4 text-purple-600" />
            <span>2. Domain Name Registration (Third-Party Registrar)</span>
          </div>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            You retain 100% legal ownership of your domain name by purchasing it directly through any ICANN-accredited domain registrar.
          </p>
          <ul className="space-y-1.5 text-[#334155] text-[11px]">
            <li className="flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
              <span>Purchase your domain (e.g. from Cloudflare, Namecheap, or GoDaddy)</span>
            </li>
            <li className="flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
              <span>You pay the standard registrar registry fee directly to the registrar</span>
            </li>
            <li className="flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
              <span>PR Builder connects the domain via DNS; we never take custody or custody fees</span>
            </li>
            <li className="flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
              <span>You can point your domain anywhere else at any time</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-[#F1F5F9]">
        <div className="text-[11px] text-[#64748B]">
          18% GST Included in MRP • Authoritative server integer paise calculation
        </div>

        <div className="flex items-center gap-2">
          {isOwned ? (
            onNavigateToDomainManager && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToDomainManager}
                className="text-xs text-[#2563EB] border-[#BFDBFE] hover:bg-[#EFF6FF]"
              >
                <span>Manage Connected Domains</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </Button>
            )
          ) : (
            <Button
              variant="glow"
              size="sm"
              onClick={onUnlock}
              className="text-xs flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Get Custom Domain Pass for {formatINR(priceRupees)}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
