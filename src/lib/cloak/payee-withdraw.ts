import {
  fullWithdraw,
  getNkFromUtxoPrivateKey,
  type MerkleTree,
  type Utxo,
  type UtxoKeypair,
} from "@cloak.dev/sdk";
import { CLOAK_PROGRAM_ID, USDC_MINT } from "@/lib/constants";
import {
  type Connection,
  type PublicKey,
  type Transaction,
  type VersionedTransaction,
} from "@solana/web3.js";

type SignTx = <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>;
type SignMsg = (m: Uint8Array) => Promise<Uint8Array>;

export function buildPayeeTransactOptions(
  connection: Connection,
  wallet: PublicKey,
  signTransaction: SignTx,
  signMessage: SignMsg,
  payeeKp: UtxoKeypair,
  cachedMerkleTree?: MerkleTree
) {
  const nk = getNkFromUtxoPrivateKey(payeeKp.privateKey);
  return {
    connection,
    programId: CLOAK_PROGRAM_ID,
    signTransaction,
    signMessage,
    walletPublicKey: wallet,
    depositorPublicKey: wallet,
    chainNoteViewingKeyNk: nk,
    cachedMerkleTree,
  } as const;
}

/**
 * Unshield the payee’s USDC to their connected Solana wallet (visible SPL USDC in that wallet’s ATA).
 */
export async function withdrawUtxoToPublicWallet(
  connection: Connection,
  wallet: PublicKey,
  signTransaction: SignTx,
  signMessage: SignMsg,
  payeeKp: UtxoKeypair,
  utxo: Utxo
) {
  if (utxo.mintAddress.toBase58() !== USDC_MINT.toBase58()) {
    throw new Error("This flow only supports USDC shield pool notes in this app.");
  }
  return fullWithdraw(
    [utxo],
    wallet,
    {
      ...buildPayeeTransactOptions(
        connection,
        wallet,
        signTransaction,
        signMessage,
        payeeKp
      ),
    }
  );
}
