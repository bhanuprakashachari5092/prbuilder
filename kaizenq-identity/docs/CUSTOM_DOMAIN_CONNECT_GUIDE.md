# PR Builder: Secure "Connect My Own Domain" Architecture Guide

This guide details the complete architecture, DNS specifications, security model, hosting provider integration, and registrar workflows for the **"Connect My Own Domain"** feature in PR Builder.

---

## 1. Executive Summary & Zero-VPS Architecture

PR Builder allows users to connect domains they already own (such as `example.com` or `portfolio.example.com`) directly to their published portfolio **without purchasing or managing a separate VPS**.

### How It Works Without a VPS
1. **Edge CDN Distribution**: The PR Builder Single Page Application (SPA) is hosted on **Netlify Edge CDN**.
2. **Wildcard & Domain Aliasing**: When a user connects their domain, the domain points directly to Netlify's high-availability Anycast edge infrastructure via standard DNS (`A` or `CNAME` records).
3. **Automated TLS/SSL Provisioning**: Netlify's edge automates Let's Encrypt SSL/TLS certificate provisioning and renewals for all validated domain aliases.
4. **Zero-Trust Hostname Resolution**: When a visitor opens the custom domain in their browser, the Netlify CDN serves the PR Builder application bundle. The frontend client reads `window.location.hostname` and requests the published portfolio from Supabase via the secure `get_published_portfolio_by_hostname` RPC function.
5. **Strict Tenant & Draft Isolation**: The database strictly requires `connection_status = 'active'`, `verification_status = 'verified'`, and `publication_status = 'published'`. Private user drafts, unpublished edits, resumes, and other users' portfolios are completely protected from public exposure.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Visitor Browser Request                         │
│                    https://portfolio.johndoe.com                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Netlify Anycast Edge Network                        │
│   • Apex: 75.2.60.5 (Load Balancer A Record)                           │
│   • Subdomain: prbuilder.in (CNAME Target)                             │
│   • TLS Certificate: Automated Let's Encrypt Provisioning              │
│   • Rewrites: /* -> /index.html 200 (Single Page Application)          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     PR Builder Client Router                           │
│   • Checks isCustomDomainHost("portfolio.johndoe.com") -> true         │
│   • Routes directly to PublicPortfolioPage                             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Supabase Edge & PostgreSQL                         │
│   RPC: get_published_portfolio_by_hostname("portfolio.johndoe.com")    │
│   WHERE domains.verification_status = 'verified'                       │
│     AND domains.connection_status = 'active'                           │
│     AND portfolios.publication_status = 'published'                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Exact Hosting Provider DNS Requirements

> [!IMPORTANT]
> **Never invent DNS targets.** PR Builder utilizes the exact, verified DNS requirements specified by Netlify.

### 2.1. Apex Domains (e.g. `example.com`, `mybrand.co.in`)
For root/naked domains that do not include a subdomain prefix:

| Record Type | Host / Name | Target / Value | Recommended TTL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` (or leave blank) | `75.2.60.5` | 300 seconds (5 min) | Routes apex traffic to Netlify High-Availability Load Balancer |
| **TXT** | `_prbuilder-challenge` | `prbuilder-verify=<TOKEN>` | 300 seconds (5 min) | Cryptographic domain ownership verification challenge |

*Note: If the user's DNS provider supports CNAME flattening or ANAME/ALIAS records (such as Cloudflare or DNSimple), they may alternatively point `@` to `prbuilder.in`.*

### 2.2. Subdomains (e.g. `portfolio.example.com`, `me.mybrand.dev`)
For subdomains hosted on an existing root domain:

| Record Type | Host / Name | Target / Value | Recommended TTL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **CNAME** | `portfolio` (or prefix) | `prbuilder.in` | 300 seconds (5 min) | Routes subdomain traffic to PR Builder Netlify CDN edge |
| **TXT** | `_prbuilder-challenge.portfolio` | `prbuilder-verify=<TOKEN>` | 300 seconds (5 min) | Cryptographic domain ownership verification challenge |

---

## 3. Entitlement Rules vs. Domain Ownership

PR Builder enforces a strict distinction between **monetary entitlement** and **domain ownership**:

1. **Custom Domain Pass (`domain:custom`)**:
   - Price: ₹499 (or included in ₹999 Pro All-Access Pass).
   - Purchasing this pass grants the user the right to register and connect a custom domain to their portfolio.
2. **Payment is NOT Proof of Ownership**:
   - A user who purchases the pass cannot simply type in `google.com` or `apple.com` and have traffic routed.
   - Domain activation strictly requires successful verification of the cryptographic TXT challenge record (`_prbuilder-challenge.<domain>`).
   - The domain remains in `pending_verification` status until ownership is cryptographically proven.

---

## 4. Security & Tenant Isolation Invariants

The custom domain engine implements enterprise-grade multi-tenant safeguards:

### 4.1. Duplicate Claim & Collision Prevention
- The database enforces a `UNIQUE (hostname)` constraint (`uq_domains_hostname`).
- In addition, the `connect_custom_domain` RPC atomically verifies that no other user currently claims or connects the normalized hostname.
- A user cannot hijack another user's connected domain.

### 4.2. Cross-Tenant Authorization Boundaries
- Every mutation RPC (`connect_custom_domain`, `verify_custom_domain`, `disconnect_custom_domain`) verifies `auth.uid() = user_id`.
- Users can only attach domains to portfolios they own (`portfolios.user_id = auth.uid()`).
- User A can never trigger verification or disconnection of User B's domain.

### 4.3. Private Data & Unpublished Draft Protection
- The public resolution RPC `get_published_portfolio_by_hostname` executes with strict security parameters:
  ```sql
  WHERE d.hostname = v_clean_host
    AND d.verification_status = 'verified'
    AND d.connection_status = 'active'
    AND p.publication_status = 'published';
  ```
- If a user unpublishes their portfolio or sets it to draft, the domain immediately stops resolving publicly and returns `404 Not Found`.
- Resume drafts, private profile fields, user credentials, and payment history are never exposed.

---

## 5. Domain Management UI Capabilities

The domain management interface in the Dashboard (`src/pages/Dashboard/components/DomainView.tsx`) provides:

1. **Entitlement State Awareness**:
   - Displays unlock status.
   - If not unlocked, displays an actionable banner prompting the user to purchase the **Custom Domain Pass (₹499)** or **Pro All-Access Pass (₹999)** via the existing `CheckoutModal`.
2. **Add Domain Form**:
   - Automatically cleans and normalizes user input (stripping `https://`, paths, ports, whitespace).
   - Validates syntax and blocks prohibited domains (`localhost`, IP addresses, `netlify.app`, `prbuilder.in`).
3. **Exact DNS Record Table**:
   - Renders the exact records needed (A record for apex, CNAME for subdomain, TXT challenge).
   - Single-click copy buttons for Host, Type, Target, and TTL.
4. **Live DNS-over-HTTPS (DoH) Diagnostic**:
   - Real-time DNS check using Google DNS API (`https://dns.google/resolve`) directly from the user's browser.
   - Informs the user whether their TXT challenge or routing records have propagated globally.
5. **Verify Again**:
   - Triggers server-side verification and status update.
6. **Disconnect Domain**:
   - Confirmation dialog before deactivating or removing domain mappings.

---

## 6. Hosting Provider API & Serverless Function Integration

> [!CAUTION]
> **Never expose provider API tokens in frontend code.** All privileged provider operations must be executed through server-side serverless functions.

### 6.1. Netlify Domain Alias Attachment
When a custom domain is verified in Supabase, it can be attached to the Netlify site via Netlify's Domain Aliases API:

- **Endpoint**: `POST https://api.netlify.com/api/v1/sites/{site_id}/domain_aliases`
- **Headers**:
  - `Authorization: Bearer <NETLIFY_AUTH_TOKEN>`
  - `Content-Type: application/json`
- **Payload**:
  ```json
  {
    "domain": "portfolio.johndoe.com"
  }
  ```

### 6.2. Serverless Function Implementation
A dedicated Supabase Edge Function (`supabase/functions/sync-netlify-domain/index.ts`) handles communication with Netlify:

```typescript
// Example Edge Function snippet (Server-Side Only)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { domain, action } = await req.json()
  const netlifyToken = Deno.env.get('NETLIFY_AUTH_TOKEN')
  const siteId = Deno.env.get('NETLIFY_SITE_ID')

  if (!netlifyToken || !siteId) {
    return new Response(JSON.stringify({ error: 'Netlify credentials not configured' }), { status: 500 })
  }

  if (action === 'add') {
    const res = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/domain_aliases`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domain }),
    })
    const data = await res.json()
    return new Response(JSON.stringify(data), { status: res.status })
  }

  if (action === 'remove') {
    // Delete alias logic
  }
})
```

---

## 7. Provider Limitations & Compatible Scaling Alternatives

### Current Provider: Netlify
- **Capabilities**: Full support for domain aliases, automated SSL via Let's Encrypt, global edge CDN.
- **Limitation**: Netlify Starter/Pro tiers have soft limits on domain aliases (typically up to 100 aliases per site via API). For mass consumer SaaS with tens of thousands of simultaneous custom domains, adding thousands of aliases directly to one Netlify site requires an Enterprise plan.
- **Recommended Enterprise Multi-Tenant Architecture**:
  If PR Builder scales beyond Netlify's standard domain alias quotas:
  1. **Cloudflare for SaaS (Custom Hostnames / SSL for SaaS)**:
     - Keep PR Builder deployed on Netlify as the static origin (`origin.prbuilder.in`).
     - Point Cloudflare Custom Hostnames to `origin.prbuilder.in`.
     - Provides programmatic custom domain routing, automated SSL provisioning, and wildcard fallback with zero Netlify alias limits.
  2. **Fly.io / Caddy Edge**:
     - Deploy a lightweight, multi-region Caddy edge proxy that issues On-Demand TLS certificates and reverse-proxies to Netlify.

---

## 8. Step-by-Step Registrar Configuration Guides

### 8.1. Cloudflare DNS
1. Log in to your Cloudflare dashboard and select your domain.
2. Go to **DNS** -> **Records**.
3. Add the TXT verification record:
   - **Type**: `TXT`
   - **Name**: `_prbuilder-challenge` (or `_prbuilder-challenge.subdomain`)
   - **Content**: `prbuilder-verify=...`
   - **TTL**: Auto
4. Add the routing record:
   - For Apex: **Type** `A`, **Name** `@`, **IPv4 Address** `75.2.60.5`, **Proxy status** `DNS only` (Grey cloud).
   - For Subdomain: **Type** `CNAME`, **Name** `subdomain`, **Target** `prbuilder.in`, **Proxy status** `DNS only` (Grey cloud).
   > *Important: Disable Cloudflare Orange-cloud proxy (set to DNS only) during initial SSL certificate verification.*

### 8.2. GoDaddy
1. Navigate to **Domain Portfolio** -> Select domain -> **Manage DNS**.
2. Click **Add New Record**:
   - **Type**: `TXT`, **Name**: `_prbuilder-challenge`, **Value**: `prbuilder-verify=...`, **TTL**: 1/2 Hour.
3. Add routing record:
   - For Apex: **Type**: `A`, **Name**: `@`, **Value**: `75.2.60.5`, **TTL**: 1/2 Hour.
   - For Subdomain: **Type**: `CNAME`, **Name**: `subdomain`, **Value**: `prbuilder.in`, **TTL**: 1/2 Hour.
4. Save records and allow 10–30 minutes for DNS propagation.

### 8.3. Namecheap
1. Go to **Domain List** -> Click **Manage** -> **Advanced DNS**.
2. Click **Add New Record**:
   - **Type**: `TXT Record`, **Host**: `_prbuilder-challenge`, **Value**: `prbuilder-verify=...`, **TTL**: 5 min.
3. Add routing record:
   - For Apex: **Type**: `A Record`, **Host**: `@`, **Value**: `75.2.60.5`, **TTL**: 5 min.
   - For Subdomain: **Type**: `CNAME Record`, **Host**: `subdomain`, **Value**: `prbuilder.in`, **TTL**: 5 min.

---

## 9. Environment Variables Reference

| Variable Name | Location | Exposure | Description |
| :--- | :--- | :--- | :--- |
| `VITE_PLATFORM_DOMAIN` | Frontend `.env` | Public (Client) | Primary platform domain (`prbuilder.in`). |
| `VITE_SUPABASE_URL` | Frontend `.env` | Public (Client) | Supabase project URL. |
| `VITE_SUPABASE_ANON_KEY` | Frontend `.env` | Public (Client) | Supabase anonymous API key for public queries & client auth. |
| `NETLIFY_AUTH_TOKEN` | Supabase Vault / Edge Secrets | **Private (Server Only)** | Netlify Personal Access Token for provisioning domain aliases. |
| `NETLIFY_SITE_ID` | Supabase Vault / Edge Secrets | **Private (Server Only)** | Target Netlify Site ID where aliases are bound. |

---

## 10. Automated Test Suite Summary

The automated test suite (`scripts/test-custom-domain.js`) executes 64 comprehensive tests verifying:
- Hostname normalization (stripping protocols, trailing slashes, paths, ports, query strings, and lowercase casing).
- Hostname validation and security rejection (blocking IPs, localhost, Netlify preview domains, platform collisions).
- Apex vs subdomain classification (including multi-part ccTLDs like `.co.in` and `.co.uk`).
- Exact Netlify DNS record generation (A `75.2.60.5`, CNAME `prbuilder.in`, TXT challenge).
- Entitlement gates (Custom Domain Pass ₹499 and Pro All-Access Pass ₹999 required).
- Separation of payment from ownership.
- Prevention of duplicate domain claims and collisions across users.
- Tenant isolation (User B cannot verify, disconnect, or mutate User A's domain).
- Verification failure diagnostics and error persistence.
- Safe public routing: published portfolios resolve; unpublished drafts return `404`; zero private data leak.
- Full migration schema and RPC function validation.
