import Link from "next/link";
import { isMainnetCluster } from "@/lib/constants";
import { InfoTip } from "@/components/ui/InfoTip";
import { CLOAK_PAY, LINKS, repoUrl, SITE } from "@/lib/site-links";
import { CloakPayPageHeader } from "./CloakPayPageHeader";

export function CloakPaySettingsPage() {
  const r = repoUrl();
  return (
    <div className="py-6 sm:py-8 lg:py-10">
      <CloakPayPageHeader
        kicker="Cloak Pay"
        title="Settings & trust"
        description={
          <>
            {SITE.name} is <strong className="font-medium text-slate-800">non-custodial</strong>: the app does not take
            custody of your keys. Cloak Pay pages are UI + copy experiments on top of the same stack.
          </>
        }
      />

      <section
        id="section-settings-mode"
        className="app-card relative mb-6 scroll-mt-24 overflow-hidden border-indigo-100/80 bg-gradient-to-b from-indigo-50/20 to-white"
      >
        <h2 className="text-sm font-semibold text-slate-900">Network</h2>
        <p className="mt-1 text-sm text-slate-600">
          {isMainnetCluster
            ? "Cluster target is Solana mainnet — use a funded Phantom with real USDC only in amounts you are comfortable with."
            : "This build uses a dev or custom cluster — all amounts are test, not a financial guarantee."}
        </p>
      </section>

      <section
        id="section-settings-privacy"
        className="app-card mb-6 scroll-mt-24 border-slate-200/80"
      >
        <h2 className="flex items-center gap-1 text-sm font-semibold text-slate-900">
          Privacy
          <InfoTip text="Shielded USDC uses Cloak; public Solana still sees that your wallet *did something*—teach that in a full launch." />
        </h2>
        <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-slate-600">
          <li>We do <strong>not</strong> send merchant or payer profile fields to a “Cloak Pay” backend in this open-source preview.</li>
          <li>On-chain, patterns still matter—pair with your own compliance and retention policy.</li>
        </ul>
      </section>

      <section id="section-settings-data" className="app-card scroll-mt-24 border-slate-200/80 bg-slate-50/20">
        <h2 className="text-sm font-semibold text-slate-900">Code & other apps</h2>
        {r && (
          <p className="mt-1 text-sm text-slate-600">
            <a
              className="font-medium text-indigo-700 underline decoration-indigo-200/80 hover:text-indigo-900"
              href={r}
              rel="noreferrer"
              target="_blank"
            >
              View repository
            </a>{" "}
            on GitHub.
          </p>
        )}
        <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
          <li>
            <Link className="font-medium text-indigo-700 hover:text-indigo-900" href="/">
              {SITE.name} Treasury
            </Link>{" "}
            — shield, payroll lines, bundles, reconcile
          </li>
          <li>
            <Link className="font-medium text-indigo-700 hover:text-indigo-900" href={CLOAK_PAY.path}>
              Cloak Pay overview
            </Link>{" "}
            — in-person and link product shell
          </li>
          <li>
            <a className="text-indigo-700 hover:text-indigo-900" href={LINKS.cloak} rel="noreferrer" target="_blank">
              Cloak
            </a>{" "}
            ·{" "}
            <a className="text-indigo-700 hover:text-indigo-900" href={LINKS.sdkDocs} rel="noreferrer" target="_blank">
              SDK docs
            </a>{" "}
            ·{" "}
            <a className="text-indigo-700 hover:text-indigo-900" href={LINKS.bounty} rel="noreferrer" target="_blank">
              Bounty
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
