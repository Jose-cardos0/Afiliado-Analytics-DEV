"use client";

import { useState, useEffect } from "react";
import { Target, Loader2, Zap } from "lucide-react";
import {
  META_COUNTRIES,
  META_PUBLISHER_PLATFORMS,
  META_SALES_CONVERSION_EVENTS,
  getOptimizationGoalsForObjective,
  getDefaultGoalForObjective,
} from "@/lib/meta-ads-constants";

type Pixel = { id: string; name: string };

export type MetaAdSetFormBody = {
  name: string;
  daily_budget: number;
  country_code: string;
  age_min: number;
  age_max: number;
  gender: "all" | "male" | "female";
  optimization_goal: string;
  pixel_id?: string;
  conversion_event?: string;
  publisher_platforms: string[];
};

type Props = {
  campaignId: string;
  adAccountId: string;
  campaignName?: string;
  defaultName?: string;
  defaultBudget?: string;
  defaultCountry?: string;
  defaultAgeMin?: string;
  defaultAgeMax?: string;
  defaultGender?: "all" | "male" | "female";
  defaultOptimizationGoal?: string;
  defaultPixelId?: string;
  defaultConversionEvent?: string;
  defaultPublisherPlatforms?: string[];
  submitLabel?: string;
  onSubmit: (body: MetaAdSetFormBody) => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
};

function platformsRecordFromList(list?: string[]) {
  const set = new Set((list?.length ? list : ["facebook", "instagram"]).map((x) => String(x).toLowerCase()));
  return Object.fromEntries(META_PUBLISHER_PLATFORMS.map((p) => [p.value, set.has(p.value)])) as Record<string, boolean>;
}

export default function MetaAdSetForm({
  campaignId,
  adAccountId,
  campaignName,
  defaultName = "",
  defaultBudget = "10",
  defaultCountry = "BR",
  defaultAgeMin = "18",
  defaultAgeMax = "65",
  defaultGender = "all",
  defaultOptimizationGoal = "LINK_CLICKS",
  defaultPixelId = "",
  defaultConversionEvent = "PURCHASE",
  defaultPublisherPlatforms,
  submitLabel,
  onSubmit,
  onCancel,
  saving,
  error,
}: Props) {
  const [name, setName] = useState(defaultName);
  const [dailyBudget, setDailyBudget] = useState(defaultBudget);
  const [countryCode, setCountryCode] = useState(defaultCountry);
  const [ageMin, setAgeMin] = useState(defaultAgeMin);
  const [ageMax, setAgeMax] = useState(defaultAgeMax);
  const [gender, setGender] = useState<"all" | "male" | "female">(defaultGender);
  const [optimizationGoal, setOptimizationGoal] = useState(defaultOptimizationGoal);
  const [pixelId, setPixelId] = useState(defaultPixelId);
  const [conversionEvent, setConversionEvent] = useState(
    defaultConversionEvent || (defaultOptimizationGoal === "OFFSITE_CONVERSIONS" ? "PURCHASE" : "PURCHASE")
  );
  const [publisherPlatforms, setPublisherPlatforms] = useState<Record<string, boolean>>(() =>
    platformsRecordFromList(defaultPublisherPlatforms)
  );
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [campaignObjective, setCampaignObjective] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) return;
    let cancelled = false;
    fetch(`/api/meta/campaigns?campaign_id=${encodeURIComponent(campaignId)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && !json.error) setCampaignObjective((json.objective ?? "OUTCOME_TRAFFIC").toUpperCase());
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [campaignId]);

  const isSales = campaignObjective === "OUTCOME_SALES";
  const allowedGoals = getOptimizationGoalsForObjective(campaignObjective ?? "OUTCOME_TRAFFIC");
  const goalOk = isSales || allowedGoals.some((o) => o.value === optimizationGoal);

  useEffect(() => {
    if (campaignObjective == null) return;
    if (isSales) {
      setOptimizationGoal("OFFSITE_CONVERSIONS");
      setConversionEvent((e) => (e === "ADD_TO_CART" || e === "PURCHASE" ? e : "PURCHASE"));
      return;
    }
    const allowed = getOptimizationGoalsForObjective(campaignObjective);
    if (!allowed.some((o) => o.value === optimizationGoal)) {
      setOptimizationGoal(getDefaultGoalForObjective(campaignObjective));
      setPixelId("");
      setConversionEvent("PURCHASE");
    }
  }, [campaignObjective, isSales, optimizationGoal]);

  useEffect(() => {
    if (!adAccountId) return;
    let cancelled = false;
    fetch(`/api/meta/pixels?ad_account_id=${encodeURIComponent(adAccountId)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json.pixels) setPixels(json.pixels);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [adAccountId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const budgetCents = Math.round(parseFloat(dailyBudget || "0") * 100);
    if (budgetCents < 100) return;
    const pubList = META_PUBLISHER_PLATFORMS.map((p) => p.value).filter((p) => publisherPlatforms[p]);
    if (pubList.length === 0) return;
    if (isSales && (!pixelId.trim() || !["PURCHASE", "ADD_TO_CART"].includes(conversionEvent))) return;
    onSubmit({
      name: name.trim(),
      daily_budget: budgetCents,
      country_code: countryCode,
      age_min: parseInt(ageMin, 10) || 18,
      age_max: parseInt(ageMax, 10) || 65,
      gender,
      optimization_goal: isSales ? "OFFSITE_CONVERSIONS" : optimizationGoal,
      pixel_id: pixelId.trim() || undefined,
      conversion_event: isSales
        ? conversionEvent
        : pixelId.trim()
          ? conversionEvent || undefined
          : undefined,
      publisher_platforms: pubList,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
        <Target className="h-5 w-5 text-shopee-orange" />
        Conjunto de anúncios
      </h3>
      {campaignName && (
        <p className="text-sm text-text-secondary">Campanha: <strong className="text-text-primary">{campaignName}</strong></p>
      )}
      <p className="text-sm text-text-secondary">
        Orçamento, público, plataformas (Facebook, Instagram, etc.) e otimização conforme o objetivo da campanha.
      </p>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Nome do conjunto</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Conjunto BR 18-45"
          className="w-full rounded-md border border-dark-border bg-dark-bg py-2 px-3 text-text-primary text-sm placeholder-text-secondary/60"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Orçamento diário (R$)</label>
        <input
          type="number"
          min="1"
          step="0.01"
          value={dailyBudget}
          onChange={(e) => setDailyBudget(e.target.value)}
          className="w-full rounded-md border border-dark-border bg-dark-bg py-2 px-3 text-text-primary text-sm"
        />
        <p className="text-xs text-text-secondary mt-1">Mínimo R$ 1,00. Ex: 10 = R$ 10/dia.</p>
      </div>

      {campaignObjective == null ? (
        <p className="text-sm text-text-secondary flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando objetivo da campanha…
        </p>
      ) : isSales ? (
        <>
          <div className="rounded-lg border border-dark-border/60 bg-dark-bg/20 p-3 space-y-3">
            <p className="text-xs text-text-secondary">Campanha de <strong className="text-text-primary">vendas</strong>: otimização para compras ou carrinho no site (pixel obrigatório).</p>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Pixel</label>
              <select
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                className="w-full rounded-md border border-dark-border bg-dark-bg py-2 px-3 text-text-primary text-sm"
              >
                <option value="">Selecione o pixel</option>
                {pixels.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Evento para otimizar</label>
              <select
                value={conversionEvent}
                onChange={(e) => setConversionEvent(e.target.value)}
                className="w-full rounded-md border border-dark-border bg-dark-bg py-2 px-3 text-text-primary text-sm"
              >
                {META_SALES_CONVERSION_EVENTS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Meta de desempenho</label>
            <select
              value={goalOk ? optimizationGoal : getDefaultGoalForObjective(campaignObjective)}
              onChange={(e) => {
                const v = e.target.value;
                setOptimizationGoal(v);
                if (!["OFFSITE_CONVERSIONS", "VALUE", "CONVERSIONS"].includes(v)) {
                  setPixelId("");
                  setConversionEvent("PURCHASE");
                }
              }}
              className="w-full rounded-md border border-dark-border bg-dark-bg py-2 px-3 text-text-primary text-sm"
            >
              {allowedGoals.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {["OFFSITE_CONVERSIONS", "VALUE", "CONVERSIONS"].includes(goalOk ? optimizationGoal : getDefaultGoalForObjective(campaignObjective)) && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Conjunto de dados (Pixel)</label>
                <select
                  value={pixelId}
                  onChange={(e) => setPixelId(e.target.value)}
                  className="w-full rounded-md border border-dark-border bg-dark-bg py-2 px-3 text-text-primary text-sm"
                >
                  <option value="">Nenhum</option>
                  {pixels.map((p) => (
                    <option key={p.id} value={p.id}>{p.name || p.id}</option>
                  ))}
                </select>
              </div>
              {pixelId && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Evento de conversão</label>
                  <select
                    value={conversionEvent}
                    onChange={(e) => setConversionEvent(e.target.value)}
                    className="w-full rounded-md border border-dark-border bg-dark-bg py-2 px-3 text-text-primary text-sm"
                  >
                    <option value="PURCHASE">Comprar</option>
                    <option value="ADD_TO_CART">Adicionar ao carrinho</option>
                    <option value="LEAD">Lead</option>
                    <option value="COMPLETE_REGISTRATION">Cadastro completo</option>
                    <option value="INITIATE_CHECKOUT">Iniciar checkout</option>
                    <option value="VIEW_CONTENT">Visualizar conteúdo</option>
                    <option value="PAGE_VIEW">Visualização de página</option>
                  </select>
                </div>
              )}
            </>
          )}
        </>
      )}

      <div className="rounded-lg border border-dark-border/60 bg-dark-bg/20 p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <Zap className="h-4 w-4 text-shopee-orange" /> Plataformas
        </div>
        <div className="grid grid-cols-2 gap-2">
          {META_PUBLISHER_PLATFORMS.map((p) => (
            <label key={p.value} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(publisherPlatforms[p.value])}
                onChange={() => setPublisherPlatforms((prev) => ({ ...prev, [p.value]: !prev[p.value] }))}
                className="rounded border-dark-border"
              />
              {p.label}
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPublisherPlatforms(Object.fromEntries(META_PUBLISHER_PLATFORMS.map((x) => [x.value, true])))}
          className="text-xs text-shopee-orange hover:underline"
        >
          Marcar todas
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">País</label>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-full rounded-md border border-dark-border bg-dark-bg py-2 px-3 text-text-primary text-sm"
          >
            {META_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-primary mb-1">Idade mín.</label>
            <input
              type="number"
              min="18"
              max="65"
              value={ageMin}
              onChange={(e) => setAgeMin(e.target.value)}
              className="w-full rounded-md border border-dark-border bg-dark-bg py-2 px-3 text-text-primary text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-primary mb-1">Idade máx.</label>
            <input
              type="number"
              min="18"
              max="65"
              value={ageMax}
              onChange={(e) => setAgeMax(e.target.value)}
              className="w-full rounded-md border border-dark-border bg-dark-bg py-2 px-3 text-text-primary text-sm"
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Gênero</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as "all" | "male" | "female")}
          className="w-full rounded-md border border-dark-border bg-dark-bg py-2 px-3 text-text-primary text-sm"
        >
          <option value="all">Todos</option>
          <option value="male">Masculino</option>
          <option value="female">Feminino</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
      )}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-dark-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-dark-bg"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!name.trim() || saving || campaignObjective == null}
          className="flex items-center gap-2 rounded-md bg-shopee-orange px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitLabel ?? "Criar conjunto"}
        </button>
      </div>
    </form>
  );
}
