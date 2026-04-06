"use client";

import { useState, useEffect, useCallback, useMemo, useId, useRef } from "react";
import Papa from "papaparse";
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
  Upload,
  FileDown,
  Pencil,
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
  /** URL do anúncio ML salva no servidor para “Atualizar” quando o meli.la falhar */
  productPageUrl?: string;
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

function moneyInputStringFromNumber(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "";
  return String(n).replace(".", ",");
}

function parseMoneyInput(s: string): number | null {
  const t = s.trim().replace(/\s/g, "").replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function parsePercentInput(s: string): number | null {
  const t = s.trim().replace(/\s/g, "").replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Item com meta incompleta (falha de scrape/API) — dispara modo “Atualizar erros”. */
function mlItemLooksIncomplete(item: Item): boolean {
  if (!item.converterLink?.trim()) return false;
  const por =
    effectiveListaOfferPromoPrice(item.priceOriginal, item.pricePromo, item.discountRate) ?? item.pricePromo;
  const hasPrice = por != null && Number.isFinite(Number(por));
  const hasImg = !!item.imageUrl?.trim();
  const n = (item.productName || "").trim();
  if (/^Produto \(linha \d+\)$/i.test(n)) return true;
  if (/^MLBU\d{5,}$/i.test(n)) return true;
  if (!hasImg && !hasPrice) return true;
  return false;
}

const MAX_BULK_PAIRS = 60;

/** Alinhado ao MAX_ROWS_PER_REQUEST da API refresh (fatias por POST). */
const ML_LISTA_REFRESH_CHUNK = 120;

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-dark-border bg-dark-bg text-sm text-text-primary placeholder:text-text-secondary/60";
const textareaClass =
  "w-full px-3 py-2 rounded-lg border border-dark-border bg-dark-bg text-xs sm:text-sm font-mono text-text-primary placeholder:text-text-secondary/50 min-h-[160px]";
const labelClass = "block text-xs font-medium text-text-secondary mb-1.5";

/** Formulários “Colar em lote” / “Um produto por vez” — alinhado ao SectionBox (Meta / padrão do app) */
const mlSectionFormClass =
  "rounded-xl border border-dark-border/60 bg-dark-bg/40 p-4 sm:p-5 space-y-4";
const mlSectionHeadClass =
  "flex flex-wrap items-center gap-2 border-l-2 border-shopee-orange/60 pl-2 -ml-px";
const mlSectionTitleClass =
  "text-xs font-semibold text-text-primary uppercase tracking-wide";
const mlInputClass =
  "w-full rounded-xl border border-dark-border bg-dark-bg py-2.5 px-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-shopee-orange/60 focus:ring-1 focus:ring-shopee-orange/20";
const mlTextareaClass =
  "w-full rounded-xl border border-dark-border bg-dark-bg py-2.5 px-3 text-xs sm:text-sm font-mono text-text-primary placeholder:text-text-secondary/45 min-h-[160px] focus:outline-none focus:border-shopee-orange/60 focus:ring-1 focus:ring-shopee-orange/20 scrollbar-thin";
const mlFieldLabelClass =
  "block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5";
const mlFieldLabelInlineClass =
  "text-xs font-semibold text-text-secondary uppercase tracking-wide shrink-0";
const mlBtnPrimaryClass =
  "inline-flex items-center justify-center gap-2 min-h-10 px-4 rounded-xl bg-shopee-orange text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 shadow-[0_2px_12px_rgba(238,77,45,0.22)] transition-opacity";
const mlBtnSecondaryClass =
  "inline-flex items-center justify-center gap-2 min-h-10 px-4 rounded-xl border border-dark-border/80 bg-dark-bg/30 text-text-primary text-sm font-medium hover:border-shopee-orange/35 hover:text-shopee-orange disabled:opacity-50 transition-colors";

const mlModalOverlayClass =
  "fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-[2px]";
const mlModalShellClass =
  "w-full flex flex-col rounded-2xl border border-dark-border bg-dark-card shadow-2xl overflow-hidden";
const mlModalHeaderClass = "shrink-0 px-4 pt-4 pb-3 border-b border-dark-border/60 bg-dark-bg/40";
const mlModalSearchInputClass =
  "w-full rounded-xl border border-dark-border bg-dark-bg py-2.5 pl-10 pr-3 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-shopee-orange/60 focus:ring-1 focus:ring-shopee-orange/20";
const mlModalListScrollClass = "flex-1 min-h-0 overflow-y-auto p-3 scrollbar-thin space-y-2";
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

function looksLikeBulkHeaderRow(cols: string[]): boolean {
  const a = (cols[0] ?? "").trim();
  if (/^https?:\/\//i.test(a)) return false;
  const hint = cols.map((c) => String(c ?? "").toLowerCase()).join(" ");
  return /\b(url|produto|an[uú]ncio|link|afiliado|meli|coluna)\b/i.test(hint);
}

function parseBulkCsvRows(rows: string[][]): { product: string; affiliate: string }[] {
  let data = rows.filter((r) => r.some((c) => String(c ?? "").trim()));
  if (data.length && looksLikeBulkHeaderRow(data[0].map((c) => String(c ?? "")))) {
    data = data.slice(1);
  }
  const pairs: { product: string; affiliate: string }[] = [];
  for (const r of data) {
    const product = String(r[0] ?? "").trim();
    const affiliate = String(r[1] ?? "").trim();
    if (product && affiliate) pairs.push({ product, affiliate });
  }
  return pairs;
}

function isHttpUrlLine(line: string): boolean {
  return /^https?:\/\//i.test(line.trim());
}

/** Linha é link curto de afiliado (não confundir com URL de produto ML). */
function isMeliLaHttpLine(line: string): boolean {
  const t = line.trim();
  if (!/^https?:\/\//i.test(t)) return false;
  try {
    const h = new URL(t).hostname.toLowerCase();
    return h === "meli.la" || h === "www.meli.la";
  } catch {
    return false;
  }
}

/**
 * Um único bloco: todas as URLs de produto primeiro, depois todas as meli.la (sem precisar linha em branco).
 */
function splitBulkTxtUrlsIntoProductsAndAffiliates(lines: string[]): { products: string[]; affiliates: string[] } | null {
  const trimmed = lines.map((l) => l.trim()).filter(Boolean);
  const idx = trimmed.findIndex(isMeliLaHttpLine);
  if (idx <= 0) return null;
  const products = trimmed.slice(0, idx).filter((l) => !isMeliLaHttpLine(l));
  const affiliates = trimmed.slice(idx).filter(isMeliLaHttpLine);
  if (products.length === 0 || affiliates.length === 0) return null;
  return { products, affiliates };
}

/** Formato alternativo em TXT (um único bloco): TAB ou `;` entre URL do produto e meli.la na mesma linha. */
function parseTxtLineToPair(line: string): { product: string; affiliate: string } | null {
  const t = line.trim();
  if (!t || t.startsWith("#")) return null;
  let product: string;
  let affiliate: string;
  if (t.includes("\t")) {
    const idx = t.indexOf("\t");
    product = t.slice(0, idx).trim();
    affiliate = t.slice(idx + 1).trim();
  } else if (t.includes(";")) {
    const idx = t.indexOf(";");
    product = t.slice(0, idx).trim();
    affiliate = t.slice(idx + 1).trim();
  } else {
    return null;
  }
  if (!product || !affiliate) return null;
  return { product, affiliate };
}

/**
 * TXT: (1) dois blocos separados por linha em branco — só linhas que começam com http(s), comentários # ignorados;
 * (2) um bloco só — produtos ML primeiro, depois meli.la na ordem (linha em branco entre blocos é opcional);
 * (3) TAB ou `;` na mesma linha.
 */
function parseBulkNotepadContent(text: string): { product: string; affiliate: string }[] {
  const rawLines = text.split(/\r?\n/);
  const blocks: string[][] = [[]];
  for (const line of rawLines) {
    if (line.trim() === "") {
      if (blocks[blocks.length - 1].length > 0) blocks.push([]);
    } else {
      blocks[blocks.length - 1].push(line);
    }
  }

  const dataBlocks = blocks
    .map((b) =>
      b
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith("#") && isHttpUrlLine(l)),
    )
    .filter((b) => b.length > 0);

  if (dataBlocks.length >= 2) {
    const products = dataBlocks[0];
    const affiliates = dataBlocks[1];
    const n = Math.min(products.length, affiliates.length);
    return Array.from({ length: n }, (_, i) => ({
      product: products[i],
      affiliate: affiliates[i],
    }));
  }

  if (dataBlocks.length === 1) {
    const split = splitBulkTxtUrlsIntoProductsAndAffiliates(dataBlocks[0]);
    if (split) {
      const n = Math.min(split.products.length, split.affiliates.length);
      return Array.from({ length: n }, (_, i) => ({
        product: split.products[i],
        affiliate: split.affiliates[i],
      }));
    }
  }

  const pairs: { product: string; affiliate: string }[] = [];
  for (const line of dataBlocks[0] ?? []) {
    const p = parseTxtLineToPair(line);
    if (p) pairs.push(p);
  }
  return pairs;
}

function pairsToBulkTextareas(pairs: { product: string; affiliate: string }[]): {
  products: string;
  affiliates: string;
} {
  return {
    products: pairs.map((p) => p.product).join("\n"),
    affiliates: pairs.map((p) => p.affiliate).join("\n"),
  };
}

function triggerUtf8Download(filename: string, content: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function downloadMlBulkTemplateCsv() {
  const body =
    "URL do produto (coluna A);Link de afiliado meli.la (coluna B)\r\n" +
    "https://www.mercadolivre.com.br/SEU_ANUNCIO;https://meli.la/SEU_LINK\r\n";
  triggerUtf8Download("modelo-lote-ml.csv", body);
}

function downloadMlBulkTemplateTxt() {
  const body =
    "# Afiliado Analytics — modelo lote Mercado Livre\r\n" +
    "# Linhas com # no início são ignoradas.\r\n" +
    "# ACIMA: uma URL http(s) de produto por linha. ABAIXO: um https://meli.la/… por linha (mesma ordem).\r\n" +
    "# Linha em branco entre as duas listas é opcional.\r\n" +
    "\r\n" +
    "#https://www.mercadolivre.com.br/exemplo-produto\r\n" +
    "https://www.mercadolivre.com.br/SEU_PRODUTO_1\r\n" +
    "https://www.mercadolivre.com.br/SEU_PRODUTO_2\r\n" +
    "\r\n" +
    "#https://meli.la/exemplo\r\n" +
    "https://meli.la/SEU_LINK_1\r\n" +
    "https://meli.la/SEU_LINK_2\r\n";
  triggerUtf8Download("modelo-lote-ml.txt", body);
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
  const [editItemModal, setEditItemModal] = useState<{ item: Item; listaId: string } | null>(null);
  const [editItemForm, setEditItemForm] = useState({
    productName: "",
    priceOriginal: "",
    pricePromo: "",
    discountRate: "",
  });
  const [savingEditItem, setSavingEditItem] = useState(false);
  const ITEMS_PER_PAGE = 4;
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
  /** Sanfona "Um produto por vez" — fechada por padrão */
  const [umProdutoAccordionOpen, setUmProdutoAccordionOpen] = useState(false);
  const listasMenuTitleId = useId();
  const criarListaTitleId = useId();
  const ondeSalvarTitleId = useId();
  const editItemTitleId = useId();

  const [addListaId, setAddListaId] = useState("");
  const [affiliateLink, setAffiliateLink] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [discountRate, setDiscountRate] = useState("");
  const [salvandoItem, setSalvandoItem] = useState(false);

  const [bulkProductUrls, setBulkProductUrls] = useState("");
  const [bulkAffiliateUrls, setBulkAffiliateUrls] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  /** Só erros de importação — sucesso não mostra aviso (evita ruído visual). */
  const [bulkImportWarn, setBulkImportWarn] = useState<string | null>(null);

  const applyBulkPairs = useCallback((pairs: { product: string; affiliate: string }[]) => {
    if (pairs.length === 0) {
      setBulkImportWarn(
        "Nenhum par válido: CSV com colunas A/B; ou TXT com URLs de produto e depois meli.la; ou TAB/; na mesma linha.",
      );
      return;
    }
    if (pairs.length > MAX_BULK_PAIRS) {
      setBulkImportWarn(null);
      setError(`Máximo de ${MAX_BULK_PAIRS} linhas por vez. O arquivo tem ${pairs.length}.`);
      return;
    }
    setError(null);
    setBulkImportWarn(null);
    const { products, affiliates } = pairsToBulkTextareas(pairs);
    setBulkProductUrls(products);
    setBulkAffiliateUrls(affiliates);
  }, []);

  const onBulkFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setBulkImportWarn(null);

      const name = file.name.toLowerCase();
      const isCsv = name.endsWith(".csv") || file.type === "text/csv";
      const isTxt = name.endsWith(".txt") || name.endsWith(".tsv") || file.type === "text/plain";

      if (isCsv) {
        Papa.parse(file, {
          complete: (results) => {
            const rows = (results.data as unknown[][]).map((row) =>
              (Array.isArray(row) ? row : []).map((c) => String(c ?? ""))
            );
            applyBulkPairs(parseBulkCsvRows(rows));
          },
          error: (err) => {
            setBulkImportWarn(`Erro ao ler CSV: ${err.message}`);
          },
          skipEmptyLines: "greedy",
        });
      } else if (isTxt) {
        const reader = new FileReader();
        reader.onload = () => {
          const text = String(reader.result ?? "");
          applyBulkPairs(parseBulkNotepadContent(text));
        };
        reader.onerror = () =>
          setBulkImportWarn("Não foi possível ler o arquivo.");
        reader.readAsText(file, "UTF-8");
      } else {
        setBulkImportWarn("Use um arquivo .csv (planilha) ou .txt / .tsv (bloco de notas).");
      }
    },
    [applyBulkPairs]
  );
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

  const loadItems = useCallback(async (listaId: string): Promise<Item[]> => {
    setLoadingListaId(listaId);
    try {
      const res = await fetch(`/api/mercadolivre/minha-lista-ofertas?lista_id=${listaId}`);
      const json = await res.json();
      const arr: Item[] = Array.isArray(json?.data) ? json.data : [];
      if (!res.ok) return [];
      setItemsByLista((prev) => ({ ...prev, [listaId]: arr }));
      return arr;
    } catch {
      setItemsByLista((prev) => ({ ...prev, [listaId]: [] }));
      return [];
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

  useEffect(() => {
    if (!bulkSaving) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [bulkSaving]);

  useEffect(() => {
    if (!editItemModal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || savingEditItem) return;
      setEditItemModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [editItemModal, savingEditItem]);

  const openEditItemModal = useCallback((item: Item, listaId: string) => {
    setEditItemModal({ item, listaId });
    setEditItemForm({
      productName: item.productName ?? "",
      priceOriginal: moneyInputStringFromNumber(item.priceOriginal),
      pricePromo: moneyInputStringFromNumber(
        effectiveListaOfferPromoPrice(item.priceOriginal, item.pricePromo, item.discountRate) ??
          item.pricePromo,
      ),
      discountRate:
        item.discountRate != null && Number.isFinite(item.discountRate) ? String(item.discountRate) : "",
    });
  }, []);

  const submitEditItemModal = useCallback(async () => {
    if (!editItemModal) return;
    setSavingEditItem(true);
    setError(null);
    try {
      const po = parseMoneyInput(editItemForm.priceOriginal);
      let pp = parseMoneyInput(editItemForm.pricePromo);
      const dr = parsePercentInput(editItemForm.discountRate);
      const normalized = effectiveListaOfferPromoPrice(po, pp, dr);
      if (normalized != null) pp = normalized;

      const res = await fetch("/api/mercadolivre/minha-lista-ofertas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editItemModal.item.id,
          productName: editItemForm.productName.trim(),
          priceOriginal: po,
          pricePromo: pp,
          discountRate: dr,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erro ao salvar");
      await loadItems(editItemModal.listaId);
      setEditItemModal(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar alterações");
    } finally {
      setSavingEditItem(false);
    }
  }, [editItemModal, editItemForm, loadItems]);

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
      /* Igual a “Um produto por vez”: meli.la resolve no servidor com affiliateUrl (expand do redirect). */
      if ((!nome.trim() || !img.trim()) && isMeliLaShort(a)) {
        await callResolve({ affiliateUrl: a });
      }
      if ((!nome.trim() || !img.trim()) && isMeliLaShort(p)) {
        await callResolve({ affiliateUrl: p });
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
        const metaRow = await resolveRowMeta(rows[i]);
        let nome = metaRow.nome;
        const img = metaRow.img;
        const po = metaRow.po;
        let pp = metaRow.pp;
        const dr = metaRow.dr;
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
            productPageUrl: pUrl.trim(),
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
      let items = itemsByLista[listaId] ?? [];
      if (items.length === 0) {
        items = await loadItems(listaId);
      }
      if (items.length === 0) return;

      let uTot = 0;
      let fTot = 0;
      const allErrors: string[] = [];

      const runChunk = async (body: { listaId: string; itemIds: string[] }) => {
        const res = await fetch("/api/mercadolivre/minha-lista-ofertas/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Erro ao atualizar");
        uTot += json?.data?.updated ?? 0;
        fTot += json?.data?.failed ?? 0;
        if (Array.isArray(json?.data?.errors)) allErrors.push(...json.data.errors);
      };

      for (let i = 0; i < items.length; i += ML_LISTA_REFRESH_CHUNK) {
        const itemIds = items.slice(i, i + ML_LISTA_REFRESH_CHUNK).map((x) => x.id);
        await runChunk({ listaId, itemIds });
      }

      await loadItems(listaId);
      if (fTot > 0 && allErrors.length > 0) {
        setError(`Atualizados: ${uTot}. Com aviso: ${fTot}. ${allErrors[0]}`);
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
          productPageUrl: urlProduto.trim(),
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
      <div className="mx-auto w-full max-w-7xl lg:max-w-[90vw]">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/dashboard/grupos-venda"
            className="p-2 rounded-lg border border-dark-border bg-dark-card text-text-secondary hover:text-shopee-orange hover:border-shopee-orange/40 transition-colors"
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
          <div className="text-xs text-text-secondary leading-relaxed flex-1 space-y-3">
            <p>
              Para gerar links massivos no seu ML Afiliado, acesse esse link:
            </p>
            <a
              href="https://www.mercadolivre.com.br/afiliados/linkbuilder#hub"
              target="_blank"
              rel="noopener noreferrer"
              className={`${mlBtnSecondaryClass} text-xs inline-flex no-underline w-full sm:w-auto justify-center`}
            >
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
              Construtor de links 
            </a>
          </div>
    
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="lg:grid lg:grid-cols-2 gap-6 xl:gap-8 items-start">
          <div className="min-w-0 flex flex-col gap-5">
        <section className="rounded-xl border border-dark-border bg-dark-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex  items-center gap-3">
           
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
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {selectedLista ? (
              <button
                type="button"
                onClick={openOndeSalvarFromMenu}
                title="Clique para trocar de lista"
                className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg text-xs font-medium border border-shopee-orange/50 bg-shopee-orange/8 text-text-primary hover:border-shopee-orange/65 max-w-full"
              >
                <span className="truncate">{selectedLista.nome}</span>
                <span className="text-text-secondary/80 shrink-0 tabular-nums">({selectedLista.totalItens ?? 0})</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" />
              </button>
            ) : (
              <p className="text-xs text-text-secondary">Listas → Onde salvar.</p>
            )}
          </div>
        </section>

        <section className={mlSectionFormClass}>
          <div className={mlSectionHeadClass}>
            <Columns2 className="h-3.5 w-3.5 text-shopee-orange/80 shrink-0" />
            <h2 className={mlSectionTitleClass}>Colar em lote </h2>
            <Toolist
              variant="below"
              wide
              text={`Linha 1 do bloco de produtos alinha com linha 1 dos links meli.la (como no gerador do ML). Máximo ${MAX_BULK_PAIRS} pares por vez.`}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 pt-1">
            <div className="min-w-0">
              <label className={mlFieldLabelClass}>URLs dos produtos</label>
              <textarea
                value={bulkProductUrls}
                onChange={(e) => {
                  setBulkImportWarn(null);
                  setBulkProductUrls(e.target.value);
                }}
                spellCheck={false}
                placeholder={
                  "https://produto.mercadolivre.com.br/MLB-…\nhttps://www.mercadolivre.com.br/…/p/MLB…"
                }
                className={mlTextareaClass}
              />
            </div>
            <div className="min-w-0">
              <label className={mlFieldLabelClass}>Links de afiliado </label>
              <textarea
                value={bulkAffiliateUrls}
                onChange={(e) => {
                  setBulkImportWarn(null);
                  setBulkAffiliateUrls(e.target.value);
                }}
                spellCheck={false}
                placeholder={"https://meli.la/…\nhttps://meli.la/…"}
                className={mlTextareaClass}
              />
            </div>
          </div>

          <div className="rounded-xl border border-dark-border/50 bg-dark-bg/30 px-3 py-3 space-y-2">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Planilha ou bloco de notas
            </p>
        
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={bulkFileInputRef}
                type="file"
                accept=".csv,.txt,.tsv,text/csv,text/plain"
                className="sr-only"
                onChange={onBulkFileSelected}
              />
              <button
                type="button"
                onClick={() => bulkFileInputRef.current?.click()}
                className={`${mlBtnSecondaryClass} text-xs py-2 min-h-9`}
              >
                <Upload className="h-3.5 w-3.5 shrink-0 text-shopee-orange" aria-hidden />
                Dados
              </button>
              <button
                type="button"
                onClick={downloadMlBulkTemplateCsv}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-shopee-orange hover:text-shopee-orange/85 hover:underline py-2"
              >
                <FileDown className="h-3.5 w-3.5 shrink-0 text-shopee-orange" aria-hidden />
                (CSV)
              </button>
              <button
                type="button"
                onClick={downloadMlBulkTemplateTxt}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-shopee-orange hover:text-shopee-orange/85 hover:underline py-2"
              >
                <FileDown className="h-3.5 w-3.5 shrink-0 text-shopee-orange" aria-hidden />
                (TXT)
              </button>
            </div>
            {bulkImportWarn ? (
              <p className="text-xs text-shopee-orange/95 leading-relaxed">{bulkImportWarn}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={
                bulkProductLines.length > 0 || bulkAffiliateLines.length > 0
                  ? bulkPairMatch
                    ? "text-text-secondary"
                    : "text-shopee-orange/90"
                  : "text-text-secondary"
              }
            >
              {bulkProductLines.length} URL(s) de produto · {bulkAffiliateLines.length} link(s) de afiliado
              {!bulkPairMatch &&
              (bulkProductLines.length > 0 || bulkAffiliateLines.length > 0)
                ? " — ajuste para o mesmo número de linhas nos dois blocos"
                : ""}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-3 border-t border-dark-border/60">
            <button
              type="button"
              onClick={runBulkSaveSelected}
              disabled={bulkSaving || !bulkPairMatch || !addListaId}
              title={!addListaId ? "Escolha uma lista em Listas → Onde salvar." : undefined}
              className={mlBtnPrimaryClass}
            >
              Adicionar
            </button>
            <button
              type="button"
              onClick={openBulkNewListModal}
              disabled={bulkSaving || !bulkPairMatch}
              title="Abre um popup para nomear a lista; se deixar em branco, usamos um nome com a data."
              className={mlBtnSecondaryClass}
            >
              Criar lista
            </button>
          </div>
        </section>

        <section className={mlSectionFormClass}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <button
              type="button"
              id="ml-um-produto-accordion-trigger"
              onClick={() => setUmProdutoAccordionOpen((v) => !v)}
              className={`${mlSectionHeadClass} flex flex-wrap items-center gap-2 flex-1 min-w-0 rounded-lg py-1.5 -my-1 pr-2 text-left hover:bg-dark-bg/60 transition-colors`}
              aria-expanded={umProdutoAccordionOpen}
              aria-controls="ml-um-produto-accordion-panel"
            >
              {umProdutoAccordionOpen ? (
                <ChevronDown className="h-4 w-4 text-text-secondary shrink-0" aria-hidden />
              ) : (
                <ChevronRight className="h-4 w-4 text-text-secondary shrink-0" aria-hidden />
              )}
              <Link2 className="h-3.5 w-3.5 text-shopee-orange/80 shrink-0" aria-hidden />
              <span className={mlSectionTitleClass}>Um produto por vez</span>
            </button>
            <Toolist
              variant="below"
              wide
              text="Ao salvar, o app busca na API nome, imagem e preços (URL do anúncio ou meli.la) e grava na lista. Desconto % é opcional e recalcula o preço promo. Para vários itens, use o lote acima."
            />
          </div>
          {umProdutoAccordionOpen ? (
            <div
              id="ml-um-produto-accordion-panel"
              role="region"
              aria-labelledby="ml-um-produto-accordion-trigger"
              className="grid gap-3 sm:grid-cols-2 pt-3 mt-2 border-t border-dark-border/60"
            >
              <div className="sm:col-span-2">
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <label className={mlFieldLabelInlineClass} htmlFor="ml-product-url">
                    URL do anúncio (recomendado)
                  </label>
                  <Toolist
                    variant="floating"
                    wide
                    text="Se não colar aqui, use um link meli.la no campo abaixo — a API tenta resolver só pelo meli.la."
                  />
                </div>
                <input
                  id="ml-product-url"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="Página do produto com MLB na URL"
                  className={mlInputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={mlFieldLabelClass} htmlFor="ml-affiliate-link">
                  Link de afiliado (obrigatório)
                </label>
                <input
                  id="ml-affiliate-link"
                  value={affiliateLink}
                  onChange={(e) => setAffiliateLink(e.target.value)}
                  placeholder="Link do gerador de afiliados (meli.la)"
                  className={mlInputClass}
                />
              </div>
              <div className="sm:col-span-2 sm:max-w-xs">
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <label className={mlFieldLabelInlineClass} htmlFor="ml-discount">
                    Desconto % (opcional)
                  </label>
                  <Toolist
                    variant="floating"
                    text="Se preencher, substitui o desconto vindo da API e recalcula o preço promo a partir do preço original."
                  />
                </div>
                <input
                  id="ml-discount"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(e.target.value)}
                  placeholder="Ex.: 10"
                  className={mlInputClass}
                />
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-dark-border/60">
                <button
                  type="button"
                  onClick={() => void handleAdicionarItem()}
                  disabled={salvandoItem || !addListaId}
                  title={!addListaId ? "Escolha uma lista em Listas → Onde salvar." : undefined}
                  className={`${mlBtnPrimaryClass} h-11 px-6`}
                >
                  {salvandoItem ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Salvar na lista
                </button>
              </div>
            </div>
          ) : null}
        </section>
          </div>

          <aside className="min-w-0 scrollbar-thin lg:sticky lg:top-6 lg:max-h-[calc(100dvh-5rem)] lg:overflow-y-auto lg:overflow-x-hidden lg:pb-2 lg:pr-1 [scrollbar-gutter:stable]">
        {loading ? (
          <div className="flex items-center justify-center py-12 rounded-xl border border-dark-border/60 bg-dark-bg/40">
            <Loader2 className="h-8 w-8 animate-spin text-shopee-orange" />
          </div>
        ) : listas.length === 0 ? (
          <div className="rounded-xl border border-dark-border/60 bg-dark-bg/40 p-6 sm:p-8 text-center text-text-secondary">
            <ListChecks className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-shopee-orange" />
            <p className="font-medium text-text-primary text-sm">Nenhuma lista ainda</p>
            <p className="text-xs sm:text-sm mt-2 max-w-xs mx-auto leading-relaxed">
              Toque em <span className="text-text-primary">Listas</span> → Criar lista, ou use &quot;Criar lista nova e adicionar tudo&quot; no lote. Depois escolha Onde salvar e adicione produtos.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wide border-l-2 border-shopee-orange/60 pl-2 -ml-px">
              Suas listas
            </h2>
            <ul className="space-y-3">
              {pagedListas.map((lista) => {
                const isExpanded = expandedListas.has(lista.id);
                const { slice, totalPages, page, total } = getFilteredAndPaginatedItems(lista.id);
                const listaItemsFull = itemsByLista[lista.id] ?? [];
                const mlIncompleteCount = listaItemsFull.filter(mlItemLooksIncomplete).length;
                const mlHasIncomplete = mlIncompleteCount > 0;
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
                        <Store className="h-5 w-5 text-shopee-orange shrink-0" />
                        <span className="text-lg font-semibold text-text-primary truncate">{lista.nome}</span>
                        <span className="text-sm text-text-secondary shrink-0">({lista.totalItens ?? 0} itens)</span>
                      </span>
                      <span className="flex items-center gap-2 shrink-0 flex-wrap justify-end" onClick={(e) => e.stopPropagation()}>
                        {mlHasIncomplete && !isExpanded ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              void handleRefreshLista(lista.id);
                            }}
                            disabled={refreshTarget !== null}
                            title={`${mlIncompleteCount} item(ns) incompletos. Atualiza toda a lista pelos links salvos.`}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-shopee-orange bg-shopee-orange/15 text-shopee-orange text-xs font-medium hover:bg-shopee-orange/25 hover:border-shopee-orange disabled:opacity-50 relative overflow-hidden ml-refresh-errors"
                          >
                            {refreshTarget === `lista:${lista.id}` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin relative z-[1]" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5 relative z-[1]" />
                            )}
                            <span className="relative z-[1]">Atualizar erros</span>
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEmptyListClick(lista.id); }}
                          disabled={(itemsByLista[lista.id]?.length ?? 0) === 0}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-dark-border text-text-secondary text-xs hover:bg-shopee-orange/10 hover:text-shopee-orange hover:border-shopee-orange/35 disabled:opacity-40"
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
                            <Loader2 className="h-6 w-6 animate-spin text-shopee-orange" />
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
                                title={
                                  mlHasIncomplete
                                    ? `${mlIncompleteCount} item(ns) sem dados completos. Atualiza toda a lista pelos links salvos (meli.la / página do produto).`
                                    : "Atualizar nome, imagem e preços pelos links salvos"
                                }
                                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium disabled:opacity-50 relative overflow-hidden ${
                                  mlHasIncomplete
                                    ? "ml-refresh-errors border-shopee-orange bg-shopee-orange/15 text-shopee-orange hover:bg-shopee-orange/25 hover:border-shopee-orange"
                                    : "border-dark-border text-text-secondary hover:border-shopee-orange/45 hover:text-shopee-orange"
                                }`}
                              >
                                {refreshTarget === `lista:${lista.id}` ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin relative z-[1]" />
                                ) : (
                                  <RefreshCw className="h-3.5 w-3.5 relative z-[1]" />
                                )}
                                <span className="relative z-[1]">{mlHasIncomplete ? "Atualizar erros" : "Atualizar preços"}</span>
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
                                      <span className="text-shopee-orange font-medium">{displayPrecoPorLista(item)}</span>
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
                                        className="text-xs text-emerald-400/90 hover:underline flex items-center gap-1"
                                      >
                                        <ExternalLink className="h-3 w-3 shrink-0" /> Abrir link
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => handleRefreshItem(item.id, lista.id)}
                                        disabled={refreshTarget !== null}
                                        className={`text-xs flex items-center gap-1 disabled:opacity-50 relative overflow-hidden rounded px-0.5 -mx-0.5 ${
                                          mlItemLooksIncomplete(item)
                                            ? "ml-refresh-errors text-shopee-orange font-medium hover:underline"
                                            : "text-text-secondary hover:text-shopee-orange hover:underline"
                                        }`}
                                      >
                                        {refreshTarget === `item:${item.id}` ? (
                                          <Loader2 className="h-3 w-3 animate-spin shrink-0 relative z-[1]" />
                                        ) : (
                                          <RefreshCw className="h-3 w-3 shrink-0 relative z-[1]" />
                                        )}
                                        <span className="relative z-[1]">
                                          {mlItemLooksIncomplete(item) ? "Atualizar erro" : "Atualizar"}
                                        </span>
                                      </button>
                                      <span className="ml-auto flex items-center gap-0.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => openEditItemModal(item, lista.id)}
                                          className="p-1.5 rounded-md text-text-secondary hover:text-shopee-orange hover:bg-shopee-orange/10 transition-colors"
                                          title="Editar nome, preços e desconto"
                                        >
                                          <Pencil className="h-4 w-4 shrink-0" aria-hidden />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteItemClick(item.id, lista.id)}
                                          className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10 transition-colors"
                                          title="Remover da lista"
                                        >
                                          <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                                        </button>
                                      </span>
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
              <div className="rounded-xl border border-dark-border/60 bg-dark-card/80 px-3 py-3">
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
          </aside>
        </div>

        {bulkSaving && typeof document !== "undefined"
          ? createPortal(
              <div
                className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-[2px] px-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ml-bulk-loading-warn"
                aria-describedby="ml-bulk-loading-desc"
              >
                <div className="w-full max-w-md flex flex-col rounded-2xl border border-dark-border bg-dark-card shadow-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-shopee-orange/30 bg-shopee-orange/10">
                    <p
                      id="ml-bulk-loading-warn"
                      className="text-sm font-semibold text-shopee-orange text-center leading-snug"
                    >
                      Não saia da página até carregar todos seus produtos
                    </p>
                  </div>
                  <div className="px-6 py-5 flex items-center gap-5">
                    <div className="shrink-0 h-12 w-12 rounded-xl bg-shopee-orange/10 flex items-center justify-center border border-shopee-orange/20">
                      <Loader2 className="h-5 w-5 text-shopee-orange animate-spin" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-text-primary text-sm leading-snug">Adicionando à lista…</p>
                      <p id="ml-bulk-loading-desc" className="text-sm text-text-secondary mt-1 leading-snug">
                        {bulkProgress
                          ? `${bulkProgress.done} de ${bulkProgress.total} produto(s) — consultando o Mercado Livre`
                          : "Preparando…"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>,
              document.body,
            )
          : null}

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

        {editItemModal && typeof document !== "undefined"
          ? createPortal(
              <div
                className={mlModalOverlayClass}
                role="presentation"
                onClick={() => {
                  if (!savingEditItem) setEditItemModal(null);
                }}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={editItemTitleId}
                  className={`${mlModalShellClass} max-w-md max-h-[min(90vh,640px)]`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={`${mlModalHeaderClass} flex items-start justify-between gap-3`}>
                    <div className="min-w-0">
                      <h2 id={editItemTitleId} className="text-sm font-bold text-text-primary flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-shopee-orange/15 border border-shopee-orange/25 shrink-0">
                          <Pencil className="h-4 w-4 text-shopee-orange" aria-hidden />
                        </span>
                        Editar produto
                      </h2>
                      <p className="text-[11px] text-text-secondary/80 mt-1.5 leading-relaxed">
                        Ajuste manual do nome e dos preços exibidos na lista. O link de afiliado não muda aqui.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!savingEditItem) setEditItemModal(null);
                      }}
                      className="shrink-0 rounded-lg p-1.5 text-text-secondary hover:bg-dark-bg hover:text-text-primary"
                      aria-label="Fechar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-4 space-y-3 overflow-y-auto scrollbar-thin flex-1 min-h-0">
                    <div>
                      <label className={mlFieldLabelClass} htmlFor="ml-edit-name">
                        Nome do produto
                      </label>
                      <input
                        id="ml-edit-name"
                        value={editItemForm.productName}
                        onChange={(e) => setEditItemForm((f) => ({ ...f, productName: e.target.value }))}
                        className={mlInputClass}
                        autoComplete="off"
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className={mlFieldLabelClass} htmlFor="ml-edit-po">
                          Preço original (riscado)
                        </label>
                        <input
                          id="ml-edit-po"
                          inputMode="decimal"
                          value={editItemForm.priceOriginal}
                          onChange={(e) => setEditItemForm((f) => ({ ...f, priceOriginal: e.target.value }))}
                          placeholder="Ex.: 199,90"
                          className={mlInputClass}
                        />
                      </div>
                      <div>
                        <label className={mlFieldLabelClass} htmlFor="ml-edit-pp">
                          Preço final (por)
                        </label>
                        <input
                          id="ml-edit-pp"
                          inputMode="decimal"
                          value={editItemForm.pricePromo}
                          onChange={(e) => setEditItemForm((f) => ({ ...f, pricePromo: e.target.value }))}
                          placeholder="Ex.: 149,90"
                          className={mlInputClass}
                        />
                      </div>
                    </div>
                    <div className="sm:max-w-[200px]">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <label className={mlFieldLabelInlineClass} htmlFor="ml-edit-dr">
                          Desconto % (opcional)
                        </label>
                        <Toolist
                          variant="floating"
                          text="Se preencher e o preço final coincidir com o original, o app recalcula o valor em destaque (por) com o desconto."
                        />
                      </div>
                      <input
                        id="ml-edit-dr"
                        inputMode="decimal"
                        value={editItemForm.discountRate}
                        onChange={(e) => setEditItemForm((f) => ({ ...f, discountRate: e.target.value }))}
                        placeholder="Ex.: 10"
                        className={mlInputClass}
                      />
                    </div>
                  </div>
                  <div className={mlModalFooterClass}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!savingEditItem) setEditItemModal(null);
                      }}
                      className="rounded-xl border border-dark-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-dark-bg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => void submitEditItemModal()}
                      disabled={savingEditItem}
                      className="rounded-xl bg-shopee-orange px-4 py-2 text-sm font-semibold text-white hover:opacity-90 shadow-[0_2px_12px_rgba(238,77,45,0.25)] disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      {savingEditItem ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Salvar
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
