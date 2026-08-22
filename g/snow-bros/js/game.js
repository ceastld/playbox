'use strict';

/* 雪兄 — Snow Bros remake. Throw snow, pack enemies, kick-roll crush. No CDN. */

var WORLD_W = 480;
var WORLD_H = 360;
var PLAY_L = 16;
var PLAY_R = 464;
var FLOOR_Y = 338;
var CEIL_Y = 16;
var LIVES = 3;
var PW = 12;
var PH = 20;
var WALK = 114;
var JUMP_V = 368;
var GRAV = 980;
var MAX_FALL = 440;
var COYOTE = 0.09;
var BUFFER = 0.12;
var THROW_CD = 0.30;
var THROW_CD_FAST = 0.22;
var THROW_SPD = 256;
var MAX_SNOW = 4;
var INVULN = 1.5;
var DIE_T = 0.7;
var COMBO_WIN = 1.5;
var THAW_T = 5.6;
var HURRY_T = 32;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var BEST_KEY = 'playbox-snow-bros-best';
var MUTE_KEY = 'playbox-snow-bros-mute';
var AUTO_SPEED_KEY = 'playbox-snow-bros-auto-speed';
var SPEED_LABELS = ['', '慢', '中', '快', '极快'];
var AUTO_SCALE = [1, 0.52, 0.78, 1, 3.4];

var CYN = [0, 240, 255];
var MAG = [255, 61, 184];
var GOLD = [255, 227, 107];
var ICE = [30, 184, 255];
var ICE2 = [122, 240, 255];
var WHT = [234, 246, 255];
var ORG = [255, 122, 64];
var PUR = [155, 92, 255];
var LIME = [125, 255, 74];
var HOT = [255, 196, 74];

var LOOT_NAME = ['雪币', '冰晶', '雪花', '金铃', '福袋'];
var LOOT_VAL = [100, 200, 400, 800, 1600];
var LOOT_RGB = [ICE, CYN, WHT, GOLD, MAG];

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
function plat(x, y, w) {
  return { x: x, y: y, w: w, h: 10 };
}
function sign(v) {
  return v < 0 ? -1 : v > 0 ? 1 : 0;
}

var FLOOR = plat(8, FLOOR_Y, 464);

var ROOMS = [
  {
    name: '雪原',
    plats: [FLOOR, plat(36, 282, 150), plat(294, 282, 150), plat(155, 226, 170)],
    foes: [
      { k: 'walker', x: 240, y: FLOOR_Y },
      { k: 'walker', x: 390, y: 282 }
    ]
  },
  {
    name: '双梁',
    plats: [FLOOR, plat(20, 282, 190), plat(270, 226, 190), plat(120, 170, 240)],
    foes: [
      { k: 'walker', x: 90, y: 282 },
      { k: 'walker', x: 360, y: 226 },
      { k: 'hopper', x: 220, y: 170 }
    ]
  },
  {
    name: '冰阶',
    plats: [FLOOR, plat(28, 282, 110), plat(128, 226, 110), plat(228, 170, 110), plat(328, 114, 120)],
    foes: [
      { k: 'walker', x: 80, y: 282 },
      { k: 'hopper', x: 180, y: 226 },
      { k: 'walker', x: 280, y: 170 },
      { k: 'hopper', x: 380, y: 114 }
    ]
  },
  {
    name: '雪王',
    plats: [FLOOR, plat(20, 282, 130), plat(330, 282, 130), plat(150, 226, 180), plat(190, 114, 100)],
    foes: [
      { k: 'boss', x: 240, y: FLOOR_Y, hp: 8 },
      { k: 'walker', x: 80, y: 282 }
    ],
    boss: true
  },
  {
    name: '夹谷',
    plats: [
      FLOOR,
      plat(20, 282, 90), plat(150, 282, 90), plat(280, 282, 90), plat(390, 282, 70),
      plat(70, 226, 100), plat(250, 226, 140),
      plat(40, 170, 140), plat(300, 170, 140)
    ],
    foes: [
      { k: 'walker', x: 60, y: 282 },
      { k: 'walker', x: 320, y: 282 },
      { k: 'hopper', x: 120, y: 170 },
      { k: 'hopper', x: 360, y: 170 }
    ]
  },
  {
    name: '飞檐',
    plats: [FLOOR, plat(40, 282, 120), plat(320, 282, 120), plat(160, 214, 160), plat(80, 140, 90), plat(310, 140, 90)],
    foes: [
      { k: 'flyer', x: 120, y: 200 },
      { k: 'flyer', x: 360, y: 180 },
      { k: 'walker', x: 80, y: 282 },
      { k: 'hopper', x: 380, y: 282 }
    ]
  },
  {
    name: '密林',
    plats: [
      FLOOR,
      plat(24, 282, 80), plat(200, 282, 80), plat(376, 282, 80),
      plat(90, 226, 120), plat(270, 226, 120),
      plat(24, 170, 100), plat(190, 170, 100), plat(356, 170, 100),
      plat(140, 114, 200)
    ],
    foes: [
      { k: 'hopper', x: 60, y: 282 },
      { k: 'hopper', x: 240, y: 282 },
      { k: 'flyer', x: 240, y: 90 },
      { k: 'walker', x: 240, y: 114 },
      { k: 'hopper', x: 420, y: 170 }
    ]
  },
  {
    name: '雪帝',
    plats: [FLOOR, plat(20, 270, 110), plat(350, 270, 110), plat(160, 214, 160), plat(40, 150, 90), plat(350, 150, 90)],
    foes: [
      { k: 'boss', x: 240, y: FLOOR_Y, hp: 8 },
      { k: 'hopper', x: 70, y: 270 },
      { k: 'flyer', x: 240, y: 160 }
    ],
    boss: true
  }
];

var STORM = [
  { plats: [FLOOR, plat(30, 282, 160), plat(290, 282, 160), plat(150, 214, 180)] },
  { plats: [FLOOR, plat(20, 282, 200), plat(260, 226, 200), plat(80, 170, 140), plat(280, 114, 140)] },
  { plats: [FLOOR, plat(24, 282, 90), plat(140, 226, 90), plat(250, 170, 90), plat(360, 114, 96)] },
  { plats: [FLOOR, plat(20, 270, 120), plat(340, 270, 120), plat(140, 214, 200), plat(80, 150, 80), plat(320, 150, 80)] },
  { plats: [FLOOR, plat(20, 282, 80), plat(140, 282, 80), plat(260, 282, 80), plat(380, 282, 76), plat(80, 214, 140), plat(260, 214, 140), plat(160, 150, 160)] },
  { plats: [FLOOR, plat(40, 282, 120), plat(320, 226, 120), plat(80, 170, 160), plat(280, 114, 140)] }
];

function jumpHeight() {
  return (JUMP_V * JUMP_V) / (2 * GRAV);
}

function comboMul(n) {
  var k = n | 0;
  if (k <= 1) return 1;
  return Math.min(16, 1 << Math.min(4, k - 1));
}

function crushScore(combo) {
  return 400 * comboMul(combo);
}

function lootIndex(combo) {
  return clamp((combo | 0) - 1, 0, 4);
}

function packNeed(k, avalanche) {
  if (k === 'boss') return avalanche ? 6 : 8;
  if (k === 'flyer') return 2;
  return avalanche ? 2 : 3;
}

function kindRgb(k) {
  if (k === 'walker') return ORG;
  if (k === 'hopper') return MAG;
  if (k === 'flyer') return PUR;
  if (k === 'boss') return GOLD;
  return ICE;
}

function kindSpd(k) {
  if (k === 'walker') return 42;
  if (k === 'hopper') return 50;
  if (k === 'flyer') return 46;
  if (k === 'boss') return 38;
  return 40;
}

function foeSize(k) {
  if (k === 'boss') return { w: 22, h: 26 };
  if (k === 'flyer') return { w: 16, h: 16 };
  if (k === 'hopper') return { w: 14, h: 16 };
  return { w: 14, h: 15 };
}

function ballR(k) {
  return k === 'boss' ? 20 : 14;
}

function rollSpd(avalanche) {
  return avalanche ? 330 : 252;
}

function throwCd(avalanche) {
  return avalanche ? THROW_CD_FAST : THROW_CD;
}

function xOnPlat(p, x, slop) {
  slop = slop == null ? 1 : slop;
  return x >= p.x - slop && x <= p.x + p.w + slop;
}

function platAt(plats, x, feet, slop) {
  var i, p;
  slop = slop == null ? 3.5 : slop;
  for (i = 0; i < plats.length; i++) {
    p = plats[i];
    if (!xOnPlat(p, x, 2)) continue;
    if (Math.abs(feet - p.y) <= slop) return p;
  }
  return null;
}

function landPlat(plats, x, feet, prevFeet) {
  var i, p;
  for (i = 0; i < plats.length; i++) {
    p = plats[i];
    if (!xOnPlat(p, x, 2)) continue;
    if (prevFeet <= p.y + 2 && feet >= p.y && feet <= p.y + 16) return p;
  }
  return null;
}

function onEdge(plats, x, y, face) {
  var ahead = x + face * 10;
  if (ahead < PLAY_L + 1 || ahead > PLAY_R - 1) return true;
  var here = platAt(plats, x, y, 4);
  if (!here) return false;
  return !xOnPlat(here, ahead, 0);
}

function circleHit(ax, ay, ar, bx, by, br) {
  var dx = ax - bx;
  var dy = ay - by;
  return dx * dx + dy * dy < (ar + br) * (ar + br);
}

function bodyHit(px, py, foe) {
  var hw, hh, cx, cy;
  if (foe.packed) {
    return Math.abs(px - foe.x) < PW * 0.45 + foe.r && Math.abs(py - PH * 0.5 - (foe.y - foe.r)) < PH * 0.42 + foe.r;
  }
  hw = foe.w * 0.42;
  hh = foe.h * 0.46;
  cx = foe.x;
  cy = foe.y - foe.h * 0.5;
  return Math.abs(px - cx) < PW * 0.45 + hw && Math.abs(py - PH * 0.5 - cy) < PH * 0.42 + hh;
}

function snowHitFoe(s, foe) {
  var cy, rr;
  if (foe.packed) {
    return circleHit(s.x, s.y, s.r, foe.x, foe.y - foe.r, foe.r);
  }
  cy = foe.y - foe.h * 0.5;
  rr = s.r + Math.max(foe.w, foe.h) * 0.42;
  return circleHit(s.x, s.y, 0, foe.x, cy, rr);
}

function ballsHit(a, b) {
  return circleHit(a.x, a.y - a.r, a.r * 0.92, b.x, b.y - b.r, b.r * 0.92);
}

function canKick(p, foe) {
  if (!foe.packed || foe.dead) return false;
  if (Math.abs(p.y - foe.y) > 12) return false;
  return Math.abs(p.x - foe.x) < PW * 0.5 + foe.r + 3;
}

function ballTop(foe) {
  return foe.y - foe.r * 2 + 3;
}

function loadAutoSpeed() {
  try {
    var n = parseInt(localStorage.getItem(AUTO_SPEED_KEY) || '3', 10);
    if (!isFinite(n) || n < 1 || n > 4) return 3;
    return n;
  } catch (err) {
    return 3;
  }
}

function saveAutoSpeed(n) {
  try { localStorage.setItem(AUTO_SPEED_KEY, String(n)); } catch (err) { /* ignore */ }
}

function mirrorX(x) {
  return WORLD_W - x;
}

function mirrorPlats(plats) {
  return plats.map(function (p) {
    return plat(mirrorX(p.x + p.w), p.y, p.w);
  });
}

function makePlayer(spawn) {
  spawn = spawn || { x: 56, y: FLOOR_Y };
  return {
    x: spawn.x,
    y: spawn.y,
    vx: 0,
    vy: 0,
    face: 1,
    grounded: true,
    walk: 0,
    coyote: COYOTE,
    squash: 1,
    inv: 0,
    deadT: 0,
    toss: 0,
    tossCd: 0,
    state: 'idle',
    ride: null
  };
}

function makeFoe(spec, mul, avalanche) {
  var sz = foeSize(spec.k);
  return {
    k: spec.k,
    x: spec.x,
    y: spec.y,
    baseY: spec.y,
    vx: 0,
    vy: 0,
    face: spec.x > WORLD_W * 0.5 ? -1 : 1,
    w: sz.w,
    h: sz.h,
    hp: spec.hp || packNeed(spec.k, avalanche),
    pack: 0,
    packed: false,
    rolling: false,
    r: ballR(spec.k),
    thaw: 0,
    bounce: 0,
    crush: 0,
    rollT: 0,
    spin: 0,
    grounded: spec.k !== 'flyer',
    walk: rand(0, 8),
    hopCd: rand(0.5, 1.4),
    ph: rand(0, TAU),
    inv: 0,
    flash: 0,
    dead: false,
    angry: 0,
    squash: 1,
    spd: kindSpd(spec.k) * (mul || 1)
  };
}

function makeSnow(x, y, face) {
  return {
    x: x,
    y: y,
    vx: face * THROW_SPD,
    vy: -18,
    r: 5,
    face: face,
    t: 0,
    life: 0.56,
    dead: false
  };
}

function makeLoot(x, y, combo) {
  var i = lootIndex(combo);
  return {
    x: x,
    y: y,
    vy: -110,
    grounded: false,
    t: 0,
    i: i,
    val: LOOT_VAL[i],
    name: LOOT_NAME[i],
    rgb: LOOT_RGB[i],
    take: false
  };
}

function roomClear(foes) {
  var i;
  for (i = 0; i < foes.length; i++) {
    if (!foes[i].dead) return false;
  }
  return true;
}

function speedMul(round, avalanche) {
  return (avalanche ? 1.28 : 1) + Math.max(0, round - 1) * (avalanche ? 0.08 : 0.04);
}

function selfCheck() {
  var h, p, f, s, plats, e, b, mul, o;

  if (ROOMS.length !== 8) throw new Error('8 rooms');
  if (ROOMS[3].boss !== true) throw new Error('boss after a few rooms');
  if (ROOMS[7].boss !== true) throw new Error('final boss');
  if (LIVES !== 3) throw new Error('3 lives');
  if (BEST_KEY !== 'playbox-snow-bros-best') throw new Error('best key');
  if (AUTO_SPEED_KEY !== 'playbox-snow-bros-auto-speed') throw new Error('auto speed key');
  if (loadAutoSpeed() < 1 || loadAutoSpeed() > 4) throw new Error('auto speed range');
  if (SPEED_LABELS[3] !== '快') throw new Error('default speed label');
  if (packNeed('walker', false) !== 3) throw new Error('walker pack');
  if (packNeed('walker', true) !== 2) throw new Error('avalanche pack');
  if (packNeed('boss', false) !== 8) throw new Error('boss pack');
  if (packNeed('flyer', false) !== 2) throw new Error('flyer pack');
  if (rollSpd(true) <= rollSpd(false)) throw new Error('avalanche roll faster');
  if (throwCd(true) >= throwCd(false)) throw new Error('avalanche throw faster');

  h = jumpHeight();
  if (h < 50 || h > 78) throw new Error('jump height window ' + h);
  (function () {
    var y = FLOOR_Y;
    var vy = -JUMP_V;
    var minY = y;
    var t;
    for (t = 0; t < 1.2; t += STEP) {
      vy = Math.min(MAX_FALL, vy + GRAV * STEP);
      y += vy * STEP;
      if (y < minY) minY = y;
    }
    if (FLOOR_Y - minY < 58) throw new Error('jump must clear 56px tier');
  })();

  plats = ROOMS[0].plats;
  if (!platAt(plats, 240, FLOOR_Y, 2)) throw new Error('floor stand');
  if (platAt(plats, 240, 200, 2)) throw new Error('air not stand');
  p = landPlat(plats, 100, 283, 270);
  if (!p || p.y !== 282) throw new Error('land mid plat');
  if (landPlat(plats, 100, 270, 260)) throw new Error('no land from below');
  if (!onEdge(plats, 36, 282, -1)) throw new Error('left edge');
  if (onEdge(plats, 80, 282, 1)) throw new Error('mid not edge');

  if (comboMul(1) !== 1) throw new Error('combo 1');
  if (comboMul(2) !== 2) throw new Error('combo 2');
  if (comboMul(3) !== 4) throw new Error('combo 3');
  if (comboMul(5) !== 16) throw new Error('combo cap');
  if (crushScore(1) !== 400) throw new Error('crush score');
  if (LOOT_VAL[4] !== 1600) throw new Error('loot 5');

  f = makeFoe({ k: 'walker', x: 200, y: FLOOR_Y }, 1, false);
  s = makeSnow(200, FLOOR_Y - 10, 1);
  if (!snowHitFoe(s, f)) throw new Error('snow packs');
  f.x = 280;
  if (snowHitFoe(s, f)) throw new Error('snow miss');

  e = makeFoe({ k: 'walker', x: 56, y: FLOOR_Y }, 1, false);
  if (!bodyHit(56, FLOOR_Y, e)) throw new Error('touch foe');
  if (bodyHit(200, FLOOR_Y, e)) throw new Error('far foe');

  e.packed = true;
  e.r = 14;
  if (!canKick({ x: 56, y: FLOOR_Y }, e)) throw new Error('kick packed');
  if (canKick({ x: 56, y: FLOOR_Y - 40 }, e)) throw new Error('no kick from above');

  b = makeFoe({ k: 'walker', x: 120, y: FLOOR_Y }, 1, false);
  b.packed = true;
  b.r = 14;
  e.x = 56;
  if (ballsHit(e, b)) throw new Error('balls far');
  b.x = 70;
  if (!ballsHit(e, b)) throw new Error('balls hit');

  if (!roomClear([])) throw new Error('empty clear');
  if (roomClear([makeFoe({ k: 'walker', x: 1, y: 1 }, 1, false)])) throw new Error('live foe');
  e = makeFoe({ k: 'walker', x: 1, y: 1 }, 1, false);
  e.packed = true;
  if (roomClear([e])) throw new Error('packed not clear');
  e.dead = true;
  if (!roomClear([e])) throw new Error('dead clear');

  if (ROOMS[0].foes.length < 2) throw new Error('room1 foes');
  mul = speedMul(5, true);
  if (mul <= speedMul(5, false)) throw new Error('avalanche scales');
  if (mirrorX(40) !== 440) throw new Error('mirror');
  if (kindRgb('walker') !== ORG) throw new Error('walker color');
  if (ballTop({ y: 100, r: 14 }) >= 100) throw new Error('ball top');

  e = makeFoe({ k: 'walker', x: 200, y: FLOOR_Y }, 1, false);
  for (h = 0; h < e.hp; h++) e.pack += 1;
  if (e.pack < e.hp) throw new Error('need full pack');
  e.packed = true;
  e.r = ballR(e.k);
  if (!canKick({ x: 200, y: FLOOR_Y }, e)) throw new Error('kick after pack');
  e.rolling = true;
  e.vx = rollSpd(false);
  e.face = 1;
  o = makeFoe({ k: 'hopper', x: 208, y: FLOOR_Y }, 1, false);
  if (!snowHitFoe({ x: e.x, y: e.y - e.r, r: e.r }, o)) throw new Error('roll crush nearby');
  if (snowHitFoe({ x: e.x, y: e.y - e.r, r: e.r }, makeFoe({ k: 'walker', x: 400, y: FLOOR_Y }, 1, false))) {
    throw new Error('roll miss far');
  }
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
var ovKicker = document.getElementById('ov-kicker');
var ovStart = document.getElementById('ov-start');
var ovEnd = document.getElementById('ov-end');
var ovRetry = document.getElementById('ov-retry');
var ovMenu = document.getElementById('ov-menu');
var btnRooms = document.getElementById('btn-rooms');
var btnAvalanche = document.getElementById('btn-avalanche');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnAuto = document.getElementById('btn-auto');
var speedEl = document.getElementById('speed');
var speedLab = document.getElementById('speed-lab');
var btnLeft = document.getElementById('btn-left');
var btnRight = document.getElementById('btn-right');
var btnJump = document.getElementById('btn-jump');
var btnThrow = document.getElementById('btn-throw');
var scoreEl = document.getElementById('score');
var roundEl = document.getElementById('round');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var pipsEl = document.getElementById('pips');
var toastEl = document.getElementById('toast');
var hintEl = document.getElementById('hint');
var motionQ = window.matchMedia('(prefers-reduced-motion: reduce)');

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
var flakes = [];

var keys = { l: false, r: false, u: false, toss: false };
var autoOn = false;
var autoSpeed = loadAutoSpeed();
var autoOvWait = 0;
var autoStuck = 0;
var autoLastX = 56;
var autoLastY = FLOOR_Y;
var autoWalkDir = 1;

var G = {
  mode: 'title',
  kind: 'rooms',
  clock: 0,
  round: 1,
  lives: LIVES,
  score: 0,
  bestR: 0,
  bestA: 0,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  player: makePlayer(),
  foes: [],
  snow: [],
  loot: [],
  plats: ROOMS[0].plats.slice(),
  roomName: '雪原',
  spawn: { x: 56, y: FLOOR_Y },
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flash: 0,
  flashRgb: ICE,
  clearT: 0,
  jumpBuf: 0,
  tossBuf: 0,
  roomT: 0,
  hurry: false,
  lock: 0,
  why: '',
  won: false
};

function reduceMotion() {
  return motionQ.matches;
}

function isStorm() {
  return G.kind === 'avalanche';
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
    try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (err) { /* ignore */ }
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
    this.beep(300, 0.06, 'square', 0.045, 540);
    this.noise(0.035, 0.035, 1700, 'highpass');
  },
  land: function () {
    this.ensure();
    this.noise(0.045, 0.045, 360, 'bandpass');
    this.beep(150, 0.035, 'sine', 0.025, 70);
  },
  toss: function () {
    this.ensure();
    this.noise(0.07, 0.05, 1400, 'highpass');
    this.beep(520, 0.07, 'triangle', 0.04, 280);
    this.beep(880, 0.05, 'sine', 0.03, 420);
  },
  pack: function () {
    this.ensure();
    this.noise(0.06, 0.055, 700, 'lowpass');
    this.beep(240, 0.07, 'sine', 0.05, 160);
    this.beep(480, 0.08, 'triangle', 0.035, 720);
  },
  full: function () {
    this.ensure();
    this.noise(0.09, 0.07, 500, 'lowpass');
    this.beep(180, 0.1, 'sine', 0.055, 90);
    this.beep(620, 0.12, 'triangle', 0.05, 980);
  },
  kick: function () {
    this.ensure();
    this.noise(0.08, 0.07, 280, 'lowpass');
    this.beep(140, 0.09, 'square', 0.055, 70);
    this.beep(90, 0.07, 'sawtooth', 0.03, 50);
  },
  crush: function (combo) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.09;
    this.noise(0.1, 0.08, 900, 'highpass');
    this.beep(360 * p, 0.08, 'square', 0.07, 720 * p);
    this.beep(540 * p, 0.14, 'triangle', 0.05, 980 * p);
  },
  smash: function (combo) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.08;
    this.noise(0.12, 0.09, 320, 'lowpass');
    this.beep(200 * p, 0.12, 'sawtooth', 0.06, 80);
    this.beep(480 * p, 0.1, 'square', 0.05, 820 * p);
  },
  loot: function () {
    this.ensure();
    this.beep(620, 0.07, 'square', 0.05, 920);
    this.beep(880, 0.1, 'triangle', 0.04, 1240);
  },
  bounce: function () {
    this.ensure();
    this.noise(0.05, 0.05, 400, 'bandpass');
    this.beep(180, 0.05, 'sine', 0.03, 90);
  },
  thaw: function () {
    this.ensure();
    this.noise(0.1, 0.06, 600, 'highpass');
    this.beep(280, 0.1, 'triangle', 0.04, 140);
  },
  die: function () {
    this.ensure();
    this.noise(0.16, 0.11, 280, 'lowpass');
    this.beep(320, 0.22, 'sawtooth', 0.06, 70);
    this.beep(180, 0.18, 'square', 0.04, 50);
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
    this.beep(659, 0.12, 'square', 0.05, 784);
    this.beep(880, 0.22, 'triangle', 0.05, 1174);
  },
  ui: function () {
    this.ensure();
    this.beep(640, 0.05, 'square', 0.035, 420);
  },
  hurry: function () {
    this.ensure();
    this.beep(880, 0.08, 'square', 0.05, 440);
    this.beep(440, 0.12, 'sawtooth', 0.04, 220);
  },
  start: function () {
    this.ensure();
    this.beep(330, 0.08, 'square', 0.04, 440);
    this.beep(440, 0.1, 'triangle', 0.04, 660);
  }
};

try {
  if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
} catch (err) { /* ignore */ }

function loadBest() {
  try {
    var raw = localStorage.getItem(BEST_KEY);
    var o = JSON.parse(raw);
    if (o && typeof o === 'object') {
      G.bestR = (o.r | 0) || (o.d | 0);
      G.bestA = o.a | 0;
      return;
    }
    if (typeof o === 'number') {
      G.bestR = o | 0;
      G.bestA = o | 0;
    }
  } catch (err) { /* ignore */ }
}

function persistBest() {
  var cur = isStorm() ? G.bestA : G.bestR;
  if (G.score > cur) {
    if (isStorm()) G.bestA = G.score;
    else G.bestR = G.score;
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ r: G.bestR, a: G.bestA }));
  } catch (err) { /* ignore */ }
}

function currentBest() {
  return isStorm() ? G.bestA : G.bestR;
}

loadBest();

function seedFlakes() {
  var i;
  flakes.length = 0;
  for (i = 0; i < 28; i++) {
    flakes.push({
      x: rand(0, WORLD_W),
      y: rand(0, WORLD_H),
      v: rand(18, 46),
      s: rand(0.8, 2.1),
      w: rand(8, 22),
      ph: rand(0, TAU)
    });
  }
}
seedFlakes();

/* ---- fx ---- */
function hitStop(t) {
  if (reduceMotion()) return;
  if (t > G.stop) G.stop = t;
}

function shake(n) {
  if (reduceMotion()) return;
  G.shake = Math.max(G.shake, n);
}

function kickCam(n) {
  if (reduceMotion()) return;
  G.kickX = (Math.random() < 0.5 ? -1 : 1) * n;
  G.kickY = -n * 0.4;
  stageEl.classList.remove('hop', 'smash', 'clear');
  void stageEl.offsetWidth;
  stageEl.classList.add('hop');
  clearTimeout(kickTok);
  kickTok = setTimeout(function () { stageEl.classList.remove('hop'); }, 180);
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
      vx: Math.cos(a) * rand(80, 240),
      vy: Math.sin(a) * rand(80, 240),
      t: 0.22 * rand(0.7, 1.2),
      rgb: rgb
    });
  }
}

function ring(x, y, rgb) {
  rings.push({ x: x, y: y, r: 6, t: 0, rgb: rgb || ICE });
}

function floatText(x, y, text, rgb) {
  floats.push({ x: x, y: y, text: text, rgb: rgb || GOLD, t: 0 });
}

function tickFx(dt) {
  var i, o;
  G.kickX = lerp(G.kickX, 0, 1 - Math.pow(0.0002, dt));
  G.kickY = lerp(G.kickY, 0, 1 - Math.pow(0.0002, dt));
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
  if (G.flash > 0) G.flash = Math.max(0, G.flash - dt);
  for (i = particles.length - 1; i >= 0; i--) {
    o = particles[i];
    o.t -= dt;
    o.vy += o.g * dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    if (o.t <= 0) particles.splice(i, 1);
  }
  for (i = sparks.length - 1; i >= 0; i--) {
    o = sparks[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    if (o.t <= 0) sparks.splice(i, 1);
  }
  for (i = rings.length - 1; i >= 0; i--) {
    o = rings[i];
    o.t += dt;
    o.r += dt * 90;
    if (o.t > 0.36) rings.splice(i, 1);
  }
  for (i = floats.length - 1; i >= 0; i--) {
    o = floats[i];
    o.t += dt;
    o.y -= dt * 36;
    if (o.t > 0.7) floats.splice(i, 1);
  }
  for (i = 0; i < flakes.length; i++) {
    o = flakes[i];
    o.ph += dt;
    o.y += o.v * dt;
    o.x += Math.sin(o.ph) * o.w * dt * 0.35;
    if (o.y > WORLD_H + 6) {
      o.y = -4;
      o.x = rand(0, WORLD_W);
    }
  }
}

function toast(msg, warn, gold) {
  toastEl.textContent = msg;
  toastEl.classList.toggle('warn', !!warn);
  toastEl.classList.toggle('gold', !!gold);
  toastEl.classList.remove('hidden');
  clearTimeout(toastTok);
  toastTok = setTimeout(function () { toastEl.classList.add('hidden'); }, 1100);
}

function addScore(n, x, y) {
  if (n <= 0) return;
  G.score += n;
  scoreEl.textContent = String(G.score);
  scoreBox.classList.remove('flash');
  void scoreBox.offsetWidth;
  scoreBox.classList.add('flash');
  scoreAdd.hidden = false;
  scoreAdd.textContent = '+' + n;
  clearTimeout(addTok);
  addTok = setTimeout(function () { scoreAdd.hidden = true; }, 680);
  if (x != null) floatText(x, y - 18, '+' + n, GOLD);
  persistBest();
  bestEl.textContent = String(currentBest());
}

function bumpCombo() {
  G.combo += 1;
  if (G.combo > G.maxCombo) G.maxCombo = G.combo;
  G.comboAge = 0;
  comboEl.textContent = '×' + comboMul(G.combo);
  comboBox.classList.remove('hot');
  void comboBox.offsetWidth;
  comboBox.classList.add('hot');
  if (G.combo >= 4) toast('连碾 ×' + comboMul(G.combo), false, true);
}

function renderPips() {
  var i, s = '';
  for (i = 0; i < LIVES; i++) {
    s += '<i class="pip ' + (i < G.lives ? 'on' : 'gone') + '"></i>';
  }
  pipsEl.innerHTML = s;
}

function hudPlay() {
  scoreEl.textContent = String(G.score);
  roundEl.textContent = String(G.round);
  bestEl.textContent = String(currentBest());
  comboEl.textContent = '×' + comboMul(Math.max(1, G.combo));
  modeLabel.textContent = isStorm() ? '雪崩' : '滚雪';
  modeLabel.classList.toggle('avalanche', isStorm());
  renderPips();
}

/* ---- overlay ---- */
function hideOverlay() {
  overlayEl.classList.add('hidden');
}

function showTitle() {
  G.mode = 'title';
  G.won = false;
  overlayEl.classList.remove('hidden');
  panelEl.classList.remove('win', 'lose');
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
  ovKicker.textContent = 'SNOW';
  ovTitle.textContent = '雪兄';
  ovLead.textContent = '跳上平台扔雪，把怪一层层裹成雪球，再踢出去碾碎一路。碰到没裹住的怪会丢命。';
  ovOps.textContent = '← → / D 走 · 上 / W 跳 · 空格扔雪 · A 自动 · 触屏左 跳 抛 右 · R 重开 · M 静音';
  hintEl.textContent = autoOn
    ? '托管中 · 即将开局 · A 停下'
    : '扔雪裹怪 · 踢雪球碾过去 · 可踩在雪球上 · A 自动 · 碰到没裹住的怪丢命';
  loadRoom(1, true);
}

function showOver() {
  G.mode = 'over';
  persistBest();
  overlayEl.classList.remove('hidden');
  panelEl.classList.remove('win');
  panelEl.classList.add('lose');
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
  ovKicker.textContent = 'SNOW';
  ovTitle.textContent = '命尽';
  ovLead.textContent = '第 ' + G.round + ' 房 · 分数 ' + G.score + ' · 最高连碾 ×' + comboMul(Math.max(1, G.maxCombo));
  ovOps.textContent = 'R 或 再来 重开本模式 · 换模式回标题 · 顶栏重开随时可用';
}

function showWin() {
  G.mode = 'over';
  G.won = true;
  persistBest();
  overlayEl.classList.remove('hidden');
  panelEl.classList.remove('lose');
  panelEl.classList.add('win');
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
  ovKicker.textContent = 'CLEAR';
  ovTitle.textContent = '通关';
  ovLead.textContent = '八房滚完。分数 ' + G.score + ' · 最高连碾 ×' + comboMul(Math.max(1, G.maxCombo));
  ovOps.textContent = 'R 再闯一趟 · 换模式去雪崩';
}

function buildStorm(round) {
  var tpl = STORM[(round - 1) % STORM.length];
  var plats = round % 2 === 0 ? mirrorPlats(tpl.plats) : tpl.plats.slice();
  var n = 2 + Math.min(6, (round / 2) | 0);
  var mul = speedMul(round, true);
  var foes = [];
  var kinds, i, x, y, k;
  var boss = round % 4 === 0;
  if (boss) {
    foes.push(makeFoe({ k: 'boss', x: 240, y: FLOOR_Y, hp: 6 + Math.min(4, (round / 4) | 0) }, mul, true));
    n = Math.max(2, n - 1);
  }
  kinds = ['walker'];
  if (round >= 2) kinds.push('hopper');
  if (round >= 3) kinds.push('flyer');
  if (round >= 6) kinds.push('hopper');
  for (i = 0; i < n; i++) {
    k = kinds[i % kinds.length];
    x = 70 + (i * 73 + round * 17) % 340;
    y = FLOOR_Y;
    if (plats[1 + (i % Math.max(1, plats.length - 1))]) {
      var pl = plats[1 + (i % Math.max(1, plats.length - 1))];
      x = clamp(pl.x + pl.w * 0.5, PLAY_L + 20, PLAY_R - 20);
      y = pl.y;
    }
    foes.push(makeFoe({ k: k, x: x, y: y }, mul, true));
  }
  return { name: '雪崩 ' + round, plats: plats, foes: foes, boss: boss };
}

function loadRoom(round, attract) {
  var spec, i, mul, list;
  G.round = round;
  G.roomT = 0;
  G.hurry = false;
  G.clearT = 0;
  G.snow = [];
  G.loot = [];
  G.comboAge = G.combo > 0 ? G.comboAge : 0;
  particles.length = 0;
  sparks.length = 0;
  rings.length = 0;

  if (isStorm() && !attract) {
    spec = buildStorm(round);
    G.plats = spec.plats;
    G.roomName = spec.name;
    G.foes = spec.foes;
  } else {
    spec = ROOMS[clamp(round - 1, 0, ROOMS.length - 1)];
    mul = attract ? 0.7 : speedMul(round, false);
    G.plats = spec.plats;
    G.roomName = spec.name;
    G.foes = [];
    list = spec.foes;
    for (i = 0; i < list.length; i++) G.foes.push(makeFoe(list[i], mul, false));
  }

  G.spawn = { x: 56, y: FLOOR_Y };
  if (!attract) {
    G.player.x = G.spawn.x;
    G.player.y = G.spawn.y;
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.face = 1;
    G.player.grounded = true;
    G.player.state = 'idle';
    G.player.deadT = 0;
    G.player.inv = 0.45;
    G.player.toss = 0;
    G.player.tossCd = 0;
    G.player.ride = null;
  }
  roundEl.textContent = String(G.round);
  if (!attract && spec && spec.boss) toast(G.roomName, false, true);
}

function startRun(kind) {
  G.kind = kind === 'avalanche' ? 'avalanche' : 'rooms';
  G.round = 1;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  G.maxCombo = 0;
  G.comboAge = 0;
  G.won = false;
  G.why = '';
  G.player = makePlayer();
  hideOverlay();
  G.mode = 'play';
  autoOvWait = 0;
  autoStuck = 0;
  clearAutoKeys();
  loadRoom(1, false);
  autoLastX = G.player.x;
  autoLastY = G.player.y;
  hudPlay();
  if (autoOn) hintEl.textContent = '托管中 · 扔雪裹怪 · 踢雪球 · A 停下';
  audio.start();
  try {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    canvas.focus({ preventScroll: true });
  } catch (err) { /* ignore */ }
}

function retry() {
  audio.ui();
  if (G.mode === 'title') startRun('rooms');
  else startRun(G.kind || 'rooms');
}

function nextRoom() {
  var n = G.round + 1;
  if (!isStorm() && G.round >= ROOMS.length) {
    addScore(2000 + G.round * 200, WORLD_W * 0.5, 80);
    audio.win();
    showWin();
    return;
  }
  loadRoom(n, false);
  hudPlay();
}

/* ---- combat ---- */
function fullyPack(e) {
  e.packed = true;
  e.rolling = false;
  e.vx = 0;
  e.vy = 0;
  e.thaw = isStorm() ? 4.6 : THAW_T;
  if (G.hurry) e.thaw *= 0.72;
  e.r = ballR(e.k);
  e.bounce = 0;
  e.crush = 0;
  e.rollT = 0;
  e.grounded = !!platAt(G.plats, e.x, e.y, 4);
  addScore(200, e.x, e.y - 8);
  burst(e.x, e.y - 10, 18, WHT, 160, 0.4, 180);
  spark(e.x, e.y - 10, 8, ICE2);
  ring(e.x, e.y - e.r, ICE);
  audio.full();
  hitStop(0.055);
  kickCam(3);
  flash(WHT, 0.08);
}

function packHit(e, face) {
  if (e.dead || e.packed || e.inv > 0) return false;
  e.pack += 1;
  e.inv = 0.14;
  e.flash = 0.12;
  e.squash = 0.72;
  e.face = -face;
  addScore(50, e.x, e.y - 10);
  burst(e.x, e.y - 8, 10, WHT, 120, 0.28, 80);
  spark(e.x, e.y - 8, 4, ICE);
  audio.pack();
  hitStop(0.04);
  if (e.pack >= e.hp) fullyPack(e);
  return true;
}

function kickBall(e, face) {
  if (e.dead || !e.packed) return;
  if (e.rolling) {
    if (sign(e.vx) !== face) {
      e.face = face;
      e.vx = face * rollSpd(isStorm());
      e.vy = Math.min(e.vy, -30);
      audio.kick();
      hitStop(0.03);
    }
    return;
  }
  e.rolling = true;
  e.face = face;
  e.vx = face * rollSpd(isStorm());
  e.vy = -46;
  e.grounded = false;
  e.bounce = 0;
  e.rollT = 0;
  addScore(80, e.x, e.y - 8);
  burst(e.x, e.y - 6, 8, ICE, 90, 0.22, 40);
  audio.kick();
  hitStop(0.045);
  kickCam(4);
  stageEl.classList.remove('smash');
  void stageEl.offsetWidth;
  stageEl.classList.add('smash');
  setTimeout(function () { stageEl.classList.remove('smash'); }, 220);
}

function dropLoot(x, y, combo) {
  G.loot.push(makeLoot(x, y, combo));
}

function smashBall(e) {
  var pts;
  if (e.dead) return;
  e.dead = true;
  e.packed = false;
  e.rolling = false;
  bumpCombo();
  pts = crushScore(G.combo) + (e.k === 'boss' ? 2000 : 0);
  addScore(pts, e.x, e.y - 8);
  dropLoot(e.x, e.y - 6, G.combo);
  burst(e.x, e.y - e.r, 26, WHT, 220, 0.5, 200);
  burst(e.x, e.y - e.r, 10, kindRgb(e.k), 160, 0.36, 240);
  spark(e.x, e.y - e.r, 12, GOLD);
  ring(e.x, e.y - e.r, ICE2);
  audio.smash(G.combo);
  hitStop(0.06 + Math.min(0.02, G.combo * 0.004));
  shake(6);
  flash(ICE, 0.1);
}

function crushFoe(ball, e) {
  if (e.dead || e === ball) return;
  if (e.packed && e.rolling) {
    e.face = ball.face;
    e.vx = ball.face * Math.max(Math.abs(e.vx), rollSpd(isStorm()));
    return;
  }
  e.dead = true;
  e.packed = false;
  e.rolling = false;
  bumpCombo();
  addScore(crushScore(G.combo) + (e.k === 'boss' ? 2000 : 0), e.x, e.y - 8);
  dropLoot(e.x, e.y - 6, G.combo);
  ball.crush += 1;
  ball.r = Math.min(ball.k === 'boss' ? 26 : 22, ball.r + 1.4);
  ball.vx = ball.face * (Math.abs(ball.vx) + 18);
  burst(e.x, e.y - 8, 20, WHT, 200, 0.42, 180);
  burst(e.x, e.y - 8, 8, kindRgb(e.k), 150, 0.32, 220);
  spark(e.x, e.y - 8, 8, GOLD);
  ring(e.x, e.y - 8, ICE);
  audio.crush(G.combo);
  hitStop(0.055 + Math.min(0.025, G.combo * 0.005));
  kickCam(5);
  shake(5);
}

function unpack(e) {
  e.packed = false;
  e.rolling = false;
  e.pack = 0;
  e.thaw = 0;
  e.angry = 3.6;
  e.vx = 0;
  e.flash = 0.2;
  e.r = ballR(e.k);
  audio.thaw();
  burst(e.x, e.y - 8, 12, ICE, 100, 0.28, 80);
  toast('挣脱', true, false);
}

/* ---- player ---- */
function tryJump(p) {
  if (p.deadT > 0) return;
  if (!(p.grounded || p.coyote > 0)) return;
  p.vy = -JUMP_V;
  p.grounded = false;
  p.coyote = 0;
  p.state = 'jump';
  p.squash = 0.78;
  p.ride = null;
  G.jumpBuf = 0;
  audio.hop();
  burst(p.x, p.y, 5, ICE, 70, 0.22, 40);
  if (!reduceMotion()) hitStop(0.028);
}

function tryThrow(p) {
  var live, i;
  if (p.deadT > 0 || G.mode !== 'play') return;
  if (p.tossCd > 0) return;
  live = 0;
  for (i = 0; i < G.snow.length; i++) if (!G.snow[i].dead) live++;
  if (live >= MAX_SNOW) return;
  p.toss = 0.14;
  p.tossCd = throwCd(isStorm());
  G.tossBuf = 0;
  G.snow.push(makeSnow(p.x + p.face * 14, p.y - 12, p.face));
  audio.toss();
  burst(p.x + p.face * 14, p.y - 12, 6, WHT, 50, 0.18, 10);
}

function kill(why) {
  var p = G.player;
  if (G.mode !== 'play') return;
  if (p.deadT > 0 || p.inv > 0) return;
  p.deadT = DIE_T;
  p.state = 'dead';
  p.vx = 0;
  p.vy = -120;
  p.grounded = false;
  p.ride = null;
  G.why = why;
  G.lives -= 1;
  renderPips();
  audio.die();
  hitStop(0.08);
  shake(7);
  flash(MAG, 0.22);
  burst(p.x, p.y - 10, 22, MAG, 200, 0.5, 240);
  stageEl.classList.remove('die');
  void stageEl.offsetWidth;
  stageEl.classList.add('die');
  setTimeout(function () { stageEl.classList.remove('die'); }, 360);
}

function respawn() {
  var p = G.player;
  if (G.lives <= 0) {
    audio.over();
    showOver();
    return;
  }
  p.x = G.spawn.x;
  p.y = G.spawn.y;
  p.vx = 0;
  p.vy = 0;
  p.face = 1;
  p.grounded = true;
  p.state = 'idle';
  p.deadT = 0;
  p.inv = INVULN;
  p.squash = 1;
  p.ride = null;
  toast('再起', true, false);
}

function landOnBall(p, prev) {
  var i, e, top;
  for (i = 0; i < G.foes.length; i++) {
    e = G.foes[i];
    if (e.dead || !e.packed) continue;
    if (Math.abs(p.x - e.x) > e.r + 4) continue;
    top = ballTop(e);
    if (prev <= top + 2 && p.y >= top && p.y <= top + 14 && p.vy >= 0) {
      p.y = top;
      p.vy = 0;
      p.grounded = true;
      p.state = 'idle';
      p.squash = 1.12;
      p.ride = e;
      return e;
    }
  }
  return null;
}

function tickPlayer(dt) {
  var p = G.player;
  var want, nx, prev, landed, ride;
  p.squash = lerp(p.squash, 1, 1 - Math.pow(0.0008, dt));
  if (p.inv > 0) p.inv -= dt;
  if (p.toss > 0) p.toss -= dt;
  if (p.tossCd > 0) p.tossCd -= dt;

  if (p.deadT > 0) {
    p.deadT -= dt;
    p.vy = Math.min(MAX_FALL, p.vy + GRAV * dt);
    p.y += p.vy * dt;
    if (p.deadT <= 0) respawn();
    return;
  }

  if (G.mode !== 'play') return;

  want = 0;
  if (keys.l) want -= 1;
  if (keys.r) want += 1;
  if (want !== 0) {
    p.face = want;
    p.vx = want * WALK;
    p.walk += dt * 10;
    p.state = p.grounded ? 'walk' : p.state;
  } else {
    p.vx = 0;
    if (p.grounded) p.state = p.toss > 0 ? 'toss' : 'idle';
  }

  if ((G.jumpBuf > 0 || keys.u) && (p.grounded || p.coyote > 0)) tryJump(p);
  if (keys.toss || G.tossBuf > 0) tryThrow(p);

  ride = p.ride;
  if (ride && (!ride.packed || ride.dead)) {
    p.ride = null;
    ride = null;
  }
  if (ride && ride.rolling) {
    p.x += ride.vx * dt;
    p.inv = Math.max(p.inv, 0.05);
  }

  nx = p.x + p.vx * dt;
  if (nx < PLAY_L + 6) nx = PLAY_L + 6;
  if (nx > PLAY_R - 6) nx = PLAY_R - 6;
  p.x = nx;

  if (p.grounded) {
    p.coyote = COYOTE;
    if (!platAt(G.plats, p.x, p.y, 4) && !(p.ride && p.ride.packed && !p.ride.dead && Math.abs(p.x - p.ride.x) <= p.ride.r + 4)) {
      p.grounded = false;
      p.state = 'fall';
      p.ride = null;
    }
  } else {
    p.coyote = Math.max(0, p.coyote - dt);
    p.vy = Math.min(MAX_FALL, p.vy + GRAV * dt);
    prev = p.y;
    p.y += p.vy * dt;
    if (p.vy > 40 && p.state === 'jump') p.state = 'fall';
    if (p.vy >= 0) {
      landed = landPlat(G.plats, p.x, p.y, prev);
      if (landed) {
        p.y = landed.y;
        p.vy = 0;
        p.grounded = true;
        p.state = 'idle';
        p.squash = 1.18;
        p.ride = null;
        audio.land();
        burst(p.x, p.y, 4, ICE, 40, 0.18, 30);
      } else {
        landOnBall(p, prev);
      }
    } else if (p.y - PH < CEIL_Y) {
      p.vy = 20;
      p.y = CEIL_Y + PH;
    }
    if (p.y > WORLD_H + 10) {
      p.y = CEIL_Y + PH + 4;
      p.vy = Math.min(p.vy, 80);
    }
  }

  if (want !== 0) {
    var ki;
    for (ki = 0; ki < G.foes.length; ki++) {
      if (canKick(p, G.foes[ki])) kickBall(G.foes[ki], p.face);
    }
  }
}

function tickSnow(dt) {
  var i, j, s, e, prev;
  for (i = G.snow.length - 1; i >= 0; i--) {
    s = G.snow[i];
    if (s.dead) {
      G.snow.splice(i, 1);
      continue;
    }
    s.t += dt;
    prev = s.y;
    s.x += s.vx * dt;
    if (s.t > 0.26) {
      s.vy = Math.min(MAX_FALL, s.vy + GRAV * 0.62 * dt);
      s.vx *= Math.pow(0.42, dt);
    }
    s.y += s.vy * dt;
    if (s.x < PLAY_L || s.x > PLAY_R || s.y > WORLD_H + 8 || s.t > s.life) {
      burst(s.x, s.y, 5, WHT, 40, 0.16, 20);
      s.dead = true;
      continue;
    }
    if (s.vy > 20 && landPlat(G.plats, s.x, s.y + s.r, prev + s.r)) {
      burst(s.x, s.y, 5, WHT, 36, 0.14, 10);
      s.dead = true;
      continue;
    }
    for (j = 0; j < G.foes.length; j++) {
      e = G.foes[j];
      if (e.dead) continue;
      if (!snowHitFoe(s, e)) continue;
      if (e.packed) kickBall(e, s.face);
      else packHit(e, s.face);
      burst(s.x, s.y, 8, WHT, 80, 0.2, 30);
      s.dead = true;
      break;
    }
  }
}

function integrateBall(e, dt) {
  var prev, landed, spd;
  e.spin += e.vx * dt * 0.12;
  e.rollT += dt;
  prev = e.y;
  e.x += e.vx * dt;
  e.vy = Math.min(MAX_FALL, e.vy + GRAV * dt);
  e.y += e.vy * dt;
  if (e.vy >= 0) {
    landed = landPlat(G.plats, e.x, e.y, prev);
    if (landed) {
      e.y = landed.y;
      e.vy = 0;
      e.grounded = true;
      if (Math.random() < 0.35) burst(e.x, e.y, 1, WHT, 30, 0.12, 10);
    }
  }
  if (e.x - e.r < PLAY_L) {
    e.x = PLAY_L + e.r;
    e.bounce += 1;
    e.face = 1;
    e.vx = Math.abs(e.vx) * 0.78;
    audio.bounce();
    burst(e.x, e.y - e.r, 8, ICE, 80, 0.18, 40);
    if (e.bounce >= 3 || Math.abs(e.vx) < 92 || e.rollT > 3.4) smashBall(e);
  } else if (e.x + e.r > PLAY_R) {
    e.x = PLAY_R - e.r;
    e.bounce += 1;
    e.face = -1;
    e.vx = -Math.abs(e.vx) * 0.78;
    audio.bounce();
    burst(e.x, e.y - e.r, 8, ICE, 80, 0.18, 40);
    if (e.bounce >= 3 || Math.abs(e.vx) < 92 || e.rollT > 3.4) smashBall(e);
  }
  spd = Math.abs(e.vx);
  if (e.grounded && spd < 70 && e.rollT > 0.45) smashBall(e);
  if (e.rollT > 4.2) smashBall(e);
  if (e.y > WORLD_H + 20) smashBall(e);
}

function tickFoes(dt) {
  var i, j, e, o, mul, wantHop, prev, landed;
  mul = G.hurry ? 1.35 : 1;
  for (i = 0; i < G.foes.length; i++) {
    e = G.foes[i];
    if (e.dead) continue;
    e.squash = lerp(e.squash, 1, 1 - Math.pow(0.0008, dt));
    if (e.inv > 0) e.inv -= dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.angry > 0) e.angry -= dt;

    if (e.packed) {
      if (e.rolling) {
        integrateBall(e, dt);
        if (e.dead) continue;
        for (j = 0; j < G.foes.length; j++) {
          o = G.foes[j];
          if (o.dead || o === e) continue;
          if (e.packed && o.packed) {
            if (ballsHit(e, o)) crushFoe(e, o);
          } else if (bodyHit(e.x, e.y, o) || snowHitFoe({ x: e.x, y: e.y - e.r, r: e.r }, o)) {
            crushFoe(e, o);
          }
        }
      } else {
        e.thaw -= dt;
        if (e.thaw <= 0) unpack(e);
        if (!e.grounded) {
          e.vy = Math.min(MAX_FALL, e.vy + GRAV * dt);
          prev = e.y;
          e.y += e.vy * dt;
          landed = landPlat(G.plats, e.x, e.y, prev);
          if (landed) {
            e.y = landed.y;
            e.vy = 0;
            e.grounded = true;
          }
        } else if (!platAt(G.plats, e.x, e.y, 4)) {
          e.grounded = false;
        }
      }
      continue;
    }

    if (G.mode === 'over') continue;

    if (e.k === 'flyer') {
      e.ph += dt * 2.2;
      e.y = e.baseY + Math.sin(e.ph) * 16;
      e.x += e.face * e.spd * mul * (e.angry > 0 ? 1.4 : 1) * dt;
      if (e.x < PLAY_L + 18) { e.x = PLAY_L + 18; e.face = 1; }
      if (e.x > PLAY_R - 18) { e.x = PLAY_R - 18; e.face = -1; }
      e.walk += dt * 8;
      continue;
    }

    e.walk += dt * 7;
    e.hopCd -= dt;
    wantHop = e.k === 'hopper' || e.k === 'boss';
    if (e.grounded) {
      if (onEdge(G.plats, e.x, e.y, e.face)) e.face *= -1;
      e.x += e.face * e.spd * mul * (e.angry > 0 ? 1.45 : 1) * dt;
      if (e.x < PLAY_L + 10) { e.x = PLAY_L + 10; e.face = 1; }
      if (e.x > PLAY_R - 10) { e.x = PLAY_R - 10; e.face = -1; }
      if (!platAt(G.plats, e.x, e.y, 4)) e.grounded = false;
      if (wantHop && e.hopCd <= 0) {
        e.vy = e.k === 'boss' ? -JUMP_V * 0.48 : -JUMP_V * 0.58;
        e.grounded = false;
        e.hopCd = e.k === 'boss' ? rand(1.4, 2.4) : rand(0.7, 1.5);
      }
    } else {
      e.vy = Math.min(MAX_FALL, e.vy + GRAV * dt);
      prev = e.y;
      e.y += e.vy * dt;
      e.x += e.face * e.spd * 0.45 * dt;
      landed = landPlat(G.plats, e.x, e.y, prev);
      if (landed) {
        e.y = landed.y;
        e.vy = 0;
        e.grounded = true;
      }
      if (e.y > WORLD_H + 8) {
        e.y = FLOOR_Y;
        e.vy = 0;
        e.grounded = true;
      }
    }
  }
}

function tickLoot(dt) {
  var i, o, p, landed, prev;
  p = G.player;
  for (i = G.loot.length - 1; i >= 0; i--) {
    o = G.loot[i];
    o.t += dt;
    if (!o.grounded) {
      prev = o.y;
      o.vy = Math.min(MAX_FALL, o.vy + GRAV * dt);
      o.y += o.vy * dt;
      landed = landPlat(G.plats, o.x, o.y, prev);
      if (landed) {
        o.y = landed.y;
        o.vy = 0;
        o.grounded = true;
      }
    }
    if (G.mode === 'play' && p.deadT <= 0 && Math.abs(p.x - o.x) < 14 && Math.abs(p.y - o.y) < 18) {
      addScore(o.val, o.x, o.y);
      floatText(o.x, o.y - 20, o.name, o.rgb);
      burst(o.x, o.y - 6, 8, o.rgb, 80, 0.24, 40);
      audio.loot();
      hitStop(0.03);
      G.loot.splice(i, 1);
      continue;
    }
    if (o.t > 8.5) G.loot.splice(i, 1);
  }
}

function tickHurt() {
  var p = G.player;
  var i, e;
  if (G.mode !== 'play' || p.deadT > 0 || p.inv > 0) return;
  for (i = 0; i < G.foes.length; i++) {
    e = G.foes[i];
    if (e.dead) continue;
    if (e.packed) continue;
    if (bodyHit(p.x, p.y, e)) {
      kill('nick');
      return;
    }
  }
}

/* ---- autoplay ---- */
function clearAutoKeys() {
  keys.l = false;
  keys.r = false;
  keys.u = false;
  keys.toss = false;
}

function autoSameY(a, b) {
  return Math.abs(a - b) <= 16;
}

function autoKickDir(ball) {
  var i, o, left = 0, right = 0;
  for (i = 0; i < G.foes.length; i++) {
    o = G.foes[i];
    if (o.dead || o === ball || (o.packed && o.rolling)) continue;
    if (Math.abs(o.y - ball.y) > 48) continue;
    if (o.x < ball.x) left += 1;
    else right += 1;
  }
  if (left === 0 && right === 0) return ball.x < WORLD_W * 0.5 ? 1 : -1;
  return right >= left ? 1 : -1;
}

function autoPickTarget(p) {
  var i, e, best = null, bestS = 1e9, score, dy, dx;
  for (i = 0; i < G.foes.length; i++) {
    e = G.foes[i];
    if (e.dead) continue;
    dx = Math.abs(e.x - p.x);
    dy = Math.abs(e.y - p.y);
    score = dx + dy * 1.7;
    if (e.packed && e.rolling) score += 90;
    else if (e.packed) {
      score -= 140;
      if (e.thaw < 1.5) score -= 80;
      if (autoSameY(p.y, e.y)) score -= 50;
    } else {
      score -= e.pack * 10;
      if (e.k === 'boss') score -= 24;
      if (e.angry > 0) score -= 16;
      if (autoSameY(p.y, e.y)) score -= 36;
      if (e.k === 'flyer' && dy < 50) score -= 18;
    }
    if (score < bestS) {
      bestS = score;
      best = e;
    }
  }
  return best;
}

function autoNearestLoot(p) {
  var i, o, best = null, d, bestD = 1e9;
  for (i = 0; i < G.loot.length; i++) {
    o = G.loot[i];
    d = Math.abs(o.x - p.x) + Math.abs(o.y - p.y);
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  }
  return best;
}

function autoDanger(p) {
  var i, e, d, best = null, bestD = 40;
  for (i = 0; i < G.foes.length; i++) {
    e = G.foes[i];
    if (e.dead || e.packed) continue;
    if (e.k === 'flyer') {
      if (Math.abs(p.y - e.y) > 26) continue;
    } else if (!autoSameY(p.y, e.y)) continue;
    d = Math.abs(p.x - e.x);
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
}

function autoPlatGap(a, b) {
  if (b.x > a.x + a.w) return b.x - (a.x + a.w);
  if (a.x > b.x + b.w) return a.x - (b.x + b.w);
  return 0;
}

function autoNav(p, destX, destY) {
  var here = platAt(G.plats, p.x, p.y, 5);
  var hy = here ? here.y : p.y;
  var destPlat = platAt(G.plats, destX, destY, 8);
  var i, pl, best, bestS, jx, gap, jump = false, tx = destX, dir;

  if (Math.abs(hy - destY) <= 14) {
    if (here && destPlat && destPlat !== here) {
      gap = autoPlatGap(here, destPlat);
      if (gap > 72) {
        tx = destX > p.x ? here.x + here.w + 10 : here.x - 10;
      } else {
        tx = destX;
        dir = destX > p.x ? 1 : -1;
        if (onEdge(G.plats, p.x, p.y, dir)) jump = true;
      }
    }
    return { tx: tx, jump: jump };
  }

  if (destY < hy - 10) {
    best = null;
    bestS = 1e9;
    for (i = 0; i < G.plats.length; i++) {
      pl = G.plats[i];
      if (pl.y >= hy - 10) continue;
      if (hy - pl.y > 76) continue;
      jx = clamp(p.x, pl.x + 12, pl.x + pl.w - 12);
      gap = Math.abs(pl.y - destY) + Math.abs(jx - p.x) * 0.2;
      if (destPlat && Math.abs(pl.y - destPlat.y) < 8) gap -= 30;
      if (xOnPlat(pl, destX, 6)) gap -= 22;
      if (xOnPlat(pl, p.x, 4)) gap -= 12;
      if (gap < bestS) {
        bestS = gap;
        best = pl;
      }
    }
    if (best) {
      jx = clamp(p.x, best.x + 10, best.x + best.w - 10);
      if (xOnPlat(best, p.x, 6)) {
        jump = true;
        tx = clamp(destX, best.x + 8, best.x + best.w - 8);
      } else {
        tx = jx;
        if (Math.abs(p.x - jx) < 24) jump = true;
      }
    }
    return { tx: tx, jump: jump };
  }

  if (here && here.y < FLOOR_Y - 4) {
    if (xOnPlat(here, destX, 8)) {
      tx = (here.x + here.w - p.x) <= (p.x - here.x) ? here.x + here.w + 10 : here.x - 10;
    } else {
      tx = destX > here.x + here.w * 0.5 ? here.x + here.w + 10 : here.x - 10;
    }
  }
  return { tx: tx, jump: false };
}

function autoSteer(p, tx) {
  if (tx < p.x - 4) keys.l = true;
  else if (tx > p.x + 4) keys.r = true;
}

function autoFace(p, x) {
  if (x < p.x - 2) keys.l = true;
  else if (x > p.x + 2) keys.r = true;
}

function tickAuto() {
  var p = G.player;
  var t, nav, danger, loot, dx, adx, dy, dir, kdir, standX, toss = false, jump = false;
  var liveSnow, i;

  clearAutoKeys();
  if (!autoOn || G.mode !== 'play') return;
  if (p.deadT > 0 || p.state === 'dead') return;

  if (Math.abs(p.x - autoLastX) < 1.6 && Math.abs(p.y - autoLastY) < 1.6) autoStuck += STEP;
  else autoStuck = 0;
  autoLastX = p.x;
  autoLastY = p.y;

  t = autoPickTarget(p);
  danger = p.inv > 0.12 ? null : autoDanger(p);

  if (danger && Math.abs(p.x - danger.x) < 34) {
    jump = true;
    dir = p.x < danger.x ? -1 : 1;
    if (Math.abs(p.x - danger.x) < 18) {
      autoSteer(p, p.x + dir * 40);
    } else if (p.face === (danger.x >= p.x ? 1 : -1)) {
      toss = true;
    } else {
      autoFace(p, danger.x);
    }
    if (jump) G.jumpBuf = BUFFER;
    if (toss) {
      keys.toss = true;
      G.tossBuf = BUFFER;
    }
    if (autoStuck > 0.7) autoSteer(p, p.x + autoWalkDir * 50);
    return;
  }

  if (!t) {
    loot = autoNearestLoot(p);
    if (loot) {
      nav = autoNav(p, loot.x, loot.y);
      autoSteer(p, nav.tx);
      if (nav.jump) G.jumpBuf = BUFFER;
    } else if (autoStuck > 0.4) {
      G.jumpBuf = BUFFER;
      autoSteer(p, p.x + autoWalkDir * 80);
    }
    return;
  }

  dx = t.x - p.x;
  adx = Math.abs(dx);
  dy = t.y - p.y;
  dir = dx >= 0 ? 1 : -1;

  if (t.packed && !t.rolling) {
    kdir = autoKickDir(t);
    standX = t.x - kdir * (t.r + 16);
    if (autoSameY(p.y, t.y) && (canKick(p, t) || adx < 28)) {
      autoSteer(p, t.x + kdir * 20);
    } else {
      nav = autoNav(p, standX, t.y);
      autoSteer(p, nav.tx);
      if (nav.jump) jump = true;
    }
    if (adx < 78 && (p.face === kdir || p.face === dir)) toss = true;
  } else if (t.packed && t.rolling && autoSameY(p.y, t.y) && adx < 36 && sign(t.vx) !== dir) {
    autoSteer(p, t.x);
  } else {
    nav = autoNav(p, t.x, t.y);
    if (t.k === 'flyer' && t.y < p.y - 18 && adx < 64) jump = true;
    if (!autoSameY(p.y, t.y) && dy < -20 && dy > -80 && adx < 70) jump = true;

    if (autoSameY(p.y, t.y) || (t.k === 'flyer' && Math.abs(p.y - t.y) < 52)) {
      if (!t.packed && adx < 32) {
        jump = true;
        autoSteer(p, t.x + dir * 46);
        if (p.face === dir) toss = true;
      } else if (!t.packed && adx < 86) {
        if (p.face !== dir) autoFace(p, t.x);
        else {
          toss = true;
          if (adx > 62) autoSteer(p, t.x);
        }
      } else {
        autoSteer(p, nav.tx);
        if (p.face === dir && adx < 110) toss = true;
      }
    } else {
      autoSteer(p, nav.tx);
      if (p.face === dir && adx < 96 && Math.abs(dy) < 70) toss = true;
    }
    if (nav.jump) jump = true;
  }

  liveSnow = 0;
  for (i = 0; i < G.snow.length; i++) if (!G.snow[i].dead) liveSnow += 1;
  if (toss && liveSnow < MAX_SNOW) {
    keys.toss = true;
    G.tossBuf = BUFFER;
  }
  if (jump || autoStuck > 0.55) G.jumpBuf = BUFFER;
  if (autoStuck > 1.15) {
    autoWalkDir *= -1;
    autoSteer(p, p.x + autoWalkDir * 90);
    autoStuck = 0.4;
  }
}

function tickAutoFlow(dt) {
  if (!autoOn) return;
  if (G.mode === 'title') {
    autoOvWait += dt;
    if (autoOvWait >= (autoSpeed >= 3 ? 0.25 : 0.5)) {
      autoOvWait = 0;
      startRun('rooms');
    }
    return;
  }
  if (G.mode === 'over') {
    autoOvWait += dt;
    if (autoOvWait >= (autoSpeed >= 3 ? 0.7 : 1.15)) {
      autoOvWait = 0;
      startRun(G.kind || 'rooms');
    }
  }
}

function autoScale() {
  if (!autoOn || G.mode !== 'play') return 1;
  return AUTO_SCALE[autoSpeed] || 1;
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
  autoOvWait = 0;
  autoStuck = 0;
  clearAutoKeys();
  G.jumpBuf = 0;
  G.tossBuf = 0;
  syncAutoUi();
  if (autoOn) {
    audio.ensure();
    if (G.mode === 'title') startRun('rooms');
    else if (G.mode === 'over') startRun(G.kind || 'rooms');
  } else if (G.mode === 'title') {
    hintEl.textContent = '扔雪裹怪 · 踢雪球碾过去 · 可踩在雪球上 · A 自动 · 碰到没裹住的怪丢命';
  }
  if (G.mode === 'play') {
    hudPlay();
    hintEl.textContent = autoOn ? '托管中 · 扔雪裹怪 · 踢雪球 · A 停下' : '扔雪裹怪 · 踢雪球碾过去 · 可踩在雪球上 · A 自动 · 碰到没裹住的怪丢命';
  }
}

function setAutoSpeed(n) {
  n = parseInt(n, 10);
  if (!isFinite(n) || n < 1 || n > 4) n = 3;
  autoSpeed = n;
  saveAutoSpeed(autoSpeed);
  syncSpeedUi();
}

function isAutoKey(e) {
  return e.code === 'KeyA' || e.key === 'a' || e.key === 'A';
}

function tick(dt) {
  var i;
  G.clock += dt;
  if (G.jumpBuf > 0) G.jumpBuf -= dt;
  if (G.tossBuf > 0) G.tossBuf -= dt;
  if (autoOn) tickAutoFlow(dt);
  if (G.combo > 0) {
    G.comboAge += dt;
    for (i = 0; i < G.foes.length; i++) {
      if (!G.foes[i].dead && G.foes[i].packed && G.foes[i].rolling) {
        G.comboAge = Math.min(G.comboAge, COMBO_WIN * 0.45);
        break;
      }
    }
    if (G.comboAge > COMBO_WIN) {
      G.combo = 0;
      G.comboAge = 0;
      comboEl.textContent = '×1';
      comboBox.classList.remove('hot');
    }
  }

  tickFx(dt);
  if (autoOn && G.mode === 'play') tickAuto();
  tickPlayer(dt);
  tickSnow(dt);
  tickFoes(dt);
  tickLoot(dt);
  tickHurt();

  if (G.mode !== 'play') return;

  G.roomT += dt;
  if (!G.hurry && G.roomT > HURRY_T && G.clearT <= 0) {
    G.hurry = true;
    toast('快！', true, false);
    audio.hurry();
  }

  if (G.clearT > 0) {
    G.clearT -= dt;
    if (G.clearT <= 0) nextRoom();
    return;
  }
  if (roomClear(G.foes) && G.player.deadT <= 0) {
    G.clearT = 0.95;
    addScore(1000 + G.round * 200, WORLD_W * 0.5, 70);
    toast('清场', false, true);
    audio.clear();
    flash(GOLD, 0.16);
    kickCam(5);
    stageEl.classList.remove('clear');
    void stageEl.offsetWidth;
    stageEl.classList.add('clear');
    setTimeout(function () { stageEl.classList.remove('clear'); }, 300);
  }
}

/* ---- draw ---- */
function sx(x) { return L.x + x * L.s; }
function sy(y) { return L.y + y * L.s; }

function resize() {
  var r = stageEl.getBoundingClientRect();
  var sxv, syv;
  cssW = Math.max(1, r.width);
  cssH = Math.max(1, r.height);
  dpr = Math.min(2.5, window.devicePixelRatio || 1);
  canvas.width = (cssW * dpr) | 0;
  canvas.height = (cssH * dpr) | 0;
  sxv = cssW / WORLD_W;
  syv = cssH / WORLD_H;
  L.s = Math.min(sxv, syv);
  L.x = (cssW - WORLD_W * L.s) / 2;
  L.y = (cssH - WORLD_H * L.s) / 2;
}

function roundRect(x, y, w, h, r) {
  var rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawBg() {
  var g, i, o;
  g = ctx.createLinearGradient(0, L.y, 0, L.y + WORLD_H * L.s);
  g.addColorStop(0, '#07101c');
  g.addColorStop(0.55, '#050814');
  g.addColorStop(1, '#080616');
  ctx.fillStyle = '#03010a';
  ctx.fillRect(-L.x, -L.y, cssW, cssH);
  ctx.fillStyle = g;
  ctx.fillRect(sx(0), sy(0), WORLD_W * L.s, WORLD_H * L.s);

  ctx.fillStyle = 'rgba(8, 28, 48, 0.7)';
  ctx.beginPath();
  ctx.moveTo(sx(0), sy(140));
  ctx.lineTo(sx(70), sy(88));
  ctx.lineTo(sx(130), sy(128));
  ctx.lineTo(sx(210), sy(70));
  ctx.lineTo(sx(290), sy(118));
  ctx.lineTo(sx(360), sy(64));
  ctx.lineTo(sx(480), sy(120));
  ctx.lineTo(sx(480), sy(0));
  ctx.lineTo(sx(0), sy(0));
  ctx.fill();

  ctx.fillStyle = rgba(ICE, 0.12);
  roundRect(sx(2), sy(2), 12 * L.s, (WORLD_H - 4) * L.s, 3 * L.s);
  ctx.fill();
  roundRect(sx(WORLD_W - 14), sy(2), 12 * L.s, (WORLD_H - 4) * L.s, 3 * L.s);
  ctx.fill();

  ctx.fillStyle = rgba(WHT, 0.28);
  for (i = 0; i < flakes.length; i++) {
    o = flakes[i];
    ctx.globalAlpha = 0.18 + o.s * 0.12;
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), o.s * L.s, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPlat(p) {
  var x = sx(p.x);
  var y = sy(p.y);
  var w = p.w * L.s;
  var h = Math.max(8, p.h * L.s);
  ctx.fillStyle = '#0a3a58';
  roundRect(x, y, w, h, 3 * L.s);
  ctx.fill();
  ctx.fillStyle = rgba(ICE, 0.95);
  roundRect(x, y, w, 3.2 * L.s, 2 * L.s);
  ctx.fill();
  ctx.fillStyle = rgba(ICE2, 0.45);
  ctx.fillRect(x + 4 * L.s, y + 0.6 * L.s, Math.max(8, w * 0.22), 1.4 * L.s);
}

function drawSnowman(x, y, face, squash, toss, blink, dead, inv) {
  var s = L.s;
  ctx.save();
  ctx.translate(sx(x), sy(y));
  ctx.scale(face * s, s);
  ctx.scale(2 - squash, squash);
  if (inv && Math.floor(G.clock * 16) % 2 === 0) ctx.globalAlpha = 0.45;
  if (dead) ctx.rotate(0.5);

  ctx.fillStyle = rgba(ICE, 0.35);
  ctx.beginPath();
  ctx.ellipse(0, -1, 9, 3.2, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#eaf6ff';
  ctx.beginPath();
  ctx.ellipse(0, -7, 7.2, 6.4, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -16.2, 5.3, 0, TAU);
  ctx.fill();

  ctx.fillStyle = rgba(ICE2, 0.55);
  ctx.beginPath();
  ctx.arc(-2.4, -18.4, 1.6, 0, TAU);
  ctx.fill();

  ctx.fillStyle = MAG;
  roundRect(-5.4, -12.4, 10.8, 2.1, 1);
  ctx.fill();
  ctx.fillRect(4.2, -12.2, 2.4, 5.4);

  ctx.fillStyle = MAG;
  ctx.beginPath();
  ctx.arc(0, -7.2, 0.7, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -4.6, 0.7, 0, TAU);
  ctx.fill();

  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(4.6, -16);
  ctx.lineTo(8.4, -15.2);
  ctx.lineTo(4.6, -14.4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(2.4, -17.2, blink ? 0.3 : 1.15, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(2.7, -17.5, 0.4, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = '#7aa0b8';
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (toss) {
    ctx.moveTo(5.2, -9);
    ctx.lineTo(11.5, -11.5);
  } else {
    ctx.moveTo(-6.4, -8.5);
    ctx.lineTo(-10.2, -5.5);
    ctx.moveTo(6.2, -8.5);
    ctx.lineTo(10.4, -6);
  }
  ctx.stroke();

  ctx.restore();
}

function drawPacked(e) {
  var s = L.s;
  var shakeX = (!e.rolling && e.thaw < 1.15) ? Math.sin(G.clock * 40) * 1.4 : 0;
  ctx.save();
  ctx.translate(sx(e.x + shakeX), sy(e.y - e.r));
  ctx.rotate(e.spin);
  ctx.scale(s * (2 - e.squash), s * e.squash);

  ctx.fillStyle = rgba(ICE, 0.28);
  ctx.beginPath();
  ctx.arc(0, 0, e.r + 3, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e8f4ff';
  ctx.beginPath();
  ctx.arc(0, 0, e.r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba(ICE2, 0.85);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = rgba(WHT, 0.7);
  ctx.beginPath();
  ctx.arc(-e.r * 0.32, -e.r * 0.34, e.r * 0.28, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(-e.r * 0.28, -e.r * 0.12, 1.3, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(e.r * 0.28, -e.r * 0.12, 1.3, 0, TAU);
  ctx.fill();
  ctx.fillStyle = kindRgb(e.k);
  ctx.beginPath();
  ctx.ellipse(0, e.r * 0.22, e.r * 0.28, e.r * 0.12, 0, 0, TAU);
  ctx.fill();

  if (!e.rolling && e.thaw > 0) {
    ctx.restore();
    ctx.save();
    ctx.translate(sx(e.x + shakeX), sy(e.y - e.r * 2 - 6));
    ctx.fillStyle = 'rgba(8,6,18,0.55)';
    roundRect(-10 * L.s, -3 * L.s, 20 * L.s, 3.4 * L.s, 2 * L.s);
    ctx.fill();
    ctx.fillStyle = e.thaw < 1.2 ? rgba(MAG, 0.95) : rgba(ICE, 0.95);
    roundRect(-10 * L.s, -3 * L.s, 20 * L.s * clamp(e.thaw / THAW_T, 0, 1), 3.4 * L.s, 2 * L.s);
    ctx.fill();
  }
  ctx.restore();
}

function drawFoe(e) {
  var s, rgb, blink, packA;
  if (e.dead) return;
  if (e.packed) {
    drawPacked(e);
    return;
  }
  s = L.s;
  rgb = e.angry > 0 ? MAG : kindRgb(e.k);
  blink = Math.floor(G.clock * 2.4 + e.walk) % 17 === 0;
  ctx.save();
  ctx.translate(sx(e.x), sy(e.y));
  ctx.scale(e.face * s, s);
  ctx.scale(2 - e.squash, e.squash);
  if (e.flash > 0) ctx.globalAlpha = 0.7 + Math.sin(G.clock * 40) * 0.3;

  ctx.fillStyle = rgba(rgb, 0.28);
  ctx.beginPath();
  ctx.ellipse(0, -1, e.w * 0.7, 2.6, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = rgba(rgb, 1);
  if (e.k === 'flyer') {
    ctx.beginPath();
    ctx.ellipse(-8, -10, 6.2, 2.4, -0.4, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, -10, 6.2, 2.4, 0.4, 0, TAU);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(0, -e.h * 0.5, e.w * 0.55, e.h * 0.5, 0, 0, TAU);
  ctx.fill();
  if (e.k === 'boss') {
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(-8, -e.h);
    ctx.lineTo(-4, -e.h - 8);
    ctx.lineTo(-1, -e.h + 1);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, -e.h);
    ctx.lineTo(4, -e.h - 8);
    ctx.lineTo(1, -e.h + 1);
    ctx.fill();
  }
  if (e.k === 'hopper') {
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.ellipse(-3.2, -e.h - 2, 1.6, 4.2, -0.2, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(3.2, -e.h - 2, 1.6, 4.2, 0.2, 0, TAU);
    ctx.fill();
  }

  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(2.2, -e.h * 0.62, blink ? 0.3 : 1.25, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(2.5, -e.h * 0.66, 0.4, 0, TAU);
  ctx.fill();

  packA = e.hp > 0 ? e.pack / e.hp : 0;
  if (packA > 0) {
    ctx.fillStyle = rgba(WHT, 0.35 + packA * 0.5);
    ctx.beginPath();
    ctx.ellipse(0, -e.h * 0.35, e.w * 0.5 * packA, e.h * 0.42 * packA, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(ICE2, 0.7);
    ctx.lineWidth = 0.9;
    ctx.stroke();
  }
  ctx.restore();
}

function drawSnowball(s) {
  if (s.dead) return;
  ctx.save();
  ctx.translate(sx(s.x), sy(s.y));
  ctx.scale(L.s, L.s);
  ctx.fillStyle = rgba(ICE, 0.35);
  ctx.beginPath();
  ctx.arc(0, 0, s.r + 2.4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#eaf6ff';
  ctx.beginPath();
  ctx.arc(0, 0, s.r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(WHT, 0.8);
  ctx.beginPath();
  ctx.arc(-1.4, -1.6, 1.6, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawLoot(o) {
  var bob = Math.sin(o.t * 6) * 2;
  ctx.save();
  ctx.translate(sx(o.x), sy(o.y - 8 + bob));
  ctx.scale(L.s, L.s);
  ctx.fillStyle = rgba(o.rgb, 0.95);
  ctx.beginPath();
  ctx.arc(0, 0, 5.2, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba(WHT, 0.8);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#05030c';
  ctx.font = 'bold 7px "Segoe UI","PingFang SC",sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(o.i === 4 ? '福' : '雪', 0, 0.5);
  ctx.restore();
}

function drawPlayer() {
  var p = G.player;
  var blink = Math.floor(G.clock * 2.2) % 19 === 0;
  drawSnowman(p.x, p.y, p.face, p.squash, p.toss > 0, blink, p.deadT > 0, p.inv > 0 && p.deadT <= 0);
}

function drawFx() {
  var i, o, a;
  for (i = 0; i < rings.length; i++) {
    o = rings[i];
    a = 1 - o.t / 0.36;
    ctx.strokeStyle = rgba(o.rgb, a * 0.8);
    ctx.lineWidth = 2 * L.s;
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), o.r * L.s, 0, TAU);
    ctx.stroke();
  }
  for (i = 0; i < particles.length; i++) {
    o = particles[i];
    a = clamp(o.t / o.max, 0, 1);
    ctx.fillStyle = rgba(o.rgb, a);
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), o.r * L.s, 0, TAU);
    ctx.fill();
  }
  for (i = 0; i < sparks.length; i++) {
    o = sparks[i];
    ctx.strokeStyle = rgba(o.rgb, clamp(o.t / 0.22, 0, 1));
    ctx.lineWidth = 1.2 * L.s;
    ctx.beginPath();
    ctx.moveTo(sx(o.x), sy(o.y));
    ctx.lineTo(sx(o.x - o.vx * 0.03), sy(o.y - o.vy * 0.03));
    ctx.stroke();
  }
  ctx.font = 'bold ' + (10 * L.s) + 'px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (i = 0; i < floats.length; i++) {
    o = floats[i];
    a = 1 - o.t / 0.7;
    ctx.fillStyle = rgba(o.rgb, a);
    ctx.fillText(o.text, sx(o.x), sy(o.y));
  }
}

function drawFlash() {
  if (G.flash <= 0) return;
  ctx.fillStyle = rgba(G.flashRgb, clamp(G.flash * 2.2, 0, 0.28));
  ctx.fillRect(0, 0, cssW, cssH);
}

function drawRoomName() {
  if (G.mode !== 'play' || G.roomT > 1.6) return;
  var a = G.roomT < 0.2 ? G.roomT / 0.2 : (G.roomT > 1.2 ? (1.6 - G.roomT) / 0.4 : 1);
  ctx.globalAlpha = clamp(a, 0, 1);
  ctx.fillStyle = rgba(ICE2, 0.95);
  ctx.font = 'bold ' + (16 * L.s) + 'px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(G.roomName, sx(WORLD_W * 0.5), sy(48));
  ctx.globalAlpha = 1;
}

function draw() {
  var i, shx, shy;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  shx = (G.shake ? (Math.random() - 0.5) * G.shake : 0) + G.kickX;
  shy = (G.shake ? (Math.random() - 0.5) * G.shake * 0.6 : 0) + G.kickY;
  ctx.translate(shx, shy);
  drawBg();
  for (i = 0; i < G.plats.length; i++) drawPlat(G.plats[i]);
  for (i = 0; i < G.loot.length; i++) drawLoot(G.loot[i]);
  for (i = 0; i < G.foes.length; i++) drawFoe(G.foes[i]);
  for (i = 0; i < G.snow.length; i++) drawSnowball(G.snow[i]);
  drawPlayer();
  drawFx();
  drawRoomName();
  drawFlash();
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
      if (autoOn && G.mode !== 'play') tickAutoFlow(dt);
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
bindPad(btnJump, function (v) {
  keys.u = v;
  if (v) G.jumpBuf = BUFFER;
});
bindPad(btnThrow, function (v) {
  keys.toss = v;
  if (v) G.tossBuf = BUFFER;
});

function keyOn(e, down) {
  var k = e.code;
  if (k === 'ArrowLeft') { keys.l = down; e.preventDefault(); }
  else if (k === 'ArrowRight' || k === 'KeyD') { keys.r = down; e.preventDefault(); }
  else if (k === 'ArrowUp' || k === 'KeyW') {
    keys.u = down;
    if (down) G.jumpBuf = BUFFER;
    e.preventDefault();
  } else if (k === 'Space' || e.key === ' ') {
    keys.toss = down;
    if (down) G.tossBuf = BUFFER;
    e.preventDefault();
  }
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
    if (e.code === 'KeyR' || e.code === 'KeyM') { e.preventDefault(); return; }
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
    if (e.code === 'Digit1' || e.code === 'Enter' || e.code === 'Space' || e.key === ' ') {
      startRun('rooms');
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      startRun('avalanche');
      e.preventDefault();
      return;
    }
  }
  if (G.mode === 'over') {
    if (e.code === 'Enter' || e.code === 'Space' || e.key === ' ' || e.code === 'Digit1') {
      startRun(G.kind);
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      showTitle();
      e.preventDefault();
      return;
    }
  }
  if (autoOn) {
    if (
      e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'ArrowUp' ||
      e.code === 'ArrowDown' || e.code === 'Space' || e.code === 'KeyD' ||
      e.code === 'KeyS' || e.code === 'KeyW' || e.key === ' '
    ) {
      e.preventDefault();
    }
    return;
  }
  keyOn(e, true);
}, true);

window.addEventListener('keyup', function (e) {
  if (isAutoKey(e)) {
    e.preventDefault();
    return;
  }
  if (autoOn) return;
  keyOn(e, false);
}, true);

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
btnRooms.addEventListener('click', function () {
  audio.ensure();
  startRun('rooms');
});
btnAvalanche.addEventListener('click', function () {
  audio.ensure();
  startRun('avalanche');
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

canvas.addEventListener('pointerdown', function (ev) {
  audio.ensure();
  canvas.focus({ preventScroll: true });
  ev.preventDefault();
});
canvas.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });

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

bestEl.textContent = String(G.bestR);
renderPips();
syncAutoUi();
syncSpeedUi();
showTitle();
resize();
hudPlay();
requestAnimationFrame(frame);

}
