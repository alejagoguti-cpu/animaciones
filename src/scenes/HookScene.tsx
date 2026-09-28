import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { GlassPill } from "../components/GlassPill";
import { FadeText, KineticText } from "../components/KineticText";
import { Logo } from "../components/Logo";
import { colors, fonts } from "../theme";

// Escena 1: "VENDISTE COMO NUNCA ¿Y LA PLATA?"
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pill = spring({ frame: frame - 34, fps, config: { damping: 10, stiffness: 140 } });
  const shine = interpolate(frame, [50, 80], [-120, 220], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shake = frame > 40 && frame < 56 ? Math.sin(frame * 2.2) * 3 : 0;

  return (
    <AbsoluteFill style={{ padding: "0 90px", justifyContent: "center" }}>
      <Logo width={300} style={{ position: "absolute", top: 120, left: 90 }} />

      <FadeText delay={0} style={{ fontSize: 36, color: colors.whiteMuted, marginBottom: 36 }}>
        Cobrar debería ser tan fácil como enviar un mensaje.
      </FadeText>

      <KineticText text="Vendiste" delay={6} fontSize={150} />
      <KineticText text="como nunca" delay={14} fontSize={150} />

      <div
        style={{
          marginTop: 40,
          transform: `scale(${pill}) rotate(${shake}deg)`,
          transformOrigin: "left center",
        }}
      >
        <GlassPill style={{ padding: "26px 44px" }}>
          <span style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 94, color: colors.white, whiteSpace: "nowrap" }}>
            ¿Y LA PLATA?
          </span>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)",
              transform: `translateX(${shine}%)`,
            }}
          />
        </GlassPill>
      </div>
    </AbsoluteFill>
  );
};
