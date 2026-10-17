import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { FileText, Globe, ExternalLink } from 'lucide-react'
import { DashboardLayout } from './components/DashboardLayout.tsx'
import { WelcomeSection } from './components/WelcomeSection.tsx'
import { DashboardStatCard } from './components/DashboardStatCard.tsx'
import { RecentActivity } from './components/RecentActivity.tsx'
import { NextSteps } from './components/NextSteps.tsx'
import { ProjectsView } from './components/ProjectsView.tsx'
import { DomainView } from './components/DomainView.tsx'
import { ProfileView } from './components/ProfileView.tsx'
import { PublishShareView } from './components/PublishShareView.tsx'
import { AdminDomainRequestsView } from './components/AdminDomainRequestsView.tsx'
import { AddProjectModal, type ProjectFormData } from './components/AddProjectModal.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Badge } from '../../components/ui/Badge.tsx'
import { useAuth } from '../../app/providers/AuthContext.tsx'
import { portfolioService, type PortfolioRow } from '../../services/portfolioService.ts'
import { resumeService, type ResumeRow } from '../../services/resumeService.ts'
import { activityService } from '../../services/activityService.ts'
import { domainService, type DomainRow } from '../../services/domainService.ts'
import { loadPortfolioDraft } from '../Portfolio/storage.ts'
import { loadResumeDraft } from '../Resume/storage.ts'
import type { PortfolioData } from '../Portfolio/types.ts'
import type { ResumeData } from '../Resume/types.ts'
import { PortfolioDownloadButton } from '../../components/download/PortfolioDownloadButton.tsx'
import { ResumeDownloadButton } from '../../components/download/ResumeDownloadButton.tsx'
import type {
  DashboardTab,
  DemoStudentData,
  DemoActivityEvent,
  DemoChecklistItem,
  DemoNotification,
} from './types.ts'

export interface DashboardProps {
  onNavigate?: (route: string) => void
  initialTab?: DashboardTab
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, initialTab = 'overview' }) => {
  const { user, profile, isConfigured } = useAuth()
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab)

  // Cloud data state
  const [cloudPortfolio, setCloudPortfolio] = useState<PortfolioRow | null>(null)
  const [cloudResume, setCloudResume] = useState<ResumeRow | null>(null)
  const [activities, setActivities] = useState<DemoActivityEvent[]>([])
  const [domains, setDomains] = useState<DomainRow[]>([])
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)

  // Local additions to projects list
  const [customProjects, setCustomProjects] = useState<
    Array<{
      title: string
      tagline: string
      stars: number
      tags: string[]
      metrics: string
      liveUrl?: string
      githubUrl?: string
    }>
  >([])

  // Load real telemetry from Supabase
  const loadDashboardData = useCallback(async (userId: string) => {
    try {
      const [portfolioRes, resumeRes, activityRes, domainRes] = await Promise.all([
        portfolioService.getUserPortfolio(userId),
        resumeService.getUserResume(userId),
        activityService.getUserActivities(userId),
        domainService.getUserDomains(userId),
      ])

      if (portfolioRes.data) setCloudPortfolio(portfolioRes.data)
      if (resumeRes.data) setCloudResume(resumeRes.data)
      if (activityRes.data) setActivities(activityRes.data)
      if (domainRes.data) setDomains(domainRes.data)
    } catch (err) {
      console.warn('Failed to load authenticated dashboard telemetry:', err)
    }
  }, [])

  useEffect(() => {
    if (user?.id && isConfigured) {
      loadDashboardData(user.id)
    }
  }, [user?.id, isConfigured, loadDashboardData])

  // Extract projects from real portfolio or local state
  const projectsList = useMemo(() => {
    const pData = cloudPortfolio?.portfolio_data as unknown as {
      projects?: Array<{
        title?: string
        description?: string
        technologies?: string[]
        liveUrl?: string
        githubUrl?: string
      }>
    } | null

    if (pData?.projects && Array.isArray(pData.projects) && pData.projects.length > 0) {
      const mapped = pData.projects.map((p) => ({
        title: p.title || 'Untitled Project',
        tagline: p.description || 'Technical demonstration',
        stars: 0,
        tags: Array.isArray(p.technologies) ? p.technologies : [],
        metrics: 'Live Demonstration',
        liveUrl: p.liveUrl,
        githubUrl: p.githubUrl,
      }))
      return [...customProjects, ...mapped]
    }

    return customProjects
  }, [cloudPortfolio, customProjects])

  // Active data for direct export actions
  const activePortfolioData = useMemo<PortfolioData>(() => {
    if (cloudPortfolio?.portfolio_data) {
      return cloudPortfolio.portfolio_data as unknown as PortfolioData
    }
    return loadPortfolioDraft().data
  }, [cloudPortfolio])

  const activeResumeData = useMemo<ResumeData>(() => {
    if (cloudResume?.resume_data) {
      return cloudResume.resume_data as unknown as ResumeData
    }
    return loadResumeDraft().data
  }, [cloudResume])

  // Compute genuine completion percentages
  const completion = useMemo(() => {
    // 1. Profile: evaluate presence of core fields
    let profileScore = 20 // baseline registered user
    if (profile?.display_name) profileScore += 20
    if (profile?.headline) profileScore += 20
    if (profile?.bio) profileScore += 20
    if (profile?.avatar_path) profileScore += 20

    // 2. Resume: evaluate sections
    let resumeScore = 0
    if (cloudResume?.resume_data) {
      resumeScore = 40 // draft created
      const rData = cloudResume.resume_data as {
        personalInfo?: { fullName?: string; summary?: string }
        experience?: unknown[]
        education?: unknown[]
        skills?: { languages?: unknown[]; frameworks?: unknown[] }
      }
      if (rData.personalInfo?.fullName) resumeScore += 15
      if (rData.personalInfo?.summary) resumeScore += 15
      if (rData.experience && rData.experience.length > 0) resumeScore += 15
      if (rData.skills && (rData.skills.languages?.length || rData.skills.frameworks?.length))
        resumeScore += 15
    }

    // 3. Portfolio: evaluate publish / draft state
    let portfolioScore = 0
    if (cloudPortfolio) {
      portfolioScore = cloudPortfolio.publication_status === 'published' ? 100 : 60
    }

    // 4. Projects: evaluate count
    let projectsScore = 0
    if (projectsList.length >= 2) projectsScore = 100
    else if (projectsList.length === 1) projectsScore = 50

    return {
      profile: Math.min(100, profileScore),
      resume: Math.min(100, resumeScore),
      portfolio: Math.min(100, portfolioScore),
      projects: Math.min(100, projectsScore),
    }
  }, [profile, cloudResume, cloudPortfolio, projectsList])

  // Construct authenticated student profile representation
  const student: DemoStudentData = useMemo(() => {
    const activeDomain = domains[0]
    const name = profile?.display_name || user?.email?.split('@')[0] || 'Builder'
    const initials = name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'B'

    // Extract skills from resume
    const rSkills = (cloudResume?.resume_data as { skills?: { languages?: string[]; frameworks?: string[] } })?.skills
    const extractedSkills = [
      ...(rSkills?.languages || []),
      ...(rSkills?.frameworks || []),
    ]
    const skills = extractedSkills.length > 0 ? extractedSkills.slice(0, 8) : []

    const displayHandle = activeDomain ? activeDomain.hostname : (cloudPortfolio?.slug ? `${cloudPortfolio.slug}.kaizenq.id` : '')

    return {
      id: user?.id || 'guest',
      name,
      handle: displayHandle,
      avatarInitials: initials,
      role: profile?.headline || '',
      institution: '',
      location: profile?.location || '',
      bio: profile?.bio || '',
      cohort: '',
      skills,
      completion,
      domainInfo: {
        handle: displayHandle,
        tld: '.xyz',
        status: activeDomain ? (activeDomain.verification_status as 'Eligibility Pending' | 'In Review' | 'Configured') : 'Eligibility Pending',
        isVoucherEligible: false,
        dnsTarget: 'cname.kaizenq.me',
      },
    }
  }, [profile, user, domains, cloudPortfolio, cloudResume, completion])

  // Genuine dynamic checklist
  const dynamicChecklist: DemoChecklistItem[] = useMemo(() => {
    return [
      {
        id: 'chk_profile',
        title: 'Complete Personal Bio & Headline',
        description: 'Provide an impactful headline, short bio, and location.',
        completed: Boolean(profile?.display_name && profile?.headline && profile?.bio),
        actionLabel: 'Edit Profile',
        targetTab: 'profile',
      },
      {
        id: 'chk_resume',
        title: 'Draft ATS-Compliant Resume',
        description: 'Configure your education, work history, and core skills.',
        completed: Boolean(cloudResume?.resume_data),
        actionLabel: 'Open Resume',
        targetTab: 'resume',
      },
      {
        id: 'chk_projects',
        title: 'Attach Technical Showcase Projects',
        description: 'Add live URLs and GitHub repository links.',
        completed: projectsList.length > 0,
        actionLabel: 'Add Project',
        targetTab: 'projects',
      },
      {
        id: 'chk_portfolio',
        title: 'Publish Developer Portfolio',
        description: 'Review themes and make your public portfolio live.',
        completed: cloudPortfolio?.publication_status === 'published',
        actionLabel: 'Publish',
        targetTab: 'publish',
      },
      {
        id: 'chk_domain',
        title: 'Connect Custom Domain',
        description: 'Configure DNS routing for your student domain voucher.',
        completed: domains.length > 0 && domains[0].verification_status === 'verified',
        actionLabel: 'Setup Domain',
        targetTab: 'domain',
      },
    ]
  }, [profile, cloudResume, projectsList, cloudPortfolio, domains])

  // Real notifications
  const notifications: DemoNotification[] = useMemo(() => {
    const list: DemoNotification[] = []

    if (user?.id) {
      list.push({
        id: 'notif_cloud',
        title: 'Cloud Persistence Active',
        message: 'Your documents and drafts are safely synced to Supabase with Row Level Security.',
        timestamp: 'Just now',
        read: true,
        type: 'info',
      })
    }

    if (cloudPortfolio?.publication_status === 'published') {
      list.push({
        id: 'notif_pub',
        title: 'Portfolio Published Live',
        message: `Your portfolio is publicly accessible at /p/${cloudPortfolio.slug || 'student'}.`,
        timestamp: 'Active',
        read: true,
        type: 'success',
      })
    }

    if (completion.resume > 0) {
      list.push({
        id: 'notif_res',
        title: 'Resume Draft Saved',
        message: `ATS resume is ${completion.resume}% complete and ready for export.`,
        timestamp: 'Synced',
        read: true,
        type: 'info',
      })
    }

    return list
  }, [user?.id, cloudPortfolio, completion.resume])

  const handleAddProject = (formData: ProjectFormData) => {
    const newProject = {
      title: formData.title,
      tagline: formData.tagline,
      stars: 0,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      metrics: formData.metrics || 'Production Ready',
      liveUrl: formData.liveUrl,
      githubUrl: formData.githubUrl,
    }

    setCustomProjects((prev) => [newProject, ...prev])
  }

  const handleSelectTab = (tab: DashboardTab) => {
    if (tab === 'resume' && onNavigate) {
      onNavigate('resume')
      return
    }
    if (tab === 'portfolio' && onNavigate) {
      onNavigate('portfolio')
      return
    }
    setActiveTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isResumeReady = completion.resume >= 70
  const isPortfolioPublished = cloudPortfolio?.publication_status === 'published'
  const hasSavedContent = Boolean(
    (cloudResume?.resume_data && Object.keys(cloudResume.resume_data).length > 0) ||
    cloudPortfolio ||
    projectsList.length > 0
  )

  return (
    <DashboardLayout
      activeTab={activeTab}
      student={student}
      notifications={notifications}
      onSelectTab={handleSelectTab}
      onExitToHome={() => onNavigate?.('home')}
    >
      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* 1. Spacious welcome section with single primary CTA */}
          <WelcomeSection
            displayName={profile?.display_name || (user?.email ? user.email.split('@')[0] : null)}
            hasStartedBuilding={hasSavedContent}
            publishedSlug={cloudPortfolio?.publication_status === 'published' ? cloudPortfolio.slug : null}
            onContinueBuilding={() => handleSelectTab('resume')}
          />

          {/* 2. Resume Builder and Portfolio Studio as two attractive feature cards */}
          <DashboardStatCard
            student={student}
            onSelectTab={handleSelectTab}
          />

          {/* 3. Minimal Workspace Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-[#111827]">
                Workspace Documents
              </h3>
              <span className="text-xs text-[#64748B]">
                {hasSavedContent ? 'Active documents' : 'No saved files'}
              </span>
            </div>

            {!hasSavedContent ? (
              <div className="p-7 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="space-y-1 max-w-xl">
                  <h4 className="text-base font-semibold text-[#111827]">
                    Your workspace is ready
                  </h4>
                  <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                    You haven't created any documents yet. Begin by drafting an ATS-optimized resume or publishing your developer portfolio.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <Button
                    variant="glow"
                    size="sm"
                    leftIcon={<FileText className="w-4 h-4" />}
                    onClick={() => handleSelectTab('resume')}
                  >
                    Create Resume
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Globe className="w-4 h-4" />}
                    onClick={() => handleSelectTab('portfolio')}
                    className="border-[#E2E8F0] text-[#111827] hover:bg-[#F8FAFC]"
                  >
                    Create Portfolio
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Resume Document Item */}
                <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#111827] truncate">
                        ATS-Optimized Resume
                      </h4>
                      <p className="text-xs text-[#64748B] truncate mt-0.5">
                        {cloudResume?.updated_at
                          ? `Last saved ${new Date(cloudResume.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}`
                          : 'Local draft saved'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ResumeDownloadButton
                      data={activeResumeData}
                      variant="outline"
                      size="sm"
                      label="Download PDF"
                      className="border-[#E2E8F0] text-[#111827] hover:bg-[#F8FAFC]"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectTab('resume')}
                      className="border-[#E2E8F0] text-[#111827] hover:bg-[#F8FAFC]"
                    >
                      Edit Resume
                    </Button>
                  </div>
                </div>

                {/* Portfolio Document Item */}
                <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4F46E5] shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#111827] truncate">
                        Developer Portfolio
                      </h4>
                      <p className="text-xs text-[#64748B] truncate mt-0.5">
                        {cloudPortfolio?.publication_status === 'published'
                          ? `Published as /p/${cloudPortfolio.slug}`
                          : 'Draft in progress'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PortfolioDownloadButton
                      data={activePortfolioData}
                      variant="outline"
                      size="sm"
                      label="Download ZIP"
                      className="border-[#E2E8F0] text-[#111827] hover:bg-[#F8FAFC]"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectTab('portfolio')}
                      className="border-[#E2E8F0] text-[#111827] hover:bg-[#F8FAFC]"
                    >
                      Edit Studio
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Dual Column: Recent Activity & Actionable Next Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivity activities={activities} isLive={Boolean(user?.id)} />
            <NextSteps
              checklist={dynamicChecklist}
              onSelectTab={handleSelectTab}
            />
          </div>
        </div>
      )}

      {/* TAB 2: MY PROFILE */}
      {activeTab === 'profile' && (
        <div className="animate-fadeIn">
          <ProfileView
            student={student}
            onOpenFullBuilder={() => onNavigate?.('portfolio')}
          />
        </div>
      )}

      {/* TAB 3: RESUME BUILDER HUB */}
      {activeTab === 'resume' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-[#111827]">
                  ATS Resume Engine
                </h2>
                <Badge variant={isResumeReady ? 'cyan' : 'default'} size="sm">
                  {cloudResume ? `Status: ${completion.resume}% Complete` : 'No Cloud Draft Yet'}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 max-w-xl leading-relaxed">
                Single and multi-page layouts engineered with clean typography and proven recruiter hierarchy for {student.role || 'software'} roles.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <ResumeDownloadButton
                data={activeResumeData}
                variant="glow"
                size="md"
                label="Download Resume PDF"
                className="font-semibold"
              />
              <Button
                variant="outline"
                size="md"
                leftIcon={<FileText className="w-4 h-4" />}
                onClick={() => onNavigate?.('resume')}
                className="border-[#E2E8F0] text-[#111827] hover:bg-[#F8FAFC]"
              >
                Open Full Resume Studio
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
              <span className="text-xs text-[#64748B] font-medium">ATS Layout Spec</span>
              <div className="text-lg font-bold text-[#111827]">Classic Single-Column</div>
              <p className="text-xs text-[#64748B]">Parsed cleanly by modern applicant screening systems</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
              <span className="text-xs text-[#64748B] font-medium">Cloud Draft Status</span>
              <div className="text-lg font-bold text-[#2563EB]">
                {cloudResume ? 'Synchronized to Cloud' : 'Browser Storage Only'}
              </div>
              <p className="text-xs text-[#64748B]">
                {cloudResume?.updated_at
                  ? `Last saved: ${new Date(cloudResume.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Open editor to start your ATS draft'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <span className="text-xs text-[#64748B] font-medium">PDF Export Readiness</span>
                <div className={`text-lg font-bold ${isResumeReady ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isResumeReady ? 'Ready for Download' : 'Draft in Progress'}
                </div>
                <p className="text-xs text-[#64748B]">Print-safe A4 vector layout with auto page breaks</p>
              </div>
              <div className="pt-2">
                <ResumeDownloadButton
                  data={activeResumeData}
                  variant="outline"
                  size="sm"
                  label="Download PDF"
                  className="w-full justify-center border-[#E2E8F0] text-[#111827] hover:bg-[#F8FAFC]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PORTFOLIO BUILDER HUB */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-[#111827]">
                  Personal Portfolio Engine
                </h2>
                <Badge variant={isPortfolioPublished ? 'cyan' : 'default'} size="sm">
                  {isPortfolioPublished ? 'Published Live' : 'Draft Mode'}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 max-w-xl leading-relaxed">
                Responsive portfolio themes with fast Edge CDN delivery and interactive project showcases.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <PortfolioDownloadButton
                data={activePortfolioData}
                variant="glow"
                size="md"
                label="Download Portfolio ZIP"
                className="font-semibold"
              />
              <Button
                variant="outline"
                size="md"
                leftIcon={<Globe className="w-4 h-4" />}
                onClick={() => onNavigate?.('portfolio')}
                className="border-[#E2E8F0] text-[#111827] hover:bg-[#F8FAFC]"
              >
                Open Portfolio Studio
              </Button>
              {isPortfolioPublished && cloudPortfolio?.slug && (
                <a
                  href={`/p/${cloudPortfolio.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#111827] text-xs font-semibold flex items-center gap-1.5 border border-[#E2E8F0] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#64748B]" />
                  View Live Site
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
              <span className="text-xs text-[#64748B] font-medium">Active Theme</span>
              <div className="text-lg font-bold text-[#111827]">Modern Studio</div>
              <p className="text-xs text-[#64748B]">Tailored for engineering & design showcases</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
              <span className="text-xs text-[#64748B] font-medium">Attached Projects</span>
              <div className="text-lg font-bold text-[#2563EB]">
                {projectsList.length} Showcased
              </div>
              <p className="text-xs text-[#64748B]">Live demo links & GitHub repos connected</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
              <span className="text-xs text-[#64748B] font-medium">Public Web Handle</span>
              <div className="text-lg font-bold text-[#2563EB] font-mono truncate">
                {student.domainInfo.handle || 'Not configured'}
              </div>
              <p className="text-xs text-[#64748B]">
                {isPortfolioPublished ? 'Publicly discoverable' : 'Unpublished • Visible to you only'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MY PROJECTS */}
      {activeTab === 'projects' && (
        <div className="animate-fadeIn">
          <ProjectsView
            projects={projectsList}
            onOpenAddModal={() => setIsAddProjectOpen(true)}
          />
        </div>
      )}

      {/* TAB 6: CUSTOM DOMAIN & DNS */}
      {activeTab === 'domain' && (
        <div className="animate-fadeIn">
          <DomainView student={student} />
        </div>
      )}

      {/* TAB 7: PUBLISH & SHARE */}
      {activeTab === 'publish' && (
        <div className="animate-fadeIn">
          <PublishShareView
            student={student}
            onOpenPreview={() => onNavigate?.('portfolio-preview')}
            onOpenEditor={() => onNavigate?.('portfolio')}
          />
        </div>
      )}

      {/* TAB 8: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
            <h2 className="text-xl font-bold text-[#111827]">Workspace Preferences</h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              Configure privacy settings, domain routing, and recruiter discoverability.
            </p>

            <div className="divide-y divide-[#E2E8F0] mt-6">
              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-[#111827]">
                    Recruiter Directory Discovery
                  </h4>
                  <p className="text-xs text-[#64748B]">
                    Allow verified hiring partners to discover your public profile and ATS resume
                  </p>
                </div>
                <Badge variant="cyan" size="sm">
                  Enabled
                </Badge>
              </div>

              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-[#111827]">
                    Edge DNS Auto-SSL
                  </h4>
                  <p className="text-xs text-[#64748B]">
                    Automatically provision TLS certificate for connected custom domain
                  </p>
                </div>
                <Badge variant="cyan" size="sm">
                  Active
                </Badge>
              </div>

              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-[#111827]">
                    Database Row-Level Security
                  </h4>
                  <p className="text-xs text-[#64748B]">
                    All private tables isolated to your authenticated user identifier
                  </p>
                </div>
                <Badge variant="cyan" size="sm">
                  Enforced
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: ADMIN DOMAIN CLAIMS PORTAL */}
      {activeTab === 'admin-domains' && (
        <div className="animate-fadeIn">
          <AdminDomainRequestsView />
        </div>
      )}

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        onAddProject={handleAddProject}
      />
    </DashboardLayout>
  )
}

export default Dashboard
