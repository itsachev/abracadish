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

    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return user;
}
