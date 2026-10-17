import React from 'react'
import type { ResumeData } from '../../types.ts'

export interface ModernProfessionalTemplateProps {
  data: ResumeData
}

export const ModernProfessionalTemplate: React.FC<ModernProfessionalTemplateProps> = ({
  data,
}) => {
  const { personalInfo, education, skills, projects, experience, certifications, additional, visibleSections } =
    data

  const showSummary = visibleSections?.summary !== false && Boolean(personalInfo.summary?.trim())
  const showEducation = visibleSections?.education !== false && education.length > 0
  const showSkills =
    visibleSections?.skills !== false &&
    (skills.languages.length > 0 ||
      skills.frameworks.length > 0 ||
      skills.tools.length > 0 ||
      skills.softSkills.length > 0)
  const showExperience = visibleSections?.experience !== false && experience.length > 0
  const showProjects = visibleSections?.projects !== false && projects.length > 0
  const showCertifications = visibleSections?.certifications !== false && certifications.length > 0
  const showAdditional =
    visibleSections?.additional !== false &&
    (additional.achievements.length > 0 ||
      additional.coursework.length > 0 ||
      additional.languages.length > 0)

  const formatUrl = (url?: string) => {
    if (!url) return ''
    return url.startsWith('http') ? url : `https://${url}`
  }

  const cleanDisplayUrl = (url?: string) => {
    if (!url) return ''
    return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
  }

  return (
    <article
      className="resume-sheet w-full bg-white text-gray-900 font-sans leading-relaxed text-[11pt] sm:text-[11.5pt] select-text"
      aria-label="Modern Professional Resume"
    >
      {/* 1. Header with Restrained Brand Blue Accent Border */}
      <header className="pb-4 mb-5 border-b-2 border-[#1E3A8A]/30">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              {personalInfo.fullName || 'Your Name'}
            </h1>
            {personalInfo.title && (
              <p className="text-sm sm:text-base font-semibold text-[#1E3A8A] mt-0.5 tracking-wide">
                {personalInfo.title}
              </p>
            )}
          </div>

          <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500 border border-gray-200 px-2 py-0.5 rounded self-start sm:self-auto">
            ATS FORMATTED
          </span>
        </div>

        <div className="text-xs text-gray-600 mt-3 pt-2 border-t border-gray-100 flex flex-wrap gap-x-3 gap-y-1">
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.phone && (
            <>
              {personalInfo.location && <span className="text-gray-300 select-none">•</span>}
              <span>{personalInfo.phone}</span>
            </>
          )}
          {personalInfo.email && (
            <>
              <span className="text-gray-300 select-none">•</span>
              <a
                href={`mailto:${personalInfo.email}`}
                className="hover:text-gray-900 hover:underline transition-colors"
              >
                {personalInfo.email}
              </a>
            </>
          )}
          {personalInfo.linkedinUrl && (
            <>
              <span className="text-gray-300 select-none">•</span>
              <a
                href={formatUrl(personalInfo.linkedinUrl)}
                target="_blank"
                rel="noreferrer"
                className="hover:text-gray-900 hover:underline transition-colors"
              >
                {cleanDisplayUrl(personalInfo.linkedinUrl)}
              </a>
            </>
          )}
          {personalInfo.githubUrl && (
            <>
              <span className="text-gray-300 select-none">•</span>
              <a
                href={formatUrl(personalInfo.githubUrl)}
                target="_blank"
                rel="noreferrer"
                className="hover:text-gray-900 hover:underline transition-colors"
              >
                {cleanDisplayUrl(personalInfo.githubUrl)}
              </a>
            </>
          )}
          {personalInfo.portfolioUrl && (
            <>
              <span className="text-gray-300 select-none">•</span>
              <a
                href={formatUrl(personalInfo.portfolioUrl)}
                target="_blank"
                rel="noreferrer"
                className="hover:text-gray-900 hover:underline transition-colors"
              >
                {cleanDisplayUrl(personalInfo.portfolioUrl)}
              </a>
            </>
          )}
        </div>
      </header>

      {/* 2. Professional Summary (Optional) */}
      {showSummary && (
        <section className="mb-5 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] flex items-center gap-2 mb-2">
            <span>Professional Summary</span>
            <span className="flex-1 h-[1px] bg-gray-200" />
          </h2>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed text-justify">
            {personalInfo.summary}
          </p>
        </section>
      )}

      {/* 3. Technical Core Competencies */}
      {showSkills && (
        <section className="mb-5 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] flex items-center gap-2 mb-2.5">
            <span>Core Competencies & Stack</span>
            <span className="flex-1 h-[1px] bg-gray-200" />
          </h2>
          <div className="space-y-1.5 text-xs sm:text-sm">
            {skills.languages.length > 0 && (
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span className="font-bold text-gray-900 w-32 shrink-0">Languages:</span>
                <span className="text-gray-700">{skills.languages.join(' • ')}</span>
              </div>
            )}
            {skills.frameworks.length > 0 && (
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span className="font-bold text-gray-900 w-32 shrink-0">Frameworks:</span>
                <span className="text-gray-700">{skills.frameworks.join(' • ')}</span>
              </div>
            )}
            {skills.tools.length > 0 && (
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span className="font-bold text-gray-900 w-32 shrink-0">Tools & Platforms:</span>
                <span className="text-gray-700">{skills.tools.join(' • ')}</span>
              </div>
            )}
            {skills.softSkills.length > 0 && (
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span className="font-bold text-gray-900 w-32 shrink-0">Soft Skills:</span>
                <span className="text-gray-700">{skills.softSkills.join(' • ')}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. Experience */}
      {showExperience && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] flex items-center gap-2 mb-2.5 break-after-avoid">
            <span>Professional Experience</span>
            <span className="flex-1 h-[1px] bg-gray-200" />
          </h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="text-xs sm:text-sm break-inside-avoid">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div>
                    <span className="font-bold text-gray-950 text-sm">{exp.role}</span>
                    <span className="text-gray-700"> • {exp.organization}</span>
                  </div>
                  <span className="text-xs font-mono text-gray-500 shrink-0">
                    {exp.startDate} – {exp.endDate || 'Present'}
                  </span>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-1 text-gray-700 mt-1.5 leading-relaxed">
                    {exp.bullets.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Projects */}
      {showProjects && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] flex items-center gap-2 mb-2.5 break-after-avoid">
            <span>Featured Projects</span>
            <span className="flex-1 h-[1px] bg-gray-200" />
          </h2>
          <div className="space-y-3.5">
            {projects.map((proj) => (
              <div key={proj.id} className="text-xs sm:text-sm break-inside-avoid">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div className="font-bold text-gray-950">
                    <span>{proj.name}</span>
                    {proj.technologies.length > 0 && (
                      <span className="font-normal text-gray-600 text-xs">
                        {' '}
                        [{proj.technologies.join(', ')}]
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono flex items-center gap-2">
                    {proj.githubUrl && (
                      <a
                        href={formatUrl(proj.githubUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#1E3A8A] hover:underline"
                      >
                        GitHub ↗
                      </a>
                    )}
                    {proj.projectUrl && (
                      <a
                        href={formatUrl(proj.projectUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#1E3A8A] hover:underline"
                      >
                        Live Demo ↗
                      </a>
                    )}
                  </div>
                </div>
                <p className="text-gray-700 mt-1 leading-relaxed">{proj.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Education */}
      {showEducation && (
        <section className="mb-5 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] flex items-center gap-2 mb-2.5">
            <span>Education</span>
            <span className="flex-1 h-[1px] bg-gray-200" />
          </h2>
          <div className="space-y-2.5">
            {education.map((edu) => (
              <div
                key={edu.id}
                className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-baseline justify-between gap-1"
              >
                <div>
                  <div className="font-bold text-gray-950">{edu.institution}</div>
                  <div className="text-gray-700">
                    {edu.degree}
                    {edu.fieldOfStudy ? ` • ${edu.fieldOfStudy}` : ''}
                    {edu.grade ? ` (GPA: ${edu.grade})` : ''}
                  </div>
                </div>
                <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded shrink-0 self-start sm:self-auto">
                  {edu.startDate} – {edu.endDate || 'Present'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Certifications */}
      {showCertifications && (
        <section className="mb-5 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] flex items-center gap-2 mb-2">
            <span>Certifications & Honors</span>
            <span className="flex-1 h-[1px] bg-gray-200" />
          </h2>
          <ul className="list-disc list-outside pl-4 space-y-1 text-xs sm:text-sm text-gray-700">
            {certifications.map((cert) => (
              <li key={cert.id}>
                <span className="font-semibold text-gray-950">{cert.name}</span>
                <span className="text-gray-600"> — {cert.issuer}</span>
                {cert.issueDate && (
                  <span className="text-gray-500 font-mono text-xs"> ({cert.issueDate})</span>
                )}
                {cert.credentialUrl && (
                  <a
                    href={formatUrl(cert.credentialUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 font-mono text-xs text-[#1E3A8A] hover:underline"
                  >
                    [View]
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 8. Additional Information */}
      {showAdditional && (
        <section className="mb-4 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] flex items-center gap-2 mb-2">
            <span>Honors & Languages</span>
            <span className="flex-1 h-[1px] bg-gray-200" />
          </h2>
          <div className="space-y-1 text-xs sm:text-sm text-gray-700">
            {additional.achievements.length > 0 && (
              <p>
                <strong className="text-gray-900 font-semibold">Honors: </strong>
                {additional.achievements.join(' • ')}
              </p>
            )}
            {additional.coursework.length > 0 && (
              <p>
                <strong className="text-gray-900 font-semibold">Coursework: </strong>
                {additional.coursework.join(', ')}
              </p>
            )}
            {additional.languages.length > 0 && (
              <p>
                <strong className="text-gray-900 font-semibold">Languages: </strong>
                {additional.languages.join(', ')}
              </p>
            )}
          </div>
        </section>
      )}
    </article>
  )
}

export default ModernProfessionalTemplate
