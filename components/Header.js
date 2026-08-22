"use client";

import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuthUser } from "@/lib/useAuthUser";

export default function Header() {
  const user = useAuthUser();

  async function handleSignOut() {
    await getSupabaseClient().auth.signOut();
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-5 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur-xl">
      <Link href="/" className="text-sm font-bold tracking-tight text-foreground">
        Abracadish
      </Link>

      {user === undefined ? (
        <div className="h-7 w-16" />
      ) : user ? (
        <div className="flex items-center gap-3">
          <span className="max-w-36 truncate text-xs text-muted">{user.email}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs font-medium text-muted hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-xs font-medium text-muted hover:text-foreground">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent"
          >
            Sign up
          </Link>
        </div>
      )}
    </header>
  );
}
