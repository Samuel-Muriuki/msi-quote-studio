"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/searchable-select";
import { calculateBaseEstimate } from "@/lib/estimator";
import { createQuoteAction } from "./actions";

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

type Props = {
  products: ProductRow[];
  materials: MaterialRow[];
  industries: IndustryRow[];
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

export function NewQuoteForm({ products, materials, industries }: Props) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [productId, setProductId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [industryId, setIndustryId] = useState("");
  const [widthInches, setWidthInches] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  const selectedIndustry = industries.find((i) => i.id === industryId);
  const selectedProduct = products.find((p) => p.id === productId);
  const certifications = selectedIndustry?.required_certifications ?? [];

  const widthNum = Number(widthInches);
  const heightNum = Number(heightInches);
  const quantityNum = Number(quantity);

  const livePreview =
    selectedProduct && selectedIndustry &&
    Number.isFinite(widthNum) && widthNum > 0 &&
    Number.isFinite(heightNum) && heightNum > 0 &&
    Number.isInteger(quantityNum) && quantityNum > 0
      ? calculateBaseEstimate({
          basePricePerSqIn: Number(selectedProduct.base_price_per_sq_in),
          setupFee: Number(selectedProduct.setup_fee),
          widthInches: widthNum,
          heightInches: heightNum,
          quantity: quantityNum,
          certificationPremium: Number(selectedIndustry.certification_premium),
        })
      : null;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createQuoteAction({
        customerName,
        customerEmail: customerEmail || null,
        productId,
        materialId,
        industryId,
        widthInches: widthNum,
        heightInches: heightNum,
        quantity: quantityNum,
        certifications,
        notes: notes || null,
      });
      if (result && !result.ok) {
        setError(result.error);
      }
      // success path: server action calls redirect() which throws a redirect signal,
      // so we never reach a "ok: true" branch in the client.
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      <Section title="Customer">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="customer-name" label="Customer name" required>
            <Input
              id="customer-name"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Acme Manufacturing"
            />
          </Field>
          <Field id="customer-email" label="Email (optional)">
            <Input
              id="customer-email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="buyer@acme.com"
            />
          </Field>
        </div>
      </Section>

      <Section title="Product">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="product" label="Product" required>
            <SearchableSelect
              ariaLabel="Product"
              placeholder="Select a product"
              searchPlaceholder="Search 16 products…"
              value={productId || null}
              onValueChange={setProductId}
              options={[...groupedProducts.entries()].flatMap(([category, items]) =>
                items.map((p) => ({
                  value: p.id,
                  label: p.name,
                  group: CATEGORY_LABELS[category] ?? category,
                  sublabel: `Setup ${"$"}${Number(p.setup_fee).toLocaleString()} · min ${p.min_qty} pcs`,
                })),
              )}
            />
          </Field>

          <Field id="material" label="Material" required>
            <SearchableSelect
              ariaLabel="Material"
              placeholder="Select a material"
              searchPlaceholder="Search 14 materials…"
              value={materialId || null}
              onValueChange={setMaterialId}
              options={[...groupedMaterials.entries()].flatMap(([type, items]) =>
                items.map((m) => ({
                  value: m.id,
                  label: m.name,
                  group: MATERIAL_TYPE_LABELS[type] ?? type,
                  sublabel: `Durability ${m.durability_score}/10`,
                })),
              )}
            />
          </Field>
        </div>
      </Section>

      <Section title="Dimensions">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="width" label="Width (in)" required>
            <Input
              id="width"
              type="number"
              inputMode="decimal"
              step="0.001"
              min="0.001"
              required
              value={widthInches}
              onChange={(e) => setWidthInches(e.target.value)}
              placeholder="3.000"
            />
          </Field>
          <Field id="height" label="Height (in)" required>
            <Input
              id="height"
              type="number"
              inputMode="decimal"
              step="0.001"
              min="0.001"
              required
              value={heightInches}
              onChange={(e) => setHeightInches(e.target.value)}
              placeholder="1.500"
            />
          </Field>
          <Field id="quantity" label="Quantity" required>
            <Input
              id="quantity"
              type="number"
              inputMode="numeric"
              step="1"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="500"
            />
          </Field>
        </div>
        {selectedProduct && quantity && quantityNum > 0 && quantityNum < selectedProduct.min_qty && (
          <p className="text-xs text-warning">
            Minimum order quantity for this product is {selectedProduct.min_qty}.
          </p>
        )}
      </Section>

      <Section title="Industry & certifications">
        <Field id="industry" label="Industry" required>
          <SearchableSelect
            ariaLabel="Industry"
            placeholder="Select an industry"
            searchPlaceholder="Search 8 industries…"
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

      {livePreview !== null && (
        <div className="rounded-md border border-accent/30 bg-accent/5 p-4">
          <p className="text-xs font-mono uppercase tracking-[0.16em] text-accent">
            Live base estimate (rule-based)
          </p>
          <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-text">
            {currency.format(livePreview)}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Includes setup fee + ({widthNum} × {heightNum} sq in × {quantityNum} units × {selectedIndustry?.certification_premium}× industry premium). The AI score and price band land on the quote detail page after submit.
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-lg font-semibold text-text">{title}</h2>
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
