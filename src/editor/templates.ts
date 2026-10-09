import { colors } from "../theme";
import { BRAND, BRANDS, defaultBackground, textPreset, uid } from "./factory";
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

// ───────── Marca personal: Alejandra Torres Martínez ─────────
const ALEJA = BRANDS.aleja.accent;
const LOGO = (file: string) => `assets/aleja/${file}.png`;

const sceneAleja = (
  name: string,
  duration: number,
  transition: Scene["transition"],
  elements: ElementData[],
  look: "oscuro" | "claro" = "oscuro",
  glowStyle: NonNullable<Scene["background"]["glowStyle"]> = "aurora",
): Scene => ({
  id: uid(),
  name,
  duration,
  transition,
  background:
    look === "claro"
      ? { kind: "solid", color: "#ffffff", color2: "#ffffff", dots: false }
      : { kind: "glow", color: ALEJA, color2: "#000000", dots: true, glowStyle },
  elements,
});

const logoImg = (file: string, w: number, h: number, x: number, y: number, start: number, end: number, a: Anim): ElementData => ({
  ...box(x, y, w, h, start, end),
  ...a,
  type: "image",
  name: "Logo Alejandra",
  props: { src: LOGO(file), fit: "contain", radius: 0 },
});

const alejaText = (t: string, b: ReturnType<typeof box>, a: Anim, preset: Parameters<typeof textPreset>[0], over: Partial<TextProps> = {}) =>
  text(t, b, a, preset, { font: "aleja", weight: 400, ...over });

const presentacionAleja = (): Design => ({
  version: 1,
  format: "9:16",
  accent: ALEJA,
  scenes: [
    sceneAleja("Logo", 3.5, "none", [
      logoImg("icono-turquesa", 380, 573, 350, 560, 0, 3.5, anim("reveal", 0.9, "float")),
      alejaText("ALEJANDRA TORRES MARTÍNEZ", box(90, 1210, 900, 160, 0.9, 3.5), anim("fade", 0.7), "subtitulo", { size: 44, align: "center", color: colors.white, glow: true }),
    ]),
    sceneAleja("Quién soy", 5, "slide-up", [
      alejaText("Hola, soy Alejandra", box(90, 520, 900, 380, 0.1, 5), anim("words", 0.9), "titular", { size: 92, align: "center", uppercase: true }),
      text("Cuéntales en una frase lo que haces y para quién lo haces.", box(110, 960, 860, 230, 0.9, 5), anim("fade", 0.7), "parrafo", { size: 44, align: "center", color: "rgba(255,255,255,0.78)" }),
      { ...box(300, 1260, 480, 130, 1.5, 5), ...anim("pop", 0.7), type: "pill", name: "Botón", props: { text: "Conóceme", size: 50, font: "aleja", glow: true, shine: true } },
    ], "oscuro", "malla"),
    sceneAleja("Cierre", 4, "fade", [
      logoImg("nombre-turquesa", 560, 800, 260, 380, 0, 4, anim("reveal", 0.9)),
      text("@tuusuario", box(190, 1250, 700, 80, 0.8, 4), anim("fade", 0.6), "subtitulo", { size: 50, font: "body", align: "center", uppercase: false, color: colors.white }),
      { ...box(290, 1380, 500, 130, 1.2, 4), ...anim("pop", 0.7, "pulse"), type: "pill", name: "Hablemos", props: { text: "Hablemos →", size: 50, font: "aleja", glow: true, shine: false } },
    ], "oscuro", "arriba"),
  ],
});

const fraseAleja = (): Design => ({
  version: 1,
  format: "9:16",
  accent: ALEJA,
  scenes: [
    sceneAleja("Frase", 6, "none", [
      logoImg("icono-turquesa", 150, 226, 465, 200, 0, 6, anim("fade", 0.6)),
      alejaText("Escribe aquí una frase que inspire.", box(90, 640, 900, 640, 0.3, 6), anim("words", 1), "titular", { size: 78, align: "center", uppercase: false, lineHeight: 1.3 }),
      alejaText("ALEJANDRA TORRES MARTÍNEZ", box(90, 1560, 900, 90, 1.1, 6), anim("fade", 0.6), "etiqueta", { size: 28, align: "center", color: ALEJA, letterSpacing: 0.08 }),
    ], "oscuro", "esquina"),
  ],
});

const feedAleja = (): Design => ({
  version: 1,
  format: "4:5",
  accent: ALEJA,
  scenes: [
    sceneAleja("Post", 6, "none", [
      logoImg("icono-negro", 120, 181, 80, 80, 0, 6, anim("fade", 0.5)),
      alejaText("Un titular claro para tu post", box(80, 340, 920, 440, 0.2, 6), anim("words", 0.9), "titular", { size: 76, color: "#000000", glow: false, uppercase: true }),
      text("Explica aquí la idea en dos o tres líneas, con palabras sencillas.", box(80, 700, 860, 150, 0.9, 6), anim("fade", 0.6), "parrafo", { color: "rgba(0,0,0,0.62)" }),
      { ...box(80, 920, 480, 130, 1.3, 6), ...anim("pop", 0.7), type: "shape", name: "Botón", props: { shape: "rect", fill: ALEJA, radius: 65, borderColor: ALEJA, borderWidth: 0 } },
      alejaText("Escríbeme", box(80, 920, 480, 130, 1.3, 6), anim("pop", 0.7), "etiqueta", { size: 36, align: "center", color: "#ffffff", uppercase: true, valign: "middle", letterSpacing: 0.06 }),
    ], "claro"),
  ],
});

const portadaAleja = (): Design => ({
  version: 1,
  format: "9:16",
  accent: ALEJA,
  scenes: [
    sceneAleja("Portada", 3, "none", [
      logoImg("icono-blanco", 300, 452, 390, 470, 0, 3, anim("pop", 0.8, "pulse")),
      alejaText("ALEJANDRA TORRES MARTÍNEZ", box(80, 1020, 920, 200, 0.5, 3), anim("words", 0.7), "titular", { size: 56, align: "center", uppercase: true, lineHeight: 1.25 }),
      alejaText("MARCA PERSONAL", box(80, 1250, 920, 70, 1.1, 3), anim("fade", 0.5), "etiqueta", { size: 26, align: "center", color: ALEJA, letterSpacing: 0.18 }),
    ], "oscuro", "centro"),
  ],
});

export const TEMPLATES: { id: string; name: string; description: string; make: () => Design }[] = [
  { id: "promo", name: "Promo Bitaxus", description: "Video de 19 s en 5 escenas: gancho, chat, beneficios, global y cierre.", make: promo },
  { id: "feed", name: "Anuncio feed", description: "Post animado 4:5 con titular, texto y botón.", make: feed },
  { id: "aleja-presentacion", name: "Aleja · Presentación", description: "Marca personal de Alejandra Torres: logo, quién soy y cierre. 9:16, 12 s.", make: presentacionAleja },
  { id: "aleja-frase", name: "Aleja · Frase", description: "Story con una frase destacada y tu nombre. 9:16.", make: fraseAleja },
  { id: "aleja-feed", name: "Aleja · Post claro", description: "Post 4:5 sobre fondo blanco con logo negro y botón turquesa.", make: feedAleja },
  { id: "aleja-portada", name: "Aleja · Portada reel", description: "Portada corta con el ícono, tu nombre y halo turquesa. 9:16.", make: portadaAleja },
  { id: "pregunta", name: "Story pregunta", description: "Pregunta y respuesta en 2 escenas, 9:16.", make: pregunta },
];
