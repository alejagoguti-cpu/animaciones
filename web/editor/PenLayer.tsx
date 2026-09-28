import React, { useEffect, useRef, useState } from "react";
import { buildPath } from "../../src/editor/vector";
import { VectorNode } from "../../src/editor/types";

// Capa de dibujo con pluma sobre el lienzo. Trabaja en coordenadas del video.
export const PenLayer: React.FC<{
  scale: number;
  width: number;
  height: number;
  onDone: (nodes: VectorNode[], closed: boolean) => void;
  onCancel: () => void;
}> = ({ scale, width, height, onDone, onCancel }) => {
  const [nodes, setNodes] = useState<VectorNode[]>([]);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const latest = useRef(nodes);
  latest.current = nodes;

  const pos = (e: React.PointerEvent | React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
  };

  const finish = (closed: boolean) => {
    // Quita puntos repetidos (el doble clic agrega dos).
    const clean = latest.current.filter(
      (n, i, arr) => i === 0 || Math.hypot(n.x - arr[i - 1].x, n.y - arr[i - 1].y) > 2 / scale,
    );
    if (clean.length >= 2) onDone(clean, closed && clean.length >= 3);
    else onCancel();
    setNodes([]);
  };

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopImmediatePropagation();
        finish(false);
      } else if (e.key === "Escape") {
        e.stopImmediatePropagation();
        setNodes([]);
        onCancel();
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        e.stopImmediatePropagation();
        setNodes((n) => n.slice(0, -1));
      }
    };
    window.addEventListener("keydown", on, true);
    return () => window.removeEventListener("keydown", on, true);
  });

  const onDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    const p = pos(e);
    const first = nodes[0];
    if (first && nodes.length >= 3 && Math.hypot(p.x - first.x, p.y - first.y) < 14 / scale) {
      finish(true);
      return;
    }
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // sin captura
    }
    dragging.current = nodes.length;
    setNodes((n) => [...n, { x: p.x, y: p.y }]);
  };

  const onMove = (e: React.PointerEvent) => {
    const p = pos(e);
    setHover(p);
    const i = dragging.current;
    if (i === null) return;
    setNodes((list) =>
      list.map((n, j) => {
        if (j !== i) return n;
        if (Math.hypot(p.x - n.x, p.y - n.y) < 4 / scale) return { x: n.x, y: n.y };
        return { x: n.x, y: n.y, out: p, in: { x: 2 * n.x - p.x, y: 2 * n.y - p.y } };
      }),
    );
  };

  const preview = [...nodes, ...(hover && dragging.current === null && nodes.length ? [{ x: hover.x, y: hover.y }] : [])];
  const d = buildPath(preview, false, 1, 1);

  return (
    <div
      ref={ref}
      style={{ position: "absolute", inset: 0, cursor: "crosshair", zIndex: 5 }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={() => (dragging.current = null)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        finish(false);
      }}
    >
      <svg width={width * scale} height={height * scale} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }}>
        <path d={d} fill="none" stroke="#ff3b47" strokeWidth={3 / scale} />
        {nodes.map((n, i) => (
          <g key={i}>
            {n.in && <line x1={n.in.x} y1={n.in.y} x2={n.out!.x} y2={n.out!.y} stroke="#3ad0ff" strokeWidth={1.5 / scale} />}
            <rect
              x={n.x - 5 / scale}
              y={n.y - 5 / scale}
              width={10 / scale}
              height={10 / scale}
              fill={i === 0 && nodes.length >= 3 ? "#ff3b47" : "#fff"}
              stroke="#ff3b47"
              strokeWidth={2 / scale}
            />
          </g>
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          left: 8,
          top: 8,
          background: "rgba(0,0,0,0.75)",
          padding: "4px 8px",
          borderRadius: 6,
          fontSize: 11,
          pointerEvents: "none",
        }}
      >
        Pluma · clic = punto · arrastrar = curva · Enter = terminar · Esc = cancelar
      </div>
    </div>
  );
};
