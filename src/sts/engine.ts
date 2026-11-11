import {
  CARDS,
  CARD_POOL,
  DRAW_PER_TURN,
  ENEMIES,
  EVENTS,
  HAND_LIMIT,
  POTIONS,
  RELICS,
  START_ENERGY,
  START_GOLD,
  START_HP,
  STARTER_DECK,
  buildMap,
} from './data';
import type {
  CardInstance,
  CombatState,
  EnemyMove,
  MapNode,
  MetaState,
  RewardState,
  RunState,
} from './types';

function nextRandom(run: RunState): number {
  run.rngState = (Math.imul(run.rngState, 1664525) + 1013904223) >>> 0;
  return run.rngState / 4294967296;
}

function pick<T>(run: RunState, items: T[]): T {
  return items[Math.floor(nextRandom(run) * items.length)];
}

function shuffled<T>(run: RunState, items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(run) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeCard(run: RunState, defId: string, upgraded = false): CardInstance {
  return { uid: `c${run.nextUid++}`, defId, upgraded };
}
export function cardCost(card: CardInstance): number {
  const def = CARDS[card.defId];
  return card.upgraded && def.upgradedCost !== undefined ? def.upgradedCost : def.cost;
}

export function cardEffects(card: CardInstance) {
  const def = CARDS[card.defId];
  return card.upgraded && def.upgradedEffects ? def.upgradedEffects : def.effects;
}

export function cardDesc(card: CardInstance): string {
  const def = CARDS[card.defId];
  return card.upgraded && def.upgradedDesc ? def.upgradedDesc : def.desc;
}

export function cardName(card: CardInstance): string {
  return `${CARDS[card.defId].name}${card.upgraded ? '+' : ''}`;
}
export function enemyMove(enemyId: string, moveIndex: number): EnemyMove {
  const def = ENEMIES[enemyId];
  return def.pattern[moveIndex % def.pattern.length];
}

export function currentEnemyMove(run: RunState): EnemyMove | null {
  if (!run.combat) return null;
  return enemyMove(run.combat.enemy.defId, run.combat.enemy.moveIndex);
}

export function nodeById(run: RunState, id: string): MapNode | null {
  for (const row of run.map) {
    const found = row.find((node) => node.id === id);
    if (found) return found;
  }
  return null;
}export function createRun(seed = Date.now() >>> 0, meta?: MetaState, cycle?: number): RunState {
  const unlocked = new Set(meta?.unlocked ?? []);
  const actualCycle = Math.max(1, Math.floor(cycle ?? meta?.cycle ?? 1));
  const maxHp = START_HP + (unlocked.has('vitality') ? 10 : 0);
  const run: RunState = {
    seed,
    rngState: seed >>> 0,
    nextUid: 1,
    hp: maxHp,
    maxHp,
    gold: START_GOLD,
    floor: 0,
    cycle: actualCycle,
    metaSettled: false,
    potions: ['healing'],
    deck: [],
    relics: ['seal'],
    map: buildMap(seed, actualCycle),
    availableIds: [],
    currentNodeId: null,
    completedIds: [],
    screen: 'map',
    combat: null,
    reward: null,
    shop: null,
    event: null,
    log: [],
  };
  if (unlocked.has('card:zhuifeng')) run.deck.push(makeCard(run, 'zhuifeng'));
  if (unlocked.has('card:qingxin')) run.deck.push(makeCard(run, 'qingxin'));
  for (const id of STARTER_DECK) run.deck.push(makeCard(run, id));
  if (unlocked.has('relic:swordheart') && !run.relics.includes('swordheart')) run.relics.push('swordheart');
  if (unlocked.has('potion:focus')) run.potions.push('focus');
  run.availableIds = run.map[0].map((node) => node.id);
  return run;
}

function combatEnemyId(run: RunState, node: MapNode): string {
  if (node.type === 'boss') return pick(run, ['yaowang', 'moyan']);
  if (node.type === 'elite') return pick(run, ['moxiu', 'xuexiu']);
  if (node.row <= 2) return pick(run, ['shanyao', 'sanxiu', 'huyao']);
  return pick(run, ['yaoshou', 'sanxiu', 'shanyao', 'shikui', 'jianling']);
}

function drawCards(run: RunState, amount: number): void {
  const combat = run.combat;
  if (!combat) return;
  for (let i = 0; i < amount; i++) {
    if (combat.hand.length >= HAND_LIMIT) break;
    if (combat.drawPile.length === 0) {
      if (combat.discardPile.length === 0) break;
      combat.drawPile = shuffled(run, combat.discardPile);
      combat.discardPile = [];
    }
    const card = combat.drawPile.pop();
    if (card) combat.hand.push(card);
  }
}

function log(run: RunState, text: string): void {
  if (!run.combat) return;
  run.combat.log.unshift(text);
  if (run.combat.log.length > 80) run.combat.log.length = 80;
}

function hasRelic(run: RunState, id: string): boolean {
  return run.relics.includes(id);
}

export function startCombat(run: RunState, node: MapNode): void {
  const enemy = ENEMIES[combatEnemyId(run, node)];
  const enemyScale = 1 + (Math.max(1, run.cycle) - 1) * 0.16;
  const enemyMaxHp = Math.ceil(enemy.maxHp * enemyScale);
  const combat: CombatState = {
    enemy: {
      defId: enemy.id,
      hp: enemyMaxHp,
      maxHp: enemyMaxHp,
      block: 0,
      strength: 0,
      vulnerable: 0,
      weak: 0,
      poison: 0,
      moveIndex: 0,
    },
    hand: [],
    drawPile: shuffled(run, run.deck.map((card) => ({ ...card }))),
    discardPile: [],
    exhaustPile: [],
    energy: START_ENERGY + (hasRelic(run, 'jade') ? 1 : 0),
    maxEnergy: START_ENERGY,
    block: 0,
    strength: hasRelic(run, 'swordheart') ? 1 : 0,
    vulnerable: 0,
    weak: 0,
    combo: 0,
    dexterity: 0,
    turn: 1,
    over: null,
    log: [],
  };
  if (hasRelic(run, 'seal')) combat.block += 4;
  run.combat = combat;
  run.screen = 'combat';
  run.currentNodeId = node.id;
  if (!run.completedIds.includes(node.id)) run.completedIds.push(node.id);
  drawCards(run, DRAW_PER_TURN);
  log(run, `遭遇 ${enemy.name}。`);
  log(run, '第 1 回合开始。');
}

function relicReward(run: RunState): string | null {
  const owned = new Set(run.relics);
  const pool = Object.keys(RELICS).filter((id) => !owned.has(id));
  return pool.length ? pick(run, pool) : null;
}

function rewardCards(run: RunState): string[] {
  const pool = CARD_POOL.filter((id) => CARDS[id].rarity !== 'starter');
  const picked: string[] = [];
  let guard = 0;
  while (picked.length < 3 && guard++ < 30) {
    const id = pick(run, pool);
    if (!picked.includes(id)) picked.push(id);
  }
  return picked;
}

function finishCombat(run: RunState, won: boolean): void {
  const combat = run.combat;
  if (!combat || combat.over) return;
  combat.over = won ? 'won' : 'lost';
  if (!won) {
    run.screen = 'defeat';
    return;
  }
  if (hasRelic(run, 'gourd')) {
    run.hp = Math.min(run.maxHp, run.hp + 5);
  }
  const node = run.currentNodeId ? nodeById(run, run.currentNodeId) : null;
  if (node) run.floor = node.row;
  const isElite = node?.type === 'elite';
  const isBoss = node?.type === 'boss';
  let potion: string | null = null;
  if (run.potions.length < 3 && (isElite || isBoss || nextRandom(run) < 0.35)) {
    potion = pick(run, Object.keys(POTIONS));
    run.potions.push(potion);
  }
  const reward: RewardState = {
    nodeId: node?.id ?? '',
    cards: rewardCards(run),
    gold: 12 + (node?.row ?? 1) * 2 + Math.floor(nextRandom(run) * 9),
    relic: isElite ? relicReward(run) : null,
    potion,
    boss: Boolean(isBoss),
  };
  run.reward = reward;
  run.screen = 'reward';
  log(run, won ? '战斗胜利。' : '你倒下了。');
}

function damageEnemy(run: RunState, amount: number): void {
  const combat = run.combat;
  if (!combat || combat.over) return;
  let damage = amount + combat.strength;
  if (combat.weak > 0) damage = Math.floor(damage * 0.75);
  if (combat.enemy.vulnerable > 0) damage = Math.floor(damage * 1.5);
  const blocked = Math.min(combat.enemy.block, damage);
  combat.enemy.block -= blocked;
  const dealt = damage - blocked;
  combat.enemy.hp = Math.max(0, combat.enemy.hp - dealt);
  log(run, `造成 ${dealt} 点伤害${blocked ? `（格挡 ${blocked}）` : ''}。`);
  if (combat.enemy.hp <= 0) finishCombat(run, true);
}

export function playCard(run: RunState, uid: string): { ok: boolean; message?: string } {
  const combat = run.combat;
  if (!combat || combat.over) return { ok: false, message: '战斗已经结束。' };
  const index = combat.hand.findIndex((card) => card.uid === uid);
  if (index < 0) return { ok: false, message: '这张牌不在手中。' };
  const card = combat.hand[index];
  const cost = cardCost(card);
  if (cost > combat.energy) return { ok: false, message: '灵力不足。' };
  combat.energy -= cost;
  combat.hand.splice(index, 1);
  log(run, `打出 ${cardName(card)}。`);
  for (const effect of cardEffects(card)) {
    if (!run.combat || run.combat.over) break;
    switch (effect.kind) {
      case 'damage': {
        const bonus = effect.perCombo ? combat.combo * effect.perCombo : 0;
        for (let i = 0; i < (effect.hits ?? 1); i++) {
          if (!run.combat || run.combat.over) break;
          damageEnemy(run, effect.amount + bonus);
        }
        break;
      }
      case 'block':
        run.combat.block += effect.amount + run.combat.dexterity;
        break;
      case 'draw':
        drawCards(run, effect.amount);
        break;
      case 'energy':
        run.combat.energy += effect.amount;
        break;
      case 'heal':
        run.hp = Math.min(run.maxHp, run.hp + effect.amount);
        break;
      case 'loseHp':
        run.hp = Math.max(0, run.hp - effect.amount);
        if (run.hp <= 0) {
          run.combat.over = 'lost';
          run.screen = 'defeat';
        }
        break;
      case 'strength':
        run.combat.strength += effect.amount;
        break;
      case 'vulnerable':
        run.combat.enemy.vulnerable += effect.amount;
        break;
      case 'weak':
        run.combat.enemy.weak += effect.amount;
        break;
      case 'poison':
        run.combat.enemy.poison += effect.amount;
        break;
      case 'dexterity':
        run.combat.dexterity += effect.amount;
        break;
    }
  }
  if (run.combat && !run.combat.over) {
    const def = CARDS[card.defId];
    if (def.type === 'attack') run.combat.combo += 1;
    if (def.exhaust) run.combat.exhaustPile.push(card);
    else run.combat.discardPile.push(card);
  }
  return { ok: true };
}

export function usePotion(run: RunState, index: number): { ok: boolean; message?: string } {
  if (run.screen !== 'combat' || !run.combat || run.combat.over) {
    return { ok: false, message: '现在不能服用丹药。' };
  }
  const id = run.potions[index];
  if (!id) return { ok: false, message: '没有这枚丹药。' };
  const potion = POTIONS[id];
  run.potions.splice(index, 1);
  if (id === 'healing') {
    run.hp = Math.min(run.maxHp, run.hp + 15);
    log(run, `服用 ${potion.name}，回复 15 点气血。`);
    return { ok: true, message: `服用 ${potion.name}，回复 15 点气血。` };
  }
  if (id === 'focus') {
    run.combat.energy += 2;
    log(run, `服用 ${potion.name}，获得 2 点灵力。`);
    return { ok: true, message: `服用 ${potion.name}，获得 2 点灵力。` };
  }
  if (id === 'rage') {
    run.combat.strength += 2;
    log(run, `服用 ${potion.name}，获得 2 点力量。`);
    return { ok: true, message: `服用 ${potion.name}，获得 2 点力量。` };
  }
  return { ok: true, message: `服用 ${potion.name}。` };
}

export function enemyAttackDamage(run: RunState, move: EnemyMove): number {
  const combat = run.combat;
  if (!combat || !move.damage) return 0;
  const cycleScale = 1 + (Math.max(1, run.cycle) - 1) * 0.12;
  let damage = Math.ceil(move.damage * cycleScale) + combat.enemy.strength;
  if (combat.enemy.weak > 0) damage = Math.floor(damage * 0.75);
  if (combat.vulnerable > 0) damage = Math.floor(damage * 1.5);
  return damage;
}

function enemyAttack(run: RunState, move: EnemyMove): void {
  const combat = run.combat;
  if (!combat) return;
  if (move.vulnerable) combat.vulnerable += move.vulnerable;
  if (move.weak) combat.weak += move.weak;
  if (move.block) combat.enemy.block += move.block;
  if (move.strength) combat.enemy.strength += move.strength;
  for (let i = 0; i < (move.hits ?? 1); i++) {
    if (!move.damage) break;
    const damage = enemyAttackDamage(run, move);
    const blocked = Math.min(combat.block, damage);
    combat.block -= blocked;
    const dealt = damage - blocked;
    run.hp = Math.max(0, run.hp - dealt);
    log(run, `受到 ${dealt} 点伤害${blocked ? `（格挡 ${blocked}）` : ''}。`);
    if (run.hp <= 0) {
      finishCombat(run, false);
      return;
    }
  }
  if (move.intent === 'defend' && !move.damage) log(run, '敌人架起防御。');
  if (move.strength && !move.damage) log(run, '敌人气势增强了。');
  if ((move.vulnerable || move.weak) && !move.damage) log(run, '你被施加了负面状态。');
}

export function endTurn(run: RunState): void {
  const combat = run.combat;
  if (!combat || combat.over) return;
  const retained = combat.hand.filter((card) => CARDS[card.defId].retain);
  combat.discardPile.push(...combat.hand.filter((card) => !CARDS[card.defId].retain));
  combat.hand = retained;
  if (combat.vulnerable > 0) combat.vulnerable--;
  if (combat.weak > 0) combat.weak--;
  // Poison burns at the start of the enemy turn, ignoring block.
  if (combat.enemy.poison > 0) {
    const poisonDamage = combat.enemy.poison;
    combat.enemy.hp = Math.max(0, combat.enemy.hp - poisonDamage);
    log(run, `中毒发作，造成 ${poisonDamage} 点伤害。`);
    combat.enemy.poison--;
    if (combat.enemy.hp <= 0) {
      finishCombat(run, true);
      return;
    }
  }
  const hpBeforeEnemy = run.hp;
  const move = enemyMove(combat.enemy.defId, combat.enemy.moveIndex);
  combat.enemy.block = 0;
  enemyAttack(run, move);
  if (!run.combat || run.combat.over) return;
  if (combat.enemy.vulnerable > 0) combat.enemy.vulnerable--;
  if (combat.enemy.weak > 0) combat.enemy.weak--;
  combat.enemy.moveIndex++;
  combat.turn++;
  const leftoverBlock = combat.block;
  const hpLost = Math.max(0, hpBeforeEnemy - run.hp);
  combat.block = 0;
  combat.energy = combat.maxEnergy;
  combat.combo = 0;
  drawCards(run, DRAW_PER_TURN);
  if (leftoverBlock > 0) log(run, `剩余格挡 ${leftoverBlock} 已清空。`);
  log(run, `第 ${combat.turn} 回合开始。`);
  log(run, `上回合结算：${move.name}造成 ${hpLost} 点气血损失${leftoverBlock > 0 ? `，剩余格挡 ${leftoverBlock}` : ''}。`);
}

function eventGoldCost(eventId: string, choiceId: string): number | null {
  const costs: Record<string, number> = {
    'wanderer:trade': 40,
    'plague:treat': 30,
    'caravan:buy': 40,
    'beggar:give': 20,
    'tax:pay': 30,
    'challenge:pay': 25,
  };
  return costs[`${eventId}:${choiceId}`] ?? null;
}

function randomCardOfRarity(run: RunState, rarity: 'common' | 'uncommon' | 'rare'): string | null {
  const pool = CARD_POOL.filter((id) => CARDS[id].rarity === rarity);
  return pool.length ? pick(run, pool) : null;
}

function grantRandomCard(run: RunState, rarity: 'common' | 'uncommon' | 'rare'): string | null {
  const id = randomCardOfRarity(run, rarity);
  if (!id) return null;
  run.deck.push(makeCard(run, id));
  return CARDS[id].name;
}

function upgradeRandomCard(run: RunState): string | null {
  const candidates = run.deck.filter((card) => !card.upgraded);
  if (!candidates.length) return null;
  const card = pick(run, candidates);
  card.upgraded = true;
  return `${CARDS[card.defId].name}`;
}

function gainRandomRelic(run: RunState): string | null {
  const id = relicReward(run);
  if (!id) {
    run.gold += 30;
    return null;
  }
  run.relics.push(id);
  return RELICS[id].name;
}

function hurtForEvent(run: RunState, amount: number): void {
  run.hp = Math.max(0, run.hp - amount);
  if (run.hp <= 0) run.screen = 'defeat';
}

function finishEvent(run: RunState): void {
  if (run.hp <= 0) {
    run.screen = 'defeat';
    return;
  }
  finishNode(run);
}

export function chooseNode(run: RunState, id: string): { ok: boolean; message?: string } {
  if (!run.availableIds.includes(id)) return { ok: false, message: '这条路现在走不通。' };
  const node = nodeById(run, id);
  if (!node) return { ok: false, message: '节点不存在。' };
  run.currentNodeId = id;
  run.completedIds.push(id);
  if (node.type === 'battle' || node.type === 'elite' || node.type === 'boss') {
    startCombat(run, node);
    return { ok: true };
  }
  if (node.type === 'event') {
    const def = pick(run, EVENTS);
    run.event = {
      nodeId: node.id,
      id: def.id,
      title: def.title,
      text: def.text,
      art: def.art,
      choices: def.choices.map((choice) => {
        const cost = eventGoldCost(def.id, choice.id);
        return { ...choice, disabled: cost !== null && run.gold < cost };
      }),
    };
    run.screen = 'event';
    return { ok: true };
  }
  if (node.type === 'shop') {
    const offers = rewardCards(run).map((defId) => {
      const rarity = CARDS[defId].rarity;
      const price = rarity === 'rare' ? 90 : rarity === 'uncommon' ? 65 : 45;
      return { defId, price, sold: false };
    });
    run.shop = { nodeId: node.id, offers, removalPrice: 50, removalUsed: false };
    run.screen = 'shop';
    return { ok: true };
  }
  run.screen = 'rest';
  return { ok: true };
}

function finishNode(run: RunState): void {
  const node = run.currentNodeId ? nodeById(run, run.currentNodeId) : null;
  if (node) {
    run.floor = node.row;
    run.availableIds = node.nextIds;
  }
  run.currentNodeId = null;
  run.combat = null;
  run.reward = null;
  run.shop = null;
  run.event = null;
  if (run.screen !== 'victory') run.screen = 'map';
}

export function chooseReward(run: RunState, defId: string): void {
  if (!run.reward) return;
  const reward = run.reward;
  if (reward.cards.includes(defId)) {
    run.deck.push(makeCard(run, defId));
  }
  run.gold += reward.gold;
  if (reward.relic && !run.relics.includes(reward.relic)) run.relics.push(reward.relic);
  if (reward.boss) {
    run.screen = 'victory';
    return;
  }
  finishNode(run);
}

export function skipReward(run: RunState): void {
  if (!run.reward) return;
  const reward = run.reward;
  run.gold += reward.gold;
  if (reward.relic && !run.relics.includes(reward.relic)) run.relics.push(reward.relic);
  if (reward.boss) {
    run.screen = 'victory';
    return;
  }
  finishNode(run);
}

export function restHeal(run: RunState): { ok: boolean; message?: string } {
  if (run.screen !== 'rest') return { ok: false };
  run.hp = Math.min(run.maxHp, run.hp + Math.ceil(run.maxHp * 0.3));
  finishNode(run);
  return { ok: true };
}

export function restUpgrade(run: RunState): { ok: boolean; message?: string } {
  if (run.screen !== 'rest') return { ok: false };
  const candidates = run.deck.filter((card) => !card.upgraded);
  if (candidates.length === 0) return { ok: false, message: '所有牌都已悟道。' };
  const card = pick(run, candidates);
  card.upgraded = true;
  finishNode(run);
  return { ok: true, message: `${CARDS[card.defId].name} 已悟道。` };
}

export function buyShop(run: RunState, index: number): { ok: boolean; message?: string } {
  if (run.screen !== 'shop' || !run.shop) return { ok: false };
  const offer = run.shop.offers[index];
  if (!offer || offer.sold) return { ok: false, message: '这件物品已经售出。' };
  if (run.gold < offer.price) return { ok: false, message: '灵石不足。' };
  run.gold -= offer.price;
  offer.sold = true;
  run.deck.push(makeCard(run, offer.defId));
  return { ok: true, message: `购入 ${CARDS[offer.defId].name}。` };
}

export function removeCardFromDeck(run: RunState, uid: string): { ok: boolean; message?: string } {
  if (run.screen !== 'shop' || !run.shop) return { ok: false, message: '只能在坊市忘尘。' };
  if (run.shop.removalUsed) return { ok: false, message: '今日的忘尘茶已经用过了。' };
  const price = run.shop.removalPrice ?? 50;
  if (run.gold < price) return { ok: false, message: '灵石不足。' };
  if (run.deck.length <= 1) return { ok: false, message: '至少保留一张牌。' };
  const index = run.deck.findIndex((card) => card.uid === uid);
  if (index < 0) return { ok: false, message: '牌组中没有这张牌。' };
  const [removed] = run.deck.splice(index, 1);
  run.gold -= price;
  run.shop.removalUsed = true;
  return { ok: true, message: `${CARDS[removed.defId].name} 已从牌组中抹去。` };
}

export function leaveShop(run: RunState): void {
  if (run.screen !== 'shop') return;
  finishNode(run);
}

export function eventChoice(run: RunState, choiceId: string): { ok: boolean; message?: string } {
  if (run.screen !== 'event' || !run.event) return { ok: false };
  const event = run.event;
  let message = '';
  const fail = (text: string) => ({ ok: false as const, message: text });

  if (event.id === 'wanderer') {
    if (choiceId === 'heal') {
      run.hp = Math.min(run.maxHp, run.hp + 15);
      message = '回复 15 点气血。';
    } else if (choiceId === 'trade') {
      if (run.gold < 40) return fail('灵石不足。');
      run.gold -= 40;
      const card = grantRandomCard(run, 'rare');
      message = card ? `获得 ${card}。` : '剑谱上的字迹已经模糊。';
    } else if (choiceId === 'gold') {
      run.gold += 20;
      message = '获得 20 灵石。';
    } else return fail('无法选择。');
  } else if (event.id === 'cave') {
    if (choiceId === 'explore') {
      hurtForEvent(run, 8);
      if (run.hp > 0) {
        const card = grantRandomCard(run, 'rare');
        message = `失去 8 点气血，获得 ${card ?? '一段残诀'}。`;
      } else {
        message = '古洞中的禁制吞没了你。';
      }
    } else if (choiceId === 'gold') {
      run.gold += 30;
      message = '获得 30 灵石。';
    } else if (choiceId === 'leave') {
      run.hp = Math.min(run.maxHp, run.hp + 10);
      message = '回复 10 点气血。';
    } else return fail('无法选择。');
  } else if (event.id === 'plague') {
    if (choiceId === 'treat') {
      if (run.gold < 30) return fail('灵石不足。');
      run.gold -= 30;
      run.hp = Math.min(run.maxHp, run.hp + 20);
      message = '支付 30 灵石，回复 20 点气血。';
    } else if (choiceId === 'seclude') {
      hurtForEvent(run, 5);
      if (run.hp > 0) message = `失去 5 点气血，${upgradeRandomCard(run) ?? '无事发生'} 完成蜕变。`;
      else message = '时疫还是找上了你。';
    } else if (choiceId === 'ignore') {
      run.gold += 15;
      message = '获得 15 灵石。';
    } else return fail('无法选择。');
  } else if (event.id === 'swordtomb') {
    if (choiceId === 'learn') {
      const card = grantRandomCard(run, 'rare');
      message = card ? `获得 ${card}。` : '剑诀散入风中。';
    } else if (choiceId === 'meditate') {
      run.hp = Math.min(run.maxHp, run.hp + 12);
      message = '回复 12 点气血。';
    } else if (choiceId === 'leave') {
      run.gold += 20;
      message = '获得 20 灵石。';
    } else return fail('无法选择。');
  } else if (event.id === 'temptation') {
    if (choiceId === 'accept') {
      run.maxHp = Math.max(10, run.maxHp - 10);
      run.hp = Math.min(run.hp, run.maxHp);
      const relic = gainRandomRelic(run);
      message = relic ? `获得 ${relic}，失去 10 点最大气血。` : '获得 30 灵石，失去 10 点最大气血。';
    } else if (choiceId === 'refuse') {
      run.gold += 25;
      message = '获得 25 灵石。';
    } else if (choiceId === 'fight') {
      hurtForEvent(run, 12);
      if (run.hp > 0) {
        const card = grantRandomCard(run, 'rare');
        message = `失去 12 点气血，获得 ${card ?? '一段残诀'}。`;
      } else message = '心魔斩断了你的剑。';
    } else return fail('无法选择。');
  } else if (event.id === 'rain') {
    if (choiceId === 'bathe') {
      run.hp = Math.min(run.maxHp, run.hp + 15);
      message = '回复 15 点气血。';
    } else if (choiceId === 'collect') {
      run.gold += 25;
      message = '获得 25 灵石。';
    } else if (choiceId === 'listen') {
      run.hp = Math.min(run.maxHp, run.hp + 5);
      message = `回复 5 点气血，${upgradeRandomCard(run) ?? '无事发生'} 完成蜕变。`;
    } else return fail('无法选择。');
  } else if (event.id === 'caravan') {
    if (choiceId === 'buy') {
      if (run.gold < 40) return fail('灵石不足。');
      run.gold -= 40;
      run.hp = Math.min(run.maxHp, run.hp + 25);
      message = '支付 40 灵石，回复 25 点气血。';
    } else if (choiceId === 'escort') {
      run.gold += 30;
      message = '获得 30 灵石。';
    } else if (choiceId === 'leave') {
      run.gold += 10;
      message = '获得 10 灵石。';
    } else return fail('无法选择。');
  } else if (event.id === 'beggar') {
    if (choiceId === 'give') {
      if (run.gold < 20) return fail('灵石不足。');
      run.gold -= 20;
      const card = grantRandomCard(run, 'common') ?? grantRandomCard(run, 'uncommon');
      message = card ? `获得 ${card}。` : '散修留下了一声谢。';
    } else if (choiceId === 'refuse') {
      run.gold += 10;
      message = '获得 10 灵石。';
    } else if (choiceId === 'help') {
      run.hp = Math.min(run.maxHp, run.hp + 8);
      message = '回复 8 点气血。';
    } else return fail('无法选择。');
  } else if (event.id === 'tax') {
    if (choiceId === 'pay') {
      if (run.gold < 30) return fail('灵石不足。');
      run.gold -= 30;
      message = '支付 30 灵石。';
    } else if (choiceId === 'resist') {
      hurtForEvent(run, 12);
      if (run.hp > 0) {
        run.gold += 50;
        message = '失去 12 点气血，获得 50 灵石。';
      } else message = '仙盟的剑比你的更快。';
    } else if (choiceId === 'hide') {
      hurtForEvent(run, 5);
      if (run.hp > 0) {
        run.gold += 10;
        message = '失去 5 点气血，获得 10 灵石。';
      } else message = '你没能躲过仙盟的追索。';
    } else return fail('无法选择。');
  } else if (event.id === 'omen') {
    if (choiceId === 'pray') {
      run.gold += 30;
      message = '获得 30 灵石。';
    } else if (choiceId === 'absorb') {
      run.hp = Math.min(run.maxHp, run.hp + 10);
      message = `回复 10 点气血，${upgradeRandomCard(run) ?? '无事发生'} 完成蜕变。`;
    } else if (choiceId === 'leave') {
      run.gold += 10;
      message = '获得 10 灵石。';
    } else return fail('无法选择。');
  } else if (event.id === 'challenge') {
    if (choiceId === 'fight') {
      hurtForEvent(run, 10);
      if (run.hp > 0) {
        const card = grantRandomCard(run, 'rare');
        message = `失去 10 点气血，获得 ${card ?? '一段残诀'}。`;
      } else message = '你倒在邻宗弟子剑下。';
    } else if (choiceId === 'pay') {
      if (run.gold < 25) return fail('灵石不足。');
      run.gold -= 25;
      message = '支付 25 灵石。';
    } else if (choiceId === 'ignore') {
      run.gold += 15;
      message = '获得 15 灵石。';
    } else return fail('无法选择。');
  } else {
    return fail('未知事件。');
  }

  finishEvent(run);
  return { ok: true, message };
}

export function canUpgrade(run: RunState): boolean {
  return run.deck.some((card) => !card.upgraded);
}
