/**
 * Database Type Definitions
 * KaizenQ Identity — Supabase PostgreSQL Schema (Compatible with Supabase JS v2)
 */

import type { PortfolioData, PortfolioThemeId } from '../pages/Portfolio/types.ts'
import type { ResumeData, ResumeTemplateId } from '../pages/Resume/types.ts'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_path: string | null
          headline: string | null
          location: string | null
          bio: string | null
          onboarding_completed: boolean
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_path?: string | null
          headline?: string | null
          location?: string | null
          bio?: string | null
          onboarding_completed?: boolean
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_path?: string | null
          headline?: string | null
          location?: string | null
          bio?: string | null
          onboarding_completed?: boolean
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          id: string
          user_id: string
          slug: string | null
          title: string | null
          theme: PortfolioThemeId
          portfolio_data: PortfolioData
          publication_status: 'draft' | 'published'
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          slug?: string | null
          title?: string | null
          theme?: PortfolioThemeId
          portfolio_data?: PortfolioData
          publication_status?: 'draft' | 'published'
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          slug?: string | null
          title?: string | null
          theme?: PortfolioThemeId
          portfolio_data?: PortfolioData
          publication_status?: 'draft' | 'published'
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          id: string
          user_id: string
          title: string
          resume_data: ResumeData
          selected_template: ResumeTemplateId
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          resume_data?: ResumeData
          selected_template?: ResumeTemplateId
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          resume_data?: ResumeData
          selected_template?: ResumeTemplateId
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          user_id: string
          portfolio_id: string | null
          title: string
          description: string | null
          technologies: string[]
          github_url: string | null
          live_url: string | null
          image_path: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          portfolio_id?: string | null
          title: string
          description?: string | null
          technologies?: string[]
          github_url?: string | null
          live_url?: string | null
          image_path?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          portfolio_id?: string | null
          title?: string
          description?: string | null
          technologies?: string[]
          github_url?: string | null
          live_url?: string | null
          image_path?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      domains: {
        Row: {
          id: string
          portfolio_id: string
          user_id: string
          hostname: string
          verification_status: 'pending_verification' | 'verified' | 'connected' | 'failed'
          connection_status: 'disconnected' | 'active' | 'failed'
          dns_records: Json
          verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          user_id: string
          hostname: string
          verification_status?: 'pending_verification' | 'verified' | 'connected' | 'failed'
          connection_status?: 'disconnected' | 'active' | 'failed'
          dns_records?: Json
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          user_id?: string
          hostname?: string
          verification_status?: 'pending_verification' | 'verified' | 'connected' | 'failed'
          connection_status?: 'disconnected' | 'active' | 'failed'
          dns_records?: Json
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      publication_events: {
        Row: {
          id: string
          portfolio_id: string
          user_id: string
          event_type: 'published' | 'unpublished' | 'slug_updated' | 'domain_attached'
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          user_id: string
          event_type: 'published' | 'unpublished' | 'slug_updated' | 'domain_attached'
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          user_id?: string
          event_type?: 'published' | 'unpublished' | 'slug_updated' | 'domain_attached'
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      domain_claims: {
        Row: {
          id: string
          user_id: string
          portfolio_id: string | null
          requested_domain: string
          status: 'pending' | 'approved' | 'registered' | 'dns_pending' | 'active' | 'rejected' | 'claimed'
          rejection_reason: string | null
          admin_notes: string | null
          claim_instructions: string | null
          dns_instructions: string | null
          approved_by: string | null
          approved_at: string | null
          registered_at: string | null
          claimed_at: string | null
          dns_verification_status: 'pending' | 'verified' | 'connected' | 'failed'
          ssl_status: 'pending' | 'active' | 'failed'
          category: 'runner' | 'winner' | null
          event_reference: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          portfolio_id?: string | null
          requested_domain: string
          status?: 'pending' | 'approved' | 'registered' | 'dns_pending' | 'active' | 'rejected' | 'claimed'
          rejection_reason?: string | null
          admin_notes?: string | null
          claim_instructions?: string | null
          dns_instructions?: string | null
          approved_by?: string | null
          approved_at?: string | null
          registered_at?: string | null
          claimed_at?: string | null
          dns_verification_status?: 'pending' | 'verified' | 'connected' | 'failed'
          ssl_status?: 'pending' | 'active' | 'failed'
          category?: 'runner' | 'winner' | null
          event_reference?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          portfolio_id?: string | null
          requested_domain?: string
          status?: 'pending' | 'approved' | 'registered' | 'dns_pending' | 'active' | 'rejected' | 'claimed'
          rejection_reason?: string | null
          admin_notes?: string | null
          claim_instructions?: string | null
          dns_instructions?: string | null
          approved_by?: string | null
          approved_at?: string | null
          registered_at?: string | null
          claimed_at?: string | null
          dns_verification_status?: 'pending' | 'verified' | 'connected' | 'failed'
          ssl_status?: 'pending' | 'active' | 'failed'
          category?: 'runner' | 'winner' | null
          event_reference?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      domain_sponsorship_eligibility: {
        Row: {
          id: string
          student_name: string
          email: string
          category: 'runner' | 'winner'
          event_reference: string | null
          is_revoked: boolean
          added_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_name: string
          email: string
          category: 'runner' | 'winner'
          event_reference?: string | null
          is_revoked?: boolean
          added_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_name?: string
          email?: string
          category?: 'runner' | 'winner'
          event_reference?: string | null
          is_revoked?: boolean
          added_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          id: string
          admin_id: string | null
          admin_email: string | null
          action: string
          target_id: string | null
          target_type: string
          outcome: 'success' | 'failure' | 'denied'
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          admin_id?: string | null
          admin_email?: string | null
          action: string
          target_id?: string | null
          target_type: string
          outcome?: 'success' | 'failure' | 'denied'
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string | null
          admin_email?: string | null
          action?: string
          target_id?: string | null
          target_type?: string
          outcome?: 'success' | 'failure' | 'denied'
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      publish_portfolio: {
        Args: {
          p_portfolio_id: string
          p_slug: string
        }
        Returns: Json
      }
      unpublish_portfolio: {
        Args: {
          p_portfolio_id: string
        }
        Returns: Json
      }
      get_published_portfolio: {
        Args: {
          p_slug: string
        }
        Returns: {
          id: string
          user_id: string
          slug: string
          title: string | null
          theme: PortfolioThemeId
          portfolio_data: Json
          published_at: string | null
        }[]
      }
      check_subdomain_availability: {
        Args: {
          p_slug: string
          p_portfolio_id?: string | null
        }
        Returns: Json
      }
      get_published_portfolio_by_hostname: {
        Args: {
          p_hostname: string
        }
        Returns: {
          id: string
          user_id: string
          slug: string
          title: string | null
          theme: PortfolioThemeId
          portfolio_data: Json
          published_at: string | null
        }[]
      }
      request_xyz_domain: {
        Args: {
          p_requested_domain: string
        }
        Returns: Json
      }
      admin_review_domain_claim: {
        Args: {
          p_claim_id: string
          p_action: string
          p_notes?: string
        }
        Returns: Json
      }
      get_admin_domain_claims: {
        Args: {
          p_status_filter?: string
        }
        Returns: {
          id: string
          user_id: string
          student_name: string
          student_email: string
          portfolio_id: string | null
          portfolio_status: string
          portfolio_slug: string | null
          requested_domain: string
          status: 'pending' | 'approved' | 'rejected' | 'claimed'
          rejection_reason: string | null
          admin_notes: string | null
          approved_at: string | null
          claimed_at: string | null
          dns_verification_status: string
          created_at: string
          updated_at: string
        }[]
      }
      get_my_domain_claim: {
        Args: Record<string, never>
        Returns: {
          id: string
          requested_domain: string
          status: 'pending' | 'approved' | 'rejected' | 'claimed'
          rejection_reason: string | null
          claim_instructions: string | null
          approved_at: string | null
          claimed_at: string | null
          dns_verification_status: string
          created_at: string
          updated_at: string
        }[]
      }
      check_domain_sponsorship_eligibility: {
        Args: Record<string, never>
        Returns: Json
      }
      get_domain_sponsorship_metrics: {
        Args: Record<string, never>
        Returns: Json
      }
      get_admin_eligibility_directory: {
        Args: {
          p_search?: string | null
          p_category_filter?: string | null
        }
        Returns: Json
      }
      admin_add_eligibility: {
        Args: {
          p_name: string
          p_email: string
          p_category: string
          p_event?: string | null
        }
        Returns: Json
      }
      admin_import_eligibility_csv: {
        Args: {
          p_records: Json
        }
        Returns: Json
      }
      admin_revoke_eligibility: {
        Args: {
          p_eligibility_id: string
        }
        Returns: Json
      }
      submit_domain_dns_verification: {
        Args: {
          p_claim_id: string
        }
        Returns: Json
      }
      get_admin_overview_stats: {
        Args: Record<string, never>
        Returns: Json
      }
      get_admin_growth_analytics: {
        Args: {
          p_days?: number
        }
        Returns: Json
      }
      get_admin_users: {
        Args: {
          p_search?: string | null
          p_role_filter?: string | null
          p_sort_by?: string | null
          p_sort_dir?: string | null
          p_page?: number
          p_page_size?: number
        }
        Returns: Json
      }
      get_admin_resumes: {
        Args: {
          p_search?: string | null
          p_template_filter?: string | null
          p_sort_by?: string | null
          p_sort_dir?: string | null
          p_page?: number
          p_page_size?: number
        }
        Returns: Json
      }
      get_admin_portfolios: {
        Args: {
          p_search?: string | null
          p_status_filter?: string | null
          p_theme_filter?: string | null
          p_sort_by?: string | null
          p_sort_dir?: string | null
          p_page?: number
          p_page_size?: number
        }
        Returns: Json
      }
      get_admin_audit_logs: {
        Args: {
          p_search?: string | null
          p_action_filter?: string | null
          p_page?: number
          p_page_size?: number
        }
        Returns: Json
      }
      admin_delete_resume: {
        Args: {
          p_resume_id: string
          p_reason?: string
        }
        Returns: Json
      }
      admin_unpublish_portfolio: {
        Args: {
          p_portfolio_id: string
          p_reason?: string
        }
        Returns: Json
      }
      admin_delete_portfolio: {
        Args: {
          p_portfolio_id: string
          p_reason?: string
        }
        Returns: Json
      }
      admin_update_user_role: {
        Args: {
          p_user_id: string
          p_is_admin: boolean
          p_reason?: string
        }
        Returns: Json
      }
      admin_log_action: {
        Args: {
          p_action: string
          p_target_id: string
          p_target_type: string
          p_outcome?: string
          p_metadata?: Json
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
