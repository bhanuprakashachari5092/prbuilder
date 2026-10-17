/**
 * Portfolio Builder Data Model & Types
 * KaizenQ Identity — Personal Portfolio Studio
 */

export type PortfolioThemeId = 'developer' | 'minimal' | 'creative' | 'modern' | 'midnight'

export interface PersonalProfile {
  fullName: string
  title: string
  photoUrl?: string
  location?: string
  shortBio: string
  aboutMe: string
  email?: string
  phone?: string
  linkedinUrl?: string
  githubUrl?: string
  portfolioUrl?: string
  twitterUrl?: string
  resumeUrl?: string
  slug: string
}

export interface PortfolioSkills {
  languages: string[]
  frameworks: string[]
  tools: string[]
  otherSkills: string[]
}

export interface PortfolioEducation {
  id: string
  institution: string
  degree: string
  specialization: string
  startDate: string
  endDate: string
  grade?: string
}

export interface PortfolioProject {
  id: string
  title: string
  description: string
  technologies: string[]
  githubUrl?: string
  liveUrl?: string
  imageUrl?: string
}

export interface PortfolioExperience {
  id: string
  organization: string
  role: string
  startDate: string
  endDate: string
  description: string
}

export interface PortfolioAchievement {
  id: string
  title: string
  description: string
}

export interface PortfolioCertification {
  id: string
  name: string
  issuer: string
  issueDate?: string
  credentialUrl?: string
}

export interface PortfolioSocialLink {
  id: string
  platform: string
  url: string
}

export interface PortfolioContact {
  email?: string
  socialLinks: PortfolioSocialLink[]
  contactCtaMessage?: string
}

export interface SectionVisibility {
  about: boolean
  skills: boolean
  projects: boolean
  experience: boolean
  education: boolean
  achievements: boolean
  certifications: boolean
  contact: boolean
}

export interface PortfolioData {
  theme: PortfolioThemeId
  profile: PersonalProfile
  skills: PortfolioSkills
  education: PortfolioEducation[]
  projects: PortfolioProject[]
  experience: PortfolioExperience[]
  achievements: PortfolioAchievement[]
  certifications: PortfolioCertification[]
  contact: PortfolioContact
  sectionVisibility: SectionVisibility
  updatedAt: string
  version: number
}

export interface PortfolioValidationIssues {
  emailError?: string
  linkedinError?: string
  githubError?: string
  portfolioUrlError?: string
  twitterUrlError?: string
  resumeUrlError?: string
  liveUrlErrors: Record<string, string>
  projectGithubErrors?: Record<string, string>
  projectImageErrors?: Record<string, string>
  certCredentialErrors?: Record<string, string>
  slugError?: string
  missingRequired: string[]
}
