import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Supabase client for use in Server Components, Server Actions, and
 * Route Handlers. Reads/writes the auth session via cookies so the
 * user's identity travels securely with each request. Still uses the
 * anon key — RLS policies in Postgres enforce what this session can
 * actually access, never the application code.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from a Server Component where cookies
            // can't be mutated. Safe to ignore when middleware also
            // refreshes the session on every request.
          }
        },
      },
    }
  );
}
