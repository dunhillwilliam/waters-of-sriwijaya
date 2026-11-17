import { useCallback, useEffect, useRef, useState } from 'react';
import { audioEngine } from './core/audioEngine';
import {
  advanceMissionState,
  createInitialSaveState,
  getShipName,
  getShipUpgradeCost,
  loadSaveState,
  persistSaveState
} from './core/questRules';
import { ZONES } from './data/historicalData';
import { WorldManager } from './scene/WorldManager';
import {
  ActiveOverlay,
  BoatTelemetry,
  CraftMiniGameType,
  GamePhase,
  InteractablePrompt,
  PlayerSaveState,
  RakaAppearance,
  ShipTier,
  ZoneId
} from './types/game';
import { CodexModal } from './ui/CodexModal';
import { CraftModal } from './ui/CraftModal';
import { DialogueModal, PauseVictoryModal } from './ui/DialoguePauseModals';
import { GameHud } from './ui/GameHud';
import { MarketModal } from './ui/MarketModal';
import { TitleScreen } from './ui/TitleScreen';

const INITIAL_TELEMETRY: BoatTelemetry = {
  speedKnots: 0,
  sailHoist: 0.45,
  windAlignment: 0.85,
  headingDeg: 0,
  windAngleDeg: 35,
  hullIntegrity: 100,
  nearInteractable: null
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<WorldManager | null>(null);

  const [save, setSave] = useState<PlayerSaveState>(() => loadSaveState());
  const [phase, setPhase] = useState<GamePhase>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return 'playing';
    }
    return 'title';
  });
  const [overlay, setOverlay] = useState<ActiveOverlay>('none');
  const [codexTab, setCodexTab] = useState<'codex' | 'map' | 'blueprint'>('codex');
  const [craftMode, setCraftMode] = useState<CraftMiniGameType>('shipbuilding');
  const [marketInitialGood, setMarketInitialGood] = useState<string | null>(null);
  const [activeNpcId, setActiveNpcId] = useState<string>('mak_sari');
  const [telemetry, setTelemetry] = useState<BoatTelemetry>(INITIAL_TELEMETRY);
  const [isMuted, setIsMuted] = useState(false);
  const [noticeText, setNoticeText] = useState<string | null>(null);

  const noticeTimerRef = useRef<number>(0);
  const saveRef = useRef(save);
  const phaseRef = useRef(phase);
  const overlayRef = useRef(overlay);
  const telemetryRef = useRef(telemetry);

  saveRef.current = save;
  phaseRef.current = phase;
  overlayRef.current = overlay;
  telemetryRef.current = telemetry;

  const showNotice = useCallback((msg: string) => {
    setNoticeText(msg);
    clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNoticeText(null), 4200);
  }, []);

  // Sync body[data-state] immediately
  useEffect(() => {
    document.body.dataset.state = phase;
    worldRef.current?.setPhase(phase);
  }, [phase]);

  // Persist save state cleanly
  useEffect(() => {
    persistSaveState(save);
    worldRef.current?.syncPlayerConfig({
      shipTier: save.shipTier,
      appearance: save.appearance,
      prosperityLevel: save.prosperityLevel,
      hullIntegrity: save.hullIntegrity,
      lanternsReleased: save.lanternsReleased
    });
  }, [save]);

  const openInteractable = useCallback((prompt: InteractablePrompt) => {
    if (prompt.kind === 'market') {
      setMarketInitialGood(null);
      setOverlay('market');
    } else if (prompt.npcId) {
      setActiveNpcId(prompt.npcId);
      setOverlay('dialogue');
    } else if (prompt.kind === 'craft' && prompt.craftType) {
      setCraftMode(prompt.craftType);
      setOverlay('craft');
    }
  }, []);

  // Mount Three.js WorldManager ONCE
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const wm = new WorldManager(mount, {
      onTelemetry: (t) => setTelemetry(t),
      onMarketGoodClicked: (goodId) => {
        setMarketInitialGood(goodId);
        setOverlay('market');
      },
      onInteractTrigger: (prompt) => openInteractable(prompt)
    });

    worldRef.current = wm;
    wm.setPhase(phaseRef.current);
    wm.loadZone(saveRef.current.currentZone, true);
    wm.syncPlayerConfig({
      shipTier: saveRef.current.shipTier,
      appearance: saveRef.current.appearance,
      prosperityLevel: saveRef.current.prosperityLevel,
      hullIntegrity: saveRef.current.hullIntegrity,
      lanternsReleased: saveRef.current.lanternsReleased
    });

    return () => {
      wm.dispose();
      worldRef.current = null;
    };
  }, [openInteractable]);

  const startGame = useCallback(() => {
    audioEngine.unlock();
    audioEngine.playGong(196);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    document.body.dataset.state = 'playing';
    setOverlay('none');
    setPhase('playing');
  }, []);

  // Global keyboard bindings (Enter/Space on title, Esc/P pause, E interact, C codex, M map)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (phaseRef.current === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          startGame();
        }
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        if (overlayRef.current !== 'none') {
          setOverlay('none');
        } else if (phaseRef.current === 'playing') {
          setPhase('paused');
        } else if (phaseRef.current === 'paused') {
          setPhase('playing');
        }
        return;
      }

      if (phaseRef.current !== 'playing') return;

      if (e.code === 'KeyE' && overlayRef.current === 'none') {
        const near = telemetryRef.current.nearInteractable;
        if (near) {
          e.preventDefault();
          openInteractable(near);
        }
      } else if (e.code === 'KeyC') {
        setCodexTab('codex');
        setOverlay((prev) => (prev === 'codex' ? 'none' : 'codex'));
      } else if (e.code === 'KeyM') {
        setCodexTab('map');
        setOverlay((prev) => (prev === 'map' ? 'none' : 'map'));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openInteractable, startGame]);

  const applyMissionProgress = useCallback(
    (
      prevState: PlayerSaveState,
      action:
        | 'trade_market'
        | 'craft_shipbuilding'
        | 'craft_prasasti'
        | 'craft_lantern'
        | 'deliver_oath_water'
    ) => {
      const res = advanceMissionState(prevState, action, prevState.currentZone);
      if (res.completedMissionTitle) {
        audioEngine.playGong(261.63);
        showNotice(`Mission Complete: ${res.completedMissionTitle}`);
      }
      if (res.allCompleted) {
        setOverlay('none');
        setPhase('gameover');
      }
      return res.nextState;
    },
    [showNotice]
  );

  const handleCompleteTrade = (params: {
    boughtGoodId: string;
    boughtQty: number;
    spentGoods: Record<string, number>;
    spentMasa: number;
  }) => {
    setSave((prev) => {
      const nextInv = { ...prev.inventory };
      nextInv[params.boughtGoodId] = (nextInv[params.boughtGoodId] ?? 0) + params.boughtQty;
      for (const [id, qty] of Object.entries(params.spentGoods)) {
        if (qty > 0) {
          nextInv[id] = Math.max(0, (nextInv[id] ?? 0) - qty);
        }
      }
      const updated: PlayerSaveState = {
        ...prev,
        masaCoins: Math.max(0, prev.masaCoins - params.spentMasa),
        inventory: nextInv
      };
      return applyMissionProgress(updated, 'trade_market');
    });
    setOverlay('none');
    showNotice('Fair trade sealed on the bronze balance scale!');
  };

  const handleUpgradeShip = () => {
    const cost = getShipUpgradeCost(save.shipTier);
    if (cost === null || save.masaCoins < cost) return;
    audioEngine.playGong(246.94);
    const nextTier = Math.min(3, save.shipTier + 1) as ShipTier;
    setSave((prev) => ({
      ...prev,
      masaCoins: prev.masaCoins - cost,
      shipTier: nextTier,
      prosperityLevel: Math.min(7, prev.prosperityLevel + 1)
    }));
    showNotice(`Vessel Upgraded: ${getShipName(nextTier)}!`);
  };

  const handleCompleteCraft = (mode: CraftMiniGameType) => {
    if (mode === 'lantern') {
      worldRef.current?.releaseLanternEffect();
    }
    const action =
      mode === 'shipbuilding'
        ? 'craft_shipbuilding'
        : mode === 'prasasti'
        ? 'craft_prasasti'
        : 'craft_lantern';

    setSave((prev) => {
      const updated: PlayerSaveState = {
        ...prev,
        lanternsReleased: mode === 'lantern' ? prev.lanternsReleased + 1 : prev.lanternsReleased
      };
      return applyMissionProgress(updated, action);
    });
    setOverlay('none');
    showNotice(
      mode === 'shipbuilding'
        ? 'Hull planks lashed securely with ijuk palm rope!'
        : mode === 'prasasti'
        ? 'Pallava oath inscribed! Received Sacred Oath-Water for Bangka Strait.'
        : 'Lotus lantern released upon the evening tide!'
    );
  };

  const handleDialogueAction = (actionType: string) => {
    if (actionType === 'market') {
      setMarketInitialGood(null);
      setOverlay('market');
    } else if (actionType === 'craft_ship') {
      setCraftMode('shipbuilding');
      setOverlay('craft');
    } else if (actionType === 'craft_prasasti') {
      setCraftMode('prasasti');
      setOverlay('craft');
    } else if (actionType === 'craft_lantern') {
      setCraftMode('lantern');
      setOverlay('craft');
    } else if (actionType === 'deliver_oath') {
      if (!save.hasOathWater && !save.completedMissionIds.includes('act2_oath')) {
        showNotice('Sail to Muaro Jambi first to receive the Sacred Oath-Water jar.');
        setOverlay('none');
        return;
      }
      setSave((prev) => applyMissionProgress(prev, 'deliver_oath_water'));
      setOverlay('none');
      showNotice('Orang Laut fleet united with Sriwijaya!');
    }
  };

  const handleSailToZone = (zoneId: ZoneId) => {
    audioEngine.playGong(174.61);
    worldRef.current?.loadZone(zoneId, true);
    setSave((prev) => ({
      ...prev,
      currentZone: zoneId
    }));
    showNotice(`Arrived at ${ZONES[zoneId].name} — ${ZONES[zoneId].subtitle}`);
  };

  const handleRestartVoyage = () => {
    const fresh = createInitialSaveState();
    setSave(fresh);
    worldRef.current?.loadZone('palembang', true);
    setOverlay('none');
    setPhase('playing');
    showNotice('Fresh voyage begun on the Musi River.');
  };

  const handleAppearanceChange = (next: RakaAppearance) => {
    setSave((prev) => ({ ...prev, appearance: next }));
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#120e0a]">
      {/* Isolated WebGL Canvas Mount */}
      <div
        ref={canvasMountRef}
        data-testid="srivijaya-canvas-container"
        className="fixed inset-0 z-0"
      />

      {/* TITLE SCREEN */}
      {phase === 'title' && (
        <TitleScreen
          appearance={save.appearance}
          onChangeAppearance={handleAppearanceChange}
          onStart={startGame}
        />
      )}

      {/* PLAYING HUD */}
      {phase === 'playing' && (
        <GameHud
          save={save}
          telemetry={telemetry}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(audioEngine.toggleMute())}
          onPause={() => setPhase('paused')}
          onOpenOverlay={(ov) => {
            if (ov === 'codex') setCodexTab('codex');
            if (ov === 'map') setCodexTab('map');
            if (ov === 'craft') setCraftMode(ZONES[save.currentZone].craftStation);
            setOverlay(ov);
          }}
          onInteract={() => {
            if (telemetry.nearInteractable) {
              openInteractable(telemetry.nearInteractable);
            }
          }}
          onSailHoistChange={(val) => worldRef.current?.setSailHoist(val)}
          onThumbStickChange={(x, y) => worldRef.current?.setThumbStick(x, y)}
        />
      )}

      {/* Non-blocking Progression Notice */}
      {noticeText && phase === 'playing' && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-lg border border-[#d4a853]/50 text-xs sm:text-sm font-medium text-[#f7efe2] shadow-lg pointer-events-none"
          style={{ backgroundColor: 'rgba(22, 16, 11, 0.92)' }}
          role="status"
        >
          {noticeText}
        </div>
      )}

      {/* OVERLAYS */}
      {overlay === 'market' && (
        <MarketModal
          save={save}
          initialGoodId={marketInitialGood}
          onClose={() => setOverlay('none')}
          onCompleteTrade={handleCompleteTrade}
          onUpgradeShip={handleUpgradeShip}
        />
      )}

      {overlay === 'craft' && (
        <CraftModal
          initialMode={craftMode}
          onClose={() => setOverlay('none')}
          onCompleteCraft={handleCompleteCraft}
        />
      )}

      {(overlay === 'codex' || overlay === 'map' || overlay === 'blueprint') && (
        <CodexModal
          initialTab={codexTab}
          save={save}
          onClose={() => setOverlay('none')}
          onSailToZone={handleSailToZone}
        />
      )}

      {overlay === 'dialogue' && (
        <DialogueModal
          npcId={activeNpcId}
          save={save}
          onClose={() => setOverlay('none')}
          onAction={handleDialogueAction}
        />
      )}

      {(phase === 'paused' || phase === 'gameover') && (
        <PauseVictoryModal
          mode={phase}
          save={save}
          onResume={() => setPhase('playing')}
          onRestart={handleRestartVoyage}
          onReturnTitle={() => {
            setOverlay('none');
            setPhase('title');
          }}
          onOpenBlueprint={() => {
            setCodexTab('blueprint');
            setPhase('playing');
            setOverlay('blueprint');
          }}
        />
      )}
    </main>
  );
}
