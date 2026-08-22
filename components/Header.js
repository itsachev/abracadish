"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";

// undefined = session not checked yet, null = signed out, object = signed in.
// This starts undefined on both server and client (getSession() is async),
// so there's no hydration mismatch to worry about here.
export default function Header() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const supabase = getSupabaseClient();

    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

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
          <span className="max-w-[9rem] truncate text-xs text-muted">{user.email}</span>
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
