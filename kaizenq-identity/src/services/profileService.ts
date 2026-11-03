import { supabase, isSupabaseConfigured } from '../lib/supabase.ts'
import type { User } from '@supabase/supabase-js'
import type { ProfileRow, ProfileInsert, ProfileUpdate } from '../types/database.types.ts'

export type Profile = ProfileRow
export type { ProfileInsert, ProfileUpdate }

export const profileService = {
  /**
   * Fetch current authenticated user's profile.
   */
  async getProfile(userId: string): Promise<{ data: Profile | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: null }
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  },

  /**
   * Update student profile fields.
   */
  async updateProfile(userId: string, updates: ProfileUpdate): Promise<{ data: Profile | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase is not configured.') }
    }

    try {
      // Defensive sanitization: never send null to NOT NULL columns
      const cleanPayload: ProfileUpdate = {
        ...updates,
        updated_at: new Date().toISOString(),
      }
      if (cleanPayload.display_name === null) cleanPayload.display_name = ''
      if (cleanPayload.headline === null) cleanPayload.headline = ''
      if (cleanPayload.location === null) cleanPayload.location = ''
      if (cleanPayload.bio === null) cleanPayload.bio = ''

      // 1. Try standard update first
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update(cleanPayload)
        .eq('id', userId)
        .select()
        .maybeSingle()

      if (!updateError && updateData) {
        return { data: updateData, error: null }
      }

      // 2. If row does not exist yet, perform upsert to initialize the profile
      const insertPayload: ProfileInsert = {
        id: userId,
        display_name: cleanPayload.display_name || 'Student Builder',
        headline: cleanPayload.headline || 'Software Engineering Student',
        location: cleanPayload.location || '',
        bio: cleanPayload.bio || '',
        avatar_path: cleanPayload.avatar_path,
        onboarding_completed: cleanPayload.onboarding_completed ?? false,
        updated_at: cleanPayload.updated_at || new Date().toISOString(),
      }

      const { data: upsertData, error: upsertError } = await supabase
        .from('profiles')
        .upsert(insertPayload)
        .select()
        .maybeSingle()

      if (upsertError) {
        throw upsertError || updateError
      }

      return { data: upsertData, error: null }
    } catch (err) {
      console.error('profileService.updateProfile failed:', err)
      return { data: null, error: err as Error }
    }
  },

  /**
   * Upload an avatar to the avatars bucket with folder ownership check (userId/avatar.ext)
   */
  async uploadAvatar(userId: string, file: File): Promise<{ path: string | null; publicUrl: string | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { path: null, publicUrl: null, error: new Error('Supabase is not configured.') }
    }

    // Validate size (max 5MB) and type
    if (file.size > 5 * 1024 * 1024) {
      return { path: null, publicUrl: null, error: new Error('Avatar image must be under 5MB.') }
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return { path: null, publicUrl: null, error: new Error('Invalid file type. Allowed: JPEG, PNG, WebP, GIF.') }
    }

    try {
      const fileExt = file.name.split('.').pop() || 'png'
      const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const publicUrl = urlData?.publicUrl || null

      // Update profile with avatar_path
      await this.updateProfile(userId, { avatar_path: filePath })

      return { path: filePath, publicUrl, error: null }
    } catch (err) {
      return { path: null, publicUrl: null, error: err as Error }
    }
  },

  /**
   * Safely synchronizes or provisions the user profile after authentication (Google OAuth or email).
   * - Uses authenticated Supabase user ID as primary identifier.
   * - Safely populates empty fields from metadata (full_name, name, avatar_url, picture).
   * - STRICT: Never overwrites user-edited profile details on return logins.
   * - STRICT: Never creates duplicate profiles.
   */
  async syncProfileWithAuthUser(user: User): Promise<{ data: Profile | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: null }
    }

    try {
      // 1. Check if profile already exists for this authenticated user ID
      const { data: existing, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (fetchErr) {
        console.warn('profileService: Error checking existing profile:', fetchErr)
      }

      const meta = user.user_metadata || {}
      const metaName = (meta.full_name || meta.name || user.email?.split('@')[0] || '').trim()
      const metaAvatar = meta.avatar_url || meta.picture || null

      if (existing) {
        // Returning user: Only fill fields that are currently blank. Never overwrite existing user data!
        const updates: ProfileUpdate = {}
        let hasUpdates = false

        if (!existing.display_name && metaName) {
          updates.display_name = metaName
          hasUpdates = true
        }

        if (!existing.avatar_path && metaAvatar) {
          updates.avatar_path = metaAvatar
          hasUpdates = true
        }

        if (hasUpdates) {
          const { data: updated, error: updateErr } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', user.id)
            .select()
            .maybeSingle()

          if (!updateErr && updated) {
            return { data: updated, error: null }
          }
        }

        return { data: existing, error: null }
      }

      // 2. New user profile creation
      const insertPayload: ProfileInsert = {
        id: user.id,
        display_name: metaName || 'Student Builder',
        headline: meta.headline || 'Software Engineering Student',
        location: '',
        bio: '',
        avatar_path: metaAvatar,
        onboarding_completed: false,
        updated_at: new Date().toISOString(),
      }

      const { data: created, error: insertErr } = await supabase
        .from('profiles')
        .upsert(insertPayload, { onConflict: 'id' })
        .select()
        .maybeSingle()

      if (insertErr) throw insertErr
      return { data: created, error: null }
    } catch (err) {
      console.error('profileService.syncProfileWithAuthUser failed:', err)
      return { data: null, error: err as Error }
    }
  },
}
