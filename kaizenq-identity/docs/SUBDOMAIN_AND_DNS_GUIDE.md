# PR Builder — Free Platform Subdomain Architecture & DNS Deployment Guide

This guide documents the exact configuration required to operate free platform subdomain publishing (e.g. `username.prbuilder.in`) using **Netlify** and **Supabase**, including wildcard DNS, SSL certification, hostname routing, and security.

---

## 1. Hosting Architecture Overview

- **Hosting Platform**: Netlify (Single Page Application — React 19 + Vite 6)
- **Database & Auth**: Supabase PostgreSQL 15+ with Row-Level Security (RLS)
- **Apex Platform Domain**: `prbuilder.in` (configurable via `VITE_PLATFORM_DOMAIN`)
- **Subdomain Routing Pattern**: `[slug].prbuilder.in` (e.g. `https://alexander.prbuilder.in`)
- **Direct Path Route Fallback**: `https://prbuilder.in/p/[slug]`
- **Local Testing Loopback**: `http://[slug].localhost:5174` (native RFC 6761 localhost loopback)

---

## 2. Production Host & Wildcard Subdomain Support

### Does Netlify Support Wildcard Subdomains (`*.prbuilder.in`)?
**Yes.** Netlify supports wildcard subdomains, but requires specific DNS management to issue a valid Let's Encrypt wildcard SSL certificate.

There are two production deployment models:

### Method A: Netlify DNS (Recommended — Automatic Let's Encrypt Wildcard SSL)
When `prbuilder.in` delegates its nameservers to Netlify DNS, Netlify manages DNS records and automatically issues a Let's Encrypt wildcard certificate covering both `prbuilder.in` and `*.prbuilder.in`.

#### Step 1: Delegate Nameservers at Domain Registrar
At your registrar (e.g. Namecheap, GoDaddy, Dynadot, Google Domains/Squarespace) where `prbuilder.in` is registered:
1. Open DNS settings for `prbuilder.in`.
2. Select **Custom Nameservers**.
3. Set the four Netlify nameservers assigned to your site in **Netlify Dashboard > Domains > Netlify DNS**:
   - `dns1.p0X.nsone.net`
   - `dns2.p0X.nsone.net`
   - `dns3.p0X.nsone.net`
   - `dns4.p0X.nsone.net`

#### Step 2: Add Wildcard Alias in Netlify Site Settings
1. Go to **Netlify Dashboard > [Your PR Builder Site] > Site configuration > Domain management**.
2. Click **Add domain alias**.
3. Enter: `*.prbuilder.in`.
4. Netlify will verify the DNS zone and automatically issue an SNI Let's Encrypt certificate covering `prbuilder.in` and `*.prbuilder.in`.

#### Step 3: SPA Wildcard Rewrites
Ensure `public/_redirects` contains:
```
/*    /index.html   200
```
This instructs Netlify's edge router to serve the SPA `index.html` on any requested subdomain (e.g. `https://username.prbuilder.in/`). The application's client-side router then inspects the hostname and displays the user's published portfolio.

---

### Method B: Cloudflare Proxy + Netlify (External DNS with Edge Wildcard SSL)
If your organization prefers to keep DNS on Cloudflare:

1. **DNS Records in Cloudflare**:
   - `CNAME` `@` -> `[your-site-name].netlify.app` (Proxied - Orange Cloud)
   - `CNAME` `*` -> `[your-site-name].netlify.app` (Proxied - Orange Cloud)
2. **Cloudflare SSL/TLS**:
   - Set SSL mode to **Full** or **Full (strict)**.
   - Cloudflare Edge automatically provides a universal wildcard SSL certificate for `*.prbuilder.in`.
3. **Netlify Custom Domain**:
   - Set primary custom domain in Netlify to `prbuilder.in`.
   - Add domain alias `*.prbuilder.in`.

---

## 3. Hostname Routing & Security Architecture

### How the Application Resolves Subdomains
1. **Hostname Detection**:
   When a request arrives at `https://username.prbuilder.in/`, `getSubdomainFromHostname()` in `src/lib/domainUtils.ts` parses `window.location.hostname`.
2. **Reserved Hostnames Protection**:
   System subdomains (`www`, `app`, `admin`, `api`, `auth`, `identity`, `mail`, `cname`, `docs`, `cdn`, `prbuilder`, etc.) return `null`, allowing normal application routing to take place without interference.
3. **Safe Public Fetch**:
   The application calls `portfolioService.getPublishedPortfolio(slug)` or `portfolioService.getPublishedPortfolioByHostname(hostname)`.
   - This executes PostgreSQL function `get_published_portfolio(p_slug)` with `SECURITY DEFINER`.
   - It strictly filters by `publication_status = 'published'`.
   - Unpublished drafts are **never** returned to public visitors.
4. **404 / Private State**:
   If a visitor accesses an unregistered or draft subdomain (e.g. `https://draft-user.prbuilder.in`), the application displays a clean, friendly 404 page ("Portfolio Not Found or Draft is Private") with a direct link to the platform apex domain (`getApexUrl()`), preventing redirect loops.

---

## 4. Local Testing & Verification

Modern web browsers (Google Chrome, Microsoft Edge, Mozilla Firefox) natively route all subdomains of `localhost` (`*.localhost`) to `127.0.0.1` per RFC 6761 without requiring any `/etc/hosts` modifications!

To test subdomain routing locally:
1. Run `npm run dev` (running at `http://localhost:5174` or `5173`).
2. Visit `http://alexander.localhost:5174/` in your browser.
3. The application will detect the subdomain `alexander` and attempt to load the published portfolio for `alexander`.
4. If published: displays the full portfolio.
5. If unpublished or nonexistent: displays the clean 404 page with a button to return to `http://localhost:5174`.

---

## 5. Security Summary

| Threat / Risk | Mitigation Strategy |
|---|---|
| Unauthorized Slug Publishing | Protected by Supabase Auth and RPC `publish_portfolio()` checking `auth.uid() = user_id`. |
| Slug Collisions & Squatting | Partial unique index `idx_portfolios_published_slug` + atomic database RPC check + `domains` unique constraint. |
| Host Header Poisoning | Strict whitelist regex `^[a-z0-9]+(-[a-z0-9]+)*$` and reserved host rejection. |
| Private Draft Leakage | Supabase RLS policy `portfolios_public_select_published` strictly filters `publication_status = 'published'`. |
| Subdomain Redirect Loops | Navigation handlers break out of subdomains to `getApexUrl()` on not-found or home clicks. |
| Secret Leakage in ZIP | Client-side standalone packager bundles only rendered semantic HTML, CSS, vanilla JS, and public assets. |
