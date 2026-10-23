import React, { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'motion/react'
import {
  LayoutTemplate,
  Eye,
  Edit3,
  FileDown,
  Share2,
  Smartphone,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  Layers,
} from 'lucide-react'
import { cn } from '../../lib/utils.ts'
import { useReducedMotion } from '../../hooks/useReducedMotion.ts'

interface FeatureSpec {
  id: string
  title: string
  category: string
  description: string
  icon: React.ReactNode
  status: 'Ready' | 'Implemented'
  highlights: string[]
}

const PR_FEATURES: FeatureSpec[] = [
  {
    id: 'templates',
    title: 'Professional Templates',
    category: 'ATS Engine',
    description:
      'Curated ATS resume designs and modern portfolio themes built to capture recruiter attention with clean typography.',
    icon: <LayoutTemplate className="w-5 h-5 text-[#2563EB]" />,
    status: 'Ready',
    highlights: ['4 ATS resume layouts', '4 portfolio themes', 'Clean visual hierarchy'],
  },
  {
    id: 'preview',
    title: 'Real-Time Preview',
    category: 'Live Sync',
    description:
      'Instant side-by-side preview that renders updates synchronously as you edit your projects, bio, or skills.',
    icon: <Eye className="w-5 h-5 text-[#2563EB]" />,
    status: 'Ready',
    highlights: ['Split-screen workspace', 'Responsive view modes', 'Zero layout stutter'],
  },
  {
    id: 'editing',
    title: 'Easy Editing',
    category: 'Persistence',
    description:
      'Frictionless structured inputs for work history, education, skills, and projects with automatic browser draft persistence.',
    icon: <Edit3 className="w-5 h-5 text-[#2563EB]" />,
    status: 'Ready',
    highlights: ['Modular form sections', 'Instant draft autosave', 'One-click reset & sample fill'],
  },
  {
    id: 'pdf-export',
    title: 'Resume PDF Export',
    category: 'Vector Print',
    description:
      'High-resolution, ATS-compliant PDF printing with dedicated print stylesheets ensuring clean single-page formatting.',
    icon: <FileDown className="w-5 h-5 text-[#2563EB]" />,
    status: 'Ready',
    highlights: ['Standard A4 page rules', 'Vector-sharp typography', 'ATS scanner verified'],
  },
  {
    id: 'sharing',
    title: 'Portfolio Sharing',
    category: 'Public Link',
    description:
      'Share your finished portfolio with customized public handles, link copies, and scannable QR cards for networking.',
    icon: <Share2 className="w-5 h-5 text-[#2563EB]" />,
    status: 'Ready',
    highlights: ['Custom public handle', 'Scannable QR profile', 'Direct clipboard link copy'],
  },
  {
    id: 'responsive',
    title: 'Mobile-Friendly Layouts',
    category: 'Adaptive Grid',
    description:
      'Engineered for all screen sizes with touch-optimized controls, collapsible sidebars, and adaptive responsive grids.',
    icon: <Smartphone className="w-5 h-5 text-[#2563EB]" />,
    status: 'Ready',
    highlights: ['Phone (375px+)', 'Tablet (768px+)', 'Desktop (1440px+)'],
  },
]

export const Features: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const shouldReduceMotion = useReducedMotion()

  const [maxScroll, setMaxScroll] = useState(0)
  const [activeCard, setActiveCard] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  // Scroll Progress linked to containerRef: 0 when top enters sticky, 1 when bottom reached
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Measure track scrollable distance
  const calculateScrollRange = useCallback(() => {
    if (trackRef.current) {
      const trackWidth = trackRef.current.scrollWidth
      const viewportWidth = window.innerWidth
      // End padding leaves comfortable buffer so the final card is centered or well-margined
      const endPadding = Math.max(32, (viewportWidth - 380) / 2)
      const range = Math.max(0, trackWidth - viewportWidth + endPadding)
      setMaxScroll(range)
    }
  }, [])

  useEffect(() => {
    calculateScrollRange()
    const timer = setTimeout(calculateScrollRange, 150)
    window.addEventListener('resize', calculateScrollRange)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', calculateScrollRange)
    }
  }, [calculateScrollRange])

  // Map scroll progress to horizontal translation
  const rawX = useTransform(scrollYProgress, [0, 1], [0, -maxScroll])
  const smoothX = useSpring(rawX, {
    damping: 24,
    stiffness: 190,
    mass: 0.12,
  })

  const displayX = shouldReduceMotion ? rawX : smoothX

  // Track active index & completion based on scroll progress
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (progress) => {
      const total = PR_FEATURES.length
      const calculatedIndex = Math.min(total - 1, Math.max(0, Math.floor(progress * total)))
      setActiveCard(calculatedIndex)
      setIsCompleted(progress >= 0.92)
    })
    return () => unsubscribe()
  }, [scrollYProgress])

  // Programmatic jump to specific card by smoothly adjusting page scroll
  const scrollToCard = (index: number) => {
    if (!containerRef.current) return
    const clampedIndex = Math.max(0, Math.min(PR_FEATURES.length - 1, index))
    const rect = containerRef.current.getBoundingClientRect()
    const sectionTop = window.scrollY + rect.top
    const scrollableDistance = containerRef.current.offsetHeight - window.innerHeight
    const targetProgress = clampedIndex / (PR_FEATURES.length - 1)

    window.scrollTo({
      top: sectionTop + targetProgress * scrollableDistance,
      behavior: 'smooth',
    })
  }

  return (
    <section
      id="features"
      ref={containerRef}
      className="relative bg-gradient-to-b from-[#F7F9FC] via-[#F1F5F9]/60 to-[#F7F9FC] scroll-mt-20"
      style={{ height: shouldReduceMotion ? 'auto' : '320vh' }}
    >
      {/* Sticky Viewport Container */}
      <div className={cn(
        "w-full overflow-hidden flex flex-col justify-between",
        shouldReduceMotion
          ? "py-16 sm:py-24"
          : "sticky top-0 h-screen py-6 sm:py-8 lg:py-10"
      )}>
        {/* Top Header & Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full shrink-0">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-slate-200/80 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-mono text-[#2563EB] mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Core Capabilities</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight font-sans">
                Engineered for Precision & Recruiter Impact
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-[#64748B] max-w-2xl leading-relaxed">
                Every feature in PR Builder is built to solve the real friction students and professionals face when presenting their work.
              </p>
            </div>

            {/* Slide Navigation & Progress Controls */}
            <div className="flex items-center gap-3 shrink-0 self-start md:self-end">
              {/* Progress Pill */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="font-mono text-xs font-bold text-[#2563EB]">
                  {String(activeCard + 1).padStart(2, '0')}
                </span>
                <span className="text-slate-300 font-mono text-xs">/</span>
                <span className="font-mono text-xs text-slate-500">
                  {String(PR_FEATURES.length).padStart(2, '0')}
                </span>
              </div>

              {/* Prev / Next Chevrons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollToCard(activeCard - 1)}
                  disabled={activeCard === 0}
                  aria-label="Previous feature card"
                  className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs flex items-center justify-center active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToCard(activeCard + 1)}
                  disabled={activeCard === PR_FEATURES.length - 1}
                  aria-label="Next feature card"
                  className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs flex items-center justify-center active:scale-95"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Track of Compact Cards */}
        <div className="w-full relative my-auto py-3">
          <motion.div
            ref={trackRef}
            style={shouldReduceMotion ? undefined : { x: displayX }}
            className={cn(
              "flex gap-5 sm:gap-6 items-stretch px-4 sm:px-8 lg:px-12 w-max select-none",
              shouldReduceMotion && "flex-wrap justify-center max-w-7xl mx-auto"
            )}
          >
            {PR_FEATURES.map((feature, idx) => {
              const isCurrent = activeCard === idx
              return (
                <div
                  key={feature.id}
                  onClick={() => scrollToCard(idx)}
                  className={cn(
                    "w-[290px] sm:w-[340px] md:w-[370px] h-[375px] sm:h-[395px] shrink-0 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 cursor-pointer relative group",
                    "bg-white border shadow-xs hover:shadow-xl",
                    isCurrent
                      ? "border-[#2563EB] ring-4 ring-[#2563EB]/10 shadow-lg shadow-blue-500/10 -translate-y-1"
                      : "border-slate-200 hover:border-blue-300 hover:-translate-y-0.5"
                  )}
                >
                  {/* Top Row: Index Badge & Status */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                          {String(idx + 1).padStart(2, '0')} / {String(PR_FEATURES.length).padStart(2, '0')}
                        </span>
                        <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {feature.category}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {feature.status}
                      </span>
                    </div>

                    {/* Icon & Title */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                        {feature.icon}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-[#111827] font-sans group-hover:text-[#2563EB] transition-colors leading-snug">
                        {feature.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed line-clamp-3">
                      {feature.description}
                    </p>
                  </div>

                  {/* Highlights Bullet List */}
                  <div className="mt-4 pt-4 border-t border-slate-150 space-y-2 bg-slate-50/70 -mx-6 sm:-mx-7 -mb-6 sm:-mb-7 p-4 sm:p-5 rounded-b-2xl">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-[#2563EB]" />
                      <span>Specifications</span>
                    </div>
                    {feature.highlights.map((hl) => (
                      <div key={hl} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                        <span className="truncate">{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </motion.div>
        </div>

        {/* Bottom Interactive Indicators & Scroll Hint */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full shrink-0">
          <div className="flex items-center justify-between pt-4 border-t border-slate-200/80">
            {/* Interactive Dot Matrix */}
            <div className="flex items-center gap-2">
              {PR_FEATURES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToCard(i)}
                  aria-label={`Jump to feature ${i + 1}`}
                  className={cn(
                    "transition-all duration-300 rounded-full cursor-pointer",
                    activeCard === i
                      ? "w-7 h-2 bg-[#2563EB]"
                      : "w-2 h-2 bg-slate-300 hover:bg-slate-400"
                  )}
                />
              ))}
            </div>

            {/* Real-time Scroll Status Message */}
            <div className="flex items-center gap-2 text-xs font-medium">
              {isCompleted ? (
                <span className="text-[#2563EB] flex items-center gap-1.5 font-semibold animate-pulse">
                  <span>All cards viewed • Continue scrolling</span>
                  <ArrowDown className="w-3.5 h-3.5" />
                </span>
              ) : (
                <span className="text-slate-500 flex items-center gap-1.5">
                  <span>Scroll down to slide cards</span>
                  <span className="text-[#2563EB] font-bold">→</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features

