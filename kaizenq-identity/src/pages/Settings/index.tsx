import React, { useState, useEffect } from 'react'
import { ArrowLeft, Globe, Shield, Bell } from 'lucide-react'
import { Container } from '../../components/ui/Container.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { useAuth } from '../../app/providers/AuthContext.tsx'
import { domainService, type DomainRow } from '../../services/domainService.ts'

export interface SettingsProps {
  onBack?: () => void
}

export const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const { user, isConfigured } = useAuth()
  const [domains, setDomains] = useState<DomainRow[]>([])
  const [recruiterPool, setRecruiterPool] = useState(true)
  const [displayGpa, setDisplayGpa] = useState(true)

  useEffect(() => {
    if (user?.id && isConfigured) {
      domainService.getUserDomains(user.id).then(({ data }) => {
        if (data) setDomains(data)
      })
    }
  }, [user?.id, isConfigured])

  const activeDomain = domains[0]

  return (
    <div className="py-8 sm:py-12 bg-[#F7F9FC] text-[#111827] min-h-screen">
      <Container size="md">
        <div className="flex items-center gap-3 pb-6 border-b border-[#E2E8F0] mb-8">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-white text-[#64748B] hover:text-[#111827] border border-[#E2E8F0] transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Identity & Domain Settings
            </h1>
            <p className="text-xs text-[#64748B]">
              Configure your routing, privacy preferences, and recruiter discovery settings
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Domain Settings */}
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-base font-bold text-[#111827]">Domain Management</h2>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold font-mono text-[#111827]">
                  {activeDomain ? activeDomain.hostname : 'No custom domain connected'}
                </p>
                <p className={`text-xs mt-0.5 ${activeDomain ? 'text-emerald-600' : 'text-[#64748B]'}`}>
                  {activeDomain
                    ? `Status: ${activeDomain.verification_status} • SSL Auto-Provisioning`
                    : 'Draft / Free Subdomain Routing Active'}
                </p>
              </div>
              {activeDomain && (
                <Button variant="outline" size="sm" className="border-[#E2E8F0] text-[#111827]">
                  DNS Records
                </Button>
              )}
            </div>
          </div>

          {/* Recruiter Visibility */}
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-base font-bold text-[#111827]">Privacy & Recruiter Radar</h2>
            </div>
            <div className="space-y-3 text-xs text-[#64748B]">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#111827] cursor-pointer">
                <span>Show in Recruiter Talent Pool</span>
                <input
                  type="checkbox"
                  checked={recruiterPool}
                  onChange={(e) => setRecruiterPool(e.target.checked)}
                  className="w-4 h-4 rounded text-[#2563EB] accent-[#2563EB]"
                />
              </label>
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#111827] cursor-pointer">
                <span>Display contact and portfolio links on public directory</span>
                <input
                  type="checkbox"
                  checked={displayGpa}
                  onChange={(e) => setDisplayGpa(e.target.checked)}
                  className="w-4 h-4 rounded text-[#2563EB] accent-[#2563EB]"
                />
              </label>
            </div>
          </div>

          {/* Notifications */}
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-base font-bold text-[#111827]">Notification Preferences</h2>
            </div>
            <p className="text-xs text-[#64748B]">
              Receive email digests whenever recruiters view your portfolio or download your ATS resume.
            </p>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default Settings
