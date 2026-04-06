"use client";

import { useState, useEffect, useCallback, useMemo, useId } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { GeradorPaginationBar } from "@/app/components/shopee/GeradorPaginationBar";
import {
  Loader2,
  Trash2,
  ExternalLink,
  FolderMinus,
  ChevronDown,
  ChevronRight,
  Search,
  ArrowLeft,
  ListChecks,
  Link2,
  Columns2,
  RefreshCw,
  Store,
  X,
  Plus,
} from "lucide-react";
import ConfirmModal from "@/app/components/ui/ConfirmModal";
import Toolist from "@/app/components/ui/Toolist";
import { extractMlbIdFromUrl, looksLikeMercadoLivreProductUrl } from "@/lib/mercadolivre/extract-mlb-id";
import { effectiveListaOfferPromoPrice } from "@/lib/lista-ofertas-effective-promo";


type Lista = { id: string; nome: string; totalItens: number; createdAt?: string };
type Item = {
  id: string;
  listaId: string;
  imageUrl: string;
  productName: string;
  priceOriginal: number | null;
  pricePromo: number | null;
  discountRate: number | null;
  converterLink: string;
  createdAt: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(value);
}

function displayPrecoPorLista(item: Item): string {
  const por =
    effectiveListaOfferPromoPrice(item.priceOriginal, item.pricePromo, item.discountRate) ?? item.pricePromo;
  return por != null ? formatCurrency(por) : "—";
}

const MAX_BULK_PAIRS = 60;

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-dark-border bg-dark-bg text-sm text-text-primary placeholder:text-text-secondary/60";
const textareaClass =
  "w-full px-3 py-2 rounded-lg border border-dark-border bg-dark-bg text-xs sm:text-sm font-mono text-text-primary placeholder:text-text-secondary/50 min-h-[160px]";
const labelClass = "block text-xs font-medium text-text-secondary mb-1.5";

const mlModalOverlayClass =
  "fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-[2px]";
const mlModalShellClass =
  "w-full flex flex-col rounded-2xl border border-dark-border bg-dark-card shadow-2xl overflow-hidden";
const mlModalHeaderClass = "shrink-0 px-4 pt-4 pb-3 border-b border-dark-border/60 bg-dark-bg/40";
const mlModalSearchInputClass =
  "w-full rounded-xl border border-dark-border bg-dark-bg py-2.5 pl-10 pr-3 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-shopee-orange/60 focus:ring-1 focus:ring-shopee-orange/20";
const mlModalListScrollClass = "flex-1 min-h-0 overflow-y-auto p-3 scrollbar-shopee space-y-2";
const mlModalFooterClass = "shrink-0 flex justify-end gap-2 px-4 py-3 border-t border-dark-border/60 bg-dark-bg/30";
const mlPickerRowClass = (selected: boolean) =>
  `w-full text-left rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
    selected
      ? "border-shopee-orange/50 bg-shopee-orange/10 text-text-primary"
      : "border-dark-border/60 bg-dark-bg/30 text-text-secondary hover:border-shopee-orange/30"
  }`;

function linesFromTextarea(s: string): string[] {
  return s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

function isMeliLaShort(u: string): boolean {
  try {
    const h = new URL(u.trim()).hostname.toLowerCase();
    return h === "meli.la" || h === "www.meli.la";
  } catch {
    return false;
  }
}

/** Quando o resolve do ML falha, deriva um título legível da URL. */
function fallbackNameFromProductUrl(url: string, lineIndex: number): string {
  try {
    const u = new URL(url);
    const seg = u.pathname.split("/").filter(Boolean).pop() ?? "";
    let base = decodeURIComponent(seg).replace(/\+/g, " ");
    base = base.replace(/-/g, " ").replace(/_/g, " ");
    base = base.replace(/\bMLB-?\d+\s*/gi, "").trim();
    if (base.length > 3) return base.slice(0, 150);
  } catch {
    /* ignore */
  }
  return `Produto (linha ${lineIndex + 1})`;
}

export default function MinhaListaOfertasMlPage() {
  const [listas, setListas] = useState<Lista[]>([]);
  const [itemsByLista, setItemsByLista] = useState<Record<string, Item[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingListaId, setLoadingListaId] = useState<string | null>(null);
  const [expandedListas, setExpandedListas] = useState<Set<string>>(new Set());
  const [filterByLista, setFilterByLista] = useState<Record<string, string>>({});
  const [pageByLista, setPageByLista] = useState<Record<string, number>>({});
  const [confirmState, setConfirmState] = useState<{
    type: "deleteItem" | "emptyList" | "deleteList";
    title: string;
    message: string;
    confirmLabel: string;
    variant: "danger" | "default";
    payload: { itemId?: string; listaId: string };
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const ITEMS_PER_PAGE = 5;
  const LISTAS_PER_PAGE = 4;
  const [listasPage, setListasPage] = useState(1);

  const [criandoLista, setCriandoLista] = useState(false);
  const [listasMenuModalOpen, setListasMenuModalOpen] = useState(false);
  const [criarListaModalOpen, setCriarListaModalOpen] = useState(false);
  const [criarListaModalPurpose, setCriarListaModalPurpose] = useState<"menu" | "bulkNewList">("menu");
  const [nomeListaCriar, setNomeListaCriar] = useState("");
  const [selecionarListaModalOpen, setSelecionarListaModalOpen] = useState(false);
  const [listaPickerQuery, setListaPickerQuery] = useState("");
  const [listaPickerDraftId, setListaPickerDraftId] = useState("");
  const listasMenuTitleId = useId();
  const criarListaTitleId = useId();
  const ondeSalvarTitleId = useId();

  const [addListaId, setAddListaId] = useState("");
  const [affiliateLink, setAffiliateLink] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [discountRate, setDiscountRate] = useState("");
  const [salvandoItem, setSalvandoItem] = useState(false);

  const [bulkProductUrls, setBulkProductUrls] = useState("");
  const [bulkAffiliateUrls, setBulkAffiliateUrls] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [refreshTarget, setRefreshTarget] = useState<string | null>(null);

  const bulkProductLines = useMemo(() => linesFromTextarea(bulkProductUrls), [bulkProductUrls]);
  const bulkAffiliateLines = useMemo(() => linesFromTextarea(bulkAffiliateUrls), [bulkAffiliateUrls]);
  const bulkPairMatch =
    bulkProductLines.length > 0 &&
    bulkAffiliateLines.length > 0 &&
    bulkProductLines.length === bulkAffiliateLines.length;

  const totalListasPages = Math.max(1, Math.ceil(listas.length / LISTAS_PER_PAGE));
  const pagedListas = useMemo(() => {
    const from = (listasPage - 1) * LISTAS_PER_PAGE;
    return listas.slice(from, from + LISTAS_PER_PAGE);
  }, [listas, listasPage]);

  useEffect(() => {
    setListasPage((p) => Math.min(Math.max(1, p), totalListasPages));
  }, [listas.length, totalListasPages]);

  const loadListas = useCallback(async () => {
    try {
      const res = await fetch("/api/mercadolivre/minha-lista-ofertas/listas");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao carregar listas");
      setListas(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar listas");
      setListas([]);
    }
  }, []);

  const loadItems = useCallback(async (listaId: string) => {
    setLoadingListaId(listaId);
    try {
      const res = await fetch(`/api/mercadolivre/minha-lista-ofertas?lista_id=${listaId}`);
      const json = await res.json();
      if (!res.ok) return;
      setItemsByLista((prev) => ({ ...prev, [listaId]: Array.isArray(json?.data) ? json.data : [] }));
    } catch {
      setItemsByLista((prev) => ({ ...prev, [listaId]: [] }));
    } finally {
      setLoadingListaId(null);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    loadListas().finally(() => setLoading(false));
  }, [loadListas]);

  useEffect(() => {
    listas.forEach((l) => loadItems(l.id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listas]);

  useEffect(() => {
    if (listas.length > 0 && !addListaId) setAddListaId(listas[0].id);
  }, [listas, addListaId]);

  useEffect(() => {
    const anyOpen = listasMenuModalOpen || selecionarListaModalOpen || criarListaModalOpen;
    if (!anyOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (criarListaModalOpen && !criandoLista && !bulkSaving) setCriarListaModalOpen(false);
      else if (selecionarListaModalOpen) setSelecionarListaModalOpen(false);
      else if (listasMenuModalOpen) setListasMenuModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [listasMenuModalOpen, selecionarListaModalOpen, criarListaModalOpen, criandoLista, bulkSaving]);

  const selectedLista = useMemo(() => listas.find((l) => l.id === addListaId), [listas, addListaId]);

  const listasFiltradasPicker = useMemo(() => {
    const q = listaPickerQuery.trim().toLowerCase();
    if (!q) return listas;
    return listas.filter((l) => l.nome.toLowerCase().includes(q));
  }, [listas, listaPickerQuery]);

  const resolveRowMeta = useCallback(async (
    row: { productUrl: string | null; affiliateUrl: string },
  ): Promise<{ nome: string; img: string; po: number | null; pp: number | null; dr: number | null }> => {
    let nome = "";
    let img = "";
    let po: number | null = null;
    let pp: number | null = null;
    let dr: number | null = null;
    const apply = (d: Record<string, unknown> | undefined) => {
      if (!d) return;
      if (d.productName) nome = String(d.productName);
      if (d.imageUrl) img = String(d.imageUrl);
      if (d.priceOriginal != null) po = Number(d.priceOriginal);
      if (d.pricePromo != null) pp = Number(d.pricePromo);
      if (d.discountRate != null) dr = Number(d.discountRate);
    };
    const callResolve = async (body: Record<string, string>) => {
      const resMeta = await fetch("/api/mercadolivre/resolve-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const jsonMeta = await resMeta.json();
      if (resMeta.ok && jsonMeta?.data) apply(jsonMeta.data as Record<string, unknown>);
    };
    const p = row.productUrl?.trim() ?? "";
    const a = row.affiliateUrl?.trim() ?? "";
    try {
      if (p && (looksLikeMercadoLivreProductUrl(p) || !!extractMlbIdFromUrl(p))) {
        await callResolve({ productUrl: p });
      }
      if (!nome && a && (looksLikeMercadoLivreProductUrl(a) || !!extractMlbIdFromUrl(a))) {
        await callResolve({ productUrl: a });
      }
    } catch {
      /* mantém fallback de nome abaixo */
    }
    return { nome, img, po, pp, dr };
  }, []);

  const runBulkRows = useCallback(
    async (listaIdTarget: string, rows: { productUrl: string; affiliateUrl: string }[]) => {
      for (let i = 0; i < rows.length; i++) {
        const { productUrl: pUrl, affiliateUrl: aff } = rows[i];
        let { nome, img, po, pp, dr } = await resolveRowMeta(rows[i]);
        if (!nome && pUrl) nome = fallbackNameFromProductUrl(pUrl, i);
        if (!nome) nome = `Produto (linha ${i + 1})`;
        const adj = effectiveListaOfferPromoPrice(po, pp, dr);
        if (adj != null) pp = adj;
        const res = await fetch("/api/mercadolivre/minha-lista-ofertas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listaId: listaIdTarget,
            converterLink: aff,
            productName: nome,
            imageUrl: img,
            priceOriginal: po != null && Number.isFinite(po) ? po : null,
            pricePromo: pp != null && Number.isFinite(pp) ? pp : null,
            discountRate: dr != null && Number.isFinite(dr) ? dr : null,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error ?? `Falha na linha ${i + 1} (${nome.slice(0, 36)}…).`);
        }
        setBulkProgress({ done: i + 1, total: rows.length });
      }
      await loadItems(listaIdTarget);
      await loadListas();
      setBulkProductUrls("");
      setBulkAffiliateUrls("");
      setBulkProgress(null);
    },
    [resolveRowMeta, loadItems, loadListas],
  );

  const openCriarListaFromMenu = () => {
    setListasMenuModalOpen(false);
    setCriarListaModalPurpose("menu");
    setNomeListaCriar("");
    setCriarListaModalOpen(true);
  };

  const openOndeSalvarFromMenu = () => {
    setListasMenuModalOpen(false);
    setListaPickerQuery("");
    setListaPickerDraftId(addListaId || listas[0]?.id || "");
    setSelecionarListaModalOpen(true);
  };

  const confirmListaPicker = () => {
    if (listaPickerDraftId) setAddListaId(listaPickerDraftId);
    setSelecionarListaModalOpen(false);
    setListaPickerQuery("");
  };

  const closeListaPicker = () => {
    setSelecionarListaModalOpen(false);
    setListaPickerQuery("");
  };

  const submitCriarListaModal = async () => {
    const purpose = criarListaModalPurpose;
    const nomeDefault =
      purpose === "bulkNewList" ? `Lista ML ${new Date().toLocaleDateString("pt-BR")}` : "Nova lista ML";
    const nome = nomeListaCriar.trim() || nomeDefault;
    setCriandoLista(true);
    setError(null);
    try {
      if (purpose === "bulkNewList") {
        const products = linesFromTextarea(bulkProductUrls);
        const affiliates = linesFromTextarea(bulkAffiliateUrls);
        if (products.length === 0) {
          setError("Cole pelo menos uma URL de produto antes de criar a lista e importar.");
          return;
        }
        if (products.length !== affiliates.length) {
          setError(
            `As duas caixas precisam ter o mesmo número de linhas. Produtos: ${products.length}, afiliados: ${affiliates.length}.`,
          );
          return;
        }
        if (products.length > MAX_BULK_PAIRS) {
          setError(`Máximo de ${MAX_BULK_PAIRS} linhas por vez.`);
          return;
        }
      }

      const res = await fetch("/api/mercadolivre/minha-lista-ofertas/listas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao criar lista");
      const row = json.data;
      if (!row?.id) throw new Error("Lista criada sem identificador.");

      setListas((prev) => [{ id: row.id, nome: row.nome, totalItens: 0, createdAt: row.createdAt }, ...prev]);
      setAddListaId(row.id);
      setCriarListaModalOpen(false);
      setNomeListaCriar("");

      if (purpose === "bulkNewList") {
        const products = linesFromTextarea(bulkProductUrls);
        const affiliates = linesFromTextarea(bulkAffiliateUrls);
        const rows = products.map((productUrl, i) => ({ productUrl, affiliateUrl: affiliates[i] }));
        setBulkSaving(true);
        setBulkProgress({ done: 0, total: rows.length });
        setError(null);
        try {
          await runBulkRows(row.id, rows);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Erro ao salvar em lote");
          setBulkProgress(null);
        } finally {
          setBulkSaving(false);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar lista");
    } finally {
      setCriandoLista(false);
    }
  };

  const runBulkSaveSelected = async () => {
    const products = linesFromTextarea(bulkProductUrls);
    const affiliates = linesFromTextarea(bulkAffiliateUrls);
    if (products.length === 0) {
      setError("Cole pelo menos uma URL de página de produto do Mercado Livre (uma por linha).");
      return;
    }
    if (products.length !== affiliates.length) {
      setError(
        `As duas caixas precisam ter o mesmo número de linhas. Produtos: ${products.length}, links de afiliado: ${affiliates.length}.`,
      );
      return;
    }
    const rows = products.map((productUrl, i) => ({ productUrl, affiliateUrl: affiliates[i] }));
    if (rows.length > MAX_BULK_PAIRS) {
      setError(`Máximo de ${MAX_BULK_PAIRS} linhas por vez. Faça em duas etapas.`);
      return;
    }
    if (!addListaId) {
      setError("Escolha uma lista em Listas → Onde salvar.");
      return;
    }

    setBulkSaving(true);
    setBulkProgress({ done: 0, total: rows.length });
    setError(null);
    try {
      await runBulkRows(addListaId, rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar em lote");
      setBulkProgress(null);
    } finally {
      setBulkSaving(false);
    }
  };

  const openBulkNewListModal = () => {
    const products = linesFromTextarea(bulkProductUrls);
    const affiliates = linesFromTextarea(bulkAffiliateUrls);
    if (products.length === 0) {
      setError("Cole pelo menos uma URL de produto antes de criar lista e importar.");
      return;
    }
    if (products.length !== affiliates.length) {
      setError(
        `As duas caixas precisam ter o mesmo número de linhas. Produtos: ${products.length}, afiliados: ${affiliates.length}.`,
      );
      return;
    }
    if (products.length > MAX_BULK_PAIRS) {
      setError(`Máximo de ${MAX_BULK_PAIRS} linhas por vez.`);
      return;
    }
    setError(null);
    setCriarListaModalPurpose("bulkNewList");
    setNomeListaCriar("");
    setCriarListaModalOpen(true);
  };

  const handleRefreshLista = async (listaId: string) => {
    setRefreshTarget(`lista:${listaId}`);
    setError(null);
    try {
      const res = await fetch("/api/mercadolivre/minha-lista-ofertas/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listaId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao atualizar");
      await loadItems(listaId);
      const u = json?.data?.updated ?? 0;
      const f = json?.data?.failed ?? 0;
      if (f > 0 && Array.isArray(json?.data?.errors) && json.data.errors.length) {
        setError(`Atualizados: ${u}. Com aviso: ${f}. ${json.data.errors[0]}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar lista");
    } finally {
      setRefreshTarget(null);
    }
  };

  const handleRefreshItem = async (itemId: string, listaId: string) => {
    setRefreshTarget(`item:${itemId}`);
    setError(null);
    try {
      const res = await fetch("/api/mercadolivre/minha-lista-ofertas/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao atualizar");
      await loadItems(listaId);
      if ((json?.data?.failed ?? 0) > 0) {
        setError(json?.data?.errors?.[0] ?? "Não foi possível atualizar este item.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar item");
    } finally {
      setRefreshTarget(null);
    }
  };

  const handleAdicionarItem = async () => {
    if (!addListaId) {
      setError("Escolha uma lista em Listas → Onde salvar.");
      return;
    }
    const linkAfiliado = affiliateLink.trim();
    if (!linkAfiliado) {
      setError("Cole o link de afiliado (meli.la) gerado no programa de afiliados do Mercado Livre.");
      return;
    }

    const pTrim = productUrl.trim();
    const urlProduto =
      (pTrim && (looksLikeMercadoLivreProductUrl(pTrim) || !!extractMlbIdFromUrl(pTrim)) ? pTrim : "") ||
      (linkAfiliado && (looksLikeMercadoLivreProductUrl(linkAfiliado) || !!extractMlbIdFromUrl(linkAfiliado))
        ? linkAfiliado
        : "");

    setSalvandoItem(true);
    setError(null);

    let nome = "";
    let img = "";
    let po: number | null = null;
    let pp: number | null = null;
    let dr: number | null = null;

    const aplicarMeta = (d: Record<string, unknown> | undefined) => {
      if (!d) return;
      if (d.productName) nome = String(d.productName);
      if (d.imageUrl) img = String(d.imageUrl);
      if (d.priceOriginal != null) po = Number(d.priceOriginal);
      if (d.pricePromo != null) pp = Number(d.pricePromo);
      if (d.discountRate != null) dr = Number(d.discountRate);
    };

    try {
      if (urlProduto) {
        const resMeta = await fetch("/api/mercadolivre/resolve-item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productUrl: urlProduto }),
        });
        const jsonMeta = await resMeta.json();
        if (!resMeta.ok) {
          throw new Error(
            jsonMeta?.error ??
              "Não foi possível buscar o anúncio. Confira a URL (MLB) ou o link meli.la.",
          );
        }
        aplicarMeta(jsonMeta.data as Record<string, unknown>);
      } else if (isMeliLaShort(linkAfiliado)) {
        const resMeta = await fetch("/api/mercadolivre/resolve-item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ affiliateUrl: linkAfiliado }),
        });
        const jsonMeta = await resMeta.json();
        if (!resMeta.ok) {
          throw new Error(
            jsonMeta?.error ??
              "Não foi possível abrir o link meli.la. Cole a URL da página do produto ou confira o link.",
          );
        }
        aplicarMeta(jsonMeta.data as Record<string, unknown>);
      } else {
        throw new Error(
          "Cole a URL da página do produto (com MLB) ou use um link meli.la para buscar nome, foto e preços automaticamente.",
        );
      }

      const userDrRaw = discountRate.trim();
      if (userDrRaw) {
        const u = Number(userDrRaw.replace(",", "."));
        if (Number.isFinite(u) && u > 0) dr = u;
      }

      if (!nome) {
        nome = urlProduto ? fallbackNameFromProductUrl(urlProduto, 0) : "Produto";
      }

      const promoAjustado = effectiveListaOfferPromoPrice(po, pp, dr);
      if (promoAjustado != null) pp = promoAjustado;

      const res = await fetch("/api/mercadolivre/minha-lista-ofertas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listaId: addListaId,
          converterLink: linkAfiliado,
          productName: nome,
          imageUrl: img,
          priceOriginal: po != null && Number.isFinite(po) ? po : null,
          pricePromo: pp != null && Number.isFinite(pp) ? pp : null,
          discountRate: dr != null && Number.isFinite(dr) ? dr : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao salvar");
      const item = json.data as Item;
      setItemsByLista((prev) => ({
        ...prev,
        [addListaId]: [item, ...(prev[addListaId] ?? [])],
      }));
      setListas((prev) =>
        prev.map((l) => (l.id === addListaId ? { ...l, totalItens: (l.totalItens ?? 0) + 1 } : l)),
      );
      setAffiliateLink("");
      setProductUrl("");
      setDiscountRate("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvandoItem(false);
    }
  };

  const handleDeleteItemClick = (itemId: string, listaId: string) => {
    setConfirmState({
      type: "deleteItem",
      title: "Remover produto",
      message: "Remover este produto da lista?",
      confirmLabel: "Remover",
      variant: "danger",
      payload: { itemId, listaId },
    });
  };

  const handleEmptyListClick = (listaId: string) => {
    setConfirmState({
      type: "emptyList",
      title: "Esvaziar lista",
      message: "Remover todos os produtos desta lista?",
      confirmLabel: "Esvaziar",
      variant: "danger",
      payload: { listaId },
    });
  };

  const handleDeleteListClick = (listaId: string) => {
    setConfirmState({
      type: "deleteList",
      title: "Apagar lista",
      message: "Apagar esta lista e todos os produtos?",
      confirmLabel: "Apagar",
      variant: "danger",
      payload: { listaId },
    });
  };

  const runConfirmAction = useCallback(async () => {
    if (!confirmState) return;
    const { type, payload } = confirmState;
    setConfirmLoading(true);
    try {
      if (type === "deleteItem" && payload.itemId) {
        const res = await fetch(`/api/mercadolivre/minha-lista-ofertas?id=${payload.itemId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Erro ao remover");
        setItemsByLista((prev) => ({
          ...prev,
          [payload.listaId]: (prev[payload.listaId] ?? []).filter((i) => i.id !== payload.itemId),
        }));
        setListas((prev) => prev.map((l) => (l.id === payload.listaId ? { ...l, totalItens: Math.max(0, (l.totalItens ?? 0) - 1) } : l)));
      } else if (type === "emptyList") {
        const res = await fetch(`/api/mercadolivre/minha-lista-ofertas?lista_id=${payload.listaId}&empty=1`, { method: "DELETE" });
        if (!res.ok) throw new Error("Erro ao esvaziar");
        setItemsByLista((prev) => ({ ...prev, [payload.listaId]: [] }));
        setListas((prev) => prev.map((l) => (l.id === payload.listaId ? { ...l, totalItens: 0 } : l)));
      } else if (type === "deleteList") {
        const res = await fetch(`/api/mercadolivre/minha-lista-ofertas/listas?id=${payload.listaId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Erro ao apagar lista");
        setListas((prev) => prev.filter((l) => l.id !== payload.listaId));
        setItemsByLista((prev) => {
          const next = { ...prev };
          delete next[payload.listaId];
          return next;
        });
        if (addListaId === payload.listaId) setAddListaId("");
      }
      setConfirmState(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro na ação");
    } finally {
      setConfirmLoading(false);
    }
  }, [confirmState, addListaId]);

  const handleConfirmCancel = useCallback(() => {
    if (!confirmLoading) setConfirmState(null);
  }, [confirmLoading]);

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {}).catch(() => {});
  };

  const toggleLista = (listaId: string) => {
    setExpandedListas((prev) => {
      const next = new Set(prev);
      if (next.has(listaId)) next.delete(listaId);
      else next.add(listaId);
      return next;
    });
  };

  const getFilteredAndPaginatedItems = (listaId: string) => {
    const items = itemsByLista[listaId] ?? [];
    const filter = (filterByLista[listaId] ?? "").trim().toLowerCase();
    const filtered = filter ? items.filter((i) => (i.productName || "").toLowerCase().includes(filter)) : items;
    const page = pageByLista[listaId] ?? 1;
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const from = (page - 1) * ITEMS_PER_PAGE;
    const slice = filtered.slice(from, from + ITEMS_PER_PAGE);
    return { slice, totalPages, page, total: filtered.length };
  };

  const setListaPage = (listaId: string, page: number) => {
    setPageByLista((prev) => ({ ...prev, [listaId]: page }));
  };

  return (
    <div className="min-h-screen bg-dark-bg text-text-primary p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/dashboard/grupos-venda"
            className="p-2 rounded-lg border border-dark-border bg-dark-card text-text-secondary hover:text-amber-400 hover:border-amber-500/40 transition-colors"
            title="Grupos de Venda"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <img src="/ml.png" alt="" className="w-11 h-11 object-contain shrink-0" />
          <div>
            <h1 className="text-xl font-semibold text-text-primary tracking-tight">Minha Lista de Ofertas</h1>
            <p className="text-xs text-text-secondary mt-0.5">Mercado Livre</p>
          </div>
        </div>

        <div className="flex items-start gap-2 mb-6 max-w-2xl">
          <p className="text-sm text-text-secondary leading-relaxed flex-1">
            URL do anúncio + <span className="text-text-primary">meli.la</span>. Importe em lote ou cadastre um item.{" "}
            <span className="text-text-primary/90">Atualizar preços</span> nas listas puxa dados de novo pelo link salvo.
          </p>
          <Toolist
            variant="below"
            wide
            text="Use o gerador de afiliados do ML para obter meli.la. A mesma lista vale para o lote e para um produto por vez. Em listas expandidas, Atualizar preços reconsulta nome, imagem e valores."
          />
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <section className="rounded-xl border border-dark-border bg-dark-card p-4 mb-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-sm font-semibold text-text-primary">Lista destino</h2>
            <button
              type="button"
              onClick={() => setListasMenuModalOpen(true)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-shopee-orange/45 bg-shopee-orange/10 text-sm font-semibold text-shopee-orange hover:bg-shopee-orange/18 transition-colors"
            >
              <Search className="h-4 w-4 shrink-0" />
              Listas
            </button>
            <Toolist
              variant="below"
              text="Abra Listas para criar uma lista nova ou escolher onde os produtos serão salvos (lote e cadastro avançado)."
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {selectedLista ? (
              <button
                type="button"
                onClick={openOndeSalvarFromMenu}
                title="Clique para trocar de lista"
                className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg text-xs sm:text-sm font-medium border border-shopee-orange/50 bg-shopee-orange/8 text-text-primary hover:border-shopee-orange/65 max-w-full"
              >
                <span className="truncate">{selectedLista.nome}</span>
                <span className="text-text-secondary/80 shrink-0 tabular-nums">({selectedLista.totalItens ?? 0})</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" />
              </button>
            ) : (
              <p className="text-xs text-text-secondary">Nenhuma lista selecionada — Listas → Onde salvar.</p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-dark-border bg-dark-card p-5 mb-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Columns2 className="h-4 w-4 text-amber-400 shrink-0" />
            <h2 className="text-sm font-semibold text-text-primary">Colar em lote (produto + meli.la)</h2>
            <Toolist
              variant="below"
              wide
              text={`Linha 1 do bloco de produtos alinha com linha 1 dos links meli.la (como no gerador do ML). Máximo ${MAX_BULK_PAIRS} pares por vez.`}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label className={labelClass}>URLs dos produtos</label>
              <textarea
                value={bulkProductUrls}
                onChange={(e) => setBulkProductUrls(e.target.value)}
                rows={9}
                spellCheck={false}
                placeholder={
                  "https://produto.mercadolivre.com.br/MLB-…\nhttps://www.mercadolivre.com.br/…/p/MLB…"
                }
                className={textareaClass}
              />
            </div>
            <div className="min-w-0">
              <label className={labelClass}>Links de afiliado (meli.la)</label>
              <textarea
                value={bulkAffiliateUrls}
                onChange={(e) => setBulkAffiliateUrls(e.target.value)}
                rows={9}
                spellCheck={false}
                placeholder={"https://meli.la/…\nhttps://meli.la/…"}
                className={textareaClass}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={
                bulkPairMatch
                  ? "text-emerald-400/90 font-medium"
                  : bulkProductLines.length > 0 || bulkAffiliateLines.length > 0
                    ? "text-amber-400/90"
                    : "text-text-secondary"
              }
            >
              {bulkProductLines.length} URL(s) de produto · {bulkAffiliateLines.length} link(s) de afiliado
              {bulkPairMatch
                ? " — linhas conferem"
                : bulkProductLines.length !== bulkAffiliateLines.length &&
                    (bulkProductLines.length > 0 || bulkAffiliateLines.length > 0)
                  ? " — mesmo número de linhas nos dois blocos"
                  : ""}
            </span>
          </div>
          {bulkProgress ? (
            <p className="text-xs text-amber-400 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              Salvando {bulkProgress.done} / {bulkProgress.total}…
            </p>
          ) : null}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2 border-t border-dark-border">
            <button
              type="button"
              onClick={runBulkSaveSelected}
              disabled={bulkSaving || !bulkPairMatch || !addListaId}
              title={!addListaId ? "Escolha uma lista em Listas → Onde salvar." : undefined}
              className="flex items-center justify-center gap-2 min-h-10 px-4 rounded-lg bg-amber-500 text-dark-bg text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {bulkSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Adicionar na lista selecionada
            </button>
            <button
              type="button"
              onClick={openBulkNewListModal}
              disabled={bulkSaving || !bulkPairMatch}
              title="Abre um popup para nomear a lista; se deixar em branco, usamos um nome com a data."
              className="flex items-center justify-center gap-2 min-h-10 px-4 rounded-lg border border-dark-border text-text-primary text-sm font-medium hover:border-amber-500/45 hover:text-amber-400 disabled:opacity-50"
            >
              Criar lista nova e adicionar tudo
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-dark-border bg-dark-card p-5 mb-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Link2 className="h-4 w-4 text-amber-400 shrink-0" />
            <h2 className="text-sm font-semibold text-text-primary">Um produto por vez</h2>
            <Toolist
              variant="below"
              wide
              text="Ao salvar, o app busca na API nome, imagem e preços (URL do anúncio ou meli.la) e grava na lista. Desconto % é opcional e recalcula o preço promo. Para vários itens, use o lote acima."
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <label className="text-xs font-medium text-text-secondary">URL do anúncio (recomendado)</label>
                <Toolist
                  variant="floating"
                  wide
                  text="Se não colar aqui, use um link meli.la no campo abaixo — a API tenta resolver só pelo meli.la."
                />
              </div>
              <input
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="Página do produto com MLB na URL"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Link de afiliado (obrigatório)</label>
              <input
                value={affiliateLink}
                onChange={(e) => setAffiliateLink(e.target.value)}
                placeholder="Link do gerador de afiliados (meli.la)"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2 sm:max-w-xs">
              <div className="flex items-center gap-1.5 mb-1.5">
                <label className="text-xs font-medium text-text-secondary">Desconto % (opcional)</label>
                <Toolist
                  variant="floating"
                  text="Se preencher, substitui o desconto vindo da API e recalcula o preço promo a partir do preço original."
                />
              </div>
              <input
                value={discountRate}
                onChange={(e) => setDiscountRate(e.target.value)}
                placeholder="Ex.: 10"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2 pt-1">
              <button
                type="button"
                onClick={() => void handleAdicionarItem()}
                disabled={salvandoItem || !addListaId}
                title={!addListaId ? "Escolha uma lista em Listas → Onde salvar." : undefined}
                className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-amber-500 text-dark-bg font-semibold text-sm hover:opacity-90 disabled:opacity-50"
              >
                {salvandoItem ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Salvar na lista
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          </div>
        ) : listas.length === 0 ? (
          <div className="rounded-xl border border-dark-border bg-dark-card p-8 text-center text-text-secondary">
            <ListChecks className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium text-text-primary">Nenhuma lista ainda</p>
            <p className="text-sm mt-1 max-w-md mx-auto">
              Toque em <span className="text-text-primary">Listas</span> → Criar lista, ou use &quot;Criar lista nova e adicionar tudo&quot; no lote. Depois escolha Onde salvar e adicione produtos.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-text-primary px-0.5">Suas listas</h2>
            <ul className="space-y-3">
              {pagedListas.map((lista) => {
                const isExpanded = expandedListas.has(lista.id);
                const { slice, totalPages, page, total } = getFilteredAndPaginatedItems(lista.id);
                return (
                  <li key={lista.id} className="rounded-xl border border-dark-border bg-dark-card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleLista(lista.id)}
                      className="w-full p-4 flex flex-wrap items-center justify-between gap-2 text-left hover:bg-dark-bg/50 transition-colors"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-text-secondary shrink-0" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-text-secondary shrink-0" />
                        )}
                        <Store className="h-5 w-5 text-amber-400 shrink-0" />
                        <span className="text-lg font-semibold text-text-primary truncate">{lista.nome}</span>
                        <span className="text-sm text-text-secondary shrink-0">({lista.totalItens ?? 0} itens)</span>
                      </span>
                      <span className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEmptyListClick(lista.id); }}
                          disabled={(itemsByLista[lista.id]?.length ?? 0) === 0}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-dark-border text-text-secondary text-xs hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/30 disabled:opacity-40"
                          title="Esvaziar lista"
                        >
                          <FolderMinus className="h-3.5 w-3.5" /> Esvaziar
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteListClick(lista.id); }}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-dark-border text-text-secondary text-xs hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                          title="Apagar lista"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Apagar
                        </button>
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-dark-border p-4">
                        {loadingListaId === lista.id ? (
                          <div className="flex justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                          </div>
                        ) : !itemsByLista[lista.id]?.length ? (
                          <p className="text-sm text-text-secondary py-4 text-center">Nenhum produto nesta lista.</p>
                        ) : (
                          <>
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <Search className="h-4 w-4 text-text-secondary shrink-0" />
                              <input
                                type="text"
                                value={filterByLista[lista.id] ?? ""}
                                onChange={(e) => {
                                  setFilterByLista((prev) => ({ ...prev, [lista.id]: e.target.value }));
                                  setPageByLista((prev) => ({ ...prev, [lista.id]: 1 }));
                                }}
                                placeholder="Filtrar por nome do produto..."
                                className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-dark-border bg-dark-bg text-text-primary text-sm placeholder:text-text-secondary/60"
                              />
                              <button
                                type="button"
                                onClick={() => handleRefreshLista(lista.id)}
                                disabled={refreshTarget !== null}
                                title="Atualizar nome, imagem e preços pelos links salvos"
                                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dark-border text-text-secondary text-xs font-medium hover:border-amber-500/45 hover:text-amber-400 disabled:opacity-50"
                              >
                                {refreshTarget === `lista:${lista.id}` ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3.5 w-3.5" />
                                )}
                                Atualizar preços
                              </button>
                            </div>
                            <ul className="space-y-4">
                              {slice.map((item) => (
                                <li
                                  key={item.id}
                                  className="flex gap-4 p-3 rounded-lg border border-dark-border bg-dark-bg"
                                >
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt=""
                                      className="w-20 h-20 object-contain rounded-lg bg-white/5 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-20 h-20 rounded-lg bg-dark-card shrink-0 flex items-center justify-center text-text-secondary text-xs border border-dark-border">
                                      —
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-text-primary leading-snug">
                                      {item.productName || "Produto"}
                                    </p>
                                    <p className="text-sm text-text-secondary mt-1">
                                      💰 Preço:{" "}
                                      {item.discountRate != null && item.discountRate > 0 && (
                                        <span className="text-red-400 font-medium">-{Math.round(item.discountRate)}% </span>
                                      )}
                                      <span className="line-through">
                                        {item.priceOriginal != null ? formatCurrency(item.priceOriginal) : "—"}
                                      </span>
                                      {" por "}
                                      <span className="text-emerald-400 font-medium">{displayPrecoPorLista(item)}</span>
                                    </p>
                                    <p className="text-[11px] font-medium text-text-secondary uppercase tracking-wide mt-2">
                                      Link de afiliado
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => copyLink(item.converterLink)}
                                      className="text-sm text-emerald-400/90 hover:underline break-all text-left w-full"
                                    >
                                      {item.converterLink}
                                    </button>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      <a
                                        href={item.converterLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                                      >
                                        <ExternalLink className="h-3 w-3 shrink-0" /> Abrir link
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => handleRefreshItem(item.id, lista.id)}
                                        disabled={refreshTarget !== null}
                                        className="text-xs text-text-secondary hover:text-amber-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                                      >
                                        {refreshTarget === `item:${item.id}` ? (
                                          <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                                        ) : (
                                          <RefreshCw className="h-3 w-3 shrink-0" />
                                        )}
                                        Atualizar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteItemClick(item.id, lista.id)}
                                        className="text-xs text-red-400 hover:underline flex items-center gap-1 ml-auto"
                                      >
                                        <Trash2 className="h-3 w-3 shrink-0" /> Remover
                                      </button>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                            {totalPages > 1 && (
                              <GeradorPaginationBar
                                className="mt-4 border-t border-dark-border pt-3"
                                page={page}
                                totalPages={totalPages}
                                summary={`Mostrando ${slice.length} de ${total} produto(s)`}
                                onPrev={() => setListaPage(lista.id, Math.max(1, page - 1))}
                                onNext={() => setListaPage(lista.id, Math.min(totalPages, page + 1))}
                              />
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {listas.length > 0 && (
              <div className="rounded-xl border border-dark-border bg-dark-card px-3 sm:px-5 py-3.5">
                <GeradorPaginationBar
                  page={listasPage}
                  totalPages={totalListasPages}
                  summary={`Mostrando ${pagedListas.length} de ${listas.length} lista(s)`}
                  onPrev={() => setListasPage((p) => Math.max(1, p - 1))}
                  onNext={() => setListasPage((p) => Math.min(totalListasPages, p + 1))}
                />
              </div>
            )}
          </div>
        )}

        {listasMenuModalOpen && typeof document !== "undefined"
          ? createPortal(
              <div
                className={mlModalOverlayClass}
                role="presentation"
                onClick={() => setListasMenuModalOpen(false)}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={listasMenuTitleId}
                  className="w-full max-w-md flex flex-col rounded-2xl border border-dark-border bg-dark-card shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={mlModalHeaderClass}>
                    <h2
                      id={listasMenuTitleId}
                      className="text-sm font-bold text-text-primary flex items-center gap-2"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-shopee-orange/15 border border-shopee-orange/25">
                        <ListChecks className="h-4 w-4 text-shopee-orange" />
                      </span>
                      Listas
                    </h2>
                    <p className="text-[11px] text-text-secondary/75 mt-1.5 leading-relaxed">
                      Crie uma lista vazia ou escolha em qual lista salvar (importação em lote e cadastro avulso).
                    </p>
                  </div>
                  <div className="p-3 space-y-2">
                    <button
                      type="button"
                      onClick={openCriarListaFromMenu}
                      className="w-full text-left rounded-lg border border-dark-border/60 bg-dark-bg/30 px-3 py-2.5 text-sm transition-all hover:border-shopee-orange/30 flex items-start gap-3"
                    >
                      <Plus className="h-4 w-4 text-shopee-orange shrink-0 mt-0.5" />
                      <span className="min-w-0">
                        <span className="block font-medium text-text-primary">Criar lista</span>
                        <span className="block text-[11px] text-text-secondary/55 font-normal mt-0.5">
                          Nova lista para preencher depois
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={openOndeSalvarFromMenu}
                      className="w-full text-left rounded-lg border border-dark-border/60 bg-dark-bg/30 px-3 py-2.5 text-sm transition-all hover:border-shopee-orange/30 flex items-start gap-3"
                    >
                      <Search className="h-4 w-4 text-shopee-orange shrink-0 mt-0.5" />
                      <span className="min-w-0">
                        <span className="block font-medium text-text-primary">Onde salvar</span>
                        <span className="block text-[11px] text-text-secondary/55 font-normal mt-0.5">
                          Buscar e selecionar uma lista existente
                        </span>
                      </span>
                    </button>
                  </div>
                  <div className={mlModalFooterClass}>
                    <button
                      type="button"
                      onClick={() => setListasMenuModalOpen(false)}
                      className="rounded-xl border border-dark-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-dark-bg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )
          : null}

        {criarListaModalOpen && typeof document !== "undefined"
          ? createPortal(
              <div
                className={mlModalOverlayClass}
                role="presentation"
                onClick={() => {
                  if (!criandoLista && !bulkSaving) setCriarListaModalOpen(false);
                }}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={criarListaTitleId}
                  className={`${mlModalShellClass} max-w-md`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={`${mlModalHeaderClass} flex items-start justify-between gap-3`}>
                    <div className="min-w-0">
                      <h2
                        id={criarListaTitleId}
                        className="text-sm font-bold text-text-primary flex items-center gap-2"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-shopee-orange/15 border border-shopee-orange/25 shrink-0">
                          <Plus className="h-4 w-4 text-shopee-orange" />
                        </span>
                        <span className="leading-tight">
                          {criarListaModalPurpose === "bulkNewList" ? "Criar lista e importar" : "Nova lista"}
                        </span>
                      </h2>
                      <p className="text-[11px] text-text-secondary/75 mt-1.5 leading-relaxed">
                        {criarListaModalPurpose === "bulkNewList"
                          ? "Nome opcional — se vazio, usamos a data de hoje."
                          : "Nome opcional — padrão “Nova lista ML”."}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Fechar"
                      disabled={criandoLista || bulkSaving}
                      onClick={() => setCriarListaModalOpen(false)}
                      className="p-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-dark-bg disabled:opacity-40 shrink-0"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="px-4 pb-4">
                    <label className={labelClass} htmlFor="ml-criar-lista-nome">
                      Nome
                    </label>
                    <input
                      id="ml-criar-lista-nome"
                      value={nomeListaCriar}
                      onChange={(e) => setNomeListaCriar(e.target.value)}
                      placeholder={
                        criarListaModalPurpose === "bulkNewList" ? "Opcional — usa data se vazio" : "Opcional — Nova lista ML"
                      }
                      disabled={criandoLista || bulkSaving}
                      className="w-full rounded-xl border border-dark-border bg-dark-bg py-2.5 px-3 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-shopee-orange/60 focus:ring-1 focus:ring-shopee-orange/20 disabled:opacity-50"
                      autoFocus
                    />
                  </div>
                  <div className={mlModalFooterClass}>
                    <button
                      type="button"
                      disabled={criandoLista || bulkSaving}
                      onClick={() => setCriarListaModalOpen(false)}
                      className="rounded-xl border border-dark-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-dark-bg transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => void submitCriarListaModal()}
                      disabled={criandoLista || bulkSaving}
                      className="rounded-xl bg-shopee-orange px-4 py-2 text-sm font-semibold text-white hover:opacity-90 shadow-[0_2px_12px_rgba(238,77,45,0.25)] disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    >
                      {criandoLista || bulkSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {criarListaModalPurpose === "bulkNewList" ? "Criar e importar" : "Criar lista"}
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )
          : null}

        {selecionarListaModalOpen && typeof document !== "undefined"
          ? createPortal(
              <div className={mlModalOverlayClass} role="presentation" onClick={closeListaPicker}>
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={ondeSalvarTitleId}
                  className={`${mlModalShellClass} max-w-lg max-h-[min(520px,85vh)]`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={`${mlModalHeaderClass} flex items-start justify-between gap-3`}>
                    <div className="min-w-0 flex-1">
                      <h2
                        id={ondeSalvarTitleId}
                        className="text-sm font-bold text-text-primary flex items-center gap-2"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-shopee-orange/15 border border-shopee-orange/25 shrink-0">
                          <Search className="h-4 w-4 text-shopee-orange" />
                        </span>
                        Onde salvar
                      </h2>
                      <p className="text-[11px] text-text-secondary/75 mt-1.5 leading-relaxed">
                        Busque pelo nome da lista e confirme para usar no lote e no cadastro avulso.
                      </p>
                      <div className="relative mt-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary/45 pointer-events-none" />
                        <input
                          type="search"
                          value={listaPickerQuery}
                          onChange={(e) => setListaPickerQuery(e.target.value)}
                          placeholder="Filtrar listas…"
                          className={mlModalSearchInputClass}
                          autoFocus
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Fechar"
                      onClick={closeListaPicker}
                      className="p-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-dark-bg shrink-0"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className={mlModalListScrollClass}>
                    {listas.length === 0 ? (
                      <p className="text-sm text-text-secondary text-center py-8 px-4">
                        Nenhuma lista ainda. Use Listas → Criar lista.
                      </p>
                    ) : listasFiltradasPicker.length === 0 ? (
                      <p className="text-sm text-text-secondary text-center py-8 px-4">Nada encontrado.</p>
                    ) : (
                      listasFiltradasPicker.map((l) => {
                        const selected = listaPickerDraftId === l.id;
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => setListaPickerDraftId(l.id)}
                            className={mlPickerRowClass(selected)}
                          >
                            <span className="block truncate font-medium">{l.nome}</span>
                            <span className="block text-[11px] text-text-secondary/55 font-normal truncate mt-0.5 tabular-nums">
                              {l.totalItens ?? 0} itens
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                  <div className={mlModalFooterClass}>
                    <button
                      type="button"
                      onClick={closeListaPicker}
                      className="rounded-xl border border-dark-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-dark-bg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={confirmListaPicker}
                      disabled={listas.length === 0 || !listaPickerDraftId}
                      className="rounded-xl bg-shopee-orange px-4 py-2 text-sm font-semibold text-white hover:opacity-90 shadow-[0_2px_12px_rgba(238,77,45,0.25)] disabled:opacity-50"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )
          : null}

        {confirmState && (
          <ConfirmModal
            open={!!confirmState}
            title={confirmState.title}
            message={confirmState.message}
            confirmLabel={confirmState.confirmLabel}
            cancelLabel="Cancelar"
            variant={confirmState.variant}
            loading={confirmLoading}
            onConfirm={runConfirmAction}
            onCancel={handleConfirmCancel}
          />
        )}
      </div>
    </div>
  );
}
