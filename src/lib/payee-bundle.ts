import { PublicKey } from "@solana/web3.js";
import type { Utxo } from "@cloak.dev/sdk";
import type { UtxoKeypair } from "@cloak.dev/sdk";

const BUNDLE_V = 1 as const;

/** Serialized by treasury after a private transfer so the payee can merge in their UTXO secret and withdraw. */
export type PayeePaymentBundle = {
  v: typeof BUNDLE_V;
  label: string;
  amount: string;
  blinding: string;
  /** UTXO public key (field element) as decimal string. */
  utxoPublicKey: string;
  mint: string;
  index?: number;
  commitment?: string;
  siblingCommitment?: string;
  transferSignature: string;
};

export function toPayeePaymentBundle(
  label: string,
  recipientOutput: Utxo,
  transferSignature: string
): PayeePaymentBundle {
  return {
    v: BUNDLE_V,
    label,
    amount: recipientOutput.amount.toString(),
    blinding: recipientOutput.blinding.toString(),
    utxoPublicKey: recipientOutput.keypair.publicKey.toString(),
    mint: recipientOutput.mintAddress.toBase58(),
    index: recipientOutput.index,
    commitment:
      recipientOutput.commitment != null
        ? recipientOutput.commitment.toString()
        : undefined,
    siblingCommitment:
      recipientOutput.siblingCommitment != null
        ? recipientOutput.siblingCommitment.toString()
        : undefined,
    transferSignature,
  };
}

export function parsePayeeBundleJson(text: string): PayeePaymentBundle {
  const raw: unknown = JSON.parse(text);
  if (
    !raw ||
    typeof raw !== "object" ||
    (raw as { v?: number }).v !== BUNDLE_V
  ) {
    throw new Error("Invalid bundle: expected { v: 1, ... } JSON from the treasury after payroll.");
  }
  const b = raw as PayeePaymentBundle;
  if (
    typeof b.label !== "string" ||
    typeof b.amount !== "string" ||
    typeof b.blinding !== "string" ||
    typeof b.utxoPublicKey !== "string" ||
    typeof b.mint !== "string" ||
    typeof b.transferSignature !== "string"
  ) {
    throw new Error("Bundle is missing required fields.");
  }
  return b;
}

/**
 * Rebuilds a spendable UTXO using the payee’s real keypair and the treasury-exported
 * field data (the on-chain output used a placeholder private key in the prover).
 */
export function utxoFromBundle(
  bundle: PayeePaymentBundle,
  keypair: UtxoKeypair
): Utxo {
  const expectPk = BigInt(bundle.utxoPublicKey);
  if (keypair.publicKey !== expectPk) {
    throw new Error(
      "This bundle belongs to a different UTXO key. Use the same receive key you gave the treasury (or restore your Payee key backup)."
    );
  }
  const utxo: Utxo = {
    amount: BigInt(bundle.amount),
    blinding: BigInt(bundle.blinding),
    keypair: {
      privateKey: keypair.privateKey,
      publicKey: keypair.publicKey,
    },
    mintAddress: new PublicKey(bundle.mint),
  };
  if (bundle.index !== undefined) {
    utxo.index = bundle.index;
  }
  if (bundle.commitment) {
    utxo.commitment = BigInt(bundle.commitment);
  }
  if (bundle.siblingCommitment) {
    utxo.siblingCommitment = BigInt(bundle.siblingCommitment);
  }
  if (utxo.commitment == null) {
    throw new Error("Bundle is missing commitment — use a fresh copy from the treasury after payroll.");
  }
  return utxo;
}
