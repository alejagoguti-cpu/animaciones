import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { GlassPill } from "../components/GlassPill";
import { KineticText } from "../components/KineticText";
import { colors, fonts } from "../theme";

const features = [
  { icon: "↓", title: "Recaudos", text: "Programa y registra los pagos que esperas recibir." },
  { icon: "↑", title: "Pagos y dispersiones", text: "Organiza pagos individuales o múltiples." },
  { icon: "◎", title: "Decisiones más claras", text: "Ordena tus movimientos y decide mejor." },
];

// Escena 3: recibe, paga y decide.
export const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "0 80px", justifyContent: "center", gap: 60 }}>
      <KineticText text="Recibe, paga y decide con más claridad." fontSize={88} stagger={3} />

      <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
        {features.map((f, i) => {
          const p = spring({
            frame: frame - 22 - i * 10,
            fps,
            config: { damping: 15, stiffness: 110 },
          });
          return (
            <div
              key={f.title}
              style={{
                opacity: p,
                transform: `translateX(${interpolate(p, [0, 1], [-260, 0])}px)`,
              }}
            >
              <GlassPill glow={i === 0} style={{ width: "100%", padding: "34px 40px" }}>
                <div
                  style={{
                    width: 110,
                    height: 110,
                    flexShrink: 0,
                    borderRadius: 55,
                    background: "radial-gradient(circle at 30% 30%, #fff, #bdbdbd)",
                    color: colors.redDeep,
                    fontSize: 56,
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: fonts.body,
                    boxShadow: "0 0 30px rgba(255,255,255,0.25)",
                  }}
                >
                  {f.icon}
                </div>
                <div style={{ fontFamily: fonts.body, color: colors.white }}>
                  <div style={{ fontSize: 46, fontWeight: 700 }}>{f.title}</div>
                  <div style={{ fontSize: 32, color: colors.whiteSoft, marginTop: 6 }}>{f.text}</div>
                </div>
              </GlassPill>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
