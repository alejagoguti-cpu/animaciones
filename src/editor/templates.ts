import { colors } from "../theme";
import { BRAND, defaultBackground, textPreset, uid } from "./factory";
import { Design, ElementData, Scene, TextProps } from "./types";

// Plantillas de arranque. Todo es editable después en el lienzo.

type Anim = Pick<ElementData, "enter" | "exit" | "loop">;
const anim = (enter: ElementData["enter"]["kind"], duration = 0.7, loop: ElementData["loop"] = "none"): Anim => ({
  enter: { kind: enter, duration },
  exit: { kind: "none", duration: 0.4 },
  loop,
});

const box = (x: number, y: number, w: number, h: number, start: number, end: number) => ({
  id: uid(),
  x,
  y,
  w,
  h,
  start,
  end,
  rotation: 0,
  opacity: 1,
});

const text = (
  t: string,
  b: ReturnType<typeof box>,
  a: Anim,
  preset: Parameters<typeof textPreset>[0],
  over: Partial<TextProps> = {},
): ElementData => ({ ...b, ...a, type: "text", name: t.slice(0, 24), props: { ...textPreset(preset), text: t, ...over } });

const scene = (name: string, duration: number, transition: Scene["transition"], elements: ElementData[]): Scene => ({
  id: uid(),
  name,
  duration,
  transition,
  background: defaultBackground(),
  elements,
});

const promo = (): Design => ({
  version: 1,
  format: "9:16",
  accent: BRAND.red,
  scenes: [
    scene("Gancho", 3.5, "none", [
      { ...box(90, 120, 300, 57, 0, 3.5), ...anim("fade", 0.5), type: "logo", name: "Logo", props: { glow: false } },
      text("Cobrar debería ser tan fácil como enviar un mensaje.", box(90, 555, 900, 110, 0, 3.5), anim("fade", 0.5), "parrafo", { size: 36, color: "rgba(255,255,255,0.45)" }),
      text("Vendiste", box(90, 695, 900, 170, 0.2, 3.5), anim("words", 0.5), "titular", { size: 150 }),
      text("como nunca", box(90, 860, 900, 330, 0.45, 3.5), anim("words", 0.6), "titular", { size: 150 }),
      { ...box(90, 1200, 780, 150, 1.1, 3.5), ...anim("pop", 0.7), type: "pill", name: "¿Y LA PLATA?", props: { text: "¿Y LA PLATA?", size: 94, font: "display", glow: true, shine: true } },
    ]),
    scene("Chat WhatsApp", 6, "slide-up", [
      text("No necesitas otra aplicación", box(90, 150, 900, 200, 0.1, 6), anim("words", 0.8), "titular", { size: 78 }),
      {
        ...box(150, 480, 780, 1300, 0, 6),
        rotation: -2,
        ...anim("up", 0.9, "float"),
        type: "phone",
        name: "Teléfono con chat",
        props: {
          contactName: "Bitaxus",
          messages: [
            { from: "cliente", text: "Quiero programar un recaudo.", time: "10:44 AM" },
            { from: "bitaxus", text: "¡Claro! Vamos paso a paso. ¿Cuánto vas a cobrar y cuál es el concepto?", time: "10:45 AM" },
            { from: "cliente", text: "$1.250.000 por servicios de publicidad.", time: "10:46 AM" },
            { from: "bitaxus", text: "Perfecto. Ahora cuéntame quién realizará el pago y te ayudo a dejar todo programado.", time: "10:47 AM" },
          ],
        },
      },
    ]),
    scene("Beneficios", 4, "fade", [
      text("Recibe, paga y decide con más claridad.", box(80, 420, 920, 300, 0, 4), anim("words", 0.8), "titular", { size: 88 }),
      { ...box(80, 780, 920, 180, 0.7, 4), ...anim("left", 0.6), type: "card", name: "Recaudos", props: { icon: "↓", title: "Recaudos", text: "Programa y registra los pagos que esperas recibir.", glow: true } },
      { ...box(80, 990, 920, 180, 1.0, 4), ...anim("left", 0.6), type: "card", name: "Pagos", props: { icon: "↑", title: "Pagos y dispersiones", text: "Organiza pagos individuales o múltiples.", glow: false } },
      { ...box(80, 1200, 920, 180, 1.3, 4), ...anim("left", 0.6), type: "card", name: "Decisiones", props: { icon: "◎", title: "Decisiones más claras", text: "Ordena tus movimientos y decide mejor.", glow: false } },
    ]),
    scene("Global", 4, "slide-left", [
      text("Más alcance,", box(80, 380, 920, 140, 0, 4), anim("words", 0.6), "titular", { size: 110 }),
      text("menos fronteras.", box(80, 520, 920, 260, 0.3, 4), anim("words", 0.6), "titular", { size: 110 }),
      { ...box(80, 860, 920, 440, 0.5, 4), ...anim("up", 0.7), type: "shape", name: "Panel", props: { shape: "rect", fill: "rgba(193,18,31,0.22)", radius: 34, borderColor: "rgba(255,255,255,0.5)", borderWidth: 4 } },
      { ...box(130, 910, 820, 170, 0.7, 4), ...anim("fade", 0.4), type: "counter", name: "Tú envías", props: { label: "TÚ ENVÍAS", currency: "USD", from: 1000, to: 1000, size: 100, color: colors.white, countDuration: 0.1 } },
      { ...box(130, 1110, 820, 170, 0.9, 4), ...anim("fade", 0.4), type: "counter", name: "Resultado", props: { label: "RESULTADO ESTIMADO", currency: "COP", from: 0, to: 3912000, size: 100, color: colors.white, countDuration: 1.6 } },
      text("Valores de referencia. El resultado puede variar según la operación.", box(80, 1360, 920, 100, 2, 4), anim("fade", 0.5), "parrafo", { size: 30, color: "rgba(255,255,255,0.45)" }),
    ]),
    scene("Cierre", 4, "fade", [
      { ...box(130, 600, 820, 157, 0, 4), ...anim("reveal", 0.8), type: "logo", name: "Logo", props: { glow: true } },
      text("Cobra, paga y entiende tu dinero desde WhatsApp.", box(100, 840, 880, 140, 0.5, 4), anim("fade", 0.5), "parrafo", { size: 46, color: colors.white, align: "center" }),
      { ...box(290, 1040, 500, 140, 0.9, 4), ...anim("pop", 0.7, "pulse"), type: "pill", name: "Hablemos", props: { text: "Hablemos →", size: 56, font: "body", glow: true, shine: false } },
      text("bitaxus.com", box(240, 1250, 600, 70, 1.3, 4), anim("fade", 0.5), "subtitulo", { size: 44, align: "center", uppercase: false, color: "rgba(255,255,255,0.72)" }),
    ]),
  ],
});

const feed = (): Design => ({
  version: 1,
  format: "4:5",
  accent: BRAND.red,
  scenes: [
    scene("Anuncio", 6, "none", [
      { ...box(80, 80, 300, 57, 0, 6), ...anim("fade", 0.5), type: "logo", name: "Logo", props: { glow: false } },
      text("Cobra desde WhatsApp", box(80, 360, 920, 330, 0.2, 6), anim("words", 0.8), "titular", { size: 120 }),
      text("Programa recaudos, organiza pagos y consulta tus movimientos con una experiencia simple y guiada.", box(80, 740, 860, 170, 0.9, 6), anim("fade", 0.6), "parrafo"),
      { ...box(80, 1010, 520, 140, 1.4, 6), ...anim("pop", 0.7, "pulse"), type: "pill", name: "Hablemos", props: { text: "Hablemos →", size: 56, font: "body", glow: true, shine: true } },
    ]),
  ],
});

const pregunta = (): Design => ({
  version: 1,
  format: "9:16",
  accent: BRAND.red,
  scenes: [
    scene("Pregunta", 3, "none", [
      text("¿Tus clientes te pagan tarde?", box(90, 700, 900, 520, 0.1, 3), anim("words", 0.9), "titular", { size: 130, align: "center" }),
    ]),
    scene("Respuesta", 4, "wipe", [
      text("Bitaxus les recuerda por ti.", box(90, 640, 900, 400, 0, 4), anim("words", 0.8), "titular", { size: 110, align: "center" }),
      { ...box(290, 1120, 500, 96, 0.9, 4), ...anim("reveal", 0.8), type: "logo", name: "Logo", props: { glow: true } },
    ]),
  ],
});

export const TEMPLATES: { id: string; name: string; description: string; make: () => Design }[] = [
  { id: "promo", name: "Promo Bitaxus", description: "Video de 19 s en 5 escenas: gancho, chat, beneficios, global y cierre.", make: promo },
  { id: "feed", name: "Anuncio feed", description: "Post animado 4:5 con titular, texto y botón.", make: feed },
  { id: "pregunta", name: "Story pregunta", description: "Pregunta y respuesta en 2 escenas, 9:16.", make: pregunta },
];
