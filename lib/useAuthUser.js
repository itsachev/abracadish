"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

// undefined = session not checked yet, null = signed out, object = signed in.
// Starts undefined on both server and client (getSession() is async), so
// there's no hydration mismatch to worry about here.
export function useAuthUser() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let cancelled = false;

    // getSession() silently refreshes an expired access token before
    // resolving, and a single transient network hiccup during that refresh
    // (common enough on mobile) makes it report "no session" even though
    // the underlying session is fine — so a null result gets one
    // confirming retry before it's trusted as a real sign-out.
    async function resolveInitialUser() {
      let { data } = await supabase.auth.getSession();
      if (!data.session && !cancelled) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (cancelled) return;
        ({ data } = await supabase.auth.getSession());
      }
      if (!cancelled) setUser(data.session?.user ?? null);
    }

    resolveInitialUser();

    // INITIAL_SESSION is skipped here — resolveInitialUser() above already
    // covers that check, with the retry the raw event doesn't get — so
    // only real transitions (sign in/out, token refresh) come through.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" || cancelled) return;
      setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  return user;
}
