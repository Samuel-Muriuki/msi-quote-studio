/**
 * DXF metadata extractor for the CAD upload flow.
 *
 * Wraps `dxf-parser` to compute the bounding box (in inches) and a count
 * of drawing entities — the same shape the SVG parser returns so the
 * upload action can dispatch on file type and downstream code stays
 * format-agnostic.
 *
 * Unit handling: the DXF $INSUNITS header tells us what units the
 * coordinates are in. We translate to inches.
 */

import DxfParser from "dxf-parser";

export type DxfParseResult =
  | {
      ok: true;
      widthInches: number;
      heightInches: number;
      pathCount: number;
    }
  | { ok: false; error: string };

// AutoCAD $INSUNITS code → inches multiplier.
// Reference: https://help.autodesk.com/view/OARX/2024/ENU/?guid=GUID-A6D52F86-9F95-4D63-8853-4DAD3CFB4B9E
const UNIT_TO_INCHES: Record<number, number> = {
  0: 1, // Unitless — assume drawing already in inches (best guess)
  1: 1, // Inches
  2: 12, // Feet
  3: 63360, // Miles
  4: 0.0393701, // Millimeters
  5: 0.393701, // Centimeters
  6: 39.3701, // Meters
  7: 39370.1, // Kilometers
  8: 0.0000393701, // Microinches
  9: 0.001, // Mils
  10: 36, // Yards
  11: 3.93701e-7, // Angstroms
  12: 3.93701e-8, // Nanometers
  13: 3.93701e-5, // Microns
  14: 3.93701, // Decimeters
  15: 393.701, // Decameters
  16: 3937.01, // Hectometers
  17: 3.93701e10, // Gigameters
  18: 5.84e12, // Astronomical units (silly to support but cheap)
  19: 3.7e17, // Light years
  20: 1.2e18, // Parsecs
};

type Vec = { x: number; y: number };

interface DxfEntityLike {
  type?: string;
  vertices?: Vec[];
  center?: Vec;
  radius?: number;
  position?: Vec;
  startPoint?: Vec;
  endPoint?: Vec;
  controlPoints?: Vec[];
}

function* extractPoints(entity: DxfEntityLike): Generator<Vec> {
  // Common per-entity-type point sources. dxf-parser normalises most
  // entities into a `vertices` array; everything else we crack open
  // explicitly with the bits we care about.
  if (Array.isArray(entity.vertices)) {
    for (const v of entity.vertices) {
      if (Number.isFinite(v?.x) && Number.isFinite(v?.y)) yield { x: v.x, y: v.y };
    }
  }
  if (entity.center && Number.isFinite(entity.center.x) && Number.isFinite(entity.center.y)) {
    const r = Number.isFinite(entity.radius) ? Number(entity.radius) : 0;
    yield { x: entity.center.x - r, y: entity.center.y - r };
    yield { x: entity.center.x + r, y: entity.center.y + r };
  }
  if (entity.position && Number.isFinite(entity.position.x) && Number.isFinite(entity.position.y)) {
    yield { x: entity.position.x, y: entity.position.y };
  }
  if (entity.startPoint) yield { x: entity.startPoint.x, y: entity.startPoint.y };
  if (entity.endPoint) yield { x: entity.endPoint.x, y: entity.endPoint.y };
  if (Array.isArray(entity.controlPoints)) {
    for (const v of entity.controlPoints) {
      if (Number.isFinite(v?.x) && Number.isFinite(v?.y)) yield { x: v.x, y: v.y };
    }
  }
}

export function parseDxf(text: string): DxfParseResult {
  if (!text || !/\b(SECTION|EOF)\b/.test(text.slice(0, 4096))) {
    return { ok: false, error: "File does not look like a DXF (no SECTION/EOF tokens found)." };
  }

  const parser = new DxfParser();
  let dxf;
  try {
    dxf = parser.parseSync(text);
  } catch (err) {
    return {
      ok: false,
      error: `DXF parse failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (!dxf || !Array.isArray(dxf.entities) || dxf.entities.length === 0) {
    return { ok: false, error: "DXF contained no drawing entities." };
  }

  // Determine unit. dxf-parser exposes header values keyed by the AutoCAD
  // header variable name (e.g. $INSUNITS).
  const insunits = Number(dxf.header?.$INSUNITS ?? 0);
  const unitFactor = UNIT_TO_INCHES[insunits] ?? 1;

  // Compute bounding box across every point we can extract.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let pathCount = 0;

  for (const entity of dxf.entities as DxfEntityLike[]) {
    if (entity?.type) pathCount += 1;
    for (const point of extractPoints(entity)) {
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
    }
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return { ok: false, error: "Could not compute a bounding box from the DXF entities." };
  }

  const widthIn = (maxX - minX) * unitFactor;
  const heightIn = (maxY - minY) * unitFactor;

  if (widthIn <= 0 || heightIn <= 0) {
    return { ok: false, error: "DXF bounding box is zero or negative." };
  }

  return {
    ok: true,
    widthInches: Math.round(widthIn * 1000) / 1000,
    heightInches: Math.round(heightIn * 1000) / 1000,
    pathCount,
  };
}
