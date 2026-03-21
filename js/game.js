// ═══════════════════════════════════════════
// DigiNot — Game Engine & State
// ═══════════════════════════════════════════

import {
  TYPES, STAGES, STAGE_LEVELS, TYPE_CHART, MOVES, MOVE_POOLS,
  ZONES, FOODS, ITEMS, STARTERS,
  generateName, generateStats, xpForLevel, hashDNA, randomDNA, getTypeForDNA,
  BOSSES, ACHIEVEMENTS, DAILY_REWARDS, fuseDNA, getFusionType,
  LEARNABLE_MOVES, MATERIALS, DROP_TABLE, BOSS_DROPS, RECIPES, SHINY_RATE, isShiny,
  rollRarity, EXPLORE_EVENTS, generateDailyMissions, getStreakBonus, getTrainerRank
} from './data.js';

// ─── Creature Class ───
export class Creature {
  constructor({ dna, type, level = 1, xp = 0, nickname = null, stage = 'bit', hp = null,
                happiness = 50, hunger = 50, wins = 0, losses = 0, id = null,
                learnedMoves = null, isShinyFlag = null }) {
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
    this.status = null;
    this.statusTurns = 0;
    // V3: shiny, learned moves, stat stages
    this.isShiny = isShinyFlag !== null ? isShinyFlag : isShiny(dna);
    this.learnedMoves = learnedMoves || this._initMoves();
    this.statStages = { atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0, acc: 0 };
  }

  _initMoves() {
    // Start with moves learnable at current level or below
    const pool = LEARNABLE_MOVES[this.type] || [];
    const available = pool.filter(e => e.level <= this.level);
    const picks = available.slice(-4).map(e => e.move);
    // If less than 2, pad with type pool defaults
    if (picks.length < 2) {
      const defaults = MOVE_POOLS[this.type]?.bit || ['tackle'];
      defaults.forEach(m => { if (!picks.includes(m)) picks.push(m); });
    }
    return picks.slice(0, 4);
  }

  get moves() {
    return this.learnedMoves.map(id => ({ id, ...MOVES[id] })).filter(m => m.name);
  }

  get displayName() { return this.nickname; }
  get typeIcon() { return TYPES[this.type]?.icon || '❓'; }
  get isAlive() { return this.stats.hp > 0; }

  get canEvolve() {
    const idx = STAGES.indexOf(this.stage);
    if (idx >= STAGES.length - 1) return false;
    return this.level >= STAGE_LEVELS[STAGES[idx + 1]];
  }

  // Effective stat considering stat stages
  getStat(stat) {
    const base = this.stats[stat] || 0;
    const stage = this.statStages?.[stat] || 0;
    const mult = stage >= 0
      ? (2 + stage) / 2
      : 2 / (2 - stage);
    return Math.max(1, Math.floor(base * mult));
  }

  resetStatStages() {
    this.statStages = { atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0, acc: 0 };
  }

  changeStatStage(stat, delta) {
    if (!this.statStages) this.statStages = { atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0, acc: 0 };
    const key = stat === 'accuracy' ? 'acc' : stat;
    if (!(key in this.statStages)) return null;
    const old = this.statStages[key];
    this.statStages[key] = Math.max(-6, Math.min(6, old + delta));
    const changed = this.statStages[key] - old;
    if (changed > 0) return `${this.displayName}'s ${key.toUpperCase()} rose!`;
    if (changed < 0) return `${this.displayName}'s ${key.toUpperCase()} fell!`;
    return `${this.displayName}'s ${key.toUpperCase()} won't go higher!`;
  }

  // Check if a new move can be learned at current level
  getNewMoves() {
    const pool = LEARNABLE_MOVES[this.type] || [];
    return pool
      .filter(e => e.level === this.level && !this.learnedMoves.includes(e.move))
      .map(e => e.move);
  }

  forgetMove(idx) {
    this.learnedMoves.splice(idx, 1);
  }

  learnMove(moveId) {
    if (this.learnedMoves.length < 4) {
      this.learnedMoves.push(moveId);
      return true;
    }
    return false; // need to forget one first
  }

  evolve() {
    const idx = STAGES.indexOf(this.stage);
    if (idx >= STAGES.length - 1) return false;
    this.stage = STAGES[idx + 1];
    this.nickname = generateName(this.dna, this.type, this.stage);
    const oldHpRatio = this.stats.hp / this.stats.maxHp;
    this.stats = generateStats(this.dna, this.level, this.stage);
    this.stats.hp = Math.max(1, Math.floor(this.stats.maxHp * oldHpRatio));
    return true;
  }

  heal(amount = 9999) {
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
  }

  fullHeal() {
    this.stats.hp = this.stats.maxHp;
    this.status = null;
    this.statusTurns = 0;
    this.resetStatStages();
  }

  addXP(amount) {
    this.xp += amount;
    let leveled = false;
    while (this.xp >= xpForLevel(this.level)) {
      this.xp -= xpForLevel(this.level);
      this.level++;
      const oldHpRatio = this.stats.hp / this.stats.maxHp;
      this.stats = generateStats(this.dna, this.level, this.stage);
      this.stats.hp = Math.floor(this.stats.maxHp * oldHpRatio);
      leveled = true;
    }
    return leveled;
  }

  feed(food) {
    this.hunger = Math.min(100, this.hunger + food.hunger);
    this.happiness = Math.min(100, this.happiness + food.happiness);
  }

  train(statBoost) {
    for (const [key, val] of Object.entries(statBoost)) {
      if (this.stats[key] !== undefined) this.stats[key] += val;
    }
    if (this.stats.hp > this.stats.maxHp) this.stats.hp = this.stats.maxHp;
  }

  serialize() {
    return {
      id: this.id, dna: this.dna, type: this.type, level: this.level,
      xp: this.xp, nickname: this.nickname, stage: this.stage,
      hp: this.stats.hp, happiness: this.happiness, hunger: this.hunger,
      wins: this.wins, losses: this.losses,
      learnedMoves: this.learnedMoves,
      isShinyFlag: this.isShiny,
    };
  }

  static deserialize(data) { return new Creature(data); }

  toShareCode() {
    const d = { d: this.dna, t: this.type, l: this.level, s: this.stage, n: this.nickname, sh: this.isShiny ? 1 : 0 };
    return btoa(JSON.stringify(d));
  }

  static fromShareCode(code) {
    try {
      const d = JSON.parse(atob(code));
      return new Creature({ dna: d.d, type: d.t, level: d.l, stage: d.s, nickname: d.n, isShinyFlag: !!d.sh });
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
export function generateWildCreature(zone, playerLevel, forceShiny = false) {
  const dna = randomDNA();
  const types = zone.types;
  const type = types[Math.floor(Math.random() * types.length)];
  const rarity = rollRarity();
  const minLvl = Math.max(1, zone.minLevel);
  const maxLvl = Math.min(playerLevel + 3, minLvl + 10);
  const level = Math.floor(Math.random() * (maxLvl - minLvl + 1)) + minLvl + rarity.levelBonus;

  let stage = 'bit';
  for (const s of STAGES) {
    if (level >= STAGE_LEVELS[s]) stage = s;
  }

  const isShinyFlag = forceShiny || Math.random() < SHINY_RATE;
  const creature = new Creature({ dna, type, level, stage, isShinyFlag });
  creature._rarity = rarity;
  // Apply stat multiplier from rarity
  if (rarity.statMult > 1) {
    const m = rarity.statMult;
    creature.stats.maxHp = Math.floor(creature.stats.maxHp * m);
    creature.stats.hp = creature.stats.maxHp;
    creature.stats.atk = Math.floor(creature.stats.atk * m);
    creature.stats.def = Math.floor(creature.stats.def * m);
    creature.stats.spAtk = Math.floor(creature.stats.spAtk * m);
    creature.stats.spDef = Math.floor(creature.stats.spDef * m);
    creature.stats.spd = Math.floor(creature.stats.spd * m);
  }
  return creature;
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
    const atk = move.cat === 'physical'
      ? attacker.getStat('atk')
      : attacker.getStat('spAtk');
    const def = move.cat === 'physical'
      ? defender.getStat('def')
      : defender.getStat('spDef');
    const typeBonus = attacker.type === move.type ? 1.2 : 1;
    const typeMult = this.getTypeMultiplier(move.type, defender.type);
    const random = 0.85 + Math.random() * 0.15;
    const baseDmg = ((2 * attacker.level / 5 + 2) * move.power * atk / def / 50 + 2);
    let dmg = Math.max(1, Math.floor(baseDmg * typeBonus * typeMult * random));
    if (attacker.status === 'burn' && move.cat === 'physical') dmg = Math.floor(dmg * 0.5);
    return dmg;
  }

  executeMove(attacker, defender, move) {
    const result = {
      attacker: attacker.displayName, defender: defender.displayName,
      move: move.name, damage: 0, missed: false, effective: 'normal',
      effect: null, fainted: false, healed: 0, statMsg: null, isCrit: false,
    };

    // Accuracy check (modified by acc stage)
    const accMult = attacker.statStages?.acc >= 0
      ? (3 + (attacker.statStages.acc || 0)) / 3
      : 3 / (3 - (attacker.statStages.acc || 0));
    if (Math.random() * 100 > move.acc * accMult) {
      result.missed = true;
      this.log.push(`${attacker.displayName} used ${move.name}... missed!`);
      return result;
    }

    // ── STATUS MOVES ──
    if (move.cat === 'status') {
      let msg = '';
      switch (move.effect) {
        case 'heal': {
          const amt = Math.floor(attacker.stats.maxHp * 0.4);
          attacker.heal(amt); result.healed = amt;
          msg = `${attacker.displayName} recovered ${amt} HP!`; break;
        }
        case 'defUp':    msg = attacker.changeStatStage('def', +2); break;
        case 'spAtkUp':  msg = attacker.changeStatStage('spAtk', +2); break;
        case 'spDefUp':  msg = attacker.changeStatStage('spDef', +2); break;
        case 'spdUp':    msg = attacker.changeStatStage('spd', +1); break;
        case 'defDown':  msg = defender.changeStatStage('def', -2); break;
        case 'spDefDown':msg = defender.changeStatStage('spDef', -2); break;
        case 'spdDown':  msg = defender.changeStatStage('spd', -2); break;
        case 'accDown':  msg = defender.changeStatStage('acc', -2); break;
        case 'scare':    msg = defender.changeStatStage('atk', -1); break;
        case 'stun':
          if (!defender.status) { defender.status = 'stun'; defender.statusTurns = 2; msg = `${defender.displayName} is stunned!`; }
          break;
        case 'sleep':
          if (!defender.status) { defender.status = 'sleep'; defender.statusTurns = 2; msg = `${defender.displayName} fell asleep!`; }
          break;
        case 'curse':
          if (!defender.status) { defender.status = 'curse'; defender.statusTurns = 5; msg = `${defender.displayName} is cursed!`; }
          break;
        case 'cleanse':
          attacker.status = null; attacker.statusTurns = 0; attacker.resetStatStages();
          msg = `${attacker.displayName} was cleansed!`; break;
      }
      result.statMsg = msg;
      this.log.push(msg || `${attacker.displayName} used ${move.name}!`);
      return result;
    }

    // ── DAMAGE MOVES ──
    // Critical hit (1/16 chance, 1.5x damage)
    result.isCrit = Math.random() < 0.0625;
    let dmg = this.calculateDamage(attacker, defender, move);
    if (result.isCrit) dmg = Math.floor(dmg * 1.5);
    // Double hit
    if (move.effect === 'double') dmg = Math.floor(dmg * 0.6) * 2;
    result.damage = dmg;
    defender.stats.hp = Math.max(0, defender.stats.hp - dmg);

    // Drain: attacker heals 50% of damage
    if (move.effect === 'drain') {
      const drainAmt = Math.max(1, Math.floor(dmg * 0.5));
      attacker.heal(drainAmt); result.healed = drainAmt;
    }

    const mult = this.getTypeMultiplier(move.type, defender.type);
    if (mult > 1) result.effective = 'super';
    else if (mult < 1 && mult > 0) result.effective = 'weak';

    // Apply secondary effects
    const effectChance = move.effect === 'stun' ? 0.25 : 0.3;
    if (move.effect && move.effect !== 'double' && move.effect !== 'drain' && Math.random() < effectChance && !defender.status) {
      const se = move.effect;
      if (['burn','freeze','poison','stun','sleep','curse','confuse'].includes(se)) {
        defender.status = se;
        defender.statusTurns = se === 'burn' || se === 'poison' ? 999 : 3;
        result.effect = se;
      } else if (se === 'spdDown') { defender.changeStatStage('spd', -1); result.statMsg = `${defender.displayName}'s SPD fell!`; }
      else if (se === 'defDown') { defender.changeStatStage('def', -1); result.statMsg = `${defender.displayName}'s DEF fell!`; }
    }

    if (defender.stats.hp <= 0) result.fainted = true;

    let log = `${attacker.displayName} → ${move.name}`;
    if (result.isCrit) log += ' 💥CRIT';
    log += ` (${dmg} dmg)`;
    if (result.effective === 'super') log += ' ✨Super effective!';
    if (result.effective === 'weak') log += ' 😐Not effective';
    if (result.effect) log += ` [${result.effect}]`;
    if (result.fainted) log += ` 💀 ${defender.displayName} fainted!`;
    this.log.push(log);
    return result;
  }

  applyStatus(creature) {
    if (!creature.status || !creature.isAlive) return null;
    const result = { type: creature.status, damage: 0, skip: false };

    switch (creature.status) {
      case 'burn':
        result.damage = Math.max(1, Math.floor(creature.stats.maxHp * 0.06));
        creature.stats.hp = Math.max(0, creature.stats.hp - result.damage);
        this.log.push(`🔥 ${creature.displayName} burned! (-${result.damage})`);
        break;
      case 'poison':
        result.damage = Math.max(1, Math.floor(creature.stats.maxHp * 0.08));
        creature.stats.hp = Math.max(0, creature.stats.hp - result.damage);
        this.log.push(`☠️ ${creature.displayName} poisoned! (-${result.damage})`);
        break;
      case 'curse':
        result.damage = Math.max(1, Math.floor(creature.stats.maxHp * 0.12));
        creature.stats.hp = Math.max(0, creature.stats.hp - result.damage);
        this.log.push(`👁️ ${creature.displayName} cursed! (-${result.damage})`);
        break;
      case 'freeze':
        if (Math.random() < 0.4) { result.skip = true; this.log.push(`🧊 ${creature.displayName} is frozen!`); }
        else { creature.status = null; this.log.push(`${creature.displayName} thawed!`); return result; }
        break;
      case 'stun':
        if (Math.random() < 0.35) { result.skip = true; this.log.push(`⚡ ${creature.displayName} is stunned!`); }
        break;
      case 'sleep':
        result.skip = true; this.log.push(`💤 ${creature.displayName} is asleep!`);
        break;
      case 'confuse':
        if (Math.random() < 0.33) {
          result.skip = true; this.log.push(`😵 ${creature.displayName} is confused and hurt itself!`);
          const selfDmg = Math.max(1, Math.floor(creature.stats.maxHp * 0.05));
          creature.stats.hp = Math.max(0, creature.stats.hp - selfDmg);
        }
        break;
    }

    // Tick down (not for burn/poison — those are permanent until cured)
    if (!['burn','poison','curse'].includes(creature.status)) {
      creature.statusTurns--;
      if (creature.statusTurns <= 0) {
        this.log.push(`${creature.displayName} recovered from ${creature.status}!`);
        creature.status = null;
      }
    }
    return result;
  }

  getAIMove() {
    const moves = this.enemy.moves;
    if (!moves.length) return { id: 'tackle', ...MOVES.tackle };
    // Super effective first
    const superEff = moves.filter(m => m.cat !== 'status' && this.getTypeMultiplier(m.type, this.player.type) > 1);
    if (superEff.length && Math.random() < 0.65) return superEff[Math.floor(Math.random() * superEff.length)];
    // Heal when low HP
    if (this.enemy.stats.hp < this.enemy.stats.maxHp * 0.25) {
      const healMove = moves.find(m => m.effect === 'heal' || m.effect === 'cleanse');
      if (healMove && Math.random() < 0.7) return healMove;
    }
    // Status move occasionally
    const statMoves = moves.filter(m => m.cat === 'status');
    if (statMoves.length && Math.random() < 0.2) return statMoves[Math.floor(Math.random() * statMoves.length)];
    // Highest power available
    const damaging = moves.filter(m => m.power > 0).sort((a, b) => b.power - a.power);
    if (damaging.length) return damaging[0];
    return moves[Math.floor(Math.random() * moves.length)];
  }

  executeTurn(playerMoveId) {
    // Legacy: executes both turns (used by PvP simulator)
    this.turn++;
    const playerMove = this.player.moves.find(m => m.id === playerMoveId) || this.player.moves[0];
    const enemyMove = this.getAIMove();
    const results = [];

    const playerFirst = this.player.getStat('spd') >= this.enemy.getStat('spd');
    const first = playerFirst ? { atk: this.player, def: this.enemy, move: playerMove, isPlayer: true }
                              : { atk: this.enemy, def: this.player, move: enemyMove, isPlayer: false };
    const second = playerFirst ? { atk: this.enemy, def: this.player, move: enemyMove, isPlayer: false }
                               : { atk: this.player, def: this.enemy, move: playerMove, isPlayer: true };

    const status1 = this.applyStatus(first.atk);
    if (!status1?.skip && first.atk.isAlive) {
      results.push({ ...this.executeMove(first.atk, first.def, first.move), isPlayer: first.isPlayer });
    }
    if (!this.enemy.isAlive || !this.player.isAlive) {
      this.finished = true; this.winner = this.player.isAlive ? 'player' : 'enemy'; return results;
    }
    const status2 = this.applyStatus(second.atk);
    if (!status2?.skip && second.atk.isAlive) {
      results.push({ ...this.executeMove(second.atk, second.def, second.move), isPlayer: second.isPlayer });
    }
    if (!this.enemy.isAlive || !this.player.isAlive) {
      this.finished = true; this.winner = this.player.isAlive ? 'player' : 'enemy';
    }
    return results;
  }

  // V3: Single player move execution
  executePlayerMove(moveId) {
    this.turn++;
    const move = this.player.moves.find(m => m.id === moveId) || this.player.moves[0];
    const status = this.applyStatus(this.player);
    if (status?.skip || !this.player.isAlive) {
      return { skipped: true, attacker: this.player.displayName, status: this.player.status };
    }
    const result = this.executeMove(this.player, this.enemy, move);
    result.isPlayer = true;
    if (this.enemy.stats.hp <= 0) {
      this.finished = true; this.winner = 'player';
      this.log.push(`💀 ${this.enemy.displayName} fainted!`);
    }
    return result;
  }

  // V3: Single enemy move execution
  executeEnemyMove(moveId) {
    const move = this.enemy.moves.find(m => m.id === moveId) || this.enemy.moves[0];
    const status = this.applyStatus(this.enemy);
    if (status?.skip || !this.enemy.isAlive) {
      return { skipped: true, attacker: this.enemy.displayName, status: this.enemy.status };
    }
    const result = this.executeMove(this.enemy, this.player, move);
    result.isPlayer = false;
    if (this.player.stats.hp <= 0) {
      this.finished = true; this.winner = 'enemy';
      this.log.push(`💀 ${this.player.displayName} fainted!`);
      // Trigger swap
    }
    return result;
  }

  // V3: Swap player creature in battle
  swapPlayer(newCreature) {
    this.player = newCreature;
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

// V2 imports merged to top of file

// Patch GameState with V2+V3 fields
const _origSave = GameState.prototype.save;
GameState.prototype.save = function() {
  if (!this.bossesDefeated) this.bossesDefeated = [];
  if (!this.achievementsUnlocked) this.achievementsUnlocked = [];
  if (!this.lastLoginDate) this.lastLoginDate = null;
  if (!this.loginStreak) this.loginStreak = 0;
  if (!this.totalFusions) this.totalFusions = 0;
  if (!this.totalPvP) this.totalPvP = 0;
  if (!this.dailyClaimed) this.dailyClaimed = false;
  if (!this.materials) this.materials = {};
  if (!this.xpBoosterBattles) this.xpBoosterBattles = 0;
  if (!this.totalShiny) this.totalShiny = 0;
  // V4
  if (!this.trainerXP) this.trainerXP = 0;
  if (!this.winStreak) this.winStreak = 0;
  if (!this.bestStreak) this.bestStreak = 0;
  if (!this.dailyMissions) this.dailyMissions = null;
  if (!this.missionProgress) this.missionProgress = {};
  if (!this.missionDate) this.missionDate = null;
  if (!this.totalTrains) this.totalTrains = 0;
  if (!this.totalFeeds) this.totalFeeds = 0;
  if (!this.totalCrafts) this.totalCrafts = 0;
  if (!this.totalCatches) this.totalCatches = 0;
  if (!this.sessionCrits) this.sessionCrits = 0;
  if (!this.sessionSupers) this.sessionSupers = 0;

  const data = {
    team: this.team.map(c => c.serialize()),
    storage: this.storage.map(c => c.serialize()),
    notdex: [...this.notdex],
    coins: this.coins, items: this.items, foods: this.foods,
    activeIdx: this.activeIdx, totalSteps: this.totalSteps,
    totalBattles: this.totalBattles, badges: this.badges,
    started: this.started, lastSave: Date.now(),
    bossesDefeated: this.bossesDefeated,
    achievementsUnlocked: this.achievementsUnlocked,
    lastLoginDate: this.lastLoginDate, loginStreak: this.loginStreak,
    totalFusions: this.totalFusions, totalPvP: this.totalPvP,
    dailyClaimed: this.dailyClaimed,
    // V3
    materials: this.materials,
    xpBoosterBattles: this.xpBoosterBattles,
    totalShiny: this.totalShiny,
    // V4
    trainerXP: this.trainerXP,
    winStreak: this.winStreak,
    bestStreak: this.bestStreak,
    dailyMissions: this.dailyMissions,
    missionProgress: this.missionProgress,
    missionDate: this.missionDate,
    totalTrains: this.totalTrains,
    totalFeeds: this.totalFeeds,
    totalCrafts: this.totalCrafts,
    totalCatches: this.totalCatches,
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
    this.bossesDefeated = data.bossesDefeated || [];
    this.achievementsUnlocked = data.achievementsUnlocked || [];
    this.lastLoginDate = data.lastLoginDate || null;
    this.loginStreak = data.loginStreak || 0;
    this.totalFusions = data.totalFusions || 0;
    this.totalPvP = data.totalPvP || 0;
    this.dailyClaimed = data.dailyClaimed || false;
    // V3
    this.materials = data.materials || {};
    this.xpBoosterBattles = data.xpBoosterBattles || 0;
    this.totalShiny = data.totalShiny || 0;
    // V4
    this.trainerXP = data.trainerXP || 0;
    this.winStreak = data.winStreak || 0;
    this.bestStreak = data.bestStreak || 0;
    this.dailyMissions = data.dailyMissions || null;
    this.missionProgress = data.missionProgress || {};
    this.missionDate = data.missionDate || null;
    this.totalTrains = data.totalTrains || 0;
    this.totalFeeds = data.totalFeeds || 0;
    this.totalCrafts = data.totalCrafts || 0;
    this.totalCatches = data.totalCatches || 0;
    return true;
  } catch { return false; }
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

// ─── V3: Material Drops ───
export function rollMaterialDrop(creature, isBoss = false) {
  const drops = [];
  if (isBoss) {
    // Boss always drops 2-3 materials including rare ones
    drops.push(BOSS_DROPS[Math.floor(Math.random() * BOSS_DROPS.length)]);
    drops.push(BOSS_DROPS[Math.floor(Math.random() * BOSS_DROPS.length)]);
    const typeDrops = DROP_TABLE[creature.type] || ['rawPixel'];
    drops.push(typeDrops[0]);
    // Shiny bonus
    if (creature.isShiny) drops.push('chromaGem');
  } else {
    const typeDrops = DROP_TABLE[creature.type] || ['rawPixel'];
    // Always drop basic material
    if (Math.random() < 0.7) drops.push(typeDrops[0]);
    if (Math.random() < 0.3) drops.push(typeDrops[1] || typeDrops[0]);
    // Rare drop: notEssence
    if (Math.random() < 0.05) drops.push('notEssence');
    // Shiny drops chromaGem
    if (creature.isShiny && Math.random() < 0.5) drops.push('chromaGem');
  }
  return drops;
}

export function addMaterials(gameState, drops) {
  if (!gameState.materials) gameState.materials = {};
  drops.forEach(mat => {
    gameState.materials[mat] = (gameState.materials[mat] || 0) + 1;
  });
}

// ─── V3: Crafting ───
export function canCraft(gameState, recipeId) {
  const recipe = RECIPES[recipeId];
  if (!recipe) return false;
  const mats = gameState.materials || {};
  return Object.entries(recipe.materials).every(([mat, qty]) => (mats[mat] || 0) >= qty);
}

export function craftItem(gameState, recipeId) {
  if (!canCraft(gameState, recipeId)) return false;
  const recipe = RECIPES[recipeId];
  // Consume materials
  Object.entries(recipe.materials).forEach(([mat, qty]) => {
    gameState.materials[mat] -= qty;
  });
  // Give item
  if (['dataTrap','superTrap','ultraTrap','shinyTrap'].includes(recipeId)) {
    gameState.items[recipeId] = (gameState.items[recipeId] || 0) + 1;
  } else if (['healChip','fullRestore'].includes(recipeId)) {
    gameState.items[recipeId] = (gameState.items[recipeId] || 0) + 1;
  } else if (recipeId === 'xpBooster') {
    gameState.xpBoosterBattles = (gameState.xpBoosterBattles || 0) + 5;
  } else if (recipeId.endsWith('Stone')) {
    gameState.items[recipeId] = (gameState.items[recipeId] || 0) + 1;
  }
  return true;
}

// ─── V3: Move Learning ───
export function checkMoveLearning(creature) {
  // Returns array of new move IDs to learn at current level
  return creature.getNewMoves();
}

// ─── V4: Explore Events ───
export function rollExploreEvent(gameState) {
  for (const ev of EXPLORE_EVENTS) {
    if (ev.text && Math.random() < ev.chance) {
      const detail = ev.apply(gameState);
      return { text: ev.text, detail };
    }
  }
  return null; // nothing happened
}

// ─── V4: Mission System ───
export function ensureDailyMissions(gameState) {
  const today = new Date().toDateString();
  if (gameState.missionDate !== today) {
    const seed = new Date().getFullYear() * 10000 + (new Date().getMonth()+1) * 100 + new Date().getDate();
    gameState.dailyMissions = generateDailyMissions(seed);
    gameState.missionProgress = {};
    gameState.missionDate = today;
    gameState.sessionCrits = 0;
    gameState.sessionSupers = 0;
  }
}

export function trackMission(gameState, type, amount = 1) {
  if (!gameState.missionProgress) gameState.missionProgress = {};
  gameState.missionProgress[type] = (gameState.missionProgress[type] || 0) + amount;
}

export function getMissionStatus(gameState) {
  ensureDailyMissions(gameState);
  return (gameState.dailyMissions || []).map(m => ({
    ...m,
    progress: gameState.missionProgress?.[m.type] || 0,
    completed: (gameState.missionProgress?.[m.type] || 0) >= m.target,
  }));
}

export function claimMissionReward(gameState, idx) {
  const missions = getMissionStatus(gameState);
  const m = missions[idx];
  if (!m || !m.completed) return null;
  const claimKey = `claimed_${m.id}`;
  if (gameState.missionProgress[claimKey]) return null; // already claimed
  gameState.missionProgress[claimKey] = true;
  gameState.coins += m.reward.coins;
  if (m.reward.mat) {
    gameState.materials[m.reward.mat] = (gameState.materials[m.reward.mat] || 0) + (m.reward.qty || 1);
  }
  gameState.trainerXP = (gameState.trainerXP || 0) + 50;
  return m;
}

// ─── V4: Streak ───
export function updateStreak(gameState, won) {
  if (won) {
    gameState.winStreak = (gameState.winStreak || 0) + 1;
    if (gameState.winStreak > (gameState.bestStreak || 0)) gameState.bestStreak = gameState.winStreak;
  } else {
    gameState.winStreak = 0;
  }
  return getStreakBonus(gameState.winStreak);
}

// ═══════════════════════════════════════════
// V5 — Card Battle Engine (Slay the Spire style)
// ═══════════════════════════════════════════
import { CARDS, STARTER_DECKS, INTENT } from './data.js';

export class CardBattle {
  constructor(player, enemy) {
    this.player = player;
    this.enemy = enemy;
    this.turn = 0;
    this.maxDP = 3;
    this.dp = 3;
    this.pShield = 0;
    this.eShield = 0;
    this.log = [];
    this.finished = false;
    this.winner = null;

    // Player buffs/debuffs
    this.pBuffs = { strength: 0, thorns: 0, regen: 0, vulnerable: 0, weak: 0 };
    // Enemy buffs/debuffs
    this.eBuffs = { strength: 0, thorns: 0, regen: 0, vulnerable: 0, weak: 0, burn: 0, poison: 0 };

    // Deck management
    const deckIds = player.deck || STARTER_DECKS[player.type] || STARTER_DECKS.ember;
    this.drawPile = this._shuffle([...deckIds]);
    this.hand = [];
    this.discard = [];

    // Enemy intent
    this.enemyIntent = this._rollIntent();

    // Start: draw opening hand
    this._drawCards(5);
  }

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  _drawCards(n) {
    for (let i = 0; i < n; i++) {
      if (this.drawPile.length === 0) {
        // Reshuffle discard into draw
        this.drawPile = this._shuffle([...this.discard]);
        this.discard = [];
        if (this.drawPile.length === 0) break;
      }
      this.hand.push(this.drawPile.pop());
    }
  }

  _rollIntent() {
    const hp_pct = this.enemy.stats.hp / this.enemy.stats.maxHp;
    const r = Math.random();
    const baseDmg = 4 + Math.floor(this.enemy.level * 1.2);

    if (hp_pct < 0.3 && r < 0.4) {
      return { type: INTENT.BLOCK, value: 5 + Math.floor(this.enemy.level * 0.8), icon: '🛡️' };
    }
    if (r < 0.15) {
      return { type: INTENT.BUFF, value: 2, icon: '💪', desc: 'Strength +2' };
    }
    if (r < 0.25) {
      return { type: INTENT.DEBUFF, value: 2, icon: '😈', desc: 'Weak 2' };
    }
    // Multi-attack
    if (r < 0.4) {
      const hits = 2 + Math.floor(Math.random() * 2);
      return { type: INTENT.ATTACK, value: Math.floor(baseDmg * 0.5), hits, icon: '🗡️', desc: `${Math.floor(baseDmg*0.5)}x${hits}` };
    }
    // Heavy attack
    if (r < 0.6) {
      return { type: INTENT.ATTACK, value: Math.floor(baseDmg * 1.5), hits: 1, icon: '⚔️' };
    }
    // Normal attack
    return { type: INTENT.ATTACK, value: baseDmg, hits: 1, icon: '🗡️' };
  }

  // Play a card from hand (by index in hand array)
  playCard(handIdx) {
    if (handIdx < 0 || handIdx >= this.hand.length) return null;
    const cardId = this.hand[handIdx];
    const card = CARDS[cardId];
    if (!card) return null;
    if (card.cost > this.dp) return { error: 'Not enough DP!' };

    this.dp -= card.cost;
    this.hand.splice(handIdx, 1);
    this.discard.push(cardId);

    const result = { card: card.name, type: card.cat, damage: 0, block: 0, healed: 0, effects: [] };
    const str = this.pBuffs.strength || 0;
    const isWeak = (this.pBuffs.weak || 0) > 0;
    const eVuln = (this.eBuffs.vulnerable || 0) > 0;

    // ATTACK
    if (card.damage > 0 || card.cat === 'attack') {
      let dmg = (card.damage || 0) + str;
      if (card.effect === 'random_dmg') dmg = Math.floor(Math.random() * (card.effectVal || 15)) + 1;
      if (isWeak) dmg = Math.floor(dmg * 0.75);
      if (eVuln) dmg = Math.floor(dmg * 1.5);
      // Apply to shield first
      const blocked = Math.min(this.eShield, dmg);
      this.eShield -= blocked;
      const hpDmg = dmg - blocked;
      this.enemy.stats.hp = Math.max(0, this.enemy.stats.hp - hpDmg);
      result.damage = dmg;
      this.log.push(`🃏 ${card.name} → ${dmg} dmg${blocked > 0 ? ` (${blocked} blocked)` : ''}`);
    }

    // BLOCK
    if (card.block > 0) {
      this.pShield += card.block;
      result.block = card.block;
      this.log.push(`🛡️ ${card.name} → +${card.block} shield`);
    }

    // EFFECTS
    if (card.effect) {
      switch (card.effect) {
        case 'burn':       this.eBuffs.burn = (this.eBuffs.burn||0) + (card.effectVal||3); result.effects.push(`🔥 Burn ${card.effectVal}`); break;
        case 'poison':     this.eBuffs.poison = (this.eBuffs.poison||0) + (card.effectVal||3); result.effects.push(`☠️ Poison ${card.effectVal}`); break;
        case 'vulnerable': this.eBuffs.vulnerable = (this.eBuffs.vulnerable||0) + (card.effectVal||2); result.effects.push(`💔 Vuln ${card.effectVal}`); break;
        case 'weak':       this.eBuffs.weak = (this.eBuffs.weak||0) + (card.effectVal||2); result.effects.push(`😵 Weak ${card.effectVal}`); break;
        case 'heal':       { const h = card.effectVal||5; this.player.heal(h); result.healed = h; result.effects.push(`💚 +${h} HP`); break; }
        case 'drain':      { const d = card.effectVal||5; this.player.heal(d); result.healed = d; result.effects.push(`🧛 +${d} HP`); break; }
        case 'draw':       this._drawCards(card.effectVal||1); result.effects.push(`🎴 Draw ${card.effectVal}`); break;
        case 'energy':     this.dp += (card.effectVal||1); result.effects.push(`⚡ +${card.effectVal} DP`); break;
        case 'energy_perm':this.maxDP += (card.effectVal||1); this.dp += (card.effectVal||1); result.effects.push(`⚡⚡ +${card.effectVal} max DP`); break;
        case 'thorns':     this.pBuffs.thorns += (card.effectVal||3); result.effects.push(`🌵 Thorns ${card.effectVal}`); break;
        case 'regen':      this.pBuffs.regen += (card.effectVal||3); result.effects.push(`💚 Regen ${card.effectVal}/turn`); break;
        case 'strength':   this.pBuffs.strength += (card.effectVal||2); result.effects.push(`💪 Str +${card.effectVal}`); break;
        case 'cleanse':    this.pBuffs.weak = 0; this.pBuffs.vulnerable = 0; result.effects.push(`✨ Cleansed!`); break;
      }
    }

    // Thorns damage to enemy (from player buffs)
    if (card.cat === 'attack' && this.eBuffs.thorns > 0) {
      // enemy thorns don't apply here, player thorns retaliates on enemy attack
    }

    if (this.enemy.stats.hp <= 0) { this.finished = true; this.winner = 'player'; }
    return result;
  }

  // End player turn → enemy acts
  endTurn() {
    const results = [];

    // Player end-of-turn effects
    if (this.pBuffs.regen > 0) {
      this.player.heal(this.pBuffs.regen);
      results.push(`💚 Regen +${this.pBuffs.regen} HP`);
    }
    // Tick debuffs on player
    if (this.pBuffs.weak > 0) this.pBuffs.weak--;
    if (this.pBuffs.vulnerable > 0) this.pBuffs.vulnerable--;

    // Enemy acts based on intent
    const intent = this.enemyIntent;
    const eStr = this.eBuffs.strength || 0;
    const pVuln = (this.pBuffs.vulnerable || 0) > 0;
    const eWeak = (this.eBuffs.weak || 0) > 0;

    if (intent.type === INTENT.ATTACK) {
      const hits = intent.hits || 1;
      for (let h = 0; h < hits; h++) {
        let dmg = intent.value + eStr;
        if (eWeak) dmg = Math.floor(dmg * 0.75);
        if (pVuln) dmg = Math.floor(dmg * 1.5);
        const blocked = Math.min(this.pShield, dmg);
        this.pShield -= blocked;
        const hpDmg = dmg - blocked;
        this.player.stats.hp = Math.max(0, this.player.stats.hp - hpDmg);
        results.push(`👹 ${dmg} dmg${blocked > 0 ? ` (${blocked} blocked)` : ''}`);
        // Thorns retaliation
        if (this.pBuffs.thorns > 0) {
          this.enemy.stats.hp = Math.max(0, this.enemy.stats.hp - this.pBuffs.thorns);
          results.push(`🌵 Thorns! ${this.pBuffs.thorns} retaliatory`);
        }
      }
    } else if (intent.type === INTENT.BLOCK) {
      this.eShield += intent.value;
      results.push(`👹 Shields up! +${intent.value}`);
    } else if (intent.type === INTENT.BUFF) {
      this.eBuffs.strength += intent.value;
      results.push(`👹 Strength +${intent.value}!`);
    } else if (intent.type === INTENT.DEBUFF) {
      this.pBuffs.weak += intent.value;
      results.push(`👹 Applied Weak ${intent.value}!`);
    }

    // Enemy DOT effects
    if (this.eBuffs.burn > 0) {
      this.enemy.stats.hp = Math.max(0, this.enemy.stats.hp - this.eBuffs.burn);
      results.push(`🔥 Burn ${this.eBuffs.burn} to enemy`);
      this.eBuffs.burn = Math.max(0, this.eBuffs.burn - 1);
    }
    if (this.eBuffs.poison > 0) {
      this.enemy.stats.hp = Math.max(0, this.enemy.stats.hp - this.eBuffs.poison);
      results.push(`☠️ Poison ${this.eBuffs.poison} to enemy`);
      this.eBuffs.poison = Math.max(0, this.eBuffs.poison - 1);
    }
    // Tick enemy debuffs
    if (this.eBuffs.weak > 0) this.eBuffs.weak--;
    if (this.eBuffs.vulnerable > 0) this.eBuffs.vulnerable--;

    // Check deaths
    if (this.player.stats.hp <= 0) { this.finished = true; this.winner = 'enemy'; }
    if (this.enemy.stats.hp <= 0) { this.finished = true; this.winner = 'player'; }

    this.log.push(...results);

    // Prepare next turn
    if (!this.finished) {
      this.turn++;
      this.pShield = 0; // shield resets!
      this.dp = this.maxDP;
      this.discard.push(...this.hand);
      this.hand = [];
      this._drawCards(5);
      this.enemyIntent = this._rollIntent();
    }

    return results;
  }
}
