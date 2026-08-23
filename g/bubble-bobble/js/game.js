'use strict';

/* 泡龙2 — Bubble Bobble remake. Ricochet trap + jump-burst. No CDN. */

var WORLD_W = 480;
var WORLD_H = 360;
var PLAY_L = 16;
var PLAY_R = 464;
var FLOOR_Y = 338;
var CEIL_Y = 16;
var LIVES = 3;
var PW = 12;
var PH = 20;
var WALK = 118;
var JUMP_V = 368;
var BOUNCE_JUMP = 348;
var GRAV = 980;
var MAX_FALL = 440;
var COYOTE = 0.09;
var BUFFER = 0.12;
var BLOW_CD = 0.30;
var BLOW_T = 0.12;
var BUB_R = 11;
var BUB_SHOT = 228;
var BUB_LIFE = 7.2;
var BOUNCE_T = 0.98;
var REST = 0.9;
var HANG_T = 5.0;
var INVULN = 1.5;
var DIE_T = 0.7;
var COMBO_WIN = 1.55;
var MAX_BUB = 8;
var SHOTS = 8;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var HURRY_ROOMS = 36;
var HURRY_CORE = 28;
var BEST_KEY = 'playbox-bubble-bobble-best';
var MUTE_KEY = 'playbox-bubble-bobble-mute';

var CYN = [0, 240, 255];
var TEAL = [42, 240, 228];
var MAG = [255, 61, 184];
var GOLD = [255, 227, 107];
var HOT = [255, 196, 74];
var LIME = [125, 255, 74];
var ORG = [255, 106, 40];
var PUR = [155, 92, 255];
var WHT = [246, 243, 255];
var BLU = [74, 180, 255];

var FRUIT_NAME = ['樱桃', '草莓', '柠檬', '蜜瓜', '星核'];
var FRUIT_VAL = [100, 200, 400, 800, 1600];
var FRUIT_RGB = [MAG, ORG, GOLD, TEAL, PUR];

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
    name: '浅池',
    plats: [FLOOR, plat(28, 282, 140), plat(312, 282, 140), plat(150, 214, 180)],
    foes: [
      { k: 'walker', x: 250, y: FLOOR_Y },
      { k: 'walker', x: 380, y: 282 }
    ]
  },
  {
    name: '回廊',
    plats: [FLOOR, plat(20, 282, 170), plat(290, 226, 170), plat(80, 170, 200), plat(300, 114, 140)],
    foes: [
      { k: 'walker', x: 90, y: 282 },
      { k: 'walker', x: 360, y: 226 },
      { k: 'hopper', x: 180, y: 170 }
    ]
  },
  {
    name: '折梁',
    plats: [FLOOR, plat(24, 282, 100), plat(148, 226, 100), plat(272, 170, 100), plat(360, 114, 96)],
    foes: [
      { k: 'walker', x: 70, y: 282 },
      { k: 'hopper', x: 200, y: 226 },
      { k: 'walker', x: 320, y: 170 }
    ]
  },
  {
    name: '核壶',
    plats: [FLOOR, plat(20, 270, 120), plat(340, 270, 120), plat(150, 214, 180), plat(190, 130, 100)],
    foes: [
      { k: 'boss', x: 240, y: FLOOR_Y, hp: 3 },
      { k: 'walker', x: 80, y: 270 }
    ],
    boss: true
  },
  {
    name: '密格',
    plats: [
      FLOOR,
      plat(20, 282, 86), plat(140, 282, 86), plat(260, 282, 86), plat(380, 282, 76),
      plat(70, 226, 110), plat(250, 226, 140),
      plat(40, 170, 130), plat(300, 170, 130)
    ],
    foes: [
      { k: 'walker', x: 60, y: 282 },
      { k: 'walker', x: 320, y: 282 },
      { k: 'hopper', x: 120, y: 170 },
      { k: 'hopper', x: 360, y: 170 }
    ]
  },
  {
    name: '穿堂',
    plats: [FLOOR, plat(20, 282, 110), plat(350, 282, 110), plat(160, 210, 160), plat(40, 146, 90), plat(350, 146, 90)],
    foes: [
      { k: 'floater', x: 130, y: 200 },
      { k: 'floater', x: 350, y: 170 },
      { k: 'walker', x: 80, y: 282 },
      { k: 'walker', x: 400, y: 282 }
    ]
  },
  {
    name: '叠核',
    plats: [
      FLOOR,
      plat(24, 282, 78), plat(200, 282, 80), plat(376, 282, 80),
      plat(90, 226, 120), plat(270, 226, 120),
      plat(24, 170, 100), plat(190, 170, 100), plat(356, 170, 100),
      plat(140, 114, 200)
    ],
    foes: [
      { k: 'hopper', x: 60, y: 282 },
      { k: 'hopper', x: 240, y: 282 },
      { k: 'floater', x: 240, y: 90 },
      { k: 'walker', x: 240, y: 114 },
      { k: 'hopper', x: 410, y: 170 }
    ]
  },
  {
    name: '核王',
    plats: [FLOOR, plat(20, 266, 108), plat(352, 266, 108), plat(150, 206, 180), plat(36, 146, 86), plat(358, 146, 86)],
    foes: [
      { k: 'boss', x: 240, y: FLOOR_Y, hp: 4 },
      { k: 'hopper', x: 70, y: 266 },
      { k: 'hopper', x: 410, y: 266 }
    ],
    boss: true
  }
];

var CORE_LAYOUT = [
  { plats: [FLOOR, plat(22, 282, 150), plat(308, 282, 150), plat(120, 214, 110), plat(250, 214, 110), plat(180, 150, 120)] },
  { plats: [FLOOR, plat(18, 282, 90), plat(132, 226, 90), plat(246, 170, 90), plat(360, 114, 96), plat(80, 170, 80)] },
  { plats: [FLOOR, plat(20, 270, 100), plat(140, 270, 80), plat(260, 270, 80), plat(360, 270, 96), plat(80, 206, 140), plat(260, 150, 160)] },
  { plats: [FLOOR, plat(20, 266, 120), plat(340, 266, 120), plat(140, 206, 200), plat(70, 146, 80), plat(330, 146, 80)] },
  { plats: [FLOOR, plat(18, 282, 72), plat(114, 282, 72), plat(210, 282, 72), plat(306, 282, 72), plat(392, 282, 70), plat(60, 214, 140), plat(280, 214, 140), plat(160, 150, 160)] },
  { plats: [FLOOR, plat(30, 282, 120), plat(330, 226, 120), plat(70, 170, 150), plat(270, 114, 150)] }
];

function jumpHeight() {
  return (JUMP_V * JUMP_V) / (2 * GRAV);
}

function bounceHeight() {
  return (BOUNCE_JUMP * BOUNCE_JUMP) / (2 * GRAV);
}

function comboMul(n) {
  var k = n | 0;
  if (k <= 1) return 1;
  return Math.min(16, 1 << Math.min(4, k - 1));
}

function popScore(combo) {
  return 500 * comboMul(combo);
}

function fruitIndex(combo) {
  return clamp((combo | 0) - 1, 0, 4);
}

function fruitValue(combo) {
  return FRUIT_VAL[fruitIndex(combo)];
}

function fruitName(combo) {
  return FRUIT_NAME[fruitIndex(combo)];
}

function kindRgb(k) {
  if (k === 'walker') return HOT;
  if (k === 'hopper') return MAG;
  if (k === 'floater') return PUR;
  if (k === 'boss') return ORG;
  if (k === 'core') return TEAL;
  return CYN;
}

function kindSpd(k) {
  if (k === 'walker') return 44;
  if (k === 'hopper') return 52;
  if (k === 'floater') return 38;
  if (k === 'boss') return 40;
  return 42;
}

function foeSize(k) {
  if (k === 'boss') return { w: 22, h: 26 };
  if (k === 'floater') return { w: 16, h: 18 };
  if (k === 'hopper') return { w: 14, h: 16 };
  return { w: 14, h: 15 };
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

function ceilPlat(plats, x, head, prevHead) {
  var i, p, bot;
  for (i = 0; i < plats.length; i++) {
    p = plats[i];
    if (!xOnPlat(p, x, -2)) continue;
    bot = p.y + p.h;
    if (prevHead >= bot - 2 && head <= bot) return p;
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
  var hw = foe.w * 0.42;
  var hh = foe.h * 0.46;
  var cx = foe.x;
  var cy = foe.y - foe.h * 0.5;
  return Math.abs(px - cx) < PW * 0.45 + hw && Math.abs(py - PH * 0.5 - cy) < PH * 0.42 + hh;
}

function bubHitFoe(b, foe) {
  var cy = foe.y - foe.h * 0.5;
  var rr = b.r + Math.max(foe.w, foe.h) * 0.38;
  return circleHit(b.x, b.y, 0, foe.x, cy, rr);
}

function playerHitBub(px, py, b) {
  var cx = px;
  var cy = py - PH * 0.45;
  return circleHit(cx, cy, 8, b.x, b.y, b.r);
}

function bounceOffWalls(b) {
  var hit = false;
  if (b.x < PLAY_L + b.r) {
    b.x = PLAY_L + b.r;
    if (b.vx < 0) { b.vx = -b.vx * REST; hit = true; }
  }
  if (b.x > PLAY_R - b.r) {
    b.x = PLAY_R - b.r;
    if (b.vx > 0) { b.vx = -b.vx * REST; hit = true; }
  }
  if (b.y < CEIL_Y + b.r + 2) {
    b.y = CEIL_Y + b.r + 2;
    if (b.vy < 0) { b.vy = -b.vy * REST; hit = true; }
  }
  if (b.y > FLOOR_Y - b.r) {
    b.y = FLOOR_Y - b.r;
    if (b.vy > 0) { b.vy = -b.vy * REST; hit = true; }
  }
  return hit;
}

function bounceOffPlat(b, p) {
  var nx = clamp(b.x, p.x, p.x + p.w);
  var ny = clamp(b.y, p.y, p.y + p.h);
  var dx = b.x - nx;
  var dy = b.y - ny;
  var d2 = dx * dx + dy * dy;
  var r = b.r - 0.4;
  var d, ux, uy, overlap, vn, left, right, top, bot;
  if (d2 >= r * r && d2 > 0.0001) return false;
  if (d2 < 0.0001) {
    left = b.x - p.x;
    right = p.x + p.w - b.x;
    top = b.y - p.y;
    bot = p.y + p.h - b.y;
    if (top <= left && top <= right && top <= bot) {
      b.y = p.y - r;
      if (b.vy > 0) b.vy = -Math.abs(b.vy) * REST;
    } else if (bot <= left && bot <= right) {
      b.y = p.y + p.h + r;
      if (b.vy < 0) b.vy = Math.abs(b.vy) * REST;
    } else if (left < right) {
      b.x = p.x - r;
      if (b.vx > 0) b.vx = -Math.abs(b.vx) * REST;
    } else {
      b.x = p.x + p.w + r;
      if (b.vx < 0) b.vx = Math.abs(b.vx) * REST;
    }
    return true;
  }
  d = Math.sqrt(d2);
  ux = dx / d;
  uy = dy / d;
  overlap = r - d;
  b.x += ux * overlap;
  b.y += uy * overlap;
  vn = b.vx * ux + b.vy * uy;
  if (vn < 0) {
    b.vx -= (1 + REST) * vn * ux;
    b.vy -= (1 + REST) * vn * uy;
    return true;
  }
  return false;
}

function bounceBubble(b, plats) {
  var i, hit = false;
  if (bounceOffWalls(b)) hit = true;
  for (i = 0; i < plats.length; i++) {
    if (plats[i].y >= FLOOR_Y - 1) continue;
    if (bounceOffPlat(b, plats[i])) hit = true;
  }
  return hit;
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
    blow: 0,
    blowCd: 0,
    state: 'idle',
    power: '',
    shots: 0
  };
}

function makeFoe(spec, mul) {
  var sz = foeSize(spec.k);
  return {
    k: spec.k,
    x: spec.x,
    y: spec.y,
    vx: 0,
    vy: 0,
    face: spec.x > WORLD_W * 0.5 ? -1 : 1,
    w: sz.w,
    h: sz.h,
    hp: spec.hp || (spec.k === 'boss' ? 3 : 1),
    grounded: spec.k !== 'floater',
    walk: rand(0, 8),
    hopCd: rand(0.4, 1.2),
    ph: rand(0, TAU),
    inv: 0,
    flash: 0,
    dead: false,
    angry: false,
    spd: kindSpd(spec.k) * (mul || 1)
  };
}

function makeBubble(x, y, face, kind) {
  var core = kind === 'core';
  return {
    x: x,
    y: y,
    vx: face * (core ? BUB_SHOT * 1.22 : BUB_SHOT),
    vy: core ? -36 : -12,
    r: core ? BUB_R + 2 : BUB_R,
    face: face,
    kind: kind || '',
    age: 0,
    life: core ? BUB_LIFE + 1.6 : BUB_LIFE,
    trap: null,
    hang: 0,
    popped: false,
    ricochet: core ? BOUNCE_T + 0.45 : BOUNCE_T,
    hits: 0,
    trail: []
  };
}

function makeFruit(x, y, combo) {
  var i = fruitIndex(combo);
  return {
    x: x,
    y: y,
    vy: -90,
    grounded: false,
    t: 0,
    i: i,
    val: FRUIT_VAL[i],
    name: FRUIT_NAME[i],
    rgb: FRUIT_RGB[i],
    take: false
  };
}

function makeItem(x, y) {
  return { x: x, y: y, kind: 'core', t: 0, take: false };
}

function roomCount() {
  return ROOMS.length;
}

function roomClear(foes, bubs) {
  var i;
  for (i = 0; i < foes.length; i++) {
    if (!foes[i].dead) return false;
  }
  for (i = 0; i < bubs.length; i++) {
    if (!bubs[i].popped && bubs[i].trap) return false;
  }
  return true;
}

function densifyPlats(plats) {
  var out = plats.slice();
  var i, p, nx, nw;
  for (i = 1; i < plats.length; i++) {
    p = plats[i];
    if (p.w > 90 && i % 2 === 1) {
      nw = Math.max(48, p.w * 0.42);
      nx = clamp(p.x + p.w * 0.55, PLAY_L + 8, PLAY_R - nw - 8);
      out.push(plat(nx, Math.max(114, p.y - 56), nw));
    }
  }
  return out;
}

function selfCheck() {
  var h, r, p, f, b, plats, foe, mul, hit, vx0;

  if (ROOMS.length !== 8) throw new Error('8 rooms');
  if (ROOMS[3].boss !== true) throw new Error('boss after a few rooms');
  if (ROOMS[7].boss !== true) throw new Error('final boss');
  if (LIVES !== 3) throw new Error('3 lives');
  if (BEST_KEY !== 'playbox-bubble-bobble-best') throw new Error('best key');

  h = jumpHeight();
  if (h < 50 || h > 78) throw new Error('jump height window ' + h);
  if (bounceHeight() < 50) throw new Error('bounce jump too short');
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
  p = landPlat(plats, 90, 283, 270);
  if (!p || p.y !== 282) throw new Error('land mid plat');
  if (landPlat(plats, 90, 270, 260)) throw new Error('no land from below');
  if (!onEdge(plats, 32, 282, -1)) throw new Error('left edge');
  if (onEdge(plats, 80, 282, 1)) throw new Error('mid not edge');

  if (comboMul(1) !== 1) throw new Error('combo 1');
  if (comboMul(2) !== 2) throw new Error('combo 2');
  if (comboMul(3) !== 4) throw new Error('combo 3');
  if (comboMul(5) !== 16) throw new Error('combo cap');
  if (popScore(1) !== 500) throw new Error('pop score');
  if (fruitValue(1) !== 100) throw new Error('fruit 1');
  if (fruitValue(5) !== 1600) throw new Error('fruit 5');
  if (fruitName(1) !== '樱桃') throw new Error('fruit name');

  foe = makeFoe({ k: 'walker', x: 200, y: FLOOR_Y }, 1);
  b = makeBubble(200, FLOOR_Y - 10, 1, '');
  if (!bubHitFoe(b, foe)) throw new Error('bubble traps');
  foe.x = 280;
  if (bubHitFoe(b, foe)) throw new Error('bubble miss');

  if (!playerHitBub(200, FLOOR_Y, makeBubble(200, FLOOR_Y - 12, 1, ''))) throw new Error('player pop');
  if (playerHitBub(80, FLOOR_Y, makeBubble(200, FLOOR_Y - 12, 1, ''))) throw new Error('player miss bubble');

  f = makeFoe({ k: 'walker', x: 56, y: FLOOR_Y }, 1);
  if (!bodyHit(56, FLOOR_Y, f)) throw new Error('touch foe');
  if (bodyHit(200, FLOOR_Y, f)) throw new Error('far foe');

  if (!roomClear([], [])) throw new Error('empty clear');
  if (roomClear([makeFoe({ k: 'walker', x: 1, y: 1 }, 1)], [])) throw new Error('live foe');
  b = makeBubble(10, 10, 1, '');
  b.trap = { k: 'walker' };
  if (roomClear([], [b])) throw new Error('trapped not clear');

  b = makeBubble(PLAY_L + 4, 200, -1, '');
  vx0 = b.vx;
  b.x += b.vx * 0.05;
  hit = bounceOffWalls(b);
  if (!hit || b.vx * vx0 >= 0) throw new Error('wall bounce');

  b = makeBubble(90, 270, 1, '');
  b.vy = 160;
  b.y = 278;
  if (!bounceOffPlat(b, plats[1])) throw new Error('plat bounce');
  if (b.vy >= 0) throw new Error('plat bounce vy');

  r = ROOMS[0];
  if (r.foes.length < 2) throw new Error('room1 foes');
  mul = 1 + 4 * 0.08;
  if (mul <= 1) throw new Error('core scales');
  if (densifyPlats(r.plats).length <= r.plats.length) throw new Error('densify');

  if (kindRgb('core') !== TEAL) throw new Error('core color');
  if (SHOTS < 4) throw new Error('core shots');
  if (ceilPlat(plats, 90, 272, 292) == null) throw new Error('head bump');
  if (roomCount() !== 8) throw new Error('count');
  if (REST <= 0.5 || REST >= 1) throw new Error('restitution');
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
var btnCore = document.getElementById('btn-core');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnLeft = document.getElementById('btn-left');
var btnRight = document.getElementById('btn-right');
var btnJump = document.getElementById('btn-jump');
var btnBlow = document.getElementById('btn-blow');
var scoreEl = document.getElementById('score');
var roundEl = document.getElementById('round');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var powerWrap = document.getElementById('power-wrap');
var powerLab = document.getElementById('power-lab');
var powerBar = document.getElementById('power-bar');
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

var keys = { l: false, r: false, u: false, blow: false };

var G = {
  mode: 'title',
  kind: 'rooms',
  clock: 0,
  round: 1,
  lives: LIVES,
  score: 0,
  bestR: 0,
  bestC: 0,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  player: makePlayer(),
  foes: [],
  bubs: [],
  fruits: [],
  items: [],
  plats: ROOMS[0].plats.slice(),
  roomName: '浅池',
  spawn: { x: 56, y: FLOOR_Y },
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flash: 0,
  flashRgb: CYN,
  clearT: 0,
  jumpBuf: 0,
  blowBuf: 0,
  roomT: 0,
  hurry: false,
  itemT: 0,
  pops: 0,
  lock: 0,
  why: '',
  won: false
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
    this.beep(310, 0.06, 'square', 0.045, 560);
    this.noise(0.035, 0.035, 1800, 'highpass');
  },
  land: function () {
    this.ensure();
    this.noise(0.045, 0.045, 360, 'bandpass');
    this.beep(150, 0.035, 'sine', 0.025, 70);
  },
  blow: function () {
    this.ensure();
    this.noise(0.08, 0.055, 980, 'bandpass');
    this.beep(240, 0.09, 'sine', 0.04, 480);
    this.beep(560, 0.07, 'triangle', 0.03, 300);
  },
  bounce: function () {
    this.ensure();
    this.beep(620, 0.04, 'sine', 0.03, 380);
    this.noise(0.03, 0.03, 1600, 'highpass');
  },
  trap: function () {
    this.ensure();
    this.beep(300, 0.08, 'sine', 0.05, 190);
    this.noise(0.07, 0.05, 620, 'lowpass');
    this.beep(680, 0.1, 'triangle', 0.04, 920);
  },
  pop: function (combo) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.09;
    this.noise(0.09, 0.075, 1500, 'highpass');
    this.beep(440 * p, 0.07, 'square', 0.075, 860 * p);
    this.beep(700 * p, 0.13, 'triangle', 0.05, 1180 * p);
  },
  emptyPop: function () {
    this.ensure();
    this.noise(0.05, 0.05, 1900, 'highpass');
    this.beep(820, 0.05, 'sine', 0.03, 260);
  },
  fruit: function () {
    this.ensure();
    this.beep(640, 0.07, 'square', 0.05, 960);
    this.beep(900, 0.1, 'triangle', 0.04, 1280);
  },
  pickup: function () {
    this.ensure();
    this.beep(540, 0.08, 'triangle', 0.06, 900);
    this.beep(820, 0.12, 'square', 0.04, 1240);
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
  },
  hit: function () {
    this.ensure();
    this.beep(160, 0.07, 'square', 0.05, 80);
    this.noise(0.06, 0.06, 400, 'lowpass');
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
      G.bestR = (o.r | 0) || (o.d | 0);
      G.bestC = o.c | 0;
      return;
    }
    if (typeof o === 'number') {
      G.bestR = o | 0;
      G.bestC = o | 0;
    }
  } catch (e) { /* ignore */ }
}

function persistBest() {
  var cur = G.kind === 'core' ? G.bestC : G.bestR;
  if (G.score > cur) {
    if (G.kind === 'core') G.bestC = G.score;
    else G.bestR = G.score;
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ r: G.bestR, c: G.bestC }));
  } catch (e) { /* ignore */ }
}

function currentBest() {
  return G.kind === 'core' ? G.bestC : G.bestR;
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

function kick(n) {
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
      r: rand(1.1, 2.5),
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
      t: rand(0.12, 0.28),
      rgb: rgb
    });
  }
}

function ring(x, y, rgb) {
  rings.push({ x: x, y: y, r: 6, t: 0, rgb: rgb });
}

function shardBurst(x, y, rgb) {
  var i, a;
  for (i = 0; i < 7; i++) {
    a = rand(0, TAU);
    shards.push({
      x: x, y: y,
      vx: Math.cos(a) * rand(60, 180),
      vy: Math.sin(a) * rand(40, 160) - 40,
      t: rand(0.22, 0.4),
      rot: rand(0, TAU),
      vr: rand(-8, 8),
      rgb: rgb
    });
  }
}

function floatText(x, y, text, rgb) {
  floats.push({ x: x, y: y, text: text, rgb: rgb || GOLD, t: 0 });
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
  if (G.combo >= 4) toast('连爆 ×' + comboMul(G.combo), false, true);
}

function renderPips() {
  var i, s = '';
  for (i = 0; i < LIVES; i++) {
    s += '<i class="pip ' + (i < G.lives ? 'on' : 'gone') + '"></i>';
  }
  pipsEl.innerHTML = s;
}

function syncPower() {
  var p = G.player;
  var on = !!(p.power && p.shots > 0);
  powerWrap.hidden = !on;
  if (!on) return;
  powerLab.textContent = '核';
  powerBar.style.transform = 'scaleX(' + (p.shots / SHOTS) + ')';
}

function hudPlay() {
  scoreEl.textContent = String(G.score);
  roundEl.textContent = String(G.round);
  bestEl.textContent = String(currentBest());
  comboEl.textContent = '×' + comboMul(Math.max(1, G.combo));
  modeLabel.textContent = G.kind === 'core' ? '泡核' : '泡龙2';
  modeLabel.classList.toggle('core', G.kind === 'core');
  renderPips();
  syncPower();
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
  ovKicker.textContent = 'BBBL';
  ovTitle.textContent = '泡龙2';
  ovLead.textContent = '吹出弹跳泡，在房里撞来撞去把怪装进去。跳上去踩爆，自己也会被弹起来。碰到没困住的怪会丢命。';
  ovOps.textContent = '← → / A D 走 · 上 / W / Z 跳 · 空格吹泡 · 触屏左 跳 吹 右 · R 重开 · M 静音';
  hintEl.textContent = '弹跳泡打穿房间 · 跳上去踩爆会弹起 · 弹核让泡更凶 · 碰到自由怪丢命';
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
  ovKicker.textContent = 'BBBL';
  ovTitle.textContent = '命尽';
  ovLead.textContent = '第 ' + G.round + ' 房 · 分数 ' + G.score + ' · 最高连爆 ×' + comboMul(Math.max(1, G.maxCombo));
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
  ovLead.textContent = '八房打穿。分数 ' + G.score + ' · 最高连爆 ×' + comboMul(Math.max(1, G.maxCombo));
  ovOps.textContent = 'R 再闯一趟 · 换模式去泡核';
}

/* ---- rooms ---- */
function speedMul(round, core) {
  return 1 + Math.max(0, round - 1) * (core ? 0.08 : 0.045);
}

function buildCore(round) {
  var tpl = CORE_LAYOUT[(round - 1) % CORE_LAYOUT.length];
  var plats = densifyPlats(tpl.plats);
  var n = 3 + Math.min(6, (round / 2) | 0);
  var mul = speedMul(round, true);
  var foes = [];
  var kinds, i, x, y, k, p;
  var boss = round % 4 === 0;
  if (boss) {
    foes.push(makeFoe({ k: 'boss', x: 240, y: FLOOR_Y, hp: 3 + Math.min(3, (round / 4) | 0) }, mul));
    n = Math.max(3, n - 1);
  }
  kinds = ['walker', 'hopper'];
  if (round >= 2) kinds.push('floater');
  if (round >= 5) kinds.push('hopper');
  for (i = 0; i < n; i++) {
    k = kinds[i % kinds.length];
    p = plats[1 + (i % Math.max(1, plats.length - 1))];
    x = clamp(p.x + p.w * (0.25 + (i % 3) * 0.25), PLAY_L + 20, PLAY_R - 20);
    y = k === 'floater' ? p.y - 36 : p.y;
    foes.push(makeFoe({ k: k, x: x, y: y }, mul));
  }
  return { name: '核 ' + round, plats: plats, foes: foes, boss: boss };
}

function loadRoom(round, attract) {
  var spec, i, mul, list;
  G.round = round;
  G.roomT = 0;
  G.hurry = false;
  G.clearT = 0;
  G.itemT = attract ? 99 : (round === 1 ? 10 : 7);
  G.pops = 0;
  G.bubs = [];
  G.fruits = [];
  G.items = [];
  G.comboAge = G.combo > 0 ? G.comboAge : 0;
  particles.length = 0;
  sparks.length = 0;
  rings.length = 0;
  shards.length = 0;

  if (G.kind === 'core' && !attract) {
    spec = buildCore(round);
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
    for (i = 0; i < list.length; i++) G.foes.push(makeFoe(list[i], mul));
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
    G.player.blow = 0;
    G.player.blowCd = 0;
  }
  roundEl.textContent = String(G.round);
  if (!attract && spec && spec.boss) toast(G.roomName, false, true);
}

function startRun(kind) {
  G.kind = kind === 'core' ? 'core' : 'rooms';
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
  loadRoom(1, false);
  hudPlay();
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
  if (G.kind === 'rooms' && G.round >= ROOMS.length) {
    addScore(2500 + G.round * 200, WORLD_W * 0.5, 80);
    audio.win();
    showWin();
    return;
  }
  loadRoom(n, false);
  hudPlay();
}

function spawnItem() {
  var plats = G.plats;
  var i, p;
  if (G.items.length) return;
  if (G.player.power && G.player.shots > 0) return;
  i = 1 + ((Math.random() * Math.max(1, plats.length - 1)) | 0);
  p = plats[i] || plats[0];
  G.items.push(makeItem(p.x + p.w * 0.5, p.y));
}

function grantPower() {
  G.player.power = 'core';
  G.player.shots = SHOTS;
  syncPower();
  toast('弹核', false, true);
  audio.pickup();
  flash(TEAL, 0.12);
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
  G.jumpBuf = 0;
  audio.hop();
  burst(p.x, p.y, 5, TEAL, 70, 0.22, 40);
  if (!reduceMotion()) hitStop(0.028);
}

function tryBlow(p) {
  var kind, b, i, oldest, oldA;
  if (p.deadT > 0 || G.mode !== 'play') return;
  if (p.blowCd > 0) return;
  kind = (p.power && p.shots > 0) ? p.power : '';
  if (kind) {
    p.shots -= 1;
    if (p.shots <= 0) p.power = '';
    syncPower();
  }
  p.blow = BLOW_T;
  p.blowCd = BLOW_CD;
  b = makeBubble(p.x + p.face * 16, p.y - 12, p.face, kind);
  G.bubs.push(b);
  if (G.bubs.length > MAX_BUB) {
    oldest = -1;
    oldA = -1;
    for (i = 0; i < G.bubs.length; i++) {
      if (G.bubs[i].trap || G.bubs[i].popped) continue;
      if (G.bubs[i].age > oldA) { oldA = G.bubs[i].age; oldest = i; }
    }
    if (oldest >= 0) popBubble(G.bubs[oldest], false, true);
  }
  audio.blow();
  burst(b.x, b.y, 6, kind ? TEAL : CYN, 50, 0.2, 10);
  hitStop(0.032);
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
  toast('再起', true, false);
}

function tickPlayer(dt) {
  var p = G.player;
  var want, nx, prev, landed, bump;
  p.squash = lerp(p.squash, 1, 1 - Math.pow(0.0008, dt));
  if (p.inv > 0) p.inv -= dt;
  if (p.blow > 0) p.blow -= dt;
  if (p.blowCd > 0) p.blowCd -= dt;

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
    if (p.grounded) p.state = p.blow > 0 ? 'blow' : 'idle';
  }

  if ((G.jumpBuf > 0 || keys.u) && (p.grounded || p.coyote > 0)) tryJump(p);
  if (keys.blow || G.blowBuf > 0) tryBlow(p);

  nx = p.x + p.vx * dt;
  if (nx < PLAY_L + 6) nx = PLAY_L + 6;
  if (nx > PLAY_R - 6) nx = PLAY_R - 6;
  p.x = nx;

  if (p.grounded) {
    p.coyote = COYOTE;
    if (!platAt(G.plats, p.x, p.y, 4)) {
      p.grounded = false;
      p.state = 'fall';
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
        audio.land();
        burst(p.x, p.y, 4, TEAL, 40, 0.18, 30);
      }
    } else {
      bump = ceilPlat(G.plats, p.x, p.y - PH, prev - PH);
      if (bump) {
        p.vy = 28;
        p.y = bump.y + bump.h + PH;
      } else if (p.y - PH < CEIL_Y) {
        p.vy = 20;
        p.y = CEIL_Y + PH;
      }
    }
    if (p.y > WORLD_H + 10) {
      p.y = CEIL_Y + PH + 4;
      p.vy = Math.min(p.vy, 80);
    }
  }
}

function trampoline(p, b) {
  p.vy = -BOUNCE_JUMP;
  p.grounded = false;
  p.coyote = 0;
  p.state = 'jump';
  p.squash = 0.7;
  p.y = Math.min(p.y, b.y - b.r + 4);
  burst(p.x, p.y, 6, TEAL, 80, 0.2, 20);
}

/* ---- bubbles ---- */
function popBubble(b, byPlayer, silent) {
  var i, o, d, fruitCombo, p;
  if (b.popped) return;
  b.popped = true;
  p = G.player;
  if (byPlayer && p.deadT <= 0) trampoline(p, b);
  if (b.trap) {
    fruitCombo = G.combo + 1;
    bumpCombo();
    addScore(popScore(G.combo) + (b.trap.k === 'boss' ? 2500 : 0), b.x, b.y);
    G.fruits.push(makeFruit(b.x, b.y, fruitCombo));
    G.pops += 1;
    burst(b.x, b.y, 24, kindRgb(b.trap.k), 220, 0.5, 200);
    spark(b.x, b.y, 12, WHT);
    ring(b.x, b.y, CYN);
    shardBurst(b.x, b.y, GOLD);
    if (!silent) {
      audio.pop(G.combo);
      hitStop(0.055 + Math.min(0.03, G.combo * 0.006));
      kick(3 + Math.min(4, G.combo));
      flash(CYN, 0.08);
    }
  } else {
    burst(b.x, b.y, 12, b.kind === 'core' ? TEAL : CYN, 100, 0.3, 40);
    ring(b.x, b.y, b.kind === 'core' ? MAG : CYN);
    if (!silent) audio.emptyPop();
    if (byPlayer) hitStop(0.03);
  }

  if (byPlayer) {
    for (i = 0; i < G.bubs.length; i++) {
      o = G.bubs[i];
      if (o === b || o.popped) continue;
      if (o.ricochet > 0.55 && !o.trap) continue;
      d = hypot(o.x - b.x, o.y - b.y);
      if (d < 30) popBubble(o, true, false);
    }
  }
}

function escapeTrap(b) {
  var spec, e;
  if (!b.trap) return;
  spec = { k: b.trap.k, x: b.x, y: Math.max(b.y + 8, CEIL_Y + 24), hp: 1 };
  e = makeFoe(spec, speedMul(G.round, G.kind === 'core'));
  e.inv = 0.35;
  e.angry = true;
  e.spd *= 1.28;
  G.foes.push(e);
  b.trap = null;
  b.popped = true;
  burst(b.x, b.y, 8, MAG, 70, 0.25, 20);
  toast('逃出', true, false);
  audio.hit();
}

function tickBubbles(dt) {
  var i, b, hit, j, a, c, dx, dy, d, nx, ny, va, vc;
  for (i = G.bubs.length - 1; i >= 0; i--) {
    b = G.bubs[i];
    if (b.popped) {
      G.bubs.splice(i, 1);
      continue;
    }
    b.age += dt;
    b.life -= dt;
    b.trail.push({ x: b.x, y: b.y });
    if (b.trail.length > 7) b.trail.shift();

    if (b.ricochet > 0) {
      b.ricochet -= dt;
      b.vy += 90 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      hit = bounceBubble(b, G.plats);
      if (hit) {
        b.hits += 1;
        if (b.hits <= 6 && G.mode === 'play') {
          spark(b.x, b.y, 3, b.kind === 'core' ? MAG : CYN);
          audio.bounce();
        }
      }
      if (b.ricochet <= 0) {
        b.vx *= 0.35;
        if (!b.trap) b.vy = -42;
      }
    } else {
      b.vx *= Math.pow(0.22, dt);
      b.vy = b.trap ? -24 : -40;
      if (b.trap && b.trap.k === 'boss') b.vy = -16;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < PLAY_L + b.r) { b.x = PLAY_L + b.r; b.vx = Math.abs(b.vx); }
      if (b.x > PLAY_R - b.r) { b.x = PLAY_R - b.r; b.vx = -Math.abs(b.vx); }
      if (b.y - b.r <= CEIL_Y + 4) {
        b.y = CEIL_Y + 4 + b.r;
        b.vx = 0;
        b.vy = 0;
        b.hang += dt;
        if (b.trap && b.hang > (G.kind === 'core' ? 4.2 : HANG_T)) escapeTrap(b);
        else if (!b.trap && b.hang > 1.5) popBubble(b, false, true);
      }
    }
    if (b.life <= 0 && !b.trap) popBubble(b, false, true);
    else if (b.life <= 0 && b.trap && b.hang > 0.3) escapeTrap(b);
  }

  for (i = 0; i < G.bubs.length; i++) {
    a = G.bubs[i];
    if (a.popped) continue;
    for (j = i + 1; j < G.bubs.length; j++) {
      c = G.bubs[j];
      if (c.popped) continue;
      dx = c.x - a.x;
      dy = c.y - a.y;
      d = hypot(dx, dy);
      if (d < 0.1) d = 0.1;
      if (d < a.r + c.r - 1) {
        nx = dx / d;
        ny = dy / d;
        a.x -= nx * 0.5;
        c.x += nx * 0.5;
        a.y -= ny * 0.35;
        c.y += ny * 0.35;
        if (a.ricochet > 0 || c.ricochet > 0) {
          va = a.vx * nx + a.vy * ny;
          vc = c.vx * nx + c.vy * ny;
          a.vx += (vc - va) * nx;
          a.vy += (vc - va) * ny;
          c.vx += (va - vc) * nx;
          c.vy += (va - vc) * ny;
        }
      }
    }
  }
}

function trapFoe(b, e) {
  var dmg;
  if (e.k === 'boss' && e.hp > 1) {
    dmg = b.kind === 'core' ? 2 : 1;
    e.hp -= dmg;
    e.flash = 0.18;
    e.inv = 0.2;
    e.x += b.face * 10;
    audio.hit();
    hitStop(0.045);
    burst(e.x, e.y - 10, 10, ORG, 90, 0.25, 80);
    spark(b.x, b.y, 6, CYN);
    if (e.hp > 0) {
      popBubble(b, false, true);
      return;
    }
  }
  e.dead = true;
  b.trap = { k: e.k, hp: e.hp };
  b.ricochet = Math.min(b.ricochet, 0.18);
  b.vx *= 0.45;
  b.vy *= 0.35;
  b.life = BUB_LIFE + 2;
  if (e.k === 'boss') b.r = 16;
  addScore(150, e.x, e.y - 8);
  audio.trap();
  hitStop(0.048);
  ring(b.x, b.y, CYN);
  burst(b.x, b.y, 10, CYN, 70, 0.24, 20);
  kick(2);
}

/* ---- enemies ---- */
function tickFoes(dt) {
  var i, e, landed, mul, edge, prev;
  mul = G.hurry ? 1.48 : 1;
  if (G.kind === 'core') mul *= 1.08;
  for (i = 0; i < G.foes.length; i++) {
    e = G.foes[i];
    if (e.dead) continue;
    if (e.inv > 0) e.inv -= dt;
    if (e.flash > 0) e.flash -= dt;
    e.walk += dt * 8;
    e.ph += dt * (e.k === 'floater' ? 2.2 : 1);

    if (e.k === 'floater') {
      if (Math.abs(G.player.x - e.x) > 8) e.face = G.player.x > e.x ? 1 : -1;
      e.x += e.face * e.spd * 0.72 * mul * dt;
      e.y += Math.sin(e.ph) * 22 * dt;
      if (e.x < PLAY_L + 10) { e.x = PLAY_L + 10; e.face = 1; }
      if (e.x > PLAY_R - 10) { e.x = PLAY_R - 10; e.face = -1; }
      e.y = clamp(e.y, CEIL_Y + 28, FLOOR_Y - 8);
      continue;
    }

    if (e.k === 'hopper' || e.k === 'boss') {
      e.hopCd -= dt;
      if (e.grounded && e.hopCd <= 0) {
        e.vy = e.k === 'boss' ? -240 : -268;
        e.grounded = false;
        e.hopCd = e.k === 'boss' ? rand(1.4, 2.2) : rand(0.9, 1.6);
      }
    }

    edge = e.grounded && onEdge(G.plats, e.x, e.y, e.face);
    if (edge) {
      if (e.k === 'hopper' && Math.random() < 0.35) {
        /* walk off */
      } else {
        e.face *= -1;
      }
    }
    e.x += e.face * e.spd * mul * dt;
    if (e.x < PLAY_L + 8) { e.x = PLAY_L + 8; e.face = 1; }
    if (e.x > PLAY_R - 8) { e.x = PLAY_R - 8; e.face = -1; }

    if (e.grounded) {
      if (!platAt(G.plats, e.x, e.y, 4)) {
        e.grounded = false;
      }
    } else {
      e.vy = Math.min(MAX_FALL, e.vy + GRAV * dt);
      prev = e.y;
      e.y += e.vy * dt;
      if (e.vy >= 0) {
        landed = landPlat(G.plats, e.x, e.y, prev);
        if (landed) {
          e.y = landed.y;
          e.vy = 0;
          e.grounded = true;
        }
      }
      if (e.y > WORLD_H + 8) {
        e.y = CEIL_Y + e.h + 6;
        e.vy = 40;
      }
    }
  }
  for (i = G.foes.length - 1; i >= 0; i--) {
    if (G.foes[i].dead) G.foes.splice(i, 1);
  }
}

function tickFruits(dt) {
  var i, f, p, landed, prev;
  for (i = G.fruits.length - 1; i >= 0; i--) {
    f = G.fruits[i];
    f.t += dt;
    if (f.take || f.t > 12) {
      G.fruits.splice(i, 1);
      continue;
    }
    if (!f.grounded) {
      prev = f.y;
      f.vy = Math.min(280, f.vy + 720 * dt);
      f.y += f.vy * dt;
      landed = landPlat(G.plats, f.x, f.y, prev);
      if (landed) {
        f.y = landed.y;
        f.grounded = true;
        f.vy = 0;
      }
      if (f.y > WORLD_H) { f.y = FLOOR_Y; f.grounded = true; }
    }
    p = G.player;
    if (G.mode === 'play' && p.deadT <= 0 && Math.abs(p.x - f.x) < 12 && Math.abs(p.y - f.y) < 16) {
      f.take = true;
      addScore(f.val, f.x, f.y);
      burst(f.x, f.y - 6, 12, f.rgb, 120, 0.32, 160);
      spark(f.x, f.y - 6, 6, WHT);
      audio.fruit();
      hitStop(0.03);
      kick(2);
    }
  }
}

function tickItems(dt) {
  var i, it, p;
  for (i = G.items.length - 1; i >= 0; i--) {
    it = G.items[i];
    it.t += dt;
    if (it.take || it.t > 16) {
      G.items.splice(i, 1);
      continue;
    }
    p = G.player;
    if (G.mode === 'play' && p.deadT <= 0 && Math.abs(p.x - it.x) < 13 && Math.abs(p.y - it.y) < 18) {
      it.take = true;
      grantPower();
      burst(it.x, it.y - 8, 14, TEAL, 140, 0.36, 80);
    }
  }
}

function collidePlay() {
  var p = G.player;
  var i, b, e;
  if (G.mode !== 'play' || p.deadT > 0) return;

  for (i = 0; i < G.bubs.length; i++) {
    b = G.bubs[i];
    if (b.popped) continue;
    if (b.ricochet > 0.62 && !b.trap) continue;
    if (b.age < 0.18 && !b.trap) continue;
    if (playerHitBub(p.x, p.y, b)) popBubble(b, true, false);
  }

  for (i = 0; i < G.bubs.length; i++) {
    b = G.bubs[i];
    if (b.popped || b.trap) continue;
    for (var j = 0; j < G.foes.length; j++) {
      e = G.foes[j];
      if (e.dead || e.inv > 0) continue;
      if (bubHitFoe(b, e)) {
        trapFoe(b, e);
        break;
      }
    }
  }

  if (p.inv > 0) return;
  for (i = 0; i < G.foes.length; i++) {
    e = G.foes[i];
    if (e.dead || e.inv > 0) continue;
    if (bodyHit(p.x, p.y, e)) {
      kill('foe');
      return;
    }
  }
}

function tickFx(dt) {
  var i, o;
  G.comboAge += dt;
  if (G.comboAge > COMBO_WIN && G.combo > 0) {
    G.combo = 0;
    comboEl.textContent = '×1';
  }
  G.shake *= Math.pow(0.04, dt);
  G.kickX *= Math.pow(0.02, dt);
  G.kickY *= Math.pow(0.02, dt);
  G.flash = Math.max(0, G.flash - dt);

  for (i = particles.length - 1; i >= 0; i--) {
    o = particles[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.vy += o.g * dt;
    o.y += o.vy * dt;
    if (o.t <= 0) particles.splice(i, 1);
  }
  for (i = sparks.length - 1; i >= 0; i--) {
    o = sparks[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.vy += 120 * dt;
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
    o.r += 78 * dt;
    if (o.t > 0.36) rings.splice(i, 1);
  }
  for (i = shards.length - 1; i >= 0; i--) {
    o = shards[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.vy += 260 * dt;
    o.y += o.vy * dt;
    o.rot += o.vr * dt;
    if (o.t <= 0) shards.splice(i, 1);
  }
}

function tick(dt) {
  var hurryAt;
  G.clock += dt;
  G.jumpBuf = Math.max(0, G.jumpBuf - dt);
  G.blowBuf = Math.max(0, G.blowBuf - dt);

  if (G.mode === 'over') {
    tickFx(dt);
    tickBubbles(dt);
    return;
  }

  if (G.mode === 'play' && G.clearT > 0) {
    G.clearT -= dt;
    tickPlayer(dt);
    tickBubbles(dt);
    tickFruits(dt);
    tickItems(dt);
    tickFx(dt);
    if (G.clearT <= 0) nextRoom();
    return;
  }

  G.roomT += dt;
  hurryAt = G.kind === 'core' ? HURRY_CORE : HURRY_ROOMS;
  if (G.mode === 'play' && !G.hurry && G.roomT > hurryAt) {
    G.hurry = true;
    toast('快！', true, false);
    audio.hurry();
    flash(MAG, 0.12);
  }

  if (G.mode === 'play') {
    G.itemT -= dt;
    if (G.itemT <= 0) {
      spawnItem();
      G.itemT = G.kind === 'core' ? 11 : 14;
    }
  }

  tickPlayer(dt);
  tickBubbles(dt);
  tickFoes(dt);
  if (G.mode === 'play') collidePlay();
  tickFruits(dt);
  tickItems(dt);
  tickFx(dt);

  if (G.mode === 'play' && G.clearT <= 0 && roomClear(G.foes, G.bubs) && G.player.deadT <= 0) {
    G.clearT = 1.15;
    addScore(1200 + G.round * 250, WORLD_W * 0.5, 90);
    audio.clear();
    toast('清房', false, true);
    kick(5);
    flash(TEAL, 0.14);
    stageEl.classList.add('clear');
    setTimeout(function () { stageEl.classList.remove('clear'); }, 300);
  }

  if (G.mode === 'title') {
    if (G.bubs.length < 4 && Math.random() < 0.025) {
      G.bubs.push(makeBubble(rand(80, 400), rand(80, 220), Math.random() < 0.5 ? 1 : -1, ''));
    }
    if (G.foes.length === 0) {
      G.foes.push(makeFoe({ k: 'walker', x: 220, y: FLOOR_Y }, 0.6));
    }
  }
}

/* ---- draw ---- */
function resize() {
  var rect = stageEl.getBoundingClientRect();
  cssW = rect.width;
  cssH = rect.height;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, (cssW * dpr) | 0);
  canvas.height = Math.max(1, (cssH * dpr) | 0);
  var padB = coarseQ.matches ? 62 : 8;
  var avW = cssW;
  var avH = Math.max(40, cssH - padB);
  var s = Math.min(avW / WORLD_W, avH / WORLD_H);
  L.s = s;
  L.x = (avW - WORLD_W * s) / 2;
  L.y = Math.max(4, (avH - WORLD_H * s) / 2);
}

function sx(x) { return L.x + x * L.s; }
function sy(y) { return L.y + y * L.s; }

if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

function drawBg() {
  var g, i, x, y, t;
  ctx.fillStyle = '#050914';
  ctx.fillRect(0, 0, cssW, cssH);

  g = ctx.createRadialGradient(sx(70), sy(50), 8, sx(70), sy(50), 210 * L.s);
  g.addColorStop(0, 'rgba(42,240,228,0.14)');
  g.addColorStop(1, 'rgba(42,240,228,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(400), sy(40), 8, sx(400), sy(40), 180 * L.s);
  g.addColorStop(0, 'rgba(255,61,184,0.09)');
  g.addColorStop(1, 'rgba(255,61,184,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.fillStyle = '#07141c';
  ctx.beginPath();
  ctx.moveTo(sx(0), sy(0));
  ctx.lineTo(sx(WORLD_W), sy(0));
  ctx.lineTo(sx(WORLD_W), sy(18));
  for (i = 16; i >= 0; i--) {
    x = (i / 16) * WORLD_W;
    y = 12 + Math.abs(Math.sin(i * 1.7 + 0.4)) * 16 + (i % 3) * 3;
    ctx.lineTo(sx(x), sy(y));
  }
  ctx.closePath();
  ctx.fill();

  t = G.clock;
  ctx.fillStyle = 'rgba(42,240,228,0.04)';
  for (i = 0; i < 10; i++) {
    ctx.fillRect(sx(28 + i * 44), sy(20), 1.6 * L.s, (WORLD_H - 36) * L.s);
  }
  for (i = 0; i < 8; i++) {
    ctx.fillStyle = rgba(CYN, 0.04 + 0.025 * Math.sin(t * 1.4 + i));
    ctx.beginPath();
    ctx.arc(sx(40 + i * 55), sy(70 + (i % 3) * 80 + Math.sin(t + i) * 6), (2 + (i % 3)) * L.s, 0, TAU);
    ctx.fill();
  }

  g = ctx.createLinearGradient(sx(0), 0, sx(18), 0);
  g.addColorStop(0, '#0a1820');
  g.addColorStop(1, 'rgba(10,24,32,0)');
  ctx.fillStyle = g;
  ctx.fillRect(sx(0), sy(0), 18 * L.s, WORLD_H * L.s);
  g = ctx.createLinearGradient(sx(WORLD_W), 0, sx(WORLD_W - 18), 0);
  g.addColorStop(0, '#0a1820');
  g.addColorStop(1, 'rgba(10,24,32,0)');
  ctx.fillStyle = g;
  ctx.fillRect(sx(WORLD_W - 18), sy(0), 18 * L.s, WORLD_H * L.s);
}

function drawPlat(p) {
  var x = sx(p.x);
  var y = sy(p.y);
  var w = p.w * L.s;
  var h = p.h * L.s;
  var g = ctx.createLinearGradient(x, y, x, y + h);
  var n, k;
  g.addColorStop(0, '#7af6ff');
  g.addColorStop(0.28, '#1aa8c0');
  g.addColorStop(1, '#0a3a4a');
  ctx.fillStyle = g;
  ctx.strokeStyle = 'rgba(122,246,255,0.5)';
  ctx.lineWidth = 1.1 * L.s;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 3 * L.s);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,255,255,0.4)';
  ctx.fillRect(x + 2 * L.s, y + 1 * L.s, w - 4 * L.s, 2.1 * L.s);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(x + 3 * L.s, y + h - 3 * L.s, w - 6 * L.s, 2 * L.s);
  n = Math.max(2, (p.w / 22) | 0);
  ctx.fillStyle = 'rgba(255, 61, 184, 0.28)';
  for (k = 0; k < n; k++) {
    ctx.fillRect(x + (k + 0.35) * (w / n), y + 3.4 * L.s, 2.2 * L.s, 3.2 * L.s);
  }
}

function drawFruit(f) {
  var x = sx(f.x);
  var y = sy(f.y - 7 - Math.sin(f.t * 6) * 1.4);
  var g;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(L.s, L.s);
  g = ctx.createRadialGradient(-1.5, -1.5, 0.4, 0, 0, 6);
  g.addColorStop(0, '#fff6c8');
  g.addColorStop(1, rgba(f.rgb, 1));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 5.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#2ad4c8';
  ctx.beginPath();
  ctx.ellipse(2.2, -5.2, 2.4, 1.3, 0.6, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawItem(it) {
  var x = sx(it.x);
  var y = sy(it.y - 10 - Math.sin(it.t * 5) * 2.4);
  var pulse = 8 + Math.sin(it.t * 6) * 1.4;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(L.s, L.s);
  ctx.fillStyle = rgba(TEAL, 0.22);
  ctx.beginPath();
  ctx.arc(0, 0, pulse, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(MAG, 0.85);
  ctx.beginPath();
  ctx.arc(0, 0, 5.4, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba(CYN, 0.95);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, 5.6, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = WHT;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(-1.6, -1.8, 1.5, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawFoe(e) {
  var x, y, bob, blink;
  if (e.dead) return;
  if (e.flash > 0 && ((G.clock * 20) | 0) % 2 === 0) return;
  bob = Math.sin(e.ph * (e.k === 'floater' ? 1 : 2)) * (e.grounded ? 0.6 : 0);
  x = sx(e.x);
  y = sy(e.y - e.h * 0.5 + bob);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(L.s * e.face, L.s);
  blink = ((G.clock * 2 + e.x) | 0) % 17 === 0;

  if (e.k === 'floater') {
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = '#7a4cff';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 8.5, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#c8b0ff';
    ctx.beginPath();
    ctx.ellipse(0, -1, 5, 5, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-8, 4);
    ctx.quadraticCurveTo(-4, 12 + Math.sin(e.ph) * 2, 0, 5);
    ctx.quadraticCurveTo(4, 12 - Math.sin(e.ph) * 2, 8, 4);
    ctx.fillStyle = '#7a4cff';
    ctx.fill();
    ctx.fillStyle = '#05030c';
    ctx.beginPath();
    ctx.arc(2.4, -1.2, blink ? 0.3 : 1.3, 0, TAU);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (e.k === 'boss') {
    ctx.fillStyle = e.angry || e.hp <= 1 ? '#ff4a7a' : '#ff6ad0';
    ctx.beginPath();
    ctx.ellipse(0, 1, 13, 12, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffe0f0';
    ctx.beginPath();
    ctx.ellipse(1, 2, 7, 6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = TEAL;
    ctx.beginPath();
    ctx.arc(0, -2, 5.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = CYN;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(0, -2, 6.2, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.moveTo(-6, -10);
    ctx.lineTo(-3, -16);
    ctx.lineTo(0, -10);
    ctx.moveTo(3, -10);
    ctx.lineTo(6, -16);
    ctx.lineTo(8, -10);
    ctx.fill();
    ctx.fillStyle = '#05030c';
    ctx.beginPath();
    ctx.arc(4, -1, blink ? 0.4 : 1.6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ff3db8';
    ctx.fillRect(2, 4, 6, 2);
    ctx.restore();
    return;
  }

  ctx.fillStyle = e.k === 'hopper' ? '#ff3db8' : '#ffb14a';
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 7.4, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = e.k === 'hopper' ? '#ffb0de' : '#ffe9a8';
  ctx.beginPath();
  ctx.ellipse(1.2, 1, 4.4, 3.8, 0, 0, TAU);
  ctx.fill();
  if (e.k === 'hopper') {
    ctx.strokeStyle = '#c02080';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-3, 7);
    ctx.quadraticCurveTo(-1, 12, 0, 7);
    ctx.quadraticCurveTo(2, 13, 3, 7);
    ctx.stroke();
  }
  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(2.6, -1.2, blink ? 0.3 : 1.25, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#5a2010';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(0, -5.2);
  ctx.lineTo(5.5, -7.2);
  ctx.stroke();
  ctx.fillStyle = '#4a2010';
  ctx.fillRect(-5, 6, 3.2, 2.2);
  ctx.fillRect(1.4, 6, 3.2, 2.2);
  ctx.restore();
}

function drawBubble(b) {
  var x = sx(b.x);
  var y = sy(b.y + Math.sin(b.age * 5 + b.x) * 0.8);
  var rgb = b.kind === 'core' ? MAG : CYN;
  var g, wob, i, tr, a;
  wob = 1 + Math.sin(b.age * 7) * 0.03;
  if (b.ricochet > 0 && b.trail.length > 1) {
    for (i = 0; i < b.trail.length; i++) {
      tr = b.trail[i];
      a = (i + 1) / b.trail.length * 0.35;
      ctx.fillStyle = rgba(rgb, a);
      ctx.beginPath();
      ctx.arc(sx(tr.x), sy(tr.y), (b.r * 0.55) * L.s, 0, TAU);
      ctx.fill();
    }
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(L.s * wob, L.s * (2 - wob));
  g = ctx.createRadialGradient(-3, -4, 1, 0, 0, b.r);
  g.addColorStop(0, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.35, rgba(rgb, 0.24));
  g.addColorStop(1, rgba(rgb, 0.08));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, b.r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba(rgb, b.ricochet > 0 ? 1 : 0.82);
  ctx.lineWidth = b.ricochet > 0 ? 1.7 : 1.35;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(-3.4, -3.8, 2.4, 1.6, -0.5, 0, TAU);
  ctx.fill();
  if (b.trap) {
    ctx.fillStyle = rgba(kindRgb(b.trap.k), 0.95);
    ctx.beginPath();
    ctx.arc(0, 1.2, 5.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#05030c';
    ctx.beginPath();
    ctx.arc(1.6, 0.4, 1.05, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlayer() {
  var p = G.player;
  var x, y, stride, blow, blink;
  if (G.mode === 'title') return;
  if (p.inv > 0 && p.deadT <= 0 && ((G.clock * 16) | 0) % 2 === 0) return;
  x = sx(p.x);
  y = sy(p.y);
  stride = p.grounded ? Math.sin(p.walk) : 0.4;
  blow = p.blow > 0 ? 1 : 0;
  blink = ((G.clock * 2) | 0) % 19 === 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p.face * L.s, L.s * p.squash);
  if (p.deadT > 0) ctx.rotate(0.7 * (1 - p.deadT / DIE_T));

  ctx.fillStyle = '#0a6a72';
  ctx.fillRect(-5.2, -3, 3.4, 3.6 + stride * 2.2);
  ctx.fillRect(1.2, -3, 3.4, 3.6 - stride * 2.2);

  ctx.fillStyle = p.power === 'core' ? '#ff6ad0' : '#2ad4d0';
  ctx.beginPath();
  ctx.ellipse(0, -10, 8.4 + blow, 9.2, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#b8fff8';
  ctx.beginPath();
  ctx.ellipse(1.2, -8.2, 4.6, 5, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#ff3db8';
  ctx.beginPath();
  ctx.moveTo(-4.2, -17);
  ctx.lineTo(-2.2, -22);
  ctx.lineTo(-0.4, -16.5);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(1.4, -17);
  ctx.lineTo(3.8, -22.4);
  ctx.lineTo(5.2, -16.2);
  ctx.fill();

  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(3.2, -12.2, blink ? 0.35 : 1.35, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(3.6, -12.6, 0.45, 0, TAU);
  ctx.fill();

  if (blow) {
    ctx.fillStyle = rgba(CYN, 0.7);
    ctx.beginPath();
    ctx.arc(10, -10, 3.4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  } else {
    ctx.fillStyle = '#0a5a62';
    ctx.fillRect(5.5, -11, 3.2, 2.2);
  }

  ctx.restore();
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
  for (i = 0; i < shards.length; i++) {
    o = shards[i];
    a = clamp(o.t / 0.35, 0, 1);
    ctx.save();
    ctx.translate(sx(o.x), sy(o.y));
    ctx.rotate(o.rot);
    ctx.fillStyle = rgba(o.rgb, a);
    ctx.fillRect(-2 * L.s, -1 * L.s, 4 * L.s, 2 * L.s);
    ctx.restore();
  }
  ctx.font = 'bold ' + (10 * L.s) + 'px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
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
  ctx.fillStyle = rgba(TEAL, 0.95);
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
  for (i = 0; i < G.items.length; i++) drawItem(G.items[i]);
  for (i = 0; i < G.fruits.length; i++) drawFruit(G.fruits[i]);
  for (i = 0; i < G.foes.length; i++) drawFoe(G.foes[i]);
  for (i = 0; i < G.bubs.length; i++) drawBubble(G.bubs[i]);
  drawPlayer();
  drawFx();
  drawRoomName();
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
bindPad(btnBlow, function (v) {
  keys.blow = v;
  if (v) G.blowBuf = BUFFER;
});

function keyOn(e, down) {
  var k = e.code;
  if (k === 'ArrowLeft' || k === 'KeyA') { keys.l = down; e.preventDefault(); }
  else if (k === 'ArrowRight' || k === 'KeyD') { keys.r = down; e.preventDefault(); }
  else if (k === 'ArrowUp' || k === 'KeyW' || k === 'KeyZ') {
    keys.u = down;
    if (down) G.jumpBuf = BUFFER;
    e.preventDefault();
  } else if (k === 'Space' || e.key === ' ') {
    keys.blow = down;
    if (down) G.blowBuf = BUFFER;
    e.preventDefault();
  }
}

window.addEventListener('keydown', function (e) {
  if (e.repeat) {
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
      startRun('core');
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
  keyOn(e, true);
}, true);

window.addEventListener('keyup', function (e) { keyOn(e, false); }, true);

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
  startRun('rooms');
});
btnCore.addEventListener('click', function () {
  audio.ensure();
  startRun('core');
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

resize();
hudPlay();
showTitle();
bestEl.textContent = String(currentBest());
requestAnimationFrame(frame);

}
