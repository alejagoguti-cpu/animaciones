import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BRANDS, BrandId } from "../src/editor/factory";

const BASE = import.meta.env.BASE_URL;
const KEY = "brand";

// Marca activa (Bitaxus o Alejandra Torres): se recuerda en el navegador y cambia
// los colores de la interfaz, las plantillas y los diseños nuevos.
const listeners = new Set<() => void>();
const read = (): BrandId => {
  try {
    return localStorage.getItem(KEY) === "aleja" ? "aleja" : "bitaxus";
  } catch {
    return "bitaxus";
  }
};
let current: BrandId = read();
const paint = () => {
  document.documentElement.dataset.brand = current;
};
paint();

export const setBrand = (b: BrandId) => {
  current = b;
  try {
    localStorage.setItem(KEY, b);
  } catch {
    // sin almacenamiento: la marca elegida no se recuerda
  }
  paint();
  listeners.forEach((l) => l());
};

export const useBrand = (): BrandId =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
  );

// Logo de cada marca para el encabezado.
export const BrandMark: React.FC<{ brand: BrandId; height?: number }> = ({ brand, height = 22 }) =>
  brand === "aleja" ? (
    <span style={{ display: "inline-flex", alignItems: "center", gap: height * 0.45 }}>
      <img src={`${BASE}assets/aleja/icono-blanco.png`} alt="" style={{ height: height * 1.5, width: "auto" }} />
      <span style={{ fontFamily: "Michroma, sans-serif", fontSize: height * 0.62, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
        ALEJANDRA TORRES
      </span>
    </span>
  ) : (
    <img src={`${BASE}logo.png`} alt="Bitaxus" style={{ height, width: "auto" }} />
  );

// Logo con menú: al desplegarlo se elige con qué marca se trabaja.
export const BrandSwitcher: React.FC<{ height?: number }> = ({ height = 22 }) => {
  const brand = useBrand();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div className="brand-switch" ref={ref}>
      <button className="brand-btn" onClick={() => setOpen((o) => !o)} title="Cambiar de marca" aria-haspopup="menu" aria-expanded={open}>
        <BrandMark brand={brand} height={height} />
        <span className="caret">▾</span>
      </button>
      {open && (
        <div className="brand-menu" role="menu">
          <small>Trabajar con la marca</small>
          {(Object.keys(BRANDS) as BrandId[]).map((b) => (
            <button
              key={b}
              role="menuitem"
              className={b === brand ? "on" : ""}
              onClick={() => {
                setBrand(b);
                setOpen(false);
              }}
            >
              <span className="mark">
                <BrandMark brand={b} height={18} />
              </span>
              <span className="check">{b === brand ? "✓" : ""}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
