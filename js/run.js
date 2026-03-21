// ═══════════════════════════════════════════
// DigiNot — Roguelike Run System
// ═══════════════════════════════════════════

import { CARDS, STARTER_DECKS, ZONES, TYPES, BOSSES } from './data.js';
import { hashDNA } from './data.js';

// Node types
export const NODE = {
  BATTLE:  'battle',
  ELITE:   'elite',
  EVENT:   'event',
  REST:    'rest',
  SHOP:    'shop',
  BOSS:    'boss',
  TREASURE:'treasure',
};

const NODE_ICONS = {
  [NODE.BATTLE]:  '⚔️',
  [NODE.ELITE]:   '💀',
  [NODE.EVENT]:   '❓',
  [NODE.REST]:    '🏕️',
  [NODE.SHOP]:    '🛒',
  [NODE.BOSS]:    '👹',
  [NODE.TREASURE]:'📦',
};

// ─── Relics ───
export const RELICS = {
  burning_blood:  { name: 'Burning Blood',   icon: '🩸', desc: 'Heal 6 HP after each battle',       onBattleEnd: (run) => { run.hp = Math.min(run.maxHp, run.hp + 6); } },
  vajra:          { name: 'Vajra',            icon: '💎', desc: '+1 Strength at start of each battle', onBattleStart: (cb) => { cb.pBuffs.strength += 1; } },
  anchor:         { name: 'Anchor',           icon: '⚓', desc: 'Start each battle with 10 Shield',   onBattleStart: (cb) => { cb.pShield += 10; } },
  bag_of_marbles: { name: 'Bag of Marbles',   icon: '🔮', desc: 'Enemy starts Vulnerable 1',          onBattleStart: (cb) => { cb.eBuffs.vulnerable += 1; } },
  data_disk:      { name: 'Data Disk',        icon: '💿', desc: '+1 card draw per turn',              onBattleStart: (cb) => { cb._drawCards(1); } },
  happy_flower:   { name: 'Happy Flower',     icon: '🌸', desc: '+1 max DP',                          onBattleStart: (cb) => { cb.maxDP += 1; cb.dp += 1; } },
  meat_on_bone:   { name: 'Meat on the Bone', icon: '🍖', desc: 'If HP < 50% at end of battle, heal 12', onBattleEnd: (run) => { if (run.hp < run.maxHp * 0.5) run.hp = Math.min(run.maxHp, run.hp + 12); } },
  pen_nib:        { name: 'Pen Nib',          icon: '🖊️', desc: 'Every 10th attack deals double',      passive: true },
  red_skull:      { name: 'Red Skull',        icon: '💀', desc: '+3 Strength when HP < 50%',           onBattleStart: (cb, run) => { if (run.hp < run.maxHp * 0.5) cb.pBuffs.strength += 3; } },
  bronze_scales:  { name: 'Bronze Scales',    icon: '🐉', desc: 'Start each battle with 3 Thorns',    onBattleStart: (cb) => { cb.pBuffs.thorns += 3; } },
  blood_vial:     { name: 'Blood Vial',       icon: '🧪', desc: 'Heal 2 HP each battle',              onBattleEnd: (run) => { run.hp = Math.min(run.maxHp, run.hp + 2); } },
  lantern:        { name: 'Lantern',          icon: '🏮', desc: '+1 DP first turn of each battle',    onBattleStart: (cb) => { cb.dp += 1; } },
};

// ─── Events ───
export const EVENTS = [
  {
    id: 'shrine', title: '🕯️ Digital Shrine',
    text: 'A glowing shrine hums with energy. It offers a trade...',
    choices: [
      { label: 'Offer 10 HP → Gain random card', apply: (run) => { run.hp = Math.max(1, run.hp - 10); const pool = getCardPool(run); run.deck.push(pool[Math.floor(Math.random()*pool.length)]); return 'You gained a card!'; } },
      { label: 'Offer 50 gold → Heal 20 HP', apply: (run) => { if (run.gold < 50) return 'Not enough gold!'; run.gold -= 50; run.hp = Math.min(run.maxHp, run.hp + 20); return 'Healed 20 HP!'; } },
      { label: 'Leave', apply: () => 'You walk away.' },
    ]
  },
  {
    id: 'merchant', title: '🧑‍💼 Wandering Merchant',
    text: 'A shady figure offers to remove a card from your deck... for a price.',
    choices: [
      { label: 'Pay 75 gold → Remove a Strike', apply: (run) => { if (run.gold < 75) return 'Not enough gold!'; const idx = run.deck.indexOf('strike'); if (idx === -1) return 'No Strikes to remove!'; run.deck.splice(idx, 1); run.gold -= 75; return 'Removed a Strike!'; } },
      { label: 'Pay 75 gold → Remove a Defend', apply: (run) => { if (run.gold < 75) return 'Not enough gold!'; const idx = run.deck.indexOf('defend'); if (idx === -1) return 'No Defends to remove!'; run.deck.splice(idx, 1); run.gold -= 75; return 'Removed a Defend!'; } },
      { label: 'Leave', apply: () => 'Maybe next time.' },
    ]
  },
  {
    id: 'fountain', title: '⛲ Data Fountain',
    text: 'Pure data flows from a fountain. You feel its energy.',
    choices: [
      { label: 'Drink → Heal to full HP', apply: (run) => { run.hp = run.maxHp; return 'Fully healed!'; } },
      { label: 'Bathe → Upgrade a random card', apply: (run) => { return 'A card glows brighter! (upgraded)'; } },
    ]
  },
  {
    id: 'gambler', title: '🎰 The Gambler',
    text: '"Feeling lucky? Bet your HP for gold!"',
    choices: [
      { label: 'Bet 15 HP (50% → 100 gold)', apply: (run) => { run.hp = Math.max(1, run.hp - 15); if (Math.random() < 0.5) { run.gold += 100; return 'You won 100 gold!'; } return 'You lost the bet...'; } },
      { label: 'Bet 30 HP (50% → Relic)', apply: (run) => { run.hp = Math.max(1, run.hp - 30); if (Math.random() < 0.5) { const r = getRandomRelic(run); run.relics.push(r); return `Won ${RELICS[r].icon} ${RELICS[r].name}!`; } return 'Bad luck...'; } },
      { label: 'Walk away', apply: () => 'Smart choice.' },
    ]
  },
  {
    id: 'chest', title: '📦 Abandoned Cache',
    text: 'An old data cache. It might be trapped...',
    choices: [
      { label: 'Open carefully (gain 30 gold)', apply: (run) => { run.gold += 30; return '+30 gold!'; } },
      { label: 'Force open (50% relic, 50% lose 10 HP)', apply: (run) => { if (Math.random() < 0.5) { const r = getRandomRelic(run); run.relics.push(r); return `Found ${RELICS[r].icon} ${RELICS[r].name}!`; } run.hp = Math.max(1, run.hp - 10); return 'It was trapped! -10 HP'; } },
      { label: 'Ignore', apply: () => 'You leave it alone.' },
    ]
  },
];

function getRandomRelic(run) {
  const owned = new Set(run.relics);
  const available = Object.keys(RELICS).filter(r => !owned.has(r));
  return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : 'burning_blood';
}

function getCardPool(run) {
  const type = run.notType || 'ember';
  const allCards = Object.keys(CARDS).filter(id => {
    const c = CARDS[id];
    return c.type === type || c.type === 'neutral';
  });
  return allCards;
}

// ─── Generate Run Map (node graph) ───
export function generateRunMap(zone, seed = Date.now()) {
  const rng = seededRNG(seed);
  const floors = 15;
  const map = []; // array of floors, each floor = array of nodes

  for (let f = 0; f < floors; f++) {
    const floor = [];
    // Determine node count (1-3 paths per floor)
    const nodeCount = f === 0 ? 1 : f === floors - 1 ? 1 : 1 + Math.floor(rng() * 2.5);

    for (let n = 0; n < nodeCount; n++) {
      let type;
      if (f === 0) type = NODE.BATTLE;
      else if (f === floors - 1) type = NODE.BOSS;
      else if (f === 7) type = NODE.TREASURE; // mid-run treasure
      else {
        const roll = rng();
        if (f % 5 === 4) type = NODE.REST; // rest every 5 floors
        else if (roll < 0.45) type = NODE.BATTLE;
        else if (roll < 0.60) type = NODE.ELITE;
        else if (roll < 0.78) type = NODE.EVENT;
        else if (roll < 0.88) type = NODE.SHOP;
        else type = NODE.REST;
      }

      // Connections to next floor
      const nextFloor = f + 1;
      const connections = [];
      if (nextFloor < floors) {
        // Connect to 1-2 nodes on next floor
        const nextCount = f === floors - 2 ? 1 : 1 + Math.floor(rng() * 2);
        for (let c = 0; c < nextCount; c++) {
          connections.push(c % 3); // will be clamped to actual next floor node count
        }
      }

      floor.push({
        id: `${f}-${n}`,
        floor: f,
        idx: n,
        type,
        icon: NODE_ICONS[type],
        connections,
        visited: false,
        enemyLevel: Math.floor(zone.minLevel + f * 1.5),
      });
    }
    map.push(floor);
  }

  // Fix connections to point to valid indices
  for (let f = 0; f < map.length - 1; f++) {
    const nextLen = map[f + 1].length;
    for (const node of map[f]) {
      node.connections = [...new Set(node.connections.map(c => Math.min(c, nextLen - 1)))];
      if (node.connections.length === 0) node.connections = [0];
    }
  }

  return map;
}

// ─── Run State ───
export function createRun(zone, creature) {
  const deck = [...(STARTER_DECKS[creature.type] || STARTER_DECKS.ember)];
  return {
    zone,
    notType: creature.type,
    map: generateRunMap(zone),
    currentFloor: 0,
    currentNode: 0,
    hp: creature.stats.maxHp,
    maxHp: creature.stats.maxHp,
    gold: 50,
    deck,
    relics: [],
    score: 0,
    active: true,
    creature, // reference to the creature
  };
}

// ─── Card Reward: pick 3 random cards ───
export function generateCardReward(run) {
  const pool = getCardPool(run);
  const picks = [];
  const used = new Set(run.deck);
  // Prefer cards not already in deck
  const preferred = pool.filter(c => !used.has(c));
  const source = preferred.length >= 3 ? preferred : pool;

  while (picks.length < 3 && source.length > 0) {
    const idx = Math.floor(Math.random() * source.length);
    const card = source.splice(idx, 1)[0];
    if (!picks.includes(card)) picks.push(card);
  }
  return picks;
}

// ─── Shop items ───
export function generateShopItems(run) {
  const pool = getCardPool(run);
  const cards = [];
  for (let i = 0; i < 5; i++) {
    const c = pool[Math.floor(Math.random() * pool.length)];
    const price = CARDS[c]?.cost >= 2 ? 80 : 40;
    cards.push({ cardId: c, price });
  }
  // Also offer card removal
  return { cards, removePrice: 75, healPrice: 30, healAmount: 15 };
}

// Seeded RNG
function seededRNG(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
