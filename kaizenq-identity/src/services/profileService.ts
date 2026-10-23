import { supabase, isSupabaseConfigured } from '../lib/supabase.ts'
import type { Database } from '../types/database.types.ts'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

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
      const cleanPayload: Record<string, any> = { ...updates }
      if (cleanPayload.display_name === null) cleanPayload.display_name = ''
      if (cleanPayload.headline === null) cleanPayload.headline = ''
      if (cleanPayload.location === null) cleanPayload.location = ''
      if (cleanPayload.bio === null) cleanPayload.bio = ''
      cleanPayload.updated_at = new Date().toISOString()

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
      const { data: upsertData, error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          display_name: cleanPayload.display_name || 'Student Builder',
          headline: cleanPayload.headline || 'Software Engineering Student',
          location: cleanPayload.location || '',
          bio: cleanPayload.bio || '',
          ...cleanPayload,
        })
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
}
