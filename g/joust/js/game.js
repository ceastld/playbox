'use strict';

/* 骑鸟 — Williams Joust remake. Flap-joust arena. No CDN. */

var WORLD_W = 720;
var WORLD_H = 440;
var LIVES = 3;
var GRAV = 640;
var FLAP = -226;
var MAX_UP = -278;
var MAX_FALL = 318;
var ACCEL_G = 560;
var ACCEL_A = 368;
var FRICT_G = 6.2;
var FRICT_A = 0.4;
var MAX_VX_G = 176;
var MAX_VX_A = 204;
var LANCE_EPS = 6;
var PTERO_EPS = 12;
var HW = 12;
var HH = 13;
var EGG_R = 6.8;
var LAVA_Y = 418;
var HATCH_T = 6.4;
var INVULN = 1.6;
var DIE_T = 0.82;
var COMBO_WIN = 2.05;
var FLAP_BUF = 0.1;
var PAD_FLAP = 0.12;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var BEST_KEY = 'playbox-joust-best';
var MUTE_KEY = 'playbox-joust-mute';
var LIFE_AT = 12000;

var PLATS_RIDE = [
  { x: 248, y: 52, w: 224, h: 12 },
  { x: 0, y: 108, w: 168, h: 12 },
  { x: 552, y: 108, w: 168, h: 12 },
  { x: 72, y: 176, w: 168, h: 12 },
  { x: 480, y: 176, w: 168, h: 12 },
  { x: 236, y: 244, w: 248, h: 12 },
  { x: 0, y: 324, w: 220, h: 12 },
  { x: 500, y: 324, w: 220, h: 12 }
];

var PLATS_DENSE = [
  { x: 36, y: 42, w: 128, h: 10 },
  { x: 296, y: 38, w: 128, h: 10 },
  { x: 556, y: 42, w: 128, h: 10 },
  { x: 0, y: 96, w: 156, h: 10 },
  { x: 282, y: 104, w: 156, h: 10 },
  { x: 564, y: 96, w: 156, h: 10 },
  { x: 64, y: 164, w: 148, h: 10 },
  { x: 508, y: 164, w: 148, h: 10 },
  { x: 210, y: 222, w: 300, h: 10 },
  { x: 0, y: 282, w: 188, h: 10 },
  { x: 532, y: 282, w: 188, h: 10 },
  { x: 250, y: 344, w: 220, h: 10 }
];

var SPAWN_RIDE = { x: 88, plat: 6 };
var SPAWN_DENSE = { x: 72, plat: 9 };

var KIND_SCORE = {
  bounder: 500,
  hunter: 750,
  shadow: 1500,
  ptero: 1000,
  egg: 250
};

var CYN = [0, 240, 255];
var MAG = [255, 61, 184];
var GOLD = [255, 227, 107];
var HOT = [255, 154, 40];
var LAVA = [255, 74, 24];
var PUR = [155, 92, 255];
var WHT = [247, 242, 234];
var TEAL = [70, 230, 190];

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
function wrapX(x) {
  return ((x % WORLD_W) + WORLD_W) % WORLD_W;
}
function wrapDx(ax, bx) {
  var d = bx - ax;
  if (d > WORLD_W * 0.5) d -= WORLD_W;
  if (d < -WORLD_W * 0.5) d += WORLD_W;
  return d;
}

function lanceWinner(ay, by, eps) {
  if (ay < by - eps) return -1;
  if (by < ay - eps) return 1;
  return 0;
}

function comboMul(n) {
  return 1 + Math.min(4, Math.max(0, (n | 0) - 1));
}

function hatchType(from) {
  if (from === 'bounder') return 'hunter';
  if (from === 'hunter') return 'shadow';
  if (from === 'shadow') return 'shadow';
  return '';
}

function waveSpec(wave, dense) {
  var w = wave < 1 ? 1 : wave;
  var b, h, s, pteroAfter, linger, maxOn, total;
  if (dense) {
    if (w === 1) { b = 4; h = 1; s = 0; pteroAfter = true; linger = 16; }
    else if (w === 2) { b = 3; h = 2; s = 0; pteroAfter = true; linger = 14; }
    else if (w === 3) { b = 2; h = 2; s = 1; pteroAfter = true; linger = 12; }
    else if (w === 4) { b = 1; h = 3; s = 2; pteroAfter = true; linger = 11; }
    else {
      b = 1;
      h = 3;
      s = 2 + Math.min(3, (w - 4) >> 1);
      pteroAfter = true;
      linger = 9;
    }
    maxOn = 10;
  } else {
    if (w === 1) { b = 3; h = 0; s = 0; pteroAfter = false; linger = 22; }
    else if (w === 2) { b = 3; h = 1; s = 0; pteroAfter = true; linger = 18; }
    else if (w === 3) { b = 2; h = 2; s = 0; pteroAfter = true; linger = 16; }
    else if (w === 4) { b = 2; h = 2; s = 1; pteroAfter = true; linger = 14; }
    else if (w === 5) { b = 1; h = 2; s = 2; pteroAfter = true; linger = 12; }
    else {
      b = 0;
      h = 2 + (w % 2);
      s = 2 + Math.min(3, (w - 5) >> 1);
      pteroAfter = true;
      linger = 11;
    }
    maxOn = 7;
  }
  total = b + h + s;
  if (total > maxOn) s = Math.max(0, s - (total - maxOn));
  return {
    b: b, h: h, s: s,
    pteroAfter: pteroAfter,
    linger: linger,
    maxOn: maxOn,
    total: b + h + s
  };
}

function kindRgb(kind) {
  if (kind === 'ostrich') return CYN;
  if (kind === 'bounder') return HOT;
  if (kind === 'hunter') return MAG;
  if (kind === 'shadow') return PUR;
  if (kind === 'ptero') return GOLD;
  return WHT;
}

function kindScore(kind) {
  return KIND_SCORE[kind] || 0;
}

function kindLabel(kind) {
  if (kind === 'bounder') return '褐骑';
  if (kind === 'hunter') return '猎骑';
  if (kind === 'shadow') return '影骑';
  if (kind === 'ptero') return '翼龙';
  if (kind === 'egg') return '蛋';
  return '';
}

function bodyHW(r) {
  return r.kind === 'ptero' ? 24 : HW;
}
function bodyHH(r) {
  return r.kind === 'ptero' ? 11 : HH;
}
function lanceY(r) {
  return r.y - (r.kind === 'ptero' ? 2 : 5);
}
function feetY(r) {
  return r.y + (r.kind === 'ptero' ? 8 : 12);
}

function platsOf(dense) {
  return dense ? PLATS_DENSE : PLATS_RIDE;
}

function spawnOf(dense) {
  return dense ? SPAWN_DENSE : SPAWN_RIDE;
}

function xOnPlatIn(list, i, x) {
  var p = list[i];
  return x >= p.x - 2 && x <= p.x + p.w + 2;
}

function platLandIn(list, x, y, prevY, foot) {
  var i, p, feet, prevFeet;
  feet = y + foot;
  prevFeet = prevY + foot;
  for (i = 0; i < list.length; i++) {
    p = list[i];
    if (x < p.x - 2 || x > p.x + p.w + 2) continue;
    if (prevFeet <= p.y + 3 && feet >= p.y && feet <= p.y + 18) return i;
  }
  return -1;
}

function platCeilIn(list, x, y, prevY) {
  var i, p, head, prevHead, bot;
  head = y - 12;
  prevHead = prevY - 12;
  for (i = 0; i < list.length; i++) {
    p = list[i];
    if (x < p.x + 6 || x > p.x + p.w - 6) continue;
    bot = p.y + p.h;
    if (prevHead >= bot - 2 && head <= bot && head >= p.y - 4) return i;
  }
  return -1;
}

function overlapRiders(a, b) {
  var dx = Math.abs(wrapDx(a.x, b.x));
  var dy = Math.abs(a.y - b.y);
  return dx < bodyHW(a) + bodyHW(b) && dy < bodyHH(a) * 0.78 + bodyHH(b) * 0.78;
}

function waveMul(wave, dense) {
  return 1 + Math.max(0, wave - 1) * (dense ? 0.09 : 0.07);
}

function maxVxOf(r, wave, dense) {
  var m = r.team === 2 ? waveMul(wave, dense) : 1;
  var v;
  if (r.kind === 'bounder') v = r.grounded ? 122 : 146;
  else if (r.kind === 'hunter') v = r.grounded ? 156 : 182;
  else if (r.kind === 'shadow') v = r.grounded ? 180 : 214;
  else if (r.kind === 'ptero') v = dense ? 188 : 172;
  else v = r.grounded ? MAX_VX_G : MAX_VX_A;
  return v * m;
}

function accelOf(r, wave, dense) {
  var m = r.team === 2 ? waveMul(wave, dense) : 1;
  var v;
  if (r.kind === 'bounder') v = r.grounded ? 370 : 258;
  else if (r.kind === 'hunter') v = r.grounded ? 500 : 338;
  else if (r.kind === 'shadow') v = r.grounded ? 575 : 412;
  else if (r.kind === 'ptero') v = 282;
  else v = r.grounded ? ACCEL_G : ACCEL_A;
  return v * m;
}

function makeRider(kind, x, y, team) {
  return {
    kind: kind,
    team: team,
    x: x,
    y: y,
    vx: 0,
    vy: 0,
    face: x < WORLD_W * 0.5 ? 1 : -1,
    grounded: false,
    plat: -1,
    flapT: 0,
    flapCd: 0,
    flapBuf: 0,
    flapHeld: false,
    flapEdge: false,
    walk: 0,
    sqX: 1,
    sqY: 1,
    inv: 0,
    dead: false,
    deadT: 0,
    why: '',
    wantL: false,
    wantR: false,
    ai: { tx: x, ty: y, think: 0.2, flapCd: 0, phase: Math.random() * TAU, chase: false },
    spawnT: 0
  };
}

function platSpawnIn(list, spec) {
  var p = list[spec.plat];
  return { x: spec.x, y: p.y - 12, plat: spec.plat };
}

function selfCheck() {
  var w1, w1d, w5, list, i, p, low, a, b, s;

  if (PLATS_RIDE.length !== 8) throw new Error('ride 8 plats');
  if (PLATS_DENSE.length !== 12) throw new Error('dense 12 plats');
  if (PLATS_DENSE.length <= PLATS_RIDE.length) throw new Error('空台 denser');
  if (LIVES !== 3) throw new Error('3 lives');
  if (FLAP >= 0) throw new Error('flap lifts');
  if (lanceWinner(100, 120, LANCE_EPS) !== -1) throw new Error('higher wins');
  if (lanceWinner(120, 100, LANCE_EPS) !== 1) throw new Error('lower loses');
  if (lanceWinner(100, 104, LANCE_EPS) !== 0) throw new Error('near-equal bounce');
  if (lanceWinner(100, 100 + LANCE_EPS, LANCE_EPS) !== 0) throw new Error('eps bounce');
  if (Math.abs(wrapX(-5) - (WORLD_W - 5)) > 0.01) throw new Error('wrap left');
  if (Math.abs(wrapX(WORLD_W + 8) - 8) > 0.01) throw new Error('wrap right');
  if (Math.abs(wrapDx(10, WORLD_W - 10) + 20) > 0.01) throw new Error('wrap dx');
  if (comboMul(1) !== 1) throw new Error('combo 1');
  if (comboMul(2) !== 2) throw new Error('combo 2');
  if (comboMul(5) !== 5) throw new Error('combo cap');
  if (comboMul(9) !== 5) throw new Error('combo max');
  if (hatchType('bounder') !== 'hunter') throw new Error('hatch hunter');
  if (hatchType('hunter') !== 'shadow') throw new Error('hatch shadow');
  if (hatchType('ptero') !== '') throw new Error('ptero no hatch');
  w1 = waveSpec(1, false);
  w1d = waveSpec(1, true);
  w5 = waveSpec(5, false);
  if (w1.b !== 3 || w1.h !== 0) throw new Error('ride wave1');
  if (w1.pteroAfter) throw new Error('ride w1 no ptero after');
  if (!w1d.pteroAfter) throw new Error('dense w1 ptero');
  if (w1d.total <= w1.total) throw new Error('dense more foes');
  if (w5.s < 1) throw new Error('wave5 shadows');
  if (w5.linger >= w1.linger) throw new Error('ptero sooner later');
  if (kindScore('egg') >= kindScore('bounder')) throw new Error('egg < buzzard');
  if (kindScore('shadow') <= kindScore('bounder')) throw new Error('shadow pays');
  if (BEST_KEY !== 'playbox-joust-best') throw new Error('best key');

  a = makeRider('ostrich', 10, 80, 0);
  b = makeRider('bounder', WORLD_W - 10, 80, 2);
  if (!overlapRiders(a, b)) throw new Error('wrap overlap');
  a.x = 200; b.x = 280;
  if (overlapRiders(a, b)) throw new Error('far no overlap');

  list = PLATS_RIDE;
  p = list[6];
  i = platLandIn(list, p.x + 40, p.y - 12, p.y - 20, 12);
  if (i !== 6) throw new Error('land ride bottom');
  if (platLandIn(list, 360, 18, 8, 12) !== -1) throw new Error('air no land');
  if (platLandIn(list, p.x + 40, p.y - EGG_R, p.y - 20, EGG_R) !== 6) throw new Error('egg land');

  low = 0;
  for (i = 0; i < list.length; i++) if (list[i].y > low) low = list[i].y;
  if (low >= LAVA_Y) throw new Error('ride plats above lava');
  low = 0;
  for (i = 0; i < PLATS_DENSE.length; i++) if (PLATS_DENSE[i].y > low) low = PLATS_DENSE[i].y;
  if (low >= LAVA_Y) throw new Error('dense plats above lava');

  s = platSpawnIn(PLATS_RIDE, SPAWN_RIDE);
  if (!xOnPlatIn(PLATS_RIDE, SPAWN_RIDE.plat, SPAWN_RIDE.x)) throw new Error('ride spawn');
  if (s.y >= PLATS_RIDE[SPAWN_RIDE.plat].y) throw new Error('spawn above plat');
  if (!xOnPlatIn(PLATS_DENSE, SPAWN_DENSE.plat, SPAWN_DENSE.x)) throw new Error('dense spawn');
  if (bodyHW({ kind: 'ptero' }) <= bodyHW({ kind: 'bounder' })) throw new Error('ptero bigger');
  if (PTERO_EPS <= LANCE_EPS) throw new Error('ptero harder');
  if (waveSpec(8, true).total < waveSpec(1, true).total) throw new Error('later denser');
}

selfCheck();

if (typeof document === 'undefined') {
  /* node --check / node js/game.js selfCheck only */
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
var btnRide = document.getElementById('btn-ride');
var btnDense = document.getElementById('btn-dense');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnLeft = document.getElementById('btn-left');
var btnRight = document.getElementById('btn-right');
var btnFlap = document.getElementById('btn-flap');
var scoreEl = document.getElementById('score');
var waveEl = document.getElementById('wave');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var tagLabel = document.getElementById('tag-label');
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
var feathers = [];
var motes = [];

var keys = { l: false, r: false, flap: false, flapHeld: false };
var ptr = { down: false, id: null, l: false, r: false };

var G = {
  mode: 'title',
  kind: 'ride',
  dense: false,
  clock: 0,
  wave: 1,
  waveT: 0,
  lives: LIVES,
  score: 0,
  best: 0,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  nextLife: LIFE_AT,
  p1: null,
  foes: [],
  eggs: [],
  spawnQ: [],
  spawnCd: 0,
  ptero: null,
  pteroNeed: false,
  pteroSaid: false,
  clearT: 0,
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flash: 0,
  flashRgb: HOT,
  why: '',
  lock: 0
};

function reduceMotion() {
  return motionQ.matches;
}

function plats() {
  return platsOf(G.dense);
}

function platLand(x, y, prevY) {
  return platLandIn(plats(), x, y, prevY, 12);
}

function platCeil(x, y, prevY) {
  return platCeilIn(plats(), x, y, prevY);
}

function xOnPlat(i, x) {
  return xOnPlatIn(plats(), i, x);
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
      var buf = this.ctx.createBuffer(1, (sr * 0.4) | 0, sr);
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
  flap: function () {
    this.ensure();
    this.beep(255, 0.05, 'square', 0.042, 540);
    this.noise(0.04, 0.042, 1500, 'highpass');
  },
  land: function () {
    this.ensure();
    this.noise(0.05, 0.05, 320, 'bandpass');
    this.beep(142, 0.04, 'sine', 0.03, 66);
  },
  bounce: function () {
    this.ensure();
    this.beep(300, 0.06, 'square', 0.05, 170);
    this.beep(188, 0.07, 'triangle', 0.04, 86);
    this.noise(0.05, 0.048, 680, 'bandpass');
  },
  knock: function (combo) {
    this.ensure();
    var p = 1 + Math.min(6, combo) * 0.07;
    this.noise(0.15, 0.16, 180, 'lowpass');
    this.beep(168 * p, 0.12, 'square', 0.085, 52);
    this.beep(760 * p, 0.08, 'triangle', 0.055, 440 * p);
    this.beep(1120 * p, 0.05, 'square', 0.036, 900 * p);
  },
  egg: function (combo) {
    this.ensure();
    var p = 1 + Math.min(5, combo) * 0.05;
    this.beep(900 * p, 0.07, 'triangle', 0.06, 1360 * p);
    this.beep(1240 * p, 0.1, 'square', 0.04, 1620 * p);
  },
  hatch: function () {
    this.ensure();
    this.noise(0.1, 0.07, 880, 'bandpass');
    this.beep(400, 0.1, 'sawtooth', 0.04, 170);
  },
  die: function () {
    this.ensure();
    this.noise(0.2, 0.13, 250, 'lowpass');
    this.beep(320, 0.24, 'sawtooth', 0.06, 66);
    this.beep(170, 0.2, 'square', 0.04, 46);
  },
  lava: function () {
    this.ensure();
    this.noise(0.22, 0.13, 400, 'lowpass');
    this.beep(86, 0.16, 'sine', 0.05, 38);
  },
  ptero: function () {
    this.ensure();
    this.beep(210, 0.24, 'sawtooth', 0.06, 84);
    this.beep(132, 0.3, 'square', 0.05, 56);
    this.noise(0.22, 0.08, 580, 'bandpass');
  },
  wave: function () {
    this.ensure();
    this.beep(392, 0.08, 'square', 0.05, 523);
    this.beep(523, 0.1, 'square', 0.045, 659);
    this.beep(784, 0.16, 'triangle', 0.04, 1046);
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
    this.beep(440 + n * 44, 0.08, 'square', 0.05, 880 + n * 50);
  },
  oneup: function () {
    this.ensure();
    this.beep(523, 0.08, 'square', 0.05, 784);
    this.beep(784, 0.12, 'triangle', 0.05, 1046);
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
    var n = parseInt(localStorage.getItem(BEST_KEY), 10);
    if (n > 0) G.best = n;
  } catch (e) { /* ignore */ }
}

function persistBest() {
  if (G.score > G.best) G.best = G.score;
  try { localStorage.setItem(BEST_KEY, String(G.best)); } catch (e) { /* ignore */ }
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

function kick(kx, ky) {
  if (reduceMotion()) return;
  G.kickX = kx;
  G.kickY = ky;
  stageEl.classList.remove('hit');
  void stageEl.offsetWidth;
  stageEl.classList.add('hit');
  clearTimeout(kickTok);
  kickTok = setTimeout(function () { stageEl.classList.remove('hit'); }, 160);
}

function flash(rgb, t) {
  G.flashRgb = rgb;
  G.flash = t;
}

function burst(x, y, n, rgb, spd, life, grav) {
  var i, cap;
  cap = 150 - particles.length;
  if (n > cap) n = cap < 0 ? 0 : cap;
  for (i = 0; i < n; i++) {
    particles.push({
      x: x, y: y,
      vx: rand(-1, 1) * spd,
      vy: rand(-1.15, 0.25) * spd,
      t: life * rand(0.55, 1.2),
      max: life,
      r: rand(1.1, 2.7),
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
      vx: rand(-1, 1) * 74,
      vy: rand(-96, -16),
      t: rand(0.1, 0.28),
      rgb: rgb
    });
  }
}

function ringAt(x, y, rgb) {
  rings.push({ x: x, y: y, t: 0, rgb: rgb, r: 5 });
}

function floatText(x, y, text, rgb) {
  floats.push({ x: x, y: y, text: text, t: 0, rgb: rgb });
}

function shed(x, y, rgb, n) {
  var i, a;
  for (i = 0; i < n; i++) {
    a = rand(0, TAU);
    feathers.push({
      x: x, y: y,
      vx: Math.cos(a) * rand(22, 96),
      vy: Math.sin(a) * rand(10, 72) - 52,
      rot: rand(0, TAU),
      vr: rand(-6, 6),
      t: rand(0.35, 0.72),
      rgb: rgb,
      w: rand(3.2, 6.4)
    });
  }
}

function lavaSplash(x) {
  burst(x, LAVA_Y - 4, 18, LAVA, 72, 0.46, 40);
  burst(x, LAVA_Y - 4, 10, GOLD, 52, 0.32, 30);
  spark(x, LAVA_Y - 6, HOT, 8);
}

function toast(msg, warn, gold) {
  toastEl.textContent = msg;
  toastEl.classList.toggle('warn', !!warn);
  toastEl.classList.toggle('gold', !!gold);
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
  var before;
  if (n <= 0 || G.mode !== 'play') return;
  before = G.score;
  G.score += n;
  if (before < G.nextLife && G.score >= G.nextLife) {
    G.lives = Math.min(6, G.lives + 1);
    G.nextLife += LIFE_AT;
    audio.oneup();
    toast('续命', false, true);
    hudPlay();
  }
  flashScore(n);
  persistBest();
  hudPlay();
  if (x != null) floatText(x, y - 16, label || ('+' + n), GOLD);
}

function bumpCombo() {
  G.combo += 1;
  G.comboAge = 0;
  if (G.combo > G.maxCombo) G.maxCombo = G.combo;
  comboEl.textContent = '×' + Math.max(1, comboMul(G.combo));
  if (G.combo >= 2) {
    comboBox.classList.remove('hot');
    void comboBox.offsetWidth;
    comboBox.classList.add('hot');
  }
  if (G.combo === 3 || G.combo === 6 || G.combo === 10) {
    audio.combo(G.combo);
    toast(G.combo >= 10 ? '连撞 ×' + G.combo : '连撞', false, true);
  }
}

function renderPips() {
  var html = '';
  var i;
  var n = Math.max(LIVES, G.lives);
  for (i = 0; i < n; i++) {
    html += '<i class="pip ' + (i < G.lives ? 'on' : 'gone') + '"></i>';
  }
  pipsEl.innerHTML = html;
}

function hudPlay() {
  scoreEl.textContent = String(G.score);
  waveEl.textContent = String(G.wave);
  bestEl.textContent = String(G.best);
  comboEl.textContent = '×' + Math.max(1, G.combo);
  renderPips();
  modeLabel.textContent = G.dense ? '空台' : '骑鸟';
  modeLabel.classList.toggle('dense', G.dense);
  if (G.ptero && !G.ptero.dead && G.mode === 'play') {
    tagLabel.textContent = '翼龙';
    tagLabel.classList.add('warn');
  } else {
    tagLabel.textContent = 'JOST';
    tagLabel.classList.remove('warn');
  }
  if (G.mode === 'play') {
    hintEl.textContent = G.dense
      ? '空台更密 · ←→ / AD 移动 · 空格扇翅 · 从上面撞'
      : '← → / A D 移动 · 空格扇翅 · 从上面撞 · 波后再打翼龙';
  }
}

function resetFx() {
  particles.length = 0;
  sparks.length = 0;
  floats.length = 0;
  rings.length = 0;
  feathers.length = 0;
  G.stop = 0;
  G.shake = 0;
  G.kickX = 0;
  G.kickY = 0;
  G.flash = 0;
}

function seedMotes() {
  var i;
  motes.length = 0;
  for (i = 0; i < 32; i++) {
    motes.push({
      x: rand(0, WORLD_W),
      y: rand(16, LAVA_Y - 18),
      s: rand(0.55, 1.8),
      v: rand(5, 16),
      ph: rand(0, TAU)
    });
  }
}

function queueWave(wave) {
  var spec = waveSpec(wave, G.dense);
  var i;
  G.spawnQ = [];
  for (i = 0; i < spec.b; i++) G.spawnQ.push('bounder');
  for (i = 0; i < spec.h; i++) G.spawnQ.push('hunter');
  for (i = 0; i < spec.s; i++) G.spawnQ.push('shadow');
  G.spawnCd = G.dense ? 0.22 : 0.36;
  G.pteroNeed = spec.pteroAfter;
  G.pteroSaid = false;
  G.ptero = null;
  G.waveT = 0;
  G.clearT = 0;
}

function spawnFoe(kind) {
  var fromLeft = Math.random() < 0.5;
  var y = rand(44, 240);
  var x = fromLeft ? 20 : WORLD_W - 20;
  var r = makeRider(kind, x, y, 2);
  r.grounded = false;
  r.plat = -1;
  r.face = fromLeft ? 1 : -1;
  r.vx = r.face * 76;
  r.vy = -36;
  r.inv = 0.32;
  r.ai.tx = WORLD_W * 0.5;
  r.ai.ty = y - 18;
  G.foes.push(r);
  if (G.mode === 'play') {
    burst(x, y, 8, kindRgb(kind), 36, 0.28, 10);
    audio.ui();
  }
}

function spawnPtero() {
  var fromLeft = Math.random() < 0.5;
  var r = makeRider('ptero', fromLeft ? 28 : WORLD_W - 28, 66, 2);
  r.grounded = false;
  r.face = fromLeft ? 1 : -1;
  r.vx = r.face * 96;
  r.vy = 0;
  G.ptero = r;
  G.pteroSaid = true;
  if (G.mode === 'play') {
    audio.ptero();
    toast('翼龙来了', true, false);
    flash(GOLD, 0.16);
    shake(5);
    hudPlay();
  }
}

function liveBuzz() {
  var n = 0, i;
  for (i = 0; i < G.foes.length; i++) if (!G.foes[i].dead) n++;
  return n;
}

function livePtero() {
  return G.ptero && !G.ptero.dead ? 1 : 0;
}

function higherPlatIndex(ex, ey) {
  var list = plats();
  var i, p, best = -1, bestS = 1e9, s, cx, dx;
  for (i = 0; i < list.length; i++) {
    p = list[i];
    if (p.y >= ey - 10) continue;
    cx = p.x + p.w * 0.5;
    dx = Math.abs(wrapDx(cx, ex));
    s = dx * 0.85 + Math.abs(p.y - (ey - 44)) * 0.4;
    if (s < bestS) { bestS = s; best = i; }
  }
  return best;
}

function nearestPlatIndex(x, y) {
  var list = plats();
  var i, p, best = -1, bestS = 1e9, s, cx, fy;
  for (i = 0; i < list.length; i++) {
    p = list[i];
    cx = p.x + p.w * 0.5;
    fy = p.y - 12;
    s = Math.abs(wrapDx(cx, x)) + Math.abs(fy - y) * 0.55;
    if (y > p.y + 10) s += 36;
    if (s < bestS) { bestS = s; best = i; }
  }
  return best;
}

function resetArena(attract) {
  var spec = spawnOf(G.dense);
  var s = platSpawnIn(plats(), spec);
  G.p1 = makeRider('ostrich', s.x, s.y, 0);
  G.p1.grounded = true;
  G.p1.plat = spec.plat;
  G.foes = [];
  G.eggs = [];
  G.ptero = null;
  G.spawnQ = [];
  G.clearT = 0;
  G.combo = 0;
  G.comboAge = 0;
  if (!attract) resetFx();
  seedMotes();
}

function startRun(kind) {
  hintEl.classList.remove('warn', 'hot');
  G.kind = kind;
  G.dense = kind === 'dense';
  G.mode = 'play';
  G.clock = 0;
  G.wave = 1;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  G.maxCombo = 0;
  G.comboAge = 0;
  G.nextLife = LIFE_AT;
  G.why = '';
  G.lock = 0;
  resetArena(false);
  G.p1.inv = 0.85;
  queueWave(1);
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  panelEl.className = 'panel';
  audio.start();
  hudPlay();
  toast(G.dense ? '空台 第 1 波' : '第 1 波', false, true);
  canvas.focus({ preventScroll: true });
}

function showTitle() {
  hintEl.classList.remove('warn', 'hot');
  G.mode = 'title';
  G.dense = false;
  G.kind = 'ride';
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel';
  ovKicker.textContent = 'JOST';
  ovTitle.textContent = '骑鸟';
  ovLead.textContent = '空台上扇翅对撞。从更高处撞上去，对方炸成蛋。波次打完会出翼龙。';
  ovOps.textContent = '← → / A D 移动 · 空格扇翅 · 空台更密 · R 重开 · M 静音';
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
  hintEl.textContent = '从上面撞才算赢 · 同高弹开 · 更低你就完蛋 · 波后再打翼龙';
  resetArena(true);
  G.p1.inv = 0;
  G.p1.dead = false;
  queueWave(1);
  G.spawnCd = 0.2;
  spawnFoe('bounder');
  spawnFoe('hunter');
  hudPlay();
}

function whyText(w) {
  if (w === 'joust') return '被压住了';
  if (w === 'lava') return '掉进岩浆';
  if (w === 'ptero') return '翼龙啄中';
  return '';
}

function showOver() {
  G.mode = 'over';
  persistBest();
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel lose';
  ovKicker.textContent = 'JOST';
  ovTitle.textContent = '落台';
  ovLead.textContent = (G.dense ? '空台' : '骑鸟') + ' · 第 ' + G.wave + ' 波 · ' +
    G.score + ' 分 · 连撞最高 ×' + Math.max(1, comboMul(Math.max(1, G.maxCombo))) +
    (G.why ? ' · ' + whyText(G.why) : '');
  ovOps.textContent = 'R 或「再骑」重开 · 顶栏重开随时可用';
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
  audio.over();
  hintEl.classList.add('warn');
  hintEl.textContent = 'R 再骑 · 换台回标题';
  ovRetry.focus();
}

function retry() {
  audio.ui();
  hintEl.classList.remove('warn');
  if (G.mode === 'title') startRun('ride');
  else startRun(G.kind);
}

function nextWave() {
  var bonus = 200 * G.wave;
  persistBest();
  addScore(bonus, G.p1 ? G.p1.x : WORLD_W * 0.5, 80, '清波 +' + bonus);
  G.wave += 1;
  queueWave(G.wave);
  hudPlay();
  toast('第 ' + G.wave + ' 波', false, true);
  audio.wave();
  if (G.p1 && !G.p1.dead) G.p1.inv = Math.max(G.p1.inv, 0.32);
}

/* ---- physics ---- */
function doFlap(r, playSfx) {
  var launch;
  if (r.dead) return;
  launch = r.grounded;
  r.grounded = false;
  r.plat = -1;
  if (launch) r.vy = FLAP;
  else r.vy += FLAP * 0.66;
  if (r.vy < MAX_UP) r.vy = MAX_UP;
  r.flapT = 0.16;
  r.flapCd = r.flapHeld ? PAD_FLAP : 0.085;
  r.sqY = 1.18;
  r.sqX = 0.86;
  if (playSfx && G.mode === 'play') {
    audio.flap();
    burst(r.x, r.y + 8, 4, [255, 220, 170], 28, 0.18, 8);
  }
}

function landOn(r, i) {
  var p = plats()[i];
  r.y = p.y - 12;
  r.vy = 0;
  r.grounded = true;
  r.plat = i;
  r.sqY = 0.74;
  r.sqX = 1.22;
  if (G.mode === 'play' && r.team < 2) audio.land();
  burst(r.x, p.y, 5, [180, 140, 90], 22, 0.18, 6);
}

function applySteer(r, dt) {
  var accv = accelOf(r, G.wave, G.dense);
  var cap = maxVxOf(r, G.wave, G.dense);
  var hold = r.wantL || r.wantR;
  if (r.wantL && !r.wantR) {
    r.vx -= accv * dt;
    r.face = -1;
  } else if (r.wantR && !r.wantL) {
    r.vx += accv * dt;
    r.face = 1;
  }
  if (r.vx > cap) r.vx = cap;
  if (r.vx < -cap) r.vx = -cap;
  if (!hold) {
    if (r.grounded) r.vx *= Math.exp(-FRICT_G * dt);
    else r.vx *= Math.exp(-FRICT_A * dt);
    if (Math.abs(r.vx) < 4) r.vx = 0;
  }
}

function tickRider(r, dt, aiOn, playSfx) {
  var prevY, landed, ceil;
  if (r.dead) {
    r.deadT += dt;
    r.vy = Math.min(MAX_FALL, r.vy + GRAV * dt);
    r.y += r.vy * dt;
    r.x = wrapX(r.x + r.vx * dt);
    r.sqX = lerp(r.sqX, 1, 0.2);
    r.sqY = lerp(r.sqY, 1, 0.2);
    return;
  }
  if (r.inv > 0) r.inv -= dt;
  if (r.flapT > 0) r.flapT -= dt;
  if (r.flapCd > 0) r.flapCd -= dt;
  if (r.spawnT > 0) r.spawnT -= dt;
  r.sqX = lerp(r.sqX, 1, 1 - Math.pow(0.0008, dt));
  r.sqY = lerp(r.sqY, 1, 1 - Math.pow(0.0008, dt));

  if (aiOn) thinkAI(r, dt);

  if (r.flapBuf > 0) r.flapBuf -= dt;
  if ((r.flapEdge || r.flapBuf > 0 || (r.flapHeld && r.flapCd <= 0)) && r.flapCd <= 0.001) {
    doFlap(r, playSfx);
    r.flapBuf = 0;
  }
  r.flapEdge = false;

  applySteer(r, dt);
  r.x = wrapX(r.x + r.vx * dt);
  if (r.grounded) r.walk += Math.abs(r.vx) * dt * 0.08;
  else r.walk += dt * 2.1;

  if (r.kind === 'ptero') {
    r.grounded = false;
    r.plat = -1;
    r.vy = Math.min(MAX_FALL * 0.55, r.vy + GRAV * 0.34 * dt);
    if (r.vy > 92) r.vy = 92;
    r.y += r.vy * dt;
    if (r.y < 28) { r.y = 28; r.vy = Math.max(r.vy, 0); }
    if (r.y > LAVA_Y - 30) { r.y = LAVA_Y - 30; r.vy = -86; }
    return;
  }

  if (r.grounded) {
    if (r.plat < 0 || !xOnPlat(r.plat, r.x)) {
      r.grounded = false;
      r.plat = -1;
      r.vy = 16;
    } else {
      r.y = plats()[r.plat].y - 12;
      r.vy = 0;
    }
  }

  if (!r.grounded) {
    r.vy = Math.min(MAX_FALL, r.vy + GRAV * dt);
    prevY = r.y;
    r.y += r.vy * dt;
    if (r.vy >= -12) {
      landed = platLand(r.x, r.y, prevY);
      if (landed >= 0) landOn(r, landed);
    }
    if (!r.grounded && r.vy < 0) {
      ceil = platCeil(r.x, r.y, prevY);
      if (ceil >= 0) {
        r.y = plats()[ceil].y + plats()[ceil].h + 12;
        r.vy = 18;
      }
    }
  }
}

function iThinkPlat(r) {
  var list = plats();
  var i = nearestPlatIndex(r.x, r.y);
  var p, edge;
  if (Math.random() < 0.55) i = (Math.random() * list.length) | 0;
  p = list[i];
  edge = Math.random() < 0.5 ? p.x + 18 : p.x + p.w - 18;
  r.ai.tx = edge;
  r.ai.ty = p.y - 16;
  r.ai.chase = false;
}

function thinkAI(r, dt) {
  var prey, dx, ty, hi, p;
  r.ai.think -= dt;
  r.ai.flapCd -= dt;
  r.ai.phase += dt;

  if (r.team < 2) {
    prey = null;
    if (G.ptero && !G.ptero.dead) prey = G.ptero;
    else {
      prey = nearestFoe(r);
    }
  } else {
    prey = G.p1 && !G.p1.dead ? G.p1 : null;
  }

  if (r.kind === 'ptero') {
    ty = (prey ? prey.y - 8 : 80) + Math.sin(r.ai.phase * 1.55) * 28;
    dx = prey ? wrapDx(r.x, prey.x + prey.vx * 0.22) : r.face * 40;
    r.wantL = dx < -12;
    r.wantR = dx > 12;
    if (r.y > ty + 8 && r.ai.flapCd <= 0) {
      r.flapBuf = FLAP_BUF;
      r.ai.flapCd = 0.1;
    }
    return;
  }

  if (r.ai.think <= 0) {
    r.ai.think = r.kind === 'bounder' ? rand(0.65, 1.9) : rand(0.26, 0.8);
    if (r.kind === 'bounder' && Math.random() < 0.44) iThinkPlat(r);
    else if (prey) {
      r.ai.tx = prey.x;
      r.ai.ty = prey.y - (r.kind === 'shadow' ? 26 : 16);
      r.ai.chase = true;
    } else iThinkPlat(r);
  }

  if (prey && r.kind !== 'bounder') {
    r.ai.tx = prey.x + prey.vx * (r.kind === 'shadow' ? 0.36 : 0.2);
    r.ai.ty = prey.y - (r.kind === 'shadow' ? 28 : 16);
    r.ai.chase = true;
    if (r.y > prey.y - 4) {
      hi = higherPlatIndex(r.x, r.y);
      if (hi >= 0) {
        p = plats()[hi];
        r.ai.tx = p.x + p.w * 0.5;
        r.ai.ty = p.y - 18;
      }
    }
  }

  dx = wrapDx(r.x, r.ai.tx);
  r.wantL = dx < -11;
  r.wantR = dx > 11;

  if (r.y > r.ai.ty + 8 || (r.grounded && (r.ai.chase || Math.random() < 0.002))) {
    if (r.ai.flapCd <= 0) {
      r.flapBuf = FLAP_BUF;
      r.ai.flapCd = r.kind === 'bounder' ? rand(0.14, 0.3)
        : (r.kind === 'shadow' ? 0.08 : 0.115);
    }
  }
}

function nearestFoe(r) {
  var i, p, d, best = null, bestD = 1e9;
  for (i = 0; i < G.foes.length; i++) {
    p = G.foes[i];
    if (p.dead) continue;
    d = Math.abs(wrapDx(r.x, p.x)) + Math.abs(r.y - p.y) * 0.65;
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

function dropEgg(x, y, vx, from) {
  var next = hatchType(from);
  if (!next) return;
  G.eggs.push({
    x: wrapX(x),
    y: y,
    vx: vx * 0.35 + rand(-30, 30),
    vy: -40,
    t: HATCH_T,
    from: from,
    hatch: next,
    grounded: false
  });
}

function explodeRider(r, byPlayer) {
  var rgb = kindRgb(r.kind);
  r.dead = true;
  r.deadT = 0;
  r.grounded = false;
  burst(r.x, r.y, 22, rgb, 110, 0.42, 28);
  burst(r.x, r.y, 10, WHT, 70, 0.28, 16);
  shed(r.x, r.y, rgb, 9);
  spark(r.x, r.y, GOLD, 10);
  ringAt(r.x, r.y, rgb);
  if (byPlayer && r.kind !== 'ptero') dropEgg(r.x, r.y, r.vx, r.kind);
}

function killPlayer(why) {
  var r = G.p1;
  if (!r || r.dead || r.inv > 0 || G.mode !== 'play') return;
  r.dead = true;
  r.deadT = 0;
  r.why = why;
  G.why = why;
  G.combo = 0;
  G.comboAge = 0;
  G.lock = DIE_T;
  burst(r.x, r.y, 28, CYN, 130, 0.5, 30);
  shed(r.x, r.y, CYN, 12);
  flash(MAG, 0.18);
  shake(8);
  kick(0, 5);
  stageEl.classList.remove('die');
  void stageEl.offsetWidth;
  stageEl.classList.add('die');
  if (why === 'lava') {
    audio.lava();
    lavaSplash(r.x);
  } else audio.die();
  hudPlay();
}

function respawnPlayer() {
  var spec = spawnOf(G.dense);
  var s, hi;
  G.lives -= 1;
  if (G.lives <= 0) {
    hudPlay();
    showOver();
    return;
  }
  hi = higherPlatIndex(WORLD_W * 0.5, LAVA_Y - 40);
  if (hi >= 0 && Math.random() < 0.45) {
    spec = { plat: hi, x: plats()[hi].x + plats()[hi].w * 0.5 };
  }
  s = platSpawnIn(plats(), spec);
  G.p1 = makeRider('ostrich', s.x, s.y, 0);
  G.p1.grounded = true;
  G.p1.plat = spec.plat;
  G.p1.inv = INVULN;
  G.p1.spawnT = 0.12;
  burst(s.x, s.y, 10, CYN, 40, 0.28, 8);
  hudPlay();
}

function bouncePair(a, b) {
  var dx = wrapDx(a.x, b.x);
  var nx = dx === 0 ? (a.face || 1) : (dx > 0 ? 1 : -1);
  a.vx = -nx * Math.max(90, Math.abs(a.vx) * 0.7 + 50);
  b.vx = nx * Math.max(90, Math.abs(b.vx) * 0.7 + 50);
  a.vy = Math.min(a.vy, -40);
  b.vy = Math.min(b.vy, -36);
  a.grounded = false;
  b.grounded = false;
  a.sqX = 1.18;
  b.sqX = 1.18;
  audio.bounce();
  burst((a.x + b.x) * 0.5, (a.y + b.y) * 0.5, 8, WHT, 40, 0.2, 8);
}

function resolveBump(a, b) {
  var eps, w, midX, midY, isPtero, high, low;
  if (!overlapRiders(a, b)) return;
  if (a.dead || b.dead) return;
  isPtero = a.kind === 'ptero' || b.kind === 'ptero';
  eps = isPtero ? PTERO_EPS : LANCE_EPS;
  w = lanceWinner(lanceY(a), lanceY(b), eps);
  midX = wrapX(a.x + wrapDx(a.x, b.x) * 0.5);
  midY = (a.y + b.y) * 0.5;
  if (w === 0) {
    bouncePair(a, b);
    return;
  }
  high = w < 0 ? a : b;
  low = w < 0 ? b : a;
  if (low.inv > 0) {
    bouncePair(a, b);
    return;
  }
  if (high.team === 0 && low.team === 2) winBump(high, low, midX, midY, isPtero);
  else if (high.team === 2 && low.team === 0) killPlayer(isPtero ? 'ptero' : 'joust');
  else bouncePair(a, b);
}

function winBump(winner, loser, x, y, isPtero) {
  var mul, pts;
  bumpCombo();
  mul = comboMul(G.combo);
  pts = kindScore(loser.kind) * mul;
  addScore(pts, x, y, kindLabel(loser.kind) + ' +' + pts);
  explodeRider(loser, true);
  winner.vy = Math.min(winner.vy, -70);
  winner.grounded = false;
  winner.sqY = 1.2;
  hitStop(isPtero ? 0.075 : 0.055);
  kick(winner.face * 4, 4);
  shake(isPtero ? 7 : 4);
  flash(kindRgb(loser.kind), 0.1);
  audio.knock(G.combo);
}

function tickEggs(dt) {
  var i, e, prevY, land, list, hat;
  list = plats();
  for (i = G.eggs.length - 1; i >= 0; i--) {
    e = G.eggs[i];
    e.t -= dt;
    e.x = wrapX(e.x + e.vx * dt);
    if (e.grounded) {
      e.vx *= Math.exp(-5 * dt);
      if (e.plat == null || !xOnPlatIn(list, e.plat, e.x)) {
        e.grounded = false;
        e.vy = 20;
      }
    } else {
      e.vy = Math.min(MAX_FALL, e.vy + GRAV * dt);
      prevY = e.y;
      e.y += e.vy * dt;
      land = platLandIn(list, e.x, e.y, prevY, EGG_R);
      if (land >= 0) {
        e.y = list[land].y - EGG_R;
        e.vy = 0;
        e.grounded = true;
        e.plat = land;
        e.vx *= 0.45;
      }
    }
    if (e.y + EGG_R >= LAVA_Y) {
      lavaSplash(e.x);
      G.eggs.splice(i, 1);
      continue;
    }
    if (G.p1 && !G.p1.dead && Math.abs(wrapDx(G.p1.x, e.x)) < 14 && Math.abs(G.p1.y - e.y) < 16) {
      bumpCombo();
      addScore(kindScore('egg') * comboMul(G.combo), e.x, e.y, '捡蛋 +' + (kindScore('egg') * comboMul(G.combo)));
      audio.egg(G.combo);
      burst(e.x, e.y, 12, GOLD, 50, 0.28, 12);
      ringAt(e.x, e.y, GOLD);
      G.eggs.splice(i, 1);
      continue;
    }
    if (e.t <= 0) {
      hat = makeRider(e.hatch, e.x, e.y - 8, 2);
      hat.grounded = e.grounded;
      hat.plat = e.plat == null ? -1 : e.plat;
      hat.inv = 0.4;
      hat.vy = -80;
      G.foes.push(hat);
      audio.hatch();
      burst(e.x, e.y, 14, kindRgb(e.hatch), 48, 0.3, 14);
      toast(kindLabel(e.hatch) + '孵出', true, false);
      G.eggs.splice(i, 1);
    }
  }
}

function tickLava(r) {
  if (!r || r.dead) return;
  if (feetY(r) >= LAVA_Y - 2) {
    if (r.team === 0) {
      if (G.mode === 'play') killPlayer('lava');
      else {
        r.y = LAVA_Y - 48;
        r.vy = FLAP;
        r.grounded = false;
      }
    } else {
      r.dead = true;
      r.deadT = 0;
      lavaSplash(r.x);
    }
  }
}

function cullDead() {
  var i;
  for (i = G.foes.length - 1; i >= 0; i--) {
    if (G.foes[i].dead && G.foes[i].deadT > 0.7) G.foes.splice(i, 1);
  }
  if (G.ptero && G.ptero.dead && G.ptero.deadT > 0.8) G.ptero = null;
}

function applyPlayerInput() {
  var r = G.p1;
  if (!r || r.dead) return;
  r.wantL = keys.l || ptr.l;
  r.wantR = keys.r || ptr.r;
  r.flapHeld = keys.flapHeld;
  if (keys.flap) {
    r.flapEdge = true;
    keys.flap = false;
  }
}

function attractInput() {
  if (G.p1 && !G.p1.dead) thinkAI(G.p1, STEP);
}

function tickWave(dt) {
  var spec, buzzing, waiting;
  if (G.mode !== 'play') return;
  G.waveT += dt;
  spec = waveSpec(G.wave, G.dense);
  buzzing = liveBuzz();
  if (G.spawnQ.length && buzzing < spec.maxOn) {
    G.spawnCd -= dt;
    if (G.spawnCd <= 0) {
      spawnFoe(G.spawnQ.shift());
      G.spawnCd = G.dense ? rand(0.18, 0.38) : rand(0.32, 0.62);
    }
  }
  if (!G.pteroSaid && G.waveT >= spec.linger) spawnPtero();
  waiting = G.spawnQ.length + buzzing + G.eggs.length;
  if (waiting === 0 && !G.pteroSaid && G.pteroNeed) spawnPtero();
  if (waiting === 0 && (G.pteroSaid ? !livePtero() : !G.pteroNeed)) {
    G.clearT += dt;
    if (G.clearT > 0.85) nextWave();
  } else G.clearT = 0;
}

function tickWorld(dt) {
  var i, playSfx;
  playSfx = G.mode === 'play';
  if (G.mode === 'play') {
    if (G.lock > 0) {
      G.lock -= dt;
      if (G.p1) tickRider(G.p1, dt, false, false);
      if (G.lock <= 0 && G.p1 && G.p1.dead) respawnPlayer();
    } else {
      applyPlayerInput();
      tickRider(G.p1, dt, false, playSfx);
    }
  } else if (G.mode === 'title') {
    attractInput();
    tickRider(G.p1, dt, false, false);
  } else if (G.p1) {
    tickRider(G.p1, dt, false, false);
  }

  for (i = 0; i < G.foes.length; i++) tickRider(G.foes[i], dt, true, false);
  if (G.ptero) tickRider(G.ptero, dt, true, false);
  tickEggs(dt);

  if (G.mode === 'play' && G.p1 && !G.p1.dead && G.lock <= 0) {
    for (i = 0; i < G.foes.length; i++) resolveBump(G.p1, G.foes[i]);
    if (G.ptero) resolveBump(G.p1, G.ptero);
  }
  if (G.mode === 'title' && G.p1 && !G.p1.dead) {
    for (i = 0; i < G.foes.length; i++) {
      if (overlapRiders(G.p1, G.foes[i]) && !G.foes[i].dead) {
        if (lanceWinner(lanceY(G.p1), lanceY(G.foes[i]), LANCE_EPS) < 0) {
          explodeRider(G.foes[i], false);
        } else bouncePair(G.p1, G.foes[i]);
      }
    }
  }

  tickLava(G.p1);
  for (i = 0; i < G.foes.length; i++) tickLava(G.foes[i]);
  cullDead();
  tickWave(dt);
  if (G.mode === 'title' && liveBuzz() < 2) {
    G.spawnCd -= dt;
    if (G.spawnCd <= 0) {
      spawnFoe(Math.random() < 0.65 ? 'bounder' : 'hunter');
      G.spawnCd = 1.4;
    }
  }

  if (G.combo > 0) {
    G.comboAge += dt;
    if (G.comboAge > COMBO_WIN) {
      G.combo = 0;
      G.comboAge = 0;
      comboEl.textContent = '×1';
    }
  }
}

function tickFx(dt) {
  var i, p;
  for (i = particles.length - 1; i >= 0; i--) {
    p = particles[i];
    p.t -= dt;
    p.vy += p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.t <= 0) particles.splice(i, 1);
  }
  for (i = sparks.length - 1; i >= 0; i--) {
    p = sparks[i];
    p.t -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 80 * dt;
    if (p.t <= 0) sparks.splice(i, 1);
  }
  for (i = feathers.length - 1; i >= 0; i--) {
    p = feathers[i];
    p.t -= dt;
    p.vy += 38 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    p.vx *= Math.exp(-1.2 * dt);
    if (p.t <= 0) feathers.splice(i, 1);
  }
  for (i = rings.length - 1; i >= 0; i--) {
    p = rings[i];
    p.t += dt;
    p.r += 90 * dt;
    if (p.t > 0.35) rings.splice(i, 1);
  }
  for (i = floats.length - 1; i >= 0; i--) {
    p = floats[i];
    p.t += dt;
    p.y -= 28 * dt;
    if (p.t > 0.7) floats.splice(i, 1);
  }
  for (i = 0; i < motes.length; i++) {
    p = motes[i];
    p.ph += dt * 0.6;
    p.x = wrapX(p.x + Math.sin(p.ph) * p.v * dt * 0.2);
    p.y += Math.sin(p.ph * 1.7) * dt * 6;
    if (p.y < 10) p.y = LAVA_Y - 20;
    if (p.y > LAVA_Y - 8) p.y = 20;
  }
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
  G.kickX = lerp(G.kickX, 0, 1 - Math.pow(0.0002, dt));
  G.kickY = lerp(G.kickY, 0, 1 - Math.pow(0.0002, dt));
  if (G.flash > 0) G.flash = Math.max(0, G.flash - dt);
}

/* ---- draw ---- */
function fit() {
  var rect = stageEl.getBoundingClientRect();
  cssW = Math.max(1, rect.width);
  cssH = Math.max(1, rect.height);
  dpr = Math.min(2.25, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(cssW * dpr));
  canvas.height = Math.max(1, Math.round(cssH * dpr));
  var sx = cssW / WORLD_W;
  var sy = cssH / WORLD_H;
  L.s = Math.min(sx, sy);
  L.x = (cssW - WORLD_W * L.s) * 0.5;
  L.y = (cssH - WORLD_H * L.s) * 0.5;
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

function drawCave() {
  var g, i, t;
  ctx.fillStyle = '#0a0610';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  g = ctx.createLinearGradient(0, 0, 0, WORLD_H);
  g.addColorStop(0, 'rgba(255,154,40,0.07)');
  g.addColorStop(0.55, 'rgba(255,61,184,0.04)');
  g.addColorStop(1, 'rgba(255,74,24,0.1)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  ctx.fillStyle = 'rgba(18, 10, 16, 0.9)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (i = 0; i <= 12; i++) {
    t = i / 12;
    ctx.lineTo(t * WORLD_W, 10 + Math.sin(t * 9 + 0.4) * 10 + (i % 2) * 8);
  }
  ctx.lineTo(WORLD_W, 0);
  ctx.closePath();
  ctx.fill();

  for (i = 0; i < motes.length; i++) {
    t = motes[i];
    ctx.fillStyle = rgba(i % 2 ? GOLD : CYN, 0.18 + 0.12 * Math.sin(t.ph));
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.s, 0, TAU);
    ctx.fill();
  }
}

function drawLava(clock) {
  var x, y, g;
  g = ctx.createLinearGradient(0, LAVA_Y - 18, 0, WORLD_H);
  g.addColorStop(0, 'rgba(255,154,40,0.0)');
  g.addColorStop(0.25, 'rgba(255,74,24,0.55)');
  g.addColorStop(1, 'rgba(120,10,30,0.95)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, WORLD_H);
  ctx.lineTo(0, LAVA_Y);
  for (x = 0; x <= WORLD_W; x += 8) {
    y = LAVA_Y + Math.sin(x * 0.05 + clock * 3.2) * 2.4 + Math.sin(x * 0.12 + clock * 5) * 1.4;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(WORLD_W, WORLD_H);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,227,107,0.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (x = 0; x <= WORLD_W; x += 8) {
    y = LAVA_Y + Math.sin(x * 0.05 + clock * 3.2) * 2.4 + Math.sin(x * 0.12 + clock * 5) * 1.4;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawPlatforms() {
  var list = plats();
  var i, p, g;
  for (i = 0; i < list.length; i++) {
    p = list[i];
    g = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h + 6);
    g.addColorStop(0, 'rgba(255, 210, 120, 0.95)');
    g.addColorStop(0.35, 'rgba(180, 90, 40, 0.95)');
    g.addColorStop(1, 'rgba(50, 20, 28, 0.9)');
    ctx.fillStyle = g;
    roundRect(p.x, p.y, p.w, p.h, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 227, 107, 0.55)';
    ctx.fillRect(p.x + 3, p.y + 1, p.w - 6, 2);
    ctx.strokeStyle = 'rgba(255, 154, 40, 0.45)';
    ctx.lineWidth = 1;
    roundRect(p.x, p.y, p.w, p.h, 3);
    ctx.stroke();
  }
}

function drawEgg(e) {
  var pulse = 0.5 + 0.5 * Math.sin((HATCH_T - e.t) * 8);
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = rgba(GOLD, 0.2 + pulse * 0.25);
  ctx.beginPath();
  ctx.ellipse(0, 0, EGG_R + 3, EGG_R + 4, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff3c2';
  ctx.beginPath();
  ctx.ellipse(0, 0, EGG_R * 0.85, EGG_R * 1.1, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,154,40,0.55)';
  ctx.beginPath();
  ctx.ellipse(-1.2, -1.4, 1.6, 2.1, -0.4, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawBird(r) {
  var wing, rgb, lance, beak, rider;
  wing = r.flapT > 0 ? -0.7 : (r.grounded ? 0.15 : Math.sin(r.walk * 6) * 0.25);
  rgb = kindRgb(r.kind);
  if (r.kind === 'ostrich') { lance = CYN; beak = GOLD; rider = HOT; }
  else if (r.kind === 'ptero') { lance = GOLD; beak = LAVA; rider = GOLD; }
  else { lance = rgb; beak = GOLD; rider = WHT; }

  ctx.save();
  ctx.translate(r.x, r.y);
  ctx.scale((r.face || 1) * r.sqX, r.sqY);

  if (r.kind === 'ptero') {
    ctx.fillStyle = rgba(GOLD, 0.22);
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 10, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.85);
    ctx.beginPath();
    ctx.ellipse(-2, -2, 16, 4.5, wing * 0.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.ellipse(4, 1, 14, 6, 0.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(LAVA, 1);
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(28, -3);
    ctx.lineTo(18, 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1a0a10';
    ctx.beginPath();
    ctx.arc(10, -1, 1.4, 0, TAU);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.fillStyle = rgba(rgb, 0.18);
  ctx.beginPath();
  ctx.ellipse(-2, 6, 10, 4.5, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = rgba(rgb, 0.95);
  ctx.beginPath();
  ctx.ellipse(-2, 4, 9.5, 5.6, 0.12, 0, TAU);
  ctx.fill();

  ctx.save();
  ctx.translate(-1, 1);
  ctx.rotate(wing);
  ctx.fillStyle = rgba(rgb, 0.8);
  ctx.beginPath();
  ctx.ellipse(-2, -4, 7, 3.4, -0.2, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = rgba(beak, 0.95);
  ctx.lineWidth = 2.1;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(4, 1);
  ctx.quadraticCurveTo(8, -6, 7, -11);
  ctx.stroke();

  ctx.fillStyle = rgba(rider, 1);
  ctx.beginPath();
  ctx.arc(6.2, -13.2, 3.1, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(lance, 1);
  ctx.fillRect(6.8, -14.6, 13, 1.35);
  ctx.beginPath();
  ctx.moveTo(20, -15.4);
  ctx.lineTo(24.5, -13.9);
  ctx.lineTo(20, -12.4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = rgba(beak, 1);
  ctx.beginPath();
  ctx.moveTo(7.4, -11.4);
  ctx.lineTo(11.2, -10.2);
  ctx.lineTo(7.6, -9.2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#14080c';
  ctx.beginPath();
  ctx.arc(7.4, -11.6, 0.7, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = rgba(rgb, 0.9);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-6, 8);
  ctx.lineTo(-8, 13);
  ctx.moveTo(1, 8);
  ctx.lineTo(3, 13);
  ctx.stroke();

  ctx.restore();
}

function drawRiderWrapped(r) {
  var blink = r.inv > 0 && ((r.inv * 18) | 0) % 2 === 0;
  if (blink && !r.dead) return;
  if (r.dead && r.deadT > 0.12) {
    ctx.globalAlpha = Math.max(0, 1 - r.deadT * 1.4);
  }
  drawBird(r);
  if (r.x < 28) {
    r.x += WORLD_W;
    drawBird(r);
    r.x -= WORLD_W;
  } else if (r.x > WORLD_W - 28) {
    r.x -= WORLD_W;
    drawBird(r);
    r.x += WORLD_W;
  }
  ctx.globalAlpha = 1;
}

function drawFx() {
  var i, p, a;
  for (i = 0; i < particles.length; i++) {
    p = particles[i];
    a = clamp(p.t / (p.max || 0.4), 0, 1);
    ctx.fillStyle = rgba(p.rgb, a);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * a, 0, TAU);
    ctx.fill();
  }
  ctx.lineWidth = 1.2;
  for (i = 0; i < sparks.length; i++) {
    p = sparks[i];
    ctx.strokeStyle = rgba(p.rgb, clamp(p.t * 5, 0, 1));
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
    ctx.stroke();
  }
  for (i = 0; i < feathers.length; i++) {
    p = feathers[i];
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = rgba(p.rgb, clamp(p.t * 2.2, 0, 0.9));
    ctx.beginPath();
    ctx.ellipse(0, 0, p.w, p.w * 0.35, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.lineWidth = 2;
  for (i = 0; i < rings.length; i++) {
    p = rings[i];
    ctx.strokeStyle = rgba(p.rgb, 1 - p.t / 0.35);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, TAU);
    ctx.stroke();
  }
  ctx.font = '700 11px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
  ctx.textAlign = 'center';
  for (i = 0; i < floats.length; i++) {
    p = floats[i];
    ctx.fillStyle = rgba(p.rgb, 1 - p.t / 0.7);
    ctx.fillText(p.text, p.x, p.y);
  }
}

function draw() {
  var sx, sy, i;
  sx = (Math.random() - 0.5) * G.shake + G.kickX;
  sy = (Math.random() - 0.5) * G.shake + G.kickY;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#050208';
  ctx.fillRect(0, 0, cssW, cssH);
  ctx.save();
  ctx.translate(L.x + sx, L.y + sy);
  ctx.scale(L.s, L.s);
  ctx.beginPath();
  ctx.rect(0, 0, WORLD_W, WORLD_H);
  ctx.clip();
  drawCave();
  drawPlatforms();
  drawLava(G.clock);
  for (i = 0; i < G.eggs.length; i++) drawEgg(G.eggs[i]);
  for (i = 0; i < G.foes.length; i++) drawRiderWrapped(G.foes[i]);
  if (G.ptero) drawRiderWrapped(G.ptero);
  if (G.p1) drawRiderWrapped(G.p1);
  drawFx();
  if (G.flash > 0) {
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  }
  ctx.restore();
}

/* ---- input ---- */
function isTypingTarget(el) {
  if (!el) return false;
  var tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}

function onKey(e, down) {
  var k = e.code || e.key;
  var play = G.mode === 'play';
  if (isTypingTarget(e.target)) return;
  if (k === 'ArrowLeft' || k === 'KeyA') {
    keys.l = down;
    if (down) e.preventDefault();
  } else if (k === 'ArrowRight' || k === 'KeyD') {
    keys.r = down;
    if (down) e.preventDefault();
  } else if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') {
    if (down) {
      e.preventDefault();
      if (play) {
        keys.flap = true;
        keys.flapHeld = true;
      } else if (G.mode === 'title' && (k === 'Space')) {
        startRun('ride');
      } else if (G.mode === 'over' && k === 'Space') {
        retry();
      }
    } else keys.flapHeld = false;
  } else if (k === 'KeyS' || k === 'ArrowDown') {
    if (down) e.preventDefault();
  } else if (down && (k === 'KeyR')) {
    e.preventDefault();
    retry();
  } else if (down && (k === 'KeyM')) {
    e.preventDefault();
    audio.ensure();
    audio.setMuted(!audio.muted);
  } else if (down && G.mode === 'title' && (k === 'Digit1' || k === 'Numpad1' || k === 'Enter')) {
    e.preventDefault();
    startRun('ride');
  } else if (down && G.mode === 'title' && (k === 'Digit2' || k === 'Numpad2')) {
    e.preventDefault();
    startRun('dense');
  } else if (down && G.mode === 'over' && (k === 'Enter' || k === 'Space' || k === 'Digit1' || k === 'Numpad1')) {
    e.preventDefault();
    retry();
  }
}

function bindHold(el, on, off) {
  function start(ev) {
    ev.preventDefault();
    on();
  }
  function end(ev) {
    ev.preventDefault();
    off();
  }
  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', end);
  el.addEventListener('pointerleave', end);
  el.addEventListener('pointercancel', end);
}

function canvasPtr(ev) {
  var rect, x, t;
  if (G.mode !== 'play') return;
  if (ev.type === 'pointerdown') {
    canvas.setPointerCapture(ev.pointerId);
    ptr.down = true;
    ptr.id = ev.pointerId;
    rect = canvas.getBoundingClientRect();
    x = (ev.clientX - rect.left) / rect.width;
    ptr.l = x < 0.34;
    ptr.r = x > 0.66;
    keys.flap = true;
    keys.flapHeld = true;
    ev.preventDefault();
  } else if (ev.type === 'pointermove' && ptr.down && ev.pointerId === ptr.id) {
    rect = canvas.getBoundingClientRect();
    x = (ev.clientX - rect.left) / rect.width;
    ptr.l = x < 0.34;
    ptr.r = x > 0.66;
    ev.preventDefault();
  } else if (ev.pointerId === ptr.id) {
    ptr.down = false;
    ptr.l = false;
    ptr.r = false;
    keys.flapHeld = false;
  }
  t = ev.type;
  if (t === 'pointerdown' || t === 'pointermove' || t === 'pointerup') ev.preventDefault();
}

function bind() {
  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnRetry.addEventListener('click', retry);
  btnRide.addEventListener('click', function () { audio.ui(); startRun('ride'); });
  btnDense.addEventListener('click', function () { audio.ui(); startRun('dense'); });
  ovRetry.addEventListener('click', function () { retry(); });
  ovMenu.addEventListener('click', function () { audio.ui(); showTitle(); });
  bindHold(btnLeft, function () { ptr.l = true; btnLeft.classList.add('held'); }, function () { ptr.l = false; btnLeft.classList.remove('held'); });
  bindHold(btnRight, function () { ptr.r = true; btnRight.classList.add('held'); }, function () { ptr.r = false; btnRight.classList.remove('held'); });
  bindHold(btnFlap, function () {
    if (G.mode === 'play') { keys.flap = true; keys.flapHeld = true; btnFlap.classList.add('held'); }
  }, function () { keys.flapHeld = false; btnFlap.classList.remove('held'); });
  canvas.addEventListener('pointerdown', canvasPtr);
  canvas.addEventListener('pointermove', canvasPtr);
  canvas.addEventListener('pointerup', canvasPtr);
  canvas.addEventListener('pointercancel', canvasPtr);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  window.addEventListener('resize', fit);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    lastTs = 0;
    acc = 0;
  });
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.flap = keys.flapHeld = false;
    ptr.l = ptr.r = ptr.down = false;
  });
}

function frame(ts) {
  var dt, steps;
  requestAnimationFrame(frame);
  if (hidden) return;
  if (!lastTs) lastTs = ts;
  dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (dt > 0.08) dt = 0.08;
  acc += dt;
  steps = 0;
  while (acc >= STEP && steps < 8) {
    if (G.stop > 0) G.stop -= STEP;
    else {
      G.clock += STEP;
      tickWorld(STEP);
    }
    tickFx(STEP);
    acc -= STEP;
    steps++;
  }
  draw();
}

fit();
bind();
showTitle();
hudPlay();
requestAnimationFrame(frame);
window.addEventListener('load', fit);

}
