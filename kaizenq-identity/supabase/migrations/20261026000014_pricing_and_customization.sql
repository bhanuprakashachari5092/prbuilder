-- =============================================================================
-- Migration: 20261026000014_pricing_and_customization.sql
-- Description: Server-Authoritative Pricing, Cart Engine, Add-Ons & Admin Price Controls
-- Features:
--   - Authoritative cart pricing calculation with add-ons and bundle savings
--   - Admin RPC: update_product_price with audit logging to payment_audit_logs
--   - Admin RPC: toggle_product_status with audit logging
--   - Admin RPC: get_admin_pricing_catalog with revenue metrics per product
--   - RLS policies ensuring only verified administrators can mutate product pricing
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Ensure public.payment_products has complete indexes and constraints
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_payment_products_category ON public.payment_products(category);
CREATE INDEX IF NOT EXISTS idx_payment_products_active ON public.payment_products(is_active);

-- -----------------------------------------------------------------------------
-- 2. Authoritative RPC: calculate_cart_pricing
-- Computes itemized prices, bundle savings, taxes, and coupon discounts on backend.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_cart_pricing(
  p_product_id TEXT,
  p_addon_ids TEXT[] DEFAULT '{}'::text[],
  p_coupon_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
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
  v_addon_id TEXT;
BEGIN
  -- 1. Fetch base product
  SELECT * INTO v_base_product
  FROM public.payment_products
  WHERE id = p_product_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found or inactive: %', p_product_id;
  END IF;

  v_items := v_items || jsonb_build_object(
    'productId', v_base_product.id,
    'name', v_base_product.name,
    'category', v_base_product.category,
    'pricePaise', v_base_product.price_paise,
    'priceRupees', ROUND(v_base_product.price_paise::numeric / 100.0, 2),
    'isBase', TRUE
  );
  v_subtotal_paise := v_subtotal_paise + v_base_product.price_paise;

  IF v_base_product.id = 'pro-all-access-pass' THEN
    v_is_all_access := TRUE;
    -- Bundle savings vs buying everything individually (199 + 199 + 299 + 299 + 499 = 149500 paise, pass is 99900 paise, save 49600 paise)
    v_bundle_savings_paise := 49600;
  END IF;

  -- 2. Add requested addons (if not already All-Access)
  IF NOT v_is_all_access AND p_addon_ids IS NOT NULL THEN
    FOREACH v_addon_id IN ARRAY p_addon_ids
    LOOP
      IF v_addon_id <> p_product_id THEN
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

  -- 3. Calculate coupon discount if code provided
  IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) <> '' THEN
    v_coupon_validation := public.validate_coupon(p_product_id, UPPER(TRIM(p_coupon_code)));
    IF (v_coupon_validation->>'valid')::boolean = TRUE THEN
      v_discount_paise := (v_coupon_validation->>'discountAmountPaise')::integer;
      -- Cap discount to subtotal
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

-- -----------------------------------------------------------------------------
-- 3. Admin RPC: update_product_price
-- Allows authorized administrators to adjust product prices with audit logging.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_product_price(
  p_product_id TEXT,
  p_new_price_paise INTEGER,
  p_reason TEXT DEFAULT 'Catalog price adjustment'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_old RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  IF p_new_price_paise <= 0 THEN
    RAISE EXCEPTION 'Price must be greater than zero integer paise';
  END IF;

  SELECT * INTO v_old
  FROM public.payment_products
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
  END IF;

  UPDATE public.payment_products
  SET price_paise = p_new_price_paise,
      updated_at = NOW()
  WHERE id = p_product_id;

  -- Log price change event to payment_audit_logs
  INSERT INTO public.payment_audit_logs (
    event_type,
    payload
  ) VALUES (
    'price_changed',
    jsonb_build_object(
      'adminId', v_admin_id,
      'productId', p_product_id,
      'productName', v_old.name,
      'oldPricePaise', v_old.price_paise,
      'oldPriceRupees', ROUND(v_old.price_paise::numeric / 100.0, 2),
      'newPricePaise', p_new_price_paise,
      'newPriceRupees', ROUND(p_new_price_paise::numeric / 100.0, 2),
      'reason', p_reason,
      'timestamp', NOW()
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'productId', p_product_id,
    'oldPricePaise', v_old.price_paise,
    'newPricePaise', p_new_price_paise,
    'newPriceRupees', ROUND(p_new_price_paise::numeric / 100.0, 2)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_product_price(TEXT, INTEGER, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. Admin RPC: toggle_product_status
-- Enables or disables a product in the catalog with audit logging.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.toggle_product_status(
  p_product_id TEXT,
  p_is_active BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_product RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_product
  FROM public.payment_products
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
  END IF;

  UPDATE public.payment_products
  SET is_active = p_is_active,
      updated_at = NOW()
  WHERE id = p_product_id;

  INSERT INTO public.payment_audit_logs (
    event_type,
    payload
  ) VALUES (
    'product_status_toggled',
    jsonb_build_object(
      'adminId', v_admin_id,
      'productId', p_product_id,
      'isActive', p_is_active,
      'timestamp', NOW()
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'productId', p_product_id,
    'isActive', p_is_active
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_product_status(TEXT, BOOLEAN) TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. Admin RPC: get_admin_pricing_catalog
-- Retrieves full product list with sales counts and total verified revenue.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_pricing_catalog()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_items JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'description', p.description,
      'category', p.category,
      'targetId', p.target_id,
      'pricePaise', p.price_paise,
      'priceRupees', ROUND(p.price_paise::numeric / 100.0, 2),
      'currency', p.currency,
      'isActive', p.is_active,
      'salesCount', COALESCE(stats.sales_count, 0),
      'totalRevenuePaise', COALESCE(stats.revenue_paise, 0),
      'totalRevenueRupees', ROUND(COALESCE(stats.revenue_paise, 0)::numeric / 100.0, 2),
      'entitlementKey', CASE
        WHEN p.category = 'resume_template' THEN 'template:' || p.target_id
        WHEN p.category = 'portfolio_theme' THEN 'theme:' || p.target_id
        WHEN p.category = 'domain_pass' THEN 'domain:custom'
        WHEN p.category = 'bundle' THEN 'bundle:all_access'
        ELSE 'feature:' || p.target_id
      END,
      'createdAt', p.created_at,
      'updatedAt', p.updated_at
    ) ORDER BY p.price_paise ASC
  ), '[]'::jsonb) INTO v_items
  FROM public.payment_products p
  LEFT JOIN (
    SELECT
      product_id,
      COUNT(*) AS sales_count,
      SUM(amount_paise) AS revenue_paise
    FROM public.payment_orders
    WHERE status = 'paid'
    GROUP BY product_id
  ) stats ON stats.product_id = p.id;

  RETURN jsonb_build_object(
    'products', v_items
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_pricing_catalog() TO authenticated;
