import React, { useState } from 'react'
import {
  ArrowLeft,
  Save,
  Check,
  RotateCcw,
  Layout,
  Eye,
  Edit3,
  Printer,
  Sparkles,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button.tsx'
import { ResumeDownloadButton } from '../../../components/download/ResumeDownloadButton.tsx'
import type { ResumeData, ResumeTemplateId } from '../types.ts'

export interface ResumeToolbarProps {
  data: ResumeData
  onChangeTitle: (title: string) => void
  onChangeTemplate: (template: ResumeTemplateId) => void
  onSaveDraft: () => void
  isSaved: boolean
  lastSavedText: string
  onOpenPrintModal: () => void
  onLoadSample: () => void
  onClearAll: () => void
  onBack?: () => void
  mobileView: 'editor' | 'preview'
  onToggleMobileView: (view: 'editor' | 'preview') => void
}

export const ResumeToolbar: React.FC<ResumeToolbarProps> = ({
  data,
  onChangeTitle,
  onChangeTemplate,
  onSaveDraft,
  isSaved,
  lastSavedText,
  onOpenPrintModal,
  onLoadSample,
  onClearAll,
  onBack,
  mobileView,
  onToggleMobileView,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  return (
    <div className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-3.5 no-print sticky top-0 z-30 text-[#111827]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Back Button & Resume Title */}
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
            <input
              type="text"
              value={data.title}
              onChange={(e) => onChangeTitle(e.target.value)}
              placeholder="Resume Title..."
              className="w-full bg-transparent font-bold text-sm sm:text-base text-[#111827] hover:border-b hover:border-[#E2E8F0] focus:border-b focus:border-[#2563EB] focus:outline-none transition-colors truncate"
              title="Click to rename resume title"
            />
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
              <span className="text-[#64748B]">Local Draft Secured</span>
            </div>
          </div>
        </div>

        {/* Center / Mobile Toggle & Template Selector */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5">
          {/* Mobile View Toggle Switch */}
          <div className="lg:hidden flex items-center bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0]">
            <button
              onClick={() => onToggleMobileView('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mobileView === 'editor'
                  ? 'bg-white text-[#111827] shadow-sm font-semibold'
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
                  ? 'bg-white text-[#111827] shadow-sm font-semibold'
                  : 'text-[#64748B]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          {/* Template Selector (All 4 Templates: Classic, Modern, Technical, Minimal) */}
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-2.5 py-1.5 rounded-xl border border-[#E2E8F0]">
            <Layout className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
            <select
              value={data.template}
              onChange={(e) => onChangeTemplate(e.target.value as ResumeTemplateId)}
              className="bg-transparent text-xs text-[#111827] font-medium focus:outline-none cursor-pointer pr-1"
              aria-label="Select Resume Template"
            >
              <option value="modern-professional" className="bg-white text-[#111827]">
                Modern Professional
              </option>
              <option value="classic-ats" className="bg-white text-[#111827]">
                Classic ATS (Single-Column)
              </option>
              <option value="technical" className="bg-white text-[#111827]">
                Technical Developer
              </option>
              <option value="minimal" className="bg-white text-[#111827]">
                Minimal Editorial
              </option>
            </select>
          </div>
        </div>

        {/* Right: Actions (Sample, Reset, Save, Print) */}
        <div className="flex items-center flex-wrap gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadSample}
            title="Load authentic demo resume data"
            className="text-xs text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC]"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-[#2563EB]" />
            Sample Data
          </Button>

          {showClearConfirm ? (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
              <span className="text-[11px] text-red-600">Clear all data?</span>
              <button
                onClick={() => {
                  onClearAll()
                  setShowClearConfirm(false)
                }}
                className="text-[11px] text-red-600 font-bold hover:underline cursor-pointer"
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
              title="Clear all fields"
              className="p-2 rounded-lg text-[#64748B] hover:text-red-600 hover:bg-[#F8FAFC] transition-colors cursor-pointer text-xs"
              aria-label="Reset resume data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onSaveDraft}
            leftIcon={isSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Save className="w-3.5 h-3.5" />}
            className="text-xs border-[#E2E8F0] text-[#111827] hover:bg-[#F8FAFC]"
          >
            {isSaved ? 'Draft Saved' : 'Save Draft'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenPrintModal}
            leftIcon={<Printer className="w-3.5 h-3.5 text-[#2563EB]" />}
            className="text-xs border-[#E2E8F0] text-[#111827] hover:bg-[#F8FAFC]"
            title="Open browser print-to-PDF guide"
          >
            Print Guide
          </Button>

          <ResumeDownloadButton
            data={data}
            variant="glow"
            size="sm"
            label="Download Resume PDF"
            className="text-xs font-semibold"
          />
        </div>
      </div>
    </div>
  )
}

export default ResumeToolbar
