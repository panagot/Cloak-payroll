"use client";

import Link from "next/link";
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
      <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-600">
        {error.message || "An unexpected error occurred. Try again, or return home if it keeps happening."}
      </p>
      {error.digest && <p className="mt-1 font-mono text-[10px] text-slate-500">ID: {error.digest}</p>}
      <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <button type="button" onClick={reset} className="btn-primary w-full min-w-40 sm:w-auto">
          Try again
        </button>
        <Link href="/" className="btn-secondary w-full min-w-40 text-center no-underline sm:w-auto">
          Back to Treasury
        </Link>
      </div>
    </div>
  );
}
