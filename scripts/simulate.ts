import { CARDS } from '../src/game/cards';
import {
  createGame,
  endDay,
  getBuyIssue,
  getPlayIssue,
  getRefreshIssue,
  buyOffer,
  playCard,
  refreshShop,
} from '../src/game/engine';
import type { GameState } from '../src/game/types';

type Policy = {
  name: string;
  reserve: (state: GameState) => number;
  refresh: boolean;
  buyLimit?: number;
};

const policies: Policy[] = [
  { name: 'greedy', reserve: () => 0, refresh: true },
  { name: 'reserve-10', reserve: () => 10, refresh: false },
  { name: 'reserve-15', reserve: () => 15, refresh: false },
  { name: 'reserve-20', reserve: () => 20, refresh: false },
  { name: 'reserve-scale', reserve: (state) => 8 + state.day, refresh: true },
  { name: 'reserve-scale2', reserve: (state) => 10 + state.day * 1.5, refresh: true },
];

function playPriority(state: GameState, instId: number): number {
  const card = state.hand.find((c) => c.uid === instId);
  if (!card) return 99;
  const def = CARDS[card.defId];
  // facilities first (long-term engine), then reputation, then economy, then draw
  if (def.type === 'facility') {
    if (def.id === 'hushandazhen') return 0;
    if (def.id === 'cangjingge' || def.id === 'wudaoya') return 1;
    if (def.id === 'lingtian' || def.id === 'julingzhen') return 2;
    if (def.id === 'danfang' || def.id === 'yaoyuan' || def.id === 'shanmen' || def.id === 'yanwuchang') return 3;
    return 4;
  }
  if (def.id === 'lundao' || def.id === 'bushi' || def.id === 'jiangdao') return 1;
  if (def.id === 'guangna' || def.id === 'zhaoshou') return 3;
  if (def.id === 'tianji') return 2;
  return 2;
}

function playDay(state: GameState, policy: Policy): GameState {
  let guard = 0;
  while (guard++ < 20 && state.phase === 'playing') {
    const candidates = [...state.hand]
      .filter((inst) => getPlayIssue(state, inst.uid) === null)
      .sort((a, b) => playPriority(state, a.uid) - playPriority(state, b.uid));
    if (candidates.length === 0) break;
    let played = false;
    const reserve = policy.reserve(state);
    for (const inst of candidates) {
      const def = CARDS[inst.defId];
      if (def.cost > 0 && state.stones - def.cost < reserve) continue;
      state = playCard(state, inst.uid);
      played = true;
      break;
    }
    if (!played) break;
  }
  return state;
}

function shopPriority(state: GameState, defId: string): number {
  const def = CARDS[defId];
  if (def.type === 'facility') {
    if (def.id === 'hushandazhen') return 0;
    if (def.id === 'cangjingge' || def.id === 'wudaoya') return 1;
    if (def.id === 'danfang' || def.id === 'julingzhen' || def.id === 'lingtian') return 2;
    return 3;
  }
  if (def.id === 'lundao' || def.id === 'bushi') return 1;
  if (def.id === 'tianji') return 2;
  return 3;
}

function shopDay(state: GameState, policy: Policy): GameState {
  let guard = 0;
  while (guard++ < 4 && state.phase === 'playing') {
    const offers = state.shop
      .map((offer, index) => ({ offer, index }))
      .filter(({ index }) => getBuyIssue(state, index) === null)
      .sort((a, b) => shopPriority(state, a.offer.defId) - shopPriority(state, b.offer.defId));
    if (offers.length === 0) break;
    const reserve = policy.reserve(state);
    const { offer, index } = offers[0];
    if (state.stones - offer.price < reserve) break;
    state = buyOffer(state, index);
  }
  if (policy.refresh && state.phase === 'playing' && !state.shopRefreshed && state.stones > policy.reserve(state) + 12) {
    if (getRefreshIssue(state) === null) state = refreshShop(state);
  }
  return state;
}

function run(policy: Policy, seed: number, verbose = false, target = 100): { state: GameState; won: boolean } {
  let state = createGame(seed);
  state.winReputation = target;
  let guard = 0;
  while (state.phase === 'playing' && guard++ < 50) {
    state = playDay(state, policy);
    state = shopDay(state, policy);
    if (state.phase !== 'playing') break;
    state = endDay(state);
    if (verbose) {
      console.log(`day ${state.day - 1} -> ${state.day}: stones=${state.stones} disc=${state.disciples} rep=${state.reputation} fac=${state.facilities.length} phase=${state.phase}`);
    }
  }
  return { state, won: state.phase === 'won' };
}

const seeds = 500;
const targets = [300, 400, 450, 500, 550, 600];
for (const target of targets) {
  console.log(`\n=== target ${target} ===`);
  for (const policy of policies) {
    let wins = 0;
    let bankrupt = 0;
    let timeout = 0;
    let daySum = 0;
    let repSum = 0;
    for (let i = 0; i < seeds; i++) {
      const { state, won } = run(policy, 1000 + i, false, target);
      if (won) {
        wins++;
        daySum += state.day;
      } else if (state.phase === 'lost' && state.stones < 0) bankrupt++;
      else timeout++;
      repSum += state.reputation;
    }
    console.log(
      `${policy.name.padEnd(15)} win=${((wins / seeds) * 100).toFixed(1)}%  bankrupt=${((bankrupt / seeds) * 100).toFixed(1)}%  timeout=${((timeout / seeds) * 100).toFixed(1)}%  avgWinDay=${(daySum / Math.max(1, wins)).toFixed(1)}  avgRep=${(repSum / seeds).toFixed(1)}`,
    );
  }
}

console.log('\n--- sample game (reserve-scale2, target 600, seed 1000) ---');
run(policies[5], 1000, true, 600);
