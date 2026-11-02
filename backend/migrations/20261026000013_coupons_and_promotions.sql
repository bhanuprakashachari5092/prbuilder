-- =============================================================================
-- Migration: 20261026000013_coupons_and_promotions.sql
-- Description: Complete Production-Grade Coupon & Promo Code System for PR Builder
-- Features:
--   - Multi-type discounts: percentage (1-100%), fixed (integer paise), 100% free-order
--   - Strict server-authoritative validations: product eligibility, min order, expiry, user groups, first purchase
--   - Concurrency-safe reservations & idempotency with FOR UPDATE row locks
--   - Zero-payable atomic fulfillment path (no fake UPI transactions for 100% coupons)
--   - Anti-abuse rate limiting & failed validation attempt auditing
--   - Full RLS protection & dedicated Admin oversight RPCs
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table: public.coupons
-- Stores promotion definitions, rules, discount values, and limits.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,
  max_redemptions_total INTEGER CHECK (max_redemptions_total IS NULL OR max_redemptions_total > 0),
  max_redemptions_per_user INTEGER NOT NULL DEFAULT 1 CHECK (max_redemptions_per_user > 0),
  min_order_amount_paise INTEGER NOT NULL DEFAULT 0 CHECK (min_order_amount_paise >= 0),
  eligible_product_ids TEXT[] DEFAULT '{}'::text[],
  eligible_user_groups TEXT[] DEFAULT '{}'::text[],
  first_purchase_only BOOLEAN NOT NULL DEFAULT FALSE,
  redemptions_count INTEGER NOT NULL DEFAULT 0 CHECK (redemptions_count >= 0),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_coupons_code UNIQUE (code),
  CONSTRAINT chk_coupons_percentage_range CHECK (
    discount_type != 'percentage' OR (discount_value >= 1 AND discount_value <= 100)
  ),
  CONSTRAINT chk_coupons_fixed_positive CHECK (
    discount_type != 'fixed' OR discount_value > 0
  )
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons (is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_expiry ON public.coupons (expiry_date);

-- -----------------------------------------------------------------------------
-- 2. Modify payment_orders to support zero-payable amounts and coupon references
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  -- Drop strict amount_paise > 0 constraint to allow zero-payable 100% discounted orders
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payment_orders_amount_paise_check'
  ) THEN
    ALTER TABLE public.payment_orders DROP CONSTRAINT payment_orders_amount_paise_check;
  END IF;
END $$;

ALTER TABLE public.payment_orders
  ADD CONSTRAINT payment_orders_amount_paise_check CHECK (amount_paise >= 0);

ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS original_amount_paise INTEGER,
  ADD COLUMN IF NOT EXISTS discount_amount_paise INTEGER DEFAULT 0;

-- -----------------------------------------------------------------------------
-- 3. Table: public.coupon_redemptions
-- Tracks reservation and permanent fulfillment of coupons per order & user.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL REFERENCES public.payment_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'fulfilled', 'cancelled', 'expired')),
  original_amount_paise INTEGER NOT NULL CHECK (original_amount_paise > 0),
  discount_amount_paise INTEGER NOT NULL CHECK (discount_amount_paise >= 0),
  final_amount_paise INTEGER NOT NULL CHECK (final_amount_paise >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ,
  CONSTRAINT uq_coupon_redemptions_order UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON public.coupon_redemptions (user_id, coupon_id, status);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON public.coupon_redemptions (coupon_id, status);

-- -----------------------------------------------------------------------------
-- 4. Table: public.coupon_validation_logs
-- Anti-abuse ledger to detect and rate-limit brute-force coupon guessing.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupon_validation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempted_code TEXT NOT NULL,
  is_valid BOOLEAN NOT NULL,
  error_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_validation_logs_rate ON public.coupon_validation_logs (user_id, is_valid, created_at DESC);

-- -----------------------------------------------------------------------------
-- 5. Row Level Security (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_validation_logs ENABLE ROW LEVEL SECURITY;

-- Coupons: Authenticated can view active coupons. Admins have full access.
DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
CREATE POLICY "Public can view active coupons" ON public.coupons
  FOR SELECT
  USING (
    is_active = TRUE
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admin manage coupons" ON public.coupons;
CREATE POLICY "Admin manage coupons" ON public.coupons
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Redemptions: Users can view their own redemptions. Admins can view all.
DROP POLICY IF EXISTS "Users view own redemptions" ON public.coupon_redemptions;
CREATE POLICY "Users view own redemptions" ON public.coupon_redemptions
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admin manage redemptions" ON public.coupon_redemptions;
CREATE POLICY "Admin manage redemptions" ON public.coupon_redemptions
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Validation logs: Admin only.
DROP POLICY IF EXISTS "Admin view validation logs" ON public.coupon_validation_logs;
CREATE POLICY "Admin view validation logs" ON public.coupon_validation_logs
  FOR SELECT
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. Helper Function: Check User Group Eligibility
-- Checks whether a user satisfies group requirements (e.g. hackathon, runner, winner, student)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_user_group_eligibility(
  p_user_id UUID,
  p_groups TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_email TEXT;
  v_group TEXT;
BEGIN
  IF p_groups IS NULL OR cardinality(p_groups) = 0 THEN
    RETURN TRUE;
  END IF;

  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;

  FOREACH v_group IN ARRAY p_groups
  LOOP
    v_group := LOWER(TRIM(v_group));
    -- 1. Check if user is marked as hackathon/event runner or winner in domain sponsorship
    IF v_group IN ('runner', 'winner', 'hackathon') THEN
      IF EXISTS (
        SELECT 1 FROM public.domain_sponsorship_eligibility
        WHERE LOWER(email) = LOWER(v_user_email)
          AND (category = v_group OR (v_group = 'hackathon' AND category IN ('runner', 'winner')))
          AND is_revoked = FALSE
      ) THEN
        RETURN TRUE;
      END IF;
    END IF;

    -- 2. Check if student academic email domain
    IF v_group = 'student' THEN
      IF v_user_email ~* '\.(edu|ac\.in|edu\.in|college\.edu|university\.edu)$' THEN
        RETURN TRUE;
      END IF;
    END IF;
  END LOOP;

  RETURN FALSE;
END;
$$;

-- -----------------------------------------------------------------------------
-- 7. Authoritative RPC: validate_coupon
-- Validates a coupon code against product, limits, expiry, rate limits, and returns discount breakdown.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_product_id TEXT,
  p_coupon_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_normalized_code TEXT;
  v_product RECORD;
  v_coupon RECORD;
  v_recent_failed_attempts INT;
  v_user_redemption_count INT;
  v_has_previous_orders BOOLEAN;
  v_discount_paise INT;
  v_final_paise INT;
  v_error_msg TEXT := NULL;
  v_group_eligible BOOLEAN;
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object(
      'valid', FALSE,
      'error', 'Authentication required to validate promo codes'
    );
  END IF;

  v_normalized_code := UPPER(TRIM(COALESCE(p_coupon_code, '')));
  IF v_normalized_code = '' THEN
    RETURN jsonb_build_object(
      'valid', FALSE,
      'error', 'Please enter a promo code'
    );
  END IF;

  -- 1. Anti-abuse rate limit check: Max 10 failed attempts within 5 minutes
  SELECT COUNT(*) INTO v_recent_failed_attempts
  FROM public.coupon_validation_logs
  WHERE user_id = v_caller
    AND is_valid = FALSE
    AND created_at >= NOW() - INTERVAL '5 minutes';

  IF v_recent_failed_attempts >= 10 THEN
    RETURN jsonb_build_object(
      'valid', FALSE,
      'error', 'Too many invalid coupon attempts. Please wait 5 minutes before trying again.'
    );
  END IF;

  -- 2. Lookup Product
  SELECT * INTO v_product
  FROM public.payment_products
  WHERE id = p_product_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', FALSE,
      'error', 'Selected product is not eligible or no longer active'
    );
  END IF;

  -- 3. Lookup Coupon
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE code = v_normalized_code;

  IF NOT FOUND THEN
    INSERT INTO public.coupon_validation_logs (user_id, attempted_code, is_valid, error_reason)
    VALUES (v_caller, v_normalized_code, FALSE, 'Coupon code does not exist');

    RETURN jsonb_build_object(
      'valid', FALSE,
      'error', 'Invalid promo code. Please verify and try again.'
    );
  END IF;

  -- 4. Check active status
  IF v_coupon.is_active = FALSE THEN
    v_error_msg := 'This promo code is currently inactive';
  -- 5. Check start date
  ELSIF v_coupon.start_date > NOW() THEN
    v_error_msg := 'This promo code is not yet active';
  -- 6. Check expiration
  ELSIF v_coupon.expiry_date IS NOT NULL AND v_coupon.expiry_date <= NOW() THEN
    v_error_msg := 'This promo code has expired';
  -- 7. Check total redemption cap
  ELSIF v_coupon.max_redemptions_total IS NOT NULL AND v_coupon.redemptions_count >= v_coupon.max_redemptions_total THEN
    v_error_msg := 'This promo code has reached its maximum total redemptions';
  -- 8. Check minimum order spend
  ELSIF v_product.price_paise < v_coupon.min_order_amount_paise THEN
    v_error_msg := 'Minimum order of ₹' || to_char(ROUND(v_coupon.min_order_amount_paise::numeric / 100.0, 2), 'FM999999990.00') || ' required for this coupon';
  -- 9. Check eligible products
  ELSIF v_coupon.eligible_product_ids IS NOT NULL
        AND cardinality(v_coupon.eligible_product_ids) > 0
        AND NOT (v_product.id = ANY(v_coupon.eligible_product_ids)) THEN
    v_error_msg := 'This promo code is not applicable to ' || v_product.name;
  END IF;

  -- 10. Check per-user redemption limit (excluding cancelled/expired)
  IF v_error_msg IS NULL THEN
    SELECT COUNT(*) INTO v_user_redemption_count
    FROM public.coupon_redemptions
    WHERE coupon_id = v_coupon.id
      AND user_id = v_caller
      AND status IN ('reserved', 'fulfilled');

    IF v_user_redemption_count >= v_coupon.max_redemptions_per_user THEN
      v_error_msg := 'You have already reached the redemption limit for this code';
    END IF;
  END IF;

  -- 11. Check first-purchase restriction
  IF v_error_msg IS NULL AND v_coupon.first_purchase_only = TRUE THEN
    SELECT EXISTS (
      SELECT 1 FROM public.payment_orders
      WHERE user_id = v_caller AND status = 'paid'
    ) INTO v_has_previous_orders;

    IF v_has_previous_orders THEN
      v_error_msg := 'This promo code is strictly reserved for your first purchase';
    END IF;
  END IF;

  -- 12. Check user group eligibility
  IF v_error_msg IS NULL AND v_coupon.eligible_user_groups IS NOT NULL AND cardinality(v_coupon.eligible_user_groups) > 0 THEN
    v_group_eligible := public.check_user_group_eligibility(v_caller, v_coupon.eligible_user_groups);
    IF NOT v_group_eligible THEN
      v_error_msg := 'This promotional offer is reserved for eligible verified participants (e.g. students or hackathon runners)';
    END IF;
  END IF;

  -- If any rule failed:
  IF v_error_msg IS NOT NULL THEN
    INSERT INTO public.coupon_validation_logs (user_id, attempted_code, is_valid, error_reason)
    VALUES (v_caller, v_normalized_code, FALSE, v_error_msg);

    RETURN jsonb_build_object(
      'valid', FALSE,
      'error', v_error_msg
    );
  END IF;

  -- 13. Authoritative discount calculation
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount_paise := ROUND((v_product.price_paise::numeric * v_coupon.discount_value::numeric) / 100.0);
  ELSE
    v_discount_paise := v_coupon.discount_value;
  END IF;

  -- Cap discount to original price (no negative balance)
  v_discount_paise := LEAST(v_product.price_paise, v_discount_paise);
  v_final_paise := v_product.price_paise - v_discount_paise;

  -- Record successful validation log
  INSERT INTO public.coupon_validation_logs (user_id, attempted_code, is_valid)
  VALUES (v_caller, v_normalized_code, TRUE);

  RETURN jsonb_build_object(
    'valid', TRUE,
    'couponId', v_coupon.id,
    'code', v_coupon.code,
    'discountType', v_coupon.discount_type,
    'discountValue', v_coupon.discount_value,
    'originalAmountPaise', v_product.price_paise,
    'discountAmountPaise', v_discount_paise,
    'finalAmountPaise', v_final_paise,
    'originalAmountRupees', ROUND(v_product.price_paise::numeric / 100.0, 2),
    'discountAmountRupees', ROUND(v_discount_paise::numeric / 100.0, 2),
    'finalAmountRupees', ROUND(v_final_paise::numeric / 100.0, 2),
    'isFree', (v_final_paise = 0),
    'message', CASE
      WHEN v_final_paise = 0 THEN '100% Discount Applied! Claim your free unlock.'
      WHEN v_coupon.discount_type = 'percentage' THEN v_coupon.discount_value || '% discount applied!'
      ELSE '₹' || ROUND(v_discount_paise::numeric / 100.0, 2) || ' discount applied!'
    END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_coupon(TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 8. Authoritative RPC: create_payment_order (With Coupon Support)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_payment_order(
  p_product_id TEXT,
  p_is_sandbox BOOLEAN DEFAULT FALSE,
  p_coupon_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_product RECORD;
  v_coupon RECORD;
  v_validation JSONB;
  v_order_id TEXT;
  v_upi_vpa TEXT := 'merchant@youpi';
  v_merchant_name TEXT := 'PR Builder';
  v_upi_uri TEXT;
  v_original_paise INT;
  v_discount_paise INT := 0;
  v_final_paise INT;
  v_amount_rupees NUMERIC;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Authenticate caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create a payment order';
  END IF;

  -- Authoritative server-side price lookup
  SELECT * INTO v_product
  FROM public.payment_products
  WHERE id = p_product_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or inactive product: %', p_product_id;
  END IF;

  v_original_paise := v_product.price_paise;
  v_final_paise := v_original_paise;

  -- If coupon code provided, validate with row-level lock on coupon
  IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) != '' THEN
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE code = UPPER(TRIM(p_coupon_code))
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid promo code: %', p_coupon_code;
    END IF;

    -- Validate via authoritative validation function
    v_validation := public.validate_coupon(p_product_id, v_coupon.code);
    IF (v_validation->>'valid')::boolean = FALSE THEN
      RAISE EXCEPTION '%', v_validation->>'error';
    END IF;

    v_discount_paise := (v_validation->>'discountAmountPaise')::int;
    v_final_paise := (v_validation->>'finalAmountPaise')::int;

    -- If final amount is 0, caller should invoke fulfill_free_order instead of standard UPI
    IF v_final_paise = 0 THEN
      RAISE EXCEPTION 'This coupon provides 100%% discount. Please use free order fulfillment.';
    END IF;
  END IF;

  -- Generate order ID: ORD_PRB_<YYYYMMDDHH24MISS>_<6HEX>
  v_order_id := 'ORD_PRB_' || to_char(NOW() AT TIME ZONE 'UTC', 'YYYYMMDDHH24MISS') || '_' || substr(md5(random()::text), 1, 6);
  v_expires_at := NOW() + INTERVAL '15 minutes';
  v_amount_rupees := ROUND((v_final_paise::numeric / 100.0), 2);

  -- Build NPCI UPI Intent URI based on final payable amount
  v_upi_uri := 'upi://pay?pa=' || v_upi_vpa ||
               '&pn=' || replace(v_merchant_name, ' ', '+') ||
               '&am=' || to_char(v_amount_rupees, 'FM999999990.00') ||
               '&cu=INR' ||
               '&tn=' || v_order_id;

  -- Insert order record
  INSERT INTO public.payment_orders (
    id,
    user_id,
    product_id,
    amount_paise,
    currency,
    status,
    upi_vpa,
    metadata,
    is_sandbox,
    expires_at,
    coupon_id,
    coupon_code,
    original_amount_paise,
    discount_amount_paise
  ) VALUES (
    v_order_id,
    v_user_id,
    v_product.id,
    v_final_paise,
    'INR',
    'pending',
    v_upi_vpa,
    jsonb_build_object(
      'productName', v_product.name,
      'category', v_product.category,
      'targetId', v_product.target_id,
      'couponApplied', (v_coupon.code IS NOT NULL),
      'couponCode', v_coupon.code,
      'discountPaise', v_discount_paise
    ),
    p_is_sandbox,
    v_expires_at,
    v_coupon.id,
    v_coupon.code,
    v_original_paise,
    v_discount_paise
  );

  -- If coupon was applied, reserve redemption atomically
  IF v_coupon.id IS NOT NULL THEN
    INSERT INTO public.coupon_redemptions (
      coupon_id,
      user_id,
      order_id,
      status,
      original_amount_paise,
      discount_amount_paise,
      final_amount_paise
    ) VALUES (
      v_coupon.id,
      v_user_id,
      v_order_id,
      'reserved',
      v_original_paise,
      v_discount_paise,
      v_final_paise
    );
  END IF;

  -- Audit log
  INSERT INTO public.payment_audit_logs (order_id, event_type, payload)
  VALUES (
    v_order_id,
    'order_created',
    jsonb_build_object(
      'userId', v_user_id,
      'productId', v_product.id,
      'originalAmountPaise', v_original_paise,
      'discountAmountPaise', v_discount_paise,
      'finalAmountPaise', v_final_paise,
      'couponCode', v_coupon.code,
      'isSandbox', p_is_sandbox
    )
  );

  RETURN jsonb_build_object(
    'orderId', v_order_id,
    'productId', v_product.id,
    'productName', v_product.name,
    'originalAmountPaise', v_original_paise,
    'discountAmountPaise', v_discount_paise,
    'amountPaise', v_final_paise,
    'amountRupees', v_amount_rupees,
    'currency', 'INR',
    'couponCode', v_coupon.code,
    'status', 'pending',
    'upiVpa', v_upi_vpa,
    'upiUri', v_upi_uri,
    'expiresAt', v_expires_at,
    'isSandbox', p_is_sandbox
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_payment_order(TEXT, BOOLEAN, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 9. Authoritative RPC: fulfill_free_order
-- Transactional, zero-payable order fulfillment for 100% coupons (no UPI needed).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fulfill_free_order(
  p_product_id TEXT,
  p_coupon_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_product RECORD;
  v_coupon RECORD;
  v_validation JSONB;
  v_order_id TEXT;
  v_entitlement_key TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required for free coupon unlock';
  END IF;

  -- 1. Product lookup
  SELECT * INTO v_product
  FROM public.payment_products
  WHERE id = p_product_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or inactive product: %', p_product_id;
  END IF;

  -- 2. Row-level lock on coupon
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE code = UPPER(TRIM(p_coupon_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid promo code: %', p_coupon_code;
  END IF;

  -- 3. Validate eligibility
  v_validation := public.validate_coupon(p_product_id, v_coupon.code);
  IF (v_validation->>'valid')::boolean = FALSE THEN
    RAISE EXCEPTION '%', v_validation->>'error';
  END IF;

  IF (v_validation->>'finalAmountPaise')::int != 0 THEN
    RAISE EXCEPTION 'This coupon does not provide a 100%% discount. Standard checkout is required.';
  END IF;

  -- 4. Create Free Order marked as paid
  v_order_id := 'ORD_FREE_' || to_char(NOW() AT TIME ZONE 'UTC', 'YYYYMMDDHH24MISS') || '_' || substr(md5(random()::text), 1, 6);

  INSERT INTO public.payment_orders (
    id,
    user_id,
    product_id,
    amount_paise,
    currency,
    status,
    utr,
    metadata,
    paid_at,
    coupon_id,
    coupon_code,
    original_amount_paise,
    discount_amount_paise
  ) VALUES (
    v_order_id,
    v_user_id,
    v_product.id,
    0,
    'INR',
    'paid',
    'FREE_COUPON_' || v_coupon.code,
    jsonb_build_object(
      'productName', v_product.name,
      'category', v_product.category,
      'targetId', v_product.target_id,
      'is100PercentPromo', TRUE,
      'couponCode', v_coupon.code
    ),
    NOW(),
    v_coupon.id,
    v_coupon.code,
    v_product.price_paise,
    v_product.price_paise
  );

  -- 5. Record fulfilled redemption & increment redemptions count
  INSERT INTO public.coupon_redemptions (
    coupon_id,
    user_id,
    order_id,
    status,
    original_amount_paise,
    discount_amount_paise,
    final_amount_paise,
    fulfilled_at
  ) VALUES (
    v_coupon.id,
    v_user_id,
    v_order_id,
    'fulfilled',
    v_product.price_paise,
    v_product.price_paise,
    0,
    NOW()
  );

  UPDATE public.coupons
  SET redemptions_count = redemptions_count + 1,
      updated_at = NOW()
  WHERE id = v_coupon.id;

  -- 6. Derive Entitlement Key
  IF v_product.category = 'resume_template' THEN
    v_entitlement_key := 'template:' || v_product.target_id;
  ELSIF v_product.category = 'portfolio_theme' THEN
    v_entitlement_key := 'theme:' || v_product.target_id;
  ELSIF v_product.category = 'domain_pass' THEN
    v_entitlement_key := 'domain:custom';
  ELSIF v_product.category = 'bundle' THEN
    v_entitlement_key := 'bundle:all_access';
  ELSE
    v_entitlement_key := 'feature:' || v_product.target_id;
  END IF;

  -- 7. Grant Entitlement
  INSERT INTO public.user_entitlements (
    user_id,
    product_id,
    entitlement_key,
    order_id,
    is_active,
    granted_at
  ) VALUES (
    v_user_id,
    v_product.id,
    v_entitlement_key,
    v_order_id,
    TRUE,
    NOW()
  )
  ON CONFLICT (user_id, entitlement_key)
  DO UPDATE SET
    is_active = TRUE,
    order_id = EXCLUDED.order_id,
    granted_at = NOW(),
    updated_at = NOW();

  -- If bundle, unlock child features
  IF v_product.category = 'bundle' THEN
    INSERT INTO public.user_entitlements (user_id, product_id, entitlement_key, order_id, is_active)
    VALUES
      (v_user_id, v_product.id, 'template:modern-professional', v_order_id, TRUE),
      (v_user_id, v_product.id, 'template:technical', v_order_id, TRUE),
      (v_user_id, v_product.id, 'theme:creative', v_order_id, TRUE),
      (v_user_id, v_product.id, 'theme:modern', v_order_id, TRUE),
      (v_user_id, v_product.id, 'domain:custom', v_order_id, TRUE)
    ON CONFLICT (user_id, entitlement_key)
    DO UPDATE SET is_active = TRUE, updated_at = NOW();
  END IF;

  -- 8. Audit Log
  INSERT INTO public.payment_audit_logs (order_id, event_type, payload)
  VALUES (
    v_order_id,
    'free_order_fulfilled',
    jsonb_build_object(
      'userId', v_user_id,
      'productId', v_product.id,
      'couponCode', v_coupon.code,
      'entitlementKey', v_entitlement_key,
      'originalAmountPaise', v_product.price_paise
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'status', 'paid',
    'isFree', TRUE,
    'orderId', v_order_id,
    'entitlementKey', v_entitlement_key,
    'utr', 'FREE_COUPON_' || v_coupon.code,
    'paidAt', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fulfill_free_order(TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 10. Update verify_and_fulfill_payment to finalize reserved coupon redemptions
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_and_fulfill_payment(
  p_order_id TEXT,
  p_utr TEXT DEFAULT NULL,
  p_signature TEXT DEFAULT NULL,
  p_raw_payload TEXT DEFAULT NULL,
  p_is_sandbox BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order RECORD;
  v_product RECORD;
  v_caller UUID;
  v_entitlement_key TEXT;
  v_effective_utr TEXT;
BEGIN
  v_caller := auth.uid();

  -- Fetch order with row-level lock
  SELECT * INTO v_order
  FROM public.payment_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  IF NOT public.is_admin() THEN
    IF v_caller IS NULL OR v_caller != v_order.user_id THEN
      RAISE EXCEPTION 'Unauthorized to fulfill payment order';
    END IF;
  END IF;

  IF v_order.status = 'paid' THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'status', 'paid',
      'orderId', v_order.id,
      'alreadyFulfilled', TRUE,
      'paidAt', v_order.paid_at
    );
  END IF;

  IF v_order.status IN ('expired', 'cancelled') THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'status', v_order.status,
      'orderId', v_order.id,
      'error', 'Order has already been ' || v_order.status
    );
  END IF;

  SELECT * INTO v_product
  FROM public.payment_products
  WHERE id = v_order.product_id;

  IF v_product.category = 'resume_template' THEN
    v_entitlement_key := 'template:' || v_product.target_id;
  ELSIF v_product.category = 'portfolio_theme' THEN
    v_entitlement_key := 'theme:' || v_product.target_id;
  ELSIF v_product.category = 'domain_pass' THEN
    v_entitlement_key := 'domain:custom';
  ELSIF v_product.category = 'bundle' THEN
    v_entitlement_key := 'bundle:all_access';
  ELSE
    v_entitlement_key := 'feature:' || v_product.target_id;
  END IF;

  v_effective_utr := COALESCE(p_utr, 'UTR' || to_char(NOW(), 'YYMMDDHH24MISS') || substr(md5(random()::text), 1, 6));

  -- 1. Mark order as paid
  UPDATE public.payment_orders
  SET
    status = 'paid',
    utr = v_effective_utr,
    paid_at = NOW(),
    updated_at = NOW()
  WHERE id = v_order.id;

  -- 2. Finalize any reserved coupon redemption & increment coupon count
  IF v_order.coupon_id IS NOT NULL THEN
    UPDATE public.coupon_redemptions
    SET status = 'fulfilled',
        fulfilled_at = NOW()
    WHERE order_id = v_order.id AND status = 'reserved';

    UPDATE public.coupons
    SET redemptions_count = redemptions_count + 1,
        updated_at = NOW()
    WHERE id = v_order.coupon_id;
  END IF;

  -- 3. Grant entitlement
  INSERT INTO public.user_entitlements (
    user_id,
    product_id,
    entitlement_key,
    order_id,
    is_active,
    granted_at
  ) VALUES (
    v_order.user_id,
    v_product.id,
    v_entitlement_key,
    v_order.id,
    TRUE,
    NOW()
  )
  ON CONFLICT (user_id, entitlement_key)
  DO UPDATE SET
    is_active = TRUE,
    order_id = EXCLUDED.order_id,
    granted_at = NOW(),
    updated_at = NOW();

  IF v_product.category = 'bundle' THEN
    INSERT INTO public.user_entitlements (user_id, product_id, entitlement_key, order_id, is_active)
    VALUES
      (v_order.user_id, v_product.id, 'template:modern-professional', v_order.id, TRUE),
      (v_order.user_id, v_product.id, 'template:technical', v_order.id, TRUE),
      (v_order.user_id, v_product.id, 'theme:creative', v_order.id, TRUE),
      (v_order.user_id, v_product.id, 'theme:modern', v_order.id, TRUE),
      (v_order.user_id, v_product.id, 'domain:custom', v_order.id, TRUE)
    ON CONFLICT (user_id, entitlement_key)
    DO UPDATE SET is_active = TRUE, updated_at = NOW();
  END IF;

  -- 4. Audit log
  INSERT INTO public.payment_audit_logs (
    order_id,
    event_type,
    payload,
    signature
  ) VALUES (
    v_order.id,
    'payment_verified',
    jsonb_build_object(
      'userId', v_order.user_id,
      'utr', v_effective_utr,
      'entitlementKey', v_entitlement_key,
      'couponCode', v_order.coupon_code,
      'isSandbox', p_is_sandbox,
      'rawPayload', p_raw_payload
    ),
    p_signature
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'status', 'paid',
    'orderId', v_order.id,
    'utr', v_effective_utr,
    'entitlementKey', v_entitlement_key,
    'paidAt', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_and_fulfill_payment(TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_and_fulfill_payment(TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO anon;

-- -----------------------------------------------------------------------------
-- 11. Update cancel_payment_order to release reserved coupon redemptions
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_payment_order(
  p_order_id TEXT,
  p_reason TEXT DEFAULT 'User cancelled'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_order RECORD;
BEGIN
  SELECT * INTO v_order
  FROM public.payment_orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  IF NOT public.is_admin() AND (v_caller IS NULL OR v_caller != v_order.user_id) THEN
    RAISE EXCEPTION 'Unauthorized to cancel this order';
  END IF;

  IF v_order.status = 'paid' THEN
    RAISE EXCEPTION 'Cannot cancel a paid order';
  END IF;

  UPDATE public.payment_orders
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = v_order.id;

  -- Release any reserved coupon redemption
  UPDATE public.coupon_redemptions
  SET status = 'cancelled'
  WHERE order_id = v_order.id AND status = 'reserved';

  INSERT INTO public.payment_audit_logs (order_id, event_type, payload)
  VALUES (
    v_order.id,
    'order_cancelled',
    jsonb_build_object('reason', p_reason, 'cancelledBy', v_caller)
  );

  RETURN jsonb_build_object('success', TRUE, 'status', 'cancelled', 'orderId', v_order.id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_payment_order(TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 12. Admin RPC: get_admin_coupons
-- Paginated, searchable, filterable list of all coupons for Admin console.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_coupons(
  p_search TEXT DEFAULT NULL,
  p_status_filter TEXT DEFAULT 'all',
  p_type_filter TEXT DEFAULT 'all',
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
  v_page INT := GREATEST(1, COALESCE(p_page, 1));
  v_size INT := GREATEST(1, LEAST(100, COALESCE(p_page_size, 15)));
  v_offset INT := (v_page - 1) * v_size;
  v_total BIGINT;
  v_items JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  -- Count total matching rows
  SELECT COUNT(*) INTO v_total
  FROM public.coupons c
  WHERE (p_search IS NULL OR c.code ILIKE '%' || p_search || '%' OR c.description ILIKE '%' || p_search || '%')
    AND (
      p_status_filter = 'all'
      OR (p_status_filter = 'active' AND c.is_active = TRUE AND (c.expiry_date IS NULL OR c.expiry_date > NOW()))
      OR (p_status_filter = 'inactive' AND c.is_active = FALSE)
      OR (p_status_filter = 'expired' AND c.expiry_date IS NOT NULL AND c.expiry_date <= NOW())
    )
    AND (p_type_filter = 'all' OR c.discount_type = p_type_filter);

  -- Fetch items
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'code', c.code,
      'description', c.description,
      'discountType', c.discount_type,
      'discountValue', c.discount_value,
      'isActive', c.is_active,
      'startDate', c.start_date,
      'expiryDate', c.expiry_date,
      'maxRedemptionsTotal', c.max_redemptions_total,
      'maxRedemptionsPerUser', c.max_redemptions_per_user,
      'minOrderAmountPaise', c.min_order_amount_paise,
      'minOrderAmountRupees', ROUND(c.min_order_amount_paise::numeric / 100.0, 2),
      'eligibleProductIds', c.eligible_product_ids,
      'eligibleUserGroups', c.eligible_user_groups,
      'firstPurchaseOnly', c.first_purchase_only,
      'redemptionsCount', c.redemptions_count,
      'isExpired', (c.expiry_date IS NOT NULL AND c.expiry_date <= NOW()),
      'createdAt', c.created_at,
      'updatedAt', c.updated_at
    )
  ), '[]'::jsonb) INTO v_items
  FROM (
    SELECT *
    FROM public.coupons c
    WHERE (p_search IS NULL OR c.code ILIKE '%' || p_search || '%' OR c.description ILIKE '%' || p_search || '%')
      AND (
        p_status_filter = 'all'
        OR (p_status_filter = 'active' AND c.is_active = TRUE AND (c.expiry_date IS NULL OR c.expiry_date > NOW()))
        OR (p_status_filter = 'inactive' AND c.is_active = FALSE)
        OR (p_status_filter = 'expired' AND c.expiry_date IS NOT NULL AND c.expiry_date <= NOW())
      )
      AND (p_type_filter = 'all' OR c.discount_type = p_type_filter)
    ORDER BY
      CASE WHEN p_sort_by = 'code' AND p_sort_dir = 'asc' THEN c.code END ASC,
      CASE WHEN p_sort_by = 'code' AND p_sort_dir = 'desc' THEN c.code END DESC,
      CASE WHEN p_sort_by = 'redemptions' AND p_sort_dir = 'asc' THEN c.redemptions_count END ASC,
      CASE WHEN p_sort_by = 'redemptions' AND p_sort_dir = 'desc' THEN c.redemptions_count END DESC,
      CASE WHEN p_sort_by = 'expiry' AND p_sort_dir = 'asc' THEN c.expiry_date END ASC,
      CASE WHEN p_sort_by = 'expiry' AND p_sort_dir = 'desc' THEN c.expiry_date END DESC,
      c.created_at DESC
    LIMIT v_size OFFSET v_offset
  ) c;

  RETURN jsonb_build_object(
    'items', v_items,
    'total', v_total,
    'page', v_page,
    'pageSize', v_size,
    'totalPages', CEIL(v_total::numeric / v_size::numeric)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_coupons(TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 13. Admin RPC: get_admin_coupon_redemptions
-- Fetches full redemption history with user details, product, original & final price.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_coupon_redemptions(
  p_coupon_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
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
  v_page INT := GREATEST(1, COALESCE(p_page, 1));
  v_size INT := GREATEST(1, LEAST(100, COALESCE(p_page_size, 15)));
  v_offset INT := (v_page - 1) * v_size;
  v_total BIGINT;
  v_items JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM public.coupon_redemptions cr
  JOIN public.coupons c ON c.id = cr.coupon_id
  LEFT JOIN public.profiles p ON p.id = cr.user_id
  WHERE (p_coupon_id IS NULL OR cr.coupon_id = p_coupon_id)
    AND (
      p_search IS NULL
      OR c.code ILIKE '%' || p_search || '%'
      OR cr.order_id ILIKE '%' || p_search || '%'
      OR p.display_name ILIKE '%' || p_search || '%'
      OR p.full_name ILIKE '%' || p_search || '%'
    );

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'couponId', q.coupon_id,
      'couponCode', q.code,
      'userId', q.user_id,
      'userName', COALESCE(q.full_name, q.display_name, 'Student User'),
      'orderId', q.order_id,
      'status', q.status,
      'originalAmountPaise', q.original_amount_paise,
      'discountAmountPaise', q.discount_amount_paise,
      'finalAmountPaise', q.final_amount_paise,
      'originalAmountRupees', ROUND(q.original_amount_paise::numeric / 100.0, 2),
      'discountAmountRupees', ROUND(q.discount_amount_paise::numeric / 100.0, 2),
      'finalAmountRupees', ROUND(q.final_amount_paise::numeric / 100.0, 2),
      'createdAt', q.created_at,
      'fulfilledAt', q.fulfilled_at
    )
  ), '[]'::jsonb) INTO v_items
  FROM (
    SELECT
      cr.*,
      c.code,
      p.display_name,
      p.full_name
    FROM public.coupon_redemptions cr
    JOIN public.coupons c ON c.id = cr.coupon_id
    LEFT JOIN public.profiles p ON p.id = cr.user_id
    WHERE (p_coupon_id IS NULL OR cr.coupon_id = p_coupon_id)
      AND (
        p_search IS NULL
        OR c.code ILIKE '%' || p_search || '%'
        OR cr.order_id ILIKE '%' || p_search || '%'
        OR p.display_name ILIKE '%' || p_search || '%'
        OR p.full_name ILIKE '%' || p_search || '%'
      )
    ORDER BY cr.created_at DESC
    LIMIT v_size OFFSET v_offset
  ) q;

  RETURN jsonb_build_object(
    'items', v_items,
    'total', v_total,
    'page', v_page,
    'pageSize', v_size,
    'totalPages', CEIL(v_total::numeric / v_size::numeric)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_coupon_redemptions(UUID, TEXT, INT, INT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 14. Admin RPC: create_or_update_coupon
-- Safe Admin-only mutating RPC that validates inputs, normalizes code, and enforces bounds.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_or_update_coupon(
  p_coupon_id UUID DEFAULT NULL,
  p_code TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_discount_type TEXT DEFAULT 'percentage',
  p_discount_value INT DEFAULT 10,
  p_is_active BOOLEAN DEFAULT TRUE,
  p_start_date TIMESTAMPTZ DEFAULT NOW(),
  p_expiry_date TIMESTAMPTZ DEFAULT NULL,
  p_max_total INT DEFAULT NULL,
  p_max_per_user INT DEFAULT 1,
  p_min_order_paise INT DEFAULT 0,
  p_eligible_products TEXT[] DEFAULT '{}'::text[],
  p_eligible_user_groups TEXT[] DEFAULT '{}'::text[],
  p_first_purchase_only BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_clean_code TEXT;
  v_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  v_clean_code := UPPER(TRIM(COALESCE(p_code, '')));
  IF v_clean_code = '' THEN
    RAISE EXCEPTION 'Coupon code cannot be empty';
  END IF;

  IF p_discount_type NOT IN ('percentage', 'fixed') THEN
    RAISE EXCEPTION 'Invalid discount type. Must be percentage or fixed.';
  END IF;

  IF p_discount_type = 'percentage' AND (p_discount_value < 1 OR p_discount_value > 100) THEN
    RAISE EXCEPTION 'Percentage discount must be between 1 and 100';
  END IF;

  IF p_discount_type = 'fixed' AND p_discount_value <= 0 THEN
    RAISE EXCEPTION 'Fixed discount value in paise must be greater than 0';
  END IF;

  IF p_expiry_date IS NOT NULL AND p_expiry_date <= p_start_date THEN
    RAISE EXCEPTION 'Expiry date must be after start date';
  END IF;

  IF p_coupon_id IS NULL THEN
    -- INSERT
    INSERT INTO public.coupons (
      code,
      description,
      discount_type,
      discount_value,
      is_active,
      start_date,
      expiry_date,
      max_redemptions_total,
      max_redemptions_per_user,
      min_order_amount_paise,
      eligible_product_ids,
      eligible_user_groups,
      first_purchase_only,
      created_by
    ) VALUES (
      v_clean_code,
      p_description,
      p_discount_type,
      p_discount_value,
      COALESCE(p_is_active, TRUE),
      COALESCE(p_start_date, NOW()),
      p_expiry_date,
      p_max_total,
      GREATEST(1, COALESCE(p_max_per_user, 1)),
      GREATEST(0, COALESCE(p_min_order_paise, 0)),
      COALESCE(p_eligible_products, '{}'::text[]),
      COALESCE(p_eligible_user_groups, '{}'::text[]),
      COALESCE(p_first_purchase_only, FALSE),
      v_admin_id
    )
    RETURNING id INTO v_id;

    -- Audit log
    INSERT INTO public.admin_audit_logs (admin_id, action, target_id, target_type, outcome, metadata)
    VALUES (
      v_admin_id,
      'create_coupon',
      v_id::text,
      'coupon',
      'success',
      jsonb_build_object('code', v_clean_code, 'discountType', p_discount_type, 'discountValue', p_discount_value)
    );
  ELSE
    -- UPDATE
    UPDATE public.coupons
    SET
      code = v_clean_code,
      description = p_description,
      discount_type = p_discount_type,
      discount_value = p_discount_value,
      is_active = COALESCE(p_is_active, is_active),
      start_date = COALESCE(p_start_date, start_date),
      expiry_date = p_expiry_date,
      max_redemptions_total = p_max_total,
      max_redemptions_per_user = GREATEST(1, COALESCE(p_max_per_user, 1)),
      min_order_amount_paise = GREATEST(0, COALESCE(p_min_order_paise, 0)),
      eligible_product_ids = COALESCE(p_eligible_products, eligible_product_ids),
      eligible_user_groups = COALESCE(p_eligible_user_groups, eligible_user_groups),
      first_purchase_only = COALESCE(p_first_purchase_only, first_purchase_only),
      updated_at = NOW()
    WHERE id = p_coupon_id
    RETURNING id INTO v_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Coupon not found: %', p_coupon_id;
    END IF;

    -- Audit log
    INSERT INTO public.admin_audit_logs (admin_id, action, target_id, target_type, outcome, metadata)
    VALUES (
      v_admin_id,
      'update_coupon',
      v_id::text,
      'coupon',
      'success',
      jsonb_build_object('code', v_clean_code, 'discountType', p_discount_type, 'discountValue', p_discount_value)
    );
  END IF;

  RETURN jsonb_build_object('success', TRUE, 'couponId', v_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_or_update_coupon(UUID, TEXT, TEXT, TEXT, INT, BOOLEAN, TIMESTAMPTZ, TIMESTAMPTZ, INT, INT, INT, TEXT[], TEXT[], BOOLEAN) TO authenticated;
