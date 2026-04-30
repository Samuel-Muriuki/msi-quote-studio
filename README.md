# MSI Quote Studio

> AI-enhanced quote estimator for custom manufacturing — complexity scoring, calibrated price recommendations, and rule-based estimating in one workflow.

**Portfolio case study by Samuel Muriuki — not affiliated with Marking Systems Inc.**

---

## What this is

A working demo of an estimating module designed around the operational reality of a durable-label and die-cut converter. Estimators describe a job; the system returns a complexity score (1–10), a suggested price range, and a plain-English rationale grounded in the specs. Every prediction is logged for audit and future model evaluation.

The catalog (products, materials, industries, certification premiums) is seeded from publicly visible Marking Systems Inc. product categories so the demo behaves like a real estimating tool, not a sandbox.

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript** (strict)
- **Tailwind v4** · **shadcn/ui** · **lucide-react**
- **Supabase Postgres** (direct SQL via `@supabase/supabase-js`, no ORM)
- **Better Auth** (email/password)
- **Groq** for AI inference (free tier, OpenAI-compatible API)
- **Cloudflare Pages** deployment via `@opennextjs/cloudflare`

## Getting started

```bash
# 1. Clone
git clone https://github.com/Samuel-Muriuki/msi-quote-studio.git
cd msi-quote-studio

# 2. Install (Node 20+, pnpm 10+)
pnpm install

# 3. Environment
cp .env.example .env.local
#   then fill in DATABASE_URL, SUPABASE_*, BETTER_AUTH_SECRET, GROQ_API_KEY
#   (see .env.example for source links)

# 4. Develop
pnpm dev
#   → http://localhost:3000
```

## Project structure

```
.ai/              ← project conventions, brief, brand decision (committed)
src/
├── app/          ← Next.js App Router (pages, route handlers, server actions)
├── components/   ← shadcn/ui primitives + project components
└── lib/          ← shared utilities (supabase clients, groq, estimator)
```

## Status

Active 3-day demo build (started 2026-04-30). Roadmap:

- [x] Foundation: scaffold, brand tokens, theme toggle, landing placeholder, deployment
- [ ] Schema + seed data (Marking Systems catalog)
- [ ] Better Auth (email/password) + protected app routes
- [ ] New Quote form with rule-based estimator
- [ ] AI complexity scoring (Groq) + audit log
- [ ] Quote Detail page with AI analysis panel
- [ ] Quotes Dashboard + Reporting Dashboard
- [ ] Mobile responsiveness pass + Loom walkthrough

## Disclaimer

This is an independent portfolio project. It is not built for, endorsed by, or affiliated with Marking Systems Inc. The branding ("Industrial Slate") is deliberately distinct from the company's actual brand. Product category names are referenced descriptively for catalog seeding only.

## Author

**Samuel Muriuki** — sammkimberly@gmail.com
