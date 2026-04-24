import Link from "next/link";
import { CloakPayPageHeader } from "./CloakPayPageHeader";

const SAMPLES = [
  { t: "Today · 12:14", from: "QR", label: "Demo counter", amt: "12.00", status: "Settled" },
  { t: "Today · 10:01", from: "Link", label: "Café east", amt: "5.00", status: "Settled" },
  { t: "Yesterday · 18:22", from: "QR", label: "Event booth", amt: "40.00", status: "Pending" },
] as const;

export function CloakPayActivityPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <CloakPayPageHeader
        kicker="Reconciliation"
        title="Activity"
        description="Sample grid for a demo. Wire this to the same compliance / viewing key patterns as the treasury when you connect real flows."
      />

      <section id="section-activity-table" className="app-card mb-6 scroll-mt-24">
        <h2 className="text-sm font-semibold text-slate-900">Recent payments</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200/60">
          <table className="w-full min-w-[28rem] text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Label</th>
                <th className="px-3 py-2">USDC</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLES.map((row) => (
                <tr key={row.t} className="border-t border-slate-200/50">
                  <td className="px-3 py-2.5 text-xs text-slate-500">{row.t}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">{row.from}</td>
                  <td className="px-3 py-2.5">{row.label}</td>
                  <td className="px-3 py-2.5 font-mono tabular-nums">{row.amt}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={
                        "rounded-md px-2 py-0.5 text-xs " +
                        (row.status === "Settled" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900")
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
        <h2 className="text-sm font-semibold text-slate-900">Export</h2>
        <p className="mt-1 text-sm text-slate-600">CSV and accounting hooks would land here, similar to your reconciliation table on the treasury.</p>
        <button type="button" className="btn-secondary mt-3" disabled>
          Download CSV (soon)
        </button>
        <p className="mt-2 text-xs text-slate-500">
          For payee withdrawal mechanics, see{" "}
          <Link
            href="/"
            className="text-indigo-600 underline decoration-indigo-200/80 hover:text-indigo-800"
          >
            Treasury
          </Link>{" "}
          and{" "}
          <Link
            href="/withdraw"
            className="text-indigo-600 underline decoration-indigo-200/80 hover:text-indigo-800"
          >
            Get paid
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
