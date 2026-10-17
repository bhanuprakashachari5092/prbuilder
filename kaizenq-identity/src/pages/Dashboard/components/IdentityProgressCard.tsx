import React from 'react'
import { motion } from 'motion/react'
import { ChevronRight, User, FileText, Globe, FolderGit2 } from 'lucide-react'
import { cn } from '../../../lib/utils.ts'
import type { DashboardTab, DemoStudentData } from '../types.ts'

export interface IdentityProgressCardProps {
  completion: DemoStudentData['completion']
  onSelectTab: (tab: DashboardTab) => void
}

interface PillarItem {
  id: DashboardTab
  title: string
  percentage: number
  icon: React.ComponentType<{ className?: string }>
  status: string
}

export const IdentityProgressCard: React.FC<IdentityProgressCardProps> = ({
  completion,
  onSelectTab,
}) => {
  const pillars: PillarItem[] = [
    {
      id: 'profile',
      title: 'Profile',
      percentage: completion.profile,
      icon: User,
      status: completion.profile === 100 ? 'Complete' : (completion.profile > 0 ? `${completion.profile}% filled` : 'Not started'),
    },
    {
      id: 'resume',
      title: 'Resume',
      percentage: completion.resume,
      icon: FileText,
      status: completion.resume === 100 ? 'Ready to export' : (completion.resume > 0 ? `${completion.resume}% complete` : 'No draft yet'),
    },
    {
      id: 'portfolio',
      title: 'Portfolio',
      percentage: completion.portfolio,
      icon: Globe,
      status: completion.portfolio === 100 ? 'Published' : (completion.portfolio > 0 ? 'Draft saved' : 'Not started'),
    },
    {
      id: 'projects',
      title: 'Projects',
      percentage: completion.projects,
      icon: FolderGit2,
      status: completion.projects === 100 ? 'Showcase populated' : (completion.projects > 0 ? 'In progress' : 'None added'),
    },
  ]

  const totalScore = pillars.reduce((sum, item) => sum + item.percentage, 0)
  const calculatedPercentage = Math.round(totalScore / pillars.length)

  return (
    <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-sm space-y-5">
      {/* Header with Title and Calculated Percentage */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#111827]">
            Workspace Setup Progress
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Average completion based on Profile details, Resume fields, Portfolio publication, and Projects.
          </p>
        </div>

        <div className="flex items-baseline gap-1 text-right shrink-0">
          <span className="text-2xl font-bold text-[#2563EB] font-mono">
            {calculatedPercentage}%
          </span>
          <span className="text-xs text-[#64748B]">complete</span>
        </div>
      </div>

      {/* Main Clean Progress Bar */}
      <div className="space-y-1">
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-[#E2E8F0]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${calculatedPercentage}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-[#2563EB]"
          />
        </div>
      </div>

      {/* Breakdown Grid into the 4 Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#E2E8F0]">
        {pillars.map((pillar) => {
          const Icon = pillar.icon
          const isComplete = pillar.percentage === 100

          return (
            <button
              key={pillar.id}
              onClick={() => onSelectTab(pillar.id)}
              className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#BFDBFE] transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                    isComplete
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-white text-[#2563EB] border border-[#E2E8F0]',
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-[#111827] group-hover:text-[#2563EB] transition-colors truncate">
                    {pillar.title}
                  </span>
                  <span className="text-[11px] text-[#64748B] truncate">
                    {pillar.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <span
                  className={cn(
                    'text-xs font-mono font-medium',
                    isComplete ? 'text-emerald-600' : 'text-[#2563EB]',
                  )}
                >
                  {pillar.percentage}%
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#111827] transition-colors" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default IdentityProgressCard
