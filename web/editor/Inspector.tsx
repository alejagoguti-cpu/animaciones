import React from "react";
import { uid } from "../../src/editor/factory";
import {
  BackgroundKind,
  Design,
  ElementData,
  EnterKind,
  ExitKind,
  Format,
  FORMAT_SIZE,
  GlowLight,
  LoopKind,
  Scene,
  Transition,
} from "../../src/editor/types";
import { Check, ColorField, Field, NumberField, Section, SelectField, TextField } from "./fields";

const ENTER: [EnterKind, string][] = [
  ["none", "Sin animación"],
  ["fade", "Aparecer"],
  ["up", "Subir"],
  ["down", "Bajar"],
  ["left", "Desde la izquierda"],
  ["right", "Desde la derecha"],
  ["pop", "Rebote"],
  ["zoom", "Acercar"],
  ["blur", "Desenfoque"],
  ["reveal", "Revelar"],
  ["words", "Palabra por palabra"],
  ["typewriter", "Máquina de escribir"],
];
const EXIT: [ExitKind, string][] = [
  ["none", "Sin animación"],
  ["fade", "Desvanecer"],
  ["up", "Subir"],
  ["down", "Bajar"],
  ["zoom", "Alejar"],
  ["blur", "Desenfoque"],
];
const LOOP: [LoopKind, string][] = [
  ["none", "Ninguno"],
  ["float", "Flotar"],
  ["pulse", "Latido"],
  ["spin", "Girar"],
];
const TRANSITIONS: [Transition, string][] = [
  ["none", "Corte directo"],
  ["fade", "Fundido"],
  ["slide-left", "Deslizar ←"],
  ["slide-up", "Deslizar ↑"],
  ["wipe", "Barrido"],
];
import { GLOW_STYLES } from "../../src/editor/render/glowStyles";

const BACKGROUNDS: [BackgroundKind, string][] = [
  ["glow", "Resplandor Bitaxus"],
  ["solid", "Color sólido"],
  ["gradient", "Degradado"],
  ["image", "Imagen"],
];

type ElProps = {
  el: ElementData;
  sceneDuration: number;
  onChange: (fn: (e: ElementData) => ElementData) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onLayer: (dir: "up" | "down" | "top" | "bottom") => void;
  textRef: React.Ref<HTMLTextAreaElement>;
  editingPoints: boolean;
  onEditPoints: (on: boolean) => void;
};

export const ElementInspector: React.FC<ElProps> = ({ el, sceneDuration, onChange, onDelete, onDuplicate, onLayer, textRef, editingPoints, onEditPoints }) => {
  const set = <K extends keyof ElementData>(k: K, v: ElementData[K]) => onChange((e) => ({ ...e, [k]: v }) as ElementData);
  const setProp = (k: string, v: unknown) =>
    onChange((e) => ({ ...e, props: { ...(e.props as Record<string, unknown>), [k]: v } }) as ElementData);

  return (
    <>
      <Section title="Elemento">
        <TextField label="Nombre" value={el.name ?? ""} onChange={(v) => set("name", v)} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button className="btn small" onClick={onDuplicate} title="Ctrl+D">
            Duplicar
          </button>
          <button className="btn small" onClick={() => onLayer("up")} title="Traer adelante">
            ↑ Adelante
          </button>
          <button className="btn small" onClick={() => onLayer("down")} title="Enviar atrás">
            ↓ Atrás
          </button>
          <button className="btn small" onClick={() => set("locked", !el.locked)}>
            {el.locked ? "Desbloquear" : "Bloquear"}
          </button>
          <button className="btn small danger" onClick={onDelete} title="Supr">
            Eliminar
          </button>
        </div>
      </Section>

      <TypeFields el={el} setProp={setProp} textRef={textRef} editingPoints={editingPoints} onEditPoints={onEditPoints} />

      <Section title="Animación">
        <div className="row">
          <SelectField label="Entrada" value={el.enter.kind} options={ENTER} onChange={(v) => set("enter", { ...el.enter, kind: v })} />
          <NumberField label="Duración (s)" value={el.enter.duration} step={0.1} min={0.1} max={5} onChange={(v) => set("enter", { ...el.enter, duration: v })} />
        </div>
        <div className="row">
          <SelectField label="Salida" value={el.exit.kind} options={EXIT} onChange={(v) => set("exit", { ...el.exit, kind: v })} />
          <NumberField label="Duración (s)" value={el.exit.duration} step={0.1} min={0.1} max={5} onChange={(v) => set("exit", { ...el.exit, duration: v })} />
        </div>
        <SelectField label="Movimiento continuo" value={el.loop} options={LOOP} onChange={(v) => set("loop", v)} />
        <div className="row">
          <NumberField label="Aparece (s)" value={el.start} step={0.1} min={0} max={el.end - 0.1} onChange={(v) => set("start", v)} />
          <NumberField label="Se va (s)" value={el.end} step={0.1} min={el.start + 0.1} max={sceneDuration} onChange={(v) => set("end", v)} />
        </div>
      </Section>

      <Section title="Posición" closed>
        <div className="row">
          <NumberField label="X" value={el.x} onChange={(v) => set("x", v)} />
          <NumberField label="Y" value={el.y} onChange={(v) => set("y", v)} />
          <NumberField label="Ancho" value={el.w} min={10} onChange={(v) => set("w", v)} />
          <NumberField label="Alto" value={el.h} min={10} onChange={(v) => set("h", v)} />
          <NumberField label="Rotación (°)" value={el.rotation} onChange={(v) => set("rotation", v)} />
          <NumberField label="Opacidad (%)" value={Math.round(el.opacity * 100)} min={0} max={100} onChange={(v) => set("opacity", v / 100)} />
        </div>
      </Section>
    </>
  );
};

const TypeFields: React.FC<{
  el: ElementData;
  setProp: (k: string, v: unknown) => void;
  textRef: React.Ref<HTMLTextAreaElement>;
  editingPoints: boolean;
  onEditPoints: (on: boolean) => void;
}> = ({ el, setProp, textRef, editingPoints, onEditPoints }) => {
  switch (el.type) {
    case "vector": {
      const p = el.props;
      return (
        <Section title="Vector">
          <button className={`btn small ${editingPoints ? "primary" : ""}`} style={{ marginBottom: 10 }} onClick={() => onEditPoints(!editingPoints)}>
            {editingPoints ? "✓ Listo con los puntos" : "✎ Editar puntos (doble clic)"}
          </button>
          {editingPoints && (
            <p className="muted" style={{ marginTop: 0, lineHeight: 1.5 }}>
              Arrastra los puntos blancos para mover y las manijas rojas para curvar. Alt + clic en un punto lo vuelve curvo o recto; Supr borra el
              punto seleccionado.
            </p>
          )}
          <Check label="Trazo cerrado (con relleno)" value={p.closed} onChange={(v) => setProp("closed", v)} />
          {p.closed && (
            <>
              <ColorField label="Relleno" value={p.fill === "transparent" ? "#000000" : p.fill} onChange={(v) => setProp("fill", v)} />
              <Check label="Sin relleno" value={p.fill === "transparent"} onChange={(v) => setProp("fill", v ? "transparent" : "#c1121f")} />
              <Check label="Degradado" value={!!p.fill2} onChange={(v) => setProp("fill2", v ? "#6e0a10" : "")} />
              {p.fill2 && <ColorField label="Segundo color" value={p.fill2} onChange={(v) => setProp("fill2", v)} />}
            </>
          )}
          <ColorField label="Borde" value={p.stroke} onChange={(v) => setProp("stroke", v)} />
          <NumberField label="Grosor del borde" value={p.strokeWidth} min={0} onChange={(v) => setProp("strokeWidth", v)} />
          <Check label="Brillo del color de acento" value={p.glow} onChange={(v) => setProp("glow", v)} />
        </Section>
      );
    }
    case "text": {
      const p = el.props;
      return (
        <Section title="Texto">
          <TextField label="Contenido" value={p.text} multiline inputRef={textRef} onChange={(v) => setProp("text", v)} />
          <div className="row">
            <SelectField label="Fuente" value={p.font} options={[["display", "Belamor (titular)"], ["body", "Montserrat (texto)"]]} onChange={(v) => setProp("font", v)} />
            <SelectField
              label="Grosor"
              value={String(p.weight) as "400"}
              options={[["400", "Normal"], ["500", "Medio"], ["600", "Semi"], ["700", "Negrita"], ["900", "Black"]] as ["400", string][]}
              onChange={(v) => setProp("weight", Number(v))}
            />
            <NumberField label="Tamaño" value={p.size} min={8} onChange={(v) => setProp("size", v)} />
            <NumberField label="Interlineado" value={p.lineHeight} step={0.05} min={0.6} max={3} onChange={(v) => setProp("lineHeight", v)} />
            <NumberField label="Espaciado letras" value={p.letterSpacing} step={0.01} onChange={(v) => setProp("letterSpacing", v)} />
            <SelectField label="Alineación" value={p.align} options={[["left", "Izquierda"], ["center", "Centro"], ["right", "Derecha"]]} onChange={(v) => setProp("align", v)} />
            <SelectField label="Posición vertical" value={p.valign ?? "top"} options={[["top", "Arriba"], ["middle", "Centro"], ["bottom", "Abajo"]]} onChange={(v) => setProp("valign", v)} />
            <NumberField label="Subir / bajar (px)" value={p.offsetY ?? 0} step={2} onChange={(v) => setProp("offsetY", v)} />
          </div>
          <ColorField label="Color" value={p.color} onChange={(v) => setProp("color", v)} />
          <Check label="MAYÚSCULAS" value={p.uppercase} onChange={(v) => setProp("uppercase", v)} />
          <Check label="Brillo del color de acento" value={p.glow} onChange={(v) => setProp("glow", v)} />
        </Section>
      );
    }
    case "image":
    case "video":
      return (
        <Section title={el.type === "image" ? "Imagen" : "Video"}>
          <SelectField label="Ajuste" value={el.props.fit} options={[["contain", "Completa"], ["cover", "Rellenar caja"]]} onChange={(v) => setProp("fit", v)} />
          <NumberField label="Esquinas redondeadas" value={el.props.radius} min={0} onChange={(v) => setProp("radius", v)} />
          {el.type === "video" && <Check label="Sin sonido" value={el.props.muted} onChange={(v) => setProp("muted", v)} />}
        </Section>
      );
    case "logo":
      return (
        <Section title="Logo">
          <Check label="Brillo del color de acento" value={el.props.glow} onChange={(v) => setProp("glow", v)} />
        </Section>
      );
    case "shape":
      return (
        <Section title="Forma">
          <SelectField label="Tipo" value={el.props.shape} options={[["rect", "Rectángulo"], ["circle", "Círculo"]]} onChange={(v) => setProp("shape", v)} />
          <ColorField label="Relleno" value={el.props.fill} onChange={(v) => setProp("fill", v)} />
          <div className="row">
            <NumberField label="Esquinas" value={el.props.radius} min={0} onChange={(v) => setProp("radius", v)} />
            <NumberField label="Borde (px)" value={el.props.borderWidth} min={0} onChange={(v) => setProp("borderWidth", v)} />
          </div>
          <ColorField label="Color del borde" value={el.props.borderColor} onChange={(v) => setProp("borderColor", v)} />
        </Section>
      );
    case "pill":
      return (
        <Section title="Botón de vidrio">
          <TextField label="Texto" value={el.props.text} multiline inputRef={textRef} onChange={(v) => setProp("text", v)} />
          <div className="row">
            <NumberField label="Tamaño" value={el.props.size} min={8} onChange={(v) => setProp("size", v)} />
            <SelectField label="Fuente" value={el.props.font} options={[["display", "Belamor"], ["body", "Montserrat"]]} onChange={(v) => setProp("font", v)} />
            <SelectField label="Posición vertical" value={el.props.valign ?? "middle"} options={[["top", "Arriba"], ["middle", "Centro"], ["bottom", "Abajo"]]} onChange={(v) => setProp("valign", v)} />
            <NumberField label="Subir / bajar (px)" value={el.props.offsetY ?? 0} step={2} onChange={(v) => setProp("offsetY", v)} />
          </div>
          <Check label="Resplandor" value={el.props.glow} onChange={(v) => setProp("glow", v)} />
          <Check label="Destello" value={el.props.shine} onChange={(v) => setProp("shine", v)} />
        </Section>
      );
    case "card":
      return (
        <Section title="Tarjeta">
          <TextField label="Ícono" value={el.props.icon} onChange={(v) => setProp("icon", v)} />
          <TextField label="Título" value={el.props.title} onChange={(v) => setProp("title", v)} />
          <TextField label="Texto" value={el.props.text} multiline inputRef={textRef} onChange={(v) => setProp("text", v)} />
          <Check label="Resplandor" value={el.props.glow} onChange={(v) => setProp("glow", v)} />
        </Section>
      );
    case "counter":
      return (
        <Section title="Contador">
          <TextField label="Etiqueta" value={el.props.label} onChange={(v) => setProp("label", v)} />
          <div className="row">
            <TextField label="Moneda" value={el.props.currency} onChange={(v) => setProp("currency", v)} />
            <NumberField label="Tamaño" value={el.props.size} min={8} onChange={(v) => setProp("size", v)} />
            <NumberField label="Desde" value={el.props.from} onChange={(v) => setProp("from", v)} />
            <NumberField label="Hasta" value={el.props.to} onChange={(v) => setProp("to", v)} />
          </div>
          <NumberField label="Tarda en contar (s)" value={el.props.countDuration} step={0.1} min={0.1} onChange={(v) => setProp("countDuration", v)} />
          <ColorField label="Color del número" value={el.props.color} onChange={(v) => setProp("color", v)} />
        </Section>
      );
    case "phone": {
      const msgs = el.props.messages;
      const setMsgs = (m: typeof msgs) => setProp("messages", m);
      return (
        <Section title="Chat de WhatsApp">
          <TextField label="Nombre del contacto" value={el.props.contactName} onChange={(v) => setProp("contactName", v)} />
          <Field label="Mensajes (aparecen en orden)">
            {msgs.map((m, i) => (
              <div key={`${i}-${m.from}-${m.time}-${m.text}`} className="msg">
                <div className="row" style={{ marginBottom: 6 }}>
                  <select
                    className="input"
                    value={m.from}
                    onChange={(e) => setMsgs(msgs.map((x, j) => (j === i ? { ...x, from: e.target.value as "cliente" | "bitaxus" } : x)))}
                  >
                    <option value="cliente">Cliente</option>
                    <option value="bitaxus">Contacto</option>
                  </select>
                  <input
                    className="input"
                    defaultValue={m.time}
                    onBlur={(e) => setMsgs(msgs.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))}
                  />
                </div>
                <textarea
                  className="input"
                  defaultValue={m.text}
                  rows={2}
                  onBlur={(e) => setMsgs(msgs.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
                />
                <button className="btn small danger" style={{ marginTop: 6 }} onClick={() => setMsgs(msgs.filter((_, j) => j !== i))}>
                  Quitar
                </button>
              </div>
            ))}
            <button
              className="btn small"
              onClick={() => setMsgs([...msgs, { from: msgs.at(-1)?.from === "cliente" ? "bitaxus" : "cliente", text: "Nuevo mensaje", time: "10:48 AM" }])}
            >
              + Mensaje
            </button>
          </Field>
        </Section>
      );
    }
  }
};

type SceneProps = {
  design: Design;
  scene: Scene;
  onScene: (fn: (s: Scene) => Scene) => void;
  onDesign: (fn: (d: Design) => Design) => void;
  onFormat: (f: Format) => void;
  pickImage: () => void;
};

export const SceneInspector: React.FC<SceneProps> = ({ design, scene, onScene, onDesign, onFormat, pickImage }) => {
  const bg = scene.background;
  const setBg = (patch: Partial<Scene["background"]>) => onScene((s) => ({ ...s, background: { ...s.background, ...patch } }));
  const setDuration = (v: number) =>
    onScene((s) => ({
      ...s,
      duration: v,
      // Los elementos que terminaban al final siguen hasta el final.
      elements: s.elements.map((e) => ({
        ...e,
        end: e.end >= s.duration - 0.05 ? v : Math.min(e.end, v),
        start: Math.min(e.start, Math.max(0, v - 0.2)),
      })),
    }));
  return (
    <>
      <Section title="Escena">
        <TextField label="Nombre" value={scene.name} onChange={(v) => onScene((s) => ({ ...s, name: v }))} />
        <div className="row">
          <NumberField
            label="Duración (s)"
            value={scene.duration}
            step={0.5}
            min={0.5}
            max={60}
            onChange={setDuration}
          />
          <SelectField label="Transición de entrada" value={scene.transition} options={TRANSITIONS} onChange={(v) => onScene((s) => ({ ...s, transition: v }))} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {[3, 4, 5, 6, 7, 8, 10, 15].map((d) => (
            <button key={d} className={`chip ${scene.duration === d ? "on" : ""}`} onClick={() => setDuration(d)}>
              {d} s
            </button>
          ))}
        </div>
      </Section>

      <Section title="Fondo">
        <SelectField label="Tipo" value={bg.kind} options={BACKGROUNDS} onChange={(v) => setBg({ kind: v })} />
        {bg.kind === "glow" && (
          <>
            <SelectField label="Estilo del resplandor" value={bg.glowStyle ?? "orbes"} options={GLOW_STYLES} onChange={(v) => setBg({ glowStyle: v, glowPoints: undefined })} />
            <NumberField label="Intensidad (1 = normal)" value={bg.glowIntensity ?? 1} step={0.1} min={0.2} max={1.4} onChange={(v) => setBg({ glowIntensity: v })} />
          </>
        )}
        {bg.kind === "glow" && (
          <>
            <p className="muted" style={{ margin: 0 }}>Arrastra los puntos blancos del lienzo para mover la luz (con la escena sin nada seleccionado).</p>
            {bg.glowPoints && <button className="btn small" onClick={() => setBg({ glowPoints: undefined })}>Restablecer posición</button>}
            <button
              className="btn small"
              onClick={() =>
                setBg({
                  glowLights: [...(bg.glowLights ?? []), { id: uid(), x: 0.3 + Math.random() * 0.4, y: 0.3 + Math.random() * 0.4, size: 0.5, color: bg.color }],
                })
              }
            >
              + Agregar luz
            </button>
            {(bg.glowLights ?? []).map((l, i) => {
              const setLight = (patch: Partial<GlowLight>) =>
                setBg({ glowLights: (bg.glowLights ?? []).map((x) => (x.id === l.id ? { ...x, ...patch } : x)) });
              return (
                <div key={l.id} className="row" style={{ alignItems: "flex-end" }}>
                  <ColorField label={`Luz ${i + 1}`} value={l.color} onChange={(v) => setLight({ color: v })} />
                  <NumberField label="Tamaño" value={l.size} step={0.1} min={0.1} max={2} onChange={(v) => setLight({ size: v })} />
                  <button className="btn small" onClick={() => setBg({ glowLights: (bg.glowLights ?? []).filter((x) => x.id !== l.id) })}>
                    Quitar
                  </button>
                </div>
              );
            })}
          </>
        )}
        {bg.kind !== "image" && (
          <ColorField label={bg.kind === "glow" ? "Color del resplandor" : "Color"} value={bg.color} onChange={(v) => setBg({ color: v })} />
        )}
        {(bg.kind === "gradient" || bg.kind === "glow" || bg.kind === "image") && (
          <ColorField label={bg.kind === "gradient" ? "Segundo color" : "Color base"} value={bg.color2} onChange={(v) => setBg({ color2: v })} />
        )}
        {bg.kind === "image" && (
          <button className="btn small" onClick={pickImage}>
            {bg.image ? "Cambiar imagen" : "Elegir imagen"} (pestaña Assets)
          </button>
        )}
        <Check label="Rejilla de puntos" value={bg.dots} onChange={(v) => setBg({ dots: v })} />
      </Section>

      <Section title="Diseño">
        <SelectField
          label="Formato"
          value={design.format}
          options={(Object.keys(FORMAT_SIZE) as Format[]).map((f) => [f, FORMAT_SIZE[f].label])}
          onChange={onFormat}
        />
        <ColorField label="Color de acento (brillos, botones)" value={design.accent} onChange={(v) => onDesign((d) => ({ ...d, accent: v }))} />
        <p className="muted" style={{ lineHeight: 1.5 }}>
          Haz clic en un elemento del lienzo para editarlo. Doble clic sobre un texto para cambiar lo que dice.
        </p>
      </Section>
    </>
  );
};
