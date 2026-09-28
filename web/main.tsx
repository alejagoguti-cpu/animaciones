import "./static-base";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Player } from "@remotion/player";
import { BitaxusPromo, PROMO_DURATION } from "../src/BitaxusPromo";
import { colors, fonts, FPS } from "../src/theme";

const formats = [
  { id: "vertical", label: "Reels / Stories · 9:16", width: 1080, height: 1920 },
  { id: "feed", label: "Feed · 4:5", width: 1080, height: 1350 },
] as const;

const App: React.FC = () => {
  const [formatId, setFormatId] = useState<(typeof formats)[number]["id"]>("vertical");
  const format = formats.find((f) => f.id === formatId)!;

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", fontFamily: fonts.body }}>
      <div style={{ position: "fixed", inset: 0 }}>
        <StaticBackground />
      </div>

      <main
        style={{
          position: "relative",
          maxWidth: 1100,
          margin: "0 auto",
          padding: "32px 16px 48px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Bitaxus" style={{ width: 180, height: "auto" }} />
        <h1
          style={{
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: "clamp(28px, 6vw, 48px)",
            textTransform: "uppercase",
            textAlign: "center",
            margin: 0,
          }}
        >
          Animaciones
        </h1>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {formats.map((f) => (
            <button
              key={f.id}
              onClick={() => setFormatId(f.id)}
              style={{
                fontFamily: fonts.body,
                fontWeight: 600,
                fontSize: 15,
                color: colors.white,
                padding: "10px 20px",
                borderRadius: 15,
                cursor: "pointer",
                border: `2.4px solid ${f.id === formatId ? colors.white : colors.glassBorder}`,
                background:
                  f.id === formatId
                    ? "linear-gradient(115deg, rgba(193,18,31,0.7), rgba(40,8,10,0.7))"
                    : colors.glass,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: `min(100%, calc((100vh - 220px) * ${format.width / format.height}))`,
            borderRadius: 20,
            overflow: "hidden",
            border: `2px solid ${colors.glassBorder}`,
            boxShadow: "0 0 80px rgba(193,18,31,0.35)",
          }}
        >
          <Player
            key={format.id}
            component={BitaxusPromo}
            durationInFrames={PROMO_DURATION}
            fps={FPS}
            compositionWidth={format.width}
            compositionHeight={format.height}
            style={{ width: "100%" }}
            controls
            loop
            autoPlay
            initiallyMuted
            clickToPlay
          />
        </div>
      </main>
    </div>
  );
};

// Mismo look del fondo del video: negro, resplandores rojos y puntos.
const StaticBackground: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: [
        "radial-gradient(rgba(255,255,255,0.12) 1.2px, transparent 1.2px) 0 0 / 28px 28px",
        "radial-gradient(60% 45% at 15% 10%, rgba(193,18,31,0.45), transparent 75%)",
        "radial-gradient(55% 40% at 90% 85%, rgba(193,18,31,0.35), transparent 80%)",
        "#000",
      ].join(","),
    }}
  />
);

createRoot(document.getElementById("root")!).render(<App />);
