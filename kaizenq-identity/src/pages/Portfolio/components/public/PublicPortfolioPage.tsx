import React, { useState, useEffect } from 'react'
import { Lock, Home, Sparkles } from 'lucide-react'
import { loadPortfolioDraft } from '../../storage.ts'
import type { PortfolioData, PortfolioThemeId } from '../../types.ts'
import { PublicPortfolioView } from './PublicPortfolioView.tsx'
import { portfolioService, type PublishedPortfolioResult } from '../../../../services/portfolioService.ts'
import { Button } from '../../../../components/ui/Button.tsx'
import { getApexUrl, getSubdomainFromHostname } from '../../../../lib/domainUtils.ts'

export interface PublicPortfolioPageProps {
  slug?: string
  onBackToBuilder?: () => void
  onBackToDashboard?: () => void
  onNavigateHome?: () => void
}

export const PublicPortfolioPage: React.FC<PublicPortfolioPageProps> = ({
  slug,
  onBackToBuilder,
  onBackToDashboard,
  onNavigateHome,
}) => {
  const [loading, setLoading] = useState<boolean>(true)
  const [publishedData, setPublishedData] = useState<PublishedPortfolioResult | null>(null)
  const [notFound, setNotFound] = useState<boolean>(false)

  // Local fallback draft
  const [localData, setLocalData] = useState<PortfolioData>(() => {
    return loadPortfolioDraft().data
  })

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setNotFound(false)

    // 1. If slug is provided directly
    if (slug) {
      portfolioService
        .getPublishedPortfolio(slug)
        .then(({ data, error }) => {
          if (!isMounted) return

          if (error || !data) {
            setNotFound(true)
          } else {
            setPublishedData(data)
            if (typeof document !== 'undefined') {
              document.title = `${data.portfolioData.profile.fullName || 'Professional'} | PR Builder`
            }
          }
        })
        .catch(() => {
          if (isMounted) setNotFound(true)
        })
        .finally(() => {
          if (isMounted) setLoading(false)
        })
      return () => {
        isMounted = false
      }
    }

    // 2. If no slug provided, attempt resolution from window.location.hostname
    if (typeof window !== 'undefined') {
      portfolioService
        .getPublishedPortfolioByHostname(window.location.hostname)
        .then(({ data, error }) => {
          if (!isMounted) return

          if (error || !data) {
            setNotFound(true)
          } else {
            setPublishedData(data)
            if (typeof document !== 'undefined') {
              document.title = `${data.portfolioData.profile.fullName || 'Professional'} | PR Builder`
            }
          }
        })
        .catch(() => {
          if (isMounted) setNotFound(true)
        })
        .finally(() => {
          if (isMounted) setLoading(false)
        })
    } else {
      setLoading(false)
      setNotFound(true)
    }

    return () => {
      isMounted = false
    }
  }, [slug])

  // Toggle theme for preview or public view
  const handleToggleTheme = (newTheme: PortfolioThemeId) => {
    if (publishedData) {
      setPublishedData({
        ...publishedData,
        portfolioData: {
          ...publishedData.portfolioData,
          theme: newTheme,
        },
      })
    } else {
      setLocalData({
        ...localData,
        theme: newTheme,
      })
    }
  }

  // Safe navigation handler that breaks out of subdomains to prevent redirect loops
  const handleGoHome = () => {
    if (typeof window !== 'undefined') {
      const isSub = getSubdomainFromHostname(window.location.hostname)
      if (isSub) {
        window.location.href = getApexUrl()
        return
      }
    }
    if (onBackToDashboard) {
      onBackToDashboard()
    } else if (onNavigateHome) {
      onNavigateHome()
    } else if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  const handleCreatePortfolio = () => {
    if (typeof window !== 'undefined') {
      const isSub = getSubdomainFromHostname(window.location.hostname)
      if (isSub) {
        window.location.href = `${getApexUrl()}?route=builder`
        return
      }
    }
    if (onBackToBuilder) {
      onBackToBuilder()
    }
  }

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] text-[#111827] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#E2E8F0] border-t-[#2563EB] animate-spin" />
        <p className="text-sm font-mono text-[#64748B]">Loading verified public portfolio...</p>
      </div>
    )
  }

  // 2. 404 / Unpublished State (Security: Does not disclose whether record exists privately)
  if (notFound) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] text-[#111827] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] text-[#2563EB] mx-auto flex items-center justify-center border border-[#BFDBFE]">
            <Lock className="w-7 h-7 opacity-80" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
              404 • Portfolio Unavailable
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">
              Portfolio Not Found
            </h1>
            <p className="text-xs text-[#64748B] leading-relaxed">
              This portfolio is either unpublished, still in draft mode, or does not exist. Portfolios are publicly accessible only after an explicit publication by their owner.
            </p>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center gap-3 justify-center">
            <Button
              variant="primary"
              size="sm"
              onClick={handleGoHome}
              leftIcon={<Home className="w-4 h-4" />}
              className="text-xs w-full sm:w-auto"
            >
              Go to PR Builder Home
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCreatePortfolio}
              leftIcon={<Sparkles className="w-4 h-4 text-[#2563EB]" />}
              className="text-xs w-full sm:w-auto text-[#111827]"
            >
              Build Your Own
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 3. Render Public View (Published Cloud Data or Local Preview Fallback)
  const renderData = publishedData ? publishedData.portfolioData : localData

  return (
    <PublicPortfolioView
      data={renderData}
      onToggleTheme={handleToggleTheme}
      isPreviewMode={!publishedData}
      onBackToBuilder={onBackToBuilder}
    />
  )
}

export default PublicPortfolioPage
