-- =============================================================================
-- Migration: 20261009000004_storage_buckets.sql
-- Description: Supabase Storage Buckets & Policies for Avatars and Project Assets
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Create Storage Buckets
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('project-images', 'project-images', true, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- 2. Storage Policies: Avatars
-- -----------------------------------------------------------------------------
-- Public can view avatars
DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;
CREATE POLICY "avatars_public_select"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatars');

-- Authenticated users can upload avatars to their own folder: avatars/{user_id}/*
DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
CREATE POLICY "avatars_owner_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can update/replace their own avatars
DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can delete their own avatars
DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- -----------------------------------------------------------------------------
-- 3. Storage Policies: Project Images
-- -----------------------------------------------------------------------------
-- Public can view project images
DROP POLICY IF EXISTS "project_images_public_select" ON storage.objects;
CREATE POLICY "project_images_public_select"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'project-images');

-- Authenticated users can upload to their own folder: project-images/{user_id}/*
DROP POLICY IF EXISTS "project_images_owner_insert" ON storage.objects;
CREATE POLICY "project_images_owner_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can update/replace their own project images
DROP POLICY IF EXISTS "project_images_owner_update" ON storage.objects;
CREATE POLICY "project_images_owner_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'project-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can delete their own project images
DROP POLICY IF EXISTS "project_images_owner_delete" ON storage.objects;
CREATE POLICY "project_images_owner_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
