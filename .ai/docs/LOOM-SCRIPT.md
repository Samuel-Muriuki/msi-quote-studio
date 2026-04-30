# Loom walkthrough script — MSI Quote Studio

**Target length:** 2:45–3:15
**Audience:** Pearl Talent recruiter (Zamira) and Marking Systems hiring team (technical lead + GM/manager)
**URL:** https://msi-quote-studio.vercel.app
**Demo creds (already pre-filled by the "Sign in as demo →" button):**
`demo@msi-quote-studio.com` / `demo-account-2026`

---

## Pre-record checklist

- [ ] Browser zoom 100%, window 1440×900, system in dark mode
- [ ] Cookies / localStorage cleared so the theme honours system preference on first paint
- [ ] DevTools closed
- [ ] Tabs: only `https://msi-quote-studio.vercel.app/`
- [ ] Loom set to webcam + screen + system audio off (mic only)
- [ ] Glass of water nearby

---

## Section 1 — landing (0:00–0:30)

**Open on the landing page.**

> "Hi, I'm Samuel Muriuki. This is MSI Quote Studio — a portfolio case study I built over three days for the Software & AI Developer role at Marking Systems Inc.
>
> The premise is simple. An estimator describes a job, the system returns a complexity score, a calibrated price range, and the reasoning behind it — logged for every prediction, on every quote.
>
> Let me sign in as the demo user and walk you through it."

**Click "Try the demo" → `/sign-in`. Click "Sign in as demo →" → land on `/dashboard`.**

---

## Section 2 — dashboard + pipeline (0:30–1:15)

> "The dashboard greets the estimator with what they're working on right now. Three primary actions, then their five most recent quotes. The recent-quotes table links straight into each quote.
>
> Let's open the quotes pipeline."

**Click "Quotes Pipeline" card.**

> "This is where the estimator lives day-to-day. Pipeline KPIs at the top — quotes the last 30 days, average value, win rate, pending count.
>
> Below the KPIs: status and date filters that update the URL so the view is shareable. The table cuts down progressively on smaller screens — phone view drops dimensions and AI range columns automatically.
>
> The data here is real seeded data spanning the last 78 days, with realistic customer names like Boeing, Medtronic, Raytheon, mapped to actual product categories from Marking Systems' catalog. Each row links into the quote detail."

**Click into the Boeing 787 quote (status: accepted).**

---

## Section 3 — quote detail + AI panel (1:15–2:15) — **THE MOMENT**

> "This is the centerpiece. The summary card at the top has the customer, the product spec, dimensions, quantity, the certifications driving the certification premium, and the rule-based base estimate.
>
> Below that — the AI Analysis panel."

**Pause briefly on the AI panel so the gauge and price band are visible.**

> "On every quote, an estimator can hit 'Run AI Analysis' and we make a real call to Groq — `llama-3.3-70b-versatile` model, structured-JSON output, fully validated with Zod before any of it gets written back to the database.
>
> The output: a complexity score on a 1–10 scale rendered as that gradient gauge, a suggested price range — low and high — and a plain-English rationale grounded in the spec. Model and latency are right there in the footer.
>
> What you don't see is what happens behind it. Every inference writes a row to an `ai_predictions` audit table — input hash, model used, latency, the full prediction. So we can replay, measure, and improve over time. That's the part most production ML systems forget."

**Scroll down to the Actions section.**

> "Below the AI panel: the action surface. The state machine is enforced server-side — drafts can move to sent, accepted, or declined; sent can move to accepted or declined; accepted is terminal. The buttons you see change with the current status.
>
> Status changes revalidate the dashboard, the pipeline KPIs, and the recent-quotes table immediately."

---

## Section 4 — reporting (2:15–2:45)

**Click "Back to pipeline" → click the project name top-left to return to dashboard → click "Reporting".**

> "The reporting view is where a manager would actually live. Total pipeline value, quotes this month vs last, conversion rate, average AI complexity across analysed quotes.
>
> Three Recharts views below: quote volume by product category in the last 30 days, weekly volume line over the last 12 weeks, and a stacked bar of status distribution per month over the last six.
>
> Below that, a top-10 pipeline ranking — sent and accepted quotes ranked by base estimate. Each row links back into the quote.
>
> Charts respect the brand palette. Series colours stay consistent across views. Empty states are explicit so the page never looks broken."

---

## Section 5 — close (2:45–3:00)

**Quick toggle to dark mode using the theme button. Then back to light.**

> "Light and dark are first-class — the brand decision document specifies tokens for both. Mobile breakpoints are honoured at 360, 375, 414 — phone, narrow phone, and wide phone — every page is reachable without horizontal scroll.
>
> The whole thing is on GitHub at github.com/Samuel-Muriuki/msi-quote-studio — schema, brand decision document, conventions, atomic commits with no AI attribution. The README has the architecture overview.
>
> Three days, real Marking Systems catalog, real Groq inference, audit-logged every step. Thanks for watching — happy to dig into any part of it."

**End on the GitHub URL visible in the address bar.**

---

## Editing notes

- Cut any pause longer than 1.5 seconds
- Keep the cursor moving — sweep, don't hover
- If a page loads slowly (cold Vercel function), cut the wait and pick up at the rendered state
- Loom auto-captions: review for "Marking Systems" being transcribed correctly (it sometimes hears "marking system's" or "marketing systems")

## After recording

1. Set Loom title: **"MSI Quote Studio — 3-min walkthrough · Samuel Muriuki"**
2. Set Loom description: link to GitHub repo + live URL
3. Generate share link, copy URL
4. Send to Zamira (Pearl Talent) and the hiring team — exact recipients per the previous email thread

---

## Time budget if you go over

If the video runs to 3:15+ and you need to trim:

- **Trim from Section 1** (landing voiceover) — drop the second sentence
- **Trim from Section 4** (reporting) — drop the empty-state and brand-palette callouts; let the charts speak
- **Never cut** Section 3 (the AI panel walk-through) — that's the single moment that justifies the build
