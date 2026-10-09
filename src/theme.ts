import { loadFont } from "@remotion/fonts";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadMichroma } from "@remotion/google-fonts/Michroma";
import { staticFile } from "remotion";

// Montserrat es la fuente de texto de bitaxus.com.
const montserrat = loadMontserrat("normal", {
  weights: ["400", "500", "600", "700", "900"],
  subsets: ["latin", "latin-ext"],
});

// Michroma: tipografía ancha de la marca personal de Alejandra Torres.
const michroma = loadMichroma("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });

// Belamor es la fuente de los titulares de bitaxus.com (archivos en public/fonts).
const belamorWeights = [
  ["Regular", "400"],
  ["Medium", "500"],
  ["SemiBold", "600"],
  ["Bold", "700"],
] as const;

belamorWeights.forEach(([name, weight]) =>
  loadFont({
    family: "Belamor",
    url: staticFile(`fonts/Belamor-${name}.otf`),
    weight,
  }),
);

export const fonts = {
  display: "Belamor",
  body: montserrat.fontFamily,
  aleja: michroma.fontFamily,
};

export const colors = {
  black: "#000000",
  ink: "#0a0708",
  red: "#c1121f",
  redDeep: "#6e0a10",
  redGlow: "rgba(193, 18, 31, 0.55)",
  white: "#ffffff",
  whiteSoft: "rgba(255, 255, 255, 0.72)",
  whiteMuted: "rgba(255, 255, 255, 0.45)",
  glass: "rgba(0, 0, 0, 0.38)",
  glassBorder: "rgba(255, 255, 255, 0.5)",
  whatsappGreen: "#0b5c4b",
  whatsappBubble: "#d9fdd3",
  whatsappBg: "#efeae2",
  success: "#25d366",
};

export const FPS = 30;
