/** Short strings for tooltips and title attributes (UX copy). */
export const TIP = {
  brand:
    "Colosseum Frontier / Cloak track — shielded USDC payroll on Solana mainnet with @cloak.dev/sdk.",
  navTreasury: "Employer: shield public USDC, add payee rows, run private payroll, copy payment JSONs for your team, reconcile on-chain history.",
  navPayee: "Get your 64-hex private-payroll key (not Phantom) to give the employer, then get paid in two steps: JSON from them, then Get paid in this app.",
  navWallet:
    "When you have the payment JSON: paste it here, connect Phantom, unshield to your public USDC balance.",
  navDemo:
    "Automatic demo: the full path runs on its own after keys load (timed stages, no step clicking). Or Restart for a new run.",
  navCloakPay:
    "Cloak Pay: in-person and link pay; QR, merchant setup, customer view, and activity (prototype).",
  cloakNavOverview: "Cloak Pay home — journey and links to subpages.",
  cloakNavMerchant:
    "In one place: 64-hex UTXO receive key, name and defaults, and pay links/QR that pass your UTXO (mpk) in the query (prototype).",
  cloakNavCustomer: "What the customer sees after scan—shielded pay flow (mock).",
  cloakNavActivity: "Recent in-person and link payments (sample data for demo).",
  cloakNavSettings: "Disclosure and environment; not a custodial product.",
  cloakPayMerchantUtxo:
    "Cloak’s shielded ‘address’ for this business: 64 hex characters. It is not a Solana wallet address. The pay link / QR opens the customer page; a full integration would route private USDC to this UTXO the same way payroll uses a 64-hex line.",
  utxoPublicKey:
    "Cloak’s shielded address: 64 hex characters. The treasury pastes it into payroll so funds route to your private UTXO — not a normal wallet address.",
  payeeName: "A label for you to remember the row (e.g. contractor or invoice id).",
  payeeAmount: "USDC to send in this private transfer. Uses 6 decimal places. Must fit your shielded balance.",
  payeeHex: "The payee’s 64-character hex from Payee keys. Each line is one on-chain private transfer (Cloak 2×2 circuit).",
  shieldAmount: "Amount of public USDC in your connected wallet to move into the shielded pool. Start small on mainnet.",
  shieldStep:
    "Move public USDC from your Phantom token account into Cloak’s shielded pool, creating spendable private balance for the treasury UTXO key stored in this browser.",
  shieldAction: "Deposits public USDC and creates a spendable shielded UTXO for the treasury key in this browser.",
  treasuryUtxo:
    "Your admin Cloak UTXO key: shielded change and balance are tracked for this key in this browser. Back up via viewing key for audit, not for spending as payee.",
  shieldedBalance: "USDC in the private pool for this treasury UTXO. Not the same as visible Phantom USDC balance.",
  runPayroll:
    "Each filled line runs as a separate private transfer, in order, until your shielded balance is exhausted. Each payee needs a valid 64-hex key and amount.",
  reconcile:
    "Scans on-chain Cloak program transactions using your admin viewing key and shows a history table (RPC only, no extra service).",
  payeeBundle:
    "JSON the payee needs on “To wallet” to merge with their UTXO secret and unshield to a public address. One bundle per paid line.",
  copyBundle: "Copy this JSON to email or chat so the payee can paste it on the To wallet page.",
  viewKey:
    "The nk (viewing key) decrypts on-chain history for this treasury. Anyone with it can see compliance data — keep it offline, never in public posts.",
  withdrawKey: "The same UTXO key you generated on Payee keys. It must match the 64-hex the treasury paid. Import JSON if you switched browsers.",
  paymentBundle: "Pasted from the treasury after a successful payroll line. Contains on-chain UTXO fields; your secret key is not inside the bundle — you add it from storage.",
  withdrawWallet:
    "Phantom (or your adapter) signs the withdraw transaction. USDC will appear in this wallet’s normal SPL USDC account after confirmation.",
  unshieldButton: "Builds a Cloak withdraw to move shielded USDC to your public token account. May take a minute for proof generation.",
  sidebarOnPage: "Jump to a section of this page. The treasury page has the full pay flow; payee/withdraw are shorter.",
  payeeDownload:
    "Contains your private and public UTXO field elements as decimal strings. Treat like a password — do not share.",
  generatePayeeKey:
    "Creates a new random Cloak UTXO keypair in this browser and stores it in local storage. Download a JSON backup; without the private part you cannot unshield what is paid to this UTXO.",
  importKeyJson:
    "Paste the full object from Payee (Copy as JSON) or the downloaded .json, or use Load from file. privateKey and publicKey are long decimal strings in quotes. It must be the same key the treasury used for your 64-hex line.",
  walletConnect:
    "Connect Phantom (or another supported adapter) to sign on-chain USDC and Cloak instructions. The treasury and payee pages use the same connection control.",
  copyPublicHex: "Copy your 64-character public key for email, Slack, or the payroll form.",
  payeeCopyKeyJson:
    "Exact JSON you can paste into Get paid (Import) on another browser — same as the download file, without saving a file. Treat it like a password; anyone with it can unshield if they also get a payment JSON.",
  payeeShowSecret:
    "Your private and public UTXO values as long decimal numbers (same as in the JSON file). You need the private one to unshield. Never post these in public channels.",
  footerBounty: "Read the Colosseum Frontier / Cloak track brief (Superteam listing).",
  footerCloak: "Cloak: shielded program on Solana. Official product site.",
} as const;
