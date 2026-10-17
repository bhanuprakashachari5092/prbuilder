import React, { useState } from 'react'
import { DashboardSidebar } from './DashboardSidebar.tsx'
import { DashboardHeader } from './DashboardHeader.tsx'
import type { DashboardTab, DemoStudentData, DemoNotification } from '../types.ts'

export interface DashboardLayoutProps {
  children: React.ReactNode
  activeTab: DashboardTab
  student: DemoStudentData
  notifications: DemoNotification[]
  onSelectTab: (tab: DashboardTab) => void
  onExitToHome?: () => void
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab,
  student,
  notifications,
  onSelectTab,
  onExitToHome,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#111827] flex">
      {/* 1. Sidebar Navigation */}
      <DashboardSidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        onExitToHome={onExitToHome}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Content View Area */}
      <div className="flex-1 flex flex-col md:pl-60 lg:pl-64 min-w-0">
        {/* Sticky Top Header */}
        <DashboardHeader
          activeTab={activeTab}
          student={student}
          notifications={notifications}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onExitToHome={onExitToHome}
          onSelectTab={onSelectTab}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
