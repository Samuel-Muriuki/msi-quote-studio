# Screenshot capture guide

Capture these in one pass while the Vercel deploy is fresh, ideally just before recording the Loom (Section 0 in `.ai/docs/LOOM-SCRIPT.md`). Commit them to `docs/screenshots/` and reference 2–3 from the README.

## Setup

- Browser at exactly **1440 × 900**, zoom **100%**, system in **dark mode** for the dark variants and light mode for the light variants
- DevTools closed
- Cookies cleared (so theme honours system preference on first load)
- Live URL: https://msi-quote-studio.vercel.app

## Shots to capture

| # | Filename | URL | Theme | Viewport | What to wait for / capture |
|---|---|---|---|---|---|
| 1 | `landing-hero-light.png` | `/` | Light | 1440×900 | Above-the-fold: wordmark, headline, browser-frame mockup with AI panel visible |
| 2 | `landing-hero-dark.png` | `/` | Dark | 1440×900 | Same shot, dark mode |
| 3 | `landing-calculator.png` | `/#calculator` | Light | 1440×900 | Free calculator with all 5 sliders + cost-structure breakdown |
| 4 | `landing-benchmark.png` | `/#benchmark` | Light | 1440×900 | Benchmark teaser with industry select + comparison bars |
| 5 | `landing-faq.png` | `/#faq` | Light | 1440×900 | FAQ section with one item expanded |
| 6 | `sign-in.png` | `/sign-in` | Light | 1440×900 | Demo credentials banner + Sign in as demo button |
| 7 | `dashboard.png` | `/dashboard` (after demo sign-in) | Light | 1440×900 | Welcome line + 3 action cards + recent quotes table populated |
| 8 | `new-quote.png` | `/quotes/new` | Light | 1440×900 | Form mid-fill: customer, product, dimensions, industry chosen, base estimate live in sidebar |
| 9 | `quote-detail-ai.png` | `/quotes/[id]` (a seeded one) | Light | 1440×1100 | AI panel with gauge, price band, rationale, plus the new benchmark widget below |
| 10 | `quotes-pipeline.png` | `/quotes` | Light | 1440×900 | KPI strip + filter bar + table with several rows visible |
| 11 | `reports-dashboard.png` | `/reports` | Light | 1440×1300 | Full reports page: KPI strip + 3 charts + top-pipeline table (use scroll-and-stitch or full-page screenshot) |
| 12 | `mobile-quote-detail.png` | `/quotes/[id]` | Light | 375×812 | Mobile shot of the quote detail with AI panel + benchmark widget stacked |

## Capture tips

- Use **Cmd/Ctrl + Shift + S** in Firefox or **DevTools > Capture full size screenshot** in Chrome for whole-page shots (#11 needs this)
- For mobile shots, use DevTools' device toolbar (Cmd/Ctrl + Shift + M) at iPhone X dimensions
- Crop the browser chrome out — recruiter shots should look like UI screenshots, not browser tabs
- PNG over JPG; quality > file size at this scale
- File size budget: ≤500KB each (use `pngquant` or `sips -Z 1440` if needed)

## After capture

```bash
mkdir -p docs/screenshots
# move all PNGs into docs/screenshots/
git add docs/screenshots/
git commit -m "📝 docs: capture screenshot set for README"
git push origin develop
```

Then in `README.md`, add a `## Screenshots` section above `## Demo credentials`:

```markdown
## Screenshots

![Landing — light mode](./docs/screenshots/landing-hero-light.png)
![Quote detail with AI panel](./docs/screenshots/quote-detail-ai.png)
![Reports dashboard](./docs/screenshots/reports-dashboard.png)
```

GitHub will inline-render the PNGs on the repo's main page — first impression for any recruiter who lands on the GitHub URL before the live URL.
