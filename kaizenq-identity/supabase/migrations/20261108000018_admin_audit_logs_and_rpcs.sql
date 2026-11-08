-- =============================================================================
-- Migration: 20261108000018_admin_audit_logs_and_rpcs.sql
-- Description: Self-contained migration creating public.admin_audit_logs,
--              indexes, RLS security policies, and administrative audit RPCs.
-- =============================================================================

-- 1. Ensure public.is_admin() helper function is defined
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    LOWER(auth.jwt() ->> 'email') = 'admin@gmail.com',
    LOWER(auth.jwt() ->> 'email') = 'bhanuprakashachari5092@gmail.com',
    FALSE
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- 2. Create public.admin_audit_logs table
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

-- 3. Performance indexes for audit trail searching and sorting
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON public.admin_audit_logs (target_type, target_id);

-- 4. Enable Row Level Security (RLS)
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

-- Deny destructive updates and deletes to preserve append-only immutability
DROP POLICY IF EXISTS "admin_audit_logs_no_update" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "admin_audit_logs_no_delete" ON public.admin_audit_logs;

-- 5. Audit Log Action Recording Helper RPC
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

-- 6. Full-Featured Search and Pagination RPC for Admin Audit Trail
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
