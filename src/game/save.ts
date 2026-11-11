import { GAME_VERSION } from './engine';
import type { GameState } from './types';

const SAVE_KEY = 'qinglan-zong-save-v1';

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Saving is best-effort; private mode or a full quota should not break play.
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (parsed.version !== GAME_VERSION) return null;
    if (!Array.isArray(parsed.hand) || !Array.isArray(parsed.facilities)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}
