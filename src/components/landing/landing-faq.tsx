"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "How is manufacturing cost per unit calculated?",
    a: "Cost per unit divides total manufacturing cost by the number of units produced. Total cost = direct materials + direct labor + manufacturing overhead + scrap & waste + energy + tooling. MSI Quote Studio computes this rule-based estimate, then runs an AI complexity score against your specs to suggest a calibrated price band.",
  },
  {
    q: "What does the AI complexity score actually mean?",
    a: "It is a 1–10 score where 1 is a trivial run (high volume, low certifications, common materials) and 10 is exotic (low volume, multi-cert, exotic substrates). The AI looks at your industry premium, certifications, dimensions, and quantity to land on the score. The rationale is plain English and stored in an audit log so you can review every prediction later.",
  },
  {
    q: "Why does scrap rate matter so much?",
    a: "Scrap is the silent margin killer. If a 4% scrap rate is hidden in your standard cost, every quote sells at a 4% lower margin than you think. Reducing scrap from 4% to 2% on a $400k monthly run recovers $96k a year. The reporting dashboard surfaces scrap as an explicit category so it stops hiding inside overhead.",
  },
  {
    q: "What's a good gross margin for manufacturing?",
    a: "According to IBISWorld and the U.S. Census Bureau, manufacturing gross margin typically ranges 25–35%. Pharmaceuticals and defense often run 40%+, while commodity industries like cement run 15–25%. Net operating margin (after all expenses) usually lands at 5–15%. MSI Quote Studio shows you where each quote sits relative to your industry benchmark on every detail page.",
  },
  {
    q: "How does the AI compare to a human estimator?",
    a: "Faster on the obvious (it can score 50 quotes in the time a senior estimator scores one) and trustworthy on the structured inputs we give it. It is NOT a replacement for tribal knowledge — every prediction is logged and your team can override or annotate. Over time, your overrides become training signal for sharper future predictions.",
  },
  {
    q: "Can I export quotes as branded PDFs?",
    a: "Yes — every quote has a Download PDF button that generates a brand-correct document with your company logo, line items, terms, and totals. Customers can also be emailed the PDF directly with a one-click approve link.",
  },
  {
    q: "Is my data isolated from other teams?",
    a: "Yes. Quotes, customers, AI predictions, and uploads are scoped per workspace via row-level security in Postgres. Workspace admins control role-based access (Owner / Admin / Estimator / Viewer). Audit logs capture every action with user, timestamp, and ref id.",
  },
  {
    q: "How do I get started?",
    a: "Click \"Sign in as demo\" on the sign-in page — a pre-seeded estimator account with realistic data lands you in the app instantly, no registration. When you're ready for your own data, create an account and the catalog seeds with the standard Marking Systems product list. From first sign-in to first AI-scored quote: under 90 seconds.",
  },
  {
    q: "What happens to data I enter via the demo account?",
    a: "Anything you create through the shared demo account from May 2nd, 2026 onwards is automatically swept after 48 hours by a daily cleanup job. The 11 curated sample quotes are tagged is_demo_sample=true and stay forever so the walkthrough is always populated. The same 48-hour window kicks in if the database grows beyond ~100 MB. Want persistent data? Create your own account — your workspace is isolated and never touched by the demo cleanup.",
  },
];

export function LandingFaq() {
  return (
    <Accordion className="w-full">
      {FAQ_ITEMS.map((item, i) => (
        <AccordionItem key={i} value={`faq-${i}`} className="border-border">
          <AccordionTrigger className="font-heading text-left text-base font-medium text-text hover:text-accent">
            {item.q}
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-text-secondary">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
