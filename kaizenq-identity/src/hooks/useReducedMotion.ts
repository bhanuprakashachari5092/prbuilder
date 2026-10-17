import { useReducedMotion as useMotionReducedMotion } from 'motion/react'
import { useMediaQuery } from './useMediaQuery.ts'

/**
 * Custom hook to detect if the user prefers reduced motion for accessibility.
 * Integrates with both motion/react's motion-reduced context and native media queries.
 */
export function useReducedMotion(): boolean {
  const motionReduced = useMotionReducedMotion()
  const mediaQueryReduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  return Boolean(motionReduced ?? mediaQueryReduced)
}

export default useReducedMotion
