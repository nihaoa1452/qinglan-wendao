import { CARDS } from '../game/cards';
import { CARD_ART_IDS, EVENT_ART_IDS, TITLE_URL, cardArtUrl, endingArtUrl, eventArtUrl } from '../game/assets';
import {
  BOARD_SLOTS,
  REFRESH_COST,
  getBuyIssue,
  getDailyIncome,
  getPlayIssue,
  getRefreshIssue,
} from '../game/engine';
import type { CardInstance, GameState, IncomeItem, ShopOffer } from '../game/types';

export interface UiState {
  overlay: 'intro' | 'help' | 'event' | null;
}

function signed(value: number, unit: string): string {
  return `${value > 0 ? '+' : ''}${value} ${unit}`;
}

function incomeEffect(item: IncomeItem): string {
  const parts: string[] = [];
  if (item.stones) parts.push(signed(item.stones, '灵石'));
  if (item.reputation) parts.push(`+${item.reputation} 声望`);
  if (item.disciples) parts.push(`+${item.disciples} 弟子`);
  return parts.join(' · ');
}

function handCardHtml(instance: CardInstance, state: GameState): string {
  const def = CARDS[instance.defId];
  const blocked = getPlayIssue(state, instance.uid) !== null;
  return `<button class="card card--${def.type}${blocked ? ' is-blocked' : ''}" data-action="play" data-uid="${instance.uid}" draggable="true" aria-disabled="${blocked}" aria-label="${def.name}，耗费 ${def.cost} 灵石">
    <span class="card__cost">${def.cost}</span>
    <span class="card__kind">${def.type === 'facility' ? '设施' : '行动'}</span>
    ${CARD_ART_IDS.has(def.id)
      ? `<span class="card__art" aria-hidden="true"><img src="${cardArtUrl(def.id)}" alt="" loading="lazy"></span>`
      : `<span class="card__glyph" aria-hidden="true">${def.glyph}</span>`}
    <span class="card__name">${def.name}</span>
    <span class="card__desc">${def.desc.map((line) => `<span>${line}</span>`).join('')}</span>
    <span class="card__flavor">${def.flavor}</span>
  </button>`;
}

function offerHtml(offer: ShopOffer, index: number, state: GameState): string {
  const def = CARDS[offer.defId];
  const blocked = getBuyIssue(state, index) !== null;
  const thumb = CARD_ART_IDS.has(def.id)
    ? `<div class="offer__art" aria-hidden="true"><img src="${cardArtUrl(def.id)}" alt="" loading="lazy"></div>`
    : `<div class="offer__glyph" aria-hidden="true">${def.glyph}</div>`;
  return `<div class="offer${offer.sold ? ' is-sold' : ''}">
    ${thumb}
    <div class="offer__body">
      <div class="offer__name">${def.name}<span>${def.type === 'facility' ? '设施' : '行动'}</span></div>
      <div class="offer__desc">${def.desc.join('；')}</div>
    </div>
    <div class="offer__buy">
      <span class="offer__price">${offer.price} 灵石</span>
      <button class="btn btn--small${blocked ? ' is-blocked' : ''}" data-action="buy" data-index="${index}" aria-disabled="${blocked}" ${offer.sold ? 'disabled' : ''}>${offer.sold ? '已售' : '购入'}</button>
    </div>
  </div>`;
}

function facilityOutput(defId: string, state: GameState): string {
  const has = (id: string): boolean => state.facilities.some((facility) => facility.defId === id);
  switch (defId) {
    case 'lingtian':
      return '每日 +3 灵石';
    case 'julingzhen':
      return '每日 +4 灵石';
    case 'cangjingge':
      return '每日 +2 声望';
    case 'wudaoya':
      return '每日 +3 声望';
    case 'yanwuchang':
      return `每 2 弟子 +1 声望 · 当前 +${Math.floor(state.disciples / 2)}`;
    case 'danfang':
      return '每日 +2 灵石 · +1 声望';
    case 'shanmen':
      return '每 3 日 +1 弟子';
    case 'hushandazhen':
      return '事件减伤 50% · 每日 +1 灵石';
    case 'yaoyuan':
      return has('danfang') ? '每日 +3 灵石（丹房加成）' : '每日 +1 灵石';
    default:
      return '';
  }
}

function boardHtml(state: GameState): string {
  const buildings = state.facilities
    .map((facility) => {
      const def = CARDS[facility.defId];
      const art = CARD_ART_IDS.has(def.id)
        ? `<span class="building__art" aria-hidden="true"><img src="${cardArtUrl(def.id)}" alt="" loading="lazy"></span>`
        : `<span class="building__glyph" aria-hidden="true">${def.glyph}</span>`;
      return `<div class="building" title="${def.name}：${def.desc.join('；')}">
        ${art}
        <span class="building__name">${def.name}</span>
        <span class="building__out">${facilityOutput(facility.defId, state)}</span>
      </div>`;
    })
    .join('');
  const emptyCount = Math.max(0, BOARD_SLOTS - state.facilities.length);
  const empty = Array.from({ length: emptyCount }, () => `<div class="slot"><span>待建</span></div>`).join('');
  return buildings + empty;
}

export function render(root: HTMLElement, state: GameState, ui: UiState): void {
  const income = getDailyIncome(state);
  const event = state.lastEvent && state.lastEvent.day === state.day ? state.lastEvent : null;
  const progress = Math.min(100, (state.reputation / state.winReputation) * 100);
  const daysLeft = Math.max(0, state.maxDays - state.day);
  const dayClass = daysLeft <= 5 ? ' is-urgent' : '';
  const refreshIssue = getRefreshIssue(state);
  const allSold = state.shop.every((offer) => offer.sold);
  const refreshDisabled = state.shopRefreshed || allSold;
  const projectedStones = state.stones + income.stones;
  const lowReserve = state.phase === 'playing' && projectedStones < 8 + (state.day + 1) * 1.5;
  const earningsParts: string[] = [];
  if (income.stones !== 0) earningsParts.push(signed(income.stones, '灵石'));
  if (income.reputation !== 0) earningsParts.push(`+${income.reputation} 声望`);
  if (income.disciples !== 0) earningsParts.push(`+${income.disciples} 弟子`);

  const eventBanner = event
    ? `<div class="event-banner event-banner--${event.tone}">
        <span class="event-banner__tag">今日异闻</span>
        <strong>${event.name}</strong>
        <span>${event.text}</span>
      </div>`
    : '';

  const shopOffers = state.shop.map((offer, index) => offerHtml(offer, index, state)).join('');

  const incomeRows = income.items.length
    ? income.items
        .map((item) => {
          const effect = incomeEffect(item);
          const negative = (item.stones ?? 0) < 0 || (item.reputation ?? 0) < 0 || (item.disciples ?? 0) < 0;
          return `<li><span>${item.label}</span><b class="${negative ? 'is-negative' : ''}">${effect}</b></li>`;
        })
        .join('')
    : '<li class="income__empty">门中暂无固定产出</li>';

  const logRows = state.log
    .slice(0, 40)
    .map(
      (entry) => `<li class="log__item log__item--${entry.tone}">
        <span class="log__day">第${entry.day}日</span>
        <p>${entry.text}</p>
      </li>`,
    )
    .join('');

  const hand = state.hand.length
    ? state.hand.map((instance) => handCardHtml(instance, state)).join('')
    : '<div class="hand-empty">手中无牌。结束今日，等待新的牌局吧。</div>';

  let overlay = '';
  if (state.phase !== 'playing' && state.ending) {
    const won = state.ending.won;
    overlay = `<div class="overlay" role="dialog" aria-modal="true" aria-label="宗门终局">
      <div class="ending ${won ? 'ending--win' : 'ending--lose'}">
        <div class="ending__art"><img src="${endingArtUrl(won)}" alt="" /></div>
        <p class="eyebrow">${won ? '宗门大兴' : '宗门终局'}</p>
        <h2>${state.ending.title}</h2>
        <p class="ending__text">${state.ending.text}</p>
        <div class="ending__stats">
          <div><span>坚持</span><b>${state.day} 日</b></div>
          <div><span>声望</span><b>${state.reputation}</b></div>
          <div><span>灵石</span><b>${state.stones}</b></div>
          <div><span>弟子</span><b>${state.disciples}</b></div>
          <div><span>设施</span><b>${state.facilities.length}</b></div>
          <div><span>出牌</span><b>${state.stats.cardsPlayed}</b></div>
        </div>
        <button class="btn btn--gold btn--wide" data-action="new-game">再开一局</button>
      </div>
    </div>`;
  } else if (ui.overlay === 'intro') {
    overlay = `<div class="overlay" role="dialog" aria-modal="true" aria-label="青岚宗开场">
      <div class="intro">
        <div class="intro__seal" aria-hidden="true">青岚</div>
        <p class="eyebrow">修仙宗门 · 卡牌经营</p>
        <h2 class="intro__title"><img src="${TITLE_URL}" alt="青岚宗" /></h2>
        <p class="intro__story">青岚宗曾是东域一等仙门。如今山门倾颓，只剩两名弟子、二十枚灵石，和一块褪色的匾额。你临危受命，接下掌门之位。</p>
        <div class="intro__goal"><span>三十日之约</span><b>将宗门声望提升至 ${state.winReputation}</b></div>
        <ul class="intro__rules">
          <li><i>壹</i>每日抽 5 张手牌，花灵石打出。</li>
          <li><i>贰</i>设施永久留场，日终产出灵石与声望。</li>
          <li><i>叁</i>灵石在日终结算后仍为负，宗门解散。</li>
        </ul>
        <button class="btn btn--gold btn--wide" data-action="close-intro">开始执掌</button>
      </div>
    </div>`;
  } else if (ui.overlay === 'help') {
    overlay = `<div class="overlay" role="dialog" aria-modal="true" aria-label="玩法说明">
      <div class="help">
        <button class="overlay__close" data-action="close-help" aria-label="关闭">×</button>
        <p class="eyebrow">掌门手札</p>
        <h2>玩法要略</h2>
        <div class="help__block">
          <h3>目标</h3>
          <p>在第 ${state.maxDays} 日结束前，将宗门声望提升至 ${state.winReputation}。声望不会自然衰减，但事件可能令其受损。</p>
        </div>
        <div class="help__block">
          <h3>每日循环</h3>
          <p>每日清晨抽 5 张手牌，花灵石打出。设施牌打出后永久留在宗门「八景」中；行动牌结算后进入弃牌堆。抽牌堆用尽时，弃牌堆会重新洗回。藏经阁按数量叠加，每座使讲道额外 +2 声望。</p>
        </div>
        <div class="help__block">
          <h3>三种资源</h3>
          <p><b>灵石</b>：打牌与购物的货币。<b>弟子</b>：每名弟子每日供养 2 灵石、俸禄 1 灵石，净入 1 灵石；演武场与部分卡牌会按弟子数提供加成。<b>声望</b>：胜利条件。</p>
        </div>
        <div class="help__block">
          <h3>风险</h3>
          <p>灵石在日间可以为负，但日终结算后仍为负，宗门立即解散；日间可用免费牌自救。护山大阵可将事件损失减半。每日坊市有一张行动牌和一张设施牌，可花 ${REFRESH_COST} 灵石换一批，只重抽未售出的货位。</p>
        </div>
        <button class="btn btn--gold btn--wide" data-action="close-help">继续执掌</button>
      </div>
    </div>`;
  } else if (ui.overlay === 'event' && event) {
    overlay = `<div class="overlay" role="dialog" aria-modal="true" aria-label="山门异闻">
      <div class="event-modal event-modal--${event.tone}">
        ${EVENT_ART_IDS.has(event.id) ? `<div class="event-modal__art"><img src="${eventArtUrl(event.id)}" alt="${event.name}" /></div>` : ''}
        <p class="eyebrow">第 ${state.day} 日 · 山门异闻</p>
        <h2>${event.name}</h2>
        <p class="event-modal__text">${event.text}</p>
        ${state.stones < 0 ? `<p class="event-modal__warning">当前灵石为负（${state.stones}）。日终结算后仍为负，宗门将解散；可先打出手中的免费牌自救。</p>` : ''}
        <button class="btn btn--gold btn--wide" data-action="close-event">知道了</button>
      </div>
    </div>`;
  }

  root.innerHTML = `<div class="app">
    <header class="topbar">
      <div class="brand">
        <div class="brand__seal" aria-hidden="true">青</div>
        <div class="brand__text">
          <h1 class="brand__title"><img src="${TITLE_URL}" alt="青岚宗" /></h1>
          <p>修仙宗门 · 卡牌经营</p>
        </div>
      </div>
      <div class="stats">
        <div class="stat stat--stones${lowReserve ? ' is-low' : ''}" data-stat="stones"${lowReserve ? ' title="灵石余量偏低，随机事件可能令宗门破产"' : ''}><span class="stat__label">灵石</span><b>${state.stones}</b></div>
        <div class="stat stat--disciples" data-stat="disciples"><span class="stat__label">弟子</span><b>${state.disciples}</b></div>
        <div class="stat stat--reputation" data-stat="reputation"><span class="stat__label">声望</span><b>${state.reputation}</b></div>
      </div>
      <div class="target">
        <div class="target__row"><span>宗门声望</span><b>${state.reputation}<i> / ${state.winReputation}</i></b></div>
        <div class="target__bar" role="progressbar" aria-valuemin="0" aria-valuemax="${state.winReputation}" aria-valuenow="${state.reputation}"><span style="width:${progress}%"></span></div>
        <div class="target__day${dayClass}">第 <b>${state.day}</b> 日 · 余 ${daysLeft} 日</div>
      </div>
      <div class="topbar__actions">
        <button class="ghost" data-action="help">玩法</button>
        <button class="ghost" data-action="new-game">重开</button>
      </div>
    </header>

    <main class="layout">
      ${eventBanner}
      <section class="panel board-panel">
        <div class="panel__head">
          <h2>宗门八景</h2>
          <span class="panel__meta">${state.facilities.length} / ${BOARD_SLOTS} 座设施</span>
        </div>
        <div class="board">${boardHtml(state)}</div>
        <p class="board__hint">设施打出后永久留场，在每次「结束今日」时结算产出。</p>
      </section>

      <aside class="side">
        <section class="panel shop-panel">
          <div class="panel__head">
            <h2>山下坊市</h2>
            <button class="btn btn--small${refreshIssue ? ' is-blocked' : ''}" data-action="refresh" aria-disabled="${refreshIssue !== null}" ${refreshDisabled ? 'disabled' : ''}>${allSold ? '今日已售罄' : state.shopRefreshed ? '今日已换' : `换一批 · ${REFRESH_COST} 灵石`}</button>
          </div>
          <div class="shop">${shopOffers || '<p class="shop__empty">今日的货已经卖完了。</p>'}</div>
          <p class="shop__hint">每日一张行动牌、一张设施牌。购入的牌先入弃牌堆，抽牌堆用尽时一并洗回。</p>
        </section>

        <section class="panel income-panel">
          <div class="panel__head">
            <h2>今日结算</h2>
            <span class="panel__meta">日终预估</span>
          </div>
          <ul class="income__list">${incomeRows}</ul>
          <div class="income__total">
            <span>日终入账</span>
            <b>${earningsParts.length ? earningsParts.join(' · ') : '无产出'}</b>
          </div>
          ${lowReserve ? '<p class="income__risk" title="随机事件可能造成灵石损失，护山大阵可减半。灵石在日终结算后仍为负，宗门立即解散。">留些灵石应急：山门变故可能造成损失。</p>' : ''}
        </section>

        <section class="panel log-panel">
          <div class="panel__head"><h2>宗门记事</h2><span class="panel__meta">近事</span></div>
          <ul class="log__list">${logRows}</ul>
        </section>
      </aside>
    </main>

    <footer class="handbar">
      <div class="handbar__meta">
        <h2>今日手牌</h2>
        <p>牌库 ${state.deck.length} · 弃牌 ${state.discard.length}</p>
        <p class="handbar__hint">拖到「宗门八景」也可使用</p>
      </div>
      <div class="hand">${hand}</div>
      <div class="handbar__action">
        <button class="btn btn--end" data-action="end-day" ${state.phase !== 'playing' ? 'disabled' : ''}>
          <span class="btn--end__main">结束今日</span>
          <span class="btn--end__sub">${earningsParts.length ? earningsParts.join(' · ') : '无产出'}</span>
        </button>
      </div>
    </footer>
    ${overlay}
  </div>`;
}
