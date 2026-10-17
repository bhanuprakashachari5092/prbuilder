/**
 * Resume Builder Data Model & Types
 * KaizenQ Identity — Professional ATS Resume Engine
 */

export interface PersonalInfo {
  fullName: string
  title: string
  email: string
  phone: string
  location: string
  linkedinUrl: string
  githubUrl: string
  portfolioUrl: string
  summary: string
}

export interface EducationEntry {
  id: string
  institution: string
  degree: string
  fieldOfStudy: string
  startDate: string
  endDate: string // "Present" or date string
  grade?: string // optional CGPA / GPA
}

export interface TechnicalSkills {
  languages: string[]
  frameworks: string[]
  tools: string[]
  softSkills: string[]
}

export interface ProjectEntry {
  id: string
  name: string
  description: string
  technologies: string[]
  projectUrl?: string
  githubUrl?: string
}

export interface ExperienceEntry {
  id: string
  organization: string
  role: string
  startDate: string
  endDate: string // "Present" or date string
  bullets: string[]
}

export interface CertificationEntry {
  id: string
  name: string
  issuer: string
  issueDate?: string
  credentialUrl?: string
}

export interface AdditionalInfo {
  achievements: string[]
  coursework: string[]
  languages: string[]
}

export type ResumeTemplateId =
  | 'classic-ats'
  | 'modern-professional'
  | 'technical'
  | 'minimal'
  | 'classic'
  | 'modern'

export interface SectionVisibility {
  summary?: boolean
  education?: boolean
  skills?: boolean
  experience?: boolean
  projects?: boolean
  certifications?: boolean
  additional?: boolean
}

export interface ResumeData {
  version: number
  id: string
  title: string
  template: ResumeTemplateId
  updatedAt: string
  personalInfo: PersonalInfo
  education: EducationEntry[]
  skills: TechnicalSkills
  projects: ProjectEntry[]
  experience: ExperienceEntry[]
  certifications: CertificationEntry[]
  additional: AdditionalInfo
  visibleSections?: SectionVisibility
}

export interface ValidationIssues {
  emailError?: string
  linkedinError?: string
  githubError?: string
  portfolioError?: string
  missingRequired: string[]
}
