import React, { useEffect, useState } from "react";
import { Thumbnail } from "@remotion/player";
import { DesignVideo } from "../src/editor/render/DesignVideo";
import { applyBrand, BRANDS, emptyDesign } from "../src/editor/factory";
import { BrandSwitcher, useBrand } from "./brand";
import { TEMPLATES } from "../src/editor/templates";
import { totalFrames } from "../src/editor/timing";
import { Design, Format, FORMAT_SIZE, FPS } from "../src/editor/types";
import { go } from "./App";
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
  const brand = useBrand();
  // Cada diseño pertenece a una marca; los anteriores a las dos marcas son de Bitaxus.
  const myRows = (rows ?? []).filter((r) => (r.data.brand ?? "bitaxus") === brand);

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
        <BrandSwitcher />
        <div style={{ flex: 1 }} />
        <a className="btn ghost small" href={`${import.meta.env.BASE_URL}studio/`} target="_blank" rel="noreferrer">
          Estudio Remotion ↗
        </a>
      </header>

      <div className="list-body">
        <div className="hero">
          <h1 className="display">Animaciones</h1>
          <p>Crea videos animados con la marca {BRANDS[brand].name} y descárgalos en MP4.</p>
          <div className="formats">
            {(Object.keys(FORMAT_SIZE) as Format[]).map((f) => (
              <button key={f} className="format-btn" disabled={busy} onClick={() => create("Sin título", applyBrand(emptyDesign(f), brand))}>
                <span className="shape" style={{ aspectRatio: `${FORMAT_SIZE[f].width} / ${FORMAT_SIZE[f].height}` }} />
                <span>
                  <b>{f}</b>
                  <span>{FORMAT_SIZE[f].label.replace(/ \d+:\d+$/, "")}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        <h2 className="display">Mis diseños</h2>
        {rows === null && !error && <p className="muted">Cargando…</p>}
        {rows && rows.length > 0 && myRows.length === 0 && <p className="muted">Todavía no tienes diseños de {BRANDS[brand].name}. Empieza con un formato o una plantilla.</p>}
        {rows?.length === 0 && <p className="muted">Todavía no hay diseños. Empieza con un formato o una plantilla.</p>}
        <div className="grid">
          {myRows.map((row) => (
            <div key={row.id} className="tile" onClick={() => go(`/d/${row.id}`)} role="button" style={{ cursor: "pointer" }}>
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
                <button onClick={() => duplicate(row)}>Duplicar</button>
                <button onClick={() => remove(row)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>

        <h2 className="display">Plantillas · {BRANDS[brand].name}</h2>
        <div className="grid">
          {TEMPLATES.filter((t) => t.id.startsWith("aleja-") === (brand === "aleja")).map((t) => {
            const d = t.make();
            return (
              <button key={t.id} className="tile" disabled={busy} onClick={() => create(t.name, { ...t.make(), brand })}>
                <div className="thumb">
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
      </div>
    </div>
  );
};
