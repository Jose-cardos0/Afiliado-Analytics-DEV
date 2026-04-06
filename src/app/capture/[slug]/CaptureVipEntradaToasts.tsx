"use client";

import { useEffect, useRef, useState } from "react";

const NOMES = [
  "Ana",
  "Carlos",
  "Juliana",
  "Pedro",
  "Mariana",
  "Lucas",
  "Fernanda",
  "Rafael",
  "Beatriz",
  "Bruno",
  "Camila",
  "Gabriel",
  "Larissa",
  "Diego",
  "Patrícia",
  "Rodrigo",
  "Amanda",
  "Felipe",
  "Letícia",
  "Gustavo",
  "Priscila",
  "Thiago",
  "Vanessa",
  "André",
  "Renata",
  "Paulo",
  "Tatiane",
  "Ricardo",
  "Daniela",
  "Marcelo",
  "Aline",
  "Vinícius",
  "Cristina",
  "Fábio",
  "Simone",
  "Eduardo",
  "Adriana",
  "Henrique",
  "Eliane",
  "Roberto",
  "Sandra",
  "Alexandre",
  "Cláudia",
] as const;

export type CaptureVipEntradaToastsProps = {
  /** Desliga no preview do dashboard */
  disabled?: boolean;
  /** Intervalo entre novas notificações (ms) */
  intervalMs?: number;
  /** Quanto tempo cada toast fica visível antes de sumir (ms) */
  visibleMs?: number;
  /** Máximo de toasts empilhados */
  maxVisible?: number;
};

type ToastItem = { id: number; name: string };

/**
 * Toasts no topo (abaixo da barra fixa VIP): “Fulana entrou no grupo”.
 */
export default function CaptureVipEntradaToasts({
  disabled = false,
  intervalMs = 2000,
  visibleMs = 4500,
  maxVisible = 3,
}: CaptureVipEntradaToastsProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (disabled) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const pickName = () => NOMES[Math.floor(Math.random() * NOMES.length)]!;

    const pushToast = () => {
      const id = ++idRef.current;
      const name = pickName();
      setToasts((prev) => [...prev, { id, name }].slice(-maxVisible));
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, visibleMs);
    };

    const t = window.setInterval(pushToast, intervalMs);
    const first = window.setTimeout(pushToast, 800);

    return () => {
      window.clearInterval(t);
      window.clearTimeout(first);
    };
  }, [disabled, intervalMs, visibleMs, maxVisible]);

  if (disabled) return null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes capture-vip-entrada-drop {
            from {
              opacity: 0;
              transform: translateY(-100%);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .capture-vip-entrada-toast {
            animation: capture-vip-entrada-drop 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }
          @media (prefers-reduced-motion: reduce) {
            .capture-vip-entrada-toast { animation: none !important; opacity: 1; transform: none; }
          }
        `,
        }}
      />
      <div
        className="pointer-events-none fixed left-0 right-0 z-[1002] flex flex-col items-center gap-2 px-3"
        style={{ top: "3.25rem" }}
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="capture-vip-entrada-toast max-w-[min(100%,20rem)] rounded-xl border border-black/10 bg-white/95 px-4 py-2.5 text-center text-sm font-semibold text-neutral-800 shadow-lg backdrop-blur-sm"
          >
            <span className="text-emerald-600" aria-hidden>
              ✓
            </span>{" "}
            <span className="font-bold text-neutral-900">{t.name}</span> entrou no grupo
          </div>
        ))}
      </div>
    </>
  );
}
