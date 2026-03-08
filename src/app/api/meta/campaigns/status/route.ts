/**
 * Ativa ou pausa uma campanha no Meta Ads.
 * POST /api/meta/campaigns/status
 * Body: { campaign_id: string, status: "ACTIVE" | "PAUSED" }
 */

import { NextResponse } from "next/server";
import { createClient } from "../../../../../../utils/supabase/server";

const GRAPH_BASE = "https://graph.facebook.com/v21.0";

export async function POST(req: Request) {
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

    const body = await req.json();
    const campaign_id = body?.campaign_id?.trim();
    const status = body?.status?.trim()?.toUpperCase();

    if (!campaign_id || !status) {
      return NextResponse.json(
        { error: "campaign_id e status são obrigatórios." },
        { status: 400 }
      );
    }
    if (status !== "ACTIVE" && status !== "PAUSED") {
      return NextResponse.json(
        { error: "status deve ser ACTIVE ou PAUSED." },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      access_token: token,
      status,
    });
    const res = await fetch(`${GRAPH_BASE}/${campaign_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const json = (await res.json()) as { success?: boolean; error?: { message: string } };
    if (json.error && !json.success) {
      return NextResponse.json(
        { error: json.error?.message ?? "Erro ao atualizar status da campanha.", meta_error: json.error },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao atualizar campanha";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
