import * as THREE from 'three';
import { RakaAppearance, ShipTier, TradeGood } from '../types/game';

/**
 * Generates procedural wood-plank CanvasTexture with SRGBColorSpace.
 */
export function createWoodTexture(baseHex = '#6e472b', grainHex = '#4a2e1a', maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = grainHex;
  for (let y = 0; y < 256; y += 32) {
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();

    for (let i = 0; i < 6; i++) {
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      const gy = y + 4 + i * 4.5;
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(85, gy + (i % 2 === 0 ? 2 : -2), 170, gy - 2, 256, gy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Generates woven pandanus sail mat CanvasTexture.
 */
export function createWovenSailTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#e7d5ad';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle woven pandanus stripes + Sriwijaya saffron-red border stripe
  for (let i = 0; i < 256; i += 12) {
    ctx.fillStyle = i % 24 === 0 ? 'rgba(186, 154, 102, 0.25)' : 'rgba(255, 248, 232, 0.2)';
    ctx.fillRect(i, 0, 6, 256);
    ctx.fillRect(0, i, 256, 5);
  }
  ctx.fillStyle = '#9c3226';
  ctx.fillRect(0, 210, 256, 22);
  ctx.fillStyle = '#d4a853';
  ctx.fillRect(0, 202, 256, 6);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Generates terracotta brick CanvasTexture for Muaro Jambi stupas.
 */
export function createBrickTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#9d4833';
  ctx.fillRect(0, 0, 256, 256);

  const brickH = 24;
  const brickW = 48;
  for (let row = 0; row < 12; row++) {
    const offset = (row % 2) * (brickW / 2);
    for (let col = -1; col < 7; col++) {
      const tone = (row * 7 + col * 13) % 3;
      ctx.fillStyle = tone === 0 ? '#a84f39' : tone === 1 ? '#8f412e' : '#b25941';
      ctx.fillRect(col * brickW + offset + 2, row * brickH + 2, brickW - 4, brickH - 4);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export interface BuiltBoatRig {
  group: THREE.Group;
  sailMesh: THREE.Mesh;
  windVaneGroup: THREE.Group;
  rakaTunicMat: THREE.MeshStandardMaterial;
  rakaTanjakMat: THREE.MeshStandardMaterial;
  outriggerGroup: THREE.Group;
  cargoHoldGroup: THREE.Group;
}

const TUNIC_HEX: Record<RakaAppearance['tunic'], number> = {
  indigo: 0x2a4569,
  saffron: 0xd48b28,
  crimson: 0x9b2c2c
};

const TANJAK_HEX: Record<RakaAppearance['tanjak'], number> = {
  gold: 0xd4a853,
  ivory: 0xefe7d6
};

/**
 * Builds Raka's composite 8-12 part Nusantara Perahu / Outrigger / Jong vessel.
 */
export function buildPlayerBoat(
  tier: ShipTier,
  appearance: RakaAppearance,
  woodTex: THREE.Texture,
  sailTex: THREE.Texture
): BuiltBoatRig {
  const group = new THREE.Group();

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: woodTex,
    roughness: 0.72,
    metalness: 0.05
  });
  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x2c1b10,
    roughness: 0.85,
    metalness: 0.04
  });
  const ijukMat = new THREE.MeshStandardMaterial({
    color: 0x1e1916,
    roughness: 0.92,
    metalness: 0.02
  });
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xd8a84e,
    roughness: 0.25,
    metalness: 0.82
  });

  // 1. Primary sculpted hull via ExtrudeGeometry (pointed prow & stern)
  const hullShape = new THREE.Shape();
  const halfW = tier === 3 ? 1.15 : 0.88;
  const halfL = tier === 3 ? 3.2 : tier === 2 ? 2.6 : 2.25;
  hullShape.moveTo(0, halfL); // bow (+Z or -Z; we align forward = -Z)
  hullShape.quadraticCurveTo(halfW * 1.1, halfL * 0.35, halfW, 0);
  hullShape.quadraticCurveTo(halfW * 0.95, -halfL * 0.55, 0, -halfL);
  hullShape.quadraticCurveTo(-halfW * 0.95, -halfL * 0.55, -halfW, 0);
  hullShape.quadraticCurveTo(-halfW * 1.1, halfL * 0.35, 0, halfL);

  const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
    depth: 0.56,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.12,
    bevelSegments: 2
  });
  hullGeo.rotateX(Math.PI / 2);
  hullGeo.translate(0, 0.24, 0);
  const hullMesh = new THREE.Mesh(hullGeo, hullMat);
  hullMesh.castShadow = true;
  hullMesh.receiveShadow = true;
  group.add(hullMesh);

  // 2. Deck planks & gunwale rails
  const deckGeo = new THREE.BoxGeometry(halfW * 1.35, 0.08, halfL * 1.25);
  const deckMesh = new THREE.Mesh(deckGeo, darkTrimMat);
  deckMesh.position.set(0, 0.27, 0);
  deckMesh.receiveShadow = true;
  group.add(deckMesh);

  // 3. Carved upturned prow ornament
  const prowGeo = new THREE.ConeGeometry(0.16, 0.85, 6);
  prowGeo.rotateX(-Math.PI * 0.32);
  const prowMesh = new THREE.Mesh(prowGeo, tier >= 2 ? goldTrimMat : darkTrimMat);
  prowMesh.position.set(0, 0.55, -halfL - 0.12);
  prowMesh.castShadow = true;
  group.add(prowMesh);

  // 4. Black ijuk palm-fiber lashing ribs across hull
  for (let i = -2; i <= 2; i++) {
    const ribGeo = new THREE.TorusGeometry(halfW * 0.88, 0.032, 6, 16, Math.PI);
    ribGeo.rotateZ(Math.PI);
    const rib = new THREE.Mesh(ribGeo, ijukMat);
    rib.position.set(0, 0.25, i * (halfL * 0.34));
    group.add(rib);
  }

  // 5. Twin outrigger booms & bamboo pontoons (visible on Tier 2 & 3)
  const outriggerGroup = new THREE.Group();
  const boomGeo = new THREE.CylinderGeometry(0.055, 0.055, halfW * 4.4, 8);
  boomGeo.rotateZ(Math.PI / 2);
  const boomFront = new THREE.Mesh(boomGeo, darkTrimMat);
  boomFront.position.set(0, 0.34, -0.7);
  const boomBack = new THREE.Mesh(boomGeo, darkTrimMat);
  boomBack.position.set(0, 0.34, 0.7);
  outriggerGroup.add(boomFront, boomBack);

  const floatGeo = new THREE.CapsuleGeometry(0.14, halfL * 1.35, 4, 8);
  floatGeo.rotateX(Math.PI / 2);
  const leftFloat = new THREE.Mesh(floatGeo, hullMat);
  leftFloat.position.set(-halfW * 2.15, 0.08, 0);
  leftFloat.castShadow = true;
  const rightFloat = new THREE.Mesh(floatGeo, hullMat);
  rightFloat.position.set(halfW * 2.15, 0.08, 0);
  rightFloat.castShadow = true;
  outriggerGroup.add(leftFloat, rightFloat);
  outriggerGroup.visible = tier >= 2;
  group.add(outriggerGroup);

  // 6. Mast + Woven Pandanus Sail + Yardarm
  const mastHeight = tier === 3 ? 4.4 : 3.6;
  const mastGeo = new THREE.CylinderGeometry(0.06, 0.09, mastHeight, 8);
  const mast = new THREE.Mesh(mastGeo, darkTrimMat);
  mast.position.set(0, 0.25 + mastHeight / 2, -0.25);
  mast.castShadow = true;
  group.add(mast);

  const sailMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: sailTex,
    roughness: 0.82,
    metalness: 0.02,
    side: THREE.DoubleSide
  });
  const sailGeo = new THREE.PlaneGeometry(tier === 3 ? 2.5 : 1.9, mastHeight * 0.65, 6, 4);
  // Slight wind belly curve
  const posAttr = sailGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const belly = Math.cos((x / 1.3) * 1.1) * Math.cos((y / 1.4) * 1.0) * 0.22;
    posAttr.setZ(i, -belly);
  }
  sailGeo.computeVertexNormals();

  const sailMesh = new THREE.Mesh(sailGeo, sailMat);
  sailMesh.position.set(0, 0.25 + mastHeight * 0.56, -0.18);
  sailMesh.castShadow = true;
  group.add(sailMesh);

  // 7. Masthead silk Wind Vane Ribbon
  const windVaneGroup = new THREE.Group();
  windVaneGroup.position.set(0, 0.25 + mastHeight, -0.25);
  const ribbonGeo = new THREE.PlaneGeometry(0.85, 0.16, 4, 1);
  ribbonGeo.translate(0.42, 0, 0);
  const ribbonMat = new THREE.MeshStandardMaterial({
    color: 0xd93829,
    emissive: 0x3b0c06,
    roughness: 0.6,
    side: THREE.DoubleSide
  });
  const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
  windVaneGroup.add(ribbonMesh);
  group.add(windVaneGroup);

  // 8. Stylized Raka Pilot Figure (bottom-center grounded on deck)
  const rakaGroup = new THREE.Group();
  rakaGroup.position.set(0, 0.3, 0.82);

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xb6794f, roughness: 0.7 });
  const rakaTunicMat = new THREE.MeshStandardMaterial({
    color: TUNIC_HEX[appearance.tunic],
    roughness: 0.8
  });
  const rakaTanjakMat = new THREE.MeshStandardMaterial({
    color: TANJAK_HEX[appearance.tanjak],
    roughness: 0.55,
    metalness: 0.15
  });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.21, 0.58, 8), rakaTunicMat);
  torso.position.y = 0.29;
  torso.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), skinMat);
  head.position.y = 0.72;
  head.castShadow = true;
  const tanjak = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.22, 6), rakaTanjakMat);
  tanjak.position.set(0, 0.85, 0);
  tanjak.rotation.z = -0.15;
  rakaGroup.add(torso, head, tanjak);
  group.add(rakaGroup);

  // 9. Cargo hold accent crates
  const cargoHoldGroup = new THREE.Group();
  cargoHoldGroup.position.set(0, 0.32, 0.15);
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x8d5e34, roughness: 0.8 });
  const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.26, 0.38), crateMat);
  crate1.position.set(-0.26, 0.13, 0.1);
  const jarMat = new THREE.MeshStandardMaterial({ color: 0x7da88d, roughness: 0.25, metalness: 0.1 });
  const jar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.32, 10), jarMat);
  jar1.position.set(0.28, 0.16, 0.05);
  cargoHoldGroup.add(crate1, jar1);
  group.add(cargoHoldGroup);

  return {
    group,
    sailMesh,
    windVaneGroup,
    rakaTunicMat,
    rakaTanjakMat,
    outriggerGroup,
    cargoHoldGroup
  };
}

/**
 * Builds a floating Rumah Rakit (Musi River raft house) as a 6-part composite THREE.Group.
 */
export function buildRumahRakit(woodTex: THREE.Texture, accentColor = 0xa9422b): THREE.Group {
  const group = new THREE.Group();

  const logMat = new THREE.MeshStandardMaterial({ color: 0x4d3420, roughness: 0.88 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: woodTex, roughness: 0.78 });
  const thatchMat = new THREE.MeshStandardMaterial({ color: 0x6b5636, roughness: 0.94 });
  const bannerMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.72 });
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xffd27a,
    emissive: 0xff9f38,
    emissiveIntensity: 1.5,
    roughness: 0.3
  });

  // 1. Bamboo log raft base
  const raft = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.36, 5.4), logMat);
  raft.position.y = 0.08;
  raft.receiveShadow = true;
  raft.castShadow = true;
  group.add(raft);

  // 2. Timber cabin body
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.0, 3.8), wallMat);
  cabin.position.set(0, 1.26, -0.2);
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  group.add(cabin);

  // 3. Pitched Nusantara saddle thatch roof (Extrude prism)
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-2.3, 0);
  roofShape.lineTo(0, 1.45);
  roofShape.lineTo(2.3, 0);
  roofShape.closePath();
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 4.5, bevelEnabled: false });
  roofGeo.translate(0, 0, -2.25);
  const roof = new THREE.Mesh(roofGeo, thatchMat);
  roof.position.set(0, 2.15, -0.2);
  roof.castShadow = true;
  group.add(roof);

  // 4. Front porch veranda awning + posts
  const porchPosts = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 6), logMat);
  porchPosts.position.set(-1.5, 1.16, 2.1);
  const porchPostR = porchPosts.clone();
  porchPostR.position.x = 1.5;
  group.add(porchPosts, porchPostR);

  // 5. Hanging cloth banner & glowing porch lantern
  const banner = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.08), bannerMat);
  banner.position.set(0, 1.85, 2.15);
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), lanternMat);
  lantern.position.set(1.25, 1.65, 2.15);
  group.add(banner, lantern);

  return group;
}

/**
 * Builds a clickable 3D trade good mesh for the Floating Market raft.
 */
export function buildTradeGoodMesh(good: TradeGood): THREE.Group {
  const g = new THREE.Group();
  const mainMat = new THREE.MeshStandardMaterial({
    color: good.colorHex,
    roughness: good.shape === 'jar' ? 0.25 : good.shape === 'ingot' ? 0.22 : 0.78,
    metalness: good.shape === 'ingot' ? 0.85 : 0.05
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: good.accentHex,
    roughness: 0.4,
    metalness: 0.3
  });

  if (good.shape === 'jar') {
    const pts = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.22, 0),
      new THREE.Vector2(0.32, 0.34),
      new THREE.Vector2(0.18, 0.62),
      new THREE.Vector2(0.22, 0.72),
      new THREE.Vector2(0.12, 0.72)
    ];
    const jar = new THREE.Mesh(new THREE.LatheGeometry(pts, 14), mainMat);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.1, 12), accentMat);
    lid.position.y = 0.74;
    g.add(jar, lid);
  } else if (good.shape === 'ingot') {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 0.28, 4), mainMat);
    base.position.y = 0.14;
    const bar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.26, 0.24, 4), accentMat);
    bar2.position.set(0.16, 0.34, 0.05);
    g.add(base, bar2);
  } else if (good.shape === 'basket') {
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.22, 0.38, 12), accentMat);
    basket.position.y = 0.19;
    const mound = new THREE.Mesh(new THREE.SphereGeometry(0.29, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), mainMat);
    mound.position.y = 0.36;
    g.add(basket, mound);
  } else {
    const sack = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.5, 10), mainMat);
    sack.position.y = 0.25;
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 6, 12), accentMat);
    tie.rotation.x = Math.PI / 2;
    tie.position.y = 0.44;
    g.add(sack, tie);
  }

  // Invisible larger hit proxy for forgiving raycast clicking
  const hitBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 1.0, 0.95),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitBox.position.y = 0.45;
  hitBox.userData = { goodId: good.id };
  g.add(hitBox);

  return g;
}

/**
 * Builds the Floating Market Raft (Pasar Terapung) with clickable 3D trade goods.
 */
export function buildMarketRaft(
  woodTex: THREE.Texture,
  goodsList: TradeGood[],
  interactables: THREE.Object3D[]
): THREE.Group {
  const group = new THREE.Group();
  const raftMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: woodTex, roughness: 0.78 });
  const awningMat = new THREE.MeshStandardMaterial({ color: 0xb03025, roughness: 0.76, side: THREE.DoubleSide });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x3f2918, roughness: 0.85 });

  const deck = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.42, 4.4), raftMat);
  deck.position.y = 0.1;
  deck.receiveShadow = true;
  deck.castShadow = true;
  group.add(deck);

  // Corner bamboo canopy poles + angled canopy
  [
    [-2.7, -1.7],
    [2.7, -1.7],
    [-2.7, 1.7],
    [2.7, 1.7]
  ].forEach(([px, pz]) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 2.5, 6), poleMat);
    pole.position.set(px, 1.35, pz);
    group.add(pole);
  });

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.12, 4.2), awningMat);
  canopy.position.set(0, 2.6, 0);
  canopy.rotation.x = 0.08;
  canopy.castShadow = true;
  group.add(canopy);

  // Display table + clickable 3D goods
  const table = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.55, 1.4), poleMat);
  table.position.set(0, 0.56, 0.5);
  group.add(table);

  goodsList.slice(0, 4).forEach((good, idx) => {
    const itemGroup = buildTradeGoodMesh(good);
    itemGroup.position.set(-1.65 + idx * 1.1, 0.85, 0.5);
    itemGroup.traverse((child) => {
      if (child.userData?.goodId) {
        child.userData.marketClick = true;
        interactables.push(child);
      }
    });
    group.add(itemGroup);
  });

  return group;
}

/**
 * Builds a Muaro Jambi / Bukit Siguntang red-brick Buddhist Candi Stupa.
 */
export function buildBrickStupa(brickTex: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  const brickMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: brickTex,
    roughness: 0.85,
    metalness: 0.04
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xe3b448,
    roughness: 0.22,
    metalness: 0.88
  });

  // 3 stepped terraces
  const base1 = new THREE.Mesh(new THREE.BoxGeometry(9.5, 1.5, 9.5), brickMat);
  base1.position.y = 0.75;
  base1.castShadow = true;
  base1.receiveShadow = true;

  const base2 = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.5, 7.0), brickMat);
  base2.position.y = 2.25;
  base2.castShadow = true;

  const base3 = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.3, 4.6), brickMat);
  base3.position.y = 3.65;
  base3.castShadow = true;

  // Bell-shaped stupa dome + golden spire finial
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.75, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), brickMat);
  dome.position.y = 4.25;
  dome.castShadow = true;

  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.2, 8), goldMat);
  spire.position.y = 6.7;
  spire.castShadow = true;

  group.add(base1, base2, base3, dome, spire);
  return group;
}

/**
 * Builds a carved Old Malay Pallava stone inscription (Prasasti) shrine.
 */
export function buildPrasastiStele(): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6f685f, roughness: 0.9 });
  const glyphMat = new THREE.MeshStandardMaterial({
    color: 0xf4c868,
    emissive: 0xc28524,
    emissiveIntensity: 0.8,
    roughness: 0.4
  });

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 1.6), stoneMat);
  plinth.position.y = 0.25;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.4, 0.45), stoneMat);
  slab.position.y = 1.65;
  slab.castShadow = true;
  const crest = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), stoneMat);
  crest.scale.set(1, 0.7, 0.35);
  crest.position.y = 2.85;

  // Carved glowing script lines on front face
  for (let i = 0; i < 4; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.08, 0.04), glyphMat);
    line.position.set(0, 1.2 + i * 0.32, 0.23);
    group.add(line);
  }

  group.add(plinth, slab, crest);
  return group;
}

/**
 * Builds a stylized Nusantara NPC figure (grounded at bottom-center).
 */
export function buildNpcCharacter(robeHex: number, headwearHex: number, role: 'monk' | 'trader' | 'captain'): THREE.Group {
  const group = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xb87a52, roughness: 0.72 });
  const robeMat = new THREE.MeshStandardMaterial({ color: robeHex, roughness: 0.78 });
  const headMat = new THREE.MeshStandardMaterial({ color: headwearHex, roughness: 0.55 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.95, 8), robeMat);
  body.position.y = 0.48;
  body.castShadow = true;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), skinMat);
  head.position.y = 1.12;
  head.castShadow = true;

  group.add(body, head);

  if (role === 'trader') {
    const kerchief = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.21, 0.14, 8), headMat);
    kerchief.position.y = 1.25;
    group.add(kerchief);
  } else if (role === 'captain') {
    const tanjak = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.26, 6), headMat);
    tanjak.position.y = 1.32;
    group.add(tanjak);
  } else {
    const sash = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 12), headMat);
    sash.rotation.set(0.6, 0, 0.3);
    sash.position.y = 0.72;
    group.add(sash);
  }

  return group;
}

/**
 * Builds a Bangka / Sunda coastal watchtower or lighthouse beacon.
 */
export function buildWatchtower(woodTex: THREE.Texture, isLighthouse = false): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: woodTex, roughness: 0.82 });
  const roofMat = new THREE.MeshStandardMaterial({ color: isLighthouse ? 0x2c3e50 : 0x7c5331, roughness: 0.85 });
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffd56b,
    emissive: 0xff7b1c,
    emissiveIntensity: 2.2,
    roughness: 0.2
  });

  // 4 timber stilts
  [
    [-0.9, -0.9],
    [0.9, -0.9],
    [-0.9, 0.9],
    [0.9, 0.9]
  ].forEach(([x, z]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 5.2, 8), woodMat);
    post.position.set(x, 2.6, z);
    post.castShadow = true;
    group.add(post);
  });

  const platform = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.25, 2.8), woodMat);
  platform.position.y = 4.2;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.5, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 6.2;
  const brazier = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 10), flameMat);
  brazier.position.y = 4.9;

  group.add(platform, roof, brazier);
  return group;
}
