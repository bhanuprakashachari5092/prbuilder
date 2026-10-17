import type { PortfolioData, PortfolioValidationIssues } from './types.ts'

export const RESERVED_SLUGS = [
  'admin',
  'dashboard',
  'auth',
  'api',
  'login',
  'signup',
  'settings',
  'portfolio',
  'resume',
  'p',
  'help',
  'support',
]

/**
 * Validates that an external URL starts with http:// or https://
 * and explicitly rejects unsafe schemes such as javascript:, data:, etc.
 */
export function isValidHttpUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (!trimmed) return false

  // Reject dangerous schemes
  const lower = trimmed.toLowerCase()
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return false
  }

  // Must start with http:// or https:// and have valid URL structure
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return /^https?:\/\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]+$/i.test(trimmed)
  }
}

/**
 * Format helper for external links: ensures a clean href with https:// prefix
 */
export function formatExternalUrl(url?: string): string {
  if (!url) return ''
  const trimmed = url.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  return `https://${trimmed}`
}

export function validatePortfolio(data: PortfolioData): PortfolioValidationIssues {
  const missing: string[] = []
  let emailError: string | undefined
  let linkedinError: string | undefined
  let githubError: string | undefined
  let portfolioUrlError: string | undefined
  let twitterUrlError: string | undefined
  let resumeUrlError: string | undefined
  let slugError: string | undefined
  const liveUrlErrors: Record<string, string> = {}
  const projectGithubErrors: Record<string, string> = {}
  const projectImageErrors: Record<string, string> = {}
  const certCredentialErrors: Record<string, string> = {}

  // Profile validation
  if (!data.profile.fullName.trim()) missing.push('Full Name')
  if (!data.profile.title.trim()) missing.push('Professional Title')
  if (!data.profile.shortBio.trim() && !data.profile.aboutMe.trim()) missing.push('Bio or About section')

  // Email format check
  if (data.profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.profile.email.trim())) {
    emailError = 'Please enter a valid email format (e.g. name@domain.com)'
  }

  // Links validation
  if (data.profile.linkedinUrl && !isValidHttpUrl(data.profile.linkedinUrl)) {
    linkedinError = 'LinkedIn URL must start with http:// or https://'
  }
  if (data.profile.githubUrl && !isValidHttpUrl(data.profile.githubUrl)) {
    githubError = 'GitHub URL must start with http:// or https://'
  }
  if (data.profile.portfolioUrl && !isValidHttpUrl(data.profile.portfolioUrl)) {
    portfolioUrlError = 'Portfolio URL must start with http:// or https://'
  }
  if (data.profile.twitterUrl && !isValidHttpUrl(data.profile.twitterUrl)) {
    twitterUrlError = 'Social URL must start with http:// or https://'
  }
  if (data.profile.resumeUrl && !isValidHttpUrl(data.profile.resumeUrl)) {
    resumeUrlError = 'Resume download URL must start with http:// or https://'
  }

  // Slug validation
  const cleanSlug = data.profile.slug.trim().toLowerCase()
  if (!cleanSlug) {
    slugError = 'Slug cannot be empty'
  } else if (cleanSlug.length < 3 || cleanSlug.length > 48) {
    slugError = 'Slug must be between 3 and 48 characters'
  } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(cleanSlug)) {
    slugError = 'Slug must only contain lowercase letters, numbers, and hyphens without leading or trailing hyphens'
  } else if (RESERVED_SLUGS.includes(cleanSlug)) {
    slugError = `"${cleanSlug}" is a reserved system path`
  }

  // Skills check
  const totalSkills =
    data.skills.languages.length +
    data.skills.frameworks.length +
    data.skills.tools.length +
    data.skills.otherSkills.length
  if (totalSkills === 0) missing.push('At least 1 Skill tag')

  // Projects check
  if (data.projects.length === 0) missing.push('At least 1 Project')

  // Project URLs check
  data.projects.forEach((proj) => {
    if (proj.liveUrl && !isValidHttpUrl(proj.liveUrl)) {
      liveUrlErrors[proj.id] = 'Live URL must start with http:// or https://'
    }
    if (proj.githubUrl && !isValidHttpUrl(proj.githubUrl)) {
      projectGithubErrors[proj.id] = 'GitHub URL must start with http:// or https://'
    }
    if (proj.imageUrl && !isValidHttpUrl(proj.imageUrl)) {
      projectImageErrors[proj.id] = 'Image URL must start with http:// or https://'
    }
  })

  // Certifications URLs check
  data.certifications.forEach((cert) => {
    if (cert.credentialUrl && !isValidHttpUrl(cert.credentialUrl)) {
      certCredentialErrors[cert.id] = 'Credential URL must start with http:// or https://'
    }
  })

  return {
    emailError,
    linkedinError,
    githubError,
    portfolioUrlError,
    twitterUrlError,
    resumeUrlError,
    liveUrlErrors,
    projectGithubErrors,
    projectImageErrors,
    certCredentialErrors,
    slugError,
    missingRequired: missing,
  }
}

export function calculatePortfolioCompleteness(data: PortfolioData): number {
  let score = 0
  const maxScore = 7

  if (data.profile.fullName.trim()) score += 1
  if (data.profile.title.trim()) score += 1
  if (data.profile.shortBio.trim() || data.profile.aboutMe.trim()) score += 1
  if (data.skills.languages.length + data.skills.frameworks.length > 0) score += 1
  if (data.projects.length > 0) score += 1
  if (data.experience.length > 0 || data.education.length > 0) score += 1
  if (data.contact.email || data.profile.email) score += 1

  return Math.round((score / maxScore) * 100)
}
