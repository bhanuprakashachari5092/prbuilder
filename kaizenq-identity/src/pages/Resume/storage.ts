import type { ResumeData } from './types.ts'
import { DEFAULT_EMPTY_RESUME } from './sampleData.ts'

const STORAGE_KEY = 'kaizenq_resume_draft_v1'

export interface StorageStatus {
  available: boolean
  hasExistingDraft: boolean
  lastSavedAt: string | null
}

export function checkStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false
    const testKey = '__storage_test__'
    window.localStorage.setItem(testKey, testKey)
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

export function loadResumeDraft(): { data: ResumeData; isSample: boolean } {
  if (!checkStorageAvailable()) {
    return { data: DEFAULT_EMPTY_RESUME, isSample: false }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // Clean blank resume by default - sample content available only on explicit user request
      return { data: DEFAULT_EMPTY_RESUME, isSample: false }
    }

    const parsed = JSON.parse(raw) as Partial<ResumeData>
    if (parsed && typeof parsed === 'object' && parsed.personalInfo) {
      // Safely merge with default structure to prevent missing-property errors
      const merged: ResumeData = {
        ...DEFAULT_EMPTY_RESUME,
        ...parsed,
        personalInfo: {
          ...DEFAULT_EMPTY_RESUME.personalInfo,
          ...parsed.personalInfo,
        },
        skills: {
          ...DEFAULT_EMPTY_RESUME.skills,
          ...parsed.skills,
        },
        additional: {
          ...DEFAULT_EMPTY_RESUME.additional,
          ...parsed.additional,
        },
        visibleSections: {
          ...DEFAULT_EMPTY_RESUME.visibleSections,
          ...parsed.visibleSections,
        },
      }
      return { data: merged, isSample: false }
    }
  } catch (err) {
    console.warn('Failed to parse saved resume draft from localStorage:', err)
  }

  return { data: DEFAULT_EMPTY_RESUME, isSample: false }
}

export function saveResumeDraft(data: ResumeData): boolean {
  if (!checkStorageAvailable()) return false

  try {
    const toSave: ResumeData = {
      ...data,
      updatedAt: new Date().toISOString(),
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    return true
  } catch (err) {
    console.error('Failed to save resume draft to localStorage:', err)
    return false
  }
}

export function clearResumeDraft(): boolean {
  if (!checkStorageAvailable()) return false
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
