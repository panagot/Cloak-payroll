import { parseError } from "@cloak.dev/sdk";

export function formatCloakError(err: unknown): string {
  return parseError(err).message;
}
