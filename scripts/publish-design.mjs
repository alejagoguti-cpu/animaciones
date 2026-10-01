import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
const sb = createClient("https://ltbudfohnctcbriitebu.supabase.co", "sb_publishable_g5BwEh4WuQe3vS5Y-VYRTQ_pbV6a5Gl");
const UPLOAD_DIR = process.argv[2];
const path = `${UPLOAD_DIR}/${Date.now()}-reel-bitaxus__1080x1920__.mp4`;
const up = await sb.storage.from("uploads").upload(path, fs.readFileSync("work/src.mp4"), { contentType: "video/mp4" });
if (up.error) throw up.error;
const src = sb.storage.from("uploads").getPublicUrl(path).data.publicUrl;
console.log("video:", src);
const uid = () => Math.random().toString(36).slice(2, 10);
const RED = "#c1121f";
const common = (x, y, w, h, start, end, enter, exit = { kind: "none", duration: 0.4 }) =>
  ({ id: uid(), x, y, w, h, rotation: 0, opacity: 1, start, end, enter, exit, loop: "none" });
const sub = (t, a, b, over = {}) => ({
  ...common(50, 1290, 980, 300, a, b, { kind: "words", duration: Math.min(0.7, (b - a) * 0.7) }, { kind: "fade", duration: 0.18 }),
  type: "text", name: `Sub: ${t}`.slice(0, 28),
  props: { text: t, font: "display", weight: 700, size: 88, color: "#ffffff", align: "center", uppercase: true, letterSpacing: 0.01, lineHeight: 1.12, glow: true, ...over },
});
const E = 0.04;
const subs = [
  ["Te ha pasado que siempre", 0.0, 1.86],
  ["te felicitan en las reuniones,", 1.86, 3.94],
  ["pero cuando miras tu cuenta", 3.94, 5.72],
  ["en Cardia, el pago", 5.72, 6.88],
  ["no se ha reflejado.", 6.88, 8.08],
].map(([t, a, b]) => sub(t, a, b - E));
subs.push(sub("Con Bitaxus", 8.08, 8.9 - E, { size: 120, color: "#ff5a64" }));
subs.push(sub("esto va a cambiar.", 8.9, 11.44, { size: 100 }));
const bg = { kind: "glow", color: RED, color2: "#000000", dots: true };
const design = {
  version: 1, format: "9:16", accent: RED,
  scenes: [
    { id: uid(), name: "Reel", duration: 11.44, transition: "none", background: bg, elements: [
      { ...common(0, 0, 1080, 1920, 0, 11.44, { kind: "none", duration: 0.3 }), type: "video", name: "Video", props: { src, fit: "cover", radius: 0, muted: false } },
      { ...common(0, 1000, 1080, 920, 0, 11.44, { kind: "none", duration: 0.3 }), type: "shape", name: "Resplandor abajo", props: { shape: "rect", fill: "linear-gradient(to top, rgba(193,18,31,0.65), rgba(0,0,0,0))", radius: 0, borderColor: "#fff", borderWidth: 0 } },
      { ...common(0, 0, 1080, 500, 0, 11.44, { kind: "none", duration: 0.3 }), type: "shape", name: "Resplandor arriba", props: { shape: "rect", fill: "linear-gradient(to bottom, rgba(193,18,31,0.45), rgba(0,0,0,0))", radius: 0, borderColor: "#fff", borderWidth: 0 } },
      { ...common(290, 90, 500, 96, 0.3, 11.44, { kind: "reveal", duration: 0.8 }), loop: "none", type: "logo", name: "Logo", props: { glow: true } },
      ...subs,
    ] },
    { id: uid(), name: "Cierre", duration: 2.2, transition: "fade", background: bg, elements: [
      { ...common(190, 700, 700, 134, 0.1, 2.2, { kind: "reveal", duration: 0.8 }), type: "logo", name: "Logo", props: { glow: true } },
      { ...common(250, 920, 580, 150, 0.5, 2.2, { kind: "pop", duration: 0.7 }), type: "pill", name: "Botón", props: { text: "bitaxus.com", size: 64, font: "display", glow: true, shine: true } },
    ] },
  ],
};
const { data, error } = await sb.from("designs").insert({ name: "Reel Bitaxus con subtítulos", format: "9:16", data: design }).select("id").single();
if (error) throw error;
console.log("design id:", data.id, `https://alejagoguti-cpu.github.io/animaciones/#/d/${data.id}`);
