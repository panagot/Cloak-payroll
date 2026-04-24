import type { UtxoKeypair } from "@cloak.dev/sdk";

const KEY = "cloak_merchant_utxo_v1";

/** Cloak Pay merchant: separate from payee key and treasury admin key. */
export function saveMerchantUtxoKeypair(kp: UtxoKeypair): void {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({
    privateKey: kp.privateKey.toString(),
    publicKey: kp.publicKey.toString(),
  });
  localStorage.setItem(KEY, payload);
}

export function loadMerchantUtxoKeypair(): UtxoKeypair | null {
  if (typeof window === "undefined") return null;
  const s = localStorage.getItem(KEY);
  if (!s) return null;
  try {
    const j = JSON.parse(s) as { privateKey: string; publicKey: string };
    return {
      privateKey: BigInt(j.privateKey),
      publicKey: BigInt(j.publicKey),
    };
  } catch {
    return null;
  }
}

export function clearMerchantUtxoKeypair(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
