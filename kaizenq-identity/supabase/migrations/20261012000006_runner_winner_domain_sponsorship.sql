-- =============================================================================
-- Migration: 20261012000006_runner_winner_domain_sponsorship.sql
-- Description: Secure Runner/Winner-Only .XYZ Domain Sponsorship Claim System
--              - Strict Eligibility Management (Manual + CSV Import)
--              - Normalized Email Matching to auth.users
--              - Atomic 300 Domain Quota Allocation with Concurrency Locks
--              - Admin-Only Manual Registration Queue & Coupon Secrecy
--              - Independent DNS Verification & SSL Lifecycle Tracking
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Domain Sponsorship Eligibility Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.domain_sponsorship_eligibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('runner', 'winner')),
  event_reference TEXT,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique index on normalized email to prevent duplicate eligibility entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_eligibility_normalized_email
  ON public.domain_sponsorship_eligibility (LOWER(TRIM(email)));

CREATE INDEX IF NOT EXISTS idx_eligibility_category
  ON public.domain_sponsorship_eligibility (category);

CREATE INDEX IF NOT EXISTS idx_eligibility_event
  ON public.domain_sponsorship_eligibility (event_reference);

CREATE INDEX IF NOT EXISTS idx_eligibility_revoked
  ON public.domain_sponsorship_eligibility (is_revoked);

CREATE OR REPLACE TRIGGER trg_domain_eligibility_updated_at
  BEFORE UPDATE ON public.domain_sponsorship_eligibility
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. Row Level Security for domain_sponsorship_eligibility
-- -----------------------------------------------------------------------------
ALTER TABLE public.domain_sponsorship_eligibility ENABLE ROW LEVEL SECURITY;

-- Admins have full access to manage eligibility
DROP POLICY IF EXISTS "eligibility_admin_all" ON public.domain_sponsorship_eligibility;
CREATE POLICY "eligibility_admin_all"
  ON public.domain_sponsorship_eligibility
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Students can ONLY view their own eligibility record by matching verified auth email
DROP POLICY IF EXISTS "eligibility_student_select_own" ON public.domain_sponsorship_eligibility;
CREATE POLICY "eligibility_student_select_own"
  ON public.domain_sponsorship_eligibility
  FOR SELECT
  TO authenticated
  USING (
    LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt() ->> 'email'))
    AND is_revoked = FALSE
  );

-- -----------------------------------------------------------------------------
-- 3. Extend domain_claims for Complete Lifecycle Tracking
-- -----------------------------------------------------------------------------
-- Expand status constraint to support complete registration & DNS pipeline
ALTER TABLE public.domain_claims
  DROP CONSTRAINT IF EXISTS domain_claims_status_check;

ALTER TABLE public.domain_claims
  ADD CONSTRAINT domain_claims_status_check
  CHECK (status IN ('pending', 'approved', 'registered', 'dns_pending', 'active', 'rejected', 'claimed'));

-- Add tracking columns for registration, SSL, category, and hosting DNS
ALTER TABLE public.domain_claims
  ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ssl_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (ssl_status IN ('pending', 'active', 'failed')),
  ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('runner', 'winner')),
  ADD COLUMN IF NOT EXISTS event_reference TEXT,
  ADD COLUMN IF NOT EXISTS dns_instructions TEXT;

-- Update unique active claim index to include extended lifecycle statuses
DROP INDEX IF EXISTS idx_one_active_domain_claim_per_user;
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_domain_claim_per_user
  ON public.domain_claims (user_id)
  WHERE (status IN ('pending', 'approved', 'registered', 'dns_pending', 'active', 'claimed'));

-- Update unique domain index to ensure no two students take the same handle
DROP INDEX IF EXISTS idx_unique_claimed_domain_name;
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_claimed_domain_name
  ON public.domain_claims (LOWER(requested_domain))
  WHERE (status IN ('approved', 'registered', 'dns_pending', 'active', 'claimed'));

-- -----------------------------------------------------------------------------
-- 4. Admin RPC: Add or Update Single Student Eligibility
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_add_eligibility(
  p_name TEXT,
  p_email TEXT,
  p_category TEXT,
  p_event TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_normalized_email TEXT;
  v_category TEXT;
  v_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only platform administrators can manage sponsorship eligibility'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_admin_id := auth.uid();
  v_normalized_email := LOWER(TRIM(p_email));
  v_category := LOWER(TRIM(p_category));

  IF v_normalized_email NOT LIKE '%@%.%' THEN
    RAISE EXCEPTION 'Invalid email address format'
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_category NOT IN ('runner', 'winner') THEN
    RAISE EXCEPTION 'Category must be either "runner" or "winner"'
      USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.domain_sponsorship_eligibility (
    student_name,
    email,
    category,
    event_reference,
    is_revoked,
    added_by
  ) VALUES (
    TRIM(p_name),
    v_normalized_email,
    v_category,
    TRIM(p_event),
    FALSE,
    v_admin_id
  )
  ON CONFLICT (LOWER(TRIM(email))) DO UPDATE
    SET student_name = EXCLUDED.student_name,
        category = EXCLUDED.category,
        event_reference = COALESCE(EXCLUDED.event_reference, domain_sponsorship_eligibility.event_reference),
        is_revoked = FALSE,
        added_by = v_admin_id,
        updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'id', v_id,
    'email', v_normalized_email,
    'category', v_category
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_add_eligibility(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. Admin RPC: Bulk CSV Eligibility Import
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_import_eligibility_csv(
  p_records JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_item JSONB;
  v_name TEXT;
  v_email TEXT;
  v_category TEXT;
  v_event TEXT;
  v_inserted_count INT := 0;
  v_skipped_count INT := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only platform administrators can import sponsorship eligibility'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_admin_id := auth.uid();

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_records)
  LOOP
    v_name := TRIM(COALESCE(v_item->>'name', v_item->>'student_name', ''));
    v_email := LOWER(TRIM(COALESCE(v_item->>'email', '')));
    v_category := LOWER(TRIM(COALESCE(v_item->>'category', 'runner')));
    v_event := TRIM(COALESCE(v_item->>'event', v_item->>'event_reference', ''));

    IF v_email NOT LIKE '%@%.%' OR v_name = '' THEN
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;

    IF v_category NOT IN ('runner', 'winner') THEN
      v_category := 'runner';
    END IF;

    INSERT INTO public.domain_sponsorship_eligibility (
      student_name,
      email,
      category,
      event_reference,
      is_revoked,
      added_by
    ) VALUES (
      v_name,
      v_email,
      v_category,
      NULLIF(v_event, ''),
      FALSE,
      v_admin_id
    )
    ON CONFLICT (LOWER(TRIM(email))) DO UPDATE
      SET student_name = EXCLUDED.student_name,
          category = EXCLUDED.category,
          event_reference = COALESCE(EXCLUDED.event_reference, domain_sponsorship_eligibility.event_reference),
          is_revoked = FALSE,
          added_by = v_admin_id,
          updated_at = NOW();

    v_inserted_count := v_inserted_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', TRUE,
    'imported', v_inserted_count,
    'skipped', v_skipped_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_import_eligibility_csv(JSONB) TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. Admin RPC: Revoke Eligibility
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_revoke_eligibility(
  p_eligibility_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only platform administrators can revoke eligibility'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.domain_sponsorship_eligibility
  SET is_revoked = TRUE,
      updated_at = NOW()
  WHERE id = p_eligibility_id;

  RETURN jsonb_build_object('success', TRUE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_revoke_eligibility(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 7. Admin RPC: Get Sponsorship Metrics & Quota Tracking (300 Allocation)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_domain_sponsorship_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total_allocation CONSTANT INT := 300;
  v_eligible_count INT := 0;
  v_pending_count INT := 0;
  v_approved_count INT := 0;
  v_registered_count INT := 0;
  v_dns_pending_count INT := 0;
  v_active_count INT := 0;
  v_rejected_count INT := 0;
  v_reserved_count INT := 0;
  v_remaining_quota INT := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only platform administrators can access sponsorship metrics'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT COUNT(*) INTO v_eligible_count
  FROM public.domain_sponsorship_eligibility
  WHERE is_revoked = FALSE;

  SELECT
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'approved'),
    COUNT(*) FILTER (WHERE status = 'registered'),
    COUNT(*) FILTER (WHERE status = 'dns_pending'),
    COUNT(*) FILTER (WHERE status IN ('active', 'claimed')),
    COUNT(*) FILTER (WHERE status = 'rejected')
  INTO
    v_pending_count,
    v_approved_count,
    v_registered_count,
    v_dns_pending_count,
    v_active_count,
    v_rejected_count
  FROM public.domain_claims;

  -- Reserved slots count all claims that have been approved or advanced further
  v_reserved_count := v_approved_count + v_registered_count + v_dns_pending_count + v_active_count;
  v_remaining_quota := GREATEST(0, v_total_allocation - v_reserved_count);

  RETURN jsonb_build_object(
    'total_allocation', v_total_allocation,
    'eligible_count', v_eligible_count,
    'pending_count', v_pending_count,
    'approved_count', v_approved_count,
    'registered_count', v_registered_count,
    'dns_pending_count', v_dns_pending_count,
    'active_count', v_active_count,
    'rejected_count', v_rejected_count,
    'reserved_count', v_reserved_count,
    'remaining_quota', v_remaining_quota
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_domain_sponsorship_metrics() TO authenticated;

-- -----------------------------------------------------------------------------
-- 8. Admin RPC: Get Full Eligibility Directory
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_eligibility_directory(
  p_search TEXT DEFAULT NULL,
  p_category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  student_name TEXT,
  email TEXT,
  category TEXT,
  event_reference TEXT,
  is_revoked BOOLEAN,
  claim_status TEXT,
  claimed_domain TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only platform administrators can view eligibility directory'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
  SELECT
    e.id,
    e.student_name,
    e.email,
    e.category,
    e.event_reference,
    e.is_revoked,
    c.status AS claim_status,
    c.requested_domain AS claimed_domain,
    e.created_at,
    e.updated_at
  FROM public.domain_sponsorship_eligibility e
  LEFT JOIN auth.users u ON LOWER(TRIM(u.email)) = LOWER(TRIM(e.email))
  LEFT JOIN public.domain_claims c ON c.user_id = u.id AND c.status IN ('pending', 'approved', 'registered', 'dns_pending', 'active', 'claimed')
  WHERE
    (p_category_filter IS NULL OR p_category_filter = 'all' OR e.category = p_category_filter)
    AND (
      p_search IS NULL OR p_search = ''
      OR LOWER(e.student_name) LIKE '%' || LOWER(p_search) || '%'
      OR LOWER(e.email) LIKE '%' || LOWER(p_search) || '%'
      OR LOWER(COALESCE(e.event_reference, '')) LIKE '%' || LOWER(p_search) || '%'
    )
  ORDER BY e.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_eligibility_directory(TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 9. Student RPC: Check Own Sponsorship Eligibility
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_domain_sponsorship_eligibility()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_email TEXT;
  v_eligibility RECORD;
  v_active_claim RECORD;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object(
      'is_eligible', FALSE,
      'reason', 'Unauthenticated'
    );
  END IF;

  SELECT email INTO v_caller_email
  FROM auth.users
  WHERE id = v_caller_id;

  IF v_caller_email IS NULL THEN
    RETURN jsonb_build_object(
      'is_eligible', FALSE,
      'reason', 'Email not found'
    );
  END IF;

  SELECT * INTO v_eligibility
  FROM public.domain_sponsorship_eligibility
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(v_caller_email))
    AND is_revoked = FALSE
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'is_eligible', FALSE,
      'reason', 'Account email is not listed on the sponsored runner or winner directory'
    );
  END IF;

  -- Retrieve student claim status if existing
  SELECT * INTO v_active_claim
  FROM public.domain_claims
  WHERE user_id = v_caller_id
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'is_eligible', TRUE,
    'student_name', v_eligibility.student_name,
    'email', v_eligibility.email,
    'category', v_eligibility.category,
    'event_reference', v_eligibility.event_reference,
    'claim_status', COALESCE(v_active_claim.status, 'eligible'),
    'claim_id', v_active_claim.id,
    'requested_domain', v_active_claim.requested_domain,
    'dns_verification_status', v_active_claim.dns_verification_status,
    'ssl_status', v_active_claim.ssl_status,
    'claim_instructions', v_active_claim.claim_instructions,
    'dns_instructions', v_active_claim.dns_instructions,
    'rejection_reason', v_active_claim.rejection_reason
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_domain_sponsorship_eligibility() TO authenticated;

-- -----------------------------------------------------------------------------
-- 10. Student RPC: Request .XYZ Domain (Enforcing Eligibility & Quota)
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
  v_caller_email TEXT;
  v_eligibility RECORD;
  v_normalized_domain TEXT;
  v_handle TEXT;
  v_portfolio RECORD;
  v_existing_active RECORD;
  v_domain_taken RECORD;
  v_claim_id UUID;
  v_reserved_count INT;
BEGIN
  -- 1. Verify caller authentication
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to claim a domain'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- 2. Verify student eligibility: must be an active runner/winner
  SELECT email INTO v_caller_email
  FROM auth.users
  WHERE id = v_caller_id;

  SELECT * INTO v_eligibility
  FROM public.domain_sponsorship_eligibility
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(v_caller_email))
    AND is_revoked = FALSE
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Access Denied: Only event runners and winners registered by administrators are eligible for the .xyz domain sponsorship'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- 3. Verify quota availability (300 maximum allocation)
  SELECT COUNT(*) INTO v_reserved_count
  FROM public.domain_claims
  WHERE status IN ('approved', 'registered', 'dns_pending', 'active', 'claimed');

  IF v_reserved_count >= 300 THEN
    RAISE EXCEPTION 'The 300 Gen.xyz sponsored domain allocation has been completely fulfilled.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 4. Normalize and validate requested domain
  v_normalized_domain := LOWER(TRIM(p_requested_domain));
  v_normalized_domain := REGEXP_REPLACE(v_normalized_domain, '^https?://', '');
  v_normalized_domain := REGEXP_REPLACE(v_normalized_domain, '/.*$', '');

  IF NOT v_normalized_domain LIKE '%.xyz' THEN
    RAISE EXCEPTION 'Only .xyz domains can be claimed under this sponsorship program. Example: yourname.xyz'
      USING ERRCODE = 'check_violation';
  END IF;

  v_handle := SUBSTRING(v_normalized_domain FROM 1 FOR (LENGTH(v_normalized_domain) - 4));

  IF LENGTH(v_handle) < 2 OR LENGTH(v_handle) > 48 THEN
    RAISE EXCEPTION 'Domain name must be between 2 and 48 characters before .xyz'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NOT v_handle ~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Domain handle can only contain lowercase letters, numbers, and single hyphens without leading or trailing hyphens'
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_handle IN (
    'admin', 'dashboard', 'auth', 'api', 'login', 'signup',
    'settings', 'portfolio', 'resume', 'root', 'support', 'help',
    'kaizenq', 'official', 'billing', 'mail', 'ssl'
  ) THEN
    RAISE EXCEPTION 'This domain handle is reserved and cannot be claimed'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 5. Verify portfolio draft or published exists
  SELECT id, publication_status INTO v_portfolio
  FROM public.portfolios
  WHERE user_id = v_caller_id
  ORDER BY updated_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Eligibility requirement: Please create your portfolio draft in PR Builder before requesting your sponsored .xyz domain'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 6. Enforce: One active claim request per student
  SELECT id, status, requested_domain INTO v_existing_active
  FROM public.domain_claims
  WHERE user_id = v_caller_id
    AND status IN ('pending', 'approved', 'registered', 'dns_pending', 'active', 'claimed')
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'You already have an active domain claim for "%" with status "%". Duplicate requests are not permitted.'
      , v_existing_active.requested_domain, v_existing_active.status
      USING ERRCODE = 'unique_violation';
  END IF;

  -- 7. Enforce: Domain not already taken by another student
  SELECT id INTO v_domain_taken
  FROM public.domain_claims
  WHERE LOWER(requested_domain) = v_normalized_domain
    AND status IN ('approved', 'registered', 'dns_pending', 'active', 'claimed')
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'The domain "%" has already been claimed by another student. Please select an alternate handle.'
      , v_normalized_domain
      USING ERRCODE = 'unique_violation';
  END IF;

  -- 8. Insert claim record with category & event reference
  INSERT INTO public.domain_claims (
    user_id,
    portfolio_id,
    requested_domain,
    status,
    dns_verification_status,
    ssl_status,
    category,
    event_reference
  ) VALUES (
    v_caller_id,
    v_portfolio.id,
    v_normalized_domain,
    'pending',
    'pending',
    'pending',
    v_eligibility.category,
    v_eligibility.event_reference
  )
  RETURNING id INTO v_claim_id;

  -- 9. Log audit event
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
      'action', 'runner_winner_claim_requested',
      'claim_id', v_claim_id,
      'requested_domain', v_normalized_domain,
      'category', v_eligibility.category,
      'event_reference', v_eligibility.event_reference,
      'requested_at', NOW()
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'claim_id', v_claim_id,
    'requested_domain', v_normalized_domain,
    'status', 'pending',
    'category', v_eligibility.category,
    'message', 'Sponsored .xyz domain claim submitted for admin verification.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_xyz_domain(TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 11. Admin RPC: Review Domain Claim with Atomic 300 Quota & Manual Queue
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
  v_dns_instructions TEXT;
  v_reserved_count INT;
BEGIN
  -- 1. Verify admin privilege
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

  -- 3. Atomic Quota Lock on Approval (Max 300)
  IF p_action = 'approve' THEN
    -- Use transaction-level advisory lock to serialize concurrent approvals
    PERFORM pg_advisory_xact_lock(hashtext('domain_sponsorship_quota_lock'));

    SELECT COUNT(*) INTO v_reserved_count
    FROM public.domain_claims
    WHERE status IN ('approved', 'registered', 'dns_pending', 'active', 'claimed')
      AND id != p_claim_id;

    IF v_reserved_count >= 300 THEN
      RAISE EXCEPTION 'Cannot approve claim: Maximum sponsored allocation of 300 domains reached.'
        USING ERRCODE = 'check_violation';
    END IF;

    v_new_status := 'approved';
    -- Safe instructions provided to student: never exposes secret coupon code
    v_instructions := 'Congratulations! Your sponsored .XYZ domain claim has been approved. Our administrator has queued your domain for registrar provisioning. You will be notified as soon as registrar booking is confirmed.';

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

  ELSIF p_action = 'confirm_registered' THEN
    -- Admin confirms domain was booked at registrar console
    v_new_status := 'registered';
    v_dns_instructions := 'Domain registration confirmed at registrar! Configure your DNS records to connect your domain: Point CNAME record (@ and www) to cname.kaizenq.me and TXT record (_verify) to your portfolio ID.';

    UPDATE public.domain_claims
    SET
      status = v_new_status,
      registered_at = NOW(),
      admin_notes = COALESCE(p_notes, admin_notes),
      dns_instructions = v_dns_instructions,
      updated_at = NOW()
    WHERE id = p_claim_id;

  ELSIF p_action = 'mark_dns_pending' THEN
    v_new_status := 'dns_pending';
    UPDATE public.domain_claims
    SET
      status = v_new_status,
      dns_verification_status = 'pending',
      admin_notes = COALESCE(p_notes, admin_notes),
      updated_at = NOW()
    WHERE id = p_claim_id;

  ELSIF p_action = 'mark_active' THEN
    v_new_status := 'active';
    UPDATE public.domain_claims
    SET
      status = v_new_status,
      dns_verification_status = 'connected',
      ssl_status = 'active',
      claimed_at = COALESCE(claimed_at, NOW()),
      admin_notes = COALESCE(p_notes, admin_notes),
      updated_at = NOW()
    WHERE id = p_claim_id;

    -- Also link to public.domains table if portfolio_id exists
    IF v_claim.portfolio_id IS NOT NULL THEN
      INSERT INTO public.domains (
        portfolio_id,
        user_id,
        hostname,
        verification_status,
        connection_status,
        dns_records,
        verified_at
      ) VALUES (
        v_claim.portfolio_id,
        v_claim.user_id,
        v_claim.requested_domain,
        'connected',
        'active',
        jsonb_build_array(
          jsonb_build_object('type', 'CNAME', 'host', '@', 'value', 'cname.kaizenq.me', 'ttl', 300),
          jsonb_build_object('type', 'CNAME', 'host', 'www', 'value', 'cname.kaizenq.me', 'ttl', 300)
        ),
        NOW()
      )
      ON CONFLICT (hostname) DO UPDATE
        SET verification_status = 'connected',
            connection_status = 'active',
            verified_at = NOW(),
            updated_at = NOW();
    END IF;

  ELSIF p_action = 'reject' THEN
    v_new_status := 'rejected';
    UPDATE public.domain_claims
    SET
      status = v_new_status,
      rejection_reason = COALESCE(p_notes, 'Domain handle does not meet showcase standards or student eligibility requirements.'),
      admin_notes = COALESCE(p_notes, admin_notes),
      approved_by = v_admin_id,
      updated_at = NOW()
    WHERE id = p_claim_id;

  ELSE
    RAISE EXCEPTION 'Invalid review action. Allowed: approve, confirm_registered, mark_dns_pending, mark_active, reject'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 4. Audit Log
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
        'action', 'runner_winner_claim_reviewed',
        'claim_id', p_claim_id,
        'action_taken', p_action,
        'new_status', v_new_status,
        'reviewed_by', v_admin_id,
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
-- 12. Student RPC: Submit Domain DNS Verification
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_domain_dns_verification(
  p_claim_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_claim RECORD;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_claim
  FROM public.domain_claims
  WHERE id = p_claim_id AND user_id = v_caller_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Claim not found or unauthorized'
      USING ERRCODE = 'no_data_found';
  END IF;

  IF v_claim.status NOT IN ('registered', 'dns_pending') THEN
    RAISE EXCEPTION 'Domain must be registered before initiating DNS verification'
      USING ERRCODE = 'check_violation';
  END IF;

  UPDATE public.domain_claims
  SET
    status = 'dns_pending',
    dns_verification_status = 'pending',
    updated_at = NOW()
  WHERE id = p_claim_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'status', 'dns_pending',
    'message', 'DNS verification initiated. DNS propagation checks will proceed.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_domain_dns_verification(UUID) TO authenticated;
