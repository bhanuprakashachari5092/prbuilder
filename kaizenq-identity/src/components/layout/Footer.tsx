import React from 'react'
import { PRLogo } from '../brand/PRLogo.tsx'
import { Container } from '../ui/Container.tsx'
import { useApp } from '../../app/providers/AppContext.ts'
import { useAuth } from '../../app/providers/AuthContext.tsx'
import { SITE_CONFIG } from '../../lib/constants.ts'

export const Footer: React.FC = () => {
  const { setCurrentRoute, setIsAuthOpen, setAuthMode, setTargetRouteAfterAuth } = useApp()
  const { user } = useAuth()

  const handleBuilderClick = (target: 'resume' | 'portfolio') => {
    if (user) {
      setCurrentRoute(target)
    } else {
      setTargetRouteAfterAuth(target)
      setAuthMode('signup')
      setIsAuthOpen(true)
    }
  }

  return (
    <footer className="border-t border-[#E2E8F0] bg-white text-[#64748B] pt-16 pb-12">
      <Container size="xl">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-2">
            <PRLogo size="lg" tagline="Professional Identity & Portfolio Studio" />
            <p className="mt-4 text-xs sm:text-sm text-[#64748B] max-w-sm leading-relaxed">
              PR Builder helps students and professionals create polished, ATS-compliant resumes and personal web portfolios that showcase their skills, work, and potential.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <a
                href={SITE_CONFIG.links.github}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#111827] hover:border-[#2563EB]/40 transition-all"
                aria-label="GitHub Repository"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
            </div>

            <div className="mt-6 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] text-[#2563EB]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>PR Builder Platform Online</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#111827] mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <button
                  onClick={() => handleBuilderClick('resume')}
                  className="hover:text-[#111827] transition-colors cursor-pointer text-left text-[#64748B]"
                >
                  Resume Builder
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleBuilderClick('portfolio')}
                  className="hover:text-[#111827] transition-colors cursor-pointer text-left text-[#64748B]"
                >
                  Portfolio Builder
                </button>
              </li>
              <li>
                <a href="#features" className="hover:text-[#111827] transition-colors text-[#64748B]">
                  Core Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#111827] transition-colors text-[#64748B]">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#111827] mb-4">
              Resources
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#64748B]">
              <li>
                <span>ATS Compliance Guide</span>
              </li>
              <li>
                <span>Portfolio Design Systems</span>
              </li>
              <li>
                <span>Recruiter Formats</span>
              </li>
              <li>
                <span>Student Identity Standards</span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#111827] mb-4">
              Legal & Privacy
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#64748B]">
              <li>
                <span>Privacy Policy</span>
              </li>
              <li>
                <span>Terms of Service</span>
              </li>
              <li>
                <span>Local Draft Protection</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal / Dynamic Copyright */}
        <div className="pt-8 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8]">
          <p>
            © {new Date().getFullYear()} PR Builder. All rights reserved.
          </p>
          <p className="text-center sm:text-right max-w-md">
            Engineered with React, Vite, TypeScript, and Motion. Built for students, builders, and professionals.
          </p>
        </div>
      </Container>
    </footer>
  )
}

export default Footer
