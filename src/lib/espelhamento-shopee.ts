/**
 * Extrai URLs Shopee do texto e substitui por links afiliados (ordem estável).
 */

import { shopeeGenerateShortLink } from "./shopee-affiliate-server";

const URL_IN_TEXT = /https?:\/\/[^\s<>"'()[\]]+/gi;

/**
 * Mescla sub_id_1/2/3 de todas as linhas de config com a mesma origem (vários destinos).
 * Sem isso, `matchedConfigs[0]` pode ser uma linha antiga sem sub_ids e o link sai sem tracking (utm_content vazio).
 */
export function mergeEspelhamentoSubIds(
  rows: Array<{
    sub_id_1: string | null | undefined;
    sub_id_2: string | null | undefined;
    sub_id_3: string | null | undefined;
  }>
): string[] {
  let s1 = "";
  let s2 = "";
  let s3 = "";
  for (const r of rows) {
    const a = (r.sub_id_1 ?? "").trim();
    const b = (r.sub_id_2 ?? "").trim();
    const c = (r.sub_id_3 ?? "").trim();
    if (a && !s1) s1 = a;
    if (b && !s2) s2 = b;
    if (c && !s3) s3 = c;
  }
  return [s1, s2, s3].filter((s) => s.length > 0);
}

function stripTrailingPunct(url: string): string {
  return url.replace(/[,;.:)]+$/g, "");
}

/** Hosts considerados Shopee (Brasil + encurtador). */
function isShopeeHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "shopee.com.br" ||
    h.endsWith(".shopee.com.br") ||
    h === "shopee.com" ||
    h.endsWith(".shopee.com") ||
    h === "s.shopee.com.br" ||
    h.endsWith(".s.shopee.com.br")
  );
}

export function extractShopeeUrlsFromText(text: string): string[] {
  const raw = text.match(URL_IN_TEXT) ?? [];
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const r of raw) {
    const cleaned = stripTrailingPunct(r.trim());
    try {
      const u = new URL(cleaned);
      if (!isShopeeHost(u.hostname)) continue;
      if (!seen.has(cleaned)) {
        seen.add(cleaned);
        ordered.push(cleaned);
      }
    } catch {
      /* ignore */
    }
  }
  return ordered;
}

/**
 * Substitui cada URL Shopee pelo short link de afiliado da conta (App ID + Secret do perfil), com subIds para tracking.
 */
export async function replaceShopeeUrlsWithAffiliateLinks(
  text: string,
  appId: string,
  secret: string,
  subIds: string[]
): Promise<{ text: string } | { error: string }> {
  const urls = extractShopeeUrlsFromText(text);
  if (urls.length === 0) return { text };
  const sorted = [...urls].sort((a, b) => b.length - a.length);
  const map = new Map<string, string>();
  for (const originUrl of sorted) {
    if (map.has(originUrl)) continue;
    const r = await shopeeGenerateShortLink(appId, secret, originUrl, subIds);
    if ("error" in r) return { error: `${originUrl}: ${r.error}` };
    map.set(originUrl, r.shortLink);
  }
  let out = text;
  for (const u of sorted) {
    const rep = map.get(u);
    if (rep) out = out.split(u).join(rep);
  }
  return { text: out };
}
