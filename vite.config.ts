import { defineConfig } from "vite";

// Editor web de animaciones (web/), publicado en GitHub Pages.
export default defineConfig({
  root: "web",
  base: "/animaciones/",
  publicDir: "../public",
  oxc: { jsx: { runtime: "automatic" } },
  build: { outDir: "../build", emptyOutDir: true },
});
