import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BRAND_KIND, BRANDS, BrandId } from "../src/editor/factory";

const KEY = "brand";

// Marca activa (Bitaxus o Alejandra Torres): se recuerda en el navegador. Cambia los
// colores de la interfaz, los diseños y las plantillas que se muestran.
const listeners = new Set<() => void>();
const read = (): BrandId => {
  try {
    return localStorage.getItem(KEY) === "aleja" ? "aleja" : "bitaxus";
  } catch {
    return "bitaxus";
  }
};
let current: BrandId = read();

// Solo pinta los colores de la interfaz (sin cambiar la marca elegida en la lista).
export const paintBrand = (b: BrandId) => {
  document.documentElement.dataset.brand = b;
};
paintBrand(current);

export const setBrand = (b: BrandId) => {
  current = b;
  try {
    localStorage.setItem(KEY, b);
  } catch {
    // sin almacenamiento: la marca elegida no se recuerda
  }
  paintBrand(b);
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

// Cuadrito de cada marca: letra para la empresarial, persona para la personal.
const BrandTile: React.FC<{ brand: BrandId }> = ({ brand }) => (
  <span className="brand-tile">
    {brand === "bitaxus" ? (
      <b>B</b>
    ) : (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c.6-3.6 3.4-5.5 7-5.5s6.4 1.9 7 5.5" />
      </svg>
    )}
  </span>
);

// Nombre de la marca con menú: al desplegarlo se elige con qué marca se trabaja.
export const BrandSwitcher: React.FC = () => {
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
        <span className="brand-name">{BRANDS[brand].name}</span>
        <span className="caret">⌄</span>
      </button>
      {open && (
        <div className="brand-menu" role="menu">
          <small>SELECCIONAR MARCA</small>
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
              <BrandTile brand={b} />
              <span className="info">
                <b>{BRANDS[b].name}</b>
                <span>{BRAND_KIND[b]}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Etiqueta de la marca del diseño abierto (dentro del editor no se mezclan).
export const BrandTag: React.FC<{ brand: BrandId }> = ({ brand }) => (
  <span className="brand-tag" title={BRAND_KIND[brand]}>
    {BRANDS[brand].name}
  </span>
);
