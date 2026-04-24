"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { solscanTransactionUrl, USDC_MINT } from "@/lib/constants";
import { withdrawUtxoToPublicWallet } from "@/lib/cloak/payee-withdraw";
import { formatCloakError } from "@/lib/cloak/errors";
import { formatUsdcFromUnits } from "@/lib/amounts";
import { parsePayeeBundleJson, utxoFromBundle, type PayeePaymentBundle } from "@/lib/payee-bundle";
import {
  clearPayeeUtxoKeypair,
  loadPayeeUtxoKeypair,
  parsePayeeUtxoKeyFromJsonText,
  savePayeeUtxoKeypair,
} from "@/lib/payee-key-storage";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { bigintToHex, generateUtxoKeypair, type UtxoKeypair } from "@cloak.dev/sdk";
import Link from "next/link";
import { InfoTip } from "@/components/ui/InfoTip";
import { FlowJourneyStrip, UnshieldClarify } from "@/components/shell/FlowJourneyStrip";
import { LINKS } from "@/lib/site-links";
import { useTimedMessage } from "@/hooks/use-timed-message";
import { TIP } from "@/lib/ui-tips";

export function PayeeWithdraw() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signMessage, connected } = useWallet();
  const [keypair, setKeypair] = useState<UtxoKeypair | null>(null);
  const [bundleText, setBundleText] = useState("");
  const [importKeyText, setImportKeyText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [publicUsdc, setPublicUsdc] = useState<string | null>(null);
  const [lastSig, setLastSig] = useState<string | null>(null);
  const [importOk, setImportOk] = useState<string | null>(null);
  const importTextareaId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { message: copyStatus, flash: copyFlash } = useTimedMessage(2200);

  useEffect(() => {
    setKeypair(loadPayeeUtxoKeypair());
  }, []);

  useEffect(() => {
    if (!importOk) return;
    const t = setTimeout(() => setImportOk(null), 6000);
    return () => clearTimeout(t);
  }, [importOk]);

  const onImportKey = () => {
    setErr(null);
    setImportOk(null);
    try {
      const kp = parsePayeeUtxoKeyFromJsonText(importKeyText);
      savePayeeUtxoKeypair(kp);
      const reread = loadPayeeUtxoKeypair();
      if (!reread || reread.publicKey !== kp.publicKey) {
        setKeypair(kp);
        setImportKeyText("");
        setErr(
          "Key loaded for this session only: this browser blocked saving to storage (private window, or storage full). Unshield in this same tab, or use a normal window."
        );
        return;
      }
      setKeypair(kp);
      setImportKeyText("");
      setImportOk(
        "Key saved. The 64-hex in step 1 is your private-payroll address (for your employer), not your Phantom. Next: paste the JSON, connect Phantom, then Unshield."
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Invalid key JSON");
    }
  };

  const makeNewKey = useCallback(async () => {
    setErr(null);
    setLoading("Generating UTXO key…");
    try {
      const kp = await generateUtxoKeypair();
      savePayeeUtxoKeypair(kp);
      setKeypair(kp);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(null);
    }
  }, []);

  const refreshAta = useCallback(async () => {
    if (!publicKey) {
      setPublicUsdc(null);
      return;
    }
    try {
      const ata = await getAssociatedTokenAddress(USDC_MINT, publicKey);
      const a = await getAccount(connection, ata);
      setPublicUsdc(
        `Visible USDC: ${formatUsdcFromUnits(BigInt(a.amount))} (in your public token account for this wallet).`
      );
    } catch {
      setPublicUsdc("No public USDC ATA yet (normal until you unshield the first time).");
    }
  }, [connection, publicKey]);

  useEffect(() => {
    if (connected && publicKey) void refreshAta();
  }, [connected, publicKey, refreshAta]);

  const onWithdraw = async () => {
    setErr(null);
    setLastSig(null);
    if (!connected || !publicKey || !signTransaction || !signMessage) {
      setErr("Connect Phantom in the header first (same wallet you want the USDC sent to).");
      return;
    }
    if (!keypair) {
      setErr("Set your receive key first (import backup or go to Payee keys).");
      return;
    }
    let bundle: PayeePaymentBundle;
    try {
      bundle = parsePayeeBundleJson(bundleText.trim());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Paste the payment JSON your employer sent.");
      return;
    }
    setLoading("Unshielding — building proof and signing (can take a minute)…");
    try {
      const utxo = utxoFromBundle(bundle, keypair);
      const r = await withdrawUtxoToPublicWallet(
        connection,
        publicKey,
        signTransaction,
        signMessage,
        keypair,
        utxo
      );
      setLastSig(r.signature);
      setBundleText("");
      void refreshAta();
    } catch (e) {
      setErr(formatCloakError(e));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-0 bg-transparent">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 100% 55% at 50% -5%, rgba(99, 102, 241, 0.1), transparent 55%)",
        }}
        aria-hidden
      />
      <div
        id="section-withdraw-panel"
        className="mx-auto max-w-3xl scroll-mt-24 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Get paid (unshield)
        </p>
        <h1 className="mt-1.5 flex flex-wrap items-baseline gap-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          <span>Move private USDC to your Phantom</span>
          <InfoTip text={TIP.unshieldButton} className="translate-y-0.5" />
        </h1>

        <UnshieldClarify>
          <strong>Flow in one sentence:</strong> key (step 1) + payment <strong>JSON from HR</strong> (step 2) +
          Phantom in the header (step 3) → <strong>Unshield</strong> (step 4). <strong>Not</strong> a normal
          “send to address” in Phantom — the employer pays the shielded pool; you pull USDC to public here.
        </UnshieldClarify>

        <p className="mt-2 text-xs text-slate-500">
          <a
            className="text-indigo-600 hover:text-indigo-800"
            href={LINKS.sdkDocs}
            target="_blank"
            rel="noreferrer"
            title="Cloak SDK documentation (opens in a new tab)"
          >
            SDK reference
          </a>{" "}
          for advanced troubleshooting.
        </p>

        <div className="mb-6 mt-5">
          <FlowJourneyStrip variant="payee-unshield" />
        </div>

        <div className="app-card mt-2">
          <h2 className="flex flex-wrap items-baseline gap-1.5 text-sm font-semibold text-slate-900">
            <span>1. Your private-payroll key</span>
            <InfoTip text={TIP.withdrawKey} />
          </h2>
          {keypair ? (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-slate-500">
                <span className="text-slate-800">Public part (64 hex)</span> — for your <strong>employer</strong> to
                pay the shielded pool, <span className="text-amber-800">not</span> the same as your Solana/Phantom
                address in step 3.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <p className="min-w-0 flex-1 break-all font-mono text-xs text-slate-800">
                  {bigintToHex(keypair.publicKey)}
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(bigintToHex(keypair.publicKey));
                      setErr(null);
                      copyFlash("64-hex copied");
                    } catch {
                      setErr("Copy failed — select the hex and copy manually.");
                    }
                  }}
                  className="btn-secondary w-full shrink-0 sm:mt-0 sm:w-auto"
                  title={TIP.copyPublicHex}
                >
                  Copy 64-hex
                </button>
              </div>
              {copyStatus && keypair && (
                <p className="text-xs text-emerald-800" role="status" aria-live="polite">
                  {copyStatus}
                </p>
              )}
              <p className="text-[11px] text-slate-600">
                Payout to Phantom only happens in step 4, after a JSON from your employer, your wallet, and
                “Unshield”. A <strong>transaction link</strong> below means it worked.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void makeNewKey()}
                  className="btn-secondary"
                  disabled={!!loading}
                  title={TIP.generatePayeeKey}
                >
                  Generate new key (replaces this browser)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void clearPayeeUtxoKeypair();
                    setKeypair(null);
                  }}
                  className="text-xs text-slate-500 underline hover:text-slate-800"
                >
                  Clear from this device
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-amber-900">
              No key in this browser. Open{" "}
              <Link href="/payee" className="font-medium text-indigo-600 hover:text-indigo-800">
                Payee
              </Link>{" "}
              to generate, or import a JSON backup here.
            </p>
          )}

          <div className="mt-4 border-t border-indigo-100/50 pt-4">
            <div>
              <label htmlFor={importTextareaId} className="block">
                <span className="app-label flex w-full items-baseline justify-between gap-1">
                  <span className="tracking-wide">Import key backup (paste or load file)</span>
                  <InfoTip text={TIP.importKeyJson} className="translate-y-px" />
                </span>
              </label>
              <p className="mt-1 text-xs text-slate-500">
                Same object as the Payee <strong>Download</strong> / <strong>Copy as JSON</strong> — two decimal
                strings, <code className="text-slate-700">{"privateKey"}</code> and{" "}
                <code className="text-slate-700">{"publicKey"}</code>.
              </p>
              <p className="text-xs text-slate-500">
                <code className="text-slate-700">{"{ \"privateKey\": \"...\", \"publicKey\": \"...\" }"}</code>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                aria-label="Load key backup from a JSON file"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  try {
                    const s = await f.text();
                    setImportKeyText(s);
                    setErr(null);
                  } catch (ex) {
                    setErr(ex instanceof Error ? ex.message : "Could not read file");
                  }
                }}
              />
              <textarea
                id={importTextareaId}
                className="app-input font-mono text-xs"
                rows={3}
                value={importKeyText}
                onChange={(e) => {
                  setImportKeyText(e.target.value);
                  setErr(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && importKeyText.trim()) {
                    e.preventDefault();
                    onImportKey();
                  }
                }}
                placeholder='{"privateKey":"…","publicKey":"…"}'
                title={TIP.importKeyJson}
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onImportKey}
                  className="btn-secondary"
                  disabled={!importKeyText.trim()}
                  title="Load this JSON into this browser and replace the stored UTXO key if valid."
                >
                  Import
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Load from file…
                </button>
                <span className="text-xs text-slate-400" aria-hidden>
                  ·
                </span>
                <span className="text-xs text-slate-500">Ctrl+Enter in the box also runs Import</span>
              </div>
            </div>
          </div>
        </div>

        <div className="app-card mt-5">
          <h2 className="flex flex-wrap items-baseline gap-1.5 text-sm font-semibold text-slate-900">
            <span>2. JSON from your employer (after they paid a line)</span>
            <InfoTip text={TIP.paymentBundle} />
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Paste the <strong>whole</strong> file or message you received — the same format they copied from “Payee
            payment bundles” in their Treasury app.
          </p>
          <textarea
            className="app-input font-mono text-xs"
            rows={8}
            value={bundleText}
            onChange={(e) => setBundleText(e.target.value)}
            placeholder='{ "v": 1, "label": "Payee 1", "amount": "10000000", ... }'
            title={TIP.paymentBundle}
          />
        </div>

        <div className="app-card mt-5">
          <h2 className="flex flex-wrap items-baseline gap-1.5 text-sm font-semibold text-slate-900">
            <span>3. Which Phantom should receive the USDC</span>
            <InfoTip text={TIP.withdrawWallet} />
          </h2>
          <p className="mt-1 text-xs text-slate-500">Connect the wallet in the header — you sign the unshield to that address.</p>
          <div
            className="mt-3 flex flex-wrap items-center gap-3"
            title={TIP.walletConnect}
          >
            <WalletMultiButton />
            {connected && publicKey && (
              <span className="font-mono text-xs text-slate-500">{publicKey.toBase58()}</span>
            )}
          </div>
          {publicUsdc && <p className="mt-3 text-xs text-slate-500">{publicUsdc}</p>}
        </div>

        <div className="mt-5">
          <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-slate-500 md:text-left">4. Confirm</p>
          <button
            type="button"
            onClick={() => void onWithdraw()}
            disabled={!!loading || !bundleText.trim() || !keypair}
            className="btn-primary w-full min-h-[2.75rem] sm:w-auto"
            title={TIP.unshieldButton}
          >
            Unshield to connected Phantom
          </button>
        </div>

        {importOk && !err && (
          <div
            className="mt-5 rounded-lg border border-emerald-200/90 bg-emerald-50/95 px-4 py-3 text-sm text-emerald-950"
            role="status"
          >
            {importOk}
          </div>
        )}
        {err && (
          <div
            className="mt-5 whitespace-pre-wrap break-words rounded-lg border border-red-200/90 bg-red-50/95 px-4 py-3 text-sm text-red-900"
            role="alert"
          >
            {err}
          </div>
        )}
        {loading && (
          <p className="mt-4 text-sm text-indigo-800" aria-live="polite">
            {loading}
          </p>
        )}
        {lastSig && (
          <div className="app-card mt-4 text-sm text-slate-600">
            <p className="text-slate-800">Unshield complete.</p>
            <a
              className="mt-1 inline-block break-all text-indigo-600 hover:text-indigo-800"
              href={solscanTransactionUrl(lastSig)}
              target="_blank"
              rel="noreferrer"
            >
              {lastSig}
            </a>
          </div>
        )}

        <p className="mt-6 text-sm text-slate-500">
          <Link className="text-indigo-600 hover:text-indigo-800" href="/payee">
            ← Payee
          </Link>
          <span className="mx-2">·</span>
          <Link className="text-indigo-600 hover:text-indigo-800" href="/">
            Treasury
          </Link>
        </p>
      </div>
    </div>
  );
}
