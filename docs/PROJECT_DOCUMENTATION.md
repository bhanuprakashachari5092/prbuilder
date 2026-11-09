# PR Builder (KaizenQ Identity) — Project Documentation & Technical Overview

> **Version:** 2.4.0 (Production Release)  
> **Platform Domain:** https://prbuilder.xyz (Vercel Edge CDN)  
> **Backend:** Supabase PostgreSQL + Auth + Edge Functions  
> **Payment Gateway:** Cashfree Payments (v3 Web SDK + Server-Authoritative Verification)  
> **AI Engine:** Google Gemini 3.8 Flash  
> **Generated PDF:** `PR_BUILDER_PROJECT_DOCUMENTATION.pdf` (in root directory)

---

## 1. Executive Summary & Project Purpose

**PR Builder** is a modern, high-performance web platform built to solve the fragmentation and extortionate pricing models prevalent in the resume and portfolio building ecosystem. Most platforms charge high recurring subscriptions, watermark exports, and offer zero custom domain or hosting freedom.

PR Builder empowers students, software engineers, and professionals to:
1. **Craft ATS-Compliant Resumes** using 4 optimized templates, real-time completeness scoring, privacy safeguards, and instant A4 PDF exports named after the user.
2. **Build & Host Developer Portfolios** across 5 designer themes, with free subdomain publishing (`username.prbuilder.xyz`), zero-dependency standalone website ZIP exports, and direct worldwide access (`prbuilder.xyz/p/:slug`).
3. **Connect Custom Domains** via an authoritative Custom Domain Pass (₹499) with automated DNS verification (CNAME, A-record, cryptographic TXT challenge) and automatic SSL issuance.
4. **Leverage AI Career Assistance** powered by Google Gemini 3.8 Flash to transform basic bullet points into high-impact Google STAR statements.
5. **Transact Securely via Indian Payment Methods** (UPI, QR, Cards, NetBanking, Wallets) via Cashfree's official v3 modal SDK with cryptographic webhook validation.

---

## 2. Core Modules & Functionality

### 2.1 Interactive Resume Builder
- **Step-by-Step Guided Mode vs Free Section Mode:** Provides a clean 10-step wizard for first-time builders and direct section switching for rapid edits.
- **Section Coverage:**
  1. *Personal Details:* Name, title, email, phone, location, GitHub, LinkedIn, portfolio link.
  2. *Professional Summary:* Context-aware elevator pitch with 1-click Gemini AI draft generator.
  3. *Education:* Degrees, universities, graduation years, CGPA/percentage, honors.
  4. *Experience:* Roles, companies, dates, locations, action-oriented bullet points.
  5. *Projects:* Project titles, live demos, repository links, tech stack badges, metric bullets.
  6. *Skills:* Multi-category chips (Languages, Frameworks, Developer Tools, Soft Skills).
  7. *Certifications:* Credential IDs, issuing organizations, verification links.
  8. *Custom Sections:* Hackathons, publications, languages, volunteer work.
  9. *Design & Formatting:* Fine-tune font sizes, line heights, page margins, and primary accents.
  10. *Export:* Instant A4 PDF, JSON draft download & upload.
- **4 ATS-Compliant Templates:**
  - `ClassicAtsTemplate`: Strict single-column standard preferred by Fortune 500 ATS systems (99.4% parsability).
  - `ModernProfessionalTemplate`: Clean two-column header design for mid-to-senior engineers.
  - `TechnicalTemplate`: Monospace tech-focused layout with inline stack chips.
  - `MinimalTemplate`: Ultra-clean typography and generous whitespace.
- **Personalized Export Naming:** Automatically names the downloaded file after the user (e.g. `Bhanu_Prakash_Resume.pdf`) rather than generic placeholders.
- **Privacy Audit Compliance:** System actively avoids collecting sensitive government identifiers (Aadhaar, SSN, PAN, full street addresses).

### 2.2 Developer Portfolio Builder & Hosting
- **Live 3-Pane Editor:** Real-time editing on the left, theme selector on the top, and live reactive preview on the right.
- **5 Curated Themes:**
  - *Developer Terminal Theme (Free):* Code-first monospace aesthetic with interactive terminal syntax styling.
  - *Minimal High-Contrast Theme (Free):* Editorial serif and sans typography with clean line rules.
  - *Midnight Dark Showcase (Free):* Modern dark mode with ambient blue glow effects.
  - *Creative Studio Pro Theme (₹299):* Vibrant gradient cards and micro-interactions for UI/UX developers.
  - *Executive Horizon Pro Theme (₹299):* Sleek luxury layout for senior managers and executives.
- **Standalone Website ZIP Export:** Packages all HTML, CSS, JS, and image assets into a zero-dependency ZIP archive that can be double-clicked locally or deployed to GitHub Pages/Netlify.
- **Dual-Layer Publishing:**
  - *Free Subdomain:* Claims a live subdomain at `https://[username].prbuilder.xyz`.
  - *Guaranteed Direct Route:* Published portfolios are simultaneously accessible worldwide at `https://prbuilder.xyz/p/[username]` with HTTP 200 OK.
  - *Dynamic Scannable QR Code:* Generates high-contrast QR codes for resume embeds and business cards.
- **Custom Domain Pass (₹499):**
  - Allows mapping personal domains (e.g. `yourname.dev`, `portfolio.yourcompany.com`).
  - Automated DNS verification instructions: A-record pointing to `75.2.60.5` or CNAME pointing to `prbuilder.xyz`.
  - Server-side cryptographic challenge verification (`_prbuilder-challenge.[subdomain]`).

### 2.3 Cashfree Payment Gateway & Monetization
- **Official Integration:** Dynamic injection of official Cashfree v3 Web SDK (`https://sdk.cashfree.com/js/v3/cashfree.js`).
- **Server-Authoritative Calculations:** Price calculation happens in integer paise on backend edge functions to eliminate floating-point calculation errors and client manipulation.
- **Product Catalog:**
  - Resume Pro Template: ₹199 (19,900 paise)
  - Portfolio Pro Theme: ₹299 (29,900 paise)
  - Custom Domain Pass: ₹499 (49,900 paise)
  - Pro All-Access Pass: ₹999 (99,900 paise)
- **Promotional Coupons:** Server-validated coupon vouchers (`WELCOME10`, `RESUME50`, `HACKATHON100`).
- **Cryptographic Webhook Verification:** Verifies `x-webhook-signature` using HMAC-SHA256 with timestamp replay protection.

### 2.4 Google Gemini AI Assistant
- Integrated with Google Gemini 3.8 Flash model.
- Analyzes work history and suggests action-oriented bullet points using the Google STAR methodology.
- Generates 3 custom variants of professional summaries based on target job roles.

---

## 3. Automated Verification & Testing

The project maintains 8 comprehensive automated test suites run via `node kaizenq-identity/scripts/run-all-tests.js`:
- **Suite 1:** Slug Security, Kebab-case formatting, and Reserved Keyword filtering.
- **Suite 2:** Completeness Calculation & Real-Time Validation.
- **Suite 3:** A4 Print CSS Rules & Pagination audit.
- **Suite 4:** Template Data Preservation across switches.
- **Suite 5:** Standalone Website ZIP Packaging & Asset Integrity.
- **Suite 6:** Custom Domain Format Validation & DNS Challenge generator.
- **Suite 7:** Supabase Auth, Google OAuth redirects, and Token persistence.
- **Suite 8:** Cashfree Gateway: 33 tests verifying HMAC-SHA256 signatures, integer paise math, phone sanitization, status state transitions, and Edge Function handlers.

---

## 4. Local Setup & Production Deployment

### Environment Configuration (`.env`)
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://itzhhwvgouubazribubz.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_jwt_token>

# Platform Domain
VITE_PLATFORM_DOMAIN=prbuilder.xyz
VITE_APP_URL=https://prbuilder.xyz

# Cashfree Payments (Production)
VITE_PAYMENT_GATEWAY=cashfree
VITE_CASHFREE_MODE=production
VITE_CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_ENV=production
CASHFREE_API_VERSION=2023-08-01

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash
```

### Build & Run Commands
```bash
# 1. Run local dev server
npm --prefix kaizenq-identity run dev

# 2. Run all 8 automated test suites
node kaizenq-identity/scripts/run-all-tests.js

# 3. Compile and build production bundle
node ./scripts/build.js

# 4. Generate Documentation PDF
node ./scripts/generate-project-doc-pdf.js
```
