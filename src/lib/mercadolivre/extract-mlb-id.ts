/** Extrai ID MLB de URL de anúncio ou afiliado (quando o path/query contém MLB). Uso seguro no cliente. */
export function extractMlbIdFromUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  let blob = trimmed;
  let href = trimmed;
  if (trimmed.includes("://")) {
    try {
      const u = new URL(trimmed);
      href = u.href;
      blob = `${u.pathname}${u.search}${u.hash}`;
    } catch {
      blob = trimmed;
      href = trimmed;
    }
  }

  // Página de catálogo: o anúncio exibido costuma vir em wid=MLB… no hash (prioridade sobre /p/MLB do produto).
  const widM = href.match(/[?&#]wid=(MLB\d+)/i) ?? href.match(/\bwid=(MLB\d+)/i);
  if (widM) return widM[1].toUpperCase();

  const pMatch = blob.match(/\/p\/MLB(\d+)/i);
  if (pMatch) return `MLB${pMatch[1]}`;
  const m = blob.match(/MLB-?(\d{6,})/i);
  if (m) return `MLB${m[1]}`;
  return null;
}

/** True se parece URL de página do Mercado Livre (para decidir se vale chamar resolve no servidor). */
export function looksLikeMercadoLivreProductUrl(url: string): boolean {
  const t = url.trim().toLowerCase();
  if (!t.startsWith("http")) return false;
  try {
    const h = new URL(t).hostname;
    return (
      h === "mercadolivre.com.br" ||
      h.endsWith(".mercadolivre.com.br") ||
      h.includes("mercadolibre.com")
    );
  } catch {
    return false;
  }
}
