import type { GameState } from './types';

/** Deterministic PRNG (mulberry32) whose state lives inside GameState. */
export function nextRandom(state: GameState): number {
  let t = (state.rngState = (state.rngState + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randomInt(state: GameState, maxExclusive: number): number {
  return Math.floor(nextRandom(state) * maxExclusive);
}

export function pick<T>(state: GameState, items: T[]): T {
  return items[randomInt(state, items.length)];
}

export function shuffled<T>(state: GameState, items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(state, i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
