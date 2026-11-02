# KaizenQ Identity — Backend Architecture & Database Documentation

This directory contains the authoritative backend database migrations, Edge functions, database type definitions, and backend integrity utilities for the **PR Builder / KaizenQ Identity** platform.

---

## 1. Directory Structure

```
backend/
├── migrations/         # Authoritative PostgreSQL migrations (01 through 17)
├── functions/          # Supabase Edge Functions (e.g. youpi-webhook)
├── types/              # Generated TypeScript database schema & RPC definitions
├── scripts/            # Backend verification & seed scripts
└── README.md           # Backend documentation & deployment instructions
```

---

## 2. PostgreSQL Migrations Overview

| Migration | Purpose | Core Schema Entities |
| :--- | :--- | :--- |
| `20261009000001_initial_schema.sql` | Core domain entities & audit timestamps | `profiles`, `portfolios`, `resumes`, `projects`, `domains`, `publication_events` |
| `20261009000002_row_level_security.sql` | Multi-tenant security isolation | RLS policies for owner read/write & public visibility gates |
| `20261009000003_publication_functions.sql` | Security definer publishing engine | `publish_portfolio`, `unpublish_portfolio`, `get_published_portfolio` |
| `20261009000004_storage_buckets.sql` | Asset bucket provisioning | `avatars`, `project-images` with size limits & MIME restrictions |
| `20261009000005_domain_claims.sql` | Student subdomain reservation & claims | `domain_claims`, `reserve_subdomain`, `claim_student_subdomain` |
| `20261012000006_runner_winner_domain_sponsorship.sql` | Fusion 2K26 sponsorship engine | Runner-up & Winner sponsorship eligibility and voucher fulfillment |
| `20261016000007_platform_subdomains.sql` | Subdomain resolution RPCs | `get_published_portfolio_by_subdomain` |
| `20261020000008_admin_dashboard_platform_management.sql` | Admin operations & audit trail | `admin_audit_logs`, `is_admin_user()`, authoritative stats RPCs |
| `20261023000009_configure_admin_credentials.sql` | Platform admin credential bootstrap | Grants admin access to primary platform administrators |
| `20261023000010_production_analytics_events.sql` | High-frequency telemetry pipeline | `analytics_events` with check constraints & partitioned aggregation |
| `20261024000011_admin_fixes_and_authoritative_rpcs.sql` | Authoritative security definer RPCs | `get_admin_users`, `get_growth_analytics`, user moderation |
| `20261026000012_youpi_upi_payments.sql` | UPI payment orders & webhooks | `payment_products`, `payment_orders`, `user_entitlements`, idempotency |
| `20261026000013_coupons_and_promotions.sql` | Promotion engine & discounts | `coupons`, `coupon_redemptions`, validation & discount calculations |
| `20261026000014_pricing_and_customization.sql` | Product customization catalog | Dynamic add-on pricing, feature flags, cart pricing engine |
| `20261026000015_custom_domain_management.sql` | Custom domain DNS verification | `connect_custom_domain`, `verify_custom_domain`, Netlify LB DNS targets |
| `20261026000016_custom_pricing_calculator.sql` | Server-authoritative checkout | `calculate_cart_pricing` RPC preventing client-side price tampering |
| `20261027000017_realtime_revenue_telemetry.sql` | Real-time financial telemetry | Live revenue telemetry, active passes, fulfilled sales |

---

## 3. Verification & Deployment

To verify all backend migrations and integrity constraints:

```bash
npm run backend:verify
```

### Applying Migrations to Supabase

```bash
# Using Supabase CLI
npx supabase link --project-ref <your-supabase-project-id>
npx supabase db push
```
