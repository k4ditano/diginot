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
