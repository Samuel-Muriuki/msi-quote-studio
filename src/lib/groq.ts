import Groq from "groq-sdk";
import { z } from "zod";

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

const aiAnalysisSchema = z.object({
  complexity_score: z.number().int().min(1).max(10),
  suggested_price_low: z.number().positive(),
  suggested_price_high: z.number().positive(),
  rationale: z.string().min(10).max(2000),
});

export type AIAnalysis = z.infer<typeof aiAnalysisSchema>;

export type AnalyzeQuoteInput = {
  productName: string;
  productCategory: string;
  materialName: string;
  materialDurability: number;
  widthInches: number;
  heightInches: number;
  quantity: number;
  industryName: string;
  certifications: string[];
  baseEstimate: number;
};

export type AnalyzeQuoteResult = {
  analysis: AIAnalysis;
  promptInputHash: string;
  modelUsed: string;
  latencyMs: number;
};

const SYSTEM_PROMPT = `You are an expert manufacturing estimator for a durable label and die-cut converting company that serves aerospace, medical, military, and industrial OEMs. You evaluate custom job specifications and return structured complexity assessments and price recommendations.

You are precise, calibrated, and honest about uncertainty. Your rationale is direct — no fluff, no marketing language. You write like an engineer talking to another engineer.

Return JSON only, with no commentary outside the JSON.`;

function buildUserPrompt(input: AnalyzeQuoteInput): string {
  return `Evaluate this job:

PRODUCT: ${input.productName} (${input.productCategory})
MATERIAL: ${input.materialName} (durability ${input.materialDurability}/10)
DIMENSIONS: ${input.widthInches}" × ${input.heightInches}"
QUANTITY: ${input.quantity}
INDUSTRY: ${input.industryName}
CERTIFICATIONS REQUIRED: ${input.certifications.length ? input.certifications.join(", ") : "none"}
RULE-BASED BASE ESTIMATE: $${input.baseEstimate.toFixed(2)}

Return:
{
  "complexity_score": <integer 1-10, where 1=trivial and 10=highly complex>,
  "suggested_price_low": <number, USD>,
  "suggested_price_high": <number, USD>,
  "rationale": "<2-3 sentences explaining what drives the complexity and why the price range differs (or doesn't) from the base estimate>"
}`;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function analyzeQuote(
  input: AnalyzeQuoteInput,
  options?: { model?: string },
): Promise<AnalyzeQuoteResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is required");
  }

  const model = options?.model ?? DEFAULT_MODEL;
  const userPrompt = buildUserPrompt(input);
  const promptInputHash = await sha256Hex(JSON.stringify(input));

  const groq = new Groq({ apiKey });
  const startedAt = Date.now();

  const completion = await groq.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 600,
  });

  const latencyMs = Date.now() - startedAt;
  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Groq returned an empty response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Groq response was not valid JSON: ${raw.slice(0, 200)}`);
  }

  const result = aiAnalysisSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Groq response failed schema validation: ${result.error.message}`,
    );
  }

  // Sanity check: low <= high
  if (result.data.suggested_price_low > result.data.suggested_price_high) {
    throw new Error(
      `Groq returned suggested_price_low > suggested_price_high (${result.data.suggested_price_low} > ${result.data.suggested_price_high})`,
    );
  }

  return {
    analysis: result.data,
    promptInputHash,
    modelUsed: model,
    latencyMs,
  };
}
