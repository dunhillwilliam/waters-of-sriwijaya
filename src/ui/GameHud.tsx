import React, { useRef, useState } from 'react';
import { getShipName } from '../core/questRules';
import { MISSIONS, ZONES } from '../data/historicalData';
import { ActiveOverlay, BoatTelemetry, PlayerSaveState } from '../types/game';

interface GameHudProps {
  save: PlayerSaveState;
  telemetry: BoatTelemetry;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onOpenOverlay: (overlay: ActiveOverlay) => void;
  onInteract: () => void;
  onSailHoistChange: (val: number) => void;
  onThumbStickChange: (x: number, y: number) => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  save,
  telemetry,
  isMuted,
  onToggleMute,
  onPause,
  onOpenOverlay,
  onInteract,
  onSailHoistChange,
  onThumbStickChange
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [touchMode, setTouchMode] = useState(false);
  const stickRef = useRef<HTMLDivElement | null>(null);
  const [stickOffset, setStickOffset] = useState({ x: 0, y: 0 });
  const draggingStick = useRef(false);

  const zone = ZONES[save.currentZone];
  const activeMission = MISSIONS.find((m) => m.id === save.activeMissionId);

  const handleStickPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!stickRef.current) return;
    const rect = stickRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width / 2 - 14;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    const scale = dist > maxR ? maxR / dist : 1;
    const nx = (dx * scale) / maxR;
    const ny = -(dy * scale) / maxR;
    setStickOffset({ x: dx * scale, y: dy * scale });
    onThumbStickChange(nx, ny);
  };

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-5">
      {/* TOP PERIMETER ROW: Zone + Mission (Left) & Masa + Icon Utilities (Right) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-2 sm:gap-4">
        {/* Top-left compact cluster */}
        <div
          className="pointer-events-auto rounded-lg border border-[#d4a853]/30 px-3 sm:px-4 py-2 sm:py-2.5 sm:max-w-sm"
          style={{ backgroundColor: 'rgba(22, 16, 11, 0.84)' }}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-[#d4a853] font-medium whitespace-nowrap overflow-hidden">
            <span className="shrink-0">{zone.name}</span>
            <span aria-hidden="true">·</span>
            <span className="shrink-0">Act {zone.act}</span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="hidden sm:inline truncate">{getShipName(save.shipTier)}</span>
          </div>
          {activeMission && (
            <p className="text-xs sm:text-sm text-[#f5efe6] mt-0.5 leading-snug line-clamp-2">
              {save.completedMissionIds.length >= MISSIONS.length
                ? 'All Mandala Alliances United — Free Sail'
                : activeMission.objectiveText}
            </p>
          )}
        </div>

        {/* Top-right compact Masa + Utility Buttons */}
        <div className="pointer-events-auto flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2">
          <div
            className="rounded-lg border border-[#d4a853]/30 px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm whitespace-nowrap"
            style={{ backgroundColor: 'rgba(22, 16, 11, 0.84)' }}
          >
            <div>
              <span className="text-[11px] text-[#cbbba4] mr-1.5">Masa</span>
              <span className="font-mono-num font-semibold text-[#f3c363]" data-testid="masa-count">
                {Math.round(save.masaCoins)}
              </span>
            </div>
            <span aria-hidden="true" className="text-[#d4a853]/40">|</span>
            <div>
              <span className="text-[11px] text-[#cbbba4] mr-1.5">Mandala</span>
              <span className="font-mono-num font-semibold text-[#e6dfd4]">
                {save.completedMissionIds.length}/{MISSIONS.length}
              </span>
            </div>
          </div>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Open Pocket Codex"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenOverlay('codex');
            }}
            className="w-10 h-10 rounded-lg border border-[#d4a853]/35 flex items-center justify-center text-[#f3c363] hover:bg-[#d4a853]/15 transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(22, 16, 11, 0.86)' }}
            title="Pocket Codex (C)"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z" />
              <path d="M8 7h8M8 11h6" />
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Open Star-Chart Map"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenOverlay('map');
            }}
            className="w-10 h-10 rounded-lg border border-[#d4a853]/35 flex items-center justify-center text-[#f3c363] hover:bg-[#d4a853]/15 transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(22, 16, 11, 0.86)' }}
            title="Star-Chart Map (M)"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <polygon points="12,6 14.5,12 12,18 9.5,12" fill="currentColor" opacity="0.35" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="w-10 h-10 rounded-lg border border-[#d4a853]/35 flex items-center justify-center text-[#e6dfd4] hover:bg-[#d4a853]/15 transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(22, 16, 11, 0.86)' }}
            title="Toggle Audio"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M11 5L6 9H3v6h3l5 4V5z" />
              {isMuted ? (
                <path d="M16 9l5 6m0-6l-5 6" />
              ) : (
                <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" />
              )}
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Pause Game"
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            className="w-10 h-10 rounded-lg border border-[#d4a853]/35 flex items-center justify-center text-[#e6dfd4] hover:bg-[#d4a853]/15 transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(22, 16, 11, 0.86)' }}
            title="Pause (Esc / P)"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* BOTTOM PERIMETER: Contextual Prompt + Collapsible Sailing & Action Dock */}
      <div className="flex flex-col items-center gap-2.5">
        {/* Contextual Mooring / NPC Prompt */}
        {telemetry.nearInteractable && (
          <button
            type="button"
            onClick={onInteract}
            className="pointer-events-auto px-5 py-2.5 rounded-lg bg-[#d4a853] hover:bg-[#e5b864] text-[#1a120a] font-semibold text-sm shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-2.5"
          >
            <span>[E] {telemetry.nearInteractable.label}</span>
            <span className="text-xs font-normal opacity-80">· {telemetry.nearInteractable.sublabel}</span>
          </button>
        )}

        {/* Touch Thumbstick when Touch Mode is active */}
        {touchMode && (
          <div className="w-full flex justify-start pl-2 pb-1">
            <div
              ref={stickRef}
              onPointerDown={(e) => {
                draggingStick.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                handleStickPointer(e);
              }}
              onPointerMove={(e) => {
                if (draggingStick.current) handleStickPointer(e);
              }}
              onPointerUp={() => {
                draggingStick.current = false;
                setStickOffset({ x: 0, y: 0 });
                onThumbStickChange(0, 0);
              }}
              className="pointer-events-auto relative w-28 h-28 rounded-full border-2 border-[#d4a853]/50 flex items-center justify-center touch-none"
              style={{ backgroundColor: 'rgba(22, 16, 11, 0.72)' }}
              aria-label="Virtual Sailing Thumbstick"
            >
              <div
                className="w-11 h-11 rounded-full bg-[#d4a853] shadow-md"
                style={{
                  transform: `translate(${stickOffset.x}px, ${stickOffset.y}px)`
                }}
              />
            </div>
          </div>
        )}

        {/* Collapse / Expand Toggle */}
        <button
          type="button"
          onClick={() => setDockCollapsed((v) => !v)}
          className="pointer-events-auto px-3 py-1 rounded-t-lg border border-b-0 border-[#d4a853]/30 text-[11px] text-[#cbbba4] hover:text-[#f5efe6] cursor-pointer"
          style={{ backgroundColor: 'rgba(22, 16, 11, 0.84)' }}
        >
          {dockCollapsed ? '▴ Show Helm Controls' : '▾ Hide Helm Controls'}
        </button>

        {!dockCollapsed && (
          <div
            className="pointer-events-auto w-full max-w-[820px] rounded-xl border border-[#d4a853]/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3"
            style={{ backgroundColor: 'rgba(22, 16, 11, 0.88)' }}
          >
            {/* Speed & Wind Alignment Readouts */}
            <div className="flex items-center gap-4 text-xs">
              <div>
                <div className="text-[10px] text-[#cbbba4]">Speed</div>
                <div className="font-mono-num text-base font-semibold text-[#f5efe6]">
                  {telemetry.speedKnots} <span className="text-[11px] font-normal text-[#cbbba4]">kn</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#cbbba4]">Monsoon</div>
                <div className="font-mono-num text-base font-semibold text-[#84c99b]">
                  {Math.round(telemetry.windAlignment * 100)}%
                </div>
              </div>
            </div>

            {/* Tactile Sail Hoist Slider */}
            <label className="flex items-center gap-2.5 text-xs text-[#e6dfd4] flex-1 min-w-[160px] max-w-[240px]">
              <span className="whitespace-nowrap text-[#cbbba4]">Sail</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(telemetry.sailHoist * 100)}
                onChange={(e) => onSailHoistChange(Number(e.target.value) / 100)}
                aria-label="Hoist or Reef Sail"
                className="w-full accent-[#d4a853] cursor-pointer"
              />
              <span className="font-mono-num w-9 text-right">
                {Math.round(telemetry.sailHoist * 100)}%
              </span>
            </label>

            {/* Quick Harbor & Craft Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenOverlay('market')}
                className="px-3 py-1.5 rounded-lg bg-[#34261a] hover:bg-[#493625] border border-[#d4a853]/30 text-xs font-medium text-[#f3c363] cursor-pointer whitespace-nowrap"
              >
                Market
              </button>
              <button
                type="button"
                onClick={() => onOpenOverlay('craft')}
                className="px-3 py-1.5 rounded-lg bg-[#34261a] hover:bg-[#493625] border border-[#d4a853]/30 text-xs font-medium text-[#e6dfd4] cursor-pointer whitespace-nowrap"
              >
                Craft
              </button>
              <button
                type="button"
                onClick={() => setTouchMode((v) => !v)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer whitespace-nowrap ${
                  touchMode
                    ? 'bg-[#d4a853] text-[#1a120a] border-[#d4a853]'
                    : 'bg-[#261c13] text-[#cbbba4] border-[#d4a853]/25 hover:text-[#f5efe6]'
                }`}
              >
                Touch Pad
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
