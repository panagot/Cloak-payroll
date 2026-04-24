"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { InfoTip } from "@/components/ui/InfoTip";
import { usdcClusterBadge } from "@/lib/constants";
import { parseUsdcToUnits, formatUsdcFromUnits } from "@/lib/amounts";
import { CLOAK_PAY } from "@/lib/site-links";
import { useSearchParams } from "next/navigation";

function makeFakeTxSig() {
  return "5sim" + "aB".repeat(28) + "DEMO" + Date.now().toString(36);
}

type PayPhase = "ready" | "step1" | "step2" | "step3" | "done" | "error";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function IndeterminateLine({ show, label }: { show: boolean; label?: string }) {
  if (!show) return null;
  return (
    <div
      className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-200/90"
      role="status"
      aria-label={label ?? "In progress"}
    >
      <div className="absolute inset-y-0 start-0 w-full max-w-full rounded-full bg-indigo-500 demo-sim-sweep" />
    </div>
  );
}

function compactPk(pk: { toBase58: () => string } | null | undefined) {
  if (!pk) return null;
  const s = pk.toBase58();
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

export function CloakPayCustomerPayPage() {
  const sp = useSearchParams();
  const { connected, publicKey, disconnecting } = useWallet();
  const idBase = useId();

  const qLabel = sp.get("label") || "";
  const qAmount = sp.get("amount");
  const qMpk = sp.get("mpk") || "";
  const source = sp.get("source") || "link";

  const [amountInput, setAmountInput] = useState(() => (qAmount && qAmount.trim() ? qAmount : ""));
  const [phase, setPhase] = useState<PayPhase>("ready");
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);

  const businessLabel = qLabel.trim() || "Merchant";

  const mpkLabel =
    qMpk.length > 20 ? `${qMpk.slice(0, 6)}…${qMpk.slice(-4)}` : qMpk || null;

  const amountUnits = useMemo(() => {
    const t = amountInput.trim();
    if (!t) return null;
    try {
      return parseUsdcToUnits(t);
    } catch {
      return null;
    }
  }, [amountInput]);

  const canSimulate = amountUnits != null && amountUnits > 0n && !disconnecting;

  const runSimulate = useCallback(async () => {
    if (!canSimulate) return;
    setErr(null);
    setTxSig(null);
    try {
      setPhase("step1");
      setStatusLine("Building commitment & Merkle path…");
      await sleep(900);
      setPhase("step2");
      setStatusLine("Generating ZK proof (Groth16) — stay on this page");
      await sleep(1400);
      setPhase("step3");
      setStatusLine(
        connected
          ? "Requesting signature from your wallet (simulated)…"
          : "No wallet: skipping real sign; finalizing mock settlement…"
      );
      await sleep(1600);
      setStatusLine("Simulating on-chain private transfer to merchant UTXO…");
      await sleep(900);
      setTxSig(makeFakeTxSig());
      setPhase("done");
      setStatusLine(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Simulation stopped");
      setPhase("error");
      setStatusLine(null);
    }
  }, [canSimulate, connected]);

  const reset = useCallback(() => {
    setPhase("ready");
    setStatusLine(null);
    setErr(null);
    setTxSig(null);
  }, []);

  useEffect(() => {
    if (qAmount && qAmount.trim()) {
      setAmountInput(qAmount);
    }
  }, [qAmount]);

  const sourceBadge = source === "qr" ? "Scanned from QR" : "Opened from link";
  const liveStep = phase === "step1" ? 0 : phase === "step2" ? 1 : phase === "step3" ? 2 : -1;

  return (
    <div className="mx-auto max-w-lg py-6 sm:max-w-xl sm:py-8 lg:py-10">
      <div className="text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-700/90">Checkout</p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Pay with shielded USDC</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          {usdcClusterBadge()}{" "}
          <InfoTip text="Production: this screen runs after a QR or payment link. Amount and merchant come from the URL. Below you can run a full UI simulation—no funds move on-chain in this app." />
        </p>
      </div>

      <section
        id="section-customer-order"
        className="relative mt-8 scroll-mt-24 overflow-hidden rounded-3xl border-2 border-emerald-200/60 bg-gradient-to-b from-emerald-50/50 via-white to-sky-50/20 p-6 shadow-lg shadow-emerald-100/40 ring-1 ring-white/60"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-200/15 blur-2xl" aria-hidden />
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-800/80">You pay</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{businessLabel}</p>
        {qMpk && (
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            <InfoTip
              className="translate-y-px"
              text="64-hex UTXO public from the merchant receive key, passed as mpk in the pay link/QR. A real integration can route the transfer to that shielded address."
            />{" "}
            <span className="font-mono text-slate-600">mpk: {mpkLabel}</span>
            <span className="sr-only">Full {qMpk.length} hex in URL</span>
          </p>
        )}
        <div className="mt-4 flex items-end justify-between gap-4 border-t border-emerald-100/80 pt-4">
          <div>
            <label className="app-label" htmlFor={`${idBase}-amt`}>
              Amount (USDC)
            </label>
            {qAmount && qAmount.trim() && (
              <p className="mt-1 text-xs text-slate-500">Set by link — you can still change for a demo</p>
            )}
            <input
              id={`${idBase}-amt`}
              className="app-input mt-1 max-w-[10rem] font-mono text-lg font-semibold tabular-nums"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              autoComplete="off"
              disabled={phase !== "ready" && phase !== "done" && phase !== "error"}
            />
          </div>
          {amountUnits != null && amountUnits > 0n && (
            <p className="shrink-0 text-right text-xs text-slate-500">
              ≈
              <span className="ms-0.5 font-mono text-sm font-semibold text-slate-800">
                {formatUsdcFromUnits(amountUnits)}
              </span>
              <span className="text-slate-400"> USDC</span>
            </p>
          )}
        </div>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 text-xs font-medium text-slate-600">
          <span
            className="inline-block h-2 w-2 rounded-full bg-sky-500"
            style={{ boxShadow: source === "qr" ? "0 0 0 2px #bae6fd" : undefined }}
            aria-hidden
          />
          {sourceBadge}
        </p>
      </section>

      <section id="section-customer-checkout" className="app-card mt-6 scroll-mt-24 border-indigo-100/80">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Pay</h2>
          <InfoTip
            className="translate-y-0.5"
            text="Simulation stages mimic a real Cloak private transfer. Connect Phantom in the header if you want the UI to show a real wallet, but the button never submits a transaction here."
          />
        </div>

        <div className="mb-4 rounded-xl border border-slate-200/60 bg-slate-50/80 px-3 py-2.5">
          {connected && publicKey ? (
            <p className="text-sm text-slate-700">
              <span className="font-medium text-slate-900">Wallet</span>{" "}
              <span className="font-mono text-indigo-900">{compactPk(publicKey)}</span>
            </p>
          ) : (
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-800">Not connected</span> — use the button in the header to attach
              Phantom, or run the <strong>simulation</strong> with no wallet.
            </p>
          )}
        </div>

        {phase !== "ready" && phase !== "done" && phase !== "error" && (
          <div className="mb-4" aria-live="polite">
            <ol className="flex gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {["Prepare", "Prove", "Sign & send"].map((l, i) => (
                <li key={l} className="min-w-0 flex-1">
                  <div
                    className={
                      "mb-1 h-1 rounded-full transition-colors " +
                      (i < liveStep ? "bg-emerald-500" : i === liveStep ? "bg-indigo-400" : "bg-slate-200/90")
                    }
                    aria-hidden
                  />
                  <span
                    className={
                      i === liveStep
                        ? "text-indigo-800"
                        : liveStep >= 0 && i < liveStep
                          ? "text-emerald-800"
                          : "text-slate-500"
                    }
                  >
                    {l}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-2 min-h-[1.25rem] text-sm text-slate-700">{statusLine}</p>
            <div className="mt-2">
              <IndeterminateLine show label={statusLine || "Working"} />
            </div>
            <p className="mt-1.5 text-center text-[10px] text-slate-500">Pretend relay + program calls — no mainnet send</p>
          </div>
        )}

        {err && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-900" role="alert">
            {err}
          </div>
        )}

        {phase === "done" && txSig && (
          <div
            id="section-customer-receipt"
            className="mb-4 overflow-hidden rounded-xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/90 to-white px-4 py-4"
          >
            <p className="text-sm font-semibold text-emerald-900">Simulated — payment recorded</p>
            <p className="mt-1 text-sm text-slate-600">Would appear in the merchant’s Activity. Your wallet was not debited in this app.</p>
            <p className="mt-2 break-all font-mono text-[10px] leading-relaxed text-slate-600" title="Fake signature for UI">
              {txSig}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {phase === "done" || phase === "error" ? (
            <button type="button" className="btn-primary flex-1" onClick={reset}>
              {phase === "done" ? "Pay again (demo)" : "Try again"}
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={!canSimulate || phase !== "ready"}
              onClick={() => void runSimulate()}
            >
              {phase === "ready" ? "Simulate shielded payment" : "Working…"}
            </button>
          )}
        </div>
        {!canSimulate && (
          <p className="mt-2 text-xs text-amber-800">Enter a valid USDC amount (e.g. 5.00) to enable the demo.</p>
        )}
      </section>

      <section id="section-customer-disclaimer" className="app-card mt-4 scroll-mt-24 border-slate-200/70 bg-slate-50/40">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Unshielding</h2>
        <p className="mt-1.5 text-sm text-slate-600">
          The opposite flow (employee cashing out) is{" "}
          <Link href="/withdraw" className="font-medium text-indigo-700 underline decoration-indigo-200/80 hover:text-indigo-900">
            Get paid
          </Link>
          . Merchants reconcile in{" "}
          <Link href={`${CLOAK_PAY.path}/activity`} className="font-medium text-indigo-700 hover:text-indigo-900">
            Activity
          </Link>{" "}
          (sample).
        </p>
      </section>
    </div>
  );
}
