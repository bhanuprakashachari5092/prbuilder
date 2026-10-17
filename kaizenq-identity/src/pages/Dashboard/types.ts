/**
 * Dashboard Domain Types
 * KaizenQ Identity — Student Workspace Telemetry & State
 */

export type DashboardTab =
  | 'overview'
  | 'profile'
  | 'resume'
  | 'portfolio'
  | 'projects'
  | 'domain'
  | 'publish'
  | 'settings'
  | 'admin-domains'

export interface DemoStudentData {
  id: string
  name: string
  handle: string
  avatarInitials: string
  role: string
  institution: string
  location: string
  bio: string
  cohort: string
  skills: string[]
  completion: {
    profile: number
    resume: number
    portfolio: number
    projects: number
  }
  domainInfo: {
    handle: string
    tld: string
    status: 'Eligibility Pending' | 'In Review' | 'Configured'
    isVoucherEligible: boolean
    dnsTarget: string
  }
}

export interface DemoActivityEvent {
  id: string
  title: string
  description: string
  timestamp: string
  category: 'resume' | 'portfolio' | 'project' | 'credential' | 'domain'
  iconType: 'file' | 'globe' | 'git' | 'award' | 'compass'
}

export interface DemoChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
  actionLabel?: string
  targetTab?: DashboardTab
}

export interface DemoNotification {
  id: string
  title: string
  message: string
  timestamp: string
  read: boolean
  type: 'info' | 'success' | 'alert'
}
