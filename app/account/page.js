"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthUser } from "@/lib/useAuthUser";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function AccountPage() {
  const router = useRouter();
  const user = useAuthUser();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await getSupabaseClient().auth.signOut();
    router.push("/");
  }

  if (user === undefined) {
    return (
      <div className="mx-auto max-w-md px-5 pt-6">
        <div className="h-8 w-40 animate-pulse rounded bg-surface" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-5 pt-10 text-center">
        <p className="text-sm text-muted">
          <Link href="/login" className="text-accent underline">
            Sign in
          </Link>{" "}
          to view your account.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Account</h1>
        <Link
          href="/scan"
          className="gradient-accent flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
            <rect x="3.5" y="6.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="2" />
          </svg>
          Scan a dish
        </Link>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
        <p className="text-xs uppercase tracking-wide text-muted">Signed in as</p>
        <p className="mt-1 truncate text-sm font-medium text-foreground">{user.email}</p>
      </div>

      <Link
        href="/saved"
        className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-surface p-4 text-sm font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-surface-hover"
      >
        Saved scans & recipes
        <span className="text-muted">→</span>
      </Link>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="mt-8 w-full rounded-2xl border border-border py-3 text-sm font-semibold text-muted transition-colors hover:border-red-400/40 hover:text-red-400 disabled:opacity-60"
      >
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
