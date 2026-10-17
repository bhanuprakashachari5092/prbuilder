import React from 'react'
import { AlertCircle, ShieldCheck } from 'lucide-react'
import type { ResumeData, ValidationIssues } from '../types.ts'
import { ResumeDownloadButton } from '../../../components/download/ResumeDownloadButton.tsx'

export interface ResumeValidationBarProps {
  data: ResumeData
}

export function validateResume(data: ResumeData): ValidationIssues {
  const missing: string[] = []
  let emailError: string | undefined
  let linkedinError: string | undefined
  let githubError: string | undefined
  let portfolioError: string | undefined

  if (!data.personalInfo.fullName.trim()) missing.push('Full Name')
  if (!data.personalInfo.title.trim()) missing.push('Professional Title')
  if (!data.personalInfo.email.trim()) {
    missing.push('Email Address')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.personalInfo.email.trim())) {
    emailError = 'Please enter a valid email format (e.g. name@domain.com)'
  }

  if (!data.personalInfo.location.trim()) missing.push('Location')
  if (data.education.length === 0) missing.push('At least 1 Education entry')

  const totalSkills =
    data.skills.languages.length +
    data.skills.frameworks.length +
    data.skills.tools.length
  if (totalSkills === 0) missing.push('At least 1 Technical Skill tag')

  // URL validations if provided
  if (
    data.personalInfo.linkedinUrl &&
    !/^https?:\/\//i.test(data.personalInfo.linkedinUrl)
  ) {
    linkedinError = 'URL must start with http:// or https://'
  }
  if (
    data.personalInfo.githubUrl &&
    !/^https?:\/\//i.test(data.personalInfo.githubUrl)
  ) {
    githubError = 'URL must start with http:// or https://'
  }
  if (
    data.personalInfo.portfolioUrl &&
    !/^https?:\/\//i.test(data.personalInfo.portfolioUrl)
  ) {
    portfolioError = 'URL must start with http:// or https://'
  }

  return {
    emailError,
    linkedinError,
    githubError,
    portfolioError,
    missingRequired: missing,
  }
}

export const ResumeValidationBar: React.FC<ResumeValidationBarProps> = ({ data }) => {
  const issues = validateResume(data)
  const totalRequiredWeight = 6
  const completedWeight = Math.max(0, totalRequiredWeight - issues.missingRequired.length)
  const completeness = Math.round((completedWeight / totalRequiredWeight) * 100)

  return (
    <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-2 no-print">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {completeness >= 80 ? (
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600" />
          )}
          <span className="text-xs font-semibold text-[#111827]">
            ATS Document Readiness & Completeness
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className={completeness >= 80 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
            {completeness}% Ready
          </span>
          <span className="text-[#64748B]">• {completeness}/100 Readiness</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            completeness >= 80 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-[#2563EB]'
          }`}
          style={{ width: `${completeness}%` }}
        />
      </div>

      {/* Missing Fields Feedback */}
      {issues.missingRequired.length > 0 ? (
        <p className="text-[11px] text-amber-800 leading-tight">
          Recommended to complete: {issues.missingRequired.join(', ')}
        </p>
      ) : (
        <p className="text-[11px] text-emerald-700 leading-tight">
          ✓ Core ATS sections present. Structured formatting ready for recruiter review.
        </p>
      )}

      {/* Completion & Download Action Bar */}
      <div className="pt-2.5 mt-2 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2.5">
        <div className="text-[11px] text-[#64748B]">
          {completeness >= 60 ? (
            <span className="text-emerald-700 font-medium">ATS Document ready for recruiter export</span>
          ) : (
            <span>Fill core sections to export clean PDF</span>
          )}
        </div>
        <ResumeDownloadButton
          data={data}
          variant="glow"
          size="sm"
          label="Download Resume PDF"
          className="text-xs font-semibold"
        />
      </div>

      {/* Inline Validation Warnings */}
      {(issues.emailError || issues.linkedinError || issues.githubError || issues.portfolioError) && (
        <div className="pt-1 text-[11px] text-rose-600 font-mono space-y-0.5">
          {issues.emailError && <div>• Email: {issues.emailError}</div>}
          {issues.linkedinError && <div>• LinkedIn: {issues.linkedinError}</div>}
          {issues.githubError && <div>• GitHub: {issues.githubError}</div>}
          {issues.portfolioError && <div>• Portfolio: {issues.portfolioError}</div>}
        </div>
      )}
    </div>
  )
}

export default ResumeValidationBar
