import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEMO_EMAIL = "demo@msi-quote-studio.com";
// 48-hour rolling window. Anything created via the shared demo account
// older than this is swept (sample seeds are protected by is_demo_sample).
// Same window applies if the database grows beyond ~100 MB — the public
// disclosure is in the landing FAQ.
const RETENTION_HOURS = 48;

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

  const cutoff = new Date(Date.now() - RETENTION_HOURS * 60 * 60 * 1000).toISOString();

  const [quotesRes, customersRes] = await Promise.all([
    supabase
      .from("quotes")
      .delete()
      .eq("estimator_id", demoUser.id)
      .eq("is_demo_sample", false)
      .lt("created_at", cutoff)
      .select("id"),
    supabase
      .from("customers")
      .delete()
      .eq("estimator_id", demoUser.id)
      .eq("is_demo_sample", false)
      .lt("created_at", cutoff)
      .select("id"),
  ]);

  if (quotesRes.error || customersRes.error) {
    return NextResponse.json(
      {
        ok: false,
        error: quotesRes.error?.message ?? customersRes.error?.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    deleted_quotes: quotesRes.data?.length ?? 0,
    deleted_customers: customersRes.data?.length ?? 0,
    cutoff,
    retention_hours: RETENTION_HOURS,
  });
}
