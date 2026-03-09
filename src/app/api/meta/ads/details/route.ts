/**
 * Dados do anúncio + criativo para preencher formulário de edição.
 * GET /api/meta/ads/details?ad_id=xxx
 * Retorna name, link, message, title, call_to_action, page_id, adset_id, account_id.
 */

import { NextResponse } from "next/server";
import { createClient } from "../../../../../../utils/supabase/server";

const GRAPH_BASE = "https://graph.facebook.com/v21.0";

function parseCreativeSpec(spec: Record<string, unknown>): { link: string; message: string; title: string; call_to_action: string; page_id: string } {
  const out = { link: "https://www.facebook.com", message: "", title: "", call_to_action: "LEARN_MORE", page_id: "" };
  if (spec.page_id) out.page_id = String(spec.page_id);
  if (spec.link_data && typeof spec.link_data === "object") {
    const ld = spec.link_data as Record<string, unknown>;
    if (typeof ld.link === "string") out.link = ld.link;
    if (typeof ld.message === "string") out.message = ld.message;
    if (typeof ld.name === "string") out.title = ld.name;
    if (ld.call_to_action && typeof ld.call_to_action === "object") {
      const cta = ld.call_to_action as Record<string, unknown>;
      if (typeof cta.type === "string") out.call_to_action = cta.type;
    }
  }
  if (spec.video_data && typeof spec.video_data === "object") {
    const vd = spec.video_data as Record<string, unknown>;
    if (typeof vd.message === "string") out.message = vd.message;
    if (typeof vd.title === "string") out.title = vd.title;
    if (vd.call_to_action && typeof vd.call_to_action === "object") {
      const cta = vd.call_to_action as Record<string, unknown>;
      if (typeof cta.type === "string") out.call_to_action = cta.type;
      if (cta.value && typeof cta.value === "object") {
        const val = cta.value as Record<string, unknown>;
        if (typeof val.link === "string") out.link = val.link;
      }
    }
  }
  return out;
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("meta_access_token").eq("id", user.id).single();
    const token = profile?.meta_access_token?.trim();
    if (!token) return NextResponse.json({ error: "Token do Meta não configurado." }, { status: 400 });

    const url = new URL(req.url);
    const ad_id = url.searchParams.get("ad_id")?.trim();
    if (!ad_id) return NextResponse.json({ error: "ad_id é obrigatório." }, { status: 400 });

    const adRes = await fetch(
      `${GRAPH_BASE}/${ad_id}?fields=name,creative,adset_id,account_id&access_token=${encodeURIComponent(token)}`
    );
    const adJson = (await adRes.json()) as {
      name?: string;
      creative?: { id: string };
      adset_id?: string;
      account_id?: string;
      error?: { message: string };
    };
    if (adJson.error || !adJson.account_id) {
      return NextResponse.json(
        { error: adJson.error?.message ?? "Anúncio não encontrado.", meta_error: adJson.error },
        { status: 500 }
      );
    }
    const creativeId = typeof adJson.creative === "object" && adJson.creative?.id ? adJson.creative.id : (adJson as { creative?: string }).creative;
    if (!creativeId) {
      return NextResponse.json({
        name: adJson.name ?? "",
        link: "https://www.facebook.com",
        message: "",
        title: "",
        call_to_action: "LEARN_MORE",
        page_id: "",
        adset_id: adJson.adset_id ?? "",
        account_id: adJson.account_id,
      });
    }

    const creativeRes = await fetch(
      `${GRAPH_BASE}/${creativeId}?fields=object_story_spec&access_token=${encodeURIComponent(token)}`
    );
    const creativeJson = (await creativeRes.json()) as {
      object_story_spec?: Record<string, unknown>;
      error?: { message: string };
    };
    if (creativeJson.error || !creativeJson.object_story_spec) {
      return NextResponse.json({
        name: adJson.name ?? "",
        link: "https://www.facebook.com",
        message: "",
        title: "",
        call_to_action: "LEARN_MORE",
        page_id: "",
        adset_id: adJson.adset_id ?? "",
        account_id: adJson.account_id,
      });
    }

    const parsed = parseCreativeSpec(creativeJson.object_story_spec as Record<string, unknown>);
    return NextResponse.json({
      name: adJson.name ?? "",
      link: parsed.link,
      message: parsed.message,
      title: parsed.title,
      call_to_action: parsed.call_to_action,
      page_id: parsed.page_id,
      adset_id: adJson.adset_id ?? "",
      account_id: adJson.account_id,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro ao buscar anúncio" }, { status: 500 });
  }
}
