import "./static-base";
import "../src/theme";
import "./styles.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(<App />);

// Solo en desarrollo: utilidades para probar el render desde la consola.
if (import.meta.env.DEV) {
  Promise.all([
    import("@remotion/web-renderer"),
    import("../src/editor/render/DesignVideo"),
    import("../src/editor/factory"),
  ]).then(([wr, dv, f]) => Object.assign(window, { __dev: { ...wr, ...dv, ...f } }));
}
