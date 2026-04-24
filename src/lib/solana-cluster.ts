import { PublicKey } from "@solana/web3.js";

/** Values for `NEXT_PUBLIC_SOLANA_NETWORK` (matches wallet / RPC naming). */
export type SolanaClusterId = "mainnet-beta" | "devnet" | "testnet";

const MAINNET_USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
/** Circle devnet USDC (6 decimals) — must match a Cloak shield pool for this mint on devnet. */
const DEVNET_USDC = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

/**
 * Public defaults **without** `api.*.solana.com` (Solana Foundation) — those often return
 * 403 in browsers, which triggered the in-app “Public Solana RPC” warning on Vercel.
 * Ankr’s public pool is a reasonable default; override with `NEXT_PUBLIC_SOLANA_RPC` (e.g. Helius) for production.
 */
const DEFAULT_RPC_BY_CLUSTER: Record<SolanaClusterId, string> = {
  "mainnet-beta": "https://rpc.ankr.com/solana",
  devnet: "https://rpc.ankr.com/solana_devnet",
  testnet: "https://rpc.ankr.com/solana_testnet",
};

function parseCluster(): SolanaClusterId {
  const raw = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || "mainnet-beta").toLowerCase();
  if (raw === "devnet") return "devnet";
  if (raw === "testnet") return "testnet";
  return "mainnet-beta";
}

export const solanaCluster: SolanaClusterId = parseCluster();

export const isMainnetCluster = solanaCluster === "mainnet-beta";

function resolveUsdcMintString(): string {
  const override = process.env.NEXT_PUBLIC_USDC_MINT?.trim();
  if (override) return override;
  if (solanaCluster === "mainnet-beta") return MAINNET_USDC;
  if (solanaCluster === "devnet") return DEVNET_USDC;
  throw new Error(
    "NEXT_PUBLIC_USDC_MINT is required when NEXT_PUBLIC_SOLANA_NETWORK is testnet (set an SPL USDC mint that exists on that cluster)."
  );
}

/** Active USDC mint for shield / payroll (cluster-specific unless overridden). */
export const USDC_MINT = new PublicKey(resolveUsdcMintString());

export function getDefaultRpc(): string {
  return (
    process.env.NEXT_PUBLIC_SOLANA_RPC?.trim() ||
    DEFAULT_RPC_BY_CLUSTER[solanaCluster]
  );
}

/**
 * Solana Foundation’s public JSON-RPC often rate-limits or returns **403 Access forbidden**
 * (especially from browsers). Use a provider URL in `NEXT_PUBLIC_SOLANA_RPC` for production use.
 */
export function isPublicSolanaLabsRpcUrl(rpcUrl: string): boolean {
  const u = rpcUrl.toLowerCase().replace(/\/$/, "");
  return (
    u === "https://api.mainnet-beta.solana.com" ||
    u === "https://api.devnet.solana.com" ||
    u === "https://api.testnet.solana.com"
  );
}

export function shouldShowPublicRpcWarning(): boolean {
  return isPublicSolanaLabsRpcUrl(getDefaultRpc());
}

/** Solana JSON-RPC endpoint (env override or cluster default). */
export const DEFAULT_RPC = getDefaultRpc();

/**
 * Base URL for @cloak.dev/sdk relay calls (viewing-key, /commitments, /transact, /health, …).
 *
 * **Browser:** defaults to this app’s `/api/cloak-relay` so requests are same-origin and avoid
 * CORS (direct `https://api.cloak.ag/...` from arbitrary localhost ports is often blocked).
 * **Server / Node:** returns `undefined` so the SDK uses `https://api.cloak.ag` (no CORS on server).
 *
 * Override with `NEXT_PUBLIC_CLOAK_RELAY_URL` (e.g. a different relay or an absolute URL to this proxy on deploy).
 */
export function getCloakRelayUrl(): string | undefined {
  const fromEnv = process.env.NEXT_PUBLIC_CLOAK_RELAY_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api/cloak-relay`;
  }
  return undefined;
}

/** Short line for hero / footer. */
export function usdcClusterBadge(): string {
  if (solanaCluster === "mainnet-beta") {
    return "USDC mainnet — sign with Phantom in the header.";
  }
  const human = solanaCluster === "devnet" ? "Devnet" : "Testnet";
  return `USDC (${human}) — in Phantom: Settings → Developer Settings → ${human}, then connect here.`;
}

export function clusterShortTagline(): string {
  if (solanaCluster === "mainnet-beta") {
    return "USDC shielded to contractors — Solana mainnet";
  }
  return `USDC shielded to contractors — Solana ${solanaCluster}`;
}

/** Solscan transaction link with the right cluster query param. */
export function solscanTransactionUrl(signature: string): string {
  const base = `https://solscan.io/tx/${signature}`;
  if (solanaCluster === "mainnet-beta") return base;
  return `${base}?cluster=${solanaCluster}`;
}
