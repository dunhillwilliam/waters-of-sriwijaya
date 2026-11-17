import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { audioEngine } from '../core/audioEngine';
import { computeBoatSpeed, computeWindAlignment } from '../core/questRules';
import { TRADE_GOODS, ZONES } from '../data/historicalData';
import {
  buildBrickStupa,
  buildMarketRaft,
  buildNpcCharacter,
  buildPlayerBoat,
  buildPrasastiStele,
  buildRumahRakit,
  buildWatchtower,
  BuiltBoatRig,
  createBrickTexture,
  createWoodTexture,
  createWovenSailTexture
} from '../entities/modelBuilders';
import { createWaterShaderMaterial, WaterUniforms } from '../shaders/waterShader';
import {
  BoatTelemetry,
  GamePhase,
  InteractablePrompt,
  RakaAppearance,
  ShipTier,
  ZoneId
} from '../types/game';

interface TriggerZone {
  id: string;
  x: number;
  z: number;
  radius: number;
  prompt: InteractablePrompt;
}

export interface WorldCallbacks {
  onTelemetry: (telemetry: BoatTelemetry) => void;
  onMarketGoodClicked: (goodId: string) => void;
  onInteractTrigger: (prompt: InteractablePrompt) => void;
}

const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _camLook = new THREE.Vector3();
const _dummy = new THREE.Object3D();

export class WorldManager {
  private container: HTMLElement;
  private callbacks: WorldCallbacks;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private lastTickMs = performance.now();
  private elapsedSeconds = 0;
  private frameId = 0;
  private disposed = false;

  // Lighting & Atmosphere
  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private waterUniforms!: WaterUniforms;
  private waterMesh!: THREE.Mesh;

  // Textures (disposed on cleanup)
  private textures: THREE.Texture[] = [];
  private woodTex!: THREE.Texture;
  private sailTex!: THREE.Texture;
  private brickTex!: THREE.Texture;

  // Dynamic Scene Groups
  private zoneGroup = new THREE.Group();
  private playerRig!: BuiltBoatRig;
  private boatPos = new THREE.Vector3(0, 0, 14);
  private boatHeadingRad = 0; // 0 = facing -Z
  private boatSpeed = 0;
  private sailHoist = 0.45;
  private boatRoll = 0;
  private boatPitch = 0;
  private boatHeave = 0;
  private boatHeaveVel = 0;

  // Pooled Wake & Lantern Particles
  private wakeInstanced!: THREE.InstancedMesh;
  private wakeCount = 36;
  private wakeData: Array<{ x: number; y: number; z: number; age: number; maxAge: number }> = [];
  private wakeCursor = 0;
  private wakeTimer = 0;

  // Zone & State
  private gamePhase: GamePhase = 'title';
  private currentZone: ZoneId = 'palembang';
  private shipTier: ShipTier = 1;
  private appearance: RakaAppearance = { tunic: 'indigo', tanjak: 'gold' };
  private prosperityLevel = 1;
  private hullIntegrity = 100;
  private lanternsReleased = 0;

  // Triggers & Raycasting
  private triggers: TriggerZone[] = [];
  private raycaster = new THREE.Raycaster();
  private pointerNdc = new THREE.Vector2();
  private marketClickables: THREE.Object3D[] = [];
  private floatingLanterns: THREE.Group[] = [];
  private coastalBirds: THREE.InstancedMesh | null = null;
  private birdSeeds: Array<{ angle: number; radius: number; height: number; speed: number }> = [];

  // Input state
  private keys = new Set<string>();
  private thumbStick = { x: 0, y: 0 };
  private lastTelemetryTime = 0;
  private resizeObserver: ResizeObserver;

  constructor(container: HTMLElement, callbacks: WorldCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance'
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      52,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.5,
      260
    );

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.woodTex = createWoodTexture('#6e472b', '#472a16', maxAniso);
    this.sailTex = createWovenSailTexture(maxAniso);
    this.brickTex = createBrickTexture(maxAniso);
    this.textures.push(this.woodTex, this.sailTex, this.brickTex);

    this.setupLightingAndWater();
    this.setupWakePool();
    this.scene.add(this.zoneGroup);

    this.rebuildPlayerBoat();
    this.loadZone('palembang', true);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);

    this.tick();
  }

  private setupLightingAndWater(): void {
    this.hemiLight = new THREE.HemisphereLight(0xffddb0, 0x2c4b47, 0.85);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffcf87, 2.2);
    this.sunLight.position.set(34, 24, -46);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 140;
    const d = 48;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    const { material, uniforms } = createWaterShaderMaterial();
    this.waterUniforms = uniforms;
    const waterGeo = new THREE.PlaneGeometry(240, 240, 72, 72);
    waterGeo.rotateX(-Math.PI / 2);
    this.waterMesh = new THREE.Mesh(waterGeo, material);
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);
  }

  private setupWakePool(): void {
    const geo = new THREE.CircleGeometry(0.24, 8);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xf7f1e6,
      transparent: true,
      opacity: 0.16,
      depthWrite: false
    });
    this.wakeInstanced = new THREE.InstancedMesh(geo, mat, this.wakeCount);
    this.wakeInstanced.frustumCulled = false;
    for (let i = 0; i < this.wakeCount; i++) {
      this.wakeData.push({ x: 0, y: -10, z: 0, age: 99, maxAge: 1.4 });
      _dummy.position.set(0, -10, 0);
      _dummy.scale.setScalar(0.01);
      _dummy.updateMatrix();
      this.wakeInstanced.setMatrixAt(i, _dummy.matrix);
    }
    this.wakeInstanced.instanceMatrix.needsUpdate = true;
    this.scene.add(this.wakeInstanced);
  }

  private rebuildPlayerBoat(): void {
    if (this.playerRig) {
      this.scene.remove(this.playerRig.group);
    }
    this.playerRig = buildPlayerBoat(this.shipTier, this.appearance, this.woodTex, this.sailTex);
    this.playerRig.group.position.copy(this.boatPos);
    this.playerRig.group.rotation.y = this.boatHeadingRad;
    this.scene.add(this.playerRig.group);
  }

  public syncPlayerConfig(params: {
    shipTier: ShipTier;
    appearance: RakaAppearance;
    prosperityLevel: number;
    hullIntegrity: number;
    lanternsReleased: number;
  }): void {
    const needBoatRebuild =
      params.shipTier !== this.shipTier ||
      params.appearance.tunic !== this.appearance.tunic ||
      params.appearance.tanjak !== this.appearance.tanjak;
    const needProsperityRefresh = params.prosperityLevel !== this.prosperityLevel;

    this.shipTier = params.shipTier;
    this.appearance = { ...params.appearance };
    this.prosperityLevel = params.prosperityLevel;
    this.hullIntegrity = params.hullIntegrity;
    this.lanternsReleased = params.lanternsReleased;

    if (needBoatRebuild) {
      this.rebuildPlayerBoat();
    }
    if (needProsperityRefresh) {
      this.loadZone(this.currentZone, false);
    }
  }

  public setPhase(phase: GamePhase): void {
    this.gamePhase = phase;
    if (phase === 'playing') {
      this.keys.clear();
    }
  }

  public setSailHoist(val: number): void {
    this.sailHoist = THREE.MathUtils.clamp(val, 0, 1);
  }

  public setThumbStick(x: number, y: number): void {
    this.thumbStick.x = THREE.MathUtils.clamp(x, -1, 1);
    this.thumbStick.y = THREE.MathUtils.clamp(y, -1, 1);
  }

  public releaseLanternEffect(): void {
    this.lanternsReleased += 1;
    const lanternGroup = this.createFloatingLanternMesh();
    lanternGroup.position.set(
      this.boatPos.x + (Math.random() - 0.5) * 4,
      0.16,
      this.boatPos.z - 2.5
    );
    this.zoneGroup.add(lanternGroup);
    this.floatingLanterns.push(lanternGroup);
    audioEngine.playBambooChime(this.lanternsReleased);
  }

  private createFloatingLanternMesh(): THREE.Group {
    const g = new THREE.Group();
    const petalMat = new THREE.MeshStandardMaterial({ color: 0xf4a5b8, roughness: 0.65 });
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0xffdf80,
      emissive: 0xff9d2e,
      emissiveIntensity: 2.0
    });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.22, 0.14, 8), petalMat);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), glowMat);
    core.position.y = 0.14;
    g.add(base, core);
    return g;
  }

  public loadZone(zoneId: ZoneId, resetBoat = true): void {
    this.currentZone = zoneId;
    const zone = ZONES[zoneId];

    // Clear old zone meshes cleanly
    while (this.zoneGroup.children.length > 0) {
      this.zoneGroup.remove(this.zoneGroup.children[0]);
    }
    this.triggers = [];
    this.marketClickables = [];
    this.floatingLanterns = [];
    this.coastalBirds = null;
    this.birdSeeds = [];

    // Update sky, fog, directional light, and water shader uniforms
    const bgCol = new THREE.Color(zone.skyHorizonHex);
    this.scene.background = bgCol;
    this.scene.fog = new THREE.FogExp2(zone.fogHex, 0.0072);

    this.waterUniforms.uShallowColor.value.setHex(zone.waterShallowHex);
    this.waterUniforms.uDeepColor.value.setHex(zone.waterDeepHex);
    this.waterUniforms.uSkyHorizonColor.value.setHex(zone.skyHorizonHex);
    this.waterUniforms.uFogColor.value.setHex(zone.fogHex);

    const elevRad = THREE.MathUtils.degToRad(zone.sunElevationDeg);
    const sunDir = new THREE.Vector3(
      Math.cos(elevRad) * 0.65,
      Math.sin(elevRad),
      -Math.cos(elevRad) * 0.76
    ).normalize();
    this.sunLight.position.copy(sunDir).multiplyScalar(75);
    this.waterUniforms.uSunDir.value.copy(sunDir);

    // 1. Natural riverbanks / coastal landmasses & instanced Nipa Palms / Mangroves
    this.buildShorelinesAndFoliage(zoneId);

    // 2. Zone-specific Nusantara historical landmarks & interactive stations
    const zoneGoods = TRADE_GOODS.filter((g) => zone.marketGoods.includes(g.id));

    // Floating Market Raft (present in every hub so player can always trade)
    const marketRaft = buildMarketRaft(this.woodTex, zoneGoods, this.marketClickables);
    marketRaft.position.set(-10.5, 0, -4);
    marketRaft.rotation.y = 0.28;
    this.zoneGroup.add(marketRaft);
    this.triggers.push({
      id: `${zoneId}_market`,
      x: -10.5,
      z: -4,
      radius: 7.5,
      prompt: {
        id: `${zoneId}_market`,
        kind: 'market',
        label: 'Floating Market Raft',
        sublabel: 'Click 3D goods or press E to Weigh & Barter',
        zoneId
      }
    });

    if (zoneId === 'palembang') {
      // Rumah Rakit neighborhood along both banks
      const rakitOffsets = [
        [-22, 12, 0.15, 0xa9422b],
        [-24, -18, -0.1, 0x2f5e6e],
        [20, -6, -0.25, 0xc7892b],
        [23, 18, 0.12, 0x8d3228],
        [-19, -34, 0.2, 0x3b6e52]
      ] as const;
      rakitOffsets.forEach(([x, z, rot, col]) => {
        const rakit = buildRumahRakit(this.woodTex, col);
        rakit.position.set(x, 0, z);
        rakit.rotation.y = rot;
        this.zoneGroup.add(rakit);
      });

      // Mak Sari near Floating Market
      const makSari = buildNpcCharacter(0x9b3634, 0xe8d5b2, 'trader');
      makSari.position.set(-12.2, 0.32, -3.5);
      this.zoneGroup.add(makSari);
      this.triggers.push({
        id: 'npc_mak_sari',
        x: -12.2,
        z: -3.5,
        radius: 6.5,
        prompt: {
          id: 'npc_mak_sari',
          kind: 'npc',
          label: 'Talk to Mak Sari',
          sublabel: 'Floating Market Elder',
          zoneId,
          npcId: 'mak_sari'
        }
      });

      // Pak Bima's Timber Shipyard Pier on East Bank
      const shipyardPier = new THREE.Mesh(
        new THREE.BoxGeometry(9, 0.45, 7),
        new THREE.MeshStandardMaterial({ color: 0xffffff, map: this.woodTex, roughness: 0.8 })
      );
      shipyardPier.position.set(16, 0.22, -20);
      shipyardPier.receiveShadow = true;
      this.zoneGroup.add(shipyardPier);

      const pakBima = buildNpcCharacter(0x2a4569, 0xd4a853, 'captain');
      pakBima.position.set(13.8, 0.45, -18.5);
      this.zoneGroup.add(pakBima);

      // Distant Bukit Siguntang lush terraced hill + brick stupa landmark on horizon
      const hill = new THREE.Mesh(
        new THREE.ConeGeometry(28, 13, 14),
        new THREE.MeshStandardMaterial({ color: 0x35502f, roughness: 0.94 })
      );
      hill.position.set(0, 4.5, -72);
      const stupa = buildBrickStupa(this.brickTex);
      stupa.position.set(0, 7.6, -72);
      this.zoneGroup.add(hill, stupa);

      this.triggers.push({
        id: 'craft_palembang_shipyard',
        x: 14,
        z: -19,
        radius: 8,
        prompt: {
          id: 'craft_palembang_shipyard',
          kind: 'craft',
          label: 'Shipyard & Pak Bima',
          sublabel: 'Lash ijuk hull planks or speak with Pak Bima',
          zoneId,
          craftType: 'shipbuilding',
          npcId: 'pak_bima'
        }
      });
    } else if (zoneId === 'muaro_jambi') {
      // Brick Candi Temple Complex + Prasasti Stele + Bhiksu Dharmapala
      const plaza = new THREE.Mesh(
        new THREE.BoxGeometry(24, 1.2, 22),
        new THREE.MeshStandardMaterial({ color: 0xffffff, map: this.brickTex, roughness: 0.88 })
      );
      plaza.position.set(18, 0.4, -18);
      plaza.receiveShadow = true;
      this.zoneGroup.add(plaza);

      const stupa = buildBrickStupa(this.brickTex);
      stupa.position.set(22, 1.0, -22);
      this.zoneGroup.add(stupa);

      const stele = buildPrasastiStele();
      stele.position.set(12.5, 1.0, -14);
      stele.rotation.y = -0.6;
      this.zoneGroup.add(stele);

      const monk = buildNpcCharacter(0xd47d2a, 0xe8b93c, 'monk');
      monk.position.set(10.5, 1.0, -13);
      this.zoneGroup.add(monk);

      this.triggers.push({
        id: 'craft_muaro_prasasti',
        x: 11.5,
        z: -13.5,
        radius: 8.5,
        prompt: {
          id: 'craft_muaro_prasasti',
          kind: 'craft',
          label: 'Vihara & Prasasti Stele',
          sublabel: 'Speak with Bhiksu Dharmapala or trace Pallava script',
          zoneId,
          craftType: 'prasasti',
          npcId: 'dharmapala'
        }
      });
    } else if (zoneId === 'bangka_strait') {
      // Coastal Tin Pier & Watchtower + Panglima Tuah
      const pier = new THREE.Mesh(
        new THREE.BoxGeometry(11, 0.5, 9),
        new THREE.MeshStandardMaterial({ color: 0xffffff, map: this.woodTex, roughness: 0.82 })
      );
      pier.position.set(15, 0.25, -16);
      this.zoneGroup.add(pier);

      const tower = buildWatchtower(this.woodTex, false);
      tower.position.set(18, 0.45, -18);
      this.zoneGroup.add(tower);

      const captain = buildNpcCharacter(0x1f3a4d, 0xd4a853, 'captain');
      captain.position.set(11.8, 0.5, -14.2);
      this.zoneGroup.add(captain);

      this.triggers.push({
        id: 'npc_panglima_tuah',
        x: 12.5,
        z: -14.8,
        radius: 8,
        prompt: {
          id: 'npc_panglima_tuah',
          kind: 'npc',
          label: 'Panglima Tuah (Orang Laut)',
          sublabel: 'Present Sacred Oath-Water or repair/lash vessel',
          zoneId,
          npcId: 'panglima_tuah',
          craftType: 'shipbuilding'
        }
      });
    } else if (zoneId === 'sunda_strait') {
      // Dusk Lighthouse Beacon & Datu Ratna Lantern Altar
      const pier = new THREE.Mesh(
        new THREE.BoxGeometry(12, 0.5, 10),
        new THREE.MeshStandardMaterial({ color: 0xffffff, map: this.woodTex, roughness: 0.8 })
      );
      pier.position.set(14, 0.25, -17);
      this.zoneGroup.add(pier);

      const lighthouse = buildWatchtower(this.woodTex, true);
      lighthouse.position.set(17, 0.45, -20);
      this.zoneGroup.add(lighthouse);

      const envoy = buildNpcCharacter(0x7c2938, 0xe8c468, 'captain');
      envoy.position.set(11.2, 0.5, -14.5);
      this.zoneGroup.add(envoy);

      this.triggers.push({
        id: 'craft_sunda_lantern',
        x: 12,
        z: -15,
        radius: 8.5,
        prompt: {
          id: 'craft_sunda_lantern',
          kind: 'craft',
          label: 'Datu Ratna & Lantern Altar',
          sublabel: 'Strike bronze gongs & release river lotus lanterns',
          zoneId,
          craftType: 'lantern',
          npcId: 'datu_ratna'
        }
      });
    }

    // 3. Prosperity-driven floating lanterns & coastal birds
    const lanternTotal = 6 + this.prosperityLevel * 3;
    for (let i = 0; i < lanternTotal; i++) {
      const l = this.createFloatingLanternMesh();
      l.position.set((Math.sin(i * 2.1) * 18), 0.12, -45 + i * 7.5);
      this.zoneGroup.add(l);
      this.floatingLanterns.push(l);
    }

    this.buildCoastalBirds();

    if (resetBoat) {
      this.boatPos.set(0, 0, 16);
      this.boatHeadingRad = 0;
      this.boatSpeed = 0;
    }
  }

  private buildShorelinesAndFoliage(zoneId: ZoneId): void {
    const bankSpan = zoneId === 'bangka_strait' || zoneId === 'sunda_strait' ? 54 : 38;
    const bankMat = new THREE.MeshStandardMaterial({ color: 0x3f5433, roughness: 0.94 });

    // Left and right natural sloped vegetated banks extending into horizon fog
    [-1, 1].forEach((side) => {
      const bankGeo = new THREE.CylinderGeometry(56, 62, 3.2, 6);
      bankGeo.scale(0.55, 1, 3.8);
      const bank = new THREE.Mesh(bankGeo, bankMat);
      bank.position.set(side * (bankSpan + 28), -0.65, -10);
      bank.receiveShadow = true;
      this.zoneGroup.add(bank);
    });

    // Instanced Nipa Palms & Mangroves along both banks (multi-frond clustered crown in 1 draw call!)
    const palmCount = 52;
    const trunkGeo = new THREE.CylinderGeometry(0.11, 0.24, 4.2, 6);
    trunkGeo.translate(0, 2.1, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c422c, roughness: 0.9 });
    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, palmCount);

    const frondGeos: THREE.BufferGeometry[] = [];
    for (let f = 0; f < 5; f++) {
      const ang = (f / 5) * Math.PI * 2;
      const frond = new THREE.ConeGeometry(0.58, 2.5, 4);
      frond.rotateX(Math.PI * 0.4);
      frond.translate(0, 4.25, 1.05);
      frond.rotateY(ang);
      frondGeos.push(frond);
    }
    const topCrown = new THREE.DodecahedronGeometry(0.62, 0);
    topCrown.translate(0, 4.45, 0);
    frondGeos.push(topCrown);

    const normalizedFronds = frondGeos.map((g) => (g.index ? g.toNonIndexed() : g));
    const canopyGeo = mergeGeometries(normalizedFronds) ?? new THREE.ConeGeometry(1.8, 1.4, 6);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82 });
    const canopyInst = new THREE.InstancedMesh(canopyGeo, canopyMat, palmCount);

    const tintColor = new THREE.Color();
    for (let i = 0; i < palmCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const z = -90 + (i / palmCount) * 170;
      const x = side * (bankSpan + 1.5 + ((i * 17) % 15));
      const scale = 0.85 + ((i * 31) % 32) / 100;

      _dummy.position.set(x, 0.35, z);
      _dummy.rotation.set(((i % 5) - 2) * 0.05, (i * 1.1) % Math.PI, ((i % 3) - 1) * 0.06);
      _dummy.scale.setScalar(scale);
      _dummy.updateMatrix();
      trunkInst.setMatrixAt(i, _dummy.matrix);
      canopyInst.setMatrixAt(i, _dummy.matrix);

      tintColor.setHSL(0.28 + ((i % 7) - 3) * 0.012, 0.48, 0.24 + ((i % 4) * 0.03));
      canopyInst.setColorAt(i, tintColor);
    }
    trunkInst.instanceMatrix.needsUpdate = true;
    canopyInst.instanceMatrix.needsUpdate = true;
    if (canopyInst.instanceColor) canopyInst.instanceColor.needsUpdate = true;
    trunkInst.computeBoundingSphere();
    canopyInst.computeBoundingSphere();
    this.zoneGroup.add(trunkInst, canopyInst);
  }

  private buildCoastalBirds(): void {
    const birdCount = 14;
    const wingGeo = new THREE.BoxGeometry(0.68, 0.05, 0.22);
    const birdMat = new THREE.MeshStandardMaterial({ color: 0xf7f2e7, roughness: 0.65 });
    const inst = new THREE.InstancedMesh(wingGeo, birdMat, birdCount);
    inst.frustumCulled = false;

    for (let i = 0; i < birdCount; i++) {
      this.birdSeeds.push({
        angle: (i / birdCount) * Math.PI * 2,
        radius: 14 + (i % 4) * 7,
        height: 11 + (i % 5) * 2.2,
        speed: 0.24 + (i % 3) * 0.06
      });
    }
    this.coastalBirds = inst;
    this.zoneGroup.add(inst);
  }

  private bindEvents(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLost);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private onBlur = (): void => {
    this.keys.clear();
  };

  private onVisibilityChange = (): void => {
    if (document.hidden) {
      this.keys.clear();
    }
  };

  private onContextLost = (e: Event): void => {
    e.preventDefault();
  };

  private updatePointerNdc(e: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onPointerMove = (e: PointerEvent): void => {
    if (this.gamePhase !== 'playing') return;
    this.updatePointerNdc(e);
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.marketClickables, false);
    this.renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'default';
  };

  private onPointerDown = (e: PointerEvent): void => {
    if (this.gamePhase !== 'playing') return;
    this.updatePointerNdc(e);
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.marketClickables, false);
    if (hits.length > 0) {
      const goodId = hits[0].object.userData?.goodId;
      if (typeof goodId === 'string') {
        audioEngine.playBambooChime(2);
        this.callbacks.onMarketGoodClicked(goodId);
      }
    }
  };

  private handleResize(): void {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    if (w <= 0 || h <= 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private tick = (): void => {
    if (this.disposed) return;

    const nowMs = performance.now();
    const rawDt = Math.max(0.001, (nowMs - this.lastTickMs) / 1000);
    this.lastTickMs = nowMs;
    const dt = Math.min(rawDt, 0.05);
    this.elapsedSeconds += dt;
    const elapsed = this.elapsedSeconds;

    this.waterUniforms.uTime.value = elapsed;

    if (this.gamePhase === 'playing') {
      this.updateBoatPhysics(dt, elapsed);
      this.updateCameraPlaying(dt);
    } else if (this.gamePhase === 'title') {
      this.updateCameraTitle(elapsed);
      this.updateBoatIdleBuoyancy(dt, elapsed);
    }

    this.updateEnvironmentAnimations(dt, elapsed);
    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || !gl.fenceSync) {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private updateBoatIdleBuoyancy(dt: number, elapsed: number): void {
    const waveY = Math.sin(this.boatPos.x * 0.18 + elapsed * 1.15) * 0.08;
    const springForce = (waveY - this.boatHeave) * 14 - this.boatHeaveVel * 4.5;
    this.boatHeaveVel += springForce * dt;
    this.boatHeave += this.boatHeaveVel * dt;

    this.playerRig.group.position.set(this.boatPos.x, this.boatHeave, this.boatPos.z);
    this.playerRig.group.rotation.z = Math.sin(elapsed * 1.3) * 0.03;
    this.playerRig.group.rotation.x = Math.cos(elapsed * 1.1) * 0.025;
    this.updateWindVane(elapsed);
  }

  private updateWindVane(elapsed: number): void {
    const zone = ZONES[this.currentZone];
    const windWorldRad = THREE.MathUtils.degToRad(zone.windAngleDeg);
    const relWind = windWorldRad - this.boatHeadingRad;
    this.playerRig.windVaneGroup.rotation.y = relWind + Math.sin(elapsed * 7.5) * 0.12;
  }

  private updateBoatPhysics(dt: number, elapsed: number): void {
    // 1. Input reading (WASD / Arrow keys + mobile thumbstick)
    let steerInput = -this.thumbStick.x;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) steerInput += 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) steerInput -= 1;

    let throttleInput = this.thumbStick.y;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) throttleInput += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) throttleInput -= 1;

    if (throttleInput !== 0) {
      this.sailHoist = THREE.MathUtils.clamp(this.sailHoist + throttleInput * dt * 0.65, 0, 1);
    }

    const turnRate = (this.shipTier === 1 ? 1.55 : 1.32) * (0.45 + 0.55 * Math.min(1, this.boatSpeed / 6 + 0.3));
    this.boatHeadingRad += steerInput * turnRate * dt;

    const zone = ZONES[this.currentZone];
    const headingDeg = ((THREE.MathUtils.radToDeg(this.boatHeadingRad) % 360) + 360) % 360;
    const windAlignment = computeWindAlignment(headingDeg, zone.windAngleDeg);
    const targetSpeed = computeBoatSpeed({
      sailHoist: this.sailHoist,
      windAlignment,
      windStrength: zone.windStrength,
      shipTier: this.shipTier
    });

    this.boatSpeed = THREE.MathUtils.damp(this.boatSpeed, targetSpeed, 2.8, dt);

    // Move along forward vector (-sin(heading), -cos(heading))
    const fwdX = -Math.sin(this.boatHeadingRad);
    const fwdZ = -Math.cos(this.boatHeadingRad);

    this.boatPos.x += fwdX * this.boatSpeed * dt;
    this.boatPos.z += fwdZ * this.boatSpeed * dt;

    // Keep within natural river / strait channel bounds
    const maxChannelX = this.currentZone === 'bangka_strait' || this.currentZone === 'sunda_strait' ? 46 : 30;
    this.boatPos.x = THREE.MathUtils.clamp(this.boatPos.x, -maxChannelX, maxChannelX);
    this.boatPos.z = THREE.MathUtils.clamp(this.boatPos.z, -65, 42);

    // Buoyancy spring-damper + turn roll + pitch
    const waveY =
      Math.sin(this.boatPos.x * 0.18 + elapsed * 1.15) *
      Math.cos(this.boatPos.z * 0.14 + elapsed * 0.9) *
      0.12;
    const springForce = (waveY - this.boatHeave) * 16 - this.boatHeaveVel * 4.8;
    this.boatHeaveVel += springForce * dt;
    this.boatHeave += this.boatHeaveVel * dt;

    this.boatRoll = THREE.MathUtils.damp(this.boatRoll, -steerInput * 0.14, 5.5, dt);
    this.boatPitch = THREE.MathUtils.damp(this.boatPitch, -this.boatSpeed * 0.008, 4.5, dt);

    this.playerRig.group.position.set(this.boatPos.x, this.boatHeave, this.boatPos.z);
    this.playerRig.group.rotation.set(this.boatPitch, this.boatHeadingRad, this.boatRoll);

    // Animate sail hoist scale
    const sailScaleY = 0.22 + this.sailHoist * 0.78;
    this.playerRig.sailMesh.scale.set(1, sailScaleY, 1);
    this.updateWindVane(elapsed);

    // Update water shader boat wake uniforms
    this.waterUniforms.uBoatPos.value.copy(this.boatPos);
    this.waterUniforms.uBoatSpeed.value = this.boatSpeed;

    // Emit pooled wake rings
    this.wakeTimer += dt * (0.4 + this.boatSpeed * 0.25);
    if (this.boatSpeed > 1.2 && this.wakeTimer >= 0.22) {
      this.wakeTimer = 0;
      const slot = this.wakeData[this.wakeCursor];
      slot.x = this.boatPos.x - fwdX * 1.8;
      slot.y = 0.05;
      slot.z = this.boatPos.z - fwdZ * 1.8;
      slot.age = 0;
      this.wakeCursor = (this.wakeCursor + 1) % this.wakeCount;
    }

    // Proximity trigger check
    let nearestPrompt: InteractablePrompt | null = null;
    let bestDist = Infinity;
    for (const trig of this.triggers) {
      const dist = Math.hypot(this.boatPos.x - trig.x, this.boatPos.z - trig.z);
      if (dist <= trig.radius && dist < bestDist) {
        bestDist = dist;
        nearestPrompt = trig.prompt;
      }
    }

    // Throttle React telemetry to ~10Hz
    if (elapsed - this.lastTelemetryTime > 0.1) {
      this.lastTelemetryTime = elapsed;
      this.callbacks.onTelemetry({
        speedKnots: Math.round(this.boatSpeed * 1.2),
        sailHoist: this.sailHoist,
        windAlignment,
        headingDeg: Math.round(headingDeg),
        windAngleDeg: zone.windAngleDeg,
        hullIntegrity: this.hullIntegrity,
        nearInteractable: nearestPrompt
      });
    }
  }

  private updateCameraPlaying(dt: number): void {
    const fwdX = -Math.sin(this.boatHeadingRad);
    const fwdZ = -Math.cos(this.boatHeadingRad);

    _camTarget.set(
      this.boatPos.x - fwdX * 12.5,
      5.8 + this.sailHoist * 0.6,
      this.boatPos.z - fwdZ * 12.5
    );
    _camLook.set(
      this.boatPos.x + fwdX * 6,
      1.6,
      this.boatPos.z + fwdZ * 6
    );

    const k = 1 - Math.exp(-4.2 * dt);
    this.camera.position.lerp(_camTarget, k);
    this.camera.lookAt(_camLook);
  }

  private updateCameraTitle(elapsed: number): void {
    // Frame Raka's boat (0,0,16) & floating market (-10.5,0,-4) in right 60% so left HUD sits over calm space
    const sway = Math.sin(elapsed * 0.28) * 2.2;
    this.camera.position.set(8.5 + sway, 5.2 + Math.sin(elapsed * 0.4) * 0.4, 24.5);
    this.camera.lookAt(-3.5, 1.4, 2.0);
  }

  private updateEnvironmentAnimations(dt: number, elapsed: number): void {
    // Update pooled wake streaks
    for (let i = 0; i < this.wakeCount; i++) {
      const w = this.wakeData[i];
      if (w.age < w.maxAge) {
        w.age += dt;
        const p = w.age / w.maxAge;
        _dummy.position.set(w.x, w.y, w.z);
        _dummy.rotation.set(0, this.boatHeadingRad, 0);
        const s = (1 - p) * (0.9 + p * 1.8);
        _dummy.scale.set(s, 1, s * 1.4);
      } else {
        _dummy.position.set(0, -10, 0);
        _dummy.scale.setScalar(0.01);
      }
      _dummy.updateMatrix();
      this.wakeInstanced.setMatrixAt(i, _dummy.matrix);
    }
    this.wakeInstanced.instanceMatrix.needsUpdate = true;

    // Gentle lantern bobbing & drift
    for (let i = 0; i < this.floatingLanterns.length; i++) {
      const l = this.floatingLanterns[i];
      l.position.y = 0.12 + Math.sin(elapsed * 1.6 + i) * 0.05;
      l.rotation.y += dt * 0.25;
    }

    // Coastal birds circling high above straits/river
    if (this.coastalBirds) {
      for (let i = 0; i < this.birdSeeds.length; i++) {
        const b = this.birdSeeds[i];
        const ang = b.angle + elapsed * b.speed;
        _dummy.position.set(
          Math.cos(ang) * b.radius,
          b.height + Math.sin(elapsed * 3 + i) * 0.4,
          Math.sin(ang) * b.radius - 16
        );
        _dummy.rotation.set(0, -ang, Math.sin(elapsed * 6 + i) * 0.25);
        _dummy.scale.setScalar(1);
        _dummy.updateMatrix();
        this.coastalBirds.setMatrixAt(i, _dummy.matrix);
      }
      this.coastalBirds.instanceMatrix.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.resizeObserver.disconnect();

    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost);

    this.textures.forEach((t) => t.dispose());
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.geometry?.dispose();
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => mat.dispose());
        } else {
          m.material?.dispose();
        }
      }
    });
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
