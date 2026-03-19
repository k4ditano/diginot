// ═══════════════════════════════════════════
// DigiNot — 8-bit Audio Engine (Web Audio API)
// ═══════════════════════════════════════════

let audioCtx = null;
let masterGain = null;
let muted = false;

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq, duration, type = 'square', volume = 0.3) {
  if (muted) return;
  const ctx = ensureAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, volume = 0.1) {
  if (muted) return;
  const ctx = ensureAudio();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(gain);
  gain.connect(masterGain);
  source.start();
}

export const SFX = {
  menuSelect() {
    playTone(800, 0.08, 'square', 0.2);
    setTimeout(() => playTone(1200, 0.08, 'square', 0.2), 50);
  },

  menuBack() {
    playTone(600, 0.08, 'square', 0.2);
    setTimeout(() => playTone(400, 0.1, 'square', 0.2), 50);
  },

  menuMove() {
    playTone(500, 0.05, 'square', 0.15);
  },

  attack() {
    playNoise(0.15, 0.2);
    playTone(200, 0.15, 'sawtooth', 0.3);
  },

  hit() {
    playNoise(0.1, 0.25);
    playTone(150, 0.1, 'square', 0.2);
  },

  critical() {
    playNoise(0.2, 0.3);
    playTone(100, 0.1, 'sawtooth', 0.3);
    setTimeout(() => playTone(80, 0.15, 'sawtooth', 0.3), 100);
  },

  capture() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => setTimeout(() => playTone(n, 0.15, 'square', 0.25), i * 120));
  },

  captureFail() {
    playTone(400, 0.15, 'square', 0.2);
    setTimeout(() => playTone(300, 0.2, 'square', 0.2), 150);
  },

  evolve() {
    const notes = [262, 330, 392, 523, 659, 784, 1047];
    notes.forEach((n, i) => setTimeout(() => playTone(n, 0.2, 'triangle', 0.3), i * 150));
  },

  levelUp() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => setTimeout(() => playTone(n, 0.12, 'triangle', 0.25), i * 80));
  },

  encounter() {
    playTone(200, 0.1, 'square', 0.2);
    setTimeout(() => playTone(400, 0.1, 'square', 0.2), 100);
    setTimeout(() => playTone(600, 0.15, 'square', 0.25), 200);
  },

  heal() {
    const notes = [440, 554, 659];
    notes.forEach((n, i) => setTimeout(() => playTone(n, 0.2, 'sine', 0.2), i * 150));
  },

  victory() {
    const melody = [523, 523, 523, 698, 880, 784, 698, 880, 1047];
    melody.forEach((n, i) => setTimeout(() => playTone(n, 0.15, 'square', 0.25), i * 120));
  },

  defeat() {
    const notes = [400, 350, 300, 250, 200];
    notes.forEach((n, i) => setTimeout(() => playTone(n, 0.2, 'triangle', 0.2), i * 200));
  },

  boot() {
    playTone(220, 0.3, 'triangle', 0.15);
    setTimeout(() => playTone(440, 0.3, 'triangle', 0.2), 300);
    setTimeout(() => playTone(880, 0.5, 'triangle', 0.25), 600);
  },

  step() {
    playTone(100 + Math.random() * 50, 0.05, 'square', 0.08);
  },

  error() {
    playTone(200, 0.15, 'square', 0.2);
    setTimeout(() => playTone(200, 0.15, 'square', 0.2), 200);
  },

  feed() {
    playTone(600, 0.08, 'sine', 0.2);
    setTimeout(() => playTone(800, 0.08, 'sine', 0.2), 100);
    setTimeout(() => playTone(1000, 0.12, 'sine', 0.2), 200);
  },

  train() {
    playTone(300, 0.1, 'sawtooth', 0.15);
    setTimeout(() => playTone(500, 0.1, 'sawtooth', 0.15), 100);
    setTimeout(() => playTone(700, 0.15, 'sawtooth', 0.2), 200);
  },

  // V2 sounds
  fusion() {
    const notes = [220, 277, 330, 440, 554, 660, 880, 1047, 1319];
    notes.forEach((n, i) => setTimeout(() => playTone(n, 0.18, 'sine', 0.2 + i * 0.02), i * 100));
  },

  bossAppear() {
    playTone(100, 0.3, 'sawtooth', 0.3);
    setTimeout(() => playTone(80, 0.3, 'sawtooth', 0.25), 200);
    setTimeout(() => playTone(120, 0.5, 'sawtooth', 0.35), 400);
    setTimeout(() => playNoise(0.3, 0.15), 300);
  },

  achievement() {
    const notes = [523, 659, 784, 1047, 1319, 1568];
    notes.forEach((n, i) => setTimeout(() => playTone(n, 0.15, 'triangle', 0.2), i * 80));
  },

  daily() {
    playTone(440, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(554, 0.1, 'sine', 0.2), 120);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.2), 240);
    setTimeout(() => playTone(880, 0.25, 'sine', 0.25), 360);
  },

  pvp() {
    playTone(330, 0.1, 'square', 0.2);
    setTimeout(() => playTone(440, 0.1, 'square', 0.2), 80);
    setTimeout(() => playTone(660, 0.1, 'square', 0.25), 160);
    setTimeout(() => playTone(880, 0.2, 'square', 0.3), 240);
  },

  swap() {
    playTone(600, 0.08, 'triangle', 0.2);
    setTimeout(() => playTone(400, 0.08, 'triangle', 0.2), 80);
    setTimeout(() => playTone(800, 0.12, 'triangle', 0.25), 160);
  },

  screenTransition() {
    playTone(1200, 0.04, 'square', 0.08);
  },
};

export function setMuted(m) {
  muted = m;
  if (m) stopMusic();
}
export function isMuted() { return muted; }
export function initAudio() { ensureAudio(); }

// ═══════════════════════════════════════════
// V3 — Background Music System
// ═══════════════════════════════════════════
let musicInterval = null;
let currentTrack = null;

const TRACKS = {
  home: { bpm: 100, notes: [
    [262,0.15],[0,0.1],[330,0.15],[0,0.1],[392,0.15],[0,0.1],[330,0.15],[0,0.3],
    [262,0.15],[0,0.1],[294,0.15],[0,0.1],[349,0.15],[0,0.1],[294,0.15],[0,0.3],
  ]},
  battle: { bpm: 160, notes: [
    [392,0.1],[0,0.05],[392,0.1],[0,0.05],[494,0.1],[0,0.05],[392,0.15],[0,0.1],
    [330,0.1],[0,0.05],[349,0.1],[0,0.05],[392,0.2],[0,0.15],
    [294,0.1],[0,0.05],[330,0.1],[0,0.05],[392,0.1],[0,0.05],[494,0.15],[0,0.1],
    [440,0.1],[0,0.05],[392,0.1],[0,0.05],[349,0.2],[0,0.15],
  ]},
  explore: { bpm: 120, notes: [
    [220,0.2],[0,0.1],[262,0.2],[0,0.1],[330,0.2],[0,0.1],[262,0.15],[0,0.15],
    [247,0.2],[0,0.1],[294,0.2],[0,0.1],[349,0.2],[0,0.1],[294,0.15],[0,0.3],
  ]},
  menu: { bpm: 90, notes: [
    [330,0.3],[0,0.2],[392,0.3],[0,0.2],[440,0.2],[0,0.1],[392,0.2],[0,0.4],
  ]},
};

export function playMusic(trackName) {
  if (muted) return;
  if (currentTrack === trackName && musicInterval) return; // already playing
  stopMusic();
  currentTrack = trackName;
  const track = TRACKS[trackName];
  if (!track) return;

  let noteIdx = 0;
  const playNext = () => {
    if (muted || currentTrack !== trackName) { stopMusic(); return; }
    const [freq, dur] = track.notes[noteIdx % track.notes.length];
    if (freq > 0) {
      playTone(freq, dur * 0.9, 'triangle', 0.08);
    }
    noteIdx++;
  };

  const msPerBeat = 60000 / track.bpm / 2;
  playNext();
  musicInterval = setInterval(playNext, msPerBeat);
}

export function stopMusic() {
  if (musicInterval) { clearInterval(musicInterval); musicInterval = null; }
  currentTrack = null;
}

export function getCurrentTrack() { return currentTrack; }
