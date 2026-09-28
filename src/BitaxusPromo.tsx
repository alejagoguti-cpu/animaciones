import React from "react";
import { AbsoluteFill, CalculateMetadataFunction, useVideoConfig } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { AccentProvider } from "./accent";
import { Background } from "./components/Background";
import { PromoProps } from "./schema";
import { ChatScene } from "./scenes/ChatScene";
import { CtaScene } from "./scenes/CtaScene";
import { FeaturesScene } from "./scenes/FeaturesScene";
import { GlobalScene } from "./scenes/GlobalScene";
import { HookScene } from "./scenes/HookScene";
import { FPS } from "./theme";

export const TRANSITION = 15;

// Duración de cada escena en frames, a partir de los segundos de las props.
export const sceneFrames = (d: PromoProps["duracion"]) => ({
  hook: Math.round(d.escena1 * FPS),
  chat: Math.round(d.escena2Chat * FPS),
  features: Math.round(d.escena3Beneficios * FPS),
  global: Math.round(d.escena4Global * FPS),
  cta: Math.round(d.escena5Cierre * FPS),
});

export const promoDuration = (d: PromoProps["duracion"]) => {
  const scenes = Object.values(sceneFrames(d));
  return scenes.reduce((a, b) => a + b, 0) - TRANSITION * (scenes.length - 1);
};

// Recalcula la duración total del video cuando se editan las duraciones.
export const calculatePromoMetadata: CalculateMetadataFunction<PromoProps> = ({ props }) => ({
  durationInFrames: promoDuration(props.duracion),
});

const timing = linearTiming({ durationInFrames: TRANSITION });

export const BitaxusPromo: React.FC<PromoProps> = (props) => {
  const { width, height } = useVideoConfig();
  // Las escenas están diseñadas en 1080x1920; en otros formatos se escalan.
  const scale = Math.min(width / 1080, height / 1920);
  const frames = sceneFrames(props.duracion);

  return (
    <AccentProvider color={props.colorAcento}>
      <AbsoluteFill>
        <Background />
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 1080, height: 1920, transform: `scale(${scale})`, flexShrink: 0, position: "relative" }}>
            <TransitionSeries>
              <TransitionSeries.Sequence durationInFrames={frames.hook}>
                <HookScene {...props.escena1} />
              </TransitionSeries.Sequence>
              <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={timing} />
              <TransitionSeries.Sequence durationInFrames={frames.chat}>
                <ChatScene {...props.escena2Chat} durationInFrames={frames.chat} />
              </TransitionSeries.Sequence>
              <TransitionSeries.Transition presentation={fade()} timing={timing} />
              <TransitionSeries.Sequence durationInFrames={frames.features}>
                <FeaturesScene {...props.escena3Beneficios} />
              </TransitionSeries.Sequence>
              <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={timing} />
              <TransitionSeries.Sequence durationInFrames={frames.global}>
                <GlobalScene {...props.escena4Global} />
              </TransitionSeries.Sequence>
              <TransitionSeries.Transition presentation={fade()} timing={timing} />
              <TransitionSeries.Sequence durationInFrames={frames.cta}>
                <CtaScene {...props.escena5Cierre} />
              </TransitionSeries.Sequence>
            </TransitionSeries>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AccentProvider>
  );
};
