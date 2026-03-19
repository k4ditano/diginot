// ═══════════════════════════════════════════
// DigiNot — Pixel Art Generator V2
// Parametric creature generation with archetype system
// ═══════════════════════════════════════════

import { PALETTES, STAGE_SIZES, hashDNA, TYPES } from './data.js';

// ─── Seeded PRNG (mulberry32) ───
function createRNG(seed) {
  let s = seed | 0;
  return function() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Sizes per stage ───
const SIZES = { bit: 12, byte: 14, kilo: 16, mega: 20, giga: 24 };

// ─── 12 Creature Archetypes ───
const ARCHETYPES = [
  'bipedal', 'quadruped', 'avian', 'serpent', 'insect', 'aquatic',
  'spirit', 'dragon', 'golem', 'plant', 'elemental', 'blob'
];

// Type → archetype weights (higher = more likely)
const TYPE_ARCHETYPES = {
  ember:  [1,1,1,1,0,0,0,4,2,0,3,0],
  flux:   [0,0,0,2,0,4,2,0,0,1,1,3],
  bloom:  [0,2,0,1,3,0,0,0,0,4,1,2],
  spark:  [2,0,3,0,1,0,2,1,0,0,4,0],
  void:   [1,0,0,2,3,0,4,2,0,0,1,1],
  lux:    [2,0,4,0,0,1,3,0,0,1,2,0],
  glitch: [1,1,1,1,2,1,2,1,1,1,2,2],
};

// ─── Archetype body parameters ───
const ARCHETYPE_PARAMS = {
  bipedal:   { headR: .30, bodyW: .40, bodyH: .35, legs: 2, arms: 2, legL: .25, armL: .20, shape: 'oval' },
  quadruped: { headR: .25, bodyW: .55, bodyH: .30, legs: 4, arms: 0, legL: .20, armL: 0,   shape: 'wide' },
  avian:     { headR: .22, bodyW: .30, bodyH: .25, legs: 2, arms: 0, legL: .15, armL: 0,   shape: 'round', wings: true },
  serpent:   { headR: .25, bodyW: .28, bodyH: .55, legs: 0, arms: 0, legL: 0,   armL: 0,   shape: 'tall' },
  insect:    { headR: .22, bodyW: .35, bodyH: .30, legs: 6, arms: 0, legL: .18, armL: 0,   shape: 'oval', antennae: true },
  aquatic:   { headR: .28, bodyW: .45, bodyH: .35, legs: 0, arms: 0, legL: 0,   armL: 0,   shape: 'round', fins: true, tentacles: true },
  spirit:    { headR: .32, bodyW: .35, bodyH: .45, legs: 0, arms: 2, legL: 0,   armL: .22, shape: 'ghost' },
  dragon:    { headR: .28, bodyW: .45, bodyH: .35, legs: 2, arms: 0, legL: .18, armL: 0,   shape: 'wide', wings: true, horns: true },
  golem:     { headR: .25, bodyW: .55, bodyH: .40, legs: 2, arms: 2, legL: .15, armL: .18, shape: 'blocky' },
  plant:     { headR: .30, bodyW: .40, bodyH: .35, legs: 0, arms: 0, legL: 0,   armL: 0,   shape: 'bulb', leaves: true },
  elemental: { headR: .25, bodyW: .35, bodyH: .50, legs: 0, arms: 0, legL: 0,   armL: 0,   shape: 'flame' },
  blob:      { headR: 0,   bodyW: .55, bodyH: .50, legs: 0, arms: 0, legL: 0,   armL: 0,   shape: 'blob' },
};

// ─── Eye styles ───
// Each: [name, drawFn index, widthInPx, heightInPx]
const EYE_STYLES = ['dot','round','angry','cute','slit','wide','hollow','glow'];
const MOUTH_STYLES = ['none','dot','line','smile','frown','fangs','open','beak'];

// ═══════════════════════════════════════════
// MAIN GENERATION
// ═══════════════════════════════════════════

export function generateCreatureGrid(dna, type, stage) {
  const seed = hashDNA(dna);
  const rng = createRNG(seed);
  const size = SIZES[stage] || 12;
  const stageIdx = ['bit','byte','kilo','mega','giga'].indexOf(stage);

  // Grid: 0=empty, 1=outline, 2=shadow, 3=base, 4=highlight, 5=eye, 6=accent, 7=mouth
  const grid = Array.from({ length: size }, () => new Array(size).fill(0));

  // ─── 1. Pick archetype from DNA + type ───
  const archetype = pickArchetype(seed, type, rng);
  const params = { ...ARCHETYPE_PARAMS[archetype] };

  // ─── 2. DNA modifiers (variation within archetype) ───
  params.headR   += (((seed >> 2) & 0xF) / 15 - 0.5) * 0.1;
  params.bodyW   += (((seed >> 6) & 0xF) / 15 - 0.5) * 0.12;
  params.bodyH   += (((seed >> 10) & 0xF) / 15 - 0.5) * 0.1;
  params.legL    += (((seed >> 14) & 0x7) / 7 - 0.3) * 0.08;
  params.armL    += (((seed >> 17) & 0x7) / 7 - 0.3) * 0.08;
  params.headR = Math.max(0.12, Math.min(0.45, params.headR));
  params.bodyW = Math.max(0.2, Math.min(0.7, params.bodyW));
  params.bodyH = Math.max(0.2, Math.min(0.65, params.bodyH));

  // Evolution scaling: higher stages = more features
  const evoScale = 1 + stageIdx * 0.15;
  params.bodyW *= evoScale;
  params.bodyH *= evoScale;
  if (stageIdx >= 2 && !params.horns) params.horns = rng() < 0.4;
  if (stageIdx >= 3 && !params.wings) params.wings = rng() < 0.3;

  const cx = Math.floor(size / 2);

  // ─── 3. Draw body ───
  const bodyTop = Math.floor(size * (params.headR > 0 ? params.headR + 0.05 : 0.1));
  const bodyBot = Math.floor(size * (1 - params.legL - 0.05));
  const bodyCY = Math.floor((bodyTop + bodyBot) / 2);
  const bodyRX = Math.floor(size * params.bodyW / 2);
  const bodyRY = Math.floor((bodyBot - bodyTop) / 2);

  drawBody(grid, cx, bodyCY, bodyRX, bodyRY, params.shape, rng, size);

  // ─── 4. Draw head ───
  let headCY = bodyTop;
  let headR = Math.max(2, Math.floor(size * params.headR / 2));
  if (params.headR > 0) {
    headCY = Math.max(headR + 1, bodyTop - Math.floor(headR * 0.3));
    drawEllipse(grid, cx, headCY, headR + 1, headR, 3, rng, 0.15, size);
    // Connect head to body (neck)
    for (let y = headCY + headR - 1; y <= bodyTop + 1; y++) {
      const neckW = Math.max(1, Math.floor(headR * 0.6));
      for (let dx = -neckW; dx <= neckW; dx++) {
        const px = cx + dx;
        if (px >= 0 && px < size && y >= 0 && y < size) {
          if (grid[y][px] === 0) grid[y][px] = 3;
        }
      }
    }
  }

  // ─── 5. Draw legs ───
  if (params.legs > 0) {
    const legPairs = Math.ceil(params.legs / 2);
    const legLen = Math.max(1, Math.floor(size * params.legL));
    for (let p = 0; p < legPairs; p++) {
      const spread = Math.floor(bodyRX * (0.3 + p * 0.35));
      const legTop = bodyBot - 1;
      for (let i = 0; i < legLen; i++) {
        const ly = legTop + 1 + i;
        if (ly >= size) break;
        const wobble = params.legs >= 4 ? Math.floor(rng() * 2 - 0.5) : 0;
        setMirror(grid, cx, spread + wobble, ly, 3, size);
        if (legLen > 2) setMirror(grid, cx, spread + wobble + 1, ly, rng() < 0.5 ? 3 : 0, size);
      }
      // Feet
      if (legTop + legLen < size) {
        setMirror(grid, cx, spread + 1, legTop + legLen, rng() < 0.7 ? 3 : 0, size);
      }
    }
  }

  // ─── 6. Draw arms ───
  if (params.arms > 0 && params.armL > 0) {
    const armLen = Math.max(1, Math.floor(size * params.armL));
    const armY = Math.floor(bodyCY - bodyRY * 0.2);
    for (let i = 0; i < armLen; i++) {
      const ax = bodyRX + 1 + i;
      const ay = armY + Math.floor(i * 0.5);
      if (ay < size) {
        setMirror(grid, cx, ax, ay, 3, size);
        if (i === armLen - 1) { // hand
          setMirror(grid, cx, ax, ay + 1, rng() < 0.6 ? 6 : 3, size);
        }
      }
    }
  }

  // ─── 7. Draw wings ───
  if (params.wings) {
    const wingLen = Math.max(2, Math.floor(size * 0.2 * evoScale));
    const wingTop = Math.floor(bodyCY - bodyRY * 0.6);
    for (let i = 0; i < wingLen; i++) {
      const wx = bodyRX + 1 + i;
      for (let dy = 0; dy <= Math.max(1, wingLen - i - 1); dy++) {
        const wy = wingTop + dy;
        if (wy >= 0 && wy < size) {
          setMirror(grid, cx, wx, wy, (i === 0 || dy === 0) ? 6 : (rng() < 0.6 ? 6 : 0), size);
        }
      }
    }
  }

  // ─── 8. Draw horns ───
  if (params.horns) {
    const hornLen = Math.max(1, 1 + stageIdx);
    const hornX = Math.floor(headR * 0.5);
    for (let i = 0; i < hornLen; i++) {
      const hy = headCY - headR - i;
      if (hy >= 0) {
        setMirror(grid, cx, hornX + Math.floor(i * 0.3), hy, 6, size);
      }
    }
  }

  // ─── 9. Draw antennae ───
  if (params.antennae) {
    const antLen = Math.max(1, 2 + Math.floor(stageIdx * 0.5));
    const antX = Math.floor(headR * 0.4);
    for (let i = 0; i < antLen; i++) {
      const ay = headCY - headR - 1 - i;
      if (ay >= 0) {
        setMirror(grid, cx, antX + (i > antLen / 2 ? 1 : 0), ay, 6, size);
      }
    }
    // Tips
    const tipY = headCY - headR - 1 - antLen;
    if (tipY >= 0) setMirror(grid, cx, antX + 1, tipY, 6, size);
  }

  // ─── 10. Draw fins ───
  if (params.fins) {
    const finLen = Math.max(1, Math.floor(size * 0.12));
    const finY = bodyCY;
    for (let i = 0; i < finLen; i++) {
      setMirror(grid, cx, bodyRX + 1 + i, finY - i, 6, size);
      setMirror(grid, cx, bodyRX + 1 + i, finY + i, 6, size);
    }
  }

  // ─── 11. Draw tentacles ───
  if (params.tentacles) {
    const tentCount = 2 + Math.floor(rng() * 2);
    for (let t = 0; t < tentCount; t++) {
      const tx = Math.floor(bodyRX * (0.2 + t * 0.35));
      const tentLen = Math.max(2, Math.floor(size * 0.15));
      for (let i = 0; i < tentLen; i++) {
        const ty = bodyBot + i;
        const wobble = Math.floor(Math.sin(i * 1.5 + t) * 1.5);
        if (ty < size) setMirror(grid, cx, tx + wobble, ty, 3, size);
      }
    }
  }

  // ─── 12. Draw leaves ───
  if (params.leaves) {
    const leafCount = 2 + Math.floor(rng() * 2);
    for (let l = 0; l < leafCount; l++) {
      const angle = (l / leafCount) * Math.PI * 0.8 + 0.3;
      const leafLen = Math.max(2, Math.floor(size * 0.15));
      for (let i = 0; i < leafLen; i++) {
        const lx = Math.floor(Math.cos(angle) * (bodyRX + i));
        const ly = Math.floor(bodyCY - bodyRY * 0.5 + Math.sin(angle) * i * 0.5) - i;
        if (ly >= 0 && ly < size) setMirror(grid, cx, Math.abs(lx), ly, 6, size);
      }
    }
  }

  // ─── 13. Apply body pattern ───
  applyPattern(grid, seed, rng, size);

  // ─── 14. Add shading ───
  addShading(grid, cx, bodyCY, rng, size);

  // ─── 15. Add outline ───
  addOutline(grid, size);

  // ─── 16. Draw face ───
  const faceCY = params.headR > 0 ? headCY : Math.floor(bodyCY - bodyRY * 0.3);
  const faceR = params.headR > 0 ? headR : bodyRX;
  drawFace(grid, cx, faceCY, faceR, seed, rng, size, stageIdx);

  return grid;
}

// ═══════════════════════════════════════════
// DRAWING HELPERS
// ═══════════════════════════════════════════

function pickArchetype(seed, type, rng) {
  const weights = TYPE_ARCHETYPES[type] || TYPE_ARCHETYPES.ember;
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = (seed % total);
  for (let i = 0; i < ARCHETYPES.length; i++) {
    roll -= weights[i];
    if (roll < 0) return ARCHETYPES[i];
  }
  return ARCHETYPES[0];
}

function setMirror(grid, cx, dx, y, val, size) {
  const x1 = cx - dx, x2 = cx + dx;
  if (y >= 0 && y < size) {
    if (x1 >= 0 && x1 < size && (grid[y][x1] === 0 || val > grid[y][x1])) grid[y][x1] = val;
    if (x2 >= 0 && x2 < size && (grid[y][x2] === 0 || val > grid[y][x2])) grid[y][x2] = val;
  }
}

function drawEllipse(grid, cx, cy, rx, ry, val, rng, noise, size) {
  for (let y = cy - ry; y <= cy + ry; y++) {
    for (let x = cx - rx; x <= cx + rx; x++) {
      if (x < 0 || x >= size || y < 0 || y >= size) continue;
      const dx = (x - cx) / (rx || 1);
      const dy = (y - cy) / (ry || 1);
      const dist = dx * dx + dy * dy;
      const threshold = 1.0 + (rng() - 0.5) * noise * 2;
      if (dist < threshold) {
        if (grid[y][x] === 0) grid[y][x] = val;
      }
    }
  }
}

function drawBody(grid, cx, cy, rx, ry, shape, rng, size) {
  for (let y = cy - ry - 1; y <= cy + ry + 1; y++) {
    for (let x = cx - rx - 1; x <= cx + rx + 1; x++) {
      if (x < 0 || x >= size || y < 0 || y >= size) continue;
      const dx = (x - cx) / (rx || 1);
      const dy = (y - cy) / (ry || 1);
      let dist;

      switch (shape) {
        case 'oval':    dist = dx*dx + dy*dy; break;
        case 'round':   dist = dx*dx + dy*dy; break;
        case 'wide':    dist = dx*dx*0.7 + dy*dy*1.4; break;
        case 'tall':    dist = dx*dx*1.5 + dy*dy*0.6; break;
        case 'blocky':  dist = Math.max(Math.abs(dx)*0.9, Math.abs(dy)*0.9); break;
        case 'ghost':   dist = dx*dx + dy*dy * (y < cy ? 0.8 : 0.5); break; // wider at bottom
        case 'bulb':    dist = dx*dx + dy*dy * (y < cy ? 1.5 : 0.6); break; // wider at bottom like a bulb
        case 'flame':   dist = dx*dx * (1 + (cy - y) / (ry * 3)) + dy*dy*0.7; break; // narrow at top
        case 'blob':    dist = dx*dx + dy*dy + (rng() - 0.5) * 0.4; break; // very noisy
        default:        dist = dx*dx + dy*dy; break;
      }

      const threshold = 1.0 + (rng() - 0.5) * 0.25;
      if (dist < threshold) {
        grid[y][x] = 3;
      }
    }
  }
}

function applyPattern(grid, seed, rng, size) {
  const patternType = (seed >> 18) & 0x7; // 8 pattern types
  if (patternType === 0) return; // plain

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x] !== 3 && grid[y][x] !== 2) continue;

      let apply = false;
      switch (patternType) {
        case 1: apply = (y % 3 === 0); break; // horizontal stripes
        case 2: apply = ((x + y) % 4 === 0); break; // diagonal stripes
        case 3: apply = (x % 3 === 0 && y % 3 === 0); break; // dots
        case 4: apply = ((x * 7 + y * 13 + seed) % 11 < 3); break; // noise spots
        case 5: apply = (Math.abs(x - size/2) + Math.abs(y - size/2)) % 4 === 0; break; // diamond
        case 6: apply = (y % 2 === 0 && x % 2 === 0); break; // checkerboard sparse
        case 7: apply = ((x * 3 + y * 5 + seed) % 7 < 2); break; // scattered
      }
      if (apply) grid[y][x] = 6; // accent color
    }
  }
}

function addShading(grid, cx, cy, rng, size) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x] !== 3) continue;
      // Shadow on left side and bottom
      if (x < cx - 1 && y > cy) { if (rng() < 0.4) grid[y][x] = 2; }
      // Highlight on right side and top
      else if (x > cx + 1 && y < cy) { if (rng() < 0.3) grid[y][x] = 4; }
    }
  }
}

function addOutline(grid, size) {
  const copy = grid.map(r => [...r]);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (copy[y][x] !== 0) continue;
      const neighbors = [
        y > 0 ? copy[y-1][x] : 0,
        y < size-1 ? copy[y+1][x] : 0,
        x > 0 ? copy[y][x-1] : 0,
        x < size-1 ? copy[y][x+1] : 0,
      ];
      if (neighbors.some(n => n >= 2 && n !== 5 && n !== 7)) {
        grid[y][x] = 1;
      }
    }
  }
}

// ─── Face drawing ───
function drawFace(grid, cx, cy, radius, seed, rng, size, stageIdx) {
  const eyeStyle = (seed >> 20) & 0x7;
  const mouthStyle = (seed >> 23) & 0x7;
  const eyeSpacing = Math.max(1, Math.floor(radius * 0.55));
  const eyeY = cy - Math.max(0, Math.floor(radius * 0.15));

  // ── EYES ──
  const eL = cx - eyeSpacing;
  const eR = cx + eyeSpacing;

  switch (eyeStyle) {
    case 0: // dot
      safeSet(grid, eL, eyeY, 5, size);
      safeSet(grid, eR, eyeY, 5, size);
      break;
    case 1: // round (2px with highlight)
      safeSet(grid, eL, eyeY, 5, size);
      safeSet(grid, eR, eyeY, 5, size);
      safeSet(grid, eL+1, eyeY, 4, size); // highlight
      safeSet(grid, eR-1, eyeY, 4, size);
      break;
    case 2: // angry (slanted)
      safeSet(grid, eL, eyeY, 5, size);
      safeSet(grid, eR, eyeY, 5, size);
      safeSet(grid, eL+1, eyeY-1, 1, size); // brow
      safeSet(grid, eR-1, eyeY-1, 1, size);
      break;
    case 3: // cute (large 2x2)
      safeSet(grid, eL, eyeY, 5, size);
      safeSet(grid, eR, eyeY, 5, size);
      safeSet(grid, eL, eyeY+1, 5, size);
      safeSet(grid, eR, eyeY+1, 5, size);
      safeSet(grid, eL+1, eyeY, 4, size); // big shine
      safeSet(grid, eR-1, eyeY, 4, size);
      break;
    case 4: // slit (vertical)
      safeSet(grid, eL, eyeY-1, 5, size);
      safeSet(grid, eL, eyeY, 5, size);
      safeSet(grid, eR, eyeY-1, 5, size);
      safeSet(grid, eR, eyeY, 5, size);
      break;
    case 5: // wide
      safeSet(grid, eL-1, eyeY, 5, size);
      safeSet(grid, eL, eyeY, 5, size);
      safeSet(grid, eR, eyeY, 5, size);
      safeSet(grid, eR+1, eyeY, 5, size);
      break;
    case 6: // cyclops (single large eye)
      safeSet(grid, cx, eyeY, 5, size);
      safeSet(grid, cx-1, eyeY, 5, size);
      safeSet(grid, cx+1, eyeY, 5, size);
      safeSet(grid, cx, eyeY+1, 5, size);
      safeSet(grid, cx+1, eyeY, 4, size); // shine
      break;
    case 7: // glowing (with surrounding glow)
      safeSet(grid, eL, eyeY, 5, size);
      safeSet(grid, eR, eyeY, 5, size);
      // Glow pixels around eyes
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (rng() < 0.4) {
            safeSet(grid, eL+dx, eyeY+dy, 4, size);
            safeSet(grid, eR+dx, eyeY+dy, 4, size);
          }
        }
      }
      break;
  }

  // ── MOUTH ──
  const mouthY = cy + Math.max(1, Math.floor(radius * 0.35));

  switch (mouthStyle) {
    case 0: break; // none
    case 1: // dot
      safeSet(grid, cx, mouthY, 7, size);
      break;
    case 2: // line
      safeSet(grid, cx-1, mouthY, 7, size);
      safeSet(grid, cx, mouthY, 7, size);
      safeSet(grid, cx+1, mouthY, 7, size);
      break;
    case 3: // smile
      safeSet(grid, cx-1, mouthY, 7, size);
      safeSet(grid, cx, mouthY, 7, size);
      safeSet(grid, cx+1, mouthY, 7, size);
      safeSet(grid, cx-2, mouthY-1, 7, size);
      safeSet(grid, cx+2, mouthY-1, 7, size);
      break;
    case 4: // frown
      safeSet(grid, cx-1, mouthY, 7, size);
      safeSet(grid, cx, mouthY, 7, size);
      safeSet(grid, cx+1, mouthY, 7, size);
      safeSet(grid, cx-2, mouthY+1, 7, size);
      safeSet(grid, cx+2, mouthY+1, 7, size);
      break;
    case 5: // fangs
      safeSet(grid, cx, mouthY, 7, size);
      safeSet(grid, cx-1, mouthY+1, 4, size);
      safeSet(grid, cx+1, mouthY+1, 4, size);
      break;
    case 6: // open (O mouth)
      safeSet(grid, cx, mouthY, 7, size);
      safeSet(grid, cx-1, mouthY, 7, size);
      safeSet(grid, cx+1, mouthY, 7, size);
      safeSet(grid, cx, mouthY+1, 7, size);
      break;
    case 7: // beak
      safeSet(grid, cx, mouthY, 6, size);
      safeSet(grid, cx, mouthY+1, 6, size);
      safeSet(grid, cx-1, mouthY, 6, size);
      safeSet(grid, cx+1, mouthY, 6, size);
      break;
  }
}

function safeSet(grid, x, y, val, size) {
  if (x >= 0 && x < size && y >= 0 && y < size) {
    grid[y][x] = val;
  }
}

// ═══════════════════════════════════════════
// HSL-BASED COLORING
// ═══════════════════════════════════════════

const TYPE_HUE = {
  ember: [0, 35], flux: [190, 230], bloom: [85, 145],
  spark: [40, 65], void: [260, 310], lux: [30, 55], glitch: [0, 360],
};

function generatePalette(dna, type, isShinyFlag) {
  const h = hashDNA(dna);
  const [hMin, hMax] = TYPE_HUE[type] || [0, 360];
  const hue = hMin + ((h >> 4) & 0xFF) / 255 * (hMax - hMin);
  const satVar = ((h >> 12) & 0xF) / 15;
  const sat = type === 'glitch' ? 80 + satVar * 20 : 55 + satVar * 35;
  const hueShift = ((h >> 16) & 0xF) / 15 * 30 - 15;

  // ── SHINY: completely different hue (shifted by 120-240 deg + saturation boost) ──
  let shHue = hue;
  let shSat = sat;
  let shLight = 55;
  if (isShinyFlag) {
    const sh = hashDNA(dna + '_shiny_');
    shHue = ((h >> 20) & 0xFF) / 255 * 360; // full spectrum
    shSat = 85 + (((h >> 24) & 0xF) / 15) * 15;
    shLight = 50 + (((h >> 28) & 0xF) / 15) * 25;
    // Occasional gold/rainbow tint
    if ((h & 0xFF) < 20) { shHue = 45; shSat = 95; shLight = 65; } // gold
  }

  return {
    outline:   hsl(shHue, shSat * 0.4, 15),
    shadow:    hsl(shHue, shSat * 0.75, 25),
    base:      hsl(shHue, shSat, shLight),
    highlight: hsl(shHue, shSat * 0.6, Math.min(90, shLight + 30)),
    eye:       isShinyFlag ? hsl(shHue + 60, 100, 75) : (type === 'void' ? '#ff3333' : type === 'glitch' ? '#ffff00' : '#ffffff'),
    accent:    hsl(shHue + hueShift + 40, Math.min(100, shSat + 15), 60),
    mouth:     hsl(shHue, shSat * 0.5, 18),
    // Shiny gets extra sparkle color
    sparkle:   isShinyFlag ? hsl(shHue + 120, 100, 80) : null,
  };
}

function hsl(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));
  return `hsl(${Math.round(h)},${Math.round(s)}%,${Math.round(l)}%)`;
}

// ═══════════════════════════════════════════
// RENDERING TO CANVAS
// ═══════════════════════════════════════════

const spriteCache = new Map();

export function renderCreatureSprite(dna, type, stage, pixelSize = 4, isShinyFlag = false) {
  const cacheKey = `${dna}_${type}_${stage}_${pixelSize}_${isShinyFlag}`;
  if (spriteCache.has(cacheKey)) return spriteCache.get(cacheKey);

  const grid = generateCreatureGrid(dna, type, stage);
  const size = grid.length;
  const pal = generatePalette(dna, type, isShinyFlag);

  const canvas = document.createElement('canvas');
  canvas.width = size * pixelSize;
  canvas.height = size * pixelSize;
  const ctx = canvas.getContext('2d');

  const colorMap = {
    1: pal.outline, 2: pal.shadow, 3: pal.base,
    4: pal.highlight, 5: pal.eye, 6: pal.accent, 7: pal.mouth,
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const val = grid[y][x];
      if (val === 0) continue;
      ctx.fillStyle = colorMap[val] || pal.base;
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
  }

  // Shiny sparkle effect: 5-8 colored dots orbiting the creature
  if (isShinyFlag && pal.sparkle) {
    const cx = Math.floor(size / 2) * pixelSize + pixelSize / 2;
    const cy = Math.floor(size / 2) * pixelSize + pixelSize / 2;
    const r = size * pixelSize * 0.5;
    ctx.fillStyle = pal.sparkle;
    const numSparkles = 6;
    for (let i = 0; i < numSparkles; i++) {
      const angle = (i / numSparkles) * Math.PI * 2;
      const dist = r + Math.sin(i * 1.3) * 2;
      const sx = cx + Math.cos(angle) * dist;
      const sy = cy + Math.sin(angle) * dist;
      ctx.beginPath();
      ctx.arc(sx, sy, pixelSize * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const dataURL = canvas.toDataURL();
  spriteCache.set(cacheKey, dataURL);
  return dataURL;
}

export function renderCreatureBlinkSprite(dna, type, stage, pixelSize = 4, isShinyFlag = false) {
  const cacheKey = `${dna}_${type}_${stage}_${pixelSize}_${isShinyFlag}_blink`;
  if (spriteCache.has(cacheKey)) return spriteCache.get(cacheKey);

  const grid = generateCreatureGrid(dna, type, stage);
  const size = grid.length;
  const pal = generatePalette(dna, type, isShinyFlag);

  // Eyes → outline for blink
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x] === 5) grid[y][x] = 1;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = size * pixelSize;
  canvas.height = size * pixelSize;
  const ctx = canvas.getContext('2d');

  const colorMap = {
    1: pal.outline, 2: pal.shadow, 3: pal.base,
    4: pal.highlight, 5: pal.eye, 6: pal.accent, 7: pal.mouth,
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const val = grid[y][x];
      if (val === 0) continue;
      ctx.fillStyle = colorMap[val] || pal.base;
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
  }

  const dataURL = canvas.toDataURL();
  spriteCache.set(cacheKey, dataURL);
  return dataURL;
}

export function clearSpriteCache() {
  spriteCache.clear();
}
