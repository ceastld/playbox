'use strict';

/* 矿掘 — Dig Dug remake. No CDN. Hue 48. Pumping is the juice. */

var COLS = 13;
var ROWS = 15;
var LIVES = 3;
var HOSE_MAX = 4;
var PUMP_RATE = 0.68;
var DEFLATE = 0.46;
var READY_SEC = 1.12;
var DEAD_SEC = 0.98;
var CLEAR_SEC = 1.42;
var INVULN = 1.28;
var COMBO_WIN = 2.75;
var EXTRA_LIFE = 12000;
var ROOMS_MAX = 8;
var SWIPE_MIN = 22;
var TAU = Math.PI * 2;
var BEST_KEY = 'playbox-lode-dig-best';
var MUTE_KEY = 'playbox-lode-dig-mute';
var AUTO_SPEED_KEY = 'playbox-lode-dig-auto-speed';
var SPEED_LABELS = ['', '慢', '中', '快', '极快'];
var AUTO_SCALE = [1, 0.52, 0.78, 1, 3.4];
var STEP = 1 / 60;

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
  ArrowLeft: 2,
  ArrowUp: 3, KeyW: 3
};

var RGB = {
  gold: [255, 227, 107],
  cyan: [0, 240, 255],
  mag: [255, 61, 184],
  lime: [61, 255, 136],
  fire: [255, 120, 40],
  dirt: [168, 106, 24],
  pooka: [255, 72, 168],
  fygar: [72, 230, 110],
  rock: [168, 184, 210],
  white: [255, 250, 230]
};

var ROOMS = [
  [
    '.............',
    '######.######',
    '##.........##',
    '##.##O.O##.##',
    '##.##...##.##',
    '##.#######.##',
    '#..P#...#P..#',
    '#.###.#.###.#',
    '#.....#.....#',
    '####.....##.#',
    '#....O......#',
    '#.#########.#',
    '#...........#',
    '#############',
    '#...........#'
  ],
  [
    '.............',
    '######.######',
    '#...........#',
    '#.#########.#',
    '#.#.......#.#',
    '#.#.##O##.#.#',
    '#P#.......#F#',
    '#.#.#####.#.#',
    '#.#.......#.#',
    '#.###.#.###.#',
    '#.....#.....#',
    '#O#########O#',
    '#.....#.....#',
    '#####.#.#####',
    '#...........#'
  ],
  [
    '.............',
    '######.######',
    '##.#.....#.##',
    '##.#.#O#.#.##',
    '##.#.#.#.#.##',
    '#..#.#.#.#..#',
    '#P##...#.##P#',
    '#....#.#....#',
    '####.#.#.####',
    '#....#.#....#',
    '#.##O#.#O##.#',
    '#.##.#.#.##.#',
    '#P...#.#...#.',
    '######.######',
    '.............'
  ],
  [
    '.............',
    '######.######',
    '#...........#',
    '#O#########O#',
    '#...........#',
    '#####.#.#####',
    'F.....#.....F',
    '#####.#.#####',
    '#...........#',
    '#.#########.#',
    '#....P......#',
    '#O#########O#',
    '#...........#',
    '#############',
    '#...........#'
  ],
  [
    '.............',
    '###...#...###',
    '#...#.#.#...#',
    '#.###O#O###.#',
    '#.#.......#.#',
    '#.#.#####.#.#',
    '#P#..#.#..#P#',
    '###.#.#.#.###',
    '#...#.#.#...#',
    '#.###.#.###.#',
    '#F....#....F#',
    '#.###O#O###.#',
    '#...........#',
    '#.#########.#',
    '#...........#'
  ],
  [
    '.............',
    '######.######',
    '#....#.#....#',
    '#.##.#.#.##.#',
    '#.#O.#.#.O#.#',
    '#.#..#.#..#.#',
    'P.#.##.##.#.F',
    '#.#.......#.#',
    '#.###.#.###.#',
    '#.....#.....#',
    '##O##.#.##O##',
    '#.....#.....#',
    '#F###.#.###P#',
    '#.....#.....#',
    '######.######'
  ],
  [
    '.............',
    '#.....#.....#',
    '#.#O#.#.#O#.#',
    '#.#.#.#.#.#.#',
    '#.#.#P#P#.#.#',
    '#.#.#####.#.#',
    '#.#.......#.#',
    '#O##.#.#.##O#',
    '#....#.#....#',
    '####.#.#.####',
    '#F...#.#...F#',
    '#.###O#O###.#',
    '#.....#.....#',
    '#O#########O#',
    '#.....#.....#'
  ],
  [
    '.............',
    '######.######',
    '#F....#....F#',
    '#.###.#.###.#',
    '#.#...#...#.#',
    '#.#.#O#O#.#.#',
    '#P#.#.#.#.#P#',
    '#.#.#.#.#.#.#',
    '#.#.......#.#',
    '#.###.#.###.#',
    '#.....#.....#',
    '#O###.#.###O#',
    '#F....#....F#',
    '#############',
    '#...........#'
  ]
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
var btnRooms = document.getElementById('btn-rooms');
var btnEndless = document.getElementById('btn-endless');
var ovRetry = document.getElementById('ov-retry');
var ovModes = document.getElementById('ov-modes');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnAuto = document.getElementById('btn-auto');
var speedEl = document.getElementById('speed');
var speedLab = document.getElementById('speed-lab');
var scoreEl = document.getElementById('score');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var bestEl = document.getElementById('best');
var roundEl = document.getElementById('round');
var roundEm = document.getElementById('round-em');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var modeLabel = document.getElementById('mode-label');
var pumpWrap = document.getElementById('pump-wrap');
var pumpBar = document.getElementById('pump-bar');
var pipsEl = document.getElementById('pips');
var toastEl = document.getElementById('toast');
var hintEl = document.getElementById('hint');
var stageEl = document.getElementById('stage');
var padEl = document.getElementById('pad');
var motionQ = window.matchMedia('(prefers-reduced-motion: reduce)');

var view = { w: 1, h: 1, dpr: 1, tile: 16, ox: 0, oy: 0 };
var particles = [];
var pops = [];
var rings = [];
var lastTs = 0;
var acc = 0;
var toastTok = 0;
var dirStamp = 0;
var dirHeld = [0, 0, 0, 0];
var pumpHeld = false;
var padHeld = { 0: false, 1: false, 2: false, 3: false, pump: false };
var swipe = { on: false, id: 0, x: 0, y: 0, moved: false };
var hud = { score: -1, best: -1, round: -1, combo: -1, lives: -1, pump: -1 };
var autoOn = false;
var autoSpeed = 3;
var autoMon = null;
var autoHold = -1;
var autoHoldUntil = 0;
var autoIdle = 0;
var autoLastC = -1;
var autoLastR = -1;

var G = {
  phase: 'title',
  kind: 'rooms',
  round: 1,
  lives: LIVES,
  score: 0,
  bests: { rooms: 0, endless: 0 },
  combo: 0,
  comboAge: 0,
  extra: false,
  newBest: false,
  dirt: [],
  mons: [],
  rocks: [],
  veg: null,
  rocksDropped: 0,
  player: null,
  ready: 0,
  deadT: 0,
  clearT: 0,
  clock: 0,
  stop: 0,
  shake: 0,
  flash: 0,
  flashRgb: RGB.gold,
  punch: 1,
  why: '',
  hose: 0,
  pulse: 0,
  rumble: 0
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

function isDirt(c, r) {
  if (!inB(c, r)) return false;
  return G.dirt[r][c] === 1;
}

function settledRockAt(c, r) {
  var i, k;
  for (i = 0; i < G.rocks.length; i++) {
    k = G.rocks[i];
    if (k.state === 'dead' || k.state === 'fall') continue;
    if (k.c === c && k.r === r) return k;
  }
  return null;
}

function rockBlocks(c, r) {
  var i, k;
  for (i = 0; i < G.rocks.length; i++) {
    k = G.rocks[i];
    if (k.state === 'dead') continue;
    if (k.c !== c) continue;
    if (k.state === 'fall') {
      if (Math.abs(k.y - r) < 0.7) return k;
    } else if (k.r === r) return k;
  }
  return null;
}

function playerCan(c, r) {
  if (!inB(c, r)) return false;
  if (rockBlocks(c, r)) return false;
  return true;
}

function monWalk(c, r, ghost) {
  if (!inB(c, r)) return false;
  if (rockBlocks(c, r)) return false;
  if (ghost) return true;
  return G.dirt[r][c] === 0;
}

function clearLine(c0, r0, c1, r1) {
  var dc = c1 - c0;
  var dr = r1 - r0;
  var n, i, c, r;
  if (dc !== 0 && dr !== 0) return false;
  n = Math.max(Math.abs(dc), Math.abs(dr));
  if (n <= 0) return true;
  dc = dc === 0 ? 0 : dc > 0 ? 1 : -1;
  dr = dr === 0 ? 0 : dr > 0 ? 1 : -1;
  for (i = 1; i <= n; i++) {
    c = c0 + dc * i;
    r = r0 + dr * i;
    if (isDirt(c, r) || rockBlocks(c, r)) return false;
  }
  return true;
}

function depthMul(r) {
  if (r >= 12) return 4;
  if (r >= 8) return 3;
  if (r >= 4) return 2;
  return 1;
}

function playerSpd() {
  var m = G.kind === 'endless' ? 1 + Math.max(0, G.round - 1) * 0.03 : 1;
  return { tunnel: 6.15 * m, dig: 3.35 * m };
}

function monSpd(m) {
  var base = (G.kind === 'endless' ? 2.28 : 2.12) + (G.round - 1) * (G.kind === 'endless' ? 0.2 : 0.14);
  if (base > 5.4) base = 5.4;
  if (m.ghost) base *= 0.72;
  if (m.flee) base *= 1.32;
  return base;
}

function ghostDelay() {
  var d = (G.kind === 'endless' ? 3.6 : 4.3) - (G.round - 1) * 0.28;
  return d < 1.4 ? 1.4 : d;
}

function liveMons() {
  var n = 0, i;
  for (i = 0; i < G.mons.length; i++) if (G.mons[i].state === 'ok') n++;
  return n;
}

function lastMon() {
  var i, found = null;
  for (i = 0; i < G.mons.length; i++) {
    if (G.mons[i].state === 'ok') {
      if (found) return null;
      found = G.mons[i];
    }
  }
  return found;
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
    this.noise(0.07, 0.055, 320, 'lowpass');
    this.beep(180, 0.05, 'square', 0.03, 90);
  },
  step: function () {
    this.ensure();
    this.beep(210, 0.03, 'triangle', 0.018, 140);
  },
  pump: function (fill) {
    this.ensure();
    var f = 190 + fill * 480;
    this.beep(f, 0.07, 'square', 0.055, f * 1.45);
    this.beep(f * 0.5, 0.08, 'sawtooth', 0.028, f * 0.32);
  },
  pop: function (combo) {
    this.ensure();
    this.noise(0.2, 0.14, 380, 'lowpass');
    this.beep(160, 0.16, 'sawtooth', 0.09, 48);
    this.beep(640 + combo * 80, 0.14, 'triangle', 0.06, 1200 + combo * 120, 0.03);
    this.beep(1180 + combo * 90, 0.18, 'square', 0.045, 1680, 0.06);
  },
  fire: function () {
    this.ensure();
    this.noise(0.28, 0.08, 700, 'bandpass');
    this.beep(240, 0.2, 'sawtooth', 0.035, 90);
  },
  rumble: function () {
    this.ensure();
    this.noise(0.22, 0.1, 90, 'lowpass');
    this.beep(70, 0.18, 'sine', 0.05, 42);
  },
  land: function () {
    this.ensure();
    this.noise(0.12, 0.09, 180, 'lowpass');
    this.beep(90, 0.1, 'square', 0.04, 50);
  },
  crush: function () {
    this.ensure();
    this.noise(0.24, 0.14, 140, 'lowpass');
    this.beep(110, 0.2, 'sawtooth', 0.08, 36);
    this.beep(520, 0.12, 'triangle', 0.05, 180, 0.04);
  },
  death: function () {
    this.ensure();
    this.beep(320, 0.16, 'sawtooth', 0.07, 90);
    this.beep(180, 0.28, 'square', 0.055, 50, 0.1);
    this.noise(0.2, 0.08, 220, 'lowpass');
  },
  veg: function () {
    this.ensure();
    this.beep(620, 0.08, 'sine', 0.05, 880);
    this.beep(880, 0.12, 'triangle', 0.045, 1240, 0.05);
  },
  extra: function () {
    this.ensure();
    this.beep(523, 0.09, 'square', 0.05);
    this.beep(659, 0.09, 'square', 0.05, 0, 0.08);
    this.beep(784, 0.16, 'triangle', 0.055, 1046, 0.16);
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
  stageEl.classList.remove('die', 'pop', 'rumble');
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
  var mul = Math.max(1, G.combo);
  var v = n * mul;
  G.score += v;
  if (x != null) addPop(x, y, String(v), rgb || RGB.gold, mul > 2 ? 1.25 : 1);
  hudAdd(v);
  maybeBest();
  if (!G.extra && G.score >= EXTRA_LIFE) {
    G.extra = true;
    G.lives += 1;
    audio.extra();
    toast('加命');
    paintPips();
  }
  return v;
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
  var key = G.kind === 'endless' ? 'endless' : 'rooms';
  if (G.score > G.bests[key]) {
    G.bests[key] = G.score;
    G.newBest = true;
    try { localStorage.setItem(BEST_KEY, JSON.stringify(G.bests)); } catch (e) { /* ignore */ }
  }
}

function currentBest() {
  if (G.phase === 'title') return Math.max(G.bests.rooms, G.bests.endless);
  return G.kind === 'endless' ? G.bests.endless : G.bests.rooms;
}

/* ---- entities ---- */
function makePlayer() {
  return {
    c: 6, r: 0, x: 6, y: 0,
    dir: 1, moving: false, mc: 6, mr: 0, t: 0, dur: 1,
    inv: 0, bob: 0, dig: 0
  };
}

function makeMon(kind, c, r) {
  return {
    kind: kind,
    c: c, r: r, x: c, y: r,
    dir: c > 6 ? 2 : 0,
    moving: false, mc: c, mr: r, t: 0, dur: 1,
    ghost: false, ghostT: 0, huntT: 0,
    fill: 0, fire: 0, fireCd: rand(0.6, 1.8),
    state: 'ok', deadT: 0, flee: false, wob: rand(0, TAU)
  };
}

function makeRock(c, r) {
  return { c: c, r: r, y: r, vy: 0, state: 'idle', wob: 0, chain: 0 };
}

function makeVeg(c, r) {
  return { c: c, r: r, t: 8.4, score: 400 * G.round };
}

/* ---- levels ---- */
function emptyDirt() {
  var r, c, row, grid = [];
  for (r = 0; r < ROWS; r++) {
    row = [];
    for (c = 0; c < COLS; c++) row.push(r === 0 ? 0 : 1);
    grid.push(row);
  }
  return grid;
}

function parseLines(lines) {
  var dirt = emptyDirt();
  var rocks = [];
  var mons = [];
  var r, c, ch;
  for (r = 0; r < ROWS; r++) {
    for (c = 0; c < COLS; c++) {
      ch = lines[r].charAt(c);
      if (r === 0) {
        dirt[r][c] = 0;
        continue;
      }
      if (ch === '#') dirt[r][c] = 1;
      else dirt[r][c] = 0;
      if (ch === 'O') rocks.push(makeRock(c, r));
      if (ch === 'P') mons.push(makeMon('pooka', c, r));
      if (ch === 'F') mons.push(makeMon('fygar', c, r));
    }
  }
  dirt[0][6] = 0;
  return { dirt: dirt, rocks: rocks, mons: mons };
}

function setChar(g, c, r, ch) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
  var row = g[r];
  g[r] = row.slice(0, c) + ch + row.slice(c + 1);
}

function makeEndless(round) {
  var g = [];
  var r, c, i, k, rr, c0, len, vc, vr, nTun, nMon, nFy, nRock;
  var spots, idx, ch, lines;
  for (r = 0; r < ROWS; r++) {
    g[r] = r === 0 ? '.............' : '#############';
  }
  setChar(g, 6, 1, '.');
  setChar(g, 6, 2, '.');
  nTun = 4 + (round % 3);
  for (i = 0; i < nTun; i++) {
    rr = 3 + ((i * 2 + round * 3) % (ROWS - 5));
    c0 = 1 + ((i * 3 + round) % 5);
    len = 5 + ((i + round) % 6);
    for (k = 0; k < len && c0 + k < COLS - 1; k++) setChar(g, c0 + k, rr, '.');
    vc = clamp(c0 + (len >> 1), 1, COLS - 2);
    for (vr = 2; vr <= rr; vr++) {
      if (vr === rr || hash(vc, vr + round) > 0.35) setChar(g, vc, vr, '.');
    }
  }
  for (i = 0; i < 2 + (round % 3); i++) {
    c = 1 + ((i * 5 + round * 2) % (COLS - 2));
    for (r = 2; r < 6 + (i % 4); r++) setChar(g, c, r, '.');
  }
  spots = [];
  for (r = 2; r < ROWS - 1; r++) {
    for (c = 1; c < COLS - 1; c++) {
      if (g[r].charAt(c) === '.') spots.push({ c: c, r: r, empty: true });
      else if (r > 2 && r < ROWS - 2) spots.push({ c: c, r: r, empty: false });
    }
  }
  nRock = Math.min(2 + (round >> 1), 6);
  nMon = Math.min(2 + round, 7);
  nFy = Math.min((round + 1) >> 1, 4);
  if (spots.length) {
    for (i = 0; i < nRock; i++) {
      idx = (i * 17 + round * 9) % spots.length;
      for (k = 0; k < spots.length; k++) {
        var s = spots[(idx + k) % spots.length];
        if (!s.empty && g[s.r].charAt(s.c) === '#') {
          setChar(g, s.c, s.r, 'O');
          break;
        }
      }
    }
  }
  var placed = 0;
  if (spots.length) {
    for (i = 0; i < nMon; i++) {
      ch = i < nFy ? 'F' : 'P';
      idx = (i * 11 + round * 5 + 3) % spots.length;
      for (k = 0; k < spots.length; k++) {
        var p = spots[(idx + k) % spots.length];
        if (p.empty && hypot(p.c - 6, p.r) > 4 && (g[p.r].charAt(p.c) === '.')) {
          setChar(g, p.c, p.r, ch);
          placed += 1;
          break;
        }
      }
    }
  }
  if (placed < 2) {
    setChar(g, 2, 8, 'P');
    setChar(g, 10, 8, nFy > 0 ? 'F' : 'P');
  }
  lines = g;
  return parseLines(lines);
}

function loadRound() {
  var pack, last;
  particles.length = 0;
  pops.length = 0;
  rings.length = 0;
  if (G.kind === 'rooms') pack = parseLines(ROOMS[(G.round - 1) % ROOMS_MAX]);
  else pack = makeEndless(G.round);
  G.dirt = pack.dirt;
  G.rocks = pack.rocks;
  G.mons = pack.mons;
  G.veg = null;
  G.rocksDropped = 0;
  G.player = makePlayer();
  G.hose = 0;
  G.pulse = 0;
  G.rumble = 0;
  last = lastMon();
  if (last) last.flee = liveMons() === 1;
  autoMon = null;
  autoIdle = 0;
  autoHold = -1;
}

/* ---- player / pump ---- */
function occ() {
  var p = G.player;
  if (p.moving && p.t > 0.55) return { c: p.mc, r: p.mr };
  return { c: p.c, r: p.r };
}

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

function startMove(d) {
  var p = G.player;
  var nc = p.c + DIR[d].x;
  var nr = p.r + DIR[d].y;
  var spd, dug;
  if (!playerCan(nc, nr)) return false;
  p.dir = d;
  p.moving = true;
  p.mc = nc;
  p.mr = nr;
  p.t = 0;
  dug = isDirt(nc, nr);
  if (dug) {
    G.dirt[nr][nc] = 0;
    p.dig = 0.16;
    burst(nc + 0.5, nr + 0.5, 10, RGB.dirt, 3.4, 0.38, 4);
    burst(nc + 0.5, nr + 0.5, 4, RGB.gold, 2.2, 0.28, 2);
    audio.dig();
    spd = playerSpd().dig;
  } else {
    spd = playerSpd().tunnel;
    if (nr > 0) audio.step();
  }
  p.dur = 1 / spd;
  return true;
}

function tickPlayer(dt) {
  var p = G.player;
  var d, oc, or;
  p.inv = Math.max(0, p.inv - dt);
  p.dig = Math.max(0, p.dig - dt);
  p.bob += dt;
  if (p.moving) {
    p.t += dt / p.dur;
    d = wantDir();
    if (!pumpHeld && G.hose < 0.08 && d >= 0 && d === OPP[p.dir] && p.t < 0.88) {
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
    } else {
      p.x = lerp(p.c, p.mc, p.t);
      p.y = lerp(p.r, p.mr, p.t);
    }
    return;
  }
  if (pumpHeld || G.hose > 0.08) {
    p.x = p.c;
    p.y = p.r;
    return;
  }
  d = wantDir();
  if (d >= 0) startMove(d);
  p.x = p.c;
  p.y = p.r;
}

function hoseHit() {
  var o = occ();
  var d = DIR[G.player.dir];
  var i, c, r, m, j;
  for (i = 1; i <= HOSE_MAX; i++) {
    c = o.c + d.x * i;
    r = o.r + d.y * i;
    if (!inB(c, r)) return { len: i - 1, mon: null };
    if (isDirt(c, r) || rockBlocks(c, r)) return { len: i - 1, mon: null };
    for (j = 0; j < G.mons.length; j++) {
      m = G.mons[j];
      if (m.state !== 'ok' || m.ghost) continue;
      if (Math.round(m.x) === c && Math.round(m.y) === r) return { len: i, mon: m };
    }
  }
  return { len: HOSE_MAX, mon: null };
}

function popMon(m, why) {
  var base, face, x, y, rgb;
  if (m.state !== 'ok') return;
  x = m.x + 0.5;
  y = m.y + 0.5;
  rgb = m.kind === 'fygar' ? RGB.fygar : RGB.pooka;
  m.state = why === 'rock' ? 'crush' : 'pop';
  m.deadT = why === 'rock' ? 0.32 : 0.22;
  m.ghost = false;
  bumpCombo();
  face = (m.kind === 'fygar' && (G.player.dir === 0 || G.player.dir === 2)) ? 2 : 1;
  base = (m.kind === 'fygar' ? 300 : 200) * depthMul(Math.round(m.y)) * face;
  if (why === 'rock') base = 1000 * (m._chain || 1);
  addScore(base, x, y, why === 'rock' ? RGB.gold : rgb);
  burst(x, y, why === 'rock' ? 28 : 46, rgb, why === 'rock' ? 5.5 : 7.2, 0.62, 5);
  burst(x, y, 18, RGB.white, 6.4, 0.4, 2);
  burst(x, y, 10, RGB.gold, 4.8, 0.5, 3);
  addRing(x, y, rgb);
  addRing(x, y, RGB.gold);
  screenFlash(why === 'rock' ? RGB.gold : rgb, why === 'rock' ? 0.42 : 0.55);
  kick(why === 'rock' ? 11 : 8);
  hitStop(why === 'rock' ? 0.078 : 0.068);
  punchStage('pop');
  if (why === 'rock') audio.crush();
  else audio.pop(G.combo);
  G.player._target = null;
  G.hose = 0;
  if (G.combo >= 3) toast('连爆 ×' + G.combo);
  markFlee();
  if (liveMons() === 0) beginClear();
}

function markFlee() {
  var m = lastMon();
  if (m) m.flee = true;
}

function tickPump(dt) {
  var p = G.player;
  var hit, m, stage;
  if (!pumpHeld) {
    G.hose = Math.max(0, G.hose - dt * 8);
    p._target = null;
    return;
  }
  if (p.moving && p.t < 0.9) return;
  if (p.moving && p.t >= 0.9) {
    p.c = p.mc;
    p.r = p.mr;
    p.x = p.c;
    p.y = p.r;
    p.moving = false;
  }
  hit = hoseHit();
  G.hose = lerp(G.hose, Math.max(0.35, hit.len), 1 - Math.pow(0.0002, dt));
  if (G.hose < hit.len) G.hose = Math.min(hit.len, G.hose + dt * 18);
  m = hit.mon;
  p._target = m || null;
  if (!m) return;
  m.moving = false;
  m.ghost = false;
  stage = m.fill;
  m.fill = Math.min(1, m.fill + PUMP_RATE * dt);
  G.pulse -= dt;
  if (G.pulse <= 0) {
    G.pulse = 0.15;
    audio.pump(m.fill);
    burst(m.x + 0.5, m.y + 0.5, 4, m.kind === 'fygar' ? RGB.fygar : RGB.pooka, 1.6, 0.22, 0);
    if (!reduceMotion()) G.punch = 1.012;
    if (Math.floor(stage * 4) !== Math.floor(m.fill * 4)) {
      hitStop(0.018);
      kick(2);
    }
  }
  if (m.fill >= 1) popMon(m, 'pump');
}

function tickMons(dt) {
  var i, m;
  for (i = 0; i < G.mons.length; i++) {
    m = G.mons[i];
    if (m.state === 'gone') continue;
    if (m.state === 'pop' || m.state === 'crush') {
      m.deadT -= dt;
      m.fill = Math.min(1.4, m.fill + dt * 2);
      if (m.deadT <= 0) m.state = 'gone';
      continue;
    }
    m.wob += dt * (4 + m.fill * 10);
    if (G.player._target !== m && m.fill > 0) {
      m.fill = Math.max(0, m.fill - DEFLATE * dt);
    }
    if (G.player._target === m) continue;
    if (m.fill > 0.18) continue;
    tickOneMon(m, dt);
  }
}

function fygarFireCells(m) {
  var cells = [];
  var i, c, r, d, range;
  if (m.fire <= 0) return cells;
  d = DIR[m.dir];
  range = G.round >= 5 ? 4 : 3;
  for (i = 1; i <= range; i++) {
    c = Math.round(m.x) + d.x * i;
    r = Math.round(m.y) + d.y * i;
    if (!inB(c, r) || isDirt(c, r) || rockBlocks(c, r)) break;
    cells.push({ c: c, r: r });
  }
  return cells;
}

function tickOneMon(m, dt) {
  var p = G.player;
  var d, nc, nr, opts, i, best, score, s, pc, pr, see, mc, mr;
  var fireRange, dist;
  m.fireCd = Math.max(0, m.fireCd - dt);
  if (m.fire > 0) {
    m.fire -= dt;
    return;
  }
  pc = Math.round(p.x);
  pr = Math.round(p.y);
  see = (Math.round(m.y) === pr || Math.round(m.x) === pc) &&
    clearLine(Math.round(m.x), Math.round(m.y), pc, pr);
  if (see) m.huntT = 0;
  else m.huntT += dt;

  if (m.kind === 'fygar' && !m.ghost && Math.round(m.y) === pr) {
    dist = pc - Math.round(m.x);
    fireRange = G.round >= 5 ? 4 : 3;
    if (dist !== 0 && Math.abs(dist) <= fireRange && Math.abs(dist) >= 2) {
      d = dist > 0 ? 0 : 2;
      if (clearLine(Math.round(m.x), Math.round(m.y), pc, Math.round(m.y)) && m.fireCd <= 0) {
        m.dir = d;
        m.fire = 0.78;
        m.fireCd = 2.35 - Math.min(0.8, G.round * 0.06);
        audio.fire();
        return;
      }
    }
  }

  if (!m.ghost && m.huntT > (m.flee ? ghostDelay() * 0.35 : ghostDelay())) {
    m.ghost = true;
    m.ghostT = rand(1.8, 3.2);
  }
  if (m.ghost) {
    m.ghostT -= dt;
    mc = clamp(Math.round(m.x), 0, COLS - 1);
    mr = clamp(Math.round(m.y), 0, ROWS - 1);
    if (G.dirt[mr][mc] === 0 && m.ghostT < 0.4) m.ghost = false;
  }

  if (m.moving) {
    m.t += dt / m.dur;
    if (m.t >= 1) {
      m.t = 1;
      m.c = m.mc;
      m.r = m.mr;
      m.x = m.c;
      m.y = m.r;
      m.moving = false;
      if (m.flee && m.r === 0 && (m.c === 0 || m.c === COLS - 1)) {
        m.state = 'gone';
        toast('逃走了');
        if (liveMons() === 0) beginClear();
      }
    } else {
      m.x = lerp(m.c, m.mc, m.t);
      m.y = lerp(m.r, m.mr, m.t);
    }
    return;
  }

  opts = [];
  for (i = 0; i < 4; i++) {
    nc = m.c + DIR[i].x;
    nr = m.r + DIR[i].y;
    if (monWalk(nc, nr, m.ghost)) opts.push(i);
  }
  if (!opts.length) {
    m.ghost = true;
    return;
  }
  best = opts[0];
  score = -999;
  for (i = 0; i < opts.length; i++) {
    d = opts[i];
    nc = m.c + DIR[d].x;
    nr = m.r + DIR[d].y;
    s = 0;
    if (m.flee) s -= nr * 3;
    else s -= hypot(nc - p.x, nr - p.y);
    if (d === m.dir) s += 0.55;
    if (d === OPP[m.dir]) s -= 1.4;
    if (m.kind === 'fygar' && DIR[d].y === 0) s += 0.25;
    if (m.ghost && isDirt(nc, nr)) s += 0.15;
    if (s > score) { score = s; best = d; }
  }
  d = best;
  nc = m.c + DIR[d].x;
  nr = m.r + DIR[d].y;
  m.dir = d;
  m.moving = true;
  m.mc = nc;
  m.mr = nr;
  m.t = 0;
  m.dur = 1 / monSpd(m);
}

function supported(c, r) {
  if (r >= ROWS - 1) return true;
  if (isDirt(c, r + 1)) return true;
  if (settledRockAt(c, r + 1)) return true;
  return false;
}

function tickRocks(dt) {
  var i, k, falling, prev, landed, from, to, rr;
  falling = false;
  for (i = 0; i < G.rocks.length; i++) {
    k = G.rocks[i];
    if (k.state === 'dead') continue;
    if (k.state === 'idle') {
      if (!supported(k.c, k.r)) {
        k.state = 'wobble';
        k.wob = 0.4;
        audio.rumble();
        punchStage('rumble');
        kick(5);
      }
    } else if (k.state === 'wobble') {
      k.wob -= dt;
      G.rumble = Math.max(G.rumble, 0.3);
      if (k.wob <= 0) {
        k.state = 'fall';
        k.vy = 0.4;
        burst(k.c + 0.5, k.y + 0.5, 8, RGB.rock, 2.2, 0.3, 5);
      }
    } else if (k.state === 'fall') {
      falling = true;
      k.vy += 26 * dt;
      if (k.vy > 16) k.vy = 16;
      prev = k.y;
      k.y += k.vy * dt;
      G.rumble = Math.max(G.rumble, 0.55);
      rockCrush(k);
      landed = false;
      if (k.y >= ROWS - 1) {
        k.y = ROWS - 1;
        landed = true;
      } else {
        from = Math.floor(prev) + 1;
        to = Math.floor(k.y) + 1;
        for (rr = from; rr <= to; rr++) {
          if (rr >= ROWS || isDirt(k.c, rr) || settledRockAt(k.c, rr)) {
            k.y = rr - 1;
            landed = true;
            break;
          }
        }
      }
      if (landed) {
        if (k.y < 0) k.y = 0;
        k.r = Math.round(k.y);
        k.y = k.r;
        k.vy = 0;
        k.state = 'idle';
        G.rocksDropped += 1;
        audio.land();
        burst(k.c + 0.5, k.y + 1, 12, RGB.rock, 3.4, 0.4, 6);
        kick(6);
        hitStop(0.032);
        if (G.rocksDropped === 2) spawnVeg();
      } else {
        k.r = Math.floor(k.y + 0.001);
      }
    }
  }
  if (falling && G.clock * 8 % 1 < dt * 8) audio.noise(0.05, 0.04, 70, 'lowpass');
}

function rockCrush(k) {
  var i, m, p;
  p = G.player;
  if (G.phase === 'play' && p.inv <= 0) {
    if (Math.abs(p.x - k.c) < 0.62 && Math.abs(p.y - k.y) < 0.62) {
      kill('rock');
    }
  }
  for (i = 0; i < G.mons.length; i++) {
    m = G.mons[i];
    if (m.state !== 'ok') continue;
    if (Math.abs(m.x - k.c) < 0.7 && Math.abs(m.y - k.y) < 0.7) {
      k.chain += 1;
      m._chain = k.chain === 1 ? 1 : k.chain === 2 ? 2 : 4;
      popMon(m, 'rock');
    }
  }
}

function spawnVeg() {
  var r, c, best, d, score, i, j;
  if (G.veg) return;
  best = null;
  score = 99;
  for (r = 4; r < ROWS - 2; r++) {
    for (c = 2; c < COLS - 2; c++) {
      if (G.dirt[r][c] !== 0 || rockBlocks(c, r)) continue;
      d = hypot(c - 6, r - 8);
      if (d < score) { score = d; best = { c: c, r: r }; }
    }
  }
  if (!best) {
    for (i = 1; i < ROWS && !best; i++) {
      for (j = 0; j < COLS; j++) {
        if (G.dirt[i][j] === 0 && !rockBlocks(j, i)) { best = { c: j, r: i }; break; }
      }
    }
  }
  if (best) G.veg = makeVeg(best.c, best.r);
}

function tickVeg(dt) {
  var v = G.veg;
  var p = G.player;
  if (!v) return;
  v.t -= dt;
  if (v.t <= 0) { G.veg = null; return; }
  if (Math.abs(p.x - v.c) < 0.55 && Math.abs(p.y - v.r) < 0.55) {
    addScore(v.score, v.c + 0.5, v.r + 0.5, RGB.lime);
    burst(v.c + 0.5, v.r + 0.5, 16, RGB.lime, 4, 0.4, 2);
    audio.veg();
    G.veg = null;
  }
}

function kill(why) {
  var p = G.player;
  if (G.phase !== 'play') return;
  if (p.inv > 0) return;
  G.why = why;
  G.phase = 'dead';
  G.deadT = DEAD_SEC;
  G.lives -= 1;
  G.hose = 0;
  pumpHeld = false;
  p._target = null;
  p.moving = false;
  audio.death();
  hitStop(0.08);
  kick(12);
  screenFlash(RGB.mag, 0.5);
  punchStage('die');
  burst(p.x + 0.5, p.y + 0.5, 24, RGB.gold, 5.5, 0.5, 4);
  burst(p.x + 0.5, p.y + 0.5, 12, RGB.mag, 4.2, 0.4, 2);
  paintPips();
}

function collide() {
  var p = G.player;
  var i, m, cells, k, pc, pr;
  if (G.phase !== 'play' || p.inv > 0) return;
  pc = Math.round(p.x);
  pr = Math.round(p.y);
  for (i = 0; i < G.mons.length; i++) {
    m = G.mons[i];
    if (m.state !== 'ok' || m.ghost || m.fill > 0.22 || m === p._target) continue;
    if (hypot(p.x - m.x, p.y - m.y) < 0.56) {
      kill('monster');
      return;
    }
    if (m.kind === 'fygar' && m.fire > 0) {
      cells = fygarFireCells(m);
      for (k = 0; k < cells.length; k++) {
        if (cells[k].c === pc && cells[k].r === pr) {
          kill('fire');
          return;
        }
      }
    }
  }
}

function beginClear() {
  if (G.phase === 'over' || G.phase === 'win' || G.phase === 'clear' || G.phase === 'title') return;
  if (G.phase === 'dead' && G.lives <= 0) return;
  G.phase = 'clear';
  G.clearT = CLEAR_SEC;
  addScore(250 * G.round, G.player.x + 0.5, G.player.y + 0.5, RGB.cyan);
  audio.clear();
  toast('全灭');
}

function nextRound() {
  if (G.kind === 'rooms' && G.round >= ROOMS_MAX) {
    showWin();
    return;
  }
  G.round += 1;
  loadRound();
  G.phase = 'ready';
  G.ready = READY_SEC;
  G.combo = 0;
  toast(G.kind === 'endless' ? ('第 ' + G.round + ' 波 · 加速') : ('第 ' + G.round + ' 关'));
  paintHud(true);
}

function respawn() {
  var p;
  G.player = makePlayer();
  p = G.player;
  p.inv = INVULN;
  G.hose = 0;
  p._target = null;
  G.phase = 'play';
  markFlee();
}

/* ---- fx tick ---- */
function tickFx(dt) {
  var i, o;
  G.shake *= Math.pow(0.02, dt);
  G.rumble = Math.max(0, G.rumble - dt);
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

/* ---- autoplay ---- */
function autoScale() {
  if (!autoOn) return 1;
  if (G.phase === 'title' || G.phase === 'over' || G.phase === 'win') return 1;
  return AUTO_SCALE[autoSpeed] || 1;
}

function clearAutoInput() {
  dirHeld[0] = 0;
  dirHeld[1] = 0;
  dirHeld[2] = 0;
  dirHeld[3] = 0;
  pumpHeld = false;
}

function autoHere() {
  var p = G.player;
  if (p.moving && p.t > 0.45) return { c: p.mc, r: p.mr };
  return { c: p.c, r: p.r };
}

function autoRockHazard(c, r) {
  var i, k;
  for (i = 0; i < G.rocks.length; i++) {
    k = G.rocks[i];
    if (k.state === 'dead') continue;
    if (k.c !== c) continue;
    if (k.state === 'fall') {
      if (r + 0.15 >= k.y && r <= k.y + 7) return 2;
    } else if (k.state === 'wobble') {
      if (r >= k.r && r <= k.r + 6) return 2;
    }
  }
  return 0;
}

function autoEnemyNear(c, r) {
  var i, m, d, best = 0;
  if (G.player && G.player.inv > 0.18) return 0;
  for (i = 0; i < G.mons.length; i++) {
    m = G.mons[i];
    if (m.state !== 'ok' || m.ghost || m.fill > 0.38) continue;
    if (m === (G.player && G.player._target)) continue;
    d = hypot(c - m.x, r - m.y);
    if (d < 0.72) best = Math.max(best, 2);
    else if (d < 1.42) best = Math.max(best, 1);
  }
  return best;
}

function autoFireAt(c, r) {
  var i, m, cells, k, dist, range;
  for (i = 0; i < G.mons.length; i++) {
    m = G.mons[i];
    if (m.state !== 'ok' || m.kind !== 'fygar' || m.ghost) continue;
    if (m.fire > 0) {
      cells = fygarFireCells(m);
      for (k = 0; k < cells.length; k++) {
        if (cells[k].c === c && cells[k].r === r) return 2;
      }
    } else if (Math.round(m.y) === r) {
      dist = c - Math.round(m.x);
      range = G.round >= 5 ? 4 : 3;
      if (dist !== 0 && Math.abs(dist) <= range &&
          clearLine(Math.round(m.x), Math.round(m.y), c, r)) {
        return 1;
      }
    }
  }
  return 0;
}

function autoStepCost(nc, nr, d, fromC, fromR) {
  var cost, near, fire, rock;
  if (!inB(nc, nr)) return 9999;
  if (settledRockAt(nc, nr)) return 9999;
  rock = autoRockHazard(nc, nr);
  if (rock) return 900;
  cost = isDirt(nc, nr) ? 2.35 : 1;
  if (d === OPP[G.player.dir] && fromC === G.player.c && fromR === G.player.r) cost += 0.55;
  near = autoEnemyNear(nc, nr);
  if (near === 2) cost += G.player.inv > 0 ? 6 : 280;
  else if (near === 1) cost += G.player.inv > 0 ? 1 : 7.5;
  fire = autoFireAt(nc, nr);
  if (fire === 2) cost += 320;
  else if (fire === 1) cost += 16;
  if (nr === 0 && fromR > 0) cost += 0.35;
  return cost;
}

function autoPathDir(gc, gr) {
  var inf = 1e9;
  var n = COLS * ROWS;
  var dist = [];
  var first = [];
  var i, c, r, d, nc, nr, k, nk, nd, cost, sc, sr, start, q, qi;
  var p = G.player;
  for (i = 0; i < n; i++) {
    dist[i] = inf;
    first[i] = -1;
  }
  sc = p.c;
  sr = p.r;
  if (p.moving && p.t > 0.45) {
    sc = p.mc;
    sr = p.mr;
  }
  if (sc === gc && sr === gr) return -1;
  start = sr * COLS + sc;
  dist[start] = 0;
  q = [start];
  qi = 0;
  while (qi < q.length) {
    k = q[qi++];
    c = k % COLS;
    r = (k / COLS) | 0;
    for (d = 0; d < 4; d++) {
      nc = c + DIR[d].x;
      nr = r + DIR[d].y;
      if (!inB(nc, nr)) continue;
      cost = autoStepCost(nc, nr, d, c, r);
      if (cost >= 800) continue;
      nk = nr * COLS + nc;
      nd = dist[k] + cost;
      if (nd + 0.001 < dist[nk]) {
        dist[nk] = nd;
        first[nk] = k === start ? d : first[k];
        q.push(nk);
      }
    }
  }
  k = gr * COLS + gc;
  if (dist[k] >= inf / 2) return -1;
  return first[k];
}

function autoPumpFrom(c, r) {
  var i, m, mc, mr, dc, dr, dist, face, best = null, bestDist = 99;
  for (i = 0; i < G.mons.length; i++) {
    m = G.mons[i];
    if (m.state !== 'ok' || m.ghost) continue;
    mc = Math.round(m.x);
    mr = Math.round(m.y);
    dc = mc - c;
    dr = mr - r;
    if (dc !== 0 && dr !== 0) continue;
    dist = Math.abs(dc) + Math.abs(dr);
    if (dist < 1 || dist > HOSE_MAX) continue;
    if (!clearLine(c, r, mc, mr)) continue;
    face = dc > 0 ? 0 : dc < 0 ? 2 : dr > 0 ? 1 : 3;
    if (dist < bestDist || (dist === bestDist && m.fill > (best ? best.mon.fill : 0))) {
      bestDist = dist;
      best = { dir: face, dist: dist, mon: m };
    }
  }
  return best;
}

function autoStation(m) {
  var mc = Math.round(m.x);
  var mr = Math.round(m.y);
  var here = autoHere();
  var best = null;
  var bestS = 1e9;
  var dist, d, c, r, s, k, blocked, cc, rr, near;
  for (dist = 2; dist <= HOSE_MAX; dist++) {
    for (d = 0; d < 4; d++) {
      c = mc - DIR[d].x * dist;
      r = mr - DIR[d].y * dist;
      if (!inB(c, r) || settledRockAt(c, r)) continue;
      if (autoRockHazard(c, r)) continue;
      blocked = 0;
      for (k = 1; k <= dist; k++) {
        cc = c + DIR[d].x * k;
        rr = r + DIR[d].y * k;
        if (settledRockAt(cc, rr)) { blocked = 99; break; }
        if (isDirt(cc, rr)) blocked += 1;
      }
      if (blocked > 3) continue;
      near = autoEnemyNear(c, r);
      s = hypot(c - here.c, r - here.r) + blocked * 1.55 + (dist === 2 ? 0.08 : dist * 0.12);
      if (near === 2) s += 28;
      else if (near === 1) s += 6;
      if (autoFireAt(c, r) === 2) s += 40;
      if (s < bestS) {
        bestS = s;
        best = { c: c, r: r, face: d, dist: dist };
      }
    }
  }
  return best;
}

function autoPickMon() {
  var i, m, st, s, best = null, bestS = 1e9;
  var here = autoHere();
  for (i = 0; i < G.mons.length; i++) {
    m = G.mons[i];
    if (m.state !== 'ok' || m.ghost) continue;
    st = autoStation(m);
    s = hypot(m.x - here.c, m.y - here.r);
    if (st) s = hypot(st.c - here.c, st.r - here.r) * 0.72 + s * 0.28;
    if (m.flee) s -= 2;
    if (m.kind === 'fygar') s -= 0.35;
    if (m.fill > 0.2) s -= 1.2;
    if (s < bestS) { bestS = s; best = m; }
  }
  return best;
}

function autoGetMon() {
  if (autoMon && autoMon.state === 'ok' && !autoMon.ghost) return autoMon;
  autoMon = autoPickMon();
  return autoMon;
}

function autoRockJob() {
  var i, k, j, m, sr, prey, r, blocked;
  for (i = 0; i < G.rocks.length; i++) {
    k = G.rocks[i];
    if (k.state !== 'idle') continue;
    sr = k.r + 1;
    if (sr >= ROWS) continue;
    if (settledRockAt(k.c, sr)) continue;
    prey = false;
    for (j = 0; j < G.mons.length; j++) {
      m = G.mons[j];
      if (m.state !== 'ok' || m.ghost) continue;
      if (Math.round(m.x) !== k.c) continue;
      if (m.y < k.r + 0.55) continue;
      blocked = false;
      for (r = sr + 1; r <= Math.round(m.y); r++) {
        if (settledRockAt(k.c, r)) { blocked = true; break; }
        if (r < Math.round(m.y) && isDirt(k.c, r)) { blocked = true; break; }
      }
      if (!blocked) { prey = true; break; }
    }
    if (!prey) continue;
    if (autoRockHazard(k.c, sr) && !isDirt(k.c, sr)) continue;
    return { c: k.c, r: sr };
  }
  return null;
}

function autoSideStep(here, avoidC, avoidR) {
  var d, nc, nr, best = -1, score, bestS = -999, near;
  for (d = 0; d < 4; d++) {
    nc = here.c + DIR[d].x;
    nr = here.r + DIR[d].y;
    if (!playerCan(nc, nr)) continue;
    if (nc === avoidC && nr === avoidR) continue;
    score = 0;
    if (autoRockHazard(nc, nr)) score -= 80;
    near = autoEnemyNear(nc, nr);
    if (near === 2) score -= 50;
    else if (near === 1) score -= 10;
    if (autoFireAt(nc, nr) === 2) score -= 60;
    if (!isDirt(nc, nr)) score += 3;
    if (DIR[d].y === 0) score += 2;
    if (d === G.player.dir) score += 0.4;
    if (score > bestS) { bestS = score; best = d; }
  }
  return best;
}

function autoMustFlee(here) {
  var shot;
  if (autoRockHazard(here.c, here.r)) return true;
  if (autoFireAt(here.c, here.r) === 2) return true;
  if (G.player.inv > 0.12) return false;
  shot = autoPumpFrom(here.c, here.r);
  if (autoEnemyNear(here.c, here.r) >= 1 && !shot) return true;
  if (autoFireAt(here.c, here.r) === 1 && !shot) return true;
  return false;
}

function autoApplyDir(d) {
  if (d < 0) return;
  if (G.clock < autoHoldUntil && autoHold >= 0 && autoHold !== d && d === OPP[autoHold]) {
    if (playerCan(autoHere().c + DIR[autoHold].x, autoHere().r + DIR[autoHold].y)) {
      d = autoHold;
    }
  }
  autoHold = d;
  autoHoldUntil = G.clock + 0.32;
  pressDir(d);
}

function tickAuto() {
  var here, shot, mon, st, rock, veg, d, nc, nr, threat;
  clearAutoInput();
  if (!autoOn || G.phase !== 'play' || !G.player) return;

  here = autoHere();
  if (here.c === autoLastC && here.r === autoLastR) autoIdle += 1;
  else {
    autoIdle = 0;
    autoLastC = here.c;
    autoLastR = here.r;
  }

  if (G.player._target && G.player._target.state === 'ok' && G.player._target.fill > 0.02) {
    pumpHeld = true;
    return;
  }

  if (autoMustFlee(here)) {
    d = autoSideStep(here, -1, -1);
    if (d >= 0) autoApplyDir(d);
    return;
  }

  shot = autoPumpFrom(here.c, here.r);
  if (shot) {
    if (G.player.dir === shot.dir) {
      pumpHeld = true;
      autoMon = shot.mon;
      return;
    }
    nc = here.c + DIR[shot.dir].x;
    nr = here.r + DIR[shot.dir].y;
    if (shot.dist >= 2 && playerCan(nc, nr) && autoEnemyNear(nc, nr) < 2) {
      autoApplyDir(shot.dir);
      return;
    }
    d = autoSideStep(here, nc, nr);
    if (d >= 0) autoApplyDir(d);
    return;
  }

  rock = autoRockJob();
  if (rock) {
    if (here.c === rock.c && here.r === rock.r) {
      d = autoSideStep(here, rock.c, rock.r + 1);
      if (d >= 0) autoApplyDir(d);
      return;
    }
    d = autoPathDir(rock.c, rock.r);
    if (d >= 0) {
      autoApplyDir(d);
      return;
    }
  }

  veg = G.veg;
  threat = autoEnemyNear(here.c, here.r);
  if (veg && veg.t > 1.8 && threat < 1) {
    mon = autoGetMon();
    if (!mon || hypot(veg.c - here.c, veg.r - here.r) < hypot(mon.x - here.c, mon.y - here.r) * 0.55 + 2.2) {
      if (here.c !== veg.c || here.r !== veg.r) {
        d = autoPathDir(veg.c, veg.r);
        if (d >= 0) {
          autoApplyDir(d);
          return;
        }
      }
    }
  }

  mon = autoGetMon();
  if (mon) {
    st = autoStation(mon);
    if (st) {
      if (here.c === st.c && here.r === st.r) {
        if (G.player.dir === st.face) {
          pumpHeld = true;
          return;
        }
        nc = here.c + DIR[st.face].x;
        nr = here.r + DIR[st.face].y;
        if (playerCan(nc, nr) && autoEnemyNear(nc, nr) < 2) {
          autoApplyDir(st.face);
          return;
        }
      } else {
        d = autoPathDir(st.c, st.r);
        if (d >= 0) {
          autoApplyDir(d);
          return;
        }
      }
    }
    d = autoPathDir(Math.round(mon.x), Math.round(mon.y));
    if (d >= 0) {
      nc = here.c + DIR[d].x;
      nr = here.r + DIR[d].y;
      if (autoEnemyNear(nc, nr) === 2 && G.player.inv <= 0) {
        d = autoSideStep(here, Math.round(mon.x), Math.round(mon.y));
      }
      if (d >= 0) {
        autoApplyDir(d);
        return;
      }
    }
  }

  if (autoIdle > 24) {
    d = autoSideStep(here, -1, -1);
    if (d >= 0) autoApplyDir(d);
    autoIdle = 0;
    autoMon = null;
  }
}

function syncAutoUi() {
  btnAuto.classList.toggle('on', autoOn);
  btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
  btnAuto.textContent = autoOn ? '停下' : '自动';
  btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
}

function syncSpeedUi() {
  speedEl.value = String(autoSpeed);
  speedLab.textContent = SPEED_LABELS[autoSpeed];
  speedEl.title = SPEED_LABELS[autoSpeed];
  speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
}

function playHint() {
  if (autoOn && G.phase !== 'title') {
    hintEl.textContent = G.kind === 'endless'
      ? '自动 · 无尽 · 挖土泵怪砸岩 · A 停下'
      : '自动托管 · 挖土、泵怪、砸岩过关 · A 停下';
  } else if (G.kind === 'endless' && G.phase !== 'title') {
    hintEl.textContent = '无尽会更快更挤 · 空格按住泵爆 · A 自动 · R 重开 · M 静音';
  } else {
    hintEl.textContent = '挖隧道 · 空格按住把怪泵爆 · 掏空岩石脚下会砸下来 · A 自动';
  }
}

function toggleAuto() {
  autoOn = !autoOn;
  clearAutoInput();
  autoMon = null;
  autoHold = -1;
  autoHoldUntil = 0;
  autoIdle = 0;
  syncAutoUi();
  if (autoOn) {
    audio.ensure();
    if (G.phase === 'title') startGame('rooms');
  }
  playHint();
}

function setAutoSpeed(n) {
  if (n < 1 || n > 4 || !isFinite(n)) n = 3;
  autoSpeed = n;
  saveAutoSpeed(autoSpeed);
  syncSpeedUi();
}

function isAutoKey(e) {
  return e.code === 'KeyA' || e.key === 'a' || e.key === 'A';
}

function tick(dt) {
  G.clock += dt;
  tickFx(dt);
  if (G.stop > 0) {
    G.stop -= dt;
    if (G.stop > 0) return;
  }
  if (G.phase === 'title') {
    tickMons(dt * 0.7);
    tickRocks(dt);
    return;
  }
  if (G.phase === 'over' || G.phase === 'win') return;
  if (G.phase === 'ready') {
    G.ready -= dt;
    if (G.ready <= 0) G.phase = 'play';
    return;
  }
  if (G.phase === 'dead') {
    G.deadT -= dt;
    tickRocks(dt);
    tickMons(dt * 0.4);
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
    if (autoOn) tickAuto();
    tickPlayer(dt);
    tickPump(dt);
    tickMons(dt);
    tickRocks(dt);
    tickVeg(dt);
    collide();
    if (G.combo > 0) {
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
    Math.round(lerp(196, 72, t)),
    Math.round(lerp(118, 28, t)),
    Math.round(lerp(32, 58, t))
  ];
}

function drawDirt(c, s) {
  var r, col, x, y, rgb, h, k, n;
  c.fillStyle = '#12080c';
  c.fillRect(wx(0), wy(0), COLS * s, ROWS * s);
  /* sky strip */
  var g = c.createLinearGradient(0, wy(0), 0, wy(1.15));
  g.addColorStop(0, 'rgba(12, 8, 28, 0.2)');
  g.addColorStop(1, 'rgba(40, 22, 8, 0.0)');
  c.fillStyle = g;
  c.fillRect(wx(0), wy(0), COLS * s, s * 1.2);
  c.fillStyle = 'rgba(255, 227, 107, 0.14)';
  c.fillRect(wx(0), wy(1) - 1.5, COLS * s, 2);
  for (r = 0; r < ROWS; r++) {
    for (col = 0; col < COLS; col++) {
      x = wx(col);
      y = wy(r);
      if (G.dirt[r][col]) {
        rgb = dirtRgb(r);
        c.fillStyle = rgba(rgb, 1);
        c.fillRect(x, y, s + 0.5, s + 0.5);
        h = hash(col, r);
        c.fillStyle = rgba([rgb[0] + 28, rgb[1] + 18, rgb[2] + 4], 0.35);
        c.fillRect(x + s * (0.1 + h * 0.4), y + s * (0.15 + (1 - h) * 0.35), s * 0.22, s * 0.12);
        if (h > 0.72) {
          c.fillStyle = rgba(RGB.gold, 0.22);
          c.beginPath();
          c.arc(x + s * 0.62, y + s * 0.38, s * 0.07, 0, TAU);
          c.fill();
        }
      } else if (r > 0) {
        c.fillStyle = 'rgba(8, 4, 10, 0.92)';
        c.fillRect(x, y, s + 0.4, s + 0.4);
        c.fillStyle = 'rgba(255, 200, 80, 0.035)';
        c.fillRect(x + 1, y + 1, s - 2, s - 2);
      }
    }
  }
  /* tunnel walls */
  c.lineWidth = Math.max(1.4, s * 0.08);
  c.strokeStyle = 'rgba(255, 196, 64, 0.55)';
  c.lineJoin = 'round';
  for (r = 1; r < ROWS; r++) {
    for (col = 0; col < COLS; col++) {
      if (G.dirt[r][col]) continue;
      x = wx(col);
      y = wy(r);
      if (isDirt(col, r - 1)) {
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + s, y);
        c.stroke();
      }
      if (isDirt(col, r + 1)) {
        c.beginPath();
        c.moveTo(x, y + s);
        c.lineTo(x + s, y + s);
        c.stroke();
      }
      if (isDirt(col - 1, r)) {
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x, y + s);
        c.stroke();
      }
      if (isDirt(col + 1, r)) {
        c.beginPath();
        c.moveTo(x + s, y);
        c.lineTo(x + s, y + s);
        c.stroke();
      }
    }
  }
  /* grass tufts */
  c.fillStyle = rgba(RGB.gold, 0.45);
  for (k = 0; k < COLS; k++) {
    n = hash(k, 0);
    c.fillRect(wx(k) + s * 0.3, wy(1) - s * 0.12, s * 0.08, s * 0.14);
    if (n > 0.5) c.fillRect(wx(k) + s * 0.55, wy(1) - s * 0.18, s * 0.07, s * 0.18);
  }
}

function drawRock(c, s, k) {
  var x = wx(k.c + 0.5);
  var y = wy(k.y + 0.5);
  var wob = k.state === 'wobble' ? Math.sin(G.clock * 28) * s * 0.08 : 0;
  var sc = k.state === 'fall' ? 1.04 : 1;
  c.save();
  c.translate(x + wob, y);
  c.scale(sc, sc);
  c.fillStyle = 'rgba(0,0,0,0.35)';
  c.beginPath();
  c.ellipse(0, s * 0.28, s * 0.28, s * 0.1, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#9aa8c4';
  c.beginPath();
  c.moveTo(-s * 0.32, s * 0.08);
  c.lineTo(-s * 0.18, -s * 0.3);
  c.lineTo(s * 0.12, -s * 0.34);
  c.lineTo(s * 0.34, -s * 0.08);
  c.lineTo(s * 0.22, s * 0.28);
  c.lineTo(-s * 0.22, s * 0.3);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(230, 240, 255, 0.35)';
  c.beginPath();
  c.moveTo(-s * 0.16, -s * 0.18);
  c.lineTo(s * 0.02, -s * 0.26);
  c.lineTo(s * 0.08, -s * 0.1);
  c.lineTo(-s * 0.08, -s * 0.04);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(20, 24, 40, 0.35)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-s * 0.04, -s * 0.08);
  c.lineTo(s * 0.06, s * 0.16);
  c.stroke();
  c.restore();
}

function drawVeg(c, s) {
  var v = G.veg;
  var x, y, bounce;
  if (!v) return;
  bounce = Math.sin(G.clock * 6) * s * 0.04;
  x = wx(v.c + 0.5);
  y = wy(v.r + 0.5) + bounce;
  c.save();
  c.translate(x, y);
  c.fillStyle = rgba(RGB.lime, 0.9);
  c.beginPath();
  c.ellipse(0, s * 0.08, s * 0.16, s * 0.22, 0, 0, TAU);
  c.fill();
  c.fillStyle = rgba(RGB.gold, 0.95);
  c.beginPath();
  c.ellipse(0, -s * 0.12, s * 0.12, s * 0.1, 0, 0, TAU);
  c.fill();
  c.restore();
}

function drawHose(c, s) {
  var p = G.player;
  var d, x0, y0, x1, y1, len, i, t, px, py, pulse;
  if (G.hose < 0.08 || G.phase === 'dead') return;
  d = DIR[p.dir];
  len = G.hose;
  x0 = wx(p.x + 0.5 + d.x * 0.22);
  y0 = wy(p.y + 0.5 + d.y * 0.22);
  x1 = wx(p.x + 0.5 + d.x * len);
  y1 = wy(p.y + 0.5 + d.y * len);
  if (p._target) {
    x1 = wx(p._target.x + 0.5);
    y1 = wy(p._target.y + 0.5);
  }
  c.strokeStyle = rgba(RGB.cyan, 0.85);
  c.lineWidth = Math.max(3, s * 0.12);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x0, y0);
  c.lineTo(x1, y1);
  c.stroke();
  c.strokeStyle = rgba(RGB.gold, 0.7);
  c.lineWidth = Math.max(1.4, s * 0.05);
  c.beginPath();
  c.moveTo(x0, y0);
  c.lineTo(x1, y1);
  c.stroke();
  for (i = 0; i < 4; i++) {
    t = ((G.clock * 2.4 + i * 0.25) % 1);
    px = lerp(x0, x1, t);
    py = lerp(y0, y1, t);
    pulse = 2 + Math.sin(G.clock * 20 + i) * 1.4;
    c.fillStyle = rgba(RGB.white, 0.7 - t * 0.4);
    c.beginPath();
    c.arc(px, py, pulse, 0, TAU);
    c.fill();
  }
  c.fillStyle = rgba(RGB.cyan, 0.9);
  c.beginPath();
  c.arc(x1, y1, s * 0.1, 0, TAU);
  c.fill();
}

function drawPlayer(c, s) {
  var p = G.player;
  var x, y, bob, face, blink;
  if (G.phase === 'dead' && G.deadT < 0.35) return;
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
  /* body */
  c.fillStyle = '#e8fbff';
  c.beginPath();
  c.roundRect(-s * 0.16, -s * 0.02, s * 0.32, s * 0.3, s * 0.06);
  c.fill();
  /* helmet */
  c.fillStyle = rgba(RGB.gold, 1);
  c.beginPath();
  c.ellipse(0, -s * 0.14, s * 0.2, s * 0.16, 0, Math.PI, TAU);
  c.fill();
  c.fillRect(-s * 0.2, -s * 0.16, s * 0.4, s * 0.08);
  c.fillStyle = rgba(RGB.cyan, 0.95);
  c.fillRect(-s * 0.14, -s * 0.12, s * 0.28, s * 0.07);
  /* visor glint */
  c.fillStyle = 'rgba(255,255,255,0.7)';
  c.fillRect(-s * 0.1, -s * 0.11, s * 0.08, s * 0.04);
  /* arms */
  c.strokeStyle = '#d4e8f0';
  c.lineWidth = Math.max(2, s * 0.07);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-s * 0.12, s * 0.06);
  c.lineTo(-s * 0.22 + face.x * s * 0.08, s * 0.18);
  c.moveTo(s * 0.12, s * 0.06);
  c.lineTo(s * 0.22 + face.x * s * 0.1, s * 0.12 + face.y * s * 0.1);
  c.stroke();
  /* pick / hose hand */
  if (G.hose > 0.08) {
    c.fillStyle = rgba(RGB.cyan, 1);
    c.beginPath();
    c.arc(face.x * s * 0.22, face.y * s * 0.18, s * 0.07, 0, TAU);
    c.fill();
  } else if (p.dig > 0) {
    c.fillStyle = rgba(RGB.gold, 1);
    c.fillRect(face.x * s * 0.18 - s * 0.04, face.y * s * 0.14 - s * 0.04, s * 0.14, s * 0.08);
  }
  /* legs */
  blink = Math.sin(p.bob * (p.moving ? 18 : 0)) * s * 0.05;
  c.strokeStyle = '#9ad4e8';
  c.beginPath();
  c.moveTo(-s * 0.08, s * 0.26);
  c.lineTo(-s * 0.1, s * 0.36 + blink);
  c.moveTo(s * 0.08, s * 0.26);
  c.lineTo(s * 0.1, s * 0.36 - blink);
  c.stroke();
  c.restore();
}

function drawMon(c, s, m) {
  var x, y, sc, wob, rgb, eye, i, cells, f, a;
  if (m.state === 'gone') return;
  x = wx(m.x + 0.5);
  y = wy(m.y + 0.5);
  sc = 1 + m.fill * 1.18;
  if (m.state === 'pop' || m.state === 'crush') sc *= 1.15 + (0.22 - m.deadT);
  wob = Math.sin(m.wob) * (0.04 + m.fill * 0.08);
  a = m.ghost ? 0.42 : 1;
  rgb = m.kind === 'fygar' ? RGB.fygar : RGB.pooka;
  c.save();
  c.translate(x, y);
  c.scale(sc * (1 + wob), sc * (1 - wob * 0.7));
  c.globalAlpha = a;
  if (m.fill > 0.08) {
    c.shadowColor = rgba(rgb, 0.55);
    c.shadowBlur = 18 + m.fill * 22;
  }
  c.fillStyle = rgba(rgb, 0.95);
  if (m.kind === 'pooka') {
    c.beginPath();
    c.ellipse(0, 0, s * 0.32, s * 0.28, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(RGB.white, 0.95);
    c.beginPath();
    c.ellipse(-s * 0.1, -s * 0.04, s * 0.1, s * 0.12, 0, 0, TAU);
    c.ellipse(s * 0.1, -s * 0.04, s * 0.1, s * 0.12, 0, 0, TAU);
    c.fill();
    eye = m.flee ? RGB.mag : [20, 16, 32];
    c.fillStyle = rgba(eye, 1);
    c.beginPath();
    c.arc(-s * 0.08 + DIR[m.dir].x * s * 0.03, -s * 0.03 + DIR[m.dir].y * s * 0.03, s * 0.035, 0, TAU);
    c.arc(s * 0.12 + DIR[m.dir].x * s * 0.03, -s * 0.03 + DIR[m.dir].y * s * 0.03, s * 0.035, 0, TAU);
    c.fill();
  } else {
    c.beginPath();
    c.ellipse(0, s * 0.02, s * 0.3, s * 0.22, 0, 0, TAU);
    c.fill();
    /* snout */
    c.beginPath();
    c.moveTo(DIR[m.dir].x * s * 0.18, -s * 0.04);
    c.lineTo(DIR[m.dir].x * s * 0.38, DIR[m.dir].y * s * 0.02);
    c.lineTo(DIR[m.dir].x * s * 0.18, s * 0.1);
    c.closePath();
    c.fill();
    /* wings */
    c.fillStyle = rgba([40, 180, 90], 0.9);
    c.beginPath();
    c.ellipse(-s * 0.2, -s * 0.12, s * 0.14, s * 0.08, -0.5, 0, TAU);
    c.ellipse(s * 0.2, -s * 0.12, s * 0.14, s * 0.08, 0.5, 0, TAU);
    c.fill();
    c.fillStyle = rgba(RGB.white, 0.95);
    c.beginPath();
    c.arc(-s * 0.08, -s * 0.02, s * 0.055, 0, TAU);
    c.arc(s * 0.1, -s * 0.02, s * 0.055, 0, TAU);
    c.fill();
    c.fillStyle = '#1a1428';
    c.beginPath();
    c.arc(-s * 0.06 + DIR[m.dir].x * s * 0.02, -s * 0.02, s * 0.028, 0, TAU);
    c.arc(s * 0.12 + DIR[m.dir].x * s * 0.02, -s * 0.02, s * 0.028, 0, TAU);
    c.fill();
  }
  if (m.fill > 0.2) {
    c.globalAlpha = 0.35 * m.fill;
    c.fillStyle = '#fff';
    c.beginPath();
    c.ellipse(0, 0, s * 0.22, s * 0.2, 0, 0, TAU);
    c.fill();
  }
  c.restore();

  if (m.kind === 'fygar' && m.fire > 0) {
    cells = fygarFireCells(m);
    for (i = 0; i < cells.length; i++) {
      f = cells[i];
      c.save();
      c.translate(wx(f.c + 0.5), wy(f.r + 0.5));
      c.globalAlpha = 0.55 + Math.sin(G.clock * 24 + i) * 0.2;
      c.fillStyle = rgba(RGB.fire, 0.95);
      c.beginPath();
      c.ellipse(0, 0, s * (0.28 + i * 0.04), s * 0.18, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(RGB.gold, 0.85);
      c.beginPath();
      c.ellipse(0, 0, s * 0.14, s * 0.1, 0, 0, TAU);
      c.fill();
      c.restore();
    }
  }
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
  else if (G.phase === 'clear') msg = G.kind === 'rooms' && G.round >= ROOMS_MAX ? '清空' : '下一关';
  else if (G.phase === 'dead' && G.lives > 0) {
    msg = G.why === 'rock' ? '被砸扁' : G.why === 'fire' ? '被烧到' : '被追上';
  }
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
  if ((G.shake > 0.4 || G.rumble > 0) && !reduceMotion()) {
    shx = (Math.random() - 0.5) * (G.shake + G.rumble * 5);
    shy = (Math.random() - 0.5) * (G.shake + G.rumble * 4);
  }
  ctx.save();
  ctx.translate(shx, shy);
  if (G.punch !== 1 && !reduceMotion()) {
    ctx.translate(w * 0.5, h * 0.5);
    ctx.scale(G.punch, G.punch);
    ctx.translate(-w * 0.5, -h * 0.5);
  }
  drawDirt(ctx, s);
  drawVeg(ctx, s);
  for (i = 0; i < G.rocks.length; i++) drawRock(ctx, s, G.rocks[i]);
  for (i = 0; i < G.mons.length; i++) drawMon(ctx, s, G.mons[i]);
  if (G.phase !== 'title') {
    drawHose(ctx, s);
    drawPlayer(ctx, s);
  } else {
    drawPlayer(ctx, s);
  }
  drawFx(ctx, s);
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

function paintHud(force) {
  var pump = 0;
  if (force || hud.score !== G.score) {
    hud.score = G.score;
    scoreEl.textContent = String(G.score);
  }
  var b = currentBest();
  if (force || hud.best !== b) {
    hud.best = b;
    bestEl.textContent = String(b);
  }
  if (force || hud.round !== G.round || hud.kind !== G.kind) {
    hud.round = G.round;
    hud.kind = G.kind;
    roundEm.textContent = G.kind === 'endless' ? '波' : '关';
    roundEl.textContent = G.kind === 'endless' ? String(G.round) : (G.round + '/' + ROOMS_MAX);
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
  if (G.player && G.player._target && G.phase === 'play') pump = G.player._target.fill;
  if (force || Math.abs(hud.pump - pump) > 0.01) {
    hud.pump = pump;
    if (pump > 0) {
      pumpWrap.hidden = false;
      pumpBar.style.transform = 'scaleX(' + pump + ')';
      pumpBar.classList.toggle('hot', pump > 0.62);
    } else {
      pumpWrap.hidden = true;
    }
  }
  modeLabel.textContent = G.kind === 'endless' ? '无尽' : '闯关';
  modeLabel.classList.toggle('endless', G.kind === 'endless');
}

function showTitle() {
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  panel.className = 'panel';
  ovKicker.textContent = 'DIG';
  ovTitle.textContent = '矿掘';
  ovLead.textContent = '挖开土层，把地下怪物泵到爆。泵才是爽点。';
  ovOps.textContent = '方向键或 W S D 挖 · 空格按住泵 · A 自动 · 触屏滑向 + 泵 · R 重开 · M 静音';
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
}

function showOver() {
  G.phase = 'over';
  audio.over();
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  panel.className = 'panel lose';
  ovKicker.textContent = 'DIG';
  ovTitle.textContent = G.why === 'rock' ? '被砸扁了' : G.why === 'fire' ? '被烧到了' : '被追上了';
  ovLead.textContent = '本局 ' + G.score + (G.newBest ? ' · 新纪录' : '') +
    (G.kind === 'endless' ? (' · 第 ' + G.round + ' 波') : (' · 第 ' + G.round + ' 关'));
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
  ovKicker.textContent = 'DIG';
  ovTitle.textContent = '矿脉清空';
  ovLead.textContent = '八关挖穿 · ' + G.score + (G.newBest ? ' · 新纪录' : '');
  ovOps.textContent = 'R 重开 · 再来闯关';
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
}

function hideOverlay() {
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
}

function startGame(kind) {
  G.kind = kind || 'rooms';
  G.round = 1;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  G.extra = false;
  G.newBest = false;
  G.why = '';
  loadRound();
  G.phase = 'ready';
  G.ready = READY_SEC;
  hideOverlay();
  audio.start();
  playHint();
  paintHud(true);
  canvas.focus();
}

function restart() {
  audio.ui();
  if (G.phase === 'title') {
    startGame('rooms');
    return;
  }
  startGame(G.kind);
}

function backToModes() {
  audio.ui();
  G.round = 1;
  G.kind = 'rooms';
  G.score = 0;
  G.lives = LIVES;
  G.combo = 0;
  loadRound();
  G.phase = 'title';
  G.player = makePlayer();
  showTitle();
  paintHud(true);
  playHint();
}

/* ---- input ---- */
function pressDir(d) {
  dirStamp += 1;
  dirHeld[d] = dirStamp;
}
function releaseDir(d) { dirHeld[d] = 0; }

function onKeyDown(e) {
  var d = KEY_DIR[e.code];
  if (isAutoKey(e)) {
    if (e.repeat) return;
    audio.ensure();
    toggleAuto();
    e.preventDefault();
    return;
  }
  if (e.target === speedEl) return;
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
  if (G.phase === 'title') {
    if (e.code === 'Enter' || e.code === 'Digit1' || e.code === 'Numpad1' || e.code === 'Space') {
      e.preventDefault();
      if (!e.repeat) startGame('rooms');
      return;
    }
    if (e.code === 'Digit2' || e.code === 'Numpad2') {
      e.preventDefault();
      if (!e.repeat) startGame('endless');
      return;
    }
  }
  if (G.phase === 'over' || G.phase === 'win') {
    if (e.code === 'Enter' || e.code === 'Digit1' || e.code === 'Numpad1' || e.code === 'Space') {
      e.preventDefault();
      if (!e.repeat) startGame(G.kind);
      return;
    }
  }
  if (autoOn) {
    if (
      e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'ArrowUp' ||
      e.code === 'ArrowDown' || e.code === 'Space' || e.code === 'KeyD' ||
      e.code === 'KeyS' || e.code === 'KeyW'
    ) {
      e.preventDefault();
    }
    return;
  }
  if (d != null) {
    e.preventDefault();
    pressDir(d);
    return;
  }
  if (e.code === 'Space') {
    e.preventDefault();
    if (G.phase !== 'title' && G.phase !== 'over' && G.phase !== 'win') pumpHeld = true;
  }
}

function onKeyUp(e) {
  var d;
  if (isAutoKey(e)) {
    e.preventDefault();
    return;
  }
  if (autoOn) return;
  d = KEY_DIR[e.code];
  if (d != null) releaseDir(d);
  if (e.code === 'Space') pumpHeld = false;
}

function bindPad(btn, d, isPump) {
  function down(ev) {
    ev.preventDefault();
    audio.ensure();
    if (autoOn) return;
    btn.classList.add('held');
    if (isPump) {
      pumpHeld = true;
      padHeld.pump = true;
    } else {
      pressDir(d);
      padHeld[d] = true;
    }
  }
  function up(ev) {
    ev.preventDefault();
    btn.classList.remove('held');
    if (isPump) {
      pumpHeld = false;
      padHeld.pump = false;
    } else {
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
  if (autoOn) return;
  swipe.on = true;
  swipe.id = e.pointerId;
  swipe.x = e.clientX;
  swipe.y = e.clientY;
  swipe.moved = false;
  if (G.phase === 'play' || G.phase === 'ready') pumpHeld = true;
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
}

function onPointerMove(e) {
  var d;
  if (autoOn) return;
  if (!swipe.on || e.pointerId !== swipe.id) return;
  d = swipeDir(e.clientX - swipe.x, e.clientY - swipe.y);
  if (d >= 0) {
    swipe.moved = true;
    pumpHeld = false;
    pressDir(d);
    swipe.x = e.clientX;
    swipe.y = e.clientY;
  }
}

function onPointerUp(e) {
  var i;
  if (e.pointerId !== swipe.id) return;
  swipe.on = false;
  pumpHeld = padHeld.pump;
  if (swipe.moved) {
    for (i = 0; i < 4; i++) {
      if (!padHeld[i]) dirHeld[i] = 0;
    }
  }
}

function frame(ts) {
  var dt, steps, turbo, maxSteps;
  if (!lastTs) lastTs = ts;
  dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (dt > 0.08) dt = 0.08;
  if (document.hidden) {
    requestAnimationFrame(frame);
    return;
  }
  turbo = autoOn && autoSpeed >= 4 && G.phase === 'play';
  if (turbo) G.stop = 0;
  acc += dt * autoScale();
  steps = 0;
  maxSteps = turbo ? 16 : 8;
  while (acc >= STEP && steps < maxSteps) {
    tick(STEP);
    acc -= STEP;
    steps++;
  }
  if (acc > STEP * 4) acc = 0;
  render();
  paintHud(false);
  requestAnimationFrame(frame);
}

function loadBest() {
  try {
    var r = JSON.parse(localStorage.getItem(BEST_KEY) || '{}');
    if (typeof r === 'number') return { rooms: r, endless: 0 };
    return { rooms: r.rooms | 0, endless: r.endless | 0 };
  } catch (e) {
    return { rooms: 0, endless: 0 };
  }
}

function loadMute() {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { return false; }
}

function loadAutoSpeed() {
  try {
    var n = parseInt(localStorage.getItem(AUTO_SPEED_KEY) || '3', 10);
    if (!isFinite(n) || n < 1 || n > 4) return 3;
    return n;
  } catch (e) {
    return 3;
  }
}

function saveAutoSpeed(n) {
  try { localStorage.setItem(AUTO_SPEED_KEY, String(n)); } catch (e) { /* ignore */ }
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
  btnAuto.addEventListener('click', function () { toggleAuto(); });
  speedEl.addEventListener('input', function () { setAutoSpeed(parseInt(speedEl.value, 10)); });
  speedEl.addEventListener('change', function () { setAutoSpeed(parseInt(speedEl.value, 10)); });
  btnRooms.addEventListener('click', function () { startGame('rooms'); });
  btnEndless.addEventListener('click', function () { startGame('endless'); });
  ovRetry.addEventListener('click', function () { startGame(G.kind); });
  ovModes.addEventListener('click', backToModes);
  bindPad(document.getElementById('btn-right'), 0, false);
  bindPad(document.getElementById('btn-down'), 1, false);
  bindPad(document.getElementById('btn-left'), 2, false);
  bindPad(document.getElementById('btn-up'), 3, false);
  bindPad(document.getElementById('btn-pump'), 0, true);
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas.parentElement);
  document.addEventListener('visibilitychange', function () {
    lastTs = 0;
  });
}

function boot() {
  var r, i;
  for (i = 0; i < ROOMS.length; i++) {
    if (ROOMS[i].length !== ROWS) throw new Error('room ' + i + ' rows');
    for (r = 0; r < ROWS; r++) {
      if (ROOMS[i][r].length !== COLS) throw new Error('room ' + i + ' row ' + r + ' len ' + ROOMS[i][r].length);
    }
  }
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
  G.bests = loadBest();
  audio.setMuted(loadMute());
  autoSpeed = loadAutoSpeed();
  loadRound();
  G.phase = 'title';
  G.player = makePlayer();
  showTitle();
  paintHud(true);
  syncAutoUi();
  syncSpeedUi();
  resize();
  bind();
  requestAnimationFrame(frame);
}

boot();
