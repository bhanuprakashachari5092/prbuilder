import React, { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  ShieldCheck,
  Plus,
  Globe,
  Check,
  Sparkles,
  Send,
  XCircle,
  Lock,
  Trophy,
  Award,
  ExternalLink,
  RefreshCw,
  Trash2,
  Info,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button.tsx'
import { CheckoutModal } from '../../../components/payment/CheckoutModal.tsx'
import { useAuth } from '../../../app/providers/AuthContext.tsx'
import { useEntitlements } from '../../../hooks/useEntitlements.ts'
import { usePricingCatalog } from '../../../hooks/usePricingCatalog.ts'
import {
  domainService,
  type DomainRow,
  type DnsRecordInstruction,
  type DnsCheckResult,
} from '../../../services/domainService.ts'
import { portfolioService } from '../../../services/portfolioService.ts'
import {
  domainClaimService,
  type DomainClaimRow,
  type SponsorshipEligibilityResult,
} from '../../../services/domainClaimService.ts'
import type { DemoStudentData } from '../types.ts'

export interface DomainViewProps {
  student?: DemoStudentData
}

export const DomainView: React.FC<DomainViewProps> = ({ student: _student }) => {
  const { user, isConfigured } = useAuth()
  const { isCustomDomainUnlocked, hasAllAccessPass, refreshEntitlements } = useEntitlements()
  const catalog = usePricingCatalog()
  const domainPassPrice = catalog.getDomainPassPrice()
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  // Custom domain state
  const [domains, setDomains] = useState<DomainRow[]>([])
  const [loadingDomains, setLoadingDomains] = useState<boolean>(false)
  const [newHostname, setNewHostname] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [verifyingDomainId, setVerifyingDomainId] = useState<string | null>(null)
  const [disconnectingDomainId, setDisconnectingDomainId] = useState<string | null>(null)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Live DNS Diagnostics State
  const [liveDnsResult, setLiveDnsResult] = useState<Record<string, DnsCheckResult>>({})
  const [checkingDnsId, setCheckingDnsId] = useState<string | null>(null)

  // Runner/Winner Sponsorship Eligibility & Claim state
  const [eligibility, setEligibility] = useState<SponsorshipEligibilityResult | null>(null)
  const [loadingEligibility, setLoadingEligibility] = useState<boolean>(true)
  const [myClaim, setMyClaim] = useState<DomainClaimRow | null>(null)
  const [claimHandle, setClaimHandle] = useState<string>('')
  const [submittingClaim, setSubmittingClaim] = useState<boolean>(false)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null)
  const [showReapply, setShowReapply] = useState<boolean>(false)
  const [verifyingDns, setVerifyingDns] = useState<boolean>(false)

  // Fetch domains for current student
  const loadDomains = useCallback(async (userId: string) => {
    setLoadingDomains(true)
    try {
      const { data } = await domainService.getUserDomains(userId)
      if (data) setDomains(data)
    } catch (err) {
      console.warn('Failed to fetch domain records:', err)
    } finally {
      setLoadingDomains(false)
    }
  }, [])

  // Check student's Runner/Winner eligibility and existing claim
  const loadEligibilityAndClaim = useCallback(async () => {
    if (!user?.id || !isConfigured) {
      setLoadingEligibility(false)
      return
    }

    setLoadingEligibility(true)
    try {
      const [eligibilityRes, claimRes] = await Promise.all([
        domainClaimService.checkEligibility(),
        domainClaimService.getMyClaim(),
      ])

      setEligibility(eligibilityRes.data)
      setMyClaim(claimRes.data)
    } catch (err) {
      console.warn('Eligibility retrieval error:', err)
    } finally {
      setLoadingEligibility(false)
    }
  }, [user?.id, isConfigured])

  useEffect(() => {
    if (user?.id && isConfigured) {
      loadDomains(user.id)
      loadEligibilityAndClaim()
    }
  }, [user?.id, isConfigured, loadDomains, loadEligibilityAndClaim])

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Connect own domain handler
  const handleConnectDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!user?.id || !isConfigured) {
      setErrorMsg('You must be signed in to connect a custom domain.')
      return
    }

    // Entitlement Check: requires Custom Domain Pass or All-Access Pass
    const hasEntitlement = isCustomDomainUnlocked() || hasAllAccessPass
    if (!hasEntitlement) {
      setErrorMsg('Custom Domain Pass required. Please unlock the Custom Domain Pass below to proceed.')
      setIsCheckoutOpen(true)
      return
    }

    setSubmitting(true)

    try {
      const { data: userPortfolio } = await portfolioService.getUserPortfolio(user.id)
      const portfolioId = userPortfolio?.id

      if (!portfolioId) {
        throw new Error('Please open the Portfolio Builder and save a draft portfolio first before connecting your domain.')
      }

      const res = await domainService.connectCustomDomain(portfolioId, newHostname)

      if (!res.success || !res.domain) {
        if (res.requiresEntitlement) {
          setIsCheckoutOpen(true)
        }
        throw new Error(res.error || 'Failed to connect custom domain.')
      }

      setSuccessMsg(`Domain "${res.domain.hostname}" successfully registered! Please configure the required DNS records below and click "Verify Again".`)
      setNewHostname('')
      await loadDomains(user.id)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Registration failed.')
    } finally {
      setSubmitting(false)
    }
  }

  // Verify domain handler
  const handleVerifyDomain = async (domainId: string, hostname: string, token: string | null) => {
    setVerifyingDomainId(domainId)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      // Optional: run live DoH diagnostics first
      if (token) {
        const liveRes = await domainService.checkLiveDnsOverHttps(hostname, token)
        setLiveDnsResult((prev) => ({ ...prev, [domainId]: liveRes }))
      }

      // Execute server-authoritative verification RPC
      const res = await domainService.verifyCustomDomain(domainId, false)
      if (!res.success) {
        throw new Error(res.error || 'DNS records have not propagated yet. Please check back in a few minutes.')
      }

      setSuccessMsg(`Domain "${hostname}" verified and activated successfully! SSL certificate is active.`)
      if (user?.id) await loadDomains(user.id)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Verification failed.')
      if (user?.id) await loadDomains(user.id)
    } finally {
      setVerifyingDomainId(null)
    }
  }

  // Disconnect domain handler
  const handleDisconnectDomain = async (domainId: string, hostname: string) => {
    setDisconnectingDomainId(domainId)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await domainService.disconnectCustomDomain(domainId)
      if (!res.success) {
        throw new Error(res.error || 'Failed to disconnect domain.')
      }

      setSuccessMsg(`Domain "${hostname}" has been disconnected successfully.`)
      setShowDisconnectConfirm(null)
      if (user?.id) await loadDomains(user.id)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Disconnect failed.')
    } finally {
      setDisconnectingDomainId(null)
    }
  }

  // Live DNS Check diagnostic
  const handleCheckLiveDns = async (domainId: string, hostname: string, token: string | null) => {
    if (!token) return
    setCheckingDnsId(domainId)
    try {
      const liveRes = await domainService.checkLiveDnsOverHttps(hostname, token)
      setLiveDnsResult((prev) => ({ ...prev, [domainId]: liveRes }))
    } catch (err) {
      console.warn('DoH check error:', err)
    } finally {
      setCheckingDnsId(null)
    }
  }

  // Handle Free .xyz Domain Claim Submission (Runner/Winner only)
  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    setClaimError(null)
    setClaimSuccess(null)

    if (!user?.id || !isConfigured) {
      setClaimError('You must be signed in to submit a domain claim.')
      return
    }

    if (!eligibility?.is_eligible) {
      setClaimError('Only event runners and winners registered by an administrator can claim a sponsored domain.')
      return
    }

    const cleanInput = claimHandle.trim().toLowerCase()
    const targetDomain = cleanInput.endsWith('.xyz') ? cleanInput : `${cleanInput}.xyz`

    if (cleanInput.length < 2) {
      setClaimError('Please enter a valid name for your .xyz domain handle (minimum 2 characters).')
      return
    }

    setSubmittingClaim(true)

    try {
      const res = await domainClaimService.requestXyzDomain(targetDomain)
      if (!res.success) {
        throw new Error(res.error || 'Failed to submit claim request.')
      }

      setClaimSuccess(`Domain claim for "${targetDomain}" submitted! Awaiting administrator review.`)
      setClaimHandle('')
      setShowReapply(false)
      await loadEligibilityAndClaim()
    } catch (err: unknown) {
      setClaimError(err instanceof Error ? err.message : 'Failed to submit claim request.')
    } finally {
      setSubmittingClaim(false)
    }
  }

  // Handle student-initiated DNS verification for .xyz claim
  const handleInitiateDnsVerification = async () => {
    if (!myClaim?.id) return
    setVerifyingDns(true)
    setClaimError(null)
    try {
      const res = await domainClaimService.submitDnsVerification(myClaim.id)
      if (!res.success) throw new Error(res.error || 'Failed to initiate verification')
      setClaimSuccess('DNS verification initiated! Propagation test is running.')
      await loadEligibilityAndClaim()
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : 'Verification initiation failed')
    } finally {
      setVerifyingDns(false)
    }
  }

  const hasEntitlement = isCustomDomainUnlocked() || hasAllAccessPass

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* =========================================================================
          1. Connect My Own Domain Section (Primary User Feature)
         ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-xs relative overflow-hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-blue-50 text-[#2563EB] border border-[#BFDBFE]">
                <Globe className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
                Connect My Own Domain
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 leading-relaxed max-w-2xl">
              Connect a custom domain you already own (e.g. <code className="text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded font-mono text-xs">example.com</code> or <code className="text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded font-mono text-xs">portfolio.example.com</code>) to your published portfolio on the Netlify Edge Network with automated Let&apos;s Encrypt SSL.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                hasEntitlement
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {hasEntitlement ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Custom Domain Pass: Active</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pass Required ({domainPassPrice.formatted})</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Global Success / Error Feedback */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">{successMsg}</div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">{errorMsg}</div>
          </div>
        )}

        {/* Pass Purchase Banner if unentitled */}
        {!hasEntitlement && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                <span className="text-xs font-bold text-[#0F172A]">
                  Custom Domain Pass or Pro All-Access Lifetime Pass Required
                </span>
              </div>
              <p className="text-xs text-[#475569] leading-relaxed">
                Connect unlimited domain routing to your published portfolio. Pay once, use forever. Domain ownership must still be verified via DNS challenge.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCheckoutOpen(true)}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shrink-0 shadow-xs"
            >
              Unlock Domain Pass ({domainPassPrice.formatted})
            </Button>
          </div>
        )}

        {/* Add Domain Form */}
        <form onSubmit={handleConnectDomain} className="space-y-3 pt-1">
          <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider block">
            Add New Custom Domain
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5 max-w-lg">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={newHostname}
                onChange={(e) => setNewHostname(e.target.value)}
                placeholder="e.g. rahulsharma.dev or portfolio.mybrand.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
              leftIcon={<Plus className="w-4 h-4" />}
              className="px-5 py-2.5 text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white shrink-0 shadow-xs font-semibold"
            >
              Add Domain
            </Button>
          </div>
          <p className="text-[11px] text-[#64748B]">
            Apex domains (<code className="font-mono text-slate-700">example.com</code>) and subdomains (<code className="font-mono text-slate-700">portfolio.example.com</code>) are supported.
          </p>
        </form>

        {/* Connected Domains List */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
            Connected Domains ({domains.length})
          </h3>

          {loadingDomains ? (
            <div className="p-6 text-center rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs text-[#64748B]">Loading domain records...</span>
            </div>
          ) : domains.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <Globe className="w-8 h-8 text-[#94A3B8] mx-auto" />
              <p className="text-xs font-medium text-[#0F172A]">No custom domains connected yet</p>
              <p className="text-[11px] text-[#64748B] max-w-sm mx-auto">
                Add your personal domain above to route traffic to your portfolio with automatic SSL provisioning.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {domains.map((dom) => {
                const isApex = domainService.isApexDomain(dom.hostname)
                const token = dom.verification_token || `prbuilder-verify-${dom.id.slice(0, 8)}`
                const exactRecords: DnsRecordInstruction[] =
                  dom.dns_records && Array.isArray(dom.dns_records) && dom.dns_records.length > 0
                    ? (dom.dns_records as unknown as DnsRecordInstruction[])
                    : domainService.getExactDnsRecords(dom.hostname, token)

                const isVerified = dom.verification_status === 'verified'
                const isActive = dom.connection_status === 'active'
                const isPending = dom.verification_status === 'pending_verification'
                const isFailed = dom.verification_status === 'failed'

                const liveDns = liveDnsResult[dom.id]

                return (
                  <div
                    key={dom.id}
                    className="p-5 sm:p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4 text-xs"
                  >
                    {/* Header: Hostname & Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-[#0F172A] font-mono">
                            {dom.hostname}
                          </span>
                          {isActive && isVerified ? (
                            <a
                              href={`https://${dom.hostname}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#2563EB] hover:text-[#1D4ED8] p-1 rounded hover:bg-blue-50 transition-colors"
                              title="Open live custom domain site"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                          <span>{isApex ? 'Apex Domain' : 'Subdomain'}</span>
                          <span>•</span>
                          <span>Added {new Date(dom.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center flex-wrap gap-2">
                        {isActive && isVerified ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Active & Connected</span>
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pending DNS Verification</span>
                          </span>
                        ) : isFailed ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Verification Failed</span>
                          </span>
                        ) : null}

                        {/* SSL Status Badge */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                          <ShieldCheck className="w-3 h-3 text-slate-500" />
                          <span>SSL: {dom.ssl_status || 'pending'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Status Disclosure & Propagation Alert */}
                    {isPending && (
                      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-xs">
                          <Info className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>Action Required: Add DNS Records</span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          Add the <strong>{isApex ? 'A record and TXT record' : 'CNAME record and TXT record'}</strong> below to your domain registrar (Cloudflare, Namecheap, GoDaddy, Google Domains, etc.). DNS changes typically propagate in 5 to 15 minutes.
                        </p>
                      </div>
                    )}

                    {isFailed && dom.error_message && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                        <span className="font-semibold block">DNS Propagation Issue:</span>
                        <p className="text-[11px] leading-relaxed">{dom.error_message}</p>
                      </div>
                    )}

                    {/* Required DNS Records Table */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0F172A] block uppercase tracking-wider text-[11px]">
                          Required DNS Records (Netlify Edge Network)
                        </span>
                        <span className="text-[10px] text-[#64748B] font-mono">
                          TTL: 300 seconds (5 mins)
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-[#CBD5E1] bg-white">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-[#F8FAFC] border-b border-[#CBD5E1] text-[#475569] text-[11px] uppercase">
                            <tr>
                              <th className="px-3.5 py-2.5 font-bold">Type</th>
                              <th className="px-3.5 py-2.5 font-bold">Name / Host</th>
                              <th className="px-3.5 py-2.5 font-bold">Target / Value</th>
                              <th className="px-3 py-2.5 font-bold text-center">TTL</th>
                              <th className="px-3 py-2.5 font-bold text-right">Copy</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-[#0F172A]">
                            {exactRecords.map((rec, rIdx) => {
                              const hostKey = `${dom.id}-${rIdx}-host`
                              const valKey = `${dom.id}-${rIdx}-val`

                              return (
                                <tr key={rIdx} className="hover:bg-slate-50/60">
                                  <td className="px-3.5 py-2.5 font-bold text-[#2563EB]">
                                    {rec.type}
                                  </td>
                                  <td className="px-3.5 py-2.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold">{rec.host}</span>
                                      <button
                                        onClick={() => handleCopy(rec.host, hostKey)}
                                        className="text-[#64748B] hover:text-[#2563EB] cursor-pointer"
                                        title="Copy Host"
                                      >
                                        {copiedKey === hostKey ? (
                                          <Check className="w-3 h-3 text-emerald-600" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    </div>
                                    <span className="text-[10px] text-slate-400 block font-sans">
                                      {rec.name}
                                    </span>
                                  </td>
                                  <td className="px-3.5 py-2.5 truncate max-w-[220px]">
                                    <div className="flex items-center gap-1.5">
                                      <span className="truncate">{rec.value}</span>
                                      <button
                                        onClick={() => handleCopy(rec.value, valKey)}
                                        className="text-[#64748B] hover:text-[#2563EB] cursor-pointer shrink-0"
                                        title="Copy Value"
                                      >
                                        {copiedKey === valKey ? (
                                          <Check className="w-3 h-3 text-emerald-600" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    </div>
                                    <span className="text-[10px] text-slate-400 block font-sans">
                                      {rec.purpose}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-center text-slate-500">
                                    {rec.ttl}s
                                  </td>
                                  <td className="px-3 py-2.5 text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCopy(rec.value, valKey)}
                                      className="text-[11px] py-1 px-2 text-blue-600 hover:bg-blue-50"
                                    >
                                      {copiedKey === valKey ? 'Copied' : 'Copy'}
                                    </Button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Live DNS Diagnostic Output */}
                    {liveDns && (
                      <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-[11px] space-y-1">
                        <div className="flex items-center justify-between font-semibold text-slate-800">
                          <span>Public DNS Check Result (Google DoH):</span>
                          <span
                            className={
                              liveDns.txtFound && liveDns.targetConfigured
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                            }
                          >
                            {liveDns.details}
                          </span>
                        </div>
                        {liveDns.currentRecords.length > 0 && (
                          <div className="text-slate-600 font-mono text-[10px] space-y-0.5 pt-1">
                            {liveDns.currentRecords.map((r, i) => (
                              <div key={i}>• {r}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons: Verify Again, Live Check, Disconnect */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0]">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={verifyingDomainId === dom.id}
                          onClick={() => handleVerifyDomain(dom.id, dom.hostname, dom.verification_token)}
                          leftIcon={
                            <RefreshCw
                              className={`w-3.5 h-3.5 ${
                                verifyingDomainId === dom.id ? 'animate-spin' : ''
                              }`}
                            />
                          }
                          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold"
                        >
                          {verifyingDomainId === dom.id ? 'Verifying DNS...' : 'Verify Again'}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={checkingDnsId === dom.id}
                          onClick={() => handleCheckLiveDns(dom.id, dom.hostname, dom.verification_token)}
                          className="text-xs border-[#CBD5E1] text-[#334155] hover:bg-white"
                        >
                          {checkingDnsId === dom.id ? 'Checking DoH...' : 'Test DNS Propagation'}
                        </Button>
                      </div>

                      {showDisconnectConfirm === dom.id ? (
                        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl">
                          <span className="text-[11px] text-rose-700 font-medium">
                            Disconnect this domain?
                          </span>
                          <button
                            onClick={() => handleDisconnectDomain(dom.id, dom.hostname)}
                            disabled={disconnectingDomainId === dom.id}
                            className="text-[11px] font-bold text-rose-700 hover:underline cursor-pointer"
                          >
                            {disconnectingDomainId === dom.id ? 'Disconnecting...' : 'Yes, Disconnect'}
                          </button>
                          <button
                            onClick={() => setShowDisconnectConfirm(null)}
                            className="text-[11px] text-slate-500 hover:underline cursor-pointer ml-1"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDisconnectConfirm(dom.id)}
                          leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
                          className="text-xs text-rose-600 hover:bg-rose-50"
                        >
                          Disconnect Domain
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. Free .xyz Student Domain Claim Section (Runner/Winner Sponsorship)
         ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#EFF6FF] via-white to-[#EEF2FF] border border-[#BFDBFE] shadow-xs relative overflow-hidden">
        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-white text-[#2563EB] border border-[#BFDBFE] shadow-xs">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#111827]">
                Free .xyz Domain Sponsorship
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#2563EB] text-white text-[10px] font-bold tracking-wide uppercase">
                Runners & Winners Exclusive
              </span>
            </div>

            {/* Status Pill Header */}
            {myClaim && !showReapply && (
              <div>
                {myClaim.status === 'pending' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pending Admin Review</span>
                  </span>
                )}
                {myClaim.status === 'approved' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Approved — Awaiting Registrar Booking</span>
                  </span>
                )}
                {myClaim.status === 'registered' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Registered — Ready for DNS Connection</span>
                  </span>
                )}
                {myClaim.status === 'dns_pending' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-xs font-semibold">
                    <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin" />
                    <span>DNS Propagation in Progress</span>
                  </span>
                )}
                {(myClaim.status === 'active' || myClaim.status === 'claimed') && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Active & Live Connected</span>
                  </span>
                )}
                {myClaim.status === 'rejected' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Claim Rejected</span>
                  </span>
                )}
              </div>
            )}
          </div>

          <p className="text-xs sm:text-sm text-[#64748B] max-w-2xl leading-relaxed">
            Through the official Gen.xyz sponsorship program, registered event runners and winners
            are eligible for one sponsored <span className="font-semibold text-[#111827]">.xyz</span> personal
            portfolio domain. Allocations are strictly limited to 300 sponsored domains.
          </p>

          {/* Loading State */}
          {loadingEligibility ? (
            <div className="p-6 text-center bg-white rounded-2xl border border-[#E2E8F0]">
              <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-[#64748B]">Verifying event runner/winner eligibility...</p>
            </div>
          ) : !eligibility?.is_eligible ? (
            /* STATE A: NOT ELIGIBLE */
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#111827]">
                      Runner & Winner Sponsorship Status: Not Eligible
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-[#64748B]">
                      Restricted
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    This domain sponsorship program is exclusively available to verified event
                    Runners and event Winners. Your logged-in account email (
                    <strong className="text-[#111827] font-mono">{user?.email}</strong>) is not
                    registered on the official event roster.
                  </p>
                  <p className="text-xs text-[#64748B] leading-relaxed pt-1">
                    If you participated or won in an official KaizenQ hackathon or partner codefest,
                    please reach out to your event coordinator to have your verified email added to the
                    administrator roster.
                  </p>
                </div>
              </div>
            </div>
          ) : myClaim && !showReapply ? (
            /* STATE B: CLAIM EXISTS */
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  Your Sponsored .xyz Claim
                </span>
                <span className="text-xs font-mono font-bold text-[#2563EB]">
                  {myClaim.requested_domain}
                </span>
              </div>

              {myClaim.status === 'registered' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-2">
                  <p className="font-semibold">Registrar Setup Complete!</p>
                  <p className="text-[11px] leading-relaxed">
                    Your domain has been booked. Click below to verify DNS connection.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={verifyingDns}
                    onClick={handleInitiateDnsVerification}
                    className="text-xs bg-[#2563EB] hover:bg-[#1D4ED8]"
                  >
                    {verifyingDns ? 'Checking DNS...' : 'Verify DNS Connection'}
                  </Button>
                </div>
              )}

              {myClaim.status === 'rejected' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2">
                  <span className="font-semibold block">Claim Not Approved:</span>
                  <p className="leading-relaxed">
                    Reason: {myClaim.rejection_reason || 'Domain handle does not meet guidelines or is reserved.'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReapply(true)}
                    className="text-xs py-1 px-3 border-rose-300 text-rose-700 hover:bg-rose-100"
                  >
                    Submit Revised Domain Handle
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* STATE C: ELIGIBLE — UNCLAIMED */
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      eligibility?.category === 'winner'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {eligibility?.category === 'winner' ? (
                      <Trophy className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <Award className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                    <span>Verified Event {eligibility?.category}</span>
                  </span>
                  {eligibility?.event_reference && (
                    <span className="text-xs text-[#64748B]">
                      • {eligibility.event_reference}
                    </span>
                  )}
                </div>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Sponsorship Verified
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-[#64748B]">
                  Welcome, <strong className="text-[#111827]">{eligibility?.student_name}</strong>! As an
                  official event {eligibility?.category}, you are entitled to claim 1 sponsored personal
                  .xyz domain.
                </p>

                <form
                  onSubmit={handleSubmitClaim}
                  className="flex flex-col sm:flex-row gap-2.5 max-w-lg"
                >
                  <div className="relative flex-1">
                    <Globe className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={claimHandle}
                      onChange={(e) =>
                        setClaimHandle(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                      }
                      placeholder="e.g. rahul-dev or yourname"
                      className="w-full pl-9 pr-14 py-2.5 rounded-xl bg-white border border-[#BFDBFE] text-xs sm:text-sm text-[#111827] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] shadow-xs"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#2563EB]">
                      .xyz
                    </span>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={submittingClaim}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                    className="px-5 py-2.5 text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white shrink-0 shadow-xs font-semibold"
                  >
                    Claim Sponsored Domain
                  </Button>
                </form>

                {claimHandle && (
                  <p className="text-xs text-[#64748B] flex items-center gap-1.5">
                    <span>Requested domain:</span>
                    <span className="font-mono font-semibold text-[#2563EB]">
                      {claimHandle.endsWith('.xyz') ? claimHandle : `${claimHandle}.xyz`}
                    </span>
                  </p>
                )}

                {claimSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{claimSuccess}</span>
                  </div>
                )}

                {claimError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{claimError}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal for Custom Domain Pass */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        productId="custom-domain-pass"
        productTitle="Instant Custom Domain Pass"
        productCategory="domain_pass"
        pricePaise={domainPassPrice.paise}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={async () => {
          await refreshEntitlements()
        }}
      />
    </div>
  )
}

export default DomainView
