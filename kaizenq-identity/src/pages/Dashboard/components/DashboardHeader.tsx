import React, { useState, useRef, useEffect } from 'react'
import {
  Menu,
  Bell,
  ExternalLink,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Globe,
  Shield,
} from 'lucide-react'
import { useAuth } from '../../../app/providers/AuthContext.tsx'
import { useApp } from '../../../app/providers/AppContext.ts'
import type { DashboardTab, DemoStudentData, DemoNotification } from '../types.ts'

export interface DashboardHeaderProps {
  activeTab: DashboardTab
  student: DemoStudentData
  notifications: DemoNotification[]
  onOpenMobileSidebar: () => void
  onExitToHome?: () => void
  onSelectTab?: (tab: DashboardTab) => void
}

const TAB_TITLES: Record<DashboardTab, { title: string; subtitle: string }> = {
  overview: {
    title: 'Dashboard',
    subtitle: 'Manage your resume and portfolio',
  },
  resume: {
    title: 'Resume Builder',
    subtitle: 'Create ATS-friendly single and multi-page resumes',
  },
  portfolio: {
    title: 'Portfolio Studio',
    subtitle: 'Customize and publish your interactive developer site',
  },
  profile: {
    title: 'Profile Settings',
    subtitle: 'Manage your professional identity and contact info',
  },
  projects: {
    title: 'Projects',
    subtitle: 'Manage repositories and applications showcased on your portfolio',
  },
  domain: {
    title: 'Custom Domain',
    subtitle: 'Configure DNS routing for your custom web address',
  },
  publish: {
    title: 'Publish & Share',
    subtitle: 'Manage public visibility and custom web handles',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Account preferences and privacy controls',
  },
  'admin-domains': {
    title: 'Domain Claims',
    subtitle: 'Review student .xyz domain sponsorship requests',
  },
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeTab,
  student,
  notifications,
  onOpenMobileSidebar,
  onSelectTab,
}) => {
  const { user, profile, isAdmin, signOut } = useAuth()
  const { setCurrentRoute } = useApp()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const notifRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const { title, subtitle } = TAB_TITLES[activeTab] || TAB_TITLES.overview

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User'
  const isPortfolioPublished = student.completion.portfolio === 100 && student.domainInfo.handle

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8 py-3 transition-colors text-[#111827]">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 rounded-lg bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC] focus:outline-none cursor-pointer"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#111827] tracking-tight leading-tight">
              {title}
            </h1>
            <p className="hidden sm:block text-xs text-[#64748B] font-normal leading-tight">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right: Public Site Link, Notifications & Authenticated User Menu */}
        <div className="flex items-center gap-3">
          {/* Public Portfolio Link - Only shown when actually published */}
          {isPortfolioPublished && (
            <a
              href={`/p/${student.domainInfo.handle.replace('.kaizenq.id', '')}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-semibold text-[#2563EB] hover:bg-[#DBEAFE] transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Live Site</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          )}

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              aria-label={`Notifications, ${unreadCount} unread`}
              aria-expanded={showNotifications}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#2563EB] text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Flyout */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl bg-white border border-[#E2E8F0] shadow-xl p-4 text-[#111827] z-50">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <span className="text-xs font-semibold text-[#111827]">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-medium text-[#2563EB]">
                      {unreadCount} unread
                    </span>
                  )}
                </div>

                <div className="divide-y divide-[#E2E8F0] max-h-60 overflow-y-auto my-1">
                  {notifications.length === 0 ? (
                    <p className="py-4 text-xs text-center text-[#64748B]">
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className="py-2.5 px-1">
                        <span className="text-xs font-medium text-[#111827] block">
                          {notif.title}
                        </span>
                        <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
                          {notif.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Admin Console Quick Link (Admins Only) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setCurrentRoute('admin')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-all cursor-pointer shadow-xs"
              title="Open Platform Administration Console"
            >
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Admin Console</span>
            </button>
          )}

          {/* Authenticated User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] transition-colors cursor-pointer text-left"
              aria-label="User menu"
              aria-expanded={showUserMenu}
            >
              {/* Avatar / Initials */}
              {profile?.avatar_path ? (
                <img
                  src={profile.avatar_path}
                  alt={displayName}
                  className="w-7 h-7 rounded-full object-cover border border-[#E2E8F0]"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-xs font-bold font-mono text-[#2563EB]">
                  {student.avatarInitials}
                </div>
              )}

              <span className="hidden sm:inline text-xs font-semibold text-[#111827] max-w-[120px] truncate">
                {displayName}
              </span>

              <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white border border-[#E2E8F0] shadow-xl p-1.5 text-xs text-[#111827] z-50 animate-fade-in">
                <div className="px-3 py-2 border-b border-[#E2E8F0] mb-1">
                  <p className="font-semibold text-[#111827] truncate">{displayName}</p>
                  <p className="text-[11px] text-[#64748B] truncate font-mono mt-0.5">
                    {user?.email || 'Logged in'}
                  </p>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false)
                      setCurrentRoute('admin')
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 transition-colors cursor-pointer font-semibold mb-1"
                  >
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>Admin Console</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false)
                    onSelectTab?.('profile')
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false)
                    onSelectTab?.('settings')
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </button>

                <div className="border-t border-[#E2E8F0] my-1" />

                <button
                  type="button"
                  onClick={async () => {
                    setShowUserMenu(false)
                    await signOut()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
