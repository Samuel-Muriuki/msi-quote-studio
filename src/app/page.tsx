import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Cpu,
  FileText,
  Sparkles,
  Send,
  Plane,
  HeartPulse,
  Shield,
  Droplets,
  Radio,
  Anchor,
  Wrench,
  Utensils,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { LandingFaq } from "@/components/landing/landing-faq";
import { BenchmarkTeaser } from "@/components/landing/benchmark-teaser";
import { FreeCalculator } from "@/components/landing/free-calculator";

const REPO_URL = "https://github.com/Samuel-Muriuki/msi-quote-studio";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <HeroSection />
        <LogoStrip />
        <HowItWorks />
        <CalculatorSection />
        <BenchmarkSection />
        <TestimonialSection />
        <FaqSection />
        <CTASection />
      </main>

      <SiteFooter />
    </div>
  );
}

// =============================================================
// Header
// =============================================================

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Wordmark />
        <nav className="hidden items-center gap-6 text-sm font-medium text-text-secondary md:flex">
          <a href="#how-it-works" className="hover:text-text">How it works</a>
          <a href="#calculator" className="hover:text-text">Calculator</a>
          <a href="#benchmark" className="hover:text-text">Benchmark</a>
          <a href="#faq" className="hover:text-text">FAQ</a>
          <a href={REPO_URL} target="_blank" rel="noreferrer noopener" className="hover:text-text">
            GitHub
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/sign-in"
            className={cn(
              buttonVariants({ size: "sm" }),
              "bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5",
            )}
          >
            Sign in
            <ChevronRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Wordmark() {
  return (
    <Link href="/" className="font-heading text-lg font-semibold tracking-tight">
      <span className="text-text">MSI</span>{" "}
      <span className="text-accent">Quote</span>{" "}
      <span className="text-text">Studio</span>
    </Link>
  );
}

// =============================================================
// Hero
// =============================================================

function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 20% -10%, rgb(var(--accent) / 0.16), transparent 50%), radial-gradient(circle at 90% 110%, rgb(var(--info) / 0.12), transparent 50%)",
        }}
        aria-hidden
      />
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
            <Sparkles className="size-3" />
            Portfolio case study · Custom manufacturing
          </p>
          <h1 className="mt-6 font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-text sm:text-5xl md:text-6xl">
            AI-enhanced quoting,
            <br className="hidden sm:block" />
            <span className="text-accent">priced by the numbers, not by hunch.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-text-secondary sm:text-lg">
            Estimators describe the job; the system returns a complexity score, a calibrated price
            band, and the reasoning behind it &mdash; logged for every prediction, on every quote,
            against your industry's benchmark.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sign-in"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 gap-2 px-6 text-base bg-accent text-accent-foreground hover:bg-accent/90",
              )}
            >
              Try the demo
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer noopener"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 px-6 text-base",
              )}
            >
              View source on GitHub
            </a>
          </div>
          <p className="mt-4 text-xs text-text-muted">
            One-click <span className="text-text">Sign in as demo</span> &mdash; no account needed.
            Loads with 11 realistic seeded quotes.
          </p>
        </div>

        <HeroMockup />
      </div>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute inset-x-6 -bottom-8 -z-10 h-24 rounded-full bg-accent/20 blur-3xl"
      />
      <div className="overflow-hidden rounded-xl border border-border bg-surface-2 shadow-2xl shadow-primary/10">
        <div className="flex items-center gap-1.5 border-b border-border bg-surface-3 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-destructive/60" />
          <span className="size-2.5 rounded-full bg-warning/60" />
          <span className="size-2.5 rounded-full bg-success/60" />
          <span className="ml-3 truncate rounded-md bg-background/60 px-2.5 py-1 font-mono text-[10px] text-text-muted">
            msi-quote-studio.vercel.app/quotes/W8tk…
          </span>
        </div>
        <div className="space-y-5 p-5 sm:p-7">
          <header className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary">
                AI Analysis
              </p>
              <p className="mt-1 font-heading text-sm font-semibold text-text">
                Boeing 787 cabin nameplate run · 2,400 pcs
              </p>
            </div>
            <span className="inline-flex items-center rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-success">
              Accepted
            </span>
          </header>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                Complexity score
              </span>
              <span className="font-heading text-2xl font-semibold tabular-nums text-text">
                8<span className="text-text-muted">/10</span>
              </span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full"
                style={{
                  width: "80%",
                  background:
                    "linear-gradient(90deg, rgb(var(--primary)) 0%, rgb(var(--accent)) 100%)",
                }}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface-3/40 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
              Suggested price range
            </p>
            <p className="mt-1 font-heading text-3xl font-semibold tabular-nums text-text">
              <span>$2,640</span>
              <span className="text-text-muted"> – </span>
              <span>$3,150</span>
            </p>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
              Rationale
            </p>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Complexity 8/10 reflects Aerospace certification requirements (AS9100, ITAR) and the
              2,400-piece run size. Required certifications drive documentation overhead.
              Suggested band reflects standard markup plus a premium risk allowance.
            </p>
          </div>

          <p className="border-t border-border pt-3 font-mono text-[10px] text-text-muted">
            llama-3.3-70b-versatile · 1.4s · prediction logged
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================
// Logo strip
// =============================================================

function LogoStrip() {
  const industries = [
    { Icon: Plane, label: "Aerospace" },
    { Icon: HeartPulse, label: "Medical" },
    { Icon: Shield, label: "Defense" },
    { Icon: Droplets, label: "Oil & Gas" },
    { Icon: Radio, label: "Telecom" },
    { Icon: Utensils, label: "Food & Bev" },
    { Icon: Anchor, label: "Marine" },
    { Icon: Wrench, label: "Industrial" },
  ];
  return (
    <section className="border-b border-border bg-surface-3/40">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.24em] text-text-muted">
          Modelled on real catalog data from 8 manufacturing verticals
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {industries.map(({ Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center gap-2 text-text-secondary opacity-80 grayscale transition-opacity hover:opacity-100"
            >
              <Icon className="size-5" aria-hidden />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================
// How it works
// =============================================================

function HowItWorks() {
  const steps = [
    {
      n: "01",
      Icon: FileText,
      title: "Describe the job",
      body: "Pick a product, material and industry. Set dimensions and run size. The catalog comes pre-loaded with the standard Marking Systems product list.",
    },
    {
      n: "02",
      Icon: Cpu,
      title: "AI scores complexity",
      body: "Real Groq inference returns a 1–10 complexity score, a calibrated price band, and a plain-English rationale. Every prediction logs to an audit table.",
    },
    {
      n: "03",
      Icon: Sparkles,
      title: "Review against benchmark",
      body: "See your cost structure beside your industry's benchmark. Materials, Labor, Overhead, Scrap — green and red deltas tell you where margin hides.",
    },
    {
      n: "04",
      Icon: Send,
      title: "Send a branded quote",
      body: "Mark sent. Customer approves with one click. Track through your pipeline as it moves from draft to accepted to invoiced.",
    },
  ];
  return (
    <section
      id="how-it-works"
      aria-label="How MSI Quote Studio works"
      className="border-b border-border"
    >
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            How it works
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            From job description to sent quote in under 90 seconds.
          </h2>
          <p className="mt-4 text-base text-text-secondary">
            Four steps. The AI scoring and benchmark deltas happen on every quote, automatically,
            so the estimator never opens another spreadsheet.
          </p>
        </div>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ n, Icon, title, body }) => (
            <li key={n} className="flex flex-col gap-4 bg-card p-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
                  {n}
                </span>
                <Icon className="size-5 text-text-secondary" aria-hidden />
              </div>
              <h3 className="font-heading text-base font-semibold text-text">{title}</h3>
              <p className="text-sm leading-relaxed text-text-secondary">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// =============================================================
// Benchmark section
// =============================================================

function CalculatorSection() {
  return (
    <section id="calculator" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            Try it now &mdash; free
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            Manufacturing cost calculator.
          </h2>
          <p className="mt-4 text-base text-text-secondary">
            Drag the sliders to see your unit cost, monthly total, profit per unit, and gross
            margin update live. No sign-up &mdash; bookmark the page if you want to come back to it.
          </p>
        </div>
        <div className="mt-10">
          <FreeCalculator />
        </div>
      </div>
    </section>
  );
}

function BenchmarkSection() {
  return (
    <section id="benchmark" className="border-b border-border bg-surface-3/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            Benchmark
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            Stop guessing where your margin hides.
          </h2>
          <p className="mt-4 max-w-xl text-base text-text-secondary">
            Every quote shows your cost structure next to the industry benchmark. Materials at
            48%? Labor 30%? Scrap 6%? The deltas tell you where the lever is, in seconds. No
            spreadsheets, no outside consultants.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-text-secondary">
            {[
              "Pulled from publicly available manufacturing-cost benchmarks.",
              "Scoped to your industry, your product category, your run size.",
              "Updated as your quote pipeline grows.",
            ].map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span className="mt-1 inline-block size-1.5 rounded-full bg-accent" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <BenchmarkTeaser />
      </div>
    </section>
  );
}

// =============================================================
// Testimonials
// =============================================================

function TestimonialSection() {
  const items = [
    {
      quote:
        "The AI rationale on every quote is the part I didn't know I needed. We finally have a paper trail when a customer disputes a price.",
      who: "VP Operations",
      where: "Aerospace components manufacturer",
      initials: "VO",
      tone: "from-primary/40 to-accent/40",
    },
    {
      quote:
        "I quote 40 jobs a week. The benchmark widget shaved 15 minutes per quote and surfaced two product lines we were under-pricing by 8%.",
      who: "Senior Estimator",
      where: "Medical device labels",
      initials: "SE",
      tone: "from-accent/40 to-info/40",
    },
    {
      quote:
        "The dashboard tells me where in the funnel quotes die. Last quarter I caught a 12% drop in conversion on aluminium parts before my GM did.",
      who: "Plant Manager",
      where: "Industrial OEM",
      initials: "PM",
      tone: "from-info/40 to-success/40",
    },
  ];
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            How estimators describe it
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            Three roles, three different reasons it lands.
          </h2>
          <p className="mt-3 text-sm text-text-muted">
            Synthetic quotes attributed to representative manufacturing personas. Demo project, not
            a customer endorsement.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {items.map((t) => (
            <article
              key={t.who}
              className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6"
            >
              <p className="text-sm leading-relaxed text-text">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-auto flex items-center gap-3 border-t border-border pt-4">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full bg-gradient-to-br font-mono text-xs font-semibold text-text",
                    t.tone,
                  )}
                  aria-hidden
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-text">{t.who}</p>
                  <p className="text-xs text-text-muted">{t.where}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================
// FAQ
// =============================================================

function FaqSection() {
  return (
    <section id="faq" className="border-b border-border bg-surface-3/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            Frequently asked
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            The questions estimators usually ask.
          </h2>
          <p className="mt-4 text-sm text-text-secondary">
            Cost methodology, AI scoring details, scrap recovery math, margin benchmarks. Plain
            answers, no marketing fluff.
          </p>
        </div>
        <LandingFaq />
      </div>
    </section>
  );
}

// =============================================================
// CTA
// =============================================================

function CTASection() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 sm:py-24">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
          Try it now
        </p>
        <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          Sign in as demo, land in the app in five seconds.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-text-secondary">
          Pre-seeded estimator account, 11 realistic quotes across Aerospace, Medical, Defense and
          Industrial verticals, real Groq AI on every quote.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/sign-in"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-12 gap-2 px-6 text-base bg-accent text-accent-foreground hover:bg-accent/90",
            )}
          >
            Sign in as demo
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="/sign-up"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 px-6 text-base")}
          >
            Create your own account
          </Link>
        </div>
      </div>
    </section>
  );
}

// =============================================================
// Footer
// =============================================================

function SiteFooter() {
  return (
    <footer className="bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="space-y-1">
          <p>
            Portfolio case study by{" "}
            <span className="font-medium text-text-secondary">Samuel Muriuki</span> &mdash; not
            affiliated with Marking Systems Inc.
          </p>
          <p>&copy; 2026 &mdash; All rights reserved.</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono">
          <a href="#how-it-works" className="hover:text-text">How it works</a>
          <a href="#calculator" className="hover:text-text">Calculator</a>
          <a href="#benchmark" className="hover:text-text">Benchmark</a>
          <a href="#faq" className="hover:text-text">FAQ</a>
          <a href={REPO_URL} target="_blank" rel="noreferrer noopener" className="hover:text-text">
            github.com/Samuel-Muriuki/msi-quote-studio
          </a>
        </div>
      </div>
    </footer>
  );
}
