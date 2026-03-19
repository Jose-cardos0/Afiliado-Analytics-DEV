import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

/** "FRETE GRÁTIS" badge — top-left */
export const FreeShippingBadge: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, frame - delay);
  const scale = spring({ fps, frame: local, config: { damping: 10, stiffness: 160 } });
  const pulse = 1 + Math.sin(local * 0.15) * 0.05;
  if (local <= 0) return null;
  return (
    <div style={{
      position: "absolute", top: 40, left: 28, zIndex: 20, pointerEvents: "none",
      transform: `scale(${scale * pulse})`,
    }}>
      <div style={{
        background: "linear-gradient(135deg, #22c55e, #16a34a)", borderRadius: 16,
        padding: "14px 30px", boxShadow: "0 6px 28px rgba(34,197,94,0.5)",
      }}>
        <span style={{ color: "#FFF", fontSize: 40, fontWeight: 900, fontFamily: "Impact, sans-serif", letterSpacing: 2 }}>
          FRETE GRÁTIS
        </span>
      </div>
    </div>
  );
};

/** Discount badge — top-right */
export const DiscountBadge: React.FC<{ percent?: string; delay?: number }> = ({ percent = "50% OFF", delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, frame - delay);
  const scale = spring({ fps, frame: local, config: { damping: 8, stiffness: 200 } });
  const wobble = Math.sin(local * 0.2) * 4;
  if (local <= 0) return null;
  return (
    <div style={{
      position: "absolute", top: 40, right: 28, zIndex: 20, pointerEvents: "none",
      transform: `scale(${scale}) rotate(${wobble}deg)`,
    }}>
      <div style={{
        background: "linear-gradient(135deg, #dc2626, #b91c1c)", borderRadius: 18,
        padding: "14px 30px", boxShadow: "0 6px 28px rgba(220,38,38,0.6)",
      }}>
        <span style={{ color: "#FFF", fontSize: 40, fontWeight: 900, fontFamily: "Impact, sans-serif", letterSpacing: 2 }}>
          {percent}
        </span>
      </div>
    </div>
  );
};

/** "MAIS VENDIDO" strip — left side, middle-high */
export const BestSellerStrip: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, frame - delay);
  const slideX = interpolate(local, [0, 14], [-500, 0], { extrapolateRight: "clamp" });
  const opacity = interpolate(local, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  if (local <= 0) return null;
  return (
    <div style={{
      position: "absolute", top: "35%", left: 0, zIndex: 20, pointerEvents: "none",
      transform: `translateX(${slideX}px)`, opacity,
    }}>
      <div style={{
        background: "#EE4D2D", padding: "16px 48px 16px 28px",
        borderTopRightRadius: 18, borderBottomRightRadius: 18,
        boxShadow: "0 6px 28px rgba(238,77,45,0.5)",
      }}>
        <span style={{ color: "#FFF", fontSize: 40, fontWeight: 900, fontFamily: "Impact, sans-serif", letterSpacing: 3 }}>
          MAIS VENDIDO
        </span>
      </div>
    </div>
  );
};

/** Star rating — top-center */
export const StarRatingOverlay: React.FC<{ rating?: number; delay?: number }> = ({ rating = 5, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, frame - delay);
  return (
    <div style={{
      position: "absolute", top: 40, left: 0, right: 0,
      display: "flex", justifyContent: "center", gap: 10, zIndex: 20, pointerEvents: "none",
    }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const starDelay = star * 3;
        const pop = spring({ fps, frame: Math.max(0, local - starDelay), config: { damping: 8, stiffness: 200 } });
        return (
          <div key={star} style={{
            width: 48, height: 48, transform: `scale(${pop})`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill={star <= rating ? "#facc15" : "none"}
              stroke={star <= rating ? "#eab308" : "#666"} strokeWidth="1.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        );
      })}
    </div>
  );
};

/** "COMPRA SEGURA" — right side, middle */
export const SecurePurchaseBadge: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, frame - delay);
  const slideX = interpolate(local, [0, 14], [400, 0], { extrapolateRight: "clamp" });
  const opacity = interpolate(local, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  if (local <= 0) return null;
  return (
    <div style={{
      position: "absolute", top: "30%", right: 0, zIndex: 20, pointerEvents: "none",
      transform: `translateX(${slideX}px)`, opacity,
    }}>
      <div style={{
        background: "rgba(0,0,0,0.8)", border: "3px solid rgba(34,197,94,0.6)",
        borderTopLeftRadius: 18, borderBottomLeftRadius: 18,
        padding: "14px 28px 14px 24px", display: "flex", alignItems: "center", gap: 10,
        boxShadow: "0 6px 28px rgba(0,0,0,0.5)",
      }}>
        <span style={{ color: "#22c55e", fontSize: 40, fontWeight: 900, fontFamily: "Impact, sans-serif", letterSpacing: 2 }}>
          COMPRA SEGURA
        </span>
      </div>
    </div>
  );
};

/** Countdown timer — top-right */
export const CountdownOverlay: React.FC<{ totalSec: number }> = ({ totalSec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsed = frame / fps;
  const remaining = Math.max(0, totalSec - elapsed);
  const m = Math.floor(remaining / 60);
  const s = Math.floor(remaining % 60);
  const pulse = 1 + Math.sin(frame * 0.4) * 0.05;
  return (
    <div style={{
      position: "absolute", top: 40, right: 28, zIndex: 20, pointerEvents: "none",
      transform: `scale(${pulse})`,
    }}>
      <div style={{
        background: "#dc2626", borderRadius: 18, padding: "12px 28px",
        display: "flex", alignItems: "center", gap: 10,
        boxShadow: "0 6px 28px rgba(220,38,38,0.6)",
      }}>
        <span style={{ fontSize: 44, fontWeight: 900, color: "#FFF", fontFamily: "monospace", letterSpacing: 3 }}>
          {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
};

/** "APROVADO" badge — right side upper */
export const ApprovedBadge: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, frame - delay);
  const scale = spring({ fps, frame: local, config: { damping: 10, stiffness: 150 } });
  if (local <= 0) return null;
  return (
    <div style={{
      position: "absolute", top: 130, right: 28, zIndex: 20, pointerEvents: "none",
      transform: `scale(${scale})`,
    }}>
      <div style={{
        background: "linear-gradient(135deg, #22c55e, #15803d)", borderRadius: 18,
        padding: "14px 30px", boxShadow: "0 6px 28px rgba(34,197,94,0.5)",
      }}>
        <span style={{ color: "#FFF", fontSize: 40, fontWeight: 900, fontFamily: "Impact, sans-serif", letterSpacing: 2 }}>
          APROVADO
        </span>
      </div>
    </div>
  );
};

/** "OFERTA LIMITADA" banner — top-center */
export const LimitedOfferBanner: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, frame - delay);
  const scale = spring({ fps, frame: local, config: { damping: 8, stiffness: 180 } });
  const glow = Math.sin(local * 0.3) * 0.3 + 0.7;
  if (local <= 0) return null;
  return (
    <div style={{
      position: "absolute", top: 40, left: 0, right: 0,
      display: "flex", justifyContent: "center", zIndex: 20, pointerEvents: "none",
    }}>
      <div style={{
        background: "#EE4D2D", borderRadius: 18, padding: "14px 40px",
        transform: `scale(${scale})`,
        boxShadow: `0 6px 32px rgba(238,77,45,${glow})`,
      }}>
        <span style={{ color: "#FFF", fontSize: 40, fontWeight: 900, fontFamily: "Impact, sans-serif", letterSpacing: 3 }}>
          OFERTA LIMITADA
        </span>
      </div>
    </div>
  );
};

/** Swipe indicator — top area right */
export const SwipeUpIndicator: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - delay);
  const bounce = Math.sin(local * 0.25) * 10;
  const opacity = interpolate(local, [0, 10], [0, 0.9], { extrapolateRight: "clamp" });
  return (
    <div style={{
      position: "absolute", top: "20%", right: 28,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      zIndex: 20, pointerEvents: "none", opacity,
      transform: `translateY(${bounce}px)`,
    }}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <path d="M24 6L24 34M10 24L24 38L38 24" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 20, fontWeight: 900, fontFamily: "Impact, sans-serif", letterSpacing: 2 }}>
        VER MAIS
      </span>
    </div>
  );
};

/** "GARANTIA 30 DIAS" — bottom-left (above caption zone) */
export const WarrantyBadge: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, frame - delay);
  const scale = spring({ fps, frame: local, config: { damping: 10, stiffness: 150 } });
  const rotate = Math.sin(local * 0.12) * 3;
  if (local <= 0) return null;
  return (
    <div style={{
      position: "absolute", top: "35%", left: 28, zIndex: 20, pointerEvents: "none",
      transform: `scale(${scale}) rotate(${rotate}deg)`,
    }}>
      <div style={{
        background: "linear-gradient(135deg, #f59e0b, #d97706)", borderRadius: 18,
        padding: "14px 28px",
        boxShadow: "0 6px 28px rgba(245,158,11,0.5)",
      }}>
        <span style={{ color: "#FFF", fontSize: 40, fontWeight: 900, fontFamily: "Impact, sans-serif", letterSpacing: 2 }}>
          GARANTIA 30 DIAS
        </span>
      </div>
    </div>
  );
};

/** "ÚLTIMAS UNIDADES" — left side upper-mid */
export const LastUnitsAlert: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, frame - delay);
  const scale = spring({ fps, frame: local, config: { damping: 8, stiffness: 180 } });
  const pulse = 1 + Math.sin(local * 0.35) * 0.06;
  if (local <= 0) return null;
  return (
    <div style={{
      position: "absolute", top: "25%", left: 0, right: 0,
      display: "flex", justifyContent: "center", zIndex: 20, pointerEvents: "none",
    }}>
      <div style={{
        background: "rgba(220,38,38,0.95)", borderRadius: 18, padding: "14px 36px",
        transform: `scale(${scale * pulse})`,
        boxShadow: "0 6px 32px rgba(220,38,38,0.6)",
      }}>
        <span style={{ color: "#FFF", fontSize: 40, fontWeight: 900, fontFamily: "Impact, sans-serif", letterSpacing: 3 }}>
          ÚLTIMAS UNIDADES
        </span>
      </div>
    </div>
  );
};

/** "100% SATISFAÇÃO" — top-left */
export const SatisfactionBadge: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, frame - delay);
  const scale = spring({ fps, frame: local, config: { damping: 10, stiffness: 160 } });
  if (local <= 0) return null;
  return (
    <div style={{
      position: "absolute", top: 40, left: 28, zIndex: 20, pointerEvents: "none",
      transform: `scale(${scale})`,
    }}>
      <div style={{
        background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", borderRadius: 18,
        padding: "14px 28px",
        boxShadow: "0 6px 28px rgba(139,92,246,0.5)",
      }}>
        <span style={{ color: "#FFF", fontSize: 40, fontWeight: 900, fontFamily: "Impact, sans-serif", letterSpacing: 2 }}>
          100% SATISFAÇÃO
        </span>
      </div>
    </div>
  );
};

/** "COMPRA VERIFICADA" — right side slide in */
export const VerifiedPurchaseBadge: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, frame - delay);
  const slideX = interpolate(local, [0, 14], [400, 0], { extrapolateRight: "clamp" });
  const opacity = interpolate(local, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  if (local <= 0) return null;
  return (
    <div style={{
      position: "absolute", top: "45%", right: 0, zIndex: 20, pointerEvents: "none",
      transform: `translateX(${slideX}px)`, opacity,
    }}>
      <div style={{
        background: "#0ea5e9", padding: "14px 36px 14px 28px",
        borderTopLeftRadius: 18, borderBottomLeftRadius: 18,
        boxShadow: "0 6px 28px rgba(14,165,233,0.5)",
      }}>
        <span style={{ color: "#FFF", fontSize: 40, fontWeight: 900, fontFamily: "Impact, sans-serif", letterSpacing: 2 }}>
          COMPRA VERIFICADA
        </span>
      </div>
    </div>
  );
};

/** "BOMBANDO" — top-right */
export const HotProductBadge: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, frame - delay);
  const scale = spring({ fps, frame: local, config: { damping: 8, stiffness: 200 } });
  const flicker = 1 + Math.sin(local * 0.5) * 0.05;
  if (local <= 0) return null;
  return (
    <div style={{
      position: "absolute", top: 40, right: 28, zIndex: 20, pointerEvents: "none",
      transform: `scale(${scale * flicker})`,
    }}>
      <div style={{
        background: "linear-gradient(135deg, #f97316, #ea580c)", borderRadius: 18,
        padding: "14px 30px", boxShadow: "0 6px 28px rgba(249,115,22,0.6)",
      }}>
        <span style={{ color: "#FFF", fontSize: 40, fontWeight: 900, fontFamily: "Impact, sans-serif", letterSpacing: 2 }}>
          BOMBANDO
        </span>
      </div>
    </div>
  );
};

/** "ENTREGA RÁPIDA" — right side slide in */
export const ExpressShippingStrip: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, frame - delay);
  const slideX = interpolate(local, [0, 14], [500, 0], { extrapolateRight: "clamp" });
  const opacity = interpolate(local, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  if (local <= 0) return null;
  return (
    <div style={{
      position: "absolute", top: "20%", right: 0, zIndex: 20, pointerEvents: "none",
      transform: `translateX(${slideX}px)`, opacity,
    }}>
      <div style={{
        background: "#0284c7", padding: "14px 32px 14px 28px",
        borderTopLeftRadius: 18, borderBottomLeftRadius: 18,
        boxShadow: "0 6px 28px rgba(2,132,199,0.5)",
      }}>
        <span style={{ color: "#FFF", fontSize: 40, fontWeight: 900, fontFamily: "Impact, sans-serif", letterSpacing: 2 }}>
          ENTREGA RÁPIDA
        </span>
      </div>
    </div>
  );
};

/** "N°1 EM VENDAS" — left side */
export const TopSellerBadge: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, frame - delay);
  const slideX = interpolate(local, [0, 14], [-500, 0], { extrapolateRight: "clamp" });
  const opacity = interpolate(local, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const glow = 0.5 + Math.sin(local * 0.2) * 0.3;
  if (local <= 0) return null;
  return (
    <div style={{
      position: "absolute", top: "20%", left: 0, zIndex: 20, pointerEvents: "none",
      transform: `translateX(${slideX}px)`, opacity,
    }}>
      <div style={{
        background: "linear-gradient(135deg, #eab308, #ca8a04)", borderRadius: 0,
        borderTopRightRadius: 18, borderBottomRightRadius: 18,
        padding: "14px 40px 14px 28px",
        boxShadow: `0 6px 28px rgba(234,179,8,${glow})`,
      }}>
        <span style={{ color: "#FFF", fontSize: 40, fontWeight: 900, fontFamily: "Impact, sans-serif", letterSpacing: 2 }}>
          N°1 EM VENDAS
        </span>
      </div>
    </div>
  );
};
