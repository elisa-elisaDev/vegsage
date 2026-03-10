# VegSage

> Feel confident about your vegetarian nutrition.

A PWA (Next.js + Supabase) for vegetarians to track key micro-nutrients and get a personalized Vegetarian Confidence Score.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| UI | TailwindCSS |
| Auth + DB | Supabase (Postgres + Auth) |
| Payments | Paddle (Merchant of Record) |
| Hosting | Vercel |
| Food data | Open Food Facts (ODbL) |

---

## Local Setup

### Prerequisites
- Node.js 20+
- A Supabase project
- A Paddle account (sandbox for testing)

### 1. Clone and install

```bash
git clone <repo>
cd vegsage
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
# Fill in all values — see .env.example for documentation
```

### 3. Supabase — run schema

1. Open your Supabase project → SQL Editor → New Query
2. Paste and run `supabase/schema.sql`
3. Paste and run `supabase/rls.sql`
4. Paste and run `supabase/migrations/002_schema_v2.sql`
5. Paste and run `supabase/migrations/003_paddle_profile_columns.sql`

### 4. Run dev server

```bash
npm run dev
# → http://localhost:3000
```

### 5. Scripts

| Script | Command |
|---|---|
| Dev | `npm run dev` |
| Build | `npm run build` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Tests | `npm run test` |

---

## Architecture

```
app/                        Next.js app router
  layout.tsx                Root layout (SW registration, Footer)
  page.tsx                  Landing page
  login/page.tsx            Login
  signup/page.tsx           Signup
  (protected)/
    layout.tsx              Auth guard + nav
    dashboard/page.tsx      Today's dashboard
    add/page.tsx            Add food
    score/page.tsx          Score detail
    settings/page.tsx       Settings
  api/
    food/search/route.ts    OFF text search
    food/barcode/route.ts   OFF barcode lookup
    food/log/route.ts       Log food + trigger daily summary recompute
    locale/route.ts         Set locale cookie
    paddle/checkout/route.ts Paddle checkout URL
    paddle/webhook/route.ts  Paddle webhook (idempotent)
  legal/                    Legal pages

components/                 UI components
lib/                        Server + client utilities
supabase/                   SQL schema + RLS + migrations
docs/                       Deployment, legal, beta docs
```

---

## Key Data Flow

1. User searches food → OFF API → results displayed
2. User confirms quantity → `POST /api/food/log` → inserts into `food_logs`
3. `compute_daily_summary(user_id, date)` RPC runs → upserts `daily_summaries`
4. Dashboard reads `food_logs` + `daily_summaries` server-side

---

## Score Engine

Score = weighted average of 6 nutrient ratios (today's totals vs. daily targets).

Weights: B12 20% · Iron 20% · Protein 20% · Calcium 15% · Omega-3 15% · Zinc 10%

Insights fire when any nutrient score < 75 (max 3 shown).

---

## Legal

- Food data: Open Food Facts (ODbL) — see `/legal/data-sources`
- Privacy: GDPR + Swiss FADP compliant — see `/legal/privacy`
- Payments: Paddle as Merchant of Record — see `/legal/terms`
- Fill in `lib/legalConfig.ts` / env vars with real operator identity before launch

---

## Food Data Attribution

Nutritional data provided by **Open Food Facts** (https://world.openfoodfacts.org),
licensed under the Open Database License (ODbL).
