"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useAuthUser } from "@/lib/useAuthUser";
import { getSavedIdsSnapshot, subscribeToSavedChanges } from "@/lib/savedRecipes";
import { getCookedIdsSnapshot, subscribeToCookedChanges } from "@/lib/cookedRecipes";
import { getScansForUser } from "@/lib/scans";

const EMPTY = [];

function CountBadge({ count }) {
  if (count === null) return null;
  return (
    <span className="rounded-full bg-accent-soft px-2.5 py-1 font-mono text-xs font-semibold text-accent">
      {count}
    </span>
  );
}

export default function AccountPage() {
  const user = useAuthUser();
  const [signingOut, setSigningOut] = useState(false);
  const savedIds = useSyncExternalStore(subscribeToSavedChanges, getSavedIdsSnapshot, () => EMPTY);
  const cookedIds = useSyncExternalStore(subscribeToCookedChanges, getCookedIdsSnapshot, () => EMPTY);
  const [scanCount, setScanCount] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getScansForUser(user.id)
      .then((data) => {
        if (!cancelled) setScanCount(data.length);
      })
      .catch(() => {
        if (!cancelled) setScanCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const savedTotal = scanCount === null ? null : savedIds.length + scanCount;

  async function handleSignOut() {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    // Hard navigation, not router.push — see login/page.js for why.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/";
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
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Account</h1>

      <div className="mt-4 rounded-3xl border border-border bg-surface p-4">
        <p className="text-xs uppercase tracking-wide text-muted">Signed in as</p>
        <p className="mt-1 truncate text-sm font-medium text-foreground">{user.email}</p>
      </div>

      <div className="mt-4 space-y-3">
        <Link
          href="/saved"
          className="flex items-center justify-between rounded-3xl border border-border bg-surface p-4 text-sm font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-surface-hover"
        >
          Saved scans & recipes
          <span className="flex items-center gap-2">
            <CountBadge count={savedTotal} />
            <span className="text-muted">→</span>
          </span>
        </Link>
        <Link
          href="/cooked"
          className="flex items-center justify-between rounded-3xl border border-border bg-surface p-4 text-sm font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-surface-hover"
        >
          Cooked recipes
          <span className="flex items-center gap-2">
            <CountBadge count={cookedIds.length} />
            <span className="text-muted">→</span>
          </span>
        </Link>
        <Link
          href="/progress"
          className="flex items-center justify-between rounded-3xl border border-border bg-surface p-4 text-sm font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-surface-hover"
        >
          Progress
          <span className="text-muted">→</span>
        </Link>
        <Link
          href="/passport"
          className="flex items-center justify-between rounded-3xl border border-border bg-surface p-4 text-sm font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-surface-hover"
        >
          Dish passport
          <span className="text-muted">→</span>
        </Link>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="mt-8 flex w-full items-center justify-center gap-1.5 rounded-3xl border border-border py-3 text-sm font-semibold text-muted transition-colors hover:border-red-400/40 hover:text-red-600 disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path
            d="M9 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H9M16 15l4-3-4-3M9.5 12H20"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
