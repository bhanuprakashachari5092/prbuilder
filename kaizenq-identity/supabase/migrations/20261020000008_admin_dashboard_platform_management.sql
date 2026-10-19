-- =============================================================================
-- Migration: 20261020000008_admin_dashboard_platform_management.sql
-- Description: Production Admin Dashboard, Audit Logs, and Platform Management RPCs
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Privilege Escalation Prevention on Profiles
-- Ensures ordinary users cannot elevate themselves by setting is_admin = true
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_profile_admin_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: only active administrators can modify admin privileges.'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_admin ON public.profiles;
CREATE TRIGGER trg_protect_profile_admin
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_admin_update();

-- -----------------------------------------------------------------------------
-- 2. Admin Audit Logs Table
-- Immutable audit log recording administrative actions across the platform
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT,
  action TEXT NOT NULL,
  target_id TEXT,
  target_type TEXT NOT NULL,
  outcome TEXT NOT NULL DEFAULT 'success' CHECK (outcome IN ('success', 'failure', 'denied')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes for administrative audit trails
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON public.admin_audit_logs (target_type, target_id);

-- Performance indexes on core entity timestamps
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON public.resumes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resumes_updated_at ON public.resumes (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolios_created_at ON public.portfolios (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolios_updated_at ON public.portfolios (updated_at DESC);

-- Enable RLS on audit logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_audit_logs_select" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_logs_select"
  ON public.admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_audit_logs_insert" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_logs_insert"
  ON public.admin_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Deny updates and deletes to preserve append-only audit trail integrity
DROP POLICY IF EXISTS "admin_audit_logs_no_update" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "admin_audit_logs_no_delete" ON public.admin_audit_logs;

-- -----------------------------------------------------------------------------
-- 3. Audit Log Helper RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_log_action(
  p_action TEXT,
  p_target_id TEXT,
  p_target_type TEXT,
  p_outcome TEXT DEFAULT 'success',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_log_id UUID;
  v_admin_email TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  SELECT email INTO v_admin_email FROM auth.users WHERE id = auth.uid();

  INSERT INTO public.admin_audit_logs (
    admin_id,
    admin_email,
    action,
    target_id,
    target_type,
    outcome,
    metadata
  ) VALUES (
    auth.uid(),
    v_admin_email,
    p_action,
    p_target_id,
    p_target_type,
    p_outcome,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_log_action(TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. Overview Platform Statistics RPC
-- Computes real aggregated database statistics and period comparisons
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_overview_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total_users BIGINT;
  v_new_users_today BIGINT;
  v_new_users_7d BIGINT;
  v_new_users_prev_7d BIGINT;
  v_new_users_30d BIGINT;
  v_new_users_prev_30d BIGINT;
  v_active_users_30d BIGINT;
  v_active_users_prev_30d BIGINT;

  v_total_resumes BIGINT;
  v_resumes_7d BIGINT;
  v_resumes_prev_7d BIGINT;

  v_total_portfolios BIGINT;
  v_portfolios_7d BIGINT;
  v_portfolios_prev_7d BIGINT;
  v_published_portfolios BIGINT;
  v_draft_portfolios BIGINT;

  v_unique_resume_creators BIGINT;
  v_unique_portfolio_creators BIGINT;

  v_users_with_both BIGINT;
  v_users_resumes_only BIGINT;
  v_users_portfolios_only BIGINT;
  v_users_neither BIGINT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  -- 1. User metrics
  SELECT COUNT(*) INTO v_total_users FROM public.profiles;
  SELECT COUNT(*) INTO v_new_users_today FROM public.profiles WHERE created_at >= CURRENT_DATE;
  SELECT COUNT(*) INTO v_new_users_7d FROM public.profiles WHERE created_at >= NOW() - INTERVAL '7 days';
  SELECT COUNT(*) INTO v_new_users_prev_7d FROM public.profiles WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days';
  SELECT COUNT(*) INTO v_new_users_30d FROM public.profiles WHERE created_at >= NOW() - INTERVAL '30 days';
  SELECT COUNT(*) INTO v_new_users_prev_30d FROM public.profiles WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days';

  -- Active users window: users with any profile update, resume update, or portfolio update in 30 days
  SELECT COUNT(DISTINCT u.id) INTO v_active_users_30d
  FROM public.profiles u
  WHERE u.updated_at >= NOW() - INTERVAL '30 days'
     OR EXISTS (SELECT 1 FROM public.resumes r WHERE r.user_id = u.id AND r.updated_at >= NOW() - INTERVAL '30 days')
     OR EXISTS (SELECT 1 FROM public.portfolios p WHERE p.user_id = u.id AND p.updated_at >= NOW() - INTERVAL '30 days');

  SELECT COUNT(DISTINCT u.id) INTO v_active_users_prev_30d
  FROM public.profiles u
  WHERE (u.updated_at >= NOW() - INTERVAL '60 days' AND u.updated_at < NOW() - INTERVAL '30 days')
     OR EXISTS (SELECT 1 FROM public.resumes r WHERE r.user_id = u.id AND r.updated_at >= NOW() - INTERVAL '60 days' AND r.updated_at < NOW() - INTERVAL '30 days')
     OR EXISTS (SELECT 1 FROM public.portfolios p WHERE p.user_id = u.id AND p.updated_at >= NOW() - INTERVAL '60 days' AND p.updated_at < NOW() - INTERVAL '30 days');

  -- 2. Resume metrics
  SELECT COUNT(*) INTO v_total_resumes FROM public.resumes;
  SELECT COUNT(*) INTO v_resumes_7d FROM public.resumes WHERE created_at >= NOW() - INTERVAL '7 days';
  SELECT COUNT(*) INTO v_resumes_prev_7d FROM public.resumes WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days';
  SELECT COUNT(DISTINCT user_id) INTO v_unique_resume_creators FROM public.resumes;

  -- 3. Portfolio metrics
  SELECT COUNT(*) INTO v_total_portfolios FROM public.portfolios;
  SELECT COUNT(*) INTO v_portfolios_7d FROM public.portfolios WHERE created_at >= NOW() - INTERVAL '7 days';
  SELECT COUNT(*) INTO v_portfolios_prev_7d FROM public.portfolios WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days';
  SELECT COUNT(*) INTO v_published_portfolios FROM public.portfolios WHERE publication_status = 'published';
  SELECT COUNT(*) INTO v_draft_portfolios FROM public.portfolios WHERE publication_status = 'draft';
  SELECT COUNT(DISTINCT user_id) INTO v_unique_portfolio_creators FROM public.portfolios;

  -- 4. User engagement breakdown (unique combinations)
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
      'uniqueCreators', v_unique_resume_creators
    ),
    'portfolios', jsonb_build_object(
      'total', v_total_portfolios,
      'last7Days', v_portfolios_7d,
      'prev7Days', v_portfolios_prev_7d,
      'published', v_published_portfolios,
      'draft', v_draft_portfolios,
      'uniqueCreators', v_unique_portfolio_creators
    ),
    'engagement', jsonb_build_object(
      'usersWithBoth', v_users_with_both,
      'usersResumesOnly', v_users_resumes_only,
      'usersPortfoliosOnly', v_users_portfolios_only,
      'usersNeither', v_users_neither
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_overview_stats() TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. Time-Series Growth Analytics RPC
-- Returns day-by-day real counts for the specified historical window (e.g., 7, 30, 90, 365 days)
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
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', ds.day,
      'newUsers', COALESCE(uc.count, 0),
      'resumesCreated', COALESCE(rc.count, 0),
      'portfoliosCreated', COALESCE(pc.total_count, 0),
      'publishedPortfolios', COALESCE(pc.published_count, 0),
      'draftPortfolios', COALESCE(pc.draft_count, 0)
    ) ORDER BY ds.day ASC
  ) INTO v_result
  FROM date_series ds
  LEFT JOIN user_counts uc ON uc.day = ds.day
  LEFT JOIN resume_counts rc ON rc.day = ds.day
  LEFT JOIN portfolio_counts pc ON pc.day = ds.day;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_growth_analytics(INT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. User Directory Management RPC
-- Paginated, searchable list of users with creation counts and activity
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_users(
  p_search TEXT DEFAULT NULL,
  p_role_filter TEXT DEFAULT NULL,
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

  WITH user_base AS (
    SELECT
      p.id,
      p.display_name,
      p.headline,
      p.avatar_path,
      p.is_admin,
      p.created_at,
      p.updated_at,
      u.email,
      u.last_sign_in_at,
      (SELECT COUNT(*) FROM public.resumes r WHERE r.user_id = p.id) AS resume_count,
      (SELECT COUNT(*) FROM public.portfolios po WHERE po.user_id = p.id) AS portfolio_count,
      (SELECT COUNT(*) FROM public.portfolios po WHERE po.user_id = p.id AND po.publication_status = 'published') AS published_portfolio_count,
      GREATEST(
        p.updated_at,
        (SELECT MAX(r.updated_at) FROM public.resumes r WHERE r.user_id = p.id),
        (SELECT MAX(po.updated_at) FROM public.portfolios po WHERE po.user_id = p.id)
      ) AS last_activity
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE (
      p_search IS NULL
      OR p_search = ''
      OR p.display_name ILIKE '%' || p_search || '%'
      OR u.email ILIKE '%' || p_search || '%'
      OR p.headline ILIKE '%' || p_search || '%'
    )
    AND (
      p_role_filter IS NULL
      OR p_role_filter = 'all'
      OR (p_role_filter = 'admin' AND p.is_admin = TRUE)
      OR (p_role_filter = 'user' AND p.is_admin = FALSE)
    )
  ),
  counted AS (
    SELECT COUNT(*) AS total FROM user_base
  )
  SELECT total INTO v_total FROM counted;

  WITH sorted AS (
    SELECT *
    FROM (
      SELECT
        p.id,
        p.display_name,
        p.headline,
        p.avatar_path,
        p.is_admin,
        p.created_at,
        p.updated_at,
        u.email,
        u.last_sign_in_at,
        (SELECT COUNT(*) FROM public.resumes r WHERE r.user_id = p.id) AS resume_count,
        (SELECT COUNT(*) FROM public.portfolios po WHERE po.user_id = p.id) AS portfolio_count,
        (SELECT COUNT(*) FROM public.portfolios po WHERE po.user_id = p.id AND po.publication_status = 'published') AS published_portfolio_count,
        GREATEST(
          p.updated_at,
          (SELECT MAX(r.updated_at) FROM public.resumes r WHERE r.user_id = p.id),
          (SELECT MAX(po.updated_at) FROM public.portfolios po WHERE po.user_id = p.id)
        ) AS last_activity
      FROM public.profiles p
      LEFT JOIN auth.users u ON u.id = p.id
      WHERE (
        p_search IS NULL
        OR p_search = ''
        OR p.display_name ILIKE '%' || p_search || '%'
        OR u.email ILIKE '%' || p_search || '%'
        OR p.headline ILIKE '%' || p_search || '%'
      )
      AND (
        p_role_filter IS NULL
        OR p_role_filter = 'all'
        OR (p_role_filter = 'admin' AND p.is_admin = TRUE)
        OR (p_role_filter = 'user' AND p.is_admin = FALSE)
      )
    ) sub
    ORDER BY
      CASE WHEN p_sort_by = 'name' AND p_sort_dir = 'asc' THEN sub.display_name END ASC,
      CASE WHEN p_sort_by = 'name' AND p_sort_dir = 'desc' THEN sub.display_name END DESC,
      CASE WHEN p_sort_by = 'email' AND p_sort_dir = 'asc' THEN sub.email END ASC,
      CASE WHEN p_sort_by = 'email' AND p_sort_dir = 'desc' THEN sub.email END DESC,
      CASE WHEN p_sort_by = 'resumes' AND p_sort_dir = 'asc' THEN sub.resume_count END ASC,
      CASE WHEN p_sort_by = 'resumes' AND p_sort_dir = 'desc' THEN sub.resume_count END DESC,
      CASE WHEN p_sort_by = 'portfolios' AND p_sort_dir = 'asc' THEN sub.portfolio_count END ASC,
      CASE WHEN p_sort_by = 'portfolios' AND p_sort_dir = 'desc' THEN sub.portfolio_count END DESC,
      CASE WHEN p_sort_by = 'activity' AND p_sort_dir = 'asc' THEN sub.last_activity END ASC,
      CASE WHEN p_sort_by = 'activity' AND p_sort_dir = 'desc' THEN sub.last_activity END DESC,
      CASE WHEN (p_sort_by = 'created_at' OR p_sort_by IS NULL) AND p_sort_dir = 'asc' THEN sub.created_at END ASC,
      CASE WHEN (p_sort_by = 'created_at' OR p_sort_by IS NULL) AND (p_sort_dir = 'desc' OR p_sort_dir IS NULL) THEN sub.created_at END DESC
    LIMIT v_limit OFFSET v_offset
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'displayName', COALESCE(NULLIF(s.display_name, ''), 'Student Member'),
      'email', COALESCE(s.email, 'private@workspace.internal'),
      'headline', s.headline,
      'avatarPath', s.avatar_path,
      'isAdmin', s.is_admin,
      'createdAt', s.created_at,
      'updatedAt', s.updated_at,
      'lastSignInAt', s.last_sign_in_at,
      'resumeCount', s.resume_count,
      'portfolioCount', s.portfolio_count,
      'publishedPortfolioCount', s.published_portfolio_count,
      'lastActivity', s.last_activity
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

GRANT EXECUTE ON FUNCTION public.get_admin_users(TEXT, TEXT, TEXT, TEXT, INT, INT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 7. Resume Management RPC
-- Paginated list of resumes with owner metadata and section counts
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_resumes(
  p_search TEXT DEFAULT NULL,
  p_template_filter TEXT DEFAULT NULL,
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
      r.id,
      r.user_id,
      r.title,
      r.selected_template,
      r.created_at,
      r.updated_at,
      p.display_name AS owner_name,
      u.email AS owner_email,
      -- Safely compute section count from resume_data keys without returning private text
      (
        CASE WHEN r.resume_data ? 'experience' AND jsonb_array_length(r.resume_data->'experience') > 0 THEN 1 ELSE 0 END +
        CASE WHEN r.resume_data ? 'education' AND jsonb_array_length(r.resume_data->'education') > 0 THEN 1 ELSE 0 END +
        CASE WHEN r.resume_data ? 'skills' AND jsonb_array_length(r.resume_data->'skills') > 0 THEN 1 ELSE 0 END +
        CASE WHEN r.resume_data ? 'projects' AND jsonb_array_length(r.resume_data->'projects') > 0 THEN 1 ELSE 0 END +
        CASE WHEN r.resume_data ? 'certifications' AND jsonb_array_length(r.resume_data->'certifications') > 0 THEN 1 ELSE 0 END
      ) AS section_count
    FROM public.resumes r
    LEFT JOIN public.profiles p ON p.id = r.user_id
    LEFT JOIN auth.users u ON u.id = r.user_id
    WHERE (
      p_search IS NULL
      OR p_search = ''
      OR r.title ILIKE '%' || p_search || '%'
      OR p.display_name ILIKE '%' || p_search || '%'
      OR u.email ILIKE '%' || p_search || '%'
    )
    AND (
      p_template_filter IS NULL
      OR p_template_filter = 'all'
      OR r.selected_template = p_template_filter
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
        r.id,
        r.user_id,
        r.title,
        r.selected_template,
        r.created_at,
        r.updated_at,
        p.display_name AS owner_name,
        u.email AS owner_email,
        (
          CASE WHEN r.resume_data ? 'experience' AND jsonb_array_length(r.resume_data->'experience') > 0 THEN 1 ELSE 0 END +
          CASE WHEN r.resume_data ? 'education' AND jsonb_array_length(r.resume_data->'education') > 0 THEN 1 ELSE 0 END +
          CASE WHEN r.resume_data ? 'skills' AND jsonb_array_length(r.resume_data->'skills') > 0 THEN 1 ELSE 0 END +
          CASE WHEN r.resume_data ? 'projects' AND jsonb_array_length(r.resume_data->'projects') > 0 THEN 1 ELSE 0 END +
          CASE WHEN r.resume_data ? 'certifications' AND jsonb_array_length(r.resume_data->'certifications') > 0 THEN 1 ELSE 0 END
        ) AS section_count
      FROM public.resumes r
      LEFT JOIN public.profiles p ON p.id = r.user_id
      LEFT JOIN auth.users u ON u.id = r.user_id
      WHERE (
        p_search IS NULL
        OR p_search = ''
        OR r.title ILIKE '%' || p_search || '%'
        OR p.display_name ILIKE '%' || p_search || '%'
        OR u.email ILIKE '%' || p_search || '%'
      )
      AND (
        p_template_filter IS NULL
        OR p_template_filter = 'all'
        OR r.selected_template = p_template_filter
      )
    ) sub
    ORDER BY
      CASE WHEN p_sort_by = 'title' AND p_sort_dir = 'asc' THEN sub.title END ASC,
      CASE WHEN p_sort_by = 'title' AND p_sort_dir = 'desc' THEN sub.title END DESC,
      CASE WHEN p_sort_by = 'owner' AND p_sort_dir = 'asc' THEN sub.owner_name END ASC,
      CASE WHEN p_sort_by = 'owner' AND p_sort_dir = 'desc' THEN sub.owner_name END DESC,
      CASE WHEN p_sort_by = 'template' AND p_sort_dir = 'asc' THEN sub.selected_template END ASC,
      CASE WHEN p_sort_by = 'template' AND p_sort_dir = 'desc' THEN sub.selected_template END DESC,
      CASE WHEN p_sort_by = 'updated_at' AND p_sort_dir = 'asc' THEN sub.updated_at END ASC,
      CASE WHEN p_sort_by = 'updated_at' AND p_sort_dir = 'desc' THEN sub.updated_at END DESC,
      CASE WHEN (p_sort_by = 'created_at' OR p_sort_by IS NULL) AND p_sort_dir = 'asc' THEN sub.created_at END ASC,
      CASE WHEN (p_sort_by = 'created_at' OR p_sort_by IS NULL) AND (p_sort_dir = 'desc' OR p_sort_dir IS NULL) THEN sub.created_at END DESC
    LIMIT v_limit OFFSET v_offset
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'userId', s.user_id,
      'title', s.title,
      'selectedTemplate', s.selected_template,
      'ownerName', COALESCE(NULLIF(s.owner_name, ''), 'Student Member'),
      'ownerEmail', COALESCE(s.owner_email, 'private@workspace.internal'),
      'sectionCount', s.section_count,
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

GRANT EXECUTE ON FUNCTION public.get_admin_resumes(TEXT, TEXT, TEXT, TEXT, INT, INT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 8. Portfolio Management RPC
-- Paginated list of portfolios with publication status, slug, and project count
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
      p.display_name AS owner_name,
      u.email AS owner_email,
      (SELECT COUNT(*) FROM public.projects pr WHERE pr.portfolio_id = po.id) AS project_count,
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
        p.display_name AS owner_name,
        u.email AS owner_email,
        (SELECT COUNT(*) FROM public.projects pr WHERE pr.portfolio_id = po.id) AS project_count,
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

-- -----------------------------------------------------------------------------
-- 9. Audit Logs Directory RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_audit_logs(
  p_search TEXT DEFAULT NULL,
  p_action_filter TEXT DEFAULT NULL,
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
      l.id,
      l.admin_id,
      l.admin_email,
      l.action,
      l.target_id,
      l.target_type,
      l.outcome,
      l.metadata,
      l.created_at,
      p.display_name AS admin_name
    FROM public.admin_audit_logs l
    LEFT JOIN public.profiles p ON p.id = l.admin_id
    WHERE (
      p_search IS NULL
      OR p_search = ''
      OR l.action ILIKE '%' || p_search || '%'
      OR l.target_id ILIKE '%' || p_search || '%'
      OR l.target_type ILIKE '%' || p_search || '%'
      OR l.admin_email ILIKE '%' || p_search || '%'
      OR p.display_name ILIKE '%' || p_search || '%'
    )
    AND (
      p_action_filter IS NULL
      OR p_action_filter = 'all'
      OR l.action = p_action_filter
    )
  ),
  counted AS (
    SELECT COUNT(*) AS total FROM filtered
  )
  SELECT total INTO v_total FROM counted;

  WITH sorted AS (
    SELECT
      l.id,
      l.admin_id,
      l.admin_email,
      l.action,
      l.target_id,
      l.target_type,
      l.outcome,
      l.metadata,
      l.created_at,
      p.display_name AS admin_name
    FROM public.admin_audit_logs l
    LEFT JOIN public.profiles p ON p.id = l.admin_id
    WHERE (
      p_search IS NULL
      OR p_search = ''
      OR l.action ILIKE '%' || p_search || '%'
      OR l.target_id ILIKE '%' || p_search || '%'
      OR l.target_type ILIKE '%' || p_search || '%'
      OR l.admin_email ILIKE '%' || p_search || '%'
      OR p.display_name ILIKE '%' || p_search || '%'
    )
    AND (
      p_action_filter IS NULL
      OR p_action_filter = 'all'
      OR l.action = p_action_filter
    )
    ORDER BY l.created_at DESC
    LIMIT v_limit OFFSET v_offset
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'adminId', s.admin_id,
      'adminEmail', s.admin_email,
      'adminName', COALESCE(NULLIF(s.admin_name, ''), 'Platform Admin'),
      'action', s.action,
      'targetId', s.target_id,
      'targetType', s.target_type,
      'outcome', s.outcome,
      'metadata', s.metadata,
      'createdAt', s.created_at
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

GRANT EXECUTE ON FUNCTION public.get_admin_audit_logs(TEXT, TEXT, INT, INT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 10. Privileged Admin Operations (Protected with Audit Trails)
-- -----------------------------------------------------------------------------

-- Delete resume with required authorization and audit logging
CREATE OR REPLACE FUNCTION public.admin_delete_resume(
  p_resume_id UUID,
  p_reason TEXT DEFAULT 'Administrative deletion'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_title TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  SELECT user_id, title INTO v_user_id, v_title
  FROM public.resumes
  WHERE id = p_resume_id;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Resume not found');
  END IF;

  DELETE FROM public.resumes WHERE id = p_resume_id;

  PERFORM public.admin_log_action(
    'resume_deleted',
    p_resume_id::text,
    'resume',
    'success',
    jsonb_build_object(
      'userId', v_user_id,
      'title', v_title,
      'reason', p_reason
    )
  );

  RETURN jsonb_build_object('success', TRUE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_resume(UUID, TEXT) TO authenticated;

-- Unpublish portfolio with required authorization and audit logging
CREATE OR REPLACE FUNCTION public.admin_unpublish_portfolio(
  p_portfolio_id UUID,
  p_reason TEXT DEFAULT 'Administrative unpublish'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_slug TEXT;
  v_title TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  SELECT user_id, slug, title INTO v_user_id, v_slug, v_title
  FROM public.portfolios
  WHERE id = p_portfolio_id;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Portfolio not found');
  END IF;

  UPDATE public.portfolios
  SET publication_status = 'draft',
      updated_at = NOW()
  WHERE id = p_portfolio_id;

  -- Record in publication events
  INSERT INTO public.publication_events (portfolio_id, user_id, event_type, metadata)
  VALUES (
    p_portfolio_id,
    v_user_id,
    'unpublished',
    jsonb_build_object('reason', p_reason, 'revoked_by', 'admin')
  );

  PERFORM public.admin_log_action(
    'portfolio_unpublished',
    p_portfolio_id::text,
    'portfolio',
    'success',
    jsonb_build_object(
      'userId', v_user_id,
      'slug', v_slug,
      'title', v_title,
      'reason', p_reason
    )
  );

  RETURN jsonb_build_object('success', TRUE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_unpublish_portfolio(UUID, TEXT) TO authenticated;

-- Delete portfolio with required authorization and audit logging
CREATE OR REPLACE FUNCTION public.admin_delete_portfolio(
  p_portfolio_id UUID,
  p_reason TEXT DEFAULT 'Administrative deletion'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_slug TEXT;
  v_title TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  SELECT user_id, slug, title INTO v_user_id, v_slug, v_title
  FROM public.portfolios
  WHERE id = p_portfolio_id;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Portfolio not found');
  END IF;

  DELETE FROM public.portfolios WHERE id = p_portfolio_id;

  PERFORM public.admin_log_action(
    'portfolio_deleted',
    p_portfolio_id::text,
    'portfolio',
    'success',
    jsonb_build_object(
      'userId', v_user_id,
      'slug', v_slug,
      'title', v_title,
      'reason', p_reason
    )
  );

  RETURN jsonb_build_object('success', TRUE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_portfolio(UUID, TEXT) TO authenticated;

-- Update user role with authorization and audit logging
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  p_user_id UUID,
  p_is_admin BOOLEAN,
  p_reason TEXT DEFAULT 'Role update by administrator'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_old_status BOOLEAN;
  v_email TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  SELECT is_admin INTO v_old_status FROM public.profiles WHERE id = p_user_id;
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;

  IF v_old_status IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'User profile not found');
  END IF;

  UPDATE public.profiles
  SET is_admin = p_is_admin,
      updated_at = NOW()
  WHERE id = p_user_id;

  PERFORM public.admin_log_action(
    'user_role_updated',
    p_user_id::text,
    'user',
    'success',
    jsonb_build_object(
      'email', v_email,
      'previousAdmin', v_old_status,
      'newAdmin', p_is_admin,
      'reason', p_reason
    )
  );

  RETURN jsonb_build_object('success', TRUE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_user_role(UUID, BOOLEAN, TEXT) TO authenticated;
