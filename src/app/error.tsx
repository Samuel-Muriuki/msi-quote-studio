"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Forwarded to Vercel's runtime logs by default; the digest is what shows
    // up in `vercel logs` for the failing request.
    console.error("[app error]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-12 text-center sm:px-8">
      <div className="space-y-6">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" aria-hidden />
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
          Something went wrong
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          We hit an unexpected error.
        </h1>
        <p className="mx-auto max-w-md text-sm text-text-secondary">
          The team&apos;s already been notified. You can retry in place, or head
          back to the landing page.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-text-muted">
            ref · {error.digest}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            onClick={reset}
            size="default"
            className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
          >
            <RotateCcw className="size-4" />
            Try again
          </Button>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2")}
          >
            <ArrowLeft className="size-4" />
            Back to landing
          </Link>
        </div>
      </div>
    </main>
  );
}
