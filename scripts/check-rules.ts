import { CARDS, ENEMIES, EVENTS, META_UPGRADES, POTIONS, STARTER_DECK } from '../src/sts/data';
import {
  buyShop,
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
  restUpgrade,
  usePotion,
} from '../src/sts/engine';

let passed = 0;
function ok(condition: unknown, message: string): void {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
  passed++;
  console.log('  ok -', message);
}

console.log('run creation');
let run = createRun(12345);
ok(run.deck.length === 10, 'starter deck has 10 cards');
ok(run.deck.filter((card) => card.defId === 'qingfeng').length === 5, 'starter deck has 5 青锋斩');
ok(run.map.length === 8, 'map has 8 rows');
ok(run.availableIds.length === 3, 'three starting paths are available');
ok(run.hp === 80 && run.maxHp === 80, 'player starts at 80 HP');
ok(run.potions.length === 1 && run.potions[0] === 'healing', 'player starts with a healing potion');

console.log('random map');
const mapSignature = (seed: number) => createRun(seed).map.flat().map((node) => `${node.row}:${node.col}:${node.type}`).join('|');
const mapA = mapSignature(101);
const mapB = mapSignature(202);
ok(mapA !== mapB, 'map node mix varies between runs');
ok(mapSignature(101) === mapA, 'map layout is deterministic for the same seed');
ok(createRun(303).map.flat().some((node) => node.type === 'shop'), 'every generated map has a shop');

console.log('combat start and card play');
const battle = run.map[0][0];
ok(chooseNode(run, battle.id).ok, 'choosing a battle node starts a combat');
ok(run.screen === 'combat' && run.combat !== null, 'combat screen is active');
ok(run.combat!.hand.length === 5, 'combat starts with a five-card hand');
ok(run.combat!.energy === 3, 'combat starts with three energy');
const enemyHpBefore = run.combat!.enemy.hp;
run.combat!.hand = [{ uid: 'test-attack', defId: 'qingfeng', upgraded: false }];
const play = playCard(run, 'test-attack');
ok(play.ok, '青锋斩 can be played');
ok(run.combat!.enemy.hp === enemyHpBefore - 7, '青锋斩 deals 7 damage');
ok(run.combat!.energy === 2, 'playing a one-cost card spends one energy');

console.log('end turn');
const hpBefore = run.hp;
endTurn(run);
ok(run.combat!.turn === 2, 'ending the turn advances to turn two');
ok(run.combat!.energy === 3, 'energy refills each turn');
ok(run.combat!.hand.length === 5, 'a new hand is drawn each turn');
ok(run.hp <= hpBefore, 'enemy attacks reduce player HP or are blocked');

console.log('reward flow');
let rewardRun = createRun(222);
rewardRun.availableIds = ['r1c0'];
chooseNode(rewardRun, 'r1c0');
rewardRun.combat!.enemy.hp = 1;
rewardRun.combat!.hand = [{ uid: 'kill', defId: 'qingfeng', upgraded: false }];
playCard(rewardRun, 'kill');
ok(rewardRun.screen === 'reward', 'killing the enemy opens the reward screen');
ok(rewardRun.reward !== null, 'reward is generated');
ok(rewardRun.reward!.cards.length === 3, 'reward offers three cards');
const deckBefore = rewardRun.deck.length;
const goldBefore = rewardRun.gold;
chooseReward(rewardRun, rewardRun.reward!.cards[0]);
ok(rewardRun.deck.length === deckBefore + 1, 'chosen reward card is added to the deck');
ok(rewardRun.gold > goldBefore, 'reward gold is added');
ok(rewardRun.screen === 'map', 'reward returns to the map');

console.log('event and rest nodes');
let eventRun = createRun(333);
const eventNode = eventRun.map.flat().find((node) => node.type === 'event');
ok(Boolean(eventNode), 'random map contains an event node');
eventRun.availableIds = [eventNode!.id];
ok(chooseNode(eventRun, eventNode!.id).ok, 'event node can be entered');
ok(eventRun.screen === 'event' && eventRun.event !== null, 'event screen is active');
const eventHp = eventRun.hp;
const eventChoiceId = eventRun.event!.choices[0].id;
ok(eventChoice(eventRun, eventChoiceId).ok, 'event choice resolves');
ok(eventRun.screen === 'map' || eventRun.screen === 'defeat', 'event leaves the event screen');
ok(eventRun.hp <= eventHp, 'event cannot heal beyond max HP');
ok(eventRun.screen === 'map', 'event returns to the map');

const wanderer = EVENTS.find((event) => event.id === 'wanderer')!;
let healEventRun = createRun(334);
const healEventNode = healEventRun.map.flat().find((node) => node.type === 'event')!;
healEventRun.availableIds = [healEventNode.id];
chooseNode(healEventRun, healEventNode.id);
healEventRun.event = {
  nodeId: healEventRun.event!.nodeId,
  id: wanderer.id,
  title: wanderer.title,
  text: wanderer.text,
  art: wanderer.art,
  choices: wanderer.choices.map((choice) => ({ ...choice, disabled: false })),
};
healEventRun.hp = 40;
ok(eventChoice(healEventRun, 'heal').ok, 'wanderer heal choice resolves');
ok(healEventRun.hp === 55, 'wanderer heals 15 HP');

let restRun = createRun(444);
const restNode = restRun.map.flat().find((node) => node.type === 'rest')!;
restRun.availableIds = [restNode.id];
chooseNode(restRun, restNode.id);
ok(restRun.screen === 'rest', 'rest node opens the rest screen');
const upgradedBefore = restRun.deck.filter((card) => card.upgraded).length;
ok(restUpgrade(restRun).ok, 'rest upgrade resolves');
ok(restRun.deck.filter((card) => card.upgraded).length === upgradedBefore + 1, 'rest upgrades one card');
ok(restRun.screen === 'map', 'rest returns to the map');

console.log('shop');
let shopRun = createRun(555);
const shopNode = shopRun.map.flat().find((node) => node.type === 'shop')!;
shopRun.availableIds = [shopNode.id];
chooseNode(shopRun, shopNode.id);
ok(shopRun.screen === 'shop' && shopRun.shop !== null, 'shop node opens the shop');
const shopDeckBefore = shopRun.deck.length;
shopRun.gold = 200;
const shopGoldBefore = shopRun.gold;
ok(buyShop(shopRun, 0).ok, 'shop purchase succeeds');
ok(shopRun.deck.length === shopDeckBefore + 1, 'shop card is added to the deck');
ok(shopRun.gold === shopGoldBefore - shopRun.shop!.offers[0].price, 'shop purchase costs gold');
const removeUid = shopRun.deck[0].uid;
const removeDeckBefore = shopRun.deck.length;
const removeGoldBefore = shopRun.gold;
ok(removeCardFromDeck(shopRun, removeUid).ok, '忘尘茶 removes a card');
ok(shopRun.deck.length === removeDeckBefore - 1, 'removed card leaves the deck');
ok(shopRun.gold === removeGoldBefore - 50, '忘尘茶 costs 50 gold');
ok(!removeCardFromDeck(shopRun, shopRun.deck[0].uid).ok, 'only one 忘尘茶 per shop');
leaveShop(shopRun);
ok(shopRun.screen === 'map', 'shop returns to the map');

console.log('new mechanics');
let comboRun = createRun(661);
comboRun.availableIds = ['r1c0'];
chooseNode(comboRun, 'r1c0');
comboRun.combat!.enemy.hp = 120;
comboRun.combat!.enemy.maxHp = 120;
comboRun.combat!.energy = 3;
comboRun.combat!.hand = [
  { uid: 'combo-1', defId: 'gongfeng', upgraded: false },
  { uid: 'combo-2', defId: 'zhuifeng', upgraded: false },
];
const comboHp = comboRun.combat!.enemy.hp;
playCard(comboRun, 'combo-1');
playCard(comboRun, 'combo-2');
ok(comboRun.combat!.enemy.hp === comboHp - 10, 'combo adds damage to 追风剑');
ok(comboRun.combat!.combo === 2, 'attack cards build combo');

let poisonRun = createRun(662);
poisonRun.availableIds = ['r1c0'];
chooseNode(poisonRun, 'r1c0');
poisonRun.combat!.enemy.hp = 120;
poisonRun.combat!.enemy.maxHp = 120;
poisonRun.combat!.energy = 3;
poisonRun.combat!.hand = [{ uid: 'poison-1', defId: 'duwu', upgraded: false }];
playCard(poisonRun, 'poison-1');
ok(poisonRun.combat!.enemy.poison === 3, '毒雾 applies 3 poison');
const poisonHp = poisonRun.combat!.enemy.hp;
endTurn(poisonRun);
ok(poisonRun.combat!.enemy.hp === poisonHp - 3, 'poison ticks at the start of the enemy turn');
ok(poisonRun.combat!.enemy.poison === 2, 'poison loses one stack after ticking');

let dexRun = createRun(663);
dexRun.availableIds = ['r1c0'];
chooseNode(dexRun, 'r1c0');
dexRun.combat!.energy = 3;
dexRun.combat!.block = 0;
dexRun.combat!.hand = [
  { uid: 'dex-1', defId: 'shenfa', upgraded: false },
  { uid: 'dex-2', defId: 'ningshen', upgraded: false },
];
playCard(dexRun, 'dex-1');
playCard(dexRun, 'dex-2');
ok(dexRun.combat!.dexterity === 2, '身法 grants dexterity');
ok(dexRun.combat!.block === 7, 'dexterity adds to block cards');

let retainRun = createRun(664);
retainRun.availableIds = ['r1c0'];
chooseNode(retainRun, 'r1c0');
retainRun.combat!.hand = [{ uid: 'retain-1', defId: 'ningshen', upgraded: false }];
endTurn(retainRun);
ok(retainRun.combat!.hand.some((card) => card.defId === 'ningshen'), 'retain cards stay in hand');

let potionRun = createRun(665);
potionRun.availableIds = ['r1c0'];
chooseNode(potionRun, 'r1c0');
potionRun.hp = 50;
potionRun.potions = ['healing'];
ok(usePotion(potionRun, 0).ok, '回春丹 can be used');
ok(potionRun.hp === 65, '回春丹 heals 15 HP');
ok(potionRun.potions.length === 0, 'used potion leaves the belt');

console.log('enemy intent and block');
let intentRun = createRun(666);
intentRun.availableIds = ['r1c0'];
chooseNode(intentRun, 'r1c0');
intentRun.combat!.enemy.defId = 'shanyao';
intentRun.combat!.enemy.moveIndex = 0;
intentRun.combat!.enemy.strength = 5;
intentRun.hp = 80;
intentRun.combat!.block = 0;
intentRun.combat!.hand = [];
const intentMove = currentEnemyMove(intentRun)!;
ok(intentMove.damage === 8, 'intent move has base damage 8');
ok(enemyAttackDamage(intentRun, intentMove) === 13, 'displayed intent includes enemy strength');
intentRun.combat!.vulnerable = 1;
ok(enemyAttackDamage(intentRun, intentMove) === 19, 'displayed intent includes player vulnerable');
intentRun.combat!.vulnerable = 0;
intentRun.combat!.weak = 2;
ok(enemyAttackDamage(intentRun, intentMove) === 13, 'player weak does not reduce enemy attack');
intentRun.hp = 80;
intentRun.combat!.block = 0;
intentRun.combat!.hand = [];
endTurn(intentRun);
ok(intentRun.hp === 67, 'enemy attack deals the displayed damage');

let blockRun = createRun(667);
blockRun.availableIds = ['r1c0'];
chooseNode(blockRun, 'r1c0');
blockRun.combat!.enemy.strength = 0;
blockRun.combat!.block = 50;
blockRun.combat!.hand = [];
blockRun.hp = 80;
const blockHp = blockRun.hp;
endTurn(blockRun);
ok(blockRun.hp === blockHp, 'block absorbs the enemy attack first');
ok(blockRun.combat!.block === 0, 'remaining block is cleared at the start of the next turn');
ok(blockRun.combat!.log.some((line) => line.includes('格挡')), 'block clearing is logged');

let weakAttackRun = createRun(668);
weakAttackRun.availableIds = ['r1c0'];
chooseNode(weakAttackRun, 'r1c0');
weakAttackRun.combat!.enemy.hp = 120;
weakAttackRun.combat!.enemy.maxHp = 120;
weakAttackRun.combat!.energy = 3;
weakAttackRun.combat!.weak = 1;
weakAttackRun.combat!.hand = [{ uid: 'weak-attack', defId: 'qingfeng', upgraded: false }];
const weakEnemyHp = weakAttackRun.combat!.enemy.hp;
playCard(weakAttackRun, 'weak-attack');
ok(weakAttackRun.combat!.enemy.hp === weakEnemyHp - 5, 'player weak reduces player attack damage');

console.log('meta progression and cycles');
const metaUpgrades = ['card:zhuifeng', 'card:qingxin', 'relic:swordheart', 'potion:focus', 'vitality'];
const metaRun = createRun(4242, { essence: 0, unlocked: metaUpgrades, cycle: 1 }, 2);
ok(metaRun.cycle === 2, 'run records its cycle');
ok(metaRun.map.length === 10, 'cycle two has ten map rows');
ok(metaRun.deck.length === 12, 'two starting cards are added by meta progression');
ok(metaRun.deck.some((card) => card.defId === 'zhuifeng'), '追风剑谱 adds a starting card');
ok(metaRun.deck.some((card) => card.defId === 'qingxin'), '清心诀 adds a starting card');
ok(metaRun.relics.includes('swordheart'), '剑心通明 adds a starting relic');
ok(metaRun.potions.includes('focus'), '聚灵散 adds a starting potion');
ok(metaRun.maxHp === 90 && metaRun.hp === 90, '气血淬炼 adds ten max HP');
ok(META_UPGRADES.length === 5, 'five permanent meta upgrades are registered');
ok(new Set(META_UPGRADES.map((upgrade) => upgrade.id)).size === 5, 'meta upgrade ids are unique');
ok(metaRun.map.at(-1)?.every((node) => node.type === 'boss'), 'cycle two ends in a boss row');
ok(createRun(4242, undefined, 3).map.length === 12, 'cycle three has twelve map rows');
ok(createRun(4242, undefined, 9).map.length === 12, 'map growth is capped at twelve rows');

const baseScaleRun = createRun(9191);
const cycleScaleRun = createRun(9191, undefined, 2);
chooseNode(baseScaleRun, baseScaleRun.availableIds[0]);
chooseNode(cycleScaleRun, cycleScaleRun.availableIds[0]);
ok(cycleScaleRun.combat!.enemy.maxHp > baseScaleRun.combat!.enemy.maxHp, 'cycle enemies have more max HP');

console.log('boss and defeat');
let bossRun = createRun(777);
bossRun.availableIds = ['r8c0'];
ok(chooseNode(bossRun, 'r8c0').ok, 'boss node can be entered');
ok(['yaowang', 'moyan'].includes(bossRun.combat!.enemy.defId), 'boss encounter uses a boss enemy');
bossRun.combat!.enemy.hp = 1;
bossRun.combat!.hand = [{ uid: 'boss-kill', defId: 'qingfeng', upgraded: false }];
playCard(bossRun, 'boss-kill');
ok(bossRun.screen === 'reward' && bossRun.reward?.boss === true, 'boss victory creates a boss reward');
chooseReward(bossRun, bossRun.reward!.cards[0]);
ok(bossRun.screen === 'victory' && bossRun.floor === 8, 'boss reward leads to victory on floor 8');

let loseRun = createRun(888);
loseRun.availableIds = ['r1c0'];
chooseNode(loseRun, 'r1c0');
loseRun.hp = 1;
loseRun.combat!.block = 0;
endTurn(loseRun);
ok(loseRun.screen === 'defeat', 'enemy attack at 1 HP ends the run');

console.log('data integrity');
ok(Object.keys(CARDS).length === 33, '33 card definitions are registered');
ok(Object.keys(ENEMIES).length === 10, '10 enemy definitions are registered');
ok(EVENTS.length === 11, '11 events are registered');
ok(Object.keys(POTIONS).length === 3, '3 potion definitions are registered');
ok(STARTER_DECK.length === 10, 'starter deck constant matches in-game deck');

console.log(`\nALL ${passed} STS RULE CHECKS PASSED`);
