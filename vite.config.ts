import { defineConfig } from "vite";

// Editor web de animaciones (web/), publicado en GitHub Pages.
// landing.html: creador de landing interactiva (HTML puro, sin React).
export default defineConfig({
  root: "web",
  base: "/animaciones/",
  publicDir: "../public",
  oxc: { jsx: { runtime: "automatic" } },
  build: {
    outDir: "../build",
    emptyOutDir: true,
    rollupOptions: { input: { main: "web/index.html", landing: "web/landing.html" } },
  },
});
