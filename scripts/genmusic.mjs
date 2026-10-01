// Genera una pista electrónica original (sin derechos) en public/music.wav
import fs from "node:fs";
const SR = 44100, BPM = 118, DUR = 14.5;
const N = Math.floor(SR * DUR);
const L = new Float32Array(N), R = new Float32Array(N);
const beat = 60 / BPM;
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const add = (t0, len, fn, pan = 0, gain = 1) => {
  const s = Math.floor(t0 * SR), n = Math.floor(len * SR);
  for (let i = 0; i < n && s + i < N; i++) {
    const v = fn(i / SR, i / n) * gain;
    L[s + i] += v * (1 - Math.max(0, pan)); R[s + i] += v * (1 + Math.min(0, pan));
  }
};
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const kick = (t) => add(t, 0.35, (x, p) => Math.sin(2 * Math.PI * (45 * x + 90 * (1 - Math.exp(-x * 30)) / 30 * 1)) * Math.exp(-x * 9), 0, 0.9);
const snare = (t) => add(t, 0.22, (x) => (rnd() * 0.6 + Math.sin(2 * Math.PI * 190 * x) * 0.4) * Math.exp(-x * 18), 0, 0.35);
const hat = (t, g = 0.12) => add(t, 0.06, (x) => rnd() * Math.exp(-x * 70), 0.2, g);
const bass = (t, len, m) => add(t, len, (x, p) => {
  const f = hz(m); const saw = 2 * ((x * f) % 1) - 1;
  return (Math.sin(2 * Math.PI * f * x) * 0.7 + saw * 0.25 * Math.exp(-x * 6)) * Math.min(1, x * 200) * (1 - p * 0.3);
}, 0, 0.42);
const pluck = (t, m, pan) => add(t, 0.45, (x) => {
  const f = hz(m); const sq = Math.sign(Math.sin(2 * Math.PI * f * x)) * 0.5 + Math.sin(2 * Math.PI * f * 2.003 * x) * 0.3;
  return sq * Math.exp(-x * 7);
}, pan, 0.11);
const pad = (t, len, ms) => ms.forEach((m, k) => add(t, len, (x, p) => {
  const f = hz(m);
  return (Math.sin(2 * Math.PI * f * x) + Math.sin(2 * Math.PI * f * 1.004 * x)) * 0.5 * Math.sin(Math.PI * Math.min(1, p)) ** 0.6;
}, k % 2 ? 0.5 : -0.5, 0.055));
const chords = [[57, 60, 64], [53, 57, 60], [48, 55, 60], [55, 59, 62]]; // Am F C G
const roots = [33, 29, 36, 31];
const bars = Math.ceil(DUR / (beat * 4));
for (let b = 0; b < bars; b++) {
  const t0 = b * beat * 4, c = b % 4;
  pad(t0, beat * 4, chords[c]);
  for (let i = 0; i < 8; i++) {
    const t = t0 + i * beat / 2;
    if (b >= 1) bass(t, beat / 2 * 0.9, roots[c] + (i % 4 === 3 ? 12 : 0));
    if (b >= 1) hat(t + (i % 2 ? 0 : 0), i % 2 ? 0.14 : 0.07);
    const ch = chords[c]; pluck(t, ch[i % 3] + 12, i % 2 ? 0.6 : -0.6);
  }
  for (let q = 0; q < 4; q++) { if (b >= 1 || q === 0) kick(t0 + q * beat); if (b >= 1 && q % 2 === 1) snare(t0 + q * beat); }
}
// riser de ruido hacia el cierre y fade out
const rs = DUR - 4.5; add(rs, 2.2, (x, p) => rnd() * p * p, 0, 0.12);
let peak = 0; for (let i = 0; i < N; i++) { const f = Math.min(1, (N - i) / (SR * 1.6)) * Math.min(1, i / (SR * 0.15)); L[i] *= f; R[i] *= f; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVEfmt ", 8); buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
const g = 0.9 / peak;
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(L[i] * g * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] * g * 32767), 46 + i * 4); }
fs.writeFileSync("public/music.wav", buf); console.log("ok", peak);
