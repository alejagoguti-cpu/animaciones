import React, { useEffect, useState } from "react";
import { DesignList } from "./DesignList";
import { EditorPage } from "./EditorPage";
import { Editor } from "./editor/Editor";
import { TEMPLATES } from "../src/editor/templates";

const BASE = import.meta.env.BASE_URL;
export const LOGO = `${BASE}logo.png`;

const useHashRoute = () => {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash;
};

export const go = (path: string) => {
  window.location.hash = path;
};

// Acceso libre: sin inicio de sesión.
export const App: React.FC = () => {
  const hash = useHashRoute();

  // Modo prueba: abre el editor con una plantilla, sin guardar.
  if (hash.startsWith("#/demo")) {
    return (
      <Editor
        initialName="Prueba (no se guarda)"
        initialDesign={TEMPLATES[0].make()}
        onChange={() => {}}
        saveState="saved"
        onRetrySave={() => {}}
      />
    );
  }

  const match = hash.match(/^#\/d\/([\w-]+)/);
  if (match) return <EditorPage key={match[1]} id={match[1]} />;
  return <DesignList />;
};

export const Splash: React.FC<{ text: string }> = ({ text }) => (
  <div className="center-page brand-bg">
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <img src={LOGO} alt="Bitaxus" style={{ width: 180 }} />
      <span className="muted">{text}</span>
    </div>
  </div>
);
