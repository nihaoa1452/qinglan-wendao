import type { MetaState, RunState } from './types';

const KEY = 'qinglan-sts-save-v1';
const META_KEY = 'qinglan-sts-meta-v1';

export function saveRun(run: RunState): void {
  try {
    if (run.screen === 'victory' || run.screen === 'defeat') {
      localStorage.removeItem(KEY);
      return;
    }
    localStorage.setItem(KEY, JSON.stringify(run));
  } catch {
    // Saving is best-effort.
  }
}

export function loadRun(): RunState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const run = JSON.parse(raw) as RunState;
    if (!run || !Array.isArray(run.deck) || !Array.isArray(run.map)) return null;
    if (!run.availableIds || !run.relics) return null;
    if (run.screen === 'victory' || run.screen === 'defeat') {
      localStorage.removeItem(KEY);
      return null;
    }
    if (run.screen === 'combat' && !run.combat) run.screen = 'map';
    run.cycle ??= 1;
    run.metaSettled ??= false;
    if (run.combat) {
      run.combat.combo ??= 0;
      run.combat.dexterity ??= 0;
      run.combat.enemy.poison ??= 0;
    }
    if (run.shop) {
      run.shop.removalPrice ??= 50;
      run.shop.removalUsed ??= false;
    }
    run.potions ??= [];
    return run;
  } catch {
    return null;
  }
}

export function loadMeta(): MetaState {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return { essence: 0, unlocked: [], cycle: 1 };
    const meta = JSON.parse(raw) as MetaState;
    return {
      essence: Math.max(0, Number(meta.essence) || 0),
      unlocked: Array.isArray(meta.unlocked) ? meta.unlocked : [],
      cycle: Math.max(1, Number(meta.cycle) || 1),
    };
  } catch {
    return { essence: 0, unlocked: [], cycle: 1 };
  }
}

export function saveMeta(meta: MetaState): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // ignore
  }
}

export function clearRun(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
