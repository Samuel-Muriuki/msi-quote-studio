import Groq from "groq-sdk";
import { z } from "zod";

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export type AIErrorCode =
  | "missing_api_key"
  | "auth"
  | "rate_limit"
  | "timeout"
  | "network"
  | "invalid_response"
  | "service_unavailable"
  | "validation"
  | "unknown";

export class AIError extends Error {
  readonly code: AIErrorCode;
  readonly status: number;
  readonly retryable: boolean;
  readonly userMessage: string;
  readonly retryAfterSeconds: number | null;

  constructor(opts: {
    code: AIErrorCode;
    message: string;
    userMessage: string;
    status: number;
    retryable: boolean;
    retryAfterSeconds?: number | null;
  }) {
    super(opts.message);
    this.name = "AIError";
    this.code = opts.code;
    this.userMessage = opts.userMessage;
    this.status = opts.status;
    this.retryable = opts.retryable;
    this.retryAfterSeconds = opts.retryAfterSeconds ?? null;
  }
}

function classifyGroqError(err: unknown): AIError {
  // Groq SDK throws errors that often have a status property and a message.
  type GroqLike = {
    status?: number;
    message?: string;
    headers?: { "retry-after"?: string };
    error?: { type?: string; message?: string };
  };
  const e = err as GroqLike;
  const status = typeof e?.status === "number" ? e.status : 0;
  const message = e?.message ?? (err instanceof Error ? err.message : String(err));
  const retryAfter = Number(e?.headers?.["retry-after"] ?? 0) || null;

  if (status === 401 || status === 403 || /unauthorized|invalid api key/i.test(message)) {
    return new AIError({
      code: "auth",
      message,
      userMessage:
        "Groq rejected the API key. Verify GROQ_API_KEY in the Vercel project settings and redeploy.",
      status: 502,
      retryable: false,
    });
  }
  if (status === 429 || /rate limit|too many requests/i.test(message)) {
    const wait = retryAfter ? ` Try again in about ${retryAfter}s.` : " Try again in a moment.";
    return new AIError({
      code: "rate_limit",
      message,
      userMessage: `Groq's free tier rate limit is throttling this request.${wait}`,
      status: 429,
      retryable: true,
      retryAfterSeconds: retryAfter,
    });
  }
  if (status === 503 || status === 502 || /service unavailable|temporarily/i.test(message)) {
    return new AIError({
      code: "service_unavailable",
      message,
      userMessage: "Groq is having a moment — service unavailable. Please retry shortly.",
      status: 503,
      retryable: true,
    });
  }
  if (/timeout|timed out|aborted/i.test(message)) {
    return new AIError({
      code: "timeout",
      message,
      userMessage: "The request to Groq timed out before a response arrived. Please retry.",
      status: 504,
      retryable: true,
    });
  }
  if (/fetch|network|enotfound|econnrefused/i.test(message)) {
    return new AIError({
      code: "network",
      message,
      userMessage: "Couldn't reach Groq from the server. Check connectivity and retry.",
      status: 502,
      retryable: true,
    });
  }
  return new AIError({
    code: "unknown",
    message,
    userMessage: "AI analysis failed unexpectedly. Try again — if it keeps failing, check the server logs.",
    status: 502,
    retryable: true,
  });
}

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
    throw new AIError({
      code: "missing_api_key",
      message: "GROQ_API_KEY env var is not set",
      userMessage:
        "Groq isn't configured on the server. Set GROQ_API_KEY in the Vercel project settings and redeploy.",
      status: 503,
      retryable: false,
    });
  }

  if (!input.lines || input.lines.length === 0) {
    throw new AIError({
      code: "validation",
      message: "analyzeQuote requires at least one line",
      userMessage: "This quote has no line items, so there's nothing to analyze.",
      status: 422,
      retryable: false,
    });
  }

  const model = options?.model ?? DEFAULT_MODEL;
  const userPrompt = buildUserPrompt(input);
  const promptInputHash = await sha256Hex(JSON.stringify(input));

  const groq = new Groq({ apiKey });
  const startedAt = Date.now();

  let completion;
  try {
    completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 600,
    });
  } catch (err) {
    throw classifyGroqError(err);
  }

  const latencyMs = Date.now() - startedAt;
  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new AIError({
      code: "invalid_response",
      message: "Groq returned an empty response",
      userMessage:
        "The model returned an empty response. This is rare — please retry.",
      status: 502,
      retryable: true,
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AIError({
      code: "invalid_response",
      message: `Groq response was not valid JSON: ${raw.slice(0, 200)}`,
      userMessage:
        "The model returned malformed JSON. Retry, or switch to a smaller model if this keeps happening.",
      status: 502,
      retryable: true,
    });
  }

  const result = aiAnalysisSchema.safeParse(parsed);
  if (!result.success) {
    throw new AIError({
      code: "invalid_response",
      message: `Groq response failed schema validation: ${result.error.message}`,
      userMessage:
        "The model's response didn't match the expected shape. Retry — usually a one-off.",
      status: 502,
      retryable: true,
    });
  }

  if (result.data.suggested_price_low > result.data.suggested_price_high) {
    throw new AIError({
      code: "invalid_response",
      message: `Groq returned suggested_price_low > suggested_price_high (${result.data.suggested_price_low} > ${result.data.suggested_price_high})`,
      userMessage:
        "The model returned an inverted price range. Retry — usually a one-off.",
      status: 502,
      retryable: true,
    });
  }

  return {
    analysis: result.data,
    promptInputHash,
    modelUsed: model,
    latencyMs,
  };
}
