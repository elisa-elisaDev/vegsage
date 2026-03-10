# VegSage — Legal Notes

This file documents legal obligations and decisions for the VegSage service.

---

## 1. Food Data — Open Food Facts

**Source:** https://world.openfoodfacts.org
**License:** Open Database License (ODbL) v1.0
**Attribution required:** Yes

### ODbL Key Obligations
- **Attribution:** Must credit Open Food Facts whenever data is displayed or used.
  VegSage displays attribution in the app settings, footer, and `/legal/data-sources` page.
- **Share-alike:** Any *database* derived from OFF must also be released under ODbL.
  VegSage does NOT create a derived database — it caches individual user-searched items
  privately per account. This cache is not publicly distributed or redistributed.
- **Keep open:** Not applicable (VegSage's cache is not a public database redistribution).

### VegSage's Usage Pattern
VegSage queries the OFF public API at search/lookup time and stores minimal food data
in a **private per-user cache** (`foods_cache` table with RLS). This is analogous to
a browser cache — not a database republication. We do not serve OFF data to third parties.

---

## 2. USDA FoodData Central (FDC)

- FDC data is in the **public domain** (US Government work).
- VegSage includes a stub for FDC as an optional fallback (not active in MVP).
- If activated: add attribution on `/legal/data-sources` and in settings.
- FDC API key required (free): https://fdc.nal.usda.gov/api-guide.html

---

## 3. Paddle — Merchant of Record

Paddle.com Market Ltd. acts as the **Merchant of Record** for VegSage subscriptions. This means:
- Paddle is the legal seller of record, not the VegSage operator.
- Paddle handles invoicing, VAT/sales tax collection, and remittance in all jurisdictions.
- Paddle provides buyer-facing receipts and handles payment disputes per their policies.
- VegSage receives subscription status via webhook; payment card data is never seen or stored by VegSage.
- Refund policy must be consistent with Paddle's policies. See `/legal/refunds`.

**Paddle Buyer Terms:** https://www.paddle.com/legal/buyer-terms

---

## 4. GDPR / Swiss FADP Compliance

### Controller Identity
The operator of VegSage is the data controller. Identity must be filled in `legalConfig.ts`
and environment variables before public launch.

### Data Processed
| Category | Data | Purpose | Legal Basis |
|---|---|---|---|
| Account | Email, hashed password | Authentication | Contract |
| Nutrition | Meals, foods, scores | Core service | Contract |
| Payment | Customer ID, subscription status (from Paddle) | Billing | Contract |
| Technical | IP, timestamps (Supabase/Vercel logs) | Security | Legitimate interest |

### Sub-processors
- **Supabase Inc.** — database + auth hosting (DPA available)
- **Vercel Inc.** — application hosting (DPA available)
- **Paddle.com Market Ltd.** — payments (MoR, separate privacy policy)

### Retention
- User data: lifetime of account
- Post-deletion: 30 days max, then purged
- Exception: billing records retained by Paddle per their legal obligations

### User Rights
Handled via email request to `contact.vegsage@gmail.com`. Delete account = delete all data.

---

## 5. Switzerland-Specific (nDSG / FADP)

- Swiss law requires a **clear operator identity** and contact on the website (imprint/legal notice).
  → See `/legal/contact` page.
- The Swiss FADP (nDSG, in force since Sept 2023) requires a privacy policy covering
  data collection, purposes, recipients, and user rights.
  → See `/legal/privacy` page.
- Swiss law does not require cookie banners for purely functional cookies (session auth).
  VegSage uses only the Supabase auth cookie — no analytics cookies by default.

---

## 6. Links to Internal Legal Pages

- Terms of Service: https://vegsage.com/legal/terms
- Privacy Policy: https://vegsage.com/legal/privacy
- Refund Policy: https://vegsage.com/legal/refunds
- Contact / Imprint: https://vegsage.com/legal/contact
- Data Sources: https://vegsage.com/legal/data-sources

---

*Last updated: 2025-01-01. Review annually or on material changes.*
