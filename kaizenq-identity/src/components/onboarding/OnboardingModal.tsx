import React, { useState, useEffect } from 'react'
import { useAuth } from '../../app/providers/AuthContext.tsx'
import { useApp } from '../../app/providers/AppContext.ts'
import { profileService } from '../../services/profileService.ts'
import {
  User,
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  FileText,
  Globe,
  Sparkles,
  MapPin,
  Check,
  Briefcase
} from 'lucide-react'

export const OnboardingModal: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth()
  const { setCurrentRoute } = useApp()

  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Identity & Role
  const [displayName, setDisplayName] = useState('')
  const [headline, setHeadline] = useState('')
  const [location, setLocation] = useState('')

  // Step 2: About / Professional Summary
  const [bio, setBio] = useState('')

  // Step 3: Preferred Path
  const [selectedTrack, setSelectedTrack] = useState<'resume' | 'portfolio' | 'both'>('both')

  // Check if onboarding is needed
  useEffect(() => {
    if (user && profile) {
      if (!profile.onboarding_completed) {
        setIsOpen(true)
        if (profile.display_name) setDisplayName(profile.display_name)
        if (profile.headline) setHeadline(profile.headline)
        if (profile.location) setLocation(profile.location)
        if (profile.bio) setBio(profile.bio)
      } else {
        setIsOpen(false)
      }
    }
  }, [user, profile])

  if (!isOpen || !user) return null

  const handleNextStep = () => {
    setError(null)
    if (step === 1) {
      if (!displayName.trim()) {
        setError('Please enter your full or display name.')
        return
      }
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  const handlePrevStep = () => {
    setError(null)
    if (step > 1) {
      setStep((step - 1) as 1 | 2)
    }
  }

  const handleComplete = async () => {
    if (!user) return
    setIsSubmitting(true)
    setError(null)

    try {
      const { error: updateError } = await profileService.updateProfile(user.id, {
        display_name: displayName.trim() || null,
        headline: headline.trim() || null,
        location: location.trim() || null,
        bio: bio.trim() || null,
        onboarding_completed: true,
      })

      if (updateError) {
        throw updateError
      }

      await refreshProfile()
      setIsOpen(false)

      // Direct to chosen workspace
      if (selectedTrack === 'resume') {
        setCurrentRoute('resume')
      } else if (selectedTrack === 'portfolio') {
        setCurrentRoute('portfolio')
      } else {
        setCurrentRoute('dashboard')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save onboarding details.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl overflow-hidden text-[#111827]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        {/* Header with progress steps */}
        <div className="p-6 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h2 id="onboarding-title" className="text-xl font-bold text-[#111827]">
                  Welcome to PR Builder
                </h2>
                <p className="text-xs text-[#64748B]">
                  Step {step} of 3 • Set up your professional workspace
                </p>
              </div>
            </div>

            {/* Stepper Dots */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    s === step
                      ? 'w-8 bg-[#2563EB]'
                      : s < step
                      ? 'w-2 bg-emerald-500'
                      : 'w-2 bg-[#E2E8F0]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8 overflow-y-auto max-h-[70vh] space-y-6 bg-white">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
              {error}
            </div>
          )}

          {/* STEP 1: Basic Identity */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold text-[#111827] flex items-center gap-2">
                  <User className="w-5 h-5 text-[#2563EB]" />
                  Tell us about yourself
                </h3>
                <p className="text-sm text-[#64748B]">
                  This information will personalize your profile, resume contact header, and portfolio.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1.5" htmlFor="ob-displayname">
                    Full Name / Display Name <span className="text-[#2563EB]">*</span>
                  </label>
                  <input
                    id="ob-displayname"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1.5" htmlFor="ob-headline">
                    Professional Headline <span className="text-xs text-[#94A3B8] font-normal">(Optional)</span>
                  </label>
                  <input
                    id="ob-headline"
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer | React & TypeScript"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1.5" htmlFor="ob-location">
                    Location <span className="text-xs text-[#94A3B8] font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
                    <input
                      id="ob-location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. San Francisco, CA or Remote"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Summary / Pitch */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold text-[#111827] flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#2563EB]" />
                  Professional Summary
                </h3>
                <p className="text-sm text-[#64748B]">
                  A concise bio to describe your experience, passions, and goals. Optional and editable anytime.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1.5" htmlFor="ob-bio">
                    Short Bio / Summary <span className="text-xs text-[#94A3B8] font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="ob-bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="e.g. Full-stack engineer with 4+ years building high-throughput web applications and AI tooling. Passionate about clean UX and performance..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors resize-none text-sm leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Workspace Track Selection */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold text-[#111827] flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[#2563EB]" />
                  What would you like to build first?
                </h3>
                <p className="text-sm text-[#64748B]">
                  Choose your initial workflow. Both builders remain accessible in your dashboard anytime.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {/* Resume Option */}
                <button
                  type="button"
                  onClick={() => setSelectedTrack('resume')}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-4 cursor-pointer ${
                    selectedTrack === 'resume'
                      ? 'bg-[#EFF6FF] border-[#2563EB] shadow-sm'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${selectedTrack === 'resume' ? 'bg-[#2563EB] text-white' : 'bg-white text-[#64748B] border border-[#E2E8F0]'}`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#111827]">ATS-Optimized Resume</span>
                      {selectedTrack === 'resume' && <Check className="w-5 h-5 text-[#2563EB]" />}
                    </div>
                    <p className="text-xs text-[#64748B] mt-1">
                      Build single & multi-page A4 resumes with proven templates tailored for automated recruiter screens.
                    </p>
                  </div>
                </button>

                {/* Portfolio Option */}
                <button
                  type="button"
                  onClick={() => setSelectedTrack('portfolio')}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-4 cursor-pointer ${
                    selectedTrack === 'portfolio'
                      ? 'bg-[#EFF6FF] border-[#2563EB] shadow-sm'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${selectedTrack === 'portfolio' ? 'bg-[#2563EB] text-white' : 'bg-white text-[#64748B] border border-[#E2E8F0]'}`}>
                    <Globe className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#111827]">Interactive Developer Portfolio</span>
                      {selectedTrack === 'portfolio' && <Check className="w-5 h-5 text-[#2563EB]" />}
                    </div>
                    <p className="text-xs text-[#64748B] mt-1">
                      Publish a responsive personal site with project showcases, experience milestones, and custom slugs.
                    </p>
                  </div>
                </button>

                {/* Both / Dashboard Option */}
                <button
                  type="button"
                  onClick={() => setSelectedTrack('both')}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-4 cursor-pointer ${
                    selectedTrack === 'both'
                      ? 'bg-[#EEF2FF] border-[#6366F1] shadow-sm'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${selectedTrack === 'both' ? 'bg-[#4F46E5] text-white' : 'bg-white text-[#64748B] border border-[#E2E8F0]'}`}>
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#111827]">Full Career Suite (Both)</span>
                      {selectedTrack === 'both' && <Check className="w-5 h-5 text-[#4F46E5]" />}
                    </div>
                    <p className="text-xs text-[#64748B] mt-1">
                      Open your command dashboard to manage both resume versions and live portfolio links together.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[#64748B] hover:text-[#111827] hover:bg-white border border-transparent hover:border-[#E2E8F0] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Complete Setup & Launch
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingModal
