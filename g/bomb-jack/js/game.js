'use strict';

/* 炸跳 — Bomb Jack remake. No CDN. */

var WORLD_W = 480;
var WORLD_H = 360;
var LIVES = 3;
var WALL = 18;
var JACK_HW = 8;
var JACK_H = 20;
var WALK = 152;
var AIR_VX = 168;
var ACCEL_G = 980;
var ACCEL_A = 540;
var FRICT = 9.2;
var JUMP_V = 430;
var ULTRA_V = 560;
var GRAV = 780;
var FLAP_V = 92;
var FLAP_BOOST = 214;
var FLAP_CD = 0.11;
var MAX_FALL = 258;
var FAST_FALL = 410;
var BOMB_R = 7.2;
var COIN_R = 9.4;
var BIRD_R = 9;
var MUM_HW = 8;
var MUM_H = 16;
var COYOTE = 0.08;
var BUFFER = 0.12;
var INVULN = 1.55;
var DIE_T = 0.7;
var FREEZE_T = 5.2;
var BOOST_T = 7.4;
var COIN_LIFE = 8.5;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var BOMB_N = 20;
var BEST_KEY = 'playbox-bomb-jack-best';
var MUTE_KEY = 'playbox-bomb-jack-mute';
var AUTO_SPEED_KEY = 'playbox-bomb-jack-auto-speed';
var SPEED_LABELS = ['', '慢', '中', '快', '极快'];
var AUTO_SCALE = [1, 0.52, 0.78, 1, 3.4];

var GOLD = [255, 229, 106];
var HOT = [255, 210, 26];
var MAG = [255, 61, 184];
var CYN = [0, 240, 255];
var RED = [255, 74, 92];
var ORG = [255, 154, 40];
var WHT = [246, 243, 255];
var ICE = [122, 246, 255];

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
function hypot(x, y) {
  return Math.sqrt(x * x + y * y);
}
function jumpHeight(v, g) {
  return (v * v) / (2 * g);
}
function P(x, y, w, h) {
  return { x: x, y: y, w: w, h: h == null ? 10 : h };
}
function bombsFrom(plats, specs) {
  var out = [];
  var i, s, p;
  for (i = 0; i < specs.length; i++) {
    s = specs[i];
    p = plats[s[0]];
    out.push({
      x: p.x + p.w * s[1],
      y: p.y - (s.length > 2 ? s[2] : 9)
    });
  }
  return out;
}

function buildStages() {
  var s = [];
  var plats, bombs;

  plats = [
    P(18, 338, 444, 12),
    P(40, 272, 110),
    P(330, 272, 110),
    P(150, 208, 180),
    P(32, 144, 100),
    P(348, 144, 100),
    P(170, 80, 140)
  ];
  bombs = bombsFrom(plats, [
    [0, 0.06], [0, 0.2], [0, 0.34], [0, 0.66], [0, 0.8], [0, 0.94],
    [2, 0.28], [2, 0.72],
    [5, 0.28], [5, 0.72],
    [6, 0.78], [6, 0.5], [6, 0.22],
    [4, 0.72], [4, 0.28],
    [1, 0.72], [1, 0.28],
    [3, 0.18], [3, 0.5], [3, 0.82]
  ]);
  s.push({ name: '殿', plats: plats, bombs: bombs, spawn: { x: 240, y: 338 } });

  plats = [
    P(18, 338, 444, 12),
    P(56, 278, 72),
    P(56, 208, 72),
    P(56, 138, 72),
    P(204, 248, 72),
    P(204, 178, 72),
    P(204, 108, 72),
    P(352, 278, 72),
    P(352, 208, 72),
    P(352, 138, 72)
  ];
  bombs = bombsFrom(plats, [
    [0, 0.1], [0, 0.26], [0, 0.4], [0, 0.66], [0, 0.86],
    [1, 0.35], [1, 0.7],
    [2, 0.5],
    [3, 0.35], [3, 0.7],
    [4, 0.5],
    [5, 0.35], [5, 0.7],
    [6, 0.5],
    [7, 0.35], [7, 0.7],
    [8, 0.5],
    [9, 0.35], [9, 0.7],
    [6, 0.5, 36]
  ]);
  s.push({ name: '柱', plats: plats, bombs: bombs, spawn: { x: 240, y: 338 } });

  plats = [
    P(18, 338, 444, 12),
    P(36, 286, 92),
    P(108, 242, 92),
    P(180, 198, 92),
    P(252, 154, 92),
    P(324, 110, 92),
    P(380, 68, 78)
  ];
  bombs = bombsFrom(plats, [
    [0, 0.1], [0, 0.26], [0, 0.4], [0, 0.7], [0, 0.9],
    [1, 0.3], [1, 0.7],
    [2, 0.3], [2, 0.7],
    [3, 0.3], [3, 0.7],
    [4, 0.3], [4, 0.7],
    [5, 0.3], [5, 0.7],
    [6, 0.28], [6, 0.72],
    [3, 0.5, 40],
    [4, 0.5, 40],
    [1, 0.5, 36]
  ]);
  s.push({ name: '阶', plats: plats, bombs: bombs, spawn: { x: 240, y: 338 } });

  plats = [
    P(18, 338, 444, 12),
    P(80, 72, 320),
    P(32, 148, 88),
    P(32, 228, 88),
    P(360, 148, 88),
    P(360, 228, 88),
    P(176, 196, 128)
  ];
  bombs = bombsFrom(plats, [
    [0, 0.1], [0, 0.26], [0, 0.4], [0, 0.68], [0, 0.88],
    [3, 0.35], [3, 0.7],
    [5, 0.35], [5, 0.7],
    [4, 0.35], [4, 0.7],
    [1, 0.12], [1, 0.32], [1, 0.5], [1, 0.68], [1, 0.88],
    [2, 0.35], [2, 0.7],
    [6, 0.28], [6, 0.72]
  ]);
  s.push({ name: '环', plats: plats, bombs: bombs, spawn: { x: 240, y: 338 } });

  plats = [
    P(18, 338, 444, 12),
    P(48, 276, 100),
    P(48, 208, 100),
    P(48, 140, 100),
    P(48, 76, 100),
    P(332, 276, 100),
    P(332, 208, 100),
    P(332, 140, 100),
    P(332, 76, 100),
    P(168, 172, 144)
  ];
  bombs = bombsFrom(plats, [
    [0, 0.16], [0, 0.34], [0, 0.66], [0, 0.84],
    [1, 0.35], [1, 0.7],
    [2, 0.5],
    [3, 0.35], [3, 0.7],
    [4, 0.5],
    [9, 0.22], [9, 0.5], [9, 0.78],
    [5, 0.35], [5, 0.7],
    [6, 0.5],
    [7, 0.35], [7, 0.7],
    [8, 0.3], [8, 0.7]
  ]);
  s.push({ name: '塔', plats: plats, bombs: bombs, spawn: { x: 240, y: 338 } });

  plats = [
    P(18, 338, 444, 12),
    P(36, 250, 92),
    P(352, 250, 92),
    P(176, 186, 128),
    P(70, 110, 88),
    P(322, 110, 88)
  ];
  bombs = bombsFrom(plats, [
    [0, 0.1], [0, 0.26], [0, 0.4], [0, 0.66], [0, 0.88],
    [1, 0.3], [1, 0.7],
    [2, 0.3], [2, 0.7],
    [3, 0.2], [3, 0.5], [3, 0.8],
    [4, 0.3], [4, 0.7],
    [5, 0.3], [5, 0.7],
    [1, 0.5, 48],
    [2, 0.5, 48],
    [3, 0.5, 52],
    [0, 0.5, 70]
  ]);
  s.push({ name: '空', plats: plats, bombs: bombs, spawn: { x: 240, y: 338 } });

  return s;
}

var STAGES = buildStages();

function lightIndex(bombs) {
  var i;
  for (i = 0; i < bombs.length; i++) {
    if (!bombs[i].taken) return i;
  }
  return -1;
}

function bombsLeft(bombs) {
  var n = 0, i;
  for (i = 0; i < bombs.length; i++) if (!bombs[i].taken) n++;
  return n;
}

function bombPay(lit, combo) {
  if (!lit) return 100;
  return 100 + 100 * Math.min(8, Math.max(1, combo));
}

function roundBonus(litN) {
  if (litN >= 20) return 50000;
  if (litN >= 19) return 30000;
  if (litN >= 18) return 20000;
  if (litN >= 17) return 10000;
  if (litN >= 16) return 5000;
  return litN * 80;
}

function roundMul(round) {
  return 1 + Math.max(0, round - 1) * 0.12;
}

function birdSpeed(round, rush) {
  return (rush ? 96 : 68) * roundMul(round);
}

function mummySpeed(round, rush) {
  return (rush ? 62 : 48) * roundMul(round);
}

function birdCount(round, rush) {
  var n = 1 + Math.min(3, (round / 2) | 0);
  if (rush) n += 1;
  return n > 5 ? 5 : n;
}

function mummyCount(round, rush) {
  var n = round === 1 ? 1 : Math.min(3, 1 + (((round - 1) / 2) | 0));
  if (rush && round >= 2) n = Math.min(3, n + 1);
  return n;
}

function platLand(x, y, prevY, plats) {
  var i, p;
  for (i = 0; i < plats.length; i++) {
    p = plats[i];
    if (x < p.x - 2 || x > p.x + p.w + 2) continue;
    if (prevY <= p.y + 3 && y >= p.y && y <= p.y + 18) return i;
  }
  return -1;
}

function xOnPlat(p, x) {
  return x >= p.x - 2 && x <= p.x + p.w + 2;
}

function cloneBombs(src) {
  var out = [];
  var i, b;
  for (i = 0; i < src.length; i++) {
    b = src[i];
    out.push({ x: b.x, y: b.y, taken: false });
  }
  return out;
}

function makeJack(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    vx: 0,
    vy: 0,
    face: 1,
    grounded: true,
    plat: 0,
    walk: 0,
    coyote: 0,
    squash: 1,
    inv: 0,
    deadT: 0,
    flapCd: 0,
    flapT: 0,
    why: ''
  };
}

function makeBird(x, y, round, rush) {
  var dir = x < WORLD_W * 0.5 ? 1 : -1;
  return {
    kind: 'bird',
    x: x,
    y: y,
    vx: dir * birdSpeed(round, rush) * 0.4,
    vy: 20,
    r: BIRD_R,
    face: dir,
    flap: Math.random() * TAU,
    spawnT: 1.15
  };
}

function makeMummy(x, y, round, rush) {
  return {
    kind: 'mummy',
    x: x,
    y: y,
    vx: x < WORLD_W * 0.5 ? 30 : -30,
    vy: 0,
    grounded: true,
    plat: 0,
    face: x < WORLD_W * 0.5 ? 1 : -1,
    walk: 0,
    r: MUM_HW,
    spawnT: 1.15
  };
}

function makeCoin(kind, x, y) {
  return {
    kind: kind,
    x: x,
    y: y,
    vx: rand(-50, 50),
    vy: rand(-20, 30),
    bob: 0,
    life: COIN_LIFE
  };
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

function hitsJack(px, py, ex, ey, er) {
  var jx = px;
  var jy = py - JACK_H * 0.5;
  return hypot(jx - ex, jy - ey) < JACK_HW + er - 1;
}

function selfCheck() {
  var st, i, bombs, plats, h, uh, p, idx, pay, a, b, s0, floor;

  if (STAGES.length !== 6) throw new Error('6 stages');
  if (LIVES !== 3) throw new Error('3 lives');
  if (BOMB_N !== 20) throw new Error('20 bombs');
  if (BEST_KEY !== 'playbox-bomb-jack-best') throw new Error('best key');
  if (SPEED_LABELS.length !== 5 || SPEED_LABELS[3] !== '快') throw new Error('speed labels');
  if (AUTO_SCALE[3] !== 1 || AUTO_SCALE[4] <= AUTO_SCALE[3]) throw new Error('auto scale');
  if (FLAP_V >= JUMP_V) throw new Error('flap weaker than jump');
  if (FLAP_BOOST <= FLAP_V) throw new Error('boost flap stronger');
  if (ULTRA_V <= JUMP_V) throw new Error('ultra higher');
  if (FREEZE_T < 3 || BOOST_T < 4) throw new Error('power duration');

  h = jumpHeight(JUMP_V, GRAV);
  uh = jumpHeight(ULTRA_V, GRAV);
  if (h < 90 || h > 160) throw new Error('jump height window');
  if (uh < h + 40) throw new Error('ultra much higher');
  if (uh < 180) throw new Error('ultra reach');

  for (i = 0; i < STAGES.length; i++) {
    st = STAGES[i];
    if (!st.name) throw new Error('stage name');
    if (st.bombs.length !== BOMB_N) throw new Error('stage ' + i + ' bombs');
    if (st.plats.length < 3) throw new Error('stage ' + i + ' plats');
    if (st.plats[0].y !== 338) throw new Error('stage ' + i + ' floor');
    if (st.spawn.y !== st.plats[0].y) throw new Error('stage ' + i + ' spawn floor');
    if (Math.abs(st.spawn.x - 240) > 8) throw new Error('stage ' + i + ' spawn mid');
  }

  s0 = STAGES[0];
  plats = s0.plats;
  floor = plats[0];
  if (platLand(240, 338, 330, plats) !== 0) throw new Error('land floor');
  if (platLand(240, 40, 20, plats) !== -1) throw new Error('air no land');
  p = plats[3];
  if (platLand(p.x + 40, p.y, p.y - 12, plats) !== 3) throw new Error('land center');
  if (floor.y - p.y > uh + 12) throw new Error('ultra reach center plat');

  bombs = cloneBombs(s0.bombs);
  if (lightIndex(bombs) !== 0) throw new Error('first lit');
  bombs[0].taken = true;
  if (lightIndex(bombs) !== 1) throw new Error('next lit');
  bombs = cloneBombs(s0.bombs);
  bombs[5].taken = true;
  if (lightIndex(bombs) !== 0) throw new Error('unlit skip keeps first');
  if (bombsLeft(bombs) !== 19) throw new Error('left 19');

  if (bombPay(false, 0) !== 100) throw new Error('unlit 100');
  pay = bombPay(true, 1);
  if (pay !== 200) throw new Error('lit first 200');
  if (bombPay(true, 2) <= pay) throw new Error('chain pays more');
  if (bombPay(true, 9) !== bombPay(true, 8)) throw new Error('chain cap');
  if (roundBonus(20) <= roundBonus(16)) throw new Error('full bonus');
  if (roundBonus(16) < 5000) throw new Error('16 bonus');
  if (roundBonus(10) >= roundBonus(16)) throw new Error('low < 16');

  if (birdSpeed(1, true) <= birdSpeed(1, false)) throw new Error('rush birds faster');
  if (birdSpeed(3, false) <= birdSpeed(1, false)) throw new Error('round speeds birds');
  if (birdCount(1, true) <= birdCount(1, false)) throw new Error('rush more birds');
  if (mummySpeed(1, true) <= mummySpeed(1, false)) throw new Error('rush mummy');
  if (loadAutoSpeed() < 1 || loadAutoSpeed() > 4) throw new Error('auto speed range');

  a = makeJack(s0.spawn);
  if (!a.grounded || a.y !== 338) throw new Error('jack spawn');
  b = makeBird(40, 60, 1, false);
  if (b.kind !== 'bird') throw new Error('bird');
  if (!hitsJack(100, 100, 100, 90, 9)) throw new Error('hit overlap');
  if (hitsJack(100, 100, 180, 90, 9)) throw new Error('hit far');

  idx = lightIndex(cloneBombs(STAGES[5].bombs));
  if (idx !== 0) throw new Error('empty stage lit 0');
}

selfCheck();

if (typeof document === 'undefined') {
  /* node --check / selfCheck only */
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
var ovMenu = document.getElementById('ov-menu');
var btnStage = document.getElementById('btn-stage');
var btnRush = document.getElementById('btn-rush');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnAuto = document.getElementById('btn-auto');
var speedEl = document.getElementById('speed');
var speedLab = document.getElementById('speed-lab');
var btnLeft = document.getElementById('btn-left');
var btnRight = document.getElementById('btn-right');
var btnJump = document.getElementById('btn-jump');
var btnDown = document.getElementById('btn-down');
var scoreEl = document.getElementById('score');
var roundEl = document.getElementById('round');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var powerBar = document.getElementById('power-bar');
var powerLab = document.getElementById('power-lab');
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

var keys = { l: false, r: false, u: false, d: false };
var autoOn = false;
var autoSpeed = loadAutoSpeed();
var G = {
  mode: 'title',
  kind: 'stage',
  rush: false,
  clock: 0,
  round: 1,
  lives: LIVES,
  score: 0,
  bestS: 0,
  bestR: 0,
  combo: 0,
  maxCombo: 0,
  litN: 0,
  got: 0,
  player: makeJack(STAGES[0].spawn),
  plats: STAGES[0].plats,
  bombs: cloneBombs(STAGES[0].bombs),
  birds: [],
  mummies: [],
  coin: null,
  coinFlip: false,
  spawn: STAGES[0].spawn,
  stageName: STAGES[0].name,
  freeze: 0,
  boost: 0,
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flash: 0,
  flashRgb: HOT,
  lock: 0,
  jumpBuf: 0,
  why: '',
  paused: false
};

function reduceMotion() {
  return motionQ.matches;
}

function autoScale() {
  return AUTO_SCALE[autoSpeed] || 1;
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
  hop: function () {
    this.ensure();
    this.beep(290, 0.07, 'square', 0.05, 560);
    this.noise(0.04, 0.035, 1700, 'highpass');
  },
  flap: function () {
    this.ensure();
    this.beep(420, 0.045, 'triangle', 0.035, 280);
    this.noise(0.03, 0.03, 1400, 'highpass');
  },
  land: function () {
    this.ensure();
    this.noise(0.05, 0.045, 360, 'bandpass');
    this.beep(150, 0.04, 'sine', 0.028, 70);
  },
  ping: function (chain) {
    this.ensure();
    var p = 1 + Math.min(10, chain) * 0.06;
    this.beep(520 * p, 0.06, 'square', 0.07, 880 * p);
    this.beep(780 * p, 0.09, 'triangle', 0.04, 1180 * p);
  },
  chain: function (n) {
    this.ensure();
    var p = 1 + Math.min(8, n) * 0.07;
    this.beep(660 * p, 0.08, 'square', 0.07, 990 * p);
    this.beep(880 * p, 0.12, 'triangle', 0.05, 1320 * p);
    this.noise(0.05, 0.04, 2200, 'highpass');
  },
  dull: function () {
    this.ensure();
    this.beep(240, 0.06, 'square', 0.04, 160);
  },
  power: function (ice) {
    this.ensure();
    if (ice) {
      this.beep(880, 0.1, 'sine', 0.06, 440);
      this.beep(1320, 0.14, 'triangle', 0.04, 660);
    } else {
      this.beep(392, 0.08, 'square', 0.06, 784);
      this.beep(523, 0.12, 'triangle', 0.05, 1046);
    }
  },
  die: function () {
    this.ensure();
    this.noise(0.16, 0.11, 260, 'lowpass');
    this.beep(320, 0.22, 'sawtooth', 0.06, 70);
    this.beep(180, 0.18, 'square', 0.04, 50);
  },
  clear: function () {
    this.ensure();
    this.beep(392, 0.1, 'square', 0.06, 523);
    this.beep(523, 0.12, 'square', 0.055, 659);
    this.beep(784, 0.22, 'triangle', 0.05, 1046);
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

function loadBest() {
  try {
    var raw = localStorage.getItem(BEST_KEY);
    var o = JSON.parse(raw);
    if (o && typeof o === 'object') {
      G.bestS = o.s | 0;
      G.bestR = o.r | 0;
      return;
    }
    if (typeof o === 'number') {
      G.bestS = o | 0;
      G.bestR = o | 0;
    }
  } catch (e) { /* ignore */ }
}

function persistBest() {
  var cur = G.rush ? G.bestR : G.bestS;
  if (G.score > cur) {
    if (G.rush) G.bestR = G.score;
    else G.bestS = G.score;
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ s: G.bestS, r: G.bestR }));
  } catch (e) { /* ignore */ }
}

function currentBest() {
  return G.rush ? G.bestR : G.bestS;
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

function kick(x, y) {
  if (reduceMotion()) return;
  G.kickX += x;
  G.kickY += y;
}

function flash(rgb, t) {
  G.flashRgb = rgb;
  G.flash = Math.max(G.flash, t || 0.12);
}

function boardPulse(cls) {
  if (reduceMotion()) return;
  stageEl.classList.remove(cls);
  void stageEl.offsetWidth;
  stageEl.classList.add(cls);
  clearTimeout(kickTok);
  kickTok = setTimeout(function () {
    stageEl.classList.remove('die', 'hit', 'chain', 'clear');
  }, 360);
}

function burst(x, y, n, rgb, spd, life, r) {
  var i, a;
  for (i = 0; i < n; i++) {
    a = rand(0, TAU);
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(a) * rand(spd * 0.3, spd),
      vy: Math.sin(a) * rand(spd * 0.3, spd) - rand(10, 40),
      life: life,
      max: life,
      rgb: rgb,
      r: r || rand(1.4, 2.8)
    });
  }
}

function spark(x, y, rgb) {
  sparks.push({
    x: x,
    y: y,
    vx: rand(-40, 40),
    vy: rand(-90, -30),
    life: rand(0.18, 0.32),
    rgb: rgb
  });
}

function ring(x, y, rgb, r) {
  rings.push({ x: x, y: y, r: r || 6, life: 0.34, rgb: rgb });
}

function floatText(x, y, text, rgb) {
  floats.push({ x: x, y: y, text: text, rgb: rgb || GOLD, life: 0.7 });
}

function tickFx(dt) {
  var i, p, s, r, f;
  for (i = particles.length - 1; i >= 0; i--) {
    p = particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 420 * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (i = sparks.length - 1; i >= 0; i--) {
    s = sparks[i];
    s.life -= dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (s.life <= 0) sparks.splice(i, 1);
  }
  for (i = rings.length - 1; i >= 0; i--) {
    r = rings[i];
    r.life -= dt;
    r.r += 70 * dt;
    if (r.life <= 0) rings.splice(i, 1);
  }
  for (i = floats.length - 1; i >= 0; i--) {
    f = floats[i];
    f.life -= dt;
    f.y -= 28 * dt;
    if (f.life <= 0) floats.splice(i, 1);
  }
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 4.2);
  G.kickX *= Math.max(0, 1 - dt * 14);
  G.kickY *= Math.max(0, 1 - dt * 14);
  if (G.flash > 0) G.flash -= dt;
}

function toast(msg, warn, gold) {
  toastEl.textContent = msg;
  toastEl.classList.toggle('warn', !!warn);
  toastEl.classList.toggle('gold', !!gold && !warn);
  toastEl.classList.remove('hidden');
  clearTimeout(toastTok);
  toastTok = setTimeout(function () { toastEl.classList.add('hidden'); }, 980);
}

function flashScore(n) {
  scoreAdd.hidden = false;
  scoreAdd.textContent = '+' + n;
  scoreAdd.style.animation = 'none';
  void scoreAdd.offsetWidth;
  scoreAdd.style.animation = '';
  scoreBox.classList.remove('flash');
  void scoreBox.offsetWidth;
  scoreBox.classList.add('flash');
  clearTimeout(addTok);
  addTok = setTimeout(function () { scoreAdd.hidden = true; }, 700);
}

function addScore(n, x, y, label) {
  if (n <= 0) return;
  G.score += n;
  flashScore(n);
  persistBest();
  hudPlay();
  if (x != null) floatText(x, y - 16, label || ('+' + n), GOLD);
}

function bumpCombo() {
  if (G.combo > G.maxCombo) G.maxCombo = G.combo;
  comboEl.textContent = '×' + Math.max(1, G.combo);
  if (G.combo >= 2) {
    comboBox.classList.remove('hot');
    void comboBox.offsetWidth;
    comboBox.classList.add('hot');
  }
  if (G.combo === 5 || G.combo === 10 || G.combo === 15 || G.combo === 20) {
    audio.combo(G.combo);
    toast('连收 ×' + G.combo, false, true);
    flash(GOLD, 0.16);
    boardPulse('chain');
  }
}

function renderPips() {
  var html = '';
  var i;
  for (i = 0; i < LIVES; i++) {
    html += '<i class="pip ' + (i < G.lives ? 'on' : 'gone') + '"></i>';
  }
  pipsEl.innerHTML = html;
}

function syncPower() {
  var p = 0;
  var ice = false;
  if (G.freeze > 0) {
    p = clamp(G.freeze / FREEZE_T, 0, 1);
    ice = true;
    powerLab.textContent = '冻';
  } else if (G.boost > 0) {
    p = clamp(G.boost / BOOST_T, 0, 1);
    powerLab.textContent = '跳';
  } else {
    powerLab.textContent = '能';
  }
  powerBar.style.transform = 'scaleX(' + p + ')';
  powerBar.classList.toggle('on', p > 0.001);
  powerBar.classList.toggle('ice', ice);
}

function hudPlay() {
  scoreEl.textContent = String(G.score);
  roundEl.textContent = String(G.round);
  bestEl.textContent = String(currentBest());
  comboEl.textContent = '×' + Math.max(1, G.combo);
  renderPips();
  modeLabel.textContent = G.rush ? '连收' : '排弹';
  modeLabel.classList.toggle('rush', G.rush);
  syncPower();
  if (G.mode === 'play') {
    if (autoOn) {
      hintEl.textContent = G.rush
        ? '自动 · 连收 · 追亮弹 · A 停下'
        : '自动托管 · 追亮弹 · 空中拍翅悬停 · A 停下';
    } else {
      hintEl.textContent = G.rush
        ? '鸟更快 · 收亮的弹 · 空格跳，空中再按悬停'
        : '收亮的弹 · 空格跳，空中再按悬停 · 能力币：冻结或再跳';
    }
  }
}

function showTitle() {
  G.mode = 'title';
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel';
  ovTitle.textContent = '炸跳';
  ovLead.textContent = '跳得老高，按亮的炸弹收。连着收才有奖励。鸟和木乃伊会追，碰到就丢命。';
  ovOps.textContent = '← → / D 走 · 空格 / W 跳，空中再按悬停 · S 快落 · A 自动 · R 重开 · M 静音';
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
  hintEl.textContent = '收亮的弹 · 空格跳，空中再按悬停 · 能力币：冻结或再跳';
  resetLevel(true);
}

function showOver() {
  G.mode = 'over';
  persistBest();
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel lose';
  ovTitle.textContent = '命尽';
  ovLead.textContent = '第 ' + G.round + ' 关 · ' + G.score + ' 分 · 连收最高 ×' + G.maxCombo +
    (G.why ? ' · ' + whyText(G.why) : '');
  ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
  audio.over();
  ovRetry.focus();
}

function whyText(w) {
  if (w === 'bird') return '撞鸟了';
  if (w === 'mummy') return '撞木乃伊了';
  return '';
}

function resetFx() {
  particles.length = 0;
  sparks.length = 0;
  floats.length = 0;
  rings.length = 0;
  G.stop = 0;
  G.shake = 0;
  G.kickX = 0;
  G.kickY = 0;
  G.flash = 0;
}

function stageOf(round) {
  return STAGES[(round - 1) % STAGES.length];
}

function resetLevel(attract) {
  var st = stageOf(G.round);
  G.plats = st.plats;
  G.bombs = cloneBombs(st.bombs);
  G.spawn = st.spawn;
  G.stageName = st.name;
  G.player = makeJack(st.spawn);
  G.birds = [];
  G.mummies = [];
  G.coin = null;
  G.got = 0;
  G.litN = 0;
  G.combo = 0;
  G.freeze = 0;
  G.boost = 0;
  G.lock = 0;
  G.jumpBuf = 0;
  if (!attract) {
    resetFx();
    spawnWave();
  }
}

function spawnWave() {
  var nB = birdCount(G.round, G.rush);
  var nM = mummyCount(G.round, G.rush);
  var i, x, y;
  for (i = 0; i < nB; i++) {
    x = i % 2 === 0 ? 48 + i * 10 : WORLD_W - 48 - i * 10;
    y = 36 + (i * 18) % 50;
    G.birds.push(makeBird(x, y, G.round, G.rush));
  }
  for (i = 0; i < nM; i++) {
    x = i % 2 === 0 ? 56 : WORLD_W - 56;
    y = G.plats[0].y;
    G.mummies.push(makeMummy(x, y, G.round, G.rush));
  }
}

function startRun(kind) {
  G.kind = kind;
  G.rush = kind === 'rush';
  G.mode = 'play';
  G.clock = 0;
  G.round = 1;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  G.maxCombo = 0;
  G.litN = 0;
  G.why = '';
  G.lock = 0;
  G.coinFlip = false;
  resetLevel(false);
  G.player.inv = 0.45;
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  panelEl.className = 'panel';
  audio.start();
  hudPlay();
  toast(G.rush ? '连收' : '排弹 · ' + G.stageName, false, !G.rush);
  canvas.focus({ preventScroll: true });
}

function retry() {
  audio.ui();
  if (G.mode === 'title') startRun('stage');
  else startRun(G.kind);
}

function nextRound() {
  G.round += 1;
  persistBest();
  resetLevel(false);
  G.player.inv = 0.4;
  hudPlay();
  toast('第 ' + G.round + ' 关 · ' + G.stageName, false, true);
  audio.start();
}

/* ---- sim ---- */
function spawnCoin() {
  var p = G.player;
  var x = clamp(WORLD_W - p.x, 80, WORLD_W - 80);
  var y = clamp(p.y - 90, 50, 220);
  var kind = G.coinFlip ? 'jump' : 'freeze';
  G.coinFlip = !G.coinFlip;
  G.coin = makeCoin(kind, x, y);
  ring(x, y, kind === 'freeze' ? CYN : GOLD, 10);
  toast(kind === 'freeze' ? '冻结币' : '再跳币', false, kind !== 'freeze');
}

function collectBomb(i) {
  var b = G.bombs[i];
  var lit = i === lightIndex(G.bombs);
  var pay, rgb;
  if (b.taken) return;
  b.taken = true;
  G.got += 1;
  if (lit) {
    G.combo += 1;
    G.litN += 1;
    pay = bombPay(true, G.combo);
    rgb = GOLD;
    audio.chain(G.combo);
    burst(b.x, b.y, 12, GOLD, 90, 0.42, 2.4);
    burst(b.x, b.y, 6, ORG, 60, 0.3, 1.8);
    ring(b.x, b.y, GOLD, 8);
    hitStop(G.combo >= 5 ? 0.06 : 0.045);
    kick(0, -2.4);
    flash(GOLD, 0.08);
    if (G.combo >= 3) boardPulse('chain');
    bumpCombo();
  } else {
    G.combo = 0;
    pay = bombPay(false, 0);
    rgb = RED;
    audio.dull();
    burst(b.x, b.y, 7, RED, 55, 0.28, 1.8);
    hitStop(0.03);
    comboEl.textContent = '×1';
  }
  addScore(pay, b.x, b.y);
  spark(b.x, b.y, rgb);
  if (G.got > 0 && G.got % 8 === 0 && !G.coin) spawnCoin();
  if (bombsLeft(G.bombs) === 0) beginClear();
}

function beginClear() {
  var bonus = roundBonus(G.litN);
  G.lock = 1.25;
  addScore(bonus, G.player.x, G.player.y - 24, '清关 +' + bonus);
  audio.clear();
  hitStop(0.08);
  flash(GOLD, 0.2);
  boardPulse('clear');
  toast(G.litN >= 16 ? '连收奖励 ' + bonus : '全收 · ' + G.stageName, false, true);
  burst(G.player.x, G.player.y - 10, 18, GOLD, 110, 0.5, 2.6);
}

function takeCoin() {
  var c = G.coin;
  if (!c) return;
  G.coin = null;
  if (c.kind === 'freeze') {
    G.freeze = FREEZE_T;
    G.boost = 0;
    audio.power(true);
    toast('冻结', false, false);
    flash(CYN, 0.16);
    burst(c.x, c.y, 14, CYN, 80, 0.4, 2.2);
  } else {
    G.boost = BOOST_T;
    audio.power(false);
    toast('再跳', false, true);
    flash(GOLD, 0.16);
    burst(c.x, c.y, 14, GOLD, 80, 0.4, 2.2);
  }
  addScore(500, c.x, c.y, '+500');
  hitStop(0.07);
  ring(c.x, c.y, c.kind === 'freeze' ? CYN : GOLD, 12);
  hudPlay();
}

function hitJack(why) {
  var p = G.player;
  if (p.inv > 0 || p.deadT > 0 || G.lock > 0 || G.freeze > 0) return;
  G.lives -= 1;
  p.deadT = DIE_T;
  p.why = why;
  G.why = why;
  G.combo = 0;
  comboEl.textContent = '×1';
  p.vy = -120;
  audio.die();
  hitStop(0.075);
  shake(0.42);
  kick(p.face * -4, 3);
  flash(MAG, 0.18);
  boardPulse('die');
  burst(p.x, p.y - 10, 16, MAG, 100, 0.45, 2.4);
  hudPlay();
}

function respawn() {
  var p = makeJack(G.spawn);
  p.inv = INVULN;
  G.player = p;
  G.jumpBuf = 0;
}

function tickJack(dt) {
  var p = G.player;
  var wantL, wantR, ax, prevY, land, ultra, fv, g, maxFall, maxVx, pl;
  var plats = G.plats;

  if (p.deadT > 0) {
    p.deadT -= dt;
    p.vy += GRAV * dt;
    p.y += p.vy * dt;
    p.x = clamp(p.x, WALL + JACK_HW, WORLD_W - WALL - JACK_HW);
    if (p.deadT <= 0) {
      if (G.lives <= 0) showOver();
      else respawn();
    }
    return;
  }

  wantL = keys.l;
  wantR = keys.r;
  maxVx = p.grounded ? WALK : AIR_VX;
  if (wantL && !wantR) {
    p.face = -1;
    ax = p.grounded ? ACCEL_G : ACCEL_A;
    p.vx -= ax * dt;
  } else if (wantR && !wantL) {
    p.face = 1;
    ax = p.grounded ? ACCEL_G : ACCEL_A;
    p.vx += ax * dt;
  } else if (p.grounded) {
    p.vx *= Math.exp(-FRICT * dt);
    if (Math.abs(p.vx) < 6) p.vx = 0;
  } else {
    p.vx *= Math.exp(-1.1 * dt);
  }
  p.vx = clamp(p.vx, -maxVx, maxVx);

  if (p.grounded) p.coyote = COYOTE;
  else p.coyote -= dt;
  p.flapCd -= dt;
  p.flapT -= dt;
  p.inv -= dt;

  if (G.jumpBuf > 0 && (p.grounded || p.coyote > 0)) {
    ultra = keys.u || G.boost > 0;
    p.vy = -(ultra ? ULTRA_V : JUMP_V);
    p.grounded = false;
    p.plat = -1;
    p.coyote = 0;
    G.jumpBuf = 0;
    p.squash = 1.28;
    p.flapCd = 0.08;
    burst(p.x, p.y, 5, HOT, 40, 0.22, 1.6);
    if (G.mode === 'play') audio.hop();
    hitStop(0.03);
  } else if (!p.grounded && p.flapCd <= 0 && (G.jumpBuf > 0 || keys.u)) {
    fv = G.boost > 0 ? FLAP_BOOST : FLAP_V;
    if (p.vy > -fv) p.vy = -fv;
    p.flapCd = FLAP_CD;
    G.jumpBuf = 0;
    p.flapT = 0.14;
    p.squash = 1.12;
    burst(p.x, p.y - 6, 3, MAG, 28, 0.18, 1.3);
    if (G.mode === 'play') audio.flap();
  }
  if (G.jumpBuf > 0) G.jumpBuf -= dt;

  g = GRAV;
  if (keys.d && !p.grounded) g = GRAV * 1.9;
  if (!p.grounded) p.vy += g * dt;
  maxFall = keys.d ? FAST_FALL : MAX_FALL;
  if (p.vy > maxFall) p.vy = maxFall;

  prevY = p.y;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.x = clamp(p.x, WALL + JACK_HW, WORLD_W - WALL - JACK_HW);
  if (p.y - JACK_H < 10) {
    p.y = 10 + JACK_H;
    if (p.vy < 0) p.vy *= 0.15;
  }

  if (p.grounded) {
    pl = p.plat >= 0 ? plats[p.plat] : null;
    if (!pl || !xOnPlat(pl, p.x)) {
      p.grounded = false;
      p.plat = -1;
    } else {
      p.y = pl.y;
      p.vy = 0;
    }
  }

  if (!p.grounded && p.vy >= 0) {
    land = platLand(p.x, p.y, prevY, plats);
    if (land >= 0) {
      p.y = plats[land].y;
      p.vy = 0;
      p.grounded = true;
      p.plat = land;
      p.squash = 0.72;
      if (G.mode === 'play') audio.land();
      burst(p.x, p.y, 4, HOT, 28, 0.18, 1.4);
    }
  }

  p.squash += (1 - p.squash) * Math.min(1, 14 * dt);
  p.walk += Math.abs(p.vx) * dt * 0.08;
}

function tickBird(b, dt) {
  var p = G.player;
  var spd, dx, dy, len, tx, ty, steer;
  if (G.freeze > 0) return;
  b.spawnT -= dt;
  b.flap += dt * 14;
  spd = birdSpeed(G.round, G.rush);
  dx = p.x - b.x;
  dy = (p.y - JACK_H * 0.45) - b.y;
  len = hypot(dx, dy) || 1;
  tx = (dx / len) * spd;
  ty = (dy / len) * spd * 0.92;
  steer = 2.15;
  b.vx = lerp(b.vx, tx, 1 - Math.exp(-steer * dt));
  b.vy = lerp(b.vy, ty, 1 - Math.exp(-1.7 * dt));
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  if (b.x < WALL + b.r) { b.x = WALL + b.r; b.vx = Math.abs(b.vx); }
  if (b.x > WORLD_W - WALL - b.r) { b.x = WORLD_W - WALL - b.r; b.vx = -Math.abs(b.vx); }
  if (b.y < 18) { b.y = 18; b.vy = Math.abs(b.vy); }
  if (b.y > WORLD_H - 22) { b.y = WORLD_H - 22; b.vy = -Math.abs(b.vy) * 0.6; }
  b.face = b.vx >= 0 ? 1 : -1;
}

function tickMummy(m, dt) {
  var p = G.player;
  var spd, prevY, land, pl, dir;
  if (G.freeze > 0) {
    m.walk += dt * 2;
    return;
  }
  m.spawnT -= dt;
  spd = mummySpeed(G.round, G.rush);
  dir = p.x < m.x - 6 ? -1 : p.x > m.x + 6 ? 1 : m.face;
  m.face = dir;
  if (m.grounded) {
    m.vx = dir * spd;
    m.x += m.vx * dt;
    pl = m.plat >= 0 ? G.plats[m.plat] : null;
    if (!pl || !xOnPlat(pl, m.x)) {
      m.grounded = false;
      m.plat = -1;
      m.vy = 30;
    } else {
      m.y = pl.y;
      m.vy = 0;
    }
  } else {
    m.vy = Math.min(MAX_FALL, m.vy + GRAV * dt);
    prevY = m.y;
    m.x += m.vx * 0.35 * dt;
    m.y += m.vy * dt;
    land = platLand(m.x, m.y, prevY, G.plats);
    if (m.vy >= 0 && land >= 0) {
      m.y = G.plats[land].y;
      m.vy = 0;
      m.grounded = true;
      m.plat = land;
    }
  }
  m.x = clamp(m.x, WALL + m.r, WORLD_W - WALL - m.r);
  if (m.y > WORLD_H + 20) {
    m.x = m.x < WORLD_W * 0.5 ? 64 : WORLD_W - 64;
    m.y = G.plats[0].y;
    m.grounded = true;
    m.plat = 0;
    m.vy = 0;
  }
  m.walk += Math.abs(m.vx) * dt * 0.12;
}

function tickCoin(dt) {
  var c = G.coin;
  var land;
  if (!c) return;
  c.life -= dt;
  c.bob += dt * 6;
  if (c.life <= 0) {
    G.coin = null;
    return;
  }
  c.vy += 220 * dt;
  c.x += c.vx * dt;
  c.y += c.vy * dt;
  if (c.x < WALL + 10) { c.x = WALL + 10; c.vx = Math.abs(c.vx); }
  if (c.x > WORLD_W - WALL - 10) { c.x = WORLD_W - WALL - 10; c.vx = -Math.abs(c.vx); }
  if (c.y < 24) { c.y = 24; c.vy = Math.abs(c.vy) * 0.4; }
  land = platLand(c.x, c.y + 8, c.y + 8 - c.vy * dt, G.plats);
  if (c.vy > 0 && land >= 0) {
    c.y = G.plats[land].y - 12;
    c.vy *= -0.55;
    c.vx *= 0.92;
  }
}

function tryPick() {
  var p = G.player;
  var i, b, c, jx, jy;
  if (p.deadT > 0 || G.lock > 0) return;
  jx = p.x;
  jy = p.y - JACK_H * 0.45;
  for (i = 0; i < G.bombs.length; i++) {
    b = G.bombs[i];
    if (b.taken) continue;
    if (hypot(b.x - jx, b.y - jy) <= BOMB_R + 11) collectBomb(i);
  }
  c = G.coin;
  if (c && hypot(c.x - jx, c.y - jy) <= COIN_R + 11) takeCoin();
}

function tryHits() {
  var p = G.player;
  var i, e;
  if (p.deadT > 0 || p.inv > 0 || G.lock > 0 || G.freeze > 0) return;
  for (i = 0; i < G.birds.length; i++) {
    e = G.birds[i];
    if (e.spawnT > 0) continue;
    if (hitsJack(p.x, p.y, e.x, e.y, e.r)) {
      hitJack('bird');
      return;
    }
  }
  for (i = 0; i < G.mummies.length; i++) {
    e = G.mummies[i];
    if (e.spawnT > 0) continue;
    if (hitsJack(p.x, p.y, e.x, e.y - 6, e.r + 1)) {
      hitJack('mummy');
      return;
    }
  }
}

function tick(dt) {
  var i;
  if (G.mode === 'over') {
    tickFx(dt);
    return;
  }
  G.clock += dt;
  if (G.mode === 'title') {
    tickJack(dt * 0.4);
    tickFx(dt);
    return;
  }
  if (G.lock > 0) {
    G.lock -= dt;
    tickJack(dt * 0.35);
    tickFx(dt);
    if (G.lock <= 0) nextRound();
    return;
  }
  if (autoOn) tickAuto();
  if (G.freeze > 0) G.freeze = Math.max(0, G.freeze - dt);
  if (G.boost > 0) G.boost = Math.max(0, G.boost - dt);
  tickJack(dt);
  for (i = 0; i < G.birds.length; i++) tickBird(G.birds[i], dt);
  for (i = 0; i < G.mummies.length; i++) tickMummy(G.mummies[i], dt);
  tickCoin(dt);
  tryPick();
  tryHits();
  tickFx(dt);
  syncPower();
}

/* ---- autoplay ---- */
function clearAutoKeys() {
  keys.l = false;
  keys.r = false;
  keys.u = false;
  keys.d = false;
}

function getLitBomb() {
  var i = lightIndex(G.bombs);
  return i < 0 ? null : G.bombs[i];
}

function nearestThreat(p) {
  var best = null;
  var bestD = 1e9;
  var i, e, d;
  if (G.freeze > 0) return null;
  for (i = 0; i < G.birds.length; i++) {
    e = G.birds[i];
    if (e.spawnT > 0) continue;
    d = hypot(e.x - p.x, e.y - (p.y - 10));
    if (d < bestD) { bestD = d; best = e; }
  }
  for (i = 0; i < G.mummies.length; i++) {
    e = G.mummies[i];
    if (e.spawnT > 0) continue;
    d = hypot(e.x - p.x, e.y - p.y);
    if (d < bestD) { bestD = d; best = e; }
  }
  if (best && bestD < 46) return best;
  return null;
}

function autoTarget() {
  var p = G.player;
  var lit = getLitBomb();
  var c = G.coin;
  var dc, db;
  if (c && c.life > 1.2) {
    dc = hypot(c.x - p.x, c.y - (p.y - 10));
    if (lit) {
      db = hypot(lit.x - p.x, lit.y - (p.y - 10));
      if (dc < 78 && dc < db * 0.6) return c;
    } else if (dc < 120) return c;
  }
  return lit;
}

function tickAuto() {
  var p = G.player;
  var t, dx, dy, threat, away;
  clearAutoKeys();
  if (!autoOn || G.mode !== 'play') return;
  if (p.deadT > 0 || G.lock > 0) return;
  t = autoTarget();
  if (!t) return;
  threat = nearestThreat(p);
  if (threat) {
    away = threat.x >= p.x ? -1 : 1;
    keys.l = away < 0;
    keys.r = away > 0;
    if (p.grounded) G.jumpBuf = BUFFER;
    else keys.u = true;
    if (threat.y < p.y - 8) keys.d = true;
    return;
  }
  dx = t.x - p.x;
  dy = t.y - (p.y - 12);
  if (dx < -5) keys.l = true;
  else if (dx > 5) keys.r = true;
  if (p.grounded) {
    if (dy < -18) {
      keys.u = true;
      G.jumpBuf = BUFFER;
    } else if (Math.abs(dx) < 14 && dy < -4) {
      G.jumpBuf = BUFFER;
    }
  } else {
    if (dy < 10) {
      keys.u = true;
      if (p.flapCd <= 0) G.jumpBuf = BUFFER;
    } else if (dy > 22 && Math.abs(dx) < 50) {
      keys.d = true;
    }
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

function toggleAuto() {
  autoOn = !autoOn;
  clearAutoKeys();
  G.jumpBuf = 0;
  syncAutoUi();
  if (autoOn) {
    audio.ensure();
    if (G.mode === 'title') startRun('stage');
  }
  if (G.mode === 'play') hudPlay();
}

function setAutoSpeed(n) {
  if (n < 1 || n > 4 || !isFinite(n)) n = 3;
  autoSpeed = n;
  saveAutoSpeed(autoSpeed);
  syncSpeedUi();
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
  var s = Math.min(avW / WORLD_W, avH / WORLD_H);
  L.s = s;
  L.x = (avW - WORLD_W * s) / 2;
  L.y = Math.max(4, (avH - WORLD_H * s) / 2);
}

function sx(x) { return L.x + x * L.s; }
function sy(y) { return L.y + y * L.s; }

function fillRound(x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
  ctx.fill();
}

function drawBg() {
  var g, i, x, y;
  ctx.fillStyle = '#07040c';
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(70), sy(40), 8, sx(70), sy(40), 200 * L.s);
  g.addColorStop(0, 'rgba(255,210,26,0.16)');
  g.addColorStop(1, 'rgba(255,210,26,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(400), sy(80), 8, sx(400), sy(80), 170 * L.s);
  g.addColorStop(0, 'rgba(255,61,184,0.1)');
  g.addColorStop(1, 'rgba(255,61,184,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.fillStyle = 'rgba(18, 12, 8, 0.92)';
  ctx.fillRect(sx(0), sy(8), WALL * L.s, (WORLD_H - 10) * L.s);
  ctx.fillRect(sx(WORLD_W - WALL), sy(8), WALL * L.s, (WORLD_H - 10) * L.s);
  ctx.strokeStyle = 'rgba(255,210,26,0.22)';
  ctx.lineWidth = 1.2 * L.s;
  for (i = 0; i < 12; i++) {
    y = sy(20 + i * 28);
    ctx.beginPath();
    ctx.moveTo(sx(2), y);
    ctx.lineTo(sx(WALL), y);
    ctx.moveTo(sx(WORLD_W - WALL), y);
    ctx.lineTo(sx(WORLD_W - 2), y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 210, 26, 0.05)';
  ctx.beginPath();
  ctx.moveTo(sx(90), sy(338));
  ctx.lineTo(sx(150), sy(210));
  ctx.lineTo(sx(210), sy(338));
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(sx(280), sy(338));
  ctx.lineTo(sx(340), sy(188));
  ctx.lineTo(sx(400), sy(338));
  ctx.fill();

  ctx.fillStyle = 'rgba(255,229,106,0.08)';
  for (i = 0; i < 18; i++) {
    x = sx(30 + (i * 73) % 420);
    y = sy(18 + (i * 47) % 300);
    ctx.beginPath();
    ctx.arc(x, y, (0.7 + (i % 3) * 0.35) * L.s, 0, TAU);
    ctx.fill();
  }
}

function drawPlat(p, floor) {
  var x = sx(p.x);
  var y = sy(p.y);
  var w = p.w * L.s;
  var h = p.h * L.s;
  var n, k;
  ctx.fillStyle = 'rgba(40, 24, 8, 0.85)';
  fillRound(x, y, w, h + 2 * L.s, 3 * L.s);
  ctx.fillStyle = floor ? '#ffd21a' : '#ffe56a';
  fillRound(x, y, w, 4.2 * L.s, 2 * L.s);
  ctx.fillStyle = 'rgba(255, 244, 200, 0.55)';
  ctx.fillRect(x + 2 * L.s, y + 0.6 * L.s, w - 4 * L.s, 1.2 * L.s);
  n = Math.max(2, (p.w / 22) | 0);
  ctx.fillStyle = 'rgba(255, 154, 40, 0.55)';
  for (k = 0; k <= n; k++) {
    ctx.beginPath();
    ctx.arc(x + (k / n) * w, y + 2 * L.s, 1.15 * L.s, 0, TAU);
    ctx.fill();
  }
}

function drawBomb(b, lit, t) {
  var x = sx(b.x);
  var y = sy(b.y);
  var s = L.s;
  var pulse, flame;
  if (b.taken) return;
  if (lit) {
    pulse = 0.55 + 0.45 * Math.sin(t * 10);
    ctx.fillStyle = rgba(GOLD, 0.16 * pulse);
    ctx.beginPath();
    ctx.arc(x, y, (BOMB_R + 7) * s, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = lit ? '#ff9a28' : '#ff4a5c';
  ctx.beginPath();
  ctx.arc(x, y, BOMB_R * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,244,220,0.55)';
  ctx.beginPath();
  ctx.arc(x - 1.8 * s, y - 2.1 * s, 2.1 * s, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#ffe56a';
  ctx.lineWidth = 1.2 * s;
  ctx.beginPath();
  ctx.moveTo(x + 2 * s, y - BOMB_R * s);
  ctx.quadraticCurveTo(x + 6 * s, y - (BOMB_R + 6) * s, x + 4.5 * s, y - (BOMB_R + 8) * s);
  ctx.stroke();
  if (lit) {
    flame = 3.2 + Math.sin(t * 18) * 1.4;
    ctx.fillStyle = '#ffe56a';
    ctx.beginPath();
    ctx.arc(x + 4.5 * s, y - (BOMB_R + 8) * s, 1.6 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ff6a28';
    ctx.beginPath();
    ctx.moveTo(x + 4.5 * s, y - (BOMB_R + 8 + flame) * s);
    ctx.lineTo(x + 2.6 * s, y - (BOMB_R + 7) * s);
    ctx.lineTo(x + 6.4 * s, y - (BOMB_R + 7) * s);
    ctx.closePath();
    ctx.fill();
  }
}

function drawJack(p) {
  var x = sx(p.x);
  var y = sy(p.y - 10);
  var s = L.s;
  var bob = p.grounded ? Math.sin(p.walk * 7) * 1.2 * s : 0;
  var cape = p.flapT > 0 ? 1.25 : p.grounded ? 1 : 1.08;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(p.face, p.squash);
  if (p.inv > 0 && p.deadT <= 0 && ((G.clock * 18) | 0) % 2 === 0) ctx.globalAlpha = 0.42;
  if (p.deadT > 0) {
    ctx.globalAlpha = 0.65;
    ctx.rotate(0.4);
  }
  ctx.fillStyle = G.boost > 0 ? '#ff3db8' : '#e03090';
  ctx.beginPath();
  ctx.moveTo(-1.5 * s, -3 * s);
  ctx.quadraticCurveTo(-15 * s * cape, (p.grounded ? 9 : 1) * s, -3 * s, 11 * s);
  ctx.lineTo(3 * s, 3 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd21a';
  fillRound(-5.2 * s, -6 * s, 10.4 * s, 13.5 * s, 3.2 * s);
  ctx.fillStyle = '#c88810';
  fillRound(-3.4 * s, 4 * s, 3 * s, 6 * s, 1.2 * s);
  fillRound(0.4 * s, 4 * s, 3 * s, 6 * s, 1.2 * s);
  ctx.fillStyle = '#ffe56a';
  ctx.beginPath();
  ctx.arc(0, -10.2 * s, 6.3 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(-1.6 * s, -12 * s, 2 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#141018';
  ctx.beginPath();
  ctx.arc(2.1 * s, -10.2 * s, 1.25 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#00f0ff';
  ctx.beginPath();
  ctx.arc(2.45 * s, -10.45 * s, 0.5 * s, 0, TAU);
  ctx.fill();
  if (G.boost > 0) {
    ctx.strokeStyle = rgba(GOLD, 0.7);
    ctx.lineWidth = 1.4 * s;
    ctx.beginPath();
    ctx.arc(0, -2 * s, 13 * s, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBird(b) {
  var x = sx(b.x);
  var y = sy(b.y);
  var s = L.s;
  var wing = Math.sin(b.flap) * 5 * s;
  var ice = G.freeze > 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(b.face, 1);
  if (b.spawnT > 0) ctx.globalAlpha = 0.45;
  ctx.fillStyle = ice ? rgba(ICE, 0.9) : '#ff3db8';
  ctx.beginPath();
  ctx.ellipse(0, 0, 7.2 * s, 4.4 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = ice ? '#7af6ff' : '#00f0ff';
  ctx.beginPath();
  ctx.ellipse(-1 * s, -wing * 0.15, 6.5 * s, 2.4 * s + Math.abs(wing) * 0.12, -0.4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffe56a';
  ctx.beginPath();
  ctx.moveTo(7 * s, -0.4 * s);
  ctx.lineTo(10.5 * s, 0.2 * s);
  ctx.lineTo(7 * s, 1.4 * s);
  ctx.fill();
  ctx.fillStyle = '#141018';
  ctx.beginPath();
  ctx.arc(3.2 * s, -1.1 * s, 0.9 * s, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawMummy(m) {
  var x = sx(m.x);
  var y = sy(m.y - 8);
  var s = L.s;
  var bob = Math.sin(m.walk * 8) * 1.1 * s;
  var ice = G.freeze > 0;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(m.face, 1);
  if (m.spawnT > 0) ctx.globalAlpha = 0.45;
  ctx.fillStyle = ice ? rgba(ICE, 0.85) : '#e8d8b0';
  fillRound(-6 * s, -8 * s, 12 * s, 16 * s, 3 * s);
  ctx.strokeStyle = ice ? 'rgba(0,240,255,0.5)' : 'rgba(80,60,30,0.45)';
  ctx.lineWidth = 1.1 * s;
  ctx.beginPath();
  ctx.moveTo(-5 * s, -3 * s);
  ctx.lineTo(5 * s, -3 * s);
  ctx.moveTo(-5 * s, 2 * s);
  ctx.lineTo(5 * s, 2 * s);
  ctx.moveTo(-5 * s, 6.5 * s);
  ctx.lineTo(5 * s, 6.5 * s);
  ctx.stroke();
  ctx.fillStyle = '#141018';
  ctx.beginPath();
  ctx.arc(2.4 * s, -5.2 * s, 1.15 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = ice ? '#00f0ff' : '#ffd21a';
  ctx.beginPath();
  ctx.arc(2.7 * s, -5.4 * s, 0.45 * s, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawCoin(c) {
  var x = sx(c.x);
  var y = sy(c.y + Math.sin(c.bob) * 3);
  var s = L.s;
  var ice = c.kind === 'freeze';
  var rgb = ice ? CYN : GOLD;
  var blink = c.life < 1.6 && ((G.clock * 8) | 0) % 2 === 0;
  if (blink) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(G.clock * 2.2);
  ctx.fillStyle = rgba(rgb, 0.22);
  ctx.beginPath();
  ctx.arc(0, 0, 14 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = ice ? '#00f0ff' : '#ffe56a';
  ctx.beginPath();
  var i, a;
  ctx.moveTo(Math.cos(0) * 9 * s, Math.sin(0) * 9 * s);
  for (i = 1; i < 6; i++) {
    a = i * TAU / 6;
    ctx.lineTo(Math.cos(a) * 9 * s, Math.sin(a) * 9 * s);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#141018';
  ctx.font = '700 ' + Math.max(8, 9 * s) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.rotate(-G.clock * 2.2);
  ctx.fillText(ice ? '冻' : '跳', 0, 0.5 * s);
  ctx.restore();
}

function drawFx() {
  var i, p, s, r, f, a;
  for (i = 0; i < rings.length; i++) {
    r = rings[i];
    a = r.life / 0.34;
    ctx.strokeStyle = rgba(r.rgb, 0.55 * a);
    ctx.lineWidth = 2 * L.s;
    ctx.beginPath();
    ctx.arc(sx(r.x), sy(r.y), r.r * L.s, 0, TAU);
    ctx.stroke();
  }
  for (i = 0; i < particles.length; i++) {
    p = particles[i];
    a = p.life / p.max;
    ctx.fillStyle = rgba(p.rgb, 0.85 * a);
    ctx.beginPath();
    ctx.arc(sx(p.x), sy(p.y), p.r * L.s * (0.5 + a), 0, TAU);
    ctx.fill();
  }
  for (i = 0; i < sparks.length; i++) {
    s = sparks[i];
    ctx.fillStyle = rgba(s.rgb, s.life / 0.32);
    ctx.fillRect(sx(s.x) - 0.8 * L.s, sy(s.y) - 0.8 * L.s, 1.6 * L.s, 1.6 * L.s);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (i = 0; i < floats.length; i++) {
    f = floats[i];
    ctx.globalAlpha = Math.max(0, f.life / 0.7);
    ctx.fillStyle = rgba(f.rgb, 1);
    ctx.font = '700 ' + Math.max(10, 12 * L.s) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.fillText(f.text, sx(f.x), sy(f.y));
    ctx.globalAlpha = 1;
  }
}

function drawHudWorld() {
  var lit = lightIndex(G.bombs);
  var left = bombsLeft(G.bombs);
  ctx.save();
  ctx.font = '700 ' + Math.max(9, 10 * L.s) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(246,243,255,0.55)';
  ctx.fillText(G.stageName + '  ' + (BOMB_N - left) + '/' + BOMB_N, sx(WALL + 8), sy(14));
  if (lit >= 0 && G.mode === 'play') {
    ctx.fillStyle = rgba(GOLD, 0.8);
    ctx.fillText('亮 ' + (lit + 1), sx(WALL + 8), sy(28));
  }
  ctx.restore();
}

function draw() {
  var i, lit, ox, oy, sh;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ox = G.kickX;
  oy = G.kickY;
  if (G.shake > 0) {
    sh = G.shake * 5;
    ox += rand(-sh, sh);
    oy += rand(-sh, sh);
  }
  ctx.translate(ox, oy);
  drawBg();
  for (i = 0; i < G.plats.length; i++) drawPlat(G.plats[i], i === 0);
  lit = lightIndex(G.bombs);
  for (i = 0; i < G.bombs.length; i++) drawBomb(G.bombs[i], i === lit, G.clock);
  if (G.coin) drawCoin(G.coin);
  for (i = 0; i < G.mummies.length; i++) drawMummy(G.mummies[i]);
  for (i = 0; i < G.birds.length; i++) drawBird(G.birds[i]);
  drawJack(G.player);
  drawFx();
  drawHudWorld();
  if (G.flash > 0) {
    ctx.fillStyle = rgba(G.flashRgb, 0.18 * (G.flash / 0.18));
    ctx.fillRect(L.x, L.y, WORLD_W * L.s, WORLD_H * L.s);
  }
  if (G.freeze > 0) {
    ctx.fillStyle = 'rgba(0,240,255,0.05)';
    ctx.fillRect(L.x, L.y, WORLD_W * L.s, WORLD_H * L.s);
  }
}

function frame(ts) {
  var dt, steps, turbo, scale, maxSteps;
  if (!lastTs) lastTs = ts;
  dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (dt > 0.08) dt = 0.08;
  if (!hidden) {
    turbo = autoOn && autoSpeed >= 4 && G.mode === 'play';
    if (G.stop > 0 && !turbo) {
      G.stop -= dt;
      tickFx(dt);
    } else {
      if (turbo) G.stop = 0;
      scale = autoScale();
      acc += dt * scale;
      steps = 0;
      maxSteps = turbo ? 16 : 5;
      while (acc >= STEP && steps < maxSteps) {
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
    if (autoOn) return;
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
bindPad(btnDown, function (v) { keys.d = v; });
bindPad(btnJump, function (v) {
  keys.u = v;
  if (v) G.jumpBuf = BUFFER;
});

function keyOn(e, down) {
  var k = e.code;
  if (k === 'ArrowLeft') { keys.l = down; e.preventDefault(); }
  else if (k === 'ArrowRight' || k === 'KeyD') { keys.r = down; e.preventDefault(); }
  else if (k === 'ArrowDown' || k === 'KeyS') { keys.d = down; e.preventDefault(); }
  else if (k === 'ArrowUp' || k === 'KeyW') {
    keys.u = down;
    if (down) G.jumpBuf = BUFFER;
    e.preventDefault();
  } else if (k === 'Space') {
    keys.u = down;
    if (down) G.jumpBuf = BUFFER;
    e.preventDefault();
  }
}

function isAutoKey(e) {
  return e.code === 'KeyA' || e.key === 'a' || e.key === 'A';
}

window.addEventListener('keydown', function (e) {
  if (isAutoKey(e)) {
    if (e.repeat) return;
    audio.ensure();
    toggleAuto();
    e.preventDefault();
    return;
  }
  if (e.target === speedEl) return;
  if (e.repeat) {
    if (autoOn) {
      e.preventDefault();
      return;
    }
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
      startRun('stage');
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      startRun('rush');
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
      startRun('rush');
      e.preventDefault();
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
  keyOn(e, true);
});

window.addEventListener('keyup', function (e) {
  if (isAutoKey(e)) {
    e.preventDefault();
    return;
  }
  if (autoOn) return;
  keyOn(e, false);
});

btnMute.addEventListener('click', function () {
  audio.ensure();
  audio.setMuted(!audio.muted);
});
btnAuto.addEventListener('click', function () { toggleAuto(); });
speedEl.addEventListener('input', function () { setAutoSpeed(parseInt(speedEl.value, 10)); });
speedEl.addEventListener('change', function () { setAutoSpeed(parseInt(speedEl.value, 10)); });
btnRetry.addEventListener('click', function () {
  audio.ensure();
  retry();
});
btnStage.addEventListener('click', function () {
  audio.ensure();
  startRun('stage');
});
btnRush.addEventListener('click', function () {
  audio.ensure();
  startRun('rush');
});
ovRetry.addEventListener('click', function () {
  audio.ensure();
  startRun(G.kind);
});
ovMenu.addEventListener('click', function () {
  audio.ensure();
  audio.ui();
  showTitle();
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

bestEl.textContent = String(G.bestS);
renderPips();
syncAutoUi();
syncSpeedUi();
showTitle();
resize();
hudPlay();
modeLabel.textContent = '排弹';
requestAnimationFrame(frame);

}
