import React from 'react'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { Button } from '../../../components/ui/Button.tsx'

export interface WelcomeSectionProps {
  displayName?: string | null
  hasStartedBuilding: boolean
  publishedSlug?: string | null
  onContinueBuilding: () => void
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  displayName,
  hasStartedBuilding,
  publishedSlug,
  onContinueBuilding,
}) => {
  const greeting = displayName ? `Welcome back, ${displayName}` : 'Welcome to your workspace'

  return (
    <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-xl">
          <h2 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
            {greeting}
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
            {hasStartedBuilding
              ? 'Pick up where you left off. Update your ATS resume, refine your developer portfolio, or manage your project showcase.'
              : 'Create an ATS-optimized resume and an interactive personal portfolio to showcase your engineering work.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            variant="glow"
            size="md"
            onClick={onContinueBuilding}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {hasStartedBuilding ? 'Continue Building' : 'Start Building'}
          </Button>

          {publishedSlug && (
            <a
              href={`/p/${publishedSlug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-semibold text-[#111827] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Live Portfolio</span>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default WelcomeSection
