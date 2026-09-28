import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { GlassPill } from "../components/GlassPill";
import { FadeText } from "../components/KineticText";
import { Logo } from "../components/Logo";
import { colors, fonts } from "../theme";

// Escena 5: cierre con logo y "Hablemos".
export const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logo = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const button = spring({ frame: frame - 26, fps, config: { damping: 10, stiffness: 150 } });
  const letterSpacing = interpolate(logo, [0, 1], [0.6, 0.18]);
  const ring = interpolate(frame % 45, [0, 45], [1, 1.25]);
  const ringOpacity = interpolate(frame % 45, [0, 45], [0.6, 0]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 70 }}>
      <div style={{ opacity: logo, transform: `scale(${interpolate(logo, [0, 1], [0.7, 1])})` }}>
        <Logo size={130} style={{ letterSpacing: `${letterSpacing}em` }} />
      </div>

      <FadeText delay={14} style={{ fontSize: 46, textAlign: "center", color: colors.white, padding: "0 100px" }}>
        Cobra, paga y entiende tu dinero desde WhatsApp.
      </FadeText>

      <div style={{ position: "relative", transform: `scale(${button})` }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 34,
            border: `4px solid ${colors.red}`,
            transform: `scale(${ring})`,
            opacity: frame > 40 ? ringOpacity : 0,
          }}
        />
        <GlassPill style={{ padding: "34px 70px" }}>
          <span style={{ fontFamily: fonts.body, fontWeight: 700, fontSize: 56, color: colors.white }}>
            Hablemos →
          </span>
        </GlassPill>
      </div>

      <FadeText delay={40} style={{ fontFamily: fonts.display, fontSize: 44, color: colors.whiteSoft }}>
        bitaxus.com
      </FadeText>
    </AbsoluteFill>
  );
};
