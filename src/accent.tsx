import React, { createContext, useContext } from "react";

// Color de acento del video (rojo Bitaxus por defecto), editable desde el
// panel de props. Los componentes lo leen con useAccent().
const AccentContext = createContext("#c1121f");

export const AccentProvider: React.FC<{ color: string; children: React.ReactNode }> = ({
  color,
  children,
}) => <AccentContext.Provider value={color}>{children}</AccentContext.Provider>;

const parseHex = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [193, 18, 31];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const useAccent = () => {
  const hex = useContext(AccentContext);
  const [r, g, b] = parseHex(hex);
  return {
    color: hex,
    // El acento con transparencia.
    alpha: (a: number) => `rgba(${r},${g},${b},${a})`,
    // Versión oscura del acento, para degradados.
    deep: (a = 1) => `rgba(${Math.round(r * 0.57)},${Math.round(g * 0.55)},${Math.round(b * 0.52)},${a})`,
    // Versión clara, para textos destacados.
    light: `rgb(${Math.min(255, r + 62)},${Math.min(255, g + 72)},${Math.min(255, b + 69)})`,
  };
};
