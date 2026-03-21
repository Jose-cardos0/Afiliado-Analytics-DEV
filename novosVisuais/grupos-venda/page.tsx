"use client";

import { useState, type ReactNode } from "react";
import {
  MessageCircle,
  Zap,
  List as ListIcon,
  Search,
  Trash2,
  Layers,
  Clock,
  Send,
  PlusCircle,
  RefreshCcw,
  Play,
  Pause,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Tag,
  User,
  X,
  Hash,
  Settings2,
  CheckCheck,
  Smartphone,
} from "lucide-react";

function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

const mockSavedLists = [
  { id: "1", name: "G. CAMPANHA NATAL", instance: "PalomaSafadinha", groups: 12 },
  { id: "2", name: "CMP PANELA", instance: "PalomaSafadinha", groups: 8 },
  { id: "3", name: "COLEÇÃO JUJUTSU", instance: "PalomaSafadinha", groups: 5 },
  { id: "4", name: "OFERTAS RELÂMPAGO", instance: "PalomaSafadinha", groups: 20 },
  { id: "5", name: "LEADS FRIOS", instance: "PalomaSafadinha", groups: 3 },
  { id: "6", name: "LISTA EXTRA 1", instance: "PalomaSafadinha", groups: 7 },
  { id: "7", name: "LISTA EXTRA 2", instance: "PalomaSafadinha", groups: 4 },
  { id: "8", name: "LISTA EXTRA 3", instance: "PalomaSafadinha", groups: 4 },
  { id: "9", name: "LISTA EXTRA 4", instance: "PalomaSafadinha", groups: 4 },
  { id: "10", name: "LISTA EXTRA 5", instance: "PalomaSafadinha", groups: 4 },
  { id: "11", name: "LISTA EXTRA 6", instance: "PalomaSafadinha", groups: 4 },
  { id: "12", name: "LISTA EXTRA 7", instance: "PalomaSafadinha", groups: 4 },
  { id: "13", name: "LISTA EXTRA 8", instance: "PalomaSafadinha", groups: 4 },
  { id: "14", name: "LISTA EXTRA 9", instance: "PalomaSafadinha", groups: 4 },
  { id: "15", name: "LISTA EXTRA 10", instance: "PalomaSafadinha", groups: 4 },
  { id: "16", name: "LISTA EXTRA 11", instance: "PalomaSafadinha", groups: 4 },
  { id: "17", name: "LISTA EXTRA 12", instance: "PalomaSafadinha", groups: 4 },
  { id: "18", name: "LISTA EXTRA 13", instance: "PalomaSafadinha", groups: 4 },
  { id: "19", name: "LISTA EXTRA 14", instance: "PalomaSafadinha", groups: 4 },
  { id: "20", name: "LISTA EXTRA 15", instance: "PalomaSafadinha", groups: 4 },
];

const mockDisparos = [
  {
    id: "1",
    title: "TESTE GRUPO 24HRS KEYWORDS",
    status: "Ativo",
    type: "keywords",
    keywords: "air fryer, jogo de lençol casal +18",
    nextRun: "19/03, 21:44",
    instance: "PalomaSafadinha",
  },
  {
    id: "2",
    title: "TESTE HORARIOS LISTA FIXA",
    status: "Ativo",
    type: "list",
    listName: "FIXA",
    schedule: "17:20 – 18:20",
    nextRun: "19/03, 18:20",
    instance: "PalomaSafadinha",
  },
  {
    id: "3",
    title: "DANIEL TESTE",
    status: "Parado",
    type: "keywords",
    keywords: "camisa masculina, camisa feminina +4",
    nextRun: "19/03, 15:06",
    instance: "grupodaniel",
  },
  {
    id: "4",
    title: "DANIEL TESTE",
    status: "Parado",
    type: "list",
    listName: "Animes",
    nextRun: "19/03, 15:06",
    instance: "josedaniel",
  },
  {
    id: "5",
    title: "TESTE1",
    status: "Parado",
    type: "keywords",
    keywords: "camisa, meia +2",
    nextRun: "16/03, 17:09",
    instance: "JOE",
  },
  {
    id: "6",
    title: "COLEÇÃO JUJUTSU",
    status: "Parado",
    type: "list",
    listName: "coleção jujutsu",
    nextRun: "16/03, 17:09",
    instance: "PalomaSafadinha",
  },
  {
    id: "7",
    title: "G. CAMPANHA NATAL",
    status: "Parado",
    type: "list",
    listName: "campanha natal",
    instance: "PalomaSafadinha",
  },
  {
    id: "8",
    title: "G. CAMPANHA NATAL",
    status: "Parado",
    type: "list",
    listName: "campanha natal",
    schedule: "08:00 – 18:00",
    instance: "PalomaSafadinha",
  },
];

const WIZARD_STEPS = [
  { id: 1, label: "Canal" },
  { id: 2, label: "Lista Alvo" },
  { id: 3, label: "Conteúdo" },
  { id: 4, label: "Ativar" },
];

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-[9px] font-bold text-[#d8d8d8] uppercase tracking-widest mb-1.5">
      {children}
    </label>
  );
}

function WizardStepper({
  currentStep,
  onClose,
}: {
  currentStep: number;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start gap-3 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-[#2c2c32]">
      <div className="flex-1 min-w-0">
        <div className="grid grid-cols-4 gap-2 sm:hidden">
          {WIZARD_STEPS.map((step) => {
            const isDone = currentStep > step.id;
            const isActive = currentStep === step.id;

            return (
              <div key={step.id} className="flex flex-col items-center gap-1 min-w-0">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border-2 shrink-0",
                    isDone
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                      : isActive
                      ? "bg-[#e24c30] border-[#e24c30] text-white shadow-lg shadow-[#e24c30]/30"
                      : "bg-[#222228] border-[#2c2c32] text-[#a0a0a0]"
                  )}
                >
                  {isDone ? <CheckCheck className="w-3 h-3" /> : step.id}
                </div>

                <p
                  className={cn(
                    "text-[6px] font-bold uppercase tracking-[0.14em] text-center leading-tight whitespace-normal break-words max-w-full",
                    isActive ? "text-white" : isDone ? "text-emerald-400" : "text-[#a0a0a0]"
                  )}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>

        <div className="hidden sm:flex items-center">
          {WIZARD_STEPS.map((step, index) => {
            const isDone = currentStep > step.id;
            const isActive = currentStep === step.id;
            const isLast = index === WIZARD_STEPS.length - 1;

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1 shrink-0 min-w-[78px]">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all border-2",
                      isDone
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                        : isActive
                        ? "bg-[#e24c30] border-[#e24c30] text-white shadow-lg shadow-[#e24c30]/30"
                        : "bg-[#222228] border-[#2c2c32] text-[#a0a0a0]"
                    )}
                  >
                    {isDone ? <CheckCheck className="w-3.5 h-3.5" /> : step.id}
                  </div>

                  <p
                    className={cn(
                      "text-[8px] font-bold uppercase tracking-widest whitespace-nowrap",
                      isActive ? "text-white" : isDone ? "text-emerald-400" : "text-[#a0a0a0]"
                    )}
                  >
                    {step.label}
                  </p>
                </div>

                {!isLast && (
                  <div
                    className={cn(
                      "flex-1 h-px mx-3 mb-4 transition-all",
                      isDone ? "bg-emerald-500/35" : "bg-[#2c2c32]"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={onClose}
        title="Cancelar e voltar ao painel"
        className="text-[#a0a0a0] hover:text-white transition p-1.5 rounded-lg hover:bg-[#222228] shrink-0 mt-0.5"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function GruposDeVenda() {
  const [view, setView] = useState<"panel" | "wizard">("panel");
  const [wizardStep, setWizardStep] = useState(1);

  const [activeInstance, setActiveInstance] = useState("PalomaSafadinha");
  const [selectedListId, setSelectedListId] = useState("");
  const [listSearch, setListSearch] = useState("");
  const [panelSearch, setPanelSearch] = useState("");
  const [showStepInfo, setShowStepInfo] = useState(false);

  const [subIdCanal, setSubIdCanal] = useState("");
  const [subIdLista, setSubIdLista] = useState("");
  const [subIdCampanha, setSubIdCampanha] = useState("");

  const [contentMode, setContentMode] = useState<"keywords" | "list">("keywords");
  const [keywords, setKeywords] = useState("");
  const [scheduleMode, setScheduleMode] = useState<"24h" | "window">("window");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listName, setListName] = useState("");

  const activeCount = mockDisparos.filter((d) => d.status === "Ativo").length;
  const keywordCount = keywords.split("\n").filter((k) => k.trim()).length;
  const instances = ["PalomaSafadinha", "josePikaDeMel"];
  const selectedList = mockSavedLists.find((l) => l.id === selectedListId);

  const filteredLists = mockSavedLists.filter((l) =>
    l.name.toLowerCase().includes(listSearch.toLowerCase())
  );

  const filteredDisparos = mockDisparos.filter(
    (d) =>
      d.title.toLowerCase().includes(panelSearch.toLowerCase()) ||
      d.instance?.toLowerCase().includes(panelSearch.toLowerCase())
  );

  function openWizard() {
    setWizardStep(1);
    setShowStepInfo(false);
    setView("wizard");
  }

  function closeWizard() {
    setShowStepInfo(false);
    setView("panel");
  }

  function handleNext() {
    setShowStepInfo(false);
    if (wizardStep < 4) setWizardStep((s) => s + 1);
  }

  function handleBack() {
    setShowStepInfo(false);
    if (wizardStep > 1) setWizardStep((s) => s - 1);
  }

  function handleFinish() {
    setShowStepInfo(false);
    closeWizard();
  }

  const stepMeta: Record<number, { title: string; description: ReactNode }> = {
    1: {
      title: "Selecionar Canal WhatsApp",
      description:
        "Selecione o número do WhatsApp que será usado para disparar mensagens nos grupos. Apenas instâncias conectadas estão disponíveis.",
    },
    2: {
      title: "Definir Lista de Grupos Alvo",
      description: (
        <>
          Selecione uma lista já salva ou crie uma nova buscando os grupos da instância{" "}
          <span className="text-white font-semibold">{activeInstance}</span>.
        </>
      ),
    },
    3: {
      title: "Configurar Conteúdo e Rastreamento",
      description:
        "Defina o que será enviado nos grupos e configure os Sub IDs para rastreamento de vendas por canal.",
    },
    4: {
      title: "Definir Horário e Ativar Disparo",
      description:
        "Defina a janela de funcionamento e escolha como ativar. A automação aparecerá no Painel de Controle após confirmação.",
    },
  };

  return (
    <div className="flex flex-col w-full text-[#f0f0f2] bg-[#121214] min-h-screen rounded-lg p-3 sm:p-6 gap-4 sm:gap-5">
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #3e3e3e; border-radius: 10px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #e24c30; }
      `}</style>

      <header>
        <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2.5 text-white">
          <div className="p-1.5 bg-[#e24c30]/10 rounded-lg border border-[#e24c30]/20 shrink-0">
            <MessageCircle className="w-4 h-4 text-[#e24c30]" />
          </div>
          Grupos de Venda
        </h1>
        <p className="text-[11px] text-[#a0a0a0] mt-1 leading-relaxed">
          Dispare ofertas automaticamente em grupos do WhatsApp — uma vez ou em loop 24h.
        </p>
      </header>

      {view === "panel" && (
        <>
          <button
            onClick={openWizard}
            className="w-full flex items-center justify-between bg-[#1c1c1f] border border-[#2c2c32] hover:border-[#e24c30]/40 rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 transition-all group gap-3 text-left"
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-[#e24c30]/10 border border-[#e24c30]/20 flex items-center justify-center shrink-0 group-hover:bg-[#e24c30]/20 group-hover:shadow-lg group-hover:shadow-[#e24c30]/15 transition-all">
                <PlusCircle className="w-4 h-4 text-[#e24c30]" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] sm:text-[12px] font-bold text-white leading-tight">
                  Criar Nova Automação
                </p>
                <p className="text-[9px] sm:text-[10px] text-[#a0a0a0] mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">
                  Configure instância, lista de grupos, conteúdo e horário passo a passo.
                </p>
              </div>
            </div>

            <div className="w-8 h-8 rounded-lg bg-[#222228] border border-[#2c2c32] flex items-center justify-center shrink-0 group-hover:bg-[#e24c30]/10 group-hover:border-[#e24c30]/25 transition-all">
              <ChevronRight className="w-4 h-4 text-[#a0a0a0] group-hover:text-[#e24c30] transition-colors" />
            </div>
          </button>

          <section className="bg-[#1c1c1f] border border-[#2c2c32] rounded-xl overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 border-b border-[#2c2c32]">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Settings2 className="w-3.5 h-3.5 text-[#e24c30]" />
                    Painel de Controle
                  </h2>

                  <span className="text-[9px] font-bold text-[#a0a0a0] bg-[#222228] border border-[#2c2c32] px-2 py-0.5 rounded-md">
                    {mockDisparos.length} disparos
                  </span>

                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 rounded-full">
                    {activeCount} ativos
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <Search className="w-3 h-3 text-[#a0a0a0] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={panelSearch}
                      onChange={(e) => setPanelSearch(e.target.value)}
                      placeholder="Buscar disparo..."
                      className="w-full bg-[#222228] border border-[#3e3e3e] rounded-lg pl-7 pr-7 py-2 sm:py-1.5 text-[10px] text-white placeholder:text-[#868686] focus:border-[#e24c30] outline-none transition"
                    />
                    {panelSearch && (
                      <button
                        onClick={() => setPanelSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#a0a0a0] hover:text-white transition"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-amber-400 border border-amber-400/25 bg-amber-400/5 px-3 py-2 sm:py-1.5 rounded-lg text-[9px] font-bold hover:bg-amber-400/10 transition">
                      <Zap className="w-3 h-3 fill-amber-400" />
                      <span className="sm:hidden">Testar</span>
                      <span className="hidden sm:inline">Testar agora</span>
                    </button>

                    <button className="text-[#a0a0a0] hover:text-white transition p-2 sm:p-1.5 rounded-lg hover:bg-[#222228] shrink-0">
                      <RefreshCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto scrollbar-thin">
              {filteredDisparos.length > 0 ? (
                filteredDisparos.map((item) => {
                  const isActive = item.status === "Ativo";

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "bg-[#222228] border rounded-xl p-3 sm:p-3.5 flex flex-col gap-2.5 transition-all min-w-0",
                        isActive
                          ? "border-emerald-500/20 shadow-sm shadow-emerald-500/5"
                          : "border-[#2c2c32] hover:border-[#3e3e3e]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-1.5 min-w-0">
                        <h3 className="text-[10px] font-bold text-white uppercase tracking-wide leading-tight line-clamp-2 flex-1 min-w-0">
                          {item.title}
                        </h3>

                        {isActive ? (
                          <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full shrink-0">
                            <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                            Ativo
                          </span>
                        ) : (
                          <span className="text-[8px] font-bold text-[#a0a0a0] bg-[#1c1c1f] border border-[#2c2c32] px-1.5 py-0.5 rounded-full shrink-0">
                            Parado
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        {item.type === "keywords" && item.keywords && (
                          <div className="flex items-start gap-1.5 text-[9px] text-[#a0a0a0] min-w-0">
                            <Hash className="w-2.5 h-2.5 text-[#e24c30] shrink-0 mt-0.5" />
                            <span className="line-clamp-2 break-words">{item.keywords}</span>
                          </div>
                        )}

                        {item.type === "list" && item.listName && (
                          <div className="flex items-center gap-1.5 text-[9px] text-[#a0a0a0] min-w-0">
                            <Layers className="w-2.5 h-2.5 text-[#e24c30] shrink-0" />
                            <span className="truncate">
                              Lista: <span className="text-white">{item.listName}</span>
                            </span>
                          </div>
                        )}

                        {item.instance && (
                          <div className="flex items-center gap-1.5 text-[9px] text-[#a0a0a0] min-w-0">
                            <User className="w-2.5 h-2.5 text-[#e24c30] shrink-0" />
                            <span className="truncate">{item.instance}</span>
                          </div>
                        )}

                        {item.schedule && (
                          <div className="flex items-center gap-1.5 text-[9px] min-w-0">
                            <Clock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                            <span className="text-emerald-400 font-semibold break-words">
                              {item.schedule}
                            </span>
                          </div>
                        )}

                        {item.nextRun && (
                          <div className="flex items-center gap-1.5 text-[9px] text-[#a0a0a0] min-w-0">
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            <span className="break-words">
                              Próx: <span className="text-white font-semibold">{item.nextRun}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-[#2c2c32]">
                        {isActive ? (
                          <button className="flex-1 flex items-center justify-center gap-1 text-[9px] font-bold text-red-400 border border-red-400/15 bg-red-400/5 py-1.5 rounded-lg hover:bg-red-400/15 transition">
                            <Pause className="w-2.5 h-2.5 fill-red-400" />
                            Pausar
                          </button>
                        ) : (
                          <button className="flex-1 flex items-center justify-center gap-1 text-[9px] font-bold text-emerald-400 border border-emerald-500/15 bg-emerald-500/5 py-1.5 rounded-lg hover:bg-emerald-500/15 transition">
                            <Play className="w-2.5 h-2.5 fill-emerald-400" />
                            Ativar
                          </button>
                        )}

                        <button className="text-[#a0a0a0] hover:text-red-400 transition bg-[#1c1c1f] border border-[#2c2c32] p-1.5 rounded-lg hover:border-red-400/20 shrink-0">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <Search className="w-7 h-7 text-[#2c2c32]" />
                  <p className="text-[11px] font-semibold text-[#a0a0a0]">
                    Nenhum disparo encontrado
                  </p>
                  <p className="text-[9px] text-[#a0a0a0]/60">
                    Tente outro título ou instância.
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {view === "wizard" && (
        <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-xl sm:rounded-2xl overflow-hidden flex flex-col min-w-0">
          <WizardStepper currentStep={wizardStep} onClose={closeWizard} />

          <div className="px-4 sm:px-6 py-4 border-b border-[#2c2c32]">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-bold text-white leading-snug">
                {stepMeta[wizardStep].title}
              </h2>

              <button
                type="button"
                onClick={() => setShowStepInfo((v) => !v)}
                className="sm:hidden w-7 h-7 rounded-full border border-[#2c2c32] bg-[#222228] text-[#a0a0a0] hover:text-white hover:border-[#3e3e3e] transition shrink-0"
                aria-label="Mostrar informação"
              >
                ⓘ
              </button>
            </div>

            <p className="hidden sm:block text-[11px] text-[#a0a0a0] leading-relaxed mt-1">
              {stepMeta[wizardStep].description}
            </p>

            {showStepInfo && (
              <div className="sm:hidden mt-3 rounded-xl border border-[#2c2c32] bg-[#222228] px-3 py-2.5 text-[10px] text-[#a0a0a0] leading-relaxed">
                {stepMeta[wizardStep].description}
              </div>
            )}
          </div>

          <div className="flex-1 p-4 sm:p-6 min-w-0">
            {wizardStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 sm:gap-6">
                <div className="bg-[#222228] border border-[#2c2c32] rounded-xl p-4 flex flex-col gap-2 h-fit">
                  <p className="text-[9px] font-bold text-[#d8d8d8] uppercase tracking-widest">
                    💡 Sobre Instâncias
                  </p>
                  <p className="text-[10px] text-[#a0a0a0] leading-relaxed">
                    Cada instância representa um número de WhatsApp conectado à plataforma.
                    Múltiplas instâncias permitem separar campanhas por conta.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 min-w-0">
                  {instances.map((inst) => {
                    const isSelected = activeInstance === inst;

                    return (
                      <button
                        key={inst}
                        onClick={() => setActiveInstance(inst)}
                        className={cn(
                          "flex items-start sm:items-center gap-4 p-4 rounded-xl border-2 text-left transition-all min-w-0",
                          isSelected
                            ? "border-[#e24c30] bg-[#e24c30]/5 shadow-lg shadow-[#e24c30]/10"
                            : "border-[#2c2c32] bg-[#222228] hover:border-[#3e3e3e]"
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                            isSelected
                              ? "bg-[#e24c30]/10 border-[#e24c30]/30"
                              : "bg-[#1c1c1f] border-[#2c2c32]"
                          )}
                        >
                          <Smartphone
                            className={cn(
                              "w-4 h-4",
                              isSelected ? "text-[#e24c30]" : "text-[#a0a0a0]"
                            )}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-[12px] font-bold truncate",
                              isSelected ? "text-white" : "text-[#d8d8d8]"
                            )}
                          >
                            {inst}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[9px] text-emerald-400 font-semibold">
                              Conectada
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#e24c30] flex items-center justify-center shrink-0">
                            <CheckCheck className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <Search className="w-3.5 h-3.5 text-[#a0a0a0] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={listSearch}
                      onChange={(e) => setListSearch(e.target.value)}
                      placeholder="Buscar lista por nome..."
                      className="w-full bg-[#222228] border border-[#3e3e3e] rounded-lg pl-8 pr-8 py-2.5 sm:py-2 text-[10px] text-white placeholder:text-[#868686] focus:border-[#e24c30] outline-none transition"
                    />
                    {listSearch && (
                      <button
                        onClick={() => setListSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a0a0a0] hover:text-white transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 shrink-0 bg-[#e24c30]/5 border border-[#e24c30]/25 hover:bg-[#e24c30]/10 hover:border-[#e24c30]/45 rounded-lg px-3.5 py-2.5 sm:py-2 transition-all group"
                  >
                    <div className="w-5 h-5 rounded-md bg-[#e24c30]/10 border border-[#e24c30]/20 flex items-center justify-center shrink-0 group-hover:bg-[#e24c30]/20 transition-all">
                      <PlusCircle className="w-3 h-3 text-[#e24c30]" />
                    </div>
                    <span className="text-[10px] font-bold text-[#e24c30]">
                      Criar nova lista
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-1.5 max-h-[192px] overflow-y-auto scrollbar-thin pr-1">
                  {filteredLists.length > 0 ? (
                    filteredLists.map((list) => {
                      const isSelected = selectedListId === list.id;

                      return (
                        <button
                          key={list.id}
                          onClick={() => setSelectedListId(isSelected ? "" : list.id)}
                          className={cn(
                            "flex items-center gap-3 p-2.5 rounded-xl border-2 text-left transition-all min-w-0",
                            isSelected
                              ? "border-[#e24c30] bg-[#e24c30]/5"
                              : "border-[#2c2c32] bg-[#222228] hover:border-[#3e3e3e]"
                          )}
                        >
                          <div
                            className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border",
                              isSelected
                                ? "bg-[#e24c30]/10 border-[#e24c30]/30"
                                : "bg-[#1c1c1f] border-[#2c2c32]"
                            )}
                          >
                            <ListIcon
                              className={cn(
                                "w-3.5 h-3.5",
                                isSelected ? "text-[#e24c30]" : "text-[#a0a0a0]"
                              )}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "text-[11px] font-bold truncate",
                                isSelected ? "text-white" : "text-[#d8d8d8]"
                              )}
                            >
                              {list.name}
                            </p>
                            <p className="text-[9px] text-[#a0a0a0] mt-0.5 truncate">
                              {list.instance} · {list.groups} grupos
                            </p>
                          </div>

                          {isSelected && (
                            <CheckCheck className="w-3.5 h-3.5 text-[#e24c30] shrink-0" />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center gap-2 py-8 text-center">
                      <Search className="w-6 h-6 text-[#2c2c32]" />
                      <p className="text-[11px] font-semibold text-[#a0a0a0]">
                        Nenhuma lista encontrada
                      </p>
                      <p className="text-[9px] text-[#a0a0a0]/60">
                        Tente um nome diferente ou crie uma nova lista.
                      </p>
                    </div>
                  )}
                </div>

                {selectedList && (
                  <div className="flex items-start sm:items-center gap-2.5 bg-[#e24c30]/5 border border-[#e24c30]/20 rounded-lg px-4 py-2.5">
                    <CheckCheck className="w-3.5 h-3.5 text-[#e24c30] shrink-0 mt-0.5 sm:mt-0" />
                    <p className="text-[10px] font-semibold text-white leading-relaxed">
                      <span className="text-[#e24c30]">{selectedList.name}</span> selecionada —{" "}
                      <span className="text-[#a0a0a0] font-normal">
                        {selectedList.groups} grupos
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {wizardStep === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex flex-col gap-3 min-w-0">
                  <FieldLabel>Tipo de Conteúdo</FieldLabel>

                  <div className="flex flex-col sm:flex-row rounded-xl overflow-hidden border border-[#2c2c32]">
                    <button
                      onClick={() => setContentMode("keywords")}
                      className={cn(
                        "flex-1 flex items-center justify-start sm:justify-center gap-2 px-3 py-2.5 text-[10px] font-bold transition-all sm:border-r border-[#2c2c32]",
                        contentMode === "keywords"
                          ? "bg-[#e24c30]/15 text-[#e24c30]"
                          : "bg-[#222228] text-[#a0a0a0] hover:text-white"
                      )}
                    >
                      <Hash className="w-3 h-3" />
                      Keywords
                    </button>

                    <button
                      onClick={() => setContentMode("list")}
                      className={cn(
                        "flex-1 flex items-center justify-start sm:justify-center gap-2 px-3 py-2.5 text-[10px] font-bold transition-all border-t sm:border-t-0 border-[#2c2c32]",
                        contentMode === "list"
                          ? "bg-[#e24c30]/15 text-[#e24c30]"
                          : "bg-[#222228] text-[#a0a0a0] hover:text-white"
                      )}
                    >
                      <Layers className="w-3 h-3" />
                      Lista de Ofertas
                    </button>
                  </div>

                  {contentMode === "keywords" ? (
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <FieldLabel>Keywords (uma por linha)</FieldLabel>
                      <textarea
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder={"camisa masculina\ntenis corrida\nfone bluetooth"}
                        className="w-full h-[140px] bg-[#222228] border border-[#3e3e3e] rounded-xl p-3.5 text-[11px] text-[#f0f0f2] placeholder:text-[#868686] focus:border-[#e24c30] outline-none resize-none scrollbar-thin leading-relaxed transition"
                      />
                      <p className="text-[9px] text-[#a0a0a0] leading-relaxed break-words">
                        {keywordCount} keyword{keywordCount !== 1 ? "s" : ""} · 1 produto por
                        keyword por grupo.
                      </p>
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <FieldLabel>Lista de Ofertas</FieldLabel>
                      <div className="relative">
                        <select className="appearance-none w-full bg-[#222228] border border-[#3e3e3e] pl-4 pr-8 py-2.5 rounded-xl text-[11px] font-semibold text-[#f0f0f2] focus:border-[#e24c30] focus:outline-none transition cursor-pointer">
                          <option>Sem lista de ofertas (usa keywords)</option>
                          <option>Lista Black Friday</option>
                          <option>Lista Eletrônicos</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-[#a0a0a0] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      <p className="text-[9px] text-[#a0a0a0] mt-2 leading-relaxed">
                        A lista de ofertas substitui as keywords e envia produtos fixos em
                        rotação.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 min-w-0">
                  <FieldLabel>
                    <span className="inline-flex items-center gap-1 flex-wrap">
                      <Tag className="w-2.5 h-2.5" />
                      Sub IDs de Rastreamento
                      <span className="text-[8px] normal-case tracking-normal font-normal text-[#a0a0a0] ml-1">
                        (opcional)
                      </span>
                    </span>
                  </FieldLabel>

                  <div className="flex flex-col gap-2">
                    {[
                      { label: "Canal", value: subIdCanal, setter: setSubIdCanal, ph: "Ex: whatsapp" },
                      { label: "Lista", value: subIdLista, setter: setSubIdLista, ph: "Ex: natal" },
                      { label: "Campanha", value: subIdCampanha, setter: setSubIdCampanha, ph: "Ex: black25" },
                    ].map(({ label, value, setter, ph }) => (
                      <div
                        key={label}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-3"
                      >
                        <span className="text-[8px] text-[#a0a0a0] uppercase tracking-widest font-bold w-full sm:w-16 shrink-0">
                          {label}
                        </span>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setter(e.target.value)}
                          placeholder={ph}
                          className="w-full flex-1 bg-[#222228] border border-[#3e3e3e] rounded-lg px-3 py-2.5 sm:py-2 text-[10px] text-white placeholder:text-[#868686] focus:border-[#e24c30] outline-none transition"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 4 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-[#222228] border border-[#2c2c32] rounded-xl p-4 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <label className="flex items-center gap-1.5 text-[9px] font-bold text-[#d8d8d8] uppercase tracking-widest leading-relaxed">
                      <Clock className="w-2.5 h-2.5 text-[#e24c30] shrink-0" />
                      Horário de Funcionamento
                    </label>

                    <div className="flex rounded-lg overflow-hidden border border-[#2c2c32] text-[9px] font-bold self-start sm:self-auto">
                      <button
                        onClick={() => setScheduleMode("window")}
                        className={cn(
                          "px-3 py-1.5 transition-all",
                          scheduleMode === "window"
                            ? "bg-[#e24c30]/20 text-[#e24c30]"
                            : "bg-transparent text-[#a0a0a0] hover:text-white"
                        )}
                      >
                        JANELA
                      </button>
                      <button
                        onClick={() => setScheduleMode("24h")}
                        className={cn(
                          "px-3 py-1.5 border-l border-[#2c2c32] transition-all",
                          scheduleMode === "24h"
                            ? "bg-[#e24c30]/20 text-[#e24c30]"
                            : "bg-transparent text-[#a0a0a0] hover:text-white"
                        )}
                      >
                        24H
                      </button>
                    </div>
                  </div>

                  {scheduleMode === "24h" ? (
                    <p className="text-[10px] text-[#a0a0a0] leading-relaxed">
                      <span className="text-emerald-400 font-semibold">✓ Sem restrição</span> —
                      o disparo funciona o dia todo, sem interrupções.
                    </p>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="flex-1">
                        <p className="text-[8px] text-[#a0a0a0] mb-1.5 uppercase tracking-widest font-bold">
                          Início
                        </p>
                        <input
                          type="time"
                          className="w-full bg-[#1c1c1f] border border-[#3e3e3e] rounded-lg px-3 py-2.5 text-xs text-white focus:border-[#e24c30] outline-none text-center transition"
                        />
                      </div>

                      <span className="hidden sm:block text-[#a0a0a0] mt-4">→</span>

                      <div className="flex-1">
                        <p className="text-[8px] text-[#a0a0a0] mb-1.5 uppercase tracking-widest font-bold">
                          Fim
                        </p>
                        <input
                          type="time"
                          className="w-full bg-[#1c1c1f] border border-[#3e3e3e] rounded-lg px-3 py-2.5 text-xs text-white focus:border-[#e24c30] outline-none text-center transition"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-[#222228] border border-[#2c2c32] rounded-xl p-4 min-w-0">
                  <p className="text-[9px] font-bold text-[#d8d8d8] uppercase tracking-widest mb-4">
                    Resumo da Automação
                  </p>

                  <div className="flex flex-col gap-3">
                    {[
                      {
                        icon: <Smartphone className="w-3.5 h-3.5 text-[#e24c30] shrink-0" />,
                        label: "Canal",
                        value: activeInstance,
                        warn: false,
                      },
                      {
                        icon: <ListIcon className="w-3.5 h-3.5 text-[#e24c30] shrink-0" />,
                        label: "Lista",
                        value: selectedList?.name ?? null,
                        warn: !selectedList,
                      },
                      {
                        icon: <Hash className="w-3.5 h-3.5 text-[#e24c30] shrink-0" />,
                        label: "Conteúdo",
                        value:
                          contentMode === "keywords"
                            ? `${keywordCount} keyword${keywordCount !== 1 ? "s" : ""}`
                            : "Lista de ofertas",
                        warn: false,
                      },
                      {
                        icon: <Clock className="w-3.5 h-3.5 text-[#e24c30] shrink-0" />,
                        label: "Horário",
                        value:
                          scheduleMode === "24h"
                            ? "24h — sem restrição"
                            : "Janela configurada",
                        warn: false,
                      },
                    ].map(({ icon, label, value, warn }) => (
                      <div
                        key={label}
                        className="flex items-start gap-3 py-2 border-b border-[#2c2c32] last:border-0 min-w-0"
                      >
                        <div className="w-6 h-6 rounded-lg bg-[#1c1c1f] border border-[#2c2c32] flex items-center justify-center shrink-0">
                          {icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] text-[#a0a0a0] uppercase tracking-widest font-bold">
                            {label}
                          </p>

                          {warn ? (
                            <p className="text-[10px] text-amber-400 font-semibold mt-0.5 leading-relaxed">
                              Nenhuma selecionada
                            </p>
                          ) : (
                            <p className="text-[10px] text-white font-semibold mt-0.5 leading-relaxed break-words">
                              {value}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 sm:px-6 py-4 border-t border-[#2c2c32] bg-[#191920] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-b-xl sm:rounded-b-2xl">
            <button
              onClick={handleBack}
              disabled={wizardStep === 1}
              className={cn(
                "w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all border",
                wizardStep === 1
                  ? "text-[#a0a0a0]/30 border-[#2c2c32]/30 cursor-not-allowed"
                  : "text-[#a0a0a0] border-[#2c2c32] hover:text-white hover:border-[#3e3e3e] bg-[#222228]"
              )}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Voltar
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="hidden sm:flex items-center gap-1.5 mr-2">
                {WIZARD_STEPS.map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      "rounded-full transition-all",
                      s.id === wizardStep
                        ? "w-4 h-1.5 bg-[#e24c30]"
                        : s.id < wizardStep
                        ? "w-1.5 h-1.5 bg-emerald-500/50"
                        : "w-1.5 h-1.5 bg-[#2c2c32]"
                    )}
                  />
                ))}
              </div>

              {wizardStep < 4 ? (
                <button
                  onClick={handleNext}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#e24c30] hover:bg-[#c94028] text-white px-5 py-2.5 rounded-xl text-[11px] font-bold transition-all shadow-lg shadow-[#e24c30]/20"
                >
                  Avançar
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  className={cn(
                    "w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all shadow-lg group",
                    scheduleMode === "24h"
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 shadow-emerald-500/5 hover:shadow-emerald-500/20"
                      : "bg-[#e24c30]/10 border border-[#e24c30]/25 text-[#e24c30] hover:bg-[#e24c30] hover:text-white shadow-[#e24c30]/5 hover:shadow-[#e24c30]/20"
                  )}
                >
                  {scheduleMode === "24h" ? (
                    <PlusCircle className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
                  ) : (
                    <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  )}
                  {scheduleMode === "24h" ? "Disparo 24h" : "Disparar"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm sm:flex sm:items-center sm:justify-center sm:px-4">
          <div className="bg-[#1c1c1f] border border-[#2c2c32] w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-[480px] flex flex-col shadow-2xl shadow-black/60 rounded-none sm:rounded-2xl">
            <div className="flex items-start justify-between px-4 sm:px-5 py-4 border-b border-[#2c2c32] shrink-0">
              <div className="min-w-0 pr-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 leading-snug">
                  <MessageCircle className="w-4 h-4 text-[#e24c30] shrink-0" />
                  Buscar Grupos da Instância
                </h2>
                <p className="text-[9px] text-[#a0a0a0] mt-0.5 leading-relaxed">
                  Selecione os grupos, dê um nome e salve como lista.
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#a0a0a0] hover:text-white transition p-1.5 rounded-lg hover:bg-[#222228] shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
              <div>
                <FieldLabel>Instância</FieldLabel>
                <div className="relative">
                  <select className="appearance-none w-full bg-[#222228] border border-[#3e3e3e] text-white text-[11px] font-semibold rounded-lg px-4 py-2.5 outline-none focus:border-[#e24c30] transition cursor-pointer">
                    <option>{activeInstance}</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#a0a0a0] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="mt-2 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-bold text-emerald-400">Conectada</span>
                </div>
              </div>

              <button className="w-full sm:w-fit flex items-center justify-center gap-2 bg-[#e24c30] text-white font-bold text-[11px] px-5 py-2.5 rounded-lg hover:bg-[#c94028] transition shadow-lg shadow-[#e24c30]/20">
                <Search className="w-3.5 h-3.5" />
                Buscar Grupos
              </button>

              <div className="border border-dashed border-[#2c2c32] rounded-xl bg-[#222228]/60 p-6 sm:p-8 flex flex-col items-center justify-center gap-2 text-center">
                <MessageCircle className="w-8 h-8 text-[#2c2c32]" />
                <p className="text-[11px] font-semibold text-[#a0a0a0]">
                  Nenhum grupo encontrado
                </p>
                <p className="text-[9px] text-[#a0a0a0]/60 leading-relaxed">
                  Clique em &quot;Buscar Grupos&quot; para carregar os grupos desta instância.
                </p>
              </div>

              <div>
                <FieldLabel>Nome da Lista</FieldLabel>
                <input
                  type="text"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="Ex: Campanha Verão 2025"
                  className="w-full bg-[#222228] border border-[#3e3e3e] rounded-lg px-4 py-2.5 text-[11px] text-white placeholder:text-[#868686] focus:border-[#e24c30] outline-none transition"
                />
              </div>
            </div>

            <div className="px-4 sm:px-5 py-4 border-t border-[#2c2c32] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#222228] shrink-0 sm:rounded-b-2xl">
              <span className="text-[9px] text-[#a0a0a0]">0 grupos selecionados</span>

              <button
                disabled
                className="w-full sm:w-auto bg-[#e24c30]/10 text-[#e24c30] border border-[#e24c30]/20 font-bold text-[9px] px-5 py-2.5 rounded-lg uppercase tracking-widest opacity-40 cursor-not-allowed"
              >
                Criar Lista de Grupo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}