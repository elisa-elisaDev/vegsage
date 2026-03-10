# VegSage — Deployment Checklist

---

## 1. Supabase Project Setup

- [ ] Create new Supabase project at supabase.com
- [ ] Note `Project URL` and `anon key` (Settings > API)
- [ ] Note `service_role key` (Settings > API — keep secret)
- [ ] Open SQL Editor → run `supabase/schema.sql`
- [ ] Open SQL Editor → run `supabase/rls.sql`
- [ ] Open SQL Editor → run `supabase/migrations/002_schema_v2.sql`
- [ ] Open SQL Editor → run `supabase/migrations/003_paddle_profile_columns.sql`
- [ ] Verify tables exist: profiles, food_logs, daily_summaries, subscriptions
- [ ] Verify RPC exists: `compute_daily_summary`
- [ ] Enable Email Auth (Authentication > Providers > Email)
- [ ] Optional: disable "Confirm email" for faster beta testing, re-enable for production

---

## 2. Vercel Project Setup

- [ ] Create new Vercel project → import from GitHub
- [ ] Set Framework: Next.js (auto-detected)
- [ ] Set Root Directory: `/` (default)
- [ ] Add all environment variables from `.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
PADDLE_PRODUCT_ID=pro_01kjvxcfpbf4gnfxw82t7fkvv
PADDLE_PRICE_MONTHLY=pri_01kjvxwzppnmmvz44qk306hk22
PADDLE_PRICE_YEARLY=pri_01kjvy0jc2pmeh57v8ympzcjyk
APP_URL=https://vegsage.com
NEXT_PUBLIC_APP_URL=https://vegsage.com
CONTACT_EMAIL=contact.vegsage@gmail.com
OPERATOR_NAME=<your name or company>
OPERATOR_ADDRESS=<your address>
OPERATOR_COUNTRY=Switzerland
GOVERNING_LAW=Switzerland
```

- [ ] Deploy and confirm build succeeds

---

## 3. Domain Setup (IONOS → Vercel)

- [ ] In Vercel: Settings > Domains > Add `vegsage.com`
- [ ] Vercel will show DNS values (A record + CNAME or nameservers)
- [ ] In IONOS DNS manager:
  - Add `A` record: `@` → Vercel IP (shown in Vercel)
  - Add `CNAME` record: `www` → `cname.vercel-dns.com`
- [ ] Wait for DNS propagation (5 min – 48h)
- [ ] Verify HTTPS works: https://vegsage.com

---

## 4. Supabase Auth — Redirect URLs

- [ ] In Supabase: Authentication > URL Configuration
  - Site URL: `https://vegsage.com`
  - Redirect URLs: add `https://vegsage.com/dashboard`

---

## 5. Paddle Setup

- [ ] Create Paddle account at paddle.com
- [ ] Create product (ID: `pro_01kjvxcfpbf4gnfxw82t7fkvv` — verify this matches your dashboard)
- [ ] Create prices (monthly €5.90, yearly €49)
- [ ] Configure webhook:
  - URL: `https://vegsage.com/api/paddle/webhook`
  - Events to subscribe:
    - `transaction.completed`
    - `subscription.created`
    - `subscription.activated`
    - `subscription.updated`
    - `subscription.canceled`
    - `subscription.paused`
    - `subscription.resumed`
    - `subscription.expired`
    - `subscription.past_due`
  - Copy webhook secret → set `PADDLE_WEBHOOK_SECRET` in Vercel
- [ ] Copy API key → set `PADDLE_API_KEY` in Vercel
- [ ] Re-deploy Vercel after updating env vars

---

## 6. Smoke Tests

### Auth
- [ ] Sign up with test email → confirm email flow works
- [ ] Log in → redirects to `/dashboard`
- [ ] Log out → redirects to `/login`

### Food tracking
- [ ] Search "lentils" → results appear < 1s
- [ ] Add lentils 150g → redirects to `/dashboard`
- [ ] Score card shows non-zero value
- [ ] Nutrient bars update

### Score
- [ ] `/score` shows breakdown per nutrient
- [ ] Add multiple foods over a few days → history list populates

### Paddle
- [ ] Click upgrade (monthly) → Paddle checkout opens
- [ ] Use Paddle sandbox test card → complete checkout
- [ ] Verify `is_premium=true` in Supabase `profiles` table
- [ ] Webhook logs show 200 OK

---

## 7. Legal — Before Public Launch

- [ ] Fill in real operator identity in Vercel env vars:
  - `OPERATOR_NAME`, `OPERATOR_ADDRESS`, `OPERATOR_COUNTRY`
- [ ] Review `/legal/terms`, `/legal/privacy`, `/legal/refunds`, `/legal/contact`
- [ ] Have a lawyer review if operating in the EU/CH commercially
- [ ] Update `LAST_UPDATED` date in `lib/legalConfig.ts`

---

## 8. PWA Icons

- [ ] Create icons: 192×192 and 512×512 PNG
- [ ] Place in `/public/icons/`
- [ ] Test "Add to Home Screen" on iOS and Android

---

## 9. Post-launch

- [ ] Monitor Vercel logs for errors
- [ ] Monitor Supabase logs for slow queries
- [ ] Set up Supabase database backups (daily)
