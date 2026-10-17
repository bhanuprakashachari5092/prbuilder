import React from 'react'
import { motion } from 'motion/react'
import { staggerChildren } from '../../lib/animations.ts'
import { useReducedMotion } from '../../hooks/useReducedMotion.ts'
import { cn } from '../../lib/utils.ts'

export interface StaggerProps {
  children: React.ReactNode
  className?: string
  staggerDuration?: number
  delayChildren?: number
}

export const Stagger: React.FC<StaggerProps> = ({
  children,
  className,
  staggerDuration = 0.08,
  delayChildren = 0.05,
}) => {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      variants={staggerChildren(staggerDuration, delayChildren)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-30px' }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
