"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

function cn(...c: (string | false | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

/** Paginação no estilo do Gerador de Links Shopee: centralizada + pill de página. */
export function GeradorPaginationBar({
  page,
  totalPages,
  loading = false,
  onPrev,
  onNext,
  summary,
  className,
}: {
  page: number;
  totalPages: number;
  loading?: boolean;
  onPrev: () => void;
  onNext: () => void;
  summary?: string | null;
  className?: string;
}) {
  const safeTotal = Math.max(1, totalPages);
  const atStart = page <= 1 || loading;
  const atEnd = page >= safeTotal || loading;
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      {summary ? (
        <p className="text-[8px] sm:text-[8.8px] text-[#6b6b73] text-center w-full">{summary}</p>
      ) : null}
      <div className="flex items-center justify-center gap-5 sm:gap-8 w-full max-w-sm mx-auto">
        <button
          type="button"
          onClick={onPrev}
          disabled={atStart}
          className={cn(
            "flex items-center gap-0.5 text-[9.6px] sm:text-[10.4px] font-medium transition shrink-0",
            atStart ? "text-[#4a4a52] cursor-not-allowed" : "text-[#8b8b96] hover:text-[#d4d4d8]",
          )}
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0 -mr-0.5" />
          Anterior
        </button>
        <span
          className="tabular-nums text-[10.4px] sm:text-[11.2px] font-bold text-white bg-[#121214] border border-[#2a2a30] rounded-xl px-4 py-2 min-w-[4.75rem] text-center shadow-inner shadow-black/20"
          aria-live="polite"
        >
          {page} / {safeTotal}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={atEnd}
          className={cn(
            "flex items-center gap-0.5 text-[9.6px] sm:text-[10.4px] font-medium transition shrink-0",
            atEnd ? "text-[#4a4a52] cursor-not-allowed" : "text-[#e8e8ec] hover:text-white",
          )}
          aria-label="Próxima página"
        >
          Próxima
          <ChevronRight className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0 -ml-0.5" />
        </button>
      </div>
    </div>
  );
}
