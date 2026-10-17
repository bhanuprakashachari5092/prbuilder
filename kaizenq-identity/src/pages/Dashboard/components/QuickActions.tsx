import React from 'react'
import { User, FileText, Globe, Plus, ArrowRight } from 'lucide-react'
import type { DashboardTab } from '../types.ts'

export interface QuickActionsProps {
  onSelectTab: (tab: DashboardTab) => void
  onOpenAddProjectModal: () => void
}

interface ActionCard {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  badge: string
  onClick: () => void
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onSelectTab,
  onOpenAddProjectModal,
}) => {
  const actions: ActionCard[] = [
    {
      title: 'Edit Profile',
      description: 'Update headline, bio, skills, and university credentials.',
      icon: User,
      badge: 'Profile Module',
      onClick: () => onSelectTab('profile'),
    },
    {
      title: 'Build Resume',
      description: 'Format ATS-grade sections, keywords, and PDF export preview.',
      icon: FileText,
      badge: 'ATS Engine',
      onClick: () => onSelectTab('resume'),
    },
    {
      title: 'Create Portfolio',
      description: 'Choose template, customize theme, and inspect live preview.',
      icon: Globe,
      badge: 'Portfolio Studio',
      onClick: () => onSelectTab('portfolio'),
    },
    {
      title: 'Add a Project',
      description: 'Showcase repository, architecture tags, and production demo link.',
      icon: Plus,
      badge: 'Showcase Manager',
      onClick: onOpenAddProjectModal,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#111827]">Quick Actions</h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Direct shortcuts to key identity building workflows
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((act) => {
          const Icon = act.icon

          return (
            <button
              key={act.title}
              onClick={act.onClick}
              className="relative p-5 rounded-2xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#BFDBFE] transition-all text-left group cursor-pointer shadow-sm flex flex-col justify-between overflow-hidden"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] group-hover:bg-[#DBEAFE] flex items-center justify-center text-[#2563EB] transition-colors border border-[#BFDBFE]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono text-[#64748B] px-2 py-0.5 rounded bg-[#F1F5F9] border border-[#E2E8F0]">
                    {act.badge}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-[#111827] group-hover:text-[#2563EB] transition-colors">
                  {act.title}
                </h4>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  {act.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center gap-1.5 text-xs text-[#2563EB] font-medium group-hover:translate-x-0.5 transition-transform">
                <span>Open module</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default QuickActions
