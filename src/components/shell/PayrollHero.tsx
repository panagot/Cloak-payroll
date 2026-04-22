import Link from "next/link";

/** Compact intro — details live in the form sections below. */
export function PayrollHero() {
  return (
    <div
      id="section-intro"
      className="mb-8 scroll-mt-24 border-b border-slate-800/50 pb-8"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-400/85">
        Private USDC on Solana
      </p>
      <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
        Treasury console
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
        Shield with Cloak, pay contractors by{" "}
        <span className="text-slate-200">UTXO public key</span> (from{" "}
        <Link
          href="/payee"
          className="text-sky-400/90 underline decoration-sky-500/30 underline-offset-2 hover:text-sky-300"
        >
          Payee keys
        </Link>
        ), then reconcile on-chain.{" "}
        <span className="whitespace-nowrap text-slate-500">USDC mainnet.</span>
      </p>
    </div>
  );
}
