"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Clock, Shield, Star } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import type { CaptureVipLandingProps } from "./capture-vip-types";
import { isWhatsAppUrl, useCaptureVipFonts } from "./capture-vip-shared";
import CaptureVipEntradaToasts from "./CaptureVipEntradaToasts";
import CaptureYoutubeEmbed from "./CaptureYoutubeEmbed";

const TERROSO_BENEFITS: { emoji: string; title: string; body: string }[] = [
  {
    emoji: "📦",
    title: "Links de produtos todo dia",
    body: "Acesso aos links das melhores ofertas dos marketplaces",
  },
  {
    emoji: "💸",
    title: "Descontos de até 70%",
    body: "Economia real em produtos selecionados a dedo para você",
  },
  {
    emoji: "🎟️",
    title: "Cupons Secretos",
    body: "Acesso a cupons exclusivos que só a nossa comunidade tem",
  },
  {
    emoji: "🔥",
    title: "Os melhores produtos com os melhores preços",
    body: "Casa, beleza, eletrônicos e muito mais",
  },
];

const TERROSO = {
  accent: "rgb(160, 117, 90)",
  accentRgb: "160, 117, 90",
  ctaFrom: "rgb(184, 134, 92)",
  ctaTo: "rgba(184, 134, 92, 0.867)",
  ringPurple: "rgb(155, 93, 229)",
  bg: "rgb(245, 237, 228)",
  text: "rgb(26, 26, 46)",
  textMuted: "rgba(26, 26, 46, 0.7)",
  textFooter: "rgba(26, 26, 46, 0.6)",
  textFooterFaint: "rgba(26, 26, 46, 0.35)",
  textLink: "rgba(26, 26, 46, 0.45)",
  cardBorder: "rgba(160, 117, 90, 0.19)",
  scarcityBorder: "rgba(160, 117, 90, 0.25)",
  cardShadow: "rgba(0, 0, 0, 0.06) 0px 2px 8px",
  ctaShadow: "rgba(184, 134, 92, 0) 0px 0px 0px 0px, rgba(184, 134, 92, 0.267) 0px 0px 10px",
} as const;

const MIN_SPOTS = 12;

export default function CaptureVipTerroso(props: CaptureVipLandingProps) {
  const {
    title,
    description,
    buttonText,
    ctaHref,
    logoUrl,
    youtubeUrl,
    previewMode = false,
  } = props;

  const safeTitle = title.trim() || "Grupo VIP";
  const safeDesc =
    description.trim() ||
    "Entre no grupo e receba promoções, ofertas e descontos reais — antes de acabar.";
  const safeBtn = buttonText.trim() || "Quero entrar agora";
  const showWa =
    previewMode || isWhatsAppUrl(ctaHref) || /\/go\/?(\?.*)?$/i.test(ctaHref.trim());

  const yt = (youtubeUrl ?? "").trim();

  const [spotsLeft, setSpotsLeft] = useState(42);

  useCaptureVipFonts();

  useEffect(() => {
    if (previewMode) return;
    const t = setInterval(() => {
      setSpotsLeft((s) => (s > MIN_SPOTS ? s - 1 : 42));
    }, 3000);
    return () => clearInterval(t);
  }, [previewMode]);

  const displaySpots = previewMode ? 18 : spotsLeft;

  return (
    <>
      <CaptureVipEntradaToasts />
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes capture-vip-terroso-cta-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.06); }
          }
          .capture-vip-terroso-cta-pulse {
            transform-origin: center;
            animation: capture-vip-terroso-cta-pulse 1.6s ease-in-out infinite;
            will-change: transform;
          }
          @media (prefers-reduced-motion: reduce) {
            .capture-vip-terroso-cta-pulse { animation: none !important; }
          }
        `,
        }}
      />
      <div
        className="relative isolate flex min-h-screen flex-col items-center"
        style={{
          fontFamily: "'Lato', sans-serif",
          colorScheme: "light",
          color: TERROSO.text,
          backgroundColor: TERROSO.bg,
          backgroundImage: `linear-gradient(135deg, rgba(${TERROSO.accentRgb}, 0.094) 0%, ${TERROSO.bg} 50%, ${TERROSO.bg} 100%)`,
          backgroundRepeat: "no-repeat",
          paddingTop: "42px",
          paddingBottom: "48px",
        }}
      >
        <div
          className="fixed top-0 left-0 z-[1001] w-full py-2.5 text-center text-sm font-bold tracking-wide text-white"
          style={{ background: TERROSO.accent }}
        >
          <span className="animate-pulse">🔥 Grupo quase lotado!</span>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-5 py-8">
          <div
            className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full p-[3px]"
            style={{
              background: `linear-gradient(135deg, ${TERROSO.accent}, ${TERROSO.ringPurple})`,
            }}
          >
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Perfil"
                  width={112}
                  height={112}
                  className="h-full w-full object-cover"
                  unoptimized={logoUrl.startsWith("blob:")}
                />
              ) : (
                <span className="text-xs font-semibold text-neutral-400">Logo</span>
              )}
            </div>
          </div>

          <h1 className="text-center text-xl font-bold leading-tight" style={{ color: TERROSO.text }}>
            {safeTitle}
          </h1>

          <p className="text-center text-sm font-medium" style={{ color: TERROSO.textMuted }}>
            {safeDesc}
          </p>

          {yt ? (
            <div className="w-full">
              <CaptureYoutubeEmbed url={yt} />
            </div>
          ) : null}

          <div className="w-full">
            <a
              href={ctaHref}
              className="capture-vip-terroso-cta-pulse flex w-full items-center justify-center rounded-2xl py-4 text-lg font-extrabold tracking-wide text-white no-underline transition-opacity hover:opacity-95 active:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${TERROSO.ctaFrom} 0%, ${TERROSO.ctaTo} 100%)`,
                boxShadow: TERROSO.ctaShadow,
              }}
            >
              {showWa ? <FaWhatsapp className="mr-2.5 text-xl" aria-hidden /> : null}
              {safeBtn.toUpperCase()}
            </a>
          </div>

          <div
            className="flex items-center gap-2 rounded-xl border px-5 py-3 text-base font-semibold"
            style={{
              background: "rgb(255, 255, 255)",
              borderColor: TERROSO.scarcityBorder,
              color: TERROSO.text,
            }}
          >
            <Clock className="h-5 w-5 shrink-0" style={{ color: TERROSO.accent }} aria-hidden />
            <span>
              ⏳ Vagas restantes:{" "}
              <span className="text-2xl font-extrabold" style={{ color: TERROSO.accent }}>
                {displaySpots}
              </span>
            </span>
          </div>

          <div className="mt-2 w-full space-y-3">
            <h2
              className="text-center text-sm font-bold uppercase tracking-widest"
              style={{ color: TERROSO.accent }}
            >
              No grupo você vai encontrar:
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {TERROSO_BENEFITS.map((row) => (
                <div
                  key={row.title}
                  className="flex flex-col items-center gap-1 rounded-xl px-4 py-4 text-center"
                  style={{
                    background: "rgb(255, 255, 255)",
                    border: `1px solid ${TERROSO.cardBorder}`,
                    boxShadow: TERROSO.cardShadow,
                  }}
                >
                  <span className="text-3xl" aria-hidden>
                    {row.emoji}
                  </span>
                  <p className="text-sm font-bold" style={{ color: TERROSO.text }}>
                    {row.title}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(26, 26, 46, 0.6)" }}>
                    {row.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: TERROSO.textFooter }}>
            <Shield className="h-4 w-4 shrink-0" aria-hidden />
            <span>Grupo seguro e verificado</span>
          </div>

          <p
            className="mt-4 max-w-md px-4 text-center text-xs leading-relaxed"
            style={{ color: TERROSO.textFooter }}
          >
            ⚠️ Vagas limitadas | Oferta válida apenas enquanto houver vagas.
          </p>

          <div className="flex items-center gap-1 pb-4 text-xs" style={{ color: TERROSO.textFooter }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="h-3.5 w-3.5 fill-current"
                style={{ color: TERROSO.accent }}
                aria-hidden
              />
            ))}
            <span className="ml-1">+2.400 membros satisfeitos</span>
          </div>

          <div className="pb-2 text-center text-xs" style={{ color: TERROSO.textFooterFaint }}>
            Feito com{" "}
            <span style={{ color: "rgb(233, 30, 140)" }} aria-hidden>
              ❤️
            </span>{" "}
            no{" "}
            <a
              href="https://afiliadoanalytics.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition-opacity hover:opacity-80"
              style={{ color: TERROSO.textLink }}
            >
              Afiliado Analytics
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
