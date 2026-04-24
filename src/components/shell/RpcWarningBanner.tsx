import { shouldShowPublicRpcWarning } from "@/lib/constants";

/**
 * Shown when `NEXT_PUBLIC_SOLANA_RPC` is (or defaults to) Solana’s public RPC, which often
 * returns 403 for `getAccount` / simulation during shield — not an app bug.
 */
export function RpcWarningBanner() {
  if (!shouldShowPublicRpcWarning()) return null;
  return (
    <div className="border-b border-amber-200/60 bg-gradient-to-r from-amber-50/95 via-white to-orange-50/50 px-4 py-2.5 text-center text-xs leading-relaxed text-amber-950/95">
      <strong className="font-semibold">Public Solana RPC</strong> — you pointed{" "}
      <code className="rounded border border-amber-200/70 bg-white/90 px-1.5 text-[11px]">NEXT_PUBLIC_SOLANA_RPC</code> at
      Solana’s <code className="text-[11px]">api.*.solana.com</code>, which often returns{" "}
      <strong>403 Access forbidden</strong> in the browser. Set it to a provider (Helius, QuickNode, Alchemy, etc. — a{" "}
      <strong>mainnet</strong> URL with your key) in <code className="text-[11px]">.env.local</code> or your host’s
      environment (e.g. Vercel), then redeploy or restart the dev server.
    </div>
  );
}
