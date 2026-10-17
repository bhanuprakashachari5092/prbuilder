import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useReducedMotion } from '../../hooks/useReducedMotion.ts'
import { PRMonogramVector } from './PRLogo.tsx'
import './PRLogoReveal.css'

export interface PRLogoRevealProps {
  /** Size in pixels of the monogram stage (default: 200) */
  size?: number
  /** Whether to show the wordmark typography below the monogram */
  showWordmark?: boolean
  /** Whether to take full viewport screen (default: false) */
  fullScreen?: boolean
  /** Callback fired when the reveal animation holds at its final state */
  onComplete?: () => void
  /** Key to re-trigger the animation */
  replayKey?: string | number
  /** Optional custom CSS classes */
  className?: string
  /** Visual theme mode (default: light) */
  theme?: 'light' | 'dark'
}

/**
 * PRLogoReveal — Cinematic Brand Identity Reveal
 */
export const PRLogoReveal: React.FC<PRLogoRevealProps> = ({
  size = 200,
  showWordmark = true,
  fullScreen = false,
  onComplete,
  replayKey = 0,
  className = '',
  theme = 'light',
}) => {
  const shouldReduceMotion = useReducedMotion()
  const [isCompleted, setIsCompleted] = useState<boolean>(shouldReduceMotion)

  useEffect(() => {
    if (shouldReduceMotion) {
      setIsCompleted(true)
      onComplete?.()
      return
    }

    setIsCompleted(false)
    // Coordinated 1.85s reveal timeline for 2 to 2.5s loading animation experience
    const timer = setTimeout(() => {
      setIsCompleted(true)
      onComplete?.()
    }, 1850)

    return () => clearTimeout(timer)
  }, [replayKey, shouldReduceMotion, onComplete])

  // Centerline drafting vector paths
  const frameDraftPath = 'M 85,290 L 20,290 L 20,24 L 307,24 L 307,158 L 252,208'
  const pLoopDraftPath = 'M 84,95 L 229,95 L 229,114'
  const rSlashDraftPath = 'M 229,114 L 85,245'
  const pMidDraftPath = 'M 84,155 L 142,155'
  const chevronDraftPath = 'M 167,206 L 208,246 L 243,214'

  return (
    <div
      key={replayKey}
      role="img"
      aria-label="PR Builder animated logo reveal"
      className={`pr-reveal-viewport ${fullScreen ? 'fixed inset-0 z-50 min-h-screen w-screen' : 'rounded-2xl p-6 sm:p-8'} ${className}`}
      style={{ backgroundColor: theme === 'light' ? '#F7F9FC' : '#20282A' }}
    >
      {/* Background Architectural Grid */}
      <div className="pr-reveal-grid" />

      {/* Ambient Silver Aura */}
      <motion.div
        className="pr-reveal-ambient-glow"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={
          shouldReduceMotion
            ? { opacity: 0.18, scale: 1 }
            : {
                opacity: [0, 0.08, 0.28, 0.16],
                scale: [0.85, 0.95, 1.1, 1],
              }
        }
        transition={{ duration: 2.4, times: [0, 0.4, 0.75, 1], ease: 'easeOut' }}
      />

      {/* Main Logo Canvas */}
      <div
        className="pr-reveal-canvas"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {/* Layer 1: Authentic SVG Stroke Tracing (The Invisible Designer) */}
        {!shouldReduceMotion && (
          <svg
            viewBox="0 0 328 316"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            aria-hidden="true"
          >
            {/* 1. Outer Frame Drafting Stroke */}
            <motion.path
              d={frameDraftPath}
              className="pr-draft-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                pathLength: { duration: 0.38, delay: 0.05, ease: [0.25, 1, 0.5, 1] },
                opacity: { duration: 1.1, times: [0, 0.05, 0.7, 0.95], ease: 'easeInOut' },
              }}
            />

            {/* 2. Top Header Bar of P */}
            <motion.path
              d={pLoopDraftPath}
              className="pr-draft-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                pathLength: { duration: 0.25, delay: 0.18, ease: [0.25, 1, 0.5, 1] },
                opacity: { duration: 1.1, times: [0, 0.18, 0.7, 0.95], ease: 'easeInOut' },
              }}
            />

            {/* 3. Diagonal Slash of R */}
            <motion.path
              d={rSlashDraftPath}
              className="pr-draft-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                pathLength: { duration: 0.28, delay: 0.28, ease: [0.25, 1, 0.5, 1] },
                opacity: { duration: 1.1, times: [0, 0.28, 0.7, 0.95], ease: 'easeInOut' },
              }}
            />

            {/* 4. Middle Horizontal Bar of P */}
            <motion.path
              d={pMidDraftPath}
              className="pr-draft-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                pathLength: { duration: 0.2, delay: 0.38, ease: [0.25, 1, 0.5, 1] },
                opacity: { duration: 1.1, times: [0, 0.36, 0.7, 0.95], ease: 'easeInOut' },
              }}
            />

            {/* 5. Bottom-Right Dynamic Chevron */}
            <motion.path
              d={chevronDraftPath}
              className="pr-draft-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                pathLength: { duration: 0.22, delay: 0.46, ease: [0.25, 1, 0.5, 1] },
                opacity: { duration: 1.1, times: [0, 0.42, 0.7, 0.95], ease: 'easeInOut' },
              }}
            />
          </svg>
        )}

        {/* Layer 2: Original Solid Metallic Monogram Reveal */}
        <motion.div
          className="relative w-full h-full z-20 flex items-center justify-center"
          initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
          animate={
            shouldReduceMotion
              ? { opacity: 1, scale: 1 }
              : {
                  opacity: [0, 0.2, 0.75, 1],
                  scale: [0.96, 0.98, 1.01, 1],
                }
          }
          transition={{
            duration: 0.65,
            delay: shouldReduceMotion ? 0 : 0.45,
            times: [0, 0.3, 0.75, 1],
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <PRMonogramVector />

          {/* Layer 3: Metallic Chrome Traveling Shine Sweep */}
          {!shouldReduceMotion && (
            <div className="pr-shine-layer rounded-lg">
              <motion.div
                className="pr-shine-beam"
                initial={{ x: '-120%' }}
                animate={{ x: '290%' }}
                transition={{
                  duration: 0.55,
                  delay: 0.65,
                  ease: [0.4, 0, 0.2, 1],
                }}
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* Layer 4: Brand Wordmark (PR BUILDER) Reveal */}
      {showWordmark && (
        <motion.div
          className="mt-6 flex flex-col items-center select-none z-20"
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: shouldReduceMotion ? 0 : 0.72,
            ease: [0.25, 1, 0.5, 1],
          }}
        >
          <div className="flex items-center gap-2 text-xl sm:text-2xl font-bold tracking-tight">
            <span className={theme === 'light' ? 'text-[#111827]' : 'text-[#F7FAFF]'}>PR</span>
            <span className={theme === 'light' ? 'text-[#2563EB] tracking-widest font-semibold' : 'text-[#A4B7BF] tracking-widest font-semibold'}>
              BUILDER
            </span>
          </div>
          <motion.span
            className={`text-[11px] sm:text-xs font-mono uppercase tracking-[0.25em] mt-1.5 ${theme === 'light' ? 'text-[#64748B]' : 'text-[#7F95A0]'}`}
            initial={shouldReduceMotion ? { opacity: 0.9 } : { opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ duration: 0.45, delay: shouldReduceMotion ? 0 : 1.35 }}
          >
            Professional Identity Studio
          </motion.span>
        </motion.div>
      )}

      {/* Stable indicator dot */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`absolute bottom-4 flex items-center gap-1.5 text-[10px] font-mono tracking-wider ${theme === 'light' ? 'text-[#64748B]' : 'text-[#7F95A0]/60'}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>ORIGINAL MARK VERIFIED</span>
        </motion.div>
      )}
    </div>
  )
}

export default PRLogoReveal
