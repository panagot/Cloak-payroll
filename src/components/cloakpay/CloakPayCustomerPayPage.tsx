"use client";

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usdcClusterBadge } from "@/lib/constants";
import { CloakPayPageHeader } from "./CloakPayPageHeader";
import { InfoTip } from "@/components/ui/InfoTip";
import { CLOAK_PAY } from "@/lib/site-links";

export function CloakPayCustomerPayPage() {
  const sp = useSearchParams();
  const label = sp.get("label") || "A business";
  const amount = sp.get("amount");
  const source = sp.get("source") || "link";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <CloakPayPageHeader
        kicker="Customer device"
        title="Pay with shielded USDC"
        description={<>This URL is what a QR or SMS opens. {usdcClusterBadge()}</>}
      />

      <section
        id="section-customer-amount"
        className="app-card mb-6 scroll-mt-24 border-sky-200/30 bg-gradient-to-b from-white to-sky-50/20"
      >
        <h2 className="text-sm font-semibold text-slate-900">Payment request</h2>
        <dl className="mt-3 space-y-2 text-sm text-slate-600">
          <div className="flex flex-wrap justify-between gap-2">
            <dt>Paying</dt>
            <dd className="font-medium text-slate-900">{label}</dd>
          </div>
          {amount ? (
            <div className="flex flex-wrap justify-between gap-2">
              <dt>Amount (suggested)</dt>
              <dd className="font-mono text-slate-800">{amount} USDC</dd>
            </div>
          ) : (
            <p className="text-slate-500">No fixed amount—customer or cashier enters the total next.</p>
          )}
          <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
            <dt>Arrived from</dt>
            <dd>{source === "qr" ? "QR / scan" : "Link"}</dd>
          </div>
        </dl>
      </section>

      <section id="section-customer-flow" className="app-card mb-6 scroll-mt-24 border-slate-200/80">
        <h2 className="flex items-center gap-1 text-sm font-semibold text-slate-900">
          How to pay
          <InfoTip text="Full build: connect wallet, top up public USDC, shield, then a Cloak private send to the merchant. Same story as Get paid, reversed role." />
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-slate-600">
          <li>Connect a Solana wallet (e.g. Phantom) using the control in the header.</li>
          <li>Ensure public USDC, then use <strong className="text-slate-800">Treasury</strong>-style shielding in your app.</li>
          <li>Sign the <strong className="text-slate-800">shielded</strong> payment your merchant’s integration expects.</li>
        </ol>
        <p className="mt-3 text-sm text-slate-600">
          <Link
            href="/withdraw"
            className="text-indigo-600 underline decoration-indigo-200/80 underline-offset-2 hover:text-indigo-800"
          >
            Get paid
          </Link>{" "}
          in this app shows the payee unshield path so you can mirror UX language.
        </p>
      </section>

      <section id="section-customer-note" className="app-card scroll-mt-24 border-amber-200/40 bg-amber-50/20">
        <h2 className="text-sm font-semibold text-slate-900">Status</h2>
        <p className="mt-1 text-sm text-slate-600">
          This screen is a <strong>read-only</strong> preview. No on-chain pay is started from this prototype.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Merchant tools live under{" "}
          <Link
            href={`${CLOAK_PAY.path}/activity`}
            className="text-indigo-600 underline offset-2 hover:text-indigo-800"
          >
            Activity
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
