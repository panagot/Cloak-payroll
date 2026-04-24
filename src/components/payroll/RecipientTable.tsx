"use client";

import { AppLabelWithTip } from "@/components/ui/InfoTip";
import type { PayrollLine } from "@/lib/cloak/payroll";
import { TIP } from "@/lib/ui-tips";

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
          className="rounded-xl border border-indigo-100/50 bg-white/70 p-4 shadow-sm shadow-indigo-100/30 transition-shadow hover:border-indigo-200/50 hover:shadow-indigo-100/50"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <label className="sm:col-span-2">
              <AppLabelWithTip label="Name" tip={TIP.payeeName} />
              <input
                className="app-input"
                value={l.label}
                onChange={(e) => setLine(i, { label: e.target.value })}
                autoComplete="off"
              />
            </label>
            <label className="sm:col-span-6">
              <AppLabelWithTip label="Payee private receive key (hex)" tip={TIP.payeeHex} />
              <input
                className="app-input font-mono text-xs"
                placeholder="64 characters from their Payee page"
                value={l.recipientUtxoPubkeyHex}
                onChange={(e) =>
                  setLine(i, { recipientUtxoPubkeyHex: e.target.value.trim() })
                }
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <label className="sm:col-span-2">
              <AppLabelWithTip label="USDC" tip={TIP.payeeAmount} />
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
