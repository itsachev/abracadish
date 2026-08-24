import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-5 pt-16 text-center">
      <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">Nothing here</h1>
      <p className="mt-3 text-sm text-muted">
        This page doesn&apos;t exist — it may have been removed, or the link might be broken.
      </p>
      <div className="mt-6 flex flex-col items-center gap-3">
        <Link
          href="/scan"
          className="gradient-accent flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <rect x="3.5" y="6.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="2" />
          </svg>
          Scan a dish
        </Link>
        <Link href="/" className="text-sm text-accent underline">
          Go home
        </Link>
      </div>
    </div>
  );
}
