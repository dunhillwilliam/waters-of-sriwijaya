import React from 'react';
import { DIALOGUES, MISSIONS } from '../data/historicalData';
import { PlayerSaveState } from '../types/game';

interface DialogueModalProps {
  npcId: string;
  save: PlayerSaveState;
  onClose: () => void;
  onAction: (actionType: string) => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  npcId,
  save,
  onClose,
  onAction
}) => {
  const node = DIALOGUES[npcId];
  if (!node) return null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(12, 9, 6, 0.65)' }}
      role="dialog"
      aria-label={`Dialogue with ${node.speaker}`}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-[#d4a853]/45 p-5 sm:p-6 shadow-2xl space-y-4"
        style={{ backgroundColor: '#1b140d' }}
      >
        <div>
          <div className="text-xs text-[#d4a853] font-medium">{node.role}</div>
          <h3 className="font-display text-2xl font-bold text-[#f7efe2]">{node.speaker}</h3>
        </div>
        <div className="space-y-2.5 text-sm text-[#e6dfd4] leading-relaxed">
          {node.lines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
        {npcId === 'panglima_tuah' && !save.hasOathWater && !save.completedMissionIds.includes('act2_oath') && (
          <div className="p-3 rounded-lg bg-[#2a1f15] border border-[#d4a853]/25 text-xs text-[#f3c363]">
            Tip: Visit Bhiksu Dharmapala in Muaro Jambi first to receive the Sacred Oath-Water jar!
          </div>
        )}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#d4a853]/30 text-xs font-medium text-[#cbbba4] hover:text-[#f5efe6] cursor-pointer"
          >
            Farewell
          </button>
          {node.actionLabel && node.actionType && (
            <button
              type="button"
              onClick={() => onAction(node.actionType!)}
              className="px-5 py-2 rounded-lg bg-[#d4a853] hover:bg-[#e5b864] text-[#1a120a] text-xs font-semibold cursor-pointer"
            >
              {node.actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface PauseVictoryModalProps {
  mode: 'paused' | 'gameover';
  save: PlayerSaveState;
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
  onOpenBlueprint: () => void;
}

export const PauseVictoryModal: React.FC<PauseVictoryModalProps> = ({
  mode,
  save,
  onResume,
  onRestart,
  onReturnTitle,
  onOpenBlueprint
}) => {
  const isVictory = mode === 'gameover';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(10, 7, 4, 0.8)' }}
      role="dialog"
      aria-label={isVictory ? 'Mandala Victory' : 'Voyage Paused'}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[#d4a853]/45 p-6 shadow-2xl space-y-5 text-center"
        style={{ backgroundColor: '#1b140d' }}
      >
        <div>
          <div className="text-xs text-[#d4a853] font-medium">
            {isVictory ? 'Nusantara Mandala United' : 'Voyage Paused'}
          </div>
          <h2 className="font-display text-3xl font-bold text-[#f7efe2] mt-1">
            {isVictory ? 'Keeper of the Straits' : 'Anchored on the Musi'}
          </h2>
          <p className="text-xs text-[#cbbba4] mt-2 leading-relaxed">
            {isVictory
              ? 'From a humble river ferry apprentice to a trusted envoy across Palembang, Muaro Jambi, Bangka, and Sunda—your lanterns light the sea lanes.'
              : 'Take a breath and admire the river breeze, or resume your voyage.'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 rounded-lg bg-[#241b12] border border-[#d4a853]/20">
            <div className="text-[11px] text-[#cbbba4]">Masa</div>
            <div className="font-mono-num text-lg font-bold text-[#f3c363]">
              {Math.round(save.masaCoins)}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#241b12] border border-[#d4a853]/20">
            <div className="text-[11px] text-[#cbbba4]">Missions</div>
            <div className="font-mono-num text-lg font-bold text-[#f5efe6]">
              {save.completedMissionIds.length}/{MISSIONS.length}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#241b12] border border-[#d4a853]/20">
            <div className="text-[11px] text-[#cbbba4]">Prosperity</div>
            <div className="font-mono-num text-lg font-bold text-[#84c99b]">
              Lv.{save.prosperityLevel}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {!isVictory ? (
            <button
              type="button"
              onClick={onResume}
              className="w-full py-2.5 rounded-lg bg-[#d4a853] hover:bg-[#e5b864] text-[#1a120a] font-semibold text-sm cursor-pointer"
            >
              Resume Voyage
            </button>
          ) : (
            <button
              type="button"
              data-start="true"
              onClick={onRestart}
              className="w-full py-2.5 rounded-lg bg-[#d4a853] hover:bg-[#e5b864] text-[#1a120a] font-semibold text-sm cursor-pointer"
            >
              Begin New Voyage
            </button>
          )}
          <button
            type="button"
            onClick={onOpenBlueprint}
            className="w-full py-2 rounded-lg bg-[#281e14] hover:bg-[#35281b] border border-[#d4a853]/30 text-xs font-medium text-[#f3c363] cursor-pointer"
          >
            View Three.js Architecture &amp; Specs
          </button>
          {!isVictory && (
            <button
              type="button"
              onClick={onRestart}
              className="w-full py-2 rounded-lg bg-[#281e14] hover:bg-[#35281b] border border-[#d4a853]/25 text-xs font-medium text-[#e6dfd4] cursor-pointer"
            >
              Restart Voyage
            </button>
          )}
          <button
            type="button"
            onClick={onReturnTitle}
            className="w-full py-2 rounded-lg text-xs text-[#cbbba4] hover:text-[#f5efe6] cursor-pointer"
          >
            Return to Title Screen
          </button>
        </div>
      </div>
    </div>
  );
};
