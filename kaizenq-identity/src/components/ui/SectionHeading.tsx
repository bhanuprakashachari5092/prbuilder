import React from 'react'
import { Badge } from './Badge.tsx'
import { cn } from '../../lib/utils.ts'

export interface SectionHeadingProps {
  badge?: string
  title: string | React.ReactNode
  description?: string
  align?: 'left' | 'center' | 'right'
  className?: string
  badgeVariant?: 'default' | 'accent' | 'cyan' | 'success' | 'event'
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  badge,
  title,
  description,
  align = 'center',
  className,
  badgeVariant = 'accent',
}) => {
  const alignStyles = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  }

  return (
    <div className={cn('flex flex-col max-w-3xl mb-12 sm:mb-16', alignStyles[align], align === 'center' && 'mx-auto', className)}>
      {badge && (
        <Badge variant={badgeVariant} className="mb-4">
          {badge}
        </Badge>
      )}
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#F5F7FA] font-['Outfit',sans-serif] leading-[1.15]">
        {title}
      </h2>
      {description && (
        <p className="mt-3.5 text-sm sm:text-base text-[#9CA3AF] leading-relaxed max-w-2xl font-normal">
          {description}
        </p>
      )}
    </div>
  )
}
