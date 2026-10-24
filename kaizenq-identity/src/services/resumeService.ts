import { supabase, isSupabaseConfigured } from '../lib/supabase.ts'
import type { Database } from '../types/database.types.ts'
import type { ResumeData } from '../pages/Resume/types.ts'
import { adminService } from './adminService.ts'

export type ResumeRow = Database['public']['Tables']['resumes']['Row']

export const resumeService = {
  /**
   * Fetch authenticated user's private resume record.
   */
  async getUserResume(userId: string): Promise<{ data: ResumeRow | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: null }
    }

    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  },

  /**
   * Save or update the student's cloud resume.
   */
  async saveUserResume(
    userId: string,
    resumeData: ResumeData,
  ): Promise<{ data: ResumeRow | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase is not configured.') }
    }

    try {
      const title = resumeData.title || `${resumeData.personalInfo.fullName || 'Student'} Resume`
      const template = resumeData.template || 'classic-ats'

      const existing = await this.getUserResume(userId)

      if (existing.data?.id) {
        const { data, error } = await supabase
          .from('resumes')
          .update({
            title,
            selected_template: template,
            resume_data: resumeData as unknown as Database['public']['Tables']['resumes']['Update']['resume_data'],
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.data.id)
          .eq('user_id', userId)
          .select()
          .single()

        if (error) throw error

        adminService.recordRealAnalyticsEvent('resume_updated', {
          title,
          selectedTemplate: template,
          ownerEmail: resumeData.personalInfo?.email || 'student@prbuilder.me',
        }, data.id, 'resume').catch(() => {})

        return { data, error: null }
      } else {
        const { data, error } = await supabase
          .from('resumes')
          .insert({
            user_id: userId,
            title,
            selected_template: template,
            resume_data: resumeData as unknown as Database['public']['Tables']['resumes']['Insert']['resume_data'],
          })
          .select()
          .single()

        if (error) throw error

        adminService.recordRealAnalyticsEvent('resume_created', {
          title,
          selectedTemplate: template,
          ownerEmail: resumeData.personalInfo?.email || 'student@prbuilder.me',
        }, data.id, 'resume').catch(() => {})

        return { data, error: null }
      }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  },
}
