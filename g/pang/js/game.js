'use strict';

/* 穿球 — Pang-lite. Harpoon splits bouncing balloons. No CDN. */

var WORLD_W = 420;
var WORLD_H = 540;
var WALL = 16;
var CEIL = 30;
var FLOOR = 510;
var LIVES = 3;
var PLAYER_W = 16;
var PLAYER_H = 26;
var PLAYER_SPD = 208;
var HOOK_V = 560;
var HOOK_MAX_ROOMS = 1;
var HOOK_MAX_CHAIN = 2;
var GRAVITY = 380;
var COMBO_WIN = 1.42;
var INVULN = 1.42;
var DIE_T = 0.72;
var READY_T = 0.55;
var CLEAR_T = 0.95;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var BEST_KEY = 'playbox-pang-best';
var MUTE_KEY = 'playbox-pang-mute';
var ROOM_COUNT = 5;
var OPS = '← → / A D 走 · 空格射叉 · 触屏左 射 右 · R 重开 · M 静音';

var CYN = [0, 232, 255];
var TEAL = [20, 240, 208];
var GOLD = [255, 227, 107];
var MAG = [255, 61, 184];
var HOT = [255, 90, 106];
var WHT = [232, 251, 255];

/* size 0 tiny pop, 1–3 split into two of size-1 */
var SIZE = [
  { r: 9, bounce: 292, spd: 112, score: 400, stop: 0.032, rgb: [255, 120, 70] },
  { r: 16, bounce: 368, spd: 96, score: 200, stop: 0.042, rgb: [0, 232, 255] },
  { r: 24, bounce: 448, spd: 82, score: 100, stop: 0.055, rgb: [255, 227, 107] },
  { r: 34, bounce: 528, spd: 68, score: 50, stop: 0.07, rgb: [255, 61, 184] }
];

var ROOMS = [
  {
    name: '空厅',
    sub: 'OPEN',
    time: 78,
    plats: [],
    balls: [{ x: 210, y: 92, size: 3, dir: 1 }]
  },
  {
    name: '双月',
    sub: 'TWIN',
    time: 74,
    plats: [{ x: 140, y: 268, w: 140, h: 12 }],
    balls: [
      { x: 110, y: 88, size: 2, dir: -1 },
      { x: 310, y: 88, size: 2, dir: 1 }
    ]
  },
  {
    name: '檐下',
    sub: 'EAVES',
    time: 70,
    plats: [
      { x: 28, y: 232, w: 132, h: 12 },
      { x: 260, y: 232, w: 132, h: 12 }
    ],
    balls: [
      { x: 210, y: 80, size: 3, dir: 1 },
      { x: 70, y: 300, size: 1, dir: -1 },
      { x: 350, y: 300, size: 1, dir: 1 }
    ]
  },
  {
    name: '夹缝',
    sub: 'GAP',
    time: 66,
    plats: [
      { x: 24, y: 176, w: 148, h: 12 },
      { x: 248, y: 176, w: 148, h: 12 }
    ],
    balls: [
      { x: 90, y: 86, size: 3, dir: 1 },
      { x: 330, y: 86, size: 2, dir: -1 }
    ]
  },
  {
    name: '满月',
    sub: 'FULL',
    time: 62,
    plats: [
      { x: 128, y: 196, w: 164, h: 12 },
      { x: 28, y: 318, w: 96, h: 12 },
      { x: 296, y: 318, w: 96, h: 12 }
    ],
    balls: [
      { x: 210, y: 78, size: 3, dir: 1 },
      { x: 80, y: 240, size: 2, dir: -1 },
      { x: 340, y: 240, size: 1, dir: 1 }
    ]
  }
];

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function rand(a, b) {
  return a + Math.random() * (b - a);
}
function hypot(x, y) {
  return Math.sqrt(x * x + y * y);
}
function rgba(rgb, a) {
  return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
}
function comboMult(combo) {
  if (combo < 1) return 1;
  return Math.min(6, combo);
}
function sizeSpec(size) {
  return SIZE[clamp(size | 0, 0, SIZE.length - 1)];
}
function hookCap(chain) {
  return chain ? HOOK_MAX_CHAIN : HOOK_MAX_ROOMS;
}
function liveHookCount(hooks) {
  var i, n = 0;
  for (i = 0; i < hooks.length; i++) if (hooks[i].live) n += 1;
  return n;
}
function liveBallCount(balls) {
  var i, n = 0;
  for (i = 0; i < balls.length; i++) if (balls[i].live) n += 1;
  return n;
}
function popScore(size, combo) {
  return (sizeSpec(size).score * comboMult(combo)) | 0;
}
function circleRect(cx, cy, r, rx, ry, rw, rh) {
  var nx = clamp(cx, rx, rx + rw);
  var ny = clamp(cy, ry, ry + rh);
  var dx = cx - nx;
  var dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}
function hookHitsBall(hx, tipY, baseY, bx, by, r) {
  var top = tipY < baseY ? tipY : baseY;
  var bot = tipY < baseY ? baseY : tipY;
  var ny = clamp(by, top, bot);
  var dx = hx - bx;
  var dy = ny - by;
  var rr = r + 3.4;
  return dx * dx + dy * dy <= rr * rr;
}
function hookHitsPlat(hx, tipY, baseY, plat) {
  if (hx < plat.x || hx > plat.x + plat.w) return false;
  var top = tipY < baseY ? tipY : baseY;
  var bot = tipY < baseY ? baseY : tipY;
  var pTop = plat.y;
  var pBot = plat.y + plat.h;
  return bot >= pTop && top <= pBot;
}
function playerHitsBall(px, py, bx, by, r) {
  var left = px - 7;
  var right = px + 7;
  var top = py - PLAYER_H;
  var bot = py - 2;
  var nx = clamp(bx, left, right);
  var ny = clamp(by, top, bot);
  var dx = bx - nx;
  var dy = by - ny;
  var rr = r * 0.82;
  return dx * dx + dy * dy < rr * rr;
}
function chainWaveBalls(wave) {
  var w = Math.max(1, wave | 0);
  var list;
  if (w === 1) list = [{ x: 130, y: 90, size: 2, dir: -1 }, { x: 290, y: 90, size: 2, dir: 1 }];
  else if (w === 2) list = [{ x: 210, y: 80, size: 3, dir: 1 }, { x: 90, y: 140, size: 1, dir: -1 }];
  else if (w === 3) list = [{ x: 100, y: 86, size: 3, dir: -1 }, { x: 320, y: 86, size: 3, dir: 1 }];
  else if (w === 4) list = [{ x: 210, y: 78, size: 3, dir: 1 }, { x: 80, y: 160, size: 2, dir: -1 }, { x: 340, y: 160, size: 2, dir: 1 }];
  else {
    list = [
      { x: 90, y: 80, size: 3, dir: -1 },
      { x: 330, y: 80, size: 3, dir: 1 },
      { x: 210, y: 150, size: w % 2 ? 2 : 1, dir: w % 2 ? 1 : -1 }
    ];
    if (w >= 6) list.push({ x: 50, y: 220, size: 1, dir: 1 });
    if (w >= 8) list.push({ x: 370, y: 220, size: 1, dir: -1 });
  }
  return list;
}
function chainWavePlats(wave) {
  var w = Math.max(1, wave | 0);
  if (w === 1) return [];
  if (w === 2 || w === 5) return [{ x: 140, y: 268, w: 140, h: 12 }];
  if (w === 3 || w === 6) {
    return [
      { x: 28, y: 232, w: 132, h: 12 },
      { x: 260, y: 232, w: 132, h: 12 }
    ];
  }
  if (w === 4 || w >= 7) {
    return [
      { x: 24, y: 176, w: 148, h: 12 },
      { x: 248, y: 176, w: 148, h: 12 }
    ];
  }
  return [];
}
function chainSpeed(wave) {
  return 1 + Math.min(0.55, Math.max(0, wave - 1) * 0.08);
}
function makePlayer() {
  return {
    x: WORLD_W * 0.5,
    y: FLOOR,
    vx: 0,
    face: 1,
    fireCd: 0,
    inv: 0,
    deadT: 0,
    squash: 1,
    muzzle: 0,
    bob: 0
  };
}
function makeBall(x, y, size, dir, spdMul) {
  var spec = sizeSpec(size);
  var d = dir < 0 ? -1 : 1;
  var mul = spdMul || 1;
  return {
    x: x,
    y: y,
    vx: spec.spd * d * mul,
    vy: -spec.bounce * 0.35,
    size: clamp(size | 0, 0, 3),
    r: spec.r,
    bounce: spec.bounce,
    rgb: spec.rgb,
    live: true,
    squash: 1,
    spin: rand(0, TAU)
  };
}
function makeHook(x, baseY) {
  return { x: x, baseY: baseY, tipY: baseY - 8, live: true };
}
function splitKids(x, y, size, spdMul) {
  var next = size - 1;
  var spec, mul, gap;
  if (size <= 0) return [];
  spec = sizeSpec(next);
  mul = spdMul || 1;
  gap = spec.r * 0.55 + 4;
  return [
    makeBall(x - gap, y, next, -1, mul),
    makeBall(x + gap, y, next, 1, mul)
  ];
}
function bounceFloorVy(size) {
  return -sizeSpec(size).bounce;
}

function selfCheck() {
  var kids, b, h, p, spec, i, hitFloor, hitWall;
  if (LIVES !== 3) throw new Error('3 lives');
  if (ROOM_COUNT !== 5 || ROOMS.length !== 5) throw new Error('5 rooms');
  if (SIZE.length !== 4) throw new Error('4 balloon sizes');
  if (comboMult(1) !== 1) throw new Error('combo 1');
  if (comboMult(3) !== 3) throw new Error('combo 3');
  if (comboMult(9) !== 6) throw new Error('combo cap 6');
  if (popScore(0, 1) !== 400 || popScore(3, 2) !== 100) throw new Error('pop score');
  if (hookCap(false) !== 1 || hookCap(true) !== 2) throw new Error('hook cap');
  if (chainSpeed(4) <= chainSpeed(1)) throw new Error('chain faster');
  if (chainWaveBalls(1).length !== 2) throw new Error('wave 1 balls');
  if (chainWaveBalls(3).length < 2) throw new Error('wave 3 balls');
  kids = splitKids(200, 120, 3, 1);
  if (kids.length !== 2 || kids[0].size !== 2 || kids[1].size !== 2) throw new Error('split 3→2');
  if (kids[0].vx >= 0 || kids[1].vx <= 0) throw new Error('split opposite vx');
  kids = splitKids(200, 120, 0, 1);
  if (kids.length !== 0) throw new Error('tiny has no kids');
  if (bounceFloorVy(3) >= 0) throw new Error('floor bounce up');
  if (!hookHitsBall(200, 80, 400, 200, 100, 16)) throw new Error('hook hit');
  if (hookHitsBall(80, 80, 400, 200, 100, 16)) throw new Error('hook miss');
  if (!playerHitsBall(200, FLOOR, 200, FLOOR - 12, 16)) throw new Error('player hit');
  if (playerHitsBall(200, FLOOR, 80, 80, 16)) throw new Error('player miss');
  if (!circleRect(50, 50, 10, 40, 40, 40, 12)) throw new Error('circle rect');
  if (circleRect(10, 10, 4, 40, 40, 40, 12)) throw new Error('circle miss');
  p = { x: 40, y: 200, w: 80, h: 12 };
  if (!hookHitsPlat(60, 160, 400, p)) throw new Error('hook plat');
  if (hookHitsPlat(20, 160, 400, p)) throw new Error('hook plat miss');
  b = makeBall(100, 80, 3, 1, 1);
  if (!b.live || b.r !== SIZE[3].r || b.vx <= 0) throw new Error('make ball');
  h = makeHook(200, FLOOR);
  if (h.tipY >= h.baseY) throw new Error('hook grows up');
  if (ROOMS[0].balls.length !== 1) throw new Error('room 1 one ball');
  if (ROOMS[3].plats.length !== 2) throw new Error('gap plats');
  if (sizeSpec(3).r <= sizeSpec(0).r) throw new Error('size order');

  spec = sizeSpec(3);
  b = { x: 200, y: 90, vx: spec.spd, vy: 0, r: spec.r, bounce: spec.bounce };
  hitFloor = false;
  hitWall = false;
  for (i = 0; i < 60 * 8; i++) {
    b.vy += GRAVITY * STEP;
    b.x += b.vx * STEP;
    b.y += b.vy * STEP;
    if (b.x - b.r < WALL) {
      b.x = WALL + b.r;
      b.vx = Math.abs(b.vx);
      hitWall = true;
    }
    if (b.x + b.r > WORLD_W - WALL) {
      b.x = WORLD_W - WALL - b.r;
      b.vx = -Math.abs(b.vx);
      hitWall = true;
    }
    if (b.y - b.r < CEIL) {
      b.y = CEIL + b.r;
      if (b.vy < 0) b.vy = Math.abs(b.vy) * 0.42;
    }
    if (b.y + b.r > FLOOR) {
      b.y = FLOOR - b.r;
      b.vy = -b.bounce;
      hitFloor = true;
    }
  }
  if (!hitFloor) throw new Error('ball never floors');
  if (!hitWall) throw new Error('ball never walls');
  if (b.y + spec.r > FLOOR + 0.5) throw new Error('fell through floor');
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
var ovKicker = document.getElementById('ov-kicker');
var ovTitle = document.getElementById('ov-title');
var ovLead = document.getElementById('ov-lead');
var ovOps = document.getElementById('ov-ops');
var ovStart = document.getElementById('ov-start');
var ovEnd = document.getElementById('ov-end');
var ovAgain = document.getElementById('ov-again');
var ovMenu = document.getElementById('ov-menu');
var btnRooms = document.getElementById('btn-rooms');
var btnChain = document.getElementById('btn-chain');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnLeft = document.getElementById('btn-left');
var btnRight = document.getElementById('btn-right');
var btnFire = document.getElementById('btn-fire');
var scoreEl = document.getElementById('score');
var stageNumEl = document.getElementById('stage-num');
var stageEm = document.getElementById('stage-em');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var tagLabel = document.getElementById('tag-label');
var timeWrap = document.getElementById('time-wrap');
var timeBar = document.getElementById('time-bar');
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
var comboTok = 0;
var warnTok = 0;

var particles = [];
var sparks = [];
var floats = [];
var rings = [];
var motes = [];

var keys = { l: false, r: false, fire: false };
var pointer = { down: false, x: WORLD_W * 0.5, id: null };

var G = {
  mode: 'title',
  kind: 'rooms',
  chain: false,
  t: 0,
  clock: 0,
  stage: 1,
  wave: 1,
  lives: LIVES,
  score: 0,
  bestR: 0,
  bestC: 0,
  combo: 0,
  comboT: 0,
  maxCombo: 0,
  balls: [],
  hooks: [],
  plats: [],
  player: makePlayer(),
  time: 78,
  timeMax: 78,
  ready: 0,
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flash: 0,
  flashRgb: CYN,
  next1up: 10000,
  lock: 0,
  why: '',
  pops: 0,
  clearing: false,
  clearT: 0,
  warned: false
};

function reduceMotion() {
  return motionQ.matches;
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
      this.master.gain.value = this.muted ? 0 : 0.34;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  setMuted: function (m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.34;
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
    o.frequency.setValueAtTime(Math.max(40, freq), t);
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
  shoot: function () {
    this.ensure();
    this.beep(880, 0.05, 'square', 0.04, 1560);
    this.noise(0.028, 0.028, 2400, 'highpass');
  },
  split: function (combo, size) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.075;
    this.beep((420 + size * 40) * p, 0.07, 'square', 0.07, 860 * p);
    this.beep((640 + size * 30) * p, 0.1, 'triangle', 0.04, 1100 * p);
    this.noise(0.05, 0.05, 1700, 'highpass');
  },
  pop: function (combo) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.08;
    this.beep(620 * p, 0.08, 'square', 0.075, 1240 * p);
    this.beep(980 * p, 0.12, 'triangle', 0.045, 1560 * p);
    this.noise(0.07, 0.07, 2100, 'highpass');
  },
  bounce: function () {
    this.ensure();
    this.beep(180, 0.03, 'sine', 0.018, 90);
  },
  plat: function () {
    this.ensure();
    this.beep(240, 0.025, 'square', 0.012, 140);
  },
  die: function () {
    this.ensure();
    this.noise(0.18, 0.12, 240, 'lowpass');
    this.beep(320, 0.24, 'sawtooth', 0.06, 70);
    this.beep(180, 0.2, 'square', 0.04, 50);
  },
  clear: function () {
    this.ensure();
    this.beep(392, 0.1, 'square', 0.06, 523);
    this.beep(523, 0.12, 'square', 0.055, 659);
    this.beep(784, 0.2, 'triangle', 0.05, 1046);
  },
  over: function () {
    this.ensure();
    this.beep(196, 0.18, 'sawtooth', 0.05, 98);
    this.beep(130, 0.28, 'square', 0.04, 60);
  },
  win: function () {
    this.ensure();
    this.beep(523, 0.1, 'square', 0.055, 659);
    this.beep(659, 0.12, 'triangle', 0.05, 784);
    this.beep(1046, 0.22, 'square', 0.045, 1318);
  },
  oneup: function () {
    this.ensure();
    this.beep(660, 0.08, 'square', 0.05, 880);
    this.beep(880, 0.12, 'triangle', 0.045, 1320);
  },
  ui: function () {
    this.ensure();
    this.beep(640, 0.05, 'square', 0.035, 420);
  },
  start: function () {
    this.ensure();
    this.beep(330, 0.08, 'square', 0.04, 440);
    this.beep(440, 0.1, 'triangle', 0.04, 660);
  },
  warn: function () {
    this.ensure();
    this.beep(220, 0.08, 'square', 0.04, 160);
  }
};

try {
  if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
} catch (e) { /* ignore */ }

function loadBest() {
  try {
    var s = localStorage.getItem(BEST_KEY);
    var o = JSON.parse(s);
    if (o && typeof o === 'object') {
      G.bestR = (o.r | 0) || (o.g | 0);
      G.bestC = (o.c | 0) || (o.p | 0);
      return;
    }
    if (typeof o === 'number') {
      G.bestR = o | 0;
      G.bestC = o | 0;
    }
  } catch (e) { /* ignore */ }
}

function persistBest() {
  var cur = G.chain ? G.bestC : G.bestR;
  if (G.score > cur) {
    if (G.chain) G.bestC = G.score;
    else G.bestR = G.score;
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ r: G.bestR, c: G.bestC }));
  } catch (e) { /* ignore */ }
}

function currentBest() {
  return G.chain ? G.bestC : G.bestR;
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

function kick(n, cls) {
  if (reduceMotion()) return;
  G.kickX = (Math.random() < 0.5 ? -1 : 1) * n;
  G.kickY = -n * 0.35;
  stageEl.classList.remove('hop', 'pop', 'die', 'clear');
  void stageEl.offsetWidth;
  stageEl.classList.add(cls || 'hop');
  clearTimeout(kickTok);
  kickTok = setTimeout(function () {
    stageEl.classList.remove('hop', 'pop', 'die', 'clear');
  }, 220);
}

function flash(rgb, t) {
  G.flashRgb = rgb;
  G.flash = t;
}

function capArr(arr, n) {
  if (arr.length > n) arr.splice(0, arr.length - n);
}

function burst(x, y, n, rgb, spd, life, grav) {
  var i, count;
  count = reduceMotion() ? Math.min(6, n) : n;
  for (i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: rand(-1, 1) * spd,
      vy: rand(-1.15, 0.35) * spd,
      t: life * rand(0.55, 1.2),
      max: life,
      r: rand(1.1, 2.8),
      rgb: rgb,
      g: grav == null ? 240 : grav
    });
  }
  capArr(particles, 200);
}

function spark(x, y, n, rgb) {
  var i;
  for (i = 0; i < n; i++) {
    sparks.push({
      x: x,
      y: y,
      vx: rand(-1, 1) * 220,
      vy: rand(-1.2, 0.4) * 220,
      t: rand(0.08, 0.2),
      rgb: rgb
    });
  }
  capArr(sparks, 90);
}

function ringAt(x, y, rgb, r) {
  rings.push({ x: x, y: y, r: r || 8, t: 0.3, rgb: rgb, grow: r ? r * 2.4 : 22 });
  capArr(rings, 18);
}

function floatText(x, y, text, rgb) {
  floats.push({ x: x, y: y, text: text, t: 0.72, rgb: rgb || GOLD });
  capArr(floats, 28);
}

function clearFx() {
  particles.length = 0;
  sparks.length = 0;
  floats.length = 0;
  rings.length = 0;
}

function toast(msg, kind) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden', 'warn', 'gold');
  if (kind) toastEl.classList.add(kind);
  clearTimeout(toastTok);
  toastTok = setTimeout(function () { toastEl.classList.add('hidden'); }, 1100);
}

function addScore(n, x, y) {
  if (n <= 0) return;
  G.score += n;
  if (G.score > currentBest()) persistBest();
  scoreEl.textContent = String(G.score);
  bestEl.textContent = String(currentBest());
  scoreBox.classList.remove('flash');
  void scoreBox.offsetWidth;
  scoreBox.classList.add('flash');
  scoreAdd.hidden = false;
  scoreAdd.textContent = '+' + n;
  clearTimeout(addTok);
  addTok = setTimeout(function () { scoreAdd.hidden = true; }, 680);
  if (x != null) floatText(x, y - 14, '+' + n, GOLD);
  while (G.score >= G.next1up && G.lives < 6) {
    G.lives += 1;
    G.next1up += 10000;
    renderPips();
    audio.oneup();
    toast('1UP', 'gold');
  }
}

function bumpCombo() {
  G.combo += 1;
  G.comboT = COMBO_WIN;
  if (G.combo > G.maxCombo) G.maxCombo = G.combo;
  comboEl.textContent = '×' + comboMult(G.combo);
  comboBox.classList.remove('hot');
  void comboBox.offsetWidth;
  comboBox.classList.add('hot');
  clearTimeout(comboTok);
  comboTok = setTimeout(function () { comboBox.classList.remove('hot'); }, 340);
}

function resetCombo() {
  if (G.combo >= 4) toast('连爆断了', 'warn');
  G.combo = 0;
  G.comboT = 0;
  comboEl.textContent = '×1';
}

function renderPips() {
  var i, html;
  html = '';
  for (i = 0; i < Math.max(LIVES, G.lives); i++) {
    html += '<span class="pip' + (i < G.lives ? ' on' : ' gone') + '"></span>';
  }
  pipsEl.innerHTML = html;
}

function renderTime() {
  var t;
  if (G.chain) {
    timeWrap.classList.add('gone');
    return;
  }
  timeWrap.classList.remove('gone');
  t = G.timeMax > 0 ? clamp(G.time / G.timeMax, 0, 1) : 0;
  timeBar.style.transform = 'scaleX(' + t + ')';
  timeBar.classList.toggle('warn', G.time <= 10 && G.mode === 'play');
}

function overlayOpen() {
  return !overlayEl.classList.contains('hidden');
}

function hideOverlay() {
  overlayEl.classList.add('hidden');
}

function showOverlay(kind) {
  overlayEl.classList.remove('hidden');
  panelEl.classList.remove('win', 'lose');
  if (kind === 'win') panelEl.classList.add('win');
  if (kind === 'lose') panelEl.classList.add('lose');
  ovStart.classList.toggle('gone', kind !== 'title');
  ovEnd.classList.toggle('gone', kind === 'title');
}

function hudPlay() {
  scoreEl.textContent = String(G.score);
  bestEl.textContent = String(currentBest());
  comboEl.textContent = '×' + (G.combo ? comboMult(G.combo) : 1);
  stageNumEl.textContent = String(G.chain ? G.wave : G.stage);
  stageEm.textContent = G.chain ? '波' : '房';
  modeLabel.textContent = G.chain ? '连爆' : '穿球';
  modeLabel.classList.toggle('chain', G.chain);
  if (G.chain) tagLabel.textContent = 'WAVE ' + G.wave;
  else tagLabel.textContent = (ROOMS[G.stage - 1] && ROOMS[G.stage - 1].name) || 'PANG';
  renderTime();
  renderPips();
}

function roomName() {
  if (G.chain) return '第' + G.wave + '波';
  return (ROOMS[G.stage - 1] && ROOMS[G.stage - 1].name) || '空厅';
}

function seedMotes() {
  var i;
  motes.length = 0;
  for (i = 0; i < 28; i++) {
    motes.push({
      x: rand(WALL, WORLD_W - WALL),
      y: rand(CEIL, FLOOR),
      r: rand(0.6, 1.6),
      a: rand(0.04, 0.14),
      s: rand(6, 18)
    });
  }
}

function spawnFromList(list, spdMul) {
  var i, spec, b;
  G.balls = [];
  for (i = 0; i < list.length; i++) {
    spec = list[i];
    b = makeBall(spec.x, spec.y, spec.size, spec.dir, spdMul);
    G.balls.push(b);
  }
}

function loadRoom(resetTime) {
  var room, mul;
  G.hooks = [];
  G.clearing = false;
  G.clearT = 0;
  G.warned = false;
  G.player.x = WORLD_W * 0.5;
  G.player.vx = 0;
  G.player.fireCd = 0;
  G.player.muzzle = 0;
  G.ready = READY_T;
  if (G.chain) {
    mul = chainSpeed(G.wave);
    G.plats = chainWavePlats(G.wave).slice();
    spawnFromList(chainWaveBalls(G.wave), mul);
    G.time = 0;
    G.timeMax = 0;
  } else {
    room = ROOMS[clamp(G.stage - 1, 0, ROOMS.length - 1)];
    G.plats = room.plats.slice();
    spawnFromList(room.balls, 1);
    if (resetTime !== false) {
      G.time = room.time;
      G.timeMax = room.time;
    }
  }
  hudPlay();
}

function beginStage() {
  loadRoom(true);
  toast(roomName(), G.chain ? 'gold' : '');
}

function showTitle() {
  G.mode = 'title';
  G.kind = 'rooms';
  G.chain = false;
  G.stage = 1;
  G.wave = 1;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  G.lock = 0;
  G.player = makePlayer();
  G.hooks = [];
  G.plats = [{ x: 140, y: 268, w: 140, h: 12 }];
  spawnFromList([
    { x: 130, y: 90, size: 3, dir: 1 },
    { x: 300, y: 140, size: 2, dir: -1 },
    { x: 80, y: 220, size: 1, dir: 1 }
  ], 0.85);
  G.time = 78;
  G.timeMax = 78;
  clearFx();
  showOverlay('title');
  ovKicker.textContent = 'PANG';
  ovTitle.textContent = '穿球';
  ovLead.textContent = '地上左右走，空格向上射叉。气球落地就弹，叉中裂成两只更小的，最小的才爆掉。身子碰到球就丢命，清完一房过关。';
  ovOps.textContent = OPS;
  hintEl.textContent = '向上射叉裂气球 · 最小才爆 · 别让球撞到人 · 平台挡叉';
  hintEl.className = 'hint';
  hudPlay();
  modeLabel.textContent = '穿球';
  tagLabel.textContent = 'PANG';
  bestEl.textContent = String(Math.max(G.bestR, G.bestC));
}

function showOver() {
  G.mode = 'over';
  persistBest();
  showOverlay('lose');
  ovKicker.textContent = 'PANG';
  ovTitle.textContent = '命尽';
  ovLead.textContent = G.why === 'time'
    ? '时限到了。本局 ' + G.score + '，连爆最高 ×' + Math.max(1, G.maxCombo) + '。'
    : '气球撞上了。本局 ' + G.score + '，连爆最高 ×' + Math.max(1, G.maxCombo) + '。';
  ovOps.textContent = 'R 或 再来 · 换模式回标题';
  hintEl.textContent = '一键 R 重开';
  hintEl.className = 'hint warn';
  audio.over();
}

function showWin() {
  G.mode = 'win';
  addScore(1800, WORLD_W * 0.5, 180);
  persistBest();
  showOverlay('win');
  ovKicker.textContent = 'CLEAR';
  ovTitle.textContent = '穿尽';
  ovLead.textContent = '五房气球全裂。本局 ' + G.score + '，连爆最高 ×' + Math.max(1, G.maxCombo) + '。';
  ovOps.textContent = 'R 或 再来 · 2 / 换模式去连爆';
  hintEl.textContent = '连爆更快更密，双叉在手';
  hintEl.className = 'hint hot';
  audio.win();
  kick(5, 'clear');
  flash(GOLD, 0.5);
}

function startGame(kind) {
  G.kind = kind === 'chain' ? 'chain' : 'rooms';
  G.chain = G.kind === 'chain';
  G.mode = 'play';
  G.stage = 1;
  G.wave = 1;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  G.comboT = 0;
  G.maxCombo = 0;
  G.pops = 0;
  G.next1up = 10000;
  G.lock = 0;
  G.why = '';
  G.stop = 0;
  G.player = makePlayer();
  clearFx();
  hideOverlay();
  audio.start();
  hudPlay();
  beginStage();
  hintEl.className = 'hint';
  hintEl.textContent = G.chain
    ? '连爆不停。球更快更密，可同时两支叉。'
    : '五房清屏。叉会被平台挡住，从缝里穿。';
}

function retry() {
  audio.ui();
  if (G.mode === 'title') startGame('rooms');
  else startGame(G.kind);
}

function nextStage() {
  if (G.chain) {
    G.wave += 1;
    addScore(300 * G.wave, WORLD_W * 0.5, 150);
    beginStage();
    return;
  }
  addScore(800 * G.stage, WORLD_W * 0.5, 150);
  if (G.stage >= ROOM_COUNT) {
    showWin();
    return;
  }
  G.stage += 1;
  beginStage();
}

function fire() {
  var p = G.player;
  var cap;
  if (G.mode !== 'play' || G.lock > 0 || G.clearing) return;
  if (p.deadT > 0 || p.fireCd > 0) return;
  cap = hookCap(G.chain);
  if (liveHookCount(G.hooks) >= cap) return;
  G.hooks.push(makeHook(p.x + p.face * 2, p.y - 18));
  p.fireCd = 0.1;
  p.muzzle = 0.08;
  p.squash = 0.86;
  audio.shoot();
  spark(p.x, p.y - 20, 4, CYN);
}

function hitBall(b) {
  var kids, i, kid, n, spec;
  if (!b.live) return;
  b.live = false;
  G.pops += 1;
  bumpCombo();
  n = popScore(b.size, G.combo);
  addScore(n, b.x, b.y);
  spec = sizeSpec(b.size);
  hitStop(spec.stop);
  shake(b.size >= 2 ? 5 : 3);
  kick(b.size === 0 ? 4 : 3, b.size === 0 ? 'pop' : 'hop');
  flash(b.size === 0 ? GOLD : spec.rgb, b.size === 0 ? 0.22 : 0.14);
  burst(b.x, b.y, b.size === 0 ? 22 : 14, spec.rgb, 180 + b.size * 20, 0.42, 200);
  spark(b.x, b.y, b.size === 0 ? 10 : 6, WHT);
  ringAt(b.x, b.y, spec.rgb, b.r);
  if (G.combo >= 2) floatText(b.x, b.y - 28, '连×' + G.combo, MAG);
  if (b.size <= 0) {
    audio.pop(G.combo);
  } else {
    audio.split(G.combo, b.size);
    kids = splitKids(b.x, b.y, b.size, G.chain ? chainSpeed(G.wave) : 1);
    for (i = 0; i < kids.length; i++) {
      kid = kids[i];
      kid.x = clamp(kid.x, WALL + kid.r, WORLD_W - WALL - kid.r);
      kid.y = clamp(kid.y, CEIL + kid.r, FLOOR - kid.r);
      kid.vy = -Math.max(160, kid.bounce * 0.42);
      kid.squash = 0.7;
      G.balls.push(kid);
    }
  }
  if (G.combo === 4 || G.combo === 8) toast('连爆 ×' + G.combo, 'gold');
}

function killPlayer(why) {
  var p = G.player;
  if (G.lock > 0 || p.inv > 0 || p.deadT > 0) return;
  G.why = why || 'hit';
  G.lock = DIE_T;
  p.deadT = DIE_T;
  p.inv = 0;
  G.hooks = [];
  G.lives -= 1;
  renderPips();
  audio.die();
  hitStop(0.08);
  shake(8);
  kick(6, 'die');
  flash(MAG, 0.45);
  burst(p.x, p.y - 12, 24, HOT, 210, 0.5, 140);
  resetCombo();
}

function afterDie() {
  if (G.lives <= 0) {
    showOver();
    return;
  }
  G.player = makePlayer();
  G.player.inv = INVULN;
  G.lock = 0;
  G.hooks = [];
  if (G.why === 'time' && !G.chain) loadRoom(true);
  else G.ready = READY_T;
  toast(G.why === 'time' ? '时限重开本房' : '再来', G.why === 'time' ? 'warn' : '');
  G.why = '';
}

function resolvePlat(b, plat, px, py) {
  var r = b.r;
  var left = plat.x;
  var right = plat.x + plat.w;
  var top = plat.y;
  var bot = plat.y + plat.h;
  var wasAbove, wasBelow, wasLeft, wasRight;
  if (!circleRect(b.x, b.y, r, left, top, plat.w, plat.h)) return false;
  wasAbove = py + r <= top + 2;
  wasBelow = py - r >= bot - 2;
  wasLeft = px + r <= left + 2;
  wasRight = px - r >= right - 2;
  if (wasAbove && b.vy >= 0) {
    b.y = top - r;
    b.vy = -b.bounce;
    b.squash = 0.68;
    return 'floor';
  }
  if (wasBelow && b.vy <= 0) {
    b.y = bot + r;
    b.vy = Math.abs(b.vy) * 0.55;
    return 'ceil';
  }
  if (wasLeft) {
    b.x = left - r;
    b.vx = -Math.abs(b.vx);
    return 'side';
  }
  if (wasRight) {
    b.x = right + r;
    b.vx = Math.abs(b.vx);
    return 'side';
  }
  if (b.y < top + plat.h * 0.5) {
    b.y = top - r;
    if (b.vy > 0) {
      b.vy = -b.bounce;
      b.squash = 0.7;
    }
    return 'floor';
  }
  b.y = bot + r;
  if (b.vy < 0) b.vy = Math.abs(b.vy) * 0.5;
  return 'ceil';
}

function stepBall(b, dt, silent) {
  var px = b.x;
  var py = b.y;
  var i, hit, bounced;
  if (!b.live) return;
  b.vy += GRAVITY * dt;
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  b.spin += dt * 1.6;
  b.squash = lerp(b.squash, 1, clamp(dt * 10, 0, 1));
  bounced = false;
  if (b.x - b.r < WALL) {
    b.x = WALL + b.r;
    b.vx = Math.abs(b.vx);
    bounced = true;
  } else if (b.x + b.r > WORLD_W - WALL) {
    b.x = WORLD_W - WALL - b.r;
    b.vx = -Math.abs(b.vx);
    bounced = true;
  }
  if (b.y - b.r < CEIL) {
    b.y = CEIL + b.r;
    if (b.vy < 0) b.vy = Math.abs(b.vy) * 0.42;
  }
  if (b.y + b.r > FLOOR) {
    b.y = FLOOR - b.r;
    b.vy = -b.bounce;
    b.squash = 0.64;
    bounced = true;
    if (!silent && Math.random() < 0.18) audio.bounce();
  }
  for (i = 0; i < G.plats.length; i++) {
    hit = resolvePlat(b, G.plats[i], px, py);
    if (hit === 'floor' && !silent && Math.random() < 0.2) audio.plat();
  }
}

function updateBalls(dt, interact) {
  var i, b, p;
  p = G.player;
  for (i = 0; i < G.balls.length; i++) {
    b = G.balls[i];
    if (!b.live) continue;
    stepBall(b, dt, !interact);
    if (!interact) continue;
    if (G.lock > 0 || p.deadT > 0 || p.inv > 0) continue;
    if (playerHitsBall(p.x, p.y, b.x, b.y, b.r)) killPlayer('hit');
  }
}

function updateHooks(dt) {
  var i, j, h, b, plat, hitY;
  for (i = 0; i < G.hooks.length; i++) {
    h = G.hooks[i];
    if (!h.live) continue;
    h.tipY -= HOOK_V * dt;
    if (h.tipY <= CEIL) {
      h.tipY = CEIL;
      h.live = false;
      spark(h.x, CEIL + 2, 5, CYN);
      continue;
    }
    hitY = -1;
    for (j = 0; j < G.plats.length; j++) {
      plat = G.plats[j];
      if (hookHitsPlat(h.x, h.tipY, h.baseY, plat)) {
        if (hitY < 0 || plat.y + plat.h < hitY) hitY = plat.y + plat.h;
      }
    }
    if (hitY >= 0 && h.tipY <= hitY) {
      h.tipY = hitY;
      h.live = false;
      spark(h.x, hitY, 6, TEAL);
      audio.plat();
      continue;
    }
    for (j = 0; j < G.balls.length; j++) {
      b = G.balls[j];
      if (!b.live) continue;
      if (hookHitsBall(h.x, h.tipY, h.baseY, b.x, b.y, b.r)) {
        h.live = false;
        hitBall(b);
        break;
      }
    }
  }
}

function wantedDir() {
  var dir = 0;
  if (keys.l) dir -= 1;
  if (keys.r) dir += 1;
  if (pointer.down && !keys.l && !keys.r) {
    if (pointer.x < G.player.x - 6) dir = -1;
    else if (pointer.x > G.player.x + 6) dir = 1;
  }
  return dir;
}

function updatePlayer(dt) {
  var p = G.player;
  var dir, maxX;
  if (p.deadT > 0) {
    p.deadT -= dt;
    p.squash = lerp(p.squash, 0.4, clamp(dt * 8, 0, 1));
    return;
  }
  if (p.inv > 0) p.inv -= dt;
  if (p.fireCd > 0) p.fireCd -= dt;
  if (p.muzzle > 0) p.muzzle -= dt;
  dir = G.lock > 0 ? 0 : wantedDir();
  p.vx = dir * PLAYER_SPD;
  if (dir) p.face = dir;
  p.x += p.vx * dt;
  maxX = WORLD_W - WALL - PLAYER_W * 0.5;
  p.x = clamp(p.x, WALL + PLAYER_W * 0.5, maxX);
  p.y = FLOOR;
  p.bob += dt * (dir ? 14 : 6);
  p.squash = lerp(p.squash, dir ? 0.94 : 1, clamp(dt * 12, 0, 1));
}

function updateFx(dt) {
  var i, p, s, r, f, m;
  G.t += dt;
  G.clock += dt;
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
  if (G.kickX) G.kickX *= Math.max(0, 1 - dt * 14);
  if (G.kickY) G.kickY *= Math.max(0, 1 - dt * 14);
  if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.6);
  if (G.comboT > 0) {
    G.comboT -= dt;
    if (G.comboT <= 0) resetCombo();
  }
  for (i = particles.length - 1; i >= 0; i--) {
    p = particles[i];
    p.t -= dt;
    p.vy += p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.t <= 0) particles.splice(i, 1);
  }
  for (i = sparks.length - 1; i >= 0; i--) {
    s = sparks[i];
    s.t -= dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (s.t <= 0) sparks.splice(i, 1);
  }
  for (i = rings.length - 1; i >= 0; i--) {
    r = rings[i];
    r.t -= dt;
    r.r += (r.grow || 22) * dt * 2.2;
    if (r.t <= 0) rings.splice(i, 1);
  }
  for (i = floats.length - 1; i >= 0; i--) {
    f = floats[i];
    f.t -= dt;
    f.y -= 28 * dt;
    if (f.t <= 0) floats.splice(i, 1);
  }
  for (i = 0; i < motes.length; i++) {
    m = motes[i];
    m.y -= m.s * dt * 0.25;
    if (m.y < CEIL) m.y = FLOOR;
  }
}

function pruneBalls() {
  var i;
  for (i = G.balls.length - 1; i >= 0; i--) {
    if (!G.balls[i].live) G.balls.splice(i, 1);
  }
  for (i = G.hooks.length - 1; i >= 0; i--) {
    if (!G.hooks[i].live) G.hooks.splice(i, 1);
  }
}

function updateDemo(dt) {
  G.player.bob += dt * 4;
  updateBalls(dt, false);
  updateFx(dt * 0.9);
}

function updatePlay(dt) {
  var p = G.player;
  if (G.lock > 0) {
    G.lock -= dt;
    updatePlayer(dt);
    updateFx(dt);
    if (G.lock <= 0) afterDie();
    return;
  }
  if (G.clearing) {
    G.clearT -= dt;
    updatePlayer(dt);
    updateFx(dt);
    if (G.clearT <= 0) nextStage();
    return;
  }
  if (G.ready > 0) G.ready -= dt;
  if (!G.chain) {
    G.time -= dt;
    if (G.time <= 10 && !G.warned) {
      G.warned = true;
      audio.warn();
      toast('时限将尽', 'warn');
    }
    renderTime();
    if (G.time <= 0) {
      G.time = 0;
      killPlayer('time');
      return;
    }
  }
  updatePlayer(dt);
  if (keys.fire && p.fireCd <= 0) fire();
  updateHooks(dt);
  updateBalls(dt, true);
  updateFx(dt);
  pruneBalls();
  if (liveBallCount(G.balls) <= 0) {
    G.clearing = true;
    G.clearT = CLEAR_T;
    G.hooks = [];
    audio.clear();
    kick(4, 'clear');
    flash(GOLD, 0.28);
    toast(G.chain ? '下一波' : '清房', 'gold');
  }
}

function update(dt) {
  if (G.stop > 0) {
    G.stop -= dt;
    updateFx(dt * 0.35);
    return;
  }
  if (G.mode === 'title' || G.mode === 'over' || G.mode === 'win') {
    updateDemo(dt);
    return;
  }
  if (G.mode === 'play') updatePlay(dt);
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

function roundRect(x, y, w, h, r) {
  var rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawBg() {
  var g, i, m;
  ctx.fillStyle = '#021014';
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(70), sy(40), 8, sx(90), sy(90), 240 * L.s);
  g.addColorStop(0, 'rgba(0,232,255,0.16)');
  g.addColorStop(1, 'rgba(0,232,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(340), sy(80), 8, sx(340), sy(120), 200 * L.s);
  g.addColorStop(0, 'rgba(255,61,184,0.1)');
  g.addColorStop(1, 'rgba(255,61,184,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);
  ctx.fillStyle = 'rgba(8, 28, 34, 0.55)';
  roundRect(sx(0), sy(0), WORLD_W * L.s, WORLD_H * L.s, 8 * L.s);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,232,255,0.22)';
  ctx.lineWidth = 2 * L.s;
  roundRect(sx(WALL - 6), sy(CEIL - 8), (WORLD_W - WALL * 2 + 12) * L.s, (FLOOR - CEIL + 16) * L.s, 6 * L.s);
  ctx.stroke();
  for (i = 0; i < motes.length; i++) {
    m = motes[i];
    ctx.fillStyle = 'rgba(122,246,255,' + m.a + ')';
    ctx.beginPath();
    ctx.arc(sx(m.x), sy(m.y), m.r * L.s, 0, TAU);
    ctx.fill();
  }
}

function drawGround() {
  var g;
  g = ctx.createLinearGradient(sx(0), sy(FLOOR - 8), sx(0), sy(WORLD_H));
  g.addColorStop(0, 'rgba(0,232,255,0.18)');
  g.addColorStop(0.18, '#0a2430');
  g.addColorStop(1, '#041018');
  ctx.fillStyle = g;
  ctx.fillRect(sx(WALL - 6), sy(FLOOR), (WORLD_W - WALL * 2 + 12) * L.s, (WORLD_H - FLOOR) * L.s);
  ctx.strokeStyle = '#00e8ff';
  ctx.lineWidth = 2.2 * L.s;
  ctx.beginPath();
  ctx.moveTo(sx(WALL - 4), sy(FLOOR));
  ctx.lineTo(sx(WORLD_W - WALL + 4), sy(FLOOR));
  ctx.stroke();
  ctx.strokeStyle = 'rgba(122,246,255,0.35)';
  ctx.lineWidth = 1 * L.s;
  ctx.beginPath();
  ctx.moveTo(sx(WALL - 4), sy(FLOOR + 3));
  ctx.lineTo(sx(WORLD_W - WALL + 4), sy(FLOOR + 3));
  ctx.stroke();
}

function drawPlats() {
  var i, p, x, y, w, h;
  for (i = 0; i < G.plats.length; i++) {
    p = G.plats[i];
    x = sx(p.x);
    y = sy(p.y);
    w = p.w * L.s;
    h = p.h * L.s;
    ctx.fillStyle = 'rgba(20,240,208,0.16)';
    roundRect(x, y, w, h, 3 * L.s);
    ctx.fill();
    ctx.fillStyle = '#14f0d0';
    ctx.fillRect(x, y, w, Math.max(2, 3.2 * L.s));
    ctx.fillStyle = 'rgba(232,251,255,0.45)';
    ctx.fillRect(x + 4 * L.s, y, w * 0.28, Math.max(1, 1.4 * L.s));
    ctx.strokeStyle = 'rgba(0,232,255,0.35)';
    ctx.lineWidth = 1 * L.s;
    roundRect(x, y, w, h, 3 * L.s);
    ctx.stroke();
  }
}

function drawBall(b) {
  var g, rx, ry, squash, wob;
  if (!b.live) return;
  squash = b.squash;
  wob = Math.sin(b.spin * 2) * 0.04;
  rx = b.r * (2 - squash) * (1 + wob);
  ry = b.r * squash * (1 - wob * 0.4);
  ctx.save();
  ctx.translate(sx(b.x), sy(b.y));
  g = ctx.createRadialGradient(-rx * 0.35 * L.s, -ry * 0.4 * L.s, 1, 0, 0, rx * L.s);
  g.addColorStop(0, rgba(WHT, 0.92));
  g.addColorStop(0.18, rgba(b.rgb, 0.95));
  g.addColorStop(0.72, rgba(b.rgb, 1));
  g.addColorStop(1, 'rgba(8,10,18,0.55)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * L.s, ry * L.s, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba(WHT, 0.28);
  ctx.lineWidth = 1.2 * L.s;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(-rx * 0.32 * L.s, -ry * 0.38 * L.s, rx * 0.22 * L.s, ry * 0.16 * L.s, -0.4, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawHooks() {
  var i, h, y0, y1;
  for (i = 0; i < G.hooks.length; i++) {
    h = G.hooks[i];
    if (!h.live) continue;
    y0 = sy(h.baseY);
    y1 = sy(h.tipY);
    ctx.strokeStyle = 'rgba(0,232,255,0.28)';
    ctx.lineWidth = 4.2 * L.s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx(h.x), y0);
    ctx.lineTo(sx(h.x), y1);
    ctx.stroke();
    ctx.strokeStyle = '#00e8ff';
    ctx.lineWidth = 1.8 * L.s;
    ctx.beginPath();
    ctx.moveTo(sx(h.x), y0);
    ctx.lineTo(sx(h.x), y1);
    ctx.stroke();
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.moveTo(sx(h.x), y1 - 2 * L.s);
    ctx.lineTo(sx(h.x - 4.2), y1 + 8 * L.s);
    ctx.lineTo(sx(h.x + 4.2), y1 + 8 * L.s);
    ctx.closePath();
    ctx.fill();
    if (!reduceMotion()) {
      ctx.strokeStyle = 'rgba(255,227,107,0.35)';
      ctx.lineWidth = 1 * L.s;
      ctx.beginPath();
      ctx.moveTo(sx(h.x), y1);
      ctx.lineTo(sx(h.x), y1 + 10 * L.s);
      ctx.stroke();
    }
  }
}

function drawPlayer() {
  var p = G.player;
  var blink = p.inv > 0 && ((p.inv * 12) | 0) % 2 === 0;
  var bob = Math.sin(p.bob) * (p.vx ? 1.6 : 0.5);
  var s = p.squash;
  var x = p.x;
  var y = p.y + bob;
  var face = p.face;
  if (blink) ctx.globalAlpha = 0.35;
  if (G.lock > 0 && p.deadT > 0) ctx.globalAlpha = clamp(p.deadT / DIE_T, 0, 1);
  ctx.fillStyle = '#0a4a52';
  roundRect(sx(x - 9), sy(y - 8), 18 * L.s, 8 * L.s, 2 * L.s);
  ctx.fill();
  ctx.fillStyle = '#14f0d0';
  roundRect(sx(x - 8), sy(y - 22 * s), 16 * L.s, 16 * L.s * s, 3 * L.s);
  ctx.fill();
  ctx.fillStyle = '#e8fff8';
  ctx.beginPath();
  ctx.ellipse(sx(x), sy(y - 28 * s), 6.2 * L.s, 5.6 * L.s * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#00e8ff';
  roundRect(sx(x - 6.4), sy(y - 32 * s), 12.8 * L.s, 3.4 * L.s, 1.4 * L.s);
  ctx.fill();
  ctx.fillStyle = '#030b0e';
  ctx.beginPath();
  ctx.arc(sx(x + face * 2.2), sy(y - 28 * s), 1.15 * L.s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffe36b';
  ctx.fillRect(sx(x - 7), sy(y - 14 * s), 14 * L.s, 2.1 * L.s);
  ctx.strokeStyle = '#00e8ff';
  ctx.lineWidth = 2 * L.s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx(x + face * 5), sy(y - 18 * s));
  ctx.lineTo(sx(x + face * 5), sy(y - 34 * s));
  ctx.stroke();
  ctx.fillStyle = '#ffe36b';
  ctx.beginPath();
  ctx.moveTo(sx(x + face * 5), sy(y - 36 * s));
  ctx.lineTo(sx(x + face * 5 - 3.4), sy(y - 30 * s));
  ctx.lineTo(sx(x + face * 5 + 3.4), sy(y - 30 * s));
  ctx.closePath();
  ctx.fill();
  if (p.muzzle > 0) {
    ctx.fillStyle = rgba(CYN, p.muzzle / 0.08);
    ctx.beginPath();
    ctx.arc(sx(x + face * 5), sy(y - 34 * s), 5 * L.s, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#0a3040';
  roundRect(sx(x - 7.5), sy(y - 4), 6 * L.s, 4 * L.s, 1.2 * L.s);
  ctx.fill();
  roundRect(sx(x + 1.5), sy(y - 4), 6 * L.s, 4 * L.s, 1.2 * L.s);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawFx() {
  var i, p, s, r, f, a;
  for (i = 0; i < particles.length; i++) {
    p = particles[i];
    a = clamp(p.t / p.max, 0, 1);
    ctx.fillStyle = rgba(p.rgb, a);
    ctx.beginPath();
    ctx.arc(sx(p.x), sy(p.y), p.r * L.s, 0, TAU);
    ctx.fill();
  }
  for (i = 0; i < sparks.length; i++) {
    s = sparks[i];
    ctx.strokeStyle = rgba(s.rgb, clamp(s.t / 0.2, 0, 1));
    ctx.lineWidth = 1.2 * L.s;
    ctx.beginPath();
    ctx.moveTo(sx(s.x), sy(s.y));
    ctx.lineTo(sx(s.x - s.vx * 0.035), sy(s.y - s.vy * 0.035));
    ctx.stroke();
  }
  for (i = 0; i < rings.length; i++) {
    r = rings[i];
    ctx.strokeStyle = rgba(r.rgb, clamp(r.t / 0.3, 0, 1));
    ctx.lineWidth = 2.1 * L.s;
    ctx.beginPath();
    ctx.arc(sx(r.x), sy(r.y), r.r * L.s, 0, TAU);
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.stroke();
  }
  ctx.font = '700 ' + Math.max(10, 11 * L.s) + 'px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  for (i = 0; i < floats.length; i++) {
    f = floats[i];
    ctx.fillStyle = rgba(f.rgb, clamp(f.t / 0.72, 0, 1));
    ctx.fillText(f.text, sx(f.x), sy(f.y));
  }
  ctx.textAlign = 'left';
}

function drawFlash() {
  if (G.flash <= 0) return;
  ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.28);
  ctx.fillRect(0, 0, cssW, cssH);
}

function drawReady() {
  var a;
  if (G.mode !== 'play' || G.ready <= 0) return;
  a = clamp(G.ready / READY_T, 0, 1);
  ctx.font = '800 ' + Math.max(16, 22 * L.s) + 'px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = rgba(CYN, a);
  ctx.fillText(roomName(), sx(WORLD_W * 0.5), sy(150));
  ctx.textAlign = 'left';
}

function drawTimeWorld() {
  var t, w;
  if (G.mode !== 'play' || G.chain) return;
  t = G.timeMax > 0 ? clamp(G.time / G.timeMax, 0, 1) : 0;
  w = (WORLD_W - WALL * 2) * t;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(sx(WALL), sy(CEIL - 14), (WORLD_W - WALL * 2) * L.s, 5 * L.s, 2 * L.s);
  ctx.fill();
  ctx.fillStyle = t <= 10 / Math.max(1, G.timeMax) || G.time <= 10 ? '#ff3db8' : '#00e8ff';
  roundRect(sx(WALL), sy(CEIL - 14), w * L.s, 5 * L.s, 2 * L.s);
  ctx.fill();
}

function draw() {
  var i, ox, oy;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ox = G.kickX + (G.shake ? rand(-G.shake, G.shake) : 0);
  oy = G.kickY + (G.shake ? rand(-G.shake, G.shake) * 0.6 : 0);
  ctx.translate(ox, oy);
  drawBg();
  drawPlats();
  drawGround();
  drawTimeWorld();
  for (i = 0; i < G.balls.length; i++) drawBall(G.balls[i]);
  drawHooks();
  if (G.mode !== 'title') drawPlayer();
  else {
    G.player.y = FLOOR;
    G.player.inv = 0;
    drawPlayer();
  }
  drawFx();
  drawReady();
  drawFlash();
}

function pointerWorldX(e) {
  var rect = canvas.getBoundingClientRect();
  return (e.clientX - rect.left - L.x) / L.s;
}

/* ---- input ---- */
function bindPad(el, setter, tap) {
  function down(ev) {
    ev.preventDefault();
    setter(true);
    el.classList.add('held');
    audio.ensure();
    if (tap) tap();
    try { el.setPointerCapture(ev.pointerId); } catch (err) { /* ignore */ }
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
bindPad(btnFire, function (v) { keys.fire = v; }, function () { fire(); });

function keyMove(e, down) {
  var k = e.code;
  if (k === 'ArrowLeft' || k === 'KeyA') { keys.l = down; e.preventDefault(); }
  else if (k === 'ArrowRight' || k === 'KeyD') { keys.r = down; e.preventDefault(); }
  else if (k === 'Space') { keys.fire = down; e.preventDefault(); }
  else if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'KeyW' || k === 'KeyS') e.preventDefault();
}

window.addEventListener('keydown', function (e) {
  if (e.repeat) {
    keyMove(e, true);
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
      startGame('rooms');
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      startGame('chain');
      e.preventDefault();
      return;
    }
  }
  if (G.mode === 'over' || G.mode === 'win') {
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Digit1') {
      startGame(G.kind);
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      if (G.mode === 'win') startGame('chain');
      else showTitle();
      e.preventDefault();
      return;
    }
  }
  if (overlayOpen() && G.mode !== 'play') return;
  keyMove(e, true);
  if (e.code === 'Space') fire();
});

window.addEventListener('keyup', function (e) {
  keyMove(e, false);
});

btnMute.addEventListener('click', function () {
  audio.ensure();
  audio.setMuted(!audio.muted);
});
btnRetry.addEventListener('click', function () {
  audio.ensure();
  retry();
});
btnRooms.addEventListener('click', function () {
  audio.ensure();
  startGame('rooms');
});
btnChain.addEventListener('click', function () {
  audio.ensure();
  startGame('chain');
});
ovAgain.addEventListener('click', function () {
  audio.ensure();
  startGame(G.kind);
});
ovMenu.addEventListener('click', function () {
  audio.ensure();
  showTitle();
});

canvas.addEventListener('pointerdown', function (e) {
  audio.ensure();
  e.preventDefault();
  if (overlayOpen() && G.mode !== 'play') return;
  pointer.down = true;
  pointer.id = e.pointerId;
  pointer.x = clamp(pointerWorldX(e), WALL, WORLD_W - WALL);
  fire();
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  canvas.focus({ preventScroll: true });
});
canvas.addEventListener('pointermove', function (e) {
  pointer.x = clamp(pointerWorldX(e), WALL, WORLD_W - WALL);
});
function ptrUp(e) {
  if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
  pointer.down = false;
  pointer.id = null;
}
canvas.addEventListener('pointerup', ptrUp);
canvas.addEventListener('pointercancel', ptrUp);
canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

window.addEventListener('resize', resize);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resize);
}
document.addEventListener('visibilitychange', function () {
  hidden = document.hidden;
  if (!hidden) {
    lastTs = 0;
    acc = 0;
  } else {
    keys.l = keys.r = keys.fire = false;
    pointer.down = false;
  }
});

function frame(now) {
  var t, dt, n;
  requestAnimationFrame(frame);
  if (hidden) {
    lastTs = now * 0.001;
    return;
  }
  t = now * 0.001;
  if (!lastTs) lastTs = t;
  dt = t - lastTs;
  lastTs = t;
  if (dt > 0.05) dt = 0.05;
  acc += dt;
  n = 0;
  while (acc >= STEP && n < 5) {
    update(STEP);
    acc -= STEP;
    n += 1;
  }
  draw();
}

seedMotes();
renderPips();
showTitle();
resize();
hudPlay();
modeLabel.textContent = '穿球';
bestEl.textContent = String(Math.max(G.bestR, G.bestC));
requestAnimationFrame(frame);

}
