import React, { useState } from 'react'
import {
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  Palette,
  Globe,
} from 'lucide-react'
import type { PortfolioData, PortfolioThemeId } from '../../types.ts'
import { PublicPortfolioView } from '../public/PublicPortfolioView.tsx'
import { copyToClipboard } from '../../../../lib/utils.ts'
import { PortfolioDownloadButton } from '../../../../components/download/PortfolioDownloadButton.tsx'

export interface PortfolioPreviewFrameProps {
  data: PortfolioData
  onChangeTheme: (theme: PortfolioThemeId) => void
  onOpenPublicView: () => void
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile'

export const PortfolioPreviewFrame: React.FC<PortfolioPreviewFrameProps> = ({
  data,
  onChangeTheme,
  onOpenPublicView,
}) => {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop')
  const [copied, setCopied] = useState(false)

  const activeTheme = data.theme === 'midnight' ? 'modern' : data.theme || 'modern'

  const handleCopyLink = async () => {
    const slug = data.profile.slug || 'portfolio'
    const previewUrl = `${window.location.origin}/?route=public-portfolio&slug=${slug}`
    await copyToClipboard(previewUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Device width constraints for simulated frame
  const getContainerMaxWidth = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'max-w-[390px]'
      case 'tablet':
        return 'max-w-[768px]'
      case 'desktop':
      default:
        return 'w-full'
    }
  }

  const themeOptions: { id: PortfolioThemeId; label: string }[] = [
    { id: 'modern', label: 'Modern' },
    { id: 'developer', label: 'Developer' },
    { id: 'minimal', label: 'Minimal' },
    { id: 'creative', label: 'Creative' },
  ]

  return (
    <div className="flex flex-col h-full bg-[#F1F5F9]">
      {/* Top Preview Control Bar */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-2.5 flex items-center justify-between text-xs text-[#64748B] select-none">
        {/* Left: Device viewport toggles */}
        <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0]">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              deviceMode === 'desktop'
                ? 'bg-[#EFF6FF] text-[#2563EB] shadow-xs'
                : 'text-[#64748B] hover:text-[#111827]'
            }`}
            title="Desktop View (100%)"
            aria-label="Desktop preview"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeviceMode('tablet')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              deviceMode === 'tablet'
                ? 'bg-[#EFF6FF] text-[#2563EB] shadow-xs'
                : 'text-[#64748B] hover:text-[#111827]'
            }`}
            title="Tablet View (768px)"
            aria-label="Tablet preview"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              deviceMode === 'mobile'
                ? 'bg-[#EFF6FF] text-[#2563EB] shadow-xs'
                : 'text-[#64748B] hover:text-[#111827]'
            }`}
            title="Mobile View (390px)"
            aria-label="Mobile preview"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Simulated preview indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] font-mono text-[#111827] max-w-xs truncate">
          <Globe className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
          <span className="text-[#2563EB] truncate font-medium">
            local-preview: {data.profile.slug || 'portfolio'}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Quick Switcher */}
          <div className="flex items-center gap-1 bg-[#F8FAFC] px-2 py-1 rounded-lg border border-[#E2E8F0] text-[11px]">
            <Palette className="w-3 h-3 text-[#2563EB] shrink-0" />
            <select
              value={activeTheme}
              onChange={(e) => onChangeTheme(e.target.value as PortfolioThemeId)}
              className="bg-transparent text-[#111827] font-medium focus:outline-none cursor-pointer pr-1"
              aria-label="Preview Theme"
            >
              {themeOptions.map((t) => (
                <option key={t.id} value={t.id} className="bg-white text-[#111827]">
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Copy Preview Link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#111827] border border-[#E2E8F0] transition-colors cursor-pointer text-[11px]"
            title="Copy local preview link"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copy Link</span>
              </>
            )}
          </button>

          {/* Download Portfolio ZIP */}
          <PortfolioDownloadButton
            data={data}
            variant="outline"
            size="sm"
            label="ZIP"
            className="text-[11px] py-1 px-2 border-[#E2E8F0] text-[#111827] hover:bg-[#F8FAFC]"
          />

          {/* Open Dedicated Local Preview */}
          <button
            onClick={onOpenPublicView}
            className="p-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#111827] border border-[#E2E8F0] transition-colors cursor-pointer"
            title="Open Dedicated Local Preview Page"
            aria-label="Open local preview"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Frame Viewport Scroll Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center items-start bg-[#F1F5F9]">
        <div
          className={`${getContainerMaxWidth()} transition-all duration-300 shadow-xl shadow-slate-300/60 rounded-2xl overflow-hidden border border-[#E2E8F0]`}
        >
          <PublicPortfolioView
            data={data}
            onToggleTheme={onChangeTheme}
            isPreviewMode={true}
          />
        </div>
      </div>
    </div>
  )
}

export default PortfolioPreviewFrame
