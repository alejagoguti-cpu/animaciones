// Formato de un diseño del editor. Se guarda tal cual (JSON) en Supabase.

export type Format = "9:16" | "4:5" | "1:1" | "16:9";

export const FORMAT_SIZE: Record<Format, { width: number; height: number; label: string }> = {
  "9:16": { width: 1080, height: 1920, label: "Reels / Stories 9:16" },
  "4:5": { width: 1080, height: 1350, label: "Feed 4:5" },
  "1:1": { width: 1080, height: 1080, label: "Cuadrado 1:1" },
  "16:9": { width: 1920, height: 1080, label: "Horizontal 16:9" },
};

export type EnterKind =
  | "none"
  | "fade"
  | "up"
  | "down"
  | "left"
  | "right"
  | "pop"
  | "zoom"
  | "blur"
  | "words"
  | "typewriter"
  | "reveal";

export type ExitKind = "none" | "fade" | "up" | "down" | "zoom" | "blur";

export type LoopKind = "none" | "float" | "pulse" | "shine" | "spin";

export type Transition = "none" | "fade" | "slide-left" | "slide-up" | "wipe";

export type BackgroundKind = "glow" | "solid" | "gradient" | "image";

export type GlowStyle = "orbes" | "aurora" | "malla" | "esquina" | "centro" | "arriba" | "abajo" | "lateral" | "ondas" | "rayos";

export type GlowLight = { id: string; x: number; y: number; size: number; color: string };

export type Background = {
  kind: BackgroundKind;
  color: string;
  color2: string;
  image?: string;
  dots: boolean;
  // Solo para el tipo "glow": forma del resplandor (por defecto, orbes) e intensidad (1 = normal).
  glowStyle?: GlowStyle;
  glowIntensity?: number;
  // Posición (0–1 del lienzo) de cada fuente de luz; si falta, la del estilo. Se arrastran en el lienzo.
  glowPoints?: { x: number; y: number }[];
  // Luces extra que agrega el usuario: posición (0–1), tamaño (1 = el lado mayor del lienzo) y color.
  glowLights?: GlowLight[];
};

type ElementBase = {
  id: string;
  name?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  opacity: number;
  // Segundos, relativos al inicio de la escena.
  start: number;
  end: number;
  enter: { kind: EnterKind; duration: number };
  exit: { kind: ExitKind; duration: number };
  loop: LoopKind;
  locked?: boolean;
};

export type TextProps = {
  text: string;
  font: "display" | "body";
  weight: number;
  size: number;
  color: string;
  align: "left" | "center" | "right";
  uppercase: boolean;
  letterSpacing: number;
  lineHeight: number;
  glow: boolean;
  // Posición vertical del texto dentro de su caja y ajuste fino en px (opcionales).
  valign?: "top" | "middle" | "bottom";
  offsetY?: number;
  italic?: boolean;
  underline?: boolean;
};

export type ChatMessageData = { from: "cliente" | "bitaxus"; text: string; time: string };

// Punto de un trazo vectorial. Coordenadas normalizadas (0–1) dentro de la
// caja del elemento; `in`/`out` son las manijas de la curva (opcionales).
export type VectorNode = { x: number; y: number; in?: { x: number; y: number }; out?: { x: number; y: number } };

export type VectorProps = {
  nodes: VectorNode[];
  closed: boolean;
  fill: string;
  // Si tiene valor, el relleno es un degradado de `fill` a `fill2`.
  fill2: string;
  stroke: string;
  strokeWidth: number;
  glow: boolean;
};

export type ElementData =
  | (ElementBase & { type: "text"; props: TextProps })
  | (ElementBase & { type: "image"; props: { src: string; fit: "cover" | "contain"; radius: number } })
  | (ElementBase & { type: "video"; props: { src: string; fit: "cover" | "contain"; radius: number; muted: boolean } })
  | (ElementBase & { type: "logo"; props: { glow: boolean } })
  | (ElementBase & {
      type: "shape";
      props: { shape: "rect" | "circle"; fill: string; radius: number; borderColor: string; borderWidth: number };
    })
  | (ElementBase & { type: "vector"; props: VectorProps })
  | (ElementBase & {
      type: "pill";
      props: { text: string; size: number; font: "display" | "body"; glow: boolean; shine: boolean; valign?: "top" | "middle" | "bottom"; offsetY?: number; italic?: boolean; underline?: boolean };
    })
  | (ElementBase & {
      type: "card";
      props: { icon: string; title: string; text: string; glow: boolean };
    })
  | (ElementBase & {
      type: "phone";
      props: { contactName: string; messages: ChatMessageData[] };
    })
  | (ElementBase & {
      type: "counter";
      props: {
        label: string;
        currency: string;
        from: number;
        to: number;
        size: number;
        color: string;
        // Segundos que tarda en contar, desde que aparece.
        countDuration: number;
      };
    });

export type ElementType = ElementData["type"];

export type Scene = {
  id: string;
  name: string;
  duration: number;
  background: Background;
  transition: Transition;
  elements: ElementData[];
};

export type Design = {
  version: 1;
  format: Format;
  accent: string;
  scenes: Scene[];
};

export const FPS = 30;
export const TRANSITION_FRAMES = 15;
