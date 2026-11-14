import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Menu, X, ArrowRight, Shield, FileText, Globe, Sparkles, Layers } from 'lucide-react'
import { PRLogo } from '../brand/PRLogo.tsx'
import { Button } from '../ui/Button.tsx'
import { Container } from '../ui/Container.tsx'
import { cn } from '../../lib/utils.ts'
import { useApp } from '../../app/providers/AppContext.ts'
import { useAuth } from '../../app/providers/AuthContext.tsx'

import { useReducedMotion } from '../../hooks/useReducedMotion.ts'

export interface NavbarProps {
  onOpenAuth?: (mode?: 'signin' | 'signup') => void
  onOpenBuilder?: () => void
  revealOnScroll?: boolean
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth: _onOpenAuth,
  onOpenBuilder: _onOpenBuilder,
  revealOnScroll = false,
}) => {
  const { setCurrentRoute, setIsAuthOpen, setAuthMode, setTargetRouteAfterAuth } = useApp()
  const { user, isAdmin } = useAuth()
  const shouldReduceMotion = useReducedMotion()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHeroRevealed, setIsHeroRevealed] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return true
    return !revealOnScroll || shouldReduceMotion
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setIsScrolled(scrollY > 15)
      if (revealOnScroll && !shouldReduceMotion) {
        if (window.innerWidth < 768) {
          setIsHeroRevealed(true)
          return
        }
        const revealThreshold = Math.max(window.innerHeight * 0.08, 40)
        setIsHeroRevealed(scrollY >= revealThreshold)
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [revealOnScroll, shouldReduceMotion])

  // Prevent background scrolling when mobile menu is active
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false)
    if (href.startsWith('#')) {
      const el = document.querySelector(href)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
  }

  const handleBuilderClick = (target: 'resume' | 'portfolio') => {
    setMobileMenuOpen(false)
    if (isAdmin) {
      setCurrentRoute('admin')
      return
    }
    if (!user) {
      setTargetRouteAfterAuth(target)
      setAuthMode('signin')
      setIsAuthOpen(true)
      return
    }
    setCurrentRoute(target)
  }

  const handleGetStarted = () => {
    setMobileMenuOpen(false)
    if (isAdmin) {
      setCurrentRoute('admin')
      return
    }
    if (!user) {
      setTargetRouteAfterAuth('dashboard')
      setAuthMode('signin')
      setIsAuthOpen(true)
      return
    }
    setCurrentRoute('dashboard')
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-500 ease-out',
        revealOnScroll && !isHeroRevealed
          ? 'opacity-0 -translate-y-4 pointer-events-none'
          : 'opacity-100 translate-y-0 pointer-events-auto',
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-sm py-3'
          : 'bg-transparent border-b border-transparent py-4 sm:py-5',
      )}
    >
      <Container size="xl">
        <div className="flex items-center justify-between">
          {/* PR Builder Brand Logo */}
          <div className="flex items-center">
            <button
              onClick={() => {
                setCurrentRoute('home')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded cursor-pointer"
              aria-label="PR Builder Home"
            >
              <PRLogo size="md" animatedWordmark />
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav
            className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] backdrop-blur-md shadow-sm"
            aria-label="Main Navigation"
          >
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault()
                handleNavClick('#features')
              }}
              className="px-3.5 py-1.5 text-xs lg:text-sm font-medium text-[#64748B] hover:text-[#111827] transition-colors rounded-full hover:bg-[#F8FAFC]"
            >
              Features
            </a>
            <button
              onClick={() => handleBuilderClick('resume')}
              className="px-3.5 py-1.5 text-xs lg:text-sm font-medium text-[#64748B] hover:text-[#111827] transition-colors rounded-full hover:bg-[#F8FAFC] cursor-pointer"
            >
              Resume Builder
            </button>
            <button
              onClick={() => handleBuilderClick('portfolio')}
              className="px-3.5 py-1.5 text-xs lg:text-sm font-medium text-[#64748B] hover:text-[#111827] transition-colors rounded-full hover:bg-[#F8FAFC] cursor-pointer"
            >
              Portfolio Builder
            </button>
            <a
              href="/showroom.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 text-xs lg:text-sm font-medium text-[#64748B] hover:text-[#111827] transition-colors rounded-full hover:bg-[#F8FAFC] flex items-center gap-1.5 cursor-pointer"
            >
              <span>3D Showroom</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {isAdmin ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCurrentRoute('admin')}
                leftIcon={<Shield className="w-3.5 h-3.5 text-white" />}
                className="text-xs lg:text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
              >
                Admin Console
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleGetStarted}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="text-xs lg:text-sm bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs font-semibold px-4 py-2"
              >
                Workspace
              </Button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#111827] hover:bg-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden bg-white/98 border-b border-[#E2E8F0] backdrop-blur-xl px-4 pt-3 pb-6 overflow-hidden shadow-xl"
          >
            <div className="flex flex-col gap-1.5">
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault()
                  handleNavClick('#features')
                }}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 rounded-xl transition-all"
              >
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Features</span>
              </a>
              <button
                onClick={() => handleBuilderClick('resume')}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 rounded-xl transition-all cursor-pointer text-left"
              >
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Resume Builder</span>
              </button>
              <button
                onClick={() => handleBuilderClick('portfolio')}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 rounded-xl transition-all cursor-pointer text-left"
              >
                <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Portfolio Builder</span>
              </button>
              <a
                href="/showroom.html"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:text-cyan-600 hover:bg-cyan-50/60 rounded-xl transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>3D Showroom</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-100 text-cyan-700 font-bold">Live</span>
              </a>

              <div className="pt-3 mt-1.5 border-t border-slate-200">
                {isAdmin ? (
                  <Button
                    variant="primary"
                    fullWidth
                    size="md"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setCurrentRoute('admin')
                    }}
                    leftIcon={<Shield className="w-4 h-4 text-white" />}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm justify-center py-2.5"
                  >
                    Admin Console
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    fullWidth
                    size="md"
                    onClick={handleGetStarted}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold shadow-xs justify-center py-2.5"
                  >
                    Open Workspace
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar
