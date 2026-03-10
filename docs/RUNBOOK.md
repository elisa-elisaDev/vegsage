# VegSage — Operational Runbook

> Keep this document updated as the system evolves. Reference the DEPLOYMENT_CHECKLIST for first-time setup.

---

## 1. Architecture overview

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 15 App Router (TypeScript) | Deployed on Vercel |
| Auth | Supabase Auth (email/password) | SSR cookie-based |
| Database | Supabase Postgres | RLS enabled on all user tables |
| Food data | Open Food Facts public API | Fetched on demand, cached per user log |
| Payments | Paddle Billing (Merchant of Record) | Webhooks → `/api/paddle/webhook` |
| i18n | Cookie-based (EN/FR/DE) | No URL prefix, `vegsage-locale` cookie |

---

## 2. Environment variables

See `.env.example` for the full list. Critical variables:

| Variable | Where it's used |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client (browser + server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin operations (webhook, recalculate) |
| `PADDLE_API_KEY` | Creating checkout sessions |
| `PADDLE_WEBHOOK_SECRET` | Verifying Paddle webhook signatures |
| `PADDLE_PRICE_MONTHLY` / `PADDLE_PRICE_YEARLY` | Checkout + plan resolution |

---

## 3. Database

### Tables

| Table | Purpose |
|---|---|
| `profiles` | One row per auth user. Stores locale, vegetarian_type, is_premium, paddle fields |
| `food_logs` | Every food entry logged by a user. Contains scaled nutrients_json |
| `daily_summaries` | One row per user per day. Holds confidence_score, breakdown_json, totals_json |
| `subscriptions` | Tracks Paddle subscription lifecycle |

### Migrations

Run in order on a fresh Supabase project:
1. `supabase/schema.sql` — profiles, foods_cache, meals, meal_items, daily_scores, insights + triggers
2. `supabase/rls.sql` — RLS policies for v1 tables
3. `supabase/migrations/002_schema_v2.sql` — food_logs, daily_summaries, subscriptions + RLS
4. `supabase/migrations/003_paddle_profile_columns.sql` — Paddle billing columns + indexes

```bash
# Using Supabase CLI
supabase db push
# Or paste each file in order in the SQL editor
```

### Score recomputation

The PL/pgSQL function `compute_daily_summary(p_user_id, p_date)` recomputes the daily summary. It is called after every food log via `/api/food/log`.

To manually trigger recomputation for all users (e.g., after a scoring weight change):
```sql
-- Run in Supabase SQL editor
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT DISTINCT user_id, log_date FROM food_logs LOOP
    PERFORM compute_daily_summary(r.user_id, r.log_date);
  END LOOP;
END $$;
```

---

## 4. Deployment

### Vercel

1. Connect the GitHub repo in Vercel dashboard.
2. Set all environment variables in Vercel project settings.
3. Set the build command to `next build` and output directory to `.next`.
4. Each push to `main` triggers a production deployment.

### Paddle webhook

1. In Paddle dashboard: **Developer Tools → Notifications → New endpoint**
2. URL: `https://your-domain.com/api/paddle/webhook`
3. Events to subscribe:
   - `transaction.completed`
   - `subscription.created`
   - `subscription.activated`
   - `subscription.updated`
   - `subscription.canceled`
   - `subscription.paused`
   - `subscription.resumed`
   - `subscription.expired`
   - `subscription.past_due`
4. Copy the webhook secret → set as `PADDLE_WEBHOOK_SECRET`

---

## 5. Monitoring & Alerts

- **Vercel logs**: Check function logs for API route errors.
- **Supabase logs**: Check Postgres logs for slow queries or RLS failures.
- **Paddle dashboard**: Monitor failed transactions and subscription events.

### Common errors

| Error | Likely cause | Fix |
|---|---|---|
| `401` from Supabase | Expired or missing session cookie | User must re-login |
| `compute_daily_summary` RPC error | Function not deployed or schema mismatch | Run migration 002 |
| Paddle webhook `401` | Wrong `PADDLE_WEBHOOK_SECRET` | Update env var in Vercel |
| `food_logs` insert fails | Missing RLS policy | Check `002_schema_v2.sql` RLS for food_logs |

---

## 6. Incident response

### User reports wrong score
1. Check `daily_summaries` for the user/date in Supabase.
2. If `breakdown_json` is empty: `food_logs` were logged but summary not computed — call `compute_daily_summary` manually.
3. If `food_logs` is empty: user hasn't logged food yet.

### User can't log in
1. Check Supabase Auth → Users — is the email confirmed?
2. Check Supabase Auth logs for auth errors.
3. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct in Vercel.

### Paddle webhook not processing
1. Check Vercel function logs for `/api/paddle/webhook`.
2. Verify signature: ensure `PADDLE_WEBHOOK_SECRET` matches the Paddle dashboard.
3. Check idempotency: duplicate event IDs are silently skipped — expected behavior.

### Premium not activated after payment
1. Check Paddle dashboard — did the webhook fire?
2. Check Vercel logs for `/api/paddle/webhook` errors.
3. Manual fix: in Supabase SQL editor:
```sql
UPDATE profiles
SET is_premium = true,
    premium_expires_at = NOW() + INTERVAL '1 month'
WHERE id = 'USER_UUID_HERE';
```

---

## 7. Maintenance tasks

### Update `LAST_UPDATED` in legal pages
Edit `lib/legalConfig.ts`:
```ts
LAST_UPDATED: "2025-XX-XX",
```

### Add a new language
1. Add the locale to `lib/i18n.ts`: add to `locales` array, add a new `Dict` object, export in `dictionaries`.
2. Update the settings page locale list (`app/(protected)/settings/page.tsx`).
3. Update `middleware.ts` `Accept-Language` detection if needed.

### Update scoring weights
Edit `lib/scoring.ts` `WEIGHTS` object. After deploying, trigger a full recomputation (see §3).

---

## 8. Off-boarding / GDPR deletion

To delete a user and all their data:
```sql
-- Deletes cascade via FK: food_logs, daily_summaries, subscriptions
DELETE FROM auth.users WHERE id = 'USER_UUID_HERE';
-- Also delete their profile (if no cascade)
DELETE FROM profiles WHERE id = 'USER_UUID_HERE';
```

Cancel the Paddle subscription first if active.

---

*Last updated: 2026-03-04*
