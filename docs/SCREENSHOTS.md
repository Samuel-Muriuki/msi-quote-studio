# Screenshot capture guide

Capture these in one pass while the Vercel deploy is fresh, ideally just before recording the Loom (Section 0 in `.ai/docs/LOOM-SCRIPT.md`). Commit them to `docs/screenshots/` and reference 3–4 from the README.

## Setup

- Browser at exactly **1440 × 900**, zoom **100%**
- System in **dark mode** (the demo looks better dark — original guide called for both light + dark variants, but pick one and ship)
- DevTools closed
- Cookies cleared (so theme honours system preference on first load)
- Live URL: https://msi-quote-studio.vercel.app
- Latest deploy promoted (PRs through #48)
- One CAD-linked seeded quote available (Cisco — has the test SVG inline)
- Six populated customers visible on /customers

## Shots to capture

| # | Filename | URL | Theme | What to wait for / capture |
|---|---|---|---|---|
| 1 | `landing-hero.png` | `/` | Dark | Above-the-fold: brand mark + wordmark, headline, browser-frame mockup with AI panel visible |
| 2 | `landing-how-it-works.png` | `/#how-it-works` | Dark | Four separated cards (after PR #37 split them out of the bordered table) |
| 3 | `landing-calculator.png` | `/#calculator` | Dark | Free calculator with all 5 sliders + cost-structure breakdown |
| 4 | `landing-faq.png` | `/#faq` | Dark | FAQ section with the new 48-hour cleanup item expanded |
| 5 | `sign-in.png` | `/sign-in` | Dark | Demo credentials banner + Sign in as demo button |
| 6 | `dashboard.png` | `/dashboard` (after demo sign-in) | Dark | Welcome line + 3 action cards + recent quotes table |
| 7 | `quotes-pipeline.png` | `/quotes` | Dark | KPI strip + filter bar + table populated; **Quotes** active in sidebar (orange-tinted with edge stripe) |
| 8 | `quote-new-empty.png` | `/quotes/new` | Dark | Form pristine — Customer section, Lines section with single Line 1 card visible, Autofill button top-right |
| 9 | `quote-new-autofilled.png` | `/quotes/new` (post-Autofill click) | Dark | Persona populated — customer name + email, lines with products/dimensions, industry + cert badges, live total |
| 10 | `quote-new-cad-uploaded.png` | `/quotes/new` (after a CAD upload) | Dark | Line card showing the green-check upload card with extracted dims + "Use these dimensions" |
| 11 | `quote-detail.png` | `/quotes/[id]` (Cisco — has CAD) | Dark | Quote header with status + DemoExpiryBadge if applicable, line items list, **CAD preview thumbnail**, AI panel, benchmark, actions |
| 12 | `quote-detail-ai.png` | `/quotes/[id]` (zoom on AI panel) | Dark | AI gauge + price range + rationale + model + latency line |
| 13 | `quote-detail-benchmark.png` | `/quotes/[id]` (zoom on benchmark) | Dark | Materials / Labor / Overhead / Scrap bars with green-red deltas |
| 14 | `customers-list.png` | `/customers` | Dark | Six populated cards — name, company, email, phone, quote count, "Added" date |
| 15 | `customer-detail.png` | `/customers/[id]` (Cisco) | Dark | Contact card, standing notes, three KPI cards, linked quotes list |
| 16 | `reports.png` | `/reports` | Dark | KPI strip + Quote-volume-by-product + Weekly-volume + Top-pipeline table (use full-page screenshot) |
| 17 | `settings.png` | `/settings` | Dark | Account card + workspace stats (with sample/user-created split) + three integration status pills (Groq, Brevo, Cron) |
| 18 | `mobile-quote-detail.png` | `/quotes/[id]` | Dark | Mobile shot at 375×812 of quote detail with line + CAD preview + AI panel stacked |

## Capture tips

- **Full-page** for #16 (reports has 3 charts vertically): use **DevTools > Capture full size screenshot** in Chrome or **Cmd/Ctrl + Shift + S** in Firefox
- For mobile shot (#18), use DevTools' device toolbar (Cmd/Ctrl + Shift + M) at iPhone X dimensions (375×812)
- Crop browser chrome out of #1–#17 — these should look like UI screenshots, not browser tabs
- PNG over JPG; quality > file size at this scale
- File size budget: ≤500KB each (use `pngquant` or `sips -Z 1440` if needed)

## After capture

```bash
mkdir -p docs/screenshots
# Move all PNGs into docs/screenshots/
git add docs/screenshots/
git commit -m "📝 docs: capture screenshot set for v0.2 README"
git push origin develop
```

Then in `README.md`, add a **Screenshots** section above **Demo credentials**:

```markdown
## Screenshots

### Landing
![Hero](./docs/screenshots/landing-hero.png)

### Quote detail with AI + CAD preview
![Quote detail](./docs/screenshots/quote-detail.png)

### Reports
![Reports](./docs/screenshots/reports.png)

### Settings (live integration status)
![Settings](./docs/screenshots/settings.png)
```

Pick the 4 that show the most ground; the rest are reference material for the Loom.
