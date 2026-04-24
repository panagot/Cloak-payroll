"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { InfoTip } from "@/components/ui/InfoTip";
import { CloakPayPageHeader } from "./CloakPayPageHeader";

const SAMPLES = [
  { t: "Today · 12:14", from: "QR" as const, label: "Demo counter", amt: 12.0, status: "Settled" as const },
  { t: "Today · 10:01", from: "Link" as const, label: "Café east", amt: 5.0, status: "Settled" as const },
  { t: "Yesterday · 18:22", from: "QR" as const, label: "Event booth", amt: 40.0, status: "Pending" as const },
] as const;

type Filter = "all" | "Settled" | "Pending";

export function CloakPayActivityPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const rows = useMemo(() => {
    if (filter === "all") return SAMPLES;
    return SAMPLES.filter((r) => r.status === filter);
  }, [filter]);

  const total = useMemo(() => SAMPLES.reduce((a, r) => a + r.amt, 0), []);
  const settledN = SAMPLES.filter((r) => r.status === "Settled").length;

  return (
    <div className="py-6 sm:py-8 lg:py-10">
      <CloakPayPageHeader
        kicker="Reconciliation"
        title="Activity"
        description={
          <>
            Mock data for a walkthrough. Wire to your <strong className="font-medium text-slate-800">viewing key</strong> and
            the same ideas as payroll reconciliation.
            <InfoTip
              className="ms-0.5 translate-y-0.5"
              text="When live, this table would be backed by your Cloak program history or a backend; nothing here is stored in a server today."
            />
          </>
        }
      />

      <div id="section-activity-summary" className="mb-6 grid scroll-mt-24 gap-3 sm:grid-cols-3">
        <div className="app-card border-indigo-100/80 bg-gradient-to-br from-indigo-50/40 to-white">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Volume (sample)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
            {total.toFixed(2)} <span className="text-base font-semibold text-slate-500">USDC</span>
          </p>
        </div>
        <div className="app-card border-emerald-100/80 bg-gradient-to-br from-emerald-50/30 to-white">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Settled (sample)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-800">{settledN}</p>
        </div>
        <div className="app-card border-slate-200/80">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Source mix</p>
          <p className="mt-1 text-sm text-slate-700">QR: 2 · Link: 1</p>
        </div>
      </div>

      <section id="section-activity-table" className="app-card mb-6 scroll-mt-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Recent payments</h2>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
            {(["all", "Settled", "Pending"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={
                  "rounded-full border px-3 py-1 text-xs font-medium transition " +
                  (filter === f
                    ? "border-indigo-500 bg-indigo-100/90 text-indigo-900"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")
                }
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200/50 bg-white/50">
          <table className="w-full min-w-[28rem] text-left text-sm text-slate-600">
            <thead className="bg-slate-100/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2.5">When</th>
                <th className="px-3 py-2.5">Source</th>
                <th className="px-3 py-2.5">Label</th>
                <th className="px-3 py-2.5 text-right">USDC</th>
                <th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.t} className="border-t border-slate-200/50 transition hover:bg-slate-50/80">
                  <td className="px-3 py-2.5 text-xs text-slate-500">{row.t}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={
                        "rounded-md px-2 py-0.5 text-xs font-medium " +
                        (row.from === "QR" ? "bg-sky-100/80 text-sky-900" : "bg-violet-100/80 text-violet-900")
                      }
                    >
                      {row.from}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-800">{row.label}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-800">{row.amt.toFixed(2)}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={
                        "inline-flex rounded-md px-2 py-0.5 text-xs " +
                        (row.status === "Settled" ? "bg-emerald-100/90 text-emerald-900" : "bg-amber-100/90 text-amber-900")
                      }
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="section-activity-export" className="app-card scroll-mt-24 border-slate-200/80">
        <h2 className="text-sm font-semibold text-slate-900">Export &amp; ops</h2>
        <p className="mt-1 text-sm text-slate-600">Hook CSV or a ledger the same way you do on the treasury reconciliation block.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" disabled>
            Download CSV
          </button>
          <span className="self-center text-xs text-slate-500">(Coming soon — demo only.)</span>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          <Link href="/" className="font-medium text-indigo-700 hover:text-indigo-900">
            Treasury
          </Link>{" "}
          and{" "}
          <Link href="/withdraw" className="font-medium text-indigo-700 hover:text-indigo-900">
            Get paid
          </Link>{" "}
          cover the employer → employee shielded path this product sits beside.
        </p>
      </section>
    </div>
  );
}
