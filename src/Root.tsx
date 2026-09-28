import React from "react";
import { Composition } from "remotion";
import { BitaxusPromo, calculatePromoMetadata, promoDuration } from "./BitaxusPromo";
import { defaultPromoProps, promoSchema } from "./schema";
import { FPS } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Reels / Stories / TikTok */}
      <Composition
        id="BitaxusPromo"
        component={BitaxusPromo}
        schema={promoSchema}
        defaultProps={defaultPromoProps}
        calculateMetadata={calculatePromoMetadata}
        durationInFrames={promoDuration(defaultPromoProps.duracion)}
        fps={FPS}
        width={1080}
        height={1920}
      />
      {/* Feed de Instagram (4:5) */}
      <Composition
        id="BitaxusPromoSquare"
        component={BitaxusPromo}
        schema={promoSchema}
        defaultProps={defaultPromoProps}
        calculateMetadata={calculatePromoMetadata}
        durationInFrames={promoDuration(defaultPromoProps.duracion)}
        fps={FPS}
        width={1080}
        height={1350}
      />
    </>
  );
};
