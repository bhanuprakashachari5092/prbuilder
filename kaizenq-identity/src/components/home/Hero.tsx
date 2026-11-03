import React, { useRef, useState, useEffect } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
} from 'motion/react'
import {
  ArrowRight,
  FileText,
  Globe,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Lock,
} from 'lucide-react'
import { Container } from '../ui/Container.tsx'
import { Button } from '../ui/Button.tsx'
import { useApp } from '../../app/providers/AppContext.ts'
import { useAuth } from '../../app/providers/AuthContext.tsx'
import { useMediaQuery } from '../../hooks/useMediaQuery.ts'
import { cn } from '../../lib/utils.ts'
import resumeMockupPng from '../../assets/images/resume-mockup.png'
import portfolioMockupPng from '../../assets/images/portfolio-mockup.png'

export interface HeroProps {
  onOpenBuilder?: () => void
  onExplorePortfolios?: () => void
}

/**
 * Hero — Cinematic Full-Viewport Paper Scene & Scroll-Driven Hero Transformation
 * 
 * PHASE 2: Full-screen immersive paper scene filling the entire viewport.
 *          One prominent Resume paper and one prominent Portfolio paper in the center,
 *          accompanied by smaller background papers creating calm, realistic spatial depth.
 *          NO navbar, menus, hero headline, description, or CTA buttons in this phase.
 * PHASE 3: Native scroll-driven transformation that moves and scales the two central papers
 *          into their exact positions in the existing hero layout, while progressively revealing
 *          the hero headline, description, CTAs, and top navbar.
 */
export const Hero: React.FC<HeroProps> = () => {
  const { setCurrentRoute, setIsAuthOpen, setAuthMode, setTargetRouteAfterAuth } = useApp()
  const { user } = useAuth()
  const heroRef = useRef<HTMLElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // Track scroll position across the dedicated hero track.
  // 'start start' -> when hero top hits viewport top (scrollY = 0).
  // 'end end' -> when hero bottom hits viewport bottom (exact moment sticky pin releases).
  // This ensures scroll progress reaches 1.0 precisely as the sticky scene finishes.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end end'],
  })

  // Responsive, fluid spring physics with low inertia for immediate tracking
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 28,
    mass: 0.15,
  })

  // =========================================================================
  // Viewport Exact Centering & Scroll-Driven Hero Transformation
  // In initial state (scrollY = 0, immediately after loading animation):
  // Both Resume and Portfolio mockup PNGs are mathematically guaranteed to be
  // placed EXACTLY IN THE MIDDLE of the viewport.
  // As user scrolls, the stage glides smoothly and settles in the right column
  // by SETTLE_P (0.50), while the left hero headline and CTAs progressively reveal.
  // =========================================================================
  const SETTLE_P = 0.50

  const stageAnchorRef = useRef<HTMLDivElement>(null)
  const [centerOffsets, setCenterOffsets] = useState(() => ({
    deltaX: typeof window !== 'undefined' && window.innerWidth >= 1024 ? -360 : 0,
    deltaY: typeof window !== 'undefined' && window.innerWidth < 1024 ? -160 : 0,
    ready: false,
  }))

  useEffect(() => {
    const calculateCenterOffsets = () => {
      if (!stageAnchorRef.current) return
      const rect = stageAnchorRef.current.getBoundingClientRect()
      const stageCenterX = rect.left + rect.width / 2
      const stageCenterY = rect.top + rect.height / 2
      const viewportCenterX = window.innerWidth / 2
      const viewportCenterY = window.innerHeight / 2

      setCenterOffsets({
        deltaX: viewportCenterX - stageCenterX,
        deltaY: viewportCenterY - stageCenterY,
        ready: true,
      })
    }

    calculateCenterOffsets()
    const rafId = requestAnimationFrame(calculateCenterOffsets)
    window.addEventListener('resize', calculateCenterOffsets)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', calculateCenterOffsets)
    }
  }, [])

  // The entire cards stage translates from exact viewport center to the settled right column
  const stageX = useTransform(smoothProgress, (p) => {
    const t = Math.min(1, Math.max(0, p / SETTLE_P))
    const ease = 1 - Math.pow(1 - t, 3)
    return centerOffsets.deltaX * (1 - ease)
  })

  const stageY = useTransform(smoothProgress, (p) => {
    const t = Math.min(1, Math.max(0, p / SETTLE_P))
    const ease = 1 - Math.pow(1 - t, 3)
    return centerOffsets.deltaY * (1 - ease)
  })

  // Individual card relative transforms:
  // In the center (p = 0):
  // Portfolio card is placed on the left (-110px), Resume card on the right (+50px).
  // Neither card obscures the other; both are 100% visible, crisp, and centered as a duo.
  // In the settled position (p = SETTLE_P):
  // Both cards glide into their compact hero layout positions on the right.
  const desktopResumeRelX = 50
  const desktopResumeRelY = 25
  const desktopPortfolioRelX = -110
  const desktopPortfolioRelY = -25

  const mobileResumeRelX = 30
  const mobileResumeRelY = 25
  const mobilePortfolioRelX = -30
  const mobilePortfolioRelY = -25

  const resumeX = useTransform(smoothProgress, (p) => {
    const t = Math.min(1, Math.max(0, p / SETTLE_P))
    const ease = 1 - Math.pow(1 - t, 3)
    const startX = isDesktop ? desktopResumeRelX : mobileResumeRelX
    return startX * (1 - ease)
  })

  const resumeY = useTransform(smoothProgress, (p) => {
    const t = Math.min(1, Math.max(0, p / SETTLE_P))
    const ease = 1 - Math.pow(1 - t, 3)
    const startY = isDesktop ? desktopResumeRelY : mobileResumeRelY
    return startY * (1 - ease)
  })

  const resumeRotate = useTransform(smoothProgress, [0, SETTLE_P], [isDesktop ? 3.5 : 3, 3])
  const resumeScale = useTransform(smoothProgress, [0, SETTLE_P], [1.03, 1])

  const portfolioX = useTransform(smoothProgress, (p) => {
    const t = Math.min(1, Math.max(0, p / SETTLE_P))
    const ease = 1 - Math.pow(1 - t, 3)
    const startX = isDesktop ? desktopPortfolioRelX : mobilePortfolioRelX
    return startX * (1 - ease)
  })

  const portfolioY = useTransform(smoothProgress, (p) => {
    const t = Math.min(1, Math.max(0, p / SETTLE_P))
    const ease = 1 - Math.pow(1 - t, 3)
    const startY = isDesktop ? desktopPortfolioRelY : mobilePortfolioRelY
    return startY * (1 - ease)
  })

  const portfolioRotate = useTransform(smoothProgress, [0, SETTLE_P], [isDesktop ? -3 : -2.5, -2.5])
  const portfolioScale = useTransform(smoothProgress, [0, SETTLE_P], [1.03, 1])

  // Left Column Hero Content: Reveals smoothly and decisively as scroll begins,
  // reaching full 1.0 opacity early so headline, buttons, and badges are crisp & readable
  const leftColOpacity = useTransform(smoothProgress, [0.04, 0.22], [0, 1])
  const leftColX = useTransform(smoothProgress, [0.04, 0.22], [isDesktop ? -18 : 0, 0])
  const leftColY = useTransform(smoothProgress, [0.04, 0.22], [10, 0])
  const leftColPointerEvents = useTransform(smoothProgress, (p) => (p >= 0.15 ? 'auto' : 'none'))

  // Ambient floating background papers (Phase 2 spatial depth; dissolve on scroll)
  const bgPapersOpacity = useTransform(smoothProgress, [0, 0.14], [0.65, 0])
  const bgPapersScale = useTransform(smoothProgress, [0, 0.14], [1, 0.92])

  // Whisper-quiet initial scroll indicator
  const scrollPromptOpacity = useTransform(smoothProgress, [0, 0.08], [1, 0])

  // Ambient lighting scale & opacity
  const glowScale = useTransform(smoothProgress, [0, 1], [1, 1.25])
  const glowOpacity = useTransform(smoothProgress, [0, 1], [0.85, 0.45])

  const handleResumeClick = () => {
    if (user) {
      setCurrentRoute('resume')
    } else {
      setTargetRouteAfterAuth('resume')
      setAuthMode('signup')
      setIsAuthOpen(true)
    }
  }

  const handlePortfolioClick = () => {
    if (user) {
      setCurrentRoute('portfolio')
    } else {
      setTargetRouteAfterAuth('portfolio')
      setAuthMode('signup')
      setIsAuthOpen(true)
    }
  }

  // =========================================================================
  // Accessibility: prefers-reduced-motion fallback
  // When reduced motion is requested, render the standard hero cleanly without
  // the sticky scroll-linked track or elaborate transforms.
  // =========================================================================
  if (shouldReduceMotion) {
    return (
      <section
        className="relative pt-16 sm:pt-20 lg:pt-24 pb-16 sm:pb-20 lg:pb-24 overflow-hidden bg-[#F7F9FC]"
        aria-label="PR Builder Hero"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[520px] bg-gradient-to-b from-[#EFF6FF] via-[#EEF2FF]/40 to-transparent blur-3xl pointer-events-none -z-10" />

        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-14 items-center">
            {/* Left Column */}
            <div className="lg:col-span-6 flex flex-col text-left z-30">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 self-start px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] shadow-sm mb-2.5 sm:mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
                  YOUR PROFESSIONAL IDENTITY, REIMAGINED
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-extrabold tracking-tight font-sans text-[#111827] leading-[1.15] sm:leading-[1.12]">
                Your Skills. Your Story.{' '}
                <span className="block mt-0.5 sm:mt-1.5 bg-gradient-to-r from-[#111827] via-[#2563EB] to-[#1D4ED8] bg-clip-text text-transparent">
                  Your Future.
                </span>
              </h1>

              <p className="mt-2.5 sm:mt-4 text-xs sm:text-base text-[#334155] font-normal leading-relaxed max-w-xl">
                Create an ATS-optimized resume and a live personal portfolio that showcases your work,
                skills, and potential — all in one unified workspace.
              </p>

              <div className="mt-4 sm:mt-6 flex flex-row items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleResumeClick}
                  leftIcon={<FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
                  className="flex-1 sm:flex-initial text-xs sm:text-base px-3.5 sm:px-6 py-2.5 sm:py-3.5 shadow-md shadow-blue-600/20 whitespace-nowrap"
                >
                  Build My Resume
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={handlePortfolioClick}
                  leftIcon={<Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2563EB] shrink-0" />}
                  className="flex-1 sm:flex-initial text-xs sm:text-base px-3.5 sm:px-6 py-2.5 sm:py-3.5 whitespace-nowrap"
                >
                  Create My Portfolio
                </Button>
              </div>

              <div className="mt-3.5 sm:mt-6 pt-2.5 sm:pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center gap-y-1.5 gap-x-4 sm:gap-x-8 text-[11px] sm:text-sm text-[#64748B]">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2563EB] shrink-0" />
                  <span>LaTeX-Grade ATS Templates</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2563EB] shrink-0" />
                  <span>Real-Time Live Sync</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2563EB] shrink-0" />
                  <span>Instant Sharing & Free Subdomain</span>
                </div>
              </div>
            </div>

            {/* Right Column: Settled Cards */}
            <div className="lg:col-span-6 relative w-full flex items-center justify-center lg:justify-end min-h-[220px] sm:min-h-[280px] md:min-h-[340px] lg:min-h-[410px] xl:min-h-[430px]">
              <div className="relative w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[470px] xl:max-w-[490px] 2xl:max-w-none h-[220px] sm:h-[280px] md:h-[340px] lg:h-[410px] xl:h-[430px]">
                {/* Resume Card */}
                <div
                  className="absolute top-2 sm:top-5 lg:top-10 right-1 sm:right-2 lg:right-0 z-10 w-[165px] sm:w-[215px] md:w-[255px] lg:w-[275px] xl:w-[290px] rotate-3 cursor-pointer group"
                  onClick={handleResumeClick}
                >
                  <div className="relative rounded-xl sm:rounded-2xl p-1 bg-white border border-[#E2E8F0] shadow-xl hover:shadow-2xl transition-shadow duration-300">
                    <div className="flex items-center justify-between px-2 sm:px-3 py-1 sm:py-1.5 border-b border-[#E2E8F0]/80 bg-white/80 rounded-t-lg sm:rounded-t-xl">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#2563EB]" />
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase text-[#1E40AF]">Resumes</span>
                      </div>
                      <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[9px] sm:text-[10px] font-mono font-semibold text-emerald-700">
                        <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
                        <span>98% ATS</span>
                      </div>
                    </div>
                    <img
                      src={resumeMockupPng}
                      alt="PR Builder ATS-Friendly Resume Preview showing Experience, Education, Skills, and Projects sections"
                      width={650}
                      height={900}
                      className="w-full h-auto rounded-b-lg sm:rounded-b-xl object-contain"
                    />
                  </div>
                </div>

                {/* Portfolio Card */}
                <div
                  className="absolute bottom-1 sm:bottom-2 lg:bottom-3 left-1 sm:left-2 lg:left-0 z-20 w-[195px] sm:w-[250px] md:w-[315px] lg:w-[340px] xl:w-[365px] -rotate-2.5 cursor-pointer group"
                  onClick={handlePortfolioClick}
                >
                  <div className="relative rounded-xl sm:rounded-2xl p-1 bg-white border border-[#E2E8F0] shadow-xl hover:shadow-2xl transition-shadow duration-300">
                    <div className="flex items-center justify-between px-2 sm:px-3 py-1 sm:py-1.5 border-b border-[#E2E8F0]/80 bg-white/80 rounded-t-lg sm:rounded-t-xl gap-1.5 sm:gap-2">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <span className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-400" />
                        <span className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400" />
                        <span className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400" />
                        <span className="ml-0.5 sm:ml-1 text-[10px] sm:text-[11px] font-bold uppercase text-[#4338CA]">Portfolios</span>
                      </div>
                      <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-[9px] sm:text-[10px] font-mono font-semibold text-indigo-700">
                        <Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#4F46E5]" />
                        <span>Live Web</span>
                      </div>
                    </div>
                    <img
                      src={portfolioMockupPng}
                      alt="PR Builder Modern Developer Portfolio Preview with project showcase, skills, and interactive UI"
                      width={920}
                      height={687}
                      className="w-full h-auto rounded-b-lg sm:rounded-b-xl object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    )
  }

  // =========================================================================
  // Immersive Full-Screen Paper Scene (Phase 2) & Scroll-Driven Hero (Phase 3)
  // =========================================================================
  return (
    <section
      ref={heroRef}
      className={cn(
        'relative bg-[#F7F9FC]',
        isDesktop ? 'h-[220vh]' : 'h-[180vh]',
      )}
      aria-label="PR Builder Hero"
    >
      {/* Sticky Full-Viewport Stage */}
      <div className="sticky top-0 h-screen h-[100dvh] w-full overflow-hidden bg-[#F7F9FC] flex flex-col">
        
        {/* Soft Architectural Grid & Ambient Radial Lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(#E2E8F0_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
        
        <motion.div
          style={{ scale: glowScale, opacity: glowOpacity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[640px] bg-gradient-to-b from-[#EFF6FF] via-[#EEF2FF]/40 to-transparent blur-3xl pointer-events-none -z-10"
        />

        {/* =================================================================== */}
        {/* PHASE 2: Smaller Floating Background Papers (Spatial Depth Layer)   */}
        {/* Dissolve gracefully as user begins scrolling into Phase 3          */}
        {/* =================================================================== */}
        <motion.div
          style={{ opacity: bgPapersOpacity, scale: bgPapersScale }}
          className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
          aria-hidden="true"
        >
          {/* Background Paper 1: Floating Miniature ATS Resume Sheet (Top Left) */}
          <motion.div
            animate={shouldReduceMotion ? undefined : { y: [0, -10, 0], rotate: [-14, -12, -14] }}
            transition={shouldReduceMotion ? undefined : { repeat: Infinity, duration: 6.2, ease: 'easeInOut' }}
            className="hidden sm:block absolute top-[12%] left-[6%] lg:left-[10%] w-[160px] lg:w-[190px] rounded-xl bg-white/90 p-3 border border-[#E2E8F0] shadow-[0_15px_35px_rgba(15,23,42,0.06)] backdrop-blur-xs"
          >
            <div className="w-12 h-2 rounded bg-[#2563EB]/40 mb-2" />
            <div className="w-20 h-1.5 rounded bg-slate-300 mb-3" />
            <div className="space-y-1.5 opacity-60">
              <div className="w-full h-1 rounded bg-slate-200" />
              <div className="w-4/5 h-1 rounded bg-slate-200" />
              <div className="w-3/4 h-1 rounded bg-slate-200" />
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex gap-1">
              <div className="w-6 h-1 rounded bg-slate-200" />
              <div className="w-8 h-1 rounded bg-slate-200" />
            </div>
          </motion.div>

          {/* Background Paper 2: Floating Miniature Portfolio Window (Top Right) */}
          <motion.div
            animate={shouldReduceMotion ? undefined : { y: [0, 10, 0], rotate: [11, 13, 11] }}
            transition={shouldReduceMotion ? undefined : { repeat: Infinity, duration: 6.8, ease: 'easeInOut', delay: 0.5 }}
            className="hidden sm:block absolute top-[14%] right-[6%] lg:right-[11%] w-[170px] lg:w-[200px] rounded-xl bg-white/90 p-2.5 border border-[#E0E7FF] shadow-[0_15px_35px_rgba(99,102,241,0.07)] backdrop-blur-xs"
          >
            <div className="flex items-center gap-1 mb-2 pb-1 border-b border-slate-100">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-300" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              <div className="ml-auto w-12 h-1 rounded bg-indigo-100" />
            </div>
            <div className="w-16 h-2 rounded bg-indigo-400/40 mb-2" />
            <div className="grid grid-cols-2 gap-1.5 opacity-60">
              <div className="h-6 rounded bg-indigo-50 border border-indigo-100/60" />
              <div className="h-6 rounded bg-indigo-50 border border-indigo-100/60" />
            </div>
          </motion.div>

          {/* Background Paper 3: Floating Skills Sheet (Bottom Left) */}
          <motion.div
            animate={shouldReduceMotion ? undefined : { y: [0, 8, 0], rotate: [8, 10, 8] }}
            transition={shouldReduceMotion ? undefined : { repeat: Infinity, duration: 5.6, ease: 'easeInOut', delay: 1 }}
            className="hidden md:block absolute bottom-[14%] left-[8%] lg:left-[13%] w-[150px] lg:w-[175px] rounded-xl bg-white/85 p-3 border border-[#E2E8F0] shadow-[0_15px_30px_rgba(15,23,42,0.05)] backdrop-blur-xs"
          >
            <div className="w-14 h-1.5 rounded bg-slate-400/50 mb-2" />
            <div className="flex flex-wrap gap-1 opacity-70">
              <span className="w-6 h-1.5 rounded bg-blue-100" />
              <span className="w-8 h-1.5 rounded bg-blue-100" />
              <span className="w-5 h-1.5 rounded bg-blue-100" />
            </div>
          </motion.div>

          {/* Background Paper 4: Floating Verification Badge Paper (Bottom Right) */}
          <motion.div
            animate={shouldReduceMotion ? undefined : { y: [0, -8, 0], rotate: [-10, -8, -10] }}
            transition={shouldReduceMotion ? undefined : { repeat: Infinity, duration: 6.4, ease: 'easeInOut', delay: 1.5 }}
            className="hidden md:block absolute bottom-[16%] right-[8%] lg:right-[12%] w-[160px] lg:w-[185px] rounded-xl bg-white/85 p-3 border border-[#E0E7FF] shadow-[0_15px_30px_rgba(99,102,241,0.06)] backdrop-blur-xs"
          >
            <div className="w-16 h-1.5 rounded bg-indigo-300 mb-2" />
            <div className="w-full h-8 rounded bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100/50" />
          </motion.div>
        </motion.div>

        {/* Phase 2: Whisper-Quiet Bottom Scroll Indicator (Dissolves upon scroll) */}
        <motion.div
          style={{ opacity: scrollPromptOpacity }}
          className="absolute bottom-6 sm:bottom-8 inset-x-0 mx-auto flex flex-col items-center gap-1.5 text-xs text-[#64748B] pointer-events-none z-30 select-none"
        >
          <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.25em] uppercase text-[#64748B] font-medium opacity-80">
            SCROLL TO EXPLORE
          </span>
          <motion.span
            animate={shouldReduceMotion ? undefined : { y: [0, 4, 0] }}
            transition={shouldReduceMotion ? undefined : { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="text-[#2563EB] font-bold"
          >
            ↓
          </motion.span>
        </motion.div>

        {/* =================================================================== */}
        {/* Core Layout Grid: Contains Left Hero Text and Right Paper Showcase */}
        {/* =================================================================== */}
        {/* Reserved Navbar Space at Top of Sticky Viewport */}
        <div className="h-14 sm:h-16 lg:h-20 w-full shrink-0 pointer-events-none" aria-hidden="true" />

        {/* Vertically Centered Hero Viewport Stage Beneath Navbar */}
        <div className="flex-1 w-full flex items-center justify-center relative z-20 pb-3 sm:pb-6 lg:pb-8 px-2 sm:px-0">
          <Container size="xl" className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-14 items-center">
            
            {/* Left Column: Typography, Value Proposition & CTAs */}
            {/* IN INITIAL STATE: Completely hidden (opacity: 0, pointerEvents: none). Progressively revealed on scroll. */}
            <motion.div
              style={{
                opacity: leftColOpacity,
                x: leftColX,
                y: leftColY,
                pointerEvents: leftColPointerEvents,
              }}
              className="lg:col-span-6 flex flex-col text-left z-30"
            >
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 self-start px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] shadow-sm mb-2.5 sm:mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
                  YOUR PROFESSIONAL IDENTITY, REIMAGINED
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-2xl sm:text-4xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-extrabold tracking-tight font-sans text-[#111827] leading-[1.15] sm:leading-[1.12]">
                Your Skills. Your Story.{' '}
                <span className="block mt-0.5 sm:mt-1.5 bg-gradient-to-r from-[#111827] via-[#2563EB] to-[#1D4ED8] bg-clip-text text-transparent">
                  Your Future.
                </span>
              </h1>

              {/* Supporting Text */}
              <p className="mt-2.5 sm:mt-4 text-xs sm:text-base text-[#334155] font-normal leading-relaxed max-w-xl">
                Create an ATS-optimized resume and a live personal portfolio that showcases your work,
                skills, and potential — all in one unified workspace.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="mt-4 sm:mt-6 flex flex-row items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleResumeClick}
                  leftIcon={<FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
                  className="flex-1 sm:flex-initial text-xs sm:text-base px-3.5 sm:px-6 py-2.5 sm:py-3.5 shadow-md shadow-blue-600/20 whitespace-nowrap"
                >
                  Build My Resume
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={handlePortfolioClick}
                  leftIcon={<Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2563EB] shrink-0" />}
                  className="flex-1 sm:flex-initial text-xs sm:text-base px-3.5 sm:px-6 py-2.5 sm:py-3.5 whitespace-nowrap"
                >
                  Create My Portfolio
                </Button>
              </div>

              {/* Three Value Proof Points */}
              <div className="mt-3.5 sm:mt-6 pt-2.5 sm:pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center gap-y-1.5 gap-x-4 sm:gap-x-8 text-[11px] sm:text-sm text-[#64748B]">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2563EB] shrink-0" />
                  <span>LaTeX-Grade ATS Templates</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2563EB] shrink-0" />
                  <span>Real-Time Live Sync</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2563EB] shrink-0" />
                  <span>Instant Sharing & Free Subdomain</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column: The Two Prominent Center Papers */}
            {/* IN PHASE 2: Main visual focus of the entire viewport! */}
            {/* IN PHASE 3: Seamlessly glides and settles into the normal hero layout. */}
            <div
              className="lg:col-span-6 relative w-full flex items-center justify-center lg:justify-end min-h-[220px] sm:min-h-[280px] md:min-h-[340px] lg:min-h-[410px] xl:min-h-[430px]"
            >
              {/* Invisible anchor marking the exact settled coordinates */}
              <div
                ref={stageAnchorRef}
                className="absolute w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[470px] xl:max-w-[490px] h-[220px] sm:h-[280px] md:h-[340px] lg:h-[410px] xl:h-[430px] pointer-events-none opacity-0"
                aria-hidden="true"
              />

              {/* Animated stage that glides from exact viewport center to right column */}
              <motion.div
                style={{
                  x: stageX,
                  y: stageY,
                }}
                className="relative w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[470px] xl:max-w-[490px] 2xl:max-w-none h-[220px] sm:h-[280px] md:h-[340px] lg:h-[410px] xl:h-[430px]"
              >

                {/* ========================================================= */}
                {/* 1. PROMINENT RESUME PAPER                                  */}
                {/* Phase 2: Center-left prominent focus                      */}
                {/* Phase 3: Glides to top-right hero position                 */}
                {/* ========================================================= */}
                <motion.div
                  style={{
                    x: resumeX,
                    y: resumeY,
                    rotate: resumeRotate,
                    scale: resumeScale,
                  }}
                  className="absolute top-2 sm:top-5 lg:top-10 right-1 sm:right-2 lg:right-0 z-20 w-[165px] sm:w-[215px] md:w-[255px] lg:w-[275px] xl:w-[290px] cursor-pointer group"
                  onClick={handleResumeClick}
                  title="Open Resume Builder"
                >
                  {/* Floating Levitation Animation in Phase 2 */}
                  <motion.div
                    animate={shouldReduceMotion ? undefined : { y: [0, -7, 0] }}
                    transition={
                      shouldReduceMotion
                        ? undefined
                        : { repeat: Infinity, duration: 4.6, ease: 'easeInOut' }
                    }
                    className="relative rounded-xl sm:rounded-2xl p-1 bg-white border border-[#E2E8F0] shadow-[0_20px_50px_rgba(30,58,138,0.12),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_30px_70px_rgba(30,58,138,0.2)] transition-shadow duration-300"
                  >
                    {/* Realistic Paper Header with ATS Badge */}
                    <div className="flex items-center justify-between px-2 sm:px-3 py-1 sm:py-2 border-b border-[#E2E8F0]/80 bg-[#FAFCFF] rounded-t-lg sm:rounded-t-xl">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#2563EB]" />
                        <span className="text-[10px] sm:text-[11px] font-bold tracking-wide uppercase text-[#1E40AF]">
                          Resumes
                        </span>
                        <span className="text-[10px] font-mono text-[#64748B] hidden md:inline">
                          • ATS Optimized
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[9px] sm:text-[10px] font-mono font-semibold text-emerald-700">
                        <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
                        <span>98% ATS</span>
                      </div>
                    </div>

                    {/* High-Definition A4 ATS Resume Preview */}
                    <div className="relative p-1 sm:p-1.5 overflow-hidden rounded-b-lg sm:rounded-b-xl bg-[#F8FAFC]">
                      <img
                        src={resumeMockupPng}
                        alt="PR Builder ATS-Friendly Resume Preview showing Experience, Education, Skills, and Projects sections"
                        width={650}
                        height={900}
                        loading="eager"
                        className="w-full h-auto rounded-md sm:rounded-lg object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-[1.01]"
                      />
                    </div>
                  </motion.div>
                </motion.div>

                {/* ========================================================= */}
                {/* 2. PROMINENT PORTFOLIO PAPER                               */}
                {/* Phase 2: Center-right prominent focus                     */}
                {/* Phase 3: Glides to bottom-left hero position               */}
                {/* ========================================================= */}
                <motion.div
                  style={{
                    x: portfolioX,
                    y: portfolioY,
                    rotate: portfolioRotate,
                    scale: portfolioScale,
                  }}
                  className="absolute bottom-1 sm:bottom-2 lg:bottom-3 left-1 sm:left-2 lg:left-0 z-10 w-[195px] sm:w-[250px] md:w-[315px] lg:w-[340px] xl:w-[365px] cursor-pointer group"
                  onClick={handlePortfolioClick}
                  title="Open Portfolio Studio"
                >
                  {/* Floating Levitation Animation in Phase 2 */}
                  <motion.div
                    animate={shouldReduceMotion ? undefined : { y: [0, 7, 0] }}
                    transition={
                      shouldReduceMotion
                        ? undefined
                        : { repeat: Infinity, duration: 5.0, ease: 'easeInOut', delay: 0.5 }
                    }
                    className="relative rounded-xl sm:rounded-2xl p-1 bg-[#FCFCFF] border border-[#E0E7FF] shadow-[0_20px_50px_rgba(99,102,241,0.14),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_30px_70px_rgba(99,102,241,0.22)] transition-shadow duration-300"
                  >
                    {/* Realistic Miniature Browser Chrome Header */}
                    <div className="flex items-center justify-between px-2 sm:px-3 py-1 sm:py-2 border-b border-[#E2E8F0]/80 bg-white rounded-t-lg sm:rounded-t-xl gap-1.5 sm:gap-2">
                      {/* Window Controls & Title */}
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <span className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-400" />
                        <span className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400" />
                        <span className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400" />
                        <span className="ml-0.5 sm:ml-1 text-[10px] sm:text-[11px] font-bold tracking-wide uppercase text-[#4338CA]">
                          Portfolios
                        </span>
                      </div>

                      {/* Mock Subdomain URL Address Pill */}
                      <div className="hidden xs:flex sm:flex flex-1 max-w-[140px] sm:max-w-[210px] px-1.5 sm:px-2 py-0.5 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] items-center justify-center gap-1 text-[9px] sm:text-[10px] font-mono text-[#475569] truncate">
                        <Lock className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                        <span className="truncate">alexander.prbuilder.in</span>
                      </div>

                      {/* Live Web Status Badge */}
                      <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-[9px] sm:text-[10px] font-mono font-semibold text-indigo-700">
                        <Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#4F46E5]" />
                        <span className="hidden sm:inline">Live Web</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                    </div>

                    {/* Modern Developer Portfolio Mockup Preview */}
                    <div className="relative p-1 sm:p-1.5 overflow-hidden rounded-b-lg sm:rounded-b-xl bg-[#F8FAFC]">
                      <img
                        src={portfolioMockupPng}
                        alt="PR Builder Modern Developer Portfolio Preview with project showcase, skills, and interactive UI"
                        width={920}
                        height={687}
                        loading="eager"
                        className="w-full h-auto rounded-md sm:rounded-lg object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-[1.01]"
                      />

                      {/* Interactive Quick Action Pill on Hover */}
                      <div className="hidden sm:inline-flex absolute bottom-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-sm text-xs text-[#4F46E5] border border-[#C7D2FE] font-medium shadow-md">
                        <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                        <span>Open Portfolio Studio</span>
                        <ExternalLink className="w-3 h-3 text-[#64748B] ml-0.5" />
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

              </motion.div>
            </div>

          </div>
        </Container>
        </div>
      </div>
    </section>
  )
}

export default Hero
