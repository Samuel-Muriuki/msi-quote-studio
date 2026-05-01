"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { parseSvg } from "@/lib/svg-parse";
import { parseDxf } from "@/lib/dxf-parse";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const SVG_MIME = new Set(["image/svg+xml", "text/xml", "application/xml"]);
const DXF_MIME = new Set([
  "image/vnd.dxf",
  "application/dxf",
  "application/x-dxf",
  "application/acad",
  "drawing/x-dxf",
]);

export type CadUploadResult =
  | {
      ok: true;
      id: string;
      filename: string;
      widthInches: number;
      heightInches: number;
      pathCount: number;
    }
  | { ok: false; error: string };

/**
 * Accepts a single SVG file via FormData (key: "file"), parses it for
 * dimensions + path count, stores the original in the `cad-uploads`
 * bucket and persists the metadata row.
 *
 * Returns the extracted dimensions so the client can offer a "Use these
 * dimensions" button on the relevant line in the new-quote form.
 */
export async function uploadCadFileAction(formData: FormData): Promise<CadUploadResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { ok: false, error: "You must be signed in to upload CAD files." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file uploaded." };
  }

  if (file.size === 0) {
    return { ok: false, error: "Uploaded file is empty." };
  }
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Limit is 5 MB.`,
    };
  }

  const filename = file.name || "drawing";
  const isSvg = /\.svg$/i.test(filename) || SVG_MIME.has(file.type);
  const isDxf = /\.dxf$/i.test(filename) || DXF_MIME.has(file.type);

  if (!isSvg && !isDxf) {
    return {
      ok: false,
      error: "Only SVG and DXF files are supported (PDF coming later).",
    };
  }

  const text = await file.text();
  const parseResult = isSvg ? parseSvg(text) : parseDxf(text);
  if (!parseResult.ok) {
    return {
      ok: false,
      error: `${isSvg ? "SVG" : "DXF"} parse failed: ${parseResult.error}`,
    };
  }

  const storedMime = isSvg ? "image/svg+xml" : "application/dxf";
  const supabase = createServerSupabaseClient();
  const storagePath = `${session.user.id}/${crypto.randomUUID()}-${sanitizeFilename(filename)}`;

  const { error: uploadError } = await supabase.storage
    .from("cad-uploads")
    .upload(storagePath, text, {
      contentType: storedMime,
      upsert: false,
    });

  if (uploadError) {
    return { ok: false, error: `Storage upload failed: ${uploadError.message}` };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("cad_uploads")
    .insert({
      estimator_id: session.user.id,
      storage_path: storagePath,
      original_filename: filename,
      mime_type: storedMime,
      file_size_bytes: file.size,
      width_inches: parseResult.widthInches,
      height_inches: parseResult.heightInches,
      path_count: parseResult.pathCount,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    // Clean up the orphaned storage object so the bucket doesn't accumulate
    // ghost files when the metadata insert fails.
    await supabase.storage.from("cad-uploads").remove([storagePath]);
    return {
      ok: false,
      error: insertError?.message ?? "Failed to save upload metadata.",
    };
  }

  return {
    ok: true,
    id: inserted.id,
    filename,
    widthInches: parseResult.widthInches,
    heightInches: parseResult.heightInches,
    pathCount: parseResult.pathCount,
  };
}

function sanitizeFilename(name: string): string {
  // Strip path separators and collapse whitespace so the storage key stays clean.
  return name
    .replace(/[\\/]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_.\-]/g, "")
    .slice(0, 80);
}
