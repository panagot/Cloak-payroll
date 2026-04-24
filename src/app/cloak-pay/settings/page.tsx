import { CloakPaySettingsPage } from "@/components/cloakpay/CloakPaySettingsPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Cloak Pay — environment, disclosure, and cross-links to the main app.",
};

export default function Page() {
  return <CloakPaySettingsPage />;
}
