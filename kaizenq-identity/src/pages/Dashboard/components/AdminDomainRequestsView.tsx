import React, { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  Search,
  RefreshCw,
  AlertTriangle,
  Globe,
  Lock,
  Plus,
  Upload,
  UserCheck,
  Trophy,
  Award,
  Layers,
  Check,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button.tsx'
import { Badge } from '../../../components/ui/Badge.tsx'
import { useAuth } from '../../../app/providers/AuthContext.tsx'
import {
  domainClaimService,
  type AdminDomainClaimItem,
  type AdminEligibilityItem,
  type SponsorshipMetrics,
} from '../../../services/domainClaimService.ts'

export const AdminDomainRequestsView: React.FC = () => {
  const { isAdmin, user } = useAuth()

  // Main navigation tab: 'claims' | 'eligibility'
  const [activeTab, setActiveTab] = useState<'claims' | 'eligibility'>('claims')

  // Claims state
  const [claims, setClaims] = useState<AdminDomainClaimItem[]>([])
  const [loadingClaims, setLoadingClaims] = useState<boolean>(true)
  const [claimsFilter, setClaimsFilter] = useState<string>('all')
  const [claimsSearch, setClaimsSearch] = useState<string>('')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [rejectingClaimId, setRejectingClaimId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<string>('')

  // Eligibility state
  const [eligibilityList, setEligibilityList] = useState<AdminEligibilityItem[]>([])
  const [loadingEligibility, setLoadingEligibility] = useState<boolean>(false)
  const [eligibilitySearch, setEligibilitySearch] = useState<string>('')
  const [eligibilityCategoryFilter, setEligibilityCategoryFilter] = useState<string>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false)
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false)

  // Single add form state
  const [newName, setNewName] = useState<string>('')
  const [newEmail, setNewEmail] = useState<string>('')
  const [newCategory, setNewCategory] = useState<'runner' | 'winner'>('runner')
  const [newEvent, setNewEvent] = useState<string>('')
  const [isAdding, setIsAdding] = useState<boolean>(false)

  // CSV import state
  const [csvContent, setCsvContent] = useState<string>('')
  const [isImporting, setIsImporting] = useState<boolean>(false)
  const [importSummary, setImportSummary] = useState<string | null>(null)

  // Metrics
  const [metrics, setMetrics] = useState<SponsorshipMetrics | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 1. Fetch Metrics & Claims
  const loadClaimsAndMetrics = useCallback(async () => {
    setLoadingClaims(true)
    try {
      const [claimsRes, metricsRes] = await Promise.all([
        domainClaimService.getAdminClaims(claimsFilter),
        domainClaimService.getMetrics(),
      ])
      if (claimsRes.error) throw claimsRes.error
      setClaims(claimsRes.data || [])
      if (metricsRes.data) setMetrics(metricsRes.data)
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to fetch domain claims',
      })
    } finally {
      setLoadingClaims(false)
    }
  }, [claimsFilter])

  // 2. Fetch Eligibility Directory
  const loadEligibility = useCallback(async () => {
    setLoadingEligibility(true)
    try {
      const { data, error } = await domainClaimService.getEligibilityDirectory(
        eligibilitySearch,
        eligibilityCategoryFilter,
      )
      if (error) throw error
      setEligibilityList(data || [])
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to load eligibility roster',
      })
    } finally {
      setLoadingEligibility(false)
    }
  }, [eligibilitySearch, eligibilityCategoryFilter])

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'claims') {
        loadClaimsAndMetrics()
      } else {
        loadEligibility()
      }
    }
  }, [isAdmin, activeTab, loadClaimsAndMetrics, loadEligibility])

  // Actions for Claims
  const handleApproveClaim = async (claimId: string, domain: string) => {
    setActionLoadingId(claimId)
    setMessage(null)
    try {
      const res = await domainClaimService.reviewClaim(claimId, 'approve')
      if (!res.success) throw new Error(res.error || 'Approval failed')
      setMessage({
        type: 'success',
        text: `Claim for "${domain}" approved and queued for manual registrar booking!`,
      })
      await loadClaimsAndMetrics()
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Approval failed',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleConfirmRegistered = async (claimId: string, domain: string) => {
    setActionLoadingId(claimId)
    setMessage(null)
    try {
      const res = await domainClaimService.reviewClaim(claimId, 'confirm_registered')
      if (!res.success) throw new Error(res.error || 'Registration confirmation failed')
      setMessage({
        type: 'success',
        text: `Domain "${domain}" marked as Registered at registrar. Student unlocked DNS instructions!`,
      })
      await loadClaimsAndMetrics()
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Action failed',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleMarkDnsPending = async (claimId: string) => {
    setActionLoadingId(claimId)
    setMessage(null)
    try {
      const res = await domainClaimService.reviewClaim(claimId, 'mark_dns_pending')
      if (!res.success) throw new Error(res.error || 'Action failed')
      setMessage({ type: 'success', text: 'Domain marked as DNS Pending.' })
      await loadClaimsAndMetrics()
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Action failed',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleMarkActive = async (claimId: string, domain: string) => {
    setActionLoadingId(claimId)
    setMessage(null)
    try {
      const res = await domainClaimService.reviewClaim(claimId, 'mark_active')
      if (!res.success) throw new Error(res.error || 'Activation failed')
      setMessage({
        type: 'success',
        text: `Domain "${domain}" is now Verified & Active! Linked to portfolio.`,
      })
      await loadClaimsAndMetrics()
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Activation failed',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleConfirmReject = async () => {
    if (!rejectingClaimId) return
    setActionLoadingId(rejectingClaimId)
    setMessage(null)
    try {
      const res = await domainClaimService.reviewClaim(
        rejectingClaimId,
        'reject',
        rejectReason.trim() || undefined,
      )
      if (!res.success) throw new Error(res.error || 'Rejection failed')
      setMessage({ type: 'success', text: 'Domain claim request rejected.' })
      setRejectingClaimId(null)
      setRejectReason('')
      await loadClaimsAndMetrics()
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Rejection failed',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  // Actions for Eligibility
  const handleAddEligibility = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim()) return
    setIsAdding(true)
    setMessage(null)
    try {
      const res = await domainClaimService.addEligibility(
        newName,
        newEmail,
        newCategory,
        newEvent || undefined,
      )
      if (!res.success) throw new Error(res.error || 'Failed to add student')
      setMessage({
        type: 'success',
        text: `Successfully added ${newName} (${newEmail}) as eligible ${newCategory}!`,
      })
      setIsAddModalOpen(false)
      setNewName('')
      setNewEmail('')
      setNewEvent('')
      await loadEligibility()
      await domainClaimService.getMetrics().then((m) => m.data && setMetrics(m.data))
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to add student',
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleCsvImport = async () => {
    if (!csvContent.trim()) return
    setIsImporting(true)
    setImportSummary(null)
    try {
      // Parse CSV lines
      const lines = csvContent.trim().split(/\r?\n/)
      const records: Array<{ name: string; email: string; category: string; event?: string }> = []

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue
        // Skip header if detected
        if (i === 0 && line.toLowerCase().includes('email')) continue

        const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''))
        if (parts.length >= 2) {
          records.push({
            name: parts[0],
            email: parts[1],
            category: parts[2] ? parts[2].toLowerCase() : 'runner',
            event: parts[3] || undefined,
          })
        }
      }

      if (records.length === 0) {
        throw new Error('No valid CSV rows parsed. Format: Name,Email,Category,Event')
      }

      const res = await domainClaimService.importEligibilityCsv(records)
      if (!res.success) throw new Error(res.error || 'Import failed')

      setImportSummary(`Imported ${res.imported} records successfully (${res.skipped} skipped).`)
      setMessage({
        type: 'success',
        text: `CSV import completed: ${res.imported} eligible students registered!`,
      })
      setCsvContent('')
      await loadEligibility()
      await domainClaimService.getMetrics().then((m) => m.data && setMetrics(m.data))
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'CSV import failed',
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleRevoke = async (eligibilityId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to revoke sponsorship eligibility for ${studentName}?`))
      return
    setMessage(null)
    try {
      const res = await domainClaimService.revokeEligibility(eligibilityId)
      if (!res.success) throw new Error(res.error || 'Revocation failed')
      setMessage({ type: 'success', text: `Revoked eligibility for ${studentName}.` })
      await loadEligibility()
      await domainClaimService.getMetrics().then((m) => m.data && setMetrics(m.data))
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to revoke',
      })
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm text-center max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#111827]">Administrator Access Required</h2>
        <p className="text-sm text-[#64748B]">
          You do not have administrative privileges to manage Gen.xyz domain sponsorships.
        </p>
        <p className="text-xs text-[#94A3B8] font-mono">
          Logged in as: {user?.email || 'Anonymous'}
        </p>
      </div>
    )
  }

  const filteredClaims = claims.filter((c) => {
    if (!claimsSearch.trim()) return true
    const q = claimsSearch.toLowerCase()
    return (
      c.requested_domain.toLowerCase().includes(q) ||
      c.student_email.toLowerCase().includes(q) ||
      c.student_name.toLowerCase().includes(q) ||
      (c.event_reference && c.event_reference.toLowerCase().includes(q))
    )
  })

  const remainingQuota = metrics ? metrics.remaining_quota : 300
  const totalAllocation = 300
  const quotaUsedPercent = Math.min(
    100,
    Math.round(((totalAllocation - remainingQuota) / totalAllocation) * 100),
  )

  return (
    <div className="space-y-6">
      {/* 1. Header & Quota Allocation Status */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">
                Runner & Winner .XYZ Sponsorship Portal
              </h1>
              <Badge variant="cyan" size="sm">
                Admin Secure
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Manage student runner/winner eligibility, review domain claims, and track the atomic
              300 sponsored domain allocation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (activeTab === 'claims') loadClaimsAndMetrics()
                else loadEligibility()
              }}
              leftIcon={
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingClaims || loadingEligibility ? 'animate-spin' : ''}`}
                />
              }
            >
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Quota Progress Bar & Counters */}
        <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2563EB]" />
              <span className="font-semibold text-[#111827]">
                Sponsored Allocation: 300 Domains
              </span>
              <span className="text-[#64748B]">
                ({totalAllocation - remainingQuota} reserved / {remainingQuota} remaining)
              </span>
            </div>
            <div className="font-mono font-semibold text-[#2563EB]">
              {quotaUsedPercent}% Allocation Utilized
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 rounded-full bg-[#E2E8F0] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] transition-all duration-500 rounded-full"
              style={{ width: `${quotaUsedPercent}%` }}
            />
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
              <div className="text-[11px] text-[#64748B] font-medium">Eligible Roster</div>
              <div className="text-lg font-bold text-[#111827]">
                {metrics ? metrics.eligible_count : 0}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
              <div className="text-[11px] text-[#64748B] font-medium">Pending Claims</div>
              <div className="text-lg font-bold text-amber-600">
                {metrics ? metrics.pending_count : 0}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
              <div className="text-[11px] text-[#64748B] font-medium">Approved Queue</div>
              <div className="text-lg font-bold text-[#2563EB]">
                {metrics ? metrics.approved_count : 0}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
              <div className="text-[11px] text-[#64748B] font-medium">Registered</div>
              <div className="text-lg font-bold text-indigo-600">
                {metrics ? metrics.registered_count : 0}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
              <div className="text-[11px] text-[#64748B] font-medium">DNS Pending</div>
              <div className="text-lg font-bold text-sky-600">
                {metrics ? metrics.dns_pending_count : 0}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
              <div className="text-[11px] text-[#64748B] font-medium">Live & Active</div>
              <div className="text-lg font-bold text-emerald-600">
                {metrics ? metrics.active_count : 0}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
              <div className="text-[11px] text-[#64748B] font-medium">Rejected</div>
              <div className="text-lg font-bold text-rose-600">
                {metrics ? metrics.rejected_count : 0}
              </div>
            </div>
          </div>
        </div>

        {/* Operational Security Notice */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <div className="space-y-1">
            <span className="font-semibold text-amber-950">
              Coupon Security & Manual Registration Workflow:
            </span>
            <p className="leading-relaxed">
              The Gen.xyz sponsorship coupon is a single protected secret and is never transmitted
              to client browsers or student records. When a student claim is approved, copy their
              requested domain and book it manually on the Gen.xyz registrar console. Once
              purchased, click <strong>&quot;Confirm Domain Registered&quot;</strong> below to unlock
              safe DNS instructions for the student without exposing the coupon.
            </p>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="text-xs font-semibold underline ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* 2. Main Portal Tabs */}
      <div className="flex border-b border-[#E2E8F0] gap-4">
        <button
          onClick={() => setActiveTab('claims')}
          className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
            activeTab === 'claims' ? 'text-[#2563EB]' : 'text-[#64748B] hover:text-[#111827]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>Sponsorship Claims & Registration Queue</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#EFF6FF] text-[#2563EB] font-bold">
              {claims.length}
            </span>
          </div>
          {activeTab === 'claims' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('eligibility')}
          className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
            activeTab === 'eligibility' ? 'text-[#2563EB]' : 'text-[#64748B] hover:text-[#111827]'
          }`}
        >
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            <span>Runner / Winner Eligibility Directory</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#EFF6FF] text-[#2563EB] font-bold">
              {eligibilityList.length}
            </span>
          </div>
          {activeTab === 'eligibility' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full" />
          )}
        </button>
      </div>

      {/* 3. CLAIMS TAB CONTENT */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          {/* Filter Chips & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-[#E2E8F0] overflow-x-auto">
              {[
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending' },
                { id: 'approved', label: 'Approved (Queued)' },
                { id: 'registered', label: 'Registered' },
                { id: 'dns_pending', label: 'DNS Pending' },
                { id: 'active', label: 'Active' },
                { id: 'rejected', label: 'Rejected' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setClaimsFilter(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    claimsFilter === t.id
                      ? 'bg-white text-[#2563EB] shadow-xs'
                      : 'text-[#64748B] hover:text-[#111827]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[260px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search domain, student, event..."
                value={claimsSearch}
                onChange={(e) => setClaimsSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          {/* Claims List */}
          {loadingClaims ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#E2E8F0]">
              <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-[#64748B]">Loading sponsorship claims queue...</p>
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#E2E8F0] space-y-2">
              <Globe className="w-10 h-10 text-[#94A3B8] mx-auto" />
              <h3 className="text-sm font-bold text-[#111827]">No domain requests found</h3>
              <p className="text-xs text-[#64748B]">
                {claimsSearch
                  ? 'No claims match your search query.'
                  : 'No domain claims are currently in this category.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#BFDBFE] transition-all shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-base font-bold text-[#111827]">
                          {claim.requested_domain}
                        </span>
                        <Badge
                          variant={
                            claim.status === 'active' || claim.status === 'claimed'
                              ? 'success'
                              : claim.status === 'registered'
                              ? 'accent'
                              : claim.status === 'approved'
                              ? 'event'
                              : claim.status === 'dns_pending'
                              ? 'cyan'
                              : claim.status === 'pending'
                              ? 'outline'
                              : 'default'
                          }
                          size="sm"
                        >
                          {claim.status === 'approved'
                            ? 'Approved — Awaiting Registrar Booking'
                            : claim.status === 'registered'
                            ? 'Registered at Registrar'
                            : claim.status === 'dns_pending'
                            ? 'DNS Verification Pending'
                            : claim.status === 'active' || claim.status === 'claimed'
                            ? 'Live & Active'
                            : claim.status.toUpperCase()}
                        </Badge>
                        {claim.category && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              claim.category === 'winner'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {claim.category === 'winner' ? (
                              <Trophy className="w-3 h-3 text-amber-600" />
                            ) : (
                              <Award className="w-3 h-3 text-indigo-600" />
                            )}
                            <span>{claim.category}</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-[#64748B] flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>
                          Student:{' '}
                          <strong className="text-[#111827]">{claim.student_name}</strong> (
                          {claim.student_email})
                        </span>
                        {claim.event_reference && (
                          <span>
                            Event:{' '}
                            <strong className="text-[#111827]">{claim.event_reference}</strong>
                          </span>
                        )}
                        <span>Requested: {new Date(claim.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Actions based on lifecycle status */}
                    <div className="flex flex-wrap items-center gap-2">
                      {claim.status === 'pending' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={actionLoadingId === claim.id || remainingQuota <= 0}
                            onClick={() => handleApproveClaim(claim.id, claim.requested_domain)}
                            leftIcon={<Check className="w-3.5 h-3.5" />}
                          >
                            {remainingQuota <= 0 ? 'Quota Full (300)' : 'Approve & Reserve Slot'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoadingId === claim.id}
                            onClick={() => {
                              setRejectingClaimId(claim.id)
                              setRejectReason('')
                            }}
                            className="text-rose-600 border-rose-200 hover:bg-rose-50"
                          >
                            Reject
                          </Button>
                        </>
                      )}

                      {claim.status === 'approved' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={actionLoadingId === claim.id}
                            onClick={() =>
                              handleConfirmRegistered(claim.id, claim.requested_domain)
                            }
                            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            Confirm Domain Registered
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoadingId === claim.id}
                            onClick={() => {
                              setRejectingClaimId(claim.id)
                              setRejectReason('')
                            }}
                            className="text-rose-600 border-rose-200"
                          >
                            Reject
                          </Button>
                        </>
                      )}

                      {claim.status === 'registered' && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={actionLoadingId === claim.id}
                            onClick={() => handleMarkDnsPending(claim.id)}
                            leftIcon={<Clock className="w-3.5 h-3.5" />}
                          >
                            Move to DNS Pending
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={actionLoadingId === claim.id}
                            onClick={() => handleMarkActive(claim.id, claim.requested_domain)}
                            leftIcon={<Check className="w-3.5 h-3.5" />}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            Verify & Activate
                          </Button>
                        </>
                      )}

                      {claim.status === 'dns_pending' && (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={actionLoadingId === claim.id}
                          onClick={() => handleMarkActive(claim.id, claim.requested_domain)}
                          leftIcon={<Check className="w-3.5 h-3.5" />}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          Verify DNS & Mark Active
                        </Button>
                      )}

                      {(claim.status === 'active' || claim.status === 'claimed') && (
                        <a
                          href={`https://${claim.requested_domain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100"
                        >
                          <span>Live Site</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {claim.status === 'rejected' && claim.rejection_reason && (
                        <span className="text-xs text-rose-600 font-medium">
                          Reason: {claim.rejection_reason}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. ELIGIBILITY DIRECTORY TAB CONTENT */}
      {activeTab === 'eligibility' && (
        <div className="space-y-4">
          {/* Top Controls: Search, Category Filter, and Add / Import Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative min-w-[260px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="text"
                  placeholder="Search name, email, event..."
                  value={eligibilitySearch}
                  onChange={(e) => setEligibilitySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <select
                value={eligibilityCategoryFilter}
                onChange={(e) => setEligibilityCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="winner">Winners Only</option>
                <option value="runner">Runners Only</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCsvModalOpen(true)}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
              >
                Import CSV
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Eligible Student
              </Button>
            </div>
          </div>

          {/* Eligibility Roster Table */}
          {loadingEligibility ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#E2E8F0]">
              <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-[#64748B]">Loading eligibility roster...</p>
            </div>
          ) : eligibilityList.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#E2E8F0] space-y-2">
              <UserCheck className="w-10 h-10 text-[#94A3B8] mx-auto" />
              <h3 className="text-sm font-bold text-[#111827]">No eligible students found</h3>
              <p className="text-xs text-[#64748B]">
                Add event runners and winners manually or via CSV import to allow them to claim
                sponsored .xyz domains.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                  <tr>
                    <th className="px-4 py-3.5">Student Name</th>
                    <th className="px-4 py-3.5">Verified Email</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Event Reference</th>
                    <th className="px-4 py-3.5">Claim Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#111827]">
                  {eligibilityList.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3 font-semibold">{item.student_name}</td>
                      <td className="px-4 py-3 font-mono text-[#64748B]">{item.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.category === 'winner'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {item.category === 'winner' ? (
                            <Trophy className="w-3 h-3 text-amber-600" />
                          ) : (
                            <Award className="w-3 h-3 text-indigo-600" />
                          )}
                          <span>{item.category}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#64748B]">
                        {item.event_reference || 'General Sponsorship'}
                      </td>
                      <td className="px-4 py-3">
                        {item.is_revoked ? (
                          <span className="text-rose-600 font-semibold text-[11px]">Revoked</span>
                        ) : item.claim_status ? (
                          <span className="inline-flex items-center gap-1 text-[#2563EB] font-medium text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {item.claim_status} ({item.claimed_domain || 'In Progress'})
                            </span>
                          </span>
                        ) : (
                          <span className="text-[#64748B] text-[11px]">Not Claimed</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!item.is_revoked && (
                          <button
                            onClick={() => handleRevoke(item.id, item.student_name)}
                            className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer p-1 rounded hover:bg-rose-50"
                            title="Revoke eligibility"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. ADD ELIGIBLE STUDENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#E2E8F0] shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                  <UserCheck className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-[#111827]">Add Eligible Student</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#64748B] hover:text-[#111827] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEligibility} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#111827] mb-1">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111827] mb-1">
                  Registered Account Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="student@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
                <p className="text-[10px] text-[#64748B] mt-1">
                  Must match the student&apos;s verified login email address.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-[#111827] mb-1">
                  Eligibility Category *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCategory('winner')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                      newCategory === 'winner'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    <Trophy className="w-4 h-4 text-amber-600" />
                    <span>Event Winner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCategory('runner')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                      newCategory === 'runner'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    <Award className="w-4 h-4 text-indigo-600" />
                    <span>Event Runner</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#111827] mb-1">
                  Event Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. KaizenQ Hackathon 2026"
                  value={newEvent}
                  onChange={(e) => setNewEvent(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isAdding}>
                  Register Student
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. BULK CSV IMPORT MODAL */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-[#E2E8F0] shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                  <Upload className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-[#111827]">
                  Bulk CSV Eligibility Import
                </h3>
              </div>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="text-[#64748B] hover:text-[#111827] text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#64748B]">
              Paste CSV records or upload a file. Expected header format:{' '}
              <code className="text-[#2563EB] font-bold">name,email,category,event</code>
            </p>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] font-mono text-[#64748B]">
              Rahul Sharma,rahul@example.com,winner,KaizenQ Hackathon 2026
              <br />
              Ananya Patel,ananya@example.com,runner,National Codefest
            </div>

            <textarea
              rows={6}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="Paste comma-separated rows here..."
              className="w-full p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono text-[#111827] focus:outline-none focus:border-[#2563EB]"
            />

            {importSummary && (
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs">
                {importSummary}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCsvModalOpen(false)
                  setCsvContent('')
                  setImportSummary(null)
                }}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCsvImport}
                isLoading={isImporting}
                disabled={!csvContent.trim()}
              >
                Process & Import
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 7. REJECTION MODAL DIALOG */}
      {rejectingClaimId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#E2E8F0] shadow-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-[#111827]">Reject Domain Request</h3>
            <p className="text-xs text-[#64748B]">
              Please specify a reason for rejecting this claim request. The student will be notified
              and can submit an alternate handle.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Rejection Reason / Guidance
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Domain handle is reserved or student is not eligible."
                className="w-full p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRejectingClaimId(null)
                  setRejectReason('')
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReject}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDomainRequestsView
