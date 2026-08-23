"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signUpError } = await getSupabaseClient().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // Whether this returns a live session depends on the project's
    // "confirm email" setting in Supabase — with it on (the default),
    // there's no session until the user clicks the emailed link.
    if (data.session) {
      router.push("/");
      return;
    }
    setCheckEmail(true);
  }

  if (checkEmail) {
    return (
      <div className="mx-auto max-w-md px-5 pt-10 text-center">
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">Check your email</h1>
        <p className="mt-2 text-sm text-muted">
          We sent a confirmation link to <span className="text-foreground">{email}</span>. Click
          it to finish creating your account.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-10">
      <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">Create an account</h1>
      <p className="mt-1 text-sm text-muted">Save your scan history and revisit it anytime.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent/50 focus:outline-none"
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password (min. 6 characters)"
            className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 pr-11 text-sm text-foreground placeholder:text-muted focus:border-accent/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path
                  d="M3 3l18 18M10.6 10.6a2.5 2.5 0 0 0 3.4 3.4M6.7 6.7C4.5 8.2 3 10.5 3 12c0 2 4 7 9 7 1.7 0 3.2-.5 4.5-1.3M9.9 4.2A9.8 9.8 0 0 1 12 4c5 0 9 5 9 7 0 .8-.7 2.3-2 3.7"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path
                  d="M3 12c0-2 4-7 9-7s9 5 9 7-4 7-9 7-9-5-9-7Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            )}
          </button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="gradient-accent glow-accent flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-semibold text-white disabled:opacity-60"
        >
          {!loading && (
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
              <path
                d="M3.5 19c.7-3.2 3-4.8 5.5-4.8s4.8 1.6 5.5 4.8M18 8v6M15 11h6"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
