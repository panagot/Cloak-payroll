"use client";

import { useState } from "react";

const STORAGE_KEY = "ct_vercel_rpc_banner_dismissed_v1";

const REPO_URL = "https://github.com/panagot/Cloak-payroll";

/** Shown on Vercel builds; short nudge: configure your own RPC. Full steps are in the repo. */
export function VercelDeploymentRpcBanner() {
  const onVercel = process.env.NEXT_PUBLIC_ON_VERCEL === "1";
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (!onVercel || dismissed) return null;

  return (
    <div
      className="relative z-[55] border-b border-sky-200/60 bg-sky-50/95 px-3 py-2 pr-10 text-center text-[11px] leading-relaxed text-sky-950"
      role="region"
      aria-label="Vercel deployment: self-host configuration"
    >
      <p>
        Use your own Solana API key (e.g. Helius) in environment variables. Setup details and code are in the open-source
        repo:{" "}
        <a
          href={REPO_URL}
          className="font-medium text-sky-900 underline decoration-sky-300/80 underline-offset-2 hover:text-sky-950"
          target="_blank"
          rel="noreferrer"
        >
          github.com/panagot/Cloak-payroll
        </a>
        .
      </p>
      <button
        type="button"
        onClick={() => {
          try {
            sessionStorage.setItem(STORAGE_KEY, "1");
          } catch {
            // ignore
          }
          setDismissed(true);
        }}
        className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md border border-sky-200/80 bg-white/90 px-2 py-0.5 text-[10px] font-medium text-sky-800 hover:bg-sky-100"
      >
        Dismiss
      </button>
    </div>
  );
}
