import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client — uses the anon key.
 * Call once and reuse (module-level singleton).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
