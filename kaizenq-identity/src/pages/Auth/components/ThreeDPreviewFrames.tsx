import React from 'react'
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
  Activity
} from 'lucide-react'

export const ThreeDPreviewFrames: React.FC = () => {
  return (
    <div className="relative w-full h-[580px] lg:h-[640px] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4 border border-slate-800/80 shadow-2xl flex flex-col justify-between">
      {/* Ambient background glows */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header pill indicator */}
      <div className="relative z-10 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-semibold tracking-wide text-slate-300 uppercase">
            Live 3D Ecosystem
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Showroom</span>
        </div>
      </div>

      {/* 3D Perspective Stage */}
      <div
        className="relative flex-1 my-3 overflow-hidden"
        style={{
          perspective: '1200px',
        }}
      >
        {/* Continuous 3D Scrolling Track */}
        <motion.div
          animate={{
            y: [0, -560],
          }}
          transition={{
            y: {
              repeat: Infinity,
              repeatType: 'loop',
              duration: 22,
              ease: 'linear',
            },
          }}
          style={{
            transformStyle: 'preserve-3d',
            transform: 'rotateY(-12deg) rotateX(8deg) rotateZ(-2deg)',
          }}
          className="space-y-4 hover:[animation-play-state:paused]"
        >
          {/* Repeat cards array twice for seamless continuous infinite scroll */}
          {[1, 2].map((loopIndex) => (
            <React.Fragment key={`loop-${loopIndex}`}>
              {/* FRAME 1: Student Portfolio 3D Browser Mockup */}
              <div className="w-full max-w-[360px] mx-auto rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-blue-500/60 hover:shadow-blue-500/20 hover:scale-[1.02]">
                {/* Browser Chrome Header */}
                <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-emerald-400" />
                    <span>alexander.prbuilder.xyz</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </div>

                {/* Content Inside Portfolio Iframe */}
                <div className="p-3.5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-md">
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-white text-xs">
                        AV
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white">Alexander Vance</h4>
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <p className="text-[10px] text-slate-400">Full Stack & AI Engineer</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[9px] font-medium text-blue-300">
                      React 19
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[9px] font-medium text-indigo-300">
                      TypeScript
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-medium text-emerald-300">
                      Supabase
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-[10px] space-y-1">
                    <div className="flex items-center justify-between text-slate-300 font-semibold">
                      <span>Featured: Cloud Identity Gateway</span>
                      <span className="text-[9px] text-emerald-400 font-mono">Live</span>
                    </div>
                    <p className="text-slate-400 text-[9px] line-clamp-1">
                      High-throughput microservices deployed with Netlify edge routing.
                    </p>
                  </div>
                </div>
              </div>

              {/* FRAME 2: ATS Vector Resume 3D Browser Mockup */}
              <div className="w-full max-w-[360px] mx-auto rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-emerald-500/60 hover:shadow-emerald-500/20 hover:scale-[1.02]">
                {/* Browser Chrome Header */}
                <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <FileText className="w-2.5 h-2.5 text-blue-400" />
                    <span>prbuilder.xyz/resume</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[9px] font-bold text-emerald-400">
                    98% ATS Score
                  </span>
                </div>

                {/* Content Inside Resume Iframe */}
                <div className="p-3.5 space-y-2 bg-slate-950/60">
                  <div className="border-b border-slate-800 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white tracking-wide">
                        ALEXANDER VANCE
                      </span>
                      <span className="text-[9px] font-mono text-cyan-400">ATS Optimized</span>
                    </div>
                    <p className="text-[9px] text-slate-400">
                      alexander@university.edu • +91 98765 43210 • Bangalore, India
                    </p>
                  </div>

                  <div className="space-y-1.5 text-[9px]">
                    <div className="font-semibold text-slate-300 flex items-center gap-1">
                      <Code className="w-3 h-3 text-blue-400" />
                      <span>EXPERIENCE & SYSTEMS</span>
                    </div>
                    <div className="pl-2 border-l border-blue-500/40 text-slate-400 space-y-0.5">
                      <div className="flex justify-between font-medium text-slate-200">
                        <span>Lead Student Developer</span>
                        <span className="text-slate-500">2024 - Present</span>
                      </div>
                      <p className="text-[8.5px] leading-tight">
                        • Engineered vector PDF export engine supporting standard ATS parsers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FRAME 3: Custom Domain & Telemetry 3D Mockup */}
              <div className="w-full max-w-[360px] mx-auto rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-cyan-500/60 hover:shadow-cyan-500/20 hover:scale-[1.02]">
                <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] text-cyan-300 font-medium">
                    <Globe className="w-3 h-3 text-cyan-400" />
                    <span>alexander.xyz</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-semibold">
                    <Activity className="w-3 h-3 animate-pulse text-emerald-400" />
                    <span>DNS Active</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/70 space-y-2 text-[10px]">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400">Anycast Netlify IP</span>
                    <span className="font-mono text-cyan-300 font-bold">75.2.60.5</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400 px-1">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> SSL TLS 1.3 Certified
                    </span>
                    <span className="text-blue-400 font-mono">0ms Edge TTL</span>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </motion.div>
      </div>

      {/* Footer feature badge */}
      <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real-time Data Sync</span>
        </span>
        <span className="text-slate-500 font-mono text-[10px]">v2.6 Realtime</span>
      </div>
    </div>
  )
}

