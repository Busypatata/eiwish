import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Supabase client for use in Client Components ("use client").
 * Uses the public anon key only — safe to expose to the browser.
 * All data access is still gated by Row Level Security policies
 * defined in the database, so this client can never read or write
 * data the signed-in user isn't authorized to touch.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
