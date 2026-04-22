"use client";

import { Buffer } from "buffer";
import { useEffect } from "react";

/**
 * Some Solana + Cloak paths expect `Buffer` in the browser.
 */
export function BufferPolyfill() {
  useEffect(() => {
    if (typeof globalThis !== "undefined" && !(globalThis as { Buffer?: unknown }).Buffer) {
      (globalThis as { Buffer: typeof Buffer }).Buffer = Buffer;
    }
  }, []);
  return null;
}
