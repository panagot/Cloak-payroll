"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { InfoTip } from "@/components/ui/InfoTip";
import { CLOAK_PAY_SUBROUTES, getCloakPayToc } from "@/lib/cloak-pay-routes";
import { CLOAK_PAY, isCloakPayPath, LINKS, SITE } from "@/lib/site-links";
import { TIP } from "@/lib/ui-tips";

const routes = [
  { href: "/", label: "Treasury", title: TIP.navTreasury },
  { href: "/payee", label: "Payee", title: TIP.navPayee },
  { href: "/withdraw", label: "Get paid", title: TIP.navWallet },
  { href: "/demo", label: "Walkthrough", title: TIP.navDemo },
  { href: CLOAK_PAY.path, label: CLOAK_PAY.label, title: TIP.navCloakPay },
] as const;

/** Treasury, Payee, Get paid, Walkthrough — no Cloak Pay in sidebar (use header to open Cloak Pay). */
const payrollAppRoutes = routes.filter((r) => r.href !== CLOAK_PAY.path);

/** Treasury page anchor ids — see PayrollDashboard section ids. */
const treasuryToc = [
  { id: "section-intro", label: "Intro" },
  { id: "section-treasury-flow", label: "How it works" },
  { id: "section-treasury-utxo", label: "UTXO & balance" },
  { id: "section-shield", label: "Shield USDC" },
  { id: "section-payees", label: "Payee lines" },
  { id: "section-actions", label: "Run & reconcile" },
  { id: "section-payee-bundles", label: "Payee bundles" },
  { id: "section-transactions", label: "Last transactions" },
  { id: "section-reconciliation", label: "Reconciliation" },
  { id: "section-viewing-key", label: "Viewing key" },
] as const;

const resources = [
  { href: LINKS.cloak, label: "Cloak" },
  { href: LINKS.sdkDocs, label: "SDK docs" },
  { href: LINKS.bounty, label: "Bounty" },
] as const;

type NavItemProps = {
  href: string;
  children: string;
  title: string;
  active: boolean;
};

function NavItem({ href, children, title, active }: NavItemProps) {
  return (
    <Link
      href={href}
      title={title}
      className={
        "block rounded-lg px-2.5 py-1.5 text-sm font-medium transition " +
        (active
          ? "bg-indigo-100/90 text-indigo-900 shadow-sm shadow-indigo-200/40 ring-1 ring-indigo-200/50"
          : "text-slate-600 hover:bg-indigo-50/60 hover:text-indigo-900")
      }
    >
      {children}
    </Link>
  );
}

function TocItem({ id, label }: { id: string; label: string }) {
  return (
    <a
      href={`#${id}`}
      className="block rounded-md py-0.5 pl-2.5 pr-1 text-left text-xs text-slate-500 transition hover:text-indigo-700"
    >
      {label}
    </a>
  );
}

export function AppSidebar() {
  const path = usePathname();
  const isTreasury = path === "/";
  const isPayee = path === "/payee";
  const isDemo = path === "/demo";
  const isCloakPay = isCloakPayPath(path);
  const primaryNavRoutes = isCloakPay ? [...CLOAK_PAY_SUBROUTES] : payrollAppRoutes;
  const primaryNavLabel = isCloakPay ? "Cloak Pay" : "App";
  const cloakToc = isCloakPay ? getCloakPayToc(path) : [];

  return (
    <aside
      className="hidden w-80 shrink-0 border-r border-indigo-100/50 bg-gradient-to-b from-indigo-50/40 via-white/90 to-slate-50/50 md:flex md:flex-col"
      aria-label={isCloakPay ? "Cloak Pay" : "App"}
    >
      <div className="flex h-full flex-col gap-5 px-3 py-4">
        <div>
          <p
            className={
              "px-2.5 text-[10px] font-semibold uppercase tracking-wider " +
              (isCloakPay ? "text-emerald-700/90" : "text-indigo-500/80")
            }
          >
            {primaryNavLabel}
          </p>
          <nav
            className="mt-1.5 flex flex-col gap-0.5"
            aria-label={isCloakPay ? "Cloak Pay only" : "Cloak Payroll app"}
          >
            {primaryNavRoutes.map((r) => (
              <NavItem
                key={r.href}
                href={r.href}
                title={r.title}
                active={path === r.href}
              >
                {r.label}
              </NavItem>
            ))}
          </nav>
        </div>

        {isTreasury && (
          <div>
            <p className="flex items-center gap-1 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <span>On this page</span>
              <InfoTip text={TIP.sidebarOnPage} className="translate-y-0.5" />
            </p>
            <nav
              className="mt-1.5 max-h-[min(18rem,45vh)] space-y-0.5 overflow-y-auto overscroll-contain border-l border-indigo-200/50 pl-2.5"
              aria-label="Treasury page sections"
            >
              {treasuryToc.map((item) => (
                <TocItem key={item.id} id={item.id} label={item.label} />
              ))}
            </nav>
          </div>
        )}

        {isPayee && (
          <div>
            <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              On this page
            </p>
            <nav
              className="mt-1.5 space-y-0.5 border-l border-indigo-200/50 pl-2.5"
              aria-label="Payee page sections"
            >
              <TocItem id="section-receive" label="Receive key" />
            </nav>
          </div>
        )}

        {path === "/withdraw" && (
          <div>
            <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              On this page
            </p>
            <nav
              className="mt-1.5 space-y-0.5 border-l border-indigo-200/50 pl-2.5"
              aria-label="Withdraw page sections"
            >
              <TocItem id="section-withdraw-panel" label="Get paid" />
            </nav>
          </div>
        )}

        {isDemo && (
          <div>
            <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              On this page
            </p>
            <nav
              className="mt-1.5 space-y-0.5 border-l border-indigo-200/50 pl-2.5"
              aria-label="Walkthrough page"
            >
              <TocItem id="section-demo-panel" label="Simulation" />
            </nav>
          </div>
        )}

        {cloakToc.length > 0 && (
          <div>
            <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              On this page
            </p>
            <nav
              className="mt-1.5 max-h-[min(18rem,45vh)] space-y-0.5 overflow-y-auto border-l border-indigo-200/50 pl-2.5"
              aria-label="Cloak Pay page sections"
            >
              {cloakToc.map((item) => (
                <TocItem key={item.id} id={item.id} label={item.label} />
              ))}
            </nav>
          </div>
        )}

        <div className="mt-auto border-t border-indigo-100/50 pt-3">
          <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-500/80">
            Resources
          </p>
          <ul className="mt-1.5 space-y-1">
            {resources.map((r) => (
              <li key={r.href}>
                <a
                  href={r.href}
                  target="_blank"
                  rel="noreferrer"
                  title={`Open ${r.label} in a new tab`}
                  className="block rounded-md px-2.5 py-0.5 text-xs text-slate-500 transition hover:text-indigo-700"
                >
                  {r.label} ↗
                </a>
              </li>
            ))}
          </ul>
          <p
            className="mt-3 line-clamp-2 px-2.5 text-[10px] leading-relaxed text-slate-500"
            title={SITE.context}
          >
            {SITE.context}
          </p>
        </div>
      </div>
    </aside>
  );
}
