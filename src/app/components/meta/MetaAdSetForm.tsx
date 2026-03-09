"use client";

import { useState, useEffect } from "react";
import { Target, Loader2 } from "lucide-react";
import {
  META_OPTIMIZATION_GOALS,
  META_COUNTRIES,
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
  /** Rótulo do botão de envio (ex.: "Salvar edição" no modo editar). */
  submitLabel?: string;
  onSubmit: (body: MetaAdSetFormBody) => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
};

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
  defaultConversionEvent = "",
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
  const [conversionEvent, setConversionEvent] = useState(defaultConversionEvent);
  const [pixels, setPixels] = useState<Pixel[]>([]);

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
    onSubmit({
      name: name.trim(),
      daily_budget: budgetCents,
      country_code: countryCode,
      age_min: parseInt(ageMin, 10) || 18,
      age_max: parseInt(ageMax, 10) || 65,
      gender,
      optimization_goal: optimizationGoal,
      pixel_id: pixelId || undefined,
      conversion_event: conversionEvent || undefined,
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
        Orçamento diário, público (país, idade, gênero), meta de desempenho e opcionalmente pixel/evento de conversão.
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
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Meta de desempenho</label>
        <select
          value={optimizationGoal}
          onChange={(e) => {
            const v = e.target.value;
            setOptimizationGoal(v);
            if (!["OFFSITE_CONVERSIONS", "VALUE", "CONVERSIONS"].includes(v)) {
              setPixelId("");
              setConversionEvent("");
            }
          }}
          className="w-full rounded-md border border-dark-border bg-dark-bg py-2 px-3 text-text-primary text-sm"
        >
          {META_OPTIMIZATION_GOALS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      {["OFFSITE_CONVERSIONS", "VALUE", "CONVERSIONS"].includes(optimizationGoal) && (
        <>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Conjunto de dados (Pixel)</label>
            <select
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
              className="w-full rounded-md border border-dark-border bg-dark-bg py-2 px-3 text-text-primary text-sm"
            >
              <option value="">Nenhum (tráfego/cliques)</option>
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
                <option value="">Nenhum</option>
                <option value="PURCHASE">Comprar (Purchase)</option>
                <option value="LEAD">Lead</option>
                <option value="COMPLETE_REGISTRATION">Cadastro completo</option>
                <option value="ADD_TO_CART">Adicionar ao carrinho</option>
                <option value="INITIATE_CHECKOUT">Iniciar checkout</option>
                <option value="VIEW_CONTENT">Visualizar conteúdo</option>
                <option value="PAGE_VIEW">Visualização de página</option>
              </select>
            </div>
          )}
        </>
      )}
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
          disabled={!name.trim() || saving}
          className="flex items-center gap-2 rounded-md bg-shopee-orange px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitLabel ?? "Criar conjunto"}
        </button>
      </div>
    </form>
  );
}
