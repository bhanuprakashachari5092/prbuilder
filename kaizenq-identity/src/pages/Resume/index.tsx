import React, { useState, useEffect, useRef, useCallback } from 'react'
import type { ResumeData, ResumeTemplateId } from './types.ts'
import { loadResumeDraft, saveResumeDraft, clearResumeDraft } from './storage.ts'
import { SAMPLE_RESUME_DATA, DEFAULT_EMPTY_RESUME } from './sampleData.ts'
import { ResumeToolbar } from './components/ResumeToolbar.tsx'
import { ResumeValidationBar } from './components/ResumeValidationBar.tsx'
import { ResumeEditor } from './components/ResumeEditor.tsx'
import { ResumePreview } from './components/ResumePreview.tsx'
import { PdfInstructionsModal } from './components/PdfInstructionsModal.tsx'
import { useAuth } from '../../app/providers/AuthContext.tsx'
import { resumeService } from '../../services/resumeService.ts'
import { Cloud, HardDrive, AlertTriangle, X } from 'lucide-react'

export interface ResumeProps {
  onBack?: () => void
}

type SaveState = 'saving' | 'saved_cloud' | 'saved_local' | 'offline' | 'error'

export const Resume: React.FC<ResumeProps> = ({ onBack }) => {
  const { user, isConfigured } = useAuth()

  // Initial state loaded safely from localStorage or sample fallback
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    const loaded = loadResumeDraft()
    return loaded.data
  })

  const [saveState, setSaveState] = useState<SaveState>('saved_local')
  const [lastSavedText, setLastSavedText] = useState<string>('Saved to browser')
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor')
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false)

  // Tracking pending updates and async request sequence to avoid stale overwrites
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const latestRequestIdRef = useRef<number>(0)
  const pendingDataRef = useRef<ResumeData>(resumeData)

  // Cloud sync check on mount
  const checkCloudResume = useCallback(async (userId: string) => {
    try {
      const { data: cloudRec } = await resumeService.getUserResume(userId)
      const local = loadResumeDraft()

      if (cloudRec && cloudRec.resume_data) {
        setResumeData(cloudRec.resume_data as unknown as ResumeData)
        pendingDataRef.current = cloudRec.resume_data as unknown as ResumeData
        setSaveState('saved_cloud')
        const time = new Date(cloudRec.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        setLastSavedText(`Saved to cloud at ${time}`)
      } else if (!local.isSample) {
        // Automatically sync local draft to new cloud account
        await resumeService.saveUserResume(userId, local.data)
        setSaveState('saved_cloud')
        setLastSavedText('Saved to cloud')
      }
    } catch (err) {
      console.warn('Failed to fetch cloud resume:', err)
      setSaveState('saved_local')
      setLastSavedText('Saved to browser (offline)')
    }
  }, [])

  useEffect(() => {
    if (user?.id && isConfigured) {
      checkCloudResume(user.id)
    }
  }, [user?.id, isConfigured, checkCloudResume])

  // Resilient Cloud & Local Persistence with Sequence ID
  const persistData = useCallback(
    async (updated: ResumeData) => {
      // 1. Instant local storage backup
      saveResumeDraft(updated)

      // 2. Network connectivity check
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setSaveState('offline')
        setLastSavedText('Offline • Saved to local draft')
        return
      }

      // 3. Increment request sequence
      const currentRequestId = ++latestRequestIdRef.current

      if (user?.id && isConfigured) {
        try {
          const { error } = await resumeService.saveUserResume(user.id, updated)

          // Discard if a newer edit request has already been issued
          if (currentRequestId !== latestRequestIdRef.current) {
            return
          }

          if (error) throw error

          setSaveState('saved_cloud')
          const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          setLastSavedText(`Saved to cloud at ${now}`)
        } catch {
          if (currentRequestId === latestRequestIdRef.current) {
            setSaveState('error')
            setLastSavedText('Save failed • Retrying when connected')
          }
        }
      } else {
        setSaveState('saved_local')
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        setLastSavedText(`Saved to browser at ${now}`)
      }
    },
    [user?.id, isConfigured],
  )

  // Reconnect listener to retry pending edits safely
  useEffect(() => {
    const handleOnline = () => {
      if (user?.id && isConfigured) {
        setSaveState('saving')
        setLastSavedText('Reconnected • Syncing changes...')
        persistData(pendingDataRef.current)
      }
    }

    const handleOffline = () => {
      setSaveState('offline')
      setLastSavedText('Connection lost • Working offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [user?.id, isConfigured, persistData])

  // Auto-save debounce logic
  const handleDataChange = (updated: ResumeData) => {
    setResumeData(updated)
    pendingDataRef.current = updated
    setSaveState('saving')
    setLastSavedText('Saving changes...')

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      persistData(updated)
    }, 1200)
  }

  // Explicit Save Draft button click
  const handleManualSave = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    setSaveState('saving')
    setLastSavedText('Saving changes...')
    persistData(resumeData)
  }

  // Template switch (preserves all data)
  const handleChangeTemplate = (template: ResumeTemplateId) => {
    handleDataChange({
      ...resumeData,
      template,
    })
  }

  // Title edit
  const handleChangeTitle = (title: string) => {
    handleDataChange({
      ...resumeData,
      title,
    })
  }

  // Load Authentic Sample Demo Data
  const handleLoadSample = () => {
    handleDataChange(SAMPLE_RESUME_DATA)
  }

  // Confirmed Clear All
  const handleConfirmClearAll = () => {
    clearResumeDraft()
    setResumeData(DEFAULT_EMPTY_RESUME)
    pendingDataRef.current = DEFAULT_EMPTY_RESUME
    setIsResetConfirmOpen(false)
    setSaveState('saved_local')
    setLastSavedText('Draft reset to blank')

    if (user?.id && isConfigured) {
      resumeService.saveUserResume(user.id, DEFAULT_EMPTY_RESUME).catch(console.warn)
    }
  }

  // PDF Print trigger
  const handleConfirmPrint = () => {
    setTimeout(() => {
      window.print()
    }, 120)
  }

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

  const isSaved = saveState === 'saved_cloud' || saveState === 'saved_local'

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#111827] flex flex-col resume-workspace-container">
      {/* 1. Header Toolbar */}
      <ResumeToolbar
        data={resumeData}
        onChangeTitle={handleChangeTitle}
        onChangeTemplate={handleChangeTemplate}
        onSaveDraft={handleManualSave}
        isSaved={isSaved}
        lastSavedText={lastSavedText}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        onLoadSample={handleLoadSample}
        onClearAll={() => setIsResetConfirmOpen(true)}
        onBack={onBack}
        mobileView={mobileView}
        onToggleMobileView={setMobileView}
      />

      {/* 2. Split Workspace Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Form Editor */}
        <div
          className={`resume-editor-panel w-full lg:w-[48%] xl:w-[45%] flex flex-col border-r border-[#E2E8F0] bg-white overflow-y-auto no-print ${
            mobileView === 'preview' ? 'hidden lg:flex' : 'flex'
          }`}
          style={{ maxHeight: 'calc(100vh - 65px)' }}
        >
          <div className="p-4 sm:p-6 space-y-4">
            {/* Storage status disclosure */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B]">
              {user && isConfigured ? (
                <Cloud className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              ) : (
                <HardDrive className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold text-[#111827]">
                  {user && isConfigured ? 'Private Cloud Sync:' : 'Client-Side Draft Storage:'}
                </span>{' '}
                {user && isConfigured
                  ? 'Your resume is securely stored in your private Supabase database and never exposed publicly.'
                  : 'Your resume draft is saved locally in this browser. Sign in to enable secure cloud backups.'}
              </div>
            </div>

            {/* Field Validation & ATS Completeness Progress */}
            <ResumeValidationBar data={resumeData} />

            {/* Interactive Section Forms */}
            <ResumeEditor data={resumeData} onChange={handleDataChange} />
          </div>
        </div>

        {/* Right Column: Live A4 Preview */}
        <div
          className={`resume-preview-panel w-full lg:w-[52%] xl:w-[55%] flex-1 bg-[#F1F5F9] overflow-hidden ${
            mobileView === 'editor' ? 'hidden lg:flex flex-col' : 'flex flex-col'
          }`}
          style={{ maxHeight: 'calc(100vh - 65px)' }}
        >
          <ResumePreview data={resumeData} />
        </div>
      </main>

      {/* 3. Export PDF Guidance Modal */}
      <PdfInstructionsModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onConfirmPrint={handleConfirmPrint}
      />

      {/* 4. Destructive Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl p-6 space-y-4 text-[#111827]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                  <AlertTriangle className="w-5 h-5" />
                </span>
                <h3 className="text-base font-bold text-[#111827]">Reset Resume Draft?</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="text-[#64748B] hover:text-[#111827]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to clear your current resume? All entered experience, education, skills, and summary sections will be erased back to a blank template. This action cannot be undone.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC] transition-colors"
              >
                Keep Current Draft
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm"
              >
                Confirm & Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Resume
