import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ChatBubble, ChatMessage } from "../components/ChatBubble";
import { KineticText } from "../components/KineticText";
import { Phone } from "../components/Phone";
import { colors, fonts } from "../theme";

const messages: ChatMessage[] = [
  { from: "user", text: "Quiero programar un recaudo.", time: "10:44 AM", at: 20 },
  {
    from: "bitaxus",
    text: "¡Claro! Vamos paso a paso. ¿Cuánto vas a cobrar y cuál es el concepto?",
    time: "10:45 AM",
    at: 42,
  },
  { from: "user", text: "$1.250.000 por servicios de publicidad.", time: "10:46 AM", at: 92 },
  {
    from: "bitaxus",
    text: "Perfecto. Ahora cuéntame quién realizará el pago y te ayudo a dejar todo programado.",
    time: "10:47 AM",
    at: 112,
  },
];

// Escena 2: el agente de Bitaxus en WhatsApp.
export const ChatScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 90 } });
  const phoneY = interpolate(enter, [0, 1], [900, 0]);
  const phoneRotate = interpolate(enter, [0, 1], [8, -2]);
  const float = Math.sin(frame / 20) * 8;

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 150, left: 90, right: 90 }}>
        <KineticText text="No necesitas otra aplicación" fontSize={78} delay={4} stagger={3} />
      </div>

      <div
        style={{
          position: "absolute",
          top: 480,
          transform: `translateY(${phoneY + float}px) rotate(${phoneRotate}deg)`,
        }}
      >
        <Phone width={780} height={1300}>
          <ChatHeader />
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
            }}
          >
            {messages.map((m, i) => (
              <ChatBubble key={i} message={m} />
            ))}
          </div>
          <ChatInput />
        </Phone>
      </div>
    </AbsoluteFill>
  );
};

const ChatHeader: React.FC = () => (
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
        background: `radial-gradient(circle at 30% 30%, ${colors.red}, ${colors.redDeep})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fonts.display,
        color: "#fff",
        fontSize: 40,
      }}
    >
      B
    </div>
    <div style={{ fontFamily: fonts.body, color: "#fff" }}>
      <div style={{ fontSize: 36, fontWeight: 700 }}>Bitaxus</div>
      <div style={{ fontSize: 26, opacity: 0.8 }}>en línea</div>
    </div>
  </div>
);

const ChatInput: React.FC = () => (
  <div
    style={{
      position: "absolute",
      bottom: 40,
      left: 28,
      right: 28,
      display: "flex",
      gap: 18,
      alignItems: "center",
    }}
  >
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
);
