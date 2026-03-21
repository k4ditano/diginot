// ═══════════════════════════════════════════
// DigiNot — Game Data & Constants
// ═══════════════════════════════════════════

export const TYPES = {
  ember:  { name: 'Ember',  icon: '🔥', color: '#ff4500', bg: '#4a1500' },
  flux:   { name: 'Flux',   icon: '💧', color: '#0099ff', bg: '#001a40' },
  bloom:  { name: 'Bloom',  icon: '🌿', color: '#44cc00', bg: '#0a2600' },
  spark:  { name: 'Spark',  icon: '⚡', color: '#ffcc00', bg: '#332900' },
  void:   { name: 'Void',   icon: '🌑', color: '#9933ff', bg: '#0d0026' },
  lux:    { name: 'Lux',    icon: '✨', color: '#ffeeaa', bg: '#333020' },
  glitch: { name: 'Glitch', icon: '💀', color: '#ff00ff', bg: '#1a001a' },
};

// Type advantage chart: key beats values (1.5x damage)
export const TYPE_CHART = {
  ember:  ['bloom', 'spark'],
  flux:   ['ember', 'void'],
  bloom:  ['flux', 'spark'],
  spark:  ['flux', 'lux'],
  void:   ['lux', 'bloom'],
  lux:    ['void', 'ember'],
  glitch: ['glitch'],
};

export const STAGES = ['bit', 'byte', 'kilo', 'mega', 'giga'];
export const STAGE_LABELS = {
  bit: 'Bit', byte: 'Byte', kilo: 'Kilo', mega: 'Mega', giga: 'Giga'
};
export const STAGE_LEVELS = { bit: 1, byte: 8, kilo: 20, mega: 35, giga: 50 };
export const STAGE_SIZES = { bit: 10, byte: 12, kilo: 14, mega: 16, giga: 18 };

// Color palettes per type: [outline, shadow, base, highlight, eye, accent]
export const PALETTES = {
  ember: [
    ['#4a1c00','#8b2500','#ff4500','#ff8c00','#ffffff','#ffff00'],
    ['#3d0033','#8b005e','#ff3366','#ff66aa','#ffffff','#ffcc66'],
    ['#331100','#773300','#cc5500','#ff9933','#ffffff','#ffdd55'],
  ],
  flux: [
    ['#001a33','#003366','#0077cc','#33aaff','#ffffff','#66ddff'],
    ['#002233','#005566','#009999','#00cccc','#ffffff','#66ffff'],
    ['#0d0d33','#1a1a66','#3333cc','#6666ff','#ffffff','#aaaaff'],
  ],
  bloom: [
    ['#1a3300','#336600','#55aa00','#77dd00','#ffffff','#bbff33'],
    ['#0d260d','#1a4d1a','#33aa33','#55dd55','#ffffff','#88ff88'],
    ['#332200','#664400','#996600','#cc9933','#ffffff','#ffcc66'],
  ],
  spark: [
    ['#333300','#666600','#ccaa00','#ffdd00','#ffffff','#ffffaa'],
    ['#001a33','#003355','#0077aa','#00bbff','#ff3333','#ccffff'],
    ['#332200','#665500','#cc9900','#ffcc00','#ffffff','#ffee66'],
  ],
  void: [
    ['#0d001a','#1a0033','#5500aa','#9933ff','#ff3333','#cc66ff'],
    ['#0a0a15','#1a1a2e','#333366','#6666cc','#ff0000','#9999ff'],
    ['#1a001a','#330033','#770077','#aa33aa','#00ff00','#dd66dd'],
  ],
  lux: [
    ['#332200','#665500','#ccaa00','#ffdd33','#4444ff','#fffff0'],
    ['#333333','#666666','#bbbbbb','#ffffff','#0066ff','#fffff0'],
    ['#1a2233','#336688','#6699bb','#99ccee','#ff6600','#ddeeff'],
  ],
  glitch: [
    ['#330033','#ff0066','#00ff66','#ff00ff','#ffff00','#00ffff'],
  ],
};

// Moves database
export const MOVES = {
  // Ember moves
  fireball:    { name: 'Fireball',    type: 'ember',  power: 45, acc: 95, cat: 'special', effect: null },
  flameRush:   { name: 'Flame Rush',  type: 'ember',  power: 60, acc: 90, cat: 'physical', effect: 'burn' },
  inferno:     { name: 'Inferno',     type: 'ember',  power: 90, acc: 80, cat: 'special', effect: 'burn' },
  heatWave:    { name: 'Heat Wave',   type: 'ember',  power: 75, acc: 85, cat: 'special', effect: null },
  // Flux moves
  aquaJet:     { name: 'Aqua Jet',    type: 'flux',   power: 45, acc: 100, cat: 'physical', effect: null },
  tideSlam:    { name: 'Tide Slam',   type: 'flux',   power: 65, acc: 90, cat: 'physical', effect: null },
  torrent:     { name: 'Torrent',     type: 'flux',   power: 85, acc: 85, cat: 'special', effect: 'freeze' },
  bubbleBurst: { name: 'Bubble Burst',type: 'flux',   power: 50, acc: 100, cat: 'special', effect: null },
  // Bloom moves
  vineWhip:    { name: 'Vine Whip',   type: 'bloom',  power: 45, acc: 100, cat: 'physical', effect: null },
  thornStorm:  { name: 'Thorn Storm', type: 'bloom',  power: 60, acc: 90, cat: 'physical', effect: 'poison' },
  solarBeam:   { name: 'Solar Beam',  type: 'bloom',  power: 90, acc: 80, cat: 'special', effect: null },
  leafBlade:   { name: 'Leaf Blade',  type: 'bloom',  power: 70, acc: 95, cat: 'physical', effect: null },
  // Spark moves
  zapStrike:   { name: 'Zap Strike',  type: 'spark',  power: 45, acc: 100, cat: 'physical', effect: 'stun' },
  thunderBolt: { name: 'Thunderbolt', type: 'spark',  power: 70, acc: 90, cat: 'special', effect: 'stun' },
  voltTackle:  { name: 'Volt Tackle', type: 'spark',  power: 85, acc: 85, cat: 'physical', effect: null },
  sparkPulse:  { name: 'Spark Pulse', type: 'spark',  power: 55, acc: 95, cat: 'special', effect: null },
  // Void moves
  shadowClaw:  { name: 'Shadow Claw', type: 'void',   power: 55, acc: 95, cat: 'physical', effect: null },
  darkPulse:   { name: 'Dark Pulse',  type: 'void',   power: 70, acc: 90, cat: 'special', effect: null },
  nightmare:   { name: 'Nightmare',   type: 'void',   power: 85, acc: 80, cat: 'special', effect: 'poison' },
  phantomRush: { name: 'Phantom Rush',type: 'void',   power: 60, acc: 100, cat: 'physical', effect: null },
  // Lux moves
  holyBeam:    { name: 'Holy Beam',   type: 'lux',    power: 55, acc: 95, cat: 'special', effect: null },
  radiance:    { name: 'Radiance',    type: 'lux',    power: 75, acc: 90, cat: 'special', effect: null },
  judgement:   { name: 'Judgement',   type: 'lux',    power: 90, acc: 80, cat: 'special', effect: 'stun' },
  prismStrike: { name: 'Prism Strike',type: 'lux',    power: 60, acc: 95, cat: 'physical', effect: null },
  // Neutral moves
  tackle:      { name: 'Tackle',      type: 'neutral',power: 35, acc: 100, cat: 'physical', effect: null },
  scratch:     { name: 'Scratch',     type: 'neutral',power: 30, acc: 100, cat: 'physical', effect: null },
  bite:        { name: 'Bite',        type: 'neutral',power: 40, acc: 95, cat: 'physical', effect: null },
  headbutt:    { name: 'Headbutt',    type: 'neutral',power: 50, acc: 90, cat: 'physical', effect: null },
  roar:        { name: 'Roar',        type: 'neutral',power: 0,  acc: 100, cat: 'status', effect: 'scare' },
  rest:        { name: 'Rest',        type: 'neutral',power: 0,  acc: 100, cat: 'status', effect: 'heal' },
  // Glitch moves
  overflow:    { name: 'Overflow',    type: 'glitch', power: 77, acc: 77, cat: 'special', effect: 'stun' },
  corrupt:     { name: 'Corrupt',     type: 'glitch', power: 66, acc: 88, cat: 'special', effect: 'poison' },
  // ═══ V3: Expanded Move Pool ═══
  // More Ember
  emberClaw:   { name: 'Ember Claw',  type: 'ember',  power: 40, acc: 100, cat: 'physical', effect: null },
  magmaShield: { name: 'Magma Shield',type: 'ember',  power: 0,  acc: 100, cat: 'status',   effect: 'defUp' },
  blazeKick:   { name: 'Blaze Kick',  type: 'ember',  power: 70, acc: 85, cat: 'physical', effect: 'burn' },
  eruption:    { name: 'Eruption',    type: 'ember',  power: 110,acc: 70, cat: 'special',  effect: 'burn' },
  smokeScreen: { name: 'Smoke Screen',type: 'ember',  power: 0,  acc: 100, cat: 'status',   effect: 'accDown' },
  // More Flux
  whirlpool:   { name: 'Whirlpool',   type: 'flux',   power: 50, acc: 95, cat: 'special',  effect: 'spdDown' },
  iceBeam:     { name: 'Ice Beam',    type: 'flux',   power: 75, acc: 90, cat: 'special',  effect: 'freeze' },
  rainDance:   { name: 'Rain Dance',  type: 'flux',   power: 0,  acc: 100, cat: 'status',   effect: 'spAtkUp' },
  tsunami:     { name: 'Tsunami',     type: 'flux',   power: 100,acc: 75, cat: 'special',  effect: 'spdDown' },
  aquaShield:  { name: 'Aqua Shield', type: 'flux',   power: 0,  acc: 100, cat: 'status',   effect: 'spDefUp' },
  // More Bloom
  sporeBurst:  { name: 'Spore Burst', type: 'bloom',  power: 0,  acc: 90, cat: 'status',   effect: 'sleep' },
  rootGrab:    { name: 'Root Grab',   type: 'bloom',  power: 55, acc: 95, cat: 'physical', effect: 'spdDown' },
  photon:      { name: 'Photon',      type: 'bloom',  power: 80, acc: 85, cat: 'special',  effect: null },
  petalDance:  { name: 'Petal Dance', type: 'bloom',  power: 95, acc: 80, cat: 'special',  effect: 'confuse' },
  synthesis:   { name: 'Synthesis',   type: 'bloom',  power: 0,  acc: 100, cat: 'status',   effect: 'heal' },
  // More Spark
  discharge:   { name: 'Discharge',   type: 'spark',  power: 65, acc: 95, cat: 'special',  effect: 'stun' },
  magnetize:   { name: 'Magnetize',   type: 'spark',  power: 0,  acc: 100, cat: 'status',   effect: 'spdDown' },
  overcharge:  { name: 'Overcharge',  type: 'spark',  power: 100,acc: 75, cat: 'special',  effect: 'stun' },
  staticField: { name: 'Static Field',type: 'spark',  power: 0,  acc: 100, cat: 'status',   effect: 'stun' },
  boltStrike:  { name: 'Bolt Strike', type: 'spark',  power: 90, acc: 80, cat: 'physical', effect: 'burn' },
  // More Void
  soulDrain:   { name: 'Soul Drain',  type: 'void',   power: 55, acc: 95, cat: 'special',  effect: 'drain' },
  curseMark:   { name: 'Curse Mark',  type: 'void',   power: 0,  acc: 90, cat: 'status',   effect: 'curse' },
  abyssStrike: { name: 'Abyss Strike',type: 'void',   power: 95, acc: 75, cat: 'physical', effect: 'defDown' },
  shadowStep:  { name: 'Shadow Step', type: 'void',   power: 45, acc: 100, cat: 'physical', effect: 'spdUp' },
  voidPulse:   { name: 'Void Pulse',  type: 'void',   power: 70, acc: 90, cat: 'special',  effect: 'spDefDown' },
  // More Lux
  solarFlare:  { name: 'Solar Flare', type: 'lux',    power: 100,acc: 75, cat: 'special',  effect: 'accDown' },
  blessing:    { name: 'Blessing',    type: 'lux',    power: 0,  acc: 100, cat: 'status',   effect: 'heal' },
  divinePulse: { name: 'Divine Pulse',type: 'lux',    power: 80, acc: 90, cat: 'special',  effect: 'stun' },
  lightBarrier:{ name: 'Light Barrier',type:'lux',    power: 0,  acc: 100, cat: 'status',   effect: 'spDefUp' },
  purify:      { name: 'Purify',      type: 'lux',    power: 0,  acc: 100, cat: 'status',   effect: 'cleanse' },
  // More Neutral
  slam:        { name: 'Slam',        type: 'neutral',power: 60, acc: 90, cat: 'physical', effect: null },
  quickStrike: { name: 'Quick Strike',type: 'neutral',power: 35, acc: 100, cat: 'physical', effect: 'spdUp' },
  bodySlam:    { name: 'Body Slam',   type: 'neutral',power: 75, acc: 85, cat: 'physical', effect: 'stun' },
  screech:     { name: 'Screech',     type: 'neutral',power: 0,  acc: 95, cat: 'status',   effect: 'defDown' },
  recover:     { name: 'Recover',     type: 'neutral',power: 0,  acc: 100, cat: 'status',   effect: 'heal' },
  doubleHit:   { name: 'Double Hit',  type: 'neutral',power: 30, acc: 95, cat: 'physical', effect: 'double' },
  drainPunch:  { name: 'Drain Punch', type: 'neutral',power: 50, acc: 95, cat: 'physical', effect: 'drain' },
  // More Glitch
  segfault:    { name: 'Segfault',    type: 'glitch', power: 90, acc: 70, cat: 'special',  effect: 'confuse' },
  memLeak:     { name: 'Mem Leak',    type: 'glitch', power: 0,  acc: 85, cat: 'status',   effect: 'curse' },
  bluScreen:   { name: 'Blu Screen',  type: 'glitch', power: 120,acc: 60, cat: 'special',  effect: 'freeze' },
};

// Move pools per type and stage
export const MOVE_POOLS = {
  ember:  { bit: ['tackle','fireball'], byte: ['flameRush','fireball'], kilo: ['flameRush','heatWave','fireball'], mega: ['inferno','heatWave','flameRush'], giga: ['inferno','heatWave','flameRush','fireball'] },
  flux:   { bit: ['tackle','aquaJet'], byte: ['aquaJet','bubbleBurst'], kilo: ['tideSlam','bubbleBurst','aquaJet'], mega: ['torrent','tideSlam','aquaJet'], giga: ['torrent','tideSlam','bubbleBurst','aquaJet'] },
  bloom:  { bit: ['scratch','vineWhip'], byte: ['vineWhip','thornStorm'], kilo: ['leafBlade','thornStorm','vineWhip'], mega: ['solarBeam','leafBlade','thornStorm'], giga: ['solarBeam','leafBlade','thornStorm','vineWhip'] },
  spark:  { bit: ['tackle','zapStrike'], byte: ['zapStrike','sparkPulse'], kilo: ['thunderBolt','sparkPulse','zapStrike'], mega: ['voltTackle','thunderBolt','sparkPulse'], giga: ['voltTackle','thunderBolt','sparkPulse','zapStrike'] },
  void:   { bit: ['scratch','shadowClaw'], byte: ['shadowClaw','phantomRush'], kilo: ['darkPulse','shadowClaw','phantomRush'], mega: ['nightmare','darkPulse','shadowClaw'], giga: ['nightmare','darkPulse','shadowClaw','phantomRush'] },
  lux:    { bit: ['tackle','holyBeam'], byte: ['holyBeam','prismStrike'], kilo: ['radiance','prismStrike','holyBeam'], mega: ['judgement','radiance','prismStrike'], giga: ['judgement','radiance','prismStrike','holyBeam'] },
  glitch: { bit: ['tackle','overflow'], byte: ['overflow','corrupt'], kilo: ['overflow','corrupt','darkPulse'], mega: ['overflow','corrupt','nightmare'], giga: ['overflow','corrupt','nightmare','inferno'] },
};

// Name generation
const PREFIXES = {
  ember:  ['Pyr','Fla','Bur','Mag','Cin','Ign','Vul','Sol'],
  flux:   ['Aqu','Tid','Rip','Mar','Wav','Nau','Pel','Tor'],
  bloom:  ['Flo','Tho','Lea','Mos','Vin','Fer','Pet','Syl'],
  spark:  ['Vol','Tes','Ohm','Amp','Zel','Ion','Arc','Pul'],
  void:   ['Sha','Nyx','Umb','Pha','Hex','Gri','Noc','Abi'],
  lux:    ['Sol','Ray','Hal','Glo','Aur','Cel','Lum','Shi'],
  glitch: ['Err','Bug','Nul','Cor','Mal','Seg','Nan','Ref'],
};

const SUFFIXES = {
  bit:  ['bit','dot','pix','dat','nib'],
  byte: ['byte','code','ram','rom','hex'],
  kilo: ['kilo','core','node','link','net'],
  mega: ['mega','flux','dex','sys','max'],
  giga: ['giga','prime','apex','ultra','omega'],
};

export function generateName(dna, type, stage) {
  const hash = hashDNA(dna);
  const pres = PREFIXES[type] || PREFIXES.ember;
  const sufs = SUFFIXES[stage] || SUFFIXES.bit;
  const pre = pres[hash % pres.length];
  const suf = sufs[(hash >> 4) % sufs.length];
  return pre + suf;
}

// Stat generation from DNA
export function generateStats(dna, level, stage) {
  const h = hashDNA(dna);
  const stageIdx = STAGES.indexOf(stage);
  const base = 10 + stageIdx * 8;
  const genes = {
    hp:    ((h >> 0)  & 0xF) + base,
    atk:   ((h >> 4)  & 0xF) + base,
    def:   ((h >> 8)  & 0xF) + base,
    spAtk: ((h >> 12) & 0xF) + base,
    spDef: ((h >> 16) & 0xF) + base,
    spd:   ((h >> 20) & 0xF) + base,
  };
  // Scale by level
  const scale = (stat) => Math.floor(stat * (1 + level * 0.12));
  return {
    maxHp: scale(genes.hp + 20),
    hp:    scale(genes.hp + 20),
    atk:   scale(genes.atk),
    def:   scale(genes.def),
    spAtk: scale(genes.spAtk),
    spDef: scale(genes.spDef),
    spd:   scale(genes.spd),
  };
}

// Generate XP needed for level
export function xpForLevel(level) {
  return Math.floor(20 * Math.pow(level, 1.5));
}

// Zones for exploration
export const ZONES = [
  { id: 'forest',   name: 'Pixel Forest',   icon: '🌲', types: ['bloom','spark','lux'],  minLevel: 1,  color: '#1a3a1a' },
  { id: 'ocean',    name: 'Data Ocean',      icon: '🌊', types: ['flux','spark','bloom'],  minLevel: 1,  color: '#0a1a3a' },
  { id: 'volcano',  name: 'Ember Crater',    icon: '🌋', types: ['ember','void','lux'],   minLevel: 5,  color: '#3a1a0a' },
  { id: 'mountain', name: 'Cloud Peak',      icon: '⛰️', types: ['spark','lux','flux'],   minLevel: 10, color: '#2a2a3a' },
  { id: 'cave',     name: 'Shadow Depths',   icon: '🕳️', types: ['void','ember','glitch'],minLevel: 15, color: '#0a0a1a' },
  { id: 'sky',      name: 'Lux Heavens',     icon: '☁️', types: ['lux','spark','bloom'],   minLevel: 20, color: '#2a3040' },
  { id: 'glitch',   name: 'Corrupted Zone',  icon: '💀', types: ['glitch','void','ember'], minLevel: 30, color: '#1a001a' },
];

// Food items
export const FOODS = {
  dataBerry:   { name: 'Data Berry',    icon: '🫐', hunger: 20, happiness: 5,  price: 10 },
  pixelApple:  { name: 'Pixel Apple',   icon: '🍎', hunger: 35, happiness: 10, price: 25 },
  byteSteak:   { name: 'Byte Steak',    icon: '🥩', hunger: 60, happiness: 15, price: 50 },
  megaCake:    { name: 'Mega Cake',     icon: '🍰', hunger: 40, happiness: 30, price: 75 },
  glitchCandy: { name: 'Glitch Candy',  icon: '🍬', hunger: 10, happiness: 50, price: 100 },
};

// Items
export const ITEMS = {
  dataTrap:     { name: 'Data Trap',     icon: '📡', desc: 'Catch wild Nots (50% rate)', catchRate: 0.5, price: 30 },
  superTrap:    { name: 'Super Trap',    icon: '📡', desc: 'Better catch rate (75%)',     catchRate: 0.75, price: 80 },
  ultraTrap:    { name: 'Ultra Trap',    icon: '📡', desc: 'Best catch rate (90%)',       catchRate: 0.9, price: 200 },
  healChip:     { name: 'Heal Chip',     icon: '💊', desc: 'Restore 50 HP',              healAmount: 50, price: 20 },
  fullRestore:  { name: 'Full Restore',  icon: '💉', desc: 'Restore all HP',             healAmount: 9999, price: 100 },
};

// Helper: hash DNA string to number
export function hashDNA(dna) {
  let hash = 0;
  for (let i = 0; i < dna.length; i++) {
    hash = ((hash << 5) - hash + dna.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Generate random DNA
export function randomDNA() {
  const chars = '0123456789abcdef';
  let dna = '';
  for (let i = 0; i < 16; i++) {
    dna += chars[Math.floor(Math.random() * 16)];
  }
  return dna;
}

// Get type for DNA
export function getTypeForDNA(dna, forceType = null) {
  if (forceType) return forceType;
  const types = Object.keys(TYPES).filter(t => t !== 'glitch');
  const h = hashDNA(dna);
  // Small chance of glitch
  if (h % 100 < 3) return 'glitch';
  return types[h % types.length];
}

// Starters (pre-defined DNAs for consistency)
export const STARTERS = [
  { dna: 'a1b2c3d4e5f6a7b8', type: 'ember',  nickname: 'Pyrbit' },
  { dna: 'f8e7d6c5b4a39281', type: 'flux',   nickname: 'Aquabit' },
  { dna: '1234abcd5678ef90', type: 'bloom',  nickname: 'Florabit' },
];

// ═══════════════════════════════════════════
// V2 — Boss Battles
// ═══════════════════════════════════════════
export const BOSSES = {
  forest:  { dna: 'bb00bb00cc11dd22', type: 'bloom',  level: 10, stage: 'byte', nickname: 'Thornlord',  reward: { coins: 200, item: 'superTrap' } },
  ocean:   { dna: 'aa11ff22ee33dd44', type: 'flux',   level: 12, stage: 'byte', nickname: 'Tidequeen',  reward: { coins: 250, item: 'superTrap' } },
  volcano: { dna: 'ff0011223344aabb', type: 'ember',  level: 18, stage: 'kilo', nickname: 'Pyroking',   reward: { coins: 400, item: 'ultraTrap' } },
  mountain:{ dna: 'ee99dd88cc77bb66', type: 'spark',  level: 22, stage: 'kilo', nickname: 'Stormpeak',  reward: { coins: 500, item: 'ultraTrap' } },
  cave:    { dna: '1100220033004400', type: 'void',   level: 28, stage: 'kilo', nickname: 'Abyssmaw',   reward: { coins: 700, item: 'fullRestore' } },
  sky:     { dna: 'ffeeddccbbaa9988', type: 'lux',    level: 35, stage: 'mega', nickname: 'Solarius',   reward: { coins: 900, item: 'fullRestore' } },
  glitch:  { dna: 'deadbeefcafebabe', type: 'glitch', level: 45, stage: 'mega', nickname: 'ERR_NULL',   reward: { coins: 1500, item: 'ultraTrap' } },
};

// ═══════════════════════════════════════════
// V2 — Achievements
// ═══════════════════════════════════════════
export const ACHIEVEMENTS = [
  { id: 'first_not',     name: 'First Partner',      desc: 'Choose your first Not',           icon: '🥚', reward: 50,  check: (g) => g.team.length >= 1 },
  { id: 'catch_5',       name: 'Collector',           desc: 'Discover 5 different Nots',       icon: '📡', reward: 100, check: (g) => g.notdex.size >= 5 },
  { id: 'catch_15',      name: 'Researcher',          desc: 'Discover 15 different Nots',      icon: '🔬', reward: 300, check: (g) => g.notdex.size >= 15 },
  { id: 'catch_30',      name: 'Professor',           desc: 'Discover 30 different Nots',      icon: '🎓', reward: 600, check: (g) => g.notdex.size >= 30 },
  { id: 'win_1',         name: 'First Victory',       desc: 'Win your first battle',           icon: '⚔️', reward: 50,  check: (g) => g.totalBattles >= 1 },
  { id: 'win_10',        name: 'Fighter',             desc: 'Win 10 battles',                  icon: '🥊', reward: 150, check: (g) => g.totalBattles >= 10 },
  { id: 'win_50',        name: 'Champion',            desc: 'Win 50 battles',                  icon: '🏆', reward: 500, check: (g) => g.totalBattles >= 50 },
  { id: 'steps_100',     name: 'Walker',              desc: 'Take 100 steps exploring',        icon: '👟', reward: 75,  check: (g) => g.totalSteps >= 100 },
  { id: 'steps_500',     name: 'Adventurer',          desc: 'Take 500 steps exploring',        icon: '🧭', reward: 250, check: (g) => g.totalSteps >= 500 },
  { id: 'evolve_1',      name: 'Metamorphosis',       desc: 'Evolve a Not for the first time', icon: '🦋', reward: 200, check: (g) => g.team.some(c => c.stage !== 'bit') || g.storage.some(c => c.stage !== 'bit') },
  { id: 'evolve_mega',   name: 'Mega Breeder',        desc: 'Evolve a Not to Mega stage',      icon: '💫', reward: 500, check: (g) => g.team.some(c => c.stage === 'mega' || c.stage === 'giga') },
  { id: 'full_team',     name: 'Squad Goals',         desc: 'Have a full team of 6 Nots',      icon: '👥', reward: 200, check: (g) => g.team.length >= 6 },
  { id: 'rich',          name: 'Moneybags',           desc: 'Accumulate 1000 coins',           icon: '💰', reward: 100, check: (g) => g.coins >= 1000 },
  { id: 'boss_1',        name: 'Boss Slayer',         desc: 'Defeat your first zone boss',     icon: '👹', reward: 300, check: (g) => (g.bossesDefeated || []).length >= 1 },
  { id: 'boss_all',      name: 'Overlord',            desc: 'Defeat all zone bosses',          icon: '👑', reward: 2000,check: (g) => (g.bossesDefeated || []).length >= 7 },
  { id: 'fusion_1',      name: 'Gene Splicer',        desc: 'Perform your first fusion',       icon: '🧬', reward: 200, check: (g) => (g.totalFusions || 0) >= 1 },
  { id: 'fusion_5',      name: 'Mad Scientist',       desc: 'Perform 5 fusions',               icon: '⚗️', reward: 500, check: (g) => (g.totalFusions || 0) >= 5 },
  { id: 'daily_7',       name: 'Dedicated',           desc: 'Login 7 days in a row',           icon: '📅', reward: 300, check: (g) => (g.loginStreak || 0) >= 7 },
  { id: 'pvp_1',         name: 'Challenger',           desc: 'Complete a PvP battle',           icon: '🎯', reward: 200, check: (g) => (g.totalPvP || 0) >= 1 },
  { id: 'glitch_catch',  name: 'Bug Hunter',          desc: 'Catch a Glitch-type Not',         icon: '💀', reward: 500, check: (g) => [...g.notdex].some(d => getTypeForDNA(d) === 'glitch') || g.team.some(c => c.type === 'glitch') },
];

// ═══════════════════════════════════════════
// V2 — Daily Rewards
// ═══════════════════════════════════════════
export const DAILY_REWARDS = [
  { day: 1, coins: 50,  item: null,        desc: '50 coins' },
  { day: 2, coins: 75,  item: 'dataTrap',  desc: '75 coins + Data Trap' },
  { day: 3, coins: 100, item: 'healChip',  desc: '100 coins + Heal Chip' },
  { day: 4, coins: 125, item: 'dataTrap',  desc: '125 coins + Data Trap' },
  { day: 5, coins: 150, item: 'superTrap', desc: '150 coins + Super Trap' },
  { day: 6, coins: 200, item: 'healChip',  desc: '200 coins + Heal Chip' },
  { day: 7, coins: 500, item: 'ultraTrap', desc: '500 coins + Ultra Trap!' },
];

// ═══════════════════════════════════════════
// V2 — Fusion helpers
// ═══════════════════════════════════════════
export function fuseDNA(dna1, dna2) {
  let result = '';
  for (let i = 0; i < 16; i++) {
    const c1 = parseInt(dna1[i] || '0', 16);
    const c2 = parseInt(dna2[i] || '0', 16);
    // XOR with random mutation
    let val = c1 ^ c2;
    if (Math.random() < 0.2) val = (val + Math.floor(Math.random() * 4)) & 0xF;
    result += val.toString(16);
  }
  return result;
}

export function getFusionType(type1, type2) {
  if (type1 === type2) return type1;
  if (Math.random() < 0.1) return 'glitch'; // 10% chance of glitch fusion
  return Math.random() < 0.5 ? type1 : type2;
}

// ═══════════════════════════════════════════
// V3 — Move Learning System
// ═══════════════════════════════════════════
// Moves learned at specific levels, per type. Creature can know max 4 at once.
export const LEARNABLE_MOVES = {
  ember:  [
    { level: 1, move: 'tackle' }, { level: 3, move: 'emberClaw' }, { level: 6, move: 'fireball' },
    { level: 10, move: 'smokeScreen' }, { level: 14, move: 'flameRush' }, { level: 18, move: 'blazeKick' },
    { level: 22, move: 'magmaShield' }, { level: 28, move: 'heatWave' }, { level: 35, move: 'inferno' },
    { level: 42, move: 'eruption' },
  ],
  flux: [
    { level: 1, move: 'tackle' }, { level: 3, move: 'aquaJet' }, { level: 6, move: 'bubbleBurst' },
    { level: 10, move: 'whirlpool' }, { level: 14, move: 'aquaShield' }, { level: 18, move: 'tideSlam' },
    { level: 22, move: 'iceBeam' }, { level: 28, move: 'rainDance' }, { level: 35, move: 'torrent' },
    { level: 42, move: 'tsunami' },
  ],
  bloom: [
    { level: 1, move: 'scratch' }, { level: 3, move: 'vineWhip' }, { level: 6, move: 'sporeBurst' },
    { level: 10, move: 'rootGrab' }, { level: 14, move: 'thornStorm' }, { level: 18, move: 'synthesis' },
    { level: 22, move: 'leafBlade' }, { level: 28, move: 'photon' }, { level: 35, move: 'solarBeam' },
    { level: 42, move: 'petalDance' },
  ],
  spark: [
    { level: 1, move: 'tackle' }, { level: 3, move: 'zapStrike' }, { level: 6, move: 'sparkPulse' },
    { level: 10, move: 'staticField' }, { level: 14, move: 'discharge' }, { level: 18, move: 'magnetize' },
    { level: 22, move: 'thunderBolt' }, { level: 28, move: 'voltTackle' }, { level: 35, move: 'overcharge' },
    { level: 42, move: 'boltStrike' },
  ],
  void: [
    { level: 1, move: 'scratch' }, { level: 3, move: 'shadowClaw' }, { level: 6, move: 'shadowStep' },
    { level: 10, move: 'curseMark' }, { level: 14, move: 'phantomRush' }, { level: 18, move: 'soulDrain' },
    { level: 22, move: 'darkPulse' }, { level: 28, move: 'voidPulse' }, { level: 35, move: 'nightmare' },
    { level: 42, move: 'abyssStrike' },
  ],
  lux: [
    { level: 1, move: 'tackle' }, { level: 3, move: 'holyBeam' }, { level: 6, move: 'purify' },
    { level: 10, move: 'prismStrike' }, { level: 14, move: 'lightBarrier' }, { level: 18, move: 'blessing' },
    { level: 22, move: 'radiance' }, { level: 28, move: 'divinePulse' }, { level: 35, move: 'judgement' },
    { level: 42, move: 'solarFlare' },
  ],
  glitch: [
    { level: 1, move: 'tackle' }, { level: 3, move: 'overflow' }, { level: 6, move: 'corrupt' },
    { level: 10, move: 'memLeak' }, { level: 14, move: 'darkPulse' },
    { level: 22, move: 'segfault' }, { level: 35, move: 'bluScreen' },
  ],
};

// ═══════════════════════════════════════════
// V3 — Shiny System
// ═══════════════════════════════════════════
export const SHINY_RATE = 1 / 50; // 2% chance

export function isShiny(dna) {
  const h = hashDNA(dna);
  return (h % 50) === 0;
}

// ═══════════════════════════════════════════
// V3 — Materials & Drops
// ═══════════════════════════════════════════
export const MATERIALS = {
  emberShard:  { name: 'Ember Shard',  icon: '🔶', desc: 'Warm crystal fragment' },
  fluxDrop:    { name: 'Flux Drop',    icon: '💎', desc: 'Condensed water essence' },
  bloomSeed:   { name: 'Bloom Seed',   icon: '🌰', desc: 'Pulsing life seed' },
  sparkCore:   { name: 'Spark Core',   icon: '⚡', desc: 'Charged energy core' },
  voidDust:    { name: 'Void Dust',    icon: '🌑', desc: 'Particles of nothingness' },
  luxPrism:    { name: 'Lux Prism',    icon: '💠', desc: 'Refracting light crystal' },
  glitchByte:  { name: 'Glitch Byte',  icon: '📀', desc: 'Corrupted data fragment' },
  rawPixel:    { name: 'Raw Pixel',    icon: '⬜', desc: 'Basic digital matter' },
  dataFragment:{ name: 'Data Fragment', icon: '📊', desc: 'Encoded information' },
  chromaGem:   { name: 'Chroma Gem',   icon: '💜', desc: 'Shiny color crystal' },
  ancientChip: { name: 'Ancient Chip', icon: '🔧', desc: 'Relic processor chip' },
  notEssence:  { name: 'Not Essence',  icon: '✨', desc: 'Pure creature energy' },
};

// What types drop what materials
export const DROP_TABLE = {
  ember:  ['emberShard', 'rawPixel'],
  flux:   ['fluxDrop', 'rawPixel'],
  bloom:  ['bloomSeed', 'rawPixel'],
  spark:  ['sparkCore', 'rawPixel'],
  void:   ['voidDust', 'dataFragment'],
  lux:    ['luxPrism', 'dataFragment'],
  glitch: ['glitchByte', 'dataFragment'],
};

// Boss drops rare materials
export const BOSS_DROPS = ['ancientChip', 'notEssence', 'chromaGem'];

// ═══════════════════════════════════════════
// V3 — Crafting Recipes
// ═══════════════════════════════════════════
export const RECIPES = {
  dataTrap:    { name: 'Data Trap',     icon: '📡', materials: { rawPixel: 3 } },
  superTrap:   { name: 'Super Trap',    icon: '📡', materials: { rawPixel: 5, dataFragment: 2 } },
  ultraTrap:   { name: 'Ultra Trap',    icon: '📡', materials: { rawPixel: 5, dataFragment: 3, ancientChip: 1 } },
  shinyTrap:   { name: 'Shiny Trap',    icon: '✨', materials: { chromaGem: 3, notEssence: 2, dataFragment: 5 }, desc: 'Guarantees shiny on capture!' },
  healChip:    { name: 'Heal Chip',     icon: '💊', materials: { rawPixel: 2 } },
  fullRestore: { name: 'Full Restore',  icon: '💉', materials: { rawPixel: 3, dataFragment: 2 } },
  xpBooster:   { name: 'XP Booster',    icon: '📈', materials: { dataFragment: 3, notEssence: 1 }, desc: '+50% XP for 5 battles' },
  emberStone:  { name: 'Ember Stone',   icon: '🔥', materials: { emberShard: 10, notEssence: 1 }, desc: 'Force evolve Ember type' },
  fluxStone:   { name: 'Flux Stone',    icon: '💧', materials: { fluxDrop: 10, notEssence: 1 }, desc: 'Force evolve Flux type' },
  bloomStone:  { name: 'Bloom Stone',   icon: '🌿', materials: { bloomSeed: 10, notEssence: 1 }, desc: 'Force evolve Bloom type' },
  sparkStone:  { name: 'Spark Stone',   icon: '⚡', materials: { sparkCore: 10, notEssence: 1 }, desc: 'Force evolve Spark type' },
  voidStone:   { name: 'Void Stone',    icon: '🌑', materials: { voidDust: 10, notEssence: 1 }, desc: 'Force evolve Void type' },
  luxStone:    { name: 'Lux Stone',     icon: '✨', materials: { luxPrism: 10, notEssence: 1 }, desc: 'Force evolve Lux type' },
};

// ═══════════════════════════════════════════
// V4 — Engagement Systems
// ═══════════════════════════════════════════

// Daily Missions: 3 random objectives per day
export const MISSION_TEMPLATES = [
  { id: 'battle_3',   desc: 'Win 3 battles',          icon: '⚔️', target: 3, type: 'battles', reward: { coins: 80, mat: 'rawPixel', qty: 3 } },
  { id: 'battle_7',   desc: 'Win 7 battles',          icon: '⚔️', target: 7, type: 'battles', reward: { coins: 200, mat: 'dataFragment', qty: 2 } },
  { id: 'catch_1',    desc: 'Catch a wild Not',        icon: '📡', target: 1, type: 'catches', reward: { coins: 60, mat: 'rawPixel', qty: 2 } },
  { id: 'catch_3',    desc: 'Catch 3 Nots',            icon: '📡', target: 3, type: 'catches', reward: { coins: 150, mat: 'dataFragment', qty: 3 } },
  { id: 'steps_50',   desc: 'Walk 50 steps',           icon: '👟', target: 50, type: 'steps',  reward: { coins: 50, mat: 'rawPixel', qty: 2 } },
  { id: 'steps_150',  desc: 'Walk 150 steps',          icon: '🧭', target: 150, type: 'steps', reward: { coins: 120, mat: 'rawPixel', qty: 5 } },
  { id: 'train_2',    desc: 'Train 2 times',           icon: '🏋️', target: 2, type: 'trains', reward: { coins: 70, mat: 'dataFragment', qty: 1 } },
  { id: 'feed_3',     desc: 'Feed your Not 3 times',   icon: '🍖', target: 3, type: 'feeds',  reward: { coins: 40, mat: 'rawPixel', qty: 1 } },
  { id: 'craft_1',    desc: 'Craft an item',           icon: '⚒️', target: 1, type: 'crafts', reward: { coins: 100, mat: 'notEssence', qty: 1 } },
  { id: 'crit_1',     desc: 'Land a critical hit',     icon: '💥', target: 1, type: 'crits',  reward: { coins: 60, mat: 'rawPixel', qty: 2 } },
  { id: 'super_3',    desc: 'Land 3 super effective',   icon: '✨', target: 3, type: 'supers', reward: { coins: 90, mat: 'dataFragment', qty: 1 } },
  { id: 'heal_2',     desc: 'Use 2 healing items',     icon: '💊', target: 2, type: 'heals',  reward: { coins: 50, mat: 'rawPixel', qty: 2 } },
  { id: 'shiny_1',    desc: 'Find a shiny Not',        icon: '✨', target: 1, type: 'shinies', reward: { coins: 500, mat: 'chromaGem', qty: 2 } },
  { id: 'boss_1',     desc: 'Defeat a zone boss',      icon: '👹', target: 1, type: 'bosses', reward: { coins: 300, mat: 'ancientChip', qty: 1 } },
];

// Trainer Ranks (prestige system)
export const TRAINER_RANKS = [
  { rank: 'Newbie',       icon: '🟤', minXP: 0 },
  { rank: 'Rookie',       icon: '⚪', minXP: 100 },
  { rank: 'Tamer',        icon: '🟡', minXP: 500 },
  { rank: 'Handler',      icon: '🟠', minXP: 1500 },
  { rank: 'Expert',       icon: '🔴', minXP: 4000 },
  { rank: 'Master',       icon: '🟣', minXP: 10000 },
  { rank: 'Champion',     icon: '🔵', minXP: 25000 },
  { rank: 'Legend',        icon: '🟢', minXP: 60000 },
  { rank: 'Mythic',       icon: '⭐', minXP: 150000 },
  { rank: 'Digital God',  icon: '👑', minXP: 500000 },
];

export function getTrainerRank(xp) {
  let current = TRAINER_RANKS[0];
  for (const r of TRAINER_RANKS) {
    if (xp >= r.minXP) current = r;
  }
  return current;
}

export function getNextRank(xp) {
  for (let i = 0; i < TRAINER_RANKS.length; i++) {
    if (xp < TRAINER_RANKS[i].minXP) return TRAINER_RANKS[i];
  }
  return null; // max rank
}

// Wild encounter rarity tiers
export const RARITY_TIERS = [
  { name: 'Common',     color: '#aaaaaa', weight: 60, levelBonus: 0, statMult: 1.0 },
  { name: 'Uncommon',   color: '#44cc44', weight: 25, levelBonus: 1, statMult: 1.1 },
  { name: 'Rare',       color: '#4488ff', weight: 10, levelBonus: 2, statMult: 1.2 },
  { name: 'Epic',       color: '#cc44ff', weight: 4,  levelBonus: 3, statMult: 1.35 },
  { name: 'Legendary',  color: '#ffaa00', weight: 1,  levelBonus: 5, statMult: 1.5 },
];

export function rollRarity() {
  const total = RARITY_TIERS.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * total;
  for (const tier of RARITY_TIERS) {
    roll -= tier.weight;
    if (roll <= 0) return tier;
  }
  return RARITY_TIERS[0];
}

// Battle streak bonuses
export const STREAK_BONUSES = [
  { streak: 3,  label: '🔥 Hot Streak!',    xpMult: 1.25, coinMult: 1.25 },
  { streak: 5,  label: '🔥🔥 On Fire!',     xpMult: 1.5,  coinMult: 1.5 },
  { streak: 10, label: '🔥🔥🔥 Unstoppable!', xpMult: 2.0,  coinMult: 2.0 },
  { streak: 20, label: '💀 GODMODE',          xpMult: 3.0,  coinMult: 3.0 },
];

export function getStreakBonus(streak) {
  let best = null;
  for (const s of STREAK_BONUSES) {
    if (streak >= s.streak) best = s;
  }
  return best;
}

// Explore events: random discoveries while exploring
export const EXPLORE_EVENTS = [
  { id: 'coins',    chance: 0.15, text: '💰 Found coins on the ground!',     apply: (g) => { const c = 10 + Math.floor(Math.random()*30); g.coins += c; return `+${c} coins!`; } },
  { id: 'material', chance: 0.12, text: '📦 Discovered materials!',           apply: (g) => { const drops = ['rawPixel','dataFragment']; const d = drops[Math.floor(Math.random()*drops.length)]; g.materials[d] = (g.materials[d]||0)+1; return `+1 ${MATERIALS[d].icon}`; } },
  { id: 'heal',     chance: 0.08, text: '💚 Found a healing spring!',         apply: (g) => { if(g.active){g.active.heal(Math.floor(g.active.stats.maxHp*0.3));} return 'HP restored!'; } },
  { id: 'trap',     chance: 0.05, text: '📡 Found a trap on the ground!',     apply: (g) => { g.items.dataTrap=(g.items.dataTrap||0)+1; return '+1 Data Trap!'; } },
  { id: 'xp',       chance: 0.10, text: '⭐ Training aura surrounds you!',    apply: (g) => { if(g.active){g.active.addXP(20);} return '+20 XP!'; } },
  { id: 'rare_mat', chance: 0.03, text: '✨ Rare crystal formation!',         apply: (g) => { const r=['chromaGem','notEssence','ancientChip']; const d=r[Math.floor(Math.random()*r.length)]; g.materials[d]=(g.materials[d]||0)+1; return `+1 ${MATERIALS[d].icon} ${MATERIALS[d].name}!`; } },
  { id: 'nothing',  chance: 0.25, text: null, apply: () => null },
];

// Pick 3 random daily missions based on day seed
export function generateDailyMissions(daySeed) {
  const shuffled = [...MISSION_TEMPLATES].sort((a, b) => {
    const ha = ((daySeed * 31 + a.id.charCodeAt(0) * 17) | 0) & 0xFFFF;
    const hb = ((daySeed * 31 + b.id.charCodeAt(0) * 17) | 0) & 0xFFFF;
    return ha - hb;
  });
  return shuffled.slice(0, 3);
}

// ═══════════════════════════════════════════
// V5 — Card Combat System (Slay the Spire style)
// ═══════════════════════════════════════════

// Card catalog
export const CARDS = {
  // ── Universal ──
  strike:      { name: 'Strike',      type: 'neutral', cat: 'attack', cost: 1, damage: 6, block: 0, effect: null, desc: 'Deal 6 damage' },
  defend:      { name: 'Defend',      type: 'neutral', cat: 'block',  cost: 1, damage: 0, block: 5, effect: null, desc: 'Gain 5 shield' },
  bash:        { name: 'Bash',        type: 'neutral', cat: 'attack', cost: 2, damage: 8, block: 0, effect: 'vulnerable', effectVal: 2, desc: 'Deal 8. Apply 2 Vulnerable' },
  surge:       { name: 'Surge',       type: 'neutral', cat: 'skill',  cost: 0, damage: 0, block: 0, effect: 'energy', effectVal: 1, desc: 'Gain 1 DP' },
  heal_pulse:  { name: 'Heal Pulse',  type: 'neutral', cat: 'skill',  cost: 1, damage: 0, block: 0, effect: 'heal', effectVal: 6, desc: 'Heal 6 HP' },

  // ── Ember ──
  ember_slash: { name: 'Ember Slash', type: 'ember', cat: 'attack', cost: 1, damage: 8, block: 0, effect: null, desc: 'Deal 8 damage' },
  flame_wall:  { name: 'Flame Wall',  type: 'ember', cat: 'block',  cost: 1, damage: 0, block: 7, effect: null, desc: 'Gain 7 shield' },
  eruption:    { name: 'Eruption',    type: 'ember', cat: 'attack', cost: 2, damage: 14, block: 0, effect: 'burn', effectVal: 3, desc: 'Deal 14. Apply 3 Burn' },
  magma_armor: { name: 'Magma Armor', type: 'ember', cat: 'power',  cost: 2, damage: 0, block: 0, effect: 'thorns', effectVal: 3, desc: 'Gain 3 Thorns (permanent)' },
  inferno:     { name: 'Inferno',     type: 'ember', cat: 'attack', cost: 3, damage: 24, block: 0, effect: null, desc: 'Deal 24 damage' },

  // ── Flux ──
  aqua_jet:    { name: 'Aqua Jet',    type: 'flux',  cat: 'attack', cost: 1, damage: 7, block: 3, effect: null, desc: 'Deal 7. Gain 3 shield' },
  ice_shield:  { name: 'Ice Shield',  type: 'flux',  cat: 'block',  cost: 1, damage: 0, block: 8, effect: null, desc: 'Gain 8 shield' },
  tsunami:     { name: 'Tsunami',     type: 'flux',  cat: 'attack', cost: 2, damage: 5, block: 0, effect: 'weak', effectVal: 2, desc: 'Deal 5. Apply 2 Weak' },
  regen:       { name: 'Regenerate',  type: 'flux',  cat: 'power',  cost: 2, damage: 0, block: 0, effect: 'regen', effectVal: 3, desc: 'Heal 3 HP each turn' },
  tidal_wave:  { name: 'Tidal Wave',  type: 'flux',  cat: 'attack', cost: 3, damage: 12, block: 6, effect: null, desc: 'Deal 12. Gain 6 shield' },

  // ── Bloom ──
  vine_whip:   { name: 'Vine Whip',   type: 'bloom', cat: 'attack', cost: 1, damage: 7, block: 0, effect: null, desc: 'Deal 7 damage' },
  bark_skin:   { name: 'Bark Skin',   type: 'bloom', cat: 'block',  cost: 1, damage: 0, block: 9, effect: null, desc: 'Gain 9 shield' },
  spore_cloud: { name: 'Spore Cloud', type: 'bloom', cat: 'skill',  cost: 1, damage: 0, block: 0, effect: 'poison', effectVal: 4, desc: 'Apply 4 Poison' },
  photosyn:    { name: 'Photosyn',    type: 'bloom', cat: 'power',  cost: 2, damage: 0, block: 0, effect: 'regen', effectVal: 4, desc: 'Heal 4 HP each turn' },
  solar_beam:  { name: 'Solar Beam',  type: 'bloom', cat: 'attack', cost: 3, damage: 22, block: 0, effect: 'weak', effectVal: 1, desc: 'Deal 22. Apply 1 Weak' },

  // ── Spark ──
  zap:         { name: 'Zap',         type: 'spark', cat: 'attack', cost: 0, damage: 4, block: 0, effect: null, desc: 'Deal 4 damage' },
  static:      { name: 'Static',      type: 'spark', cat: 'block',  cost: 1, damage: 0, block: 6, effect: null, desc: 'Gain 6 shield' },
  overload:    { name: 'Overload',    type: 'spark', cat: 'attack', cost: 2, damage: 10, block: 0, effect: 'draw', effectVal: 2, desc: 'Deal 10. Draw 2 cards' },
  battery:     { name: 'Battery',     type: 'spark', cat: 'power',  cost: 1, damage: 0, block: 0, effect: 'energy_perm', effectVal: 1, desc: '+1 DP each turn' },
  thunderbolt: { name: 'Thunderbolt', type: 'spark', cat: 'attack', cost: 3, damage: 20, block: 0, effect: 'vulnerable', effectVal: 2, desc: 'Deal 20. Apply 2 Vulnerable' },

  // ── Void ──
  shadow_claw: { name: 'Shadow Claw', type: 'void',  cat: 'attack', cost: 1, damage: 9, block: 0, effect: null, desc: 'Deal 9 damage' },
  dark_shroud: { name: 'Dark Shroud', type: 'void',  cat: 'block',  cost: 1, damage: 0, block: 6, effect: 'weak', effectVal: 1, desc: 'Gain 6 shield. Apply 1 Weak' },
  soul_drain:  { name: 'Soul Drain',  type: 'void',  cat: 'attack', cost: 2, damage: 8, block: 0, effect: 'drain', effectVal: 8, desc: 'Deal 8. Heal 8 HP' },
  curse:       { name: 'Curse',       type: 'void',  cat: 'skill',  cost: 1, damage: 0, block: 0, effect: 'vulnerable', effectVal: 3, desc: 'Apply 3 Vulnerable' },
  void_blast:  { name: 'Void Blast',  type: 'void',  cat: 'attack', cost: 3, damage: 28, block: 0, effect: null, desc: 'Deal 28 damage' },

  // ── Lux ──
  holy_strike: { name: 'Holy Strike', type: 'lux',   cat: 'attack', cost: 1, damage: 6, block: 0, effect: 'heal', effectVal: 3, desc: 'Deal 6. Heal 3 HP' },
  light_ward:  { name: 'Light Ward',  type: 'lux',   cat: 'block',  cost: 1, damage: 0, block: 7, effect: 'heal', effectVal: 2, desc: 'Gain 7 shield. Heal 2' },
  purify:      { name: 'Purify',      type: 'lux',   cat: 'skill',  cost: 1, damage: 0, block: 0, effect: 'cleanse', effectVal: 0, desc: 'Remove all debuffs' },
  divine_aura: { name: 'Divine Aura', type: 'lux',   cat: 'power',  cost: 2, damage: 0, block: 0, effect: 'strength', effectVal: 2, desc: 'Gain 2 Strength (permanent)' },
  judgement:   { name: 'Judgement',    type: 'lux',   cat: 'attack', cost: 3, damage: 18, block: 8, effect: null, desc: 'Deal 18. Gain 8 shield' },

  // ── Glitch ──
  overflow:    { name: 'Overflow',    type: 'glitch', cat: 'attack', cost: 1, damage: 1, block: 0, effect: 'random_dmg', effectVal: 15, desc: 'Deal 1-15 random damage' },
  segfault:    { name: 'Segfault',    type: 'glitch', cat: 'skill',  cost: 0, damage: 0, block: 0, effect: 'draw', effectVal: 3, desc: 'Draw 3 cards' },
  bsod:        { name: 'BSOD',        type: 'glitch', cat: 'attack', cost: 2, damage: 15, block: 0, effect: 'vulnerable', effectVal: 3, desc: 'Deal 15. Apply 3 Vulnerable' },
};

// Starter decks per type (10 cards each)
export const STARTER_DECKS = {
  ember:  ['strike','strike','strike','defend','defend','ember_slash','ember_slash','flame_wall','bash','surge'],
  flux:   ['strike','strike','strike','defend','defend','aqua_jet','aqua_jet','ice_shield','tsunami','surge'],
  bloom:  ['strike','strike','strike','defend','defend','vine_whip','vine_whip','bark_skin','spore_cloud','surge'],
  spark:  ['strike','strike','defend','defend','defend','zap','zap','static','overload','surge'],
  void:   ['strike','strike','strike','defend','defend','shadow_claw','shadow_claw','dark_shroud','curse','surge'],
  lux:    ['strike','strike','strike','defend','defend','holy_strike','holy_strike','light_ward','purify','surge'],
  glitch: ['strike','strike','defend','defend','overflow','overflow','segfault','bash','surge','surge'],
};

// Enemy intent types
export const INTENT = {
  ATTACK: 'attack',
  BLOCK:  'block',
  BUFF:   'buff',
  DEBUFF: 'debuff',
  UNKNOWN:'unknown',
};
