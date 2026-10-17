import React, { useState, useRef } from 'react'
import {
  MapPin,
  Building,
  Award,
  Save,
  Check,
  Plus,
  Camera,
  AlertCircle,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button.tsx'
import { Badge } from '../../../components/ui/Badge.tsx'
import { useAuth } from '../../../app/providers/AuthContext.tsx'
import { profileService } from '../../../services/profileService.ts'
import type { DemoStudentData } from '../types.ts'

export interface ProfileViewProps {
  student: DemoStudentData
  onOpenFullBuilder: () => void
}

export const ProfileView: React.FC<ProfileViewProps> = ({ student, onOpenFullBuilder }) => {
  const { user, profile, refreshProfile } = useAuth()
  const [headline, setHeadline] = useState(profile?.headline || student.role)
  const [bio, setBio] = useState(profile?.bio || student.bio)
  const [skills, setSkills] = useState<string[]>([...student.skills])
  const [newSkill, setNewSkill] = useState('')
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

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

  const handleSave = async () => {
    setErrorMsg(null)
    setIsSaving(true)

    try {
      if (user?.id) {
        const { error } = await profileService.updateProfile(user.id, {
          headline: headline.trim() || null,
          bio: bio.trim() || null,
        })
        if (error) throw error
        await refreshProfile()
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save profile changes.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WebP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Avatar file size must be less than 5MB.')
      return
    }

    setIsUploadingAvatar(true)
    setErrorMsg(null)

    try {
      const { publicUrl, error } = await profileService.uploadAvatar(user.id, file)
      if (error || !publicUrl) {
        throw error || new Error('Upload failed.')
      }

      await profileService.updateProfile(user.id, {
        avatar_path: publicUrl,
      })

      await refreshProfile()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Avatar upload failed.')
    } finally {
      setIsUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const displayName = profile?.display_name || student.name
  const displayLocation = profile?.location || student.location
  const avatarUrl = profile?.avatar_path

  return (
    <div className="space-y-6">
      {/* Top Profile Summary Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm relative">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Avatar Circle with Upload Trigger */}
            <div className="relative group shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#BFDBFE] shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#EFF6FF] border-2 border-[#BFDBFE] flex items-center justify-center text-xl sm:text-2xl font-bold font-mono text-[#2563EB] shadow-sm">
                  {student.avatarInitials}
                </div>
              )}

              {user?.id && (
                <>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                    disabled={isUploadingAvatar}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute inset-0 rounded-2xl bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs gap-1 cursor-pointer"
                    title="Change Avatar"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-[#111827]">
                  {displayName}
                </h2>
                <Badge variant="cyan" size="sm">
                  {student.completion.profile}% Complete
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748B]">
                {student.institution ? (
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>{student.institution}</span>
                  </span>
                ) : null}
                {displayLocation ? (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>{displayLocation}</span>
                  </span>
                ) : null}
              </div>

              {student.handle ? (
                <div className="pt-1 flex items-center gap-2 text-xs font-mono text-[#2563EB]">
                  <span>Handle: {student.handle}</span>
                  <span>•</span>
                  <span className="text-emerald-600">Authenticated Profile</span>
                </div>
              ) : null}
            </div>
          </div>

          <Button variant="glow" size="sm" onClick={onOpenFullBuilder}>
            Launch Full Studio
          </Button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Profile Editor Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Fields */}
        <div className="lg:col-span-2 space-y-5 p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="pb-3 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#111827]">Professional Bio & Positioning</h3>
            {saved && (
              <span className="text-xs font-mono text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Changes Saved to Cloud</span>
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#64748B] mb-1.5">
              Professional Role & Target Title
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#2563EB] focus:bg-white"
              placeholder="e.g. Senior Frontend Engineer | TypeScript & Cloud"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#64748B] mb-1.5">
              Identity Bio Summary
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#2563EB] focus:bg-white leading-relaxed"
              placeholder="Tell hiring managers and collaborators about your focus and experience..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#64748B] mb-2">
              Verified Technical Stack ({skills.length} skills)
            </label>

            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-3">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#EFF6FF] text-xs font-mono text-[#2563EB] border border-[#BFDBFE]"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-[#64748B] hover:text-red-500 cursor-pointer text-xs"
                      aria-label={`Remove ${skill}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#64748B] italic mb-3">
                No skills added yet. Type a technology below and click Add.
              </p>
            )}

            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input
                type="text"
                placeholder="Add skill (e.g. GraphQL, Kubernetes)..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB] focus:bg-white"
              />
              <Button variant="outline" size="sm" type="submit" leftIcon={<Plus className="w-3.5 h-3.5" />} className="border-[#E2E8F0] text-[#111827]">
                Add
              </Button>
            </form>
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] flex justify-end">
            <Button
              variant="glow"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              leftIcon={saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            >
              {saved ? 'Saved Successfully' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Right Col: Account & Security Card */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
              <Award className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-[#111827]">Account & Security</h3>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[11px] text-[#64748B] block">Account Email</span>
                <span className="text-xs font-semibold text-[#111827] font-mono break-all">
                  {user?.email || 'Guest Session'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[11px] text-[#64748B] block">Authentication Provider</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#111827]">
                    {user ? 'Supabase Auth' : 'Local Sandbox'}
                  </span>
                  <Badge variant={user ? 'cyan' : 'default'} size="sm">
                    {user ? 'Active' : 'Offline'}
                  </Badge>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[11px] text-[#64748B] block">Data Isolation</span>
                <span className="text-xs text-emerald-600 font-mono flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>RLS Enforced</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileView
