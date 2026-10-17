import React from 'react'
import { X, FileDown, CheckCircle2, AlertTriangle, FileText } from 'lucide-react'
import { Button } from '../../../../components/ui/Button.tsx'
import { getResumeDraftSummary, convertResumeToPortfolio } from '../../resumeImport.ts'
import type { PortfolioData } from '../../types.ts'

export interface ResumeImportModalProps {
  isOpen: boolean
  onClose: () => void
  currentPortfolio: PortfolioData
  onConfirmImport: (importedData: PortfolioData) => void
}

export const ResumeImportModal: React.FC<ResumeImportModalProps> = ({
  isOpen,
  onClose,
  currentPortfolio,
  onConfirmImport,
}) => {
  if (!isOpen) return null

  const { summary, resumeData } = getResumeDraftSummary()

  const handleImport = () => {
    if (resumeData) {
      const merged = convertResumeToPortfolio(resumeData, currentPortfolio)
      onConfirmImport(merged)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl p-6 relative text-[#111827]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827]">Import from Resume Draft</h3>
              <p className="text-xs text-[#64748B]">Synchronize ATS profile to public portfolio</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="my-5 space-y-4 text-xs text-[#64748B]">
          {summary.hasResumeDraft && resumeData ? (
            <>
              <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] leading-relaxed">
                Found active resume draft for{' '}
                <strong className="text-[#111827]">{summary.fullName || 'Student'}</strong> (
                {summary.title || 'Candidate'}). You can import your verified credentials directly into your portfolio.
              </div>

              <div className="space-y-2 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#64748B] block mb-1">
                  Items to be imported:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-[#111827]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Personal Profile & Links</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#111827]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{summary.skillsCount} Technical Skill Tags</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#111827]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{summary.projectsCount} Projects</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#111827]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{summary.educationCount} Education Entries</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#111827]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{summary.experienceCount} Experience Roles</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#111827]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{summary.certificationsCount} Certifications</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Notice: Importing will update corresponding portfolio fields. Existing custom photos,
                  themes, and portfolio slug will be preserved.
                </span>
              </div>
            </>
          ) : (
            <div className="text-center py-6 space-y-3">
              <FileText className="w-10 h-10 text-[#94A3B8] mx-auto" />
              <p className="text-sm font-semibold text-[#111827]">
                No Saved Resume Draft Found
              </p>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                Create and save a draft in the Resume Builder first to enable seamless one-click importing.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-[#64748B] hover:text-[#111827]">
            Cancel
          </Button>
          {summary.hasResumeDraft && resumeData && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleImport}
              leftIcon={<FileDown className="w-4 h-4" />}
            >
              Confirm & Import Data
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResumeImportModal
