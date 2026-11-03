import { useState, useEffect } from 'react'
import { Sparkles, Check, X, RefreshCw, AlertCircle, Edit3, ShieldCheck } from 'lucide-react'
import { geminiService, type GeminiAction, type GeminiContext } from '../../services/geminiService.ts'

export interface GeminiAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: (improvedText: string) => void
  action: GeminiAction
  title: string
  originalText: string
  context?: GeminiContext
}

export const GeminiAssistantModal = ({
  isOpen,
  onClose,
  onAccept,
  action,
  title,
  originalText,
  context,
}: GeminiAssistantModalProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [suggestedText, setSuggestedText] = useState<string>('')
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editedText, setEditedText] = useState<string>('')
  const [customJobDescription, setCustomJobDescription] = useState<string>('')

  const runAssistant = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    setNoticeMessage(null)

    const fullContext: GeminiContext = {
      ...context,
      jobDescription: customJobDescription || context?.jobDescription,
    }

    const response = await geminiService.executeAction(action, originalText, fullContext)

    setIsLoading(false)
    if (response.success) {
      if (response.result) {
        setSuggestedText(response.result)
        setEditedText(response.result)
      }
      if (response.skills) {
        setSuggestedSkills(response.skills)
        if (!response.result) {
          setSuggestedText(response.skills.join(', '))
          setEditedText(response.skills.join(', '))
        }
      }
      if (response.notice) {
        setNoticeMessage(response.notice)
      }
    } else {
      setErrorMessage(response.error || 'Failed to generate suggestion.')
      if (response.notice) {
        setNoticeMessage(response.notice)
      }
    }
  }

  useEffect(() => {
    if (isOpen && originalText !== undefined) {
      setIsEditing(false)
      setSuggestedText('')
      setSuggestedSkills([])
      setErrorMessage(null)
      runAssistant()
    }
  }, [isOpen, originalText, action])

  if (!isOpen) return null

  const handleAccept = () => {
    const finalContent = isEditing ? editedText : (suggestedText || originalText)
    onAccept(finalContent)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gemini-assistant-title"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 id="gemini-assistant-title" className="text-base font-semibold text-neutral-900 dark:text-white">
                {title}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Powered by Gemini AI career drafting assistant
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            aria-label="Close Gemini Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {/* Privacy & Anti-Hallucination Notice */}
          <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 text-xs text-neutral-600 dark:text-neutral-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Ethical AI Guarantee:</strong> Only your highlighted snippet is sent for phrasing enhancement. We never invent false credentials, companies, or fake metrics.
            </span>
          </div>

          {action === 'tailor_to_job' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Target Job Description (or Keywords)
              </label>
              <textarea
                value={customJobDescription}
                onChange={(e) => setCustomJobDescription(e.target.value)}
                placeholder="Paste the target job description or key responsibilities here..."
                rows={3}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={runAssistant}
                disabled={isLoading}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Re-tailor with this job description
              </button>
            </div>
          )}

          {/* Original Text Preview */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1.5">
              Original Draft
            </span>
            <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap font-sans text-xs leading-relaxed">
              {originalText || '(Empty)'}
            </div>
          </div>

          {/* AI Suggestion Output */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Gemini AI Recommendation
              </span>
              {suggestedText && !isLoading && (
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditing ? 'Done Editing' : 'Fine-tune Suggestion'}
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950/40 text-neutral-500">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                <p className="text-xs font-medium">Refining phrasing with ATS intelligence...</p>
              </div>
            ) : errorMessage ? (
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                {noticeMessage && (
                  <p className="text-neutral-600 dark:text-neutral-400">{noticeMessage}</p>
                )}
                <button
                  type="button"
                  onClick={runAssistant}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium hover:bg-neutral-300 dark:hover:bg-neutral-700 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              </div>
            ) : isEditing ? (
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={5}
                className="w-full text-xs p-3.5 rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap font-sans text-xs leading-relaxed">
                {suggestedText || 'No suggestion generated yet.'}
              </div>
            )}

            {suggestedSkills.length > 0 && (
              <div className="mt-3">
                <span className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1.5">
                  Extracted High-Impact Skills:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 text-xs rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 flex items-center justify-between">
          <button
            type="button"
            onClick={runAssistant}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Try Alternative Phrasing
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              Keep Original
            </button>
            <button
              type="button"
              onClick={handleAccept}
              disabled={isLoading || (!suggestedText && !editedText)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Apply Suggestion
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

