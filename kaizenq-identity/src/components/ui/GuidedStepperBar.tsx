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
}

export const GuidedStepperBar: React.FC<GuidedStepperBarProps> = ({
  steps,
  activeStepIndex,
  onStepClick,
  onNext,
  onPrev,
  title,
}) => {
  const currentStep = steps[activeStepIndex] || steps[0]
  const isFirst = activeStepIndex === 0
  const isLast = activeStepIndex === steps.length - 1

  return (
    <nav
      aria-label="Workflow progress"
      className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 shadow-xs"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Step Status & Quick Controls */}
        <div className="flex items-center justify-between md:justify-start gap-3">
          {title && (
            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mr-1">
              {title}
            </span>
          )}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Step {activeStepIndex + 1} of {steps.length}
            </span>
            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-[180px] sm:max-w-none">
              {currentStep.label}
            </span>
          </div>

          {/* Mobile Prev / Next */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              type="button"
              onClick={onPrev}
              disabled={isFirst}
              aria-label="Previous step"
              className="p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={isLast}
              aria-label="Next step"
              className="p-1.5 rounded-lg bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stepper Navigation Pills (Desktop & Tablet) */}
        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {steps.map((step, idx) => {
            const isActive = idx === activeStepIndex
            const isCompleted = step.isCompleted && !isActive

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepClick(idx)}
                className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : isCompleted
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                }`}
                title={step.label}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? 'bg-white text-blue-600'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {isCompleted ? <Check className="w-2.5 h-2.5" /> : idx + 1}
                </span>
                <span className="truncate max-w-[120px]">
                  {step.shortLabel || step.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Desktop Prev / Next Navigation Controls */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onPrev}
            disabled={isFirst}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={isLast}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </nav>
  )
}

