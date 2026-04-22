"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site-links";

const nav = [
  { href: "/", label: "Treasury" },
  { href: "/payee", label: "Payee keys" },
] as const;

export function SiteHeader() {
  const path = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="flex w-full">
        <div className="hidden w-80 shrink-0 md:block" aria-hidden />
        <div className="mx-auto flex min-w-0 max-w-3xl flex-1 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-col">
            <Link
              href="/"
              className="font-semibold tracking-tight text-slate-100 transition hover:text-white"
            >
              {SITE.name}
            </Link>
            <span className="text-[11px] text-slate-500 md:hidden">{SITE.context}</span>
          </div>
          <nav
            className="flex flex-wrap items-center gap-1 sm:gap-2 md:hidden"
            aria-label="Main (mobile)"
          >
            {nav.map((item) => {
              const active = path === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "rounded-md px-2.5 py-1.5 text-sm font-medium transition " +
                    (active
                      ? "bg-slate-800/90 text-sky-300"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200")
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex shrink-0 items-center sm:pl-2">
            <WalletMultiButton />
          </div>
        </div>
      </div>
    </header>
  );
}
