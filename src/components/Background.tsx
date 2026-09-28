import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useAccent } from "../accent";
import { colors } from "../theme";

// Fondo negro con resplandores del color de acento que se mueven lento y una
// rejilla de puntos, como el hero de bitaxus.com. Está hecho con SVG (no con
// radial-gradient de CSS) para que también salga al exportar en el navegador.
export const Background: React.FC<{ intensity?: number }> = ({ intensity = 1 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const accent = useAccent();
  const t = frame / 30;
  const id = useMemo(() => `bg${Math.random().toString(36).slice(2, 8)}`, []);

  const a = { x: 0.2 + Math.sin(t * 0.45) * 0.12, y: 0.12 + Math.cos(t * 0.35) * 0.08 };
  const b = { x: 0.85 + Math.cos(t * 0.3) * 0.1, y: 0.78 + Math.sin(t * 0.4) * 0.1 };
  const pulse = interpolate(Math.sin(t * 1.2), [-1, 1], [0.8, 1]) * intensity;
  const dotY = -((frame * 0.4) % 36);
  const ellipse = (p: { x: number; y: number }, ry: number) =>
    `translate(${p.x} ${p.y}) scale(1 ${ry}) translate(${-p.x} ${-p.y})`;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.black }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id={`${id}a`} cx={a.x} cy={a.y} r={0.6} gradientTransform={ellipse(a, 0.4 / 0.6)}>
            <stop offset="0" stopColor={accent.color} stopOpacity={0.55 * pulse} />
            <stop offset="0.45" stopColor={accent.color} stopOpacity={0.18 * pulse} />
            <stop offset="0.75" stopColor={accent.color} stopOpacity={0} />
          </radialGradient>
          <radialGradient id={`${id}b`} cx={b.x} cy={b.y} r={0.55} gradientTransform={ellipse(b, 0.35 / 0.55)}>
            <stop offset="0" stopColor={accent.color} stopOpacity={0.45 * pulse} />
            <stop offset="0.5" stopColor={accent.color} stopOpacity={0.14 * pulse} />
            <stop offset="0.8" stopColor={accent.color} stopOpacity={0} />
          </radialGradient>
          <radialGradient id={`${id}v`} cx={0.5} cy={0.5} r={0.75}>
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.85} />
          </radialGradient>
          <radialGradient id={`${id}m`} cx={0.5} cy={0.4} r={0.75}>
            <stop offset="0.3" stopColor="#fff" stopOpacity={1} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <pattern id={`${id}p`} width={36} height={36} patternUnits="userSpaceOnUse" y={dotY}>
            <circle cx={18} cy={18} r={1.6} fill="rgba(255,255,255,0.14)" />
          </pattern>
          <mask id={`${id}k`}>
            <rect width={width} height={height} fill={`url(#${id}m)`} />
          </mask>
        </defs>
        <rect width={width} height={height} fill={`url(#${id}a)`} />
        <rect width={width} height={height} fill={`url(#${id}b)`} />
        <rect width={width} height={height} fill={`url(#${id}p)`} mask={`url(#${id}k)`} />
        <rect width={width} height={height} fill={`url(#${id}v)`} />
      </svg>
    </AbsoluteFill>
  );
};
