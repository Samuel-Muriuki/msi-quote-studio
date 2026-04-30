import Link from "next/link";
import { ArrowRight, Cpu, Factory, LineChart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Cpu,
    title: "AI-Enhanced Estimating",
    body: "Real Groq inference on every quote — complexity score, suggested price range, and a plain-English rationale logged for audit.",
  },
  {
    icon: LineChart,
    title: "Real-Time Reporting",
    body: "Pipeline value, win rate, conversion, and AI confidence — surfaced as soon as the quote lands, not the next morning.",
  },
  {
    icon: Factory,
    title: "Catalog-Driven Workflows",
    body: "Real product catalog, materials, industries and certification premiums baked in. Estimators pick from what actually ships.",
  },
];

const REPO_URL = "https://github.com/Samuel-Muriuki/msi-quote-studio";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Wordmark />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            Portfolio case study · Custom manufacturing
          </p>
          <h1 className="mt-6 font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-text sm:text-5xl md:text-6xl">
            AI-enhanced quote estimating
            <br className="hidden sm:block" />
            <span className="text-accent">
              {" "}
              for the labels and converters that ship the world.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base text-text-secondary sm:text-lg">
            Estimators describe a job; the system returns a complexity score, a calibrated price
            range, and the reasoning behind it &mdash; logged for every prediction, on every
            quote.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
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
        </section>

        <section
          aria-label="Capabilities"
          className="border-t border-border bg-surface-3/40"
        >
          <div className="mx-auto grid max-w-6xl gap-px bg-border sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <article key={title} className="bg-background p-8">
                <div className="flex size-10 items-center justify-center rounded-md bg-accent/10 text-accent">
                  <Icon className="size-5" aria-hidden />
                </div>
                <h2 className="mt-5 font-heading text-lg font-semibold text-text">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            Portfolio case study by{" "}
            <span className="font-medium text-text-secondary">Samuel Muriuki</span> &mdash; not
            affiliated with Marking Systems Inc.
          </p>
          <p className="font-mono">
            <a
              href={REPO_URL}
              className="hover:text-text"
              target="_blank"
              rel="noreferrer noopener"
            >
              github.com/Samuel-Muriuki/msi-quote-studio
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function Wordmark() {
  return (
    <span className="font-heading text-lg font-semibold tracking-tight">
      <span className="text-text">MSI</span>{" "}
      <span className="text-accent">Quote</span>{" "}
      <span className="text-text">Studio</span>
    </span>
  );
}
