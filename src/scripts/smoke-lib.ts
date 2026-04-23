/**
 * Library smoke test: payee payment bundle round-trip (no network, no Solana RPC).
 * Run: npx tsx --tsconfig tsconfig.json src/scripts/smoke-lib.ts
 */
import { PublicKey } from "@solana/web3.js";
import {
  parsePayeeBundleJson,
  toPayeePaymentBundle,
  utxoFromBundle,
} from "@/lib/payee-bundle";
import type { Utxo, UtxoKeypair } from "@cloak.dev/sdk";

const usdc = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const payeePub = 1234567890123456789012345678901n;
const recipientOut: Utxo = {
  amount: 1_000_000n,
  blinding: 9876543210n,
  keypair: { privateKey: 0n, publicKey: payeePub },
  mintAddress: usdc,
  index: 42,
  commitment: 111n,
  siblingCommitment: 222n,
};

const payeeKp: UtxoKeypair = {
  privateKey: 999888777666555n,
  publicKey: payeePub,
};

const bundle = toPayeePaymentBundle("Contractor A", recipientOut, "3sig3abc");
const round = parsePayeeBundleJson(JSON.stringify(bundle));
if (round.v !== 1) throw new Error("bundle v");
if (round.label !== "Contractor A") throw new Error("bundle label");
if (round.amount !== "1000000") throw new Error("bundle amount");
if (round.utxoPublicKey !== payeePub.toString()) throw new Error("bundle pk");

const utxo = utxoFromBundle(round, payeeKp);
if (utxo.keypair.privateKey !== payeeKp.privateKey) throw new Error("merge key");
if (utxo.amount !== 1_000_000n) throw new Error("amount");
if (utxo.mintAddress.toBase58() !== usdc.toBase58()) throw new Error("mint");
if (utxo.index !== 42) throw new Error("index");

const badKp: UtxoKeypair = { privateKey: 1n, publicKey: 2n };
let threw = false;
try {
  utxoFromBundle(round, badKp);
} catch {
  threw = true;
}
if (!threw) throw new Error("expected wrong key to throw");

console.log("ok: payee bundle round-trip + key mismatch");
