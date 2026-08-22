'use strict';

/* 爬窗 — Crazy Climber remake. No CDN. */

var WORLD_W = 360;
var VIEW_H = 500;
var COLS = 4;
var COL_W = 58;
var BUILD_X = 64;
var FLOOR_H = 46;
var BASE = 42;
var LIVES = 3;
var MAX_STAGES = 3;
var PW = 12;
var PH = 20;
var INVULN = 1.05;
var DIE_T = 0.7;
var COMBO_WIN = 0.92;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var BEST_KEY = 'playbox-crazy-climb-best';
var MUTE_KEY = 'playbox-crazy-climb-mute';

var WK_NORMAL = 0;
var WK_STEEL = 1;
var WK_SIGN = 2;
var WK_POT = 3;

var SIGN_GLYPH = ['酒', '开', '夜', '電', 'HOT', 'BAR'];

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function rand(a, b) {
  return a + Math.random() * (b - a);
}
function rgba(rgb, a) {
  return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
}
function easeOut(u) {
  u = clamp(u, 0, 1);
  return 1 - Math.pow(1 - u, 3);
}
function makeRng(seed) {
  var a = seed | 0;
  return function () {
    a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function floorY(f) {
  return BASE + f * FLOOR_H;
}
function colCenter(c) {
  return BUILD_X + c * COL_W + COL_W * 0.5;
}
function floorCount(kind, round) {
  if (kind === 'gale') return 22;
  return 16 + Math.max(0, round - 1) * 2;
}
function hazardMulFor(kind, round) {
  if (kind === 'gale') return 1.78;
  return 1 + Math.max(0, round - 1) * 0.24;
}
function comboMul(n) {
  return 1 + Math.max(0, n - 1) * 0.2;
}
function lungeDur(dir, kind) {
  var t = dir === 'side' ? 0.12 : dir === 'down' ? 0.18 : 0.23;
  if (kind === 'gale') t *= 0.88;
  return t;
}

function makeWindow(kind, rng) {
  return {
    kind: kind,
    open: 0,
    phase: 'wait',
    wait: 0.6 + rng() * 2.2,
    stay: 0.65 + rng() * 1.15,
    spark: 0,
    sparkT: rng() * 2.4,
    potT: 1.4 + rng() * 2.8,
    hasPot: kind === WK_POT,
    glow: rng(),
    glyph: SIGN_GLYPH[(rng() * SIGN_GLYPH.length) | 0]
  };
}

function makeBuilding(kind, round, seed) {
  var rng = makeRng(seed);
  var n = floorCount(kind, round);
  var grid = [];
  var f, c, row, k, nEarly, i;
  var gale = kind === 'gale';
  for (f = 0; f < n; f++) {
    row = [];
    for (c = 0; c < COLS; c++) {
      k = WK_NORMAL;
      if (f <= 1 || f >= n - 1) k = WK_STEEL;
      else if (f % 5 === 3 && (c === 0 || c === 3)) k = WK_POT;
      else if (f % 4 === 2 && c === (f * 2 + 1) % COLS) k = WK_SIGN;
      else if (f % 7 === 4 && c === 1 + (f % 2)) k = WK_SIGN;
      else if (rng() < 0.1) k = WK_STEEL;
      row[c] = makeWindow(k, rng);
      if (k === WK_STEEL) {
        row[c].open = 0;
        row[c].phase = 'wait';
        row[c].wait = 99;
      }
    }
    if (f > 2 && f < n - 2) {
      nEarly = gale ? 2 : 1;
      if (f > 9 && rng() < 0.5) nEarly += 1;
      for (i = 0; i < nEarly; i++) {
        c = (f * 3 + i * 2) % COLS;
        if (row[c].kind === WK_STEEL) continue;
        row[c].wait = 0.15 + rng() * 0.7;
      }
    }
    grid[f] = row;
  }
  return { floors: n, grid: grid, seed: seed };
}

function makePlayer() {
  return {
    x: colCenter(1),
    y: floorY(0),
    col: 1,
    colI: 1,
    floor: 0,
    vx: 0,
    vy: 0,
    state: 'hang',
    lunge: '',
    fromCol: 1,
    toCol: 1,
    fromFl: 0,
    toFl: 0,
    t: 0,
    dur: 0.2,
    busy: 0,
    inv: 0,
    deadT: 0,
    boardT: 0,
    squash: 1,
    stretch: 1,
    grab: 0,
    phase: 0,
    face: 1,
    why: ''
  };
}

function makeHeli(floors) {
  return {
    x: BUILD_X + COLS * COL_W * 0.5,
    y: floorY(floors) + 28,
    bob: 0,
    rotor: 0
  };
}

function makeCondor() {
  return { live: false, x: -40, y: 200, vx: 90, face: 1, flap: 0, t: 0 };
}

function winAt(grid, c, f) {
  if (f < 0 || f >= grid.length) return null;
  c = clamp(c | 0, 0, COLS - 1);
  return grid[f][c];
}
function isOpen(w) {
  return !!(w && w.open > 0.52);
}
function isShock(w) {
  return !!(w && w.kind === WK_SIGN && w.spark > 0.55);
}
function isBad(w) {
  return isOpen(w) || isShock(w);
}
function openCount(row) {
  var c, n = 0;
  if (!row) return 0;
  for (c = 0; c < COLS; c++) if (isOpen(row[c])) n++;
  return n;
}
function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
function playerBox(p) {
  return { x: p.x - PW * 0.42, y: p.y + 2, w: PW * 0.84, h: PH - 3 };
}

function selfCheck() {
  var b, g, i, p;
  if (COLS !== 4) throw new Error('4 cols');
  if (LIVES !== 3) throw new Error('3 lives');
  if (MAX_STAGES !== 3) throw new Error('3 stages');
  if (Math.abs(floorY(1) - floorY(0) - FLOOR_H) > 0.01) throw new Error('floor spacing');
  if (colCenter(0) <= BUILD_X) throw new Error('col center');
  if (colCenter(COLS - 1) >= BUILD_X + COLS * COL_W) throw new Error('last col');
  b = makeBuilding('stages', 1, 198);
  if (b.floors !== 16) throw new Error('stage1 floors ' + b.floors);
  for (i = 0; i < COLS; i++) {
    if (b.grid[0][i].kind !== WK_STEEL) throw new Error('floor0 steel');
    if (b.grid[1][i].kind !== WK_STEEL) throw new Error('floor1 steel');
    if (isOpen(b.grid[0][i])) throw new Error('steel closed');
  }
  if (b.grid[b.floors - 1][0].kind !== WK_STEEL) throw new Error('roof steel');
  g = makeBuilding('gale', 1, 7);
  if (g.floors !== 22) throw new Error('gale floors');
  if (hazardMulFor('gale', 1) <= hazardMulFor('stages', 1)) throw new Error('gale faster');
  if (floorCount('stages', 3) <= floorCount('stages', 1)) throw new Error('stages grow');
  if (comboMul(1) !== 1) throw new Error('combo1');
  if (comboMul(5) <= comboMul(2)) throw new Error('combo scales');
  p = makePlayer();
  if (p.floor !== 0 || p.colI !== 1) throw new Error('spawn');
  if (p.y !== floorY(0)) throw new Error('spawn y');
  if (lungeDur('up', 'gale') >= lungeDur('up', 'stages')) throw new Error('gale lunge');
  if (winAt(b.grid, 9, 0).kind !== WK_STEEL) throw new Error('clamp col');
  if (isBad(b.grid[0][0])) throw new Error('start safe');
}

selfCheck();

if (typeof document === 'undefined') {
  /* node --check / node js/game.js */
} else {

var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d', { alpha: false });
var stageEl = document.getElementById('stage');
var overlayEl = document.getElementById('overlay');
var panelEl = document.getElementById('panel');
var ovTitle = document.getElementById('ov-title');
var ovLead = document.getElementById('ov-lead');
var ovOps = document.getElementById('ov-ops');
var ovStart = document.getElementById('ov-start');
var ovEnd = document.getElementById('ov-end');
var ovRetry = document.getElementById('ov-retry');
var btnStages = document.getElementById('btn-stages');
var btnGale = document.getElementById('btn-gale');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnLeft = document.getElementById('btn-left');
var btnRight = document.getElementById('btn-right');
var btnUp = document.getElementById('btn-up');
var btnDown = document.getElementById('btn-down');
var scoreEl = document.getElementById('score');
var roundEl = document.getElementById('round');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var climbBar = document.getElementById('climb-bar');
var pipsEl = document.getElementById('pips');
var toastEl = document.getElementById('toast');
var hintEl = document.getElementById('hint');
var motionQ = window.matchMedia('(prefers-reduced-motion: reduce)');
var coarseQ = window.matchMedia('(pointer: coarse)');

var dpr = 1;
var cssW = 0;
var cssH = 0;
var L = { x: 0, y: 0, s: 1 };
var lastTs = 0;
var acc = 0;
var hidden = false;
var toastTok = 0;
var addTok = 0;
var kickTok = 0;

var particles = [];
var sparks = [];
var floats = [];
var rings = [];
var shards = [];
var rain = [];
var stars = [];

var keys = { l: false, r: false, u: false, d: false };

var G = {
  mode: 'title',
  kind: 'stages',
  round: 1,
  clock: 0,
  lives: LIVES,
  score: 0,
  bestS: 0,
  bestG: 0,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  player: makePlayer(),
  grid: [],
  floors: 16,
  pots: [],
  condor: makeCondor(),
  heli: makeHeli(16),
  camY: 0,
  maxH: 0,
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flash: 0,
  flashRgb: [30, 200, 255],
  lock: 0,
  why: '',
  lastSafe: { col: 1, floor: 0 },
  seed: 198,
  birdT: 3.2,
  potSpawn: 1.6,
  taught: false
};

function reduceMotion() {
  return motionQ.matches;
}

function hazardMul() {
  return hazardMulFor(G.kind, G.round);
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
      this.master.gain.value = this.muted ? 0 : 0.36;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  setMuted: function (m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.36;
    btnMute.textContent = m ? '静' : '声';
    btnMute.classList.toggle('muted', m);
    btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
    try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) { /* ignore */ }
  },
  beep: function (freq, dur, type, vol, slide) {
    if (!this.ctx || this.muted) return;
    var t = this.ctx.currentTime;
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
      var buf = this.ctx.createBuffer(1, (sr * 0.32) | 0, sr);
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
  grab: function (combo) {
    this.ensure();
    var p = 1 + Math.min(10, combo) * 0.07;
    this.beep(240 * p, 0.045, 'square', 0.05, 520 * p);
    this.beep(380 * p, 0.07, 'triangle', 0.04, 760 * p);
    this.noise(0.04, 0.04, 1600, 'highpass');
  },
  reach: function () {
    this.ensure();
    this.beep(210, 0.04, 'sine', 0.028, 340);
  },
  smash: function (combo) {
    this.ensure();
    var p = 1 + Math.min(6, combo) * 0.05;
    this.noise(0.12, 0.14, 2100, 'highpass');
    this.noise(0.09, 0.08, 320, 'lowpass');
    this.beep(480 * p, 0.07, 'triangle', 0.055, 180);
  },
  shock: function () {
    this.ensure();
    this.noise(0.14, 0.12, 2800, 'highpass');
    this.beep(880, 0.08, 'sawtooth', 0.05, 140);
    this.beep(220, 0.16, 'square', 0.04, 70);
  },
  bird: function () {
    this.ensure();
    this.beep(620, 0.07, 'sawtooth', 0.04, 280);
    this.beep(420, 0.1, 'triangle', 0.035, 180);
  },
  dodge: function (combo) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.06;
    this.beep(520 * p, 0.06, 'square', 0.045, 880 * p);
  },
  warn: function () {
    this.ensure();
    this.beep(740, 0.04, 'square', 0.03, 520);
  },
  heli: function () {
    this.ensure();
    this.beep(392, 0.1, 'square', 0.06, 523);
    this.beep(523, 0.12, 'square', 0.055, 659);
    this.beep(784, 0.22, 'triangle', 0.05, 1046);
  },
  die: function () {
    this.ensure();
    this.noise(0.16, 0.11, 280, 'lowpass');
    this.beep(320, 0.22, 'sawtooth', 0.06, 70);
    this.beep(180, 0.18, 'square', 0.04, 50);
  },
  over: function () {
    this.ensure();
    this.beep(196, 0.18, 'sawtooth', 0.05, 98);
    this.beep(130, 0.28, 'square', 0.04, 60);
  },
  ui: function () {
    this.ensure();
    this.beep(640, 0.05, 'square', 0.035, 420);
  },
  combo: function (n) {
    this.ensure();
    this.beep(440 + n * 40, 0.08, 'square', 0.05, 880 + n * 50);
  },
  start: function () {
    this.ensure();
    this.beep(330, 0.08, 'square', 0.04, 440);
    this.beep(440, 0.1, 'triangle', 0.04, 660);
  }
};

try {
  if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
} catch (e) { /* ignore */ }

function currentBest() {
  return G.kind === 'gale' ? G.bestG : G.bestS;
}

function loadBest() {
  try {
    var s = localStorage.getItem(BEST_KEY);
    var o = JSON.parse(s);
    if (o && typeof o === 'object') {
      G.bestS = (o.s | 0) || (o.c | 0);
      G.bestG = (o.g | 0) || (o.w | 0) || (o.e | 0);
      return;
    }
    if (typeof o === 'number') {
      G.bestS = o | 0;
      G.bestG = o | 0;
    }
  } catch (e) { /* ignore */ }
}

function persistBest() {
  var cur = currentBest();
  if (G.score > cur) {
    if (G.kind === 'gale') G.bestG = G.score;
    else G.bestS = G.score;
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ s: G.bestS, g: G.bestG }));
  } catch (e) { /* ignore */ }
}

loadBest();

/* ---- fx ---- */
function hitStop(t) {
  if (reduceMotion()) return;
  if (t > G.stop) G.stop = t;
}

function shake(n) {
  if (reduceMotion()) return;
  G.shake = Math.max(G.shake, n);
}

function kick(kind) {
  if (reduceMotion()) return;
  G.kickX = (Math.random() < 0.5 ? -1 : 1) * (kind === 'die' ? 5 : 3);
  G.kickY = kind === 'die' ? 4 : kind === 'smash' ? 3 : -2.4;
  stageEl.classList.remove('hop', 'smash', 'die', 'clear');
  void stageEl.offsetWidth;
  stageEl.classList.add(kind || 'hop');
  clearTimeout(kickTok);
  kickTok = setTimeout(function () {
    stageEl.classList.remove('hop', 'smash', 'die', 'clear');
  }, 360);
}

function flash(rgb, t) {
  G.flashRgb = rgb;
  G.flash = t;
}

function burst(x, y, n, rgb, spd, life, grav) {
  var i;
  for (i = 0; i < n; i++) {
    particles.push({
      x: x, y: y,
      vx: rand(-1, 1) * spd,
      vy: rand(-0.2, 1.2) * spd,
      t: life * rand(0.6, 1.2),
      max: life,
      r: rand(1.1, 2.6),
      rgb: rgb,
      g: grav == null ? 220 : grav
    });
  }
}

function spark(x, y, n, rgb) {
  var i, a;
  for (i = 0; i < n; i++) {
    a = rand(0, TAU);
    sparks.push({
      x: x, y: y,
      vx: Math.cos(a) * rand(40, 180),
      vy: Math.sin(a) * rand(40, 180),
      t: rand(0.12, 0.3),
      rgb: rgb
    });
  }
}

function shardBurst(x, y, rgb) {
  var i;
  for (i = 0; i < 10; i++) {
    shards.push({
      x: x + rand(-6, 6),
      y: y + rand(-4, 4),
      vx: rand(-110, 110),
      vy: rand(30, 190),
      rot: rand(0, TAU),
      vr: rand(-12, 12),
      t: rand(0.38, 0.72),
      w: rand(3.2, 7.5),
      h: rand(2.2, 4.6),
      rgb: rgb
    });
  }
}

function ringAt(x, y, rgb) {
  rings.push({ x: x, y: y, r: 4, t: 0, rgb: rgb });
}

function floatTxt(x, y, text, rgb) {
  floats.push({ x: x, y: y, text: text, t: 0, rgb: rgb || [255, 227, 107] });
}

function toast(msg, warn, gold) {
  toastEl.textContent = msg;
  toastEl.classList.toggle('warn', !!warn);
  toastEl.classList.toggle('gold', !!gold);
  toastEl.classList.remove('hidden');
  clearTimeout(toastTok);
  toastTok = setTimeout(function () { toastEl.classList.add('hidden'); }, 1100);
}

function addScore(n, x, y, label) {
  var v = n | 0;
  if (v <= 0) return;
  G.score += v;
  scoreEl.textContent = String(G.score);
  scoreBox.classList.remove('flash');
  void scoreBox.offsetWidth;
  scoreBox.classList.add('flash');
  scoreAdd.hidden = false;
  scoreAdd.textContent = '+' + v;
  clearTimeout(addTok);
  addTok = setTimeout(function () { scoreAdd.hidden = true; }, 700);
  if (x != null) floatTxt(x, y + 16, label || ('+' + v), [255, 227, 107]);
  persistBest();
  bestEl.textContent = String(currentBest());
}

function bumpCombo() {
  G.combo += 1;
  if (G.combo > G.maxCombo) G.maxCombo = G.combo;
  G.comboAge = 0;
  comboEl.textContent = '×' + G.combo;
  comboBox.classList.toggle('hot', G.combo >= 2);
  if (G.combo >= 2) audio.combo(G.combo);
}

function dropCombo() {
  if (G.combo > 0) {
    G.combo = 0;
    comboEl.textContent = '×1';
    comboBox.classList.remove('hot');
  }
}

function renderPips() {
  var i, s = '';
  for (i = 0; i < LIVES; i++) {
    s += '<i class="pip ' + (i < G.lives ? 'on' : 'gone') + '"></i>';
  }
  pipsEl.innerHTML = s;
}

function syncFill() {
  var t = G.floors <= 0 ? 0 : clamp(G.player.floor / G.floors, 0, 1);
  climbBar.style.transform = 'scaleX(' + t + ')';
  climbBar.classList.toggle('hot', t > 0.72);
}

function hudPlay() {
  scoreEl.textContent = String(G.score);
  bestEl.textContent = String(currentBest());
  roundEl.textContent = String(G.kind === 'gale' ? G.player.floor : G.round);
  comboEl.textContent = '×' + Math.max(1, G.combo);
  renderPips();
  modeLabel.textContent = G.kind === 'gale' ? '狂风' : '登楼';
  modeLabel.classList.toggle('gale', G.kind === 'gale');
  syncFill();
  if (G.mode === 'play') {
    hintEl.textContent = G.kind === 'gale'
      ? '窗开得更快 · 花盆更密 · 神鹰更凶'
      : '按住上扒窗 · 躲开开窗和花盆 · 爬到顶上直升机';
  }
}

function resetFx() {
  particles.length = 0;
  sparks.length = 0;
  floats.length = 0;
  rings.length = 0;
  shards.length = 0;
  G.stop = 0;
  G.shake = 0;
  G.kickX = 0;
  G.kickY = 0;
  G.flash = 0;
}

function seedStars() {
  var i, rng = makeRng(1980);
  stars.length = 0;
  for (i = 0; i < 42; i++) {
    stars.push({
      x: rng() * WORLD_W,
      y: rng() * 900,
      r: 0.5 + rng() * 1.3,
      a: 0.25 + rng() * 0.55,
      p: rng() * TAU
    });
  }
}

function seedRain() {
  var i;
  rain.length = 0;
  for (i = 0; i < 56; i++) {
    rain.push({
      x: rand(0, WORLD_W),
      y: rand(0, VIEW_H + 80),
      v: rand(220, 380),
      len: rand(8, 16)
    });
  }
}

function resetWorld(kind, round, attract) {
  var seed = kind === 'stages' ? (198 + round * 17) : (0xC11B ^ (Date.now() & 0xffff) ^ (round * 31));
  var m = makeBuilding(kind, round, seed);
  G.kind = kind;
  G.round = round;
  G.seed = seed;
  G.grid = m.grid;
  G.floors = m.floors;
  G.pots = [];
  G.condor = makeCondor();
  G.heli = makeHeli(m.floors);
  G.player = makePlayer();
  G.camY = 0;
  G.maxH = 0;
  G.combo = 0;
  G.comboAge = 0;
  G.birdT = kind === 'gale' ? 1.6 : 3.4;
  G.potSpawn = kind === 'gale' ? 0.9 : 1.5;
  G.lastSafe = { col: 1, floor: 0 };
  G.lock = 0;
  if (!attract) resetFx();
}

function showTitle() {
  G.mode = 'title';
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel';
  ovTitle.textContent = '爬窗';
  ovLead.textContent = '双手扒楼，躲开突然打开的窗、砸下来的花盆和带电招牌。爬到顶上直升机。';
  ovOps.textContent = '方向键或 WASD 爬 · 按住上扒窗，左右换列 · 触屏左 下 上 右 · R 重开 · M 静音';
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
  hintEl.textContent = '按住上扒窗 · 躲开开窗和花盆 · 爬到顶上直升机';
  resetWorld('stages', 1, true);
  G.kind = 'stages';
  hudPlay();
}

function whyText(w) {
  if (w === 'pot') return '砸到花盆';
  if (w === 'shock') return '电着了';
  if (w === 'bird') return '被神鹰撞了';
  if (w === 'fall') return '掉下去了';
  return '';
}

function showOver(win) {
  G.mode = 'over';
  persistBest();
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel ' + (win ? 'win' : 'lose');
  ovTitle.textContent = win ? '登机' : '命尽';
  ovLead.textContent = (G.kind === 'gale' ? '狂风 ' : ('第' + G.round + '栋 ')) +
    G.score + ' 分 · 高度 ' + G.maxH + ' · 连扒最高 ×' + G.maxCombo +
    (G.why && !win ? ' · ' + whyText(G.why) : '');
  ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
  if (win) audio.heli();
  else audio.over();
  ovRetry.focus();
}

function startRun(kind) {
  G.kind = kind;
  G.mode = 'play';
  G.clock = 0;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  G.maxCombo = 0;
  G.comboAge = 0;
  G.why = '';
  G.lock = 0;
  G.taught = false;
  resetWorld(kind, 1, false);
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  panelEl.className = 'panel';
  audio.start();
  hudPlay();
  toast(kind === 'gale' ? '狂风 · 花盆更密' : '登楼 · 三栋楼', false, kind !== 'gale');
  canvas.focus({ preventScroll: true });
}

function retry() {
  audio.ui();
  if (G.mode === 'title') startRun('stages');
  else startRun(G.kind);
}

function nextStage() {
  var p;
  if (G.kind === 'gale' || G.round >= MAX_STAGES) {
    G.why = '';
    showOver(true);
    return;
  }
  G.round += 1;
  p = G.player;
  addScore(400 + 80 * G.round, p.x, p.y, '下一栋');
  resetWorld(G.kind, G.round, false);
  G.player.inv = 0.35;
  hudPlay();
  toast('第' + G.round + '栋', false, true);
  audio.start();
}

/* ---- world sim ---- */
function tickWindows(dt) {
  var spd = hazardMul();
  var f, c, w, row, openN;
  var openSp = 0.42 / spd;
  var closeSp = 0.36 / spd;
  for (f = 0; f < G.grid.length; f++) {
    row = G.grid[f];
    openN = openCount(row);
    for (c = 0; c < COLS; c++) {
      w = row[c];
      if (w.kind === WK_STEEL) {
        w.open = 0;
        continue;
      }
      if (w.kind === WK_SIGN) {
        w.sparkT += dt * spd;
        if (w.sparkT < 1.55) w.spark = 0;
        else if (w.sparkT < 1.78) {
          if (w.spark === 0 && G.mode === 'play') audio.warn();
          w.spark = (w.sparkT - 1.55) / 0.23;
        } else if (w.sparkT < 2.22) {
          w.spark = 1;
          if (Math.random() < 0.18) {
            spark(colCenter(c) + rand(-8, 8), floorY(f) + 18, 2, [255, 227, 107]);
          }
        } else {
          w.spark = 0;
          w.sparkT = rand(0, 0.4);
        }
      }
      if (w.phase === 'wait') {
        w.wait -= dt * spd;
        if (w.wait <= 0) {
          if (openN >= 2) {
            w.wait = 0.35 + Math.random() * 0.5;
          } else {
            w.phase = 'open';
            openN++;
          }
        }
      } else if (w.phase === 'open') {
        w.open += dt / Math.max(0.16, openSp);
        if (w.open >= 1) {
          w.open = 1;
          w.phase = 'stay';
          w.stay = (G.kind === 'gale' ? 0.45 : 0.7) + Math.random() * 0.7;
        }
      } else if (w.phase === 'stay') {
        w.stay -= dt * spd;
        if (w.stay <= 0) w.phase = 'close';
      } else if (w.phase === 'close') {
        w.open -= dt / Math.max(0.14, closeSp);
        if (w.open <= 0) {
          w.open = 0;
          w.phase = 'wait';
          w.wait = (G.kind === 'gale' ? 0.7 : 1.15) + Math.random() * 1.6;
        }
      }
      if (w.kind === WK_POT && G.mode === 'play') {
        w.potT -= dt * spd;
        if (w.potT <= 0 && w.hasPot && f > G.player.floor) {
          if (G.pots.length < (G.kind === 'gale' ? 7 : 4)) {
            spawnPot(c, floorY(f) + 22);
            w.hasPot = false;
            w.potT = (G.kind === 'gale' ? 1.15 : 2.1) + Math.random() * 1.8;
          } else {
            w.potT = 0.4;
          }
        }
        if (!w.hasPot && w.potT < 0.2) {
          w.hasPot = true;
        }
      }
    }
  }
}

function spawnPot(col, y) {
  G.pots.push({
    col: col,
    x: colCenter(col) + rand(-5, 5),
    y: y,
    vy: G.kind === 'gale' ? -70 : -46,
    rot: rand(0, TAU),
    vr: rand(-10, 10),
    passed: false,
    dead: false
  });
}

function smashPot(pot, reason) {
  var rgb = [196, 92, 48];
  pot.dead = true;
  shardBurst(pot.x, pot.y, rgb);
  burst(pot.x, pot.y, 10, rgb, 80, 0.42, 240);
  burst(pot.x, pot.y, 6, [255, 160, 120], 50, 0.24, 80);
  spark(pot.x, pot.y, 5, [255, 227, 107]);
  if (reason === 'hit') {
    hitStop(0.07);
    kick('smash');
    audio.smash(G.combo);
  } else {
    hitStop(0.05);
    kick('smash');
    audio.smash(1);
    shake(0.45);
  }
}

function tickPots(dt) {
  var i, pot, p, pb, col, fy, maxP;
  var grav = G.kind === 'gale' ? 540 : 390;
  var maxV = G.kind === 'gale' ? 300 : 220;
  p = G.player;
  pb = playerBox(p);
  maxP = G.kind === 'gale' ? 7 : 4;
  if (G.mode === 'play' && p.state !== 'board') {
    G.potSpawn -= dt * hazardMul();
    if (G.potSpawn <= 0 && G.pots.length < maxP && p.floor >= 2) {
      col = (Math.random() * COLS) | 0;
      fy = p.floor + 3 + ((Math.random() * 4) | 0);
      if (fy >= G.floors) fy = G.floors - 1;
      if (fy > p.floor) spawnPot(col, floorY(fy) + 24);
      G.potSpawn = (G.kind === 'gale' ? 0.72 : 1.35) + Math.random() * 0.7;
    }
  }
  for (i = G.pots.length - 1; i >= 0; i--) {
    pot = G.pots[i];
    if (pot.dead) {
      G.pots.splice(i, 1);
      continue;
    }
    pot.vy -= grav * dt;
    if (pot.vy < -maxV) pot.vy = -maxV;
    pot.y += pot.vy * dt;
    pot.rot += pot.vr * dt;
    if (G.mode === 'play' && p.state !== 'dead' && p.state !== 'board' && p.inv <= 0) {
      if (overlap(pb.x, pb.y, pb.w, pb.h, pot.x - 7, pot.y - 6, 14, 12)) {
        smashPot(pot, 'hit');
        kill('pot');
        continue;
      }
    }
    if (!pot.passed && pot.y < p.y - 6 && G.mode === 'play' && p.state !== 'dead') {
      pot.passed = true;
      if (pot.col === p.colI) {
        bumpCombo();
        addScore(Math.round(80 * comboMul(G.combo)), p.x, p.y + 10, '险');
        ringAt(p.x, p.y + 12, [255, 227, 107]);
        audio.dodge(G.combo);
      }
    }
    if (pot.y < BASE - 8) {
      if (Math.abs(pot.y - p.y) < VIEW_H * 0.7) smashPot(pot, 'ground');
      else pot.dead = true;
    }
  }
}

function tickCondor(dt) {
  var b = G.condor;
  var p = G.player;
  var spd, pb;
  G.birdT -= dt;
  if (!b.live && G.birdT <= 0 && G.mode !== 'over') {
    if (p.floor >= (G.kind === 'gale' ? 3 : 5) || G.mode === 'title') {
      b.live = true;
      b.face = Math.random() < 0.5 ? 1 : -1;
      b.x = b.face > 0 ? -28 : WORLD_W + 28;
      b.y = p.y + rand(18, 46);
      b.vx = b.face * ((G.kind === 'gale' ? 120 : 86) + G.round * 8);
      b.flap = 0;
      b.t = 0;
      G.birdT = (G.kind === 'gale' ? 2.4 : 4.2) + Math.random() * 1.6;
    } else {
      G.birdT = 0.8;
    }
  }
  if (!b.live) return;
  b.t += dt;
  b.flap += dt * 10;
  spd = G.kind === 'gale' ? 1.15 : 1;
  b.x += b.vx * dt * spd;
  b.y += Math.sin(b.t * 3.2) * 18 * dt;
  if (G.mode === 'play' && p.state !== 'dead' && p.state !== 'board' && p.inv <= 0) {
    pb = playerBox(p);
    if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - 12, b.y - 7, 24, 14)) {
      audio.bird();
      burst(p.x, p.y + 10, 12, [255, 227, 107], 90, 0.4, 40);
      kill('bird');
    }
  }
  if (b.x < -40 || b.x > WORLD_W + 40) b.live = false;
}

function tickHeli(dt) {
  var h = G.heli;
  h.bob += dt * 2.2;
  h.rotor += dt * (18 + (G.player.state === 'board' ? 10 : 0));
  h.y = floorY(G.floors) + 28 + Math.sin(h.bob) * 4;
  if (G.player.state === 'board') {
    h.x += (G.player.x - h.x) * Math.min(1, dt * 6);
  } else {
    h.x = BUILD_X + COLS * COL_W * 0.5 + Math.sin(G.clock * 0.7) * 36;
  }
}

function grabSnap() {
  var p = G.player;
  var n, rgb;
  p.squash = 0.76;
  p.stretch = 1.24;
  p.grab = 1;
  G.lastSafe = { col: p.colI, floor: p.floor };
  if (p.floor > G.maxH) G.maxH = p.floor;
  bumpCombo();
  n = Math.round(50 * comboMul(G.combo));
  rgb = G.combo >= 6 ? [255, 227, 107] : [30, 200, 255];
  addScore(n, p.x, p.y, null);
  burst(p.x, p.y + 4, 8 + Math.min(8, G.combo), rgb, 55 + G.combo * 4, 0.32, 80);
  spark(p.x, p.y + 14, 4 + Math.min(6, G.combo), [255, 255, 255]);
  ringAt(p.x, p.y + 10, rgb);
  hitStop(0.032 + Math.min(0.02, G.combo * 0.002));
  kick('hop');
  audio.grab(G.combo);
  if (G.combo === 8) toast('疯了', false, true);
  if (G.combo === 14) toast('飞檐走壁', false, true);
  syncFill();
  roundEl.textContent = String(G.kind === 'gale' ? p.floor : G.round);
}

function startLunge(dir, dcol, dfl) {
  var p = G.player;
  var toCol, toFl;
  if (p.state !== 'hang' && p.state !== 'climb') return false;
  if (p.busy > 0 && p.lunge) return false;
  toCol = clamp(p.colI + dcol, 0, COLS - 1);
  toFl = p.floor + dfl;
  if (toFl < 0) return false;
  if (dir === 'side' && toCol === p.colI) return false;
  p.state = 'climb';
  p.lunge = dir;
  p.fromCol = p.col;
  p.fromFl = p.floor;
  p.toCol = toCol;
  p.toFl = toFl;
  p.t = 0;
  p.dur = lungeDur(dir, G.kind);
  p.busy = p.dur;
  if (dcol) p.face = dcol;
  if (dir !== 'side' && G.mode === 'play') audio.reach();
  return true;
}

function finishLunge() {
  var p = G.player;
  var w;
  p.col = p.toCol;
  p.colI = p.toCol;
  p.floor = p.toFl;
  p.x = colCenter(p.colI);
  p.y = p.floor >= G.floors ? floorY(G.floors) : floorY(p.floor);
  p.lunge = '';
  p.busy = 0.045;
  p.state = 'hang';
  if (p.floor >= G.floors) {
    if (G.mode === 'play') boardHeli();
    else {
      p.floor = 0;
      p.colI = 1;
      p.col = 1;
      p.x = colCenter(1);
      p.y = floorY(0);
    }
    return;
  }
  w = winAt(G.grid, p.colI, p.floor);
  if (G.mode === 'play' && p.inv <= 0) {
    if (isOpen(w)) {
      kill('fall');
      return;
    }
    if (isShock(w)) {
      kill('shock');
      return;
    }
  }
  if (G.mode !== 'play') {
    G.lastSafe = { col: p.colI, floor: p.floor };
    return;
  }
  if (p.toFl !== p.fromFl && p.toFl > p.fromFl) grabSnap();
  else if (p.toFl !== p.fromFl) {
    G.lastSafe = { col: p.colI, floor: p.floor };
    p.squash = 1.12;
    p.stretch = 0.9;
    audio.reach();
  } else {
    G.lastSafe = { col: p.colI, floor: p.floor };
    p.squash = 0.9;
    p.stretch = 1.08;
    burst(p.x, p.y, 4, [30, 200, 255], 28, 0.18, 40);
    if (p.inv <= 0 && isBad(w)) {
      if (isShock(w)) kill('shock');
      else kill('fall');
    }
  }
}

function boardHeli() {
  var p = G.player;
  if (p.state === 'board') return;
  p.state = 'board';
  p.boardT = 0;
  p.inv = 9;
  dropCombo();
  addScore(1500 + 220 * G.round + 120 * G.lives, p.x, p.y + 20, '登机');
  burst(p.x, p.y + 16, 18, [0, 240, 255], 90, 0.5, 60);
  burst(p.x, p.y + 16, 10, [255, 227, 107], 70, 0.4, 40);
  ringAt(p.x, p.y + 20, [255, 227, 107]);
  hitStop(0.06);
  kick('clear');
  flash([30, 200, 255], 0.35);
  audio.heli();
  toast('登机！', false, true);
}

function kill(why) {
  var p = G.player;
  if (G.mode !== 'play') return;
  if (p.state === 'dead' || p.state === 'board') return;
  if (p.inv > 0) return;
  p.state = 'dead';
  p.deadT = DIE_T;
  p.why = why;
  p.vy = why === 'pot' ? 50 : 90;
  p.lunge = '';
  G.why = why;
  dropCombo();
  hitStop(0.08);
  shake(1);
  kick('die');
  if (why === 'shock') {
    flash([255, 227, 107], 0.5);
    spark(p.x, p.y + 12, 18, [255, 227, 107]);
    spark(p.x, p.y + 12, 10, [0, 240, 255]);
    audio.shock();
  } else {
    flash([255, 61, 184], 0.45);
    burst(p.x, p.y + 8, 14, [255, 61, 184], 90, 0.45, 80);
    audio.die();
  }
}

function respawn() {
  var p = G.player;
  var s = G.lastSafe;
  G.lives -= 1;
  renderPips();
  if (G.lives <= 0) {
    showOver(false);
    return;
  }
  p.state = 'hang';
  p.colI = s.col;
  p.col = s.col;
  p.floor = s.floor;
  p.x = colCenter(p.colI);
  p.y = floorY(p.floor);
  p.inv = INVULN;
  p.vy = 0;
  p.lunge = '';
  p.busy = 0.12;
  p.deadT = 0;
  toast(whyText(G.why) + ' · 剩' + G.lives + '命', true, false);
}

function chooseAttract() {
  var p = G.player;
  var f, c, w, best, dc;
  if (p.floor >= G.floors - 1) {
    p.colI = 1;
    p.col = 1;
    p.floor = 0;
    p.x = colCenter(1);
    p.y = floorY(0);
    p.state = 'hang';
    p.lunge = '';
    p.busy = 0.2;
    G.camY = 0;
    return;
  }
  f = p.floor + 1;
  w = winAt(G.grid, p.colI, f);
  if (w && !isBad(w)) {
    startLunge('up', 0, 1);
    return;
  }
  best = -1;
  for (c = 0; c < COLS; c++) {
    w = winAt(G.grid, c, f);
    if (w && !isBad(w)) {
      if (best < 0 || Math.abs(c - p.colI) < Math.abs(best - p.colI)) best = c;
    }
  }
  if (best < 0) {
    for (c = 0; c < COLS; c++) {
      w = winAt(G.grid, c, p.floor);
      if (w && !isBad(w) && c !== p.colI) { best = c; break; }
    }
  }
  if (best >= 0 && best !== p.colI) {
    dc = best > p.colI ? 1 : -1;
    startLunge('side', dc, 0);
  } else if (w && !isOpen(w)) {
    startLunge('up', 0, 1);
  }
}

function tickPlayer(dt) {
  var p = G.player;
  var w, u, e;
  p.inv = Math.max(0, p.inv - dt);
  p.busy = Math.max(0, p.busy - dt);
  p.grab = Math.max(0, p.grab - dt * 3.4);
  p.phase += dt * (p.lunge === 'up' ? 14 : 6);
  p.squash += (1 - p.squash) * Math.min(1, dt * 12);
  p.stretch += (1 - p.stretch) * Math.min(1, dt * 12);

  if (p.state === 'board') {
    p.boardT += dt;
    p.y += dt * 22;
    p.x += (G.heli.x - p.x) * Math.min(1, dt * 4);
    if (p.boardT > 1.05 && G.lock <= 0) {
      G.lock = 1;
      nextStage();
    }
    return;
  }

  if (p.state === 'dead') {
    p.deadT -= dt;
    p.vy -= 520 * dt;
    p.y += p.vy * dt;
    p.x += p.face * 18 * dt;
    if (p.deadT <= 0) respawn();
    return;
  }

  if (p.lunge) {
    p.t += dt;
    u = clamp(p.t / p.dur, 0, 1);
    e = easeOut(u);
    if (p.lunge === 'side') {
      p.col = lerp(p.fromCol, p.toCol, e);
      p.x = colCenter(p.col);
      p.y = floorY(p.fromFl) + Math.sin(u * Math.PI) * 3;
    } else {
      p.y = lerp(floorY(p.fromFl), p.toFl >= G.floors ? floorY(G.floors) : floorY(p.toFl), e);
      p.y += Math.sin(u * Math.PI) * 4;
      p.x = colCenter(p.colI);
    }
    if (u >= 1) finishLunge();
    return;
  }

  p.x = colCenter(p.colI);
  p.y = floorY(Math.min(p.floor, G.floors));

  if (G.mode === 'play' && p.inv <= 0 && p.floor < G.floors) {
    w = winAt(G.grid, p.colI, p.floor);
    if (isOpen(w)) {
      kill('fall');
      return;
    }
    if (isShock(w)) {
      kill('shock');
      return;
    }
  }

  if (G.mode === 'title') {
    if (p.busy <= 0) chooseAttract();
    return;
  }

  if (G.mode !== 'play') return;
  if (p.busy > 0) return;

  if (keys.u) startLunge('up', 0, 1);
  else if (keys.d && p.floor > 0) startLunge('down', 0, -1);
  else if (keys.l) startLunge('side', -1, 0);
  else if (keys.r) startLunge('side', 1, 0);
}

function tickCam(dt) {
  var p = G.player;
  var target = p.y - VIEW_H * 0.38;
  if (target < 0) target = 0;
  var maxCam = Math.max(0, floorY(G.floors) + 80 - VIEW_H);
  if (target > maxCam) target = maxCam;
  if (target > G.camY) G.camY += (target - G.camY) * Math.min(1, 0.14 + dt * 2);
  else G.camY += (target - G.camY) * 0.08;
  if (G.camY < 0) G.camY = 0;
}

function tickFx(dt) {
  var i, o;
  G.comboAge += dt;
  if (G.comboAge > COMBO_WIN && G.combo > 0 && G.player.state === 'hang' && !keys.u) {
    dropCombo();
  }
  G.shake *= Math.pow(0.04, dt);
  G.kickX *= Math.pow(0.02, dt);
  G.kickY *= Math.pow(0.02, dt);
  G.flash = Math.max(0, G.flash - dt * 1.8);

  for (i = particles.length - 1; i >= 0; i--) {
    o = particles[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.vy -= o.g * dt;
    o.y += o.vy * dt;
    if (o.t <= 0) particles.splice(i, 1);
  }
  for (i = sparks.length - 1; i >= 0; i--) {
    o = sparks[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.vy -= 120 * dt;
    if (o.t <= 0) sparks.splice(i, 1);
  }
  for (i = floats.length - 1; i >= 0; i--) {
    o = floats[i];
    o.t += dt;
    o.y += 28 * dt;
    if (o.t > 0.7) floats.splice(i, 1);
  }
  for (i = rings.length - 1; i >= 0; i--) {
    o = rings[i];
    o.t += dt;
    o.r += 70 * dt;
    if (o.t > 0.35) rings.splice(i, 1);
  }
  for (i = shards.length - 1; i >= 0; i--) {
    o = shards[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.vy -= 280 * dt;
    o.y += o.vy * dt;
    o.rot += o.vr * dt;
    if (o.t <= 0) shards.splice(i, 1);
  }
  for (i = 0; i < rain.length; i++) {
    o = rain[i];
    o.y -= o.v * dt;
    o.x -= (G.kind === 'gale' ? 70 : 18) * dt;
    if (o.y < G.camY - 20) {
      o.y = G.camY + VIEW_H + rand(0, 40);
      o.x = rand(-20, WORLD_W + 20);
    }
    if (o.x < -20) o.x += WORLD_W + 40;
  }
}

function tick(dt) {
  G.clock += dt;
  tickWindows(dt);
  tickPots(dt);
  tickCondor(dt);
  tickHeli(dt);
  tickPlayer(dt);
  tickCam(dt);
  tickFx(dt);
}

/* ---- draw ---- */
function resize() {
  var rect = stageEl.getBoundingClientRect();
  cssW = rect.width;
  cssH = rect.height;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, (cssW * dpr) | 0);
  canvas.height = Math.max(1, (cssH * dpr) | 0);
  var padB = coarseQ.matches ? 62 : 10;
  var avW = cssW;
  var avH = Math.max(40, cssH - padB);
  var s = Math.min(avW / WORLD_W, avH / VIEW_H);
  L.s = s;
  L.x = (avW - WORLD_W * s) / 2;
  L.y = Math.max(4, (avH - VIEW_H * s) / 2);
}

function sx(x) { return L.x + x * L.s; }
function sy(y) { return L.y + (VIEW_H - (y - G.camY)) * L.s; }

function drawBg() {
  var g, i, o, y, bx, bw, bh, k, wx, wy;
  ctx.fillStyle = '#070314';
  ctx.fillRect(0, 0, cssW, cssH);

  g = ctx.createLinearGradient(0, sy(G.camY + VIEW_H), 0, sy(G.camY));
  g.addColorStop(0, 'rgba(10, 24, 48, 0.55)');
  g.addColorStop(0.45, 'rgba(8, 6, 22, 0)');
  g.addColorStop(1, 'rgba(4, 2, 12, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  g = ctx.createRadialGradient(sx(70), sy(G.camY + VIEW_H * 0.88), 8, sx(70), sy(G.camY + VIEW_H * 0.88), 210 * L.s);
  g.addColorStop(0, 'rgba(30,200,255,0.16)');
  g.addColorStop(1, 'rgba(30,200,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  g = ctx.createRadialGradient(sx(300), sy(G.camY + VIEW_H * 0.92), 8, sx(300), sy(G.camY + VIEW_H * 0.92), 170 * L.s);
  g.addColorStop(0, 'rgba(255,61,184,0.1)');
  g.addColorStop(1, 'rgba(255,61,184,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  /* moon */
  ctx.beginPath();
  ctx.fillStyle = 'rgba(230, 244, 255, 0.85)';
  ctx.arc(sx(292), sy(G.camY + VIEW_H * 0.86), 16 * L.s, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = '#070314';
  ctx.arc(sx(300), sy(G.camY + VIEW_H * 0.88), 13 * L.s, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#fff';
  for (i = 0; i < stars.length; i++) {
    o = stars[i];
    y = (o.y + G.camY * 0.12) % 900;
    ctx.globalAlpha = o.a * (0.65 + 0.35 * Math.sin(G.clock * 1.4 + o.p));
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(G.camY + y * 0.55), o.r * L.s, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  /* far city */
  for (i = 0; i < 9; i++) {
    bx = (i * 46 - 12) - (G.camY * 0.04) % 46;
    bw = 22 + (i % 3) * 8;
    bh = 70 + ((i * 17) % 90);
    ctx.fillStyle = i % 2 ? 'rgba(12, 22, 40, 0.9)' : 'rgba(16, 18, 38, 0.88)';
    ctx.fillRect(sx(bx), sy(G.camY + bh * 0.35), bw * L.s, bh * L.s);
    ctx.fillStyle = 'rgba(30,200,255,0.18)';
    for (k = 0; k < 5; k++) {
      wx = bx + 4 + (k % 2) * 8;
      wy = 18 + k * 14;
      ctx.globalAlpha = 0.25 + 0.35 * ((i + k) % 3 === 0 ? 1 : 0.4);
      ctx.fillRect(sx(wx), sy(G.camY + wy), 3.2 * L.s, 3.2 * L.s);
    }
    ctx.globalAlpha = 1;
  }
}

function drawStreet() {
  var y0 = BASE - 18;
  var i, x;
  if (sy(0) < 0 || sy(y0 + 40) > cssH) {
    /* still draw if visible */
  }
  ctx.fillStyle = '#0a0814';
  ctx.fillRect(sx(-20), sy(y0), (WORLD_W + 40) * L.s, 80 * L.s);
  ctx.fillStyle = 'rgba(30,200,255,0.18)';
  ctx.fillRect(sx(-20), sy(y0 + 2), (WORLD_W + 40) * L.s, 2 * L.s);
  ctx.fillStyle = 'rgba(255,227,107,0.35)';
  for (i = 0; i < 5; i++) {
    x = 24 + i * 78;
    ctx.fillRect(sx(x), sy(y0 - 1), 18 * L.s, 2 * L.s);
  }
  /* tiny car */
  x = 40 + (G.clock * 22) % (WORLD_W + 60);
  ctx.fillStyle = '#ff3db8';
  ctx.fillRect(sx(x), sy(y0 + 10), 22 * L.s, 8 * L.s);
  ctx.fillStyle = '#1ec8ff';
  ctx.fillRect(sx(x + 4), sy(y0 + 16), 5 * L.s, 3 * L.s);
  ctx.fillRect(sx(x + 13), sy(y0 + 16), 5 * L.s, 3 * L.s);
}

function drawBuilding() {
  var x0 = BUILD_X - 8;
  var w = COLS * COL_W + 16;
  var y0 = BASE - 8;
  var y1 = floorY(G.floors) + 18;
  var g, f, yy, c, brick;

  g = ctx.createLinearGradient(sx(x0), 0, sx(x0 + w), 0);
  g.addColorStop(0, '#0c1730');
  g.addColorStop(0.08, '#142448');
  g.addColorStop(0.5, '#1a2c52');
  g.addColorStop(0.92, '#142448');
  g.addColorStop(1, '#0c1730');
  ctx.fillStyle = g;
  ctx.fillRect(sx(x0), sy(y1), w * L.s, (y1 - y0) * L.s);

  ctx.strokeStyle = 'rgba(30,200,255,0.22)';
  ctx.lineWidth = Math.max(1, 1.4 * L.s);
  ctx.strokeRect(sx(x0), sy(y1), w * L.s, (y1 - y0) * L.s);

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = Math.max(1, 0.7 * L.s);
  for (f = 0; f <= G.floors; f++) {
    yy = floorY(f);
    ctx.beginPath();
    ctx.moveTo(sx(x0), sy(yy));
    ctx.lineTo(sx(x0 + w), sy(yy));
    ctx.stroke();
  }
  for (c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(sx(BUILD_X + c * COL_W), sy(y1));
    ctx.lineTo(sx(BUILD_X + c * COL_W), sy(y0));
    ctx.stroke();
  }

  /* brick dashes */
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  for (f = 0; f < G.floors; f++) {
    yy = floorY(f) + FLOOR_H * 0.5;
    if (yy < G.camY - 10 || yy > G.camY + VIEW_H + 10) continue;
    for (brick = 0; brick < 8; brick++) {
      ctx.beginPath();
      ctx.moveTo(sx(x0 + 6 + brick * 30 + (f % 2) * 12), sy(yy));
      ctx.lineTo(sx(x0 + 22 + brick * 30 + (f % 2) * 12), sy(yy));
      ctx.stroke();
    }
  }

  /* cornice */
  ctx.fillStyle = '#1ec8ff';
  ctx.globalAlpha = 0.55;
  ctx.fillRect(sx(x0 - 6), sy(y1 + 8), (w + 12) * L.s, 6 * L.s);
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,227,107,0.45)';
  ctx.fillRect(sx(x0 + 20), sy(y1 + 16), 18 * L.s, 22 * L.s);
  ctx.fillStyle = 'rgba(0,240,255,0.35)';
  ctx.fillRect(sx(x0 + w - 36), sy(y1 + 28), 6 * L.s, 36 * L.s);
}

function drawWindows() {
  var f0, f1, f, c, w, rx, ry, rw, rh, open, pane, glow, signOn;
  f0 = Math.max(0, Math.floor((G.camY - BASE) / FLOOR_H) - 1);
  f1 = Math.min(G.floors - 1, Math.ceil((G.camY + VIEW_H - BASE) / FLOOR_H) + 1);
  for (f = f0; f <= f1; f++) {
    for (c = 0; c < COLS; c++) {
      w = G.grid[f][c];
      rx = BUILD_X + c * COL_W + 8;
      ry = floorY(f) + 8;
      rw = COL_W - 16;
      rh = FLOOR_H - 14;
      open = w.open;
      /* frame */
      ctx.fillStyle = w.kind === WK_STEEL ? '#3a5a78' : '#1ec8ff';
      ctx.globalAlpha = w.kind === WK_STEEL ? 0.55 : 0.85;
      ctx.fillRect(sx(rx - 2), sy(ry + rh + 2), (rw + 4) * L.s, (rh + 4) * L.s);
      ctx.globalAlpha = 1;
      /* hole */
      ctx.fillStyle = open > 0.08 ? 'rgba(8, 2, 16, 0.92)' : '#071018';
      ctx.fillRect(sx(rx), sy(ry + rh), rw * L.s, rh * L.s);
      if (open < 0.97) {
        pane = rh * (1 - open);
        glow = w.kind === WK_SIGN
          ? (w.spark > 0.2 ? 'rgba(255,227,107,0.85)' : 'rgba(255, 180, 60, 0.45)')
          : (w.kind === WK_STEEL ? 'rgba(80, 140, 180, 0.28)' : rgba(
            w.glow > 0.5 ? [255, 210, 120] : [120, 230, 255],
            0.42 + 0.2 * Math.sin(G.clock * 1.3 + w.glow * 8)
          ));
        ctx.fillStyle = glow;
        ctx.fillRect(sx(rx + 1), sy(ry + rh), (rw - 2) * L.s, pane * L.s);
        ctx.strokeStyle = 'rgba(8, 16, 28, 0.45)';
        ctx.lineWidth = Math.max(1, 0.8 * L.s);
        ctx.beginPath();
        ctx.moveTo(sx(rx + rw * 0.5), sy(ry + rh));
        ctx.lineTo(sx(rx + rw * 0.5), sy(ry + rh - pane));
        ctx.moveTo(sx(rx), sy(ry + rh - pane * 0.5));
        ctx.lineTo(sx(rx + rw), sy(ry + rh - pane * 0.5));
        ctx.stroke();
      }
      if (open > 0.4) {
        ctx.strokeStyle = 'rgba(255,61,184,0.55)';
        ctx.lineWidth = Math.max(1, 1.2 * L.s);
        ctx.strokeRect(sx(rx), sy(ry + rh), rw * L.s, rh * L.s);
      }
      /* sill */
      ctx.fillStyle = '#7af6ff';
      ctx.globalAlpha = 0.7;
      ctx.fillRect(sx(rx - 3), sy(ry + 2), (rw + 6) * L.s, 3.2 * L.s);
      ctx.globalAlpha = 1;

      if (w.kind === WK_SIGN) {
        signOn = w.spark;
        ctx.save();
        ctx.globalAlpha = 0.45 + signOn * 0.55;
        ctx.fillStyle = signOn > 0.55 ? '#ffe36b' : '#1ec8ff';
        ctx.font = (7.5 * L.s) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(w.glyph, sx(rx + rw * 0.5), sy(ry + rh * 0.55));
        ctx.restore();
        if (signOn > 0.55) {
          ctx.strokeStyle = rgba([255, 227, 107], 0.7);
          ctx.lineWidth = Math.max(1, 1.4 * L.s);
          ctx.strokeRect(sx(rx - 1), sy(ry + rh + 1), (rw + 2) * L.s, (rh + 2) * L.s);
        }
      }
      if (w.kind === WK_POT && w.hasPot) {
        drawPotSprite(colCenter(c) + 10, floorY(f) + 10, 0);
      }
    }
  }
}

function drawSideNeon() {
  var labels = ['百戏', '夜', '開'], i, y;
  for (i = 0; i < labels.length; i++) {
    y = BASE + 70 + i * 130;
    if (y < G.camY - 20 || y > G.camY + VIEW_H + 20) continue;
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.35 * Math.sin(G.clock * 2 + i);
    ctx.fillStyle = i === 1 ? '#ff3db8' : '#00f0ff';
    ctx.font = (11 * L.s) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], sx(BUILD_X - 22), sy(y));
    ctx.fillText(labels[i], sx(BUILD_X + COLS * COL_W + 22), sy(y + 40));
    ctx.restore();
  }
}

function drawPotSprite(x, y, rot) {
  ctx.save();
  ctx.translate(sx(x), sy(y));
  ctx.rotate(-rot);
  ctx.scale(L.s, L.s);
  ctx.fillStyle = '#c45a28';
  ctx.beginPath();
  ctx.moveTo(-6, 4);
  ctx.lineTo(6, 4);
  ctx.lineTo(4.2, -5);
  ctx.lineTo(-4.2, -5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff3db8';
  ctx.beginPath();
  ctx.arc(0, -7.2, 3.1, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffe36b';
  ctx.beginPath();
  ctx.arc(-2.4, -6.2, 1.6, 0, TAU);
  ctx.arc(2.4, -6.2, 1.6, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawPots() {
  var i, p;
  for (i = 0; i < G.pots.length; i++) {
    p = G.pots[i];
    if (p.dead) continue;
    drawPotSprite(p.x, p.y, p.rot);
  }
}

function drawCondor() {
  var b = G.condor, flap, s;
  if (!b.live) return;
  flap = Math.sin(b.flap) * 10;
  s = L.s;
  ctx.save();
  ctx.translate(sx(b.x), sy(b.y));
  ctx.scale(b.face * s, s);
  ctx.fillStyle = '#ffe36b';
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 5.2, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff3db8';
  ctx.beginPath();
  ctx.moveTo(-2, 0);
  ctx.quadraticCurveTo(-8, -12 - flap, -18, -4 + flap * 0.3);
  ctx.quadraticCurveTo(-8, -2, -2, 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.quadraticCurveTo(10, -11 + flap, 18, -3 - flap * 0.3);
  ctx.quadraticCurveTo(8, -2, 2, 2);
  ctx.fill();
  ctx.fillStyle = '#00f0ff';
  ctx.beginPath();
  ctx.arc(6, -1, 1.4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff8a4a';
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(15, -1.5);
  ctx.lineTo(10, 2);
  ctx.fill();
  ctx.restore();
}

function drawHeli() {
  var h = G.heli, s = L.s, blade;
  if (h.y < G.camY - 30 || h.y > G.camY + VIEW_H + 40) return;
  ctx.save();
  ctx.translate(sx(h.x), sy(h.y));
  ctx.scale(s, s);
  blade = Math.cos(h.rotor) * 22;
  ctx.strokeStyle = 'rgba(0,240,255,0.85)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-blade, -12);
  ctx.lineTo(blade, -12);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,227,107,0.7)';
  ctx.beginPath();
  ctx.moveTo(-blade * 0.3, -12);
  ctx.lineTo(blade * 0.3, -12);
  ctx.stroke();
  ctx.fillStyle = '#1ec8ff';
  ctx.beginPath();
  ctx.ellipse(0, -2, 16, 7, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff3db8';
  ctx.fillRect(-4, -6, 8, 4);
  ctx.fillStyle = '#0a2030';
  ctx.beginPath();
  ctx.ellipse(4, -2, 5, 3.4, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#ffe36b';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-16, -2);
  ctx.lineTo(-26, -6);
  ctx.moveTo(0, 5);
  ctx.lineTo(-6, 12);
  ctx.moveTo(0, 5);
  ctx.lineTo(6, 12);
  ctx.stroke();
  ctx.restore();
}

function drawPlayer() {
  var p = G.player, s, blink, arm, aL, aR, reach;
  s = L.s;
  blink = p.inv > 0 && ((p.inv * 18) | 0) % 2 === 0;
  if (blink && p.state !== 'board') return;
  reach = p.lunge === 'up' ? 8 : p.grab * 4;
  arm = Math.sin(p.phase) * 5;
  aL = -10 - reach + (p.lunge === 'side' && p.face < 0 ? -6 : 0) + arm;
  aR = 10 + reach + (p.lunge === 'side' && p.face > 0 ? 6 : 0) - arm;
  ctx.save();
  ctx.translate(sx(p.x), sy(p.y + PH * 0.45));
  ctx.scale(s * p.stretch, s * p.squash);
  if (p.state === 'dead') ctx.rotate(0.6);
  /* legs */
  ctx.strokeStyle = '#00c8e8';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-3, 6);
  ctx.lineTo(-4, 14 + Math.sin(p.phase * 1.3) * 2);
  ctx.moveTo(3, 6);
  ctx.lineTo(5, 14 - Math.sin(p.phase * 1.3) * 2);
  ctx.stroke();
  /* body */
  ctx.fillStyle = p.state === 'dead' ? '#ff9ad4' : '#ff3db8';
  ctx.beginPath();
  ctx.rect(-5.5, -6, 11, 13);
  ctx.fill();
  /* arms */
  ctx.strokeStyle = '#ffe36b';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-5, -2);
  ctx.lineTo(aL, -11 - (p.lunge === 'up' ? 4 : 0));
  ctx.moveTo(5, -2);
  ctx.lineTo(aR, -11 - (p.lunge === 'up' ? 3 : 0));
  ctx.stroke();
  ctx.fillStyle = '#ffe36b';
  ctx.beginPath();
  ctx.arc(aL, -11, 1.8, 0, TAU);
  ctx.arc(aR, -11, 1.8, 0, TAU);
  ctx.fill();
  /* head */
  ctx.fillStyle = '#ffd0b8';
  ctx.beginPath();
  ctx.arc(0, -11, 5.1, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#1ec8ff';
  ctx.beginPath();
  ctx.ellipse(0, -13.2, 5.4, 2.4, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#071018';
  ctx.beginPath();
  ctx.arc(p.face * 1.6, -10.6, 1.05, 0, TAU);
  ctx.fill();
  if (p.grab > 0.3) {
    ctx.strokeStyle = rgba([0, 240, 255], p.grab);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, -4, 14, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRain() {
  var i, o;
  if (G.kind !== 'gale' && G.mode !== 'title') return;
  ctx.strokeStyle = G.kind === 'gale' ? 'rgba(160, 220, 255, 0.28)' : 'rgba(160,220,255,0.08)';
  ctx.lineWidth = Math.max(1, 0.9 * L.s);
  ctx.beginPath();
  for (i = 0; i < rain.length; i++) {
    o = rain[i];
    ctx.moveTo(sx(o.x), sy(o.y));
    ctx.lineTo(sx(o.x + 4), sy(o.y + o.len));
  }
  ctx.stroke();
}

function drawFx() {
  var i, o, a;
  for (i = 0; i < rings.length; i++) {
    o = rings[i];
    a = 1 - o.t / 0.35;
    ctx.strokeStyle = rgba(o.rgb, a * 0.85);
    ctx.lineWidth = Math.max(1, 1.6 * L.s);
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), o.r * L.s, 0, TAU);
    ctx.stroke();
  }
  for (i = 0; i < particles.length; i++) {
    o = particles[i];
    a = clamp(o.t / (o.max || 0.4), 0, 1);
    ctx.fillStyle = rgba(o.rgb, a);
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), o.r * L.s, 0, TAU);
    ctx.fill();
  }
  for (i = 0; i < sparks.length; i++) {
    o = sparks[i];
    ctx.strokeStyle = rgba(o.rgb, clamp(o.t / 0.22, 0, 1));
    ctx.lineWidth = Math.max(1, 1.2 * L.s);
    ctx.beginPath();
    ctx.moveTo(sx(o.x), sy(o.y));
    ctx.lineTo(sx(o.x - o.vx * 0.03), sy(o.y - o.vy * 0.03));
    ctx.stroke();
  }
  for (i = 0; i < shards.length; i++) {
    o = shards[i];
    ctx.save();
    ctx.translate(sx(o.x), sy(o.y));
    ctx.rotate(o.rot);
    ctx.globalAlpha = clamp(o.t / 0.5, 0, 1);
    ctx.fillStyle = rgba(o.rgb, 1);
    ctx.fillRect(-o.w * 0.5 * L.s, -o.h * 0.5 * L.s, o.w * L.s, o.h * L.s);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.font = (10 * L.s) + 'px sans-serif';
  ctx.textAlign = 'center';
  for (i = 0; i < floats.length; i++) {
    o = floats[i];
    ctx.fillStyle = rgba(o.rgb, 1 - o.t / 0.7);
    ctx.fillText(o.text, sx(o.x), sy(o.y));
  }
}

function drawFlash() {
  var g;
  if (G.flash <= 0) return;
  ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.28);
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(G.player.x), sy(G.player.y + 10), 4, sx(G.player.x), sy(G.player.y + 10), 120 * L.s);
  g.addColorStop(0, rgba(G.flashRgb, G.flash * 0.35));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);
}

function draw() {
  var shx = 0, shy = 0;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  if (G.shake > 0.02) {
    shx = (Math.random() - 0.5) * G.shake * 8;
    shy = (Math.random() - 0.5) * G.shake * 6;
  }
  ctx.save();
  ctx.translate(G.kickX + shx, G.kickY + shy);
  drawBg();
  drawRain();
  drawStreet();
  drawBuilding();
  drawWindows();
  drawSideNeon();
  drawHeli();
  drawPots();
  drawCondor();
  drawPlayer();
  drawFx();
  ctx.restore();
  drawFlash();
}

function frame(ts) {
  var dt, steps;
  if (!lastTs) lastTs = ts;
  dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (dt > 0.08) dt = 0.08;
  if (!hidden) {
    if (G.stop > 0) {
      G.stop -= dt;
      tickFx(dt);
    } else {
      acc += dt;
      steps = 0;
      while (acc >= STEP && steps < 5) {
        tick(STEP);
        acc -= STEP;
        steps++;
      }
      if (acc > STEP * 4) acc = 0;
    }
  }
  draw();
  requestAnimationFrame(frame);
}

/* ---- input ---- */
function bindPad(el, setter) {
  function down(ev) {
    ev.preventDefault();
    setter(true);
    el.classList.add('held');
    audio.ensure();
    try { el.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
  }
  function up(ev) {
    ev.preventDefault();
    setter(false);
    el.classList.remove('held');
  }
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('lostpointercapture', function () {
    setter(false);
    el.classList.remove('held');
  });
}

bindPad(btnLeft, function (v) { keys.l = v; });
bindPad(btnRight, function (v) { keys.r = v; });
bindPad(btnUp, function (v) { keys.u = v; });
bindPad(btnDown, function (v) { keys.d = v; });

function keyOn(e, down) {
  var k = e.code;
  if (k === 'ArrowLeft' || k === 'KeyA') { keys.l = down; e.preventDefault(); }
  else if (k === 'ArrowRight' || k === 'KeyD') { keys.r = down; e.preventDefault(); }
  else if (k === 'ArrowDown' || k === 'KeyS') { keys.d = down; e.preventDefault(); }
  else if (k === 'ArrowUp' || k === 'KeyW' || k === 'Space') {
    keys.u = down;
    e.preventDefault();
  }
}

window.addEventListener('keydown', function (e) {
  if (e.repeat) {
    keyOn(e, true);
    return;
  }
  audio.ensure();
  if (e.code === 'KeyM') {
    audio.setMuted(!audio.muted);
    e.preventDefault();
    return;
  }
  if (e.code === 'KeyR') {
    retry();
    e.preventDefault();
    return;
  }
  if (G.mode === 'title') {
    if (e.code === 'Digit1' || e.code === 'Enter' || e.code === 'Space') {
      startRun('stages');
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      startRun('gale');
      e.preventDefault();
      return;
    }
  }
  if (G.mode === 'over') {
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Digit1') {
      startRun(G.kind);
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      startRun(G.kind === 'gale' ? 'stages' : 'gale');
      e.preventDefault();
      return;
    }
  }
  keyOn(e, true);
});

window.addEventListener('keyup', function (e) { keyOn(e, false); });

btnMute.addEventListener('click', function () {
  audio.ensure();
  audio.setMuted(!audio.muted);
});
btnRetry.addEventListener('click', function () {
  audio.ensure();
  retry();
});
btnStages.addEventListener('click', function () {
  audio.ensure();
  startRun('stages');
});
btnGale.addEventListener('click', function () {
  audio.ensure();
  startRun('gale');
});
ovRetry.addEventListener('click', function () {
  audio.ensure();
  startRun(G.kind);
});

canvas.addEventListener('pointerdown', function () {
  audio.ensure();
  canvas.focus({ preventScroll: true });
});

window.addEventListener('resize', resize);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resize);
}
document.addEventListener('visibilitychange', function () {
  hidden = document.hidden;
  if (!hidden) {
    lastTs = 0;
    acc = 0;
  }
});

seedStars();
seedRain();
bestEl.textContent = String(G.bestS);
renderPips();
showTitle();
resize();
hudPlay();
modeLabel.textContent = '登楼';
requestAnimationFrame(frame);

}
