/**
 * Mensagens genéricas do SDK (ex.: "Status code 400 is not ok") não explicam a causa.
 * Unifica texto + cause + dica quando parece falha de token/store Blob.
 */
export function formatUploadError(err: unknown, context: string): string {
  const base =
    err instanceof Error ? err.message : typeof err === "string" ? err : String(err);
  const cause =
    err instanceof Error && err.cause instanceof Error
      ? ` | cause: ${err.cause.message}`
      : "";

  const combined = `${base}${cause}`;
  const hint =
    /400|not ok|unauthorized|forbidden|invalid token|store/i.test(combined)
      ? " | Dica: confira se BLOB_READ_WRITE_TOKEN é do store Blob PÚBLICO ligado a ESTE projeto (Vercel → Storage → Blob), gere um token novo se trocou de store, sem espaços/aspas extras, e redeploy."
      : "";

  return `[${context}] ${combined}${hint}`;
}
