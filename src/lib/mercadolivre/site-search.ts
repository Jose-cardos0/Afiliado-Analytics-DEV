/**
 * Busca por texto no Mercado Livre — apenas com sessão (cookie ssid).
 * Implementação: {@link fetchMlSiteSearchWithSession} em ml-session-site-search.ts
 */

export type { MlSiteSearchProduct } from "@/lib/mercadolivre/ml-session-site-search";
export {
  enrichMlSiteSearchProductsFromPdp,
  fetchMlSiteCategoryWithSession,
  fetchMlSiteSearchWithSession,
  isMlSocialListsProfileUrl,
} from "@/lib/mercadolivre/ml-session-site-search";
