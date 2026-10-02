import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { DesignVideo } from "../../src/editor/render/DesignVideo";
import { getAnimState } from "../../src/editor/render/animation";
import { totalFrames } from "../../src/editor/timing";
import { Design, ElementData, FORMAT_SIZE, FPS, VectorNode } from "../../src/editor/types";
import { updateElement } from "../store";
import { InlineText } from "./InlineText";
import { PenLayer } from "./PenLayer";
import { PointEditor } from "./PointEditor";

type Props = {
  design: Design;
  sceneIdx: number;
  sceneStart: number;
  sceneFrame: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
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
  onInlineClose: () => void;
};

type Drag =
  | { kind: "move"; id: string; startX: number; startY: number; orig: ElementData }
  | { kind: "resize"; id: string; dir: string; startX: number; startY: number; orig: ElementData }
  | { kind: "rotate"; id: string; cx: number; cy: number; orig: ElementData };

const SNAP = 10;

export const Stage: React.FC<Props> = (p) => {
  const { width: W, height: H } = FORMAT_SIZE[p.design.format];
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const drag = useRef<Drag | null>(null);
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });

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
    p.onSelect(el.id);
    if (el.locked) return;
    // Editando puntos o texto, la caja no se arrastra.
    if (kind === "move" && (p.editingPointsId === el.id || p.inlineId === el.id)) return;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // El puntero ya no está activo; el arrastre sigue por burbujeo.
    }
    if (kind === "move") {
      drag.current = { kind: "move", id: el.id, startX: e.clientX, startY: e.clientY, orig: el };
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

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
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
      p.preview((des) => updateElement(des, p.sceneIdx, d.id, (el) => ({ ...el, x: Math.round(x), y: Math.round(y) })));
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

  return (
    <div className="stage-wrap" onPointerDown={() => p.onSelect(null)}>
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
              const selected = el.id === p.selectedId;
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
                  {selected && p.editingPointsId !== el.id && p.inlineId !== el.id && (
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
