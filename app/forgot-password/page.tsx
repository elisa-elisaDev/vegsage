"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { useLocale } from "@/components/LocaleContext";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const { t } = useLocale();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : "/reset-password";

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (authError) {
      setError(t.auth.forgotPasswordError);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-gray-900">{t.auth.forgotPasswordTitle}</h1>
          {!sent && (
            <p className="text-sm text-gray-500 mt-2">{t.auth.forgotPasswordDesc}</p>
          )}
        </div>

        {sent ? (
          <div className="text-center">
            <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
              {t.auth.forgotPasswordSent}
            </p>
            <p className="text-center mt-6">
              <Link href="/login" className="text-sm text-brand-600 font-medium hover:underline">
                {t.auth.backToLogin}
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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
              {loading ? t.common.loading : t.auth.forgotPasswordCTA}
            </button>
          </form>
        )}

        <p className="text-center mt-4">
          <Link href="/login" className="text-xs text-gray-400 hover:text-gray-600">
            {t.auth.backToLogin}
          </Link>
        </p>
      </div>
    </div>
  );
}
