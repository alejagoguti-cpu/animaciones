import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "../theme";

export type ChatMessage = {
  from: "user" | "bitaxus";
  text: string;
  time: string;
  // Frame (dentro de la escena) en que aparece el mensaje.
  at: number;
};

export const ChatBubble: React.FC<{ message: ChatMessage; contactName: string }> = ({
  message,
  contactName,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isUser = message.from === "user";

  const typingEnd = isUser ? message.at : message.at + 18;
  const showTyping = !isUser && frame >= message.at && frame < typingEnd;

  const progress = spring({
    frame: frame - typingEnd,
    fps,
    config: { damping: 13, stiffness: 160 },
  });

  if (frame < message.at) return null;

  if (showTyping) {
    return (
      <div style={{ alignSelf: "flex-start", ...bubbleBase, background: "#fff" }}>
        <TypingDots />
      </div>
    );
  }

  return (
    <div
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        ...bubbleBase,
        background: isUser ? colors.whatsappBubble : "#fff",
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [30, 0])}px) scale(${interpolate(progress, [0, 1], [0.9, 1])})`,
        transformOrigin: isUser ? "bottom right" : "bottom left",
      }}
    >
      {!isUser && (
        <div style={{ color: colors.whatsappGreen, fontWeight: 700, fontSize: 28, marginBottom: 6 }}>
          {contactName}
        </div>
      )}
      <div>{message.text}</div>
      <div style={{ textAlign: "right", fontSize: 22, color: "#8a8f8d", marginTop: 8 }}>
        {message.time}
      </div>
    </div>
  );
};

const bubbleBase: React.CSSProperties = {
  maxWidth: "82%",
  padding: "20px 26px",
  borderRadius: 26,
  fontFamily: fonts.body,
  fontSize: 32,
  lineHeight: 1.35,
  color: "#111b21",
  boxShadow: "0 2px 3px rgba(0,0,0,0.12)",
};

const TypingDots: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", gap: 10, padding: "8px 4px" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            background: "#8a8f8d",
            transform: `translateY(${Math.sin((frame - i * 4) / 3) * 5}px)`,
          }}
        />
      ))}
    </div>
  );
};
