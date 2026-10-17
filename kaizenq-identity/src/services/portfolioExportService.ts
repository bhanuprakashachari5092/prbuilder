/**
 * Portfolio Source-Code ZIP Export Service
 * KaizenQ Identity — PR Builder
 *
 * Generates a production-ready, fully responsive standalone website project (HTML/CSS/JS + README)
 * bundled into a safe ZIP file using JSZip.
 * Runs completely client-side with zero secrets, zero backend dependencies, and zero tracking.
 */

import JSZip from 'jszip'
import type { PortfolioData, PortfolioThemeId } from '../pages/Portfolio/types.ts'
import { escapeHtml, sanitizeUrl, sanitizeFilename, downloadBlob } from '../lib/downloadUtils.ts'

/**
 * Checks whether the portfolio has sufficient content to generate a meaningful website.
 */
export function hasSufficientPortfolioContent(data: PortfolioData): boolean {
  if (!data || !data.profile) return false
  const hasName = Boolean(data.profile.fullName?.trim())
  if (!hasName) return false

  const hasTitle = Boolean(data.profile.title?.trim())
  const hasAbout = Boolean(data.profile.aboutMe?.trim())
  const hasBio = Boolean(data.profile.shortBio?.trim())
  const hasProjects = Array.isArray(data.projects) && data.projects.length > 0
  const hasSkills =
    data.skills &&
    (data.skills.languages?.length > 0 ||
      data.skills.frameworks?.length > 0 ||
      data.skills.tools?.length > 0 ||
      data.skills.otherSkills?.length > 0)
  const hasExperience = Array.isArray(data.experience) && data.experience.length > 0
  const hasEducation = Array.isArray(data.education) && data.education.length > 0
  const hasCertifications = Array.isArray(data.certifications) && data.certifications.length > 0
  const hasAchievements = Array.isArray(data.achievements) && data.achievements.length > 0

  return (
    hasTitle ||
    hasAbout ||
    hasBio ||
    hasProjects ||
    Boolean(hasSkills) ||
    hasExperience ||
    hasEducation ||
    hasCertifications ||
    hasAchievements
  )
}

/**
 * Generates a clean, user-friendly filename for the portfolio ZIP export.
 */
export function getPortfolioZipFilename(data: PortfolioData): string {
  const base = data.profile?.slug || data.profile?.fullName || 'my-portfolio'
  return `${sanitizeFilename(base, 'my-portfolio')}-portfolio.zip`
}

/**
 * Generates the complete HTML markup for the exported standalone website.
 */
export function generateExportHtml(data: PortfolioData): string {
  const { profile, skills, education, projects, experience, achievements, certifications, contact, sectionVisibility, theme } =
    data

  const activeTheme: PortfolioThemeId = theme === 'midnight' ? 'modern' : theme || 'modern'
  const fullName = profile.fullName || 'Developer Portfolio'
  const title = profile.title || 'Software Engineer'
  const currentYear = new Date().getFullYear()

  // Validate and sanitize URLs
  const safePhotoUrl = sanitizeUrl(profile.photoUrl)
  const safeGithubUrl = sanitizeUrl(profile.githubUrl)
  const safeLinkedinUrl = sanitizeUrl(profile.linkedinUrl)
  const safeTwitterUrl = sanitizeUrl(profile.twitterUrl)
  const safeResumeUrl = sanitizeUrl(profile.resumeUrl)
  const safeEmail = profile.email || contact.email

  const navLinks: { id: string; label: string }[] = []
  if (sectionVisibility.about && profile.aboutMe?.trim()) navLinks.push({ id: 'about', label: 'About' })
  if (
    sectionVisibility.skills &&
    (skills.languages.length || skills.frameworks.length || skills.tools.length || skills.otherSkills.length)
  )
    navLinks.push({ id: 'skills', label: 'Skills' })
  if (sectionVisibility.projects && projects.length) navLinks.push({ id: 'projects', label: 'Projects' })
  if (sectionVisibility.experience && experience.length) navLinks.push({ id: 'experience', label: 'Experience' })
  if (sectionVisibility.education && education.length) navLinks.push({ id: 'education', label: 'Education' })
  if (sectionVisibility.certifications && certifications.length) navLinks.push({ id: 'certifications', label: 'Certifications' })
  if (sectionVisibility.achievements && achievements.length) navLinks.push({ id: 'achievements', label: 'Achievements' })
  if (sectionVisibility.contact) navLinks.push({ id: 'contact', label: 'Contact' })

  // Skills aggregation
  const allSkillsCategories = [
    { title: 'Languages', items: skills.languages || [] },
    { title: 'Frameworks & Libraries', items: skills.frameworks || [] },
    { title: 'Tools & Platforms', items: skills.tools || [] },
    { title: 'Other Competencies', items: skills.otherSkills || [] },
  ].filter((c) => c.items.length > 0)

  return `<!DOCTYPE html>
<html lang="en" data-theme="${escapeHtml(activeTheme)}" class="theme-${escapeHtml(activeTheme)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(profile.shortBio || `${fullName} - ${title} Portfolio`)}">
  <meta name="author" content="${escapeHtml(fullName)}">
  <meta property="og:title" content="${escapeHtml(fullName)} — ${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(profile.shortBio || `Professional portfolio of ${fullName}`)}">
  <meta property="og:type" content="website">
  <title>${escapeHtml(fullName)} | ${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <!-- Header / Navigation -->
  <header class="site-header" id="top">
    <div class="container header-container">
      <a href="#top" class="brand-logo" aria-label="Home">
        <span class="terminal-prompt">$</span>
        <span class="brand-text">${escapeHtml(fullName)}</span>
      </a>

      <!-- Desktop Nav -->
      <nav class="nav-menu" id="navMenu">
        ${navLinks.map((link) => `<a href="#${escapeHtml(link.id)}" class="nav-link">${escapeHtml(link.label)}</a>`).join('\n        ')}
      </nav>

      <!-- Theme Switcher & Mobile Menu Trigger -->
      <div class="header-actions">
        <div class="theme-select-wrapper">
          <label for="themeSelect" class="sr-only">Switch Theme</label>
          <select id="themeSelect" class="theme-select" aria-label="Select Color Theme">
            <option value="modern"${activeTheme === 'modern' ? ' selected' : ''}>Modern</option>
            <option value="developer"${activeTheme === 'developer' ? ' selected' : ''}>Developer</option>
            <option value="minimal"${activeTheme === 'minimal' ? ' selected' : ''}>Minimal</option>
            <option value="creative"${activeTheme === 'creative' ? ' selected' : ''}>Creative</option>
          </select>
        </div>

        <button class="mobile-toggle" id="mobileMenuBtn" aria-label="Toggle navigation menu" aria-expanded="false">
          <span class="hamburger-bar"></span>
          <span class="hamburger-bar"></span>
          <span class="hamburger-bar"></span>
        </button>
      </div>
    </div>
  </header>

  <main class="site-main">
    <!-- Hero Section -->
    <section class="section hero-section">
      <div class="container hero-container">
        <div class="hero-content">
          ${
            safePhotoUrl
              ? `
          <div class="avatar-wrapper">
            <img src="${escapeHtml(safePhotoUrl)}" alt="${escapeHtml(fullName)}" class="avatar-img" onerror="this.style.display='none'; document.getElementById('avatar-fallback').style.display='flex';">
            <div id="avatar-fallback" class="avatar-placeholder" style="display:none;" aria-hidden="true">
              <span>${escapeHtml(fullName.slice(0, 2).toUpperCase())}</span>
            </div>
          </div>`
              : `
          <div class="avatar-wrapper">
            <div class="avatar-placeholder" aria-hidden="true">
              <span>${escapeHtml(fullName.slice(0, 2).toUpperCase())}</span>
            </div>
          </div>`
          }

          <div class="hero-badge">
            <span class="status-indicator"></span>
            <span>Available for opportunities</span>
          </div>

          <h1 class="hero-name">${escapeHtml(fullName)}</h1>
          <p class="hero-title">${escapeHtml(title)}</p>

          ${
            profile.location
              ? `
          <p class="hero-location">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>${escapeHtml(profile.location)}</span>
          </p>`
              : ''
          }

          ${profile.shortBio ? `<p class="hero-bio">${escapeHtml(profile.shortBio)}</p>` : ''}

          <!-- Social Links -->
          <div class="social-links">
            ${
              safeGithubUrl
                ? `
            <a href="${escapeHtml(safeGithubUrl)}" target="_blank" rel="noopener noreferrer" class="social-button" aria-label="GitHub Profile">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              <span>GitHub</span>
            </a>`
                : ''
            }
            ${
              safeLinkedinUrl
                ? `
            <a href="${escapeHtml(safeLinkedinUrl)}" target="_blank" rel="noopener noreferrer" class="social-button" aria-label="LinkedIn Profile">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              <span>LinkedIn</span>
            </a>`
                : ''
            }
            ${
              safeTwitterUrl
                ? `
            <a href="${escapeHtml(safeTwitterUrl)}" target="_blank" rel="noopener noreferrer" class="social-button" aria-label="X / Twitter Profile">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              <span>X / Twitter</span>
            </a>`
                : ''
            }
            ${
              safeEmail
                ? `
            <a href="mailto:${escapeHtml(safeEmail)}" class="social-button" aria-label="Send Email">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              <span>Email</span>
            </a>`
                : ''
            }
            ${
              safeResumeUrl
                ? `
            <a href="${escapeHtml(safeResumeUrl)}" target="_blank" rel="noopener noreferrer" class="social-button" aria-label="Download Resume">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span>Resume</span>
            </a>`
                : ''
            }
          </div>

          <!-- Hero CTAs -->
          <div class="hero-actions">
            ${
              sectionVisibility.projects && projects.length
                ? `<a href="#projects" class="btn btn-primary">View Projects</a>`
                : ''
            }
            ${
              sectionVisibility.contact
                ? `<a href="#contact" class="btn btn-secondary">Get in Touch</a>`
                : ''
            }
          </div>
        </div>
      </div>
    </section>

    ${
      sectionVisibility.about && profile.aboutMe?.trim()
        ? `
    <!-- About Section -->
    <section class="section" id="about">
      <div class="container">
        <h2 class="section-title">
          <span class="title-prefix">//</span> About Me
        </h2>
        <div class="card about-card">
          <div class="about-text">
            ${escapeHtml(profile.aboutMe)
              .split('\n\n')
              .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
              .join('\n            ')}
          </div>
        </div>
      </div>
    </section>`
        : ''
    }

    ${
      sectionVisibility.skills && allSkillsCategories.length
        ? `
    <!-- Skills Section -->
    <section class="section" id="skills">
      <div class="container">
        <h2 class="section-title">
          <span class="title-prefix">//</span> Technical Skills
        </h2>
        <div class="skills-grid">
          ${allSkillsCategories
            .map(
              (category) => `
          <div class="card skill-category-card">
            <h3 class="skill-category-title">${escapeHtml(category.title)}</h3>
            <div class="skill-tags">
              ${category.items.map((skill) => `<span class="badge skill-badge">${escapeHtml(skill)}</span>`).join('\n              ')}
            </div>
          </div>`,
            )
            .join('\n          ')}
        </div>
      </div>
    </section>`
        : ''
    }

    ${
      sectionVisibility.projects && projects.length
        ? `
    <!-- Projects Section -->
    <section class="section" id="projects">
      <div class="container">
        <h2 class="section-title">
          <span class="title-prefix">//</span> Featured Projects
        </h2>
        <div class="projects-grid">
          ${projects
            .map((proj) => {
              const projLive = sanitizeUrl(proj.liveUrl)
              const projGh = sanitizeUrl(proj.githubUrl)
              const projImg = sanitizeUrl(proj.imageUrl)

              return `
          <article class="card project-card">
            ${
              projImg
                ? `
            <div class="project-img-wrapper">
              <img src="${escapeHtml(projImg)}" alt="${escapeHtml(proj.title)}" class="project-img" loading="lazy" onerror="this.parentElement.style.display='none';">
            </div>`
                : `
            <div class="project-img-placeholder" aria-hidden="true">
              <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><polyline points="11 3 11 11 14 8 17 11 17 3"/></svg>
            </div>`
            }
            <div class="project-content">
              <h3 class="project-title">${escapeHtml(proj.title || 'Untitled Project')}</h3>
              <p class="project-description">${escapeHtml(proj.description || 'Project details and implementation.')}</p>
              ${
                proj.technologies && proj.technologies.length
                  ? `
              <div class="project-tags">
                ${proj.technologies.map((t) => `<span class="badge project-tag">${escapeHtml(t)}</span>`).join('')}
              </div>`
                  : ''
              }
              <div class="project-links">
                ${
                  projLive
                    ? `
                <a href="${escapeHtml(projLive)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary">
                  <span>Live Demo</span>
                  <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>`
                    : ''
                }
                ${
                  projGh
                    ? `
                <a href="${escapeHtml(projGh)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-secondary">
                  <span>Source</span>
                  <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                </a>`
                    : ''
                }
              </div>
            </div>
          </article>`
            })
            .join('\n          ')}
        </div>
      </div>
    </section>`
        : ''
    }

    ${
      sectionVisibility.experience && experience.length
        ? `
    <!-- Experience Section -->
    <section class="section" id="experience">
      <div class="container">
        <h2 class="section-title">
          <span class="title-prefix">//</span> Experience
        </h2>
        <div class="timeline">
          ${experience
            .map(
              (exp) => `
          <div class="card timeline-item">
            <div class="timeline-header">
              <div>
                <h3 class="timeline-role">${escapeHtml(exp.role || 'Role')}</h3>
                <h4 class="timeline-org">${escapeHtml(exp.organization || 'Organization')}</h4>
              </div>
              <span class="timeline-date">${escapeHtml(exp.startDate || '')} — ${escapeHtml(exp.endDate || 'Present')}</span>
            </div>
            ${exp.description ? `<p class="timeline-desc">${escapeHtml(exp.description)}</p>` : ''}
          </div>`,
            )
            .join('\n          ')}
        </div>
      </div>
    </section>`
        : ''
    }

    ${
      sectionVisibility.education && education.length
        ? `
    <!-- Education Section -->
    <section class="section" id="education">
      <div class="container">
        <h2 class="section-title">
          <span class="title-prefix">//</span> Education
        </h2>
        <div class="timeline">
          ${education
            .map(
              (edu) => `
          <div class="card timeline-item">
            <div class="timeline-header">
              <div>
                <h3 class="timeline-role">${escapeHtml(edu.degree || 'Degree')} ${edu.specialization ? `in ${escapeHtml(edu.specialization)}` : ''}</h3>
                <h4 class="timeline-org">${escapeHtml(edu.institution || 'Institution')}</h4>
              </div>
              <span class="timeline-date">${escapeHtml(edu.startDate || '')} — ${escapeHtml(edu.endDate || 'Present')}</span>
            </div>
            ${edu.grade ? `<p class="timeline-grade"><strong>Grade / CGPA:</strong> ${escapeHtml(edu.grade)}</p>` : ''}
          </div>`,
            )
            .join('\n          ')}
        </div>
      </div>
    </section>`
        : ''
    }

    ${
      sectionVisibility.certifications && certifications.length
        ? `
    <!-- Certifications Section -->
    <section class="section" id="certifications">
      <div class="container">
        <h2 class="section-title">
          <span class="title-prefix">//</span> Certifications & Credentials
        </h2>
        <div class="cards-grid">
          ${certifications
            .map((cert) => {
              const safeCred = sanitizeUrl(cert.credentialUrl)
              return `
          <div class="card cert-card">
            <h3 class="cert-name">${escapeHtml(cert.name || 'Certification')}</h3>
            <p class="cert-issuer">${escapeHtml(cert.issuer || 'Issuing Authority')}</p>
            ${cert.issueDate ? `<p class="cert-date">Issued: ${escapeHtml(cert.issueDate)}</p>` : ''}
            ${
              safeCred
                ? `
            <a href="${escapeHtml(safeCred)}" target="_blank" rel="noopener noreferrer" class="cert-link">
              <span>Verify Credential</span>
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>`
                : ''
            }
          </div>`
            })
            .join('\n          ')}
        </div>
      </div>
    </section>`
        : ''
    }

    ${
      sectionVisibility.achievements && achievements.length
        ? `
    <!-- Achievements Section -->
    <section class="section" id="achievements">
      <div class="container">
        <h2 class="section-title">
          <span class="title-prefix">//</span> Honors & Achievements
        </h2>
        <div class="cards-grid">
          ${achievements
            .map(
              (ach) => `
          <div class="card achievement-card">
            <h3 class="achievement-title">${escapeHtml(ach.title || 'Achievement')}</h3>
            <p class="achievement-desc">${escapeHtml(ach.description || '')}</p>
          </div>`,
            )
            .join('\n          ')}
        </div>
      </div>
    </section>`
        : ''
    }

    ${
      sectionVisibility.contact
        ? `
    <!-- Contact Section -->
    <section class="section contact-section" id="contact">
      <div class="container">
        <div class="card contact-card">
          <h2 class="section-title contact-title">
            <span class="title-prefix">//</span> Get In Touch
          </h2>
          <p class="contact-desc">
            ${escapeHtml(contact.contactCtaMessage || "I'm always open to discussing engineering opportunities, collaborative projects, or innovative ideas.")}
          </p>

          ${
            safeEmail
              ? `
          <div class="contact-action-wrapper">
            <a href="mailto:${escapeHtml(safeEmail)}" class="btn btn-primary contact-main-btn">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              <span>Say Hello (${escapeHtml(safeEmail)})</span>
            </a>
            <button class="btn btn-secondary copy-btn" id="copyEmailBtn" data-email="${escapeHtml(safeEmail)}" aria-label="Copy email address to clipboard">
              <span id="copyBtnText">Copy Email</span>
            </button>
          </div>`
              : ''
          }

          ${
            contact.socialLinks && contact.socialLinks.length
              ? `
          <div class="contact-social-grid">
            ${contact.socialLinks
              .map((sl) => {
                const sUrl = sanitizeUrl(sl.url)
                if (!sUrl) return ''
                return `<a href="${escapeHtml(sUrl)}" target="_blank" rel="noopener noreferrer" class="contact-social-link">${escapeHtml(sl.platform)}</a>`
              })
              .join('\n            ')}
          </div>`
              : ''
          }
        </div>
      </div>
    </section>`
        : ''
    }
  </main>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="container footer-container">
      <p class="footer-copyright">
        &copy; ${currentYear} ${escapeHtml(fullName)}. All rights reserved.
      </p>
      <div class="footer-meta">
        <span>Exported with PR Builder</span>
        <a href="#top" class="back-to-top" aria-label="Back to top">
          <span>Back to Top &uarr;</span>
        </a>
      </div>
    </div>
  </footer>

  <script src="js/main.js"></script>
</body>
</html>`
}

/**
 * Generates the complete CSS stylesheet supporting all 4 themes (modern, developer, minimal, creative).
 */
export function generateExportCss(): string {
  return `/* ==========================================================================
   PR Builder Portfolio — Standalone Production Stylesheet
   Supports Themes: Modern, Developer, Minimal, Creative
   ========================================================================== */

:root {
  /* Common Transition */
  --transition-fast: 0.18s ease;
  --transition-normal: 0.28s ease;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --container-max: 1120px;
}

/* --------------------------------------------------------------------------
   THEME 1: MODERN (Light & Clean, PR Builder Signature)
   -------------------------------------------------------------------------- */
:root,
[data-theme="modern"] {
  --font-base: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-heading: 'Inter', sans-serif;

  --bg-page: #F7F9FC;
  --bg-card: #FFFFFF;
  --bg-card-subtle: #F8FAFC;
  --bg-nav: rgba(255, 255, 255, 0.92);

  --text-main: #111827;
  --text-muted: #64748B;
  --text-subtle: #94A3B8;

  --border-color: #E2E8F0;
  --border-focus: #2563EB;

  --accent-primary: #2563EB;
  --accent-hover: #1D4ED8;
  --accent-active: #1E40AF;
  --accent-text: #FFFFFF;

  --badge-bg: #EFF6FF;
  --badge-text: #2563EB;
  --badge-border: #BFDBFE;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08);

  --terminal-prefix-display: none;
}

/* --------------------------------------------------------------------------
   THEME 2: DEVELOPER (Terminal & Monospace Dark)
   -------------------------------------------------------------------------- */
[data-theme="developer"] {
  --font-base: 'JetBrains Mono', monospace;
  --font-mono: 'JetBrains Mono', monospace;
  --font-heading: 'JetBrains Mono', monospace;

  --bg-page: #0B1015;
  --bg-card: #121820;
  --bg-card-subtle: #0F161E;
  --bg-nav: rgba(11, 16, 21, 0.92);

  --text-main: #F1F5F9;
  --text-muted: #94A3B8;
  --text-subtle: #64748B;

  --border-color: rgba(52, 211, 153, 0.2);
  --border-focus: #34D399;

  --accent-primary: #10B981;
  --accent-hover: #34D399;
  --accent-active: #059669;
  --accent-text: #0B1015;

  --badge-bg: #0D2421;
  --badge-text: #34D399;
  --badge-border: rgba(52, 211, 153, 0.35);

  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 8px rgba(5, 150, 105, 0.12);
  --shadow-lg: 0 10px 20px rgba(5, 150, 105, 0.18);

  --terminal-prefix-display: inline-block;
}

/* --------------------------------------------------------------------------
   THEME 3: MINIMAL (Refined Swiss Editorial)
   -------------------------------------------------------------------------- */
[data-theme="minimal"] {
  --font-base: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-heading: 'Inter', sans-serif;

  --bg-page: #FAFAFA;
  --bg-card: #FFFFFF;
  --bg-card-subtle: #F4F4F5;
  --bg-nav: rgba(250, 250, 250, 0.94);

  --text-main: #18181B;
  --text-muted: #71717A;
  --text-subtle: #A1A1AA;

  --border-color: #E4E4E7;
  --border-focus: #18181B;

  --accent-primary: #18181B;
  --accent-hover: #27272A;
  --accent-active: #09090B;
  --accent-text: #FFFFFF;

  --badge-bg: #F4F4F5;
  --badge-text: #18181B;
  --badge-border: #E4E4E7;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 6px 12px rgba(0, 0, 0, 0.08);

  --terminal-prefix-display: none;
}

/* --------------------------------------------------------------------------
   THEME 4: CREATIVE (Vibrant Dark Gradient & Glassmorphism)
   -------------------------------------------------------------------------- */
[data-theme="creative"] {
  --font-base: 'Outfit', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-heading: 'Outfit', sans-serif;

  --bg-page: #0D0B18;
  --bg-card: rgba(23, 19, 47, 0.85);
  --bg-card-subtle: #1F1940;
  --bg-nav: rgba(13, 11, 24, 0.92);

  --text-main: #FFFFFF;
  --text-muted: #B4A9D6;
  --text-subtle: #7D6FA3;

  --border-color: rgba(167, 139, 250, 0.25);
  --border-focus: #C084FC;

  --accent-primary: #9333EA;
  --accent-hover: #A855F7;
  --accent-active: #7E22CE;
  --accent-text: #FFFFFF;

  --badge-bg: rgba(76, 29, 149, 0.4);
  --badge-text: #D8B4FE;
  --badge-border: rgba(167, 139, 250, 0.35);

  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 8px 16px rgba(147, 51, 234, 0.16);
  --shadow-lg: 0 14px 28px rgba(147, 51, 234, 0.24);

  --terminal-prefix-display: none;
}

/* --------------------------------------------------------------------------
   RESET & CORE BASE
   -------------------------------------------------------------------------- */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
  font-size: 16px;
}

body {
  font-family: var(--font-base);
  background-color: var(--bg-page);
  color: var(--text-main);
  line-height: 1.6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: background-color var(--transition-normal), color var(--transition-normal);
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
  text-decoration: none;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

button, select, input, textarea {
  font: inherit;
  color: inherit;
}

.container {
  width: 100%;
  max-width: var(--container-max);
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* --------------------------------------------------------------------------
   HEADER & NAVIGATION
   -------------------------------------------------------------------------- */
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: var(--bg-nav);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  transition: border-color var(--transition-fast);
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4rem;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}

.terminal-prompt {
  display: var(--terminal-prefix-display);
  color: var(--accent-primary);
  font-weight: 800;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
  transition: color var(--transition-fast);
}

.nav-link:hover {
  color: var(--text-main);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.theme-select-wrapper {
  position: relative;
}

.theme-select {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.35rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  transition: border-color var(--transition-fast);
}

.theme-select:focus {
  border-color: var(--border-focus);
}

.mobile-toggle {
  display: none;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  flex-direction: column;
  gap: 4px;
}

.hamburger-bar {
  width: 20px;
  height: 2px;
  background-color: var(--text-main);
  border-radius: 2px;
  transition: transform var(--transition-fast);
}

/* --------------------------------------------------------------------------
   SECTIONS & GENERAL LAYOUT
   -------------------------------------------------------------------------- */
.section {
  padding-top: 4.5rem;
  padding-bottom: 4.5rem;
}

.section-title {
  font-family: var(--font-heading);
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 2rem;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-prefix {
  color: var(--accent-primary);
  font-family: var(--font-mono);
  font-weight: 600;
}

.card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.card:hover {
  border-color: var(--border-focus);
}

/* --------------------------------------------------------------------------
   HERO SECTION
   -------------------------------------------------------------------------- */
.hero-section {
  padding-top: 5rem;
  padding-bottom: 4rem;
}

.hero-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.avatar-wrapper {
  margin-bottom: 1.5rem;
}

.avatar-img {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--border-color);
  box-shadow: var(--shadow-md);
}

.avatar-placeholder {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background-color: var(--badge-bg);
  border: 3px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.75rem;
  color: var(--accent-primary);
  font-family: var(--font-mono);
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background-color: var(--badge-bg);
  border: 1px solid var(--badge-border);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--badge-text);
  margin-bottom: 1rem;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #10B981;
}

.hero-name {
  font-family: var(--font-heading);
  font-size: clamp(2.25rem, 5vw, 3.75rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 0.5rem;
}

.hero-title {
  font-size: clamp(1.125rem, 2.5vw, 1.5rem);
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
}

.hero-location {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  color: var(--text-subtle);
  margin-bottom: 1.25rem;
}

.hero-bio {
  font-size: 1.125rem;
  color: var(--text-muted);
  max-width: 680px;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-bottom: 2rem;
}

.social-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.social-button:hover {
  border-color: var(--border-focus);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
}

/* --------------------------------------------------------------------------
   BUTTONS & BADGES
   -------------------------------------------------------------------------- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1.35rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
}

.btn-primary {
  background-color: var(--accent-primary);
  color: var(--accent-text);
}

.btn-primary:hover {
  background-color: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background-color: var(--bg-card);
  color: var(--text-main);
  border-color: var(--border-color);
}

.btn-secondary:hover {
  border-color: var(--border-focus);
  background-color: var(--bg-card-subtle);
}

.btn-sm {
  padding: 0.4rem 0.85rem;
  font-size: 0.75rem;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  font-family: var(--font-mono);
  background-color: var(--badge-bg);
  color: var(--badge-text);
  border: 1px solid var(--badge-border);
}

.icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.icon-sm {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

/* --------------------------------------------------------------------------
   ABOUT SECTION
   -------------------------------------------------------------------------- */
.about-card {
  max-width: 860px;
}

.about-text p {
  margin-bottom: 1rem;
  color: var(--text-muted);
  line-height: 1.7;
}

.about-text p:last-child {
  margin-bottom: 0;
}

/* --------------------------------------------------------------------------
   SKILLS SECTION
   -------------------------------------------------------------------------- */
.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.skill-category-title {
  font-size: 0.9375rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* --------------------------------------------------------------------------
   PROJECTS SECTION
   -------------------------------------------------------------------------- */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.75rem;
}

.project-card {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.project-img-wrapper {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background-color: var(--bg-card-subtle);
}

.project-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal);
}

.project-card:hover .project-img {
  transform: scale(1.03);
}

.project-img-placeholder {
  width: 100%;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-card-subtle);
  border-bottom: 1px solid var(--border-color);
}

.placeholder-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--text-subtle);
}

.project-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.project-title {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.project-description {
  font-size: 0.875rem;
  color: var(--text-muted);
  line-height: 1.55;
  margin-bottom: 1.25rem;
  flex: 1;
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
}

.project-links {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.5rem;
}

/* --------------------------------------------------------------------------
   TIMELINE (EXPERIENCE & EDUCATION)
   -------------------------------------------------------------------------- */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.timeline-item {
  position: relative;
}

.timeline-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.timeline-role {
  font-size: 1.05rem;
  font-weight: 700;
}

.timeline-org {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--accent-primary);
}

.timeline-date {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--text-subtle);
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  background-color: var(--bg-card-subtle);
  border: 1px solid var(--border-color);
}

.timeline-desc {
  font-size: 0.875rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.timeline-grade {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
}

/* --------------------------------------------------------------------------
   CERTIFICATIONS & ACHIEVEMENTS
   -------------------------------------------------------------------------- */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
}

.cert-card, .achievement-card {
  display: flex;
  flex-direction: column;
}

.cert-name, .achievement-title {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.35rem;
}

.cert-issuer, .achievement-desc {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.cert-date {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--text-subtle);
  margin-bottom: 0.75rem;
}

.cert-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent-primary);
  margin-top: auto;
}

.cert-link:hover {
  text-decoration: underline;
}

/* --------------------------------------------------------------------------
   CONTACT SECTION
   -------------------------------------------------------------------------- */
.contact-card {
  text-align: center;
  padding: 3rem 2rem;
  max-width: 780px;
  margin-left: auto;
  margin-right: auto;
}

.contact-title {
  justify-content: center;
}

.contact-desc {
  font-size: 1.05rem;
  color: var(--text-muted);
  max-width: 580px;
  margin: 0 auto 2rem auto;
  line-height: 1.6;
}

.contact-action-wrapper {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.contact-social-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.contact-social-link {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-muted);
  transition: color var(--transition-fast);
}

.contact-social-link:hover {
  color: var(--accent-primary);
}

/* --------------------------------------------------------------------------
   FOOTER
   -------------------------------------------------------------------------- */
.site-footer {
  margin-top: auto;
  border-top: 1px solid var(--border-color);
  padding: 2.5rem 0;
  background-color: var(--bg-card-subtle);
}

.footer-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.footer-meta {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.back-to-top {
  font-weight: 600;
  color: var(--accent-primary);
  transition: opacity var(--transition-fast);
}

.back-to-top:hover {
  opacity: 0.8;
}

/* --------------------------------------------------------------------------
   RESPONSIVE MEDIA QUERIES
   -------------------------------------------------------------------------- */
@media (max-width: 768px) {
  .mobile-toggle {
    display: flex;
  }

  .nav-menu {
    display: none;
    position: absolute;
    top: 4rem;
    left: 0;
    right: 0;
    background-color: var(--bg-card);
    border-bottom: 1px solid var(--border-color);
    flex-direction: column;
    padding: 1.5rem;
    gap: 1.25rem;
    box-shadow: var(--shadow-lg);
  }

  .nav-menu.open {
    display: flex;
  }

  .section {
    padding-top: 3.5rem;
    padding-bottom: 3.5rem;
  }

  .card {
    padding: 1.25rem;
  }

  .footer-container {
    flex-direction: column;
    text-align: center;
  }
}

/* --------------------------------------------------------------------------
   PRINT STYLES
   -------------------------------------------------------------------------- */
@media print {
  .site-header, .header-actions, .mobile-toggle, .hero-actions, .project-links, .back-to-top {
    display: none !important;
  }

  body {
    background: #FFFFFF !important;
    color: #111827 !important;
  }

  .card {
    border: 1px solid #E2E8F0 !important;
    box-shadow: none !important;
    break-inside: avoid;
  }
}
`
}

/**
 * Generates the clean client-side JavaScript for the exported standalone website.
 */
export function generateExportJs(): string {
  return `/**
 * Standalone Portfolio Interactions
 * Handles theme switching with persistence, mobile drawer, smooth navigation, and email copying.
 */

(function () {
  'use strict';

  // 1. Theme Switcher with LocalStorage Persistence
  var themeSelect = document.getElementById('themeSelect');
  var savedTheme = localStorage.getItem('pr_builder_theme');

  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.className = 'theme-' + savedTheme;
    if (themeSelect) {
      themeSelect.value = savedTheme;
    }
  }

  if (themeSelect) {
    themeSelect.addEventListener('change', function (e) {
      var newTheme = e.target.value;
      document.documentElement.setAttribute('data-theme', newTheme);
      document.documentElement.className = 'theme-' + newTheme;
      localStorage.setItem('pr_builder_theme', newTheme);
    });
  }

  // 2. Mobile Navigation Toggle
  var mobileMenuBtn = document.getElementById('mobileMenuBtn');
  var navMenu = document.getElementById('navMenu');

  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', function () {
      var isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
      mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
      navMenu.classList.toggle('open');
    });

    // Close menu when clicking nav links
    var links = navMenu.querySelectorAll('.nav-link');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function () {
        navMenu.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    }
  }

  // 3. Copy Email to Clipboard Helper
  var copyEmailBtn = document.getElementById('copyEmailBtn');
  var copyBtnText = document.getElementById('copyBtnText');

  if (copyEmailBtn && copyBtnText) {
    copyEmailBtn.addEventListener('click', function () {
      var email = copyEmailBtn.getAttribute('data-email');
      if (!email) return;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(function () {
          var original = copyBtnText.textContent;
          copyBtnText.textContent = 'Copied!';
          copyEmailBtn.style.borderColor = '#10B981';
          setTimeout(function () {
            copyBtnText.textContent = original;
            copyEmailBtn.style.borderColor = '';
          }, 2000);
        }).catch(function () {
          fallbackPrompt(email);
        });
      } else {
        fallbackPrompt(email);
      }
    });
  }

  function fallbackPrompt(email) {
    window.prompt('Copy email address:', email);
  }
})();
`
}

/**
 * Generates the README.md explaining how to preview, customize, and deploy the portfolio.
 */
export function generateExportReadme(data: PortfolioData): string {
  const { profile } = data
  const name = profile.fullName || 'Developer'
  const title = profile.title || 'Software Engineer'

  return `# ${name} — Personal Portfolio Website

This repository contains the production-ready source code for **${name}** (${title}), exported from **PR Builder**.

---

## 🚀 Quick Start (Local Preview)

No build tools or package managers are required! This is a clean, standalone website written in semantic HTML5, modern CSS, and vanilla JavaScript.

### Method 1: Instant Browser Launch
1. Unzip this package.
2. Double-click \`index.html\` to open it directly in Google Chrome, Microsoft Edge, Firefox, or Safari.

### Method 2: Local Static Server (Recommended)
If you have Node.js or Python installed, run a local development server for realistic asset routing:

**With Node.js / npx:**
\`\`\`bash
npx serve .
\`\`\`

**With Python 3:**
\`\`\`bash
python -m http.server 8000
\`\`\`
Then visit \`http://localhost:8000\` in your browser.

---

## 📁 Project Architecture

\`\`\`
.
├── index.html        # Complete semantic HTML5 markup with all sections & meta tags
├── css/
│   └── style.css     # Production stylesheet with Modern, Developer, Minimal, Creative themes
├── js/
│   └── main.js       # Standalone theme switcher, mobile drawer, and interaction handlers
└── README.md         # Deployment & customization documentation
\`\`\`

---

## 🎨 Theme System

The site includes 4 handcrafted, responsive color palettes:
- **Modern**: Clean light interface tailored for recruiters (Signature PR Builder theme).
- **Developer**: Dark terminal aesthetic with monospace typography and emerald accents.
- **Minimal**: Refined Swiss editorial design focusing on whitespace and high readability.
- **Creative**: Vibrant cosmic dark palette with glassmorphism cards and vivid gradients.

The default theme is set on the \`<html>\` tag in \`index.html\`:
\`\`\`html
<html lang="en" data-theme="modern" class="theme-modern">
\`\`\`
Viewers can also switch themes dynamically in real-time using the theme selector in the top navigation bar!

---

## 🌐 Free Production Deployment

You can host this website online for free in under two minutes:

### Option A: GitHub Pages (Free)
1. Create a new GitHub repository named \`username.github.io\` (or any name).
2. Push these files into the repository:
   \`\`\`bash
   git init
   git add .
   git commit -m "Initial portfolio release"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   \`\`\`
3. Go to **Settings > Pages** on your GitHub repo.
4. Under **Branch**, select \`main\` and \`/ (root)\`, then click **Save**.
5. Your portfolio will be live at \`https://YOUR_USERNAME.github.io\`!

### Option B: Netlify Drop (Instant Drag-and-Drop)
1. Go to [Netlify Drop](https://app.netlify.com/drop).
2. Drag and drop this unzipped folder into the browser window.
3. Your portfolio is deployed instantly with a free SSL certificate!

### Option C: Vercel
1. Install Vercel CLI: \`npm i -g vercel\`
2. Run \`vercel\` in this folder and follow the prompts.
3. Or import your GitHub repository at [vercel.com](https://vercel.com).

### Option D: Cloudflare Pages
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com) > **Workers & Pages**.
2. Select **Upload assets** and drag this folder.
3. Enjoy ultra-fast global Edge CDN deployment.

---

## 🔒 Security & Privacy

This export is 100% self-contained. It contains **no** private API keys, database credentials, authentication tokens, or external tracking scripts.

---

*Generated by PR Builder — Developer Identity & ATS Resume Studio*
`
}

/**
 * Creates the ZIP archive containing the standalone portfolio website.
 */
export async function generatePortfolioZip(
  data: PortfolioData,
  onProgress?: (percent: number, statusText: string) => void,
): Promise<{ blob: Blob; filename: string }> {
  if (!hasSufficientPortfolioContent(data)) {
    throw new Error('Your portfolio needs at least your name and one section (skills, projects, bio, or experience) before exporting.')
  }

  onProgress?.(15, 'Generating semantic HTML...')
  const htmlContent = generateExportHtml(data)

  onProgress?.(40, 'Compiling theme stylesheets...')
  const cssContent = generateExportCss()

  onProgress?.(65, 'Packaging scripts & interaction handlers...')
  const jsContent = generateExportJs()

  onProgress?.(80, 'Creating project documentation...')
  const readmeContent = generateExportReadme(data)

  onProgress?.(90, 'Bundling files into ZIP archive...')
  const zip = new JSZip()
  zip.file('index.html', htmlContent)
  zip.file('css/style.css', cssContent)
  zip.file('js/main.js', jsContent)
  zip.file('README.md', readmeContent)

  const blob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    },
    (metadata) => {
      const p = 90 + Math.round(metadata.percent / 10)
      onProgress?.(p, `Compressing files (${Math.round(metadata.percent)}%)...`)
    },
  )

  const filename = getPortfolioZipFilename(data)
  return { blob, filename }
}

/**
 * Full execution helper: creates the portfolio ZIP and triggers a safe browser download.
 */
export async function downloadPortfolioZip(
  data: PortfolioData,
  onProgress?: (percent: number, statusText: string) => void,
): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    const { blob, filename } = await generatePortfolioZip(data, onProgress)
    onProgress?.(100, 'Download complete!')
    downloadBlob(blob, filename)
    return { success: true, filename }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate portfolio ZIP archive.'
    return { success: false, error: message }
  }
}
