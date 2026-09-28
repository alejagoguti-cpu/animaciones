import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors } from "../theme";

// Fondo negro con resplandores rojos que se mueven lento y una rejilla de
// puntos, como el hero de bitaxus.com.
export const Background: React.FC<{ intensity?: number }> = ({
  intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const t = frame / 30;

  const glowA = {
    x: 20 + Math.sin(t * 0.45) * 12,
    y: 12 + Math.cos(t * 0.35) * 8,
  };
  const glowB = {
    x: 85 + Math.cos(t * 0.3) * 10,
    y: 78 + Math.sin(t * 0.4) * 10,
  };
  const pulse = interpolate(Math.sin(t * 1.2), [-1, 1], [0.8, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: colors.black }}>
      <AbsoluteFill
        style={{
          opacity: intensity * pulse,
          background: [
            `radial-gradient(60% 40% at ${glowA.x}% ${glowA.y}%, ${colors.redGlow} 0%, rgba(110,10,16,0.25) 45%, transparent 75%)`,
            `radial-gradient(55% 35% at ${glowB.x}% ${glowB.y}%, rgba(193,18,31,0.45) 0%, rgba(110,10,16,0.2) 50%, transparent 80%)`,
          ].join(","),
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.14) 1.6px, transparent 1.6px)",
          backgroundSize: "36px 36px",
          backgroundPosition: `0 ${-(frame * 0.4) % 36}px`,
          maskImage:
            "radial-gradient(120% 90% at 50% 40%, black 30%, transparent 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.85) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
