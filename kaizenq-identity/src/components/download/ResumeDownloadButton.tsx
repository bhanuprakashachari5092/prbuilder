import React, { useState, useRef, useEffect } from 'react'
import { FileText, Download, Check, AlertCircle, Loader2, Printer, ChevronDown, Sparkles } from 'lucide-react'
import { Button, type ButtonProps } from '../ui/Button.tsx'
import type { ResumeData } from '../../pages/Resume/types.ts'
import { SAMPLE_RESUME_DATA } from '../../pages/Resume/sampleData.ts'
import { downloadResumePdf, hasSufficientResumeContent } from '../../services/resumeExportService.ts'
import { adminService } from '../../services/adminService.ts'
import { useAuth } from '../../app/providers/AuthContext.tsx'

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
  const { user, profile } = useAuth()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showEmptyModal, setShowEmptyModal] = useState<boolean>(false)
  const [showMenu, setShowMenu] = useState<boolean>(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Resolve authenticated candidate profile name from auth profile, user metadata, or email
  const authProfileName =
    profile?.display_name?.trim() ||
    user?.user_metadata?.full_name?.trim() ||
    user?.user_metadata?.name?.trim() ||
    user?.user_metadata?.display_name?.trim() ||
    (user?.email ? user.email.split('@')[0] : '')

  const isSampleOrPlaceholder = (name?: string | null) => {
    if (!name) return true
    const l = name.trim().toLowerCase()
    return (
      l === '' ||
      l === 'your name' ||
      l === 'rahul sharma' ||
      l === 'rahul varma' ||
      l.startsWith('rahul ') ||
      l === 'rahul'
    )
  }

  // Resolve best candidate profile name for export: prioritizes signed-in user profile over sample placeholder
  const resolvedProfileName =
    (authProfileName && isSampleOrPlaceholder(data.personalInfo?.fullName) ? authProfileName : null) ||
    (!isSampleOrPlaceholder(data.personalInfo?.fullName) ? data.personalInfo?.fullName?.trim() : null) ||
    authProfileName ||
    data.personalInfo?.fullName?.trim() ||
    ''

  const effectiveData = React.useMemo(() => {
    const currentName = data.personalInfo?.fullName?.trim()
    const shouldInjectAuth = Boolean(authProfileName && isSampleOrPlaceholder(currentName))

    if (shouldInjectAuth) {
      return {
        ...data,
        personalInfo: {
          ...data.personalInfo,
          fullName: authProfileName,
          email:
            data.personalInfo?.email && data.personalInfo.email !== 'rahul.sharma@example.edu'
              ? data.personalInfo.email
              : (user?.email || data.personalInfo?.email || ''),
        },
      }
    }
    return data
  }, [data, authProfileName, user?.email])

  const isSufficient = hasSufficientResumeContent(effectiveData)

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
      const currentName = targetData.personalInfo?.fullName?.trim()
      const shouldInjectAuth = Boolean(authProfileName && isSampleOrPlaceholder(currentName))

      const dataToExport = shouldInjectAuth
        ? {
            ...targetData,
            personalInfo: {
              ...targetData.personalInfo,
              fullName: authProfileName,
              email:
                targetData.personalInfo?.email && targetData.personalInfo.email !== 'rahul.sharma@example.edu'
                  ? targetData.personalInfo.email
                  : (user?.email || targetData.personalInfo?.email || ''),
            },
          }
        : targetData

      const filenameProfileName = authProfileName || resolvedProfileName

      const result = await downloadResumePdf(dataToExport, { mode, profileName: filenameProfileName })

      if (result.success) {
        setStatus('success')
        adminService.recordDownloadEvent('resume_pdf', {
          title: dataToExport.title || dataToExport.personalInfo?.fullName || 'ATS Resume',
          ownerEmail: dataToExport.personalInfo?.email || 'student@prbuilder.me',
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
    triggerExport(effectiveData, 'direct')
  }

  const isOutline = variant === 'outline' || variant === 'secondary'

  const sizeConfig = {
    sm: {
      left: 'px-3.5 py-1.5 text-xs gap-1.5',
      right: 'px-2 py-1.5',
      icon: 'w-3.5 h-3.5',
    },
    md: {
      left: 'px-4 py-2 text-xs sm:text-sm gap-2',
      right: 'px-2.5 py-2',
      icon: 'w-4 h-4',
    },
    lg: {
      left: 'px-5 py-2.5 text-sm sm:text-base gap-2.5',
      right: 'px-3 py-2.5',
      icon: 'w-4 h-4',
    },
  }[size || 'sm'] || {
    left: 'px-3.5 py-1.5 text-xs gap-1.5',
    right: 'px-2 py-1.5',
    icon: 'w-3.5 h-3.5',
  }

  let containerStyles = 'inline-flex items-stretch rounded-xl shadow-xs transition-all duration-200 border select-none '
  if (status === 'success') {
    containerStyles += 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-500/20'
  } else if (status === 'error') {
    containerStyles += 'bg-rose-50 border-rose-300 text-rose-700'
  } else if (isOutline) {
    containerStyles += 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
  } else {
    // primary / glow
    containerStyles += 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-blue-600/40 text-white shadow-blue-500/20'
  }

  return (
    <>
      <div className={`relative inline-flex items-center ${className}`} ref={menuRef}>
        <div className="inline-flex flex-col items-start gap-1">
          <div className={containerStyles}>
            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handlePrimaryClick}
              disabled={status === 'loading'}
              aria-label={label}
              className={`inline-flex items-center justify-center font-semibold rounded-l-xl rounded-r-none transition-colors cursor-pointer focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
                sizeConfig.left
              } ${
                !isOutline && status !== 'error' ? 'hover:bg-white/10 active:bg-white/20' : 'hover:bg-slate-100'
              }`}
              title={
                isSufficient
                  ? 'Download ATS-compliant vector PDF file directly to your computer'
                  : 'Resume needs more content before downloading'
              }
            >
              {showIcon && (
                <span className="shrink-0">
                  {status === 'loading' ? (
                    <Loader2 className={`${sizeConfig.icon} animate-spin`} />
                  ) : status === 'success' ? (
                    <Check className={`${sizeConfig.icon} text-white`} />
                  ) : status === 'error' ? (
                    <AlertCircle className={`${sizeConfig.icon} text-rose-600`} />
                  ) : (
                    <Download className={sizeConfig.icon} />
                  )}
                </span>
              )}
              <span>
                {status === 'loading'
                  ? 'Generating PDF...'
                  : status === 'success'
                    ? 'PDF Downloaded!'
                    : status === 'error'
                      ? 'Export Failed'
                      : label}
              </span>
            </button>

            {/* Crisp Divider */}
            <div
              className={`w-[1px] h-4 self-center shrink-0 ${
                isOutline || status === 'error' ? 'bg-slate-200' : 'bg-white/25'
              }`}
            />

            {/* Dropdown Options Toggle */}
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              disabled={status === 'loading'}
              aria-label="More export options"
              className={`inline-flex items-center justify-center rounded-r-xl rounded-l-none transition-colors cursor-pointer focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
                sizeConfig.right
              } ${
                !isOutline && status !== 'error' ? 'hover:bg-white/15 active:bg-white/25' : 'hover:bg-slate-100'
              }`}
              title="More export options"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showMenu ? 'rotate-180' : ''
                }`}
              />
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
          <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 z-50 text-xs text-slate-800 dark:text-slate-200 space-y-1 animate-fadeIn">
            <button
              type="button"
              onClick={() => {
                if (!isSufficient) {
                  setShowEmptyModal(true)
                  return
                }
                triggerExport(effectiveData, 'direct')
              }}
              className="w-full flex items-start gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
            >
              <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600">
                    Direct PDF Download
                  </p>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    .pdf
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Vector PDF ready for applicant tracking systems
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
                triggerExport(effectiveData, 'print')
              }}
              className="w-full flex items-start gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
            >
              <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mt-0.5 shrink-0">
                <Printer className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600">
                    Print / System Dialog
                  </p>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    A4
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Opens browser print with calibrated 10mm margins
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
                  triggerExport(effectiveData, 'direct')
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
                  const customizedSample = authProfileName
                    ? {
                        ...SAMPLE_RESUME_DATA,
                        personalInfo: {
                          ...SAMPLE_RESUME_DATA.personalInfo,
                          fullName: authProfileName,
                          email: user?.email || SAMPLE_RESUME_DATA.personalInfo.email,
                        },
                      }
                    : SAMPLE_RESUME_DATA
                  triggerExport(customizedSample, 'direct')
                }}
                className="text-xs font-semibold"
                title={`Download ${authProfileName || 'sample'} ATS resume PDF`}
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

