# Loom walkthrough script — MSI Quote Studio v0.2

**Target length:** 3:30–4:00
**Audience:** Pearl Talent recruiter (Zamira) and Marking Systems hiring team (technical lead + GM/manager)
**URL:** https://msi-quote-studio.vercel.app
**Demo creds** (one-click "Sign in as demo →" button on /sign-in):
`demo@msi-quote-studio.com` / `demo-account-2026`

---

## Pre-record checklist

- [ ] Browser zoom 100%, window 1440×900, system in dark mode (the demo looks best in dark)
- [ ] Cookies / localStorage cleared so the theme honours system preference on first paint
- [ ] DevTools closed
- [ ] Tabs: only `https://msi-quote-studio.vercel.app/`
- [ ] Latest deploy promoted (PRs through #54 all on main)
- [ ] CRON_SECRET, BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME set in Vercel
- [ ] Test sample SVG ready at `~/Documents/test-nameplate.svg` for the CAD upload demo
- [ ] Loom set to mic-only (system audio off), webcam in corner

---

## Section 1 — Landing (0:00–0:35)

> **[0:00] On-screen: landing page hero, signed out**

> "Hi, I'm Samuel Muriuki. This is MSI Quote Studio — a portfolio case study built for the Software & AI Developer role at Marking Systems."

> **[0:08] Beat. Let the hero AI panel mockup register.**

> "The premise: an estimator describes a job, the system returns a complexity score, a calibrated price range, and the reasoning behind it — logged for every prediction."

> **[0:22] Scroll once to show the four how-it-works cards then the calculator teaser. Don't dwell.**

> "Behind me is the production stack — Next.js 16 App Router on Vercel, Supabase Postgres, Better Auth, Groq for inference, Brevo for email. Real AI, real database, real production deploy. Let me sign in as the demo user."

**Cue:** click **Sign in** (top right) → click **Sign in as demo →** on the next page.

---

## Section 2 — Dashboard (0:35–0:55)

> **[0:35] Land on /dashboard.**

> "One-click demo button — no account creation. Anything you create through this shared account auto-deletes after 48 hours, so the demo stays clean."

> **[0:42] Hover the cursor over the 3 action cards. Pause briefly on each.**

> "Welcome dashboard with three primary actions and the recent quotes table. The sidebar shows the full workspace — Quotes with New quote nested under it, Customers, Reports, Settings."

**Cue:** click **Quotes** in the sidebar (or the **Quotes Pipeline** card).

---

## Section 3 — Quotes pipeline (0:55–1:15)

> **[0:55] /quotes loads with KPI strip + table.**

> "Quotes pipeline. KPIs at the top — quote count, average value, win rate, pending. Filter by status or date range. Table shows customer, product, dimensions, base estimate, AI suggested range, status."

> **[1:05] Click any row — pick **Cisco Systems** (it has the CAD preview attached).**

---

## Section 4 — Quote detail with AI + CAD preview + benchmark (1:15–2:20)

> **[1:15] /quotes/[id] for Cisco loads.**

> "Quote detail. Header shows the customer, status, and a 48-hour expiry pill if this row was user-created. Line items at the top — and **here's a differentiator most quoting tools don't have**: CAD upload."

> **[1:30] Cursor on the inline CAD thumbnail under Line 1.**

> "I uploaded an SVG drawing for this line. The server parsed the bounding box, counted 8 drawing elements, and stored the file in a private Supabase Storage bucket. The element count gets fed into the AI prompt as a complexity signal."

> **[1:45] Scroll down to the AI panel. Click **Re-run**.**

> "Real Groq inference — llama-3.3-70b-versatile, sub-second latency. Complexity score, calibrated price range, plain-English rationale referencing the CAD count. Every prediction logs to an audit table."

> **[2:00] Beat while the AI result lands. If you get rate-limited mid-recording, leave it in — the rate-limit banner is part of the design.**

> "The error handling is structured — rate-limit, auth, network, timeout each get their own message and retry behaviour."

> **[2:08] Scroll to benchmark widget.**

> "Cost structure beside the industry benchmark. Materials, Labor, Overhead, Scrap — green and red deltas tell you where margin is hiding. Below that, Edit, Download PDF, and Email customer — the email goes through Brevo with the PDF attached."

---

## Section 5 — New quote with autofill + CAD upload (2:20–3:00)

> **[2:20] Click **New quote** in the sidebar (now nested under Quotes).**

> "New quote form. Multi-line by design — every quote can have multiple product/material/dimension combinations."

> **[2:30] Click **Autofill demo data** in the top-right.**

> "Persona-driven autofill so I don't have to type. Click once and the form picks a coherent draft — Cisco for telecom, Boeing for aerospace, Medtronic for medical. Customer, industry, certifications, line items — all match."

> **[2:42] Pause one beat on the populated form so viewers can see the live total.**

> "Two lines this time, both telecom-appropriate, with realistic dimensions and a factory-pack quantity. Live total updates."

> **[2:52] Scroll to a line, click **Upload CAD (SVG or DXF)**, drop the test file. After parse, click **Use these dimensions**.**

> "CAD upload accepts SVG or DXF. The bounding box and path count come back, dimensions auto-fill the line."

---

## Section 6 — Customers + reports + settings + close (3:00–3:50)

> **[3:00] Click **Customers** in the sidebar.**

> "Customers — saved contacts. Click into Cisco — contact info, three KPIs (quote count, pipeline value, accepted value), full quote history."

> **[3:15] Click into Cisco's card.**

> "Detail view. Edit lives here too."

> **[3:22] Click **Reports**.**

> "Reports — pipeline value, conversion rate, average AI complexity, plus the breakdowns by product category and weekly volume."

> **[3:35] Click **Settings**.**

> "Settings shows account info, workspace stats, and live integration pills. Groq, Brevo, Vercel Cron — each reads its env from the server and shows live or not-configured."

> **[3:45] Wrap.**

> "Stack recap: Next.js 16, Supabase Postgres with row-level security, Better Auth with email verification, Groq for inference, Brevo for transactional email, all on Vercel. Source on GitHub — link in description. Built solo over [X] days. Thanks for watching."

---

## Notes for the takes

- **Hard cap on landing:** 35 seconds. Recruiters skim — don't dwell.
- **The CAD upload moment is the headline differentiator.** Slow down. Narrate as you click. This is what most other estimating demos can't do.
- **The AI re-run is the technical credibility moment.** Pause one full beat after the result lands so the viewer reads the rationale.
- **If Groq rate-limits during recording, leave it in.** The yellow banner with "Try again in ~Ns" is a feature, not a bug.
- **Settings page is a quick whip-pan.** Don't read every integration name aloud — let the LIVE pills speak.
- **End with the GitHub callout, not a "thanks for watching."** Gives the viewer the next step.

## Timing summary

| Section | Window | Key click |
|---|---|---|
| 1. Landing | 0:00–0:35 | Sign in |
| 2. Dashboard | 0:35–0:55 | Quotes |
| 3. Pipeline | 0:55–1:15 | Cisco row |
| 4. Quote detail (AI + CAD + benchmark) | 1:15–2:20 | Re-run AI |
| 5. New quote (autofill + CAD upload) | 2:20–3:00 | Autofill, then Upload CAD |
| 6. Customers + reports + settings + close | 3:00–3:50 | Cisco card → Reports → Settings |

Total target: **3:50** (cut to 3:30 if a section runs over).
