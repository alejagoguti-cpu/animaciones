import React, { useEffect, useMemo, useRef, useState } from "react";
import type { PlayerRef } from "@remotion/player";
import { BRAND, changeFormat, cloneScene, newElement, newScene, uid } from "../../src/editor/factory";
import { normalizeNodes } from "../../src/editor/vector";
import { sceneAtFrame, sceneFrames, sceneStarts, totalFrames } from "../../src/editor/timing";
import { Design, ElementData, ElementType, Format, FORMAT_SIZE, FPS, VectorNode } from "../../src/editor/types";
import { DesignPreview } from "../DesignList";
import { go, LOGO } from "../App";
import type { SaveState } from "../EditorPage";
import { publicUrl, supabase, UPLOADS_BUCKET } from "../supabase";
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

// Los elementos copiados viajan por el portapapeles del sistema como texto con
// esta marca, así se pueden pegar en otra pestaña, otro diseño u otra ventana.
const CLIP_TAG = "bitaxus-elemento:";

const fmt = (frames: number) => `${(frames / FPS).toFixed(1)}s`;

export const Editor: React.FC<Props> = ({ initialName, initialDesign, onChange, saveState, onRetrySave }) => {
  const { design, commit, preview, endPreview, undo, redo, canUndo, canRedo } = useDesignStore(initialDesign);
  const [name, setName] = useState(initialName);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [selectedId, setSelectedIdRaw] = useState<string | null>(null);
  // Elementos seleccionados además del principal (selección múltiple).
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const setSelectedId = (id: string | null) => {
    setSelectedIdRaw(id);
    setExtraIds([]);
  };
  const setSelection = (ids: string[]) => {
    setSelectedIdRaw(ids[0] ?? null);
    setExtraIds(ids.slice(1));
  };
  const [globalFrame, setGlobalFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loopScene, setLoopScene] = useState(true);
  const [tab, setTab] = useState<Parameters<typeof LeftPanel>[0]["tab"]>("texto");
  const [showTimeline, setShowTimeline] = useState(true);
  const [pickingBg, setPickingBg] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState<{ x: number; y: number; id: string | null } | null>(null);
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
  const selectedEls = scene.elements.filter((e) => e.id === selectedId || extraIds.includes(e.id));
  const selIds = selectedEls.map((e) => e.id);
  // Clic en un elemento: con Shift/Ctrl se suma o se quita de la selección.
  const onSelectEl = (id: string | null, additive = false) => {
    if (id === null) return setSelectedId(null);
    if (additive) return setSelection(selIds.includes(id) ? selIds.filter((x) => x !== id) : [...selIds, id]);
    if (selIds.length > 1 && selIds.includes(id)) return; // se mantiene el grupo para moverlo junto
    setSelectedId(id);
  };
  const clipPayload = () => CLIP_TAG + JSON.stringify(selectedEls.length > 1 ? selectedEls : selected);

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

  // Al duplicar, agregar, mover o borrar escenas, la escena activa cambia: el cabezal
  // se lleva a ella para que el lienzo y el video queden en la misma escena.
  useEffect(() => {
    if (playing) return;
    if (sceneAtFrame(design, globalFrame) === safeIdx) return;
    const target = starts[safeIdx] + Math.min(45, frames[safeIdx] - 1);
    playerRef.current?.seekTo(target);
    setGlobalFrame(target);
  }, [safeIdx, design.scenes.length]);

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
    if (!selectedEls.length) return;
    setScene((s) => ({ ...s, elements: s.elements.filter((e) => !selIds.includes(e.id)) }));
    setSelectedId(null);
  };

  const duplicateSelected = () => {
    if (!selectedEls.length) return;
    const copies = selectedEls.map((el) => ({ ...structuredClone(el), id: uid(), x: el.x + 40, y: el.y + 40, name: `${el.name ?? el.type} (copia)` }));
    setScene((s) => ({ ...s, elements: [...s.elements, ...copies] }));
    setSelection(copies.map((c) => c.id));
  };

  const pasteElements = (srcs: ElementData[], n: number) => {
    const copies = srcs.map(
      (src) =>
        ({
          ...structuredClone(src),
          id: uid(),
          x: src.x + 40 * n,
          y: src.y + 40 * n,
          start: Math.min(src.start, Math.max(0, scene.duration - 0.2)),
          end: Math.min(src.end, scene.duration),
        }) as ElementData,
    );
    setScene((s) => ({ ...s, elements: [...s.elements, ...copies] }));
    setSelection(copies.map((c) => c.id));
  };

  // Imagen del portapapeles (captura, copiada de una web, etc.): se sube a la nube y se agrega.
  const pasteImage = async (file: File) => {
    setToast("Subiendo imagen…");
    try {
      const url = URL.createObjectURL(file);
      const { w, h } = await new Promise<{ w: number; h: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ w: 800, h: 800 });
        img.src = url;
      });
      URL.revokeObjectURL(url);
      const ext = file.type === "image/jpeg" ? ".jpg" : file.type === "image/webp" ? ".webp" : file.type === "image/gif" ? ".gif" : ".png";
      const path = `files/${Date.now()}-pegada__${w}x${h}__${ext}`;
      const { error } = await supabase.storage.from(UPLOADS_BUCKET).upload(path, file, { contentType: file.type || "image/png" });
      if (error) throw error;
      const src = publicUrl(path);
      if (pickingBg) {
        setScene((s) => ({ ...s, background: { ...s.background, kind: "image", image: src } }));
        setPickingBg(false);
      } else {
        addElement("image", { src, width: w, height: h });
      }
      setToast("");
    } catch (e) {
      setToast(`No se pudo pegar la imagen: ${e instanceof Error ? e.message : String(e)}`);
      window.setTimeout(() => setToast(""), 4000);
    }
  };

  const pasteText = (raw: string) => {
    if (raw.startsWith(CLIP_TAG)) {
      try {
        const parsed = JSON.parse(raw.slice(CLIP_TAG.length)) as ElementData | ElementData[];
        const srcs = (Array.isArray(parsed) ? parsed : [parsed]).filter((x) => x && typeof x === "object" && "type" in x);
        if (srcs.length) {
          // Si se pega varias veces en el mismo lugar, cada copia se desplaza un poco más.
          const first = srcs[0];
          const same = scene.elements.filter((e) => e.type === first.type && e.x >= first.x && e.y >= first.y && e.x - first.x === e.y - first.y).length;
          return pasteElements(srcs, Math.min(same + 1, 8));
        }
      } catch {
        /* no era un elemento: se trata como texto */
      }
    }
    const text = raw.trim();
    if (!text) return;
    const el = newElement("text", design.format, scene.duration, { textKind: "subtitulo" });
    if (el.type === "text") el.props.text = text.slice(0, 400);
    setScene((s) => ({ ...s, elements: [...s.elements, el] }));
    setSelectedId(el.id);
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
    if (el.type === "text" || el.type === "pill" || el.type === "card") {
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
      } else if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault(); // se guarda solo
      } else if (mod && (e.key === "]" || e.key === "[")) {
        e.preventDefault();
        moveLayer(e.key === "]" ? (e.shiftKey ? "top" : "up") : e.shiftKey ? "bottom" : "down");
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        seekScene(e.key === "Home" ? 0 : sceneLen - 1);
      } else if (e.key === "Tab" && t === document.body && scene.elements.length) {
        e.preventDefault();
        const list = scene.elements;
        const i = list.findIndex((x) => x.id === selectedId);
        setSelectedId(list[(i + (e.shiftKey ? -1 : 1) + list.length) % list.length].id);
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelected();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedEls.length) {
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
      } else if (mod && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelection(scene.elements.map((x) => x.id));
      } else if (selectedEls.length && e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        commit((d) => selectedEls.filter((x) => !x.locked).reduce((acc, x) => updateElement(acc, safeIdx, x.id, (el) => ({ ...el, x: el.x + dx, y: el.y + dy })), d));
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  });

  // Copiar, cortar y pegar con el portapapeles del sistema (funciona entre pestañas).
  useEffect(() => {
    const editable = (t: EventTarget | null) => !!(t as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable]");
    const onCopy = (e: ClipboardEvent, cut: boolean) => {
      if (editable(e.target) || !selected) return;
      e.clipboardData?.setData("text/plain", clipPayload());
      e.preventDefault();
      if (cut) removeSelected();
    };
    const copy = (e: ClipboardEvent) => onCopy(e, false);
    const cut = (e: ClipboardEvent) => onCopy(e, true);
    const paste = (e: ClipboardEvent) => {
      if (editable(e.target)) return;
      const img = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
      if (img) {
        e.preventDefault();
        pasteImage(img);
        return;
      }
      const raw = e.clipboardData?.getData("text/plain") ?? "";
      if (!raw) return;
      e.preventDefault();
      pasteText(raw);
    };
    document.addEventListener("copy", copy);
    document.addEventListener("cut", cut);
    document.addEventListener("paste", paste);
    return () => {
      document.removeEventListener("copy", copy);
      document.removeEventListener("cut", cut);
      document.removeEventListener("paste", paste);
    };
  });

  const selIdsRef = useRef<string[]>([]);
  selIdsRef.current = selIds;

  // Menú de clic derecho sobre el lienzo.
  useEffect(() => {
    const on = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      if (!t.closest(".stage-wrap")) return;
      e.preventDefault();
      const id = t.closest<HTMLElement>("[data-el]")?.dataset.el ?? null;
      if (!(id && selIdsRef.current.includes(id))) setSelectedId(id);
      setMenu({ x: Math.min(e.clientX, window.innerWidth - 200), y: Math.min(e.clientY, window.innerHeight - 330), id });
    };
    const close = () => setMenu(null);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    document.addEventListener("contextmenu", on);
    window.addEventListener("pointerdown", close);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("contextmenu", on);
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", key);
    };
  }, []);

  const menuCopy = async (cut: boolean) => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(clipPayload());
      if (cut) removeSelected();
    } catch {
      setToast("El navegador no dejó copiar. Usa Ctrl+C.");
      window.setTimeout(() => setToast(""), 3000);
    }
  };

  const menuPaste = async () => {
    try {
      for (const item of await navigator.clipboard.read()) {
        const type = item.types.find((t) => t.startsWith("image/"));
        if (type) return pasteImage(new File([await item.getType(type)], "image", { type }));
      }
      const raw = await navigator.clipboard.readText();
      if (raw) pasteText(raw);
    } catch {
      setToast("El navegador no dejó pegar desde el menú. Usa Ctrl+V.");
      window.setTimeout(() => setToast(""), 3000);
    }
  };

  const total = totalFrames(design);

  return (
    <div className="editor">
      {menu && (
        <div
          className="ctx-menu"
          style={{ left: menu.x, top: menu.y }}
          onPointerDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {menu.id && selected && (
            <>
              <button onClick={() => { menuCopy(false); setMenu(null); }}>Copiar <kbd>Ctrl+C</kbd></button>
              <button onClick={() => { menuCopy(true); setMenu(null); }}>Cortar <kbd>Ctrl+X</kbd></button>
            </>
          )}
          <button onClick={() => { menuPaste(); setMenu(null); }}>Pegar <kbd>Ctrl+V</kbd></button>
          {menu.id && selected && (
            <>
              <button onClick={() => { duplicateSelected(); setMenu(null); }}>Duplicar <kbd>Ctrl+D</kbd></button>
              <hr />
              <button onClick={() => { moveLayer("top"); setMenu(null); }}>Traer al frente</button>
              <button onClick={() => { moveLayer("up"); setMenu(null); }}>Subir una capa</button>
              <button onClick={() => { moveLayer("down"); setMenu(null); }}>Bajar una capa</button>
              <button onClick={() => { moveLayer("bottom"); setMenu(null); }}>Enviar al fondo</button>
              <hr />
              <button className="danger" onClick={() => { removeSelected(); setMenu(null); }}>Eliminar <kbd>Supr</kbd></button>
            </>
          )}
        </div>
      )}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 50, background: "#1b1c1c", border: "1px solid #3a3a40", borderRadius: 10, padding: "10px 16px", fontSize: 14 }}>
          {toast}
        </div>
      )}
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
        selectedIds={selIds}
        onSelect={onSelectEl}
        onSelectMany={setSelection}
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
        onInlineCardCommit={(id, props) => setEl(id, (x) => (x.type === "card" ? { ...x, props: { ...x.props, ...props } } : x))}
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

      {exporting && <ExportDialog design={design} name={name} frame={globalFrame} onClose={() => setExporting(false)} />}
    </div>
  );
};
