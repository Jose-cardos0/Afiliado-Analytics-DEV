/**
 * Lista categorias disponíveis na Shopee via shopeeOfferV2 (ofertas do tipo Categoria).
 * GET /api/shopee/categories
 */

import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "../../../../../utils/supabase/server";

export const dynamic = "force-dynamic";

const SHOPEE_GQL = "https://open-api.affiliate.shopee.com.br/graphql";

function buildAuthorization(appId: string, secret: string, payload: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signatureRaw = `${appId}${timestamp}${payload}${secret}`;
  const signature = crypto.createHash("sha256").update(signatureRaw).digest("hex");
  return `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${signature}`;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("shopee_app_id, shopee_api_key")
      .eq("id", user.id)
      .single();

    const appId = profile?.shopee_app_id?.trim();
    const secret = profile?.shopee_api_key?.trim();
    if (!appId || !secret) {
      return NextResponse.json({ error: "Chaves da Shopee não configuradas." }, { status: 400 });
    }

    const query = `
      query {
        shopeeOfferV2(keyword: "ofertas", sortType: 1, page: 1, limit: 500) {
          nodes {
            offerType
            categoryId
            offerName
          }
          pageInfo { hasNextPage }
        }
      }
    `;
    const payload = JSON.stringify({ query });
    const Authorization = buildAuthorization(appId, secret, payload);

    const res = await fetch(SHOPEE_GQL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization },
      body: payload,
    });

    const json = (await res.json()) as {
      data?: { shopeeOfferV2?: { nodes?: { offerType?: number; categoryId?: number; offerName?: string }[] } };
      errors?: { message?: string }[];
    };
    if (!res.ok || json?.errors?.length) {
      const msg = json?.errors?.[0]?.message ?? `Shopee error (${res.status})`;
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const nodes = json?.data?.shopeeOfferV2?.nodes ?? [];
    const categoryMap = new Map<number, string>();
    for (const n of nodes) {
      if (n.offerType === 2 && n.categoryId != null && n.offerName) {
        categoryMap.set(Number(n.categoryId), String(n.offerName).trim());
      }
    }
    const categories = Array.from(categoryMap.entries())
      .map(([id, name]) => ({ categoryId: id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    return NextResponse.json({ categories });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro ao buscar categorias" }, { status: 500 });
  }
}
