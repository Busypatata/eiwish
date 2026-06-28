import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Admin client using the SERVICE ROLE key. This key bypasses Row Level
 * Security entirely, so it must NEVER be sent to the browser and must
 * NEVER be imported from a file that could end up in a client bundle.
 * The `server-only` import above causes a build error if that happens.
 *
 * Use this only for trusted server-side operations that intentionally
 * need to bypass RLS, e.g.:
 *  - Checking username availability before signup (across all users)
 *  - Admin/moderation tooling
 *  - Scheduled jobs / webhooks
 *
 * Every other read/write should go through the regular server or
 * browser client so RLS stays the single source of truth for access
 * control.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. This is required for admin operations and must only ever be configured as a server-side environment variable."
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
