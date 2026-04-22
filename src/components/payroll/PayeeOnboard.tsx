"use client";

import { generateUtxoKeypair, bigintToHex, type UtxoKeypair } from "@cloak.dev/sdk";
import Link from "next/link";
import { useState } from "react";
import { LINKS } from "@/lib/site-links";

export function PayeeOnboard() {
  const [kp, setKp] = useState<UtxoKeypair | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const make = async () => {
    setErr(null);
    try {
      setKp(await generateUtxoKeypair());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to generate");
    }
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
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
          Receive shielded USDC
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
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Send to payroll
            </h2>
            <p className="mt-1 text-sm text-slate-400">UTXO public key — 64 hex characters</p>
            <p className="mt-3 break-all rounded-md bg-slate-950/50 p-3 font-mono text-xs text-slate-200 ring-1 ring-slate-800/80">
              {bigintToHex(kp.publicKey)}
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(bigintToHex(kp.publicKey));
                } catch {
                  setErr("Copy failed");
                }
              }}
              className="btn-secondary mt-4"
            >
              Copy to clipboard
            </button>
          </div>
        )}
        <p className="mt-10 text-sm text-slate-500">
          <Link
            className="font-medium text-sky-400 underline decoration-sky-500/30 hover:text-sky-300"
            href="/"
          >
            ← Back to Treasury
          </Link>
        </p>
      </div>
    </div>
  );
}
