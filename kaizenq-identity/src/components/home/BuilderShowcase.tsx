import React from 'react'
import { motion } from 'motion/react'
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
} from 'lucide-react'
import { Container } from '../ui/Container.tsx'
import { Button } from '../ui/Button.tsx'
import { useApp } from '../../app/providers/AppContext.ts'
import { useAuth } from '../../app/providers/AuthContext.tsx'

export const BuilderShowcase: React.FC = () => {
  const { setCurrentRoute, setIsAuthOpen, setAuthMode, setTargetRouteAfterAuth } = useApp()
  const { user } = useAuth()

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
    <section id="builder-showcase" className="pt-12 sm:pt-16 pb-20 sm:pb-28 relative bg-[#F7F9FC] border-y border-[#E2E8F0]">
      <Container size="xl">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-mono text-[#2563EB] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Dedicated Studio Engines</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight font-sans">
            Two Powerful Builders. One Unified Platform.
          </h2>
          <p className="mt-3.5 text-sm sm:text-base text-[#64748B] leading-relaxed">
            Whether you are applying through corporate ATS portals or sharing your work with engineering leaders, PR Builder provides tailored tools for every touchpoint.
          </p>
        </div>

        {/* Two Premium Feature Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          {/* Card A: Resume Builder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5 }}
            className="group relative rounded-3xl bg-white border border-[#E2E8F0] hover:border-[#BFDBFE] p-8 sm:p-10 transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-md"
          >
            {/* Top Header */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-[#BFDBFE]">
                  ATS-Engineered
                </span>
              </div>

              <h3 className="text-2xl font-bold text-[#111827] tracking-tight font-sans">
                Resume Builder
              </h3>
              <p className="mt-3 text-sm text-[#64748B] leading-relaxed">
                Design clean, recruiter-approved resumes with LaTeX-grade typography and structured formatting designed to pass applicant tracking systems with flying colors.
              </p>

              {/* Feature Checklist */}
              <div className="mt-6 space-y-3 pt-6 border-t border-[#E2E8F0]">
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

              {/* Interactive Mini Preview Pill Group */}
              <div className="mt-6 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-[#64748B] font-medium">Templates Included:</span>
                </div>
                <div className="flex gap-1.5 font-mono text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-white text-[#111827] border border-[#E2E8F0] font-semibold">Modern</span>
                  <span className="px-2 py-0.5 rounded bg-white text-[#64748B] border border-[#E2E8F0]">Classic</span>
                  <span className="px-2 py-0.5 rounded bg-white text-[#64748B] border border-[#E2E8F0]">Minimal</span>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
              <Button
                variant="primary"
                fullWidth
                size="md"
                onClick={handleOpenResume}
                leftIcon={<Download className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Build Your Resume
              </Button>
            </div>
          </motion.div>

          {/* Card B: Portfolio Builder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group relative rounded-3xl bg-white border border-[#E2E8F0] hover:border-[#BFDBFE] p-8 sm:p-10 transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-md"
          >
            {/* Top Header */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4F46E5]">
                  <Globe className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#4F46E5] bg-[#EEF2FF] px-3 py-1 rounded-full border border-[#C7D2FE]">
                  Interactive Web
                </span>
              </div>

              <h3 className="text-2xl font-bold text-[#111827] tracking-tight font-sans">
                Portfolio Builder
              </h3>
              <p className="mt-3 text-sm text-[#64748B] leading-relaxed">
                Transform your code, repositories, and experience into a fast, responsive personal website that showcases your unique engineering craftsmanship.
              </p>

              {/* Feature Checklist */}
              <div className="mt-6 space-y-3 pt-6 border-t border-[#E2E8F0]">
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

              {/* Interactive Mini Preview Theme Group */}
              <div className="mt-6 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#4F46E5]" />
                  <span className="text-[#64748B] font-medium">Themes Included:</span>
                </div>
                <div className="flex gap-1.5 font-mono text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-white text-[#111827] border border-[#E2E8F0] font-semibold">Developer</span>
                  <span className="px-2 py-0.5 rounded bg-white text-[#64748B] border border-[#E2E8F0]">Minimal</span>
                  <span className="px-2 py-0.5 rounded bg-white text-[#64748B] border border-[#E2E8F0]">Creative</span>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
              <Button
                variant="secondary"
                fullWidth
                size="md"
                onClick={handleOpenPortfolio}
                leftIcon={<Share2 className="w-4 h-4 text-[#4F46E5]" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-white text-[#111827] border border-[#E2E8F0] hover:bg-[#F8FAFC]"
              >
                Create Your Portfolio
              </Button>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  )
}

export default BuilderShowcase
