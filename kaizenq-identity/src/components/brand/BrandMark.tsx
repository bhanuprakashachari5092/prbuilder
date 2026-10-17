import React from 'react'
import { PRMonogramVector } from './PRLogo.tsx'
import shaivikaLogo from '../../assets/logos/shaivika-logo.png'
import kaizenqLogo from '../../assets/logos/kaizenq-logo.png'
import { cn } from '../../lib/utils.ts'

export interface BrandMarkProps {
  size?: number | string
  className?: string
  animated?: boolean
  variant?: 'pr' | 'shaivika' | 'kaizenq'
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  size = 38,
  className = '',
  variant = 'pr',
}) => {
  const width = typeof size === 'number' ? `${size}px` : size
  const height = width

  if (variant === 'pr') {
    return (
      <div
        style={{ width, height }}
        className={cn('relative inline-flex items-center justify-center shrink-0 select-none', className)}
      >
        <PRMonogramVector />
      </div>
    )
  }

  if (variant === 'kaizenq') {
    return (
      <div
        style={{ width, height }}
        className={cn(
          'relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden bg-white/95 rounded-lg p-1 border border-white/30 shadow-[0_0_12px_rgba(79,140,255,0.2)]',
          className,
        )}
      >
        <img
          src={kaizenqLogo}
          alt="KaizenQ Emblem"
          className="w-full h-full object-contain"
        />
      </div>
    )
  }

  return (
    <div
      style={{ width, height }}
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden',
        className,
      )}
    >
      <img
        src={shaivikaLogo}
        alt="Shaivika Groups Emblem"
        className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(0,180,255,0.35)]"
      />
    </div>
  )
}

export default BrandMark
