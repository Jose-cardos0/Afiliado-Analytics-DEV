/**
 * Fallback quando api.mercadolibre.com/items retorna 403 (PolicyAgent) ou 401.
 * Lê o JSON-LD (schema.org Product) da página pública do anúncio.
 */

import { extractMlbIdFromUrl } from "@/lib/mercadolivre/extract-mlb-id";

/** Mesmo formato que MlProductMeta em fetch-product-meta (evita import circular). */
export type MlPdpProductMeta = {
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
  /** Barra de afiliados no PDP: "GANHOS 12%" (só no HTML com cookie de sessão afiliado). */
  affiliateCommissionPct?: number | null;
};

const BROWSER_HEADERS_BASE: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.5",
  Referer: "https://www.mercadolivre.com.br/",
};

function pdpHeaders(cookieHeader?: string | null): HeadersInit {
  if (!cookieHeader?.trim()) return BROWSER_HEADERS_BASE;
  return { ...BROWSER_HEADERS_BASE, Cookie: cookieHeader.trim() };
}

const ALLOWED_PDP_HOSTS = new Set([
  "produto.mercadolivre.com.br",
  "www.mercadolivre.com.br",
  "mercadolivre.com.br",
  "articulo.mercadolibre.com.br",
  "www.mercadolibre.com.br",
]);

/** Alinhar com expand-affiliate-link: listas, click, landing etc. também carregam PDP ou redirecionam. */
function isAllowedMlPdpHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (ALLOWED_PDP_HOSTS.has(h)) return true;
  if (h === "mercadolivre.com.br" || h.endsWith(".mercadolivre.com.br")) return true;
  if (h.includes("mercadolibre.com")) return true;
  return false;
}

/**
 * O fetch HTTP não envia fragmento #…; URLs do ML trazem `wid=MLB…` na hash para o anúncio certo.
 * Copia o último wid da URL inteira para ?wid= para o servidor devolver o HTML/JSON-LD do listing.
 */
export function normalizeMercadoLivrePdpUrlForFetch(pageUrl: string): string {
  try {
    const u = new URL(pageUrl.trim());
    if (!isAllowedMlPdpHost(u.hostname)) return pageUrl.trim();
    const widAll = [...u.href.matchAll(/wid=(MLB\d+)/gi)];
    if (widAll.length === 0) return pageUrl.trim();
    const wid = widAll[widAll.length - 1][1];
    u.searchParams.set("wid", wid);
    u.hash = "";
    return u.toString();
  } catch {
    return pageUrl.trim();
  }
}

function parseAffiliatePctFragment(raw: string): number | null {
  const n = parseFloat(String(raw).replace(",", "."));
  if (Number.isFinite(n) && n > 0 && n <= 100) return Math.round(n * 100) / 100;
  return null;
}

/**
 * Porcentagem embutida em JSON/scripts do VPP (ex.: `"GANHOS 12%"` em estado React).
 * Só existe com sessão de afiliado; não remove tags script (diferente do fallback em texto visível).
 */
export function extractMlAffiliateGanhosPctFromEmbeddedJson(html: string): number | null {
  const quotedPatterns = [
    /"GANHOS\s*(\d{1,2}(?:[.,]\d+)?)\s*%"/gi,
    /'GANHOS\s*(\d{1,2}(?:[.,]\d+)?)\s*%'/gi,
    /\\"GANHOS\s*(\d{1,2}(?:[.,]\d+)?)\s*%\\"/gi,
    /"Ganhos\s*(\d{1,2}(?:[.,]\d+)?)\s*%"/gi,
    /GANHOS\s+DE\s+(\d{1,2}(?:[.,]\d+)?)\s*%/gi,
  ];
  for (const re of quotedPatterns) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const v = parseAffiliatePctFragment(m[1]);
      if (v != null) return v;
    }
  }

  const explicitKey =
    /"(?:affiliate_commission_percentage|affiliate_gain_percentage|affiliate_program_commission)"\s*:\s*(\d{1,2}(?:\.\d+)?)/gi;
  let em: RegExpExecArray | null;
  while ((em = explicitKey.exec(html)) !== null) {
    const v = parseAffiliatePctFragment(em[1]);
    if (v != null) return v;
  }

  // "percentage": N próximo de affiliate / ganhos / vip affiliates (evita outros % da página)
  const pctRe = /"percentage"\s*:\s*(\d{1,2}(?:\.\d+)?)/gi;
  let pm: RegExpExecArray | null;
  while ((pm = pctRe.exec(html)) !== null) {
    const start = Math.max(0, pm.index - 220);
    const ctx = html.slice(start, pm.index).toLowerCase();
    if (
      ctx.includes("affiliate") ||
      ctx.includes("ganho") ||
      ctx.includes("comiss") ||
      ctx.includes("vip_affiliates") ||
      ctx.includes("seller_rebate")
    ) {
      const v = parseAffiliatePctFragment(pm[1]);
      if (v != null) return v;
    }
  }

  return null;
}

/**
 * Barra preta de afiliados no topo do anúncio (logado): texto "GANHOS 12%" no DOM renderizado.
 * Removemos tags e scripts — útil quando o texto não está só em JSON dentro de script.
 */
export function extractMlAffiliateGanhosPctFromHtml(html: string): number | null {
  const head = html.length > 180_000 ? html.slice(0, 180_000) : html;
  const rough = head
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/gi, " ");
  const re = /GANHOS\s*(\d{1,2}(?:[.,]\d+)?)\s*%/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rough)) !== null) {
    const v = parseAffiliatePctFragment(m[1]);
    if (v != null) return v;
  }
  return null;
}

function mergeAffiliatePctFromHtml(meta: MlPdpProductMeta, html: string): MlPdpProductMeta {
  const pct =
    extractMlAffiliateGanhosPctFromEmbeddedJson(html) ?? extractMlAffiliateGanhosPctFromHtml(html);
  if (pct == null) return meta;
  return { ...meta, affiliateCommissionPct: pct };
}

const MAX_ML_PRICE = 9_999_999;

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * O VPP do ML embute preço de lista e preço atual em scripts (ex.: credit_view_components.pricing,
 * melidata e promotions). O JSON-LD costuma trazer só um `price`.
 */
function extractMlPdpPricingFromEmbeddedHtml(html: string): {
  pricePromo: number;
  priceOriginal: number;
  discountRate: number;
} | null {
  const tryPair = (original: number, promo: number) => {
    if (!Number.isFinite(original) || !Number.isFinite(promo)) return null;
    if (original <= 0 || promo <= 0 || original > MAX_ML_PRICE || promo > MAX_ML_PRICE) return null;
    if (original <= promo) return null;
    const discountRate = Math.round(((original - promo) / original) * 10000) / 100;
    return {
      pricePromo: roundMoney(promo),
      priceOriginal: roundMoney(original),
      discountRate,
    };
  };

  const patterns: Array<{ re: RegExp; originalGroup: 1 | 2; promoGroup: 1 | 2 }> = [
    {
      re: /"original_price"\s*:\s*(\d+(?:\.\d+)?)\s*,\s*"actual_price"\s*:\s*(\d+(?:\.\d+)?)/,
      originalGroup: 1,
      promoGroup: 2,
    },
    {
      re: /"price"\s*:\s*(\d+(?:\.\d+)?)\s*,\s*"original_price"\s*:\s*(\d+(?:\.\d+)?)/,
      originalGroup: 2,
      promoGroup: 1,
    },
    {
      re: /"original_price"\s*:\s*(\d+(?:\.\d+)?)\s*,\s*"price"\s*:\s*(\d+(?:\.\d+)?)/,
      originalGroup: 1,
      promoGroup: 2,
    },
  ];

  for (const { re, originalGroup, promoGroup } of patterns) {
    const m = re.exec(html);
    if (!m) continue;
    const a = parseFloat(m[1]);
    const b = parseFloat(m[2]);
    const original = originalGroup === 1 ? a : b;
    const promo = promoGroup === 1 ? a : b;
    const r = tryPair(original, promo);
    if (r) return r;
  }

  const vm = /"original_value"\s*:\s*(\d+(?:\.\d+)?)\s*,\s*"value"\s*:\s*(\d+(?:\.\d+)?)/.exec(html);
  if (vm) {
    const r = tryPair(parseFloat(vm[1]), parseFloat(vm[2]));
    if (r) return r;
  }

  return null;
}

function mergePdpPricingFromEmbeddedHtml(meta: MlPdpProductMeta, html: string): MlPdpProductMeta {
  const ext = extractMlPdpPricingFromEmbeddedHtml(html);
  if (!ext) return meta;
  return {
    ...meta,
    pricePromo: ext.pricePromo,
    priceOriginal: ext.priceOriginal,
    discountRate: ext.discountRate,
  };
}

function parsePrice(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function firstImage(image: unknown): string {
  if (typeof image === "string") return image.trim();
  if (Array.isArray(image) && image.length > 0 && typeof image[0] === "string") return String(image[0]).trim();
  return "";
}

function isProductNode(obj: Record<string, unknown>): boolean {
  const t = obj["@type"];
  if (t === "Product") return true;
  if (Array.isArray(t)) return t.includes("Product");
  return false;
}

function mapLdProduct(obj: Record<string, unknown>, sourceUrl: string, resolvedId: string): MlPdpProductMeta {
  const name = String(obj.name ?? "").trim();
  const imageUrl = firstImage(obj.image);
  const offersRaw = obj.offers;
  let pricePromo: number | null = null;
  let priceOriginal: number | null = null;
  let discountRate: number | null = null;

  const takeOffer = (o: Record<string, unknown>) => {
    const types = o["@type"];
    const typeStr = (Array.isArray(types) ? String(types[0]) : String(types ?? "")).toLowerCase();
    const high = parsePrice(o.highPrice);
    const low = parsePrice(o.lowPrice);
    if (typeStr === "aggregateoffer" && high != null && low != null && high > low) {
      priceOriginal = high;
      pricePromo = low;
      discountRate = Math.round(((high - low) / high) * 10000) / 100;
      return;
    }
    const p = parsePrice(o.price);
    if (p != null) pricePromo = p;
    const spec = o.priceSpecification;
    if (Array.isArray(spec) && spec[0] && typeof spec[0] === "object") {
      const s0 = spec[0] as Record<string, unknown>;
      const list = parsePrice(s0.price);
      if (list != null && p != null && list > p) {
        priceOriginal = list;
        discountRate = Math.round(((list - p) / list) * 10000) / 100;
      }
    }
  };

  if (offersRaw && typeof offersRaw === "object" && !Array.isArray(offersRaw)) {
    takeOffer(offersRaw as Record<string, unknown>);
  } else if (Array.isArray(offersRaw) && offersRaw[0] && typeof offersRaw[0] === "object") {
    takeOffer(offersRaw[0] as Record<string, unknown>);
  }

  if (pricePromo != null && priceOriginal == null) priceOriginal = pricePromo;

  return {
    resolvedId,
    productName: name,
    imageUrl,
    pricePromo,
    priceOriginal,
    discountRate,
    permalink: typeof sourceUrl === "string" ? sourceUrl.split("#")[0] : null,
    subtitle: null,
    condition: null,
    currencyId: "BRL",
    availableQuantity: null,
    soldQuantity: null,
    warranty: null,
    listingTypeId: null,
  };
}

/** Percorre o JSON-LD inteiro (o ML costuma aninhar Product fora de @graph). */
function findLdProductDeep(data: unknown, depth = 0): Record<string, unknown> | null {
  if (depth > 24 || data == null) return null;
  if (typeof data !== "object") return null;
  if (Array.isArray(data)) {
    for (const item of data) {
      const r = findLdProductDeep(item, depth + 1);
      if (r) return r;
    }
    return null;
  }
  const o = data as Record<string, unknown>;
  if (isProductNode(o)) return o;
  for (const v of Object.values(o)) {
    const r = findLdProductDeep(v, depth + 1);
    if (r) return r;
  }
  return null;
}

function tryParseLdJsonBlock(jsonStr: string, sourceUrl: string, resolvedId: string): MlPdpProductMeta | null {
  const trimmed = jsonStr.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  let data: unknown;
  try {
    data = JSON.parse(trimmed);
  } catch {
    return null;
  }

  const tryNode = (node: unknown): MlPdpProductMeta | null => {
    if (!node || typeof node !== "object") return null;
    const o = node as Record<string, unknown>;
    if (isProductNode(o)) return mapLdProduct(o, sourceUrl, resolvedId);
    return null;
  };

  const direct = tryNode(data);
  if (direct) return direct;

  const root = data as Record<string, unknown>;
  const graph = root["@graph"];
  if (Array.isArray(graph)) {
    for (const node of graph) {
      const m = tryNode(node);
      if (m) return m;
    }
  }

  const deep = findLdProductDeep(data);
  if (deep) return mapLdProduct(deep, sourceUrl, resolvedId);
  return null;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

/**
 * Quando não há Product no JSON-LD “óbvio”, o ML ainda costuma mandar og:title / og:image.
 */
function parsePdpMetaFromOpenGraph(html: string, sourceUrl: string, resolvedId: string): MlPdpProductMeta | null {
  const metaProp = (prop: string): string | null => {
    const re1 = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']*)["']`, "i");
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${prop}["']`, "i");
    const a = re1.exec(html);
    if (a?.[1] != null) return decodeHtmlEntities(a[1].trim());
    const b = re2.exec(html);
    return b?.[1] != null ? decodeHtmlEntities(b[1].trim()) : null;
  };
  const metaName = (name: string): string | null => {
    const re = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`, "i");
    const m = re.exec(html);
    return m?.[1] != null ? decodeHtmlEntities(m[1].trim()) : null;
  };

  const title =
    metaProp("og:title") ??
    metaName("twitter:title") ??
    metaProp("twitter:title") ??
    "";
  const imageRaw =
    metaProp("og:image") ??
    metaName("twitter:image") ??
    metaProp("twitter:image:src") ??
    "";
  const imageUrl = imageRaw.replace(/^http:\/\//i, "https://");

  let pricePromo: number | null = null;
  const priceCandidates = [
    metaProp("product:price:amount"),
    metaProp("og:price:amount"),
    (() => {
      const m = /<meta[^>]+itemprop=["']price["'][^>]+content=["']([^"']+)["']/i.exec(html);
      return m?.[1]?.trim() ?? null;
    })(),
  ];
  for (const raw of priceCandidates) {
    if (!raw) continue;
    const normalized = raw.replace(/\s/g, "").replace(/R\$\s?/i, "");
    let n: number | null = null;
    if (/^\d+[.,]\d{2}$/.test(normalized)) {
      n = parseFloat(normalized.replace(/\./g, "").replace(",", "."));
    } else {
      n = parseFloat(normalized.replace(",", "."));
    }
    if (n != null && Number.isFinite(n) && n > 0 && n < 1_000_000) {
      pricePromo = Math.round(n * 100) / 100;
      break;
    }
  }

  if (!title && !imageUrl && pricePromo == null) return null;

  return {
    resolvedId,
    productName: title || `Produto ${resolvedId}`,
    imageUrl,
    pricePromo,
    priceOriginal: pricePromo,
    discountRate: null,
    permalink: sourceUrl.split("#")[0],
    subtitle: null,
    condition: null,
    currencyId: "BRL",
    availableQuantity: null,
    soldQuantity: null,
    warranty: null,
    listingTypeId: null,
  };
}

/**
 * Busca metadados na página HTML do PDP (JSON-LD).
 */
export async function fetchMlProductMetaFromPdpHtml(
  productUrl: string,
  cookieHeader?: string | null,
): Promise<MlPdpProductMeta | null> {
  const fetchUrl = normalizeMercadoLivrePdpUrlForFetch(productUrl);
  let u: URL;
  try {
    u = new URL(fetchUrl);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (!isAllowedMlPdpHost(u.hostname)) return null;

  const resolvedId = extractMlbIdFromUrl(productUrl) ?? extractMlbIdFromUrl(fetchUrl) ?? "MLB";

  const res = await fetch(u.toString(), {
    headers: pdpHeaders(cookieHeader),
    redirect: "follow",
    ...(cookieHeader?.trim()
      ? { cache: "no-store" as RequestCache }
      : { next: { revalidate: 300 } }),
  });
  if (!res.ok) return null;

  const html = await res.text();
  if (html.length > 2_500_000) return null;

  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const block = m[1]?.trim();
    if (!block) continue;
    const meta = tryParseLdJsonBlock(block, u.toString(), resolvedId);
    if (meta?.productName || meta?.imageUrl || meta?.pricePromo != null) {
      return mergeAffiliatePctFromHtml(mergePdpPricingFromEmbeddedHtml(meta, html), html);
    }
  }

  const og = parsePdpMetaFromOpenGraph(html, u.toString(), resolvedId);
  if (og?.productName || og?.imageUrl || og?.pricePromo != null) {
    return mergeAffiliatePctFromHtml(mergePdpPricingFromEmbeddedHtml(og, html), html);
  }

  return null;
}

export function buildProdutoMercadolivreShortUrl(mlbId: string): string | null {
  const id = mlbId.trim().toUpperCase();
  const match = id.match(/^MLB(\d{6,})$/);
  if (!match) return null;
  return `https://produto.mercadolivre.com.br/MLB-${match[1]}`;
}
