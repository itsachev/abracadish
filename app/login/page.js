"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    // Signs in server-side so the session cookie arrives via the response's
    // Set-Cookie header instead of a client-side document.cookie write —
    // some mobile browsers silently drop the latter while still honoring
    // server-set cookies. A hard navigation (not router.push) ensures the
    // browser client re-reads that cookie fresh on load.
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setLoading(false);
      setError(body?.error ?? "Couldn't sign in. Please try again.");
      return;
    }
    // Hard navigation, not router.push: the browser client never itself
    // called signIn (the server route did), so it has no reason to re-read
    // the now-present session cookie without a fresh page load.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/";
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-10">
      <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">Sign in</h1>
      <p className="mt-1 text-sm text-muted">Sign in to save and revisit your scan history.</p>

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
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
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
              <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-accent underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
