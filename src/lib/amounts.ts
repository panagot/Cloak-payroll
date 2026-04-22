import { USDC_DECIMALS } from "./constants";

/**
 * USDC string "12.50" or "3" to smallest units (BigInt, 6 decimals).
 * No float math: parse integer + fractional part only.
 */
export function parseUsdcToUnits(input: string): bigint {
  const s = input.trim();
  if (!s) {
    return 0n;
  }
  if (!/^\d+(\.\d+)?$/.test(s)) {
    throw new Error("Use digits only, e.g. 12.5 or 100");
  }
  const [w, f = ""] = s.split(".");
  if (f.length > USDC_DECIMALS) {
    throw new Error(`USDC allows at most ${USDC_DECIMALS} decimal places`);
  }
  const fractional = f.padEnd(USDC_DECIMALS, "0");
  return BigInt(w) * 10n ** BigInt(USDC_DECIMALS) + BigInt(fractional);
}

export function formatUsdcFromUnits(v: bigint): string {
  const d = 10n ** BigInt(USDC_DECIMALS);
  const w = v / d;
  const f = (v % d).toString().padStart(USDC_DECIMALS, "0");
  return `${w}.${f}`;
}
