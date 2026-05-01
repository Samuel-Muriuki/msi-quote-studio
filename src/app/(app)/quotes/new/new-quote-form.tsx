"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/searchable-select";
import { calculateBaseEstimate } from "@/lib/estimator";
import { generateQuoteSeed } from "@/lib/demo-fill";
import { createQuoteAction } from "./actions";
import { uploadCadFileAction, type CadUploadResult } from "./cad-actions";

type ProductRow = {
  id: string;
  category: string;
  name: string;
  base_price_per_sq_in: number;
  setup_fee: number;
  min_qty: number;
};

type MaterialRow = {
  id: string;
  type: string;
  name: string;
  durability_score: number;
};

type IndustryRow = {
  id: string;
  name: string;
  certification_premium: number;
  required_certifications: string[];
};

type CustomerRow = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
};

type Props = {
  products: ProductRow[];
  materials: MaterialRow[];
  industries: IndustryRow[];
  customers: CustomerRow[];
};

type LineState = {
  /** Stable per-render id for React keys (UUID generated on add). */
  uid: string;
  productId: string;
  materialId: string;
  widthInches: string;
  heightInches: string;
  quantity: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  nameplate: "Nameplates",
  overlay: "Overlays",
  info_label: "Information labels",
  membrane_switch: "Membrane switches",
  die_cut_gasket: "Die-cut gaskets",
  emi_rfi: "EMI / RFI shielding",
  thermal_management: "Thermal management",
};

const MATERIAL_TYPE_LABELS: Record<string, string> = {
  substrate: "Substrates",
  adhesive: "Adhesives",
  overlaminate: "Overlaminates",
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function emptyLine(): LineState {
  return {
    uid: crypto.randomUUID(),
    productId: "",
    materialId: "",
    widthInches: "",
    heightInches: "",
    quantity: "",
  };
}

type CadState =
  | { status: "idle" }
  | { status: "uploading"; filename: string }
  | { status: "success"; result: Extract<CadUploadResult, { ok: true }> }
  | { status: "error"; message: string };

export function NewQuoteForm({ products, materials, industries, customers }: Props) {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [industryId, setIndustryId] = useState("");
  const [lines, setLines] = useState<LineState[]>([emptyLine()]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [cadByLine, setCadByLine] = useState<Record<string, CadState>>({});
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

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
    setCustomerName("");
    setCustomerEmail("");
  }

  function updateLine(uid: string, patch: Partial<LineState>) {
    setLines((current) => current.map((l) => (l.uid === uid ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((current) => [...current, emptyLine()]);
  }

  function removeLine(uid: string) {
    setLines((current) =>
      current.length === 1 ? current : current.filter((l) => l.uid !== uid),
    );
    setCadByLine((current) => {
      const next = { ...current };
      delete next[uid];
      return next;
    });
  }

  async function handleCadUpload(uid: string, file: File) {
    setCadByLine((current) => ({
      ...current,
      [uid]: { status: "uploading", filename: file.name },
    }));
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadCadFileAction(formData);
    if (!result.ok) {
      setCadByLine((current) => ({
        ...current,
        [uid]: { status: "error", message: result.error },
      }));
      return;
    }
    setCadByLine((current) => ({
      ...current,
      [uid]: { status: "success", result },
    }));
  }

  function applyCadDimensions(uid: string) {
    const cad = cadByLine[uid];
    if (!cad || cad.status !== "success") return;
    updateLine(uid, {
      widthInches: cad.result.widthInches.toFixed(3),
      heightInches: cad.result.heightInches.toFixed(3),
    });
  }

  function clearCadUpload(uid: string) {
    setCadByLine((current) => {
      const next = { ...current };
      delete next[uid];
      return next;
    });
    const input = fileInputs.current[uid];
    if (input) input.value = "";
  }

  function autofill() {
    const seed = generateQuoteSeed({ products, materials, industries });
    if (!seed) return;
    // Clear any saved-customer selection — the autofilled name/email come from
    // the persona, not from a row in the customers table.
    clearCustomerSelection();
    setCustomerName(seed.customer.name);
    setCustomerEmail(seed.customer.email);
    if (seed.industryId) setIndustryId(seed.industryId);
    setNotes(seed.notes);
    setLines(
      seed.lines.map((l) => ({
        uid: crypto.randomUUID(),
        productId: l.productId,
        materialId: l.materialId,
        widthInches: l.widthInches,
        heightInches: l.heightInches,
        quantity: l.quantity,
      })),
    );
    setError(null);
  }

  const groupedProducts = useMemo(() => {
    const groups = new Map<string, ProductRow[]>();
    for (const p of products) {
      const key = p.category;
      const arr = groups.get(key) ?? [];
      arr.push(p);
      groups.set(key, arr);
    }
    return groups;
  }, [products]);

  const groupedMaterials = useMemo(() => {
    const groups = new Map<string, MaterialRow[]>();
    for (const m of materials) {
      const key = m.type;
      const arr = groups.get(key) ?? [];
      arr.push(m);
      groups.set(key, arr);
    }
    return groups;
  }, [materials]);

  const productOptions = useMemo(
    () =>
      [...groupedProducts.entries()].flatMap(([category, items]) =>
        items.map((p) => ({
          value: p.id,
          label: p.name,
          group: CATEGORY_LABELS[category] ?? category,
          sublabel: `Setup ${"$"}${Number(p.setup_fee).toLocaleString()} · min ${p.min_qty} pcs`,
        })),
      ),
    [groupedProducts],
  );
  const materialOptions = useMemo(
    () =>
      [...groupedMaterials.entries()].flatMap(([type, items]) =>
        items.map((m) => ({
          value: m.id,
          label: m.name,
          group: MATERIAL_TYPE_LABELS[type] ?? type,
          sublabel: `Durability ${m.durability_score}/10`,
        })),
      ),
    [groupedMaterials],
  );

  const selectedIndustry = industries.find((i) => i.id === industryId);
  const certifications = selectedIndustry?.required_certifications ?? [];

  // Per-line estimate + aggregate.
  const lineEstimates = lines.map((line) => {
    const product = products.find((p) => p.id === line.productId);
    const widthNum = Number(line.widthInches);
    const heightNum = Number(line.heightInches);
    const qtyNum = Number(line.quantity);
    if (
      !product ||
      !selectedIndustry ||
      !Number.isFinite(widthNum) || widthNum <= 0 ||
      !Number.isFinite(heightNum) || heightNum <= 0 ||
      !Number.isInteger(qtyNum) || qtyNum <= 0
    ) {
      return null;
    }
    return calculateBaseEstimate({
      basePricePerSqIn: Number(product.base_price_per_sq_in),
      setupFee: Number(product.setup_fee),
      widthInches: widthNum,
      heightInches: heightNum,
      quantity: qtyNum,
      certificationPremium: Number(selectedIndustry.certification_premium),
    });
  });

  const allLinesValid = lineEstimates.every((e) => e !== null);
  const livePreviewTotal = allLinesValid
    ? lineEstimates.reduce((sum, e) => sum + (e ?? 0), 0)
    : null;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createQuoteAction({
        customerId,
        customerName,
        customerEmail: customerEmail || null,
        industryId,
        certifications,
        notes: notes || null,
        lines: lines.map((line) => {
          const cad = cadByLine[line.uid];
          return {
            productId: line.productId,
            materialId: line.materialId,
            widthInches: Number(line.widthInches),
            heightInches: Number(line.heightInches),
            quantity: Number(line.quantity),
            cadUploadId: cad?.status === "success" ? cad.result.id : null,
          };
        }),
      });
      if (result && !result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={autofill}
          className="gap-1.5"
        >
          <Sparkles className="size-3.5" />
          Autofill demo data
        </Button>
      </div>

      <Section title="Customer">
        {customers.length > 0 && (
          <Field id="customer-picker" label="Pick a saved customer (optional)">
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearCustomerSelection}
                >
                  Clear
                </Button>
              )}
            </div>
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="customer-name" label="Customer name" required>
            <Input
              id="customer-name"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Acme Manufacturing"
              readOnly={selectedCustomer !== null}
              aria-readonly={selectedCustomer !== null}
            />
          </Field>
          <Field id="customer-email" label="Email (optional)">
            <Input
              id="customer-email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="buyer@acme.com"
              readOnly={selectedCustomer !== null}
              aria-readonly={selectedCustomer !== null}
            />
          </Field>
        </div>

        {customers.length === 0 && (
          <p className="flex items-center gap-1.5 text-xs text-text-muted">
            <UserPlus className="size-3.5" />
            Tip:{" "}
            <Link href="/customers/new" className="underline hover:text-text">
              save a customer
            </Link>{" "}
            once and you can pick them on every future quote.
          </p>
        )}
      </Section>

      <Section
        title="Lines"
        description="Add one row per distinct product/material/dimension combination."
      >
        <div className="space-y-4">
          {lines.map((line, i) => {
            const lineEstimate = lineEstimates[i];
            const lineProduct = products.find((p) => p.id === line.productId);
            const qtyNum = Number(line.quantity);
            const minQtyWarning =
              lineProduct && line.quantity && qtyNum > 0 && qtyNum < lineProduct.min_qty;
            return (
              <div
                key={line.uid}
                className="rounded-lg border border-border bg-surface-1 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                    Line {i + 1}
                  </p>
                  <div className="flex items-center gap-3">
                    {lineEstimate !== null && (
                      <span className="font-mono text-xs tabular-nums text-text-secondary">
                        {currency.format(lineEstimate)}
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeLine(line.uid)}
                      disabled={lines.length === 1}
                      aria-label={`Remove line ${i + 1}`}
                      title={lines.length === 1 ? "At least one line is required" : "Remove line"}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field id={`product-${line.uid}`} label="Product" required>
                    <SearchableSelect
                      ariaLabel="Product"
                      placeholder="Select a product"
                      searchPlaceholder={`Search ${products.length} products…`}
                      value={line.productId || null}
                      onValueChange={(v) => updateLine(line.uid, { productId: v })}
                      options={productOptions}
                    />
                  </Field>
                  <Field id={`material-${line.uid}`} label="Material" required>
                    <SearchableSelect
                      ariaLabel="Material"
                      placeholder="Select a material"
                      searchPlaceholder={`Search ${materials.length} materials…`}
                      value={line.materialId || null}
                      onValueChange={(v) => updateLine(line.uid, { materialId: v })}
                      options={materialOptions}
                    />
                  </Field>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Field id={`width-${line.uid}`} label="Width (in)" required>
                    <Input
                      id={`width-${line.uid}`}
                      type="number"
                      inputMode="decimal"
                      step="0.001"
                      min="0.001"
                      required
                      value={line.widthInches}
                      onChange={(e) => updateLine(line.uid, { widthInches: e.target.value })}
                      placeholder="3.000"
                    />
                  </Field>
                  <Field id={`height-${line.uid}`} label="Height (in)" required>
                    <Input
                      id={`height-${line.uid}`}
                      type="number"
                      inputMode="decimal"
                      step="0.001"
                      min="0.001"
                      required
                      value={line.heightInches}
                      onChange={(e) => updateLine(line.uid, { heightInches: e.target.value })}
                      placeholder="1.500"
                    />
                  </Field>
                  <Field id={`quantity-${line.uid}`} label="Quantity" required>
                    <Input
                      id={`quantity-${line.uid}`}
                      type="number"
                      inputMode="numeric"
                      step="1"
                      min="1"
                      required
                      value={line.quantity}
                      onChange={(e) => updateLine(line.uid, { quantity: e.target.value })}
                      placeholder="500"
                    />
                  </Field>
                </div>

                {minQtyWarning && (
                  <p className="mt-2 text-xs text-warning">
                    Minimum order quantity for this product is {lineProduct?.min_qty}.
                  </p>
                )}

                <div className="mt-3 border-t border-border pt-3">
                  <input
                    ref={(el) => {
                      fileInputs.current[line.uid] = el;
                    }}
                    type="file"
                    accept=".svg,.dxf,image/svg+xml,image/vnd.dxf,application/dxf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCadUpload(line.uid, file);
                    }}
                  />
                  <CadUploadInline
                    state={cadByLine[line.uid] ?? { status: "idle" }}
                    onPick={() => fileInputs.current[line.uid]?.click()}
                    onApply={() => applyCadDimensions(line.uid)}
                    onClear={() => clearCadUpload(line.uid)}
                  />
                </div>
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLine}
            className="gap-1.5"
          >
            <Plus className="size-3.5" />
            Add another line
          </Button>
        </div>
      </Section>

      <Section title="Industry & certifications">
        <Field id="industry" label="Industry" required>
          <SearchableSelect
            ariaLabel="Industry"
            placeholder="Select an industry"
            searchPlaceholder={`Search ${industries.length} industries…`}
            value={industryId || null}
            onValueChange={setIndustryId}
            options={industries.map((i) => ({
              value: i.id,
              label: i.name,
              sublabel: `Certification premium ×${Number(i.certification_premium).toFixed(2)}`,
            }))}
          />
        </Field>
        {certifications.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-text-secondary">
              Required certifications
            </p>
            <div className="flex flex-wrap gap-2">
              {certifications.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-border bg-surface-3 px-3 py-1 text-xs font-mono text-text"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title="Notes">
        <Field id="notes" label="Anything the AI should know (optional)">
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tight tolerance on the corner radius, order ships to multiple sites, etc."
            rows={3}
          />
        </Field>
      </Section>

      {livePreviewTotal !== null && (
        <div className="rounded-md border border-accent/30 bg-accent/5 p-4">
          <p className="text-xs font-mono uppercase tracking-[0.16em] text-accent">
            Live base estimate (rule-based)
          </p>
          <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-text">
            {currency.format(livePreviewTotal)}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Sum of {lines.length} {lines.length === 1 ? "line" : "lines"} including setup fees
            and the {selectedIndustry?.name} ×{Number(selectedIndustry?.certification_premium).toFixed(2)} certification premium. The AI score and price band land on the quote detail page after submit.
          </p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-text-muted">
          We&apos;ll save the quote as <span className="font-mono">draft</span>. You can mark it sent / accepted / declined later.
        </p>
        <Button
          type="submit"
          disabled={isPending}
          size="lg"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {isPending ? "Saving…" : "Save draft & continue"}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold text-text">{title}</h2>
        {description && <p className="text-xs text-text-muted">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function CadUploadInline({
  state,
  onPick,
  onApply,
  onClear,
}: {
  state: CadState;
  onPick: () => void;
  onApply: () => void;
  onClear: () => void;
}) {
  if (state.status === "idle") {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onPick}
        className="gap-1.5"
      >
        <FileUp className="size-3.5" />
        Upload CAD (SVG or DXF)
      </Button>
    );
  }

  if (state.status === "uploading") {
    return (
      <div className="flex items-center gap-2 text-xs text-text-secondary">
        <Loader2 className="size-3.5 animate-spin" />
        Uploading {state.filename}…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          <span>{state.message}</span>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onPick}>
          Try a different file
        </Button>
      </div>
    );
  }

  // success
  const r = state.result;
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2 text-xs text-success">
        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
        <span>
          <span className="font-mono text-text">{r.filename}</span> &middot; Extracted{" "}
          <span className="font-mono text-text">
            {r.widthInches} &times; {r.heightInches} in
          </span>
          {" "}&middot; <span className="font-mono text-text">{r.pathCount}</span> shape
          {r.pathCount === 1 ? "" : "s"}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onApply}
          className="gap-1.5"
        >
          <CheckCircle2 className="size-3.5" />
          Use these dimensions
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
