"use client";

import { X, Smartphone } from "lucide-react";

export type PwaInstallHint = "standalone" | "browser" | null;

type PwaInstallHintModalProps = {
  hint: PwaInstallHint;
  onClose: () => void;
};

export default function PwaInstallHintModal({ hint, onClose }: PwaInstallHintModalProps) {
  if (!hint) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-hint-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-[20px] border border-white/10 bg-[#23232A] p-6 shadow-[0_32px_64px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
        <Smartphone className="mx-auto h-12 w-12 text-[#fb923c]" aria-hidden />
        <h3
          id="install-hint-title"
          className="mt-4 text-center font-[var(--font-space-grotesk)] text-xl font-bold text-white"
        >
          {hint === "standalone" ? "App já em uso" : "Como instalar o app"}
        </h3>
        {hint === "standalone" ? (
          <p className="mt-3 text-center font-['Inter'] text-sm leading-relaxed text-white/70">
            Você já está abrindo o Afiliado Analytics pelo atalho instalado.
          </p>
        ) : (
          <div className="mt-4 space-y-3 font-['Inter'] text-sm leading-relaxed text-white/75">
            <p>O navegador ainda não ofereceu o instalador automático. Instale manualmente:</p>
            <ul className="list-disc space-y-2 pl-5 text-left">
              <li>
                <strong className="text-white/90">Chrome ou Edge (PC):</strong> ícone de instalar na barra de endereço
                ou menu ⋮ → &quot;Instalar Afiliado Analytics…&quot;
              </li>
              <li>
                <strong className="text-white/90">Android:</strong> menu ⋮ → &quot;Instalar app&quot; ou &quot;Adicionar
                à tela inicial&quot;
              </li>
              <li>
                <strong className="text-white/90">iPhone / iPad:</strong> botão Compartilhar → &quot;Adicionar à Tela de
                Início&quot;
              </li>
            </ul>
            <p className="text-white/50">
              Em ambiente local, use <code className="text-white/70">localhost</code> no Chrome e recarregue a página; o
              aviso de instalação pode demorar alguns segundos.
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-[12px] bg-gradient-to-br from-[#e24c30] to-[#ff7a54] py-3 font-['Inter'] text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(226,76,48,0.25)] transition-opacity hover:opacity-95"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
