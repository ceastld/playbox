'use strict';

/* 鸵踢 — Joust remake. No CDN. */

var WORLD_W = 640;
var WORLD_H = 400;
var LIVES = 3;
var GRAV = 620;
var FLAP = -218;
var MAX_UP = -272;
var MAX_FALL = 308;
var ACCEL_G = 540;
var ACCEL_A = 355;
var FRICT_G = 6.4;
var FRICT_A = 0.42;
var MAX_VX_G = 170;
var MAX_VX_A = 198;
var LANCE_EPS = 6;
var PTERO_EPS = 11;
var HW = 11;
var HH = 13;
var EGG_R = 6.6;
var LAVA_Y = 374;
var HATCH_T = 7.2;
var INVULN = 1.55;
var DIE_T = 0.78;
var COMBO_WIN = 2.2;
var FLAP_BUF = 0.1;
var PAD_FLAP = 0.12;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var BEST_KEY = 'playbox-joust-kick-best';
var MUTE_KEY = 'playbox-joust-kick-mute';
var AUTO_SPEED_KEY = 'playbox-joust-kick-auto-speed';
var SPEED_LABELS = ['', '慢', '中', '快', '极快'];
var AUTO_SCALE = [1, 0.52, 0.78, 1, 3.4];

var PLATS = [
  { x: 208, y: 56, w: 224, h: 12 },
  { x: 0, y: 108, w: 152, h: 12 },
  { x: 488, y: 108, w: 152, h: 12 },
  { x: 72, y: 172, w: 158, h: 12 },
  { x: 410, y: 172, w: 158, h: 12 },
  { x: 226, y: 232, w: 188, h: 12 },
  { x: 0, y: 300, w: 196, h: 12 },
  { x: 444, y: 300, w: 196, h: 12 }
];

var SPAWN_P1 = { x: 88, plat: 6 };
var SPAWN_P2 = { x: 552, plat: 7 };

var KIND_SCORE = {
  bounder: 500,
  hunter: 750,
  shadow: 1000,
  ptero: 1000,
  egg: 250
};

var CYN = [0, 240, 255];
var MAG = [255, 61, 184];
var GOLD = [255, 227, 107];
var HOT = [255, 154, 40];
var LAVA = [255, 74, 24];
var PUR = [155, 92, 255];
var WHT = [246, 243, 255];

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
function hypot(x, y) {
  return Math.sqrt(x * x + y * y);
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

function waveSpec(wave) {
  var w = wave < 1 ? 1 : wave;
  var b, h, s, ptero, total;
  if (w === 1) { b = 3; h = 0; s = 0; ptero = 24; }
  else if (w === 2) { b = 4; h = 1; s = 0; ptero = 20; }
  else if (w === 3) { b = 3; h = 2; s = 0; ptero = 17; }
  else if (w === 4) { b = 2; h = 3; s = 1; ptero = 15; }
  else if (w === 5) { b = 1; h = 3; s = 2; ptero = 13; }
  else {
    b = 0;
    h = 2 + (w % 2);
    s = 2 + Math.min(3, (w - 5) >> 1);
    ptero = 11;
  }
  total = b + h + s;
  if (total > 8) s = Math.max(0, s - (total - 8));
  return { b: b, h: h, s: s, ptero: ptero, total: b + h + s };
}

function kindRgb(kind) {
  if (kind === 'ostrich') return CYN;
  if (kind === 'stork') return MAG;
  if (kind === 'bounder') return HOT;
  if (kind === 'hunter') return MAG;
  if (kind === 'shadow') return PUR;
  if (kind === 'ptero') return GOLD;
  return WHT;
}

function kindScore(kind) {
  return KIND_SCORE[kind] || 0;
}

function bodyHW(r) {
  return r.kind === 'ptero' ? 22 : HW;
}
function bodyHH(r) {
  return r.kind === 'ptero' ? 10 : HH;
}
function lanceY(r) {
  return r.y - (r.kind === 'ptero' ? 2 : 5);
}
function feetY(r) {
  return r.y + (r.kind === 'ptero' ? 8 : 12);
}
function headY(r) {
  return r.y - (r.kind === 'ptero' ? 8 : 12);
}

function xOnPlat(i, x) {
  var p = PLATS[i];
  return x >= p.x - 2 && x <= p.x + p.w + 2;
}

function platLandAt(x, y, prevY, foot) {
  var i, p, feet, prevFeet;
  feet = y + foot;
  prevFeet = prevY + foot;
  for (i = 0; i < PLATS.length; i++) {
    p = PLATS[i];
    if (x < p.x - 2 || x > p.x + p.w + 2) continue;
    if (prevFeet <= p.y + 3 && feet >= p.y && feet <= p.y + 18) return i;
  }
  return -1;
}

function platLand(x, y, prevY) {
  return platLandAt(x, y, prevY, 12);
}

function platCeil(x, y, prevY) {
  var i, p, head, prevHead, bot;
  head = y - 12;
  prevHead = prevY - 12;
  for (i = 0; i < PLATS.length; i++) {
    p = PLATS[i];
    if (x < p.x + 6 || x > p.x + p.w - 6) continue;
    bot = p.y + p.h;
    if (prevHead >= bot - 2 && head <= bot && head >= p.y - 4) return i;
  }
  return -1;
}

function higherPlatIndex(ex, ey, biasX) {
  var i, p, best = -1, bestS = 1e9, s, cx, dx;
  for (i = 0; i < PLATS.length; i++) {
    p = PLATS[i];
    if (p.y >= ey - 10) continue;
    cx = p.x + p.w * 0.5;
    dx = Math.abs(wrapDx(cx, ex));
    s = dx * 0.85 + Math.abs(p.y - (ey - 44)) * 0.4;
    if (biasX != null) s += Math.abs(wrapDx(cx, biasX)) * 0.32;
    if (s < bestS) { bestS = s; best = i; }
  }
  return best;
}

function nearestPlatIndex(x, y) {
  var i, p, best = -1, bestS = 1e9, s, cx, fy;
  for (i = 0; i < PLATS.length; i++) {
    p = PLATS[i];
    cx = p.x + p.w * 0.5;
    fy = p.y - 12;
    s = Math.abs(wrapDx(cx, x)) + Math.abs(fy - y) * 0.55;
    if (y > p.y + 10) s += 36;
    if (s < bestS) { bestS = s; best = i; }
  }
  return best;
}

function platEdgeToward(pi, x, tx) {
  var p = PLATS[pi];
  var dl = Math.abs(wrapDx(p.x + 18, tx));
  var dr = Math.abs(wrapDx(p.x + p.w - 18, tx));
  return dl < dr ? p.x + 16 : p.x + p.w - 16;
}

function underPlatIndex(x, y) {
  var i, p;
  for (i = 0; i < PLATS.length; i++) {
    p = PLATS[i];
    if (x < p.x + 8 || x > p.x + p.w - 8) continue;
    if (y - 12 < p.y + p.h + 18 && y + 4 > p.y && y > p.y) return i;
  }
  return -1;
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

function overlapRiders(a, b) {
  var dx = Math.abs(wrapDx(a.x, b.x));
  var dy = Math.abs(a.y - b.y);
  return dx < bodyHW(a) + bodyHW(b) && dy < bodyHH(a) * 0.78 + bodyHH(b) * 0.78;
}

function waveMul(wave) {
  return 1 + Math.max(0, wave - 1) * 0.075;
}

function maxVxOf(r, wave) {
  var m = r.team === 2 ? waveMul(wave) : 1;
  var v;
  if (r.kind === 'bounder') v = r.grounded ? 118 : 142;
  else if (r.kind === 'hunter') v = r.grounded ? 152 : 176;
  else if (r.kind === 'shadow') v = r.grounded ? 174 : 206;
  else if (r.kind === 'ptero') v = 168;
  else v = r.grounded ? MAX_VX_G : MAX_VX_A;
  return v * m;
}

function accelOf(r, wave) {
  var m = r.team === 2 ? waveMul(wave) : 1;
  var v;
  if (r.kind === 'bounder') v = r.grounded ? 360 : 250;
  else if (r.kind === 'hunter') v = r.grounded ? 490 : 330;
  else if (r.kind === 'shadow') v = r.grounded ? 560 : 400;
  else if (r.kind === 'ptero') v = 270;
  else v = r.grounded ? ACCEL_G : ACCEL_A;
  return v * m;
}

function makeRider(kind, x, y, team) {
  var plat = platLand(x, y + 2, y - 8);
  if (plat < 0) {
    plat = -1;
  }
  return {
    kind: kind,
    team: team,
    x: x,
    y: y,
    vx: 0,
    vy: 0,
    face: x < WORLD_W * 0.5 ? 1 : -1,
    grounded: plat >= 0,
    plat: plat,
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

function platSpawn(spec) {
  var p = PLATS[spec.plat];
  return { x: spec.x, y: p.y - 12, plat: spec.plat };
}

function selfCheck() {
  var w1, w5, w8, a, b, i, p, low;

  if (PLATS.length !== 8) throw new Error('8 platforms');
  if (LIVES !== 3) throw new Error('3 lives');
  if (FLAP >= 0) throw new Error('flap lifts');
  if (LAVA_Y <= PLATS[6].y) throw new Error('lava below floor');
  if (lanceWinner(100, 120, LANCE_EPS) !== -1) throw new Error('higher wins');
  if (lanceWinner(120, 100, LANCE_EPS) !== 1) throw new Error('lower loses');
  if (lanceWinner(100, 104, LANCE_EPS) !== 0) throw new Error('near-equal bounce');
  if (lanceWinner(100, 100 + LANCE_EPS, LANCE_EPS) !== 0) throw new Error('eps is bounce');
  if (lanceWinner(100 + LANCE_EPS + 0.5, 100, LANCE_EPS) !== 1) throw new Error('just below loses');
  if (Math.abs(wrapX(-5) - (WORLD_W - 5)) > 0.01) throw new Error('wrap left');
  if (Math.abs(wrapX(WORLD_W + 8) - 8) > 0.01) throw new Error('wrap right');
  if (Math.abs(wrapDx(10, WORLD_W - 10) + 20) > 0.01) throw new Error('wrap dx seam');
  if (comboMul(1) !== 1) throw new Error('combo 1');
  if (comboMul(2) !== 2) throw new Error('combo 2');
  if (comboMul(5) !== 5) throw new Error('combo cap 5');
  if (comboMul(9) !== 5) throw new Error('combo max 5x');
  if (hatchType('bounder') !== 'hunter') throw new Error('egg bounder→hunter');
  if (hatchType('hunter') !== 'shadow') throw new Error('egg hunter→shadow');
  if (hatchType('ptero') !== '') throw new Error('ptero no egg hatch');
  w1 = waveSpec(1);
  w5 = waveSpec(5);
  w8 = waveSpec(8);
  if (w1.b !== 3 || w1.h !== 0 || w1.s !== 0) throw new Error('wave1 bounders');
  if (w1.total < 3) throw new Error('wave1 count');
  if (w5.s < 1) throw new Error('wave5 shadows');
  if (w5.ptero >= w1.ptero) throw new Error('ptero sooner later');
  if (w8.total < w1.total) throw new Error('later waves denser');
  if (kindScore('egg') >= kindScore('bounder')) throw new Error('egg < buzzard');
  if (kindScore('shadow') <= kindScore('bounder')) throw new Error('shadow pays more');

  a = makeRider('ostrich', 10, 80, 0);
  b = makeRider('bounder', WORLD_W - 10, 80, 2);
  if (!overlapRiders(a, b)) throw new Error('wrap overlap');
  a.x = 200; b.x = 280;
  if (overlapRiders(a, b)) throw new Error('far no overlap');

  p = PLATS[6];
  i = platLand(p.x + 40, p.y - 12, p.y - 20);
  if (i !== 6) throw new Error('land bottom left');
  if (platLand(320, 40, 20) !== -1) throw new Error('air no land');
  if (platLandAt(p.x + 40, p.y - EGG_R, p.y - 20, EGG_R) !== 6) throw new Error('egg land');

  low = 0;
  for (i = 0; i < PLATS.length; i++) if (PLATS[i].y > low) low = PLATS[i].y;
  if (low >= LAVA_Y) throw new Error('plats above lava');
  if (SPAWN_P1.plat === SPAWN_P2.plat) throw new Error('two spawns');
  if (!xOnPlat(SPAWN_P1.plat, SPAWN_P1.x)) throw new Error('p1 on plat');
  if (!xOnPlat(SPAWN_P2.plat, SPAWN_P2.x)) throw new Error('p2 on plat');
  if (bodyHW({ kind: 'ptero' }) <= bodyHW({ kind: 'bounder' })) throw new Error('ptero bigger');
  if (SPEED_LABELS.length !== 5 || SPEED_LABELS[3] !== '快') throw new Error('speed labels');
  if (AUTO_SCALE[3] !== 1 || AUTO_SCALE[4] <= AUTO_SCALE[3]) throw new Error('auto scale');
  if (loadAutoSpeed() < 1 || loadAutoSpeed() > 4) throw new Error('auto speed range');
  i = higherPlatIndex(320, 250);
  if (i < 0) throw new Error('higher plat exists');
  if (PLATS[i].y >= 250) throw new Error('higher plat is above');
  if (higherPlatIndex(320, 40) !== -1) throw new Error('no plat above ceiling');
  if (nearestPlatIndex(SPAWN_P1.x, PLATS[SPAWN_P1.plat].y - 12) !== SPAWN_P1.plat) {
    throw new Error('nearest spawn plat');
  }
  if (underPlatIndex(PLATS[5].x + 40, PLATS[5].y + 20) !== 5) throw new Error('under mid plat');
  if (underPlatIndex(320, 40) !== -1) throw new Error('open air not under');
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
var btnClassic = document.getElementById('btn-classic');
var btnTwo = document.getElementById('btn-two');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnAuto = document.getElementById('btn-auto');
var speedEl = document.getElementById('speed');
var speedLab = document.getElementById('speed-lab');
var btnLeft = document.getElementById('btn-left');
var btnRight = document.getElementById('btn-right');
var btnFlap = document.getElementById('btn-flap');
var scoreEl = document.getElementById('score');
var score2El = document.getElementById('score2');
var score2Box = document.getElementById('score2-box');
var waveEl = document.getElementById('wave');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var lab1 = document.getElementById('lab-1');
var modeLabel = document.getElementById('mode-label');
var tagLabel = document.getElementById('tag-label');
var pipsEl = document.getElementById('pips');
var pips2El = document.getElementById('pips2');
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
var feathers = [];
var motes = [];

var keys = {
  l: false, r: false, flap: false, flapHeld: false,
  l2: false, r2: false, flap2: false, flapHeld2: false
};
var ptr = { down: false, id: null, l: false, r: false };
var autoOn = false;
var autoSpeed = loadAutoSpeed();

var G = {
  mode: 'title',
  kind: 'classic',
  two: false,
  clock: 0,
  wave: 1,
  waveT: 0,
  lives1: LIVES,
  lives2: LIVES,
  score1: 0,
  score2: 0,
  best: 0,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  p1: null,
  p2: null,
  foes: [],
  eggs: [],
  spawnQ: [],
  spawnCd: 0,
  ptero: null,
  pteroIn: 0,
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

function isTwo() {
  return G.two;
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
    this.beep(240, 0.05, 'square', 0.04, 520);
    this.noise(0.045, 0.045, 1400, 'highpass');
  },
  land: function () {
    this.ensure();
    this.noise(0.05, 0.05, 340, 'bandpass');
    this.beep(150, 0.04, 'sine', 0.03, 70);
  },
  bounce: function () {
    this.ensure();
    this.beep(310, 0.06, 'square', 0.05, 180);
    this.beep(190, 0.07, 'triangle', 0.04, 90);
    this.noise(0.05, 0.05, 700, 'bandpass');
  },
  knock: function (combo) {
    this.ensure();
    var p = 1 + Math.min(6, combo) * 0.06;
    this.noise(0.14, 0.15, 190, 'lowpass');
    this.beep(160 * p, 0.12, 'square', 0.08, 55);
    this.beep(720 * p, 0.08, 'triangle', 0.05, 420 * p);
    this.beep(1080 * p, 0.05, 'square', 0.035, 880 * p);
  },
  egg: function (combo) {
    this.ensure();
    var p = 1 + Math.min(5, combo) * 0.05;
    this.beep(880 * p, 0.07, 'triangle', 0.06, 1320 * p);
    this.beep(1180 * p, 0.1, 'square', 0.04, 1560 * p);
  },
  hatch: function () {
    this.ensure();
    this.noise(0.1, 0.07, 900, 'bandpass');
    this.beep(420, 0.1, 'sawtooth', 0.04, 180);
  },
  die: function () {
    this.ensure();
    this.noise(0.18, 0.12, 260, 'lowpass');
    this.beep(340, 0.24, 'sawtooth', 0.06, 70);
    this.beep(180, 0.2, 'square', 0.04, 48);
  },
  lava: function () {
    this.ensure();
    this.noise(0.2, 0.12, 420, 'lowpass');
    this.beep(90, 0.16, 'sine', 0.05, 40);
  },
  ptero: function () {
    this.ensure();
    this.beep(220, 0.22, 'sawtooth', 0.06, 90);
    this.beep(140, 0.28, 'square', 0.05, 60);
    this.noise(0.2, 0.08, 600, 'bandpass');
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
    this.beep(440 + n * 42, 0.08, 'square', 0.05, 880 + n * 48);
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
  var cur = isTwo() ? Math.max(G.score1, G.score2) : G.score1;
  if (cur > G.best) G.best = cur;
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
  cap = 140 - particles.length;
  if (n > cap) n = cap < 0 ? 0 : cap;
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
      vx: rand(-1, 1) * 70,
      vy: rand(-90, -16),
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
      vx: Math.cos(a) * rand(20, 90),
      vy: Math.sin(a) * rand(10, 70) - 50,
      rot: rand(0, TAU),
      vr: rand(-6, 6),
      t: rand(0.35, 0.7),
      rgb: rgb,
      w: rand(3.2, 6.2)
    });
  }
}

function lavaSplash(x) {
  burst(x, LAVA_Y - 4, 18, LAVA, 70, 0.45, 40);
  burst(x, LAVA_Y - 4, 10, GOLD, 50, 0.32, 30);
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

function flashScore(n, who) {
  var box = who === 2 ? score2Box : scoreBox;
  scoreAdd.hidden = false;
  scoreAdd.textContent = '+' + n;
  scoreAdd.style.animation = 'none';
  void scoreAdd.offsetWidth;
  scoreAdd.style.animation = '';
  box.classList.remove('flash');
  void box.offsetWidth;
  box.classList.add('flash');
  clearTimeout(addTok);
  addTok = setTimeout(function () { scoreAdd.hidden = true; }, 700);
}

function addScore(who, n, x, y, label) {
  if (n <= 0 || G.mode !== 'play') return;
  if (who === 2) G.score2 += n;
  else G.score1 += n;
  flashScore(n, who);
  persistBest();
  hudPlay();
  if (x != null) floatText(x, y - 16, label || ('+' + n), GOLD);
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
    toast(G.combo >= 10 ? '连踢 ×' + G.combo : '连踢', false, true);
  }
}

function renderPips(el, lives) {
  var html = '';
  var i;
  for (i = 0; i < LIVES; i++) {
    html += '<i class="pip ' + (i < lives ? 'on' : 'gone') + '"></i>';
  }
  el.innerHTML = html;
}

function hudPlay() {
  scoreEl.textContent = String(G.score1);
  score2El.textContent = String(G.score2);
  waveEl.textContent = String(G.wave);
  bestEl.textContent = String(G.best);
  comboEl.textContent = '×' + Math.max(1, G.combo);
  lab1.textContent = isTwo() ? '其一' : '分数';
  score2Box.hidden = !isTwo();
  pips2El.hidden = !isTwo();
  renderPips(pipsEl, G.lives1);
  renderPips(pips2El, G.lives2);
  modeLabel.textContent = isTwo() ? '双人' : '经典';
  modeLabel.classList.toggle('two', isTwo());
  if (G.ptero && !G.ptero.dead && G.mode === 'play') {
    tagLabel.textContent = '翼龙';
    tagLabel.classList.add('warn');
  } else {
    tagLabel.textContent = 'JOUST';
    tagLabel.classList.remove('warn');
  }
  if (G.mode === 'play') {
    if (autoOn) {
      hintEl.textContent = '托管中 · 从上头踢 · A 停下 · 速度 ' + SPEED_LABELS[autoSpeed];
    } else {
      hintEl.textContent = isTwo()
        ? '其一 ←→ 空格 · 其二 WASD + F · 从上面撞 · 蛋要捡'
        : '← → 移动 · 空格 / 点按扇翅 · 从上面撞 · 蛋要捡';
    }
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
  for (i = 0; i < 28; i++) {
    motes.push({
      x: rand(0, WORLD_W),
      y: rand(20, LAVA_Y - 20),
      s: rand(0.6, 1.8),
      v: rand(6, 18),
      ph: rand(0, TAU)
    });
  }
}

function spawnOnPlat(kind, team, spec, inv) {
  var s = platSpawn(spec);
  var r = makeRider(kind, s.x, s.y, team);
  r.grounded = true;
  r.plat = spec.plat;
  r.inv = inv || 0;
  r.spawnT = 0.15;
  return r;
}

function queueWave(wave) {
  var spec = waveSpec(wave);
  var i;
  G.spawnQ = [];
  for (i = 0; i < spec.b; i++) G.spawnQ.push('bounder');
  for (i = 0; i < spec.h; i++) G.spawnQ.push('hunter');
  for (i = 0; i < spec.s; i++) G.spawnQ.push('shadow');
  G.spawnCd = 0.35;
  G.pteroIn = spec.ptero;
  G.pteroSaid = false;
  G.ptero = null;
  G.waveT = 0;
}

function spawnFoe(kind) {
  var fromLeft = Math.random() < 0.5;
  var y = rand(48, 250);
  var x = fromLeft ? 18 : WORLD_W - 18;
  var r = makeRider(kind, x, y, 2);
  r.grounded = false;
  r.plat = -1;
  r.face = fromLeft ? 1 : -1;
  r.vx = r.face * 70;
  r.vy = -40;
  r.inv = 0.35;
  r.ai.tx = WORLD_W * 0.5;
  r.ai.ty = y - 20;
  G.foes.push(r);
  if (G.mode === 'play') {
    burst(x, y, 8, kindRgb(kind), 36, 0.28, 10);
    audio.ui();
  }
}

function spawnPtero() {
  var fromLeft = Math.random() < 0.5;
  var r = makeRider('ptero', fromLeft ? 30 : WORLD_W - 30, 70, 2);
  r.grounded = false;
  r.face = fromLeft ? 1 : -1;
  r.vx = r.face * 90;
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

function liveFoes() {
  var n = 0, i;
  for (i = 0; i < G.foes.length; i++) if (!G.foes[i].dead) n++;
  if (G.ptero && !G.ptero.dead) n++;
  return n;
}

function liveEggs() {
  return G.eggs.length;
}

function allPlayers() {
  var a = [G.p1];
  if (isTwo()) a.push(G.p2);
  return a;
}

function livingPlayers() {
  var out = [], i, p, arr = allPlayers();
  for (i = 0; i < arr.length; i++) {
    p = arr[i];
    if (p && !p.dead) out.push(p);
  }
  return out;
}

function nearestPrey(r) {
  var pool = [];
  var i, p, d, best = null, bestD = 1e9;
  if (r.team < 2) {
    for (i = 0; i < G.foes.length; i++) if (!G.foes[i].dead) pool.push(G.foes[i]);
    if (G.ptero && !G.ptero.dead) pool.push(G.ptero);
  } else {
    pool = livingPlayers();
  }
  for (i = 0; i < pool.length; i++) {
    p = pool[i];
    if (p === r) continue;
    d = Math.abs(wrapDx(r.x, p.x)) + Math.abs(r.y - p.y) * 0.65;
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

function resetArena(attract) {
  var s1 = platSpawn(SPAWN_P1);
  var s2 = platSpawn(SPAWN_P2);
  G.p1 = makeRider('ostrich', s1.x, s1.y, 0);
  G.p1.grounded = true;
  G.p1.plat = SPAWN_P1.plat;
  G.p2 = makeRider('stork', s2.x, s2.y, 1);
  G.p2.grounded = true;
  G.p2.plat = SPAWN_P2.plat;
  if (attract) {
    G.p1.inv = 0;
    G.p2.inv = 9;
    G.p2.dead = true;
  }
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
  G.two = kind === 'two';
  G.mode = 'play';
  G.clock = 0;
  G.wave = 1;
  G.lives1 = LIVES;
  G.lives2 = LIVES;
  G.score1 = 0;
  G.score2 = 0;
  G.combo = 0;
  G.maxCombo = 0;
  G.comboAge = 0;
  G.why = '';
  G.lock = 0;
  resetArena(false);
  G.p1.inv = 0.8;
  if (G.two) G.p2.inv = 0.8;
  else {
    G.p2.dead = true;
    G.p2.inv = 99;
  }
  queueWave(1);
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  panelEl.className = 'panel';
  audio.start();
  hudPlay();
  toast(G.two ? '双人同机' : '第 1 波', false, !G.two);
  canvas.focus({ preventScroll: true });
}

function showTitle() {
  hintEl.classList.remove('warn', 'hot');
  G.mode = 'title';
  G.two = false;
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel';
  ovKicker.textContent = 'JOUST';
  ovTitle.textContent = '鸵踢';
  ovLead.textContent = '洞窟里扇翅对撞。从更高处撞上去，对方变蛋，捡蛋才算赢。';
  ovOps.textContent = '← → 移动 · 空格 / 点按扇翅 · 双人 WASD + F · A 自动 · R 重开 · M 静音';
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
  hintEl.textContent = '从上面撞才算赢 · 同高弹开 · 更低你就完蛋 · 蛋要捡';
  resetArena(true);
  G.p1.inv = 0;
  G.p1.dead = false;
  queueWave(1);
  G.spawnCd = 0.2;
  hudPlay();
  modeLabel.textContent = '经典';
}

function showOver() {
  G.mode = 'over';
  persistBest();
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel lose';
  ovKicker.textContent = 'JOUST';
  ovTitle.textContent = '命尽';
  ovLead.textContent = '第 ' + G.wave + ' 波 · ' +
    (isTwo() ? ('其一 ' + G.score1 + ' · 其二 ' + G.score2) : (G.score1 + ' 分')) +
    ' · 连踢最高 ×' + G.maxCombo +
    (G.why ? ' · ' + whyText(G.why) : '');
  ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
  audio.over();
  hintEl.classList.add('warn');
  hintEl.textContent = 'R 再来 · 换模式回标题';
  ovRetry.focus();
}

function whyText(w) {
  if (w === 'joust') return '被压住了';
  if (w === 'lava') return '掉进岩浆';
  if (w === 'ptero') return '翼龙啄中';
  return '';
}

function retry() {
  audio.ui();
  hintEl.classList.remove('warn');
  if (G.mode === 'title') startRun('classic');
  else startRun(G.kind);
}

function nextWave() {
  G.wave += 1;
  persistBest();
  G.clearT = 0;
  queueWave(G.wave);
  hudPlay();
  toast('第 ' + G.wave + ' 波', false, true);
  audio.wave();
  if (G.p1 && !G.p1.dead) G.p1.inv = Math.max(G.p1.inv, 0.35);
  if (G.two && G.p2 && !G.p2.dead) G.p2.inv = Math.max(G.p2.inv, 0.35);
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
  var p = PLATS[i];
  r.y = p.y - 12;
  r.vy = 0;
  r.grounded = true;
  r.plat = i;
  r.sqY = 0.74;
  r.sqX = 1.22;
  if (G.mode === 'play' && r.team < 2) audio.land();
  burst(r.x, p.y, 5, [180, 140, 90], 22, 0.18, 6);
}

function applySteer(r, dt, wave) {
  var accv = accelOf(r, wave);
  var cap = maxVxOf(r, wave);
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
  var prevY, i, landed, ceil;
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

  applySteer(r, dt, G.wave);
  r.x = wrapX(r.x + r.vx * dt);
  if (r.grounded) r.walk += Math.abs(r.vx) * dt * 0.08;
  else r.walk += dt * 2;

  if (r.kind === 'ptero') {
    r.grounded = false;
    r.plat = -1;
    r.vy = Math.min(MAX_FALL * 0.55, r.vy + GRAV * 0.35 * dt);
    if (r.vy > 90) r.vy = 90;
    r.y += r.vy * dt;
    if (r.y < 28) { r.y = 28; r.vy = Math.max(r.vy, 0); }
    if (r.y > LAVA_Y - 28) { r.y = LAVA_Y - 28; r.vy = -80; }
    return;
  }

  if (r.grounded) {
    if (r.plat < 0 || !xOnPlat(r.plat, r.x)) {
      r.grounded = false;
      r.plat = -1;
      r.vy = 16;
    } else {
      r.y = PLATS[r.plat].y - 12;
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
        r.y = PLATS[ceil].y + PLATS[ceil].h + 12;
        r.vy = 18;
      }
    }
  }
}

function thinkAI(r, dt) {
  var prey = nearestPrey(r);
  var dx, ty, want;
  r.ai.think -= dt;
  r.ai.flapCd -= dt;
  r.ai.phase += dt;

  if (r.kind === 'ptero') {
    ty = (prey ? prey.y - 10 : 86) + Math.sin(r.ai.phase * 1.5) * 26;
    dx = prey ? wrapDx(r.x, prey.x + prey.vx * 0.2) : r.face * 40;
    r.wantL = dx < -12;
    r.wantR = dx > 12;
    if (r.y > ty + 8 && r.ai.flapCd <= 0) {
      r.flapBuf = FLAP_BUF;
      r.ai.flapCd = 0.1;
    }
    return;
  }

  if (r.ai.think <= 0) {
    r.ai.think = r.kind === 'bounder' ? rand(0.7, 2.0) : rand(0.28, 0.85);
    if (r.kind === 'bounder' && Math.random() < 0.42) {
      iThinkPlat(r);
      r.ai.chase = false;
    } else if (prey) {
      r.ai.tx = prey.x;
      r.ai.ty = prey.y - (r.kind === 'shadow' ? 24 : 15);
      r.ai.chase = true;
    } else iThinkPlat(r);
  }

  if (prey && r.kind !== 'bounder') {
    r.ai.tx = prey.x + prey.vx * (r.kind === 'shadow' ? 0.35 : 0.18);
    r.ai.ty = prey.y - (r.kind === 'shadow' ? 26 : 14);
    r.ai.chase = true;
  }

  dx = wrapDx(r.x, r.ai.tx);
  r.wantL = dx < -11;
  r.wantR = dx > 11;

  want = r.ai.ty;
  if (r.y > want + 8 || (r.grounded && (r.ai.chase || Math.random() < 0.002))) {
    if (r.ai.flapCd <= 0) {
      r.flapBuf = FLAP_BUF;
      r.ai.flapCd = r.kind === 'bounder' ? rand(0.15, 0.32)
        : (r.kind === 'shadow' ? 0.085 : 0.12);
    }
  }
}

function iThinkPlat(r) {
  var p = PLATS[(Math.random() * PLATS.length) | 0];
  r.ai.tx = p.x + p.w * rand(0.22, 0.78);
  r.ai.ty = p.y - 16;
}

function drivePlayer(r, left, right, flapHeld, flapEdge) {
  r.wantL = left;
  r.wantR = right;
  r.flapHeld = flapHeld;
  if (flapEdge) r.flapBuf = FLAP_BUF;
  if (flapHeld && r.flapCd <= 0) r.flapBuf = FLAP_BUF;
}

function autoClearSteer(r) {
  r.wantL = false;
  r.wantR = false;
  r.flapHeld = false;
}

function autoFlap(r) {
  if (r.y < 44) return;
  r.flapHeld = true;
  if (r.flapCd <= 0) r.flapBuf = FLAP_BUF;
}

function autoSteerX(r, x, dead) {
  var dx = wrapDx(r.x, x);
  if (dx < -dead) { r.wantL = true; r.wantR = false; }
  else if (dx > dead) { r.wantR = true; r.wantL = false; }
  return dx;
}

function autoEggStill(e) {
  var i;
  for (i = 0; i < G.eggs.length; i++) if (G.eggs[i] === e) return true;
  return false;
}

function autoThreatNear(r, range) {
  var i, p, d, best = null, bestD = range;
  for (i = 0; i < G.foes.length; i++) {
    p = G.foes[i];
    if (!p || p.dead || p.inv > 0) continue;
    d = Math.abs(wrapDx(r.x, p.x));
    if (d < bestD && Math.abs(r.y - p.y) < 46) { bestD = d; best = p; }
  }
  if (G.ptero && !G.ptero.dead && G.ptero.inv <= 0) {
    d = Math.abs(wrapDx(r.x, G.ptero.x));
    if (d < bestD && Math.abs(r.y - G.ptero.y) < 52) best = G.ptero;
  }
  return best;
}

function autoPickPrey(r, ally) {
  var pool = [];
  var i, p, d, best = null, bestD = 1e9, second = null, secondD = 1e9, home;
  home = r.team === 1 ? WORLD_W * 0.72 : WORLD_W * 0.28;
  for (i = 0; i < G.foes.length; i++) {
    p = G.foes[i];
    if (p && !p.dead) pool.push(p);
  }
  if (G.ptero && !G.ptero.dead) pool.push(G.ptero);
  for (i = 0; i < pool.length; i++) {
    p = pool[i];
    d = Math.abs(wrapDx(r.x, p.x)) + Math.abs(r.y - p.y) * 0.48;
    if (p.grounded) d -= 28;
    if (p.y > r.y + 6) d -= 36;
    if (p.kind === 'ptero') d -= 12;
    if (isTwo()) d += Math.abs(wrapDx(home, p.x)) * 0.22;
    if (d < bestD) { second = best; secondD = bestD; best = p; bestD = d; }
    else if (d < secondD) { second = p; secondD = d; }
  }
  if (ally && !ally.dead && best && ally.ai && ally.ai.tgtKind === 'foe' && ally.ai.tgt === best) {
    return second;
  }
  return best;
}

function autoPickEgg(r) {
  var i, e, d, best = null, bestD = 1e9;
  for (i = 0; i < G.eggs.length; i++) {
    e = G.eggs[i];
    d = Math.abs(wrapDx(r.x, e.x)) + Math.abs(r.y - e.y) * 0.7;
    if (e.age > HATCH_T - 2.4) d -= 55;
    if (d < bestD) { bestD = d; best = e; }
  }
  return best;
}

function autoWantEgg(r, egg, prey) {
  var ed, pd, threat;
  if (!egg) return false;
  ed = Math.abs(wrapDx(r.x, egg.x)) + Math.abs(r.y - egg.y) * 0.55;
  if (egg.age > HATCH_T - 2.4 && ed < 280) return true;
  if (ed > 155) return false;
  threat = autoThreatNear(r, 34);
  if (threat && threat.y < r.y + 4 && Math.abs(wrapDx(r.x, threat.x)) < 36) return false;
  if (!prey) return true;
  pd = Math.abs(wrapDx(r.x, prey.x)) + Math.abs(r.y - prey.y) * 0.45;
  if (prey.y < r.y - 10 && pd < 56) return false;
  return ed < 120 || ed + 10 < pd || G.combo >= 2;
}

function autoPlatX(pi, towardX) {
  var p = PLATS[pi];
  if (xOnPlat(pi, towardX)) return clamp(towardX, p.x + 16, p.x + p.w - 16);
  return platEdgeToward(pi, p.x + p.w * 0.5, towardX);
}

function thinkAuto(r, ally, dt) {
  var prey, egg, dx, eps, high, plat, tx, ty, under, threat, locked, dive;
  autoClearSteer(r);
  if (!r || r.dead) {
    if (r) { r.ai.tgt = null; r.ai.tgtKind = ''; r.ai.chase = false; }
    return;
  }
  r.ai.think -= dt;
  r.ai.flapCd -= dt;
  r.ai.phase += dt;

  if (r.y < 40) r.flapBuf = 0;

  if (r.inv > 0.5) {
    plat = 0;
    tx = r.team === 1 ? PLATS[0].x + PLATS[0].w - 30 : PLATS[0].x + 30;
    autoSteerX(r, tx, 14);
    if (r.y > PLATS[0].y - 4) autoFlap(r);
    return;
  }

  if (r.y > LAVA_Y - 62) {
    autoFlap(r);
    plat = nearestPlatIndex(r.x, Math.min(r.y, LAVA_Y - 80));
    if (plat >= 0) autoSteerX(r, PLATS[plat].x + PLATS[plat].w * 0.5, 12);
    return;
  }

  under = underPlatIndex(r.x, r.y);
  if (under >= 0 && !r.grounded) {
    tx = platEdgeToward(under, r.x, r.x < PLATS[under].x + PLATS[under].w * 0.5
      ? PLATS[under].x - 20
      : PLATS[under].x + PLATS[under].w + 20);
    autoSteerX(r, tx, 8);
    if (r.y > PLATS[under].y + PLATS[under].h + 22) autoFlap(r);
    return;
  }

  if (ally && !ally.dead) {
    dx = wrapDx(r.x, ally.x);
    if (Math.abs(dx) < 46 && Math.abs(r.y - ally.y) < 38) {
      if (dx >= 0) { r.wantL = true; r.wantR = false; }
      else { r.wantR = true; r.wantL = false; }
      if (lanceY(r) >= lanceY(ally) - 6) autoFlap(r);
      if (Math.abs(dx) < 30) return;
    }
  }

  locked = r.ai.tgt;
  if (r.ai.tgtKind === 'egg' && !autoEggStill(locked)) locked = null;
  if (r.ai.tgtKind === 'foe' && (!locked || locked.dead)) locked = null;
  if (r.ai.think <= 0 || !locked) {
    r.ai.think = r.ai.chase ? 0.22 : 0.34;
    egg = autoPickEgg(r);
    prey = autoPickPrey(r, ally);
    if (autoWantEgg(r, egg, prey)) {
      r.ai.tgt = egg;
      r.ai.tgtKind = 'egg';
      r.ai.chase = false;
    } else if (prey) {
      r.ai.tgt = prey;
      r.ai.tgtKind = 'foe';
    } else {
      r.ai.tgt = null;
      r.ai.tgtKind = '';
      r.ai.chase = false;
    }
    locked = r.ai.tgt;
  }

  if (r.ai.tgtKind === 'egg' && locked) {
    tx = locked.x;
    ty = locked.y - 6;
    autoSteerX(r, tx, 12);
    if (r.y > ty + 8 || (r.grounded && Math.abs(wrapDx(r.x, tx)) > 18)) autoFlap(r);
    if (r.y < ty - 16 && r.vy < -30) r.flapHeld = false;
    return;
  }

  prey = r.ai.tgtKind === 'foe' ? locked : null;
  if (!prey) {
    plat = 0;
    tx = r.team === 1 ? PLATS[0].x + PLATS[0].w - 30 : PLATS[0].x + 30;
    autoSteerX(r, tx, 16);
    if (!r.grounded || r.plat !== 0) {
      if (r.y > PLATS[0].y - 4) autoFlap(r);
    }
    r.ai.chase = false;
    return;
  }

  eps = prey.kind === 'ptero' ? PTERO_EPS + 3 : LANCE_EPS + 4;
  dx = wrapDx(r.x, prey.x + prey.vx * 0.2);
  high = lanceY(r) < lanceY(prey) - eps;
  dive = high && Math.abs(dx) < 96;
  threat = !high && Math.abs(dx) < 48 && prey.y < r.y + 10 && Math.abs(r.y - prey.y) < 44;

  if (threat) {
    r.ai.chase = false;
    autoFlap(r);
    if (Math.abs(dx) < 30) {
      if (dx > 0) r.wantL = true;
      else r.wantR = true;
    } else {
      plat = higherPlatIndex(prey.x, prey.y);
      if (plat >= 0) autoSteerX(r, autoPlatX(plat, prey.x), 12);
    }
    return;
  }

  if (dive || high) {
    r.ai.chase = true;
    autoSteerX(r, prey.x + prey.vx * 0.14, 11);
    if (lanceY(r) > lanceY(prey) - eps - 6 || r.vy > 100) autoFlap(r);
    if (r.grounded && r.plat >= 0 && PLATS[r.plat].y < prey.y - 6) {
      if (Math.abs(dx) > 14 && xOnPlat(r.plat, r.x + (dx > 0 ? 16 : -16))) {
        autoClearSteer(r);
        autoSteerX(r, prey.x, 9);
        r.flapHeld = false;
      } else {
        autoFlap(r);
        autoSteerX(r, prey.x, 10);
      }
    }
    return;
  }

  r.ai.chase = false;
  plat = higherPlatIndex(prey.x, prey.y, r.x);

  if (r.grounded && r.plat >= 0) {
    if (PLATS[r.plat].y < prey.y - 8) {
      if (xOnPlat(r.plat, prey.x) || Math.abs(dx) < 30) {
        autoFlap(r);
        autoSteerX(r, prey.x, 10);
        return;
      }
      autoSteerX(r, platEdgeToward(r.plat, r.x, prey.x), 8);
      return;
    }
    autoFlap(r);
    autoSteerX(r, prey.x, 12);
    return;
  }

  if (prey.grounded && plat >= 0 && Math.abs(dx) > 70 && r.y > PLATS[plat].y + 4) {
    tx = autoPlatX(plat, prey.x);
    ty = PLATS[plat].y - 12;
    autoSteerX(r, tx, 12);
    if (r.y > ty + 6) autoFlap(r);
    if (r.y < ty - 18 && Math.abs(wrapDx(r.x, tx)) < 26) r.flapHeld = false;
    return;
  }

  tx = prey.x + prey.vx * 0.16;
  ty = prey.y - 36;
  if (ty < 34) ty = 34;
  autoSteerX(r, tx, 12);
  if (r.y > ty + 4 || r.grounded) autoFlap(r);
  if (r.y < 36) r.flapHeld = false;
}

function dropEgg(x, y, vx, vy, from) {
  G.eggs.push({
    x: wrapX(x),
    y: y,
    vx: vx,
    vy: vy,
    age: 0,
    from: from,
    spin: rand(0, TAU),
    vr: rand(-8, 8),
    grounded: false
  });
}

function tickEggs(dt) {
  var i, e, prevY, landed, p;
  for (i = G.eggs.length - 1; i >= 0; i--) {
    e = G.eggs[i];
    e.age += dt;
    e.spin += e.vr * dt;
    prevY = e.y;
    if (!e.grounded) {
      e.vy = Math.min(MAX_FALL, e.vy + GRAV * 0.85 * dt);
      e.y += e.vy * dt;
      e.x = wrapX(e.x + e.vx * dt);
      landed = platLandAt(e.x, e.y, prevY, EGG_R);
      if (landed >= 0 && e.vy > 0) {
        p = PLATS[landed];
        e.y = p.y - EGG_R;
        e.vy *= -0.42;
        e.vx *= 0.72;
        e.vr *= 0.7;
        if (Math.abs(e.vy) < 36) {
          e.vy = 0;
          e.grounded = true;
        }
      }
    } else {
      e.vx *= Math.exp(-5.5 * dt);
      e.x = wrapX(e.x + e.vx * dt);
      landed = -1;
      for (p = 0; p < PLATS.length; p++) {
        if (xOnPlat(p, e.x) && Math.abs((PLATS[p].y - EGG_R) - e.y) < 4) {
          landed = p;
          e.y = PLATS[p].y - EGG_R;
          break;
        }
      }
      if (landed < 0) {
        e.grounded = false;
        e.vy = 12;
      }
    }
    if (e.y + EGG_R > LAVA_Y) {
      lavaSplash(e.x);
      if (G.mode === 'play') audio.lava();
      G.eggs.splice(i, 1);
      continue;
    }
    if (e.age >= HATCH_T) {
      hatchEgg(e);
      G.eggs.splice(i, 1);
    }
  }
}

function hatchEgg(e) {
  var kind = hatchType(e.from) || 'bounder';
  var r = makeRider(kind, e.x, e.y - 8, 2);
  r.grounded = false;
  r.vy = -80;
  r.inv = 0.4;
  G.foes.push(r);
  burst(e.x, e.y, 12, kindRgb(kind), 48, 0.32, 16);
  ringAt(e.x, e.y, kindRgb(kind));
  if (G.mode === 'play') {
    audio.hatch();
    toast('蛋孵了', true, false);
  }
}

function collectEggs() {
  var i, j, e, arr, r, d, n;
  arr = livingPlayers();
  for (i = G.eggs.length - 1; i >= 0; i--) {
    e = G.eggs[i];
    for (j = 0; j < arr.length; j++) {
      r = arr[j];
      if (r.dead) continue;
      d = hypot(wrapDx(r.x, e.x), r.y - e.y);
      if (d > 16) continue;
      burst(e.x, e.y, 14, GOLD, 60, 0.36, 12);
      spark(e.x, e.y, WHT, 8);
      ringAt(e.x, e.y, GOLD);
      if (G.mode === 'play') {
        bumpCombo();
        n = kindScore('egg') * comboMul(G.combo);
        addScore(r.team === 1 ? 2 : 1, n, e.x, e.y, G.combo >= 2 ? '捡蛋 ×' + G.combo : '捡蛋');
        audio.egg(G.combo);
        hitStop(0.035);
      }
      G.eggs.splice(i, 1);
      break;
    }
  }
}

function knockApart(a, b) {
  var dir = wrapDx(a.x, b.x);
  if (dir === 0) dir = a.face || 1;
  dir = dir > 0 ? 1 : -1;
  a.vx -= dir * 90;
  b.vx += dir * 90;
  a.vy = Math.min(a.vy, -50);
  b.vy = Math.min(b.vy, -50);
  a.grounded = false;
  b.grounded = false;
  a.sqX = 1.2;
  b.sqX = 1.2;
}

function winJoust(winner, loser) {
  var dir = wrapDx(winner.x, loser.x);
  dir = dir === 0 ? winner.face : (dir > 0 ? 1 : -1);
  var midX = wrapX(winner.x + wrapDx(winner.x, loser.x) * 0.5);
  var midY = (winner.y + loser.y) * 0.5;
  var rgb = kindRgb(loser.kind);
  var n, who, label;

  winner.vx -= dir * 46;
  winner.vy = Math.min(winner.vy, -70);
  winner.grounded = false;
  winner.sqY = 1.16;
  winner.sqX = 0.88;

  who = winner.team === 1 ? 2 : 1;
  if (winner.team < 2 && G.mode === 'play') {
    bumpCombo();
    n = kindScore(loser.kind) * comboMul(G.combo);
    if (n < 1 && loser.team < 2) n = 350 * comboMul(G.combo);
    label = G.combo >= 2 ? '踢中 ×' + G.combo : '踢中';
    addScore(who, n || 350 * comboMul(G.combo), midX, midY, label);
  }

  burst(midX, midY, 18, rgb, 80, 0.4, 18);
  burst(midX, midY, 10, GOLD, 54, 0.3, 10);
  shed(loser.x, loser.y, rgb, 8);
  spark(midX, midY, WHT, 10);
  ringAt(midX, midY, GOLD);
  if (G.mode === 'play') {
    flash(HOT, 0.09);
    hitStop(G.combo >= 4 ? 0.07 : 0.055);
    shake(G.combo >= 4 ? 8 : 5);
    kick(dir * 5.5, -2.2);
    audio.knock(G.combo);
  }

  if (loser.kind === 'ptero') {
    loser.dead = true;
    loser.deadT = 0;
    loser.vx = dir * 140;
    loser.vy = -40;
    G.ptero = loser;
    floatText(midX, midY - 20, '翼龙', GOLD);
    return;
  }

  dropEgg(loser.x, loser.y, dir * (90 + Math.abs(winner.vx) * 0.25), -110, loser.kind);
  if (loser.team === 2) {
    loser.dead = true;
    loser.deadT = 99;
  } else {
    killRider(loser, winner.kind === 'ptero' ? 'ptero' : 'joust', false);
  }
}

function bounceJoust(a, b) {
  var midX = wrapX(a.x + wrapDx(a.x, b.x) * 0.5);
  var midY = (a.y + b.y) * 0.5;
  knockApart(a, b);
  burst(midX, midY, 8, WHT, 40, 0.22, 8);
  spark(midX, midY, CYN, 6);
  if (G.mode === 'play') {
    hitStop(0.03);
    kick((Math.random() < 0.5 ? -1 : 1) * 2, 0);
    audio.bounce();
  }
}

function killRider(r, why, sfx) {
  if (r.dead) return;
  r.dead = true;
  r.deadT = 0;
  r.grounded = false;
  r.vy = -40;
  r.why = why;
  shed(r.x, r.y, kindRgb(r.kind), 10);
  burst(r.x, r.y, 14, kindRgb(r.kind), 70, 0.4, 20);
  if (why === 'lava') lavaSplash(r.x);
  if (G.mode !== 'play') return;
  if (sfx !== false) {
    if (why === 'lava') audio.lava();
    else audio.die();
  }
  shake(7);
  flash(MAG, 0.12);
  hitStop(0.08);
  stageEl.classList.remove('die');
  void stageEl.offsetWidth;
  stageEl.classList.add('die');
  if (r.team === 0) {
    G.lives1 = Math.max(0, G.lives1 - 1);
    G.why = why;
  } else if (r.team === 1) {
    G.lives2 = Math.max(0, G.lives2 - 1);
    G.why = why;
  }
  hudPlay();
}

function maybeLava(r) {
  if (r.dead) {
    if (r.y > LAVA_Y + 30) r.y = LAVA_Y + 30;
    return;
  }
  if (feetY(r) > LAVA_Y) {
    if (r.team === 2) {
      if (r.kind === 'ptero') {
        r.y = LAVA_Y - 30;
        r.vy = -100;
        return;
      }
      r.dead = true;
      r.deadT = 99;
      lavaSplash(r.x);
      if (G.mode === 'play') audio.lava();
      dropEgg(r.x, LAVA_Y - 18, r.vx * 0.3, -120, r.kind);
    } else {
      killRider(r, 'lava', true);
    }
  }
}

function joustPair(a, b) {
  var eps, w;
  if (!a || !b) return;
  if (a.dead || b.dead) return;
  if (a.inv > 0 || b.inv > 0) return;
  if (!overlapRiders(a, b)) return;
  eps = (a.kind === 'ptero' || b.kind === 'ptero') ? PTERO_EPS : LANCE_EPS;
  w = lanceWinner(lanceY(a), lanceY(b), eps);
  if (w < 0) winJoust(a, b);
  else if (w > 0) winJoust(b, a);
  else bounceJoust(a, b);
}

function collideAll() {
  var i, j, foes, players, a, b;
  players = allPlayers();
  foes = G.foes.slice();
  if (G.ptero && !G.ptero.dead) foes.push(G.ptero);

  if (isTwo()) joustPair(G.p1, G.p2);

  for (i = 0; i < players.length; i++) {
    a = players[i];
    if (!a || a.dead) continue;
    for (j = 0; j < foes.length; j++) {
      b = foes[j];
      if (!b || b.dead) continue;
      joustPair(a, b);
    }
  }
  for (i = 0; i < foes.length; i++) {
    for (j = i + 1; j < foes.length; j++) {
      joustPair(foes[i], foes[j]);
    }
  }
}

function pruneFoes() {
  var i, r;
  for (i = G.foes.length - 1; i >= 0; i--) {
    r = G.foes[i];
    if (r.dead && r.deadT > 0.2) G.foes.splice(i, 1);
  }
  if (G.ptero && G.ptero.dead && G.ptero.deadT > 0.8) {
    G.ptero = null;
    if (G.mode === 'play') hudPlay();
  }
}

function respawnPlayer(r, lives, spec) {
  var s, avoid, i, p, cx, d, best, bestD;
  if (lives <= 0) return false;
  if (r.deadT < DIE_T) return false;
  avoid = 0;
  for (i = 0; i < G.foes.length; i++) avoid += G.foes[i].x;
  if (G.foes.length) avoid /= G.foes.length;
  else avoid = WORLD_W * 0.5;
  best = spec.plat;
  bestD = -1;
  for (i = 0; i < PLATS.length; i++) {
    p = PLATS[i];
    cx = p.x + p.w * 0.5;
    d = Math.abs(wrapDx(avoid, cx));
    if (d > bestD) { bestD = d; best = i; }
  }
  p = PLATS[best];
  s = { x: p.x + p.w * 0.5, plat: best };
  r.x = s.x;
  r.y = p.y - 12;
  r.vx = 0;
  r.vy = 0;
  r.dead = false;
  r.deadT = 0;
  r.grounded = true;
  r.plat = best;
  r.inv = INVULN;
  r.sqX = 1;
  r.sqY = 1;
  r.flapBuf = 0;
  burst(r.x, r.y, 10, kindRgb(r.kind), 36, 0.28, 8);
  return true;
}

function checkOver() {
  if (G.mode !== 'play') return;
  if (!isTwo()) {
    if (G.lives1 <= 0 && G.p1.dead && G.p1.deadT >= DIE_T) showOver();
    return;
  }
  if (G.lives1 <= 0 && G.lives2 <= 0 && G.p1.dead && G.p2.dead &&
      G.p1.deadT >= DIE_T && G.p2.deadT >= DIE_T) showOver();
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
    o.vy += 140 * dt;
    if (o.t <= 0) sparks.splice(i, 1);
  }
  for (i = floats.length - 1; i >= 0; i--) {
    o = floats[i];
    o.t += dt;
    o.y -= 30 * dt;
    if (o.t > 0.72) floats.splice(i, 1);
  }
  for (i = rings.length - 1; i >= 0; i--) {
    o = rings[i];
    o.t += dt;
    o.r += 78 * dt;
    if (o.t > 0.36) rings.splice(i, 1);
  }
  for (i = feathers.length - 1; i >= 0; i--) {
    o = feathers[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.vy += 210 * dt;
    o.y += o.vy * dt;
    o.rot += o.vr * dt;
    o.vx *= Math.exp(-1.2 * dt);
    if (o.t <= 0) feathers.splice(i, 1);
  }
  for (i = 0; i < motes.length; i++) {
    o = motes[i];
    o.ph += dt * 0.7;
    o.y += Math.sin(o.ph) * 8 * dt;
    o.x = wrapX(o.x + o.v * dt * 0.15);
  }
}

function tick(dt) {
  var i, playSfx, p1L, p1R, p1H, p1E, p2L, p2R, p2H, p2E;

  G.clock += dt;
  if (G.mode === 'over') {
    tickFx(dt);
    return;
  }

  playSfx = G.mode === 'play';

  if (G.mode === 'play' && autoOn) {
    thinkAuto(G.p1, isTwo() ? G.p2 : null, dt);
    if (isTwo()) thinkAuto(G.p2, G.p1, dt);
  } else if (G.mode === 'play') {
    p1L = keys.l || ptr.l;
    p1R = keys.r || ptr.r;
    p1H = keys.flapHeld;
    p1E = keys.flap;
    p2L = keys.l2;
    p2R = keys.r2;
    p2H = keys.flapHeld2;
    p2E = keys.flap2;
    if (G.p1 && !G.p1.dead) drivePlayer(G.p1, p1L, p1R, p1H, p1E);
    if (isTwo() && G.p2 && !G.p2.dead) drivePlayer(G.p2, p2L, p2R, p2H, p2E);
  }
  keys.flap = false;
  keys.flap2 = false;

  if (G.p1) tickRider(G.p1, dt, G.mode === 'title', playSfx);
  if (G.p2 && (isTwo() || G.mode === 'title')) {
    if (G.mode === 'title') { /* p2 unused */ }
    else tickRider(G.p2, dt, false, playSfx);
  }

  for (i = 0; i < G.foes.length; i++) tickRider(G.foes[i], dt, true, false);
  if (G.ptero) tickRider(G.ptero, dt, true, false);

  if (G.p1) maybeLava(G.p1);
  if (G.p2 && isTwo()) maybeLava(G.p2);
  for (i = 0; i < G.foes.length; i++) maybeLava(G.foes[i]);
  if (G.ptero) maybeLava(G.ptero);

  collideAll();
  tickEggs(dt);
  collectEggs();
  pruneFoes();

  if (G.mode === 'play') {
    if (G.p1.dead) respawnPlayer(G.p1, G.lives1, SPAWN_P1);
    if (isTwo() && G.p2.dead) respawnPlayer(G.p2, G.lives2, SPAWN_P2);
  } else if (G.mode === 'title' && G.p1.dead) {
    G.lives1 = LIVES;
    respawnPlayer(G.p1, 3, SPAWN_P1);
    G.p1.inv = 0.4;
  }

  G.waveT += dt;
  G.spawnCd -= dt;
  if (G.spawnQ.length && G.spawnCd <= 0) {
    spawnFoe(G.spawnQ.shift());
    G.spawnCd = 0.42;
  }
  if (G.mode === 'play' && !G.ptero && !G.pteroSaid && G.waveT >= waveSpec(G.wave).ptero && liveFoes() > 0) {
    spawnPtero();
  }

  if (G.mode === 'play' && G.clearT <= 0 && !G.spawnQ.length && liveFoes() === 0 && liveEggs() === 0) {
    G.clearT = 1.05;
    toast('清波', false, true);
    audio.wave();
  }
  if (G.mode === 'title' && !G.spawnQ.length && liveFoes() === 0 && liveEggs() === 0) {
    queueWave(1);
  }
  if (G.clearT > 0) {
    G.clearT -= dt;
    if (G.clearT <= 0) nextWave();
  }

  tickFx(dt);
  checkOver();
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

function drawBg() {
  var g, i, x, y, t;
  ctx.fillStyle = '#07030b';
  ctx.fillRect(0, 0, cssW, cssH);

  g = ctx.createRadialGradient(sx(90), sy(70), 8, sx(90), sy(70), 220 * L.s);
  g.addColorStop(0, 'rgba(255,154,40,0.14)');
  g.addColorStop(1, 'rgba(255,154,40,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(520), sy(40), 8, sx(520), sy(40), 180 * L.s);
  g.addColorStop(0, 'rgba(255,61,184,0.08)');
  g.addColorStop(1, 'rgba(255,61,184,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.fillStyle = '#12080e';
  ctx.beginPath();
  ctx.moveTo(sx(0), sy(0));
  ctx.lineTo(sx(WORLD_W), sy(0));
  ctx.lineTo(sx(WORLD_W), sy(18));
  for (i = 16; i >= 0; i--) {
    x = (i / 16) * WORLD_W;
    y = 14 + Math.abs(Math.sin(i * 1.7 + 0.4)) * 22 + (i % 3) * 4;
    ctx.lineTo(sx(x), sy(y));
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,154,40,0.18)';
  ctx.lineWidth = 1.2 * L.s;
  ctx.stroke();

  t = G.clock;
  for (i = 0; i < motes.length; i++) {
    ctx.fillStyle = rgba(HOT, 0.07 + 0.05 * Math.sin(motes[i].ph));
    ctx.beginPath();
    ctx.arc(sx(motes[i].x), sy(motes[i].y), motes[i].s * L.s, 0, TAU);
    ctx.fill();
  }

  g = ctx.createLinearGradient(0, sy(LAVA_Y - 40), 0, sy(WORLD_H));
  g.addColorStop(0, 'rgba(255,74,24,0)');
  g.addColorStop(0.45, 'rgba(255,74,24,0.16)');
  g.addColorStop(1, 'rgba(255,40,10,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(sx(0), sy(LAVA_Y - 40), WORLD_W * L.s, (WORLD_H - LAVA_Y + 40) * L.s);
}

function drawLava() {
  var i, x0, x1, y, t, g;
  t = G.clock;
  g = ctx.createLinearGradient(0, sy(LAVA_Y - 6), 0, sy(WORLD_H + 4));
  g.addColorStop(0, '#ffb030');
  g.addColorStop(0.18, '#ff4a18');
  g.addColorStop(0.55, '#c01810');
  g.addColorStop(1, '#4a0608');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(sx(0), sy(WORLD_H + 8));
  ctx.lineTo(sx(0), sy(LAVA_Y));
  for (i = 0; i <= 32; i++) {
    x0 = (i / 32) * WORLD_W;
    y = LAVA_Y + Math.sin(t * 3.2 + i * 0.55) * 3.4 + Math.sin(t * 5.1 + i * 1.1) * 1.6;
    ctx.lineTo(sx(x0), sy(y));
  }
  ctx.lineTo(sx(WORLD_W), sy(WORLD_H + 8));
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,227,107,0.55)';
  ctx.lineWidth = 1.4 * L.s;
  ctx.beginPath();
  for (i = 0; i <= 32; i++) {
    x1 = (i / 32) * WORLD_W;
    y = LAVA_Y + Math.sin(t * 3.2 + i * 0.55) * 3.4 + Math.sin(t * 5.1 + i * 1.1) * 1.6;
    if (i === 0) ctx.moveTo(sx(x1), sy(y));
    else ctx.lineTo(sx(x1), sy(y));
  }
  ctx.stroke();
}

function drawPlat(p) {
  var x = sx(p.x);
  var y = sy(p.y);
  var w = p.w * L.s;
  var h = p.h * L.s;
  var g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, '#ffc04a');
  g.addColorStop(0.35, '#c86820');
  g.addColorStop(1, '#4a2010');
  ctx.fillStyle = g;
  ctx.strokeStyle = 'rgba(255,227,107,0.55)';
  ctx.lineWidth = 1.1 * L.s;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 3 * L.s);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,227,107,0.35)';
  ctx.fillRect(x + 2 * L.s, y + 1 * L.s, w - 4 * L.s, 2.2 * L.s);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(x + 3 * L.s, y + h - 3.2 * L.s, w - 6 * L.s, 2.2 * L.s);
}

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

function eachWrap(x, fn) {
  fn(x);
  if (x < 36) fn(x + WORLD_W);
  if (x > WORLD_W - 36) fn(x - WORLD_W);
}

function drawMount(r, ox) {
  var wing, body, neck, head, rider, lance, kind, blink;
  if (r.inv > 0 && !r.dead && ((G.clock * 16) | 0) % 2 === 0) return;
  kind = r.kind;
  ctx.save();
  ctx.translate(sx(r.x + ox), sy(r.y));
  ctx.scale(L.s * (r.face || 1), L.s);
  ctx.scale(r.sqX, r.sqY);
  if (r.dead) ctx.rotate(Math.min(1.2, r.deadT * 3.4));

  wing = r.flapT > 0
    ? -0.95 + (0.16 - Math.min(r.flapT, 0.16)) / 0.16 * 1.55
    : (r.grounded ? Math.sin(r.walk * 11) * 0.18 : Math.sin(G.clock * 9 + r.x * 0.04) * 0.28);

  if (kind === 'ptero') {
    drawPteroBody(r, wing);
    ctx.restore();
    return;
  }

  if (kind === 'ostrich' || kind === 'stork') {
    body = kind === 'ostrich' ? '#ff9a28' : '#e8f4ff';
    neck = kind === 'ostrich' ? '#ffc04a' : '#b8dcff';
    head = kind === 'ostrich' ? '#ffe36b' : '#f4fbff';
    rider = kind === 'ostrich' ? '#00f0ff' : '#ff3db8';
    lance = kind === 'ostrich' ? '#e8ffff' : '#ffd0ec';
  } else if (kind === 'bounder') {
    body = '#ff6a32'; neck = '#ff9a50'; head = '#ffc080'; rider = ''; lance = '';
  } else if (kind === 'hunter') {
    body = '#ff3db8'; neck = '#ff7ad0'; head = '#ffd0ec'; rider = ''; lance = '';
  } else {
    body = '#5a2aff'; neck = '#9b5cff'; head = '#d8c4ff'; rider = ''; lance = '';
  }

  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 14, 8, 2.2, 0, 0, TAU);
  ctx.fill();

  if (r.grounded) {
    ctx.strokeStyle = kind === 'stork' ? '#9ab0c4' : '#6a3a18';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    blink = Math.sin(r.walk * 12);
    ctx.beginPath();
    ctx.moveTo(-2, 7);
    ctx.lineTo(-3, 13);
    ctx.moveTo(3, 7);
    ctx.lineTo(4 + blink, 13);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(-2, 1);
  ctx.rotate(wing);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(-1, 0, 9, 3.4, -0.2, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(1, 3.2, 10.5, 6.4, -0.12, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.beginPath();
  ctx.ellipse(2, 1.4, 6, 2.4, -0.2, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = neck;
  ctx.lineWidth = 3.1;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(8, 1);
  ctx.quadraticCurveTo(13, -2, 14.5, -9);
  ctx.stroke();

  ctx.fillStyle = head;
  ctx.beginPath();
  ctx.ellipse(16, -10, 4.4, 3.1, 0.15, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#1a1014';
  ctx.beginPath();
  ctx.arc(17.2, -10.6, 0.85, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffb030';
  ctx.beginPath();
  ctx.moveTo(19.8, -10);
  ctx.lineTo(24.2, -8.6);
  ctx.lineTo(19.6, -7.6);
  ctx.closePath();
  ctx.fill();

  if (rider) {
    ctx.fillStyle = rider;
    ctx.beginPath();
    ctx.ellipse(1.2, -5.2, 3.4, 4.2, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2.4, -10.2, 2.1, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = lance;
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    ctx.moveTo(3.2, -8.4);
    ctx.lineTo(20, -13.5);
    ctx.stroke();
    ctx.fillStyle = lance;
    ctx.beginPath();
    ctx.moveTo(19.2, -14.6);
    ctx.lineTo(23.6, -13.4);
    ctx.lineTo(19.4, -12.2);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(4, 1, 3.5, 2.2, 0, 0, TAU);
    ctx.fill();
  }

  ctx.restore();
}

function drawPteroBody(r, wing) {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 12, 14, 2.4, 0, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.rotate(wing * 0.45);
  ctx.fillStyle = '#3a1848';
  ctx.beginPath();
  ctx.ellipse(-2, -2, 26, 5.5, -0.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#9b5cff';
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(-2, -2, 22, 3.4, -0.2, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.fillStyle = '#241028';
  ctx.beginPath();
  ctx.ellipse(2, 2, 12, 5.5, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#c4a0ff';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.quadraticCurveTo(18, -4, 22, -2);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(20, -4);
  ctx.lineTo(34, 0);
  ctx.lineTo(20, 2.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff4a64';
  ctx.beginPath();
  ctx.arc(16, -2.5, 1.4, 0, TAU);
  ctx.fill();
}

function drawEgg(e, ox) {
  var x = sx(e.x + ox);
  var y = sy(e.y);
  var pulse = 0.5 + 0.5 * Math.sin(e.age * 6);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(e.spin * 0.15);
  ctx.scale(L.s, L.s);
  ctx.fillStyle = rgba(GOLD, 0.18 + pulse * 0.12);
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 11, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffe9a0';
  ctx.beginPath();
  ctx.ellipse(0, 0, 5.4, 7.1, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,154,40,0.7)';
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(-1.4, -2.2, 1.6, 2.2, -0.4, 0, TAU);
  ctx.fill();
  if (e.age > HATCH_T - 1.6) {
    ctx.strokeStyle = rgba(MAG, 0.5 + pulse * 0.4);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 6.4, 8.2, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFx() {
  var i, o, a;
  for (i = 0; i < rings.length; i++) {
    o = rings[i];
    a = 1 - o.t / 0.36;
    ctx.strokeStyle = rgba(o.rgb, a * 0.7);
    ctx.lineWidth = 2 * L.s;
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), o.r * L.s, 0, TAU);
    ctx.stroke();
  }
  for (i = 0; i < particles.length; i++) {
    o = particles[i];
    a = clamp(o.t / (o.max || 0.3), 0, 1);
    ctx.fillStyle = rgba(o.rgb, a);
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), o.r * L.s, 0, TAU);
    ctx.fill();
  }
  for (i = 0; i < sparks.length; i++) {
    o = sparks[i];
    ctx.strokeStyle = rgba(o.rgb, clamp(o.t * 5, 0, 1));
    ctx.lineWidth = 1.2 * L.s;
    ctx.beginPath();
    ctx.moveTo(sx(o.x), sy(o.y));
    ctx.lineTo(sx(o.x - o.vx * 0.03), sy(o.y - o.vy * 0.03));
    ctx.stroke();
  }
  for (i = 0; i < feathers.length; i++) {
    o = feathers[i];
    ctx.save();
    ctx.translate(sx(o.x), sy(o.y));
    ctx.rotate(o.rot);
    ctx.fillStyle = rgba(o.rgb, clamp(o.t * 2.2, 0, 0.9));
    ctx.fillRect(-o.w * 0.5 * L.s, -1.2 * L.s, o.w * L.s, 2.4 * L.s);
    ctx.restore();
  }
  ctx.font = '700 ' + Math.max(11, 12 * L.s) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
  ctx.textAlign = 'center';
  for (i = 0; i < floats.length; i++) {
    o = floats[i];
    ctx.fillStyle = rgba(o.rgb, 1 - o.t / 0.72);
    ctx.fillText(o.text, sx(o.x), sy(o.y));
  }
}

function drawFlash() {
  if (G.flash <= 0) return;
  ctx.fillStyle = rgba(G.flashRgb, clamp(G.flash * 2.4, 0, 0.28));
  ctx.fillRect(0, 0, cssW, cssH);
}

function drawRiderWrap(r) {
  if (!r) return;
  eachWrap(r.x, function (ox) {
    drawMount(r, ox - r.x);
  });
}

function draw() {
  var i, shx, shy;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  shx = (G.shake ? (Math.random() - 0.5) * G.shake : 0) + G.kickX;
  shy = (G.shake ? (Math.random() - 0.5) * G.shake * 0.55 : 0) + G.kickY;
  ctx.translate(shx, shy);
  drawBg();
  for (i = 0; i < PLATS.length; i++) drawPlat(PLATS[i]);
  drawLava();
  for (i = 0; i < G.foes.length; i++) drawRiderWrap(G.foes[i]);
  if (G.ptero) drawRiderWrap(G.ptero);
  if (G.p2 && isTwo() && G.mode === 'play') drawRiderWrap(G.p2);
  if (G.p1) drawRiderWrap(G.p1);
  for (i = 0; i < G.eggs.length; i++) {
    eachWrap(G.eggs[i].x, function (ox) {
      drawEgg(G.eggs[i], ox - G.eggs[i].x);
    });
  }
  drawFx();
  drawFlash();
}

function autoScale() {
  if (!autoOn || G.mode !== 'play') return 1;
  return AUTO_SCALE[autoSpeed] || 1;
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
    draw();
  }
  requestAnimationFrame(frame);
}

function clearPlayerMotion() {
  keys.l = false;
  keys.r = false;
  keys.flap = false;
  keys.flapHeld = false;
  keys.l2 = false;
  keys.r2 = false;
  keys.flap2 = false;
  keys.flapHeld2 = false;
  ptr.down = false;
  ptr.id = null;
  ptr.l = false;
  ptr.r = false;
  btnLeft.classList.remove('held');
  btnRight.classList.remove('held');
  btnFlap.classList.remove('held');
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
  syncAutoUi();
  if (autoOn) {
    audio.ensure();
    clearPlayerMotion();
    if (G.mode === 'title') startRun('classic');
    else if (G.mode === 'play') hudPlay();
  } else if (G.mode === 'play') {
    hudPlay();
  }
}

function setAutoSpeed(n) {
  if (n < 1 || n > 4 || !isFinite(n)) n = 3;
  autoSpeed = n;
  saveAutoSpeed(autoSpeed);
  syncSpeedUi();
  if (autoOn && G.mode === 'play') hudPlay();
}

function isAutoKey(e) {
  return e.code === 'KeyA' || e.key === 'a' || e.key === 'A';
}

/* ---- input ---- */
function bindPad(el, setter, edge) {
  function down(ev) {
    ev.preventDefault();
    if (autoOn) return;
    setter(true);
    if (edge) edge();
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
bindPad(btnFlap, function (v) { keys.flapHeld = v; }, function () { keys.flap = true; });

function worldFromPtr(ev) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: (ev.clientX - rect.left - L.x) / L.s,
    y: (ev.clientY - rect.top - L.y) / L.s
  };
}

function setPtrSteer(x) {
  ptr.l = x < WORLD_W * 0.38;
  ptr.r = x > WORLD_W * 0.62;
}

canvas.addEventListener('pointerdown', function (ev) {
  var w;
  audio.ensure();
  canvas.focus({ preventScroll: true });
  if (G.mode !== 'play') return;
  if (autoOn) return;
  if (ev.button != null && ev.button !== 0) return;
  ev.preventDefault();
  w = worldFromPtr(ev);
  ptr.down = true;
  ptr.id = ev.pointerId;
  setPtrSteer(w.x);
  keys.flap = true;
  try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
});
canvas.addEventListener('pointermove', function (ev) {
  if (!ptr.down || ev.pointerId !== ptr.id) return;
  setPtrSteer(worldFromPtr(ev).x);
});
function ptrUp(ev) {
  if (ev && ptr.id != null && ev.pointerId !== ptr.id) return;
  ptr.down = false;
  ptr.id = null;
  ptr.l = false;
  ptr.r = false;
}
canvas.addEventListener('pointerup', ptrUp);
canvas.addEventListener('pointercancel', ptrUp);

function keyOn(e, down) {
  var k = e.code;
  var two = isTwo() && G.mode === 'play';
  if (k === 'ArrowLeft') { keys.l = down; e.preventDefault(); }
  else if (k === 'ArrowRight') { keys.r = down; e.preventDefault(); }
  else if (k === 'ArrowUp') {
    if (down && !e.repeat) keys.flap = true;
    e.preventDefault();
  } else if (k === 'Space') {
    if (down && !e.repeat && G.mode === 'play') keys.flap = true;
    e.preventDefault();
  } else if (k === 'KeyD') {
    if (two) keys.r2 = down;
    else keys.r = down;
    e.preventDefault();
  } else if (k === 'KeyW') {
    if (down && !e.repeat) {
      if (two) keys.flap2 = true;
      else keys.flap = true;
    }
    e.preventDefault();
  } else if (k === 'KeyF') {
    if (down && !e.repeat) {
      if (two) keys.flap2 = true;
      else keys.flap = true;
    }
    e.preventDefault();
  } else if (k === 'KeyS') {
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
      startRun('classic');
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      startRun('two');
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
      showTitle();
      e.preventDefault();
      return;
    }
  }
  if (autoOn) {
    if (
      e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'ArrowUp' ||
      e.code === 'ArrowDown' || e.code === 'Space' || e.code === 'KeyD' ||
      e.code === 'KeyS' || e.code === 'KeyW' || e.code === 'KeyF'
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
btnClassic.addEventListener('click', function () {
  audio.ensure();
  startRun('classic');
});
btnTwo.addEventListener('click', function () {
  audio.ensure();
  startRun('two');
});
ovRetry.addEventListener('click', function () {
  audio.ensure();
  startRun(G.kind);
});
ovMenu.addEventListener('click', function () {
  audio.ensure();
  audio.ui();
  hintEl.classList.remove('warn');
  showTitle();
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

bestEl.textContent = String(G.best);
syncSpeedUi();
syncAutoUi();
showTitle();
resize();
hudPlay();
requestAnimationFrame(frame);

}
