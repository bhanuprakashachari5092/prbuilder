import type { PortfolioData } from './types.ts'
import { DEFAULT_EMPTY_PORTFOLIO } from './sampleData.ts'

const STORAGE_KEY = 'kaizenq_portfolio_draft_v1'

export function checkStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false
    const testKey = '__storage_portfolio_test__'
    window.localStorage.setItem(testKey, testKey)
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

export function loadPortfolioDraft(): { data: PortfolioData; isSample: boolean } {
  if (!checkStorageAvailable()) {
    return { data: DEFAULT_EMPTY_PORTFOLIO, isSample: false }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // Clean blank portfolio draft by default - sample content available only on explicit user request
      return { data: DEFAULT_EMPTY_PORTFOLIO, isSample: false }
    }

    const parsed = JSON.parse(raw) as Partial<PortfolioData>
    if (parsed && typeof parsed === 'object' && parsed.profile) {
      // Safe merge to ensure all sections and visibility flags exist
      const merged: PortfolioData = {
        ...DEFAULT_EMPTY_PORTFOLIO,
        ...parsed,
        profile: {
          ...DEFAULT_EMPTY_PORTFOLIO.profile,
          ...parsed.profile,
        },
        skills: {
          ...DEFAULT_EMPTY_PORTFOLIO.skills,
          ...parsed.skills,
        },
        contact: {
          ...DEFAULT_EMPTY_PORTFOLIO.contact,
          ...parsed.contact,
        },
        sectionVisibility: {
          ...DEFAULT_EMPTY_PORTFOLIO.sectionVisibility,
          ...parsed.sectionVisibility,
        },
        education: Array.isArray(parsed.education) ? parsed.education : DEFAULT_EMPTY_PORTFOLIO.education,
        projects: Array.isArray(parsed.projects) ? parsed.projects : DEFAULT_EMPTY_PORTFOLIO.projects,
        experience: Array.isArray(parsed.experience) ? parsed.experience : DEFAULT_EMPTY_PORTFOLIO.experience,
        achievements: Array.isArray(parsed.achievements) ? parsed.achievements : DEFAULT_EMPTY_PORTFOLIO.achievements,
        certifications: Array.isArray(parsed.certifications) ? parsed.certifications : DEFAULT_EMPTY_PORTFOLIO.certifications,
      }
      return { data: merged, isSample: false }
    }
  } catch (err) {
    console.warn('Failed to parse portfolio draft from localStorage:', err)
  }

  return { data: DEFAULT_EMPTY_PORTFOLIO, isSample: false }
}

export function savePortfolioDraft(data: PortfolioData): boolean {
  if (!checkStorageAvailable()) return false

  try {
    const toSave: PortfolioData = {
      ...data,
      updatedAt: new Date().toISOString(),
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    return true
  } catch (err) {
    console.error('Failed to save portfolio draft to localStorage:', err)
    return false
  }
}

export function clearPortfolioDraft(): boolean {
  if (!checkStorageAvailable()) return false
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
