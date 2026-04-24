"use client";

import type { ReactNode } from "react";

export function CloakPayShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 bg-transparent">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 100% 60% at 50% -5%, rgba(16, 185, 129, 0.08), transparent 55%), radial-gradient(ellipse 80% 50% at 0% 0%, rgba(99, 102, 241, 0.05), transparent)",
        }}
        aria-hidden
      />
      {children}
    </div>
  );
}
