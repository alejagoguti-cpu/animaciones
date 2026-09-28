import React, { useEffect, useMemo, useRef, useState } from "react";
import type { PlayerRef } from "@remotion/player";
import { changeFormat, cloneScene, newElement, newScene, uid } from "../../src/editor/factory";
import { sceneAtFrame, sceneFrames, sceneStarts, totalFrames } from "../../src/editor/timing";
import { Design, ElementData, ElementType, Format, FPS } from "../../src/editor/types";
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
  saved: "✓ Guardado en la nube",
  saving: "Guardando…",
  pending: "Cambios sin guardar…",
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
  const [tab, setTab] = useState<Parameters<typeof LeftPanel>[0]["tab"]>("plantillas");
  const [pickingBg, setPickingBg] = useState(false);
  const [exporting, setExporting] = useState(false);
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

  const seekScene = (f: number) => {
    const target = sceneStart + Math.max(0, Math.min(sceneLen - 1, f));
    playerRef.current?.seekTo(target);
    setGlobalFrame(target);
  };

  const selectScene = (i: number) => {
    playerRef.current?.pause();
    setSceneIdx(i);
    setSelectedId(null);
    const target = starts[i] + Math.min(45, frames[i] - 1);
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

  const editText = (id: string) => {
    setSelectedId(id);
    setTimeout(() => textRef.current?.focus(), 30);
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
        <img src={LOGO} alt="Bitaxus" onClick={() => go("/")} title="Mis diseños" />
        <button className="btn ghost small" onClick={() => go("/")}>
          ← Mis diseños
        </button>
        <input className="name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nombre del diseño" />
        <button className="btn ghost small" onClick={undo} disabled={!canUndo} title="Deshacer (Ctrl+Z)">
          ↶
        </button>
        <button className="btn ghost small" onClick={redo} disabled={!canRedo} title="Rehacer (Ctrl+Y)">
          ↷
        </button>
        <div className="spacer" />
        <span className="status">
          {SAVE_LABEL[saveState]}
          {saveState === "error" && (
            <button className="btn small" style={{ marginLeft: 6 }} onClick={onRetrySave}>
              Reintentar
            </button>
          )}
        </span>
        <button className="btn primary" onClick={() => { playerRef.current?.pause(); setExporting(true); }}>
          ⬇ Exportar MP4
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
        <div className="transport">
          <button className="btn small" onClick={togglePlay} title="Espacio">
            {playing ? "❚❚ Pausa" : "▶ Reproducir"}
          </button>
          <button className="btn small ghost" onClick={() => seekScene(0)} title="Ir al inicio de la escena">
            ⏮
          </button>
          <span className="time">
            {fmt(sceneFrame)} / {fmt(sceneLen)} · total {fmt(total)}
          </span>
          <label className="check" style={{ margin: 0 }}>
            <input type="checkbox" checked={loopScene} onChange={(e) => setLoopScene(e.target.checked)} />
            Solo esta escena
          </label>
        </div>
        <div className="scenes">
          {design.scenes.map((s, i) => (
            <div key={s.id} className={`scene-card ${i === safeIdx ? "on" : ""}`} onClick={() => selectScene(i)}>
              <b>
                {i + 1}. {s.name}
              </b>
              <span>
                {s.duration}s · {s.elements.length} elementos
              </span>
              <div className="ops" onClick={(e) => e.stopPropagation()}>
                <button className="btn small ghost" title="Mover a la izquierda" onClick={() => sceneOp(i, "left")} disabled={i === 0}>
                  ←
                </button>
                <button className="btn small ghost" title="Mover a la derecha" onClick={() => sceneOp(i, "right")} disabled={i === design.scenes.length - 1}>
                  →
                </button>
                <button className="btn small ghost" title="Duplicar escena" onClick={() => sceneOp(i, "dup")}>
                  ⧉
                </button>
                <button
                  className="btn small ghost danger"
                  title="Eliminar escena"
                  disabled={design.scenes.length === 1}
                  onClick={() => window.confirm(`¿Eliminar la escena "${s.name}"?`) && sceneOp(i, "del")}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <button className="add-scene" onClick={addScene}>
            + Escena
          </button>
        </div>
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
      </footer>

      {exporting && <ExportDialog design={design} name={name} onClose={() => setExporting(false)} />}
    </div>
  );
};
