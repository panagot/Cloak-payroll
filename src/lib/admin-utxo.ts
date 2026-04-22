import {
  bigintToHex,
  generateUtxoKeypair,
  hexToBigint,
  type UtxoKeypair,
} from "@cloak.dev/sdk";

const STORAGE = "cloak_payroll_admin_utxo_key";

const pendingCreate: { p?: Promise<UtxoKeypair> } = {};

/**
 * Get persistent admin UTXO key (treasury’s shielded identity). All outputs & change
 * for this org should use the same keypair so chain notes share one nk.
 */
export async function ensureAdminUtxoKeypair(): Promise<UtxoKeypair> {
  if (typeof window === "undefined") {
    return generateUtxoKeypair();
  }
  const raw = localStorage.getItem(STORAGE);
  if (raw) {
    const o = JSON.parse(raw) as { privateKey: string; publicKey: string };
    if (o.privateKey && o.publicKey) {
      return {
        privateKey: hexToBigint(o.privateKey),
        publicKey: hexToBigint(o.publicKey),
      };
    }
  }
  if (!pendingCreate.p) {
    pendingCreate.p = (async () => {
      const kp = await generateUtxoKeypair();
      localStorage.setItem(
        STORAGE,
        JSON.stringify({
          privateKey: bigintToHex(kp.privateKey),
          publicKey: bigintToHex(kp.publicKey),
        })
      );
      return kp;
    })();
  }
  return pendingCreate.p;
}

export function clearAdminUtxoKeyForDev(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE);
  }
}
