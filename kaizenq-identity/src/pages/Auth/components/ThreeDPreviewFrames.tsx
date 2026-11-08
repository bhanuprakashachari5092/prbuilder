import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import {
  ExternalLink,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Globe,
  FileText,
  Lock,
  Code,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  Zap,
  Check,
} from 'lucide-react'

type PreviewTab = 'portfolio' | 'resume' | 'domain'

export const ThreeDPreviewFrames: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PreviewTab>('portfolio')
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const TABS: { id: PreviewTab; label: string; icon: React.ReactNode; badge: string }[] = [
    { id: 'portfolio', label: '3D Portfolio', icon: <Globe className="w-3.5 h-3.5" />, badge: 'Live Theme' },
    { id: 'resume', label: 'ATS Resume', icon: <FileText className="w-3.5 h-3.5" />, badge: '99% Score' },
    { id: 'domain', label: 'Custom Domain', icon: <Activity className="w-3.5 h-3.5" />, badge: 'Edge DNS' },
  ]

  // Auto-rotate tabs every 5 seconds when not hovered
  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(() => {
      setActiveTab((prev) => {
        if (prev === 'portfolio') return 'resume'
        if (prev === 'resume') return 'domain'
        return 'portfolio'
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [isPaused])

  // Interactive 3D mouse parallax tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2 // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2 // -1 to 1
    setMousePos({ x, y })
  }

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 })
    setIsPaused(false)
  }

  // Calculate 3D stacking order based on activeTab
  const getCardOrder = () => {
    if (activeTab === 'portfolio') return ['portfolio', 'resume', 'domain'] as PreviewTab[]
    if (activeTab === 'resume') return ['resume', 'domain', 'portfolio'] as PreviewTab[]
    return ['domain', 'portfolio', 'resume'] as PreviewTab[]
  }

  const orderedTabs = getCardOrder()

  const handleNext = () => {
    setIsPaused(true)
    setActiveTab((prev) => {
      if (prev === 'portfolio') return 'resume'
      if (prev === 'resume') return 'domain'
      return 'portfolio'
    })
  }

  const handlePrev = () => {
    setIsPaused(true)
    setActiveTab((prev) => {
      if (prev === 'portfolio') return 'domain'
      if (prev === 'domain') return 'resume'
      return 'portfolio'
    })
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[620px] lg:h-[660px] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-[#0B1120] to-[#0A192F] p-4 lg:p-5 border border-slate-800/90 shadow-2xl flex flex-col justify-between select-none"
    >
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute -top-28 -left-28 w-80 h-80 bg-blue-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-28 -right-28 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Top Header Controls: Ecosystem Pill & Tab Switcher */}
      <div className="relative z-20 space-y-2.5">
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase">
              Live 3D Ecosystem
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Showroom</span>
          </div>
        </div>

        {/* Interactive 3-Tab Navigator */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-md">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id)
                  setIsPaused(true)
                }}
                className={`relative flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeThreeDTab"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 rounded-lg shadow-md border border-blue-400/30"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5 truncate">
                  {tab.icon}
                  <span className="truncate">{tab.label}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3D Perspective Stage with Dynamic Mouse Tilt */}
      <div
        className="relative flex-1 my-2 flex items-center justify-center overflow-visible"
        style={{
          perspective: '1400px',
        }}
      >
        <motion.div
          animate={{
            rotateY: -8 + mousePos.x * 7,
            rotateX: 6 - mousePos.y * 7,
            rotateZ: 0.5 - mousePos.x * 1,
          }}
          transition={{ type: 'spring', stiffness: 220, damping: 25 }}
          style={{
            transformStyle: 'preserve-3d',
          }}
          className="relative w-full max-w-[390px] h-[370px] flex items-center justify-center"
        >
          {/* Render All 3 Cards with 3D Depth Offsets */}
          {orderedTabs.map((cardId, index) => {
            const isFront = index === 0
            const isMid = index === 1

            // Depth configurations
            const zOffset = isFront ? 0 : isMid ? -65 : -130
            const yOffset = isFront ? 0 : isMid ? 18 : 36
            const scale = isFront ? 1 : isMid ? 0.95 : 0.90
            const opacity = isFront ? 1 : isMid ? 0.65 : 0.35
            const zIndex = isFront ? 30 : isMid ? 20 : 10

            return (
              <motion.div
                key={cardId}
                layout
                initial={false}
                animate={{
                  transform: `translate3d(0px, ${yOffset}px, ${zOffset}px) scale(${scale})`,
                  opacity,
                  zIndex,
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                onClick={() => {
                  if (!isFront) {
                    setActiveTab(cardId)
                    setIsPaused(true)
                  }
                }}
                className={`absolute inset-0 w-full rounded-2xl bg-slate-900/95 border backdrop-blur-xl shadow-2xl overflow-hidden transition-colors ${
                  isFront
                    ? 'border-blue-500/50 shadow-blue-500/20 ring-1 ring-blue-500/30 cursor-default'
                    : 'border-slate-700/60 hover:border-slate-600 hover:opacity-85 cursor-pointer'
                }`}
              >
                {/* 1. PORTFOLIO IFRAME VIEW */}
                {cardId === 'portfolio' && (
                  <div className="flex flex-col h-full justify-between">
                    {/* macOS Chrome Header */}
                    <div className="px-3.5 py-2.5 bg-slate-950/90 border-b border-slate-800/80 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/90 shadow-2xs" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/90 shadow-2xs" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/90 shadow-2xs" />
                      </div>
                      <div className="flex-1 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-[10.5px] text-slate-300 font-mono flex items-center justify-between">
                        <div className="flex items-center gap-1.5 truncate">
                          <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">https://alexander.prbuilder.xyz</span>
                        </div>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold shrink-0">
                          Live
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    </div>

                    {/* Inside Portfolio Content */}
                    <div className="p-4 space-y-3 flex-1 overflow-hidden">
                      {/* Hero Profile Block */}
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900/40 border border-blue-900/40">
                        <div className="relative w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 shadow-md shrink-0">
                          <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center font-extrabold text-white text-sm">
                            AV
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-xs" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                              Alexander Vance
                            </h4>
                            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            Full Stack &amp; AI Systems Engineer
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[9px] text-cyan-300 font-medium">
                            <span>📍 Bangalore, IN</span>
                            <span>•</span>
                            <span className="text-emerald-400">Available for hire</span>
                          </div>
                        </div>
                      </div>

                      {/* Tech Stack Matrix Chips */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-[9.5px] font-semibold text-blue-300">
                          React 19
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-[9.5px] font-semibold text-indigo-300">
                          TypeScript
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[9.5px] font-semibold text-emerald-300">
                          Supabase
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-[9.5px] font-semibold text-cyan-300">
                          TailwindCSS
                        </span>
                      </div>

                      {/* Showcase Project Micro Card */}
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 shadow-inner">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                          <span className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span>Cloud Identity Engine</span>
                          </span>
                          <span className="text-[9px] text-emerald-400 font-mono bg-emerald-500/15 px-1.5 py-0.5 rounded">
                            42ms TTFB
                          </span>
                        </div>
                        <p className="text-slate-400 text-[10px] line-clamp-2 leading-relaxed">
                          Microservices architecture with instant vector PDF compiler and edge routing.
                        </p>
                        <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5">
                          <span>100% Mobile Responsive</span>
                          <span className="text-blue-400 font-medium">Live Showcase ↗</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Micro Bar */}
                    <div className="px-3.5 py-2 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Subdomain Active
                      </span>
                      <span className="font-mono text-slate-500 text-[9px]">prbuilder.xyz</span>
                    </div>
                  </div>
                )}

                {/* 2. ATS RESUME INSPECTOR VIEW */}
                {cardId === 'resume' && (
                  <div className="flex flex-col h-full justify-between">
                    {/* macOS Chrome Header */}
                    <div className="px-3.5 py-2.5 bg-slate-950/90 border-b border-slate-800/80 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/90 shadow-2xs" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/90 shadow-2xs" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/90 shadow-2xs" />
                      </div>
                      <div className="flex-1 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-[10.5px] text-slate-300 font-mono flex items-center justify-between">
                        <div className="flex items-center gap-1.5 truncate">
                          <FileText className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate">prbuilder.xyz/resume/alexander.pdf</span>
                        </div>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold shrink-0">
                          99% Match
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    </div>

                    {/* Inside Resume Content */}
                    <div className="p-4 space-y-3 flex-1 overflow-hidden bg-slate-950/50">
                      {/* Document Header */}
                      <div className="border-b border-slate-800 pb-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-white tracking-wider font-heading">
                            ALEXANDER VANCE
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> ATS Validated
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Lead Software Engineer • alexander@prbuilder.xyz • Bangalore, India
                        </p>
                      </div>

                      {/* Work Experience Section */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                          <Code className="w-3 h-3" />
                          <span>Experience &amp; Systems</span>
                        </div>
                        <div className="pl-2.5 border-l-2 border-blue-500/50 space-y-1 text-[10px]">
                          <div className="flex items-center justify-between font-semibold text-slate-200">
                            <span>Lead Platform Engineer</span>
                            <span className="text-[9px] text-slate-500 font-mono">2024 - Present</span>
                          </div>
                          <p className="text-slate-400 text-[9.5px] leading-relaxed">
                            • Engineered vector ATS PDF parser processing 50k+ entries with zero overflow.
                          </p>
                          <p className="text-slate-400 text-[9.5px] leading-relaxed">
                            • Integrated live edge DNS routing and automated SSL certificate validation.
                          </p>
                        </div>
                      </div>

                      {/* Key Skills Row */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          Core Competencies
                        </span>
                        <div className="flex flex-wrap gap-1 text-[9px] text-slate-300">
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">React 19</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">TypeScript</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">Node.js</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">PostgreSQL</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">Docker</span>
                        </div>
                      </div>
                    </div>

                    {/* Resume Footer Micro Bar */}
                    <div className="px-3.5 py-2 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <ShieldCheck className="w-3 h-3" /> 0 Format Errors
                      </span>
                      <span className="font-mono text-slate-500 text-[9px]">A4 Vector Print Ready</span>
                    </div>
                  </div>
                )}

                {/* 3. CUSTOM DOMAIN GATEWAY VIEW */}
                {cardId === 'domain' && (
                  <div className="flex flex-col h-full justify-between">
                    {/* macOS Chrome Header */}
                    <div className="px-3.5 py-2.5 bg-slate-950/90 border-b border-slate-800/80 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/90 shadow-2xs" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/90 shadow-2xs" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/90 shadow-2xs" />
                      </div>
                      <div className="flex-1 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-[10.5px] text-slate-300 font-mono flex items-center justify-between">
                        <div className="flex items-center gap-1.5 truncate">
                          <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate">https://alexander.dev</span>
                        </div>
                        <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-bold shrink-0">
                          Active DNS
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    </div>

                    {/* Inside Domain Gateway Content */}
                    <div className="p-4 space-y-3 flex-1 overflow-hidden bg-slate-950/50">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-900/40 border border-cyan-800/40">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            <Globe className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">alexander.dev</span>
                            <span className="text-[10px] text-slate-400">Apex &amp; Subdomain Routing</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Connected
                        </span>
                      </div>

                      {/* Edge Network Telemetry Grid */}
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-0.5">
                          <span className="text-slate-400 block text-[9px]">Anycast Edge IP</span>
                          <span className="font-mono text-cyan-300 font-bold text-[11px]">75.2.60.5</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-0.5">
                          <span className="text-slate-400 block text-[9px]">Edge Latency</span>
                          <span className="font-mono text-emerald-400 font-bold text-[11px]">8ms Global</span>
                        </div>
                      </div>

                      {/* SSL & Ownership Guarantee */}
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-[9.5px]">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> TLS 1.3 Certified
                          </span>
                          <span className="text-slate-500 font-mono text-[9px]">Auto-Renewing</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed text-[9px]">
                          100% Legal ICANN ownership retained. Point your domain anywhere at any time.
                        </p>
                      </div>
                    </div>

                    {/* Domain Footer Micro Bar */}
                    <div className="px-3.5 py-2 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <Activity className="w-3 h-3 text-emerald-400 animate-pulse" /> Live DNS Propagation
                      </span>
                      <span className="font-mono text-slate-500 text-[9px]">Zero Custody Lock</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* Bottom Showcase Footer with Navigation Controls */}
      <div className="relative z-20 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Interactive 3D Deck</span>
        </div>

        {/* Carousel Indicators & Next/Prev Controls */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveTab(t.id)
                  setIsPaused(true)
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeTab === t.id ? 'w-5 bg-cyan-400' : 'w-1.5 bg-slate-700 hover:bg-slate-600'
                }`}
                title={`Show ${t.label}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Previous 3D Frame"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Next 3D Frame"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ThreeDPreviewFrames
