/**
 * Duplicar anúncio N vezes (mesmo criativo, nome + " -COPIA 1", " -COPIA 2", ...).
 * POST /api/meta/ads/duplicate
 * Body: { ad_id: string, count: number }  count 1-50
 */

import { NextResponse } from "next/server";
import { createClient } from "../../../../../../utils/supabase/server";

const GRAPH_BASE = "https://graph.facebook.com/v21.0";

/** Garante que o ID da conta de anúncios tenha o prefixo act_ (exigido pela API ao criar recursos). */
function normalizeAdAccountId(id: string): string {
  const raw = String(id).trim();
  if (!raw) return raw;
  return raw.startsWith("act_") ? raw : `act_${raw}`;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("meta_access_token").eq("id", user.id).single();
    const token = profile?.meta_access_token?.trim();
    if (!token) return NextResponse.json({ error: "Token do Meta não configurado." }, { status: 400 });

    const body = await req.json();
    const ad_id = body?.ad_id?.trim();
    let count = body?.count != null ? Number(body.count) : 1;
    if (!ad_id) return NextResponse.json({ error: "ad_id é obrigatório." }, { status: 400 });
    if (!Number.isFinite(count) || count < 1 || count > 50) {
      return NextResponse.json({ error: "count deve ser entre 1 e 50." }, { status: 400 });
    }
    count = Math.floor(count);

    const adRes = await fetch(
      `${GRAPH_BASE}/${ad_id}?fields=name,creative,adset_id,account_id&access_token=${encodeURIComponent(token)}`
    );
    const adJson = (await adRes.json()) as {
      name?: string;
      creative?: { id?: string };
      adset_id?: string;
      account_id?: string;
      error?: { message: string };
    };
    if (adJson.error) {
      return NextResponse.json({ error: adJson.error.message ?? "Erro ao buscar anúncio", meta_error: adJson.error }, { status: 500 });
    }
    const creative_id = typeof adJson.creative === "object" && adJson.creative?.id ? adJson.creative.id : undefined;
    const adset_id = adJson.adset_id;
    const account_id = adJson.account_id;
    if (!creative_id || !adset_id || !account_id) {
      return NextResponse.json({ error: "Anúncio sem creative, adset ou conta." }, { status: 500 });
    }
    const normalizedAccountId = normalizeAdAccountId(account_id);

    const baseName = (adJson.name || "Anúncio").slice(0, 200);
    const created: string[] = [];
    for (let i = 1; i <= count; i++) {
      const name = `${baseName} -COPIA ${i}`;
      const params = new URLSearchParams({
        access_token: token,
        name,
        adset_id,
        creative: JSON.stringify({ creative_id }),
        status: "PAUSED",
      });
      const createRes = await fetch(`${GRAPH_BASE}/${normalizedAccountId}/ads`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      const createJson = (await createRes.json()) as { id?: string; error?: { message: string } };
      if (createJson.error) {
        return NextResponse.json({
          error: `Erro ao criar cópia ${i}: ${createJson.error.message}`,
          created,
          meta_error: createJson.error,
        }, { status: 500 });
      }
      if (createJson.id) created.push(createJson.id);
    }
    return NextResponse.json({ success: true, count: created.length, ad_ids: created });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro ao duplicar anúncio" }, { status: 500 });
  }
}
