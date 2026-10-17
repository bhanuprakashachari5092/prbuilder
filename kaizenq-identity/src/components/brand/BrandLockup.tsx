import React from 'react'
import shaivikaLogo from '../../assets/logos/shaivika-logo.png'
import kaizenqLogo from '../../assets/logos/kaizenq-logo.png'
import { cn } from '../../lib/utils.ts'

export interface BrandLockupProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show the secondary supporting tagline */
  showTagline?: boolean
  /** Tagline text, defaults to 'Build Your Professional Identity' */
  taglineText?: string
  /** Layout orientation: auto stacks gracefully on small mobile screens */
  orientation?: 'horizontal' | 'stacked' | 'auto'
  /** Optional custom class names */
  className?: string
  /** Optional override for Shaivika Groups logo file */
  shaivikaLogoSrc?: string
  /** Optional override for KaizenQ standalone logo file */
  kaizenqLogoSrc?: string
}

/**
 * BrandLockup — Official Brand Collaboration Lockup
 * Composes [ SHAIVIKA GROUPS ]  ×  [ KAIZENQ ]
 * Visually balances both marks with an optical collaboration crosshair symbol.
 */
export const BrandLockup: React.FC<BrandLockupProps> = ({
  size = 'md',
  showTagline = false,
  taglineText = 'Build Your Professional Identity',
  orientation = 'auto',
  className,
  shaivikaLogoSrc,
  kaizenqLogoSrc,
}) => {
  const shaivikaHeights = {
    sm: 'h-6 sm:h-7',
    md: 'h-8 sm:h-9',
    lg: 'h-11 sm:h-12',
  }

  const kaizenqHeights = {
    sm: 'h-5 sm:h-6',
    md: 'h-6.5 sm:h-7.5',
    lg: 'h-9 sm:h-10',
  }

  const crossSizes = {
    sm: 'text-xs sm:text-sm px-1.5',
    md: 'text-sm sm:text-base px-2',
    lg: 'text-lg sm:text-xl px-2.5',
  }

  const containerLayout =
    orientation === 'stacked'
      ? 'flex-col items-center gap-2'
      : orientation === 'horizontal'
      ? 'flex-row items-center gap-2 sm:gap-2.5'
      : 'flex-row items-center gap-2 sm:gap-2.5 flex-nowrap'

  return (
    <div className={cn('inline-flex flex-col items-center select-none', className)}>
      <div className={cn('inline-flex items-center justify-center', containerLayout)}>
        {/* Left: Shaivika Groups Official Brand Logo */}
        <div className="flex items-center shrink-0 transition-transform duration-200 hover:scale-[1.02]">
          <img
            src={shaivikaLogoSrc || shaivikaLogo}
            alt="Shaivika Groups"
            className={cn(
              'w-auto object-contain filter drop-shadow-[0_0_12px_rgba(79,140,255,0.28)]',
              shaivikaHeights[size],
            )}
          />
        </div>

        {/* Center: Refined Optical Collaboration Symbol */}
        <span
          className={cn(
            'text-[#8CD8FF]/90 font-light select-none shrink-0 leading-none tracking-normal drop-shadow-[0_0_6px_rgba(140,216,255,0.4)]',
            crossSizes[size],
          )}
          aria-hidden="true"
        >
          ×
        </span>

        {/* Right: KaizenQ Official Brand Mark */}
        <div className="flex items-center shrink-0 transition-transform duration-200 hover:scale-[1.02]">
          <div className="bg-white/95 rounded-md px-1.5 py-0.5 shadow-[0_0_14px_rgba(79,140,255,0.2)] border border-white/40 flex items-center">
            <img
              src={kaizenqLogoSrc || kaizenqLogo}
              alt="KaizenQ"
              className={cn(
                'w-auto object-contain',
                kaizenqHeights[size],
              )}
            />
          </div>
        </div>
      </div>

      {/* Supporting Tagline */}
      {showTagline && (
        <span className="mt-1.5 text-[11px] sm:text-xs text-[#9AAAC0] font-normal tracking-wide text-center">
          {taglineText}
        </span>
      )}
    </div>
  )
}

export default BrandLockup
