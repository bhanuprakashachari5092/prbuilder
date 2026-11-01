# PR Builder — YouPI-PG UPI Payment Integration Guide

This document outlines the architecture, data model, security mechanisms, and operational procedures for the isolated UPI payment module in PR Builder (`kaizenq-identity`).

---

## 1. Architectural Principles & Security Invariants

### 1.1 Authoritative Server-Side Pricing (Zero Client Trust)
- **Invariant:** The frontend **NEVER** computes, supplies, or validates prices for orders.
- **Implementation:** The client requests order creation by supplying only the `productId` (e.g. `pro-template-modern-professional`). The database function `create_payment_order(p_product_id)` reads the authoritative price directly from `public.payment_products`.
- **Paise Representation:** All monetary values are strictly stored and computed in integer paise (₹1 = 100 paise) to eliminate IEEE 754 floating-point inaccuracies.

### 1.2 Isolation from Untrusted Scrapers
- PR Builder remains **strictly isolated** from browser-based bank, SMS, or Gmail notification scrapers.
- All webhook inputs must be received through verified HTTP POST endpoints and cryptographically verified before any entitlement is touched.

### 1.3 Cryptographic Webhook Verification (HMAC-SHA256)
- Webhooks from the YouPI-PG gateway must pass HMAC-SHA256 verification computed on the **raw request body**:
  ```
  signature = HMAC-SHA256(rawBody, webhookSecret)
  header: x-gateway-signature: sha256=<hex_digest>
  ```
- Signatures are compared using constant-time string comparison (`constantTimeCompare`) to prevent timing side-channel attacks.

### 1.4 Idempotency & Atomic Entitlement Activation
- Replay attacks or duplicate webhook delivery (e.g., network retries) are handled safely.
- The fulfillment transaction acquires a row-level lock (`FOR UPDATE`), checks if the order is already marked as `'paid'`, and returns `{ alreadyFulfilled: true }` without duplicate credit or duplicate database writes.

---

## 2. Product & Pricing Catalog

| Product ID | Product Name | Category | Price (INR) | Price (Paise) | Free Tier Equivalent |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `pro-template-modern-professional` | Modern Professional ATS Resume | `resume_template` | ₹199.00 | 19,900 | `classic-ats`, `minimal` (100% Free) |
| `pro-template-technical` | Technical Developer ATS Resume | `resume_template` | ₹199.00 | 19,900 | `classic`, `modern` (100% Free) |
| `pro-theme-creative` | Creative Studio Portfolio Theme | `portfolio_theme` | ₹299.00 | 29,900 | `developer`, `minimal`, `midnight` (100% Free) |
| `pro-theme-modern` | Modern Clean Portfolio Theme | `portfolio_theme` | ₹299.00 | 29,900 | `developer`, `minimal`, `midnight` (100% Free) |
| `custom-domain-pass` | Instant Custom Domain Pass | `domain_pass` | ₹499.00 | 49,900 | Runner/Winner Sponsorship (Free) |
| `pro-all-access-pass` | Pro All-Access Lifetime Pass | `bundle` | ₹999.00 | 99,900 | Free features always free |

> **Note:** All standard ATS templates, standard portfolio themes, public directory listings, PDF exports, and ZIP downloads remain **100% free forever**. No core feature is paywalled.

---

## 3. Database Schema & RLS Policies

The payment subsystem is defined in migration `20261026000012_youpi_upi_payments.sql`:

1. `public.payment_products`: Authoritative product catalog with integer paise pricing.
2. `public.payment_orders`: State machine records (`pending`, `paid`, `failed`, `expired`, `cancelled`).
3. `public.user_entitlements`: Unique mapping `(user_id, entitlement_key)` storing granted access.
4. `public.payment_audit_logs`: Immutable audit trail for orders, webhook payloads, and HMAC signatures.

### Row Level Security (RLS)
- **Direct mutations blocked:** Authenticated users cannot perform direct `INSERT`, `UPDATE`, or `DELETE` on `payment_orders` or `user_entitlements`.
- **Authoritative RPC execution:** All mutations occur inside PostgreSQL `SECURITY DEFINER` functions:
  - `create_payment_order(p_product_id TEXT, p_is_sandbox BOOLEAN)`
  - `verify_and_fulfill_payment(p_order_id TEXT, p_utr TEXT, p_signature TEXT, p_raw_payload TEXT, p_is_sandbox BOOLEAN)`
  - `cancel_payment_order(p_order_id TEXT, p_reason TEXT)`
  - `check_user_entitlement(p_user_id UUID, p_entitlement_key TEXT)`
  - `get_user_payment_history()`
  - `get_admin_payment_analytics()`
- **Admins:** Full read-only or administrative oversight over all tables and analytics.

---

## 4. Checkout Experience (UI / UX)

- **Vector QR Code Canvas:** Generated in-memory via `QRCode.toCanvas` using standard NPCI UPI parameters (`upi://pay?pa=...&pn=PR+Builder&am=...&cu=INR&tn=...`).
- **1-Tap Mobile Intent Buttons:** Deep links to Google Pay, PhonePe, Paytm, and BHIM for seamless mobile completion.
- **5-Minute Countdown Timer:** Automatically expires pending sessions to protect against stale pricing and order tampering.
- **Real-Time Polling:** Automatically queries order status every 2.5 seconds. When confirmed, displays an animated success receipt and unlocks the feature immediately.
- **Student History:** Viewable under `Settings -> Payments & Entitlements` (`PaymentHistoryView.tsx`).

---

## 5. Admin Dashboard & Reporting

- Located in the Admin Console under the **Payments & Revenue** tab (`AdminPaymentsView.tsx`).
- **Real-Time KPIs:** Total gross revenue (₹), total settled count, in-flight orders, and cancellation stats.
- **Revenue Trajectory:** 14-day interactive area chart built with Recharts.
- **Audited Ledger:** Filter by status, search by order ID or UTR.
- **Financial CSV Export:** RFC 4180-compliant export with defense against spreadsheet formula injection (`=`, `+`, `-`, `@`).

---

## 6. Sandbox Simulation & Verification

In test environments (`VITE_PAYMENT_MODE=sandbox`):
1. Clicking a locked template, theme, or domain pass opens `CheckoutModal`.
2. The modal displays a dedicated **Developer Sandbox Test Simulation** card.
3. Clicking **Simulate Successful UPI Payment** triggers mock webhook fulfillment with a generated UTR (`UTR...`).
4. Entitlements are immediately granted and cached.
5. In production mode (`VITE_PAYMENT_MODE=live`), sandbox simulation triggers are strictly suppressed.

---

## 7. Legal Disclaimer & Production Readiness

> ⚠️ **Important Legal & Operational Notice**
> 
> YouPI-PG is an experimental peer-to-peer UPI research project. It is **not** an authorized Payment Aggregator (PA) or Payment Gateway (PG) licensed by the Reserve Bank of India (RBI) or the National Payments Corporation of India (NPCI).
> 
> Production deployments conducting commercial payment collection must integrate an RBI-licensed Payment Aggregator (e.g., Razorpay, Cashfree, or PhonePe PG). PR Builder's payment module is built on an isolated adapter pattern (`paymentService.ts`), enabling seamless substitution of the underlying gateway provider without modifying frontend builders or user entitlement schemas.
