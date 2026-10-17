import React from 'react'
import { motion } from 'motion/react'
import { UserCheck, Sliders, Share2, Sparkles } from 'lucide-react'
import { Container } from '../ui/Container.tsx'

interface StepItem {
  number: string
  title: string
  description: string
  detail: string
  icon: React.ReactNode
}

const STEPS: StepItem[] = [
  {
    number: '01',
    title: 'Add your information and projects.',
    description:
      'Enter your background, work experience, education, key technical skills, and featured repositories into structured, intuitive input fields.',
    detail: 'Automatic draft persistence saves progress locally as you type.',
    icon: <UserCheck className="w-5 h-5 text-[#2563EB]" />,
  },
  {
    number: '02',
    title: 'Customize your resume or portfolio.',
    description:
      'Select from curated ATS-optimized layouts and responsive portfolio themes to match your unique professional identity and aesthetic preferences.',
    detail: 'Instant reactive previews ensure typography and spacing are flawless.',
    icon: <Sliders className="w-5 h-5 text-[#2563EB]" />,
  },
  {
    number: '03',
    title: 'Preview, export or share using available features.',
    description:
      'Download a vector-crisp, ATS-compliant PDF resume or publish and distribute your live portfolio link and scannable QR card directly to recruiters.',
    detail: 'One-click export ready for job applications and portfolio reviews.',
    icon: <Share2 className="w-5 h-5 text-[#2563EB]" />,
  },
]

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 relative scroll-mt-20 bg-white border-y border-[#E2E8F0]">
      <Container size="xl">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-mono text-[#2563EB] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Workflow</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight font-sans">
            Three Simple Steps to Professional Impact
          </h2>
          <p className="mt-3.5 text-sm sm:text-base text-[#64748B] leading-relaxed">
            From raw project notes to a polished resume and portfolio in minutes.
          </p>
        </div>

        {/* 3-Step Timeline Grid */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connecting datum line */}
          <div className="hidden lg:block absolute top-1/2 left-16 right-16 h-[1px] bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent -translate-y-10 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {STEPS.map((step, idx) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: idx * 0.12 }}
                className="p-7 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#BFDBFE] transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
              >
                <div>
                  {/* Step Number & Icon Header */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-mono font-bold text-[#2563EB] px-2.5 py-1 rounded bg-[#EFF6FF] border border-[#BFDBFE]">
                      Step {step.number}
                    </span>
                    <div className="w-11 h-11 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center group-hover:scale-105 transition-transform">
                      {step.icon}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-[#111827] font-sans group-hover:text-[#2563EB] transition-colors">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-xs sm:text-sm text-[#64748B] leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
                  <p className="text-[11px] text-[#94A3B8] font-mono leading-normal">
                    {step.detail}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}

export default HowItWorks
