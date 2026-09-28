import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { GlassPill } from "../components/GlassPill";
import { KineticText } from "../components/KineticText";
import { useAccent } from "../accent";
import { PromoProps } from "../schema";
import { colors, fonts } from "../theme";

// Escena 3: recibe, paga y decide.
export const FeaturesScene: React.FC<PromoProps["escena3Beneficios"]> = ({ titular, beneficios }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = useAccent();

  return (
    <AbsoluteFill style={{ padding: "0 80px", justifyContent: "center", gap: 60 }}>
      <KineticText text={titular} fontSize={88} stagger={3} />

      <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
        {beneficios.map((f, i) => {
          const p = spring({
            frame: frame - 22 - i * 10,
            fps,
            config: { damping: 15, stiffness: 110 },
          });
          return (
            <div
              key={i}
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
                    background: "linear-gradient(145deg, #ffffff, #bdbdbd)",
                    color: accent.deep(),
                    fontSize: 56,
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: fonts.body,
                    boxShadow: "0 0 30px rgba(255,255,255,0.25)",
                  }}
                >
                  {f.icono}
                </div>
                <div style={{ fontFamily: fonts.body, color: colors.white }}>
                  <div style={{ fontSize: 46, fontWeight: 700 }}>{f.titulo}</div>
                  <div style={{ fontSize: 32, color: colors.whiteSoft, marginTop: 6 }}>{f.texto}</div>
                </div>
              </GlassPill>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
