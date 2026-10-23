import React, { useState } from 'react'
import { Archive, Download, Check, AlertCircle, Loader2 } from 'lucide-react'
import { Button, type ButtonProps } from '../ui/Button.tsx'
import type { PortfolioData } from '../../pages/Portfolio/types.ts'
import { downloadPortfolioZip, hasSufficientPortfolioContent } from '../../services/portfolioExportService.ts'
import { adminService } from '../../services/adminService.ts'

export interface PortfolioDownloadButtonProps {
  data: PortfolioData
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  className?: string
  label?: string
  showIcon?: boolean
}

export const PortfolioDownloadButton: React.FC<PortfolioDownloadButtonProps> = ({
  data,
  variant = 'primary',
  size = 'sm',
  className = '',
  label = 'Download Portfolio ZIP',
  showIcon = true,
}) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [progressText, setProgressText] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showEmptyModal, setShowEmptyModal] = useState<boolean>(false)

  const isSufficient = hasSufficientPortfolioContent(data)

  const handleDownload = async () => {
    if (!isSufficient) {
      setShowEmptyModal(true)
      return
    }

    setStatus('loading')
    setErrorMessage(null)

    const result = await downloadPortfolioZip(data, (_pct, msg) => {
      setProgressText(msg)
    })

    if (result.success) {
      setStatus('success')
      adminService.recordDownloadEvent('portfolio_zip', {
        title: data.personal?.fullName || 'Portfolio Website',
        ownerEmail: data.personal?.email || 'student@prbuilder.me',
      })
      setTimeout(() => {
        setStatus('idle')
        setProgressText('')
      }, 3000)
    } else {
      setStatus('error')
      setErrorMessage(result.error || 'Failed to generate ZIP archive.')
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
          title={isSufficient ? 'Export production-ready standalone HTML/CSS/JS website in a ZIP archive' : 'Your portfolio needs more content before downloading'}
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
            ? progressText || 'Exporting ZIP...'
            : status === 'success'
              ? 'ZIP Exported!'
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
                <Archive className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-[#111827]">Portfolio Content Needed</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Complete minimum required sections to generate your website
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#64748B] leading-relaxed bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
              <p className="text-[#111827] font-medium">
                To export a functional standalone website, your portfolio must contain at least:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Your full name (in the Profile section)</li>
                <li>At least one completed project, skill, bio, or experience entry</li>
              </ul>
              <p className="text-[11px] text-[#64748B] pt-1">
                Tip: You can click <strong>"Load Sample"</strong> in the builder toolbar to immediately test and preview a full developer portfolio!
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

export default PortfolioDownloadButton
