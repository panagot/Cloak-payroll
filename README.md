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
# set NEXT_PUBLIC_SOLANA_RPC to a good mainnet RPC
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use a wallet with **USDC (mainnet)** and a small test amount. Phantom is configured out of the box.

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
