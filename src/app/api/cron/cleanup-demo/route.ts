import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEMO_EMAIL = "demo@msi-quote-studio.com";
const RETENTION_DAYS = 7;

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET is not configured." },
      { status: 500 },
    );
  }

  const provided = request.headers.get("authorization");
  if (provided !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  const { data: demoUser, error: userError } = await supabase
    .from("user")
    .select("id")
    .eq("email", DEMO_EMAIL)
    .maybeSingle();

  if (userError) {
    return NextResponse.json({ ok: false, error: userError.message }, { status: 500 });
  }
  if (!demoUser) {
    return NextResponse.json({ ok: true, deleted: 0, skipped: "no demo user" });
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: deleted, error: deleteError } = await supabase
    .from("quotes")
    .delete()
    .eq("estimator_id", demoUser.id)
    .eq("is_demo_sample", false)
    .lt("created_at", cutoff)
    .select("id");

  if (deleteError) {
    return NextResponse.json({ ok: false, error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    deleted: deleted?.length ?? 0,
    cutoff,
  });
}
