/**
 * Tenta obter access token com client_credentials.
 * O Mercado Livre documenta principalmente authorization_code; em alguns casos o endpoint aceita client_credentials.
 * Se falhar, retorna null e as chamadas à API pública seguem sem Bearer.
 */
export async function tryFetchMlClientCredentialsToken(
  clientId: string,
  clientSecret: string,
): Promise<string | null> {
  const id = clientId.trim();
  const secret = clientSecret.trim();
  if (!id || !secret) return null;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: id,
    client_secret: secret,
  });

  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) return null;

  const j = (await res.json()) as { access_token?: string; error?: string };
  if (j.error || typeof j.access_token !== "string") return null;
  return j.access_token;
}
