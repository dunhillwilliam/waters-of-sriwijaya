export type GamePhase = 'title' | 'playing' | 'paused' | 'gameover';

export type ActiveOverlay =
  | 'none'
  | 'market'
  | 'craft'
  | 'codex'
  | 'map'
  | 'dialogue'
  | 'blueprint';

export type CraftMiniGameType = 'shipbuilding' | 'prasasti' | 'lantern';

export type ZoneId = 'palembang' | 'muaro_jambi' | 'bangka_strait' | 'sunda_strait';

export type TunicColorId = 'indigo' | 'saffron' | 'crimson';
export type TanjakColorId = 'gold' | 'ivory';

export interface RakaAppearance {
  tunic: TunicColorId;
  tanjak: TanjakColorId;
}

export type ShipTier = 1 | 2 | 3;

export interface TradeGood {
  id: string;
  name: string;
  localName: string;
  origin: string;
  baseValueMasa: number;
  weightUnit: number;
  colorHex: string;
  accentHex: string;
  shape: 'jar' | 'bundle' | 'ingot' | 'basket';
  plainDescription: string;
}

export interface ZoneInfo {
  id: ZoneId;
  name: string;
  subtitle: string;
  act: 1 | 2 | 3;
  windAngleDeg: number;
  windStrength: number;
  skyTopHex: number;
  skyHorizonHex: number;
  fogHex: number;
  waterShallowHex: number;
  waterDeepHex: number;
  sunElevationDeg: number;
  description: string;
  marketGoods: string[];
  craftStation: CraftMiniGameType;
}

export interface QuestMission {
  id: string;
  act: 1 | 2 | 3;
  title: string;
  zoneId: ZoneId;
  giver: string;
  giverRole: string;
  objectiveText: string;
  plainSummary: string;
  rewardMasa: number;
  rewardProsperity: number;
  requiredAction:
    | 'trade_market'
    | 'craft_shipbuilding'
    | 'craft_prasasti'
    | 'craft_lantern'
    | 'sail_beacon'
    | 'deliver_oath_water';
}

export interface CodexEntry {
  id: string;
  term: string;
  pronunciation: string;
  category: 'Place' | 'People' | 'Craft' | 'Society';
  shortMeaning: string;
  didYouKnow: string;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  role: string;
  zoneId: ZoneId;
  lines: string[];
  actionLabel?: string;
  actionType?: 'market' | 'craft_ship' | 'craft_prasasti' | 'craft_lantern' | 'deliver_oath' | 'upgrade_ship';
}

export interface PlayerSaveState {
  masaCoins: number;
  shipTier: ShipTier;
  hullIntegrity: number;
  prosperityLevel: number;
  currentZone: ZoneId;
  unlockedZones: ZoneId[];
  completedMissionIds: string[];
  activeMissionId: string;
  inventory: Record<string, number>;
  appearance: RakaAppearance;
  lanternsReleased: number;
  codexDiscovered: string[];
  hasOathWater: boolean;
}

export interface BoatTelemetry {
  speedKnots: number;
  sailHoist: number; // 0 to 1
  windAlignment: number; // 0 to 1
  headingDeg: number;
  windAngleDeg: number;
  hullIntegrity: number;
  nearInteractable: InteractablePrompt | null;
}

export interface InteractablePrompt {
  id: string;
  kind: 'market' | 'npc' | 'craft' | 'beacon' | 'hazard';
  label: string;
  sublabel: string;
  zoneId: ZoneId;
  craftType?: CraftMiniGameType;
  npcId?: string;
}
