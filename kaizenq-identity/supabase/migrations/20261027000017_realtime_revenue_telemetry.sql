-- =============================================================================
-- Migration: 20261027000017_realtime_revenue_telemetry.sql
-- Description: Enables real-time replica identity and updates authoritative
--              overview stats RPC to include real-time revenue telemetry.
-- =============================================================================

-- 1. Ensure REPLICA IDENTITY FULL for payment_orders to support rich Realtime diffs
ALTER TABLE IF EXISTS public.payment_orders REPLICA IDENTITY FULL;

-- 2. Ensure payment_orders table is registered in supabase_realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_orders;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END IF;
END $$;

-- 3. Update get_admin_overview_stats() to include authoritative real-time revenue
CREATE OR REPLACE FUNCTION public.get_admin_overview_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  -- User variables
  v_total_users BIGINT := 0;
  v_new_users_today BIGINT := 0;
  v_new_users_7d BIGINT := 0;
  v_new_users_prev_7d BIGINT := 0;
  v_new_users_30d BIGINT := 0;
  v_new_users_prev_30d BIGINT := 0;
  v_active_users_30d BIGINT := 0;
  v_active_users_prev_30d BIGINT := 0;

  -- Resume variables
  v_total_resumes BIGINT := 0;
  v_resumes_7d BIGINT := 0;
  v_resumes_prev_7d BIGINT := 0;
  v_unique_resume_creators BIGINT := 0;
  v_resume_downloads BIGINT := 0;
  v_resume_download_rate INT := 0;
  v_tpl_modern BIGINT := 0;
  v_tpl_classic BIGINT := 0;
  v_tpl_minimal BIGINT := 0;

  -- Portfolio variables
  v_total_portfolios BIGINT := 0;
  v_portfolios_7d BIGINT := 0;
  v_portfolios_prev_7d BIGINT := 0;
  v_published_portfolios BIGINT := 0;
  v_draft_portfolios BIGINT := 0;
  v_unique_portfolio_creators BIGINT := 0;
  v_portfolio_zip_downloads BIGINT := 0;
  v_portfolio_qr_downloads BIGINT := 0;
  v_portfolio_download_rate INT := 0;
  v_theme_dev BIGINT := 0;
  v_theme_minimal BIGINT := 0;
  v_theme_creative BIGINT := 0;

  -- Download aggregate variables
  v_total_downloads BIGINT := 0;
  v_downloads_today BIGINT := 0;
  v_downloads_7d BIGINT := 0;

  -- Engagement variables
  v_users_with_both BIGINT := 0;
  v_users_resumes_only BIGINT := 0;
  v_users_portfolios_only BIGINT := 0;
  v_users_neither BIGINT := 0;
  v_conversion_rate INT := 0;

  -- Revenue variables (Real-Time Telemetry)
  v_total_revenue_paise BIGINT := 0;
  v_total_revenue_rupees NUMERIC := 0.00;
  v_today_revenue_paise BIGINT := 0;
  v_today_revenue_rupees NUMERIC := 0.00;
  v_paid_orders_count BIGINT := 0;
  v_pending_orders_count BIGINT := 0;

  -- Activity feed JSON
  v_recent_activity JSONB := '[]'::jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  -- 1. Real User Metrics from profiles
  SELECT COUNT(*) INTO v_total_users FROM public.profiles;
  SELECT COUNT(*) INTO v_new_users_today FROM public.profiles WHERE created_at >= CURRENT_DATE;
  SELECT COUNT(*) INTO v_new_users_7d FROM public.profiles WHERE created_at >= NOW() - INTERVAL '7 days';
  SELECT COUNT(*) INTO v_new_users_prev_7d FROM public.profiles WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days';
  SELECT COUNT(*) INTO v_new_users_30d FROM public.profiles WHERE created_at >= NOW() - INTERVAL '30 days';
  SELECT COUNT(*) INTO v_new_users_prev_30d FROM public.profiles WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days';

  -- Active users in 30 days window based on updates, creations, or events
  SELECT COUNT(DISTINCT u.id) INTO v_active_users_30d
  FROM public.profiles u
  WHERE u.updated_at >= NOW() - INTERVAL '30 days'
     OR EXISTS (SELECT 1 FROM public.resumes r WHERE r.user_id = u.id AND r.updated_at >= NOW() - INTERVAL '30 days')
     OR EXISTS (SELECT 1 FROM public.portfolios p WHERE p.user_id = u.id AND p.updated_at >= NOW() - INTERVAL '30 days')
     OR EXISTS (SELECT 1 FROM public.analytics_events ae WHERE ae.user_id = u.id AND ae.created_at >= NOW() - INTERVAL '30 days');

  SELECT COUNT(DISTINCT u.id) INTO v_active_users_prev_30d
  FROM public.profiles u
  WHERE (u.updated_at >= NOW() - INTERVAL '60 days' AND u.updated_at < NOW() - INTERVAL '30 days')
     OR EXISTS (SELECT 1 FROM public.resumes r WHERE r.user_id = u.id AND r.updated_at >= NOW() - INTERVAL '60 days' AND r.updated_at < NOW() - INTERVAL '30 days')
     OR EXISTS (SELECT 1 FROM public.portfolios p WHERE p.user_id = u.id AND p.updated_at >= NOW() - INTERVAL '60 days' AND p.updated_at < NOW() - INTERVAL '30 days')
     OR EXISTS (SELECT 1 FROM public.analytics_events ae WHERE ae.user_id = u.id AND ae.created_at >= NOW() - INTERVAL '60 days' AND ae.created_at < NOW() - INTERVAL '30 days');

  -- 2. Real Resume Metrics from resumes table
  SELECT COUNT(*) INTO v_total_resumes FROM public.resumes;
  SELECT COUNT(*) INTO v_resumes_7d FROM public.resumes WHERE created_at >= NOW() - INTERVAL '7 days';
  SELECT COUNT(*) INTO v_resumes_prev_7d FROM public.resumes WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days';
  SELECT COUNT(DISTINCT user_id) INTO v_unique_resume_creators FROM public.resumes;

  -- Resume Template Distribution from real records
  SELECT COUNT(*) INTO v_tpl_modern FROM public.resumes WHERE selected_template IN ('modern', 'modern-professional');
  SELECT COUNT(*) INTO v_tpl_classic FROM public.resumes WHERE selected_template IN ('classic', 'classic-ats');
  SELECT COUNT(*) INTO v_tpl_minimal FROM public.resumes WHERE selected_template IN ('minimal', 'technical');

  -- Real Download Counts for Resumes from analytics_events
  BEGIN
    SELECT COUNT(*) INTO v_resume_downloads FROM public.analytics_events WHERE event_type = 'resume_pdf_downloaded';
  EXCEPTION WHEN OTHERS THEN
    v_resume_downloads := 0;
  END;

  IF v_total_resumes > 0 THEN
    v_resume_download_rate := LEAST(100, ROUND((v_resume_downloads::numeric / v_total_resumes::numeric) * 100));
  ELSE
    v_resume_download_rate := 0;
  END IF;

  -- 3. Real Portfolio Metrics from portfolios table
  SELECT COUNT(*) INTO v_total_portfolios FROM public.portfolios;
  SELECT COUNT(*) INTO v_portfolios_7d FROM public.portfolios WHERE created_at >= NOW() - INTERVAL '7 days';
  SELECT COUNT(*) INTO v_portfolios_prev_7d FROM public.portfolios WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days';
  SELECT COUNT(*) INTO v_published_portfolios FROM public.portfolios WHERE publication_status = 'published';
  SELECT COUNT(*) INTO v_draft_portfolios FROM public.portfolios WHERE publication_status = 'draft';
  SELECT COUNT(DISTINCT user_id) INTO v_unique_portfolio_creators FROM public.portfolios;

  -- Real Download Counts for Portfolios
  BEGIN
    SELECT COUNT(*) INTO v_portfolio_zip_downloads FROM public.analytics_events WHERE event_type = 'portfolio_zip_downloaded';
  EXCEPTION WHEN OTHERS THEN
    v_portfolio_zip_downloads := 0;
  END;

  BEGIN
    SELECT COUNT(*) INTO v_portfolio_qr_downloads FROM public.analytics_events WHERE event_type = 'portfolio_qr_downloaded';
  EXCEPTION WHEN OTHERS THEN
    v_portfolio_qr_downloads := 0;
  END;

  IF v_total_portfolios > 0 THEN
    v_portfolio_download_rate := LEAST(100, ROUND((v_portfolio_zip_downloads::numeric / v_total_portfolios::numeric) * 100));
  ELSE
    v_portfolio_download_rate := 0;
  END IF;

  -- Portfolio Theme Distribution from real records
  SELECT COUNT(*) INTO v_theme_dev FROM public.portfolios WHERE theme IN ('developer', 'midnight');
  SELECT COUNT(*) INTO v_theme_minimal FROM public.portfolios WHERE theme IN ('minimal', 'modern');
  SELECT COUNT(*) INTO v_theme_creative FROM public.portfolios WHERE theme IN ('creative', 'designer');

  -- 4. Download Aggregates
  v_total_downloads := v_resume_downloads + v_portfolio_zip_downloads + v_portfolio_qr_downloads;

  BEGIN
    SELECT COUNT(*) INTO v_downloads_today
    FROM public.analytics_events
    WHERE event_type IN ('resume_pdf_downloaded', 'portfolio_zip_downloaded', 'portfolio_qr_downloaded')
      AND created_at >= CURRENT_DATE;

    SELECT COUNT(*) INTO v_downloads_7d
    FROM public.analytics_events
    WHERE event_type IN ('resume_pdf_downloaded', 'portfolio_zip_downloaded', 'portfolio_qr_downloaded')
      AND created_at >= NOW() - INTERVAL '7 days';
  EXCEPTION WHEN OTHERS THEN
    v_downloads_today := 0;
    v_downloads_7d := 0;
  END;

  -- 5. Real Engagement Funnel
  SELECT COUNT(*) INTO v_users_with_both
  FROM public.profiles u
  WHERE EXISTS (SELECT 1 FROM public.resumes r WHERE r.user_id = u.id)
    AND EXISTS (SELECT 1 FROM public.portfolios p WHERE p.user_id = u.id);

  SELECT COUNT(*) INTO v_users_resumes_only
  FROM public.profiles u
  WHERE EXISTS (SELECT 1 FROM public.resumes r WHERE r.user_id = u.id)
    AND NOT EXISTS (SELECT 1 FROM public.portfolios p WHERE p.user_id = u.id);

  SELECT COUNT(*) INTO v_users_portfolios_only
  FROM public.profiles u
  WHERE NOT EXISTS (SELECT 1 FROM public.resumes r WHERE r.user_id = u.id)
    AND EXISTS (SELECT 1 FROM public.portfolios p WHERE p.user_id = u.id);

  v_users_neither := GREATEST(0, v_total_users - (v_users_with_both + v_users_resumes_only + v_users_portfolios_only));

  IF v_total_users > 0 THEN
    v_conversion_rate := LEAST(100, ROUND(((v_users_with_both + v_users_resumes_only + v_users_portfolios_only)::numeric / v_total_users::numeric) * 100));
  ELSE
    v_conversion_rate := 0;
  END IF;

  -- 6. Real-Time Revenue Aggregation
  BEGIN
    SELECT
      COALESCE(SUM(amount_paise) FILTER (WHERE status = 'paid'), 0),
      COALESCE(SUM(amount_paise) FILTER (WHERE status = 'paid' AND created_at >= CURRENT_DATE), 0),
      COUNT(*) FILTER (WHERE status = 'paid'),
      COUNT(*) FILTER (WHERE status = 'pending')
    INTO
      v_total_revenue_paise,
      v_today_revenue_paise,
      v_paid_orders_count,
      v_pending_orders_count
    FROM public.payment_orders;

    v_total_revenue_rupees := ROUND((v_total_revenue_paise::numeric / 100.0), 2);
    v_today_revenue_rupees := ROUND((v_today_revenue_paise::numeric / 100.0), 2);
  EXCEPTION WHEN OTHERS THEN
    v_total_revenue_paise := 0;
    v_total_revenue_rupees := 0.00;
    v_today_revenue_paise := 0;
    v_today_revenue_rupees := 0.00;
    v_paid_orders_count := 0;
    v_pending_orders_count := 0;
  END;

  -- 7. Live Activity Feed from real events
  BEGIN
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', ae.id::text,
        'type', ae.event_type,
        'userName', COALESCE(p.display_name, 'Anonymous Student'),
        'userEmail', COALESCE(p.email, 'unknown@student.edu'),
        'details', CASE
          WHEN ae.event_type = 'resume_pdf_downloaded' THEN 'Downloaded ATS Resume PDF vector export'
          WHEN ae.event_type = 'portfolio_zip_downloaded' THEN 'Downloaded Offline Portfolio Website ZIP'
          WHEN ae.event_type = 'portfolio_qr_downloaded' THEN 'Downloaded scannable portfolio QR identity card'
          WHEN ae.event_type = 'portfolio_published' THEN 'Published personal portfolio site live'
          WHEN ae.event_type = 'resume_created' THEN 'Created a new ATS professional resume'
          WHEN ae.event_type = 'portfolio_created' THEN 'Created a new responsive portfolio website'
          ELSE 'Interacted with platform tools'
        END,
        'timestamp', ae.created_at
      ) ORDER BY ae.created_at DESC
    ), '[]'::jsonb)
    INTO v_recent_activity
    FROM (
      SELECT * FROM public.analytics_events ORDER BY created_at DESC LIMIT 15
    ) ae
    LEFT JOIN public.profiles p ON ae.user_id = p.id;
  EXCEPTION WHEN OTHERS THEN
    v_recent_activity := '[]'::jsonb;
  END;

  RETURN jsonb_build_object(
    'users', jsonb_build_object(
      'total', v_total_users,
      'today', v_new_users_today,
      'last7Days', v_new_users_7d,
      'prev7Days', v_new_users_prev_7d,
      'last30Days', v_new_users_30d,
      'prev30Days', v_new_users_prev_30d,
      'active30Days', v_active_users_30d,
      'prevActive30Days', v_active_users_prev_30d
    ),
    'resumes', jsonb_build_object(
      'total', v_total_resumes,
      'last7Days', v_resumes_7d,
      'prev7Days', v_resumes_prev_7d,
      'uniqueCreators', v_unique_resume_creators,
      'downloads', v_resume_downloads,
      'downloadRatePct', v_resume_download_rate,
      'templatesBreakdown', jsonb_build_object(
        'modern', v_tpl_modern,
        'classic', v_tpl_classic,
        'minimal', v_tpl_minimal
      )
    ),
    'portfolios', jsonb_build_object(
      'total', v_total_portfolios,
      'last7Days', v_portfolios_7d,
      'prev7Days', v_portfolios_prev_7d,
      'published', v_published_portfolios,
      'draft', v_draft_portfolios,
      'uniqueCreators', v_unique_portfolio_creators,
      'zipDownloads', v_portfolio_zip_downloads,
      'qrDownloads', v_portfolio_qr_downloads,
      'downloadRatePct', v_portfolio_download_rate,
      'themesBreakdown', jsonb_build_object(
        'developer', v_theme_dev,
        'minimal', v_theme_minimal,
        'creative', v_theme_creative
      )
    ),
    'downloads', jsonb_build_object(
      'totalDownloads', v_total_downloads,
      'resumePdfs', v_resume_downloads,
      'portfolioZips', v_portfolio_zip_downloads,
      'qrCards', v_portfolio_qr_downloads,
      'todayDownloads', v_downloads_today,
      'last7Days', v_downloads_7d
    ),
    'engagement', jsonb_build_object(
      'usersWithBoth', v_users_with_both,
      'usersResumesOnly', v_users_resumes_only,
      'usersPortfoliosOnly', v_users_portfolios_only,
      'usersNeither', v_users_neither,
      'conversionRate', v_conversion_rate
    ),
    'revenue', jsonb_build_object(
      'totalPaise', v_total_revenue_paise,
      'totalRupees', v_total_revenue_rupees,
      'todayPaise', v_today_revenue_paise,
      'todayRupees', v_today_revenue_rupees,
      'paidOrdersCount', v_paid_orders_count,
      'pendingOrdersCount', v_pending_orders_count
    ),
    'recentActivity', COALESCE(v_recent_activity, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_overview_stats() TO authenticated;
