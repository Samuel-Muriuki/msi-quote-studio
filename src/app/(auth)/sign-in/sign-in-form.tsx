"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Copy, Check, AlertCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const DEMO_EMAIL = "demo@msi-quote-studio.com";
const DEMO_PASSWORD = "demo-account-2026";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<"email" | "password" | null>(null);

  async function copy(value: string, kind: "email" | "password") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard may be blocked; ignore.
    }
  }

  function fillDemo() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? "Sign-in failed");
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-text">
          Welcome back
        </h1>
        <p className="text-sm text-text-secondary">
          Sign in to your estimator account.
        </p>
      </div>

      <div className="rounded-md border border-accent/30 bg-accent/5 p-4">
        <p className="text-xs font-mono uppercase tracking-[0.16em] text-accent">
          Demo credentials
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          Use these to skip account creation:
        </p>
        <div className="mt-3 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between gap-2 rounded bg-surface-3 px-3 py-2">
            <span className="truncate text-text">{DEMO_EMAIL}</span>
            <button
              type="button"
              onClick={() => copy(DEMO_EMAIL, "email")}
              className="text-text-muted transition-colors hover:text-text"
              aria-label="Copy email"
            >
              {copied === "email" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 rounded bg-surface-3 px-3 py-2">
            <span className="truncate text-text">{DEMO_PASSWORD}</span>
            <button
              type="button"
              onClick={() => copy(DEMO_PASSWORD, "password")}
              className="text-text-muted transition-colors hover:text-text"
              aria-label="Copy password"
            >
              {copied === "password" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={fillDemo}
          className="mt-3 text-xs font-medium text-accent hover:underline"
        >
          Or fill them in for me →
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          size="lg"
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        Need an account?{" "}
        <Link
          href="/sign-up"
          className={cn(
            buttonVariants({ variant: "link", size: "sm" }),
            "h-auto p-0 text-accent hover:text-accent/80",
          )}
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
