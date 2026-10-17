import React, { useState } from 'react'
import { motion } from 'motion/react'
import { CloudUpload, HardDrive, AlertTriangle, ArrowRight, X, Check } from 'lucide-react'
import { Button } from '../ui/Button.tsx'

export interface DraftMigrationModalProps {
  isOpen: boolean
  onClose: () => void
  onImportToCloud: () => Promise<void>
  onKeepCloud: () => Promise<void>
  hasLocalPortfolio: boolean
  hasCloudPortfolio: boolean
  localSavedTime?: string | null
  cloudSavedTime?: string | null
}

export const DraftMigrationModal: React.FC<DraftMigrationModalProps> = ({
  isOpen,
  onClose,
  onImportToCloud,
  onKeepCloud,
  hasCloudPortfolio,
  localSavedTime,
  cloudSavedTime,
}) => {
  const [loadingAction, setLoadingAction] = useState<'import' | 'keep' | null>(null)
  const [completedMessage, setCompletedMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleImport = async () => {
    setLoadingAction('import')
    try {
      await onImportToCloud()
      setCompletedMessage('Local draft successfully imported to your cloud account!')
      setTimeout(() => {
        onClose()
      }, 1200)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleKeepCloud = async () => {
    setLoadingAction('keep')
    try {
      await onKeepCloud()
      setCompletedMessage('Using your cloud portfolio.')
      setTimeout(() => {
        onClose()
      }, 1000)
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl p-6 sm:p-8 relative space-y-6 text-[#111827]"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC] transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <CloudUpload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#111827]">
              {hasCloudPortfolio ? 'Draft Conflict Detected' : 'Import Local Draft to Cloud'}
            </h3>
            <p className="text-xs text-[#64748B]">
              {hasCloudPortfolio
                ? 'We found drafts both in your browser and on the cloud'
                : 'Found an existing portfolio draft saved in this browser'}
            </p>
          </div>
        </div>

        {completedMessage ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#111827]">{completedMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Local Draft Info */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#2563EB] font-semibold">
                  <HardDrive className="w-4 h-4" />
                  <span>Browser Draft</span>
                </div>
                <p className="text-[#64748B] text-[11px]">
                  Saved on this device
                </p>
                {localSavedTime && (
                  <p className="font-mono text-[10px] text-[#64748B]">{localSavedTime}</p>
                )}
              </div>

              {/* Cloud Data Info */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#2563EB] font-semibold">
                  <CloudUpload className="w-4 h-4" />
                  <span>Cloud Account</span>
                </div>
                <p className="text-[#64748B] text-[11px]">
                  {hasCloudPortfolio ? 'Existing cloud version' : 'No cloud draft yet'}
                </p>
                {cloudSavedTime && (
                  <p className="font-mono text-[10px] text-[#64748B]">{cloudSavedTime}</p>
                )}
              </div>
            </div>

            {hasCloudPortfolio ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <p className="leading-relaxed">
                  Choosing to import will replace your current cloud draft with the browser draft. Your browser draft remains preserved as a local backup.
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#64748B] leading-relaxed">
                Sync your browser draft to your authenticated cloud account so you can edit and publish it from anywhere.
              </p>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <Button
                variant="primary"
                size="md"
                fullWidth
                isLoading={loadingAction === 'import'}
                onClick={handleImport}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="text-xs font-semibold"
              >
                {hasCloudPortfolio ? 'Overwrite Cloud with Browser Draft' : 'Import Draft to Cloud'}
              </Button>

              {hasCloudPortfolio && (
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  isLoading={loadingAction === 'keep'}
                  onClick={handleKeepCloud}
                  className="text-xs"
                >
                  Keep Existing Cloud Version
                </Button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default DraftMigrationModal
