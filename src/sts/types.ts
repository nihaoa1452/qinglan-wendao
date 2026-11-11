export type Screen = 'map' | 'combat' | 'reward' | 'rest' | 'shop' | 'event' | 'victory' | 'defeat';

export type NodeType = 'battle' | 'elite' | 'event' | 'rest' | 'shop' | 'boss';

export type CardType = 'attack' | 'skill' | 'power';

export type Rarity = 'starter' | 'common' | 'uncommon' | 'rare';

export type Effect =
  | { kind: 'damage'; amount: number; hits?: number; perCombo?: number }
  | { kind: 'block'; amount: number }
  | { kind: 'draw'; amount: number }
  | { kind: 'energy'; amount: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'loseHp'; amount: number }
  | { kind: 'strength'; amount: number }
  | { kind: 'vulnerable'; amount: number }
  | { kind: 'weak'; amount: number }
  | { kind: 'poison'; amount: number }
  | { kind: 'dexterity'; amount: number };

export interface CardDef {
  id: string;
  name: string;
  cost: number;
  type: CardType;
  rarity: Rarity;
  art: string;
  desc: string;
  effects: Effect[];
  upgradedDesc?: string;
  upgradedEffects?: Effect[];
  upgradedCost?: number;
  exhaust?: boolean;
  retain?: boolean;
}

export interface CardInstance {
  uid: string;
  defId: string;
  upgraded: boolean;
}

export interface EnemyMove {
  name: string;
  intent: 'attack' | 'defend' | 'buff' | 'debuff';
  damage?: number;
  hits?: number;
  block?: number;
  strength?: number;
  vulnerable?: number;
  weak?: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  maxHp: number;
  art: string;
  pattern: EnemyMove[];
}

export interface EnemyState {
  defId: string;
  hp: number;
  maxHp: number;
  block: number;
  strength: number;
  vulnerable: number;
  weak: number;
  poison: number;
  moveIndex: number;
}

export interface CombatState {
  enemy: EnemyState;
  hand: CardInstance[];
  drawPile: CardInstance[];
  discardPile: CardInstance[];
  exhaustPile: CardInstance[];
  energy: number;
  maxEnergy: number;
  block: number;
  strength: number;
  vulnerable: number;
  weak: number;
  combo: number;
  dexterity: number;
  turn: number;
  over: 'won' | 'lost' | null;
  log: string[];
}

export interface MapNode {
  id: string;
  row: number;
  col: number;
  type: NodeType;
  nextIds: string[];
}

export interface RewardState {
  nodeId: string;
  cards: string[];
  gold: number;
  relic: string | null;
  potion?: string | null;
  boss: boolean;
}

export interface ShopOffer {
  defId: string;
  price: number;
  sold: boolean;
}

export interface ShopState {
  nodeId: string;
  offers: ShopOffer[];
  removalPrice?: number;
  removalUsed?: boolean;
}

export interface EventChoice {
  id: string;
  label: string;
  desc: string;
  disabled?: boolean;
}

export interface EventState {
  nodeId: string;
  id: string;
  title: string;
  text: string;
  art: string;
  choices: EventChoice[];
}

export interface MetaState {
  essence: number;
  unlocked: string[];
  cycle: number;
}

export interface RunState {
  seed: number;
  rngState: number;
  nextUid: number;
  hp: number;
  maxHp: number;
  gold: number;
  floor: number;
  cycle: number;
  metaSettled?: boolean;
  lastEssenceGain?: number;
  potions: string[];
  deck: CardInstance[];
  relics: string[];
  map: MapNode[][];
  availableIds: string[];
  currentNodeId: string | null;
  completedIds: string[];
  screen: Screen;
  combat: CombatState | null;
  reward: RewardState | null;
  shop: ShopState | null;
  event: EventState | null;
  log: string[];
}

export interface RelicDef {
  id: string;
  name: string;
  desc: string;
  art: string;
}
