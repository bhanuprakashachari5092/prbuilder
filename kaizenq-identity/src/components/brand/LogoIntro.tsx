import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useReducedMotion } from '../../hooks/useReducedMotion.ts'
import { PRLogoReveal } from './PRLogoReveal.tsx'
import { ArrowRight } from 'lucide-react'

export interface LogoIntroProps {
  /** Callback fired when the intro finishes or is skipped */
  onComplete: () => void
  /** Control flag to force enable/disable */
  enabled?: boolean
}

/**
 * LogoIntro — Cinematic PR Builder Brand Reveal Overlay (Phase 1)
 * Plays the authentic vector sketch-drawing animation with a subtle blue-white glow,
 * completing promptly once ready without fake delays or other page content.
 */
export const LogoIntro: React.FC<LogoIntroProps> = ({ onComplete, enabled = true }) => {
  const shouldReduceMotion = useReducedMotion()
  const [exiting, setExiting] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!enabled || shouldReduceMotion) {
      onCompleteRef.current()
      return
    }

    // Keyboard shortcut to skip immediately (Escape or Enter)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        handleFinish()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    // Coordinated 2.1s presentation + 300ms smooth fade exit (2.4s total duration)
    const timer = setTimeout(() => {
      handleFinish()
    }, 2100)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timer)
    }
  }, [enabled, shouldReduceMotion])

  if (!enabled || shouldReduceMotion) {
    return null
  }

  const handleFinish = () => {
    setExiting(true)
    setTimeout(() => {
      onCompleteRef.current()
    }, 300)
  }

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="pr-intro-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F7F9FC] text-[#111827] select-none overflow-hidden"
          style={{ willChange: 'opacity, transform' }}
        >
          {/* Skip Button */}
          <button
            onClick={handleFinish}
            className="absolute top-6 right-6 z-30 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B] hover:text-[#111827] transition-all cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            aria-label="Skip brand animation"
          >
            <span>Skip</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Full Screen Cinematic Logo Reveal on Ambient Background */}
          <div className="flex flex-col items-center justify-center relative z-20">
            <PRLogoReveal
              size={220}
              fullScreen={false}
              showWordmark
              theme="light"
            />

            {/* Seamless 2.1s Loading Progress Indicator */}
            <div className="mt-8 flex flex-col items-center gap-2">
              <div className="w-36 h-1 bg-[#E2E8F0] rounded-full overflow-hidden relative shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#2563EB] via-[#38BDF8] to-[#2563EB] rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2.1, ease: [0.25, 0.1, 0.25, 1] }}
                />
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0.8, 0] }}
                transition={{ duration: 2.1, times: [0, 0.15, 0.85, 1] }}
                className="text-[10px] font-mono uppercase tracking-widest text-[#64748B]"
              >
                Loading Studio...
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default LogoIntro
