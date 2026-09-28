import { VectorNode } from "./types";

// Construye el atributo `d` de un <path> a partir de los puntos normalizados.
export const buildPath = (nodes: VectorNode[], closed: boolean, w: number, h: number) => {
  if (nodes.length === 0) return "";
  const P = (p: { x: number; y: number }) => `${(p.x * w).toFixed(2)} ${(p.y * h).toFixed(2)}`;
  const seg = (a: VectorNode, b: VectorNode) =>
    a.out || b.in ? ` C ${P(a.out ?? a)} ${P(b.in ?? b)} ${P(b)}` : ` L ${P(b)}`;
  let d = `M ${P(nodes[0])}`;
  for (let i = 1; i < nodes.length; i++) d += seg(nodes[i - 1], nodes[i]);
  if (closed && nodes.length > 2) d += `${seg(nodes[nodes.length - 1], nodes[0])} Z`;
  return d;
};

// Normaliza puntos en coordenadas absolutas del lienzo a su caja (0–1).
export const normalizeNodes = (abs: VectorNode[]) => {
  const xs: number[] = [];
  const ys: number[] = [];
  abs.forEach((n) => {
    [n, n.in, n.out].forEach((p) => {
      if (p) {
        xs.push(p.x);
        ys.push(p.y);
      }
    });
  });
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(10, Math.max(...xs) - minX);
  const h = Math.max(10, Math.max(...ys) - minY);
  const norm = (p: { x: number; y: number }) => ({ x: (p.x - minX) / w, y: (p.y - minY) / h });
  return {
    box: { x: Math.round(minX), y: Math.round(minY), w: Math.round(w), h: Math.round(h) },
    nodes: abs.map((n) => ({ ...norm(n), in: n.in && norm(n.in), out: n.out && norm(n.out) })),
  };
};

// ---------- Formas e íconos predefinidos (normalizados 0–1) ----------

const poly = (pts: [number, number][]): VectorNode[] => pts.map(([x, y]) => ({ x, y }));

const regular = (sides: number, rot = -Math.PI / 2): VectorNode[] =>
  Array.from({ length: sides }, (_, i) => {
    const a = rot + (i * 2 * Math.PI) / sides;
    return { x: 0.5 + 0.5 * Math.cos(a), y: 0.5 + 0.5 * Math.sin(a) };
  });

const star = (points: number, inner: number): VectorNode[] =>
  Array.from({ length: points * 2 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    const r = i % 2 === 0 ? 0.5 : 0.5 * inner;
    return { x: 0.5 + r * Math.cos(a), y: 0.5 + r * Math.sin(a) };
  });

const K = 0.5523 * 0.5;
const circle: VectorNode[] = [
  { x: 0.5, y: 0, in: { x: 0.5 - K, y: 0 }, out: { x: 0.5 + K, y: 0 } },
  { x: 1, y: 0.5, in: { x: 1, y: 0.5 - K }, out: { x: 1, y: 0.5 + K } },
  { x: 0.5, y: 1, in: { x: 0.5 + K, y: 1 }, out: { x: 0.5 - K, y: 1 } },
  { x: 0, y: 0.5, in: { x: 0, y: 0.5 + K }, out: { x: 0, y: 0.5 - K } },
];

const heart: VectorNode[] = [
  { x: 0.5, y: 0.28, in: { x: 0.38, y: 0.02 }, out: { x: 0.62, y: 0.02 } },
  { x: 1, y: 0.33, in: { x: 1, y: 0.08 }, out: { x: 1, y: 0.6 } },
  { x: 0.5, y: 1, in: { x: 0.8, y: 0.78 }, out: { x: 0.2, y: 0.78 } },
  { x: 0, y: 0.33, in: { x: 0, y: 0.6 }, out: { x: 0, y: 0.08 } },
];

const bubble: VectorNode[] = [
  { x: 0.5, y: 0, in: { x: 0.15, y: 0 }, out: { x: 0.85, y: 0 } },
  { x: 1, y: 0.4, in: { x: 1, y: 0.12 }, out: { x: 1, y: 0.68 } },
  { x: 0.5, y: 0.8, in: { x: 0.85, y: 0.8 } },
  { x: 0.18, y: 1 },
  { x: 0.25, y: 0.74, out: { x: 0.08, y: 0.66 } },
  { x: 0, y: 0.4, in: { x: 0, y: 0.6 }, out: { x: 0, y: 0.12 } },
];

export type VectorPreset = { id: string; name: string; nodes: VectorNode[]; closed: boolean; outline?: boolean; ratio?: number };

export const VECTOR_PRESETS: VectorPreset[] = [
  { id: "circulo", name: "Círculo", nodes: circle, closed: true },
  { id: "cuadrado", name: "Cuadrado", nodes: poly([[0, 0], [1, 0], [1, 1], [0, 1]]), closed: true },
  { id: "triangulo", name: "Triángulo", nodes: regular(3), closed: true, ratio: 0.87 },
  { id: "rombo", name: "Rombo", nodes: poly([[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]]), closed: true },
  { id: "hexagono", name: "Hexágono", nodes: regular(6, 0), closed: true, ratio: 0.87 },
  { id: "estrella", name: "Estrella", nodes: star(5, 0.45), closed: true },
  { id: "destello", name: "Destello", nodes: star(4, 0.3), closed: true },
  { id: "corazon", name: "Corazón", nodes: heart, closed: true, ratio: 0.9 },
  { id: "burbuja", name: "Burbuja de chat", nodes: bubble, closed: true, ratio: 0.85 },
  { id: "flecha", name: "Flecha", nodes: poly([[0, 0.35], [0.6, 0.35], [0.6, 0.1], [1, 0.5], [0.6, 0.9], [0.6, 0.65], [0, 0.65]]), closed: true, ratio: 0.6 },
  { id: "chulo", name: "Chulo ✓", nodes: poly([[0, 0.55], [0.35, 0.9], [1, 0.1]]), closed: false, outline: true, ratio: 0.8 },
  { id: "mas", name: "Más +", nodes: poly([[0.38, 0], [0.62, 0], [0.62, 0.38], [1, 0.38], [1, 0.62], [0.62, 0.62], [0.62, 1], [0.38, 1], [0.38, 0.62], [0, 0.62], [0, 0.38], [0.38, 0.38]]), closed: true },
  { id: "rayo", name: "Rayo", nodes: poly([[0.62, 0], [0.1, 0.58], [0.45, 0.58], [0.35, 1], [0.9, 0.4], [0.55, 0.4]]), closed: true, ratio: 1.5 },
  { id: "moneda", name: "Moneda", nodes: circle, closed: true, outline: true },
  { id: "linea", name: "Línea", nodes: poly([[0, 0.5], [1, 0.5]]), closed: false, outline: true, ratio: 0.02 },
  { id: "onda", name: "Onda", nodes: [{ x: 0, y: 0.5, out: { x: 0.17, y: 0 } }, { x: 0.5, y: 0.5, in: { x: 0.33, y: 1 }, out: { x: 0.67, y: 0 } }, { x: 1, y: 0.5, in: { x: 0.83, y: 1 } }], closed: false, outline: true, ratio: 0.3 },
];
