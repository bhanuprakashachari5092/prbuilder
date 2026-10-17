import React, { useState } from 'react'
import {
  User,
  Code2,
  FolderGit2,
  Briefcase,
  GraduationCap,
  Award,
  Send,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Sliders,
  ShieldCheck,
  Upload,
  Camera,
  X,
  Download,
  Sparkles,
} from 'lucide-react'
import { Button } from '../../../../components/ui/Button.tsx'
import { PortfolioDownloadButton } from '../../../../components/download/PortfolioDownloadButton.tsx'
import { hasSufficientPortfolioContent } from '../../../../services/portfolioExportService.ts'
import { validatePortfolio } from '../../validation.ts'
import { useAuth } from '../../../../app/providers/AuthContext.tsx'
import { profileService } from '../../../../services/profileService.ts'
import { portfolioService } from '../../../../services/portfolioService.ts'
import type {
  PortfolioData,
  PersonalProfile,
  PortfolioEducation,
  PortfolioProject,
  PortfolioExperience,
  PortfolioAchievement,
  PortfolioCertification,
  PortfolioSocialLink,
  SectionVisibility,
} from '../../types.ts'

export interface PortfolioEditorProps {
  data: PortfolioData
  onChange: (updated: PortfolioData) => void
  onOpenCompletionModal?: () => void
}

type AccordionSection =
  | 'visibility'
  | 'profile'
  | 'skills'
  | 'projects'
  | 'experience'
  | 'education'
  | 'achievements'
  | 'contact'

export const PortfolioEditor: React.FC<PortfolioEditorProps> = ({ data, onChange, onOpenCompletionModal }) => {
  const [openSection, setOpenSection] = useState<AccordionSection>('profile')

  // Real-time validation issues for inline display
  const validation = validatePortfolio(data)

  const { user } = useAuth()
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null)
  const [projectUploadingId, setProjectUploadingId] = useState<string | null>(null)
  const [projectUploadError, setProjectUploadError] = useState<{ id: string; message: string } | null>(null)

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setAvatarUploadError('Please select a valid image file (PNG, JPG, WebP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarUploadError('Avatar file must be less than 5MB.')
      return
    }

    setAvatarUploadError(null)
    setAvatarUploading(true)

    try {
      if (user?.id) {
        const { publicUrl, error } = await profileService.uploadAvatar(user.id, file)
        if (error || !publicUrl) throw error || new Error('Upload failed')
        updateProfile('photoUrl', publicUrl)
      } else {
        const reader = new FileReader()
        reader.onload = (event) => {
          if (event.target?.result) {
            updateProfile('photoUrl', String(event.target.result))
          }
        }
        reader.readAsDataURL(file)
      }
    } catch (err: unknown) {
      setAvatarUploadError(err instanceof Error ? err.message : 'Avatar upload failed.')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleProjectImageFile = async (projId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setProjectUploadError({ id: projId, message: 'Please select a valid image file.' })
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      setProjectUploadError({ id: projId, message: 'Project image must be less than 8MB.' })
      return
    }

    setProjectUploadError(null)
    setProjectUploadingId(projId)

    try {
      if (user?.id) {
        const { publicUrl, error } = await portfolioService.uploadProjectImage(user.id, file)
        if (error || !publicUrl) throw error || new Error('Upload failed')
        updateProject(projId, { imageUrl: publicUrl })
      } else {
        const reader = new FileReader()
        reader.onload = (event) => {
          if (event.target?.result) {
            updateProject(projId, { imageUrl: String(event.target.result) })
          }
        }
        reader.readAsDataURL(file)
      }
    } catch (err: unknown) {
      setProjectUploadError({ id: projId, message: err instanceof Error ? err.message : 'Project image upload failed.' })
    } finally {
      setProjectUploadingId(null)
    }
  }

  // Temporary skill tag inputs
  const [newLang, setNewLang] = useState('')
  const [newFramework, setNewFramework] = useState('')
  const [newTool, setNewTool] = useState('')
  const [newOther, setNewOther] = useState('')

  // New social link temporary inputs
  const [newSocialPlatform, setNewSocialPlatform] = useState('')
  const [newSocialUrl, setNewSocialUrl] = useState('')

  // Profile updaters
  const updateProfile = (field: keyof PersonalProfile, value: string) => {
    onChange({
      ...data,
      profile: {
        ...data.profile,
        [field]: value,
      },
    })
  }

  // Section visibility updater
  const toggleVisibility = (section: keyof SectionVisibility) => {
    onChange({
      ...data,
      sectionVisibility: {
        ...data.sectionVisibility,
        [section]: !data.sectionVisibility[section],
      },
    })
  }

  // Skills helpers
  const addTag = (category: keyof PortfolioData['skills'], val: string, clearFn: () => void) => {
    const trimmed = val.trim()
    if (!trimmed || data.skills[category].includes(trimmed)) return
    onChange({
      ...data,
      skills: {
        ...data.skills,
        [category]: [...data.skills[category], trimmed],
      },
    })
    clearFn()
  }

  const removeTag = (category: keyof PortfolioData['skills'], tagToRemove: string) => {
    onChange({
      ...data,
      skills: {
        ...data.skills,
        [category]: data.skills[category].filter((t) => t !== tagToRemove),
      },
    })
  }

  const moveTag = (
    category: keyof PortfolioData['skills'],
    index: number,
    direction: 'left' | 'right',
  ) => {
    const arr = [...data.skills[category]]
    const targetIdx = direction === 'left' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= arr.length) return
    const temp = arr[index]
    arr[index] = arr[targetIdx]
    arr[targetIdx] = temp
    onChange({
      ...data,
      skills: {
        ...data.skills,
        [category]: arr,
      },
    })
  }

  // Projects helpers
  const addProject = () => {
    const newProj: PortfolioProject = {
      id: `proj-${Date.now()}`,
      title: 'New Engineering Project',
      description: 'Comprehensive description of architecture, system decisions, and performance metrics.',
      technologies: ['TypeScript', 'React'],
      githubUrl: '',
      liveUrl: '',
      imageUrl: '',
    }
    onChange({
      ...data,
      projects: [...data.projects, newProj],
    })
  }

  const updateProject = (id: string, updates: Partial<PortfolioProject>) => {
    onChange({
      ...data,
      projects: data.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })
  }

  const removeProject = (id: string) => {
    onChange({
      ...data,
      projects: data.projects.filter((p) => p.id !== id),
    })
  }

  const moveProject = (index: number, direction: 'up' | 'down') => {
    const newProjects = [...data.projects]
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= newProjects.length) return
    const temp = newProjects[index]
    newProjects[index] = newProjects[targetIdx]
    newProjects[targetIdx] = temp
    onChange({
      ...data,
      projects: newProjects,
    })
  }

  // Experience helpers
  const addExperience = () => {
    const newExp: PortfolioExperience = {
      id: `exp-${Date.now()}`,
      organization: 'Tech Organization',
      role: 'Software Engineer',
      startDate: '2024',
      endDate: 'Present',
      description: 'Designed and deployed scalable services, reducing response latency by 35%.',
    }
    onChange({
      ...data,
      experience: [...data.experience, newExp],
    })
  }

  const updateExperience = (id: string, updates: Partial<PortfolioExperience>) => {
    onChange({
      ...data,
      experience: data.experience.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })
  }

  const removeExperience = (id: string) => {
    onChange({
      ...data,
      experience: data.experience.filter((e) => e.id !== id),
    })
  }

  const moveExperience = (index: number, direction: 'up' | 'down') => {
    const newExp = [...data.experience]
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= newExp.length) return
    const temp = newExp[index]
    newExp[index] = newExp[targetIdx]
    newExp[targetIdx] = temp
    onChange({
      ...data,
      experience: newExp,
    })
  }

  // Education helpers
  const addEducation = () => {
    const newEdu: PortfolioEducation = {
      id: `edu-${Date.now()}`,
      institution: 'University / Institute',
      degree: 'Bachelor of Technology',
      specialization: 'Computer Science & Engineering',
      startDate: '2022',
      endDate: '2026',
      grade: '8.8 / 10 CGPA',
    }
    onChange({
      ...data,
      education: [...data.education, newEdu],
    })
  }

  const updateEducation = (id: string, updates: Partial<PortfolioEducation>) => {
    onChange({
      ...data,
      education: data.education.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })
  }

  const removeEducation = (id: string) => {
    onChange({
      ...data,
      education: data.education.filter((e) => e.id !== id),
    })
  }

  const moveEducation = (index: number, direction: 'up' | 'down') => {
    const newEdu = [...data.education]
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= newEdu.length) return
    const temp = newEdu[index]
    newEdu[index] = newEdu[targetIdx]
    newEdu[targetIdx] = temp
    onChange({
      ...data,
      education: newEdu,
    })
  }

  // Achievements & Certifications helpers
  const addAchievement = () => {
    const newAch: PortfolioAchievement = {
      id: `ach-${Date.now()}`,
      title: 'Technical Achievement / Award',
      description: 'Built decentralized application solving latency bottlenecks.',
    }
    onChange({
      ...data,
      achievements: [...data.achievements, newAch],
    })
  }

  const updateAchievement = (id: string, updates: Partial<PortfolioAchievement>) => {
    onChange({
      ...data,
      achievements: data.achievements.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })
  }

  const removeAchievement = (id: string) => {
    onChange({
      ...data,
      achievements: data.achievements.filter((a) => a.id !== id),
    })
  }

  const moveAchievement = (index: number, direction: 'up' | 'down') => {
    const newAch = [...data.achievements]
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= newAch.length) return
    const temp = newAch[index]
    newAch[index] = newAch[targetIdx]
    newAch[targetIdx] = temp
    onChange({
      ...data,
      achievements: newAch,
    })
  }

  const addCertification = () => {
    const newCert: PortfolioCertification = {
      id: `cert-${Date.now()}`,
      name: 'Cloud / Developer Certification',
      issuer: 'Issuing Body',
      issueDate: '2025',
      credentialUrl: '',
    }
    onChange({
      ...data,
      certifications: [...data.certifications, newCert],
    })
  }

  const updateCertification = (id: string, updates: Partial<PortfolioCertification>) => {
    onChange({
      ...data,
      certifications: data.certifications.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })
  }

  const removeCertification = (id: string) => {
    onChange({
      ...data,
      certifications: data.certifications.filter((c) => c.id !== id),
    })
  }

  const moveCertification = (index: number, direction: 'up' | 'down') => {
    const newCert = [...data.certifications]
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= newCert.length) return
    const temp = newCert[index]
    newCert[index] = newCert[targetIdx]
    newCert[targetIdx] = temp
    onChange({
      ...data,
      certifications: newCert,
    })
  }

  // Social Links helpers
  const addSocialLink = () => {
    if (!newSocialPlatform.trim() || !newSocialUrl.trim()) return
    const newLink: PortfolioSocialLink = {
      id: `social-${Date.now()}`,
      platform: newSocialPlatform.trim(),
      url: newSocialUrl.trim(),
    }
    onChange({
      ...data,
      contact: {
        ...data.contact,
        socialLinks: [...data.contact.socialLinks, newLink],
      },
    })
    setNewSocialPlatform('')
    setNewSocialUrl('')
  }

  const removeSocialLink = (id: string) => {
    onChange({
      ...data,
      contact: {
        ...data.contact,
        socialLinks: data.contact.socialLinks.filter((s) => s.id !== id),
      },
    })
  }

  return (
    <div className="space-y-4 select-none text-[#111827]">
      {/* 0. Section Visibility Quick Controls */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <button
          onClick={() => setOpenSection(openSection === 'visibility' ? 'profile' : 'visibility')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#111827] block">
                Section Visibility Controls
              </span>
              <span className="text-[11px] text-[#64748B]">
                Manage public sections shown on your portfolio
              </span>
            </div>
          </div>
          {openSection === 'visibility' ? (
            <ChevronUp className="w-4 h-4 text-[#64748B]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          )}
        </button>

        {openSection === 'visibility' && (
          <div className="p-4 border-t border-[#E2E8F0] bg-white space-y-3">
            <p className="text-[11px] text-[#64748B]">
              Toggle which sections appear on your portfolio:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {(
                [
                  ['about', 'About Me'],
                  ['skills', 'Skills'],
                  ['projects', 'Projects'],
                  ['experience', 'Experience'],
                  ['education', 'Education'],
                  ['achievements', 'Achievements'],
                  ['certifications', 'Certifications'],
                  ['contact', 'Contact'],
                ] as const
              ).map(([key, label]) => {
                const isVisible = data.sectionVisibility[key]
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleVisibility(key)}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                      isVisible
                        ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE] font-semibold'
                        : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] opacity-60 line-through'
                    }`}
                  >
                    <span>{label}</span>
                    {isVisible ? (
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 1. Profile & Identity Section */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <button
          onClick={() => setOpenSection(openSection === 'profile' ? 'skills' : 'profile')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#111827] block">
                Profile & Personal Identity
              </span>
              <span className="text-[11px] text-[#64748B]">
                Name, headline, bio, and professional links
              </span>
            </div>
          </div>
          {openSection === 'profile' ? (
            <ChevronUp className="w-4 h-4 text-[#64748B]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          )}
        </button>

        {openSection === 'profile' && (
          <div className="p-4 sm:p-5 border-t border-[#E2E8F0] bg-white space-y-4">
            {/* Privacy Protection Notice */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#64748B]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
              <span>Privacy protected: No government IDs or street addresses required.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={data.profile.fullName}
                  onChange={(e) => updateProfile('fullName', e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className={`w-full bg-[#F8FAFC] border rounded-xl px-3 py-2 text-xs sm:text-sm text-[#111827] focus:outline-none ${
                    !data.profile.fullName.trim()
                      ? 'border-amber-500/40 focus:border-amber-400'
                      : 'border-[#E2E8F0] focus:border-[#2563EB]'
                  }`}
                />
                {!data.profile.fullName.trim() && (
                  <p className="text-[10px] text-amber-400/90 mt-1">Full name is required for your portfolio title.</p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                  Professional Title / Headline *
                </label>
                <input
                  type="text"
                  value={data.profile.title}
                  onChange={(e) => updateProfile('title', e.target.value)}
                  placeholder="e.g. Full-Stack & Systems Engineer"
                  className={`w-full bg-[#F8FAFC] border rounded-xl px-3 py-2 text-xs sm:text-sm text-[#111827] focus:outline-none ${
                    !data.profile.title.trim()
                      ? 'border-amber-500/40 focus:border-amber-400'
                      : 'border-[#E2E8F0] focus:border-[#2563EB]'
                  }`}
                />
                {!data.profile.title.trim() && (
                  <p className="text-[10px] text-amber-400/90 mt-1">Professional title is recommended.</p>
                )}
              </div>

              <div className="sm:col-span-2 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-[#64748B] block">
                    Profile Avatar / Photo (max 5MB)
                  </label>
                  {data.profile.photoUrl && (
                    <button
                      type="button"
                      onClick={() => updateProfile('photoUrl', '')}
                      className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Remove
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {data.profile.photoUrl ? (
                    <img
                      src={data.profile.photoUrl}
                      alt="Avatar Preview"
                      className="w-14 h-14 rounded-xl object-cover border border-[#BFDBFE] shrink-0 shadow-md"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-white border border-dashed border-[#BFDBFE] flex items-center justify-center text-white/30 shrink-0">
                      <Camera className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-[#E2E8F0] text-xs text-white font-medium flex items-center gap-1.5 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{avatarUploading ? 'Uploading to cloud...' : 'Upload Image File'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFile}
                          disabled={avatarUploading}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-white/40">or enter direct URL</span>
                    </div>

                    <input
                      type="url"
                      value={data.profile.photoUrl || ''}
                      onChange={(e) => updateProfile('photoUrl', e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>
                </div>

                {avatarUploadError && (
                  <p className="text-[10px] text-rose-400">{avatarUploadError}</p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                  Location (City, Country)
                </label>
                <input
                  type="text"
                  value={data.profile.location || ''}
                  onChange={(e) => updateProfile('location', e.target.value)}
                  placeholder="Bangalore, India"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#111827] focus:border-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={data.profile.email || ''}
                  onChange={(e) => updateProfile('email', e.target.value)}
                  placeholder="alex@example.com"
                  className={`w-full bg-[#F8FAFC] border rounded-xl px-3 py-2 text-xs sm:text-sm text-[#111827] focus:outline-none ${
                    validation.emailError
                      ? 'border-red-500/70 focus:border-red-400'
                      : 'border-[#E2E8F0] focus:border-[#2563EB]'
                  }`}
                />
                {validation.emailError && (
                  <p className="text-[11px] text-red-400 mt-1">{validation.emailError}</p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                  Portfolio Slug (URL handle) *
                </label>
                <input
                  type="text"
                  value={data.profile.slug}
                  onChange={(e) =>
                    updateProfile('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                  }
                  placeholder="alex-morgan"
                  className={`w-full bg-[#F8FAFC] border rounded-xl px-3 py-2 text-xs sm:text-sm text-[#111827] focus:outline-none font-mono ${
                    validation.slugError
                      ? 'border-red-500/70 focus:border-red-400'
                      : 'border-[#E2E8F0] focus:border-[#2563EB]'
                  }`}
                />
                {validation.slugError && (
                  <p className="text-[11px] text-red-400 mt-1">{validation.slugError}</p>
                )}
              </div>
            </div>

            {/* Links Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div>
                <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                  GitHub Profile URL
                </label>
                <input
                  type="url"
                  value={data.profile.githubUrl || ''}
                  onChange={(e) => updateProfile('githubUrl', e.target.value)}
                  placeholder="https://github.com/username"
                  className={`w-full bg-[#F8FAFC] border rounded-xl px-3 py-2 text-xs sm:text-sm text-[#111827] focus:outline-none font-mono ${
                    validation.githubError
                      ? 'border-red-500/70 focus:border-red-400'
                      : 'border-[#E2E8F0] focus:border-[#2563EB]'
                  }`}
                />
                {validation.githubError && (
                  <p className="text-[11px] text-red-400 mt-1">{validation.githubError}</p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  value={data.profile.linkedinUrl || ''}
                  onChange={(e) => updateProfile('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className={`w-full bg-[#F8FAFC] border rounded-xl px-3 py-2 text-xs sm:text-sm text-[#111827] focus:outline-none font-mono ${
                    validation.linkedinError
                      ? 'border-red-500/70 focus:border-red-400'
                      : 'border-[#E2E8F0] focus:border-[#2563EB]'
                  }`}
                />
                {validation.linkedinError && (
                  <p className="text-[11px] text-red-400 mt-1">{validation.linkedinError}</p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                  Personal Website URL
                </label>
                <input
                  type="url"
                  value={data.profile.portfolioUrl || ''}
                  onChange={(e) => updateProfile('portfolioUrl', e.target.value)}
                  placeholder="https://alexmorgan.dev"
                  className={`w-full bg-[#F8FAFC] border rounded-xl px-3 py-2 text-xs sm:text-sm text-[#111827] focus:outline-none font-mono ${
                    validation.portfolioUrlError
                      ? 'border-red-500/70 focus:border-red-400'
                      : 'border-[#E2E8F0] focus:border-[#2563EB]'
                  }`}
                />
                {validation.portfolioUrlError && (
                  <p className="text-[11px] text-red-400 mt-1">{validation.portfolioUrlError}</p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                  X / Twitter Handle URL
                </label>
                <input
                  type="url"
                  value={data.profile.twitterUrl || ''}
                  onChange={(e) => updateProfile('twitterUrl', e.target.value)}
                  placeholder="https://x.com/username"
                  className={`w-full bg-[#F8FAFC] border rounded-xl px-3 py-2 text-xs sm:text-sm text-[#111827] focus:outline-none font-mono ${
                    validation.twitterUrlError
                      ? 'border-red-500/70 focus:border-red-400'
                      : 'border-[#E2E8F0] focus:border-[#2563EB]'
                  }`}
                />
                {validation.twitterUrlError && (
                  <p className="text-[11px] text-red-400 mt-1">{validation.twitterUrlError}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                  Resume Download URL (optional link to hosted PDF or Drive)
                </label>
                <input
                  type="url"
                  value={data.profile.resumeUrl || ''}
                  onChange={(e) => updateProfile('resumeUrl', e.target.value)}
                  placeholder="https://example.com/resume.pdf"
                  className={`w-full bg-[#F8FAFC] border rounded-xl px-3 py-2 text-xs sm:text-sm text-[#111827] focus:outline-none font-mono ${
                    validation.resumeUrlError
                      ? 'border-red-500/70 focus:border-red-400'
                      : 'border-[#E2E8F0] focus:border-[#2563EB]'
                  }`}
                />
                {validation.resumeUrlError && (
                  <p className="text-[11px] text-red-400 mt-1">{validation.resumeUrlError}</p>
                )}
              </div>
            </div>

            {/* Bios */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                  Short Hero Elevator Pitch (1-2 sentences)
                </label>
                <textarea
                  rows={2}
                  value={data.profile.shortBio}
                  onChange={(e) => updateProfile('shortBio', e.target.value)}
                  placeholder="B.Tech CSE student passionate about distributed architectures and low-latency APIs..."
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#111827] focus:border-[#2563EB] focus:outline-none resize-y leading-relaxed"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                  Detailed About Me Description
                </label>
                <textarea
                  rows={4}
                  value={data.profile.aboutMe}
                  onChange={(e) => updateProfile('aboutMe', e.target.value)}
                  placeholder="Share your engineering background, favorite tools, architectural interests, and recent projects..."
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#111827] focus:border-[#2563EB] focus:outline-none resize-y leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Technical Skills Section */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <button
          onClick={() => setOpenSection(openSection === 'skills' ? 'projects' : 'skills')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
              <Code2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#111827] block">
                Technical Skills & Tools
              </span>
              <span className="text-[11px] text-[#64748B]">
                Categorized languages, frameworks, platforms, and competencies
              </span>
            </div>
          </div>
          {openSection === 'skills' ? (
            <ChevronUp className="w-4 h-4 text-[#64748B]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          )}
        </button>

        {openSection === 'skills' && (
          <div className="p-4 sm:p-5 border-t border-[#E2E8F0] bg-white space-y-4">
            {/* Languages */}
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-[#64748B] block">
                Programming Languages
              </label>
              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                {data.skills.languages.map((t, idx) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#EFF6FF] text-xs font-mono text-[#111827] border border-[#E2E8F0]"
                  >
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => moveTag('languages', idx, 'left')}
                        className="text-[#64748B] hover:text-[#111827] cursor-pointer text-[10px]"
                        title="Move tag left"
                        aria-label={`Move ${t} left`}
                      >
                        ◀
                      </button>
                    )}
                    <span>{t}</span>
                    {idx < data.skills.languages.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveTag('languages', idx, 'right')}
                        className="text-[#64748B] hover:text-[#111827] cursor-pointer text-[10px]"
                        title="Move tag right"
                        aria-label={`Move ${t} right`}
                      >
                        ▶
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeTag('languages', t)}
                      className="text-[#64748B] hover:text-red-400 cursor-pointer ml-0.5"
                      title="Remove skill"
                      aria-label={`Remove ${t}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLang}
                  onChange={(e) => setNewLang(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag('languages', newLang, () => setNewLang(''))
                    }
                  }}
                  placeholder="e.g. TypeScript, Python, Go..."
                  className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addTag('languages', newLang, () => setNewLang(''))}
                  className="text-xs border-[#E2E8F0] text-white"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Frameworks */}
            <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
              <label className="text-[11px] font-medium text-[#64748B] block">
                Frameworks & Libraries
              </label>
              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                {data.skills.frameworks.map((t, idx) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#EFF6FF] text-xs font-mono text-[#111827] border border-[#E2E8F0]"
                  >
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => moveTag('frameworks', idx, 'left')}
                        className="text-[#64748B] hover:text-[#111827] cursor-pointer text-[10px]"
                        title="Move tag left"
                        aria-label={`Move ${t} left`}
                      >
                        ◀
                      </button>
                    )}
                    <span>{t}</span>
                    {idx < data.skills.frameworks.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveTag('frameworks', idx, 'right')}
                        className="text-[#64748B] hover:text-[#111827] cursor-pointer text-[10px]"
                        title="Move tag right"
                        aria-label={`Move ${t} right`}
                      >
                        ▶
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeTag('frameworks', t)}
                      className="text-[#64748B] hover:text-red-400 cursor-pointer ml-0.5"
                      title="Remove skill"
                      aria-label={`Remove ${t}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFramework}
                  onChange={(e) => setNewFramework(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag('frameworks', newFramework, () => setNewFramework(''))
                    }
                  }}
                  placeholder="e.g. React, Next.js, FastAPI..."
                  className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addTag('frameworks', newFramework, () => setNewFramework(''))}
                  className="text-xs border-[#E2E8F0] text-white"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Tools */}
            <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
              <label className="text-[11px] font-medium text-[#64748B] block">
                Tools & Platforms
              </label>
              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                {data.skills.tools.map((t, idx) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#EFF6FF] text-xs font-mono text-[#111827] border border-[#E2E8F0]"
                  >
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => moveTag('tools', idx, 'left')}
                        className="text-[#64748B] hover:text-[#111827] cursor-pointer text-[10px]"
                        title="Move tag left"
                        aria-label={`Move ${t} left`}
                      >
                        ◀
                      </button>
                    )}
                    <span>{t}</span>
                    {idx < data.skills.tools.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveTag('tools', idx, 'right')}
                        className="text-[#64748B] hover:text-[#111827] cursor-pointer text-[10px]"
                        title="Move tag right"
                        aria-label={`Move ${t} right`}
                      >
                        ▶
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeTag('tools', t)}
                      className="text-[#64748B] hover:text-red-400 cursor-pointer ml-0.5"
                      title="Remove skill"
                      aria-label={`Remove ${t}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTool}
                  onChange={(e) => setNewTool(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag('tools', newTool, () => setNewTool(''))
                    }
                  }}
                  placeholder="e.g. Docker, PostgreSQL, Git, Redis..."
                  className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addTag('tools', newTool, () => setNewTool(''))}
                  className="text-xs border-[#E2E8F0] text-white"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Core Competencies */}
            <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
              <label className="text-[11px] font-medium text-[#64748B] block">
                Core Concepts & Other Competencies
              </label>
              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                {data.skills.otherSkills.map((t, idx) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#EFF6FF] text-xs font-mono text-[#111827] border border-[#E2E8F0]"
                  >
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => moveTag('otherSkills', idx, 'left')}
                        className="text-[#64748B] hover:text-[#111827] cursor-pointer text-[10px]"
                        title="Move tag left"
                        aria-label={`Move ${t} left`}
                      >
                        ◀
                      </button>
                    )}
                    <span>{t}</span>
                    {idx < data.skills.otherSkills.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveTag('otherSkills', idx, 'right')}
                        className="text-[#64748B] hover:text-[#111827] cursor-pointer text-[10px]"
                        title="Move tag right"
                        aria-label={`Move ${t} right`}
                      >
                        ▶
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeTag('otherSkills', t)}
                      className="text-[#64748B] hover:text-red-400 cursor-pointer ml-0.5"
                      title="Remove skill"
                      aria-label={`Remove ${t}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOther}
                  onChange={(e) => setNewOther(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag('otherSkills', newOther, () => setNewOther(''))
                    }
                  }}
                  placeholder="e.g. Distributed Systems, System Architecture..."
                  className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addTag('otherSkills', newOther, () => setNewOther(''))}
                  className="text-xs border-[#E2E8F0] text-white"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Featured Engineering Projects */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <button
          onClick={() => setOpenSection(openSection === 'projects' ? 'experience' : 'projects')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
              <FolderGit2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#111827] block">
                Featured Engineering Projects
              </span>
              <span className="text-[11px] text-[#64748B]">
                {data.projects.length} {data.projects.length === 1 ? 'project' : 'projects'} configured
              </span>
            </div>
          </div>
          {openSection === 'projects' ? (
            <ChevronUp className="w-4 h-4 text-[#64748B]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          )}
        </button>

        {openSection === 'projects' && (
          <div className="p-4 sm:p-5 border-t border-[#E2E8F0] bg-white space-y-4">
            {data.projects.length === 0 ? (
              <div className="text-center py-6 px-4 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E2E8F0] space-y-2">
                <p className="text-xs text-[#64748B]">No engineering projects added yet.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addProject}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="text-xs border-[#E2E8F0] text-white"
                >
                  Add First Project
                </Button>
              </div>
            ) : (
              data.projects.map((proj, idx) => (
                <div
                  key={proj.id}
                  className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-[#2563EB]">
                      Project #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveProject(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-[#64748B] hover:text-[#111827] disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveProject(idx, 'down')}
                        disabled={idx === data.projects.length - 1}
                        className="p-1 text-[#64748B] hover:text-[#111827] disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeProject(proj.id)}
                        className="p-1 text-rose-400 hover:text-rose-300 ml-1 cursor-pointer"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                        Project Title *
                      </label>
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) => updateProject(proj.id, { title: e.target.value })}
                        placeholder="Project Name"
                        className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs text-[#111827] focus:outline-none ${
                          !proj.title.trim()
                            ? 'border-amber-500/40 focus:border-amber-400'
                            : 'border-[#E2E8F0] focus:border-[#2563EB]'
                        }`}
                      />
                      {!proj.title.trim() && (
                        <p className="text-[10px] text-amber-400/90 mt-1">Project title is recommended.</p>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                        Technologies (comma separated)
                      </label>
                      <input
                        type="text"
                        value={proj.technologies.join(', ')}
                        onChange={(e) =>
                          updateProject(proj.id, {
                            technologies: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                          })
                        }
                        placeholder="React, TypeScript, Docker..."
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                      Project Description
                    </label>
                    <textarea
                      rows={2}
                      value={proj.description}
                      onChange={(e) => updateProject(proj.id, { description: e.target.value })}
                      placeholder="Explain architecture, key features, and engineering outcomes..."
                      className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                        GitHub Repo URL
                      </label>
                      <input
                        type="url"
                        value={proj.githubUrl || ''}
                        onChange={(e) => updateProject(proj.id, { githubUrl: e.target.value })}
                        placeholder="https://github.com/..."
                        className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs text-[#111827] focus:outline-none font-mono ${
                          validation.projectGithubErrors?.[proj.id]
                            ? 'border-red-500/70 focus:border-red-400'
                            : 'border-[#E2E8F0] focus:border-[#2563EB]'
                        }`}
                      />
                      {validation.projectGithubErrors?.[proj.id] && (
                        <p className="text-[10px] text-red-400 mt-1">
                          {validation.projectGithubErrors[proj.id]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                        Live Demo / Production URL
                      </label>
                      <input
                        type="url"
                        value={proj.liveUrl || ''}
                        onChange={(e) => updateProject(proj.id, { liveUrl: e.target.value })}
                        placeholder="https://..."
                        className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs text-[#111827] focus:outline-none font-mono ${
                          validation.liveUrlErrors[proj.id]
                            ? 'border-red-500/70 focus:border-red-400'
                            : 'border-[#E2E8F0] focus:border-[#2563EB]'
                        }`}
                      />
                      {validation.liveUrlErrors[proj.id] && (
                        <p className="text-[10px] text-red-400 mt-1">
                          {validation.liveUrlErrors[proj.id]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-medium text-[#64748B] block">
                          Project Cover (max 8MB)
                        </label>
                        {proj.imageUrl && (
                          <button
                            type="button"
                            onClick={() => updateProject(proj.id, { imageUrl: '' })}
                            className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-0.5"
                          >
                            <X className="w-3 h-3" />
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {proj.imageUrl && (
                          <img
                            src={proj.imageUrl}
                            alt={proj.title}
                            className="w-8 h-8 rounded-lg object-cover border border-[#BFDBFE] shrink-0"
                          />
                        )}
                        <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-[#E2E8F0] text-[11px] text-white font-medium flex items-center gap-1 transition-colors shrink-0">
                          <Upload className="w-3 h-3 text-cyan-400" />
                          <span>{projectUploadingId === proj.id ? 'Uploading...' : 'Upload'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleProjectImageFile(proj.id, e)}
                            disabled={projectUploadingId === proj.id}
                            className="hidden"
                          />
                        </label>

                        <input
                          type="url"
                          value={proj.imageUrl || ''}
                          onChange={(e) => updateProject(proj.id, { imageUrl: e.target.value })}
                          placeholder="or paste URL"
                          className={`flex-1 bg-white border rounded-lg px-2 py-1 text-xs text-[#111827] focus:outline-none font-mono ${
                            validation.projectImageErrors?.[proj.id]
                              ? 'border-red-500/70 focus:border-red-400'
                              : 'border-[#E2E8F0] focus:border-[#2563EB]'
                          }`}
                        />
                      </div>

                      {projectUploadError?.id === proj.id && (
                        <p className="text-[10px] text-rose-400">{projectUploadError.message}</p>
                      )}
                      {validation.projectImageErrors?.[proj.id] && (
                        <p className="text-[10px] text-red-400 mt-1">
                          {validation.projectImageErrors[proj.id]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {data.projects.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={addProject}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="w-full text-xs border-[#E2E8F0] text-white"
              >
                Add Another Project
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 4. Experience & Roles Section */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <button
          onClick={() => setOpenSection(openSection === 'experience' ? 'education' : 'experience')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#111827] block">
                Work Experience & Internships
              </span>
              <span className="text-[11px] text-[#64748B]">
                {data.experience.length} {data.experience.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
          </div>
          {openSection === 'experience' ? (
            <ChevronUp className="w-4 h-4 text-[#64748B]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          )}
        </button>

        {openSection === 'experience' && (
          <div className="p-4 sm:p-5 border-t border-[#E2E8F0] bg-white space-y-4">
            {data.experience.length === 0 ? (
              <div className="text-center py-6 px-4 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E2E8F0] space-y-2">
                <p className="text-xs text-[#64748B]">No work experience entries added yet.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addExperience}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="text-xs border-[#E2E8F0] text-white"
                >
                  Add First Experience
                </Button>
              </div>
            ) : (
              data.experience.map((exp, idx) => (
                <div
                  key={exp.id}
                  className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#2563EB]">
                      Experience #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveExperience(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-[#64748B] hover:text-[#111827] disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                        aria-label="Move experience up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveExperience(idx, 'down')}
                        disabled={idx === data.experience.length - 1}
                        className="p-1 text-[#64748B] hover:text-[#111827] disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                        aria-label="Move experience down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeExperience(exp.id)}
                        className="p-1 text-rose-400 hover:text-rose-300 ml-1 cursor-pointer"
                        title="Remove experience"
                        aria-label="Remove experience"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                        Organization / Company *
                      </label>
                      <input
                        type="text"
                        value={exp.organization}
                        onChange={(e) => updateExperience(exp.id, { organization: e.target.value })}
                        placeholder="Company Name"
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                        Role / Title *
                      </label>
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                        placeholder="e.g. Software Engineering Intern"
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                        Start Date
                      </label>
                      <input
                        type="text"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                        placeholder="e.g. Jun 2024"
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                        End Date
                      </label>
                      <input
                        type="text"
                        value={exp.endDate}
                        onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                        placeholder="e.g. Present"
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                      Role Description & Outcomes
                    </label>
                    <textarea
                      rows={2}
                      value={exp.description}
                      onChange={(e) => updateExperience(exp.id, { description: e.target.value })}
                      placeholder="Key achievements, technologies used, and business/technical impacts..."
                      className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>
              ))
            )}

            {data.experience.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={addExperience}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="w-full text-xs border-[#E2E8F0] text-white"
              >
                Add Another Experience
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 5. Education Section */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <button
          onClick={() => setOpenSection(openSection === 'education' ? 'achievements' : 'education')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#111827] block">
                Education
              </span>
              <span className="text-[11px] text-[#64748B]">
                {data.education.length} {data.education.length === 1 ? 'degree' : 'degrees'} configured
              </span>
            </div>
          </div>
          {openSection === 'education' ? (
            <ChevronUp className="w-4 h-4 text-[#64748B]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          )}
        </button>

        {openSection === 'education' && (
          <div className="p-4 sm:p-5 border-t border-[#E2E8F0] bg-white space-y-4">
            {data.education.length === 0 ? (
              <div className="text-center py-6 px-4 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E2E8F0] space-y-2">
                <p className="text-xs text-[#64748B]">No education records added yet.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addEducation}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="text-xs border-[#E2E8F0] text-white"
                >
                  Add First Degree
                </Button>
              </div>
            ) : (
              data.education.map((edu, idx) => (
                <div
                  key={edu.id}
                  className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#2563EB]">
                      Education #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveEducation(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-[#64748B] hover:text-[#111827] disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                        aria-label="Move education up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveEducation(idx, 'down')}
                        disabled={idx === data.education.length - 1}
                        className="p-1 text-[#64748B] hover:text-[#111827] disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                        aria-label="Move education down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeEducation(edu.id)}
                        className="p-1 text-rose-400 hover:text-rose-300 ml-1 cursor-pointer"
                        title="Remove entry"
                        aria-label="Remove education entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                        Institution / University *
                      </label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                        placeholder="University Name"
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                        Degree *
                      </label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                        placeholder="Bachelor of Technology"
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                        Specialization / Branch
                      </label>
                      <input
                        type="text"
                        value={edu.specialization}
                        onChange={(e) => updateEducation(edu.id, { specialization: e.target.value })}
                        placeholder="Computer Science & Engineering"
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                        Grade / CGPA (optional)
                      </label>
                      <input
                        type="text"
                        value={edu.grade || ''}
                        onChange={(e) => updateEducation(edu.id, { grade: e.target.value })}
                        placeholder="e.g. 8.9 / 10 CGPA"
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                        Start Year
                      </label>
                      <input
                        type="text"
                        value={edu.startDate}
                        onChange={(e) => updateEducation(edu.id, { startDate: e.target.value })}
                        placeholder="2022"
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                        End Year
                      </label>
                      <input
                        type="text"
                        value={edu.endDate}
                        onChange={(e) => updateEducation(edu.id, { endDate: e.target.value })}
                        placeholder="2026"
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}

            {data.education.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={addEducation}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="w-full text-xs border-[#E2E8F0] text-white"
              >
                Add Another Education
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 6. Achievements & Certifications */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <button
          onClick={() => setOpenSection(openSection === 'achievements' ? 'contact' : 'achievements')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
              <Award className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#111827] block">
                Achievements & Certifications
              </span>
              <span className="text-[11px] text-[#64748B]">
                Honors, credentials, hackathons, and certifications
              </span>
            </div>
          </div>
          {openSection === 'achievements' ? (
            <ChevronUp className="w-4 h-4 text-[#64748B]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          )}
        </button>

        {openSection === 'achievements' && (
          <div className="p-4 sm:p-5 border-t border-[#E2E8F0] bg-white space-y-5">
            {/* Achievements */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-white">Honors & Achievements</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addAchievement}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="text-xs border-[#E2E8F0] text-white"
                >
                  Add Achievement
                </Button>
              </div>

              {data.achievements.length === 0 ? (
                <p className="text-[11px] text-[#64748B] italic">No achievements added yet.</p>
              ) : (
                data.achievements.map((ach, idx) => (
                  <div
                    key={ach.id}
                    className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <input
                        type="text"
                        value={ach.title}
                        onChange={(e) => updateAchievement(ach.id, { title: e.target.value })}
                        placeholder="Achievement Title (e.g. Hackathon Finalist)"
                        className="flex-1 bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveAchievement(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-[#64748B] hover:text-[#111827] disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                          aria-label="Move achievement up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveAchievement(idx, 'down')}
                          disabled={idx === data.achievements.length - 1}
                          className="p-1 text-[#64748B] hover:text-[#111827] disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                          aria-label="Move achievement down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAchievement(ach.id)}
                          className="p-1 text-rose-400 hover:text-rose-300 ml-1 cursor-pointer"
                          title="Remove achievement"
                          aria-label="Remove achievement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={ach.description}
                      onChange={(e) => updateAchievement(ach.id, { description: e.target.value })}
                      placeholder="Short description or outcome..."
                      className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>
                ))
              )}
            </div>

            {/* Certifications */}
            <div className="space-y-3 pt-4 border-t border-[#E2E8F0]">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-white">Certifications & Credentials</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addCertification}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="text-xs border-[#E2E8F0] text-white"
                >
                  Add Certification
                </Button>
              </div>

              {data.certifications.length === 0 ? (
                <p className="text-[11px] text-[#64748B] italic">No certifications added yet.</p>
              ) : (
                data.certifications.map((cert, idx) => (
                  <div
                    key={cert.id}
                    className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <input
                        type="text"
                        value={cert.name}
                        onChange={(e) => updateCertification(cert.id, { name: e.target.value })}
                        placeholder="Certification Name (e.g. AWS Cloud Practitioner)"
                        className="flex-1 bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveCertification(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-[#64748B] hover:text-[#111827] disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                          aria-label="Move certification up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveCertification(idx, 'down')}
                          disabled={idx === data.certifications.length - 1}
                          className="p-1 text-[#64748B] hover:text-[#111827] disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                          aria-label="Move certification down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCertification(cert.id)}
                          className="p-1 text-rose-400 hover:text-rose-300 ml-1 cursor-pointer"
                          title="Remove certification"
                          aria-label="Remove certification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={(e) => updateCertification(cert.id, { issuer: e.target.value })}
                        placeholder="Issuer (e.g. AWS, Meta)"
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={cert.issueDate || ''}
                        onChange={(e) => updateCertification(cert.id, { issueDate: e.target.value })}
                        placeholder="Year (e.g. 2025)"
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none font-mono"
                      />
                      <div>
                        <input
                          type="url"
                          value={cert.credentialUrl || ''}
                          onChange={(e) => updateCertification(cert.id, { credentialUrl: e.target.value })}
                          placeholder="Verification Link (optional)"
                          className={`w-full bg-white border rounded-lg px-2.5 py-1 text-xs text-[#111827] focus:outline-none font-mono ${
                            validation.certCredentialErrors?.[cert.id]
                              ? 'border-red-500/70 focus:border-red-400'
                              : 'border-[#E2E8F0] focus:border-[#2563EB]'
                          }`}
                        />
                        {validation.certCredentialErrors?.[cert.id] && (
                          <p className="text-[10px] text-red-400 mt-1">
                            {validation.certCredentialErrors[cert.id]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 7. Contact & Social Channels */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <button
          onClick={() => setOpenSection(openSection === 'contact' ? 'profile' : 'contact')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
              <Send className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#111827] block">
                Contact & Social Channels
              </span>
              <span className="text-[11px] text-[#64748B]">
                Inquiry email, CTA message, and community links
              </span>
            </div>
          </div>
          {openSection === 'contact' ? (
            <ChevronUp className="w-4 h-4 text-[#64748B]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          )}
        </button>

        {openSection === 'contact' && (
          <div className="p-4 sm:p-5 border-t border-[#E2E8F0] bg-white space-y-4">
            <div>
              <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                Contact Inquiries Email
              </label>
              <input
                type="email"
                value={data.contact.email || ''}
                onChange={(e) =>
                  onChange({
                    ...data,
                    contact: { ...data.contact, email: e.target.value },
                  })
                }
                placeholder="contact@example.com"
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#111827] focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                Call-to-Action Message
              </label>
              <textarea
                rows={2}
                value={data.contact.contactCtaMessage || ''}
                onChange={(e) =>
                  onChange({
                    ...data,
                    contact: { ...data.contact, contactCtaMessage: e.target.value },
                  })
                }
                placeholder="Open for engineering opportunities and collaboration..."
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#111827] focus:border-[#2563EB] focus:outline-none resize-y leading-relaxed"
              />
            </div>

            {/* Additional Social Links */}
            <div className="space-y-3 pt-3 border-t border-[#E2E8F0]">
              <label className="text-[11px] font-medium text-[#64748B] block">
                Additional Social & Community Channels
              </label>

              {data.contact.socialLinks.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs"
                >
                  <div className="flex items-center gap-2 truncate mr-2">
                    <span className="font-semibold text-[#2563EB]">{s.platform}:</span>
                    <span className="text-[#64748B] font-mono truncate">{s.url}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSocialLink(s.id)}
                    className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newSocialPlatform}
                  onChange={(e) => setNewSocialPlatform(e.target.value)}
                  placeholder="Platform (e.g. Discord)"
                  className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
                />
                <input
                  type="url"
                  value={newSocialUrl}
                  onChange={(e) => setNewSocialUrl(e.target.value)}
                  placeholder="Profile URL (https://...)"
                  className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none sm:col-span-2 font-mono"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={addSocialLink}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs border-[#E2E8F0] text-[#111827]"
              >
                Add Social Link
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 9. Completion & Export Area */}
      <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-white to-[#F8FAFC] border border-[#BFDBFE] shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE] shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#111827]">
                Ready to Export Your Website?
              </h3>
              <p className="text-xs text-[#64748B]">
                Download a complete, standalone production website (HTML/CSS/JS) in a single ZIP.
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-mono px-2.5 py-1 rounded-full border shrink-0 ${
              hasSufficientPortfolioContent(data)
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                : 'bg-amber-50 text-amber-700 border-amber-200 font-medium'
            }`}
          >
            {hasSufficientPortfolioContent(data) ? 'Ready for Export' : 'Draft in Progress'}
          </span>
        </div>

        <p className="text-xs text-[#64748B] leading-relaxed">
          {hasSufficientPortfolioContent(data)
            ? 'Your portfolio contains sufficient content. Download the ZIP file to run locally without dependencies or host directly on GitHub Pages, Netlify, or Vercel.'
            : 'Add your name and at least one project, skill, bio, or experience entry to generate your production-ready standalone website.'}
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0]">
          <span className="text-[11px] font-mono text-[#64748B]">
            Standalone ZIP • Free Platform Subdomain Hosting
          </span>
          <div className="flex items-center gap-2">
            <PortfolioDownloadButton
              data={data}
              variant="outline"
              size="sm"
              label="Download ZIP"
              className="text-xs font-semibold"
            />
            {onOpenCompletionModal && (
              <Button
                variant="glow"
                size="sm"
                onClick={onOpenCompletionModal}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                className="text-xs font-bold"
              >
                Publish & Export Options
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PortfolioEditor
