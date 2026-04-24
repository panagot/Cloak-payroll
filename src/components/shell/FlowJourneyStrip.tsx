import type { ReactNode } from "react";

type Step = { n: string; label: string; note?: string };

const payeeUnshield: Step[] = [
  { n: "1", label: "Private address", note: "Payee keys: 64-hex, not Phantom" },
  { n: "2", label: "Employer pays you", note: "They use that hex in payroll" },
  { n: "3", label: "You get a JSON", note: "From them after a successful line" },
  { n: "4", label: "Move to Phantom", note: "Paste JSON here + connect + Unshield" },
];

const treasury: Step[] = [
  { n: "1", label: "Shield", note: "Move public USDC into private balance" },
  { n: "2", label: "Pay", note: "Rows = one private send each" },
  { n: "3", label: "Share JSON", note: "Copy each payee’s bundle to them" },
  { n: "4", label: "They withdraw", note: "They use Get paid in this app" },
];

const cloakPay: Step[] = [
  { n: "1", label: "Your pay link", note: "A stable URL you print or add to a QR" },
  { n: "2", label: "Scan or tap", note: "Customer opens the flow on their phone" },
  { n: "3", label: "Shielded USDC", note: "Cloak path, not a bare wallet address" },
  { n: "4", label: "You get paid", note: "Reconcile with the same UTXO tools as payroll" },
];

type Variant = "payee-unshield" | "treasury" | "cloak-pay";

export function FlowJourneyStrip({ variant, className = "" }: { variant: Variant; className?: string }) {
  const steps =
    variant === "treasury" ? treasury : variant === "cloak-pay" ? cloakPay : payeeUnshield;
  const stripTitle =
    variant === "treasury"
      ? "Employer / treasury path"
      : variant === "cloak-pay"
        ? "Cloak Pay (in person)"
        : "Contractor / payee path";
  return (
    <div
      className={
        "relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/80 p-4 ring-1 ring-slate-200/40 " +
        (variant === "cloak-pay"
          ? "to-emerald-50/25 "
          : "to-sky-50/20 ") +
        className
      }
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-sky-200/20 blur-2xl"
        aria-hidden
      />
      {variant === "cloak-pay" && (
        <div
          className="pointer-events-none absolute -left-4 bottom-0 h-24 w-24 rounded-full bg-emerald-200/15 blur-2xl"
          aria-hidden
        />
      )}
      <p className="relative text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {stripTitle}
      </p>
      <ol className="relative mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <li
            key={s.n}
            className="flex flex-col gap-0.5 rounded-xl border border-slate-200/60 bg-white px-3 py-2.5 shadow-sm shadow-slate-200/30 backdrop-blur-sm"
          >
            <span className="inline-flex w-fit items-baseline gap-1.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-800 text-center text-xs font-bold text-white shadow-sm shadow-slate-300/50">
                {s.n}
              </span>
              <span className="text-sm font-medium text-slate-900">{s.label}</span>
            </span>
            {s.note ? <span className="pl-[2.125rem] text-xs leading-snug text-slate-500">{s.note}</span> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** One-line “you are here” for payee withdraw page. */
export function UnshieldClarify({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm leading-relaxed text-slate-600 sm:text-base [&_strong]:font-semibold [&_strong]:text-slate-800">
      {children}
    </p>
  );
}
