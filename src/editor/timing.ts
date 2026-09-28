import { Design, FPS, TRANSITION_FRAMES } from "./types";

export const sceneFrames = (d: Design) => d.scenes.map((s) => Math.max(1, Math.round(s.duration * FPS)));

// Frames de transición que hay ANTES de cada escena (la primera no tiene).
const transitionFrames = (d: Design) =>
  d.scenes.map((s, i) => {
    if (i === 0 || s.transition === "none") return 0;
    const frames = sceneFrames(d);
    // Una transición no puede durar más que las escenas que une.
    return Math.min(TRANSITION_FRAMES, frames[i] - 1, frames[i - 1] - 1);
  });

export const getTransitionFrames = transitionFrames;

// Frame global en que empieza cada escena.
export const sceneStarts = (d: Design) => {
  const frames = sceneFrames(d);
  const trans = transitionFrames(d);
  const starts: number[] = [];
  let acc = 0;
  frames.forEach((f, i) => {
    acc -= trans[i];
    starts.push(acc);
    acc += f;
  });
  return starts;
};

export const totalFrames = (d: Design) => {
  const frames = sceneFrames(d);
  const trans = transitionFrames(d);
  return Math.max(1, frames.reduce((a, b) => a + b, 0) - trans.reduce((a, b) => a + b, 0));
};

// Escena que se ve en un frame global (la última que ya empezó).
export const sceneAtFrame = (d: Design, frame: number) => {
  const starts = sceneStarts(d);
  let idx = 0;
  starts.forEach((s, i) => {
    if (frame >= s) idx = i;
  });
  return idx;
};
