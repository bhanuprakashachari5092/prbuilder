/**
 * Centralized Typed Analytics Data Layer for PR Builder Admin Console
 * Provides authenticated, real-time metrics querying and telemetry dispatches.
 */

import {
  adminService,
  type AdminOverviewStats,
  type GrowthDataPoint,
  getAdminOverview,
  getSignupMetrics,
  getResumeMetrics,
  getPortfolioMetrics,
  getDownloadMetrics,
  getRecentActivity,
  getUserGrowthSeries,
  recordRealAnalyticsEvent,
} from './adminService.ts'

export type { AdminOverviewStats, GrowthDataPoint }

export const adminAnalytics = {
  getAdminOverview,
  getSignupMetrics,
  getResumeMetrics,
  getPortfolioMetrics,
  getDownloadMetrics,
  getRecentActivity,
  getUserGrowthSeries,
  recordEvent: recordRealAnalyticsEvent,
  getGrowthAnalytics: (days: number = 30) => adminService.getGrowthAnalytics(days),
}

export {
  getAdminOverview,
  getSignupMetrics,
  getResumeMetrics,
  getPortfolioMetrics,
  getDownloadMetrics,
  getRecentActivity,
  getUserGrowthSeries,
  recordRealAnalyticsEvent,
}
