'use strict';

/* 泡龙 — Bubble Bobble remake. No CDN. */

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
var BLOW_CD = 0.34;
var BLOW_T = 0.14;
var BUB_R = 11;
var BUB_SHOT = 198;
var BUB_LIFE = 7.6;
var HANG_T = 5.4;
var INVULN = 1.5;
var DIE_T = 0.7;
var COMBO_WIN = 1.62;
var MAX_BUB = 8;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var SHOTS = 8;
var BEST_KEY = 'playbox-bubble-twin-best';
var MUTE_KEY = 'playbox-bubble-twin-mute';

var CYN = [0, 240, 255];
var MAG = [255, 61, 184];
var GOLD = [255, 227, 107];
var HOT = [255, 196, 74];
var LIME = [125, 255, 74];
var ORG = [255, 106, 40];
var PUR = [155, 92, 255];
var WHT = [246, 243, 255];
var BLU = [74, 140, 255];

var FRUIT_NAME = ['樱桃', '草莓', '香蕉', '西瓜', '葡萄'];
var FRUIT_VAL = [100, 200, 400, 800, 1600];
var FRUIT_RGB = [MAG, ORG, GOLD, LIME, PUR];

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

var FLOOR = plat(8, FLOOR_Y, 464);

var DUNGEON = [
  {
    name: '洞口',
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
    name: '石阶',
    plats: [FLOOR, plat(28, 282, 110), plat(128, 226, 110), plat(228, 170, 110), plat(328, 114, 120)],
    foes: [
      { k: 'walker', x: 80, y: 282 },
      { k: 'walker', x: 280, y: 170 },
      { k: 'hopper', x: 380, y: 114 }
    ]
  },
  {
    name: '酒壶',
    plats: [FLOOR, plat(20, 282, 130), plat(330, 282, 130), plat(150, 226, 180), plat(190, 114, 100)],
    foes: [
      { k: 'boss', x: 240, y: FLOOR_Y, hp: 3 },
      { k: 'walker', x: 80, y: 282 }
    ],
    boss: true
  },
  {
    name: '夹缝',
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
    name: '幽灵',
    plats: [FLOOR, plat(40, 282, 120), plat(320, 282, 120), plat(160, 214, 160), plat(80, 140, 90), plat(310, 140, 90)],
    foes: [
      { k: 'floater', x: 120, y: 200 },
      { k: 'floater', x: 360, y: 180 },
      { k: 'walker', x: 80, y: 282 },
      { k: 'walker', x: 380, y: 282 }
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
      { k: 'hopper', x: 420, y: 170 },
      { k: 'floater', x: 240, y: 90 },
      { k: 'walker', x: 240, y: 114 }
    ]
  },
  {
    name: '酒王',
    plats: [FLOOR, plat(20, 270, 110), plat(350, 270, 110), plat(160, 214, 160), plat(40, 150, 90), plat(350, 150, 90)],
    foes: [
      { k: 'boss', x: 240, y: FLOOR_Y, hp: 4 },
      { k: 'hopper', x: 70, y: 270 },
      { k: 'hopper', x: 410, y: 270 }
    ],
    boss: true
  }
];

var ENDLESS = [
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

function popScore(combo) {
  return 400 * comboMul(combo);
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
  if (k === 'fire') return ORG;
  if (k === 'water') return CYN;
  if (k === 'zap') return GOLD;
  return CYN;
}

function kindSpd(k) {
  if (k === 'walker') return 42;
  if (k === 'hopper') return 50;
  if (k === 'floater') return 36;
  if (k === 'boss') return 38;
  return 40;
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
  return {
    x: x,
    y: y,
    vx: face * BUB_SHOT,
    vy: 0,
    r: BUB_R,
    face: face,
    kind: kind || '',
    age: 0,
    life: BUB_LIFE,
    trap: null,
    hang: 0,
    popped: false,
    shoot: 0.42
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

function makeItem(x, y, kind) {
  return { x: x, y: y, kind: kind, t: 0, take: false };
}

function dungeonCount() {
  return DUNGEON.length;
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

function selfCheck() {
  var h, r, p, f, b, plats, foe, mul;

  if (DUNGEON.length !== 8) throw new Error('8 dungeon rooms');
  if (DUNGEON[3].boss !== true) throw new Error('boss after a few rooms');
  if (DUNGEON[7].boss !== true) throw new Error('final boss');
  if (LIVES !== 3) throw new Error('3 lives');
  if (BEST_KEY !== 'playbox-bubble-twin-best') throw new Error('best key');

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

  plats = DUNGEON[0].plats;
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
  if (popScore(1) !== 400) throw new Error('pop score');
  if (fruitValue(1) !== 100) throw new Error('fruit 1');
  if (fruitValue(5) !== 1600) throw new Error('fruit 5');

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

  r = DUNGEON[0];
  if (r.foes.length < 2) throw new Error('room1 foes');
  mul = 1 + 4 * 0.07;
  if (mul <= 1) throw new Error('endless scales');

  if (kindRgb('fire') !== ORG) throw new Error('fire color');
  if (kindRgb('water') !== CYN) throw new Error('water color');
  if (kindRgb('zap') !== GOLD) throw new Error('zap color');
  if (SHOTS < 4) throw new Error('special shots');

  if (ceilPlat(plats, 100, 272, 292) == null) throw new Error('head bump');
  if (mirrorX(40) !== 440) throw new Error('mirror');
  if (dungeonCount() !== 8) throw new Error('count');
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
var btnDungeon = document.getElementById('btn-dungeon');
var btnEndless = document.getElementById('btn-endless');
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

var keys = { l: false, r: false, u: false, blow: false, blowHeld: false };

var G = {
  mode: 'title',
  kind: 'dungeon',
  clock: 0,
  round: 1,
  lives: LIVES,
  score: 0,
  bestD: 0,
  bestE: 0,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  player: makePlayer(),
  foes: [],
  bubs: [],
  fruits: [],
  items: [],
  haz: [],
  plats: DUNGEON[0].plats.slice(),
  roomName: '洞口',
  spawn: { x: 56, y: FLOOR_Y },
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flash: 0,
  flashRgb: GOLD,
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
    this.beep(300, 0.06, 'square', 0.045, 540);
    this.noise(0.035, 0.035, 1700, 'highpass');
  },
  land: function () {
    this.ensure();
    this.noise(0.045, 0.045, 360, 'bandpass');
    this.beep(150, 0.035, 'sine', 0.025, 70);
  },
  blow: function () {
    this.ensure();
    this.noise(0.08, 0.055, 900, 'bandpass');
    this.beep(220, 0.09, 'sine', 0.04, 420);
    this.beep(520, 0.07, 'triangle', 0.03, 280);
  },
  trap: function () {
    this.ensure();
    this.beep(280, 0.08, 'sine', 0.05, 180);
    this.noise(0.07, 0.05, 600, 'lowpass');
    this.beep(640, 0.1, 'triangle', 0.04, 880);
  },
  pop: function (combo) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.08;
    this.noise(0.08, 0.07, 1400, 'highpass');
    this.beep(420 * p, 0.07, 'square', 0.07, 820 * p);
    this.beep(660 * p, 0.12, 'triangle', 0.05, 1100 * p);
  },
  emptyPop: function () {
    this.ensure();
    this.noise(0.05, 0.05, 1800, 'highpass');
    this.beep(780, 0.05, 'sine', 0.03, 240);
  },
  fruit: function () {
    this.ensure();
    this.beep(620, 0.07, 'square', 0.05, 920);
    this.beep(880, 0.1, 'triangle', 0.04, 1240);
  },
  pickup: function () {
    this.ensure();
    this.beep(520, 0.08, 'triangle', 0.06, 880);
    this.beep(780, 0.12, 'square', 0.04, 1180);
  },
  fire: function () {
    this.ensure();
    this.noise(0.16, 0.1, 280, 'lowpass');
    this.beep(180, 0.14, 'sawtooth', 0.05, 70);
  },
  water: function () {
    this.ensure();
    this.noise(0.14, 0.08, 700, 'bandpass');
    this.beep(240, 0.12, 'sine', 0.05, 90);
  },
  zap: function () {
    this.ensure();
    this.noise(0.1, 0.09, 2200, 'highpass');
    this.beep(980, 0.08, 'square', 0.055, 220);
    this.beep(1400, 0.06, 'sawtooth', 0.03, 400);
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
      G.bestD = (o.d | 0) || (o.c | 0);
      G.bestE = o.e | 0;
      return;
    }
    if (typeof o === 'number') {
      G.bestD = o | 0;
      G.bestE = o | 0;
    }
  } catch (e) { /* ignore */ }
}

function persistBest() {
  var cur = G.kind === 'endless' ? G.bestE : G.bestD;
  if (G.score > cur) {
    if (G.kind === 'endless') G.bestE = G.score;
    else G.bestD = G.score;
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ d: G.bestD, e: G.bestE }));
  } catch (e) { /* ignore */ }
}

function currentBest() {
  return G.kind === 'endless' ? G.bestE : G.bestD;
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
  powerLab.textContent = p.power === 'fire' ? '火' : p.power === 'water' ? '水' : '雷';
  powerBar.className = p.power;
  powerBar.style.transform = 'scaleX(' + (p.shots / SHOTS) + ')';
}

function hudPlay() {
  scoreEl.textContent = String(G.score);
  roundEl.textContent = String(G.round);
  bestEl.textContent = String(currentBest());
  comboEl.textContent = '×' + comboMul(Math.max(1, G.combo));
  modeLabel.textContent = G.kind === 'endless' ? '无尽' : '洞府';
  modeLabel.classList.toggle('endless', G.kind === 'endless');
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
  ovKicker.textContent = 'BUB';
  ovTitle.textContent = '泡龙';
  ovLead.textContent = '吹泡把怪装进去，再跳上去踩爆成水果。碰到没困住的怪会丢命。';
  ovOps.textContent = '← → / A D 走 · 上 / W 跳 · 空格吹泡 · 触屏左 跳 吹 右 · R 重开 · M 静音';
  hintEl.textContent = '吹泡困怪 · 跳上去踩爆 · 水果要捡 · 火 / 水 / 雷泡能清场';
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
  ovKicker.textContent = 'BUB';
  ovTitle.textContent = '命尽';
  ovLead.textContent = '第 ' + G.round + ' 关 · 分数 ' + G.score + ' · 最高连爆 ×' + comboMul(Math.max(1, G.maxCombo));
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
  ovLead.textContent = '洞府八关清完。分数 ' + G.score + ' · 最高连爆 ×' + comboMul(Math.max(1, G.maxCombo));
  ovOps.textContent = 'R 再闯一趟 · 换模式去无尽';
}

/* ---- rooms ---- */
function speedMul(round, endless) {
  return 1 + Math.max(0, round - 1) * (endless ? 0.075 : 0.045);
}

function buildEndless(round) {
  var tpl = ENDLESS[(round - 1) % ENDLESS.length];
  var plats = round % 2 === 0 ? mirrorPlats(tpl.plats) : tpl.plats.slice();
  var n = 2 + Math.min(6, (round / 2) | 0);
  var mul = speedMul(round, true);
  var foes = [];
  var kinds, i, x, y, k, hp;
  var boss = round % 5 === 0;
  if (boss) {
    foes.push(makeFoe({ k: 'boss', x: 240, y: FLOOR_Y, hp: 3 + Math.min(3, (round / 5) | 0) }, mul));
    n = Math.max(2, n - 1);
  }
  kinds = ['walker'];
  if (round >= 2) kinds.push('hopper');
  if (round >= 3) kinds.push('floater');
  if (round >= 6) kinds.push('hopper');
  for (i = 0; i < n; i++) {
    k = kinds[i % kinds.length];
    x = 70 + (i * 73 + round * 17) % 340;
    y = FLOOR_Y;
    if (plats[1 + (i % Math.max(1, plats.length - 1))]) {
      var p = plats[1 + (i % Math.max(1, plats.length - 1))];
      x = clamp(p.x + p.w * 0.5, PLAY_L + 20, PLAY_R - 20);
      y = p.y;
    }
    hp = 1;
    foes.push(makeFoe({ k: k, x: x, y: y, hp: hp }, mul));
  }
  return { name: '无尽 ' + round, plats: plats, foes: foes, boss: boss };
}

function loadRoom(round, attract) {
  var spec, i, mul, list;
  G.round = round;
  G.roomT = 0;
  G.hurry = false;
  G.clearT = 0;
  G.itemT = attract ? 99 : (round === 1 ? 11 : 7.5);
  G.pops = 0;
  G.bubs = [];
  G.fruits = [];
  G.items = [];
  G.haz = [];
  G.comboAge = G.combo > 0 ? G.comboAge : 0;
  particles.length = 0;
  sparks.length = 0;
  rings.length = 0;
  shards.length = 0;

  if (G.kind === 'endless' && !attract) {
    spec = buildEndless(round);
    G.plats = spec.plats;
    G.roomName = spec.name;
    G.foes = spec.foes;
  } else {
    spec = DUNGEON[clamp(round - 1, 0, DUNGEON.length - 1)];
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
  G.kind = kind === 'endless' ? 'endless' : 'dungeon';
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
  if (G.mode === 'title') startRun('dungeon');
  else startRun(G.kind || 'dungeon');
}

function nextRoom() {
  var n = G.round + 1;
  if (G.kind === 'dungeon' && G.round >= DUNGEON.length) {
    addScore(2000 + G.round * 200, WORLD_W * 0.5, 80);
    audio.win();
    showWin();
    return;
  }
  loadRoom(n, false);
  hudPlay();
}

/* ---- specials ---- */
function spawnItem() {
  var plats = G.plats;
  var i, p, kind, roll;
  if (G.items.length) return;
  if (G.player.power && G.player.shots > 0) return;
  i = 1 + ((Math.random() * Math.max(1, plats.length - 1)) | 0);
  p = plats[i] || plats[0];
  roll = Math.random();
  kind = roll < 0.34 ? 'fire' : roll < 0.67 ? 'water' : 'zap';
  G.items.push(makeItem(p.x + p.w * 0.5, p.y, kind));
}

function grantPower(kind) {
  G.player.power = kind;
  G.player.shots = SHOTS;
  syncPower();
  toast(kind === 'fire' ? '火泡' : kind === 'water' ? '水泡' : '雷泡', false, true);
  audio.pickup();
  flash(kindRgb(kind), 0.12);
}

function spawnFire(x, y) {
  var p = platAt(G.plats, x, y + 8, 18) || platAt(G.plats, x, FLOOR_Y, 8) || G.plats[0];
  G.haz.push({ k: 'fire', x: x, y: p.y, left: 8, right: 8, max: p.w * 0.55 + 40, t: 0.95, plat: p });
  audio.fire();
}

function spawnWater(x, y) {
  var i;
  for (i = 0; i < 5; i++) {
    G.haz.push({
      k: 'drop',
      x: x + rand(-10, 10),
      y: y,
      vx: rand(-40, 40),
      vy: rand(-20, 40),
      t: 1.15
    });
  }
  audio.water();
}

function spawnZap(x, y) {
  var pts = [{ x: x, y: y }];
  var used = [];
  var n, i, e, best, bd, j, dx, dy;
  for (n = 0; n < 4; n++) {
    best = null;
    bd = 110;
    for (i = 0; i < G.foes.length; i++) {
      e = G.foes[i];
      if (e.dead) continue;
      if (used.indexOf(i) >= 0) continue;
      dx = e.x - pts[pts.length - 1].x;
      dy = (e.y - e.h * 0.5) - pts[pts.length - 1].y;
      j = hypot(dx, dy);
      if (j < bd) { bd = j; best = i; }
    }
    if (best == null) break;
    used.push(best);
    e = G.foes[best];
    pts.push({ x: e.x, y: e.y - e.h * 0.5 });
    slayFoe(e, 'zap');
  }
  G.haz.push({ k: 'zap', pts: pts, t: 0.22 });
  audio.zap();
  hitStop(0.07);
  shake(5);
}

function slayFoe(e, why) {
  if (e.dead) return;
  e.dead = true;
  bumpCombo();
  addScore(why === 'zap' || why === 'fire' || why === 'water' ? 300 * comboMul(G.combo) : 200, e.x, e.y);
  burst(e.x, e.y - 8, 16, kindRgb(e.k), 170, 0.42, 280);
  spark(e.x, e.y - 8, 8, GOLD);
  ring(e.x, e.y - 8, kindRgb(e.k));
  G.fruits.push(makeFruit(e.x, e.y - 6, G.combo));
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
  burst(p.x, p.y, 5, CYN, 70, 0.22, 40);
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
  if (kind === 'fire') b.r = 12;
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
  burst(b.x, b.y, 6, kind ? kindRgb(kind) : CYN, 50, 0.2, 10);
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
  var want, nx, prev, landed;
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
        burst(p.x, p.y, 4, HOT, 40, 0.18, 30);
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
}

/* ---- bubbles ---- */
function popBubble(b, byPlayer, silent) {
  var i, o, d, fruitCombo;
  if (b.popped) return;
  b.popped = true;
  if (b.trap) {
    fruitCombo = G.combo + 1;
    bumpCombo();
    addScore(popScore(G.combo) + (b.trap.k === 'boss' ? 2000 : 0), b.x, b.y);
    G.fruits.push(makeFruit(b.x, b.y, fruitCombo));
    G.pops += 1;
    burst(b.x, b.y, 22, kindRgb(b.trap.k), 210, 0.48, 200);
    spark(b.x, b.y, 10, WHT);
    ring(b.x, b.y, CYN);
    if (!silent) {
      audio.pop(G.combo);
      hitStop(0.055 + Math.min(0.03, G.combo * 0.006));
      kick(3 + Math.min(4, G.combo));
      flash(CYN, 0.08);
    }
  } else {
    burst(b.x, b.y, 10, b.kind ? kindRgb(b.kind) : CYN, 90, 0.28, 40);
    ring(b.x, b.y, b.kind ? kindRgb(b.kind) : CYN);
    if (!silent) audio.emptyPop();
  }
  if (b.kind === 'fire') spawnFire(b.x, b.y);
  else if (b.kind === 'water') spawnWater(b.x, b.y);
  else if (b.kind === 'zap') spawnZap(b.x, b.y);

  if (byPlayer) {
    for (i = 0; i < G.bubs.length; i++) {
      o = G.bubs[i];
      if (o === b || o.popped) continue;
      if (o.shoot > 0 && !o.trap) continue;
      d = hypot(o.x - b.x, o.y - b.y);
      if (d < 28) popBubble(o, true, false);
    }
  }
}

function escapeTrap(b) {
  var spec, e;
  if (!b.trap) return;
  spec = { k: b.trap.k, x: b.x, y: Math.max(b.y + 8, CEIL_Y + 24), hp: 1 };
  e = makeFoe(spec, speedMul(G.round, G.kind === 'endless'));
  e.inv = 0.35;
  e.angry = true;
  e.spd *= 1.25;
  G.foes.push(e);
  b.trap = null;
  b.popped = true;
  burst(b.x, b.y, 8, MAG, 70, 0.25, 20);
  toast('逃出', true, false);
  audio.hit();
}

function tickBubbles(dt) {
  var i, b, wall;
  for (i = G.bubs.length - 1; i >= 0; i--) {
    b = G.bubs[i];
    if (b.popped) {
      G.bubs.splice(i, 1);
      continue;
    }
    b.age += dt;
    b.life -= dt;
    if (b.shoot > 0) {
      b.shoot -= dt;
      b.x += b.vx * dt;
      b.vy = 0;
      wall = false;
      if (b.x < PLAY_L + b.r) { b.x = PLAY_L + b.r; wall = true; }
      if (b.x > PLAY_R - b.r) { b.x = PLAY_R - b.r; wall = true; }
      if (wall || b.shoot <= 0) {
        b.shoot = 0;
        b.vx *= 0.12;
      }
    } else {
      b.vx *= Math.pow(0.18, dt);
      b.vy = b.trap ? -26 : -38;
      if (b.trap && b.trap.k === 'boss') b.vy = -18;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < PLAY_L + b.r) { b.x = PLAY_L + b.r; b.vx = Math.abs(b.vx); }
      if (b.x > PLAY_R - b.r) { b.x = PLAY_R - b.r; b.vx = -Math.abs(b.vx); }
      if (b.y - b.r <= CEIL_Y + 4) {
        b.y = CEIL_Y + 4 + b.r;
        b.vx = 0;
        b.vy = 0;
        b.hang += dt;
        if (b.trap && b.hang > HANG_T) escapeTrap(b);
        else if (!b.trap && b.hang > 1.6) popBubble(b, false, true);
      }
    }
    if (b.life <= 0 && !b.trap) popBubble(b, false, true);
    else if (b.life <= 0 && b.trap && b.hang > 0.4) escapeTrap(b);
  }

  /* slight bubble bounce */
  for (i = 0; i < G.bubs.length; i++) {
    var j, a, c, dx, dy, d, push;
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
        push = (a.r + c.r - d) * 0.5;
        a.x -= dx / d * push * 0.5;
        c.x += dx / d * push * 0.5;
        a.y -= dy / d * push * 0.35;
        c.y += dy / d * push * 0.35;
      }
    }
  }
}

function trapFoe(b, e) {
  if (e.k === 'boss' && e.hp > 1 && b.kind !== 'zap') {
    e.hp -= b.kind ? 2 : 1;
    e.flash = 0.18;
    e.inv = 0.2;
    e.x += b.face * 10;
    audio.hit();
    hitStop(0.04);
    burst(e.x, e.y - 10, 10, ORG, 90, 0.25, 80);
    if (e.hp > 0) {
      popBubble(b, false, true);
      return;
    }
  }
  e.dead = true;
  b.trap = { k: e.k, hp: e.hp };
  b.shoot = 0;
  b.vx *= 0.2;
  b.life = BUB_LIFE + 2;
  if (e.k === 'boss') b.r = 16;
  addScore(100, e.x, e.y - 8);
  audio.trap();
  hitStop(0.04);
  ring(b.x, b.y, CYN);
  burst(b.x, b.y, 8, CYN, 60, 0.22, 20);
}

/* ---- enemies ---- */
function tickFoes(dt) {
  var i, e, landed, mul, edge, prev;
  mul = G.hurry ? 1.45 : 1;
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
      grantPower(it.kind);
      burst(it.x, it.y - 8, 14, kindRgb(it.kind), 140, 0.36, 80);
    }
  }
}

function tickHaz(dt) {
  var i, h, e, j, hit;
  for (i = G.haz.length - 1; i >= 0; i--) {
    h = G.haz[i];
    h.t -= dt;
    if (h.k === 'fire') {
      h.left = Math.min(h.max, h.left + 220 * dt);
      h.right = Math.min(h.max, h.right + 220 * dt);
      for (j = 0; j < G.foes.length; j++) {
        e = G.foes[j];
        if (e.dead) continue;
        if (Math.abs(e.y - h.y) > 14) continue;
        if (e.x > h.x - h.left && e.x < h.x + h.right) slayFoe(e, 'fire');
      }
    } else if (h.k === 'drop') {
      h.vy += 520 * dt;
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      hit = landPlat(G.plats, h.x, h.y, h.y - h.vy * dt);
      if (hit) {
        h.y = hit.y - 2;
        h.vy *= -0.15;
        h.vx *= 0.85;
      }
      for (j = 0; j < G.foes.length; j++) {
        e = G.foes[j];
        if (e.dead) continue;
        if (hypot(e.x - h.x, e.y - 8 - h.y) < 14) slayFoe(e, 'water');
      }
    }
    if (h.t <= 0) G.haz.splice(i, 1);
  }
}

function collidePlay() {
  var p = G.player;
  var i, b, e;
  if (G.mode !== 'play' || p.deadT > 0) return;

  for (i = 0; i < G.bubs.length; i++) {
    b = G.bubs[i];
    if (b.popped) continue;
    if (b.shoot > 0 && !b.trap) continue;
    if (b.age < 0.22 && !b.trap) continue;
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
    tickHaz(dt);
    tickFx(dt);
    if (G.clearT <= 0) nextRoom();
    return;
  }

  G.roomT += dt;
  if (G.mode === 'play' && !G.hurry && G.roomT > 36) {
    G.hurry = true;
    toast('快！', true, false);
    audio.hurry();
    flash(MAG, 0.12);
  }

  if (G.mode === 'play') {
    G.itemT -= dt;
    if (G.itemT <= 0) {
      spawnItem();
      G.itemT = 14;
    }
  }

  tickPlayer(dt);
  tickBubbles(dt);
  tickFoes(dt);
  if (G.mode === 'play') collidePlay();
  tickFruits(dt);
  tickItems(dt);
  tickHaz(dt);
  tickFx(dt);

  if (G.mode === 'play' && G.clearT <= 0 && roomClear(G.foes, G.bubs) && G.player.deadT <= 0) {
    G.clearT = 1.15;
    addScore(1000 + G.round * 200, WORLD_W * 0.5, 90);
    audio.clear();
    toast('清关', false, true);
    kick(5);
    flash(LIME, 0.14);
    stageEl.classList.add('clear');
    setTimeout(function () { stageEl.classList.remove('clear'); }, 300);
  }

  if (G.mode === 'title') {
    if (G.bubs.length < 3 && Math.random() < 0.02) {
      G.bubs.push(makeBubble(rand(80, 400), rand(80, 200), Math.random() < 0.5 ? 1 : -1, ''));
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
  ctx.fillStyle = '#07030b';
  ctx.fillRect(0, 0, cssW, cssH);

  g = ctx.createRadialGradient(sx(70), sy(50), 8, sx(70), sy(50), 210 * L.s);
  g.addColorStop(0, 'rgba(255,196,74,0.14)');
  g.addColorStop(1, 'rgba(255,196,74,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(400), sy(40), 8, sx(400), sy(40), 180 * L.s);
  g.addColorStop(0, 'rgba(125,255,74,0.08)');
  g.addColorStop(1, 'rgba(125,255,74,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.fillStyle = '#12080e';
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
  ctx.fillStyle = 'rgba(255,196,74,0.045)';
  for (i = 0; i < 10; i++) {
    ctx.fillRect(sx(28 + i * 44), sy(20), 1.6 * L.s, (WORLD_H - 36) * L.s);
  }
  for (i = 0; i < 8; i++) {
    ctx.fillStyle = rgba(CYN, 0.035 + 0.02 * Math.sin(t * 1.4 + i));
    ctx.beginPath();
    ctx.arc(sx(40 + i * 55), sy(70 + (i % 3) * 80 + Math.sin(t + i) * 6), (2 + (i % 3)) * L.s, 0, TAU);
    ctx.fill();
  }

  /* side walls */
  g = ctx.createLinearGradient(sx(0), 0, sx(18), 0);
  g.addColorStop(0, '#1a0c12');
  g.addColorStop(1, 'rgba(26,12,18,0)');
  ctx.fillStyle = g;
  ctx.fillRect(sx(0), sy(0), 18 * L.s, WORLD_H * L.s);
  g = ctx.createLinearGradient(sx(WORLD_W), 0, sx(WORLD_W - 18), 0);
  g.addColorStop(0, '#1a0c12');
  g.addColorStop(1, 'rgba(26,12,18,0)');
  ctx.fillStyle = g;
  ctx.fillRect(sx(WORLD_W - 18), sy(0), 18 * L.s, WORLD_H * L.s);
}

function drawPlat(p) {
  var x = sx(p.x);
  var y = sy(p.y);
  var w = p.w * L.s;
  var h = p.h * L.s;
  var g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, '#ffe08a');
  g.addColorStop(0.28, '#d4922a');
  g.addColorStop(1, '#4a2810');
  ctx.fillStyle = g;
  ctx.strokeStyle = 'rgba(255,227,107,0.5)';
  ctx.lineWidth = 1.1 * L.s;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 3 * L.s);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,227,107,0.38)';
  ctx.fillRect(x + 2 * L.s, y + 1 * L.s, w - 4 * L.s, 2.1 * L.s);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(x + 3 * L.s, y + h - 3 * L.s, w - 6 * L.s, 2 * L.s);
  var n = Math.max(2, (p.w / 22) | 0);
  var k;
  ctx.fillStyle = 'rgba(255, 106, 40, 0.28)';
  for (k = 0; k < n; k++) {
    ctx.fillRect(x + (k + 0.35) * (w / n), y + 3.4 * L.s, 2.2 * L.s, 3.2 * L.s);
  }
}

function drawHaz() {
  var i, h, a, j, x0, y0;
  for (i = 0; i < G.haz.length; i++) {
    h = G.haz[i];
    if (h.k === 'fire') {
      a = clamp(h.t / 0.95, 0, 1);
      ctx.fillStyle = rgba(ORG, 0.55 * a);
      ctx.fillRect(sx(h.x - h.left), sy(h.y - 10), (h.left + h.right) * L.s, 12 * L.s);
      ctx.fillStyle = rgba(GOLD, 0.7 * a);
      ctx.fillRect(sx(h.x - h.left), sy(h.y - 14 - Math.sin(G.clock * 14) * 2), (h.left + h.right) * L.s, 5 * L.s);
    } else if (h.k === 'drop') {
      ctx.fillStyle = rgba(CYN, 0.75);
      ctx.beginPath();
      ctx.ellipse(sx(h.x), sy(h.y), 5 * L.s, 7 * L.s, 0, 0, TAU);
      ctx.fill();
    } else if (h.k === 'zap') {
      a = clamp(h.t / 0.22, 0, 1);
      ctx.strokeStyle = rgba(GOLD, a);
      ctx.lineWidth = 2.2 * L.s;
      ctx.beginPath();
      for (j = 0; j < h.pts.length; j++) {
        x0 = sx(h.pts[j].x + rand(-2, 2));
        y0 = sy(h.pts[j].y + rand(-2, 2));
        if (j === 0) ctx.moveTo(x0, y0);
        else ctx.lineTo(x0, y0);
      }
      ctx.stroke();
      ctx.strokeStyle = rgba(WHT, a * 0.8);
      ctx.lineWidth = 1 * L.s;
      ctx.stroke();
    }
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
  ctx.fillStyle = '#3ecf2a';
  ctx.beginPath();
  ctx.ellipse(2.2, -5.2, 2.4, 1.3, 0.6, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawItem(it) {
  var x = sx(it.x);
  var y = sy(it.y - 10 - Math.sin(it.t * 5) * 2.4);
  var rgb = kindRgb(it.kind);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(L.s, L.s);
  ctx.fillStyle = rgba(rgb, 0.22);
  ctx.beginPath();
  ctx.arc(0, 0, 9 + Math.sin(it.t * 6) * 1.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(rgb, 1);
  if (it.kind === 'fire') {
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.bezierCurveTo(6, -2, 4, 6, 0, 7);
    ctx.bezierCurveTo(-4, 6, -6, -2, 0, -7);
    ctx.fill();
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.bezierCurveTo(3, 1, 2, 5, 0, 5);
    ctx.bezierCurveTo(-2, 5, -3, 1, 0, -2);
    ctx.fill();
  } else if (it.kind === 'water') {
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.quadraticCurveTo(7, 2, 0, 7);
    ctx.quadraticCurveTo(-7, 2, 0, -7);
    ctx.fill();
    ctx.fillStyle = WHT;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(-1.5, -1, 1.4, 0, TAU);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(2.2, -1);
    ctx.lineTo(8, 0);
    ctx.lineTo(2.2, 1.4);
    ctx.lineTo(0, 8);
    ctx.lineTo(-1.6, 1.4);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-1.6, -1);
    ctx.closePath();
    ctx.fill();
  }
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
    ctx.globalAlpha = 0.86;
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
    ctx.fillStyle = e.angry || e.hp <= 1 ? '#ff4a18' : '#ff7a28';
    ctx.beginPath();
    ctx.ellipse(0, 1, 13, 12, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffe0b0';
    ctx.beginPath();
    ctx.ellipse(1, 2, 7, 6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.moveTo(-6, -10);
    ctx.lineTo(-3, -16);
    ctx.lineTo(0, -10);
    ctx.moveTo(3, -10);
    ctx.lineTo(6, -16);
    ctx.lineTo(8, -10);
    ctx.fill();
    ctx.fillStyle = '#c86820';
    ctx.fillRect(4, -14, 4, 8);
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(4.4, -16, 3.2, 3);
    ctx.fillStyle = '#05030c';
    ctx.beginPath();
    ctx.arc(4, -1, blink ? 0.4 : 1.6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ff3db8';
    ctx.fillRect(2, 4, 6, 2);
    ctx.restore();
    return;
  }

  ctx.fillStyle = e.k === 'hopper' ? '#ff3db8' : '#ffc44a';
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
  var rgb = b.kind ? kindRgb(b.kind) : CYN;
  var g, wob;
  wob = 1 + Math.sin(b.age * 7) * 0.03;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(L.s * wob, L.s * (2 - wob));
  g = ctx.createRadialGradient(-3, -4, 1, 0, 0, b.r);
  g.addColorStop(0, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.35, rgba(rgb, 0.22));
  g.addColorStop(1, rgba(rgb, 0.08));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, b.r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba(rgb, 0.85);
  ctx.lineWidth = 1.35;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(-3.4, -3.8, 2.4, 1.6, -0.5, 0, TAU);
  ctx.fill();
  if (b.trap) {
    ctx.save();
    ctx.scale(0.55, 0.55);
    ctx.translate(0, 2);
    ctx.scale(1 / L.s, 1 / L.s);
    /* mini foe */
    ctx.fillStyle = rgba(kindRgb(b.trap.k), 0.95);
    ctx.beginPath();
    ctx.arc(0, 0, 7 * L.s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#05030c';
    ctx.beginPath();
    ctx.arc(2 * L.s, -1 * L.s, 1.1 * L.s, 0, TAU);
    ctx.fill();
    ctx.restore();
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

  /* feet */
  ctx.fillStyle = '#2a6a14';
  ctx.fillRect(-5.2, -3, 3.4, 3.6 + stride * 2.2);
  ctx.fillRect(1.2, -3, 3.4, 3.6 - stride * 2.2);

  /* body */
  ctx.fillStyle = p.power === 'fire' ? '#ff8a3a' : p.power === 'water' ? '#3ad0ff' : p.power === 'zap' ? '#ffe36b' : '#3ecf2a';
  ctx.beginPath();
  ctx.ellipse(0, -10, 8.4 + blow, 9.2, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#b6ff7a';
  ctx.beginPath();
  ctx.ellipse(1.2, -8.2, 4.6, 5, 0, 0, TAU);
  ctx.fill();

  /* horns */
  ctx.fillStyle = '#ffe36b';
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

  /* eye */
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
    ctx.strokeStyle = CYN;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  } else {
    ctx.fillStyle = '#1a5a10';
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
  ctx.fillStyle = rgba(GOLD, 0.9);
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
  drawHaz();
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
  if (!v) keys.blowHeld = false;
});

function keyOn(e, down) {
  var k = e.code;
  if (k === 'ArrowLeft' || k === 'KeyA') { keys.l = down; e.preventDefault(); }
  else if (k === 'ArrowRight' || k === 'KeyD') { keys.r = down; e.preventDefault(); }
  else if (k === 'ArrowUp' || k === 'KeyW') {
    keys.u = down;
    if (down) G.jumpBuf = BUFFER;
    e.preventDefault();
  } else if (k === 'Space' || e.key === ' ') {
    keys.blow = down;
    if (down) G.blowBuf = BUFFER;
    if (!down) keys.blowHeld = false;
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
      startRun('dungeon');
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      startRun('endless');
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
btnDungeon.addEventListener('click', function () {
  audio.ensure();
  startRun('dungeon');
});
btnEndless.addEventListener('click', function () {
  audio.ensure();
  startRun('endless');
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

bestEl.textContent = String(G.bestD);
renderPips();
showTitle();
resize();
hudPlay();
requestAnimationFrame(frame);

}
