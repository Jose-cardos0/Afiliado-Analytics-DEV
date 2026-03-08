import { NextResponse } from "next/server";
import { createClient } from "../../../../../utils/supabase/server";

const GRAPH_BASE = "https://graph.facebook.com/v21.0";

/**
 * Troca um token de curta duração por um de longa duração (~60 dias).
 * Só funciona se o token ainda for válido. Chamada server-side (usa app secret).
 */
async function exchangeForLongLivedToken(shortLivedToken: string): Promise<string | null> {
  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  if (!appId || !appSecret) return null;

  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  });
  const res = await fetch(`${GRAPH_BASE}/oauth/access_token?${params.toString()}`);
  const json = (await res.json()) as { access_token?: string; error?: { message: string } };
  if (json.error || !json.access_token) return null;
  return json.access_token;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("profiles")
    .select("meta_access_token_last4")
    .eq("id", user.id)
    .single();

  if (error) return NextResponse.json({ error: "Failed" }, { status: 500 });

  return NextResponse.json({
    has_token: !!data?.meta_access_token_last4,
    last4: data?.meta_access_token_last4 ?? null,
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  let token = String(body?.meta_access_token ?? "").trim();

  if (!token) {
    return NextResponse.json(
      { error: "Token de acesso do Meta é obrigatório" },
      { status: 400 }
    );
  }

  // Se o app tiver META_APP_ID e META_APP_SECRET, troca por token de 60 dias
  const hasExchangeConfig = !!(process.env.META_APP_ID?.trim() && process.env.META_APP_SECRET?.trim());
  if (hasExchangeConfig) {
    const longLived = await exchangeForLongLivedToken(token);
    if (longLived) {
      token = longLived;
    } else {
      return NextResponse.json(
        {
          error:
            "Não foi possível trocar o token por um de 60 dias. O token pode estar expirado. Gere um token novo no Graph API Explorer (link abaixo), cole aqui e salve novamente.",
        },
        { status: 400 }
      );
    }
  }

  const patch: Record<string, unknown> = {
    meta_access_token: token,
    meta_access_token_last4: token.slice(-4),
  };

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id);

  if (error) {
    const msg = error.message || "Failed";
    const isMissingColumn = /column.*does not exist|undefined column/i.test(msg);
    return NextResponse.json(
      {
        error: isMissingColumn
          ? "As colunas do Meta ainda não existem no banco. Execute a migração no Supabase (SQL em supabase/migrations/20250306_ati_meta_and_validated.sql)."
          : msg,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("profiles")
    .update({
      meta_access_token: null,
      meta_access_token_last4: null,
    })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: "Failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
