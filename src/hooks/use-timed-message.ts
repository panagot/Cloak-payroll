import { useCallback, useEffect, useState } from "react";

/**
 * Show a short status string (e.g. “Copied”) and clear it after `ms`.
 */
export function useTimedMessage(ms = 2500) {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), ms);
    return () => clearTimeout(t);
  }, [message, ms]);
  const flash = useCallback((s: string) => {
    setMessage(s);
  }, []);
  return { message, flash, clear: () => setMessage(null) };
}
