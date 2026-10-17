import React from 'react'
import { FileText, Globe, GitBranch, Award, Compass, History, Clock } from 'lucide-react'
import type { DemoActivityEvent } from '../types.ts'

export interface RecentActivityProps {
  activities: DemoActivityEvent[]
  isLive?: boolean
}

const CATEGORY_ICONS: Record<
  DemoActivityEvent['category'],
  React.ComponentType<{ className?: string }>
> = {
  resume: FileText,
  portfolio: Globe,
  project: GitBranch,
  credential: Award,
  domain: Compass,
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  return (
    <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#2563EB]" />
          <h3 className="text-sm font-semibold text-[#111827]">Recent Activity</h3>
        </div>

        {activities.length > 0 && (
          <span className="text-[11px] font-mono text-[#64748B]">
            {activities.length} event{activities.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {/* Activity Timeline List or Empty State */}
      {activities.length === 0 ? (
        <div className="py-8 px-4 text-center rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
          <div className="w-9 h-9 rounded-full bg-[#EFF6FF] text-[#2563EB] mx-auto flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-medium text-[#111827]">
            No recent activity
          </h4>
          <p className="text-xs text-[#64748B] max-w-xs mx-auto leading-relaxed">
            Publishing your portfolio, updating resumes, and domain changes will be logged here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#E2E8F0]">
          {activities.map((item) => {
            const Icon = CATEGORY_ICONS[item.category] || FileText

            return (
              <div key={item.id} className="py-3 flex items-start gap-3 group">
                {/* Event Category Icon */}
                <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0 border border-[#BFDBFE] mt-0.5">
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Event Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-medium text-[#111827] truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] font-mono text-[#64748B] shrink-0 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{item.timestamp}</span>
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default RecentActivity
