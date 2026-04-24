import { CloakPayPresentPage } from "@/components/cloakpay/CloakPayPresentPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Link & QR",
  description: "Cloak Pay — build a pay URL and download or print a QR for the counter.",
};

export default function Page() {
  return <CloakPayPresentPage />;
}
