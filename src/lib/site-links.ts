/** In-app and outbound links (bounty, docs, related work). */
export const SITE = {
  name: "Cloak Payroll",
  shortTagline: "USDC shielded to contractors — Solana mainnet",
  context: "Colosseum · Frontier / Cloak track",
} as const;

/** In-person & link-based shielded checkouts — related product surface in this app. */
export const CLOAK_PAY = {
  label: "Cloak Pay",
  path: "/cloak-pay",
  short: "Scan or tap — shielded USDC for your business",
} as const;

/** True on `/cloak-pay` (and subpaths) for active nav / page sections. */
export function isCloakPayPath(pathname: string) {
  return pathname === CLOAK_PAY.path || pathname.startsWith(`${CLOAK_PAY.path}/`);
}

export const LINKS = {
  /** [Superteam — Cloak track](https://superteam.fun/earn/listing/cloak-track) */
  bounty: "https://superteam.fun/earn/listing/cloak-track",
  /** [Cloak](https://cloak.ag) */
  cloak: "https://cloak.ag",
  /** [Cloak SDK](https://docs.cloak.ag/sdk/introduction) */
  sdkDocs: "https://docs.cloak.ag/sdk/introduction",
  /** [Privacy Auctions (reference UI)](https://github.com/panagot/Privacy-Auctions) */
  privacyAuctions: "https://github.com/panagot/Privacy-Auctions",
  /** [AUDD Subscriptions (reference UI)](https://github.com/panagot/sol-audd-subscriptions) */
  auddSubs: "https://github.com/panagot/sol-audd-subscriptions",
} as const;

/** Set in `.env.local` to show “View repository” in the footer. */
export function repoUrl(): string | null {
  const u = process.env.NEXT_PUBLIC_GITHUB_REPO;
  if (u && u.startsWith("http")) {
    return u;
  }
  return null;
}
