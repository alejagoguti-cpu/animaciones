import React from "react";
import { GlowLight, GlowStyle } from "../types";

// Estilos de resplandor del fondo. Todo es SVG con degradados radiales y lineales
// (sin filtros) para que el MP4 exportado en el navegador salga igual que en pantalla.

export const GLOW_STYLES: [GlowStyle, string][] = [
  ["orbes", "Orbes (clásico)"],
  ["aurora", "Aurora diagonal"],
  ["malla", "Malla de color"],
  ["esquina", "Esquina"],
  ["centro", "Halo central"],
  ["arriba", "Luz desde arriba"],
  ["abajo", "Amanecer (desde abajo)"],
  ["lateral", "Luz lateral"],
  ["ondas", "Ondas"],
  ["rayos", "Rayos de luz"],
];

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(full, 16);
  return Number.isNaN(n) ? [193, 18, 31] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// Versión más clara del color, para dar profundidad.
const lighten = (hex: string, k = 0.28) => {
  const [r, g, b] = hexToRgb(hex);
  const m = (v: number) => Math.round(v + (255 - v) * k);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
};

// Fuentes de luz de cada estilo (posición normalizada 0–1). El usuario las arrastra en el lienzo.
export const DEFAULT_ANCHORS: Record<GlowStyle, { x: number; y: number }[]> = {
  orbes: [{ x: 0.2, y: 0.12 }, { x: 0.85, y: 0.78 }],
  aurora: [{ x: 0.3, y: 0.22 }, { x: 0.62, y: 0.5 }, { x: 0.4, y: 0.8 }],
  malla: [{ x: 0.2, y: 0.15 }, { x: 0.85, y: 0.32 }, { x: 0.15, y: 0.7 }, { x: 0.8, y: 0.92 }],
  esquina: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
  centro: [{ x: 0.5, y: 0.5 }],
  arriba: [{ x: 0.5, y: 0 }],
  abajo: [{ x: 0.5, y: 1 }],
  lateral: [{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }],
  ondas: [{ x: 0.5, y: 0.66 }],
  rayos: [{ x: 0.5, y: 0 }],
};

export const anchorsOf = (style: GlowStyle, points?: { x: number; y: number }[]) =>
  DEFAULT_ANCHORS[style].map((d, i) => points?.[i] ?? d);

type Blob = { cx: number; cy: number; rx: number; ry: number; rot?: number; a: number; light?: boolean };

export const GlowStyleLayer: React.FC<{
  style: GlowStyle;
  id: string;
  width: number;
  height: number;
  t: number;
  color: string;
  intensity: number;
  points?: { x: number; y: number }[];
}> = ({ style, id, width: w, height: h, t, color, intensity, points }) => {
  const an = anchorsOf(style, points);
  const A = (i: number) => an[Math.min(i, an.length - 1)];
  const m = Math.max(w, h);
  const sw = Math.sin(t * 0.5);
  const cw = Math.cos(t * 0.4);
  const pulse = 0.85 + 0.15 * Math.sin(t * 1.3);
  const k = intensity;
  const blobs: Blob[] = [];

  switch (style) {
    case "aurora":
      blobs.push(
        { cx: w * (A(0).x + 0.08 * sw), cy: h * A(0).y, rx: m * 0.95, ry: m * 0.17, rot: -30, a: 0.55 },
        { cx: w * (A(1).x - 0.07 * cw), cy: h * A(1).y, rx: m * 0.95, ry: m * 0.14, rot: -30, a: 0.42, light: true },
        { cx: w * (A(2).x + 0.08 * cw), cy: h * A(2).y, rx: m * 0.95, ry: m * 0.16, rot: -30, a: 0.5 },
      );
      break;
    case "malla":
      blobs.push(
        { cx: w * (A(0).x + 0.06 * sw), cy: h * (A(0).y + 0.04 * cw), rx: m * 0.55, ry: m * 0.55, a: 0.6 },
        { cx: w * (A(1).x - 0.06 * cw), cy: h * (A(1).y + 0.05 * sw), rx: m * 0.5, ry: m * 0.5, a: 0.42, light: true },
        { cx: w * (A(2).x + 0.05 * cw), cy: h * (A(2).y - 0.04 * sw), rx: m * 0.5, ry: m * 0.5, a: 0.38, light: true },
        { cx: w * (A(3).x + 0.05 * sw), cy: h * (A(3).y - 0.04 * cw), rx: m * 0.6, ry: m * 0.6, a: 0.55 },
      );
      break;
    case "esquina":
      blobs.push(
        { cx: w * A(0).x, cy: h * A(0).y, rx: m * 1.05, ry: m * 0.85, rot: 6 * sw, a: 0.8 },
        { cx: w * A(1).x, cy: h * A(1).y, rx: m * 0.6, ry: m * 0.5, a: 0.3 },
      );
      break;
    case "centro":
      blobs.push(
        { cx: w * A(0).x, cy: h * A(0).y, rx: w * 0.75 * pulse, ry: h * 0.5 * pulse, a: 0.5 },
        { cx: w * A(0).x, cy: h * A(0).y, rx: w * 0.34 * pulse, ry: h * 0.24 * pulse, a: 0.4, light: true },
      );
      break;
    case "arriba":
    case "abajo": {
      const dir = style === "arriba" ? -1 : 1;
      const cy = h * (A(0).y + dir * 0.05);
      blobs.push(
        { cx: w * A(0).x, cy, rx: w * 1.05, ry: h * 0.6 * (0.95 + 0.05 * sw), a: 0.75 },
        { cx: w * A(0).x, cy: h * (A(0).y + dir * 0.02), rx: w * 0.5, ry: h * 0.3, a: 0.4, light: true },
      );
      break;
    }
    case "lateral":
      blobs.push(
        { cx: w * A(0).x, cy: h * (A(0).y + 0.08 * sw), rx: w * 0.6, ry: h * 0.75, a: 0.7 },
        { cx: w * A(1).x, cy: h * (A(1).y - 0.08 * sw), rx: w * 0.6, ry: h * 0.75, a: 0.7 },
      );
      break;
    default:
      break;
  }

  const light = lighten(color);
  const defs: React.ReactNode[] = [];
  const shapes: React.ReactNode[] = [];

  blobs.forEach((b, i) => {
    const gid = `${id}b${i}`;
    const c = b.light ? light : color;
    const a = Math.min(1, b.a * k);
    defs.push(
      <radialGradient
        key={gid}
        id={gid}
        gradientUnits="userSpaceOnUse"
        cx={0}
        cy={0}
        r={1}
        gradientTransform={`translate(${b.cx} ${b.cy}) rotate(${b.rot ?? 0}) scale(${b.rx} ${b.ry})`}
      >
        <stop offset="0" stopColor={c} stopOpacity={a} />
        <stop offset="0.45" stopColor={c} stopOpacity={a * 0.3} />
        <stop offset="1" stopColor={c} stopOpacity={0} />
      </radialGradient>,
    );
    shapes.push(<rect key={gid} width={w} height={h} fill={`url(#${gid})`} />);
  });

  if (style === "ondas") {
    const dy = A(0).y - 0.66;
    const waves = [
      { base: 0.52, amp: 0.05, freq: 1.6, speed: 0.7, a: 0.5, light: false },
      { base: 0.66, amp: 0.045, freq: 2.2, speed: -0.55, a: 0.4, light: true },
      { base: 0.8, amp: 0.06, freq: 1.3, speed: 0.4, a: 0.55, light: false },
    ];
    waves.forEach((wv, i) => {
      const gid = `${id}w${i}`;
      const c = wv.light ? light : color;
      defs.push(
        <linearGradient key={gid} id={gid} gradientUnits="userSpaceOnUse" x1={0} y1={h * (wv.base + dy - wv.amp)} x2={0} y2={h}>
          <stop offset="0" stopColor={c} stopOpacity={Math.min(1, wv.a * k)} />
          <stop offset="1" stopColor={c} stopOpacity={0} />
        </linearGradient>,
      );
      const steps = 40;
      let d = `M 0 ${h}`;
      for (let s = 0; s <= steps; s++) {
        const x = (s / steps) * w;
        const y = h * (wv.base + dy) + Math.sin((s / steps) * Math.PI * 2 * wv.freq + t * wv.speed * 2) * h * wv.amp;
        d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      d += ` L ${w} ${h} Z`;
      shapes.push(<path key={gid} d={d} fill={`url(#${gid})`} />);
    });
  }

  if (style === "rayos") {
    const gid = `${id}r`;
    defs.push(
      <linearGradient key={gid} id={gid} gradientUnits="userSpaceOnUse" x1={0} y1={-h * 0.1} x2={0} y2={h * 1.05}>
        <stop offset="0" stopColor={light} stopOpacity={Math.min(1, 0.95 * k)} />
        <stop offset="0.55" stopColor={color} stopOpacity={Math.min(1, 0.32 * k)} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </linearGradient>,
    );
    [-2, -1, 0, 1, 2].forEach((n) => {
      const sway = Math.sin(t * 0.6 + n) * w * 0.04;
      const bx = w * 0.5 + n * w * 0.3 + sway + (A(0).x - 0.5) * w;
      const half = w * (0.05 + 0.02 * Math.abs(n));
      shapes.push(
        <polygon
          key={`${gid}${n}`}
          points={`${w * A(0).x + n * w * 0.03},${-h * 0.1} ${bx - half},${h * 1.05} ${bx + half},${h * 1.05}`}
          fill={`url(#${gid})`}
          opacity={0.9}
        />,
      );
    });
  }

  return (
    <>
      <defs>{defs}</defs>
      {shapes}
    </>
  );
};

// Luces extra agregadas por el usuario: manchas redondas con su propio color y tamaño.
export const GlowLights: React.FC<{
  lights: GlowLight[];
  id: string;
  width: number;
  height: number;
  t: number;
  intensity: number;
}> = ({ lights, id, width: w, height: h, t, intensity }) => {
  const m = Math.max(w, h);
  return (
    <>
      <defs>
        {lights.map((l, i) => {
          const dx = Math.sin(t * 0.5 + i * 1.7) * w * 0.02;
          const dy = Math.cos(t * 0.4 + i * 2.3) * h * 0.015;
          const a = Math.min(1, 0.7 * intensity);
          return (
            <radialGradient
              key={l.id}
              id={`${id}l${i}`}
              gradientUnits="userSpaceOnUse"
              cx={0}
              cy={0}
              r={1}
              gradientTransform={`translate(${l.x * w + dx} ${l.y * h + dy}) scale(${l.size * m})`}
            >
              <stop offset="0" stopColor={l.color} stopOpacity={a} />
              <stop offset="0.45" stopColor={l.color} stopOpacity={a * 0.3} />
              <stop offset="1" stopColor={l.color} stopOpacity={0} />
            </radialGradient>
          );
        })}
      </defs>
      {lights.map((l, i) => (
        <rect key={l.id} width={w} height={h} fill={`url(#${id}l${i})`} />
      ))}
    </>
  );
};
