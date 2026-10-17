import React from 'react'
import { CheckCircle2, Circle, ArrowRight, ListChecks } from 'lucide-react'
import { Button } from '../../../components/ui/Button.tsx'
import type { DashboardTab, DemoChecklistItem } from '../types.ts'

export interface NextStepsProps {
  checklist: DemoChecklistItem[]
  onSelectTab: (tab: DashboardTab) => void
}

export const NextSteps: React.FC<NextStepsProps> = ({ checklist, onSelectTab }) => {
  const completedCount = checklist.filter((item) => item.completed).length
  const totalCount = checklist.length

  return (
    <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-[#2563EB]" />
          <h3 className="text-sm font-semibold text-[#111827]">Actionable Next Steps</h3>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#2563EB]">
          <span>{completedCount} of {totalCount} completed</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {checklist.map((item) => (
          <div
            key={item.id}
            className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              item.completed
                ? 'bg-[#F8FAFC] border-[#E2E8F0] opacity-80'
                : 'bg-white border-[#E2E8F0] hover:border-[#BFDBFE]'
            }`}
          >
            <div className="flex items-start gap-3">
              {item.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-4 h-4 text-[#94A3B8] shrink-0 mt-0.5" />
              )}

              <div>
                <h4
                  className={`text-xs sm:text-sm font-semibold ${
                    item.completed ? 'text-[#64748B] line-through' : 'text-[#111827]'
                  }`}
                >
                  {item.title}
                </h4>
                <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>

            {!item.completed && item.actionLabel && item.targetTab && (
              <div className="sm:self-center shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectTab(item.targetTab!)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="text-xs border-[#BFDBFE] text-[#2563EB] hover:bg-[#EFF6FF] w-full sm:w-auto"
                >
                  {item.actionLabel}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default NextSteps
