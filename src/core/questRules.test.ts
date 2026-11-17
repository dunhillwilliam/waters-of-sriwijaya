import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceMissionState,
  computeBoatSpeed,
  computeWindAlignment,
  createInitialSaveState,
  evaluateBronzeScale,
  getShipUpgradeCost
} from './questRules';

test('wind alignment returns 1.0 on tailwind and >=0.35 on headwind', () => {
  assert.equal(computeWindAlignment(45, 45), 1);
  assert.equal(computeWindAlignment(225, 45), 0.36);
  const cross = computeWindAlignment(135, 45);
  assert.ok(cross > 0.6 && cross < 0.75);
});

test('boat speed scales with sail hoist and ship tier', () => {
  const zero = computeBoatSpeed({ sailHoist: 0, windAlignment: 1, windStrength: 1, shipTier: 1 });
  assert.equal(zero, 0);
  const tier1 = computeBoatSpeed({ sailHoist: 1, windAlignment: 1, windStrength: 1, shipTier: 1 });
  const tier2 = computeBoatSpeed({ sailHoist: 1, windAlignment: 1, windStrength: 1, shipTier: 2 });
  assert.ok(tier2 > tier1);
});

test('bronze balance scale detects fair and balanced barter deals', () => {
  const unbalanced = evaluateBronzeScale({
    merchantGoodId: 'camphor',
    merchantQty: 1,
    playerOfferGoods: {},
    playerOfferMasa: 5
  });
  assert.equal(unbalanced.fairDeal, false);
  assert.ok(unbalanced.tiltAngleRad < 0);

  const balanced = evaluateBronzeScale({
    merchantGoodId: 'camphor',
    merchantQty: 1,
    playerOfferGoods: {},
    playerOfferMasa: 14
  });
  assert.equal(balanced.fairDeal, true);
  assert.equal(balanced.isBalanced, true);
});

test('Mandala 3-Act mission chain advances cleanly through all 5 missions', () => {
  let state = createInitialSaveState();
  const steps: Array<{
    action: 'trade_market' | 'craft_shipbuilding' | 'craft_prasasti' | 'deliver_oath_water' | 'craft_lantern';
    zone: 'palembang' | 'muaro_jambi' | 'bangka_strait' | 'sunda_strait';
  }> = [
    { action: 'trade_market', zone: 'palembang' },
    { action: 'craft_shipbuilding', zone: 'palembang' },
    { action: 'craft_prasasti', zone: 'muaro_jambi' },
    { action: 'deliver_oath_water', zone: 'bangka_strait' },
    { action: 'craft_lantern', zone: 'sunda_strait' }
  ];

  let allDone = false;
  for (const step of steps) {
    const res = advanceMissionState(state, step.action, step.zone);
    assert.ok(res.completedMissionTitle !== null, `Expected ${step.action} to complete`);
    state = res.nextState;
    allDone = res.allCompleted;
  }

  assert.equal(allDone, true);
  assert.equal(state.completedMissionIds.length, 5);
  assert.ok(state.prosperityLevel >= 7);
  assert.equal(getShipUpgradeCost(1), 45);
  assert.equal(getShipUpgradeCost(3), null);
});
