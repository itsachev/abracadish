"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";

const FULL_BLEED_PREFIXES = ["/scan", "/cook"];

// Matches "/scan" and "/scan/x" but not "/scans" or "/scans/x" — a plain
// startsWith would also swallow /scans/[id] (scan history) since "/scans"
// starts with the string "/scan".
function matchesPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export default function AppChrome({ children }) {
  const pathname = usePathname();
  const fullBleed = FULL_BLEED_PREFIXES.some((prefix) => pathname && matchesPrefix(pathname, prefix));

  return (
    <>
      {!fullBleed && <Header />}
      <main className={fullBleed ? "flex-1" : "flex-1 pb-20"}>{children}</main>
      {!fullBleed && <BottomNav />}
    </>
  );
}
