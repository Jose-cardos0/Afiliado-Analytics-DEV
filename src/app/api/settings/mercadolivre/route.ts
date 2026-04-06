import { NextResponse } from "next/server";
import { createClient } from "../../../../../utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("profiles")
    .select("mercadolivre_client_id, mercadolivre_client_secret_last4")
    .eq("id", user.id)
    .single();

  if (error) return NextResponse.json({ error: "Failed" }, { status: 500 });

  return NextResponse.json({
    mercadolivre_client_id: data?.mercadolivre_client_id ?? "",
    has_secret: !!data?.mercadolivre_client_secret_last4,
    last4: data?.mercadolivre_client_secret_last4 ?? null,
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const clientId = String(body?.mercadolivre_client_id ?? body?.clientId ?? "").trim();
  const clientSecret = String(body?.mercadolivre_client_secret ?? body?.clientSecret ?? "").trim();

  if (!clientId) {
    return NextResponse.json({ error: "ID do aplicativo (Client ID) é obrigatório" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {
    mercadolivre_client_id: clientId,
  };

  if (clientSecret) {
    patch.mercadolivre_client_secret = clientSecret;
    patch.mercadolivre_client_secret_last4 = clientSecret.slice(-4);
    patch.mercadolivre_client_secret_updated_at = new Date().toISOString();
  }

  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);

  if (error) return NextResponse.json({ error: "Failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("profiles")
    .update({
      mercadolivre_client_id: null,
      mercadolivre_client_secret: null,
      mercadolivre_client_secret_last4: null,
      mercadolivre_client_secret_updated_at: null,
    })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: "Failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
