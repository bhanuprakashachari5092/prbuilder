import React, { useState } from 'react'
import {
  Mail,
  MapPin,
  ExternalLink,
  Code2,
  Briefcase,
  GraduationCap,
  Award,
  Layers,
  Sparkles,
  ArrowUpRight,
  Sun,
  Moon,
  ArrowLeft,
  Palette,
  FileText,
} from 'lucide-react'
import type { PortfolioData, PortfolioThemeId } from '../../types.ts'

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
)

const LinkedinIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
)

const TwitterIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

export interface PublicPortfolioViewProps {
  data: PortfolioData
  onToggleTheme?: (theme: PortfolioThemeId) => void
  isPreviewMode?: boolean
  onBackToBuilder?: () => void
}

export const PublicPortfolioView: React.FC<PublicPortfolioViewProps> = ({
  data,
  onToggleTheme,
  isPreviewMode = false,
  onBackToBuilder,
}) => {
  const {
    profile,
    skills,
    education,
    projects,
    experience,
    achievements,
    certifications,
    contact,
    sectionVisibility,
    theme,
  } = data

  // Normalize theme (midnight aliases to modern)
  const activeThemeId: PortfolioThemeId =
    theme === 'midnight' ? 'modern' : theme || 'modern'

  // Local light/dark mode for Minimal theme
  const [minimalMode, setMinimalMode] = useState<'light' | 'dark'>('light')

  // Dynamic Theme Classes
  const getThemeClasses = () => {
    switch (activeThemeId) {
      case 'developer':
        return {
          wrapper: 'bg-[#0B1015] text-[#F1F5F9] font-mono selection:bg-emerald-500/30',
          nav: 'bg-[#0B1015]/90 border-emerald-500/20 backdrop-blur-md',
          card: 'bg-[#121820] border-emerald-500/20 hover:border-emerald-400/50 text-[#F1F5F9] shadow-md shadow-emerald-950/20',
          cardSubtle: 'bg-[#0F161E] text-[#F1F5F9] border-emerald-500/15',
          badge: 'bg-[#0D2421] text-[#34D399] border-emerald-500/30 font-mono text-[11px]',
          mutedText: 'text-[#94A3B8]',
          subtleText: 'text-[#64748B]',
          accentText: 'text-[#34D399]',
          primaryButton: 'bg-emerald-500 hover:bg-emerald-400 text-[#0B1015] font-mono font-bold shadow-lg shadow-emerald-500/20',
          secondaryButton: 'bg-[#121820] hover:bg-[#18222C] text-[#E2E8F0] border-emerald-500/25',
          divider: 'border-emerald-500/20',
          indicator: 'bg-emerald-400',
          terminalPrefix: '$ ',
          fontHeading: 'font-mono',
        }
      case 'minimal': {
        const isDark = minimalMode === 'dark'
        return {
          wrapper: isDark
            ? 'bg-[#09090B] text-[#FAFAFA] font-sans selection:bg-zinc-800'
            : 'bg-[#FAFAFA] text-[#18181B] font-sans selection:bg-zinc-200',
          nav: isDark ? 'bg-[#09090B]/90 border-zinc-800 backdrop-blur-md' : 'bg-white/90 border-zinc-200 backdrop-blur-md',
          card: isDark
            ? 'bg-[#141417] border-zinc-800/80 hover:border-zinc-700 text-[#FAFAFA] shadow-sm'
            : 'bg-white border-zinc-200/90 hover:border-zinc-300 text-[#18181B] shadow-sm',
          cardSubtle: isDark ? 'bg-[#1C1C21] text-[#FAFAFA]' : 'bg-zinc-50 text-[#18181B]',
          badge: isDark
            ? 'bg-zinc-900 text-zinc-300 border-zinc-800 text-[11px]'
            : 'bg-zinc-100 text-zinc-800 border-zinc-200 text-[11px]',
          mutedText: isDark ? 'text-zinc-400' : 'text-zinc-600',
          subtleText: isDark ? 'text-zinc-500' : 'text-zinc-400',
          accentText: isDark ? 'text-zinc-100 font-semibold' : 'text-zinc-900 font-semibold',
          primaryButton: isDark
            ? 'bg-white hover:bg-zinc-200 text-black font-medium shadow-sm'
            : 'bg-zinc-900 hover:bg-black text-white font-medium shadow-sm',
          secondaryButton: isDark
            ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
            : 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-200',
          divider: isDark ? 'border-zinc-800' : 'border-zinc-200',
          indicator: isDark ? 'bg-zinc-400' : 'bg-zinc-900',
          terminalPrefix: '',
          fontHeading: 'font-sans font-semibold tracking-tight',
        }
      }
      case 'creative':
        return {
          wrapper: 'bg-[#0D0B18] text-[#FFFFFF] font-sans selection:bg-fuchsia-500/30',
          nav: 'bg-[#0D0B18]/90 border-violet-500/20 backdrop-blur-md',
          card: 'bg-[#17132F]/85 backdrop-blur-md border-violet-500/20 hover:border-fuchsia-400/40 text-white shadow-xl shadow-purple-950/30',
          cardSubtle: 'bg-[#1F1940] text-white border-violet-500/15',
          badge: 'bg-violet-950/70 text-violet-300 border-violet-500/30 font-medium text-[11px]',
          mutedText: 'text-[#B4A9D6]',
          subtleText: 'text-[#7D6FA3]',
          accentText: 'text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-pink-400 to-amber-300 font-bold',
          primaryButton: 'bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 text-white font-semibold hover:opacity-95 shadow-lg shadow-violet-600/30',
          secondaryButton: 'bg-[#1F1940] hover:bg-[#2A2356] text-violet-200 border-violet-500/20',
          divider: 'border-violet-500/20',
          indicator: 'bg-gradient-to-r from-pink-500 to-violet-500',
          terminalPrefix: '',
          fontHeading: 'font-["Outfit",sans-serif] tracking-tight',
        }
      case 'modern':
      default:
        return {
          wrapper: 'bg-[#F7F9FC] text-[#111827] font-sans selection:bg-[#EFF6FF]',
          nav: 'bg-white/90 border-[#E2E8F0] backdrop-blur-md',
          card: 'bg-white border-[#E2E8F0] hover:border-[#2563EB]/40 text-[#111827] shadow-sm',
          cardSubtle: 'bg-[#F8FAFC] text-[#111827] border-[#E2E8F0]',
          badge: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE] font-medium text-[11px]',
          mutedText: 'text-[#64748B]',
          subtleText: 'text-[#94A3B8]',
          accentText: 'text-[#2563EB] font-semibold',
          primaryButton: 'bg-[#2563EB] text-white font-semibold hover:bg-[#1D4ED8] shadow-sm',
          secondaryButton: 'bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#111827] border-[#E2E8F0]',
          divider: 'border-[#E2E8F0]',
          indicator: 'bg-[#2563EB]',
          terminalPrefix: '',
          fontHeading: 'font-sans font-semibold tracking-tight',
        }
    }
  }

  const themeClasses = getThemeClasses()

  const isValidExternalUrl = (url?: string): boolean => {
    if (!url) return false
    const trimmed = url.trim()
    const lower = trimmed.toLowerCase()
    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('data:') ||
      lower.startsWith('vbscript:') ||
      lower.startsWith('file:')
    ) {
      return false
    }
    return /^https?:\/\//i.test(trimmed)
  }

  const isValidEmail = (email?: string): boolean => {
    if (!email) return false
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  }

  const validEmail = isValidEmail(profile.email)
    ? profile.email
    : isValidEmail(contact.email)
      ? contact.email
      : undefined

  const hasSkills =
    skills.languages.length > 0 ||
    skills.frameworks.length > 0 ||
    skills.tools.length > 0 ||
    skills.otherSkills.length > 0

  return (
    <div className={`min-h-screen ${themeClasses.wrapper} transition-colors duration-200`}>
      {/* 1. Top Navigation Bar */}
      {!isPreviewMode && (
        <header className={`sticky top-0 z-40 border-b ${themeClasses.nav} transition-colors`}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBackToBuilder && (
                <button
                  onClick={onBackToBuilder}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${themeClasses.secondaryButton}`}
                  title="Return to Portfolio Editor"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Workspace</span>
                </button>
              )}
              <span className={`text-xs font-mono font-semibold hidden sm:inline ${themeClasses.accentText}`}>
                {themeClasses.terminalPrefix}
                {profile.fullName || 'Student'} • Portfolio
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Quick Switcher */}
              {onToggleTheme && (
                <div className="flex items-center gap-1 p-1 rounded-xl border border-[#E2E8F0] bg-white text-xs">
                  <Palette className="w-3.5 h-3.5 ml-1.5 opacity-60 shrink-0" />
                  {(['modern', 'developer', 'minimal', 'creative'] as const).map((tId) => (
                    <button
                      key={tId}
                      onClick={() => onToggleTheme(tId)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium capitalize transition-all cursor-pointer ${
                        activeThemeId === tId
                          ? `${themeClasses.primaryButton} shadow-sm`
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      title={`Switch to ${tId} theme`}
                    >
                      {tId}
                    </button>
                  ))}
                </div>
              )}

              {/* Minimal Theme Light/Dark Mode Switcher */}
              {activeThemeId === 'minimal' && (
                <button
                  onClick={() => setMinimalMode(minimalMode === 'dark' ? 'light' : 'dark')}
                  className={`p-2 rounded-lg text-xs border cursor-pointer transition-colors ${themeClasses.secondaryButton}`}
                  title={`Switch to ${minimalMode === 'dark' ? 'Light' : 'Dark'} mode`}
                  aria-label="Toggle Light/Dark Mode"
                >
                  {minimalMode === 'dark' ? (
                    <Sun className="w-3.5 h-3.5 text-amber-300" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-zinc-800" />
                  )}
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* 2. Main Content Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-16">
        {/* ===================================================================
            HERO / PROFILE OVERVIEW
           =================================================================== */}
        <section className="space-y-6">
          <div className="flex flex-col-reverse md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              {profile.location && (
                <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${themeClasses.badge}`}>
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{profile.location}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <h1 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight ${themeClasses.fontHeading}`}>
                  {themeClasses.terminalPrefix}
                  {profile.fullName || 'Portfolio'}
                </h1>
                {profile.title && (
                  <p className={`text-lg sm:text-xl font-semibold ${themeClasses.accentText}`}>
                    {profile.title}
                  </p>
                )}
              </div>

              {profile.shortBio && (
                <p className={`text-sm sm:text-base leading-relaxed ${themeClasses.mutedText}`}>
                  {profile.shortBio}
                </p>
              )}

              {/* Action Buttons & Social Links */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {validEmail && (
                  <a
                    href={`mailto:${validEmail}`}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${themeClasses.primaryButton}`}
                  >
                    <Mail className="w-4 h-4" />
                    <span>Get in Touch</span>
                  </a>
                )}

                {isValidExternalUrl(profile.githubUrl) && (
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-colors ${themeClasses.secondaryButton}`}
                    title="GitHub Profile"
                  >
                    <GithubIcon className="w-4 h-4" />
                    <span>GitHub</span>
                    <ArrowUpRight className="w-3 h-3 opacity-60" />
                  </a>
                )}

                {isValidExternalUrl(profile.linkedinUrl) && (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-colors ${themeClasses.secondaryButton}`}
                    title="LinkedIn Profile"
                  >
                    <LinkedinIcon className="w-4 h-4" />
                    <span>LinkedIn</span>
                    <ArrowUpRight className="w-3 h-3 opacity-60" />
                  </a>
                )}

                {isValidExternalUrl(profile.portfolioUrl) && (
                  <a
                    href={profile.portfolioUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-colors ${themeClasses.secondaryButton}`}
                    title="Personal Website"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Website</span>
                  </a>
                )}

                {isValidExternalUrl(profile.twitterUrl) && (
                  <a
                    href={profile.twitterUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-colors ${themeClasses.secondaryButton}`}
                    title="Social Link"
                  >
                    <TwitterIcon className="w-4 h-4" />
                  </a>
                )}

                {isValidExternalUrl(profile.resumeUrl) && (
                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-colors ${themeClasses.secondaryButton}`}
                    title="Download Resume / CV"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Resume</span>
                    <ArrowUpRight className="w-3 h-3 opacity-60" />
                  </a>
                )}
              </div>
            </div>

            {/* Profile Avatar */}
            <div className="shrink-0">
              {profile.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt={profile.fullName || 'Student profile avatar'}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover shadow-2xl border-2 border-white/10"
                />
              ) : (
                <div
                  className={`w-28 h-28 sm:w-36 sm:h-36 rounded-2xl flex items-center justify-center font-bold text-3xl sm:text-4xl border-2 ${themeClasses.card}`}
                >
                  {profile.fullName
                    ? profile.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                    : 'PR'}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ===================================================================
            ABOUT SECTION
           =================================================================== */}
        {sectionVisibility.about && profile.aboutMe && (
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full ${themeClasses.indicator}`} />
              <span>About Me</span>
            </h2>
            <div className={`p-6 sm:p-8 rounded-2xl border ${themeClasses.card} leading-relaxed text-sm sm:text-base`}>
              <p className={themeClasses.mutedText}>{profile.aboutMe}</p>
            </div>
          </section>
        )}

        {/* ===================================================================
            SKILLS SECTION
           =================================================================== */}
        {sectionVisibility.skills && hasSkills && (
          <section className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5">
              <Code2 className={`w-5 h-5 ${themeClasses.accentText}`} />
              <span>Technical Skills</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.languages.length > 0 && (
                <div className={`p-5 rounded-2xl border ${themeClasses.card} space-y-3`}>
                  <h3 className="text-xs uppercase tracking-wider font-semibold opacity-70">
                    Languages
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.languages.map((item) => (
                      <span
                        key={item}
                        className={`px-2.5 py-1 rounded-lg border font-medium ${themeClasses.badge}`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {skills.frameworks.length > 0 && (
                <div className={`p-5 rounded-2xl border ${themeClasses.card} space-y-3`}>
                  <h3 className="text-xs uppercase tracking-wider font-semibold opacity-70">
                    Frameworks & Libraries
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.frameworks.map((item) => (
                      <span
                        key={item}
                        className={`px-2.5 py-1 rounded-lg border font-medium ${themeClasses.badge}`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {skills.tools.length > 0 && (
                <div className={`p-5 rounded-2xl border ${themeClasses.card} space-y-3`}>
                  <h3 className="text-xs uppercase tracking-wider font-semibold opacity-70">
                    Tools & Platforms
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.tools.map((item) => (
                      <span
                        key={item}
                        className={`px-2.5 py-1 rounded-lg border font-medium ${themeClasses.badge}`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {skills.otherSkills.length > 0 && (
                <div className={`p-5 rounded-2xl border ${themeClasses.card} space-y-3`}>
                  <h3 className="text-xs uppercase tracking-wider font-semibold opacity-70">
                    Core Concepts & Other
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.otherSkills.map((item) => (
                      <span
                        key={item}
                        className={`px-2.5 py-1 rounded-lg border font-medium ${themeClasses.badge}`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===================================================================
            FEATURED PROJECTS SECTION
           =================================================================== */}
        {sectionVisibility.projects && projects.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5">
                <Layers className={`w-5 h-5 ${themeClasses.accentText}`} />
                <span>Featured Engineering Projects</span>
              </h2>
              <span className={`text-xs font-mono ${themeClasses.subtleText}`}>
                {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className={`p-6 rounded-2xl border flex flex-col justify-between transition-all duration-200 group ${themeClasses.card}`}
                >
                  <div className="space-y-3.5">
                    {proj.imageUrl && (
                      <img
                        src={proj.imageUrl}
                        alt={proj.title}
                        className="w-full h-44 object-cover rounded-xl border border-white/10"
                      />
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base sm:text-lg font-bold group-hover:text-current transition-colors">
                        {proj.title}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0">
                        {isValidExternalUrl(proj.githubUrl) && (
                          <a
                            href={proj.githubUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className={`p-2 rounded-lg border transition-colors ${themeClasses.secondaryButton}`}
                            title="View Source Code on GitHub"
                          >
                            <GithubIcon className="w-4 h-4" />
                          </a>
                        )}
                        {isValidExternalUrl(proj.liveUrl) && (
                          <a
                            href={proj.liveUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className={`p-2 rounded-lg border transition-colors ${themeClasses.secondaryButton}`}
                            title="Open Live Deployment"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    <p className={`text-xs sm:text-sm leading-relaxed ${themeClasses.mutedText}`}>
                      {proj.description}
                    </p>
                  </div>

                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/5 mt-4">
                      {proj.technologies.map((t) => (
                        <span
                          key={t}
                          className={`text-[11px] px-2 py-0.5 rounded-md border font-mono font-medium ${themeClasses.badge}`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===================================================================
            WORK EXPERIENCE SECTION
           =================================================================== */}
        {sectionVisibility.experience && experience.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5">
              <Briefcase className={`w-5 h-5 ${themeClasses.accentText}`} />
              <span>Experience & Roles</span>
            </h2>

            <div className="space-y-4">
              {experience.map((exp) => (
                <div
                  key={exp.id}
                  className={`p-6 rounded-2xl border space-y-2 ${themeClasses.card}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="text-base font-bold">{exp.role}</h3>
                    <span className={`text-xs font-mono ${themeClasses.subtleText}`}>
                      {exp.startDate} – {exp.endDate}
                    </span>
                  </div>
                  <p className={`text-xs sm:text-sm font-semibold ${themeClasses.accentText}`}>
                    {exp.organization}
                  </p>
                  <p className={`text-xs sm:text-sm leading-relaxed pt-1 ${themeClasses.mutedText}`}>
                    {exp.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===================================================================
            EDUCATION SECTION
           =================================================================== */}
        {sectionVisibility.education && education.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5">
              <GraduationCap className={`w-5 h-5 ${themeClasses.accentText}`} />
              <span>Education</span>
            </h2>

            <div className="space-y-4">
              {education.map((edu) => (
                <div
                  key={edu.id}
                  className={`p-6 rounded-2xl border space-y-2 ${themeClasses.card}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="text-base font-bold">{edu.institution}</h3>
                    <span className={`text-xs font-mono ${themeClasses.subtleText}`}>
                      {edu.startDate} – {edu.endDate}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                    <span className="font-semibold">{edu.degree}</span>
                    <span className="opacity-40">•</span>
                    <span className={themeClasses.mutedText}>{edu.specialization}</span>
                    {edu.grade && (
                      <>
                        <span className="opacity-40">•</span>
                        <span className={`font-mono font-semibold ${themeClasses.accentText}`}>
                          {edu.grade}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===================================================================
            ACHIEVEMENTS & HONORS
           =================================================================== */}
        {sectionVisibility.achievements && achievements.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5">
              <Sparkles className={`w-5 h-5 ${themeClasses.accentText}`} />
              <span>Key Achievements & Honors</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-5 rounded-2xl border space-y-1.5 ${themeClasses.card}`}
                >
                  <h3 className="text-sm font-bold">{ach.title}</h3>
                  <p className={`text-xs sm:text-sm leading-relaxed ${themeClasses.mutedText}`}>
                    {ach.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===================================================================
            CERTIFICATIONS & CREDENTIALS
           =================================================================== */}
        {sectionVisibility.certifications && certifications.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5">
              <Award className={`w-5 h-5 ${themeClasses.accentText}`} />
              <span>Certifications & Credentials</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {certifications.map((cert) => (
                <div
                  key={cert.id}
                  className={`p-5 rounded-2xl border flex items-center justify-between gap-3 ${themeClasses.card}`}
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold">{cert.name}</h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={themeClasses.mutedText}>{cert.issuer}</span>
                      {cert.issueDate && (
                        <>
                          <span className="opacity-40">•</span>
                          <span className={`font-mono ${themeClasses.subtleText}`}>
                            {cert.issueDate}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {isValidExternalUrl(cert.credentialUrl) && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={`p-2 rounded-lg border transition-colors shrink-0 ${themeClasses.secondaryButton}`}
                      title="Verify Credential"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===================================================================
            CONTACT / CALL TO ACTION
           =================================================================== */}
        {sectionVisibility.contact && (
          <section className="space-y-6 pt-4">
            <div className={`p-8 sm:p-12 rounded-3xl border text-center space-y-5 ${themeClasses.card}`}>
              <div className="space-y-2 max-w-xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Let's Connect
                </h2>
                <p className={`text-xs sm:text-sm leading-relaxed ${themeClasses.mutedText}`}>
                  {contact.contactCtaMessage ||
                    'Have an exciting opportunity or open-source project? Feel free to reach out directly.'}
                </p>
              </div>

              {validEmail && (
                <div className="pt-2">
                  <a
                    href={`mailto:${validEmail}`}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${themeClasses.primaryButton}`}
                  >
                    <Mail className="w-4 h-4" />
                    <span>{validEmail}</span>
                  </a>
                </div>
              )}

              {contact.socialLinks.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 pt-4">
                  {contact.socialLinks
                    .filter((s) => isValidExternalUrl(s.url))
                    .map((s) => (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${themeClasses.secondaryButton}`}
                      >
                        {s.platform}
                      </a>
                    ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* ===================================================================
          FOOTER WITH SUBTLE ATTRIBUTION
         =================================================================== */}
      <footer className={`border-t py-8 px-4 text-center text-xs ${themeClasses.divider} ${themeClasses.subtleText}`}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
          <span>© {new Date().getFullYear()} {profile.fullName || 'Student'}</span>
          <span className="flex items-center gap-1.5">
            <span>Powered by</span>
            <span className={`font-semibold ${themeClasses.accentText}`}>
              PR Builder
            </span>
          </span>
        </div>
      </footer>
    </div>
  )
}

export default PublicPortfolioView
