import { deserializeUtxo, serializeUtxo, type Utxo } from "@cloak.dev/sdk";
import { Buffer } from "buffer";

const KEY = "cloak_payroll_serialized_spendable_utxo";

export function saveSpendableUtxo(utxo: Utxo): void {
  if (typeof window === "undefined") return;
  const b64 = Buffer.from(serializeUtxo(utxo)).toString("base64");
  localStorage.setItem(KEY, b64);
}

export async function loadSpendableUtxo(): Promise<Utxo | null> {
  if (typeof window === "undefined") return null;
  const b64 = localStorage.getItem(KEY);
  if (!b64) return null;
  const bytes = Uint8Array.from(Buffer.from(b64, "base64"));
  return deserializeUtxo(bytes);
}

export function clearSpendableUtxo(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
