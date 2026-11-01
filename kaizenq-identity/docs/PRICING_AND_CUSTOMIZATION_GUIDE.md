# PR Builder — Pricing, Customization & Checkout Engine Architecture

## 1. Architectural Overview

The PR Builder Pricing, Customization & Checkout Engine provides a production-grade, server-authoritative monetary catalog, dynamic visual styling controls, bundle savings computation, coupon discounts, and duplicate charge prevention for resume and portfolio SaaS products.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT / USER WORKSPACE                         │
│  - Resume Builder: Templates, Typography, Colors, Spacing              │
│  - Portfolio Studio: Themes, Accent Colors, Animations, Layout Density │
│  - Pricing Cart: Add-on Checkboxes, Bundle Upgrade Toggle, Coupons     │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│               SERVER-AUTHORITATIVE RPC & SECURITY LAYER                │
│  - calculate_cart_pricing(p_product_id, p_addon_ids, p_coupon_code)   │
│  - create_payment_order(p_user_id, p_product_id, p_is_sandbox, ...)   │
│  - update_product_price(p_product_id, p_new_price_paise, p_reason)     │
│  - toggle_product_status(p_product_id, p_is_active)                   │
│  - get_admin_pricing_catalog()                                         │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     DATABASE TABLES & AUDIT TRAIL                      │
│  - payment_products (integer paise price_paise, target_id, is_active)  │
│  - payment_orders (amount_paise, discount_paise, status, utr)          │
│  - user_entitlements (user_id, entitlement_key, is_active)             │
│  - payment_audit_logs (actor_user_id, action, metadata, created_at)    │
│  - coupons & coupon_redemptions (server eligibility & usage quotas)    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Server-Authoritative Catalog & Product Mappings

All monetary amounts are strictly persisted and computed in **integer paise** (100 paise = ₹1.00 INR) to avoid floating-point rounding errors. Frontend components receive formatted INR values for display while checkout sessions operate on integer paise.

| Product ID | Display Name | Category | Catalog Price (Paise) | Display Price (₹) | Authoritative Entitlement Key |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `pro-template-modern-professional` | Modern Professional Resume Template | `resume_template` | `19900` | ₹199.00 | `template:modern-professional` |
| `pro-template-technical` | Technical Developer Resume Template | `resume_template` | `19900` | ₹199.00 | `template:technical` |
| `pro-theme-creative` | Creative Studio Portfolio Theme | `portfolio_theme` | `29900` | ₹299.00 | `theme:creative` |
| `pro-theme-modern` | Modern Clean Portfolio Theme | `portfolio_theme` | `29900` | ₹299.00 | `theme:modern` |
| `custom-domain-pass` | Instant Custom Domain Pass | `domain_pass` | `49900` | ₹499.00 | `domain:custom` |
| `pro-all-access-pass` | PR Builder Pro All-Access Lifetime Pass | `bundle` | `99900` | ₹999.00 | `bundle:all_access` |

### Bundle Savings Economics
- **Individual Component Sum**: ₹199 + ₹199 + ₹299 + ₹299 + ₹499 = **₹1,495.00** (149,500 paise)
- **All-Access Lifetime Pass Price**: **₹999.00** (99,900 paise)
- **Customer Bundle Savings**: **₹496.00** (49,600 paise)
- **Capabilities Granted**: Grants `bundle:all_access`, which immediately unlocks all current and future premium resume templates, portfolio themes, and custom domain linking without duplicate purchases.

---

## 3. Protected Free Tier Invariants

Basic editing, section management, draft saving, sample loading, and export remain **100% free forever**. Payment is never required merely to start or use the application.

### Always-Free Resume Templates
1. `classic-ats` — Standard high-readability ATS single-column layout
2. `minimal` — Clean editorial serif & sans layout
3. `classic` — Traditional executive layout
4. `modern` — Clean balanced contemporary layout

### Always-Free Portfolio Themes
1. `developer` — Terminal & monospace developer portfolio
2. `minimal` — High-contrast typography with light/dark toggle
3. `midnight` — Dark-mode sleek software showcase (alias to modern)

---

## 4. Resume Customization Engine

Located in `src/pages/Resume/components/` and rendered by `ModernProfessionalTemplate.tsx`, `TechnicalTemplate.tsx`, `ClassicAtsTemplate.tsx`, and `MinimalTemplate.tsx`:

- **Typography / Fonts**:
  - `sans` (Inter Sans) — Modern, legible, and recruiter-tested
  - `serif` (Merriweather Serif) — Executive, literary, and formal
  - `mono` (JetBrains Mono) — Terminal-tuned for engineering stacks
- **Accent Colors**: Slate (`#0F172A`), Navy (`#1E3A8A`), Royal Blue (`#2563EB`), Emerald (`#047857`), Crimson (`#991B1B`), Violet (`#7C3AED`), or custom color picker
- **Layout Spacing**:
  - `compact` (High density for 1-page targets)
  - `normal` (Standard balanced spacing)
  - `relaxed` (Spacious and breathable)
- **Zero Data Loss Guarantee**: All customization settings are stored directly in `resumeData.customization`. Switching templates, updating fonts, previewing, or opening/cancelling checkout preserves 100% of user data.

---

## 5. Portfolio Customization Engine

Located in `src/pages/Portfolio/components/builder/PortfolioToolbar.tsx` and rendered by `PublicPortfolioView.tsx`:

- **Theme Selection**: Developer, Minimal, Creative Studio (Pro), Modern Clean (Pro)
- **Accent Colors**: Emerald, Royal Blue, Cyan, Violet, Amber, Rose, or hex color picker
- **Micro-Animations Toggle**: Enables or disables smooth CSS hover transforms and entrance animations
- **Layout Density**: Compact, Normal, Relaxed / Spacious
- **Preview & Publication**: Instant deployment to `kaizenq.me/portfolio/[slug]` or linked custom domain.

---

## 6. Cart Pricing Engine & Bundle Calculations

The cart pricing calculation is executed authoritatively on the server via `calculate_cart_pricing` RPC or simulated offline by `paymentService.calculateCartPricing`:

```typescript
const cart = await paymentService.calculateCartPricing(
  'pro-template-modern-professional',
  ['custom-domain-pass'],
  'WELCOME10'
)

// Output Breakdown:
// - Items: Modern Professional (₹199) + Custom Domain Pass (₹499) = ₹698 subtotal
// - Coupon Discount: -₹69.80 (10% of ₹698)
// - Payable Amount: ₹628.20 (62820 integer paise)
// - Tax Disclosure: "18% GST Included in MRP • Zero Gateway Surcharges"
```

### Server-Authoritative Integrity Rules
- The server never accepts client-submitted prices, discounts, or subtotals.
- Product existence and prices are queried directly from `payment_products`.
- If an entitlement is already owned, the frontend flags it as owned and disables duplicate purchase.

---

## 7. Coupon Integration & Zero-Payable Fulfillment

The system supports percentage discounts, fixed discounts, and 100% promotional codes:

1. **Percentage Discounts**: Evaluated against the server-verified cart total in integer paise.
2. **Eligibility Filtering**: Restricts coupons to configured product IDs or user tiers.
3. **100% Free Coupons (e.g. `HACKATHON100`)**:
   - Resulting `finalAmountPaise` is `0`.
   - Bypasses UPI QR code generation and gateway payment sessions.
   - Invokes `fulfill_free_order` server RPC to create a verified order and grant the entitlement immediately with status `paid`.

---

## 8. Entitlements & Duplicate Charge Prevention

Entitlements are managed via `useEntitlements.ts` and the `user_entitlements` PostgreSQL table:

```typescript
const { hasAllAccessPass, hasDomainPass, isTemplateUnlocked, isThemeUnlocked } = useEntitlements()
```

- When a user owns an entitlement (e.g. `template:technical` or `bundle:all_access`), `PremiumUpgradeModal` displays:
  - Status badge: `OWNED`
  - Message: `You already own this premium feature`
  - Action button: `Apply Unlocked Template`
  - Disables the UPI checkout button to prevent duplicate charges.

---

---

## 10. Builder Tabs Visible Pricing & Customization Architecture

PR Builder strictly displays pricing and customization options **directly inside the Resume Builder and Portfolio Builder tabs**, rather than forcing users onto a disconnected pricing page.

### Resume Builder Tab Integration (`ResumePricingSection.tsx`)
- Located directly beneath the editor toolbar at the top of the Resume Builder tab.
- **Always-Free Tier (₹0)**:
  - `classic-ats`: Standard high-readability ATS single-column format
  - `minimal`: Minimal editorial serif & sans format
  - `classic`: Classic executive format with centered coordinates
  - `modern`: Balanced contemporary layout with subtle divider rules
- **Premium Tier (Catalog-verified ₹199)**:
  - `pro-template-modern-professional`: Modern Professional Resume Template
  - `pro-template-technical`: Technical Developer Resume Template
- Dynamic template cards show:
  - Template name, free or premium badge
  - Real catalog price in INR
  - Interactive "Preview" action via `TemplatePreviewModal`
  - "Select Template" action with instant data preservation
  - Active / Unlocked / Free Forever status badge.

### Portfolio Builder Tab Integration (`PortfolioPricingSection.tsx`)
- Located directly at the top of the Portfolio Builder tab.
- **Always-Free Tier (₹0)**:
  - `developer`: Code-first monospace terminal aesthetic
  - `minimal`: High-contrast editorial portfolio with theme toggle
  - `midnight`: Sleek dark-mode showcase with ambient blue glow
- **Premium Tier (Catalog-verified ₹299)**:
  - `pro-theme-creative`: Creative Studio Portfolio Theme
  - `pro-theme-modern`: Modern Clean Portfolio Theme
- Visual theme cards display preview color palettes, catalog prices, preview modals, and one-click selection.

### Customization Pricing Panel (`CustomizationPricingPanel.tsx`)
Inside both builders, users can inspect supported customization options:
- **Fonts & Typography**: Inter Sans, Merriweather Serif, JetBrains Mono — **Included in all templates (₹0)**.
- **Color Palettes**: Curated HSL palettes + native hex picker — **Included in all templates (₹0)**.
- **Layout Spacing & Density**: Compact, Normal, Relaxed/Spacious — **Included in all templates (₹0)**.
- **Portfolio Visual Effects**: CSS hover transforms & entrance effects — **Included in Portfolio Studio (₹0)**.
- **Custom Domain Pass**: DNS edge routing & automated SSL — **₹499 (Catalog verified)**.
- **PR Builder Pro All-Access Lifetime Pass**: All Pro templates, themes, and domain pass — **₹999 (Catalog verified)**.
- **Draft Features**: Proposed options (e.g. ₹49 Custom Font Upload, ₹99 Custom CSS) are visibly badged as **Admin Draft** and remain strictly unbillable until approved by the admin.

### Interactive Selection-Based Custom Price Calculator (`FeaturePricingCalculator.tsx`)
Both builders feature dedicated custom price calculators:
- **Resume Builder**: “Customize Your Resume & Get Pricing”
  - Select from 6 templates (4 Free, 2 Pro ₹199).
  - Inspect typography, color palettes, layouts, and section styling (included at ₹0).
  - Toggle optional add-ons: Instant Custom Domain Pass (₹499) and Pro All-Access Lifetime Pass (₹999, ₹496 discount).
- **Portfolio Builder**: “Build Your Portfolio Package”
  - Select from 5 themes (3 Free, 2 Pro ₹299).
  - Inspect typography, project layouts, hero styling, and visual effects (included at ₹0).
  - Toggle optional add-ons: Custom Domain Routing Pass (₹499) and Pro All-Access Lifetime Pass (₹999).
- **Dynamic Updates**: Changing any selection recalculates the estimated total immediately.
- **Zero Data Loss**: Switching templates or selecting add-ons preserves 100% of user-entered resume and portfolio draft data.

### Live Pricing Summary & Cart (`LivePricingSummary.tsx`)
- Appears whenever a user selects an unowned Pro template, theme, or add-on.
- Dynamically recalculates itemized totals in **authoritative integer paise** via `calculate_cart_pricing` RPC.
- Displays:
  - Selected features with individual prices and Remove (X) actions
  - Original subtotal
  - Configured bundle discount (if All-Access pass is selected)
  - Promotional coupon input and discount breakdown
  - 18% GST included note (₹0 extra surcharges)
  - Final payable amount in authoritative integer paise
  - Action buttons: [Clear selections], [Continue to preview], [Continue to checkout]
- Prevents duplicate purchases by detecting already-owned entitlements.

---

## 11. Admin Configuration & Governance

- **Catalog & Price Control**: Authorized administrators can adjust product prices and toggle availability in `AdminPricingView.tsx`.
- **Audit Logging**: Every price update requires a mandatory audit justification reason saved to `payment_audit_logs`.
- **Draft Proposed Products Lifecycle**: Admins can review proposed draft features (Custom font upload ₹49, Custom CSS injection ₹99) and approve them into the live database catalog with audit logging.
- **Security Definer & RLS**: Prevents privilege escalation and never exposes secrets to the frontend.

---

## 12. Test Execution & Verification

Run the entire test suite:
```bash
npm test
```

### Verified Test Results
- **Suite 1 (Full Platform Validation)**: 601 tests passed (0 failed)
- **Suite 2 (Coupons & Promotions)**: 64 tests passed (0 failed)
- **Suite 3 (Pricing, Customization & Calculator)**: 134 tests passed (0 failed)
- **Suite 4 (Custom Domain Management)**: 28 tests passed (0 failed)
- **Suite 5 (ATS Resume Vector PDF Export)**: 25 tests passed (0 failed)
- **Total Test Count**: **852 automated tests passing (0 failures)**
- **TypeScript**: `npx tsc -b` exited with code 0 (zero errors)
- **Linter**: `npm run lint` exited with code 0 (zero warnings)
- **Production Build**: `npm run build` completed successfully


