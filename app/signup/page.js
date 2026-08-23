"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password (min. 6 characters)"
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent/50 focus:outline-none"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="gradient-accent glow-accent w-full rounded-2xl py-3.5 text-base font-semibold text-white disabled:opacity-60"
        >
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
