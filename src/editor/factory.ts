import { colors } from "../theme";
import { VECTOR_PRESETS } from "./vector";
import {
  Background,
  Design,
  ElementData,
  ElementType,
  Format,
  FORMAT_SIZE,
  Scene,
  TextProps,
} from "./types";

export const uid = () => Math.random().toString(36).slice(2, 10);

export const BRAND = {
  red: "#c1121f",
  black: "#000000",
  white: "#ffffff",
  whatsapp: "#0b5c4b",
  green: "#25d366",
  palette: ["#c1121f", "#ff5a64", "#6e0a10", "#000000", "#1b1c1c", "#ffffff", "#bdbdbd", "#0b5c4b", "#25d366"],
};

export const defaultBackground = (): Background => ({
  kind: "glow",
  color: BRAND.red,
  color2: BRAND.black,
  dots: true,
});

const base = (sceneDuration: number) => ({
  id: uid(),
  rotation: 0,
  opacity: 1,
  start: 0,
  end: sceneDuration,
  enter: { kind: "up" as const, duration: 0.6 },
  exit: { kind: "none" as const, duration: 0.4 },
  loop: "none" as const,
});

export const textPreset = (kind: "titular" | "subtitulo" | "parrafo" | "etiqueta"): TextProps => {
  switch (kind) {
    case "titular":
      return { text: "Tu titular", font: "display", weight: 700, size: 130, color: colors.white, align: "left", uppercase: true, letterSpacing: 0.01, lineHeight: 1.05, glow: true };
    case "subtitulo":
      return { text: "Un subtítulo corto", font: "display", weight: 600, size: 72, color: colors.white, align: "left", uppercase: true, letterSpacing: 0.01, lineHeight: 1.1, glow: false };
    case "parrafo":
      return { text: "Cobrar debería ser tan fácil como enviar un mensaje.", font: "body", weight: 400, size: 40, color: "rgba(255,255,255,0.72)", align: "left", uppercase: false, letterSpacing: 0, lineHeight: 1.4, glow: false };
    case "etiqueta":
      return { text: "NUEVO", font: "body", weight: 700, size: 30, color: colors.white, align: "left", uppercase: true, letterSpacing: 0.14, lineHeight: 1.2, glow: false };
  }
};

// Crea un elemento nuevo centrado en el lienzo.
export const newElement = (
  type: ElementType,
  format: Format,
  sceneDuration: number,
  extra?: { src?: string; width?: number; height?: number; textKind?: Parameters<typeof textPreset>[0]; preset?: string },
): ElementData => {
  const { width: W, height: H } = FORMAT_SIZE[format];
  const center = (w: number, h: number) => ({ x: Math.round((W - w) / 2), y: Math.round((H - h) / 2), w, h });
  const b = base(sceneDuration);

  switch (type) {
    case "text": {
      const props = textPreset(extra?.textKind ?? "titular");
      const w = Math.min(900, W - 120);
      const h = Math.round(props.size * props.lineHeight * 2);
      return { ...b, type, name: "Texto", ...center(w, h), enter: { kind: props.font === "display" ? "words" : "fade", duration: 0.8 }, props };
    }
    case "image":
    case "video": {
      const iw = extra?.width ?? 800;
      const ih = extra?.height ?? 800;
      const s = Math.min((W * 0.8) / iw, (H * 0.6) / ih, 1.5);
      const dims = center(Math.round(iw * s), Math.round(ih * s));
      if (type === "image") {
        return { ...b, type, name: "Imagen", ...dims, enter: { kind: "fade", duration: 0.6 }, props: { src: extra?.src ?? "", fit: "contain", radius: 0 } };
      }
      return { ...b, type, name: "Video", ...dims, enter: { kind: "fade", duration: 0.6 }, props: { src: extra?.src ?? "", fit: "cover", radius: 24, muted: true } };
    }
    case "logo":
      return { ...b, type, name: "Logo", ...center(600, 115), enter: { kind: "reveal", duration: 0.8 }, props: { glow: true } };
    case "shape":
      return { ...b, type, name: "Forma", ...center(400, 400), enter: { kind: "pop", duration: 0.6 }, props: { shape: "rect", fill: "rgba(193,18,31,0.5)", radius: 34, borderColor: "rgba(255,255,255,0.5)", borderWidth: 4 } };
    case "pill":
      return { ...b, type, name: "Botón", ...center(620, 150), enter: { kind: "pop", duration: 0.7 }, props: { text: "¿Y LA PLATA?", size: 80, font: "display", glow: true, shine: true } };
    case "card":
      return { ...b, type, name: "Tarjeta", ...center(920, 180), enter: { kind: "left", duration: 0.6 }, props: { icon: "↓", title: "Recaudos", text: "Programa y registra los pagos que esperas recibir.", glow: true } };
    case "phone": {
      const s = Math.min(1, (H * 0.7) / 1300, (W * 0.75) / 780);
      return {
        ...b,
        type,
        name: "Teléfono con chat",
        ...center(Math.round(780 * s), Math.round(1300 * s)),
        enter: { kind: "up", duration: 0.9 },
        loop: "float",
        props: {
          contactName: "Bitaxus",
          messages: [
            { from: "cliente", text: "Quiero programar un recaudo.", time: "10:44 AM" },
            { from: "bitaxus", text: "¡Claro! ¿Cuánto vas a cobrar y cuál es el concepto?", time: "10:45 AM" },
          ],
        },
      };
    }
    case "vector": {
      const preset = VECTOR_PRESETS.find((p) => p.id === extra?.preset) ?? VECTOR_PRESETS[0];
      const w = 360;
      const h = Math.max(8, Math.round(w * (preset.ratio ?? 1)));
      return {
        ...b,
        type,
        name: preset.name,
        ...center(w, h),
        enter: { kind: "pop", duration: 0.6 },
        props: {
          nodes: structuredClone(preset.nodes),
          closed: preset.closed,
          fill: preset.outline ? "transparent" : BRAND.red,
          fill2: "",
          stroke: preset.outline ? BRAND.white : "rgba(255,255,255,0.5)",
          strokeWidth: preset.outline ? 18 : 4,
          glow: false,
        },
      };
    }
    case "counter":
      return { ...b, type, name: "Contador", ...center(900, 200), enter: { kind: "up", duration: 0.6 }, props: { label: "RESULTADO ESTIMADO", currency: "COP", from: 0, to: 3912000, size: 100, color: colors.white, countDuration: 1.6 } };
  }
};

export const newScene = (name = "Escena", duration = 4): Scene => ({
  id: uid(),
  name,
  duration,
  background: defaultBackground(),
  transition: "fade",
  elements: [],
});

export const cloneScene = (s: Scene): Scene => ({
  ...structuredClone(s),
  id: uid(),
  name: `${s.name} (copia)`,
  elements: s.elements.map((e) => ({ ...structuredClone(e), id: uid() })),
});

export const emptyDesign = (format: Format = "9:16"): Design => ({
  version: 1,
  format,
  accent: BRAND.red,
  scenes: [newScene("Escena 1")],
});

// Adapta un diseño a otro formato manteniendo la posición relativa.
export const changeFormat = (d: Design, format: Format): Design => {
  const from = FORMAT_SIZE[d.format];
  const to = FORMAT_SIZE[format];
  const sx = to.width / from.width;
  const sy = to.height / from.height;
  const s = Math.min(sx, sy);
  return {
    ...d,
    format,
    scenes: d.scenes.map((scene) => ({
      ...scene,
      elements: scene.elements.map((el) => {
        const cx = (el.x + el.w / 2) * sx;
        const cy = (el.y + el.h / 2) * sy;
        const w = el.w * s;
        const h = el.h * s;
        const scaled = { ...el, x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w: Math.round(w), h: Math.round(h) } as ElementData;
        if (scaled.type === "text") scaled.props = { ...scaled.props, size: Math.round(scaled.props.size * s) };
        if (scaled.type === "pill") scaled.props = { ...scaled.props, size: Math.round(scaled.props.size * s) };
        if (scaled.type === "counter") scaled.props = { ...scaled.props, size: Math.round(scaled.props.size * s) };
        if (scaled.type === "vector") scaled.props = { ...scaled.props, strokeWidth: scaled.props.strokeWidth * s };
        return scaled;
      }),
    })),
  };
};
