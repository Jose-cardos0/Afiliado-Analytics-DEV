"use client";

import type { Dispatch, SetStateAction } from "react";
import { Loader2, ListPlus, Plus, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/app/components/gerador/gerador-ui-primitives";

type Lista = { id: string; nome: string; totalItens: number };

export function GeradorAddToListModal({
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
  loading,
}: {
  open: boolean;
  onClose: () => void;
  lists: Lista[];
  newListName: string;
  setNewListName: Dispatch<SetStateAction<string>>;
  activeListId: string | null;
  setActiveListId: Dispatch<SetStateAction<string | null>>;
  onCreate: () => void;
  onConfirm: () => void;
  canConfirm: boolean;
  pendingCount: number;
  loading?: boolean;
}) {
  if (!open) return null;
  const hasTypedName = newListName.trim().length > 0;
  const selectedList = lists.find((l) => l.id === activeListId);
  return (
    <div
      className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-[2px] p-3 sm:p-4 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] max-h-[calc(100vh-24px)] sm:max-h-none rounded-[22px] border border-[#2c2c32] bg-[#1b1b1f] shadow-[0_20px_60px_rgba(0,0,0,0.45)] overflow-hidden flex flex-col"
      >
        <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-[#2c2c32] bg-[#18181b]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#e24c30]/12 border border-[#e24c30]/20 flex items-center justify-center shrink-0">
                <ListPlus className="w-4 h-4 text-[#e24c30]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] sm:text-[16px] font-bold text-[#f0f0f2] truncate">Adicionar à lista</h3>
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
        <div className="px-4 sm:px-5 py-4 flex flex-col gap-4 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-[#d8d8d8] uppercase tracking-widest">Criar nova lista</label>
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && hasTypedName) onCreate();
                }}
                placeholder="Ex: achados do dia"
                className="flex-1 bg-[#222228] border border-[#2c2c32] rounded-xl px-3.5 py-2.5 text-[12px] text-[#f0f0f2] placeholder:text-[#7d7d86] focus:border-[#e24c30]/60 outline-none transition"
              />
              <button
                onClick={onCreate}
                disabled={!hasTypedName}
                className={cn(
                  "h-[42px] w-full sm:w-auto px-4 rounded-xl text-[12px] font-semibold transition flex items-center justify-center gap-2 shrink-0",
                  hasTypedName
                    ? "bg-[#232328] border border-[#3a3a42] text-[#f0f0f2] hover:border-[#e24c30]/45 hover:text-white"
                    : "bg-[#202025] border border-[#2a2a30] text-[#6f6f78] cursor-not-allowed",
                )}
              >
                <Plus className="w-4 h-4" /> Criar
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[10px] font-bold text-[#d8d8d8] uppercase tracking-widest">Escolher lista</label>
              <span className="text-[10px] text-[#8e8e96]">
                {lists.length} {lists.length === 1 ? "lista" : "listas"}
              </span>
            </div>
            {lists.length > 0 ? (
              <div
                className="rounded-2xl border border-[#2c2c32] bg-[#222228] p-2 max-h-[220px] overflow-y-auto"
                style={{ scrollbarWidth: "thin" }}
              >
                {lists.map((list) => {
                  const sel = activeListId === list.id;
                  return (
                    <button
                      key={list.id}
                      onClick={() => setActiveListId(list.id)}
                      className={cn(
                        "w-full rounded-xl px-3.5 py-3 flex items-start sm:items-center justify-between gap-3 text-left transition mb-2 last:mb-0 border flex-wrap sm:flex-nowrap",
                        sel
                          ? "bg-[#2a1d1a] border-[#e24c30]/35"
                          : "bg-[#202025] border-[#2c2c32] hover:bg-[#25252b] hover:border-[#3a3a42]",
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition",
                            sel ? "border-[#e24c30] bg-[#e24c30]" : "border-[#5a5a63]",
                          )}
                        >
                          {sel && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "text-[13px] font-semibold truncate",
                              sel ? "text-[#ff7a5b]" : "text-[#f0f0f2]",
                            )}
                          >
                            {list.nome}
                          </p>
                          <p className="text-[10px] text-[#9d9da5] mt-0.5">
                            {list.totalItens} {list.totalItens === 1 ? "item" : "itens"}
                          </p>
                        </div>
                      </div>
                      {sel && (
                        <span className="text-[10px] font-semibold text-[#ffd2c8] bg-[#e24c30]/10 border border-[#e24c30]/15 px-2 py-1 rounded-full shrink-0">
                          Ativa
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#2c2c32] bg-[#222228] px-4 py-8 text-center">
                <p className="text-[13px] font-medium text-[#e1e1e5]">Nenhuma lista criada</p>
                <p className="text-[11px] text-[#96969f] mt-1">Crie uma lista acima para continuar.</p>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] text-[#9a9aa2] truncate">
                {selectedList ? `Destino: ${selectedList.nome}` : "Selecione uma lista"}
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
                disabled={!canConfirm || loading}
                className={cn(
                  "h-[40px] px-4 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 transition",
                  canConfirm && !loading
                    ? "bg-[#e24c30] text-white hover:bg-[#c94028] shadow-md shadow-[#e24c30]/20"
                    : "bg-[#8f442f] text-white/70 cursor-not-allowed",
                )}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListPlus className="w-4 h-4" />}
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
