import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Globe,
  ExternalLink,
  Copy,
  Check,
  Award,
  FileText,
  Star,
  QrCode,
  ShieldCheck,
} from 'lucide-react'
import { MOCK_STUDENT_PREVIEW } from '../../lib/constants.ts'
import { Badge } from '../ui/Badge.tsx'
import { copyToClipboard } from '../../lib/utils.ts'

export const PortfolioPreview: React.FC = () => {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'resume'>('overview')
  const [showQrModal, setShowQrModal] = useState(false)

  const handleCopyLink = async () => {
    await copyToClipboard(`https://${MOCK_STUDENT_PREVIEW.handle}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-2xl bg-[#101D32] border border-white/[0.08] shadow-[0_20px_50px_rgba(79,140,255,0.08)] overflow-hidden transition-all duration-300">
      {/* Top Browser / Window Chrome Header */}
      <div className="px-4 py-3 bg-[#15243C]/90 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 select-none">
        {/* Window controls */}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          <span className="ml-2 text-xs font-mono text-[#9AAAC0] hidden sm:inline">
            preview.kaizenq.id <span className="text-[#8CD8FF]/60">• Sample Demonstration Profile</span>
          </span>
        </div>

        {/* URL Address Bar with .xyz Domain */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B1425] border border-white/10 text-xs font-mono text-[#F7FAFF]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[#8CD8FF] font-semibold">{MOCK_STUDENT_PREVIEW.handle}</span>
          <button
            onClick={handleCopyLink}
            className="p-1 text-[#9AAAC0] hover:text-white transition-colors"
            title="Copy portfolio domain"
            aria-label="Copy portfolio link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQrModal(!showQrModal)}
            className="p-1.5 rounded bg-white/[0.04] text-[#9AAAC0] hover:text-white hover:bg-white/[0.08] text-xs flex items-center gap-1 transition-colors cursor-pointer"
            aria-label="View QR profile"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">QR Card</span>
          </button>
          <Badge variant="cyan" size="sm">
            Shaivika × KaizenQ Verified
          </Badge>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 pt-4 border-b border-white/[0.06] flex items-center gap-4 bg-[#101D32]">
        {(['overview', 'projects', 'resume'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-xs sm:text-sm font-medium capitalize tracking-wide transition-colors relative ${
              activeTab === tab ? 'text-[#F5F7FA]' : 'text-[#6B7280] hover:text-[#9CA3AF]'
            }`}
          >
            {tab === 'overview' ? 'Identity Overview' : tab === 'projects' ? 'GitHub Projects (2)' : 'ATS Resume'}
            {activeTab === tab && (
              <motion.div
                layoutId="portfolioTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="p-6 sm:p-8 bg-[#0B0D11]">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Profile Bio Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-white/[0.06]">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-cyan-500/20">
                      RS
                    </div>
                    <span
                      className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[#0B0D11]"
                      title="Verified Identity"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-[#F5F7FA] font-['Outfit',sans-serif]">
                        {MOCK_STUDENT_PREVIEW.name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                        Available for Hiring
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#9CA3AF] mt-0.5">
                      {MOCK_STUDENT_PREVIEW.role}
                    </p>
                    <p className="text-xs text-[#6B7280] mt-1">
                      {MOCK_STUDENT_PREVIEW.institution} • {MOCK_STUDENT_PREVIEW.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#9CA3AF] font-mono px-2.5 py-1 rounded bg-[#151820] border border-white/5">
                    Live at {MOCK_STUDENT_PREVIEW.handle}
                  </span>
                </div>
              </div>

              {/* Verified Skills Grid */}
              <div>
                <h4 className="text-xs uppercase font-mono tracking-wider text-[#6B7280] mb-3">
                  Technical Core & Systems
                </h4>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {MOCK_STUDENT_PREVIEW.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs px-2.5 py-1 rounded-md bg-[#151820] text-[#E2E8F0] border border-white/[0.08] hover:border-indigo-400/30 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Certifications preview */}
              <div>
                <h4 className="text-xs uppercase font-mono tracking-wider text-[#6B7280] mb-3">
                  Verified Credentials & Hackathons
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MOCK_STUDENT_PREVIEW.certifications.map((cert) => (
                    <div
                      key={cert.title}
                      className="p-3 rounded-lg bg-[#151820]/70 border border-white/[0.06] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <Award className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-[#F5F7FA]">{cert.title}</p>
                          <p className="text-[11px] text-[#6B7280]">{cert.issuer}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        VERIFIED
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div
              key="projects-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MOCK_STUDENT_PREVIEW.projects.map((project) => (
                  <div
                    key={project.title}
                    className="p-4 rounded-xl bg-[#151820]/80 border border-white/[0.08] hover:border-indigo-500/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-[#F5F7FA] font-['Outfit',sans-serif]">
                          {project.title}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{project.stars}</span>
                        </div>
                      </div>
                      <p className="text-xs text-[#9CA3AF] mb-3 leading-relaxed">
                        {project.tagline}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] pt-3 border-t border-white/[0.06]">
                        <div className="flex gap-1.5">
                          {project.tags.map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[#9CA3AF] font-mono text-[10px]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        <span className="text-cyan-400 font-mono text-[11px]">
                          {project.metrics}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'resume' && (
            <motion.div
              key="resume-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="p-5 rounded-xl bg-[#151820]/90 border border-white/[0.08] space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-[#F5F7FA]">
                    ATS Resume Template: Classic Technical
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                  98/100 ATS Score
                </span>
              </div>

              <div className="text-xs text-[#9CA3AF] space-y-2">
                <p className="font-semibold text-[#F5F7FA]">Professional Summary</p>
                <p className="leading-relaxed">
                  Software engineering student specializing in distributed backend architecture and
                  agentic workflows with proven ability to architect resilient
                  APIs with sub-15ms sync times.
                </p>

                <p className="font-semibold text-[#F5F7FA] pt-2">Quantified Accomplishments</p>
                <ul className="list-disc list-inside space-y-1 text-[#9CA3AF]">
                  <li>Architected NeuralTrace handling 3,400+ evaluation requests monthly.</li>
                  <li>Engineered CRDT canvas state synchronization reducing drift by 84%.</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* QR Modal Flyout */}
      {showQrModal && (
        <div className="absolute inset-0 bg-[#08090C]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 z-20">
          <div className="w-44 h-44 bg-white p-3 rounded-2xl shadow-2xl flex flex-col items-center justify-center text-black">
            <QrCode className="w-32 h-32 text-[#08090C]" />
            <span className="text-[10px] font-mono font-bold tracking-tight text-gray-700 mt-1">
              {MOCK_STUDENT_PREVIEW.handle}
            </span>
          </div>
          <p className="text-xs text-[#F5F7FA] font-medium mt-4">
            Scan to inspect verified identity card
          </p>
          <button
            onClick={() => setShowQrModal(false)}
            className="mt-3 text-xs text-[#9CA3AF] hover:text-white underline cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      )}

      {/* Bottom status bar */}
      <div className="px-6 py-2.5 bg-[#101D32] border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#9AAAC0]">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-[#8CD8FF]" />
          <span>Automated SSL & Edge Routing Active</span>
        </div>
        <div className="flex items-center gap-1 text-[#8CD8FF] font-medium">
          <span>Explore Live Demo</span>
          <ExternalLink className="w-3 h-3" />
        </div>
      </div>
    </div>
  )
}
