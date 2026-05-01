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
- [ ] Latest deploy promoted (PRs #1 through #48 all on main)
- [ ] CRON_SECRET, BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME set in Vercel
- [ ] Loom set to mic-only (system audio off), webcam in corner

---

## Section 1 — Landing (0:00–0:35)

**Open on the landing page (signed out).**

> "Hi, I'm Samuel Muriuki. This is MSI Quote Studio — a portfolio case study built for the Software & AI Developer role at Marking Systems.
>
> The premise: an estimator describes a job, the system returns a complexity score, a calibrated price range, and the reasoning behind it — logged for every prediction.
>
> Behind me is the production stack — Next.js 16 App Router on Vercel, Supabase Postgres, Better Auth, Groq for inference. Real AI, real database, real production deploy."

**Scroll down briefly to show the four how-it-works cards, the calculator and benchmark teaser.**

> "The marketing surface answers the questions a recruiter and a manufacturing GM will both have — how the AI score works, how the cost structure compares to the industry, what real margins look like."

---

## Section 2 — Sign in + Dashboard (0:35–0:55)

**Click "Sign in" → click "Sign in as demo".**

> "There's a one-click demo button — no account creation. Anything you create through this shared account auto-deletes after 48 hours, so the demo stays clean."

**Dashboard loads.**

> "Welcome dashboard with three primary actions and the recent quotes table. The sidebar shows the full workspace — quotes, customers, reports, settings."

---

## Section 3 — New quote with autofill + CAD upload (0:55–2:00)

**Click "New quote".**

> "Here's the new-quote form. Multi-line by design — every quote can have multiple product/material/dimension combinations, each with its own line total."

**Click "Autofill demo data" in the top-right.**

> "I built a persona-driven autofill so I don't have to type during the demo. Click once and you get a coherent draft — Cisco for telecom, Boeing for aerospace, Medtronic for medical. Customer, industry, certifications, line items — all match."

**Pause on the populated form.**

> "It picked Cisco this time. Two lines — a Screen Print Overlay and an LED Backlit Membrane Switch — both telecom-appropriate products, on overlaminate substrate, with realistic dimensions and a factory-pack quantity."

**Scroll down to a line, click "Upload CAD (SVG or DXF)".**

> "And here's the differentiator most quoting tools don't have — CAD upload. I can drop an SVG or a DXF and the server parses the bounding box, counts drawing elements, and offers to auto-fill the line's dimensions."

**Pick the test SVG (you have one prepared in `~/Documents/test-nameplate.svg`). After parse:**

> "8 drawing elements extracted. That count gets fed into the AI prompt as a complexity signal — denser drawings score higher."

**Click "Use these dimensions".**

> "One click and the width and height update. Submit the quote."

**Click "Save draft & continue".**

---

## Section 4 — Quote detail with AI + CAD preview + benchmark (2:00–3:00)

**Land on the new quote's detail page.**

> "Quote detail. Line items at the top with the CAD preview rendered inline — this is the actual SVG I uploaded, served from a private Supabase Storage bucket via a signed URL."

**Scroll to the AI panel.**

> "The AI panel runs real Groq inference — llama-3.3-70b-versatile, sub-second latency. Complexity score, calibrated price range, and a plain-English rationale. Every prediction logs to an audit table with the prompt hash and latency."

**Click "Re-run".**

> "Re-runnable. And it's error-aware — if Groq rate-limits, the panel shows a yellow rate-limit banner with the retry-after timer instead of a generic failure."

**Scroll to the benchmark widget.**

> "Below that, your cost structure beside the industry benchmark. Materials, labor, overhead, scrap — green and red deltas tell you exactly where margin is hiding. This is where an estimator can defend the price to a sales lead."

**Scroll to the actions section.**

> "Actions: download the branded PDF, email it to the customer through Brevo with the PDF attached, or move it through the pipeline — sent, accepted, declined."

---

## Section 5 — Customers + reports + settings (3:00–3:30)

**Click Customers in the sidebar.**

> "Customers — saved contacts you quote against often. Each card links to a detail page with the standing notes and every quote linked to that customer."

**Click into Cisco.**

> "Cisco's detail page — contact info, three KPIs: quote count, pipeline value, accepted value. The full quote history at the bottom."

**Click Reports.**

> "Reports — pipeline value, conversion rate, average AI complexity, plus the breakdowns by product category and weekly volume."

**Click Settings.**

> "Settings — workspace stats, three integrations with live status pills. Groq for inference, Brevo for transactional email, Vercel Cron for the daily cleanup. Each reads its config from server env vars and shows live or not-configured."

---

## Section 6 — Close (3:30–3:50)

> "Stack recap: Next.js 16, Supabase Postgres with row-level security, Better Auth, Groq for inference, Brevo for transactional email, all on Vercel.
>
> Source is on GitHub — link in the description. Built solo over [X] days. Happy to walk through any part of the architecture in detail.
>
> Thanks for watching."

---

## Notes for the takes

- Cut between 35–40s on the landing — don't dwell, recruiters skim
- The CAD upload moment is the differentiator — make it punchy, narrate as you click
- The AI re-run is the technical credibility moment — pause one full beat after the result lands
- If Groq rate-limits during recording, leave it in — that's a perfect natural opportunity to show the error handling
- Settings page can be a quick whip-pan — don't read every integration name aloud
- End with the GitHub callout, not a "thanks for watching" — gives them the next step
