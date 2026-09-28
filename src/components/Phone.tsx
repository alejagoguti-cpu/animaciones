import React from "react";
import { useAccent } from "../accent";
import { colors, fonts } from "../theme";

// Marco de teléfono simple hecho con CSS.
export const Phone: React.FC<{
  children: React.ReactNode;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}> = ({ children, width = 760, height = 1300, style }) => {
  const accent = useAccent();
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 96,
        padding: 18,
        background: "linear-gradient(145deg, #3a3a3e 0%, #111114 50%, #2a2a2e 100%)",
        boxShadow:
          `0 60px 140px rgba(0,0,0,0.7), 0 0 90px ${accent.alpha(0.35)}, inset 0 0 0 2px rgba(255,255,255,0.12)`,
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: 80,
          overflow: "hidden",
          background: colors.whatsappBg,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 22,
            left: "50%",
            transform: "translateX(-50%)",
            width: 200,
            height: 56,
            borderRadius: 40,
            background: "#000",
            zIndex: 10,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 64,
            right: 64,
            display: "flex",
            justifyContent: "space-between",
            fontFamily: fonts.body,
            fontWeight: 600,
            fontSize: 30,
            color: colors.white,
            zIndex: 9,
          }}
        >
          <span>9:41</span>
          <span>● ● ●</span>
        </div>
        {children}
      </div>
    </div>
  );
};
