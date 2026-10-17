import React, { useState, useEffect, useCallback } from 'react'
import {
  Share2,
  Eye,
  Globe,
  QrCode,
  Lock,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Info,
  Edit3,
  Copy,
  Download,
  Check,
} from 'lucide-react'
import QRCode from 'qrcode'
import { Button } from '../../../components/ui/Button.tsx'
import { Badge } from '../../../components/ui/Badge.tsx'
import { loadPortfolioDraft } from '../../Portfolio/storage.ts'
import { calculatePortfolioCompleteness, validatePortfolio } from '../../Portfolio/validation.ts'
import { useAuth } from '../../../app/providers/AuthContext.tsx'
import { portfolioService, type PortfolioRow } from '../../../services/portfolioService.ts'
import { getBaseAppUrl } from '../../../lib/supabase.ts'
import {
  buildSubdomainUrl,
  getPlatformDomain,
  validateSubdomainSlug,
} from '../../../lib/domainUtils.ts'
import { PortfolioDownloadButton } from '../../../components/download/PortfolioDownloadButton.tsx'
import type { DemoStudentData } from '../types.ts'

export interface PublishShareViewProps {
  student: DemoStudentData
  onOpenPreview: () => void
  onOpenEditor: () => void
}

export const PublishShareView: React.FC<PublishShareViewProps> = ({
  onOpenPreview,
  onOpenEditor,
}) => {
  const { user, isConfigured } = useAuth()
  const platformDomain = getPlatformDomain()

  // Local draft data
  const [localDraft] = useState(() => {
    return loadPortfolioDraft().data
  })

  // Cloud portfolio state
  const [cloudPortfolio, setCloudPortfolio] = useState<PortfolioRow | null>(null)
  const [isPublishing, setIsPublishing] = useState<boolean>(false)
  const [isUnpublishing, setIsUnpublishing] = useState<boolean>(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean>(false)
  const [copiedSubdomain, setCopiedSubdomain] = useState<boolean>(false)

  // Current active portfolio data (cloud takes precedence if available)
  const activeData = cloudPortfolio?.portfolio_data
    ? (cloudPortfolio.portfolio_data as unknown as typeof localDraft)
    : localDraft

  const isPublished = cloudPortfolio?.publication_status === 'published'
  const activeSlug = (cloudPortfolio?.slug || activeData.profile.slug || '').trim().toLowerCase()
  const subdomainUrl = isPublished && activeSlug ? buildSubdomainUrl(activeSlug) : null
  const publicUrl = isPublished && activeSlug ? `${getBaseAppUrl()}/p/${activeSlug}` : null

  const completeness = calculatePortfolioCompleteness(activeData)
  const validationIssues = validatePortfolio(activeData)

  // Fetch cloud portfolio on mount
  const loadCloudPortfolio = useCallback(async (userId: string) => {
    try {
      const { data } = await portfolioService.getUserPortfolio(userId)
      if (data) {
        setCloudPortfolio(data)
      }
    } catch (err) {
      console.warn('Failed to fetch portfolio record:', err)
    }
  }, [])

  useEffect(() => {
    if (user?.id && isConfigured) {
      loadCloudPortfolio(user.id)
    }
  }, [user?.id, isConfigured, loadCloudPortfolio])

  // Generate QR code when portfolio is published
  useEffect(() => {
    if (isPublished && publicUrl) {
      QRCode.toDataURL(publicUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#111827',
          light: '#FFFFFF',
        },
      })
        .then((url) => {
          setQrCodeDataUrl(url)
        })
        .catch((err) => {
          console.error('Failed to generate QR code:', err)
        })
    } else {
      setQrCodeDataUrl(null)
    }
  }, [isPublished, publicUrl])

  // Publication handler
  const handlePublish = async () => {
    setPublishError(null)
    setPublishSuccess(null)

    if (!user?.id || !isConfigured) {
      setPublishError('Please sign in with a Supabase account to publish your portfolio online.')
      return
    }

    // 1. Slug format validation
    if (!activeSlug) {
      setPublishError('Portfolio slug cannot be empty. Please configure it in the editor.')
      return
    }
    const slugValidation = validateSubdomainSlug(activeSlug)
    if (!slugValidation.valid) {
      setPublishError(slugValidation.error || 'Invalid portfolio slug.')
      return
    }

    // 2. Minimum completeness check
    if (!activeData.profile.fullName || !activeData.profile.title) {
      setPublishError('Full Name and Professional Title are required before publishing.')
      return
    }

    setIsPublishing(true)

    try {
      // Ensure cloud portfolio record exists
      let portfolioId = cloudPortfolio?.id
      if (!portfolioId) {
        const { data: savedRecord, error: saveErr } = await portfolioService.saveUserPortfolio(
          user.id,
          activeData,
          activeSlug,
        )
        if (saveErr || !savedRecord) {
          throw saveErr || new Error('Failed to prepare cloud portfolio record.')
        }
        portfolioId = savedRecord.id
        setCloudPortfolio(savedRecord)
      }

      // Execute secure publish
      const { success, publicUrl: verifiedUrl, error: pubErr } = await portfolioService.publishPortfolio(
        portfolioId,
        activeSlug,
      )

      if (pubErr || !success) {
        throw pubErr || new Error('Publication failed on server.')
      }

      setPublishSuccess(`Portfolio published successfully! Live at ${verifiedUrl}`)
      await loadCloudPortfolio(user.id)
    } catch (err: unknown) {
      setPublishError(err instanceof Error ? err.message : 'Publication failed.')
    } finally {
      setIsPublishing(false)
    }
  }

  // Unpublish handler
  const handleUnpublish = async () => {
    if (!cloudPortfolio?.id) return
    setIsUnpublishing(true)
    setPublishError(null)
    setPublishSuccess(null)

    try {
      const { success, error } = await portfolioService.unpublishPortfolio(cloudPortfolio.id)
      if (error || !success) {
        throw error || new Error('Unpublishing failed.')
      }

      setPublishSuccess('Portfolio has been unpublished. Public access is now revoked.')
      if (user?.id) {
        await loadCloudPortfolio(user.id)
      }
    } catch (err: unknown) {
      setPublishError(err instanceof Error ? err.message : 'Unpublishing failed.')
    } finally {
      setIsUnpublishing(false)
    }
  }

  // Copy Public URL to clipboard — provides feedback only when copying succeeds
  const handleCopyUrl = async () => {
    if (!publicUrl) return
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(publicUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err)
      setCopied(false)
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn select-none">
      {/* 1. Header with verified status */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5">
            {isPublished ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Globe className="w-3.5 h-3.5" />
                <span>PUBLISHED & LIVE</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                <Eye className="w-3.5 h-3.5" />
                <span>DRAFT MODE</span>
              </span>
            )}

            <span className="text-[11px] font-mono text-[#64748B] px-2 py-0.5 rounded bg-[#F1F5F9] border border-[#E2E8F0]">
              {user && isConfigured ? 'CONNECTED TO SUPABASE' : 'CLIENT-SIDE WORKSPACE'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Publish & Share
          </h1>

          <p className="text-sm text-[#64748B] leading-relaxed">
            {isPublished
              ? 'Your portfolio is published and globally accessible. Share your live link or download your high-contrast QR code.'
              : 'Preview your professional identity, review completeness metrics, and publish to the live web when ready.'}
          </p>

          {/* Configuration feedback */}
          {!isConfigured && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B]">
              <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-[#111827]">Local Sandbox Notice:</strong> To publish your portfolio with a live public URL and scannable QR code, configure your Supabase environment variables (<code className="text-[#2563EB]">VITE_SUPABASE_URL</code>). Local preview remains 100% active.
              </p>
            </div>
          )}

          {publishSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{publishSuccess}</span>
            </div>
          )}

          {publishError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{publishError}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Portfolio Readiness Status Card */}
      <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#111827]">Portfolio Readiness Status</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Derived from your verified identity profile and projects
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenEditor}
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              className="text-xs border-[#E2E8F0] text-[#111827]"
            >
              Edit in Builder
            </Button>
            <Button
              variant="glow"
              size="sm"
              onClick={onOpenPreview}
              leftIcon={<Eye className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Open Local Preview
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <span className="text-xs text-[#64748B]">Readiness Score</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-mono ${completeness >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {completeness}%
              </span>
              <span className="text-[11px] text-[#64748B]">Completed</span>
            </div>
            <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  completeness >= 80 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-[#2563EB]'
                }`}
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
            <span className="text-xs text-[#64748B]">Publication Status</span>
            <div className="text-base font-bold text-[#111827] flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isPublished ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span>{isPublished ? 'Live & Published' : 'Draft In Progress'}</span>
            </div>
            <p className="text-[11px] text-[#64748B]">
              {isPublished ? `Public slug: /p/${activeSlug}` : 'Awaiting publication'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
            <span className="text-xs text-[#64748B]">Public Handle</span>
            <div className="text-sm font-bold font-mono text-[#2563EB] truncate">
              {activeSlug ? `/p/${activeSlug}` : 'Not assigned'}
            </div>
            <p className="text-[11px] text-[#64748B]">
              {isPublished ? 'Server-verified unique slug' : 'Draft handle'}
            </p>
          </div>
        </div>

        {/* Validation issues warning */}
        {validationIssues.missingRequired.length > 0 && !isPublished && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-900">Recommended sections before publishing:</strong>{' '}
              {validationIssues.missingRequired.join(', ')}.
            </div>
          </div>
        )}
      </div>

      {/* 3. Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Local Portfolio Preview */}
        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm hover:border-[#BFDBFE] transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
                <Eye className="w-5 h-5" />
              </div>
              <Badge variant="cyan" size="sm">
                Always Available
              </Badge>
            </div>

            <h3 className="text-base font-bold text-[#111827]">Local Portfolio Preview</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Test and inspect your portfolio in a clean browser environment. Edits from the builder
              appear immediately without network latency.
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenPreview}
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
              className="w-full text-xs border-[#E2E8F0] text-[#111827]"
            >
              Launch Local Preview
            </Button>
          </div>
        </div>

        {/* Card 2: Public Portfolio URL */}
        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  isPublished ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
                }`}
              >
                <Globe className="w-5 h-5" />
              </div>
              <span
                className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${
                  isPublished
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                }`}
              >
                {isPublished ? 'Publicly Live' : 'Unpublished Draft'}
              </span>
            </div>

            <h3 className="text-base font-bold text-[#111827]">Free Platform Subdomain</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              {isPublished
                ? 'Your free subdomain is active. Share your branded link or QR code with recruiters.'
                : 'Publish your portfolio to claim your free personal subdomain on prbuilder.in.'}
            </p>

            {/* Subdomain URL box */}
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-xs flex items-center justify-between">
                <div className="truncate mr-2">
                  <span className="text-[10px] text-[#64748B] block font-sans">Primary Subdomain:</span>
                  <span className={isPublished ? 'text-[#2563EB] font-bold truncate' : 'text-[#64748B]'}>
                    {subdomainUrl || `https://${activeSlug || 'yourname'}.${platformDomain}`}
                  </span>
                </div>
                {isPublished && subdomainUrl ? (
                  <button
                    onClick={async () => {
                      if (navigator.clipboard) {
                        await navigator.clipboard.writeText(subdomainUrl)
                        setCopiedSubdomain(true)
                        setTimeout(() => setCopiedSubdomain(false), 2000)
                      }
                    }}
                    className="p-1.5 hover:text-[#2563EB] transition-colors text-[#64748B] shrink-0"
                    title="Copy Subdomain Link"
                  >
                    {copiedSubdomain ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                ) : (
                  <Lock className="w-3.5 h-3.5 opacity-60 text-[#64748B] shrink-0" />
                )}
              </div>

              {/* Direct Path route fallback */}
              {isPublished && publicUrl && (
                <div className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-[11px] flex items-center justify-between text-[#64748B]">
                  <span className="truncate">Direct route: {publicUrl}</span>
                  <button
                    onClick={handleCopyUrl}
                    className="p-1 hover:text-[#2563EB] text-[#64748B] shrink-0"
                    title="Copy Direct URL"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            {isPublished && (subdomainUrl || publicUrl) ? (
              <a
                href={subdomainUrl || publicUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors shadow-sm"
              >
                <span>Visit Live Portfolio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <p className="text-[11px] text-[#64748B] italic">
                Publishing is required to activate public routing.
              </p>
            )}
          </div>
        </div>

        {/* Card 3: Real QR Code */}
        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  isPublished ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
                }`}
              >
                <QrCode className="w-5 h-5" />
              </div>
              <span
                className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${
                  isPublished
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                }`}
              >
                {isPublished ? 'Ready to Scan' : 'Locked'}
              </span>
            </div>

            <h3 className="text-base font-bold text-[#111827]">Shareable QR Code</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              {isPublished
                ? 'High-contrast QR code generated directly from your server-confirmed live portfolio URL.'
                : 'QR generation activates automatically once your live public URL is confirmed.'}
            </p>

            {isPublished && qrCodeDataUrl ? (
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center gap-3">
                <img
                  src={qrCodeDataUrl}
                  alt={`QR Code linking to ${publicUrl}`}
                  className="w-40 h-40 rounded-lg shadow-sm bg-white p-2 border border-[#E2E8F0]"
                />
                <span className="text-[11px] font-mono text-[#2563EB]">
                  Point camera to scan live portfolio
                </span>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E2E8F0] flex flex-col items-center justify-center text-center space-y-2">
                <QrCode className="w-12 h-12 text-[#94A3B8]" />
                <span className="text-[11px] font-mono text-[#64748B]">
                  QR Generator Locked • Awaiting Publication
                </span>
              </div>
            )}
          </div>

          <div className="pt-2">
            {isPublished && qrCodeDataUrl ? (
              <a
                href={qrCodeDataUrl}
                download={`${activeSlug || 'portfolio'}-prbuilder-qr.png`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#111827] border border-[#E2E8F0] transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Download QR Code (PNG)</span>
              </a>
            ) : (
              <p className="text-[11px] text-[#64748B] italic">
                QR codes are generated only for live, verified URLs.
              </p>
            )}
          </div>
        </div>

        {/* Card 4: Social & Recruiter Sharing */}
        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  isPublished ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
                }`}
              >
                <Share2 className="w-5 h-5" />
              </div>
              <span
                className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${
                  isPublished
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                }`}
              >
                {isPublished ? 'Ready to Share' : 'Disabled'}
              </span>
            </div>

            <h3 className="text-base font-bold text-[#111827]">Social & Recruiter Sharing</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Share your verified PR Builder portfolio directly with recruiters, mentors, and hiring managers.
            </p>

            {isPublished && publicUrl ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-xs text-[#111827] flex items-center justify-center gap-1.5 transition-colors font-medium"
                >
                  <span>LinkedIn</span>
                  <ExternalLink className="w-3 h-3 text-[#64748B]" />
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `Check out my portfolio on PR Builder!`,
                  )}&url=${encodeURIComponent(publicUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-xs text-[#111827] flex items-center justify-center gap-1.5 transition-colors font-medium"
                >
                  <span>X / Twitter</span>
                  <ExternalLink className="w-3 h-3 text-[#64748B]" />
                </a>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `My PR Builder Portfolio: ${publicUrl}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-xs text-[#111827] flex items-center justify-center gap-1.5 transition-colors font-medium"
                >
                  <span>WhatsApp</span>
                  <ExternalLink className="w-3 h-3 text-[#64748B]" />
                </a>

                <a
                  href={`mailto:?subject=${encodeURIComponent(
                    `${activeData.profile.fullName} - Portfolio`,
                  )}&body=${encodeURIComponent(`Here is my verified portfolio: ${publicUrl}`)}`}
                  className="p-2.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-xs text-[#111827] flex items-center justify-center gap-1.5 transition-colors font-medium"
                >
                  <span>Email</span>
                  <ExternalLink className="w-3 h-3 text-[#64748B]" />
                </a>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 text-xs text-[#64748B]">
                <div className="flex items-center gap-2 text-[#111827]">
                  <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span className="font-semibold">Sharing Prerequisites</span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Publish your portfolio first to generate active sharing shortcuts.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2">
            <p className="text-[11px] text-[#64748B] italic">
              {isPublished
                ? 'Links automatically include OpenGraph metadata for rich previews.'
                : 'Social links are disabled in draft mode.'}
            </p>
          </div>
        </div>

        {/* Card 5: Standalone Portfolio Source Code (ZIP Export) */}
        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] flex items-center justify-center shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111827]">
                  Download Portfolio Source Code (ZIP)
                </h3>
                <span className="text-[11px] font-mono text-[#2563EB]">
                  Self-contained HTML5 / CSS3 / Vanilla JS • Zero External Dependencies
                </span>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Export your complete portfolio as a standalone website package. Includes semantic HTML, all 4 theme stylesheets (Modern, Developer, Minimal, Creative), interaction scripts, image fallbacks, and a comprehensive README for 1-click hosting on GitHub Pages, Netlify, or Vercel.
            </p>
          </div>

          <div className="shrink-0">
            <PortfolioDownloadButton
              data={activeData}
              variant="glow"
              size="md"
              label="Download Portfolio ZIP"
              className="text-xs font-bold"
            />
          </div>
        </div>
      </div>

      {/* 4. Publication Lifecycle Action Bar */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-[#111827]">
              {isPublished ? 'Manage Live Publication' : 'Deploy to Production Web'}
            </h3>
            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                isPublished
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
              }`}
            >
              {isPublished ? 'Live on Edge' : 'Publish Action'}
            </span>
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed">
            {isPublished
              ? 'Your portfolio is currently live. You can unpublish at any time to take it offline without losing your editor draft.'
              : 'Publishing exposes your portfolio to public viewers via your verified unique slug. Draft edits remain safely preserved.'}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          {isPublished ? (
            <Button
              variant="outline"
              size="md"
              isLoading={isUnpublishing}
              onClick={handleUnpublish}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50"
            >
              Unpublish Portfolio
            </Button>
          ) : (
            <Button
              variant="glow"
              size="md"
              isLoading={isPublishing}
              onClick={handlePublish}
              className="text-xs font-semibold"
            >
              Publish Portfolio
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PublishShareView
