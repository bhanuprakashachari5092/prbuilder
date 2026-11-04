import React from 'react'
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Check,
  ArrowRight,
  Eye,
  Lock,
} from 'lucide-react'
import { Button } from '../ui/Button.tsx'
import { Badge } from '../ui/Badge.tsx'

export interface TemplatePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'resume' | 'portfolio'
  id: string
  name: string
  categoryLabel: string
  priceFormatted: string
  pricePaise: number
  isFree: boolean
  isOwned: boolean
  isActive: boolean
  description: string
  highlights: string[]
  onSelect: () => void
  onUpgrade?: () => void
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  isOpen,
  onClose,
  type,
  id,
  name,
  categoryLabel,
  priceFormatted,
  isFree,
  isOwned,
  isActive,
  description,
  highlights,
  onSelect,
  onUpgrade,
}) => {
  if (!isOpen) return null

  // Mini visual layout simulation based on template/theme ID
  const renderVisualMockup = () => {
    if (type === 'resume') {
      switch (id) {
        case 'classic-ats':
        case 'classic':
          return (
            <div className="w-full h-56 bg-white border border-[#CBD5E1] rounded-lg p-4 font-serif text-[8px] space-y-2 shadow-xs select-none overflow-hidden">
              <div className="text-center border-b border-[#94A3B8] pb-1.5">
                <div className="font-bold text-xs text-[#0F172A] uppercase tracking-wider">Bhanu Prakash Achari</div>
                <div className="text-[#64748B]">Bengaluru, India • bhanu@dev.local • +91 9876543210</div>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-[9px] uppercase border-b border-[#E2E8F0] text-[#1E293B]">Professional Summary</div>
                <div className="text-[#475569] leading-tight">Software engineer focused on distributed web architectures, high-performance UI systems, and verified clean code design.</div>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-[9px] uppercase border-b border-[#E2E8F0] text-[#1E293B]">Experience</div>
                <div className="flex justify-between font-semibold text-[#0F172A]">
                  <span>Senior Product Engineer — Tech Corp</span>
                  <span className="text-[#64748B]">2024 — Present</span>
                </div>
                <div className="text-[#475569] pl-2">• Architected payment state machines with zero-floating-point integer paise accuracy.</div>
              </div>
            </div>
          )
        case 'minimal':
          return (
            <div className="w-full h-56 bg-white border border-[#E2E8F0] rounded-lg p-4 font-sans text-[8px] space-y-2 shadow-xs select-none overflow-hidden">
              <div className="pb-1">
                <div className="font-light text-sm text-[#0F172A] tracking-tight">Bhanu Prakash</div>
                <div className="text-[#64748B] text-[8px]">Fullstack Engineer • TypeScript, React, PostgreSQL</div>
              </div>
              <div className="space-y-1 pt-1 border-t border-[#F1F5F9]">
                <div className="font-mono text-[8px] text-[#2563EB] uppercase tracking-wider">01 / Experience</div>
                <div className="text-[#334155]">Engineered resilient client-side draft autosave engine with sequence tracking.</div>
              </div>
              <div className="space-y-1 pt-1 border-t border-[#F1F5F9]">
                <div className="font-mono text-[8px] text-[#2563EB] uppercase tracking-wider">02 / Skills</div>
                <div className="flex gap-1 flex-wrap">
                  <span className="bg-[#F8FAFC] px-1 py-0.5 rounded border border-[#E2E8F0]">React 19</span>
                  <span className="bg-[#F8FAFC] px-1 py-0.5 rounded border border-[#E2E8F0]">Node.js</span>
                  <span className="bg-[#F8FAFC] px-1 py-0.5 rounded border border-[#E2E8F0]">Supabase</span>
                </div>
              </div>
            </div>
          )
        case 'technical':
          return (
            <div className="w-full h-56 bg-[#0F172A] text-[#F8FAFC] rounded-lg p-4 font-mono text-[8px] space-y-2 shadow-inner select-none overflow-hidden border border-[#334155]">
              <div className="flex justify-between items-center border-b border-[#334155] pb-1.5">
                <div>
                  <span className="text-emerald-400 font-bold text-xs">$ whoami:</span>
                  <span className="text-white font-bold text-xs ml-1.5">bhanu_prakash</span>
                </div>
                <span className="text-[7px] bg-[#1E293B] text-emerald-400 px-1.5 py-0.5 rounded border border-[#334155]">PRO TECHNICAL</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-[#94A3B8]">// Tech Stack Density</div>
                <div className="flex gap-1 text-[7px]">
                  <span className="bg-[#1E293B] px-1 py-0.5 rounded text-cyan-300">TypeScript</span>
                  <span className="bg-[#1E293B] px-1 py-0.5 rounded text-cyan-300">PostgreSQL</span>
                  <span className="bg-[#1E293B] px-1 py-0.5 rounded text-cyan-300">Docker</span>
                  <span className="bg-[#1E293B] px-1 py-0.5 rounded text-cyan-300">WebCrypto</span>
                </div>
              </div>
              <div className="space-y-0.5 pt-1">
                <div className="text-[#94A3B8]">// Featured Repositories</div>
                <div className="text-emerald-300 font-semibold">pr-builder / core-checkout</div>
                <div className="text-[#CBD5E1] text-[7.5px] leading-tight">Idempotent UPI state machine with zero-charge fulfillment and RFC-4180 CSV export.</div>
              </div>
            </div>
          )
        case 'modern-professional':
        default:
          return (
            <div className="w-full h-56 bg-white border border-[#CBD5E1] rounded-lg overflow-hidden shadow-xs select-none flex flex-col text-[8px]">
              <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white p-3 flex justify-between items-center">
                <div>
                  <div className="font-bold text-xs text-white">Bhanu Prakash Achari</div>
                  <div className="text-cyan-400 text-[8px] font-medium">Senior Software Engineer</div>
                </div>
                <div className="text-right text-[7px] text-[#94A3B8]">
                  <div>bhanu@dev.local</div>
                  <div>Bengaluru, India</div>
                </div>
              </div>
              <div className="p-3 space-y-2 flex-1 bg-white">
                <div>
                  <div className="font-bold text-[8.5px] text-[#0F172A] border-b-2 border-[#2563EB] pb-0.5 inline-block uppercase">Core Competencies</div>
                  <div className="flex gap-1 mt-1 text-[7.5px]">
                    <span className="bg-[#EFF6FF] text-[#2563EB] px-1.5 py-0.5 rounded font-medium">Architecture</span>
                    <span className="bg-[#EFF6FF] text-[#2563EB] px-1.5 py-0.5 rounded font-medium">React & Next.js</span>
                    <span className="bg-[#EFF6FF] text-[#2563EB] px-1.5 py-0.5 rounded font-medium">Supabase RLS</span>
                  </div>
                </div>
                <div className="text-[7.5px] text-[#475569] leading-relaxed">
                  Engineered executive ATS split-header layout with strict single-page print boundary controls and high-contrast typography.
                </div>
              </div>
            </div>
          )
      }
    } else {
      // Portfolio theme preview
      switch (id) {
        case 'developer':
          return (
            <div className="w-full h-56 bg-[#0B0F17] text-white rounded-lg p-3 font-mono text-[8px] space-y-2 border border-[#1E293B] overflow-hidden select-none">
              <div className="flex items-center gap-1.5 pb-2 border-b border-[#1E293B]">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[#64748B] text-[7.5px] ml-1">~/portfolio/terminal</span>
              </div>
              <div className="text-emerald-400">$ cat profile.json</div>
              <div className="text-[#94A3B8] leading-tight">
                {"{"}<br />
                &nbsp;&nbsp;"name": "Bhanu Prakash",<br />
                &nbsp;&nbsp;"title": "Systems & Web Engineer",<br />
                &nbsp;&nbsp;"skills": ["Go", "React", "Rust", "PostgreSQL"]<br />
                {"}"}
              </div>
            </div>
          )
        case 'creative':
          return (
            <div className="w-full h-56 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white rounded-lg p-3 text-[8px] space-y-2 border border-purple-800/40 overflow-hidden select-none">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300 text-xs">STUDIO.DEV</span>
                <span className="bg-pink-500/20 text-pink-300 text-[7px] px-1.5 py-0.5 rounded-full border border-pink-500/30">PRO THEME</span>
              </div>
              <div className="pt-2">
                <div className="text-lg font-black tracking-tight leading-none text-white">Visual Stories & Digital Products</div>
                <div className="text-purple-200/80 text-[7.5px] mt-1">Fullstack craft with micro-interactions and smooth case studies.</div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <div className="p-1.5 rounded-md bg-white/10 backdrop-blur-xs border border-white/10">Project Alpha</div>
                <div className="p-1.5 rounded-md bg-white/10 backdrop-blur-xs border border-white/10">Project Beta</div>
              </div>
            </div>
          )
        case 'midnight':
          return (
            <div className="w-full h-56 bg-[#030712] text-white rounded-lg p-3 text-[8px] space-y-2 border border-[#1F2937] overflow-hidden select-none">
              <div className="flex justify-between items-center border-b border-[#1F2937] pb-1.5">
                <span className="font-bold text-xs tracking-wider text-slate-100">MIDNIGHT</span>
                <span className="text-cyan-400 text-[7px]">DARK SHOWCASE</span>
              </div>
              <div className="text-[#9CA3AF] text-[7.5px]">Curated dark-mode portfolio tuned for high-contrast presentation.</div>
              <div className="p-2 rounded bg-[#111827] border border-[#374151] space-y-1">
                <div className="font-bold text-white text-[8px]">Featured Engineering Project</div>
                <div className="text-[#9CA3AF] text-[7px]">Production payment gateway integration with real-time UPI QR generation.</div>
              </div>
            </div>
          )
        case 'minimal':
        default:
          return (
            <div className="w-full h-56 bg-[#FAFAFA] text-[#111827] rounded-lg p-3 text-[8px] space-y-2 border border-[#E5E5E5] overflow-hidden select-none">
              <div className="border-b border-[#E5E5E5] pb-1 flex justify-between items-baseline">
                <span className="font-semibold text-xs text-black">Bhanu Prakash</span>
                <span className="text-[#737373] text-[7px]">Portfolio</span>
              </div>
              <div className="text-[#525252] text-[7.5px] leading-relaxed">
                Focused editorial layout highlighting projects, writing, and technical experience without distracting clutter.
              </div>
              <div className="pt-1 space-y-1">
                <div className="text-black font-semibold text-[8px]">Selected Work</div>
                <div className="flex justify-between text-[#525252] border-b border-[#F0F0F0] pb-0.5">
                  <span>KaizenQ Platform</span>
                  <span>2026</span>
                </div>
              </div>
            </div>
          )
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col text-[#111827]">
        {/* Header */}
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
              <Eye className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#0F172A]">{name}</h3>
                {isFree ? (
                  <Badge variant="success" size="sm">
                    FREE • {priceFormatted}
                  </Badge>
                ) : (
                  <Badge variant="accent" size="sm">
                    PREMIUM • {priceFormatted}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">{categoryLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
            aria-label="Close preview modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Visual Mockup Frame */}
          <div className="rounded-xl bg-[#F1F5F9] p-3 border border-[#E2E8F0] flex justify-center">
            {renderVisualMockup()}
          </div>

          {/* Description */}
          <p className="text-xs text-[#475569] leading-relaxed">{description}</p>

          {/* Highlights */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Included Features & Specifications
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[#334155]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Box */}
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {isActive ? (
                <>
                  <Check className="w-4 h-4 text-[#2563EB]" />
                  <span className="font-semibold text-[#2563EB]">Currently Active in Your Builder</span>
                </>
              ) : isOwned || isFree ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-emerald-700">
                    {isFree ? '100% Free Forever • Ready to Use' : 'Purchased & Unlocked for Your Account'}
                  </span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span className="font-medium text-[#475569]">
                    Catalog Price: <span className="font-bold text-[#0F172A]">{priceFormatted}</span> (One-time lifetime unlock)
                  </span>
                </>
              )}
            </div>
            <span className="text-[11px] font-mono text-[#64748B]">Zero Data Loss Guaranteed</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-[#64748B]">
            Close Preview
          </Button>

          <div className="flex items-center gap-2">
            {isActive ? (
              <Button variant="outline" size="sm" disabled className="text-xs">
                <Check className="w-3.5 h-3.5 mr-1" />
                Active Selection
              </Button>
            ) : isFree || isOwned ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onSelect()
                  onClose()
                }}
                className="text-xs bg-[#2563EB] hover:bg-[#1D4ED8]"
              >
                Apply This {type === 'resume' ? 'Template' : 'Theme'}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose()
                  onUpgrade?.()
                }}
                className="text-xs font-semibold py-1.5 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all active:scale-[0.98] flex items-center gap-1.5"
              >
                <span>Unlock for {priceFormatted}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
