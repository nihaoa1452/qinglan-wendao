/** Shared URLs for the illustrated assets in public/assets. */

/** Card ids with local art in public/assets/cards/<id>.jpg. */
export const CARD_ART_IDS = new Set<string>([
  'qingfeng', 'ningqi', 'zhenyue', 'lianzhan', 'gongfeng', 'huifeng',
  'jianyi', 'jinzhong', 'yaoquan', 'wulei', 'wanjian', 'taixu',
  'yujian', 'lingxi', 'danhuo', 'jianzhen', 'tayun', 'juling',
  'xuezhan', 'guiyuan', 'hushanzhen', 'zhuifeng', 'duwu', 'shigu',
  'shenfa', 'ningshen', 'jianyu', 'huichun', 'taiyi', 'qingxin',
  'yinxue', 'shouyi', 'fentian',
]);

export function cardArtUrl(id: string): string {
  return `./assets/cards/${id}.jpg`;
}

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

export function enemyArtUrl(id: string): string {
  return `./assets/enemies/${id}.jpg`;
}

export function eventArtUrl(id: string): string {
  return `./assets/events/${id}.jpg`;
}

export function endingArtUrl(won: boolean): string {
  return `./assets/endings/${won ? 'win' : 'lose'}.jpg`;
}

export const APP_BG_URL = './assets/bg/sect.jpg';
export const TITLE_BG_URL = './assets/bg/title.jpg';
export const MAP_BG_URL = './assets/bg/map.jpg';
export const REST_ART_URL = './assets/scenes/rest.jpg';
export const SHOP_ART_URL = './assets/scenes/shop.jpg';
export const PLAYER_ART_URL = './assets/hero/player-combat.jpg';
export const TITLE_URL = './assets/title-qinglan.png';
