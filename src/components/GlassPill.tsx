import React from "react";
import { useAccent } from "../accent";
import { colors } from "../theme";

// La "pastilla" de vidrio con borde blanco que la web usa en botones y
// en el "¿Y LA PLATA?" del hero.
export const GlassPill: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  glow?: boolean;
}> = ({ children, style, glow = true }) => {
  const accent = useAccent();
  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 24,
        padding: "22px 40px",
        borderRadius: 34,
        border: `4px solid ${colors.glassBorder}`,
        background: glow
          ? `linear-gradient(115deg, ${accent.alpha(0.55)} 0%, ${accent.deep(0.35)} 45%, ${colors.glass} 100%)`
          : colors.glass,
        backdropFilter: "blur(14px)",
        boxShadow: glow
          ? `0 0 60px ${accent.alpha(0.35)}, inset 0 1px 0 rgba(255,255,255,0.25)`
          : "inset 0 1px 0 rgba(255,255,255,0.2)",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
