import React, { useEffect, useMemo, useRef, useState } from "react";
import type { PlayerRef } from "@remotion/player";
import { BRAND, changeFormat, cloneScene, newElement, newScene, uid } from "../../src/editor/factory";
import { normalizeNodes } from "../../src/editor/vector";
import { sceneAtFrame, sceneFrames, sceneStarts, totalFrames } from "../../src/editor/timing";
import { Design, ElementData, ElementType, Format, FORMAT_SIZE, FPS, VectorNode } from "../../src/editor/types";
import { DesignPreview } from "../DesignList";
import { go, LOGO } from "../App";
import type { SaveState } from "../EditorPage";
import { updateElement, updateScene, useDesignStore } from "../store";
import { ExportDialog } from "./ExportDialog";
import { ElementInspector, SceneInspector } from "./Inspector";
import { Asset, LeftPanel } from "./LeftPanel";
import { Stage } from "./Stage";
import { Timeline } from "./Timeline";

type Props = {
  initialName: string;
  initialDesign: Design;
  onChange: (name: string, design: Design) => void;
  saveState: SaveState;
  onRetrySave: () => void;
};

const SAVE_LABEL: Record<SaveState, string> = {
  saved: "Guardado",
  saving: "Guardando…",
  pending: "Guardando…",
  error: "⚠ No se pudo guardar",
};

const fmt = (frames: number) => `${(frames / FPS).toFixed(1)}s`;

export const Editor: React.FC<Props> = ({ initialName, initialDesign, onChange, saveState, onRetrySave }) => {
  const { design, commit, preview, endPreview, undo, redo, canUndo, canRedo } = useDesignStore(initialDesign);
  const [name, setName] = useState(initialName);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [globalFrame, setGlobalFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loopScene, setLoopScene] = useState(true);
  const [tab, setTab] = useState<Parameters<typeof LeftPanel>[0]["tab"]>("texto");
  const [showTimeline, setShowTimeline] = useState(true);
  const [pickingBg, setPickingBg] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [penActive, setPenActive] = useState(false);
  const [editingPointsId, setEditingPointsId] = useState<string | null>(null);
  const [inlineId, setInlineId] = useState<string | null>(null);
  const playerRef = useRef<PlayerRef | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const first = useRef(true);

  // Guardado automático.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    onChange(name, design);
  }, [design, name]);

  const safeIdx = Math.min(sceneIdx, design.scenes.length - 1);
  const scene = design.scenes[safeIdx];
  const starts = useMemo(() => sceneStarts(design), [design]);
  const frames = useMemo(() => sceneFrames(design), [design]);
  const sceneStart = starts[safeIdx];
  const sceneLen = frames[safeIdx];
  const sceneFrame = Math.max(0, Math.min(sceneLen - 1, globalFrame - sceneStart));
  const selected = scene.elements.find((e) => e.id === selectedId) ?? null;

  // Al cambiar de selección se sale de los modos de edición.
  useEffect(() => {
    if (editingPointsId && editingPointsId !== selectedId) setEditingPointsId(null);
    if (inlineId && inlineId !== selectedId) setInlineId(null);
  }, [selectedId]);

  const seekScene = (f: number) => {
    const target = sceneStart + Math.max(0, Math.min(sceneLen - 1, f));
    playerRef.current?.seekTo(target);
    setGlobalFrame(target);
  };

  const selectScene = (i: number, atStart = false) => {
    playerRef.current?.pause();
    setSceneIdx(i);
    setSelectedId(null);
    const target = starts[i] + (atStart ? 0 : Math.min(45, frames[i] - 1));
    playerRef.current?.seekTo(target);
    setGlobalFrame(target);
  };

  // Al abrir, se muestra un momento de la escena en que ya entraron los elementos.
  useEffect(() => {
    selectScene(0);
  }, []);

  // Al reproducir el video completo, la escena activa sigue al cabezal.
  useEffect(() => {
    if (playing && !loopScene) {
      const idx = sceneAtFrame(design, globalFrame);
      if (idx !== safeIdx) setSceneIdx(idx);
    }
  }, [globalFrame, playing, loopScene]);

  const setScene = (fn: Parameters<typeof updateScene>[2]) => commit((d) => updateScene(d, safeIdx, fn));
  const setEl = (id: string, fn: (e: ElementData) => ElementData) => commit((d) => updateElement(d, safeIdx, id, fn));

  const addElement = (type: ElementType, extra?: Parameters<typeof newElement>[3]) => {
    const el = newElement(type, design.format, scene.duration, extra);
    setScene((s) => ({ ...s, elements: [...s.elements, el] }));
    setSelectedId(el.id);
  };

  const removeSelected = () => {
    if (!selected) return;
    setScene((s) => ({ ...s, elements: s.elements.filter((e) => e.id !== selected.id) }));
    setSelectedId(null);
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const copy = { ...structuredClone(selected), id: uid(), x: selected.x + 40, y: selected.y + 40, name: `${selected.name ?? selected.type} (copia)` };
    setScene((s) => ({ ...s, elements: [...s.elements, copy] }));
    setSelectedId(copy.id);
  };

  const moveLayer = (dir: "up" | "down" | "top" | "bottom") => {
    if (!selected) return;
    setScene((s) => {
      const list = [...s.elements];
      const i = list.findIndex((e) => e.id === selected.id);
      const [el] = list.splice(i, 1);
      const to = dir === "up" ? Math.min(list.length, i + 1) : dir === "down" ? Math.max(0, i - 1) : dir === "top" ? list.length : 0;
      list.splice(to, 0, el);
      return { ...s, elements: list };
    });
  };

  const onAsset = (a: Asset) => {
    if (pickingBg) {
      setScene((s) => ({ ...s, background: { ...s.background, kind: "image", image: a.file } }));
      setPickingBg(false);
      return;
    }
    if (a.file === "logo.png") return addElement("logo");
    addElement(a.type, { src: a.file, width: a.width, height: a.height });
  };

  const onColor = (c: string) => {
    if (!selected) return commit((d) => ({ ...d, accent: c }));
    setEl(selected.id, (e) => {
      if (e.type === "text" || e.type === "counter") return { ...e, props: { ...e.props, color: c } } as ElementData;
      if (e.type === "shape") return { ...e, props: { ...e.props, fill: c } };
      return e;
    });
  };

  const onTemplate = (t: Design, mode: "replace" | "append") => {
    const adapted = t.format === design.format ? t : changeFormat(t, design.format);
    if (mode === "replace") {
      commit(adapted);
      selectScene(0);
    } else {
      commit((d) => ({ ...d, scenes: [...d.scenes, ...adapted.scenes] }));
    }
  };

  const onFormat = (f: Format) => commit((d) => changeFormat(d, f));

  const addScene = () => {
    commit((d) => {
      const scenes = [...d.scenes];
      scenes.splice(safeIdx + 1, 0, newScene(`Escena ${d.scenes.length + 1}`));
      return { ...d, scenes };
    });
    setSceneIdx(safeIdx + 1);
    setSelectedId(null);
  };

  const sceneOp = (i: number, op: "dup" | "del" | "left" | "right") => {
    commit((d) => {
      const scenes = [...d.scenes];
      if (op === "dup") scenes.splice(i + 1, 0, cloneScene(scenes[i]));
      if (op === "del" && scenes.length > 1) scenes.splice(i, 1);
      if (op === "left" && i > 0) [scenes[i - 1], scenes[i]] = [scenes[i], scenes[i - 1]];
      if (op === "right" && i < scenes.length - 1) [scenes[i + 1], scenes[i]] = [scenes[i], scenes[i + 1]];
      return { ...d, scenes };
    });
    if (op === "del") setSceneIdx(Math.max(0, i - 1));
    if (op === "left") setSceneIdx(Math.max(0, i - 1));
    if (op === "right") setSceneIdx(Math.min(design.scenes.length - 1, i + 1));
    if (op === "dup") setSceneIdx(i + 1);
    setSelectedId(null);
  };

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (p.isPlaying()) p.pause();
    else p.play();
  };

  // Doble clic: texto y botones se escriben sobre el lienzo; los vectores
  // entran a edición de puntos; el resto enfoca su panel de propiedades.
  const editText = (id: string) => {
    const el = scene.elements.find((x) => x.id === id);
    if (!el || el.locked) return;
    setSelectedId(id);
    playerRef.current?.pause();
    if (el.type === "text" || el.type === "pill") {
      setInlineId(id);
      return;
    }
    if (el.type === "vector") {
      setEditingPointsId(id);
      return;
    }
    setTimeout(() => {
      const target = textRef.current ?? (document.querySelector(".right .group:nth-child(2) input, .right .group:nth-child(2) textarea") as HTMLElement | null);
      target?.focus();
    }, 30);
  };

  const onPenDone = (abs: VectorNode[], closed: boolean) => {
    const { box, nodes } = normalizeNodes(abs);
    const base = newElement("vector", design.format, scene.duration);
    const el: ElementData = {
      ...base,
      ...box,
      name: "Vector",
      enter: { kind: "fade", duration: 0.5 },
      props: {
        nodes,
        closed,
        fill: closed ? BRAND.red : "transparent",
        fill2: "",
        stroke: BRAND.white,
        strokeWidth: closed ? 4 : 12,
        glow: false,
      },
    } as ElementData;
    setScene((s) => ({ ...s, elements: [...s.elements, el] }));
    setSelectedId(el.id);
    setPenActive(false);
  };

  // Tras mover puntos, la caja se ajusta al nuevo contorno.
  const onPointsEnd = () => {
    commit((d) =>
      updateElement(d, safeIdx, editingPointsId ?? "", (el) => {
        if (el.type !== "vector") return el;
        const abs = el.props.nodes.map((n) => {
          const t = (q: { x: number; y: number }) => ({ x: el.x + q.x * el.w, y: el.y + q.y * el.h });
          return { ...t(n), in: n.in && t(n.in), out: n.out && t(n.out) };
        });
        const { box, nodes } = normalizeNodes(abs);
        return { ...el, ...box, props: { ...el.props, nodes } };
      }),
    );
  };

  // Atajos de teclado.
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelected();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selected) {
          e.preventDefault();
          removeSelected();
        }
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "Escape") {
        if (editingPointsId) return setEditingPointsId(null);
        setSelectedId(null);
        setPickingBg(false);
      } else if (selected && e.key.startsWith("Arrow") && !selected.locked) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        setEl(selected.id, (el) => ({ ...el, x: el.x + dx, y: el.y + dy }));
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  });

  const total = totalFrames(design);

  return (
    <div className="editor">
      <header className="topbar">
        <button className="icon-btn" onClick={() => go("/")} title="Mis diseños">
          ←
        </button>
        <img src={LOGO} alt="Bitaxus" onClick={() => go("/")} title="Mis diseños" />
        <span className="divider" />
        <input className="name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nombre del diseño" />
        <span className={`save-dot ${saveState}`} title={SAVE_LABEL[saveState]} />
        <span className="status">{SAVE_LABEL[saveState]}</span>
        {saveState === "error" && (
          <button className="btn small" onClick={onRetrySave}>
            Reintentar
          </button>
        )}
        <div className="spacer" />
        <button className="icon-btn" onClick={undo} disabled={!canUndo} title="Deshacer (Ctrl+Z)">
          ↶
        </button>
        <button className="icon-btn" onClick={redo} disabled={!canRedo} title="Rehacer (Ctrl+Y)">
          ↷
        </button>
        <button className="btn primary" onClick={() => { playerRef.current?.pause(); setExporting(true); }}>
          Exportar MP4
        </button>
      </header>

      <LeftPanel
        tab={tab}
        setTab={setTab}
        onAdd={addElement}
        onTemplate={onTemplate}
        onAsset={onAsset}
        onColor={onColor}
        pickingBackground={pickingBg}
        penActive={penActive}
        onPen={(on) => {
          setPenActive(on);
          if (on) {
            setSelectedId(null);
            playerRef.current?.pause();
          }
        }}
      />

      <Stage
        design={design}
        sceneIdx={safeIdx}
        sceneStart={sceneStart}
        sceneFrame={sceneFrame}
        selectedId={selectedId}
        onSelect={setSelectedId}
        preview={preview}
        endPreview={endPreview}
        playerRef={playerRef}
        onFrame={setGlobalFrame}
        onPlayingChange={setPlaying}
        loopRange={loopScene ? [sceneStart, sceneStart + sceneLen - 1] : null}
        onEditText={editText}
        penActive={penActive}
        onPenDone={onPenDone}
        onPenCancel={() => setPenActive(false)}
        editingPointsId={editingPointsId}
        onPointsEnd={onPointsEnd}
        inlineId={inlineId}
        onInlineCommit={(id, text) => setEl(id, (x) => ({ ...x, props: { ...(x.props as object), text } }) as ElementData)}
        onInlineClose={() => setInlineId(null)}
      />

      <aside className="right">
        {selected ? (
          <ElementInspector
            key={selected.id}
            el={selected}
            sceneDuration={scene.duration}
            onChange={(fn) => setEl(selected.id, fn)}
            onDelete={removeSelected}
            onDuplicate={duplicateSelected}
            onLayer={moveLayer}
            textRef={textRef}
            editingPoints={editingPointsId === selected.id}
            onEditPoints={(on) => setEditingPointsId(on ? selected.id : null)}
          />
        ) : (
          <SceneInspector
            design={design}
            scene={scene}
            onScene={setScene}
            onDesign={commit}
            onFormat={onFormat}
            pickImage={() => {
              setPickingBg(true);
              setTab("assets");
            }}
          />
        )}
      </aside>

      <footer className="bottom">
        <div className="scenes">
          <button className="play-btn" onClick={togglePlay} title={playing ? "Pausa (Espacio)" : "Reproducir (Espacio)"}>
            {playing ? "❚❚" : "▶"}
          </button>
          <div className="time-box">
            <span className="time">{fmt(loopScene ? sceneFrame : globalFrame)}</span>
            <button className={`chip ${loopScene ? "" : "on"}`} onClick={() => setLoopScene(!loopScene)} title="Reproducir solo esta escena o todo el video">
              {loopScene ? "Escena" : "Todo"} · {fmt(loopScene ? sceneLen : total)}
            </button>
          </div>
          {design.scenes.map((s, i) => (
            <div key={s.id} className={`scene-card ${i === safeIdx ? "on" : ""}`} onClick={() => selectScene(i)} title={s.name}>
              <div className="scene-thumb" style={{ aspectRatio: `${FORMAT_SIZE[design.format].width} / ${FORMAT_SIZE[design.format].height}` }}>
                <DesignPreview design={{ ...design, scenes: [{ ...s, transition: "none" }] }} frame={Math.min(45, Math.round(s.duration * FPS) - 1)} />
              </div>
              <span className="scene-label">
                {i + 1} · {s.duration}s
              </span>
              <div className="ops" onClick={(e) => e.stopPropagation()}>
                <button title="Mover a la izquierda" onClick={() => sceneOp(i, "left")} disabled={i === 0}>
                  ‹
                </button>
                <button title="Duplicar escena" onClick={() => sceneOp(i, "dup")}>
                  ⧉
                </button>
                <button
                  title="Eliminar escena"
                  disabled={design.scenes.length === 1}
                  onClick={() => window.confirm(`¿Eliminar la escena "${s.name}"?`) && sceneOp(i, "del")}
                >
                  ✕
                </button>
                <button title="Mover a la derecha" onClick={() => sceneOp(i, "right")} disabled={i === design.scenes.length - 1}>
                  ›
                </button>
              </div>
            </div>
          ))}
          <button className="add-scene" onClick={addScene} title="Agregar escena">
            +
          </button>
          <div className="spacer" />
          <button className={`chip ${showTimeline ? "on" : ""}`} onClick={() => setShowTimeline(!showTimeline)}>
            Línea de tiempo {showTimeline ? "▾" : "▸"}
          </button>
        </div>
        {showTimeline && (
          <Timeline
            design={design}
            sceneIdx={safeIdx}
            sceneFrame={sceneFrame}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onSeek={seekScene}
            preview={preview}
            endPreview={endPreview}
          />
        )}
      </footer>

      {exporting && <ExportDialog design={design} name={name} onClose={() => setExporting(false)} />}
    </div>
  );
};
