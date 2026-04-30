/**
 * Seeds realistic sample quotes for the demo estimator account so the
 * dashboard / pipeline / reports surfaces all show meaningful data on a
 * 3-minute demo walkthrough. Idempotent — only runs if the demo user has
 * zero existing quotes.
 *
 * Usage:
 *   pnpm exec tsx --env-file=.env.local scripts/seed-demo-quotes.ts
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/supabase";
import { calculateBaseEstimate } from "../src/lib/estimator";

const DEMO_EMAIL = "demo@msi-quote-studio.com";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const supabase = createClient<Database>(
  env("NEXT_PUBLIC_SUPABASE_URL"),
  env("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } },
);

type SampleSpec = {
  customer_name: string;
  customer_email: string;
  product_category: string;
  material_type: string;
  industry_name: string;
  width: number;
  height: number;
  quantity: number;
  certifications: string[];
  notes: string | null;
  status: "draft" | "sent" | "accepted" | "declined";
  /** Days ago this quote was created (drives chart bucketing). */
  daysAgo: number;
  /** If true, fake an AI prediction on the quote. */
  withAi: boolean;
};

const SAMPLES: SampleSpec[] = [
  {
    customer_name: "Boeing Commercial Airplanes",
    customer_email: "procurement@boeing.example",
    product_category: "nameplate",
    material_type: "substrate",
    industry_name: "Aerospace",
    width: 4,
    height: 1.5,
    quantity: 2400,
    certifications: ["AS9100", "ITAR"],
    notes: "Production batch for the 787 cabin air management module — dual-language English/Spanish.",
    status: "accepted",
    daysAgo: 4,
    withAi: true,
  },
  {
    customer_name: "Medtronic Cardiac",
    customer_email: "rfq@medtronic.example",
    product_category: "info_label",
    material_type: "overlaminate",
    industry_name: "Medical",
    width: 2,
    height: 1,
    quantity: 18000,
    certifications: ["ISO 13485", "FDA"],
    notes: "Sterilisation-resistant labels for implantable defibrillator packaging.",
    status: "sent",
    daysAgo: 6,
    withAi: true,
  },
  {
    customer_name: "Raytheon Missiles & Defense",
    customer_email: "ka.purchasing@raytheon.example",
    product_category: "nameplate",
    material_type: "substrate",
    industry_name: "Military & Government",
    width: 3,
    height: 2,
    quantity: 850,
    certifications: ["MIL-SPEC", "ITAR"],
    notes: "MIL-STD-130 marking on stainless plates; will need inspection certificate.",
    status: "sent",
    daysAgo: 11,
    withAi: true,
  },
  {
    customer_name: "Schlumberger Drilling",
    customer_email: "mwd-procurement@slb.example",
    product_category: "thermal_management",
    material_type: "substrate",
    industry_name: "Oil & Gas",
    width: 6,
    height: 4,
    quantity: 320,
    certifications: ["API"],
    notes: "Thermal pads for downhole MWD electronics — 175°C operating spec.",
    status: "accepted",
    daysAgo: 18,
    withAi: true,
  },
  {
    customer_name: "Cisco Systems",
    customer_email: "hardware-rfq@cisco.example",
    product_category: "overlay",
    material_type: "overlaminate",
    industry_name: "Telecommunications",
    width: 8,
    height: 3,
    quantity: 4500,
    certifications: ["UL", "CSA"],
    notes: "Front-panel overlays for Catalyst 9300 series switches.",
    status: "draft",
    daysAgo: 1,
    withAi: false,
  },
  {
    customer_name: "Pentair Aquatic Eco-Systems",
    customer_email: "rfq@pentair.example",
    product_category: "info_label",
    material_type: "adhesive",
    industry_name: "Marine",
    width: 4,
    height: 2,
    quantity: 6000,
    certifications: ["USCG"],
    notes: "Compliance labels for marine pumps — must adhere to powder-coated steel.",
    status: "declined",
    daysAgo: 22,
    withAi: true,
  },
  {
    customer_name: "Tyson Foods Industrial",
    customer_email: "plant-eng@tyson.example",
    product_category: "info_label",
    material_type: "overlaminate",
    industry_name: "Food & Beverage",
    width: 3,
    height: 3,
    quantity: 12000,
    certifications: ["NSF"],
    notes: "Anti-microbial overlaminate for processing-line equipment ID.",
    status: "sent",
    daysAgo: 29,
    withAi: true,
  },
  {
    customer_name: "John Deere Construction",
    customer_email: "supplier-portal@deere.example",
    product_category: "nameplate",
    material_type: "substrate",
    industry_name: "Industrial / OEM",
    width: 5,
    height: 2.5,
    quantity: 1500,
    certifications: ["UL"],
    notes: "Aluminium serial plates for excavator boom sections.",
    status: "accepted",
    daysAgo: 38,
    withAi: true,
  },
  {
    customer_name: "Lockheed Martin Space",
    customer_email: "satcom-supply@lockheed.example",
    product_category: "emi_rfi",
    material_type: "substrate",
    industry_name: "Aerospace",
    width: 7,
    height: 5,
    quantity: 240,
    certifications: ["AS9100", "ITAR"],
    notes: "EMI shielding gaskets for satellite payload enclosures.",
    status: "sent",
    daysAgo: 47,
    withAi: true,
  },
  {
    customer_name: "Emerson Process Management",
    customer_email: "labels@emerson.example",
    product_category: "membrane_switch",
    material_type: "overlaminate",
    industry_name: "Industrial / OEM",
    width: 4,
    height: 6,
    quantity: 800,
    certifications: ["UL"],
    notes: "4-button membrane switches for DCS field controllers.",
    status: "accepted",
    daysAgo: 62,
    withAi: true,
  },
  {
    customer_name: "Nordson EFD",
    customer_email: "rfq@nordson.example",
    product_category: "die_cut_gasket",
    material_type: "adhesive",
    industry_name: "Industrial / OEM",
    width: 2.5,
    height: 2.5,
    quantity: 3500,
    certifications: ["UL"],
    notes: "Die-cut sealing gaskets for fluid-dispensing modules.",
    status: "draft",
    daysAgo: 78,
    withAi: false,
  },
];

function fakeAiPrediction(baseEstimate: number) {
  // Plausible complexity 5..9 based on quantity and area; deterministic-ish
  const complexity = 5 + Math.floor(Math.random() * 5);
  const lowFactor = 0.85 + Math.random() * 0.07; // 0.85..0.92
  const highFactor = 1.08 + Math.random() * 0.12; // 1.08..1.20
  const low = Math.round(baseEstimate * lowFactor);
  const high = Math.round(baseEstimate * highFactor);
  return { complexity, low, high };
}

function rationale(spec: SampleSpec, complexity: number) {
  return [
    `Complexity ${complexity}/10 reflects ${spec.industry_name} certification requirements and the ${spec.quantity.toLocaleString()}-piece run size.`,
    spec.certifications.length > 0
      ? `Required certifications (${spec.certifications.join(", ")}) drive documentation overhead.`
      : `No special certifications required, keeping process risk low.`,
    `Suggested price band reflects standard markup on the rule-based estimate plus a ${complexity > 7 ? "premium" : "modest"} risk allowance.`,
  ].join(" ");
}

async function main() {
  // Look up demo user
  const { data: user, error: userError } = await supabase
    .from("user")
    .select("id")
    .eq("email", DEMO_EMAIL)
    .single();
  if (userError || !user) {
    console.error(`❌ Demo user not found (${DEMO_EMAIL}). Run seed-demo-user.ts first.`);
    process.exit(1);
  }
  const estimatorId = user.id;

  // Idempotency check
  const { count, error: countError } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .eq("estimator_id", estimatorId);
  if (countError) throw countError;
  if ((count ?? 0) > 0) {
    console.log(`ℹ️  Demo user already has ${count} quotes; skipping seed.`);
    return;
  }

  // Fetch catalog
  const [productsRes, materialsRes, industriesRes] = await Promise.all([
    supabase.from("products").select("id, category, name, base_price_per_sq_in, setup_fee, min_qty").eq("active", true),
    supabase.from("materials").select("id, type, name").eq("active", true),
    supabase.from("industries").select("id, name, certification_premium"),
  ]);
  if (productsRes.error) throw productsRes.error;
  if (materialsRes.error) throw materialsRes.error;
  if (industriesRes.error) throw industriesRes.error;
  const products = productsRes.data!;
  const materials = materialsRes.data!;
  const industries = industriesRes.data!;

  function pickProduct(category: string) {
    const matches = products.filter((p) => p.category === category);
    return matches[Math.floor(Math.random() * Math.max(matches.length, 1))];
  }
  function pickMaterial(type: string) {
    const matches = materials.filter((m) => m.type === type);
    return matches[Math.floor(Math.random() * Math.max(matches.length, 1))];
  }
  function findIndustry(name: string) {
    return industries.find((i) => i.name === name);
  }

  const rows = SAMPLES.map((spec) => {
    const product = pickProduct(spec.product_category);
    const material = pickMaterial(spec.material_type);
    const industry = findIndustry(spec.industry_name);
    if (!product || !material || !industry) {
      throw new Error(
        `Could not resolve catalog: product=${spec.product_category} material=${spec.material_type} industry=${spec.industry_name}`,
      );
    }
    const baseEstimate = calculateBaseEstimate({
      basePricePerSqIn: Number(product.base_price_per_sq_in),
      setupFee: Number(product.setup_fee),
      widthInches: spec.width,
      heightInches: spec.height,
      quantity: spec.quantity,
      certificationPremium: Number(industry.certification_premium),
    });
    const created = new Date(Date.now() - spec.daysAgo * 24 * 60 * 60 * 1000);
    let ai_complexity_score: number | null = null;
    let ai_suggested_price_low: number | null = null;
    let ai_suggested_price_high: number | null = null;
    let ai_rationale: string | null = null;
    if (spec.withAi) {
      const ai = fakeAiPrediction(baseEstimate);
      ai_complexity_score = ai.complexity;
      ai_suggested_price_low = ai.low;
      ai_suggested_price_high = ai.high;
      ai_rationale = rationale(spec, ai.complexity);
    }
    return {
      customer_name: spec.customer_name,
      customer_email: spec.customer_email,
      product_id: product.id,
      material_id: material.id,
      industry_id: industry.id,
      width_inches: spec.width,
      height_inches: spec.height,
      quantity: spec.quantity,
      certifications: spec.certifications,
      notes: spec.notes,
      status: spec.status,
      base_estimate: baseEstimate,
      final_price: spec.status === "accepted" ? baseEstimate : null,
      ai_complexity_score,
      ai_suggested_price_low,
      ai_suggested_price_high,
      ai_rationale,
      estimator_id: estimatorId,
      created_at: created.toISOString(),
      updated_at: created.toISOString(),
    };
  });

  const { data: inserted, error: insertError } = await supabase
    .from("quotes")
    .insert(rows)
    .select("id");
  if (insertError) throw insertError;

  console.log(`✅ Seeded ${inserted?.length ?? 0} demo quotes for ${DEMO_EMAIL}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ seed-demo-quotes failed:", err);
    process.exit(1);
  });
