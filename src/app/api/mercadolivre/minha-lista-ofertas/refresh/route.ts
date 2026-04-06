import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { fetchMlProductMetaFromUrl } from "@/lib/mercadolivre/fetch-product-meta";
import { expandMercadoLivreAffiliateLink } from "@/lib/mercadolivre/expand-affiliate-link";
import { tryFetchMlClientCredentialsToken } from "@/lib/mercadolivre/oauth-app-token";
import { effectiveListaOfferPromoPrice } from "@/lib/lista-ofertas-effective-promo";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_LIST_REFRESH = 80;

type MlRow = {
  id: string;
  product_name: string | null;
  image_url: string | null;
  converter_link: string | null;
};

/**
 * POST { itemId?: string, listaId?: string }
 * Reabre o link de afiliado (meli.la → PDP), busca meta no ML e atualiza nome, imagem e preços.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("mercadolivre_client_id, mercadolivre_client_secret")
      .eq("id", user.id)
      .single();

    const cid =
      (profile as { mercadolivre_client_id?: string } | null)?.mercadolivre_client_id?.trim() ?? "";
    const csec =
      (profile as { mercadolivre_client_secret?: string } | null)?.mercadolivre_client_secret?.trim() ?? "";
    let accessToken: string | null = null;
    if (cid && csec) {
      accessToken = await tryFetchMlClientCredentialsToken(cid, csec);
    }

    const body = await req.json().catch(() => ({}));
    const itemId = String(body?.itemId ?? body?.item_id ?? "").trim();
    const listaId = String(body?.listaId ?? body?.lista_id ?? "").trim();

    if (!itemId && !listaId) {
      return NextResponse.json({ error: "Informe itemId ou listaId." }, { status: 400 });
    }

    let rows: MlRow[] = [];

    if (itemId) {
      const { data: row, error } = await supabase
        .from("minha_lista_ofertas_ml")
        .select("id, product_name, image_url, converter_link")
        .eq("id", itemId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!row) return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });
      rows = [row as MlRow];
    } else {
      const { data: lista, error: listaErr } = await supabase
        .from("listas_ofertas_ml")
        .select("id")
        .eq("id", listaId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (listaErr) return NextResponse.json({ error: listaErr.message }, { status: 500 });
      if (!lista) return NextResponse.json({ error: "Lista não encontrada." }, { status: 404 });

      const { data: items, error } = await supabase
        .from("minha_lista_ofertas_ml")
        .select("id, product_name, image_url, converter_link")
        .eq("lista_id", listaId)
        .eq("user_id", user.id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      rows = (items ?? []) as MlRow[];
    }

    if (rows.length === 0) {
      return NextResponse.json({ data: { updated: 0, failed: 0, errors: [] as string[] } });
    }

    if (rows.length > MAX_LIST_REFRESH) {
      return NextResponse.json(
        { error: `Máximo de ${MAX_LIST_REFRESH} itens por atualização em lote. Divida a lista ou atualize por item.` },
        { status: 400 },
      );
    }

    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const converter = String(row.converter_link ?? "").trim();
      if (!converter) {
        failed += 1;
        errors.push(`${row.product_name?.slice(0, 40) || row.id}: sem link de afiliado`);
        continue;
      }

      const expanded = await expandMercadoLivreAffiliateLink(converter);
      if (!expanded) {
        failed += 1;
        errors.push(`${row.product_name?.slice(0, 40) || row.id}: não foi possível abrir o link (meli.la)`);
        continue;
      }

      const meta = await fetchMlProductMetaFromUrl(expanded, accessToken);
      if (!meta) {
        failed += 1;
        errors.push(`${row.product_name?.slice(0, 40) || row.id}: ML não retornou dados do anúncio`);
        continue;
      }

      let po = meta.priceOriginal;
      let pp = meta.pricePromo;
      const dr = meta.discountRate;
      const adj = effectiveListaOfferPromoPrice(po, pp, dr);
      if (adj != null) pp = adj;

      const { error: upErr } = await supabase
        .from("minha_lista_ofertas_ml")
        .update({
          product_name: meta.productName?.trim() || row.product_name || "",
          image_url: meta.imageUrl?.trim() || row.image_url || "",
          price_original: po,
          price_promo: pp,
          discount_rate: dr,
        })
        .eq("id", row.id)
        .eq("user_id", user.id);

      if (upErr) {
        failed += 1;
        errors.push(`${row.product_name?.slice(0, 40) || row.id}: ${upErr.message}`);
        continue;
      }

      updated += 1;
    }

    return NextResponse.json({
      data: {
        updated,
        failed,
        errors: errors.slice(0, 12),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro" }, { status: 500 });
  }
}
