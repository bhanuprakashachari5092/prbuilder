/**
 * Resume Types for KaizenQ Identity
 */

export type ResumeLayout = 'classic-ats' | 'modern-single' | 'technical-split' | 'executive'

export interface ResumeCustomSection {
  id: string
  heading: string
  content: string[]
}

export interface ResumeSettings {
  primaryColor: string
  fontSize: 'compact' | 'standard' | 'comfortable'
  margins: 'tight' | 'normal' | 'relaxed'
  showPhoto: boolean
  showGpa: boolean
  hideIcons: boolean
}

export interface Resume {
  id: string
  userId: string
  title: string
  layout: ResumeLayout
  targetRole: string
  summary: string
  selectedExperienceIds: string[]
  selectedEducationIds: string[]
  selectedSkillIds: string[]
  selectedProjectIds: string[]
  selectedCertificateIds: string[]
  customSections: ResumeCustomSection[]
  settings: ResumeSettings
  lastExportedAt?: string
  createdAt: string
  updatedAt: string
}
