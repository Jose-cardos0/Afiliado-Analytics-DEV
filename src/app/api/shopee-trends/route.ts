/**
 * Devolve a snapshot atual de tendências Shopee + sparklines de 24h.
 *
 *   GET /api/shopee-trends?sort=score|sales|commission&limit=50
 *
 * Resposta:
 *   {
 *     fetchedAt: ISO string,
 *     stagnant: boolean,    // true quando o snapshot está há >15min sem update
 *     products: Array<{
 *       itemId, productName, imageUrl, price, priceMin, priceMax,
 *       sales, commissionRate, ratingStar, productLink,
 *       shopName, categoryIds, score, isViral, rankPosition,
 *       sparkline: number[] (até 24 pontos de sales nas últimas 24h)
 *     }>,
 *     stats: { total, viralCount, avgScore }
 *   }
 *
 * Os links afiliados não são gerados aqui (custaria 1 chamada Shopee por
 * produto × usuário × refresh — inviável). A conversão acontece em
 * `POST /api/shopee-trends/affiliate-link` quando o usuário clica.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type SortKey = "score" | "sales" | "commission";

type SnapshotRow = {
  item_id: number;
  product_name: string;
  image_url: string | null;
  price: number | string | null;
  price_min: number | string | null;
  price_max: number | string | null;
  sales: number;
  commission_rate: number | string | null;
  rating_star: number | string | null;
  product_link: string | null;
  shop_name: string | null;
  category_ids: number[] | null;
  viralization_score: number | null;
  rank_position: number | null;
  is_viral: boolean;
  fetched_at: string;
};

type ObservationRow = {
  item_id: number;
  observed_at: string;
  sales: number;
};

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const url = new URL(req.url);
    const sortRaw = url.searchParams.get("sort") ?? "score";
    const sort: SortKey = sortRaw === "sales" || sortRaw === "commission" ? sortRaw : "score";
    const limit = Math.max(10, Math.min(100, Number(url.searchParams.get("limit") ?? 50)));

    const orderColumn =
      sort === "sales" ? "sales" : sort === "commission" ? "commission_rate" : "viralization_score";

    const { data: snapshot, error: snapErr } = await supabase
      .from("shopee_trend_snapshots")
      .select(
        "item_id, product_name, image_url, price, price_min, price_max, sales, commission_rate, rating_star, product_link, shop_name, category_ids, viralization_score, rank_position, is_viral, fetched_at",
      )
      .order(orderColumn, { ascending: false, nullsFirst: false })
      .limit(limit);

    if (snapErr) return NextResponse.json({ error: snapErr.message }, { status: 500 });
    if (!snapshot || snapshot.length === 0) {
      return NextResponse.json({
        fetchedAt: null,
        stagnant: true,
        products: [],
        stats: { total: 0, viralCount: 0, avgScore: 0 },
      });
    }

    const itemIds = (snapshot as SnapshotRow[]).map((r) => r.item_id);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: observations } = await supabase
      .from("shopee_trend_observations")
      .select("item_id, observed_at, sales")
      .in("item_id", itemIds)
      .gte("observed_at", since)
      .order("observed_at", { ascending: true });

    const sparkByItem = new Map<number, number[]>();
    for (const obs of (observations ?? []) as ObservationRow[]) {
      const arr = sparkByItem.get(obs.item_id) ?? [];
      arr.push(obs.sales);
      sparkByItem.set(obs.item_id, arr);
    }

    const fetchedAt = (snapshot as SnapshotRow[])[0]?.fetched_at ?? null;
    // Cron roda 1x/hora — consideramos "parado" só se passou >1h30 sem update
    // (margem pra cron atrasado em pico de carga da Vercel).
    const stagnantThreshold = 90 * 60 * 1000;
    const stagnant = fetchedAt
      ? Date.now() - new Date(fetchedAt).getTime() > stagnantThreshold
      : true;

    const products = (snapshot as SnapshotRow[]).map((r) => ({
      itemId: r.item_id,
      productName: r.product_name,
      imageUrl: r.image_url,
      price: num(r.price),
      priceMin: num(r.price_min),
      priceMax: num(r.price_max),
      sales: r.sales,
      commissionRate: num(r.commission_rate),
      ratingStar: num(r.rating_star),
      productLink: r.product_link,
      shopName: r.shop_name,
      categoryIds: r.category_ids ?? [],
      score: r.viralization_score ?? 0,
      isViral: r.is_viral,
      rankPosition: r.rank_position,
      sparkline: sparkByItem.get(r.item_id) ?? [r.sales],
    }));

    const totalScore = products.reduce((acc, p) => acc + p.score, 0);
    const stats = {
      total: products.length,
      viralCount: products.filter((p) => p.isViral).length,
      avgScore: products.length > 0 ? Math.round(totalScore / products.length) : 0,
    };

    return NextResponse.json({ fetchedAt, stagnant, products, stats });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao listar tendências";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
