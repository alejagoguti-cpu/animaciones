import React from "react";
import { Easing, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { useAccent } from "../../accent";
import { ChatBubble, ChatMessage } from "../../components/ChatBubble";
import { GlassPill } from "../../components/GlassPill";
import { KineticText } from "../../components/KineticText";
import { Phone } from "../../components/Phone";
import { colors, fonts } from "../../theme";
import { ElementData, FPS, TextProps } from "../types";
import { getAnimState } from "./animation";

// Las rutas "assets/..." viven en public/; las subidas son URLs completas.
export const resolveSrc = (src: string) => {
  if (!src) return "";
  if (/^(https?:|data:|blob:)/.test(src)) return src;
  return staticFile(src);
};

const fontFamily = (f: "display" | "body") => (f === "display" ? fonts.display : fonts.body);

export const ElementView: React.FC<{ el: ElementData }> = ({ el }) => {
  const frame = useCurrentFrame();
  const anim = getAnimState(el, frame);
  if (!anim.visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: el.x,
        top: el.y,
        width: el.w,
        height: el.h,
        transformOrigin: "center center",
        ...anim.style,
      }}
    >
      <ElementBody el={el} localFrame={anim.localFrame} />
    </div>
  );
};

const ElementBody: React.FC<{ el: ElementData; localFrame: number }> = ({ el, localFrame }) => {
  switch (el.type) {
    case "text":
      return <TextBody el={el} localFrame={localFrame} />;
    case "image":
      return (
        <Img
          src={resolveSrc(el.props.src)}
          style={{ width: "100%", height: "100%", objectFit: el.props.fit, borderRadius: el.props.radius, display: "block" }}
        />
      );
    case "video":
      return (
        <OffthreadVideo
          src={resolveSrc(el.props.src)}
          muted={el.props.muted}
          style={{ width: "100%", height: "100%", objectFit: el.props.fit, borderRadius: el.props.radius }}
        />
      );
    case "logo":
      return <LogoBody glow={el.props.glow} />;
    case "shape":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: el.props.fill,
            borderRadius: el.props.shape === "circle" ? "50%" : el.props.radius,
            border: el.props.borderWidth > 0 ? `${el.props.borderWidth}px solid ${el.props.borderColor}` : undefined,
            boxSizing: "border-box",
          }}
        />
      );
    case "pill":
      return <PillBody el={el} localFrame={localFrame} />;
    case "card":
      return <CardBody el={el} />;
    case "phone":
      return <PhoneBody el={el} />;
    case "counter":
      return <CounterBody el={el} localFrame={localFrame} />;
  }
};

const textStyle = (p: TextProps): React.CSSProperties => ({
  fontFamily: fontFamily(p.font),
  fontWeight: p.weight,
  fontSize: p.size,
  color: p.color,
  textAlign: p.align,
  textTransform: p.uppercase ? "uppercase" : "none",
  letterSpacing: `${p.letterSpacing}em`,
  lineHeight: p.lineHeight,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
});

const TextBody: React.FC<{ el: Extract<ElementData, { type: "text" }>; localFrame: number }> = ({ el, localFrame }) => {
  const accent = useAccent();
  const p = el.props;
  const shadow = p.glow ? `0 0 40px ${accent.alpha(0.45)}` : undefined;

  if (el.enter.kind === "words") {
    return (
      <KineticText
        text={p.text}
        delay={Math.round(el.start * FPS)}
        stagger={Math.max(1, Math.round((el.enter.duration * FPS) / Math.max(4, p.text.split(" ").length * 2)))}
        fontSize={p.size}
        color={p.color}
        align={p.align}
        style={{ ...textStyle(p), textShadow: shadow ?? "none" }}
      />
    );
  }

  let text = p.text;
  if (el.enter.kind === "typewriter") {
    const chars = Math.floor(
      interpolate(localFrame, [0, Math.max(1, el.enter.duration * FPS)], [0, p.text.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    );
    text = p.text.slice(0, chars);
  }

  return <div style={{ ...textStyle(p), textShadow: shadow }}>{text}</div>;
};

const LogoBody: React.FC<{ glow: boolean }> = ({ glow }) => {
  const accent = useAccent();
  return (
    <Img
      src={staticFile("logo.png")}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        filter: glow ? `drop-shadow(0 0 24px ${accent.alpha(0.9)})` : undefined,
      }}
    />
  );
};

const PillBody: React.FC<{ el: Extract<ElementData, { type: "pill" }>; localFrame: number }> = ({ el, localFrame }) => {
  const p = el.props;
  const shine = interpolate(localFrame, [15, 45], [-120, 220], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <GlassPill
      glow={p.glow}
      style={{ width: "100%", height: "100%", boxSizing: "border-box", justifyContent: "center", padding: "0 32px" }}
    >
      <span
        style={{
          fontFamily: fontFamily(p.font),
          fontWeight: 700,
          fontSize: p.size,
          color: colors.white,
          whiteSpace: "nowrap",
        }}
      >
        {p.text}
      </span>
      {p.shine && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)",
            transform: `translateX(${shine}%)`,
          }}
        />
      )}
    </GlassPill>
  );
};

const CardBody: React.FC<{ el: Extract<ElementData, { type: "card" }> }> = ({ el }) => {
  const accent = useAccent();
  const p = el.props;
  // Diseñada a 920px de ancho; se escala con el elemento.
  const s = el.w / 920;
  return (
    <div style={{ width: 920, height: el.h / s, transform: `scale(${s})`, transformOrigin: "top left" }}>
      <GlassPill glow={p.glow} style={{ width: "100%", height: "100%", boxSizing: "border-box", padding: "30px 40px" }}>
        <div
          style={{
            width: 110,
            height: 110,
            flexShrink: 0,
            borderRadius: 55,
            background: "linear-gradient(145deg, #ffffff, #bdbdbd)",
            color: accent.deep(),
            fontSize: 56,
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fonts.body,
          }}
        >
          {p.icon}
        </div>
        <div style={{ fontFamily: fonts.body, color: colors.white }}>
          <div style={{ fontSize: 46, fontWeight: 700 }}>{p.title}</div>
          <div style={{ fontSize: 32, color: colors.whiteSoft, marginTop: 6 }}>{p.text}</div>
        </div>
      </GlassPill>
    </div>
  );
};

const PhoneBody: React.FC<{ el: Extract<ElementData, { type: "phone" }> }> = ({ el }) => {
  const accent = useAccent();
  const p = el.props;
  // El teléfono está diseñado a 780x1300.
  const s = Math.min(el.w / 780, el.h / 1300);
  const startF = Math.round(el.start * FPS);
  const durF = Math.round((el.end - el.start) * FPS);
  const step = Math.max(12, (durF - 60) / Math.max(1, p.messages.length));
  const messages: ChatMessage[] = p.messages.map((m, i) => ({
    from: m.from === "cliente" ? "user" : "bitaxus",
    text: m.text,
    time: m.time,
    at: Math.round(startF + 20 + i * step),
  }));

  return (
    <div style={{ width: 780, height: 1300, transform: `scale(${s})`, transformOrigin: "top left" }}>
      <Phone width={780} height={1300}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 220,
            background: colors.whatsappGreen,
            display: "flex",
            alignItems: "flex-end",
            padding: "0 36px 30px",
            gap: 24,
          }}
        >
          <div style={{ fontSize: 44, color: "#fff", fontFamily: fonts.body }}>←</div>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 42,
              background: `linear-gradient(145deg, ${accent.color}, ${accent.deep()})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fonts.display,
              color: "#fff",
              fontSize: 40,
            }}
          >
            {p.contactName.charAt(0).toUpperCase()}
          </div>
          <div style={{ fontFamily: fonts.body, color: "#fff" }}>
            <div style={{ fontSize: 36, fontWeight: 700 }}>{p.contactName}</div>
            <div style={{ fontSize: 26, opacity: 0.8 }}>en línea</div>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 230,
            left: 0,
            right: 0,
            bottom: 150,
            padding: "20px 28px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: 18,
            overflow: "hidden",
          }}
        >
          {messages.map((m, i) => (
            <ChatBubble key={i} message={m} contactName={p.contactName} />
          ))}
        </div>
        <div style={{ position: "absolute", bottom: 40, left: 28, right: 28, display: "flex", gap: 18, alignItems: "center" }}>
          <div
            style={{
              flex: 1,
              background: "#fff",
              borderRadius: 50,
              padding: "26px 34px",
              fontFamily: fonts.body,
              fontSize: 30,
              color: "#8a8f8d",
            }}
          >
            Escribe un mensaje
          </div>
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: 45,
              background: colors.success,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 38,
            }}
          >
            ➤
          </div>
        </div>
      </Phone>
    </div>
  );
};

const CounterBody: React.FC<{ el: Extract<ElementData, { type: "counter" }>; localFrame: number }> = ({
  el,
  localFrame,
}) => {
  const accent = useAccent();
  const p = el.props;
  const value = interpolate(localFrame, [8, 8 + Math.max(1, p.countDuration * FPS)], [p.from, p.to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div style={{ fontFamily: fonts.body, color: colors.white }}>
      {p.label && (
        <div style={{ fontSize: p.size * 0.28, letterSpacing: "0.12em", color: colors.whiteSoft, fontWeight: 600 }}>
          {p.label}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "baseline", gap: p.size * 0.24 }}>
        {p.currency && (
          <span style={{ fontSize: p.size * 0.44, fontWeight: 700, color: accent.light }}>{p.currency}</span>
        )}
        <span style={{ fontFamily: fonts.display, fontSize: p.size, color: p.color, fontVariantNumeric: "tabular-nums" }}>
          {Math.round(value).toLocaleString("es-CO")}
        </span>
      </div>
    </div>
  );
};
