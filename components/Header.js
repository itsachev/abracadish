"use client";

import Link from "next/link";
import { useAuthUser } from "@/lib/useAuthUser";

export default function Header() {
  const user = useAuthUser();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-5">
        <Link href="/" className="text-sm font-bold tracking-tight text-foreground">
          Abracadish
        </Link>

        {user === undefined ? (
          <div className="h-7 w-16" />
        ) : user ? (
          <Link
            href="/account"
            className="max-w-36 truncate text-xs font-medium text-muted hover:text-foreground"
          >
            {user.email}
          </Link>
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
