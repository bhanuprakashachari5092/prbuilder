-- =============================================================================
-- PR BUILDER: MIGRATION 16 - CUSTOM PRICING CALCULATOR & DRAFT PRODUCTS
-- Provides resilient selection-based cart pricing handling free templates + addons,
-- and admin draft proposed products lifecycle with audit logging.
-- =============================================================================

-- 1. Upgrade calculate_cart_pricing to handle free base templates + optional addons
CREATE OR REPLACE FUNCTION public.calculate_cart_pricing(
  p_product_id TEXT,
  p_addon_ids TEXT[] DEFAULT '{}',
  p_coupon_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_base_product RECORD;
  v_addon RECORD;
  v_items JSONB := '[]'::jsonb;
  v_subtotal_paise INTEGER := 0;
  v_bundle_savings_paise INTEGER := 0;
  v_discount_paise INTEGER := 0;
  v_final_paise INTEGER := 0;
  v_coupon_validation JSONB;
  v_is_all_access BOOLEAN := FALSE;
  v_effective_base_id TEXT := p_product_id;
  v_addon_id TEXT;
BEGIN
  -- Handle bundle precedence: if All-Access pass is in base or addons, it overrides everything
  IF p_product_id = 'pro-all-access-pass' OR ('pro-all-access-pass' = ANY(p_addon_ids)) THEN
    v_effective_base_id := 'pro-all-access-pass';
    v_is_all_access := TRUE;
    v_bundle_savings_paise := 49600; -- ₹496 savings vs individual products
  END IF;

  -- 1. Fetch base product if configured in catalog
  SELECT * INTO v_base_product
  FROM public.payment_products
  WHERE id = v_effective_base_id AND is_active = TRUE;

  IF FOUND THEN
    v_items := v_items || jsonb_build_object(
      'productId', v_base_product.id,
      'name', v_base_product.name,
      'category', v_base_product.category,
      'pricePaise', v_base_product.price_paise,
      'priceRupees', ROUND(v_base_product.price_paise::numeric / 100.0, 2),
      'isBase', TRUE
    );
    v_subtotal_paise := v_subtotal_paise + v_base_product.price_paise;
  ELSE
    -- If base is a free template (e.g. classic-ats, minimal, developer) or unpriced base
    -- Add a ₹0 free tier line item
    v_items := v_items || jsonb_build_object(
      'productId', p_product_id,
      'name', INITCAP(REPLACE(p_product_id, '-', ' ')) || ' (Free Tier)',
      'category', 'free_tier',
      'pricePaise', 0,
      'priceRupees', 0.00,
      'isBase', TRUE
    );
  END IF;

  -- 2. Add requested addons (if not All-Access)
  IF NOT v_is_all_access AND p_addon_ids IS NOT NULL THEN
    FOREACH v_addon_id IN ARRAY p_addon_ids
    LOOP
      IF v_addon_id <> v_effective_base_id THEN
        SELECT * INTO v_addon
        FROM public.payment_products
        WHERE id = v_addon_id AND is_active = TRUE;

        IF FOUND THEN
          v_items := v_items || jsonb_build_object(
            'productId', v_addon.id,
            'name', v_addon.name,
            'category', v_addon.category,
            'pricePaise', v_addon.price_paise,
            'priceRupees', ROUND(v_addon.price_paise::numeric / 100.0, 2),
            'isBase', FALSE
          );
          v_subtotal_paise := v_subtotal_paise + v_addon.price_paise;
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- 3. Calculate coupon discount if code provided and subtotal > 0
  IF v_subtotal_paise > 0 AND p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) <> '' THEN
    v_coupon_validation := public.validate_coupon(v_effective_base_id, UPPER(TRIM(p_coupon_code)));
    IF (v_coupon_validation->>'valid')::boolean = TRUE THEN
      v_discount_paise := (v_coupon_validation->>'discountAmountPaise')::integer;
      v_discount_paise := LEAST(v_subtotal_paise, v_discount_paise);
    END IF;
  END IF;

  v_final_paise := GREATEST(0, v_subtotal_paise - v_discount_paise);

  RETURN jsonb_build_object(
    'items', v_items,
    'subtotalPaise', v_subtotal_paise,
    'subtotalRupees', ROUND(v_subtotal_paise::numeric / 100.0, 2),
    'bundleSavingsPaise', v_bundle_savings_paise,
    'bundleSavingsRupees', ROUND(v_bundle_savings_paise::numeric / 100.0, 2),
    'discountPaise', v_discount_paise,
    'discountRupees', ROUND(v_discount_paise::numeric / 100.0, 2),
    'taxesPaise', 0,
    'taxesRupees', 0.00,
    'taxesNote', 'GST Included',
    'finalAmountPaise', v_final_paise,
    'finalAmountRupees', ROUND(v_final_paise::numeric / 100.0, 2),
    'isFree', (v_final_paise = 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_cart_pricing(TEXT, TEXT[], TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_cart_pricing(TEXT, TEXT[], TEXT) TO anon;

-- 2. Admin RPC: approve_draft_product
-- Allows authorized admin to formally configure a draft add-on product with audit logging.
CREATE OR REPLACE FUNCTION public.approve_draft_product(
  p_product_id TEXT,
  p_name TEXT,
  p_description TEXT,
  p_category TEXT,
  p_target_id TEXT,
  p_price_paise INTEGER,
  p_reason TEXT DEFAULT 'Admin approval of proposed add-on product'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_is_admin BOOLEAN := FALSE;
  v_existing_id TEXT;
BEGIN
  -- Verify caller is administrator
  IF v_caller_id IS NOT NULL THEN
    SELECT (role = 'admin') INTO v_is_admin
    FROM public.profiles
    WHERE id = v_caller_id;
  END IF;

  -- Allow in sandbox / service role mode or if admin
  IF NOT v_is_admin AND v_caller_id IS NOT NULL THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required to approve catalog products';
  END IF;

  IF p_price_paise < 0 THEN
    RAISE EXCEPTION 'Price must be a positive integer in paise';
  END IF;

  -- Upsert product into payment_products
  INSERT INTO public.payment_products (
    id,
    name,
    description,
    category,
    target_id,
    price_paise,
    currency,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    p_product_id,
    p_name,
    p_description,
    p_category,
    p_target_id,
    p_price_paise,
    'INR',
    TRUE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    price_paise = EXCLUDED.price_paise,
    is_active = TRUE,
    updated_at = NOW();

  -- Log action into payment_audit_logs
  INSERT INTO public.payment_audit_logs (
    product_id,
    admin_id,
    old_price_paise,
    new_price_paise,
    reason,
    created_at
  ) VALUES (
    p_product_id,
    v_caller_id,
    0,
    p_price_paise,
    COALESCE(p_reason, 'Admin approved product into catalog'),
    NOW()
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'productId', p_product_id,
    'pricePaise', p_price_paise,
    'priceRupees', ROUND(p_price_paise::numeric / 100.0, 2),
    'message', 'Product approved and added to catalog successfully'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_draft_product(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT) TO authenticated;
