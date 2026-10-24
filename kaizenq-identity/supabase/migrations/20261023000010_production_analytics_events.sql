-- =============================================================================
-- Migration: 20261023000010_production_analytics_events.sql
-- Description: Production-Ready Analytics Events Telemetry & Authoritative Admin Aggregations
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Analytics Events Telemetry Table
-- Immutable event stream tracking real user actions (downloads, exports, views, creations)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'user_registered',
      'resume_created',
      'resume_updated',
      'resume_deleted',
      'resume_pdf_downloaded',
      'portfolio_created',
      'portfolio_published',
      'portfolio_unpublished',
      'portfolio_zip_downloaded',
      'portfolio_qr_downloaded',
      'portfolio_viewed'
    )
  ),
  target_id TEXT,
  target_type TEXT NOT NULL DEFAULT 'asset',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning fast aggregations and time-series queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events (user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created ON public.analytics_events (event_type, created_at DESC);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated and anon users to insert legitimate event telemetry
DROP POLICY IF EXISTS "analytics_events_insert_all" ON public.analytics_events;
CREATE POLICY "analytics_events_insert_all"
  ON public.analytics_events
  FOR INSERT
  TO public
  WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );

-- Only verified administrators can read aggregate analytics event logs
DROP POLICY IF EXISTS "analytics_events_select_admin" ON public.analytics_events;
CREATE POLICY "analytics_events_select_admin"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Deny UPDATE and DELETE to guarantee immutable telemetry audit trails
DROP POLICY IF EXISTS "analytics_events_no_update" ON public.analytics_events;
CREATE POLICY "analytics_events_no_update"
  ON public.analytics_events
  FOR UPDATE
  TO public
  USING (false);

DROP POLICY IF EXISTS "analytics_events_no_delete" ON public.analytics_events;
CREATE POLICY "analytics_events_no_delete"
  ON public.analytics_events
  FOR DELETE
  TO public
  USING (false);

-- -----------------------------------------------------------------------------
-- 2. Helper RPC for Safe Event Recording
-- Sanitizes incoming event data and enforces security checks
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_analytics_event(
  p_event_type TEXT,
  p_target_id TEXT DEFAULT NULL,
  p_target_type TEXT DEFAULT 'asset',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event_id UUID;
  v_caller_id UUID;
  v_clean_metadata JSONB;
BEGIN
  v_caller_id := auth.uid();

  -- Cleanse metadata: exclude sensitive credentials, tokens, or large text dumps
  v_clean_metadata := COALESCE(p_metadata, '{}'::jsonb)
    - 'password'
    - 'token'
    - 'resume_data'
    - 'portfolio_data'
    - 'secret';

  INSERT INTO public.analytics_events (
    user_id,
    event_type,
    target_id,
    target_type,
    metadata,
    created_at
  ) VALUES (
    v_caller_id,
    p_event_type,
    p_target_id,
    COALESCE(p_target_type, 'asset'),
    v_clean_metadata,
    NOW()
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_analytics_event(TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Production Authoritative get_admin_overview_stats() RPC
-- Returns zero-fabricated database statistics with real downloads, template
-- breakdown, theme breakdown, conversion funnel, and real activity feed.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_overview_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  -- User variables
  v_total_users BIGINT := 0;
  v_new_users_today BIGINT := 0;
  v_new_users_7d BIGINT := 0;
  v_new_users_prev_7d BIGINT := 0;
  v_new_users_30d BIGINT := 0;
  v_new_users_prev_30d BIGINT := 0;
  v_active_users_30d BIGINT := 0;
  v_active_users_prev_30d BIGINT := 0;

  -- Resume variables
  v_total_resumes BIGINT := 0;
  v_resumes_7d BIGINT := 0;
  v_resumes_prev_7d BIGINT := 0;
  v_unique_resume_creators BIGINT := 0;
  v_resume_downloads BIGINT := 0;
  v_resume_download_rate INT := 0;
  v_tpl_modern BIGINT := 0;
  v_tpl_classic BIGINT := 0;
  v_tpl_minimal BIGINT := 0;
  v_avg_sections NUMERIC := 0.0;

  -- Portfolio variables
  v_total_portfolios BIGINT := 0;
  v_portfolios_7d BIGINT := 0;
  v_portfolios_prev_7d BIGINT := 0;
  v_published_portfolios BIGINT := 0;
  v_draft_portfolios BIGINT := 0;
  v_unique_portfolio_creators BIGINT := 0;
  v_portfolio_zip_downloads BIGINT := 0;
  v_portfolio_qr_downloads BIGINT := 0;
  v_portfolio_download_rate INT := 0;
  v_theme_dev BIGINT := 0;
  v_theme_minimal BIGINT := 0;
  v_theme_creative BIGINT := 0;

  -- Download aggregate variables
  v_total_downloads BIGINT := 0;
  v_downloads_today BIGINT := 0;
  v_downloads_7d BIGINT := 0;

  -- Engagement variables
  v_users_with_both BIGINT := 0;
  v_users_resumes_only BIGINT := 0;
  v_users_portfolios_only BIGINT := 0;
  v_users_neither BIGINT := 0;
  v_conversion_rate INT := 0;

  -- Activity feed JSON
  v_recent_activity JSONB := '[]'::jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  -- 1. Real User Metrics from profiles
  SELECT COUNT(*) INTO v_total_users FROM public.profiles;
  SELECT COUNT(*) INTO v_new_users_today FROM public.profiles WHERE created_at >= CURRENT_DATE;
  SELECT COUNT(*) INTO v_new_users_7d FROM public.profiles WHERE created_at >= NOW() - INTERVAL '7 days';
  SELECT COUNT(*) INTO v_new_users_prev_7d FROM public.profiles WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days';
  SELECT COUNT(*) INTO v_new_users_30d FROM public.profiles WHERE created_at >= NOW() - INTERVAL '30 days';
  SELECT COUNT(*) INTO v_new_users_prev_30d FROM public.profiles WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days';

  -- Active users in 30 days window based on updates, creations, or events
  SELECT COUNT(DISTINCT u.id) INTO v_active_users_30d
  FROM public.profiles u
  WHERE u.updated_at >= NOW() - INTERVAL '30 days'
     OR EXISTS (SELECT 1 FROM public.resumes r WHERE r.user_id = u.id AND r.updated_at >= NOW() - INTERVAL '30 days')
     OR EXISTS (SELECT 1 FROM public.portfolios p WHERE p.user_id = u.id AND p.updated_at >= NOW() - INTERVAL '30 days')
     OR EXISTS (SELECT 1 FROM public.analytics_events ae WHERE ae.user_id = u.id AND ae.created_at >= NOW() - INTERVAL '30 days');

  SELECT COUNT(DISTINCT u.id) INTO v_active_users_prev_30d
  FROM public.profiles u
  WHERE (u.updated_at >= NOW() - INTERVAL '60 days' AND u.updated_at < NOW() - INTERVAL '30 days')
     OR EXISTS (SELECT 1 FROM public.resumes r WHERE r.user_id = u.id AND r.updated_at >= NOW() - INTERVAL '60 days' AND r.updated_at < NOW() - INTERVAL '30 days')
     OR EXISTS (SELECT 1 FROM public.portfolios p WHERE p.user_id = u.id AND p.updated_at >= NOW() - INTERVAL '60 days' AND p.updated_at < NOW() - INTERVAL '30 days')
     OR EXISTS (SELECT 1 FROM public.analytics_events ae WHERE ae.user_id = u.id AND ae.created_at >= NOW() - INTERVAL '60 days' AND ae.created_at < NOW() - INTERVAL '30 days');

  -- 2. Real Resume Metrics from resumes table
  SELECT COUNT(*) INTO v_total_resumes FROM public.resumes;
  SELECT COUNT(*) INTO v_resumes_7d FROM public.resumes WHERE created_at >= NOW() - INTERVAL '7 days';
  SELECT COUNT(*) INTO v_resumes_prev_7d FROM public.resumes WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days';
  SELECT COUNT(DISTINCT user_id) INTO v_unique_resume_creators FROM public.resumes;

  -- Resume Template Distribution from real records
  SELECT COUNT(*) INTO v_tpl_modern FROM public.resumes WHERE selected_template IN ('modern', 'modern-professional');
  SELECT COUNT(*) INTO v_tpl_classic FROM public.resumes WHERE selected_template IN ('classic', 'classic-ats');
  SELECT COUNT(*) INTO v_tpl_minimal FROM public.resumes WHERE selected_template IN ('minimal', 'technical');

  -- Real Download Counts for Resumes from analytics_events
  SELECT COUNT(*) INTO v_resume_downloads FROM public.analytics_events WHERE event_type = 'resume_pdf_downloaded';
  IF v_total_resumes > 0 THEN
    v_resume_download_rate := LEAST(100, ROUND((v_resume_downloads::numeric / v_total_resumes::numeric) * 100));
  ELSE
    v_resume_download_rate := 0;
  END IF;

  -- 3. Real Portfolio Metrics from portfolios table
  SELECT COUNT(*) INTO v_total_portfolios FROM public.portfolios;
  SELECT COUNT(*) INTO v_portfolios_7d FROM public.portfolios WHERE created_at >= NOW() - INTERVAL '7 days';
  SELECT COUNT(*) INTO v_portfolios_prev_7d FROM public.portfolios WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days';
  SELECT COUNT(*) INTO v_published_portfolios FROM public.portfolios WHERE publication_status = 'published';
  SELECT COUNT(*) INTO v_draft_portfolios FROM public.portfolios WHERE publication_status = 'draft';
  SELECT COUNT(DISTINCT user_id) INTO v_unique_portfolio_creators FROM public.portfolios;

  -- Portfolio Theme Distribution from real records
  SELECT COUNT(*) INTO v_theme_dev FROM public.portfolios WHERE theme IN ('developer', 'midnight');
  SELECT COUNT(*) INTO v_theme_minimal FROM public.portfolios WHERE theme = 'minimal';
  SELECT COUNT(*) INTO v_theme_creative FROM public.portfolios WHERE theme IN ('creative', 'modern');

  -- Real Download Counts for Portfolios from analytics_events
  SELECT COUNT(*) INTO v_portfolio_zip_downloads FROM public.analytics_events WHERE event_type = 'portfolio_zip_downloaded';
  SELECT COUNT(*) INTO v_portfolio_qr_downloads FROM public.analytics_events WHERE event_type = 'portfolio_qr_downloaded';
  IF v_total_portfolios > 0 THEN
    v_portfolio_download_rate := LEAST(100, ROUND((v_portfolio_zip_downloads::numeric / v_total_portfolios::numeric) * 100));
  ELSE
    v_portfolio_download_rate := 0;
  END IF;

  -- 4. Downloads Aggregate Statistics
  v_total_downloads := v_resume_downloads + v_portfolio_zip_downloads + v_portfolio_qr_downloads;
  SELECT COUNT(*) INTO v_downloads_today FROM public.analytics_events
    WHERE event_type IN ('resume_pdf_downloaded', 'portfolio_zip_downloaded', 'portfolio_qr_downloaded')
      AND created_at >= CURRENT_DATE;
  SELECT COUNT(*) INTO v_downloads_7d FROM public.analytics_events
    WHERE event_type IN ('resume_pdf_downloaded', 'portfolio_zip_downloaded', 'portfolio_qr_downloaded')
      AND created_at >= NOW() - INTERVAL '7 days';

  -- 5. User Engagement Breakdown
  SELECT COUNT(*) INTO v_users_with_both
  FROM public.profiles p
  WHERE EXISTS (SELECT 1 FROM public.resumes r WHERE r.user_id = p.id)
    AND EXISTS (SELECT 1 FROM public.portfolios po WHERE po.user_id = p.id);

  SELECT COUNT(*) INTO v_users_resumes_only
  FROM public.profiles p
  WHERE EXISTS (SELECT 1 FROM public.resumes r WHERE r.user_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM public.portfolios po WHERE po.user_id = p.id);

  SELECT COUNT(*) INTO v_users_portfolios_only
  FROM public.profiles p
  WHERE NOT EXISTS (SELECT 1 FROM public.resumes r WHERE r.user_id = p.id)
    AND EXISTS (SELECT 1 FROM public.portfolios po WHERE po.user_id = p.id);

  SELECT COUNT(*) INTO v_users_neither
  FROM public.profiles p
  WHERE NOT EXISTS (SELECT 1 FROM public.resumes r WHERE r.user_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM public.portfolios po WHERE po.user_id = p.id);

  IF v_total_users > 0 THEN
    v_conversion_rate := ROUND(((v_users_with_both + v_users_resumes_only + v_users_portfolios_only)::numeric / v_total_users::numeric) * 100);
  ELSE
    v_conversion_rate := 0;
  END IF;

  -- 6. Real Recent Activity Feed (authoritative event stream)
  WITH combined_events AS (
    -- Registered users
    SELECT
      p.id::text AS id,
      'signup'::text AS type,
      COALESCE(p.full_name, 'New Student') AS user_name,
      COALESCE(u.email, 'student@prbuilder.me') AS user_email,
      'Registered account & completed setup'::text AS details,
      p.created_at AS timestamp
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE p.created_at >= NOW() - INTERVAL '30 days'

    UNION ALL

    -- Resume downloads & ZIP downloads from analytics_events
    SELECT
      ae.id::text AS id,
      CASE
        WHEN ae.event_type = 'resume_pdf_downloaded' THEN 'resume_download'
        WHEN ae.event_type = 'portfolio_zip_downloaded' THEN 'portfolio_download'
        WHEN ae.event_type = 'portfolio_published' THEN 'portfolio_publish'
        WHEN ae.event_type = 'resume_created' THEN 'resume_create'
        WHEN ae.event_type = 'portfolio_created' THEN 'portfolio_create'
        ELSE ae.event_type
      END AS type,
      COALESCE(p.full_name, ae.metadata->>'title', 'Active Student') AS user_name,
      COALESCE(u.email, ae.metadata->>'ownerEmail', 'user@prbuilder.me') AS user_email,
      CASE
        WHEN ae.event_type = 'resume_pdf_downloaded' THEN 'Exported ATS-compliant Resume PDF'
        WHEN ae.event_type = 'portfolio_zip_downloaded' THEN 'Exported Offline Portfolio ZIP Website'
        WHEN ae.event_type = 'portfolio_qr_downloaded' THEN 'Generated Networking QR Card'
        WHEN ae.event_type = 'portfolio_published' THEN 'Published Live Portfolio to Public Web'
        WHEN ae.event_type = 'resume_created' THEN 'Created New ATS Resume Document'
        WHEN ae.event_type = 'portfolio_created' THEN 'Created New Web Portfolio Studio'
        ELSE 'Performed platform action'
      END AS details,
      ae.created_at AS timestamp
    FROM public.analytics_events ae
    LEFT JOIN public.profiles p ON p.id = ae.user_id
    LEFT JOIN auth.users u ON u.id = ae.user_id

    UNION ALL

    -- Publication events
    SELECT
      pe.id::text AS id,
      'portfolio_publish'::text AS type,
      COALESCE(p.full_name, 'Active Student') AS user_name,
      COALESCE(u.email, 'student@prbuilder.me') AS user_email,
      'Published live portfolio to ' || COALESCE(pe.metadata->>'slug', 'public') AS details,
      pe.created_at AS timestamp
    FROM public.publication_events pe
    LEFT JOIN public.profiles p ON p.id = pe.user_id
    LEFT JOIN auth.users u ON u.id = pe.user_id
    WHERE pe.event_type = 'published'
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ce.id,
      'type', ce.type,
      'userName', ce.user_name,
      'userEmail', ce.user_email,
      'details', ce.details,
      'timestamp', ce.timestamp
    )
  ) INTO v_recent_activity
  FROM (
    SELECT * FROM combined_events
    ORDER BY timestamp DESC
    LIMIT 20
  ) ce;

  RETURN jsonb_build_object(
    'users', jsonb_build_object(
      'total', v_total_users,
      'today', v_new_users_today,
      'last7Days', v_new_users_7d,
      'prev7Days', v_new_users_prev_7d,
      'last30Days', v_new_users_30d,
      'prev30Days', v_new_users_prev_30d,
      'active30Days', v_active_users_30d,
      'prevActive30Days', v_active_users_prev_30d
    ),
    'resumes', jsonb_build_object(
      'total', v_total_resumes,
      'last7Days', v_resumes_7d,
      'prev7Days', v_resumes_prev_7d,
      'uniqueCreators', v_unique_resume_creators,
      'downloads', v_resume_downloads,
      'downloadRatePct', v_resume_download_rate,
      'templatesBreakdown', jsonb_build_object(
        'modern', v_tpl_modern,
        'classic', v_tpl_classic,
        'minimal', v_tpl_minimal
      )
    ),
    'portfolios', jsonb_build_object(
      'total', v_total_portfolios,
      'last7Days', v_portfolios_7d,
      'prev7Days', v_portfolios_prev_7d,
      'published', v_published_portfolios,
      'draft', v_draft_portfolios,
      'uniqueCreators', v_unique_portfolio_creators,
      'zipDownloads', v_portfolio_zip_downloads,
      'qrDownloads', v_portfolio_qr_downloads,
      'downloadRatePct', v_portfolio_download_rate,
      'themesBreakdown', jsonb_build_object(
        'developer', v_theme_dev,
        'minimal', v_theme_minimal,
        'creative', v_theme_creative
      )
    ),
    'downloads', jsonb_build_object(
      'totalDownloads', v_total_downloads,
      'resumePdfs', v_resume_downloads,
      'portfolioZips', v_portfolio_zip_downloads,
      'qrCards', v_portfolio_qr_downloads,
      'todayDownloads', v_downloads_today,
      'last7Days', v_downloads_7d
    ),
    'engagement', jsonb_build_object(
      'usersWithBoth', v_users_with_both,
      'usersResumesOnly', v_users_resumes_only,
      'usersPortfoliosOnly', v_users_portfolios_only,
      'usersNeither', v_users_neither,
      'conversionRate', v_conversion_rate
    ),
    'recentActivity', COALESCE(v_recent_activity, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_overview_stats() TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. Production Authoritative get_admin_growth_analytics(p_days) RPC
-- Real date-bucketed historical time-series with download tracking
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_growth_analytics(p_days INT DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_days INT;
  v_result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  v_days := GREATEST(1, LEAST(365, COALESCE(p_days, 30)));

  WITH date_series AS (
    SELECT generate_series(
      (CURRENT_DATE - (v_days - 1) * INTERVAL '1 day')::date,
      CURRENT_DATE,
      INTERVAL '1 day'
    )::date AS day
  ),
  user_counts AS (
    SELECT created_at::date AS day, COUNT(*) AS count
    FROM public.profiles
    WHERE created_at >= (CURRENT_DATE - (v_days - 1) * INTERVAL '1 day')
    GROUP BY created_at::date
  ),
  resume_counts AS (
    SELECT created_at::date AS day, COUNT(*) AS count
    FROM public.resumes
    WHERE created_at >= (CURRENT_DATE - (v_days - 1) * INTERVAL '1 day')
    GROUP BY created_at::date
  ),
  portfolio_counts AS (
    SELECT created_at::date AS day,
           COUNT(*) AS total_count,
           COUNT(*) FILTER (WHERE publication_status = 'published') AS published_count,
           COUNT(*) FILTER (WHERE publication_status = 'draft') AS draft_count
    FROM public.portfolios
    WHERE created_at >= (CURRENT_DATE - (v_days - 1) * INTERVAL '1 day')
    GROUP BY created_at::date
  ),
  resume_download_counts AS (
    SELECT created_at::date AS day, COUNT(*) AS count
    FROM public.analytics_events
    WHERE event_type = 'resume_pdf_downloaded'
      AND created_at >= (CURRENT_DATE - (v_days - 1) * INTERVAL '1 day')
    GROUP BY created_at::date
  ),
  portfolio_download_counts AS (
    SELECT created_at::date AS day, COUNT(*) AS count
    FROM public.analytics_events
    WHERE event_type = 'portfolio_zip_downloaded'
      AND created_at >= (CURRENT_DATE - (v_days - 1) * INTERVAL '1 day')
    GROUP BY created_at::date
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', ds.day,
      'newUsers', COALESCE(uc.count, 0),
      'resumesCreated', COALESCE(rc.count, 0),
      'portfoliosCreated', COALESCE(pc.total_count, 0),
      'publishedPortfolios', COALESCE(pc.published_count, 0),
      'draftPortfolios', COALESCE(pc.draft_count, 0),
      'resumeDownloads', COALESCE(rdc.count, 0),
      'portfolioDownloads', COALESCE(pdc.count, 0),
      'totalDownloads', COALESCE(rdc.count, 0) + COALESCE(pdc.count, 0)
    ) ORDER BY ds.day ASC
  ) INTO v_result
  FROM date_series ds
  LEFT JOIN user_counts uc ON uc.day = ds.day
  LEFT JOIN resume_counts rc ON rc.day = ds.day
  LEFT JOIN portfolio_counts pc ON pc.day = ds.day
  LEFT JOIN resume_download_counts rdc ON rdc.day = ds.day
  LEFT JOIN portfolio_download_counts pdc ON pdc.day = ds.day;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_growth_analytics(INT) TO authenticated;
