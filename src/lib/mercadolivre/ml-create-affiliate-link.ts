/**
 * Gera link curto meli.la via API interna do portal de afiliados (mesmo fluxo do linkbuilder web).
 * Requer cookie de sessão válido (ex.: ssid da extensão) + CSRF obtido ao abrir o linkbuilder.
 */

const LINKBUILDER_URL = "https://www.mercadolivre.com.br/afiliados/linkbuilder";
const CREATE_LINK_URL = "https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.5",
};

function collectSetCookieLines(res: Response): string[] {
  const h = res.headers;
  if (typeof (h as unknown as { getSetCookie?: () => string[] }).getSetCookie === "function") {
    return (h as unknown as { getSetCookie: () => string[] }).getSetCookie();
  }
  const single = h.get("set-cookie");
  return single ? [single] : [];
}

function parseSetCookieLines(setCookies: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of setCookies) {
    const part = line.split(";")[0]?.trim();
    if (!part) continue;
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (name) out[name] = value;
  }
  return out;
}

function mergeCookieHeader(initial: string, added: Record<string, string>): string {
  const map: Record<string, string> = {};
  for (const part of initial.split(";")) {
    const p = part.trim();
    const eq = p.indexOf("=");
    if (eq > 0) map[p.slice(0, eq).trim()] = p.slice(eq + 1).trim();
  }
  for (const [k, v] of Object.entries(added)) {
    map[k] = v;
  }
  return Object.entries(map)
    .filter(([, v]) => v != null && String(v).length > 0)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function extractCsrfToken(html: string): string | null {
  const m1 = html.match(/name=["']csrf-token["'][^>]*content=["']([^"']+)["']/i);
  if (m1?.[1]) return m1[1].trim();
  const m2 = html.match(/content=["']([^"']+)["'][^>]*name=["']csrf-token["']/i);
  if (m2?.[1]) return m2[1].trim();
  const m3 = html.match(/["']x-csrf-token["']\s*:\s*["']([^"']+)["']/i);
  if (m3?.[1]) return m3[1].trim();
  const m4 = html.match(/csrfToken["']?\s*[:=]\s*["']([^"']+)["']/i);
  if (m4?.[1]) return m4[1].trim();
  return null;
}

function csrfFromCookieJar(cookie: string): string | null {
  const m = cookie.match(/(?:^|;\s*)_csrf=([^;]+)/i);
  if (!m?.[1]) return null;
  try {
    return decodeURIComponent(m[1].trim());
  } catch {
    return m[1].trim();
  }
}

function deepFindMeliLa(x: unknown): string | null {
  if (typeof x === "string") {
    const m = x.match(/https?:\/\/(?:www\.)?meli\.la\/[^\s"'<>]+/i);
    return m ? m[0].replace(/\/$/, "") : null;
  }
  if (Array.isArray(x)) {
    for (const i of x) {
      const r = deepFindMeliLa(i);
      if (r) return r;
    }
    return null;
  }
  if (x && typeof x === "object") {
    for (const v of Object.values(x)) {
      const r = deepFindMeliLa(v);
      if (r) return r;
    }
  }
  return null;
}

function looksLikeLoginPage(html: string, finalUrl: string): boolean {
  const u = finalUrl.toLowerCase();
  if (u.includes("/login") || u.includes("/jms/") && u.includes("login")) return true;
  if (/Digite seu e-mail ou telefone/i.test(html) && /iniciar sess/i.test(html)) return true;
  return false;
}

export type CreateMlAffiliateLinkResult = {
  shortLink: string;
  /** Cookies mesclados após o GET no linkbuilder (para debug; não logar em produção). */
  mergedCookieLength: number;
};

/**
 * @param cookieHeader — ex.: "ssid=…" (ou string maior se o cliente enviar mais cookies)
 * @param productPageUrl — permalink do anúncio (https://…mercadolivre…)
 */
export async function createMercadoLivreAffiliateShortLink(opts: {
  cookieHeader: string;
  productPageUrl: string;
  affiliateTag?: string;
}): Promise<CreateMlAffiliateLinkResult> {
  const tag = opts.affiliateTag?.trim() || process.env.ML_AFFILIATE_LINK_TAG?.trim() || "afiliado_analytics";
  let cookie = opts.cookieHeader.trim();
  const productPageUrl = opts.productPageUrl.trim();
  if (!productPageUrl) {
    throw new Error("URL do produto é obrigatória.");
  }

  const warmRes = await fetch(LINKBUILDER_URL, {
    method: "GET",
    headers: { ...BROWSER_HEADERS, Cookie: cookie },
    redirect: "follow",
    signal: AbortSignal.timeout(25000),
    cache: "no-store",
  });

  const html = await warmRes.text();
  const mergedFromSet = parseSetCookieLines(collectSetCookieLines(warmRes));
  if (Object.keys(mergedFromSet).length > 0) {
    cookie = mergeCookieHeader(cookie, mergedFromSet);
  }

  if (looksLikeLoginPage(html, warmRes.url)) {
    throw new Error(
      "Sessão do Mercado Livre inválida ou expirada. Abra o ML logado, use a extensão para copiar o token novamente e cole em Configurar.",
    );
  }

  const csrf = extractCsrfToken(html) ?? csrfFromCookieJar(cookie);
  if (!csrf) {
    throw new Error(
      "Não foi possível obter o token de segurança (CSRF) do programa de afiliados. Confirme que sua conta tem acesso ao linkbuilder e tente de novo.",
    );
  }

  const body = JSON.stringify({ urls: [productPageUrl], tag });

  const postRes = await fetch(CREATE_LINK_URL, {
    method: "POST",
    headers: {
      ...BROWSER_HEADERS,
      Cookie: cookie,
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
      Origin: "https://www.mercadolivre.com.br",
      Referer: LINKBUILDER_URL,
      "x-csrf-token": csrf,
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
    },
    body,
    signal: AbortSignal.timeout(25000),
    cache: "no-store",
  });

  const text = await postRes.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!postRes.ok) {
    const msg =
      typeof json === "object" &&
      json &&
      "message" in json &&
      typeof (json as { message?: unknown }).message === "string"
        ? (json as { message: string }).message
        : text.slice(0, 280);
    throw new Error(`Mercado Livre (${postRes.status}): ${msg || "falha ao criar link de afiliado"}`);
  }

  const shortLink = deepFindMeliLa(json);
  if (!shortLink) {
    throw new Error(
      "O Mercado Livre respondeu sem um link meli.la. Verifique se a URL é de um anúncio válido e se você está no programa de afiliados.",
    );
  }

  return { shortLink, mergedCookieLength: cookie.length };
}
