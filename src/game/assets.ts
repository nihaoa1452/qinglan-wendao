/** Card ids with local art in public/assets/cards/<id>.(jpg|png). */
const NEW_CARD_ART = [
  'qingfeng', 'ningqi', 'zhenyue', 'lianzhan', 'gongfeng', 'huifeng',
  'jianyi', 'jinzhong', 'yaoquan', 'wulei', 'wanjian', 'taixu',
  'yujian', 'lingxi', 'danhuo', 'jianzhen', 'tayun', 'juling',
  'xuezhan', 'guiyuan', 'hushanzhen', 'zhuifeng', 'duwu', 'shigu',
  'shenfa', 'ningshen', 'jianyu', 'huichun', 'taiyi', 'qingxin',
  'yinxue', 'shouyi', 'fentian',
];

export const CARD_ART_IDS = new Set<string>([
  ...NEW_CARD_ART,
  // Legacy sect-management art kept for fallbacks and old screens.
  'caishi', 'zhaoshou', 'jiangdao', 'lixian', 'shilian', 'bushi', 'mijing',
  'kuangmai', 'shanyaoshi', 'mengui', 'keqing', 'xunshan', 'lundao', 'guangna',
  'tianji', 'kaitan', 'mijingxunbao', 'jingshi', 'zushi', 'wuxing', 'lingtian',
  'julingzhen', 'cangjingge', 'wudaoya', 'yanwuchang', 'danfang', 'shanmen',
  'hushandazhen', 'yaoyuan',
]);

const CARD_ART_JPG = new Set<string>(NEW_CARD_ART);

export function cardArtUrl(id: string): string {
  return `./assets/cards/${id}.${CARD_ART_JPG.has(id) ? 'jpg' : 'png'}`;
}

export const META_ART_IDS = new Set<string>([
  'meta-zhuifeng', 'meta-qingxin', 'meta-swordheart',
  'meta-juling', 'meta-xueqi',
]);

export function metaArtUrl(id: string): string {
  return `./assets/meta/${id}.jpg`;
}

export const ITEM_ART_IDS = new Set<string>([
  'relic-seal', 'relic-gourd', 'relic-swordheart', 'relic-jade',
  'potion-healing', 'potion-focus', 'potion-rage',
]);

export function itemArtUrl(id: string): string {
  return `./assets/items/${id}.png`;
}

export const ENEMY_ART_IDS = new Set<string>([
  'shanyao', 'sanxiu', 'yaoshou', 'moxiu', 'yaowang',
  'huyao', 'shikui', 'jianling', 'xuexiu', 'moyan',
]);

export function enemyArtUrl(id: string): string {
  return `./assets/enemies/${id}.jpg`;
}

export const EVENT_ART_IDS = new Set<string>([
  'yaoshou', 'lingyu', 'sanxiu', 'shuijuan', 'tiaoxin', 'mijing',
  'xiangrui', 'wenyi', 'moxiu', 'wudao', 'shangdui',
]);

export function eventArtUrl(id: string): string {
  return `./assets/events/${id}.jpg`;
}

export function endingArtUrl(won: boolean): string {
  return `./assets/endings/${won ? 'win' : 'lose'}.jpg`;
}

export const SECT_BG_URL = './assets/bg-sect.jpg';
export const TITLE_BG_URL = './assets/bg/title.jpg';
export const MAP_BG_URL = './assets/bg/map.jpg';
export const REST_ART_URL = './assets/scenes/rest.jpg';
export const SHOP_ART_URL = './assets/scenes/shop.jpg';
export const PLAYER_ART_URL = './assets/hero/player-combat.jpg';
export const TITLE_URL = './assets/title-qinglan.png';
