import React, { useEffect, useRef, useState } from "react";
import { fonts } from "../../src/theme";
import { ElementData } from "../../src/editor/types";

// Edición del texto directamente sobre el lienzo (doble clic).
export const InlineText: React.FC<{
  el: Extract<ElementData, { type: "text" | "pill" }>;
  scale: number;
  onCommit: (text: string) => void;
  onClose: () => void;
}> = ({ el, scale, onCommit, onClose }) => {
  const [value, setValue] = useState(el.props.text);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = ref.current;
    if (!t) return;
    t.focus();
    t.select();
  }, []);

  const done = () => {
    if (value !== el.props.text) onCommit(value);
    onClose();
  };

  const isText = el.type === "text";
  const p = el.props;
  const style: React.CSSProperties = isText
    ? {
        fontFamily: p.font === "display" ? fonts.display : fonts.body,
        fontWeight: el.type === "text" ? el.props.weight : 700,
        fontStyle: el.props.italic ? "italic" : "normal",
        fontSize: p.size * scale,
        lineHeight: el.type === "text" ? el.props.lineHeight : 1.2,
        letterSpacing: el.type === "text" ? `${el.props.letterSpacing}em` : undefined,
        textAlign: el.type === "text" ? el.props.align : "center",
        textTransform: el.type === "text" && el.props.uppercase ? "uppercase" : "none",
        color: el.type === "text" ? el.props.color : "#fff",
      }
    : {
        fontFamily: p.font === "display" ? fonts.display : fonts.body,
        fontWeight: 700,
        fontStyle: el.props.italic ? "italic" : "normal",
        fontSize: p.size * scale,
        lineHeight: `${el.h * scale}px`,
        textAlign: "center",
        color: "#fff",
      };

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={done}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") onClose();
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey || !isText)) {
          e.preventDefault();
          done();
        }
      }}
      spellCheck={false}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        minHeight: "100%",
        padding: 0,
        margin: 0,
        border: "none",
        outline: "2px solid #3ad0ff",
        background: "rgba(0,0,0,0.35)",
        resize: "none",
        overflow: "hidden",
        whiteSpace: "pre-wrap",
        zIndex: 7,
        cursor: "text",
        ...style,
      }}
    />
  );
};

// Edición de la tarjeta sobre el lienzo: ícono, título y texto. Usa las mismas
// medidas con que se dibuja la tarjeta (920 px de ancho, escalada).
export const InlineCard: React.FC<{
  el: Extract<ElementData, { type: "card" }>;
  scale: number;
  onCommit: (props: { icon: string; title: string; text: string }) => void;
  onClose: () => void;
}> = ({ el, scale, onCommit, onClose }) => {
  const [icon, setIcon] = useState(el.props.icon);
  const [title, setTitle] = useState(el.props.title);
  const [text, setText] = useState(el.props.text);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const s = (el.w / 920) * scale;

  useEffect(() => {
    titleRef.current?.focus();
    titleRef.current?.select();
  }, []);

  const done = (e: React.FocusEvent) => {
    // Solo se cierra cuando el foco sale de los tres campos.
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    if (icon !== el.props.icon || title !== el.props.title || text !== el.props.text) onCommit({ icon, title, text });
    onClose();
  };

  const field: React.CSSProperties = {
    width: "100%",
    margin: 0,
    padding: 0,
    border: "none",
    outline: "3px solid #3ad0ff",
    background: "rgba(0,0,0,0.45)",
    resize: "none",
    overflow: "hidden",
    fontFamily: fonts.body,
    color: "#fff",
    whiteSpace: "pre-wrap",
    cursor: "text",
    // Se agranda con el texto (Chrome y Edge).
    ["fieldSizing" as string]: "content",
  };

  return (
    <div
      onBlur={done}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") onClose();
      }}
      style={{ position: "absolute", left: 0, top: 0, width: 920, height: el.h / (el.w / 920), transform: `scale(${s})`, transformOrigin: "top left", zIndex: 7 }}
    >
      <input
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
        maxLength={3}
        spellCheck={false}
        style={{ position: "absolute", left: 40, top: "50%", transform: "translateY(-50%)", width: 110, height: 110, borderRadius: 55, border: "none", outline: "3px solid #3ad0ff", background: "rgba(255,255,255,0.9)", color: "#6e0a10", fontSize: 56, fontWeight: 900, textAlign: "center", fontFamily: fonts.body }}
      />
      <div style={{ position: "absolute", left: 174, right: 40, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
        <textarea
          ref={titleRef}
          rows={1}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              (e.currentTarget.parentElement?.querySelector("textarea:last-of-type") as HTMLElement | null)?.focus();
            }
          }}
          spellCheck={false}
          style={{ ...field, fontSize: 46, fontWeight: 700, lineHeight: 1.2 }}
        />
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          style={{ ...field, fontSize: 32, lineHeight: 1.3, color: "rgba(255,255,255,0.85)" }}
        />
      </div>
    </div>
  );
};
