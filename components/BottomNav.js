"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/",
    label: "Home",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path
          d="M4 11.5 12 4l8 7.5M6 9.5V20h12V9.5"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/scan",
    label: "Scan",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
        <rect
          x="3.5"
          y="6.5"
          width="17"
          height="13"
          rx="2.5"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
        />
        <path
          d="M8 6.5 9.4 4.2A1 1 0 0 1 10.25 3.7h3.5a1 1 0 0 1 .85.5L16 6.5"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} />
      </svg>
    ),
  },
  {
    href: "/saved",
    label: "Saved",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path
          d="M6 4h12v16l-6-4-6 4V4Z"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/progress",
    label: "Progress",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path
          d="M12 3.5c1.5 2.2.5 3.5-.3 4.6-.9 1.2-1.2 2.4-.3 3.7 1-.3 1.6-1 1.8-1.8.9 1 1.3 2.3.8 3.7a4 4 0 1 1-6.8-3.9c.7-1 2-2.1 1.8-4.1 1 .3 1.6 1 1.8 1.9.4-1.3.3-2.7-1-4.1.8-.2 1.6-.2 2.2 0Z"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-black/90 backdrop-blur-xl
                 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex h-16 max-w-md items-stretch justify-around">
        {TABS.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`relative flex h-full flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                  active ? "text-white" : "text-muted"
                }`}
              >
                {active && (
                  <span className="gradient-accent absolute -top-px h-0.5 w-8 rounded-full" />
                )}
                <span className={active ? "text-accent" : ""}>{tab.icon(active)}</span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
