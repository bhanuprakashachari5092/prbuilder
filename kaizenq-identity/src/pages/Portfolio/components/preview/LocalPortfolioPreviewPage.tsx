import React, { useState } from 'react'
import {
  LayoutDashboard,
  Monitor,
  Tablet,
  Smartphone,
  Edit3,
  FileText,
  Palette,
} from 'lucide-react'
import { Button } from '../../../../components/ui/Button.tsx'
import { PortfolioDownloadButton } from '../../../../components/download/PortfolioDownloadButton.tsx'
import { loadPortfolioDraft, savePortfolioDraft } from '../../storage.ts'
import type { PortfolioData, PortfolioThemeId } from '../../types.ts'
import { PublicPortfolioView } from '../public/PublicPortfolioView.tsx'

export interface LocalPortfolioPreviewPageProps {
  onBackToEditor: () => void
  onBackToDashboard: () => void
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile'

export const LocalPortfolioPreviewPage: React.FC<LocalPortfolioPreviewPageProps> = ({
  onBackToEditor,
  onBackToDashboard,
}) => {
  const [data, setData] = useState<PortfolioData>(() => {
    return loadPortfolioDraft().data
  })
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop')

  const activeTheme = data.theme === 'midnight' ? 'modern' : data.theme || 'modern'

  const handleToggleTheme = (newTheme: PortfolioThemeId) => {
    const updated = {
      ...data,
      theme: newTheme,
    }
    setData(updated)
    savePortfolioDraft(updated)
  }

  // Device width wrapper
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

  // Check if portfolio is completely empty
  const hasSkills =
    data.skills.languages.length > 0 ||
    data.skills.frameworks.length > 0 ||
    data.skills.tools.length > 0 ||
    data.skills.otherSkills.length > 0

  const isEmpty =
    !data.profile.fullName.trim() &&
    !data.profile.title.trim() &&
    !data.profile.aboutMe.trim() &&
    data.projects.length === 0 &&
    data.education.length === 0 &&
    !hasSkills

  const themeOptions: { id: PortfolioThemeId; label: string }[] = [
    { id: 'modern', label: 'Modern' },
    { id: 'developer', label: 'Developer' },
    { id: 'minimal', label: 'Minimal' },
    { id: 'creative', label: 'Creative' },
  ]

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col text-[#111827]">
      {/* 1. Mandatory Honest Notice Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-800 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px]">
            LOCAL PREVIEW — NOT PUBLICLY PUBLISHED
          </span>
          <span className="hidden sm:inline text-amber-300">•</span>
          <span className="text-[11px] text-[#64748B] hidden sm:inline">
            Renders local draft stored in this browser. Public hosting and URL sharing are not yet active.
          </span>
        </div>

        <span className="text-[11px] font-mono text-[#64748B]">
          Browser Storage Active
        </span>
      </div>

      {/* 2. Top Preview Control Bar */}
      <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-[41px] z-40 select-none text-[#111827]">
        {/* Navigation Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToDashboard}
            leftIcon={<LayoutDashboard className="w-3.5 h-3.5" />}
            className="text-xs text-[#64748B] hover:text-[#111827]"
          >
            Dashboard
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onBackToEditor}
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Back to Editor
          </Button>
        </div>

        {/* Viewport Width Controls (Desktop, Tablet, Mobile) */}
        <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0]">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              deviceMode === 'desktop'
                ? 'bg-[#EFF6FF] text-[#2563EB] shadow-xs'
                : 'text-[#64748B] hover:text-[#111827]'
            }`}
            title="Desktop View (100%)"
            aria-label="Desktop view"
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
            aria-label="Tablet view"
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
            aria-label="Mobile view"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Theme Preview Switcher & Download Action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#111827]">
            <Palette className="w-3.5 h-3.5 text-[#2563EB]" />
            <select
              value={activeTheme}
              onChange={(e) => handleToggleTheme(e.target.value as PortfolioThemeId)}
              className="bg-transparent text-xs text-[#111827] font-medium focus:outline-none cursor-pointer pr-1"
              aria-label="Select Preview Theme"
            >
              {themeOptions.map((t) => (
                <option key={t.id} value={t.id} className="bg-white text-[#111827]">
                  {t.label} Theme
                </option>
              ))}
            </select>
          </div>

          <PortfolioDownloadButton
            data={data}
            variant="glow"
            size="sm"
            label="Download ZIP"
            className="text-xs font-semibold"
          />
        </div>
      </header>

      {/* 3. Empty State Warning if no data has been populated */}
      {isEmpty && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Your portfolio is currently empty. Open the builder to populate your name, skills, and projects, or load sample data.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onBackToEditor}
            className="text-xs border-amber-300 text-amber-900"
          >
            Open Editor
          </Button>
        </div>
      )}

      {/* 4. Simulated Frame Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start bg-[#F1F5F9]">
        <div
          className={`${getContainerMaxWidth()} transition-all duration-300 shadow-xl shadow-slate-300/60 rounded-2xl overflow-hidden border border-[#E2E8F0]`}
        >
          <PublicPortfolioView
            data={data}
            onToggleTheme={handleToggleTheme}
            isPreviewMode={true}
          />
        </div>
      </div>
    </div>
  )
}

export default LocalPortfolioPreviewPage
