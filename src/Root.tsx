import React from "react";
import { Composition } from "remotion";
import { BitaxusPromo, PROMO_DURATION } from "./BitaxusPromo";
import { FPS } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Reels / Stories / TikTok */}
      <Composition
        id="BitaxusPromo"
        component={BitaxusPromo}
        durationInFrames={PROMO_DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      {/* Feed de Instagram (4:5) */}
      <Composition
        id="BitaxusPromoSquare"
        component={BitaxusPromo}
        durationInFrames={PROMO_DURATION}
        fps={FPS}
        width={1080}
        height={1350}
      />
    </>
  );
};
