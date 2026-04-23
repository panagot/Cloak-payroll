"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { useCallback, useEffect, useState } from "react";
import { ensureAdminUtxoKeypair } from "@/lib/admin-utxo";
import { formatUsdcFromUnits, parseUsdcToUnits } from "@/lib/amounts";
import { formatCloakError } from "@/lib/cloak/errors";
import { scanWithAdminViewingKey } from "@/lib/cloak/history";
import {
  buildViewingKeyNkFromAdminKp,
  depositUsdc,
  pickAdminChangeUtxo,
  type PayrollLine,
  runPayrollTransfers,
} from "@/lib/cloak/payroll";
import type { PayeePaymentBundle } from "@/lib/payee-bundle";
import { CLOAK_PROGRAM_ID, USDC_MINT } from "@/lib/constants";
import {
  clearSpendableUtxo,
  loadSpendableUtxo,
  saveSpendableUtxo,
} from "@/lib/spendable-utxo";
import { bigintToHex, sumUtxoAmounts, type Utxo, type UtxoKeypair } from "@cloak.dev/sdk";
import type { ComplianceReport, MerkleTree } from "@cloak.dev/sdk";
import { InfoTip } from "@/components/ui/InfoTip";
import { TIP } from "@/lib/ui-tips";
import { PayrollHero } from "../shell/PayrollHero";
import { RecipientTable } from "./RecipientTable";

const DEMO_LINES: PayrollLine[] = [
  { label: "Payee 1", recipientUtxoPubkeyHex: "", amount: "" },
  { label: "Payee 2", recipientUtxoPubkeyHex: "", amount: "" },
];

function nkToHex(nk: Uint8Array) {
  return Array.from(nk)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function StepBadge({ n, label, tip }: { n: number; label: string; tip?: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sky-500/15 text-xs font-bold text-sky-400 ring-1 ring-sky-500/25">
        {n}
      </span>
      <h2 className="flex items-center gap-1 text-sm font-semibold text-slate-100">
        {label}
        {tip ? <InfoTip text={tip} /> : null}
      </h2>
    </div>
  );
}

export function PayrollDashboard() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signMessage, connected, disconnecting } =
    useWallet();

  const [adminKp, setAdminKp] = useState<UtxoKeypair | null>(null);
  const [utxo, setUtxo] = useState<Utxo | null>(null);
  const [merkle, setMerkle] = useState<MerkleTree | undefined>(undefined);
  const [lines, setLines] = useState<PayrollLine[]>(DEMO_LINES);
  const [depositInput, setDepositInput] = useState("10");
  const [loading, setLoading] = useState<null | { msg: string }>(null);
  const [err, setErr] = useState<string | null>(null);
  const [lastSigs, setLastSigs] = useState<string[]>([]);
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [publicAtaInfo, setPublicAtaInfo] = useState<string | null>(null);
  const [viewKeyHex, setViewKeyHex] = useState<string | null>(null);
  const [viewKeyRevealed, setViewKeyRevealed] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [payeeBundles, setPayeeBundles] = useState<PayeePaymentBundle[]>([]);

  useEffect(() => {
    let c = true;
    void (async () => {
      const a = await ensureAdminUtxoKeypair();
      if (!c) return;
      setAdminKp(a);
      setViewKeyHex(nkToHex(buildViewingKeyNkFromAdminKp(a)));
    })();
    return () => {
      c = false;
    };
  }, []);

  useEffect(() => {
    if (!connected) return;
    void (async () => {
      const u = await loadSpendableUtxo();
      setUtxo(u);
    })();
  }, [connected]);

  const refreshPublicUsdc = useCallback(async () => {
    if (!publicKey) return;
    setErr(null);
    try {
      const ata = await getAssociatedTokenAddress(USDC_MINT, publicKey);
      const a = await getAccount(connection, ata);
      setPublicAtaInfo(
        `Visible USDC in this wallet: ${formatUsdcFromUnits(BigInt(a.amount))} (on-chain, public).`
      );
    } catch {
      setPublicAtaInfo(
        "No USDC token account yet — fund this wallet with USDC before shielding."
      );
    }
  }, [connection, publicKey]);

  useEffect(() => {
    if (connected && publicKey) {
      void refreshPublicUsdc();
    }
  }, [connected, publicKey, refreshPublicUsdc]);

  const requireReady = useCallback(() => {
    if (!publicKey || !signTransaction || !signMessage) {
      throw new Error("Connect Phantom and allow message + transaction signing.");
    }
    if (!adminKp) {
      throw new Error("Treasury key is still loading.");
    }
    if (disconnecting) {
      throw new Error("Wallet is disconnecting — try again.");
    }
    return {
      wallet: publicKey,
      signTransaction,
      signMessage,
      adminKp,
    };
  }, [publicKey, signTransaction, signMessage, adminKp, disconnecting]);

  const onDeposit = async () => {
    setErr(null);
    let units: bigint;
    try {
      units = parseUsdcToUnits(depositInput);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Invalid amount");
      return;
    }
    if (units <= 0n) {
      setErr("Enter a positive USDC amount.");
      return;
    }
    setLoading({ msg: "Shields USDC in the pool — proving & signing (may take a moment)…" });
    try {
      const w = requireReady();
      const res = await depositUsdc(
        connection,
        w.wallet,
        w.signTransaction,
        w.signMessage,
        units,
        w.adminKp,
        merkle
      );
      const next = pickAdminChangeUtxo(res.outputUtxos, w.adminKp);
      if (!next) {
        throw new Error("Expected a shielded admin UTXO after deposit.");
      }
      setUtxo(next);
      saveSpendableUtxo(next);
      setMerkle(res.merkleTree);
      setLastSigs([res.signature]);
    } catch (e) {
      setErr(formatCloakError(e));
    } finally {
      setLoading(null);
    }
  };

  const onRunPayroll = async () => {
    setErr(null);
    const w = requireReady();
    if (!utxo) {
      setErr("No shielded balance — run “Shield USDC” first, or clear site storage if something is stuck.");
      return;
    }
    const toSend: { line: PayrollLine; amountUnits: bigint }[] = [];
    for (const l of lines) {
      if (!l.recipientUtxoPubkeyHex.trim() || !l.amount.trim()) {
        continue;
      }
      let u: bigint;
      try {
        u = parseUsdcToUnits(l.amount);
      } catch {
        setErr(`Invalid amount for “${l.label}”.`);
        return;
      }
      if (u <= 0n) continue;
      toSend.push({ line: l, amountUnits: u });
    }
    if (toSend.length === 0) {
      setErr("Add at least one line with a 64-hex UTXO public key and a positive USDC amount.");
      return;
    }
    const total = toSend.reduce((a, b) => a + b.amountUnits, 0n);
    if (sumUtxoAmounts([utxo]) < total) {
      setErr(
        `Shielded balance too low. Need ${formatUsdcFromUnits(total)}; have ${formatUsdcFromUnits(
          sumUtxoAmounts([utxo])
        )}.`
      );
      return;
    }
    setLoading({ msg: "Paying in sequence — one private transfer per line…" });
    try {
      const resolved = toSend.map((x) => ({
        label: x.line.label,
        recipientUtxoPubkeyHex: x.line.recipientUtxoPubkeyHex,
        amountUnits: x.amountUnits,
      }));
      const { lastUtxo, lastMerkle, signatures, payeeBundles: bundles } =
        await runPayrollTransfers(
          connection,
          w.wallet,
          w.signTransaction,
          w.signMessage,
          w.adminKp,
          utxo,
          resolved,
          (m) => setLoading({ msg: m })
        );
      setMerkle(lastMerkle);
      setLastSigs(signatures);
      setPayeeBundles(bundles);
      if (lastUtxo) {
        setUtxo(lastUtxo);
        saveSpendableUtxo(lastUtxo);
      } else {
        setUtxo(null);
        clearSpendableUtxo();
      }
    } catch (e) {
      setErr(formatCloakError(e));
    } finally {
      setLoading(null);
    }
  };

  const onScan = async () => {
    setErr(null);
    const w = requireReady();
    if (!w.wallet) return;
    setLoading({ msg: "Syncing on-chain history…" });
    setReport(null);
    try {
      const { report: r } = await scanWithAdminViewingKey(
        connection,
        w.adminKp,
        w.wallet
      );
      setReport(r);
    } catch (e) {
      setErr(formatCloakError(e));
    } finally {
      setLoading(null);
    }
  };

  const shieldedBal = utxo && utxo.amount > 0n ? sumUtxoAmounts([utxo]) : 0n;
  const adminUtxoPub = adminKp
    ? "0x" + bigintToHex(adminKp.publicKey)
    : "—";

  return (
    <div className="min-h-0 bg-slate-950">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(14, 165, 233, 0.15), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(100, 116, 139, 0.08), transparent), #020617",
        }}
        aria-hidden
      />

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PayrollHero />

        {!connected && (
          <p className="mb-5 rounded-lg border border-slate-800/80 bg-slate-900/40 px-3 py-2.5 text-sm text-slate-400">
            Connect a wallet in the header to begin — the same wallet will hold public USDC to shield and will sign each Cloak transaction.
          </p>
        )}

        {publicAtaInfo && connected && (
          <p
            className={
              "mb-6 text-sm " +
              (publicAtaInfo.startsWith("No") ? "text-amber-200/90" : "text-slate-400")
            }
          >
            {publicAtaInfo}
          </p>
        )}

        {err && (
          <div
            className="mb-6 rounded-lg border border-red-500/35 bg-red-950/50 px-4 py-3 text-sm text-red-100 shadow-sm"
            role="alert"
          >
            {err}
          </div>
        )}

        {loading && (
          <div
            className="mb-6 rounded-lg border border-sky-500/25 bg-sky-500/5 px-4 py-3 text-sm text-sky-100/95"
            aria-live="polite"
          >
            {loading.msg}
          </div>
        )}

        {connected && adminKp && (
          <section
            id="section-treasury-utxo"
            className="app-card mb-5 scroll-mt-24"
          >
            <h2 className="flex items-center gap-1 text-sm font-semibold text-slate-200">
              Treasury UTXO
              <InfoTip text={TIP.treasuryUtxo} />
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">Shielded change stays on this key in this browser.</p>
            <p className="mt-3 break-all rounded-md bg-slate-950/50 px-3 py-2 font-mono text-xs text-slate-300 ring-1 ring-slate-800/80">
              {adminUtxoPub}
            </p>
            <dl className="mt-4 flex flex-wrap items-baseline gap-6">
              <div>
                <dt className="flex items-center gap-1 text-xs text-slate-500">
                  Shielded (private)
                  <InfoTip text={TIP.shieldedBalance} className="translate-y-px" />
                </dt>
                <dd className="text-lg font-semibold tabular-nums text-sky-300">
                  {utxo ? formatUsdcFromUnits(shieldedBal) : "0"}{" "}
                  <span className="text-sm font-medium text-slate-500">USDC</span>
                </dd>
              </div>
            </dl>
          </section>
        )}

        {connected && (
          <section
            id="section-shield"
            className="app-card mb-5 scroll-mt-24"
          >
            <StepBadge n={1} label="Shield USDC" tip={TIP.shieldStep} />
            <p className="text-sm text-slate-500">From your wallet’s public USDC balance. Start small on mainnet.</p>
            <div className="mt-4 flex max-w-md flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <span className="app-label flex w-full items-baseline justify-between gap-1">
                  <span>Amount (USDC)</span>
                  <InfoTip text={TIP.shieldAmount} className="translate-y-px" />
                </span>
                <input
                  className="app-input"
                  value={depositInput}
                  onChange={(e) => setDepositInput(e.target.value)}
                  inputMode="decimal"
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                disabled={!!loading}
                onClick={() => void onDeposit()}
                className="btn-primary shrink-0"
                title="Deposit public USDC from your connected wallet into the shielded pool for this session."
              >
                Shield USDC
              </button>
            </div>
          </section>
        )}

        {connected && (
          <section
            id="section-payees"
            className="app-card mb-5 scroll-mt-24"
          >
            <StepBadge n={2} label="Payee lines" tip={TIP.runPayroll} />
            <p className="mb-3 text-sm text-slate-500">
              64-hex UTXO keys from{" "}
              <a className="text-sky-400/90 hover:text-sky-300" href="/payee">Payee keys</a>
              . Empty rows skipped.
            </p>
            <RecipientTable lines={lines} onChange={setLines} />
          </section>
        )}

        {connected && (
          <div
            id="section-actions"
            className="mb-6 flex flex-col gap-3 scroll-mt-24 sm:flex-row sm:items-stretch sm:gap-3"
          >
            <button
              type="button"
              disabled={!!loading}
              onClick={() => void onRunPayroll()}
              className="btn-primary min-h-[2.75rem] flex-1"
              title={TIP.runPayroll}
            >
              Run private payroll
            </button>
            <button
              type="button"
              disabled={!!loading}
              onClick={() => void onScan()}
              className="btn-secondary min-h-[2.75rem] sm:max-w-xs"
              title={TIP.reconcile}
            >
              Reconcile
            </button>
          </div>
        )}

        {payeeBundles.length > 0 && (
          <section
            id="section-payee-bundles"
            className="app-card mb-6 scroll-mt-24"
          >
            <h3 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Payee payment bundles
              <InfoTip text={TIP.payeeBundle} />
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Send each JSON to the payee (email, chat). They paste it on the{" "}
              <a
                className="text-sky-400/90 underline decoration-sky-500/30 hover:text-sky-300"
                href="/withdraw"
              >
                To wallet
              </a>{" "}
              tab with the same UTXO receive key they used here.
            </p>
            <ul className="mt-3 space-y-3">
              {payeeBundles.map((b, i) => (
                <li
                  key={`${b.transferSignature}-${i}`}
                  className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3"
                >
                  <p className="text-xs text-slate-500">
                    {b.label} — {formatUsdcFromUnits(BigInt(b.amount))} USDC
                  </p>
                  <button
                    type="button"
                    className="btn-secondary mt-2 text-xs"
                    title={TIP.copyBundle}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          JSON.stringify(b, null, 2)
                        );
                      } catch {
                        setErr("Could not copy to clipboard");
                      }
                    }}
                  >
                    Copy JSON
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {lastSigs.length > 0 && (
          <section
            id="section-transactions"
            className="app-card mb-6 scroll-mt-24 text-sm text-slate-400"
          >
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Transactions
            </h3>
            <ul className="space-y-1.5 break-all font-mono text-xs text-slate-500">
              {lastSigs.map((s) => (
                <li key={s}>
                  <a
                    className="text-sky-400 underline decoration-sky-500/30 underline-offset-2 hover:text-sky-300"
                    href={`https://solscan.io/tx/${s}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {report && report.transactions.length > 0 && (
          <section
            id="section-reconciliation"
            className="app-card mb-6 scroll-mt-24"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Reconciliation
            </h3>
            <div className="mt-3 overflow-x-auto rounded-lg ring-1 ring-slate-800/80">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800/90 bg-slate-950/80 text-xs text-slate-500">
                    <th className="p-3 font-medium">Type</th>
                    <th className="p-3 font-medium">Net</th>
                    <th className="p-3 font-medium">Time</th>
                    <th className="p-3 font-medium">Tx</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {report.transactions.slice(0, 20).map((t, i) => (
                    <tr key={i} className="border-b border-slate-800/60 last:border-0">
                      <td className="p-3 align-top text-slate-200">{t.txType}</td>
                      <td className="p-3 align-top tabular-nums">
                        {t.netAmount} {t.symbol}
                      </td>
                      <td className="p-3 align-top text-slate-500">
                        {new Date(t.timestamp).toLocaleString()}
                      </td>
                      <td className="p-2 align-top font-mono text-[10px] leading-relaxed text-slate-500">
                        {t.signature}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Showing 20 of {report.transactions.length} rows
            </p>
          </section>
        )}

        {viewKeyHex && (
          <section
            id="section-viewing-key"
            className="mb-8 scroll-mt-24 rounded-xl border border-amber-500/20 bg-amber-950/25 p-5 text-sm text-amber-100/90 ring-1 ring-amber-500/10"
          >
            <h3 className="flex items-center gap-1 text-sm font-semibold text-amber-200/95">
              Viewing key
              <InfoTip text={TIP.viewKey} className="[&_button]:border-amber-500/30 [&_button]:text-amber-300/90 [&_button]:hover:text-amber-200" />
            </h3>
            <p className="mt-1 text-amber-100/70">
              The nk can decrypt on-chain history for this treasury. Store offline; never
              share in public channels.
            </p>
            {viewKeyRevealed ? (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start">
                <code className="max-h-40 min-w-0 flex-1 overflow-auto break-all rounded-md bg-slate-950/60 p-3 font-mono text-[10px] leading-relaxed text-amber-50/95 ring-1 ring-slate-800/60">
                  {viewKeyHex}
                </code>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(viewKeyHex);
                    } catch {
                      setErr("Could not copy to clipboard");
                    }
                  }}
                  className="btn-secondary shrink-0"
                >
                  Copy
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setViewKeyRevealed(true)}
                className="mt-3 text-left text-sm font-medium text-amber-300/95 underline decoration-amber-500/40 underline-offset-2 hover:text-amber-200"
              >
                Reveal 32-byte key (hex)
              </button>
            )}
          </section>
        )}

        <div className="pt-2 text-xs text-slate-600">
          <button
            type="button"
            onClick={() => setShowAdvanced((s) => !s)}
            className="text-slate-500 underline decoration-slate-600 underline-offset-2 hover:text-slate-400"
          >
            {showAdvanced ? "Hide" : "Show"} Cloak program ID
          </button>
          {showAdvanced && (
            <p className="mt-2 break-all font-mono text-slate-500">
              {CLOAK_PROGRAM_ID.toBase58()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
