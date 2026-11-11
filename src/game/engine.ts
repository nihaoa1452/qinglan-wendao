import { CARDS, RARITY_WEIGHT, SHOP_ACTION_POOL, SHOP_FACILITY_POOL, STARTER_DECK } from './cards';
import { EVENTS, hasFacility, type GameEvent } from './events';
import { nextRandom, pick, shuffled } from './rng';
import type {
  CardInstance,
  DailyIncome,
  GameState,
  IncomeItem,
  ShopOffer,
  Tone,
} from './types';

export const GAME_VERSION = 3;
export const WIN_REPUTATION = 600;
export const MAX_DAYS = 30;
export const HAND_SIZE = 5;
export const BOARD_SLOTS = 8;
export const SHOP_SIZE = 2;
export const REFRESH_COST = 2;

function pushLog(state: GameState, text: string, tone: Tone = 'info'): void {
  state.log.unshift({ day: state.day, text, tone });
  if (state.log.length > 80) state.log.length = 80;
}

function makeCard(state: GameState, defId: string): CardInstance {
  return { uid: state.nextUid++, defId };
}

function drawCards(state: GameState, count: number): void {
  for (let i = 0; i < count; i++) {
    if (state.deck.length === 0) {
      if (state.discard.length === 0) return;
      state.deck = shuffled(state, state.discard);
      state.discard = [];
    }
    const card = state.deck.pop();
    if (card) state.hand.push(card);
  }
}

function weightedPickCard(state: GameState, ids: string[]): string {
  const total = ids.reduce((sum, id) => sum + RARITY_WEIGHT[CARDS[id].rarity], 0);
  let roll = nextRandom(state) * total;
  for (const id of ids) {
    roll -= RARITY_WEIGHT[CARDS[id].rarity];
    if (roll <= 0) return id;
  }
  return ids[ids.length - 1];
}

function weightedPickEvent(state: GameState, events: GameEvent[]): GameEvent {
  const total = events.reduce((sum, event) => sum + event.weight, 0);
  let roll = nextRandom(state) * total;
  for (const event of events) {
    roll -= event.weight;
    if (roll <= 0) return event;
  }
  return events[events.length - 1];
}

function rollShop(state: GameState): void {
  // v0.2: the shop always offers one action card and one facility card.
  const offers: ShopOffer[] = [];
  const actionId = weightedPickCard(state, SHOP_ACTION_POOL);
  offers.push({ defId: actionId, price: CARDS[actionId].cost, sold: false });
  if (SHOP_SIZE > 1) {
    const facilityId = weightedPickCard(state, SHOP_FACILITY_POOL);
    offers.push({ defId: facilityId, price: CARDS[facilityId].cost, sold: false });
  }
  state.shop = offers.slice(0, SHOP_SIZE);
}

function rollEvent(state: GameState): void {
  if (state.day < 3) return;
  const overdue = state.day - state.lastEventDay >= 3;
  if (!overdue && nextRandom(state) > 0.35) return;
  const eligible = EVENTS.filter((event) => state.day >= event.minDay);
  if (eligible.length === 0) return;
  const event = weightedPickEvent(state, eligible);
  const result = event.apply(state);
  state.lastEventDay = state.day;
  state.lastEvent = {
    id: event.id,
    day: state.day,
    name: event.name,
    text: result.text,
    tone: result.tone,
  };
  pushLog(state, `【${event.name}】${result.text}`, result.tone);
  state.stats.events += 1;
  checkVictory(state);
}

function checkVictory(state: GameState): void {
  if (state.phase !== 'playing') return;
  if (state.reputation >= state.winReputation) {
    state.phase = 'won';
    state.ending = {
      won: true,
      title: '青岚之名，响彻九州',
      text: `第 ${state.day} 日，青岚宗声望达到 ${state.reputation}。八方修士来朝，山门重开，香火鼎盛。`,
    };
    pushLog(state, `【宗门大兴】声望突破 ${state.winReputation}，青岚宗重归一流仙门！`, 'good');
  }
}

function checkBankruptcy(state: GameState): void {
  if (state.phase !== 'playing') return;
  if (state.stones < 0) {
    state.phase = 'lost';
    state.ending = {
      won: false,
      title: '宗门解散',
      text: `灵石耗尽，青岚宗欠下巨债。第 ${state.day} 日，弟子卷起铺盖，连夜下了山。`,
    };
    pushLog(state, '【宗门解散】灵石告罄，弟子四散，青岚宗就此除名。', 'bad');
  }
}

export function createGame(seed?: number): GameState {
  const actualSeed = (seed ?? Date.now() >>> 0) >>> 0;
  const state: GameState = {
    version: GAME_VERSION,
    seed: actualSeed,
    rngState: actualSeed,
    day: 1,
    maxDays: MAX_DAYS,
    winReputation: WIN_REPUTATION,
    phase: 'playing',
    stones: 20,
    disciples: 2,
    reputation: 0,
    deck: [],
    hand: [],
    discard: [],
    facilities: [],
    shop: [],
    shopRefreshed: false,
    lastEventDay: 1,
    lastEvent: null,
    nextUid: 1,
    log: [],
    ending: null,
    stats: { cardsPlayed: 0, cardsBought: 0, events: 0, daysEnded: 0 },
  };

  state.deck = shuffled(
    state,
    STARTER_DECK.map((defId) => makeCard(state, defId)),
  );
  drawCards(state, HAND_SIZE);
  rollShop(state);

  pushLog(state, '每日抽 5 张手牌；设施打出后永久留在宗门，日终结算产出。', 'info');
  pushLog(state, `目标：在第 ${MAX_DAYS} 日结束前，将青岚宗声望提升至 ${WIN_REPUTATION}。`, 'info');
  pushLog(state, '你接任青岚宗掌门。宗门凋敝，只剩两名弟子与二十枚灵石。', 'event');
  return state;
}

export function getPlayIssue(state: GameState, uid: number): string | null {
  if (state.phase !== 'playing') return '本局已经结束。';
  const instance = state.hand.find((card) => card.uid === uid);
  if (!instance) return '这张牌已不在手中。';
  const def = CARDS[instance.defId];
  if (def.cost > 0 && state.stones < def.cost) return `灵石不足，打出【${def.name}】需要 ${def.cost} 灵石。`;
  if (def.type === 'facility' && state.facilities.length >= BOARD_SLOTS) {
    return '宗门八景已满，无法再建设施。';
  }
  return null;
}

export function getBuyIssue(state: GameState, index: number): string | null {
  if (state.phase !== 'playing') return '本局已经结束。';
  const offer = state.shop[index];
  if (!offer) return '这个货位已经空了。';
  if (offer.sold) return '这张牌已经买走了。';
  if (state.stones < offer.price) return `灵石不足，购入【${CARDS[offer.defId].name}】需要 ${offer.price} 灵石。`;
  return null;
}

export function getRefreshIssue(state: GameState): string | null {
  if (state.phase !== 'playing') return '本局已经结束。';
  if (state.shop.every((offer) => offer.sold)) return '今日的货已经卖完了。';
  if (state.shopRefreshed) return '今日已经换过一批货了。';
  if (state.stones < REFRESH_COST) return `灵石不足，换货需要 ${REFRESH_COST} 灵石。`;
  return null;
}

function applyAction(state: GameState, defId: string): string {
  const parts: string[] = [];
  switch (defId) {
    case 'caishi':
      state.stones += 4;
      parts.push('灵石 +4');
      break;
    case 'zhaoshou':
      state.disciples += 1;
      parts.push('弟子 +1');
      break;
    case 'jiangdao': {
      const pavilions = state.facilities.filter((facility) => facility.defId === 'cangjingge').length;
      const bonus = pavilions * 2;
      const gain = 2 + bonus;
      state.reputation += gain;
      parts.push(`声望 +${gain}${bonus > 0 ? `（藏经阁 ×${pavilions}）` : ''}`);
      break;
    }
    case 'lixian':
      state.stones += 3;
      state.reputation += 1;
      parts.push('灵石 +3，声望 +1');
      break;
    case 'shilian': {
      const gain = state.disciples;
      state.stones += gain;
      parts.push(`灵石 +${gain}（${state.disciples} 名弟子）`);
      break;
    }
    case 'bushi':
      state.reputation += 3;
      parts.push('声望 +3');
      break;
    case 'mijing':
      state.stones += 6;
      state.reputation += 1;
      parts.push('灵石 +6，声望 +1');
      break;
    case 'kuangmai':
      state.stones += 8;
      parts.push('灵石 +8');
      break;
    case 'shanyaoshi': {
      const linked = hasFacility(state, 'yaoyuan');
      const gain = 4 + (linked ? 3 : 0);
      state.stones += gain;
      parts.push(`灵石 +${gain}${linked ? '（药园联动）' : ''}`);
      break;
    }
    case 'mengui': {
      const bonus = Math.floor(state.disciples / 4);
      const gain = 1 + bonus;
      state.reputation += gain;
      parts.push(`声望 +${gain}${bonus > 0 ? `（${state.disciples} 名弟子）` : ''}`);
      break;
    }
    case 'keqing': {
      const linked = hasFacility(state, 'yanwuchang');
      const gain = 3 + (linked ? 2 : 0);
      state.reputation += gain;
      parts.push(`声望 +${gain}${linked ? '（演武场联动）' : ''}`);
      break;
    }
    case 'xunshan':
      state.stones += 5;
      state.reputation += 1;
      parts.push('灵石 +5，声望 +1');
      break;
    case 'lundao':
      state.reputation += 6;
      parts.push('声望 +6');
      break;
    case 'guangna':
      state.disciples += 2;
      parts.push('弟子 +2');
      break;
    case 'tianji':
      drawCards(state, 2);
      parts.push('抽 2 张牌');
      break;
    case 'kaitan':
      state.disciples += 1;
      state.reputation += 2;
      parts.push('弟子 +1，声望 +2');
      break;
    case 'mijingxunbao': {
      state.stones += 10;
      const commonActions = SHOP_ACTION_POOL.filter(
        (id) => CARDS[id].rarity === 'common' && id !== 'mijingxunbao',
      );
      const defId = pick(state, commonActions);
      state.hand.push(makeCard(state, defId));
      parts.push(`灵石 +10，获得《${CARDS[defId].name}》`);
      break;
    }
    case 'jingshi':
      drawCards(state, 3);
      parts.push('抽 3 张牌');
      break;
    case 'zushi':
      state.reputation += 12;
      parts.push('声望 +12');
      break;
    case 'wuxing':
      state.stones += 15;
      drawCards(state, 2);
      parts.push('灵石 +15，抽 2 张牌');
      break;
    default:
      parts.push('无事发生');
  }
  return parts.join('，');
}

export function playCard(prev: GameState, uid: number): GameState {
  if (getPlayIssue(prev, uid) !== null) return prev;
  const state = structuredClone(prev);
  const index = state.hand.findIndex((card) => card.uid === uid);
  const instance = state.hand[index];
  const def = CARDS[instance.defId];

  state.stones -= def.cost;
  state.hand.splice(index, 1);

  if (def.type === 'facility') {
    state.facilities.push({ uid: instance.uid, defId: def.id, builtDay: state.day });
    pushLog(state, `兴建【${def.name}】，宗门气象一新。`, 'good');
  } else {
    const detail = applyAction(state, def.id);
    state.discard.push(instance);
    pushLog(state, `施展【${def.name}】：${detail}。`, 'good');
  }

  state.stats.cardsPlayed += 1;
  checkVictory(state);
  return state;
}

export function buyOffer(prev: GameState, index: number): GameState {
  if (getBuyIssue(prev, index) !== null) return prev;
  const state = structuredClone(prev);
  const offer = state.shop[index];
  offer.sold = true;
  state.stones -= offer.price;
  state.discard.push(makeCard(state, offer.defId));
  state.stats.cardsBought += 1;
  pushLog(state, `在坊市购入【${CARDS[offer.defId].name}】，收入行囊，稍后洗入牌库。`, 'good');
  return state;
}

export function refreshShop(prev: GameState): GameState {
  if (getRefreshIssue(prev) !== null) return prev;
  const state = structuredClone(prev);
  state.stones -= REFRESH_COST;
  state.shop = state.shop.map((offer) => {
    if (offer.sold) return offer;
    const pool = CARDS[offer.defId].type === 'action' ? SHOP_ACTION_POOL : SHOP_FACILITY_POOL;
    const candidates = pool.filter((id) => id !== offer.defId);
    const defId = weightedPickCard(state, candidates.length > 0 ? candidates : pool);
    return { defId, price: CARDS[defId].cost, sold: false };
  });
  state.shopRefreshed = true;
  pushLog(state, '给坊市掌柜塞了两块灵石，换了一批新货。', 'info');
  return state;
}

export function getDailyIncome(state: GameState): DailyIncome {
  const counts = new Map<string, number>();
  for (const facility of state.facilities) {
    counts.set(facility.defId, (counts.get(facility.defId) ?? 0) + 1);
  }
  const n = (id: string): number => counts.get(id) ?? 0;

  const items: IncomeItem[] = [];
  let stones = 0;
  let reputation = 0;
  let disciples = 0;

  const add = (item: IncomeItem): void => {
    items.push(item);
    stones += item.stones ?? 0;
    reputation += item.reputation ?? 0;
    disciples += item.disciples ?? 0;
  };

  if (n('lingtian') > 0) add({ label: `灵田 ×${n('lingtian')}`, stones: n('lingtian') * 3 });
  if (n('julingzhen') > 0) add({ label: `聚灵阵 ×${n('julingzhen')}`, stones: n('julingzhen') * 4 });
  if (n('cangjingge') > 0) add({ label: `藏经阁 ×${n('cangjingge')}`, reputation: n('cangjingge') * 2 });
  if (n('wudaoya') > 0) add({ label: `悟道崖 ×${n('wudaoya')}`, reputation: n('wudaoya') * 3 });
  if (n('yanwuchang') > 0) {
    const gain = n('yanwuchang') * Math.floor(state.disciples / 2);
    if (gain > 0) add({ label: `演武场 ×${n('yanwuchang')}`, reputation: gain });
  }
  if (n('danfang') > 0) {
    add({
      label: `丹房 ×${n('danfang')}`,
      stones: n('danfang') * 2,
      reputation: n('danfang'),
    });
  }
  if (n('yaoyuan') > 0) {
    const bonus = n('danfang') > 0 ? 2 : 0;
    add({
      label: `药园 ×${n('yaoyuan')}${bonus ? '（丹房加成）' : ''}`,
      stones: n('yaoyuan') * (1 + bonus),
    });
  }
  if (n('hushandazhen') > 0) {
    add({ label: `护山大阵 ×${n('hushandazhen')}`, stones: n('hushandazhen') });
  }

  let gatesDue = 0;
  for (const facility of state.facilities) {
    if (
      facility.defId === 'shanmen' &&
      state.day - facility.builtDay >= 3 &&
      (state.day - facility.builtDay) % 3 === 0
    ) {
      gatesDue += 1;
    }
  }
  if (gatesDue > 0) add({ label: '山门大开', disciples: gatesDue });

  if (state.disciples > 0) {
    add({ label: `弟子 ×${state.disciples} 供奉`, stones: state.disciples * 2 });
    add({ label: `弟子 ×${state.disciples} 俸禄`, stones: -state.disciples });
  }

  return { stones, reputation, disciples, items };
}

export function endDay(prev: GameState): GameState {
  if (prev.phase !== 'playing') return prev;
  const state = structuredClone(prev);
  const income = getDailyIncome(state);

  state.stones += income.stones;
  state.reputation += income.reputation;
  state.disciples += income.disciples;
  state.stats.daysEnded += 1;

  const parts: string[] = [];
  if (income.stones !== 0) parts.push(`${income.stones > 0 ? '+' : ''}${income.stones} 灵石`);
  if (income.reputation !== 0) parts.push(`+${income.reputation} 声望`);
  if (income.disciples !== 0) parts.push(`+${income.disciples} 弟子`);
  pushLog(state, `日终结算：${parts.length > 0 ? parts.join('，') : '门中无事，虚度一日'}。`, 'good');

  state.discard.push(...state.hand);
  state.hand = [];
  checkVictory(state);
  if (state.phase !== 'playing') return state;
  checkBankruptcy(state);
  if (state.phase !== 'playing') return state;

  if (state.day >= state.maxDays) {
    state.phase = 'lost';
    state.ending = {
      won: false,
      title: '大限已至',
      text: `三十日之期已满，青岚宗声望止步于 ${state.reputation}，终未能在东域立足。`,
    };
    pushLog(state, '【大限已至】三十日过去，青岚宗依旧默默无闻。', 'bad');
    return state;
  }

  state.day += 1;
  drawCards(state, HAND_SIZE);
  rollShop(state);
  state.shopRefreshed = false;
  rollEvent(state);
  return state;
}
