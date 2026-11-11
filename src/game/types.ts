export type CardType = 'action' | 'facility';
export type Rarity = 'common' | 'uncommon' | 'rare';
export type Phase = 'playing' | 'won' | 'lost';
export type Tone = 'info' | 'good' | 'bad' | 'event';

export interface CardDef {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  glyph: string;
  desc: string[];
  flavor: string;
  rarity: Rarity;
  shop: boolean;
}

export interface CardInstance {
  uid: number;
  defId: string;
}

export interface Facility {
  uid: number;
  defId: string;
  builtDay: number;
}

export interface ShopOffer {
  defId: string;
  price: number;
  sold: boolean;
}

export interface LogEntry {
  day: number;
  text: string;
  tone: Tone;
}

export interface EventNote {
  id: string;
  day: number;
  name: string;
  text: string;
  tone: Tone;
}

export interface Ending {
  won: boolean;
  title: string;
  text: string;
}

export interface GameState {
  version: number;
  seed: number;
  rngState: number;
  day: number;
  maxDays: number;
  winReputation: number;
  phase: Phase;
  stones: number;
  disciples: number;
  reputation: number;
  deck: CardInstance[];
  hand: CardInstance[];
  discard: CardInstance[];
  facilities: Facility[];
  shop: ShopOffer[];
  shopRefreshed: boolean;
  lastEventDay: number;
  lastEvent: EventNote | null;
  nextUid: number;
  log: LogEntry[];
  ending: Ending | null;
  stats: {
    cardsPlayed: number;
    cardsBought: number;
    events: number;
    daysEnded: number;
  };
}

export interface IncomeItem {
  label: string;
  stones?: number;
  reputation?: number;
  disciples?: number;
}

export interface DailyIncome {
  stones: number;
  reputation: number;
  disciples: number;
  items: IncomeItem[];
}
