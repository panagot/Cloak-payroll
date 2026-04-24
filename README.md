# Cloak Shielded Payroll

A small **treasury console** for teams that need **USDC payroll to contractors without publishing per-person amounts and relationships on a block explorer**. The app uses [Cloak](https://cloak.ag) on **Solana mainnet**: you shield USDC from a connected wallet, then pay each person’s **shielded UTXO public key** (not their Solana address) with a sequence of **private `transfer` calls** from the [@cloak.dev/sdk](https://www.npmjs.com/package/@cloak.dev/sdk). You reconcile in-app with a **32-byte viewing key (nk)** via `scanTransactions` / compliance-style reporting.

## The problem and who it is for

- **Problem**: On Solana, ordinary token transfers are fully public. Payroll-like flows leak salary and counterparty data permanently.
- **Users**: Admins and finance leads at small orgs or DAOs who can accept self-custody in the browser and want **shielded, auditable (to them) stablecoin payouts**.

## How the Cloak SDK is central

| Capability | How we use it |
|------------|----------------|
| **Shielded USDC** | `transact` with a USDC `externalAmount` deposit and two padded UTXO inputs/outputs. |
| **Private payout** | `transfer` from the treasury UTXO to each payee’s UTXO **public key (bigint)**, reusing the same **admin UTXO keypair** for change. |
| **2×2 circuit** | The SDK allows up to two inputs/outputs per transaction, so a multi-person payroll is implemented as **one private transfer per payee** in sequence — still a single “run private payroll” action in the UI. |
| **Viewing / audit** | The treasury’s `nk` from `getNkFromUtxoPrivateKey` powers **on-chain** `scanTransactions` for reconciliation. |

> **Cloak program (mainnet)**  
> The SDK re-exports the live program: import `CLOAK_PROGRAM_ID` from `@cloak.dev/sdk` (or read it at runtime in the “Show program” disclosure in the app).

**Deployed / demo (fill in when you ship)**  
- Frontend: `TBD` — e.g. Vercel `https://…`  
- On-chain: default Cloak **shield pool** program = `CLOAK_PROGRAM_ID` from the SDK (see UI advanced section).

## Setup and run

```bash
cd cloak-shielded-payroll
cp .env.example .env.local
# Optional: set NEXT_PUBLIC_SOLANA_RPC to Helius/QuickNode/etc. (see “RPC” below)
npm install
npm run dev
```

Always run these commands **inside `cloak-shielded-payroll/`** (not the parent `Cloak Track` folder). If the page looks **unstyled / white**, stop the dev server and run `npm run dev:clean` (clears `.next` then starts again).

**RPC:** The app’s built-in default is **not** `api.*.solana.com` (those often return **403** in browsers). It uses **Ankr** public pool URLs unless you set **`NEXT_PUBLIC_SOLANA_RPC`**. If you still see **403** (or need higher limits), set `.env.local` to a **mainnet** provider URL from [Helius](https://helius.dev), [QuickNode](https://www.quicknode.com), [Alchemy](https://www.alchemy.com/solana), or similar, then restart `npm run dev`. The **amber “Public Solana RPC”** banner only appears if your configured RPC is explicitly a **Solana Foundation** `https://api.*.solana.com` URL.

Open the URL printed by Next (e.g. [http://localhost:3000](http://localhost:3000)). Use a wallet with **USDC** on the cluster you selected and a small test amount. Phantom is configured out of the box.

**Cloak API / CORS:** The SDK calls `https://api.cloak.ag` for viewing-key registration, commitments, transact relay, etc. Browsers often block that from non-standard `localhost` ports. This app adds **`/api/cloak-relay`** — a server proxy to `api.cloak.ag` — and uses it as the relay base in the browser so those calls are **same-origin**. You normally do not need to set `NEXT_PUBLIC_CLOAK_RELAY_URL`.

### Devnet / testnet (e.g. demo video without mainnet funds)

The app reads **`NEXT_PUBLIC_SOLANA_NETWORK`** (`mainnet-beta` default, or `devnet` / `testnet`). It picks a **default RPC** and (unless you set **`NEXT_PUBLIC_USDC_MINT`**) uses **mainnet USDC**, **Circle devnet USDC**, or **requires a mint for testnet**.

1. Copy `.env.example` → `.env.local` and set:
   - `NEXT_PUBLIC_SOLANA_NETWORK=devnet`
   - Optionally `NEXT_PUBLIC_SOLANA_RPC=…` (default devnet is Ankr public; no need to use `api.devnet.solana.com` for local dev)
2. In **Phantom**: Settings → Developer Settings → **Devnet**, then airdrop devnet SOL and get **devnet USDC** (e.g. spl-token faucet / Circle devnet USDC for mint `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`).
3. Restart `npm run dev`. The yellow **cluster banner** reminds you to match Phantom to the app.

**Important:** Cloak’s default **relay** (`https://api.cloak.ag`) is built around **mainnet** production traffic. **Shield / transfer / withdraw on devnet may fail** if the program, shield pool for that USDC mint, or relay Merkle state are not available for your cluster. If devnet errors persist, record the demo on **mainnet with a tiny USDC amount** instead.

### Payee flow

- Contractors open [`/payee`](http://localhost:3000/payee), generate a **receive key** (UTXO public key, 64 hex chars), and send it to the admin.  
- The admin pastes that into the payroll table — **not** the Solana address.

### Local persistence

- A **treasury UTXO keypair** and the last **spendable serialized UTXO** are kept in `localStorage` in this browser so you can continue after refresh. This is a hackathon tradeoff; production apps would use safer key storage.

## Build

```bash
npm run build
npm start
```

## Demo video (under 5 minutes) — storyboard

1. **Problem** — show an explorer: public USDC transfer vs what we want.  
2. **Deposit** — shield USDC; mention ZK proof + relay.  
3. **Pay** — two payee lines, run payroll; show Solscan where amounts/counterparties are not the story.  
4. **Reconcile** — “Reconcile (scan on-chain)”; show decrypted-style rows.  
5. **Viewing key** — show reveal + “store nk offline” + why auditors matter in real life.

## References

- Bounty: [Cloak Track on Superteam Earn](https://superteam.fun/earn/listing/cloak-track)  
- [Cloak SDK docs](https://docs.cloak.ag/sdk/introduction)  
- [UTXO API](https://docs.cloak.ag/sdk/utxo-transactions) · [Viewing keys](https://docs.cloak.ag/architecture/viewing-keys-compliance)  

## Colosseum submission

Submissions also need the [Colosseum Frontier portal](https://arena.colosseum.org) as listed in the bounty (update this link if the org changes process).

## License

Apache-2.0 (align with [@cloak.dev/sdk](https://github.com/cloak-ag/sdk)).
