import React from 'react';
import { RakaAppearance, TanjakColorId, TunicColorId } from '../types/game';

interface TitleScreenProps {
  appearance: RakaAppearance;
  onChangeAppearance: (next: RakaAppearance) => void;
  onStart: () => void;
}

const TUNIC_OPTIONS: Array<{ id: TunicColorId; label: string; swatch: string }> = [
  { id: 'indigo', label: 'Indigo', swatch: '#2a4569' },
  { id: 'saffron', label: 'Saffron', swatch: '#d48b28' },
  { id: 'crimson', label: 'Crimson', swatch: '#9b2c2c' }
];

const TANJAK_OPTIONS: Array<{ id: TanjakColorId; label: string; swatch: string }> = [
  { id: 'gold', label: 'Gold Silk', swatch: '#d4a853' },
  { id: 'ivory', label: 'Ivory Cotton', swatch: '#efe7d6' }
];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  appearance,
  onChangeAppearance,
  onStart
}) => {
  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-6 sm:p-10 pointer-events-none bg-gradient-to-r from-[#120d08]/85 via-[#120d08]/35 to-transparent">
      {/* Left negative-space composition framing Raka's 3D perahu & rumah rakit on right */}
      <div className="max-w-lg pt-4 sm:pt-8 pointer-events-auto">
        <svg
          viewBox="0 0 360 118"
          className="w-full max-w-[360px] h-auto mb-3"
          role="img"
          aria-label="Waters of Srivijaya Emblem"
        >
          {/* Decorative Nusantara wave + lotus crest */}
          <path
            d="M12 84 Q42 68 72 84 T132 84 T192 84 T252 84 T312 84"
            fill="none"
            stroke="#d4a853"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.82"
          />
          <path
            d="M12 94 Q42 80 72 94 T132 94 T192 94 T252 94"
            fill="none"
            stroke="#f0c878"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.45"
          />
          {/* Stylized lotus / ship prow emblem */}
          <path
            d="M36 58 C28 44, 32 28, 42 22 C52 28, 56 44, 48 58 Z"
            fill="#d4a853"
          />
          <path
            d="M32 58 C18 50, 15 36, 22 29 C28 36, 32 47, 37 58 Z"
            fill="#b85d38"
          />
          <path
            d="M52 58 C66 50, 69 36, 62 29 C56 36, 52 47, 47 58 Z"
            fill="#b85d38"
          />
          <text
            x="84"
            y="40"
            fill="#f7efe2"
            fontFamily="Fraunces, Georgia, serif"
            fontSize="24"
            fontWeight="700"
            letterSpacing="0.5"
          >
            WATERS OF
          </text>
          <text
            x="84"
            y="68"
            fill="#eab75c"
            fontFamily="Fraunces, Georgia, serif"
            fontSize="30"
            fontWeight="700"
            letterSpacing="1"
          >
            ŚRĪVIJAYA
          </text>
        </svg>

        <p className="text-sm sm:text-base text-[#eadcc8] leading-relaxed max-w-md mb-6">
          Begin as Raka, a young Musi River ferry apprentice in 9th-century Palembang. Sail wooden outriggers, weigh spices at floating markets, and unite the sea peoples of Nusantara.
        </p>

        {/* Raka Outfit Customization */}
        <div
          className="mb-6 p-4 rounded-lg border border-[#d4a853]/30 max-w-sm"
          style={{ backgroundColor: 'rgba(22, 16, 11, 0.86)' }}
        >
          <div className="text-xs font-medium text-[#d4a853] mb-2.5">
            Customize Apprentice Raka
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <div className="text-[11px] text-[#cbbba4] mb-1.5">Tunic Dye</div>
              <div className="flex items-center gap-2">
                {TUNIC_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    aria-label={`Select ${opt.label} tunic`}
                    onClick={() => onChangeAppearance({ ...appearance, tunic: opt.id })}
                    className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                      appearance.tunic === opt.id
                        ? 'border-[#f5e3b8] scale-110'
                        : 'border-[#5a4734] opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: opt.swatch }}
                    title={opt.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-[#cbbba4] mb-1.5">Tanjak Cloth</div>
              <div className="flex items-center gap-2">
                {TANJAK_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    aria-label={`Select ${opt.label} headcloth`}
                    onClick={() => onChangeAppearance({ ...appearance, tanjak: opt.id })}
                    className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                      appearance.tanjak === opt.id
                        ? 'border-[#f5e3b8] scale-110'
                        : 'border-[#5a4734] opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: opt.swatch }}
                    title={opt.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          data-start="true"
          onClick={onStart}
          className="px-7 py-3.5 rounded-lg bg-[#d4a853] hover:bg-[#e4ba67] text-[#1a120a] font-semibold text-base transition-colors shadow-lg cursor-pointer whitespace-nowrap"
        >
          Set Sail on the Musi
        </button>
      </div>

      {/* Bottom flat borderless control hint */}
      <div className="text-xs sm:text-sm text-[#e7d8c3]/80 tracking-wide">
        WASD / Arrows Hoist Sail &amp; Steer · Click 3D Goods to Trade · E / Tap to Interact · Enter to Start
      </div>
    </div>
  );
};
