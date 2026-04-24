import { CloakPayCustomerPayPage } from "@/components/cloakpay/CloakPayCustomerPayPage";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Customer pay",
  description: "Cloak Pay — what the customer sees after following a pay link or QR (prototype).",
};

function PayFallback() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm text-slate-500">Loading…</p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PayFallback />}>
      <CloakPayCustomerPayPage />
    </Suspense>
  );
}
