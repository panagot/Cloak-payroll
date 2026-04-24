import {
  CLOAK_PROGRAM_ID,
  createUtxo,
  createZeroUtxo,
  getNkFromUtxoPrivateKey,
  sumUtxoAmounts,
  transact,
  transfer,
  type MerkleTree,
  type Utxo,
  type UtxoKeypair,
} from "@cloak.dev/sdk";
import {
  type Connection,
  type PublicKey,
  type Transaction,
  type VersionedTransaction,
} from "@solana/web3.js";
import { toPayeePaymentBundle, type PayeePaymentBundle } from "@/lib/payee-bundle";
import { getCloakRelayUrl, USDC_MINT } from "@/lib/constants";

export function buildViewingKeyNkFromAdminKp(kp: UtxoKeypair) {
  return getNkFromUtxoPrivateKey(kp.privateKey);
}

type SignTx = <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>;
type SignMsg = (m: Uint8Array) => Promise<Uint8Array>;

export function baseTransactOptions(
  connection: Connection,
  wallet: PublicKey,
  signTransaction: SignTx,
  signMessage: SignMsg,
  adminKp: UtxoKeypair,
  cachedMerkleTree?: MerkleTree
) {
  const nk = getNkFromUtxoPrivateKey(adminKp.privateKey);
  return {
    connection,
    programId: CLOAK_PROGRAM_ID,
    relayUrl: getCloakRelayUrl(),
    signTransaction,
    signMessage,
    walletPublicKey: wallet,
    depositorPublicKey: wallet,
    chainNoteViewingKeyNk: nk,
    cachedMerkleTree,
  } as const;
}

/** Form row: amount is free text until you run payroll. */
export type PayrollLine = {
  label: string;
  /** Recipient UTXO public key (from payee) as 32-byte hex, 64 chars. */
  recipientUtxoPubkeyHex: string;
  amount: string;
};

export type ResolvedPayrollLine = {
  label: string;
  recipientUtxoPubkeyHex: string;
  amountUnits: bigint;
};

export function parsePubkeyField(hex: string): bigint {
  const clean = hex.trim().replace(/^0x/i, "");
  if (clean.length !== 64) {
    throw new Error("Recipient UTXO public key must be 32 bytes in hex (64 characters)");
  }
  return BigInt("0x" + clean);
}

/**
 * Move public USDC (treasury) into the shielded pool, creating a spendable UTXO for the admin.
 */
export async function depositUsdc(
  connection: Connection,
  wallet: PublicKey,
  signTransaction: SignTx,
  signMessage: SignMsg,
  amountUnits: bigint,
  adminKp: UtxoKeypair,
  cachedMerkleTree: MerkleTree | undefined
) {
  if (amountUnits <= 0n) {
    throw new Error("Deposit amount must be positive");
  }
  const out = await createUtxo(amountUnits, adminKp, USDC_MINT);
  const z0 = await createZeroUtxo(USDC_MINT);
  const z1 = await createZeroUtxo(USDC_MINT);
  const pad = await createZeroUtxo(USDC_MINT);
  return transact(
    {
      inputUtxos: [z0, z1],
      outputUtxos: [out, pad],
      externalAmount: amountUnits,
      depositor: wallet,
    },
    {
      ...baseTransactOptions(
        connection,
        wallet,
        signTransaction,
        signMessage,
        adminKp,
        cachedMerkleTree
      ),
    }
  );
}

export function pickAdminChangeUtxo(
  resultOutputs: Utxo[],
  adminKp: UtxoKeypair
): Utxo | null {
  for (const o of resultOutputs) {
    if (o.amount > 0n && o.keypair.privateKey === adminKp.privateKey) {
      return o;
    }
  }
  return null;
}

/**
 * Pays each line with a private shielded transfer. The Cloak UTXO circuit is 2×2, so each
 * line is a separate on-chain (still fully shielded) transfer — one payroll run, many
 * private payouts.
 */
export async function runPayrollTransfers(
  connection: Connection,
  wallet: PublicKey,
  signTransaction: SignTx,
  signMessage: SignMsg,
  adminKp: UtxoKeypair,
  startUtxo: Utxo,
  lines: ResolvedPayrollLine[],
  onProgress: (m: string) => void
): Promise<{
  lastUtxo: Utxo | null;
  lastMerkle: MerkleTree | undefined;
  signatures: string[];
  /** One JSON bundle per paid line — send to the payee to use on “To wallet”. */
  payeeBundles: PayeePaymentBundle[];
}> {
  let current: Utxo = startUtxo;
  let cached: MerkleTree | undefined;
  const sigs: string[] = [];
  const payeeBundles: PayeePaymentBundle[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const toPk = parsePubkeyField(line.recipientUtxoPubkeyHex);
    const have = sumUtxoAmounts([current]);
    if (have < line.amountUnits) {
      throw new Error(
        `Line ${i + 1} (${line.label}): need ${line.amountUnits} units, note has ${have}.`
      );
    }
    onProgress(
      `Private transfer ${i + 1} of ${lines.length} — ${line.label} — proving (wallet may sign again)…`
    );
    const r = await transfer(
      [current],
      toPk,
      line.amountUnits,
      {
        ...baseTransactOptions(
          connection,
          wallet,
          signTransaction,
          signMessage,
          adminKp,
          cached
        ),
        onProgress,
      }
    );
    sigs.push(r.signature);
    cached = r.merkleTree;
    const recipientUtxo = r.outputUtxos[0];
    if (recipientUtxo) {
      payeeBundles.push(
        toPayeePaymentBundle(line.label, recipientUtxo, r.signature)
      );
    }
    const next = pickAdminChangeUtxo(r.outputUtxos, adminKp);
    if (!next) {
      if (i < lines.length - 1) {
        throw new Error("No change UTXO after a transfer, but more payees remain. Add funds.");
      }
      return {
        lastUtxo: null,
        lastMerkle: r.merkleTree,
        signatures: sigs,
        payeeBundles,
      };
    }
    current = next;
  }
  return { lastUtxo: current, lastMerkle: cached, signatures: sigs, payeeBundles };
}
