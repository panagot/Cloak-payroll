"use client";

import { generateUtxoKeypair, bigintToHex, type UtxoKeypair } from "@cloak.dev/sdk";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { InfoTip } from "@/components/ui/InfoTip";
import { FlowJourneyStrip } from "@/components/shell/FlowJourneyStrip";
import { LINKS } from "@/lib/site-links";
import { useTimedMessage } from "@/hooks/use-timed-message";
import { loadPayeeUtxoKeypair, savePayeeUtxoKeypair } from "@/lib/payee-key-storage";
import { TIP } from "@/lib/ui-tips";

function payeeKeypairJsonString(k: UtxoKeypair, pretty = true): string {
  const o = { privateKey: k.privateKey.toString(), publicKey: k.publicKey.toString() };
  return pretty ? JSON.stringify(o, null, 2) : JSON.stringify(o);
}

export function PayeeOnboard() {
  const [kp, setKp] = useState<UtxoKeypair | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { message: copyStatus, flash: copyFlash } = useTimedMessage(2200);

  const keyJson = useMemo(() => (kp ? payeeKeypairJsonString(kp) : ""), [kp]);

  useEffect(() => {
    setKp(loadPayeeUtxoKeypair());
  }, []);

  const make = async () => {
    setErr(null);
    try {
      const next = await generateUtxoKeypair();
      setKp(next);
      savePayeeUtxoKeypair(next);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to generate");
    }
  };

  const downloadBackup = () => {
    if (!kp) return;
    const blob = new Blob([keyJson], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cloak-payee-utxo-key.json";
    a.click();
    URL.revokeObjectURL(a.href);
    copyFlash("File downloaded");
  };

  return (
    <div className="relative bg-transparent">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 90% 50% at 20% -10%, rgba(99, 102, 241, 0.1), transparent 50%)",
        }}
        aria-hidden
      />
      <div
        id="section-receive"
        className="mx-auto max-w-3xl scroll-mt-24 px-4 py-10 sm:px-6 sm:py-12"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Payee</p>
        <h1 className="mt-2 flex flex-wrap items-baseline gap-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          <span>Get a private payroll address</span>
          <InfoTip text={TIP.utxoPublicKey} className="translate-y-0.5" />
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          One time (per browser) you create a <span className="text-slate-800">Cloak receive key</span> and send your
          employer the <span className="text-slate-800">64-character hex</span> below. It is{" "}
          <strong className="text-slate-800">not</strong> your normal Solana address. After they run payroll, you get a
          small <strong>JSON</strong> from them, then you open{" "}
          <Link className="font-medium text-indigo-600 hover:text-indigo-800" href="/withdraw">
            Get paid
          </Link>{" "}
          to move USDC to Phantom.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Building your own app? See the{" "}
          <a
            className="text-indigo-600 hover:text-indigo-800"
            href={LINKS.sdkDocs}
            target="_blank"
            rel="noreferrer"
          >
            SDK docs
          </a>
          .
        </p>

        <div className="mt-5">
          <FlowJourneyStrip variant="payee-unshield" />
        </div>

        <button
          type="button"
          onClick={() => void make()}
          className="btn-primary mt-6"
          title={TIP.generatePayeeKey}
        >
          Generate my receive key
        </button>
        {err && (
          <p className="mt-3 text-sm text-red-800" role="alert">
            {err}
          </p>
        )}
        {kp && (
          <div className="app-card mt-8">
            <h2 className="flex flex-wrap items-baseline gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Send this to your employer (payroll / HR)</span>
              <InfoTip
                text={TIP.utxoPublicKey}
                titleOverride="What to send the person running payroll"
                className="normal-case"
              />
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              64 hex is what you send HR. You also need the <span className="text-slate-800">private</span> part on{" "}
              <Link className="font-medium text-indigo-600 hover:text-indigo-800" href="/withdraw">
                Get paid
              </Link>{" "}
              — <strong>copy the JSON</strong> below, download, or show decimals.
            </p>
            <p className="mt-3 break-all rounded-lg border border-indigo-200/40 bg-white/80 p-3 font-mono text-xs text-slate-800 shadow-sm">
              {bigintToHex(kp.publicKey)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(bigintToHex(kp.publicKey));
                    setErr(null);
                    copyFlash("64-hex copied");
                  } catch {
                    setErr("Copy failed");
                  }
                }}
                className="btn-secondary"
                title={TIP.copyPublicHex}
              >
                Copy 64-hex
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(keyJson);
                    setErr(null);
                    copyFlash("JSON copied");
                  } catch {
                    setErr("Copy failed");
                  }
                }}
                className="btn-secondary"
                title={TIP.payeeCopyKeyJson}
              >
                Copy as JSON
              </button>
              <button
                type="button"
                onClick={downloadBackup}
                className="btn-secondary"
                title={TIP.payeeDownload}
              >
                Download .json
              </button>
            </div>
            {copyStatus && (
              <p className="mt-2 text-xs text-emerald-800" role="status" aria-live="polite">
                {copyStatus}
              </p>
            )}
            <details
              className="mt-4 group rounded-lg border border-slate-200/80 bg-slate-50/80"
            >
              <summary className="cursor-pointer list-none py-2.5 px-3 text-xs font-medium text-slate-700 marker:hidden hover:bg-slate-100/80">
                <span className="me-1 inline-block origin-center text-slate-400 transition group-open:rotate-90 group-open:opacity-90">
                  ▸
                </span>
                Show private + public (decimal) — for manual copy on Get paid
                <InfoTip
                  text={TIP.payeeShowSecret}
                  titleOverride="What these numbers are"
                  className="ms-0.5 normal-case"
                />
              </summary>
              <div className="border-t border-slate-200/80 px-3 pb-3 pt-0">
                <p className="pt-2 text-[11px] leading-relaxed text-red-900/90">
                  <strong>Secret.</strong> Anyone with your private part can unshield to their wallet if they have a
                  payment JSON. Do not post in chat, tickets, or screenshots of your screen in public.
                </p>
                <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">publicKey (decimal)</p>
                <p className="mt-1 break-all font-mono text-xs text-slate-800">{kp.publicKey.toString()}</p>
                <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">privateKey (decimal)</p>
                <p className="mt-1 break-all font-mono text-xs text-slate-800">{kp.privateKey.toString()}</p>
              </div>
            </details>
            <p className="mt-3 rounded-lg border border-amber-200/50 bg-amber-50/80 px-3 py-2 text-xs text-amber-950/90">
              After they pay, they should send you a <strong>payment JSON</strong>. Open{" "}
              <Link href="/withdraw" className="text-indigo-600 font-medium hover:text-indigo-800">
                Get paid
              </Link>
              : same browser uses this key automatically, or <strong>paste the JSON you copied / downloaded</strong>{" "}
              under &quot;Import key backup&quot;, then paste the payment JSON and Unshield. Keep the secret offline.
            </p>
          </div>
        )}
        <p className="mt-10 text-sm text-slate-500">
          <Link
            className="font-medium text-indigo-600 underline decoration-indigo-200/60 hover:text-indigo-800"
            href="/withdraw"
          >
            Get paid (unshield)
          </Link>
          <span className="mx-2">·</span>
          <Link
            className="font-medium text-slate-600 underline decoration-slate-300 hover:text-slate-900"
            href="/"
          >
            ← Treasury
          </Link>
        </p>
      </div>
    </div>
  );
}
