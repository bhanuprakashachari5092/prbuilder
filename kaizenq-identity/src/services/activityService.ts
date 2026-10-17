import { supabase, isSupabaseConfigured } from '../lib/supabase.ts'
import type { Database } from '../types/database.types.ts'

export type PublicationEventRow = Database['public']['Tables']['publication_events']['Row']

export interface UserActivity {
  id: string
  title: string
  description: string
  timestamp: string
  category: 'resume' | 'portfolio' | 'project' | 'credential' | 'domain'
  iconType: 'file' | 'globe' | 'git' | 'award' | 'compass'
  createdAt: string
}

export const activityService = {
  /**
   * Fetch real publication events and activity logs for the authenticated student.
   */
  async getUserActivities(userId: string): Promise<{ data: UserActivity[]; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { data: [], error: null }
    }

    try {
      const { data, error } = await supabase
        .from('publication_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      if (!data || data.length === 0) {
        return { data: [], error: null }
      }

      const activities: UserActivity[] = data.map((evt) => {
        let title = 'Document Event'
        let description = 'Cloud state updated'
        let category: UserActivity['category'] = 'portfolio'
        let iconType: UserActivity['iconType'] = 'globe'
        const meta = (evt.metadata || {}) as Record<string, unknown>

        switch (evt.event_type) {
          case 'published':
            title = 'Portfolio Published Live'
            description = meta.slug
              ? `Publicly deployed at /p/${String(meta.slug)}`
              : 'Portfolio set to public visibility'
            category = 'portfolio'
            iconType = 'globe'
            break
          case 'unpublished':
            title = 'Portfolio Unpublished'
            description = 'Public access revoked. Draft mode active.'
            category = 'portfolio'
            iconType = 'globe'
            break
          case 'slug_updated':
            title = 'Portfolio URL Slug Updated'
            description = meta.slug ? `Updated custom slug to /p/${String(meta.slug)}` : 'Slug updated'
            category = 'portfolio'
            iconType = 'globe'
            break
          case 'domain_attached':
            title = 'Custom Domain Linked'
            description = meta.hostname ? `Connected domain: ${String(meta.hostname)}` : 'Domain attached'
            category = 'domain'
            iconType = 'compass'
            break
          default:
            title = `${String(evt.event_type).replace('_', ' ')}`
            description = 'Audit event recorded on cloud'
            category = 'portfolio'
            iconType = 'globe'
        }

        const date = new Date(evt.created_at)
        const timeAgo = formatTimeAgo(date)

        return {
          id: evt.id,
          title,
          description,
          timestamp: timeAgo,
          category,
          iconType,
          createdAt: evt.created_at,
        }
      })

      return { data: activities, error: null }
    } catch (err) {
      console.warn('Failed to retrieve user activity events:', err)
      return { data: [], error: err as Error }
    }
  },
}

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
