import React from "react";
import {
  AbsoluteFill, Audio, Easing, Freeze, interpolate, OffthreadVideo, Sequence,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { AccentProvider, useAccent } from "./accent";
import { Background } from "./components/Background";
import { GlassPill } from "./components/GlassPill";
import { Logo } from "./components/Logo";
import { colors, fonts, FPS } from "./theme";

const VIDEO_FRAMES = 343; // 11.44 s del reel original
export const REEL_FRAMES = 380;
// Momentos de "corte": golpe de zoom + destello rojo (como transición).
const HITS = [0, 84, 170, 256];
const OUTRO = 300;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Footage: React.FC = () => {
  const frame = useCurrentFrame();
  const last = HITS.filter((h) => h <= frame).pop() ?? 0;
  const k = frame - last;
  const idx = HITS.indexOf(last);
  const punch = interpolate(k, [0, 22], [1.12, 1.02 + (idx % 2) * 0.02], { ...clamp, easing: Easing.out(Easing.cubic) });
  const slow = interpolate(frame, [0, VIDEO_FRAMES], [0, 0.035], clamp);
  const o = interpolate(frame, [OUTRO, OUTRO + 26], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const scale = interpolate(o, [0, 1], [punch + slow, 0.56]);
  const y = interpolate(o, [0, 1], [0, -70]);
  const radius = interpolate(o, [0, 1], [0, 64]);
  const f = frame >= VIDEO_FRAMES ? VIDEO_FRAMES - 1 : frame;
  return (
    <AbsoluteFill style={{ transform: `translateY(${y}px) scale(${scale})`, borderRadius: radius, overflow: "hidden",
      boxShadow: o > 0 ? `0 0 90px rgba(193,18,31,${0.6 * o}), 0 0 0 4px rgba(255,255,255,${0.5 * o})` : "none" }}>
      <Freeze frame={f}>
        <OffthreadVideo src={staticFile("reel.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Freeze>
    </AbsoluteFill>
  );
};

const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  const accent = useAccent();
  const hit = HITS.map((h) => frame - h).filter((d) => d >= 0 && d < 16).pop();
  const a = hit === undefined ? 0 : interpolate(hit, [0, 16], [0.75, 0], clamp);
  const bar = hit === undefined ? 0 : interpolate(hit, [0, 14], [1, 0], clamp);
  return (
    <>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, ${accent.alpha(a)} 0%, ${accent.alpha(a * 0.4)} 45%, transparent 75%)`, mixBlendMode: "screen" }} />
      {/* barrido rojo tipo whip */}
      <AbsoluteFill style={{ background: `linear-gradient(100deg, transparent ${(1 - bar) * 100 - 30}%, ${accent.alpha(0.5 * bar)} ${(1 - bar) * 100}%, transparent ${(1 - bar) * 100 + 30}%)`, mixBlendMode: "screen" }} />
    </>
  );
};

// Resplandor permanente: viñeta roja abajo y arriba que respira.
const Glow: React.FC = () => {
  const frame = useCurrentFrame();
  const accent = useAccent();
  const p = interpolate(Math.sin(frame / 14), [-1, 1], [0.55, 1]);
  return (
    <AbsoluteFill style={{ opacity: interpolate(frame, [OUTRO, OUTRO + 20], [1, 0.4], clamp), pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: `linear-gradient(to top, ${accent.alpha(0.5 * p)} 0%, transparent 32%), linear-gradient(to bottom, ${accent.alpha(0.35 * p)} 0%, transparent 22%)`, mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 4, fps, config: { damping: 12, stiffness: 120 } });
  const out = interpolate(frame, [38, 54], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: out }}>
      <div style={{ transform: `scale(${0.6 + 0.4 * s}) translateY(${(1 - s) * 40}px)`, opacity: s, filter: `drop-shadow(0 0 40px ${colors.redGlow})` }}>
        <Logo width={640} />
      </div>
    </AbsoluteFill>
  );
};

const SUBS: [string, number, number, boolean?][] = [
  ["Te ha pasado que siempre", 0, 1.86],
  ["te felicitan en las reuniones,", 1.86, 3.94],
  ["pero cuando miras tu cuenta", 3.94, 5.72],
  ["en Cardia, el pago", 5.72, 6.88],
  ["no se ha reflejado.", 6.88, 8.08],
  ["Con Bitaxus", 8.08, 8.9, true],
  ["esto va a cambiar.", 8.9, 10.5],
];

const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = useAccent();
  const t = frame / fps;
  const cur = SUBS.find(([, a, b]) => t >= a && t < b);
  if (!cur) return null;
  const [text, a, b, hl] = cur;
  const words = text.split(" ");
  const local = frame - a * fps;
  const fadeOut = interpolate(t, [b - 0.15, b], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 330, opacity: fadeOut }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 26px", maxWidth: 960, textAlign: "center" }}>
        {words.map((w, i) => {
          const s = spring({ frame: local - i * 3, fps, config: { damping: 11, stiffness: 160 } });
          return (
            <span key={i} style={{ display: "inline-block", fontFamily: fonts.display, fontWeight: 700, fontSize: hl ? 128 : 92, lineHeight: 1.12, textTransform: "uppercase",
              color: hl ? accent.light : colors.white, opacity: Math.min(1, s * 1.4), transform: `translateY(${(1 - s) * 50}px) scale(${0.85 + 0.15 * s})`,
              textShadow: `0 0 36px ${accent.alpha(0.9)}, 0 4px 18px rgba(0,0,0,0.85)` }}>{w}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Corner: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 56, fps, config: { damping: 14 } });
  const out = interpolate(frame, [OUTRO - 6, OUTRO + 6], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", top: 90, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: s * out, transform: `translateY(${(1 - s) * -40}px)` }}>
      <Logo width={260} style={{ filter: `drop-shadow(0 0 24px ${colors.redGlow})` }} />
    </div>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame() ;
  const { fps } = useVideoConfig();
  const l = frame - 14;
  const s = spring({ frame: l, fps, config: { damping: 13 } });
  const b = spring({ frame: l - 12, fps, config: { damping: 11 } });
  const glint = interpolate(frame % 60, [0, 40], [-30, 130], clamp);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 150, gap: 30 }}>
      <div style={{ transform: `scale(${0.7 + 0.3 * s})`, opacity: s }}>
        <Logo width={520} style={{ filter: `drop-shadow(0 0 36px ${colors.redGlow})` }} />
      </div>
      <div style={{ transform: `scale(${0.6 + 0.4 * b})`, opacity: b }}>
        <GlassPill style={{ padding: "20px 54px" }}>
          <span style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 52, color: colors.white, letterSpacing: 1 }}>bitaxus.com</span>
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(105deg, transparent ${glint - 12}%, rgba(255,255,255,0.35) ${glint}%, transparent ${glint + 12}%)` }} />
        </GlassPill>
      </div>
    </AbsoluteFill>
  );
};

export const ReelEdit: React.FC<{ accent?: string }> = ({ accent = "#c1121f" }) => {
  const frame = useCurrentFrame();
  const bgIn = interpolate(frame, [OUTRO, OUTRO + 22], [0, 1], clamp);
  return (
    <AccentProvider color={accent}>
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <div style={{ opacity: bgIn, position: "absolute", inset: 0 }}><Background /></div>
        <Footage />
        <Glow />
        <Flash />
        <Sequence from={0} durationInFrames={60}><Intro /></Sequence>
        <Corner />
        <Subtitles />
        <Sequence from={OUTRO}><Outro /></Sequence>
        {/* audio original + música */}
        <Audio src={staticFile("reel.mp4")} volume={(f) => interpolate(f, [VIDEO_FRAMES - 10, VIDEO_FRAMES], [1, 0], clamp)} endAt={VIDEO_FRAMES} />
        <Audio src={staticFile("music.wav")} volume={(f) => 0.3 * interpolate(f, [0, 12, REEL_FRAMES - 40, REEL_FRAMES - 4], [0, 1, 1, 0], clamp)} />
      </AbsoluteFill>
    </AccentProvider>
  );
};
export { FPS };
