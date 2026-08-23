"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

// TEMPORARY diagnostic overlay for the "logged out on refresh" bug — shows
// exactly what the browser has (cookies) vs what the client resolves
// (session), so a phone screenshot tells us which layer is failing instead
// of guessing blind. Remove once the bug is confirmed fixed.
export default function AuthDebug() {
  const [info, setInfo] = useState(null);

  async function check() {
    const cookieNames = document.cookie
      .split(";")
      .map((c) => c.trim().split("=")[0])
      .filter((name) => name.startsWith("sb-"));

    const supabase = getSupabaseClient();
    const startedAt = Date.now();
    let session = null;
    let error = null;
    try {
      const { data, error: err } = await supabase.auth.getSession();
      session = data.session;
      error = err;
    } catch (err) {
      error = err;
    }
    const elapsedMs = Date.now() - startedAt;

    setInfo({
      time: new Date().toLocaleTimeString(),
      cookieNames,
      hasSession: !!session,
      email: session?.user?.email ?? null,
      expiresAt: session?.expires_at
        ? new Date(session.expires_at * 1000).toLocaleTimeString()
        : null,
      error: error?.message ?? null,
      elapsedMs,
    });
  }

  useEffect(() => {
    check();
  }, []);

  if (!info) return null;

  return (
    <div className="fixed bottom-20 left-2 right-2 z-[999] rounded-xl border border-yellow-500/50 bg-black/90 p-3 font-mono text-[10px] leading-relaxed text-yellow-300 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="font-bold">AUTH DEBUG</span>
        <button type="button" onClick={check} className="rounded bg-yellow-500/20 px-2 py-0.5 text-yellow-200">
          recheck
        </button>
      </div>
      <div>checked: {info.time} ({info.elapsedMs}ms)</div>
      <div>cookies found: {info.cookieNames.length === 0 ? "NONE" : info.cookieNames.join(", ")}</div>
      <div>session: {info.hasSession ? `YES (${info.email})` : "NO"}</div>
      {info.expiresAt && <div>token expires: {info.expiresAt}</div>}
      {info.error && <div className="text-red-400">error: {info.error}</div>}
    </div>
  );
}
