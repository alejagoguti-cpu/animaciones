import React, { useEffect, useState } from "react";
import { BRAND, BRAND_KIND, BRANDS, BrandId, textPreset } from "../../src/editor/factory";
import { TEMPLATES } from "../../src/editor/templates";
import { buildPath, VECTOR_PRESETS } from "../../src/editor/vector";
import { Design, ElementType, FORMAT_SIZE } from "../../src/editor/types";
import { DesignPreview } from "../DesignList";
import { publicUrl, supabase, UPLOADS_BUCKET } from "../supabase";

export type Asset = {
  id: string;
  name: string;
  category: string;
  file: string;
  width: number;
  height: number;
  type: "image" | "video";
};

const BASE = import.meta.env.BASE_URL;
const assetUrl = (file: string) => (/^https?:/.test(file) ? file : `${BASE}${file}`);

type Tab = "plantillas" | "texto" | "elementos" | "vectores" | "marca" | "assets" | "subidas";

const TABS: [Tab, string, string][] = [
  ["plantillas", "▦", "Plantillas"],
  ["texto", "T", "Texto"],
  ["elementos", "◇", "Elementos"],
  ["vectores", "✎", "Vectores"],
  ["assets", "▣", "Fotos"],
  ["marca", "◉", "Marca"],
];

const CATEGORY: Record<string, string> = {
  logos: "Logos",
  fondos: "Fondos",
  mockups: "Mockups",
  iconos: "Íconos y monedas",
  piezas: "Piezas de marca",
  videos: "Videos",
};

type Props = {
  tab: Tab;
  setTab: (t: Tab) => void;
  onAdd: (type: ElementType, extra?: { src?: string; width?: number; height?: number; textKind?: Parameters<typeof textPreset>[0]; preset?: string }) => void;
  penActive: boolean;
  onPen: (on: boolean) => void;
  onTemplate: (d: Design, mode: "replace" | "append") => void;
  onAsset: (a: Asset) => void;
  onColor: (c: string) => void;
  onApplyBrand: (id: BrandId) => void;
  brand: BrandId;
  pickingBackground: boolean;
};

export const LeftPanel: React.FC<Props> = (p) => (
  <aside className="left">
    <nav className="left-tabs">
      {TABS.map(([id, ico, label]) => (
        <button key={id} className={p.tab === id ? "on" : ""} onClick={() => p.setTab(id)}>
          <span className="ico">{ico}</span>
          {label}
        </button>
      ))}
    </nav>
    <div className="left-content">
      {p.tab === "plantillas" && <Templates onTemplate={p.onTemplate} brand={p.brand} />}
      {p.tab === "texto" && <TextTab onAdd={p.onAdd} />}
      {p.tab === "elementos" && <ElementsTab onAdd={p.onAdd} />}
      {p.tab === "vectores" && <VectorsTab onAdd={p.onAdd} penActive={p.penActive} onPen={p.onPen} />}
      {p.tab === "marca" && <BrandTab brand={p.brand} onAdd={p.onAdd} onColor={p.onColor} onApplyBrand={p.onApplyBrand} />}
      {p.tab === "assets" && (
        <>
          <UploadsTab onAsset={p.onAsset} picking={p.pickingBackground} />
          {p.brand === "bitaxus" && <AssetsTab onAsset={p.onAsset} picking={p.pickingBackground} />}
        </>
      )}
    </div>
  </aside>
);

const Templates: React.FC<{ onTemplate: Props["onTemplate"]; brand: BrandId }> = ({ onTemplate, brand }) => (
  <section>
    <h3>Plantillas</h3>
    {TEMPLATES.filter((t) => t.id.startsWith("aleja-") === (brand === "aleja")).map((t) => {
      const d = t.make();
      return (
        <div key={t.id} className="tpl">
          <div className="tpl-thumb" style={{ aspectRatio: `${FORMAT_SIZE[d.format].width} / ${FORMAT_SIZE[d.format].height}` }}>
            <DesignPreview design={d} />
          </div>
          <div className="tpl-info">
            <b>{t.name}</b>
            <small>{t.description}</small>
            <div className="tpl-actions">
              <button className="btn small primary" onClick={() => window.confirm("Esto reemplaza el diseño actual. ¿Continuar?") && onTemplate(t.make(), "replace")}>
                Usar
              </button>
              <button className="btn small ghost" onClick={() => onTemplate(t.make(), "append")} title="Agrega sus escenas al final">
                + Escenas
              </button>
            </div>
          </div>
        </div>
      );
    })}
  </section>
);

const TextTab: React.FC<{ onAdd: Props["onAdd"] }> = ({ onAdd }) => (
  <section>
    <h3>Agregar texto</h3>
    <button className="preset" onClick={() => onAdd("text", { textKind: "titular" })}>
      <span className="display" style={{ fontSize: 24 }}>
        Titular
      </span>
      <small>Belamor, grande, palabra por palabra</small>
    </button>
    <button className="preset" onClick={() => onAdd("text", { textKind: "subtitulo" })}>
      <span className="display" style={{ fontSize: 16 }}>
        Subtítulo
      </span>
      <small>Belamor mediano</small>
    </button>
    <button className="preset" onClick={() => onAdd("text", { textKind: "parrafo" })}>
      <span style={{ fontSize: 14 }}>Párrafo de texto</span>
      <small>Montserrat, para frases y descripciones</small>
    </button>
    <button className="preset" onClick={() => onAdd("text", { textKind: "etiqueta" })}>
      <b style={{ fontSize: 12, letterSpacing: "0.14em" }}>ETIQUETA</b>
      <small>Montserrat en negrita, espaciada</small>
    </button>
  </section>
);

const ElementsTab: React.FC<{ onAdd: Props["onAdd"] }> = ({ onAdd }) => (
  <section>
    <h3>Componentes Bitaxus</h3>
    {(
      [
        ["pill", "Botón de vidrio", "Como “¿Y LA PLATA?” o “Hablemos →”"],
        ["card", "Tarjeta de beneficio", "Ícono, título y texto"],
        ["phone", "Teléfono con chat", "Conversación de WhatsApp animada"],
        ["counter", "Contador de monto", "Número que sube, con moneda"],
        ["logo", "Logo Bitaxus", "Se revela con brillo"],
      ] as [ElementType, string, string][]
    ).map(([t, name, desc]) => (
      <button key={t} className="preset" onClick={() => onAdd(t)}>
        <b>{name}</b>
        <small>{desc}</small>
      </button>
    ))}
    <h3 style={{ marginTop: 16 }}>Formas</h3>
    <button className="preset" onClick={() => onAdd("shape")}>
      <b>Rectángulo de vidrio</b>
      <small>Panel con borde blanco</small>
    </button>
  </section>
);

// Logos de la marca personal de Alejandra Torres (PNG con fondo transparente, recortados).
const ALEJA_LOGOS = [
  { id: "icono-turquesa", name: "Ícono turquesa", w: 1318, h: 1986, dark: true },
  { id: "icono-blanco", name: "Ícono blanco", w: 1318, h: 1986, dark: true },
  { id: "icono-negro", name: "Ícono negro", w: 1318, h: 1986, dark: false },
  { id: "icono-gris", name: "Ícono gris", w: 1318, h: 1986, dark: false },
  { id: "nombre-turquesa", name: "Con nombre turquesa", w: 1365, h: 1950, dark: true },
  { id: "nombre-blanco", name: "Con nombre blanco", w: 1365, h: 1950, dark: true },
  { id: "nombre-negro", name: "Con nombre negro", w: 1365, h: 1950, dark: false },
  { id: "nombre-gris", name: "Con nombre gris", w: 1365, h: 1950, dark: false },
];

const BrandTab: React.FC<{ brand: BrandId; onAdd: Props["onAdd"]; onColor: Props["onColor"]; onApplyBrand: Props["onApplyBrand"] }> = ({ brand, onAdd, onColor, onApplyBrand }) => {
  const other: BrandId = brand === "aleja" ? "bitaxus" : "aleja";
  const info = BRANDS[brand];
  return (
    <>
      <section>
        <h3>{info.name}</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          {BRAND_KIND[brand]}. Este diseño es de esta marca: solo se ven sus plantillas, logos y colores.
        </p>
        <button className="btn small" style={{ width: "100%" }} onClick={() => onApplyBrand(brand)}>
          Aplicar los colores de {info.name} a todas las escenas
        </button>
        <button
          className="btn small ghost"
          style={{ width: "100%", marginTop: 6 }}
          onClick={() => window.confirm(`Esto pasa el diseño a la marca ${BRANDS[other].name} (colores y resplandor de todas las escenas). ¿Continuar?`) && onApplyBrand(other)}
        >
          Pasar este diseño a {BRANDS[other].name}
        </button>
      </section>
      {brand === "aleja" ? (
        <>
          <section>
            <h3>Logos</h3>
            <div className="asset-grid">
              {ALEJA_LOGOS.map((l) => (
                <button
                  key={l.id}
                  className="asset"
                  title={l.name}
                  onClick={() => onAdd("image", { src: `assets/aleja/${l.id}.png`, width: l.w, height: l.h })}
                  style={{ backgroundColor: l.dark ? "#000" : "#fff", backgroundImage: `url("${BASE}assets/aleja/${l.id}.png")`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" }}
                />
              ))}
            </div>
          </section>
          <BrandColors palette={BRANDS.aleja.palette} onColor={onColor} />
          <section>
            <h3>Tipografías</h3>
            <div className="preset" style={{ cursor: "default" }}>
              <span style={{ fontSize: 15, fontFamily: "Michroma, sans-serif", letterSpacing: 1 }}>ALEJANDRA TORRES</span>
              <small>Michroma · nombre y titulares (elígela en Fuente)</small>
            </div>
            <div className="preset" style={{ cursor: "default" }}>
              <span style={{ fontSize: 18, fontWeight: 600 }}>Montserrat</span>
              <small>Textos y botones</small>
            </div>
          </section>
        </>
      ) : (
        <BitaxusBrand onAdd={onAdd} onColor={onColor} />
      )}
    </>
  );
};

const BrandColors: React.FC<{ palette: readonly string[]; onColor: Props["onColor"] }> = ({ palette, onColor }) => (
  <section>
    <h3>Colores</h3>
    <p className="muted" style={{ marginTop: 0 }}>
      Clic para aplicarlo al elemento seleccionado (o al acento del diseño si no hay ninguno).
    </p>
    <div className="swatches">
      {palette.map((c) => (
        <button key={c} className="swatch" style={{ background: c }} onClick={() => onColor(c)} title={c} />
      ))}
    </div>
  </section>
);

const BitaxusBrand: React.FC<{ onAdd: Props["onAdd"]; onColor: Props["onColor"] }> = ({ onAdd, onColor }) => (
  <>
    <section>
      <h3>Logo</h3>
      <button className="preset" onClick={() => onAdd("logo")} style={{ background: "#000" }}>
        <img src={`${BASE}logo.png`} alt="Bitaxus" style={{ width: "100%" }} />
      </button>
    </section>
    <section>
      <h3>Colores</h3>
      <p className="muted" style={{ marginTop: 0 }}>
        Clic para aplicarlo al elemento seleccionado (o al acento del diseño si no hay ninguno).
      </p>
      <div className="swatches">
        {BRAND.palette.map((c) => (
          <button key={c} className="swatch" style={{ background: c }} onClick={() => onColor(c)} title={c} />
        ))}
      </div>
    </section>
    <section>
      <h3>Tipografías</h3>
      <div className="preset" style={{ cursor: "default" }}>
        <span className="display" style={{ fontSize: 22 }}>
          Belamor
        </span>
        <small>Titulares</small>
      </div>
      <div className="preset" style={{ cursor: "default" }}>
        <span style={{ fontSize: 18, fontWeight: 600 }}>Montserrat</span>
        <small>Textos y botones</small>
      </div>
    </section>
  </>
);

const AssetGrid: React.FC<{ assets: Asset[]; onAsset: (a: Asset) => void }> = ({ assets, onAsset }) => (
  <div className="asset-grid">
    {assets.map((a) =>
      a.type === "video" ? (
        <button key={a.id} className="asset" onClick={() => onAsset(a)} title={a.name}>
          <video src={assetUrl(a.file)} muted preload="metadata" />
          <span className="tag">Video</span>
        </button>
      ) : (
        <button
          key={a.id}
          className="asset"
          onClick={() => onAsset(a)}
          title={a.name}
          style={{ backgroundImage: `url("${assetUrl(a.file)}")` }}
        />
      ),
    )}
  </div>
);

const AssetsTab: React.FC<{ onAsset: (a: Asset) => void; picking: boolean }> = ({ onAsset, picking }) => {
  const [assets, setAssets] = useState<Asset[] | null>(null);
  useEffect(() => {
    fetch(`${BASE}assets/manifest.json`)
      .then((r) => r.json())
      .then(setAssets)
      .catch(() => setAssets([]));
  }, []);
  if (!assets) return <p className="muted">Cargando…</p>;
  const cats = [...new Set(assets.map((a) => a.category))];
  return (
    <>
      {picking && <p style={{ color: "#ff8a92", marginTop: 0 }}>Elige una imagen para el fondo de la escena.</p>}
      {cats.map((c) => (
        <section key={c}>
          <h3>{CATEGORY[c] ?? c}</h3>
          <AssetGrid assets={assets.filter((a) => a.category === c && (!picking || a.type === "image"))} onAsset={onAsset} />
        </section>
      ))}
    </>
  );
};

const UPLOAD_DIR = "files";

const UploadsTab: React.FC<{ onAsset: (a: Asset) => void; picking: boolean }> = ({ onAsset, picking }) => {
  const [files, setFiles] = useState<Asset[] | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const { data, error } = await supabase.storage
      .from(UPLOADS_BUCKET)
      .list(UPLOAD_DIR, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
    if (error) return setError(error.message);
    setFiles(
      (data ?? [])
        .filter((f) => f.name && !f.name.startsWith("."))
        .map((f) => {
          const meta = (f.metadata ?? {}) as { mimetype?: string };
          const [, w, h] = f.name.match(/__(\d+)x(\d+)__/) ?? [];
          return {
            id: f.name,
            name: f.name.replace(/^\d+-/, "").replace(/__\d+x\d+__/, ""),
            category: "subidas",
            file: publicUrl(`${UPLOAD_DIR}/${f.name}`),
            width: Number(w) || 800,
            height: Number(h) || 800,
            type: meta.mimetype?.startsWith("video") ? "video" : "image",
          } as Asset;
        }),
    );
  };

  useEffect(() => {
    load();
  }, []);

  const measure = (file: File) =>
    new Promise<{ w: number; h: number }>((resolve) => {
      const url = URL.createObjectURL(file);
      if (file.type.startsWith("video")) {
        const v = document.createElement("video");
        v.onloadedmetadata = () => resolve({ w: v.videoWidth, h: v.videoHeight });
        v.onerror = () => resolve({ w: 1080, h: 1920 });
        v.src = url;
      } else {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ w: 800, h: 800 });
        img.src = url;
      }
    });

  const upload = async (list: FileList | null) => {
    if (!list) return;
    setError("");
    for (const file of Array.from(list)) {
      setBusy(`Subiendo ${file.name}…`);
      const { w, h } = await measure(file);
      const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
      const safe = file.name
        .slice(0, file.name.length - ext.length)
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^\w-]+/g, "-")
        .slice(0, 40);
      const path = `${UPLOAD_DIR}/${Date.now()}-${safe}__${w}x${h}__${ext.toLowerCase()}`;
      const { error } = await supabase.storage.from(UPLOADS_BUCKET).upload(path, file, { contentType: file.type });
      if (error) setError(`${file.name}: ${error.message}`);
    }
    setBusy("");
    load();
  };

  return (
    <>
      <section>
        <h3>Subir</h3>
        <label className="btn primary" style={{ width: "100%" }}>
          ⇪ Subir imagen o video
          <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple hidden onChange={(e) => upload(e.target.files)} />
        </label>
        <p className="muted">PNG, JPG, WEBP, SVG, MP4 o WEBM, hasta 50 MB. Se guardan en la nube y los ve todo el equipo.</p>
        {busy && <p>{busy}</p>}
        {error && <p className="error">{error}</p>}
      </section>
      {picking && <p style={{ color: "#ff8a92" }}>Elige una imagen para el fondo de la escena.</p>}
      {files === null ? (
        <p className="muted">Cargando…</p>
      ) : files.length === 0 ? (
        <p className="muted">Todavía no has subido archivos.</p>
      ) : (
        <AssetGrid assets={files.filter((f) => !picking || f.type === "image")} onAsset={onAsset} />
      )}
    </>
  );
};

const VectorsTab: React.FC<{ onAdd: Props["onAdd"]; penActive: boolean; onPen: (on: boolean) => void }> = ({ onAdd, penActive, onPen }) => (
  <>
    <section>
      <h3>Dibujar</h3>
      <button className={`btn ${penActive ? "primary" : ""}`} style={{ width: "100%" }} onClick={() => onPen(!penActive)}>
        ✎ {penActive ? "Dibujando… (Enter para terminar)" : "Pluma: dibujar un vector"}
      </button>
      <p className="muted" style={{ lineHeight: 1.5 }}>
        Clic para poner puntos rectos; clic y arrastrar para curvas. Clic en el primer punto cierra la forma. Enter o doble clic termina; Esc
        cancela. Después, doble clic sobre el vector para editar sus puntos.
      </p>
    </section>
    <section>
      <h3>Formas e íconos</h3>
      <div className="asset-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        {VECTOR_PRESETS.map((v) => (
          <button key={v.id} className="asset" title={v.name} onClick={() => onAdd("vector", { preset: v.id })} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="-8 -8 116 116" width="70%" height="70%" style={{ overflow: "visible" }}>
              <path
                d={buildPath(v.nodes, v.closed, 100, 100 * (v.ratio ?? 1) > 100 ? 100 : 100 * (v.ratio ?? 1))}
                fill={v.outline || !v.closed ? "none" : "#c1121f"}
                stroke="#fff"
                strokeWidth={v.outline ? 8 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}
      </div>
    </section>
  </>
);
