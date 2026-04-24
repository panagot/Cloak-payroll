import { TIP } from "./ui-tips";
import { CLOAK_PAY } from "./site-links";

const b = CLOAK_PAY.path;

export const CLOAK_PAY_SUBROUTES = [
  { href: b, label: "Overview", title: TIP.cloakNavOverview },
  { href: `${b}/merchant`, label: "Merchant", title: TIP.cloakNavMerchant },
  { href: `${b}/pay`, label: "Customer pay", title: TIP.cloakNavCustomer },
  { href: `${b}/activity`, label: "Activity", title: TIP.cloakNavActivity },
  { href: `${b}/settings`, label: "Settings", title: TIP.cloakNavSettings },
] as const;

/** One-line blurbs for the overview grid (excludes self / overview). */
export const CLOAK_PAY_CTA_CARDS: readonly { href: string; label: string; blurb: string; icon: string }[] = [
  {
    href: `${b}/merchant`,
    label: "Merchant",
    blurb: "Generate your receive key, set branding, and build pay links/QR (with your UTXO) for the register.",
    icon: "🏪",
  },
  { href: `${b}/pay`, label: "Customer pay", blurb: "The checkout your buyer sees—now with a payment simulation.", icon: "💳" },
  {
    href: `${b}/activity`,
    label: "Activity",
    blurb: "Sample list of link and counter payments; export is stubbed.",
    icon: "list",
  },
  { href: `${b}/settings`, label: "Settings", blurb: "Cluster, disclosure, and links back to the main app.", icon: "⚙️" },
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
      { id: "section-merchant-utxo", label: "Receive key" },
      { id: "section-merchant-profile", label: "Business profile" },
      { id: "section-merchant-presets", label: "Default amounts" },
      { id: "section-merchant-qr", label: "Pay link & QR" },
      { id: "section-merchant-preview", label: "Preview" },
      { id: "section-merchant-hint", label: "Checklist" },
    ];
  }
  if (p === `${b}/pay`) {
    return [
      { id: "section-customer-order", label: "Order" },
      { id: "section-customer-checkout", label: "Pay" },
      { id: "section-customer-disclaimer", label: "More" },
    ];
  }
  if (p === `${b}/activity`) {
    return [
      { id: "section-activity-summary", label: "Summary" },
      { id: "section-activity-table", label: "Payments" },
      { id: "section-activity-export", label: "Export" },
    ];
  }
  if (p === `${b}/settings`) {
    return [
      { id: "section-settings-mode", label: "Environment" },
      { id: "section-settings-privacy", label: "Privacy" },
      { id: "section-settings-data", label: "Links" },
    ];
  }
  return [];
}
