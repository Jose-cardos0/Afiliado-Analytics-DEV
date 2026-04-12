"use client";

import { CalendarDays } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  from: string;
  to: string;
  onChangeFrom: (v: string) => void;
  onChangeTo: (v: string) => void;
  minDate: string; // limite mínimo do relatório
  maxDate: string; // limite máximo do relatório
  disabled?: boolean;
  actions?: ReactNode;
};

export default function DateRangeControls({
  from,
  to,
  onChangeFrom,
  onChangeTo,
  minDate,
  maxDate,
  disabled = false,
  actions,
}: Props) {
  // Comparação segura para formato YYYY-MM-DD
  const isAfter = (a: string, b: string) => !!a && !!b && a > b; // a > b => a é depois
  const isBefore = (a: string, b: string) => !!a && !!b && a < b; // a < b => a é antes

  function handleChangeFrom(nextFrom: string) {
    onChangeFrom(nextFrom);

    if (to && nextFrom && isAfter(nextFrom, to)) {
      onChangeTo(nextFrom);
    }
  }

  function handleChangeTo(nextTo: string) {
    onChangeTo(nextTo);

    if (from && nextTo && isBefore(nextTo, from)) {
      onChangeFrom(nextTo);
    }
  }

  const dateInputClass =
    "relative z-0 min-w-[10.75rem] rounded-md border border-dark-border bg-dark-bg py-2 pl-3 pr-9 text-text-primary text-sm focus:border-shopee-orange focus:outline-none focus:ring-1 focus:ring-shopee-orange disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <div className="flex items-center gap-2 text-text-secondary">
        <CalendarDays className="h-5 w-5" />
        <span>Período:</span>
      </div>

      {/* Campo inicial — ícone branco (Lucide); WebKit: indicador nativo invisível por cima para abrir o picker */}
      <div className="commissions-date-picker-wrap relative inline-flex shrink-0 items-center">
        <input
          type="date"
          value={from}
          min={minDate}
          max={maxDate}
          onChange={(e) => handleChangeFrom(e.target.value)}
          disabled={disabled}
          className={dateInputClass}
        />
        <CalendarDays
          className="pointer-events-none absolute right-2.5 top-1/2 z-0 h-4 w-4 -translate-y-1/2 text-white"
          aria-hidden
        />
      </div>

      <span className="text-text-secondary">até</span>

      <div className="commissions-date-picker-wrap relative inline-flex shrink-0 items-center">
        <input
          type="date"
          value={to}
          min={minDate}
          max={maxDate}
          onChange={(e) => handleChangeTo(e.target.value)}
          disabled={disabled}
          className={dateInputClass}
        />
        <CalendarDays
          className="pointer-events-none absolute right-2.5 top-1/2 z-0 h-4 w-4 -translate-y-1/2 text-white"
          aria-hidden
        />
      </div>

      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
