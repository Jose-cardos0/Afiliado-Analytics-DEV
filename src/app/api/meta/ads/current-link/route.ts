/**
 * Retorna o link atual do criativo do anúncio (para preencher o modal e saber se é "Gerar" ou "Editar").
 * GET /api/meta/ads/current-link?ad_id=xxx
 * Se ad_id for um display_ad_id no mapeamento, busca o link do anúncio que está rodando (delivering).
 * Retorna { link: string | null }. Se o criativo usa placeholder ou não tem link, retorna null.
 */

import { NextResponse } from "next/server";
import { createClient } from "../../../../../../utils/supabase/server";

const GRAPH_BASE = "https://graph.facebook.com/v21.0";
const PLACEHOLDER_LINK = "https://www.facebook.com";

function getLinkFromSpec(spec: Record<string, unknown>): string | null {
  if (spec.link_data && typeof spec.link_data === "object") {
    const link = (spec.link_data as Record<string, unknown>).link;
    if (typeof link === "string" && link.trim()) {
      const normalized = link.replace(/\/$/, "");
      if (normalized !== PLACEHOLDER_LINK && normalized !== "https://www.facebook.com") return link;
    }
  }
  if (spec.video_data && typeof spec.video_data === "object") {
    const vd = spec.video_data as Record<string, unknown>;
    if (vd.call_to_action && typeof vd.call_to_action === "object") {
      const cta = vd.call_to_action as Record<string, unknown>;
      if (cta.value && typeof cta.value === "object") {
        const link = (cta.value as Record<string, unknown>).link;
        if (typeof link === "string" && link.trim()) {
          const normalized = link.replace(/\/$/, "");
          if (normalized !== PLACEHOLDER_LINK && normalized !== "https://www.facebook.com") return link;
        }
      }
    }
  }
  return null;
}

async function getCreativeLink(token: string, adId: string): Promise<string | null> {
  const adRes = await fetch(
    `${GRAPH_BASE}/${adId}?fields=creative&access_token=${encodeURIComponent(token)}`
  );
  const adJson = (await adRes.json()) as {
    creative?: { id: string };
    error?: { message: string };
  };
  if (adJson.error || !adJson.creative) return null;
  const creativeId = typeof adJson.creative === "object" && adJson.creative?.id
    ? adJson.creative.id
    : (adJson as { creative?: string }).creative;
  if (!creativeId) return null;

  const creativeRes = await fetch(
    `${GRAPH_BASE}/${creativeId}?fields=object_story_spec&access_token=${encodeURIComponent(token)}`
  );
  const creativeJson = (await creativeRes.json()) as {
    object_story_spec?: Record<string, unknown>;
    error?: { message: string };
  };
  if (creativeJson.error || !creativeJson.object_story_spec) return null;
  return getLinkFromSpec(creativeJson.object_story_spec as Record<string, unknown>);
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("meta_access_token")
      .eq("id", user.id)
      .single();

    const token = profile?.meta_access_token?.trim();
    if (!token) {
      return NextResponse.json(
        { error: "Token do Meta não configurado." },
        { status: 400 }
      );
    }

    const url = new URL(req.url);
    const ad_id = url.searchParams.get("ad_id")?.trim();
    if (!ad_id) {
      return NextResponse.json(
        { error: "ad_id é obrigatório." },
        { status: 400 }
      );
    }

    let adIdToFetch = ad_id;
    const { data: mappingRow } = await supabase
      .from("meta_ad_display_mapping")
      .select("delivering_ad_id")
      .eq("user_id", user.id)
      .eq("display_ad_id", ad_id)
      .maybeSingle();
    if (mappingRow?.delivering_ad_id) {
      adIdToFetch = String(mappingRow.delivering_ad_id);
    }

    const link = await getCreativeLink(token, adIdToFetch);
    return NextResponse.json({ link });
  } catch {
    return NextResponse.json({ link: null }, { status: 200 });
  }
}
