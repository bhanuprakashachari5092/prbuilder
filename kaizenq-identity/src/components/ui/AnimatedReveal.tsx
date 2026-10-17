import React from 'react'
import { motion } from 'motion/react'
import { useReducedMotion } from '../../hooks/useReducedMotion.ts'
import { defaultEasing } from '../../lib/animations.ts'
import { cn } from '../../lib/utils.ts'

export interface AnimatedRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'none'
  duration?: number
}

export const AnimatedReveal: React.FC<AnimatedRevealProps> = ({
  children,
  className,
  delay = 0,
  direction = 'up',
  duration = 0.55,
}) => {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  const getYOffset = () => {
    switch (direction) {
      case 'up':
        return 22
      case 'down':
        return -22
      case 'none':
        return 0
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: getYOffset() }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration,
        delay,
        ease: defaultEasing,
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
