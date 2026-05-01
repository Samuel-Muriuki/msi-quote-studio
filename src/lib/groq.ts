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

export type LineAnalyzeInput = {
  productName: string;
  productCategory: string;
  materialName: string;
  materialDurability: number;
  widthInches: number;
  heightInches: number;
  quantity: number;
  /** Optional CAD complexity hint: number of drawing elements in the SVG. */
  cadPathCount?: number | null;
  /** Optional original CAD filename — useful context for the rationale. */
  cadFilename?: string | null;
};

export type AnalyzeQuoteInput = {
  industryName: string;
  certifications: string[];
  baseEstimate: number;
  lines: LineAnalyzeInput[];
};

export type AnalyzeQuoteResult = {
  analysis: AIAnalysis;
  promptInputHash: string;
  modelUsed: string;
  latencyMs: number;
};

const SYSTEM_PROMPT = `You are an expert manufacturing estimator for a durable label and die-cut converting company that serves aerospace, medical, military, and industrial OEMs. You evaluate custom job specifications and return structured complexity assessments and price recommendations.

You are precise, calibrated, and honest about uncertainty. Your rationale is direct — no fluff, no marketing language. You write like an engineer talking to another engineer.

When a line includes a CAD path count, treat higher counts as a complexity signal: 1–10 paths is a simple shape, 10–50 is moderate, 50+ implies dense geometry that drives setup time and scrap risk.

Return JSON only, with no commentary outside the JSON.`;

function formatLine(line: LineAnalyzeInput, index: number): string {
  const lines: string[] = [];
  lines.push(`LINE ${index + 1}:`);
  lines.push(`  PRODUCT:  ${line.productName} (${line.productCategory})`);
  lines.push(`  MATERIAL: ${line.materialName} (durability ${line.materialDurability}/10)`);
  lines.push(`  SIZE:     ${line.widthInches}" × ${line.heightInches}"`);
  lines.push(`  QTY:      ${line.quantity}`);
  if (line.cadPathCount != null) {
    const tag = line.cadFilename ? ` (${line.cadFilename})` : "";
    lines.push(`  CAD:      ${line.cadPathCount} drawing element${line.cadPathCount === 1 ? "" : "s"}${tag}`);
  }
  return lines.join("\n");
}

function buildUserPrompt(input: AnalyzeQuoteInput): string {
  const linesBlock = input.lines.map(formatLine).join("\n\n");
  return `Evaluate this job (${input.lines.length} line${input.lines.length === 1 ? "" : "s"}):

${linesBlock}

INDUSTRY: ${input.industryName}
CERTIFICATIONS REQUIRED: ${input.certifications.length ? input.certifications.join(", ") : "none"}
RULE-BASED BASE ESTIMATE (sum of all lines): $${input.baseEstimate.toFixed(2)}

Return:
{
  "complexity_score": <integer 1-10, where 1=trivial and 10=highly complex; reflect the most complex line>,
  "suggested_price_low": <number, USD, total for the whole quote>,
  "suggested_price_high": <number, USD, total for the whole quote>,
  "rationale": "<2-3 sentences explaining what drives the complexity. If multiple lines, mention which line dominates. Reference CAD path count when relevant.>"
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

  if (!input.lines || input.lines.length === 0) {
    throw new Error("analyzeQuote requires at least one line");
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
