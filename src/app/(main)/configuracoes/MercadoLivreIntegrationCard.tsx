"use client";

import { useState, useEffect } from "react";
import { Tag, KeyRound, ExternalLink } from "lucide-react";
import {
  ML_EXT_AFFILIATE_TAG_LS_KEY,
  ML_EXT_SESSION_LS_KEY,
} from "@/lib/mercadolivre/ml-session-cookie";
import { dispatchMlAffiliateSettingsChanged } from "@/lib/mercadolivre/use-ml-affiliate-local-settings";

const LINKBUILDER = "https://www.mercadolivre.com.br/afiliados/linkbuilder#hub";

export default function MercadoLivreIntegrationCard() {
  const [affiliateTag, setAffiliateTag] = useState("");
  const [sessionToken, setSessionToken] = useState("");

  useEffect(() => {
    try {
      setAffiliateTag(localStorage.getItem(ML_EXT_AFFILIATE_TAG_LS_KEY) ?? "");
      setSessionToken(localStorage.getItem(ML_EXT_SESSION_LS_KEY) ?? "");
    } catch {
      /* ignore */
    }
  }, []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const onSave = () => {
    setError(null);
    setOk(false);
    const tag = affiliateTag.trim();
    const tok = sessionToken.trim();
    if (!tag) {
      setError("Informe a etiqueta em uso (obrigatória).");
      return;
    }
    if (!tok) {
      setError("Informe o token de sessão da extensão (obrigatório).");
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(tag)) {
      setError("Etiqueta inválida: use só letras, números, _ ou -.");
      return;
    }
    setSaving(true);
    try {
      localStorage.setItem(ML_EXT_AFFILIATE_TAG_LS_KEY, tag);
      localStorage.setItem(ML_EXT_SESSION_LS_KEY, tok);
      dispatchMlAffiliateSettingsChanged();
      setOk(true);
    } catch {
      setError("Não foi possível salvar no navegador.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
      <div className="bg-dark-bg/40 border-b border-dark-border px-5 py-4">
        <h2 className="text-base sm:text-lg font-semibold text-text-primary font-heading">
          Mercado Livre — Afiliados
        </h2>
        <p className="text-xs text-text-secondary mt-1">
          Etiqueta e token ficam só no seu navegador. Usados na Lista de Ofertas ML (busca, meli.la e
          atualização de preços). A comissão exibida nos cards vem do texto <strong className="text-text-primary">GANHOS X%</strong>{" "}
          na página do anúncio quando você usa o token.
        </p>
      </div>

      <div className="px-5 py-5 space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
            <Tag className="h-4 w-4 text-amber-400" />
            Etiqueta em uso <span className="text-red-400 font-normal">*</span>
          </label>
          <input
            value={affiliateTag}
            onChange={(e) => {
              setAffiliateTag(e.target.value);
              setOk(false);
            }}
            placeholder="cake9265169"
            autoComplete="off"
            spellCheck={false}
            className="mt-2 w-full rounded-md border border-dark-border bg-dark-bg py-2 px-3 text-text-primary placeholder-text-secondary/60 focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/40 sm:text-sm"
          />
          <p className="text-[11px] text-text-secondary mt-1">A mesma tag do linkbuilder oficial do ML.</p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
            <KeyRound className="h-4 w-4 text-amber-400" />
            Token de sessão (extensão) <span className="text-red-400 font-normal">*</span>
          </label>
          <input
            type="password"
            value={sessionToken}
            onChange={(e) => {
              setSessionToken(e.target.value);
              setOk(false);
            }}
            placeholder="c3NpZD0… ou ssid=…"
            autoComplete="off"
            spellCheck={false}
            className="mt-2 w-full rounded-md border border-dark-border bg-dark-bg py-2 px-3 text-text-primary placeholder-text-secondary/60 focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/40 sm:text-sm"
          />
          <p className="text-[11px] text-text-secondary mt-1">
            Copie da extensão (base64 ou <code className="text-amber-400/90">ssid=</code>). Obrigatório para
            o servidor simular sua sessão de afiliado no ML.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-md px-5 py-2 text-sm font-semibold text-dark-bg bg-amber-400 hover:bg-amber-300 disabled:opacity-60 transition-colors"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
          {ok && <span className="text-sm text-green-400">Salvo no navegador.</span>}
          {error && <span className="text-sm text-red-400">{error}</span>}
        </div>

        <a
          href={LINKBUILDER}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:underline w-fit"
        >
          Abrir linkbuilder oficial do Mercado Livre
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </section>
  );
}
