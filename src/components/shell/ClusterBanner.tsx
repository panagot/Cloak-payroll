import { solanaCluster } from "@/lib/constants";

/**
 * Shown when not on mainnet so Phantom’s cluster matches RPC (build-time cluster from env).
 */
export function ClusterBanner() {
  if (solanaCluster === "mainnet-beta") return null;
  const phantomNetwork = solanaCluster === "devnet" ? "Devnet" : "Testnet";
  return (
    <div className="border-b border-amber-200/60 bg-gradient-to-r from-amber-50/95 via-white to-amber-50/80 px-4 py-2.5 text-center text-xs leading-relaxed text-amber-950/95">
      <strong className="font-semibold">Non-mainnet cluster ({solanaCluster})</strong>
      {" — "}
      Set Phantom to <span className="whitespace-nowrap font-medium">{phantomNetwork}</span> (Settings →
      Developer Settings) so balances and signatures match this app. Fund the wallet with{" "}
      {solanaCluster === "devnet" ? "devnet SOL and devnet USDC" : "test SOL and your configured USDC mint"}.
    </div>
  );
}
