/**
 * Backfill: recria o Payment Link de um produto Stripe. A Stripe não permite
 * alterar `phone_number_collection` ou `shipping_options` em payment links
 * existentes — então criamos um novo link, arquivamos o antigo e atualizamos a
 * linha no banco. Preço e produto Stripe são reaproveitados; ShippingRates
 * (Correios / Retirar na loja) são recriadas conforme os flags do produto.
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase-server";
import { gateInfoprodutor } from "@/lib/require-entitlements";
import {
  toWhatsAppUrl,
  buildPaymentLinkCustomText,
  buildAfterCompletion,
  formatSenderAddressShort,
  SHIPPING_RATE_DISPLAY_NAMES,
  type SenderSnapshot,
  type DeliveryMode,
} from "@/lib/infoprod/stripe-checkout-copy";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const gate = await gateInfoprodutor();
    if (!gate.allowed) return gate.response;
    const supabase = await createClient();

    const body = await req.json().catch(() => ({}));
    const id = String(body?.id ?? "").trim();
    if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });

    const { data: produto, error: loadError } = await supabase
      .from("produtos_infoprodutor")
      .select("id, user_id, provider, stripe_product_id, stripe_price_id, stripe_payment_link_id, allow_shipping, allow_pickup, shipping_cost")
      .eq("id", id)
      .eq("user_id", gate.userId)
      .maybeSingle();
    if (loadError) return NextResponse.json({ error: loadError.message }, { status: 500 });
    if (!produto) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

    const row = produto as {
      provider: string;
      stripe_product_id: string | null;
      stripe_price_id: string | null;
      stripe_payment_link_id: string | null;
      allow_shipping: boolean | null;
      allow_pickup: boolean | null;
      shipping_cost: number | string | null;
    };
    if (row.provider !== "stripe") {
      return NextResponse.json({ error: "Só produtos Stripe podem ser atualizados." }, { status: 400 });
    }
    if (!row.stripe_price_id) {
      return NextResponse.json({ error: "Produto Stripe sem preço associado." }, { status: 400 });
    }

    const allowShipping = row.allow_shipping !== false; // default true pra produtos antigos
    const allowPickup = row.allow_pickup === true;
    const shippingCost = row.shipping_cost == null ? 0 : Number(row.shipping_cost);

    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "stripe_secret_key, shipping_sender_whatsapp, shipping_sender_street, shipping_sender_number, shipping_sender_complement, shipping_sender_neighborhood, shipping_sender_city, shipping_sender_uf",
      )
      .eq("id", gate.userId)
      .single();
    const profileRow = profile as
      | {
          stripe_secret_key?: string | null;
          shipping_sender_whatsapp?: string | null;
          shipping_sender_street?: string | null;
          shipping_sender_number?: string | null;
          shipping_sender_complement?: string | null;
          shipping_sender_neighborhood?: string | null;
          shipping_sender_city?: string | null;
          shipping_sender_uf?: string | null;
        }
      | null;
    const stripeKey = profileRow?.stripe_secret_key ?? "";
    if (!stripeKey.trim()) {
      return NextResponse.json({ error: "Conta Stripe não conectada." }, { status: 400 });
    }
    const waUrl = toWhatsAppUrl(profileRow?.shipping_sender_whatsapp ?? null);
    const senderSnapshot: SenderSnapshot = {
      street: profileRow?.shipping_sender_street ?? null,
      number: profileRow?.shipping_sender_number ?? null,
      complement: profileRow?.shipping_sender_complement ?? null,
      neighborhood: profileRow?.shipping_sender_neighborhood ?? null,
      city: profileRow?.shipping_sender_city ?? null,
      uf: profileRow?.shipping_sender_uf ?? null,
    };
    const senderAddress = formatSenderAddressShort(senderSnapshot);
    const mode: DeliveryMode = { allowShipping, allowPickup };

    const stripe = new Stripe(stripeKey);

    // Cria ShippingRates novas (cada Payment Link recebe as suas — são imutáveis)
    const shippingRateIds: string[] = [];
    if (allowShipping) {
      const rate = await stripe.shippingRates.create({
        display_name: SHIPPING_RATE_DISPLAY_NAMES.shipping,
        type: "fixed_amount",
        fixed_amount: { amount: Math.round(shippingCost * 100), currency: "brl" },
      });
      shippingRateIds.push(rate.id);
    }
    if (allowPickup) {
      const rate = await stripe.shippingRates.create({
        display_name: SHIPPING_RATE_DISPLAY_NAMES.pickup,
        type: "fixed_amount",
        fixed_amount: { amount: 0, currency: "brl" },
      });
      shippingRateIds.push(rate.id);
    }

    const customText = buildPaymentLinkCustomText(waUrl, mode, senderAddress);
    const afterCompletion = buildAfterCompletion(waUrl, mode, senderAddress);
    const newLink = await stripe.paymentLinks.create({
      line_items: [{ price: row.stripe_price_id, quantity: 1 }],
      ...(allowShipping ? { shipping_address_collection: { allowed_countries: ["BR"] } } : {}),
      phone_number_collection: { enabled: true },
      ...(shippingRateIds.length > 0
        ? { shipping_options: shippingRateIds.map((rateId) => ({ shipping_rate: rateId })) }
        : {}),
      ...(customText ? { custom_text: customText } : {}),
      ...(afterCompletion ? { after_completion: afterCompletion } : {}),
    });

    // Arquiva o antigo (best-effort; pagamentos em andamento não são afetados)
    if (row.stripe_payment_link_id) {
      try {
        await stripe.paymentLinks.update(row.stripe_payment_link_id, { active: false });
      } catch {
        // Segue o fluxo — o cliente pode desativar manualmente no painel se necessário.
      }
    }

    const { data, error } = await supabase
      .from("produtos_infoprodutor")
      .update({
        link: newLink.url,
        stripe_payment_link_id: newLink.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", gate.userId)
      .select("id, link, stripe_payment_link_id")
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Propaga o novo link aos snapshots nas listas (mesmo princípio do PATCH).
    const { error: syncError } = await supabase
      .from("minha_lista_ofertas_info")
      .update({ link: newLink.url })
      .eq("user_id", gate.userId)
      .eq("produto_id", id);
    if (syncError) {
      console.error("[refresh-checkout] falha sync listas:", syncError.message);
    }

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
