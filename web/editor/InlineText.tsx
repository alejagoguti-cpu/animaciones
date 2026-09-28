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
