import React from 'react'
import { motion } from 'motion/react'
import {
  LayoutTemplate,
  Eye,
  Edit3,
  FileDown,
  Share2,
  Smartphone,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { Container } from '../ui/Container.tsx'

interface FeatureSpec {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  status: 'Ready' | 'Implemented'
  highlights: string[]
}

const PR_FEATURES: FeatureSpec[] = [
  {
    id: 'templates',
    title: 'Professional Templates',
    description:
      'Curated ATS resume designs and modern portfolio themes built to capture recruiter attention with clean typography.',
    icon: <LayoutTemplate className="w-5 h-5 text-[#2563EB]" />,
    status: 'Ready',
    highlights: ['4 ATS resume layouts', '4 portfolio themes', 'Clean visual hierarchy'],
  },
  {
    id: 'preview',
    title: 'Real-Time Preview',
    description:
      'Instant side-by-side preview that renders updates synchronously as you edit your projects, bio, or skills.',
    icon: <Eye className="w-5 h-5 text-[#2563EB]" />,
    status: 'Ready',
    highlights: ['Split-screen workspace', 'Responsive view modes', 'Zero layout stutter'],
  },
  {
    id: 'editing',
    title: 'Easy Editing',
    description:
      'Frictionless structured inputs for work history, education, skills, and projects with automatic browser draft persistence.',
    icon: <Edit3 className="w-5 h-5 text-[#2563EB]" />,
    status: 'Ready',
    highlights: ['Modular form sections', 'Instant draft autosave', 'One-click reset & sample fill'],
  },
  {
    id: 'pdf-export',
    title: 'Resume PDF Export',
    description:
      'High-resolution, ATS-compliant PDF printing with dedicated print stylesheets ensuring clean single-page formatting.',
    icon: <FileDown className="w-5 h-5 text-[#2563EB]" />,
    status: 'Ready',
    highlights: ['Standard A4 page rules', 'Vector-sharp typography', 'ATS scanner verified'],
  },
  {
    id: 'sharing',
    title: 'Portfolio Sharing',
    description:
      'Share your finished portfolio with customized public handles, link copies, and scannable QR cards for networking.',
    icon: <Share2 className="w-5 h-5 text-[#2563EB]" />,
    status: 'Ready',
    highlights: ['Custom public handle', 'Scannable QR profile', 'Direct clipboard link copy'],
  },
  {
    id: 'responsive',
    title: 'Mobile-Friendly Layouts',
    description:
      'Engineered for all screen sizes with touch-optimized controls, collapsible sidebars, and adaptive responsive grids.',
    icon: <Smartphone className="w-5 h-5 text-[#2563EB]" />,
    status: 'Ready',
    highlights: ['Phone (375px+)', 'Tablet (768px+)', 'Desktop (1440px+)'],
  },
]

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-20 sm:py-28 relative scroll-mt-20 bg-[#F7F9FC]">
      <Container size="xl">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-mono text-[#2563EB] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Core Capabilities</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight font-sans">
            Engineered for Precision & Recruiter Impact
          </h2>
          <p className="mt-3.5 text-sm sm:text-base text-[#64748B] leading-relaxed">
            Every feature in PR Builder is built to solve the real friction students and professionals face when presenting their work.
          </p>
        </div>

        {/* 6-Card Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PR_FEATURES.map((feature, idx) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className="group relative p-7 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#BFDBFE] transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <span className="text-[11px] font-mono text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded border border-[#BFDBFE]">
                    {feature.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#111827] font-sans group-hover:text-[#2563EB] transition-colors">
                  {feature.title}
                </h3>
                <p className="mt-2.5 text-xs sm:text-sm text-[#64748B] leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Bullet highlights */}
              <div className="mt-6 pt-5 border-t border-[#E2E8F0] space-y-2">
                {feature.highlights.map((hl) => (
                  <div key={hl} className="flex items-center gap-2 text-xs text-[#64748B]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                    <span>{hl}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  )
}

export default Features
