-- =============================================================================
-- Migration: 20261009000003_publication_functions.sql
-- Description: Trusted Server-Side Publication & Audit RPC Functions
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Publish Portfolio RPC Function
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

  -- 6. Log immutable publication event
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
      'published_at', NOW()
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'id', p_portfolio_id,
    'slug', v_normalized_slug,
    'publication_status', 'published',
    'published_at', NOW()
  );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.publish_portfolio(UUID, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. Unpublish Portfolio RPC Function
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

  -- 4. Log immutable audit event
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
-- 3. Safe Public Portfolio Retrieval by Slug
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_published_portfolio(
  p_slug TEXT
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
BEGIN
  IF p_slug IS NULL OR LENGTH(TRIM(p_slug)) = 0 THEN
    RETURN;
  END IF;

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
  WHERE p.slug = LOWER(TRIM(p_slug))
    AND p.publication_status = 'published'
  LIMIT 1;
END;
$$;

-- Grant execution to all users (anonymous and authenticated)
GRANT EXECUTE ON FUNCTION public.get_published_portfolio(TEXT) TO anon, authenticated;
