import React from 'react'
import {
  LayoutDashboard,
  User,
  FileText,
  Globe,
  FolderGit2,
  Settings,
  Share2,
  ArrowLeft,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import { PRLogo } from '../../../components/brand/PRLogo.tsx'
import { cn } from '../../../lib/utils.ts'
import { useAuth } from '../../../app/providers/AuthContext.tsx'
import type { DashboardTab } from '../types.ts'

export interface DashboardSidebarProps {
  activeTab: DashboardTab
  onSelectTab: (tab: DashboardTab) => void
  onExitToHome?: () => void
  isOpenMobile?: boolean
  onCloseMobile?: () => void
}

interface NavItem {
  id: DashboardTab
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'resume', label: 'Resume Builder', icon: FileText },
  { id: 'portfolio', label: 'Portfolio Studio', icon: Globe },
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'publish', label: 'Publish & Domain', icon: Share2 },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeTab,
  onSelectTab,
  onExitToHome,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { isAdmin } = useAuth()

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#E2E8F0] text-[#111827]">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
        <PRLogo size="md" tagline="Workspace" theme="light" />

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-[#F1F5F9] transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Primary Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Dashboard Navigation">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
          Workspace
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id)
                onCloseMobile?.()
              }}
              className={cn(
                'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors group select-none text-left cursor-pointer',
                isActive
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold border border-[#BFDBFE]'
                  : 'text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC] border border-transparent',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-[#2563EB]' : 'text-[#64748B] group-hover:text-[#111827]',
                  )}
                />
                <span>{item.label}</span>
              </div>
            </button>
          )
        })}

        {/* Admin Navigation Section */}
        {isAdmin && (
          <div className="pt-4 mt-3 border-t border-[#E2E8F0]">
            <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-[#2563EB] font-bold">
              Administration
            </div>
            <button
              onClick={() => {
                onSelectTab('admin-domains')
                onCloseMobile?.()
              }}
              className={cn(
                'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors group select-none text-left cursor-pointer',
                activeTab === 'admin-domains'
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold border border-[#BFDBFE]'
                  : 'text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC] border border-transparent',
              )}
              aria-current={activeTab === 'admin-domains' ? 'page' : undefined}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck
                  className={cn(
                    'w-4 h-4 transition-colors',
                    activeTab === 'admin-domains' ? 'text-[#2563EB]' : 'text-[#64748B] group-hover:text-[#111827]',
                  )}
                />
                <span>Domain Claims</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-100 text-[#2563EB]">
                Admin
              </span>
            </button>
          </div>
        )}
      </nav>

      {/* Footer Return Action */}
      <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
        {onExitToHome && (
          <button
            onClick={onExitToHome}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[#64748B] hover:text-[#111827] hover:bg-white transition-colors border border-[#E2E8F0] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Landing Page</span>
            </div>
            <ExternalLink className="w-3 h-3 opacity-50" />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-60 lg:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Slide-over */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}

export default DashboardSidebar
