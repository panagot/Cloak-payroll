"use client";

import { bigintToHex, type UtxoKeypair } from "@cloak.dev/sdk";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useState } from "react";
import { InfoTip } from "@/components/ui/InfoTip";
import { useTimedMessage } from "@/hooks/use-timed-message";
import { usdcClusterBadge } from "@/lib/constants";
import { loadMerchantUtxoKeypair, saveMerchantUtxoKeypair } from "@/lib/merchant-utxo-storage";
import { CLOAK_PAY } from "@/lib/site-links";
import { TIP } from "@/lib/ui-tips";
import { CloakPayPageHeader } from "./CloakPayPageHeader";

const LS_KEY = "cloakpay_merchant_demo_v1";
const PRESETS = ["5.00", "10.00", "20.00", "open"];

type LsShape = { displayName: string; preset: string; policy: string };

const defaultState: LsShape = {
  displayName: "Demo Street Café",
  preset: PRESETS[0],
  policy: "All sales are final. Contact support for refunds — email …",
};

function merchantKeypairJsonString(k: UtxoKeypair, pretty = true): string {
  const o = { privateKey: k.privateKey.toString(), publicKey: k.publicKey.toString() };
  return pretty ? JSON.stringify(o, null, 2) : JSON.stringify(o);
}

function loadLs(): LsShape {
  if (typeof window === "undefined") return defaultState;
  try {
    const r = localStorage.getItem(LS_KEY);
    if (!r) return defaultState;
    const j = JSON.parse(r) as Partial<LsShape>;
    return {
      displayName: typeof j.displayName === "string" ? j.displayName : defaultState.displayName,
      preset: typeof j.preset === "string" && (PRESETS as readonly string[]).includes(j.preset) ? j.preset : defaultState.preset,
      policy: typeof j.policy === "string" ? j.policy : defaultState.policy,
    };
  } catch {
    return defaultState;
  }
}

export function CloakPayMerchantPage() {
  const [utxoKp, setUtxoKp] = useState<UtxoKeypair | null>(null);
  const [utxoErr, setUtxoErr] = useState<string | null>(null);
  const [utxoWorking, setUtxoWorking] = useState(false);
  const { message: copyStatus, flash: copyFlash } = useTimedMessage(2200);
  const [displayName, setDisplayName] = useState(defaultState.displayName);
  const [preset, setPreset] = useState(defaultState.preset);
  const [policy, setPolicy] = useState(defaultState.policy);
  const [linkAmount, setLinkAmount] = useState("");
  const [absPayUrl, setAbsPayUrl] = useState<string | null>(null);
  const [linkCopyFlash, setLinkCopyFlash] = useState(false);
  const id = useId();

  const keyJson = useMemo(() => (utxoKp ? merchantKeypairJsonString(utxoKp) : ""), [utxoKp]);

  useEffect(() => {
    setUtxoKp(loadMerchantUtxoKeypair());
  }, []);

  useEffect(() => {
    const s = loadLs();
    setDisplayName(s.displayName);
    setPreset(s.preset);
    setPolicy(s.policy);
  }, []);

  useEffect(() => {
    if (preset === "open") setLinkAmount("");
    else setLinkAmount(preset);
  }, [preset]);

  const pathWithQuery = useMemo(() => {
    if (!utxoKp) return "";
    const q = new URLSearchParams();
    q.set("source", "qr");
    q.set("label", displayName.slice(0, 80) || "Business");
    const a = linkAmount.trim();
    if (a) q.set("amount", a);
    q.set("mpk", bigintToHex(utxoKp.publicKey));
    return `${CLOAK_PAY.path}/pay?${q.toString()}`;
  }, [utxoKp, displayName, linkAmount]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (!pathWithQuery) {
      setAbsPayUrl(null);
      return;
    }
    setAbsPayUrl((prev) => {
      const next = new URL(pathWithQuery, window.location.origin).href;
      return next === prev ? prev : next;
    });
  }, [pathWithQuery]);

  const qrImageSrcLg = useMemo(() => {
    if (!absPayUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(absPayUrl)}`;
  }, [absPayUrl]);

  const onCopyPayLink = useCallback(async () => {
    if (typeof window === "undefined" || !pathWithQuery) return;
    const full = new URL(pathWithQuery, window.location.origin).href;
    try {
      await navigator.clipboard.writeText(full);
      setLinkCopyFlash(true);
      setTimeout(() => setLinkCopyFlash(false), 2000);
    } catch {
      setLinkCopyFlash(false);
    }
  }, [pathWithQuery]);

  const payPreviewQuery = useMemo(() => {
    const q = new URLSearchParams();
    q.set("source", "link");
    q.set("label", displayName.trim() || "Payee");
    if (preset !== "open") q.set("amount", preset);
    if (utxoKp) q.set("mpk", bigintToHex(utxoKp.publicKey));
    return `${CLOAK_PAY.path}/pay?${q.toString()}`;
  }, [displayName, preset, utxoKp]);

  const makeReceiveKey = async () => {
    if (utxoWorking) return;
    setUtxoErr(null);
    setUtxoWorking(true);
    try {
      // Load SDK + run Poseidon init in browser (first time can take several seconds; no progress API).
      const { generateUtxoKeypair } = await import("@cloak.dev/sdk");
      const withTimeout = <T,>(p: Promise<T>, ms: number) =>
        new Promise<T>((resolve, reject) => {
          const t = window.setTimeout(
            () =>
              reject(
                new Error(
                  "Timed out waiting for key generation. WebAssembly may be blocked. Try a normal (non-strict) window or another browser, or use Payee keys in the main app to confirm the SDK works."
                )
              ),
            ms
          );
          p.then(
            (v) => {
              window.clearTimeout(t);
              resolve(v);
            },
            (e) => {
              window.clearTimeout(t);
              reject(e);
            }
          );
        });
      const next = await withTimeout(generateUtxoKeypair(), 60_000);
      setUtxoKp(next);
      try {
        saveMerchantUtxoKeypair(next);
      } catch (e) {
        setUtxoErr(
          e instanceof Error
            ? `Key created, but it could not be stored in this browser: ${e.message} — use Copy as JSON to keep a backup.`
            : "Key created, but it could not be stored (e.g. private mode or storage full) — use Copy as JSON to keep a backup."
        );
      }
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === "string"
            ? e
            : e != null && typeof (e as { message?: string }).message === "string"
              ? (e as { message: string }).message
              : "Key generation failed — try a normal browser window with storage enabled.";
      setUtxoErr(msg);
    } finally {
      setUtxoWorking(false);
    }
  };

  const tryRegenerateReceiveKey = () => {
    if (typeof window === "undefined" || !utxoKp || utxoWorking) return;
    if (
      window.confirm(
        "Replace the merchant receive key? Back up the current JSON first if you might still receive to this UTXO; a new key is unrelated to the old one."
      )
    ) {
      void makeReceiveKey();
    }
  };

  const downloadUtxoBackup = () => {
    if (!utxoKp) return;
    const blob = new Blob([keyJson], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cloak-merchant-utxo-key.json";
    a.click();
    URL.revokeObjectURL(a.href);
    copyFlash("File downloaded");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({ displayName, preset, policy } satisfies LsShape));
      } catch {
        // ignore
      }
    }, 500);
    return () => window.clearTimeout(t);
  }, [displayName, preset, policy]);

  const presetLine =
    preset === "open" ? "Customer types their own USDC amount at checkout." : `Suggested: ${preset} USDC.`;

  return (
    <>
    <div className="print:hidden">
    <div className="py-6 sm:py-8 lg:py-10">
      <CloakPayPageHeader
        kicker="For the business"
        title="Merchant"
        description={
          <>
            <span className="text-slate-800">Generate a shielded UTXO receive key</span>, set your name and suggested
            amounts, then <span className="text-slate-800">build pay links and QR codes</span> that pass your
            64-hex to checkout (demo). {usdcClusterBadge()}
          </>
        }
      />

      <section
        id="section-merchant-utxo"
        className="app-card relative mb-6 scroll-mt-24 border-indigo-200/50 bg-gradient-to-b from-indigo-50/25 to-white/80"
      >
        <h2 className="flex flex-wrap items-baseline gap-1.5 text-sm font-semibold text-slate-900">
          Shielded receive address
          <InfoTip text={TIP.cloakPayMerchantUtxo} />
        </h2>
        <p className="mt-1.5 text-sm text-slate-600">
          Like payroll “Payee keys,” this is a <span className="font-medium text-slate-800">64-character hex</span> Cloak
          UTXO public value — <strong>not</strong> a normal Solana address. A live integration would route in-person
          private USDC here; this demo also keeps the key in <code className="text-[11px]">localStorage</code> in this
          browser only.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!utxoKp ? (
            <button
              type="button"
              onClick={() => {
                void makeReceiveKey();
              }}
              className="btn-primary"
              title={TIP.generatePayeeKey}
              disabled={utxoWorking}
              aria-busy={utxoWorking}
            >
              {utxoWorking ? "Preparing key…" : "Generate shielded receive key"}
            </button>
          ) : (
            <button
              type="button"
              onClick={tryRegenerateReceiveKey}
              className="btn-secondary"
              title="Replace the key — you will be asked to confirm"
              disabled={utxoWorking}
              aria-busy={utxoWorking}
            >
              {utxoWorking ? "Preparing key…" : "Generate new key"}
            </button>
          )}
          {utxoWorking && (
            <span className="text-sm text-slate-500" role="status" aria-live="polite">
              First run loads Poseidon in the browser and can take 5–20s. Please wait.
            </span>
          )}
        </div>
        {utxoErr && (
          <p className="mt-2 text-sm text-red-800" role="alert">
            {utxoErr}
          </p>
        )}
        {utxoKp && (
          <div className="mt-5 rounded-xl border border-slate-200/90 bg-white/90 p-4 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Share the 64-hex with your backend
              <InfoTip text={TIP.utxoPublicKey} titleOverride="Same shape as a payee line" className="ms-0.5 normal-case" />
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Copy for integration checks; keep the <span className="text-slate-800">JSON</span> (or this page’s private
              field) to settle / unshield later, same as payroll.
            </p>
            <p className="mt-3 break-all rounded-lg border border-indigo-200/40 bg-white/80 p-3 font-mono text-xs text-slate-800 shadow-sm">
              {bigintToHex(utxoKp.publicKey)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(bigintToHex(utxoKp.publicKey));
                    setUtxoErr(null);
                    copyFlash("64-hex copied");
                  } catch {
                    setUtxoErr("Copy failed");
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
                    setUtxoErr(null);
                    copyFlash("JSON copied");
                  } catch {
                    setUtxoErr("Copy failed");
                  }
                }}
                className="btn-secondary"
                title={TIP.payeeCopyKeyJson}
              >
                Copy as JSON
              </button>
              <button type="button" onClick={downloadUtxoBackup} className="btn-secondary" title={TIP.payeeDownload}>
                Download .json
              </button>
            </div>
            {copyStatus && (
              <p className="mt-2 text-xs text-emerald-800" role="status" aria-live="polite">
                {copyStatus}
              </p>
            )}
            <details className="mt-4 group rounded-lg border border-slate-200/80 bg-slate-50/80">
              <summary className="cursor-pointer list-none py-2.5 px-3 text-xs font-medium text-slate-700 marker:hidden hover:bg-slate-100/80">
                <span className="me-1 inline-block origin-center text-slate-400 transition group-open:rotate-90 group-open:opacity-90">
                  ▸
                </span>
                Show private + public (decimal)
                <InfoTip
                  text={TIP.payeeShowSecret}
                  titleOverride="Merchant UTXO secret (same risk as payee JSON)"
                  className="ms-0.5 normal-case"
                />
              </summary>
              <div className="border-t border-slate-200/80 px-3 pb-3 pt-0">
                <p className="pt-2 text-[11px] leading-relaxed text-red-900/90">
                  <strong>Secret.</strong> Anyone with your private UTXO field and a valid payment output could unshield
                  if it matched that flow. Do not post in public channels.
                </p>
                <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">publicKey (decimal)</p>
                <p className="mt-1 break-all font-mono text-xs text-slate-800">{utxoKp.publicKey.toString()}</p>
                <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">privateKey (decimal)</p>
                <p className="mt-1 break-all font-mono text-xs text-slate-800">{utxoKp.privateKey.toString()}</p>
              </div>
            </details>
          </div>
        )}
      </section>

      <section
        id="section-merchant-profile"
        className="app-card relative mb-6 scroll-mt-24 overflow-hidden border-emerald-200/30 bg-gradient-to-b from-white to-emerald-50/15"
      >
        <h2 className="flex items-center gap-1 text-sm font-semibold text-slate-900">
          Business profile
          <InfoTip text="In production you’d store this in your own backend. Here it persists in localStorage for the demo only." />
        </h2>
        <p className="mt-1 text-sm text-slate-600">Shown in QR labels, the customer pay page, and future emails.</p>
        <p className="mt-1.5 text-xs text-slate-500">Edits store in <code className="text-[11px]">localStorage</code> in this browser only (demo).</p>
        <div className="mt-4">
          <label className="app-label" htmlFor={`${id}-name`}>
            Display name
          </label>
          <input
            id={`${id}-name`}
            className="app-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="organization"
          />
        </div>
      </section>

      <section id="section-merchant-presets" className="app-card mb-6 scroll-mt-24 border-slate-200/80">
        <h2 className="text-sm font-semibold text-slate-900">Default amounts</h2>
        <p className="mt-1 text-sm text-slate-600">Defaults feed the pay link and QR; the customer can still change amount at checkout.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition " +
                (preset === p
                  ? "border-indigo-500 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200/60"
                  : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200")
              }
            >
              {p === "open" ? "Open amount" : `${p} USDC`}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">Selected: {preset === "open" ? "Customer types amount" : `${preset} USDC`}.</p>
        <div className="mt-4">
          <label className="app-label" htmlFor={`${id}-policy`}>
            Policy / footer (receipts)
          </label>
          <textarea
            id={`${id}-policy`}
            className="app-input min-h-[5rem] resize-y py-2"
            value={policy}
            onChange={(e) => setPolicy(e.target.value)}
            rows={3}
            placeholder="Refund and contact line…"
          />
        </div>
      </section>

      <section
        id="section-merchant-qr"
        className="app-card relative mb-6 scroll-mt-24 overflow-hidden border-emerald-200/40 bg-gradient-to-br from-white via-emerald-50/20 to-sky-50/20"
      >
        <h2 className="flex items-center gap-1 text-sm font-semibold text-slate-900">
          Pay link &amp; QR
          <InfoTip text="Each URL includes your merchant 64-hex (mpk) so checkout can be wired to the same UTXO in a full integration. Demo QR uses a public image API; ship an in-app renderer for production." />
        </h2>
        <p className="mt-1.5 text-sm text-slate-600">
          Available after you generate a receive key. Adjust amount if needed, then print or show the code at the counter.
        </p>

        {!utxoKp && (
          <p className="mt-4 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-950">
            <strong>Next step.</strong> Generate a <span className="font-medium">shielded receive key</span> in the
            section above. Then you can encode pay links and QR that reference your UTXO.
          </p>
        )}

        {utxoKp && (
          <>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
              <div className="min-w-0 space-y-3">
                <div>
                  <label className="app-label" htmlFor={`${id}-link-amt`}>
                    Amount for this QR (USDC, optional)
                  </label>
                  <input
                    id={`${id}-link-amt`}
                    className="app-input"
                    value={linkAmount}
                    onChange={(e) => setLinkAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder={preset === "open" ? "e.g. 12.00" : preset}
                    autoComplete="off"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Label comes from <span className="font-medium">Display name</span> in your profile. Query includes{" "}
                    <code className="text-[11px]">mpk</code> (64-hex) for this key.
                  </p>
                </div>
              </div>

              <div className="mx-auto flex max-w-[18rem] flex-col items-center lg:mx-0">
                {qrImageSrcLg ? (
                  <div className="rounded-3xl border-2 border-white/80 bg-white p-4 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/50">
                    <Image
                      src={qrImageSrcLg}
                      alt={
                        displayName.trim() ? `Scan to pay ${displayName.trim()}` : "Scan to open Cloak Pay checkout"
                      }
                      width={280}
                      height={280}
                      className="h-auto w-full max-w-[min(18rem,80vw)]"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div
                    className="flex h-[min(18rem,80vw)] w-[min(18rem,80vw)] max-w-[18rem] items-center justify-center rounded-3xl border-2 border-dashed border-slate-200/90 bg-slate-50/80 p-4 text-center text-sm text-slate-500"
                    role="status"
                  >
                    Composing pay URL…
                  </div>
                )}
                <a
                  href={pathWithQuery}
                  className="mt-3 rounded-full bg-sky-100/80 px-4 py-1.5 text-sm font-medium text-sky-900 no-underline transition hover:bg-sky-200/80"
                  title="Open customer pay with the same query as the QR (relative link)"
                >
                  Test as customer →
                </a>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Encoded URL</p>
              <p className="mt-1.5 break-all rounded-xl border border-slate-200/60 bg-slate-50/90 px-3 py-2.5 font-mono text-xs leading-relaxed text-slate-800">
                {absPayUrl ?? pathWithQuery}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => void onCopyPayLink()}
                  title="Copy full pay URL (includes mpk)"
                >
                  {linkCopyFlash ? "Copied" : "Copy link"}
                </button>
              </div>
            </div>

            <div className="app-card mt-4 border-slate-200/80 bg-slate-50/30">
              <h3 className="text-sm font-semibold text-slate-900">Print &amp; place</h3>
              <p className="mt-1 text-sm text-slate-600">
                Opens the browser print dialog; many browsers get a <strong>clean sheet with the QR and title</strong> from
                the print layout below.
              </p>
              <button
                type="button"
                className="btn-secondary mt-3"
                onClick={() => (typeof window !== "undefined" ? window.print() : void 0)}
              >
                Open print…
              </button>
            </div>
          </>
        )}
      </section>

      <section
        id="section-merchant-preview"
        className="app-card mb-6 scroll-mt-24 border-dashed border-indigo-200/80 bg-indigo-50/20"
      >
        <h2 className="text-sm font-semibold text-slate-900">As customers see it</h2>
        <p className="mt-0.5 text-xs text-slate-500">Tiny preview; full checkout is on Customer pay.</p>
        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-200/70 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">You pay</p>
          <p className="text-lg font-bold text-slate-900">{displayName.trim() || "Your business"}</p>
          <p className="text-xs text-slate-500">{presetLine}</p>
          <Link
            className="mt-1 w-fit text-xs font-medium text-indigo-600 hover:text-indigo-800"
            href={payPreviewQuery}
            title="Open customer view with the same name, amount, and mpk (when a key exists)"
          >
            Open customer pay with this name →
          </Link>
        </div>
      </section>

      <section
        id="section-merchant-hint"
        className="app-card scroll-mt-24 border-slate-200/80 bg-slate-50/30"
      >
        <h2 className="text-sm font-semibold text-slate-900">Operator checklist</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-4 text-sm text-slate-600">
          <li>
            Create a <span className="font-medium text-slate-800">64-hex receive key</span> and back up the JSON; it
            tags where private USDC would land.
          </li>
          <li>
            Use <span className="font-medium text-slate-800">Pay link &amp; QR</span> to hand buyers a scannable
            payment URL that includes you as <code className="text-[12px]">mpk</code> (demo).
          </li>
          <li>Point phones at <span className="font-medium text-slate-800">Customer pay</span> to try the full flow.</li>
          <li>Reconcile in <span className="font-medium text-slate-800">Activity</span> (sample data).</li>
        </ol>
      </section>
    </div>
    </div>

    {absPayUrl && qrImageSrcLg && (
      <div className="hidden print:fixed print:inset-0 print:m-0 print:block print:bg-white print:p-8">
        <h1 className="text-2xl font-bold text-slate-900">Pay {displayName.trim() || "us"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cloak Pay (shielded USDC) — {linkAmount.trim() ? `Suggested ${linkAmount.trim()} USDC` : "Enter amount in checkout"}
        </p>
        <div className="mt-8 flex justify-center">
          <Image
            src={qrImageSrcLg}
            alt="Payment QR"
            width={240}
            height={240}
            unoptimized
            className="print:block"
          />
        </div>
      </div>
    )}
    </>
  );
}
