import React from 'react'
import { FileText, Globe, ArrowRight } from 'lucide-react'
import type { DashboardTab, DemoStudentData } from '../types.ts'

export interface DashboardStatCardProps {
  student: DemoStudentData
  onSelectTab: (tab: DashboardTab) => void
}

export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  student,
  onSelectTab,
}) => {
  const resumeComplete = student.completion.resume >= 80
  const resumeStarted = student.completion.resume > 0

  const portfolioPublished = student.completion.portfolio === 100
  const portfolioStarted = student.completion.portfolio > 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* 1. Resume Builder Feature Card */}
      <div
        onClick={() => onSelectTab('resume')}
        className="group rounded-2xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#BFDBFE] p-6 shadow-sm transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>

            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                resumeComplete
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : resumeStarted
                  ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                  : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
              }`}
            >
              {resumeComplete
                ? 'Ready to Export'
                : resumeStarted
                ? `${student.completion.resume}% Complete`
                : 'Not Started'}
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-[#111827] group-hover:text-[#2563EB] transition-colors">
              Resume Builder
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 leading-relaxed">
              Create ATS-friendly single and multi-page resumes formatted for modern automated applicant tracking systems.
            </p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs sm:text-sm font-semibold text-[#2563EB]">
          <span>Open Resume Builder</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* 2. Portfolio Studio Feature Card */}
      <div
        onClick={() => onSelectTab('portfolio')}
        className="group rounded-2xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#C7D2FE] p-6 shadow-sm transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4F46E5] group-hover:scale-105 transition-transform">
              <Globe className="w-5 h-5" />
            </div>

            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                portfolioPublished
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : portfolioStarted
                  ? 'bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]'
                  : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
              }`}
            >
              {portfolioPublished
                ? 'Published Live'
                : portfolioStarted
                ? 'Draft Saved'
                : 'Not Started'}
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-[#111827] group-hover:text-[#4F46E5] transition-colors">
              Portfolio Studio
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 leading-relaxed">
              Customize and publish your interactive personal developer portfolio site with verified project showcases.
            </p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs sm:text-sm font-semibold text-[#4F46E5]">
          <span>Open Portfolio Studio</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  )
}

export default DashboardStatCard
