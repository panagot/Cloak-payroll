"use client";

import Link from "next/link";
import { InfoTip } from "@/components/ui/InfoTip";
import { usdcClusterBadge } from "@/lib/constants";
import { TIP } from "@/lib/ui-tips";

/** Treasury intro — keeps jargon but explains who does what. */
export function PayrollHero() {
  return (
    <div
      id="section-intro"
      className="mb-8 scroll-mt-24 border-b border-indigo-100/50 pb-8"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-600">
        USDC in Cloak
      </p>
      <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        Treasury
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
        <strong className="font-medium text-slate-800">You (employer):</strong> connect one wallet, shield public
        USDC, then pay each person using their{" "}
        <span className="inline-flex flex-wrap items-baseline gap-1 text-slate-800">
          private receive key (64 hex)
          <InfoTip text={TIP.utxoPublicKey} className="translate-y-0.5" />
        </span>{" "}
        from{" "}
        <Link
          href="/payee"
          className="text-indigo-600 underline decoration-indigo-200/80 underline-offset-2 hover:text-indigo-800"
        >
          Payee
        </Link>{" "}
        — it is <span className="text-slate-400">not</span> a normal Solana address. After each successful line, use{" "}
        <span className="text-slate-800">Payee payment bundles</span> below to send them the small JSON so they
        can move USDC to Phantom on <span className="text-slate-500">Get paid</span>.{" "}
        <span className="text-slate-500">{usdcClusterBadge()}</span>
      </p>
    </div>
  );
}
