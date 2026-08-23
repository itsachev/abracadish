"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { hasDismissedInstallPrompt, dismissInstallPrompt } from "@/lib/installPromptPreference";

function subscribeNoop() {
  return () => {};
}

// Same hydration-safe shape as the rest of the app's client-only reads
// (LocationPrompt's "declined" flag, WelcomeScreen's "seen" flag): server
// and the client's first paint both get a safe default, and the real
// browser-API value takes over a render later.
function getIosSnapshot() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function getIosServerSnapshot() {
  return false;
}

function getEligibleSnapshot() {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  return !standalone && !hasDismissedInstallPrompt();
}

function getEligibleServerSnapshot() {
  return false;
}

export default function InstallPrompt() {
  const ios = useSyncExternalStore(subscribeNoop, getIosSnapshot, getIosServerSnapshot);
  const eligible = useSyncExternalStore(subscribeNoop, getEligibleSnapshot, getEligibleServerSnapshot);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissedNow, setDismissedNow] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setDeferredPrompt(event);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  // Nothing to offer: standalone already, dismissed before, or a browser
  // that neither fired beforeinstallprompt nor is iOS Safari (which never
  // fires it but still supports manual "Add to Home Screen").
  if (!eligible || dismissedNow || (!deferredPrompt && !ios)) return null;

  function handleDismiss() {
    dismissInstallPrompt();
    setDismissedNow(true);
  }

  async function handleInstall() {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismissInstallPrompt();
    setDismissedNow(true);
  }

  return (
    <div className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-md items-center gap-3 px-5 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Install Abracadish</p>
          <p className="text-xs text-muted">
            {deferredPrompt
              ? "Add it to your home screen for the full app experience."
              : 'Tap the Share icon, then "Add to Home Screen."'}
          </p>
        </div>

        {deferredPrompt && (
          <button
            type="button"
            onClick={handleInstall}
            className="gradient-accent flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
              <path
                d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Install
          </button>
        )}

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-full p-1.5 text-muted transition-colors hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
