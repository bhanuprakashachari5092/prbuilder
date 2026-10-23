import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import {
  Sparkles,
  Shuffle,
  Play,
  Pause,
  Layers,
  LayoutGrid,
  UserCheck,
  Sliders,
  Share2,
  CheckCircle2,
  ArrowRight,
  Download,
  Copy,
  Check,
  Zap,
  Globe,
  QrCode,
  Lock,
  RefreshCw,
  Palette,
  Eye,
  FileText,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
} from 'lucide-react'
import { Container } from '../ui/Container.tsx'
import { Button } from '../ui/Button.tsx'
import { cn, copyToClipboard } from '../../lib/utils.ts'
import { useApp } from '../../app/providers/AppContext.ts'

export interface StepItem {
  id: string
  number: string
  category: string
  shortTitle: string
  title: string
  description: string
  detail: string
  accentColor: string
  accentBg: string
  accentBorder: string
  accentGlow: string
  tagline: string
  targetRoute: 'resume' | 'portfolio'
  icon: React.ReactNode
}

export const WORKFLOW_STEPS: StepItem[] = [
  {
    id: 'step-01',
    number: '01',
    category: 'Ingestion Engine',
    shortTitle: 'Add Data & Projects',
    title: 'Add your information and projects.',
    description:
      'Enter your background, work experience, education, key technical skills, and featured repositories into structured, intuitive input fields.',
    detail: 'Automatic draft persistence saves progress locally as you type.',
    accentColor: '#2563EB',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-blue-200',
    accentGlow: 'rgba(37, 99, 235, 0.18)',
    tagline: 'Instant Local Draft Persistence',
    targetRoute: 'resume',
    icon: <UserCheck className="w-5 h-5 text-[#2563EB]" />,
  },
  {
    id: 'step-02',
    number: '02',
    category: 'Design & ATS Engine',
    shortTitle: 'Customize Layouts',
    title: 'Customize your resume or portfolio.',
    description:
      'Select from curated ATS-optimized layouts and responsive portfolio themes to match your unique professional identity and aesthetic preferences.',
    detail: 'Instant reactive previews ensure typography and spacing are flawless.',
    accentColor: '#6366F1',
    accentBg: 'bg-indigo-50',
    accentBorder: 'border-indigo-200',
    accentGlow: 'rgba(99, 102, 241, 0.18)',
    tagline: 'Reactive Multi-Theme Typography',
    targetRoute: 'portfolio',
    icon: <Sliders className="w-5 h-5 text-[#6366F1]" />,
  },
  {
    id: 'step-03',
    number: '03',
    category: 'Export & Distribution',
    shortTitle: 'Preview, Export & Share',
    title: 'Preview, export or share using available features.',
    description:
      'Download a vector-crisp, ATS-compliant PDF resume or publish and distribute your live portfolio link and scannable QR card directly to recruiters.',
    detail: 'One-click export ready for job applications and portfolio reviews.',
    accentColor: '#10B981',
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-emerald-200',
    accentGlow: 'rgba(16, 185, 129, 0.18)',
    tagline: 'Vector PDF, Free Subdomain & QR Card',
    targetRoute: 'resume',
    icon: <Share2 className="w-5 h-5 text-[#10B981]" />,
  },
]

export interface HowItWorksProps {
  onOpenBuilder?: () => void
  onOpenAuth?: (mode?: 'signin' | 'signup') => void
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onOpenBuilder, onOpenAuth }) => {
  const { setCurrentRoute } = useApp()
  const prefersReduced = useReducedMotion()

  // State: order array represents stack from front (order[0]) to back (order[2])
  const [order, setOrder] = useState<number[]>([0, 1, 2])
  const [isShuffling, setIsShuffling] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<'deck' | 'spread'>('deck')
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true)
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)

  // Sub-simulators interactive states
  // Step 01 simulator
  const [savedPulse, setSavedPulse] = useState<boolean>(false)
  const [activeSkills, setActiveSkills] = useState<string[]>([
    'React 19',
    'TypeScript',
    'Node.js',
    'Supabase',
    'PostgreSQL',
  ])
  const [highlightAts, setHighlightAts] = useState<boolean>(true)

  // Step 02 simulator
  const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'classic' | 'minimal'>('modern')
  const [accentPalette, setAccentPalette] = useState<'blue' | 'emerald' | 'purple' | 'amber'>('blue')

  // Step 03 simulator
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false)
  const [pdfReady, setPdfReady] = useState<boolean>(true)
  const [copiedLink, setCopiedLink] = useState<boolean>(false)
  const [qrScans, setQrScans] = useState<number>(48)

  const activeIndex = order[0]
  const currentStep = WORKFLOW_STEPS[activeIndex]

  // Shuffle Action: moves front card to back
  const handleShuffleNext = useCallback(() => {
    if (isShuffling) return
    setIsShuffling(true)
    setProgress(0)

    setTimeout(() => {
      setOrder((prev) => [prev[1], prev[2], prev[0]])
      setIsShuffling(false)
    }, 280)
  }, [isShuffling])

  // Bring a specific step directly to the front
  const handleSelectStep = (targetStepIndex: number) => {
    if (order[0] === targetStepIndex) return
    setIsShuffling(true)
    setProgress(0)

    setTimeout(() => {
      setOrder((prev) => {
        const withoutTarget = prev.filter((idx) => idx !== targetStepIndex)
        return [targetStepIndex, ...withoutTarget]
      })
      setIsShuffling(false)
    }, 220)
  }

  // Shuffle Previous Step
  const handleShufflePrev = () => {
    if (isShuffling) return
    setIsShuffling(true)
    setProgress(0)

    setTimeout(() => {
      setOrder((prev) => [prev[2], prev[0], prev[1]])
      setIsShuffling(false)
    }, 280)
  }

  // Auto-play timer loop (6 seconds per card)
  useEffect(() => {
    if (!isAutoPlaying || isHovered || viewMode === 'spread') return

    const INTERVAL_MS = 6000
    const STEP_MS = 100
    let elapsed = 0

    const timer = setInterval(() => {
      elapsed += STEP_MS
      const pct = Math.min((elapsed / INTERVAL_MS) * 100, 100)
      setProgress(pct)

      if (elapsed >= INTERVAL_MS) {
        elapsed = 0
        handleShuffleNext()
      }
    }, STEP_MS)

    return () => clearInterval(timer)
  }, [isAutoPlaying, isHovered, viewMode, handleShuffleNext])

  // Navigate to builder
  const handleLaunchBuilder = (route: 'resume' | 'portfolio') => {
    if (onOpenBuilder) {
      onOpenBuilder()
    } else {
      setCurrentRoute(route)
    }
  }

  // Copy link handler
  const handleCopyLink = async () => {
    const success = await copyToClipboard('https://alex-rivera.prbuilder.in')
    if (success) {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2400)
    }
  }

  // Test Auto-save pulse
  const triggerAutoSavePulse = () => {
    setSavedPulse(true)
    setTimeout(() => setSavedPulse(false), 1200)
  }

  // Simulate PDF re-generation
  const triggerPdfGenerate = () => {
    setIsGeneratingPdf(true)
    setPdfReady(false)
    setTimeout(() => {
      setIsGeneratingPdf(false)
      setPdfReady(true)
    }, 1200)
  }

  return (
    <section
      id="how-it-works"
      className="py-20 sm:py-28 relative scroll-mt-20 bg-gradient-to-b from-[#F8FAFC] via-white to-[#F8FAFC] border-y border-[#E2E8F0] overflow-hidden"
      aria-label="Workflow: Three Simple Steps to Professional Impact"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#E2E8F0_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[360px] bg-gradient-to-r from-blue-100/40 via-indigo-100/30 to-emerald-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#BFDBFE] text-xs font-mono font-medium text-[#2563EB] shadow-xs mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB] animate-pulse" />
            <span>Workflow</span>
            <span className="w-1 h-1 rounded-full bg-[#2563EB]" />
            <span className="text-[#64748B]">3-Step Pipeline</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111827] tracking-tight font-sans">
            Three Simple Steps to Professional Impact
          </h2>

          <p className="mt-3.5 text-base sm:text-lg text-[#64748B] leading-relaxed max-w-2xl mx-auto">
            From raw project notes to a polished resume and portfolio in minutes.
          </p>

          {/* Interactive Mode & Play Controls Bar */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {/* View Mode Toggle: Deck Shuffle vs Spread Pipeline */}
            <div className="inline-flex items-center p-1 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('deck')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer',
                  viewMode === 'deck'
                    ? 'bg-[#2563EB] text-white shadow-xs font-semibold'
                    : 'text-[#64748B] hover:text-[#111827] hover:bg-[#F1F5F9]'
                )}
                aria-pressed={viewMode === 'deck'}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>3D Deck Shuffle</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('spread')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer',
                  viewMode === 'spread'
                    ? 'bg-[#2563EB] text-white shadow-xs font-semibold'
                    : 'text-[#64748B] hover:text-[#111827] hover:bg-[#F1F5F9]'
                )}
                aria-pressed={viewMode === 'spread'}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Spread All Steps</span>
              </button>
            </div>

            {/* Auto-Shuffle Timer Pill (Only in Deck Mode) */}
            {viewMode === 'deck' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs text-xs">
                <button
                  type="button"
                  onClick={() => setIsAutoPlaying((prev) => !prev)}
                  className="text-[#64748B] hover:text-[#2563EB] transition-colors cursor-pointer"
                  title={isAutoPlaying ? 'Pause Auto-Shuffle' : 'Play Auto-Shuffle'}
                  aria-label={isAutoPlaying ? 'Pause Auto-Shuffle' : 'Play Auto-Shuffle'}
                >
                  {isAutoPlaying ? (
                    <Pause className="w-3.5 h-3.5 text-[#2563EB]" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-[#64748B]" />
                  )}
                </button>

                {/* Progress bar line */}
                <div className="w-16 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2563EB] transition-all duration-100 ease-linear"
                    style={{ width: `${isAutoPlaying && !isHovered ? progress : 0}%` }}
                  />
                </div>

                <span className="font-mono text-[11px] text-[#64748B]">
                  {isHovered && isAutoPlaying ? (
                    <span className="text-[#2563EB] font-medium">Paused</span>
                  ) : isAutoPlaying ? (
                    `0${Math.ceil((100 - progress) / 16.6)}s`
                  ) : (
                    'Paused'
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* =============================================================== */}
        {/* VIEW MODE A: 3D CARD DECK SHUFFLE & LIVE STUDIO FRAME          */}
        {/* =============================================================== */}
        {viewMode === 'deck' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start max-w-6xl mx-auto">
            {/* LEFT COLUMN: 3D Shuffling Deck & Step Selector Pills (~5 cols) */}
            <div className="lg:col-span-5 flex flex-col">
              {/* Step Selector Tab Pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs mb-6">
                {WORKFLOW_STEPS.map((step, idx) => {
                  const isActive = order[0] === idx
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => handleSelectStep(idx)}
                      className={cn(
                        'flex-1 py-2 px-2.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer',
                        isActive
                          ? 'bg-[#111827] text-white shadow-sm font-semibold scale-[1.02]'
                          : 'text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC]'
                      )}
                    >
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full',
                          idx === 0 && 'bg-blue-500',
                          idx === 1 && 'bg-indigo-500',
                          idx === 2 && 'bg-emerald-500'
                        )}
                      />
                      <span className="font-mono">Step {step.number}</span>
                    </button>
                  )
                })}
              </div>

              {/* 3D Isometric Card Deck Stage */}
              <div
                className="relative h-[380px] sm:h-[410px] w-full"
                style={{ perspective: prefersReduced ? 'none' : '1200px' }}
              >
                {/* Render cards based on stack position: 0 (top), 1 (middle), 2 (back) */}
                {order.map((stepIndex, stackPosition) => {
                  const step = WORKFLOW_STEPS[stepIndex]
                  const isTop = stackPosition === 0
                  const isMiddle = stackPosition === 1
                  const isBack = stackPosition === 2

                  // 3D Isometric offsets and tilts
                  let yOffset = isTop ? 0 : isMiddle ? 22 : 44
                  let xOffset = isTop ? 0 : isMiddle ? 12 : 24
                  let rotation = isTop ? 0 : isMiddle ? 3.5 : 7
                  let scale = isTop ? 1 : isMiddle ? 0.95 : 0.90
                  let zIndex = isTop ? 30 : isMiddle ? 20 : 10
                  let opacity = isTop ? 1 : isMiddle ? 0.88 : 0.65

                  // Card being shuffled away animation
                  if (isShuffling && isTop) {
                    yOffset = -85
                    xOffset = -25
                    rotation = -10
                    scale = 1.04
                    zIndex = 40
                  }

                  return (
                    <motion.div
                      key={step.id}
                      layout
                      initial={false}
                      animate={{
                        y: yOffset,
                        x: xOffset,
                        rotateZ: prefersReduced ? 0 : rotation,
                        scale: prefersReduced ? 1 : scale,
                        opacity,
                        zIndex,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 280,
                        damping: 24,
                        mass: 0.15,
                      }}
                      onClick={() => !isTop && handleSelectStep(stepIndex)}
                      className={cn(
                        'absolute inset-x-0 top-0 rounded-2xl p-6 sm:p-7 bg-white border transition-shadow duration-300 flex flex-col justify-between select-none cursor-pointer',
                        isTop
                          ? 'border-[#BFDBFE] shadow-xl ring-1 ring-blue-500/20'
                          : 'border-[#E2E8F0] shadow-md hover:border-slate-300 hover:shadow-lg'
                      )}
                      style={{
                        height: '340px',
                        transformOrigin: 'bottom center',
                      }}
                    >
                      {/* Card Header: Step Pill & Icon */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span
                            className={cn(
                              'text-xs font-mono font-bold px-3 py-1 rounded-lg border',
                              step.accentBg,
                              step.accentBorder
                            )}
                            style={{ color: step.accentColor }}
                          >
                            Step {step.number} • {step.category}
                          </span>

                          <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
                            {step.icon}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-[#111827] font-sans leading-snug">
                          {step.title}
                        </h3>

                        {/* Description */}
                        <p className="mt-3 text-xs sm:text-sm text-[#64748B] leading-relaxed line-clamp-3">
                          {step.description}
                        </p>
                      </div>

                      {/* Card Footer: Detail & Action Prompt */}
                      <div className="pt-4 border-t border-[#F1F5F9]">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-mono text-[#94A3B8] truncate max-w-[220px]">
                            {step.detail}
                          </p>

                          {isTop ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB]">
                              <span>Active</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-600">
                              Tap to open
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Shuffle Controls Bar */}
              <div className="mt-3 flex items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleShufflePrev}
                    disabled={isShuffling}
                    className="h-9 w-9 p-0 rounded-xl border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]"
                    title="Previous Card"
                    aria-label="Previous Card"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#64748B]" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleShuffleNext}
                    disabled={isShuffling}
                    leftIcon={<Shuffle className={cn('w-3.5 h-3.5', isShuffling && 'animate-spin')} />}
                    className="h-9 px-3.5 rounded-xl border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-medium text-[#111827]"
                  >
                    Shuffle Deck
                  </Button>
                </div>

                <span className="text-[11px] font-mono text-[#94A3B8]">
                  Card {activeIndex + 1} of 3
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN: The "Open" Professional Framed Studio Showcase (~7 cols) */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl bg-[#0B0F19] border border-[#1E293B] shadow-2xl overflow-hidden relative">
                {/* Top macOS-style Studio Frame Titlebar */}
                <div className="px-5 py-3.5 bg-[#0F172A] border-b border-[#1E293B] flex items-center justify-between gap-4">
                  {/* Traffic light window controls */}
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#EF4444]/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-[#F59E0B]/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-[#10B981]/80 inline-block" />
                    <span className="ml-2 text-xs font-mono text-[#64748B] hidden sm:inline">
                      PR-Studio // Step {currentStep.number}
                    </span>
                  </div>

                  {/* Mock URL / Route pill */}
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B0F19] border border-[#1E293B] text-[11px] font-mono text-[#94A3B8]">
                    <Lock className="w-3 h-3 text-[#10B981]" />
                    <span>prbuilder.io/workflow/{currentStep.id}</span>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-[11px] font-mono text-[#34D399]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                      <span>Live Sync</span>
                    </span>
                  </div>
                </div>

                {/* Studio Frame Canvas Content */}
                <div className="p-6 sm:p-8 min-h-[360px] flex flex-col justify-between">
                  <AnimatePresence mode="wait">
                    {/* STEP 01 SIMULATOR: Data & Project Ingestion */}
                    {activeIndex === 0 && (
                      <motion.div
                        key="step-01-simulator"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -14 }}
                        transition={{ duration: 0.28 }}
                        className="space-y-5"
                      >
                        {/* Simulation Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1E293B]">
                          <div>
                            <span className="text-xs font-mono text-[#3B82F6] font-semibold">
                              CANDIDATE PROFILE INGESTION
                            </span>
                            <h4 className="text-lg font-bold text-white mt-0.5">
                              Alex Rivera
                            </h4>
                            <p className="text-xs text-[#94A3B8]">
                              Senior Full Stack & Distributed Systems Engineer
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={triggerAutoSavePulse}
                              className={cn(
                                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer',
                                savedPulse
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-[#1E293B] text-[#94A3B8] border-[#334155] hover:text-white'
                              )}
                            >
                              <Zap className={cn('w-3.5 h-3.5', savedPulse ? 'text-emerald-400' : 'text-[#3B82F6]')} />
                              <span>{savedPulse ? 'Saved to Local DB' : 'Auto-Save: Ready'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Experience Ingestion Field Preview */}
                        <div className="p-4 rounded-xl bg-[#0F172A] border border-[#1E293B]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono text-[#94A3B8]">
                              Experience & Impact Ingestion
                            </span>
                            <span className="text-[11px] font-mono text-emerald-400">
                              +34% Metric Impact Detected
                            </span>
                          </div>

                          <div className="p-3 rounded-lg bg-[#0B0F19] border border-[#334155]/60 text-xs text-[#E2E8F0] leading-relaxed font-mono">
                            <span className="text-[#3B82F6]">▸ </span>
                            Architected distributed streaming pipelines using Node.js & Supabase, reducing end-to-end recruiter ingestion latency by{' '}
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              34%
                            </span>{' '}
                            across 12 core microservices.
                          </div>
                        </div>

                        {/* Interactive Skills Chip Matrix */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono text-[#94A3B8]">
                              Parsed Technical Skills (Click to toggle)
                            </span>
                            <button
                              type="button"
                              onClick={() => setHighlightAts((prev) => !prev)}
                              className="text-[11px] font-mono text-[#3B82F6] hover:underline cursor-pointer"
                            >
                              {highlightAts ? '✓ ATS Match: 98%' : 'Show ATS Match'}
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {['React 19', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS ECS'].map((skill) => {
                              const isSelected = activeSkills.includes(skill)
                              return (
                                <button
                                  key={skill}
                                  type="button"
                                  onClick={() => {
                                    setActiveSkills((prev) =>
                                      isSelected ? prev.filter((s) => s !== skill) : [...prev, skill]
                                    )
                                  }}
                                  className={cn(
                                    'px-2.5 py-1 rounded-md text-xs font-mono transition-all border cursor-pointer',
                                    isSelected
                                      ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 font-semibold'
                                      : 'bg-[#1E293B] border-transparent text-[#64748B] hover:text-white'
                                  )}
                                >
                                  {skill}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 02 SIMULATOR: Design & ATS Customization */}
                    {activeIndex === 1 && (
                      <motion.div
                        key="step-02-simulator"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -14 }}
                        transition={{ duration: 0.28 }}
                        className="space-y-5"
                      >
                        {/* Simulation Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1E293B]">
                          <div>
                            <span className="text-xs font-mono text-[#818CF8] font-semibold">
                              TEMPLATE & STYLING ENGINE
                            </span>
                            <h4 className="text-lg font-bold text-white mt-0.5">
                              Dual Resume & Portfolio Themer
                            </h4>
                            <p className="text-xs text-[#94A3B8]">
                              Curated ATS parsable typography and reactive CSS variables
                            </p>
                          </div>

                          {/* Accent Color Picker Swatches */}
                          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#0F172A] border border-[#1E293B]">
                            {(['blue', 'emerald', 'purple', 'amber'] as const).map((col) => (
                              <button
                                key={col}
                                type="button"
                                onClick={() => setAccentPalette(col)}
                                className={cn(
                                  'w-5 h-5 rounded-full transition-transform cursor-pointer',
                                  col === 'blue' && 'bg-blue-500',
                                  col === 'emerald' && 'bg-emerald-500',
                                  col === 'purple' && 'bg-purple-500',
                                  col === 'amber' && 'bg-amber-500',
                                  accentPalette === col && 'ring-2 ring-white ring-offset-2 ring-offset-[#0F172A] scale-110'
                                )}
                                title={`Accent: ${col}`}
                                aria-label={`Accent: ${col}`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Interactive Template Switcher Pills */}
                        <div className="grid grid-cols-3 gap-2.5">
                          {[
                            { id: 'modern', name: 'Modern ATS', tag: 'High Scannability' },
                            { id: 'classic', name: 'Classic Serif', tag: 'Corporate Authority' },
                            { id: 'minimal', name: 'Developer Dark', tag: 'Terminal Modern' },
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setSelectedTemplate(t.id as any)}
                              className={cn(
                                'p-3 rounded-xl border text-left transition-all cursor-pointer',
                                selectedTemplate === t.id
                                  ? 'bg-[#1E1B4B] border-[#6366F1] text-white shadow-sm'
                                  : 'bg-[#0F172A] border-[#1E293B] text-[#94A3B8] hover:border-[#334155]'
                              )}
                            >
                              <span className="text-xs font-semibold block text-white">
                                {t.name}
                              </span>
                              <span className="text-[10px] font-mono text-[#818CF8] mt-0.5 block">
                                {t.tag}
                              </span>
                            </button>
                          ))}
                        </div>

                        {/* Mini Live Preview Window */}
                        <div className="p-4 rounded-xl bg-[#0F172A] border border-[#1E293B]">
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-xs font-mono text-[#94A3B8]">
                              Live Layout Preview // {selectedTemplate.toUpperCase()}
                            </span>
                            <span className="text-[11px] font-mono text-[#818CF8]">
                              A4 Spacing: Perfectly Balanced
                            </span>
                          </div>

                          <div className="p-3.5 rounded-lg bg-[#0B0F19] border border-[#334155]/60 flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="h-2.5 w-36 bg-white/80 rounded" />
                              <div className="h-2 w-48 bg-[#64748B]/60 rounded" />
                              <div className="h-1.5 w-28 bg-[#334155] rounded mt-2" />
                            </div>

                            <div className="text-right">
                              <span className="text-xs font-mono font-bold text-emerald-400 block">
                                98 / 100
                              </span>
                              <span className="text-[10px] font-mono text-[#64748B]">
                                ATS Parsability Score
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 03 SIMULATOR: Multi-Channel Export & Recruiter Sharing */}
                    {activeIndex === 2 && (
                      <motion.div
                        key="step-03-simulator"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -14 }}
                        transition={{ duration: 0.28 }}
                        className="space-y-5"
                      >
                        {/* Simulation Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1E293B]">
                          <div>
                            <span className="text-xs font-mono text-[#34D399] font-semibold">
                              MULTI-CHANNEL RECRUITER IMPACT
                            </span>
                            <h4 className="text-lg font-bold text-white mt-0.5">
                              Export, Deploy & Recruiter Scans
                            </h4>
                            <p className="text-xs text-[#94A3B8]">
                              Vector PDF engine, instant SSL subdomain & scannable QR card
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300">
                              Production Ready
                            </span>
                          </div>
                        </div>

                        {/* Three Distribution Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Channel A: Vector PDF */}
                          <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#1E293B] flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <FileText className="w-4 h-4 text-blue-400" />
                                <span className="text-[10px] font-mono text-[#64748B]">
                                  Vector PDF
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-white block">
                                Alex_Resume.pdf
                              </span>
                              <span className="text-[11px] text-[#94A3B8]">
                                184 KB • 100% Crisp
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={triggerPdfGenerate}
                              disabled={isGeneratingPdf}
                              className="mt-3 w-full py-1.5 rounded-lg bg-[#1E293B] hover:bg-blue-600/30 border border-[#334155] text-[11px] font-mono text-blue-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Download className={cn('w-3 h-3', isGeneratingPdf && 'animate-bounce')} />
                              <span>{isGeneratingPdf ? 'Generating...' : 'Simulate PDF'}</span>
                            </button>
                          </div>

                          {/* Channel B: Platform Subdomain */}
                          <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#1E293B] flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Globe className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] font-mono text-[#64748B]">
                                  Custom Subdomain
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-white block truncate">
                                alex-rivera.prbuilder.in
                              </span>
                              <span className="text-[11px] text-emerald-400 font-mono">
                                ✓ Free Platform SSL
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={handleCopyLink}
                              className="mt-3 w-full py-1.5 rounded-lg bg-[#1E293B] hover:bg-emerald-600/30 border border-[#334155] text-[11px] font-mono text-emerald-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              {copiedLink ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Link</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Channel C: Recruiter QR Card */}
                          <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#1E293B] flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <QrCode className="w-4 h-4 text-purple-400" />
                                <span className="text-[10px] font-mono text-[#64748B]">
                                  QR Card
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-white block">
                                Networking Card
                              </span>
                              <span className="text-[11px] text-purple-300 font-mono">
                                {qrScans} Recruiter Scans
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setQrScans((c) => c + 1)}
                              className="mt-3 w-full py-1.5 rounded-lg bg-[#1E293B] hover:bg-purple-600/30 border border-[#334155] text-[11px] font-mono text-purple-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <span>+ Test Scan</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Studio Frame Bottom Action Bar */}
                  <div className="mt-6 pt-4 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      <span className="text-xs text-[#94A3B8]">
                        Ready to experience this step?
                      </span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleLaunchBuilder(currentStep.targetRoute)}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-md px-4 py-2"
                    >
                      Open in {currentStep.targetRoute === 'resume' ? 'Resume Builder' : 'Portfolio Studio'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* VIEW MODE B: SPREAD PIPELINE GALLERY (All 3 Open Side-by-Side) */}
        {/* =============================================================== */}
        {viewMode === 'spread' && (
          <div className="relative max-w-6xl mx-auto">
            {/* Connecting Datum Line */}
            <div className="hidden lg:block absolute top-1/2 left-16 right-16 h-[2px] bg-gradient-to-r from-blue-300 via-indigo-300 to-emerald-300 -translate-y-12 z-0 opacity-60" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative z-10">
              {WORKFLOW_STEPS.map((step, idx) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.12 }}
                  className="rounded-2xl p-7 bg-white border border-[#E2E8F0] hover:border-[#BFDBFE] transition-all flex flex-col justify-between shadow-sm hover:shadow-xl group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                      <span
                        className={cn(
                          'text-xs font-mono font-bold px-2.5 py-1 rounded-lg border',
                          step.accentBg,
                          step.accentBorder
                        )}
                        style={{ color: step.accentColor }}
                      >
                        Step {step.number} • {step.category}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center group-hover:scale-105 transition-transform">
                        {step.icon}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-[#111827] font-sans group-hover:text-[#2563EB] transition-colors leading-snug">
                      {step.title}
                    </h3>

                    <p className="mt-3 text-xs sm:text-sm text-[#64748B] leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#F1F5F9]">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-mono text-[#94A3B8]">
                        {step.detail}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLaunchBuilder(step.targetRoute)}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      className="w-full text-xs font-medium justify-between border-[#E2E8F0] hover:border-[#2563EB] hover:text-[#2563EB]"
                    >
                      <span>Try Step {step.number}</span>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </Container>
    </section>
  )
}

export default HowItWorks
