import React from 'react'
import { motion } from 'motion/react'
import { Users, Sparkles, Building2, ShieldCheck, Zap, ArrowRight } from 'lucide-react'
import { Container } from '../ui/Container.tsx'
import { Badge } from '../ui/Badge.tsx'
import { Button } from '../ui/Button.tsx'

export interface StudentOpportunitySectionProps {
  onJoinCohort?: () => void
}

export const StudentOpportunitySection: React.FC<StudentOpportunitySectionProps> = ({
  onJoinCohort,
}) => {
  return (
    <section id="fusion-2k26" className="py-20 sm:py-28 relative scroll-mt-20">
      <Container size="xl">
        <div className="relative rounded-3xl p-8 sm:p-12 lg:p-16 bg-gradient-to-br from-[#101D32] via-[#0B1425] to-[#0A1221] border border-[#4F8CFF]/20 overflow-hidden shadow-[0_20px_60px_rgba(79,140,255,0.08)]">
          {/* Subtle Ambient Background Light */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-[#4F8CFF]/10 via-[#8CD8FF]/5 to-transparent blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge variant="cyan" ping>
                  Shaivika Groups × KaizenQ
                </Badge>
                <span className="text-xs font-mono text-[#9AAAC0]">
                  Cohort 1: ~350 Select Builders
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-['Inter',sans-serif] text-[#F7FAFF] leading-[1.1]">
                Launch Your Career Directly From{' '}
                <span className="bg-gradient-to-r from-[#8CD8FF] via-[#4F8CFF] to-[#DCEBFF] bg-clip-text text-transparent">
                  FUSION 2K26
                </span>
              </h2>

              <p className="text-sm sm:text-base text-[#9CA3AF] max-w-xl leading-relaxed">
                Whether you are pitching a hackathon project, networking with tech leaders, or
                applying to elite internships, KaizenQ Identity turns your event achievements into
                an enduring, recruiter-verifiable digital legacy.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#151820]/80 border border-white/[0.08] flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-violet-950/50 text-violet-300 border border-violet-500/20 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#F5F7FA]">Verifiable Credential</h4>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      Hackathon certificates and project tracks cryptographically authenticated.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#151820]/80 border border-white/[0.08] flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-950/50 text-indigo-300 border border-indigo-500/20 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#F5F7FA]">Direct Recruiter Radar</h4>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      Hiring partners can browse candidate profiles filtered by tech stack & awards.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#151820]/80 border border-white/[0.08] flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-cyan-950/50 text-cyan-300 border border-cyan-500/20 shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#F5F7FA]">Instant 60s Onboarding</h4>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      Sync from GitHub and generate your resume, portfolio and QR code in one click.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#151820]/80 border border-white/[0.08] flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-950/50 text-purple-300 border border-purple-500/20 shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#F5F7FA]">Scalable to 10k+</h4>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      Built on resilient edge infrastructure designed to support enterprise scale.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  variant="glow"
                  size="lg"
                  onClick={onJoinCohort}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Join 350+ FUSION Builders
                </Button>
                <span className="text-xs text-[#6B7280] font-mono">
                  Guaranteed personal .xyz allocation for participants
                </span>
              </div>
            </div>

            {/* Right Metric Box */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="w-full max-w-md p-6 rounded-2xl bg-[#08090C]/90 border border-white/10 shadow-2xl relative">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-mono font-semibold text-[#F5F7FA]">
                      Cohort Enrollment Telemetry
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/20">
                    LIVE
                  </span>
                </div>

                <div className="py-6 text-center">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-5xl sm:text-6xl font-extrabold font-['Outfit',sans-serif] bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent"
                  >
                    350
                  </motion.div>
                  <p className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mt-1">
                    Initial Target Capacity Reserved
                  </p>
                  <div className="w-full bg-[#151820] h-2 rounded-full mt-4 overflow-hidden border border-white/5">
                    <div className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full w-[84%] rounded-full" />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-[#6B7280] mt-1.5">
                    <span>84% Reserved</span>
                    <span>Scaling target: 10,000+</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/[0.06] text-xs text-[#9CA3AF]">
                  <div className="flex justify-between">
                    <span>Participating Colleges:</span>
                    <span className="text-[#F5F7FA] font-medium">Top Tier Engineering</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Track Specializations:</span>
                    <span className="text-[#F5F7FA] font-medium">AI, Web3, Distributed Core</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recruiter Partner Access:</span>
                    <span className="text-emerald-400 font-medium">Priority Enabled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
