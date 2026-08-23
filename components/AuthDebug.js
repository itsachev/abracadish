"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

// TEMPORARY diagnostic overlay for the "logged out on refresh" bug — shows
// exactly what the browser has (cookies) vs what the client resolves
// (session), a raw document.cookie write/read test, a live log of every
// auth event as it fires, and any uncaught JS errors — so watching this
// panel during an actual login pinpoints which step breaks instead of
// guessing blind. Remove once the bug is confirmed fixed.

const errorLog = [];
const eventLog = [];
const listeners = new Set();

function pushEvent(line) {
  eventLog.unshift(`${new Date().toLocaleTimeString()} ${line}`);
  eventLog.length = Math.min(eventLog.length, 12);
  listeners.forEach((fn) => fn());
}

if (typeof window !== "undefined" && !window.__authDebugHooked) {
  window.__authDebugHooked = true;

  window.addEventListener("error", (event) => {
    errorLog.unshift(`error: ${event.message}`);
    errorLog.length = Math.min(errorLog.length, 5);
    pushEvent(`JS error: ${event.message}`);
  });
  window.addEventListener("unhandledrejection", (event) => {
    const msg = event.reason?.message ?? String(event.reason);
    errorLog.unshift(`rejection: ${msg}`);
    errorLog.length = Math.min(errorLog.length, 5);
    pushEvent(`unhandled rejection: ${msg}`);
  });

  pushEvent("debug panel loaded");

  // Global, hooked once regardless of how many AuthDebug instances mount,
  // so every auth transition is logged in order from page load onward —
  // this is the trail that matters for watching a live login attempt.
  getSupabaseClient().auth.onAuthStateChange((event, session) => {
    pushEvent(`onAuthStateChange: ${event} session=${session ? `YES(${session.user.email})` : "NO"}`);
  });

  // Logs the raw response of every Supabase auth network call (sign in,
  // sign up, token refresh, etc.) — the wire-level ground truth of what the
  // server actually sent back, bypassing all of supabase-js's own
  // processing. Tokens are redacted to a length so nothing sensitive shows
  // on screen.
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const [input] = args;
    const url = typeof input === "string" ? input : (input?.url ?? "");
    const isAuthRequest = url.includes("/auth/v1/");
    if (!isAuthRequest) {
      return originalFetch(...args);
    }
    const label = url.split("?")[0].split("/").slice(-2).join("/");
    let response;
    try {
      response = await originalFetch(...args);
    } catch (err) {
      pushEvent(`fetch ${label} -> NETWORK ERROR: ${err.message}`);
      throw err;
    }
    response
      .clone()
      .text()
      .then((text) => {
        let summary;
        try {
          const json = JSON.parse(text);
          summary = JSON.stringify({
            ...json,
            access_token: json.access_token ? `<${json.access_token.length} chars>` : undefined,
            refresh_token: json.refresh_token ? `<${json.refresh_token.length} chars>` : undefined,
          });
        } catch {
          summary = text.slice(0, 300);
        }
        pushEvent(`fetch ${label} -> ${response.status}: ${summary.slice(0, 300)}`);
      })
      .catch(() => {});
    return response;
  };
}

export default function AuthDebug() {
  const [info, setInfo] = useState(null);
  const [, forceRerender] = useState(0);

  useEffect(() => {
    const listener = () => forceRerender((n) => n + 1);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  async function check() {
    // Ground-truth test: can this browser write+read a cookie via JS at
    // all, independent of Supabase's own cookie logic?
    const probeName = "authdebug_probe";
    document.cookie = `${probeName}=1; path=/; max-age=60; SameSite=Lax`;
    const probeWorks = document.cookie
      .split(";")
      .some((c) => c.trim().startsWith(`${probeName}=`));

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
      probeWorks,
      cookieNames,
      hasSession: !!session,
      email: session?.user?.email ?? null,
      expiresAt: session?.expires_at
        ? new Date(session.expires_at * 1000).toLocaleTimeString()
        : null,
      error: error?.message ?? null,
      elapsedMs,
    });
    pushEvent(`manual check: cookies=[${cookieNames.join(",") || "none"}] session=${!!session}`);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: this is a diagnostic panel that must reflect state as of mount/auth-events, not derive it
    check();
  }, []);

  if (!info) return null;

  return (
    <div className="fixed bottom-20 left-2 right-2 z-999 max-h-[55vh] overflow-y-auto rounded-xl border border-yellow-500/50 bg-black/90 p-3 font-mono text-[20px] leading-relaxed text-yellow-300 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="font-bold">AUTH DEBUG</span>
        <button type="button" onClick={check} className="rounded bg-yellow-500/20 px-2 py-0.5 text-yellow-200">
          recheck
        </button>
      </div>
      <div>checked: {info.time} ({info.elapsedMs}ms)</div>
      <div>raw cookie write/read test: {info.probeWorks ? "WORKS" : "FAILED"}</div>
      <div>sb-* cookies found: {info.cookieNames.length === 0 ? "NONE" : info.cookieNames.join(", ")}</div>
      <div>session: {info.hasSession ? `YES (${info.email})` : "NO"}</div>
      {info.expiresAt && <div>token expires: {info.expiresAt}</div>}
      {info.error && <div className="text-red-400">getSession error: {info.error}</div>}

      <div className="mt-1 border-t border-yellow-500/30 pt-1">
        <div className="font-bold">live event log (newest first):</div>
        {eventLog.map((e, i) => (
          <div key={i} className={e.includes("error") || e.includes("rejection") ? "text-red-400" : ""}>
            {e}
          </div>
        ))}
      </div>
    </div>
  );
}
