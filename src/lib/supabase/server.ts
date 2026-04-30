import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Server-only Supabase client with the service role key.
 *
 * NEVER import this from a client component or any file that ends up in the
 * browser bundle. The service role key bypasses RLS and must stay server-side.
 *
 * Use this in server components, server actions, and route handlers for any
 * read or write that needs to bypass RLS (admin operations, AI prediction
 * inserts, seed checks, etc.).
 */
export function createServerSupabaseClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
  }
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  }

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
