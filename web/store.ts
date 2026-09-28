import { useCallback, useMemo, useRef, useState } from "react";
import { Design, ElementData, Scene } from "../src/editor/types";

// Estado del editor con deshacer/rehacer. Las ediciones continuas (arrastrar,
// escribir) usan `preview` y se confirman una sola vez en el historial.
export const useDesignStore = (initial: Design) => {
  const [design, setDesign] = useState<Design>(initial);
  const past = useRef<Design[]>([]);
  const future = useRef<Design[]>([]);
  const pending = useRef<Design | null>(null);
  const [, force] = useState(0);

  const commit = useCallback((next: Design | ((d: Design) => Design)) => {
    setDesign((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      past.current.push(pending.current ?? prev);
      if (past.current.length > 80) past.current.shift();
      pending.current = null;
      future.current = [];
      return value;
    });
    force((n) => n + 1);
  }, []);

  // Cambio sin guardar en el historial (durante un arrastre).
  const preview = useCallback((next: (d: Design) => Design) => {
    setDesign((prev) => {
      if (!pending.current) pending.current = prev;
      return next(prev);
    });
  }, []);

  // Cierra un arrastre: deja una sola entrada en el historial.
  const endPreview = useCallback(() => {
    if (!pending.current) return;
    past.current.push(pending.current);
    pending.current = null;
    future.current = [];
    force((n) => n + 1);
  }, []);

  const undo = useCallback(() => {
    setDesign((prev) => {
      const last = past.current.pop();
      if (!last) return prev;
      future.current.push(prev);
      return last;
    });
    force((n) => n + 1);
  }, []);

  const redo = useCallback(() => {
    setDesign((prev) => {
      const next = future.current.pop();
      if (!next) return prev;
      past.current.push(prev);
      return next;
    });
    force((n) => n + 1);
  }, []);

  return {
    design,
    commit,
    preview,
    endPreview,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
};

// Ayudantes inmutables.
export const updateScene = (d: Design, sceneIdx: number, fn: (s: Scene) => Scene): Design => ({
  ...d,
  scenes: d.scenes.map((s, i) => (i === sceneIdx ? fn(s) : s)),
});

export const updateElement = (
  d: Design,
  sceneIdx: number,
  id: string,
  fn: (e: ElementData) => ElementData,
): Design => updateScene(d, sceneIdx, (s) => ({ ...s, elements: s.elements.map((e) => (e.id === id ? fn(e) : e)) }));

export const useLatest = <T,>(value: T) => {
  const ref = useRef(value);
  ref.current = value;
  return useMemo(() => ref, []);
};
