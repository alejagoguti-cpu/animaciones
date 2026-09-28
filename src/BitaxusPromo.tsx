import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Background } from "./components/Background";
import { ChatScene } from "./scenes/ChatScene";
import { CtaScene } from "./scenes/CtaScene";
import { FeaturesScene } from "./scenes/FeaturesScene";
import { GlobalScene } from "./scenes/GlobalScene";
import { HookScene } from "./scenes/HookScene";

// Duración de cada escena en frames (30 fps).
export const SCENES = {
  hook: 105,
  chat: 180,
  features: 120,
  global: 120,
  cta: 120,
};
export const TRANSITION = 15;

export const PROMO_DURATION =
  Object.values(SCENES).reduce((a, b) => a + b, 0) - TRANSITION * (Object.keys(SCENES).length - 1);

const timing = linearTiming({ durationInFrames: TRANSITION });

export const BitaxusPromo: React.FC = () => {
  const { width, height } = useVideoConfig();
  // Las escenas están diseñadas en 1080x1920; en otros formatos se escalan.
  const scale = Math.min(width / 1080, height / 1920);

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 1080, height: 1920, transform: `scale(${scale})`, flexShrink: 0, position: "relative" }}>
          <TransitionSeries>
            <TransitionSeries.Sequence durationInFrames={SCENES.hook}>
              <HookScene />
            </TransitionSeries.Sequence>
            <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={timing} />
            <TransitionSeries.Sequence durationInFrames={SCENES.chat}>
              <ChatScene />
            </TransitionSeries.Sequence>
            <TransitionSeries.Transition presentation={fade()} timing={timing} />
            <TransitionSeries.Sequence durationInFrames={SCENES.features}>
              <FeaturesScene />
            </TransitionSeries.Sequence>
            <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={timing} />
            <TransitionSeries.Sequence durationInFrames={SCENES.global}>
              <GlobalScene />
            </TransitionSeries.Sequence>
            <TransitionSeries.Transition presentation={fade()} timing={timing} />
            <TransitionSeries.Sequence durationInFrames={SCENES.cta}>
              <CtaScene />
            </TransitionSeries.Sequence>
          </TransitionSeries>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
