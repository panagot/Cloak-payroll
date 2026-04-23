"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useCallback, useEffect, useState } from "react";
import { USDC_MINT } from "@/lib/constants";
import { withdrawUtxoToPublicWallet } from "@/lib/cloak/payee-withdraw";
import { formatCloakError } from "@/lib/cloak/errors";
import { formatUsdcFromUnits } from "@/lib/amounts";
import { parsePayeeBundleJson, utxoFromBundle, type PayeePaymentBundle } from "@/lib/payee-bundle";
import {
  clearPayeeUtxoKeypair,
  loadPayeeUtxoKeypair,
  savePayeeUtxoKeypair,
} from "@/lib/payee-key-storage";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { bigintToHex, generateUtxoKeypair, type UtxoKeypair } from "@cloak.dev/sdk";
import Link from "next/link";
import { AppLabelWithTip, InfoTip } from "@/components/ui/InfoTip";
import { LINKS } from "@/lib/site-links";
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

  useEffect(() => {
    setKeypair(loadPayeeUtxoKeypair());
  }, []);

  const onImportKey = () => {
    setErr(null);
    try {
      const j: unknown = JSON.parse(importKeyText.trim());
      if (!j || typeof j !== "object" || !("privateKey" in j) || !("publicKey" in j)) {
        throw new Error("Expected { privateKey, publicKey } as strings.");
      }
      const p = (j as { privateKey: string; publicKey: string }).privateKey;
      const pub = (j as { privateKey: string; publicKey: string }).publicKey;
      const kp: UtxoKeypair = { privateKey: BigInt(p), publicKey: BigInt(pub) };
      savePayeeUtxoKeypair(kp);
      setKeypair(kp);
      setImportKeyText("");
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
      setErr("Set your receive key here (or import a backup), or go to Payee keys first.");
      return;
    }
    let bundle: PayeePaymentBundle;
    try {
      bundle = parsePayeeBundleJson(bundleText.trim());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Paste the JSON bundle the treasury sent after payment.");
      return;
    }
    setLoading("Building UTXO and withdrawing to your wallet (proof + sign)…");
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
    <div className="min-h-0 bg-slate-950">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 50% -10%, rgba(14, 165, 233, 0.12), transparent), #020617",
        }}
        aria-hidden
      />
      <div
        id="section-withdraw-panel"
        className="mx-auto max-w-3xl scroll-mt-24 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400/85">
          Unshield to your wallet
        </p>
        <h1 className="mt-1.5 flex flex-wrap items-baseline gap-2 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
          <span>Send USDC to my Solana wallet</span>
          <InfoTip text={TIP.unshieldButton} className="translate-y-0.5" />
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          After a treasury has paid you privately, they share a <span className="text-slate-200">payment bundle</span> (JSON) from
          the payroll result. You paste it here, connect the wallet that should <span className="text-slate-200">receive the public
          USDC</span> (e.g. Phantom), and we run one Cloak withdraw to that wallet&apos;s address.
        </p>

        <ol className="mt-4 list-decimal space-y-1.5 pl-4 text-sm text-slate-500">
          <li>Keep the same <strong className="text-slate-300">UTXO receive key</strong> you used on the Payee keys page (or import a backup below).</li>
          <li>Paste the <strong className="text-slate-300">payment bundle</strong> JSON the treasury sent after a successful line.</li>
          <li>Connect your Solana wallet — that address receives the visible USDC when you unshield.</li>
        </ol>
        <p className="mt-3 text-xs text-slate-500">
          Details:{" "}
          <a
            className="text-sky-400/90 hover:text-sky-300"
            href={LINKS.sdkDocs}
            target="_blank"
            rel="noreferrer"
            title="Cloak SDK: transaction building, UTXO model, and API reference (opens in a new tab)."
          >
            Cloak SDK
          </a>
          .
        </p>

        <div className="app-card mt-6">
          <h2 className="flex flex-wrap items-baseline gap-1.5 text-sm font-semibold text-slate-200">
            <span>1. Your UTXO receive key</span>
            <InfoTip text={TIP.withdrawKey} />
          </h2>
          {keypair ? (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-slate-500">
                UTXO public (share with treasuries) — 64 hex
              </p>
              <p className="break-all font-mono text-xs text-slate-300">
                {bigintToHex(keypair.publicKey)}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={makeNewKey}
                  className="btn-secondary"
                  disabled={!!loading}
                  title={TIP.generatePayeeKey}
                >
                  Generate a new key (replaces this browser&apos;s key)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void clearPayeeUtxoKeypair();
                    setKeypair(null);
                  }}
                  className="text-xs text-slate-500 underline hover:text-slate-300"
                >
                  Clear from this device
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-amber-200/90">
              No key in this browser. Open{" "}
              <Link href="/payee" className="font-medium text-sky-400 hover:text-sky-300">Payee keys</Link> and generate one, or import a
              saved backup.
            </p>
          )}

          <div className="mt-4 border-t border-slate-800/80 pt-4">
            <label>
              <AppLabelWithTip label="Import key backup (JSON from file)" tip={TIP.importKeyJson} />
              <p className="text-xs text-slate-500">
                <code className="text-slate-400">{"{ \"privateKey\": \"...\", \"publicKey\": \"...\" }"}</code>
              </p>
              <textarea
                className="app-input font-mono text-xs"
                rows={3}
                value={importKeyText}
                onChange={(e) => setImportKeyText(e.target.value)}
                placeholder='{"privateKey":"…","publicKey":"…"}'
                title={TIP.importKeyJson}
              />
              <button
                type="button"
                onClick={onImportKey}
                className="btn-secondary mt-2"
                disabled={!importKeyText.trim() || !!loading}
                title="Load this JSON into this browser and replace the stored UTXO key if valid."
              >
                Import
              </button>
            </label>
          </div>
        </div>

        <div className="app-card mt-5">
          <h2 className="flex flex-wrap items-baseline gap-1.5 text-sm font-semibold text-slate-200">
            <span>2. Payment bundle (from treasury)</span>
            <InfoTip text={TIP.paymentBundle} />
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Paste the entire JSON the treasury copies after a successful private payroll to your UTXO key.
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
          <h2 className="flex flex-wrap items-baseline gap-1.5 text-sm font-semibold text-slate-200">
            <span>3. Destination wallet (public USDC)</span>
            <InfoTip text={TIP.withdrawWallet} />
          </h2>
          <p className="mt-1 text-xs text-slate-500">Use the same wallet in the header to sign the withdraw.</p>
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
          <button
            type="button"
            onClick={() => void onWithdraw()}
            disabled={!!loading || !bundleText.trim() || !keypair}
            className="btn-primary w-full min-h-[2.75rem] sm:w-auto"
            title={TIP.unshieldButton}
          >
            Unshield USDC to connected wallet
          </button>
        </div>

        {err && (
          <div
            className="mt-5 rounded-lg border border-red-500/35 bg-red-950/50 px-4 py-3 text-sm text-red-100"
            role="alert"
          >
            {err}
          </div>
        )}
        {loading && (
          <p className="mt-4 text-sm text-sky-200/90" aria-live="polite">
            {loading}
          </p>
        )}
        {lastSig && (
          <div className="app-card mt-4 text-sm text-slate-400">
            <p className="text-slate-200">Unshield complete.</p>
            <a
              className="mt-1 inline-block break-all text-sky-400 hover:text-sky-300"
              href={`https://solscan.io/tx/${lastSig}`}
              target="_blank"
              rel="noreferrer"
            >
              {lastSig}
            </a>
          </div>
        )}

        <p className="mt-6 text-sm text-slate-500">
          <Link className="text-sky-400/90 hover:text-sky-300" href="/payee">
            ← Payee keys
          </Link>
          <span className="mx-2">·</span>
          <Link className="text-sky-400/90 hover:text-sky-300" href="/">
            Treasury
          </Link>
        </p>
      </div>
    </div>
  );
}
