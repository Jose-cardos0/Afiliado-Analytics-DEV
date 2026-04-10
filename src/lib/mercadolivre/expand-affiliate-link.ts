/**
 * Segue redirect de links curtos do programa de afiliados (ex.: meli.la) até a URL do ML.
 * SSRF: só aceita destino em domínios Mercado Livre / Mercado Libre.
 */

import { looksLikeMercadoLivreProductUrl } from "@/lib/mercadolivre/extract-mlb-id";

const SHORT_HOSTS = new Set(["meli.la", "www.meli.la"]);

const BROWSER_HEADERS_BASE: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.5",
};

function browserHeaders(cookieHeader?: string | null): HeadersInit {
  if (!cookieHeader?.trim()) return BROWSER_HEADERS_BASE;
  return { ...BROWSER_HEADERS_BASE, Cookie: cookieHeader.trim() };
}

function isAllowedFinalProductHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "mercadolivre.com.br" || h === "www.mercadolivre.com.br") return true;
  if (h.endsWith(".mercadolivre.com.br")) return true;
  if (h.includes("mercadolibre.com")) return true;
  if (h === "produto.mercadolivre.com.br") return true;
  return false;
}

/**
 * meli.la às vezes responde 200 na própria origem e só redireciona via meta refresh / dados no HTML.
 * Extrai o primeiro destino em domínio ML aceito.
 */
function extractMlProductUrlFromMeliBody(html: string, baseUrl: string): string | null {
  const candidates: string[] = [];
  const push = (s: string | undefined | null) => {
    if (!s) return;
    const t = s.trim().replace(/&amp;/g, "&").replace(/^['"]|['"]$/g, "");
    if (!t) return;
    if (t.startsWith("http")) candidates.push(t);
    else if (t.startsWith("//")) candidates.push(`https:${t}`);
    else if (t.startsWith("/")) {
      try {
        candidates.push(new URL(t, baseUrl).toString());
      } catch {
        /* ignore */
      }
    }
  };

  const refreshBlock = html.match(/http-equiv\s*=\s*["']?\s*refresh["']?[^>]*content\s*=\s*["']([^"']+)["']/i);
  if (refreshBlock) {
    const content = refreshBlock[1];
    const urlEq = content.match(/url\s*=\s*([^;]+)/i);
    if (urlEq) push(urlEq[1].trim());
    const semi = content.match(/;\s*([^;]+)$/);
    if (semi && /https?:/i.test(semi[1])) push(semi[1].trim());
  }

  const refreshBlock2 = html.match(/content\s*=\s*["']([^"']+)["'][^>]*http-equiv\s*=\s*["']?\s*refresh/i);
  if (refreshBlock2) {
    const urlEq = refreshBlock2[1].match(/url\s*=\s*([^;]+)/i);
    if (urlEq) push(urlEq[1].trim());
  }

  const og = html.match(/property\s*=\s*["']og:url["'][^>]*content\s*=\s*["']([^"']+)["']/i);
  push(og?.[1]);
  const og2 = html.match(/content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["']og:url["']/i);
  push(og2?.[1]);

  const canon = html.match(/rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']+)["']/i);
  push(canon?.[1]);

  const loc =
    html.match(/location\.href\s*=\s*["']([^"']+)["']/i) ??
    html.match(/window\.location(?:\.href)?\s*=\s*["']([^"']+)["']/i);
  push(loc?.[1]);

  const reAbs = /https?:\/\/[a-z0-9.-]*mercadolivre\.com\.br[^"'\\s<]*/gi;
  let m: RegExpExecArray | null;
  while ((m = reAbs.exec(html)) !== null) {
    push(m[0]);
  }

  const reLibre = /https?:\/\/[a-z0-9.-]*mercadolibre\.com[^"'\\s<]*/gi;
  while ((m = reLibre.exec(html)) !== null) {
    push(m[0]);
  }

  for (const c of candidates) {
    try {
      const u = new URL(c);
      if (!isAllowedFinalProductHost(u.hostname)) continue;
      u.hash = "";
      return u.toString();
    } catch {
      /* next */
    }
  }
  return null;
}

/**
 * Se já for URL de produto ML, devolve normalizada; se for meli.la, segue redirects.
 */
export async function expandMercadoLivreAffiliateLink(
  raw: string,
  cookieHeader?: string | null,
): Promise<string | null> {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;

  const host = u.hostname.toLowerCase();

  if (looksLikeMercadoLivreProductUrl(trimmed) && isAllowedFinalProductHost(host)) {
    u.hash = "";
    return u.toString();
  }

  if (!SHORT_HOSTS.has(host)) return null;

  const res = await fetch(trimmed, {
    method: "GET",
    redirect: "follow",
    headers: browserHeaders(cookieHeader),
    signal: AbortSignal.timeout(20000),
    ...(cookieHeader?.trim() ? { cache: "no-store" as RequestCache } : {}),
  });
  if (!res.ok) return null;

  let finalUrl = res.url;
  try {
    let fu = new URL(finalUrl);
    const host = fu.hostname.toLowerCase();
    if (SHORT_HOSTS.has(host)) {
      const html = (await res.text()).slice(0, 220_000);
      const extracted = extractMlProductUrlFromMeliBody(html, finalUrl);
      if (!extracted) return null;
      finalUrl = extracted;
      fu = new URL(finalUrl);
    }
    if (!isAllowedFinalProductHost(fu.hostname)) return null;
    fu.hash = "";
    return fu.toString();
  } catch {
    return null;
  }
}
