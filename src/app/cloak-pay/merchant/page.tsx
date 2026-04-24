import { CloakPayMerchantPage } from "@/components/cloakpay/CloakPayMerchantPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Merchant",
  description: "Cloak Pay — shielded UTXO receive key, business profile, and pay links/QR (with mpk) for checkout.",
};

export default function Page() {
  return <CloakPayMerchantPage />;
}
