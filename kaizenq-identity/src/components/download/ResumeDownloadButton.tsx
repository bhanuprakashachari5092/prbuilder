import React, { useState } from 'react'
import { FileText, Download, Check, AlertCircle, Loader2 } from 'lucide-react'
import { Button, type ButtonProps } from '../ui/Button.tsx'
import type { ResumeData } from '../../pages/Resume/types.ts'
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

  const isSufficient = hasSufficientResumeContent(data)

  const handleDownload = async () => {
    if (!isSufficient) {
      setShowEmptyModal(true)
      return
    }

    setStatus('loading')
    setErrorMessage(null)

    const result = await downloadResumePdf(data)

    if (result.success) {
      setStatus('success')
      adminService.recordDownloadEvent('resume_pdf', {
        title: data.personal?.fullName || 'ATS Resume',
        ownerEmail: data.personal?.email || 'student@prbuilder.me',
      })
      setTimeout(() => {
        setStatus('idle')
      }, 3000)
    } else {
      setStatus('error')
      setErrorMessage(result.error || 'Failed to dispatch print-to-PDF.')
      setTimeout(() => {
        setStatus('idle')
      }, 4000)
    }
  }

  return (
    <>
      <div className="inline-flex flex-col items-start gap-1">
        <Button
          variant={status === 'error' ? 'outline' : variant}
          size={size}
          onClick={handleDownload}
          disabled={status === 'loading'}
          className={`${className} ${
            status === 'success'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
              : status === 'error'
                ? 'border-rose-300 text-rose-700 hover:bg-rose-50'
                : ''
          }`}
          aria-label={label}
          title={isSufficient ? 'Save ATS-compliant PDF with selectable vector text' : 'Resume needs more content before downloading'}
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
            ? 'Preparing PDF...'
            : status === 'success'
              ? 'PDF Ready!'
              : status === 'error'
                ? 'Export Failed'
                : label}
        </Button>

        {errorMessage && (
          <span className="text-[11px] text-rose-600 font-medium animate-fadeIn">
            {errorMessage}
          </span>
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
                Tip: Click <strong>"Sample Data"</strong> in the toolbar to load a pre-populated recruiter-grade resume!
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowEmptyModal(false)}
                className="text-xs font-semibold"
              >
                Understood, Return to Builder
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ResumeDownloadButton
