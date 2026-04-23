"use client";

import { generateUtxoKeypair, bigintToHex, type UtxoKeypair } from "@cloak.dev/sdk";
import Link from "next/link";
import { useEffect, useState } from "react";
import { InfoTip } from "@/components/ui/InfoTip";
import { LINKS } from "@/lib/site-links";
import { loadPayeeUtxoKeypair, savePayeeUtxoKeypair } from "@/lib/payee-key-storage";
import { TIP } from "@/lib/ui-tips";

export function PayeeOnboard() {
  const [kp, setKp] = useState<UtxoKeypair | null>(null);
  const [err, setErr] = useState<string | null>(null);

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
    const blob = new Blob(
      [
        JSON.stringify(
          { privateKey: kp.privateKey.toString(), publicKey: kp.publicKey.toString() },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cloak-payee-utxo-key.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="relative bg-slate-950">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 30% -10%, rgba(14, 165, 233, 0.1), transparent), #020617",
        }}
        aria-hidden
      />
      <div
        id="section-receive"
        className="mx-auto max-w-3xl scroll-mt-24 px-4 py-10 sm:px-6 sm:py-12"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400/90">
          Payee onboarding
        </p>
        <h1 className="mt-2 flex flex-wrap items-baseline gap-2 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
          <span>Receive shielded USDC</span>
          <InfoTip text={TIP.utxoPublicKey} className="translate-y-0.5" />
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
          This key is a <span className="text-slate-200">Cloak UTXO public key</span> — not
          your Solana address. The treasury uses it to route private payroll into a note
          you can spend from a wallet that supports the flow.{" "}
          <a
            className="text-sky-400/90 underline decoration-sky-500/30 hover:text-sky-300"
            href={LINKS.sdkDocs}
            target="_blank"
            rel="noreferrer"
          >
            Read the SDK
          </a>{" "}
          if you are integrating yourself.
        </p>

        <button
          type="button"
          onClick={() => void make()}
          className="btn-primary mt-6"
          title={TIP.generatePayeeKey}
        >
          Generate receive key
        </button>
        {err && (
          <p className="mt-3 text-sm text-red-300" role="alert">
            {err}
          </p>
        )}
        {kp && (
          <div className="app-card mt-8">
            <h2 className="flex flex-wrap items-baseline gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Send to payroll</span>
              <InfoTip
                text={TIP.utxoPublicKey}
                titleOverride="What to send the treasury"
                className="normal-case"
              />
            </h2>
            <p className="mt-1 text-sm text-slate-400">UTXO public key — 64 hex characters</p>
            <p className="mt-3 break-all rounded-md bg-slate-950/50 p-3 font-mono text-xs text-slate-200 ring-1 ring-slate-800/80">
              {bigintToHex(kp.publicKey)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(bigintToHex(kp.publicKey));
                  } catch {
                    setErr("Copy failed");
                  }
                }}
                className="btn-secondary"
                title={TIP.copyPublicHex}
              >
                Copy to clipboard
              </button>
              <button
                type="button"
                onClick={downloadBackup}
                className="btn-secondary"
                title={TIP.payeeDownload}
              >
                Download key backup
              </button>
            </div>
            <p className="mt-3 text-xs text-amber-200/80">
              After you are paid, the treasury will send a small JSON <strong>payment bundle</strong>. Open{" "}
              <Link href="/withdraw" className="text-sky-400 hover:text-sky-300">To wallet</Link> to unshield
              to your Solana address. Keep the backup file private.
            </p>
          </div>
        )}
        <p className="mt-10 text-sm text-slate-500">
          <Link
            className="font-medium text-sky-400 underline decoration-sky-500/30 hover:text-sky-300"
            href="/withdraw"
          >
            To wallet (unshield)
          </Link>
          <span className="mx-2">·</span>
          <Link
            className="font-medium text-slate-500 underline decoration-slate-600 hover:text-slate-300"
            href="/"
          >
            ← Treasury
          </Link>
        </p>
      </div>
    </div>
  );
}
