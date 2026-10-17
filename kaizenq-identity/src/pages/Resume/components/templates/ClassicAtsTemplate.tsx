import React from 'react'
import type { ResumeData } from '../../types.ts'

export interface TemplateProps {
  data: ResumeData
}

export const ClassicAtsTemplate: React.FC<TemplateProps> = ({ data }) => {
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
      className="resume-sheet w-full bg-white text-gray-900 font-serif leading-relaxed text-[11pt] sm:text-[12pt] select-text"
      aria-label="Classic ATS Resume"
    >
      {/* 1. Header: Name, Title & Contact Info */}
      <header className="text-center pb-4 mb-4 border-b-2 border-gray-800">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-950 uppercase font-sans">
          {personalInfo.fullName || 'Your Name'}
        </h1>

        {personalInfo.title && (
          <p className="text-sm sm:text-base font-semibold text-gray-800 mt-1 font-sans">
            {personalInfo.title}
          </p>
        )}

        <div className="text-xs sm:text-sm text-gray-700 mt-2 font-sans flex flex-wrap justify-center items-center gap-x-2.5 gap-y-1">
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.phone && (
            <>
              {personalInfo.location && <span className="text-gray-400 select-none">•</span>}
              <span>{personalInfo.phone}</span>
            </>
          )}
          {personalInfo.email && (
            <>
              <span className="text-gray-400 select-none">•</span>
              <a href={`mailto:${personalInfo.email}`} className="text-gray-900 hover:underline">
                {personalInfo.email}
              </a>
            </>
          )}
          {personalInfo.linkedinUrl && (
            <>
              <span className="text-gray-400 select-none">•</span>
              <a
                href={formatUrl(personalInfo.linkedinUrl)}
                target="_blank"
                rel="noreferrer"
                className="text-gray-900 hover:underline"
              >
                {cleanDisplayUrl(personalInfo.linkedinUrl)}
              </a>
            </>
          )}
          {personalInfo.githubUrl && (
            <>
              <span className="text-gray-400 select-none">•</span>
              <a
                href={formatUrl(personalInfo.githubUrl)}
                target="_blank"
                rel="noreferrer"
                className="text-gray-900 hover:underline"
              >
                {cleanDisplayUrl(personalInfo.githubUrl)}
              </a>
            </>
          )}
          {personalInfo.portfolioUrl && (
            <>
              <span className="text-gray-400 select-none">•</span>
              <a
                href={formatUrl(personalInfo.portfolioUrl)}
                target="_blank"
                rel="noreferrer"
                className="text-gray-900 hover:underline"
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
          <h2 className="text-xs uppercase font-bold tracking-wider text-gray-950 border-b border-gray-400 pb-0.5 mb-2 font-sans">
            Professional Summary
          </h2>
          <p className="text-xs sm:text-sm text-gray-800 leading-normal text-justify">
            {personalInfo.summary}
          </p>
        </section>
      )}

      {/* 3. Education */}
      {showEducation && (
        <section className="mb-5 break-inside-avoid">
          <h2 className="text-xs uppercase font-bold tracking-wider text-gray-950 border-b border-gray-400 pb-0.5 mb-2 font-sans">
            Education
          </h2>
          <div className="space-y-3">
            {education.map((edu) => (
              <div key={edu.id} className="text-xs sm:text-sm">
                <div className="flex justify-between items-baseline font-sans">
                  <span className="font-bold text-gray-950">{edu.institution}</span>
                  <span className="text-gray-600 font-mono text-xs">
                    {edu.startDate} – {edu.endDate || 'Present'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-gray-800 italic">
                  <span>
                    {edu.degree}
                    {edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                  </span>
                  {edu.grade && (
                    <span className="text-gray-700 not-italic font-mono text-xs">
                      GPA / Score: {edu.grade}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Technical Skills */}
      {showSkills && (
        <section className="mb-5 break-inside-avoid">
          <h2 className="text-xs uppercase font-bold tracking-wider text-gray-950 border-b border-gray-400 pb-0.5 mb-2 font-sans">
            Technical Skills
          </h2>
          <div className="space-y-1.5 text-xs sm:text-sm font-sans">
            {skills.languages.length > 0 && (
              <p>
                <strong className="font-semibold text-gray-950">Languages: </strong>
                <span className="text-gray-800">{skills.languages.join(', ')}</span>
              </p>
            )}
            {skills.frameworks.length > 0 && (
              <p>
                <strong className="font-semibold text-gray-950">Frameworks & Libraries: </strong>
                <span className="text-gray-800">{skills.frameworks.join(', ')}</span>
              </p>
            )}
            {skills.tools.length > 0 && (
              <p>
                <strong className="font-semibold text-gray-950">Tools & Infrastructure: </strong>
                <span className="text-gray-800">{skills.tools.join(', ')}</span>
              </p>
            )}
            {skills.softSkills.length > 0 && (
              <p>
                <strong className="font-semibold text-gray-950">Core Competencies: </strong>
                <span className="text-gray-800">{skills.softSkills.join(', ')}</span>
              </p>
            )}
          </div>
        </section>
      )}

      {/* 5. Experience */}
      {showExperience && (
        <section className="mb-5">
          <h2 className="text-xs uppercase font-bold tracking-wider text-gray-950 border-b border-gray-400 pb-0.5 mb-2 font-sans break-after-avoid">
            Professional Experience
          </h2>
          <div className="space-y-3.5">
            {experience.map((exp) => (
              <div key={exp.id} className="text-xs sm:text-sm break-inside-avoid">
                <div className="flex justify-between items-baseline font-sans">
                  <span className="font-bold text-gray-950">{exp.role}</span>
                  <span className="text-gray-600 font-mono text-xs">
                    {exp.startDate} – {exp.endDate || 'Present'}
                  </span>
                </div>
                <p className="text-gray-800 italic mb-1.5 font-sans">{exp.organization}</p>
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

      {/* 6. Projects */}
      {showProjects && (
        <section className="mb-5">
          <h2 className="text-xs uppercase font-bold tracking-wider text-gray-950 border-b border-gray-400 pb-0.5 mb-2 font-sans break-after-avoid">
            Key Projects
          </h2>
          <div className="space-y-3.5">
            {projects.map((proj) => (
              <div key={proj.id} className="text-xs sm:text-sm break-inside-avoid">
                <div className="flex justify-between items-baseline font-sans">
                  <div className="font-bold text-gray-950">
                    <span>{proj.name}</span>
                    {proj.technologies.length > 0 && (
                      <span className="font-normal text-gray-700">
                        {' '}
                        | {proj.technologies.join(', ')}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 font-mono flex gap-2">
                    {proj.githubUrl && (
                      <a
                        href={formatUrl(proj.githubUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-800 hover:underline"
                      >
                        GitHub ↗
                      </a>
                    )}
                    {proj.projectUrl && (
                      <a
                        href={formatUrl(proj.projectUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-800 hover:underline"
                      >
                        Demo ↗
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

      {/* 7. Certifications */}
      {showCertifications && (
        <section className="mb-5 break-inside-avoid">
          <h2 className="text-xs uppercase font-bold tracking-wider text-gray-950 border-b border-gray-400 pb-0.5 mb-2 font-sans">
            Certifications
          </h2>
          <ul className="list-disc list-outside pl-4 space-y-1 text-xs sm:text-sm text-gray-800 font-sans">
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
                    className="ml-2 font-mono text-xs text-gray-700 hover:underline"
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
          <h2 className="text-xs uppercase font-bold tracking-wider text-gray-950 border-b border-gray-400 pb-0.5 mb-2 font-sans">
            Additional Information
          </h2>
          <div className="space-y-1.5 text-xs sm:text-sm font-sans">
            {additional.achievements.length > 0 && (
              <p>
                <strong className="font-semibold text-gray-950">Honors & Awards: </strong>
                <span className="text-gray-800">{additional.achievements.join(' • ')}</span>
              </p>
            )}
            {additional.coursework.length > 0 && (
              <p>
                <strong className="font-semibold text-gray-950">Relevant Coursework: </strong>
                <span className="text-gray-800">{additional.coursework.join(', ')}</span>
              </p>
            )}
            {additional.languages.length > 0 && (
              <p>
                <strong className="font-semibold text-gray-950">Languages: </strong>
                <span className="text-gray-800">{additional.languages.join(', ')}</span>
              </p>
            )}
          </div>
        </section>
      )}
    </article>
  )
}

export default ClassicAtsTemplate
