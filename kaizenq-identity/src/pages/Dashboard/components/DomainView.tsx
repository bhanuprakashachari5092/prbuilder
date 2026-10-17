import React, { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  ShieldCheck,
  Server,
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
} from 'lucide-react'
import { Button } from '../../../components/ui/Button.tsx'
import { Badge } from '../../../components/ui/Badge.tsx'
import { useAuth } from '../../../app/providers/AuthContext.tsx'
import { domainService, type DomainRow } from '../../../services/domainService.ts'
import { portfolioService } from '../../../services/portfolioService.ts'
import {
  domainClaimService,
  type DomainClaimRow,
  type SponsorshipEligibilityResult,
} from '../../../services/domainClaimService.ts'
import type { DemoStudentData } from '../types.ts'

export interface DomainViewProps {
  student: DemoStudentData
}

export const DomainView: React.FC<DomainViewProps> = ({ student }) => {
  const { user, isConfigured } = useAuth()

  // Existing custom domain state
  const [domains, setDomains] = useState<DomainRow[]>([])
  const [, setLoadingDomains] = useState<boolean>(false)
  const [newHostname, setNewHostname] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

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

  // Handle standard custom domain connection
  const handleRequestDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!user?.id || !isConfigured) {
      setErrorMsg('Supabase account is required to register a custom domain.')
      return
    }

    setSubmitting(true)

    try {
      const { data: userPortfolio } = await portfolioService.getUserPortfolio(user.id)
      const portfolioId = userPortfolio?.id

      if (!portfolioId) {
        throw new Error('Please open the Portfolio Builder and save a draft before attaching a custom domain.')
      }

      const { data, error } = await domainService.requestCustomDomain(
        user.id,
        portfolioId,
        newHostname,
      )

      if (error || !data) {
        throw error || new Error('Failed to register domain request.')
      }

      setSuccessMsg(`Domain request for "${data.hostname}" submitted! Please configure the DNS records below.`)
      setNewHostname('')
      await loadDomains(user.id)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Registration failed.')
    } finally {
      setSubmitting(false)
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

  // Handle student-initiated DNS verification
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

  // Active domain calculation
  const activeDomain = domains[0]
  const displayHandle = activeDomain ? activeDomain.hostname : (user ? 'No custom domain connected' : student.domainInfo.handle)
  const displayStatus = activeDomain ? activeDomain.verification_status : (user ? 'Not Connected' : student.domainInfo.status)
  const isCloudRecord = Boolean(activeDomain)

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* =========================================================================
          1. Free .xyz Student Domain Claim Section (Runner/Winner Sponsorship)
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
            /* STATE B: EXISTING CLAIM ACTIVE */
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">
                      Requested Domain
                    </span>
                    {myClaim.category && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          myClaim.category === 'winner'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {myClaim.category === 'winner' ? (
                          <Trophy className="w-3 h-3 text-amber-600" />
                        ) : (
                          <Award className="w-3 h-3 text-indigo-600" />
                        )}
                        <span>{myClaim.category}</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-mono font-bold text-[#2563EB] flex items-center gap-2 mt-0.5">
                    <Globe className="w-5 h-5 text-[#2563EB]" />
                    <span>{myClaim.requested_domain}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs">
                  <span className="text-[11px] text-[#64748B] block">Submission Date</span>
                  <span className="font-mono text-[#111827]">
                    {new Date(myClaim.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Status Specific Instructions & Next Steps */}
              {myClaim.status === 'pending' && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Pending Administrator Review
                  </span>
                  <p className="leading-relaxed">
                    Your request for <strong className="font-mono">{myClaim.requested_domain}</strong> is in
                    the administrator review queue. Once your portfolio and eligibility are verified,
                    your domain slot will be reserved.
                  </p>
                </div>
              )}

              {myClaim.status === 'approved' && (
                <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#1E40AF] space-y-2">
                  <span className="font-semibold flex items-center gap-1.5 text-[#2563EB]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Claim Approved — Queued for Registrar Booking
                  </span>
                  <p className="leading-relaxed">
                    {myClaim.claim_instructions ||
                      'Congratulations! Your sponsored .XYZ domain claim has been approved. The platform administrator has queued your domain for registrar booking. You will be notified once registrar booking is confirmed.'}
                  </p>
                </div>
              )}

              {myClaim.status === 'registered' && (
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-3">
                  <div className="space-y-1">
                    <span className="font-semibold flex items-center gap-1.5 text-indigo-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                      Domain Registered at Registrar! Ready for DNS Setup
                    </span>
                    <p className="leading-relaxed">
                      Your domain <strong className="font-mono">{myClaim.requested_domain}</strong> is now
                      officially registered! Configure your DNS records to route traffic to your PR Builder
                      portfolio, then click below to initiate DNS verification.
                    </p>
                  </div>

                  {/* Copyable DNS Records Table */}
                  <div className="overflow-x-auto bg-white rounded-xl border border-indigo-200 p-2 font-mono text-[11px]">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[#64748B] border-b border-[#E2E8F0]">
                          <th className="pb-1">Type</th>
                          <th className="pb-1">Host</th>
                          <th className="pb-1">Target</th>
                          <th className="pb-1 text-right">Copy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        <tr>
                          <td className="py-1 text-[#2563EB] font-bold">CNAME</td>
                          <td className="py-1">@</td>
                          <td className="py-1">cname.kaizenq.me</td>
                          <td className="py-1 text-right">
                            <button
                              onClick={() => handleCopy('cname.kaizenq.me', 'cname-at')}
                              className="text-[#64748B] hover:text-[#2563EB]"
                            >
                              {copiedKey === 'cname-at' ? '✓' : 'Copy'}
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 text-[#2563EB] font-bold">CNAME</td>
                          <td className="py-1">www</td>
                          <td className="py-1">cname.kaizenq.me</td>
                          <td className="py-1 text-right">
                            <button
                              onClick={() => handleCopy('cname.kaizenq.me', 'cname-www')}
                              className="text-[#64748B] hover:text-[#2563EB]"
                            >
                              {copiedKey === 'cname-www' ? '✓' : 'Copy'}
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 text-emerald-600 font-bold">TXT</td>
                          <td className="py-1">_verify</td>
                          <td className="py-1">{`kaizenq-verify=${user?.id?.slice(0, 8)}`}</td>
                          <td className="py-1 text-right">
                            <button
                              onClick={() =>
                                handleCopy(`kaizenq-verify=${user?.id?.slice(0, 8)}`, 'txt-ver')
                              }
                              className="text-[#64748B] hover:text-[#2563EB]"
                            >
                              {copiedKey === 'txt-ver' ? '✓' : 'Copy'}
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleInitiateDnsVerification}
                    isLoading={verifyingDns}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Initiate DNS Verification
                  </Button>
                </div>
              )}

              {myClaim.status === 'dns_pending' && (
                <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-950 space-y-2">
                  <span className="font-semibold flex items-center gap-1.5 text-sky-800">
                    <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin" />
                    DNS Verification in Progress
                  </span>
                  <p className="leading-relaxed">
                    We are testing DNS propagation for <strong className="font-mono">{myClaim.requested_domain}</strong>.
                    DNS changes may take up to 24–48 hours to fully propagate worldwide. Once detected,
                    SSL will be provisioned automatically.
                  </p>
                </div>
              )}

              {(myClaim.status === 'active' || myClaim.status === 'claimed') && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Domain Verified, SSL Active & Live!
                    </span>
                    <a
                      href={`https://${myClaim.requested_domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[#2563EB] hover:underline font-semibold"
                    >
                      <span>Visit Live Portfolio</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <p className="leading-relaxed">
                    Your sponsored domain <strong className="font-mono">{myClaim.requested_domain}</strong> is
                    connected directly to your published portfolio with active HTTPS encryption.
                  </p>
                </div>
              )}

              {myClaim.status === 'rejected' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-2">
                  <span className="font-semibold flex items-center gap-1.5 text-rose-700">
                    <XCircle className="w-3.5 h-3.5" />
                    Claim Not Approved
                  </span>
                  <p className="leading-relaxed">
                    Reason: {myClaim.rejection_reason || 'Domain handle does not meet guidelines or is reserved.'}
                  </p>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReapply(true)}
                      className="text-xs py-1 px-3 border-rose-300 text-rose-700 hover:bg-rose-100"
                    >
                      Submit Revised Domain Handle
                    </Button>
                  </div>
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
                    className="px-5 py-2.5 text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white shrink-0 shadow-xs"
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

          {/* Policy & Quota Guarantee */}
          <div className="pt-2 border-t border-[#BFDBFE]/60 text-[11px] text-[#64748B] space-y-1">
            <span className="font-medium text-[#111827]">
              Sponsorship Allocation & Verification:
            </span>
            <p>
              Free student .xyz domain sponsorships are capped at 300 total slots. Only event runners
              and winners registered by platform administrators can claim domains. To preserve privacy
              and integrity, domains are manually verified before registrar booking is confirmed.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. Standard Custom Domain Routing Section (Existing Domains)
         ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-xs relative overflow-hidden">
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant={isCloudRecord ? 'cyan' : 'default'} size="sm">
              <span className="flex items-center gap-1 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Status: {displayStatus}</span>
              </span>
            </Badge>

            <span className="text-[11px] font-mono text-[#64748B] px-2 py-0.5 rounded bg-[#F1F5F9] border border-[#E2E8F0]">
              {isCloudRecord ? 'VERIFIED DATABASE RECORD' : (user ? 'CUSTOM DOMAIN INACTIVE' : 'STUDENT ALLOCATION')}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-[#111827]">
            Connect Existing Custom Domain
          </h2>

          <div className="flex items-center gap-3">
            <span className="text-xl sm:text-2xl font-mono font-bold text-[#2563EB]">
              {displayHandle}
            </span>
            {isCloudRecord && (
              <Badge variant="event" size="sm">
                Active DNS
              </Badge>
            )}
          </div>

          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
            Already own a domain on Namecheap, Cloudflare, or GoDaddy? Connect your existing domain
            to route directly to your published portfolio on the edge network.
          </p>

          {/* Custom Domain Request Form */}
          {user && isConfigured && (
            <form onSubmit={handleRequestDomain} className="pt-2 flex flex-col sm:flex-row gap-2.5 max-w-md">
              <div className="relative flex-1">
                <Globe className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={newHostname}
                  onChange={(e) => setNewHostname(e.target.value)}
                  placeholder="yourname.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#111827] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={submitting}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs shrink-0 bg-[#2563EB] hover:bg-[#1D4ED8]"
              >
                Connect Domain
              </Button>
            </form>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          3. Verification Requirements & DNS Configuration
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Verification Criteria Card */}
        <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#111827]">Domain Setup Steps</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#111827]">1. Portfolio Draft or Publication</span>
                <p className="text-[#64748B] mt-0.5">
                  Ensure your portfolio is saved and populated with your profile and projects.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#111827]">2. DNS Record Propagation</span>
                <p className="text-[#64748B] mt-0.5">
                  Point your CNAME record to <span className="font-mono text-[#2563EB]">cname.kaizenq.me</span> at your DNS provider.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#111827]">3. Edge SSL Provisioning</span>
                <p className="text-[#64748B] mt-0.5">
                  Automated TLS certificates are generated via Let&apos;s Encrypt upon DNS detection.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* DNS Records Target Card */}
        <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-[#111827]">Required DNS Records</h3>
            </div>
            <span className="text-[11px] font-mono text-[#64748B]">Cloudflare Edge</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-[#64748B] border-b border-[#E2E8F0]">
                  <th className="pb-2 font-semibold">Type</th>
                  <th className="pb-2 font-semibold">Host</th>
                  <th className="pb-2 font-semibold">Value</th>
                  <th className="pb-2 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#111827]">
                <tr>
                  <td className="py-2.5 text-[#2563EB] font-bold">CNAME</td>
                  <td className="py-2.5">@</td>
                  <td className="py-2.5 truncate max-w-[130px]">cname.kaizenq.me</td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => handleCopy('cname.kaizenq.me', 'cname-root')}
                      className="p-1 hover:text-[#2563EB] transition-colors text-[#64748B] cursor-pointer"
                      title="Copy Target"
                    >
                      {copiedKey === 'cname-root' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-[#2563EB] font-bold">CNAME</td>
                  <td className="py-2.5">www</td>
                  <td className="py-2.5 truncate max-w-[130px]">cname.kaizenq.me</td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => handleCopy('cname.kaizenq.me', 'cname-www')}
                      className="p-1 hover:text-[#2563EB] transition-colors text-[#64748B] cursor-pointer"
                      title="Copy Target"
                    >
                      {copiedKey === 'cname-www' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-emerald-600 font-bold">TXT</td>
                  <td className="py-2.5">_verify</td>
                  <td className="py-2.5 truncate max-w-[130px]">
                    {user ? `kaizenq-verify=${user.id.slice(0, 8)}` : 'verification-token'}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() =>
                        handleCopy(
                          user ? `kaizenq-verify=${user.id.slice(0, 8)}` : 'verification-token',
                          'txt-verify',
                        )
                      }
                      className="p-1 hover:text-emerald-700 transition-colors text-emerald-600 cursor-pointer"
                      title="Copy Token"
                    >
                      {copiedKey === 'txt-verify' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-[#64748B] leading-relaxed pt-2">
            Configure these DNS records at your domain registrar (e.g., Namecheap, Cloudflare, GoDaddy). Verification and automatic SSL provisioning run asynchronously.
          </p>
        </div>
      </div>
    </div>
  )
}

export default DomainView
