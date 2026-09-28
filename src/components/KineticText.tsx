import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "../theme";

// Titular que entra palabra por palabra: sube, se desenfoca y rebota un poco.
export const KineticText: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  fontSize?: number;
  color?: string;
  align?: React.CSSProperties["textAlign"];
  style?: React.CSSProperties;
}> = ({
  text,
  delay = 0,
  stagger = 4,
  fontSize = 120,
  color = colors.white,
  align = "left",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");

  return (
    <div
      style={{
        fontFamily: fonts.display,
        fontSize,
        lineHeight: 1.05,
        color,
        textTransform: "uppercase",
        textAlign: align,
        letterSpacing: "0.01em",
        textShadow: "0 0 40px rgba(193,18,31,0.35)",
        ...style,
      }}
    >
      {words.map((word, i) => {
        const progress = spring({
          frame: frame - delay - i * stagger,
          fps,
          config: { damping: 14, stiffness: 120, mass: 0.8 },
        });
        const y = interpolate(progress, [0, 1], [70, 0]);
        const blur = interpolate(progress, [0, 1], [12, 0], {
          extrapolateRight: "clamp",
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: "0.28em",
              opacity: Math.min(1, progress * 1.4),
              transform: `translateY(${y}px)`,
              filter: `blur(${blur}px)`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// Texto corrido que aparece con un fundido suave.
export const FadeText: React.FC<{
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame - delay, [0, 15], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        fontFamily: fonts.body,
        color: colors.whiteSoft,
        fontSize: 40,
        lineHeight: 1.4,
        opacity,
        transform: `translateY(${y}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
