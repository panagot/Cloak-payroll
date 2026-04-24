import { TIP } from "./ui-tips";
import { CLOAK_PAY } from "./site-links";

const b = CLOAK_PAY.path;

export const CLOAK_PAY_SUBROUTES = [
  { href: b, label: "Overview", title: TIP.cloakNavOverview },
  { href: `${b}/merchant`, label: "Merchant", title: TIP.cloakNavMerchant },
  { href: `${b}/present`, label: "Link & QR", title: TIP.cloakNavPresent },
  { href: `${b}/pay`, label: "Customer pay", title: TIP.cloakNavCustomer },
  { href: `${b}/activity`, label: "Activity", title: TIP.cloakNavActivity },
  { href: `${b}/settings`, label: "Settings", title: TIP.cloakNavSettings },
] as const;

export function getCloakPayToc(pathname: string): { id: string; label: string }[] {
  const p = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (p === b) {
    return [
      { id: "section-cloakpay-intro", label: "Intro" },
      { id: "section-cloakpay-flow", label: "How it works" },
      { id: "section-cloakpay-cta", label: "Pages" },
      { id: "section-cloakpay-note", label: "Roadmap" },
    ];
  }
  if (p === `${b}/merchant`) {
    return [
      { id: "section-merchant-profile", label: "Business profile" },
      { id: "section-merchant-presets", label: "Presets" },
      { id: "section-merchant-hint", label: "Checklist" },
    ];
  }
  if (p === `${b}/present`) {
    return [
      { id: "section-present-qr", label: "Link & QR" },
      { id: "section-present-print", label: "Print" },
    ];
  }
  if (p === `${b}/pay`) {
    return [
      { id: "section-customer-amount", label: "Request" },
      { id: "section-customer-flow", label: "How to pay" },
      { id: "section-customer-note", label: "Status" },
    ];
  }
  if (p === `${b}/activity`) {
    return [
      { id: "section-activity-table", label: "Payments" },
      { id: "section-activity-export", label: "Export" },
    ];
  }
  if (p === `${b}/settings`) {
    return [
      { id: "section-settings-mode", label: "Environment" },
      { id: "section-settings-data", label: "Data" },
    ];
  }
  return [];
}
