import React, { useState, useRef, useEffect } from 'react'
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
  Sliders,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react'
import { Button } from '../../../../components/ui/Button.tsx'
import { PortfolioDownloadButton } from '../../../../components/download/PortfolioDownloadButton.tsx'
import type { PortfolioData, PortfolioThemeId, PortfolioCustomization } from '../../types.ts'

export interface PortfolioToolbarProps {
  data: PortfolioData
  onChangeSlug: (slug: string) => void
  onChangeTheme: (theme: PortfolioThemeId) => void
  isThemeUnlocked?: (id: PortfolioThemeId) => boolean
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
  onChangeCustomization?: (customization: PortfolioCustomization) => void
}

export const PortfolioToolbar: React.FC<PortfolioToolbarProps> = ({
  data,
  onChangeSlug,
  onChangeTheme,
  isThemeUnlocked,
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
  onChangeCustomization,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showStyleMenu, setShowStyleMenu] = useState(false)
  const [showOverflowMenu, setShowOverflowMenu] = useState(false)

  const overflowRef = useRef<HTMLDivElement | null>(null)
  const styleRef = useRef<HTMLDivElement | null>(null)

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(event.target as Node)) {
        setShowOverflowMenu(false)
      }
      if (styleRef.current && !styleRef.current.contains(event.target as Node)) {
        setShowStyleMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const activeTheme = data.theme === 'midnight' ? 'modern' : data.theme || 'modern'

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 sticky top-0 z-30 select-none text-slate-900">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Navigation, Handle & Unified Save Status */}
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Return to Dashboard"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1 font-mono text-xs text-slate-800">
              <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-slate-400">portfolio/</span>
              <input
                type="text"
                value={data.profile.slug}
                onChange={(e) => onChangeSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="your-slug"
                className="bg-transparent font-semibold text-slate-900 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 px-1 rounded transition-all max-w-[120px] sm:max-w-[180px] truncate"
                title="Click to edit public portfolio slug handle"
              />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isSaved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                }`}
              />
              <span className="truncate">{lastSavedText}</span>
            </div>
          </div>
        </div>

        {/* Center: Mobile Editor/Preview & Theme Controls */}
        <div className="flex items-center gap-2">
          {/* Mobile Screen Toggle (Editor vs Preview) */}
          <div className="lg:hidden flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => onToggleMobileView('editor')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-all ${
                mobileView === 'editor'
                  ? 'bg-white text-blue-600 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Editor</span>
            </button>
            <button
              onClick={() => onToggleMobileView('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-all ${
                mobileView === 'preview'
                  ? 'bg-white text-blue-600 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
          </div>

          {/* Quick Theme Selector Dropdown */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs transition-colors">
            <Palette className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={activeTheme}
              onChange={(e) => onChangeTheme(e.target.value as PortfolioThemeId)}
              className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer pr-1"
              aria-label="Select Portfolio Theme"
            >
              <option value="developer">Developer (Free)</option>
              <option value="minimal">Minimal (Free)</option>
              <option value="midnight">Midnight (Free)</option>
              <option value="creative">
                Creative Studio {isThemeUnlocked?.('creative') ? '✓' : '🔒 Pro'}
              </option>
              <option value="modern">
                Modern Clean {isThemeUnlocked?.('modern') ? '✓' : '🔒 Pro'}
              </option>
            </select>
          </div>

          {/* Theme Customization Popover */}
          <div className="relative" ref={styleRef}>
            <button
              onClick={() => setShowStyleMenu(!showStyleMenu)}
              className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              title="Customize accent colors, layout density, and animations"
              aria-label="Theme styling"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline">Styling</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showStyleMenu && (
              <div className="absolute right-0 sm:left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-40 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    Customization Options
                  </span>
                  <button
                    onClick={() => setShowStyleMenu(false)}
                    className="text-slate-400 hover:text-slate-900 font-semibold cursor-pointer"
                  >
                    Done
                  </button>
                </div>

                {/* Accent Color Palette */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Brand Accent
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { label: 'Emerald', color: '#10B981' },
                      { label: 'Royal Blue', color: '#2563EB' },
                      { label: 'Cyan', color: '#06B6D4' },
                      { label: 'Violet', color: '#8B5CF6' },
                      { label: 'Amber', color: '#F59E0B' },
                      { label: 'Rose', color: '#F43F5E' },
                    ].map((c) => (
                      <button
                        key={c.color}
                        onClick={() =>
                          onChangeCustomization?.({
                            ...data.customization,
                            accentColor: c.color,
                          })
                        }
                        style={{ backgroundColor: c.color }}
                        className={`w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 flex items-center justify-center ${
                          (data.customization?.accentColor || '#10B981') === c.color
                            ? 'ring-2 ring-offset-2 ring-blue-600 scale-105'
                            : ''
                        }`}
                        title={c.label}
                        aria-label={`Select ${c.label} accent color`}
                      />
                    ))}
                    <input
                      type="color"
                      value={data.customization?.accentColor || '#10B981'}
                      onChange={(e) =>
                        onChangeCustomization?.({
                          ...data.customization,
                          accentColor: e.target.value,
                        })
                      }
                      className="w-6 h-6 rounded-md cursor-pointer border-0 p-0"
                      title="Custom color hex"
                    />
                  </div>
                </div>

                {/* Layout Density */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Spacing Density
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'compact', label: 'Compact' },
                      { id: 'normal', label: 'Balanced' },
                      { id: 'relaxed', label: 'Spacious' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() =>
                          onChangeCustomization?.({
                            ...data.customization,
                            layoutDensity: s.id as 'compact' | 'normal' | 'relaxed',
                          })
                        }
                        className={`px-2 py-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                          (data.customization?.layoutDensity || 'normal') === s.id
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Animations Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-medium text-slate-700">Micro-Animations</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.customization?.animationsEnabled !== false}
                      onChange={(e) =>
                        onChangeCustomization?.({
                          ...data.customization,
                          animationsEnabled: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions Group */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop Secondary Actions */}
          <div className="hidden xl:flex items-center gap-1.5">
            <button
              onClick={onOpenImportModal}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Import from ATS resume"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600" />
              <span>Import</span>
            </button>

            <button
              onClick={onLoadSample}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Load demo sample data"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Sample</span>
            </button>

            {showClearConfirm ? (
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg text-xs">
                <span className="text-rose-700 font-medium text-[11px]">Clear?</span>
                <button
                  onClick={() => {
                    onClearAll()
                    setShowClearConfirm(false)
                  }}
                  className="text-rose-600 font-bold hover:underline cursor-pointer text-[11px]"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="text-slate-500 hover:underline cursor-pointer text-[11px]"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                title="Reset portfolio data"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                aria-label="Reset portfolio data"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onSaveDraft}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="Save changes to draft"
            >
              {isSaved ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Save className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <PortfolioDownloadButton
              data={data}
              variant="outline"
              size="sm"
              label="Download"
              className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50"
            />

            <button
              onClick={onViewPublic}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="Open dedicated preview page"
            >
              <span>Preview</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* Compact Overflow Menu (< xl screens) */}
          <div className="relative xl:hidden" ref={overflowRef}>
            <button
              onClick={() => setShowOverflowMenu(!showOverflowMenu)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
              title="More actions"
              aria-label="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showOverflowMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-40 text-xs animate-in fade-in zoom-in-95 duration-100 space-y-0.5">
                <button
                  onClick={() => {
                    onOpenImportModal()
                    setShowOverflowMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-blue-600" />
                  <span>Import Resume</span>
                </button>
                <button
                  onClick={() => {
                    onLoadSample()
                    setShowOverflowMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Load Sample Data</span>
                </button>
                <button
                  onClick={() => {
                    onSaveDraft()
                    setShowOverflowMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-slate-500" />
                  <span>Save Draft</span>
                </button>
                <button
                  onClick={() => {
                    onViewPublic()
                    setShowOverflowMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>Local Preview</span>
                </button>
                <div onClick={() => setShowOverflowMenu(false)}>
                  <PortfolioDownloadButton
                    data={data}
                    variant="ghost"
                    size="sm"
                    label="Download ZIP"
                    className="w-full justify-start text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer rounded-none font-normal border-0"
                  />
                </div>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => {
                    onClearAll()
                    setShowOverflowMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Data</span>
                </button>
              </div>
            )}
          </div>

          {/* Primary Action Button: Publish & Export */}
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenCompletionModal || onSaveDraft}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
            className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs px-3.5 py-1.5 h-8 rounded-lg cursor-pointer transition-all"
            title="Complete, export and publish your portfolio"
          >
            Publish & Export
          </Button>
        </div>
      </div>
    </header>
  )
}

export default PortfolioToolbar
