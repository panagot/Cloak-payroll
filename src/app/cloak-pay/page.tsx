import { CloakPayOverviewPage } from "@/components/cloakpay/CloakPayOverviewPage";
import { CLOAK_PAY, SITE } from "@/lib/site-links";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overview",
  description: `Cloak Pay — ${CLOAK_PAY.short} Same stack as ${SITE.name}.`,
};

export default function CloakPayHomePage() {
  return <CloakPayOverviewPage />;
}
