import type { UtxoKeypair } from "@cloak.dev/sdk";

const KEY = "cloak_payee_utxo_keypair_v1";

export function savePayeeUtxoKeypair(kp: UtxoKeypair): void {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({
    privateKey: kp.privateKey.toString(),
    publicKey: kp.publicKey.toString(),
  });
  localStorage.setItem(KEY, payload);
}

export function loadPayeeUtxoKeypair(): UtxoKeypair | null {
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

export function clearPayeeUtxoKeypair(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function hasStoredPayeeKey(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem(KEY));
}
