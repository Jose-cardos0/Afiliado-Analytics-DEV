/**
 * Quando o ML (ou fallback HTML) devolve um único preço, original e promo ficam iguais.
 * Se o usuário informar desconto %, o preço em verde / "por" deve ser original × (1 − desconto/100).
 */

const SAME_EPS = 0.005;

export function effectiveListaOfferPromoPrice(
  priceOriginal: number | null | undefined,
  pricePromo: number | null | undefined,
  discountRate: number | null | undefined,
): number | null {
  const po = priceOriginal != null && Number.isFinite(priceOriginal) && priceOriginal > 0 ? priceOriginal : null;
  const pp = pricePromo != null && Number.isFinite(pricePromo) && pricePromo >= 0 ? pricePromo : null;
  const dr = discountRate != null && Number.isFinite(discountRate) && discountRate > 0 ? discountRate : null;

  if (po != null && dr != null) {
    const promoForCompare = pp ?? po;
    const sameAsOriginal = Math.abs(promoForCompare - po) < SAME_EPS;
    if (sameAsOriginal) {
      return Math.round(po * (1 - dr / 100) * 100) / 100;
    }
  }

  if (pp != null && pp > 0) return pp;
  return null;
}
