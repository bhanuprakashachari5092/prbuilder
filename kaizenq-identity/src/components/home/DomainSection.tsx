import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Check, ShieldCheck, ArrowRight, Sparkles, Terminal, Info } from 'lucide-react'
import { Container } from '../ui/Container.tsx'
import { SectionHeading } from '../ui/SectionHeading.tsx'
import { Button } from '../ui/Button.tsx'
import { domainService } from '../../services/domains/index.ts'
import type { DomainCheckResult } from '../../types/domain.ts'

export interface DomainSectionProps {
  onClaimDomain?: (handle: string) => void
}

export const DomainSection: React.FC<DomainSectionProps> = ({ onClaimDomain }) => {
  const [handle, setHandle] = useState('rahul')
  const [result, setResult] = useState<DomainCheckResult | null>({
    domain: 'rahul.xyz',
    available: true,
    isPremium: false,
    suggestionHandles: [],
  })
  const [isChecking, setIsChecking] = useState(false)

  const handleInputChange = (val: string) => {
    setHandle(val)
    setIsChecking(true)
  }

  useEffect(() => {
    let isCancelled = false

    const timer = setTimeout(async () => {
      const res = await domainService.checkAvailability(handle)
      if (!isCancelled) {
        setResult(res)
        setIsChecking(false)
      }
    }, 250)

    return () => {
      isCancelled = true
      clearTimeout(timer)
    }
  }, [handle])

  return (
    <section id="domains" className="py-20 sm:py-28 relative scroll-mt-20 bg-[#0B1425]">
      <Container size="xl">
        <SectionHeading
          badge="Personal .xyz Web Handle"
          title="Give Your Portfolio a Memorable Identity"
          description="Eligible bootcamp students and FUSION 2K26 participants can check personal .xyz handle availability and prepare for domain allocation through program vouchers."
          badgeVariant="cyan"
        />

        <div className="max-w-4xl mx-auto">
          {/* Interactive Domain Search Card */}
          <div className="p-8 sm:p-10 rounded-3xl bg-[#101D32] border border-white/[0.08] shadow-[0_20px_50px_rgba(79,140,255,0.08)] relative overflow-hidden">
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4F8CFF] via-[#8CD8FF] to-[#DCEBFF]" />

            <div className="max-w-2xl mx-auto text-center mb-8">
              <span className="text-xs uppercase font-mono text-[#8CD8FF] font-semibold tracking-wider">
                Handle Availability Simulator
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#F7FAFF] font-['Inter',sans-serif] mt-1.5">
                Test your desired personal domain name
              </h3>
              <p className="text-xs sm:text-sm text-[#9AAAC0] mt-2 leading-relaxed">
                Check whether your handle is available for allocation before applying your cohort voucher.
              </p>
            </div>

            {/* Input & Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="relative flex items-center rounded-xl bg-[#0B1425] border border-white/15 p-2 focus-within:border-[#4F8CFF] focus-within:ring-2 focus-within:ring-[#4F8CFF]/20 transition-all">
                <span className="pl-3 text-sm text-[#6A7B95] font-mono select-none">https://</span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="yourname"
                  className="flex-1 bg-transparent px-2 py-2 text-base font-semibold text-[#F7FAFF] placeholder-[#6A7B95] focus:outline-none font-mono"
                  aria-label="Personal domain handle"
                />
                <span className="text-base font-bold text-[#8CD8FF] font-mono pr-3 select-none">
                  .xyz
                </span>
                <Button
                  variant="glow"
                  size="md"
                  onClick={() => onClaimDomain?.(handle)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Verify
                </Button>
              </div>

              {/* Real-time status display */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                {isChecking ? (
                  <span className="text-[#9AAAC0] font-mono flex items-center gap-1.5">
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-[#8CD8FF] border-t-transparent rounded-full" />
                    Checking handle availability...
                  </span>
                ) : result?.available ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 text-emerald-400 font-medium"
                  >
                    <Check className="w-4 h-4" />
                    <span className="font-mono">{result.domain}</span>
                    <span>is available to request</span>
                  </motion.div>
                ) : (
                  <span className="text-rose-400 font-medium">
                    This handle is unavailable. Try an alternative below.
                  </span>
                )}

                <div className="flex items-center gap-2 text-[#9AAAC0]">
                  <ShieldCheck className="w-4 h-4 text-[#8CD8FF]" />
                  <span>Edge DNS & SSL Architecture</span>
                </div>
              </div>

              {/* Suggestions if not available */}
              {result && !result.available && result.suggestionHandles && (
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="text-[#6A7B95]">Suggestions:</span>
                  {result.suggestionHandles.map((sug) => (
                    <button
                      key={sug}
                      onClick={() => handleInputChange(sug)}
                      className="px-2 py-1 rounded bg-white/[0.04] text-[#8CD8FF] hover:bg-white/[0.08] font-mono cursor-pointer"
                    >
                      {sug}.xyz
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DNS / Infrastructure Architecture Mockup */}
            <div className="mt-10 p-5 rounded-xl bg-[#0B1425]/90 border border-white/[0.08] max-w-xl mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs font-mono text-[#9AAAC0]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#8CD8FF]" />
                  <span>Edge DNS Routing Record</span>
                </div>
                <span className="text-emerald-400">DNS SEC READY</span>
              </div>

              <div className="mt-3 space-y-2 font-mono text-[11px] text-[#9AAAC0]">
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#6A7B95]">Record Type:</span>
                  <span className="text-[#F7FAFF]">CNAME (Canonical)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#6A7B95]">Domain Target:</span>
                  <span className="text-[#8CD8FF] font-semibold">{handle ? `${handle}.xyz` : 'yourname.xyz'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#6A7B95]">Routing Edge:</span>
                  <span className="text-[#F7FAFF]">cname.kaizenq.id</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#6A7B95]">SSL Protocol:</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#8CD8FF]" /> Automated Let&apos;s Encrypt TLS
                  </span>
                </div>
              </div>
            </div>

            {/* Program Notice Disclaimer (Complies strictly with copy constraint) */}
            <div className="mt-8 pt-5 border-t border-white/[0.06] flex items-start gap-2.5 text-xs text-[#9AAAC0]">
              <Info className="w-4 h-4 text-[#8CD8FF] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-semibold text-[#F7FAFF]">Eligibility Notice:</span> Domain allocation and voucher coupon eligibility are distributed separately to confirmed FUSION 2K26 cohort participants and bootcamp builders. Availability check simulates real-time DNS query.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

export default DomainSection
