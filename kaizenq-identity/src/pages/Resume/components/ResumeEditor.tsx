import React, { useState } from 'react'
import {
  User,
  GraduationCap,
  Code2,
  FolderGit2,
  Briefcase,
  Award,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Tag,
  Eye,
  EyeOff,
  ShieldCheck,
  FileText,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button.tsx'
import { ResumeDownloadButton } from '../../../components/download/ResumeDownloadButton.tsx'
import { hasSufficientResumeContent } from '../../../services/resumeExportService.ts'
import type {
  ResumeData,
  PersonalInfo,
  EducationEntry,
  ProjectEntry,
  ExperienceEntry,
  CertificationEntry,
  SectionVisibility,
} from '../types.ts'

export interface ResumeEditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
}

type AccordionSection =
  | 'personal'
  | 'education'
  | 'skills'
  | 'experience'
  | 'projects'
  | 'certifications'
  | 'additional'

export const ResumeEditor: React.FC<ResumeEditorProps> = ({ data, onChange }) => {
  const [openSection, setOpenSection] = useState<AccordionSection>('personal')

  // Skill input temporary states
  const [newLang, setNewLang] = useState('')
  const [newFramework, setNewFramework] = useState('')
  const [newTool, setNewTool] = useState('')
  const [newSoft, setNewSoft] = useState('')

  const visibleSections: SectionVisibility = {
    summary: true,
    skills: true,
    education: true,
    experience: true,
    projects: true,
    certifications: true,
    additional: true,
    ...data.visibleSections,
  }

  const toggleVisibility = (secKey: keyof SectionVisibility) => {
    onChange({
      ...data,
      visibleSections: {
        ...visibleSections,
        [secKey]: !visibleSections[secKey],
      },
    })
  }

  // Updaters
  const updatePersonal = (field: keyof PersonalInfo, val: string) => {
    onChange({
      ...data,
      personalInfo: {
        ...data.personalInfo,
        [field]: val,
      },
    })
  }

  // Education Helpers
  const addEducation = () => {
    const newEdu: EducationEntry = {
      id: `edu_${Date.now()}`,
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: 'Present',
    }
    onChange({ ...data, education: [...data.education, newEdu] })
  }

  const removeEducation = (id: string) => {
    onChange({ ...data, education: data.education.filter((e) => e.id !== id) })
  }

  const updateEducation = (id: string, field: keyof EducationEntry, val: string) => {
    onChange({
      ...data,
      education: data.education.map((e) => (e.id === id ? { ...e, [field]: val } : e)),
    })
  }

  // Skills Helpers
  const addSkillTag = (
    category: 'languages' | 'frameworks' | 'tools' | 'softSkills',
    tag: string,
    clearInput: () => void,
  ) => {
    const trimmed = tag.trim()
    if (!trimmed || data.skills[category].includes(trimmed)) return
    onChange({
      ...data,
      skills: {
        ...data.skills,
        [category]: [...data.skills[category], trimmed],
      },
    })
    clearInput()
  }

  const removeSkillTag = (
    category: 'languages' | 'frameworks' | 'tools' | 'softSkills',
    tagToRemove: string,
  ) => {
    onChange({
      ...data,
      skills: {
        ...data.skills,
        [category]: data.skills[category].filter((t) => t !== tagToRemove),
      },
    })
  }

  // Projects Helpers
  const addProject = () => {
    const newProj: ProjectEntry = {
      id: `proj_${Date.now()}`,
      name: '',
      description: '',
      technologies: [],
      projectUrl: '',
      githubUrl: '',
    }
    onChange({ ...data, projects: [...data.projects, newProj] })
  }

  const removeProject = (id: string) => {
    onChange({ ...data, projects: data.projects.filter((p) => p.id !== id) })
  }

  const updateProject = (id: string, field: keyof ProjectEntry, val: any) => {
    onChange({
      ...data,
      projects: data.projects.map((p) => (p.id === id ? { ...p, [field]: val } : eProjectField(p, field, val))),
    })
  }

  const eProjectField = (p: ProjectEntry, field: keyof ProjectEntry, val: any) => {
    return { ...p, [field]: val }
  }

  // Experience Helpers
  const addExperience = () => {
    const newExp: ExperienceEntry = {
      id: `exp_${Date.now()}`,
      organization: '',
      role: '',
      startDate: '',
      endDate: 'Present',
      bullets: [''],
    }
    onChange({ ...data, experience: [...data.experience, newExp] })
  }

  const removeExperience = (id: string) => {
    onChange({ ...data, experience: data.experience.filter((e) => e.id !== id) })
  }

  const updateExperience = (id: string, field: keyof ExperienceEntry, val: any) => {
    onChange({
      ...data,
      experience: data.experience.map((e) => (e.id === id ? { ...e, [field]: val } : e)),
    })
  }

  // Certifications Helpers
  const addCertification = () => {
    const newCert: CertificationEntry = {
      id: `cert_${Date.now()}`,
      name: '',
      issuer: '',
      issueDate: '',
      credentialUrl: '',
    }
    onChange({ ...data, certifications: [...data.certifications, newCert] })
  }

  const removeCertification = (id: string) => {
    onChange({ ...data, certifications: data.certifications.filter((c) => c.id !== id) })
  }

  const updateCertification = (id: string, field: keyof CertificationEntry, val: string) => {
    onChange({
      ...data,
      certifications: data.certifications.map((c) => (c.id === id ? { ...c, [field]: val } : c)),
    })
  }

  const toggleSection = (s: AccordionSection) => {
    setOpenSection(openSection === s ? ('' as any) : s)
  }

  return (
    <div className="space-y-4 no-print text-[#111827]">
      {/* SECTION VISIBILITY TOGGLE BAR */}
      <div className="p-3.5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#111827] uppercase tracking-wider text-[11px]">
            Visible Resume Sections
          </span>
          <span className="text-[#64748B] text-[11px]">
            Click to toggle sections on/off
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {(
            [
              { key: 'summary', label: 'Summary' },
              { key: 'education', label: 'Education' },
              { key: 'skills', label: 'Skills' },
              { key: 'experience', label: 'Experience' },
              { key: 'projects', label: 'Projects' },
              { key: 'certifications', label: 'Certifications' },
              { key: 'additional', label: 'Coursework / Honors' },
            ] as const
          ).map(({ key, label }) => {
            const isVisible = visibleSections[key] !== false
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleVisibility(key)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                  isVisible
                    ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                    : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] line-through opacity-60'
                }`}
              >
                {isVisible ? <Eye className="w-3 h-3 text-[#2563EB]" /> : <EyeOff className="w-3 h-3" />}
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 1. PERSONAL INFORMATION */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('personal')}
          className="w-full p-4.5 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Personal Information</h3>
              <p className="text-xs text-[#64748B]">Name, contact info, and professional links</p>
            </div>
          </div>
          {openSection === 'personal' ? (
            <ChevronUp className="w-4 h-4 text-[#64748B]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          )}
        </button>

        {openSection === 'personal' && (
          <div className="p-5 pt-1 border-t border-[#E2E8F0] space-y-4">
            {/* Privacy Protection Banner */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] text-[#2563EB]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
              <span>Privacy protected: No government IDs or street addresses required.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={data.personalInfo.fullName}
                  onChange={(e) => updatePersonal('fullName', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">
                  Professional Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full-Stack & Systems Engineer"
                  value={data.personalInfo.title}
                  onChange={(e) => updatePersonal('title', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@domain.com"
                  value={data.personalInfo.email}
                  onChange={(e) => updatePersonal('email', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={data.personalInfo.phone}
                  onChange={(e) => updatePersonal('phone', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">
                  Location (City, Country)
                </label>
                <input
                  type="text"
                  placeholder="Bangalore, India"
                  value={data.personalInfo.location}
                  onChange={(e) => updatePersonal('location', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={data.personalInfo.linkedinUrl}
                  onChange={(e) => updatePersonal('linkedinUrl', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">
                  GitHub Profile URL
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={data.personalInfo.githubUrl}
                  onChange={(e) => updatePersonal('githubUrl', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">
                  Portfolio Web Handle
                </label>
                <input
                  type="url"
                  placeholder="https://alexmorgan.dev"
                  value={data.personalInfo.portfolioUrl}
                  onChange={(e) => updatePersonal('portfolioUrl', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[#64748B]">
                  Professional Summary (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => toggleVisibility('summary')}
                  className="text-[11px] text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {visibleSections.summary !== false ? 'Hide from Resume' : 'Show on Resume'}
                </button>
              </div>
              <textarea
                rows={3}
                placeholder="2-3 impactful sentences highlighting your technical specialization and proven results..."
                value={data.personalInfo.summary}
                onChange={(e) => updatePersonal('summary', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#2563EB] leading-relaxed"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. TECHNICAL SKILLS */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('skills')}
          className="w-full p-4.5 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Technical Core Skills</h3>
              <p className="text-xs text-[#64748B]">Languages, frameworks, tools, and competencies</p>
            </div>
          </div>
          {openSection === 'skills' ? (
            <ChevronUp className="w-4 h-4 text-[#64748B]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          )}
        </button>

        {openSection === 'skills' && (
          <div className="p-5 pt-1 border-t border-[#E2E8F0] space-y-4">
            {/* Programming Languages */}
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                Programming Languages
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {data.skills.languages.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-xs font-medium text-[#2563EB] border border-[#BFDBFE]"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeSkillTag('languages', tag)}
                      className="text-[#64748B] hover:text-red-500 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. TypeScript, Python, Go..."
                  value={newLang}
                  onChange={(e) => setNewLang(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkillTag('languages', newLang, () => setNewLang(''))
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => addSkillTag('languages', newLang, () => setNewLang(''))}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Frameworks & Libraries */}
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                Frameworks & Libraries
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {data.skills.frameworks.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-xs font-medium text-[#2563EB] border border-[#BFDBFE]"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeSkillTag('frameworks', tag)}
                      className="text-[#64748B] hover:text-red-500 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. React, Next.js, FastAPI..."
                  value={newFramework}
                  onChange={(e) => setNewFramework(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkillTag('frameworks', newFramework, () => setNewFramework(''))
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => addSkillTag('frameworks', newFramework, () => setNewFramework(''))}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Tools & Infrastructure */}
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                Tools & Platforms
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {data.skills.tools.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-xs font-medium text-[#2563EB] border border-[#BFDBFE]"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeSkillTag('tools', tag)}
                      className="text-[#64748B] hover:text-red-500 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Docker, PostgreSQL, Redis, Git..."
                  value={newTool}
                  onChange={(e) => setNewTool(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkillTag('tools', newTool, () => setNewTool(''))
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => addSkillTag('tools', newTool, () => setNewTool(''))}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Optional Soft Skills */}
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                Optional Core Competencies & Soft Skills
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {data.skills.softSkills.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-xs font-medium text-[#2563EB] border border-[#BFDBFE]"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeSkillTag('softSkills', tag)}
                      className="text-[#64748B] hover:text-red-500 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. System Design, Technical Writing..."
                  value={newSoft}
                  onChange={(e) => setNewSoft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkillTag('softSkills', newSoft, () => setNewSoft(''))
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => addSkillTag('softSkills', newSoft, () => setNewSoft(''))}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. EDUCATION */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('education')}
          className="w-full p-4.5 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Education</h3>
              <p className="text-xs text-[#64748B]">Institutions, degrees, and academic performance</p>
            </div>
          </div>
          {openSection === 'education' ? (
            <ChevronUp className="w-4 h-4 text-[#64748B]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          )}
        </button>

        {openSection === 'education' && (
          <div className="p-5 pt-1 border-t border-[#E2E8F0] space-y-4">
            {data.education.length === 0 ? (
              <div className="text-center py-6 px-4 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E2E8F0]">
                <p className="text-xs text-[#64748B] mb-2">No education records added yet.</p>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={addEducation}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add First Degree / Institution
                </Button>
              </div>
            ) : (
              data.education.map((edu, idx) => (
                <div
                  key={edu.id}
                  className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#2563EB]">
                      Education #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeEducation(edu.id)}
                      className="p-1 text-[#64748B] hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#64748B] mb-1">
                        Institution Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bangalore Institute of Technology"
                        value={edu.institution}
                        onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#64748B] mb-1">
                        Degree *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bachelor of Technology"
                        value={edu.degree}
                        onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#64748B] mb-1">
                        Branch / Field of Study
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Computer Science"
                        value={edu.fieldOfStudy}
                        onChange={(e) => updateEducation(edu.id, 'fieldOfStudy', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#64748B] mb-1">
                        Timeframe (Start – End)
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="2022"
                          value={edu.startDate}
                          onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                          className="w-1/2 px-2 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="2026"
                          value={edu.endDate}
                          onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                          className="w-1/2 px-2 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#64748B] mb-1">
                        Grade / CGPA (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 8.9 / 10 CGPA"
                        value={edu.grade || ''}
                        onChange={(e) => updateEducation(edu.id, 'grade', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}

            {data.education.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={addEducation}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="w-full"
              >
                Add Education Entry
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 4. WORK EXPERIENCE */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('experience')}
          className="w-full p-4.5 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Work Experience</h3>
              <p className="text-xs text-[#64748B]">Internships, fellowships, and professional roles</p>
            </div>
          </div>
          {openSection === 'experience' ? (
            <ChevronUp className="w-4 h-4 text-[#64748B]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          )}
        </button>

        {openSection === 'experience' && (
          <div className="p-5 pt-1 border-t border-[#E2E8F0] space-y-4">
            {data.experience.length === 0 ? (
              <div className="text-center py-6 px-4 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E2E8F0]">
                <p className="text-xs text-[#64748B] mb-2">No work experience entries added yet.</p>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={addExperience}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add First Experience Entry
                </Button>
              </div>
            ) : (
              data.experience.map((exp, idx) => (
                <div
                  key={exp.id}
                  className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#2563EB]">
                      Role #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeExperience(exp.id)}
                      className="p-1 text-[#64748B] hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#64748B] mb-1">
                        Organization / Company *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. KaizenQ Engineering Fellowship"
                        value={exp.organization}
                        onChange={(e) => updateExperience(exp.id, 'organization', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#64748B] mb-1">
                        Role / Title *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Full-Stack Engineering Intern"
                        value={exp.role}
                        onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#64748B] mb-1">
                        Start Date
                      </label>
                      <input
                        type="text"
                        placeholder="Jan 2025"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#64748B] mb-1">
                        End Date
                      </label>
                      <input
                        type="text"
                        placeholder="Present"
                        value={exp.endDate}
                        onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#64748B] mb-1">
                      Bullet Points (One bullet per line)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Designed modular React components...&#10;Engineered low-latency API pipelines..."
                      value={exp.bullets.join('\n')}
                      onChange={(e) =>
                        updateExperience(
                          exp.id,
                          'bullets',
                          e.target.value.split('\n').filter((l) => l.trim().length > 0),
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB] leading-relaxed"
                    />
                  </div>
                </div>
              ))
            )}

            {data.experience.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={addExperience}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="w-full"
              >
                Add Work Experience
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 5. KEY PROJECTS */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('projects')}
          className="w-full p-4.5 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Key Engineering Projects</h3>
              <p className="text-xs text-[#64748B]">Repositories, architecture tags, and live demos</p>
            </div>
          </div>
          {openSection === 'projects' ? (
            <ChevronUp className="w-4 h-4 text-[#64748B]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          )}
        </button>

        {openSection === 'projects' && (
          <div className="p-5 pt-1 border-t border-[#E2E8F0] space-y-4">
            {data.projects.length === 0 ? (
              <div className="text-center py-6 px-4 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E2E8F0]">
                <p className="text-xs text-[#64748B] mb-2">No projects added yet.</p>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={addProject}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add First Project
                </Button>
              </div>
            ) : (
              data.projects.map((proj, idx) => (
                <div
                  key={proj.id}
                  className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#2563EB]">
                      Project #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeProject(proj.id)}
                      className="p-1 text-[#64748B] hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#64748B] mb-1">
                        Project Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. NeuralTrace"
                        value={proj.name}
                        onChange={(e) => updateProject(proj.id, 'name', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#64748B] mb-1">
                        Technologies Used (Comma separated)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Python, FastAPI, Redis"
                        value={proj.technologies.join(', ')}
                        onChange={(e) =>
                          updateProject(
                            proj.id,
                            'technologies',
                            e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                          )
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#64748B] mb-1">
                      Short Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Engineered high-throughput engine achieving sub-10ms profiling..."
                      value={proj.description}
                      onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB] leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#64748B] mb-1">
                        Live Demo URL (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={proj.projectUrl || ''}
                        onChange={(e) => updateProject(proj.id, 'projectUrl', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#64748B] mb-1">
                        GitHub URL (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://github.com/..."
                        value={proj.githubUrl || ''}
                        onChange={(e) => updateProject(proj.id, 'githubUrl', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}

            {data.projects.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={addProject}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="w-full"
              >
                Add Project Entry
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 6. CERTIFICATIONS */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('certifications')}
          className="w-full p-4.5 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Certifications & Credentials</h3>
              <p className="text-xs text-[#64748B]">Verified credentials, issuers, and dates</p>
            </div>
          </div>
          {openSection === 'certifications' ? (
            <ChevronUp className="w-4 h-4 text-[#64748B]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          )}
        </button>

        {openSection === 'certifications' && (
          <div className="p-5 pt-1 border-t border-[#E2E8F0] space-y-4">
            {data.certifications.length === 0 ? (
              <div className="text-center py-6 px-4 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E2E8F0]">
                <p className="text-xs text-[#64748B] mb-2">No certifications added yet.</p>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={addCertification}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add First Certification
                </Button>
              </div>
            ) : (
              data.certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#2563EB]">
                      Credential
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCertification(cert.id)}
                      className="p-1 text-[#64748B] hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Certificate Name (e.g. AWS Cloud Practitioner)"
                      value={cert.name}
                      onChange={(e) => updateCertification(cert.id, 'name', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                    />
                    <input
                      type="text"
                      placeholder="Issuing Body (e.g. Amazon Web Services)"
                      value={cert.issuer}
                      onChange={(e) => updateCertification(cert.id, 'issuer', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Issue Date / Year (e.g. 2025)"
                      value={cert.issueDate}
                      onChange={(e) => updateCertification(cert.id, 'issueDate', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                    />
                    <input
                      type="url"
                      placeholder="Credential Verification URL (Optional)"
                      value={cert.credentialUrl || ''}
                      onChange={(e) => updateCertification(cert.id, 'credentialUrl', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>
              ))
            )}

            {data.certifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={addCertification}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="w-full"
              >
                Add Certification
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 7. ADDITIONAL INFORMATION */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('additional')}
          className="w-full p-4.5 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Achievements & Coursework</h3>
              <p className="text-xs text-[#64748B]">Honors, academic coursework, and spoken languages</p>
            </div>
          </div>
          {openSection === 'additional' ? (
            <ChevronUp className="w-4 h-4 text-[#64748B]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          )}
        </button>

        {openSection === 'additional' && (
          <div className="p-5 pt-1 border-t border-[#E2E8F0] space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">
                Honors & Achievements (One per line)
              </label>
              <textarea
                rows={2}
                placeholder="Top 1% builder at National Hackathon..."
                value={data.additional.achievements.join('\n')}
                onChange={(e) =>
                  onChange({
                    ...data,
                    additional: {
                      ...data.additional,
                      achievements: e.target.value.split('\n').filter((l) => l.trim().length > 0),
                    },
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">
                Relevant University Coursework (Comma separated)
              </label>
              <input
                type="text"
                placeholder="Data Structures, Operating Systems, Database Systems"
                value={data.additional.coursework.join(', ')}
                onChange={(e) =>
                  onChange({
                    ...data,
                    additional: {
                      ...data.additional,
                      coursework: e.target.value.split(',').map((c) => c.trim()).filter(Boolean),
                    },
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">
                Languages Spoken (Comma separated)
              </label>
              <input
                type="text"
                placeholder="English (Fluent), Hindi (Native)"
                value={data.additional.languages.join(', ')}
                onChange={(e) =>
                  onChange({
                    ...data,
                    additional: {
                      ...data.additional,
                      languages: e.target.value.split(',').map((l) => l.trim()).filter(Boolean),
                    },
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Completion & Export Area */}
      <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-white to-[#F8FAFC] border border-[#BFDBFE] shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#111827]">
                Ready to Export Your ATS Resume?
              </h3>
              <p className="text-xs text-[#64748B]">
                Export your structured resume to a clean, search-friendly A4 PDF.
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-mono px-2.5 py-1 rounded-full border shrink-0 ${
              hasSufficientResumeContent(data)
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                : 'bg-amber-50 text-amber-700 border-amber-200 font-medium'
            }`}
          >
            {hasSufficientResumeContent(data) ? 'Ready for Export' : 'Draft in Progress'}
          </span>
        </div>

        <p className="text-xs text-[#64748B] leading-relaxed">
          {hasSufficientResumeContent(data)
            ? 'Your resume contains valid ATS structure and selectable vector typography. Export directly to PDF for recruiter screening and application submissions.'
            : 'Fill in your name, professional title, and at least one education, experience, or skill entry to download your resume PDF.'}
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0]">
          <span className="text-[11px] font-mono text-[#64748B]">
            Preserves typography, spacing, hyperlinks, and A4 print layout
          </span>
          <ResumeDownloadButton
            data={data}
            variant="glow"
            size="md"
            label="Download Resume PDF"
            className="text-xs font-bold"
          />
        </div>
      </div>
    </div>
  )
}

export default ResumeEditor
