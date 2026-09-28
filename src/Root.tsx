import React from "react";
import { Composition } from "remotion";
import { BitaxusPromo, calculatePromoMetadata, promoDuration } from "./BitaxusPromo";
import { defaultPromoProps, promoSchema } from "./schema";
import { FPS } from "./theme";
import { DesignVideo } from "./editor/render/DesignVideo";
import { TEMPLATES } from "./editor/templates";
import { totalFrames } from "./editor/timing";

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
      {/* Plantillas del editor, para compararlas con el video original */}
      {TEMPLATES.map((t) => {
        const design = t.make();
        const size = { "9:16": [1080, 1920], "4:5": [1080, 1350], "1:1": [1080, 1080], "16:9": [1920, 1080] }[design.format];
        return (
          <Composition
            key={t.id}
            id={`Plantilla-${t.id}`}
            component={DesignVideo}
            defaultProps={{ design }}
            durationInFrames={totalFrames(design)}
            fps={FPS}
            width={size[0]}
            height={size[1]}
          />
        );
      })}
    </>
  );
};
