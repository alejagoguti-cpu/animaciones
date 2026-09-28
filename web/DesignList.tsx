import React, { useEffect, useState } from "react";
import { Thumbnail } from "@remotion/player";
import { DesignVideo } from "../src/editor/render/DesignVideo";
import { emptyDesign } from "../src/editor/factory";
import { TEMPLATES } from "../src/editor/templates";
import { totalFrames } from "../src/editor/timing";
import { Design, Format, FORMAT_SIZE, FPS } from "../src/editor/types";
import { go, LOGO } from "./App";
import { DesignRow, supabase } from "./supabase";

export const DesignPreview: React.FC<{ design: Design; frame?: number }> = ({ design, frame }) => {
  const { width, height } = FORMAT_SIZE[design.format] ?? FORMAT_SIZE["9:16"];
  const total = totalFrames(design);
  return (
    <Thumbnail
      component={DesignVideo}
      inputProps={{ design }}
      compositionWidth={width}
      compositionHeight={height}
      durationInFrames={total}
      fps={FPS}
      frameToDisplay={Math.min(total - 1, frame ?? Math.round(FPS * 1.8))}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export const DesignList: React.FC = () => {
  const [rows, setRows] = useState<DesignRow[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("designs")
      .select("id,name,format,data,created_at,updated_at")
      .order("updated_at", { ascending: false });
    if (error) setError(error.message);
    else setRows(data as DesignRow[]);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (name: string, design: Design) => {
    setBusy(true);
    const { data, error } = await supabase
      .from("designs")
      .insert({ name, format: design.format, data: design })
      .select("id")
      .single();
    setBusy(false);
    if (error) return setError(error.message);
    go(`/d/${data.id}`);
  };

  const duplicate = async (row: DesignRow) => create(`${row.name} (copia)`, row.data);

  const remove = async (row: DesignRow) => {
    if (!window.confirm(`¿Eliminar "${row.name}"? No se puede deshacer.`)) return;
    const { error } = await supabase.from("designs").delete().eq("id", row.id);
    if (error) setError(error.message);
    else load();
  };

  return (
    <div className="list-page brand-bg">
      <header className="list-header">
        <img src={LOGO} alt="Bitaxus" />
        <b className="display" style={{ fontSize: 16 }}>
          Animaciones
        </b>
        <div style={{ flex: 1 }} />
        <a className="btn ghost small" href={`${import.meta.env.BASE_URL}studio/`} target="_blank" rel="noreferrer">
          Estudio Remotion ↗
        </a>
      </header>

      <div className="list-body">
        {error && <p className="error">{error}</p>}

        <h2 className="display">Crear</h2>
        <div className="grid">
          {(Object.keys(FORMAT_SIZE) as Format[]).map((f) => (
            <button
              key={f}
              className="tile"
              disabled={busy}
              onClick={() => create("Sin título", emptyDesign(f))}
              style={{ textAlign: "left", color: "inherit" }}
            >
              <div className="thumb" style={{ aspectRatio: "16 / 10" }}>
                <div
                  style={{
                    border: "2px dashed rgba(255,255,255,0.4)",
                    borderRadius: 6,
                    aspectRatio: `${FORMAT_SIZE[f].width} / ${FORMAT_SIZE[f].height}`,
                    height: "62%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                  }}
                >
                  +
                </div>
              </div>
              <div className="meta">
                <b>En blanco</b>
                <span>{FORMAT_SIZE[f].label}</span>
              </div>
            </button>
          ))}
        </div>

        <h2 className="display">Plantillas</h2>
        <div className="grid">
          {TEMPLATES.map((t) => {
            const d = t.make();
            return (
              <button
                key={t.id}
                className="tile"
                disabled={busy}
                onClick={() => create(t.name, t.make())}
                style={{ textAlign: "left", color: "inherit" }}
              >
                <div className="thumb" style={{ aspectRatio: "9 / 12" }}>
                  <div style={{ height: "100%", aspectRatio: `${FORMAT_SIZE[d.format].width} / ${FORMAT_SIZE[d.format].height}` }}>
                    <DesignPreview design={d} />
                  </div>
                </div>
                <div className="meta">
                  <b>{t.name}</b>
                  <span>{t.description}</span>
                </div>
              </button>
            );
          })}
        </div>

        <h2 className="display">Mis diseños</h2>
        {rows === null && !error && <p className="muted">Cargando…</p>}
        {rows?.length === 0 && <p className="muted">Todavía no hay diseños. Crea uno arriba.</p>}
        <div className="grid">
          {rows?.map((row) => (
            <div key={row.id} className="tile" onClick={() => go(`/d/${row.id}`)}>
              <div className="thumb">
                <div style={{ height: "100%", aspectRatio: `${FORMAT_SIZE[row.data.format]?.width ?? 1080} / ${FORMAT_SIZE[row.data.format]?.height ?? 1920}` }}>
                  <DesignPreview design={row.data} />
                </div>
              </div>
              <div className="meta">
                <b>{row.name}</b>
                <span>
                  {row.format} · {new Date(row.updated_at).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </div>
              <div className="actions" onClick={(e) => e.stopPropagation()}>
                <button className="btn small" onClick={() => duplicate(row)}>
                  Duplicar
                </button>
                <button className="btn small danger" onClick={() => remove(row)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
