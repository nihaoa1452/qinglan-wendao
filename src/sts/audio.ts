/** 8-bit style sound effects synthesized with Web Audio. No audio files needed. */

export type SfxName =
  | 'ui' | 'card' | 'attack' | 'block' | 'hurt' | 'heal' | 'poison'
  | 'coin' | 'reward' | 'potion' | 'map' | 'battle' | 'turn'
  | 'win' | 'victory' | 'defeat' | 'upgrade' | 'start' | 'error';

const STORAGE_KEY = 'qinglan-sts-sfx-muted-v1';
const MASTER_VOLUME = 0.8;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let muted = false;

try {
  muted = localStorage.getItem(STORAGE_KEY) === '1';
} catch {
  // Storage is optional.
}

export function isSfxMuted(): boolean {
  return muted;
}

export function initAudio(): void {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return;
  }
  const Ctor = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  try {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(ctx.destination);
    const frames = Math.floor(ctx.sampleRate * 0.6);
    noiseBuffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  } catch {
    ctx = null;
    master = null;
    noiseBuffer = null;
  }
}

export function toggleSfxMuted(): boolean {
  muted = !muted;
  try {
    localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
  } catch {
    // Storage is optional.
  }
  return muted;
}

type ToneOptions = {
  type?: OscillatorType;
  gain?: number;
  slideTo?: number;
  attack?: number;
};

function tone(freq: number, delay: number, duration: number, options: ToneOptions = {}): void {
  if (!ctx || !master) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = options.type ?? 'square';
  osc.frequency.setValueAtTime(freq, start);
  if (options.slideTo) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, options.slideTo), start + duration);
  }
  const peak = options.gain ?? 0.09;
  const attack = options.attack ?? 0.006;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

type NoiseOptions = {
  gain?: number;
  freq?: number;
  freqEnd?: number;
  q?: number;
  type?: BiquadFilterType;
};

function noise(delay: number, duration: number, options: NoiseOptions = {}): void {
  if (!ctx || !master || !noiseBuffer) return;
  const start = ctx.currentTime + delay;
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type = options.type ?? 'bandpass';
  filter.frequency.setValueAtTime(options.freq ?? 1200, start);
  if (options.freqEnd) {
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, options.freqEnd), start + duration);
  }
  filter.Q.value = options.q ?? 0.9;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(options.gain ?? 0.06, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter).connect(gain).connect(master);
  source.start(start);
  source.stop(start + duration + 0.02);
}

/** C major pentatonic, so even the chiptune side stays close to the ink-wash mood. */
const P = {
  c4: 261.63, d4: 293.66, e4: 329.63, g4: 392.0, a4: 440.0,
  c5: 523.25, d5: 587.33, e5: 659.25, g5: 783.99, a5: 880.0, c6: 1046.5,
};

function arp(notes: number[], step: number, duration: number, type: OscillatorType = 'square', gain = 0.07): void {
  notes.forEach((freq, i) => tone(freq, i * step, duration, { type, gain }));
}

export function playSfx(name: SfxName): void {
  if (muted) return;
  initAudio();
  if (!ctx || !master) return;
  if (ctx.state === 'suspended') void ctx.resume();

  switch (name) {
    case 'ui':
      tone(880, 0, 0.05, { gain: 0.045 });
      tone(660, 0.035, 0.06, { gain: 0.035 });
      break;
    case 'card':
      noise(0, 0.15, { freq: 500, freqEnd: 2600, gain: 0.04, q: 1.2 });
      arp([P.c5, P.e5, P.g5], 0.03, 0.08, 'square', 0.055);
      break;
    case 'attack':
      noise(0, 0.13, { freq: 2000, freqEnd: 300, gain: 0.1 });
      tone(190, 0, 0.13, { slideTo: 70, gain: 0.09 });
      break;
    case 'block':
      tone(1318.5, 0, 0.12, { type: 'triangle', gain: 0.08 });
      tone(1760, 0.015, 0.17, { type: 'triangle', gain: 0.055 });
      break;
    case 'hurt':
      tone(165, 0, 0.22, { slideTo: 55, gain: 0.1 });
      noise(0, 0.18, { freq: 600, freqEnd: 120, gain: 0.08 });
      break;
    case 'heal':
      arp([P.c5, P.e5, P.g5, P.c6], 0.07, 0.16, 'triangle', 0.06);
      break;
    case 'poison':
      tone(330, 0, 0.12, { slideTo: 190, gain: 0.05 });
      tone(240, 0.1, 0.15, { slideTo: 130, gain: 0.045 });
      break;
    case 'coin':
      tone(988, 0, 0.08, { gain: 0.06 });
      tone(1319, 0.06, 0.15, { gain: 0.06 });
      break;
    case 'reward':
      arp([P.c5, P.e5, P.g5, P.c6], 0.085, 0.2, 'square', 0.055);
      break;
    case 'potion':
      tone(300, 0, 0.1, { type: 'sine', slideTo: 520, gain: 0.07 });
      tone(520, 0.1, 0.13, { type: 'sine', slideTo: 300, gain: 0.06 });
      noise(0.02, 0.08, { freq: 900, gain: 0.03 });
      break;
    case 'map':
      tone(P.g4, 0, 0.07, { gain: 0.04 });
      tone(P.c5, 0.055, 0.1, { gain: 0.045 });
      break;
    case 'battle':
      tone(196, 0, 0.18, { type: 'triangle', gain: 0.11 });
      noise(0, 0.14, { freq: 700, gain: 0.05 });
      tone(294, 0.12, 0.24, { type: 'triangle', gain: 0.08 });
      tone(392, 0.24, 0.28, { type: 'triangle', gain: 0.07 });
      break;
    case 'turn':
      tone(130, 0, 0.13, { type: 'triangle', gain: 0.09, slideTo: 70 });
      noise(0, 0.09, { freq: 320, gain: 0.045 });
      break;
    case 'win':
      arp([P.c5, P.e5, P.g5], 0.1, 0.18, 'square', 0.06);
      tone(P.c6, 0.3, 0.4, { gain: 0.06 });
      break;
    case 'victory':
      arp([P.c5, P.e5, P.g5], 0.12, 0.22, 'square', 0.065);
      tone(P.c6, 0.4, 0.55, { gain: 0.07 });
      tone(P.e5, 0.4, 0.55, { type: 'triangle', gain: 0.05 });
      tone(P.g5, 0.4, 0.55, { type: 'triangle', gain: 0.045 });
      break;
    case 'defeat':
      arp([P.a4, 349.23, 293.66, 220], 0.18, 0.32, 'triangle', 0.07);
      break;
    case 'upgrade':
      arp([P.g4, P.c5, P.e5, P.g5, P.c6], 0.07, 0.16, 'triangle', 0.055);
      break;
    case 'start':
      arp([P.c4, P.e4, P.g4, P.c5], 0.09, 0.18, 'triangle', 0.055);
      break;
    case 'error':
      tone(120, 0, 0.09, { gain: 0.06 });
      tone(98, 0.085, 0.11, { gain: 0.05 });
      break;
  }
}
