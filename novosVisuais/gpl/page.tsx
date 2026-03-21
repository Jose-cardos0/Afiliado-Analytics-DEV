"use client";

import { useMemo, useState } from "react";
import {
  Calculator,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Info,
  Target,
  Layers3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
  Search,
  CheckSquare,
  Activity,
  ChevronDown,
  Clock,
} from "lucide-react";

type PeriodPreset = 7 | 14 | 28 | 30;
type TabMode = "grupos" | "campanhas";

type CampaignRow = {
  id: string;
  name: string;
  platform: string;
  status: "Pausada" | "Ativa";
  investment: number;
  leads: number;
  profit: number;
  color: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function parseMoneyPt(input: string) {
  const cleaned = input
    .replace(/\s/g, "")
    .replace(/[R$\u00A0]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function formatDateBR(dateString: string) {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

const mockInstances = [
  "Nenhuma",
  "PalomaSafadinha",
  "josePikaDeMel",
  "Instância 04 (Vendas)",
  "Instância 05 (Suporte)",
  "Lançamento Vip",
];

const mockCampaigns: CampaignRow[] = [
  { id: "1", name: "SHOPEE", platform: "Meta Ads", status: "Pausada", investment: 12.59, leads: 1, profit: 0, color: "bg-fuchsia-500" },
  { id: "2", name: "OXGLOBAL", platform: "Meta Ads", status: "Pausada", investment: 463.18, leads: 1, profit: 186.13, color: "bg-violet-500" },
  { id: "3", name: "VIDEO SOLIDAO", platform: "Meta Ads", status: "Pausada", investment: 24.52, leads: 1, profit: 0, color: "bg-emerald-500" },
  { id: "4", name: "CAMPANHA CLICK - 01", platform: "Meta Ads", status: "Pausada", investment: 0, leads: 0, profit: 0, color: "bg-slate-400" },
  { id: "5", name: "REMARKETING V2", platform: "Meta Ads", status: "Ativa", investment: 150.0, leads: 5, profit: 300, color: "bg-blue-500" },
  { id: "6", name: "TIKTOK AWARENESS", platform: "TikTok Ads", status: "Ativa", investment: 85.0, leads: 12, profit: 50, color: "bg-black" },
  { id: "7", name: "GOOGLE SEARCH", platform: "Google Ads", status: "Ativa", investment: 210.0, leads: 8, profit: 120, color: "bg-blue-600" },
  { id: "8", name: "YOUTUBE SHORTS", platform: "Google Ads", status: "Pausada", investment: 45.0, leads: 2, profit: 0, color: "bg-red-500" },
];

const mockGrupos = [
  { name: "teste 3", members: 2, entries: 2, exits: 0, alert: false },
  { name: "teste 2", members: 2, entries: 2, exits: 0, alert: false },
  { name: "CNU", members: 2, entries: 0, exits: 0, alert: false },
  { name: "Teste", members: 3, entries: 0, exits: 0, alert: false },
  { name: "ELGAVI - Atacado Grupo 2", members: 467, entries: 3, exits: 1, alert: true },
  { name: "VIP Shopee Ofertas", members: 890, entries: 12, exits: 2, alert: false },
  { name: "Grupo de Transição", members: 150, entries: 5, exits: 10, alert: true },
  { name: "Leads Frios 01", members: 300, entries: 1, exits: 1, alert: false },
  { name: "Afiliados PRO", members: 1024, entries: 45, exits: 5, alert: false },
];

export default function GplCalculatorCockpit() {
  const [segment, setSegment] = useState<string>(mockInstances[1]);
  const [activeTab, setActiveTab] = useState<TabMode>("grupos");

  const [peopleInGroup, setPeopleInGroup] = useState("467");
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>(28);
  const [startDate, setStartDate] = useState("2026-02-10");
  const [endDate, setEndDate] = useState("2026-03-09");

  const [totalProfitInput, setTotalProfitInput] = useState("186,13");
  const [trafficCostInput, setTrafficCostInput] = useState("500,29");

  const [entriesInput] = useState("3");
  const [exitsInput] = useState("1");

  const totalProfit = useMemo(() => parseMoneyPt(totalProfitInput), [totalProfitInput]);
  const trafficCost = useMemo(() => parseMoneyPt(trafficCostInput), [trafficCostInput]);
  const people = useMemo(() => Number(peopleInGroup) || 0, [peopleInGroup]);
  const entries = useMemo(() => Number(entriesInput) || 0, [entriesInput]);
  const exits = useMemo(() => Number(exitsInput) || 0, [exitsInput]);

  const validLeads = Math.max(entries - exits, 1);
  const gplPeriod = people > 0 ? totalProfit / people : 0;
  const gplMonthly = periodPreset > 0 ? (gplPeriod / periodPreset) * 30 : 0;
  const monthlyRevenue = gplMonthly * people;

  const cplInitial = entries > 0 ? trafficCost / entries : 0;
  const cplReal = validLeads > 0 ? trafficCost / validLeads : 0;
  const cplMeta = 0.13;
  const loss = Math.max(trafficCost - totalProfit, 0);

  const performanceBadge = useMemo(() => {
    if (gplMonthly >= 1.5) return { text: "Excelente", className: "bg-green-500/10 text-green-400 border-green-500/20" };
    if (gplMonthly >= 0.8) return { text: "Boa", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" };
    if (gplMonthly > 0) return { text: "Alerta", className: "bg-red-500/10 text-red-400 border-red-500/20" };
    return null;
  }, [gplMonthly]);

  const summaryCards = [
    { label: "Custo Tráfego", value: formatCurrency(trafficCost), tone: "text-red-400", tooltip: "Soma de todos os investimentos em campanhas de tráfego no período." },
    { label: "CPL Inicial", value: formatCurrency(cplInitial), tone: "text-amber-300", tooltip: "Custo bruto por lead, sem considerar as saídas (evasões)." },
    { label: "CPL Meta", value: formatCurrency(cplMeta), tone: "text-sky-300", tooltip: "Seu teto de gastos ideal por lead para manter a lucratividade." },
    { label: "CPL Real", value: formatCurrency(cplReal), tone: "text-emerald-400", tooltip: "Custo líquido por lead, dividindo o investimento apenas pelos leads que ficaram." },
    { label: "Membros", value: String(people), tone: "text-sky-400", tooltip: "Pessoas ativas retidas no momento atual." },
    { label: "Entradas", value: String(entries), tone: "text-emerald-400", tooltip: "Volume de novos membros que ingressaram via tráfego." },
    { label: "Saídas", value: String(exits), tone: "text-red-400", tooltip: "Volume de membros que saíram (evasão)." },
    { label: "Prejuízo", value: formatCurrency(loss), tone: "text-red-400", tooltip: "Diferença negativa caso o custo do tráfego seja maior que o lucro." },
  ];

  const tabInfoTooltip =
    activeTab === "grupos"
      ? "Selecione para somar os membros em 'Pessoas no grupo'. Atualize a página para buscar os dados mais recentes da API"
      : "Selecione campanhas para somar o custo de tráfego. Certifique-se de marcar a tag no ATI para que elas apareçam aqui.";

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-2rem)] text-text-primary space-y-4">
      <style jsx>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(56%) sepia(93%) saturate(1573%) hue-rotate(358deg) brightness(100%) contrast(103%);
          cursor: pointer;
        }
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2c2c32; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e24c30; }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-dark-border pb-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold font-heading flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#e24c30]" /> Calculadora GPL
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">Visão consolidada de Canais e Websites</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary flex items-center gap-1">
            <Layers3 className="w-3 h-3 text-emerald-400" /> Instância:
          </span>
          <div className="relative flex items-center">
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              className="appearance-none bg-[#1c1c1f] border border-dark-border pl-3 pr-8 py-1.5 rounded-md text-xs font-semibold text-text-primary hover:border-text-secondary focus:border-[#e24c30] focus:outline-none focus:ring-1 focus:ring-[#e24c30] transition-all cursor-pointer"
            >
              {mockInstances.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-text-secondary absolute right-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-0">
        <div className="md:col-span-4 lg:col-span-3 bg-[#121214] rounded-xl border border-dark-border p-4 flex flex-col gap-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-2 py-1.5 rounded border border-emerald-500/20 text-[11px] font-semibold">
            <CheckSquare className="w-3 h-3 shrink-0" /> API Shopee Conectada
          </div>

          <div className="space-y-3 border-b border-dark-border pb-4">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Parâmetros</h3>
            <Field
              label="Pessoas no Grupo"
              icon={<Users className="w-3 h-3 text-sky-400" />}
              value={peopleInGroup}
              onChange={setPeopleInGroup}
              type="number"
              tooltip="Número total de membros ativos que visualizarão as ofertas no período analisado."
            />

            <div className="bg-[#1c1c1f] p-2 rounded-lg border border-dark-border">
              <label className="mb-2 flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-400" /> Período
                </span>
                <span className="text-[10px] bg-[#121214] px-1.5 py-0.5 rounded text-text-secondary">{periodPreset}d</span>
              </label>

              <div className="flex flex-col gap-2 mb-2">
                <div className="w-full">
                  <span className="text-[9px] text-text-secondary px-1">Início</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-transparent border-b border-dark-border text-xs px-1 py-1 outline-none text-white focus:border-[#e24c30]"
                  />
                </div>
                <div className="w-full">
                  <span className="text-[9px] text-text-secondary px-1">Fim</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-transparent border-b border-dark-border text-xs px-1 py-1 outline-none text-white focus:border-[#e24c30]"
                  />
                </div>
              </div>

              <button className="w-full bg-[#e24c30] text-white text-[11px] py-1.5 rounded font-semibold hover:opacity-90 transition">
                Aplicar Filtro
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Valores</h3>
            <Field
              label="Lucro Total (Líquido)"
              icon={<DollarSign className="w-3 h-3 text-emerald-400" />}
              value={totalProfitInput}
              onChange={setTotalProfitInput}
              tooltip="Soma das comissões líquidas geradas pelas campanhas conectadas."
            />
            <Field
              label="Custo de Tráfego"
              icon={<TrendingUp className="w-3 h-3 text-red-400" />}
              value={trafficCostInput}
              onChange={setTrafficCostInput}
              inputClass="text-red-400"
              tooltip="Soma total do valor investido para atrair os leads no mesmo período."
            />
          </div>
        </div>

        <div className="md:col-span-8 lg:col-span-6 flex flex-col gap-4 min-h-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0">
            {summaryCards.map((card) => (
              <div key={card.label} className="bg-[#121214] border border-dark-border rounded-lg p-2.5 flex flex-col justify-center">
                <div className="flex items-center gap-1">
                  <p className="text-[9px] text-text-secondary uppercase tracking-wider leading-tight">{card.label}</p>
                  {card.tooltip && (
                    <div className="group relative flex items-center shrink-0">
                      <Info className="w-3 h-3 text-text-secondary cursor-help" />
                      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-max max-w-[180px] bg-[#232328] border border-dark-border text-[10px] text-white px-2 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50 text-center shadow-lg whitespace-normal leading-tight">
                        {card.tooltip}
                      </div>
                    </div>
                  )}
                </div>
                <p className={cn("mt-0.5 text-sm font-bold break-words leading-tight", card.tone)}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-[#121214] rounded-xl border border-dark-border flex-1 relative min-h-[400px] lg:min-h-0">
            <div className="absolute inset-0 flex flex-col p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 shrink-0">
                <div className="flex bg-[#1c1c1f] p-1 rounded-lg border border-dark-border">
                  <button
                    onClick={() => setActiveTab("grupos")}
                    className={cn(
                      "px-4 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2",
                      activeTab === "grupos"
                        ? "bg-[#e24c30] text-white"
                        : "text-text-secondary hover:text-white"
                    )}
                  >
                    <Users className="w-3 h-3" /> Grupos
                  </button>
                  <button
                    onClick={() => setActiveTab("campanhas")}
                    className={cn(
                      "px-4 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2",
                      activeTab === "campanhas"
                        ? "bg-[#e24c30] text-white"
                        : "text-text-secondary hover:text-white"
                    )}
                  >
                    <Activity className="w-3 h-3" /> Campanhas
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-2 top-2 text-text-secondary" />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      className="bg-[#1c1c1f] border border-dark-border rounded-md py-1.5 pl-7 pr-2 text-xs w-32 focus:border-[#e24c30] outline-none"
                    />
                  </div>
                  <button
                    className="text-sky-300 hover:text-sky-200 bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/25 p-1.5 rounded-md transition-colors"
                    title="Atualizar dados"
                  >
                    <RefreshCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="mb-3 px-1 shrink-0 flex items-center justify-between gap-3">
                {activeTab === "grupos" ? (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-semibold min-w-0">
                    <Clock className="w-3.5 h-3.5 shrink-0" /> Última atualização: 16/03/2026, 22:45
                  </p>
                ) : (
                  <p className="text-[11px] text-sky-300 flex items-center gap-1.5 font-semibold min-w-0">
                    <Calendar className="w-3.5 h-3.5 shrink-0" /> Período: {formatDateBR(startDate)} a {formatDateBR(endDate)}
                  </p>
                )}

                <InlineInfoTooltip
                  text={tabInfoTooltip}
                  iconClassName={activeTab === "grupos" ? "text-emerald-400" : "text-sky-300"}
                />
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2">
                {activeTab === "grupos" ? (
                  <div className="space-y-2">
                    {mockGrupos.map((g) => (
                      <div
                        key={g.name}
                        className={cn("bg-[#1c1c1f] border p-3 rounded-lg flex flex-col hover:border-text-secondary transition", g.alert ? "border-[#5c3429]" : "border-dark-border")}
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <input type="checkbox" defaultChecked={g.alert} className="rounded accent-[#e24c30] w-3 h-3 shrink-0" />
                            <span className="text-xs font-bold break-words">{g.name}</span>
                          </div>
                          <span className="text-[10px] text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded font-medium shrink-0 whitespace-nowrap">
                            {g.members} membros
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-1.5 text-[10px]">
                          <span className="text-emerald-400 flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3 shrink-0" /> {g.entries} Entradas
                          </span>
                          <span className="text-red-400 flex items-center gap-1">
                            <ArrowDownRight className="w-3 h-3 shrink-0" /> {g.exits} Saídas
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mockCampaigns.map((c) => (
                      <div
                        key={c.id}
                        className="bg-[#1c1c1f] border border-dark-border p-2.5 rounded-lg flex items-center justify-between gap-3 hover:border-text-secondary transition"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input type="checkbox" defaultChecked={c.investment > 0} className="rounded accent-[#e24c30] w-3 h-3 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.color)} />
                              <span className="text-xs font-bold break-words">{c.name}</span>
                              <span className="text-[9px] bg-[#1c1c1f] px-1.5 rounded text-text-secondary whitespace-nowrap">{c.status}</span>
                            </div>
                            <span className="text-[11px] font-semibold text-red-400 ml-3.5 block mt-0.5">
                              {formatCurrency(c.investment)}
                            </span>
                          </div>
                        </div>
                        <button className="text-[10px] font-semibold text-red-500 hover:text-red-400 transition cursor-pointer shrink-0">
                          Ver no ATI
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-12 lg:col-span-3 bg-[#121214] rounded-xl border border-dark-border p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-4 h-4 text-[#e24c30]" />
              <h2 className="text-sm font-bold uppercase tracking-wide">Visão Executiva</h2>
            </div>

            <div className="space-y-4">
              <ResultCard
                title={`GPL no período (${periodPreset}d)`}
                value={formatCurrency(gplPeriod)}
                footer="por lead"
              />
              <ResultCard
                title="GPL Mensal Projetado"
                value={formatCurrency(gplMonthly)}
                footer="por lead/mês"
                valueClassName="text-[#e24c30]"
                highlight
              />
              <ResultCard
                title="Receita Bruta Estimada"
                value={formatCurrency(monthlyRevenue)}
                footer="total projetado no mês"
                valueClassName="text-emerald-400"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-dark-border">
            <p className="text-[10px] text-text-secondary mb-2 uppercase text-center tracking-wider">
              Status da Operação
            </p>
            {performanceBadge ? (
              <div className={cn("w-full py-2 rounded-lg text-center text-xs font-bold border uppercase tracking-wider flex items-center justify-center gap-2", performanceBadge.className)}>
                <AlertCircle className="w-3 h-3" /> {performanceBadge.text}
              </div>
            ) : (
              <div className="w-full py-2 rounded-lg text-center text-xs text-text-secondary border border-dark-border bg-[#1c1c1f]">
                Aguardando dados...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, value, onChange, type = "text", inputClass, tooltip }: any) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
        {icon} {label}
        {tooltip && (
          <div className="group relative flex items-center ml-0.5">
            <Info className="w-3 h-3 text-text-secondary cursor-help" />
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-max max-w-[180px] bg-[#232328] border border-dark-border text-[10px] text-white px-2 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50 text-center shadow-lg whitespace-normal leading-tight">
              {tooltip}
            </div>
          </div>
        )}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-8 w-full min-w-0 rounded-md border border-dark-border bg-[#1c1c1f] px-2 text-xs font-semibold focus:border-[#e24c30] focus:outline-none focus:ring-1 focus:ring-[#e24c30] transition",
          inputClass || "text-text-primary"
        )}
      />
    </div>
  );
}

function ResultCard({ title, value, footer, valueClassName, highlight }: any) {
  return (
    <div className={cn("rounded-lg flex flex-col", highlight ? "bg-[#1c1c1f] border border-dark-border p-3" : "px-1")}>
      <p className="text-[10px] text-text-secondary uppercase tracking-wider leading-tight">{title}</p>
      <p className={cn("mt-0.5 text-2xl font-bold font-heading break-words leading-tight", valueClassName || "text-white")}>
        {value}
      </p>
      <p className="mt-0.5 text-[9px] text-text-secondary">{footer}</p>
    </div>
  );
}

function InlineInfoTooltip({
  text,
  iconClassName,
}: {
  text: string;
  iconClassName?: string;
}) {
  return (
    <div className="group relative flex items-center shrink-0">
      <Info className={cn("w-3.5 h-3.5 cursor-help", iconClassName || "text-text-secondary")} />
      <div className="pointer-events-none absolute right-0 top-full mt-2 w-max max-w-[260px] bg-[#232328] border border-dark-border text-[10px] text-white px-2.5 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50 text-center shadow-lg whitespace-normal leading-tight">
        {text}
      </div>
    </div>
  );
}