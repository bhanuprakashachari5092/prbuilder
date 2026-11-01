import React, { useState, useRef, useEffect } from 'react'
import { FileText, Download, Check, AlertCircle, Loader2, Printer, ChevronDown, Sparkles } from 'lucide-react'
import { Button, type ButtonProps } from '../ui/Button.tsx'
import type { ResumeData } from '../../pages/Resume/types.ts'
import { SAMPLE_RESUME_DATA } from '../../pages/Resume/sampleData.ts'
import { downloadResumePdf, hasSufficientResumeContent } from '../../services/resumeExportService.ts'
import { adminService } from '../../services/adminService.ts'

export interface ResumeDownloadButtonProps {
  data: ResumeData
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  className?: string
  label?: string
  showIcon?: boolean
}

export const ResumeDownloadButton: React.FC<ResumeDownloadButtonProps> = ({
  data,
  variant = 'primary',
  size = 'sm',
  className = '',
  label = 'Download Resume PDF',
  showIcon = true,
}) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showEmptyModal, setShowEmptyModal] = useState<boolean>(false)
  const [showMenu, setShowMenu] = useState<boolean>(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isSufficient = hasSufficientResumeContent(data)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const triggerExport = async (targetData: ResumeData, mode: 'direct' | 'print' = 'direct') => {
    setStatus('loading')
    setErrorMessage(null)
    setShowMenu(false)

    try {
      const result = await downloadResumePdf(targetData, { mode })

      if (result.success) {
        setStatus('success')
        adminService.recordDownloadEvent('resume_pdf', {
          title: targetData.title || targetData.personalInfo?.fullName || 'ATS Resume',
          ownerEmail: targetData.personalInfo?.email || 'student@prbuilder.me',
        })
        setTimeout(() => {
          setStatus('idle')
        }, 3500)
      } else {
        setStatus('error')
        setErrorMessage(result.error || 'Failed to generate PDF document.')
        setTimeout(() => {
          setStatus('idle')
        }, 4000)
      }
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Download failed.')
      setTimeout(() => {
        setStatus('idle')
      }, 4000)
    }
  }

  const handlePrimaryClick = () => {
    if (!isSufficient) {
      setShowEmptyModal(true)
      return
    }
    triggerExport(data, 'direct')
  }

  return (
    <>
      <div className="relative inline-flex items-center gap-0.5" ref={menuRef}>
        <div className="inline-flex flex-col items-start gap-1">
          <div className="inline-flex rounded-xl shadow-xs overflow-hidden">
            <Button
              variant={status === 'error' ? 'outline' : variant}
              size={size}
              onClick={handlePrimaryClick}
              disabled={status === 'loading'}
              className={`${className} ${
                status === 'success'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                  : status === 'error'
                    ? 'border-rose-300 text-rose-700 hover:bg-rose-50'
                    : ''
              }`}
              aria-label={label}
              title={
                isSufficient
                  ? 'Download ATS-compliant vector PDF file directly to your computer'
                  : 'Resume needs more content before downloading'
              }
              leftIcon={
                showIcon ? (
                  status === 'loading' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : status === 'success' ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : status === 'error' ? (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )
                ) : undefined
              }
            >
              {status === 'loading'
                ? 'Generating PDF...'
                : status === 'success'
                  ? 'PDF Downloaded!'
                  : status === 'error'
                    ? 'Export Failed'
                    : label}
            </Button>

            {/* Dropdown Options Toggle */}
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              disabled={status === 'loading'}
              className={`px-1.5 flex items-center justify-center border-l transition-colors cursor-pointer ${
                variant === 'outline' || variant === 'secondary'
                  ? 'bg-white hover:bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
                  : 'bg-[#1D4ED8] hover:bg-[#1E40AF] border-white/20 text-white'
              }`}
              title="More export options"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {errorMessage && (
            <span className="text-[11px] text-rose-600 font-medium animate-fadeIn">
              {errorMessage}
            </span>
          )}
        </div>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-[#E2E8F0] rounded-xl shadow-xl p-1.5 z-40 text-xs text-[#111827] space-y-1 animate-fadeIn">
            <button
              type="button"
              onClick={() => {
                if (!isSufficient) {
                  setShowEmptyModal(true)
                  return
                }
                triggerExport(data, 'direct')
              }}
              className="w-full flex items-start gap-2.5 px-3 py-2 text-left rounded-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
            >
              <Download className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#111827] group-hover:text-[#2563EB]">
                  Direct PDF Download
                </p>
                <p className="text-[10px] text-[#64748B]">
                  Saves ATS-ready .pdf file straight to Downloads folder
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isSufficient) {
                  setShowEmptyModal(true)
                  return
                }
                triggerExport(data, 'print')
              }}
              className="w-full flex items-start gap-2.5 px-3 py-2 text-left rounded-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
            >
              <Printer className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#111827] group-hover:text-[#2563EB]">
                  Print / Save via Browser
                </p>
                <p className="text-[10px] text-[#64748B]">
                  Opens browser system print dialog with A4 layout
                </p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Empty State Guidance Modal */}
      {showEmptyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl p-6 space-y-4 text-[#111827]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-[#111827]">Resume Content Needed</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Complete minimum required fields to generate your ATS resume PDF
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#64748B] leading-relaxed bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
              <p className="text-[#111827] font-medium">
                To generate a recruiter-grade ATS resume, please enter at least:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Your full name and professional title</li>
                <li>At least one education, experience, or technical skill entry</li>
              </ul>
              <p className="text-[11px] text-[#64748B] pt-1">
                Want to test the download immediately? Download our pre-populated recruiter-grade sample resume below!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowEmptyModal(false)
                  triggerExport(data, 'direct')
                }}
                className="text-xs"
                title="Download whatever content is currently typed"
              >
                Download Draft Anyway
              </Button>

              <Button
                variant="glow"
                size="sm"
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                onClick={() => {
                  setShowEmptyModal(false)
                  triggerExport(SAMPLE_RESUME_DATA, 'direct')
                }}
                className="text-xs font-semibold"
                title="Download Rahul Sharma sample ATS resume PDF"
              >
                Download Sample Resume PDF
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowEmptyModal(false)}
                className="text-xs"
              >
                Edit Resume
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ResumeDownloadButton

