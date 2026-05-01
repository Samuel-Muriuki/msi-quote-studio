/**
 * Persona-driven autofill for the customer and new-quote forms.
 *
 * Picks a coherent persona at random — every value in the resulting form
 * matches every other (an Aerospace customer gets an Aerospace product on an
 * appropriate substrate at a plausible run size). New persona → new draft on
 * every click, but never an Acme/Boeing-with-medical-substrate frankenquote.
 */

export type ProductSeed = {
  id: string;
  category: string;
  min_qty: number;
};

export type MaterialSeed = {
  id: string;
  type: string;
};

export type CustomerSeed = {
  /** Display name shown in the Customer name field. */
  name: string;
  /** Local part of the email (the bit before @). */
  emailLocal: string;
  /** Full domain — uses .example so we never collide with real inboxes. */
  emailDomain: string;
  /** Company field on the customer form. */
  company: string;
  /** US-format phone number. */
  phone: string;
  /** Standing-terms note for the customer. */
  notes: string;
  /** Industry name as seeded in the catalog (must match exactly). */
  industryName: string;
};

export type LineSeed = {
  /** Catalog category to pick a product from. */
  productCategory: string;
  /** Catalog material type to pick a substrate from. */
  materialType: string;
  /** Inclusive [min, max] width in inches. */
  widthRange: [number, number];
  /** Inclusive [min, max] height in inches. */
  heightRange: [number, number];
  /** Inclusive [min, max] quantity in pieces. */
  qtyRange: [number, number];
};

export type QuotePersona = {
  customer: CustomerSeed;
  /** Free-text note that lands on the quote's notes field. */
  notes: string;
  /** One or more lines for the quote. The form will show each as a card. */
  lines: LineSeed[];
};

const CUSTOMERS: CustomerSeed[] = [
  {
    name: "Boeing Commercial Airplanes",
    emailLocal: "procurement",
    emailDomain: "boeing.example",
    company: "Boeing Commercial Airplanes — Renton",
    phone: "+1 (425) 555-0142",
    notes: "AS9100 required on every job. Drop-ship to KBFI receiving dock 4.",
    industryName: "Aerospace",
  },
  {
    name: "Medtronic Cardiac Rhythm",
    emailLocal: "rfq",
    emailDomain: "medtronic.example",
    company: "Medtronic Cardiac Rhythm Management",
    phone: "+1 (763) 555-0177",
    notes: "ISO 13485 + UDI compliance on every label. Lot-traceable packaging.",
    industryName: "Medical",
  },
  {
    name: "Raytheon Missiles & Defense",
    emailLocal: "supplier-portal",
    emailDomain: "raytheon.example",
    company: "Raytheon Missiles & Defense — Tucson",
    phone: "+1 (520) 555-0118",
    notes: "ITAR-controlled. Use approved substrate list only. CoC with every shipment.",
    industryName: "Military & Government",
  },
  {
    name: "Schlumberger Drilling",
    emailLocal: "downhole-procurement",
    emailDomain: "slb.example",
    company: "Schlumberger Limited — Houston operations",
    phone: "+1 (713) 555-0193",
    notes: "Downhole tags rated 175 °C / 20 kpsi. Test report required per lot.",
    industryName: "Oil & Gas",
  },
  {
    name: "Cisco Systems",
    emailLocal: "hardware-rfq",
    emailDomain: "cisco.example",
    company: "Cisco Systems — Catalyst BU",
    phone: "+1 (408) 555-0125",
    notes: "Front-panel overlays for Catalyst 9300 series. UL 94 V-0 substrate.",
    industryName: "Telecommunications",
  },
  {
    name: "Tyson Foods Industrial",
    emailLocal: "packaging",
    emailDomain: "tyson.example",
    company: "Tyson Foods — Springdale plant",
    phone: "+1 (479) 555-0166",
    notes: "USDA-compliant materials. Wash-down rated, indirect-food-contact OK.",
    industryName: "Food & Beverage",
  },
  {
    name: "Pentair Aquatic Eco-Systems",
    emailLocal: "industrial-procurement",
    emailDomain: "pentair.example",
    company: "Pentair — Sanford operations",
    phone: "+1 (407) 555-0184",
    notes: "Marine-grade, UV-stable. Outdoor-rated adhesive on every overlay.",
    industryName: "Marine",
  },
  {
    name: "Honeywell Process Solutions",
    emailLocal: "control-systems-procurement",
    emailDomain: "honeywell.example",
    company: "Honeywell — Houston refinery automation",
    phone: "+1 (713) 555-0150",
    notes: "Class I Div 2 hazardous location rated. Anti-static substrate preferred.",
    industryName: "Industrial",
  },
];

const QUOTE_PERSONAS: QuotePersona[] = [
  {
    customer: CUSTOMERS[0]!,
    notes: "Cabin nameplate run for 787-9 update. Need certs of conformance per ATA 100.",
    lines: [
      {
        productCategory: "nameplate",
        materialType: "substrate",
        widthRange: [3, 6],
        heightRange: [1, 2.5],
        qtyRange: [2000, 5000],
      },
    ],
  },
  {
    customer: CUSTOMERS[1]!,
    notes: "Pacemaker programmer overlay refresh. UDI bar code etched, not printed.",
    lines: [
      {
        productCategory: "overlay",
        materialType: "overlaminate",
        widthRange: [2, 4],
        heightRange: [1, 2],
        qtyRange: [5000, 15000],
      },
      {
        productCategory: "info_label",
        materialType: "adhesive",
        widthRange: [0.75, 1.5],
        heightRange: [0.5, 1],
        qtyRange: [10000, 25000],
      },
    ],
  },
  {
    customer: CUSTOMERS[2]!,
    notes: "Patriot launcher panel refresh. ITAR receipt + DD250 with every pallet.",
    lines: [
      {
        productCategory: "nameplate",
        materialType: "substrate",
        widthRange: [4, 8],
        heightRange: [2, 4],
        qtyRange: [400, 1200],
      },
    ],
  },
  {
    customer: CUSTOMERS[3]!,
    notes: "Wireline tag run for Permian field service. Heat-cycled to 175 °C.",
    lines: [
      {
        productCategory: "nameplate",
        materialType: "substrate",
        widthRange: [1.5, 3],
        heightRange: [0.75, 2],
        qtyRange: [800, 2500],
      },
    ],
  },
  {
    customer: CUSTOMERS[4]!,
    notes: "Catalyst 9300 series front-panel overlay. UL 94 V-0 required.",
    lines: [
      {
        productCategory: "overlay",
        materialType: "overlaminate",
        widthRange: [6, 10],
        heightRange: [2, 4],
        qtyRange: [3000, 8000],
      },
      {
        productCategory: "membrane_switch",
        materialType: "substrate",
        widthRange: [3, 5],
        heightRange: [1, 2],
        qtyRange: [2000, 6000],
      },
    ],
  },
  {
    customer: CUSTOMERS[5]!,
    notes: "Springdale line 4 wash-down labels. USDA-compliant adhesive.",
    lines: [
      {
        productCategory: "info_label",
        materialType: "adhesive",
        widthRange: [2, 4],
        heightRange: [1, 2.5],
        qtyRange: [8000, 20000],
      },
    ],
  },
  {
    customer: CUSTOMERS[6]!,
    notes: "Pool-pump control panel overlays. Marine-grade UV-stable substrate.",
    lines: [
      {
        productCategory: "overlay",
        materialType: "overlaminate",
        widthRange: [4, 6],
        heightRange: [2, 3.5],
        qtyRange: [1500, 4000],
      },
    ],
  },
  {
    customer: CUSTOMERS[7]!,
    notes: "Refinery DCS rack labels. Anti-static substrate, Class I Div 2 rated.",
    lines: [
      {
        productCategory: "info_label",
        materialType: "substrate",
        widthRange: [2, 3.5],
        heightRange: [1, 1.75],
        qtyRange: [1500, 5000],
      },
      {
        productCategory: "die_cut_gasket",
        materialType: "adhesive",
        widthRange: [3, 5],
        heightRange: [3, 5],
        qtyRange: [600, 2000],
      },
    ],
  },
];

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomFloat(min: number, max: number, decimals = 3): number {
  const factor = 10 ** decimals;
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function customerEmail(seed: CustomerSeed): string {
  return `${seed.emailLocal}@${seed.emailDomain}`;
}

/**
 * Generate a randomized but coherent customer for the customer form.
 */
export function generateCustomerSeed(): {
  name: string;
  email: string;
  company: string;
  phone: string;
  notes: string;
} {
  const seed = pickRandom(CUSTOMERS);
  return {
    name: seed.name,
    email: customerEmail(seed),
    company: seed.company,
    phone: seed.phone,
    notes: seed.notes,
  };
}

/**
 * Pick a coherent quote persona — customer + matching industry + plausible
 * line items. The caller supplies the live catalog so we can resolve the
 * persona's category preferences to real product/material UUIDs.
 */
export function generateQuoteSeed(
  catalog: {
    products: ProductSeed[];
    materials: MaterialSeed[];
    industries: { id: string; name: string }[];
  },
): {
  customer: { name: string; email: string };
  industryId: string | null;
  notes: string;
  lines: Array<{
    productId: string;
    materialId: string;
    widthInches: string;
    heightInches: string;
    quantity: string;
  }>;
} | null {
  const persona = pickRandom(QUOTE_PERSONAS);

  const industry = catalog.industries.find((i) => i.name === persona.customer.industryName);
  if (!industry) return null;

  const lines = persona.lines
    .map((lineSeed) => {
      const products = catalog.products.filter((p) => p.category === lineSeed.productCategory);
      const materials = catalog.materials.filter((m) => m.type === lineSeed.materialType);
      if (products.length === 0 || materials.length === 0) return null;
      const product = pickRandom(products);
      const material = pickRandom(materials);
      const width = randomFloat(lineSeed.widthRange[0], lineSeed.widthRange[1]);
      const height = randomFloat(lineSeed.heightRange[0], lineSeed.heightRange[1]);
      // Round qty to a plausible factory-pack number (250 / 500 / 1000).
      const rawQty = randomInt(lineSeed.qtyRange[0], lineSeed.qtyRange[1]);
      const step = rawQty < 1000 ? 100 : rawQty < 5000 ? 250 : 500;
      const qty = Math.max(product.min_qty, Math.round(rawQty / step) * step);
      return {
        productId: product.id,
        materialId: material.id,
        widthInches: width.toFixed(3),
        heightInches: height.toFixed(3),
        quantity: String(qty),
      };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  if (lines.length === 0) return null;

  return {
    customer: { name: persona.customer.name, email: customerEmail(persona.customer) },
    industryId: industry.id,
    notes: persona.notes,
    lines,
  };
}
