"use client";

import {
  bigintToHex,
  createUtxo,
  generateUtxoKeypair,
  getNkFromUtxoPrivateKey,
  type Utxo,
  type UtxoKeypair,
} from "@cloak.dev/sdk";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InfoTip } from "@/components/ui/InfoTip";
import { USDC_MINT } from "@/lib/constants";
import { formatUsdcFromUnits } from "@/lib/amounts";
import { toPayeePaymentBundle, utxoFromBundle, type PayeePaymentBundle } from "@/lib/payee-bundle";
import { SITE } from "@/lib/site-links";

const DEMO_SHIELD_UNITS = 10_000_000n; // 10 USDC
const DEMO_LINE_UNITS = 1_000_000n; // 1 USDC

/** Extra time on each “stop” so viewers can read the screen (added to every pause in the auto run). */
const AUTO_STEP_LINGER_MS = 3000;

/** Pacing for automatic demo (ms), each pause includes +3s linger before the next beat. */
const AUTO = {
  intro1: 2200 + AUTO_STEP_LINGER_MS,
  intro2: 2200 + AUTO_STEP_LINGER_MS,
  beforeShield: 600 + AUTO_STEP_LINGER_MS,
  afterShield: 1000 + AUTO_STEP_LINGER_MS,
  payee: 2000 + AUTO_STEP_LINGER_MS,
  beforePayroll: 450 + AUTO_STEP_LINGER_MS,
  afterPayroll: 800 + AUTO_STEP_LINGER_MS,
  bundle: 2500 + AUTO_STEP_LINGER_MS,
  afterWallet: 500 + AUTO_STEP_LINGER_MS,
  afterUnshield: 1000 + AUTO_STEP_LINGER_MS,
} as const;

function formatDurationMs(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `${r}s`;
  if (r === 0) return `${m} min`;
  return `${m}m ${r}s`;
}

const FAKE_UNSHIELD_SIG = "4simDEMO" + "aB".repeat(32);
/** Fake base58-looking address for the mock “Phantom” in the demo. */
const MOCK_DEMO_WALLET = "7xKVTg2CAPWDemoSimqL8YhN9K3mD4pR5sT6uVwXyZa";

const STEPS = [
  { id: "welcome", short: "Intro", who: "both" as const },
  { id: "roles", short: "Who does what", who: "both" as const },
  { id: "shield", short: "Keys + shield", who: "employer" as const },
  { id: "payee-key", short: "Payee 64-hex", who: "payee" as const },
  { id: "payroll", short: "Run line", who: "employer" as const },
  { id: "bundle", short: "Payment JSON", who: "employer" as const },
  { id: "unshield", short: "Get paid", who: "payee" as const },
  { id: "end", short: "Done", who: "both" as const },
] as const;

function bytes32ToHex(u8: Uint8Array): string {
  return Array.from(u8, (b) => b.toString(16).padStart(2, "0")).join("");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function runwayActiveIndex(s: number): number {
  if (s <= 1) return 0;
  if (s === 2) return 1;
  if (s === 3) return 2;
  if (s === 4) return 3;
  if (s === 5) return 4;
  if (s === 6) return 5;
  return 6;
}

function stepActionComplete(
  i: number,
  s: {
    step: number;
    shieldDone: boolean;
    payrollDone: boolean;
    unshieldDone: boolean;
  }
): boolean {
  if (i === 2) return s.shieldDone;
  if (i === 3) return s.step > 3;
  if (i === 4) return s.payrollDone;
  if (i === 5) return s.payrollDone;
  if (i === 6) return s.unshieldDone;
  return false;
}

function SimIndeterminateBar({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      className="relative h-1.5 w-full max-w-md overflow-hidden rounded-full bg-slate-200/90"
      role="progressbar"
      aria-label="Simulated work in progress"
    >
      <div className="absolute inset-y-0 start-0 rounded-full bg-indigo-500 demo-sim-sweep" />
    </div>
  );
}

/** Full-run progress (0–7 → 0%–100%) for a quick visual anchor while recording. */
function DemoRunProgressBar({ step, totalSteps }: { step: number; totalSteps: number }) {
  const pct = totalSteps <= 1 ? 0 : Math.min(100, (step / (totalSteps - 1)) * 100);
  return (
    <div
      className="mt-3 w-full"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={`Demo progress, step ${step + 1} of ${totalSteps}`}
    >
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
        <div
          className="h-full origin-left rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function DemoRunway({
  step,
  ready,
  shieldDone,
  payrollDone,
  unshieldDone,
}: {
  step: number;
  ready: boolean;
  shieldDone: boolean;
  payrollDone: boolean;
  unshieldDone: boolean;
}) {
  const seg = [
    { k: "keys", label: "Keys live", sub: "UTXO pair", done: ready },
    { k: "shield", label: "Shield", sub: "Pool balance", done: shieldDone },
    { k: "hex", label: "64-hex", sub: "To employer", done: step > 3 },
    { k: "line", label: "Line", sub: "createUtxo", done: payrollDone },
    { k: "json", label: "JSON", sub: "Bundle", done: payrollDone },
    { k: "out", label: "Unshield", sub: "To wallet", done: unshieldDone },
  ] as const;
  const here = runwayActiveIndex(step);
  return (
    <div className="rounded-2xl border border-indigo-200/50 bg-gradient-to-b from-white/95 to-indigo-50/30 p-3 shadow-sm shadow-indigo-100/30 sm:p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Pipeline (live status)</p>
      <ol className="mt-3 flex flex-nowrap items-stretch justify-between gap-0.5 overflow-x-auto pb-1 sm:gap-1">
        {seg.map((b, j) => {
          const on = j === here;
          return (
            <li
              key={b.k}
              className={
                "flex min-w-[4.5rem] max-w-[5.5rem] flex-1 flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5 text-center transition-all duration-300 sm:min-w-0 " +
                (b.done
                  ? "border-emerald-200/80 bg-emerald-50/90"
                  : on
                    ? "z-[1] border-indigo-400/90 bg-indigo-50/95 shadow-md shadow-indigo-200/30 ring-2 ring-indigo-300/50"
                    : "border-slate-200/60 bg-slate-50/60")
              }
            >
              <span
                className={
                  "text-[9px] font-bold leading-tight " +
                  (b.done ? "text-emerald-800" : on ? "text-indigo-900" : "text-slate-500")
                }
              >
                {b.done ? "✓ " : ""}
                {b.label}
              </span>
              <span className="hidden text-[8px] text-slate-500 sm:block">{b.sub}</span>
            </li>
          );
        })}
      </ol>
      {step === 7 && <p className="mt-2 text-center text-[10px] text-emerald-800">End-to-end path completed in this session.</p>}
    </div>
  );
}

function RoleBadge({ who }: { who: (typeof STEPS)[number]["who"] }) {
  if (who === "both")
    return (
      <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-100/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
        Overview
      </span>
    );
  if (who === "employer")
    return (
      <span className="inline-flex items-center rounded-full border border-indigo-200/80 bg-indigo-50/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-800">
        Employer
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full border border-sky-200/80 bg-sky-50/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-900">
      Employee
    </span>
  );
}

type DemoKeyState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; treasury: UtxoKeypair; payee: UtxoKeypair; nkHex: string };

export function DemoSimulation() {
  const [step, setStep] = useState(0);
  const [keyState, setKeyState] = useState<DemoKeyState>({ kind: "loading" });

  const [shieldRunning, setShieldRunning] = useState(false);
  const [shieldDone, setShieldDone] = useState(false);

  const [payrollRunning, setPayrollRunning] = useState(false);
  const [payrollDone, setPayrollDone] = useState(false);
  const [lineUtxo, setLineUtxo] = useState<Utxo | null>(null);
  const [paymentBundle, setPaymentBundle] = useState<PayeePaymentBundle | null>(null);
  const [rehydrateError, setRehydrateError] = useState<string | null>(null);

  const [unshieldRunning, setUnshieldRunning] = useState(false);
  const [unshieldDone, setUnshieldDone] = useState(false);
  const [mockWalletConnected, setMockWalletConnected] = useState(false);
  const [copyFlash, setCopyFlash] = useState<string | null>(null);
  const [autoplayRunning, setAutoplayRunning] = useState(false);
  const [sessionDurationMs, setSessionDurationMs] = useState<number | null>(null);

  const autoplayTokenRef = useRef(0);
  const sessionT0Ref = useRef(0);
  const simShieldRef = useRef<() => Promise<void>>(async () => {});
  const simPayrollRef = useRef<(o?: { bypassShieldCheck?: boolean }) => Promise<void>>(async () => {});
  const simUnshieldRef = useRef<() => Promise<void>>(async () => {});
  const stepContentRef = useRef<HTMLDivElement | null>(null);
  const stepScrollPrevRef = useRef<number | undefined>(undefined);

  const total = STEPS.length;
  const label = STEPS[step]?.short ?? "";
  const ready = keyState.kind === "ready";
  const treasuryKp = keyState.kind === "ready" ? keyState.treasury : null;
  const payeeKp = keyState.kind === "ready" ? keyState.payee : null;
  const nkHex = keyState.kind === "ready" ? keyState.nkHex : null;

  const bundleJson = useMemo(
    () => (paymentBundle ? JSON.stringify(paymentBundle, null, 2) : ""),
    [paymentBundle]
  );

  const rehydratedUtxo = useMemo((): Utxo | null => {
    if (!paymentBundle || !payeeKp) return null;
    try {
      return utxoFromBundle(paymentBundle, payeeKp);
    } catch {
      return null;
    }
  }, [paymentBundle, payeeKp]);

  const sessionKey = useMemo(() => {
    if (keyState.kind !== "ready") return null;
    return `${keyState.treasury.publicKey}|${keyState.payee.publicKey}`;
  }, [keyState]);

  const runKeyGen = useCallback(async () => {
    autoplayTokenRef.current += 1;
    setAutoplayRunning(false);
    setStep(0);
    setKeyState({ kind: "loading" });
    setShieldDone(false);
    setShieldRunning(false);
    setPayrollDone(false);
    setPayrollRunning(false);
    setLineUtxo(null);
    setPaymentBundle(null);
    setRehydrateError(null);
    setUnshieldDone(false);
    setUnshieldRunning(false);
    setMockWalletConnected(false);
    setSessionDurationMs(null);
    try {
      const [treasury, payee] = await Promise.all([generateUtxoKeypair(), generateUtxoKeypair()]);
      const nk = getNkFromUtxoPrivateKey(treasury.privateKey);
      setKeyState({ kind: "ready", treasury, payee, nkHex: bytes32ToHex(nk) });
    } catch (e) {
      setKeyState({
        kind: "error",
        message: e instanceof Error ? e.message : "Key generation failed",
      });
    }
  }, []);

  useEffect(() => {
    void runKeyGen();
  }, [runKeyGen]);

  useEffect(() => {
    if (!copyFlash) return;
    const t = setTimeout(() => setCopyFlash(null), 2000);
    return () => clearTimeout(t);
  }, [copyFlash]);

  useEffect(() => {
    if (stepScrollPrevRef.current === undefined) {
      stepScrollPrevRef.current = step;
      return;
    }
    if (stepScrollPrevRef.current === step) return;
    stepScrollPrevRef.current = step;
    const el = stepContentRef.current;
    if (!el) return;
    const reduce =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [step]);

  const copyToClipboard = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFlash(label);
    } catch {
      setCopyFlash("Copy failed");
    }
  };

  const simulateShield = useCallback(async () => {
    if (keyState.kind !== "ready") return;
    setShieldRunning(true);
    try {
      await sleep(1400);
      setShieldDone(true);
    } finally {
      setShieldRunning(false);
    }
  }, [keyState]);

  const simulatePayroll = useCallback(
    async (opts?: { bypassShieldCheck?: boolean }) => {
      if (keyState.kind !== "ready") return;
      if (!opts?.bypassShieldCheck && !shieldDone) return;
      setPayrollRunning(true);
      setRehydrateError(null);
      try {
        await sleep(800);
        const out = await createUtxo(DEMO_LINE_UNITS, keyState.payee, USDC_MINT);
        setLineUtxo(out);
        const sig = `5im${"x".repeat(64)}DEMO${Date.now().toString(36)}`.slice(0, 88);
        const b = toPayeePaymentBundle("Demo payee", out, sig);
        setPaymentBundle(b);
        try {
          utxoFromBundle(b, keyState.payee);
          setRehydrateError(null);
        } catch (e) {
          setRehydrateError(e instanceof Error ? e.message : "Rehydrate check failed");
        }
        setPayrollDone(true);
      } catch (e) {
        setRehydrateError(e instanceof Error ? e.message : "Payroll simulation failed");
      } finally {
        setPayrollRunning(false);
      }
    },
    [keyState, shieldDone]
  );

  const simulateUnshield = useCallback(async () => {
    setUnshieldRunning(true);
    try {
      await sleep(1200);
      setUnshieldDone(true);
    } finally {
      setUnshieldRunning(false);
    }
  }, []);

  simShieldRef.current = simulateShield;
  simPayrollRef.current = simulatePayroll;
  simUnshieldRef.current = simulateUnshield;

  const restart = useCallback(() => {
    void runKeyGen();
  }, [runKeyGen]);

  useEffect(() => {
    if (!sessionKey) return;
    const my = ++autoplayTokenRef.current;
    const cancel = () => autoplayTokenRef.current !== my;
    setAutoplayRunning(true);
    setSessionDurationMs(null);
    setStep(0);
    setMockWalletConnected(false);
    sessionT0Ref.current = performance.now();

    void (async () => {
      const wait = async (ms: number) => {
        await sleep(ms);
        if (cancel()) throw new Error("autoplay_cancel");
      };
      try {
        setStep(0);
        await wait(AUTO.intro1);
        if (cancel()) return;
        setStep(1);
        await wait(AUTO.intro2);
        if (cancel()) return;
        setStep(2);
        await wait(AUTO.beforeShield);
        if (cancel()) return;
        await simShieldRef.current();
        if (cancel()) return;
        await wait(AUTO.afterShield);
        if (cancel()) return;
        setStep(3);
        await wait(AUTO.payee);
        if (cancel()) return;
        setStep(4);
        await wait(AUTO.beforePayroll);
        if (cancel()) return;
        await simPayrollRef.current({ bypassShieldCheck: true });
        if (cancel()) return;
        await wait(AUTO.afterPayroll);
        if (cancel()) return;
        setStep(5);
        await wait(AUTO.bundle);
        if (cancel()) return;
        setStep(6);
        setMockWalletConnected(true);
        await wait(AUTO.afterWallet);
        if (cancel()) return;
        await simUnshieldRef.current();
        if (cancel()) return;
        await wait(AUTO.afterUnshield);
        if (cancel()) return;
        if (autoplayTokenRef.current === my) {
          setSessionDurationMs(Math.round(performance.now() - sessionT0Ref.current));
        }
        setStep(7);
      } catch (e) {
        if (e instanceof Error && e.message === "autoplay_cancel") {
          return;
        }
        console.error("[demo autoplay]", e);
      } finally {
        if (autoplayTokenRef.current === my) {
          setAutoplayRunning(false);
        }
      }
    })();

    return () => {
      autoplayTokenRef.current += 1;
      setAutoplayRunning(false);
    };
  }, [sessionKey]);

  return (
    <div className="min-h-0 bg-transparent">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 100% 50% at 50% -5%, rgba(99, 102, 241, 0.08), transparent 55%)",
        }}
        aria-hidden
      />
      <div
        id="section-demo-panel"
        className="mx-auto max-w-3xl scroll-mt-24 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Automatic walkthrough
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {SITE.name} — full simulation
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          After keys load, the <strong>demo runs by itself</strong>—stages advance on a timer and each SDK action
          (shield, payroll line, unshield) runs in sequence.
        </p>

        {autoplayRunning && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-indigo-200/60 bg-indigo-50/90 px-2.5 py-1 text-xs font-medium text-indigo-900" role="status" aria-live="polite">
            <span
              className="inline-block h-2 w-2 motion-safe:animate-pulse rounded-full bg-indigo-500"
              aria-hidden
            />
            Playing automatic demo…
          </p>
        )}

        <div className="mt-5 app-card border-indigo-200/50 bg-indigo-50/40">
          <p className="text-xs text-indigo-950/90" role="note">
            <InfoTip
              text="Uses @cloak.dev/sdk: generateUtxoKeypair, createUtxo, toPayeePaymentBundle, utxoFromBundle. The Treasury, Payee, and Get paid pages are for real Solana + wallet."
              className="me-1 -translate-y-0.5"
            />
            {keyState.kind === "loading" && "Generating UTXO keys in-browser… The tour will start when ready."}
            {keyState.kind === "error" && `Key setup: ${keyState.message}`}
            {ready && !autoplayRunning && "Demo finished, or you restarted. Use “Restart (new keys)” to run again with fresh keys."}
            {ready && autoplayRunning && "Sit back: intro → keys → shield → payee → line → JSON → get paid, all in one pass."}
          </p>
        </div>

        {keyState.kind === "error" && (
          <button type="button" onClick={() => void runKeyGen()} className="btn-primary mt-3">
            Retry key generation
          </button>
        )}

        <div className="mt-6" role="region" aria-label="Simulation steps">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500" aria-live="polite">
            Step {step + 1} of {total} — {label}
          </p>
          {autoplayRunning && step < total - 1 && (
            <p className="mt-1 text-xs text-slate-600" aria-live="polite">
              <span className="font-medium text-slate-700">Next: </span>
              {STEPS[step + 1].short}
            </p>
          )}
          <DemoRunProgressBar step={step} totalSteps={total} />
          <ol className="mt-2 flex flex-wrap gap-1.5" aria-label="Progress">
            {STEPS.map((s, i) => {
              const done = i < step;
              const here = i === step;
              const act = stepActionComplete(i, { step, shieldDone, payrollDone, unshieldDone });
              return (
                <li key={s.id} className="shrink-0 list-none" aria-current={here ? "step" : undefined}>
                  <span
                    className={
                      "inline-flex h-7 min-w-7 items-center justify-center gap-0.5 rounded-lg px-1.5 text-[10px] font-bold tabular-nums " +
                      (here
                        ? "bg-indigo-600 text-white shadow ring-2 ring-indigo-300/50"
                        : done
                          ? "bg-slate-200/90 text-slate-700"
                          : "bg-slate-100/80 text-slate-400")
                    }
                    title={s.short + (act ? " — action done" : "")}
                  >
                    {i + 1}
                    {act ? (
                      <span className={here ? "text-emerald-200" : "text-emerald-600"} aria-hidden>
                        ✓
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div
          id="demo-sim-step-content"
          ref={stepContentRef}
          className="app-card mt-5 min-h-[16rem] border-slate-200/80 scroll-mt-24"
          key={STEPS[step].id}
        >
          <div className="mb-3 flex justify-end">
            <RoleBadge who={STEPS[step].who} />
          </div>

          {step === 0 && <IntroBlock />}
          {step === 1 && <RolesBlock ready={ready} />}

          {step === 2 && (
            <EmployerKeysShieldBlock
              ready={ready}
              readOnly={autoplayRunning}
              busy={keyState.kind === "loading"}
              treasuryKp={treasuryKp}
              nkHex={nkHex}
              shieldRunning={shieldRunning}
              shieldDone={shieldDone}
              onCopy={copyToClipboard}
              onSimulateShield={simulateShield}
            />
          )}

          {step === 3 && (
            <PayeeKeyBlock
              ready={ready}
              payeeKp={payeeKp}
              onCopy={copyToClipboard}
            />
          )}

          {step === 4 && (
            <PayrollBlock
              ready={ready}
              readOnly={autoplayRunning}
              shieldDone={shieldDone}
              payeeKp={payeeKp}
              payrollRunning={payrollRunning}
              payrollDone={payrollDone}
              lineUtxo={lineUtxo}
              rehydrateError={rehydrateError}
              onSimulatePayroll={simulatePayroll}
            />
          )}

          {step === 5 && (
            <BundleBlock
              ready={ready}
              bundleJson={bundleJson}
              payrollDone={payrollDone}
              rehydrateError={rehydrateError}
              onCopy={copyToClipboard}
            />
          )}

          {step === 6 && (
            <UnshieldBlock
              ready={ready}
              readOnly={autoplayRunning}
              payeeKp={payeeKp}
              rehydratedUtxo={rehydratedUtxo}
              unshieldRunning={unshieldRunning}
              unshieldDone={unshieldDone}
              mockWalletConnected={mockWalletConnected}
              onMockWalletConnect={() => setMockWalletConnected(true)}
              onMockWalletDisconnect={() => setMockWalletConnected(false)}
              onSimulateUnshield={simulateUnshield}
            />
          )}

          {step === 7 && (
            <EndBlock onRestart={restart} ready={ready} sessionDurationMs={sessionDurationMs} />
          )}
        </div>

        <div className="mt-5">
          <DemoRunway
            step={step}
            ready={ready}
            shieldDone={shieldDone}
            payrollDone={payrollDone}
            unshieldDone={unshieldDone}
          />
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {copyFlash && (
            <span className="text-xs text-emerald-800" role="status">
              {copyFlash}
            </span>
          )}
          <div className="ms-auto sm:ms-0">
            <button
              type="button"
              onClick={restart}
              className="btn-secondary"
              disabled={keyState.kind === "loading"}
              title="Cancels the current run, generates new keys, and re-plays the full automatic demo"
            >
              Restart (new keys + re-run)
            </button>
          </div>
        </div>

        {ready && treasuryKp && payeeKp && (
          <div className="mt-6 app-card border-slate-200/60 bg-slate-50/50 py-3">
            <p className="text-[10px] font-semibold uppercase text-slate-500">Current demo keys (truncated)</p>
            <div className="mt-2 flex flex-col gap-1.5 text-[11px] sm:flex-row sm:gap-6">
              <p className="min-w-0 break-all font-mono text-slate-700">
                <span className="text-slate-500">Treasury UTXO PK </span>
                {bigintToHex(treasuryKp.publicKey).slice(0, 16)}…
              </p>
              <p className="min-w-0 break-all font-mono text-slate-700">
                <span className="text-slate-500">Payee UTXO PK </span>
                {bigintToHex(payeeKp.publicKey).slice(0, 16)}…
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function IntroBlock() {
  return (
    <>
      <h2 className="text-lg font-semibold text-slate-900">End-to-end (simulated) payroll path</h2>
      <p className="mt-2 text-sm text-slate-600">
        This page generates a <strong>real treasury and payee UTXO keypair</strong> with the same SDK as production,
        runs <strong>createUtxo</strong> + a valid <code>PayeePaymentBundle</code>, and shows{" "}
        <strong>utxoFromBundle</strong> + a fake <strong>wallet connect</strong> for a believable &ldquo;Get paid&rdquo; shot. Nothing is
        broadcast. This tour advances <strong>on its own</strong> after the keys are ready.
      </p>
    </>
  );
}

function RolesBlock({ ready }: { ready: boolean }) {
  return (
    <>
      <h2 className="text-lg font-semibold text-slate-900">Who does what</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/30 p-4">
          <p className="text-xs font-bold uppercase text-indigo-800">Employer (Treasury)</p>
          <p className="mt-1 text-sm text-slate-600">Owns the <strong>treasury UTXO</strong> after shield, runs lines, hands off payment JSONs.</p>
        </div>
        <div className="rounded-xl border border-sky-200/60 bg-sky-50/30 p-4">
          <p className="text-xs font-bold uppercase text-sky-900">Employee (Payee + Get paid)</p>
          <p className="mt-1 text-sm text-slate-600">Owns the <strong>payee UTXO</strong> key; shares 64-hex, later unshields with bundle + wallet.</p>
        </div>
      </div>
      {!ready && <p className="mt-4 text-sm text-amber-800">Waiting for keys to finish loading…</p>}
    </>
  );
}

function EmployerKeysShieldBlock({
  ready,
  readOnly,
  busy,
  treasuryKp,
  nkHex,
  shieldRunning,
  shieldDone,
  onCopy,
  onSimulateShield,
}: {
  ready: boolean;
  readOnly?: boolean;
  busy: boolean;
  treasuryKp: UtxoKeypair | null;
  nkHex: string | null;
  shieldRunning: boolean;
  shieldDone: boolean;
  onCopy: (a: string, b: string) => void;
  onSimulateShield: () => void;
}) {
  return (
    <>
      <h2 className="text-lg font-semibold text-slate-900">Employer: treasury UTXO + (simulated) shield</h2>
      <p className="mt-2 text-sm text-slate-600">
        In the live app, this key lives in the browser; you <strong>shield</strong> public USDC to fund it. Below is the
        real 64-hex <strong>public</strong> field element, plus a <strong>32-byte viewing key (nk) hex</strong> for
        off-chain history (compliance), derived from the treasury <strong>private</strong> key in memory only.
      </p>
      {!ready || !treasuryKp || !nkHex ? (
        <p className="mt-3 text-sm text-slate-500">{busy ? "Generating…" : "No keys yet."}</p>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-500">Treasury UTXO public (64-hex, copy for audit)</p>
            <p className="mt-1 break-all rounded-lg border border-indigo-200/50 bg-slate-50/90 p-2 font-mono text-[10px] text-slate-900">
              {bigintToHex(treasuryKp.publicKey)}
            </p>
            <button
              type="button"
              className="btn-secondary mt-1"
              onClick={() => onCopy("Hex copied", bigintToHex(treasuryKp.publicKey))}
            >
              Copy 64-hex
            </button>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-500">Viewing key nk (32 bytes hex)</p>
            <p className="mt-1 break-all rounded-lg border border-amber-200/50 bg-stone-50/90 p-2 font-mono text-[10px] text-amber-950/90">
              {nkHex}
            </p>
            <button type="button" className="btn-secondary mt-1" onClick={() => onCopy("nk copied", nkHex)}>
              Copy nk
            </button>
          </div>
        </div>
      )}
      <div className="mt-4 rounded-xl border border-slate-200/80 bg-gradient-to-r from-amber-50/40 via-indigo-50/30 to-sky-50/30 p-4">
        <p className="text-xs font-medium text-slate-800">Simulate shielding</p>
        <p className="mt-1 text-xs text-slate-600">
          Pretend your Phantom had <span className="font-mono">{formatUsdcFromUnits(DEMO_SHIELD_UNITS)}</span> USDC and
          you just deposited to the <strong>treasury UTXO</strong> (no transaction sent in this page).
        </p>
        {readOnly && !shieldDone && !shieldRunning && (
          <p className="mt-2 text-[10px] text-slate-500">Automated: shield will run in a few seconds…</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-primary"
            disabled={readOnly || !ready || !treasuryKp || shieldRunning || shieldDone}
            onClick={onSimulateShield}
          >
            {shieldRunning
              ? "Depositing…"
              : shieldDone
                ? "Shielded (simulated) ✓"
                : "Simulate deposit to shielded pool"}
          </button>
          {shieldDone && !shieldRunning && (
            <span className="text-sm text-emerald-800">
              Treasury shielded: <span className="font-mono">{formatUsdcFromUnits(DEMO_SHIELD_UNITS)}</span> USDC
            </span>
          )}
        </div>
        {shieldRunning ? (
          <div className="mt-3">
            <SimIndeterminateBar show />
            <p className="mt-1.5 text-[10px] text-slate-500">Pretend on-chain deposit + UTXO note creation (no RPC).</p>
          </div>
        ) : null}
      </div>
    </>
  );
}

function PayeeKeyBlock({
  ready,
  payeeKp,
  onCopy,
}: {
  ready: boolean;
  payeeKp: UtxoKeypair | null;
  onCopy: (a: string, b: string) => void;
}) {
  const json =
    payeeKp == null
      ? ""
      : JSON.stringify(
          { privateKey: payeeKp.privateKey.toString(), publicKey: payeeKp.publicKey.toString() },
          null,
          2
        );
  return (
    <>
      <h2 className="text-lg font-semibold text-slate-900">Payee: share 64-hex (real)</h2>
      <p className="mt-2 text-sm text-slate-600">
        The employee sends HR this <strong>64-character hex</strong>—not their Phantom. The <strong>private</strong>{" "}
        field must stay in backup / Get paid.
      </p>
      {!ready || !payeeKp ? (
        <p className="mt-3 text-sm text-slate-500">…</p>
      ) : (
        <>
          <p className="mt-3 break-all rounded-lg border border-indigo-200/50 bg-slate-50/90 p-2 font-mono text-[10px] text-slate-900">
            {bigintToHex(payeeKp.publicKey)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onCopy("64-hex copied", bigintToHex(payeeKp.publicKey))}
            >
              Copy 64-hex
            </button>
            <button type="button" className="btn-secondary" onClick={() => onCopy("JSON copied", json)}>
              Copy key JSON (for Get paid)
            </button>
          </div>
        </>
      )}
    </>
  );
}

function PayrollBlock({
  ready,
  readOnly,
  shieldDone,
  payeeKp,
  payrollRunning,
  payrollDone,
  lineUtxo,
  rehydrateError,
  onSimulatePayroll,
}: {
  ready: boolean;
  readOnly?: boolean;
  shieldDone: boolean;
  payeeKp: UtxoKeypair | null;
  payrollRunning: boolean;
  payrollDone: boolean;
  lineUtxo: Utxo | null;
  rehydrateError: string | null;
  onSimulatePayroll: (opts?: { bypassShieldCheck?: boolean }) => void;
}) {
  return (
    <>
      <h2 className="text-lg font-semibold text-slate-900">Run a payroll line (off-chain UTXO)</h2>
      <p className="mt-2 text-sm text-slate-600">
        We <code className="text-xs">createUtxo(</code>
        {formatUsdcFromUnits(DEMO_LINE_UNITS)} USDC, <strong>payee key</strong>
        <code className="text-xs">)</code> to model the <strong>recipient UTXO output</strong> a real private transfer
        would create, then the treasury would copy a bundle from the same shape.
      </p>
      {!ready || !payeeKp ? (
        <p className="mt-2 text-sm text-amber-800">Need keys first.</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200/80 bg-white/90">
          <div className="grid grid-cols-2 gap-0 border-b border-slate-200/80 bg-slate-100/80 px-3 py-1.5 sm:grid-cols-3">
            <span className="text-left text-[10px] font-bold uppercase text-slate-500">Label</span>
            <span className="text-left text-[10px] font-bold uppercase text-slate-500 sm:text-center">USDC</span>
            <span className="col-span-2 text-left text-[10px] font-bold uppercase text-slate-500 sm:col-span-1 sm:text-right">Payee 64-hex (trunc.)</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-0 px-3 py-2.5 sm:grid-cols-3">
            <span className="text-xs text-slate-800">Demo payee</span>
            <span className="text-center font-mono text-xs text-slate-800 sm:text-left">{formatUsdcFromUnits(DEMO_LINE_UNITS)}</span>
            <span className="col-span-2 break-all font-mono text-xs text-slate-600 sm:col-span-1 sm:text-right" title={bigintToHex(payeeKp.publicKey)}>
              {bigintToHex(payeeKp.publicKey).slice(0, 20)}…
            </span>
          </div>
        </div>
      )}
      {readOnly && !payrollDone && !payrollRunning && (
        <p className="mt-2 text-[10px] text-slate-500">Automated: payroll line will run next…</p>
      )}
      <div className="mt-4">
        <button
          type="button"
          className="btn-primary"
          disabled={readOnly || !ready || !shieldDone || payrollRunning || payrollDone}
          onClick={() => onSimulatePayroll()}
        >
          {payrollRunning
            ? "Proving + routing… (simulated)"
            : payrollDone
              ? "Line complete ✓"
              : "Create recipient UTXO + bundle (SDK)"}
        </button>
        {payrollRunning ? (
          <div className="mt-3">
            <SimIndeterminateBar show />
            <p className="mt-1.5 text-[10px] text-slate-500">createUtxo (Poseidon commitment) + build PayeePaymentBundle…</p>
          </div>
        ) : null}
        {!shieldDone && <p className="mt-2 text-xs text-amber-800">Run the simulated shield on the previous step first.</p>}
        {rehydrateError && (
          <p className="mt-2 text-sm text-red-800" role="alert">
            {rehydrateError}
          </p>
        )}
        {payrollDone && lineUtxo?.commitment != null && !rehydrateError && (
          <div className="mt-2 space-y-1 text-xs text-emerald-800">
            <p>✓ Commitment (field): bundle matches <code>utxoFromBundle</code> rehydration.</p>
            <p className="break-all font-mono text-[10px] text-slate-600">
              Commitment hex (trunc.): 0x{lineUtxo.commitment.toString(16).slice(0, 24)}…
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function BundleBlock({
  ready,
  bundleJson,
  payrollDone,
  rehydrateError,
  onCopy,
}: {
  ready: boolean;
  bundleJson: string;
  payrollDone: boolean;
  rehydrateError: string | null;
  onCopy: (a: string, b: string) => void;
}) {
  return (
    <>
      <h2 className="text-lg font-semibold text-slate-900">Payment JSON (valid shape)</h2>
      <p className="mt-2 text-sm text-slate-600">
        Same structure as the Treasury <strong>Payee bundles</strong> export: amount, blinding, commitment, etc.—what the
        payee needs beside their <strong>private</strong> key to spend.
      </p>
      {!ready || !payrollDone || !bundleJson ? (
        <p className="mt-2 text-sm text-amber-800">Complete the previous payroll action first.</p>
      ) : (
        <>
          {rehydrateError && <p className="mt-2 text-sm text-red-800">{rehydrateError}</p>}
          <pre className="app-input mt-2 max-h-48 overflow-auto font-mono text-[9px] leading-relaxed text-slate-800 sm:text-[10px]">
            {bundleJson}
          </pre>
          <button
            type="button"
            className="btn-secondary mt-2"
            onClick={() => onCopy("Bundle copied", bundleJson)}
          >
            Copy JSON
          </button>
        </>
      )}
    </>
  );
}

function UnshieldBlock({
  ready,
  readOnly,
  payeeKp,
  rehydratedUtxo,
  unshieldRunning,
  unshieldDone,
  mockWalletConnected,
  onMockWalletConnect,
  onMockWalletDisconnect,
  onSimulateUnshield,
}: {
  ready: boolean;
  readOnly?: boolean;
  payeeKp: UtxoKeypair | null;
  rehydratedUtxo: Utxo | null;
  unshieldRunning: boolean;
  unshieldDone: boolean;
  mockWalletConnected: boolean;
  onMockWalletConnect: () => void;
  onMockWalletDisconnect: () => void;
  onSimulateUnshield: () => void;
}) {
  const canRun =
    !readOnly &&
    ready &&
    rehydratedUtxo != null &&
    !unshieldRunning &&
    !unshieldDone &&
    mockWalletConnected;
  return (
    <>
      <h2 className="text-lg font-semibold text-slate-900">Get paid: wallet + (simulated) unshield</h2>
      <p className="mt-2 text-sm text-slate-600">
        <code>utxoFromBundle</code> rehydrates the note from JSON + payee <strong>private</strong> key. On mainnet, Phantom
        would sign a withdraw to your public USDC ATA. Here you only connect a <strong>fake</strong> “demo wallet” for the
        camera.
      </p>
      {ready && payeeKp && rehydratedUtxo ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3">
            <p className="text-[10px] font-bold uppercase text-emerald-900">1 · Key + bundle</p>
            <ul className="mt-1.5 space-y-0.5 text-[11px] text-slate-700">
              <li>✓ Payee UTXO key in this tab</li>
              <li>✓ v1 payment JSON (from payroll step)</li>
              <li>
                ✓ Note amount: <span className="font-mono">{formatUsdcFromUnits(rehydratedUtxo.amount)}</span> USDC
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-3 sm:col-span-2">
            <p className="text-[10px] font-bold uppercase text-amber-950/90">2 · Demo “Phantom”</p>
            <p className="mt-1 text-xs text-amber-950/80">No real adapter — for recording only. Connect before unshield.</p>
            {readOnly && !unshieldDone && !unshieldRunning && (
              <p className="mt-1 text-[10px] text-amber-900/80">Automated: mock wallet and unshield will run next…</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {mockWalletConnected ? (
                <>
                  <div className="min-w-0 flex-1 rounded-md border border-slate-200/80 bg-white/90 px-2.5 py-1.5 font-mono text-[10px] text-slate-800 sm:text-xs">
                    {MOCK_DEMO_WALLET}
                  </div>
                  <button
                    type="button"
                    className="text-xs text-amber-900/90 underline decoration-amber-400/80 hover:text-amber-950"
                    onClick={onMockWalletDisconnect}
                    disabled={readOnly}
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn-secondary border-amber-200/60 bg-gradient-to-b from-amber-50/90 to-amber-100/40"
                  onClick={onMockWalletConnect}
                  disabled={readOnly}
                >
                  Connect demo wallet
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-amber-800">Complete payroll + bundle in earlier steps first.</p>
      )}

      <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
        <p className="text-xs font-medium text-slate-800">3 · Simulate proof + (mock) on-chain unshield</p>
        <button
          type="button"
          className="btn-primary mt-2"
          disabled={!canRun}
          onClick={onSimulateUnshield}
        >
          {unshieldRunning
            ? "Proof + sign (simulated)…"
            : unshieldDone
              ? "Unshield complete (simulated) ✓"
              : "Run simulated unshield"}
        </button>
        {!mockWalletConnected && rehydratedUtxo && !unshieldDone && !unshieldRunning && (
          <p className="mt-1.5 text-xs text-amber-800">Connect the demo wallet above to unlock this button.</p>
        )}
        {unshieldRunning && (
          <div className="mt-2">
            <SimIndeterminateBar show />
            <p className="mt-1.5 text-[10px] text-slate-500">Pretend Groth16 + Phantom sign + Solana send…</p>
          </div>
        )}
        {unshieldDone && !unshieldRunning && (
          <p className="mt-2 break-all font-mono text-[10px] text-slate-600 sm:text-xs">
            Mock USDC to <span className="text-slate-800">ATA</span> of {MOCK_DEMO_WALLET.slice(0, 8)}… · sig{" "}
            {FAKE_UNSHIELD_SIG.slice(0, 20)}…
          </p>
        )}
      </div>
    </>
  );
}

function EndBlock({
  onRestart,
  ready,
  sessionDurationMs,
}: {
  onRestart: () => void;
  ready: boolean;
  sessionDurationMs: number | null;
}) {
  return (
    <>
      <h2 className="text-lg font-semibold text-slate-900">You&apos;ve run the full pipeline (off-chain)</h2>
      <p className="mt-2 text-sm text-slate-600">
        {ready
          ? "In this run, the SDK really derived keys, built Poseidon commitments, and serialized a bundle your code could pass to a connected app. The shield / unshield clicks only fake latency—no instruction was sent to Solana."
          : "Keys are still loading or failed; try again from the banner."}
      </p>
      {ready && sessionDurationMs != null && (
        <p className="mt-2 rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-xs text-slate-700" role="status">
          <span className="font-medium text-slate-800">This session: </span>
          {formatDurationMs(sessionDurationMs)} (wall time from when the automatic run started through this screen)
        </p>
      )}
      {ready && (
        <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
          <li className="flex gap-2">
            <span className="text-emerald-600" aria-hidden>
              ✓
            </span>
            <span>
              <strong>Math:</strong> UTXO public keys, commitments, and bundle fields match a real <code>utxoFromBundle</code> rehydration.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-600" aria-hidden>
              ◆
            </span>
            <span>
              <strong>Not live:</strong> &ldquo;Shield&rdquo;, &ldquo;unshield&rdquo;, and &ldquo;Connect demo wallet&rdquo; are for narrative only (timers + copy).
            </span>
          </li>
        </ul>
      )}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link href="/" className="btn-primary text-center no-underline">
          Open real Treasury
        </Link>
        <Link href="/payee" className="btn-secondary text-center no-underline">
          Open real Payee
        </Link>
        <Link href="/withdraw" className="btn-secondary text-center no-underline">
          Open real Get paid
        </Link>
      </div>
      <button type="button" onClick={onRestart} className="btn-secondary mt-4 w-full">
        Start over with new random keys
      </button>
    </>
  );
}
