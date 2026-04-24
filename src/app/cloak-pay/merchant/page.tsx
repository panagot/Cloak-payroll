import { CloakPayMerchantPage } from "@/components/cloakpay/CloakPayMerchantPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Merchant",
  description: "Cloak Pay — business name, default amounts, and customer-facing copy.",
};

export default function Page() {
  return <CloakPayMerchantPage />;
}
