/**
 * Metadados de anúncio Mercado Livre via página (HTML / JSON-LD), com cookie de sessão quando houver.
 * Não usa api.mercadolibre.com (evita 403 PolicyAgent em servidor).
 */

import { extractMlbIdFromUrl } from "@/lib/mercadolivre/extract-mlb-id";
import {
  buildProdutoMercadolivreShortUrl,
  fetchMlProductMetaFromPdpHtml,
} from "@/lib/mercadolivre/fetch-product-pdp-html";

export type MlProductMeta = {
  resolvedId: string;
  productName: string;
  imageUrl: string;
  pricePromo: number | null;
  priceOriginal: number | null;
  discountRate: number | null;
  permalink?: string | null;
  subtitle?: string | null;
  condition?: string | null;
  currencyId?: string | null;
  availableQuantity?: number | null;
  soldQuantity?: number | null;
  warranty?: string | null;
  listingTypeId?: string | null;
  affiliateCommissionPct?: number | null;
};

export { extractMlbIdFromUrl };

function metaSemPreco(meta: MlProductMeta): boolean {
  return meta.pricePromo == null && meta.priceOriginal == null;
}

async function enriquecerPrecosPeloHtmlSeVazio(
  meta: MlProductMeta,
  pageUrl: string,
  mlCookieHeader?: string | null,
): Promise<MlProductMeta> {
  if (!metaSemPreco(meta)) return meta;
  const fromHtml = await fetchMlProductMetaFromPdpHtml(pageUrl.trim(), mlCookieHeader);
  if (!fromHtml) return meta;
  return {
    ...meta,
    pricePromo: fromHtml.pricePromo ?? meta.pricePromo,
    priceOriginal: fromHtml.priceOriginal ?? meta.priceOriginal,
    discountRate: fromHtml.discountRate ?? meta.discountRate,
    imageUrl: meta.imageUrl?.trim() ? meta.imageUrl : fromHtml.imageUrl,
    productName: meta.productName?.trim() ? meta.productName : fromHtml.productName,
    affiliateCommissionPct: fromHtml.affiliateCommissionPct ?? meta.affiliateCommissionPct,
  };
}

function normalizeMlApiItemId(raw: string): string {
  const t = raw.trim();
  const u = t.toUpperCase();
  if (/^MLBU\d+$/i.test(t)) return u;
  if (/^MLB\d+$/i.test(t)) return u;
  return `MLB${t.replace(/^MLB-?/i, "")}`;
}

export async function fetchMlProductMetaByMlbId(
  mlbId: string,
  _accessToken?: string | null,
  mlCookieHeader?: string | null,
): Promise<MlProductMeta | null> {
  const id = normalizeMlApiItemId(mlbId);

  const shortPdp = buildProdutoMercadolivreShortUrl(id);
  if (shortPdp) {
    const fromHtml = await fetchMlProductMetaFromPdpHtml(shortPdp, mlCookieHeader);
    if (fromHtml) return { ...(fromHtml as MlProductMeta), resolvedId: id };
  }

  if (/^MLBU\d+$/i.test(id)) {
    const upUrl = `https://www.mercadolivre.com.br/up/${encodeURIComponent(id)}`;
    const fromUp = await fetchMlProductMetaFromPdpHtml(upUrl, mlCookieHeader);
    if (fromUp) return { ...(fromUp as MlProductMeta), resolvedId: id };
  }

  return null;
}

export async function fetchMlProductMetaFromUrl(
  productOrAffiliateUrl: string,
  accessToken?: string | null,
  mlCookieHeader?: string | null,
): Promise<MlProductMeta | null> {
  const trimmed = productOrAffiliateUrl.trim();
  if (!trimmed) return null;

  const id = extractMlbIdFromUrl(trimmed);
  if (id) {
    let meta = await fetchMlProductMetaByMlbId(id, accessToken, mlCookieHeader);
    if (meta) {
      meta = await enriquecerPrecosPeloHtmlSeVazio(meta, trimmed, mlCookieHeader);
      return meta;
    }
    const fromUserUrl = await fetchMlProductMetaFromPdpHtml(trimmed, mlCookieHeader);
    return fromUserUrl ? (fromUserUrl as MlProductMeta) : null;
  }

  // URL do ML sem MLB reconhecido no path: ainda tentar HTML (ex.: slug antigo ou redirecionamento).
  const fromHtmlOnly = await fetchMlProductMetaFromPdpHtml(trimmed, mlCookieHeader);
  return fromHtmlOnly ? (fromHtmlOnly as MlProductMeta) : null;
}
