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

  // Hash/query: wid=MLB… identifica o anúncio exibido (recomendações / catálogo). Pode haver mais de um — usamos o último.
  const widAll = [...href.matchAll(/wid=(MLB\d+)/gi)];
  if (widAll.length > 0) return widAll[widAll.length - 1][1].toUpperCase();

  const pMatch = blob.match(/\/p\/MLB(\d+)/i);
  if (pMatch) return `MLB${pMatch[1]}`;

  // Anúncio “user product” no path (sem hash, p.ex. após exportar planilha sem #).
  const upMatch = blob.match(/\/up\/(MLBU\d+)/i);
  if (upMatch) return upMatch[1].toUpperCase();

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
