/**
 * Lightweight SVG metadata extractor for the CAD upload flow.
 *
 * Pure-function: takes the raw SVG text, returns the bounding box in
 * inches and a count of drawing elements as a complexity hint. No DOM
 * required — the parser operates on regex against the root <svg> tag's
 * attributes and a tag-counter for shapes. That's enough for the demo
 * since we just need the overall size and a "how busy is this drawing"
 * scalar; precise geometry can land in a follow-up.
 */

export type SvgParseResult =
  | {
      ok: true;
      widthInches: number;
      heightInches: number;
      pathCount: number;
    }
  | { ok: false; error: string };

const UNIT_TO_INCHES: Record<string, number> = {
  in: 1,
  mm: 0.0393701,
  cm: 0.393701,
  pt: 1 / 72,
  pc: 12 / 72,
  px: 1 / 96, // CSS reference: 96px = 1in
  // bare numbers are treated as user units; SVG default = px
  "": 1 / 96,
};

const SHAPE_TAGS = ["path", "line", "circle", "rect", "polygon", "polyline", "ellipse"];

function parseLength(raw: string): number | null {
  const match = raw.trim().match(/^([0-9]*\.?[0-9]+)\s*([a-z%]*)$/i);
  if (!match) return null;
  const value = Number(match[1]);
  const unit = (match[2] ?? "").toLowerCase();
  if (!Number.isFinite(value)) return null;
  const factor = UNIT_TO_INCHES[unit];
  if (factor === undefined) return null;
  return value * factor;
}

function getRootSvgAttrs(svg: string): Record<string, string> | null {
  // Strip leading XML / DOCTYPE declarations. Match the first <svg ...> tag.
  const match = svg.match(/<svg\b([^>]*)>/i);
  if (!match) return null;
  const attrString = match[1] ?? "";
  const attrs: Record<string, string> = {};
  const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"|([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*'([^']*)'/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(attrString)) !== null) {
    const name = (m[1] ?? m[3] ?? "").toLowerCase();
    const value = m[2] ?? m[4] ?? "";
    if (name) attrs[name] = value;
  }
  return attrs;
}

function parseViewBox(raw: string | undefined): { width: number; height: number } | null {
  if (!raw) return null;
  // viewBox = "min-x min-y width height" (whitespace or commas)
  const parts = raw.trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  const [, , width, height] = parts;
  if (width === undefined || height === undefined || width <= 0 || height <= 0) return null;
  return { width, height };
}

function countShapeTags(svg: string): number {
  let total = 0;
  for (const tag of SHAPE_TAGS) {
    const re = new RegExp(`<${tag}\\b`, "gi");
    const matches = svg.match(re);
    if (matches) total += matches.length;
  }
  return total;
}

export function parseSvg(svg: string): SvgParseResult {
  if (!svg || !svg.trim().startsWith("<")) {
    return { ok: false, error: "File does not look like SVG markup." };
  }

  const attrs = getRootSvgAttrs(svg);
  if (!attrs) {
    return { ok: false, error: "Could not find a root <svg> element." };
  }

  const explicitWidth = attrs.width ? parseLength(attrs.width) : null;
  const explicitHeight = attrs.height ? parseLength(attrs.height) : null;

  let widthInches = explicitWidth;
  let heightInches = explicitHeight;

  if (widthInches === null || heightInches === null) {
    const vb = parseViewBox(attrs.viewbox);
    if (!vb) {
      return {
        ok: false,
        error: "SVG is missing both width/height attributes and a usable viewBox.",
      };
    }
    // Fall back to viewBox values, treating user units as px (1/96 in).
    const vbFactor = UNIT_TO_INCHES.px;
    if (widthInches === null) widthInches = vb.width * vbFactor;
    if (heightInches === null) heightInches = vb.height * vbFactor;
  }

  if (
    widthInches === null ||
    heightInches === null ||
    widthInches <= 0 ||
    heightInches <= 0
  ) {
    return { ok: false, error: "Could not determine drawing dimensions." };
  }

  const pathCount = countShapeTags(svg);

  return {
    ok: true,
    widthInches: Math.round(widthInches * 1000) / 1000,
    heightInches: Math.round(heightInches * 1000) / 1000,
    pathCount,
  };
}
