'use strict';

/* 推球 — Mr. Do! remake. No CDN. Hue 18. Crush is the juice. */

var COLS = 17;
var ROWS = 15;
var LIVES = 3;
var STAGES = 8;
var READY_SEC = 1.12;
var DEAD_SEC = 0.98;
var CLEAR_SEC = 1.42;
var INVULN = 1.28;
var COMBO_WIN = 2.55;
var EXTRA_LIFE = 10000;
var SWIPE_MIN = 22;
var TAU = Math.PI * 2;
var BEST_KEY = 'playbox-mr-do-best';
var MUTE_KEY = 'playbox-mr-do-mute';
var WORD = 'EXTRA';

var DIR = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 }
];
var OPP = [2, 3, 0, 1];
var KEY_DIR = {
  ArrowRight: 0, KeyD: 0,
  ArrowDown: 1, KeyS: 1,
  ArrowLeft: 2, KeyA: 2,
  ArrowUp: 3, KeyW: 3
};

var RGB = {
  gold: [255, 227, 107],
  cyan: [0, 240, 255],
  mag: [255, 61, 184],
  lime: [61, 255, 136],
  orange: [255, 106, 34],
  cherry: [255, 52, 78],
  stem: [61, 210, 96],
  dino: [255, 84, 48],
  alpha: [64, 168, 255],
  dirt: [176, 86, 36],
  white: [255, 250, 230],
  ball: [255, 214, 64]
};

var GROUPS = [
  { c: 1, r: 1, w: 4, h: 2 },
  { c: 12, r: 1, w: 4, h: 2 },
  { c: 7, r: 4, w: 4, h: 2 },
  { c: 1, r: 11, w: 4, h: 2 },
  { c: 12, r: 11, w: 4, h: 2 }
];

var FOOD = [
  { name: '糖葫芦', score: 1000 },
  { name: '冰淇淋', score: 2000 },
  { name: '椒盐卷', score: 3000 },
  { name: '蛋糕', score: 4000 },
  { name: '苹果', score: 5000 }
];

var HOUSE = { c: 7, r: 6, w: 3, h: 3 };
var DOOR = { c: 8, r: 9 };
var SPAWN_P = { c: 8, r: 13 };
var SPAWN_B = { c: 9, r: 13 };

/* tunH/tunV: [col, row, len]. walls: [col, row, w, h] */
var STAGE_DECO = [
  { tunH: [[1, 13, 15], [7, 9, 3]], tunV: [[8, 9, 5]], walls: [] },
  {
    tunH: [[1, 13, 15], [7, 9, 3], [1, 3, 15]],
    tunV: [[8, 9, 5], [5, 1, 5], [11, 1, 5]],
    walls: [[3, 7, 2, 2], [12, 7, 2, 2]]
  },
  {
    tunH: [[1, 13, 15], [7, 9, 3], [1, 10, 15]],
    tunV: [[8, 9, 5], [4, 3, 10], [12, 3, 10]],
    walls: [[6, 3, 1, 2], [10, 3, 1, 2], [2, 7, 2, 1], [13, 7, 2, 1]]
  },
  {
    tunH: [[1, 13, 15], [7, 9, 3], [2, 5, 13]],
    tunV: [[8, 9, 5], [2, 2, 11], [14, 2, 11]],
    walls: [[4, 7, 1, 3], [6, 10, 1, 2], [10, 10, 1, 2], [12, 7, 1, 3], [4, 3, 1, 1], [12, 3, 1, 1]]
  },
  {
    tunH: [[1, 13, 15], [5, 5, 7], [5, 10, 7], [7, 9, 3]],
    tunV: [[8, 9, 5], [5, 5, 6], [11, 5, 6]],
    walls: [[3, 3, 2, 2], [12, 3, 2, 2], [3, 8, 2, 1], [12, 8, 2, 1]]
  },
  {
    tunH: [[1, 13, 15], [7, 9, 3], [1, 3, 6], [10, 3, 6]],
    tunV: [[8, 3, 11], [3, 5, 7], [13, 5, 7]],
    walls: [[5, 7, 1, 3], [11, 7, 1, 3], [6, 10, 2, 1], [9, 10, 2, 1], [2, 8, 1, 1], [14, 8, 1, 1]]
  },
  {
    tunH: [[1, 13, 15], [1, 3, 15], [1, 10, 15], [7, 9, 3]],
    tunV: [[8, 1, 13], [4, 3, 10], [12, 3, 10]],
    walls: [[2, 6, 2, 1], [13, 6, 2, 1], [6, 12, 1, 1], [10, 12, 1, 1]]
  },
  {
    tunH: [[1, 13, 15], [6, 5, 5], [6, 10, 5], [7, 9, 3]],
    tunV: [[8, 9, 5], [6, 5, 6], [10, 5, 6], [3, 2, 5], [13, 2, 5]],
    walls: [[5, 5, 1, 6], [11, 5, 1, 6], [6, 5, 5, 1], [6, 10, 2, 1], [9, 10, 2, 1]]
  }
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
var btnGarden = document.getElementById('btn-garden');
var btnHunt = document.getElementById('btn-hunt');
var ovRetry = document.getElementById('ov-retry');
var ovModes = document.getElementById('ov-modes');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var scoreEl = document.getElementById('score');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var bestEl = document.getElementById('best');
var roundEl = document.getElementById('round');
var roundEm = document.getElementById('round-em');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var modeLabel = document.getElementById('mode-label');
var lettersEl = document.getElementById('letters');
var pipsEl = document.getElementById('pips');
var toastEl = document.getElementById('toast');
var hintEl = document.getElementById('hint');
var stageEl = document.getElementById('stage');
var motionQ = window.matchMedia('(prefers-reduced-motion: reduce)');

var view = { w: 1, h: 1, dpr: 1, tile: 16, ox: 0, oy: 0 };
var particles = [];
var pops = [];
var rings = [];
var lastTs = 0;
var toastTok = 0;
var dirStamp = 0;
var dirHeld = [0, 0, 0, 0];
var padHeld = { 0: false, 1: false, 2: false, 3: false };
var swipe = { on: false, id: 0, x: 0, y: 0, moved: false };
var hud = { score: -1, best: -1, round: -1, combo: -1, lives: -1 };
var vis = new Array(COLS * ROWS);
var parent = new Array(COLS * ROWS);
var bfsQ = new Array(COLS * ROWS);
var visN = 1;

var G = {
  phase: 'title',
  kind: 'orchard',
  round: 1,
  lives: LIVES,
  score: 0,
  bests: { orchard: 0, chase: 0 },
  combo: 0,
  comboAge: 0,
  extraLife: false,
  newBest: false,
  got: { E: false, X: false, T: false, R: false, A: false },
  grid: [],
  cherries: [],
  cherryLeft: 0,
  cherryStreak: 0,
  cherryAge: 0,
  mons: [],
  player: null,
  ball: null,
  food: null,
  foodN: 0,
  foodWait: 11,
  spawnT: 0.5,
  alphaOn: false,
  resetLetters: 0,
  transformT: 0,
  roundClock: 0,
  ready: 0,
  deadT: 0,
  clearT: 0,
  clock: 0,
  stop: 0,
  shake: 0,
  flash: 0,
  flashRgb: RGB.gold,
  punch: 1,
  why: ''
};

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function rand(a, b) { return a + Math.random() * (b - a); }
function hypot(x, y) { return Math.sqrt(x * x + y * y); }
function rgba(rgb, a) { return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')'; }
function reduceMotion() { return motionQ.matches; }
function hash(c, r) {
  var n = ((c + 3) * 73 + (r + 5) * 149) | 0;
  n = (n ^ (n >>> 8)) * 2654435761;
  return ((n >>> 0) % 10000) / 10000;
}
function inB(c, r) { return c >= 0 && r >= 0 && c < COLS && r < ROWS; }
function isHouse(c, r) {
  return c >= HOUSE.c && c < HOUSE.c + HOUSE.w && r >= HOUSE.r && r < HOUSE.r + HOUSE.h;
}
function inCherry(c, r) {
  var i, g;
  for (i = 0; i < GROUPS.length; i++) {
    g = GROUPS[i];
    if (c >= g.c && c < g.c + g.w && r >= g.r && r < g.r + g.h) return true;
  }
  return false;
}
function cell(c, r) {
  if (!inB(c, r)) return 2;
  return G.grid[r][c];
}
function isEmpty(c, r) { return inB(c, r) && G.grid[r][c] === 0; }
function isDirt(c, r) { return inB(c, r) && G.grid[r][c] === 1; }
function playerCan(c, r) {
  if (!inB(c, r)) return false;
  var t = G.grid[r][c];
  return t !== 2 && t !== 3;
}
function occ() {
  var p = G.player;
  if (p.moving && p.t > 0.55) return { c: p.mc, r: p.mr };
  return { c: p.c, r: p.r };
}
function dirOf(dc, dr) {
  if (dc > 0) return 0;
  if (dr > 0) return 1;
  if (dc < 0) return 2;
  return 3;
}

function playerSpd() {
  var m = G.kind === 'chase' ? 1.04 : 1;
  return { tunnel: 6.2 * m, dig: 3.45 * m };
}
function monSpd(m) {
  var base = (G.kind === 'chase' ? 2.35 : 1.92) + (G.round - 1) * (G.kind === 'chase' ? 0.16 : 0.12);
  if (base > 4.6) base = 4.6;
  if (m.letter) base *= 1.22;
  return base;
}
function maxMons() {
  if (G.kind === 'chase') return Math.min(8, 4 + G.round);
  return Math.min(5, 2 + ((G.round - 1) >> 1));
}
function spawnDelay() {
  var d = G.kind === 'chase' ? 1.45 - G.round * 0.07 : 2.35 - G.round * 0.12;
  return d < 0.68 ? 0.68 : d;
}
function liveMons() {
  var n = 0, i;
  for (i = 0; i < G.mons.length; i++) if (G.mons[i].state !== 'gone') n++;
  return n;
}

function stamp(g, c, r, ch) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
  g[r] = g[r].slice(0, c) + ch + g[r].slice(c + 1);
}
function carve(g, c, r) {
  if (!inB(c, r)) return;
  if (c === 0 || r === 0 || c === COLS - 1 || r === ROWS - 1) return;
  if (isHouse(c, r)) return;
  if (inCherry(c, r)) return;
  stamp(g, c, r, ' ');
}
function wallAt(g, c, r) {
  if (!inB(c, r)) return;
  if (c === 0 || r === 0 || c === COLS - 1 || r === ROWS - 1) return;
  if (isHouse(c, r) || inCherry(c, r)) return;
  if ((c === SPAWN_P.c && r === SPAWN_P.r) || (c === SPAWN_B.c && r === SPAWN_B.r)) return;
  if (c === DOOR.c && r === DOOR.r) return;
  stamp(g, c, r, '#');
}

function buildMap(round, kind) {
  var g = [];
  var r, c, row, i, k, deco, t, w;
  var idx = (round - 1) % STAGES;
  for (r = 0; r < ROWS; r++) {
    row = '';
    for (c = 0; c < COLS; c++) {
      if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) row += '#';
      else row += '.';
    }
    g.push(row);
  }
  for (r = HOUSE.r; r < HOUSE.r + HOUSE.h; r++) {
    for (c = HOUSE.c; c < HOUSE.c + HOUSE.w; c++) stamp(g, c, r, 'H');
  }
  deco = STAGE_DECO[idx];
  for (i = 0; i < deco.tunH.length; i++) {
    t = deco.tunH[i];
    for (k = 0; k < t[2]; k++) carve(g, t[0] + k, t[1]);
  }
  for (i = 0; i < deco.tunV.length; i++) {
    t = deco.tunV[i];
    for (k = 0; k < t[2]; k++) carve(g, t[0], t[1] + k);
  }
  for (i = 0; i < deco.walls.length; i++) {
    w = deco.walls[i];
    for (r = 0; r < w[3]; r++) {
      for (c = 0; c < w[2]; c++) wallAt(g, w[0] + c, w[1] + r);
    }
  }
  if (kind === 'chase') {
    for (c = 1; c < COLS - 1; c++) {
      carve(g, c, 5);
      carve(g, c, 10);
    }
    for (r = 2; r < ROWS - 2; r++) {
      carve(g, 3, r);
      carve(g, 13, r);
      if (round > 3) carve(g, 5, r);
    }
  }
  stamp(g, DOOR.c, DOOR.r, ' ');
  stamp(g, SPAWN_P.c, SPAWN_P.r, ' ');
  stamp(g, SPAWN_B.c, SPAWN_B.r, ' ');
  for (c = 1; c < COLS - 1; c++) stamp(g, c, SPAWN_P.r, ' ');
  return g;
}

function parseGrid(lines) {
  var grid = [];
  var cherries = [];
  var r, c, ch, gi, g, i, j;
  for (r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (c = 0; c < COLS; c++) {
      ch = lines[r].charAt(c);
      if (ch === '#') grid[r][c] = 2;
      else if (ch === 'H') grid[r][c] = 3;
      else if (ch === ' ' || ch === 'P' || ch === 'B' || ch === 'D') grid[r][c] = 0;
      else grid[r][c] = 1;
    }
  }
  for (gi = 0; gi < GROUPS.length; gi++) {
    g = GROUPS[gi];
    for (j = 0; j < g.h; j++) {
      for (i = 0; i < g.w; i++) {
        c = g.c + i;
        r = g.r + j;
        grid[r][c] = 1;
        cherries.push({ c: c, r: r, g: gi, taken: false });
      }
    }
  }
  for (r = HOUSE.r; r < HOUSE.r + HOUSE.h; r++) {
    for (c = HOUSE.c; c < HOUSE.c + HOUSE.w; c++) grid[r][c] = 3;
  }
  grid[DOOR.r][DOOR.c] = 0;
  grid[SPAWN_P.r][SPAWN_P.c] = 0;
  grid[SPAWN_B.r][SPAWN_B.c] = 0;
  for (c = 1; c < COLS - 1; c++) grid[SPAWN_P.r][c] = 0;
  return { grid: grid, cherries: cherries };
}

function makePlayer() {
  return {
    c: SPAWN_P.c, r: SPAWN_P.r,
    x: SPAWN_P.c, y: SPAWN_P.r,
    dir: 3, moving: false, mc: SPAWN_P.c, mr: SPAWN_P.r, t: 0, dur: 1,
    inv: 0, bob: 0, dig: 0
  };
}
function makeBall() {
  return {
    c: SPAWN_B.c, r: SPAWN_B.r,
    x: SPAWN_B.c, y: SPAWN_B.r,
    dir: 0, mode: 'idle', moving: false,
    mc: SPAWN_B.c, mr: SPAWN_B.r, t: 0, dur: 1,
    kills: 0, sx: 1, sy: 1, glow: 0
  };
}
function makeMon(c, r, letter) {
  return {
    c: c, r: r, x: c, y: r,
    dir: 1, moving: false, mc: c, mr: r, t: 0, dur: 1,
    state: 'ok', deadT: 0, exit: true, letter: letter || '',
    wob: rand(0, TAU)
  };
}

function loadRound() {
  var pack = parseGrid(buildMap(G.round, G.kind));
  particles.length = 0;
  pops.length = 0;
  rings.length = 0;
  G.grid = pack.grid;
  G.cherries = pack.cherries;
  G.cherryLeft = pack.cherries.length;
  G.cherryStreak = 0;
  G.cherryAge = 0;
  G.mons = [];
  G.player = makePlayer();
  G.ball = makeBall();
  G.food = null;
  G.foodWait = G.kind === 'chase' ? 8 : 11;
  G.spawnT = 0.42;
  G.alphaOn = false;
  G.transformT = 0;
  G.roundClock = 0;
  G.combo = 0;
  G.comboAge = 0;
  G.stop = 0;
}

/* ---- audio ---- */
var audio = {
  ctx: null,
  master: null,
  muted: false,
  noiseBuf: null,
  ensure: function () {
    if (!this.ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.32;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  setMuted: function (m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.32;
    btnMute.textContent = m ? '静' : '声';
    btnMute.classList.toggle('muted', m);
    btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
    try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) { /* ignore */ }
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
      var buf = this.ctx.createBuffer(1, (sr * 0.35) | 0, sr);
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
    f.Q.value = type === 'lowpass' ? 0.7 : 1.05;
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
  dig: function () {
    this.ensure();
    this.noise(0.07, 0.055, 280, 'lowpass');
    this.beep(170, 0.05, 'square', 0.03, 88);
  },
  step: function () {
    this.ensure();
    this.beep(240, 0.028, 'triangle', 0.016, 150);
  },
  cherry: function (n) {
    this.ensure();
    var f = 720 + Math.min(8, n) * 70;
    this.beep(f, 0.055, 'sine', 0.055, f * 1.55);
    this.beep(f * 1.5, 0.09, 'triangle', 0.04, f * 2.05, 0.03);
  },
  throw: function () {
    this.ensure();
    this.noise(0.12, 0.07, 900, 'bandpass');
    this.beep(420, 0.12, 'sawtooth', 0.045, 180);
  },
  bounce: function () {
    this.ensure();
    this.beep(280, 0.07, 'square', 0.05, 520);
    this.beep(520, 0.1, 'triangle', 0.04, 220, 0.04);
    this.noise(0.08, 0.05, 400, 'bandpass');
  },
  push: function () {
    this.ensure();
    this.beep(200, 0.06, 'square', 0.04, 140);
    this.noise(0.05, 0.04, 220, 'lowpass');
  },
  crush: function (combo) {
    this.ensure();
    this.noise(0.22, 0.14, 160, 'lowpass');
    this.beep(120, 0.18, 'sawtooth', 0.085, 40);
    this.beep(480 + combo * 90, 0.12, 'triangle', 0.055, 160, 0.03);
    this.beep(980 + combo * 110, 0.16, 'square', 0.042, 1480, 0.05);
  },
  food: function () {
    this.ensure();
    this.beep(620, 0.08, 'sine', 0.05, 880);
    this.beep(880, 0.12, 'triangle', 0.045, 1240, 0.05);
  },
  letter: function (i) {
    this.ensure();
    this.beep(392 + i * 80, 0.1, 'square', 0.05, 620);
    this.beep(784, 0.14, 'triangle', 0.04, 1046, 0.06);
  },
  extra: function () {
    this.ensure();
    this.beep(523, 0.09, 'square', 0.05);
    this.beep(659, 0.09, 'square', 0.05, 0, 0.08);
    this.beep(784, 0.16, 'triangle', 0.055, 1046, 0.16);
  },
  death: function () {
    this.ensure();
    this.beep(320, 0.16, 'sawtooth', 0.07, 90);
    this.beep(180, 0.28, 'square', 0.055, 50, 0.1);
    this.noise(0.2, 0.08, 220, 'lowpass');
  },
  clear: function () {
    this.ensure();
    this.beep(392, 0.1, 'square', 0.05, 523);
    this.beep(523, 0.1, 'square', 0.05, 659, 0.1);
    this.beep(784, 0.22, 'triangle', 0.06, 1046, 0.2);
  },
  win: function () {
    this.ensure();
    this.beep(392, 0.1, 'square', 0.05, 523);
    this.beep(523, 0.1, 'square', 0.05, 659, 0.09);
    this.beep(784, 0.12, 'triangle', 0.055, 988, 0.18);
    this.beep(1046, 0.28, 'triangle', 0.06, 1318, 0.3);
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
    this.beep(196, 0.22, 'sawtooth', 0.05, 80);
    this.beep(110, 0.36, 'sine', 0.055, 46, 0.08);
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
  stageEl.classList.remove('die', 'pop', 'bounce');
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
    v = rand(spd * 0.22, spd);
    particles.push({
      x: x + rand(-0.08, 0.08),
      y: y + rand(-0.08, 0.08),
      vx: Math.cos(ang) * v,
      vy: Math.sin(ang) * v - rand(0, spd * 0.22),
      r: rand(0.05, 0.14),
      life: rand(life * 0.5, life),
      max: life,
      rgb: rgb,
      g: grav == null ? 3.2 : grav
    });
  }
  capArr(particles, 420);
}
function addPop(x, y, text, rgb, scale) {
  pops.push({ x: x, y: y, text: text, rgb: rgb, life: 0.9, max: 0.9, scale: scale || 1 });
  capArr(pops, 28);
}
function addRing(x, y, rgb) {
  rings.push({ x: x, y: y, r: 0.12, life: 0.38, max: 0.38, rgb: rgb });
  capArr(rings, 12);
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
function toast(msg) {
  toastTok += 1;
  var id = toastTok;
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  setTimeout(function () {
    if (toastTok === id) toastEl.classList.add('hidden');
  }, 1100);
}

function addScore(n, x, y, rgb) {
  G.score += n;
  if (x != null) addPop(x, y, String(n), rgb || RGB.gold, G.combo > 2 ? 1.25 : 1);
  hudAdd(n);
  maybeBest();
  if (!G.extraLife && G.score >= EXTRA_LIFE) {
    G.extraLife = true;
    G.lives += 1;
    audio.extra();
    toast('加命');
    paintPips();
  }
  return n;
}

function bumpCombo() {
  G.combo += 1;
  G.comboAge = 0;
  if (G.combo >= 2) {
    comboBox.hidden = false;
    comboBox.classList.remove('hot');
    void comboBox.offsetWidth;
    comboBox.classList.add('hot');
    comboEl.textContent = '×' + G.combo;
  }
}

function maybeBest() {
  var key = G.kind === 'chase' ? 'chase' : 'orchard';
  if (G.score > G.bests[key]) {
    G.bests[key] = G.score;
    G.newBest = true;
    try { localStorage.setItem(BEST_KEY, JSON.stringify(G.bests)); } catch (e) { /* ignore */ }
  }
}
function currentBest() {
  if (G.phase === 'title') return Math.max(G.bests.orchard, G.bests.chase);
  return G.kind === 'chase' ? G.bests.chase : G.bests.orchard;
}

/* ---- path ---- */
function bfsFirst(sc, sr, tc, tr, avoidBall) {
  visN += 1;
  if (visN > 100000000) visN = 1;
  var qh = 0, qt = 0, id, nid, c, r, d, nc, nr, found = -1, b;
  id = sr * COLS + sc;
  vis[id] = visN;
  parent[id] = -1;
  bfsQ[qt++] = id;
  b = G.ball;
  while (qh < qt) {
    id = bfsQ[qh++];
    c = id % COLS;
    r = (id / COLS) | 0;
    if (c === tc && r === tr) { found = id; break; }
    for (d = 0; d < 4; d++) {
      nc = c + DIR[d].x;
      nr = r + DIR[d].y;
      if (!inB(nc, nr) || G.grid[nr][nc] !== 0) continue;
      if (avoidBall && b && b.mode === 'idle' && b.c === nc && b.r === nr) continue;
      nid = nr * COLS + nc;
      if (vis[nid] === visN) continue;
      vis[nid] = visN;
      parent[nid] = id;
      bfsQ[qt++] = nid;
    }
  }
  if (found < 0) return null;
  id = found;
  if (parent[id] < 0) return null;
  while (parent[id] >= 0 && parent[id] !== sr * COLS + sc) id = parent[id];
  return { c: id % COLS, r: (id / COLS) | 0 };
}

function idleBallAt(c, r) {
  var b = G.ball;
  return b && b.mode === 'idle' && !b.moving && b.c === c && b.r === r;
}
function ballAt(c, r) {
  var b = G.ball;
  if (!b) return false;
  if (b.moving) return (b.mc === c && b.mr === r) || (b.c === c && b.r === r && b.t < 0.5);
  return b.c === c && b.r === r;
}
function cherryAt(c, r) {
  var i, ch;
  for (i = 0; i < G.cherries.length; i++) {
    ch = G.cherries[i];
    if (!ch.taken && ch.c === c && ch.r === r) return ch;
  }
  return null;
}

/* ---- player ---- */
function wantDir() {
  var i, best = 0, d = -1;
  for (i = 0; i < 4; i++) {
    if (dirHeld[i] > best) {
      best = dirHeld[i];
      d = i;
    }
  }
  return d;
}

function canPushTo(c, r) {
  if (!inB(c, r)) return false;
  if (G.grid[r][c] !== 0) return false;
  return true;
}

function startMove(d) {
  var p = G.player;
  var nc = p.c + DIR[d].x;
  var nr = p.r + DIR[d].y;
  var dug, spd, bc, br;
  if (!playerCan(nc, nr)) return false;
  if (idleBallAt(nc, nr)) {
    bc = nc + DIR[d].x;
    br = nr + DIR[d].y;
    if (!canPushTo(bc, br)) return false;
    crushAt(bc, br, true);
    G.ball.dir = d;
    G.ball.moving = true;
    G.ball.mc = bc;
    G.ball.mr = br;
    G.ball.t = 0;
    G.ball.dur = 1 / playerSpd().tunnel;
    G.ball.sx = 1.15;
    G.ball.sy = 0.82;
    audio.push();
  } else if (ballAt(nc, nr) && G.ball.mode !== 'idle') {
    return false;
  }
  p.dir = d;
  p.moving = true;
  p.mc = nc;
  p.mr = nr;
  p.t = 0;
  dug = isDirt(nc, nr);
  if (dug) {
    G.grid[nr][nc] = 0;
    p.dig = 0.16;
    burst(nc + 0.5, nr + 0.5, 10, RGB.dirt, 3.4, 0.38, 4);
    burst(nc + 0.5, nr + 0.5, 3, RGB.orange, 2.2, 0.28, 2);
    audio.dig();
    spd = playerSpd().dig;
  } else {
    spd = playerSpd().tunnel;
    audio.step();
  }
  p.dur = 1 / spd;
  return true;
}

function tickPlayer(dt) {
  var p = G.player;
  var d, oc, or, ch;
  p.inv = Math.max(0, p.inv - dt);
  p.dig = Math.max(0, p.dig - dt);
  p.bob += dt;
  if (p.moving) {
    p.t += dt / p.dur;
    d = wantDir();
    if (d >= 0 && d === OPP[p.dir] && p.t < 0.88 && !idleBallAt(p.mc, p.mr)) {
      oc = p.c;
      or = p.r;
      p.c = p.mc;
      p.r = p.mr;
      p.mc = oc;
      p.mr = or;
      p.dir = d;
      p.t = 1 - p.t;
    }
    if (p.t >= 1) {
      p.t = 1;
      p.c = p.mc;
      p.r = p.mr;
      p.x = p.c;
      p.y = p.r;
      p.moving = false;
      ch = cherryAt(p.c, p.r);
      if (ch) collectCherry(ch);
      if (G.food && G.food.c === p.c && G.food.r === p.r) collectFood();
    } else {
      p.x = lerp(p.c, p.mc, p.t);
      p.y = lerp(p.r, p.mr, p.t);
    }
    return;
  }
  d = wantDir();
  if (d >= 0) startMove(d);
  p.x = p.c;
  p.y = p.r;
}

function collectCherry(ch) {
  var left = 0, i, pts, x, y;
  ch.taken = true;
  G.cherryLeft -= 1;
  G.cherryStreak += 1;
  G.cherryAge = 0;
  for (i = 0; i < G.cherries.length; i++) {
    if (G.cherries[i].g === ch.g && !G.cherries[i].taken) left += 1;
  }
  pts = left === 0 ? 500 : 50;
  x = ch.c + 0.5;
  y = ch.r + 0.5;
  addScore(pts, x, y, left === 0 ? RGB.gold : RGB.cherry);
  burst(x, y, left === 0 ? 22 : 12, RGB.cherry, 4.2, 0.42, 3);
  burst(x, y, 6, RGB.stem, 3.2, 0.34, 2);
  if (left === 0) {
    addRing(x, y, RGB.gold);
    screenFlash(RGB.cherry, 0.22);
  }
  audio.cherry(G.cherryStreak);
  if (!G.alphaOn && (G.cherries.length - G.cherryLeft) >= 8) G.alphaOn = true;
  if (G.cherryLeft <= 0) beginClear();
}

function collectFood() {
  var f = G.food, x, y, L;
  if (!f) return;
  x = f.c + 0.5;
  y = f.r + 0.5;
  addScore(f.score, x, y, RGB.lime);
  burst(x, y, 24, RGB.gold, 5.2, 0.5, 3);
  burst(x, y, 10, RGB.lime, 4.4, 0.4, 2);
  addRing(x, y, RGB.lime);
  audio.food();
  toast(f.name);
  G.food = null;
  L = nextLetter();
  if (L && G.resetLetters <= 0) {
    G.alphaOn = true;
    G.mons.push(makeMon(HOUSE.c + 1, HOUSE.r + 1, L));
  }
}

/* ---- ball ---- */
function crushAt(c, r, fromPush) {
  var i, m, hit = false;
  for (i = 0; i < G.mons.length; i++) {
    m = G.mons[i];
    if (m.state !== 'ok') continue;
    if (Math.round(m.x) === c && Math.round(m.y) === r) {
      crushMon(m);
      hit = true;
    } else if (hypot(m.x - c, m.y - r) < 0.55) {
      crushMon(m);
      hit = true;
    }
  }
  return hit || fromPush;
}

function crushMon(m) {
  var x, y, rgb, pts, idx;
  if (m.state !== 'ok') return;
  x = m.x + 0.5;
  y = m.y + 0.5;
  rgb = m.letter ? RGB.alpha : RGB.dino;
  m.state = 'crush';
  m.deadT = 0.28;
  bumpCombo();
  if (G.ball && G.ball.mode !== 'idle') G.ball.kills += 1;
  pts = 500 * G.combo;
  addScore(pts, x, y, rgb);
  burst(x, y, 36, rgb, 6.8, 0.58, 4);
  burst(x, y, 16, RGB.white, 6.2, 0.38, 2);
  burst(x, y, 10, RGB.gold, 5.0, 0.46, 3);
  addRing(x, y, rgb);
  addRing(x, y, RGB.gold);
  screenFlash(rgb, 0.48);
  kick(9);
  hitStop(0.07);
  punchStage('pop');
  audio.crush(G.combo);
  if (G.combo >= 3) toast('连碾 ×' + G.combo);
  if (m.letter) {
    idx = WORD.indexOf(m.letter);
    collectLetter(m.letter);
    audio.letter(idx < 0 ? 0 : idx);
  }
}

function collectLetter(L) {
  var i, all = true;
  if (!L) return;
  if (!G.got[L]) {
    G.got[L] = true;
    paintLetters(true);
    toast(L);
  }
  for (i = 0; i < 5; i++) if (!G.got[WORD.charAt(i)]) all = false;
  if (all && G.resetLetters <= 0) {
    G.lives += 1;
    audio.extra();
    toast('EXTRA 加命');
    addScore(1000, G.player.x + 0.5, G.player.y + 0.5, RGB.lime);
    screenFlash(RGB.gold, 0.4);
    hitStop(0.06);
    G.resetLetters = 1.55;
    paintPips();
  }
}

function nextLetter() {
  var i, ch;
  if (G.resetLetters > 0) return '';
  for (i = 0; i < 5; i++) {
    ch = WORD.charAt(i);
    if (!G.got[ch]) return ch;
  }
  return '';
}

function ballHitWall() {
  var b = G.ball;
  var horiz = b.dir === 0 || b.dir === 2;
  b.moving = false;
  b.sx = horiz ? 0.58 : 1.32;
  b.sy = horiz ? 1.32 : 0.58;
  burst(b.x + 0.5, b.y + 0.5, 14, RGB.ball, 4.6, 0.32, 2);
  burst(b.x + 0.5, b.y + 0.5, 6, RGB.cyan, 3.4, 0.28, 1);
  addRing(b.x + 0.5, b.y + 0.5, RGB.gold);
  audio.bounce();
  kick(4);
  punchStage('bounce');
  if (b.kills > 0 || b.mode === 'return') {
    b.mode = 'return';
  } else {
    b.mode = 'idle';
  }
}

function tryBallStep() {
  var b = G.ball;
  var nc, nr, step, p, pc, pr;
  if (b.mode === 'return') {
    p = G.player;
    pc = Math.round(p.x);
    pr = Math.round(p.y);
    if (Math.abs(b.c - pc) + Math.abs(b.r - pr) <= 1) {
      b.mode = 'idle';
      b.moving = false;
      b.glow = 0.6;
      return false;
    }
    step = bfsFirst(b.c, b.r, pc, pr, false);
    if (!step) {
      b.mode = 'idle';
      b.moving = false;
      return false;
    }
    b.dir = dirOf(step.c - b.c, step.r - b.r);
    nc = step.c;
    nr = step.r;
  } else {
    nc = b.c + DIR[b.dir].x;
    nr = b.r + DIR[b.dir].y;
  }
  if (!inB(nc, nr) || G.grid[nr][nc] !== 0) {
    ballHitWall();
    return false;
  }
  crushAt(nc, nr, false);
  b.moving = true;
  b.mc = nc;
  b.mr = nr;
  b.t = 0;
  b.dur = 1 / (b.mode === 'return' ? 16.8 : 13.6);
  if (b.dir === 0 || b.dir === 2) { b.sx = 1.22; b.sy = 0.82; }
  else { b.sx = 0.82; b.sy = 1.22; }
  return true;
}

function launchBall(d) {
  var b = G.ball;
  b.mode = 'fly';
  b.dir = d;
  b.kills = 0;
  b.glow = 1;
  audio.throw();
  burst(b.x + 0.5, b.y + 0.5, 8, RGB.gold, 3.6, 0.28, 1);
  tryBallStep();
}

function tryThrow() {
  var b = G.ball, p, pc, pr, d, adj, nd;
  if (G.phase !== 'play') return;
  if (!b || b.mode === 'fly' || b.mode === 'return') return;
  p = G.player;
  pc = p.moving && p.t > 0.5 ? p.mc : p.c;
  pr = p.moving && p.t > 0.5 ? p.mr : p.r;
  adj = -1;
  for (d = 0; d < 4; d++) {
    if (b.c === pc + DIR[d].x && b.r === pr + DIR[d].y) adj = d;
  }
  if (adj < 0) return;
  nd = (b.c === pc + DIR[p.dir].x && b.r === pr + DIR[p.dir].y) ? p.dir : adj;
  p.dir = nd;
  launchBall(nd);
}

function tickBall(dt) {
  var b = G.ball;
  var k = 1 - Math.pow(0.0003, dt);
  b.sx = lerp(b.sx, 1, k);
  b.sy = lerp(b.sy, 1, k);
  b.glow = Math.max(0, b.glow - dt * 1.6);
  if (b.moving) {
    b.t += dt / b.dur;
    if (b.mode === 'fly' || b.mode === 'return') {
      burst(b.x + 0.5, b.y + 0.5, 1, RGB.gold, 0.6, 0.18, 0);
    }
    if (b.t >= 1) {
      b.t = 1;
      b.c = b.mc;
      b.r = b.mr;
      b.x = b.c;
      b.y = b.r;
      b.moving = false;
      crushAt(b.c, b.r, false);
      if (b.mode === 'fly' || b.mode === 'return') tryBallStep();
    } else {
      b.x = lerp(b.c, b.mc, b.t);
      b.y = lerp(b.r, b.mr, b.t);
      crushAt(Math.round(b.x), Math.round(b.y), false);
    }
    return;
  }
  b.x = b.c;
  b.y = b.r;
  if (b.mode === 'fly' || b.mode === 'return') tryBallStep();
}

/* ---- monsters ---- */
function monBlocked(c, r, self) {
  var i, m;
  for (i = 0; i < G.mons.length; i++) {
    m = G.mons[i];
    if (m === self || m.state !== 'ok') continue;
    if (m.c === c && m.r === r) return true;
    if (m.moving && m.mc === c && m.mr === r) return true;
  }
  return false;
}

function startMonMove(m, nc, nr) {
  var walk;
  if (!inB(nc, nr)) return false;
  walk = G.grid[nr][nc] === 0 || (m.exit && G.grid[nr][nc] === 3);
  if (!walk) return false;
  if (monBlocked(nc, nr, m)) return false;
  if (idleBallAt(nc, nr)) return false;
  m.dir = dirOf(nc - m.c, nr - m.r);
  m.moving = true;
  m.mc = nc;
  m.mr = nr;
  m.t = 0;
  m.dur = 1 / monSpd(m);
  return true;
}

function wanderDir(m) {
  var opts = [], d, nc, nr, i;
  for (d = 0; d < 4; d++) {
    nc = m.c + DIR[d].x;
    nr = m.r + DIR[d].y;
    if (isEmpty(nc, nr) && !monBlocked(nc, nr, m) && !idleBallAt(nc, nr)) opts.push(d);
  }
  if (!opts.length) return -1;
  for (i = 0; i < opts.length; i++) if (opts[i] !== OPP[m.dir]) return opts[i];
  return opts[0];
}

function tickMon(m, dt) {
  var p, pc, pr, step, d, nc, nr;
  m.wob += dt * 7;
  if (m.state === 'crush') {
    m.deadT -= dt;
    if (m.deadT <= 0) m.state = 'gone';
    return;
  }
  if (m.state !== 'ok') return;
  if (m.moving) {
    m.t += dt / m.dur;
    if (m.t >= 1) {
      m.t = 1;
      m.c = m.mc;
      m.r = m.mr;
      m.x = m.c;
      m.y = m.r;
      m.moving = false;
      if (m.exit && G.grid[m.r][m.c] === 0 && !isHouse(m.c, m.r)) m.exit = false;
    } else {
      m.x = lerp(m.c, m.mc, m.t);
      m.y = lerp(m.r, m.mr, m.t);
    }
    return;
  }
  m.x = m.c;
  m.y = m.r;
  if (m.exit) {
    if (m.c === DOOR.c && m.r === DOOR.r) {
      m.exit = false;
    } else if (m.r < DOOR.r && (isHouse(m.c, m.r + 1) || (m.c === DOOR.c && m.r + 1 === DOOR.r))) {
      startMonMove(m, m.c, m.r + 1);
      return;
    } else {
      startMonMove(m, DOOR.c, m.r);
      return;
    }
  }
  p = G.player;
  pc = Math.round(p.x);
  pr = Math.round(p.y);
  step = bfsFirst(m.c, m.r, pc, pr, true);
  if (step) {
    startMonMove(m, step.c, step.r);
    return;
  }
  d = wanderDir(m);
  if (d >= 0) {
    nc = m.c + DIR[d].x;
    nr = m.r + DIR[d].y;
    startMonMove(m, nc, nr);
  }
}

function spawnMon() {
  var L = '', nAlpha = 0, nRed = 0, i, m;
  for (i = 0; i < G.mons.length; i++) {
    m = G.mons[i];
    if (m.state !== 'ok') continue;
    if (m.letter) nAlpha += 1;
    else nRed += 1;
  }
  if (G.alphaOn) {
    L = nextLetter();
    if (L && (nAlpha < 2 || nRed >= 2)) { /* keep letter */ }
    else L = '';
  }
  G.mons.push(makeMon(HOUSE.c + 1, HOUSE.r + 1, L));
}

function tickMons(dt) {
  var i, m, L;
  if (G.phase === 'play') {
    if (!G.alphaOn && (G.roundClock >= (G.kind === 'chase' ? 7 : 12))) G.alphaOn = true;
    if (liveMons() < maxMons()) {
      G.spawnT -= dt;
      if (G.spawnT <= 0) {
        G.spawnT = spawnDelay();
        spawnMon();
      }
    }
    if (G.alphaOn && G.resetLetters <= 0) {
      G.transformT -= dt;
      if (G.transformT <= 0 && G.roundClock > 20) {
        L = nextLetter();
        if (L) {
          for (i = 0; i < G.mons.length; i++) {
            m = G.mons[i];
            if (m.state === 'ok' && !m.letter && !m.exit) {
              m.letter = L;
              toast('字母怪 ' + L);
              audio.ui();
              G.transformT = 2.4;
              break;
            }
          }
        }
      }
    }
  }
  for (i = 0; i < G.mons.length; i++) tickMon(G.mons[i], dt);
}

function tickFood(dt) {
  var spots, r, c, i, s, spec, ok, j, m;
  if (G.food) {
    G.food.t -= dt;
    if (G.food.t <= 0) G.food = null;
    return;
  }
  G.foodWait -= dt;
  if (G.foodWait > 0) return;
  spots = [];
  for (r = 1; r < ROWS - 1; r++) {
    for (c = 1; c < COLS - 1; c++) {
      if (G.grid[r][c] !== 0) continue;
      if (c === G.player.c && r === G.player.r) continue;
      if (G.ball.c === c && G.ball.r === r) continue;
      if (cherryAt(c, r)) continue;
      if (isHouse(c, r)) continue;
      spots.push({ c: c, r: r });
    }
  }
  G.foodWait = G.kind === 'chase' ? 13 : 16;
  if (!spots.length) return;
  i = (G.round * 17 + G.foodN * 9 + spots.length) % spots.length;
  s = spots[i];
  ok = true;
  for (j = 0; j < G.mons.length; j++) {
    m = G.mons[j];
    if (m.state === 'ok' && Math.round(m.x) === s.c && Math.round(m.y) === s.r) ok = false;
  }
  if (!ok) s = spots[(i + 3) % spots.length];
  spec = FOOD[G.foodN % FOOD.length];
  G.food = { c: s.c, r: s.r, kind: spec.name, score: spec.score, t: 9.2, n: G.foodN % FOOD.length };
  G.foodN += 1;
}

function collide() {
  var p = G.player, i, m;
  if (p.inv > 0) return;
  for (i = 0; i < G.mons.length; i++) {
    m = G.mons[i];
    if (m.state !== 'ok' || m.exit) continue;
    if (hypot(p.x - m.x, p.y - m.y) < 0.54) {
      kill();
      return;
    }
  }
}

function kill() {
  var p;
  if (G.phase !== 'play') return;
  p = G.player;
  if (p.inv > 0) return;
  G.phase = 'dead';
  G.deadT = DEAD_SEC;
  G.lives -= 1;
  G.why = 'monster';
  audio.death();
  hitStop(0.072);
  kick(12);
  punchStage('die');
  screenFlash(RGB.mag, 0.5);
  burst(p.x + 0.5, p.y + 0.5, 28, RGB.mag, 6.4, 0.55, 4);
  burst(p.x + 0.5, p.y + 0.5, 12, RGB.orange, 5.2, 0.4, 2);
  paintPips();
}

function beginClear() {
  if (G.phase === 'over' || G.phase === 'win' || G.phase === 'clear' || G.phase === 'title') return;
  G.phase = 'clear';
  G.clearT = CLEAR_SEC;
  addScore(400 * G.round, G.player.x + 0.5, G.player.y + 0.5, RGB.cyan);
  audio.clear();
  toast('摘光');
  screenFlash(RGB.gold, 0.35);
}

function nextRound() {
  if (G.kind === 'orchard' && G.round >= STAGES) {
    showWin();
    return;
  }
  G.round += 1;
  loadRound();
  G.phase = 'ready';
  G.ready = READY_SEC;
  toast(G.kind === 'chase' ? ('第 ' + G.round + ' 波 · 更挤') : ('第 ' + G.round + ' 园'));
  paintHud(true);
}

function respawn() {
  G.mons = [];
  G.player = makePlayer();
  G.player.inv = INVULN;
  G.ball = makeBall();
  G.spawnT = 0.7;
  G.phase = 'play';
  G.combo = 0;
}

function tickFx(dt) {
  var i, o;
  G.shake *= Math.pow(0.02, dt);
  G.flash = Math.max(0, G.flash - dt * 2.4);
  G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0008, dt));
  for (i = particles.length - 1; i >= 0; i--) {
    o = particles[i];
    o.life -= dt;
    o.x += o.vx * dt;
    o.vy += o.g * dt;
    o.y += o.vy * dt;
    if (o.life <= 0) particles.splice(i, 1);
  }
  for (i = pops.length - 1; i >= 0; i--) {
    o = pops[i];
    o.life -= dt;
    o.y -= 0.7 * dt;
    if (o.life <= 0) pops.splice(i, 1);
  }
  for (i = rings.length - 1; i >= 0; i--) {
    o = rings[i];
    o.life -= dt;
    o.r += 6.5 * dt;
    if (o.life <= 0) rings.splice(i, 1);
  }
}

function tick(dt) {
  var i;
  G.clock += dt;
  tickFx(dt);
  if (G.stop > 0) {
    G.stop -= dt;
    if (G.stop > 0) return;
  }
  if (G.resetLetters > 0 && G.phase === 'play') {
    G.resetLetters -= dt;
    if (G.resetLetters <= 0) {
      for (i = 0; i < 5; i++) G.got[WORD.charAt(i)] = false;
      paintLetters(false);
    }
  }
  if (G.phase === 'title') {
    if (G.player) G.player.bob += dt;
    return;
  }
  if (G.phase === 'over' || G.phase === 'win') return;
  if (G.phase === 'ready') {
    G.ready -= dt;
    if (G.player) G.player.bob += dt;
    if (G.ready <= 0) G.phase = 'play';
    return;
  }
  if (G.phase === 'dead') {
    G.deadT -= dt;
    tickMons(dt * 0.35);
    tickBall(dt);
    if (G.deadT <= 0) {
      if (G.lives <= 0) showOver();
      else respawn();
    }
    return;
  }
  if (G.phase === 'clear') {
    G.clearT -= dt;
    if (G.clearT <= 0) nextRound();
    return;
  }
  if (G.phase === 'play') {
    G.roundClock += dt;
    G.cherryAge += dt;
    if (G.cherryAge > 0.7) G.cherryStreak = 0;
    tickPlayer(dt);
    tickBall(dt);
    tickMons(dt);
    tickFood(dt);
    collide();
    if (G.combo > 0 && G.ball && G.ball.mode === 'idle' && !G.ball.moving) {
      G.comboAge += dt;
      if (G.comboAge > COMBO_WIN) G.combo = 0;
    }
  }
}

/* ---- draw ---- */
function wx(x) { return view.ox + x * view.tile; }
function wy(y) { return view.oy + y * view.tile; }

function dirtRgb(r) {
  var t = r / (ROWS - 1);
  return [
    Math.round(lerp(198, 78, t)),
    Math.round(lerp(96, 28, t)),
    Math.round(lerp(38, 48, t))
  ];
}

function drawField(c, s) {
  var r, col, x, y, rgb, h, t;
  c.fillStyle = '#10060a';
  c.fillRect(wx(0), wy(0), COLS * s, ROWS * s);
  for (r = 0; r < ROWS; r++) {
    for (col = 0; col < COLS; col++) {
      x = wx(col);
      y = wy(r);
      t = G.grid[r][col];
      if (t === 2) {
        c.fillStyle = '#2a1420';
        c.fillRect(x, y, s + 0.5, s + 0.5);
        c.fillStyle = 'rgba(255, 106, 34, 0.18)';
        c.fillRect(x + 1, y + 1, s - 2, s - 2);
      } else if (t === 3) {
        c.fillStyle = '#1a0c12';
        c.fillRect(x, y, s + 0.5, s + 0.5);
      } else if (t === 1) {
        rgb = dirtRgb(r);
        c.fillStyle = rgba(rgb, 1);
        c.fillRect(x, y, s + 0.5, s + 0.5);
        h = hash(col, r);
        c.fillStyle = rgba([rgb[0] + 28, rgb[1] + 16, rgb[2] + 4], 0.32);
        c.fillRect(x + s * (0.12 + h * 0.4), y + s * (0.16 + (1 - h) * 0.32), s * 0.2, s * 0.11);
        if (h > 0.78) {
          c.fillStyle = rgba(RGB.orange, 0.22);
          c.beginPath();
          c.arc(x + s * 0.62, y + s * 0.38, s * 0.06, 0, TAU);
          c.fill();
        }
      } else {
        c.fillStyle = 'rgba(8, 4, 10, 0.94)';
        c.fillRect(x, y, s + 0.4, s + 0.4);
        c.fillStyle = 'rgba(255, 120, 40, 0.04)';
        c.fillRect(x + 1, y + 1, s - 2, s - 2);
      }
    }
  }
  c.lineWidth = Math.max(1.3, s * 0.07);
  c.strokeStyle = 'rgba(255, 140, 48, 0.5)';
  c.lineJoin = 'round';
  for (r = 1; r < ROWS - 1; r++) {
    for (col = 1; col < COLS - 1; col++) {
      if (G.grid[r][col] !== 0) continue;
      x = wx(col);
      y = wy(r);
      if (cell(col, r - 1) === 1 || cell(col, r - 1) === 2) {
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + s, y); c.stroke();
      }
      if (cell(col, r + 1) === 1 || cell(col, r + 1) === 2) {
        c.beginPath(); c.moveTo(x, y + s); c.lineTo(x + s, y + s); c.stroke();
      }
      if (cell(col - 1, r) === 1 || cell(col - 1, r) === 2) {
        c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + s); c.stroke();
      }
      if (cell(col + 1, r) === 1 || cell(col + 1, r) === 2) {
        c.beginPath(); c.moveTo(x + s, y); c.lineTo(x + s, y + s); c.stroke();
      }
    }
  }
}

function drawHouse(c, s) {
  var x = wx(HOUSE.c);
  var y = wy(HOUSE.r);
  var w = HOUSE.w * s;
  var h = HOUSE.h * s;
  var glow = 0.35 + Math.sin(G.clock * 5) * 0.12;
  c.save();
  c.fillStyle = 'rgba(0,0,0,0.35)';
  c.beginPath();
  c.ellipse(x + w * 0.5, y + h * 0.92, w * 0.42, s * 0.12, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#3a1a22';
  c.fillRect(x + s * 0.08, y + s * 0.55, w - s * 0.16, h - s * 0.5);
  c.fillStyle = rgba(RGB.orange, 0.95);
  c.beginPath();
  c.moveTo(x - s * 0.08, y + s * 0.62);
  c.lineTo(x + w * 0.5, y - s * 0.15);
  c.lineTo(x + w + s * 0.08, y + s * 0.62);
  c.closePath();
  c.fill();
  c.fillStyle = rgba(RGB.gold, 0.35);
  c.beginPath();
  c.moveTo(x + w * 0.18, y + s * 0.45);
  c.lineTo(x + w * 0.5, y + s * 0.02);
  c.lineTo(x + w * 0.52, y + s * 0.45);
  c.closePath();
  c.fill();
  c.fillStyle = rgba(RGB.cyan, 0.18 + glow * 0.25);
  c.fillRect(x + w * 0.22, y + s * 0.78, s * 0.42, s * 0.32);
  c.fillStyle = rgba(RGB.gold, 0.45 + glow * 0.4);
  c.fillRect(x + w * 0.42, y + h - s * 0.02, s * 0.55, s * 0.18);
  c.restore();
}

function drawCherries(c, s) {
  var i, ch, x, y, bob;
  for (i = 0; i < G.cherries.length; i++) {
    ch = G.cherries[i];
    if (ch.taken) continue;
    bob = Math.sin(G.clock * 5 + ch.c + ch.r) * s * 0.03;
    x = wx(ch.c + 0.5);
    y = wy(ch.r + 0.5) + bob;
    c.save();
    c.translate(x, y);
    c.strokeStyle = rgba(RGB.stem, 0.95);
    c.lineWidth = Math.max(1.2, s * 0.05);
    c.beginPath();
    c.moveTo(-s * 0.08, -s * 0.02);
    c.quadraticCurveTo(0, -s * 0.22, s * 0.02, -s * 0.28);
    c.moveTo(s * 0.1, 0);
    c.quadraticCurveTo(s * 0.04, -s * 0.2, s * 0.02, -s * 0.28);
    c.stroke();
    c.fillStyle = rgba(RGB.stem, 0.9);
    c.beginPath();
    c.ellipse(s * 0.08, -s * 0.3, s * 0.07, s * 0.04, 0.4, 0, TAU);
    c.fill();
    c.fillStyle = rgba(RGB.cherry, 1);
    c.beginPath();
    c.arc(-s * 0.1, s * 0.04, s * 0.13, 0, TAU);
    c.arc(s * 0.12, s * 0.06, s * 0.12, 0, TAU);
    c.fill();
    c.fillStyle = 'rgba(255,220,220,0.55)';
    c.beginPath();
    c.arc(-s * 0.14, -0.01, s * 0.04, 0, TAU);
    c.arc(s * 0.08, 0.01, s * 0.035, 0, TAU);
    c.fill();
    c.restore();
  }
}

function drawFood(c, s) {
  var f = G.food, x, y, bounce, n;
  if (!f) return;
  bounce = Math.sin(G.clock * 7) * s * 0.05;
  x = wx(f.c + 0.5);
  y = wy(f.r + 0.5) + bounce;
  n = f.n || 0;
  c.save();
  c.translate(x, y);
  if (n === 0) {
    c.fillStyle = rgba(RGB.cherry, 1);
    c.beginPath(); c.arc(0, s * 0.08, s * 0.1, 0, TAU); c.fill();
    c.beginPath(); c.arc(0, -s * 0.06, s * 0.09, 0, TAU); c.fill();
    c.fillStyle = rgba(RGB.gold, 1);
    c.fillRect(-s * 0.03, -s * 0.22, s * 0.06, s * 0.4);
  } else if (n === 1) {
    c.fillStyle = '#e8fbff';
    c.beginPath(); c.arc(0, s * 0.08, s * 0.16, Math.PI, TAU); c.fill();
    c.fillStyle = rgba(RGB.mag, 0.9);
    c.fillRect(-s * 0.16, s * 0.06, s * 0.32, s * 0.08);
  } else if (n === 2) {
    c.fillStyle = rgba(RGB.orange, 1);
    c.beginPath(); c.ellipse(0, 0, s * 0.16, s * 0.1, -0.4, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.fillRect(-s * 0.08, -s * 0.04, s * 0.16, s * 0.03);
  } else if (n === 3) {
    c.fillStyle = '#6b3a18';
    c.fillRect(-s * 0.16, -s * 0.02, s * 0.32, s * 0.16);
    c.fillStyle = rgba(RGB.mag, 0.85);
    c.beginPath(); c.ellipse(0, -s * 0.06, s * 0.16, s * 0.08, 0, 0, TAU); c.fill();
  } else {
    c.fillStyle = rgba(RGB.lime, 0.95);
    c.beginPath(); c.arc(0, s * 0.04, s * 0.16, 0, TAU); c.fill();
    c.fillStyle = rgba(RGB.stem, 1);
    c.fillRect(-s * 0.02, -s * 0.18, s * 0.04, s * 0.12);
  }
  c.restore();
}

function drawBall(c, s) {
  var b = G.ball, x, y, glow;
  if (!b) return;
  x = wx(b.x + 0.5);
  y = wy(b.y + 0.5);
  glow = b.mode !== 'idle' ? 0.7 : 0.25;
  c.save();
  c.translate(x, y);
  c.scale(b.sx, b.sy);
  c.fillStyle = 'rgba(0,0,0,0.3)';
  c.beginPath();
  c.ellipse(0, s * 0.22, s * 0.18, s * 0.07, 0, 0, TAU);
  c.fill();
  c.shadowColor = rgba(RGB.gold, 0.55 + glow);
  c.shadowBlur = 12 + glow * 16;
  c.fillStyle = rgba(RGB.ball, 1);
  c.beginPath();
  c.arc(0, 0, s * 0.22, 0, TAU);
  c.fill();
  c.shadowBlur = 0;
  c.fillStyle = 'rgba(255,248,210,0.85)';
  c.beginPath();
  c.ellipse(-s * 0.07, -s * 0.07, s * 0.08, s * 0.055, -0.5, 0, TAU);
  c.fill();
  c.strokeStyle = rgba(RGB.cyan, 0.35 + glow * 0.4);
  c.lineWidth = 1.4;
  c.beginPath();
  c.arc(0, 0, s * 0.22, 0, TAU);
  c.stroke();
  c.restore();
}

function drawPlayer(c, s) {
  var p = G.player, x, y, bob, face, kickL;
  if (!p) return;
  if (G.phase === 'dead' && G.deadT < 0.32) return;
  if (p.inv > 0 && Math.floor(G.clock * 16) % 2 === 0) return;
  x = wx(p.x + 0.5);
  y = wy(p.y + 0.5);
  bob = Math.sin(p.bob * (p.moving ? 16 : 5)) * s * 0.04;
  face = DIR[p.dir];
  c.save();
  c.translate(x, y + bob);
  if (G.phase === 'dead') {
    c.rotate(G.clock * 8);
    c.scale(1, 0.45 + G.deadT);
  }
  c.fillStyle = 'rgba(0,0,0,0.28)';
  c.beginPath();
  c.ellipse(0, s * 0.28, s * 0.16, s * 0.06, 0, 0, TAU);
  c.fill();
  c.fillStyle = rgba(RGB.orange, 1);
  c.beginPath();
  c.moveTo(0, -s * 0.42);
  c.lineTo(s * 0.16, -s * 0.12);
  c.lineTo(-s * 0.16, -s * 0.12);
  c.closePath();
  c.fill();
  c.fillStyle = rgba(RGB.gold, 1);
  c.beginPath();
  c.arc(0, -s * 0.44, s * 0.055, 0, TAU);
  c.fill();
  c.fillStyle = '#fff6ea';
  c.beginPath();
  c.arc(0, -s * 0.02, s * 0.16, 0, TAU);
  c.fill();
  c.fillStyle = rgba(RGB.cherry, 1);
  c.beginPath();
  c.arc(face.x * s * 0.04, s * 0.01, s * 0.045, 0, TAU);
  c.fill();
  c.strokeStyle = '#3a2030';
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(0, s * 0.04, s * 0.07, 0.2, Math.PI - 0.2);
  c.stroke();
  c.fillStyle = '#1a1428';
  c.beginPath();
  c.arc(-s * 0.05 + face.x * s * 0.03, -s * 0.05, s * 0.028, 0, TAU);
  c.arc(s * 0.06 + face.x * s * 0.03, -s * 0.05, s * 0.028, 0, TAU);
  c.fill();
  c.fillStyle = rgba(RGB.gold, 0.95);
  c.beginPath();
  c.ellipse(0, s * 0.16, s * 0.2, s * 0.07, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#e8fbff';
  c.beginPath();
  c.roundRect(-s * 0.1, s * 0.16, s * 0.2, s * 0.14, s * 0.04);
  c.fill();
  kickL = Math.sin(p.bob * (p.moving ? 18 : 0)) * s * 0.05;
  c.strokeStyle = '#d4c4a8';
  c.lineWidth = Math.max(2, s * 0.06);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-s * 0.05, s * 0.28);
  c.lineTo(-s * 0.08, s * 0.38 + kickL);
  c.moveTo(s * 0.05, s * 0.28);
  c.lineTo(s * 0.08, s * 0.38 - kickL);
  c.stroke();
  c.restore();
}

function drawMon(c, s, m) {
  var x, y, rgb, sc, a, d;
  if (m.state === 'gone') return;
  x = wx(m.x + 0.5);
  y = wy(m.y + 0.5);
  sc = m.state === 'crush' ? 1.2 + (0.28 - m.deadT) : 1;
  a = m.exit ? 0.7 : 1;
  if (m.state === 'crush') a *= Math.max(0, m.deadT / 0.28);
  rgb = m.letter ? RGB.alpha : RGB.dino;
  d = DIR[m.dir];
  c.save();
  c.translate(x, y);
  c.scale(sc * (1 + Math.sin(m.wob) * 0.05), sc * (1 - Math.sin(m.wob) * 0.04));
  c.globalAlpha = a;
  c.fillStyle = 'rgba(0,0,0,0.28)';
  c.beginPath();
  c.ellipse(0, s * 0.24, s * 0.2, s * 0.07, 0, 0, TAU);
  c.fill();
  c.fillStyle = rgba(rgb, 0.96);
  c.beginPath();
  c.ellipse(0, 0, s * 0.28, s * 0.22, 0, 0, TAU);
  c.fill();
  if (!m.letter) {
    c.beginPath();
    c.moveTo(-s * 0.12, -s * 0.16);
    c.lineTo(-s * 0.04, -s * 0.32);
    c.lineTo(s * 0.02, -s * 0.16);
    c.moveTo(s * 0.04, -s * 0.14);
    c.lineTo(s * 0.12, -s * 0.3);
    c.lineTo(s * 0.18, -s * 0.12);
    c.fill();
    c.beginPath();
    c.moveTo(d.x * s * 0.2, -s * 0.04);
    c.lineTo(d.x * s * 0.36, d.y * s * 0.02);
    c.lineTo(d.x * s * 0.2, s * 0.1);
    c.closePath();
    c.fill();
  } else {
    c.fillStyle = rgba(RGB.cyan, 0.9);
    c.beginPath();
    c.arc(0, -s * 0.28, s * 0.05, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(RGB.cyan, 0.8);
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(0, -s * 0.2);
    c.lineTo(0, -s * 0.28);
    c.stroke();
  }
  c.fillStyle = rgba(RGB.white, 0.95);
  c.beginPath();
  c.arc(-s * 0.08, -s * 0.04, s * 0.07, 0, TAU);
  c.arc(s * 0.1, -s * 0.04, s * 0.07, 0, TAU);
  c.fill();
  c.fillStyle = '#1a1428';
  c.beginPath();
  c.arc(-s * 0.06 + d.x * s * 0.03, -s * 0.03, s * 0.03, 0, TAU);
  c.arc(s * 0.12 + d.x * s * 0.03, -s * 0.03, s * 0.03, 0, TAU);
  c.fill();
  if (m.letter) {
    c.fillStyle = rgba(RGB.gold, 1);
    c.font = '800 ' + Math.round(s * 0.32) + 'px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(m.letter, 0, s * 0.08);
  }
  c.restore();
}

function drawFx(c, s) {
  var i, o, a;
  for (i = 0; i < rings.length; i++) {
    o = rings[i];
    a = o.life / o.max;
    c.strokeStyle = rgba(o.rgb, a * 0.85);
    c.lineWidth = Math.max(1.5, s * 0.06 * a);
    c.beginPath();
    c.arc(wx(o.x), wy(o.y), o.r * s, 0, TAU);
    c.stroke();
  }
  for (i = 0; i < particles.length; i++) {
    o = particles[i];
    a = o.life / o.max;
    c.fillStyle = rgba(o.rgb, a);
    c.beginPath();
    c.arc(wx(o.x), wy(o.y), o.r * s * (0.6 + a * 0.6), 0, TAU);
    c.fill();
  }
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  for (i = 0; i < pops.length; i++) {
    o = pops[i];
    a = o.life / o.max;
    c.save();
    c.globalAlpha = Math.min(1, a * 1.4);
    c.font = '800 ' + Math.round(s * 0.42 * o.scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    c.fillStyle = rgba(o.rgb, 1);
    c.shadowColor = rgba(o.rgb, 0.7);
    c.shadowBlur = 12;
    c.fillText(o.text, wx(o.x), wy(o.y));
    c.restore();
  }
}

function drawBanner(c, s) {
  var msg = '';
  if (G.phase === 'ready') msg = '预备';
  else if (G.phase === 'clear') msg = G.kind === 'orchard' && G.round >= STAGES ? '收成' : '下一园';
  else if (G.phase === 'dead' && G.lives > 0) msg = '被追上';
  if (!msg) return;
  c.save();
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = '800 ' + Math.round(s * 1.15) + 'px "Segoe UI", "PingFang SC", sans-serif';
  c.fillStyle = '#ffe36b';
  c.shadowColor = 'rgba(255, 227, 107, 0.7)';
  c.shadowBlur = 16;
  c.fillText(msg, wx(COLS / 2), wy(ROWS / 2));
  c.restore();
}

function render() {
  var dpr = view.dpr;
  var s = view.tile;
  var w = view.w;
  var h = view.h;
  var shx = 0, shy = 0, i;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#05030c';
  ctx.fillRect(0, 0, w, h);
  if (G.shake > 0.4 && !reduceMotion()) {
    shx = (Math.random() - 0.5) * G.shake;
    shy = (Math.random() - 0.5) * G.shake * 0.8;
  }
  ctx.save();
  ctx.translate(shx, shy);
  if (G.punch !== 1 && !reduceMotion()) {
    ctx.translate(w * 0.5, h * 0.5);
    ctx.scale(G.punch, G.punch);
    ctx.translate(-w * 0.5, -h * 0.5);
  }
  if (G.grid.length) {
    drawField(ctx, s);
    drawHouse(ctx, s);
    drawCherries(ctx, s);
    drawFood(ctx, s);
    for (i = 0; i < G.mons.length; i++) drawMon(ctx, s, G.mons[i]);
    drawBall(ctx, s);
    drawPlayer(ctx, s);
    drawFx(ctx, s);
  }
  if (G.flash > 0) {
    ctx.fillStyle = rgba(G.flashRgb, G.flash);
    ctx.fillRect(wx(-0.2), wy(-0.2), (COLS + 0.4) * s, (ROWS + 0.4) * s);
  }
  if (G.phase !== 'title') drawBanner(ctx, s);
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
  for (i = 0; i < LIVES; i++) html += '<i class="pip ' + (i < G.lives ? 'on' : 'gone') + '"></i>';
  if (G.lives > LIVES) {
    for (i = LIVES; i < G.lives; i++) html += '<i class="pip on"></i>';
  }
  pipsEl.innerHTML = html;
}

function paintLetters(flash) {
  var nodes = lettersEl.children;
  var i, on;
  for (i = 0; i < 5; i++) {
    on = !!G.got[WORD.charAt(i)];
    nodes[i].classList.toggle('on', on);
    if (flash && on) {
      nodes[i].classList.remove('flash');
      void nodes[i].offsetWidth;
      nodes[i].classList.add('flash');
    }
  }
}

function paintHud(force) {
  var b;
  if (force || hud.score !== G.score) {
    hud.score = G.score;
    scoreEl.textContent = String(G.score);
  }
  b = currentBest();
  if (force || hud.best !== b) {
    hud.best = b;
    bestEl.textContent = String(b);
  }
  if (force || hud.round !== G.round || hud.kind !== G.kind) {
    hud.round = G.round;
    hud.kind = G.kind;
    roundEm.textContent = G.kind === 'chase' ? '波' : '关';
    roundEl.textContent = G.kind === 'chase' ? String(G.round) : (G.round + '/' + STAGES);
  }
  if (force || hud.combo !== G.combo) {
    hud.combo = G.combo;
    comboEl.textContent = '×' + Math.max(1, G.combo);
    comboBox.hidden = G.combo < 2 || G.phase === 'title';
  }
  if (force || hud.lives !== G.lives) {
    hud.lives = G.lives;
    paintPips();
  }
  modeLabel.textContent = G.kind === 'chase' ? '追击' : '果园';
  modeLabel.classList.toggle('hunt', G.kind === 'chase');
}

function showTitle() {
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  panel.className = 'panel';
  ovKicker.textContent = 'DO';
  ovTitle.textContent = '推球';
  ovLead.textContent = '挖开果园，推魔力球碾怪。收光樱桃过关。字母怪凑齐 EXTRA 加一条命。';
  ovOps.textContent = '方向键或 WASD 走挖 · 空格扔球 · 触屏滑向 + 扔 · R 重开 · M 静音';
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
}

function showOver() {
  G.phase = 'over';
  audio.over();
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  panel.className = 'panel lose';
  ovKicker.textContent = 'DO';
  ovTitle.textContent = '被追上了';
  ovLead.textContent = '本局 ' + G.score + (G.newBest ? ' · 新纪录' : '') +
    (G.kind === 'chase' ? (' · 第 ' + G.round + ' 波') : (' · 第 ' + G.round + ' 园'));
  ovOps.textContent = 'R 重开 · 再来同模式';
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
}

function showWin() {
  G.phase = 'win';
  audio.win();
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  panel.className = 'panel win';
  ovKicker.textContent = 'DO';
  ovTitle.textContent = '果园收成';
  ovLead.textContent = '八园摘光 · ' + G.score + (G.newBest ? ' · 新纪录' : '');
  ovOps.textContent = 'R 重开 · 再来果园';
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
}

function hideOverlay() {
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
}

function startGame(kind) {
  var i;
  G.kind = kind || 'orchard';
  G.round = 1;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  G.extraLife = false;
  G.newBest = false;
  G.why = '';
  G.foodN = 0;
  G.resetLetters = 0;
  for (i = 0; i < 5; i++) G.got[WORD.charAt(i)] = false;
  loadRound();
  G.phase = 'ready';
  G.ready = READY_SEC;
  hideOverlay();
  audio.start();
  hintEl.textContent = G.kind === 'chase'
    ? '追击怪更多更快 · 空格扔球碾碎 · R 重开 · M 静音'
    : '挖隧道 · 空格把魔力球沿路扔出去碾怪 · 收光樱桃';
  paintLetters(false);
  paintHud(true);
  canvas.focus();
}

function restart() {
  audio.ui();
  if (G.phase === 'title') {
    startGame('orchard');
    return;
  }
  startGame(G.kind);
}

function backToModes() {
  audio.ui();
  G.round = 1;
  G.kind = 'orchard';
  G.score = 0;
  G.lives = LIVES;
  G.combo = 0;
  loadRound();
  G.phase = 'title';
  G.player = makePlayer();
  showTitle();
  paintHud(true);
}

/* ---- input ---- */
function pressDir(d) {
  dirStamp += 1;
  dirHeld[d] = dirStamp;
}
function releaseDir(d) { dirHeld[d] = 0; }

function onKeyDown(e) {
  var d = KEY_DIR[e.code];
  audio.ensure();
  if (e.code === 'KeyR') {
    e.preventDefault();
    if (!e.repeat) restart();
    return;
  }
  if (e.code === 'KeyM') {
    e.preventDefault();
    if (!e.repeat) audio.setMuted(!audio.muted);
    return;
  }
  if (d != null) {
    e.preventDefault();
    pressDir(d);
    return;
  }
  if (e.code === 'Space') {
    e.preventDefault();
    if (e.repeat) return;
    if (G.phase === 'title') {
      startGame('orchard');
      return;
    }
    if (G.phase === 'over' || G.phase === 'win') {
      startGame(G.kind);
      return;
    }
    tryThrow();
    return;
  }
  if (e.code === 'Enter' || e.code === 'Digit1' || e.code === 'Numpad1') {
    if (e.repeat) return;
    if (G.phase === 'title') {
      e.preventDefault();
      startGame('orchard');
    } else if (G.phase === 'over' || G.phase === 'win') {
      e.preventDefault();
      startGame(G.kind);
    }
  }
  if ((e.code === 'Digit2' || e.code === 'Numpad2') && G.phase === 'title') {
    e.preventDefault();
    if (!e.repeat) startGame('chase');
  }
}

function onKeyUp(e) {
  var d = KEY_DIR[e.code];
  if (d != null) releaseDir(d);
}

function bindPad(btn, d, isThrow) {
  function down(ev) {
    ev.preventDefault();
    audio.ensure();
    btn.classList.add('held');
    if (isThrow) tryThrow();
    else {
      pressDir(d);
      padHeld[d] = true;
    }
  }
  function up(ev) {
    ev.preventDefault();
    btn.classList.remove('held');
    if (!isThrow) {
      releaseDir(d);
      padHeld[d] = false;
    }
  }
  btn.addEventListener('pointerdown', down);
  btn.addEventListener('pointerup', up);
  btn.addEventListener('pointerleave', up);
  btn.addEventListener('pointercancel', up);
}

function swipeDir(dx, dy) {
  if (Math.abs(dx) < SWIPE_MIN && Math.abs(dy) < SWIPE_MIN) return -1;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 0 : 2;
  return dy > 0 ? 1 : 3;
}

function onPointerDown(e) {
  audio.ensure();
  swipe.on = true;
  swipe.id = e.pointerId;
  swipe.x = e.clientX;
  swipe.y = e.clientY;
  swipe.moved = false;
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
}

function onPointerMove(e) {
  var d;
  if (!swipe.on || e.pointerId !== swipe.id) return;
  d = swipeDir(e.clientX - swipe.x, e.clientY - swipe.y);
  if (d >= 0) {
    swipe.moved = true;
    pressDir(d);
    swipe.x = e.clientX;
    swipe.y = e.clientY;
  }
}

function onPointerUp(e) {
  var i;
  if (e.pointerId !== swipe.id) return;
  swipe.on = false;
  if (!swipe.moved) {
    if (G.phase === 'title') startGame('orchard');
    else if (G.phase === 'over' || G.phase === 'win') startGame(G.kind);
    else tryThrow();
  } else {
    for (i = 0; i < 4; i++) {
      if (!padHeld[i]) dirHeld[i] = 0;
    }
  }
}

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
  paintHud(false);
  requestAnimationFrame(frame);
}

function loadBest() {
  try {
    var r = JSON.parse(localStorage.getItem(BEST_KEY) || '{}');
    if (typeof r === 'number') return { orchard: r, chase: 0 };
    return { orchard: r.orchard | 0, chase: r.chase | 0 };
  } catch (e) {
    return { orchard: 0, chase: 0 };
  }
}
function loadMute() {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { return false; }
}

function bind() {
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnRetry.addEventListener('click', restart);
  btnGarden.addEventListener('click', function () { startGame('orchard'); });
  btnHunt.addEventListener('click', function () { startGame('chase'); });
  ovRetry.addEventListener('click', function () { startGame(G.kind); });
  ovModes.addEventListener('click', backToModes);
  bindPad(document.getElementById('btn-right'), 0, false);
  bindPad(document.getElementById('btn-down'), 1, false);
  bindPad(document.getElementById('btn-left'), 2, false);
  bindPad(document.getElementById('btn-up'), 3, false);
  bindPad(document.getElementById('btn-throw'), 0, true);
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas.parentElement);
  document.addEventListener('visibilitychange', function () {
    lastTs = 0;
  });
}

function boot() {
  var pack, i, g, n;
  if (typeof ctx.roundRect !== 'function') {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, rad) {
      var rr = Math.min(rad, w / 2, h / 2);
      this.moveTo(x + rr, y);
      this.arcTo(x + w, y, x + w, y + h, rr);
      this.arcTo(x + w, y + h, x, y + h, rr);
      this.arcTo(x, y + h, x, y, rr);
      this.arcTo(x, y, x + w, y, rr);
      this.closePath();
      return this;
    };
  }
  for (i = 0; i < STAGES; i++) {
    g = buildMap(i + 1, 'orchard');
    if (g.length !== ROWS) throw new Error('map rows ' + i);
    if (g[0].length !== COLS) throw new Error('map cols ' + i);
    pack = parseGrid(g);
    n = pack.cherries.length;
    if (n !== 40) throw new Error('cherries ' + i + ' ' + n);
  }
  G.bests = loadBest();
  audio.setMuted(loadMute());
  loadRound();
  G.phase = 'title';
  G.player = makePlayer();
  showTitle();
  paintLetters(false);
  paintHud(true);
  resize();
  bind();
  requestAnimationFrame(frame);
}

boot();
