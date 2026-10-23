-- =============================================================================
-- Migration: 20261023000009_configure_admin_credentials.sql
-- Description: Configure primary admin credentials (admin@gmail.com)
-- =============================================================================

-- 1. Update public.is_admin() to recognize admin@gmail.com as authorized administrator
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

-- 2. Update existing profiles for admin@gmail.com to is_admin = true
UPDATE public.profiles
SET is_admin = TRUE
WHERE id IN (
  SELECT id FROM auth.users WHERE LOWER(email) IN ('admin@gmail.com', 'bhanuprakashachari5092@gmail.com')
);

-- 3. Enhance handle_new_user() trigger function to auto-assign is_admin = true
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN := FALSE;
BEGIN
  IF LOWER(NEW.email) IN ('admin@gmail.com', 'bhanuprakashachari5092@gmail.com') THEN
    v_is_admin := TRUE;
  END IF;

  INSERT INTO public.profiles (id, display_name, headline, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'headline', CASE WHEN v_is_admin THEN 'Platform Administrator' ELSE 'Software Engineering Student' END),
    v_is_admin
  )
  ON CONFLICT (id) DO UPDATE
  SET is_admin = CASE
    WHEN LOWER(NEW.email) IN ('admin@gmail.com', 'bhanuprakashachari5092@gmail.com') THEN TRUE
    ELSE profiles.is_admin
  END;

  RETURN NEW;
END;
$$;
