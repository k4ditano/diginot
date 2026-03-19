// ═══════════════════════════════════════════
// DigiNot — Procedural Pixel Art Generator
// ═══════════════════════════════════════════

import { PALETTES, STAGE_SIZES, hashDNA } from './data.js';

// Seeded PRNG (mulberry32)
function createRNG(seed) {
  let s = seed | 0;
  return function() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate creature pixel grid
export function generateCreatureGrid(dna, type, stage) {
  const seed = hashDNA(dna);
  const rng = createRNG(seed);
  const size = STAGE_SIZES[stage] || 10;
  const halfW = Math.ceil(size / 2);

  // Grid: 0=empty, 1=outline, 2=shadow, 3=base, 4=highlight, 5=eye, 6=accent
  const grid = Array.from({ length: size }, () => new Array(size).fill(0));

  // === BODY GENERATION ===
  const bodyType = Math.floor(rng() * 5); // 0=round, 1=tall, 2=wide, 3=diamond, 4=blob
  const centerX = Math.floor(halfW * 0.6);
  const centerY = Math.floor(size * 0.5);

  // Generate body shape on left half
  const halfGrid = Array.from({ length: size }, () => new Array(halfW).fill(0));

  for (let y = 1; y < size - 1; y++) {
    for (let x = 0; x < halfW; x++) {
      const dy = (y - centerY) / (size * 0.4);
      const dx = (x - centerX) / (halfW * 0.6);
      let dist;

      switch (bodyType) {
        case 0: dist = dx * dx + dy * dy; break;                    // round
        case 1: dist = dx * dx * 1.5 + dy * dy * 0.5; break;       // tall
        case 2: dist = dx * dx * 0.5 + dy * dy * 1.5; break;       // wide
        case 3: dist = Math.abs(dx) + Math.abs(dy); break;          // diamond
        case 4: dist = dx * dx + dy * dy + rng() * 0.3 - 0.15; break; // blob
      }

      if (dist < 0.7 + rng() * 0.15) {
        halfGrid[y][x] = 3; // base color
      }
    }
  }

  // === ADD FEATURES based on DNA ===
  const earStyle = (seed >> 2) & 0x3;
  const armStyle = (seed >> 4) & 0x3;
  const legStyle = (seed >> 6) & 0x3;
  const tailStyle = (seed >> 8) & 0x3;
  const hornStyle = (seed >> 10) & 0x3;
  const stageIdx = ['bit', 'byte', 'kilo', 'mega', 'giga'].indexOf(stage);

  // Ears/Horns (top of head)
  if (earStyle > 0 || stageIdx >= 2) {
    const earHeight = 1 + Math.floor(rng() * (1 + stageIdx));
    const earX = Math.floor(halfW * 0.3 + rng() * halfW * 0.3);
    for (let i = 0; i < earHeight; i++) {
      const ey = findTopEdge(halfGrid, earX) - 1 - i;
      if (ey >= 0 && earX < halfW) {
        halfGrid[ey][earX] = earStyle === 1 ? 6 : 3;
        if (earX + 1 < halfW && earStyle >= 2) halfGrid[ey][earX + 1] = 3;
      }
    }
  }

  // Horns (higher stage)
  if (stageIdx >= 3 && hornStyle > 0) {
    const hornX = Math.floor(halfW * 0.4);
    for (let i = 0; i < 2 + stageIdx - 3; i++) {
      const hy = findTopEdge(halfGrid, hornX) - 1 - i;
      if (hy >= 0) halfGrid[hy][hornX] = 6;
    }
  }

  // Arms/Wings
  if (armStyle > 0 || stageIdx >= 1) {
    const armLen = 1 + Math.floor(rng() * (1 + stageIdx));
    const armY = Math.floor(centerY - size * 0.1 + rng() * size * 0.2);
    for (let i = 0; i < armLen; i++) {
      const ax = findRightEdge(halfGrid, armY) + i;
      if (ax < halfW) {
        halfGrid[armY][ax] = 3;
        if (armStyle === 2 && armY + 1 < size) halfGrid[armY + 1][ax] = 3;
        // Wings for higher stages
        if (stageIdx >= 3 && armStyle === 3 && armY - 1 >= 0) {
          halfGrid[armY - 1][ax] = 6;
          if (armY - 2 >= 0 && i < armLen - 1) halfGrid[armY - 2][ax] = 6;
        }
      }
    }
  }

  // Legs
  if (legStyle > 0) {
    const legLen = 1 + Math.floor(rng() * (1 + Math.min(stageIdx, 2)));
    const legX1 = Math.floor(halfW * 0.2 + rng() * halfW * 0.2);
    const legX2 = Math.floor(halfW * 0.5 + rng() * halfW * 0.2);
    for (let i = 0; i < legLen; i++) {
      const ly = findBottomEdge(halfGrid, legX1) + 1 + i;
      if (ly < size && legX1 < halfW) halfGrid[ly][legX1] = 3;
      const ly2 = findBottomEdge(halfGrid, legX2) + 1 + i;
      if (ly2 < size && legX2 < halfW) halfGrid[ly2][legX2] = 3;
    }
  }

  // Tail (asymmetric — goes on the right side of mirrored image, we skip it for symmetry
  // Instead, add as bottom extension)
  if (tailStyle > 0 && stageIdx >= 1) {
    const tailLen = 1 + Math.floor(rng() * stageIdx);
    const tailX = Math.floor(halfW * 0.1);
    for (let i = 0; i < tailLen; i++) {
      const ty = findBottomEdge(halfGrid, tailX) + 1 + i;
      if (ty < size) halfGrid[ty][Math.max(0, tailX - i)] = tailStyle >= 2 ? 6 : 3;
    }
  }

  // === MIRROR to full grid ===
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < halfW; x++) {
      if (halfGrid[y][x] !== 0) {
        const leftX = halfW - 1 - x;
        const rightX = halfW + x;
        if (leftX >= 0 && leftX < size) grid[y][leftX] = halfGrid[y][x];
        if (rightX >= 0 && rightX < size) grid[y][rightX] = halfGrid[y][x];
      }
    }
  }

  // === ADD SHADING ===
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x] === 3) {
        // Shadow on bottom-left
        if (x < size / 2 && y > centerY) grid[y][x] = rng() < 0.3 ? 2 : 3;
        // Highlight on top-right
        if (x >= size / 2 && y < centerY) grid[y][x] = rng() < 0.25 ? 4 : 3;
      }
    }
  }

  // === ADD EYES ===
  const eyeStyle = (seed >> 12) & 0x3;
  const eyeY = Math.floor(centerY - size * 0.15);
  const eyeSpacing = Math.max(1, Math.floor(size * 0.15));
  const eyeXL = Math.floor(size / 2) - eyeSpacing;
  const eyeXR = Math.floor(size / 2) + eyeSpacing - (size % 2 === 0 ? 1 : 0);

  // Make sure eyes are on body
  if (eyeY >= 0 && eyeY < size) {
    if (eyeXL >= 0 && eyeXL < size) grid[eyeY][eyeXL] = 5;
    if (eyeXR >= 0 && eyeXR < size) grid[eyeY][eyeXR] = 5;
    // Larger eyes for bigger stages
    if (stageIdx >= 2 && eyeStyle >= 1) {
      if (eyeY + 1 < size) {
        if (eyeXL >= 0) grid[eyeY + 1][eyeXL] = 5;
        if (eyeXR >= 0 && eyeXR < size) grid[eyeY + 1][eyeXR] = 5;
      }
    }
  }

  // === ADD MOUTH ===
  const mouthStyle = (seed >> 14) & 0x3;
  const mouthY = Math.floor(centerY + size * 0.1);
  const mouthCenter = Math.floor(size / 2);
  if (mouthY < size && mouthY >= 0) {
    if (mouthStyle === 0) {
      // Dot mouth
      grid[mouthY][mouthCenter] = 1;
    } else if (mouthStyle === 1) {
      // Line mouth
      if (mouthCenter - 1 >= 0) grid[mouthY][mouthCenter - 1] = 1;
      grid[mouthY][mouthCenter] = 1;
      if (mouthCenter + 1 < size) grid[mouthY][mouthCenter + 1] = 1;
    } else if (mouthStyle === 2) {
      // Fangs
      grid[mouthY][mouthCenter] = 1;
      if (mouthY + 1 < size) {
        if (mouthCenter - 1 >= 0) grid[mouthY + 1][mouthCenter - 1] = 4;
        if (mouthCenter + 1 < size) grid[mouthY + 1][mouthCenter + 1] = 4;
      }
    }
  }

  // === ADD BODY PATTERN ===
  const patternStyle = (seed >> 16) & 0x3;
  if (patternStyle === 1) {
    // Horizontal stripes
    for (let y = 0; y < size; y += 3) {
      for (let x = 0; x < size; x++) {
        if (grid[y][x] === 3) grid[y][x] = 6;
      }
    }
  } else if (patternStyle === 2) {
    // Spots
    for (let y = 2; y < size - 2; y += 3) {
      for (let x = 2; x < size - 2; x += 3) {
        if (grid[y][x] === 3 && rng() < 0.5) grid[y][x] = 6;
      }
    }
  }

  // === ADD OUTLINE ===
  const outlineGrid = grid.map(row => [...row]);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x] === 0) {
        // Check if adjacent to filled cell
        const neighbors = [
          y > 0 ? grid[y - 1][x] : 0,
          y < size - 1 ? grid[y + 1][x] : 0,
          x > 0 ? grid[y][x - 1] : 0,
          x < size - 1 ? grid[y][x + 1] : 0,
        ];
        if (neighbors.some(n => n >= 2)) {
          outlineGrid[y][x] = 1;
        }
      }
    }
  }

  return outlineGrid;
}

// Helper functions
function findTopEdge(halfGrid, x) {
  for (let y = 0; y < halfGrid.length; y++) {
    if (x < halfGrid[y].length && halfGrid[y][x] !== 0) return y;
  }
  return Math.floor(halfGrid.length / 2);
}

function findBottomEdge(halfGrid, x) {
  for (let y = halfGrid.length - 1; y >= 0; y--) {
    if (x < halfGrid[y].length && halfGrid[y][x] !== 0) return y;
  }
  return Math.floor(halfGrid.length / 2);
}

function findRightEdge(halfGrid, y) {
  if (y < 0 || y >= halfGrid.length) return 0;
  for (let x = halfGrid[y].length - 1; x >= 0; x--) {
    if (halfGrid[y][x] !== 0) return x + 1;
  }
  return 0;
}

// Render creature grid to canvas and return ImageData URL
const spriteCache = new Map();

export function renderCreatureSprite(dna, type, stage, pixelSize = 4) {
  const cacheKey = `${dna}_${type}_${stage}_${pixelSize}`;
  if (spriteCache.has(cacheKey)) return spriteCache.get(cacheKey);

  const grid = generateCreatureGrid(dna, type, stage);
  const size = grid.length;
  const palette = getColorPalette(dna, type);

  const canvas = document.createElement('canvas');
  canvas.width = size * pixelSize;
  canvas.height = size * pixelSize;
  const ctx = canvas.getContext('2d');

  const colorMap = {
    0: 'transparent',
    1: palette[0], // outline
    2: palette[1], // shadow
    3: palette[2], // base
    4: palette[3], // highlight
    5: palette[4], // eye
    6: palette[5], // accent
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const val = grid[y][x];
      if (val === 0) continue;
      ctx.fillStyle = colorMap[val];
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
  }

  const dataURL = canvas.toDataURL();
  spriteCache.set(cacheKey, dataURL);
  return dataURL;
}

// Render creature blink frame (eyes closed)
export function renderCreatureBlinkSprite(dna, type, stage, pixelSize = 4) {
  const cacheKey = `${dna}_${type}_${stage}_${pixelSize}_blink`;
  if (spriteCache.has(cacheKey)) return spriteCache.get(cacheKey);

  const grid = generateCreatureGrid(dna, type, stage);
  const size = grid.length;
  const palette = getColorPalette(dna, type);

  // Replace eyes (5) with outline (1) for blink
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
    0: 'transparent', 1: palette[0], 2: palette[1],
    3: palette[2], 4: palette[3], 5: palette[4], 6: palette[5],
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const val = grid[y][x];
      if (val === 0) continue;
      ctx.fillStyle = colorMap[val];
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
  }

  const dataURL = canvas.toDataURL();
  spriteCache.set(cacheKey, dataURL);
  return dataURL;
}

function getColorPalette(dna, type) {
  const h = hashDNA(dna);
  const palettes = PALETTES[type] || PALETTES.ember;
  return palettes[h % palettes.length];
}

export function clearSpriteCache() {
  spriteCache.clear();
}
