"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/searchable-select";
import { cn } from "@/lib/utils";
import { updateQuoteAction } from "./actions";

type CustomerRow = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
};

type Props = {
  quote: {
    id: string;
    customer_id: string | null;
    customer_name: string;
    customer_email: string | null;
    notes: string | null;
  };
  customers: CustomerRow[];
};

export function EditQuoteForm({ quote, customers }: Props) {
  const [customerId, setCustomerId] = useState<string | null>(quote.customer_id);
  const [customerName, setCustomerName] = useState(quote.customer_name);
  const [customerEmail, setCustomerEmail] = useState(quote.customer_email ?? "");
  const [notes, setNotes] = useState(quote.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCustomer = customerId
    ? customers.find((c) => c.id === customerId) ?? null
    : null;

  function pickCustomer(id: string) {
    const customer = customers.find((c) => c.id === id);
    if (!customer) return;
    setCustomerId(id);
    setCustomerName(customer.name);
    setCustomerEmail(customer.email ?? "");
  }

  function clearCustomerSelection() {
    setCustomerId(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateQuoteAction({
        id: quote.id,
        customerId,
        customerName,
        customerEmail: customerEmail || null,
        notes: notes || null,
      });
      if (result && !result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {customers.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="customer-picker">Pick a saved customer (optional)</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchableSelect
                ariaLabel="Saved customer"
                placeholder="Search saved customers…"
                searchPlaceholder={`Search ${customers.length} customer${customers.length === 1 ? "" : "s"}…`}
                value={customerId}
                onValueChange={pickCustomer}
                options={customers.map((c) => ({
                  value: c.id,
                  label: c.name,
                  sublabel: [c.company, c.email].filter(Boolean).join(" · ") || undefined,
                }))}
              />
            </div>
            {selectedCustomer && (
              <Button type="button" variant="outline" size="sm" onClick={clearCustomerSelection}>
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customer-name">Customer name</Label>
          <Input
            id="customer-name"
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            disabled={isPending}
            readOnly={selectedCustomer !== null}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-email">Email</Label>
          <Input
            id="customer-email"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            disabled={isPending}
            readOnly={selectedCustomer !== null}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          disabled={isPending}
        />
      </div>

      <p className="rounded-md border border-border bg-surface-1 px-3 py-2 text-xs text-text-muted">
        Line items are immutable after a quote is created — they&apos;re tied to the AI
        prediction and base estimate. To change a product, material, dimension or
        quantity, recreate the quote.
      </p>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col-reverse items-stretch justify-end gap-2 sm:flex-row sm:items-center">
        <Link
          href={`/quotes/${quote.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "default" }))}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={isPending} className="min-w-32">
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
