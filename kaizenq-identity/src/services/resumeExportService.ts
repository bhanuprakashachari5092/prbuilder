/**
 * Resume PDF Export Service
 * KaizenQ Identity — PR Builder
 *
 * Provides production-ready PDF export functionality for ATS resumes.
 * Uses browser print engine with A4 layout specification and vector typography preservation,
 * producing selectable, search-friendly ATS documents across multiple pages.
 */

import type { ResumeData } from '../pages/Resume/types.ts'
import { sanitizeFilename, escapeHtml, sanitizeUrl } from '../lib/downloadUtils.ts'

/**
 * Checks whether the resume data contains sufficient content to generate a meaningful PDF.
 */
export function hasSufficientResumeContent(data: ResumeData): boolean {
  if (!data || !data.personalInfo) return false
  const hasName = Boolean(data.personalInfo.fullName?.trim())
  if (!hasName) return false

  const hasTitle = Boolean(data.personalInfo.title?.trim())
  const hasSummary = Boolean(data.personalInfo.summary?.trim())
  const hasEducation = Array.isArray(data.education) && data.education.length > 0
  const hasExperience = Array.isArray(data.experience) && data.experience.length > 0
  const hasProjects = Array.isArray(data.projects) && data.projects.length > 0
  const hasSkills =
    data.skills &&
    (data.skills.languages?.length > 0 ||
      data.skills.frameworks?.length > 0 ||
      data.skills.tools?.length > 0 ||
      data.skills.softSkills?.length > 0)
  const hasCertifications = Array.isArray(data.certifications) && data.certifications.length > 0

  return (
    hasTitle ||
    hasSummary ||
    hasEducation ||
    hasExperience ||
    hasProjects ||
    Boolean(hasSkills) ||
    hasCertifications
  )
}

/**
 * Computes a standardized, meaningful filename for the exported PDF.
 */
export function getResumePdfFilename(data: ResumeData): string {
  const base = data.personalInfo?.fullName || data.title || 'my-resume'
  return `${sanitizeFilename(base, 'my-resume')}-resume.pdf`
}

/**
 * Generates standalone HTML for a resume matching the selected template.
 * Used for background iframe printing from the Dashboard or external views.
 */
export function generateResumePrintHtml(data: ResumeData): string {
  const { personalInfo, education, skills, projects, experience, certifications, additional, visibleSections, template } =
    data

  const fullName = personalInfo.fullName || 'Professional Resume'
  const title = personalInfo.title || ''
  const location = personalInfo.location || ''
  const phone = personalInfo.phone || ''
  const email = personalInfo.email || ''
  const linkedin = sanitizeUrl(personalInfo.linkedinUrl)
  const github = sanitizeUrl(personalInfo.githubUrl)
  const portfolio = sanitizeUrl(personalInfo.portfolioUrl)

  const showSummary = visibleSections?.summary !== false && Boolean(personalInfo.summary?.trim())
  const showEducation = visibleSections?.education !== false && education.length > 0
  const showSkills =
    visibleSections?.skills !== false &&
    (skills.languages?.length > 0 ||
      skills.frameworks?.length > 0 ||
      skills.tools?.length > 0 ||
      skills.softSkills?.length > 0)
  const showExperience = visibleSections?.experience !== false && experience.length > 0
  const showProjects = visibleSections?.projects !== false && projects.length > 0
  const showCertifications = visibleSections?.certifications !== false && certifications.length > 0
  const showAdditional =
    visibleSections?.additional !== false &&
    (additional?.achievements?.length > 0 ||
      additional?.coursework?.length > 0 ||
      additional?.languages?.length > 0)

  // Determine styling based on template
  const isTechnical = template === 'technical'
  const isMinimal = template === 'minimal'
  const isModern = template === 'modern' || template === 'modern-professional'
  // default / classic is classic-ats

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(getResumePdfFilename(data).replace(/\.pdf$/, ''))}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Merriweather:wght@300;400;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background: #FFFFFF !important;
      color: #111827 !important;
      font-family: ${isTechnical ? "'JetBrains Mono', monospace" : isMinimal ? "'Inter', sans-serif" : isModern ? "'Inter', sans-serif" : "'Merriweather', Georgia, serif"};
      font-size: 10pt;
      line-height: 1.45;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      padding: 0;
      margin: 0;
    }
    .resume-sheet {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      background: #FFFFFF;
    }
    .header {
      ${isModern ? 'border-b: 2px solid #2563EB; padding-bottom: 12px; margin-bottom: 14px;' : isTechnical ? 'border-bottom: 2px dashed #059669; padding-bottom: 12px; margin-bottom: 14px;' : isMinimal ? 'border-bottom: 1px solid #E4E4E7; padding-bottom: 12px; margin-bottom: 14px;' : 'text-align: center; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 14px;'}
    }
    .name {
      font-size: 20pt;
      font-weight: 700;
      color: ${isModern ? '#1E3A8A' : isTechnical ? '#065F46' : '#111827'};
      font-family: 'Inter', sans-serif;
      text-transform: ${isMinimal ? 'none' : 'uppercase'};
      letter-spacing: -0.01em;
      line-height: 1.1;
    }
    .title {
      font-size: 11pt;
      font-weight: 600;
      color: ${isModern ? '#2563EB' : '#4B5563'};
      margin-top: 3px;
      font-family: 'Inter', sans-serif;
    }
    .contact-line {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 10px;
      margin-top: 6px;
      font-size: 9pt;
      color: #4B5563;
      font-family: 'Inter', sans-serif;
      ${!isModern && !isTechnical && !isMinimal ? 'justify-content: center;' : ''}
    }
    .contact-line a {
      color: #111827;
      text-decoration: none;
    }
    .contact-line a:hover {
      text-decoration: underline;
    }
    .section {
      margin-bottom: 14px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 11pt;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: ${isModern ? '#1E3A8A' : isTechnical ? '#065F46' : '#111827'};
      border-bottom: ${isModern ? '1px solid #BFDBFE' : isTechnical ? '1px dashed #A7F3D0' : '1px solid #D1D5DB'};
      padding-bottom: 3px;
      margin-bottom: 8px;
      break-after: avoid;
      page-break-after: avoid;
    }
    .entry {
      margin-bottom: 8px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .entry:last-child {
      margin-bottom: 0;
    }
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
    }
    .entry-title {
      font-weight: 700;
      font-size: 10pt;
      color: #111827;
      font-family: 'Inter', sans-serif;
    }
    .entry-subtitle {
      font-size: 9.5pt;
      color: #374151;
      font-weight: 600;
    }
    .entry-date {
      font-size: 8.5pt;
      color: #6B7280;
      font-family: 'Inter', sans-serif;
      white-space: nowrap;
    }
    .entry-desc {
      font-size: 9.5pt;
      color: #374151;
      margin-top: 3px;
      line-height: 1.4;
    }
    .bullets {
      margin-top: 4px;
      padding-left: 16px;
      font-size: 9.5pt;
      color: #374151;
    }
    .bullets li {
      margin-bottom: 2px;
      line-height: 1.4;
    }
    .skills-row {
      margin-bottom: 4px;
      font-size: 9.5pt;
      line-height: 1.45;
    }
    .skills-category {
      font-weight: 700;
      color: #111827;
      font-family: 'Inter', sans-serif;
    }
    a {
      color: inherit;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <article class="resume-sheet">
    <!-- Header -->
    <header class="header">
      <h1 class="name">${escapeHtml(fullName)}</h1>
      ${title ? `<p class="title">${escapeHtml(title)}</p>` : ''}
      <div class="contact-line">
        ${location ? `<span>${escapeHtml(location)}</span>` : ''}
        ${phone ? `<span>• ${escapeHtml(phone)}</span>` : ''}
        ${email ? `<span>• <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></span>` : ''}
        ${linkedin ? `<span>• <a href="${escapeHtml(linkedin)}">LinkedIn</a></span>` : ''}
        ${github ? `<span>• <a href="${escapeHtml(github)}">GitHub</a></span>` : ''}
        ${portfolio ? `<span>• <a href="${escapeHtml(portfolio)}">Portfolio</a></span>` : ''}
      </div>
    </header>

    ${
      showSummary
        ? `
    <!-- Professional Summary -->
    <section class="section">
      <h2 class="section-title">Professional Summary</h2>
      <p class="entry-desc">${escapeHtml(personalInfo.summary)}</p>
    </section>`
        : ''
    }

    ${
      showExperience
        ? `
    <!-- Experience -->
    <section class="section">
      <h2 class="section-title">Work Experience</h2>
      ${experience
        .map(
          (exp) => `
      <div class="entry">
        <div class="entry-header">
          <div>
            <span class="entry-title">${escapeHtml(exp.role || 'Role')}</span>
            ${exp.organization ? `<span class="entry-subtitle"> — ${escapeHtml(exp.organization)}</span>` : ''}
          </div>
          <span class="entry-date">${escapeHtml(exp.startDate || '')} — ${escapeHtml(exp.endDate || 'Present')}</span>
        </div>
        ${
          exp.bullets && exp.bullets.length
            ? `
        <ul class="bullets">
          ${exp.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
        </ul>`
            : ''
        }
      </div>`,
        )
        .join('')}
    </section>`
        : ''
    }

    ${
      showEducation
        ? `
    <!-- Education -->
    <section class="section">
      <h2 class="section-title">Education</h2>
      ${education
        .map(
          (edu) => `
      <div class="entry">
        <div class="entry-header">
          <div>
            <span class="entry-title">${escapeHtml(edu.degree || 'Degree')}</span>
            ${edu.fieldOfStudy ? `<span class="entry-subtitle"> in ${escapeHtml(edu.fieldOfStudy)}</span>` : ''}
            <div class="entry-subtitle" style="font-weight:400;">${escapeHtml(edu.institution || '')}</div>
          </div>
          <div style="text-align:right;">
            <span class="entry-date">${escapeHtml(edu.startDate || '')} — ${escapeHtml(edu.endDate || 'Present')}</span>
            ${edu.grade ? `<div class="entry-date" style="color:#111827;font-weight:600;">Grade: ${escapeHtml(edu.grade)}</div>` : ''}
          </div>
        </div>
      </div>`,
        )
        .join('')}
    </section>`
        : ''
    }

    ${
      showProjects
        ? `
    <!-- Technical Projects -->
    <section class="section">
      <h2 class="section-title">Projects</h2>
      ${projects
        .map((proj) => {
          const pUrl = sanitizeUrl(proj.projectUrl)
          const gUrl = sanitizeUrl(proj.githubUrl)
          return `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">${escapeHtml(proj.name || 'Project')}</span>
          <div class="entry-date">
            ${pUrl ? `<a href="${escapeHtml(pUrl)}" style="color:#2563EB;margin-right:6px;">Live Link</a>` : ''}
            ${gUrl ? `<a href="${escapeHtml(gUrl)}" style="color:#4B5563;">Code</a>` : ''}
          </div>
        </div>
        <p class="entry-desc">${escapeHtml(proj.description || '')}</p>
        ${
          proj.technologies && proj.technologies.length
            ? `<p class="entry-desc" style="font-size:8.5pt;color:#6B7280;margin-top:2px;"><strong>Tech:</strong> ${escapeHtml(proj.technologies.join(', '))}</p>`
            : ''
        }
      </div>`
        })
        .join('')}
    </section>`
        : ''
    }

    ${
      showSkills
        ? `
    <!-- Technical Skills -->
    <section class="section">
      <h2 class="section-title">Technical Skills</h2>
      ${skills.languages && skills.languages.length ? `<div class="skills-row"><span class="skills-category">Languages:</span> ${escapeHtml(skills.languages.join(', '))}</div>` : ''}
      ${skills.frameworks && skills.frameworks.length ? `<div class="skills-row"><span class="skills-category">Frameworks & Libraries:</span> ${escapeHtml(skills.frameworks.join(', '))}</div>` : ''}
      ${skills.tools && skills.tools.length ? `<div class="skills-row"><span class="skills-category">Tools & Technologies:</span> ${escapeHtml(skills.tools.join(', '))}</div>` : ''}
      ${skills.softSkills && skills.softSkills.length ? `<div class="skills-row"><span class="skills-category">Professional Competencies:</span> ${escapeHtml(skills.softSkills.join(', '))}</div>` : ''}
    </section>`
        : ''
    }

    ${
      showCertifications
        ? `
    <!-- Certifications -->
    <section class="section">
      <h2 class="section-title">Certifications</h2>
      ${certifications
        .map((c) => {
          const cred = sanitizeUrl(c.credentialUrl)
          return `
      <div class="entry" style="margin-bottom:4px;">
        <div class="entry-header">
          <div>
            <span class="entry-title">${escapeHtml(c.name || 'Certification')}</span>
            <span class="entry-subtitle"> — ${escapeHtml(c.issuer || '')}</span>
          </div>
          <span class="entry-date">${escapeHtml(c.issueDate || '')}</span>
        </div>
        ${cred ? `<div style="font-size:8pt;"><a href="${escapeHtml(cred)}" style="color:#2563EB;">Verify Credential</a></div>` : ''}
      </div>`
        })
        .join('')}
    </section>`
        : ''
    }

    ${
      showAdditional
        ? `
    <!-- Additional Information -->
    <section class="section">
      <h2 class="section-title">Additional Information</h2>
      ${additional.achievements && additional.achievements.length ? `<div class="skills-row"><span class="skills-category">Achievements:</span> ${escapeHtml(additional.achievements.join(' • '))}</div>` : ''}
      ${additional.coursework && additional.coursework.length ? `<div class="skills-row"><span class="skills-category">Relevant Coursework:</span> ${escapeHtml(additional.coursework.join(', '))}</div>` : ''}
      ${additional.languages && additional.languages.length ? `<div class="skills-row"><span class="skills-category">Languages:</span> ${escapeHtml(additional.languages.join(', '))}</div>` : ''}
    </section>`
        : ''
    }
  </article>
</body>
</html>`
}

/**
 * Executes a clean browser print-to-PDF dispatch.
 * Sets the document title to the requested filename so Chrome/Edge/Firefox
 * default to the correct PDF filename in the "Save as PDF" dialog.
 */
export async function downloadResumePdf(
  data: ResumeData,
  _options?: { preferDirect?: boolean },
): Promise<{ success: boolean; filename: string; error?: string }> {
  if (!hasSufficientResumeContent(data)) {
    return {
      success: false,
      filename: 'resume.pdf',
      error: 'Your resume needs at least your name and an education, experience, or skills section before exporting.',
    }
  }

  const filename = getResumePdfFilename(data)
  const targetDocTitle = filename.replace(/\.pdf$/, '')

  // 1. If currently on the Resume page with #printable-resume mounted
  const printableEl = document.getElementById('printable-resume')
  if (printableEl) {
    const originalTitle = document.title
    try {
      document.title = targetDocTitle
      window.print()
      return { success: true, filename }
    } finally {
      // Restore title after print dialog closes
      setTimeout(() => {
        document.title = originalTitle
      }, 1000)
    }
  }

  // 2. If called from Dashboard or background view, use an isolated iframe print
  try {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.top = '-9999px'
    iframe.style.left = '-9999px'
    iframe.style.width = '210mm'
    iframe.style.height = '297mm'
    iframe.style.border = 'none'
    iframe.style.visibility = 'hidden'

    document.body.appendChild(iframe)

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) {
      document.body.removeChild(iframe)
      throw new Error('Unable to access background print context.')
    }

    const html = generateResumePrintHtml(data)
    doc.open()
    doc.write(html)
    doc.close()

    // Wait briefly for font & layout rendering
    await new Promise((resolve) => setTimeout(resolve, 350))

    if (iframe.contentWindow) {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
    }

    // Clean up iframe
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
    }, 2000)

    return { success: true, filename }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Print trigger failed.'
    return { success: false, filename, error: message }
  }
}
