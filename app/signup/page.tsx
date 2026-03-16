"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { useLocale } from "@/components/LocaleContext";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLocale();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError(t.auth.errors.weakPassword);
      return;
    }
    setLoading(true);
    setError(null);

    // Use the configured app URL so the redirect is canonical across environments.
    // Points to the auth callback route which exchanges the PKCE code for a
    // session server-side, then redirects to /dashboard.
    const base =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      window.location.origin;

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${base}/auth/callback?next=/dashboard` },
    });

    if (authError) {
      if (authError.message.toLowerCase().includes("already")) {
        setError(t.auth.errors.emailTaken);
      } else {
        setError(t.auth.errors.generic);
      }
      setLoading(false);
      return;
    }

    // session is null when Supabase requires email confirmation
    if (!data.session) {
      setCheckEmail(true);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  }

  if (checkEmail) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4" aria-hidden="true">📬</p>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t.common.success}</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{t.auth.signupCheckEmail}</p>
          <p className="text-center mt-6">
            <Link href="/login" className="text-sm text-brand-600 font-medium hover:underline">
              {t.auth.backToLogin}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4" aria-hidden="true">✅</p>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t.common.success}</h2>
          <p className="text-sm text-gray-500">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-gray-900">{t.auth.signUpTitle}</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t.auth.emailLabel}
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {t.auth.passwordLabel}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                aria-label={showPwd ? t.auth.hidePassword : t.auth.showPassword}
                onClick={() => setShowPwd((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPwd ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Min. 8 characters.</p>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {loading ? t.common.loading : t.auth.signUpCTA}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          {t.auth.agreePrefix}{" "}
          <Link href="/legal/terms" className="underline">{t.auth.terms}</Link>{" "}
          {t.auth.and}{" "}
          <Link href="/legal/privacy" className="underline">{t.auth.privacy}</Link>
          {t.auth.agreeSuffix}
        </p>

        <p className="text-center text-sm text-gray-500 mt-4">
          {t.auth.alreadyHaveAccount}{" "}
          <Link href="/login" className="text-brand-600 font-medium hover:underline">
            {t.auth.signInCTA}
          </Link>
        </p>

        <p className="text-center mt-4">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
            {t.auth.backToHome}
          </Link>
        </p>
      </div>
    </div>
  );
}
