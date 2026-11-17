import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../core/audioEngine';
import { CraftMiniGameType } from '../types/game';

interface CraftModalProps {
  initialMode: CraftMiniGameType;
  onClose: () => void;
  onCompleteCraft: (mode: CraftMiniGameType) => void;
}

export const CraftModal: React.FC<CraftModalProps> = ({
  initialMode,
  onClose,
  onCompleteCraft
}) => {
  const [mode, setMode] = useState<CraftMiniGameType>(initialMode);

  // 1. Lashed-Lug Shipbuilding state (6 ijuk stitch points)
  const [stitchedCount, setStitchedCount] = useState(0);

  // 2. Prasasti Pallava tracing state (3 glowing glyph checkpoints)
  const [tracedNodes, setTracedNodes] = useState<number[]>([]);
  const traceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // 3. Dusk Lotus Lantern & Gamelan Rhythm state
  const [gongHits, setGongHits] = useState(0);
  const [pulsePhase, setPulsePhase] = useState(0);
  const [rhythmFeedback, setRhythmFeedback] = useState('Tap the Bronze Gong when the ring glows gold!');

  useEffect(() => {
    if (mode !== 'lantern') return;
    const id = window.setInterval(() => {
      setPulsePhase((p) => (p + 0.045) % 1);
    }, 35);
    return () => clearInterval(id);
  }, [mode]);

  const handleTracePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = traceCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 320;
    const y = ((e.clientY - rect.top) / rect.height) * 180;

    const ctx = canvas.getContext('2d');
    if (ctx && isDrawingRef.current) {
      ctx.fillStyle = '#f3c363';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    const targets = [
      { id: 0, x: 75, y: 120 },
      { id: 1, x: 160, y: 50 },
      { id: 2, x: 245, y: 120 }
    ];
    targets.forEach((t) => {
      if (Math.hypot(x - t.x, y - t.y) < 30 && !tracedNodes.includes(t.id)) {
        audioEngine.playBambooChime(t.id + 1);
        setTracedNodes((prev) => [...prev, t.id]);
      }
    });
  };

  const handleGongTap = () => {
    // Target sweet spot around pulsePhase 0.65 - 0.95 (or generous enough for casual everyday players)
    const inSweetSpot = pulsePhase >= 0.55 || pulsePhase <= 0.15;
    audioEngine.playGong(inSweetSpot ? 220 : 146);
    if (inSweetSpot) {
      const next = gongHits + 1;
      setGongHits(next);
      setRhythmFeedback(
        next >= 3
          ? 'Harmony achieved! Releasing glowing lotus lanterns onto the river.'
          : `Resonant strike (${next}/3)!`
      );
      if (next >= 3) {
        setTimeout(() => onCompleteCraft('lantern'), 450);
      }
    } else {
      setRhythmFeedback('Wait a heartbeat until the ring reaches the golden rim!');
    }
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(12, 9, 6, 0.75)' }}
      role="dialog"
      aria-label="Nusantara Craft and Cultural Workshop"
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-[#d4a853]/40 p-5 sm:p-6 shadow-2xl"
        style={{ backgroundColor: '#1b140d' }}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#d4a853]/20">
          <div>
            <div className="text-xs text-[#d4a853] font-medium">
              Hands-On Nusantara Craft
            </div>
            <h2 className="font-display text-2xl font-bold text-[#f7efe2]">
              {mode === 'shipbuilding'
                ? 'Lashed-Lug Shipbuilding (Ijuk)'
                : mode === 'prasasti'
                ? 'Prasasti & Lontar Script Tracing'
                : 'Dusk Lotus Lantern & Gamelan Gong'}
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

        {/* Mode Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-4 pb-5">
          {[
            { id: 'shipbuilding', label: 'Lashed-Lug Hull' },
            { id: 'prasasti', label: 'Prasasti Tracing' },
            { id: 'lantern', label: 'Lantern & Gong' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id as CraftMiniGameType)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                mode === tab.id
                  ? 'bg-[#d4a853] text-[#1a120a]'
                  : 'bg-[#261c13] text-[#cbbba4] hover:text-[#f5efe6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* MINI-GAME 1: Lashed-Lug Shipbuilding */}
        {mode === 'shipbuilding' && (
          <div className="space-y-4">
            <p className="text-sm text-[#dfd2be]">
              Nusantara shipbuilders sewed wooden planks together using black sugar-palm fiber (<em>ijuk</em>) instead of iron nails so boats flexed over ocean swells. Click each glowing lug eyelet in sequence to lash the hull!
            </p>
            <div className="p-4 rounded-lg border border-[#d4a853]/25 bg-[#140e09]">
              <svg viewBox="0 0 360 140" className="w-full h-36">
                {/* Upper & lower hull planks */}
                <rect x="20" y="25" width="320" height="36" rx="4" fill="#6e472b" stroke="#4a2e1a" strokeWidth="2" />
                <rect x="20" y="75" width="320" height="36" rx="4" fill="#5e3b22" stroke="#4a2e1a" strokeWidth="2" />
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const cx = 52 + i * 52;
                  const done = i < stitchedCount;
                  const next = i === stitchedCount;
                  return (
                    <g key={i}>
                      {done && (
                        <path
                          d={`M${cx - 8} 48 L${cx + 8} 88 M${cx + 8} 48 L${cx - 8} 88`}
                          stroke="#1f1812"
                          strokeWidth="5"
                          strokeLinecap="round"
                        />
                      )}
                      <circle
                        cx={cx}
                        cy={68}
                        r={15}
                        fill={done ? '#84c99b' : next ? '#d4a853' : '#2a2016'}
                        stroke="#f3c363"
                        strokeWidth={next ? 2.5 : 1}
                        className="cursor-pointer"
                        onClick={() => {
                          if (i === stitchedCount) {
                            audioEngine.playRopeSnap();
                            const nextCount = stitchedCount + 1;
                            setStitchedCount(nextCount);
                            if (nextCount >= 6) {
                              setTimeout(() => onCompleteCraft('shipbuilding'), 350);
                            }
                          }
                        }}
                      />
                      <text
                        x={cx}
                        y={72}
                        textAnchor="middle"
                        fill={done || next ? '#18110b' : '#cbbba4'}
                        fontSize="11"
                        fontWeight="700"
                        pointerEvents="none"
                      >
                        {done ? '✓' : i + 1}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className="flex items-center justify-between text-xs text-[#cbbba4] mt-2">
                <span>Lashed Lugs: {stitchedCount} / 6</span>
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playRopeSnap();
                    onCompleteCraft('shipbuilding');
                  }}
                  className="text-[#d4a853] underline cursor-pointer"
                >
                  Complete Lashing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MINI-GAME 2: Prasasti & Lontar Tracing */}
        {mode === 'prasasti' && (
          <div className="space-y-4">
            <p className="text-sm text-[#dfd2be]">
              Drag your pointer or finger across the 3 golden Pallava script anchors on this Kedukan-style stone tablet to incise an Old Malay blessing.
            </p>
            <div className="relative rounded-lg border border-[#d4a853]/30 bg-[#3a352f] overflow-hidden flex flex-col items-center p-3">
              <canvas
                ref={traceCanvasRef}
                width={320}
                height={180}
                onPointerDown={(e) => {
                  isDrawingRef.current = true;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  handleTracePointer(e);
                }}
                onPointerMove={handleTracePointer}
                onPointerUp={() => {
                  isDrawingRef.current = false;
                }}
                className="w-full max-w-[320px] h-[180px] rounded bg-[#4a443d] cursor-crosshair touch-none"
              />
              <svg
                viewBox="0 0 320 180"
                className="pointer-events-none absolute top-3 w-full max-w-[320px] h-[180px]"
              >
                <path
                  d="M75 120 Q115 35 160 50 T245 120"
                  fill="none"
                  stroke="#d4a853"
                  strokeDasharray="6 5"
                  strokeWidth="3"
                  opacity="0.65"
                />
                {[
                  { id: 0, x: 75, y: 120 },
                  { id: 1, x: 160, y: 50 },
                  { id: 2, x: 245, y: 120 }
                ].map((pt) => (
                  <circle
                    key={pt.id}
                    cx={pt.x}
                    cy={pt.y}
                    r="11"
                    fill={tracedNodes.includes(pt.id) ? '#84c99b' : '#f3c363'}
                  />
                ))}
              </svg>
            </div>
            <div className="flex items-center justify-between text-xs text-[#cbbba4]">
              <span>Incised Anchors: {tracedNodes.length} / 3</span>
              <button
                type="button"
                disabled={tracedNodes.length < 3}
                onClick={() => onCompleteCraft('prasasti')}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  tracedNodes.length >= 3
                    ? 'bg-[#d4a853] text-[#1a120a] cursor-pointer'
                    : 'bg-[#2a2016] text-[#857561] cursor-not-allowed'
                }`}
              >
                Inscribe Tablet
              </button>
            </div>
          </div>
        )}

        {/* MINI-GAME 3: Dusk Lotus Lantern & Gamelan Gong Rhythm */}
        {mode === 'lantern' && (
          <div className="space-y-4">
            <p className="text-sm text-[#dfd2be]">
              Strike the bronze gong 3 times as the golden pulse ring reaches the outer rim to release glowing lotus lanterns onto the Musi &amp; Sunda waters!
            </p>
            <div className="p-5 rounded-lg border border-[#d4a853]/25 bg-[#140e09] flex flex-col items-center gap-4">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full border-2 border-[#d4a853]/50"
                  style={{ transform: `scale(${0.45 + pulsePhase * 0.6})` }}
                />
                <button
                  type="button"
                  onClick={handleGongTap}
                  className="w-24 h-24 rounded-full bg-[#c99235] hover:bg-[#dfa747] border-4 border-[#f6d388] text-[#1a120a] font-bold text-sm shadow-xl cursor-pointer transition-transform active:scale-95"
                >
                  Strike Gong
                </button>
              </div>
              <div className="text-xs text-[#f3c363] text-center">{rhythmFeedback}</div>
              <div className="text-xs text-[#cbbba4]">
                Resonant Beats: <span className="font-mono-num font-semibold text-[#f5efe6]">{gongHits} / 3</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
