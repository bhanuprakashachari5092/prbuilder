import React from 'react'
import { cn } from '../../lib/utils.ts'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  variant?: 'default' | 'accent' | 'cyan' | 'success' | 'outline' | 'event'
  size?: 'sm' | 'md'
  icon?: React.ReactNode
  ping?: boolean
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  icon,
  ping = false,
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  }

  const variantStyles = {
    default: 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]',
    accent: 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]',
    cyan: 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    outline: 'bg-transparent text-[#64748B] border border-[#E2E8F0]',
    event: 'bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full transition-colors select-none tracking-wide',
        sizeStyles[size],
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {ping && (
        <span className="relative flex h-1.5 w-1.5 mr-0.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600" />
        </span>
      )}
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  )
}
