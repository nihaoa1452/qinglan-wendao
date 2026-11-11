import {
  CARDS,
  ENEMIES,
  META_UPGRADES,
  NODE_GLYPH,
  NODE_LABEL,
  POTIONS,
  RELICS,
} from './data';
import {
  buyShop,
  canUpgrade,
  cardCost,
  cardDesc,
  cardName,
  chooseNode,
  chooseReward,
  createRun,
  currentEnemyMove,
  endTurn,
  enemyAttackDamage,
  eventChoice,
  leaveShop,
  playCard,
  removeCardFromDeck,
  usePotion,
  restHeal,
  restUpgrade,
  skipReward,
} from './engine';
import { clearRun, loadMeta, loadRun, saveMeta, saveRun } from './save';
import { initAudio, isSfxMuted, playSfx, toggleSfxMuted } from './audio';
import type { CardDef, CardInstance, RunState } from './types';
import {
  CARD_ART_IDS, cardArtUrl, endingArtUrl, eventArtUrl, enemyArtUrl, itemArtUrl, ITEM_ART_IDS, metaArtUrl,
  MAP_BG_URL, PLAYER_ART_URL, REST_ART_URL, SECT_BG_URL, SHOP_ART_URL, TITLE_BG_URL, TITLE_URL,
} from '../game/assets';

type Overlay = 'help' | 'bag' | 'codex' | 'battle-log' | 'remove' | 'pause' | 'meta' | null;

let current: RunState | null = null;
let mode: 'title' | 'run' = 'title';
let overlay: Overlay = null;

const root = document.querySelector<HTMLDivElement>('#app')!;
if (!root) throw new Error('Missing #app');

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char));
}

function showToast(message: string, tone: 'info' | 'good' | 'bad' = 'info'): void {
  const el = document.createElement('div');
  el.className = `sts-toast sts-toast--${tone}`;
  el.textContent = message;
  document.body.append(el);
  if (tone === 'bad') playSfx('error');
  window.setTimeout(() => el.classList.add('sts-toast--out'), 1800);
  window.setTimeout(() => el.remove(), 2200);
}

function persist(): void {
  if (current) saveRun(current);
}
function settleFinishedRun(run: RunState): void {
  if (run.metaSettled) return;
  if (run.screen !== 'victory' && run.screen !== 'defeat') return;
  const meta = loadMeta();
  const gained = run.screen === 'victory'
    ? 20 + run.floor * 3 + run.cycle * 5
    : 5 + run.floor * 2 + run.cycle * 3;
  meta.essence += gained;
  if (run.screen === 'victory') meta.cycle = Math.max(meta.cycle, run.cycle + 1);
  saveMeta(meta);
  run.lastEssenceGain = gained;
  run.metaSettled = true;
}


let fxLayer: HTMLElement | null = null;

function ensureFxLayer(): HTMLElement {
  if (!fxLayer || !fxLayer.isConnected) {
    fxLayer = document.createElement('div');
    fxLayer.className = 'sts-fx-layer';
    document.body.append(fxLayer);
  }
  return fxLayer;
}

function shakeCombat(heavy = false): void {
  const app = document.querySelector<HTMLElement>('.sts-app');
  if (!app) return;
  app.classList.remove('sts-shake', 'sts-shake--heavy');
  void app.offsetWidth;
  app.classList.add(heavy ? 'sts-shake--heavy' : 'sts-shake');
  window.setTimeout(() => app.classList.remove('sts-shake', 'sts-shake--heavy'), 360);
}

function flashScreen(color: 'red' | 'gold'): void {
  const layer = ensureFxLayer();
  const flash = document.createElement('div');
  flash.className = `sts-fx-flash sts-fx-flash--${color}`;
  layer.append(flash);
  window.setTimeout(() => flash.remove(), 420);
}

function impactAt(rect: DOMRect | null, text: string, kind: 'damage' | 'block' | 'heal' | 'poison', target: 'enemy' | 'player'): void {
  const layer = ensureFxLayer();
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
  const number = document.createElement('div');
  number.className = `sts-fx-number sts-fx-number--${kind}`;
  number.textContent = text;
  number.style.left = `${x}px`;
  number.style.top = `${y}px`;
  layer.append(number);
  window.setTimeout(() => number.remove(), 950);

  if (kind === 'damage') {
    for (let i = 0; i < 2; i++) {
      const slash = document.createElement('div');
      slash.className = `sts-fx-slash sts-fx-slash--${target}`;
      slash.style.left = `${x}px`;
      slash.style.top = `${y}px`;
      slash.style.transform = `translate(-50%, -50%) rotate(${target === 'enemy' ? -24 + i * 36 : 18 - i * 30}deg)`;
      layer.append(slash);
      window.setTimeout(() => slash.remove(), 420);
    }
    flashScreen(target === 'player' ? 'red' : 'gold');
    shakeCombat(target === 'player');
  }

  if (kind === 'block') {
    const ring = document.createElement('div');
    ring.className = 'sts-fx-ring';
    ring.style.left = `${x}px`;
    ring.style.top = `${y}px`;
    layer.append(ring);
    window.setTimeout(() => ring.remove(), 500);
  }
}

function captureRect(selector: string): DOMRect | null {
  const el = document.querySelector(selector);
  return el ? el.getBoundingClientRect() : null;
}

function playCardWithFeedback(uid: string): void {
  if (!current || !current.combat) return;
  const enemyRect = captureRect('.sts-enemy-card');
  const playerRect = captureRect('.sts-player-card');
  const before = {
    enemyHp: current.combat.enemy.hp,
    hp: current.hp,
    block: current.combat.block,
    enemyBlock: current.combat.enemy.block,
    poison: current.combat.enemy.poison,
  };
  const result = playCard(current, uid);
  if (!result.ok) {
    showToast(result.message ?? '无法打出。', 'bad');
    return;
  }
  playSfx('card');
  persist();
  render();
  if (!current.combat) return;
  const after = {
    enemyHp: current.combat.enemy.hp,
    hp: current.hp,
    block: current.combat.block,
    enemyBlock: current.combat.enemy.block,
    poison: current.combat.enemy.poison,
  };
  if (before.enemyHp > after.enemyHp) {
    playSfx('attack');
    impactAt(enemyRect, `-${before.enemyHp - after.enemyHp}`, 'damage', 'enemy');
  } else if (after.enemyBlock < before.enemyBlock) {
    playSfx('block');
    impactAt(enemyRect, `格挡 ${before.enemyBlock - after.enemyBlock}`, 'block', 'enemy');
  }
  if (after.poison > before.poison) {
    playSfx('poison');
    impactAt(enemyRect, `中毒 +${after.poison - before.poison}`, 'poison', 'enemy');
  }
  if (before.hp > after.hp) {
    playSfx('hurt');
    impactAt(playerRect, `-${before.hp - after.hp}`, 'damage', 'player');
  } else if (after.hp > before.hp) {
    playSfx('heal');
    impactAt(playerRect, `+${after.hp - before.hp}`, 'heal', 'player');
  }
  if (after.block > before.block) {
    playSfx('block');
    impactAt(playerRect, `格挡 +${after.block - before.block}`, 'block', 'player');
  }
  if (current.screen === 'defeat') playSfx('defeat');
  else if (current.screen === 'reward') playSfx('win');
}

function endTurnWithFeedback(): void {
  if (!current || !current.combat) return;
  const enemyRect = captureRect('.sts-enemy-card');
  const playerRect = captureRect('.sts-player-card');
  const before = {
    enemyHp: current.combat.enemy.hp,
    hp: current.hp,
    block: current.combat.block,
  };
  playSfx('turn');
  endTurn(current);
  persist();
  render();
  if (!current.combat) return;
  if (before.enemyHp > current.combat.enemy.hp) {
    playSfx('poison');
    impactAt(enemyRect, `-${before.enemyHp - current.combat.enemy.hp}`, 'poison', 'enemy');
  }
  if (before.hp > current.hp) {
    playSfx('hurt');
    impactAt(playerRect, `-${before.hp - current.hp}`, 'damage', 'player');
  } else if (before.block > 0 && current.combat) {
    impactAt(playerRect, '格挡', 'block', 'player');
  }
  if (current.screen === 'defeat') playSfx('defeat');
  else if (current.screen === 'reward') playSfx('win');
}


function startNewRun(cycle?: number): void {
  const meta = loadMeta();
  current = createRun(Date.now() >>> 0, meta, cycle ?? meta.cycle);
  mode = 'run';
  overlay = null;
  persist();
  render();
  playSfx('start');
}

function resumeRun(): void {
  const saved = loadRun();
  if (!saved) {
    startNewRun();
    return;
  }
  current = saved;
  mode = 'run';
  overlay = null;
  render();
  playSfx('start');
}


function cardArt(def: CardDef): string {
  return CARD_ART_IDS.has(def.art) ? cardArtUrl(def.art) : '';
}

function hpPercent(hp: number, maxHp: number): number {
  return Math.max(0, Math.min(100, (hp / maxHp) * 100));
}

function intentText(run: RunState): string {
  const move = currentEnemyMove(run);
  if (!move) return '';
  const parts: string[] = [];
  const damage = enemyAttackDamage(run, move);
  if (damage) parts.push(`攻击 ${damage}${move.hits && move.hits > 1 ? `×${move.hits}` : ''}`);
  if (move.block) parts.push(`格挡 ${move.block}`);
  if (move.strength) parts.push(`力量 +${move.strength}`);
  if (move.vulnerable) parts.push(`破甲 ${move.vulnerable}`);
  if (move.weak) parts.push(`虚弱 ${move.weak}`);
  if (!parts.length) return move.name;
  return `${move.name} · ${parts.join(' · ')}`;
}

function intentTooltip(run: RunState): string {
  const move = currentEnemyMove(run);
  if (!move) return '';
  if (!move.damage) return `下一步：${move.name}`;
  const combat = run.combat;
  if (!combat) return '';
  const cycleBase = Math.ceil(move.damage * (1 + (Math.max(1, run.cycle) - 1) * 0.12));
  const parts = [`基础 ${move.damage}`];
  if (cycleBase > move.damage) parts.push(`周目 +${cycleBase - move.damage}`);
  parts.push(`力量 +${combat.enemy.strength}`);
  if (combat.enemy.weak > 0) parts.push('敌方虚弱 ×0.75');
  if (combat.vulnerable > 0) parts.push('你处于破甲 ×1.5');
  if (move.hits && move.hits > 1) parts.push(`共 ${move.hits} 段`);
  return `${move.name}：${parts.join('；')}`;
}

function relicList(run: RunState): string {
  return run.relics
    .map((id) => {
      const relic = RELICS[id];
      return `<span class="sts-relic" title="${esc(relic.desc)}"><img src="${itemArtUrl(relic.art)}" alt="" loading="lazy" />${esc(relic.name)}</span>`;
    })
    .join('');
}

function hud(run: RunState): string {
  return `<header class="sts-hud">
    <div class="sts-brand">
      <span class="sts-brand__seal">青</span>
      <div><b>青岚问道录</b><small>第 ${Math.min(run.floor + 1, run.map.length)} / ${run.map.length} 层 · 周目 ${run.cycle}</small></div>
    </div>
    <div class="sts-hud__bars">
      <div class="sts-hp"><span>气血</span><div class="sts-bar"><i style="width:${hpPercent(run.hp, run.maxHp)}%"></i></div><b>${run.hp} / ${run.maxHp}</b></div>
      <div class="sts-gold">灵石 <b>${run.gold}</b></div>
      <div class="sts-relics">${relicList(run)}</div>
    </div>
    <div class="sts-hud__actions">
      <button class="sts-ghost" data-action="bag">背包 ${run.deck.length}</button>
      <button class="sts-ghost" data-action="codex">图鉴</button>
      <button class="sts-ghost" data-action="help">玩法</button>
      <button class="sts-ghost" data-action="toggle-sound">音效 ${isSfxMuted() ? '关' : '开'}</button>
      <button class="sts-ghost" data-action="pause">退出</button>
    </div>
  </header>`;
}

function titleScreen(): string {
  const hasSave = loadRun() !== null;
  const meta = loadMeta();
  return `<main class="sts-title">
    <div class="sts-title__card">
      <button class="sts-title__sound" data-action="toggle-sound" aria-label="切换音效">音效 ${isSfxMuted() ? '关' : '开'}</button>
      <div class="sts-title__seal">青岚</div>
      <p class="sts-eyebrow">修仙 · 卡牌 · 爬塔</p>
      <h1><img src="${TITLE_URL}" alt="青岚问道录" /></h1>
      <p class="sts-title__story">山门倾颓，妖雾四起。你带着一卷残剑谱与十张旧牌，踏上青云山道。前方是机缘，也是妖王的巢穴。</p>
      <p class="sts-title__meta">道蕴 <b>${meta.essence}</b> · 当前周目 <b>${meta.cycle}</b></p>
      <div class="sts-title__buttons">
        ${hasSave ? '<button class="sts-btn sts-btn--gold" data-action="continue-run">继续问道</button>' : '<button class="sts-btn sts-btn--gold" data-action="start-run">开始问道</button>'}
        ${hasSave ? '<button class="sts-btn" data-action="start-run">新开一局</button>' : ''}
        <button class="sts-btn" data-action="meta">传承</button>
        <button class="sts-btn" data-action="codex">图鉴</button>
        <button class="sts-btn" data-action="help">玩法说明</button>
      </div>
      <p class="sts-title__foot">单局约 15–25 分钟 · 死亡后从头再来 · 通关后进入下一周目</p>
    </div>
  </main>`;
}

function mapScreen(run: RunState): string {
  const available = new Set(run.availableIds);
  const completed = new Set(run.completedIds);
  const allNodes = run.map.flat();
  const totalRows = run.map.length;
  const pos = (node: (typeof allNodes)[number]) => {
    const row = run.map[node.row - 1];
    const y = 7 + ((totalRows - node.row) / (totalRows - 1)) * 86;
    const x = row.length === 1 ? 50 : 16.7 + node.col * 33.3;
    return { x, y };
  };
  const edgePath = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const midY = (a.y + b.y) / 2;
    return `M ${a.x} ${a.y} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
  };
  const edges = allNodes.flatMap((node) => node.nextIds.map((nextId) => {
    const next = allNodes.find((candidate) => candidate.id === nextId);
    if (!next) return '';
    const live = available.has(node.id) || completed.has(node.id);
    return `<path class="sts-map-edge${live ? ' is-live' : ''}" d="${edgePath(pos(node), pos(next))}" />`;
  })).join('');
  return `<main class="sts-screen sts-map-screen">
    <div class="sts-screen__head">
      <div><p class="sts-eyebrow">周目 ${run.cycle} · 青云山道</p><h2>选择前路</h2></div>
      <p class="sts-muted">山势每局不同。斩妖、问道、闭关，选一条自己的路。</p>
    </div>
    <div class="sts-map-frame">
      <div class="sts-map-frame__art" style="background-image:url('${MAP_BG_URL}')"></div>
      <div class="sts-map-legend">
        <span><i class="sts-legend-dot sts-legend-dot--battle"></i>战斗</span>
        <span><i class="sts-legend-dot sts-legend-dot--elite"></i>精英</span>
        <span><i class="sts-legend-dot sts-legend-dot--event"></i>异闻</span>
        <span><i class="sts-legend-dot sts-legend-dot--rest"></i>闭关</span>
        <span><i class="sts-legend-dot sts-legend-dot--shop"></i>坊市</span>
        <span><i class="sts-legend-dot sts-legend-dot--boss"></i>妖王</span>
      </div>
      <div class="sts-map" style="--map-rows:${totalRows}">
        <svg class="sts-map__edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${edges}</svg>
        ${allNodes.map((node, index) => {
          const isAvailable = available.has(node.id);
          const isCompleted = completed.has(node.id);
          const { x, y } = pos(node);
          return `<button class="sts-node sts-node--${node.type}${isAvailable ? ' is-available' : ''}${isCompleted ? ' is-completed' : ''}" style="left:${x}%;top:${y}%;--node-index:${index}" data-action="choose-node" data-node="${node.id}" ${isAvailable ? '' : 'disabled'} aria-label="${NODE_LABEL[node.type]} ${node.id}">
            <span class="sts-node__ring"><span class="sts-node__glyph">${NODE_GLYPH[node.type]}</span></span>
            <span class="sts-node__label">${NODE_LABEL[node.type]}</span>
          </button>`;
        }).join('')}
      </div>
      <div class="sts-map__foot"><span>山门</span><i></i><span>青云山道</span><i></i><span>妖王</span></div>
    </div>
    <p class="sts-map__hint">沿亮起的节点前进；线表示可走的分支。精英会掉落遗物。</p>
  </main>`;
}

function rarityPips(rarity: CardDef['rarity']): string {
  const count = RARITY_ORDER[rarity] + 1;
  return `<span class="sts-card__rarity sts-card__rarity--${rarity}" aria-hidden="true">${'<i></i>'.repeat(count)}</span>`;
}

function combatCard(card: CardInstance, run: RunState): string {
  const def = CARDS[card.defId];
  const cost = cardCost(card);
  const affordable = cost <= (run.combat?.energy ?? 0);
  return `<button class="sts-card sts-card--${def.type} sts-card--rarity-${def.rarity}${card.upgraded ? ' is-upgraded' : ''}${affordable ? '' : ' is-unplayable'}" data-action="play-card" data-uid="${card.uid}" data-card-id="${def.id}" draggable="true" aria-label="${esc(cardName(card))}，耗费 ${cost} 点灵力">
    <span class="sts-card__cost">${cost}</span>
    <span class="sts-card__kind">${def.type === 'attack' ? '攻' : def.type === 'power' ? '功' : '守'}</span>
    <span class="sts-card__art">${cardArt(def) ? `<img src="${cardArt(def)}" alt="" loading="lazy" />` : ''}${rarityPips(def.rarity)}</span>
    <span class="sts-card__name">${esc(cardName(card))}</span>
    <span class="sts-card__desc">${esc(cardDesc(card))}</span>
  </button>`;
}

function rewardCard(def: CardDef): string {
  return `<button class="sts-card sts-card--${def.type} sts-card--rarity-${def.rarity} sts-card--reward" data-action="choose-reward" data-card="${def.id}">
    <span class="sts-card__cost">${def.cost}</span>
    <span class="sts-card__kind">${def.type === 'attack' ? '攻' : def.type === 'power' ? '功' : '守'}</span>
    <span class="sts-card__art">${cardArt(def) ? `<img src="${cardArt(def)}" alt="" loading="lazy" />` : ''}${rarityPips(def.rarity)}</span>
    <span class="sts-card__name">${esc(def.name)}</span>
    <span class="sts-card__desc">${esc(def.desc)}</span>
  </button>`;
}

function statusChips(values: { block?: number; strength?: number; vulnerable?: number; weak?: number; poison?: number; combo?: number; dexterity?: number }): string {
  const chips: string[] = [];
  if (values.block) chips.push(`<span class="sts-chip sts-chip--block" title="先吸收伤害；敌方行动结束后剩余格挡清空">格挡 ${values.block}</span>`);
  if (values.strength) chips.push(`<span class="sts-chip sts-chip--strength">力量 ${values.strength > 0 ? '+' : ''}${values.strength}</span>`);
  if (values.dexterity) chips.push(`<span class="sts-chip sts-chip--strength">身法 +${values.dexterity}</span>`);
  if (values.vulnerable) chips.push(`<span class="sts-chip sts-chip--bad">破甲 ${values.vulnerable}</span>`);
  if (values.weak) chips.push(`<span class="sts-chip sts-chip--bad">虚弱 ${values.weak}</span>`);
  if (values.poison) chips.push(`<span class="sts-chip sts-chip--poison">中毒 ${values.poison}</span>`);
  if (values.combo) chips.push(`<span class="sts-chip sts-chip--combo">连击 ${values.combo}</span>`);
  return chips.join('');
}

function combatScreen(run: RunState): string {
  const combat = run.combat!;
  const enemy = ENEMIES[combat.enemy.defId];
  const enemyPercent = hpPercent(combat.enemy.hp, combat.enemy.maxHp);
  return `<main class="sts-screen sts-combat-screen">
    <div class="sts-combat-top">
      <section class="sts-enemy-card sts-combatant sts-combatant--enemy" aria-label="敌手 ${esc(enemy.name)}">
        <div class="sts-combatant__art sts-combatant__art--enemy" style="background-image:url('${enemyArtUrl(enemy.art)}')">
          <span class="sts-combatant__tag">敌手</span>
          <span class="sts-intent" title="${esc(intentTooltip(run))}">${esc(intentText(run))}</span>
        </div>
        <div class="sts-combatant__body">
          <h2>${esc(enemy.name)}</h2>
          <div class="sts-hp sts-hp--enemy"><span>气血</span><div class="sts-bar"><i style="width:${enemyPercent}%"></i></div><b>${combat.enemy.hp} / ${combat.enemy.maxHp}</b></div>
          <div class="sts-status-row">${statusChips({ block: combat.enemy.block, strength: combat.enemy.strength, vulnerable: combat.enemy.vulnerable, weak: combat.enemy.weak, poison: combat.enemy.poison })}</div>
        </div>
      </section>
      <section class="sts-player-card sts-combatant sts-combatant--player" aria-label="青岚掌门">
        <div class="sts-combatant__art sts-combatant__art--player" style="background-image:url('${PLAYER_ART_URL}')">
          <span class="sts-combatant__tag">青岚掌门</span>
          <span class="sts-turn">第 ${combat.turn} 回合</span>
        </div>
        <div class="sts-combatant__body">
          <h2>你</h2>
          <div class="sts-hp"><span>气血</span><div class="sts-bar"><i style="width:${hpPercent(run.hp, run.maxHp)}%"></i></div><b>${run.hp} / ${run.maxHp}</b></div>
          <div class="sts-status-row">${statusChips({ block: combat.block, strength: combat.strength, vulnerable: combat.vulnerable, weak: combat.weak, combo: combat.combo, dexterity: combat.dexterity })}</div>
          <div class="sts-potions">
            ${run.potions.length ? run.potions.map((id, index) => {
              const potion = POTIONS[id];
              return `<button class="sts-potion" data-action="use-potion" data-index="${index}" title="${esc(potion?.desc ?? '')}"><b>${potion && ITEM_ART_IDS.has(potion.art) ? `<img src="${itemArtUrl(potion.art)}" alt="" />` : esc(potion?.glyph ?? '丹')}</b><span>${esc(potion?.name ?? id)}</span></button>`;
            }).join('') : '<span class="sts-potions__empty">无丹药</span>'}
          </div>
        </div>
      </section>
    </div>
    <div class="sts-combat-middle">
      <div class="sts-log-panel">
        <div class="sts-log-head"><span>战斗记录</span><button class="sts-ghost" data-action="battle-log">展开日志</button></div>
        <div class="sts-log">${combat.log.slice(0, 6).map((line) => `<span class="${line.startsWith('上回合结算') ? 'is-summary' : ''}">${esc(line)}</span>`).join('') || '<span>山风骤起。</span>'}</div>
      </div>
      <div class="sts-piles"><span>抽牌 ${combat.drawPile.length}</span><span>弃牌 ${combat.discardPile.length}</span><span>消耗 ${combat.exhaustPile.length}</span><span class="sts-drag-hint">拖到对局任意位置出牌</span></div>
    </div>
    <div class="sts-handbar">
      <div class="sts-energy"><span>灵力</span><b>${combat.energy} / ${combat.maxEnergy}</b></div>
      <div class="sts-hand">${combat.hand.length ? combat.hand.map((card) => combatCard(card, run)).join('') : '<p class="sts-empty">手中无牌。结束回合，等待下一轮。</p>'}</div>
      <button class="sts-btn sts-btn--end" data-action="end-turn">结束回合</button>
    </div>
  </main>`;
}

function rewardScreen(run: RunState): string {
  const reward = run.reward!;
  const relic = reward.relic ? RELICS[reward.relic] : null;
  return `<main class="sts-screen sts-reward-screen">
    <div class="sts-panel sts-reward">
      <p class="sts-eyebrow">战利品 · ${reward.gold} 灵石</p>
      <h2>选一张牌带走</h2>
      <p class="sts-muted">${relic ? `精英遗物：${esc(relic.name)}。` : '也可以放弃卡牌，直接继续。'}${reward.potion ? ` 获得丹药：${esc(POTIONS[reward.potion]?.name ?? reward.potion)}。` : ''}</p>
      <div class="sts-reward__cards">${reward.cards.map((id) => rewardCard(CARDS[id])).join('')}</div>
      <button class="sts-btn" data-action="skip-reward">跳过奖励</button>
    </div>
  </main>`;
}

function restScreen(run: RunState): string {
  return `<main class="sts-screen sts-rest-screen">
    <div class="sts-panel sts-rest">
      <div class="sts-rest__art" style="background-image:url('${REST_ART_URL}')"></div>
      <p class="sts-eyebrow">云台闭关</p>
      <h2>调息，或悟道</h2>
      <p class="sts-muted">在云海之上静坐。你可以恢复气血，或让一张牌完成蜕变。</p>
      <div class="sts-choices">
        <button class="sts-choice" data-action="rest-heal"><b>疗伤</b><span>回复 ${Math.ceil(run.maxHp * 0.3)} 点气血</span></button>
        <button class="sts-choice" data-action="rest-upgrade" ${canUpgrade(run) ? '' : 'disabled'}><b>悟道</b><span>随机升级一张牌</span></button>
      </div>
      <p class="sts-muted">当前气血 ${run.hp} / ${run.maxHp}</p>
    </div>
  </main>`;
}

function shopScreen(run: RunState): string {
  const shop = run.shop!;
  return `<main class="sts-screen sts-shop-screen">
    <div class="sts-panel sts-shop">
      <div class="sts-shop__art" style="background-image:url('${SHOP_ART_URL}')"></div>
      <p class="sts-eyebrow">山下坊市</p>
      <h2>用灵石换一线生机</h2>
      <p class="sts-muted">当前灵石 ${run.gold}。买完可以随时离开。</p>
      <div class="sts-shop__offers">
        ${shop.offers.map((offer, index) => {
          const def = CARDS[offer.defId];
          return `<div class="sts-shop-offer${offer.sold ? ' is-sold' : ''}">
            ${rewardCard(def).replace('data-action="choose-reward" data-card="' + def.id + '"', `data-action="shop-buy" data-index="${index}"`)}
            <span class="sts-price">${offer.sold ? '已售出' : `${offer.price} 灵石`}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="sts-shop__remove">
        <div>
          <p class="sts-eyebrow">忘尘茶</p>
          <p class="sts-muted">删去一张牌，让牌组更纯粹。${shop.removalUsed ? '今日已经用过。' : `价格 ${shop.removalPrice ?? 50} 灵石。`}</p>
        </div>
        <button class="sts-btn" data-action="shop-remove" ${shop.removalUsed || run.gold < (shop.removalPrice ?? 50) ? 'disabled' : ''}>忘尘</button>
      </div>
      <button class="sts-btn sts-btn--gold" data-action="leave-shop">离开坊市</button>
    </div>
  </main>`;
}

function eventScreen(run: RunState): string {
  const event = run.event!;
  return `<main class="sts-screen sts-event-screen">
    <div class="sts-panel sts-event">
      <div class="sts-event__art" style="background-image:url('${eventArtUrl(event.art)}')"></div>
      <p class="sts-eyebrow">山门异闻</p>
      <h2>${esc(event.title)}</h2>
      <p class="sts-event__text">${esc(event.text)}</p>
      <div class="sts-choices">
        ${event.choices.map((choice) => `<button class="sts-choice" data-action="event-choice" data-choice="${choice.id}" ${choice.disabled ? 'disabled' : ''}><b>${esc(choice.label)}</b><span>${esc(choice.desc)}</span></button>`).join('')}
      </div>
    </div>
  </main>`;
}

function endingScreen(run: RunState): string {
  const won = run.screen === 'victory';
  return `<main class="sts-screen sts-ending-screen">
    <div class="sts-panel sts-ending ${won ? 'is-win' : 'is-lose'}">
      <div class="sts-ending__seal" aria-hidden="true">${won ? '胜' : '败'}</div>
      <div class="sts-ending__art" style="background-image:url('${endingArtUrl(won)}')"></div>
      <p class="sts-eyebrow">${won ? '山门重开' : '道途止步'}</p>
      <h2>${won ? '青岚之名，重响九州' : '你倒在了山道上'}</h2>
      <p class="sts-muted">${won ? '你击败了盘踞青云山的妖王。残破的山门重新亮起灯火。' : '妖雾吞没了你的身影。下一次，换一条路，或者换一套牌。'}</p>
      <div class="sts-ending__stats">
        <span>到达 <b>${Math.min(run.floor, run.map.length)}</b> / ${run.map.length} 层</span>
        <span>周目 <b>${run.cycle}</b></span>
        <span>本次道蕴 <b>+${run.lastEssenceGain ?? 0}</b></span>
        <span>剩余气血 <b>${run.hp}</b></span>
        <span>牌组 <b>${run.deck.length}</b> 张</span>
      </div>
      <div class="sts-choices">
        ${won ? '<button class="sts-btn sts-btn--gold" data-action="next-cycle">进入下一周目</button>' : '<button class="sts-btn sts-btn--gold" data-action="new-run">再走一次</button>'}
        <button class="sts-btn" data-action="meta">传承</button>
        <button class="sts-btn" data-action="title">回到标题</button>
      </div>
    </div>
  </main>`;
}

const TYPE_LABEL: Record<CardDef['type'], string> = {
  attack: '攻击',
  skill: '技能',
  power: '功法',
};

const RARITY_LABEL: Record<CardDef['rarity'], string> = {
  starter: '初始',
  common: '普通',
  uncommon: '精良',
  rare: '稀有',
};

const TYPE_ORDER: Record<CardDef['type'], number> = { attack: 0, skill: 1, power: 2 };
const RARITY_ORDER: Record<CardDef['rarity'], number> = { starter: 0, common: 1, uncommon: 2, rare: 3 };

function ownedCounts(run: RunState | null): Map<string, number> {
  const counts = new Map<string, number>();
  if (!run) return counts;
  for (const card of run.deck) counts.set(card.defId, (counts.get(card.defId) ?? 0) + 1);
  return counts;
}

function bagOverlay(run: RunState): string {
  const grouped = new Map<string, { defId: string; upgraded: boolean; count: number }>();
  for (const card of run.deck) {
    const key = `${card.defId}:${card.upgraded ? 1 : 0}`;
    const row = grouped.get(key);
    if (row) row.count++;
    else grouped.set(key, { defId: card.defId, upgraded: card.upgraded, count: 1 });
  }
  const cards = [...grouped.values()].sort((a, b) => {
    const da = CARDS[a.defId];
    const db = CARDS[b.defId];
    return TYPE_ORDER[da.type] - TYPE_ORDER[db.type] || RARITY_ORDER[da.rarity] - RARITY_ORDER[db.rarity] || da.name.localeCompare(db.name, 'zh');
  });
  const relics = run.relics.map((id) => RELICS[id]).filter(Boolean);
  const potions = run.potions.map((id) => POTIONS[id]).filter(Boolean);
  return `<div class="sts-overlay sts-overlay--full" role="dialog" aria-modal="true" aria-label="背包">
    <div class="sts-overlay__card sts-bag-overlay">
      <div class="sts-overlay__head"><div><p class="sts-eyebrow">随身收纳 · 当前构筑</p><h2>背包</h2></div><button class="sts-ghost" data-action="close-overlay">关闭</button></div>
      <div class="sts-bag-stats">
        <span>牌组 <b>${run.deck.length}</b></span>
        <span>遗物 <b>${relics.length}</b></span>
        <span>丹药 <b>${potions.length}</b></span>
        <span>灵石 <b>${run.gold}</b></span>
      </div>
      <section class="sts-bag-section">
        <p class="sts-eyebrow">当前牌组 · 效果</p>
        <div class="sts-bag-grid">
          ${cards.map((row) => {
            const def = CARDS[row.defId];
            const desc = row.upgraded ? (def.upgradedDesc ?? def.desc) : def.desc;
            return `<article class="sts-bag-card">
              <div class="sts-bag-card__art"><img src="${cardArtUrl(def.art)}" alt="" loading="lazy" /></div>
              <div class="sts-bag-card__body">
                <div class="sts-bag-card__head"><b>${esc(def.name)}${row.upgraded ? '+' : ''}</b><span>×${row.count}</span></div>
                <small>${def.cost} 灵力 · ${TYPE_LABEL[def.type]} · ${RARITY_LABEL[def.rarity]}</small>
                <p>${esc(desc)}</p>
              </div>
            </article>`;
          }).join('')}
        </div>
      </section>
      <section class="sts-bag-section">
        <p class="sts-eyebrow">遗物</p>
        ${relics.length ? `<div class="sts-bag-list">${relics.map((relic) => `<div class="sts-bag-list__item"><img src="${itemArtUrl(relic.art)}" alt="" loading="lazy" /><div><b>${esc(relic.name)}</b><span>${esc(relic.desc)}</span></div></div>`).join('')}</div>` : '<p class="sts-muted">还没有遗物。</p>'}
      </section>
      <section class="sts-bag-section">
        <p class="sts-eyebrow">丹药</p>
        ${potions.length ? `<div class="sts-bag-list">${potions.map((potion) => `<div class="sts-bag-list__item"><img src="${itemArtUrl(potion.art)}" alt="" loading="lazy" /><div><b>${esc(potion.name)}</b><span>${esc(potion.desc)}</span></div></div>`).join('')}</div>` : '<p class="sts-muted">丹囊是空的。</p>'}
      </section>
    </div>
  </div>`;
}

function codexOverlay(run: RunState | null): string {
  const owned = ownedCounts(run);
  const cards = Object.values(CARDS).sort((a, b) => {
    return TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] || a.cost - b.cost || a.name.localeCompare(b.name, 'zh');
  });
  return `<div class="sts-overlay sts-overlay--full" role="dialog" aria-modal="true" aria-label="卡牌图鉴">
    <div class="sts-overlay__card sts-codex-overlay">
      <div class="sts-overlay__head"><div><p class="sts-eyebrow">青岚问道录 · 卡牌</p><h2>图鉴 <small>${cards.length} 张</small></h2></div><button class="sts-ghost" data-action="close-overlay">关闭</button></div>
      <p class="sts-muted">全部卡牌的基础效果与升级效果；“已有”表示当前牌组中的数量。</p>
      <div class="sts-codex-grid">
        ${cards.map((def) => {
          const count = owned.get(def.id) ?? 0;
          return `<article class="sts-codex-card">
            <div class="sts-codex-card__art"><img src="${cardArtUrl(def.art)}" alt="" loading="lazy" />${rarityPips(def.rarity)}</div>
            <div class="sts-codex-card__head">
              <b>${esc(def.name)}</b>
              <span>${def.cost} 灵力 · ${TYPE_LABEL[def.type]} · ${RARITY_LABEL[def.rarity]}</span>
            </div>
            <p>${esc(def.desc)}</p>
            ${def.upgradedDesc && def.upgradedDesc !== def.desc ? `<p class="sts-codex-up">升级：${esc(def.upgradedDesc)}</p>` : ''}
            <span class="sts-codex-owned${count ? ' is-owned' : ''}">${count ? `已有 ×${count}` : '未获得'}</span>
          </article>`;
        }).join('')}
      </div>
    </div>
  </div>`;
}

function metaOverlay(): string {
  const meta = loadMeta();
  return `<div class="sts-overlay sts-overlay--full" role="dialog" aria-modal="true" aria-label="传承">
    <div class="sts-overlay__card sts-meta-overlay">
      <div class="sts-overlay__head"><div><p class="sts-eyebrow">局外传承 · 道蕴 ${meta.essence}</p><h2>藏经阁</h2></div><button class="sts-ghost" data-action="close-overlay">关闭</button></div>
      <div class="sts-meta-hero" style="background-image:url('${TITLE_BG_URL}')">
        <div><p class="sts-eyebrow">一世修行，泽被后世</p><h3>用道蕴参悟传承，下一局开局更强。</h3><p>每局结束获得道蕴；已参悟的传承永久生效。每周目敌人更强，但道蕴与传承会保留。</p></div>
        <div class="sts-meta-essence"><span>当前道蕴</span><b>${meta.essence}</b></div>
      </div>
      <div class="sts-meta-grid">
        ${META_UPGRADES.map((up) => {
          const owned = meta.unlocked.includes(up.id);
          const affordable = meta.essence >= up.cost;
          return `<article class="sts-meta-card${owned ? ' is-owned' : ''}">
            <div class="sts-meta-card__art"><img src="${metaArtUrl(up.art)}" alt="" loading="lazy" /></div>
            <div class="sts-meta-card__body">
              <b>${esc(up.name)}</b>
              <p>${esc(up.desc)}</p>
              <div class="sts-meta-card__foot">
                <span>${owned ? '已参悟' : `${up.cost} 道蕴`}</span>
                <button class="sts-btn sts-btn--gold" data-action="buy-meta" data-upgrade="${up.id}" ${owned || !affordable ? 'disabled' : ''}>${owned ? '已拥有' : '参悟'}</button>
              </div>
            </div>
          </article>`;
        }).join('')}
      </div>
      <p class="sts-muted sts-meta-note">道蕴在每局胜利或失败结算时获得；通关后周目 +1，山道也会更长。</p>
    </div>
  </div>`;
}

function overlayHtml(run: RunState | null): string {
  if (overlay === 'meta') return metaOverlay();
  if (overlay === 'help') {
    return `<div class="sts-overlay sts-overlay--full" role="dialog" aria-modal="true" aria-label="玩法说明">
      <div class="sts-overlay__card sts-help-overlay">
        <div class="sts-overlay__head"><div><p class="sts-eyebrow">青岚问道录 · 玩法说明</p><h2>在青云山道上活下去</h2></div><button class="sts-ghost" data-action="close-overlay">关闭</button></div>
        <div class="sts-help-hero" style="background-image:url('${MAP_BG_URL}')">
          <div>
            <p class="sts-eyebrow">剑谱残卷 · 山门重开</p>
            <h3>一局牌，一条山路，一场问道。</h3>
            <p>每回合 3 点灵力、抽 5 张牌。选路、构筑、战斗，击败山道尽头的妖王。敌人会在你结束回合后按意图行动。</p>
          </div>
        </div>
        <div class="sts-help-tiles">
          <article class="sts-help-tile">
            <div class="sts-help-tile__art" style="background-image:url('${eventArtUrl('mijing')}')"></div>
            <div><h3>先选路</h3><p>树图每局随机。战斗、精英、异闻、闭关、坊市和妖王，路线由你决定。</p></div>
          </article>
          <article class="sts-help-tile">
            <div class="sts-help-tile__art" style="background-image:url('${eventArtUrl('yaoshou')}')"></div>
            <div><h3>再出牌</h3><p>攻击、格挡、抽牌、增伤。点击卡牌，或拖到对局任意位置就能打出。</p></div>
          </article>
          <article class="sts-help-tile">
            <div class="sts-help-tile__art" style="background-image:url('${eventArtUrl('sanxiu')}')"></div>
            <div><h3>看意图</h3><p>敌方意图显示实际伤害，已经计入力量、虚弱和破甲；悬停可以看明细。</p></div>
          </article>
          <article class="sts-help-tile">
            <div class="sts-help-tile__art" style="background-image:url('${cardArtUrl('yaoyuan')}')"></div>
            <div><h3>带资源</h3><p>丹药不耗灵力；坊市可买牌或删牌；遗物会改变整局节奏。</p></div>
          </article>
        </div>
        <ul class="sts-help">
          <li><b>格挡</b>：先吸收伤害；敌方行动结束后剩余格挡清空，下一回合重新累积。盾不够就会掉气血。</li>
          <li><b>破甲</b>：受到攻击伤害提高 50%；<b>虚弱</b>：造成的攻击伤害降低 25%。</li>
          <li><b>连击</b>：本回合每打出一张攻击牌，连击 +1；追风剑按连击增伤。回合结束清空。</li>
          <li><b>中毒</b>：敌方回合开始时按层数掉血，无视格挡，然后减少 1 层。</li>
          <li><b>身法</b>：每点身法让格挡牌额外获得 1 点格挡。<b>保留</b>：回合结束不弃这张牌。</li>
          <li><b>丹药</b>：战斗中点丹囊服用，不耗灵力；精英与妖王必掉，普通战斗有概率掉落。</li>
          <li><b>日志</b>：战斗界面实时显示战斗记录；点“展开日志”查看全场记录与上回合结算。</li>
          <li><b>构筑</b>：战后三选一；坊市买牌；“忘尘茶”可删一张牌；死亡后本局结束。</li>
          <li><b>周目与传承</b>：每局结束获得道蕴，标题页可购买永久传承；通关后进入下一周目，山道更长、敌人更强。</li>
        </ul>
      </div>
    </div>`;
  }
  if (overlay === 'battle-log' && run?.combat) {
    const logs = run.combat.log;
    return `<div class="sts-overlay sts-overlay--full" role="dialog" aria-modal="true" aria-label="战斗记录">
      <div class="sts-overlay__card sts-battle-log-overlay">
        <div class="sts-overlay__head"><div><p class="sts-eyebrow">本场战斗</p><h2>战斗记录</h2></div><button class="sts-ghost" data-action="close-overlay">关闭</button></div>
        <div class="sts-log-hero" style="background-image:url('${enemyArtUrl(ENEMIES[run.combat.enemy.defId].art)}')"><span>${esc(ENEMIES[run.combat.enemy.defId].name)} · 第 ${run.combat.turn} 回合</span></div>
        <p class="sts-muted">最新记录在上；“上回合结算”汇总了上一轮的气血损失与剩余格挡。</p>
        <ol class="sts-battle-log">${logs.map((line, index) => `<li${line.startsWith('上回合结算') ? ' class="is-summary"' : ''}><span>${String(logs.length - index).padStart(2, '0')}</span>${esc(line)}</li>`).join('') || '<li><span>--</span>还没有战斗记录。</li>'}</ol>
      </div>
    </div>`;
  }
  if (overlay === 'pause' && run) {
    return `<div class="sts-overlay sts-overlay--full" role="dialog" aria-modal="true" aria-label="对局菜单">
      <div class="sts-overlay__card sts-pause-overlay">
        <div class="sts-overlay__head"><div><p class="sts-eyebrow">行至第 ${Math.min(run.floor + 1, run.map.length)} / ${run.map.length} 层 · 周目 ${run.cycle}</p><h2>要离开山道吗？</h2></div><button class="sts-ghost" data-action="close-overlay">继续对局</button></div>
        <div class="sts-pause-hero" style="background-image:url('${TITLE_BG_URL}')">
          <div><p class="sts-eyebrow">青岚问道录</p><h3>山高路远，进退由心。</h3><p>可以保存当前进度回到标题，也可以结束本局、清空存档。</p></div>
        </div>
        <div class="sts-pause-actions">
          <button class="sts-choice" data-action="close-overlay"><b>继续对局</b><span>回到当前战斗/地图</span></button>
          <button class="sts-choice" data-action="pause-save"><b>保存并返回主界面</b><span>保留本局，之后从标题页继续</span></button>
          <button class="sts-choice" data-action="new-run"><b>重新开始</b><span>放弃当前进度，开一局新的</span></button>
          <button class="sts-choice sts-choice--danger" data-action="pause-abandon"><b>结束本局</b><span>清空当前存档并回到主界面</span></button>
        </div>
      </div>
    </div>`;
  }
  if (overlay === 'remove' && run) {
    return `<div class="sts-overlay sts-overlay--full" role="dialog" aria-modal="true" aria-label="忘尘茶">
      <div class="sts-overlay__card sts-deck-overlay">
        <div class="sts-overlay__head"><div><p class="sts-eyebrow">忘尘茶 · 删除卡牌</p><h2>选择一张牌删去</h2></div><button class="sts-ghost" data-action="close-overlay">取消</button></div>
        <p class="sts-muted">删除后不可恢复。当前灵石 ${run.gold}。</p>
        <div class="sts-remove-grid">
          ${run.deck.map((card) => `<button class="sts-remove-card" data-action="remove-card" data-uid="${card.uid}"><img src="${cardArtUrl(CARDS[card.defId].art)}" alt="" loading="lazy" /><span><b>${esc(cardName(card))}</b><small>${esc(cardDesc(card))}</small></span></button>`).join('')}
        </div>
      </div>
    </div>`;
  }
  if (overlay === 'bag' && run) {
    return bagOverlay(run);
  }
  if (overlay === 'codex') {
    return codexOverlay(run);
  }
  return '';
}

function render(): void {
  if (current && (current.screen === 'victory' || current.screen === 'defeat')) settleFinishedRun(current);
  if (mode === 'title' || !current) {
    root.innerHTML = `<div class="sts-app sts-app--title"><div class="sts-bg" style="background-image:url('${TITLE_BG_URL}')"></div>${titleScreen()}${overlayHtml(current)}</div>`;
    return;
  }
  const run = current;
  let screen = '';
  switch (run.screen) {
    case 'map': screen = mapScreen(run); break;
    case 'combat': screen = combatScreen(run); break;
    case 'reward': screen = rewardScreen(run); break;
    case 'rest': screen = restScreen(run); break;
    case 'shop': screen = shopScreen(run); break;
    case 'event': screen = eventScreen(run); break;
    case 'victory':
    case 'defeat': screen = endingScreen(run); break;
    default: screen = mapScreen(run);
  }
  root.innerHTML = `<div class="sts-app"><div class="sts-bg" style="background-image:url('${SECT_BG_URL}')"></div>${hud(run)}${screen}${overlayHtml(run)}</div>`;
}

function handleAction(action: string, target: HTMLElement): void {
  if (action === 'toggle-sound') {
    const mutedNow = toggleSfxMuted();
    if (!mutedNow) playSfx('ui');
    render();
    return;
  }
  if (action === 'meta') {
    overlay = 'meta';
    render();
    return;
  }
  if (action === 'buy-meta') {
    const id = target.dataset.upgrade;
    if (!id) return;
    const upgrade = META_UPGRADES.find((item) => item.id === id);
    if (!upgrade) return;
    const meta = loadMeta();
    if (meta.unlocked.includes(id)) {
      showToast('这项传承已经参悟。', 'info');
      return;
    }
    if (meta.essence < upgrade.cost) {
      showToast('道蕴不足。', 'bad');
      return;
    }
    meta.essence -= upgrade.cost;
    meta.unlocked.push(id);
    saveMeta(meta);
    render();
    playSfx('reward');
    showToast(`已参悟「${upgrade.name}」。`, 'good');
    return;
  }
  if (action === 'next-cycle') {
    if (!current || current.screen !== 'victory') return;
    startNewRun(current.cycle + 1);
    return;
  }
  if (action === 'start-run') {
    if (current && current.screen !== 'victory' && current.screen !== 'defeat' && mode === 'title' && !window.confirm('当前已有一局进行中，确定新开吗？')) return;
    startNewRun();
    return;
  }
  if (action === 'continue-run') {
    resumeRun();
    return;
  }
  if (action === 'new-run') {
    if (mode === 'run' && current && current.screen !== 'victory' && current.screen !== 'defeat' && !window.confirm('重开会丢失当前进度，确定吗？')) return;
    startNewRun();
    return;
  }
  if (action === 'title') {
    if (current) persist();
    mode = 'title';
    overlay = null;
    render();
    return;
  }
  if (action === 'help') {
    overlay = 'help';
    render();
    return;
  }
  if (action === 'bag') {
    if (!current) return;
    overlay = 'bag';
    render();
    return;
  }
  if (action === 'codex') {
    overlay = 'codex';
    render();
    return;
  }
  if (action === 'battle-log') {
    if (!current?.combat) return;
    overlay = 'battle-log';
    render();
    return;
  }
  if (action === 'pause') {
    if (!current) return;
    overlay = 'pause';
    render();
    return;
  }
  if (action === 'pause-save') {
    if (!current) return;
    persist();
    mode = 'title';
    overlay = null;
    render();
    showToast('对局已保存，可从标题页继续。', 'good');
    return;
  }
  if (action === 'pause-abandon') {
    if (!current) return;
    if (!window.confirm('确定结束本局吗？当前存档会被清空。')) return;
    clearRun();
    current = null;
    mode = 'title';
    overlay = null;
    render();
    showToast('本局已结束。', 'info');
    return;
  }
  if (action === 'close-overlay') {
    overlay = null;
    render();
    return;
  }
  if (!current) return;
  const run = current;

  if (action === 'choose-node') {
    const id = target.dataset.node;
    if (!id) return;
    const result = chooseNode(run, id);
    if (!result.ok) {
      showToast(result.message ?? '无法前进。', 'bad');
      return;
    }
    persist();
    render();
    playSfx('map');
    if (run.screen === 'combat') window.setTimeout(() => playSfx('battle'), 140);
    return;
  }

  if (action === 'play-card') {
    const uid = target.dataset.uid;
    if (!uid) return;
    playCardWithFeedback(uid);
    return;
  }

  if (action === 'use-potion') {
    const index = Number(target.dataset.index);
    const beforeHp = run.hp;
    const result = usePotion(run, index);
    if (!result.ok) {
      showToast(result.message ?? '无法服用。', 'bad');
      return;
    }
    const playerRect = captureRect('.sts-player-card');
    playSfx('potion');
    if (result.message) showToast(result.message, 'good');
    persist();
    render();
    if (run.screen === 'combat' && run.hp > beforeHp) {
      playSfx('heal');
      impactAt(playerRect, `+${run.hp - beforeHp}`, 'heal', 'player');
    }
    return;
  }

  if (action === 'end-turn') {
    endTurnWithFeedback();
    return;
  }

  if (action === 'choose-reward') {
    const id = target.dataset.card;
    if (!id) return;
    chooseReward(run, id);
    persist();
    render();
    playSfx(run.screen === 'victory' ? 'victory' : 'reward');
    return;
  }

  if (action === 'skip-reward') {
    skipReward(run);
    persist();
    render();
    playSfx(run.screen === 'victory' ? 'victory' : 'coin');
    return;
  }

  if (action === 'rest-heal') {
    restHeal(run);
    persist();
    render();
    playSfx('heal');
    return;
  }

  if (action === 'rest-upgrade') {
    const result = restUpgrade(run);
    if (!result.ok) {
      showToast(result.message ?? '无法悟道。', 'bad');
      return;
    }
    if (result.message) showToast(result.message, 'good');
    persist();
    render();
    playSfx('upgrade');
    return;
  }

  if (action === 'shop-buy') {
    const index = Number(target.dataset.index);
    const result = buyShop(run, index);
    showToast(result.message ?? (result.ok ? '购入成功。' : '无法购买。'), result.ok ? 'good' : 'bad');
    if (result.ok) {
      persist();
      render();
      playSfx('coin');
    }
    return;
  }

  if (action === 'shop-remove') {
    if (!run.shop || run.shop.removalUsed) return;
    const price = run.shop.removalPrice ?? 50;
    if (run.gold < price) {
      showToast('灵石不足。', 'bad');
      return;
    }
    overlay = 'remove';
    render();
    return;
  }

  if (action === 'remove-card') {
    const uid = target.dataset.uid;
    if (!uid) return;
    const result = removeCardFromDeck(run, uid);
    showToast(result.message ?? (result.ok ? '忘尘成功。' : '无法忘尘。'), result.ok ? 'good' : 'bad');
    if (result.ok) {
      overlay = null;
      persist();
      render();
      playSfx('upgrade');
    }
    return;
  }

  if (action === 'leave-shop') {
    leaveShop(run);
    persist();
    render();
    playSfx('map');
    return;
  }

  if (action === 'event-choice') {
    const choice = target.dataset.choice;
    if (!choice) return;
    const result = eventChoice(run, choice);
    if (!result.ok) {
      showToast(result.message ?? '无法选择。', 'bad');
      return;
    }
    if (result.message) showToast(result.message, 'good');
    persist();
    render();
    playSfx('ui');
  }
}

const UI_SFX_ACTIONS = new Set([
  'meta', 'title', 'help', 'bag', 'codex', 'battle-log', 'pause',
  'pause-save', 'pause-abandon', 'close-overlay', 'shop-remove',
]);

root.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (!action) return;
  if (UI_SFX_ACTIONS.has(action)) playSfx('ui');
  handleAction(action, target);
});

window.addEventListener('pointerdown', () => initAudio(), { passive: true });

let draggedUid: string | null = null;

function clearDragState(): void {
  draggedUid = null;
  document.body.classList.remove('sts-dragging-card');
  document.querySelectorAll('.sts-card.is-dragging').forEach((el) => el.classList.remove('is-dragging'));
  document.querySelectorAll('.sts-combat-screen.is-drop-target').forEach((el) => el.classList.remove('is-drop-target'));
}

root.addEventListener('dragstart', (event) => {
  const card = (event.target as HTMLElement).closest<HTMLElement>('.sts-card[data-action="play-card"]');
  if (!card) return;
  draggedUid = card.dataset.uid ?? null;
  document.body.classList.add('sts-dragging-card');
  card.classList.add('is-dragging');
  event.dataTransfer?.setData('text/plain', draggedUid ?? '');
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
});

root.addEventListener('dragover', (event) => {
  if (!draggedUid) return;
  const zone = (event.target as HTMLElement).closest<HTMLElement>('.sts-combat-screen');
  if (!zone) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  zone.classList.add('is-drop-target');
});

root.addEventListener('dragleave', (event) => {
  const zone = (event.target as HTMLElement).closest<HTMLElement>('.sts-combat-screen');
  if (!zone) return;
  const related = event.relatedTarget as Node | null;
  if (!related || !zone.contains(related)) zone.classList.remove('is-drop-target');
});

root.addEventListener('drop', (event) => {
  const zone = (event.target as HTMLElement).closest<HTMLElement>('.sts-combat-screen');
  if (!zone || !draggedUid) return;
  event.preventDefault();
  const uid = draggedUid;
  clearDragState();
  playCardWithFeedback(uid);
});

root.addEventListener('dragend', () => {
  clearDragState();
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && overlay) {
    overlay = null;
    render();
  }
});

// Load an existing run into memory so the title can offer “继续问道”.
current = loadRun();

export function mountSts(): void {
  render();
}
