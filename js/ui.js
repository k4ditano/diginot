// ═══════════════════════════════════════════
// DigiNot — UI Controller & Screen Manager
// ═══════════════════════════════════════════

import {
  TYPES, STAGES, STAGE_LABELS, ZONES, FOODS, ITEMS, STARTERS,
  xpForLevel, generateName, randomDNA, getTypeForDNA
} from './data.js';
import { renderCreatureSprite, renderCreatureBlinkSprite } from './pixel.js';
import { SFX, initAudio, setMuted, isMuted } from './audio.js';
import {
  Creature, GameState, BattleEngine,
  generateWildCreature, getAvailableZones, rollEncounter, getTrainingReward
} from './game.js';

// ─── State ───
let game = new GameState();
let currentScreen = 'title';
let screenStack = [];
let menuIdx = 0;
let subIdx = 0;
let battle = null;
let battleState = 'choose'; // choose, animating, result
let battleMoveIdx = 0;
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

// ─── Screen Registry ───
const MENU_ITEMS = [
  { id: 'status',  icon: '📊', label: 'Status' },
  { id: 'team',    icon: '👥', label: 'Team' },
  { id: 'explore', icon: '🔍', label: 'Explore' },
  { id: 'train',   icon: '🏋️', label: 'Train' },
  { id: 'feed',    icon: '🍖', label: 'Feed' },
  { id: 'notdex',  icon: '📖', label: 'NotDex' },
  { id: 'shop',    icon: '🛒', label: 'Shop' },
  { id: 'connect', icon: '📡', label: 'Connect' },
  { id: 'settings',icon: '⚙️', label: 'Settings' },
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
  el.innerHTML = `<div class="msg-box"><p>${msg.text}</p><span class="msg-hint">▼ A</span></div>`;
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
    ? renderCreatureBlinkSprite(creature.dna, creature.type, creature.stage, size)
    : renderCreatureSprite(creature.dna, creature.type, creature.stage, size);
  return `<img src="${src}" class="creature-sprite ${className}" alt="${creature.displayName}" draggable="false">`;
}

function hpBar(hp, maxHp) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  const color = pct > 50 ? '#44cc44' : pct > 20 ? '#cccc00' : '#cc3333';
  return `<div class="hp-bar"><div class="hp-fill" style="width:${pct}%;background:${color}"></div></div>
          <span class="hp-text">${hp}/${maxHp}</span>`;
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
      <div class="title-version">v1.0</div>
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

function renderHome() {
  const c = game.active;
  if (!c) return '<div class="empty">No creature!</div>';
  return `
    <div class="screen-home">
      <div class="home-header">
        <span class="creature-name">${c.typeIcon} ${c.displayName}</span>
        <span class="creature-level">Lv.${c.level}</span>
      </div>
      <div class="home-creature ${idleFrame === 1 ? 'bounce' : ''}">
        ${creatureImg(c, 5, 'idle-sprite')}
      </div>
      <div class="home-bars">
        <div class="bar-row"><span class="bar-label">HP</span>${hpBar(c.stats.hp, c.stats.maxHp)}</div>
        <div class="bar-row"><span class="bar-label">XP</span>${xpBar(c.xp, c.level)}</div>
        <div class="bar-row"><span class="bar-label">😊</span><div class="stat-bar"><div class="stat-fill happy" style="width:${c.happiness}%"></div></div></div>
        <div class="bar-row"><span class="bar-label">🍖</span><div class="stat-bar"><div class="stat-fill hunger" style="width:${c.hunger}%"></div></div></div>
      </div>
      <div class="home-footer">
        <span>🪙 ${game.coins}</span>
        <span>${STAGE_LABELS[c.stage]}</span>
        <span>📡 ${game.notdex.size} found</span>
      </div>
      <div class="hint">A = Menu</div>
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
  return `
    <div class="screen-explore-select">
      <h2>🔍 Choose Zone</h2>
      <div class="zone-list">
        ${zones.map((z, i) => `
          <div class="zone-card ${subIdx === i ? 'selected' : ''}" data-idx="${i}" style="border-color:${TYPES[z.types[0]]?.color || '#444'}">
            <span class="zone-icon">${z.icon}</span>
            <span class="zone-name">${z.name}</span>
            <span class="zone-types">${z.types.map(t => TYPES[t]?.icon).join(' ')}</span>
            <span class="zone-level">Lv.${z.minLevel}+</span>
          </div>
        `).join('')}
      </div>
      <div class="hint">▲▼ Navigate • A = Enter • B = Back</div>
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

  let actionArea = '';
  if (battleState === 'choose') {
    const moves = p.moves;
    actionArea = `
      <div class="battle-actions">
        <div class="battle-moves">
          ${moves.map((m, i) => `
            <button class="move-btn ${battleMoveIdx === i ? 'selected' : ''}" data-idx="${i}">
              <span class="move-type-dot" style="background:${TYPES[m.type]?.color || '#888'}"></span>
              ${m.name}
              <small>${m.power || '—'}</small>
            </button>
          `).join('')}
        </div>
        <div class="battle-extra-actions">
          <button class="trap-btn" data-action="catch">📡 Trap (${game.items.dataTrap || 0})</button>
          <button class="run-btn" data-action="run">🏃 Run</button>
        </div>
      </div>`;
  } else if (battleState === 'result') {
    const isWin = battle.winner === 'player' || battle.winner === 'capture';
    actionArea = `<div class="battle-result ${isWin ? 'win' : 'lose'}">${
      battle.winner === 'capture' ? `📡 ${e.displayName} captured!` :
      battle.winner === 'player' ? `🏆 Victory!` : `💀 Defeated...`
    }</div><div class="hint">A = Continue</div>`;
  }

  return `
    <div class="screen-battle">
      <div class="battle-field">
        <div class="battle-enemy">
          <div class="battle-info-enemy">
            <span>${e.typeIcon} ${e.displayName} Lv.${e.level}</span>
            ${hpBar(e.stats.hp, e.stats.maxHp)}
            ${e.status ? `<span class="status-badge">${e.status}</span>` : ''}
          </div>
          <div class="battle-sprite enemy-sprite">
            <img src="${renderCreatureSprite(e.dna, e.type, e.stage, 4)}" draggable="false">
          </div>
        </div>
        <div class="battle-player">
          <div class="battle-sprite player-sprite">
            <img src="${renderCreatureSprite(p.dna, p.type, p.stage, 4)}" draggable="false">
          </div>
          <div class="battle-info-player">
            <span>${p.typeIcon} ${p.displayName} Lv.${p.level}</span>
            ${hpBar(p.stats.hp, p.stats.maxHp)}
            ${p.status ? `<span class="status-badge">${p.status}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="battle-log">${battle.log.slice(-2).join('<br>')}</div>
      ${actionArea}
    </div>`;
}

function renderTrainSelect() {
  const games = [
    { id: 'reaction', icon: '⚡', name: 'Reaction Test', stat: 'SPD', desc: 'Tap when ready!' },
    { id: 'tapping',  icon: '👊', name: 'Tap Frenzy', stat: 'ATK', desc: 'Tap as fast as you can!' },
    { id: 'memory',   icon: '🧠', name: 'Memory Match', stat: 'SP.ATK', desc: 'Remember the pattern!' },
    { id: 'dodge',    icon: '🏃', name: 'Dodge Master', stat: 'DEF', desc: 'Avoid the attacks!' },
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

function renderTraining() {
  if (!trainGame) return '';
  switch (trainGame) {
    case 'reaction': return renderTrainReaction();
    case 'tapping': return renderTrainTapping();
    case 'memory': return renderTrainMemory();
    case 'dodge': return renderTrainDodge();
    default: return '';
  }
}

function renderTrainReaction() {
  return `
    <div class="screen-training reaction-game">
      <h3>⚡ Reaction Test</h3>
      <div class="reaction-circle ${trainScore === -1 ? 'waiting' : trainScore === -2 ? 'ready' : 'done'}">
        ${trainScore === -1 ? 'Wait...' : trainScore === -2 ? 'TAP NOW!' : `${trainScore}ms`}
      </div>
      <div class="hint">${trainScore >= 0 ? 'A = Finish' : 'Tap A when circle turns green!'}</div>
    </div>`;
}

function renderTrainTapping() {
  return `
    <div class="screen-training tapping-game">
      <h3>👊 Tap Frenzy!</h3>
      <div class="tap-counter">${Math.max(0, trainScore)}</div>
      <div class="tap-timer">${trainTimer > 0 ? `${(trainTimer/1000).toFixed(1)}s` : 'TIME!'}</div>
      <div class="tap-target">TAP A!</div>
      <div class="hint">${trainTimer <= 0 ? 'A = Finish' : 'Tap A rapidly!'}</div>
    </div>`;
}

function renderTrainMemory() {
  return `
    <div class="screen-training memory-game">
      <h3>🧠 Memory Match</h3>
      <div class="memory-display">${trainScore === -1 ? 'Watch the pattern...' : trainScore === -2 ? 'Repeat it! Use ▲▼◄►' : `Score: ${Math.max(0, trainScore)}`}</div>
      <div class="memory-sequence">${(window._memoryDisplay || []).map(d => `<span class="mem-dir ${d.active ? 'active' : ''}">${d.icon}</span>`).join('')}</div>
      <div class="hint">${trainScore >= 0 ? 'A = Finish' : 'Watch, then repeat!'}</div>
    </div>`;
}

function renderTrainDodge() {
  return `
    <div class="screen-training dodge-game">
      <h3>🏃 Dodge!</h3>
      <div class="dodge-field">
        <div class="dodge-player" style="left:${window._dodgeX || 50}%">
          <img src="${renderCreatureSprite(game.active.dna, game.active.type, game.active.stage, 2)}" draggable="false">
        </div>
        ${(window._dodgeObstacles || []).map(o => `<div class="dodge-obstacle" style="left:${o.x}%;top:${o.y}%">💥</div>`).join('')}
      </div>
      <div class="dodge-score">Dodged: ${Math.max(0, trainScore)}</div>
      <div class="dodge-timer">${trainTimer > 0 ? `${(trainTimer/1000).toFixed(1)}s` : 'DONE!'}</div>
      <div class="hint">${trainTimer <= 0 ? 'A = Finish' : '◄ ► to dodge!'}</div>
    </div>`;
}

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
  }

  content.innerHTML = html;

  // Post-render hooks
  if (currentScreen === 'connect') {
    const receiveBtn = document.getElementById('receive-btn');
    if (receiveBtn) {
      receiveBtn.addEventListener('click', handleReceive);
    }
  }
}

// ─── Input Handling ───
function handleInput(btn) {
  // Handle messages first
  if (messageQueue.length > 0) {
    if (btn === 'a') { SFX.menuSelect(); dismissMessage(); }
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
    case 'evolving': if (btn === 'a') { SFX.menuSelect(); setScreen('home'); } break;
  }
}

function handleTitleInput(btn) {
  if (btn === 'a') {
    initAudio();
    SFX.boot();
    if (game.hasSave()) {
      game.load();
      screenStack = [];
      setScreen('home');
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
  if (btn === 'a') { menuIdx = 0; setScreen('menu'); SFX.menuSelect(); }
}

function handleMenuInput(btn) {
  const cols = 3;
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
  battleMoveIdx = 0;
  game.totalBattles++;
  setScreen('battle');
}

function handleBattleInput(btn) {
  if (battleState === 'choose') {
    const moves = battle.player.moves;
    if (btn === 'up') { battleMoveIdx = Math.max(0, battleMoveIdx - 1); SFX.menuMove(); }
    else if (btn === 'down') { battleMoveIdx = Math.min(moves.length - 1, battleMoveIdx + 1); SFX.menuMove(); }
    else if (btn === 'left') { battleMoveIdx = Math.max(0, battleMoveIdx - 1); SFX.menuMove(); }
    else if (btn === 'right') { battleMoveIdx = Math.min(moves.length - 1, battleMoveIdx + 1); SFX.menuMove(); }
    else if (btn === 'a') {
      // Check if touch hit catch or run button
      const move = moves[battleMoveIdx];
      SFX.attack();
      battleState = 'animating';
      render();

      // Show attack animation
      const playerSprite = document.querySelector('.player-sprite');
      if (playerSprite) playerSprite.classList.add('attack');

      setTimeout(() => {
        if (playerSprite) playerSprite.classList.remove('attack');
        const results = battle.executeTurn(move.id);

        // Animate hits
        results.forEach((r, i) => {
          setTimeout(() => {
            if (r.damage > 0) {
              SFX.hit();
              const target = r.isPlayer ? '.enemy-sprite' : '.player-sprite';
              const el = document.querySelector(target);
              if (el) {
                el.classList.add('hit');
                setTimeout(() => el.classList.remove('hit'), 400);
              }
            }
          }, i * 400);
        });

        setTimeout(() => {
          if (battle.finished) {
            battleState = 'result';
            handleBattleEnd();
          } else {
            battleState = 'choose';
          }
          render();
        }, results.length * 400 + 200);
      }, 400);
    }
    render();
  } else if (battleState === 'result') {
    if (btn === 'a') {
      SFX.menuSelect();
      battle = null;
      game.save();
      if (currentScreen === 'battle') {
        setScreen('home');
        screenStack = [];
      }
    }
  }
}

function handleBattleEnd() {
  if (battle.winner === 'player') {
    const xpGain = 15 + battle.enemy.level * 5;
    const coinGain = 5 + battle.enemy.level * 2;
    const leveled = game.active.addXP(xpGain);
    game.coins += coinGain;
    game.active.wins++;
    game.active.happiness = Math.min(100, game.active.happiness + 5);
    SFX.victory();
    setTimeout(() => {
      showMessage(`+${xpGain} XP, +${coinGain} 🪙!`);
      if (leveled) {
        SFX.levelUp();
        showMessage(`${game.active.displayName} leveled up to Lv.${game.active.level}!`);
        if (game.active.canEvolve) {
          showMessage(`${game.active.displayName} is ready to evolve! Check Status!`);
        }
      }
    }, 500);
  } else if (battle.winner === 'capture') {
    const enemy = battle.enemy;
    enemy.fullHeal();
    if (game.addToTeam(enemy)) {
      showMessage(`${enemy.displayName} joined your team!`);
    } else {
      game.addToStorage(enemy);
      showMessage(`Team full! ${enemy.displayName} sent to storage.`);
    }
    SFX.capture();
  } else {
    game.active.losses++;
    game.active.happiness = Math.max(0, game.active.happiness - 10);
    SFX.defeat();
  }
}

// Touch handling for battle special buttons
document.addEventListener('click', (e) => {
  if (currentScreen !== 'battle' || battleState !== 'choose') return;

  const trapBtn = e.target.closest('.trap-btn');
  const runBtn = e.target.closest('.run-btn');

  if (trapBtn) {
    e.preventDefault();
    if ((game.items.dataTrap || 0) <= 0) {
      SFX.error();
      showMessage('No Data Traps left!');
      return;
    }
    game.items.dataTrap--;
    SFX.attack();
    battleState = 'animating';
    render();

    setTimeout(() => {
      const caught = battle.attemptCapture('dataTrap');
      if (caught) {
        battleState = 'result';
        handleBattleEnd();
      } else {
        SFX.captureFail();
        // Enemy attacks
        const enemyMove = battle.getAIMove();
        battle.executeMove(battle.enemy, battle.player, enemyMove);
        if (!battle.player.isAlive) {
          battle.finished = true;
          battle.winner = 'enemy';
          battleState = 'result';
          handleBattleEnd();
        } else {
          battleState = 'choose';
        }
      }
      render();
    }, 800);
  }

  if (runBtn) {
    e.preventDefault();
    if (Math.random() < 0.6) {
      SFX.menuBack();
      showMessage('Got away safely!', () => {
        battle = null;
        game.save();
        setScreen('exploring');
      });
    } else {
      SFX.error();
      showMessage("Couldn't escape!", () => {
        // Enemy gets a free attack
        const enemyMove = battle.getAIMove();
        battle.executeMove(battle.enemy, battle.player, enemyMove);
        if (!battle.player.isAlive) {
          battle.finished = true;
          battle.winner = 'enemy';
          battleState = 'result';
          handleBattleEnd();
        }
        render();
      });
    }
  }
});

function handleTrainSelectInput(btn) {
  const games = ['reaction', 'tapping', 'memory', 'dodge'];
  if (btn === 'up') { subIdx = Math.max(0, subIdx - 1); SFX.menuMove(); }
  else if (btn === 'down') { subIdx = Math.min(games.length - 1, subIdx + 1); SFX.menuMove(); }
  else if (btn === 'a') {
    SFX.train();
    trainGame = games[subIdx];
    trainScore = -1; // waiting state
    startTraining(trainGame);
    setScreen('training');
  }
  else if (btn === 'b') { SFX.menuBack(); goBack(); }
  render();
}

function startTraining(type) {
  switch (type) {
    case 'reaction':
      trainScore = -1; // waiting
      const delay = 1500 + Math.random() * 3000;
      window._reactionStart = 0;
      setTimeout(() => {
        trainScore = -2; // ready
        window._reactionStart = Date.now();
        render();
      }, delay);
      break;

    case 'tapping':
      trainScore = 0;
      trainTimer = 5000;
      const tapInterval = setInterval(() => {
        trainTimer -= 100;
        if (trainTimer <= 0) {
          clearInterval(tapInterval);
          finishTraining();
        }
        render();
      }, 100);
      window._tapInterval = tapInterval;
      break;

    case 'memory':
      trainScore = -1;
      window._memorySeq = [];
      window._memoryInput = [];
      window._memoryDisplay = [
        { icon: '▲', dir: 'up', active: false },
        { icon: '▼', dir: 'down', active: false },
        { icon: '◄', dir: 'left', active: false },
        { icon: '►', dir: 'right', active: false },
      ];
      window._memoryRound = 0;
      startMemoryRound();
      break;

    case 'dodge':
      trainScore = 0;
      trainTimer = 8000;
      window._dodgeX = 50;
      window._dodgeObstacles = [];
      const dodgeInterval = setInterval(() => {
        trainTimer -= 100;
        // Spawn obstacles
        if (Math.random() < 0.15) {
          window._dodgeObstacles.push({ x: Math.random() * 90, y: 0 });
        }
        // Move obstacles
        window._dodgeObstacles = window._dodgeObstacles.map(o => ({ ...o, y: o.y + 5 }));
        // Check collisions
        window._dodgeObstacles = window._dodgeObstacles.filter(o => {
          if (o.y >= 75 && o.y <= 95 && Math.abs(o.x - window._dodgeX) < 15) {
            trainTimer = 0; // hit!
            return false;
          }
          if (o.y > 100) {
            trainScore++;
            return false;
          }
          return true;
        });
        if (trainTimer <= 0) {
          clearInterval(dodgeInterval);
          finishTraining();
        }
        render();
      }, 100);
      window._dodgeInterval = dodgeInterval;
      break;
  }
}

function startMemoryRound() {
  window._memoryRound++;
  const dirs = ['up', 'down', 'left', 'right'];
  window._memorySeq.push(dirs[Math.floor(Math.random() * 4)]);
  window._memoryInput = [];
  trainScore = -1;
  render();

  // Show sequence
  let i = 0;
  const showInterval = setInterval(() => {
    if (i >= window._memorySeq.length) {
      clearInterval(showInterval);
      window._memoryDisplay.forEach(d => d.active = false);
      trainScore = -2; // input mode
      render();
      return;
    }
    window._memoryDisplay.forEach(d => d.active = d.dir === window._memorySeq[i]);
    render();
    i++;
  }, 600);
}

function handleTrainingInput(btn) {
  if (!trainGame) return;

  switch (trainGame) {
    case 'reaction':
      if (btn === 'a') {
        if (trainScore === -2) {
          // Tap in time!
          trainScore = Date.now() - window._reactionStart;
          render();
        } else if (trainScore === -1) {
          // Too early!
          trainScore = 999;
          render();
        } else if (trainScore >= 0) {
          finishTraining();
        }
      }
      if (btn === 'b') { cancelTraining(); }
      break;

    case 'tapping':
      if (btn === 'a' && trainTimer > 0) {
        trainScore++;
        render();
      } else if (btn === 'a' && trainTimer <= 0) {
        finishTraining();
      }
      if (btn === 'b') { clearInterval(window._tapInterval); cancelTraining(); }
      break;

    case 'memory':
      if (trainScore === -2) { // input mode
        const dirMap = { up: 'up', down: 'down', left: 'left', right: 'right' };
        if (dirMap[btn]) {
          window._memoryInput.push(dirMap[btn]);
          SFX.menuMove();
          // Check
          const idx = window._memoryInput.length - 1;
          if (window._memoryInput[idx] !== window._memorySeq[idx]) {
            // Wrong!
            trainScore = (window._memoryRound - 1) * 10;
            SFX.error();
            render();
            setTimeout(() => finishTraining(), 500);
          } else if (window._memoryInput.length === window._memorySeq.length) {
            // Correct! Next round
            SFX.menuSelect();
            trainScore = window._memoryRound * 10;
            if (window._memoryRound >= 8) {
              finishTraining();
            } else {
              setTimeout(() => startMemoryRound(), 500);
            }
          }
        }
      }
      if (btn === 'a' && trainScore >= 0) { finishTraining(); }
      if (btn === 'b') { cancelTraining(); }
      break;

    case 'dodge':
      if (btn === 'left') { window._dodgeX = Math.max(5, window._dodgeX - 12); render(); }
      if (btn === 'right') { window._dodgeX = Math.min(95, window._dodgeX + 12); render(); }
      if (btn === 'a' && trainTimer <= 0) { finishTraining(); }
      if (btn === 'b') { clearInterval(window._dodgeInterval); cancelTraining(); }
      break;
  }
}

function finishTraining() {
  let score = Math.max(0, trainScore);

  // Reaction: invert (lower ms = better)
  if (trainGame === 'reaction') {
    score = score < 999 ? Math.max(0, Math.floor((500 - score) / 5)) : 0;
  }

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
  trainGame = null;
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
  setInterval(() => {
    if (!game.active || !game.started) return;
    game.active.hunger = Math.max(0, game.active.hunger - 1);
    if (game.active.hunger <= 0) {
      game.active.happiness = Math.max(0, game.active.happiness - 2);
    }
    game.save();
    if (currentScreen === 'home') render();
  }, 60000); // every minute
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
    const moveBtn = e.target.closest('.move-btn[data-idx]');
    if (moveBtn && currentScreen === 'battle' && battleState === 'choose') {
      battleMoveIdx = parseInt(moveBtn.dataset.idx);
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
