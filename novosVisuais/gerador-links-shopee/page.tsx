"use client";

import { useState, useRef, type Dispatch, type ReactNode, type SetStateAction } from "react";
import {
  Link as LinkIcon,
  Search,
  TrendingUp,
  MousePointer2,
  Copy,
  ExternalLink,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Info,
  X,
  Hash,
  Zap,
  Package,
  History,
  SlidersHorizontal,
  ListPlus,
  Plus,
} from "lucide-react";

function cn(...c: (string | false | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

const fmtCur = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDisc = (r: number) => `${(r / 100).toFixed(0)}% OFF`;

type PanelState = "empty" | "mostSold" | "selected";
type MobileTab = "config" | "produto" | "historico";

type ProductItem = {
  image: string;
  title: string;
  priceOriginal: number;
  discountPercent: number;
  soldCount: number;
  commissionPercent: number;
  commissionValue: number;
};

type HistoryItem = {
  id: string;
  image: string;
  title: string;
  date: string;
  link: string;
  subId?: string;
  commissionPercent: number;
  commissionValue: number;
};

type LinkList = {
  id: string;
  name: string;
  itemIds: string[];
};

const mockProduct = {
  image: "https://via.placeholder.com/150?text=Produto",
  title:
    "Regata AfterSoul Masculina Lisa | 100% Algodão | Esportiva | Ideal Para Academia e Casual",
  store: "@Aftersoul",
  sold: 5,
  rating: 5,
  priceDiscounted: 44.95,
  discountPercent: 5000,
  commissionPercent: 83.0,
  commissionValue: 37.31,
};

const mockMostSold: ProductItem[] = [
  {
    image: "https://via.placeholder.com/64?text=1",
    title: "Kit 3 Blusa Feminina Suplex Manga Curta Baby tee",
    priceOriginal: 39.99,
    discountPercent: 2000,
    soldCount: 10167,
    commissionPercent: 3.0,
    commissionValue: 1.2,
  },
  {
    image: "https://via.placeholder.com/64?text=2",
    title: "Regata Alça Fina Fitness Blusa Feminino Liso Poliamida",
    priceOriginal: 37.9,
    discountPercent: 4600,
    soldCount: 8520,
    commissionPercent: 19.0,
    commissionValue: 7.2,
  },
  {
    image: "https://via.placeholder.com/64?text=3",
    title: "Jaqueta Blusa Jogger Masculina com Capuz Para Frio",
    priceOriginal: 28.98,
    discountPercent: 6800,
    soldCount: 8888,
    commissionPercent: 3.0,
    commissionValue: 0.87,
  },
  {
    image: "https://via.placeholder.com/64?text=4",
    title: "Camisa Térmica Proteção UV 50+ Segunda Pele Camiseta",
    priceOriginal: 28.79,
    discountPercent: 2800,
    soldCount: 8014,
    commissionPercent: 16.0,
    commissionValue: 4.61,
  },
  {
    image: "https://via.placeholder.com/64?text=5",
    title: "Blusa Moletom Masculino Premium Casual Confortável",
    priceOriginal: 59.9,
    discountPercent: 3500,
    soldCount: 6490,
    commissionPercent: 12.0,
    commissionValue: 7.19,
  },
  {
    image: "https://via.placeholder.com/64?text=6",
    title: "Tênis Caminhada Feminino Leve Respirável Academia",
    priceOriginal: 69.9,
    discountPercent: 4100,
    soldCount: 5231,
    commissionPercent: 9.0,
    commissionValue: 6.29,
  },
];

const initialHistory: HistoryItem[] = [
  {
    id: "1",
    image: "https://via.placeholder.com/48?text=Fone",
    title: "Fone De Ouvido Earcuffs Condução De Ossos Sem Fio Bluetooth TWS",
    date: "18/03/2026",
    link: "https://s.shopee.com.br/5AcFone0001",
    subId: "TESTETRAFEGO",
    commissionPercent: 3.0,
    commissionValue: 0.68,
  },
  {
    id: "2",
    image: "https://via.placeholder.com/48?text=Capa",
    title: "Luxo Transparente Chapeamento Para MagSafe Samsung Galaxy S24",
    date: "18/03/2026",
    link: "https://s.shopee.com.br/8KzCapa0002",
    subId: "TESTECELULAR",
    commissionPercent: 7.0,
    commissionValue: 1.11,
  },
  {
    id: "3",
    image: "https://via.placeholder.com/48?text=Camisa",
    title: "Camiseta Oversized Rock Avenged Sevenfold",
    date: "18/03/2026",
    link: "https://s.shopee.com.br/3LmCamisa003",
    subId: "TESTE2",
    commissionPercent: 14.0,
    commissionValue: 3.49,
  },
  {
    id: "4",
    image: "https://via.placeholder.com/48?text=Colar",
    title: "Colar Minimalista Com Pingente De Cruz, Joia Elegante Masculina",
    date: "18/03/2026",
    link: "https://s.shopee.com.br/9QrColar004",
    subId: "TESTE",
    commissionPercent: 7.0,
    commissionValue: 0.2,
  },
];

const initialLists: LinkList[] = [
  { id: "lista-1", name: "achados", itemIds: [] },
  { id: "lista-2", name: "roupas", itemIds: [] },
  { id: "lista-3", name: "casa", itemIds: [] },
];

export default function GeradorDeLinksShopee() {
  const [panelState, setPanelState] = useState<PanelState>("selected");
  const [mobileTab, setMobileTab] = useState<MobileTab>("config");
  const [mainInput, setMainInput] = useState(
    "https://shopee.com.br/Ollie-Protetor-Solar-em-Bast%C3%A3o-Com-Cor"
  );
  const [keyword, setKeyword] = useState("");
  const [subId1, setSubId1] = useState("");
  const [subId2, setSubId2] = useState("");
  const [subId3, setSubId3] = useState("");
  const [search, setSearch] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [selectedMostSoldIndex, setSelectedMostSoldIndex] = useState<number | null>(null);

  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(initialHistory);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [lists, setLists] = useState<LinkList[]>(initialLists);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [activeListId, setActiveListId] = useState<string | null>(initialLists[0]?.id ?? null);
  const [pendingListItemIds, setPendingListItemIds] = useState<string[]>([]);

  const allIds = historyItems.map((h) => h.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  const searchTerm = search.trim().toLowerCase();
  const filteredHistory = historyItems.filter((item) => {
    if (!searchTerm) return true;
    return [item.title, item.subId ?? "", item.date, item.link].some((value) =>
      value.toLowerCase().includes(searchTerm)
    );
  });

  function toggleAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        allIds.forEach((id) => next.delete(id));
      } else {
        allIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function selectProduct() {
    setPanelState("selected");
    setMobileTab("produto");
  }

  function handleConvert() {
    const params = new URLSearchParams();
    if (subId1.trim()) params.set("sub1", subId1.trim());
    if (subId2.trim()) params.set("sub2", subId2.trim());
    if (subId3.trim()) params.set("sub3", subId3.trim());

    const query = params.toString();
    const link = `https://s.shopee.com.br/abc123${query ? `?${query}` : ""}`;
    setGeneratedLink(link);
    setPanelState("selected");
    setMobileTab("produto");
  }

  async function handleCopyLink() {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
    } catch {}
  }

  function handleOpenLink() {
    if (!generatedLink) return;
    window.open(generatedLink, "_blank", "noopener,noreferrer");
  }

  async function handleCopyHistoryLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
    } catch {}
  }

  function handleOpenHistoryLink(link: string) {
    window.open(link, "_blank", "noopener,noreferrer");
  }

  function handleDeleteHistoryItem(id: string) {
    setHistoryItems((prev) => prev.filter((item) => item.id !== id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    setLists((prev) =>
      prev.map((list) => ({
        ...list,
        itemIds: list.itemIds.filter((itemId) => itemId !== id),
      }))
    );
  }

  function handleDeleteSelected() {
    const idsToDelete = new Set(selectedIds);

    setHistoryItems((prev) => prev.filter((item) => !idsToDelete.has(item.id)));

    setLists((prev) =>
      prev.map((list) => ({
        ...list,
        itemIds: list.itemIds.filter((itemId) => !idsToDelete.has(itemId)),
      }))
    );

    setSelectedIds(new Set());
  }

  function isInAnyList(id: string) {
    return lists.some((list) => list.itemIds.includes(id));
  }

  function openAddToListModal(ids: string[]) {
    const uniqIds = Array.from(new Set(ids));
    setPendingListItemIds(uniqIds);
    setActiveListId((prev) => {
      if (prev && lists.some((list) => list.id === prev)) return prev;
      return lists[0]?.id ?? null;
    });
    setIsListModalOpen(true);
  }

  function closeListModal() {
    setIsListModalOpen(false);
    setPendingListItemIds([]);
    setNewListName("");
  }

  function handleCreateList() {
    const name = newListName.trim();
    if (!name) return;

    const existingList = lists.find((list) => list.name.toLowerCase() === name.toLowerCase());

    if (existingList) {
      setActiveListId(existingList.id);
      setNewListName("");
      return;
    }

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `lista-${Date.now()}`;

    setLists((prev) => [...prev, { id, name, itemIds: [] }]);
    setActiveListId(id);
    setNewListName("");
  }

  function handleConfirmAddToList() {
    if (!activeListId || pendingListItemIds.length === 0) return;

    setLists((prev) =>
      prev.map((list) =>
        list.id === activeListId
          ? {
              ...list,
              itemIds: Array.from(new Set([...list.itemIds, ...pendingListItemIds])),
            }
          : list
      )
    );

    closeListModal();
  }

  const canAddToList = Boolean(activeListId) && pendingListItemIds.length > 0;

  return (
    <div className="min-h-screen bg-[#121214] text-[#f0f0f2] flex flex-col rounded-xl overflow-hidden overflow-x-hidden">
      <style jsx>{`
        .dash {
          background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='14' ry='14' stroke='%232c2c32' stroke-width='2' stroke-dasharray='7%2c 7' stroke-linecap='square'/%3e%3c/svg%3e");
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #3e3e3e;
          border-radius: 999px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #e24c30;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <header className="sticky top-0 z-30 h-12 flex items-center justify-between px-3 sm:px-5 border-b border-[#2c2c32] bg-[#121214] gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#e24c30]/15 border border-[#e24c30]/30 flex items-center justify-center shrink-0">
            <LinkIcon className="w-3.5 h-3.5 text-[#e24c30]" />
          </div>
          <span className="text-[13px] sm:text-sm font-bold tracking-tight text-[#f0f0f2] truncate">
            Gerador de Links Shopee
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 sm:px-2.5 py-1 rounded-full border border-emerald-500/25 text-[9px] sm:text-[10px] font-bold shrink-0">
          <CheckCircle2 className="w-3 h-3" />
          <span className="hidden min-[360px]:inline">API conectada</span>
          <span className="min-[360px]:hidden">API</span>
        </div>
      </header>

      <div className="flex items-start border-b border-[#2c2c32]">
        <aside
          className={cn(
            "w-full lg:w-60 lg:shrink-0 border-r border-[#2c2c32] lg:flex flex-col min-w-0",
            mobileTab === "config" ? "flex" : "hidden"
          )}
        >
          <ColHeader
            step={1}
            active
            label="Configurar Link"
            tooltip="Painel principal de configuração. Informe o produto e os Sub IDs para que o sistema gere seu link de afiliado rastreável."
          />

          <div className="p-4 flex flex-col gap-4">
            <FieldGroup
              label="Link ou nome do produto"
              tooltip="Cole o link direto de um produto da Shopee ou digite o nome para busca. O sistema gerará automaticamente seu link de afiliado personalizado."
            >
              <div className="relative">
                <input
                  value={mainInput}
                  onChange={(e) => setMainInput(e.target.value)}
                  placeholder="Cole o link ou nome..."
                  className="w-full bg-[#1c1c1f] border border-[#3e3e3e] rounded-xl px-3 py-2.5 pr-9 text-xs text-[#f0f0f2] placeholder:text-[#868686] focus:border-[#e24c30] focus:ring-1 focus:ring-[#e24c30]/15 outline-none transition"
                />
                {mainInput && (
                  <button
                    onClick={() => setMainInput("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#a0a0a0] hover:text-[#f0f0f2] transition w-7 h-7 flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </FieldGroup>

            <FieldGroup
              label="Sub IDs"
              icon={<Hash className="w-2.5 h-2.5" />}
              tooltip="Identificadores de rastreamento que permitem saber de qual canal vieram seus cliques e vendas. Use nomes como 'instagram', 'whatsapp' ou o nome de uma campanha específica."
            >
              <div className="flex flex-col gap-1.5">
                {[
                  { val: subId1, set: setSubId1, ph: "instagram" },
                  { val: subId2, set: setSubId2, ph: "whatsapp" },
                  { val: subId3, set: setSubId3, ph: "campanha1" },
                ].map((s, i) => (
                  <div key={i} className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-[#e24c30]/70 pointer-events-none">
                      {i + 1}
                    </span>
                    <input
                      value={s.val}
                      onChange={(e) => s.set(e.target.value)}
                      placeholder={s.ph}
                      className="w-full bg-[#1c1c1f] border border-[#3e3e3e] rounded-lg pl-5 pr-3 py-2 text-[11px] text-[#f0f0f2] placeholder:text-[#868686] focus:border-[#e24c30]/50 outline-none transition"
                    />
                  </div>
                ))}
              </div>
            </FieldGroup>

            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2">
              <button className="flex items-center justify-center gap-1.5 bg-[#1c1c1f] border border-[#3e3e3e] text-[#d2d2d2] rounded-xl py-2.5 text-[11px] font-semibold hover:text-[#f0f0f2] hover:border-[#585858] transition min-h-[42px]">
                <Search className="w-3 h-3" /> Buscar
              </button>
              <button
                onClick={handleConvert}
                className="flex items-center justify-center gap-1.5 bg-[#e24c30] text-white rounded-xl py-2.5 text-[11px] font-semibold hover:bg-[#c94028] transition shadow-lg shadow-[#e24c30]/20 min-h-[42px]"
              >
                <Zap className="w-3 h-3" /> Converter
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-[#2c2c32]" />
              <span className="text-[9px] text-[#888888] uppercase tracking-widest font-medium whitespace-nowrap">
                ou explore
              </span>
              <div className="flex-1 h-px bg-[#2c2c32]" />
            </div>

            <FieldGroup
              label="Produtos mais vendidos"
              icon={<TrendingUp className="w-2.5 h-2.5" />}
              tooltip="Pesquise e liste os produtos com maior volume de vendas na Shopee. Clique em um produto para selecioná-lo e gerar o link de afiliado com rastreamento."
            >
              <div className="flex flex-col gap-2">
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Ex: camisas, fones..."
                  className="w-full bg-[#1c1c1f] border border-[#3e3e3e] rounded-xl px-3 py-2.5 text-xs text-[#f0f0f2] placeholder:text-[#868686] focus:border-[#e24c30]/50 outline-none transition"
                />
                <button
                  onClick={() => {
                    setPanelState("mostSold");
                    setMobileTab("produto");
                  }}
                  className="flex items-center justify-center gap-1.5 bg-[#e24c30]/10 border border-[#e24c30]/40 text-[#e24c30] rounded-xl py-2 text-[11px] font-semibold hover:bg-[#e24c30]/20 hover:border-[#e24c30]/70 transition min-h-[42px]"
                >
                  <TrendingUp className="w-3 h-3" /> Listar os mais vendidos
                </button>
              </div>
            </FieldGroup>
          </div>
        </aside>

        <main
          className={cn(
            "flex-1 flex flex-col min-w-0",
            mobileTab === "produto" ? "flex" : "hidden lg:flex"
          )}
        >
          <div className="sticky top-12 z-20">
            <ColHeader
              step={2}
              active={panelState !== "empty"}
              label={
                panelState === "mostSold"
                  ? "Mais Vendidos"
                  : panelState === "selected"
                  ? "Produto"
                  : "Produto"
              }
              tooltip={
                panelState === "mostSold"
                  ? "Lista dos produtos mais vendidos na Shopee com base na sua busca. Clique em qualquer produto para selecioná-lo e gerar o link de afiliado."
                  : undefined
              }
              right={
                panelState !== "empty" ? (
                  <IconBtn onClick={() => setPanelState("empty")}>
                    <X className="w-3 h-3" />
                  </IconBtn>
                ) : undefined
              }
            />
          </div>

          {panelState === "empty" && (
            <div className="flex items-center justify-center p-6 sm:p-10 lg:p-16">
              <div className="dash flex flex-col items-center justify-center py-12 sm:py-16 rounded-2xl w-full max-w-sm text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-[#e24c30]/10 border border-[#e24c30]/20 flex items-center justify-center mb-4">
                  <MousePointer2 className="w-7 h-7 text-[#e24c30]" />
                </div>
                <h3 className="text-base font-bold text-[#f0f0f2] mb-2">
                  Pronto para começar!
                </h3>
                <p className="text-xs text-[#bebebe] leading-relaxed max-w-[200px]">
                  Cole um link ou explore os mais vendidos na barra lateral.
                </p>
              </div>
            </div>
          )}

          {panelState === "mostSold" && (
            <div className="p-4 flex flex-col gap-2">
              <p className="text-[10px] text-[#a0a0a0] pb-1 px-0.5">
                20 produtos · clique para selecionar
              </p>

              {mockMostSold.map((p, i) => (
                <MostSoldCard
                  key={i}
                  product={p}
                  onClick={() => setSelectedMostSoldIndex(i)}
                  compact={false}
                  selected={selectedMostSoldIndex === i}
                />
              ))}

              <div className="flex items-center justify-between pt-2 px-1 gap-2 flex-wrap">
                <button className="flex items-center gap-1 text-[11px] text-[#a0a0a0] hover:text-[#f0f0f2] transition min-h-[36px]">
                  <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                </button>
                <span className="text-[11px] font-semibold text-[#f0f0f2] bg-[#1c1c1f] px-3 py-1 rounded-lg border border-[#2c2c32]">
                  1 / 5
                </span>
                <button className="flex items-center gap-1 text-[11px] text-[#a0a0a0] hover:text-[#f0f0f2] transition min-h-[36px]">
                  Próxima <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {panelState === "selected" && (
            <div className="p-4 sm:p-5 flex flex-col gap-5 max-w-2xl">
              <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-xl p-3 flex gap-3 items-start">
                <div className="w-[76px] h-[76px] rounded-lg bg-white shrink-0 border border-[#2c2c32] overflow-hidden p-1 flex items-center justify-center">
                  <img
                    src={mockProduct.image}
                    alt="Produto"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-[#f0f0f2] leading-snug line-clamp-2">
                    {mockProduct.title}
                  </p>

                  <p className="text-[10px] text-[#a0a0a0] mt-1">
                    {mockProduct.store} · {mockProduct.sold} vendidos ·{" "}
                    {"⭐".repeat(mockProduct.rating)}
                  </p>

                  <div className="flex items-center justify-between gap-3 mt-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[18px] font-bold text-[#e24c30] leading-none">
                        {fmtCur(mockProduct.priceDiscounted)}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        {fmtDisc(mockProduct.discountPercent)}
                      </span>
                    </div>

                    <p className="w-full min-[520px]:w-auto text-[11px] font-semibold text-emerald-400 whitespace-normal break-words min-[520px]:whitespace-nowrap">
                      {mockProduct.commissionPercent.toFixed(1)}% comissão ·{" "}
                      {fmtCur(mockProduct.commissionValue)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <h3 className="text-[11px] font-bold text-[#d8d8d8] uppercase tracking-widest">
                  Ofertas semelhantes
                </h3>

                <div className="mt-3 flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">
                  {mockMostSold.map((p, i) => (
                    <MostSoldCard
                      key={`similar-${i}`}
                      product={p}
                      onClick={selectProduct}
                      compact
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold text-[#d8d8d8] uppercase tracking-widest">
                  Link de afiliado gerado
                </span>

                {generatedLink ? (
                  <div className="flex items-center gap-2 bg-[#1c1c1f] border border-[#2c2c32] rounded-xl px-3.5 py-2.5 hover:border-[#3e3e3e] transition min-w-0 flex-wrap min-[420px]:flex-nowrap">
                    <p className="flex-1 min-w-0 text-[11px] text-[#e24c30] truncate font-mono basis-full min-[420px]:basis-auto">
                      {generatedLink}
                    </p>

                    <div className="flex items-center gap-2 min-[420px]:gap-1.5 shrink-0 ml-auto">
                      <IconBtn onClick={handleCopyLink} title="Copiar">
                        <Copy className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn onClick={handleOpenLink} title="Abrir">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </IconBtn>
                    </div>
                  </div>
                ) : (
                  <div className="dash bg-[#17171a] border border-[#2c2c32] rounded-xl px-4 py-4">
                    <p className="text-[11px] text-[#b5b5ba]">
                      O link aparecerá aqui após clicar em{" "}
                      <span className="font-semibold text-[#f0f0f2]">Converter</span>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <section
        className={cn(
          "border-t border-[#2c2c32] pb-14 lg:pb-0",
          mobileTab === "historico" ? "block" : "hidden lg:block"
        )}
      >
        <div className="px-3 sm:px-5 py-4 border-b border-[#2c2c32] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-[#e24c30]/15 border border-[#e24c30]/25 flex items-center justify-center shrink-0">
              <LinkIcon className="w-3 h-3 text-[#e24c30]" />
            </div>
            <h2 className="text-sm font-bold text-[#f0f0f2] truncate">Histórico de Links</h2>
            <span className="text-[9px] text-[#bebebe] bg-[#232328] px-1.5 py-px rounded-full border border-[#3e3e3e] shrink-0">
              {historyItems.length} links
            </span>
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#969696]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto, sub ID..."
              className="w-full sm:w-56 bg-[#222222] border border-[#484848] rounded-xl py-2 pl-7 pr-3 text-xs text-[#f0f0f2] placeholder:text-[#909090] focus:border-[#e24c30]/60 outline-none transition"
            />
          </div>
        </div>

        <div className="px-3 sm:px-5 py-2.5 border-b border-[#2c2c32] bg-[#1c1c1f] flex flex-col min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <div
              onClick={toggleAll}
              className={cn(
                "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all duration-150",
                allSelected
                  ? "bg-[#e24c30] border-[#e24c30]"
                  : someSelected
                  ? "bg-[#e24c30]/25 border-[#e24c30]/60"
                  : "bg-transparent border-[#585858] group-hover:border-[#e24c30]/50"
              )}
            >
              {allSelected && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
              {someSelected && !allSelected && (
                <span className="w-1.5 h-px bg-[#e24c30] rounded-full block" />
              )}
            </div>

            <span className="text-[11px] font-medium text-[#bebebe] group-hover:text-[#e0e0e0] transition">
              {someSelected
                ? `${selectedIds.size} selecionado${selectedIds.size > 1 ? "s" : ""}`
                : "Selecionar todos"}
            </span>
          </label>

          <div
            className={cn(
              "flex items-center gap-2 transition-all duration-200 flex-wrap w-full min-[420px]:w-auto",
              someSelected
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none h-0 overflow-hidden min-[420px]:h-auto min-[420px]:overflow-visible"
            )}
          >
            <button
              onClick={() => setSelectedIds(new Set())}
              className="flex-1 min-[420px]:flex-none flex items-center justify-center min-[420px]:justify-start gap-1.5 text-[11px] text-[#a0a0a0] hover:text-[#bebebe] font-medium transition bg-[#121214] border border-[#2c2c32] rounded-lg px-2.5 py-2 min-[420px]:bg-transparent min-[420px]:border-0 min-[420px]:rounded-none min-[420px]:px-0 min-[420px]:py-0"
            >
              <X className="w-3 h-3" /> Limpar
            </button>

            <button
              onClick={() => openAddToListModal(Array.from(selectedIds))}
              className="flex-1 min-[420px]:flex-none flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/8 hover:bg-emerald-500/15 border border-emerald-500/20 hover:border-emerald-500/35 px-2.5 py-2 min-[420px]:py-1 rounded-lg transition whitespace-nowrap"
            >
              <ListPlus className="w-3 h-3" /> Adicionar à lista ({selectedIds.size})
            </button>

            <button
              onClick={handleDeleteSelected}
              className="flex-1 min-[420px]:flex-none flex items-center justify-center gap-1.5 text-[11px] font-semibold text-red-400 hover:text-red-300 bg-red-500/8 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/35 px-2.5 py-2 min-[420px]:py-1 rounded-lg transition whitespace-nowrap"
            >
              <Trash2 className="w-3 h-3" /> Excluir {selectedIds.size}
            </button>
          </div>
        </div>

        <div className="divide-y divide-[#2c2c32]">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item) => {
              const addedToList = isInAnyList(item.id);

              return (
                <div
                  key={item.id}
                  className="px-3 sm:px-5 py-3.5 hover:bg-[#1c1c1f] transition"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleOne(item.id)}
                      className="rounded accent-[#e24c30] w-3.5 h-3.5 shrink-0 cursor-pointer mt-0.5"
                    />

                    <div className="w-10 h-10 rounded-lg shrink-0 border border-[#2c2c32] overflow-hidden bg-[#232328]">
                      <img
                        src={item.image}
                        alt="Produto"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#f0f0f2] truncate min-[380px]:truncate line-clamp-2 min-[380px]:line-clamp-none">
                        {item.title}
                      </p>

                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[9px] text-[#a0a0a0]">{item.date}</span>
                        {item.subId && (
                          <span className="text-[9px] font-mono text-[#d2d2d2] bg-[#232328] px-1.5 py-px rounded border border-[#3e3e3e]">
                            #{item.subId}
                          </span>
                        )}
                        <span className="text-[9px] font-semibold text-emerald-400">
                          Comissão {item.commissionPercent.toFixed(1)}% ·{" "}
                          {fmtCur(item.commissionValue)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 mt-2 min-[560px]:hidden">
                        <HistoryActions
                          inList={addedToList}
                          onCopy={() => handleCopyHistoryLink(item.link)}
                          onOpen={() => handleOpenHistoryLink(item.link)}
                          onAddToList={() => openAddToListModal([item.id])}
                          onDelete={() => handleDeleteHistoryItem(item.id)}
                        />
                      </div>
                    </div>

                    <div className="hidden min-[560px]:flex items-center gap-1 shrink-0">
                      <HistoryActions
                        inList={addedToList}
                        onCopy={() => handleCopyHistoryLink(item.link)}
                        onOpen={() => handleOpenHistoryLink(item.link)}
                        onAddToList={() => openAddToListModal([item.id])}
                        onDelete={() => handleDeleteHistoryItem(item.id)}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-3 sm:px-5 py-10 text-center text-[#a0a0a0] text-[12px] bg-[#17171a]">
              Nenhum link encontrado.
            </div>
          )}
        </div>

        <div className="px-3 sm:px-5 py-3.5 border-t border-[#2c2c32] bg-[#1c1c1f] flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-[#a0a0a0]">
            Mostrando {filteredHistory.length} de {historyItems.length} links · Página 1 de 1
          </p>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button className="w-7 h-7 rounded-lg bg-[#121214] border border-[#2c2c32] flex items-center justify-center text-[#a0a0a0] hover:text-[#f0f0f2] transition">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {[1].map((p) => (
              <button
                key={p}
                className="w-7 h-7 rounded-lg text-[11px] font-semibold transition bg-[#e24c30] text-white shadow-md shadow-[#e24c30]/20"
              >
                {p}
              </button>
            ))}

            <button className="w-7 h-7 rounded-lg bg-[#121214] border border-[#2c2c32] flex items-center justify-center text-[#a0a0a0] hover:text-[#f0f0f2] transition">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      <nav className="lg:hidden sticky bottom-0 z-30 h-14 flex items-stretch border-t border-[#2c2c32] bg-[#121214]">
        {(
          [
            {
              id: "config",
              icon: <SlidersHorizontal className="w-4 h-4" />,
              label: "Configurar",
            },
            {
              id: "produto",
              icon: <Package className="w-4 h-4" />,
              label: "Produto",
            },
            {
              id: "historico",
              icon: <History className="w-4 h-4" />,
              label: "Histórico",
            },
          ] as { id: MobileTab; icon: ReactNode; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition min-w-0 px-1",
              mobileTab === tab.id
                ? "text-[#e24c30]"
                : "text-[#a0a0a0] hover:text-[#d2d2d2]"
            )}
          >
            {tab.icon}
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </nav>

      <ListModal
        open={isListModalOpen}
        onClose={closeListModal}
        lists={lists}
        newListName={newListName}
        setNewListName={setNewListName}
        activeListId={activeListId}
        setActiveListId={setActiveListId}
        onCreate={handleCreateList}
        onConfirm={handleConfirmAddToList}
        canConfirm={canAddToList}
        pendingCount={pendingListItemIds.length}
      />
    </div>
  );
}

function MostSoldCard({
  product,
  onClick,
  compact = false,
  selected = false,
}: {
  product: ProductItem;
  onClick: () => void;
  compact?: boolean;
  selected?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl transition text-left group flex flex-wrap items-start gap-x-3 gap-y-2 min-[420px]:flex-nowrap min-[420px]:items-center",
        compact ? "px-2.5 py-2.5" : "px-3 py-3",
        selected
          ? "border border-[#e24c30] bg-[#3B2B2B]"
          : "bg-[#1c1c1f] border border-[#2c2c32] hover:border-[#e24c30]/30 hover:bg-[#232328]"
      )}
    >
      <div
        className={cn(
          "rounded-lg shrink-0 border border-[#2c2c32] overflow-hidden bg-[#232328]",
          compact
            ? "w-10 h-10 min-[360px]:w-11 min-[360px]:h-11"
            : "w-12 h-12 min-[360px]:w-14 min-[360px]:h-14"
        )}
      >
        <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <p
          className={cn(
            "font-semibold text-[#f0f0f2] leading-[1.35] pr-1",
            compact
              ? "text-[12px] line-clamp-2 min-[420px]:line-clamp-1"
              : "text-[13px] min-[360px]:text-xs line-clamp-2 min-[420px]:line-clamp-1"
          )}
        >
          {product.title}
        </p>

        <div className="flex items-center gap-x-2 gap-y-1.5 mt-2 flex-wrap">
          <span
            className={cn(
              "font-bold text-[#e24c30]",
              compact ? "text-[10px]" : "text-[11px] min-[360px]:text-xs"
            )}
          >
            {fmtCur(product.priceOriginal)}
          </span>

          <span
            className={cn(
              "font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-px rounded-md border border-emerald-500/15 whitespace-nowrap",
              compact ? "text-[9px]" : "text-[10px]"
            )}
          >
            {fmtDisc(product.discountPercent)}
          </span>

          <span
            className={cn(
              "text-[#d8d8d8] whitespace-nowrap",
              compact ? "text-[9px]" : "text-[10px]"
            )}
          >
            {product.soldCount.toLocaleString("pt-BR")} vendidos
          </span>
        </div>
      </div>

      <div
        className={cn(
          "flex items-start justify-between gap-3 shrink-0 min-[420px]:items-center min-[420px]:justify-start",
          compact
            ? "w-full pl-[52px] pt-2 mt-1 border-t border-[#2c2c32] min-[420px]:w-auto min-[420px]:pl-0 min-[420px]:pt-0 min-[420px]:mt-0 min-[420px]:border-t-0"
            : "w-full pl-[60px] min-[360px]:pl-[68px] pt-2 mt-1 border-t border-[#2c2c32] min-[420px]:w-auto min-[420px]:pl-0 min-[420px]:pt-0 min-[420px]:mt-0 min-[420px]:border-t-0"
        )}
      >
        <div className="text-left min-[420px]:text-right">
          <p
            className={cn(
              "font-bold text-emerald-400 leading-none",
              compact ? "text-[13px]" : "text-[15px] min-[360px]:text-sm"
            )}
          >
            {fmtCur(product.commissionValue)}
          </p>
          <p className={cn("text-[#bebebe] mt-2", compact ? "text-[9px]" : "text-[10px]")}>
            {product.commissionPercent.toFixed(1)}% comissão
          </p>
        </div>

        <ExternalLink
          className={cn(
            "text-[#e24c30] shrink-0 opacity-100 min-[420px]:opacity-50 min-[420px]:group-hover:opacity-100 transition-opacity mt-0.5 min-[420px]:mt-0",
            compact ? "w-3 h-3" : "w-3.5 h-3.5"
          )}
        />
      </div>
    </button>
  );
}

function HistoryActions({
  inList,
  onCopy,
  onOpen,
  onAddToList,
  onDelete,
}: {
  inList: boolean;
  onCopy: () => void;
  onOpen: () => void;
  onAddToList: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <IconBtn onClick={onCopy} title="Copiar">
        <Copy className="w-3.5 h-3.5" />
      </IconBtn>

      <IconBtn onClick={onOpen} title="Abrir">
        <ExternalLink className="w-3.5 h-3.5" />
      </IconBtn>

      <IconBtn
        onClick={onAddToList}
        title={inList ? "Adicionado à lista" : "Adicionar à lista"}
        active={inList}
      >
        <ListPlus className="w-3.5 h-3.5" />
      </IconBtn>

      <IconBtn onClick={onDelete} title="Excluir" danger>
        <Trash2 className="w-3.5 h-3.5" />
      </IconBtn>
    </>
  );
}

function ListModal({
  open,
  onClose,
  lists,
  newListName,
  setNewListName,
  activeListId,
  setActiveListId,
  onCreate,
  onConfirm,
  canConfirm,
  pendingCount,
}: {
  open: boolean;
  onClose: () => void;
  lists: LinkList[];
  newListName: string;
  setNewListName: Dispatch<SetStateAction<string>>;
  activeListId: string | null;
  setActiveListId: Dispatch<SetStateAction<string | null>>;
  onCreate: () => void;
  onConfirm: () => void;
  canConfirm: boolean;
  pendingCount: number;
}) {
  if (!open) return null;

  const hasTypedName = newListName.trim().length > 0;
  const selectedList = lists.find((list) => list.id === activeListId);

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-[2px] p-3 sm:p-4 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] max-h-[calc(100vh-24px)] sm:max-h-none rounded-[22px] border border-[#2c2c32] bg-[#1b1b1f] shadow-[0_20px_60px_rgba(0,0,0,0.45)] overflow-hidden flex flex-col sm:block"
      >
        <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-[#2c2c32] bg-[#18181b]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#e24c30]/12 border border-[#e24c30]/20 flex items-center justify-center shrink-0">
                <ListPlus className="w-4 h-4 text-[#e24c30]" />
              </div>

              <div className="min-w-0">
                <h3 className="text-[15px] sm:text-[16px] font-bold text-[#f0f0f2] truncate">
                  Adicionar à lista
                </h3>
                <p className="text-[11px] text-[#9c9ca5] mt-0.5">
                  {pendingCount} {pendingCount === 1 ? "link selecionado" : "links selecionados"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[#bdbdc3] hover:text-white hover:bg-white/5 transition shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-5 py-4 flex flex-col gap-4 overflow-y-auto scrollbar-thin">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-[#d8d8d8] uppercase tracking-widest">
              Criar nova lista
            </label>

            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && hasTypedName) onCreate();
                }}
                placeholder="Ex: achados do dia"
                className="flex-1 bg-[#121214] border border-[#2c2c32] rounded-xl px-3.5 py-2.5 text-[12px] text-[#f0f0f2] placeholder:text-[#7d7d86] focus:border-[#e24c30]/60 outline-none transition"
              />

              <button
                onClick={onCreate}
                disabled={!hasTypedName}
                className={cn(
                  "h-[42px] w-full sm:w-auto px-4 rounded-xl text-[12px] font-semibold transition flex items-center justify-center gap-2 shrink-0",
                  hasTypedName
                    ? "bg-[#232328] border border-[#3a3a42] text-[#f0f0f2] hover:border-[#e24c30]/45 hover:text-white"
                    : "bg-[#202025] border border-[#2a2a30] text-[#6f6f78] cursor-not-allowed"
                )}
              >
                <Plus className="w-4 h-4" /> Criar
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[10px] font-bold text-[#d8d8d8] uppercase tracking-widest">
                Escolher lista
              </label>

              <span className="text-[10px] text-[#8e8e96]">
                {lists.length} {lists.length === 1 ? "lista" : "listas"}
              </span>
            </div>

            {lists.length > 0 ? (
              <div className="rounded-2xl border border-[#2c2c32] bg-[#16161a] p-2 max-h-[220px] overflow-y-auto scrollbar-thin">
                {lists.map((list) => {
                  const selected = activeListId === list.id;

                  return (
                    <button
                      key={list.id}
                      onClick={() => setActiveListId(list.id)}
                      className={cn(
                        "w-full rounded-xl px-3.5 py-3 flex items-start sm:items-center justify-between gap-3 text-left transition mb-2 last:mb-0 border flex-wrap sm:flex-nowrap",
                        selected
                          ? "bg-[#2a1d1a] border-[#e24c30]/35"
                          : "bg-[#202025] border-[#2c2c32] hover:bg-[#25252b] hover:border-[#3a3a42]"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition",
                            selected
                              ? "border-[#e24c30] bg-[#e24c30]"
                              : "border-[#5a5a63]"
                          )}
                        >
                          {selected && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>

                        <div className="min-w-0">
                          <p
                            className={cn(
                              "text-[13px] font-semibold truncate",
                              selected ? "text-[#ff7a5b]" : "text-[#f0f0f2]"
                            )}
                          >
                            {list.name}
                          </p>
                          <p className="text-[10px] text-[#9d9da5] mt-0.5">
                            {list.itemIds.length} {list.itemIds.length === 1 ? "item" : "itens"}
                          </p>
                        </div>
                      </div>

                      {selected && (
                        <span className="text-[10px] font-semibold text-[#ffd2c8] bg-[#e24c30]/10 border border-[#e24c30]/15 px-2 py-1 rounded-full shrink-0">
                          Ativa
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#2c2c32] bg-[#16161a] px-4 py-8 text-center">
                <p className="text-[13px] font-medium text-[#e1e1e5]">
                  Nenhuma lista criada
                </p>
                <p className="text-[11px] text-[#96969f] mt-1">
                  Crie uma lista acima para continuar.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] text-[#9a9aa2] truncate">
                {selectedList ? `Destino: ${selectedList.name}` : "Selecione uma lista"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center shrink-0">
              <button
                onClick={onClose}
                className="h-[40px] px-3.5 rounded-xl border border-[#34343b] text-[12px] font-semibold text-[#d7d7dc] hover:text-white hover:border-[#4a4a52] transition"
              >
                Cancelar
              </button>

              <button
                onClick={onConfirm}
                disabled={!canConfirm}
                className={cn(
                  "h-[40px] px-4 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 transition",
                  canConfirm
                    ? "bg-[#e24c30] text-white hover:bg-[#c94028] shadow-md shadow-[#e24c30]/20"
                    : "bg-[#8f442f] text-white/70 cursor-not-allowed"
                )}
              >
                <ListPlus className="w-4 h-4" /> Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const iconRef = useRef<HTMLSpanElement>(null);

  function handleMouseEnter() {
    if (!iconRef.current) return;
    const r = iconRef.current.getBoundingClientRect();
    setPos({ top: r.top, left: r.left + r.width / 2 });
    setVisible(true);
  }

  return (
    <>
      <span
        ref={iconRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setVisible(false)}
        className="inline-flex items-center ml-0.5 cursor-help shrink-0"
      >
        <Info className="w-3 h-3 text-[#686868] hover:text-[#b0b0b0] transition" />
      </span>

      {visible && (
        <span
          style={{
            position: "fixed",
            top: pos.top - 8,
            left: pos.left,
            transform: "translate(-50%, -100%)",
            zIndex: 99999,
            display: "block",
          }}
          className="pointer-events-none w-max max-w-[200px] bg-[#232328] border border-[#3e3e3e] text-[11px] text-[#d8d8d8] font-normal normal-case tracking-normal px-3 py-2 rounded-xl shadow-2xl whitespace-normal leading-relaxed text-center"
        >
          {text}
        </span>
      )}
    </>
  );
}

function ColHeader({
  step,
  active,
  label,
  icon,
  right,
  tooltip,
}: {
  step?: number;
  active?: boolean;
  label: string;
  icon?: ReactNode;
  right?: ReactNode;
  tooltip?: string;
}) {
  return (
    <div className="h-11 flex items-center justify-between gap-2 px-4 border-b border-[#2c2c32] bg-[#121214] min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        {step != null && <StepBadge n={step} active={active} />}
        {icon}
        <span className="text-xs font-bold text-[#f0f0f2] truncate">{label}</span>
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

function StepBadge({ n, active }: { n: number; active?: boolean }) {
  return (
    <span
      className={cn(
        "w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 transition",
        active
          ? "bg-[#e24c30] text-white shadow-md shadow-[#e24c30]/30"
          : "bg-[#323232] text-[#a0a0a0]"
      )}
    >
      {n}
    </span>
  );
}

function FieldGroup({
  label,
  icon,
  children,
  tooltip,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
  tooltip?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label className="text-[9px] font-bold text-[#d8d8d8] uppercase tracking-widest flex items-center gap-1">
        {icon}
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
      </label>
      {children}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
  active,
}: {
  children: ReactNode;
  onClick: () => void;
  title?: string;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "w-6 h-6 rounded-md bg-[#121214] border flex items-center justify-center transition shrink-0",
        active
          ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-400/40"
          : danger
          ? "text-[#a0a0a0] border-[#2c2c32] hover:text-red-400 hover:border-red-400/25"
          : "text-[#a0a0a0] border-[#2c2c32] hover:text-[#f0f0f2] hover:border-[#4c4c52]"
      )}
    >
      {children}
    </button>
  );
}