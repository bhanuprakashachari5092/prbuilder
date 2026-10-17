import React from 'react'
import prMonogramPng from '../../assets/pr-monogram.png'
import { cn } from '../../lib/utils.ts'

export interface PRLogoProps {
  /** Size variant or explicit pixel size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number
  /** Whether to show the 'PR BUILDER' wordmark text */
  showText?: boolean
  /** Whether to show only the monogram symbol */
  monogramOnly?: boolean
  /** Subtitle / Tagline text under wordmark */
  tagline?: string
  /** Custom additional CSS class names */
  className?: string
  /** Rendering technique: 'vector' (crisp SVG) or 'raster' (original PNG) */
  renderMode?: 'vector' | 'raster'
  /** Color theme for typography lockup */
  theme?: 'light' | 'dark'
  /** Optional click handler */
  onClick?: () => void
}

/**
 * Geometric SVG Vector Paths of the PR Builder Monogram
 * Meticulously traced from the canonical monogram asset.
 */
export const PRMonogramVector: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className,
  style,
}) => {
  return (
    <svg
      viewBox="0 0 328 316"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-full h-full object-contain', className)}
      style={style}
      aria-hidden="true"
    >
      <defs>
        {/* Authentic Metallic Silver Gradient */}
        <linearGradient id="prLogoSilver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EAF2F5" />
          <stop offset="26%" stopColor="#CCD9DF" />
          <stop offset="52%" stopColor="#A4B7BF" />
          <stop offset="78%" stopColor="#D7E3E8" />
          <stop offset="100%" stopColor="#8E9FA8" />
        </linearGradient>

        {/* Chrome Edge Glint */}
        <linearGradient id="prLogoStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#C2D3DA" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#6F8089" stopOpacity="0.45" />
        </linearGradient>

        {/* Subtle Ambient Drop Shadow Filter */}
        <filter id="prLogoShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.35" />
        </filter>
      </defs>

      <g filter="url(#prLogoShadow)">
        {/* 1. Outer Geometric Shield Frame */}
        <path
          d="M 7,10 L 320,10 L 320,163 L 261,215 L 243,196 L 293,151 L 293,38 L 34,38 L 34,276 L 85,276 L 85,304 L 7,304 Z"
          fill="url(#prLogoSilver)"
          stroke="url(#prLogoStroke)"
          strokeWidth="1.2"
          strokeLinejoin="miter"
        />

        {/* 2. Upper PR Loop & Long Diagonal Slash */}
        <path
          d="M 84,81 L 244,81 L 244,118 L 86,262 L 84,228 L 214,109 L 84,109 Z"
          fill="url(#prLogoSilver)"
          stroke="url(#prLogoStroke)"
          strokeWidth="1.2"
          strokeLinejoin="miter"
        />

        {/* 3. Middle Horizontal Bar of P */}
        <path
          d="M 84,142 L 156,142 L 129,169 L 84,169 Z"
          fill="url(#prLogoSilver)"
          stroke="url(#prLogoStroke)"
          strokeWidth="1.2"
          strokeLinejoin="miter"
        />

        {/* 4. Bottom-Right Dynamic Chevron */}
        <path
          d="M 176,197 L 208,228 L 233,205 L 252,223 L 208,264 L 158,215 Z"
          fill="url(#prLogoSilver)"
          stroke="url(#prLogoStroke)"
          strokeWidth="1.2"
          strokeLinejoin="miter"
        />
      </g>
    </svg>
  )
}

/**
 * PRLogo — Official PR Builder Logo Component
 * Combines the original geometric silver PR monogram with high-end modern typography.
 */
export const PRLogo: React.FC<PRLogoProps> = ({
  size = 'md',
  showText = true,
  monogramOnly = false,
  tagline,
  className,
  renderMode = 'vector',
  theme = 'light',
  onClick,
}) => {
  const sizeMap = {
    xs: { px: 20, textClass: 'text-xs', subClass: 'text-[9px]' },
    sm: { px: 28, textClass: 'text-sm', subClass: 'text-[10px]' },
    md: { px: 36, textClass: 'text-base sm:text-lg', subClass: 'text-[11px]' },
    lg: { px: 48, textClass: 'text-xl sm:text-2xl', subClass: 'text-xs' },
    xl: { px: 64, textClass: 'text-2xl sm:text-3xl', subClass: 'text-sm' },
  }

  const dimensions = typeof size === 'number' ? size : sizeMap[size].px
  const textClass = typeof size === 'number' ? 'text-base' : sizeMap[size].textClass
  const subClass = typeof size === 'number' ? 'text-[10px]' : sizeMap[size].subClass

  const displayWordmark = showText && !monogramOnly

  return (
    <div
      onClick={onClick}
      role="img"
      aria-label="PR Builder Logo"
      className={cn(
        'inline-flex items-center gap-2.5 select-none transition-opacity duration-200',
        onClick && 'cursor-pointer hover:opacity-90',
        className,
      )}
    >
      {/* Monogram Symbol */}
      <div
        style={{ width: `${dimensions}px`, height: `${dimensions}px` }}
        className="relative shrink-0 flex items-center justify-center"
      >
        {renderMode === 'vector' ? (
          <PRMonogramVector />
        ) : (
          <img
            src={prMonogramPng}
            alt="PR Builder Monogram"
            className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
            draggable={false}
          />
        )}
      </div>

      {/* Typography Lockup: PR BUILDER */}
      {displayWordmark && (
        <div className="flex flex-col leading-none">
          <div className={cn('flex items-center gap-1.5 font-bold tracking-tight', textClass)}>
            <span
              className={cn(
                "font-['Outfit','Inter',sans-serif]",
                theme === 'light' ? 'text-[#111827]' : 'text-[#F7FAFF]',
              )}
            >
              PR
            </span>
            <span
              className={cn(
                "font-['Outfit','Inter',sans-serif] tracking-wider font-semibold",
                theme === 'light' ? 'text-[#2563EB]' : 'text-[#A4B7BF]',
              )}
            >
              BUILDER
            </span>
          </div>
          {tagline ? (
            <span
              className={cn(
                'tracking-wider uppercase font-medium mt-1',
                theme === 'light' ? 'text-[#64748B]' : 'text-[#7F95A0]',
                subClass,
              )}
            >
              {tagline}
            </span>
          ) : (
            <span
              className={cn(
                'text-[9px] font-mono uppercase tracking-widest mt-0.5',
                theme === 'light' ? 'text-[#64748B]' : 'text-[#7F95A0]/80',
              )}
            >
              Identity &amp; Portfolio
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default PRLogo
