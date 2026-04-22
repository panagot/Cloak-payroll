"use client";

import type { PayrollLine } from "@/lib/cloak/payroll";

type Props = {
  lines: PayrollLine[];
  onChange: (next: PayrollLine[]) => void;
};

export function RecipientTable({ lines, onChange }: Props) {
  const setLine = (i: number, p: Partial<PayrollLine>) => {
    onChange(lines.map((l, j) => (j === i ? { ...l, ...p } : l)));
  };

  return (
    <div className="space-y-4">
      {lines.map((l, i) => (
        <div
          key={i}
          className="rounded-lg border border-slate-800/80 bg-slate-950/30 p-4 ring-1 ring-slate-800/40"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <label className="sm:col-span-2">
              <span className="app-label">Name</span>
              <input
                className="app-input"
                value={l.label}
                onChange={(e) => setLine(i, { label: e.target.value })}
                autoComplete="off"
              />
            </label>
            <label className="sm:col-span-6">
              <span className="app-label">UTXO public key (hex)</span>
              <input
                className="app-input font-mono text-xs"
                placeholder="64 hex from payee page"
                value={l.recipientUtxoPubkeyHex}
                onChange={(e) =>
                  setLine(i, { recipientUtxoPubkeyHex: e.target.value.trim() })
                }
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <label className="sm:col-span-2">
              <span className="app-label">USDC</span>
              <input
                className="app-input font-mono text-sm"
                value={l.amount}
                onChange={(e) => setLine(i, { amount: e.target.value })}
                placeholder="0.00"
                inputMode="decimal"
                autoComplete="off"
              />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}
