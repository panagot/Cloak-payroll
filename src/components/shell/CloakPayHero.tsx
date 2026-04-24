import Link from "next/link";
import { InfoTip } from "@/components/ui/InfoTip";
import { usdcClusterBadge } from "@/lib/constants";

/** Cloak Pay intro — in-person or link, same shielding story. */
export function CloakPayHero() {
  return (
    <div
      id="section-cloakpay-intro"
      className="relative mb-8 scroll-mt-24 overflow-hidden rounded-2xl border border-emerald-200/40 bg-gradient-to-br from-white via-emerald-50/30 to-sky-50/20 p-6 shadow-md shadow-emerald-100/20 ring-1 ring-white/60 sm:p-8"
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/20 blur-3xl"
        aria-hidden
      />
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-800/90">Shielded at the counter</p>
      <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Cloak Pay</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
        A <strong className="font-medium text-slate-800">pay link and QR</strong> for your business: customers open it on
        their phone, follow the same{" "}
        <span className="inline-flex flex-wrap items-baseline gap-1 text-slate-800">
          public → shielded → private settlement
          <InfoTip
            text="This app is a product + UX prototype. On-chain pay flows would plug into the same Cloak and wallet patterns as Treasury and Get paid."
            className="translate-y-0.5"
          />
        </span>{" "}
        story you already use for payroll—without pasting 64-hex keys at a café counter. Ties to{" "}
        <Link
          href="/"
          className="text-indigo-600 underline decoration-indigo-200/80 underline-offset-2 hover:text-indigo-800"
        >
          Treasury
        </Link>{" "}
        and{" "}
        <Link
          href="/withdraw"
          className="text-indigo-600 underline decoration-indigo-200/80 underline-offset-2 hover:text-indigo-800"
        >
          Get paid
        </Link>
        . <span className="text-slate-500">{usdcClusterBadge()}</span>
      </p>
    </div>
  );
}
