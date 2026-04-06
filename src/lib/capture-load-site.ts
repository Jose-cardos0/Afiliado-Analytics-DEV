import type { SupabaseClient } from "@supabase/supabase-js";
import type { CaptureSiteRow } from "@/app/(main)/dashboard/captura/_lib/types";

/** Domínio canónico gravado em `capture_sites.domain` para o subdomínio público. */
export const CAPTURE_PUBLIC_DOMAIN = "s.afiliadoanalytics.com.br";

/**
 * Carrega um site de captura. Em caso de erro PostgREST (chave inválida, rede, etc.)
 * devolve `error` — não confundir com “slug inexistente” (aí `data` é null e `error` é null).
 */
export async function loadCaptureSiteRow(
  supabase: SupabaseClient,
  domain: string,
  slug: string,
): Promise<{ data: CaptureSiteRow | null; error: { message: string; code?: string } | null }> {
  const res = await supabase
    .from("capture_sites")
    .select("*")
    .eq("domain", domain)
    .eq("slug", slug)
    .maybeSingle();

  const err = res.error;

  if (err) {
    console.error("[capture_sites] consulta falhou", {
      domain,
      slug,
      message: err.message,
      code: err.code,
      details: "details" in err ? (err as { details?: string }).details : undefined,
    });
    return { data: null, error: { message: err.message, code: err.code } };
  }

  return { data: res.data as CaptureSiteRow | null, error: null };
}
