import { CloakPayActivityPage } from "@/components/cloakpay/CloakPayActivityPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity",
  description: "Cloak Pay — recent in-person and link payments (sample data for demo).",
};

export default function Page() {
  return <CloakPayActivityPage />;
}
