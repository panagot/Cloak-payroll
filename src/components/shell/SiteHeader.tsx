"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CLOAK_PAY_SUBROUTES } from "@/lib/cloak-pay-routes";
import { CLOAK_PAY, isCloakPayPath, SITE } from "@/lib/site-links";
import { TIP } from "@/lib/ui-tips";

const nav = [
  { href: "/", label: "Treasury", title: TIP.navTreasury },
  { href: "/payee", label: "Payee", title: TIP.navPayee },
  { href: "/withdraw", label: "Get paid", title: TIP.navWallet },
  { href: "/demo", label: "Walkthrough", title: TIP.navDemo },
  { href: CLOAK_PAY.path, label: "Cloak Pay", title: TIP.navCloakPay },
] as const;

const payrollOnlyNav = nav.filter((item) => item.href !== CLOAK_PAY.path);

export function SiteHeader() {
  const path = usePathname();
  const onCloakPay = isCloakPayPath(path);
  const mobileNavItems = onCloakPay ? [...CLOAK_PAY_SUBROUTES] : payrollOnlyNav;

  return (
    <header className="sticky top-0 z-40 border-b border-indigo-100/50 bg-white/80 backdrop-blur-md shadow-sm shadow-indigo-100/20">
      <div className="flex w-full">
        <div className="hidden w-80 shrink-0 md:block" aria-hidden />
        <div className="mx-auto flex min-w-0 max-w-3xl flex-1 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 sm:justify-start sm:gap-x-5">
              <Link
                href="/"
                title={TIP.brand}
                className={
                  "shrink-0 font-semibold tracking-tight transition " +
                  (path === "/"
                    ? "text-indigo-900"
                    : "text-slate-700 hover:text-indigo-800")
                }
              >
                {SITE.name}
              </Link>
              <span className="text-slate-300 select-none" aria-hidden>
                |
              </span>
              <Link
                href={CLOAK_PAY.path}
                title={TIP.navCloakPay}
                className={
                  "shrink-0 text-sm font-semibold tracking-tight transition " +
                  (onCloakPay
                    ? "text-indigo-900"
                    : "text-slate-600 hover:text-indigo-800")
                }
              >
                {CLOAK_PAY.label}
              </Link>
            </div>
            <span className="text-[11px] text-slate-500 md:hidden" title={TIP.brand}>
              {SITE.context}
            </span>
          </div>
          <nav
            className="flex flex-wrap items-center gap-1 sm:gap-2 md:hidden"
            aria-label="Main (mobile)"
          >
            {mobileNavItems.map((item) => {
              const active = path === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.title}
                  className={
                    "rounded-md px-2.5 py-1.5 text-sm font-medium transition " +
                    (active
                      ? "bg-indigo-100/90 text-indigo-900 shadow-sm shadow-indigo-200/30"
                      : "text-slate-600 hover:bg-indigo-50/80 hover:text-indigo-900")
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div
            className="flex shrink-0 items-center sm:pl-2"
            title={TIP.walletConnect}
          >
            <WalletMultiButton />
          </div>
        </div>
      </div>
    </header>
  );
}
