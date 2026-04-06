import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { fetchMlProductMetaByMlbId, fetchMlProductMetaFromUrl } from "@/lib/mercadolivre/fetch-product-meta";
import { expandMercadoLivreAffiliateLink } from "@/lib/mercadolivre/expand-affiliate-link";
import { tryFetchMlClientCredentialsToken } from "@/lib/mercadolivre/oauth-app-token";

export const dynamic = "force-dynamic";

/**
 * POST { productUrl?: string, mlbId?: string, affiliateUrl?: string }
 * affiliateUrl: link curto meli.la — o servidor segue o redirect até a página do produto.
 * Busca dados do anúncio na API do ML. Se o perfil tiver Client ID + Secret,
 * tenta obter token de aplicação; senão usa só endpoints públicos.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("mercadolivre_client_id, mercadolivre_client_secret")
      .eq("id", user.id)
      .single();

    const cid = (profile as { mercadolivre_client_id?: string } | null)?.mercadolivre_client_id?.trim() ?? "";
    const csec = (profile as { mercadolivre_client_secret?: string } | null)?.mercadolivre_client_secret?.trim() ?? "";
    let accessToken: string | null = null;
    if (cid && csec) {
      accessToken = await tryFetchMlClientCredentialsToken(cid, csec);
    }

    const body = await req.json().catch(() => ({}));
    const productUrl = String(body?.productUrl ?? body?.product_url ?? "").trim();
    const mlbIdRaw = String(body?.mlbId ?? body?.mlb_id ?? "").trim();
    const affiliateUrl = String(body?.affiliateUrl ?? body?.affiliate_url ?? "").trim();

    let meta = null as Awaited<ReturnType<typeof fetchMlProductMetaByMlbId>>;
    if (mlbIdRaw) {
      meta = await fetchMlProductMetaByMlbId(mlbIdRaw, accessToken);
    } else if (productUrl) {
      meta = await fetchMlProductMetaFromUrl(productUrl, accessToken);
    } else if (affiliateUrl) {
      const expanded = await expandMercadoLivreAffiliateLink(affiliateUrl);
      if (!expanded) {
        return NextResponse.json(
          {
            error:
              "Não foi possível abrir o link de afiliado (meli.la). Confira se é um link completo https://meli.la/… ou cole a URL da página do produto.",
          },
          { status: 400 },
        );
      }
      meta = await fetchMlProductMetaFromUrl(expanded, accessToken);
    }

    if (!meta) {
      return NextResponse.json(
        {
          error:
            "Não foi possível obter o produto. Cole a URL da página do anúncio (com MLB no link), um link meli.la válido ou o ID MLB (ex.: MLB1234567890).",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      data: {
        resolvedId: meta.resolvedId,
        productName: meta.productName,
        subtitle: meta.subtitle ?? null,
        imageUrl: meta.imageUrl,
        priceOriginal: meta.priceOriginal,
        pricePromo: meta.pricePromo,
        discountRate: meta.discountRate,
        currencyId: meta.currencyId ?? null,
        permalink: meta.permalink ?? null,
        condition: meta.condition ?? null,
        availableQuantity: meta.availableQuantity ?? null,
        soldQuantity: meta.soldQuantity ?? null,
        warranty: meta.warranty ?? null,
        listingTypeId: meta.listingTypeId ?? null,
        usedAppCredentials: !!(cid && csec),
        usedBearerToken: !!accessToken,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro" }, { status: 500 });
  }
}
