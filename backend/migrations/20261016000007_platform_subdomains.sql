-- =============================================================================
-- Migration: 20261016000007_platform_subdomains.sql
-- Description: Platform Subdomain Validation, Availability Check & Publishing Sync
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enhanced Helper Function: Slug & Subdomain Validation
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_portfolio_slug(p_slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clean TEXT;
BEGIN
  IF p_slug IS NULL THEN
    RETURN FALSE;
  END IF;

  v_clean := LOWER(TRIM(p_slug));

  -- Length constraints (between 3 and 48 characters)
  IF LENGTH(v_clean) < 3 OR LENGTH(v_clean) > 48 THEN
    RETURN FALSE;
  END IF;

  -- Regex check: only lowercase letters, numbers, and hyphens (no consecutive hyphens, no leading/trailing)
  IF NOT v_clean ~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RETURN FALSE;
  END IF;

  -- Comprehensive reserved system hostnames and route paths check
  IF v_clean IN (
    'admin', 'dashboard', 'auth', 'api', 'login', 'signup',
    'settings', 'portfolio', 'resume', 'p', 'terms', 'privacy',
    'public', 'status', 'publish', 'account', 'verify', 'help',
    'support', 'www', 'app', 'identity', 'mail', 'email', 'cname',
    'docs', 'cdn', 'prbuilder', 'kaizenq', 'root', 'dns', 'ssl',
    'test', 'dev', 'stage', 'staging', 'static', 'assets', 'media',
    'billing', 'checkout', 'webhook', 'webhooks', 'portal'
  ) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2. Slug & Subdomain Availability Check RPC Function
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_subdomain_availability(
  p_slug TEXT,
  p_portfolio_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_normalized_slug TEXT;
  v_existing_id UUID;
  v_existing_domain_id UUID;
  v_platform_domain TEXT := 'prbuilder.in';
  v_full_hostname TEXT;
BEGIN
  IF p_slug IS NULL OR LENGTH(TRIM(p_slug)) = 0 THEN
    RETURN jsonb_build_object(
      'available', FALSE,
      'error', 'Subdomain slug cannot be empty'
    );
  END IF;

  v_normalized_slug := LOWER(TRIM(p_slug));

  -- 1. Format & length & reserved keyword validation
  IF NOT public.validate_portfolio_slug(v_normalized_slug) THEN
    IF LENGTH(v_normalized_slug) < 3 THEN
      RETURN jsonb_build_object('available', FALSE, 'error', 'Subdomain must be at least 3 characters.');
    ELSIF LENGTH(v_normalized_slug) > 48 THEN
      RETURN jsonb_build_object('available', FALSE, 'error', 'Subdomain cannot exceed 48 characters.');
    ELSIF NOT v_normalized_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
      RETURN jsonb_build_object('available', FALSE, 'error', 'Subdomain can only contain lowercase letters, numbers, and hyphens without consecutive or edge hyphens.');
    ELSE
      RETURN jsonb_build_object('available', FALSE, 'error', 'This subdomain name is reserved for platform services.');
    END IF;
  END IF;

  -- 2. Check if slug is claimed by another published portfolio
  SELECT id INTO v_existing_id
  FROM public.portfolios
  WHERE slug = v_normalized_slug
    AND publication_status = 'published'
    AND (p_portfolio_id IS NULL OR id != p_portfolio_id)
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'available', FALSE,
      'error', 'This subdomain is already claimed by another published portfolio.'
    );
  END IF;

  -- 3. Check if hostname exists in domains table for another portfolio
  v_full_hostname := v_normalized_slug || '.' || v_platform_domain;
  SELECT id INTO v_existing_domain_id
  FROM public.domains
  WHERE hostname = v_full_hostname
    AND (p_portfolio_id IS NULL OR portfolio_id != p_portfolio_id)
  LIMIT 1;

  IF v_existing_domain_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'available', FALSE,
      'error', 'This subdomain is already registered in custom domains.'
    );
  END IF;

  RETURN jsonb_build_object(
    'available', TRUE,
    'slug', v_normalized_slug,
    'hostname', v_full_hostname
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_subdomain_availability(TEXT, UUID) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Enhanced Publish Portfolio RPC (Synchronizing with domains table)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.publish_portfolio(
  p_portfolio_id UUID,
  p_slug TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_portfolio RECORD;
  v_normalized_slug TEXT;
  v_existing_id UUID;
  v_platform_domain TEXT := 'prbuilder.in';
  v_subdomain_host TEXT;
BEGIN
  -- 1. Verify caller authentication
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to publish portfolio'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- 2. Verify portfolio ownership
  SELECT * INTO v_portfolio
  FROM public.portfolios
  WHERE id = p_portfolio_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Portfolio not found'
      USING ERRCODE = 'no_data_found';
  END IF;

  IF v_portfolio.user_id != v_caller_id THEN
    RAISE EXCEPTION 'You are not authorized to publish this portfolio'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- 3. Normalize and validate slug
  v_normalized_slug := LOWER(TRIM(p_slug));
  IF NOT public.validate_portfolio_slug(v_normalized_slug) THEN
    RAISE EXCEPTION 'Invalid slug format. Slugs must be 3-48 characters, lowercase alphanumeric with hyphens, and not a reserved keyword.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 4. Check slug availability among published portfolios
  SELECT id INTO v_existing_id
  FROM public.portfolios
  WHERE slug = v_normalized_slug
    AND publication_status = 'published'
    AND id != p_portfolio_id
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'This slug is already in use by another published portfolio. Please choose a different slug.'
      USING ERRCODE = 'unique_violation';
  END IF;

  -- 5. Perform publication atomic update
  UPDATE public.portfolios
  SET
    slug = v_normalized_slug,
    publication_status = 'published',
    published_at = NOW(),
    updated_at = NOW()
  WHERE id = p_portfolio_id;

  -- 6. Synchronize with public.domains table for platform subdomain
  v_subdomain_host := v_normalized_slug || '.' || v_platform_domain;

  INSERT INTO public.domains (
    portfolio_id,
    user_id,
    hostname,
    verification_status,
    connection_status,
    dns_records,
    verified_at,
    updated_at
  ) VALUES (
    p_portfolio_id,
    v_caller_id,
    v_subdomain_host,
    'connected',
    'active',
    jsonb_build_array(
      jsonb_build_object('type', 'CNAME', 'host', v_normalized_slug, 'value', 'cname.prbuilder.in', 'ttl', 300)
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (hostname) DO UPDATE
    SET portfolio_id = EXCLUDED.portfolio_id,
        user_id = EXCLUDED.user_id,
        verification_status = 'connected',
        connection_status = 'active',
        verified_at = NOW(),
        updated_at = NOW();

  -- 7. Log immutable publication event
  INSERT INTO public.publication_events (
    portfolio_id,
    user_id,
    event_type,
    metadata
  ) VALUES (
    p_portfolio_id,
    v_caller_id,
    'published',
    jsonb_build_object(
      'slug', v_normalized_slug,
      'subdomain', v_subdomain_host,
      'published_at', NOW()
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'id', p_portfolio_id,
    'slug', v_normalized_slug,
    'hostname', v_subdomain_host,
    'publication_status', 'published',
    'published_at', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_portfolio(UUID, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. Enhanced Unpublish Portfolio RPC (Synchronizing with domains table)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.unpublish_portfolio(
  p_portfolio_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_portfolio RECORD;
  v_platform_domain TEXT := 'prbuilder.in';
  v_subdomain_host TEXT;
BEGIN
  -- 1. Verify caller authentication
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to unpublish portfolio'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- 2. Verify portfolio ownership
  SELECT * INTO v_portfolio
  FROM public.portfolios
  WHERE id = p_portfolio_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Portfolio not found'
      USING ERRCODE = 'no_data_found';
  END IF;

  IF v_portfolio.user_id != v_caller_id THEN
    RAISE EXCEPTION 'You are not authorized to unpublish this portfolio'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- 3. Atomic status update
  UPDATE public.portfolios
  SET
    publication_status = 'draft',
    updated_at = NOW()
  WHERE id = p_portfolio_id;

  -- 4. Disconnect platform subdomain in domains table
  IF v_portfolio.slug IS NOT NULL THEN
    v_subdomain_host := v_portfolio.slug || '.' || v_platform_domain;
    UPDATE public.domains
    SET
      connection_status = 'disconnected',
      updated_at = NOW()
    WHERE portfolio_id = p_portfolio_id
      AND hostname = v_subdomain_host;
  END IF;

  -- 5. Log immutable audit event
  INSERT INTO public.publication_events (
    portfolio_id,
    user_id,
    event_type,
    metadata
  ) VALUES (
    p_portfolio_id,
    v_caller_id,
    'unpublished',
    jsonb_build_object(
      'previous_slug', v_portfolio.slug,
      'unpublished_at', NOW()
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'id', p_portfolio_id,
    'publication_status', 'draft'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.unpublish_portfolio(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. Safe Public Retrieval by Hostname RPC Function
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_published_portfolio_by_hostname(
  p_hostname TEXT
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  slug TEXT,
  title TEXT,
  theme TEXT,
  portfolio_data JSONB,
  published_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clean_host TEXT;
  v_slug TEXT;
  v_portfolio_id UUID;
BEGIN
  IF p_hostname IS NULL OR LENGTH(TRIM(p_hostname)) = 0 THEN
    RETURN;
  END IF;

  v_clean_host := LOWER(TRIM(p_hostname));

  -- 1. Try finding by matching domains table hostname
  SELECT d.portfolio_id INTO v_portfolio_id
  FROM public.domains d
  WHERE d.hostname = v_clean_host
    AND d.connection_status = 'active'
  LIMIT 1;

  IF v_portfolio_id IS NOT NULL THEN
    RETURN QUERY
    SELECT
      p.id,
      p.user_id,
      p.slug,
      p.title,
      p.theme,
      p.portfolio_data,
      p.published_at
    FROM public.portfolios p
    WHERE p.id = v_portfolio_id
      AND p.publication_status = 'published'
    LIMIT 1;
    RETURN;
  END IF;

  -- 2. If hostname ends with .prbuilder.in, extract subdomain slug
  IF v_clean_host LIKE '%.prbuilder.in' THEN
    v_slug := SUBSTRING(v_clean_host FROM 1 FOR (LENGTH(v_clean_host) - LENGTH('.prbuilder.in')));
    RETURN QUERY
    SELECT
      p.id,
      p.user_id,
      p.slug,
      p.title,
      p.theme,
      p.portfolio_data,
      p.published_at
    FROM public.portfolios p
    WHERE p.slug = v_slug
      AND p.publication_status = 'published'
    LIMIT 1;
    RETURN;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_published_portfolio_by_hostname(TEXT) TO anon, authenticated;
