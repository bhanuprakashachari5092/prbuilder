import type { ResumeData } from '../Resume/types.ts'
import type { PortfolioData } from './types.ts'
import { loadResumeDraft } from '../Resume/storage.ts'

export interface ResumeImportSummary {
  hasResumeDraft: boolean
  fullName: string
  title: string
  skillsCount: number
  projectsCount: number
  educationCount: number
  experienceCount: number
  certificationsCount: number
}

export function getResumeDraftSummary(): { summary: ResumeImportSummary; resumeData: ResumeData | null } {
  try {
    const { data } = loadResumeDraft()
    if (!data) {
      return {
        summary: {
          hasResumeDraft: false,
          fullName: '',
          title: '',
          skillsCount: 0,
          projectsCount: 0,
          educationCount: 0,
          experienceCount: 0,
          certificationsCount: 0,
        },
        resumeData: null,
      }
    }

    const totalSkills =
      data.skills.languages.length +
      data.skills.frameworks.length +
      data.skills.tools.length +
      data.skills.softSkills.length

    return {
      summary: {
        hasResumeDraft: true,
        fullName: data.personalInfo.fullName,
        title: data.personalInfo.title,
        skillsCount: totalSkills,
        projectsCount: data.projects.length,
        educationCount: data.education.length,
        experienceCount: data.experience.length,
        certificationsCount: data.certifications.length,
      },
      resumeData: data,
    }
  } catch {
    return {
      summary: {
        hasResumeDraft: false,
        fullName: '',
        title: '',
        skillsCount: 0,
        projectsCount: 0,
        educationCount: 0,
        experienceCount: 0,
        certificationsCount: 0,
      },
      resumeData: null,
    }
  }
}

export function convertResumeToPortfolio(
  resume: ResumeData,
  existing: PortfolioData,
): PortfolioData {
  const generatedSlug = resume.personalInfo.fullName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'portfolio'

  return {
    ...existing,
    profile: {
      ...existing.profile,
      fullName: resume.personalInfo.fullName || existing.profile.fullName,
      title: resume.personalInfo.title || existing.profile.title,
      location: resume.personalInfo.location || existing.profile.location,
      shortBio: resume.personalInfo.summary || existing.profile.shortBio,
      aboutMe: resume.personalInfo.summary || existing.profile.aboutMe,
      email: resume.personalInfo.email || existing.profile.email,
      phone: resume.personalInfo.phone || existing.profile.phone,
      linkedinUrl: resume.personalInfo.linkedinUrl || existing.profile.linkedinUrl,
      githubUrl: resume.personalInfo.githubUrl || existing.profile.githubUrl,
      portfolioUrl: resume.personalInfo.portfolioUrl || existing.profile.portfolioUrl,
      slug: existing.profile.slug && existing.profile.slug !== 'portfolio' ? existing.profile.slug : generatedSlug,
    },
    skills: {
      languages: resume.skills.languages.length > 0 ? [...resume.skills.languages] : existing.skills.languages,
      frameworks: resume.skills.frameworks.length > 0 ? [...resume.skills.frameworks] : existing.skills.frameworks,
      tools: resume.skills.tools.length > 0 ? [...resume.skills.tools] : existing.skills.tools,
      otherSkills: resume.skills.softSkills.length > 0 ? [...resume.skills.softSkills] : existing.skills.otherSkills,
    },
    education: resume.education.length > 0
      ? resume.education.map((e) => ({
          id: e.id || `edu-${Date.now()}-${Math.random()}`,
          institution: e.institution,
          degree: e.degree,
          specialization: e.fieldOfStudy,
          startDate: e.startDate,
          endDate: e.endDate,
          grade: e.grade,
        }))
      : existing.education,
    projects: resume.projects.length > 0
      ? resume.projects.map((p) => ({
          id: p.id || `proj-${Date.now()}-${Math.random()}`,
          title: p.name,
          description: p.description,
          technologies: [...p.technologies],
          githubUrl: p.githubUrl,
          liveUrl: p.projectUrl,
        }))
      : existing.projects,
    experience: resume.experience.length > 0
      ? resume.experience.map((exp) => ({
          id: exp.id || `exp-${Date.now()}-${Math.random()}`,
          organization: exp.organization,
          role: exp.role,
          startDate: exp.startDate,
          endDate: exp.endDate,
          description: exp.bullets.join('\n'),
        }))
      : existing.experience,
    certifications: resume.certifications.length > 0
      ? resume.certifications.map((c) => ({
          id: c.id || `cert-${Date.now()}-${Math.random()}`,
          name: c.name,
          issuer: c.issuer,
          issueDate: c.issueDate,
          credentialUrl: c.credentialUrl,
        }))
      : existing.certifications,
    achievements: resume.additional.achievements.length > 0
      ? resume.additional.achievements.map((ach, idx) => ({
          id: `ach-imported-${idx}`,
          title: ach,
          description: 'Recognized achievement from professional curriculum.',
        }))
      : existing.achievements,
    contact: {
      ...existing.contact,
      email: resume.personalInfo.email || existing.contact.email,
    },
    updatedAt: new Date().toISOString(),
  }
}
