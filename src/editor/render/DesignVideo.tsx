import React, { useMemo } from "react";
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from "remotion";
import { linearTiming, TransitionPresentation, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { AccentProvider } from "../../accent";
import { getTransitionFrames, sceneFrames } from "../timing";
import { Background, Design, Scene, Transition } from "../types";
import { anchorsOf, GlowStyleLayer } from "./glowStyles";
import { ElementView, resolveSrc } from "./ElementView";

export type DesignVideoProps = { design: Design };

// Composición que dibuja un diseño completo del editor.
export const DesignVideo: React.FC<DesignVideoProps> = ({ design }) => {
  const frames = sceneFrames(design);
  const trans = getTransitionFrames(design);

  return (
    <AccentProvider color={design.accent}>
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <TransitionSeries>
          {design.scenes.flatMap((scene, i) => {
            const items: React.ReactNode[] = [];
            if (i > 0 && trans[i] > 0) {
              items.push(
                <TransitionSeries.Transition
                  key={`t-${scene.id}`}
                  presentation={presentationFor(scene.transition)}
                  timing={linearTiming({ durationInFrames: trans[i] })}
                />,
              );
            }
            items.push(
              <TransitionSeries.Sequence key={scene.id} durationInFrames={frames[i]}>
                <SceneView scene={scene} />
              </TransitionSeries.Sequence>,
            );
            return items;
          })}
        </TransitionSeries>
      </AbsoluteFill>
    </AccentProvider>
  );
};

const presentationFor = (t: Transition): TransitionPresentation<Record<string, unknown>> => {
  switch (t) {
    case "slide-left":
      return slide({ direction: "from-right" }) as TransitionPresentation<Record<string, unknown>>;
    case "slide-up":
      return slide({ direction: "from-bottom" }) as TransitionPresentation<Record<string, unknown>>;
    case "wipe":
      return wipe({ direction: "from-left" }) as TransitionPresentation<Record<string, unknown>>;
    default:
      return fade() as TransitionPresentation<Record<string, unknown>>;
  }
};

export const SceneView: React.FC<{ scene: Scene }> = ({ scene }) => (
  <AbsoluteFill style={{ overflow: "hidden" }}>
    <SceneBackground bg={scene.background} />
    {scene.elements.map((el) => (
      <ElementView key={el.id} el={el} />
    ))}
  </AbsoluteFill>
);


// Fondos con SVG (y no con radial-gradient de CSS) para que salgan igual al
// exportar el MP4 en el navegador, que solo dibuja degradados lineales.
const SceneBackground: React.FC<{ bg: Background }> = ({ bg }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame / 30;
  const gid = useMemo(() => `bg${Math.random().toString(36).slice(2, 8)}`, []);

  let layer: React.ReactNode = null;
  if (bg.kind === "solid") {
    layer = <AbsoluteFill style={{ backgroundColor: bg.color }} />;
  } else if (bg.kind === "gradient") {
    layer = <AbsoluteFill style={{ background: `linear-gradient(160deg, ${bg.color} 0%, ${bg.color2} 100%)` }} />;
  } else if (bg.kind === "image" && bg.image) {
    layer = (
      <AbsoluteFill style={{ backgroundColor: bg.color2 }}>
        <Img src={resolveSrc(bg.image)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
    );
  } else if (bg.kind === "glow") {
    layer = <AbsoluteFill style={{ backgroundColor: bg.color2 }} />;
  }

  const orb = anchorsOf("orbes", bg.glowPoints);
  const a = { x: orb[0].x + Math.sin(t * 0.45) * 0.12, y: orb[0].y + Math.cos(t * 0.35) * 0.08 };
  const b = { x: orb[1].x + Math.cos(t * 0.3) * 0.1, y: orb[1].y + Math.sin(t * 0.4) * 0.1 };
  const dotY = -((frame * 0.4) % 36);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {layer}
      {(bg.kind === "glow" || bg.dots) && (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <radialGradient id={`${gid}a`} cx={a.x} cy={a.y} r={0.6} gradientTransform={`translate(${a.x} ${a.y}) scale(1 ${0.4 / 0.6}) translate(${-a.x} ${-a.y})`}>
              <stop offset="0" stopColor={bg.color} stopOpacity={0.55} />
              <stop offset="0.45" stopColor={bg.color} stopOpacity={0.15} />
              <stop offset="0.75" stopColor={bg.color} stopOpacity={0} />
            </radialGradient>
            <radialGradient id={`${gid}b`} cx={b.x} cy={b.y} r={0.55} gradientTransform={`translate(${b.x} ${b.y}) scale(1 ${0.35 / 0.55}) translate(${-b.x} ${-b.y})`}>
              <stop offset="0" stopColor={bg.color} stopOpacity={0.45} />
              <stop offset="0.5" stopColor={bg.color} stopOpacity={0.12} />
              <stop offset="0.8" stopColor={bg.color} stopOpacity={0} />
            </radialGradient>
            <radialGradient id={`${gid}v`} cx={0.5} cy={0.5} r={0.75}>
              <stop offset="0.6" stopColor="#000" stopOpacity={0} />
              <stop offset="1" stopColor="#000" stopOpacity={0.85} />
            </radialGradient>
            <radialGradient id={`${gid}m`} cx={0.5} cy={0.4} r={0.75}>
              <stop offset="0.3" stopColor="#fff" stopOpacity={1} />
              <stop offset="1" stopColor="#fff" stopOpacity={0} />
            </radialGradient>
            <pattern id={`${gid}p`} width={36} height={36} patternUnits="userSpaceOnUse" y={dotY}>
              <circle cx={18} cy={18} r={1.6} fill="rgba(255,255,255,0.14)" />
            </pattern>
            <mask id={`${gid}k`}>
              <rect width={width} height={height} fill={`url(#${gid}m)`} />
            </mask>
          </defs>
          {bg.kind === "glow" && (bg.glowStyle ?? "orbes") === "orbes" && (
            <g opacity={Math.min(1.4, bg.glowIntensity ?? 1)}>
              <rect width={width} height={height} fill={`url(#${gid}a)`} />
              <rect width={width} height={height} fill={`url(#${gid}b)`} />
            </g>
          )}
          {bg.kind === "glow" && (bg.glowStyle ?? "orbes") !== "orbes" && (
            <GlowStyleLayer style={bg.glowStyle!} id={gid} width={width} height={height} t={t} color={bg.color} intensity={bg.glowIntensity ?? 1} points={bg.glowPoints} />
          )}
          {bg.dots && <rect width={width} height={height} fill={`url(#${gid}p)`} mask={`url(#${gid}k)`} />}
          {bg.kind === "glow" && <rect width={width} height={height} fill={`url(#${gid}v)`} />}
        </svg>
      )}
    </AbsoluteFill>
  );
};
