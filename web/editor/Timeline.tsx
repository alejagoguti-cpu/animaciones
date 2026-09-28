import React, { useRef } from "react";
import { Design, ElementData, FPS } from "../../src/editor/types";
import { updateElement } from "../store";

type Props = {
  design: Design;
  sceneIdx: number;
  sceneFrame: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSeek: (sceneFrame: number) => void;
  preview: (fn: (d: Design) => Design) => void;
  endPreview: () => void;
};

type Drag = { id: string; mode: "move" | "l" | "r"; startX: number; laneW: number; orig: ElementData };

const round = (n: number) => Math.round(n * 10) / 10;

// Línea de tiempo de la escena: una barra por elemento (cuándo aparece y
// cuándo se va). Se arrastran para mover o se estiran por los bordes.
export const Timeline: React.FC<Props> = (p) => {
  const scene = p.design.scenes[p.sceneIdx];
  const dur = scene.duration;
  const drag = useRef<Drag | null>(null);
  const rulerRef = useRef<HTMLDivElement>(null);

  const pct = (s: number) => `${(s / dur) * 100}%`;

  const seekFromEvent = (e: React.PointerEvent | React.MouseEvent) => {
    const r = rulerRef.current!.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    p.onSeek(Math.min(Math.round(dur * FPS) - 1, Math.round(t * dur * FPS)));
  };

  const onBarDown = (e: React.PointerEvent, el: ElementData, mode: Drag["mode"]) => {
    e.stopPropagation();
    p.onSelect(el.id);
    const lane = (e.currentTarget as HTMLElement).closest(".lane") as HTMLElement;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // El puntero ya no está activo; el arrastre sigue por burbujeo.
    }
    drag.current = { id: el.id, mode, startX: e.clientX, laneW: lane.getBoundingClientRect().width, orig: el };
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const delta = ((e.clientX - d.startX) / d.laneW) * dur;
    const o = d.orig;
    let start = o.start;
    let end = o.end;
    if (d.mode === "move") {
      const len = o.end - o.start;
      start = Math.max(0, Math.min(dur - len, o.start + delta));
      end = start + len;
    } else if (d.mode === "l") {
      start = Math.max(0, Math.min(o.end - 0.2, o.start + delta));
    } else {
      end = Math.min(dur, Math.max(o.start + 0.2, o.end + delta));
    }
    p.preview((des) => updateElement(des, p.sceneIdx, d.id, (el) => ({ ...el, start: round(start), end: round(end) })));
  };

  const onUp = () => {
    if (drag.current) p.endPreview();
    drag.current = null;
  };

  const ticks = [];
  const step = dur > 12 ? 2 : dur > 6 ? 1 : 0.5;
  for (let t = 0; t <= dur + 0.001; t += step) ticks.push(round(t));

  return (
    <div className="timeline" onPointerMove={onMove} onPointerUp={onUp}>
      <div className="ruler" ref={rulerRef} onPointerDown={seekFromEvent}>
        {ticks.map((t) => (
          <div key={t} className="tick" style={{ left: pct(t) }}>
            {t}s
          </div>
        ))}
        <div className="playhead" style={{ left: pct(p.sceneFrame / FPS) }} />
      </div>
      {[...scene.elements].reverse().map((el) => (
        <div key={el.id} className={`track ${el.id === p.selectedId ? "on" : ""}`}>
          <div className="tname" onClick={() => p.onSelect(el.id)} title={el.name ?? el.type}>
            {el.locked ? "🔒 " : ""}
            {el.name ?? el.type}
          </div>
          <div className="lane">
            <div
              className="bar"
              style={{ left: pct(el.start), width: pct(el.end - el.start) }}
              onPointerDown={(e) => onBarDown(e, el, "move")}
            >
              <div className="edge l" onPointerDown={(e) => onBarDown(e, el, "l")} />
              <div className="edge r" onPointerDown={(e) => onBarDown(e, el, "r")} />
            </div>
          </div>
        </div>
      ))}
      {scene.elements.length === 0 && (
        <p className="muted" style={{ marginLeft: 150 }}>
          Esta escena no tiene elementos. Agrega textos, logos o assets desde el panel izquierdo.
        </p>
      )}
    </div>
  );
};
