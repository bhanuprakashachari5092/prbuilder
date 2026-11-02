-- =============================================================================
-- Migration: 20261009000002_row_level_security.sql
-- Description: Strict Row Level Security Policies
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Profiles RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- 2. Portfolios RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- Owner can view all their portfolios (draft or published)
DROP POLICY IF EXISTS "portfolios_owner_select" ON public.portfolios;
CREATE POLICY "portfolios_owner_select"
  ON public.portfolios
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Public / Anonymous access to published portfolios ONLY
DROP POLICY IF EXISTS "portfolios_public_select_published" ON public.portfolios;
CREATE POLICY "portfolios_public_select_published"
  ON public.portfolios
  FOR SELECT
  TO anon, authenticated
  USING (publication_status = 'published');

-- Owner can insert new portfolio
DROP POLICY IF EXISTS "portfolios_owner_insert" ON public.portfolios;
CREATE POLICY "portfolios_owner_insert"
  ON public.portfolios
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Owner can update their own portfolio
DROP POLICY IF EXISTS "portfolios_owner_update" ON public.portfolios;
CREATE POLICY "portfolios_owner_update"
  ON public.portfolios
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owner can delete their own portfolio
DROP POLICY IF EXISTS "portfolios_owner_delete" ON public.portfolios;
CREATE POLICY "portfolios_owner_delete"
  ON public.portfolios
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 3. Resumes RLS (Strictly Private to Owner)
-- -----------------------------------------------------------------------------
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resumes_owner_select" ON public.resumes;
CREATE POLICY "resumes_owner_select"
  ON public.resumes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "resumes_owner_insert" ON public.resumes;
CREATE POLICY "resumes_owner_insert"
  ON public.resumes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "resumes_owner_update" ON public.resumes;
CREATE POLICY "resumes_owner_update"
  ON public.resumes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "resumes_owner_delete" ON public.resumes;
CREATE POLICY "resumes_owner_delete"
  ON public.resumes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. Projects RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_owner_all" ON public.projects;
CREATE POLICY "projects_owner_all"
  ON public.projects
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public can view projects belonging to an explicitly published portfolio
DROP POLICY IF EXISTS "projects_public_select_published" ON public.projects;
CREATE POLICY "projects_public_select_published"
  ON public.projects
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.portfolios p
      WHERE p.id = projects.portfolio_id
        AND p.publication_status = 'published'
    )
  );

-- -----------------------------------------------------------------------------
-- 5. Custom Domains RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "domains_owner_select" ON public.domains;
CREATE POLICY "domains_owner_select"
  ON public.domains
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "domains_owner_insert" ON public.domains;
CREATE POLICY "domains_owner_insert"
  ON public.domains
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "domains_owner_delete" ON public.domains;
CREATE POLICY "domains_owner_delete"
  ON public.domains
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 6. Publication Events RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.publication_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "publication_events_owner_select" ON public.publication_events;
CREATE POLICY "publication_events_owner_select"
  ON public.publication_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
