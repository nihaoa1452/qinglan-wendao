import type {
  CardDef,
  EnemyDef,
  MapNode,
  NodeType,
  RelicDef,
} from './types';

export const START_HP = 80;
export const START_GOLD = 80;
export const START_ENERGY = 3;
export const DRAW_PER_TURN = 5;
export const HAND_LIMIT = 10;

const cards: CardDef[] = [
  {
    id: 'qingfeng',
    name: '青锋斩',
    cost: 1,
    type: 'attack',
    rarity: 'starter',
    art: 'qingfeng',
    desc: '造成 7 点伤害。',
    effects: [{ kind: 'damage', amount: 7 }],
    upgradedDesc: '造成 10 点伤害。',
    upgradedEffects: [{ kind: 'damage', amount: 10 }],
  },
  {
    id: 'ningqi',
    name: '凝气盾',
    cost: 1,
    type: 'skill',
    rarity: 'starter',
    art: 'ningqi',
    desc: '获得 6 点格挡。',
    effects: [{ kind: 'block', amount: 6 }],
    upgradedDesc: '获得 9 点格挡。',
    upgradedEffects: [{ kind: 'block', amount: 9 }],
  },
  {
    id: 'zhenyue',
    name: '镇岳剑',
    cost: 2,
    type: 'attack',
    rarity: 'starter',
    art: 'zhenyue',
    desc: '造成 8 点伤害，施加 1 层破甲。',
    effects: [{ kind: 'damage', amount: 8 }, { kind: 'vulnerable', amount: 1 }],
    upgradedDesc: '造成 11 点伤害，施加 2 层破甲。',
    upgradedEffects: [{ kind: 'damage', amount: 11 }, { kind: 'vulnerable', amount: 2 }],
  },
  {
    id: 'lianzhan',
    name: '连斩',
    cost: 1,
    type: 'attack',
    rarity: 'common',
    art: 'lianzhan',
    desc: '造成 4 点伤害两次。',
    effects: [{ kind: 'damage', amount: 4, hits: 2 }],
    upgradedDesc: '造成 5 点伤害两次。',
    upgradedEffects: [{ kind: 'damage', amount: 5, hits: 2 }],
  },
  {
    id: 'gongfeng',
    name: '罡风',
    cost: 1,
    type: 'attack',
    rarity: 'common',
    art: 'gongfeng',
    desc: '造成 4 点伤害，获得 5 点格挡。',
    effects: [{ kind: 'damage', amount: 4 }, { kind: 'block', amount: 5 }],
    upgradedDesc: '造成 6 点伤害，获得 8 点格挡。',
    upgradedEffects: [{ kind: 'damage', amount: 6 }, { kind: 'block', amount: 8 }],
  },
  {
    id: 'huifeng',
    name: '回风诀',
    cost: 1,
    type: 'skill',
    rarity: 'common',
    art: 'huifeng',
    desc: '抽 2 张牌。',
    effects: [{ kind: 'draw', amount: 2 }],
    upgradedDesc: '抽 3 张牌。',
    upgradedEffects: [{ kind: 'draw', amount: 3 }],
  },
  {
    id: 'jianyi',
    name: '剑意',
    cost: 1,
    type: 'power',
    rarity: 'uncommon',
    art: 'jianyi',
    desc: '获得 2 点力量。消耗。',
    effects: [{ kind: 'strength', amount: 2 }],
    upgradedDesc: '获得 3 点力量。消耗。',
    upgradedEffects: [{ kind: 'strength', amount: 3 }],
    exhaust: true,
  },
  {
    id: 'jinzhong',
    name: '金钟罩',
    cost: 2,
    type: 'skill',
    rarity: 'common',
    art: 'jinzhong',
    desc: '获得 14 点格挡。',
    effects: [{ kind: 'block', amount: 14 }],
    upgradedDesc: '获得 18 点格挡。',
    upgradedEffects: [{ kind: 'block', amount: 18 }],
  },
  {
    id: 'yaoquan',
    name: '药泉',
    cost: 1,
    type: 'skill',
    rarity: 'common',
    art: 'yaoquan',
    desc: '回复 5 点生命。消耗。',
    effects: [{ kind: 'heal', amount: 5 }],
    upgradedDesc: '回复 8 点生命。消耗。',
    upgradedEffects: [{ kind: 'heal', amount: 8 }],
    exhaust: true,
  },
  {
    id: 'wulei',
    name: '五雷符',
    cost: 2,
    type: 'attack',
    rarity: 'uncommon',
    art: 'wulei',
    desc: '造成 12 点伤害，施加 2 层破甲。',
    effects: [{ kind: 'damage', amount: 12 }, { kind: 'vulnerable', amount: 2 }],
    upgradedDesc: '造成 16 点伤害，施加 3 层破甲。',
    upgradedEffects: [{ kind: 'damage', amount: 16 }, { kind: 'vulnerable', amount: 3 }],
  },
  {
    id: 'wanjian',
    name: '万剑归宗',
    cost: 3,
    type: 'attack',
    rarity: 'rare',
    art: 'wanjian',
    desc: '造成 22 点伤害。',
    effects: [{ kind: 'damage', amount: 22 }],
    upgradedDesc: '造成 30 点伤害。',
    upgradedEffects: [{ kind: 'damage', amount: 30 }],
  },
  {
    id: 'taixu',
    name: '太虚剑典',
    cost: 2,
    type: 'power',
    rarity: 'rare',
    art: 'taixu',
    desc: '获得 3 点力量。消耗。',
    effects: [{ kind: 'strength', amount: 3 }],
    upgradedDesc: '获得 4 点力量。消耗。',
    upgradedEffects: [{ kind: 'strength', amount: 4 }],
    exhaust: true,
  },
  {
    id: 'yujian',
    name: '御剑术',
    cost: 1,
    type: 'attack',
    rarity: 'common',
    art: 'yujian',
    desc: '造成 6 点伤害，抽 1 张牌。',
    effects: [{ kind: 'damage', amount: 6 }, { kind: 'draw', amount: 1 }],
    upgradedDesc: '造成 9 点伤害，抽 1 张牌。',
    upgradedEffects: [{ kind: 'damage', amount: 9 }, { kind: 'draw', amount: 1 }],
  },
  {
    id: 'lingxi',
    name: '灵息',
    cost: 0,
    type: 'skill',
    rarity: 'uncommon',
    art: 'lingxi',
    desc: '获得 1 点灵力，抽 1 张牌。消耗。',
    effects: [{ kind: 'energy', amount: 1 }, { kind: 'draw', amount: 1 }],
    upgradedDesc: '获得 1 点灵力，抽 2 张牌。消耗。',
    upgradedEffects: [{ kind: 'energy', amount: 1 }, { kind: 'draw', amount: 2 }],
    exhaust: true,
  },
  {
    id: 'danhuo',
    name: '丹火',
    cost: 1,
    type: 'attack',
    rarity: 'common',
    art: 'danhuo',
    desc: '造成 5 点伤害，施加 2 层破甲。',
    effects: [{ kind: 'damage', amount: 5 }, { kind: 'vulnerable', amount: 2 }],
    upgradedDesc: '造成 8 点伤害，施加 3 层破甲。',
    upgradedEffects: [{ kind: 'damage', amount: 8 }, { kind: 'vulnerable', amount: 3 }],
  },
  {
    id: 'jianzhen',
    name: '青岚剑阵',
    cost: 2,
    type: 'skill',
    rarity: 'uncommon',
    art: 'jianzhen',
    desc: '获得 6 点格挡，造成 6 点伤害。',
    effects: [{ kind: 'block', amount: 6 }, { kind: 'damage', amount: 6 }],
    upgradedDesc: '获得 9 点格挡，造成 9 点伤害。',
    upgradedEffects: [{ kind: 'block', amount: 9 }, { kind: 'damage', amount: 9 }],
  },
  {
    id: 'tayun',
    name: '踏云步',
    cost: 1,
    type: 'skill',
    rarity: 'common',
    art: 'tayun',
    desc: '获得 5 点格挡，抽 1 张牌。',
    effects: [{ kind: 'block', amount: 5 }, { kind: 'draw', amount: 1 }],
    upgradedDesc: '获得 8 点格挡，抽 1 张牌。',
    upgradedEffects: [{ kind: 'block', amount: 8 }, { kind: 'draw', amount: 1 }],
  },
  {
    id: 'juling',
    name: '聚灵',
    cost: 0,
    type: 'skill',
    rarity: 'uncommon',
    art: 'juling',
    desc: '获得 1 点灵力。消耗。',
    effects: [{ kind: 'energy', amount: 1 }],
    upgradedDesc: '获得 2 点灵力。消耗。',
    upgradedEffects: [{ kind: 'energy', amount: 2 }],
    exhaust: true,
  },
  {
    id: 'xuezhan',
    name: '血战',
    cost: 1,
    type: 'attack',
    rarity: 'uncommon',
    art: 'xuezhan',
    desc: '造成 14 点伤害，失去 3 点生命。',
    effects: [{ kind: 'damage', amount: 14 }, { kind: 'loseHp', amount: 3 }],
    upgradedDesc: '造成 18 点伤害，失去 3 点生命。',
    upgradedEffects: [{ kind: 'damage', amount: 18 }, { kind: 'loseHp', amount: 3 }],
  },
  {
    id: 'guiyuan',
    name: '归元',
    cost: 2,
    type: 'skill',
    rarity: 'rare',
    art: 'guiyuan',
    desc: '回复 10 点生命。消耗。',
    effects: [{ kind: 'heal', amount: 10 }],
    upgradedDesc: '回复 15 点生命。消耗。',
    upgradedEffects: [{ kind: 'heal', amount: 15 }],
    exhaust: true,
  },
  {
    id: 'hushanzhen',
    name: '护山大阵',
    cost: 2,
    type: 'skill',
    rarity: 'uncommon',
    art: 'hushanzhen',
    desc: '获得 10 点格挡，获得 1 点力量。',
    effects: [{ kind: 'block', amount: 10 }, { kind: 'strength', amount: 1 }],
    upgradedDesc: '获得 14 点格挡，获得 2 点力量。',
    upgradedEffects: [{ kind: 'block', amount: 14 }, { kind: 'strength', amount: 2 }],
  },
  {
    id: 'zhuifeng',
    name: '追风剑',
    cost: 1,
    type: 'attack',
    rarity: 'uncommon',
    art: 'zhuifeng',
    desc: '造成 4 点伤害；本回合每打出一张攻击牌，额外 +2 伤害。',
    effects: [{ kind: 'damage', amount: 4, perCombo: 2 }],
    upgradedDesc: '造成 6 点伤害；本回合每打出一张攻击牌，额外 +3 伤害。',
    upgradedEffects: [{ kind: 'damage', amount: 6, perCombo: 3 }],
  },
  {
    id: 'duwu',
    name: '毒雾',
    cost: 1,
    type: 'skill',
    rarity: 'uncommon',
    art: 'duwu',
    desc: '施加 3 层中毒。',
    effects: [{ kind: 'poison', amount: 3 }],
    upgradedDesc: '施加 5 层中毒。',
    upgradedEffects: [{ kind: 'poison', amount: 5 }],
  },
  {
    id: 'shigu',
    name: '蚀骨',
    cost: 2,
    type: 'attack',
    rarity: 'rare',
    art: 'shigu',
    desc: '造成 8 点伤害，施加 2 层中毒。',
    effects: [{ kind: 'damage', amount: 8 }, { kind: 'poison', amount: 2 }],
    upgradedDesc: '造成 12 点伤害，施加 3 层中毒。',
    upgradedEffects: [{ kind: 'damage', amount: 12 }, { kind: 'poison', amount: 3 }],
  },
  {
    id: 'shenfa',
    name: '身法',
    cost: 1,
    type: 'power',
    rarity: 'uncommon',
    art: 'shenfa',
    desc: '获得 2 点身法。格挡牌额外获得等量格挡。消耗。',
    effects: [{ kind: 'dexterity', amount: 2 }],
    upgradedDesc: '获得 3 点身法。消耗。',
    upgradedEffects: [{ kind: 'dexterity', amount: 3 }],
    exhaust: true,
  },
  {
    id: 'ningshen',
    name: '凝神',
    cost: 1,
    type: 'skill',
    rarity: 'common',
    art: 'ningshen',
    desc: '获得 5 点格挡。保留。',
    effects: [{ kind: 'block', amount: 5 }],
    upgradedDesc: '获得 8 点格挡。保留。',
    upgradedEffects: [{ kind: 'block', amount: 8 }],
    retain: true,
  },
  {
    id: 'jianyu',
    name: '剑雨',
    cost: 2,
    type: 'attack',
    rarity: 'uncommon',
    art: 'jianyu',
    desc: '造成 4 点伤害三次。',
    effects: [{ kind: 'damage', amount: 4, hits: 3 }],
    upgradedDesc: '造成 5 点伤害三次。',
    upgradedEffects: [{ kind: 'damage', amount: 5, hits: 3 }],
  },
  {
    id: 'huichun',
    name: '回春',
    cost: 1,
    type: 'skill',
    rarity: 'common',
    art: 'huichun',
    desc: '回复 6 点气血，抽 1 张牌。消耗。',
    effects: [{ kind: 'heal', amount: 6 }, { kind: 'draw', amount: 1 }],
    upgradedDesc: '回复 9 点气血，抽 1 张牌。消耗。',
    upgradedEffects: [{ kind: 'heal', amount: 9 }, { kind: 'draw', amount: 1 }],
    exhaust: true,
  },
  {
    id: 'taiyi',
    name: '太乙剑',
    cost: 3,
    type: 'attack',
    rarity: 'rare',
    art: 'taiyi',
    desc: '造成 20 点伤害，施加 2 层破甲。',
    effects: [{ kind: 'damage', amount: 20 }, { kind: 'vulnerable', amount: 2 }],
    upgradedDesc: '造成 26 点伤害，施加 3 层破甲。',
    upgradedEffects: [{ kind: 'damage', amount: 26 }, { kind: 'vulnerable', amount: 3 }],
  },
  {
    id: 'qingxin',
    name: '清心诀',
    cost: 1,
    type: 'skill',
    rarity: 'common',
    art: 'qingxin',
    desc: '获得 4 点格挡，抽 1 张牌。保留。',
    effects: [{ kind: 'block', amount: 4 }, { kind: 'draw', amount: 1 }],
    upgradedDesc: '获得 6 点格挡，抽 1 张牌。保留。',
    upgradedEffects: [{ kind: 'block', amount: 6 }, { kind: 'draw', amount: 1 }],
    retain: true,
  },
  {
    id: 'yinxue',
    name: '饮血',
    cost: 1,
    type: 'attack',
    rarity: 'uncommon',
    art: 'yinxue',
    desc: '造成 9 点伤害，回复 3 点气血。',
    effects: [{ kind: 'damage', amount: 9 }, { kind: 'heal', amount: 3 }],
    upgradedDesc: '造成 12 点伤害，回复 4 点气血。',
    upgradedEffects: [{ kind: 'damage', amount: 12 }, { kind: 'heal', amount: 4 }],
  },
  {
    id: 'shouyi',
    name: '守一',
    cost: 2,
    type: 'skill',
    rarity: 'rare',
    art: 'shouyi',
    desc: '获得 16 点格挡，获得 2 点身法。',
    effects: [{ kind: 'block', amount: 16 }, { kind: 'dexterity', amount: 2 }],
    upgradedDesc: '获得 20 点格挡，获得 3 点身法。',
    upgradedEffects: [{ kind: 'block', amount: 20 }, { kind: 'dexterity', amount: 3 }],
  },
  {
    id: 'fentian',
    name: '焚天',
    cost: 3,
    type: 'attack',
    rarity: 'rare',
    art: 'fentian',
    desc: '造成 8 点伤害三次，施加 3 层中毒。',
    effects: [{ kind: 'damage', amount: 8, hits: 3 }, { kind: 'poison', amount: 3 }],
    upgradedDesc: '造成 10 点伤害三次，施加 4 层中毒。',
    upgradedEffects: [{ kind: 'damage', amount: 10, hits: 3 }, { kind: 'poison', amount: 4 }],
  },
];

export const CARDS: Record<string, CardDef> = Object.fromEntries(cards.map((card) => [card.id, card]));

export const STARTER_DECK = [
  'qingfeng', 'qingfeng', 'qingfeng', 'qingfeng', 'qingfeng',
  'ningqi', 'ningqi', 'ningqi', 'ningqi',
  'zhenyue',
];

export const CARD_POOL = cards
  .filter((card) => card.rarity !== 'starter')
  .map((card) => card.id);

export const RELICS: Record<string, RelicDef> = {
  seal: {
    id: 'seal',
    name: '青岚掌门印',
    desc: '每场战斗开始时获得 4 点格挡。',
    art: 'relic-seal',
  },
  gourd: {
    id: 'gourd',
    name: '青玉葫芦',
    desc: '每场战斗结束后回复 5 点生命。',
    art: 'relic-gourd',
  },
  swordheart: {
    id: 'swordheart',
    name: '剑心通明',
    desc: '每场战斗开始时获得 1 点力量。',
    art: 'relic-swordheart',
  },
  jade: {
    id: 'jade',
    name: '聚灵玉佩',
    desc: '每场战斗的第一回合额外获得 1 点灵力。',
    art: 'relic-jade',
  },
};

export interface PotionDef {
  id: string;
  name: string;
  desc: string;
  glyph: string;
  art: string;
}

export const POTIONS: Record<string, PotionDef> = {
  healing: {
    id: 'healing',
    name: '回春丹',
    desc: '回复 15 点气血。',
    glyph: '丹',
    art: 'potion-healing',
  },
  focus: {
    id: 'focus',
    name: '聚灵散',
    desc: '获得 2 点灵力。',
    glyph: '灵',
    art: 'potion-focus',
  },
  rage: {
    id: 'rage',
    name: '破障丹',
    desc: '获得 2 点力量。',
    glyph: '力',
    art: 'potion-rage',
  },
};

export interface MetaUpgrade {
  id: string;
  name: string;
  desc: string;
  cost: number;
  art: string;
}

export const META_UPGRADES: MetaUpgrade[] = [
  {
    id: 'card:zhuifeng',
    name: '追风剑谱',
    desc: '每局初始牌组额外加入一张「追风剑」。',
    cost: 40,
    art: 'meta-zhuifeng',
  },
  {
    id: 'card:qingxin',
    name: '清心诀',
    desc: '每局初始牌组额外加入一张「清心诀」。',
    cost: 35,
    art: 'meta-qingxin',
  },
  {
    id: 'relic:swordheart',
    name: '剑心通明',
    desc: '每局开局携带遗物「剑心通明」：战斗开始 +1 力量。',
    cost: 60,
    art: 'meta-swordheart',
  },
  {
    id: 'potion:focus',
    name: '聚灵散',
    desc: '每局额外携带一枚「聚灵散」：战斗中获得 2 灵力。',
    cost: 25,
    art: 'meta-juling',
  },
  {
    id: 'vitality',
    name: '气血淬炼',
    desc: '每局最大气血 +10。',
    cost: 45,
    art: 'meta-xueqi',
  },
];

export const ENEMIES: Record<string, EnemyDef> = {
  shanyao: {
    id: 'shanyao',
    name: '山魈',
    maxHp: 44,
    art: 'shanyao',
    pattern: [
      { name: '扑击', intent: 'attack', damage: 8 },
      { name: '咆哮', intent: 'buff', strength: 2 },
      { name: '撕裂', intent: 'attack', damage: 6, hits: 2 },
    ],
  },
  sanxiu: {
    id: 'sanxiu',
    name: '散修',
    maxHp: 40,
    art: 'sanxiu',
    pattern: [
      { name: '剑击', intent: 'attack', damage: 7 },
      { name: '凝神', intent: 'defend', block: 6 },
      { name: '破绽', intent: 'debuff', vulnerable: 2, damage: 5 },
    ],
  },
  yaoshou: {
    id: 'yaoshou',
    name: '妖兽',
    maxHp: 52,
    art: 'yaoshou',
    pattern: [
      { name: '撕咬', intent: 'attack', damage: 10 },
      { name: '狂暴', intent: 'buff', strength: 2 },
      { name: '扑杀', intent: 'attack', damage: 14 },
    ],
  },
  moxiu: {
    id: 'moxiu',
    name: '魔修',
    maxHp: 64,
    art: 'moxiu',
    pattern: [
      { name: '魔剑', intent: 'attack', damage: 10 },
      { name: '摄魂', intent: 'debuff', weak: 2 },
      { name: '血影', intent: 'attack', damage: 6, hits: 2 },
      { name: '魔障', intent: 'defend', block: 10, strength: 2 },
    ],
  },
  yaowang: {
    id: 'yaowang',
    name: '妖王',
    maxHp: 100,
    art: 'yaowang',
    pattern: [
      { name: '妖爪', intent: 'attack', damage: 11 },
      { name: '妖威', intent: 'buff', strength: 3 },
      { name: '裂空', intent: 'attack', damage: 5, hits: 2, vulnerable: 2 },
      { name: '山崩', intent: 'attack', damage: 16 },
      { name: '妖雾', intent: 'defend', block: 10, weak: 1 },
    ],
  },
  huyao: {
    id: 'huyao',
    name: '狐妖',
    maxHp: 40,
    art: 'huyao',
    pattern: [
      { name: '魅影', intent: 'debuff', damage: 5, weak: 1 },
      { name: '幻火', intent: 'attack', damage: 8 },
      { name: '狐步', intent: 'defend', block: 8 },
      { name: '摄魂', intent: 'debuff', weak: 2 },
    ],
  },
  shikui: {
    id: 'shikui',
    name: '尸傀',
    maxHp: 54,
    art: 'shikui',
    pattern: [
      { name: '腐爪', intent: 'attack', damage: 9, vulnerable: 1 },
      { name: '尸甲', intent: 'defend', block: 12 },
      { name: '重击', intent: 'attack', damage: 14 },
      { name: '毒瘴', intent: 'debuff', weak: 1, vulnerable: 1 },
    ],
  },
  jianling: {
    id: 'jianling',
    name: '剑灵',
    maxHp: 44,
    art: 'jianling',
    pattern: [
      { name: '剑鸣', intent: 'attack', damage: 4, hits: 2 },
      { name: '剑阵', intent: 'defend', block: 8, strength: 1 },
      { name: '穿心', intent: 'attack', damage: 11, vulnerable: 1 },
      { name: '剑意', intent: 'buff', strength: 2 },
    ],
  },
  xuexiu: {
    id: 'xuexiu',
    name: '血修',
    maxHp: 68,
    art: 'xuexiu',
    pattern: [
      { name: '血刃', intent: 'attack', damage: 10 },
      { name: '噬魂', intent: 'attack', damage: 7, weak: 2 },
      { name: '血盾', intent: 'defend', block: 14, strength: 2 },
      { name: '血爆', intent: 'attack', damage: 16, vulnerable: 1 },
    ],
  },
  moyan: {
    id: 'moyan',
    name: '魔焰妖王',
    maxHp: 104,
    art: 'moyan',
    pattern: [
      { name: '魔焰', intent: 'attack', damage: 12, vulnerable: 1 },
      { name: '焚心', intent: 'attack', damage: 6, hits: 2 },
      { name: '魔威', intent: 'buff', strength: 3 },
      { name: '烬灭', intent: 'attack', damage: 20 },
      { name: '黑火', intent: 'defend', block: 12, weak: 1 },
    ],
  },
};

export const NODE_LABEL: Record<NodeType, string> = {
  battle: '战斗',
  elite: '精英',
  event: '异闻',
  rest: '闭关',
  shop: '坊市',
  boss: '妖王',
};

export const NODE_GLYPH: Record<NodeType, string> = {
  battle: '剑',
  elite: '煞',
  event: '缘',
  rest: '息',
  shop: '市',
  boss: '王',
};

function mapRow(row: number, types: NodeType[]): MapNode[] {
  return types.map((type, col) => ({
    id: `r${row}c${col}`,
    row,
    col,
    type,
    nextIds: [],
  }));
}

function mapRandom(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffleMap<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildMap(seed = 1, cycle = 1): MapNode[][] {
  const random = mapRandom(seed);
  const baseSpecs: NodeType[][] = [
    ['battle', 'battle', 'battle'],
    ['battle', 'battle', 'event'],
    ['rest', 'battle', 'shop'],
    ['elite', 'battle', 'event'],
    ['battle', 'rest', 'event'],
    ['elite', 'battle', 'shop'],
  ];
  const extraSpecs: NodeType[][] = [
    ['elite', 'battle', 'event'],
    ['battle', 'rest', 'shop'],
    ['elite', 'battle', 'event'],
    ['battle', 'rest', 'shop'],
  ];
  const extraRows = Math.min(4, Math.max(0, cycle - 1) * 2);
  const specs: NodeType[][] = [...baseSpecs, ...extraSpecs.slice(0, extraRows), ['rest'], ['boss']];
  const rows = specs.map((types, index) => mapRow(index + 1, shuffleMap(types, random)));
  for (let r = 0; r < rows.length - 1; r++) {
    for (const node of rows[r]) {
      const candidates = rows[r + 1].filter((next) => Math.abs(next.col - node.col) <= 1);
      const pool = candidates.length ? candidates : rows[r + 1];
      // Keep the route readable, but let the mountain grow different forks
      // between runs instead of always using every possible edge.
      const kept = pool.filter(() => random() < 0.72);
      const chosen = kept.length ? kept : [pool[Math.floor(random() * pool.length)]];
      node.nextIds = chosen.map((next) => next.id);
    }
    // Never strand a node in the next row: give it at least one incoming edge.
    for (const next of rows[r + 1]) {
      if (!rows[r].some((node) => node.nextIds.includes(next.id))) {
        const source = rows[r].reduce((best, node) => (
          Math.abs(node.col - next.col) < Math.abs(best.col - next.col) ? node : best
        ), rows[r][0]);
        source.nextIds.push(next.id);
      }
    }
  }
  return rows;
}

export interface EventChoiceDef {
  id: string;
  label: string;
  desc: string;
}

export interface EventDef {
  id: string;
  title: string;
  text: string;
  art: string;
  choices: EventChoiceDef[];
}

export const EVENTS: EventDef[] = [
  {
    id: 'wanderer',
    title: '云游道人',
    text: '一位云游道人在山门前歇脚。他看了看你身后的破败匾额，说：“宗门虽旧，剑心未死。要换一场机缘吗？”',
    art: 'mijing',
    choices: [
      { id: 'heal', label: '求取灵丹', desc: '回复 15 点气血。' },
      { id: 'trade', label: '以灵石换剑谱', desc: '支付 40 灵石，获得一张稀有牌。' },
      { id: 'gold', label: '替他守夜', desc: '获得 20 灵石。' },
    ],
  },
  {
    id: 'cave',
    title: '古洞遗宝',
    text: '藤蔓之后露出一座无名古洞。洞中灵气与腐朽气交织，深处有微光闪动。',
    art: 'mijing',
    choices: [
      { id: 'explore', label: '深入探查', desc: '失去 8 点气血，获得一张稀有牌。' },
      { id: 'gold', label: '取走洞外灵材', desc: '获得 30 灵石。' },
      { id: 'leave', label: '谨慎离开', desc: '回复 10 点气血。' },
    ],
  },
  {
    id: 'plague',
    title: '山下时疫',
    text: '山下村落起了时疫。村民跪在山门外，求你赐药。药园里还剩最后一批灵草。',
    art: 'wenyi',
    choices: [
      { id: 'treat', label: '开园施药', desc: '支付 30 灵石，回复 20 点气血。' },
      { id: 'seclude', label: '闭门自守', desc: '失去 5 点气血，随机升级一张牌。' },
      { id: 'ignore', label: '封山不管', desc: '获得 15 灵石。' },
    ],
  },
  {
    id: 'swordtomb',
    title: '剑冢残鸣',
    text: '山道旁的剑冢里，无数断剑在风中低鸣。你听见一声极轻的剑诀。',
    art: 'wudao',
    choices: [
      { id: 'learn', label: '听剑悟法', desc: '获得一张随机稀有牌。' },
      { id: 'meditate', label: '静坐养神', desc: '回复 12 点气血。' },
      { id: 'leave', label: '取走剑穗', desc: '获得 20 灵石。' },
    ],
  },
  {
    id: 'temptation',
    title: '魔音入梦',
    text: '夜里，一道魔音贴着你耳边低语：“把剑放下，把心交给我。你会比现在更强。”',
    art: 'moxiu',
    choices: [
      { id: 'accept', label: '接受魔音', desc: '获得一件随机遗物，失去 10 点最大气血。' },
      { id: 'refuse', label: '守心拒绝', desc: '获得 25 灵石。' },
      { id: 'fight', label: '拔剑斩念', desc: '失去 12 点气血，获得一张稀有牌。' },
    ],
  },
  {
    id: 'rain',
    title: '灵雨普降',
    text: '一场青色灵雨落在山道上。雨水沾在剑上，剑身竟轻轻震颤。',
    art: 'lingyu',
    choices: [
      { id: 'bathe', label: '沐浴灵雨', desc: '回复 15 点气血。' },
      { id: 'collect', label: '收集灵水', desc: '获得 25 灵石。' },
      { id: 'listen', label: '听雨悟剑', desc: '获得 5 点气血，并随机升级一张牌。' },
    ],
  },
  {
    id: 'caravan',
    title: '商队借宿',
    text: '一支商队在暮色中借宿山门。领头人捧出一只檀木匣：“道长，看看这个？”',
    art: 'shangdui',
    choices: [
      { id: 'buy', label: '买下一枚丹药', desc: '支付 40 灵石，回复 25 点气血。' },
      { id: 'escort', label: '护送一程', desc: '获得 30 灵石。' },
      { id: 'leave', label: '只借一晚', desc: '获得 10 灵石。' },
    ],
  },
  {
    id: 'beggar',
    title: '散修求助',
    text: '一名衣衫褴褛的散修倒在石阶上，怀里还抱着一卷发霉的剑谱。',
    art: 'sanxiu',
    choices: [
      { id: 'give', label: '赠他灵石', desc: '支付 20 灵石，获得一张随机牌。' },
      { id: 'refuse', label: '让他离开', desc: '获得 10 灵石。' },
      { id: 'help', label: '亲自送他下山', desc: '回复 8 点气血。' },
    ],
  },
  {
    id: 'tax',
    title: '仙盟征税',
    text: '仙盟的使者堵在山门前，手里拿着厚厚的账册。他身后跟着两名持剑修士。',
    art: 'shuijuan',
    choices: [
      { id: 'pay', label: '交纳税金', desc: '支付 30 灵石。' },
      { id: 'resist', label: '拔剑抗税', desc: '失去 12 点气血，获得 50 灵石。' },
      { id: 'hide', label: '闭门不见', desc: '失去 5 点气血，获得 10 灵石。' },
    ],
  },
  {
    id: 'omen',
    title: '紫气东来',
    text: '东方天际浮起一缕紫气。山门后的老松无风自动，像是在向你行礼。',
    art: 'xiangrui',
    choices: [
      { id: 'pray', label: '设坛祈福', desc: '获得 30 灵石。' },
      { id: 'absorb', label: '引气入体', desc: '回复 10 点气血，随机升级一张牌。' },
      { id: 'leave', label: '顺其自然', desc: '获得 10 灵石。' },
    ],
  },
  {
    id: 'challenge',
    title: '邻宗挑衅',
    text: '邻宗弟子在山门外刻下一行字：青岚无人。山风卷起石屑，也卷起你的杀意。',
    art: 'tiaoxin',
    choices: [
      { id: 'fight', label: '应战', desc: '失去 10 点气血，获得一张稀有牌。' },
      { id: 'pay', label: '赔礼息事', desc: '支付 25 灵石。' },
      { id: 'ignore', label: '不与此辈计较', desc: '获得 15 灵石。' },
    ],
  },
];
