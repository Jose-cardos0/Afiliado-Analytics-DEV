import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

const BouncingArrow: React.FC<{ fps: number; frame: number }> = ({ fps, frame }) => {
  const cycleLength = Math.round(fps * 0.6);
  const loopFrame = frame % cycleLength;
  const bounce = spring({
    fps,
    frame: loopFrame,
    config: { damping: 4, stiffness: 160, mass: 0.35 },
    durationInFrames: cycleLength,
  });
  const y = interpolate(bounce, [0, 1], [-16, 24]);

  return (
    <div style={{ transform: `translateY(${y}px)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="260" height="260" viewBox="0 0 260 260">
        <rect x="90" y="0" width="80" height="140" rx="6" fill="#FFFFFF" />
        <polygon points="130,260 0,130 60,130 200,130 260,130" fill="#FFFFFF" />
      </svg>
    </div>
  );
};

export const CTASlide: React.FC<{
  text: string;
  productName?: string;
}> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgScale = spring({ fps, frame, config: { damping: 20, stiffness: 100 } });
  const textScale = spring({ fps, frame: Math.max(0, frame - 3), config: { damping: 10, stiffness: 160 } });
  const arrowDelay = 10;
  const arrowOpacity = interpolate(frame, [arrowDelay, arrowDelay + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const arrowScale = spring({ fps, frame: Math.max(0, frame - arrowDelay), config: { damping: 8, stiffness: 120 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        transform: `scale(${bgScale})`,
      }}
    >
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
      }}>
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: "#FFFFFF",
            fontFamily: "Impact, 'Arial Black', sans-serif",
            textShadow: "0 4px 40px rgba(255,255,255,0.2)",
            lineHeight: 1.05,
            textTransform: "uppercase",
            letterSpacing: 6,
            textAlign: "center",
            padding: "0 40px",
            transform: `scale(${textScale})`,
          }}
        >
          {text}
        </div>

        <div style={{ opacity: arrowOpacity, transform: `scale(${arrowScale})` }}>
          <BouncingArrow fps={fps} frame={Math.max(0, frame - arrowDelay)} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
