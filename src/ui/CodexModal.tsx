import React, { useState } from 'react';
import { CODEX_ENTRIES, ZONES } from '../data/historicalData';
import { PlayerSaveState, ZoneId } from '../types/game';

interface CodexModalProps {
  initialTab: 'codex' | 'map' | 'blueprint';
  save: PlayerSaveState;
  onClose: () => void;
  onSailToZone: (zoneId: ZoneId) => void;
}

export const CodexModal: React.FC<CodexModalProps> = ({
  initialTab,
  save,
  onClose,
  onSailToZone
}) => {
  const [tab, setTab] = useState<'codex' | 'map' | 'blueprint'>(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredCodex =
    selectedCategory === 'All'
      ? CODEX_ENTRIES
      : CODEX_ENTRIES.filter((c) => c.category === selectedCategory);

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(12, 9, 6, 0.78)' }}
      role="dialog"
      aria-label="Pocket Codex, Star-Chart Map, and WebGL Architecture"
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto scroll-thin rounded-xl border border-[#d4a853]/40 p-5 sm:p-6 shadow-2xl"
        style={{ backgroundColor: '#1b140d' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#d4a853]/20">
          <div className="flex items-center gap-2">
            {[
              { id: 'codex', label: 'Pocket Codex' },
              { id: 'map', label: 'Star-Chart Map' },
              { id: 'blueprint', label: 'Three.js Blueprint' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as 'codex' | 'map' | 'blueprint')}
                className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                  tab === t.id
                    ? 'bg-[#d4a853] text-[#1a120a]'
                    : 'bg-[#261c13] text-[#cbbba4] hover:text-[#f5efe6]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-[#d4a853]/35 text-sm text-[#e6dfd4] hover:bg-[#d4a853]/15 cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* TAB 1: Plain-language Pocket Codex */}
        {tab === 'codex' && (
          <div className="pt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-[#f7efe2]">
                  Everyday Guide to 9th-Century Śrīvijaya
                </h2>
                <p className="text-xs text-[#cbbba4]">
                  Plain-language stories behind the rivers, boats, and people you meet.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {['All', 'Place', 'People', 'Craft', 'Society'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#d4a853]/25 text-[#f3c363] border border-[#d4a853]/40'
                        : 'text-[#cbbba4] hover:text-[#f5efe6]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredCodex.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-lg border border-[#d4a853]/20 bg-[#231a12] space-y-1.5"
                >
                  <div className="text-xs text-[#d4a853]">
                    {entry.category} · <span className="italic">{entry.pronunciation}</span>
                  </div>
                  <h3 className="text-base font-bold text-[#f7efe2]">{entry.term}</h3>
                  <p className="text-xs text-[#e6dfd4] font-medium">{entry.shortMeaning}</p>
                  <p className="text-xs text-[#cbbba4] leading-relaxed pt-1">
                    Did you know? {entry.didYouKnow}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Interactive Star-Chart Nusantara Map */}
        {tab === 'map' && (
          <div className="pt-5 space-y-4">
            <div>
              <h2 className="font-display text-xl font-bold text-[#f7efe2]">
                Nusantara Monsoon Star-Chart
              </h2>
              <p className="text-xs text-[#cbbba4]">
                Choose a connected harbor along the Musi River and Straits of Malacca &amp; Sunda to set sail.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {Object.values(ZONES).map((z) => {
                const isCurrent = z.id === save.currentZone;
                return (
                  <div
                    key={z.id}
                    className={`p-4 rounded-lg border flex flex-col justify-between gap-3 ${
                      isCurrent
                        ? 'border-[#d4a853] bg-[#2a1f14]'
                        : 'border-[#d4a853]/25 bg-[#221911]'
                    }`}
                  >
                    <div>
                      <div className="text-xs text-[#d4a853]">
                        Act {z.act} · Wind {z.windAngleDeg}°
                      </div>
                      <h3 className="text-lg font-bold text-[#f7efe2]">{z.name}</h3>
                      <div className="text-xs text-[#e6dfd4] mb-1.5">{z.subtitle}</div>
                      <p className="text-xs text-[#cbbba4] leading-relaxed">{z.description}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isCurrent}
                      onClick={() => {
                        onSailToZone(z.id);
                        onClose();
                      }}
                      className={`py-2 px-4 rounded-lg text-xs font-semibold ${
                        isCurrent
                          ? 'bg-[#35291d] text-[#84c99b] cursor-default'
                          : 'bg-[#d4a853] hover:bg-[#e5b864] text-[#1a120a] cursor-pointer'
                      }`}
                    >
                      {isCurrent ? 'Currently Anchored Here' : `Sail to ${z.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Developer Three.js Technical Blueprint */}
        {tab === 'blueprint' && (
          <div className="pt-5 space-y-4 text-xs text-[#dfd2be] leading-relaxed">
            <h2 className="font-display text-xl font-bold text-[#f7efe2]">
              Waters of Śrīvijaya — Three.js Technical Architecture
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-[#d4a853]/20 bg-[#221910] space-y-1.5">
                <div className="font-semibold text-[#f3c363]">01. Modular File Structure</div>
                <pre className="font-mono text-[11px] text-[#cbbba4] whitespace-pre-wrap">
{`src/
  core/     questRules.ts, audioEngine.ts
  shaders/  waterShader.ts (GLSL ripples + Fresnel + wake)
  entities/ modelBuilders.ts (3-12 part THREE.Group assets)
  scene/    WorldManager.ts (BoatController, instancing, raycaster)
  data/     historicalData.ts (4 hubs, 8 goods, 3-Act quests)
  ui/       TitleScreen, GameHud, MarketModal, CraftModal, CodexModal`}
                </pre>
              </div>
              <div className="p-4 rounded-lg border border-[#d4a853]/20 bg-[#221910] space-y-1.5">
                <div className="font-semibold text-[#f3c363]">02. Renderer, Shader &amp; Physics Specs</div>
                <ul className="list-disc pl-4 space-y-1 text-[#cbbba4]">
                  <li>ACESFilmicToneMapping + RoomEnvironment PMREM + Warm/Cool Directional/Hemisphere rig + FogExp2 horizon fade.</li>
                  <li>InstancedMesh for 44 riverbank nipa palms, 36 pooled boat wake rings, and 14 coastal birds (&lt; 60 draw calls).</li>
                  <li>Spring-damper buoyancy heave, turn roll, wind-alignment speed math, and zero-GC pre-allocated Vector3 scratch buffers.</li>
                  <li>Software-WebGL SwiftShader detection pacing frames cleanly via gl.fenceSync afterDraw().</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
