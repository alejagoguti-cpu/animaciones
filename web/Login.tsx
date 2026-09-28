import React, { useState } from "react";
import { supabase } from "./supabase";
import { LOGO } from "./App";

// Acceso sin contraseña: llega un enlace al correo.
export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + window.location.pathname },
    });
    if (error) {
      setError(error.message);
      setState("error");
    } else {
      setState("sent");
    }
  };

  return (
    <div className="center-page brand-bg">
      <form className="auth-card" onSubmit={send}>
        <img src={LOGO} alt="Bitaxus" />
        <h1 className="display">Editor de animaciones</h1>
        {state === "sent" ? (
          <p>
            Te enviamos un enlace a <b>{email}</b>. Ábrelo desde este mismo navegador para entrar.
          </p>
        ) : (
          <>
            <p>Escribe tu correo y te enviamos un enlace para entrar. No necesitas contraseña.</p>
            <input
              className="input"
              type="email"
              required
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <button className="btn primary" disabled={state === "sending"}>
              {state === "sending" ? "Enviando…" : "Enviar enlace"}
            </button>
            {state === "error" && <p className="error">{error}</p>}
          </>
        )}
      </form>
    </div>
  );
};
