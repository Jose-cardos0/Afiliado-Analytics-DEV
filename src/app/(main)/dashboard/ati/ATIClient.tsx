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
  MessageCircle,
  Search,
  CheckCircle,
  Pencil,
  Trash2,
  CopyPlus,
  Plus,
} from "lucide-react";
import type { ATICreativeRow } from "@/lib/ati/types";
import type { MetricLevel } from "@/lib/ati/types";
import { META_CAMPAIGN_OBJECTIVES } from "@/lib/meta-ads-constants";
import LoadingOverlay from "@/app/components/ui/LoadingOverlay";
import MetaAdSetForm from "@/app/components/meta/MetaAdSetForm";
import MetaAdForm from "@/app/components/meta/MetaAdForm";

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

type Grouped = {
  campaignId: string;
  campaignName: string;
  adAccountId?: string;
  adSets: { adSetId: string; adSetName: string; adAccountId?: string; ads: ATICreativeRow[] }[];
}[];

/** Monta árvore campanha -> conjuntos -> anúncios a partir das listas do Meta (inclui conjuntos sem anúncio). */
function buildTree(
  campaignsList: Array<{ id: string; name: string; ad_account_id: string }>,
  adSetList: Array<{ id: string; name: string; campaign_id: string; ad_account_id: string }>,
  creatives: ATICreativeRow[]
): Grouped {
  const byAdSet = new Map<string, ATICreativeRow[]>();
  for (const row of creatives) {
    const list = byAdSet.get(row.adSetId) ?? [];
    list.push(row);
    byAdSet.set(row.adSetId, list);
  }
  return campaignsList.map((camp) => ({
    campaignId: camp.id,
    campaignName: camp.name,
    adAccountId: camp.ad_account_id,
    adSets: adSetList
      .filter((s) => s.campaign_id === camp.id)
      .map((s) => ({
        adSetId: s.id,
        adSetName: s.name,
        adAccountId: s.ad_account_id,
        ads: byAdSet.get(s.id) ?? [],
      })),
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
  onDeleteAd,
  onDuplicateAd,
  adStatus,
  onAdStatusToggle,
  adTogglingId,
  onEditAd,
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
  onDeleteAd: (r: ATICreativeRow) => void;
  onDuplicateAd: (r: ATICreativeRow) => void;
  adStatus?: string;
  onAdStatusToggle?: (adId: string) => void;
  adTogglingId?: string | null;
  onEditAd?: (r: ATICreativeRow) => void;
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
          {adStatus !== undefined && (
            <span className={`text-xs font-medium ${adStatus === "ACTIVE" ? "text-emerald-400" : "text-text-secondary"}`}>
              {adStatus === "ACTIVE" ? "Ativo" : "Desativado"}
            </span>
          )}
          {onAdStatusToggle && (
            <button
              type="button"
              role="switch"
              aria-checked={adStatus === "ACTIVE"}
              disabled={adTogglingId === row.adId}
              onClick={(e) => { e.stopPropagation(); onAdStatusToggle(row.adId); }}
              title={adStatus === "ACTIVE" ? "Pausar anúncio" : "Ativar anúncio"}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-shopee-orange focus:ring-offset-2 focus:ring-offset-dark-card disabled:opacity-50 ${
                adStatus === "ACTIVE" ? "bg-emerald-500 border-transparent" : "bg-dark-border border-gray-600"
              }`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition ${adStatus === "ACTIVE" ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          )}
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
            {onEditAd && (
              <button
                type="button"
                onClick={() => onEditAd(row)}
                className="inline-flex items-center gap-1.5 rounded-md border border-dark-border px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-dark-bg"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar anúncio
              </button>
            )}
            <button
              type="button"
              onClick={() => onDuplicateAd(row)}
              className="inline-flex items-center gap-1.5 rounded-md border border-dark-border px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-shopee-orange/20 hover:border-shopee-orange/50"
            >
              <CopyPlus className="h-3.5 w-3.5" />
              Duplicar
            </button>
            <button
              type="button"
              onClick={() => onDeleteAd(row)}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-500/50 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Deletar
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
  const [campaignsList, setCampaignsList] = useState<Array<{ id: string; name: string; ad_account_id: string }>>([]);
  const [adSetList, setAdSetList] = useState<Array<{ id: string; name: string; campaign_id: string; ad_account_id: string }>>([]);
  const [adSetStatusMap, setAdSetStatusMap] = useState<Record<string, string>>({});
  const [adStatusMap, setAdStatusMap] = useState<Record<string, string>>({});
  const [adSetTogglingId, setAdSetTogglingId] = useState<string | null>(null);
  const [adTogglingId, setAdTogglingId] = useState<string | null>(null);
  const [campaignIdsTraficoGrupos, setCampaignIdsTraficoGrupos] = useState<string[]>([]);
  const [traficoGruposTogglingId, setTraficoGruposTogglingId] = useState<string | null>(null);
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>({});
  const [expandedAdSets, setExpandedAdSets] = useState<Record<string, boolean>>({});

  // Campanha: editar / deletar
  const [campaignEditModal, setCampaignEditModal] = useState<{ campaignId: string; campaignName: string; objective: string } | null>(null);
  const [campaignEditSaving, setCampaignEditSaving] = useState(false);
  const [campaignDeleteConfirm, setCampaignDeleteConfirm] = useState<{ campaignId: string; campaignName: string } | null>(null);
  const [campaignDeleteDeleting, setCampaignDeleteDeleting] = useState(false);

  // Conjunto: novo / editar / deletar / duplicar
  const [adSetNewModal, setAdSetNewModal] = useState<{ campaignId: string; adAccountId: string; campaignName: string } | null>(null);
  const [adSetNewSaving, setAdSetNewSaving] = useState(false);
  const [adSetNewError, setAdSetNewError] = useState<string | null>(null);
  const [adSetEditModal, setAdSetEditModal] = useState<{ adSetId: string; adSetName: string; adAccountId: string; campaignId?: string; campaignName?: string } | null>(null);
  const [adSetEditSaving, setAdSetEditSaving] = useState(false);
  const [adSetEditError, setAdSetEditError] = useState<string | null>(null);
  const [adSetEditInitialData, setAdSetEditInitialData] = useState<{
    name: string;
    daily_budget: string;
    country_code: string;
    age_min: number;
    age_max: number;
    gender: "all" | "male" | "female";
    optimization_goal: string;
    pixel_id: string;
    conversion_event: string;
  } | null>(null);
  const [adSetDeleteConfirm, setAdSetDeleteConfirm] = useState<{ adSetId: string; adSetName: string } | null>(null);
  const [adSetDeleteDeleting, setAdSetDeleteDeleting] = useState(false);
  const [adSetDuplicateModal, setAdSetDuplicateModal] = useState<{ adSetId: string; adSetName: string } | null>(null);
  const [adSetDuplicateCount, setAdSetDuplicateCount] = useState("5");
  const [adSetDuplicateSaving, setAdSetDuplicateSaving] = useState(false);

  // Anúncio: deletar / duplicar / novo / editar
  const [adNewModal, setAdNewModal] = useState<{ adAccountId: string; adsetId: string; adSetName: string } | null>(null);
  const [adNewSaving, setAdNewSaving] = useState(false);
  const [adNewError, setAdNewError] = useState<string | null>(null);
  const [adEditModal, setAdEditModal] = useState<{ adId: string; adName: string; adAccountId: string; adsetId: string; adSetName: string } | null>(null);
  const [adEditSaving, setAdEditSaving] = useState(false);
  const [adEditError, setAdEditError] = useState<string | null>(null);
  const [adEditInitialData, setAdEditInitialData] = useState<{
    name: string;
    link: string;
    message: string;
    title: string;
    call_to_action: string;
    page_id: string;
  } | null>(null);
  const [adDeleteConfirm, setAdDeleteConfirm] = useState<{ adId: string; adName: string } | null>(null);
  const [adDeleteDeleting, setAdDeleteDeleting] = useState(false);
  const [adDuplicateModal, setAdDuplicateModal] = useState<{ adId: string; adName: string } | null>(null);
  const [adDuplicateCount, setAdDuplicateCount] = useState("5");
  const [adDuplicateSaving, setAdDuplicateSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ati/data?start=${start}&end=${end}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao carregar");
      setCreatives(json.creatives ?? []);
      setValidated(json.validated ?? []);
      setCampaignStatus((json.campaignStatus as Record<string, string>) ?? {});
      setCampaignsList(Array.isArray(json.campaignsList) ? json.campaignsList : []);
      setAdSetList(Array.isArray(json.adSetList) ? json.adSetList : []);
      setAdSetStatusMap((json.adSetStatusMap as Record<string, string>) ?? {});
      setAdStatusMap((json.adStatusMap as Record<string, string>) ?? {});
      const tagsRes = await fetch("/api/ati/campaign-tags?tag=Tráfego%20para%20Grupos", { cache: "no-store" });
      if (tagsRes.ok) {
        const tagsJson = (await tagsRes.json()) as { campaignIds?: string[] };
        setCampaignIdsTraficoGrupos(Array.isArray(tagsJson.campaignIds) ? tagsJson.campaignIds : []);
      } else {
        setCampaignIdsTraficoGrupos([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
      setCreatives([]);
      setValidated([]);
      setCampaignStatus({});
      setCampaignsList([]);
      setAdSetList([]);
      setAdSetStatusMap({});
      setAdStatusMap({});
      setCampaignIdsTraficoGrupos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [start, end]);

  useEffect(() => {
    if (!adSetEditModal) {
      setAdSetEditInitialData(null);
      return;
    }
    let cancelled = false;
    setAdSetEditInitialData(null);
    fetch(`/api/meta/adsets?adset_id=${encodeURIComponent(adSetEditModal.adSetId)}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled || json.error) return;
        setAdSetEditInitialData({
          name: json.name ?? "",
          daily_budget: json.daily_budget ?? "10",
          country_code: json.country_code ?? "BR",
          age_min: json.age_min ?? 18,
          age_max: json.age_max ?? 65,
          gender: json.gender ?? "all",
          optimization_goal: json.optimization_goal ?? "LINK_CLICKS",
          pixel_id: json.pixel_id ?? "",
          conversion_event: json.conversion_event ?? "PAGE_VIEW",
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [adSetEditModal?.adSetId]);

  useEffect(() => {
    if (!adEditModal) {
      setAdEditInitialData(null);
      return;
    }
    let cancelled = false;
    setAdEditInitialData(null);
    fetch(`/api/meta/ads/details?ad_id=${encodeURIComponent(adEditModal.adId)}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled || json.error) return;
        setAdEditInitialData({
          name: json.name ?? "",
          link: json.link ?? "https://www.facebook.com",
          message: json.message ?? "",
          title: json.title ?? "",
          call_to_action: json.call_to_action ?? "LEARN_MORE",
          page_id: json.page_id ?? "",
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [adEditModal?.adId]);

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

  const handleToggleTraficoGrupos = async (campaignId: string) => {
    const hasTag = campaignIdsTraficoGrupos.includes(campaignId);
    setTraficoGruposTogglingId(campaignId);
    try {
      const res = await fetch("/api/ati/campaign-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          tag: "Tráfego para Grupos",
          add: !hasTag,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao atualizar tag");
      setCampaignIdsTraficoGrupos((prev) =>
        hasTag ? prev.filter((id) => id !== campaignId) : [...prev, campaignId]
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar tag");
    } finally {
      setTraficoGruposTogglingId(null);
    }
  };

  const handleAdSetStatusToggle = async (adSetId: string) => {
    const current = adSetStatusMap[adSetId];
    const isActive = current === "ACTIVE";
    const nextStatus = isActive ? "PAUSED" : "ACTIVE";
    setAdSetTogglingId(adSetId);
    try {
      const res = await fetch("/api/meta/adsets/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adset_id: adSetId, status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao atualizar conjunto");
      setAdSetStatusMap((prev) => ({ ...prev, [adSetId]: nextStatus }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao alterar status do conjunto");
    } finally {
      setAdSetTogglingId(null);
    }
  };

  const handleAdStatusToggle = async (adId: string) => {
    const current = adStatusMap[adId];
    const isActive = current === "ACTIVE";
    const nextStatus = isActive ? "PAUSED" : "ACTIVE";
    setAdTogglingId(adId);
    try {
      const res = await fetch("/api/meta/ads/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad_id: adId, status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao atualizar anúncio");
      setAdStatusMap((prev) => ({ ...prev, [adId]: nextStatus }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao alterar status do anúncio");
    } finally {
      setAdTogglingId(null);
    }
  };

  const handleCampaignEditSave = async () => {
    if (!campaignEditModal) return;
    setCampaignEditSaving(true);
    try {
      const res = await fetch("/api/meta/campaigns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignEditModal.campaignId,
          name: campaignEditModal.campaignName.trim(),
          objective: campaignEditModal.objective || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao editar");
      setCampaignEditModal(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao editar campanha");
    } finally {
      setCampaignEditSaving(false);
    }
  };

  const handleCampaignDeleteConfirm = async () => {
    if (!campaignDeleteConfirm) return;
    setCampaignDeleteDeleting(true);
    try {
      const res = await fetch(`/api/meta/campaigns?campaign_id=${encodeURIComponent(campaignDeleteConfirm.campaignId)}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao deletar");
      setCampaignDeleteConfirm(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao deletar campanha");
    } finally {
      setCampaignDeleteDeleting(false);
    }
  };

  const handleAdSetNewSave = async (body: import("@/app/components/meta/MetaAdSetForm").MetaAdSetFormBody) => {
    if (!adSetNewModal) return;
    setAdSetNewError(null);
    setAdSetNewSaving(true);
    try {
      const res = await fetch("/api/meta/adsets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad_account_id: adSetNewModal.adAccountId,
          campaign_id: adSetNewModal.campaignId,
          name: body.name,
          daily_budget: body.daily_budget,
          country_code: body.country_code,
          age_min: body.age_min,
          age_max: body.age_max,
          gender: body.gender,
          optimization_goal: body.optimization_goal,
          pixel_id: body.pixel_id,
          conversion_event: body.conversion_event,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao criar conjunto");
      const newAdsetId = json.adset_id;
      const adAccountId = adSetNewModal.adAccountId;
      const newAdsetName = body.name;
      setAdSetNewModal(null);
      await load();
      // Abrir imediatamente o modal de Novo anúncio para criar o ad deste conjunto
      if (newAdsetId && adAccountId) {
        setAdNewModal({ adAccountId, adsetId: newAdsetId, adSetName: newAdsetName });
        setAdNewError(null);
      }
    } catch (e) {
      setAdSetNewError(e instanceof Error ? e.message : "Erro ao criar conjunto");
    } finally {
      setAdSetNewSaving(false);
    }
  };

  const handleAdNewSave = async (body: import("@/app/components/meta/MetaAdForm").MetaAdFormBody) => {
    if (!adNewModal) return;
    setAdNewError(null);
    setAdNewSaving(true);
    try {
      const res = await fetch("/api/meta/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad_account_id: adNewModal.adAccountId,
          adset_id: adNewModal.adsetId,
          name: body.name,
          page_id: body.page_id,
          link: body.link || "https://www.facebook.com",
          message: body.message,
          title: body.title,
          call_to_action: body.call_to_action,
          image_hash: body.image_hash,
          image_url: body.image_url,
          video_id: body.video_id,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao criar anúncio");
      setAdNewModal(null);
      await load();
    } catch (e) {
      setAdNewError(e instanceof Error ? e.message : "Erro ao criar anúncio");
    } finally {
      setAdNewSaving(false);
    }
  };

  const handleAdSetEditSave = async (body: import("@/app/components/meta/MetaAdSetForm").MetaAdSetFormBody) => {
    if (!adSetEditModal) return;
    setAdSetEditError(null);
    setAdSetEditSaving(true);
    try {
      const res = await fetch("/api/meta/adsets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adset_id: adSetEditModal.adSetId,
          campaign_id: adSetEditModal.campaignId,
          name: body.name,
          daily_budget: body.daily_budget,
          country_code: body.country_code,
          age_min: body.age_min,
          age_max: body.age_max,
          gender: body.gender,
          optimization_goal: body.optimization_goal,
          pixel_id: body.pixel_id,
          conversion_event: body.conversion_event,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao editar conjunto");
      setAdSetEditModal(null);
      setAdSetEditInitialData(null);
      await load();
    } catch (e) {
      setAdSetEditError(e instanceof Error ? e.message : "Erro ao editar conjunto");
    } finally {
      setAdSetEditSaving(false);
    }
  };

  const handleAdSetDeleteConfirm = async () => {
    if (!adSetDeleteConfirm) return;
    setAdSetDeleteDeleting(true);
    try {
      const res = await fetch(`/api/meta/adsets?adset_id=${encodeURIComponent(adSetDeleteConfirm.adSetId)}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao deletar");
      setAdSetDeleteConfirm(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao deletar conjunto");
    } finally {
      setAdSetDeleteDeleting(false);
    }
  };

  const handleAdSetDuplicateSave = async () => {
    if (!adSetDuplicateModal) return;
    const count = Math.min(50, Math.max(1, parseInt(adSetDuplicateCount, 10) || 1));
    setAdSetDuplicateSaving(true);
    try {
      const res = await fetch("/api/meta/adsets/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adset_id: adSetDuplicateModal.adSetId, count }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao duplicar");
      setAdSetDuplicateModal(null);
      setAdSetDuplicateCount("5");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao duplicar conjunto");
    } finally {
      setAdSetDuplicateSaving(false);
    }
  };

  const handleAdDeleteConfirm = async () => {
    if (!adDeleteConfirm) return;
    setAdDeleteDeleting(true);
    try {
      const res = await fetch(`/api/meta/ads?ad_id=${encodeURIComponent(adDeleteConfirm.adId)}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao deletar");
      setAdDeleteConfirm(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao deletar anúncio");
    } finally {
      setAdDeleteDeleting(false);
    }
  };

  const handleAdDuplicateSave = async () => {
    if (!adDuplicateModal) return;
    const count = Math.min(50, Math.max(1, parseInt(adDuplicateCount, 10) || 1));
    setAdDuplicateSaving(true);
    try {
      const res = await fetch("/api/meta/ads/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad_id: adDuplicateModal.adId, count }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao duplicar");
      setAdDuplicateModal(null);
      setAdDuplicateCount("5");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao duplicar anúncio");
    } finally {
      setAdDuplicateSaving(false);
    }
  };

  const handleAdEditSave = async (body: import("@/app/components/meta/MetaAdForm").MetaAdFormBody) => {
    if (!adEditModal) return;
    setAdEditError(null);
    setAdEditSaving(true);
    try {
      const resName = await fetch("/api/meta/ads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad_id: adEditModal.adId, name: body.name.trim() || adEditModal.adName }),
      });
      const jsonName = await resName.json();
      if (!resName.ok) throw new Error(jsonName?.error ?? "Erro ao editar nome");
      if (body.link && body.link.trim()) {
        const resLink = await fetch("/api/meta/ads/update-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ad_id: adEditModal.adId, link: body.link.trim() }),
        });
        const jsonLink = await resLink.json();
        if (!resLink.ok) throw new Error(jsonLink?.error ?? "Erro ao atualizar link");
      }
      setAdEditModal(null);
      setAdEditInitialData(null);
      await load();
    } catch (e) {
      setAdEditError(e instanceof Error ? e.message : "Erro ao editar anúncio");
    } finally {
      setAdEditSaving(false);
    }
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
    let tree = buildTree(campaignsList, adSetList, creatives);
    if (lowerCamp || lowerSet || lowerAd) {
      tree = tree
        .filter((c) => !lowerCamp || c.campaignName.toLowerCase().includes(lowerCamp))
        .map((camp) => ({
          ...camp,
          adSets: camp.adSets
            .filter((s) => !lowerSet || s.adSetName.toLowerCase().includes(lowerSet))
            .map((s) => ({
              ...s,
              ads: lowerAd ? s.ads.filter((a) => a.adName.toLowerCase().includes(lowerAd)) : s.ads,
            }))
            .filter((s) => !lowerAd || s.ads.length > 0),
        }))
        .filter((c) => c.adSets.length > 0);
    }
    return tree;
  }, [creatives, campaignsList, adSetList, filterCampaign, filterAdSet, filterAd]);

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

        {creatives.length === 0 && campaignsList.length === 0 && !loading ? (
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
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCampaignEditModal({ campaignId: camp.campaignId, campaignName: camp.campaignName, objective: "OUTCOME_TRAFFIC" }); }}
                        className="p-1.5 rounded-md text-text-secondary hover:bg-dark-bg hover:text-text-primary"
                        title="Editar campanha"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCampaignDeleteConfirm({ campaignId: camp.campaignId, campaignName: camp.campaignName }); }}
                        className="p-1.5 rounded-md text-text-secondary hover:bg-red-500/20 hover:text-red-400"
                        title="Deletar campanha"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={traficoGruposTogglingId === camp.campaignId}
                        onClick={(e) => { e.stopPropagation(); handleToggleTraficoGrupos(camp.campaignId); }}
                        title={campaignIdsTraficoGrupos.includes(camp.campaignId) ? "Remover tag Tráfego para Grupos" : "Marcar como Tráfego para Grupos (aparece na Calculadora GPL)"}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                          campaignIdsTraficoGrupos.includes(camp.campaignId)
                            ? "bg-shopee-orange/20 text-shopee-orange border border-shopee-orange/50"
                            : "text-text-secondary border border-dark-border hover:bg-dark-bg hover:text-text-primary"
                        } disabled:opacity-50`}
                      >
                        {traficoGruposTogglingId === camp.campaignId ? (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <MessageCircle className="h-3.5 w-3.5" />
                        )}
                        Tráfego para Grupos
                      </button>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={campaignStatus[camp.campaignId] === "ACTIVE"}
                      disabled={campaignTogglingId === camp.campaignId}
                      onClick={(e) => { e.stopPropagation(); handleCampaignStatusToggle(camp.campaignId); }}
                      title={campaignStatus[camp.campaignId] === "ACTIVE" ? "Pausar campanha no Facebook" : "Ativar campanha no Facebook"}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-shopee-orange focus:ring-offset-2 focus:ring-offset-dark-card disabled:opacity-50 ${
                        campaignStatus[camp.campaignId] === "ACTIVE"
                          ? "bg-emerald-500 border-transparent"
                          : "bg-dark-border border-gray-600"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition ${
                          campaignStatus[camp.campaignId] === "ACTIVE" ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-medium flex-shrink-0 ${campaignStatus[camp.campaignId] === "ACTIVE" ? "text-emerald-400" : "text-text-secondary"}`}>
                      {campaignStatus[camp.campaignId] === "ACTIVE" ? "Ativo" : "Desativado"}
                    </span>
                  </div>
                  {campaignOpen && (
                    <div className="border-t border-dark-border">
                      {camp.adAccountId && (
                        <div className="px-4 py-2 pl-6 border-b border-dark-border/50 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => { setAdSetNewModal({ campaignId: camp.campaignId, adAccountId: camp.adAccountId!, campaignName: camp.campaignName }); setAdSetNewError(null); }}
                            className="inline-flex items-center gap-1.5 rounded-md bg-dark-bg border border-dark-border px-2.5 py-1.5 text-xs font-medium text-text-primary hover:bg-dark-card"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Novo conjunto
                          </button>
                        </div>
                      )}
                      {camp.adSets.map((set) => {
                        const adSetOpen = expandedAdSets[set.adSetId];
                        return (
                          <div key={set.adSetId} className="border-b border-dark-border/50 last:border-b-0">
                            <div className="flex items-center w-full">
                              <button
                                type="button"
                                onClick={() => toggleAdSet(set.adSetId)}
                                className="flex items-center gap-2 flex-1 min-w-0 px-4 py-2.5 pl-6 text-left hover:bg-dark-bg/40 transition-colors border-l-2 border-shopee-orange cursor-pointer"
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
                              <div className="flex items-center gap-2 pr-2 flex-shrink-0">
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={adSetStatusMap[set.adSetId] === "ACTIVE"}
                                  disabled={adSetTogglingId === set.adSetId}
                                  onClick={(e) => { e.stopPropagation(); handleAdSetStatusToggle(set.adSetId); }}
                                  title={adSetStatusMap[set.adSetId] === "ACTIVE" ? "Pausar conjunto" : "Ativar conjunto"}
                                  className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-shopee-orange focus:ring-offset-2 focus:ring-offset-dark-card disabled:opacity-50 ${
                                    adSetStatusMap[set.adSetId] === "ACTIVE"
                                      ? "bg-emerald-500 border-transparent"
                                      : "bg-dark-border border-gray-600"
                                  }`}
                                >
                                  <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition ${adSetStatusMap[set.adSetId] === "ACTIVE" ? "translate-x-4" : "translate-x-0.5"}`} />
                                </button>
                                <span className={`text-xs font-medium ${adSetStatusMap[set.adSetId] === "ACTIVE" ? "text-emerald-400" : "text-text-secondary"}`}>
                                  {adSetStatusMap[set.adSetId] === "ACTIVE" ? "Ativo" : "Desativado"}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setAdSetEditModal({ adSetId: set.adSetId, adSetName: set.adSetName, adAccountId: set.adAccountId ?? "", campaignId: camp.campaignId, campaignName: camp.campaignName }); setAdSetEditError(null); }}
                                  className="p-1.5 rounded-md text-text-secondary hover:bg-dark-bg hover:text-text-primary"
                                  title="Editar conjunto"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setAdSetDeleteConfirm({ adSetId: set.adSetId, adSetName: set.adSetName }); }}
                                  className="p-1.5 rounded text-text-secondary hover:bg-red-500/20 hover:text-red-400"
                                  title="Deletar conjunto"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setAdSetDuplicateModal({ adSetId: set.adSetId, adSetName: set.adSetName }); setAdSetDuplicateCount("5"); }}
                                  className="p-1.5 rounded text-text-secondary hover:bg-shopee-orange/20 hover:text-shopee-orange"
                                  title="Duplicar conjunto"
                                >
                                  <CopyPlus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            {adSetOpen && set.adAccountId && (
                              <div className="px-4 py-2 pl-6 border-b border-dark-border/50 flex items-center gap-2 bg-dark-bg/30">
                                <button
                                  type="button"
                                  onClick={() => { setAdNewModal({ adAccountId: set.adAccountId!, adsetId: set.adSetId, adSetName: set.adSetName }); setAdNewError(null); }}
                                  className="inline-flex items-center gap-1.5 rounded-md bg-dark-bg border border-dark-border px-2.5 py-1.5 text-xs font-medium text-text-primary hover:bg-dark-card"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Novo anúncio
                                </button>
                              </div>
                            )}
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
                                    onDeleteAd={(r) => setAdDeleteConfirm({ adId: r.adId, adName: r.adName })}
                                    onDuplicateAd={(r) => { setAdDuplicateModal({ adId: r.adId, adName: r.adName }); setAdDuplicateCount("5"); }}
                                    adStatus={adStatusMap[row.adId]}
                                    onAdStatusToggle={handleAdStatusToggle}
                                    adTogglingId={adTogglingId}
                                    onEditAd={(r) => {
                                      if (r.adAccountId) {
                                        setAdEditModal({ adId: r.adId, adName: r.adName, adAccountId: r.adAccountId, adsetId: r.adSetId, adSetName: r.adSetName });
                                        setAdEditError(null);
                                      } else setError("Conta de anúncios não disponível.");
                                    }}
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
            {filteredAndGrouped.length === 0 && (creatives.length > 0 || campaignsList.length > 0) && (
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

      {/* Editar campanha */}
      {campaignEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setCampaignEditModal(null)}>
          <div className="bg-dark-card border border-dark-border rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-primary">Editar campanha</h3>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Nome</label>
              <input
                type="text"
                value={campaignEditModal.campaignName}
                onChange={(e) => setCampaignEditModal((p) => p ? { ...p, campaignName: e.target.value } : null)}
                className="w-full rounded-md border border-dark-border bg-dark-bg py-2 px-3 text-text-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Objetivo</label>
              <select
                value={campaignEditModal.objective}
                onChange={(e) => setCampaignEditModal((p) => p ? { ...p, objective: e.target.value } : null)}
                className="w-full rounded-md border border-dark-border bg-dark-bg py-2 px-3 text-text-primary text-sm"
              >
                {META_CAMPAIGN_OBJECTIVES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setCampaignEditModal(null)} className="rounded-md border border-dark-border py-2 px-4 text-sm font-medium text-text-secondary hover:bg-dark-bg">Cancelar</button>
              <button type="button" disabled={campaignEditSaving || !campaignEditModal.campaignName.trim()} onClick={handleCampaignEditSave} className="rounded-md bg-shopee-orange py-2 px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{campaignEditSaving ? "Salvando…" : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Deletar campanha */}
      {campaignDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setCampaignDeleteConfirm(null)}>
          <div className="bg-dark-card border border-dark-border rounded-xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-primary">Deletar campanha</h3>
            <p className="text-sm text-text-secondary">Tem certeza que deseja deletar a campanha <strong className="text-text-primary">{campaignDeleteConfirm.campaignName}</strong>? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setCampaignDeleteConfirm(null)} className="rounded-md border border-dark-border py-2 px-4 text-sm font-medium text-text-secondary hover:bg-dark-bg">Cancelar</button>
              <button type="button" disabled={campaignDeleteDeleting} onClick={handleCampaignDeleteConfirm} className="rounded-md bg-red-600 py-2 px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{campaignDeleteDeleting ? "Deletando…" : "Deletar"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Novo conjunto - formulário completo como em Criar Campanha Meta */}
      {adSetNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto" onClick={() => setAdSetNewModal(null)}>
          <div className="bg-dark-card border border-dark-border rounded-xl shadow-xl max-w-xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
            <MetaAdSetForm
              campaignId={adSetNewModal.campaignId}
              adAccountId={adSetNewModal.adAccountId}
              campaignName={adSetNewModal.campaignName}
              onSubmit={handleAdSetNewSave}
              onCancel={() => setAdSetNewModal(null)}
              saving={adSetNewSaving}
              error={adSetNewError}
            />
          </div>
        </div>
      )}

      {/* Editar conjunto - mesmo formulário, dados pré-preenchidos */}
      {adSetEditModal && adSetEditInitialData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto" onClick={() => { setAdSetEditModal(null); setAdSetEditInitialData(null); }}>
          <div className="bg-dark-card border border-dark-border rounded-xl shadow-xl max-w-xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Editar conjunto</h3>
            <MetaAdSetForm
              key={`edit-${adSetEditModal.adSetId}`}
              campaignId={adSetEditModal.campaignId ?? ""}
              adAccountId={adSetEditModal.adAccountId}
              campaignName={adSetEditModal.campaignName}
              defaultName={adSetEditInitialData.name}
              defaultBudget={adSetEditInitialData.daily_budget}
              defaultCountry={adSetEditInitialData.country_code}
              defaultAgeMin={String(adSetEditInitialData.age_min)}
              defaultAgeMax={String(adSetEditInitialData.age_max)}
              defaultGender={adSetEditInitialData.gender}
              defaultOptimizationGoal={adSetEditInitialData.optimization_goal}
              defaultPixelId={adSetEditInitialData.pixel_id}
              defaultConversionEvent={adSetEditInitialData.conversion_event}
              submitLabel="Salvar edição"
              onSubmit={handleAdSetEditSave}
              onCancel={() => { setAdSetEditModal(null); setAdSetEditInitialData(null); }}
              saving={adSetEditSaving}
              error={adSetEditError}
            />
          </div>
        </div>
      )}

      {/* Novo anúncio - formulário completo como em Criar Campanha Meta */}
      {adNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto" onClick={() => setAdNewModal(null)}>
          <div className="bg-dark-card border border-dark-border rounded-xl shadow-xl max-w-xl w-full p-6 my-8 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <MetaAdForm
              adAccountId={adNewModal.adAccountId}
              adsetId={adNewModal.adsetId}
              adsetName={adNewModal.adSetName}
              onSubmit={handleAdNewSave}
              onCancel={() => setAdNewModal(null)}
              saving={adNewSaving}
              error={adNewError}
            />
          </div>
        </div>
      )}

      {/* Editar anúncio - mesmo formulário, dados pré-preenchidos (nome e link editáveis) */}
      {adEditModal && adEditInitialData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto" onClick={() => { setAdEditModal(null); setAdEditInitialData(null); }}>
          <div className="bg-dark-card border border-dark-border rounded-xl shadow-xl max-w-xl w-full p-6 my-8 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Editar anúncio</h3>
            <MetaAdForm
              key={`edit-ad-${adEditModal.adId}`}
              adAccountId={adEditModal.adAccountId}
              adsetId={adEditModal.adsetId}
              adsetName={adEditModal.adSetName}
              defaultName={adEditInitialData.name}
              defaultLink={adEditInitialData.link}
              defaultMessage={adEditInitialData.message}
              defaultTitle={adEditInitialData.title}
              defaultCallToAction={adEditInitialData.call_to_action}
              defaultPageId={adEditInitialData.page_id}
              isEditMode
              submitLabel="Salvar edição"
              onSubmit={handleAdEditSave}
              onCancel={() => { setAdEditModal(null); setAdEditInitialData(null); }}
              saving={adEditSaving}
              error={adEditError}
            />
          </div>
        </div>
      )}

      {/* Deletar conjunto */}
      {adSetDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setAdSetDeleteConfirm(null)}>
          <div className="bg-dark-card border border-dark-border rounded-xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-primary">Deletar conjunto</h3>
            <p className="text-sm text-text-secondary">Deletar <strong className="text-text-primary">{adSetDeleteConfirm.adSetName}</strong>? Não é possível desfazer.</p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setAdSetDeleteConfirm(null)} className="rounded-md border border-dark-border py-2 px-4 text-sm font-medium text-text-secondary hover:bg-dark-bg">Cancelar</button>
              <button type="button" disabled={adSetDeleteDeleting} onClick={handleAdSetDeleteConfirm} className="rounded-md bg-red-600 py-2 px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{adSetDeleteDeleting ? "Deletando…" : "Deletar"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicar conjunto */}
      {adSetDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setAdSetDuplicateModal(null)}>
          <div className="bg-dark-card border border-dark-border rounded-xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-primary">Duplicar conjunto</h3>
            <p className="text-sm text-text-secondary">Quantas cópias? (1 a 50). Nomes: -COPIA 1, -COPIA 2...</p>
            <input type="number" min={1} max={50} value={adSetDuplicateCount} onChange={(e) => setAdSetDuplicateCount(e.target.value)} className="w-full rounded-md border border-dark-border bg-dark-bg py-2 px-3 text-text-primary text-sm" />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setAdSetDuplicateModal(null)} className="rounded-md border border-dark-border py-2 px-4 text-sm font-medium text-text-secondary hover:bg-dark-bg">Cancelar</button>
              <button type="button" disabled={adSetDuplicateSaving} onClick={handleAdSetDuplicateSave} className="rounded-md bg-shopee-orange py-2 px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{adSetDuplicateSaving ? "Duplicando…" : "Duplicar"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Deletar anúncio */}
      {adDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setAdDeleteConfirm(null)}>
          <div className="bg-dark-card border border-dark-border rounded-xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-primary">Deletar anúncio</h3>
            <p className="text-sm text-text-secondary">Deletar <strong className="text-text-primary">{adDeleteConfirm.adName}</strong>? Não é possível desfazer.</p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setAdDeleteConfirm(null)} className="rounded-md border border-dark-border py-2 px-4 text-sm font-medium text-text-secondary hover:bg-dark-bg">Cancelar</button>
              <button type="button" disabled={adDeleteDeleting} onClick={handleAdDeleteConfirm} className="rounded-md bg-red-600 py-2 px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{adDeleteDeleting ? "Deletando…" : "Deletar"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicar anúncio */}
      {adDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setAdDuplicateModal(null)}>
          <div className="bg-dark-card border border-dark-border rounded-xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-primary">Duplicar anúncio</h3>
            <p className="text-sm text-text-secondary">Quantas cópias? (1 a 50). Nomes: -COPIA 1, -COPIA 2...</p>
            <input type="number" min={1} max={50} value={adDuplicateCount} onChange={(e) => setAdDuplicateCount(e.target.value)} className="w-full rounded-md border border-dark-border bg-dark-bg py-2 px-3 text-text-primary text-sm" />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setAdDuplicateModal(null)} className="rounded-md border border-dark-border py-2 px-4 text-sm font-medium text-text-secondary hover:bg-dark-bg">Cancelar</button>
              <button type="button" disabled={adDuplicateSaving} onClick={handleAdDuplicateSave} className="rounded-md bg-shopee-orange py-2 px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{adDuplicateSaving ? "Duplicando…" : "Duplicar"}</button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
