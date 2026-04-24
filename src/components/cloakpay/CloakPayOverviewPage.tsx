import Link from "next/link";
import { CloakPayHero } from "@/components/shell/CloakPayHero";
import { FlowJourneyStrip } from "@/components/shell/FlowJourneyStrip";
import { CLOAK_PAY_CTA_CARDS } from "@/lib/cloak-pay-routes";
import { CLOAK_PAY, LINKS, SITE } from "@/lib/site-links";
import { InfoTip } from "@/components/ui/InfoTip";

function CloakPayCtaIcon({ code }: { code: string }) {
  if (code === "list") {
    return (
      <span
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-200/50"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <rect x="4" y="5" width="3" height="3" rx="1" className="text-indigo-500/50" />
          <rect x="4" y="10.5" width="3" height="3" rx="1" className="text-indigo-500/50" />
          <rect x="4" y="16" width="3" height="3" rx="1" className="text-indigo-500/50" />
          <path
            className="text-indigo-600"
            d="M10.5 6.5h8.5M10.5 12h5.2M10.5 17.4h7.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }
  return (
    <span className="text-2xl" aria-hidden>
      {code}
    </span>
  );
}

export function CloakPayOverviewPage() {
  return (
    <div className="py-6 sm:py-8 lg:py-10">
      <CloakPayHero />
      <div id="section-cloakpay-flow" className="mb-8 scroll-mt-24">
        <FlowJourneyStrip variant="cloak-pay" />
      </div>

      <section id="section-cloakpay-cta" className="mb-8 scroll-mt-24">
        <h2 className="text-sm font-semibold text-slate-900">What’s in this app</h2>
        <p className="mt-1 text-sm text-slate-600">
          Same information architecture as {SITE.name}: one main job per subpage, plus room to connect real Solana + Cloak
          later. Use the <strong className="font-medium text-slate-800">sidebar on desktop</strong> or the{" "}
          <strong className="font-medium text-slate-800">pills on mobile</strong> to move around.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {CLOAK_PAY_CTA_CARDS.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                title={c.label}
                className="group flex h-full min-h-[5.5rem] flex-col justify-between rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/40 p-4 shadow-sm shadow-slate-200/25 transition hover:border-indigo-300/60 hover:shadow-md hover:shadow-indigo-100/30"
              >
                <div className="flex items-start gap-3">
                  <CloakPayCtaIcon code={c.icon} />
                  <div>
                    <span className="font-semibold text-slate-900 group-hover:text-indigo-900">{c.label}</span>
                    <p className="mt-1 text-xs leading-snug text-slate-500">{c.blurb}</p>
                  </div>
                </div>
                <span className="ms-0 mt-2 text-right text-xs font-medium text-indigo-600 group-hover:text-indigo-800">
                  Open →
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-center text-xs text-slate-500">
          <a
            className="text-indigo-600 hover:text-indigo-800"
            href={LINKS.sdkDocs}
            rel="noreferrer"
            target="_blank"
            title="Open Cloak SDK docs in a new tab"
          >
            SDK docs
          </a>{" "}
          · Bounty:{" "}
          <a className="text-indigo-600 hover:text-indigo-800" href={LINKS.bounty} rel="noreferrer" target="_blank">
            Superteam
          </a>
        </p>
      </section>

      <section
        id="section-cloakpay-note"
        className="app-card scroll-mt-24 border-slate-200/80 bg-gradient-to-b from-slate-50/30 to-white"
      >
        <h2 className="flex items-center gap-1 text-sm font-semibold text-slate-900">
          Roadmap
          <InfoTip text="You can show partners a complete UX shell before adding signed payment links, webhooks, and merchant backends." />
        </h2>
        <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-slate-600">
          <li>
            <strong className="font-medium text-slate-800">Signed</strong> payment links (tamper-resistant amounts &amp;
            labels).
          </li>
          <li>
            Real <strong className="font-medium text-slate-800">Cloak transfer</strong> from the customer wallet into a
            merchant UTXO (or custodial service pattern).
          </li>
          <li>
            <strong className="font-medium text-slate-800">Webhooks + CSV</strong> so Activity matches your{' '}
            {SITE.name} reconciliation story.
          </li>
        </ul>
        <p className="mt-3 text-sm text-slate-600">
          The live checkout is at{" "}
          <Link
            className="font-mono text-xs text-indigo-700 underline decoration-indigo-200/80 hover:text-indigo-900"
            href={`${CLOAK_PAY.path}/pay`}
          >
            {CLOAK_PAY.path}/pay
          </Link>{" "}
          with a <strong>simulate payment</strong> CTA (no on-chain send in this repo).
        </p>
      </section>
    </div>
  );
}
