import React, { useState } from 'react'
import {
  ArrowLeft,
  Save,
  Check,
  RotateCcw,
  Palette,
  Eye,
  Edit3,
  ExternalLink,
  FileDown,
  Globe,
  Sparkles,
} from 'lucide-react'
import { Button } from '../../../../components/ui/Button.tsx'
import { PortfolioDownloadButton } from '../../../../components/download/PortfolioDownloadButton.tsx'
import type { PortfolioData, PortfolioThemeId } from '../../types.ts'

export interface PortfolioToolbarProps {
  data: PortfolioData
  onChangeSlug: (slug: string) => void
  onChangeTheme: (theme: PortfolioThemeId) => void
  onSaveDraft: () => void
  isSaved: boolean
  lastSavedText: string
  onLoadSample: () => void
  onClearAll: () => void
  onOpenImportModal: () => void
  onViewPublic: () => void
  onOpenCompletionModal?: () => void
  onBack?: () => void
  mobileView: 'editor' | 'preview'
  onToggleMobileView: (view: 'editor' | 'preview') => void
}

export const PortfolioToolbar: React.FC<PortfolioToolbarProps> = ({
  data,
  onChangeSlug,
  onChangeTheme,
  onSaveDraft,
  isSaved,
  lastSavedText,
  onLoadSample,
  onClearAll,
  onOpenImportModal,
  onViewPublic,
  onOpenCompletionModal,
  onBack,
  mobileView,
  onToggleMobileView,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const activeTheme = data.theme === 'midnight' ? 'modern' : data.theme || 'modern'

  return (
    <div className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-3.5 sticky top-0 z-30 select-none text-[#111827]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Back Button & Slug / Handle Indicator */}
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#111827] border border-[#E2E8F0] transition-colors cursor-pointer shrink-0"
              title="Return to Dashboard"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm text-[#111827]">
              <Globe className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
              <span className="text-[#64748B]">portfolio/</span>
              <input
                type="text"
                value={data.profile.slug}
                onChange={(e) => onChangeSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="your-slug"
                className="bg-transparent font-bold text-[#111827] hover:border-b hover:border-[#CBD5E1] focus:border-b focus:border-[#2563EB] focus:outline-none transition-colors max-w-[140px] sm:max-w-[200px]"
                title="Click to edit portfolio slug handle"
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono text-[#64748B] mt-0.5">
              <span className="flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSaved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                  }`}
                />
                {lastSavedText}
              </span>
              <span>•</span>
              <span className="text-[#2563EB]">Local Draft Secured</span>
            </div>
          </div>
        </div>

        {/* Center: Mobile Toggle & Theme Switcher */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5">
          {/* Mobile View Toggle Switch */}
          <div className="lg:hidden flex items-center bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0]">
            <button
              onClick={() => onToggleMobileView('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mobileView === 'editor'
                  ? 'bg-[#EFF6FF] text-[#2563EB] shadow-xs font-semibold border border-[#BFDBFE]'
                  : 'text-[#64748B]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
            <button
              onClick={() => onToggleMobileView('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mobileView === 'preview'
                  ? 'bg-[#EFF6FF] text-[#2563EB] shadow-xs font-semibold border border-[#BFDBFE]'
                  : 'text-[#64748B]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          {/* Theme Selector (All 4 Themes: Modern, Developer, Minimal, Creative) */}
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-2.5 py-1.5 rounded-xl border border-[#E2E8F0]">
            <Palette className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
            <select
              value={activeTheme}
              onChange={(e) => onChangeTheme(e.target.value as PortfolioThemeId)}
              className="bg-transparent text-xs text-[#111827] font-medium focus:outline-none cursor-pointer pr-1"
              aria-label="Select Portfolio Theme"
            >
              <option value="modern" className="bg-white text-[#111827]">
                Modern (PR Builder Signature)
              </option>
              <option value="developer" className="bg-white text-[#111827]">
                Developer (Terminal & Code)
              </option>
              <option value="minimal" className="bg-white text-[#111827]">
                Minimal (Clean Editorial)
              </option>
              <option value="creative" className="bg-white text-[#111827]">
                Creative (Vibrant Gradient)
              </option>
            </select>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center flex-wrap gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenImportModal}
            leftIcon={<FileDown className="w-3.5 h-3.5 text-[#2563EB]" />}
            title="Import profile & projects from existing resume"
            className="text-xs text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC]"
          >
            Import Resume
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadSample}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />}
            title="Load authentic demo portfolio data"
            className="text-xs text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC]"
          >
            Load Sample
          </Button>

          {showClearConfirm ? (
            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
              <span className="text-[11px] text-rose-700">Clear all data?</span>
              <button
                onClick={() => {
                  onClearAll()
                  setShowClearConfirm(false)
                }}
                className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer"
              >
                Yes
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="text-[11px] text-[#64748B] hover:underline cursor-pointer ml-1"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              title="Reset portfolio data"
              className="p-2 rounded-lg text-[#64748B] hover:text-red-500 hover:bg-[#F8FAFC] transition-colors cursor-pointer text-xs"
              aria-label="Reset portfolio data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onSaveDraft}
            leftIcon={isSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Save className="w-3.5 h-3.5" />}
            className="text-xs text-[#111827]"
          >
            {isSaved ? 'Draft Saved' : 'Save Draft'}
          </Button>

          <PortfolioDownloadButton
            data={data}
            variant="outline"
            size="sm"
            label="Download ZIP"
            className="text-xs border-[#E2E8F0] text-[#111827] hover:bg-[#F8FAFC]"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={onViewPublic}
            rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
            className="text-xs"
            title="Open dedicated preview page"
          >
            Local Preview
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onOpenCompletionModal || onSaveDraft}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
            className="text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs"
            title="Complete, export and publish your portfolio to free platform subdomain"
          >
            Publish & Export
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PortfolioToolbar
