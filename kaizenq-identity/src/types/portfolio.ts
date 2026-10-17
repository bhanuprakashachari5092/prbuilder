/**
 * Portfolio & Project Types for KaizenQ Identity
 */

export interface Project {
  id: string
  title: string
  tagline: string
  description: string
  tags: string[]
  liveUrl?: string
  githubUrl?: string
  starsCount?: number
  metrics?: string
  thumbnailUrl?: string
  featured: boolean
  sortOrder: number
}

export type PortfolioTemplateId = 'minimal-mono' | 'modern-craft' | 'academic-scholar' | 'executive-clean'

export interface PortfolioThemeConfig {
  accentColor: string
  fontFamily: 'sans' | 'mono' | 'heading'
  darkIntensity: 'deep' | 'midnight' | 'obsidian'
  showGitHubStats: boolean
  showQrBadge: boolean
}

export interface PortfolioSectionVisibility {
  hero: boolean
  skills: boolean
  projects: boolean
  experience: boolean
  education: boolean
  certificates: boolean
  achievements: boolean
  contact: boolean
  resumeDownload: boolean
}

export interface Portfolio {
  id: string
  userId: string
  slug: string
  title: string
  template: PortfolioTemplateId
  published: boolean
  customDomain?: string
  seoTitle?: string
  seoDescription?: string
  theme: PortfolioThemeConfig
  sections: PortfolioSectionVisibility
  projects: Project[]
  viewCount: number
  createdAt: string
  updatedAt: string
}

export interface PortfolioAnalytics {
  portfolioId: string
  totalViews: number
  uniqueVisitors: number
  resumeDownloads: number
  qrScans: number
  topReferrers: { source: string; count: number }[]
}
