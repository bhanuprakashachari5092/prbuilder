import React, { useRef, useState } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'motion/react'
import {
  FileText,
  Globe,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Download,
  Share2,
  Layers,
  Palette,
  Eye,
  Check,
} from 'lucide-react'
import { Container } from '../ui/Container.tsx'
import { Button } from '../ui/Button.tsx'
import { useApp } from '../../app/providers/AppContext.ts'
import { useAuth } from '../../app/providers/AuthContext.tsx'

interface TiltCardWrapperProps {
  children: React.ReactNode
  accentColor: 'blue' | 'indigo'
  initialDelay?: number
  idleFloatOffset?: number
}

const TiltCardWrapper: React.FC<TiltCardWrapperProps> = ({
  children,
  accentColor,
  initialDelay = 0,
  idleFloatOffset = 0,
}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  // Fluid spring physics with natural damping and low inertia
  const springConfig = { damping: 22, stiffness: 240, mass: 0.12 }
  const springX = useSpring(mouseX, springConfig)
  const springY = useSpring(mouseY, springConfig)

  // 3D rotation transforms: tilt angles up to 9 degrees
  const rotateX = useTransform(springY, [0, 1], shouldReduceMotion ? [0, 0] : [9, -9])
  const rotateY = useTransform(springX, [0, 1], shouldReduceMotion ? [0, 0] : [-9, 9])

  // Glare light reflections mapping from mouse position
  const glareX = useTransform(springX, [0, 1], [0, 100])
  const glareY = useTransform(springY, [0, 1], [0, 100])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || shouldReduceMotion) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    mouseX.set(0.5)
    mouseY.set(0.5)
  }

  const isBlue = accentColor === 'blue'

  return (
    <div
      style={{ perspective: 1200 }}
      className="w-full flex"
    >
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, delay: initialDelay, ease: [0.16, 1, 0.3, 1] }}
        animate={
          shouldReduceMotion || isHovered
            ? {}
            : {
                y: [0, idleFloatOffset ? -6 : -8, 0],
                transition: {
                  duration: 5.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: initialDelay * 1.5,
                },
              }
        }
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className={`group relative w-full rounded-3xl bg-white border transition-all duration-300 flex flex-col justify-between p-8 sm:p-10 ${
          isBlue
            ? 'border-[#E2E8F0] hover:border-[#93C5FD] hover:shadow-[0_24px_50px_-12px_rgba(37,99,235,0.18),0_12px_24px_-6px_rgba(15,23,42,0.06)]'
            : 'border-[#E2E8F0] hover:border-[#A5B4FC] hover:shadow-[0_24px_50px_-12px_rgba(79,70,229,0.18),0_12px_24px_-6px_rgba(15,23,42,0.06)]'
        } shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.03)]`}
      >
        {/* Subtle 3D Ambient Backlight Glow on hover */}
        <div
          className={`absolute -inset-px rounded-3xl pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${
            isBlue
              ? 'bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10'
              : 'bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10'
          }`}
          style={{ transform: 'translateZ(-1px)' }}
        />

        {/* Dynamic Interactive Glare Sheen Layer */}
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-300 overflow-hidden"
          style={{
            transform: 'translateZ(1px)',
            opacity: isHovered ? 1 : 0,
            background: isBlue
              ? `radial-gradient(550px circle at ${glareX.get()}% ${glareY.get()}%, rgba(37, 99, 235, 0.08), rgba(255, 255, 255, 0.4) 15%, transparent 60%)`
              : `radial-gradient(550px circle at ${glareX.get()}% ${glareY.get()}%, rgba(79, 70, 229, 0.08), rgba(255, 255, 255, 0.4) 15%, transparent 60%)`,
          }}
        />

        {/* Inner Content with Real 3D Layer Elevation */}
        <div className="relative z-10 flex flex-col justify-between h-full" style={{ transformStyle: 'preserve-3d' }}>
          {children}
        </div>
      </motion.div>
    </div>
  )
}

export const BuilderShowcase: React.FC = () => {
  const { setCurrentRoute, setIsAuthOpen, setAuthMode, setTargetRouteAfterAuth } = useApp()
  const { user } = useAuth()

  // Interactive template preview state for Resume Card
  const [activeResumeTemplate, setActiveResumeTemplate] = useState<'Modern' | 'Classic' | 'Minimal'>('Modern')

  // Interactive theme preview state for Portfolio Card
  const [activePortfolioTheme, setActivePortfolioTheme] = useState<'Developer' | 'Minimal' | 'Creative'>('Developer')

  const handleOpenResume = () => {
    if (user) {
      setCurrentRoute('resume')
    } else {
      setTargetRouteAfterAuth('resume')
      setAuthMode('signup')
      setIsAuthOpen(true)
    }
  }

  const handleOpenPortfolio = () => {
    if (user) {
      setCurrentRoute('portfolio')
    } else {
      setTargetRouteAfterAuth('portfolio')
      setAuthMode('signup')
      setIsAuthOpen(true)
    }
  }

  return (
    <section
      id="builder-showcase"
      className="pt-14 sm:pt-20 pb-20 sm:pb-32 relative bg-[#F7F9FC] border-y border-[#E2E8F0] overflow-hidden"
    >
      {/* Background Decorative Ambient 3D Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-blue-200/30 via-indigo-200/25 to-blue-100/30 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-10 left-10 w-72 h-72 bg-blue-100/40 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -top-10 right-10 w-72 h-72 bg-indigo-100/40 rounded-full blur-2xl pointer-events-none" />

      <Container size="xl" className="relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-mono text-[#2563EB] mb-4 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Dedicated Studio Engines</span>
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111827] tracking-tight font-sans"
          >
            Two Powerful Builders. One Unified Platform.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-sm sm:text-base text-[#64748B] leading-relaxed"
          >
            Whether you are applying through corporate ATS portals or sharing your work with engineering leaders, PR Builder provides tailored tools for every touchpoint.
          </motion.p>
        </div>

        {/* Two Premium 3D Interactive Feature Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
          {/* Card A: Resume Builder with 3D Tilt & Parallax Depth */}
          <TiltCardWrapper accentColor="blue" initialDelay={0} idleFloatOffset={0}>
            <div>
              {/* Top Header Layer (Z: 32px) */}
              <div
                style={{ transform: 'translateZ(32px)' }}
                className="flex items-center justify-between mb-6 transition-transform duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shadow-xs group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-[#BFDBFE] font-semibold shadow-2xs">
                    ATS-Engineered
                  </span>
                </div>
              </div>

              {/* Title & Description Layer (Z: 26px) */}
              <div style={{ transform: 'translateZ(26px)' }} className="transition-transform duration-300">
                <h3 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight font-sans">
                  Resume Builder
                </h3>
                <p className="mt-3 text-sm text-[#64748B] leading-relaxed">
                  Design clean, recruiter-approved resumes with LaTeX-grade typography and structured formatting designed to pass applicant tracking systems with flying colors.
                </p>
              </div>

              {/* Feature Checklist Layer (Z: 22px) */}
              <div
                style={{ transform: 'translateZ(22px)' }}
                className="mt-6 space-y-3 pt-6 border-t border-[#E2E8F0] transition-transform duration-300"
              >
                <div className="flex items-start gap-3 text-sm text-[#111827]">
                  <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#111827]">Resume templates:</span>{' '}
                    <span className="text-[#64748B]">Modern, Classic, Technical, and Minimal layouts.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#111827]">
                  <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#111827]">Structured sections:</span>{' '}
                    <span className="text-[#64748B]">Personal details, education, skills, and projects.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#111827]">
                  <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#111827]">Live preview:</span>{' '}
                    <span className="text-[#64748B]">Instant side-by-side updates with browser auto-save.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#111827]">
                  <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#111827]">PDF export:</span>{' '}
                    <span className="text-[#64748B]">Print-ready A4 stylesheet with zero margin distortion.</span>
                  </div>
                </div>
              </div>

              {/* Interactive Mini Preview Pill Group Layer (Z: 30px) */}
              <div
                style={{ transform: 'translateZ(30px)' }}
                className="mt-6 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition-transform duration-300 group-hover:border-[#BFDBFE]"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-[#64748B] font-medium">Templates Included:</span>
                </div>
                <div className="flex gap-1.5 font-mono text-[10px]">
                  {(['Modern', 'Classic', 'Minimal'] as const).map((tmpl) => {
                    const isActive = activeResumeTemplate === tmpl
                    return (
                      <button
                        key={tmpl}
                        type="button"
                        onClick={() => setActiveResumeTemplate(tmpl)}
                        className={`px-2.5 py-1 rounded transition-all cursor-pointer font-medium flex items-center gap-1 ${
                          isActive
                            ? 'bg-blue-600 text-white font-semibold shadow-xs'
                            : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:text-[#111827] hover:border-slate-300'
                        }`}
                      >
                        {isActive && <Check className="w-2.5 h-2.5" />}
                        <span>{tmpl}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Action CTA Layer (Z: 36px) */}
            <div
              style={{ transform: 'translateZ(36px)' }}
              className="mt-8 pt-6 border-t border-[#E2E8F0] transition-transform duration-300"
            >
              <Button
                variant="primary"
                fullWidth
                size="md"
                onClick={handleOpenResume}
                leftIcon={<Download className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                className="shadow-sm shadow-blue-500/20 group-hover:shadow-md group-hover:shadow-blue-500/30 transition-all cursor-pointer"
              >
                Build Your Resume
              </Button>
            </div>
          </TiltCardWrapper>

          {/* Card B: Portfolio Builder with 3D Tilt & Parallax Depth */}
          <TiltCardWrapper accentColor="indigo" initialDelay={0.15} idleFloatOffset={1}>
            <div>
              {/* Top Header Layer (Z: 32px) */}
              <div
                style={{ transform: 'translateZ(32px)' }}
                className="flex items-center justify-between mb-6 transition-transform duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4F46E5] shadow-xs group-hover:scale-105 transition-transform">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#4F46E5] bg-[#EEF2FF] px-3 py-1 rounded-full border border-[#C7D2FE] font-semibold shadow-2xs">
                    Interactive Web
                  </span>
                </div>
              </div>

              {/* Title & Description Layer (Z: 26px) */}
              <div style={{ transform: 'translateZ(26px)' }} className="transition-transform duration-300">
                <h3 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight font-sans">
                  Portfolio Builder
                </h3>
                <p className="mt-3 text-sm text-[#64748B] leading-relaxed">
                  Transform your code, repositories, and experience into a fast, responsive personal website that showcases your unique engineering craftsmanship.
                </p>
              </div>

              {/* Feature Checklist Layer (Z: 22px) */}
              <div
                style={{ transform: 'translateZ(22px)' }}
                className="mt-6 space-y-3 pt-6 border-t border-[#E2E8F0] transition-transform duration-300"
              >
                <div className="flex items-start gap-3 text-sm text-[#111827]">
                  <CheckCircle2 className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#111827]">Projects & skills showcase:</span>{' '}
                    <span className="text-[#64748B]">Highlight architecture, live links, and tech stacks.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#111827]">
                  <CheckCircle2 className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#111827]">Customizable themes:</span>{' '}
                    <span className="text-[#64748B]">Modern, Minimal, Creative, and Developer modes.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#111827]">
                  <CheckCircle2 className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#111827]">Live portfolio preview:</span>{' '}
                    <span className="text-[#64748B]">Test interactive layouts on mobile, tablet, and desktop.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#111827]">
                  <CheckCircle2 className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#111827]">Publish and share:</span>{' '}
                    <span className="text-[#64748B]">Instant public URL generation and scannable QR card.</span>
                  </div>
                </div>
              </div>

              {/* Interactive Mini Preview Theme Group Layer (Z: 30px) */}
              <div
                style={{ transform: 'translateZ(30px)' }}
                className="mt-6 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition-transform duration-300 group-hover:border-[#C7D2FE]"
              >
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#4F46E5]" />
                  <span className="text-[#64748B] font-medium">Themes Included:</span>
                </div>
                <div className="flex gap-1.5 font-mono text-[10px]">
                  {(['Developer', 'Minimal', 'Creative'] as const).map((thm) => {
                    const isActive = activePortfolioTheme === thm
                    return (
                      <button
                        key={thm}
                        type="button"
                        onClick={() => setActivePortfolioTheme(thm)}
                        className={`px-2.5 py-1 rounded transition-all cursor-pointer font-medium flex items-center gap-1 ${
                          isActive
                            ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                            : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:text-[#111827] hover:border-slate-300'
                        }`}
                      >
                        {isActive && <Check className="w-2.5 h-2.5" />}
                        <span>{thm}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Action CTA Layer (Z: 36px) */}
            <div
              style={{ transform: 'translateZ(36px)' }}
              className="mt-8 pt-6 border-t border-[#E2E8F0] transition-transform duration-300"
            >
              <Button
                variant="secondary"
                fullWidth
                size="md"
                onClick={handleOpenPortfolio}
                leftIcon={<Share2 className="w-4 h-4 text-[#4F46E5]" />}
                rightIcon={<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                className="bg-white text-[#111827] border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#C7D2FE] shadow-xs group-hover:shadow-md transition-all cursor-pointer"
              >
                Create Your Portfolio
              </Button>
            </div>
          </TiltCardWrapper>
        </div>
      </Container>
    </section>
  )
}

export default BuilderShowcase
