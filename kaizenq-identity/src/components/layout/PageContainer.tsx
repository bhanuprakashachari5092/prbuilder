import React from 'react'
import { Navbar } from './Navbar.tsx'
import { Footer } from './Footer.tsx'
import { cn } from '../../lib/utils.ts'

export interface PageContainerProps {
  children: React.ReactNode
  className?: string
  onOpenAuth?: (mode?: 'signin' | 'signup') => void
  onOpenBuilder?: () => void
  revealNavbarOnScroll?: boolean
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  onOpenAuth,
  onOpenBuilder,
  revealNavbarOnScroll = false,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC] text-[#111827] selection:bg-[#EFF6FF] selection:text-[#2563EB] relative overflow-x-clip">
      {/* Background Subtle Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[520px] bg-gradient-to-b from-[#EFF6FF] via-[#EEF2FF] to-transparent blur-3xl opacity-60" />
        <div className="absolute inset-0 grid-bg-pattern opacity-10" />
      </div>

      {/* Top Fixed Navbar */}
      <Navbar
        onOpenAuth={onOpenAuth}
        onOpenBuilder={onOpenBuilder}
        revealOnScroll={revealNavbarOnScroll}
      />

      {/* Main Content Area — Full bleed top when hero animation is active */}
      <main className={cn('flex-1 relative z-10', !revealNavbarOnScroll && 'pt-20 sm:pt-24', className)}>
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default PageContainer
