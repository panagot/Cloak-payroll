"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CLOAK_PAY_SUBROUTES } from "@/lib/cloak-pay-routes";

/** Horizontal sub-nav; hidden on md+ when the app sidebar shows the same links. */
export function CloakPayPillNav() {
  const path = usePathname();
  return (
    <nav
      className="md:hidden -mx-4 flex gap-1.5 overflow-x-auto border-b border-indigo-100/40 bg-gradient-to-b from-white/50 to-transparent px-4 pb-3 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Cloak Pay pages"
    >
      {CLOAK_PAY_SUBROUTES.map((r) => {
        const here = path === r.href;
        return (
          <Link
            key={r.href}
            href={r.href}
            title={r.title}
            className={
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition " +
              (here
                ? "border-indigo-400/80 bg-indigo-100/90 text-indigo-900 shadow-sm"
                : "border-slate-200/80 bg-white/80 text-slate-600 active:bg-slate-100")
            }
          >
            {r.label}
          </Link>
        );
      })}
    </nav>
  );
}
