import React from 'react'
import { motion } from 'motion/react'
import { fadeIn } from '../../lib/animations.ts'
import { useReducedMotion } from '../../hooks/useReducedMotion.ts'
import { cn } from '../../lib/utils.ts'

export interface FadeInProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export const FadeIn: React.FC<FadeInProps> = ({ children, className, delay = 0 }) => {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-20px' }}
      transition={{ delay }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
