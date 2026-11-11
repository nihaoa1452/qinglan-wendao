import type { GameState, Tone } from './types';
import { CARDS, SHOP_ACTION_POOL } from './cards';
import { pick } from './rng';

export interface EventResult {
  text: string;
  tone: Tone;
}

export interface GameEvent {
  id: string;
  name: string;
  minDay: number;
  weight: number;
  apply(state: GameState): EventResult;
}

export function hasFacility(state: GameState, defId: string): boolean {
  return state.facilities.some((facility) => facility.defId === defId);
}

function loseReputation(state: GameState, amount: number): number {
  const lost = Math.min(state.reputation, amount);
  state.reputation -= lost;
  return lost;
}

export const EVENTS: GameEvent[] = [
  {
    id: 'yaoshou',
    name: '妖兽袭山',
    minDay: 3,
    weight: 3,
    apply(state) {
      const guarded = hasFacility(state, 'hushandazhen');
      let damage = 6 + state.day;
      if (guarded) damage = Math.ceil(damage / 2);
      state.stones -= damage;
      return {
        text: `妖兽冲撞山门，损失 ${damage} 灵石。${
          guarded ? '护山大阵自行运转，挡下大半冲击。' : '弟子连夜修补山门，人心惶惶。'
        }`,
        tone: 'bad',
      };
    },
  },
  {
    id: 'lingyu',
    name: '灵雨普降',
    minDay: 2,
    weight: 2,
    apply(state) {
      state.stones += 10;
      return { text: '一场灵雨润泽群峰，采得灵材换回 10 灵石。', tone: 'good' };
    },
  },
  {
    id: 'sanxiu',
    name: '散修来投',
    minDay: 2,
    weight: 2,
    apply(state) {
      state.disciples += 1;
      return { text: '一名散修仰慕青岚之名，愿入门下。弟子 +1。', tone: 'good' };
    },
  },
  {
    id: 'shuijuan',
    name: '仙盟征税',
    minDay: 5,
    weight: 2,
    apply(state) {
      const tax = state.disciples * 2 + 2;
      state.stones -= tax;
      return { text: `仙盟遣使下山，按门中弟子人数征走 ${tax} 灵石。`, tone: 'bad' };
    },
  },
  {
    id: 'tiaoxin',
    name: '邻宗挑衅',
    minDay: 3,
    weight: 2,
    apply(state) {
      if (hasFacility(state, 'yanwuchang')) {
        state.reputation += 5;
        return { text: '邻宗上门讨教，演武场弟子连胜三场，声望 +5。', tone: 'good' };
      }
      const lost = loseReputation(state, 4);
      return { text: `邻宗讥讽青岚无人，声望 -${lost}。`, tone: 'bad' };
    },
  },
  {
    id: 'mijing',
    name: '秘境开启',
    minDay: 3,
    weight: 2,
    apply(state) {
      const actionPool = SHOP_ACTION_POOL;
      const defId = pick(state, actionPool);
      state.discard.push({ uid: state.nextUid++, defId });
      return {
        text: `后山秘境开启，弟子从中带回《${CARDS[defId].name}》残卷。`,
        tone: 'good',
      };
    },
  },
  {
    id: 'xiangrui',
    name: '天降祥瑞',
    minDay: 3,
    weight: 1,
    apply(state) {
      state.reputation += 4;
      return { text: '紫气东来，山门上空霞光三日不散。声望 +4。', tone: 'good' };
    },
  },
  {
    id: 'wenyi',
    name: '时疫',
    minDay: 4,
    weight: 1,
    apply(state) {
      if (hasFacility(state, 'yaoyuan')) {
        return { text: '山间起了时疫，药园弟子连夜熬药，门中无一人染病。', tone: 'info' };
      }
      if (state.disciples <= 0) {
        return { text: '时疫蔓延，所幸门中已无弟子可染。', tone: 'bad' };
      }
      state.disciples -= 1;
      return { text: '时疫蔓延，一名弟子不治离山。弟子 -1。', tone: 'bad' };
    },
  },
  {
    id: 'moxiu',
    name: '魔修夜袭',
    minDay: 10,
    weight: 2,
    apply(state) {
      const guarded = hasFacility(state, 'hushandazhen');
      let damage = 10 + state.day * 2;
      if (guarded) damage = Math.ceil(damage / 2);
      state.stones -= damage;
      return {
        text: `魔修趁夜来袭，山门损毁，损失 ${damage} 灵石。${
          guarded ? '护山大阵光华大盛，逼退来敌。' : '弟子死战，才将来人赶下山去。'
        }`,
        tone: 'bad',
      };
    },
  },
  {
    id: 'wudao',
    name: '弟子顿悟',
    minDay: 5,
    weight: 1,
    apply(state) {
      state.reputation += 3;
      return { text: '一名弟子于溪畔顿悟，引来道韵共鸣。声望 +3。', tone: 'good' };
    },
  },
  {
    id: 'shangdui',
    name: '商队借宿',
    minDay: 2,
    weight: 2,
    apply(state) {
      state.stones += 7;
      return { text: '西边商队借宿山门，留下 7 灵石香火钱。', tone: 'good' };
    },
  },
];

export const EVENT_WEIGHT_TOTAL = EVENTS.reduce((sum, event) => sum + event.weight, 0);
