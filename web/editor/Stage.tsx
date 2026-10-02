import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { DesignVideo } from "../../src/editor/render/DesignVideo";
import { getAnimState } from "../../src/editor/render/animation";
import { totalFrames } from "../../src/editor/timing";
import { Design, ElementData, FORMAT_SIZE, FPS, VectorNode } from "../../src/editor/types";
import { updateElement, updateScene } from "../store";
import { InlineCard, InlineText } from "./InlineText";
import { anchorsOf } from "../../src/editor/render/glowStyles";
import { PenLayer } from "./PenLayer";
import { PointEditor } from "./PointEditor";

type Props = {
  design: Design;
  sceneIdx: number;
  sceneStart: number;
  sceneFrame: number;
  selectedId: string | null;
  selectedIds: string[];
  onSelect: (id: string | null, additive?: boolean) => void;
  onSelectMany: (ids: string[]) => void;
  preview: (fn: (d: Design) => Design) => void;
  endPreview: () => void;
  playerRef: React.RefObject<PlayerRef | null>;
  onFrame: (globalFrame: number) => void;
  onPlayingChange: (playing: boolean) => void;
  loopRange: [number, number] | null;
  onEditText: (id: string) => void;
  penActive: boolean;
  onPenDone: (nodes: VectorNode[], closed: boolean) => void;
  onPenCancel: () => void;
  editingPointsId: string | null;
  onPointsEnd: () => void;
  inlineId: string | null;
  onInlineCommit: (id: string, text: string) => void;
  onInlineCardCommit: (id: string, props: { icon: string; title: string; text: string }) => void;
  onInlineClose: () => void;
};

type Drag =
  | { kind: "move"; id: string; startX: number; startY: number; orig: ElementData; group: ElementData[] }
  | { kind: "resize"; id: string; dir: string; startX: number; startY: number; orig: ElementData }
  | { kind: "rotate"; id: string; cx: number; cy: number; orig: ElementData }
  | { kind: "glow"; index: number }
  | { kind: "gresize"; dir: string; startX: number; startY: number; box: Box; group: ElementData[] };

type Box = { x: number; y: number; w: number; h: number };

const SNAP = 10;

export const Stage: React.FC<Props> = (p) => {
  const { width: W, height: H } = FORMAT_SIZE[p.design.format];
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const drag = useRef<Drag | null>(null);
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });
  // Selección por recuadro: arrastrar sobre una zona vacía.
  const marqueeRef = useRef<{ x0: number; y0: number; additive: boolean; moved: boolean } | null>(null);
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setScale(Math.max(0.05, Math.min(r.width / W, r.height / H)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [W, H]);

  useEffect(() => {
    const player = p.playerRef.current;
    if (!player) return;
    const onFrame = (e: { detail: { frame: number } }) => p.onFrame(e.detail.frame);
    const onPlay = () => p.onPlayingChange(true);
    const onPause = () => p.onPlayingChange(false);
    player.addEventListener("frameupdate", onFrame);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    return () => {
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
  });

  const scene = p.design.scenes[p.sceneIdx];
  const total = totalFrames(p.design);

  // Mientras se escribe sobre el lienzo, el texto del video se oculta para no verlo doble.
  const shown = useMemo(
    () =>
      p.inlineId
        ? updateElement(p.design, p.sceneIdx, p.inlineId, (e) => ({ ...e, opacity: 0 }))
        : p.design,
    [p.design, p.inlineId, p.sceneIdx],
  );

  const onPointerDown = (e: React.PointerEvent, el: ElementData, kind: "move" | "rotate" | string) => {
    e.stopPropagation();
    const additive = kind === "move" && (e.shiftKey || e.ctrlKey || e.metaKey);
    p.onSelect(el.id, additive);
    if (additive || el.locked) return;
    // Editando puntos o texto, la caja no se arrastra.
    if (kind === "move" && (p.editingPointsId === el.id || p.inlineId === el.id)) return;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // El puntero ya no está activo; el arrastre sigue por burbujeo.
    }
    if (kind === "move") {
      const inGroup = p.selectedIds.length > 1 && p.selectedIds.includes(el.id);
      const group = inGroup ? scene.elements.filter((x) => p.selectedIds.includes(x.id) && !x.locked) : [el];
      drag.current = { kind: "move", id: el.id, startX: e.clientX, startY: e.clientY, orig: el, group };
    } else if (kind === "rotate") {
      const r = innerRef.current!.getBoundingClientRect();
      drag.current = {
        kind: "rotate",
        id: el.id,
        cx: r.left + (el.x + el.w / 2) * scale,
        cy: r.top + (el.y + el.h / 2) * scale,
        orig: el,
      };
    } else {
      drag.current = { kind: "resize", id: el.id, dir: kind, startX: e.clientX, startY: e.clientY, orig: el };
    }
  };

  // Caja que envuelve a todos los elementos seleccionados (para estirarlos juntos).
  const groupEls = p.selectedIds.length > 1 ? scene.elements.filter((x) => p.selectedIds.includes(x.id) && !x.locked) : [];
  const groupBox: Box | null = groupEls.length > 1
    ? (() => {
        const x0 = Math.min(...groupEls.map((x) => x.x));
        const y0 = Math.min(...groupEls.map((x) => x.y));
        const x1 = Math.max(...groupEls.map((x) => x.x + x.w));
        const y1 = Math.max(...groupEls.map((x) => x.y + x.h));
        return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
      })()
    : null;

  const onGroupDown = (e: React.PointerEvent, dir: string) => {
    e.stopPropagation();
    if (!groupBox) return;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // sin captura el arrastre sigue por burbujeo
    }
    drag.current = { kind: "gresize", dir, startX: e.clientX, startY: e.clientY, box: groupBox, group: groupEls };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (d.kind === "glow") {
      const r = innerRef.current!.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      const y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
      p.preview((des) =>
        updateScene(des, p.sceneIdx, (s) => {
          const pts = anchorsOf(s.background.glowStyle ?? "orbes", s.background.glowPoints).map((q) => ({ ...q }));
          pts[d.index] = { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 };
          return { ...s, background: { ...s.background, glowPoints: pts } };
        }),
      );
      return;
    }
    if (d.kind === "gresize") {
      const b = d.box;
      const dx = (e.clientX - d.startX) / scale;
      const dy = (e.clientY - d.startY) / scale;
      let { x, y, w, h } = b;
      if (d.dir.includes("e")) w = b.w + dx;
      if (d.dir.includes("w")) {
        w = b.w - dx;
        x = b.x + dx;
      }
      if (d.dir.includes("s")) h = b.h + dy;
      if (d.dir.includes("n")) {
        h = b.h - dy;
        y = b.y + dy;
      }
      // Con Shift se conserva la proporción del grupo.
      if (e.shiftKey) {
        h = w * (b.h / b.w);
        if (d.dir.includes("n")) y = b.y + b.h - h;
      }
      w = Math.max(20, w);
      h = Math.max(20, h);
      const sx = w / b.w;
      const sy = h / b.h;
      p.preview((des) =>
        d.group.reduce(
          (acc, g) =>
            updateElement(acc, p.sceneIdx, g.id, (el) => {
              const next = {
                ...el,
                x: Math.round(x + (g.x - b.x) * sx),
                y: Math.round(y + (g.y - b.y) * sy),
                w: Math.max(4, Math.round(g.w * sx)),
                h: Math.max(4, Math.round(g.h * sy)),
              } as ElementData;
              // El tamaño de letra de textos, botones y contadores crece con el grupo.
              const gp = g.props as { size?: number };
              if (typeof gp.size === "number" && (g.type === "text" || g.type === "pill" || g.type === "counter")) {
                next.props = { ...(next.props as object), size: Math.max(8, Math.round(gp.size * ((sx + sy) / 2))) } as never;
              }
              return next;
            }),
          des,
        ),
      );
      return;
    }
    const o = d.orig;

    if (d.kind === "move") {
      let x = o.x + (e.clientX - d.startX) / scale;
      let y = o.y + (e.clientY - d.startY) / scale;
      const v: number[] = [];
      const h: number[] = [];
      if (!e.altKey) {
        // Imanes: bordes y centro del lienzo.
        const xs = [0, W / 2, W];
        const ys = [0, H / 2, H];
        for (const target of xs) {
          for (const [edge, off] of [[x, 0], [x + o.w / 2, o.w / 2], [x + o.w, o.w]] as const) {
            if (Math.abs(edge - target) < SNAP / scale) {
              x = target - off;
              v.push(target);
            }
          }
        }
        for (const target of ys) {
          for (const [edge, off] of [[y, 0], [y + o.h / 2, o.h / 2], [y + o.h, o.h]] as const) {
            if (Math.abs(edge - target) < SNAP / scale) {
              y = target - off;
              h.push(target);
            }
          }
        }
      }
      setGuides({ v, h });
      const dx = x - o.x;
      const dy = y - o.y;
      p.preview((des) =>
        d.group.reduce(
          (acc, g) => updateElement(acc, p.sceneIdx, g.id, (el) => ({ ...el, x: Math.round(g.x + dx), y: Math.round(g.y + dy) })),
          des,
        ),
      );
    } else if (d.kind === "resize") {
      const dx = (e.clientX - d.startX) / scale;
      const dy = (e.clientY - d.startY) / scale;
      let { x, y, w, h } = o;
      const keepRatio = e.shiftKey || ["image", "video", "logo", "phone"].includes(o.type);
      if (d.dir.includes("e")) w = o.w + dx;
      if (d.dir.includes("w")) {
        w = o.w - dx;
        x = o.x + dx;
      }
      if (d.dir.includes("s")) h = o.h + dy;
      if (d.dir.includes("n")) {
        h = o.h - dy;
        y = o.y + dy;
      }
      if (keepRatio && d.dir.length === 2) {
        const ratio = o.w / o.h;
        h = w / ratio;
        if (d.dir.includes("n")) y = o.y + o.h - h;
      }
      w = Math.max(20, w);
      h = Math.max(20, h);
      p.preview((des) =>
        updateElement(des, p.sceneIdx, d.id, (el) => {
          const next = { ...el, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) } as ElementData;
          // Al estirar desde una esquina, el texto crece con la caja.
          if (next.type === "text" && d.dir.length === 2 && o.type === "text") {
            next.props = { ...next.props, size: Math.max(8, Math.round(o.props.size * (w / o.w))) };
          }
          return next;
        }),
      );
    } else {
      const angle = (Math.atan2(e.clientY - d.cy, e.clientX - d.cx) * 180) / Math.PI + 90;
      const snapped = e.shiftKey ? Math.round(angle / 15) * 15 : Math.round(angle);
      p.preview((des) => updateElement(des, p.sceneIdx, d.id, (el) => ({ ...el, rotation: snapped })));
    }
  };

  const onPointerUp = () => {
    if (drag.current) p.endPreview();
    drag.current = null;
    setGuides({ v: [], h: [] });
  };

  const toDesign = (e: React.PointerEvent) => {
    const r = innerRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
  };

  const onWrapDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || p.penActive) return;
    const { x, y } = toDesign(e);
    marqueeRef.current = { x0: x, y0: y, additive: e.shiftKey || e.ctrlKey || e.metaKey, moved: false };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // sin captura el recuadro igual funciona dentro del área
    }
  };

  const onWrapMove = (e: React.PointerEvent) => {
    const m = marqueeRef.current;
    if (!m) return;
    const { x, y } = toDesign(e);
    if (!m.moved && Math.hypot(x - m.x0, y - m.y0) * scale < 4) return;
    m.moved = true;
    setMarquee({ x: Math.min(x, m.x0), y: Math.min(y, m.y0), w: Math.abs(x - m.x0), h: Math.abs(y - m.y0) });
  };

  const onWrapUp = () => {
    const m = marqueeRef.current;
    marqueeRef.current = null;
    if (!m) return;
    if (!m.moved || !marquee) {
      if (!m.additive) p.onSelect(null);
      setMarquee(null);
      return;
    }
    const hit = scene.elements
      .filter((el) => el.x < marquee.x + marquee.w && el.x + el.w > marquee.x && el.y < marquee.y + marquee.h && el.y + el.h > marquee.y)
      .map((el) => el.id);
    p.onSelectMany(m.additive ? Array.from(new Set([...p.selectedIds, ...hit])) : hit);
    setMarquee(null);
  };

  return (
    <div
      className="stage-wrap"
      onPointerDown={onWrapDown}
      onPointerMove={onWrapMove}
      onPointerUp={onWrapUp}
    >
      <div className="stage" ref={wrapRef}>
        <div
          className="stage-inner"
          ref={innerRef}
          style={{ width: W * scale, height: H * scale }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <Player
            ref={p.playerRef}
            component={DesignVideo}
            inputProps={{ design: shown }}
            compositionWidth={W}
            compositionHeight={H}
            durationInFrames={total}
            fps={FPS}
            style={{ width: W * scale, height: H * scale }}
            inFrame={p.loopRange?.[0] ?? null}
            outFrame={p.loopRange?.[1] ?? null}
            loop
            acknowledgeRemotionLicense
          />
          <div className="overlay">
            {scene.elements.map((el) => {
              const visible = getAnimState(el, p.sceneFrame).visible;
              const selected = p.selectedIds.includes(el.id);
              const single = p.selectedIds.length === 1;
              return (
                <div
                  key={el.id}
                  data-el={el.id}
                  className={`el-box ${selected ? "selected" : ""} ${visible ? "" : "hidden-now"} ${el.locked ? "locked" : ""}`}
                  style={{
                    left: el.x * scale,
                    top: el.y * scale,
                    width: el.w * scale,
                    height: el.h * scale,
                    transform: `rotate(${el.rotation}deg)`,
                  }}
                  onPointerDown={(e) => onPointerDown(e, el, "move")}
                  onDoubleClick={() => p.onEditText(el.id)}
                >
                  {selected && p.inlineId === el.id && (el.type === "text" || el.type === "pill") && (
                    <InlineText
                      el={el}
                      scale={scale}
                      onCommit={(text) => p.onInlineCommit(el.id, text)}
                      onClose={p.onInlineClose}
                    />
                  )}
                  {selected && p.inlineId === el.id && el.type === "card" && (
                    <InlineCard el={el} scale={scale} onCommit={(props) => p.onInlineCardCommit(el.id, props)} onClose={p.onInlineClose} />
                  )}
                  {selected && p.editingPointsId === el.id && el.type === "vector" && (
                    <PointEditor
                      el={el}
                      scale={scale}
                      onNodes={(nodes) =>
                        p.preview((des) =>
                          updateElement(des, p.sceneIdx, el.id, (x) => (x.type === "vector" ? { ...x, props: { ...x.props, nodes } } : x)),
                        )
                      }
                      onEnd={() => {
                        p.endPreview();
                        p.onPointsEnd();
                      }}
                    />
                  )}
                  {selected && single && p.editingPointsId !== el.id && p.inlineId !== el.id && (
                    <>
                      <span className="el-label">{el.name ?? el.type}</span>
                      {!el.locked &&
                        ["nw", "ne", "sw", "se", "e", "w", "rot"].map((dir) => (
                          <div
                            key={dir}
                            className={`handle ${dir}`}
                            onPointerDown={(e) => onPointerDown(e, el, dir === "rot" ? "rotate" : dir)}
                          />
                        ))}
                    </>
                  )}
                </div>
              );
            })}
            {groupBox && (
              <div
                className="group-box"
                style={{ left: groupBox.x * scale, top: groupBox.y * scale, width: groupBox.w * scale, height: groupBox.h * scale }}
              >
                <span className="el-label">{groupEls.length} elementos</span>
                {["nw", "ne", "sw", "se", "e", "w"].map((dir) => (
                  <div key={dir} className={`handle ${dir}`} onPointerDown={(e) => onGroupDown(e, dir)} />
                ))}
              </div>
            )}
            {scene.background.kind === "glow" && p.selectedIds.length === 0 && !p.penActive &&
              anchorsOf(scene.background.glowStyle ?? "orbes", scene.background.glowPoints).map((q, i) => (
                <div
                  key={`glow${i}`}
                  className="glow-handle"
                  title="Arrastra para mover la luz"
                  style={{ left: q.x * W * scale, top: q.y * H * scale }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    try {
                      (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    } catch {
                      // el arrastre sigue por burbujeo
                    }
                    drag.current = { kind: "glow", index: i };
                  }}
                />
              ))}
            {marquee && <div className="marquee" style={{ left: marquee.x * scale, top: marquee.y * scale, width: marquee.w * scale, height: marquee.h * scale }} />}
            {p.penActive && (
              <PenLayer scale={scale} width={W} height={H} onDone={p.onPenDone} onCancel={p.onPenCancel} />
            )}
            {guides.v.map((x, i) => (
              <div key={`v${i}`} className="snap-guide" style={{ left: x * scale, top: 0, width: 1, height: "100%" }} />
            ))}
            {guides.h.map((y, i) => (
              <div key={`h${i}`} className="snap-guide" style={{ top: y * scale, left: 0, height: 1, width: "100%" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
