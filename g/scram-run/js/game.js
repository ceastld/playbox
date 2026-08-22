'use strict';

/* 地平 — Scramble remake. No CDN. */

var VW = 720;
var VH = 400;
var LIVES = 3;
var SHIP_SPD = 110;
var SHOT_V = 520;
var SHOT_MAX = 2;
var BOMB_MAX = 2;
var BOMB_G = 420;
var FUEL_MAX = 100;
var FUEL_GAIN = 34;
var FUEL_EVERY = 540;
var COMBO_WIN = 1.35;
var INVULN = 1.35;
var DIE_T = 0.72;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var CITY_END = 2500;
var CAVE_END = 5200;
var BASE_END = 7600;
var CORE_X = 7180;
var MIN_GAP = 104;
var MIN_GAP_NIGHT = 92;
var BEST_KEY = 'playbox-scram-run-best';
var MUTE_KEY = 'playbox-scram-run-mute';
var OPS = '方向键 / WASD 慢移 · 空格开火 · 下+空格 / Z 投弹 · 拖动画布跟船 · R 重开 · M 静音';

var MAG = [255, 61, 184];
var CYN = [0, 240, 255];
var GOLD = [255, 227, 107];
var HOT = [255, 106, 34];
var AMB = [255, 179, 71];
var WHT = [246, 243, 255];
var MINT = [92, 255, 196];

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
function hash2(n) {
  var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
function noise1(x) {
  var i = Math.floor(x);
  var f = x - i;
  var a = hash2(i);
  var b = hash2(i + 1);
  var u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
}
function fbm(x) {
  return noise1(x) * 0.52 + noise1(x * 2.07 + 8.2) * 0.32 + noise1(x * 4.13 + 19.4) * 0.16;
}
function comboMul(c) {
  return 1 + Math.min(4, Math.floor(Math.max(0, c - 1) / 3));
}
function sectionOf(x) {
  if (x < CITY_END) return 0;
  if (x < CAVE_END) return 1;
  return 2;
}
function sectionName(s) {
  return s === 0 ? '都市' : s === 1 ? '溶洞' : '基地';
}
function scrollSpeed(night, section) {
  var base = night ? 182 : 128;
  if (section === 1) base += night ? 10 : 8;
  if (section === 2) base += night ? 18 : 14;
  return base;
}
function fuelDrain(night) {
  return night ? 7.4 : 5.8;
}
function minGap(night) {
  return night ? MIN_GAP_NIGHT : MIN_GAP;
}
function tooth(x, scale) {
  var cell = Math.floor(x / 22);
  var h = hash2(cell * 1.37 + 4.4);
  if (h < 0.7) return 0;
  var local = x / 22 - cell;
  return Math.sin(local * Math.PI) * (h - 0.7) * scale;
}
function moveVec(l, r, u, d) {
  var dx = (r ? 1 : 0) - (l ? 1 : 0);
  var dy = (d ? 1 : 0) - (u ? 1 : 0);
  var m = Math.sqrt(dx * dx + dy * dy);
  if (m > 1) {
    dx /= m;
    dy /= m;
  }
  return { x: dx, y: dy };
}
function heights(x, night) {
  var s = sectionOf(x);
  var n = fbm(x * 0.0048);
  var n2 = fbm(x * 0.0021 + 40);
  var c;
  var f;
  var gap;
  var mid;
  var t;
  var mg = minGap(night);
  var blend;
  if (s === 0) {
    c = 14;
    f = 322 + (n - 0.5) * 26;
    blend = clamp((x - (CITY_END - 220)) / 220, 0, 1);
    if (blend > 0) {
      c = lerp(c, 86 + (n2 - 0.5) * 28, blend * blend);
      f = lerp(f, 302 + (n - 0.5) * 16, blend);
    }
  } else if (s === 1) {
    t = (x - CITY_END) / (CAVE_END - CITY_END);
    gap = lerp(208, 132, t) + (n - 0.5) * 16;
    if (night) gap *= 0.9;
    mid = 198 + (n2 - 0.5) * 64;
    c = mid - gap * 0.5 + tooth(x, 28);
    f = mid + gap * 0.5 - tooth(x + 900, 24);
  } else {
    t = clamp((x - CAVE_END) / (BASE_END - CAVE_END), 0, 1);
    gap = lerp(128, 102, t) + (n - 0.5) * 10;
    if (night) gap *= 0.9;
    mid = 200 + (n2 - 0.5) * 40;
    c = Math.round((mid - gap * 0.5) / 8) * 8 + tooth(x, 16);
    f = Math.round((mid + gap * 0.5) / 8) * 8 - tooth(x + 500, 14);
  }
  if (f - c < mg) {
    mid = (f + c) * 0.5;
    c = mid - mg * 0.5;
    f = mid + mg * 0.5;
  }
  c = clamp(c, 8, 170);
  f = clamp(f, 190, 392);
  if (f - c < mg) f = c + mg;
  if (x > CORE_X + 50) {
    t = clamp((x - CORE_X - 50) / 70, 0, 1);
    mid = (c + f) * 0.5;
    c = lerp(c, mid - 6, t);
    f = lerp(f, mid + 6, t);
  }
  return { c: c, f: f };
}
function fuelXForSlot(slot) {
  return slot * FUEL_EVERY + 90 + hash2(slot * 9.1) * 140;
}
function whyText(w) {
  if (w === 'wall') return '撞壁了';
  if (w === 'shot') return '中弹了';
  if (w === 'fuel') return '燃油耗尽';
  if (w === 'hit') return '撞机了';
  return '坠机了';
}
function makeShip() {
  return { sx: 96, sy: 200, vx: 0, vy: 0 };
}
function makeShot(x, y) {
  return { x: x, y: y, vx: SHOT_V, r: 3.2, life: 1.45, dead: false };
}
function makeBomb(x, y) {
  return { x: x, y: y, vx: 168, vy: 70, r: 4.2, life: 1.6, dead: false };
}
function makeFuel(x, floorY) {
  return { kind: 'fuel', x: x, y: floorY - 16, w: 18, h: 16, score: 150, fuel: FUEL_GAIN, dead: false };
}
function makeBldg(x, floorY, w, h) {
  return { kind: 'bldg', x: x, y: floorY - h, w: w, h: h, hp: 1, score: 20, dead: false };
}
function makeGun(x, floorY) {
  return { kind: 'gun', x: x, y: floorY - 14, w: 16, h: 14, cd: rand(0.4, 1.2), score: 80, dead: false, flash: 0 };
}
function makeRocket(x, floorY) {
  return {
    kind: 'rocket',
    x: x,
    y: floorY - 18,
    w: 10,
    h: 18,
    launched: false,
    vy: 0,
    score: 50,
    dead: false
  };
}
function makeUfo(x, y) {
  return {
    kind: 'ufo',
    x: x,
    y: y,
    w: 22,
    h: 10,
    bob: hash2(x * 0.2) * TAU,
    amp: 18 + hash2(x * 0.11) * 16,
    baseY: y,
    vx: -38 - hash2(x) * 28,
    cd: rand(0.8, 1.6),
    score: 100,
    dead: false,
    hitT: 0
  };
}
function makeFire(x, y) {
  return { kind: 'fire', x: x, y: y, w: 10, h: 10, vx: -90, vy: 0, score: 40, dead: false, ph: rand(0, TAU) };
}
function makeCore(x, floorY, ceilY) {
  var h = clamp(floorY - ceilY - 14, 56, 96);
  return { kind: 'core', x: x, y: floorY - h, w: 72, h: h, hp: 8, score: 800, dead: false, flash: 0 };
}
function makeEbullet(x, y, vx, vy) {
  return { x: x, y: y, vx: vx, vy: vy, r: 3, life: 2.4, dead: false };
}
function shipBox(ship, cam) {
  return { x: cam + ship.sx - 9, y: ship.sy - 5, w: 20, h: 10 };
}
function entBox(e) {
  return { x: e.x, y: e.y, w: e.w, h: e.h };
}
function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function circleHits(x, y, r, b) {
  var cx = clamp(x, b.x, b.x + b.w);
  var cy = clamp(y, b.y, b.y + b.h);
  var dx = x - cx;
  var dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}
function terrainHit(x, y, night) {
  var h = heights(x, night);
  return y < h.c + 1 || y > h.f - 1;
}
function inExplode(x, y, r, e) {
  return circleHits(x, y, r, entBox(e));
}

function selfCheck() {
  var v, h0, h1, h2, n1, b, s, slot, fx, i, gap0, gap1, gap2, ng;
  if (BEST_KEY !== 'playbox-scram-run-best') throw new Error('best key');
  if (MUTE_KEY !== 'playbox-scram-run-mute') throw new Error('mute key');
  if (LIVES !== 3) throw new Error('3 lives');
  if (CITY_END >= CAVE_END) throw new Error('section order');
  if (CORE_X <= CAVE_END || CORE_X >= BASE_END) throw new Error('core in base');
  if (scrollSpeed(true, 0) <= scrollSpeed(false, 0)) throw new Error('night faster');
  if (scrollSpeed(false, 2) <= scrollSpeed(false, 0)) throw new Error('base faster');
  if (fuelDrain(true) <= fuelDrain(false)) throw new Error('night hungrier');
  if (comboMul(1) !== 1) throw new Error('combo 1');
  if (comboMul(4) !== 2) throw new Error('combo 4');
  if (comboMul(7) !== 3) throw new Error('combo 7');
  if (comboMul(13) !== 5) throw new Error('combo cap');
  v = moveVec(true, false, true, false);
  if (Math.abs(Math.abs(v.x) - 0.7071) > 0.02) throw new Error('8dir');
  if (Math.abs(v.x - v.y) > 0.001) throw new Error('8dir equal');
  v = moveVec(false, true, false, false);
  if (v.x !== 1 || v.y !== 0) throw new Error('cardinal');
  h0 = heights(400, false);
  h1 = heights(3800, false);
  h2 = heights(6400, false);
  n1 = heights(3800, true);
  gap0 = h0.f - h0.c;
  gap1 = h1.f - h1.c;
  gap2 = h2.f - h2.c;
  ng = n1.f - n1.c;
  if (gap0 < 200) throw new Error('city open');
  if (gap1 >= gap0 - 20) throw new Error('cavern tighter');
  if (gap2 >= gap1 + 6) throw new Error('base tighter');
  if (ng >= gap1) throw new Error('night tighter');
  if (gap1 < MIN_GAP || gap2 < MIN_GAP) throw new Error('min gap');
  if (ng < MIN_GAP_NIGHT - 1) throw new Error('night min');
  if (sectionOf(100) !== 0 || sectionOf(3000) !== 1 || sectionOf(6000) !== 2) throw new Error('sections');
  if (sectionName(0) !== '都市' || sectionName(2) !== '基地') throw new Error('names');
  b = makeBomb(0, 0);
  if (b.vy <= 0) throw new Error('bomb falls');
  if (BOMB_G < 200) throw new Error('bomb gravity');
  s = makeShot(0, 0);
  if (s.vx < 400) throw new Error('shot forward');
  if (s.life * s.vx < VW - 40) throw new Error('shot reach');
  if (SHOT_MAX < 1 || BOMB_MAX < 1) throw new Error('ammo');
  slot = 3;
  fx = fuelXForSlot(slot);
  if (fx < slot * FUEL_EVERY || fx > (slot + 1) * FUEL_EVERY + 80) throw new Error('fuel slot');
  if (FUEL_GAIN < 20) throw new Error('fuel gain');
  if (fuelDrain(false) * (FUEL_EVERY / scrollSpeed(false, 0)) > FUEL_GAIN + 8) throw new Error('fuel economy');
  if (whyText('fuel') !== '燃油耗尽') throw new Error('why');
  if (!terrainHit(400, 2, false)) throw new Error('ceil hit');
  if (!terrainHit(400, 390, false)) throw new Error('floor hit');
  if (terrainHit(400, 200, false)) throw new Error('mid safe');
  if (!overlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 8, y: 8, w: 10, h: 10 })) throw new Error('overlap');
  if (overlap({ x: 0, y: 0, w: 4, h: 4 }, { x: 8, y: 8, w: 4, h: 4 })) throw new Error('no overlap');
  if (!circleHits(6, 6, 4, { x: 8, y: 8, w: 4, h: 4 })) throw new Error('circle');
  if (circleHits(0, 0, 2, { x: 8, y: 8, w: 4, h: 4 })) throw new Error('circle miss');
  i = makeCore(CORE_X, 320, 80);
  if (i.hp < 6) throw new Error('core hp');
  if (i.kind !== 'core') throw new Error('core kind');
  (function () {
    var x = 0;
    var fuel = FUEL_MAX;
    var tanks = 0;
    var slot;
    var fx;
    var dt = 0.05;
    var sp;
    var end = CORE_X - 40;
    var seen = {};
    while (x < end) {
      sp = scrollSpeed(false, sectionOf(x));
      x += sp * dt;
      fuel -= fuelDrain(false) * dt;
      slot = Math.floor((x - 90) / FUEL_EVERY);
      if (slot >= 1 && !seen[slot]) {
        fx = fuelXForSlot(slot);
        if (x >= fx) {
          seen[slot] = 1;
          fuel = Math.min(FUEL_MAX, fuel + FUEL_GAIN);
          tanks += 1;
        }
      }
    }
    if (tanks < 8) throw new Error('too few tanks');
    if (fuel < 20) throw new Error('cannot reach core on fuel');
    h2 = heights(CORE_X + 140, false);
    if (h2.f - h2.c > 20) throw new Error('core seals');
  }());
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
var ovRetry = document.getElementById('ov-retry');
var ovModes = document.getElementById('ov-modes');
var btnCave = document.getElementById('btn-cave');
var btnNight = document.getElementById('btn-night');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnShot = document.getElementById('btn-shot');
var btnBomb = document.getElementById('btn-bomb');
var scoreEl = document.getElementById('score');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var secLabel = document.getElementById('sec-label');
var fuelBar = document.getElementById('fuel-bar');
var fuelWrap = document.getElementById('fuel-wrap');
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
var pingTok = 0;
var fuelWarnTok = 0;

var particles = [];
var sparks = [];
var floats = [];
var rings = [];
var stars = [];

var keys = { l: false, r: false, u: false, d: false, shot: false, bomb: false, space: false };
var pointer = { down: false, hover: false, x: 96, y: 200, id: null };
var inputSrc = 'key';
var pips = [];

var G = {
  mode: 'title',
  night: false,
  t: 0,
  clock: 0,
  cam: 0,
  spawnX: 0,
  ship: makeShip(),
  lives: LIVES,
  fuel: FUEL_MAX,
  score: 0,
  bestC: 0,
  bestN: 0,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  shots: [],
  bombs: [],
  ents: [],
  ebullets: [],
  shotCd: 0,
  bombCd: 0,
  holdShot: false,
  holdBomb: false,
  muzzle: 0,
  stop: 0,
  shake: 0,
  punch: 1,
  flash: 0,
  flashRgb: CYN,
  deadT: 0,
  invuln: 0,
  winT: 0,
  why: '',
  section: 0,
  core: null,
  warned: false
};

function reduceOn() {
  return motionQ && motionQ.matches;
}

var audio = {
  ctx: null,
  master: null,
  muted: false,
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
    if (btnMute) {
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
    }
    try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (err) { /* ignore */ }
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
  noise: function (dur, vol, hp) {
    if (!this.ctx || this.muted) return;
    var n = Math.max(0.04, dur);
    var sr = this.ctx.sampleRate;
    var buf = this.ctx.createBuffer(1, Math.max(1, (sr * n) | 0), sr);
    var data = buf.getChannelData(0);
    var i;
    for (i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    var src = this.ctx.createBufferSource();
    src.buffer = buf;
    var f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = hp || 900;
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
  rumble: function (dur, vol) {
    if (!this.ctx || this.muted) return;
    var n = Math.max(0.06, dur);
    var sr = this.ctx.sampleRate;
    var buf = this.ctx.createBuffer(1, Math.max(1, (sr * n) | 0), sr);
    var data = buf.getChannelData(0);
    var i;
    for (i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    var src = this.ctx.createBufferSource();
    src.buffer = buf;
    var f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 220;
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
    this.beep(880, 0.055, 'square', 0.03, 1640);
  },
  bomb: function () {
    this.ensure();
    this.beep(180, 0.08, 'sawtooth', 0.04, 90);
    this.rumble(0.16, 0.07);
  },
  boom: function (big) {
    this.ensure();
    this.noise(big ? 0.16 : 0.07, big ? 0.07 : 0.04, big ? 280 : 700);
    this.beep(big ? 220 : 360, big ? 0.2 : 0.08, 'sawtooth', 0.045, 70);
  },
  hit: function (combo) {
    this.ensure();
    var lift = 1 + Math.min(0.5, combo * 0.04);
    this.noise(0.04, 0.035, 1100);
    this.beep(520 * lift, 0.07, 'square', 0.045, 880 * lift);
  },
  fuel: function () {
    this.ensure();
    this.beep(660, 0.07, 'sine', 0.05, 990);
    this.beep(990, 0.12, 'triangle', 0.045, 1480);
    this.beep(1320, 0.16, 'sine', 0.03, 1760);
  },
  combo: function (m) {
    this.ensure();
    this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
    this.beep(880, 0.12, 'triangle', 0.03, 1320);
  },
  warn: function () {
    this.ensure();
    this.beep(240, 0.09, 'square', 0.035, 160);
  },
  death: function () {
    this.ensure();
    this.noise(0.14, 0.06, 320);
    this.rumble(0.22, 0.08);
    this.beep(280, 0.18, 'sawtooth', 0.05, 70);
    this.beep(140, 0.3, 'sine', 0.045, 48);
  },
  win: function () {
    this.ensure();
    this.beep(392, 0.1, 'square', 0.045, 523);
    this.beep(523, 0.12, 'sine', 0.04, 659);
    this.beep(784, 0.22, 'triangle', 0.05, 1046);
  },
  start: function () {
    this.ensure();
    this.beep(392, 0.08, 'square', 0.04, 784);
    this.beep(784, 0.12, 'triangle', 0.035, 1175);
  },
  section: function () {
    this.ensure();
    this.beep(523, 0.09, 'sine', 0.035, 784);
  }
};

function currentBest() {
  return G.night ? G.bestN : G.bestC;
}
function loadBest() {
  var raw, o;
  G.bestC = 0;
  G.bestN = 0;
  try {
    raw = localStorage.getItem(BEST_KEY);
    if (raw) {
      o = JSON.parse(raw);
      if (o && typeof o === 'object') {
        G.bestC = Math.max(0, parseInt(o.c, 10) || 0);
        G.bestN = Math.max(0, parseInt(o.n, 10) || 0);
      } else {
        G.bestC = Math.max(0, parseInt(raw, 10) || 0);
      }
    }
  } catch (err) { /* ignore */ }
  if (bestEl) bestEl.textContent = String(currentBest());
}
function persistBest() {
  var cur = currentBest();
  if (G.score > cur) {
    if (G.night) G.bestN = G.score;
    else G.bestC = G.score;
    if (bestEl) bestEl.textContent = String(G.score);
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ c: G.bestC, n: G.bestN }));
  } catch (err) { /* ignore */ }
}
function addScore(n, x, y, gold) {
  var mul, got;
  if (G.mode !== 'play' || n <= 0) return;
  mul = comboMul(G.combo);
  got = Math.round(n * mul);
  G.score += got;
  persistBest();
  if (scoreEl) scoreEl.textContent = String(G.score);
  if (scoreBox) {
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
  }
  if (scoreAdd) {
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + got;
    addTok += 1;
    (function (tok) {
      setTimeout(function () { if (tok === addTok) scoreAdd.hidden = true; }, 680);
    }(addTok));
  }
  if (x != null) {
    floats.push({
      x: x,
      y: y,
      text: mul > 1 ? '+' + got + ' ×' + mul : '+' + got,
      t: 0,
      life: 0.7,
      gold: !!gold,
      rgb: gold ? GOLD : AMB,
      size: mul > 1 ? 15 : 13
    });
  }
}
function bumpCombo() {
  var prev = comboMul(G.combo);
  var now;
  G.combo += 1;
  G.comboAge = 0;
  if (G.combo > G.maxCombo) G.maxCombo = G.combo;
  now = comboMul(G.combo);
  if (comboEl) comboEl.textContent = '×' + now;
  if (comboBox) {
    comboBox.classList.remove('hot');
    void comboBox.offsetWidth;
    comboBox.classList.add('hot');
  }
  if (now > prev) audio.combo(now);
}
function ageCombo(dt) {
  if (G.combo <= 0) return;
  G.comboAge += dt;
  if (G.comboAge > COMBO_WIN) {
    G.combo = 0;
    G.comboAge = 0;
    if (comboEl) comboEl.textContent = '×1';
  }
}
function setHint(text, cls) {
  if (!hintEl) return;
  hintEl.textContent = text;
  hintEl.classList.toggle('hot', cls === 'hot');
  hintEl.classList.toggle('warn', cls === 'warn');
}
function toast(text, kind, ms) {
  if (!toastEl) return;
  toastEl.textContent = text;
  toastEl.classList.remove('hidden', 'warn', 'gold', 'fuel');
  if (kind) toastEl.classList.add(kind);
  toastTok += 1;
  (function (tok) {
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, ms || 900);
  }(toastTok));
}
function overlayOpen() {
  return !!(overlayEl && !overlayEl.classList.contains('hidden'));
}
function showOverlay(kind, title, lead) {
  if (!overlayEl) return;
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.classList.toggle('win', kind === 'win');
  panelEl.classList.toggle('lose', kind === 'lose');
  ovKicker.textContent = kind === 'win' ? 'CLEAR' : kind === 'lose' ? 'DOWN' : 'SCRAM';
  ovTitle.textContent = title;
  ovLead.textContent = lead;
  ovOps.textContent = OPS;
  ovStart.classList.toggle('gone', kind !== 'title');
  ovEnd.classList.toggle('gone', kind === 'title');
}
function hideOverlay() {
  if (!overlayEl) return;
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  if (canvas && canvas.focus) canvas.focus();
}
function syncPips() {
  var i, el;
  if (!pipsEl) return;
  if (pips.length !== LIVES) {
    pipsEl.innerHTML = '';
    pips = [];
    for (i = 0; i < LIVES; i++) {
      el = document.createElement('span');
      el.className = 'pip';
      pipsEl.appendChild(el);
      pips.push(el);
    }
  }
  for (i = 0; i < LIVES; i++) {
    pips[i].classList.toggle('on', i < G.lives);
    pips[i].classList.toggle('gone', i >= G.lives);
  }
}
function syncFuel() {
  var k = clamp(G.fuel / FUEL_MAX, 0, 1);
  if (fuelBar) fuelBar.style.transform = 'scaleX(' + k + ')';
  if (fuelWrap) fuelWrap.classList.toggle('warn', G.mode === 'play' && G.fuel < 26 && G.fuel > 0);
}
function syncHud() {
  if (scoreEl) scoreEl.textContent = String(G.score);
  if (bestEl) bestEl.textContent = String(currentBest());
  if (comboEl) comboEl.textContent = '×' + comboMul(G.combo);
  if (modeLabel) {
    modeLabel.textContent = G.night ? '夜袭' : '洞穴';
    modeLabel.classList.toggle('night', G.night);
  }
  if (secLabel) {
    secLabel.textContent = sectionName(G.section);
    secLabel.classList.toggle('hot', G.section === 2);
  }
  syncFuel();
  syncPips();
  if (G.mode === 'title') setHint(OPS, '');
  else if (G.mode === 'lose') setHint('R 重开 · ' + whyText(G.why), 'warn');
  else if (G.mode === 'win') setHint('R 重开 · 基地捣毁', 'hot');
  else if (G.fuel < 26) setHint('燃油低 · 打油桶', 'warn');
  else setHint('空格开火 · 下+空格 / Z 投弹 · 打油桶续航', '');
}

function hitStop(sec) {
  if (reduceOn() || G.mode !== 'play') return;
  G.stop = Math.max(G.stop, sec);
}
function kick(mag, cls) {
  if (reduceOn() || !stageEl) return;
  G.shake = Math.max(G.shake, mag);
  G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.006));
  kickTok += 1;
  stageEl.classList.remove('die', 'hit', 'boom', 'fuel');
  void stageEl.offsetWidth;
  stageEl.classList.add(cls || (mag >= 6 ? 'die' : 'hit'));
}
function screenFlash(rgb, a) {
  G.flash = Math.max(G.flash, a || 0.4);
  G.flashRgb = rgb;
}
function capArr(arr, n) {
  if (arr.length > n) arr.splice(0, arr.length - n);
}
function emit(n, spec) {
  var i;
  for (i = 0; i < n; i++) {
    particles.push({
      x: spec.x + rand(-spec.j, spec.j),
      y: spec.y + rand(-spec.j, spec.j),
      vx: rand(spec.vx0, spec.vx1),
      vy: rand(spec.vy0, spec.vy1),
      r: rand(spec.r0, spec.r1),
      life: rand(spec.life * 0.55, spec.life),
      max: spec.life,
      rgb: spec.rgb,
      g: spec.g == null ? 380 : spec.g
    });
  }
  capArr(particles, 320);
}
function popSpark(x, y, rgb, rad) {
  sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
  capArr(sparks, 48);
}
function popRing(x, y, rgb) {
  rings.push({ x: x, y: y, t: 0, r: 6, rgb: rgb });
  capArr(rings, 24);
}
function boomAt(x, y, rgb, n, mag) {
  emit(n, {
    x: x, y: y, j: 8,
    vx0: -140, vx1: 160, vy0: -220, vy1: 80,
    r0: 1.4, r1: 3.6, life: 0.42, rgb: rgb, g: 260
  });
  popSpark(x, y, rgb, 12 + mag * 1.4);
  popRing(x, y, rgb);
}

function wx() {
  return G.cam + G.ship.sx;
}
function sx(x) {
  return L.x + (x - G.cam) * L.s;
}
function sy(y) {
  return L.y + y * L.s;
}

function nearFuelWorld(x) {
  var slot = Math.round((x - 90) / FUEL_EVERY);
  var fx = fuelXForSlot(Math.max(0, slot));
  return Math.abs(x - fx) < 46;
}
function stampRange(x0, x1) {
  var night = G.night;
  var slot, fuelX, h, x, r, sec, bh, bw, mid, e;
  slot = Math.floor((x0 - 40) / FUEL_EVERY);
  while (slot * FUEL_EVERY < x1 + 80) {
    fuelX = fuelXForSlot(slot);
    if (fuelX >= x0 && fuelX < x1 && fuelX > 220 && fuelX < CORE_X - 90) {
      h = heights(fuelX, night);
      G.ents.push(makeFuel(fuelX, h.f));
    }
    slot += 1;
  }
  for (x = Math.ceil(x0 / 86) * 86; x < x1; x += 86) {
    if (x < 140 || x > CORE_X - 50) continue;
    if (nearFuelWorld(x)) continue;
    r = hash2(x * 0.017 + 3.3 + (night ? 1.7 : 0));
    sec = sectionOf(x);
    h = heights(x, night);
    mid = (h.c + h.f) * 0.5;
    if (sec === 0) {
      if (r < 0.46) {
        bw = 16 + hash2(x + 2) * 18;
        bh = 20 + hash2(x + 5) * 58;
        G.ents.push(makeBldg(x, h.f, bw, bh));
      } else if (r < 0.62) {
        G.ents.push(makeGun(x, h.f));
      } else if (r < 0.84) {
        G.ents.push(makeRocket(x, h.f));
      }
      if (hash2(x * 0.09 + 8) > 0.82) {
        G.ents.push(makeUfo(x + 40, 70 + hash2(x) * 50));
      }
    } else if (sec === 1) {
      if (r < 0.22) G.ents.push(makeGun(x, h.f));
      else if (r < 0.5) G.ents.push(makeRocket(x, h.f));
      else if (r < 0.72) G.ents.push(makeUfo(x, mid + (hash2(x + 1) - 0.5) * 30));
      if (night && hash2(x * 0.13) > 0.7) {
        G.ents.push(makeFire(x + 30, mid + (hash2(x + 4) - 0.5) * 40));
      }
    } else {
      if (r < 0.38) G.ents.push(makeGun(x, h.f));
      else if (r < 0.62) G.ents.push(makeRocket(x, h.f));
      else if (r < 0.78) G.ents.push(makeUfo(x, mid));
      if (night && hash2(x * 0.19) > 0.62) {
        G.ents.push(makeFire(x + 20, mid));
      }
    }
  }
  if (!G.core && x0 <= CORE_X && x1 > CORE_X) {
    h = heights(CORE_X, night);
    e = makeCore(CORE_X, h.f, h.c);
    G.ents.push(e);
    G.core = e;
  }
}
function ensureWorld() {
  var target = G.cam + VW + 280;
  var step = 240;
  var i, e;
  while (G.spawnX < target) {
    stampRange(G.spawnX, G.spawnX + step);
    G.spawnX += step;
  }
  for (i = G.ents.length - 1; i >= 0; i--) {
    e = G.ents[i];
    if (e.dead || e.x + (e.w || 0) < G.cam - 80) G.ents.splice(i, 1);
  }
  for (i = G.ebullets.length - 1; i >= 0; i--) {
    if (G.ebullets[i].dead || G.ebullets[i].x < G.cam - 40) G.ebullets.splice(i, 1);
  }
}

function resetRun(night) {
  G.night = !!night;
  G.mode = 'play';
  G.t = 0;
  G.clock = 0;
  G.cam = 0;
  G.spawnX = 0;
  G.ship = makeShip();
  G.lives = LIVES;
  G.fuel = FUEL_MAX;
  G.score = 0;
  G.combo = 0;
  G.maxCombo = 0;
  G.comboAge = 0;
  G.shots = [];
  G.bombs = [];
  G.ents = [];
  G.ebullets = [];
  G.shotCd = 0;
  G.bombCd = 0;
  G.muzzle = 0;
  G.stop = 0;
  G.shake = 0;
  G.punch = 1;
  G.flash = 0;
  G.deadT = 0;
  G.invuln = 0;
  G.winT = 0;
  G.why = '';
  G.section = 0;
  G.core = null;
  G.warned = false;
  particles.length = 0;
  sparks.length = 0;
  floats.length = 0;
  rings.length = 0;
  ensureWorld();
  syncHud();
}

function goTitle() {
  G.mode = 'title';
  G.night = false;
  G.cam = 80;
  G.spawnX = 0;
  G.ents = [];
  G.ebullets = [];
  G.shots = [];
  G.bombs = [];
  G.ship = makeShip();
  G.ship.sx = 120;
  G.ship.sy = 188;
  G.fuel = FUEL_MAX;
  G.score = 0;
  G.combo = 0;
  G.lives = LIVES;
  G.section = 0;
  G.core = null;
  G.deadT = 0;
  G.winT = 0;
  G.stop = 0;
  ensureWorld();
  syncHud();
  showOverlay('title', '地平', '洞穴自己往前开。开火打前头，丢炸弹砸地上，打油桶续航。撞壁即坠。');
}
function startGame(night) {
  audio.start();
  resetRun(night);
  hideOverlay();
  toast(night ? '夜袭 · 更快更暗' : '洞穴 · 都市', night ? 'fuel' : 'gold', 900);
  setHint('空格开火 · 下+空格 / Z 投弹 · 打油桶续航', '');
}
function goLose() {
  G.mode = 'lose';
  persistBest();
  syncHud();
  showOverlay('lose', '坠机了', whyText(G.why) + ' · ' + (G.night ? '夜袭' : '洞穴') + '  ' + G.score + ' 分 · 连击最高 ' + G.maxCombo);
}
function goWin() {
  G.mode = 'win';
  persistBest();
  syncHud();
  audio.win();
  showOverlay('win', '捣毁了', (G.night ? '夜袭' : '洞穴') + ' 基地清空 · ' + G.score + ' 分 · 连击最高 ' + G.maxCombo);
}
function restart() {
  audio.ensure();
  if (G.mode === 'title') startGame(false);
  else startGame(G.night);
}

function fireShot() {
  var n = 0;
  var i;
  if (G.mode !== 'play' || G.deadT > 0) return;
  if (G.shotCd > 0) return;
  for (i = 0; i < G.shots.length; i++) if (!G.shots[i].dead) n += 1;
  if (n >= SHOT_MAX) return;
  G.shots.push(makeShot(wx() + 14, G.ship.sy));
  G.shotCd = 0.11;
  G.muzzle = 0.06;
  if (!reduceOn()) G.punch = Math.max(G.punch, 1.012);
  audio.shoot();
  emit(4, {
    x: wx() + 14, y: G.ship.sy, j: 2,
    vx0: 80, vx1: 220, vy0: -40, vy1: 40,
    r0: 1, r1: 2.2, life: 0.16, rgb: CYN, g: 0
  });
  screenFlash(CYN, 0.16);
}
function dropBomb() {
  var n = 0;
  var i;
  if (G.mode !== 'play' || G.deadT > 0) return;
  if (G.bombCd > 0) return;
  for (i = 0; i < G.bombs.length; i++) if (!G.bombs[i].dead) n += 1;
  if (n >= BOMB_MAX) return;
  G.bombs.push(makeBomb(wx() + 4, G.ship.sy + 6));
  G.bombCd = 0.2;
  audio.bomb();
  kick(3.2, 'hit');
  emit(5, {
    x: wx() + 4, y: G.ship.sy + 6, j: 3,
    vx0: 20, vx1: 80, vy0: 20, vy1: 80,
    r0: 1.2, r1: 2.4, life: 0.2, rgb: GOLD, g: 200
  });
}

function killEnt(e, src) {
  var rgb, n, mag, extra;
  if (e.dead) return;
  e.dead = true;
  rgb = e.kind === 'fuel' ? GOLD : e.kind === 'ufo' ? CYN : e.kind === 'core' ? MAG : HOT;
  n = e.kind === 'core' ? 42 : e.kind === 'fuel' ? 22 : 14;
  mag = e.kind === 'core' ? 8 : src === 'bomb' ? 5.5 : 3.4;
  boomAt(e.x + e.w * 0.5, e.y + e.h * 0.5, rgb, n, mag);
  if (e.kind === 'fuel') {
    G.fuel = Math.min(FUEL_MAX, G.fuel + e.fuel);
    syncFuel();
    audio.fuel();
    hitStop(0.055);
    kick(4.2, 'fuel');
    screenFlash(GOLD, 0.38);
    toast('燃油 +' + e.fuel, 'fuel', 700);
    if (fuelWrap) {
      fuelWrap.classList.add('ping');
      pingTok += 1;
      (function (tok) {
        setTimeout(function () { if (tok === pingTok) fuelWrap.classList.remove('ping'); }, 380);
      }(pingTok));
    }
    floats.push({
      x: e.x + e.w * 0.5,
      y: e.y,
      text: '+燃油',
      t: 0,
      life: 0.72,
      gold: true,
      rgb: GOLD,
      size: 14
    });
  } else {
    audio.hit(G.combo + 1);
    hitStop(e.kind === 'core' ? 0.078 : src === 'bomb' ? 0.055 : 0.038);
    kick(mag, src === 'bomb' ? 'boom' : 'hit');
    screenFlash(rgb, e.kind === 'core' ? 0.55 : 0.28);
  }
  bumpCombo();
  extra = e.kind === 'core' ? 800 : e.score;
  addScore(extra, e.x + e.w * 0.5, e.y, e.kind === 'fuel' || e.kind === 'core');
  if (e.kind === 'core') {
    audio.boom(true);
    G.winT = 0.85;
  }
}

function explodeBomb(b) {
  var i, e, r;
  if (b.dead) return;
  b.dead = true;
  r = 34;
  audio.boom(true);
  audio.rumble(0.18, 0.08);
  hitStop(0.058);
  kick(6.5, 'boom');
  screenFlash(HOT, 0.42);
  boomAt(b.x, b.y, HOT, 28, 7);
  emit(10, {
    x: b.x, y: b.y, j: 6,
    vx0: -80, vx1: 80, vy0: -160, vy1: -20,
    r0: 2, r1: 4.4, life: 0.5, rgb: GOLD, g: 180
  });
  for (i = 0; i < G.ents.length; i++) {
    e = G.ents[i];
    if (e.dead) continue;
    if (inExplode(b.x, b.y, r, e)) {
      if (e.kind === 'core') {
        e.hp -= 3;
        e.flash = 0.12;
        if (e.hp <= 0) killEnt(e, 'bomb');
        else {
          audio.hit(G.combo);
          bumpCombo();
          addScore(40, e.x + 20, e.y, false);
        }
      } else killEnt(e, 'bomb');
    }
  }
}

function crash(why) {
  var i;
  if (G.deadT > 0 || G.mode !== 'play') return;
  G.why = why;
  G.deadT = DIE_T;
  G.lives -= 1;
  G.holdShot = false;
  G.holdBomb = false;
  audio.death();
  hitStop(0.08);
  kick(8, 'die');
  screenFlash(MAG, 0.6);
  boomAt(wx(), G.ship.sy, MAG, 36, 9);
  emit(16, {
    x: wx(), y: G.ship.sy, j: 8,
    vx0: -180, vx1: 180, vy0: -240, vy1: 80,
    r0: 2, r1: 5, life: 0.55, rgb: HOT, g: 200
  });
  for (i = 0; i < G.shots.length; i++) G.shots[i].dead = true;
  for (i = 0; i < G.bombs.length; i++) G.bombs[i].dead = true;
  syncPips();
  toast(whyText(why), 'warn', 800);
}
function respawn() {
  var h;
  G.cam = Math.max(0, G.cam - 70);
  G.ship.sx = 96;
  h = heights(G.cam + 96, G.night);
  G.ship.sy = (h.c + h.f) * 0.5;
  G.fuel = Math.max(G.fuel, 72);
  G.invuln = INVULN;
  G.deadT = 0;
  G.combo = 0;
  G.comboAge = 0;
  G.ebullets = [];
  syncHud();
}

function tickShip(dt) {
  var v, h, pad, nx, ny, aimX, aimY, dx, dy, m, spd;
  var kspd = SHIP_SPD;
  if (G.invuln > 0) G.invuln -= dt;
  if (G.muzzle > 0) G.muzzle -= dt;
  if (G.shotCd > 0) G.shotCd -= dt;
  if (G.bombCd > 0) G.bombCd -= dt;
  if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
    aimX = clamp(pointer.x, 40, 310);
    aimY = clamp(pointer.y, 24, VH - 24);
    dx = aimX - G.ship.sx;
    dy = aimY - G.ship.sy;
    m = hypot(dx, dy);
    spd = kspd * 1.25;
    if (m > 2) {
      G.ship.sx += (dx / m) * Math.min(spd, m / dt) * dt;
      G.ship.sy += (dy / m) * Math.min(spd, m / dt) * dt;
    }
  } else {
    v = moveVec(keys.l, keys.r, keys.u, keys.d);
    G.ship.sx += v.x * kspd * dt;
    G.ship.sy += v.y * kspd * dt;
  }
  G.ship.sx = clamp(G.ship.sx, 36, 308);
  h = heights(wx(), G.night);
  pad = 11;
  ny = clamp(G.ship.sy, h.c + pad, h.f - pad);
  G.ship.sy = ny;
  nx = wx();
  if (G.invuln <= 0) {
    if (terrainHit(nx - 6, G.ship.sy, G.night) || terrainHit(nx + 10, G.ship.sy, G.night) ||
        terrainHit(nx, G.ship.sy - 5, G.night) || terrainHit(nx, G.ship.sy + 5, G.night)) {
      crash('wall');
      return;
    }
  }
  if (inputSrc === 'key' && keys.space && keys.d) dropBomb();
  else if (G.holdShot) fireShot();
  if (G.holdBomb && !(inputSrc === 'key' && keys.space && keys.d)) dropBomb();
  emit(G.night ? 1 : 1, {
    x: nx - 12, y: G.ship.sy + rand(-2, 2), j: 1,
    vx0: -80, vx1: -30, vy0: -18, vy1: 18,
    r0: 1, r1: 2.1, life: 0.18, rgb: G.night ? MAG : HOT, g: 0
  });
}
function tickFuel(dt) {
  if (G.invuln > 0) return;
  G.fuel -= fuelDrain(G.night) * dt;
  if (G.fuel < 0) G.fuel = 0;
  syncFuel();
  if (G.fuel <= 0) {
    crash('fuel');
    return;
  }
  if (G.fuel < 26 && !G.warned) {
    G.warned = true;
    audio.warn();
    toast('燃油低', 'warn', 800);
  }
  if (G.fuel > 32) G.warned = false;
}
function tickShots(dt) {
  var i, s, j, e, hit;
  for (i = G.shots.length - 1; i >= 0; i--) {
    s = G.shots[i];
    if (s.dead) {
      G.shots.splice(i, 1);
      continue;
    }
    s.x += s.vx * dt;
    s.life -= dt;
    if (s.life <= 0 || s.x > G.cam + VW + 20) {
      s.dead = true;
      G.shots.splice(i, 1);
      continue;
    }
    if (terrainHit(s.x, s.y, G.night)) {
      popSpark(s.x, s.y, CYN, 8);
      emit(5, {
        x: s.x, y: s.y, j: 3,
        vx0: -40, vx1: 40, vy0: -60, vy1: 20,
        r0: 1, r1: 2, life: 0.18, rgb: CYN, g: 0
      });
      G.shots.splice(i, 1);
      continue;
    }
    hit = false;
    for (j = 0; j < G.ents.length; j++) {
      e = G.ents[j];
      if (e.dead) continue;
      if (circleHits(s.x, s.y, s.r + 1, entBox(e))) {
        hit = true;
        if (e.kind === 'core') {
          e.hp -= 1;
          e.flash = 0.1;
          popSpark(s.x, s.y, MAG, 10);
          if (e.hp <= 0) killEnt(e, 'shot');
          else {
            audio.hit(G.combo);
            bumpCombo();
            addScore(30, e.x + 24, e.y, false);
            hitStop(0.03);
          }
        } else killEnt(e, 'shot');
        break;
      }
    }
    if (hit) G.shots.splice(i, 1);
  }
}
function tickBombs(dt) {
  var i, b;
  for (i = G.bombs.length - 1; i >= 0; i--) {
    b = G.bombs[i];
    if (b.dead) {
      G.bombs.splice(i, 1);
      continue;
    }
    b.vy += BOMB_G * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || b.x > G.cam + VW + 30) {
      G.bombs.splice(i, 1);
      continue;
    }
    if (terrainHit(b.x, b.y, G.night) || b.y > VH - 6) {
      explodeBomb(b);
      G.bombs.splice(i, 1);
    }
  }
}
function tickEnts(dt) {
  var i, e, dx, dy, m, sp, h;
  var shipX = wx();
  var shipY = G.ship.sy;
  for (i = 0; i < G.ents.length; i++) {
    e = G.ents[i];
    if (e.dead) continue;
    if (e.flash > 0) e.flash -= dt;
    if (e.kind === 'rocket') {
      if (!e.launched && shipX > e.x - 170 && shipX < e.x + 40 && Math.abs(shipY - e.y) < 220) {
        e.launched = true;
        e.vy = -70;
      }
      if (e.launched) {
        e.vy -= 140 * dt;
        e.y += e.vy * dt;
        if (terrainHit(e.x + 5, e.y, G.night) || e.y < 4) {
          boomAt(e.x + 5, e.y, HOT, 10, 3);
          e.dead = true;
        }
      }
    } else if (e.kind === 'ufo') {
      e.bob += dt * 2.6;
      e.x += e.vx * dt;
      e.y = e.baseY + Math.sin(e.bob) * e.amp;
      e.cd -= dt;
      if (e.cd <= 0 && e.x < G.cam + VW - 20 && e.x > G.cam + 40) {
        e.cd = G.night ? rand(0.9, 1.5) : rand(1.3, 2.1);
        dx = shipX - (e.x + 10);
        dy = shipY - e.y;
        m = hypot(dx, dy) || 1;
        sp = G.night ? 150 : 120;
        G.ebullets.push(makeEbullet(e.x + 10, e.y + 4, dx / m * sp, dy / m * sp));
      }
    } else if (e.kind === 'gun') {
      e.cd -= dt;
      if (e.cd <= 0 && e.x < G.cam + VW - 10 && e.x > G.cam + 30) {
        e.cd = G.night ? rand(0.85, 1.35) : rand(1.15, 1.8);
        e.flash = 0.08;
        dx = shipX - (e.x + 8);
        dy = shipY - e.y;
        m = hypot(dx, dy) || 1;
        sp = G.night ? 170 : 140;
        G.ebullets.push(makeEbullet(e.x + 8, e.y, dx / m * sp, dy / m * sp));
      }
    } else if (e.kind === 'fire') {
      e.ph += dt * 5;
      e.x += e.vx * dt;
      e.y += Math.sin(e.ph) * 26 * dt;
      dx = shipY - e.y;
      e.y += clamp(dx, -40, 40) * dt * 0.35;
    } else if (e.kind === 'fuel' || e.kind === 'bldg' || e.kind === 'core') {
      h = heights(e.x + e.w * 0.5, G.night);
      if (e.kind !== 'core') e.y = h.f - e.h;
    }
  }
}
function tickEbullets(dt) {
  var i, b;
  for (i = G.ebullets.length - 1; i >= 0; i--) {
    b = G.ebullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || b.x < G.cam - 20 || b.x > G.cam + VW + 30 || terrainHit(b.x, b.y, G.night)) {
      G.ebullets.splice(i, 1);
    }
  }
}
function collidePlay() {
  var box, i, e, b;
  if (G.invuln > 0 || G.deadT > 0) return;
  box = shipBox(G.ship, G.cam);
  for (i = 0; i < G.ents.length; i++) {
    e = G.ents[i];
    if (e.dead) continue;
    if (overlap(box, entBox(e))) {
      crash(e.kind === 'ufo' || e.kind === 'fire' || e.kind === 'rocket' ? 'hit' : 'wall');
      return;
    }
  }
  for (i = 0; i < G.ebullets.length; i++) {
    b = G.ebullets[i];
    if (circleHits(b.x, b.y, b.r + 2, box)) {
      crash('shot');
      return;
    }
  }
  for (i = 0; i < G.bombs.length; i++) {
    b = G.bombs[i];
    if (b.dead) continue;
    for (e = 0; e < G.ents.length; e++) {
      if (G.ents[e].dead) continue;
      if (circleHits(b.x, b.y, b.r + 3, entBox(G.ents[e]))) {
        explodeBomb(b);
        break;
      }
    }
  }
}
function tickFx(dt) {
  var i, o;
  for (i = particles.length - 1; i >= 0; i--) {
    o = particles[i];
    o.life -= dt;
    o.x += o.vx * dt;
    o.vy += o.g * dt;
    o.y += o.vy * dt;
    if (o.life <= 0) particles.splice(i, 1);
  }
  for (i = sparks.length - 1; i >= 0; i--) {
    o = sparks[i];
    o.t += dt;
    if (o.t > 0.28) sparks.splice(i, 1);
  }
  for (i = rings.length - 1; i >= 0; i--) {
    o = rings[i];
    o.t += dt;
    o.r += 70 * dt;
    if (o.t > 0.34) rings.splice(i, 1);
  }
  for (i = floats.length - 1; i >= 0; i--) {
    o = floats[i];
    o.t += dt;
    o.y -= 34 * dt;
    if (o.t > o.life) floats.splice(i, 1);
  }
  if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 16);
  if (G.punch !== 1) G.punch = lerp(G.punch, 1, clamp(dt * 14, 0, 1));
}
function noteSection() {
  var s = sectionOf(wx());
  if (s !== G.section) {
    G.section = s;
    if (secLabel) {
      secLabel.textContent = sectionName(s);
      secLabel.classList.toggle('hot', s === 2);
    }
    audio.section();
    toast(sectionName(s), s === 2 ? 'gold' : 'fuel', 900);
  }
}

function update(dt) {
  var sec;
  G.t += dt;
  tickFx(dt);
  if (G.mode === 'title') {
    G.cam += 42 * dt;
    if (G.cam > CITY_END - 400) {
      G.cam = 40;
      G.spawnX = 0;
      G.ents = [];
    }
    ensureWorld();
    G.ship.sy = 188 + Math.sin(G.t * 2.1) * 6;
    for (sec = 0; sec < G.ents.length; sec++) {
      var te = G.ents[sec];
      if (te.kind === 'ufo') {
        te.bob += dt * 2.6;
        te.x += te.vx * dt * 0.35;
        te.y = te.baseY + Math.sin(te.bob) * te.amp;
      }
    }
    emit(1, {
      x: wx() - 12, y: G.ship.sy, j: 1,
      vx0: -70, vx1: -20, vy0: -10, vy1: 10,
      r0: 1, r1: 2, life: 0.2, rgb: HOT, g: 0
    });
    return;
  }
  if (G.stop > 0) {
    G.stop -= dt;
    return;
  }
  if (G.mode === 'lose' || G.mode === 'win') return;
  if (G.mode !== 'play') return;
  if (G.winT > 0) {
    G.winT -= dt;
    if (G.winT <= 0) goWin();
    return;
  }
  if (G.deadT > 0) {
    G.deadT -= dt;
    if (G.deadT <= 0) {
      if (G.lives <= 0) goLose();
      else respawn();
    }
    return;
  }
  G.clock += dt;
  sec = sectionOf(G.cam + G.ship.sx);
  G.cam += scrollSpeed(G.night, sec) * dt;
  ensureWorld();
  tickShip(dt);
  if (G.deadT > 0) return;
  tickFuel(dt);
  if (G.deadT > 0) return;
  tickShots(dt);
  tickBombs(dt);
  tickEnts(dt);
  tickEbullets(dt);
  collidePlay();
  ageCombo(dt);
  noteSection();
}

function seedStars() {
  var i;
  stars.length = 0;
  for (i = 0; i < 70; i++) {
    stars.push({
      x: hash2(i * 3.1) * VW,
      y: hash2(i * 7.7 + 2) * 210,
      r: 0.7 + hash2(i * 1.4) * 1.6,
      a: 0.25 + hash2(i * 2.2) * 0.6,
      par: 0.15 + hash2(i * 4.8) * 0.55,
      ph: hash2(i * 5.5) * TAU
    });
  }
}

function drawBg() {
  var i, s, tw, gx, gy, sec, k;
  sec = sectionOf(G.cam + VW * 0.45);
  if (G.night) {
    ctx.fillStyle = '#06040c';
  } else if (sec === 0) {
    ctx.fillStyle = '#0a0610';
  } else if (sec === 1) {
    ctx.fillStyle = '#0c070c';
  } else {
    ctx.fillStyle = '#090610';
  }
  ctx.fillRect(L.x, L.y, VW * L.s, VH * L.s);
  for (i = 0; i < stars.length; i++) {
    s = stars[i];
    tw = 0.5 + 0.5 * Math.sin(G.t * 2.4 + s.ph);
    gx = ((s.x - G.cam * s.par) % VW + VW) % VW;
    gy = s.y;
    ctx.fillStyle = rgba(sec === 0 ? WHT : AMB, s.a * tw * (G.night ? 0.45 : 0.9));
    ctx.fillRect(sx(G.cam + gx), sy(gy), s.r * L.s, s.r * L.s);
  }
  if (sec === 0) {
    ctx.beginPath();
    for (i = -8; i <= VW + 8; i += 14) {
      k = 96 + hash2(Math.floor((G.cam * 0.22 + i) * 0.03)) * 48;
      if (i === -8) ctx.moveTo(sx(G.cam + i), sy(220 - k * 0.15));
      else ctx.lineTo(sx(G.cam + i), sy(248 - k * 0.22));
    }
    ctx.lineTo(sx(G.cam + VW + 8), sy(VH));
    ctx.lineTo(sx(G.cam - 8), sy(VH));
    ctx.closePath();
    ctx.fillStyle = G.night ? 'rgba(18,8,14,0.55)' : 'rgba(28,10,16,0.45)';
    ctx.fill();
  }
}

function drawTerrain() {
  var x, h, px, first, sec, edge, fillF, fillC, step;
  sec = sectionOf(G.cam + VW * 0.5);
  step = 5;
  fillF = G.night ? '#14080e' : sec === 2 ? '#160c18' : '#180a10';
  fillC = G.night ? '#10060c' : '#14080e';
  edge = G.night ? MAG : HOT;
  ctx.beginPath();
  first = true;
  for (x = -8; x <= VW + 8; x += step) {
    h = heights(G.cam + x, G.night);
    px = sx(G.cam + x);
    if (first) {
      ctx.moveTo(px, sy(VH + 8));
      ctx.lineTo(px, sy(h.f));
      first = false;
    } else ctx.lineTo(px, sy(h.f));
  }
  ctx.lineTo(sx(G.cam + VW + 8), sy(VH + 8));
  ctx.closePath();
  ctx.fillStyle = fillF;
  ctx.fill();
  ctx.beginPath();
  first = true;
  for (x = -8; x <= VW + 8; x += step) {
    h = heights(G.cam + x, G.night);
    px = sx(G.cam + x);
    if (first) {
      ctx.moveTo(px, sy(h.f));
      first = false;
    } else ctx.lineTo(px, sy(h.f));
  }
  ctx.strokeStyle = rgba(edge, 0.9);
  ctx.lineWidth = 2 * L.s;
  ctx.shadowColor = rgba(edge, 0.45);
  ctx.shadowBlur = 8 * L.s;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  first = true;
  for (x = -8; x <= VW + 8; x += step) {
    h = heights(G.cam + x, G.night);
    px = sx(G.cam + x);
    if (first) {
      ctx.moveTo(px, sy(-8));
      ctx.lineTo(px, sy(h.c));
      first = false;
    } else ctx.lineTo(px, sy(h.c));
  }
  ctx.lineTo(sx(G.cam + VW + 8), sy(-8));
  ctx.closePath();
  ctx.fillStyle = fillC;
  ctx.fill();
  ctx.beginPath();
  first = true;
  for (x = -8; x <= VW + 8; x += step) {
    h = heights(G.cam + x, G.night);
    px = sx(G.cam + x);
    if (first) {
      ctx.moveTo(px, sy(h.c));
      first = false;
    } else ctx.lineTo(px, sy(h.c));
  }
  ctx.strokeStyle = rgba(sec === 2 ? CYN : edge, 0.85);
  ctx.lineWidth = 2 * L.s;
  ctx.shadowColor = rgba(sec === 2 ? CYN : edge, 0.4);
  ctx.shadowBlur = 8 * L.s;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

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

function drawEnts() {
  var i, e, x, y, w, h, glow;
  for (i = 0; i < G.ents.length; i++) {
    e = G.ents[i];
    if (e.dead) continue;
    x = sx(e.x);
    y = sy(e.y);
    w = e.w * L.s;
    h = e.h * L.s;
    if (x + w < L.x - 10 || x > L.x + VW * L.s + 10) continue;
    if (e.kind === 'bldg') {
      ctx.fillStyle = '#1c1018';
      ctx.strokeStyle = rgba(AMB, 0.7);
      ctx.lineWidth = 1.2 * L.s;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = rgba(GOLD, 0.35 + 0.25 * Math.sin(G.t * 3 + e.x));
      ctx.fillRect(x + w * 0.18, y + h * 0.2, w * 0.2, h * 0.18);
      ctx.fillRect(x + w * 0.58, y + h * 0.45, w * 0.22, h * 0.18);
    } else if (e.kind === 'fuel') {
      glow = 0.55 + 0.45 * Math.sin(G.t * 6 + e.x);
      ctx.fillStyle = rgba(GOLD, 0.18);
      ctx.beginPath();
      ctx.arc(x + w * 0.5, y + h * 0.5, 12 * L.s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#3a2208';
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 1.4 * L.s;
      roundRect(x, y, w, h, 3 * L.s);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, glow);
      ctx.fillRect(x + 4 * L.s, y + 3 * L.s, w - 8 * L.s, 3 * L.s);
      ctx.fillStyle = rgba(CYN, 0.85);
      ctx.font = '700 ' + (8 * L.s) + 'px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('油', x + w * 0.5, y + h * 0.78);
    } else if (e.kind === 'gun') {
      ctx.fillStyle = e.flash > 0 ? rgba(HOT, 0.95) : '#2a1210';
      ctx.strokeStyle = rgba(HOT, 0.85);
      ctx.lineWidth = 1.3 * L.s;
      ctx.fillRect(x, y + h * 0.35, w, h * 0.65);
      ctx.strokeRect(x, y + h * 0.35, w, h * 0.65);
      ctx.fillStyle = rgba(AMB, 0.9);
      ctx.fillRect(x + w * 0.35, y, w * 0.3, h * 0.5);
    } else if (e.kind === 'rocket') {
      ctx.save();
      ctx.translate(x + w * 0.5, y + h * 0.5);
      ctx.fillStyle = e.launched ? rgba(MAG, 0.95) : rgba(HOT, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.55);
      ctx.lineTo(w * 0.45, h * 0.4);
      ctx.lineTo(-w * 0.45, h * 0.4);
      ctx.closePath();
      ctx.fill();
      if (e.launched) {
        ctx.fillStyle = rgba(GOLD, 0.9);
        ctx.beginPath();
        ctx.moveTo(-3 * L.s, h * 0.4);
        ctx.lineTo(0, h * 0.4 + 8 * L.s);
        ctx.lineTo(3 * L.s, h * 0.4);
        ctx.fill();
      }
      ctx.restore();
    } else if (e.kind === 'ufo') {
      ctx.save();
      ctx.translate(x + w * 0.5, y + h * 0.5);
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, 2 * L.s, w * 0.55, h * 0.28, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.ellipse(0, -1 * L.s, w * 0.28, h * 0.35, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.7 + 0.3 * Math.sin(G.t * 8 + e.x));
      ctx.fillRect(-2 * L.s, 3 * L.s, 4 * L.s, 2 * L.s);
      ctx.restore();
    } else if (e.kind === 'fire') {
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.beginPath();
      ctx.arc(x + w * 0.5, y + h * 0.5, (5 + Math.sin(e.ph) * 1.4) * L.s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.beginPath();
      ctx.arc(x + w * 0.5, y + h * 0.5, 2.4 * L.s, 0, TAU);
      ctx.fill();
    } else if (e.kind === 'core') {
      glow = 0.4 + 0.6 * (1 - e.hp / 8);
      ctx.fillStyle = '#1a0a14';
      ctx.strokeStyle = rgba(e.flash > 0 ? WHT : MAG, 0.9);
      ctx.lineWidth = 2 * L.s;
      roundRect(x, y, w, h, 6 * L.s);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = rgba(MAG, 0.25 + glow * 0.5);
      ctx.beginPath();
      ctx.arc(x + w * 0.5, y + h * 0.5, (10 + glow * 8) * L.s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(x + w * 0.5, y + h * 0.5, 6 * L.s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.font = '700 ' + (9 * L.s) + 'px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('核', x + w * 0.5, y + 14 * L.s);
    }
  }
}

function drawProjectiles() {
  var i, s, b;
  for (i = 0; i < G.shots.length; i++) {
    s = G.shots[i];
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.shadowColor = rgba(CYN, 0.7);
    ctx.shadowBlur = 8 * L.s;
    ctx.fillRect(sx(s.x) - 6 * L.s, sy(s.y) - 1.4 * L.s, 12 * L.s, 2.8 * L.s);
    ctx.shadowBlur = 0;
  }
  for (i = 0; i < G.bombs.length; i++) {
    b = G.bombs[i];
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(sx(b.x), sy(b.y), 3.4 * L.s, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(HOT, 0.8);
    ctx.lineWidth = 1.2 * L.s;
    ctx.stroke();
    ctx.fillStyle = rgba(HOT, 0.7);
    ctx.fillRect(sx(b.x) - 1 * L.s, sy(b.y) - 6 * L.s, 2 * L.s, 4 * L.s);
  }
  for (i = 0; i < G.ebullets.length; i++) {
    b = G.ebullets[i];
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.arc(sx(b.x), sy(b.y), 2.6 * L.s, 0, TAU);
    ctx.fill();
  }
}

function drawShip() {
  var x, y, blink;
  if (G.mode === 'play' && G.deadT > 0) return;
  blink = G.invuln > 0 && ((G.invuln * 12) | 0) % 2 === 0;
  if (blink) return;
  x = sx(wx());
  y = sy(G.ship.sy);
  ctx.save();
  ctx.translate(x, y);
  if (G.muzzle > 0) {
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.fillRect(12 * L.s, -1.5 * L.s, 10 * L.s, 3 * L.s);
    ctx.fillStyle = rgba(CYN, 0.8);
    ctx.fillRect(12 * L.s, -3 * L.s, 6 * L.s, 6 * L.s);
  }
  ctx.fillStyle = rgba(CYN, 0.95);
  ctx.beginPath();
  ctx.moveTo(12 * L.s, 0);
  ctx.lineTo(-10 * L.s, -7 * L.s);
  ctx.lineTo(-6 * L.s, 0);
  ctx.lineTo(-10 * L.s, 7 * L.s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = rgba(GOLD, 0.95);
  ctx.beginPath();
  ctx.moveTo(4 * L.s, 0);
  ctx.lineTo(-2 * L.s, -3.2 * L.s);
  ctx.lineTo(-2 * L.s, 3.2 * L.s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = rgba(HOT, 0.85);
  ctx.fillRect(-11 * L.s, -2 * L.s, 5 * L.s, 4 * L.s);
  ctx.restore();
}

function drawParticles() {
  var i, o, a;
  for (i = 0; i < particles.length; i++) {
    o = particles[i];
    a = clamp(o.life / o.max, 0, 1);
    ctx.fillStyle = rgba(o.rgb, a);
    ctx.fillRect(sx(o.x) - o.r * L.s * 0.5, sy(o.y) - o.r * L.s * 0.5, o.r * L.s, o.r * L.s);
  }
  for (i = 0; i < sparks.length; i++) {
    o = sparks[i];
    a = 1 - o.t / 0.28;
    ctx.strokeStyle = rgba(o.rgb, 0.7 * a);
    ctx.lineWidth = (2.2 - o.t * 4) * L.s;
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), (o.rad * 0.3 + o.t * o.rad * 2) * L.s, 0, TAU);
    ctx.stroke();
  }
  for (i = 0; i < rings.length; i++) {
    o = rings[i];
    a = 1 - o.t / 0.34;
    ctx.strokeStyle = rgba(o.rgb, 0.5 * a);
    ctx.lineWidth = (2 - o.t * 3) * L.s;
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), o.r * L.s, 0, TAU);
    ctx.stroke();
  }
}

function drawFloats() {
  var i, f, a;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (i = 0; i < floats.length; i++) {
    f = floats[i];
    a = clamp(1 - f.t / f.life, 0, 1);
    ctx.globalAlpha = a;
    ctx.fillStyle = rgba(f.gold ? GOLD : f.rgb, 1);
    ctx.font = '700 ' + (f.size * L.s) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.fillText(f.text, sx(f.x), sy(f.y));
  }
  ctx.restore();
}

function drawNight() {
  var g, x, y;
  if (!G.night && G.mode !== 'title') return;
  if (!G.night) return;
  x = sx(wx());
  y = sy(G.ship.sy);
  g = ctx.createRadialGradient(x, y, 18 * L.s, x, y, 290 * L.s);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.4, 'rgba(4,2,10,0.12)');
  g.addColorStop(0.72, 'rgba(3,1,8,0.55)');
  g.addColorStop(1, 'rgba(2,1,6,0.82)');
  ctx.fillStyle = g;
  ctx.fillRect(L.x, L.y, VW * L.s, VH * L.s);
}

function drawFlash() {
  if (G.flash <= 0) return;
  ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.2);
  ctx.fillRect(L.x, L.y, VW * L.s, VH * L.s);
}

function drawLowFuel() {
  var a;
  if (G.mode !== 'play' || G.fuel >= 26) return;
  a = (0.08 + 0.08 * (0.5 + 0.5 * Math.sin(G.t * 8))) * (1 - G.fuel / 26);
  ctx.fillStyle = rgba(MAG, a);
  ctx.fillRect(L.x, L.y, VW * L.s, VH * L.s);
}

function draw() {
  var shx, shy, cx, cy;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#05030c';
  ctx.fillRect(0, 0, cssW, cssH);
  shx = reduceOn() ? 0 : (Math.random() - 0.5) * G.shake * L.s;
  shy = reduceOn() ? 0 : (Math.random() - 0.5) * G.shake * L.s;
  ctx.setTransform(dpr, 0, 0, dpr, shx, shy);
  ctx.save();
  ctx.beginPath();
  ctx.rect(L.x, L.y, VW * L.s, VH * L.s);
  ctx.clip();
  if (G.punch !== 1 && !reduceOn()) {
    cx = L.x + VW * L.s * 0.5;
    cy = L.y + VH * L.s * 0.5;
    ctx.translate(cx, cy);
    ctx.scale(G.punch, G.punch);
    ctx.translate(-cx, -cy);
  }
  drawBg();
  drawTerrain();
  drawEnts();
  drawProjectiles();
  drawShip();
  drawParticles();
  drawFloats();
  drawNight();
  drawLowFuel();
  drawFlash();
  ctx.restore();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function resize() {
  var rect;
  if (!stageEl || !canvas) return;
  rect = stageEl.getBoundingClientRect();
  dpr = Math.min(2, window.devicePixelRatio || 1);
  cssW = Math.max(1, rect.width);
  cssH = Math.max(1, rect.height);
  canvas.width = Math.max(1, (cssW * dpr) | 0);
  canvas.height = Math.max(1, (cssH * dpr) | 0);
  L.s = Math.min(cssW / VW, cssH / VH);
  L.x = (cssW - VW * L.s) * 0.5;
  L.y = (cssH - VH * L.s) * 0.5;
}

function pointerWorld(e) {
  var rect = canvas.getBoundingClientRect();
  var x = (e.clientX - rect.left) / Math.max(1, rect.width) * cssW;
  var y = (e.clientY - rect.top) / Math.max(1, rect.height) * cssH;
  return { x: (x - L.x) / L.s, y: (y - L.y) / L.s };
}

function onKey(e, down) {
  var k = e.key;
  var code = e.code;
  var space = k === ' ' || k === 'Spacebar' || code === 'Space';
  var bombKey = k === 'z' || k === 'Z' || k === 'x' || k === 'X' || k === 'b' || k === 'B';
  if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
    keys.l = down;
    if (down) inputSrc = 'key';
  }
  if (k === 'ArrowRight' || k === 'd' || k === 'D') {
    keys.r = down;
    if (down) inputSrc = 'key';
  }
  if (k === 'ArrowUp' || k === 'w' || k === 'W') {
    keys.u = down;
    if (down) inputSrc = 'key';
  }
  if (k === 'ArrowDown' || k === 's' || k === 'S') {
    keys.d = down;
    if (down) inputSrc = 'key';
  }
  if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space)) {
    e.preventDefault();
  }
  if (space) keys.space = down;
  if (!down) {
    if (space) {
      keys.shot = false;
      G.holdShot = false;
    }
    if (bombKey) keys.bomb = false;
    G.holdBomb = keys.bomb || (keys.d && keys.space);
    return;
  }
  if (k === 'm' || k === 'M') {
    audio.ensure();
    audio.setMuted(!audio.muted);
    return;
  }
  if (k === 'r' || k === 'R') {
    restart();
    return;
  }
  if (k === '1' && overlayOpen() && G.mode === 'title') {
    startGame(false);
    return;
  }
  if (k === '2' && overlayOpen() && G.mode === 'title') {
    startGame(true);
    return;
  }
  if (bombKey) {
    audio.ensure();
    keys.bomb = true;
    G.holdBomb = true;
    dropBomb();
    return;
  }
  if (space || k === 'Enter') {
    audio.ensure();
    if (overlayOpen()) {
      if (G.mode === 'title') startGame(false);
      else if (G.mode === 'lose' || G.mode === 'win') startGame(G.night);
      return;
    }
    if (keys.d) {
      G.holdBomb = true;
      dropBomb();
    } else {
      keys.shot = true;
      G.holdShot = true;
      fireShot();
    }
  }
}

function bindPad(el, downFn, upFn) {
  if (!el) return;
  function press(e) {
    e.preventDefault();
    audio.ensure();
    el.classList.add('held');
    downFn();
  }
  function release(e) {
    if (e) e.preventDefault();
    el.classList.remove('held');
    upFn();
  }
  el.addEventListener('pointerdown', press);
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  el.addEventListener('pointerleave', function () {
    if (el.classList.contains('held')) release();
  });
}

function bindPointer() {
  if (!canvas) return;
  canvas.addEventListener('pointerdown', function (e) {
    var p;
    audio.ensure();
    e.preventDefault();
    p = pointerWorld(e);
    pointer.down = true;
    pointer.hover = true;
    pointer.id = e.pointerId;
    pointer.x = p.x;
    pointer.y = p.y;
    inputSrc = 'ptr';
    G.holdShot = true;
    if (G.mode === 'play') fireShot();
    if (canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
  });
  canvas.addEventListener('pointermove', function (e) {
    var p = pointerWorld(e);
    pointer.x = p.x;
    pointer.y = p.y;
    if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
    if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
  });
  function up(e) {
    if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
    pointer.down = false;
    pointer.id = null;
    G.holdShot = false;
  }
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', function () {
    pointer.hover = false;
    if (!pointer.down) G.holdShot = false;
  });
  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    audio.ensure();
    dropBomb();
  });
}

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

function initMute() {
  var m = false;
  try { m = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { m = false; }
  audio.setMuted(m);
}

seedStars();
loadBest();
initMute();
goTitle();
resize();
bindPointer();
syncHud();

if (btnCave) {
  btnCave.addEventListener('click', function () {
    audio.ensure();
    startGame(false);
  });
}
if (btnNight) {
  btnNight.addEventListener('click', function () {
    audio.ensure();
    startGame(true);
  });
}
if (ovRetry) {
  ovRetry.addEventListener('click', function () {
    audio.ensure();
    startGame(G.night);
  });
}
if (ovModes) {
  ovModes.addEventListener('click', function () {
    audio.ensure();
    goTitle();
  });
}
if (btnRetry) btnRetry.addEventListener('click', restart);
if (btnMute) {
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
}
bindPad(btnShot, function () {
  G.holdShot = true;
  fireShot();
}, function () { G.holdShot = false; });
bindPad(btnBomb, function () {
  G.holdBomb = true;
  dropBomb();
}, function () { G.holdBomb = false; });

window.addEventListener('keydown', function (e) { onKey(e, true); });
window.addEventListener('keyup', function (e) { onKey(e, false); });
window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', function () {
  hidden = document.hidden;
  if (hidden) {
    keys.l = keys.r = keys.u = keys.d = false;
    keys.shot = keys.bomb = keys.space = false;
    G.holdShot = false;
    G.holdBomb = false;
  }
});

requestAnimationFrame(frame);

}
