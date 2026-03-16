import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Supabase PKCE auth callback.
 *
 * Supabase sends all email links (signup confirmation, magic link) here
 * with a `?code=<pkce_code>` parameter. We exchange it for a session
 * server-side so the auth cookies are set before the middleware runs.
 *
 * After a successful exchange the user is redirected to `?next=` (default /dashboard).
 * On failure they land on /login with an error indicator.
 *
 * Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
 * must include this route for every environment:
 *   http://localhost:3000/auth/callback   ← local dev
 *   https://vegsage.com/auth/callback     ← production
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();

    // Build a server client without the try/catch suppression so any
    // cookie-write failure surfaces as a real error in the logs.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(
            cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>
          ) {
            cookiesToSet.forEach(({ name, value, options }) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              cookieStore.set(name, value, options as any)
            );
          },
        } as CookieMethodsServer,
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("[AuthCallback] exchangeCodeForSession failed:", error.message);
  }

  // Expired / missing code — send to login so the user can try again.
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
