// ═══════════════════════════════════════════
// DigiNot — Procedural Zone Map Generator
// ═══════════════════════════════════════════

import { hashDNA } from './data.js';

// Tile types
export const TILE = {
  VOID:   0,  // impassable wall/void
  PATH:   1,  // walkable path
  GRASS:  2,  // tall grass — wild encounters
  WATER:  3,  // impassable water
  CHEST:  4,  // item chest (one-time pickup)
  NPC:    5,  // NPC trainer
  BOSS:   6,  // zone boss
  EXIT:   7,  // exit portal
  ENTRY:  8,  // spawn point
  TREE:   9,  // decorative wall
  ROCK:  10,  // decorative wall
};

// Visual per tile — [emoji, bgColor, walkable]
const TILE_VIS = {
  [TILE.VOID]:  ['',   '#0a0a12', false],
  [TILE.PATH]:  ['',   '#1a1a2a', true],
  [TILE.GRASS]: ['',   '#1a2a1a', true],
  [TILE.WATER]: ['~',  '#0a1530', false],
  [TILE.CHEST]: ['📦', '#1a1a2a', true],
  [TILE.NPC]:   ['!',  '#1a1a2a', true],
  [TILE.BOSS]:  ['👹', '#2a1010', true],
  [TILE.EXIT]:  ['▶',  '#102030', true],
  [TILE.ENTRY]: ['',   '#1a2a1a', true],
  [TILE.TREE]:  ['🌲', '#0a1a0a', false],
  [TILE.ROCK]:  ['🪨', '#1a1a1a', false],
};

// Zone-specific tile themes
const ZONE_THEMES = {
  forest:   { wall: TILE.TREE,  floor: TILE.GRASS, decor: TILE.TREE,  accent: '#1a3a1a', floorColor: '#152515', grassColor: '#1a3018' },
  ocean:    { wall: TILE.WATER, floor: TILE.PATH,  decor: TILE.WATER, accent: '#0a1a3a', floorColor: '#101828', grassColor: '#102030' },
  volcano:  { wall: TILE.ROCK,  floor: TILE.PATH,  decor: TILE.ROCK,  accent: '#3a1a0a', floorColor: '#201008', grassColor: '#281510' },
  mountain: { wall: TILE.ROCK,  floor: TILE.PATH,  decor: TILE.ROCK,  accent: '#2a2a3a', floorColor: '#181820', grassColor: '#1a1a28' },
  cave:     { wall: TILE.ROCK,  floor: TILE.PATH,  decor: TILE.VOID,  accent: '#0a0a1a', floorColor: '#0c0c14', grassColor: '#0e0e1a' },
  sky:      { wall: TILE.VOID,  floor: TILE.PATH,  decor: TILE.VOID,  accent: '#2a3040', floorColor: '#1a2030', grassColor: '#202838' },
  glitch:   { wall: TILE.VOID,  floor: TILE.PATH,  decor: TILE.VOID,  accent: '#1a001a', floorColor: '#12001a', grassColor: '#1a0020' },
};

// Seeded PRNG
function seededRNG(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const MAP_W = 20;
export const MAP_H = 16;

// ─── Generate a zone map ───
export function generateZoneMap(zoneId, seed = 0) {
  const rng = seededRNG(hashDNA(zoneId) + seed);
  const theme = ZONE_THEMES[zoneId] || ZONE_THEMES.forest;
  const grid = Array.from({ length: MAP_H }, () => new Array(MAP_W).fill(TILE.VOID));

  // 1. Carve rooms and corridors
  const rooms = [];
  const numRooms = 4 + Math.floor(rng() * 3);

  for (let i = 0; i < numRooms; i++) {
    const rw = 3 + Math.floor(rng() * 4);
    const rh = 3 + Math.floor(rng() * 3);
    const rx = 1 + Math.floor(rng() * (MAP_W - rw - 2));
    const ry = 1 + Math.floor(rng() * (MAP_H - rh - 2));
    rooms.push({ x: rx, y: ry, w: rw, h: rh, cx: Math.floor(rx + rw/2), cy: Math.floor(ry + rh/2) });

    for (let dy = 0; dy < rh; dy++) {
      for (let dx = 0; dx < rw; dx++) {
        const tile = rng() < 0.45 ? TILE.GRASS : TILE.PATH;
        grid[ry + dy][rx + dx] = tile;
      }
    }
  }

  // 2. Connect rooms with corridors
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1];
    const b = rooms[i];
    let cx = a.cx, cy = a.cy;
    while (cx !== b.cx) {
      if (cy >= 0 && cy < MAP_H && cx >= 0 && cx < MAP_W) {
        if (grid[cy][cx] === TILE.VOID) grid[cy][cx] = TILE.PATH;
      }
      cx += cx < b.cx ? 1 : -1;
    }
    while (cy !== b.cy) {
      if (cy >= 0 && cy < MAP_H && cx >= 0 && cx < MAP_W) {
        if (grid[cy][cx] === TILE.VOID) grid[cy][cx] = TILE.PATH;
      }
      cy += cy < b.cy ? 1 : -1;
    }
  }

  // 3. Place walls around walkable tiles
  const copy = grid.map(r => [...r]);
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (copy[y][x] !== TILE.VOID) continue;
      const adj = [
        y > 0 ? copy[y-1][x] : 0, y < MAP_H-1 ? copy[y+1][x] : 0,
        x > 0 ? copy[y][x-1] : 0, x < MAP_W-1 ? copy[y][x+1] : 0,
      ];
      if (adj.some(t => t === TILE.PATH || t === TILE.GRASS)) {
        grid[y][x] = theme.wall;
      }
    }
  }

  // 4. Place entry (first room) and exit (last room)
  const entry = rooms[0];
  const exit = rooms[rooms.length - 1];
  grid[entry.cy][entry.cx] = TILE.ENTRY;
  grid[exit.cy][exit.cx] = TILE.EXIT;

  // 5. Place boss near exit
  const bossY = Math.max(0, exit.cy - 1);
  if (grid[bossY][exit.cx] === TILE.PATH || grid[bossY][exit.cx] === TILE.GRASS) {
    grid[bossY][exit.cx] = TILE.BOSS;
  }

  // 6. Place chests (2-4 per map)
  const numChests = 2 + Math.floor(rng() * 3);
  let chestsPlaced = 0;
  for (let attempts = 0; attempts < 100 && chestsPlaced < numChests; attempts++) {
    const cx = Math.floor(rng() * MAP_W);
    const cy = Math.floor(rng() * MAP_H);
    if (grid[cy][cx] === TILE.PATH || grid[cy][cx] === TILE.GRASS) {
      grid[cy][cx] = TILE.CHEST;
      chestsPlaced++;
    }
  }

  // 7. Place NPC trainers (1-3 per map)
  const numNPCs = 1 + Math.floor(rng() * 2);
  let npcsPlaced = 0;
  for (let attempts = 0; attempts < 100 && npcsPlaced < numNPCs; attempts++) {
    const nx = Math.floor(rng() * MAP_W);
    const ny = Math.floor(rng() * MAP_H);
    if (grid[ny][nx] === TILE.PATH) {
      grid[ny][nx] = TILE.NPC;
      npcsPlaced++;
    }
  }

  return {
    grid,
    theme,
    entry: { x: entry.cx, y: entry.cy },
    exit: { x: exit.cx, y: exit.cy },
    zoneId,
    chestsOpened: {},   // track opened chests
    npcsDefeated: {},   // track beaten NPCs
    bossDefeated: false,
  };
}

// ─── Get tile info ───
export function getTileInfo(tile) {
  return TILE_VIS[tile] || TILE_VIS[TILE.VOID];
}

export function isWalkable(tile) {
  const info = getTileInfo(tile);
  return info[2];
}

// ─── Render viewport ───
export const VIEW_W = 9;
export const VIEW_H = 7;

export function getViewport(map, px, py) {
  const hw = Math.floor(VIEW_W / 2);
  const hh = Math.floor(VIEW_H / 2);
  const startX = Math.max(0, Math.min(MAP_W - VIEW_W, px - hw));
  const startY = Math.max(0, Math.min(MAP_H - VIEW_H, py - hh));
  const tiles = [];

  for (let vy = 0; vy < VIEW_H; vy++) {
    const row = [];
    for (let vx = 0; vx < VIEW_W; vx++) {
      const mx = startX + vx;
      const my = startY + vy;
      const tile = (mx >= 0 && mx < MAP_W && my >= 0 && my < MAP_H) ? map.grid[my][mx] : TILE.VOID;
      const isPlayer = mx === px && my === py;
      row.push({ tile, mx, my, isPlayer });
    }
    tiles.push(row);
  }

  return { tiles, startX, startY };
}

// ─── Generate NPC trainer team ───
export function generateNPCTeam(zoneTypes, playerLevel) {
  const teamSize = 1 + Math.floor(Math.random() * 2);
  const team = [];
  for (let i = 0; i < teamSize; i++) {
    const type = zoneTypes[Math.floor(Math.random() * zoneTypes.length)];
    const lvl = Math.max(1, playerLevel - 2 + Math.floor(Math.random() * 5));
    team.push({ type, level: lvl });
  }
  return team;
}
