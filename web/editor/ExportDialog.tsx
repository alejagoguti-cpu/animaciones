import React, { useEffect, useRef, useState } from "react";
import { canRenderMediaOnWeb, renderMediaOnWeb } from "@remotion/web-renderer";
import { DesignVideo } from "../../src/editor/render/DesignVideo";
import { totalFrames } from "../../src/editor/timing";
import { Design, FORMAT_SIZE, FPS } from "../../src/editor/types";

// Calidades de exportación: el diseño siempre se dibuja a su tamaño base y se
// escala, así que el 4K sale nítido (no es un estirado).
const QUALITIES = [
  { id: "hd", label: "HD · 1080p", scale: 1 },
  { id: "2k", label: "2K · 1440p", scale: 4 / 3 },
  { id: "4k", label: "4K · 2160p", scale: 2 },
] as const;

// Exporta el MP4 directamente en el navegador (sin servidor).
export const ExportDialog: React.FC<{ design: Design; name: string; onClose: () => void }> = ({ design, name, onClose }) => {
  const [state, setState] = useState<"idle" | "checking" | "rendering" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);
  const [quality, setQuality] = useState<(typeof QUALITIES)[number]["id"]>("4k");
  const scale = QUALITIES.find((q) => q.id === quality)!.scale;
  const { width: baseW, height: baseH } = FORMAT_SIZE[design.format];
  const width = Math.round(baseW * scale / 2) * 2;
  const height = Math.round(baseH * scale / 2) * 2;
  const frames = totalFrames(design);
  const fileName = `${name.trim().replace(/[^\wÀ-ſ -]+/g, "").replace(/\s+/g, "-") || "bitaxus"}.mp4`;

  useEffect(() => () => {
    abort.current?.abort();
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  const composition = {
    component: DesignVideo,
    id: "diseno",
    width: baseW,
    height: baseH,
    fps: FPS,
    durationInFrames: frames,
    defaultProps: { design },
  };

  const start = async () => {
    setError("");
    setState("checking");
    try {
      const check = await canRenderMediaOnWeb({ width, height, container: "mp4", videoBitrate: "very-high" });
      if (!check.canRender) {
        setState("error");
        setError(
          `Este navegador no puede exportar el video: ${check.issues.map((i) => i.message).join(" ")} Prueba con Chrome o Edge actualizados.`,
        );
        return;
      }
      setState("rendering");
      abort.current = new AbortController();
      const result = await renderMediaOnWeb({
        composition,
        inputProps: { design },
        container: "mp4",
        scale,
        videoBitrate: "very-high",
        signal: abort.current.signal,
        onProgress: (p) => setProgress(p.progress),
      });
      const blob = await result.getBlob();
      setUrl(URL.createObjectURL(blob));
      setState("done");
    } catch (e) {
      if (abort.current?.signal.aborted) return;
      setState("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="modal-back" onClick={() => state !== "rendering" && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="display">Exportar video</h2>
        <p className="muted" style={{ margin: 0 }}>
          MP4 · {width}×{height} · {(frames / FPS).toFixed(1)} s. Se genera aquí mismo en tu navegador. El 4K tarda más y usa más memoria; si falla, prueba con 2K. Deja esta pestaña abierta y a la vista mientras tanto: si cambias de pestaña o minimizas, el navegador lo pausa.
        </p>
        <div style={{ display: "flex", gap: 6 }}>
          {QUALITIES.map((q) => (
            <button key={q.id} className={`chip ${quality === q.id ? "on" : ""}`} disabled={state === "rendering" || state === "checking"} onClick={() => { setQuality(q.id); setState("idle"); setUrl(null); }}>
              {q.label}
            </button>
          ))}
        </div>
        {(state === "rendering" || state === "checking") && (
          <>
            <div className="progress">
              <div style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <span className="muted">{state === "checking" ? "Preparando…" : `${Math.round(progress * 100)}%`}</span>
          </>
        )}
        {state === "error" && <p className="error">{error}</p>}
        {state === "done" && url && (
          <video src={url} controls style={{ width: "100%", maxHeight: 320, background: "#000", borderRadius: 10 }} />
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {state === "rendering" ? (
            <button className="btn" onClick={() => { abort.current?.abort(); setState("idle"); setProgress(0); }}>
              Cancelar
            </button>
          ) : (
            <button className="btn" onClick={onClose}>
              Cerrar
            </button>
          )}
          {state === "done" && url ? (
            <a className="btn primary" href={url} download={fileName}>
              Descargar MP4
            </a>
          ) : (
            <button className="btn primary" onClick={start} disabled={state === "rendering" || state === "checking"}>
              {state === "error" ? "Reintentar" : "Generar MP4"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
