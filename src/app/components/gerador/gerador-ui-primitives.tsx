"use client";

import { useState, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

export function cn(...c: (string | false | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

export function GeradorShellScrollbarStyle() {
  return (
    <style jsx global>{`
      .gerador-scrollbar-thin::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }
      .gerador-scrollbar-thin::-webkit-scrollbar-track {
        background: transparent;
      }
      .gerador-scrollbar-thin::-webkit-scrollbar-thumb {
        background: #3e3e3e;
        border-radius: 999px;
      }
      .gerador-scrollbar-thin::-webkit-scrollbar-thumb:hover {
        background: #e24c30;
      }
      .gerador-scrollbar-ref::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .gerador-scrollbar-ref::-webkit-scrollbar-track {
        background: #222228;
        border-radius: 999px;
      }
      .gerador-scrollbar-ref::-webkit-scrollbar-thumb {
        background: #9a9aa3;
        border-radius: 999px;
      }
      .gerador-scrollbar-ref::-webkit-scrollbar-thumb:hover {
        background: #b8b8c0;
      }
      .gerador-scrollbar-ref {
        scrollbar-width: thin;
        scrollbar-color: #9a9aa3 #222228;
      }
      .gerador-dash {
        background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='14' ry='14' stroke='%232c2c32' stroke-width='2' stroke-dasharray='7%2c 7' stroke-linecap='square'/%3e%3c/svg%3e");
      }
    `}</style>
  );
}

export function InfoTooltip({ text }: { text: string }) {
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
      {visible &&
        createPortal(
          <span
            style={{
              position: "fixed",
              top: pos.top - 8,
              left: pos.left,
              transform: "translate(-50%, -100%)",
              zIndex: 99999,
            }}
            className="pointer-events-none w-max max-w-[220px] bg-[#232328] border border-[#3e3e3e] text-[11px] text-[#d8d8d8] font-normal normal-case tracking-normal px-3 py-2 rounded-xl shadow-2xl whitespace-normal leading-relaxed text-center"
          >
            {text}
          </span>,
          document.body,
        )}
    </>
  );
}

export function StepBadge({ n, active }: { n: number; active?: boolean }) {
  return (
    <span
      className={cn(
        "w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 transition",
        active
          ? "bg-[#e24c30] text-white shadow-md shadow-[#e24c30]/30"
          : "bg-[#323232] text-[#a0a0a0]",
      )}
    >
      {n}
    </span>
  );
}

export function ColHeader({
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
    <div className="h-11 flex items-center justify-between gap-2 px-4 border-b border-[#2c2c32] bg-[#27272a] min-w-0">
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

export function FieldGroup({
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

export function IconBtn({
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
        "w-6 h-6 rounded-md bg-[#222228] border flex items-center justify-center transition shrink-0",
        active
          ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-400/40"
          : danger
            ? "text-[#a0a0a0] border-[#2c2c32] hover:text-red-400 hover:border-red-400/25"
            : "text-[#a0a0a0] border-[#2c2c32] hover:text-[#f0f0f2] hover:border-[#4c4c52]",
      )}
    >
      {children}
    </button>
  );
}
