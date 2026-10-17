import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Menu, X, ArrowRight } from 'lucide-react'
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
  onOpenAuth,
  onOpenBuilder: _onOpenBuilder,
  revealOnScroll = false,
}) => {
  const { setCurrentRoute, setTargetRouteAfterAuth } = useApp()
  const { user } = useAuth()
  const shouldReduceMotion = useReducedMotion()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHeroRevealed, setIsHeroRevealed] = useState(!revealOnScroll || shouldReduceMotion)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setIsScrolled(scrollY > 15)
      if (revealOnScroll && !shouldReduceMotion) {
        // Reveal navbar smoothly as user begins scroll transition, fully visible in settled hero
        const revealThreshold = Math.max(window.innerHeight * 0.08, 40)
        setIsHeroRevealed(scrollY >= revealThreshold)
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [revealOnScroll, shouldReduceMotion])

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
    if (user) {
      setCurrentRoute(target)
    } else {
      setTargetRouteAfterAuth(target)
      onOpenAuth?.('signup')
    }
  }

  const handleGetStarted = () => {
    setMobileMenuOpen(false)
    if (user) {
      setCurrentRoute('dashboard')
    } else {
      setTargetRouteAfterAuth('dashboard')
      onOpenAuth?.('signup')
    }
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
              <PRLogo size="md" />
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
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCurrentRoute('dashboard')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="text-xs lg:text-sm"
              >
                Go to Workspace
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenAuth?.('signin')}
                  className="text-xs lg:text-sm text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC]"
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGetStarted}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="text-xs lg:text-sm"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#111827] hover:bg-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
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
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden bg-white/98 border-b border-[#E2E8F0] backdrop-blur-xl px-4 pt-3 pb-6 overflow-hidden shadow-lg"
          >
            <div className="flex flex-col gap-2">
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault()
                  handleNavClick('#features')
                }}
                className="px-3 py-2.5 text-sm font-medium text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC] rounded-lg transition-colors"
              >
                Features
              </a>
              <button
                onClick={() => handleBuilderClick('resume')}
                className="w-full text-left px-3 py-2.5 text-sm font-medium text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer"
              >
                Resume Builder
              </button>
              <button
                onClick={() => handleBuilderClick('portfolio')}
                className="w-full text-left px-3 py-2.5 text-sm font-medium text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer"
              >
                Portfolio Builder
              </button>

              <div className="pt-3 mt-2 border-t border-[#E2E8F0] flex flex-col gap-2.5">
                {user ? (
                  <Button
                    variant="primary"
                    fullWidth
                    size="sm"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setCurrentRoute('dashboard')
                    }}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Go to Workspace
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      fullWidth
                      size="sm"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        onOpenAuth?.('signin')
                      }}
                      className="border-[#E2E8F0] text-[#111827] hover:bg-[#F8FAFC]"
                    >
                      Sign In
                    </Button>
                    <Button
                      variant="primary"
                      fullWidth
                      size="sm"
                      onClick={handleGetStarted}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Get Started
                    </Button>
                  </>
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
