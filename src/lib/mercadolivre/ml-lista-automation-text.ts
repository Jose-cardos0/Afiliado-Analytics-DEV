import { effectiveListaOfferPromoPrice } from "@/lib/lista-ofertas-effective-promo";

export function mlEstCommissionFromPromoPrice(pricePromo: number | null, pct: number): number | null {
  if (pricePromo == null || !Number.isFinite(pricePromo) || pct <= 0) return null;
  return Math.round(pricePromo * (pct / 100) * 100) / 100;
}

export type MlListaAutomationInput = {
  productName: string;
  priceOriginal: number | null;
  pricePromo: number | null;
  discountRate: number | null;
  converterLink: string;
  /** Percentual 0–100 vindo do PDP (GANHOS X%); se omitido, não inclui linha de comissão. */
  commissionPct?: number | null;
  formatCurrency: (v: number) => string;
};

/**
 * Texto estilo grupos (Shopee / ML) — emojis, preços e link meli.la.
 */
export function buildMlListaAutomationText(p: MlListaAutomationInput): string {
  const promo =
    effectiveListaOfferPromoPrice(p.priceOriginal, p.pricePromo, p.discountRate) ?? p.pricePromo;
  const lines: string[] = [];
  lines.push(`✨ ${(p.productName || "Produto").trim()}`);
  const disc = p.discountRate != null && p.discountRate > 0 ? `-${Math.round(p.discountRate)}% ` : "";
  const orig = p.priceOriginal != null ? p.formatCurrency(p.priceOriginal) : "—";
  const por = promo != null ? p.formatCurrency(promo) : "—";
  lines.push(`💰 Preço: ${disc}🔴 ${orig} por ✅ ${por}`);
  const pct = p.commissionPct;
  if (pct != null && pct > 0) {
    const comm = mlEstCommissionFromPromoPrice(promo, pct);
    if (comm != null) {
      lines.push(
        `💸 Ganhos ML: ${pct.toFixed(1).replace(/\.0$/, "")}% · ${p.formatCurrency(comm)}`,
      );
    }
  }
  lines.push("🏷️ PROMOÇÃO - CLIQUE NO LINK 👇");
  lines.push((p.converterLink || "").trim());
  return lines.join("\n");
}
