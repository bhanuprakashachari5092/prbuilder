import React from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'
import { Container } from '../ui/Container.tsx'
import { Button } from '../ui/Button.tsx'

export interface CTASectionProps {
  onGetStarted?: () => void
}

export const CTASection: React.FC<CTASectionProps> = ({ onGetStarted }) => {
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden bg-[#F7F9FC]">
      <Container size="lg">
        <div className="relative rounded-3xl p-8 sm:p-14 lg:p-16 bg-gradient-to-br from-[#EFF6FF] via-white to-[#EEF2FF] border border-[#BFDBFE] text-center shadow-sm overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[320px] bg-gradient-to-r from-[#2563EB]/5 via-[#60A5FA]/5 to-transparent blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#BFDBFE] text-xs font-medium text-[#2563EB] shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>YOUR FUTURE STARTS HERE</span>
            </span>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-['Inter',sans-serif] text-[#111827] leading-[1.1]"
            >
              Make your next <br />
              <span className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] bg-clip-text text-transparent">
                opportunity count.
              </span>
            </motion.h2>

            <p className="text-sm sm:text-base text-[#64748B] max-w-xl mx-auto leading-relaxed">
              Build an ATS-optimized resume, launch a live interactive portfolio, and present your work with confidence.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Button
                variant="primary"
                size="lg"
                onClick={onGetStarted}
                rightIcon={<ArrowRight className="w-4 h-4 text-white" />}
                className="w-full sm:w-auto px-8 py-3.5 text-base bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold border-none shadow-sm transition-all"
              >
                Start Building
              </Button>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-5 text-xs text-[#64748B]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                ATS-Optimized Resumes
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                Live Portfolio Hosting
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                No Credit Card Required
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

export default CTASection
