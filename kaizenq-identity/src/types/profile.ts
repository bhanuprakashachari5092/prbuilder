/**
 * Profile & Portfolio Entity Types for KaizenQ Identity
 */

export interface Skill {
  id: string
  name: string
  category: 'frontend' | 'backend' | 'systems' | 'ai-ml' | 'devops' | 'mobile' | 'tools' | 'other'
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  highlighted?: boolean
}

export interface Education {
  id: string
  institution: string
  degree: string
  fieldOfStudy: string
  startDate: string
  endDate?: string
  current?: boolean
  gradeOrGpa?: string
  honors?: string[]
}

export interface Experience {
  id: string
  company: string
  role: string
  location?: string
  locationType?: 'remote' | 'hybrid' | 'on-site'
  startDate: string
  endDate?: string
  current: boolean
  description: string[]
  technologiesUsed?: string[]
}

export interface Certificate {
  id: string
  title: string
  issuer: string
  issueDate: string
  expirationDate?: string
  credentialId?: string
  credentialUrl?: string
  verified: boolean
  badgeUrl?: string
}

export interface Achievement {
  id: string
  title: string
  eventOrContext: string
  date: string
  rankOrAward?: string
  description?: string
  proofUrl?: string
}

export interface SocialLinks {
  github?: string
  linkedin?: string
  twitter?: string
  website?: string
  leetcode?: string
  kaggle?: string
}

export interface Profile {
  id: string
  userId: string
  handle: string
  headline: string
  bio: string
  avatarUrl?: string
  location?: string
  availableForHiring: boolean
  targetRoles: string[]
  skills: Skill[]
  education: Education[]
  experience: Experience[]
  certificates: Certificate[]
  achievements: Achievement[]
  socials: SocialLinks
  qrCodeUrl?: string
  eventAffiliation?: {
    eventName: string
    cohortYear: string
    isVerifiedParticipant: boolean
  }
}
