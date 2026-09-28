import React, { useEffect, useRef, useState } from "react";
import { buildPath } from "../../src/editor/vector";
import { ElementData, VectorNode } from "../../src/editor/types";

type VectorEl = Extract<ElementData, { type: "vector" }>;
type Target = { i: number; part: "node" | "in" | "out" };

// Edición de puntos de un vector. Se dibuja dentro de la caja (ya rotada) del
// elemento, así que las posiciones van en porcentaje de la caja.
export const PointEditor: React.FC<{
  el: VectorEl;
  scale: number;
  onNodes: (nodes: VectorNode[]) => void;
  onEnd: () => void;
}> = ({ el, scale, onNodes, onEnd }) => {
  const drag = useRef<{ t: Target; startX: number; startY: number; orig: VectorNode[] } | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const nodes = el.props.nodes;
  const W = el.w * scale;
  const H = el.h * scale;

  // Supr borra el punto seleccionado (antes que el atajo de borrar elemento).
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (active === null || !(e.key === "Delete" || e.key === "Backspace")) return;
      if ((e.target as HTMLElement).closest("input, textarea")) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (nodes.length <= 2) return;
      onNodes(nodes.filter((_, i) => i !== active));
      onEnd();
      setActive(null);
    };
    window.addEventListener("keydown", on, true);
    return () => window.removeEventListener("keydown", on, true);
  });

  const down = (e: React.PointerEvent, t: Target) => {
    e.stopPropagation();
    if (t.part === "node") setActive(t.i);
    if (e.altKey && t.part === "node") {
      // Alt + clic: alterna entre punto recto y curvo.
      const n = nodes[t.i];
      const next = n.in || n.out
        ? { x: n.x, y: n.y }
        : { x: n.x, y: n.y, in: { x: n.x - 0.15, y: n.y }, out: { x: n.x + 0.15, y: n.y } };
      onNodes(nodes.map((m, j) => (j === t.i ? next : m)));
      onEnd();
      return;
    }
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {
      // sin captura
    }
    drag.current = { t, startX: e.clientX, startY: e.clientY, orig: nodes };
  };

  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    e.stopPropagation();
    // Movimiento de pantalla → coordenadas locales (sin la rotación de la caja).
    const rad = (-el.rotation * Math.PI) / 180;
    const sx = e.clientX - d.startX;
    const sy = e.clientY - d.startY;
    const lx = (sx * Math.cos(rad) - sy * Math.sin(rad)) / W;
    const ly = (sx * Math.sin(rad) + sy * Math.cos(rad)) / H;
    const o = d.orig[d.t.i];
    const add = (p: { x: number; y: number }) => ({ x: p.x + lx, y: p.y + ly });
    let n: VectorNode;
    if (d.t.part === "node") {
      n = { x: o.x + lx, y: o.y + ly, in: o.in && add(o.in), out: o.out && add(o.out) };
    } else {
      const h = add(o[d.t.part]!);
      const mirror = { x: 2 * o.x - h.x, y: 2 * o.y - h.y };
      n = d.t.part === "out"
        ? { ...o, out: h, in: e.altKey ? o.in : mirror }
        : { ...o, in: h, out: e.altKey ? o.out : mirror };
    }
    onNodes(d.orig.map((m, j) => (j === d.t.i ? n : m)));
  };

  const up = () => {
    if (drag.current) onEnd();
    drag.current = null;
  };

  const pct = (p: { x: number; y: number }) => ({ left: `${p.x * 100}%`, top: `${p.y * 100}%` });
  const dot = (size: number, color: string, round: boolean): React.CSSProperties => ({
    position: "absolute",
    width: size,
    height: size,
    marginLeft: -size / 2,
    marginTop: -size / 2,
    background: color,
    border: "2px solid #ff3b47",
    borderRadius: round ? "50%" : 3,
    cursor: "move",
    zIndex: 6,
  });

  return (
    <div style={{ position: "absolute", inset: 0 }} onPointerMove={move} onPointerUp={up}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
        <path d={buildPath(nodes, el.props.closed, W, H)} fill="none" stroke="#3ad0ff" strokeWidth={1.5} strokeDasharray="4 3" />
        {nodes.map((n, i) =>
          (["in", "out"] as const).map((k) =>
            n[k] ? <line key={`${i}${k}`} x1={n.x * W} y1={n.y * H} x2={n[k]!.x * W} y2={n[k]!.y * H} stroke="#ff3b47" strokeWidth={1.5} /> : null,
          ),
        )}
      </svg>
      {nodes.map((n, i) => (
        <React.Fragment key={i}>
          {(["in", "out"] as const).map((k) =>
            n[k] ? (
              <div key={k} style={{ ...dot(10, "#ff3b47", true), ...pct(n[k]!) }} onPointerDown={(e) => down(e, { i, part: k })} />
            ) : null,
          )}
          <div
            style={{ ...dot(12, active === i ? "#3ad0ff" : "#fff", false), ...pct(n) }}
            title="Arrastra para mover · Alt+clic curva/recto · Supr borra"
            onPointerDown={(e) => down(e, { i, part: "node" })}
          />
        </React.Fragment>
      ))}
    </div>
  );
};
