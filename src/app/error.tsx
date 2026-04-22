"use client";

import { useEffect } from "react";

/**
 * Catches client-side and recoverable RSC render errors; shows a reset so users
 * do not get stuck on a white screen after a transient failure.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h2 className="text-lg font-semibold text-slate-100">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-500">
        {error.message || "An unexpected error occurred. Try again or refresh the page."}
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-[10px] text-slate-600">ID: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="btn-primary mt-6"
      >
        Try again
      </button>
    </div>
  );
}
