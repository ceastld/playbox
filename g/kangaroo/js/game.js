'use strict';

/* 袋鼠 — Kangaroo remake. Punch monkeys, climb, rescue the joey. No CDN. */

var WORLD_W = 400;
var WORLD_H = 540;
var LIVES = 3;
var PW = 14;
var PH = 26;
var DUCK_H = 14;
var WALK = 132;
var CLIMB = 98;
var JUMP_V = 438;
var GRAV = 980;
var MAX_FALL = 460;
var PUNCH_T = 0.2;
var PUNCH_HIT0 = 0.012;
var PUNCH_HIT1 = 0.152;
var PUNCH_RANGE = 26;
var GLOVE_RANGE = 42;
var GLOVE_T = 8.2;
var INVULN = 0.88;
var DIE_T = 0.58;
var COYOTE = 0.09;
var BUFFER = 0.12;
var COMBO_WIN = 1.38;
var MONKEY_SCORE = 200;
var APPLE_SCORE = 50;
var GLOVE_SCORE = 400;
var CLEAR_SCORE = 1000;
var CLEAR_ROUND = 250;
var APPLE_R = 5.6;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var BEST_KEY = 'playbox-kangaroo-best';
var MUTE_KEY = 'playbox-kangaroo-mute';
var FRUIT_SCORE = [100, 200, 300, 500];
var FRUIT_NAME = ['樱桃', '草莓', '香蕉', '菠萝'];
var MAG = [255, 61, 184];
var CYN = [0, 240, 255];
var GOLD = [255, 227, 107];
var HOT = [255, 136, 31];
var HOT2 = [255, 176, 74];
var LEAF = [61, 255, 136];
var RED = [255, 58, 62];
var WHT = [246, 243, 255];

var STAGES = [
  {
    name: '树穴',
    plats: [
      { x: 0, y: 516, w: 400 },
      { x: 10, y: 428, w: 156 },
      { x: 230, y: 428, w: 158 },
      { x: 84, y: 344, w: 154 },
      { x: 208, y: 258, w: 158 },
      { x: 18, y: 172, w: 168 },
      { x: 218, y: 86, w: 154 }
    ],
    vines: [
      { x: 46, y0: 428, y1: 516 },
      { x: 148, y0: 344, y1: 428 },
      { x: 248, y0: 258, y1: 344 },
      { x: 156, y0: 172, y1: 258 },
      { x: 286, y0: 86, y1: 172 }
    ],
    monkeys: [
      { plat: 1, x: 88 },
      { plat: 3, x: 150 },
      { plat: 4, x: 290 }
    ],
    extra: [{ plat: 5, x: 70 }],
    fruit: [
      { plat: 2, x: 300, kind: 0 },
      { plat: 5, x: 70, kind: 1 }
    ],
    glove: { plat: 2, x: 352 },
    cage: { plat: 6, x: 292 },
    spawn: { plat: 0, x: 56 }
  },
  {
    name: '林冠',
    plats: [
      { x: 0, y: 516, w: 400 },
      { x: 8, y: 430, w: 110 },
      { x: 196, y: 430, w: 192 },
      { x: 36, y: 342, w: 156 },
      { x: 246, y: 342, w: 140 },
      { x: 110, y: 252, w: 176 },
      { x: 8, y: 164, w: 150 },
      { x: 236, y: 164, w: 152 },
      { x: 78, y: 78, w: 168 }
    ],
    vines: [
      { x: 54, y0: 430, y1: 516 },
      { x: 250, y0: 342, y1: 430 },
      { x: 160, y0: 252, y1: 342 },
      { x: 80, y0: 164, y1: 252 },
      { x: 310, y0: 164, y1: 252 },
      { x: 150, y0: 78, y1: 164 }
    ],
    monkeys: [
      { plat: 2, x: 260 },
      { plat: 3, x: 90 },
      { plat: 5, x: 190 },
      { plat: 7, x: 310 }
    ],
    extra: [
      { plat: 1, x: 50 },
      { plat: 4, x: 300 }
    ],
    fruit: [
      { plat: 1, x: 60, kind: 0 },
      { plat: 4, x: 320, kind: 2 },
      { plat: 6, x: 40, kind: 1 }
    ],
    glove: { plat: 4, x: 360 },
    cage: { plat: 8, x: 160 },
    spawn: { plat: 0, x: 330 }
  },
  {
    name: '猴寨',
    plats: [
      { x: 0, y: 516, w: 400 },
      { x: 20, y: 434, w: 120 },
      { x: 180, y: 434, w: 90 },
      { x: 300, y: 434, w: 88 },
      { x: 70, y: 348, w: 140 },
      { x: 250, y: 348, w: 130 },
      { x: 16, y: 262, w: 120 },
      { x: 168, y: 262, w: 150 },
      { x: 90, y: 176, w: 130 },
      { x: 260, y: 176, w: 120 },
      { x: 200, y: 88, w: 150 }
    ],
    vines: [
      { x: 70, y0: 434, y1: 516 },
      { x: 220, y0: 348, y1: 434 },
      { x: 320, y0: 348, y1: 434 },
      { x: 90, y0: 262, y1: 348 },
      { x: 280, y0: 176, y1: 262 },
      { x: 140, y0: 176, y1: 262 },
      { x: 270, y0: 88, y1: 176 }
    ],
    monkeys: [
      { plat: 1, x: 70 },
      { plat: 4, x: 130 },
      { plat: 5, x: 300 },
      { plat: 7, x: 230 },
      { plat: 9, x: 310 }
    ],
    extra: [
      { plat: 2, x: 220 },
      { plat: 6, x: 50 },
      { plat: 8, x: 140 }
    ],
    fruit: [
      { plat: 3, x: 340, kind: 1 },
      { plat: 6, x: 50, kind: 2 },
      { plat: 8, x: 140, kind: 3 }
    ],
    glove: { plat: 3, x: 344 },
    cage: { plat: 10, x: 276 },
    spawn: { plat: 0, x: 48 }
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
function rgba(rgb, a) {
  return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
}
function hypot(x, y) {
  return Math.sqrt(x * x + y * y);
}
function sign(v) {
  return v < 0 ? -1 : v > 0 ? 1 : 0;
}
function capArr(arr, n) {
  if (arr.length > n) arr.splice(0, arr.length - n);
}

function jumpHeight() {
  return (JUMP_V * JUMP_V) / (2 * GRAV);
}

function punchRange(glove) {
  return glove ? GLOVE_RANGE : PUNCH_RANGE;
}

function comboMul(n) {
  var c = n | 0;
  if (c < 1) return 1;
  if (c > 8) return 8;
  return c;
}

function roundMul(round) {
  return 1 + Math.max(0, round - 1) * 0.12;
}

function appleInterval(round, swarm) {
  var base = swarm ? 0.78 : 1.52;
  var t = base / (1 + Math.max(0, round - 1) * 0.13);
  var floor = swarm ? 0.4 : 0.7;
  return t < floor ? floor : t;
}

function monkeySpd(round, swarm) {
  return (swarm ? 56 : 42) * roundMul(round);
}

function appleSpd(round, swarm) {
  return (swarm ? 132 : 96) * (1 + Math.max(0, round - 1) * 0.09);
}

function monkeyRespawn(swarm) {
  return swarm ? 2.15 : 4.4;
}

function maxApples(swarm) {
  return swarm ? 14 : 7;
}

function rainInterval(round, swarm) {
  if (!swarm) return 999;
  var t = 1.65 / (1 + Math.max(0, round - 1) * 0.12);
  return t < 0.68 ? 0.68 : t;
}

function stageOf(round) {
  return STAGES[((round | 0) - 1 + STAGES.length * 8) % STAGES.length];
}

function onPlatX(plat, x, pad) {
  pad = pad == null ? 0 : pad;
  return x >= plat.x - pad && x <= plat.x + plat.w + pad;
}

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleHitsBox(cx, cy, r, box) {
  var x = clamp(cx, box.x, box.x + box.w);
  var y = clamp(cy, box.y, box.y + box.h);
  var dx = cx - x;
  var dy = cy - y;
  return dx * dx + dy * dy < r * r;
}

function playerBox(p) {
  var duck = p.duck && p.grounded && p.state !== 'climb';
  var h = duck ? DUCK_H : PH;
  return { x: p.x - PW * 0.38, y: p.y - h + 2, w: PW * 0.76, h: h - 4 };
}

function punchBox(p) {
  var range = punchRange(p.glove > 0);
  var duck = p.duck && p.grounded && p.state !== 'climb';
  var h = duck ? 13 : 18;
  var y = p.y - (duck ? 15 : 22);
  if (p.face >= 0) return { x: p.x + 2, y: y, w: range, h: h };
  return { x: p.x - 2 - range, y: y, w: range, h: h };
}

function punching(p) {
  if (!p || p.punch <= 0) return false;
  var age = PUNCH_T - p.punch;
  return age >= PUNCH_HIT0 && age <= PUNCH_HIT1;
}

function monkeyBox(m) {
  return { x: m.x - 8.2, y: m.y - 20, w: 16.4, h: 18 };
}

function appleHitsPlayer(a, p) {
  return circleHitsBox(a.x, a.y, a.r, playerBox(p));
}

function inCage(p, cage, plats) {
  var plat;
  if (!p || !cage || !plats) return false;
  plat = plats[cage.plat];
  if (!plat) return false;
  if (p.state === 'climb') return false;
  if (!p.grounded) return false;
  if (Math.abs(p.y - plat.y) > 6) return false;
  return Math.abs(p.x - cage.x) < 22 && onPlatX(plat, p.x, 4);
}

function findVine(vines, x, y, dir) {
  var i, v, top, bot;
  if (!vines) return null;
  for (i = 0; i < vines.length; i++) {
    v = vines[i];
    if (Math.abs(x - v.x) > 9) continue;
    top = Math.min(v.y0, v.y1);
    bot = Math.max(v.y0, v.y1);
    if (dir > 0) {
      if (y > top + 4 && y <= bot + 10) return v;
    } else if (dir < 0) {
      if (y < bot - 4 && y >= top - 10) return v;
    } else if (y >= top - 8 && y <= bot + 8) {
      return v;
    }
  }
  return null;
}

function platIndexAt(plats, x, y, slop) {
  var i, p;
  slop = slop == null ? 7 : slop;
  for (i = 0; i < plats.length; i++) {
    p = plats[i];
    if (!onPlatX(p, x, 2)) continue;
    if (Math.abs(p.y - y) <= slop) return i;
  }
  return -1;
}

function makePlayer(spawn, plats) {
  var plat = plats[spawn.plat];
  return {
    x: spawn.x,
    y: plat ? plat.y : 516,
    vx: 0,
    vy: 0,
    face: 1,
    state: 'walk',
    grounded: true,
    duck: false,
    walk: 0,
    coyote: 0,
    squash: 1,
    stretch: 1,
    glove: 0,
    inv: 0,
    deadT: 0,
    punch: 0,
    swing: 0,
    climbV: null,
    why: ''
  };
}

function makeMonkey(spec, plats, spd) {
  var plat = plats[spec.plat];
  return {
    x: spec.x,
    y: plat ? plat.y : 516,
    plat: spec.plat,
    home: spec.plat,
    homeX: spec.x,
    face: spec.x > 200 ? -1 : 1,
    spd: spd,
    walk: rand(0, 4),
    throwCd: rand(0.4, 1.2),
    wind: 0,
    state: 'walk',
    vx: 0,
    vy: 0,
    hitBy: -1,
    dead: false,
    respawn: 0,
    squash: 1
  };
}

function makeApple(x, y, vx, vy) {
  return {
    x: x,
    y: y,
    vx: vx,
    vy: vy,
    r: APPLE_R,
    spin: rand(0, TAU),
    bounce: 1,
    hitBy: -1,
    dead: false,
    life: 6
  };
}

function makeFruit(spec, plats) {
  var plat = plats[spec.plat];
  return {
    x: spec.x,
    y: (plat ? plat.y : 516) - 14,
    kind: spec.kind | 0,
    taken: false,
    bob: rand(0, TAU)
  };
}

function makeGlove(spec, plats) {
  if (!spec) return null;
  var plat = plats[spec.plat];
  return {
    x: spec.x,
    y: (plat ? plat.y : 516) - 16,
    taken: false,
    bob: 0
  };
}

function fruitScore(kind) {
  return FRUIT_SCORE[kind | 0] || 100;
}

function selfCheck() {
  var h, p, a, m, b, tpl, i, j, s, v, cagePlat, spawnPlat, pb, gb, box;

  if (STAGES.length !== 3) throw new Error('3 stages');
  if (LIVES !== 3) throw new Error('3 lives');
  if (punchRange(true) <= punchRange(false)) throw new Error('glove longer');
  if (GLOVE_RANGE - PUNCH_RANGE < 10) throw new Error('glove reach');
  if (appleInterval(1, true) >= appleInterval(1, false)) throw new Error('swarm faster throws');
  if (appleInterval(2, false) >= appleInterval(1, false)) throw new Error('round speeds throws');
  if (monkeySpd(2, false) <= monkeySpd(1, false)) throw new Error('round speeds monkeys');
  if (appleSpd(1, true) <= appleSpd(1, false)) throw new Error('swarm apples faster');
  if (maxApples(true) <= maxApples(false)) throw new Error('swarm more apples');
  if (rainInterval(1, false) < 100) throw new Error('rescue no rain');
  if (rainInterval(1, true) > 3) throw new Error('swarm rains apples');
  if (comboMul(0) !== 1 || comboMul(3) !== 3 || comboMul(99) !== 8) throw new Error('combo mul');
  if (fruitScore(0) !== 100 || fruitScore(3) !== 500) throw new Error('fruit scores');
  if (FRUIT_NAME.length !== 4) throw new Error('4 fruit');

  h = jumpHeight();
  if (h < 70 || h > 110) throw new Error('jump height window');
  if (h < 92) throw new Error('jump clears first ledge');

  p = { x: 100, y: 200, duck: false, grounded: true, state: 'walk', glove: 0, face: 1, punch: 0 };
  box = playerBox(p);
  if (box.h < 18) throw new Error('stand hurtbox');
  p.duck = true;
  box = playerBox(p);
  if (box.h >= 16) throw new Error('duck hurtbox shorter');
  if (playerBox(p).y > 200 - 8) throw new Error('duck lowers top');

  p.duck = false;
  p.glove = 0;
  p.face = 1;
  pb = punchBox(p);
  p.glove = 1;
  gb = punchBox(p);
  if (gb.w <= pb.w) throw new Error('glove punch box');
  p.face = -1;
  gb = punchBox(p);
  if (gb.x >= p.x) throw new Error('left punch');

  p.punch = PUNCH_T - 0.08;
  if (!punching(p)) throw new Error('active punch');
  p.punch = PUNCH_T - 0.01;
  if (punching(p)) throw new Error('startup not active');
  p.punch = 0.01;
  if (punching(p)) throw new Error('recovery not active');

  a = makeApple(100, 188, 0, 0);
  p.duck = false;
  p.grounded = true;
  p.state = 'walk';
  p.x = 100;
  p.y = 200;
  p.glove = 0;
  p.face = 1;
  p.punch = 0;
  if (!appleHitsPlayer(a, p)) throw new Error('apple hits stand');
  p.duck = true;
  a.y = 178;
  if (appleHitsPlayer(a, p)) throw new Error('duck under high apple');
  a.y = 194;
  if (!appleHitsPlayer(a, p)) throw new Error('low apple still hits duck');

  m = { x: 130, y: 200 };
  p.duck = false;
  p.x = 100;
  p.y = 200;
  p.face = 1;
  p.glove = 0;
  if (!aabb(punchBox(p), monkeyBox(m))) throw new Error('punch reaches monkey');
  m.x = 144;
  if (aabb(punchBox(p), monkeyBox(m))) throw new Error('too far no punch');
  p.glove = 1;
  if (!aabb(punchBox(p), monkeyBox(m))) throw new Error('glove reaches farther');

  for (i = 0; i < STAGES.length; i++) {
    tpl = STAGES[i];
    if (!tpl.plats || tpl.plats.length < 5) throw new Error('stage plats');
    if (!tpl.vines || tpl.vines.length < 3) throw new Error('stage vines');
    if (!tpl.monkeys || tpl.monkeys.length < 3) throw new Error('stage monkeys');
    if (!tpl.fruit || tpl.fruit.length < 2) throw new Error('stage fruit');
    if (!tpl.glove || !tpl.cage || !tpl.spawn) throw new Error('stage props');
    spawnPlat = tpl.plats[tpl.spawn.plat];
    cagePlat = tpl.plats[tpl.cage.plat];
    if (!spawnPlat || !cagePlat) throw new Error('spawn/cage plat');
    if (cagePlat.y >= spawnPlat.y - 40) throw new Error('cage above spawn');
    if (!onPlatX(spawnPlat, tpl.spawn.x, 0)) throw new Error('spawn on plat');
    if (!onPlatX(cagePlat, tpl.cage.x, 0)) throw new Error('cage on plat');
    if (tpl.glove.plat === tpl.cage.plat) throw new Error('glove not on cage');
    p = makePlayer(tpl.spawn, tpl.plats);
    if (!inCage(p, tpl.cage, tpl.plats) === false && Math.abs(p.x - tpl.cage.x) > 8) {
      /* spawn is not cage */
    }
    if (inCage(p, tpl.cage, tpl.plats)) throw new Error('spawn not cage');
    p.x = tpl.cage.x;
    p.y = cagePlat.y;
    p.grounded = true;
    p.state = 'walk';
    if (!inCage(p, tpl.cage, tpl.plats)) throw new Error('stand in cage');
    p.grounded = false;
    if (inCage(p, tpl.cage, tpl.plats)) throw new Error('air not cage');
    for (j = 0; j < tpl.vines.length; j++) {
      v = tpl.vines[j];
      if (Math.abs(v.y1 - v.y0) < 40) throw new Error('vine short');
      if (findVine(tpl.vines, v.x, (v.y0 + v.y1) / 2, 0) == null) throw new Error('find vine');
    }
    if (findVine(tpl.vines, tpl.vines[0].x, (tpl.vines[0].y0 + tpl.vines[0].y1) / 2, 1) == null) {
      throw new Error('climb up vine');
    }
    s = tpl.plats[0];
    if (s.w < 300) throw new Error('ground wide');
    for (j = 0; j < tpl.monkeys.length; j++) {
      if (tpl.monkeys[j].plat === tpl.cage.plat) throw new Error('no monkey on cage');
      if (!onPlatX(tpl.plats[tpl.monkeys[j].plat], tpl.monkeys[j].x, 2)) throw new Error('monkey on plat');
    }
    if (tpl.extra.length < 1) throw new Error('swarm extras');
  }

  if (stageOf(1) !== STAGES[0] || stageOf(4) !== STAGES[0]) throw new Error('stage wrap');
  if (stageOf(2) !== STAGES[1]) throw new Error('stage 2');
  if (monkeyRespawn(true) >= monkeyRespawn(false)) throw new Error('swarm respawn');

  p = makePlayer(STAGES[0].spawn, STAGES[0].plats);
  if (p.grounded !== true || p.state !== 'walk') throw new Error('player spawn');
  if (platIndexAt(STAGES[0].plats, p.x, p.y, 4) !== STAGES[0].spawn.plat) throw new Error('spawn plat index');

  a = makeApple(40, 40, 10, -20);
  if (a.r !== APPLE_R || a.bounce !== 1) throw new Error('apple factory');

  b = playerBox({ x: 50, y: 100, duck: false, grounded: true, state: 'walk' });
  if (!circleHitsBox(50, 90, 6, b)) throw new Error('circle hit');
  if (circleHitsBox(90, 90, 6, b)) throw new Error('circle miss');
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
var btnRescue = document.getElementById('btn-rescue');
var btnSwarm = document.getElementById('btn-swarm');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnLeft = document.getElementById('btn-left');
var btnRight = document.getElementById('btn-right');
var btnJump = document.getElementById('btn-jump');
var btnDown = document.getElementById('btn-down');
var btnPunch = document.getElementById('btn-punch');
var scoreEl = document.getElementById('score');
var roundEl = document.getElementById('round');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var gloveBar = document.getElementById('glove-bar');
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
var juice = [];
var fireflies = [];

var keys = { l: false, r: false, u: false, d: false, z: false };

var G = {
  mode: 'title',
  kind: 'rescue',
  swarm: false,
  clock: 0,
  round: 1,
  lives: LIVES,
  score: 0,
  bestJ: 0,
  bestQ: 0,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  player: null,
  plats: [],
  vines: [],
  monkeys: [],
  apples: [],
  fruit: [],
  glove: null,
  cage: null,
  spawn: null,
  tpl: STAGES[0],
  rainCd: 1.4,
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flash: 0,
  flashRgb: HOT,
  clearT: 0,
  lock: 0,
  jumpBuf: 0,
  punchBuf: 0,
  babyFree: false,
  why: '',
  stageName: STAGES[0].name
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
    this.beep(290, 0.06, 'square', 0.05, 540);
    this.noise(0.04, 0.04, 1600, 'highpass');
  },
  land: function () {
    this.ensure();
    this.noise(0.05, 0.05, 360, 'bandpass');
    this.beep(150, 0.04, 'sine', 0.03, 70);
  },
  whoosh: function () {
    this.ensure();
    this.noise(0.05, 0.045, 1400, 'highpass');
    this.beep(220, 0.05, 'sawtooth', 0.03, 90);
  },
  punch: function (combo) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.06;
    this.noise(0.09, 0.12, 220, 'lowpass');
    this.beep(180 * p, 0.08, 'square', 0.08, 70);
    this.beep(520 * p, 0.07, 'sawtooth', 0.035, 180);
    this.beep(880 * p, 0.05, 'triangle', 0.03, 420);
  },
  splat: function (combo) {
    this.ensure();
    var p = 1 + Math.min(6, combo) * 0.05;
    this.noise(0.1, 0.11, 520, 'bandpass');
    this.beep(240 * p, 0.07, 'square', 0.045, 90);
    this.beep(720 * p, 0.06, 'triangle', 0.03, 180);
  },
  die: function () {
    this.ensure();
    this.noise(0.16, 0.12, 260, 'lowpass');
    this.beep(320, 0.22, 'sawtooth', 0.06, 70);
    this.beep(170, 0.18, 'square', 0.04, 50);
  },
  climb: function () {
    this.ensure();
    this.beep(250, 0.03, 'square', 0.016, 300);
  },
  pickup: function () {
    this.ensure();
    this.beep(540, 0.08, 'triangle', 0.06, 880);
    this.beep(780, 0.12, 'square', 0.04, 1180);
  },
  glove: function () {
    this.ensure();
    this.beep(360, 0.08, 'square', 0.05, 520);
    this.beep(620, 0.1, 'triangle', 0.045, 980);
    this.beep(980, 0.12, 'square', 0.03, 1400);
  },
  throw: function () {
    this.ensure();
    this.noise(0.07, 0.05, 240, 'lowpass');
    this.beep(160, 0.07, 'sine', 0.03, 80);
  },
  rescue: function () {
    this.ensure();
    this.beep(392, 0.1, 'square', 0.065, 523);
    this.beep(523, 0.12, 'square', 0.055, 659);
    this.beep(659, 0.14, 'triangle', 0.05, 784);
    this.beep(784, 0.22, 'triangle', 0.045, 1046);
  },
  over: function () {
    this.ensure();
    this.beep(196, 0.18, 'sawtooth', 0.05, 98);
    this.beep(130, 0.28, 'square', 0.04, 60);
  },
  combo: function (n) {
    this.ensure();
    this.beep(440 + n * 40, 0.08, 'square', 0.05, 880 + n * 50);
  },
  start: function () {
    this.ensure();
    this.beep(330, 0.08, 'square', 0.04, 440);
    this.beep(440, 0.1, 'triangle', 0.04, 660);
  },
  ui: function () {
    this.ensure();
    this.beep(640, 0.05, 'square', 0.035, 420);
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
      G.bestJ = (o.j | 0) || (o.c | 0);
      G.bestQ = (o.q | 0) || (o.r | 0);
      return;
    }
    if (typeof o === 'number') {
      G.bestJ = o | 0;
      G.bestQ = o | 0;
    }
  } catch (e) { /* ignore */ }
}

function persistBest() {
  var cur = G.swarm ? G.bestQ : G.bestJ;
  if (G.score > cur) {
    if (G.swarm) G.bestQ = G.score;
    else G.bestJ = G.score;
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ j: G.bestJ, q: G.bestQ }));
  } catch (e) { /* ignore */ }
}

function currentBest() {
  return G.swarm ? G.bestQ : G.bestJ;
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
  G.kickY = -n * 0.4;
  stageEl.classList.remove('hop', 'smash', 'clear', 'die');
  void stageEl.offsetWidth;
  stageEl.classList.add(cls || 'hop');
  clearTimeout(kickTok);
  kickTok = setTimeout(function () {
    stageEl.classList.remove('hop', 'smash', 'clear', 'die');
  }, 220);
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
      vy: rand(-1.15, 0.25) * spd,
      t: life * rand(0.55, 1.2),
      max: life,
      r: rand(1.1, 2.6),
      rgb: rgb,
      g: grav || 22
    });
  }
}

function spark(x, y, rgb, n) {
  var i;
  for (i = 0; i < n; i++) {
    sparks.push({
      x: x, y: y,
      vx: rand(-1, 1) * 52,
      vy: rand(-80, -16),
      t: rand(0.12, 0.3),
      rgb: rgb
    });
  }
}

function ringAt(x, y, rgb) {
  rings.push({ x: x, y: y, t: 0, rgb: rgb, r: 4 });
}

function floatText(x, y, text, rgb) {
  floats.push({ x: x, y: y, text: text, t: 0, rgb: rgb });
}

function splatJuice(x, y) {
  var i, a;
  for (i = 0; i < 11; i++) {
    a = (i / 11) * TAU + rand(-0.2, 0.2);
    juice.push({
      x: x, y: y,
      vx: Math.cos(a) * rand(36, 120),
      vy: Math.sin(a) * rand(20, 90) - 50,
      t: rand(0.22, 0.46),
      rgb: i % 3 === 0 ? LEAF : (i % 2 ? RED : HOT2),
      r: rand(1.4, 3.1)
    });
  }
}

function toast(msg, warn, gold) {
  toastEl.textContent = msg;
  toastEl.classList.toggle('warn', !!warn);
  toastEl.classList.toggle('gold', !!gold);
  toastEl.classList.remove('hidden');
  clearTimeout(toastTok);
  toastTok = setTimeout(function () { toastEl.classList.add('hidden'); }, 900);
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
  if (x != null) floatText(x, y - 18, label || ('+' + n), GOLD);
}

function bumpCombo() {
  G.combo += 1;
  G.comboAge = 0;
  if (G.combo > G.maxCombo) G.maxCombo = G.combo;
  comboEl.textContent = '×' + Math.max(1, G.combo);
  if (G.combo >= 2) {
    comboBox.classList.remove('hot');
    void comboBox.offsetWidth;
    comboBox.classList.add('hot');
  }
  if (G.combo === 3 || G.combo === 6 || G.combo === 10) {
    audio.combo(G.combo);
    toast(G.combo >= 10 ? '连击 ×' + G.combo : '连击', false, true);
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

function hudPlay() {
  scoreEl.textContent = String(G.score);
  roundEl.textContent = String(G.round);
  bestEl.textContent = String(currentBest());
  comboEl.textContent = '×' + Math.max(1, G.combo);
  renderPips();
  modeLabel.textContent = G.swarm ? '群猴' : '救子';
  modeLabel.classList.toggle('swarm', G.swarm);
  if (G.mode === 'play') {
    hintEl.textContent = G.swarm
      ? '群猴乱掷 · Z 砸飞苹果 · 爬到顶上救人 · R 重开'
      : '拳打猴子 · 砸飞苹果 · 爬到顶上救人 · R 重开';
  }
  syncGlove();
}

function syncGlove() {
  var p = G.player && G.player.glove > 0 ? clamp(G.player.glove / GLOVE_T, 0, 1) : 0;
  gloveBar.style.transform = 'scaleX(' + p + ')';
  gloveBar.classList.toggle('on', p > 0.001);
}

function resetFx() {
  particles.length = 0;
  sparks.length = 0;
  floats.length = 0;
  rings.length = 0;
  juice.length = 0;
  G.stop = 0;
  G.shake = 0;
  G.kickX = 0;
  G.kickY = 0;
  G.flash = 0;
}

function seedFireflies() {
  var i;
  fireflies.length = 0;
  for (i = 0; i < 18; i++) {
    fireflies.push({
      x: rand(16, WORLD_W - 16),
      y: rand(30, WORLD_H - 40),
      p: rand(0, TAU),
      s: rand(0.6, 1.4)
    });
  }
}

function buildLevel(round, swarm) {
  var tpl = stageOf(round);
  var plats = tpl.plats;
  var spd = monkeySpd(round, swarm);
  var list = [];
  var i, spec;
  for (i = 0; i < tpl.monkeys.length; i++) {
    list.push(makeMonkey(tpl.monkeys[i], plats, spd));
  }
  if (swarm) {
    for (i = 0; i < tpl.extra.length; i++) {
      spec = tpl.extra[i];
      list.push(makeMonkey(spec, plats, spd * 0.92));
    }
  }
  G.tpl = tpl;
  G.plats = plats;
  G.vines = tpl.vines;
  G.monkeys = list;
  G.apples = [];
  G.fruit = tpl.fruit.map(function (f) { return makeFruit(f, plats); });
  G.glove = makeGlove(tpl.glove, plats);
  G.cage = tpl.cage;
  G.spawn = tpl.spawn;
  G.stageName = tpl.name;
  G.player = makePlayer(tpl.spawn, plats);
  G.rainCd = swarm ? 0.8 : 999;
  G.babyFree = false;
  G.clearT = 0;
}

function hideOverlay() {
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
}

function showTitle() {
  G.mode = 'title';
  G.kind = 'rescue';
  G.swarm = false;
  G.round = 1;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel';
  ovTitle.textContent = '袋鼠';
  ovLead.textContent = '拳打猴子，躲开苹果，爬到顶上笼子救出小袋鼠。碰到猴子或苹果丢命。';
  ovOps.textContent = '方向键或 WASD 走跳 · Z 出拳 · 触屏左 下 跳 右 拳 · R 重开 · M 静音';
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
  hintEl.textContent = '拳打猴子 · 砸飞苹果 · 爬到顶上救人 · R 重开';
  resetFx();
  buildLevel(1, false);
  hudPlay();
}

function showOver() {
  G.mode = 'over';
  persistBest();
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel lose';
  ovTitle.textContent = '命尽';
  ovLead.textContent = '第 ' + G.round + ' 关 · ' + G.score + ' 分 · 连击最高 ×' + G.maxCombo +
    (G.why ? ' · ' + whyText(G.why) : '');
  ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
  audio.over();
  ovRetry.focus();
}

function whyText(w) {
  if (w === 'monkey') return '撞上猴子';
  if (w === 'apple') return '中了苹果';
  if (w === 'fall') return '摔下去了';
  return '';
}

function startRun(kind) {
  G.kind = kind === 'swarm' ? 'swarm' : 'rescue';
  G.swarm = G.kind === 'swarm';
  G.mode = 'play';
  G.round = 1;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  G.maxCombo = 0;
  G.comboAge = 0;
  G.lock = 0.15;
  G.why = '';
  G.jumpBuf = 0;
  G.punchBuf = 0;
  resetFx();
  buildLevel(1, G.swarm);
  hideOverlay();
  audio.start();
  toast(G.swarm ? '群猴' : '救子 · ' + G.stageName, false, !G.swarm);
  hudPlay();
  try { canvas.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
}

function retry() {
  if (G.mode === 'title') {
    startRun('rescue');
    return;
  }
  startRun(G.kind);
}

function nextRound() {
  G.round += 1;
  G.lock = 0.22;
  G.combo = 0;
  G.comboAge = 0;
  resetFx();
  buildLevel(G.round, G.swarm);
  G.player.inv = 0.35;
  toast('第 ' + G.round + ' 关 · ' + G.stageName, false, true);
  hudPlay();
  audio.start();
}

function die(why) {
  var p = G.player;
  if (p.deadT > 0 || p.inv > 0 || G.clearT > 0) return;
  p.deadT = DIE_T;
  p.why = why;
  G.why = why;
  p.vx *= 0.3;
  p.vy = -90;
  p.state = 'dead';
  p.punch = 0;
  audio.die();
  hitStop(0.08);
  shake(8);
  kick(5, 'die');
  flash(MAG, 0.22);
  burst(p.x, p.y - 12, 16, MAG, 90, 0.42, 28);
  spark(p.x, p.y - 12, WHT, 8);
}

function respawn() {
  var p;
  G.lives -= 1;
  renderPips();
  if (G.lives <= 0) {
    showOver();
    return;
  }
  G.player = makePlayer(G.spawn, G.plats);
  p = G.player;
  p.inv = INVULN;
  G.jumpBuf = 0;
  G.punchBuf = 0;
  toast('还有 ' + G.lives + ' 命', true, false);
  hudPlay();
}

function rescue() {
  var p = G.player;
  var n, mul;
  if (G.clearT > 0 || G.babyFree) return;
  G.babyFree = true;
  mul = 1 + Math.max(0, G.round - 1) * 0.1;
  n = Math.round((CLEAR_SCORE + CLEAR_ROUND * G.round) * mul);
  addScore(n, p.x, p.y - 10, '救出 +' + n);
  audio.rescue();
  hitStop(0.08);
  kick(6, 'clear');
  flash(GOLD, 0.2);
  burst(G.plats[G.cage.plat].x + G.plats[G.cage.plat].w * 0.5, G.plats[G.cage.plat].y - 24, 22, GOLD, 110, 0.55, 18);
  burst(p.x, p.y - 16, 12, CYN, 80, 0.4, 16);
  ringAt(p.x, p.y - 18, GOLD);
  toast('救出！', false, true);
  G.clearT = 1.15;
}

/* ---- sim ---- */
function tickFx(dt) {
  var i, o;
  G.kickX *= 0.82;
  G.kickY *= 0.82;
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
  if (G.flash > 0) G.flash = Math.max(0, G.flash - dt);
  for (i = particles.length - 1; i >= 0; i--) {
    o = particles[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.vy += o.g * 12 * dt;
    if (o.t <= 0) particles.splice(i, 1);
  }
  for (i = sparks.length - 1; i >= 0; i--) {
    o = sparks[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.vy += 220 * dt;
    if (o.t <= 0) sparks.splice(i, 1);
  }
  for (i = floats.length - 1; i >= 0; i--) {
    o = floats[i];
    o.t += dt;
    o.y -= 28 * dt;
    if (o.t > 0.7) floats.splice(i, 1);
  }
  for (i = rings.length - 1; i >= 0; i--) {
    o = rings[i];
    o.t += dt;
    o.r += 70 * dt;
    if (o.t > 0.32) rings.splice(i, 1);
  }
  for (i = juice.length - 1; i >= 0; i--) {
    o = juice[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.vy += 420 * dt;
    if (o.t <= 0) juice.splice(i, 1);
  }
  capArr(particles, 90);
  capArr(sparks, 40);
  capArr(floats, 12);
  capArr(juice, 40);
}

function landDust(x, y) {
  burst(x, y, 6, HOT2, 36, 0.22, 8);
}

function tryLand(p, prevY) {
  var i, plat, feet;
  if (p.vy < 0) return false;
  for (i = 0; i < G.plats.length; i++) {
    plat = G.plats[i];
    if (!onPlatX(plat, p.x, 0)) continue;
    feet = p.y;
    if (prevY <= plat.y + 3 && feet >= plat.y && prevY <= plat.y + 18) {
      p.y = plat.y;
      p.vy = 0;
      p.vx *= 0.85;
      p.grounded = true;
      p.state = 'walk';
      p.climbV = null;
      p.coyote = COYOTE;
      p.squash = 0.72;
      p.stretch = 1.18;
      audio.land();
      landDust(p.x, p.y);
      return true;
    }
  }
  return false;
}

function doJump(p) {
  p.vy = -JUMP_V;
  p.grounded = false;
  p.state = 'jump';
  p.climbV = null;
  p.coyote = 0;
  p.duck = false;
  p.squash = 1.22;
  p.stretch = 0.78;
  G.jumpBuf = 0;
  audio.hop();
  hitStop(0.03);
  burst(p.x, p.y, 5, CYN, 28, 0.18, 6);
}

function tickPlayer(dt) {
  var p = G.player;
  var want, vine, prevY, moving, atTop, atBot, pi;
  var climbSfx = false;

  if (p.inv > 0) p.inv -= dt;
  if (p.glove > 0) {
    p.glove -= dt;
    if (p.glove < 0) p.glove = 0;
  }
  if (G.jumpBuf > 0) G.jumpBuf -= dt;
  if (G.punchBuf > 0) G.punchBuf -= dt;

  p.squash += (1 - p.squash) * Math.min(1, dt * 12);
  p.stretch += (1 - p.stretch) * Math.min(1, dt * 12);

  if (p.deadT > 0) {
    p.deadT -= dt;
    p.vy += GRAV * dt;
    p.y += p.vy * dt;
    p.x += p.vx * dt;
    if (p.deadT <= 0) respawn();
    return;
  }

  if (G.clearT > 0) return;

  p.duck = !!(keys.d && p.grounded && p.state !== 'climb');

  if (G.punchBuf > 0 && p.punch <= 0) {
    p.punch = PUNCH_T;
    p.swing += 1;
    G.punchBuf = 0;
    audio.whoosh();
    p.stretch = 1.16;
    p.squash = 0.9;
  }

  if (p.state === 'climb' && p.climbV) {
    vine = p.climbV;
    want = 0;
    if (keys.u) want -= 1;
    if (keys.d) want += 1;
    p.x = vine.x;
    p.vx = 0;
    p.vy = want * CLIMB;
    p.y += p.vy * dt;
    p.y = clamp(p.y, Math.min(vine.y0, vine.y1), Math.max(vine.y0, vine.y1));
    p.grounded = false;
    p.walk += Math.abs(want) * dt * 8;
    if (want) climbSfx = true;
    if (G.jumpBuf > 0 && (keys.l || keys.r)) {
      p.face = keys.l ? -1 : 1;
      p.vx = p.face * WALK * 0.7;
      doJump(p);
    } else {
      atTop = Math.abs(p.y - Math.min(vine.y0, vine.y1)) < 4 && !keys.d;
      atBot = Math.abs(p.y - Math.max(vine.y0, vine.y1)) < 5;
      pi = platIndexAt(G.plats, p.x, p.y, 8);
      if ((atTop || (atBot && (keys.l || keys.r))) && pi >= 0) {
        p.y = G.plats[pi].y;
        p.state = 'walk';
        p.grounded = true;
        p.climbV = null;
        p.vy = 0;
        if (keys.l || keys.r) p.face = keys.l ? -1 : 1;
      }
    }
    if (climbSfx && ((G.clock * 9) | 0) !== (((G.clock - dt) * 9) | 0)) audio.climb();
  } else {
    want = 0;
    if (keys.l) want -= 1;
    if (keys.r) want += 1;
    if (want) p.face = want;
    moving = want * WALK;
    if (p.duck) moving *= 0.35;
    if (p.punch > 0) moving *= 0.45;
    p.vx = moving;
    p.x += p.vx * dt;
    p.x = clamp(p.x, 10, WORLD_W - 10);
    p.walk += Math.abs(want) * dt * 7;

    if (p.grounded) {
      p.coyote = COYOTE;
      p.vy = 0;
      if (want) p.state = 'walk';
      else p.state = p.duck ? 'duck' : 'idle';
      if (!onPlatX(G.plats[platIndexAt(G.plats, p.x, p.y, 8)] || { x: 0, w: 0 }, p.x, 0)) {
        p.grounded = false;
        p.state = 'fall';
      }
    } else {
      p.coyote -= dt;
      p.vy += GRAV * dt;
      if (p.vy > MAX_FALL) p.vy = MAX_FALL;
      prevY = p.y;
      p.y += p.vy * dt;
      p.state = p.vy < 0 ? 'jump' : 'fall';
      tryLand(p, prevY);
    }

    if ((p.grounded || p.coyote > 0) && G.jumpBuf > 0 && !p.duck) {
      doJump(p);
    }

    if ((keys.u || keys.d) && p.punch <= 0) {
      vine = findVine(G.vines, p.x, p.y, keys.u ? 1 : (keys.d ? -1 : 0));
      if (vine && (keys.u || !p.grounded || keys.d)) {
        if (!(p.grounded && keys.d && Math.abs(p.y - Math.max(vine.y0, vine.y1)) < 4)) {
          p.state = 'climb';
          p.climbV = vine;
          p.x = vine.x;
          p.vx = 0;
          p.grounded = false;
          p.duck = false;
        }
      }
    }
  }

  if (p.y > WORLD_H + 22) {
    die('fall');
    return;
  }

  collectPickups(p);
  resolvePunch(p);
  if (p.inv <= 0 && p.deadT <= 0 && G.clearT <= 0) {
    hurtCheck(p);
  }
  if (p.punch > 0) p.punch -= dt;

  if (inCage(p, G.cage, G.plats)) rescue();
}

function collectPickups(p) {
  var i, f, g, n;
  for (i = 0; i < G.fruit.length; i++) {
    f = G.fruit[i];
    if (f.taken) continue;
    if (hypot(p.x - f.x, (p.y - 12) - f.y) < 16) {
      f.taken = true;
      n = fruitScore(f.kind);
      addScore(n, f.x, f.y, FRUIT_NAME[f.kind] + ' +' + n);
      audio.pickup();
      burst(f.x, f.y, 10, f.kind === 2 ? GOLD : (f.kind === 3 ? LEAF : RED), 70, 0.32, 14);
      ringAt(f.x, f.y, GOLD);
      hitStop(0.03);
    }
  }
  g = G.glove;
  if (g && !g.taken && hypot(p.x - g.x, (p.y - 12) - g.y) < 16) {
    g.taken = true;
    p.glove = GLOVE_T;
    addScore(GLOVE_SCORE, g.x, g.y, '拳套 +' + GLOVE_SCORE);
    audio.glove();
    burst(g.x, g.y, 14, GOLD, 90, 0.4, 12);
    spark(g.x, g.y, CYN, 10);
    ringAt(g.x, g.y, CYN);
    flash(GOLD, 0.12);
    hitStop(0.045);
    kick(3, 'smash');
    toast('重拳', false, true);
    syncGlove();
  }
}

function resolvePunch(p) {
  var box, i, m, a, n, hx, hy;
  if (!punching(p)) return;
  box = punchBox(p);
  for (i = 0; i < G.monkeys.length; i++) {
    m = G.monkeys[i];
    if (m.dead || m.state === 'fly') continue;
    if (m.hitBy === p.swing) continue;
    if (!aabb(box, monkeyBox(m))) continue;
    m.hitBy = p.swing;
    m.state = 'fly';
    m.dead = true;
    m.vx = p.face * (220 + (p.glove > 0 ? 80 : 0));
    m.vy = -210;
    m.squash = 0.55;
    bumpCombo();
    n = MONKEY_SCORE * comboMul(G.combo);
    addScore(n, m.x, m.y - 8, 'POW +' + n);
    audio.punch(G.combo);
    hitStop(p.glove > 0 ? 0.07 : 0.055);
    kick(4.5, 'smash');
    flash(HOT, 0.1);
    hx = m.x;
    hy = m.y - 10;
    burst(hx, hy, 14, MAG, 100, 0.36, 20);
    spark(hx, hy, GOLD, 8);
    ringAt(hx, hy, HOT);
    floatText(hx, hy - 8, 'POW', HOT2);
  }
  for (i = 0; i < G.apples.length; i++) {
    a = G.apples[i];
    if (a.dead || a.hitBy === p.swing) continue;
    if (!circleHitsBox(a.x, a.y, a.r + 2, box)) continue;
    a.hitBy = p.swing;
    splatApple(a, true);
  }
}

function splatApple(a, punched) {
  var n;
  if (a.dead) return;
  a.dead = true;
  splatJuice(a.x, a.y);
  ringAt(a.x, a.y, RED);
  burst(a.x, a.y, 8, RED, 70, 0.28, 24);
  burst(a.x, a.y, 4, LEAF, 50, 0.24, 16);
  if (punched) {
    bumpCombo();
    n = APPLE_SCORE * comboMul(G.combo);
    addScore(n, a.x, a.y, '+' + n);
    audio.splat(G.combo);
    hitStop(0.038);
    kick(2.4, 'hop');
  } else {
    audio.noise(0.06, 0.05, 400, 'bandpass');
  }
}

function hurtCheck(p) {
  var i, m, a, box;
  box = playerBox(p);
  for (i = 0; i < G.monkeys.length; i++) {
    m = G.monkeys[i];
    if (m.dead || m.state === 'fly') continue;
    if (aabb(box, monkeyBox(m))) {
      if (punching(p) && m.hitBy === p.swing) continue;
      die('monkey');
      return;
    }
  }
  for (i = 0; i < G.apples.length; i++) {
    a = G.apples[i];
    if (a.dead) continue;
    if (appleHitsPlayer(a, p)) {
      if (punching(p) && a.hitBy === p.swing) continue;
      splatApple(a, false);
      die('apple');
      return;
    }
  }
}

function tickMonkeys(dt, idle) {
  var i, m, plat, left, right, interval, p, dir, spdThrow, windup;
  interval = appleInterval(G.round, G.swarm);
  spdThrow = appleSpd(G.round, G.swarm);
  p = G.player;
  for (i = 0; i < G.monkeys.length; i++) {
    m = G.monkeys[i];
    m.walk += dt;
    m.squash += (1 - m.squash) * Math.min(1, dt * 10);
    if (m.state === 'fly') {
      m.vy += GRAV * dt;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.face = m.vx >= 0 ? 1 : -1;
      if (m.y > WORLD_H + 30 || m.x < -40 || m.x > WORLD_W + 40) {
        m.respawn = monkeyRespawn(G.swarm);
        m.state = 'gone';
      }
      continue;
    }
    if (m.state === 'gone') {
      m.respawn -= dt;
      if (m.respawn <= 0) {
        plat = G.plats[m.home];
        m.x = m.homeX;
        m.y = plat.y;
        m.plat = m.home;
        m.state = 'walk';
        m.dead = false;
        m.vx = 0;
        m.vy = 0;
        m.throwCd = 0.4;
        m.wind = 0;
        m.hitBy = -1;
        burst(m.x, m.y - 10, 6, MAG, 40, 0.2, 10);
      }
      continue;
    }
    plat = G.plats[m.plat];
    if (!plat) continue;
    left = plat.x + 12;
    right = plat.x + plat.w - 12;
    m.x += m.face * m.spd * dt;
    if (m.x < left) { m.x = left; m.face = 1; }
    if (m.x > right) { m.x = right; m.face = -1; }
    m.y = plat.y;
    if (m.wind > 0) {
      m.wind -= dt;
      if (m.wind <= 0 && !idle) {
        dir = p ? sign(p.x - m.x) : m.face;
        if (!dir) dir = m.face;
        m.face = dir;
        throwApple(m, dir, spdThrow);
        m.throwCd = interval * rand(0.82, 1.18);
      }
      continue;
    }
    m.throwCd -= dt;
    if (!idle && m.throwCd <= 0 && G.apples.length < maxApples(G.swarm)) {
      if (p && Math.abs(p.y - m.y) < 220) {
        windup = G.swarm ? 0.16 : 0.24;
        m.wind = windup;
        m.face = p.x >= m.x ? 1 : -1;
      } else {
        m.throwCd = 0.4;
      }
    }
  }
}

function throwApple(m, dir, spd) {
  var vx, vy;
  if (G.apples.length >= maxApples(G.swarm)) return;
  vx = dir * spd * rand(0.72, 1.05);
  vy = -120 - rand(0, 70);
  G.apples.push(makeApple(m.x + dir * 10, m.y - 16, vx, vy));
  audio.throw();
  burst(m.x + dir * 8, m.y - 16, 3, HOT2, 24, 0.14, 8);
}

function tickApples(dt) {
  var i, a, prevY, j, plat;
  for (i = G.apples.length - 1; i >= 0; i--) {
    a = G.apples[i];
    if (a.dead) {
      G.apples.splice(i, 1);
      continue;
    }
    a.life -= dt;
    a.spin += dt * 8;
    a.vy += GRAV * 0.72 * dt;
    if (a.vy > 360) a.vy = 360;
    prevY = a.y;
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    if (a.bounce > 0 && a.vy > 0) {
      for (j = 0; j < G.plats.length; j++) {
        plat = G.plats[j];
        if (!onPlatX(plat, a.x, -2)) continue;
        if (prevY <= plat.y - 2 && a.y >= plat.y - a.r && a.y <= plat.y + 10) {
          a.y = plat.y - a.r;
          a.vy *= -0.42;
          a.vx *= 0.82;
          a.bounce -= 1;
          break;
        }
      }
    }
    if (a.life <= 0 || a.y > WORLD_H + 24 || a.x < -24 || a.x > WORLD_W + 24) {
      if (a.y > WORLD_H - 4) splatApple(a, false);
      G.apples.splice(i, 1);
    }
  }
}

function tickRain(dt) {
  var x, vx;
  if (!G.swarm) return;
  G.rainCd -= dt;
  if (G.rainCd > 0) return;
  if (G.apples.length >= maxApples(true)) {
    G.rainCd = 0.2;
    return;
  }
  x = rand(24, WORLD_W - 24);
  vx = rand(-40, 40);
  G.apples.push(makeApple(x, 18, vx, 50));
  G.rainCd = rainInterval(G.round, true) * rand(0.7, 1.2);
}

function tick(dt) {
  if (G.combo > 0) {
    G.comboAge += dt;
    if (G.comboAge > COMBO_WIN) {
      G.combo = 0;
      G.comboAge = 0;
      comboEl.textContent = '×1';
    }
  }
  if (G.mode === 'title') {
    G.clock += dt;
    tickMonkeys(dt, true);
    tickFx(dt);
    if (G.player) {
      G.player.walk += dt * 2;
      G.player.squash += (1 - G.player.squash) * dt * 8;
    }
    return;
  }
  if (G.mode !== 'play') {
    G.clock += dt;
    tickFx(dt);
    return;
  }
  if (G.lock > 0) {
    G.lock -= dt;
    G.clock += dt;
    tickFx(dt);
    return;
  }
  G.clock += dt;
  if (G.clearT > 0) {
    G.clearT -= dt;
    tickFx(dt);
    if (G.player) {
      G.player.walk += dt * 3;
      G.player.squash += (1 - G.player.squash) * dt * 8;
    }
    if (G.clearT <= 0) nextRound();
    return;
  }
  tickPlayer(dt);
  tickMonkeys(dt, false);
  tickApples(dt);
  tickRain(dt);
  tickFx(dt);
  syncGlove();
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

function drawBg() {
  var g, i, f, x, y, tw;
  ctx.fillStyle = '#07030c';
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(70), sy(70), 8, sx(70), sy(70), 200 * L.s);
  g.addColorStop(0, 'rgba(255,136,31,0.16)');
  g.addColorStop(1, 'rgba(255,136,31,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(320), sy(40), 8, sx(320), sy(40), 160 * L.s);
  g.addColorStop(0, 'rgba(255,61,184,0.12)');
  g.addColorStop(1, 'rgba(255,61,184,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.fillStyle = 'rgba(20, 8, 28, 0.9)';
  roundRect(sx(-20), sy(470), 80 * L.s, 90 * L.s, 18 * L.s);
  roundRect(sx(150), sy(455), 70 * L.s, 110 * L.s, 20 * L.s);
  roundRect(sx(310), sy(465), 90 * L.s, 100 * L.s, 22 * L.s);

  drawTrunk(64, 516, 22);
  drawTrunk(200, 516, 28);
  drawTrunk(338, 516, 20);

  ctx.fillStyle = 'rgba(61,255,136,0.07)';
  ctx.beginPath();
  ctx.ellipse(sx(70), sy(90), 70 * L.s, 36 * L.s, 0, 0, TAU);
  ctx.ellipse(sx(210), sy(48), 90 * L.s, 40 * L.s, 0, 0, TAU);
  ctx.ellipse(sx(340), sy(100), 64 * L.s, 30 * L.s, 0, 0, TAU);
  ctx.fill();

  for (i = 0; i < fireflies.length; i++) {
    f = fireflies[i];
    tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(G.clock * 2.4 * f.s + f.p));
    x = sx(f.x + Math.sin(G.clock * 0.7 + f.p) * 8);
    y = sy(f.y + Math.cos(G.clock * 0.9 + f.p) * 6);
    ctx.fillStyle = rgba(i % 2 ? GOLD : CYN, 0.18 + tw * 0.45);
    ctx.beginPath();
    ctx.arc(x, y, (1.1 + tw) * L.s, 0, TAU);
    ctx.fill();
  }
}

function drawTrunk(x, bot, w) {
  var X = sx(x);
  var Y = sy(bot);
  var H = 220 * L.s;
  var W = w * L.s;
  var g = ctx.createLinearGradient(X - W, Y, X + W, Y);
  g.addColorStop(0, 'rgba(42, 18, 12, 0.55)');
  g.addColorStop(0.5, 'rgba(90, 40, 18, 0.35)');
  g.addColorStop(1, 'rgba(28, 10, 8, 0.55)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(X - W * 0.5, Y);
  ctx.lineTo(X - W * 0.35, Y - H);
  ctx.lineTo(X + W * 0.35, Y - H);
  ctx.lineTo(X + W * 0.5, Y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,136,31,0.12)';
  ctx.lineWidth = 1.2 * L.s;
  ctx.stroke();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

function drawVines() {
  var i, v, x, top, bot, rungs, r, yy, sway;
  ctx.lineCap = 'round';
  for (i = 0; i < G.vines.length; i++) {
    v = G.vines[i];
    sway = Math.sin(G.clock * 1.6 + i) * 1.4 * L.s;
    x = sx(v.x) + sway * 0.15;
    top = sy(Math.min(v.y0, v.y1));
    bot = sy(Math.max(v.y0, v.y1));
    ctx.strokeStyle = 'rgba(61, 255, 136, 0.28)';
    ctx.lineWidth = 5.2 * L.s;
    ctx.beginPath();
    ctx.moveTo(x - 4.2 * L.s, top);
    ctx.lineTo(x - 4.2 * L.s, bot);
    ctx.moveTo(x + 4.2 * L.s, top);
    ctx.lineTo(x + 4.2 * L.s, bot);
    ctx.stroke();
    ctx.strokeStyle = '#00f0ff';
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 1.6 * L.s;
    ctx.beginPath();
    ctx.moveTo(x - 4.2 * L.s, top);
    ctx.lineTo(x - 4.2 * L.s, bot);
    ctx.moveTo(x + 4.2 * L.s, top);
    ctx.lineTo(x + 4.2 * L.s, bot);
    ctx.stroke();
    ctx.globalAlpha = 1;
    rungs = Math.max(3, ((Math.abs(v.y1 - v.y0)) / 10) | 0);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.9)';
    ctx.lineWidth = 1.3 * L.s;
    for (r = 0; r <= rungs; r++) {
      yy = lerp(top, bot, r / rungs);
      ctx.beginPath();
      ctx.moveTo(x - 5 * L.s, yy);
      ctx.lineTo(x + 5 * L.s, yy);
      ctx.stroke();
    }
  }
}

function drawPlats() {
  var i, p, x, y, w, k, n;
  for (i = 0; i < G.plats.length; i++) {
    p = G.plats[i];
    x = sx(p.x);
    y = sy(p.y);
    w = p.w * L.s;
    ctx.fillStyle = 'rgba(28, 10, 8, 0.9)';
    ctx.fillRect(x, y, w, 10 * L.s);
    ctx.fillStyle = '#ff881f';
    ctx.fillRect(x, y, w, 4.2 * L.s);
    ctx.fillStyle = 'rgba(255, 227, 107, 0.7)';
    ctx.fillRect(x, y, w, 1.4 * L.s);
    ctx.fillStyle = 'rgba(255, 136, 31, 0.18)';
    ctx.fillRect(x - 2 * L.s, y - 2 * L.s, w + 4 * L.s, 3 * L.s);
    n = Math.max(3, (p.w / 18) | 0);
    for (k = 0; k <= n; k++) {
      ctx.fillStyle = k % 2 ? '#ffe36b' : '#ffb04a';
      ctx.beginPath();
      ctx.arc(x + (k / n) * w, y + 2.2 * L.s, 1.25 * L.s, 0, TAU);
      ctx.fill();
    }
  }
}

function drawCage() {
  var plat = G.plats[G.cage.plat];
  var x, y, bob, t, i;
  if (!plat) return;
  x = sx(G.cage.x);
  y = sy(plat.y);
  bob = Math.sin(G.clock * 2.4) * 1.6 * L.s;
  ctx.save();
  ctx.translate(x, y + bob);

  ctx.strokeStyle = 'rgba(255, 227, 107, 0.35)';
  ctx.lineWidth = 6 * L.s;
  ctx.strokeRect(-16 * L.s, -36 * L.s, 32 * L.s, 34 * L.s);
  ctx.strokeStyle = '#ffe36b';
  ctx.lineWidth = 1.6 * L.s;
  ctx.strokeRect(-16 * L.s, -36 * L.s, 32 * L.s, 34 * L.s);
  ctx.beginPath();
  for (i = 0; i < 4; i++) {
    ctx.moveTo((-12 + i * 8) * L.s, -36 * L.s);
    ctx.lineTo((-12 + i * 8) * L.s, -2 * L.s);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 227, 107, 0.12)';
  ctx.fillRect(-16 * L.s, -36 * L.s, 32 * L.s, 34 * L.s);

  t = G.babyFree ? Math.min(1, (1.15 - G.clearT) / 0.4) : 0;
  ctx.save();
  ctx.translate(t * 18 * L.s, -t * 10 * L.s);
  drawJoey(0, G.babyFree ? -18 * L.s : -14 * L.s, 0.72 + t * 0.1);
  ctx.restore();

  if (!G.babyFree) {
    ctx.fillStyle = rgba(GOLD, 0.12 + 0.08 * Math.sin(G.clock * 5));
    ctx.beginPath();
    ctx.arc(0, -18 * L.s, (18 + Math.sin(G.clock * 3) * 2) * L.s, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawJoey(x, y, sc) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc * L.s, sc * L.s);
  ctx.fillStyle = '#ffb04a';
  ctx.beginPath();
  ctx.ellipse(0, 4, 5.2, 6.2, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -3.2, 4.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffd080';
  ctx.beginPath();
  ctx.ellipse(0.6, -2.6, 2.6, 2.2, 0.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff881f';
  ctx.beginPath();
  ctx.ellipse(-2.4, -7.4, 1.5, 2.6, -0.3, 0, TAU);
  ctx.ellipse(2.2, -7.4, 1.5, 2.6, 0.3, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#00f0ff';
  ctx.beginPath();
  ctx.arc(1.2, -3.4, 0.7, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawFruit() {
  var i, f, x, y, bob, k;
  for (i = 0; i < G.fruit.length; i++) {
    f = G.fruit[i];
    if (f.taken) continue;
    bob = Math.sin(G.clock * 3.2 + f.bob) * 2.2;
    x = sx(f.x);
    y = sy(f.y + bob);
    k = f.kind;
    ctx.save();
    ctx.translate(x, y);
    if (k === 0) {
      ctx.fillStyle = '#ff3a3a';
      ctx.beginPath();
      ctx.arc(-2.4 * L.s, 1.2 * L.s, 4.2 * L.s, 0, TAU);
      ctx.arc(2.6 * L.s, 1.4 * L.s, 3.8 * L.s, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#3dff88';
      ctx.lineWidth = 1.4 * L.s;
      ctx.beginPath();
      ctx.moveTo(0, -1 * L.s);
      ctx.quadraticCurveTo(4 * L.s, -8 * L.s, 1 * L.s, -9 * L.s);
      ctx.stroke();
    } else if (k === 1) {
      ctx.fillStyle = '#ff3db8';
      ctx.beginPath();
      ctx.moveTo(0, 6 * L.s);
      ctx.bezierCurveTo(8 * L.s, 2 * L.s, 6 * L.s, -6 * L.s, 0, -5 * L.s);
      ctx.bezierCurveTo(-6 * L.s, -6 * L.s, -8 * L.s, 2 * L.s, 0, 6 * L.s);
      ctx.fill();
      ctx.fillStyle = '#ffe36b';
      ctx.fillRect(-0.7 * L.s, -7 * L.s, 1.4 * L.s, 3 * L.s);
    } else if (k === 2) {
      ctx.fillStyle = '#ffe36b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 7.2 * L.s, 3.2 * L.s, -0.5, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#ffb04a';
      ctx.lineWidth = 1.1 * L.s;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffe36b';
      ctx.beginPath();
      ctx.ellipse(0, 1 * L.s, 5 * L.s, 6.4 * L.s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#3dff88';
      ctx.beginPath();
      ctx.moveTo(0, -6 * L.s);
      ctx.lineTo(4 * L.s, -10 * L.s);
      ctx.lineTo(-4 * L.s, -10 * L.s);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,227,107,0.18)';
    ctx.beginPath();
    ctx.arc(0, 0, 10 * L.s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawGloveItem() {
  var g = G.glove, x, y, bob;
  if (!g || g.taken) return;
  bob = Math.sin(G.clock * 3.6) * 2.4;
  x = sx(g.x);
  y = sy(g.y + bob);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(G.clock * 2) * 0.12);
  ctx.fillStyle = 'rgba(0,240,255,0.18)';
  ctx.beginPath();
  ctx.arc(0, 0, (11 + Math.sin(G.clock * 6) * 1.6) * L.s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff3a3a';
  ctx.beginPath();
  ctx.ellipse(0, 1 * L.s, 7.2 * L.s, 6.2 * L.s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffe36b';
  ctx.fillRect(-5 * L.s, -1.2 * L.s, 10 * L.s, 2 * L.s);
  ctx.fillStyle = '#ffd0c0';
  ctx.fillRect(-3.2 * L.s, 5.2 * L.s, 6.4 * L.s, 3.2 * L.s);
  ctx.restore();
}

function drawApple(a) {
  var x, y;
  if (a.dead) return;
  x = sx(a.x);
  y = sy(a.y);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a.spin);
  ctx.fillStyle = '#ff2e36';
  ctx.beginPath();
  ctx.arc(0, 0.4 * L.s, a.r * L.s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,220,200,0.45)';
  ctx.beginPath();
  ctx.arc(-1.6 * L.s, -1.6 * L.s, a.r * 0.32 * L.s, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#3dff88';
  ctx.lineWidth = 1.3 * L.s;
  ctx.beginPath();
  ctx.moveTo(0, -a.r * 0.6 * L.s);
  ctx.quadraticCurveTo(4 * L.s, -a.r * 1.6 * L.s, 1.2 * L.s, -a.r * 1.7 * L.s);
  ctx.stroke();
  ctx.restore();
}

function drawMonkey(m) {
  var x, y, bob, arm, wind;
  if (m.state === 'gone') return;
  x = sx(m.x);
  y = sy(m.y);
  bob = m.state === 'fly' ? 0 : Math.sin(m.walk * 8) * 1.4 * L.s;
  wind = m.wind > 0 ? 1 : 0;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(m.face >= 0 ? 1 : -1, 1);
  ctx.scale(1, m.squash);

  ctx.fillStyle = '#5a2414';
  ctx.beginPath();
  ctx.ellipse(-6 * L.s, -6 * L.s, 3.2 * L.s, 2.2 * L.s, -0.4, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#c45a28';
  ctx.beginPath();
  ctx.ellipse(0, -10 * L.s, 7.2 * L.s, 9.2 * L.s, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#e8a070';
  ctx.beginPath();
  ctx.ellipse(1.4 * L.s, -9 * L.s, 4.4 * L.s, 5.2 * L.s, 0.15, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#a43a18';
  ctx.beginPath();
  ctx.arc(0.4 * L.s, -20 * L.s, 6.2 * L.s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f0b888';
  ctx.beginPath();
  ctx.ellipse(1.6 * L.s, -18.4 * L.s, 4.2 * L.s, 3.6 * L.s, 0.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#00f0ff';
  ctx.beginPath();
  ctx.arc(-0.6 * L.s, -20.4 * L.s, 1.15 * L.s, 0, TAU);
  ctx.arc(2.8 * L.s, -20.6 * L.s, 1.15 * L.s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(-0.4 * L.s, -20.4 * L.s, 0.45 * L.s, 0, TAU);
  ctx.arc(3 * L.s, -20.6 * L.s, 0.45 * L.s, 0, TAU);
  ctx.fill();

  arm = wind ? -1.15 : Math.sin(m.walk * 7) * 0.35;
  ctx.save();
  ctx.translate(6 * L.s, -14 * L.s);
  ctx.rotate(arm);
  ctx.fillStyle = '#c45a28';
  ctx.fillRect(0, -2 * L.s, 12 * L.s, 4 * L.s);
  ctx.beginPath();
  ctx.arc(12 * L.s, 0, 2.6 * L.s, 0, TAU);
  ctx.fill();
  if (wind) {
    ctx.fillStyle = '#ff2e36';
    ctx.beginPath();
    ctx.arc(14 * L.s, -2 * L.s, 3.4 * L.s, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = '#a43a18';
  ctx.fillRect(-6 * L.s, -4 * L.s, 4.2 * L.s, 8 * L.s);
  ctx.fillRect(1.4 * L.s, -3 * L.s, 4.2 * L.s, 8 * L.s);
  ctx.restore();
}

function drawPlayer() {
  var p = G.player, x, y, bob, punchAge, reach, glove, blink, duck, scY, scX, climb;
  if (!p) return;
  x = sx(p.x);
  y = sy(p.y);
  glove = p.glove > 0;
  duck = p.duck && p.grounded && p.state !== 'climb';
  climb = p.state === 'climb';
  punchAge = p.punch > 0 ? (PUNCH_T - p.punch) / PUNCH_T : 0;
  reach = punchAge > 0 ? Math.sin(Math.min(1, punchAge / 0.55) * Math.PI) : 0;
  bob = (p.grounded && !duck ? Math.sin(p.walk * 9) * 1.2 : 0) * L.s;
  scY = p.squash;
  scX = p.stretch;
  if (p.inv > 0 && ((G.clock * 16) | 0) % 2 === 0 && p.deadT <= 0) {
    ctx.globalAlpha = 0.38;
  }
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale((p.face >= 0 ? 1 : -1) * scX, scY);

  ctx.fillStyle = '#e07020';
  ctx.beginPath();
  ctx.moveTo(-10 * L.s, -8 * L.s);
  ctx.quadraticCurveTo(-20 * L.s, -4 * L.s, -16 * L.s, 2 * L.s);
  ctx.quadraticCurveTo(-10 * L.s, 2 * L.s, -6 * L.s, -2 * L.s);
  ctx.fill();

  ctx.fillStyle = '#ffb04a';
  ctx.beginPath();
  ctx.ellipse(0, duck ? -9 * L.s : -12 * L.s, 7.4 * L.s, (duck ? 7 : 10) * L.s, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#ff881f';
  ctx.fillRect(-6.4 * L.s, duck ? -6 * L.s : -6 * L.s, 5 * L.s, duck ? 7 * L.s : 10 * L.s);
  ctx.fillRect(0.6 * L.s, duck ? -5 * L.s : -5 * L.s, 5 * L.s, duck ? 7 * L.s : 10 * L.s);

  ctx.fillStyle = '#ffd080';
  ctx.beginPath();
  ctx.arc(1.5 * L.s, duck ? -18 * L.s : -23 * L.s, 6.2 * L.s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff881f';
  ctx.beginPath();
  ctx.ellipse(-2.4 * L.s, duck ? -24 * L.s : -29.5 * L.s, 2.1 * L.s, 3.6 * L.s, -0.35, 0, TAU);
  ctx.ellipse(3.4 * L.s, duck ? -24 * L.s : -29.5 * L.s, 2.1 * L.s, 3.6 * L.s, 0.35, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffd8a8';
  ctx.beginPath();
  ctx.ellipse(-2.4 * L.s, duck ? -24.4 * L.s : -29.8 * L.s, 1.1 * L.s, 2.1 * L.s, -0.35, 0, TAU);
  ctx.ellipse(3.4 * L.s, duck ? -24.4 * L.s : -29.8 * L.s, 1.1 * L.s, 2.1 * L.s, 0.35, 0, TAU);
  ctx.fill();

  blink = ((G.clock * 0.7) % 3.6) < 0.08;
  ctx.fillStyle = blink ? '#ffd080' : '#00f0ff';
  ctx.beginPath();
  ctx.arc(3.2 * L.s, duck ? -19.2 * L.s : -24.2 * L.s, 1.35 * L.s, 0, TAU);
  ctx.fill();
  if (!blink) {
    ctx.fillStyle = '#05030c';
    ctx.beginPath();
    ctx.arc(3.5 * L.s, duck ? -19.2 * L.s : -24.2 * L.s, 0.55 * L.s, 0, TAU);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(6 * L.s, duck ? -12 * L.s : -14 * L.s);
  if (climb) ctx.rotate(-1.1);
  else ctx.rotate(-0.15 + reach * 0.2);
  ctx.fillStyle = '#ffb04a';
  ctx.fillRect(0, -2 * L.s, (8 + reach * (glove ? 22 : 14)) * L.s, 4 * L.s);
  ctx.fillStyle = glove ? '#ffe36b' : '#ff3a3a';
  ctx.beginPath();
  ctx.ellipse((8 + reach * (glove ? 22 : 14)) * L.s, 0, (glove ? 5.4 : 4.2) * L.s, 4.4 * L.s, 0, 0, TAU);
  ctx.fill();
  if (glove) {
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.1 * L.s;
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = glove ? '#ffe36b' : '#ff3a3a';
  ctx.beginPath();
  ctx.ellipse(-5 * L.s, duck ? -11 * L.s : -13 * L.s, 3.4 * L.s, 3.2 * L.s, 0, 0, TAU);
  ctx.fill();

  if (p.deadT > 0) {
    ctx.strokeStyle = '#ff3db8';
    ctx.lineWidth = 1.4 * L.s;
    ctx.beginPath();
    ctx.moveTo(1.6 * L.s, -26 * L.s);
    ctx.lineTo(5.2 * L.s, -22 * L.s);
    ctx.moveTo(5.2 * L.s, -26 * L.s);
    ctx.lineTo(1.6 * L.s, -22 * L.s);
    ctx.stroke();
  }

  ctx.restore();
  ctx.globalAlpha = 1;

  if (glove && p.deadT <= 0) {
    ctx.fillStyle = 'rgba(255,227,107,0.12)';
    ctx.beginPath();
    ctx.arc(x, y - 14 * L.s, (18 + Math.sin(G.clock * 8) * 2) * L.s, 0, TAU);
    ctx.fill();
  }
}

function drawFx() {
  var i, o, a;
  for (i = 0; i < particles.length; i++) {
    o = particles[i];
    a = clamp(o.t / (o.max || 0.3), 0, 1);
    ctx.fillStyle = rgba(o.rgb, a);
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), o.r * L.s * (0.6 + a), 0, TAU);
    ctx.fill();
  }
  for (i = 0; i < juice.length; i++) {
    o = juice[i];
    ctx.fillStyle = rgba(o.rgb, clamp(o.t * 3, 0, 1));
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), o.r * L.s, 0, TAU);
    ctx.fill();
  }
  ctx.lineCap = 'round';
  for (i = 0; i < sparks.length; i++) {
    o = sparks[i];
    ctx.strokeStyle = rgba(o.rgb, clamp(o.t * 5, 0, 1));
    ctx.lineWidth = 1.4 * L.s;
    ctx.beginPath();
    ctx.moveTo(sx(o.x), sy(o.y));
    ctx.lineTo(sx(o.x - o.vx * 0.04), sy(o.y - o.vy * 0.04));
    ctx.stroke();
  }
  for (i = 0; i < rings.length; i++) {
    o = rings[i];
    ctx.strokeStyle = rgba(o.rgb, 1 - o.t / 0.32);
    ctx.lineWidth = 2 * L.s;
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), o.r * L.s, 0, TAU);
    ctx.stroke();
  }
  ctx.font = '700 ' + Math.max(11, 12 * L.s) + 'px "Segoe UI","PingFang SC",sans-serif';
  ctx.textAlign = 'center';
  for (i = 0; i < floats.length; i++) {
    o = floats[i];
    ctx.fillStyle = rgba(o.rgb, 1 - o.t / 0.7);
    ctx.fillText(o.text, sx(o.x), sy(o.y));
  }
  ctx.textAlign = 'left';
}

function drawFlash() {
  if (G.flash <= 0) return;
  ctx.fillStyle = rgba(G.flashRgb, clamp(G.flash * 2.2, 0, 0.28));
  ctx.fillRect(0, 0, cssW, cssH);
}

function draw() {
  var i, shx, shy;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  shx = (G.shake ? (Math.random() - 0.5) * G.shake : 0) + G.kickX;
  shy = (G.shake ? (Math.random() - 0.5) * G.shake * 0.6 : 0) + G.kickY;
  ctx.translate(shx, shy);
  drawBg();
  drawVines();
  drawPlats();
  drawCage();
  drawFruit();
  drawGloveItem();
  for (i = 0; i < G.monkeys.length; i++) drawMonkey(G.monkeys[i]);
  for (i = 0; i < G.apples.length; i++) drawApple(G.apples[i]);
  drawPlayer();
  drawFx();
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
bindPad(btnDown, function (v) { keys.d = v; });
bindPad(btnJump, function (v) {
  keys.u = v;
  if (v) G.jumpBuf = BUFFER;
});
bindPad(btnPunch, function (v) {
  keys.z = v;
  if (v) G.punchBuf = BUFFER;
});

function keyOn(e, down) {
  var k = e.code;
  if (k === 'ArrowLeft' || k === 'KeyA') { keys.l = down; e.preventDefault(); }
  else if (k === 'ArrowRight' || k === 'KeyD') { keys.r = down; e.preventDefault(); }
  else if (k === 'ArrowDown' || k === 'KeyS') { keys.d = down; e.preventDefault(); }
  else if (k === 'ArrowUp' || k === 'KeyW') {
    keys.u = down;
    if (down) G.jumpBuf = BUFFER;
    e.preventDefault();
  } else if (k === 'Space') {
    if (down) G.jumpBuf = BUFFER;
    e.preventDefault();
  } else if (k === 'KeyZ') {
    keys.z = down;
    if (down) G.punchBuf = BUFFER;
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
      startRun('rescue');
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      startRun('swarm');
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
      startRun('swarm');
      e.preventDefault();
      return;
    }
  }
  keyOn(e, true);
});

window.addEventListener('keyup', function (e) {
  keyOn(e, false);
});

btnMute.addEventListener('click', function () {
  audio.ensure();
  audio.setMuted(!audio.muted);
});
btnRetry.addEventListener('click', function () {
  audio.ensure();
  retry();
});
btnRescue.addEventListener('click', function () {
  audio.ensure();
  startRun('rescue');
});
btnSwarm.addEventListener('click', function () {
  audio.ensure();
  startRun('swarm');
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

seedFireflies();
bestEl.textContent = String(G.bestJ);
renderPips();
showTitle();
resize();
hudPlay();
modeLabel.textContent = '救子';
requestAnimationFrame(frame);

}
