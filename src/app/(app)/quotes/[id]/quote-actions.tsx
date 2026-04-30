"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, CheckCircle2, XCircle, RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  markQuoteAsSent,
  markQuoteAsAccepted,
  markQuoteAsDeclined,
  reopenQuoteAsDraft,
} from "./actions";
import { isQuoteStatus, type QuoteStatus } from "@/lib/quote-helpers";

type ActionFn = (quoteId: string) => Promise<{ ok: true } | { ok: false; error: string }>;

type Action = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  fn: ActionFn;
  variant: "default" | "secondary" | "outline" | "destructive";
  /** Highlight the primary CTA in amber. */
  accent?: boolean;
};

const ACCEPT: Action = {
  key: "accept",
  label: "Mark as accepted",
  icon: CheckCircle2,
  fn: (id) => markQuoteAsAccepted(id),
  variant: "default",
  accent: true,
};
const SEND: Action = {
  key: "sent",
  label: "Mark as sent",
  icon: Send,
  fn: markQuoteAsSent,
  variant: "default",
};
const DECLINE: Action = {
  key: "decline",
  label: "Mark as declined",
  icon: XCircle,
  fn: markQuoteAsDeclined,
  variant: "outline",
};
const REOPEN: Action = {
  key: "reopen",
  label: "Re-open as draft",
  icon: RotateCcw,
  fn: reopenQuoteAsDraft,
  variant: "outline",
};

const ACTIONS_BY_STATUS: Record<QuoteStatus, readonly Action[]> = {
  draft: [SEND, ACCEPT, DECLINE],
  sent: [ACCEPT, DECLINE],
  accepted: [],
  declined: [REOPEN],
  expired: [REOPEN],
};

export function QuoteActions({
  quoteId,
  status,
}: {
  quoteId: string;
  status: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const safeStatus: QuoteStatus = isQuoteStatus(status) ? status : "draft";
  const actions = ACTIONS_BY_STATUS[safeStatus];

  if (actions.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        This quote is {safeStatus === "accepted" ? "closed and accepted" : "closed"} — no further actions available.
      </p>
    );
  }

  function run(action: Action) {
    setError(null);
    setActiveKey(action.key);
    startTransition(async () => {
      const result = await action.fn(quoteId);
      setActiveKey(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const isThisActive = activeKey === action.key;
          return (
            <Button
              key={action.key}
              type="button"
              variant={action.variant}
              size="default"
              onClick={() => run(action)}
              disabled={pending}
              className={
                action.accent
                  ? "bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                  : "gap-2"
              }
            >
              <Icon className="size-4" aria-hidden />
              {isThisActive && pending ? "Saving…" : action.label}
            </Button>
          );
        })}
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
    </div>
  );
}
