import React, { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { Login } from "./Login";
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

export const App: React.FC = () => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [allowed, setAllowed] = useState<boolean | undefined>(undefined);
  const hash = useHashRoute();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setAllowed(undefined);
      return;
    }
    supabase.rpc("is_allowed").then(({ data, error }) => setAllowed(!error && data === true));
  }, [session?.user.id]);

  // Modo prueba: abre el editor con una plantilla, sin iniciar sesión y sin guardar.
  if (hash.startsWith("#/demo")) {
    return <Editor initialName="Prueba (no se guarda)" initialDesign={TEMPLATES[0].make()} onChange={() => {}} saveState="pending" onRetrySave={() => {}} />;
  }

  if (session === undefined || (session && allowed === undefined)) {
    return <Splash text="Cargando…" />;
  }
  if (!session) return <Login />;
  if (!allowed) {
    return (
      <div className="center-page brand-bg">
        <div className="auth-card">
          <img src={LOGO} alt="Bitaxus" />
          <h1 className="display">Sin acceso</h1>
          <p>
            La cuenta <b>{session.user.email}</b> no está autorizada para usar el editor. Pide que la agreguen a la
            lista de correos autorizados.
          </p>
          <button className="btn" onClick={() => supabase.auth.signOut()}>
            Salir
          </button>
        </div>
      </div>
    );
  }

  const match = hash.match(/^#\/d\/([\w-]+)/);
  if (match) return <EditorPage key={match[1]} id={match[1]} />;
  return <DesignList email={session.user.email ?? ""} />;
};

export const Splash: React.FC<{ text: string }> = ({ text }) => (
  <div className="center-page brand-bg">
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <img src={LOGO} alt="Bitaxus" style={{ width: 180 }} />
      <span className="muted">{text}</span>
    </div>
  </div>
);
