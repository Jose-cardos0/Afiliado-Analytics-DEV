/**
 * Token copiado da extensão: base64(UTF-8 de "ssid=VALOR") — mesmo formato que popup.js (btoa).
 * Aceita também a string já decodificada "ssid=…".
 */

/** Chaves localStorage (app web + extensão podem alinhar nomes). */
export const ML_EXT_SESSION_LS_KEY = "aa_ml_ext_session_token";
/** Etiqueta (tag) do programa de afiliados ML — ex.: cake9265169; usada no createLink (meli.la). */
export const ML_EXT_AFFILIATE_TAG_LS_KEY = "aa_ml_ext_affiliate_tag";

const MAX_INPUT_LEN = 12_000;

export function parseMlExtensionSessionToCookieHeader(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const t = String(raw).trim();
  if (!t.length || t.length > MAX_INPUT_LEN) return null;

  const toHeader = (s: string): string | null => {
    const m = s.match(/ssid\s*=\s*([^;\r\n]+)/i);
    if (!m?.[1]) return null;
    const v = m[1].trim();
    if (!v || v.length > 4000) return null;
    return `ssid=${v}`;
  };

  const direct = toHeader(t);
  if (direct) return direct;

  try {
    const buf = Buffer.from(t, "base64");
    const utf8 = buf.toString("utf8");
    const hUtf = toHeader(utf8.trim());
    if (hUtf) return hUtf;
    /** Mesmo payload que `btoa(unescape(encodeURIComponent(...)))` na extensão (bytes → latin1). */
    const latin1 = buf.toString("latin1");
    return toHeader(latin1.trim());
  } catch {
    return null;
  }
}
