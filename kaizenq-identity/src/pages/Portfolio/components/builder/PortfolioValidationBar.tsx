import React from 'react'
import { ShieldCheck, AlertCircle } from 'lucide-react'
import type { PortfolioData } from '../../types.ts'
import { validatePortfolio, calculatePortfolioCompleteness } from '../../validation.ts'
import { PortfolioDownloadButton } from '../../../../components/download/PortfolioDownloadButton.tsx'

export interface PortfolioValidationBarProps {
  data: PortfolioData
}

export const PortfolioValidationBar: React.FC<PortfolioValidationBarProps> = ({ data }) => {
  const issues = validatePortfolio(data)
  const completeness = calculatePortfolioCompleteness(data)

  const hasLiveUrlErrors = Object.keys(issues.liveUrlErrors).length > 0
  const hasGithubErrors = issues.projectGithubErrors && Object.keys(issues.projectGithubErrors).length > 0
  const hasErrors =
    issues.emailError ||
    issues.linkedinError ||
    issues.githubError ||
    issues.portfolioUrlError ||
    issues.twitterUrlError ||
    issues.slugError ||
    hasLiveUrlErrors ||
    hasGithubErrors

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-2 text-[#111827]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {completeness >= 80 ? (
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-500" />
          )}
          <span className="text-xs font-semibold text-[#111827]">
            Portfolio Readiness & Quality
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className={completeness >= 80 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
            {completeness}% Ready
          </span>
          <span className="text-[#64748B]">• Recruiter Spec</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            completeness >= 80 ? 'bg-emerald-500' : 'bg-[#2563EB]'
          }`}
          style={{ width: `${completeness}%` }}
        />
      </div>

      {/* Missing Required Checklist */}
      {issues.missingRequired.length > 0 ? (
        <p className="text-[11px] text-amber-700 leading-tight">
          Recommended: Add {issues.missingRequired.join(', ')}
        </p>
      ) : (
        <p className="text-[11px] text-emerald-700 leading-tight">
          ✓ Core portfolio sections complete. Ready for recruiter sharing.
        </p>
      )}

      {/* Completion & Export Action Bar */}
      <div className="pt-2.5 mt-2 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2.5">
        <div className="text-[11px] text-[#64748B]">
          {completeness >= 60 ? (
            <span className="text-emerald-700 font-medium">Production site package ready to export</span>
          ) : (
            <span>Add profile details & projects to export site ZIP</span>
          )}
        </div>
        <PortfolioDownloadButton
          data={data}
          variant="glow"
          size="sm"
          label="Download Portfolio ZIP"
          className="text-xs font-semibold"
        />
      </div>

      {/* Validation Warnings */}
      {hasErrors && (
        <div className="pt-1 text-[11px] text-rose-600 font-mono space-y-0.5">
          {issues.slugError && <div>• Slug: {issues.slugError}</div>}
          {issues.emailError && <div>• Email: {issues.emailError}</div>}
          {issues.linkedinError && <div>• LinkedIn: {issues.linkedinError}</div>}
          {issues.githubError && <div>• GitHub: {issues.githubError}</div>}
          {issues.portfolioUrlError && <div>• Website: {issues.portfolioUrlError}</div>}
          {hasLiveUrlErrors && <div>• Projects: Some live demo URLs must begin with http:// or https://</div>}
          {hasGithubErrors && <div>• Projects: Some GitHub URLs must begin with http:// or https://</div>}
        </div>
      )}
    </div>
  )
}

export default PortfolioValidationBar
