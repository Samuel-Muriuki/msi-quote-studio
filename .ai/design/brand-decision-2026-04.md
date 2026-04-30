# MSI Quote Studio — Brand Decision

> Single source of truth for visual identity. Filed under `.ai/design/brand-decision-2026-04.md` per PROJECT-TEMPLATE.md Section 11.
>
> **This brand is pre-decided.** A 5-direction exploration (per Section 11.3) was deemed inappropriate scope for a 3-day demo build with a single hiring-team audience. The chosen direction below is locked. Implement against it.

**Project:** MSI Quote Studio
**Date locked:** 2026-04-30
**Author:** Samuel Muriuki

---

## Direction — "Industrial Slate"

**Mood:** Precision-built. Quiet authority. The aesthetic of a well-engineered control panel, not a startup landing page. Slate-grey foundation with a single rationed accent for action — every CTA earns its place.

### Palette (shared chromatic tokens across modes)

| Role | Hex | Name | Notes |
|---|---|---|---|
| Primary | `#0F172A` | Slate-900 | Deep slate, anchors the brand. Used for primary buttons in light mode and headlines/text in dark mode. |
| Primary-soft | `#1E293B` | Slate-800 | One step lighter — used for secondary surfaces in dark mode. |
| Primary-deep | `#020617` | Slate-950 | Page background in dark mode. |
| Accent | `#D97706` | Amber-600 | The single warm accent. CTAs, AI-confidence indicators, key data points. **Used sparingly.** |
| Accent-soft | `#F59E0B` | Amber-500 | Hover states for the accent. |
| Secondary | `#475569` | Steel-blue (Slate-600) | Secondary buttons, muted text, borders in light mode. |
| Success | `#10B981` | Emerald-500 | Won quotes, accepted states. |
| Warning | `#F59E0B` | Amber-500 | Pending review states. |
| Destructive | `#EF4444` | Red-500 | Declined quotes, delete confirmations. |
| Info | `#3B82F6` | Blue-500 | Info banners, neutral signals. |

### Typography

- **Headings:** Space Grotesk (variable weight 500–700) — geometric, slightly technical, reads as engineered. Pairs well with industrial subjects.
- **Body:** Inter (variable weight 400–600) — best-in-class for screen reading at all sizes; Latin script first, but supports the broader character set if any diacritics show up in product names.
- **Numeric / data tables / monospace:** JetBrains Mono — tabular figures, clearly distinguished from prose.

**Why these three together:** Space Grotesk gives the brand its industrial confidence at the headline level. Inter is the workhorse — invisible in the right way, never fights the data. JetBrains Mono carries the numeric precision the manufacturing audience expects when reading prices, dimensions, and complexity scores.

### Why Industrial Slate wins

The audience is two-sided: a recruiter who needs the demo to look like a 2026 product, and a manufacturing technical lead/manager who needs it to look like a tool they could plausibly run their estimating department on. Industrial Slate threads both: clean enough to read as modern SaaS, restrained enough to feel like enterprise tooling. The amber accent gives every CTA and every AI confidence indicator a single visual home — when something matters, it's amber. When something is structural, it's slate.

### Trade-off

The palette is monochromatic apart from the amber. That's intentional — but it means the reporting dashboard charts must work hard to distinguish series with limited colour space. The chart palette below allocates discrete hues to make this work.

---

## Mode-specific tokens (light + dark)

| Token | Light | Dark | Notes |
|---|---|---|---|
| Surface (page bg) | `#F8FAFC` Slate-50 | `#020617` Slate-950 | |
| Surface-2 (card) | `#FFFFFF` White | `#0F172A` Slate-900 | |
| Surface-3 (elevated) | `#F1F5F9` Slate-100 | `#1E293B` Slate-800 | Hover states, dropdowns |
| Border | `rgba(15,23,42,0.08)` | `rgba(248,250,252,0.08)` | |
| Border-strong | `rgba(15,23,42,0.16)` | `rgba(248,250,252,0.16)` | |
| Text-primary | `#0F172A` Slate-900 | `#F8FAFC` Slate-50 | |
| Text-secondary | `#475569` Slate-600 | `#94A3B8` Slate-400 | |
| Text-muted | `#64748B` Slate-500 | `#64748B` Slate-500 | |
| Primary button bg | `#0F172A` Slate-900 | `#D97706` Amber-600 | Dark mode flips the primary CTA to amber for higher contrast against slate-950 page bg. |
| Primary button fg | `#F8FAFC` | `#020617` | |
| Accent button bg | `#D97706` Amber-600 | transparent + 1px `rgba(217,119,6,0.5)` border | Ghost in dark per PROJECT-TEMPLATE.md §11 dark-mode rule. |
| Accent button fg | `#FFFFFF` | `#F59E0B` | |
| Welcome headline | `#0F172A` | `#F59E0B` Amber-500 | Headline switches to a brighter amber in dark mode for warmth + contrast. |
| Focus ring | `#D97706` (Amber-600) at 40% alpha | same | Keyboard a11y — must always be visible. |

> **Note:** This is a **light-first** direction (light mode is the default rendering). Dark mode is a fully-supported companion, not a dark-first variant — so the amber accent stays accent in both modes; only the *primary CTA* flips to amber in dark for contrast.

---

## Chart palette (Recharts)

For the Reporting Dashboard, charts need 5+ distinguishable series. Built from the brand palette + curated extensions:

| # | Hex | Name | Use |
|---|---|---|---|
| 1 | `#0F172A` | Slate-900 | Primary series |
| 2 | `#D97706` | Amber-600 | Secondary / highlight series |
| 3 | `#3B82F6` | Blue-500 | Tertiary |
| 4 | `#10B981` | Emerald-500 | Success / win-rate |
| 5 | `#A855F7` | Purple-500 | Quaternary |
| 6 | `#94A3B8` | Slate-400 | Neutral / "other" |

Use sparingly — never more than 4 colours in a single chart unless absolutely required by the data.

---

## Implementation — CSS variables (drop into `globals.css`)

```css
@layer base {
  :root {
    /* Surfaces */
    --surface: 248 250 252;          /* slate-50 */
    --surface-2: 255 255 255;        /* white */
    --surface-3: 241 245 249;        /* slate-100 */

    /* Text */
    --text: 15 23 42;                /* slate-900 */
    --text-secondary: 71 85 105;     /* slate-600 */
    --text-muted: 100 116 139;       /* slate-500 */

    /* Borders */
    --border: 15 23 42;              /* used as rgb(var(--border) / 0.08) */
    --border-strong: 15 23 42;       /* used as rgb(var(--border) / 0.16) */

    /* Brand */
    --primary: 15 23 42;             /* slate-900 */
    --primary-foreground: 248 250 252;
    --accent: 217 119 6;             /* amber-600 */
    --accent-foreground: 255 255 255;
    --secondary: 71 85 105;          /* slate-600 */
    --secondary-foreground: 248 250 252;

    /* Semantic */
    --success: 16 185 129;
    --warning: 245 158 11;
    --destructive: 239 68 68;
    --info: 59 130 246;

    /* Focus ring */
    --ring: 217 119 6;

    /* Radius */
    --radius: 0.5rem;
  }

  .dark {
    --surface: 2 6 23;               /* slate-950 */
    --surface-2: 15 23 42;           /* slate-900 */
    --surface-3: 30 41 59;           /* slate-800 */

    --text: 248 250 252;
    --text-secondary: 148 163 184;
    --text-muted: 100 116 139;

    --border: 248 250 252;
    --border-strong: 248 250 252;

    --primary: 217 119 6;            /* DARK MODE: primary flips to amber */
    --primary-foreground: 2 6 23;
    --accent: 217 119 6;
    --accent-foreground: 245 158 11;
    --secondary: 148 163 184;
    --secondary-foreground: 15 23 42;

    --success: 16 185 129;
    --warning: 245 158 11;
    --destructive: 239 68 68;
    --info: 96 165 250;

    --ring: 245 158 11;
  }
}
```

## Implementation — Tailwind config (drop into `tailwind.config.ts`)

```ts
import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface:        "rgb(var(--surface) / <alpha-value>)",
        "surface-2":    "rgb(var(--surface-2) / <alpha-value>)",
        "surface-3":    "rgb(var(--surface-3) / <alpha-value>)",
        text:           "rgb(var(--text) / <alpha-value>)",
        "text-secondary": "rgb(var(--text-secondary) / <alpha-value>)",
        "text-muted":   "rgb(var(--text-muted) / <alpha-value>)",
        border:         "rgb(var(--border) / <alpha-value>)",
        "border-strong":"rgb(var(--border-strong) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        destructive: "rgb(var(--destructive) / <alpha-value>)",
        info: "rgb(var(--info) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
      },
      fontFamily: {
        heading: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
        mono:    ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

## Implementation — Font loading (Next.js)

```ts
// app/layout.tsx
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable}`}>
      <body className="font-sans bg-surface text-text antialiased">{children}</body>
    </html>
  );
}
```

---

## Component patterns

### Buttons

- **Primary:** filled with `bg-primary text-primary-foreground`, hover `bg-primary/90`. In dark mode this is amber-on-slate.
- **Accent:** filled with `bg-accent text-accent-foreground`, hover `bg-accent/90`. Reserved for the SINGLE most important action on a screen ("Run AI Analysis", "Submit Quote").
- **Secondary:** `border border-border-strong/20 bg-surface-2 text-text hover:bg-surface-3`.
- **Ghost:** `text-text hover:bg-surface-3`.

**Rule:** never two `bg-accent` buttons in the same viewport. Amber is rationed.

### Status badges

| Status | Variant |
|---|---|
| `draft` | secondary (slate text on surface-3) |
| `sent` | info (blue) |
| `accepted` | success (emerald) |
| `declined` | destructive (red) |
| `expired` | muted (slate-400) |

### AI Confidence Gauge (the centerpiece moment)

The complexity score visual is the demo's hero element. Render as a **horizontal progress bar with a numeric label**:
- Track: `bg-surface-3`, height `h-3`, rounded full
- Fill: gradient from `rgb(var(--primary))` at 0% to `rgb(var(--accent))` at 100%, width = `complexity_score * 10`%
- Label below: large `font-heading font-semibold text-3xl` showing "8/10" with a small "Complexity Score" caption above

This is the visual that makes the technical lead pause. Spend extra polish minutes here.

---

## Logo / wordmark

For the demo, no separate logo asset. The wordmark is sufficient:

```html
<span class="font-heading text-xl font-semibold tracking-tight">
  <span class="text-text">MSI</span>
  <span class="text-accent">Quote</span>
  <span class="text-text">Studio</span>
</span>
```

Reads as one phrase with the middle word in amber — establishes the brand colour pairing instantly.

---

## Decision (locked)

**Direction:** Industrial Slate
**Locked:** 2026-04-30
**Rationale:** Documented above. No further exploration to be conducted within this build.

If a future iteration wants to revisit branding (e.g., for a "real" v1.0 after the demo accomplishes its purpose), run the full Section 11 5-direction workflow then.

---

*This file follows PROJECT-TEMPLATE.md Section 11.3 template structure, adapted for a single locked-direction decision rather than a multi-direction exploration.*
