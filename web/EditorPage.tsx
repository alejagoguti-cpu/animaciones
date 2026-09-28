import React, { useEffect, useRef, useState } from "react";
import { Design } from "../src/editor/types";
import { Splash, go } from "./App";
import { Editor } from "./editor/Editor";
import { DesignRow, supabase } from "./supabase";

export type SaveState = "saved" | "saving" | "pending" | "error";

// Carga un diseño de la nube y lo guarda solo mientras se edita.
export const EditorPage: React.FC<{ id: string }> = ({ id }) => {
  const [row, setRow] = useState<DesignRow | null>(null);
  const [error, setError] = useState("");
  const [save, setSave] = useState<SaveState>("saved");
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef<{ name: string; data: Design } | null>(null);

  useEffect(() => {
    supabase
      .from("designs")
      .select("id,name,format,data,created_at,updated_at")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRow(data as DesignRow);
      });
  }, [id]);

  const flush = async () => {
    const v = latest.current;
    if (!v) return;
    latest.current = null;
    setSave("saving");
    const { error } = await supabase.from("designs").update({ name: v.name, format: v.data.format, data: v.data }).eq("id", id);
    // Si falla, se queda pendiente para reintentar.
    if (error && !latest.current) latest.current = v;
    setSave(error ? "error" : latest.current ? "pending" : "saved");
  };

  const onChange = (name: string, data: Design) => {
    latest.current = { name, data };
    setSave("pending");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, 1200);
  };

  // Guarda lo pendiente antes de salir.
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (latest.current) {
        flush();
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", before);
    return () => {
      window.removeEventListener("beforeunload", before);
      window.clearTimeout(timer.current);
      flush();
    };
  }, []);

  if (error) {
    return (
      <div className="center-page brand-bg">
        <div className="auth-card">
          <h1 className="display">No se pudo abrir</h1>
          <p>{error}</p>
          <button className="btn" onClick={() => go("/")}>
            Volver a mis diseños
          </button>
        </div>
      </div>
    );
  }
  if (!row) return <Splash text="Abriendo diseño…" />;
  return <Editor initialName={row.name} initialDesign={row.data} onChange={onChange} saveState={save} onRetrySave={flush} />;
};
