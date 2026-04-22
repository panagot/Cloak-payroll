import { CLOAK_PROGRAM_ID, scanTransactions, toComplianceReport, type UtxoKeypair } from "@cloak.dev/sdk";
import { Connection, type PublicKey } from "@solana/web3.js";
import { buildViewingKeyNkFromAdminKp } from "./payroll";

/**
 * On-chain history for the treasury’s viewing key. Does not use the relay to decrypt;
 * only requires RPC.
 */
export async function scanWithAdminViewingKey(
  connection: Connection,
  adminKp: UtxoKeypair,
  walletForFallback: PublicKey,
  onStatus?: (s: string) => void
) {
  const viewingKeyNk = buildViewingKeyNkFromAdminKp(adminKp);
  onStatus?.("Scanning on-chain Cloak program transactions (may take a bit)…");
  const result = await scanTransactions({
    connection,
    programId: CLOAK_PROGRAM_ID,
    viewingKeyNk,
    limit: 200,
    batchSize: 30,
    walletPublicKey: walletForFallback.toBase58(),
    onStatus,
  });
  return { result, report: toComplianceReport(result) };
}
