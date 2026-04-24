import Link from "next/link";
import { CloakPayHero } from "@/components/shell/CloakPayHero";
import { FlowJourneyStrip } from "@/components/shell/FlowJourneyStrip";
import { CLOAK_PAY_SUBROUTES } from "@/lib/cloak-pay-routes";
import { CLOAK_PAY, SITE } from "@/lib/site-links";
import { InfoTip } from "@/components/ui/InfoTip";

export function CloakPayOverviewPage() {
  const b = CLOAK_PAY.path;
  const links = CLOAK_PAY_SUBROUTES.filter((r) => r.href !== b);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <CloakPayHero />
      <div id="section-cloakpay-flow" className="mb-6 scroll-mt-24">
        <FlowJourneyStrip variant="cloak-pay" />
      </div>

      <section id="section-cloakpay-cta" className="mb-6 scroll-mt-24">
        <h2 className="text-sm font-semibold text-slate-900">Cloak Pay in this app</h2>
        <p className="mt-1 text-sm text-slate-600">
          Same layout pattern as {SITE.name}: a primary nav, one job per page, and room to grow. Pick a page below.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {links.map((r) => (
            <li key={r.href}>
              <Link
                href={r.href}
                title={r.title}
                className="flex flex-col rounded-xl border border-slate-200/80 bg-white/80 p-3 shadow-sm shadow-slate-200/30 transition hover:border-indigo-200/80 hover:bg-indigo-50/30"
              >
                <span className="text-sm font-semibold text-slate-900">{r.label}</span>
                <span className="mt-0.5 text-xs text-slate-500">Open →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="section-cloakpay-note" className="app-card scroll-mt-24 border-slate-200/80">
        <h2 className="flex items-center gap-1 text-sm font-semibold text-slate-900">
          Roadmap
          <InfoTip text="Subpages are prototype UI; you can show partners a clear information architecture before wiring live Cloak + wallet." />
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Next: <strong>signed</strong> payment links, a dedicated <strong>checkout</strong> for <code>/cloak-pay/pay</code>, and webhooks
          to mirror payroll reconciliation.
        </p>
      </section>
    </div>
  );
}
