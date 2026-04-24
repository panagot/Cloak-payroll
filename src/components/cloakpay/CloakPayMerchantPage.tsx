"use client";

import { useId, useState } from "react";
import { InfoTip } from "@/components/ui/InfoTip";
import { usdcClusterBadge } from "@/lib/constants";
import { CloakPayPageHeader } from "./CloakPayPageHeader";

const PRESETS = ["5.00", "10.00", "20.00", "open"];

export function CloakPayMerchantPage() {
  const [displayName, setDisplayName] = useState("Demo Street Café");
  const [preset, setPreset] = useState<string>(PRESETS[0]);
  const [policy, setPolicy] = useState("All sales are final. Contact support for refunds — email …");
  const id = useId();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <CloakPayPageHeader
        kicker="For the business"
        title="Merchant"
        description={<>Name and copy customers see in emails and (later) the hosted checkout. {usdcClusterBadge()}</>}
      />

      <section
        id="section-merchant-profile"
        className="app-card mb-6 scroll-mt-24 border-emerald-200/20 bg-gradient-to-b from-white to-emerald-50/10"
      >
        <h2 className="flex items-center gap-1 text-sm font-semibold text-slate-900">
          Business profile
          <InfoTip text="Stored client-side in a full app; you’d persist this in your own backend for multi-device." />
        </h2>
        <p className="mt-1 text-sm text-slate-600">Shown in receipts and on the pay screen (prototype).</p>
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
        <p className="mt-1 text-sm text-slate-600">What your POS or QR suggests before the customer overrides.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition " +
                (preset === p
                  ? "border-indigo-500 bg-indigo-50 text-indigo-900"
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
            Customer-facing policy (receipts)
          </label>
          <textarea
            id={`${id}-policy`}
            className="app-input min-h-[5rem] resize-y py-2"
            value={policy}
            onChange={(e) => setPolicy(e.target.value)}
            rows={3}
          />
        </div>
      </section>

      <section id="section-merchant-hint" className="app-card scroll-mt-24 border-slate-200/80">
        <h2 className="text-sm font-semibold text-slate-900">Checklist</h2>
        <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-slate-600">
          <li>Print a QR from <span className="font-medium text-slate-800">Link &amp; QR</span>.</li>
          <li>Train staff to point customers at <span className="font-medium text-slate-800">Customer pay</span> on their own device.</li>
          <li>Use <span className="font-medium text-slate-800">Activity</span> to reconcile the day (demo table).</li>
        </ul>
      </section>
    </div>
  );
}
