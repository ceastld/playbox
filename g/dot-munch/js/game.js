'use strict';

/* 豆径 — Pac-Man remake. No CDN. Hue 48. */

var COLS = 28;
var ROWS = 31;
var TUNNEL_R = 14;
var PAC_SPAWN = { x: 13.5, y: 23.5 };
var FRUIT_POS = { x: 13.5, y: 17.5 };
var EXIT_POS = { x: 13.5, y: 11.5 };
var HOUSE_POS = { x: 13.5, y: 14.5 };
var LIVES = 3;
var FRIGHT_SEC = 6;
var SWIPE_MIN = 24;
var BEST_KEY = 'playbox-dot-munch-best';
var MUTE_KEY = 'playbox-dot-munch-mute';
var TAU = Math.PI * 2;
var TURN_PRE = 0.32;
var HIT_R2 = 0.5 * 0.5;
var FOG_R = 4.6;
var FOG_FADE = 6.4;
var READY_SEC = 1.85;
var DEATH_SEC = 1.15;
var CLEAR_SEC = 1.7;
var FRUIT_SEC = 9.2;
var EXTRA_LIFE = 10000;

var MAZE = [
  '############################',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#o####.#####.##.#####.####o#',
  '#.####.#####.##.#####.####.#',
  '#..........................#',
  '#.####.##.########.##.####.#',
  '#.####.##.########.##.####.#',
  '#......##....##....##......#',
  '######.##### ## #####.######',
  '_____#.##### ## #####.#_____',
  '_____#.##          ##.#_____',
  '_____#.## ###--### ##.#_____',
  '######.## #      # ##.######',
  '      .   #      #   .      ',
  '######.## #      # ##.######',
  '_____#.## ######## ##.#_____',
  '_____#.##          ##.#_____',
  '_____#.## ######## ##.#_____',
  '######.## ######## ##.######',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#.####.#####.##.#####.####.#',
  '#o..##................##..o#',
  '###.##.##.########.##.##.###',
  '###.##.##.########.##.##.###',
  '#......##....##....##......#',
  '#.##########.##.##########.#',
  '#.##########.##.##########.#',
  '#..........................#',
  '############################'
];

var DIRS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 }
};
var OPP = { left: 'right', right: 'left', up: 'down', down: 'up' };
var DIR_ORDER = ['up', 'left', 'down', 'right'];
var DIR_ANG = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
var KEY_DIR = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'down'
};

var GHOST_SPEC = [
  { id: 'blinky', name: '赤', rgb: [255, 52, 64], scatter: { x: 25.5, y: 0.5 }, spawn: { x: 13.5, y: 11.5 }, phase: 'out', personality: 'chase' },
  { id: 'pinky', name: '粉', rgb: [255, 122, 217], scatter: { x: 2.5, y: 0.5 }, spawn: { x: 13.5, y: 14.5 }, phase: 'house', personality: 'ambush' },
  { id: 'inky', name: '青', rgb: [0, 232, 255], scatter: { x: 27.5, y: 30.5 }, spawn: { x: 11.5, y: 14.5 }, phase: 'house', personality: 'wander' },
  { id: 'clyde', name: '橙', rgb: [255, 154, 61], scatter: { x: 0.5, y: 30.5 }, spawn: { x: 15.5, y: 14.5 }, phase: 'house', personality: 'shy' }
];

var FRUIT_TABLE = [
  { name: '樱桃', score: 100, rgb: [255, 64, 96] },
  { name: '草莓', score: 300, rgb: [255, 80, 120] },
  { name: '橘子', score: 500, rgb: [255, 160, 48] },
  { name: '苹果', score: 700, rgb: [255, 72, 72] },
  { name: '甜瓜', score: 1000, rgb: [80, 220, 120] },
  { name: '星舰', score: 2000, rgb: [90, 160, 255] },
  { name: '铃铛', score: 3000, rgb: [255, 214, 64] },
  { name: '钥匙', score: 5000, rgb: [180, 196, 220] }
];

var WAVES = [
  { scatter: 7, chase: 20 },
  { scatter: 7, chase: 20 },
  { scatter: 5, chase: 20 },
  { scatter: 5, chase: 9999 }
];

var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d', { alpha: false });
var overlay = document.getElementById('overlay');
var panel = document.getElementById('panel');
var ovKicker = document.getElementById('ov-kicker');
var ovTitle = document.getElementById('ov-title');
var ovLead = document.getElementById('ov-lead');
var ovOps = document.getElementById('ov-ops');
var ovStart = document.getElementById('ov-start');
var ovEnd = document.getElementById('ov-end');
var btnClassic = document.getElementById('btn-classic');
var btnFog = document.getElementById('btn-fog');
var ovRetry = document.getElementById('ov-retry');
var ovModes = document.getElementById('ov-modes');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var scoreEl = document.getElementById('score');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var bestEl = document.getElementById('best');
var levelEl = document.getElementById('level');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var modeLabel = document.getElementById('mode-label');
var frightWrap = document.getElementById('fright-wrap');
var frightBar = document.getElementById('fright-bar');
var pipsEl = document.getElementById('pips');
var toastEl = document.getElementById('toast');
var hintEl = document.getElementById('hint');
var stageEl = document.getElementById('stage');
var motionQ = window.matchMedia('(prefers-reduced-motion: reduce)');

var view = { w: 1, h: 1, dpr: 1, tile: 16, ox: 0, oy: 0 };
var particles = [];
var pops = [];
var swipe = { x: 0, y: 0, on: false, id: 0 };
var lastTs = 0;
var wakaFlip = false;
var toastTok = 0;
var hud = { score: -1, best: -1, level: -1, combo: -1, lives: -1, fright: -1 };

var G = {
  screen: 'title',
  kind: 'classic',
  level: 1,
  lives: LIVES,
  score: 0,
  best: 0,
  combo: 0,
  maxCombo: 0,
  munch: 0,
  dotsLeft: 0,
  dotsEaten: 0,
  totalDots: 0,
  fruitN: 0,
  extra: false,
  newBest: false,
  grid: [],
  pac: null,
  ghosts: [],
  fruit: null,
  scatter: true,
  wave: 0,
  waveT: 0,
  fright: 0,
  ghostMult: 0,
  ready: 0,
  deadT: 0,
  clearT: 0,
  clock: 0,
  levelTime: 0,
  stop: 0,
  shake: 0,
  flash: 0,
  flashRgb: [255, 227, 107],
  punch: 1,
  siren: 0,
  eatSlow: 0,
  toastT: 0
};

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function rand(a, b) { return a + Math.random() * (b - a); }
function rgba(rgb, a) { return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')'; }
function reduceMotion() { return motionQ.matches; }

function cell(c, r) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return '_';
  return G.grid[r].charAt(c);
}

function setCell(c, r, ch) {
  var row = G.grid[r];
  G.grid[r] = row.slice(0, c) + ch + row.slice(c + 1);
}

function wrapC(c) {
  if (c < 0) return c + COLS;
  if (c >= COLS) return c - COLS;
  return c;
}

function isVoid(c, r) {
  if (r < 0 || r >= ROWS) return true;
  if (c < 0 || c >= COLS) return r !== TUNNEL_R;
  return G.grid[r].charAt(c) === '_';
}

function isDoor(c, r) {
  return r === 12 && (c === 13 || c === 14);
}

function inHouse(c, r) {
  return r >= 13 && r <= 15 && c >= 11 && c <= 16;
}

function isWallChar(ch) {
  return ch === '#' || ch === '_';
}

function pacWalk(c, r) {
  if (r === TUNNEL_R && (c < 0 || c >= COLS)) return true;
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
  var ch = G.grid[r].charAt(c);
  if (isWallChar(ch) || ch === '-') return false;
  if (inHouse(c, r)) return false;
  return true;
}

function ghostWalk(g, c, r) {
  if (r === TUNNEL_R && (c < 0 || c >= COLS)) return true;
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
  var ch = G.grid[r].charAt(c);
  if (isWallChar(ch)) return false;
  if (ch === '-') {
    return g.phase === 'house' || g.phase === 'leave' || g.phase === 'eyes';
  }
  if ((g.phase === 'out' || g.phase === 'fright') && inHouse(c, r)) return false;
  return true;
}

function tileOf(x, y) {
  return { c: Math.round(x - 0.5), r: Math.round(y - 0.5) };
}

function nearCenter(ent, slop) {
  var t = tileOf(ent.x, ent.y);
  return Math.abs(ent.x - (t.c + 0.5)) <= slop && Math.abs(ent.y - (t.r + 0.5)) <= slop;
}

function snapCenter(ent) {
  var t = tileOf(ent.x, ent.y);
  ent.x = t.c + 0.5;
  ent.y = t.r + 0.5;
}

function wrapEnt(ent) {
  if (ent.y > TUNNEL_R - 0.6 && ent.y < TUNNEL_R + 1.6) {
    if (ent.x < 0) ent.x += COLS;
    else if (ent.x >= COLS) ent.x -= COLS;
  }
}

function dist2(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  if (Math.abs(a.y - (TUNNEL_R + 0.5)) < 1.1 && Math.abs(b.y - (TUNNEL_R + 0.5)) < 1.1) {
    if (dx > COLS * 0.5) dx -= COLS;
    if (dx < -COLS * 0.5) dx += COLS;
  }
  return dx * dx + dy * dy;
}

function aheadTile(ent, n) {
  var d = DIRS[ent.dir] || DIRS.left;
  var t = tileOf(ent.x, ent.y);
  var c = t.c + d.x * n;
  var r = t.r + d.y * n;
  if (ent.dir === 'up') c -= n;
  return { x: c + 0.5, y: r + 0.5 };
}

function cloneGrid() {
  var g = [];
  var r;
  for (r = 0; r < ROWS; r++) g.push(MAZE[r]);
  return g;
}

function countDots(grid) {
  var n = 0, r, c, ch;
  for (r = 0; r < ROWS; r++) {
    for (c = 0; c < COLS; c++) {
      ch = grid[r].charAt(c);
      if (ch === '.' || ch === 'o') n++;
    }
  }
  return n;
}

function speeds(level) {
  var L = Math.min(level, 13);
  var pac = Math.min(9.05, 7.35 + (L - 1) * 0.16);
  var ghost = Math.min(8.55, 6.55 + (L - 1) * 0.26);
  return {
    pac: pac,
    pacEat: pac * 0.88,
    ghost: ghost,
    fright: Math.min(5.2, 4.05 + (L - 1) * 0.08),
    eyes: 16.5,
    elroy: Math.min(9.0, ghost + 0.7),
    elroy2: Math.min(9.2, ghost + 1.15)
  };
}

function fruitOf(level) {
  var i = level - 1;
  if (i < 0) i = 0;
  if (i >= FRUIT_TABLE.length) i = FRUIT_TABLE.length - 1;
  return FRUIT_TABLE[i];
}

function releaseDots(level, id) {
  if (id === 'blinky' || id === 'pinky') return 0;
  if (level >= 3) return 0;
  if (id === 'inky') return level === 1 ? 30 : 0;
  return level === 1 ? 60 : 16;
}

function releaseTime(level, id) {
  if (id === 'blinky') return 0;
  if (id === 'pinky') return 0.8;
  if (id === 'inky') return level === 1 ? 6.5 : 2.4;
  return level === 1 ? 11 : 4.5;
}

function elroyMark(level, total) {
  var n = Math.max(8, 24 - (level - 1) * 2);
  return Math.min(n, Math.floor(total * 0.12) + 8);
}

function loadBest() {
  try {
    var n = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
    return isFinite(n) && n > 0 ? n : 0;
  } catch (e) { return 0; }
}
function saveBest(n) {
  try { localStorage.setItem(BEST_KEY, String(n)); } catch (e) { /* ignore */ }
}
function loadMute() {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { return false; }
}

/* ---- audio ---- */
var audio = {
  ctx: null,
  master: null,
  muted: false,
  noiseBuf: null,
  sirenO: null,
  sirenG: null,
  sirenOn: false,
  ensure: function () {
    if (!this.ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.3;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  setMuted: function (m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.3;
    btnMute.textContent = m ? '静' : '声';
    btnMute.classList.toggle('muted', m);
    btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
    try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) { /* ignore */ }
    if (m) this.stopSiren();
  },
  beep: function (freq, dur, type, vol, slide, delay) {
    if (!this.ctx || this.muted) return;
    var t = this.ctx.currentTime + (delay || 0);
    var o = this.ctx.createOscillator();
    var g = this.ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
    g.gain.setValueAtTime(Math.max(0.0001, vol), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.03);
  },
  noise: function (dur, vol, freq, type) {
    if (!this.ctx || this.muted) return;
    if (!this.noiseBuf) {
      var sr = this.ctx.sampleRate;
      var buf = this.ctx.createBuffer(1, (sr * 0.3) | 0, sr);
      var data = buf.getChannelData(0);
      var i;
      for (i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
    }
    var src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    var f = this.ctx.createBiquadFilter();
    f.type = type || 'bandpass';
    f.frequency.value = freq || 900;
    f.Q.value = type === 'lowpass' ? 0.7 : 1.1;
    var g = this.ctx.createGain();
    var t = this.ctx.currentTime;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.02);
  },
  waka: function () {
    this.ensure();
    wakaFlip = !wakaFlip;
    if (wakaFlip) this.beep(420, 0.055, 'square', 0.05, 280);
    else this.beep(310, 0.055, 'square', 0.048, 210);
  },
  pellet: function () {
    this.ensure();
    this.beep(220, 0.16, 'sawtooth', 0.06, 90);
    this.beep(880, 0.18, 'square', 0.045, 220);
    this.noise(0.12, 0.07, 600, 'lowpass');
  },
  eatGhost: function (n) {
    this.ensure();
    var f = 280 + n * 140;
    this.beep(f, 0.09, 'square', 0.07, f * 1.7);
    this.beep(f * 1.5, 0.14, 'triangle', 0.055, f * 2.2, 0.05);
    this.beep(f * 2, 0.18, 'square', 0.04, f * 2.8, 0.1);
    this.noise(0.08, 0.06, 1400, 'highpass');
  },
  fruit: function () {
    this.ensure();
    this.beep(660, 0.08, 'sine', 0.05, 990);
    this.beep(880, 0.12, 'triangle', 0.045, 1320, 0.05);
  },
  death: function () {
    this.ensure();
    this.stopSiren();
    this.beep(420, 0.18, 'sawtooth', 0.07, 140);
    this.beep(280, 0.28, 'square', 0.06, 70, 0.12);
    this.beep(110, 0.4, 'sine', 0.05, 40, 0.22);
    this.noise(0.22, 0.08, 240, 'lowpass');
  },
  extra: function () {
    this.ensure();
    this.beep(523, 0.09, 'square', 0.05);
    this.beep(659, 0.09, 'square', 0.05, 0, 0.08);
    this.beep(784, 0.16, 'triangle', 0.055, 1046, 0.16);
  },
  clear: function () {
    this.ensure();
    this.stopSiren();
    this.beep(392, 0.1, 'square', 0.05, 523);
    this.beep(523, 0.1, 'square', 0.05, 659, 0.1);
    this.beep(784, 0.22, 'triangle', 0.06, 1046, 0.2);
  },
  start: function () {
    this.ensure();
    this.beep(392, 0.08, 'square', 0.045, 523);
    this.beep(659, 0.12, 'triangle', 0.04, 0, 0.06);
  },
  ui: function () {
    this.ensure();
    this.beep(640, 0.04, 'square', 0.03, 880);
  },
  over: function () {
    this.ensure();
    this.stopSiren();
    this.beep(196, 0.22, 'sawtooth', 0.05, 80);
    this.beep(110, 0.36, 'sine', 0.055, 46, 0.08);
  },
  startSiren: function () {
    if (!this.ctx || this.muted || this.sirenOn) return;
    var o = this.ctx.createOscillator();
    var g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = 180;
    g.gain.value = 0.018;
    o.connect(g);
    g.connect(this.master);
    o.start();
    this.sirenO = o;
    this.sirenG = g;
    this.sirenOn = true;
  },
  stopSiren: function () {
    if (this.sirenO) {
      try { this.sirenO.stop(); } catch (e) { /* ignore */ }
      try { this.sirenO.disconnect(); } catch (e2) { /* ignore */ }
    }
    this.sirenO = null;
    this.sirenG = null;
    this.sirenOn = false;
  },
  tickSiren: function (fright, dotsLeft, total) {
    if (!this.sirenOn || !this.sirenO) return;
    var t = this.ctx.currentTime;
    var frac = 1 - dotsLeft / Math.max(1, total);
    var base = fright > 0 ? 90 : 150 + frac * 220;
    var wob = fright > 0 ? 18 : 8;
    try {
      this.sirenO.frequency.setTargetAtTime(base + Math.sin(t * (fright > 0 ? 9 : 4)) * wob, t, 0.05);
      this.sirenG.gain.setTargetAtTime(this.muted ? 0 : (fright > 0 ? 0.022 : 0.016), t, 0.08);
    } catch (e) { /* ignore */ }
  }
};

/* ---- juice ---- */
function hitStop(sec) {
  if (reduceMotion()) return;
  G.stop = Math.max(G.stop, sec);
}
function kick(mag) {
  if (reduceMotion()) return;
  G.shake = Math.max(G.shake, mag);
}
function screenFlash(rgb, a) {
  G.flash = Math.max(G.flash, a || 0.4);
  G.flashRgb = rgb;
}
function punchStage(cls) {
  if (reduceMotion()) return;
  stageEl.classList.remove(cls);
  void stageEl.offsetWidth;
  stageEl.classList.add(cls);
}
function capArr(arr, n) {
  if (arr.length > n) arr.splice(0, arr.length - n);
}
function burst(x, y, n, rgb, spd, life, grav) {
  var i, ang, v;
  for (i = 0; i < n; i++) {
    ang = Math.random() * TAU;
    v = rand(spd * 0.2, spd);
    particles.push({
      x: x + rand(-0.1, 0.1),
      y: y + rand(-0.1, 0.1),
      vx: Math.cos(ang) * v,
      vy: Math.sin(ang) * v - rand(0, spd * 0.2),
      r: rand(0.05, 0.13),
      life: rand(life * 0.5, life),
      max: life,
      rgb: rgb,
      g: grav == null ? 2.8 : grav
    });
  }
  capArr(particles, 480);
}
function addPop(x, y, text, rgb, scale) {
  pops.push({ x: x, y: y, text: text, rgb: rgb, life: 0.85, max: 0.85, scale: scale || 1 });
  capArr(pops, 24);
}
function hudAdd(n) {
  scoreAdd.hidden = true;
  void scoreAdd.offsetWidth;
  scoreAdd.textContent = '+' + n;
  scoreAdd.hidden = false;
  scoreBox.classList.remove('flash');
  void scoreBox.offsetWidth;
  scoreBox.classList.add('flash');
}
function toast(msg, ms) {
  toastTok += 1;
  var id = toastTok;
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  G.toastT = (ms || 900) / 1000;
  window.setTimeout(function () {
    if (id === toastTok) toastEl.classList.add('hidden');
  }, ms || 900);
}

function persistBest() {
  if (G.score > G.best) {
    G.best = G.score;
    G.newBest = true;
    saveBest(G.best);
  }
  bestEl.textContent = String(G.best);
}

function addScore(n, x, y, pop) {
  G.score += n;
  persistBest();
  hudAdd(n);
  if (pop && x != null) addPop(x, y, String(n), [255, 227, 107], n >= 200 ? 1.35 : 1);
  if (!G.extra && G.score >= EXTRA_LIFE) {
    G.extra = true;
    G.lives += 1;
    audio.extra();
    toast('加命', 900);
    burst(G.pac.x, G.pac.y, 18, [255, 227, 107], 3.2, 0.5, 1.4);
  }
  paintHud(true);
}

/* ---- entities ---- */
function makePac() {
  return {
    x: PAC_SPAWN.x,
    y: PAC_SPAWN.y,
    dir: 'left',
    want: 'left',
    mouth: 0,
    stuck: 0,
    squish: 1
  };
}

function makeGhost(spec, level) {
  return {
    id: spec.id,
    name: spec.name,
    rgb: spec.rgb,
    personality: spec.personality,
    x: spec.spawn.x,
    y: spec.spawn.y,
    dir: spec.phase === 'out' ? 'left' : 'up',
    phase: spec.phase,
    scatter: spec.scatter,
    forceRev: false,
    wob: rand(0, TAU),
    releaseDots: releaseDots(level, spec.id),
    releaseTime: releaseTime(level, spec.id),
    flash: 0
  };
}

function resetActors(keepScore) {
  var i;
  G.pac = makePac();
  G.ghosts = [];
  for (i = 0; i < GHOST_SPEC.length; i++) G.ghosts.push(makeGhost(GHOST_SPEC[i], G.level));
  G.fruit = null;
  G.fruitN = keepScore ? G.fruitN : 0;
  G.scatter = true;
  G.wave = 0;
  G.waveT = WAVES[0].scatter;
  G.fright = 0;
  G.ghostMult = 0;
  G.eatSlow = 0;
  G.combo = 0;
  G.munch = 0;
  G.levelTime = 0;
  G.ready = READY_SEC;
  G.deadT = 0;
  G.clearT = 0;
  G.shake = 0;
  G.stop = 0;
}

function resetLevel(full) {
  G.grid = cloneGrid();
  G.totalDots = countDots(G.grid);
  G.dotsLeft = G.totalDots;
  G.dotsEaten = 0;
  G.fruitN = 0;
  resetActors(!full);
  if (full) {
    G.score = 0;
    G.lives = LIVES;
    G.level = 1;
    G.extra = false;
    G.combo = 0;
    G.maxCombo = 0;
    G.newBest = false;
  }
}

function canLeave(g) {
  return G.dotsEaten >= g.releaseDots || G.levelTime >= g.releaseTime;
}

function ghostSpeed(g, sp) {
  if (g.phase === 'eyes') return sp.eyes;
  if (g.phase === 'house' || g.phase === 'leave') return Math.min(sp.ghost, 5.4);
  if (g.phase === 'fright') return sp.fright;
  if (g.id === 'blinky') {
    var mark = elroyMark(G.level, G.totalDots);
    if (G.dotsLeft <= Math.floor(mark * 0.5)) return sp.elroy2;
    if (G.dotsLeft <= mark) return sp.elroy;
  }
  return sp.ghost;
}

function ghostTarget(g) {
  var pac = G.pac;
  var t, blinky, ax, ay, ahead;
  if (g.phase === 'eyes') return HOUSE_POS;
  if (g.phase === 'leave') return EXIT_POS;
  if (g.phase === 'house') return { x: g.x, y: g.dir === 'up' ? 13.35 : 15.2 };
  if (g.phase === 'fright') return { x: g.x + rand(-8, 8), y: g.y + rand(-8, 8) };
  if (G.scatter && !(g.id === 'blinky' && G.dotsLeft <= elroyMark(G.level, G.totalDots))) {
    return g.scatter;
  }
  t = tileOf(pac.x, pac.y);
  if (g.personality === 'chase') return { x: t.c + 0.5, y: t.r + 0.5 };
  if (g.personality === 'ambush') {
    ahead = aheadTile(pac, 4);
    return ahead;
  }
  if (g.personality === 'wander') {
    ahead = aheadTile(pac, 2);
    blinky = G.ghosts[0];
    ax = ahead.x + (ahead.x - blinky.x);
    ay = ahead.y + (ahead.y - blinky.y);
    return { x: ax, y: ay };
  }
  /* shy */
  if (dist2(g, pac) > 64) return { x: t.c + 0.5, y: t.r + 0.5 };
  return g.scatter;
}

function validGhostDirs(g) {
  var t = tileOf(g.x, g.y);
  var out = [];
  var i, d, nc, nr, name;
  for (i = 0; i < DIR_ORDER.length; i++) {
    name = DIR_ORDER[i];
    if (name === OPP[g.dir] && g.phase !== 'eyes' && g.phase !== 'leave') continue;
    d = DIRS[name];
    nc = t.c + d.x;
    nr = t.r + d.y;
    if (ghostWalk(g, nc, nr)) out.push(name);
  }
  if (!out.length) {
    name = OPP[g.dir];
    d = DIRS[name];
    if (d && ghostWalk(g, t.c + d.x, t.r + d.y)) out.push(name);
  }
  return out;
}

function pickDir(g) {
  var choices = validGhostDirs(g);
  var i, name, d, t, nx, ny, best, bestD, dist, target;
  if (!choices.length) return g.dir;
  if (g.phase === 'fright') {
    return choices[(Math.random() * choices.length) | 0];
  }
  target = ghostTarget(g);
  t = tileOf(g.x, g.y);
  best = choices[0];
  bestD = 1e9;
  for (i = 0; i < choices.length; i++) {
    name = choices[i];
    d = DIRS[name];
    nx = t.c + d.x + 0.5;
    ny = t.r + d.y + 0.5;
    dist = (nx - target.x) * (nx - target.x) + (ny - target.y) * (ny - target.y);
    if (dist < bestD - 0.0001) {
      bestD = dist;
      best = name;
    }
  }
  return best;
}

function tryPacTurn() {
  var pac = G.pac;
  var want = pac.want;
  var t, d, cx, cy, along, cross, cur;
  if (!want || want === pac.dir) return;
  if (want === OPP[pac.dir]) {
    pac.dir = want;
    return;
  }
  t = tileOf(pac.x, pac.y);
  d = DIRS[want];
  if (!pacWalk(t.c + d.x, t.r + d.y)) return;
  cx = t.c + 0.5;
  cy = t.r + 0.5;
  cur = DIRS[pac.dir];
  if (cur.x !== 0) {
    along = Math.abs(pac.x - cx);
    cross = Math.abs(pac.y - cy);
  } else {
    along = Math.abs(pac.y - cy);
    cross = Math.abs(pac.x - cx);
  }
  if (along > TURN_PRE || cross > 0.22) return;
  if (d.x !== 0) pac.y = cy;
  else pac.x = cx;
  pac.dir = want;
}

function moveEnt(ent, dt, speed, walkFn) {
  var d = DIRS[ent.dir];
  var t, nx, ny, blocked, nextC, nextR;
  t = tileOf(ent.x, ent.y);
  nextC = t.c + d.x;
  nextR = t.r + d.y;
  blocked = !walkFn(nextC, nextR);
  if (blocked) {
    var toCenter;
    if (d.x !== 0) toCenter = (t.c + 0.5 - ent.x) * d.x;
    else toCenter = (t.r + 0.5 - ent.y) * d.y;
    if (toCenter <= 0.02) {
      snapCenter(ent);
      return 0;
    }
    speed = Math.min(speed, toCenter / Math.max(dt, 0.0001));
  }
  nx = ent.x + d.x * speed * dt;
  ny = ent.y + d.y * speed * dt;
  ent.x = nx;
  ent.y = ny;
  wrapEnt(ent);
  return speed;
}

function stepHouse(g, dt, sp) {
  var spd = ghostSpeed(g, sp);
  if (g.phase === 'house') {
    if (canLeave(g)) g.phase = 'leave';
    else {
      if (g.y <= 13.35) g.dir = 'down';
      if (g.y >= 15.15) g.dir = 'up';
      g.y += (g.dir === 'up' ? -1 : 1) * spd * 0.7 * dt;
      return;
    }
  }
  if (g.phase === 'leave') {
    if (Math.abs(g.x - EXIT_POS.x) > 0.06) {
      g.dir = g.x < EXIT_POS.x ? 'right' : 'left';
      g.x += (g.dir === 'right' ? 1 : -1) * spd * dt;
    } else {
      g.x = EXIT_POS.x;
      g.dir = 'up';
      g.y -= spd * dt;
    }
    if (g.y <= EXIT_POS.y + 0.02) {
      g.x = EXIT_POS.x;
      g.y = EXIT_POS.y;
      g.phase = G.fright > 0 ? 'fright' : 'out';
      g.dir = 'left';
      if (g.phase === 'fright') g.forceRev = false;
    }
  }
}

function stepGhost(g, dt, sp) {
  var spd, t, key;
  if (g.phase === 'house' || g.phase === 'leave') {
    stepHouse(g, dt, sp);
    return;
  }
  if (g.forceRev) {
    if (nearCenter(g, 0.2)) {
      snapCenter(g);
      if (ghostWalk(g, tileOf(g.x, g.y).c + DIRS[OPP[g.dir]].x, tileOf(g.x, g.y).r + DIRS[OPP[g.dir]].y)) {
        g.dir = OPP[g.dir];
      }
      g.forceRev = false;
    }
  } else if (nearCenter(g, 0.12)) {
    snapCenter(g);
    t = tileOf(g.x, g.y);
    key = t.c + ',' + t.r;
    if (g._at !== key) {
      g._at = key;
      g.dir = pickDir(g);
    }
  }
  spd = ghostSpeed(g, sp);
  moveEnt(g, dt, spd, function (c, r) { return ghostWalk(g, c, r); });
  if (g.phase === 'eyes' && dist2(g, HOUSE_POS) < 0.16) {
    g.x = HOUSE_POS.x;
    g.y = HOUSE_POS.y;
    g.phase = 'leave';
    g.dir = 'up';
    g._at = '';
  }
}

function reverseOutGhosts() {
  var i, g;
  for (i = 0; i < G.ghosts.length; i++) {
    g = G.ghosts[i];
    if (g.phase === 'out' || g.phase === 'fright') {
      g.forceRev = true;
      g._at = '';
    }
  }
}

function frightenAll() {
  var i, g;
  G.fright = FRIGHT_SEC;
  G.ghostMult = 0;
  reverseOutGhosts();
  for (i = 0; i < G.ghosts.length; i++) {
    g = G.ghosts[i];
    if (g.phase === 'out' || g.phase === 'fright') g.phase = 'fright';
  }
  paintHud(true);
}

function eatGhost(g) {
  var n = G.ghostMult;
  var pts = 200 * Math.pow(2, n);
  if (pts > 1600) pts = 1600;
  G.ghostMult = n + 1;
  G.combo = G.ghostMult;
  if (G.combo > G.maxCombo) G.maxCombo = G.combo;
  g.phase = 'eyes';
  g.forceRev = false;
  g._at = '';
  addScore(pts, g.x, g.y, true);
  audio.eatGhost(n);
  screenFlash([180, 230, 255], 0.55 + n * 0.08);
  hitStop(0.045 + n * 0.012);
  kick(5 + n * 2.2);
  G.punch = 1.045 + n * 0.012;
  G.pac.squish = 1.22;
  burst(g.x, g.y, 28 + n * 8, g.rgb, 4.4, 0.55, 1.2);
  burst(g.x, g.y, 16, [200, 230, 255], 3.2, 0.4, 0.4);
  punchStage('eat');
  toast(n >= 3 ? '全吃' : ('吃鬼 ×' + G.combo), 700);
  comboBox.hidden = G.combo < 1;
  comboBox.classList.remove('hot');
  void comboBox.offsetWidth;
  comboBox.classList.add('hot');
  comboEl.textContent = '×' + G.combo;
}

function eatCell() {
  var t = tileOf(G.pac.x, G.pac.y);
  var ch, i, spec;
  if (t.r === TUNNEL_R) t.c = wrapC(t.c);
  if (t.c < 0 || t.c >= COLS || t.r < 0 || t.r >= ROWS) return;
  ch = cell(t.c, t.r);
  if (ch === '.') {
    setCell(t.c, t.r, ' ');
    G.dotsLeft -= 1;
    G.dotsEaten += 1;
    G.eatSlow = 0.09;
    G.munch += 1;
    G.pac.squish = 0.86;
    addScore(10, G.pac.x, G.pac.y, false);
    audio.waka();
    burst(G.pac.x, G.pac.y, 3, [255, 227, 107], 1.6, 0.22, 0.2);
    if (G.munch > 0 && G.munch % 8 === 0) {
      audio.beep(520 + G.munch * 6, 0.05, 'sine', 0.03, 780);
      scoreBox.classList.add('flash');
    }
    maybeFruit();
    if (G.dotsLeft <= 0) onClear();
  } else if (ch === 'o') {
    setCell(t.c, t.r, ' ');
    G.dotsLeft -= 1;
    G.dotsEaten += 1;
    G.eatSlow = 0.12;
    addScore(50, G.pac.x, G.pac.y, true);
    audio.pellet();
    screenFlash([80, 160, 255], 0.42);
    kick(4);
    hitStop(0.04);
    burst(G.pac.x, G.pac.y, 22, [90, 170, 255], 3.6, 0.45, 0.6);
    frightenAll();
    toast('惊吓', 640);
    maybeFruit();
    if (G.dotsLeft <= 0) onClear();
  }
  if (G.fruit && G.fruit.alive && dist2(G.pac, FRUIT_POS) < 0.38) {
    spec = G.fruit.spec;
    G.fruit.alive = false;
    addScore(spec.score, FRUIT_POS.x, FRUIT_POS.y, true);
    audio.fruit();
    burst(FRUIT_POS.x, FRUIT_POS.y, 20, spec.rgb, 3.4, 0.5, 1.5);
    toast(spec.name, 800);
    kick(3);
  }
}

function maybeFruit() {
  if (G.fruitN === 0 && G.dotsEaten >= 70) spawnFruit();
  else if (G.fruitN === 1 && G.dotsEaten >= 170) spawnFruit();
}

function spawnFruit() {
  G.fruitN += 1;
  G.fruit = { alive: true, t: FRUIT_SEC, spec: fruitOf(G.level) };
  toast(G.fruit.spec.name, 700);
}

function onClear() {
  G.screen = 'clear';
  G.clearT = CLEAR_SEC;
  G.fright = 0;
  audio.clear();
  screenFlash([255, 227, 107], 0.5);
  kick(6);
  burst(G.pac.x, G.pac.y, 36, [255, 227, 107], 4.2, 0.7, 1.2);
  toast('过关', 1000);
  audio.stopSiren();
}

function die() {
  G.screen = 'dead';
  G.deadT = DEATH_SEC;
  G.lives -= 1;
  G.fright = 0;
  G.combo = 0;
  audio.death();
  screenFlash([255, 61, 184], 0.5);
  kick(9);
  hitStop(0.07);
  punchStage('die');
  burst(G.pac.x, G.pac.y, 28, [255, 227, 107], 3.8, 0.6, 1.6);
  paintHud(true);
}

function afterDeath() {
  if (G.lives <= 0) {
    G.screen = 'over';
    persistBest();
    audio.over();
    showOver();
    return;
  }
  resetActors(true);
  G.screen = 'ready';
  G.ready = READY_SEC;
  paintHud(true);
}

function afterClear() {
  G.level += 1;
  G.grid = cloneGrid();
  G.totalDots = countDots(G.grid);
  G.dotsLeft = G.totalDots;
  G.dotsEaten = 0;
  G.fruitN = 0;
  resetActors(true);
  G.screen = 'ready';
  G.ready = READY_SEC;
  toast('第 ' + G.level + ' 关', 900);
  paintHud(true);
}

function collisions() {
  var i, g;
  for (i = 0; i < G.ghosts.length; i++) {
    g = G.ghosts[i];
    if (g.phase === 'eyes' || g.phase === 'house' || g.phase === 'leave') continue;
    if (dist2(G.pac, g) < HIT_R2) {
      if (g.phase === 'fright') eatGhost(g);
      else {
        die();
        return;
      }
    }
  }
}

function stepWaves(dt) {
  var w;
  if (G.fright > 0) return;
  G.waveT -= dt;
  if (G.waveT > 0) return;
  G.scatter = !G.scatter;
  reverseOutGhosts();
  if (!G.scatter) {
    w = WAVES[Math.min(G.wave, WAVES.length - 1)];
    G.waveT = w.chase;
  } else {
    G.wave += 1;
    w = WAVES[Math.min(G.wave, WAVES.length - 1)];
    G.waveT = w.scatter;
  }
}

function stepFright(dt) {
  if (G.fright <= 0) return;
  G.fright -= dt;
  if (G.fright <= 0) {
    G.fright = 0;
    G.ghostMult = 0;
    G.combo = 0;
    var i, g;
    for (i = 0; i < G.ghosts.length; i++) {
      g = G.ghosts[i];
      if (g.phase === 'fright') {
        g.phase = 'out';
        g.forceRev = true;
        g._at = '';
      }
    }
  }
  paintHud(false);
}

/* ---- sim ---- */
function stepPlay(dt) {
  var sp = speeds(G.level);
  var pacSp, i, moved;
  G.levelTime += dt;
  G.clock += dt;
  G.eatSlow = Math.max(0, G.eatSlow - dt);
  if (G.fruit && G.fruit.alive) {
    G.fruit.t -= dt;
    if (G.fruit.t <= 0) G.fruit.alive = false;
  }
  stepFright(dt);
  stepWaves(dt);

  tryPacTurn();
  pacSp = G.eatSlow > 0 ? sp.pacEat : sp.pac;
  moved = moveEnt(G.pac, dt, pacSp, pacWalk);
  if (moved > 0.1) G.pac.mouth += dt * 18;
  else G.pac.mouth += dt * 4;
  G.pac.squish = lerp(G.pac.squish, 1, 1 - Math.pow(0.0008, dt));
  eatCell();
  if (G.screen !== 'play') return;

  for (i = 0; i < G.ghosts.length; i++) stepGhost(G.ghosts[i], dt, sp);
  collisions();
}

function stepReady(dt) {
  G.ready -= dt;
  G.clock += dt;
  G.pac.mouth += dt * 8;
  if (G.ready <= 0) {
    G.screen = 'play';
    audio.ensure();
    audio.startSiren();
  }
}

function stepDead(dt) {
  G.deadT -= dt;
  G.clock += dt;
  if (G.deadT <= 0) afterDeath();
}

function stepClear(dt) {
  G.clearT -= dt;
  G.clock += dt;
  if (G.clearT <= 0) afterClear();
}

function stepAttract(dt) {
  var sp = speeds(1);
  var i;
  G.clock += dt;
  G.pac.mouth += dt * 7;
  G.scatter = true;
  for (i = 0; i < G.ghosts.length; i++) {
    if (G.ghosts[i].phase === 'house' && G.clock > 0.4 * (i + 1)) G.ghosts[i].phase = 'leave';
    stepGhost(G.ghosts[i], dt, sp);
  }
}

function updateFx(dt) {
  var i, p;
  G.flash = Math.max(0, G.flash - dt * 2.6);
  G.shake *= Math.pow(0.0008, dt * 60);
  if (G.shake < 0.04) G.shake = 0;
  G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0002, dt));
  G.toastT = Math.max(0, G.toastT - dt);
  for (i = particles.length - 1; i >= 0; i--) {
    p = particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += (p.g || 0) * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (i = pops.length - 1; i >= 0; i--) {
    p = pops[i];
    p.life -= dt;
    p.y -= dt * 0.9;
    if (p.life <= 0) pops.splice(i, 1);
  }
}

function tick(dt) {
  if (G.stop > 0) {
    G.stop -= dt;
    updateFx(dt);
    return;
  }
  if (G.screen === 'title') stepAttract(dt);
  else if (G.screen === 'ready') stepReady(dt);
  else if (G.screen === 'play') stepPlay(dt);
  else if (G.screen === 'dead') stepDead(dt);
  else if (G.screen === 'clear') stepClear(dt);
  updateFx(dt);
  if (G.screen === 'play') audio.tickSiren(G.fright, G.dotsLeft, G.totalDots);
  else if (audio.sirenOn && G.screen !== 'ready') audio.stopSiren();
}

/* ---- render ---- */
function fogVisible(x, y) {
  if (G.kind !== 'fog' || G.screen === 'title') return 1;
  var dx = x - G.pac.x;
  var dy = y - G.pac.y;
  var d = Math.sqrt(dx * dx + dy * dy);
  if (d <= FOG_R) return 1;
  if (d >= FOG_FADE) return 0;
  return 1 - (d - FOG_R) / (FOG_FADE - FOG_R);
}

function roundRect(c, x, y, w, h, r) {
  var rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

function drawMaze(c, s, pulse) {
  var r, col, ch, x, y, vis, a;
  var pad = s * 0.22;
  c.fillStyle = '#050814';
  c.fillRect(0, 0, COLS * s, ROWS * s);

  for (r = 0; r < ROWS; r++) {
    for (col = 0; col < COLS; col++) {
      ch = G.grid[r].charAt(col);
      if (ch === '_' ) continue;
      if (ch === '#') continue;
      vis = fogVisible(col + 0.5, r + 0.5);
      if (vis < 0.02 && G.kind === 'fog' && G.screen !== 'title') continue;
      x = col * s;
      y = r * s;
      a = 0.55 + vis * 0.45;
      c.fillStyle = 'rgba(6, 10, 28,' + a + ')';
      c.fillRect(x - 0.5, y - 0.5, s + 1, s + 1);
    }
  }

  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.lineWidth = Math.max(1.6, s * 0.13);
  var wallOn = 1;
  if (G.screen === 'clear') wallOn = ((G.clearT * 8) | 0) % 2 === 0 ? 1 : 0.25;
  for (r = 0; r < ROWS; r++) {
    for (col = 0; col < COLS; col++) {
      ch = G.grid[r].charAt(col);
      if (ch === '_' || ch === '#') continue;
      vis = fogVisible(col + 0.5, r + 0.5);
      if (G.kind === 'fog' && G.screen !== 'title' && vis < 0.04) {
        vis = 0.045;
      }
      a = (0.18 + vis * 0.82) * wallOn;
      c.strokeStyle = rgba([0, 220, 255], a);
      c.shadowColor = rgba([0, 240, 255], 0.35 * vis * wallOn);
      c.shadowBlur = s * 0.22;
      x = col * s;
      y = r * s;
      c.beginPath();
      if (isWallChar(cell(col, r - 1)) || (r - 1 < 0 && r !== TUNNEL_R)) {
        c.moveTo(x + pad, y + pad);
        c.lineTo(x + s - pad, y + pad);
      }
      if (isWallChar(cell(col, r + 1)) || (r + 1 >= ROWS && r !== TUNNEL_R)) {
        c.moveTo(x + pad, y + s - pad);
        c.lineTo(x + s - pad, y + s - pad);
      }
      if (isWallChar(cell(col - 1, r)) && !(r === TUNNEL_R && col === 0)) {
        c.moveTo(x + pad, y + pad);
        c.lineTo(x + pad, y + s - pad);
      }
      if (isWallChar(cell(col + 1, r)) && !(r === TUNNEL_R && col === COLS - 1)) {
        c.moveTo(x + s - pad, y + pad);
        c.lineTo(x + s - pad, y + s - pad);
      }
      c.stroke();
    }
  }
  c.shadowBlur = 0;

  for (r = 0; r < ROWS; r++) {
    for (col = 0; col < COLS; col++) {
      if (!isDoor(col, r)) continue;
      vis = fogVisible(col + 0.5, r + 0.5);
      c.strokeStyle = rgba([255, 180, 220], 0.35 + vis * 0.55);
      c.lineWidth = Math.max(1.4, s * 0.08);
      c.beginPath();
      c.moveTo(col * s + s * 0.1, r * s + s * 0.55);
      c.lineTo(col * s + s * 0.9, r * s + s * 0.55);
      c.stroke();
    }
  }

  for (r = 0; r < ROWS; r++) {
    for (col = 0; col < COLS; col++) {
      ch = G.grid[r].charAt(col);
      vis = fogVisible(col + 0.5, r + 0.5);
      if (ch === '.') {
        if (vis < 0.12 && G.kind === 'fog' && G.screen !== 'title') continue;
        c.fillStyle = rgba([255, 227, 107], 0.25 + vis * 0.75);
        c.beginPath();
        c.arc((col + 0.5) * s, (r + 0.5) * s, Math.max(1.2, s * 0.09), 0, TAU);
        c.fill();
      } else if (ch === 'o') {
        if (vis < 0.08 && G.kind === 'fog' && G.screen !== 'title') continue;
        var rad = s * (0.22 + 0.05 * Math.sin(pulse * 6 + col));
        c.fillStyle = rgba([255, 236, 170], 0.35 + vis * 0.65);
        c.shadowColor = 'rgba(255, 227, 107, 0.7)';
        c.shadowBlur = s * 0.4;
        c.beginPath();
        c.arc((col + 0.5) * s, (r + 0.5) * s, rad, 0, TAU);
        c.fill();
        c.shadowBlur = 0;
      }
    }
  }
}

function drawFruit(c, s) {
  var f = G.fruit;
  var vis, px, py;
  if (!f || !f.alive) return;
  vis = fogVisible(FRUIT_POS.x, FRUIT_POS.y);
  if (G.kind === 'fog' && vis < 0.15) return;
  if (f.t < 2 && ((f.t * 8) | 0) % 2 === 0) return;
  px = FRUIT_POS.x * s;
  py = FRUIT_POS.y * s;
  c.save();
  c.globalAlpha = 0.4 + vis * 0.6;
  c.fillStyle = rgba(f.spec.rgb, 1);
  c.shadowColor = rgba(f.spec.rgb, 0.7);
  c.shadowBlur = s * 0.35;
  c.beginPath();
  c.arc(px, py + s * 0.04, s * 0.22, 0, TAU);
  c.fill();
  c.fillStyle = '#6dff9a';
  c.fillRect(px - s * 0.03, py - s * 0.28, s * 0.06, s * 0.16);
  c.restore();
}

function drawPac(c, s, pac, deadT) {
  var px = pac.x * s;
  var py = pac.y * s;
  var ang = DIR_ANG[pac.dir] || 0;
  var open;
  var rad = s * 0.42 * pac.squish;
  if (deadT >= 0) open = lerp(0.18, 1.02, 1 - deadT / DEATH_SEC);
  else open = 0.07 + 0.32 * Math.abs(Math.sin(pac.mouth));
  c.save();
  c.translate(px, py);
  c.rotate(ang);
  c.fillStyle = '#ffe36b';
  c.shadowColor = 'rgba(255, 227, 107, 0.7)';
  c.shadowBlur = s * 0.4;
  c.beginPath();
  if (open >= 0.98) {
    c.arc(0, 0, rad, 0, TAU);
  } else {
    c.arc(0, 0, rad, open * Math.PI, TAU - open * Math.PI);
    c.lineTo(0, 0);
    c.closePath();
  }
  c.fill();
  c.restore();
}

function drawGhost(c, s, g, time) {
  var vis = fogVisible(g.x, g.y);
  var px, py, rad, wob, i, gx, fright, flash, body, skirt, eyesLook;
  var d, ex, ey;
  if (G.kind === 'fog' && G.screen !== 'title') {
    if (g.phase === 'eyes') vis = Math.max(vis, 0.55);
    else if (g.phase === 'fright') vis = Math.max(vis, 0.38);
    else if (vis < 0.16) return;
  }
  px = g.x * s;
  py = g.y * s;
  rad = s * 0.4;
  wob = Math.sin(time * 9 + g.wob) * rad * 0.07;
  fright = g.phase === 'fright';
  flash = fright && G.fright < 2 && ((G.fright * 8) | 0) % 2 === 0;
  body = g.phase === 'eyes' ? null : (fright ? (flash ? [240, 244, 255] : [50, 90, 255]) : g.rgb);
  c.save();
  c.globalAlpha = 0.25 + vis * 0.75;
  if (body) {
    c.fillStyle = rgba(body, 1);
    c.shadowColor = rgba(body, 0.55);
    c.shadowBlur = s * 0.28;
    c.beginPath();
    c.arc(px, py - rad * 0.12 + wob, rad, Math.PI, 0);
    c.lineTo(px + rad, py + rad * 0.72 + wob);
    skirt = 4;
    for (i = 0; i <= skirt; i++) {
      gx = px + rad - (i / skirt) * rad * 2;
      c.lineTo(gx, py + rad * 0.72 + wob + ((i % 2 === 0) ? rad * 0.16 : -rad * 0.1));
    }
    c.closePath();
    c.fill();
    c.shadowBlur = 0;
  }
  d = DIRS[g.dir] || DIRS.left;
  ex = d.x * rad * 0.14;
  ey = d.y * rad * 0.14;
  c.fillStyle = '#f4f7ff';
  c.beginPath();
  c.ellipse(px - rad * 0.28 + ex, py - rad * 0.18 + wob, rad * 0.16, rad * 0.2, 0, 0, TAU);
  c.ellipse(px + rad * 0.28 + ex, py - rad * 0.18 + wob, rad * 0.16, rad * 0.2, 0, 0, TAU);
  c.fill();
  c.fillStyle = fright && !flash ? '#f4f7ff' : '#1a2040';
  if (g.phase === 'eyes') c.fillStyle = '#4d6cff';
  eyesLook = fright ? 0 : 1;
  c.beginPath();
  c.arc(px - rad * 0.28 + ex * 1.6 * eyesLook, py - rad * 0.18 + wob + ey * 1.2, rad * 0.08, 0, TAU);
  c.arc(px + rad * 0.28 + ex * 1.6 * eyesLook, py - rad * 0.18 + wob + ey * 1.2, rad * 0.08, 0, TAU);
  c.fill();
  if (fright && !flash && g.phase !== 'eyes') {
    c.strokeStyle = '#f4f7ff';
    c.lineWidth = Math.max(1, s * 0.05);
    c.beginPath();
    c.moveTo(px - rad * 0.28, py + rad * 0.28 + wob);
    c.quadraticCurveTo(px - rad * 0.14, py + rad * 0.14 + wob, px, py + rad * 0.28 + wob);
    c.quadraticCurveTo(px + rad * 0.14, py + rad * 0.42 + wob, px + rad * 0.28, py + rad * 0.28 + wob);
    c.stroke();
  }
  c.restore();
}

function drawActorWrap(drawFn, ent) {
  drawFn(ent);
  if (ent.x < 1.2) {
    ctx.save();
    ctx.translate(view.tile * COLS, 0);
    drawFn(ent);
    ctx.restore();
  } else if (ent.x > COLS - 1.2) {
    ctx.save();
    ctx.translate(-view.tile * COLS, 0);
    drawFn(ent);
    ctx.restore();
  }
}

function drawFx(c, s) {
  var i, p, a;
  for (i = 0; i < particles.length; i++) {
    p = particles[i];
    a = p.life / p.max;
    c.globalAlpha = a;
    c.fillStyle = rgba(p.rgb, 1);
    c.beginPath();
    c.arc(p.x * s, p.y * s, p.r * s * (0.6 + a * 0.6), 0, TAU);
    c.fill();
  }
  c.globalAlpha = 1;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  for (i = 0; i < pops.length; i++) {
    p = pops[i];
    a = p.life / p.max;
    c.globalAlpha = a;
    c.fillStyle = rgba(p.rgb, 1);
    c.font = '700 ' + Math.round(s * 0.7 * p.scale * (0.85 + (1 - a) * 0.4)) + 'px "Segoe UI", "PingFang SC", sans-serif';
    c.shadowColor = rgba(p.rgb, 0.8);
    c.shadowBlur = 12;
    c.fillText(p.text, p.x * s, p.y * s);
  }
  c.shadowBlur = 0;
  c.globalAlpha = 1;
}

function drawFog(c, s) {
  var g, px, py, rad;
  if (G.kind !== 'fog' || G.screen === 'title') return;
  px = G.pac.x * s;
  py = G.pac.y * s;
  rad = FOG_FADE * s;
  g = c.createRadialGradient(px, py, FOG_R * s * 0.35, px, py, rad);
  g.addColorStop(0, 'rgba(5,3,12,0)');
  g.addColorStop(0.42, 'rgba(5,3,12,0.08)');
  g.addColorStop(0.72, 'rgba(5,3,12,0.82)');
  g.addColorStop(1, 'rgba(5,3,12,0.97)');
  c.fillStyle = g;
  c.fillRect(-s, -s, (COLS + 2) * s, (ROWS + 2) * s);
}

function drawBanner(c, s) {
  var msg = '';
  if (G.screen === 'ready') msg = '预备';
  else if (G.screen === 'dead') msg = G.lives <= 0 ? '' : '被追上';
  else if (G.screen === 'clear') msg = '过关';
  if (!msg) return;
  c.save();
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = '800 ' + Math.round(s * 1.35) + 'px "Segoe UI", "PingFang SC", sans-serif';
  c.fillStyle = '#ffe36b';
  c.shadowColor = 'rgba(255, 227, 107, 0.7)';
  c.shadowBlur = 16;
  c.fillText(msg, (COLS * s) / 2, (ROWS * s) / 2);
  c.restore();
}

function render() {
  var dpr = view.dpr;
  var s = view.tile;
  var w = view.w;
  var h = view.h;
  var shx = 0, shy = 0;
  var i;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#05030c';
  ctx.fillRect(0, 0, w, h);
  if (G.shake > 0 && !reduceMotion()) {
    shx = (Math.random() - 0.5) * G.shake;
    shy = (Math.random() - 0.5) * G.shake;
  }
  ctx.save();
  ctx.translate(view.ox + shx, view.oy + shy);
  if (G.punch !== 1 && !reduceMotion()) {
    ctx.translate(COLS * s * 0.5, ROWS * s * 0.5);
    ctx.scale(G.punch, G.punch);
    ctx.translate(-COLS * s * 0.5, -ROWS * s * 0.5);
  }
  drawMaze(ctx, s, G.clock);
  drawFruit(ctx, s);
  for (i = 0; i < G.ghosts.length; i++) {
    (function (g) {
      drawActorWrap(function () { drawGhost(ctx, s, g, G.clock); }, g);
    })(G.ghosts[i]);
  }
  if (G.screen !== 'dead' || G.deadT > 0) {
    drawActorWrap(function () {
      drawPac(ctx, s, G.pac, G.screen === 'dead' ? G.deadT : -1);
    }, G.pac);
  }
  drawFog(ctx, s);
  drawFx(ctx, s);
  if (G.flash > 0) {
    ctx.fillStyle = rgba(G.flashRgb, G.flash);
    ctx.fillRect(-s, -s, (COLS + 2) * s, (ROWS + 2) * s);
  }
  drawBanner(ctx, s);
  ctx.restore();
}

function resize() {
  var wrap = canvas.parentElement;
  var rect = wrap.getBoundingClientRect();
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  var w = Math.max(1, rect.width);
  var h = Math.max(1, rect.height);
  var tile = Math.min(w / COLS, h / ROWS);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  view.w = w;
  view.h = h;
  view.dpr = dpr;
  view.tile = tile;
  view.ox = (w - COLS * tile) / 2;
  view.oy = (h - ROWS * tile) / 2;
}

/* ---- hud / overlay ---- */
function paintPips() {
  var html = '';
  var i;
  for (i = 0; i < LIVES; i++) {
    html += '<i class="pip ' + (i < G.lives ? 'on' : 'gone') + '"></i>';
  }
  if (G.lives > LIVES) {
    for (i = LIVES; i < G.lives; i++) html += '<i class="pip on"></i>';
  }
  pipsEl.innerHTML = html;
}

function paintHud(force) {
  if (force || hud.score !== G.score) {
    hud.score = G.score;
    scoreEl.textContent = String(G.score);
  }
  if (force || hud.best !== G.best) {
    hud.best = G.best;
    bestEl.textContent = String(G.best);
  }
  if (force || hud.level !== G.level) {
    hud.level = G.level;
    levelEl.textContent = String(G.level);
  }
  if (force || hud.combo !== G.combo) {
    hud.combo = G.combo;
    comboEl.textContent = '×' + Math.max(1, G.combo);
    comboBox.hidden = G.combo < 1 || G.screen === 'title';
  }
  if (force || hud.lives !== G.lives) {
    hud.lives = G.lives;
    paintPips();
  }
  var fr = G.fright > 0 ? G.fright / FRIGHT_SEC : 0;
  if (force || Math.abs(hud.fright - fr) > 0.01) {
    hud.fright = fr;
    if (G.fright > 0 && G.screen === 'play') {
      frightWrap.hidden = false;
      frightBar.style.transform = 'scaleX(' + fr + ')';
      frightBar.classList.toggle('low', G.fright < 2);
    } else {
      frightWrap.hidden = true;
    }
  }
  modeLabel.textContent = G.kind === 'fog' ? '迷雾' : '经典';
  modeLabel.classList.toggle('fog', G.kind === 'fog');
}

function showTitle() {
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  panel.className = 'panel';
  ovKicker.textContent = 'PAC';
  ovTitle.textContent = '豆径';
  ovLead.textContent = '吃光豆子，躲鬼。能量豆反打。';
  ovOps.textContent = '方向键或滑动 · 能量豆惊吓六秒 · R 重开 · M 静音';
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
}

function showOver() {
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  panel.className = 'panel lose';
  ovKicker.textContent = 'PAC';
  ovTitle.textContent = '被追上了';
  ovLead.textContent = '本局 ' + G.score + (G.newBest ? ' · 新纪录' : '') + ' · 第 ' + G.level + ' 关';
  ovOps.textContent = 'R 重开 · 再来同模式';
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
}

function hideOverlay() {
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
}

function startGame(kind) {
  G.kind = kind || 'classic';
  resetLevel(true);
  G.screen = 'ready';
  G.ready = READY_SEC;
  hideOverlay();
  audio.start();
  hintEl.textContent = G.kind === 'fog'
    ? '迷雾只亮近处 · 能量豆反吃鬼 · R 重开 · M 静音'
    : '方向键或滑动 · 能量豆反吃鬼 · 四鬼性格不同';
  paintHud(true);
  canvas.focus();
}

function restart() {
  audio.ui();
  if (G.screen === 'title') {
    startGame('classic');
    return;
  }
  startGame(G.kind);
}

function backToModes() {
  audio.ui();
  audio.stopSiren();
  resetLevel(true);
  G.screen = 'title';
  G.kind = 'classic';
  showTitle();
  paintHud(true);
}

/* ---- input ---- */
function wantDir(dir) {
  if (!dir) return;
  audio.ensure();
  if (G.screen === 'title' || G.screen === 'over') return;
  G.pac.want = dir;
}

function onKey(e) {
  var dir = KEY_DIR[e.code];
  if (dir) {
    e.preventDefault();
    wantDir(dir);
    return;
  }
  if (e.code === 'KeyR') {
    e.preventDefault();
    restart();
    return;
  }
  if (e.code === 'KeyM') {
    e.preventDefault();
    audio.ensure();
    audio.setMuted(!audio.muted);
    return;
  }
  if (e.code === 'Space' || e.code === 'Enter') {
    if (G.screen === 'title') {
      e.preventDefault();
      startGame('classic');
    } else if (G.screen === 'over') {
      e.preventDefault();
      startGame(G.kind);
    }
  }
}

function swipeDir(dx, dy) {
  if (Math.abs(dx) < SWIPE_MIN && Math.abs(dy) < SWIPE_MIN) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

function onPointerDown(e) {
  audio.ensure();
  swipe.on = true;
  swipe.id = e.pointerId;
  swipe.x = e.clientX;
  swipe.y = e.clientY;
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
}

function onPointerMove(e) {
  var dir;
  if (!swipe.on || e.pointerId !== swipe.id) return;
  dir = swipeDir(e.clientX - swipe.x, e.clientY - swipe.y);
  if (dir) {
    wantDir(dir);
    swipe.x = e.clientX;
    swipe.y = e.clientY;
  }
}

function onPointerUp(e) {
  if (e.pointerId === swipe.id) swipe.on = false;
}

function onTouchStart(e) {
  var t;
  if (!e.changedTouches || !e.changedTouches.length) return;
  t = e.changedTouches[0];
  audio.ensure();
  swipe.on = true;
  swipe.id = t.identifier;
  swipe.x = t.clientX;
  swipe.y = t.clientY;
  e.preventDefault();
}

function onTouchMove(e) {
  var t, i, dir;
  if (!swipe.on) return;
  for (i = 0; i < e.changedTouches.length; i++) {
    t = e.changedTouches[i];
    if (t.identifier !== swipe.id) continue;
    dir = swipeDir(t.clientX - swipe.x, t.clientY - swipe.y);
    if (dir) {
      wantDir(dir);
      swipe.x = t.clientX;
      swipe.y = t.clientY;
    }
    e.preventDefault();
    return;
  }
}

function onTouchEnd(e) {
  var i, t;
  for (i = 0; i < e.changedTouches.length; i++) {
    t = e.changedTouches[i];
    if (t.identifier === swipe.id) swipe.on = false;
  }
}

/* ---- loop ---- */
function frame(ts) {
  var dt;
  if (!lastTs) lastTs = ts;
  dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (dt > 0.05) dt = 0.05;
  if (document.hidden) {
    requestAnimationFrame(frame);
    return;
  }
  tick(dt);
  render();
  requestAnimationFrame(frame);
}

function bind() {
  window.addEventListener('keydown', onKey);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd);
  canvas.addEventListener('touchcancel', onTouchEnd);
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnRetry.addEventListener('click', restart);
  btnClassic.addEventListener('click', function () { startGame('classic'); });
  btnFog.addEventListener('click', function () { startGame('fog'); });
  ovRetry.addEventListener('click', function () { startGame(G.kind); });
  ovModes.addEventListener('click', backToModes);
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(canvas.parentElement);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) audio.stopSiren();
    else if (G.screen === 'play') {
      audio.ensure();
      audio.startSiren();
    }
  });
}

function boot() {
  var r;
  for (r = 0; r < MAZE.length; r++) {
    if (MAZE[r].length !== COLS) {
      throw new Error('maze row ' + r + ' len ' + MAZE[r].length);
    }
  }
  G.best = loadBest();
  audio.setMuted(loadMute());
  resetLevel(true);
  G.screen = 'title';
  showTitle();
  paintHud(true);
  resize();
  bind();
  requestAnimationFrame(frame);
}

boot();
