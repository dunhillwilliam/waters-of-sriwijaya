import { CodexEntry, DialogueNode, QuestMission, TradeGood, ZoneInfo } from '../types/game';

export const TRADE_GOODS: TradeGood[] = [
  {
    id: 'camphor',
    name: 'Barus Camphor',
    localName: 'Kapur Barus',
    origin: 'North Sumatra Highlands',
    baseValueMasa: 14,
    weightUnit: 2,
    colorHex: '#e8e2d5',
    accentHex: '#b89f68',
    shape: 'jar',
    plainDescription: 'Fragrant white tree resin prized from Baghdad to Chang’an for medicine and incense.'
  },
  {
    id: 'benzoin',
    name: 'Golden Benzoin',
    localName: 'Kemenyan',
    origin: 'Sumatran Forest',
    baseValueMasa: 11,
    weightUnit: 2,
    colorHex: '#c98a3b',
    accentHex: '#f4d078',
    shape: 'basket',
    plainDescription: 'Warm vanilla-scented resin burned in Buddhist temples across Asia.'
  },
  {
    id: 'cloves',
    name: 'Maluku Cloves',
    localName: 'Cengkeh',
    origin: 'Eastern Spice Islands',
    baseValueMasa: 16,
    weightUnit: 1,
    colorHex: '#6b3622',
    accentHex: '#d48248',
    shape: 'basket',
    plainDescription: 'Dried flower buds worth more than their weight in silver in distant ports.'
  },
  {
    id: 'pepper',
    name: 'Black Pepper',
    localName: 'Lada Hitam',
    origin: 'Sunda & Lampung',
    baseValueMasa: 9,
    weightUnit: 3,
    colorHex: '#2c2520',
    accentHex: '#9c7853',
    shape: 'bundle',
    plainDescription: 'Everyday spice sacks that kept Sriwijaya merchant fleets busy year-round.'
  },
  {
    id: 'gold_dust',
    name: 'Minangkabau Gold',
    localName: 'Emas Urai',
    origin: 'Inland Bukit Barisan',
    baseValueMasa: 24,
    weightUnit: 1,
    colorHex: '#e8b93c',
    accentHex: '#fff0a8',
    shape: 'ingot',
    plainDescription: 'River-panned gold sealed in clay crucibles—giving Sumatra the name Suvarnadvipa (Gold Island).'
  },
  {
    id: 'celadon',
    name: 'Tang Celadon Jar',
    localName: 'Keramik Hijau',
    origin: 'Guangzhou Kilns',
    baseValueMasa: 18,
    weightUnit: 3,
    colorHex: '#7da88d',
    accentHex: '#d5e5d8',
    shape: 'jar',
    plainDescription: 'Jade-green glazed stoneware carried south on seasonal northeast monsoon winds.'
  },
  {
    id: 'cotton',
    name: 'Tamil Dyed Cotton',
    localName: 'Kain Chola',
    origin: 'Coromandel Coast',
    baseValueMasa: 12,
    weightUnit: 2,
    colorHex: '#9b3634',
    accentHex: '#e6b86a',
    shape: 'bundle',
    plainDescription: 'Vibrant block-printed cloth traded by South Indian merchant guilds at Bangka and Palembang.'
  },
  {
    id: 'tin_ingot',
    name: 'Bangka Tin Ingot',
    localName: 'Timah Bangka',
    origin: 'Bangka Island',
    baseValueMasa: 15,
    weightUnit: 4,
    colorHex: '#8d99a3',
    accentHex: '#cfd8df',
    shape: 'ingot',
    plainDescription: 'Heavy gleaming tin bars cast into pyramid molds for bronze-making and coinage.'
  }
];

export const ZONES: Record<string, ZoneInfo> = {
  palembang: {
    id: 'palembang',
    name: 'Palembang',
    subtitle: 'Heart of the Musi River',
    act: 1,
    windAngleDeg: 35,
    windStrength: 1.0,
    skyTopHex: 0x3b6078,
    skyHorizonHex: 0xf4a261,
    fogHex: 0xe6a16d,
    waterShallowHex: 0x3a6b60,
    waterDeepHex: 0x1b4552,
    sunElevationDeg: 14,
    description: 'Floating rumah rakit timber houses, buzzing market rafts, and riverfront shipyards bathed in golden-hour light.',
    marketGoods: ['camphor', 'benzoin', 'pepper', 'celadon'],
    craftStation: 'shipbuilding'
  },
  muaro_jambi: {
    id: 'muaro_jambi',
    name: 'Muaro Jambi',
    subtitle: 'Brick Stupas & Gold River',
    act: 2,
    windAngleDeg: 115,
    windStrength: 1.15,
    skyTopHex: 0x435772,
    skyHorizonHex: 0xebb176,
    fogHex: 0xdca574,
    waterShallowHex: 0x436e5c,
    waterDeepHex: 0x1e4749,
    sunElevationDeg: 11,
    description: 'Terracotta Buddhist brick temples beside quiet lotus canals where scholars trace Pallava palm-leaf scripts.',
    marketGoods: ['gold_dust', 'benzoin', 'celadon', 'camphor'],
    craftStation: 'prasasti'
  },
  bangka_strait: {
    id: 'bangka_strait',
    name: 'Bangka Strait',
    subtitle: 'Watchtower & Tin Port',
    act: 2,
    windAngleDeg: 210,
    windStrength: 1.35,
    skyTopHex: 0x254d6e,
    skyHorizonHex: 0xeb985c,
    fogHex: 0xd48e66,
    waterShallowHex: 0x2e7075,
    waterDeepHex: 0x123852,
    sunElevationDeg: 17,
    description: 'Deep emerald strait waters guarded by Orang Laut navigators, tin smelters, and timber watchtowers.',
    marketGoods: ['tin_ingot', 'cotton', 'cloves', 'pepper'],
    craftStation: 'shipbuilding'
  },
  sunda_strait: {
    id: 'sunda_strait',
    name: 'Sunda Strait Outpost',
    subtitle: 'Dusk Lantern Gateway',
    act: 3,
    windAngleDeg: 295,
    windStrength: 1.4,
    skyTopHex: 0x1e2c4a,
    skyHorizonHex: 0xd9764a,
    fogHex: 0x8f5d57,
    waterShallowHex: 0x25535c,
    waterDeepHex: 0x102238,
    sunElevationDeg: 7,
    description: 'Dusk anchorage where bronze gongs ring across the waves and floating lotus lanterns guide returning envoys home.',
    marketGoods: ['cloves', 'pepper', 'cotton', 'gold_dust'],
    craftStation: 'lantern'
  }
};

export const MISSIONS: QuestMission[] = [
  {
    id: 'act1_market',
    act: 1,
    title: 'First Morning at the Floating Market',
    zoneId: 'palembang',
    giver: 'Mak Sari',
    giverRole: 'Floating Market Elder',
    objectiveText: 'Balance a fair trade at Mak Sari’s Floating Market raft in Palembang.',
    plainSummary: 'Every river apprentice starts by learning fair weights. Pull beside the red-canopy market raft and balance the bronze scale.',
    rewardMasa: 25,
    rewardProsperity: 1,
    requiredAction: 'trade_market'
  },
  {
    id: 'act1_lashing',
    act: 1,
    title: 'Stitches Without Iron Nails',
    zoneId: 'palembang',
    giver: 'Pak Bima',
    giverRole: 'Master Shipwright',
    objectiveText: 'Lash Raka’s hull planks with black ijuk palm rope at the Palembang Shipyard.',
    plainSummary: 'Nusantara shipbuilders sew hulls flexibly with sugar-palm fiber so waves bend the boat instead of snapping iron nails.',
    rewardMasa: 30,
    rewardProsperity: 1,
    requiredAction: 'craft_shipbuilding'
  },
  {
    id: 'act2_prasasti',
    act: 2,
    title: 'Words Carved for the River',
    zoneId: 'muaro_jambi',
    giver: 'Bhiksu Dharmapala',
    giverRole: 'Monastery Scholar',
    objectiveText: 'Sail to Muaro Jambi via the Star Chart and trace a sacred Pallava oath tablet.',
    plainSummary: 'Monks and scribes recorded Śrīvijaya’s laws on stone steles and palm-leaf books. Trace the ancient strokes cleanly.',
    rewardMasa: 35,
    rewardProsperity: 1,
    requiredAction: 'craft_prasasti'
  },
  {
    id: 'act2_oath',
    act: 2,
    title: 'Oath-Water for the Sea People',
    zoneId: 'bangka_strait',
    giver: 'Panglima Tuah',
    giverRole: 'Orang Laut Navigator',
    objectiveText: 'Carry sacred oath-water through Bangka Strait and deliver it to Panglima Tuah.',
    plainSummary: 'Śrīvijaya ruled through sea alliances, not land armies. Deliver the ceremonial oath-water jar to unite the Orang Laut fleet.',
    rewardMasa: 45,
    rewardProsperity: 2,
    requiredAction: 'deliver_oath_water'
  },
  {
    id: 'act3_lantern',
    act: 3,
    title: 'Lanterns of the Unbroken Mandala',
    zoneId: 'sunda_strait',
    giver: 'Datu Ratna',
    giverRole: 'Harbor Envoy',
    objectiveText: 'Reach Sunda Strait at dusk and lead the Gamelan & Lotus Lantern ceremony.',
    plainSummary: 'Ring the bronze gongs in rhythm and release floating lotus lanterns to signal safe passage across the entire Nusantara sea.',
    rewardMasa: 60,
    rewardProsperity: 2,
    requiredAction: 'craft_lantern'
  }
];

export const DIALOGUES: Record<string, DialogueNode> = {
  mak_sari: {
    id: 'mak_sari',
    speaker: 'Mak Sari',
    role: 'Floating Market Elder · Palembang',
    zoneId: 'palembang',
    lines: [
      'Morning, Raka! The Musi is calm and the morning mist is lifting off the raft roofs.',
      'Merchants from China and Sumatra have anchored right beside our bamboo planks. Use my bronze balance scale—make sure both pans sit level and fair!'
    ],
    actionLabel: 'Open Floating Market',
    actionType: 'market'
  },
  pak_bima: {
    id: 'pak_bima',
    speaker: 'Pak Bima',
    role: 'Shipwright · Palembang Timber Pier',
    zoneId: 'palembang',
    lines: [
      'Your perahu rides light, young apprentice—but open straits will test every plank.',
      'Here in Nusantara we never drive stiff iron nails into sea hulls. We stitch planks with strong black ijuk palm-fiber rope so the hull flexes with the swell!'
    ],
    actionLabel: 'Lash Hull Planks',
    actionType: 'craft_ship'
  },
  dharmapala: {
    id: 'dharmapala',
    speaker: 'Bhiksu Dharmapala',
    role: 'Vihara Scholar · Muaro Jambi',
    zoneId: 'muaro_jambi',
    lines: [
      'Peace upon your voyage, Raka. Pilgrims from Tang China—like Master I-Tsing—study Sanskrit and Malay grammar in these red-brick courtyards.',
      'Help me incise a blessing onto this lontar palm scroll and stone tablet. Take this jar of sacred oath-water for the sea captains of Bangka.'
    ],
    actionLabel: 'Trace Pallava Script',
    actionType: 'craft_prasasti'
  },
  panglima_tuah: {
    id: 'panglima_tuah',
    speaker: 'Panglima Tuah',
    role: 'Orang Laut Sea Captain · Bangka Strait',
    zoneId: 'bangka_strait',
    lines: [
      'You read the monsoon ribbon well to make it past the sandbars! My Orang Laut kin know every reef and current between Sumatra and Java.',
      'Present the sacred oath-water from the river shrines, and our swift outriggers will guard the spice lanes as one Mandala!'
    ],
    actionLabel: 'Present Oath-Water Jar',
    actionType: 'deliver_oath'
  },
  datu_ratna: {
    id: 'datu_ratna',
    speaker: 'Datu Ratna',
    role: 'Envoy · Sunda Strait Outpost',
    zoneId: 'sunda_strait',
    lines: [
      'Look at how the docks glow—every port from Palembang to Sunda now sails under shared lanterns and fair weights.',
      'Strike the bronze gongs as the sun dips low and set the lotus lanterns drifting across the strait!'
    ],
    actionLabel: 'Begin Lantern Ceremony',
    actionType: 'craft_lantern'
  }
};

export const CODEX_ENTRIES: CodexEntry[] = [
  {
    id: 'kedatuan',
    term: 'Kedatuan',
    pronunciation: 'keh-dah-too-ahn',
    category: 'Society',
    shortMeaning: 'A river-and-sea confederation led by a Datu (chief), rather than a rigid land-locked kingdom.',
    didYouKnow: 'Instead of building big stone castles inland, Sriwijaya worked like a network of allied ports connected by rivers and open water—a political web historians call a "Mandala".'
  },
  {
    id: 'datu',
    term: 'Datu',
    pronunciation: 'dah-too',
    category: 'Society',
    shortMeaning: 'A respected community leader, harbor chief, or royal ruler in ancient Nusantara.',
    didYouKnow: 'Carved stones show that local Datus pledged loyalty in sacred ceremonies, receiving protection and prime access to global spice and silk trade.'
  },
  {
    id: 'orang_laut',
    term: 'Orang Laut',
    pronunciation: 'oh-rahng lah-oot',
    category: 'People',
    shortMeaning: '"People of the Sea"—nomadic maritime families who lived on boats across the straits.',
    didYouKnow: 'They were the secret backbone of Sriwijaya’s navy and navigation! Knowing hidden reefs, tides, and monsoon shifts, they escorted friendly ships and chased off raiders.'
  },
  {
    id: 'vihara',
    term: 'Vihara',
    pronunciation: 'vee-hah-rah',
    category: 'Place',
    shortMeaning: 'A Buddhist monastery and center of learning built of fired red brick.',
    didYouKnow: 'In 671 CE, the Chinese monk I-Tsing stayed in Palembang for six months to learn Sanskrit before sailing to India, praising Sriwijaya’s thousand scholars.'
  },
  {
    id: 'musi',
    term: 'Musi River & Rumah Rakit',
    pronunciation: 'moo-see / roo-mah rah-keet',
    category: 'Place',
    shortMeaning: 'Palembang’s mighty river highway and its traditional floating timber raft houses.',
    didYouKnow: 'Because river tides rose and fell daily, families built homes on lashed bamboo and log rafts that floated smoothly with the water—letting markets float right up to your porch!'
  },
  {
    id: 'ijuk',
    term: 'Lashed-Lug & Ijuk',
    pronunciation: 'ee-jook',
    category: 'Craft',
    shortMeaning: 'Shipbuilding with wooden dowels and black sugar-palm fiber ropes instead of iron nails.',
    didYouKnow: 'Archaeologists found ancient Sumatran ship planks stitched together with black ijuk cords. Without iron nails, hulls never rusted in warm tropical saltwater and bent gracefully over ocean swells.'
  },
  {
    id: 'prasasti',
    term: 'Prasasti & Air Sumpah',
    pronunciation: 'prah-sahs-tee',
    category: 'Craft',
    shortMeaning: 'Stone inscriptions written in Old Malay using Pallava script, paired with sacred oath-water.',
    didYouKnow: 'The 683 CE Kedukan Bukit stone from Palembang is one of the oldest written examples of Old Malay—recording a 20,000-person maritime expedition!'
  }
];
