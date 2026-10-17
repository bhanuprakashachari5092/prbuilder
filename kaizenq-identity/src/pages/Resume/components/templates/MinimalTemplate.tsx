import React from 'react'
import type { ResumeData } from '../../types.ts'

export interface MinimalTemplateProps {
  data: ResumeData
}

export const MinimalTemplate: React.FC<MinimalTemplateProps> = ({ data }) => {
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
      className="resume-sheet w-full bg-white text-gray-900 font-sans leading-relaxed text-[11pt] select-text"
      aria-label="Minimal ATS Resume"
    >
      {/* 1. Header: Elegant Minimalist Centered Layout */}
      <header className="text-center pb-5 mb-5 border-b border-gray-200">
        <h1 className="text-3xl font-light tracking-tight text-gray-950 uppercase font-sans">
          {personalInfo.fullName || 'Your Name'}
        </h1>

        {personalInfo.title && (
          <p className="text-xs uppercase tracking-widest text-gray-600 font-medium mt-1">
            {personalInfo.title}
          </p>
        )}

        <div className="text-xs text-gray-600 mt-3 flex flex-wrap justify-center items-center gap-x-3 gap-y-1">
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
                className="text-gray-800 hover:text-black hover:underline"
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
                className="text-gray-800 hover:text-black hover:underline"
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
                className="text-gray-800 hover:text-black hover:underline"
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
                className="text-gray-800 hover:text-black hover:underline"
              >
                {cleanDisplayUrl(personalInfo.portfolioUrl)}
              </a>
            </>
          )}
        </div>
      </header>

      {/* 2. Professional Summary */}
      {showSummary && (
        <section className="mb-5 break-inside-avoid">
          <h2 className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1.5">
            About
          </h2>
          <p className="text-xs sm:text-sm text-gray-800 leading-relaxed text-justify">
            {personalInfo.summary}
          </p>
        </section>
      )}

      {/* 3. Professional Experience */}
      {showExperience && (
        <section className="mb-5">
          <h2 className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-2.5 break-after-avoid">
            Experience
          </h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="text-xs sm:text-sm break-inside-avoid">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-gray-950">{exp.role}</span>
                  <span className="text-gray-500 font-mono text-[11px]">
                    {exp.startDate} – {exp.endDate || 'Present'}
                  </span>
                </div>
                <p className="text-gray-600 text-xs mb-1.5">{exp.organization}</p>
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

      {/* 4. Projects */}
      {showProjects && (
        <section className="mb-5">
          <h2 className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-2.5 break-after-avoid">
            Projects
          </h2>
          <div className="space-y-3.5">
            {projects.map((proj) => (
              <div key={proj.id} className="text-xs sm:text-sm break-inside-avoid">
                <div className="flex justify-between items-baseline">
                  <div className="font-semibold text-gray-950">
                    <span>{proj.name}</span>
                    {proj.technologies.length > 0 && (
                      <span className="font-normal text-gray-500 text-xs">
                        {' '}
                        • {proj.technologies.join(', ')}
                      </span>
                    )}
                  </div>
                  <div className="text-xs flex gap-2">
                    {proj.githubUrl && (
                      <a
                        href={formatUrl(proj.githubUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-600 hover:text-black hover:underline"
                      >
                        Source
                      </a>
                    )}
                    {proj.projectUrl && (
                      <a
                        href={formatUrl(proj.projectUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-600 hover:text-black hover:underline"
                      >
                        Live
                      </a>
                    )}
                  </div>
                </div>
                <p className="text-gray-700 mt-1 leading-relaxed text-xs sm:text-sm">
                  {proj.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Education */}
      {showEducation && (
        <section className="mb-5 break-inside-avoid">
          <h2 className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-2">
            Education
          </h2>
          <div className="space-y-2.5">
            {education.map((edu) => (
              <div key={edu.id} className="text-xs sm:text-sm">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-gray-950">{edu.institution}</span>
                  <span className="text-gray-500 font-mono text-[11px]">
                    {edu.startDate} – {edu.endDate || 'Present'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-gray-700">
                  <span>
                    {edu.degree}
                    {edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}
                  </span>
                  {edu.grade && (
                    <span className="text-gray-500 font-mono text-[11px]">GPA: {edu.grade}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Skills */}
      {showSkills && (
        <section className="mb-5 break-inside-avoid">
          <h2 className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-2">
            Skills
          </h2>
          <div className="space-y-1.5 text-xs sm:text-sm text-gray-800">
            {skills.languages.length > 0 && (
              <p>
                <span className="font-semibold text-gray-950">Languages: </span>
                {skills.languages.join(', ')}
              </p>
            )}
            {skills.frameworks.length > 0 && (
              <p>
                <span className="font-semibold text-gray-950">Frameworks: </span>
                {skills.frameworks.join(', ')}
              </p>
            )}
            {skills.tools.length > 0 && (
              <p>
                <span className="font-semibold text-gray-950">Tools & Platforms: </span>
                {skills.tools.join(', ')}
              </p>
            )}
            {skills.softSkills.length > 0 && (
              <p>
                <span className="font-semibold text-gray-950">Core Strengths: </span>
                {skills.softSkills.join(', ')}
              </p>
            )}
          </div>
        </section>
      )}

      {/* 7. Certifications */}
      {showCertifications && (
        <section className="mb-4 break-inside-avoid">
          <h2 className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1.5">
            Certifications
          </h2>
          <ul className="space-y-1 text-xs text-gray-800">
            {certifications.map((cert) => (
              <li key={cert.id} className="flex justify-between items-baseline">
                <span>
                  <strong className="font-semibold text-gray-950">{cert.name}</strong> — {cert.issuer}
                </span>
                {cert.issueDate && (
                  <span className="text-gray-500 font-mono text-[11px]">{cert.issueDate}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 8. Additional Info */}
      {showAdditional && (
        <section className="mb-3 break-inside-avoid">
          <h2 className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1.5">
            Additional
          </h2>
          <div className="space-y-1 text-xs text-gray-800">
            {additional.achievements.length > 0 && (
              <p>
                <span className="font-semibold text-gray-950">Honors: </span>
                {additional.achievements.join(' • ')}
              </p>
            )}
            {additional.coursework.length > 0 && (
              <p>
                <span className="font-semibold text-gray-950">Coursework: </span>
                {additional.coursework.join(', ')}
              </p>
            )}
            {additional.languages.length > 0 && (
              <p>
                <span className="font-semibold text-gray-950">Languages: </span>
                {additional.languages.join(', ')}
              </p>
            )}
          </div>
        </section>
      )}
    </article>
  )
}

export default MinimalTemplate
