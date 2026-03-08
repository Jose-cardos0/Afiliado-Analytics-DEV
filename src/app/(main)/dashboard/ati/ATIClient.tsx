"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  TrendingUp,
  AlertCircle,
  Rocket,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Link2,
  DollarSign,
  Wallet,
  BarChart3,
  ShoppingBag,
  Target,
  MousePointerClick,
  Search,
  CheckCircle,
} from "lucide-react";
import type { ATICreativeRow } from "@/lib/ati/types";
import type { MetricLevel } from "@/lib/ati/types";
import LoadingOverlay from "@/app/components/ui/LoadingOverlay";

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Monta o link final com utm_content=adId, substituindo qualquer utm_content já existente. */
function buildLinkWithUtmContent(baseLink: string, adId: string): string {
  const trimmed = baseLink.trim();
  if (!trimmed || !adId) return trimmed;
  try {
    const url = new URL(trimmed);
    url.searchParams.set("utm_content", adId);
    return url.toString();
  } catch {
    return trimmed.includes("?") ? `${trimmed}&utm_content=${adId}` : `${trimmed}?utm_content=${adId}`;
  }
}

type Grouped = { campaignId: string; campaignName: string; adSets: { adSetId: string; adSetName: string; ads: ATICreativeRow[] }[] }[];

function groupByCampaignAndAdSet(creatives: ATICreativeRow[]): Grouped {
  const byCampaign = new Map<string, { campaignName: string; byAdSet: Map<string, { adSetName: string; ads: ATICreativeRow[] }> }>();
  for (const row of creatives) {
    let camp = byCampaign.get(row.campaignId);
    if (!camp) {
      camp = { campaignName: row.campaignName, byAdSet: new Map() };
      byCampaign.set(row.campaignId, camp);
    }
    let set = camp.byAdSet.get(row.adSetId);
    if (!set) {
      set = { adSetName: row.adSetName, ads: [] };
      camp.byAdSet.set(row.adSetId, set);
    }
    set.ads.push(row);
  }
  return Array.from(byCampaign.entries()).map(([campaignId, { campaignName, byAdSet }]) => ({
    campaignId,
    campaignName,
    adSets: Array.from(byAdSet.entries()).map(([adSetId, { adSetName, ads }]) => ({ adSetId, adSetName, ads })),
  }));
}

function StatusBadge({ status }: { status: ATICreativeRow["status"] }) {
  if (status === "excellent") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        Criativo Excelente (Pronto para Escala)
      </span>
    );
  }
  if (status === "bad") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 text-red-400 px-2.5 py-0.5 text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        Criativo Ruim
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-dark-border/50 text-text-secondary px-2.5 py-0.5 text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-text-secondary" />
        Aguardando dados
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 text-amber-400 px-2.5 py-0.5 text-xs font-semibold">
      <span className="w-2 h-2 rounded-full bg-amber-500" />
      Criativo Bom
    </span>
  );
}

function AdAccordionItem({
  row,
  dateLabel,
  expandedId,
  onToggle,
  onValidate,
  validatingId,
  onOpenLinkModal,
  hasExistingLink,
  onExpandedFetchLink,
}: {
  row: ATICreativeRow;
  dateLabel: string;
  expandedId: string | null;
  onToggle: (id: string) => void;
  onValidate: (r: ATICreativeRow) => void;
  validatingId: string | null;
  onOpenLinkModal: (r: ATICreativeRow) => void;
  hasExistingLink: boolean | undefined;
  onExpandedFetchLink: (r: ATICreativeRow) => void;
}) {
  const isOpen = expandedId === row.adId;

  useEffect(() => {
    if (isOpen && row) onExpandedFetchLink(row);
  }, [isOpen, row.adId]);

  const profit = row.commission - row.cost;
  const isProfitPositive = profit >= 0;

  return (
    <div className="rounded-lg border border-dark-border bg-dark-card overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(row.adId)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-dark-bg/40 transition-colors cursor-pointer"
      >
        <span className="font-medium text-text-primary truncate">{row.adName}</span>
        <span className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={row.status} />
          {isOpen ? <ChevronUp className="h-4 w-4 text-text-secondary" /> : <ChevronDown className="h-4 w-4 text-text-secondary" />}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-dark-border bg-dark-bg/30 p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenLinkModal(row)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold hover:opacity-90 ${
                hasExistingLink === true
                  ? "bg-emerald-600 text-white"
                  : "bg-shopee-orange text-white"
              }`}
            >
              {hasExistingLink === true ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  Editado com Sucesso
                </>
              ) : (
                <>
                  <Link2 className="h-3.5 w-3.5" />
                  Gerar link de anúncio
                </>
              )}
            </button>
          </div>
          {/* Cards de resumo (estilo print) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <div className="rounded-lg bg-dark-card border border-dark-border p-3">
              <div className="flex items-center gap-2 text-text-secondary text-xs mb-0.5">
                <DollarSign className="h-3.5 w-3.5" />
                Custo Total
              </div>
              <p className="text-red-400 font-bold text-sm">{formatBRL(row.cost)}</p>
            </div>
            <div className="rounded-lg bg-dark-card border border-dark-border p-3">
              <div className="flex items-center gap-2 text-text-secondary text-xs mb-0.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Receita Total
              </div>
              <p className="text-emerald-400 font-bold text-sm">{formatBRL(row.revenue)}</p>
            </div>
            <div className="rounded-lg bg-dark-card border border-dark-border p-3">
              <div className="flex items-center gap-2 text-text-secondary text-xs mb-0.5">
                <Wallet className="h-3.5 w-3.5" />
                Lucro
              </div>
              <p className={`font-bold text-sm ${isProfitPositive ? "text-emerald-400" : "text-red-400"}`}>
                {formatBRL(profit)}
              </p>
              <p className="text-[10px] text-text-secondary">{isProfitPositive ? "Lucro" : "Prejuízo"}</p>
            </div>
            <div className="rounded-lg bg-dark-card border border-dark-border p-3">
              <div className="flex items-center gap-2 text-text-secondary text-xs mb-0.5">
                <BarChart3 className="h-3.5 w-3.5" />
                ROAS
              </div>
              <p className="text-text-primary font-bold text-sm">{row.roas.toFixed(2)}</p>
              <p className="text-[10px] text-text-secondary">Retorno sobre gasto</p>
            </div>
            <div className="rounded-lg bg-dark-card border border-dark-border p-3">
              <div className="flex items-center gap-2 text-text-secondary text-xs mb-0.5">
                <ShoppingBag className="h-3.5 w-3.5" />
                Pedidos
              </div>
              <p className="text-text-primary font-bold text-sm">{row.orders}</p>
            </div>
            <div className="rounded-lg bg-dark-card border border-dark-border p-3">
              <div className="flex items-center gap-2 text-text-secondary text-xs mb-0.5">
                <Target className="h-3.5 w-3.5" />
                CPA Médio
              </div>
              <p className="text-text-primary font-bold text-sm">{formatBRL(row.cpa)}</p>
            </div>
            <div className="rounded-lg bg-dark-card border border-dark-border p-3">
              <div className="flex items-center gap-2 text-text-secondary text-xs mb-0.5">
                <MousePointerClick className="h-3.5 w-3.5" />
                Cliques Shopee
              </div>
              <p className="text-text-primary font-bold text-sm">{row.clicksShopee || row.clicksMeta}</p>
            </div>
          </div>

          {/* Tabela Histórico Diário (uma linha = período) */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-2">Histórico do período</h4>
            <div className="overflow-x-auto rounded-lg border border-dark-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-dark-card border-b border-dark-border text-text-secondary">
                    <th className="text-left py-2 px-3 font-semibold">Período</th>
                    <th className="text-right py-2 px-2 font-semibold">Custo Tráfego</th>
                    <th className="text-right py-2 px-2 font-semibold">Cliques Meta</th>
                    <th className="text-right py-2 px-2 font-semibold">CPC Meta (R$)</th>
                    <th className="text-right py-2 px-2 font-semibold">CTR</th>
                    <th className="text-right py-2 px-2 font-semibold">Cliques Shopee</th>
                    <th className="text-right py-2 px-2 font-semibold">Pedidos</th>
                    <th className="text-right py-2 px-2 font-semibold">CPA (R$)</th>
                    <th className="text-right py-2 px-2 font-semibold">Receita (R$)</th>
                    <th className="text-right py-2 px-2 font-semibold">Lucro (R$)</th>
                    <th className="text-right py-2 px-2 font-semibold">ROAS</th>
                    <th className="text-right py-2 px-2 font-semibold">EPC (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-dark-bg/50 border-b border-dark-border text-text-primary">
                    <td className="py-2 px-3">{dateLabel}</td>
                    <td className="text-right py-2 px-2 text-red-400">{formatBRL(row.cost)}</td>
                    <td className="text-right py-2 px-2">{row.clicksMeta}</td>
                    <td className="text-right py-2 px-2">{formatBRL(row.cpcMeta)}</td>
                    <td className="text-right py-2 px-2">{row.ctrMeta.toFixed(2)}%</td>
                    <td className="text-right py-2 px-2">{row.clicksShopee || row.clicksMeta}</td>
                    <td className="text-right py-2 px-2">{row.orders}</td>
                    <td className="text-right py-2 px-2">{formatBRL(row.cpa)}</td>
                    <td className="text-right py-2 px-2 text-emerald-400">{formatBRL(row.revenue)}</td>
                    <td className={`text-right py-2 px-2 ${isProfitPositive ? "text-emerald-400" : "text-red-400"}`}>{formatBRL(profit)}</td>
                    <td className="text-right py-2 px-2">{row.roas.toFixed(2)}</td>
                    <td className="text-right py-2 px-2">{formatBRL(row.epc)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Diagnóstico / Aviso abaixo da tabela */}
          {row.diagnosis && (
            <div
              className={`rounded-lg border p-3 text-sm ${
                row.status === "excellent"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                  : row.status === "bad"
                    ? "bg-red-500/10 border-red-500/30 text-red-200"
                    : row.status === "pending"
                      ? "bg-dark-border/20 border-dark-border text-text-secondary"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-200"
              }`}
            >
              <p className="font-semibold mb-0.5">
                {row.status === "excellent" ? "Pronto para escala" : row.status === "bad" ? "Criativo ruim" : row.status === "pending" ? "Aguardando dados" : "Criativo bom"}
              </p>
              <p className="opacity-90">{row.diagnosis}</p>
            </div>
          )}

          {row.canValidate && (
            <button
              onClick={() => onValidate(row)}
              disabled={!!validatingId}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60 transition-colors"
            >
              {validatingId === row.adId ? "Salvando..." : <><Rocket className="h-3.5 w-3.5" /> Adicionar em Criativo Validado</>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ATIClient() {
  const router = useRouter();
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatives, setCreatives] = useState<ATICreativeRow[]>([]);
  const [validated, setValidated] = useState<Array<{ id: string; adId: string; adName: string; campaignId: string; campaignName: string; scaledAt: string }>>([]);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [expandedAdId, setExpandedAdId] = useState<string | null>(null);
  const [filterCampaign, setFilterCampaign] = useState("");
  const [filterAdSet, setFilterAdSet] = useState("");
  const [filterAd, setFilterAd] = useState("");

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkModalAd, setLinkModalAd] = useState<ATICreativeRow | null>(null);
  const [linkModalAdId, setLinkModalAdId] = useState("");
  const [linkModalShopeeLink, setLinkModalShopeeLink] = useState("");
  const [linkModalPublishing, setLinkModalPublishing] = useState(false);
  const [linkModalError, setLinkModalError] = useState<string | null>(null);
  const [linkModalErrorDetail, setLinkModalErrorDetail] = useState<string | null>(null);
  const [linkModalTitle, setLinkModalTitle] = useState<"Gerar link de anúncio" | "Editar link de anúncio">("Gerar link de anúncio");
  const [linkModalLoadingLink, setLinkModalLoadingLink] = useState(false);
  const [adIdToHasLink, setAdIdToHasLink] = useState<Record<string, boolean>>({});
  const [campaignStatus, setCampaignStatus] = useState<Record<string, string>>({});
  const [campaignTogglingId, setCampaignTogglingId] = useState<string | null>(null);
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>({});
  const [expandedAdSets, setExpandedAdSets] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ati/data?start=${start}&end=${end}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao carregar");
      setCreatives(json.creatives ?? []);
      setValidated(json.validated ?? []);
      setCampaignStatus((json.campaignStatus as Record<string, string>) ?? {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
      setCreatives([]);
      setValidated([]);
      setCampaignStatus({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [start, end]);

  const handleValidate = async (row: ATICreativeRow) => {
    setValidatingId(row.adId);
    try {
      const res = await fetch("/api/ati/validated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad_id: row.adId,
          ad_name: row.adName,
          campaign_id: row.campaignId,
          campaign_name: row.campaignName,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao adicionar");
    } finally {
      setValidatingId(null);
    }
  };

  const handleRemoveValidated = async (id: string) => {
    try {
      const res = await fetch(`/api/ati/validated?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    }
  };

  const handleCampaignStatusToggle = async (campaignId: string) => {
    const current = campaignStatus[campaignId];
    const isActive = current === "ACTIVE";
    const nextStatus = isActive ? "PAUSED" : "ACTIVE";
    setCampaignTogglingId(campaignId);
    try {
      const res = await fetch("/api/meta/campaigns/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId, status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao atualizar campanha");
      setCampaignStatus((prev) => ({ ...prev, [campaignId]: nextStatus }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao alterar status");
    } finally {
      setCampaignTogglingId(null);
    }
  };

  const toggleCampaign = (campaignId: string) => {
    setExpandedCampaigns((prev) => ({ ...prev, [campaignId]: !prev[campaignId] }));
  };
  const toggleAdSet = (adSetId: string) => {
    setExpandedAdSets((prev) => ({ ...prev, [adSetId]: !prev[adSetId] }));
  };

  const handleExpandedFetchLink = (row: ATICreativeRow) => {
    if (adIdToHasLink[row.adId] !== undefined) return;
    fetch(`/api/meta/ads/current-link?ad_id=${encodeURIComponent(row.adId)}`)
      .then((r) => r.json())
      .then((json: { link?: string | null }) => {
        setAdIdToHasLink((prev) => ({ ...prev, [row.adId]: Boolean(json?.link) }));
      })
      .catch(() => {});
  };

  const handleOpenLinkModal = (row: ATICreativeRow) => {
    setLinkModalAd(row);
    setLinkModalAdId(row.adId);
    setLinkModalShopeeLink("");
    setLinkModalError(null);
    setLinkModalErrorDetail(null);
    setLinkModalTitle("Gerar link de anúncio");
    setLinkModalOpen(true);
    setLinkModalLoadingLink(true);
    fetch(`/api/meta/ads/current-link?ad_id=${encodeURIComponent(row.adId)}`)
      .then((r) => r.json())
      .then((json: { link?: string | null }) => {
        const hasLink = Boolean(json?.link);
        setLinkModalTitle(hasLink ? "Editar link de anúncio" : "Gerar link de anúncio");
        if (json?.link) setLinkModalShopeeLink(json.link);
        setAdIdToHasLink((prev) => ({ ...prev, [row.adId]: hasLink }));
      })
      .catch(() => {})
      .finally(() => setLinkModalLoadingLink(false));
  };

  const filteredAndGrouped = useMemo(() => {
    const lowerCamp = filterCampaign.trim().toLowerCase();
    const lowerSet = filterAdSet.trim().toLowerCase();
    const lowerAd = filterAd.trim().toLowerCase();
    let list = creatives;
    if (lowerCamp) list = list.filter((c) => c.campaignName.toLowerCase().includes(lowerCamp));
    if (lowerSet) list = list.filter((c) => c.adSetName.toLowerCase().includes(lowerSet));
    if (lowerAd) list = list.filter((c) => c.adName.toLowerCase().includes(lowerAd));
    return groupByCampaignAndAdSet(list);
  }, [creatives, filterCampaign, filterAdSet, filterAd]);

  const dateLabel = `${new Date(start).toLocaleDateString("pt-BR")} a ${new Date(end).toLocaleDateString("pt-BR")}`;

  return (
    <>
      {loading && <LoadingOverlay message="Carregando dados Meta e Shopee..." />}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-text-primary font-heading whitespace-nowrap">
          Advanced Traffic Intelligence (ATI)
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-text-secondary" />
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="rounded-md border border-dark-border bg-dark-bg py-1.5 px-2 text-text-primary text-sm"
            />
            <span className="text-text-secondary">até</span>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="rounded-md border border-dark-border bg-dark-bg py-1.5 px-2 text-text-primary text-sm"
            />
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-md bg-shopee-orange px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            Atualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-500/30 bg-red-500/10 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">{error}</p>
            <p className="text-xs text-text-secondary mt-1">
              Confirme que o token do Meta e as chaves da Shopee estão configurados.{" "}
              <button type="button" onClick={() => router.push("/configuracoes")} className="text-shopee-orange hover:underline font-semibold">
                Abrir Configurações →
              </button>
            </p>
          </div>
        </div>
      )}

      {validated.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary font-heading mb-3 flex items-center gap-2">
            <Rocket className="h-5 w-5 text-emerald-500" />
            Criativos Validados (Escala)
          </h2>
          <p className="text-sm text-text-secondary mb-3">
            Aguarde pelo menos 3 dias após aumentar o orçamento para o Meta estabilizar. Não mexa no orçamento durante esse período.
          </p>
          <ul className="space-y-2">
            {validated.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-4 py-2 px-3 rounded-md bg-dark-card border border-dark-border">
                <div>
                  <p className="text-sm font-medium text-text-primary">{v.adName}</p>
                  <p className="text-xs text-text-secondary">{v.campaignName} · Escalado em {new Date(v.scaledAt).toLocaleDateString("pt-BR")}</p>
                </div>
                <button onClick={() => handleRemoveValidated(v.id)} className="text-xs text-red-400 hover:text-red-300">Remover</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-text-primary font-heading mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-shopee-orange" />
          Análise por Criativo
        </h2>

        {/* Filtros */}
        {creatives.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Search className="h-4 w-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Filtrar por campanha"
              value={filterCampaign}
              onChange={(e) => setFilterCampaign(e.target.value)}
              className="rounded-md border border-dark-border bg-dark-bg py-1.5 px-3 text-text-primary text-sm placeholder-text-secondary/60 w-44"
            />
            <input
              type="text"
              placeholder="Filtrar por conjunto"
              value={filterAdSet}
              onChange={(e) => setFilterAdSet(e.target.value)}
              className="rounded-md border border-dark-border bg-dark-bg py-1.5 px-3 text-text-primary text-sm placeholder-text-secondary/60 w-44"
            />
            <input
              type="text"
              placeholder="Filtrar por anúncio"
              value={filterAd}
              onChange={(e) => setFilterAd(e.target.value)}
              className="rounded-md border border-dark-border bg-dark-bg py-1.5 px-3 text-text-primary text-sm placeholder-text-secondary/60 w-44"
            />
          </div>
        )}

        {/* Tutorial */}
        <div className="mb-6 rounded-lg border border-dark-border bg-dark-card overflow-hidden">
          <button
            type="button"
            onClick={() => setHelpOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-dark-bg/50 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <HelpCircle className="h-4 w-4 text-shopee-orange" />
              Como cruzar Meta + Shopee e ver ROAS por criativo
            </span>
            {helpOpen ? <ChevronUp className="h-4 w-4 text-text-secondary" /> : <ChevronDown className="h-4 w-4 text-text-secondary" />}
          </button>
          {helpOpen && (
            <div className="px-4 pb-4 pt-0 border-t border-dark-border space-y-4 text-sm text-text-secondary">
              <div>
                <h3 className="text-text-primary font-semibold mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-shopee-orange" /> O que é o ad_id?
                </h3>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>Não é seu ID de afiliado.</li>
                  <li>Não é o nome da campanha que você digita.</li>
                  <li>É um número que o Meta gera para cada anúncio. Cada anúncio tem um ad_id único.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-text-primary font-semibold mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-shopee-orange" /> O que fazer
                </h3>
                <p className="text-text-primary bg-dark-bg/80 rounded-md p-3 border-l-2 border-shopee-orange">
                  Coloque o ad_id no link de destino do anúncio (link da Shopee) como Sub-ID, ex.: <code className="bg-dark-bg px-1 rounded">?utm_content=AD_ID</code>.
                </p>
              </div>
              <div>
                <h3 className="text-text-primary font-semibold mb-2 flex items-center gap-1.5"><Link2 className="h-4 w-4 text-shopee-orange" /> Passo a passo</h3>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Crie o anúncio no Meta. Abra o anúncio e veja na URL: <code className="bg-dark-bg px-1 rounded">selected_ad_ids=NUMERO</code>.</li>
                  <li>Use esse número no link da Shopee: <code className="bg-dark-bg px-1 rounded">https://shope.ee/...?utm_content=NUMERO</code>.</li>
                  <li>Salve o anúncio. As vendas com esse Sub-ID serão cruzadas no ATI.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {creatives.length === 0 && !loading ? (
          <div className="bg-dark-card border border-dark-border rounded-lg p-8 text-center text-text-secondary">
            <p>Nenhum dado no período ou integrações não configuradas.</p>
            <p className="text-sm mt-2">
              Use o mesmo Sub-ID nos seus links do Meta que o <code className="bg-dark-bg px-1 rounded">ad_id</code> do anúncio para cruzar com as vendas da Shopee.
            </p>
            <button
              type="button"
              onClick={() => router.push("/configuracoes")}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-md bg-shopee-orange text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Settings className="h-4 w-4" /> Configurar Meta e Shopee
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAndGrouped.map((camp) => {
              const campaignOpen = expandedCampaigns[camp.campaignId];
              return (
                <div key={camp.campaignId} className="rounded-xl border border-dark-border bg-dark-card overflow-hidden">
                  <div className="px-4 py-3 bg-dark-bg/50 border-b border-dark-border flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggleCampaign(camp.campaignId)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      {campaignOpen ? (
                        <ChevronUp className="h-5 w-5 flex-shrink-0 text-text-secondary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 flex-shrink-0 text-text-secondary" />
                      )}
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-text-primary font-heading truncate">{camp.campaignName}</h3>
                        <p className="text-xs text-text-secondary mt-0.5">Campanha</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={campaignStatus[camp.campaignId] === "ACTIVE"}
                      disabled={campaignTogglingId === camp.campaignId}
                      onClick={(e) => { e.stopPropagation(); handleCampaignStatusToggle(camp.campaignId); }}
                      title={campaignStatus[camp.campaignId] === "ACTIVE" ? "Pausar campanha no Facebook" : "Ativar campanha no Facebook"}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-shopee-orange focus:ring-offset-2 focus:ring-offset-dark-card disabled:opacity-50 ${
                        campaignStatus[camp.campaignId] === "ACTIVE" ? "bg-emerald-500" : "bg-dark-border"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition ${
                          campaignStatus[camp.campaignId] === "ACTIVE" ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                  {campaignOpen && (
                    <div className="border-t border-dark-border">
                      {camp.adSets.map((set) => {
                        const adSetOpen = expandedAdSets[set.adSetId];
                        return (
                          <div key={set.adSetId} className="border-b border-dark-border/50 last:border-b-0">
                            <button
                              type="button"
                              onClick={() => toggleAdSet(set.adSetId)}
                              className="w-full flex items-center gap-2 px-4 py-2.5 pl-6 text-left hover:bg-dark-bg/40 transition-colors border-l-2 border-shopee-orange cursor-pointer"
                            >
                              {adSetOpen ? (
                                <ChevronUp className="h-4 w-4 flex-shrink-0 text-text-secondary" />
                              ) : (
                                <ChevronDown className="h-4 w-4 flex-shrink-0 text-text-secondary" />
                              )}
                              <div className="min-w-0">
                                <span className="text-sm font-semibold text-text-primary block truncate">{set.adSetName}</span>
                                <span className="text-xs text-text-secondary">Conjunto de anúncios</span>
                              </div>
                            </button>
                            {adSetOpen && (
                              <div className="bg-dark-bg/20 pl-6 pr-4 py-3 space-y-2">
                                {set.ads.map((row) => (
                                  <AdAccordionItem
                                    key={row.adId}
                                    row={row}
                                    dateLabel={dateLabel}
                                    expandedId={expandedAdId}
                                    onToggle={(id) => setExpandedAdId((prev) => (prev === id ? null : id))}
                                    onValidate={handleValidate}
                                    validatingId={validatingId}
                                    onOpenLinkModal={handleOpenLinkModal}
                                    hasExistingLink={adIdToHasLink[row.adId]}
                                    onExpandedFetchLink={handleExpandedFetchLink}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredAndGrouped.length === 0 && creatives.length > 0 && (
              <p className="text-center text-text-secondary py-6">Nenhum resultado para os filtros informados.</p>
            )}
          </div>
        )}
      </section>

      {linkModalOpen && linkModalAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setLinkModalOpen(false)}>
          <div className="bg-dark-card border border-dark-border rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-primary">{linkModalLoadingLink ? "Link de anúncio" : linkModalTitle}</h3>
            {linkModalAdId && adIdToHasLink[linkModalAdId] === true && (
              <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
                <p className="text-sm font-medium text-amber-200">
                  ATENÇÃO: Ao editar o link do anúncio, você perderá todos os dados do anúncio atual e iniciará um novo. Aconselhamos que crie um novo AD ao invés de alterar este!
                </p>
              </div>
            )}
            <p className="text-sm text-text-secondary">
              Anúncio: <strong className="text-text-primary">{linkModalAd.adName}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Seu link da Shopee</label>
              <input type="url" value={linkModalShopeeLink} onChange={(e) => setLinkModalShopeeLink(e.target.value)} placeholder="https://s.shopee.com.br/60MfL7egOy" className="w-full rounded-md border border-dark-border bg-dark-bg py-2 px-3 text-text-primary text-sm placeholder-text-secondary/60" />
            </div>
            <p className="text-xs text-text-secondary">
              Ao clicar em publicar, vamos ativar sua campanha com seu link de vendas da shopee e o ATI iniciará.
            </p>
            {linkModalError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 space-y-1">
                <p className="text-sm font-medium text-red-400">{linkModalError}</p>
                {linkModalErrorDetail && <p className="text-xs text-red-300/90">{linkModalErrorDetail}</p>}
                <p className="text-xs text-text-secondary mt-1">Abra o Console do navegador (F12 → Console) para ver o objeto completo do erro.</p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setLinkModalOpen(false)} className="rounded-md border border-dark-border py-2 px-4 text-sm font-medium text-text-secondary hover:bg-dark-bg">Cancelar</button>
              <button
                type="button"
                disabled={!linkModalAdId || !linkModalShopeeLink.trim() || linkModalPublishing}
                onClick={async () => {
                  const finalLink = buildLinkWithUtmContent(linkModalShopeeLink, linkModalAdId);
                  setLinkModalPublishing(true);
                  setLinkModalError(null);
                  setLinkModalErrorDetail(null);
                  try {
                    const res = await fetch("/api/meta/ads/update-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ad_id: linkModalAdId, link: finalLink }) });
                    const json = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      const step = json?.step ? ` [etapa: ${json.step}]` : "";
                      const errMsg = json?.error ?? "Erro ao atualizar";
                      const fullMsg = `${errMsg}${step}`;
                      const metaErr = json?.meta_error;
                      const detail = metaErr?.message || metaErr?.error_user_msg
                        ? `Meta: ${metaErr.error_user_msg || metaErr.message}${metaErr.code != null ? ` (código ${metaErr.code})` : ""}`
                        : null;
                      console.error("[ATI] update-link falhou:", { status: res.status, step: json?.step, error: json?.error, meta_error: json?.meta_error, full: json });
                      setLinkModalError(fullMsg);
                      if (detail) setLinkModalErrorDetail(detail);
                      return;
                    }
                    setLinkModalOpen(false);
                    setLinkModalAd(null);
                    setLinkModalShopeeLink("");
                    setAdIdToHasLink((prev) => ({ ...prev, [linkModalAdId]: true }));
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : "Erro ao publicar";
                    console.error("[ATI] update-link exceção:", e);
                    setLinkModalError(msg);
                  } finally {
                    setLinkModalPublishing(false);
                  }
                }}
                className="flex items-center gap-2 rounded-md bg-shopee-orange py-2 px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {linkModalPublishing ? "Publicando…" : "PUBLICAR"}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
