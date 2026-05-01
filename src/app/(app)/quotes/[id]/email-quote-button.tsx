"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { emailQuoteToCustomerAction } from "./email-actions";

type Props = {
  quoteId: string;
  defaultRecipient: string | null;
  customerName: string;
  quoteNumber: string;
  emailConfigured: boolean;
};

export function EmailQuoteButton({
  quoteId,
  defaultRecipient,
  customerName,
  quoteNumber,
  emailConfigured,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState(defaultRecipient ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSend() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await emailQuoteToCustomerAction({
        quoteId,
        recipientEmail: recipient || null,
        customMessage: message || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(`Sent to ${result.sentTo}.`);
      router.refresh();
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(null);
      setSuccess(null);
    }
  }

  if (!emailConfigured) {
    return (
      <span
        className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted opacity-60"
        title="Set BREVO_API_KEY and BREVO_SENDER_EMAIL to enable emailing quotes."
      >
        <Mail className="size-3" aria-hidden />
        Email customer
      </span>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-secondary transition-colors hover:border-border-strong hover:text-text"
          />
        }
      >
        <Mail className="size-3" aria-hidden />
        Email customer
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Email {quoteNumber} to {customerName}</DialogTitle>
          <DialogDescription>
            We&apos;ll attach the branded PDF and the quote will move to{" "}
            <span className="font-mono">sent</span> if it&apos;s currently a draft.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email-recipient">Recipient email</Label>
            <Input
              id="email-recipient"
              type="email"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="buyer@acme.com"
              disabled={pending || Boolean(success)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email-message">Message (optional)</Label>
            <Textarea
              id="email-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Defaults to a short cover note. Add anything you'd want them to read before opening the PDF."
              rows={4}
              disabled={pending || Boolean(success)}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400"
            >
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}
        </div>

        <DialogFooter showCloseButton>
          <Button
            type="button"
            onClick={handleSend}
            disabled={pending || !recipient || Boolean(success)}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {pending ? "Sending…" : success ? "Sent" : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
