import { defineConfig } from "vite";

// Página web con el reproductor de Remotion, publicada en GitHub Pages.
export default defineConfig({
  root: "web",
  base: "/animaciones/",
  publicDir: "../public",
  oxc: { jsx: { runtime: "automatic" } },
  build: { outDir: "../build", emptyOutDir: true },
});
