"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";

const FULL_BLEED_PREFIXES = ["/scan", "/cook"];

export default function AppChrome({ children }) {
  const pathname = usePathname();
  const fullBleed = FULL_BLEED_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

  return (
    <>
      {!fullBleed && <Header />}
      <main className={fullBleed ? "flex-1" : "flex-1 pb-20"}>{children}</main>
      {!fullBleed && <BottomNav />}
    </>
  );
}
