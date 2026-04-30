# MSI Quote Studio

> AI-enhanced quote estimator for custom manufacturing — complexity scoring, calibrated price recommendations, and rule-based estimating in one workflow.

**Portfolio case study by Samuel Muriuki — inspired by Marking Systems Inc.**

🌐 **Live demo:** https://msi-quote-studio.vercel.app

---

## What this is

A working demo of an estimating module designed around the operational reality of a durable-label and die-cut converter. Estimators describe a job; the system returns a complexity score (1–10), a suggested price range, and a plain-English rationale grounded in the specs. Every prediction is logged for audit and future model evaluation.

The catalog (16 products, 14 materials, 8 industries with certification premiums) is seeded from publicly visible Marking Systems Inc. product categories so the demo behaves like a real estimating tool, not a sandbox.

## Demo credentials (sign-in page autofills these)

```
email:    demo@msi-quote-studio.com
password: demo-account-2026
```

The sign-in page has a **one-click "Sign in as demo →" button** that fills + submits — reviewers can land in the app in under 5 seconds. The demo account is pre-seeded with 11 realistic quotes spread across categories, statuses and 78 days so the dashboard, pipeline, and reports all have meaningful data on first load.

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript** (strict)
- **Tailwind v4** · **shadcn/ui** · **lucide-react** · **Recharts**
- **Supabase Postgres** (direct SQL via `@supabase/supabase-js`, no ORM)
- **Better Auth** (email/password) backed by `pg.Pool`
- **Groq** for AI inference (`llama-3.3-70b-versatile`, structured-JSON output, ~14 ms round-trip in tests)
- **Vercel** deployment, **Cloudflare** DNS

## Features shipped

- ✅ Landing page with Industrial Slate branding (light + dark)
- ✅ Email/password authentication with one-click demo sign-in
- ✅ New Quote form — pick product / material / industry / dimensions / quantity, with live base estimate preview
- ✅ Quote Detail page with the AI Analysis panel (the centerpiece moment)
  - Complexity gauge (1–10) with gradient fill
  - Suggested price range (low–high) prominently displayed
  - Plain-English rationale (2–3 sentences)
  - Model + latency footer
- ✅ Quote actions — mark sent / accepted / declined / re-open as draft, with state-machine transition guards server-side
- ✅ `/quotes` pipeline — KPIs, status + date-range filters, sortable table, click-through to detail
- ✅ `/reports` dashboard — pipeline-value KPI, conversion rate, weekly volume line chart, category bar chart, status-by-month stacked bar, top-10 pipeline table
- ✅ Branded 404 + global error boundary + protected-route loading skeleton
- ✅ Mobile responsive (360 / 375 / 414 / 768 / 1440)
- ✅ Robots.txt, sitemap.xml, OpenGraph + Twitter card metadata

## Architecture highlights

- **Server-first.** All DB queries and Groq calls happen server-side — the service-role Supabase client and `GROQ_API_KEY` never enter the browser bundle.
- **Audit log on every AI call.** Every Groq inference writes a row to `ai_predictions` with the model, latency, and token usage — the demo persists what most production ML systems forget to.
- **Type-safe DB layer.** Supabase's generated `Database` type powers `TablesInsert`, `TablesUpdate`, etc. — no `any`s in the data path.
- **State-machine guards on quote transitions.** Server actions enforce valid status moves (e.g. `accepted` is terminal except for the explicit re-open path).
- **Consistent design tokens.** Brand colours live as CSS variables in `globals.css`, exposed to Tailwind via `@theme`. Charts use a shared `chart-palette.ts` so series colours match across the reporting dashboard.

## Getting started locally

```bash
# 1. Clone
git clone https://github.com/Samuel-Muriuki/msi-quote-studio.git
cd msi-quote-studio

# 2. Install (Node 20+, pnpm 10+)
pnpm install

# 3. Environment
cp .env.example .env.local
#   Fill in DATABASE_URL (Supabase pooler), SUPABASE_*, BETTER_AUTH_SECRET, GROQ_API_KEY
#   (see .env.example inline comments for dashboard links)

# 4. Develop
pnpm dev
#   → http://localhost:3000

# 5. (One-time) Seed the demo account + sample quotes
pnpm exec tsx --env-file=.env.local scripts/seed-demo-user.ts
pnpm exec tsx --env-file=.env.local scripts/seed-demo-quotes.ts
```

## Project structure

```
.ai/                     ← project brief and brand decision (committed reference)
supabase/migrations/     ← 0001 better auth · 0002 app schema · 0003 seed catalog
src/
├── app/
│   ├── (auth)/          ← sign-in, sign-up
│   ├── (app)/           ← dashboard, /quotes, /quotes/new, /quotes/[id], /reports
│   ├── api/auth/[...all]/  ← Better Auth catch-all handler
│   └── api/quotes/[id]/analyze/  ← POST → Groq inference + ai_predictions audit insert
├── components/          ← shadcn/ui primitives + project components (theme toggle, sign-out, status badge)
├── lib/                 ← supabase clients, auth, groq, estimator, quote-helpers, chart-palette
└── types/supabase.ts    ← generated from live schema
scripts/
├── seed-demo-user.ts    ← idempotent demo estimator account
└── seed-demo-quotes.ts  ← idempotent 11-quote seed for the demo dashboards
```

## Roadmap (post-demo)

- [ ] Multi-tenancy (orgs / shared workspaces) — currently single-workspace
- [ ] Email delivery for quote-sent notifications (Resend)
- [ ] PDF export of accepted quotes
- [ ] Real Marking Systems certification weights re-validated with an estimator-in-the-loop
- [ ] Loom walkthrough recorded — see `.ai/docs/LOOM-SCRIPT.md`

## Disclaimer

This is an independent portfolio project, inspired by Marking Systems Inc.'s public product catalog. It is not built for or endorsed by Marking Systems Inc., and is not a commercial offering. The branding ("Industrial Slate") is deliberately distinct from the company's actual brand. Product category names are referenced descriptively for catalog seeding only.

## Author

**Samuel Muriuki** — sammkimberly@gmail.com
