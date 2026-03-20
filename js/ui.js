// ═══════════════════════════════════════════
// DigiNot — UI Controller & Screen Manager
// ═══════════════════════════════════════════

import {
  TYPES, STAGES, STAGE_LABELS, ZONES, FOODS, ITEMS, STARTERS,
  xpForLevel, generateName, randomDNA, getTypeForDNA,
  BOSSES, ACHIEVEMENTS, DAILY_REWARDS, fuseDNA, getFusionType,
  MOVES, MATERIALS, RECIPES
} from './data.js';
import { renderCreatureSprite, renderCreatureBlinkSprite } from './pixel.js';
import { SFX, initAudio, setMuted, isMuted, playMusic, stopMusic, getCurrentTrack } from './audio.js';
import {
  BattleEngine, generateWildCreature, generateBoss, performFusion,
  checkAchievements, checkDailyLogin, simulatePvPBattle,
  exportTeamCode, importTeamCode,
  addMaterials, canCraft, craftItem, checkMoveLearning,
  Creature, GameState, getAvailableZones, rollEncounter, getTrainingReward,
  claimDailyReward
} from './game.js';

// ─── State ───
let game = new GameState();
let currentScreen = 'title';
let screenStack = [];
let menuIdx = 0;
let subIdx = 0;
let battle = null;
let battleState = 'choose'; // choose, playerAttack, enemyAttack, result
let battleActionIdx = 0; // 0-3 = moves, 4 = trap, 5 = swap, 6 = run
let exploreZone = null;
let exploreSteps = 0;
let idleFrame = 0;
let idleTimer = null;
let blinkTimer = null;
let isBlinking = false;
let animationFrame = null;
let messageQueue = [];
let messageCallback = null;
let teamSelectIdx = 0;
let notdexPage = 0;
let trainGame = null;
let trainScore = 0;
let trainTimer = null;
let shopTab = 0;
let connectMode = null;
// V2 state
let fusionSelect = [null, null]; // indices in team for fusion
let fusionStep = 0;
let pvpMode = null;
let pvpResult = null;
let dailyReward = null;
let storageIdx = 0;
let swapMode = null; // null | 'team' | 'battle'
let swapIdx = 0;
let achievementPage = 0;
let pendingAchievements = [];
let battleSwapMode = false;
let screenTransitioning = false;

// ─── Screen Registry ───
const MENU_ITEMS = [
  { id: 'status',      icon: '📊', label: 'Status' },
  { id: 'team',        icon: '👥', label: 'Team' },
  { id: 'explore',     icon: '🔍', label: 'Explore' },
  { id: 'train',       icon: '🏋️', label: 'Train' },
  { id: 'fusion',      icon: '🧬', label: 'Fusion' },
  { id: 'feed',        icon: '🍖', label: 'Feed' },
  { id: 'notdex',      icon: '📖', label: 'NotDex' },
  { id: 'shop',        icon: '🛒', label: 'Shop' },
  { id: 'crafting',    icon: '⚒️', label: 'Craft' },
  { id: 'materials',   icon: '📦', label: 'Items' },
  { id: 'achievements',icon: '🏆', label: 'Achieve' },
  { id: 'pvp',         icon: '⚔️', label: 'PvP' },
  { id: 'storage',     icon: '📦', label: 'Storage' },
  { id: 'settings',    icon: '⚙️', label: 'Settings' },
];

// ─── Render Helpers ───
const $ = (sel) => document.querySelector(sel);
const $screen = () => $('#screen-content');

function setScreen(name) {
  if (currentScreen !== name && currentScreen !== 'title') {
    screenStack.push(currentScreen);
  }
  currentScreen = name;
  render();
}

function goBack() {
  const prev = screenStack.pop();
  if (prev) {
    currentScreen = prev;
    render();
  }
}

function showMessage(text, cb = null) {
  messageQueue.push({ text, cb });
  if (messageQueue.length === 1) renderMessage();
}

function renderMessage() {
  if (messageQueue.length === 0) return;
  const msg = messageQueue[0];
  const el = $('#message-overlay');
  el.innerHTML = `<div class="msg-box"><p>${msg.text}</p><span class="msg-hint">TAP to continue</span></div>`;
  el.classList.add('active');
}

function dismissMessage() {
  const msg = messageQueue.shift();
  const el = $('#message-overlay');
  if (msg?.cb) msg.cb();
  if (messageQueue.length > 0) {
    renderMessage();
  } else {
    el.classList.remove('active');
  }
}

function creatureImg(creature, size = 4, className = '') {
  const src = isBlinking && creature === game.active
    ? renderCreatureBlinkSprite(creature.dna, creature.type, creature.stage, size, creature.isShiny)
    : renderCreatureSprite(creature.dna, creature.type, creature.stage, size, creature.isShiny);
  return `<img src="${src}" class="creature-sprite ${className}" alt="${creature.displayName}" draggable="false">`;
}

function shakeSprite(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 400);
}

function hpBar(hp, maxHp) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  const color = pct > 50 ? '#44cc44' : pct > 20 ? '#cccc00' : '#cc3333';
  return `<div style="display:flex;align-items:center;gap:3px;">
    <div class="hp-bar" style="width:40px;height:5px;flex:none;">
      <div class="hp-fill" style="width:${pct}%;background:${color}"></div>
    </div>
    <span class="hp-text" style="font-size:5px;flex:none;">${hp}/${maxHp}</span>
  </div>`;
}

function xpBar(xp, level) {
  const needed = xpForLevel(level);
  const pct = (xp / needed) * 100;
  return `<div class="xp-bar"><div class="xp-fill" style="width:${pct}%"></div></div>`;
}

function typeTag(type) {
  const t = TYPES[type];
  return `<span class="type-tag" style="background:${t?.bg || '#222'};color:${t?.color || '#fff'}">${t?.icon || '?'} ${t?.name || type}</span>`;
}

// ─── Screen Renderers ───

function renderTitle() {
  return `
    <div class="screen-title">
      <div class="title-logo">
        <div class="title-text">DIGI</div>
        <div class="title-text accent">NOT</div>
      </div>
      <div class="title-sub">Digital Creatures • Pocket Device</div>
      <div class="title-version">v2.0</div>
      <div class="blink-text">— PRESS A TO START —</div>
      ${game.hasSave() ? '<div class="continue-hint">Save data found</div>' : ''}
    </div>`;
}

function renderStarterSelect() {
  return `
    <div class="screen-starter">
      <h2>Choose Your First Not!</h2>
      <div class="starter-grid">
        ${STARTERS.map((s, i) => `
          <div class="starter-card ${subIdx === i ? 'selected' : ''}" data-idx="${i}">
            <img src="${renderCreatureSprite(s.dna, s.type, 'bit', 5)}" class="creature-sprite" draggable="false">
            <div class="starter-name">${s.nickname}</div>
            ${typeTag(s.type)}
          </div>
        `).join('')}
      </div>
      <div class="hint">◄ ► to choose • A to confirm</div>
    </div>`;
}

let homeActionIdx = 0; // 0=menu, 1=heal, 2=evolve

function renderHome() {
  const c = game.active;
  if (!c) return '<div class="empty">No creature!</div>';

  const healItem = game.items.fullRestore > 0 ? `💉x${game.items.fullRestore}` :
                   game.items.healChip > 0    ? `💊x${game.items.healChip}` : null;

  const actions = [
    { icon: '📋', label: 'Menu' },
    { icon: '💊', label: healItem ? `Heal ${healItem}` : 'No items', disabled: !healItem || c.stats.hp >= c.stats.maxHp },
    ...(c.canEvolve ? [{ icon: '✨', label: 'Evolve!' }] : []),
  ];

  return `
    <div class="screen-home">
      <div class="home-header">
        <span class="creature-name">${c.isShiny ? '✨ ' : ''}${c.typeIcon} ${c.displayName}</span>
        <span class="creature-level">Lv.${c.level}</span>
      </div>
      <div class="home-creature ${idleFrame === 1 ? 'bounce' : ''}">
        ${creatureImg(c, 5, 'idle-sprite')}
      </div>
      <div class="home-bars">
        <div class="bar-row">
          <span class="bar-label">HP</span>
          ${hpBar(c.stats.hp, c.stats.maxHp)}
          ${c.happiness >= 70 && c.hunger >= 50 && c.stats.hp < c.stats.maxHp ? '<span class="regen-dot">💚</span>' : ''}
        </div>
        <div class="bar-row"><span class="bar-label">XP</span>${xpBar(c.xp, c.level)}</div>
        <div class="bar-row"><span class="bar-label">😊</span><div class="stat-bar"><div class="stat-fill happy" style="width:${c.happiness}%"></div></div></div>
        <div class="bar-row"><span class="bar-label">🍖</span><div class="stat-bar"><div class="stat-fill hunger" style="width:${c.hunger}%"></div></div></div>
      </div>
      <div class="home-actions">
        ${actions.map((a, i) => `
          <div class="home-action ${homeActionIdx === i ? 'selected' : ''} ${a.disabled ? 'disabled' : ''}">
            <span>${a.icon}</span>
            <span>${a.label}</span>
          </div>`).join('')}
      </div>
      <div class="home-footer">
        <span>🪙 ${game.coins}</span>
        <span>📦 ${Object.values(game.materials || {}).reduce((a,b)=>a+b,0)}</span>
        <span>✨ ${game.totalShiny || 0}</span>
      </div>
      <div class="hint">◄► Choose • A = Confirm</div>
    </div>`;
}

function renderMenu() {
  return `
    <div class="screen-menu">
      <h2>MENU</h2>
      <div class="menu-grid">
        ${MENU_ITEMS.map((item, i) => `
          <div class="menu-item ${menuIdx === i ? 'selected' : ''}" data-idx="${i}">
            <span class="menu-icon">${item.icon}</span>
            <span class="menu-label">${item.label}</span>
          </div>
        `).join('')}
      </div>
      <div class="hint">D-pad = Navigate • A = Select • B = Back</div>
    </div>`;
}

function renderStatus() {
  const c = game.active;
  if (!c) return '<div class="empty">No creature!</div>';
  const s = c.stats;
  return `
    <div class="screen-status">
      <div class="status-header">
        ${creatureImg(c, 4)}
        <div class="status-info">
          <div class="creature-name">${c.typeIcon} ${c.displayName}</div>
          ${typeTag(c.type)}
          <div>Lv.${c.level} • ${STAGE_LABELS[c.stage]}</div>
        </div>
      </div>
      <div class="status-bars">
        <div class="stat-row"><span>HP</span><span class="stat-val">${s.hp}/${s.maxHp}</span></div>
        <div class="stat-row"><span>ATK</span><span class="stat-val">${s.atk}</span></div>
        <div class="stat-row"><span>DEF</span><span class="stat-val">${s.def}</span></div>
        <div class="stat-row"><span>SP.ATK</span><span class="stat-val">${s.spAtk}</span></div>
        <div class="stat-row"><span>SP.DEF</span><span class="stat-val">${s.spDef}</span></div>
        <div class="stat-row"><span>SPD</span><span class="stat-val">${s.spd}</span></div>
      </div>
      <div class="status-moves">
        <h3>Moves</h3>
        ${c.moves.map(m => `
          <div class="move-chip">${typeTag(m.type)} ${m.name} <small>Pow:${m.power || '—'}</small></div>
        `).join('')}
      </div>
      <div class="status-extra">
        <span>Wins: ${c.wins}</span> <span>XP: ${c.xp}/${xpForLevel(c.level)}</span>
      </div>
      ${c.canEvolve ? '<div class="evolve-ready blink-text">⚡ READY TO EVOLVE! Press A ⚡</div>' : ''}
      <div class="hint">B = Back${c.canEvolve ? ' • A = Evolve' : ''}</div>
    </div>`;
}

function renderTeam() {
  return `
    <div class="screen-team">
      <h2>👥 Team (${game.team.length}/6)</h2>
      <div class="team-list">
        ${game.team.map((c, i) => `
          <div class="team-member ${teamSelectIdx === i ? 'selected' : ''} ${i === game.activeIdx ? 'active-member' : ''}" data-idx="${i}">
            <img src="${renderCreatureSprite(c.dna, c.type, c.stage, 3)}" class="team-sprite" draggable="false">
            <div class="team-info">
              <span>${c.typeIcon} ${c.displayName} Lv.${c.level}</span>
              ${hpBar(c.stats.hp, c.stats.maxHp)}
            </div>
            ${i === game.activeIdx ? '<span class="active-badge">★</span>' : ''}
          </div>
        `).join('')}
      </div>
      <div class="hint">▲▼ Navigate • A = Set Active • B = Back</div>
    </div>`;
}

function renderExploreSelect() {
  const zones = getAvailableZones(game.active?.level || 1);
  const defeated = game.bossesDefeated || [];
  return `
    <div class="screen-explore-select">
      <h2>🔍 Choose Zone</h2>
      <div class="zone-list">
        ${zones.map((z, i) => {
          const bossAvail = BOSSES[z.id];
          const bossDefeated = defeated.includes(z.id);
          return `
          <div class="zone-card ${subIdx === i ? 'selected' : ''}" data-idx="${i}" style="border-color:${TYPES[z.types[0]]?.color || '#444'}">
            <span class="zone-icon">${z.icon}</span>
            <span class="zone-name">${z.name}</span>
            <span class="zone-types">${z.types.map(t => TYPES[t]?.icon).join(' ')}</span>
            <span class="zone-level">Lv.${z.minLevel}+</span>
            ${bossAvail ? `<span class="boss-badge ${bossDefeated ? 'defeated' : ''}">${bossDefeated ? '👑' : '👹'}</span>` : ''}
          </div>`;
        }).join('')}
      </div>
      <div class="hint">▲▼ Navigate • A = Explore • ► = Boss • B = Back</div>
    </div>`;
}

function renderExploring() {
  return `
    <div class="screen-exploring">
      <div class="explore-header">
        <span>${exploreZone?.icon} ${exploreZone?.name}</span>
        <span>Steps: ${exploreSteps}</span>
      </div>
      <div class="radar-container">
        <div class="radar">
          <div class="radar-sweep"></div>
          <div class="radar-center">
            <img src="${renderCreatureSprite(game.active.dna, game.active.type, game.active.stage, 2)}" draggable="false">
          </div>
          ${Array.from({length: 3}, (_, i) => `<div class="radar-ring" style="width:${(i+1)*33}%;height:${(i+1)*33}%"></div>`).join('')}
          ${Math.random() < 0.3 ? `<div class="radar-blip" style="top:${20+Math.random()*60}%;left:${20+Math.random()*60}%"></div>` : ''}
        </div>
      </div>
      <div class="explore-status">Searching for wild Nots...</div>
      <div class="hint">A = Step forward • B = Leave zone</div>
    </div>`;
}

function renderBattle() {
  if (!battle) return '<div class="empty">No battle!</div>';
  const p = battle.player;
  const e = battle.enemy;
  const moves = p.moves;
  const isAnimating = battleState === 'playerAttack' || battleState === 'enemyAttack';
  const isPlayerTurn = battleState === 'choose';

  // Unified action list: 4 moves + trap + swap + run
  const allActions = [
    ...moves.map((m, i) => ({ type: 'move', idx: i, label: m.name, sub: `PWR ${m.power || '—'} • ${m.type.toUpperCase()}`, typeColor: TYPES[m.type]?.color || '#888' })),
    { type: 'trap', idx: 4, label: '📡 Trap', sub: `x${game.items.dataTrap || 0}`, typeColor: '#9b59b6' },
    { type: 'swap', idx: 5, label: '🔄 Swap', sub: `${game.team.filter(c => c.isAlive && c !== battle.player).length} available`, typeColor: '#3498db' },
    { type: 'run',  idx: 6, label: '🏃 Run',  sub: `${e._isBoss ? '❌ Cannot run' : 'Escape!'}`, typeColor: '#e74c3c' },
  ];

  // Battle log: last 6 messages with turn markers
  const logMsgs = battle.log.slice(-6);
  const logHTML = logMsgs.map((line, i) => {
    const isLast = i === logMsgs.length - 1;
    const isPlayer = line.includes('→');
    return `<div class="log-line ${isLast ? 'log-last' : ''} ${isPlayer ? 'log-player' : 'log-enemy'}">${line}</div>`;
  }).join('');

  // Turn indicator
  const turnLabel = battleState === 'playerAttack' ? '⚔️ ATTACKING...' :
                    battleState === 'enemyAttack' ? '👹 ENEMY...' :
                    battleState === 'result' ? (battle.winner === 'capture' || battle.winner === 'player' ? '🏆 VICTORY!' : '💀 DEFEAT!') : 'YOUR TURN';

  const resultHTML = battleState === 'result' ? `
    <div class="battle-result-overlay ${battle.winner === 'capture' || battle.winner === 'player' ? 'win' : 'lose'}">
      ${battle.winner === 'capture' ? `📡 ${e.displayName} captured!` :
        battle.winner === 'player' ? `🏆 Victory! +${battle.xpReward || 0} XP` :
        battle.winner === 'run' ? `🏃 Got away!` : `💀 ${p.displayName} was defeated...`}
    </div>` : '';

  return `
    <div class="screen-battle">
      ${resultHTML}
      <div class="battle-field">
        <div class="battle-enemy">
          <div class="battle-info-enemy">
            <span>${e.isShiny ? '✨ ' : ''}${e.typeIcon} ${e.displayName} Lv.${e.level}</span>
            ${hpBar(e.stats.hp, e.stats.maxHp)}
            ${e.status ? `<span class="status-badge status-${e.status}">${e.status}</span>` : ''}
          </div>
          <div class="battle-sprite enemy-sprite ${battleState === 'playerAttack' ? 'attacking' : ''} ${!e.isAlive ? 'fainted' : ''}">
            <img src="${renderCreatureSprite(e.dna, e.type, e.stage, 4, e.isShiny)}" draggable="false">
          </div>
        </div>
        <div class="battle-player">
          <div class="battle-sprite player-sprite ${battleState === 'enemyAttack' ? 'attacking' : ''} ${!p.isAlive ? 'fainted' : ''}">
            <img src="${renderCreatureSprite(p.dna, p.type, p.stage, 4, p.isShiny)}" draggable="false">
          </div>
          <div class="battle-info-player">
            <span>${p.isShiny ? '✨ ' : ''}${p.typeIcon} ${p.displayName} Lv.${p.level}</span>
            ${hpBar(p.stats.hp, p.stats.maxHp)}
            ${p.status ? `<span class="status-badge status-${p.status}">${p.status}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="battle-log-container">
        <div class="battle-log">${logHTML}</div>
      </div>
      <div class="turn-indicator ${isPlayerTurn ? 'your-turn' : 'enemy-turn'}">${turnLabel}</div>
      ${isPlayerTurn ? `
      <div class="battle-actions">
        ${allActions.map(a => `
          <button class="battle-action-btn ${battleActionIdx === a.idx ? 'selected' : ''}" data-idx="${a.idx}">
            <span class="action-dot" style="background:${a.typeColor}"></span>
            <span class="action-label">${a.label}</span>
            <span class="action-sub">${a.sub}</span>
          </button>`).join('')}
      </div>
      ` : `<div class="battle-actions-disabled"><span class="hint">...</span></div>`}
    </div>`;
}

function renderTrainSelect() {
  const games = [
    { id: 'rhythm', icon: '🎵', name: 'Rhythm Battle', stat: 'SPD', desc: 'Hit arrows in sync!' },
    { id: 'power',  icon: '💪', name: 'Power Strike', stat: 'ATK', desc: 'Stop the meter at max!' },
    { id: 'memory', icon: '🧠', name: 'Memory Grid', stat: 'SP.ATK', desc: 'Remember the pattern!' },
    { id: 'dodge',  icon: '🏃', name: 'Dodge Run', stat: 'DEF', desc: 'Dodge & collect coins!' },
  ];
  return `
    <div class="screen-train-select">
      <h2>🏋️ Training</h2>
      <div class="train-list">
        ${games.map((g, i) => `
          <div class="train-card ${subIdx === i ? 'selected' : ''}" data-idx="${i}">
            <span class="train-icon">${g.icon}</span>
            <div class="train-info">
              <span class="train-name">${g.name}</span>
              <span class="train-stat">Boosts ${g.stat}</span>
              <span class="train-desc">${g.desc}</span>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="hint">▲▼ Navigate • A = Start • B = Back</div>
    </div>`;
}

// Old training renderers removed — V2 renderers defined after renderEvolving

function renderFeed() {
  const foodList = Object.entries(FOODS);
  return `
    <div class="screen-feed">
      <h2>🍖 Feed ${game.active?.displayName || 'Not'}</h2>
      <div class="feed-status">
        <span>😊 ${game.active?.happiness || 0}/100</span>
        <span>🍖 ${game.active?.hunger || 0}/100</span>
      </div>
      <div class="food-list">
        ${foodList.map(([key, food], i) => `
          <div class="food-card ${subIdx === i ? 'selected' : ''}" data-key="${key}">
            <span class="food-icon">${food.icon}</span>
            <span class="food-name">${food.name}</span>
            <span class="food-qty">x${game.foods[key] || 0}</span>
            <span class="food-effect">+${food.hunger}🍖 +${food.happiness}😊</span>
          </div>
        `).join('')}
      </div>
      <div class="hint">▲▼ Navigate • A = Feed • B = Back</div>
    </div>`;
}

function renderNotdex() {
  const all = [...game.notdex];
  const perPage = 6;
  const pages = Math.max(1, Math.ceil(all.length / perPage));
  const page = all.slice(notdexPage * perPage, (notdexPage + 1) * perPage);
  return `
    <div class="screen-notdex">
      <h2>📖 NotDex (${all.length} discovered)</h2>
      <div class="notdex-grid">
        ${page.map(dna => {
          const c = game.team.find(t => t.dna === dna) || game.storage.find(t => t.dna === dna);
          if (!c) {
            const type = getTypeForDNA(dna);
            return `<div class="notdex-entry">
              <img src="${renderCreatureSprite(dna, type, 'bit', 3)}" draggable="false">
              <span>${generateName(dna, type, 'bit')}</span>
            </div>`;
          }
          return `<div class="notdex-entry">
            <img src="${renderCreatureSprite(c.dna, c.type, c.stage, 3)}" draggable="false">
            <span>${c.displayName}</span>
            <small>Lv.${c.level} ${c.typeIcon}</small>
          </div>`;
        }).join('')}
        ${page.length === 0 ? '<div class="empty">No Nots discovered yet!</div>' : ''}
      </div>
      <div class="notdex-pages">Page ${notdexPage + 1}/${pages} ${pages > 1 ? '(◄►)' : ''}</div>
      <div class="hint">◄► Pages • B = Back</div>
    </div>`;
}

function renderShop() {
  const tabs = ['🍖 Food', '📡 Items'];
  const items = shopTab === 0
    ? Object.entries(FOODS).map(([k, v]) => ({ key: k, ...v, owned: game.foods[k] || 0, target: 'foods' }))
    : Object.entries(ITEMS).map(([k, v]) => ({ key: k, ...v, owned: game.items[k] || 0, target: 'items' }));

  return `
    <div class="screen-shop">
      <h2>🛒 Shop — 🪙 ${game.coins}</h2>
      <div class="shop-tabs">
        ${tabs.map((t, i) => `<button class="shop-tab ${shopTab === i ? 'active' : ''}" data-tab="${i}">${t}</button>`).join('')}
      </div>
      <div class="shop-list">
        ${items.map((item, i) => `
          <div class="shop-item ${subIdx === i ? 'selected' : ''}" data-idx="${i}">
            <span class="shop-icon">${item.icon}</span>
            <div class="shop-info">
              <span>${item.name}</span>
              <small>${item.desc || `+${item.hunger || 0}🍖 +${item.happiness || 0}😊`}</small>
            </div>
            <span class="shop-price">🪙${item.price}</span>
            <span class="shop-owned">x${item.owned}</span>
          </div>
        `).join('')}
      </div>
      <div class="hint">▲▼ Buy • ◄► Tab • B = Back</div>
    </div>`;
}

function renderConnect() {
  return `
    <div class="screen-connect">
      <h2>📡 Connect</h2>
      <div class="connect-options">
        <div class="connect-card ${subIdx === 0 ? 'selected' : ''}">
          <span class="connect-icon">📤</span>
          <span>Share Not</span>
          <small>Generate a code to share</small>
        </div>
        <div class="connect-card ${subIdx === 1 ? 'selected' : ''}">
          <span class="connect-icon">📥</span>
          <span>Receive Not</span>
          <small>Enter a friend's code</small>
        </div>
      </div>
      ${connectMode === 'share' ? `
        <div class="share-code">
          <p>Share this code:</p>
          <div class="code-display" id="share-code">${game.active?.toShareCode() || 'No Not!'}</div>
          <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('share-code').textContent)">📋 Copy</button>
        </div>
      ` : ''}
      ${connectMode === 'receive' ? `
        <div class="receive-code">
          <p>Enter code:</p>
          <input type="text" id="receive-input" class="code-input" placeholder="Paste code here...">
          <button class="receive-btn" id="receive-btn">📥 Receive</button>
        </div>
      ` : ''}
      <div class="hint">▲▼ Choose • A = Select • B = Back</div>
    </div>`;
}

function renderSettings() {
  return `
    <div class="screen-settings">
      <h2>⚙️ Settings</h2>
      <div class="settings-list">
        <div class="setting-item ${subIdx === 0 ? 'selected' : ''}">
          <span>🔊 Sound</span>
          <span>${isMuted() ? 'OFF' : 'ON'}</span>
        </div>
        <div class="setting-item ${subIdx === 1 ? 'selected' : ''}">
          <span>💊 Heal All</span>
          <small>Restore team HP</small>
        </div>
        <div class="setting-item ${subIdx === 2 ? 'selected' : ''}">
          <span>💾 Save Game</span>
          <small>Last: ${game.lastSave ? new Date(game.lastSave).toLocaleString() : 'Never'}</small>
        </div>
        <div class="setting-item ${subIdx === 3 ? 'selected' : ''} danger">
          <span>🗑️ Delete Save</span>
          <small>Start over</small>
        </div>
      </div>
      <div class="hint">▲▼ Navigate • A = Select • B = Back</div>
    </div>`;
}

function renderEvolving() {
  const c = game.active;
  return `
    <div class="screen-evolving">
      <div class="evolve-animation">
        <div class="evolve-glow"></div>
        ${creatureImg(c, 5, 'evolve-sprite')}
      </div>
      <div class="evolve-text">
        ${c.displayName} evolved to<br>
        <span class="evolve-stage">${STAGE_LABELS[c.stage]}!</span>
      </div>
      <div class="hint">A = Continue</div>
    </div>`;
}

// ═══════════════════════════════════════════
// V2 — New Screen Renderers
// ═══════════════════════════════════════════

function renderFusion() {
  if (game.team.length < 2) {
    return `<div class="screen-fusion"><h2>🧬 Fusion Lab</h2><div class="empty">Need at least 2 Nots in team!</div><div class="hint">B = Back</div></div>`;
  }
  return `
    <div class="screen-fusion">
      <h2>🧬 Fusion Lab</h2>
      <p class="fusion-desc">Combine two Nots to create a new hybrid!</p>
      <div class="fusion-slots">
        <div class="fusion-slot ${fusionStep === 0 ? 'selecting' : ''}" data-slot="0">
          ${fusionSelect[0] !== null ? `
            <img src="${renderCreatureSprite(game.team[fusionSelect[0]].dna, game.team[fusionSelect[0]].type, game.team[fusionSelect[0]].stage, 3)}" draggable="false">
            <span>${game.team[fusionSelect[0]].displayName}</span>
          ` : '<span class="empty-slot">Select 1st</span>'}
        </div>
        <div class="fusion-plus">+</div>
        <div class="fusion-slot ${fusionStep === 1 ? 'selecting' : ''}" data-slot="1">
          ${fusionSelect[1] !== null ? `
            <img src="${renderCreatureSprite(game.team[fusionSelect[1]].dna, game.team[fusionSelect[1]].type, game.team[fusionSelect[1]].stage, 3)}" draggable="false">
            <span>${game.team[fusionSelect[1]].displayName}</span>
          ` : '<span class="empty-slot">Select 2nd</span>'}
        </div>
      </div>
      ${fusionStep < 2 ? `
      <div class="fusion-team-list">
        ${game.team.map((c, i) => `
          <div class="fusion-pick ${subIdx === i ? 'selected' : ''} ${fusionSelect.includes(i) ? 'used' : ''}" data-idx="${i}">
            <img src="${renderCreatureSprite(c.dna, c.type, c.stage, 2)}" draggable="false">
            <span>${c.typeIcon} ${c.displayName} Lv.${c.level}</span>
          </div>
        `).join('')}
      </div>` : `
      <button class="fusion-go-btn ${subIdx === 0 ? 'selected' : ''}">⚗️ FUSE! (Both Nots consumed)</button>
      `}
      <div class="hint">${fusionStep < 2 ? '▲▼ Pick • A = Select • B = Back' : 'A = Fuse! • B = Cancel'}</div>
    </div>`;
}

function renderAchievements() {
  const unlocked = game.achievementsUnlocked || [];
  const perPage = 5;
  const pages = Math.ceil(ACHIEVEMENTS.length / perPage);
  const page = ACHIEVEMENTS.slice(achievementPage * perPage, (achievementPage + 1) * perPage);
  return `
    <div class="screen-achievements">
      <h2>🏆 Achievements (${unlocked.length}/${ACHIEVEMENTS.length})</h2>
      <div class="achievement-list">
        ${page.map(a => {
          const done = unlocked.includes(a.id);
          return `<div class="achievement-item ${done ? 'unlocked' : 'locked'}">
            <span class="ach-icon">${done ? a.icon : '🔒'}</span>
            <div class="ach-info">
              <span class="ach-name">${a.name}</span>
              <span class="ach-desc">${a.desc}</span>
            </div>
            <span class="ach-reward">${done ? '✅' : `🪙${a.reward}`}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="notdex-pages">Page ${achievementPage + 1}/${pages} ${pages > 1 ? '(◄►)' : ''}</div>
      <div class="hint">◄► Pages • B = Back</div>
    </div>`;
}

function renderStorage() {
  if (game.storage.length === 0) {
    return `<div class="screen-storage"><h2>📦 Storage</h2><div class="empty">No Nots in storage!</div><div class="hint">B = Back</div></div>`;
  }
  return `
    <div class="screen-storage">
      <h2>📦 Storage (${game.storage.length})</h2>
      <div class="storage-list">
        ${game.storage.map((c, i) => `
          <div class="storage-item ${storageIdx === i ? 'selected' : ''}" data-idx="${i}">
            <img src="${renderCreatureSprite(c.dna, c.type, c.stage, 2)}" class="team-sprite" draggable="false">
            <div class="team-info">
              <span>${c.typeIcon} ${c.displayName} Lv.${c.level}</span>
              ${hpBar(c.stats.hp, c.stats.maxHp)}
            </div>
          </div>
        `).join('')}
      </div>
      <div class="hint">▲▼ Navigate • A = Move to Team • B = Back</div>
    </div>`;
}

function renderPvP() {
  if (pvpResult) {
    const isWin = pvpResult.winner === 'team1';
    return `
      <div class="screen-pvp">
        <h2>⚔️ PvP Result</h2>
        <div class="pvp-result ${isWin ? 'win' : 'lose'}">
          ${isWin ? '🏆 YOU WIN!' : '💀 DEFEATED!'}
        </div>
        <div class="pvp-stats">
          <span>Your team: ${pvpResult.t1remaining} remaining</span>
          <span>Enemy team: ${pvpResult.t2remaining} remaining</span>
        </div>
        <div class="pvp-log">${pvpResult.log.slice(-6).join('<br>')}</div>
        <div class="hint">A = Continue</div>
      </div>`;
  }
  return `
    <div class="screen-pvp">
      <h2>⚔️ PvP Arena</h2>
      <div class="connect-options">
        <div class="connect-card ${subIdx === 0 ? 'selected' : ''}">
          <span class="connect-icon">📤</span>
          <span>Share Team Code</span>
          <small>Let friends challenge your team</small>
        </div>
        <div class="connect-card ${subIdx === 1 ? 'selected' : ''}">
          <span class="connect-icon">⚔️</span>
          <span>Challenge!</span>
          <small>Enter a friend's team code to battle</small>
        </div>
        <div class="connect-card ${subIdx === 2 ? 'selected' : ''}">
          <span class="connect-icon">📡</span>
          <span>Share / Receive Not</span>
          <small>Trade creatures with friends</small>
        </div>
      </div>
      ${pvpMode === 'share' ? `
        <div class="share-code">
          <p>Your team code:</p>
          <div class="code-display" id="pvp-code">${exportTeamCode(game.team)}</div>
          <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('pvp-code').textContent)">📋 Copy</button>
        </div>
      ` : ''}
      ${pvpMode === 'challenge' ? `
        <div class="receive-code">
          <p>Enter opponent's team code:</p>
          <input type="text" id="pvp-input" class="code-input" placeholder="Paste team code...">
          <button class="receive-btn" id="pvp-fight-btn">⚔️ FIGHT!</button>
        </div>
      ` : ''}
      ${pvpMode === 'trade' ? `
        <div class="connect-options" style="margin-top:6px">
          <div class="share-code">
            <p>Share code for ${game.active?.displayName || 'Not'}:</p>
            <div class="code-display" id="share-code">${game.active?.toShareCode() || 'No Not!'}</div>
            <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('share-code').textContent)">📋 Copy</button>
          </div>
          <div class="receive-code" style="margin-top:6px">
            <p>Receive a Not:</p>
            <input type="text" id="receive-input" class="code-input" placeholder="Paste code...">
            <button class="receive-btn" id="receive-btn">📥 Receive</button>
          </div>
        </div>
      ` : ''}
      <div class="hint">▲▼ Choose • A = Select • B = Back</div>
    </div>`;
}

function renderDaily() {
  const streak = game.loginStreak || 0;
  return `
    <div class="screen-daily">
      <h2>📅 Daily Login</h2>
      <div class="daily-streak">🔥 Streak: ${streak} days</div>
      <div class="daily-grid">
        ${DAILY_REWARDS.map((r, i) => {
          const dayNum = i + 1;
          const isCurrent = ((streak - 1) % DAILY_REWARDS.length) === i && !game.dailyClaimed;
          const isPast = streak > 0 && (i < ((streak - 1) % DAILY_REWARDS.length) || game.dailyClaimed);
          return `<div class="daily-card ${isCurrent ? 'current' : ''} ${isPast ? 'claimed' : ''}">
            <span class="daily-day">Day ${dayNum}</span>
            <span class="daily-reward-text">${r.desc}</span>
            ${isPast ? '<span class="daily-check">✅</span>' : ''}
            ${isCurrent ? '<span class="daily-claim blink-text">CLAIM!</span>' : ''}
          </div>`;
        }).join('')}
      </div>
      ${dailyReward && !game.dailyClaimed ? `<div class="hint">A = Claim Reward • B = Back</div>` : `<div class="hint">B = Back</div>`}
    </div>`;
}

// ─── Main Render ───
function render() {
  const content = $screen();
  if (!content) return;

  let html = '';
  switch (currentScreen) {
    case 'title': html = renderTitle(); break;
    case 'starter': html = renderStarterSelect(); break;
    case 'home': html = renderHome(); break;
    case 'menu': html = renderMenu(); break;
    case 'status': html = renderStatus(); break;
    case 'team': html = renderTeam(); break;
    case 'explore': html = renderExploreSelect(); break;
    case 'exploring': html = renderExploring(); break;
    case 'battle': html = renderBattle(); break;
    case 'train': html = renderTrainSelect(); break;
    case 'training': html = renderTraining(); break;
    case 'feed': html = renderFeed(); break;
    case 'notdex': html = renderNotdex(); break;
    case 'shop': html = renderShop(); break;
    case 'connect': html = renderConnect(); break;
    case 'settings': html = renderSettings(); break;
    case 'evolving': html = renderEvolving(); break;
    // V2 screens
    case 'fusion': html = renderFusion(); break;
    case 'achievements': html = renderAchievements(); break;
    case 'storage': html = renderStorage(); break;
    case 'pvp': html = renderPvP(); break;
    case 'daily': html = renderDaily(); break;
    // V3 screens
    case 'crafting': html = renderCrafting(); break;
    case 'materials': html = renderMaterials(); break;
    case 'swapBattle': html = renderSwapBattle(); break;
    case 'moveLearn': html = renderMoveLearn(); break;
  }

  content.innerHTML = html;

  // Post-render hooks
  if (currentScreen === 'connect') {
    const receiveBtn = document.getElementById('receive-btn');
    if (receiveBtn) receiveBtn.addEventListener('click', handleReceive);
  }
  if (currentScreen === 'home') {
    // Start home music
    if (!getCurrentTrack() || getCurrentTrack() !== 'home') playMusic('home');
  }
  if (currentScreen === 'menu') {
    if (!getCurrentTrack() || getCurrentTrack() !== 'menu') playMusic('menu');
  }
  if (currentScreen === 'exploring') {
    if (!getCurrentTrack() || getCurrentTrack() !== 'explore') playMusic('explore');
  }
}

// ─── Input Handling ───
function handleInput(btn) {
  // Handle messages first — any button dismisses
  if (messageQueue.length > 0) {
    if (btn === 'a' || btn === 'b') { SFX.menuSelect(); dismissMessage(); }
    return;
  }

  switch (currentScreen) {
    case 'title': handleTitleInput(btn); break;
    case 'starter': handleStarterInput(btn); break;
    case 'home': handleHomeInput(btn); break;
    case 'menu': handleMenuInput(btn); break;
    case 'status': handleStatusInput(btn); break;
    case 'team': handleTeamInput(btn); break;
    case 'explore': handleExploreSelectInput(btn); break;
    case 'exploring': handleExploringInput(btn); break;
    case 'battle': handleBattleInput(btn); break;
    case 'train': handleTrainSelectInput(btn); break;
    case 'training': handleTrainingInput(btn); break;
    case 'feed': handleFeedInput(btn); break;
    case 'notdex': handleNotdexInput(btn); break;
    case 'shop': handleShopInput(btn); break;
    case 'connect': handleConnectInput(btn); break;
    case 'settings': handleSettingsInput(btn); break;
    case 'evolving': if (btn === 'a') { SFX.menuSelect(); checkAndNotifyAchievements(); setScreen('home'); } break;
    // V2 screens
    case 'fusion': handleFusionInput(btn); break;
    case 'achievements': handleAchievementsInput(btn); break;
    case 'storage': handleStorageInput(btn); break;
    case 'pvp': handlePvPInput(btn); break;
    case 'daily': handleDailyInput(btn); break;
    // V3 screens
    case 'crafting': handleCraftingInput(btn); break;
    case 'materials': handleMaterialsInput(btn); break;
    case 'swapBattle': handleSwapBattleInput(btn); break;
    case 'moveLearn': handleMoveLearnInput(btn); break;
  }
}

function handleTitleInput(btn) {
  if (btn === 'a') {
    initAudio();
    SFX.boot();
    if (game.hasSave()) {
      game.load();
      // V2: Check daily login
      dailyReward = checkDailyLogin(game);
      game.save();
      screenStack = [];
      if (dailyReward && !game.dailyClaimed) {
        setScreen('daily');
      } else {
        setScreen('home');
        checkAndNotifyAchievements();
      }
    } else {
      subIdx = 0;
      screenStack = [];
      setScreen('starter');
    }
  }
}

function handleStarterInput(btn) {
  if (btn === 'left') { subIdx = Math.max(0, subIdx - 1); SFX.menuMove(); render(); }
  else if (btn === 'right') { subIdx = Math.min(STARTERS.length - 1, subIdx + 1); SFX.menuMove(); render(); }
  else if (btn === 'a') {
    const starter = STARTERS[subIdx];
    const creature = new Creature({
      dna: starter.dna, type: starter.type, level: 5, stage: 'bit', nickname: starter.nickname
    });
    game.started = true;
    game.addToTeam(creature);
    game.save();
    SFX.capture();
    showMessage(`${creature.displayName} joined your team! Take good care of it!`, () => {
      screenStack = [];
      setScreen('home');
    });
  }
}

function handleHomeInput(btn) {
  const c = game.active;
  const hasHeal = game.items.fullRestore > 0 || game.items.healChip > 0;
  const maxIdx = 1 + (hasHeal ? 1 : 0) + (c?.canEvolve ? 1 : 0);

  if (btn === 'left')  { homeActionIdx = Math.max(0, homeActionIdx - 1); SFX.menuMove(); render(); }
  if (btn === 'right') { homeActionIdx = Math.min(maxIdx - 1, homeActionIdx + 1); SFX.menuMove(); render(); }

  if (btn === 'a') {
    SFX.menuSelect();
    if (homeActionIdx === 0) {
      // MENU
      menuIdx = 0; setScreen('menu');
    } else if (homeActionIdx === 1 && hasHeal) {
      // HEAL
      if (!c) return;
      if (c.stats.hp >= c.stats.maxHp) { showMessage(`${c.displayName} is already at full HP!`); return; }
      if (game.items.fullRestore > 0) {
        game.items.fullRestore--;
        c.fullHeal();
        SFX.heal();
        showMessage(`💉 Full Restore! ${c.displayName} fully healed!`);
      } else if (game.items.healChip > 0) {
        game.items.healChip--;
        const healed = Math.min(c.stats.maxHp - c.stats.hp, 50);
        c.stats.hp = Math.min(c.stats.maxHp, c.stats.hp + 50);
        SFX.heal();
        showMessage(`💊 +${healed} HP restored!`);
      }
      game.save();
      render();
    } else {
      // EVOLVE
      if (c?.canEvolve) {
        const oldName = c.displayName;
        c.evolve(); SFX.evolve(); game.save();
        showMessage(`${oldName} is evolving!`, () => setScreen('evolving'));
      }
    }
  }
}

function handleMenuInput(btn) {
  const cols = 4;
  if (btn === 'up') { menuIdx = Math.max(0, menuIdx - cols); SFX.menuMove(); }
  else if (btn === 'down') { menuIdx = Math.min(MENU_ITEMS.length - 1, menuIdx + cols); SFX.menuMove(); }
  else if (btn === 'left') { menuIdx = Math.max(0, menuIdx - 1); SFX.menuMove(); }
  else if (btn === 'right') { menuIdx = Math.min(MENU_ITEMS.length - 1, menuIdx + 1); SFX.menuMove(); }
  else if (btn === 'a') {
    SFX.menuSelect();
    subIdx = 0;
    const item = MENU_ITEMS[menuIdx];
    setScreen(item.id);
  }
  else if (btn === 'b') { SFX.menuBack(); setScreen('home'); screenStack = []; }
  render();
}

function handleStatusInput(btn) {
  if (btn === 'b') { SFX.menuBack(); goBack(); }
  else if (btn === 'a' && game.active?.canEvolve) {
    const c = game.active;
    const oldName = c.displayName;
    c.evolve();
    SFX.evolve();
    game.save();
    showMessage(`${oldName} is evolving...!`, () => setScreen('evolving'));
  }
}

function handleTeamInput(btn) {
  if (btn === 'up') { teamSelectIdx = Math.max(0, teamSelectIdx - 1); SFX.menuMove(); }
  else if (btn === 'down') { teamSelectIdx = Math.min(game.team.length - 1, teamSelectIdx + 1); SFX.menuMove(); }
  else if (btn === 'a') {
    game.swapActive(teamSelectIdx);
    SFX.menuSelect();
    showMessage(`${game.active.displayName} is now active!`);
    game.save();
  }
  else if (btn === 'b') { SFX.menuBack(); goBack(); }
  render();
}

function handleExploreSelectInput(btn) {
  const zones = getAvailableZones(game.active?.level || 1);
  if (btn === 'up') { subIdx = Math.max(0, subIdx - 1); SFX.menuMove(); }
  else if (btn === 'down') { subIdx = Math.min(zones.length - 1, subIdx + 1); SFX.menuMove(); }
  else if (btn === 'a') {
    exploreZone = zones[subIdx];
    exploreSteps = 0;
    SFX.menuSelect();
    setScreen('exploring');
  }
  else if (btn === 'right') {
    // Boss battle!
    const zone = zones[subIdx];
    if (BOSSES[zone.id]) {
      SFX.bossAppear();
      const boss = generateBoss(zone.id);
      showMessage(`👹 ZONE BOSS: ${boss.displayName} Lv.${boss.level}!\nPrepare for battle!`, () => {
        startBattle(boss);
      });
    }
  }
  else if (btn === 'b') { SFX.menuBack(); goBack(); }
  render();
}

function handleExploringInput(btn) {
  if (btn === 'a') {
    exploreSteps++;
    game.totalSteps++;
    SFX.step();

    // Hunger decreases over time
    if (game.active && exploreSteps % 5 === 0) {
      game.active.hunger = Math.max(0, game.active.hunger - 2);
    }

    if (rollEncounter()) {
      const wild = generateWildCreature(exploreZone, game.active.level);
      SFX.encounter();
      showMessage(`A wild ${wild.displayName} appeared!`, () => {
        startBattle(wild);
      });
    }
    render();
  }
  else if (btn === 'b') {
    SFX.menuBack();
    game.save();
    setScreen('explore');
  }
}

function startBattle(enemy) {
  battle = new BattleEngine(game.active, enemy);
  battleState = 'choose';
  battleActionIdx = 0;
  game.totalBattles++;
  playMusic('battle');
  setScreen('battle');
}

function handleBattleInput(btn) {
  const moves = battle.player.moves;
  const maxIdx = 3 + (moves.length > 4 ? 1 : 0) + (game.team.filter(c => c.isAlive && c !== battle.player).length > 0 ? 1 : 0) + 1;

  if (battleState === 'choose') {
    if (btn === 'up') {
      if (battleActionIdx >= 4) battleActionIdx = battleActionIdx === 4 ? moves.length - 1 : 4;
      else battleActionIdx = Math.max(0, battleActionIdx - 1);
      SFX.menuMove();
    }
    else if (btn === 'down') {
      if (battleActionIdx < 4) battleActionIdx = Math.min(moves.length - 1, battleActionIdx + 1);
      else battleActionIdx++;
      SFX.menuMove();
    }
    else if (btn === 'left' || btn === 'right') {
      SFX.menuMove();
    }
    else if (btn === 'a') {
      SFX.menuSelect();
      const action = battleActionIdx;

      if (action < moves.length) {
        // ATTACK
        battleState = 'playerAttack';
        render();
        playMusic('battle');

        // Player attacks
        setTimeout(() => {
          const result = battle.executePlayerMove(moves[action].id);
          render();
          if ((result?.damage || 0) > 0) { SFX.hit(); shakeSprite('.enemy-sprite'); }

          if (result?.fainted || battle.finished) {
            setTimeout(() => {
              battleState = 'result';
              handleBattleEnd();
              render();
            }, 800);
          } else {
            // ENEMY TURN
            battleState = 'enemyAttack';
            render();
            setTimeout(() => {
              const enemyMove = battle.getAIMove();
              const aiResult = battle.executeEnemyMove(enemyMove.id);
              render();
              if ((aiResult?.damage || 0) > 0) { SFX.hit(); shakeSprite('.player-sprite'); }

              setTimeout(() => {
                if (aiResult?.fainted || battle.finished) {
                  battleState = 'result';
                  handleBattleEnd();
                } else {
                  battleState = 'choose';
                }
                render();
              }, 700);
            }, 600);
          }
        }, 300);

      } else if (action === moves.length) {
        // TRAP
        battleState = 'playerAttack';
        render();
        setTimeout(() => {
          const trapType = game.items.shinyTrap ? 'shinyTrap' : game.items.ultraTrap ? 'ultraTrap' : game.items.superTrap ? 'superTrap' : 'dataTrap';
          const rate = trapType === 'ultraTrap' ? 0.7 : trapType === 'superTrap' ? 0.5 : trapType === 'shinyTrap' ? 0.8 : 0.35;
          const caught = Math.random() < rate;
          battle.log.push(`📡 Used ${trapType}!`);
          if (caught) {
            battle.winner = 'capture';
            battle.finished = true;
          } else {
            battle.log.push(`${battle.enemy.displayName} broke free!`);
          }
          render();
          setTimeout(() => {
            if (battle.finished) { battleState = 'result'; handleBattleEnd(); }
            else { battleState = 'choose'; }
            render();
          }, 800);
        }, 300);

      } else if (action === moves.length + 1) {
        // SWAP — show team
        swapMode = true; swapIdx = 0;
        battleState = 'choose'; // reset but we switch screens
        setScreen('swapBattle');
        return;

      } else {
        // RUN
        if (battle.enemy._isBoss) {
          battle.log.push(`❌ Can't run from a Boss!`);
          render();
        } else {
          battle.winner = 'run'; battle.finished = true; battleState = 'result';
          battle.log.push(`🏃 Got away safely!`);
          render();
          setTimeout(() => { handleBattleEnd(); render(); }, 500);
        }
      }
    }
    render();
  } else if (battleState === 'result') {
    if (btn === 'a') {
      SFX.menuSelect();
      battle = null;
      game.save();
      playMusic('home');
      if (currentScreen === 'battle') { setScreen('home'); screenStack = []; }
    }
  }
}

function handleBattleEnd() {
  if (battle.winner === 'player') {
    const enemy = battle.enemy;
    const xpBoost = (game.xpBoosterBattles || 0) > 0;
    const baseXP = 15 + enemy.level * 5;
    const xpGain = xpBoost ? Math.floor(baseXP * 1.5) : baseXP;
    const coinGain = 5 + enemy.level * 2;
    if (xpBoost) game.xpBoosterBattles--;

    const leveled = game.active.addXP(xpGain);
    game.coins += coinGain;
    game.active.wins++;
    game.active.happiness = Math.min(100, game.active.happiness + 5);

    // V3: Material drops
    const drops = rollMaterialDrop(enemy, !!enemy._isBoss);
    if (drops.length) {
      addMaterials(game, drops);
      battle.log.push(`🎁 Drops: ${drops.map(d => MATERIALS[d]?.icon || '📦').join(' ')}`);
    }

    // V3: Shiny counter
    if (enemy.isShiny) {
      game.totalShiny = (game.totalShiny || 0) + 1;
      battle.log.push(`✨ SHINY! (${game.totalShiny} total)`);
    }

    // V2: Boss reward
    if (enemy._isBoss && enemy._zoneId) {
      if (!game.bossesDefeated) game.bossesDefeated = [];
      const firstTime = !game.bossesDefeated.includes(enemy._zoneId);
      if (firstTime) {
        game.bossesDefeated.push(enemy._zoneId);
        const bossData = BOSSES[enemy._zoneId];
        if (bossData?.reward) {
          game.coins += bossData.reward.coins;
          if (bossData.reward.item) game.items[bossData.reward.item] = (game.items[bossData.reward.item] || 0) + 1;
          const bossDrops = rollMaterialDrop(enemy, true);
          addMaterials(game, bossDrops);
          setTimeout(() => {
            showMessage(`👑 BOSS DEFEATED!\n+${bossData.reward.coins} 🪙\n+1 ${ITEMS[bossData.reward.item]?.name || ''}\n🎁 ${bossDrops.map(d => MATERIALS[d]?.icon).join(' ')}`);
          }, 800);
        }
      }
    }

    // V3: Check move learning
    const newMoves = checkMoveLearning(game.active);
    if (newMoves.length) {
      const msg = `📚 ${game.active.displayName} learned: ${newMoves.map(m => MOVES[m]?.name).join(', ')}!\nKeep or forget an old move?`;
      showMessage(msg, () => {
        showMoveLearnScreen(game.active, newMoves);
      });
    }

    SFX.victory();
    const xpMsg = xpBoost ? `+${xpGain} XP (BOOSTED!)` : `+${xpGain} XP`;
    setTimeout(() => {
      showMessage(`${xpMsg}, +${coinGain} 🪙!`);
      if (leveled) {
        SFX.levelUp();
        showMessage(`${game.active.displayName} leveled up to Lv.${game.active.level}!`);
        if (game.active.canEvolve) showMessage(`${game.active.displayName} is ready to evolve!`);
      }
      checkAndNotifyAchievements();
    }, 500);
  } else if (battle.winner === 'capture') {
    const enemy = battle.enemy;
    enemy.fullHeal();
    if (enemy.isShiny) { game.totalShiny = (game.totalShiny || 0) + 1; }
    if (game.addToTeam(enemy)) {
      showMessage(enemy.isShiny ? `✨ SHINY ${enemy.displayName} captured!` : `${enemy.displayName} joined your team!`);
    } else {
      game.addToStorage(enemy);
      showMessage(`${enemy.displayName} sent to storage!`);
    }
    SFX.capture();
  } else {
    game.active.losses++;
    game.active.happiness = Math.max(0, game.active.happiness - 10);
    SFX.defeat();
    // Check if player has other alive Nots to swap in
    const aliveOthers = game.team.filter(c => c.isAlive && c !== game.active);
    if (aliveOthers.length === 0) {
      battle.log.push(`💀 All Nots down!`);
    }
  }
}

// Touch handling for battle special buttons
document.addEventListener('click', (e) => {
  if (currentScreen !== 'battle' || battleState !== 'choose') return;

  const actionBtn = e.target.closest('.battle-action-btn[data-idx]');
  if (actionBtn) {
    e.preventDefault();
    battleActionIdx = parseInt(actionBtn.dataset.idx);
    render();
    handleBattleInput('a');
  }
});

function handleTrainSelectInput(btn) {
  const games = ['rhythm', 'power', 'memory', 'dodge'];
  if (btn === 'up') { subIdx = Math.max(0, subIdx - 1); SFX.menuMove(); }
  else if (btn === 'down') { subIdx = Math.min(games.length - 1, subIdx + 1); SFX.menuMove(); }
  else if (btn === 'a') {
    SFX.train();
    trainGame = games[subIdx];
    trainScore = 0;
    startTraining(trainGame);
    setScreen('training');
  }
  else if (btn === 'b') { SFX.menuBack(); goBack(); }
  render();
}

// ─── V2 Training: Cleanup helper ───
function cleanupTraining() {
  if (window._trainInterval) { clearInterval(window._trainInterval); window._trainInterval = null; }
  if (window._trainTimeout) { clearTimeout(window._trainTimeout); window._trainTimeout = null; }
  if (window._trainRAF) { cancelAnimationFrame(window._trainRAF); window._trainRAF = null; }
}

// ═══════════════════════════════════════════
// V2 Training Mini-Games (Redesigned)
// ═══════════════════════════════════════════

function startTraining(type) {
  cleanupTraining();
  switch (type) {

    // ── RHYTHM BATTLE: Arrows scroll up, tap matching direction in the hit zone ──
    case 'rhythm': {
      trainScore = 0;
      window._rhythmLanes = []; // { dir, y, hit, missed }
      window._rhythmCombo = 0;
      window._rhythmMaxCombo = 0;
      window._rhythmTotal = 0;
      window._rhythmSpawned = 0;
      window._rhythmSpeed = 2.5;
      const dirs = ['left', 'up', 'down', 'right'];
      const icons = { left: '◄', up: '▲', down: '▼', right: '►' };
      window._rhythmIcons = icons;

      window._trainInterval = setInterval(() => {
        // Spawn arrows
        if (window._rhythmSpawned < 30 && Math.random() < 0.12) {
          const dir = dirs[Math.floor(Math.random() * 4)];
          const lane = dirs.indexOf(dir);
          window._rhythmLanes.push({ dir, lane, y: 0, hit: false, missed: false });
          window._rhythmSpawned++;
        }
        // Move arrows down
        window._rhythmLanes.forEach(a => { if (!a.hit) a.y += window._rhythmSpeed; });
        // Speed up over time
        window._rhythmSpeed = Math.min(5, 2.5 + window._rhythmSpawned * 0.05);
        // Check missed (past hit zone)
        window._rhythmLanes.forEach(a => {
          if (!a.hit && !a.missed && a.y > 95) {
            a.missed = true;
            window._rhythmCombo = 0;
            window._rhythmTotal++;
          }
        });
        // Cleanup old
        window._rhythmLanes = window._rhythmLanes.filter(a => a.y < 110);
        // End condition
        if (window._rhythmSpawned >= 30 && window._rhythmLanes.filter(a => !a.hit && !a.missed).length === 0) {
          clearInterval(window._trainInterval); window._trainInterval = null;
          trainScore = Math.floor(trainScore + window._rhythmMaxCombo * 3);
          render();
        }
        render();
      }, 50);
      break;
    }

    // ── POWER STRIKE: Oscillating power meter, stop at the sweet spot ──
    case 'power': {
      trainScore = 0;
      window._powerAngle = 0;
      window._powerRound = 0;
      window._powerMaxRounds = 8;
      window._powerSpeed = 3;
      window._powerResults = [];
      window._powerStopped = false;

      window._trainInterval = setInterval(() => {
        if (!window._powerStopped) {
          window._powerAngle += window._powerSpeed;
          if (window._powerAngle > 360) window._powerAngle -= 360;
        }
        render();
      }, 30);
      break;
    }

    // ── MEMORY GRID: Light up cells in a grid, reproduce the pattern ──
    case 'memory': {
      trainScore = 0;
      window._memGrid = Array(9).fill(0); // 3x3 grid
      window._memSeq = [];
      window._memInput = [];
      window._memRound = 0;
      window._memPhase = 'watch'; // watch, input, correct, wrong
      window._memShowIdx = -1;
      startMemoryGridRound();
      break;
    }

    // ── DODGE RUN: Endless runner, dodge obstacles, collect coins ──
    case 'dodge': {
      trainScore = 0;
      trainTimer = 15000;
      window._dodgeX = 50;
      window._dodgeObstacles = [];
      window._dodgeCoins = [];
      window._dodgeSpeed = 3;
      window._dodgeLives = 3;
      window._dodgeDistance = 0;

      window._trainInterval = setInterval(() => {
        trainTimer -= 50;
        window._dodgeDistance++;
        window._dodgeSpeed = Math.min(7, 3 + window._dodgeDistance * 0.005);

        // Spawn obstacles (varied patterns)
        if (Math.random() < 0.08 + window._dodgeDistance * 0.0003) {
          const pattern = Math.random();
          if (pattern < 0.5) {
            // Single
            window._dodgeObstacles.push({ x: 10 + Math.random() * 80, y: -5, w: 12, emoji: '💥' });
          } else if (pattern < 0.8) {
            // Double gap
            const gap = 20 + Math.random() * 30;
            window._dodgeObstacles.push({ x: gap - 20, y: -5, w: 15, emoji: '🔥' });
            window._dodgeObstacles.push({ x: gap + 20, y: -5, w: 15, emoji: '🔥' });
          } else {
            // Wall with gap
            const gapX = 15 + Math.random() * 70;
            for (let wx = 0; wx < 100; wx += 12) {
              if (Math.abs(wx - gapX) > 15) {
                window._dodgeObstacles.push({ x: wx, y: -5, w: 10, emoji: '⬛' });
              }
            }
          }
        }
        // Spawn coins
        if (Math.random() < 0.06) {
          window._dodgeCoins.push({ x: 10 + Math.random() * 80, y: -5 });
        }

        // Move everything
        window._dodgeObstacles = window._dodgeObstacles.map(o => ({ ...o, y: o.y + window._dodgeSpeed }));
        window._dodgeCoins = window._dodgeCoins.map(c => ({ ...c, y: c.y + window._dodgeSpeed }));

        // Collision check
        window._dodgeObstacles = window._dodgeObstacles.filter(o => {
          if (o.y >= 78 && o.y <= 98 && Math.abs(o.x - window._dodgeX) < (o.w + 8)) {
            window._dodgeLives--;
            SFX.hit();
            if (window._dodgeLives <= 0) {
              trainTimer = 0;
            }
            return false;
          }
          return o.y < 105;
        });

        // Coin collection
        window._dodgeCoins = window._dodgeCoins.filter(c => {
          if (c.y >= 75 && c.y <= 95 && Math.abs(c.x - window._dodgeX) < 14) {
            trainScore += 5;
            SFX.feed();
            return false;
          }
          return c.y < 105;
        });

        // Distance points
        if (window._dodgeDistance % 20 === 0) trainScore++;

        if (trainTimer <= 0) {
          clearInterval(window._trainInterval); window._trainInterval = null;
          finishTraining();
        }
        render();
      }, 50);
      break;
    }
  }
}

// ── Memory Grid helpers ──
function startMemoryGridRound() {
  window._memRound++;
  window._memGrid = Array(9).fill(0);
  // Add a new random cell to sequence
  let newCell;
  do { newCell = Math.floor(Math.random() * 9); }
  while (window._memSeq.length > 0 && newCell === window._memSeq[window._memSeq.length - 1]);
  window._memSeq.push(newCell);
  window._memInput = [];
  window._memPhase = 'watch';
  window._memShowIdx = 0;

  // Show sequence one by one
  let i = 0;
  const show = () => {
    if (i >= window._memSeq.length) {
      window._memGrid = Array(9).fill(0);
      window._memPhase = 'input';
      window._memShowIdx = -1;
      render();
      return;
    }
    window._memGrid = Array(9).fill(0);
    window._memGrid[window._memSeq[i]] = 1;
    window._memShowIdx = i;
    render();
    i++;
    window._trainTimeout = setTimeout(() => {
      window._memGrid = Array(9).fill(0);
      render();
      window._trainTimeout = setTimeout(show, 200);
    }, 500);
  };
  window._trainTimeout = setTimeout(show, 400);
}

// ── Render V2 Training Games ──
function renderTraining() {
  if (!trainGame) return '';
  switch (trainGame) {
    case 'rhythm': return renderRhythm();
    case 'power': return renderPower();
    case 'memory': return renderMemoryGrid();
    case 'dodge': return renderDodgeV2();
    default: return '';
  }
}

function renderRhythm() {
  const icons = window._rhythmIcons || {};
  const lanes = window._rhythmLanes || [];
  const combo = window._rhythmCombo || 0;
  const hitZoneY = 80; // percent
  return `
    <div class="screen-training rhythm-game">
      <div class="rhythm-header">
        <span>⚡ Score: ${trainScore}</span>
        <span class="rhythm-combo ${combo >= 5 ? 'hot' : ''}">${combo > 0 ? `${combo}x COMBO!` : ''}</span>
      </div>
      <div class="rhythm-field">
        <div class="rhythm-hit-zone" style="top:${hitZoneY}%">
          ${['◄','▲','▼','►'].map((ic, i) => `<span class="rhythm-target" style="left:${12 + i * 25}%">${ic}</span>`).join('')}
        </div>
        ${lanes.filter(a => !a.hit).map(a => `
          <div class="rhythm-arrow ${a.missed ? 'missed' : ''}" style="top:${a.y}%;left:${12 + a.lane * 25}%">
            ${icons[a.dir] || '?'}
          </div>
        `).join('')}
      </div>
      <div class="hint">Match arrows with D-pad! • B = Quit</div>
    </div>`;
}

function renderPower() {
  const angle = window._powerAngle || 0;
  const round = window._powerRound || 0;
  const maxR = window._powerMaxRounds || 8;
  const stopped = window._powerStopped;
  // Sweet spot is 70-110 degrees (out of 360)
  const val = Math.sin(angle * Math.PI / 180);
  const pct = Math.max(0, Math.min(100, (val + 1) * 50));
  const inSweet = pct >= 70 && pct <= 90;
  const results = window._powerResults || [];
  return `
    <div class="screen-training power-game">
      <h3>💪 Power Strike (${round}/${maxR})</h3>
      <div class="power-meter">
        <div class="power-fill" style="width:${pct}%"></div>
        <div class="power-sweet-zone"></div>
        <div class="power-needle" style="left:${pct}%"></div>
      </div>
      <div class="power-indicator ${inSweet ? 'sweet' : ''}">${stopped ? (inSweet ? '🎯 PERFECT!' : `${Math.floor(pct)}%`) : '...'}</div>
      <div class="power-results">${results.map(r => `<span class="${r >= 70 && r <= 90 ? 'perfect' : ''}">${r >= 70 && r <= 90 ? '🎯' : '●'}</span>`).join('')}</div>
      <div class="power-score">Score: ${trainScore}</div>
      <div class="hint">${stopped ? 'A = Next round' : 'A = STRIKE!'} • B = Quit</div>
    </div>`;
}

function renderMemoryGrid() {
  const grid = window._memGrid || Array(9).fill(0);
  const phase = window._memPhase || 'watch';
  const round = window._memRound || 0;
  return `
    <div class="screen-training memory-grid-game">
      <div class="mem-header">
        <span>🧠 Round ${round}</span>
        <span>Score: ${trainScore}</span>
      </div>
      <div class="mem-phase">${phase === 'watch' ? 'WATCH...' : phase === 'input' ? 'YOUR TURN!' : phase === 'correct' ? '✅ CORRECT!' : '❌ WRONG!'}</div>
      <div class="mem-grid">
        ${grid.map((v, i) => `
          <div class="mem-cell ${v === 1 ? 'lit' : ''} ${v === 2 ? 'player-lit' : ''} ${v === 3 ? 'wrong-lit' : ''} ${v === 4 ? 'cursor' : ''} ${phase === 'input' ? 'clickable' : ''}" data-cell="${i}"></div>
        `).join('')}
      </div>
      <div class="hint">${phase === 'input' ? 'D-pad + A = Select cell • B = Quit' : phase === 'watch' ? 'Watch the pattern...' : 'A = Continue'}</div>
    </div>`;
}

function renderDodgeV2() {
  const lives = window._dodgeLives || 0;
  const dist = window._dodgeDistance || 0;
  return `
    <div class="screen-training dodge-game-v2">
      <div class="dodge-hud">
        <span>${'❤️'.repeat(lives)}${'🖤'.repeat(Math.max(0, 3 - lives))}</span>
        <span>🪙${trainScore}</span>
        <span>${(trainTimer / 1000).toFixed(1)}s</span>
      </div>
      <div class="dodge-field-v2">
        <div class="dodge-player-v2" style="left:${window._dodgeX || 50}%">
          <img src="${renderCreatureSprite(game.active.dna, game.active.type, game.active.stage, 2)}" draggable="false">
        </div>
        ${(window._dodgeObstacles || []).map(o => `<div class="dodge-obs" style="left:${o.x}%;top:${o.y}%;width:${o.w || 12}%">${o.emoji}</div>`).join('')}
        ${(window._dodgeCoins || []).map(c => `<div class="dodge-coin" style="left:${c.x}%;top:${c.y}%">🪙</div>`).join('')}
        <div class="dodge-ground"></div>
      </div>
      <div class="hint">◄ ► to dodge • B = Quit</div>
    </div>`;
}

// ── V2 Training Input ──
function handleTrainingInput(btn) {
  if (!trainGame) return;
  if (btn === 'b') { cleanupTraining(); cancelTraining(); return; }

  switch (trainGame) {
    case 'rhythm': {
      const dirMap = { up: 'up', down: 'down', left: 'left', right: 'right' };
      if (dirMap[btn]) {
        const hitZone = 72;
        const tolerance = 18;
        let bestMatch = null;
        let bestDist = Infinity;
        for (const a of (window._rhythmLanes || [])) {
          if (a.hit || a.missed || a.dir !== dirMap[btn]) continue;
          const dist = Math.abs(a.y - hitZone);
          if (dist < tolerance && dist < bestDist) {
            bestMatch = a;
            bestDist = dist;
          }
        }
        if (bestMatch) {
          bestMatch.hit = true;
          const accuracy = Math.max(1, Math.floor((tolerance - bestDist) / tolerance * 10));
          trainScore += accuracy;
          window._rhythmCombo = (window._rhythmCombo || 0) + 1;
          window._rhythmMaxCombo = Math.max(window._rhythmMaxCombo || 0, window._rhythmCombo);
          window._rhythmTotal = (window._rhythmTotal || 0) + 1;
          if (window._rhythmCombo >= 5) trainScore += 2; // combo bonus
          SFX.menuSelect();
        } else {
          window._rhythmCombo = 0;
          SFX.error();
        }
        render();
      }
      // Check if game ended (all spawned & processed)
      if (window._rhythmSpawned >= 30 && (window._rhythmLanes || []).filter(a => !a.hit && !a.missed).length === 0 && btn === 'a') {
        finishTraining();
      }
      break;
    }

    case 'power': {
      if (btn === 'a') {
        if (!window._powerStopped) {
          // Stop the needle!
          window._powerStopped = true;
          const val = Math.sin((window._powerAngle || 0) * Math.PI / 180);
          const pct = Math.max(0, Math.min(100, (val + 1) * 50));
          const inSweet = pct >= 70 && pct <= 90;
          window._powerResults = window._powerResults || [];
          window._powerResults.push(Math.floor(pct));
          if (inSweet) {
            trainScore += 15;
            SFX.menuSelect();
          } else {
            trainScore += Math.max(1, Math.floor(pct / 10));
            SFX.hit();
          }
        } else {
          // Next round
          window._powerRound = (window._powerRound || 0) + 1;
          if (window._powerRound >= (window._powerMaxRounds || 8)) {
            cleanupTraining();
            finishTraining();
            return;
          }
          window._powerStopped = false;
          window._powerSpeed = Math.min(8, 3 + window._powerRound * 0.7);
        }
        render();
      }
      break;
    }

    case 'memory': {
      const phase = window._memPhase;
      if (phase === 'input') {
        // Navigate grid with D-pad + A to select
        if (!window._memCursor) window._memCursor = 4; // center
        const c = window._memCursor;
        if (btn === 'up' && c >= 3) { window._memCursor -= 3; SFX.menuMove(); }
        else if (btn === 'down' && c <= 5) { window._memCursor += 3; SFX.menuMove(); }
        else if (btn === 'left' && c % 3 > 0) { window._memCursor -= 1; SFX.menuMove(); }
        else if (btn === 'right' && c % 3 < 2) { window._memCursor += 1; SFX.menuMove(); }
        else if (btn === 'a') {
          const selected = window._memCursor;
          window._memInput.push(selected);
          const idx = window._memInput.length - 1;
          const expected = window._memSeq[idx];

          if (selected !== expected) {
            // Wrong!
            window._memGrid[selected] = 3; // red
            window._memPhase = 'wrong';
            SFX.error();
            trainScore += (window._memRound - 1) * 10;
            render();
            window._trainTimeout = setTimeout(() => {
              cleanupTraining();
              finishTraining();
            }, 800);
          } else {
            // Correct cell
            window._memGrid[selected] = 2; // green
            SFX.menuSelect();
            if (window._memInput.length === window._memSeq.length) {
              // Round complete!
              window._memPhase = 'correct';
              trainScore += window._memRound * 12;
              render();
              if (window._memRound >= 12) {
                window._trainTimeout = setTimeout(() => { cleanupTraining(); finishTraining(); }, 600);
              } else {
                window._trainTimeout = setTimeout(() => startMemoryGridRound(), 700);
              }
            }
          }
        }
        // Highlight cursor
        if (window._memPhase === 'input') {
          const g = Array(9).fill(0);
          window._memInput.forEach(i => g[i] = 2);
          g[window._memCursor] = g[window._memCursor] || 0;
          if (g[window._memCursor] === 0) g[window._memCursor] = 4; // cursor highlight
          window._memGrid = g;
        }
        render();
      } else if (phase === 'correct' || phase === 'wrong') {
        if (btn === 'a') {
          if (phase === 'wrong') { cleanupTraining(); finishTraining(); }
        }
      }
      break;
    }

    case 'dodge': {
      if (btn === 'left') { window._dodgeX = Math.max(5, (window._dodgeX || 50) - 10); render(); }
      if (btn === 'right') { window._dodgeX = Math.min(95, (window._dodgeX || 50) + 10); render(); }
      if (trainTimer <= 0 && btn === 'a') { finishTraining(); }
      break;
    }
  }
}

// Tap on memory grid cells
document.addEventListener('click', (e) => {
  if (currentScreen !== 'training' || trainGame !== 'memory') return;
  const cell = e.target.closest('.mem-cell[data-cell]');
  if (cell && window._memPhase === 'input') {
    window._memCursor = parseInt(cell.dataset.cell);
    handleTrainingInput('a');
  }
});

function finishTraining() {
  cleanupTraining();
  let score = Math.max(0, trainScore);
  const reward = getTrainingReward(trainGame, score);
  const c = game.active;

  if (c) {
    c.addXP(reward.xp || 0);
    const statBoosts = { ...reward };
    delete statBoosts.xp;
    c.train(statBoosts);
    c.hunger = Math.max(0, c.hunger - 10);
  }

  SFX.levelUp();
  const statText = Object.entries(reward).filter(([k]) => k !== 'xp').map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(', ');
  showMessage(`Training complete! Score: ${Math.max(0, trainScore)}${statText ? '\n' + statText : ''}\n+${reward.xp} XP`, () => {
    trainGame = null;
    game.save();
    setScreen('train');
  });
}

function cancelTraining() {
  cleanupTraining();
  trainGame = null;
  trainScore = 0;
  SFX.menuBack();
  setScreen('train');
}

function handleFeedInput(btn) {
  const foodKeys = Object.keys(FOODS);
  if (btn === 'up') { subIdx = Math.max(0, subIdx - 1); SFX.menuMove(); }
  else if (btn === 'down') { subIdx = Math.min(foodKeys.length - 1, subIdx + 1); SFX.menuMove(); }
  else if (btn === 'a') {
    const key = foodKeys[subIdx];
    if ((game.foods[key] || 0) > 0 && game.active) {
      game.foods[key]--;
      game.active.feed(FOODS[key]);
      SFX.feed();
      showMessage(`${game.active.displayName} ate ${FOODS[key].name}! Yum!`);
      game.save();
    } else {
      SFX.error();
      showMessage("You don't have any!");
    }
  }
  else if (btn === 'b') { SFX.menuBack(); goBack(); }
  render();
}

function handleNotdexInput(btn) {
  const total = game.notdex.size;
  const pages = Math.max(1, Math.ceil(total / 6));
  if (btn === 'left') { notdexPage = Math.max(0, notdexPage - 1); SFX.menuMove(); }
  else if (btn === 'right') { notdexPage = Math.min(pages - 1, notdexPage + 1); SFX.menuMove(); }
  else if (btn === 'b') { SFX.menuBack(); goBack(); }
  render();
}

function handleShopInput(btn) {
  const items = shopTab === 0 ? Object.entries(FOODS) : Object.entries(ITEMS);
  if (btn === 'up') { subIdx = Math.max(0, subIdx - 1); SFX.menuMove(); }
  else if (btn === 'down') { subIdx = Math.min(items.length - 1, subIdx + 1); SFX.menuMove(); }
  else if (btn === 'left') { shopTab = 0; subIdx = 0; SFX.menuMove(); }
  else if (btn === 'right') { shopTab = 1; subIdx = 0; SFX.menuMove(); }
  else if (btn === 'a') {
    const [key, item] = items[subIdx];
    if (game.coins >= item.price) {
      game.coins -= item.price;
      if (shopTab === 0) game.foods[key] = (game.foods[key] || 0) + 1;
      else game.items[key] = (game.items[key] || 0) + 1;
      SFX.menuSelect();
      showMessage(`Bought ${item.name}!`);
      game.save();
    } else {
      SFX.error();
      showMessage('Not enough coins!');
    }
  }
  else if (btn === 'b') { SFX.menuBack(); goBack(); }
  render();
}

function handleConnectInput(btn) {
  if (btn === 'up' || btn === 'down') { subIdx = subIdx === 0 ? 1 : 0; SFX.menuMove(); }
  else if (btn === 'a') {
    if (subIdx === 0) {
      connectMode = 'share';
      SFX.menuSelect();
    } else {
      connectMode = 'receive';
      SFX.menuSelect();
    }
  }
  else if (btn === 'b') {
    if (connectMode) { connectMode = null; }
    else { SFX.menuBack(); goBack(); }
  }
  render();
}

function handleReceive() {
  const input = document.getElementById('receive-input');
  if (!input) return;
  const code = input.value.trim();
  if (!code) { SFX.error(); showMessage('Enter a code!'); return; }

  const creature = Creature.fromShareCode(code);
  if (!creature) { SFX.error(); showMessage('Invalid code!'); return; }

  if (game.addToTeam(creature)) {
    SFX.capture();
    showMessage(`${creature.displayName} joined your team!`);
  } else {
    game.addToStorage(creature);
    SFX.capture();
    showMessage(`Team full! ${creature.displayName} sent to storage.`);
  }
  game.save();
  connectMode = null;
  render();
}

function handleSettingsInput(btn) {
  if (btn === 'up') { subIdx = Math.max(0, subIdx - 1); SFX.menuMove(); }
  else if (btn === 'down') { subIdx = Math.min(3, subIdx + 1); SFX.menuMove(); }
  else if (btn === 'a') {
    switch (subIdx) {
      case 0: setMuted(!isMuted()); SFX.menuSelect(); break;
      case 1: game.healAll(); SFX.heal(); showMessage('All Nots healed!'); break;
      case 2: game.save(); SFX.menuSelect(); showMessage('Game saved!'); break;
      case 3:
        if (confirm('Delete all save data?')) {
          game.deleteSave();
          game = new GameState();
          screenStack = [];
          setScreen('title');
          SFX.menuSelect();
        }
        break;
    }
  }
  else if (btn === 'b') { SFX.menuBack(); goBack(); }
  render();
}

// ═══════════════════════════════════════════
// V2 — New Input Handlers
// ═══════════════════════════════════════════

function handleFusionInput(btn) {
  if (btn === 'b') {
    if (fusionStep > 0) { fusionStep--; fusionSelect[fusionStep] = null; }
    else { fusionSelect = [null, null]; fusionStep = 0; SFX.menuBack(); goBack(); }
    render(); return;
  }
  if (fusionStep < 2) {
    if (btn === 'up') { subIdx = Math.max(0, subIdx - 1); SFX.menuMove(); }
    else if (btn === 'down') { subIdx = Math.min(game.team.length - 1, subIdx + 1); SFX.menuMove(); }
    else if (btn === 'a') {
      if (fusionSelect.includes(subIdx) && fusionSelect[fusionStep] !== subIdx) { SFX.error(); render(); return; }
      fusionSelect[fusionStep] = subIdx;
      fusionStep++;
      SFX.menuSelect();
    }
  } else {
    if (btn === 'a') {
      const c1 = game.team[fusionSelect[0]];
      const c2 = game.team[fusionSelect[1]];
      if (!c1 || !c2) { SFX.error(); return; }
      const baby = performFusion(c1, c2);
      // Remove parents (higher index first to avoid shift issues)
      const idxs = [fusionSelect[0], fusionSelect[1]].sort((a, b) => b - a);
      idxs.forEach(idx => game.team.splice(idx, 1));
      if (game.activeIdx >= game.team.length) game.activeIdx = Math.max(0, game.team.length - 1);
      game.addToTeam(baby);
      if (!game.totalFusions) game.totalFusions = 0;
      game.totalFusions++;
      game.save();
      SFX.fusion();
      fusionSelect = [null, null]; fusionStep = 0;
      showMessage(`🧬 Fusion complete!\n${c1.displayName} + ${c2.displayName}\n= ${baby.displayName} (${baby.typeIcon} Lv.${baby.level})`, () => {
        checkAndNotifyAchievements();
        setScreen('home'); screenStack = [];
      });
    }
  }
  render();
}

function handleAchievementsInput(btn) {
  const pages = Math.ceil(ACHIEVEMENTS.length / 5);
  if (btn === 'left') { achievementPage = Math.max(0, achievementPage - 1); SFX.menuMove(); }
  else if (btn === 'right') { achievementPage = Math.min(pages - 1, achievementPage + 1); SFX.menuMove(); }
  else if (btn === 'b') { SFX.menuBack(); goBack(); }
  render();
}

function handleStorageInput(btn) {
  if (btn === 'up') { storageIdx = Math.max(0, storageIdx - 1); SFX.menuMove(); }
  else if (btn === 'down') { storageIdx = Math.min(game.storage.length - 1, storageIdx + 1); SFX.menuMove(); }
  else if (btn === 'a') {
    if (game.storage.length > 0 && game.team.length < 6) {
      const c = game.storage.splice(storageIdx, 1)[0];
      game.addToTeam(c);
      if (storageIdx >= game.storage.length) storageIdx = Math.max(0, game.storage.length - 1);
      SFX.menuSelect();
      showMessage(`${c.displayName} moved to team!`);
      game.save();
    } else if (game.team.length >= 6) {
      SFX.error();
      showMessage('Team is full! (6/6)');
    }
  }
  else if (btn === 'b') { SFX.menuBack(); goBack(); }
  render();
}

function handlePvPInput(btn) {
  if (pvpResult) {
    if (btn === 'a') { pvpResult = null; SFX.menuSelect(); render(); return; }
  }
  if (btn === 'up') { subIdx = Math.max(0, subIdx - 1); SFX.menuMove(); }
  else if (btn === 'down') { subIdx = Math.min(2, subIdx + 1); SFX.menuMove(); }
  else if (btn === 'a') {
    if (subIdx === 0) { pvpMode = 'share'; SFX.menuSelect(); }
    else if (subIdx === 1) { pvpMode = 'challenge'; SFX.pvp(); }
    else if (subIdx === 2) { pvpMode = 'trade'; SFX.menuSelect(); }
  }
  else if (btn === 'b') {
    if (pvpMode) { pvpMode = null; }
    else { SFX.menuBack(); goBack(); }
  }
  render();

  // Bind PvP fight button after render
  setTimeout(() => {
    const fightBtn = document.getElementById('pvp-fight-btn');
    if (fightBtn) fightBtn.addEventListener('click', handlePvPFight);
    const receiveBtn = document.getElementById('receive-btn');
    if (receiveBtn) receiveBtn.addEventListener('click', handleReceive);
  }, 50);
}

function handlePvPFight() {
  const input = document.getElementById('pvp-input');
  if (!input) return;
  const code = input.value.trim();
  if (!code) { SFX.error(); showMessage('Enter a team code!'); return; }
  const enemyTeam = importTeamCode(code);
  if (!enemyTeam || enemyTeam.length === 0) { SFX.error(); showMessage('Invalid team code!'); return; }
  SFX.pvp();
  pvpResult = simulatePvPBattle(game.team, enemyTeam);
  if (!game.totalPvP) game.totalPvP = 0;
  game.totalPvP++;
  if (pvpResult.winner === 'team1') {
    game.coins += 100;
    showMessage('🏆 PvP Victory! +100 🪙');
  }
  game.save();
  pvpMode = null;
  checkAndNotifyAchievements();
  render();
}

function handleDailyInput(btn) {
  if (btn === 'a' && dailyReward && !game.dailyClaimed) {
    claimDailyReward(game, dailyReward);
    SFX.daily();
    showMessage(`📅 Claimed: ${dailyReward.desc}!`);
    game.save();
    checkAndNotifyAchievements();
    render();
  }
  else if (btn === 'b' || (btn === 'a' && game.dailyClaimed)) {
    SFX.menuBack();
    screenStack = [];
    setScreen('home');
    checkAndNotifyAchievements();
  }
}

// ─── V2: Achievement Notification System ───
function checkAndNotifyAchievements() {
  const newAchs = checkAchievements(game);
  if (newAchs.length > 0) {
    game.save();
    newAchs.forEach(a => {
      SFX.achievement();
      showMessage(`🏆 Achievement Unlocked!\n${a.icon} ${a.name}\n${a.desc}\n+${a.reward} 🪙!`);
    });
  }
}

// ─── Idle Animation ───
function startIdleAnimation() {
  if (idleTimer) clearInterval(idleTimer);
  if (blinkTimer) clearInterval(blinkTimer);

  idleTimer = setInterval(() => {
    idleFrame = idleFrame === 0 ? 1 : 0;
    if (currentScreen === 'home') render();
  }, 600);

  blinkTimer = setInterval(() => {
    isBlinking = true;
    if (currentScreen === 'home') render();
    setTimeout(() => {
      isBlinking = false;
      if (currentScreen === 'home') render();
    }, 200);
  }, 3000 + Math.random() * 2000);
}

// ─── Hunger/Happiness decay ───
function startLifeCycle() {
  // ── Every 1 min: hunger decay + passive HP regen ──
  setInterval(() => {
    if (!game.active || !game.started) return;
    // Hunger decay
    game.active.hunger = Math.max(0, game.active.hunger - 1);
    if (game.active.hunger <= 0) {
      game.active.happiness = Math.max(0, game.active.happiness - 2);
    }
    // Passive HP regen (slow): heals 5% max HP every minute when happiness >= 70
    const c = game.active;
    if (c.stats.hp < c.stats.maxHp && c.happiness >= 70 && c.hunger >= 50) {
      const regen = Math.max(1, Math.floor(c.stats.maxHp * 0.05));
      c.stats.hp = Math.min(c.stats.maxHp, c.stats.hp + regen);
      // Show regen indicator
      if (currentScreen === 'home') render();
    }
    game.save();
  }, 60000); // every minute

  // ── Every 3 min: full passive heal if very happy + full hunger ──
  setInterval(() => {
    if (!game.active || !game.started) return;
    const c = game.active;
    if (c.stats.hp < c.stats.maxHp && c.happiness >= 95 && c.hunger >= 90) {
      c.stats.hp = Math.min(c.stats.maxHp, c.stats.hp + Math.floor(c.stats.maxHp * 0.15));
      if (currentScreen === 'home') render();
    }
  }, 180000); // every 3 minutes
}

// ─── Button Event Binding ───
function bindControls() {
  // Physical buttons — use pointer events to avoid double-fire
  let isTouch = false;
  document.querySelectorAll('[data-btn]').forEach(el => {
    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isTouch = true;
      el.classList.add('pressed');
    }, { passive: false });
    el.addEventListener('touchend', (e) => {
      e.preventDefault();
      el.classList.remove('pressed');
      const btn = el.dataset.btn === 'menu' ? 'a' : el.dataset.btn;
      handleInput(btn);
      if (navigator.vibrate) navigator.vibrate(20);
    }, { passive: false });
    el.addEventListener('click', (e) => {
      e.preventDefault();
      if (isTouch) { isTouch = false; return; } // skip if touch already handled
      const btn = el.dataset.btn === 'menu' ? 'a' : el.dataset.btn;
      handleInput(btn);
    });
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    const map = {
      'ArrowUp': 'up', 'ArrowDown': 'down', 'ArrowLeft': 'left', 'ArrowRight': 'right',
      'z': 'a', 'x': 'b', 'Enter': 'a', 'Escape': 'b',
      'w': 'up', 's': 'down', 'a': 'left', 'd': 'right',
    };
    if (map[e.key]) {
      e.preventDefault();
      handleInput(map[e.key]);
    }
  });

  // Touch on screen items
  document.addEventListener('click', (e) => {
    const menuItem = e.target.closest('.menu-item[data-idx]');
    if (menuItem && currentScreen === 'menu') {
      menuIdx = parseInt(menuItem.dataset.idx);
      handleInput('a');
      return;
    }
    const starterCard = e.target.closest('.starter-card[data-idx]');
    if (starterCard && currentScreen === 'starter') {
      subIdx = parseInt(starterCard.dataset.idx);
      render();
      return;
    }
    const actionBtn = e.target.closest('.battle-action-btn[data-idx]');
    if (actionBtn && currentScreen === 'battle' && battleState === 'choose') {
      battleActionIdx = parseInt(actionBtn.dataset.idx);
      render();
      handleInput('a');
      return;
    }
  });
}

// ─── Auto-save ───
function startAutoSave() {
  setInterval(() => {
    if (game.started) game.save();
  }, 30000);
}

// ─── Init ───
export function init() {
  render();
  bindControls();
  startIdleAnimation();
  startLifeCycle();
  startAutoSave();

  // Tap-to-dismiss message overlay (touch + click)
  const overlay = document.getElementById('message-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      e.stopPropagation();
      if (messageQueue.length > 0) { SFX.menuSelect(); dismissMessage(); }
    });
    overlay.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (messageQueue.length > 0) { SFX.menuSelect(); dismissMessage(); }
    }, { passive: false });
  }

  // Prevent double-tap zoom on mobile
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  let lastTap = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTap < 300) e.preventDefault();
    lastTap = now;
  }, { passive: false });
}

// ═══════════════════════════════════════════
// V3 — NEW SCREENS
// ═══════════════════════════════════════════

// ─── Materials Screen ───
let materialsPage = 0;

function renderMaterials() {
  const mats = game.materials || {};
  const entries = Object.entries(mats).filter(([, qty]) => qty > 0);
  return `
    <div class="screen-materials">
      <h2>📦 Items & Materials</h2>
      <div class="mats-grid">
        ${entries.length === 0 ? '<span class="empty-hint">No materials yet! Battle to collect.</span>' : ''}
        ${entries.map(([key, qty], i) => {
          const info = MATERIALS[key] || ITEMS[key] || {};
          return `<div class="mat-card ${subIdx === i ? 'selected' : ''}" data-key="${key}">
            <span class="mat-icon">${info.icon || '📦'}</span>
            <span class="mat-name">${info.name || key}</span>
            <span class="mat-qty">x${qty}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="hint">A = Use • B = Back</div>
    </div>`;
}

function handleMaterialsInput(btn) {
  const mats = Object.entries(game.materials || {}).filter(([, qty]) => qty > 0);
  if (btn === 'up') { subIdx = Math.max(0, subIdx - 2); SFX.menuMove(); }
  else if (btn === 'down') { subIdx = Math.min(mats.length - 1, subIdx + 2); SFX.menuMove(); }
  else if (btn === 'left') { subIdx = Math.max(0, subIdx - 1); SFX.menuMove(); }
  else if (btn === 'right') { subIdx = Math.min(mats.length - 1, subIdx + 1); SFX.menuMove(); }
  else if (btn === 'a') {
    const [key] = mats[subIdx] || [];
    if (key === 'notEssence') {
      game.active.addXP(500);
      game.materials[key]--;
      SFX.levelUp();
      showMessage(`✨ +500 XP to ${game.active.displayName}!`);
    }
  }
  else if (btn === 'b') { SFX.menuBack(); goBack(); }
  render();
}

// ─── Crafting Screen ───
let craftingIdx = 0;

function renderCrafting() {
  const recipes = Object.entries(RECIPES);
  return `
    <div class="screen-crafting">
      <h2>⚒️ Crafting</h2>
      <div class="craft-list">
        ${recipes.map(([id, r], i) => {
          const can = canCraft(game, id);
          const costs = Object.entries(r.materials).map(([m, q]) => {
            const info = MATERIALS[m] || {};
            const has = game.materials?.[m] || 0;
            return `${info.icon || '📦'} ${has}/${q}`;
          }).join(' ');
          return `<div class="craft-card ${craftingIdx === i ? 'selected' : ''} ${can ? 'can-craft' : 'cannot'}" data-idx="${i}">
            <span class="craft-icon">${r.icon || '📦'}</span>
            <div class="craft-info">
              <span>${r.name}</span>
              <small>${r.desc || costs}</small>
            </div>
            <span class="craft-status">${can ? '✅' : '🔒'}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="hint">A = Craft • B = Back</div>
    </div>`;
}

function handleCraftingInput(btn) {
  const recipes = Object.entries(RECIPES);
  if (btn === 'up') { craftingIdx = Math.max(0, craftingIdx - 1); SFX.menuMove(); }
  else if (btn === 'down') { craftingIdx = Math.min(recipes.length - 1, craftingIdx + 1); SFX.menuMove(); }
  else if (btn === 'a') {
    const [id] = recipes[craftingIdx] || [];
    if (id && craftItem(game, id)) {
      SFX.capture();
      const r = RECIPES[id];
      showMessage(`⚒️ Crafted: ${r.icon} ${r.name}!`);
      render();
    } else {
      SFX.menuBack();
      showMessage(`❌ Not enough materials!`);
    }
  }
  else if (btn === 'b') { SFX.menuBack(); goBack(); }
  render();
}

// ─── Swap Battle Screen ───
function renderSwapBattle() {
  const others = game.team.filter(c => c.isAlive && c !== battle.player);
  return `
    <div class="screen-swap-battle">
      <h2>🔄 Swap Not</h2>
      <p class="hint-sm">Choose a Not to send into battle:</p>
      <div class="team-list">
        ${others.map((c, i) => `
          <div class="team-card ${swapIdx === i ? 'selected' : ''}" data-idx="${i}">
            ${creatureImg(c, 3)}
            <div class="team-info">
              <span>${c.isShiny ? '✨ ' : ''}${c.displayName} Lv.${c.level}</span>
              ${hpBar(c.stats.hp, c.stats.maxHp)}
            </div>
          </div>`).join('')}
      </div>
      <div class="hint">A = Send In • B = Cancel</div>
    </div>`;
}

function handleSwapBattleInput(btn) {
  const others = game.team.filter(c => c.isAlive && c !== battle.player);
  if (btn === 'up') { swapIdx = Math.max(0, swapIdx - 1); SFX.menuMove(); }
  else if (btn === 'down') { swapIdx = Math.min(others.length - 1, swapIdx + 1); SFX.menuMove(); }
  else if (btn === 'a') {
    const newActive = others[swapIdx];
    if (newActive) {
      // Swap in battle
      const oldPlayer = battle.player;
      const idx = game.team.indexOf(newActive);
      const oldIdx = game.team.indexOf(oldPlayer);
      game.team[idx] = oldPlayer;
      game.team[oldIdx] = newActive;
      game.active = newActive;
      battle.swapPlayer(newActive);
      battle.log.push(`🔄 Sent in ${newActive.displayName}!`);
      SFX.menuSelect();
      battleState = 'choose';
      battleActionIdx = 0;
      setScreen('battle');
    }
  }
  else if (btn === 'b') { SFX.menuBack(); setScreen('battle'); }
  render();
}

// ─── Move Learning Screen ───
let learnIdx = 0;
let pendingLearnCreature = null;
let pendingLearnMoves = [];
let learnForgetIdx = -1;

function showMoveLearnScreen(creature, newMoves) {
  pendingLearnCreature = creature;
  pendingLearnMoves = newMoves;
  learnIdx = 0;
  learnForgetIdx = -1;
  setScreen('moveLearn');
}

function renderMoveLearn() {
  const c = pendingLearnCreature;
  if (!c) return '<div class="empty">Nothing to learn!</div>';
  const currentMoves = c.moves;
  const newMoves = pendingLearnMoves;

  return `
    <div class="screen-move-learn">
      <h2>📚 ${c.displayName} Learned New Moves!</h2>
      <div class="learn-section">
        <p class="section-title">Choose what to learn:</p>
        ${newMoves.map((m, i) => {
          const mv = MOVES[m];
          return `<div class="learn-move-card ${learnIdx === i ? 'selected' : ''}" data-idx="${i}">
            <span class="type-dot" style="background:${TYPES[mv.type]?.color || '#888'}"></span>
            <span class="learn-move-name">${mv.name}</span>
            <span class="learn-move-stats">PWR ${mv.power || '—'} • ${mv.cat}</span>
            <span class="learn-move-desc">${mv.effect ? `Effect: ${mv.effect}` : ''}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="learn-section">
        <p class="section-title">Current moves (tap one to forget):</p>
        ${currentMoves.map((m, i) => `
          <div class="current-move-card ${learnForgetIdx === i ? 'forget' : ''}" data-idx="${i}">
            <span class="type-dot" style="background:${TYPES[m.type]?.color || '#888'}"></span>
            <span>${m.name}</span>
            <span>PWR ${m.power || '—'}</span>
          </div>`).join('')}
      </div>
      <div class="hint">Select move to learn + select old move to forget • A = Confirm • B = Skip</div>
    </div>`;
}

function handleMoveLearnInput(btn) {
  if (btn === 'up') { learnIdx = Math.max(0, learnIdx - 1); learnForgetIdx = -1; SFX.menuMove(); }
  else if (btn === 'down') { learnIdx = Math.min(pendingLearnMoves.length - 1, learnIdx + 1); SFX.menuMove(); }
  else if (btn === 'a') {
    const c = pendingLearnCreature;
    const newMoveId = pendingLearnMoves[learnIdx];
    if (!newMoveId) return;
    if (c.learnedMoves.length < 4) {
      c.learnMove(newMoveId);
      SFX.menuSelect();
      showMessage(`${c.displayName} learned ${MOVES[newMoveId].name}!`);
      pendingLearnCreature = null; pendingLearnMoves = [];
      goBack();
    } else {
      // Need to forget one
      const forgetIdx = learnForgetIdx;
      if (forgetIdx >= 0 && forgetIdx < c.learnedMoves.length) {
        const oldMove = c.learnedMoves[forgetIdx];
        c.forgetMove(forgetIdx);
        c.learnMove(newMoveId);
        SFX.menuSelect();
        showMessage(`Forgot ${MOVES[oldMove].name}...\nLearned ${MOVES[newMoveId].name}!`);
        pendingLearnCreature = null; pendingLearnMoves = [];
        goBack();
      } else {
        showMessage(`Select an old move to forget first!`);
      }
    }
    render();
  }
  else if (btn === 'b') { SFX.menuBack(); pendingLearnCreature = null; pendingLearnMoves = []; goBack(); }
  render();
}
