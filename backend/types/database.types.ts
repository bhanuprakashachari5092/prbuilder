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
          full_name?: string | null
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
          full_name?: string | null
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
          full_name?: string | null
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
          ssl_status: 'pending' | 'provisioning' | 'issued' | 'failed'
          verification_token: string | null
          provider_reference: string | null
          activated_at: string | null
          last_checked_at: string | null
          error_message: string | null
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
          ssl_status?: 'pending' | 'provisioning' | 'issued' | 'failed'
          verification_token?: string | null
          provider_reference?: string | null
          activated_at?: string | null
          last_checked_at?: string | null
          error_message?: string | null
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
          ssl_status?: 'pending' | 'provisioning' | 'issued' | 'failed'
          verification_token?: string | null
          provider_reference?: string | null
          activated_at?: string | null
          last_checked_at?: string | null
          error_message?: string | null
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
      payment_products: {
        Row: {
          id: string
          name: string
          description: string | null
          category: 'resume_template' | 'portfolio_theme' | 'domain_pass' | 'bundle'
          target_id: string
          price_paise: number
          currency: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          description?: string | null
          category: 'resume_template' | 'portfolio_theme' | 'domain_pass' | 'bundle'
          target_id: string
          price_paise: number
          currency?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: 'resume_template' | 'portfolio_theme' | 'domain_pass' | 'bundle'
          target_id?: string
          price_paise?: number
          currency?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_orders: {
        Row: {
          id: string
          user_id: string
          product_id: string
          amount_paise: number
          currency: string
          status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled'
          upi_vpa: string | null
          gateway_order_id: string | null
          utr: string | null
          payer_vpa: string | null
          metadata: Json
          is_sandbox: boolean
          expires_at: string
          paid_at: string | null
          coupon_id?: string | null
          coupon_code?: string | null
          original_amount_paise?: number | null
          discount_amount_paise?: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          product_id: string
          amount_paise: number
          currency?: string
          status?: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled'
          upi_vpa?: string | null
          gateway_order_id?: string | null
          utr?: string | null
          payer_vpa?: string | null
          metadata?: Json
          is_sandbox?: boolean
          expires_at?: string
          paid_at?: string | null
          coupon_id?: string | null
          coupon_code?: string | null
          original_amount_paise?: number | null
          discount_amount_paise?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          amount_paise?: number
          currency?: string
          status?: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled'
          upi_vpa?: string | null
          gateway_order_id?: string | null
          utr?: string | null
          payer_vpa?: string | null
          metadata?: Json
          is_sandbox?: boolean
          expires_at?: string
          paid_at?: string | null
          coupon_id?: string | null
          coupon_code?: string | null
          original_amount_paise?: number | null
          discount_amount_paise?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_entitlements: {
        Row: {
          id: string
          user_id: string
          product_id: string
          entitlement_key: string
          order_id: string | null
          is_active: boolean
          granted_at: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          entitlement_key: string
          order_id?: string | null
          is_active?: boolean
          granted_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          entitlement_key?: string
          order_id?: string | null
          is_active?: boolean
          granted_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_audit_logs: {
        Row: {
          id: string
          order_id: string | null
          event_type: string
          payload: Json
          signature: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          event_type: string
          payload?: Json
          signature?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          event_type?: string
          payload?: Json
          signature?: string | null
          created_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string | null
          event_type:
            | 'user_registered'
            | 'resume_created'
            | 'resume_updated'
            | 'resume_deleted'
            | 'resume_pdf_downloaded'
            | 'portfolio_created'
            | 'portfolio_published'
            | 'portfolio_unpublished'
            | 'portfolio_zip_downloaded'
            | 'portfolio_qr_downloaded'
            | 'portfolio_viewed'
          target_id: string | null
          target_type: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_type:
            | 'user_registered'
            | 'resume_created'
            | 'resume_updated'
            | 'resume_deleted'
            | 'resume_pdf_downloaded'
            | 'portfolio_created'
            | 'portfolio_published'
            | 'portfolio_unpublished'
            | 'portfolio_zip_downloaded'
            | 'portfolio_qr_downloaded'
            | 'portfolio_viewed'
          target_id?: string | null
          target_type?: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_type?:
            | 'user_registered'
            | 'resume_created'
            | 'resume_updated'
            | 'resume_deleted'
            | 'resume_pdf_downloaded'
            | 'portfolio_created'
            | 'portfolio_published'
            | 'portfolio_unpublished'
            | 'portfolio_zip_downloaded'
            | 'portfolio_qr_downloaded'
            | 'portfolio_viewed'
          target_id?: string | null
          target_type?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          id: string
          code: string
          description: string | null
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          is_active: boolean
          start_date: string
          expiry_date: string | null
          max_redemptions_total: number | null
          max_redemptions_per_user: number
          min_order_amount_paise: number
          eligible_product_ids: string[] | null
          eligible_user_groups: string[] | null
          first_purchase_only: boolean
          redemptions_count: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          description?: string | null
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          is_active?: boolean
          start_date?: string
          expiry_date?: string | null
          max_redemptions_total?: number | null
          max_redemptions_per_user?: number
          min_order_amount_paise?: number
          eligible_product_ids?: string[] | null
          eligible_user_groups?: string[] | null
          first_purchase_only?: boolean
          redemptions_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          description?: string | null
          discount_type?: 'percentage' | 'fixed'
          discount_value?: number
          is_active?: boolean
          start_date?: string
          expiry_date?: string | null
          max_redemptions_total?: number | null
          max_redemptions_per_user?: number
          min_order_amount_paise?: number
          eligible_product_ids?: string[] | null
          eligible_user_groups?: string[] | null
          first_purchase_only?: boolean
          redemptions_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          id: string
          coupon_id: string
          user_id: string
          order_id: string
          status: 'reserved' | 'fulfilled' | 'cancelled' | 'expired'
          original_amount_paise: number
          discount_amount_paise: number
          final_amount_paise: number
          created_at: string
          fulfilled_at: string | null
        }
        Insert: {
          id?: string
          coupon_id: string
          user_id: string
          order_id: string
          status?: 'reserved' | 'fulfilled' | 'cancelled' | 'expired'
          original_amount_paise: number
          discount_amount_paise: number
          final_amount_paise: number
          created_at?: string
          fulfilled_at?: string | null
        }
        Update: {
          id?: string
          coupon_id?: string
          user_id?: string
          order_id?: string
          status?: 'reserved' | 'fulfilled' | 'cancelled' | 'expired'
          original_amount_paise?: number
          discount_amount_paise?: number
          final_amount_paise?: number
          created_at?: string
          fulfilled_at?: string | null
        }
        Relationships: []
      }
      coupon_validation_logs: {
        Row: {
          id: string
          user_id: string
          attempted_code: string
          is_valid: boolean
          error_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          attempted_code: string
          is_valid: boolean
          error_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          attempted_code?: string
          is_valid?: boolean
          error_reason?: string | null
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
      get_admin_user_assets: {
        Args: {
          p_user_id: string
        }
        Returns: Json
      }
      create_payment_order: {
        Args: {
          p_product_id: string
          p_is_sandbox?: boolean
          p_coupon_code?: string | null
        }
        Returns: Json
      }
      verify_and_fulfill_payment: {
        Args: {
          p_order_id: string
          p_utr?: string | null
          p_signature?: string | null
          p_raw_payload?: string | null
          p_is_sandbox?: boolean
        }
        Returns: Json
      }
      cancel_payment_order: {
        Args: {
          p_order_id: string
          p_reason?: string
        }
        Returns: Json
      }
      check_user_entitlement: {
        Args: {
          p_user_id: string
          p_entitlement_key: string
        }
        Returns: boolean
      }
      get_user_payment_history: {
        Args: Record<string, never>
        Returns: Json
      }
      get_admin_payment_analytics: {
        Args: Record<string, never>
        Returns: Json
      }
      record_analytics_event: {
        Args: {
          p_event_type: string
          p_target_id?: string | null
          p_target_type?: string | null
          p_metadata?: Json
        }
        Returns: string
      }
      validate_coupon: {
        Args: {
          p_product_id: string
          p_coupon_code: string
        }
        Returns: Json
      }
      fulfill_free_order: {
        Args: {
          p_product_id: string
          p_coupon_code: string
        }
        Returns: Json
      }
      get_admin_coupons: {
        Args: {
          p_search?: string | null
          p_status_filter?: string | null
          p_type_filter?: string | null
          p_sort_by?: string | null
          p_sort_dir?: string | null
          p_page?: number | null
          p_page_size?: number | null
        }
        Returns: Json
      }
      get_admin_coupon_redemptions: {
        Args: {
          p_coupon_id?: string | null
          p_search?: string | null
          p_page?: number | null
          p_page_size?: number | null
        }
        Returns: Json
      }
      create_or_update_coupon: {
        Args: {
          p_coupon_id?: string | null
          p_code?: string | null
          p_description?: string | null
          p_discount_type?: string | null
          p_discount_value?: number | null
          p_is_active?: boolean | null
          p_start_date?: string | null
          p_expiry_date?: string | null
          p_max_total?: number | null
          p_max_per_user?: number | null
          p_min_order_paise?: number | null
          p_eligible_products?: string[] | null
          eligible_user_groups?: string[] | null
          p_first_purchase_only?: boolean | null
        }
        Returns: Json
      }
      calculate_cart_pricing: {
        Args: {
          p_product_id: string
          p_addon_ids?: string[] | null
          p_coupon_code?: string | null
        }
        Returns: Json
      }
      update_product_price: {
        Args: {
          p_product_id: string
          p_new_price_paise: number
          p_reason?: string | null
        }
        Returns: Json
      }
      toggle_product_status: {
        Args: {
          p_product_id: string
          p_is_active: boolean
        }
        Returns: Json
      }
      get_admin_pricing_catalog: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      connect_custom_domain: {
        Args: {
          p_portfolio_id: string
          p_raw_hostname: string
        }
        Returns: Json
      }
      verify_custom_domain: {
        Args: {
          p_domain_id: string
          p_simulate_success?: boolean
        }
        Returns: Json
      }
      disconnect_custom_domain: {
        Args: {
          p_domain_id: string
        }
        Returns: Json
      }
      check_user_custom_domain_entitlement: {
        Args: {
          p_user_id: string
        }
        Returns: boolean
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

export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type AnalyticsEventRow = Database['public']['Tables']['analytics_events']['Row']
export type AnalyticsEventInsert = Database['public']['Tables']['analytics_events']['Insert']
export type AnalyticsEventUpdate = Database['public']['Tables']['analytics_events']['Update']
export type AnalyticsEventType = AnalyticsEventRow['event_type']

export type ResumeRow = Database['public']['Tables']['resumes']['Row']
export type PortfolioRow = Database['public']['Tables']['portfolios']['Row']
export type AdminAuditLogRow = Database['public']['Tables']['admin_audit_logs']['Row']

