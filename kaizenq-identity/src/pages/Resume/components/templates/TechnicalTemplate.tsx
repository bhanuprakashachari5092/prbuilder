import React from 'react'
import type { ResumeData } from '../../types.ts'

export interface TechnicalTemplateProps {
  data: ResumeData
}

export const TechnicalTemplate: React.FC<TechnicalTemplateProps> = ({ data }) => {
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
      className="resume-sheet w-full bg-white text-gray-900 font-sans leading-relaxed text-[10.5pt] sm:text-[11pt] select-text"
      aria-label="Technical ATS Resume"
    >
      {/* 1. Header: Technical Developer Lockup */}
      <header className="pb-3 mb-4 border-b-2 border-gray-900">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-950 font-mono">
              {personalInfo.fullName || 'Your Name'}
            </h1>
            {personalInfo.title && (
              <p className="text-sm font-semibold text-gray-800 mt-0.5 tracking-wide">
                {personalInfo.title}
              </p>
            )}
          </div>
          {personalInfo.location && (
            <span className="text-xs font-mono text-gray-600 self-start sm:self-auto">
              {personalInfo.location}
            </span>
          )}
        </div>

        {/* Contact Links */}
        <div className="text-xs text-gray-700 mt-2.5 pt-2 border-t border-gray-200 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
          {personalInfo.email && (
            <a
              href={`mailto:${personalInfo.email}`}
              className="text-gray-900 hover:underline hover:text-black"
            >
              {personalInfo.email}
            </a>
          )}
          {personalInfo.phone && (
            <>
              <span className="text-gray-300 select-none">•</span>
              <span>{personalInfo.phone}</span>
            </>
          )}
          {personalInfo.githubUrl && (
            <>
              <span className="text-gray-300 select-none">•</span>
              <a
                href={formatUrl(personalInfo.githubUrl)}
                target="_blank"
                rel="noreferrer"
                className="text-gray-900 hover:underline hover:text-black"
              >
                github/{cleanDisplayUrl(personalInfo.githubUrl).replace('github.com/', '')}
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
                className="text-gray-900 hover:underline hover:text-black"
              >
                linkedin/{cleanDisplayUrl(personalInfo.linkedinUrl).replace('linkedin.com/in/', '')}
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
                className="text-gray-900 hover:underline hover:text-black"
              >
                {cleanDisplayUrl(personalInfo.portfolioUrl)}
              </a>
            </>
          )}
        </div>
      </header>

      {/* 2. Technical Skills Matrix (Prominent for Technical Roles) */}
      {showSkills && (
        <section className="mb-4 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-950 font-mono border-b border-gray-300 pb-0.5 mb-2">
            Technical Competencies
          </h2>
          <div className="space-y-1.5 text-xs sm:text-sm">
            {skills.languages.length > 0 && (
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span className="font-bold text-gray-900 w-36 shrink-0 font-mono text-xs">
                  Languages:
                </span>
                <span className="text-gray-800">{skills.languages.join(' • ')}</span>
              </div>
            )}
            {skills.frameworks.length > 0 && (
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span className="font-bold text-gray-900 w-36 shrink-0 font-mono text-xs">
                  Frameworks & Libs:
                </span>
                <span className="text-gray-800">{skills.frameworks.join(' • ')}</span>
              </div>
            )}
            {skills.tools.length > 0 && (
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span className="font-bold text-gray-900 w-36 shrink-0 font-mono text-xs">
                  Tools & Systems:
                </span>
                <span className="text-gray-800">{skills.tools.join(' • ')}</span>
              </div>
            )}
            {skills.softSkills.length > 0 && (
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span className="font-bold text-gray-900 w-36 shrink-0 font-mono text-xs">
                  Core Practices:
                </span>
                <span className="text-gray-800">{skills.softSkills.join(' • ')}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. Professional Summary */}
      {showSummary && (
        <section className="mb-4 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-950 font-mono border-b border-gray-300 pb-0.5 mb-1.5">
            Engineering Summary
          </h2>
          <p className="text-xs sm:text-sm text-gray-800 leading-relaxed text-justify">
            {personalInfo.summary}
          </p>
        </section>
      )}

      {/* 4. Experience */}
      {showExperience && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-950 font-mono border-b border-gray-300 pb-0.5 mb-2.5 break-after-avoid">
            Experience & Engineering Impact
          </h2>
          <div className="space-y-3.5">
            {experience.map((exp) => (
              <div key={exp.id} className="text-xs sm:text-sm break-inside-avoid">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-gray-950">{exp.role}</span>
                  <span className="text-gray-600 font-mono text-xs">
                    {exp.startDate} – {exp.endDate || 'Present'}
                  </span>
                </div>
                <p className="text-gray-700 italic font-mono text-xs mb-1.5">{exp.organization}</p>
                {exp.bullets.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-1 text-gray-800 leading-relaxed">
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

      {/* 5. Key Projects */}
      {showProjects && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-950 font-mono border-b border-gray-300 pb-0.5 mb-2.5 break-after-avoid">
            Featured Technical Projects
          </h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id} className="text-xs sm:text-sm break-inside-avoid">
                <div className="flex justify-between items-baseline">
                  <div className="font-bold text-gray-950">
                    <span>{proj.name}</span>
                    {proj.technologies.length > 0 && (
                      <span className="font-mono text-xs font-normal text-gray-600">
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
                        className="text-gray-800 hover:underline hover:text-black font-semibold"
                      >
                        GitHub ↗
                      </a>
                    )}
                    {proj.projectUrl && (
                      <a
                        href={formatUrl(proj.projectUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-800 hover:underline hover:text-black font-semibold"
                      >
                        Live Demo ↗
                      </a>
                    )}
                  </div>
                </div>
                <p className="text-gray-800 mt-1 leading-relaxed">{proj.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Education */}
      {showEducation && (
        <section className="mb-4 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-950 font-mono border-b border-gray-300 pb-0.5 mb-2">
            Education
          </h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="text-xs sm:text-sm">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-gray-950">{edu.institution}</span>
                  <span className="text-gray-600 font-mono text-xs">
                    {edu.startDate} – {edu.endDate || 'Present'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-gray-800">
                  <span>
                    {edu.degree}
                    {edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                  </span>
                  {edu.grade && (
                    <span className="text-gray-600 font-mono text-xs">GPA / Score: {edu.grade}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Certifications */}
      {showCertifications && (
        <section className="mb-4 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-950 font-mono border-b border-gray-300 pb-0.5 mb-1.5">
            Certifications & Accreditations
          </h2>
          <ul className="list-disc list-outside pl-4 space-y-1 text-xs sm:text-sm text-gray-800">
            {certifications.map((cert) => (
              <li key={cert.id}>
                <span className="font-semibold text-gray-950">{cert.name}</span>
                <span className="text-gray-700"> — {cert.issuer}</span>
                {cert.issueDate && (
                  <span className="text-gray-500 font-mono text-xs"> ({cert.issueDate})</span>
                )}
                {cert.credentialUrl && (
                  <a
                    href={formatUrl(cert.credentialUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 font-mono text-[11px] text-gray-700 hover:underline"
                  >
                    [Verify]
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 8. Additional Information */}
      {showAdditional && (
        <section className="mb-3 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-950 font-mono border-b border-gray-300 pb-0.5 mb-1.5">
            Additional Details
          </h2>
          <div className="space-y-1 text-xs sm:text-sm">
            {additional.achievements.length > 0 && (
              <p>
                <strong className="font-semibold text-gray-950 font-mono text-xs">Achievements: </strong>
                <span className="text-gray-800">{additional.achievements.join(' • ')}</span>
              </p>
            )}
            {additional.coursework.length > 0 && (
              <p>
                <strong className="font-semibold text-gray-950 font-mono text-xs">Coursework: </strong>
                <span className="text-gray-800">{additional.coursework.join(', ')}</span>
              </p>
            )}
            {additional.languages.length > 0 && (
              <p>
                <strong className="font-semibold text-gray-950 font-mono text-xs">Languages: </strong>
                <span className="text-gray-800">{additional.languages.join(', ')}</span>
              </p>
            )}
          </div>
        </section>
      )}
    </article>
  )
}

export default TechnicalTemplate
