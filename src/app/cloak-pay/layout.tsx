import { CloakPayShell } from "@/components/cloakpay/CloakPayShell";
import { CLOAK_PAY, SITE } from "@/lib/site-links";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: `${CLOAK_PAY.label} — ${SITE.name}`, template: `%s — ${CLOAK_PAY.label}` },
  description: `${CLOAK_PAY.short} In-person and link pay with shielded USDC (prototype).`,
  openGraph: {
    title: `${CLOAK_PAY.label} — ${SITE.name}`,
    description: `${CLOAK_PAY.short}`,
  },
};

export default function CloakPayLayout({ children }: { children: ReactNode }) {
  return <CloakPayShell>{children}</CloakPayShell>;
}
