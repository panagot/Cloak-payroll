import { PublicKey } from "@solana/web3.js";
import { CLOAK_PROGRAM_ID } from "@cloak.dev/sdk";

export { CLOAK_PROGRAM_ID };

/** USDC (mainnet) */
export const USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);

export const USDC_DECIMALS = 6;

export const DEFAULT_RPC =
  process.env.NEXT_PUBLIC_SOLANA_RPC ||
  "https://api.mainnet-beta.solana.com";
