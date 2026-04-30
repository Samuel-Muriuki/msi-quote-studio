import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

export type ModerationField = "customerName" | "customerEmail" | "notes";

export type ModerationResult =
  | { ok: true }
  | { ok: false; field: ModerationField; reason: string };

const FIELD_LABELS: Record<ModerationField, string> = {
  customerName: "customer name",
  customerEmail: "customer email",
  notes: "notes",
};

export function isProfane(text: string | null | undefined): boolean {
  if (!text) return false;
  return matcher.hasMatch(text);
}

export function moderateQuoteInputs(input: {
  customerName: string;
  customerEmail?: string | null;
  notes?: string | null;
}): ModerationResult {
  const fields: ModerationField[] = ["customerName", "customerEmail", "notes"];
  for (const field of fields) {
    const value = input[field];
    if (isProfane(value)) {
      return {
        ok: false,
        field,
        reason: `Please remove profanity from the ${FIELD_LABELS[field]} field.`,
      };
    }
  }
  return { ok: true };
}
