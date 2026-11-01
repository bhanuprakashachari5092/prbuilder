-- =============================================================================
-- Migration: 20261024000011_admin_fixes_and_authoritative_rpcs.sql
-- Description: Production Admin Schema Hardening, Column Defense, and User Assets RPC
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Ensure public.profiles has full_name alias / generated column
-- Provides backward and query compatibility for display_name / full_name
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT GENERATED ALWAYS AS (display_name) STORED;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Performance Indexes for Admin Aggregations & User Lookups
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_resumes_user_created ON public.resumes (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_created ON public.portfolios (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles (display_name);

-- -----------------------------------------------------------------------------
-- 3. Production Authoritative get_admin_overview_stats() RPC
-- Uses display_name / full_name safely, calculates real aggregations,
-- and tracks downloads, templates, themes, funnel, and live activity stream.
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
  BEGIN
    SELECT COUNT(*) INTO v_resume_downloads FROM public.analytics_events WHERE event_type = 'resume_pdf_downloaded';
  EXCEPTION WHEN OTHERS THEN
    v_resume_downloads := 0;
  END;

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
  BEGIN
    SELECT COUNT(*) INTO v_portfolio_zip_downloads FROM public.analytics_events WHERE event_type = 'portfolio_zip_downloaded';
    SELECT COUNT(*) INTO v_portfolio_qr_downloads FROM public.analytics_events WHERE event_type = 'portfolio_qr_downloaded';
  EXCEPTION WHEN OTHERS THEN
    v_portfolio_zip_downloads := 0;
    v_portfolio_qr_downloads := 0;
  END;

  IF v_total_portfolios > 0 THEN
    v_portfolio_download_rate := LEAST(100, ROUND((v_portfolio_zip_downloads::numeric / v_total_portfolios::numeric) * 100));
  ELSE
    v_portfolio_download_rate := 0;
  END IF;

  -- 4. Downloads Aggregate Statistics
  v_total_downloads := v_resume_downloads + v_portfolio_zip_downloads + v_portfolio_qr_downloads;
  BEGIN
    SELECT COUNT(*) INTO v_downloads_today FROM public.analytics_events
      WHERE event_type IN ('resume_pdf_downloaded', 'portfolio_zip_downloaded', 'portfolio_qr_downloaded')
        AND created_at >= CURRENT_DATE;
    SELECT COUNT(*) INTO v_downloads_7d FROM public.analytics_events
      WHERE event_type IN ('resume_pdf_downloaded', 'portfolio_zip_downloaded', 'portfolio_qr_downloaded')
        AND created_at >= NOW() - INTERVAL '7 days';
  EXCEPTION WHEN OTHERS THEN
    v_downloads_today := 0;
    v_downloads_7d := 0;
  END;

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

  -- 6. Real Recent Activity Feed (Using display_name safely)
  WITH combined_events AS (
    -- Registered users
    SELECT
      p.id::text AS id,
      'signup'::text AS type,
      COALESCE(NULLIF(p.display_name, ''), 'New Student') AS user_name,
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
      COALESCE(NULLIF(p.display_name, ''), ae.metadata->>'title', 'Active Student') AS user_name,
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
      COALESCE(NULLIF(p.display_name, ''), 'Active Student') AS user_name,
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
-- 4. Admin User Assets RPC
-- Securely retrieves an individual user's resume and portfolio records for admin inspection
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_user_assets(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_resumes JSONB;
  v_portfolios JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'title', r.title,
      'template', r.selected_template,
      'createdAt', r.created_at,
      'updatedAt', r.updated_at
    ) ORDER BY r.created_at DESC
  ), '[]'::jsonb) INTO v_resumes
  FROM public.resumes r
  WHERE r.user_id = p_user_id;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'title', p.title,
      'slug', p.slug,
      'theme', p.theme,
      'status', p.publication_status,
      'publishedAt', p.published_at,
      'createdAt', p.created_at,
      'updatedAt', p.updated_at
    ) ORDER BY p.created_at DESC
  ), '[]'::jsonb) INTO v_portfolios
  FROM public.portfolios p
  WHERE p.user_id = p_user_id;

  RETURN jsonb_build_object(
    'resumes', v_resumes,
    'portfolios', v_portfolios
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_user_assets(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. Enhanced get_admin_portfolios() RPC with Real portfolio_data & Appearance
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_portfolios(
  p_search TEXT DEFAULT NULL,
  p_status_filter TEXT DEFAULT NULL,
  p_theme_filter TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_dir TEXT DEFAULT 'desc',
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_offset INT;
  v_limit INT;
  v_total BIGINT;
  v_items JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  v_limit := GREATEST(1, LEAST(100, COALESCE(p_page_size, 15)));
  v_offset := (GREATEST(1, COALESCE(p_page, 1)) - 1) * v_limit;

  WITH filtered AS (
    SELECT
      po.id,
      po.user_id,
      po.title,
      po.slug,
      po.theme,
      po.publication_status,
      po.published_at,
      po.created_at,
      po.updated_at,
      po.portfolio_data,
      p.display_name AS owner_name,
      u.email AS owner_email,
      COALESCE(
        (SELECT COUNT(*) FROM public.projects pr WHERE pr.portfolio_id = po.id),
        jsonb_array_length(po.portfolio_data->'projects'),
        0
      ) AS project_count,
      (SELECT d.hostname FROM public.domains d WHERE d.portfolio_id = po.id AND d.connection_status = 'active' LIMIT 1) AS custom_hostname
    FROM public.portfolios po
    LEFT JOIN public.profiles p ON p.id = po.user_id
    LEFT JOIN auth.users u ON u.id = po.user_id
    WHERE (
      p_search IS NULL
      OR p_search = ''
      OR po.title ILIKE '%' || p_search || '%'
      OR po.slug ILIKE '%' || p_search || '%'
      OR p.display_name ILIKE '%' || p_search || '%'
      OR u.email ILIKE '%' || p_search || '%'
    )
    AND (
      p_status_filter IS NULL
      OR p_status_filter = 'all'
      OR po.publication_status = p_status_filter
    )
    AND (
      p_theme_filter IS NULL
      OR p_theme_filter = 'all'
      OR po.theme = p_theme_filter
    )
  ),
  counted AS (
    SELECT COUNT(*) AS total FROM filtered
  )
  SELECT total INTO v_total FROM counted;

  WITH sorted AS (
    SELECT *
    FROM (
      SELECT
        po.id,
        po.user_id,
        po.title,
        po.slug,
        po.theme,
        po.publication_status,
        po.published_at,
        po.created_at,
        po.updated_at,
        po.portfolio_data,
        p.display_name AS owner_name,
        u.email AS owner_email,
        COALESCE(
          (SELECT COUNT(*) FROM public.projects pr WHERE pr.portfolio_id = po.id),
          jsonb_array_length(po.portfolio_data->'projects'),
          0
        ) AS project_count,
        (SELECT d.hostname FROM public.domains d WHERE d.portfolio_id = po.id AND d.connection_status = 'active' LIMIT 1) AS custom_hostname
      FROM public.portfolios po
      LEFT JOIN public.profiles p ON p.id = po.user_id
      LEFT JOIN auth.users u ON u.id = po.user_id
      WHERE (
        p_search IS NULL
        OR p_search = ''
        OR po.title ILIKE '%' || p_search || '%'
        OR po.slug ILIKE '%' || p_search || '%'
        OR p.display_name ILIKE '%' || p_search || '%'
        OR u.email ILIKE '%' || p_search || '%'
      )
      AND (
        p_status_filter IS NULL
        OR p_status_filter = 'all'
        OR po.publication_status = p_status_filter
      )
      AND (
        p_theme_filter IS NULL
        OR p_theme_filter = 'all'
        OR po.theme = p_theme_filter
      )
    ) sub
    ORDER BY
      CASE WHEN p_sort_by = 'title' AND p_sort_dir = 'asc' THEN sub.title END ASC,
      CASE WHEN p_sort_by = 'title' AND p_sort_dir = 'desc' THEN sub.title END DESC,
      CASE WHEN p_sort_by = 'owner' AND p_sort_dir = 'asc' THEN sub.owner_name END ASC,
      CASE WHEN p_sort_by = 'owner' AND p_sort_dir = 'desc' THEN sub.owner_name END DESC,
      CASE WHEN p_sort_by = 'status' AND p_sort_dir = 'asc' THEN sub.publication_status END ASC,
      CASE WHEN p_sort_by = 'status' AND p_sort_dir = 'desc' THEN sub.publication_status END DESC,
      CASE WHEN p_sort_by = 'published_at' AND p_sort_dir = 'asc' THEN sub.published_at END ASC,
      CASE WHEN p_sort_by = 'published_at' AND p_sort_dir = 'desc' THEN sub.published_at END DESC,
      CASE WHEN (p_sort_by = 'created_at' OR p_sort_by IS NULL) AND p_sort_dir = 'asc' THEN sub.created_at END ASC,
      CASE WHEN (p_sort_by = 'created_at' OR p_sort_by IS NULL) AND (p_sort_dir = 'desc' OR p_sort_dir IS NULL) THEN sub.created_at END DESC
    LIMIT v_limit OFFSET v_offset
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'userId', s.user_id,
      'title', s.title,
      'slug', s.slug,
      'theme', s.theme,
      'publicationStatus', s.publication_status,
      'publishedAt', s.published_at,
      'ownerName', COALESCE(NULLIF(s.owner_name, ''), 'Student Member'),
      'ownerEmail', COALESCE(s.owner_email, 'private@workspace.internal'),
      'projectCount', s.project_count,
      'customHostname', s.custom_hostname,
      'portfolioData', s.portfolio_data,
      'createdAt', s.created_at,
      'updatedAt', s.updated_at
    )
  ) INTO v_items
  FROM sorted s;

  RETURN jsonb_build_object(
    'items', COALESCE(v_items, '[]'::jsonb),
    'total', COALESCE(v_total, 0),
    'page', GREATEST(1, COALESCE(p_page, 1)),
    'pageSize', v_limit,
    'totalPages', CEIL(COALESCE(v_total, 0)::numeric / v_limit)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_portfolios(TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT) TO authenticated;
