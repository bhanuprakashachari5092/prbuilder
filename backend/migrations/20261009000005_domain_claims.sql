-- =============================================================================
-- Migration: 20261009000005_domain_claims.sql
-- Description: Secure Admin-Approved Free .xyz Domain Claim System
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Profiles Admin Role Extension & Helper
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Stable security definer helper to check admin role
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
    FALSE
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. Domain Claims Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.domain_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE SET NULL,
  requested_domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'claimed')),
  rejection_reason TEXT,
  admin_notes TEXT,
  claim_instructions TEXT,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  dns_verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (dns_verification_status IN ('pending', 'verified', 'connected', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index to enforce: One active claim request per student (pending, approved, or claimed)
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_domain_claim_per_user
  ON public.domain_claims (user_id)
  WHERE (status IN ('pending', 'approved', 'claimed'));

-- Unique index ensuring no two students claim the same .xyz domain name
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_claimed_domain_name
  ON public.domain_claims (LOWER(requested_domain))
  WHERE (status IN ('approved', 'claimed'));

-- Index for admin queries and sorting
CREATE INDEX IF NOT EXISTS idx_domain_claims_status ON public.domain_claims (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_domain_claims_user_id ON public.domain_claims (user_id);

CREATE OR REPLACE TRIGGER trg_domain_claims_updated_at
  BEFORE UPDATE ON public.domain_claims
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. Row-Level Security Policies for domain_claims
-- -----------------------------------------------------------------------------
ALTER TABLE public.domain_claims ENABLE ROW LEVEL SECURITY;

-- Students can view only their own claims
DROP POLICY IF EXISTS "domain_claims_owner_select" ON public.domain_claims;
CREATE POLICY "domain_claims_owner_select"
  ON public.domain_claims
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all claims
DROP POLICY IF EXISTS "domain_claims_admin_select" ON public.domain_claims;
CREATE POLICY "domain_claims_admin_select"
  ON public.domain_claims
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Direct inserts/updates blocked by default — manipulated via secure RPC functions
DROP POLICY IF EXISTS "domain_claims_admin_update" ON public.domain_claims;
CREATE POLICY "domain_claims_admin_update"
  ON public.domain_claims
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. Student RPC: Request Free .xyz Domain
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_xyz_domain(
  p_requested_domain TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_normalized_domain TEXT;
  v_handle TEXT;
  v_portfolio RECORD;
  v_existing_active RECORD;
  v_domain_taken RECORD;
  v_claim_id UUID;
BEGIN
  -- 1. Verify caller authentication
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to claim a domain'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- 2. Normalize and validate requested domain
  v_normalized_domain := LOWER(TRIM(p_requested_domain));
  v_normalized_domain := REGEXP_REPLACE(v_normalized_domain, '^https?://', '');
  v_normalized_domain := REGEXP_REPLACE(v_normalized_domain, '/.*$', '');

  -- Must end with .xyz
  IF NOT v_normalized_domain LIKE '%.xyz' THEN
    RAISE EXCEPTION 'Only .xyz domains can be claimed under this sponsorship program. Example: yourname.xyz'
      USING ERRCODE = 'check_violation';
  END IF;

  v_handle := SUBSTRING(v_normalized_domain FROM 1 FOR (LENGTH(v_normalized_domain) - 4));

  -- Validate handle format (2 to 48 chars, lowercase letters/numbers/hyphens)
  IF LENGTH(v_handle) < 2 OR LENGTH(v_handle) > 48 THEN
    RAISE EXCEPTION 'Domain name must be between 2 and 48 characters before .xyz'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NOT v_handle ~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Domain handle can only contain lowercase letters, numbers, and hyphens without consecutive or edge hyphens'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Disallow reserved system words
  IF v_handle IN (
    'admin', 'dashboard', 'auth', 'api', 'login', 'signup',
    'settings', 'portfolio', 'resume', 'root', 'support', 'help',
    'kaizenq', 'official', 'billing', 'mail', 'ssl'
  ) THEN
    RAISE EXCEPTION 'This domain handle is reserved and cannot be claimed'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 3. Verify student eligibility: must have a portfolio draft or published
  SELECT id, publication_status INTO v_portfolio
  FROM public.portfolios
  WHERE user_id = v_caller_id
  ORDER BY updated_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Eligibility requirement: Please create your portfolio draft in PR Builder before requesting a free .xyz domain'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 4. Enforce: One active claim request per student
  SELECT id, status, requested_domain INTO v_existing_active
  FROM public.domain_claims
  WHERE user_id = v_caller_id
    AND status IN ('pending', 'approved', 'claimed')
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'You already have an active domain claim for "%" with status "%". Duplicate requests are not permitted.'
      , v_existing_active.requested_domain, v_existing_active.status
      USING ERRCODE = 'unique_violation';
  END IF;

  -- 5. Enforce: Domain not already claimed by another student
  SELECT id INTO v_domain_taken
  FROM public.domain_claims
  WHERE LOWER(requested_domain) = v_normalized_domain
    AND status IN ('approved', 'claimed')
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'The domain "%" has already been claimed and approved for another user. Please choose an alternate handle.'
      , v_normalized_domain
      USING ERRCODE = 'unique_violation';
  END IF;

  -- 6. Insert pending claim request
  INSERT INTO public.domain_claims (
    user_id,
    portfolio_id,
    requested_domain,
    status,
    dns_verification_status
  ) VALUES (
    v_caller_id,
    v_portfolio.id,
    v_normalized_domain,
    'pending',
    'pending'
  )
  RETURNING id INTO v_claim_id;

  -- 7. Log audit event
  INSERT INTO public.publication_events (
    portfolio_id,
    user_id,
    event_type,
    metadata
  ) VALUES (
    v_portfolio.id,
    v_caller_id,
    'domain_attached',
    jsonb_build_object(
      'action', 'xyz_claim_requested',
      'claim_id', v_claim_id,
      'requested_domain', v_normalized_domain,
      'requested_at', NOW()
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'claim_id', v_claim_id,
    'requested_domain', v_normalized_domain,
    'status', 'pending',
    'message', 'Free .xyz domain claim submitted for admin review.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_xyz_domain(TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. Admin RPC: Review Domain Claim (Approve / Reject / Mark Claimed)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_review_domain_claim(
  p_claim_id UUID,
  p_action TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_claim RECORD;
  v_new_status TEXT;
  v_instructions TEXT;
BEGIN
  -- 1. Verify caller is an authorized admin
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only platform administrators can review domain claims'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- 2. Find claim record
  SELECT * INTO v_claim
  FROM public.domain_claims
  WHERE id = p_claim_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Domain claim not found'
      USING ERRCODE = 'no_data_found';
  END IF;

  -- 3. Determine action
  IF p_action = 'approve' THEN
    v_new_status := 'approved';
    -- Safe private instructions provided to student (never reveals sponsor coupon code)
    v_instructions := 'Your .xyz domain claim has been approved! Gen.xyz student sponsorship provisioning is being processed manually. DNS CNAME routing will be assigned to your portfolio upon registrar confirmation.';

    UPDATE public.domain_claims
    SET
      status = v_new_status,
      admin_notes = COALESCE(p_notes, admin_notes),
      claim_instructions = v_instructions,
      approved_by = v_admin_id,
      approved_at = NOW(),
      rejection_reason = NULL,
      updated_at = NOW()
    WHERE id = p_claim_id;

  ELSIF p_action = 'reject' THEN
    v_new_status := 'rejected';

    UPDATE public.domain_claims
    SET
      status = v_new_status,
      rejection_reason = COALESCE(p_notes, 'Domain handle does not meet student showcase guidelines or is already reserved.'),
      admin_notes = COALESCE(p_notes, admin_notes),
      approved_by = v_admin_id,
      updated_at = NOW()
    WHERE id = p_claim_id;

  ELSIF p_action = 'mark_claimed' THEN
    v_new_status := 'claimed';

    UPDATE public.domain_claims
    SET
      status = v_new_status,
      claimed_at = NOW(),
      dns_verification_status = 'connected',
      admin_notes = COALESCE(p_notes, admin_notes),
      updated_at = NOW()
    WHERE id = p_claim_id;

  ELSE
    RAISE EXCEPTION 'Invalid review action. Allowed actions: approve, reject, mark_claimed'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 4. Log audit event
  IF v_claim.portfolio_id IS NOT NULL THEN
    INSERT INTO public.publication_events (
      portfolio_id,
      user_id,
      event_type,
      metadata
    ) VALUES (
      v_claim.portfolio_id,
      v_claim.user_id,
      'domain_attached',
      jsonb_build_object(
        'action', 'xyz_claim_reviewed',
        'claim_id', p_claim_id,
        'action_taken', p_action,
        'reviewed_by', v_admin_id,
        'new_status', v_new_status,
        'reviewed_at', NOW()
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'claim_id', p_claim_id,
    'status', v_new_status,
    'action', p_action
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_review_domain_claim(UUID, TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. Admin RPC: Get All Domain Claims with Student Details
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_domain_claims(
  p_status_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  student_name TEXT,
  student_email TEXT,
  portfolio_id UUID,
  portfolio_status TEXT,
  portfolio_slug TEXT,
  requested_domain TEXT,
  status TEXT,
  rejection_reason TEXT,
  admin_notes TEXT,
  approved_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  dns_verification_status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only platform administrators can view all domain requests'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.user_id,
    COALESCE(p.display_name, 'Student Builder') AS student_name,
    COALESCE(u.email::TEXT, 'no-email') AS student_email,
    c.portfolio_id,
    COALESCE(port.publication_status, 'none') AS portfolio_status,
    port.slug AS portfolio_slug,
    c.requested_domain,
    c.status,
    c.rejection_reason,
    c.admin_notes,
    c.approved_at,
    c.claimed_at,
    c.dns_verification_status,
    c.created_at,
    c.updated_at
  FROM public.domain_claims c
  LEFT JOIN public.profiles p ON p.id = c.user_id
  LEFT JOIN auth.users u ON u.id = c.user_id
  LEFT JOIN public.portfolios port ON port.id = c.portfolio_id
  WHERE (p_status_filter IS NULL OR p_status_filter = 'all' OR c.status = p_status_filter)
  ORDER BY c.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_domain_claims(TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 7. Student RPC: Get Current User's Active Claim
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_domain_claim()
RETURNS TABLE (
  id UUID,
  requested_domain TEXT,
  status TEXT,
  rejection_reason TEXT,
  claim_instructions TEXT,
  approved_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  dns_verification_status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.requested_domain,
    c.status,
    c.rejection_reason,
    c.claim_instructions,
    c.approved_at,
    c.claimed_at,
    c.dns_verification_status,
    c.created_at,
    c.updated_at
  FROM public.domain_claims c
  WHERE c.user_id = v_caller_id
  ORDER BY c.created_at DESC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_domain_claim() TO authenticated;
