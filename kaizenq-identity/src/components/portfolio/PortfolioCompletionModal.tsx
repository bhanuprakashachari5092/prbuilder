import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  X,
  Sparkles,
  Eye,
  Download,
  Globe,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Loader2,
  Archive,
  ShieldCheck,
  Lock,
} from 'lucide-react'
import { Button } from '../ui/Button.tsx'
import type { PortfolioData } from '../../pages/Portfolio/types.ts'
import { downloadPortfolioZip, hasSufficientPortfolioContent } from '../../services/portfolioExportService.ts'
import { portfolioService, type PortfolioRow } from '../../services/portfolioService.ts'
import {
  getPlatformDomain,
  validateSubdomainSlug,
  buildSubdomainUrl,
} from '../../lib/domainUtils.ts'
import { useAuth } from '../../app/providers/AuthContext.tsx'

export interface PortfolioCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  portfolioData: PortfolioData
  cloudPortfolio: PortfolioRow | null
  onRefreshCloudPortfolio?: () => Promise<void>
  onPreview: () => void
  onOpenAuth: () => void
  onSlugChange?: (slug: string) => void
}

type PublishState = 'draft' | 'checking' | 'publishing' | 'published' | 'failed'

export const PortfolioCompletionModal: React.FC<PortfolioCompletionModalProps> = ({
  isOpen,
  onClose,
  portfolioData,
  cloudPortfolio,
  onRefreshCloudPortfolio,
  onPreview,
  onOpenAuth,
  onSlugChange,
}) => {
  const { user, isConfigured } = useAuth()
  const platformDomain = getPlatformDomain()

  // --- Subdomain & Slug State ---
  const initialSlug = (
    cloudPortfolio?.slug ||
    portfolioData.profile.slug ||
    portfolioData.profile.fullName?.toLowerCase().replace(/[^a-z0-9]/g, '-') ||
    'my-portfolio'
  ).trim().toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '')

  const [subdomainInput, setSubdomainInput] = useState<string>(initialSlug)
  const [availabilityStatus, setAvailabilityStatus] = useState<
    'idle' | 'checking' | 'available' | 'unavailable' | 'invalid'
  >('idle')
  const [availabilityMessage, setAvailabilityMessage] = useState<string>('')
  const checkTimerRef = useRef<NodeJS.Timeout | null>(null)

  // --- Publication Status State ---
  const isAlreadyPublished = cloudPortfolio?.publication_status === 'published'
  const [publishState, setPublishState] = useState<PublishState>(() => {
    return isAlreadyPublished ? 'published' : 'draft'
  })
  const [publishedUrl, setPublishedUrl] = useState<string>(() => {
    if (isAlreadyPublished && cloudPortfolio?.slug) {
      return buildSubdomainUrl(cloudPortfolio.slug)
    }
    return buildSubdomainUrl(initialSlug)
  })
  const [publishErrorMessage, setPublishErrorMessage] = useState<string | null>(null)
  const [isUnpublishing, setIsUnpublishing] = useState<boolean>(false)
  const [copySuccess, setCopySuccess] = useState<boolean>(false)

  // --- ZIP Export State ---
  const [zipStatus, setZipStatus] = useState<'idle' | 'generating' | 'downloaded' | 'error'>('idle')
  const [zipProgressText, setZipProgressText] = useState<string>('')
  const [zipErrorMessage, setZipErrorMessage] = useState<string | null>(null)

  const isContentSufficient = hasSufficientPortfolioContent(portfolioData)

  // Sync state if cloud portfolio changes
  useEffect(() => {
    if (cloudPortfolio?.publication_status === 'published' && cloudPortfolio.slug) {
      setPublishState('published')
      setPublishedUrl(buildSubdomainUrl(cloudPortfolio.slug))
      setSubdomainInput(cloudPortfolio.slug)
    } else if (cloudPortfolio?.slug) {
      setSubdomainInput(cloudPortfolio.slug)
    }
  }, [cloudPortfolio])

  // --- Debounced Slug Availability Check ---
  const performAvailabilityCheck = useCallback(
    async (slugToCheck: string) => {
      const clean = slugToCheck.trim().toLowerCase()
      const validation = validateSubdomainSlug(clean)

      if (!validation.valid) {
        setAvailabilityStatus('invalid')
        setAvailabilityMessage(validation.error || 'Invalid subdomain format.')
        return
      }

      setAvailabilityStatus('checking')
      setAvailabilityMessage('Verifying availability on platform...')

      try {
        const res = await portfolioService.checkSlugAvailability(clean, cloudPortfolio?.id)
        if (res.available) {
          setAvailabilityStatus('available')
          setAvailabilityMessage(`Available! ${clean}.${platformDomain}`)
        } else {
          setAvailabilityStatus('unavailable')
          setAvailabilityMessage(res.error || 'This subdomain is already taken. Try another.')
        }
      } catch {
        setAvailabilityStatus('unavailable')
        setAvailabilityMessage('Could not verify slug availability.')
      }
    },
    [cloudPortfolio?.id, platformDomain],
  )

  const handleSlugInputChange = (val: string) => {
    const sanitized = val.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSubdomainInput(sanitized)
    onSlugChange?.(sanitized)

    if (checkTimerRef.current) {
      clearTimeout(checkTimerRef.current)
    }

    if (!sanitized) {
      setAvailabilityStatus('invalid')
      setAvailabilityMessage('Please enter a subdomain.')
      return
    }

    checkTimerRef.current = setTimeout(() => {
      performAvailabilityCheck(sanitized)
    }, 450)
  }

  // --- ZIP Download Handler ---
  const handleDownloadZip = async () => {
    if (!isContentSufficient) return
    setZipStatus('generating')
    setZipErrorMessage(null)

    const result = await downloadPortfolioZip(portfolioData, (_pct, msg) => {
      setZipProgressText(msg)
    })

    if (result.success) {
      setZipStatus('downloaded')
      setTimeout(() => {
        setZipProgressText('')
      }, 3000)
    } else {
      setZipStatus('error')
      setZipErrorMessage(result.error || 'Failed to generate ZIP bundle.')
    }
  }

  // --- Publish Handler ---
  const handlePublish = async () => {
    setPublishErrorMessage(null)

    if (!user || !isConfigured) {
      onOpenAuth()
      return
    }

    const clean = subdomainInput.trim().toLowerCase()
    const validation = validateSubdomainSlug(clean)
    if (!validation.valid) {
      setPublishErrorMessage(validation.error || 'Invalid subdomain format.')
      return
    }

    setPublishState('publishing')

    try {
      // 1. Ensure cloud portfolio record exists
      let portfolioId = cloudPortfolio?.id
      if (!portfolioId) {
        const { data: savedRecord, error: saveErr } = await portfolioService.saveUserPortfolio(
          user.id,
          portfolioData,
          clean,
        )
        if (saveErr || !savedRecord) {
          throw saveErr || new Error('Failed to save portfolio to cloud before publishing.')
        }
        portfolioId = savedRecord.id
      }

      // 2. Execute atomic publish RPC
      const publishRes = await portfolioService.publishPortfolio(portfolioId, clean)
      if (!publishRes.success) {
        throw publishRes.error || new Error('Publication failed on server.')
      }

      const finalUrl = publishRes.subdomainUrl || buildSubdomainUrl(clean)
      setPublishedUrl(finalUrl)
      setPublishState('published')

      if (onRefreshCloudPortfolio) {
        await onRefreshCloudPortfolio()
      }
    } catch (err: unknown) {
      setPublishState('failed')
      setPublishErrorMessage(err instanceof Error ? err.message : 'Publication failed. Please try again.')
    }
  }

  // --- Unpublish Handler ---
  const handleUnpublish = async () => {
    if (!cloudPortfolio?.id) return
    setIsUnpublishing(true)
    setPublishErrorMessage(null)

    try {
      const res = await portfolioService.unpublishPortfolio(cloudPortfolio.id)
      if (!res.success) {
        throw res.error || new Error('Failed to unpublish portfolio.')
      }

      setPublishState('draft')
      if (onRefreshCloudPortfolio) {
        await onRefreshCloudPortfolio()
      }
    } catch (err: unknown) {
      setPublishErrorMessage(err instanceof Error ? err.message : 'Failed to unpublish.')
    } finally {
      setIsUnpublishing(false)
    }
  }

  // --- Copy Link Handler ---
  const handleCopyLink = async () => {
    if (!publishedUrl) return
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(publishedUrl)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2200)
      }
    } catch {
      setCopySuccess(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-title"
    >
      <div className="w-full max-w-3xl bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col text-[#111827]">
        {/* Modal Header */}
        <div className="relative px-6 py-5 sm:px-8 sm:py-6 bg-gradient-to-r from-[#EFF6FF] via-white to-[#F8FAFC] border-b border-[#E2E8F0]">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Portfolio Saved Successfully</span>
              </div>
              <h2 id="completion-title" className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
                Ready to Showcase Your Work!
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B]">
                Your portfolio is saved. Preview it, download the standalone website ZIP, or claim your free personal subdomain.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#64748B] hover:text-[#111827] hover:bg-[#F1F5F9] transition-colors shrink-0 cursor-pointer"
              aria-label="Close completion screen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: 3 Action Cards */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[72vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Preview Portfolio */}
            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#BFDBFE] transition-all shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
                  <Eye className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#111827]">1. Live Fullscreen Preview</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Inspect your portfolio exactly as recruiters will experience it with live interactive theme switching and responsive layouts.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose()
                  onPreview()
                }}
                rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                className="w-full text-xs font-semibold justify-center text-[#111827] border-[#E2E8F0] hover:bg-[#F8FAFC]"
              >
                Open Fullscreen Preview
              </Button>
            </div>

            {/* Card 2: Download Portfolio ZIP */}
            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#BFDBFE] transition-all shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
                  <Archive className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#111827]">2. Download Website ZIP</h3>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Standalone
                  </span>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Export your complete portfolio as a self-contained HTML/CSS/JS website. No server required; open index.html or deploy to GitHub Pages or Netlify.
                </p>
              </div>

              <div className="space-y-1.5">
                <Button
                  variant={zipStatus === 'downloaded' ? 'outline' : 'primary'}
                  size="sm"
                  onClick={handleDownloadZip}
                  disabled={zipStatus === 'generating' || !isContentSufficient}
                  className={`w-full text-xs font-semibold justify-center ${
                    zipStatus === 'downloaded'
                      ? 'border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      : ''
                  }`}
                  leftIcon={
                    zipStatus === 'generating' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : zipStatus === 'downloaded' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {zipStatus === 'generating'
                    ? zipProgressText || 'Packaging ZIP...'
                    : zipStatus === 'downloaded'
                      ? 'Re-download Portfolio ZIP'
                      : 'Download Standalone ZIP'}
                </Button>

                {zipStatus === 'downloaded' && (
                  <p className="text-[11px] text-emerald-600 font-medium text-center">
                    ✓ ZIP saved! You can re-download anytime.
                  </p>
                )}

                {zipErrorMessage && (
                  <p className="text-[11px] text-rose-600 font-medium text-center">
                    {zipErrorMessage}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Free Platform Subdomain Publishing */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#F8FAFC] to-white border-2 border-[#BFDBFE] shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]">3. Free Subdomain Publishing</h3>
                  <p className="text-xs text-[#64748B]">
                    Claim your personalized URL at <span className="font-mono font-medium text-[#2563EB]">yourname.{platformDomain}</span>
                  </p>
                </div>
              </div>

              {publishState === 'published' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>PUBLISHED & LIVE</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>FREE HOSTING</span>
                </span>
              )}
            </div>

            {/* If unauthenticated, show sign in gate */}
            {!user || !isConfigured ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">Authentication Required:</span> Sign in to claim your permanent subdomain and publish your live website.
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    onClose()
                    onOpenAuth()
                  }}
                  className="text-xs shrink-0 font-semibold"
                >
                  Sign In to Publish
                </Button>
              </div>
            ) : publishState === 'published' ? (
              /* Published State: View URL, Copy Link, Open Portfolio, and Unpublish option */
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Live Production Subdomain Active
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                      HTTPS Secured
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1 bg-white px-3.5 py-2 rounded-xl border border-emerald-200 font-mono text-xs sm:text-sm text-[#111827] truncate font-semibold select-all">
                      {publishedUrl}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant={copySuccess ? 'outline' : 'secondary'}
                        onClick={handleCopyLink}
                        leftIcon={
                          copySuccess ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )
                        }
                        className={`text-xs font-semibold ${
                          copySuccess ? 'border-emerald-400 text-emerald-700 bg-emerald-50' : ''
                        }`}
                      >
                        {copySuccess ? 'Copied!' : 'Copy Link'}
                      </Button>

                      <a
                        href={publishedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-xs"
                      >
                        <span>Open Portfolio</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#64748B] pt-1">
                  <span>Only published portfolios are publicly accessible.</span>
                  <button
                    type="button"
                    onClick={handleUnpublish}
                    disabled={isUnpublishing}
                    className="text-rose-600 hover:text-rose-700 font-medium hover:underline cursor-pointer disabled:opacity-50 text-[11px]"
                  >
                    {isUnpublishing ? 'Unpublishing...' : 'Unpublish temporarily'}
                  </button>
                </div>
              </div>
            ) : (
              /* Draft / Ready to Publish State: Subdomain Form */
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <label htmlFor="subdomain-slug-input" className="text-xs font-semibold text-[#111827] block">
                    Choose Your Free Platform Subdomain
                  </label>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1 flex items-center bg-white border border-[#E2E8F0] focus-within:border-[#2563EB] rounded-xl px-3 py-2 shadow-xs transition-colors">
                      <input
                        id="subdomain-slug-input"
                        type="text"
                        value={subdomainInput}
                        onChange={(e) => handleSlugInputChange(e.target.value)}
                        placeholder="yourname"
                        className="w-full bg-transparent text-xs sm:text-sm font-mono font-bold text-[#111827] focus:outline-none placeholder:text-[#94A3B8]"
                      />
                      <span className="font-mono text-xs sm:text-sm text-[#64748B] font-medium shrink-0 select-none pl-1">
                        .{platformDomain}
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handlePublish}
                      disabled={
                        publishState === 'publishing' ||
                        availabilityStatus === 'unavailable' ||
                        availabilityStatus === 'invalid' ||
                        !subdomainInput.trim()
                      }
                      leftIcon={
                        publishState === 'publishing' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )
                      }
                      className="text-xs font-bold shrink-0 px-4 py-2.5 justify-center shadow-sm"
                    >
                      {publishState === 'publishing' ? 'Publishing Subdomain...' : 'Publish Free Subdomain'}
                    </Button>
                  </div>

                  {/* Availability feedback */}
                  <div className="flex items-center gap-2 text-xs">
                    {availabilityStatus === 'checking' && (
                      <span className="text-[#64748B] flex items-center gap-1.5 font-mono text-[11px]">
                        <Loader2 className="w-3 h-3 animate-spin text-[#2563EB]" />
                        Checking availability...
                      </span>
                    )}
                    {availabilityStatus === 'available' && (
                      <span className="text-emerald-600 flex items-center gap-1.5 font-mono text-[11px] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {availabilityMessage}
                      </span>
                    )}
                    {(availabilityStatus === 'unavailable' || availabilityStatus === 'invalid') && (
                      <span className="text-rose-600 flex items-center gap-1.5 font-mono text-[11px] font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {availabilityMessage}
                      </span>
                    )}
                  </div>
                </div>

                {publishErrorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{publishErrorMessage}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Publishing assigns your slug securely in Supabase and activates public routing. You can unpublish or update at any time.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 sm:px-8 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-[#64748B]">
            All changes are saved. You can continue editing your sections anytime.
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-semibold text-[#111827] border-[#E2E8F0] hover:bg-white"
            >
              Continue Editing
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PortfolioCompletionModal
