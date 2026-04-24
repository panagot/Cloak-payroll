import { parseError } from "@cloak.dev/sdk";

/**
 * Human-readable error for UI. The SDK’s `parseError` often maps unknown failures to
 * “An unexpected error occurred.” but keeps the real RPC / program text in `originalError`.
 * We surface that so issues like wrong cluster, mint, or insufficient USDC are visible.
 */
export function formatCloakError(err: unknown): string {
  try {
    const p = parseError(err);
    const orig = String(p.originalError ?? "").trim();
    const firstLine =
      orig
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l.length > 0) ?? orig;

    if (p.message === "An unexpected error occurred." && firstLine) {
      return p.suggestion ? `${firstLine}\n\n${p.suggestion}` : firstLine;
    }

    let out = p.message;
    if (p.suggestion) {
      out += `\n\n${p.suggestion}`;
    }
    if (
      firstLine &&
      firstLine.length > 0 &&
      !out.includes(firstLine.slice(0, Math.min(48, firstLine.length)))
    ) {
      out += `\n\n${firstLine}`;
    }
    return out;
  } catch {
    return err instanceof Error ? err.message : String(err);
  }
}
