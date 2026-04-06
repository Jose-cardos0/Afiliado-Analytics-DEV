"use client";

import { useState } from "react";
import { IdCard, KeyRound, Trash2, AlertTriangle, ExternalLink } from "lucide-react";

interface MercadoLivreIntegrationCardProps {
  initialClientId: string;
  initialHasSecret: boolean;
  initialLast4: string | null;
}

const DOCS_URL = "https://developers.mercadolivre.com.br/pt_br/registre-o-seu-aplicativo";
const CREATE_APP_DOCS_URL =
  "https://developers.mercadolivre.com.br/pt_br/crie-uma-aplicacao-no-mercado-livre";

export default function MercadoLivreIntegrationCard({
  initialClientId,
  initialHasSecret,
  initialLast4,
}: MercadoLivreIntegrationCardProps) {
  const [clientId, setClientId] = useState(initialClientId);
  const [clientSecret, setClientSecret] = useState("");
  const [hasSecret, setHasSecret] = useState(initialHasSecret);
  const [last4, setLast4] = useState<string | null>(initialLast4);

  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const hasIntegration = !!clientId || hasSecret;

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setOk(false);

    try {
      const res = await fetch("/api/settings/mercadolivre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mercadolivre_client_id: clientId,
          mercadolivre_client_secret: clientSecret,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao salvar");

      setClientSecret("");

      const status = await fetch("/api/settings/mercadolivre").then((r) => r.json());
      setHasSecret(!!status?.has_secret);
      setLast4(status?.last4 ?? null);

      setOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setSaving(false);
    }
  };

  const onRemove = async () => {
    setRemoving(true);
    setError(null);

    try {
      const res = await fetch("/api/settings/mercadolivre", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao remover");

      setClientId("");
      setClientSecret("");
      setHasSecret(false);
      setLast4(null);
      setConfirmRemove(false);
      setOk(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <section className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
      <div className="bg-dark-bg/40 border-b border-dark-border px-5 py-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg font-semibold text-text-primary font-heading">
          Mercado Livre (API Developers)
        </h2>

        {hasIntegration && !confirmRemove && (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remover integração
          </button>
        )}
      </div>

      <div className="px-5 py-5 space-y-4">
        {confirmRemove && (
          <div className="flex items-start gap-3 p-4 rounded-lg border border-red-500/30 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-400">Remover credenciais?</p>
              <p className="text-xs text-text-secondary mt-0.5">
                O app deixará de associar chamadas à sua aplicação no ML. A busca pública de anúncios pode continuar funcionando sem chaves.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={onRemove}
                  disabled={removing}
                  className="px-3 py-1.5 rounded-md bg-red-500 text-white text-xs font-semibold hover:bg-red-600 disabled:opacity-60 transition-colors"
                >
                  {removing ? "Removendo..." : "Confirmar remoção"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRemove(false)}
                  disabled={removing}
                  className="px-3 py-1.5 rounded-md border border-dark-border text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
            <IdCard className="h-4 w-4 text-amber-400" />
            ID do aplicativo (Client ID)
          </label>
          <input
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setOk(false);
            }}
            placeholder="Cole o ID do aplicativo (Meus aplicativos)"
            className="mt-2 w-full rounded-md border border-dark-border bg-dark-bg py-2 px-3 text-text-primary placeholder-text-secondary/60 focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/40 sm:text-sm"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
            <KeyRound className="h-4 w-4 text-amber-400" />
            Chave secreta (Client Secret)
          </label>
          <input
            type="password"
            value={clientSecret}
            onChange={(e) => {
              setClientSecret(e.target.value);
              setOk(false);
            }}
            placeholder={
              hasSecret
                ? `Secret atual: ••••${last4} — cole para substituir`
                : "Cole a chave secreta do painel Meus aplicativos"
            }
            className="mt-2 w-full rounded-md border border-dark-border bg-dark-bg py-2 px-3 text-text-primary placeholder-text-secondary/60 focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/40 sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-md px-5 py-2 text-sm font-semibold text-dark-bg bg-amber-400 hover:bg-amber-300 disabled:opacity-60 transition-colors"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>

          {ok && <span className="text-sm text-green-400">Salvo com sucesso.</span>}
          {error && <span className="text-sm text-red-400">{error}</span>}
        </div>

      

        <div className="flex flex-col gap-2">
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:underline w-fit"
          >
            Documentação — registrar aplicativo
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href={CREATE_APP_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:underline w-fit"
          >
            Como conseguir Client ID e Secret (chave da API no Mercado Livre)
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </section>
  );
}
