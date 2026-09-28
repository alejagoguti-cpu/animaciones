import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ChatBubble, ChatMessage } from "../components/ChatBubble";
import { KineticText } from "../components/KineticText";
import { Phone } from "../components/Phone";
import { useAccent } from "../accent";
import { PromoProps } from "../schema";
import { colors, fonts } from "../theme";

// Escena 2: el agente de Bitaxus en WhatsApp.
export const ChatScene: React.FC<PromoProps["escena2Chat"] & { durationInFrames: number }> = ({
  titular,
  nombreContacto,
  mensajes,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Los mensajes se reparten a lo largo de la escena.
  const step = Math.max(12, (durationInFrames - 60) / Math.max(1, mensajes.length));
  const messages: ChatMessage[] = mensajes.map((m, i) => ({
    from: m.quien === "cliente" ? "user" : "bitaxus",
    text: m.texto,
    time: m.hora,
    at: Math.round(20 + i * step),
  }));

  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 90 } });
  const phoneY = interpolate(enter, [0, 1], [900, 0]);
  const phoneRotate = interpolate(enter, [0, 1], [8, -2]);
  const float = Math.sin(frame / 20) * 8;

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 150, left: 90, right: 90 }}>
        <KineticText text={titular} fontSize={78} delay={4} stagger={3} />
      </div>

      <div
        style={{
          position: "absolute",
          top: 480,
          transform: `translateY(${phoneY + float}px) rotate(${phoneRotate}deg)`,
        }}
      >
        <Phone width={780} height={1300}>
          <ChatHeader name={nombreContacto} />
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
              <ChatBubble key={i} message={m} contactName={nombreContacto} />
            ))}
          </div>
          <ChatInput />
        </Phone>
      </div>
    </AbsoluteFill>
  );
};

const ChatHeader: React.FC<{ name: string }> = ({ name }) => {
  const accent = useAccent();
  return (
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
      {name.charAt(0).toUpperCase()}
    </div>
    <div style={{ fontFamily: fonts.body, color: "#fff" }}>
      <div style={{ fontSize: 36, fontWeight: 700 }}>{name}</div>
      <div style={{ fontSize: 26, opacity: 0.8 }}>en línea</div>
    </div>
  </div>
  );
};

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
