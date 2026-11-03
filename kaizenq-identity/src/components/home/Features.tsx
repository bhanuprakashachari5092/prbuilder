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
  Copy,
  Check,
  Download,
  Laptop,
  Tablet,
  Zap,
  ShieldCheck,
  Cloud,
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
  theme: {
    gradient: string
    badgeBg: string
    badgeText: string
    badgeBorder: string
    glowColor: string
    accentColor: string
  }
}

const PR_FEATURES: FeatureSpec[] = [
  {
    id: 'templates',
    title: 'Professional Templates',
    category: 'ATS Engine',
    description:
      'Curated ATS resume designs and modern portfolio themes built to capture recruiter attention with clean typography.',
    icon: <LayoutTemplate className="w-5 h-5 text-white" />,
    status: 'Ready',
    highlights: ['4 ATS resume layouts', '4 portfolio themes', 'Clean visual hierarchy'],
    theme: {
      gradient: 'from-blue-600 to-indigo-600',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      badgeBorder: 'border-blue-200',
      glowColor: 'rgba(37, 99, 235, 0.15)',
      accentColor: '#2563EB',
    },
  },
  {
    id: 'preview',
    title: 'Real-Time Preview',
    category: 'Live Sync',
    description:
      'Instant side-by-side preview that renders updates synchronously as you edit your projects, bio, or skills.',
    icon: <Eye className="w-5 h-5 text-white" />,
    status: 'Ready',
    highlights: ['Split-screen workspace', 'Responsive view modes', 'Zero layout stutter'],
    theme: {
      gradient: 'from-violet-600 to-purple-600',
      badgeBg: 'bg-violet-50',
      badgeText: 'text-violet-700',
      badgeBorder: 'border-violet-200',
      glowColor: 'rgba(139, 92, 246, 0.15)',
      accentColor: '#7C3AED',
    },
  },
  {
    id: 'editing',
    title: 'Easy Editing',
    category: 'Persistence',
    description:
      'Frictionless structured inputs for work history, education, skills, and projects with automatic browser draft persistence.',
    icon: <Edit3 className="w-5 h-5 text-white" />,
    status: 'Ready',
    highlights: ['Modular form sections', 'Instant draft autosave', 'One-click reset & sample fill'],
    theme: {
      gradient: 'from-emerald-600 to-teal-600',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      badgeBorder: 'border-emerald-200',
      glowColor: 'rgba(16, 185, 129, 0.15)',
      accentColor: '#059669',
    },
  },
  {
    id: 'pdf-export',
    title: 'Resume PDF Export',
    category: 'Vector Print',
    description:
      'High-resolution, ATS-compliant PDF printing with dedicated print stylesheets ensuring clean single-page formatting.',
    icon: <FileDown className="w-5 h-5 text-white" />,
    status: 'Ready',
    highlights: ['Standard A4 page rules', 'Vector-sharp typography', 'ATS scanner verified'],
    theme: {
      gradient: 'from-amber-500 to-rose-600',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-200',
      glowColor: 'rgba(245, 158, 11, 0.15)',
      accentColor: '#D97706',
    },
  },
  {
    id: 'sharing',
    title: 'Portfolio Sharing',
    category: 'Public Link',
    description:
      'Share your finished portfolio with customized public handles, link copies, and scannable QR cards for networking.',
    icon: <Share2 className="w-5 h-5 text-white" />,
    status: 'Ready',
    highlights: ['Custom public handle', 'Scannable QR profile', 'Direct clipboard link copy'],
    theme: {
      gradient: 'from-fuchsia-600 to-pink-600',
      badgeBg: 'bg-pink-50',
      badgeText: 'text-pink-700',
      badgeBorder: 'border-pink-200',
      glowColor: 'rgba(236, 72, 153, 0.15)',
      accentColor: '#DB2777',
    },
  },
  {
    id: 'responsive',
    title: 'Mobile-Friendly Layouts',
    category: 'Adaptive Grid',
    description:
      'Engineered for all screen sizes with touch-optimized controls, collapsible sidebars, and adaptive responsive grids.',
    icon: <Smartphone className="w-5 h-5 text-white" />,
    status: 'Ready',
    highlights: ['Phone (375px+)', 'Tablet (768px+)', 'Desktop (1440px+)'],
    theme: {
      gradient: 'from-cyan-600 to-blue-600',
      badgeBg: 'bg-cyan-50',
      badgeText: 'text-cyan-700',
      badgeBorder: 'border-cyan-200',
      glowColor: 'rgba(6, 182, 212, 0.15)',
      accentColor: '#0891B2',
    },
  },
]

// Interactive Micro-Widget 1: Templates Layout Preview
const TemplatesWidget: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ats' | 'modern'>('ats')
  return (
    <div className="rounded-xl bg-slate-900 text-white p-3 space-y-2 border border-slate-800 shadow-inner">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-400">Layout Engine</span>
        <div className="flex bg-slate-800/90 rounded-lg p-0.5 border border-slate-700">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setActiveTab('ats') }}
            className={cn(
              "text-[10px] px-2 py-0.5 rounded font-mono transition-all",
              activeTab === 'ats' ? "bg-blue-600 text-white shadow-xs font-bold" : "text-slate-400 hover:text-white"
            )}
          >
            ATS Classic
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setActiveTab('modern') }}
            className={cn(
              "text-[10px] px-2 py-0.5 rounded font-mono transition-all",
              activeTab === 'modern' ? "bg-indigo-600 text-white shadow-xs font-bold" : "text-slate-400 hover:text-white"
            )}
          >
            Modern Tech
          </button>
        </div>
      </div>
      <div className="h-16 rounded-lg bg-slate-950 p-2 border border-slate-800/80 flex flex-col justify-between">
        {activeTab === 'ats' ? (
          <div className="space-y-1.5">
            <div className="h-2 w-28 bg-blue-400/80 rounded-sm" />
            <div className="h-1.5 w-44 bg-slate-600 rounded-sm" />
            <div className="grid grid-cols-3 gap-1 pt-0.5">
              <div className="h-4 bg-slate-800/90 rounded border border-blue-500/20 flex items-center px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1" />
                <div className="h-1 w-6 bg-slate-500 rounded" />
              </div>
              <div className="h-4 bg-slate-800/90 rounded border border-blue-500/20 flex items-center px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1" />
                <div className="h-1 w-6 bg-slate-500 rounded" />
              </div>
              <div className="h-4 bg-slate-800/90 rounded border border-blue-500/20 flex items-center px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1" />
                <div className="h-1 w-6 bg-slate-500 rounded" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 h-full items-center">
            <div className="w-10 h-full rounded bg-indigo-950/80 border border-indigo-500/30 flex flex-col items-center justify-center p-1">
              <div className="w-5 h-5 rounded-full bg-indigo-500/40 border border-indigo-400 mb-1" />
              <div className="h-1 w-6 bg-indigo-300 rounded" />
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="h-2 w-32 bg-indigo-400 rounded-sm" />
              <div className="h-1.5 w-full bg-slate-700 rounded-sm" />
              <div className="h-1.5 w-24 bg-slate-700 rounded-sm" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Interactive Micro-Widget 2: Live Split Sync Preview
const PreviewWidget: React.FC = () => {
  const [role, setRole] = useState<'Lead Dev' | 'AI Architect'>('Lead Dev')
  return (
    <div className="rounded-xl bg-slate-900 text-white p-3 space-y-2 border border-slate-800 shadow-inner">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-400">Live Engine</span>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-violet-300 bg-violet-950/80 px-2 py-0.5 rounded border border-violet-800">
          <Zap className="w-2.5 h-2.5 text-violet-400 animate-pulse" />
          <span>0ms Sync</span>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 h-16">
        <div className="rounded-lg bg-slate-950 p-2 border border-slate-800 flex flex-col justify-between">
          <div className="text-[9px] font-mono text-slate-400">Form Input:</div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setRole(r => r === 'Lead Dev' ? 'AI Architect' : 'Lead Dev') }}
            className="text-[11px] font-bold text-violet-300 bg-violet-900/40 hover:bg-violet-900/60 border border-violet-700/50 rounded px-1.5 py-0.5 text-left truncate flex items-center justify-between"
          >
            <span>{role}</span>
            <span className="text-violet-400 font-mono text-[9px] ml-1">click ↻</span>
          </button>
        </div>
        <div className="rounded-lg bg-slate-950 p-2 border border-violet-500/40 flex flex-col justify-between shadow-xs shadow-violet-500/20">
          <div className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Reactive View:</span>
          </div>
          <div className="text-[11px] font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 truncate">
            {role}
          </div>
        </div>
      </div>
    </div>
  )
}

// Interactive Micro-Widget 3: Draft Autosave Persistence
const EditingWidget: React.FC = () => {
  const [sections, setSections] = useState({ bio: true, exp: true, skills: true })
  return (
    <div className="rounded-xl bg-slate-900 text-white p-3 space-y-2 border border-slate-800 shadow-inner">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-400">Autosave Engine</span>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
          <Cloud className="w-2.5 h-2.5 text-emerald-400" />
          <span>Local Draft Saved</span>
        </span>
      </div>
      <div className="h-16 rounded-lg bg-slate-950 p-2 border border-slate-800 flex items-center justify-between gap-1.5">
        {(['bio', 'exp', 'skills'] as const).map((key) => {
          const names = { bio: 'Bio Profile', exp: 'Experience', skills: 'Skill Matrix' }
          const active = sections[key]
          return (
            <button
              key={key}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setSections(prev => ({ ...prev, [key]: !prev[key] }))
              }}
              className={cn(
                "flex-1 h-full rounded border flex flex-col items-center justify-center p-1 transition-all",
                active
                  ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                  : "bg-slate-900 border-slate-800 text-slate-500"
              )}
            >
              <div className="flex items-center gap-1 text-[10px] font-bold">
                <Check className="w-2.5 h-2.5" />
                <span>{key.toUpperCase()}</span>
              </div>
              <span className="text-[8px] font-mono opacity-80 truncate">{names[key]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Interactive Micro-Widget 4: Vector ATS PDF Compliance
const PdfWidget: React.FC = () => {
  const [downloaded, setDownloaded] = useState(false)
  return (
    <div className="rounded-xl bg-slate-900 text-white p-3 space-y-2 border border-slate-800 shadow-inner">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-400">ATS Print Engine</span>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
          <ShieldCheck className="w-2.5 h-2.5 text-amber-400" />
          <span>98% ATS Pass</span>
        </span>
      </div>
      <div className="h-16 rounded-lg bg-slate-950 p-2 border border-slate-800 flex items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-amber-200">Vector A4 Sheet</div>
          <div className="text-[9px] font-mono text-slate-400">300 DPI • ATS Ready</div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setDownloaded(true)
            setTimeout(() => setDownloaded(false), 2000)
          }}
          className={cn(
            "px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95",
            downloaded
              ? "bg-emerald-600 text-white"
              : "bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white"
          )}
        >
          {downloaded ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Exported!</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Mock PDF</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// Interactive Micro-Widget 5: Live Share Handle & QR
const SharingWidget: React.FC = () => {
  const [copied, setCopied] = useState(false)
  return (
    <div className="rounded-xl bg-slate-900 text-white p-3 space-y-2 border border-slate-800 shadow-inner">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-400">Public Identity</span>
        <span className="text-[10px] font-mono text-pink-300 bg-pink-950/80 px-2 py-0.5 rounded border border-pink-800">
          Instant Live
        </span>
      </div>
      <div className="h-16 rounded-lg bg-slate-950 p-2 border border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          {/* Mini QR icon pattern */}
          <div className="w-10 h-10 rounded bg-white p-1 shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-xs flex flex-wrap p-0.5 gap-0.5">
              <div className="w-2 h-2 bg-pink-500" />
              <div className="w-1 h-1 bg-slate-900" />
              <div className="w-2 h-2 bg-pink-500" />
              <div className="w-1 h-1 bg-slate-900" />
              <div className="w-2 h-2 bg-pink-500" />
            </div>
          </div>
          <div className="truncate">
            <div className="text-[10px] font-mono text-slate-400">Public Link</div>
            <div className="text-xs font-mono font-bold text-pink-300 truncate">prbuilder.me/bhanu</div>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
          className="px-2 py-1.5 rounded-lg text-xs font-mono bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-1 transition-all active:scale-95 shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
    </div>
  )
}

// Interactive Micro-Widget 6: Responsive Device Wireframe
const ResponsiveWidget: React.FC = () => {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile')
  return (
    <div className="rounded-xl bg-slate-900 text-white p-3 space-y-2 border border-slate-800 shadow-inner">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-400">Viewport Simulator</span>
        <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setDevice('mobile') }}
            className={cn("p-1 rounded", device === 'mobile' ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white")}
          >
            <Smartphone className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setDevice('tablet') }}
            className={cn("p-1 rounded", device === 'tablet' ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white")}
          >
            <Tablet className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setDevice('desktop') }}
            className={cn("p-1 rounded", device === 'desktop' ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white")}
          >
            <Laptop className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="h-16 rounded-lg bg-slate-950 p-2 border border-slate-800 flex items-center justify-center">
        <div
          className={cn(
            "h-10 rounded border border-cyan-500/40 bg-slate-900 transition-all duration-300 flex items-center px-1.5 justify-between gap-1",
            device === 'mobile' && "w-20",
            device === 'tablet' && "w-36",
            device === 'desktop' && "w-52"
          )}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
          <div className="h-1 flex-1 bg-cyan-500/40 rounded-full" />
          <span className="text-[8px] font-mono text-cyan-300 shrink-0">
            {device === 'mobile' ? '375px' : device === 'tablet' ? '768px' : '1440px'}
          </span>
        </div>
      </div>
    </div>
  )
}

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
      const endPadding = Math.max(32, (viewportWidth - 400) / 2)
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

  // Programmatic jump to specific card
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

  // Render appropriate interactive widget based on feature ID
  const renderWidget = (id: string) => {
    switch (id) {
      case 'templates':
        return <TemplatesWidget />
      case 'preview':
        return <PreviewWidget />
      case 'editing':
        return <EditingWidget />
      case 'pdf-export':
        return <PdfWidget />
      case 'sharing':
        return <SharingWidget />
      case 'responsive':
        return <ResponsiveWidget />
      default:
        return null
    }
  }

  return (
    <section
      id="features"
      ref={containerRef}
      className="relative bg-gradient-to-b from-[#F7F9FC] via-[#F1F5F9]/70 to-[#F7F9FC] scroll-mt-20"
      style={{ height: shouldReduceMotion ? 'auto' : '320vh' }}
    >
      {/* Sticky Viewport Container */}
      <div className={cn(
        "w-full overflow-hidden flex flex-col justify-between",
        shouldReduceMotion
          ? "py-16 sm:py-24"
          : "sticky top-0 h-screen py-5 sm:py-7 lg:py-8"
      )}>
        {/* Top Header & Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full shrink-0">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-mono text-[#2563EB] mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Core Capabilities</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight font-sans">
                Engineered for Precision & Recruiter Impact
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#64748B] max-w-2xl leading-relaxed">
                Every feature in PR Builder is built to solve the real friction students and professionals face when presenting their work.
              </p>
            </div>

            {/* Slide Navigation & Progress Controls */}
            <div className="flex items-center gap-3 shrink-0 self-start md:self-end">
              {/* Progress Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-xs">
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
                  className="w-9 h-9 rounded-xl border border-slate-200 bg-white/90 backdrop-blur-md hover:bg-slate-50 hover:border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs flex items-center justify-center active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToCard(activeCard + 1)}
                  disabled={activeCard === PR_FEATURES.length - 1}
                  aria-label="Next feature card"
                  className="w-9 h-9 rounded-xl border border-slate-200 bg-white/90 backdrop-blur-md hover:bg-slate-50 hover:border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs flex items-center justify-center active:scale-95"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Track of Ultra-Attractive Cards */}
        <div className="w-full relative my-auto py-2">
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
                    "w-[300px] sm:w-[350px] md:w-[380px] h-[450px] sm:h-[470px] shrink-0 rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 cursor-pointer relative group overflow-hidden",
                    "bg-white/95 backdrop-blur-xl border",
                    isCurrent
                      ? "border-blue-400 ring-4 ring-blue-500/15 shadow-xl shadow-blue-500/10 -translate-y-1.5"
                      : "border-slate-200 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1"
                  )}
                >
                  {/* Subtle Background Glow Aura */}
                  <div
                    className="absolute -top-20 -right-20 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-500"
                    style={{ background: feature.theme.accentColor }}
                  />

                  {/* Watermark Index */}
                  <div className="absolute right-4 top-2 text-6xl font-black font-mono text-slate-100 select-none pointer-events-none opacity-60">
                    {String(idx + 1).padStart(2, '0')}
                  </div>

                  {/* Top Header Row */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                          {String(idx + 1).padStart(2, '0')} / {String(PR_FEATURES.length).padStart(2, '0')}
                        </span>
                        <span className={cn("text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border", feature.theme.badgeBg, feature.theme.badgeText, feature.theme.badgeBorder)}>
                          {feature.category}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {feature.status}
                      </span>
                    </div>

                    {/* Icon & Title */}
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-2 bg-gradient-to-br",
                        feature.theme.gradient
                      )}>
                        {feature.icon}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-[#111827] font-sans group-hover:text-[#2563EB] transition-colors leading-snug">
                        {feature.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                      {feature.description}
                    </p>
                  </div>

                  {/* Interactive Micro-Widget Preview */}
                  <div className="relative z-10 my-2">
                    {renderWidget(feature.id)}
                  </div>

                  {/* Highlights Bullet List */}
                  <div className="relative z-10 pt-3 border-t border-slate-150 space-y-1.5 bg-slate-50/80 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 p-3.5 sm:p-4 rounded-b-3xl">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1 flex items-center gap-1">
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
          <div className="flex items-center justify-between pt-3 border-t border-slate-200/80">
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
                      ? "w-8 h-2 bg-[#2563EB]"
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

