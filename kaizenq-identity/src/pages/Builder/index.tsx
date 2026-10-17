import React, { useState } from 'react'
import {
  Save,
  Check,
  Plus,
  Trash2,
  GitBranch,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'
import { Container } from '../../components/ui/Container.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { useAuth } from '../../app/providers/AuthContext.tsx'

export interface BuilderProps {
  onBack?: () => void
}

export const Builder: React.FC<BuilderProps> = ({ onBack }) => {
  const { user, profile } = useAuth()
  const [headline, setHeadline] = useState(profile?.headline || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [saved, setSaved] = useState(false)

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove))
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="py-8 sm:py-12 bg-[#F7F9FC] text-[#111827]">
      <Container size="lg">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between pb-6 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-white text-[#64748B] hover:text-[#111827] border border-[#E2E8F0] shadow-xs cursor-pointer"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-['Inter',sans-serif] text-[#111827]">
                Identity & Portfolio Builder
              </h1>
              <p className="text-xs text-[#64748B]">
                Configure the master record that powers your resume, portfolio and domain
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            leftIcon={saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          >
            {saved ? 'Saved Successfully' : 'Save Changes'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
              <h2 className="text-base font-bold text-[#111827] font-['Inter',sans-serif]">
                Professional Headline & Target Role
              </h2>

              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                  Headline (Displayed in Hero & Resume Title)
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                  Professional Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            {/* Technical Skills Manager */}
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#111827] font-['Inter',sans-serif]">
                  Core Technologies & Skills
                </h2>
                <span className="text-xs text-[#64748B] font-mono">{skills.length} skills listed</span>
              </div>

              <form onSubmit={handleAddSkill} className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="e.g. Next.js, PyTorch, Docker"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
                <Button variant="secondary" size="sm" type="submit" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Add
                </Button>
              </form>

              <div className="flex flex-wrap gap-2 pt-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#EFF6FF] text-xs font-medium text-[#2563EB] border border-[#BFDBFE]"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-[#64748B] hover:text-rose-500 p-0.5 cursor-pointer"
                      aria-label={`Remove ${skill}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Tools */}
          <div className="space-y-6">
            {/* GitHub Sync Status */}
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#111827]">Account Status</h3>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Identity profile synced with Supabase storage and Row-Level Security.
              </p>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono text-[#64748B]">
                Account: <span className="text-[#2563EB] font-medium">{user?.email || 'Guest User'}</span>
              </div>
            </div>

            {/* Quick Domain Preview */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#EFF6FF] to-white border border-[#BFDBFE] shadow-sm space-y-3">
              <div className="flex items-center gap-1.5 text-xs text-[#2563EB] font-mono font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Custom Domain</span>
              </div>
              <p className="text-sm font-bold font-mono text-[#111827]">
                {profile?.display_name ? `${profile.display_name.toLowerCase().replace(/\s+/g, '-')}.kaizenq.id` : 'No custom domain connected'}
              </p>
              <p className="text-xs text-[#64748B]">
                Configure domain records in Settings to route custom domains.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default Builder
