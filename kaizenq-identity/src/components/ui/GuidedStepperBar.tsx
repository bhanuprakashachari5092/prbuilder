import React from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'

export interface StepItem {
  id: string
  label: string
  shortLabel?: string
  isCompleted?: boolean
}

export interface GuidedStepperBarProps {
  steps: StepItem[]
  activeStepIndex: number
  onStepClick: (index: number) => void
  onNext?: () => void
  onPrev?: () => void
  title?: string
  className?: string
}

export const GuidedStepperBar: React.FC<GuidedStepperBarProps> = ({
  steps,
  activeStepIndex,
  onStepClick,
  onNext,
  onPrev,
  title = 'Portfolio Guided Builder',
  className = '',
}) => {
  const currentStep = steps[activeStepIndex] || steps[0]
  const isFirst = activeStepIndex === 0
  const isLast = activeStepIndex === steps.length - 1

  return (
    <nav
      aria-label="Portfolio builder progress"
      className={`bg-white border-b border-slate-200/90 px-3 sm:px-6 py-2 shadow-xs transition-colors ${className}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Mobile View: Compact Progress "Step X of Y: Label" + Arrow Controls */}
        <div className="flex md:hidden items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Step {activeStepIndex + 1} of {steps.length}
            </span>
            <span className="text-xs font-semibold text-slate-900 truncate">
              {currentStep?.label}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onPrev}
              disabled={isFirst}
              aria-label="Previous step"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={isLast}
              aria-label="Next step"
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-700 transition active:scale-95 flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Desktop View: Left Step Indicator */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          {title && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {title}
            </span>
          )}
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Step {activeStepIndex + 1} / {steps.length}
          </span>
        </div>

        {/* Desktop View: Stepper Nav Pills */}
        <div className="hidden md:flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
          {steps.map((step, idx) => {
            const isActive = idx === activeStepIndex
            const isCompleted = step.isCompleted && !isActive

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepClick(idx)}
                className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : isCompleted
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
                }`}
                title={step.label}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                    isActive
                      ? 'bg-white text-blue-600'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'
                  }`}
                >
                  {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : idx + 1}
                </span>
                <span>{step.shortLabel || step.label}</span>
              </button>
            )
          })}
        </div>

        {/* Desktop View: Prev / Next Buttons */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onPrev}
            disabled={isFirst}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={isLast}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-xs cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </nav>
  )
}
