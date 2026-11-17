import { MISSIONS, TRADE_GOODS } from '../data/historicalData';
import { PlayerSaveState, ShipTier, ZoneId } from '../types/game';

export const SAVE_STORAGE_KEY = 'waters_of_srivijaya_save_v1';

export function createInitialSaveState(): PlayerSaveState {
  return {
    masaCoins: 42,
    shipTier: 1,
    hullIntegrity: 100,
    prosperityLevel: 1,
    currentZone: 'palembang',
    unlockedZones: ['palembang', 'muaro_jambi', 'bangka_strait', 'sunda_strait'],
    completedMissionIds: [],
    activeMissionId: MISSIONS[0].id,
    inventory: {
      pepper: 2,
      benzoin: 1
    },
    appearance: {
      tunic: 'indigo',
      tanjak: 'gold'
    },
    lanternsReleased: 0,
    codexDiscovered: ['kedatuan', 'musi'],
    hasOathWater: false
  };
}

export function loadSaveState(): PlayerSaveState {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return createInitialSaveState();
    }
    const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return createInitialSaveState();
    const parsed = JSON.parse(raw) as Partial<PlayerSaveState>;
    const defaults = createInitialSaveState();
    return {
      ...defaults,
      ...parsed,
      inventory: { ...defaults.inventory, ...(parsed.inventory ?? {}) },
      appearance: { ...defaults.appearance, ...(parsed.appearance ?? {}) },
      unlockedZones:
        Array.isArray(parsed.unlockedZones) && parsed.unlockedZones.length > 0
          ? (parsed.unlockedZones as ZoneId[])
          : defaults.unlockedZones,
      completedMissionIds: Array.isArray(parsed.completedMissionIds)
        ? parsed.completedMissionIds
        : defaults.completedMissionIds,
      codexDiscovered: Array.isArray(parsed.codexDiscovered)
        ? parsed.codexDiscovered
        : defaults.codexDiscovered
    };
  } catch {
    return createInitialSaveState();
  }
}

export function persistSaveState(state: PlayerSaveState): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Ignore storage quota errors cleanly
  }
}

/**
 * Computes wind-alignment efficiency [0..1] from boat heading (deg) and zone wind angle (deg).
 * 1.0 = sailing with a favorable beam/tail breeze; minimum 0.35 when sailing directly into the wind.
 */
export function computeWindAlignment(headingDeg: number, windAngleDeg: number): number {
  const rad = ((headingDeg - windAngleDeg) * Math.PI) / 180;
  // cos(0) = 1 (tailwind), cos(PI) = -1 (headwind); beam reach (90 deg) still sails decently in outriggers
  const cosVal = Math.cos(rad);
  const raw = 0.68 + 0.32 * cosVal;
  return Math.max(0.35, Math.min(1, Number(raw.toFixed(3))));
}

/**
 * Computes forward boat speed in world units/sec given sail hoist, wind alignment, wind strength, and ship tier.
 */
export function computeBoatSpeed(params: {
  sailHoist: number;
  windAlignment: number;
  windStrength: number;
  shipTier: ShipTier;
}): number {
  const clampedHoist = Math.max(0, Math.min(1, params.sailHoist));
  const tierFactor = params.shipTier === 1 ? 1.0 : params.shipTier === 2 ? 1.28 : 1.52;
  const paddleBase = 1.4; // Raka can always gently paddle even with sail reefed
  const sailThrust = clampedHoist * 10.5 * params.windAlignment * params.windStrength;
  return Number(((paddleBase * clampedHoist + sailThrust) * tierFactor).toFixed(2));
}

export interface ScaleBalanceResult {
  leftWeight: number;
  rightWeight: number;
  tiltAngleRad: number;
  isBalanced: boolean;
  playerOfferValueMasa: number;
  merchantGoodsValueMasa: number;
  fairDeal: boolean;
}

/**
 * Evaluates the 3D bronze balance scale for the Floating Market barter mini-game.
 * Left pan = Merchant's chosen item(s) weight; Right pan = Player's barter goods + Masa coins weight.
 * Every 5 Masa coins counts as 1 weight unit on the bronze balance scale.
 */
export function evaluateBronzeScale(params: {
  merchantGoodId: string;
  merchantQty: number;
  playerOfferGoods: Record<string, number>;
  playerOfferMasa: number;
}): ScaleBalanceResult {
  const merchantItem = TRADE_GOODS.find((g) => g.id === params.merchantGoodId);
  const mQty = Math.max(1, params.merchantQty);
  const leftWeight = (merchantItem ? merchantItem.weightUnit : 1) * mQty;
  const merchantGoodsValueMasa = (merchantItem ? merchantItem.baseValueMasa : 10) * mQty;

  let rightWeight = params.playerOfferMasa / 10;
  let playerOfferValueMasa = params.playerOfferMasa;

  for (const [goodId, qty] of Object.entries(params.playerOfferGoods)) {
    if (qty <= 0) continue;
    const item = TRADE_GOODS.find((g) => g.id === goodId);
    if (!item) continue;
    rightWeight += item.weightUnit * qty;
    playerOfferValueMasa += item.baseValueMasa * qty;
  }

  const diff = rightWeight - leftWeight;
  // Positive tilt dips right pan down, negative dips left pan down
  const tiltAngleRad = Math.max(-0.34, Math.min(0.34, diff * 0.085));
  const isBalanced = Math.abs(diff) <= 0.85;
  const fairDeal = playerOfferValueMasa >= Math.ceil(merchantGoodsValueMasa * 0.9);

  return {
    leftWeight: Number(leftWeight.toFixed(1)),
    rightWeight: Number(rightWeight.toFixed(1)),
    tiltAngleRad: Number(tiltAngleRad.toFixed(3)),
    isBalanced,
    playerOfferValueMasa,
    merchantGoodsValueMasa,
    fairDeal
  };
}

export function getShipUpgradeCost(currentTier: ShipTier): number | null {
  if (currentTier === 1) return 45;
  if (currentTier === 2) return 90;
  return null;
}

export function getShipName(tier: ShipTier): string {
  if (tier === 1) return 'Musi Perahu (River Ferry)';
  if (tier === 2) return 'Twin-Outrigger Perahu';
  return 'Nusantara Jong Trader';
}

export function advanceMissionState(
  state: PlayerSaveState,
  action:
    | 'trade_market'
    | 'craft_shipbuilding'
    | 'craft_prasasti'
    | 'craft_lantern'
    | 'sail_beacon'
    | 'deliver_oath_water',
  zoneId: ZoneId
): { nextState: PlayerSaveState; completedMissionTitle: string | null; allCompleted: boolean } {
  const active = MISSIONS.find((m) => m.id === state.activeMissionId);
  if (!active || active.requiredAction !== action || active.zoneId !== zoneId) {
    return { nextState: state, completedMissionTitle: null, allCompleted: false };
  }

  const completedIds = state.completedMissionIds.includes(active.id)
    ? state.completedMissionIds
    : [...state.completedMissionIds, active.id];

  const nextMission = MISSIONS.find((m) => !completedIds.includes(m.id));
  const allCompleted = !nextMission;

  let nextOath = state.hasOathWater;
  if (action === 'craft_prasasti') nextOath = true;
  if (action === 'deliver_oath_water') nextOath = false;

  const nextState: PlayerSaveState = {
    ...state,
    masaCoins: state.masaCoins + active.rewardMasa,
    prosperityLevel: Math.min(7, state.prosperityLevel + active.rewardProsperity),
    completedMissionIds: completedIds,
    activeMissionId: nextMission ? nextMission.id : active.id,
    hasOathWater: nextOath
  };

  return {
    nextState,
    completedMissionTitle: active.title,
    allCompleted
  };
}
