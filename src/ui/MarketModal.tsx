import React, { useMemo, useState } from 'react';
import { audioEngine } from '../core/audioEngine';
import {
  evaluateBronzeScale,
  getShipName,
  getShipUpgradeCost
} from '../core/questRules';
import { TRADE_GOODS, ZONES } from '../data/historicalData';
import { PlayerSaveState } from '../types/game';

interface MarketModalProps {
  save: PlayerSaveState;
  initialGoodId?: string | null;
  onClose: () => void;
  onCompleteTrade: (params: {
    boughtGoodId: string;
    boughtQty: number;
    spentGoods: Record<string, number>;
    spentMasa: number;
  }) => void;
  onUpgradeShip: () => void;
}

export const MarketModal: React.FC<MarketModalProps> = ({
  save,
  initialGoodId,
  onClose,
  onCompleteTrade,
  onUpgradeShip
}) => {
  const zone = ZONES[save.currentZone];
  const portGoods = useMemo(
    () => TRADE_GOODS.filter((g) => zone.marketGoods.includes(g.id)),
    [zone.marketGoods]
  );

  const [selectedGoodId, setSelectedGoodId] = useState<string>(
    initialGoodId && zone.marketGoods.includes(initialGoodId)
      ? initialGoodId
      : portGoods[0]?.id ?? 'camphor'
  );
  const [buyQty, setBuyQty] = useState(1);
  const [offerGoods, setOfferGoods] = useState<Record<string, number>>({});
  const [offerMasa, setOfferMasa] = useState<number>(10);
  const [inspectAngle, setInspectAngle] = useState<number>(0);

  const selectedGood = TRADE_GOODS.find((g) => g.id === selectedGoodId) ?? portGoods[0];
  const scaleResult = evaluateBronzeScale({
    merchantGoodId: selectedGood.id,
    merchantQty: buyQty,
    playerOfferGoods: offerGoods,
    playerOfferMasa: offerMasa
  });

  const upgradeCost = getShipUpgradeCost(save.shipTier);
  const canAffordOffer = offerMasa <= save.masaCoins;
  const canConfirmTrade = scaleResult.fairDeal && scaleResult.isBalanced && canAffordOffer;

  const adjustOfferGood = (goodId: string, delta: number) => {
    const owned = save.inventory[goodId] ?? 0;
    const current = offerGoods[goodId] ?? 0;
    const next = Math.max(0, Math.min(owned, current + delta));
    setOfferGoods({ ...offerGoods, [goodId]: next });
    audioEngine.playBambooChime(1);
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(12, 9, 6, 0.72)' }}
      role="dialog"
      aria-label="Floating Market and Bronze Balance Scale"
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto scroll-thin rounded-xl border border-[#d4a853]/40 p-5 sm:p-6 shadow-2xl"
        style={{ backgroundColor: '#1b140d' }}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#d4a853]/20">
          <div>
            <div className="text-xs text-[#d4a853] font-medium">
              {zone.name} Floating Market · Pasar Terapung
            </div>
            <h2 className="font-display text-2xl font-bold text-[#f7efe2]">
              Weigh &amp; Barter at the Bronze Scale
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-[#d4a853]/35 text-sm text-[#e6dfd4] hover:bg-[#d4a853]/15 cursor-pointer"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-5">
          {/* LEFT: Merchant Goods Selection + 3D-style Artifact Inspection */}
          <div className="space-y-4">
            <div className="text-xs font-medium text-[#cbbba4]">
              1. Pick Cargo From the Merchant Raft
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {portGoods.map((good) => {
                const active = good.id === selectedGood.id;
                return (
                  <button
                    key={good.id}
                    type="button"
                    onClick={() => {
                      setSelectedGoodId(good.id);
                      audioEngine.playBambooChime(0);
                    }}
                    className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                      active
                        ? 'border-[#d4a853] bg-[#2c2015]'
                        : 'border-[#d4a853]/20 bg-[#221910] hover:border-[#d4a853]/45'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#f5efe6] truncate">
                        {good.name}
                      </span>
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/25"
                        style={{ backgroundColor: good.colorHex }}
                      />
                    </div>
                    <div className="text-[11px] text-[#cbbba4] mt-0.5">
                      {good.localName} · <span className="font-mono-num">{good.baseValueMasa}</span> Masa
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tactile Artifact Inspector */}
            <div className="p-4 rounded-lg border border-[#d4a853]/25 bg-[#150f0a] space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[#f3c363]">{selectedGood.name}</div>
                  <div className="text-xs text-[#cbbba4]">{selectedGood.origin}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBuyQty((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded bg-[#2a1f15] border border-[#d4a853]/30 text-sm cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="font-mono-num text-sm w-6 text-center">{buyQty}</span>
                  <button
                    type="button"
                    onClick={() => setBuyQty((q) => Math.min(4, q + 1))}
                    className="w-7 h-7 rounded bg-[#2a1f15] border border-[#d4a853]/30 text-sm cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Rotatable Artifact Preview */}
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-lg border border-[#d4a853]/25 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#231a12' }}
                >
                  <svg
                    viewBox="0 0 64 64"
                    className="w-14 h-14 transition-transform"
                    style={{ transform: `rotate(${inspectAngle}deg)` }}
                  >
                    {selectedGood.shape === 'jar' && (
                      <>
                        <path
                          d="M24 14h16l-2 6c6 5 8 14 6 24-2 6-6 10-12 10s-10-4-12-10c-2-10 0-19 6-24l-2-6z"
                          fill={selectedGood.colorHex}
                          stroke={selectedGood.accentHex}
                          strokeWidth="2"
                        />
                        <rect x="25" y="10" width="14" height="5" rx="2" fill={selectedGood.accentHex} />
                      </>
                    )}
                    {selectedGood.shape === 'ingot' && (
                      <polygon
                        points="16,44 24,22 40,22 48,44"
                        fill={selectedGood.colorHex}
                        stroke={selectedGood.accentHex}
                        strokeWidth="2.5"
                      />
                    )}
                    {selectedGood.shape === 'basket' && (
                      <>
                        <path d="M18 32 Q32 18 46 32 Z" fill={selectedGood.colorHex} />
                        <polygon
                          points="16,32 48,32 42,50 22,50"
                          fill={selectedGood.accentHex}
                        />
                      </>
                    )}
                    {selectedGood.shape === 'bundle' && (
                      <>
                        <rect
                          x="20"
                          y="18"
                          width="24"
                          height="30"
                          rx="6"
                          fill={selectedGood.colorHex}
                          stroke={selectedGood.accentHex}
                          strokeWidth="2"
                        />
                        <line x1="20" y1="28" x2="44" y2="28" stroke={selectedGood.accentHex} strokeWidth="2.5" />
                      </>
                    )}
                  </svg>
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-xs text-[#dfd2be] leading-relaxed">
                    {selectedGood.plainDescription}
                  </p>
                  <input
                    type="range"
                    min={-45}
                    max={45}
                    value={inspectAngle}
                    onChange={(e) => setInspectAngle(Number(e.target.value))}
                    aria-label="Rotate item to inspect"
                    className="w-full accent-[#d4a853]"
                  />
                </div>
              </div>
            </div>

            {/* Ship Upgrade Card */}
            <div className="p-3.5 rounded-lg border border-[#d4a853]/30 bg-[#231910] flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-[#d4a853]">Palembang Shipwright Upgrade</div>
                <div className="text-sm font-medium text-[#f5efe6]">
                  Current: {getShipName(save.shipTier)}
                </div>
              </div>
              {upgradeCost !== null ? (
                <button
                  type="button"
                  disabled={save.masaCoins < upgradeCost}
                  onClick={onUpgradeShip}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    save.masaCoins >= upgradeCost
                      ? 'bg-[#d4a853] hover:bg-[#e5b864] text-[#1a120a] cursor-pointer'
                      : 'bg-[#2f2419] text-[#8d7d68] cursor-not-allowed'
                  }`}
                >
                  Upgrade ({upgradeCost} Masa)
                </button>
              ) : (
                <span className="text-xs text-[#84c99b] font-medium">Max Vessel Tier</span>
              )}
            </div>
          </div>

          {/* RIGHT: Interactive Bronze Balance Scale & Offer */}
          <div className="space-y-4">
            <div className="text-xs font-medium text-[#cbbba4]">
              2. Balance the Bronze Scale With Cargo or Masa Coins
            </div>

            {/* Animated SVG Bronze Balance Scale */}
            <div className="p-4 rounded-lg border border-[#d4a853]/25 bg-[#150f0a] flex flex-col items-center">
              <svg viewBox="0 0 260 120" className="w-full max-w-[260px] h-28">
                {/* Central pedestal */}
                <rect x="125" y="24" width="10" height="82" fill="#8d6b38" />
                <polygon points="100,108 160,108 150,98 110,98" fill="#6d4f26" />
                {/* Rotating beam */}
                <g
                  style={{
                    transform: `rotate(${scaleResult.tiltAngleRad}rad)`,
                    transformOrigin: '130px 28px',
                    transition: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <line x1="42" y1="28" x2="218" y2="28" stroke="#d4a853" strokeWidth="4" strokeLinecap="round" />
                  {/* Left Pan (Merchant) */}
                  <line x1="46" y1="28" x2="36" y2="68" stroke="#b58d46" strokeWidth="1.5" />
                  <line x1="46" y1="28" x2="56" y2="68" stroke="#b58d46" strokeWidth="1.5" />
                  <path d="M26 68 Q46 82 66 68 Z" fill="#b58d46" />
                  <text x="46" y="92" textAnchor="middle" fill="#cbbba4" fontSize="10">
                    {scaleResult.leftWeight} wt
                  </text>

                  {/* Right Pan (Raka's Offer) */}
                  <line x1="214" y1="28" x2="204" y2="68" stroke="#b58d46" strokeWidth="1.5" />
                  <line x1="214" y1="28" x2="224" y2="68" stroke="#b58d46" strokeWidth="1.5" />
                  <path d="M194 68 Q214 82 234 68 Z" fill="#d4a853" />
                  <text x="214" y="92" textAnchor="middle" fill="#f3c363" fontSize="10">
                    {scaleResult.rightWeight} wt
                  </text>
                </g>
                <circle cx="130" cy="28" r="5" fill="#f3c363" />
              </svg>

              <div className="flex items-center justify-between w-full text-xs pt-2 border-t border-[#d4a853]/15">
                <span className="text-[#cbbba4]">
                  Merchant Value: <strong className="font-mono-num text-[#f5efe6]">{scaleResult.merchantGoodsValueMasa}</strong> Masa
                </span>
                <span className={scaleResult.isBalanced && scaleResult.fairDeal ? 'text-[#84c99b] font-semibold' : 'text-[#e59866]'}>
                  {scaleResult.isBalanced && scaleResult.fairDeal
                    ? 'Scale Balanced & Fair!'
                    : !scaleResult.fairDeal
                    ? 'Offer too low'
                    : 'Level the scale weight'}
                </span>
              </div>
            </div>

            {/* Masa Coin Slider */}
            <div className="p-3.5 rounded-lg border border-[#d4a853]/20 bg-[#221910]">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[#cbbba4]">Masa Gold Coins Offered (You hold {save.masaCoins})</span>
                <span className="font-mono-num font-semibold text-[#f3c363]">{offerMasa} Masa</span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(20, save.masaCoins)}
                value={offerMasa}
                onChange={(e) => setOfferMasa(Number(e.target.value))}
                aria-label="Masa gold coins offered"
                className="w-full accent-[#d4a853]"
              />
            </div>

            {/* Raka's Cargo Barter */}
            <div className="p-3.5 rounded-lg border border-[#d4a853]/20 bg-[#221910] space-y-2">
              <div className="text-xs text-[#cbbba4]">Or Barter From Raka’s Cargo Hold:</div>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto scroll-thin">
                {TRADE_GOODS.filter((g) => (save.inventory[g.id] ?? 0) > 0).map((good) => {
                  const owned = save.inventory[good.id] ?? 0;
                  const offered = offerGoods[good.id] ?? 0;
                  return (
                    <div
                      key={good.id}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded bg-[#18120c] border border-[#d4a853]/15 text-xs"
                    >
                      <div className="truncate mr-1">
                        <div className="text-[#f5efe6] truncate">{good.name}</div>
                        <div className="text-[10px] text-[#cbbba4]">Own {owned}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => adjustOfferGood(good.id, -1)}
                          className="w-6 h-6 rounded bg-[#2b2015] cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono-num w-4 text-center">{offered}</span>
                        <button
                          type="button"
                          onClick={() => adjustOfferGood(good.id, 1)}
                          className="w-6 h-6 rounded bg-[#2b2015] cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
                {Object.values(save.inventory).every((v) => v <= 0) && (
                  <div className="text-xs text-[#cbbba4] col-span-2">
                    Cargo hold empty — trade using Masa coins!
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={!canConfirmTrade}
              onClick={() => {
                audioEngine.playCoinTrade();
                onCompleteTrade({
                  boughtGoodId: selectedGood.id,
                  boughtQty: buyQty,
                  spentGoods: offerGoods,
                  spentMasa: offerMasa
                });
              }}
              className={`w-full py-3 rounded-lg font-semibold text-sm transition-colors ${
                canConfirmTrade
                  ? 'bg-[#d4a853] hover:bg-[#e5b864] text-[#1a120a] cursor-pointer'
                  : 'bg-[#2c2117] text-[#857561] cursor-not-allowed'
              }`}
            >
              Seal Fair Trade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
