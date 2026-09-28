import React from "react";
import { Easing, interpolate, spring } from "remotion";
import { ElementData, FPS } from "../types";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type AnimState = {
  visible: boolean;
  // 0 → 1 mientras entra.
  enter: number;
  // 0 → 1 mientras sale.
  exit: number;
  // Frames desde que apareció el elemento.
  localFrame: number;
  style: React.CSSProperties;
};

// Calcula cómo se ve un elemento en un frame de su escena: si está visible,
// cuánto lleva de su animación de entrada/salida y el estilo resultante.
export const getAnimState = (el: ElementData, sceneFrame: number): AnimState => {
  const startF = Math.round(el.start * FPS);
  const endF = Math.round(el.end * FPS);
  const localFrame = sceneFrame - startF;
  if (sceneFrame < startF || sceneFrame >= endF) {
    return { visible: false, enter: 0, exit: 0, localFrame, style: {} };
  }

  const enterF = Math.max(1, Math.round(el.enter.duration * FPS));
  const exitF = Math.max(1, Math.round(el.exit.duration * FPS));

  const enterLinear = el.enter.kind === "none" ? 1 : interpolate(localFrame, [0, enterF], [0, 1], clamp);
  const enterSpring =
    el.enter.kind === "none"
      ? 1
      : spring({ frame: localFrame, fps: FPS, durationInFrames: enterF, config: { damping: 13, stiffness: 120 } });
  const exit =
    el.exit.kind === "none" ? 0 : interpolate(sceneFrame, [endF - exitF, endF], [0, 1], clamp);

  let opacity = 1;
  let tx = 0;
  let ty = 0;
  let scale = 1;
  let blur = 0;
  let rotate = 0;
  let clipPath: string | undefined;

  const eased = Easing.out(Easing.cubic)(enterLinear);
  switch (el.enter.kind) {
    case "fade":
      opacity *= eased;
      break;
    case "up":
      opacity *= Math.min(1, enterSpring * 1.4);
      ty += interpolate(enterSpring, [0, 1], [120, 0]);
      break;
    case "down":
      opacity *= Math.min(1, enterSpring * 1.4);
      ty += interpolate(enterSpring, [0, 1], [-120, 0]);
      break;
    case "left":
      opacity *= Math.min(1, enterSpring * 1.4);
      tx += interpolate(enterSpring, [0, 1], [-260, 0]);
      break;
    case "right":
      opacity *= Math.min(1, enterSpring * 1.4);
      tx += interpolate(enterSpring, [0, 1], [260, 0]);
      break;
    case "pop":
      scale *= spring({ frame: localFrame, fps: FPS, durationInFrames: enterF, config: { damping: 9, stiffness: 150 } });
      break;
    case "zoom":
      opacity *= eased;
      scale *= interpolate(eased, [0, 1], [1.4, 1]);
      break;
    case "blur":
      opacity *= eased;
      blur += interpolate(eased, [0, 1], [24, 0]);
      break;
    case "reveal":
      clipPath = `inset(0 ${100 - eased * 100}% 0 0)`;
      break;
    // "words" y "typewriter" los resuelve el texto.
    default:
      break;
  }

  switch (el.exit.kind) {
    case "fade":
      opacity *= 1 - exit;
      break;
    case "up":
      opacity *= 1 - exit;
      ty -= exit * 120;
      break;
    case "down":
      opacity *= 1 - exit;
      ty += exit * 120;
      break;
    case "zoom":
      opacity *= 1 - exit;
      scale *= 1 + exit * 0.4;
      break;
    case "blur":
      opacity *= 1 - exit;
      blur += exit * 24;
      break;
    default:
      break;
  }

  switch (el.loop) {
    case "float":
      ty += Math.sin(localFrame / 20) * 10;
      break;
    case "pulse":
      scale *= 1 + Math.sin(localFrame / 8) * 0.035;
      break;
    case "spin":
      rotate += localFrame * 2;
      break;
    default:
      break;
  }

  return {
    visible: true,
    enter: enterLinear,
    exit,
    localFrame,
    style: {
      opacity: opacity * el.opacity,
      transform: `translate(${tx}px, ${ty}px) rotate(${el.rotation + rotate}deg) scale(${scale})`,
      filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
      clipPath,
    },
  };
};
