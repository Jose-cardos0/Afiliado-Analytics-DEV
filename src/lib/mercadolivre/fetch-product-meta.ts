/**
 * Metadados públicos do Mercado Livre (API developers — sem OAuth).
 * Usa anúncio (/items) ou catálogo (/products) conforme o ID.
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
};

export { extractMlbIdFromUrl };

type ItemJson = {
  title?: string;
  subtitle?: string;
  price?: number;
  original_price?: number;
  currency_id?: string;
  permalink?: string;
  condition?: string;
  available_quantity?: number;
  sold_quantity?: number;
  warranty?: string;
  listing_type_id?: string;
  pictures?: { secure_url?: string; url?: string }[];
};

type ProductJson = {
  name?: string;
  pictures?: { secure_url?: string; url?: string }[];
  buy_box_winner?: { price?: number; original_price?: number };
};

function pictureUrl(pictures: { secure_url?: string; url?: string }[] | undefined): string {
  const p = pictures?.[0];
  return (p?.secure_url || p?.url || "").trim();
}

function discountFromPrices(promo: number, original: number): number | null {
  if (original > promo && original > 0) {
    return Math.round((1 - promo / original) * 10000) / 100;
  }
  return null;
}

function mapItem(j: ItemJson, resolvedId: string): MlProductMeta {
  const price = typeof j.price === "number" ? j.price : null;
  const orig = typeof j.original_price === "number" ? j.original_price : null;
  const pricePromo = price;
  let priceOriginal = orig;
  let discountRate: number | null = null;
  if (pricePromo != null && priceOriginal != null && priceOriginal > pricePromo) {
    discountRate = discountFromPrices(pricePromo, priceOriginal);
  } else if (pricePromo != null && (priceOriginal == null || priceOriginal <= pricePromo)) {
    priceOriginal = pricePromo;
  }
  return {
    resolvedId,
    productName: String(j.title ?? "").trim(),
    imageUrl: pictureUrl(j.pictures),
    pricePromo,
    priceOriginal,
    discountRate,
    permalink: j.permalink?.trim() || null,
    subtitle: j.subtitle?.trim() || null,
    condition: j.condition?.trim() || null,
    currencyId: j.currency_id?.trim() || null,
    availableQuantity: typeof j.available_quantity === "number" ? j.available_quantity : null,
    soldQuantity: typeof j.sold_quantity === "number" ? j.sold_quantity : null,
    warranty: j.warranty != null ? String(j.warranty).trim() || null : null,
    listingTypeId: j.listing_type_id?.trim() || null,
  };
}

function mapProduct(j: ProductJson, resolvedId: string): MlProductMeta {
  const bb = j.buy_box_winner;
  const price = typeof bb?.price === "number" ? bb.price : null;
  const orig = typeof bb?.original_price === "number" ? bb.original_price : null;
  const pricePromo = price;
  let priceOriginal = orig;
  let discountRate: number | null = null;
  if (pricePromo != null && priceOriginal != null && priceOriginal > pricePromo) {
    discountRate = discountFromPrices(pricePromo, priceOriginal);
  } else if (pricePromo != null && (priceOriginal == null || priceOriginal <= pricePromo)) {
    priceOriginal = pricePromo;
  }
  return {
    resolvedId,
    productName: String(j.name ?? "").trim(),
    imageUrl: pictureUrl(j.pictures),
    pricePromo,
    priceOriginal,
    discountRate,
    permalink: null,
    subtitle: null,
    condition: null,
    currencyId: null,
    availableQuantity: null,
    soldQuantity: null,
    warranty: null,
    listingTypeId: null,
  };
}

function buildMlFetchHeaders(accessToken?: string | null): HeadersInit {
  const h: Record<string, string> = { Accept: "application/json" };
  if (accessToken?.trim()) h.Authorization = `Bearer ${accessToken.trim()}`;
  return h;
}

function metaSemPreco(meta: MlProductMeta): boolean {
  return meta.pricePromo == null && meta.priceOriginal == null;
}

async function enriquecerPrecosPeloHtmlSeVazio(
  meta: MlProductMeta,
  pageUrl: string,
): Promise<MlProductMeta> {
  if (!metaSemPreco(meta)) return meta;
  const fromHtml = await fetchMlProductMetaFromPdpHtml(pageUrl.trim());
  if (!fromHtml) return meta;
  return {
    ...meta,
    pricePromo: fromHtml.pricePromo ?? meta.pricePromo,
    priceOriginal: fromHtml.priceOriginal ?? meta.priceOriginal,
    discountRate: fromHtml.discountRate ?? meta.discountRate,
    imageUrl: meta.imageUrl?.trim() ? meta.imageUrl : fromHtml.imageUrl,
    productName: meta.productName?.trim() ? meta.productName : fromHtml.productName,
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
  accessToken?: string | null,
): Promise<MlProductMeta | null> {
  const id = normalizeMlApiItemId(mlbId);
  const headers = buildMlFetchHeaders(accessToken);

  const resItem = await fetch(`https://api.mercadolibre.com/items/${encodeURIComponent(id)}`, {
    headers,
    next: { revalidate: 120 },
  });
  if (resItem.ok) {
    const j = (await resItem.json()) as ItemJson;
    return mapItem(j, id);
  }

  const resProd = await fetch(`https://api.mercadolibre.com/products/${encodeURIComponent(id)}`, {
    headers,
    next: { revalidate: 120 },
  });
  if (resProd.ok) {
    const j = (await resProd.json()) as ProductJson;
    return mapProduct(j, id);
  }

  const shortPdp = buildProdutoMercadolivreShortUrl(id);
  if (shortPdp) {
    const fromHtml = await fetchMlProductMetaFromPdpHtml(shortPdp);
    if (fromHtml) return fromHtml as MlProductMeta;
  }

  // MLBU não existe em /items público como MLB; a página /up/MLBU… costuma ter JSON-LD.
  if (/^MLBU\d+$/i.test(id)) {
    const upUrl = `https://www.mercadolivre.com.br/up/${encodeURIComponent(id)}`;
    const fromUp = await fetchMlProductMetaFromPdpHtml(upUrl);
    if (fromUp) return fromUp as MlProductMeta;
  }

  return null;
}

export async function fetchMlProductMetaFromUrl(
  productOrAffiliateUrl: string,
  accessToken?: string | null,
): Promise<MlProductMeta | null> {
  const trimmed = productOrAffiliateUrl.trim();
  if (!trimmed) return null;

  const id = extractMlbIdFromUrl(trimmed);
  if (id) {
    let meta = await fetchMlProductMetaByMlbId(id, accessToken);
    if (meta) {
      meta = await enriquecerPrecosPeloHtmlSeVazio(meta, trimmed);
      return meta;
    }
    const fromUserUrl = await fetchMlProductMetaFromPdpHtml(trimmed);
    return fromUserUrl ? (fromUserUrl as MlProductMeta) : null;
  }

  // URL do ML sem MLB reconhecido no path: ainda tentar HTML (ex.: slug antigo ou redirecionamento).
  const fromHtmlOnly = await fetchMlProductMetaFromPdpHtml(trimmed);
  return fromHtmlOnly ? (fromHtmlOnly as MlProductMeta) : null;
}
