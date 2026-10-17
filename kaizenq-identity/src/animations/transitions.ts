import type { Transition } from 'motion/react'

/**
 * Standard cubic bezier easing curves (Apple & Linear UI style)
 */
export const defaultEasing = [0.16, 1, 0.3, 1] as const

export const defaultTransition: Transition = {
  duration: 0.6,
  ease: [0.16, 1, 0.3, 1],
}

export const fastTransition: Transition = {
  duration: 0.3,
  ease: [0.16, 1, 0.3, 1],
}

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 24,
}

export const bouncySpringTransition: Transition = {
  type: 'spring',
  bounce: 0.4,
  duration: 0.8,
}
