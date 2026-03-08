/**
 * Busca insights do Meta Ads (campanhas, conjuntos, anúncios) para o período.
 * Inclui TODOS os anúncios da conta (rascunho, pausados, inativos), com métricas zeradas quando não há entrega no período.
 * Ordena pelos mais recentes primeiro.
 * GET /api/meta/insights?start=YYYY-MM-DD&end=YYYY-MM-DD
 */

import { NextResponse } from "next/server";
import { createClient } from "../../../../../utils/supabase/server";

const GRAPH_BASE = "https://graph.facebook.com/v21.0";

export type MetaAdInsight = {
  ad_id: string;
  ad_name: string;
  adset_id: string;
  adset_name: string;
  campaign_id: string;
  campaign_name: string;
  spend: number;
  clicks: number;
  impressions: number;
  ctr: number;
  cpc: number;
};

type AdFromApi = {
  id: string;
  name?: string;
  adset_id?: string;
  campaign_id?: string;
  created_time?: string;
  adset?: { name?: string };
  campaign?: { name?: string };
};

async function getAdAccounts(accessToken: string): Promise<{ id: string; name: string }[]> {
  const url = `${GRAPH_BASE}/me/adaccounts?fields=id,name&access_token=${encodeURIComponent(accessToken)}`;
  const res = await fetch(url);
  const json = (await res.json()) as { data?: { id: string; name: string }[]; error?: { message: string } };
  if (json.error) throw new Error(json.error.message || "Meta API error");
  return json.data ?? [];
}

async function getInsights(
  accessToken: string,
  adAccountId: string,
  since: string,
  until: string
): Promise<MetaAdInsight[]> {
  const fields = "ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,spend,clicks,impressions,ctr,cpc";
  const params = new URLSearchParams({
    access_token: accessToken,
    fields,
    level: "ad",
    "time_range[since]": since,
    "time_range[until]": until,
  });
  const url = `${GRAPH_BASE}/${adAccountId}/insights?${params.toString()}`;
  const res = await fetch(url);
  const json = (await res.json()) as {
    data?: Array<Record<string, string | undefined>>;
    paging?: { next?: string };
    error?: { message: string };
  };
  if (json.error) throw new Error(json.error.message || "Meta API error");

  const out: MetaAdInsight[] = [];
  let data = json.data ?? [];
  let nextUrl: string | null = json.paging?.next ?? null;
  while (data.length > 0 || nextUrl) {
    for (const row of data) {
      const spend = parseFloat(row.spend ?? "0") || 0;
      const clicks = parseInt(row.clicks ?? "0", 10) || 0;
      const impressions = parseInt(row.impressions ?? "0", 10) || 0;
      const ctr = parseFloat(row.ctr ?? "0") || 0;
      const cpc = parseFloat(row.cpc ?? "0") || (clicks > 0 ? spend / clicks : 0);
      out.push({
        ad_id: String(row.ad_id ?? ""),
        ad_name: String(row.ad_name ?? row.ad_id ?? "Sem nome"),
        adset_id: String(row.adset_id ?? ""),
        adset_name: String(row.adset_name ?? row.adset_id ?? ""),
        campaign_id: String(row.campaign_id ?? ""),
        campaign_name: String(row.campaign_name ?? row.campaign_id ?? ""),
        spend,
        clicks,
        impressions,
        ctr,
        cpc,
      });
    }
    if (!nextUrl) break;
    const nextRes = await fetch(nextUrl);
    const nextJson = (await nextRes.json()) as {
      data?: Array<Record<string, string | undefined>>;
      paging?: { next?: string };
    };
    data = nextJson.data ?? [];
    nextUrl = nextJson.paging?.next ?? null;
  }
  return out;
}

/** Lista todos os ads da conta (qualquer status), para aparecer no ATI mesmo sem entrega no período. */
async function getAllAds(accessToken: string, adAccountId: string): Promise<AdFromApi[]> {
  const fields = "id,name,adset_id,campaign_id,created_time,adset{name},campaign{name}";
  const params = new URLSearchParams({
    access_token: accessToken,
    fields,
    limit: "500",
  });
  const url = `${GRAPH_BASE}/${adAccountId}/ads?${params.toString()}`;
  const res = await fetch(url);
  const json = (await res.json()) as {
    data?: AdFromApi[];
    paging?: { next?: string };
    error?: { message: string };
  };
  if (json.error) throw new Error(json.error.message || "Meta API error");

  const out: AdFromApi[] = [];
  let data = json.data ?? [];
  let nextUrl: string | null = json.paging?.next ?? null;
  while (data.length > 0 || nextUrl) {
    out.push(...data);
    if (!nextUrl) break;
    const nextRes = await fetch(nextUrl);
    const nextJson = (await nextRes.json()) as { data?: AdFromApi[]; paging?: { next?: string } };
    data = nextJson.data ?? [];
    nextUrl = nextJson.paging?.next ?? null;
  }
  return out;
}

/** Status das campanhas da conta (effective_status: ACTIVE, PAUSED, etc.). */
async function getCampaignsStatus(accessToken: string, adAccountId: string): Promise<Map<string, string>> {
  const params = new URLSearchParams({
    access_token: accessToken,
    fields: "id,effective_status",
    limit: "500",
  });
  const url = `${GRAPH_BASE}/${adAccountId}/campaigns?${params.toString()}`;
  const res = await fetch(url);
  const json = (await res.json()) as {
    data?: Array<{ id: string; effective_status?: string }>;
    paging?: { next?: string };
    error?: { message: string };
  };
  if (json.error) throw new Error(json.error.message || "Meta API error");
  const out = new Map<string, string>();
  let data = json.data ?? [];
  let nextUrl: string | null = json.paging?.next ?? null;
  while (data.length > 0 || nextUrl) {
    for (const c of data) {
      if (c.id) out.set(c.id, c.effective_status ?? "UNKNOWN");
    }
    if (!nextUrl) break;
    const nextRes = await fetch(nextUrl);
    const nextJson = (await nextRes.json()) as { data?: Array<{ id: string; effective_status?: string }>; paging?: { next?: string } };
    data = nextJson.data ?? [];
    nextUrl = nextJson.paging?.next ?? null;
  }
  return out;
}

function toInsightFromAd(ad: AdFromApi): MetaAdInsight {
  return {
    ad_id: String(ad.id ?? ""),
    ad_name: String(ad.name ?? ad.id ?? "Sem nome"),
    adset_id: String(ad.adset_id ?? ""),
    adset_name: String(ad.adset?.name ?? ad.adset_id ?? ""),
    campaign_id: String(ad.campaign_id ?? ""),
    campaign_name: String(ad.campaign?.name ?? ad.campaign_id ?? ""),
    spend: 0,
    clicks: 0,
    impressions: 0,
    ctr: 0,
    cpc: 0,
  };
}

/** Mapeamento: id do anúncio que está rodando (cópia) -> id exibido no ATI (original). Mescla linhas por display_ad_id. */
function applyMappingAndMerge(rows: MetaAdInsight[], mapping: Map<string, string>): MetaAdInsight[] {
  const byDisplayId = new Map<string, MetaAdInsight>();
  for (const row of rows) {
    const displayId = mapping.get(row.ad_id) ?? row.ad_id;
    const existing = byDisplayId.get(displayId);
    if (existing) {
      existing.spend += row.spend;
      existing.clicks += row.clicks;
      existing.impressions += row.impressions;
      existing.ctr = existing.impressions > 0 ? (existing.clicks / existing.impressions) * 100 : 0;
      existing.cpc = existing.clicks > 0 ? existing.spend / existing.clicks : 0;
    } else {
      byDisplayId.set(displayId, { ...row, ad_id: displayId });
    }
  }
  return Array.from(byDisplayId.values());
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("meta_access_token")
      .eq("id", user.id)
      .single();

    const token = profile?.meta_access_token?.trim();
    if (!token) {
      return NextResponse.json(
        { error: "Token do Meta não configurado. Configure em Configurações." },
        { status: 400 }
      );
    }

    const url = new URL(req.url);
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    if (!start || !end) {
      return NextResponse.json(
        { error: "Parâmetros start e end são obrigatórios (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const accounts = await getAdAccounts(token);
    if (accounts.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma conta de anúncios encontrada para este token." },
        { status: 400 }
      );
    }

    // Por conta: busca insights (métricas do período), ads e status das campanhas
    const allInsights: MetaAdInsight[] = [];
    const campaignStatusMap: Record<string, string> = {};
    for (const account of accounts) {
      const accountId = account.id;
      try {
        const [insights, ads, statusMap] = await Promise.all([
          getInsights(token, accountId, start, end),
          getAllAds(token, accountId),
          getCampaignsStatus(token, accountId),
        ]);
        statusMap.forEach((status, id) => {
          campaignStatusMap[id] = status;
        });
        const insightByAdId = new Map<string, MetaAdInsight>();
        for (const i of insights) insightByAdId.set(i.ad_id, i);
        // Ordena ads por created_time (mais recentes primeiro)
        const sortedAds = [...ads].sort((a, b) => {
          const ta = a.created_time ? new Date(a.created_time).getTime() : 0;
          const tb = b.created_time ? new Date(b.created_time).getTime() : 0;
          return tb - ta;
        });
        for (const ad of sortedAds) {
          const existing = insightByAdId.get(ad.id);
          if (existing) {
            allInsights.push(existing);
          } else {
            allInsights.push(toInsightFromAd(ad));
          }
        }
        // Não incluímos insights de anúncios/campanhas já excluídos no Meta — o app reflete só o que existe na conta.
      } catch (err) {
        continue;
      }
    }

    const { data: mappingRows } = await supabase
      .from("meta_ad_display_mapping")
      .select("delivering_ad_id, display_ad_id")
      .eq("user_id", user.id);
    const mapping = new Map<string, string>();
    if (mappingRows) {
      for (const r of mappingRows) {
        mapping.set(String(r.delivering_ad_id), String(r.display_ad_id));
      }
    }
    const mergedInsights = applyMappingAndMerge(allInsights, mapping);

    return NextResponse.json({
      adAccounts: accounts.map((a) => ({ id: a.id, name: a.name })),
      insights: mergedInsights,
      campaignStatusMap,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao buscar dados do Meta";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
