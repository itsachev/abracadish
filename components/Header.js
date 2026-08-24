"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuthUser } from "@/lib/useAuthUser";

export default function Header() {
  const user = useAuthUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  async function handleSignOut() {
    setMenuOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    // Hard navigation, not router.push — see login/page.js for why.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-5">
        <Link href="/" className="font-display text-3xl font-normal tracking-tight">
          <span className="text-foreground">Abraca</span>
          <span className="text-accent italic">Dish</span>
        </Link>

        {user === undefined ? (
          <div className="h-7 w-16" />
        ) : user ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-11 z-50 w-40 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
                <Link
                  href="/account"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-right text-sm text-foreground/90 hover:bg-surface-hover"
                >
                  Account
                </Link>
                <Link
                  href="/passport"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-right text-sm text-foreground/90 hover:bg-surface-hover"
                >
                  Passport
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center justify-end gap-1.5 px-4 py-2.5 text-right text-sm text-red-400 hover:bg-surface-hover"
                >
                  Log out
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                    <path
                      d="M9 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H9M16 15l4-3-4-3M9.5 12H20"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}
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
      </div>
    </header>
  );
}
