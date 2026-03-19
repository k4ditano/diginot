// ═══════════════════════════════════════════
// DigiNot — Game Engine & State
// ═══════════════════════════════════════════

import {
  TYPES, STAGES, STAGE_LEVELS, TYPE_CHART, MOVES, MOVE_POOLS,
  ZONES, FOODS, ITEMS, STARTERS,
  generateName, generateStats, xpForLevel, hashDNA, randomDNA, getTypeForDNA
} from './data.js';

// ─── Creature Class ───
export class Creature {
  constructor({ dna, type, level = 1, xp = 0, nickname = null, stage = 'bit', hp = null,
                happiness = 50, hunger = 50, wins = 0, losses = 0, id = null }) {
    this.id = id || crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).substr(2);
    this.dna = dna;
    this.type = type;
    this.level = level;
    this.xp = xp;
    this.stage = stage;
    this.nickname = nickname || generateName(dna, type, stage);
    this.happiness = happiness;
    this.hunger = hunger;
    this.wins = wins;
    this.losses = losses;
    this.stats = generateStats(dna, level, stage);
    if (hp !== null) this.stats.hp = hp;
    this.status = null; // burn, freeze, poison, stun
    this.statusTurns = 0;
  }

  get moves() {
    const pool = MOVE_POOLS[this.type]?.[this.stage] || ['tackle', 'scratch'];
    return pool.slice(0, 4).map(id => ({ id, ...MOVES[id] }));
  }

  get displayName() { return this.nickname; }

  get typeIcon() { return TYPES[this.type]?.icon || '❓'; }

  get isAlive() { return this.stats.hp > 0; }

  get canEvolve() {
    const idx = STAGES.indexOf(this.stage);
    if (idx >= STAGES.length - 1) return false;
    const nextStage = STAGES[idx + 1];
    return this.level >= STAGE_LEVELS[nextStage];
  }

  evolve() {
    const idx = STAGES.indexOf(this.stage);
    if (idx >= STAGES.length - 1) return false;
    this.stage = STAGES[idx + 1];
    this.nickname = generateName(this.dna, this.type, this.stage);
    this.stats = generateStats(this.dna, this.level, this.stage);
    return true;
  }

  heal(amount = 9999) {
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
  }

  fullHeal() {
    this.stats.hp = this.stats.maxHp;
    this.status = null;
    this.statusTurns = 0;
  }

  addXP(amount) {
    this.xp += amount;
    let leveled = false;
    while (this.xp >= xpForLevel(this.level)) {
      this.xp -= xpForLevel(this.level);
      this.level++;
      this.stats = generateStats(this.dna, this.level, this.stage);
      leveled = true;
    }
    return leveled;
  }

  feed(food) {
    this.hunger = Math.min(100, this.hunger + food.hunger);
    this.happiness = Math.min(100, this.happiness + food.happiness);
  }

  train(statBoost) {
    const stats = this.stats;
    for (const [key, val] of Object.entries(statBoost)) {
      if (stats[key] !== undefined) stats[key] += val;
    }
    if (stats.hp > stats.maxHp) stats.hp = stats.maxHp;
  }

  serialize() {
    return {
      id: this.id, dna: this.dna, type: this.type, level: this.level,
      xp: this.xp, nickname: this.nickname, stage: this.stage,
      hp: this.stats.hp, happiness: this.happiness, hunger: this.hunger,
      wins: this.wins, losses: this.losses,
    };
  }

  static deserialize(data) {
    return new Creature(data);
  }

  // Export as shareable code
  toShareCode() {
    const d = { d: this.dna, t: this.type, l: this.level, s: this.stage, n: this.nickname };
    return btoa(JSON.stringify(d));
  }

  static fromShareCode(code) {
    try {
      const d = JSON.parse(atob(code));
      return new Creature({ dna: d.d, type: d.t, level: d.l, stage: d.s, nickname: d.n });
    } catch { return null; }
  }
}

// ─── Game State ───
export class GameState {
  constructor() {
    this.team = [];       // Array of Creature (max 6)
    this.storage = [];    // Extra creatures
    this.notdex = new Set(); // Set of DNA strings (discovered)
    this.coins = 100;
    this.items = { dataTrap: 5, healChip: 3 };
    this.foods = { dataBerry: 5, pixelApple: 2 };
    this.activeIdx = 0;   // Active creature index in team
    this.totalSteps = 0;
    this.totalBattles = 0;
    this.badges = [];
    this.started = false;
    this.lastSave = null;
  }

  get active() { return this.team[this.activeIdx] || null; }

  addToTeam(creature) {
    if (this.team.length < 6) {
      this.team.push(creature);
      this.notdex.add(creature.dna);
      return true;
    }
    return false;
  }

  addToStorage(creature) {
    this.storage.push(creature);
    this.notdex.add(creature.dna);
  }

  removeFromTeam(idx) {
    if (this.team.length <= 1) return false;
    const removed = this.team.splice(idx, 1)[0];
    if (this.activeIdx >= this.team.length) this.activeIdx = this.team.length - 1;
    return removed;
  }

  swapActive(idx) {
    if (idx >= 0 && idx < this.team.length) this.activeIdx = idx;
  }

  healAll() {
    this.team.forEach(c => c.fullHeal());
  }

  save() {
    const data = {
      team: this.team.map(c => c.serialize()),
      storage: this.storage.map(c => c.serialize()),
      notdex: [...this.notdex],
      coins: this.coins,
      items: this.items,
      foods: this.foods,
      activeIdx: this.activeIdx,
      totalSteps: this.totalSteps,
      totalBattles: this.totalBattles,
      badges: this.badges,
      started: this.started,
      lastSave: Date.now(),
    };
    localStorage.setItem('diginot_save', JSON.stringify(data));
  }

  load() {
    const raw = localStorage.getItem('diginot_save');
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      this.team = (data.team || []).map(d => Creature.deserialize(d));
      this.storage = (data.storage || []).map(d => Creature.deserialize(d));
      this.notdex = new Set(data.notdex || []);
      this.coins = data.coins ?? 100;
      this.items = data.items || { dataTrap: 5, healChip: 3 };
      this.foods = data.foods || { dataBerry: 5, pixelApple: 2 };
      this.activeIdx = data.activeIdx || 0;
      this.totalSteps = data.totalSteps || 0;
      this.totalBattles = data.totalBattles || 0;
      this.badges = data.badges || [];
      this.started = data.started || false;
      this.lastSave = data.lastSave;
      return true;
    } catch {
      return false;
    }
  }

  hasSave() {
    return localStorage.getItem('diginot_save') !== null;
  }

  deleteSave() {
    localStorage.removeItem('diginot_save');
  }
}

// ─── Wild Creature Generator ───
export function generateWildCreature(zone, playerLevel) {
  const dna = randomDNA();
  const types = zone.types;
  const type = types[Math.floor(Math.random() * types.length)];
  const minLvl = Math.max(1, zone.minLevel);
  const maxLvl = Math.min(playerLevel + 3, minLvl + 10);
  const level = Math.floor(Math.random() * (maxLvl - minLvl + 1)) + minLvl;

  // Determine stage based on level
  let stage = 'bit';
  for (const s of STAGES) {
    if (level >= STAGE_LEVELS[s]) stage = s;
  }

  return new Creature({ dna, type, level, stage });
}

// ─── Battle Engine ───
export class BattleEngine {
  constructor(playerCreature, enemyCreature) {
    this.player = playerCreature;
    this.enemy = enemyCreature;
    this.log = [];
    this.turn = 0;
    this.finished = false;
    this.winner = null;
    this.playerTurn = true;
  }

  getTypeMultiplier(atkType, defType) {
    if (atkType === 'neutral') return 1;
    const advantages = TYPE_CHART[atkType] || [];
    if (advantages.includes(defType)) return 1.5;
    // Check if defender has advantage (means attacker is weak)
    const defAdv = TYPE_CHART[defType] || [];
    if (defAdv.includes(atkType)) return 0.6;
    return 1;
  }

  calculateDamage(attacker, defender, move) {
    if (move.cat === 'status') return 0;
    const atk = move.cat === 'physical' ? attacker.stats.atk : attacker.stats.spAtk;
    const def = move.cat === 'physical' ? defender.stats.def : defender.stats.spDef;
    const typeBonus = attacker.type === move.type ? 1.2 : 1;
    const typeMult = this.getTypeMultiplier(move.type, defender.type);
    const random = 0.85 + Math.random() * 0.15;
    const baseDmg = ((2 * attacker.level / 5 + 2) * move.power * atk / def / 50 + 2);
    return Math.max(1, Math.floor(baseDmg * typeBonus * typeMult * random));
  }

  executeMove(attacker, defender, move) {
    const result = {
      attacker: attacker.displayName,
      defender: defender.displayName,
      move: move.name,
      damage: 0,
      missed: false,
      effective: 'normal',
      effect: null,
      fainted: false,
      healed: 0,
    };

    // Accuracy check
    if (Math.random() * 100 > move.acc) {
      result.missed = true;
      this.log.push(`${attacker.displayName} used ${move.name}... but missed!`);
      return result;
    }

    // Status moves
    if (move.cat === 'status') {
      if (move.effect === 'heal') {
        const healAmt = Math.floor(attacker.stats.maxHp * 0.4);
        attacker.heal(healAmt);
        result.healed = healAmt;
        this.log.push(`${attacker.displayName} used ${move.name} and recovered ${healAmt} HP!`);
        return result;
      }
      if (move.effect === 'scare') {
        // Lower enemy attack
        defender.stats.atk = Math.max(1, defender.stats.atk - 5);
        this.log.push(`${attacker.displayName} used ${move.name}! ${defender.displayName}'s ATK fell!`);
        return result;
      }
    }

    // Damage
    const dmg = this.calculateDamage(attacker, defender, move);
    result.damage = dmg;
    defender.stats.hp = Math.max(0, defender.stats.hp - dmg);

    // Type effectiveness
    const mult = this.getTypeMultiplier(move.type, defender.type);
    if (mult > 1) result.effective = 'super';
    else if (mult < 1) result.effective = 'weak';

    // Apply effect
    if (move.effect && Math.random() < 0.3 && !defender.status) {
      defender.status = move.effect;
      defender.statusTurns = 3;
      result.effect = move.effect;
    }

    // Faint check
    if (defender.stats.hp <= 0) result.fainted = true;

    let log = `${attacker.displayName} used ${move.name}! (${dmg} dmg)`;
    if (result.effective === 'super') log += ' Super effective!';
    if (result.effective === 'weak') log += ' Not very effective...';
    if (result.effect) log += ` ${defender.displayName} is ${result.effect}ed!`;
    if (result.fainted) log += ` ${defender.displayName} fainted!`;
    this.log.push(log);

    return result;
  }

  applyStatus(creature) {
    if (!creature.status || !creature.isAlive) return null;
    creature.statusTurns--;
    const result = { type: creature.status, damage: 0, skip: false };

    switch (creature.status) {
      case 'burn':
        result.damage = Math.max(1, Math.floor(creature.stats.maxHp * 0.06));
        creature.stats.hp = Math.max(0, creature.stats.hp - result.damage);
        this.log.push(`${creature.displayName} is burned! (-${result.damage} HP)`);
        break;
      case 'poison':
        result.damage = Math.max(1, Math.floor(creature.stats.maxHp * 0.08));
        creature.stats.hp = Math.max(0, creature.stats.hp - result.damage);
        this.log.push(`${creature.displayName} is poisoned! (-${result.damage} HP)`);
        break;
      case 'freeze':
        if (Math.random() < 0.5) {
          result.skip = true;
          this.log.push(`${creature.displayName} is frozen solid!`);
        }
        break;
      case 'stun':
        if (Math.random() < 0.4) {
          result.skip = true;
          this.log.push(`${creature.displayName} is stunned!`);
        }
        break;
    }

    if (creature.statusTurns <= 0) {
      creature.status = null;
      this.log.push(`${creature.displayName} recovered from status!`);
    }

    return result;
  }

  getAIMove() {
    const moves = this.enemy.moves;
    // AI: prefer super effective moves
    const superEffective = moves.filter(m => {
      if (m.cat === 'status') return false;
      return this.getTypeMultiplier(m.type, this.player.type) > 1;
    });
    if (superEffective.length > 0 && Math.random() < 0.6) {
      return superEffective[Math.floor(Math.random() * superEffective.length)];
    }
    // Otherwise pick random damaging move
    const damaging = moves.filter(m => m.power > 0);
    if (damaging.length > 0) return damaging[Math.floor(Math.random() * damaging.length)];
    return moves[Math.floor(Math.random() * moves.length)];
  }

  executeTurn(playerMoveId) {
    this.turn++;
    const playerMove = this.player.moves.find(m => m.id === playerMoveId) || this.player.moves[0];
    const enemyMove = this.getAIMove();
    const results = [];

    // Determine turn order
    const playerFirst = this.player.stats.spd >= this.enemy.stats.spd;
    const first = playerFirst ? { atk: this.player, def: this.enemy, move: playerMove, isPlayer: true }
                              : { atk: this.enemy, def: this.player, move: enemyMove, isPlayer: false };
    const second = playerFirst ? { atk: this.enemy, def: this.player, move: enemyMove, isPlayer: false }
                               : { atk: this.player, def: this.enemy, move: playerMove, isPlayer: true };

    // First attacker
    const status1 = this.applyStatus(first.atk);
    if (!status1?.skip && first.atk.isAlive) {
      results.push({ ...this.executeMove(first.atk, first.def, first.move), isPlayer: first.isPlayer });
    }

    // Check if battle over
    if (!this.enemy.isAlive || !this.player.isAlive) {
      this.finished = true;
      this.winner = this.player.isAlive ? 'player' : 'enemy';
      return results;
    }

    // Second attacker
    const status2 = this.applyStatus(second.atk);
    if (!status2?.skip && second.atk.isAlive) {
      results.push({ ...this.executeMove(second.atk, second.def, second.move), isPlayer: second.isPlayer });
    }

    // Check if battle over
    if (!this.enemy.isAlive || !this.player.isAlive) {
      this.finished = true;
      this.winner = this.player.isAlive ? 'player' : 'enemy';
    }

    return results;
  }

  // Capture attempt
  attemptCapture(trapType = 'dataTrap') {
    const trap = ITEMS[trapType];
    if (!trap) return false;
    const hpPercent = this.enemy.stats.hp / this.enemy.stats.maxHp;
    const catchChance = trap.catchRate * (1 - hpPercent * 0.5);
    const caught = Math.random() < catchChance;
    if (caught) {
      this.finished = true;
      this.winner = 'capture';
      this.log.push(`${this.enemy.displayName} was captured!`);
    } else {
      this.log.push(`${this.enemy.displayName} broke free!`);
    }
    return caught;
  }
}

// ─── Training Mini-games (results) ───
export function getTrainingReward(gameType, score) {
  const base = Math.max(1, Math.floor(score / 10));
  switch (gameType) {
    case 'rhythm':   return { spd: base, xp: score * 2 };
    case 'power':    return { atk: base, xp: score * 2 };
    case 'memory':   return { spAtk: base, xp: score * 2 };
    case 'dodge':    return { def: base, xp: score * 2 };
    // Legacy names
    case 'reaction': return { spd: base, xp: score * 2 };
    case 'tapping':  return { atk: base, xp: score * 2 };
    default: return { xp: score };
  }
}

// ─── Exploration ───
export function getAvailableZones(playerLevel) {
  return ZONES.filter(z => playerLevel >= z.minLevel);
}

export function rollEncounter() {
  return Math.random() < 0.35; // 35% chance per step
}

// ═══════════════════════════════════════════
// V2 — Extended Game State
// ═══════════════════════════════════════════

import { BOSSES, ACHIEVEMENTS, DAILY_REWARDS, fuseDNA, getFusionType } from './data.js';

// Patch GameState with V2 fields
const _origSave = GameState.prototype.save;
GameState.prototype.save = function() {
  // Ensure V2 fields exist before saving
  if (!this.bossesDefeated) this.bossesDefeated = [];
  if (!this.achievementsUnlocked) this.achievementsUnlocked = [];
  if (!this.lastLoginDate) this.lastLoginDate = null;
  if (!this.loginStreak) this.loginStreak = 0;
  if (!this.totalFusions) this.totalFusions = 0;
  if (!this.totalPvP) this.totalPvP = 0;
  if (!this.dailyClaimed) this.dailyClaimed = false;

  const data = {
    team: this.team.map(c => c.serialize()),
    storage: this.storage.map(c => c.serialize()),
    notdex: [...this.notdex],
    coins: this.coins,
    items: this.items,
    foods: this.foods,
    activeIdx: this.activeIdx,
    totalSteps: this.totalSteps,
    totalBattles: this.totalBattles,
    badges: this.badges,
    started: this.started,
    lastSave: Date.now(),
    // V2 fields
    bossesDefeated: this.bossesDefeated,
    achievementsUnlocked: this.achievementsUnlocked,
    lastLoginDate: this.lastLoginDate,
    loginStreak: this.loginStreak,
    totalFusions: this.totalFusions,
    totalPvP: this.totalPvP,
    dailyClaimed: this.dailyClaimed,
  };
  localStorage.setItem('diginot_save', JSON.stringify(data));
};

const _origLoad = GameState.prototype.load;
GameState.prototype.load = function() {
  const raw = localStorage.getItem('diginot_save');
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    this.team = (data.team || []).map(d => Creature.deserialize(d));
    this.storage = (data.storage || []).map(d => Creature.deserialize(d));
    this.notdex = new Set(data.notdex || []);
    this.coins = data.coins ?? 100;
    this.items = data.items || { dataTrap: 5, healChip: 3 };
    this.foods = data.foods || { dataBerry: 5, pixelApple: 2 };
    this.activeIdx = data.activeIdx || 0;
    this.totalSteps = data.totalSteps || 0;
    this.totalBattles = data.totalBattles || 0;
    this.badges = data.badges || [];
    this.started = data.started || false;
    this.lastSave = data.lastSave;
    // V2 fields
    this.bossesDefeated = data.bossesDefeated || [];
    this.achievementsUnlocked = data.achievementsUnlocked || [];
    this.lastLoginDate = data.lastLoginDate || null;
    this.loginStreak = data.loginStreak || 0;
    this.totalFusions = data.totalFusions || 0;
    this.totalPvP = data.totalPvP || 0;
    this.dailyClaimed = data.dailyClaimed || false;
    return true;
  } catch {
    return false;
  }
};

// ─── V2: Boss Encounter ───
export function generateBoss(zoneId) {
  const boss = BOSSES[zoneId];
  if (!boss) return null;
  const creature = new Creature({
    dna: boss.dna, type: boss.type, level: boss.level,
    stage: boss.stage, nickname: `👹 ${boss.nickname}`
  });
  // Boss has 1.5x stats
  const s = creature.stats;
  s.maxHp = Math.floor(s.maxHp * 1.5);
  s.hp = s.maxHp;
  s.atk = Math.floor(s.atk * 1.3);
  s.def = Math.floor(s.def * 1.3);
  s.spAtk = Math.floor(s.spAtk * 1.3);
  s.spDef = Math.floor(s.spDef * 1.3);
  creature._isBoss = true;
  creature._zoneId = zoneId;
  return creature;
}

// ─── V2: Fusion ───
export function performFusion(creature1, creature2) {
  const newDNA = fuseDNA(creature1.dna, creature2.dna);
  const newType = getFusionType(creature1.type, creature2.type);
  const newLevel = Math.max(1, Math.floor((creature1.level + creature2.level) / 2) - 3);

  let stage = 'bit';
  for (const s of STAGES) {
    if (newLevel >= STAGE_LEVELS[s]) stage = s;
  }

  const baby = new Creature({ dna: newDNA, type: newType, level: newLevel, stage });
  // Fusion boost: slightly better base stats
  baby.stats.maxHp += 5;
  baby.stats.hp = baby.stats.maxHp;
  return baby;
}

// ─── V2: Achievement Checker ───
export function checkAchievements(gameState) {
  if (!gameState.achievementsUnlocked) gameState.achievementsUnlocked = [];
  const newlyUnlocked = [];
  for (const ach of ACHIEVEMENTS) {
    if (gameState.achievementsUnlocked.includes(ach.id)) continue;
    if (ach.check(gameState)) {
      gameState.achievementsUnlocked.push(ach.id);
      gameState.coins += ach.reward;
      newlyUnlocked.push(ach);
    }
  }
  return newlyUnlocked;
}

// ─── V2: Daily System ───
export function checkDailyLogin(gameState) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  if (gameState.lastLoginDate === today) return null; // already claimed today

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (gameState.lastLoginDate === yesterday) {
    gameState.loginStreak = (gameState.loginStreak || 0) + 1;
  } else if (gameState.lastLoginDate !== today) {
    gameState.loginStreak = 1;
  }

  gameState.lastLoginDate = today;
  gameState.dailyClaimed = false;

  const dayIdx = ((gameState.loginStreak - 1) % DAILY_REWARDS.length);
  return DAILY_REWARDS[dayIdx];
}

export function claimDailyReward(gameState, reward) {
  if (gameState.dailyClaimed) return false;
  gameState.coins += reward.coins;
  if (reward.item) {
    gameState.items[reward.item] = (gameState.items[reward.item] || 0) + 1;
  }
  gameState.dailyClaimed = true;
  return true;
}

// ─── V2: PvP Async Battle ───
export function exportTeamCode(team) {
  const data = team.map(c => ({ d: c.dna, t: c.type, l: c.level, s: c.stage, n: c.nickname }));
  return btoa(JSON.stringify(data));
}

export function importTeamCode(code) {
  try {
    const data = JSON.parse(atob(code));
    return data.map(d => new Creature({ dna: d.d, type: d.t, level: d.l, stage: d.s, nickname: d.n }));
  } catch { return null; }
}

export function simulatePvPBattle(team1, team2) {
  const log = [];
  let t1idx = 0, t2idx = 0;
  const t1 = team1.map(c => { const nc = new Creature(c.serialize()); nc.fullHeal(); return nc; });
  const t2 = team2.map(c => { const nc = new Creature(c.serialize()); nc.fullHeal(); return nc; });

  let turns = 0;
  while (t1idx < t1.length && t2idx < t2.length && turns < 100) {
    turns++;
    const c1 = t1[t1idx], c2 = t2[t2idx];
    const battle = new BattleEngine(c1, c2);

    // Auto-battle until one faints
    while (!battle.finished && turns < 200) {
      const move1 = c1.moves[Math.floor(Math.random() * c1.moves.length)];
      battle.executeTurn(move1.id);
      turns++;
    }

    log.push(...battle.log);
    if (!c1.isAlive) { t1idx++; log.push(`${c1.displayName} fainted! `); }
    if (!c2.isAlive) { t2idx++; log.push(`${c2.displayName} fainted!`); }
  }

  return {
    winner: t1idx >= t1.length ? 'team2' : 'team1',
    log,
    t1remaining: t1.length - t1idx,
    t2remaining: t2.length - t2idx,
  };
}
