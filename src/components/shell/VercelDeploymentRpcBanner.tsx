"use client";

import { useState } from "react";

const STORAGE_KEY = "ct_vercel_rpc_banner_dismissed_v1";

/**
 * Shown on builds produced on Vercel (see next.config env). Wallet + SPL reads need a
 * mainnet JSON-RPC. Helius/others often 403 in the browser if the key’s allowed domains
 * or API product don’t include this host — not a missing key, usually dashboard config.
 */
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
      aria-label="Vercel deployment: RPC configuration"
    >
      <p>
        <strong className="font-semibold">Deployed on Vercel</strong> — for wallet USDC and on-chain calls to work, set
        a <strong>mainnet</strong> <code className="rounded border border-sky-200/80 bg-white/90 px-1">NEXT_PUBLIC_SOLANA_RPC</code> in{" "}
        <strong>Project → Settings → Environment Variables</strong> (Helius, QuickNode, Alchemy, etc.). In the
        provider dashboard, <strong>allow this site’s host</strong> (your{" "}
        <code className="text-[10px]">*.vercel.app</code> and custom domain); otherwise you may get{" "}
        <code className="text-[10px]">403 / API key is not allowed</code> even with a valid key. Redeploy after
        changes.
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
