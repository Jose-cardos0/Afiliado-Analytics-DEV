/**
 * Mesma ideia do POST /resolve-item: tenta URL de produto salva, depois expand do meli.la.
 * Usado em "Atualizar preços" para não depender só do redirect do link curto.
 */

import { fetchMlProductMetaFromUrl, type MlProductMeta } from "@/lib/mercadolivre/fetch-product-meta";
import { expandMercadoLivreAffiliateLink } from "@/lib/mercadolivre/expand-affiliate-link";
import { extractMlbIdFromUrl, looksLikeMercadoLivreProductUrl } from "@/lib/mercadolivre/extract-mlb-id";

function isMeliLaHost(url: string): boolean {
  try {
    const h = new URL(url.trim()).hostname.toLowerCase();
    return h === "meli.la" || h === "www.meli.la";
  } catch {
    return false;
  }
}

function metaUsable(m: MlProductMeta | null): boolean {
  if (!m) return false;
  return !!(
    m.productName?.trim() ||
    m.imageUrl?.trim() ||
    m.pricePromo != null ||
    m.priceOriginal != null
  );
}

export async function fetchMlProductMetaForStoredListItem(
  converterLink: string,
  productPageUrl: string | null | undefined,
  accessToken?: string | null,
): Promise<MlProductMeta | null> {
  const conv = converterLink.trim();
  if (!conv) return null;

  const page = (productPageUrl ?? "").trim();

  if (page && (looksLikeMercadoLivreProductUrl(page) || !!extractMlbIdFromUrl(page))) {
    const m = await fetchMlProductMetaFromUrl(page, accessToken);
    if (metaUsable(m)) return m;
  }

  if (looksLikeMercadoLivreProductUrl(conv) && !isMeliLaHost(conv)) {
    const m = await fetchMlProductMetaFromUrl(conv, accessToken);
    if (metaUsable(m)) return m;
  }

  const expanded = await expandMercadoLivreAffiliateLink(conv);
  if (expanded) {
    const m = await fetchMlProductMetaFromUrl(expanded, accessToken);
    if (metaUsable(m)) return m;
  }

  return null;
}
