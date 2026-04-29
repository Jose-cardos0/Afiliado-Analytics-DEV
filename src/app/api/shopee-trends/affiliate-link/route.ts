/**
 * Converte um produto da snapshot de tendências em link afiliado do usuário
 * autenticado. Lê as credenciais Shopee do próprio profile (cada vendedor usa
 * a sua), monta o `originUrl` a partir do `productLink` ou `itemId+shopId` e
 * chama `generateShortLink`.
 *
 *   POST /api/shopee-trends/affiliate-link
 *   Body: { itemId: number, subId?: string }
 *   Resposta: { shortLink }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { shopeeGenerateShortLink } from "@/lib/shopee-affiliate-server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const itemId = Number(body?.itemId);
    if (!Number.isFinite(itemId) || itemId <= 0) {
      return NextResponse.json({ error: "itemId obrigatório" }, { status: 400 });
    }
    const subId = typeof body?.subId === "string" ? body.subId.trim().slice(0, 64) : "";

    // Credenciais Shopee do usuário.
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("shopee_app_id, shopee_api_key")
      .eq("id", user.id)
      .single();
    if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });
    const appId = (profile as { shopee_app_id?: string | null } | null)?.shopee_app_id?.trim();
    const secret = (profile as { shopee_api_key?: string | null } | null)?.shopee_api_key?.trim();
    if (!appId || !secret) {
      return NextResponse.json(
        { error: "Configure suas credenciais Shopee em Configurações antes de gerar o link." },
        { status: 400 },
      );
    }

    // Snapshot do produto (productLink é o que mandamos pra `generateShortLink`).
    const { data: snap, error: snapErr } = await supabase
      .from("shopee_trend_snapshots")
      .select("product_link, shop_id")
      .eq("item_id", itemId)
      .maybeSingle();
    if (snapErr) return NextResponse.json({ error: snapErr.message }, { status: 500 });
    if (!snap) return NextResponse.json({ error: "Produto não está mais em alta" }, { status: 404 });

    const productLink =
      (snap as { product_link?: string | null }).product_link?.trim() ||
      (() => {
        const shopId = (snap as { shop_id?: number | null }).shop_id;
        if (shopId) return `https://shopee.com.br/product/${shopId}/${itemId}`;
        return null;
      })();
    if (!productLink) {
      return NextResponse.json({ error: "Link do produto indisponível" }, { status: 502 });
    }

    const subIds = subId ? [subId] : [];
    const result = await shopeeGenerateShortLink(appId, secret, productLink, subIds);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }
    return NextResponse.json({ shortLink: result.shortLink });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao gerar link";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
