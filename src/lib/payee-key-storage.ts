import { hexToBigint, type UtxoKeypair } from "@cloak.dev/sdk";

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

function parseKeyStringField(s: string, which: "private" | "public"): bigint {
  const t = s.trim();
  if (!t) throw new Error(`Missing ${which}Key.`);
  try {
    return BigInt(t);
  } catch {
    try {
      return hexToBigint(t);
    } catch {
      throw new Error(
        `${which}Key must be a decimal string (payee export) or hex. Check you pasted the full value with no line breaks.`
      );
    }
  }
}

/**
 * Parse payee UTXO backup JSON (textarea / file read). Strips a UTF-8 BOM, trims, and
 * if needed parses only the outer `{...}` so accidental prefix text does not break JSON.
 */
export function parsePayeeUtxoKeyFromJsonText(text: string): UtxoKeypair {
  const t = text.replace(/^\uFEFF/, "").trim();
  if (!t) throw new Error("Paste is empty.");

  const tryParse = (s: string): unknown => JSON.parse(s);
  let j: unknown;
  try {
    j = tryParse(t);
  } catch (e) {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        j = tryParse(t.slice(start, end + 1));
      } catch {
        const first = e instanceof Error ? e.message : "Invalid JSON";
        throw new Error(
          `${first} — paste the JSON from your key file, from the first "{" to the last "}" only.`
        );
      }
    } else {
      const first = e instanceof Error ? e.message : "Invalid JSON";
      throw new Error(
        `${first} — expected a JSON object { "privateKey": "...", "publicKey": "..." }.`
      );
    }
  }

  if (!j || typeof j !== "object" || !("privateKey" in j) || !("publicKey" in j)) {
    throw new Error("Expected { privateKey, publicKey }.");
  }
  const p = (j as { privateKey: unknown; publicKey: unknown }).privateKey;
  const pub = (j as { privateKey: unknown; publicKey: unknown }).publicKey;
  return {
    privateKey: parseKeyStringField(
      normalizeBackupKeyField(p, "private"),
      "private"
    ),
    publicKey: parseKeyStringField(
      normalizeBackupKeyField(pub, "public"),
      "public"
    ),
  };
}

/**
 * JSON exports usually use decimal strings. Some tools use JSON numbers, which
 * is unsafe for full-sized keys; we only accept unquoted values when the number
 * is a safe integer (sufficient for tests / small dev keys).
 */
function normalizeBackupKeyField(
  v: unknown,
  which: "private" | "public"
): string {
  if (v === null || v === undefined) {
    throw new Error(`Missing ${which}Key.`);
  }
  if (typeof v === "string") return v;
  if (typeof v === "number") {
    if (!Number.isFinite(v) || !Number.isInteger(v)) {
      throw new Error(
        `${which}Key must be a whole decimal (string) from your backup — check the paste.`
      );
    }
    if (v > Number.MAX_SAFE_INTEGER || v < -Number.MAX_SAFE_INTEGER) {
      throw new Error(
        `${which}Key: number is too large for safe JSON. Use the string form: copy the JSON from Payee, or the downloaded .json (quoted decimal strings).`
      );
    }
    return String(v);
  }
  if (typeof v === "bigint") return v.toString();
  throw new Error(
    `${which}Key must be a string (decimal). Got ${typeof v} — use the key JSON from the Payee page.`
  );
}
