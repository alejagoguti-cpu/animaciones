import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadAudiowide } from "@remotion/google-fonts/Audiowide";

// Montserrat es la fuente de texto de bitaxus.com.
const montserrat = loadMontserrat("normal", {
  weights: ["400", "500", "600", "700", "900"],
  subsets: ["latin", "latin-ext"],
});

// La web usa "Belamor" para los titulares. Audiowide es el reemplazo libre
// más parecido; si tienes la licencia de Belamor, mira el README para usarla.
const audiowide = loadAudiowide("normal", {
  weights: ["400"],
  subsets: ["latin", "latin-ext"],
});

export const fonts = {
  display: audiowide.fontFamily,
  body: montserrat.fontFamily,
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
