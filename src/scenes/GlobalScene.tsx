import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { GlassPill } from "../components/GlassPill";
import { FadeText, KineticText } from "../components/KineticText";
import { useAccent } from "../accent";
import { PromoProps } from "../schema";
import { colors, fonts } from "../theme";

const formatCOP = (n: number) => Math.round(n).toLocaleString("es-CO");

// Escena 4: Bitaxus Global, contador de USD a COP.
export const GlobalScene: React.FC<PromoProps["escena4Global"]> = ({
  titular1,
  titular2,
  monedaEnvio,
  montoEnvio,
  monedaResultado,
  montoResultado,
  nota,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const card = spring({ frame: frame - 16, fps, config: { damping: 14 } });
  const amount = interpolate(frame, [30, 80], [0, montoResultado], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ padding: "0 80px", justifyContent: "center", gap: 50 }}>
      <KineticText text={titular1} fontSize={110} />
      <KineticText text={titular2} fontSize={110} delay={8} style={{ marginTop: -40 }} />

      <div
        style={{
          opacity: card,
          transform: `translateY(${interpolate(card, [0, 1], [120, 0])}px)`,
        }}
      >
        <GlassPill
          style={{ width: "100%", flexDirection: "column", alignItems: "stretch", padding: 50, gap: 30 }}
        >
          <Row label="TÚ ENVÍAS" currency={monedaEnvio} value={montoEnvio} />
          <div style={{ height: 2, background: "rgba(255,255,255,0.25)" }} />
          <Row label="RESULTADO ESTIMADO" currency={monedaResultado} value={formatCOP(amount)} highlight />
        </GlassPill>
      </div>

      <FadeText delay={60} style={{ fontSize: 30, color: colors.whiteMuted }}>
        {nota}
      </FadeText>
    </AbsoluteFill>
  );
};

const Row: React.FC<{ label: string; currency: string; value: string; highlight?: boolean }> = ({
  label,
  currency,
  value,
  highlight,
}) => {
  const accent = useAccent();
  return (
  <div style={{ fontFamily: fonts.body, color: colors.white }}>
    <div style={{ fontSize: 28, letterSpacing: "0.12em", color: colors.whiteSoft, fontWeight: 600 }}>
      {label}
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginTop: 10 }}>
      <span style={{ fontSize: 44, fontWeight: 700, color: highlight ? accent.light : colors.white }}>
        {currency}
      </span>
      <span
        style={{
          fontFamily: fonts.display,
          fontSize: 100,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  </div>
  );
};
