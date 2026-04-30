# MSI Quote Studio — Project Brief

> **Master spec for Claude Code.** Read this top-to-bottom before writing any code. Every decision below is intentional; do not deviate without explicit user approval.

**Project:** MSI Quote Studio
**Type:** Demo / portfolio case study
**Author:** Samuel Muriuki — sammkimberly@gmail.com
**Started:** 2026-04-30
**Hard deadline:** 3 days from project start
**Audience:** Pearl Talent recruiter (Zamira) + Marking Systems Inc. hiring team

---

## 1. Why this project exists

This is a **pre-emptive portfolio piece** for the Software & AI Developer (A332) role at Marking Systems Inc., placed via Pearl Talent. Samuel passed the top-grading interview on March 31, 2026 but the client interview has stalled in scheduling for over 30 days. Rather than send another follow-up email, the strategy is to ship a tangible, working demo of the kind of system described in the role brief — built specifically around Marking Systems' actual product catalog and operational context.

**The strategic objective:** show, don't tell. The hiring team described an estimating module redesign with AI integration. Build it. Send the live link.

**Audience composition:**
- Zamira (recruiter, non-technical) — needs the demo to look polished and be immediately understandable
- Marking Systems' technical lead — needs the architecture, schema, and AI integration to hold up to inspection
- Marking Systems' general manager — needs the dashboard / reporting view to communicate business value

The demo must satisfy all three audiences.

---

## 2. Product overview — one paragraph

**MSI Quote Studio** is a web-based quote estimator for custom manufacturing operations. An estimator inputs job parameters (product type, dimensions, material, quantity, industry, required certifications). The system returns a rule-based base estimate, then calls an LLM with structured specs to produce a complexity score (1–10), a suggested price range, and a plain-English rationale. The estimator can accept, override, and save the quote. A dashboard shows quote history with filters; a reporting view surfaces KPIs (quote volume by product, conversion rate, average value, estimator throughput). All AI predictions are logged with the actual final price for future model evaluation.

---

## 3. Scope — what we're building (and what we're NOT)

### In scope

- 5 pages: Landing, Sign In, New Quote, Quote Detail (with AI analysis), Quotes Dashboard, Reporting Dashboard
- Better Auth with email/password (no OAuth needed for a demo)
- 2 user roles: `estimator` (default) and `admin`
- Postgres schema: 6 tables (products, materials, industries, quotes, quote_items, ai_predictions, users via Better Auth)
- Real Marking Systems product catalog seeded (nameplates, overlays, membrane switches, die-cut categories)
- AI complexity scoring via Groq (free tier)
- Light + dark mode (mandatory per PROJECT-TEMPLATE.md)
- Mobile-responsive (360 / 375 / 414 viewports)
- Deployed to Vercel with Cloudflare DNS

### Out of scope (do NOT build these)

- ❌ OAuth providers (Google/GitHub) — email/password only
- ❌ Email notifications (no Resend integration)
- ❌ Payment integration
- ❌ File uploads / document attachments
- ❌ PDF generation of quotes
- ❌ Multi-tenant organisations (single workspace, all users see all quotes)
- ❌ Audit log UI (the `ai_predictions` table is the only audit surface)
- ❌ User invitations / admin user management UI
- ❌ I18n / multi-language
- ❌ Stripe / Polar / monetisation
- ❌ Production-grade error tracking (Sentry, etc.)
- ❌ Full test suite (one happy-path Playwright test is sufficient for the demo)
- ❌ Real-time collaboration / pubsub
- ❌ Search across quotes — basic table filters are enough

If the user asks for any of the above mid-build, push back and confirm before adding scope.

---

## 4. Tech stack (locked — do not deviate)

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 App Router | Samuel's daily stack; supports server actions and proper caching |
| Language | TypeScript strict | No `any` types in non-generated code |
| Styling | Tailwind CSS + shadcn/ui | Token-driven, easy theme work, mature component library |
| Charts | Recharts | Clean, lightweight, plays well with React |
| Database | Supabase (Postgres) | Managed Postgres; transferable narrative for "SQL Server" experience in interview |
| ORM / DB client | Direct SQL via `@supabase/supabase-js` (server) | Avoids Drizzle/Prisma overhead for a 3-day build |
| Auth | Better Auth | Samuel's preferred stack; user.id is TEXT (critical) |
| AI inference | Groq (free tier) | OpenAI-compatible API, fast, free for demo volume |
| AI model | `llama-3.3-70b-versatile` (or current Groq free-tier flagship) | Reasoning quality fine for structured complexity scoring |
| Hosting | Vercel | Standard Next.js deployment |
| DNS / TLS | Cloudflare | Per Samuel's standard infra |
| Logging | Console + DB audit trail (`ai_predictions` table) | No Sentry / Datadog for the demo |

### Required environment variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://...

# Better Auth
BETTER_AUTH_SECRET=<32+ char random string>
BETTER_AUTH_URL=https://msi-quote-studio.vercel.app

# Groq (free tier — sign up at console.groq.com)
GROQ_API_KEY=gsk_...

# App
NEXT_PUBLIC_APP_URL=https://msi-quote-studio.vercel.app
```

---

## 5. Database schema

All tables use Supabase Postgres. Critical constraint: **`user.id` from Better Auth is TEXT, not UUID** — every FK referencing the auth user MUST be declared `text`. This is the #1 source of silent breakage in Samuel's prior projects.

### Tables

```sql
-- =====================================================================
-- 001_initial_schema.sql
-- =====================================================================

-- Better Auth tables (these are created by the Better Auth CLI;
-- do not write them by hand. Run `npx @better-auth/cli generate`
-- after configuring lib/auth.ts. Better Auth creates: user, session,
-- account, verification.)

-- App tables below — all reference user.id as TEXT.

-- Products: catalog of Marking Systems product categories
CREATE TABLE products (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category    text        NOT NULL,  -- 'nameplate' | 'overlay' | 'membrane_switch' | 'die_cut_gasket' | 'emi_rfi' | 'thermal_management'
  name        text        NOT NULL,
  description text,
  base_price_per_sq_in numeric(10,4) NOT NULL,
  setup_fee   numeric(10,2) NOT NULL DEFAULT 0,
  min_qty     int         NOT NULL DEFAULT 1,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Materials: substrates, adhesives, overlaminates
CREATE TABLE materials (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text        NOT NULL,  -- 'substrate' | 'adhesive' | 'overlaminate'
  name        text        NOT NULL,
  description text,
  cost_per_sq_in numeric(10,4) NOT NULL,
  durability_score int    NOT NULL CHECK (durability_score BETWEEN 1 AND 10),
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Industries served (drives certification premium)
CREATE TABLE industries (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    text        NOT NULL UNIQUE,
  certification_premium   numeric(4,3) NOT NULL DEFAULT 1.000, -- multiplier (1.000 = no premium, 1.250 = +25%)
  required_certifications text[]      NOT NULL DEFAULT '{}',
  description             text,
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- Quotes: one row per quote
CREATE TABLE quotes (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name       text        NOT NULL,
  customer_email      text,
  product_id          uuid        NOT NULL REFERENCES products(id),
  material_id         uuid        NOT NULL REFERENCES materials(id),
  industry_id         uuid        NOT NULL REFERENCES industries(id),
  width_inches        numeric(8,3) NOT NULL,
  height_inches       numeric(8,3) NOT NULL,
  quantity            int         NOT NULL CHECK (quantity > 0),
  certifications      text[]      NOT NULL DEFAULT '{}',  -- e.g. ['UL', 'CSA', 'ISO 9001']
  notes               text,
  status              text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'expired')),
  base_estimate       numeric(12,2) NOT NULL,
  ai_complexity_score int,
  ai_suggested_price_low  numeric(12,2),
  ai_suggested_price_high numeric(12,2),
  ai_rationale        text,
  final_price         numeric(12,2),  -- set when status = 'accepted' or 'declined'
  estimator_id        text        NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,  -- TEXT, not UUID
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotes_estimator ON quotes(estimator_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);

-- AI Predictions audit log (every inference call is logged here)
CREATE TABLE ai_predictions (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id            uuid        REFERENCES quotes(id) ON DELETE CASCADE,
  model_used          text        NOT NULL,        -- e.g. 'llama-3.3-70b-versatile'
  prompt_input_hash   text        NOT NULL,        -- sha256 of the input JSON, for dedup analysis
  predicted_complexity int        NOT NULL,
  predicted_price_low  numeric(12,2) NOT NULL,
  predicted_price_high numeric(12,2) NOT NULL,
  rationale           text        NOT NULL,
  latency_ms          int,
  cost_usd            numeric(8,6),  -- nominal — Groq is free tier but track for portability
  feedback            text,         -- estimator's free-text feedback if they override
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_predictions_quote ON ai_predictions(quote_id);

-- ============================================================
-- RLS — relaxed for the demo. Enable RLS but keep policies open
-- so any authenticated user can read/write. This is intentional
-- for a demo; production would scope to organisation_id.
-- ============================================================

ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials      ENABLE ROW LEVEL SECURITY;
ALTER TABLE industries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;

-- Public-read for catalog tables
CREATE POLICY "Authenticated users can read products"   ON products
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read materials"  ON materials
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read industries" ON industries
  FOR SELECT TO authenticated USING (true);

-- Quotes — authenticated users see all (demo simplification)
CREATE POLICY "Authenticated users can read all quotes" ON quotes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create quotes"   ON quotes
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::text = estimator_id);
CREATE POLICY "Estimators can update their own quotes"  ON quotes
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid())::text = estimator_id);

-- AI Predictions — read-only for the demo; writes via service role
CREATE POLICY "Authenticated users can read ai_predictions" ON ai_predictions
  FOR SELECT TO authenticated USING (true);
```

**Note on the `auth.uid()::text` cast:** wrap as `(SELECT auth.uid())::text` per the PROJECT-TEMPLATE.md §1798 — Supabase's performance advisor flags `auth.uid()` called per row.

---

## 6. Seed data — REAL Marking Systems catalog

This is the differentiator. Use the actual product names from markingsystems.com — this is what shows the recruiter and hiring team that the candidate did the homework.

### Products (~16 rows)

| Category | Name | Base $/sq.in. | Setup Fee | Notes |
|---|---|---|---|---|
| nameplate | Aluminum Anodized Nameplate | 0.085 | 75.00 | Industry standard for OEM equipment ID |
| nameplate | Stainless Steel Nameplate | 0.140 | 95.00 | For corrosive environments |
| nameplate | Polycarbonate Nameplate | 0.045 | 50.00 | Cost-effective indoor use |
| overlay | Digital Print Overlay | 0.055 | 60.00 | Full-color graphics |
| overlay | Screen Print Overlay | 0.040 | 85.00 | Higher setup, better at volume |
| overlay | Capacitive Touch Overlay | 0.180 | 250.00 | Touch-sensitive applications |
| info_label | UL Label - Standard | 0.065 | 40.00 | Underwriters Laboratories certified |
| info_label | CSA Label - Standard | 0.065 | 40.00 | Canadian Standards Association certified |
| info_label | Warning & Caution Label | 0.050 | 35.00 | Safety messaging |
| info_label | Industrial Information Label | 0.040 | 30.00 | General-purpose product info |
| membrane_switch | 4-Button Membrane Switch | 0.220 | 350.00 | Tactile or non-tactile |
| membrane_switch | LED Backlit Membrane Switch | 0.310 | 475.00 | Backlit user interface |
| die_cut_gasket | Custom Die-Cut Gasket | 0.075 | 200.00 | Sealing applications |
| die_cut_gasket | Vibration Dampening Pad | 0.060 | 175.00 | Cushioning |
| emi_rfi | EMI/RFI Shielding Gasket | 0.150 | 300.00 | Electromagnetic interference |
| thermal_management | Thermal Management Pad | 0.110 | 225.00 | Heat dissipation |

### Materials (~14 rows)

| Type | Name | Cost $/sq.in. | Durability (1–10) |
|---|---|---|---|
| substrate | Aluminum 0.020" | 0.022 | 9 |
| substrate | Stainless Steel 0.025" | 0.045 | 10 |
| substrate | Polycarbonate 0.010" | 0.008 | 6 |
| substrate | Polyester (Mylar) 0.005" | 0.005 | 7 |
| substrate | Vinyl 0.004" | 0.003 | 4 |
| substrate | Polyimide 0.003" | 0.018 | 9 |
| adhesive | 3M 467MP Acrylic | 0.006 | 8 |
| adhesive | 3M 9485PC High-Tack | 0.008 | 9 |
| adhesive | 3M 300LSE Low Surface Energy | 0.012 | 10 |
| adhesive | Standard Permanent Acrylic | 0.004 | 6 |
| overlaminate | Polyester Overlaminate Gloss | 0.007 | 7 |
| overlaminate | Polyester Overlaminate Matte | 0.007 | 7 |
| overlaminate | UV-Resistant Overlaminate | 0.012 | 9 |
| overlaminate | Anti-Microbial Overlaminate | 0.018 | 8 |

### Industries (8 rows)

| Name | Cert Premium | Required Certifications | Description |
|---|---|---|---|
| Aerospace | 1.45 | {AS9100, ITAR, ISO 9001} | Highest precision, heavy documentation |
| Medical | 1.40 | {ISO 13485, FDA, ISO 9001} | Regulated medical device labels |
| Military & Government | 1.50 | {ITAR, MIL-SPEC, ISO 9001} | Defense applications |
| Oil & Gas | 1.30 | {API, NACE, ISO 9001} | Harsh environment durability |
| Telecommunications | 1.15 | {UL, CSA, ISO 9001} | Network equipment ID |
| Food & Beverage | 1.20 | {NSF, FDA, ISO 9001} | Food-safe materials |
| Marine | 1.25 | {USCG, ABS, ISO 9001} | Salt-water durability |
| Industrial / OEM | 1.00 | {UL, ISO 9001} | Standard industrial baseline |

---

## 7. Pages — full spec

### 7.1 Landing — `/`

**Purpose:** First impression for hiring team. Must communicate what the product does in <10 seconds and look polished.

**Layout:**
- Hero with the project name, one-sentence description, two CTAs (Try Demo / View Source Code)
- Three-up feature grid: "AI-Enhanced Estimating" / "Real-Time Reporting" / "Catalog-Driven Workflows"
- Architecture diagram (simple SVG) showing user → Next.js → Postgres → Groq
- Footer with: "Portfolio case study by Samuel Muriuki — not affiliated with Marking Systems Inc." + contact links + GitHub link

**Disclaimer:** Footer must explicitly state "not affiliated with Marking Systems Inc." This is a legal/IP must.

### 7.2 Sign In — `/sign-in`

**Purpose:** Better Auth email/password sign-in. Demo account credentials displayed prominently for the hiring team.

**Layout:**
- Centered card with email + password fields + sign-in button
- Below the form: a soft-bordered "Demo Account" callout with credentials prefilled-on-click:
  - **Email:** `demo@msi-quote-studio.com`
  - **Password:** `demo-account-2026`
  - With a copy-to-clipboard button on each
- Subtle link to a `/sign-up` page (functional but not the focus)

**Acceptance criteria:** Hiring team can sign in within 5 seconds without reading instructions.

### 7.3 New Quote — `/quotes/new`

**Purpose:** Create a new quote. Multi-step shadcn form (or single page with sections).

**Form fields:**
1. Customer name + customer email
2. Product (select from catalog grouped by category)
3. Material (select — filtered by product type compatibility)
4. Width (inches) + Height (inches) — numeric inputs
5. Quantity — numeric input
6. Industry (select)
7. Required certifications (multiselect — pre-populated based on industry)
8. Notes (optional textarea)

**Submit behaviour:**
- Server action validates input
- Calculates rule-based base estimate: `base_price * width * height * quantity * industry.certification_premium + setup_fee`
- Inserts quote with `status='draft'`, `base_estimate=<calculated>`, `ai_*` fields NULL
- Redirects to `/quotes/[id]` (the AI analysis loads there)

### 7.4 Quote Detail — `/quotes/[id]`

**Purpose:** Show the quote with the AI analysis. **This page is the demo's centerpiece.**

**Layout:**
- Top: quote summary card (customer, product, dimensions, quantity, base estimate, status badge)
- Middle: **AI Analysis panel** — this is the moment.
  - On first load (no AI prediction yet): card shows skeleton loaders + a button "Run AI Analysis"
  - On click: calls `/api/quotes/[id]/analyze` (POST), shows loading state, then renders:
    - Complexity score (1–10) as a visual gauge
    - Suggested price range (low–high) prominently displayed
    - Rationale (plain English, 2–3 sentences)
    - Tiny "Model: llama-3.3-70b-versatile" + "Latency: 1.2s" footer
- Bottom: actions (Edit Quote, Mark as Sent, Mark as Accepted, Delete)

**Animation:** smooth fade-in when the AI response lands. This is the visual moment that hooks the technical lead.

### 7.5 Quotes Dashboard — `/quotes`

**Purpose:** Estimator's working dashboard. Recent quotes table with filters.

**Layout:**
- KPI strip at top: 4 cards — Total Quotes (last 30d), Avg Quote Value, Win Rate, Pending Quotes
- Filters bar: Status (all / draft / sent / accepted / declined), Product Category, Date Range
- Table: customer, product, dimensions, quantity, base estimate, AI suggested range, status, created date — sortable columns
- Click row → goes to `/quotes/[id]`

### 7.6 Reporting Dashboard — `/reports`

**Purpose:** Power-BI-style overview for management. **This is the dashboard the manager looks at.**

**Layout — three Recharts visualisations + KPI strip:**
- KPI strip: Total Pipeline Value, Quotes This Month, Conversion Rate, Avg AI Confidence
- Chart 1: Bar chart — Quote volume by product category (last 30 days)
- Chart 2: Line chart — Quote volume by week (last 12 weeks)
- Chart 3: Stacked bar — Quote status distribution by month
- Bottom: Table — Top 10 pipeline quotes by value (sent/accepted)

---

## 8. AI Integration — the centerpiece

### 8.1 Provider: Groq

- Sign up at https://console.groq.com — free tier
- API base URL: `https://api.groq.com/openai/v1` (OpenAI-compatible)
- Recommended model: `llama-3.3-70b-versatile` (verify current model on Groq's free tier — they update frequently)
- Set `GROQ_API_KEY` env var

### 8.2 Endpoint: `POST /api/quotes/[id]/analyze`

**Request:** authenticated session; param is `quote_id`

**Server logic:**
1. Fetch quote + joined product, material, industry
2. Build the structured prompt (template below)
3. Hash the input JSON for the audit log
4. Call Groq API with `response_format: { type: "json_object" }`
5. Parse the JSON response
6. Update the `quotes` row with `ai_complexity_score`, `ai_suggested_price_low`, `ai_suggested_price_high`, `ai_rationale`
7. Insert a row into `ai_predictions` with model name, hash, predicted values, rationale, latency, cost
8. Return the AI response to the client

### 8.3 Prompt template

```typescript
const systemPrompt = `You are an expert manufacturing estimator for a durable label and die-cut converting company that serves aerospace, medical, military, and industrial OEMs. You evaluate custom job specifications and return structured complexity assessments and price recommendations.

You are precise, calibrated, and honest about uncertainty. Your rationale is direct — no fluff, no marketing language. You write like an engineer talking to another engineer.

Return JSON only, with no commentary outside the JSON.`;

const userPrompt = `Evaluate this job:

PRODUCT: ${product.name} (${product.category})
MATERIAL: ${material.name} (durability ${material.durability_score}/10)
DIMENSIONS: ${quote.width_inches}" × ${quote.height_inches}"
QUANTITY: ${quote.quantity}
INDUSTRY: ${industry.name}
CERTIFICATIONS REQUIRED: ${quote.certifications.join(', ') || 'none'}
RULE-BASED BASE ESTIMATE: $${quote.base_estimate.toFixed(2)}

Return:
{
  "complexity_score": <integer 1-10, where 1=trivial and 10=highly complex>,
  "suggested_price_low": <number, USD>,
  "suggested_price_high": <number, USD>,
  "rationale": "<2-3 sentences explaining what drives the complexity and why the price range differs (or doesn't) from the base estimate>"
}`;
```

### 8.4 Validation

- Server-side: validate the parsed JSON has all four fields with correct types
- If validation fails: log the raw response, return a structured error, do NOT update the quote
- Client-side: if the analyze call returns an error, show a friendly retry button — never blow up the page

### 8.5 Cost / latency note

- Groq's free tier is generous; for a demo the cost is effectively zero
- Track latency anyway — the "1.2s" footer is part of the visual story
- If Groq is slow on demo day, the loading state must remain elegant (skeleton, not spinner)

---

## 9. Routing & file structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx          ← protected layout
│   │   ├── quotes/
│   │   │   ├── page.tsx        ← /quotes (dashboard)
│   │   │   ├── new/page.tsx    ← /quotes/new
│   │   │   └── [id]/page.tsx   ← /quotes/[id]
│   │   └── reports/page.tsx    ← /reports
│   ├── api/
│   │   ├── auth/[...all]/route.ts  ← Better Auth catch-all
│   │   └── quotes/
│   │       └── [id]/
│   │           └── analyze/route.ts  ← POST AI analysis
│   ├── layout.tsx              ← root layout (theme provider, fonts)
│   ├── page.tsx                ← landing
│   └── globals.css             ← design tokens
├── components/
│   ├── ui/                     ← shadcn components
│   ├── quote-form/
│   ├── ai-analysis-panel/
│   ├── kpi-card/
│   ├── charts/
│   └── theme-toggle.tsx
├── lib/
│   ├── auth.ts                 ← Better Auth instance
│   ├── auth-client.ts          ← Better Auth client (browser)
│   ├── supabase/
│   │   ├── server.ts           ← server client (service role)
│   │   └── client.ts           ← browser client
│   ├── groq.ts                 ← Groq SDK wrapper
│   ├── estimator.ts            ← rule-based base estimate function
│   └── utils.ts                ← cn(), formatters
└── types/
    └── db.ts                   ← TS types matching the schema
```

---

## 10. Brand & theme

See `.ai/design/brand-decision-2026-04.md` for the full brand spec. Summary:

**Industrial Slate** — primary `#0F172A` (slate-900), accent `#D97706` (amber-600), surface light `#F8FAFC`, surface dark `#0F172A`. Headings in Space Grotesk, body in Inter, numerics in JetBrains Mono. Light + dark mode both fully supported via CSS variables.

**Implementation:**
- Define tokens as CSS custom properties in `globals.css`
- Map them to Tailwind theme in `tailwind.config.ts` via `colors: { primary: 'hsl(var(--primary))', ... }`
- Theme toggle in the top-right of every authenticated page

---

## 11. Timeline — strict 3-day plan

### Day 1 — Foundation (8 hours)

| Hour | Task | Deliverable |
|---|---|---|
| 1 | Repo init + folder structure (per PROJECT-TEMPLATE.md §QUICK START) | `main` + `develop` branches, `.ai/` and `.claude/` skeleton |
| 2 | Next.js 15 + TS strict + Tailwind + shadcn install | `feat/initial-project-setup` PR |
| 3 | Brand tokens wired into Tailwind + globals.css; theme toggle | PR |
| 4 | Supabase project created + connection working + initial migration drafted | `001_initial_schema.sql` |
| 5 | Schema applied + seed data inserted | seeded DB |
| 6 | Better Auth installed + configured (email/password) + sign-in/sign-up pages | PR |
| 7 | Landing page polished | PR |
| 8 | Day 1 review: deploy to Vercel, confirm production URL works | live URL |

### Day 2 — Core features (8 hours)

| Hour | Task | Deliverable |
|---|---|---|
| 1–2 | New Quote form (multi-step or single-page) + server action | PR |
| 3 | Rule-based estimator function with tests | PR |
| 4–5 | Groq integration + AI analysis API route + audit logging | PR |
| 6 | Quote Detail page with AI Analysis panel | PR |
| 7 | Polish AI loading/error states | PR |
| 8 | Day 2 review: end-to-end test of New Quote → AI Analysis flow | live URL working |

### Day 3 — Dashboards + polish (8 hours)

| Hour | Task | Deliverable |
|---|---|---|
| 1–2 | Quotes Dashboard (table + filters + KPI strip) | PR |
| 3–4 | Reporting Dashboard (3 charts + KPI strip) | PR |
| 5 | Mobile responsiveness pass (360 / 375 / 414) | PR |
| 6 | Landing page final polish + screenshots for README | PR |
| 7 | Final cross-browser/device test | bug fixes if any |
| 8 | Record Loom walkthrough | Loom video |

**Hard rule:** if any task takes >2× its allocated time, drop the next non-critical task. Shipped beats perfect.

---

## 12. Definition of Done

- [ ] Live production URL reachable
- [ ] Sign-in works with the documented demo credentials
- [ ] Can create a new quote → AI analysis runs → quote saved → appears on dashboard
- [ ] Reporting dashboard renders all 3 charts with real data
- [ ] Light + dark mode both render cleanly
- [ ] Mobile (360px), tablet (768px), desktop (1440px) all render without horizontal scroll
- [ ] Footer disclaimer "Not affiliated with Marking Systems Inc." present on landing
- [ ] GitHub repo public, README professional with screenshots
- [ ] No AI/Claude attribution anywhere on GitHub
- [ ] Loom walkthrough recorded (≤3 minutes)

---

## 13. Out-of-band considerations

### IP / legal

- The name "MSI Quote Studio" is generic enough; do NOT use Marking Systems' actual logo, photography, or trademarked phrases
- Industrial Slate brand is deliberately distinct from MSI's actual navy+orange
- Footer disclaimer is mandatory
- README disclaimer mirrors the footer

### Security

- Better Auth handles the heavy lifting (sessions, hashing, CSRF)
- API routes that mutate require an authenticated session — middleware or per-route check
- Service role key used ONLY in server contexts (`lib/supabase/server.ts`); never imported into client code
- Groq API key never sent to the browser — all inference happens server-side

### Performance

- Cache product/material/industry catalog responses (rarely change)
- Reporting page is server-rendered with `revalidate=300` (5 min) — fine for demo data
- Charts use Recharts SSR-safe components

---

## 14. Files referenced from this brief

- `.ai/PROJECT-TEMPLATE.md` — universal conventions (read this top-to-bottom before any code)
- `.ai/design/brand-decision-2026-04.md` — brand spec
- `.claude/INSTRUCTIONS.md` — project-specific Claude Code rules
- `.env.example` — environment template

---

*Spec version 1.0 — 2026-04-30 — Authored by Samuel Muriuki for the Marking Systems / Pearl Talent A332 application.*
