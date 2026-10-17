import React, { useState, useEffect, useRef, useCallback } from 'react'
import type { PortfolioData, PortfolioThemeId } from './types.ts'
import { loadPortfolioDraft, savePortfolioDraft, clearPortfolioDraft } from './storage.ts'
import { SAMPLE_PORTFOLIO_DATA, DEFAULT_EMPTY_PORTFOLIO } from './sampleData.ts'
import { PortfolioToolbar } from './components/builder/PortfolioToolbar.tsx'
import { PortfolioValidationBar } from './components/builder/PortfolioValidationBar.tsx'
import { PortfolioEditor } from './components/builder/PortfolioEditor.tsx'
import { PortfolioPreviewFrame } from './components/builder/PortfolioPreviewFrame.tsx'
import { ResumeImportModal } from './components/builder/ResumeImportModal.tsx'
import { DraftMigrationModal } from '../../components/auth/DraftMigrationModal.tsx'
import { PortfolioCompletionModal } from '../../components/portfolio/PortfolioCompletionModal.tsx'
import { useAuth } from '../../app/providers/AuthContext.tsx'
import { useApp } from '../../app/providers/AppContext.ts'
import { portfolioService, type PortfolioRow } from '../../services/portfolioService.ts'
import { Cloud, HardDrive, AlertTriangle, X } from 'lucide-react'

export interface PortfolioProps {
  onBack?: () => void
  onViewPublic?: () => void
}

type SaveState = 'saving' | 'saved_cloud' | 'saved_local' | 'offline' | 'error'

export const PortfolioPage: React.FC<PortfolioProps> = ({ onBack, onViewPublic }) => {
  const { user, isConfigured } = useAuth()
  const { setIsAuthOpen, setAuthMode } = useApp()

  // Initialize portfolio state safely from localStorage
  const [portfolioData, setPortfolioData] = useState<PortfolioData>(() => {
    const loaded = loadPortfolioDraft()
    return loaded.data
  })

  const [cloudPortfolio, setCloudPortfolio] = useState<PortfolioRow | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('saved_local')
  const [lastSavedText, setLastSavedText] = useState<string>('Saved to browser')
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor')
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false)
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState<boolean>(false)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false)
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState<boolean>(false)

  // Tracking pending updates and async request sequence to avoid stale overwrites
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const latestRequestIdRef = useRef<number>(0)
  const pendingDataRef = useRef<PortfolioData>(portfolioData)

  // Cloud load & local migration detection
  const checkCloudData = useCallback(async (userId: string) => {
    try {
      const { data: cloudRec } = await portfolioService.getUserPortfolio(userId)
      const local = loadPortfolioDraft()

      if (cloudRec && cloudRec.portfolio_data) {
        setCloudPortfolio(cloudRec)
        // If local draft is custom (not sample) and differs, offer choice
        if (!local.isSample && JSON.stringify(local.data) !== JSON.stringify(cloudRec.portfolio_data)) {
          setIsMigrationModalOpen(true)
        } else {
          // Cloud record is the source of truth
          const cData = cloudRec.portfolio_data as unknown as PortfolioData
          setPortfolioData(cData)
          pendingDataRef.current = cData
          setSaveState('saved_cloud')
          const time = new Date(cloudRec.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          setLastSavedText(`Saved to cloud at ${time}`)
        }
      } else if (!local.isSample) {
        // No cloud record, but user has a real local draft
        setIsMigrationModalOpen(true)
      }
    } catch (err) {
      console.warn('Failed to fetch cloud portfolio:', err)
      setSaveState('saved_local')
      setLastSavedText('Saved to browser (offline)')
    }
  }, [])

  useEffect(() => {
    if (user?.id && isConfigured) {
      checkCloudData(user.id)
    }
  }, [user?.id, isConfigured, checkCloudData])

  // Save to Cloud and Local Backup with Sequence ID
  const persistData = useCallback(
    async (dataToSave: PortfolioData) => {
      // 1. Instant local storage backup
      savePortfolioDraft(dataToSave)

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
          const { data: savedRow, error } = await portfolioService.saveUserPortfolio(
            user.id,
            dataToSave,
            dataToSave.profile.slug,
          )

          // Discard stale response if a newer edit occurred
          if (currentRequestId !== latestRequestIdRef.current) {
            return
          }

          if (error) throw error

          if (savedRow) {
            setCloudPortfolio(savedRow)
          }

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
  const handleDataChange = (updated: PortfolioData) => {
    setPortfolioData(updated)
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
  const handleManualSave = async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    setSaveState('saving')
    setLastSavedText('Saving changes...')
    await persistData(portfolioData)
    setIsCompletionModalOpen(true)
  }

  // Handle migration modal decisions
  const handleImportToCloud = async () => {
    if (user?.id) {
      const local = loadPortfolioDraft()
      const { data: savedRow } = await portfolioService.saveUserPortfolio(user.id, local.data, local.data.profile.slug)
      if (savedRow) setCloudPortfolio(savedRow)
      setPortfolioData(local.data)
      pendingDataRef.current = local.data
      setSaveState('saved_cloud')
      setLastSavedText('Local draft synced to cloud')
    }
  }

  const handleKeepCloud = async () => {
    if (cloudPortfolio?.portfolio_data) {
      const cloudData = cloudPortfolio.portfolio_data as unknown as PortfolioData
      setPortfolioData(cloudData)
      pendingDataRef.current = cloudData
      savePortfolioDraft(cloudData)
      setSaveState('saved_cloud')
      setLastSavedText('Synced with cloud version')
    }
  }

  // Theme switch
  const handleChangeTheme = (theme: PortfolioThemeId) => {
    handleDataChange({
      ...portfolioData,
      theme,
    })
  }

  // Slug edit
  const handleChangeSlug = (slug: string) => {
    handleDataChange({
      ...portfolioData,
      profile: {
        ...portfolioData.profile,
        slug,
      },
    })
  }

  // Load sample demo data
  const handleLoadSample = () => {
    handleDataChange(SAMPLE_PORTFOLIO_DATA)
  }

  // Confirmed Clear all data
  const handleConfirmClearAll = () => {
    clearPortfolioDraft()
    setPortfolioData(DEFAULT_EMPTY_PORTFOLIO)
    pendingDataRef.current = DEFAULT_EMPTY_PORTFOLIO
    setIsResetConfirmOpen(false)
    setSaveState('saved_local')
    setLastSavedText('Draft reset to blank')

    if (user?.id && isConfigured) {
      portfolioService.saveUserPortfolio(user.id, DEFAULT_EMPTY_PORTFOLIO, DEFAULT_EMPTY_PORTFOLIO.profile.slug).catch(console.warn)
    }
  }

  // Confirm import from ATS resume
  const handleConfirmImport = (imported: PortfolioData) => {
    handleDataChange(imported)
  }

  // Clean up auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

  const isSaved = saveState === 'saved_cloud' || saveState === 'saved_local'

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#111827] flex flex-col">
      {/* 1. Header Toolbar */}
      <PortfolioToolbar
        data={portfolioData}
        onChangeSlug={handleChangeSlug}
        onChangeTheme={handleChangeTheme}
        onSaveDraft={handleManualSave}
        isSaved={isSaved}
        lastSavedText={lastSavedText}
        onLoadSample={handleLoadSample}
        onClearAll={() => setIsResetConfirmOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onViewPublic={() => onViewPublic?.()}
        onOpenCompletionModal={() => setIsCompletionModalOpen(true)}
        onBack={onBack}
        mobileView={mobileView}
        onToggleMobileView={setMobileView}
      />

      {/* 2. Responsive Split Workspace */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Form Editor */}
        <div
          className={`w-full lg:w-[48%] xl:w-[45%] flex flex-col border-r border-[#E2E8F0] bg-white overflow-y-auto ${
            mobileView === 'preview' ? 'hidden lg:flex' : 'flex'
          }`}
          style={{ maxHeight: 'calc(100vh - 61px)' }}
        >
          <div className="p-4 sm:p-6 space-y-4">
            {/* Storage status badge */}
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#64748B]">
              {user && isConfigured ? (
                <Cloud className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              ) : (
                <HardDrive className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold text-[#111827]">
                  {user && isConfigured ? 'Cloud Sync Active:' : 'Local Storage Mode:'}
                </span>{' '}
                {user && isConfigured
                  ? `Your draft is continuously saved to your private Supabase cloud account and backed up in this browser.`
                  : `Your portfolio is saved in your browser's local storage. Sign in with Supabase to sync your drafts across devices and publish online.`}
              </div>
            </div>

            {/* Validation & Completeness Bar */}
            <PortfolioValidationBar data={portfolioData} />

            {/* Interactive Accordion Editor */}
            <PortfolioEditor
              data={portfolioData}
              onChange={handleDataChange}
              onOpenCompletionModal={() => setIsCompletionModalOpen(true)}
            />
          </div>
        </div>

        {/* Right Column: Live Portfolio Preview Frame */}
        <div
          className={`w-full lg:w-[52%] xl:w-[55%] flex-1 bg-[#F1F5F9] overflow-hidden ${
            mobileView === 'editor' ? 'hidden lg:flex flex-col' : 'flex flex-col'
          }`}
          style={{ maxHeight: 'calc(100vh - 61px)' }}
        >
          <PortfolioPreviewFrame
            data={portfolioData}
            onChangeTheme={handleChangeTheme}
            onOpenPublicView={() => onViewPublic?.()}
          />
        </div>
      </main>

      {/* 3. Resume Import Modal */}
      <ResumeImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        currentPortfolio={portfolioData}
        onConfirmImport={handleConfirmImport}
      />

      {/* 4. Local-to-Cloud Draft Migration Modal */}
      <DraftMigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
        onImportToCloud={handleImportToCloud}
        onKeepCloud={handleKeepCloud}
        hasLocalPortfolio={true}
        hasCloudPortfolio={Boolean(cloudPortfolio)}
        localSavedTime={portfolioData.updatedAt ? new Date(portfolioData.updatedAt).toLocaleTimeString() : null}
        cloudSavedTime={cloudPortfolio?.updated_at ? new Date(cloudPortfolio.updated_at).toLocaleTimeString() : null}
      />

      {/* 5. Destructive Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                  <AlertTriangle className="w-5 h-5" />
                </span>
                <h3 className="text-base font-bold text-[#111827]">Reset Portfolio Draft?</h3>
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
              Are you sure you want to clear your current portfolio draft? All configured projects, biography, skills, and theme customizations will be reset to a clean blank state. This action cannot be undone.
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
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-sm"
              >
                Confirm & Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Portfolio Completion & Publishing Modal */}
      <PortfolioCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        portfolioData={portfolioData}
        cloudPortfolio={cloudPortfolio}
        onRefreshCloudPortfolio={async () => {
          if (user?.id) await checkCloudData(user.id)
        }}
        onPreview={() => onViewPublic?.()}
        onOpenAuth={() => {
          setIsAuthOpen(true)
          setAuthMode('signup')
        }}
        onSlugChange={handleChangeSlug}
      />
    </div>
  )
}

export default PortfolioPage
