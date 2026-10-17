import React from 'react'
import { PRLogo } from './PRLogo.tsx'
import shaivikaLogo from '../../assets/logos/shaivika-logo.png'
import kaizenqLogo from '../../assets/logos/kaizenq-logo.png'
import { BrandLockup } from './BrandLockup.tsx'
import { cn } from '../../lib/utils.ts'

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
  className?: string
  markOnly?: boolean
  /** When true, renders full collaboration lockup */
  collaboration?: boolean
  /** Specific brand variant */
  variant?: 'pr' | 'collaboration' | 'shaivika' | 'kaizenq'
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showTagline = false,
  className,
  markOnly = false,
  collaboration = true,
  variant = 'pr',
}) => {
  if (variant === 'pr') {
    return (
      <PRLogo
        size={size}
        monogramOnly={markOnly}
        className={className}
      />
    )
  }

  if (collaboration && variant === 'collaboration' && !markOnly) {
    return (
      <BrandLockup
        size={size}
        showTagline={showTagline}
        className={className}
      />
    )
  }

  const heights = {
    sm: 'h-7 sm:h-8',
    md: 'h-9 sm:h-10',
    lg: 'h-12 sm:h-14',
  }

  if (variant === 'kaizenq') {
    return (
      <div className={cn('inline-flex items-center gap-2 select-none group', className)}>
        <div className="bg-white/95 rounded-md px-1.5 py-0.5 shadow-[0_0_12px_rgba(79,140,255,0.2)] border border-white/40 flex items-center transition-transform duration-300 group-hover:scale-105">
          <img
            src={kaizenqLogo}
            alt="KaizenQ"
            className={cn('w-auto object-contain', heights[size])}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('inline-flex items-center gap-2 select-none group', className)}>
      <div className="relative shrink-0 transition-transform duration-300 group-hover:scale-105">
        <img
          src={shaivikaLogo}
          alt="Shaivika Groups"
          className={cn('w-auto object-contain', heights[size])}
        />
      </div>
    </div>
  )
}

export default BrandLogo
