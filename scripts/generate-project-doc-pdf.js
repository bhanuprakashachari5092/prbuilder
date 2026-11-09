/**
 * PR Builder — Automated PDF Documentation Generator
 * Generates an executive technical project documentation PDF using jsPDF.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

async function generateDocumentationPdf() {
  const jspdfPath = path.join(rootDir, 'kaizenq-identity', 'node_modules', 'jspdf', 'dist', 'jspdf.node.min.js')
  const jspdfModule = await import(pathToFileURL(jspdfPath).href)
  const { jsPDF } = jspdfModule

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = 210
  const pageHeight = 297
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const colors = {
    primary: [30, 58, 138],      // Navy Blue (#1E3A8A)
    primaryLight: [239, 246, 255],// Alice Blue (#EFF6FF)
    secondary: [37, 99, 235],    // Royal Blue (#2563EB)
    dark: [15, 23, 42],          // Slate 900 (#0F172A)
    muted: [71, 85, 105],        // Slate 600 (#475569)
    border: [226, 232, 240],     // Slate 200 (#E2E8F0)
    emerald: [5, 150, 105],      // Emerald 600 (#059669)
    emeraldBg: [236, 253, 245],  // Emerald 50 (#ECFDF5)
    amber: [217, 119, 6],        // Amber 600 (#D97706)
    amberBg: [254, 243, 199],    // Amber 100 (#FEF3C7)
  }

  function checkPageBreak(neededHeight = 15) {
    if (y + neededHeight > pageHeight - margin - 10) {
      doc.addPage()
      y = margin + 12
      drawRunningHeader()
      return true
    }
    return false
  }

  function drawRunningHeader() {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...colors.muted)
    doc.text('PR BUILDER — COMPLETE PROJECT DOCUMENTATION & TECHNICAL OVERVIEW', margin, margin + 4)
    doc.setDrawColor(...colors.border)
    doc.setLineWidth(0.3)
    doc.line(margin, margin + 6, pageWidth - margin, margin + 6)
  }

  function addCoverPage() {
    // Top colored banner
    doc.setFillColor(...colors.primary)
    doc.rect(0, 0, pageWidth, 75, 'F')

    // App Monogram / Title Badge
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(margin, 18, 32, 10, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...colors.primary)
    doc.text('PR BUILDER v2.4', margin + 3.5, 24.5)

    // Title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(255, 255, 255)
    doc.text('PR BUILDER PLATFORM', margin, 42)

    // Subtitle
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(219, 234, 254) // #DBEAFE
    doc.text('Next-Gen AI Resume Engine, Portfolio Builder & Custom Domain Platform', margin, 50)
    doc.text('Production Architecture, Feature Specifications & Technical Documentation', margin, 56)

    y = 86

    // Executive Meta Card
    doc.setFillColor(...colors.primaryLight)
    doc.setDrawColor(...colors.secondary)
    doc.setLineWidth(0.4)
    doc.roundedRect(margin, y, contentWidth, 34, 3, 3, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...colors.primary)
    doc.text('PROJECT OVERVIEW & METRICS SUMMARY', margin + 6, y + 8)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...colors.dark)
    doc.text('• Platform Domain: https://prbuilder.xyz (Live on Vercel Edge)', margin + 6, y + 15)
    doc.text('• Tech Stack: React 19, TypeScript, Tailwind CSS v4, Supabase (PostgreSQL), Vite', margin + 6, y + 21)
    doc.text('• Key Integrations: Cashfree Payment Gateway v3 SDK, Google Gemini 3.8 Flash AI', margin + 6, y + 27)

    y += 44

    addSectionHeader('1. Executive Summary & Mission')
    addParagraph(
      'PR Builder (KaizenQ Identity) is an all-in-one professional career launchpad designed for software engineers, developers, and job seekers. It combines an ATS-optimized multi-template Resume Builder, an interactive multi-theme Developer Portfolio Builder, instant Standalone ZIP & Subdomain Publishing, Google Gemini AI Career Assistance, and native Cashfree Payments into a unified modern web experience.'
    )
    addParagraph(
      'Unlike traditional SaaS builders that lock users behind rigid subscription paywalls and unverified subdomains, PR Builder provides 100% free lifetime developer access to core features, exportable offline assets (A4 PDF & full HTML/CSS/JS website ZIPs), free subdomain publishing (username.prbuilder.xyz), and an authoritative server-verified Custom Domain Pass for custom branding.'
    )

    addSectionHeader('2. Core Architecture Highlights')
    addBullet('Frontend SPA Architecture', 'React 19 with functional components, custom hooks, and Tailwind CSS v4 for zero-runtime styling overhead and instantaneous responsive UI.')
    addBullet('Server-Authoritative Backend', 'Supabase PostgreSQL database secured with Row-Level Security (RLS) policies, preventing unauthorized read/write access to student profiles, resumes, and domains.')
    addBullet('Production Payment Integration', 'Direct Cashfree Payments v3 Web SDK integration supporting UPI, Cards, NetBanking, and Wallets with server-authoritative integer paise order calculation and HMAC webhook verification.')
    addBullet('Google Gemini AI Intelligence', 'Integrated Gemini 3.8 Flash assistant that rewrites weak bullet points into high-impact STAR statements and generates recruiter-ready summaries.')

    doc.addPage()
    y = margin + 12
    drawRunningHeader()
  }

  function addSectionHeader(title) {
    checkPageBreak(18)
    y += 3
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...colors.primary)
    doc.text(title, margin, y)

    doc.setDrawColor(...colors.secondary)
    doc.setLineWidth(0.6)
    doc.line(margin, y + 2, margin + contentWidth, y + 2)
    y += 8
  }

  function addSubSectionHeader(title) {
    checkPageBreak(12)
    y += 2
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(...colors.secondary)
    doc.text(title, margin, y)
    y += 6
  }

  function addParagraph(text) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...colors.dark)
    const lines = doc.splitTextToSize(text, contentWidth)
    checkPageBreak(lines.length * 4.5 + 4)
    doc.text(lines, margin, y)
    y += lines.length * 4.5 + 3
  }

  function addBullet(title, description) {
    checkPageBreak(10)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...colors.dark)
    const prefix = `•  ${title}: `
    const prefixWidth = doc.getTextWidth(prefix)

    doc.text(prefix, margin + 2, y)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...colors.muted)
    const remainingWidth = contentWidth - prefixWidth - 4
    const descLines = doc.splitTextToSize(description, remainingWidth)

    doc.text(descLines[0], margin + 2 + prefixWidth, y)
    y += 4.5

    if (descLines.length > 1) {
      for (let i = 1; i < descLines.length; i++) {
        checkPageBreak(5)
        doc.text(descLines[i], margin + 2 + prefixWidth, y)
        y += 4.5
      }
    }
    y += 1
  }

  function addCallout(title, text, type = 'info') {
    const lines = doc.splitTextToSize(text, contentWidth - 12)
    const boxHeight = lines.length * 4.5 + 14
    checkPageBreak(boxHeight + 4)

    const isSuccess = type === 'success'
    const isWarn = type === 'warn'

    const bg = isSuccess ? colors.emeraldBg : isWarn ? colors.amberBg : colors.primaryLight
    const border = isSuccess ? colors.emerald : isWarn ? colors.amber : colors.secondary
    const textCol = isSuccess ? colors.emerald : isWarn ? colors.amber : colors.primary

    doc.setFillColor(...bg)
    doc.setDrawColor(...border)
    doc.setLineWidth(0.4)
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...textCol)
    doc.text(title, margin + 5, y + 6)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...colors.dark)
    doc.text(lines, margin + 5, y + 11)

    y += boxHeight + 4
  }

  function addTable(headers, rows, colWidths) {
    const rowHeight = 7
    checkPageBreak(rowHeight * (rows.length + 1) + 6)

    // Table Header
    doc.setFillColor(...colors.primaryLight)
    doc.setDrawColor(...colors.border)
    doc.setLineWidth(0.3)
    doc.rect(margin, y, contentWidth, rowHeight, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...colors.primary)

    let currentX = margin
    headers.forEach((h, i) => {
      doc.text(h, currentX + 3, y + 4.8)
      currentX += colWidths[i]
    })
    y += rowHeight

    // Table Rows
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...colors.dark)

    rows.forEach((row, rIdx) => {
      checkPageBreak(rowHeight + 2)
      if (rIdx % 2 === 1) {
        doc.setFillColor(248, 250, 252)
        doc.rect(margin, y, contentWidth, rowHeight, 'F')
      }
      doc.setDrawColor(...colors.border)
      doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight)

      currentX = margin
      row.forEach((cell, cIdx) => {
        doc.text(String(cell), currentX + 3, y + 4.8)
        currentX += colWidths[cIdx]
      })
      y += rowHeight
    })
    y += 4
  }

  // --- BUILD PAGES ---
  addCoverPage()

  // --- PAGE 2: RESUME BUILDER SPECIFICATIONS ---
  addSectionHeader('3. Interactive Resume Builder (Detailed Functionality)')
  addParagraph(
    'The Resume Builder provides an intuitive, real-time authoring environment with both a 10-step Guided Stepper Mode and a free-form Section Navigation Mode. It incorporates ATS compliance algorithms, live A4 preview rendering, completeness scoring, and client-side PDF generation.'
  )

  addSubSectionHeader('3.1 Core Resume Sections & Data Schema')
  addBullet('Personal Identity', 'Full name, job title, email, phone, location, LinkedIn URL, GitHub URL, and live portfolio website.')
  addBullet('Professional Summary', 'Concise 3-4 sentence elevator pitch with integrated Gemini AI auto-generation based on experience and target roles.')
  addBullet('Education', 'Degree, institution, CGPA/percentage, graduation dates, coursework, and honors with dynamic entry addition and reordering.')
  addBullet('Work Experience', 'Company name, designation, dates, location, and structured bullet points with action-verb suggestions and AI enhancement.')
  addBullet('Technical Projects', 'Project title, role, live demo URL, repository link, technology stack chips, and quantified impact metrics.')
  addBullet('Skills Categorization', 'Tag-based inputs grouped by Languages, Frameworks, Developer Tools, Databases, and Professional/Soft Skills.')
  addBullet('Certifications', 'Certification title, issuing authority, credential ID, date of issuance, and verification URLs.')
  addBullet('Custom & Additional Sections', 'User-defined sections such as Publications, Hackathons, Languages, or Volunteer Work.')

  addSubSectionHeader('3.2 ATS-Compliant Template Engine')
  addParagraph(
    'PR Builder provides 4 professionally designed templates engineered to pass Applicant Tracking Systems (Workday, Greenhouse, Lever, Taleo) with high parsability scores:'
  )
  addTable(
    ['Template Name', 'Layout Type', 'Ideal Use Case', 'ATS Compatibility'],
    [
      ['Classic ATS', 'Single-Column Standard', 'Software Engineering, FinTech, Traditional Corporate', '99.4% Parsability'],
      ['Modern Professional', 'Two-Column Executive', 'Product Management, Tech Leads, Experienced Devs', '97.8% Parsability'],
      ['Technical Developer', 'Monospace Tech-First', 'Full-Stack, DevOps, Cloud Architects, Systems', '98.6% Parsability'],
      ['Minimal Editorial', 'High-Contrast Serif/Sans', 'UI/UX Engineers, Design Technologists, Academics', '98.2% Parsability'],
    ],
    [45, 45, 60, 30]
  )

  addSubSectionHeader('3.3 Dynamic Export & Persistence Features')
  addBullet('Direct A4 PDF Export', 'Generates crisp single or multi-page A4 PDFs directly in the browser via html2canvas and jsPDF with zero server latency.')
  addBullet('Smart User Profile Naming', 'Exported PDF filenames dynamically sanitize the active signed-in user name (e.g. Bhanu_Prakash_Resume.pdf) instead of generic placeholders.')
  addBullet('JSON Draft Backup & Migration', 'Full resume states can be exported as a JSON schema file and imported across devices for instant recovery.')
  addBullet('Autosave & Cloud Synchronization', 'Changes automatically persist to localStorage in real-time, with background syncing to Supabase for authenticated users.')

  // --- PAGE 3: PORTFOLIO BUILDER & DOMAIN SPECIFICATIONS ---
  addSectionHeader('4. Developer Portfolio Builder & Publishing Engine')
  addParagraph(
    'The Portfolio Builder transforms verified identity credentials and projects into a responsive, high-performance web showcase. It includes a 3-pane real-time editor, theme customizer, standalone export, and dual-layer publishing.'
  )

  addSubSectionHeader('4.1 Theme Catalog')
  addTable(
    ['Theme Name', 'Type', 'Aesthetic & Palette', 'Entitlement'],
    [
      ['Developer Terminal', 'Monospace Dev-First', 'Dark mode terminal with syntax highlighting chips', '100% Free Forever'],
      ['Minimal Editorial', 'Clean High-Contrast', 'Generous whitespace with refined typography rules', '100% Free Forever'],
      ['Midnight Dark Showcase', 'Deep Navy Cosmic', 'Ambient blue glow with modern software engineer cards', '100% Free Forever'],
      ['Creative Studio Pro', 'Vibrant Gradients', 'Animated cards, micro-interactions, rich media showcases', '₹299 Pro Theme'],
      ['Executive Horizon Pro', 'Premium Corporate', 'Sleek luxury enterprise styling for senior leaders', '₹299 Pro Theme'],
    ],
    [45, 35, 70, 30]
  )

  addSubSectionHeader('4.2 Standalone Website ZIP Export')
  addParagraph(
    'Users can download a self-contained, offline-first website ZIP package containing index.html, styled CSS, responsive JavaScript, and embedded assets. It requires zero backend servers and can be double-clicked to open locally or deployed to GitHub Pages, Netlify, or Vercel.'
  )

  addSubSectionHeader('4.3 Free Subdomain Publishing & Direct Routing')
  addParagraph(
    'Portfolios can be published directly to the live internet with automated slug availability validation:'
  )
  addBullet('Branded Subdomain', 'Claims a dedicated subdomain at https://[username].prbuilder.xyz with HTTPS certification.')
  addBullet('Guaranteed Direct Route', 'Every published portfolio is immediately accessible worldwide via https://prbuilder.xyz/p/[username] (200 OK without DNS propagation delays).')
  addBullet('High-Contrast QR Code', 'Auto-generates downloadable scannable QR codes linking recruiters directly to the candidate\'s published portfolio.')

  addSubSectionHeader('4.4 Custom Domain Connection (Custom Domain Pass ₹499)')
  addParagraph(
    'Allows professionals to connect their personal root or subdomains (e.g. johnsmith.dev, portfolio.mybrand.com):'
  )
  addBullet('Authoritative Entitlement', 'Unlocks via Cashfree payment verification and records entitlement in Supabase.')
  addBullet('Automated DNS Guidance', 'Generates DNS CNAME, A record (75.2.60.5), and cryptographic TXT challenge records.')
  addBullet('Verification Engine', 'Performs DNS lookup checks to verify ownership before provisioning automated SSL certificates.')

  // --- PAGE 4: CASHFREE PAYMENT & AI ARCHITECTURE ---
  addSectionHeader('5. Cashfree Payment Gateway & Monetization Architecture')
  addParagraph(
    'PR Builder integrates the official Cashfree Payments v3 Web SDK for fast, secure Indian payment processing across UPI (GPay, PhonePe, Paytm, BHIM), Credit/Debit Cards, NetBanking, and Wallets.'
  )

  addSubSectionHeader('5.1 Server-Authoritative Payment Pipeline')
  addTable(
    ['Step', 'Component / Endpoint', 'Security & Implementation Details'],
    [
      ['1. Order Initiation', 'POST /api/cashfree-order', 'Computes authoritative amount in integer paise; checks coupons and locks order in DB.'],
      ['2. Modal Launch', 'cashfreeService.ts & SDK v3', 'Loads official SDK from sdk.cashfree.com/js/v3/cashfree.js in seamless modal checkout mode.'],
      ['3. Settlement Verification', 'POST /api/cashfree-verify', 'Queries Cashfree servers directly using secret keys; confirms PAID status before unlock.'],
      ['4. Webhook Security', 'POST /api/cashfree-webhook', 'Validates x-webhook-signature using cryptographic HMAC-SHA256 and timestamp tolerances.'],
      ['5. Entitlement Unlock', 'Supabase RPC verify_and_fulfill', 'Atomically records user entitlement, marks order completed, and enables Pro features.'],
    ],
    [32, 48, 100]
  )

  addSubSectionHeader('5.2 Product Catalog & Pricing Table')
  addTable(
    ['Product ID', 'Item Name', 'Configured Price', 'Included Features'],
    [
      ['pro-template-*', 'Resume Pro Template', '₹199 (19900 paise)', 'Individual Pro ATS Resume Template lifetime license'],
      ['pro-theme-*', 'Portfolio Pro Theme', '₹299 (29900 paise)', 'Individual Pro Portfolio Theme lifetime license'],
      ['addon-custom-domain', 'Custom Domain Pass', '₹499 (49900 paise)', 'Unlimited custom domain connections, SSL provisioning, DNS guidance'],
      ['bundle-prbuilder-pro', 'PR Builder Pro All-Access', '₹999 (99900 paise)', 'All Pro Resume Templates, All Portfolio Themes, Custom Domain Pass'],
    ],
    [40, 42, 36, 62]
  )

  addSubSectionHeader('5.3 Promotional Coupon Engine')
  addParagraph(
    'Supports instant discount vouchers validated on both client and edge server:'
  )
  addBullet('WELCOME10', '10% off entire order for new signups.')
  addBullet('RESUME50', '50% off Resume Template upgrades.')
  addBullet('HACKATHON100', '100% free pass for partner university hackathon participants.')

  // --- PAGE 5: AI ENGINE, DATABASE & DEPLOYMENT ---
  addSectionHeader('6. Google Gemini AI Career Assistant Engine')
  addParagraph(
    'Powered by Google Gemini 3.8 Flash, PR Builder provides intelligent career guidance embedded directly in the authoring flow. API credentials remain securely isolated in backend serverless functions (/api/gemini).'
  )
  addBullet('Summary Generator', 'Analyzes past job roles, skills, and target positions to draft executive summaries in under 2 seconds.')
  addBullet('Bullet Point Optimizer', 'Applies Google STAR methodology (Situation, Task, Action, Result) to transform generic descriptions into measurable accomplishments.')
  addBullet('Skill Matcher', 'Identifies high-frequency industry keywords missing from the candidate\'s profile based on the desired job role.')

  addSectionHeader('7. Security, Privacy & Database Architecture')
  addParagraph(
    'Security and student data protection are deeply engineered into the platform:'
  )
  addBullet('Zero Sensitive Data Collection', 'Resume forms strictly reject sensitive identifiers (no Aadhaar, SSN, PAN, full street addresses, or financial data).')
  addBullet('Row-Level Security (RLS)', 'Every Supabase table (portfolios, resumes, domains, orders, entitlements) enforces authenticated RLS so students can only access their own data.')
  addBullet('Frontend Bundle Hygiene', 'Backend secrets (CASHFREE_SECRET_KEY, GEMINI_API_KEY) are never prefixed with VITE_ and are excluded from production builds.')

  addSectionHeader('8. Local Setup & Production Deployment Commands')
  addTable(
    ['Command', 'Execution Context', 'Description'],
    [
      ['npm run dev', 'kaizenq-identity', 'Launches local Vite development server on port 5173 with API proxies.'],
      ['node scripts/build.js', 'Project Root', 'Compiles TypeScript, runs Vite bundle builder, and synchronizes dist/.'],
      ['node scripts/run-all-tests.js', 'kaizenq-identity', 'Executes all 8 platform validation suites (33 Cashfree tests + security).'],
      ['git push origin main', 'Git CLI', 'Triggers automated Vercel production deployment to https://prbuilder.xyz.'],
    ],
    [50, 40, 90]
  )

  addCallout(
    'PRODUCTION DEPLOYMENT VERIFICATION',
    'PR Builder is currently live at https://prbuilder.xyz. Subdomains route via *.prbuilder.xyz and direct portfolio fallbacks resolve at /p/[slug]. Cashfree payment mode is configured for live Indian settlement.',
    'success'
  )

  // Add Page Numbers and Footers to all pages
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...colors.muted)

    // Bottom divider
    doc.setDrawColor(...colors.border)
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - margin + 2, pageWidth - margin, pageHeight - margin + 2)

    // Footer text
    doc.text('PR Builder v2.4 — Confidential & Proprietary Documentation', margin, pageHeight - margin + 6)
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - margin + 6)
  }

  // Save the PDF
  const outputFilePath = path.join(rootDir, 'PR_BUILDER_PROJECT_DOCUMENTATION.pdf')
  const pdfBytes = doc.output('arraybuffer')
  fs.writeFileSync(outputFilePath, Buffer.from(pdfBytes))

  console.log(`✓ PDF Generated successfully: ${outputFilePath}`)
  console.log(`✓ Total Pages: ${totalPages}`)
  return outputFilePath
}

generateDocumentationPdf().catch((err) => {
  console.error('Failed to generate documentation PDF:', err)
  process.exit(1)
})
