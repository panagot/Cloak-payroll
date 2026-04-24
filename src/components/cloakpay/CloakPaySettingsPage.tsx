import Link from "next/link";
import { isMainnetCluster } from "@/lib/constants";
import { InfoTip } from "@/components/ui/InfoTip";
import { repoUrl, SITE } from "@/lib/site-links";
import { CloakPayPageHeader } from "./CloakPayPageHeader";

export function CloakPaySettingsPage() {
  const r = repoUrl();
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <CloakPayPageHeader
        kicker="Project"
        title="Settings & disclosure"
        description={`${SITE.name} ships Cloak Pay as a product surface. Nothing here is custodial: keys stay in the wallet, same as the rest of the app.`}
      />

      <section
        id="section-settings-mode"
        className="app-card mb-6 scroll-mt-24 border-slate-200/80"
      >
        <h2 className="text-sm font-semibold text-slate-900">Environment</h2>
        <p className="mt-1 text-sm text-slate-600">
          {isMainnetCluster ? "RPC profile points at Solana mainnet." : "This build uses a dev or custom cluster — treat amounts as test."}
        </p>
      </section>

      <section id="section-settings-data" className="app-card scroll-mt-24 border-slate-200/80">
        <h2 className="flex items-center gap-1 text-sm font-semibold text-slate-900">
          Data &amp; open source
          <InfoTip text="Merchant “profile” fields in this UI are for demonstration only unless you add persistence and consent." />
        </h2>
        <p className="mt-1 text-sm text-slate-600">No payment metadata is sent to a Cloak Pay server from these prototype pages; connect your own API when you wire checkouts.</p>
        {r && (
          <p className="mt-2 text-sm">
            <a href={r} className="text-indigo-600 underline decoration-indigo-200/80 hover:text-indigo-800" rel="noreferrer" target="_blank">
              View repository
            </a>{" "}
            for the submission this UI belongs to.
          </p>
        )}
        <p className="mt-3 text-sm text-slate-600">
          Back to{" "}
          <Link href="/" className="text-indigo-600 underline decoration-indigo-200/80 hover:text-indigo-800">
            {SITE.name} Treasury
          </Link>{" "}
          for the shielded payroll flow, or the{" "}
          <Link href="/demo" className="text-indigo-600 underline decoration-indigo-200/80 hover:text-indigo-800">
            Walkthrough
          </Link>{" "}
          for an automatic SDK sim.
        </p>
      </section>
    </div>
  );
}
