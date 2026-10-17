# KaizenQ Identity — Supabase Backend & Production Deployment Architecture

This document provides complete, step-by-step instructions for initializing, configuring, securing, and deploying the **KaizenQ Identity** full-stack student professional identity platform.

---

## 1. Architecture Overview

- **Frontend**: React 19 + Vite 6 + TypeScript + Tailwind CSS 4 + Motion
- **Authentication**: Supabase Auth (Email/Password, Email Confirmation, Password Recovery)
- **Database**: Supabase PostgreSQL 15+ with strict Row Level Security (RLS)
- **Object Storage**: Supabase Storage (`avatars` and `project-images` buckets)
- **Publication Engine**: PostgreSQL Security Definer RPC functions (`publish_portfolio`, `unpublish_portfolio`, `get_published_portfolio`) with server-side slug validation and audit trail logging
- **Edge QR Generation**: Client-side SVG/PNG vector generation using `qrcode` derived strictly from server-confirmed public URLs (`/p/:slug`)
- **Offline / Local Mode**: Resilient local-first fallback via `isSupabaseConfigured()`, preserving localStorage drafts without server errors when unconfigured

---

## 2. Supabase Project Setup

### A. Create a New Supabase Project
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. Select your preferred AWS region close to your primary student user base (e.g. `ap-south-1` for India / FUSION 2K26).
3. Set a strong database password and copy your project details.

### B. Environment Configuration
Create a `.env` file in the project root based on `.env.example`:

```bash
# Supabase Project Connection
VITE_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...[YOUR_ANON_PUBLIC_KEY]

# Public Production Application Base URL (No trailing slash)
VITE_APP_URL=https://identity.kaizenq.me
```

> **Security Rule**: Never commit `.env` or put `service_role` keys into frontend code. Only publishable anon keys belong in `VITE_SUPABASE_ANON_KEY`.

---

## 3. Database Migrations & Schema

All migrations are version-controlled under `supabase/migrations/` and should be applied in sequential order.

### Using Supabase CLI (Recommended)
```bash
# Link your local CLI to your Supabase project
npx supabase link --project-ref [YOUR_PROJECT_ID]

# Push all migrations
npx supabase db push
```

### Or Using Supabase SQL Editor
Run the SQL migration files in this exact order:

1. `supabase/migrations/20261009000001_initial_schema.sql`
   - Defines tables: `profiles`, `portfolios`, `resumes`, `projects`, `domains`, `publication_events`
   - Creates `set_updated_at()` trigger for automated timestamps
   - Creates server-side `validate_portfolio_slug()` function (length 3-48, regex, reserved slug filter)
   - Creates `handle_new_user()` trigger to automatically create a profile when a student registers via `auth.users`
   - Creates partial unique index `idx_portfolios_published_slug` enforcing slug uniqueness only for published portfolios

2. `supabase/migrations/20261009000002_row_level_security.sql`
   - Enables Row Level Security (RLS) on all user-owned tables
   - Profiles: Users can read and update their own profile only (`auth.uid() = id`)
   - Portfolios: Users have full CRUD over their own drafts (`auth.uid() = user_id`)
   - Portfolios (Public): Anonymous public visitors can ONLY read portfolios where `publication_status = 'published'`
   - Resumes: Strictly private to owner (`auth.uid() = user_id`), never exposed publicly
   - Projects & Domains: Strictly owner-controlled with relationship validation
   - Publication Events: Append-only audit trail; students cannot delete or forge publication history

3. `supabase/migrations/20261009000003_publication_functions.sql`
   - `publish_portfolio(p_portfolio_id UUID, p_slug TEXT)`: Security Definer RPC with ownership check, slug collision prevention, and audit logging
   - `unpublish_portfolio(p_portfolio_id UUID)`: Security Definer RPC revoking public access
   - `get_published_portfolio(p_slug TEXT)`: Security Definer RPC exposing only public portfolio fields

4. `supabase/migrations/20261009000004_storage_buckets.sql`
   - Creates storage buckets: `'avatars'` (max 5MB) and `'project-images'` (max 8MB)
   - Sets storage RLS policies restricting file uploads, updates, and deletions to the folder owner (`storage.foldername(name)[1] = auth.uid()::text`)

---

## 4. Authentication Configuration

In the Supabase Dashboard under **Authentication > URL Configuration**:

1. **Site URL**: `https://identity.kaizenq.me` (or `http://localhost:5174` during local testing)
2. **Redirect URLs**: Add:
   - `http://localhost:5173/**`
   - `http://localhost:5174/**`
   - `https://identity.kaizenq.me/**`
   - `https://*.netlify.app/**`

Under **Authentication > Email Templates**:
- Customize the Confirmation and Password Reset emails with official Shaivika Groups × KaizenQ branding.

---

## 5. Local Draft Migration Behavior

When a student uses KaizenQ Identity:
1. **Unauthenticated / Local Mode**:
   - The user can build their resume and portfolio in the browser.
   - Drafts are continuously stored under `kaizenq_portfolio_draft_v1` and `kaizenq_resume_draft_v1`.
2. **Upon Signing In / Registering**:
   - The app detects whether a local draft exists.
   - If the cloud account has no saved draft: `DraftMigrationModal` offers to import the local draft to the cloud.
   - If both exist and differ: `DraftMigrationModal` offers an explicit conflict-resolution choice ("Keep Cloud Version" vs "Overwrite Cloud with Browser Draft").
   - The local draft is never silently overwritten or discarded.

---

## 6. Public Publishing & QR Codes

1. **Public Route**:
   - Published portfolios are served at `/p/:slug`.
   - Anonymous visitors can view published portfolios.
   - Unpublished or nonexistent drafts return an accessible 404 "Portfolio Unavailable" state without disclosing account existence.
2. **QR Code Generation**:
   - QR codes are generated dynamically via `qrcode` only for server-confirmed, published public URLs.
   - In draft mode or local preview mode, QR generation is disabled with a clear notice.
   - Includes one-click PNG download for student resumes, posters, and business cards.

---

## 7. Custom Domain Architecture

Custom domain requests are stored in the `domains` table in PostgreSQL:
- **Default State**: `pending_verification`
- **DNS Targets**:
  - `CNAME` `@` -> `cname.kaizenq.me`
  - `CNAME` `www` -> `cname.kaizenq.me`
  - `TXT` `_verify` -> `kaizenq-verify=[USER_ID_PREFIX]`
- **Verification**: Trusted backend / Edge function checks DNS records prior to updating `verification_status` to `verified` and `connection_status` to `connected`.
- No registrar credentials or DNS API keys are exposed to the browser.

---

## 8. Verification & Production Build

Run the automated verification suite:
```bash
# 1. Run unit & security test suite
npm run test

# 2. Run TypeScript type check
npx tsc --noEmit

# 3. Run ESLint
npm run lint

# 4. Create production build bundle
npm run build
```

---

## 9. Rollback & Troubleshooting

- **Database Rollback**:
  To unpublish all student portfolios in an emergency:
  ```sql
  UPDATE public.portfolios SET publication_status = 'draft' WHERE publication_status = 'published';
  ```
- **RLS Verification**:
  To confirm that anonymous users cannot see unpublished drafts, run in SQL editor with anon role:
  ```sql
  SET ROLE anon;
  SELECT * FROM public.portfolios WHERE publication_status = 'draft'; -- Must return 0 rows
  RESET ROLE;
  ```
- **Storage Issues**:
  If images fail to load, ensure the bucket is either public or files are accessed via `getPublicStorageUrl()` with proper folder permissions.
