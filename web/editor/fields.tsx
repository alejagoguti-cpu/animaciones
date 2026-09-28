import React, { useEffect, useState } from "react";
import { BRAND } from "../../src/editor/factory";

// Campos del panel de propiedades. `onChange` se llama al confirmar (blur/Enter)
// en los numéricos y de texto, para no llenar el historial de deshacer.

export const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="field">
    <label>{label}</label>
    {children}
  </div>
);

export const NumberField: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}> = ({ label, value, onChange, step = 1, min, max }) => {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const done = () => {
    let n = Number(draft.replace(",", "."));
    if (Number.isNaN(n)) return setDraft(String(value));
    if (min !== undefined) n = Math.max(min, n);
    if (max !== undefined) n = Math.min(max, n);
    if (n !== value) onChange(n);
    else setDraft(String(value));
  };
  return (
    <Field label={label}>
      <input
        className="input"
        type="number"
        step={step}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={done}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      />
    </Field>
  );
};

export const TextField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  inputRef?: React.Ref<HTMLTextAreaElement>;
}> = ({ label, value, onChange, multiline, inputRef }) => {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  // Se aplica al dejar de escribir un momento, para ver el cambio en vivo.
  useEffect(() => {
    if (draft === value) return;
    const t = window.setTimeout(() => onChange(draft), 450);
    return () => window.clearTimeout(t);
  }, [draft]);
  const done = () => draft !== value && onChange(draft);
  return (
    <Field label={label}>
      {multiline ? (
        <textarea
          ref={inputRef}
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={done}
          rows={3}
        />
      ) : (
        <input
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={done}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
      )}
    </Field>
  );
};

const toHex = (c: string) => {
  if (/^#[0-9a-f]{6}$/i.test(c)) return c;
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return "#ffffff";
  return `#${[m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`;
};

export const ColorField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({
  label,
  value,
  onChange,
}) => (
  <Field label={label}>
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <input
        className="input"
        type="color"
        value={toHex(value)}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 44, flexShrink: 0 }}
      />
      <div className="swatches">
        {BRAND.palette.map((c) => (
          <button key={c} className="swatch" style={{ background: c, width: 20, height: 20 }} onClick={() => onChange(c)} title={c} />
        ))}
      </div>
    </div>
  </Field>
);

export const SelectField = <T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) => (
  <Field label={label}>
    <select className="input" value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  </Field>
);

export const Check: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({
  label,
  value,
  onChange,
}) => (
  <label className="check">
    <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
    {label}
  </label>
);
