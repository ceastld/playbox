'use strict';

/* 先锋 — Vanguard remake. No CDN. */

var VW = 720;
var VH = 400;
var LIVES = 3;
var SHIP_SPD = 218;
var SHIP_SPD_B = 262;
var SHOT_V = 540;
var SHOT_MAX = 3;
var SHOT_MAX_B = 4;
var FUEL_MAX = 100;
var FUEL_GAIN = 34;
var FUEL_EVERY = 500;
var WALL_EVERY = 440;
var COMBO_WIN = 1.35;
var INVULN = 1.35;
var DIE_T = 0.72;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var ZONE_LEN = 2100;
var ZONE_N = 5;
var CORE_X = ZONE_LEN * ZONE_N + 280;
var MIN_GAP = 108;
var MIN_GAP_B = 96;
var WALL_PERIOD = 2.55;
var WALL_ON = 1.7;
var WALL_PERIOD_B = 1.95;
var WALL_ON_B = 1.4;
var BEST_KEY = 'playbox-vanguard-best';
var MUTE_KEY = 'playbox-vanguard-mute';
var OPS = '方向键 / WASD 移动 · 空格朝面向开火 · IJKL 四向 · 拖动画布跟船 · R 重开 · M 静音';

var MAG = [255, 61, 184];
var CYN = [0, 240, 255];
var GOLD = [255, 227, 107];
var HOT = [255, 122, 26];
var AMB = [255, 179, 71];
var WHT = [255, 246, 236];
var BLU = [110, 130, 255];
var PNK = [255, 80, 140];

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
  if (x < ZONE_LEN) return 0;
  if (x < ZONE_LEN * 2) return 1;
  if (x < ZONE_LEN * 3) return 2;
  if (x < ZONE_LEN * 4) return 3;
  if (x < ZONE_LEN * 5) return 4;
  return 5;
}
function zoneName(s) {
  if (s === 0) return '赭谷';
  if (s === 1) return '虹廊';
  if (s === 2) return '冥川';
  if (s === 3) return '斑纹';
  if (s === 4) return '霓都';
  return '要塞';
}
function scrollSpeed(blitz, section) {
  var base = blitz ? 186 : 128;
  if (section >= 5) return blitz ? 132 : 92;
  base += section * (blitz ? 8 : 6);
  return base;
}
function fuelDrain(blitz) {
  return blitz ? 7.1 : 5.3;
}
function minGap(blitz) {
  return blitz ? MIN_GAP_B : MIN_GAP;
}
function wallPeriod(blitz) {
  return blitz ? WALL_PERIOD_B : WALL_PERIOD;
}
function wallOnDur(blitz) {
  return blitz ? WALL_ON_B : WALL_ON;
}
function tooth(x, scale) {
  var cell = Math.floor(x / 22);
  var h = hash2(cell * 1.37 + 4.4);
  if (h < 0.68) return 0;
  var local = x / 22 - cell;
  return Math.sin(local * Math.PI) * (h - 0.68) * scale;
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
function cardinalOf(dx, dy) {
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return { x: 1, y: 0 };
  if (Math.abs(dx) >= Math.abs(dy)) return { x: dx > 0 ? 1 : -1, y: 0 };
  return { x: 0, y: dy > 0 ? 1 : -1 };
}
function hueRgb(h) {
  var a = ((h % 360) + 360) % 360 / 60;
  var i = Math.floor(a);
  var f = a - i;
  var v = 1;
  var p = 0.18;
  var q = 1 - f * 0.82;
  var t = 0.18 + f * 0.82;
  var r;
  var g;
  var b;
  if (i === 0) { r = v; g = t; b = p; }
  else if (i === 1) { r = q; g = v; b = p; }
  else if (i === 2) { r = p; g = v; b = t; }
  else if (i === 3) { r = p; g = q; b = v; }
  else if (i === 4) { r = t; g = p; b = v; }
  else { r = v; g = p; b = q; }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
function zoneShape(x, s) {
  var n = fbm(x * 0.0046);
  var n2 = fbm(x * 0.0022 + 17);
  var t;
  var gap;
  var mid;
  if (s <= 0) {
    gap = 228 + (n - 0.5) * 18;
    mid = 198 + (n2 - 0.5) * 36;
  } else if (s === 1) {
    t = clamp((x - ZONE_LEN) / ZONE_LEN, 0, 1);
    gap = lerp(200, 168, t) + (n - 0.5) * 16;
    mid = 200 + Math.sin(x * 0.01) * 28 + (n2 - 0.5) * 20;
  } else if (s === 2) {
    t = clamp((x - ZONE_LEN * 2) / ZONE_LEN, 0, 1);
    gap = lerp(164, 136, t) + (n - 0.5) * 12;
    mid = 200 + (n2 - 0.5) * 50;
  } else if (s === 3) {
    gap = 150 + (n - 0.5) * 10;
    mid = Math.round((200 + (n2 - 0.5) * 40) / 16) * 16;
  } else if (s === 4) {
    t = clamp((x - ZONE_LEN * 4) / ZONE_LEN, 0, 1);
    gap = lerp(148, 128, t) + (n - 0.5) * 10;
    mid = 200 + (n2 - 0.5) * 30;
  } else {
    t = clamp((x - ZONE_LEN * 5) / 400, 0, 1);
    gap = lerp(140, 170, t);
    mid = 200;
    if (x > CORE_X + 80) {
      t = clamp((x - CORE_X - 80) / 80, 0, 1);
      gap = lerp(gap, 16, t);
    }
  }
  return { gap: gap, mid: mid };
}
function heights(x, blitz) {
  var s = sectionOf(x);
  var local = x - s * ZONE_LEN;
  var a = zoneShape(x, s);
  var b;
  var u;
  var gap;
  var mid;
  var c;
  var f;
  var mg = minGap(blitz);
  var scale;
  if (s < 5 && local > ZONE_LEN - 170) {
    u = (local - (ZONE_LEN - 170)) / 170;
    u = u * u;
    b = zoneShape(x, s + 1);
    gap = lerp(a.gap, b.gap, u);
    mid = lerp(a.mid, b.mid, u);
  } else {
    gap = a.gap;
    mid = a.mid;
  }
  if (blitz && x < CORE_X + 40) gap *= 0.9;
  scale = s === 0 ? 24 : s === 2 ? 20 : s === 4 ? 18 : 14;
  c = mid - gap * 0.5 + tooth(x, scale);
  f = mid + gap * 0.5 - tooth(x + 700, scale * 0.85);
  if (x < CORE_X + 40) {
    if (f - c < mg) {
      mid = (f + c) * 0.5;
      c = mid - mg * 0.5;
      f = mid + mg * 0.5;
    }
    c = clamp(c, 8, 176);
    f = clamp(f, 196, 392);
    if (f - c < mg) f = c + mg;
  } else {
    c = clamp(c, 8, 196);
    f = clamp(f, 204, 392);
    if (f < c + 8) {
      mid = (c + f) * 0.5;
      c = mid - 4;
      f = mid + 4;
    }
  }
  return { c: c, f: f };
}
function fuelXForSlot(slot) {
  return slot * FUEL_EVERY + 70 + hash2(slot * 9.1) * 120;
}
function wallXForSlot(slot) {
  return slot * WALL_EVERY + 90 + hash2(slot * 3.3) * 80;
}
function wallOnAt(ph, t, blitz) {
  var period = wallPeriod(blitz);
  var onDur = wallOnDur(blitz);
  var p = (t + ph) % period;
  if (p < 0) p += period;
  return p < onDur;
}
function whyText(w) {
  if (w === 'wall') return '撞壁了';
  if (w === 'bar') return '撞能量墙';
  if (w === 'shot') return '中弹了';
  if (w === 'fuel') return '燃油耗尽';
  if (w === 'hit') return '撞机了';
  return '坠隧了';
}
function faceGlyph(face) {
  if (face.y < 0) return '向↑';
  if (face.y > 0) return '向↓';
  if (face.x < 0) return '向←';
  return '向→';
}
function makeShip() {
  return { sx: 96, sy: 200, vx: 0, vy: 0 };
}
function makeShot(x, y, dx, dy) {
  return {
    x: x,
    y: y,
    vx: dx * SHOT_V,
    vy: dy * SHOT_V,
    dx: dx,
    dy: dy,
    r: 3.2,
    life: 1.2,
    dead: false
  };
}
function makeFuel(x, y) {
  return { kind: 'fuel', x: x, y: y, w: 16, h: 16, score: 150, fuel: FUEL_GAIN, dead: false };
}
function makeWall(x, ceilY, floorY, blitz) {
  var hp = blitz ? 4 : 3;
  return {
    kind: 'wall',
    x: x,
    y: ceilY + 2,
    w: 12,
    h: floorY - ceilY - 4,
    hp: hp,
    maxHp: hp,
    ph: hash2(x * 0.07) * 8.8,
    score: 200,
    dead: false,
    hitT: 0
  };
}
function makeScout(x, y) {
  return {
    kind: 'scout',
    x: x,
    y: y,
    w: 16,
    h: 12,
    bob: hash2(x * 0.2) * TAU,
    amp: 12 + hash2(x * 0.11) * 16,
    baseY: y,
    vx: -24 - hash2(x) * 22,
    score: 50,
    dead: false
  };
}
function makeDart(x, y) {
  return {
    kind: 'dart',
    x: x,
    y: y,
    w: 18,
    h: 8,
    vx: -86 - hash2(x) * 28,
    score: 80,
    dead: false
  };
}
function makeGunner(x, y, ceil) {
  return {
    kind: 'gunner',
    x: x,
    y: y,
    w: 14,
    h: 14,
    ceil: !!ceil,
    cd: rand(0.5, 1.4),
    score: 100,
    dead: false,
    flash: 0
  };
}
function makeKnight(x, y) {
  return {
    kind: 'knight',
    x: x,
    y: y,
    w: 22,
    h: 16,
    vx: -16 - hash2(x) * 14,
    bob: hash2(x) * TAU,
    baseY: y,
    amp: 10 + hash2(x * 0.4) * 12,
    cd: rand(0.7, 1.6),
    hp: 2,
    score: 120,
    dead: false,
    flash: 0
  };
}
function makeCore(x, floorY, ceilY) {
  var gap = floorY - ceilY;
  var h = clamp(gap * 0.55, 58, 86);
  var y = (ceilY + floorY) * 0.5 - h * 0.5;
  return { kind: 'core', x: x, y: y, w: 64, h: h, hp: 12, score: 2500, dead: false, flash: 0 };
}
function makeEbullet(x, y, vx, vy) {
  return { x: x, y: y, vx: vx, vy: vy, r: 3, life: 2.4, dead: false };
}
function shipBox(ship, cam) {
  return { x: cam + ship.sx - 9, y: ship.sy - 6, w: 20, h: 12 };
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
function terrainHit(x, y, blitz) {
  var h = heights(x, blitz);
  return y < h.c + 1 || y > h.f - 1;
}
function edgeRgb(x, s, t) {
  if (s === 1) return hueRgb(x * 0.42 + t * 70);
  if (s === 2) return BLU;
  if (s === 3) return GOLD;
  if (s === 4) return MAG;
  if (s === 5) return PNK;
  return HOT;
}

function selfCheck() {
  var v, h0, h1, h2, h4, n1, s, slot, fx, wx, i, gap0, gap1, gap2, ng, c;
  var sh;
  if (BEST_KEY !== 'playbox-vanguard-best') throw new Error('best key');
  if (MUTE_KEY !== 'playbox-vanguard-mute') throw new Error('mute key');
  if (LIVES !== 3) throw new Error('3 lives');
  if (ZONE_LEN * 2 <= ZONE_LEN) throw new Error('zone order');
  if (CORE_X <= ZONE_LEN * 5) throw new Error('core in fort');
  if (scrollSpeed(true, 0) <= scrollSpeed(false, 0)) throw new Error('blitz faster');
  if (scrollSpeed(false, 4) <= scrollSpeed(false, 0)) throw new Error('late faster');
  if (fuelDrain(true) <= fuelDrain(false)) throw new Error('blitz hungrier');
  if (wallOnDur(true) >= wallPeriod(true)) throw new Error('wait window');
  if (wallOnDur(false) >= wallPeriod(false)) throw new Error('wait window z');
  if (!wallOnAt(0, 0.2, false)) throw new Error('wall on');
  if (wallOnAt(0, WALL_ON + 0.05, false)) throw new Error('wall off wait');
  if (comboMul(1) !== 1) throw new Error('combo 1');
  if (comboMul(4) !== 2) throw new Error('combo 4');
  if (comboMul(7) !== 3) throw new Error('combo 7');
  if (comboMul(13) !== 5) throw new Error('combo cap');
  v = moveVec(true, false, true, false);
  if (Math.abs(Math.abs(v.x) - 0.7071) > 0.02) throw new Error('8dir');
  sh = cardinalOf(0.9, 0.2);
  if (sh.x !== 1 || sh.y !== 0) throw new Error('cardinal right');
  sh = cardinalOf(-0.1, -0.9);
  if (sh.x !== 0 || sh.y !== -1) throw new Error('cardinal up');
  s = makeShot(0, 0, 1, 0);
  if (s.vx < 400 || s.vy !== 0) throw new Error('shot right');
  s = makeShot(0, 0, 0, -1);
  if (s.vy >= 0 || s.vx !== 0) throw new Error('shot up');
  s = makeShot(0, 0, -1, 0);
  if (s.vx >= 0) throw new Error('shot left');
  s = makeShot(0, 0, 0, 1);
  if (s.vy <= 0) throw new Error('shot down');
  if (s.life * SHOT_V < VW * 0.7) throw new Error('shot reach');
  h0 = heights(400, false);
  h1 = heights(ZONE_LEN + 400, false);
  h2 = heights(ZONE_LEN * 2 + 800, false);
  h4 = heights(ZONE_LEN * 4 + 800, false);
  n1 = heights(ZONE_LEN + 400, true);
  gap0 = h0.f - h0.c;
  gap1 = h1.f - h1.c;
  gap2 = h2.f - h2.c;
  ng = n1.f - n1.c;
  if (gap0 < 180) throw new Error('ochre open');
  if (gap2 >= gap0 - 20) throw new Error('styx tighter');
  if (h4.f - h4.c >= gap0 - 10) throw new Error('neon tighter');
  if (ng >= gap1) throw new Error('blitz tighter');
  if (gap0 < MIN_GAP || gap2 < MIN_GAP) throw new Error('min gap');
  if (sectionOf(100) !== 0 || sectionOf(ZONE_LEN + 10) !== 1 || sectionOf(CORE_X) !== 5) throw new Error('sections');
  if (zoneName(0) !== '赭谷' || zoneName(5) !== '要塞') throw new Error('names');
  if (faceGlyph({ x: 1, y: 0 }) !== '向→') throw new Error('face');
  if (whyText('bar') !== '撞能量墙') throw new Error('why');
  if (!terrainHit(400, 2, false)) throw new Error('ceil hit');
  if (!terrainHit(400, 390, false)) throw new Error('floor hit');
  if (terrainHit(400, 200, false)) throw new Error('mid safe');
  if (!overlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 8, y: 8, w: 10, h: 10 })) throw new Error('overlap');
  if (overlap({ x: 0, y: 0, w: 4, h: 4 }, { x: 8, y: 8, w: 4, h: 4 })) throw new Error('no overlap');
  slot = 3;
  fx = fuelXForSlot(slot);
  if (fx < slot * FUEL_EVERY || fx > (slot + 1) * FUEL_EVERY + 80) throw new Error('fuel slot');
  wx = wallXForSlot(2);
  if (wx < 2 * WALL_EVERY || wx > 3 * WALL_EVERY + 80) throw new Error('wall slot');
  if (FUEL_GAIN < 20) throw new Error('fuel gain');
  if (fuelDrain(false) * (FUEL_EVERY / scrollSpeed(false, 0)) > FUEL_GAIN + 10) throw new Error('fuel economy');
  c = makeCore(CORE_X, 320, 80);
  if (c.hp < 8) throw new Error('core hp');
  if (c.kind !== 'core') throw new Error('core kind');
  i = makeWall(500, 40, 320, false);
  if (i.hp !== 3) throw new Error('wall hp');
  i = makeWall(500, 40, 320, true);
  if (i.hp !== 4) throw new Error('blitz wall hp');
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
      slot = Math.floor((x - 70) / FUEL_EVERY);
      if (slot >= 1 && !seen[slot]) {
        fx = fuelXForSlot(slot);
        if (x >= fx) {
          seen[slot] = 1;
          fuel = Math.min(FUEL_MAX, fuel + FUEL_GAIN);
          tanks += 1;
        }
      }
    }
    if (tanks < 12) throw new Error('too few tanks');
    if (fuel < 20) throw new Error('cannot reach core on fuel');
    h2 = heights(CORE_X + 160, false);
    if (h2.f - h2.c > 28) throw new Error('core seals');
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
var btnZone = document.getElementById('btn-zone');
var btnBlitz = document.getElementById('btn-blitz');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnShot = document.getElementById('btn-shot');
var btnFu = document.getElementById('btn-fu');
var btnFd = document.getElementById('btn-fd');
var btnFl = document.getElementById('btn-fl');
var btnFr = document.getElementById('btn-fr');
var scoreEl = document.getElementById('score');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var zoneLabel = document.getElementById('zone-label');
var faceLabel = document.getElementById('face-label');
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

var keys = {
  l: false, r: false, u: false, d: false,
  shot: false, space: false,
  fu: false, fd: false, fl: false, fr: false
};
var pointer = { down: false, hover: false, x: 96, y: 200, id: null };
var inputSrc = 'key';
var pips = [];

var G = {
  mode: 'title',
  blitz: false,
  t: 0,
  clock: 0,
  cam: 0,
  spawnX: 0,
  ship: makeShip(),
  face: { x: 1, y: 0 },
  lives: LIVES,
  fuel: FUEL_MAX,
  score: 0,
  bestZ: 0,
  bestB: 0,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  shots: [],
  ents: [],
  ebullets: [],
  shotCd: 0,
  holdShot: false,
  muzzle: 0,
  muzzleDir: { x: 1, y: 0 },
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
  shoot: function (dx, dy) {
    var f = 880;
    this.ensure();
    if (dy < 0) f = 1120;
    else if (dy > 0) f = 620;
    else if (dx < 0) f = 480;
    this.beep(f, 0.05, 'square', 0.03, f * 1.7);
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
  wallHit: function () {
    this.ensure();
    this.noise(0.03, 0.03, 1600);
    this.beep(740, 0.05, 'square', 0.035, 420);
  },
  wallBurst: function () {
    this.ensure();
    this.noise(0.12, 0.07, 900);
    this.beep(980, 0.1, 'square', 0.05, 1960);
    this.beep(420, 0.16, 'sawtooth', 0.04, 90);
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
  },
  oneup: function () {
    this.ensure();
    this.beep(784, 0.08, 'square', 0.04, 1046);
    this.beep(1175, 0.14, 'triangle', 0.04, 1568);
  }
};

function currentBest() {
  return G.blitz ? G.bestB : G.bestZ;
}
function loadBest() {
  var raw, o;
  G.bestZ = 0;
  G.bestB = 0;
  try {
    raw = localStorage.getItem(BEST_KEY);
    if (raw) {
      o = JSON.parse(raw);
      if (o && typeof o === 'object') {
        G.bestZ = Math.max(0, parseInt(o.z, 10) || 0);
        G.bestB = Math.max(0, parseInt(o.b, 10) || 0);
      } else {
        G.bestZ = Math.max(0, parseInt(raw, 10) || 0);
      }
    }
  } catch (err) { /* ignore */ }
  if (bestEl) bestEl.textContent = String(currentBest());
}
function persistBest() {
  var cur = currentBest();
  if (G.score > cur) {
    if (G.blitz) G.bestB = G.score;
    else G.bestZ = G.score;
    if (bestEl) bestEl.textContent = String(G.score);
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ z: G.bestZ, b: G.bestB }));
  } catch (err) { /* ignore */ }
}
function addScore(n, x, y, gold) {
  var mul, got, before, after;
  if (G.mode !== 'play' || n <= 0) return;
  mul = comboMul(G.combo);
  got = Math.round(n * mul);
  before = Math.floor(G.score / 10000);
  G.score += got;
  after = Math.floor(G.score / 10000);
  persistBest();
  if (after > before && G.lives < 6) {
    G.lives += 1;
    syncPips();
    audio.oneup();
    toast('1UP', 'gold', 800);
  }
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
  ovKicker.textContent = kind === 'win' ? 'CLEAR' : kind === 'lose' ? 'DOWN' : 'VANG';
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
function syncFace() {
  if (faceLabel) faceLabel.textContent = faceGlyph(G.face);
}
function syncHud() {
  if (scoreEl) scoreEl.textContent = String(G.score);
  if (bestEl) bestEl.textContent = String(currentBest());
  if (comboEl) comboEl.textContent = '×' + comboMul(G.combo);
  if (modeLabel) {
    modeLabel.textContent = G.blitz ? '乱射' : '钻隧';
    modeLabel.classList.toggle('blitz', G.blitz);
  }
  if (zoneLabel) {
    zoneLabel.textContent = zoneName(G.section);
    zoneLabel.classList.toggle('hot', G.section === 1 || G.section === 4);
    zoneLabel.classList.toggle('fort', G.section === 5);
  }
  syncFace();
  syncFuel();
  syncPips();
  if (G.mode === 'title') setHint(OPS, '');
  else if (G.mode === 'lose') setHint('R 重开 · ' + whyText(G.why), 'warn');
  else if (G.mode === 'win') setHint('R 重开 · 要塞贯通', 'hot');
  else if (G.fuel < 26) setHint('燃油低 · 吃油荚', 'warn');
  else setHint('空格朝面向开火 · IJKL 四向 · 能量墙可打可等', '');
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
  capArr(particles, 360);
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
function setFacing(dx, dy) {
  var c = cardinalOf(dx, dy);
  G.face.x = c.x;
  G.face.y = c.y;
  syncFace();
}
function wallSolid(e) {
  if (!e || e.dead || e.kind !== 'wall') return false;
  return wallOnAt(e.ph, G.clock, G.blitz);
}

function nearFuelWorld(x) {
  var slot = Math.round((x - 70) / FUEL_EVERY);
  var fx = fuelXForSlot(Math.max(0, slot));
  return Math.abs(x - fx) < 48;
}
function stampRange(x0, x1) {
  var blitz = G.blitz;
  var slot, fuelX, wallX, h, x, r, sec, mid, e, ceil, y;
  slot = Math.floor((x0 - 40) / FUEL_EVERY);
  while (slot * FUEL_EVERY < x1 + 80) {
    fuelX = fuelXForSlot(slot);
    if (fuelX >= x0 && fuelX < x1 && fuelX > 240 && fuelX < CORE_X - 120) {
      h = heights(fuelX, blitz);
      mid = (h.c + h.f) * 0.5;
      y = mid + (hash2(slot * 2.2) - 0.5) * (h.f - h.c) * 0.28;
      y = clamp(y, h.c + 22, h.f - 22);
      G.ents.push(makeFuel(fuelX - 8, y - 8));
    }
    slot += 1;
  }
  slot = Math.floor((x0 - 40) / WALL_EVERY);
  while (slot * WALL_EVERY < x1 + 80) {
    wallX = wallXForSlot(slot);
    if (slot >= 1 && wallX >= x0 && wallX < x1 && wallX > 360 && wallX < CORE_X - 180) {
      if (!nearFuelWorld(wallX)) {
        h = heights(wallX, blitz);
        G.ents.push(makeWall(wallX, h.c, h.f, blitz));
      }
    }
    slot += 1;
  }
  for (x = Math.ceil(x0 / 92) * 92; x < x1; x += 92) {
    if (x < 180 || x > CORE_X - 40) continue;
    if (nearFuelWorld(x)) continue;
    r = hash2(x * 0.017 + 3.3 + (blitz ? 1.7 : 0));
    sec = sectionOf(x);
    h = heights(x, blitz);
    mid = (h.c + h.f) * 0.5;
    if (sec === 0) {
      if (r < 0.32) G.ents.push(makeScout(x, mid + (hash2(x + 1) - 0.5) * 30));
      else if (r < 0.46) G.ents.push(makeDart(x, mid + (hash2(x + 2) - 0.5) * 24));
      else if (r < 0.58) {
        ceil = hash2(x + 8) > 0.5;
        G.ents.push(makeGunner(x, ceil ? h.c + 8 : h.f - 22, ceil));
      }
    } else if (sec === 1) {
      if (r < 0.38) G.ents.push(makeScout(x, mid + (hash2(x + 1) - 0.5) * 36));
      else if (r < 0.56) G.ents.push(makeDart(x, mid));
      else if (r < 0.7) G.ents.push(makeKnight(x, mid));
      if (hash2(x * 0.09 + 8) > 0.72) G.ents.push(makeScout(x + 28, mid - 22));
    } else if (sec === 2) {
      if (r < 0.28) G.ents.push(makeGunner(x, h.c + 8, true));
      else if (r < 0.5) G.ents.push(makeDart(x, mid + (hash2(x) - 0.5) * 20));
      else if (r < 0.68) G.ents.push(makeKnight(x, mid));
      else if (r < 0.82) G.ents.push(makeScout(x, mid));
    } else if (sec === 3) {
      if (r < 0.3) {
        G.ents.push(makeScout(x, mid - 18));
        G.ents.push(makeScout(x + 16, mid));
        G.ents.push(makeScout(x + 32, mid + 18));
      } else if (r < 0.52) G.ents.push(makeDart(x, mid));
      else if (r < 0.7) G.ents.push(makeKnight(x, mid));
    } else if (sec === 4) {
      if (r < 0.34) G.ents.push(makeKnight(x, mid));
      else if (r < 0.56) G.ents.push(makeDart(x, mid + (hash2(x) - 0.5) * 16));
      else if (r < 0.74) {
        ceil = hash2(x + 3) > 0.45;
        G.ents.push(makeGunner(x, ceil ? h.c + 8 : h.f - 22, ceil));
      }
      if (blitz && hash2(x * 0.13) > 0.55) G.ents.push(makeDart(x + 40, mid - 20));
    } else {
      if (r < 0.4) G.ents.push(makeGunner(x, h.c + 10, true));
      else if (r < 0.68) G.ents.push(makeKnight(x, mid));
      else G.ents.push(makeDart(x, mid));
    }
    if (blitz && hash2(x * 0.19) > 0.78) {
      G.ents.push(makeScout(x + 44, mid + (hash2(x + 9) - 0.5) * 28));
    }
  }
  if (!G.core && x0 <= CORE_X && x1 > CORE_X) {
    h = heights(CORE_X, blitz);
    e = makeCore(CORE_X, h.f, h.c);
    if (blitz) e.hp = 16;
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
    if (e.dead || e.x + (e.w || 0) < G.cam - 90) G.ents.splice(i, 1);
  }
  for (i = G.ebullets.length - 1; i >= 0; i--) {
    if (G.ebullets[i].dead || G.ebullets[i].x < G.cam - 40) G.ebullets.splice(i, 1);
  }
}

function resetRun(blitz) {
  G.blitz = !!blitz;
  G.mode = 'play';
  G.t = 0;
  G.clock = 0;
  G.cam = 0;
  G.spawnX = 0;
  G.ship = makeShip();
  G.face = { x: 1, y: 0 };
  G.muzzleDir = { x: 1, y: 0 };
  G.lives = LIVES;
  G.fuel = FUEL_MAX;
  G.score = 0;
  G.combo = 0;
  G.maxCombo = 0;
  G.comboAge = 0;
  G.shots = [];
  G.ents = [];
  G.ebullets = [];
  G.shotCd = 0;
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
  G.blitz = false;
  G.cam = 80;
  G.spawnX = 0;
  G.ents = [];
  G.ebullets = [];
  G.shots = [];
  G.ship = makeShip();
  G.ship.sx = 120;
  G.ship.sy = 188;
  G.face = { x: 1, y: 0 };
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
  showOverlay('title', '先锋', '隧洞自己往前开。四向开火，能量墙可打可等。撞壁、油尽都会掉命。');
}
function startGame(blitz) {
  audio.start();
  resetRun(blitz);
  hideOverlay();
  toast(blitz ? '乱射 · 更快更密' : '钻隧 · 赭谷', blitz ? 'fuel' : 'gold', 900);
  setHint('空格朝面向开火 · IJKL 四向 · 能量墙可打可等', '');
}
function goLose() {
  G.mode = 'lose';
  persistBest();
  syncHud();
  showOverlay('lose', '坠隧了', whyText(G.why) + ' · ' + (G.blitz ? '乱射' : '钻隧') + '  ' + G.score + ' 分 · 连击最高 ' + G.maxCombo);
}
function goWin() {
  G.mode = 'win';
  persistBest();
  syncHud();
  audio.win();
  showOverlay('win', '贯通了', (G.blitz ? '乱射' : '钻隧') + ' 要塞清空 · ' + G.score + ' 分 · 连击最高 ' + G.maxCombo);
}
function restart() {
  audio.ensure();
  if (G.mode === 'title') startGame(false);
  else startGame(G.blitz);
}

function liveShots() {
  var n = 0;
  var i;
  for (i = 0; i < G.shots.length; i++) if (!G.shots[i].dead) n += 1;
  return n;
}
function spawnShot(dx, dy) {
  var x = wx() + dx * 12;
  var y = G.ship.sy + dy * 7;
  G.shots.push(makeShot(x, y, dx, dy));
  G.muzzle = 0.07;
  G.muzzleDir = { x: dx, y: dy };
  G.face.x = dx;
  G.face.y = dy;
  syncFace();
  audio.shoot(dx, dy);
  emit(5, {
    x: x, y: y, j: 2,
    vx0: dx * 80 + (dy ? -40 : 40), vx1: dx * 220 + (dy ? 40 : 80),
    vy0: dy * 80 - 40, vy1: dy * 220 + 40,
    r0: 1, r1: 2.2, life: 0.16, rgb: CYN, g: 0
  });
  screenFlash(CYN, 0.12);
  if (!reduceOn()) G.punch = Math.max(G.punch, 1.012);
}
function fireWanted() {
  var max = G.blitz ? SHOT_MAX_B : SHOT_MAX;
  var dirs = [];
  var n = 0;
  var i;
  var d;
  var mv;
  var c;
  if (G.mode !== 'play' || G.deadT > 0) return;
  if (G.shotCd > 0) return;
  if (keys.fu) dirs.push({ x: 0, y: -1 });
  if (keys.fd) dirs.push({ x: 0, y: 1 });
  if (keys.fl) dirs.push({ x: -1, y: 0 });
  if (keys.fr) dirs.push({ x: 1, y: 0 });
  if (!dirs.length && (keys.shot || G.holdShot)) {
    mv = moveVec(keys.l, keys.r, keys.u, keys.d);
    if (Math.abs(mv.x) > 0.01 || Math.abs(mv.y) > 0.01) {
      c = cardinalOf(mv.x, mv.y);
      dirs.push(c);
    } else {
      dirs.push({ x: G.face.x, y: G.face.y });
    }
  }
  if (!dirs.length) return;
  for (i = 0; i < dirs.length; i++) {
    if (liveShots() + n >= max) break;
    d = dirs[i];
    spawnShot(d.x, d.y);
    n += 1;
  }
  if (n) G.shotCd = G.blitz ? 0.066 : 0.09;
}

function pingFuelBar() {
  if (!fuelWrap) return;
  fuelWrap.classList.add('ping');
  pingTok += 1;
  (function (tok) {
    setTimeout(function () { if (tok === pingTok) fuelWrap.classList.remove('ping'); }, 380);
  }(pingTok));
}
function collectFuel(e) {
  if (e.dead) return;
  e.dead = true;
  G.fuel = Math.min(FUEL_MAX, G.fuel + e.fuel);
  syncFuel();
  audio.fuel();
  hitStop(0.055);
  kick(4.2, 'fuel');
  screenFlash(GOLD, 0.38);
  toast('燃油 +' + e.fuel, 'fuel', 700);
  pingFuelBar();
  boomAt(e.x + 8, e.y + 8, GOLD, 22, 4);
  floats.push({
    x: e.x + 8, y: e.y, text: '+燃油', t: 0, life: 0.72, gold: true, rgb: GOLD, size: 14
  });
  bumpCombo();
  addScore(e.score, e.x + 8, e.y, true);
}
function burstWall(e) {
  var cx = e.x + e.w * 0.5;
  var cy = e.y + e.h * 0.5;
  var i;
  if (e.dead) return;
  e.dead = true;
  audio.wallBurst();
  hitStop(0.062);
  kick(6.2, 'boom');
  screenFlash(MAG, 0.48);
  emit(28, {
    x: cx, y: cy, j: 4,
    vx0: -220, vx1: 220, vy0: -260, vy1: 180,
    r0: 1.6, r1: 4.2, life: 0.5, rgb: MAG, g: 80
  });
  emit(16, {
    x: cx, y: cy, j: e.h * 0.35,
    vx0: -80, vx1: 80, vy0: -40, vy1: 40,
    r0: 1.2, r1: 2.8, life: 0.38, rgb: CYN, g: 40
  });
  for (i = 0; i < 6; i++) {
    popSpark(cx, e.y + (i / 5) * e.h, i % 2 ? MAG : CYN, 10 + i);
  }
  popRing(cx, cy, MAG);
  boomAt(cx, cy, GOLD, 10, 5);
  bumpCombo();
  addScore(e.score, cx, cy, true);
}
function hurtWall(e, hx, hy) {
  e.hp -= 1;
  e.hitT = 0.1;
  popSpark(hx, hy, MAG, 10);
  emit(8, {
    x: hx, y: hy, j: 3,
    vx0: -90, vx1: 90, vy0: -110, vy1: 60,
    r0: 1, r1: 2.4, life: 0.22, rgb: MAG, g: 40
  });
  if (e.hp <= 0) burstWall(e);
  else {
    audio.wallHit();
    hitStop(0.034);
    kick(2.4, 'hit');
    bumpCombo();
    addScore(20, hx, hy, false);
  }
}
function killEnt(e) {
  var rgb, n, mag, cx, cy;
  if (e.dead) return;
  if (e.kind === 'fuel') {
    collectFuel(e);
    return;
  }
  if (e.kind === 'wall') {
    burstWall(e);
    return;
  }
  e.dead = true;
  cx = e.x + e.w * 0.5;
  cy = e.y + e.h * 0.5;
  rgb = e.kind === 'core' ? MAG : e.kind === 'knight' ? GOLD : e.kind === 'dart' ? HOT : CYN;
  n = e.kind === 'core' ? 42 : 14;
  mag = e.kind === 'core' ? 8 : 3.4;
  boomAt(cx, cy, rgb, n, mag);
  audio.hit(G.combo + 1);
  hitStop(e.kind === 'core' ? 0.078 : 0.04);
  kick(mag, 'hit');
  screenFlash(rgb, e.kind === 'core' ? 0.55 : 0.28);
  bumpCombo();
  addScore(e.score, cx, cy, e.kind === 'core');
  if (e.kind === 'core') {
    audio.boom(true);
    G.winT = 0.85;
  }
}
function hurtEnt(e, hx, hy) {
  if (e.kind === 'wall') {
    hurtWall(e, hx, hy);
    return;
  }
  if (e.kind === 'fuel') {
    collectFuel(e);
    return;
  }
  if (e.kind === 'core' || e.kind === 'knight') {
    e.hp -= 1;
    e.flash = 0.1;
    popSpark(hx, hy, e.kind === 'core' ? MAG : GOLD, 10);
    if (e.hp <= 0) killEnt(e);
    else {
      audio.hit(G.combo);
      bumpCombo();
      addScore(e.kind === 'core' ? 40 : 25, hx, hy, false);
      hitStop(0.03);
      kick(2.6, 'hit');
    }
    return;
  }
  killEnt(e);
}

function crash(why) {
  var i;
  if (G.deadT > 0 || G.mode !== 'play') return;
  G.why = why;
  G.deadT = DIE_T;
  G.lives -= 1;
  G.holdShot = false;
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
  syncPips();
  toast(whyText(why), 'warn', 800);
}
function respawn() {
  var h;
  G.cam = Math.max(0, G.cam - 80);
  G.ship.sx = 96;
  h = heights(G.cam + 96, G.blitz);
  G.ship.sy = (h.c + h.f) * 0.5;
  G.fuel = Math.max(G.fuel, 72);
  G.invuln = INVULN;
  G.deadT = 0;
  G.combo = 0;
  G.comboAge = 0;
  G.ebullets = [];
  G.face = { x: 1, y: 0 };
  syncHud();
}

function tickShip(dt) {
  var v, h, pad, nx, ny, aimX, aimY, dx, dy, m, spd, kspd;
  kspd = G.blitz ? SHIP_SPD_B : SHIP_SPD;
  if (G.invuln > 0) G.invuln -= dt;
  if (G.muzzle > 0) G.muzzle -= dt;
  if (G.shotCd > 0) G.shotCd -= dt;
  if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
    aimX = clamp(pointer.x, 28, VW - 36);
    aimY = clamp(pointer.y, 18, VH - 18);
    dx = aimX - G.ship.sx;
    dy = aimY - G.ship.sy;
    m = hypot(dx, dy);
    spd = kspd * 1.28;
    if (m > 2) {
      G.ship.sx += (dx / m) * Math.min(spd, m / dt) * dt;
      G.ship.sy += (dy / m) * Math.min(spd, m / dt) * dt;
      if (m > 8) setFacing(dx, dy);
    }
  } else {
    v = moveVec(keys.l, keys.r, keys.u, keys.d);
    G.ship.sx += v.x * kspd * dt;
    G.ship.sy += v.y * kspd * dt;
    if (Math.abs(v.x) > 0.01 || Math.abs(v.y) > 0.01) setFacing(v.x, v.y);
  }
  G.ship.sx = clamp(G.ship.sx, 28, VW - 36);
  h = heights(wx(), G.blitz);
  pad = 11;
  ny = clamp(G.ship.sy, h.c + pad, h.f - pad);
  if (G.invuln > 0) G.ship.sy = ny;
  else G.ship.sy = clamp(G.ship.sy, 14, VH - 14);
  nx = wx();
  if (G.invuln <= 0) {
    if (terrainHit(nx - 6, G.ship.sy, G.blitz) || terrainHit(nx + 10, G.ship.sy, G.blitz) ||
        terrainHit(nx, G.ship.sy - 5, G.blitz) || terrainHit(nx, G.ship.sy + 5, G.blitz)) {
      crash('wall');
      return;
    }
  }
  fireWanted();
  emit(1, {
    x: nx - 12, y: G.ship.sy + rand(-2, 2), j: 1,
    vx0: -80, vx1: -30, vy0: -18, vy1: 18,
    r0: 1, r1: 2.1, life: 0.18, rgb: G.blitz ? MAG : HOT, g: 0
  });
}
function tickFuel(dt) {
  if (G.invuln > 0) return;
  G.fuel -= fuelDrain(G.blitz) * dt;
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
  if (G.fuel < 26) {
    fuelWarnTok += dt;
    if (fuelWarnTok > 0.72) {
      fuelWarnTok = 0;
      audio.warn();
    }
  }
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
    s.y += s.vy * dt;
    s.life -= dt;
    if (s.life <= 0 || s.x > G.cam + VW + 24 || s.x < G.cam - 30 || s.y < -20 || s.y > VH + 20) {
      s.dead = true;
      G.shots.splice(i, 1);
      continue;
    }
    if (terrainHit(s.x, s.y, G.blitz)) {
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
      if (e.kind === 'wall' && !wallSolid(e)) continue;
      if (circleHits(s.x, s.y, s.r + 1, entBox(e))) {
        hit = true;
        hurtEnt(e, s.x, s.y);
        break;
      }
    }
    if (hit) G.shots.splice(i, 1);
  }
}
function tickEnts(dt) {
  var i, e, dx, dy, m, sp, h, shipX, shipY;
  shipX = wx();
  shipY = G.ship.sy;
  for (i = 0; i < G.ents.length; i++) {
    e = G.ents[i];
    if (e.dead) continue;
    if (e.flash > 0) e.flash -= dt;
    if (e.hitT > 0) e.hitT -= dt;
    if (e.kind === 'scout') {
      e.bob += dt * 2.8;
      e.x += e.vx * dt;
      e.y = e.baseY + Math.sin(e.bob) * e.amp;
    } else if (e.kind === 'dart') {
      e.x += e.vx * dt;
      dy = shipY - (e.y + 4);
      e.y += clamp(dy, -70, 70) * dt * 0.55;
    } else if (e.kind === 'knight') {
      e.bob += dt * 1.8;
      e.x += e.vx * dt;
      e.y = e.baseY + Math.sin(e.bob) * e.amp;
      e.cd -= dt;
      if (e.cd <= 0 && e.x < G.cam + VW - 20 && e.x > G.cam + 40) {
        e.cd = G.blitz ? rand(0.85, 1.4) : rand(1.15, 1.9);
        e.flash = 0.08;
        dx = shipX - (e.x + 10);
        dy = shipY - (e.y + 8);
        m = hypot(dx, dy) || 1;
        sp = G.blitz ? 168 : 132;
        G.ebullets.push(makeEbullet(e.x + 10, e.y + 8, dx / m * sp, dy / m * sp));
      }
    } else if (e.kind === 'gunner') {
      h = heights(e.x + 7, G.blitz);
      e.y = e.ceil ? h.c + 6 : h.f - e.h - 4;
      e.cd -= dt;
      if (e.cd <= 0 && e.x < G.cam + VW - 10 && e.x > G.cam + 30) {
        e.cd = G.blitz ? rand(0.8, 1.3) : rand(1.1, 1.75);
        e.flash = 0.08;
        dx = shipX - (e.x + 7);
        dy = shipY - (e.y + 7);
        m = hypot(dx, dy) || 1;
        sp = G.blitz ? 175 : 142;
        G.ebullets.push(makeEbullet(e.x + 7, e.y + 7, dx / m * sp, dy / m * sp));
      }
    } else if (e.kind === 'wall') {
      h = heights(e.x + 6, G.blitz);
      e.y = h.c + 2;
      e.h = h.f - h.c - 4;
    } else if (e.kind === 'core') {
      h = heights(e.x + 20, G.blitz);
      e.y = (h.c + h.f) * 0.5 - e.h * 0.5;
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
    if (b.life <= 0 || b.x < G.cam - 20 || b.x > G.cam + VW + 30 || terrainHit(b.x, b.y, G.blitz)) {
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
    if (e.kind === 'wall' && !wallSolid(e)) continue;
    if (overlap(box, entBox(e))) {
      if (e.kind === 'fuel') {
        collectFuel(e);
        continue;
      }
      if (e.kind === 'wall') {
        crash('bar');
        return;
      }
      crash('hit');
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
    if (zoneLabel) {
      zoneLabel.textContent = zoneName(s);
      zoneLabel.classList.toggle('hot', s === 1 || s === 4);
      zoneLabel.classList.toggle('fort', s === 5);
    }
    audio.section();
    toast(zoneName(s), s === 5 ? 'gold' : s === 2 ? 'fuel' : 'gold', 900);
    screenFlash(edgeRgb(wx(), s, G.t), 0.28);
  }
}

function update(dt) {
  var sec;
  G.t += dt;
  tickFx(dt);
  if (G.mode === 'title') {
    G.cam += 42 * dt;
    if (G.cam > ZONE_LEN - 400) {
      G.cam = 40;
      G.spawnX = 0;
      G.ents = [];
    }
    ensureWorld();
    G.ship.sy = 188 + Math.sin(G.t * 2.1) * 6;
    for (sec = 0; sec < G.ents.length; sec++) {
      var te = G.ents[sec];
      if (te.kind === 'scout' || te.kind === 'knight') {
        te.bob += dt * 2.4;
        te.x += (te.vx || 0) * dt * 0.35;
        te.y = te.baseY + Math.sin(te.bob) * (te.amp || 10);
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
  G.cam += scrollSpeed(G.blitz, sec) * dt;
  ensureWorld();
  tickShip(dt);
  if (G.deadT > 0) return;
  tickFuel(dt);
  if (G.deadT > 0) return;
  tickShots(dt);
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
  var i, s, tw, gx, gy, sec, k, rgb;
  sec = sectionOf(G.cam + VW * 0.45);
  if (sec === 0) ctx.fillStyle = '#100804';
  else if (sec === 1) ctx.fillStyle = '#0c0612';
  else if (sec === 2) ctx.fillStyle = '#060610';
  else if (sec === 3) ctx.fillStyle = '#0c0804';
  else if (sec === 4) ctx.fillStyle = '#0e040c';
  else ctx.fillStyle = '#10060a';
  ctx.fillRect(L.x, L.y, VW * L.s, VH * L.s);
  for (i = 0; i < stars.length; i++) {
    s = stars[i];
    tw = 0.5 + 0.5 * Math.sin(G.t * 2.4 + s.ph);
    gx = ((s.x - G.cam * s.par) % VW + VW) % VW;
    gy = s.y;
    rgb = sec === 1 ? hueRgb(gx * 0.8 + G.t * 40) : (sec === 2 ? BLU : WHT);
    ctx.fillStyle = rgba(rgb, s.a * tw * (sec === 2 ? 0.55 : 0.9));
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
    ctx.fillStyle = 'rgba(40, 16, 6, 0.4)';
    ctx.fill();
  }
  if (sec === 2) {
    ctx.fillStyle = 'rgba(40, 50, 120, 0.12)';
    ctx.fillRect(L.x, L.y, VW * L.s, VH * L.s);
  }
}

function drawTerrain() {
  var x, h, px, first, sec, edge, fillF, fillC, step, i, band;
  sec = sectionOf(G.cam + VW * 0.5);
  step = 5;
  fillF = sec === 2 ? '#0a0a18' : sec === 4 ? '#180610' : sec === 5 ? '#1a0810' : '#1a0c06';
  fillC = sec === 2 ? '#080814' : '#140804';
  edge = edgeRgb(G.cam + VW * 0.5, sec, G.t);
  ctx.beginPath();
  first = true;
  for (x = -8; x <= VW + 8; x += step) {
    h = heights(G.cam + x, G.blitz);
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
  if (sec === 3) {
    ctx.save();
    ctx.clip();
    for (i = -1; i < VW / 14 + 2; i++) {
      band = Math.floor((G.cam + i * 14) / 14);
      ctx.fillStyle = band % 2 === 0 ? 'rgba(255,227,107,0.08)' : 'rgba(255,122,26,0.08)';
      ctx.fillRect(sx(G.cam + i * 14), L.y, 14 * L.s, VH * L.s);
    }
    ctx.restore();
  }
  ctx.beginPath();
  first = true;
  for (x = -8; x <= VW + 8; x += step) {
    h = heights(G.cam + x, G.blitz);
    px = sx(G.cam + x);
    if (first) {
      ctx.moveTo(px, sy(h.f));
      first = false;
    } else ctx.lineTo(px, sy(h.f));
  }
  ctx.strokeStyle = rgba(edge, 0.92);
  ctx.lineWidth = 2 * L.s;
  ctx.shadowColor = rgba(edge, 0.45);
  ctx.shadowBlur = 8 * L.s;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  first = true;
  for (x = -8; x <= VW + 8; x += step) {
    h = heights(G.cam + x, G.blitz);
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
  if (sec === 3) {
    ctx.save();
    ctx.clip();
    for (i = -1; i < VW / 14 + 2; i++) {
      band = Math.floor((G.cam + i * 14) / 14);
      ctx.fillStyle = band % 2 === 0 ? 'rgba(255,227,107,0.07)' : 'rgba(0,240,255,0.05)';
      ctx.fillRect(sx(G.cam + i * 14), L.y, 14 * L.s, VH * L.s);
    }
    ctx.restore();
  }
  ctx.beginPath();
  first = true;
  for (x = -8; x <= VW + 8; x += step) {
    h = heights(G.cam + x, G.blitz);
    px = sx(G.cam + x);
    if (first) {
      ctx.moveTo(px, sy(h.c));
      first = false;
    } else ctx.lineTo(px, sy(h.c));
  }
  ctx.strokeStyle = rgba(sec === 1 ? hueRgb(G.cam * 0.4 + G.t * 80) : edge, 0.88);
  ctx.lineWidth = 2 * L.s;
  ctx.shadowColor = rgba(edge, 0.4);
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
  var i, e, x, y, w, h, glow, on, a, cx, cy, k, rgb, pulse;
  for (i = 0; i < G.ents.length; i++) {
    e = G.ents[i];
    if (e.dead) continue;
    x = sx(e.x);
    y = sy(e.y);
    w = e.w * L.s;
    h = e.h * L.s;
    if (x + w < L.x - 12 || x > L.x + VW * L.s + 12) continue;
    if (e.kind === 'fuel') {
      glow = 0.55 + 0.45 * Math.sin(G.t * 6 + e.x);
      ctx.fillStyle = rgba(GOLD, 0.16);
      ctx.beginPath();
      ctx.arc(x + w * 0.5, y + h * 0.5, 12 * L.s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#3a2208';
      ctx.strokeStyle = rgba(GOLD, 0.95);
      ctx.lineWidth = 1.4 * L.s;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.5, y);
      ctx.lineTo(x + w, y + h * 0.5);
      ctx.lineTo(x + w * 0.5, y + h);
      ctx.lineTo(x, y + h * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, glow);
      ctx.beginPath();
      ctx.moveTo(x + w * 0.5, y + 3 * L.s);
      ctx.lineTo(x + w - 3 * L.s, y + h * 0.5);
      ctx.lineTo(x + w * 0.5, y + h - 3 * L.s);
      ctx.lineTo(x + 3 * L.s, y + h * 0.5);
      ctx.closePath();
      ctx.fill();
    } else if (e.kind === 'wall') {
      on = wallSolid(e);
      a = on ? (e.hitT > 0 ? 1 : 0.82 + 0.18 * Math.sin(G.t * 10 + e.ph)) : 0.22 + 0.08 * Math.sin(G.t * 8);
      rgb = on ? MAG : CYN;
      pulse = 0.5 + 0.5 * Math.sin(G.t * 7 + e.x);
      ctx.fillStyle = rgba(rgb, on ? 0.18 + pulse * 0.12 : 0.06);
      ctx.fillRect(x - 4 * L.s, y, w + 8 * L.s, h);
      ctx.fillStyle = rgba(rgb, a);
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = rgba(on ? WHT : rgb, on ? 0.7 : 0.35);
      ctx.lineWidth = (on ? 1.6 : 1) * L.s;
      ctx.strokeRect(x, y, w, h);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      for (k = 0; k < 8; k++) {
        cy = y + ((k / 8 + G.t * 0.35 + e.ph * 0.02) % 1) * h;
        ctx.strokeStyle = rgba(CYN, on ? 0.45 : 0.12);
        ctx.lineWidth = 1 * L.s;
        ctx.beginPath();
        ctx.moveTo(x, cy);
        ctx.lineTo(x + w, cy);
        ctx.stroke();
      }
      ctx.restore();
      if (on && e.hp < e.maxHp) {
        ctx.fillStyle = rgba(WHT, 0.35);
        for (k = 1; k < e.maxHp; k++) {
          if (k > e.hp) {
            ctx.fillRect(x + 2 * L.s, y + (k / e.maxHp) * h, w - 4 * L.s, 1.2 * L.s);
          }
        }
      }
    } else if (e.kind === 'scout') {
      ctx.save();
      ctx.translate(x + w * 0.5, y + h * 0.5);
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.beginPath();
      ctx.moveTo(-8 * L.s, 0);
      ctx.lineTo(6 * L.s, -6 * L.s);
      ctx.lineTo(3 * L.s, 0);
      ctx.lineTo(6 * L.s, 6 * L.s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.8 + 0.2 * Math.sin(G.t * 8 + e.x));
      ctx.fillRect(-2 * L.s, -2 * L.s, 4 * L.s, 4 * L.s);
      ctx.restore();
    } else if (e.kind === 'dart') {
      ctx.save();
      ctx.translate(x + w * 0.5, y + h * 0.5);
      ctx.fillStyle = rgba(HOT, 0.95);
      ctx.beginPath();
      ctx.moveTo(-10 * L.s, 0);
      ctx.lineTo(8 * L.s, -4 * L.s);
      ctx.lineTo(4 * L.s, 0);
      ctx.lineTo(8 * L.s, 4 * L.s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(-2 * L.s, -1.4 * L.s, 6 * L.s, 2.8 * L.s);
      ctx.restore();
    } else if (e.kind === 'gunner') {
      ctx.fillStyle = e.flash > 0 ? rgba(HOT, 0.95) : '#2a1410';
      ctx.strokeStyle = rgba(HOT, 0.85);
      ctx.lineWidth = 1.3 * L.s;
      ctx.beginPath();
      ctx.arc(x + w * 0.5, y + h * 0.5, 7 * L.s, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(x + w * 0.35, y + h * 0.2, w * 0.3, h * 0.6);
    } else if (e.kind === 'knight') {
      ctx.save();
      ctx.translate(x + w * 0.5, y + h * 0.5);
      ctx.fillStyle = e.flash > 0 ? rgba(WHT, 0.95) : rgba(GOLD, 0.92);
      ctx.beginPath();
      ctx.moveTo(10 * L.s, 0);
      ctx.lineTo(0, -9 * L.s);
      ctx.lineTo(-10 * L.s, 0);
      ctx.lineTo(0, 9 * L.s);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(MAG, 0.7);
      ctx.lineWidth = 1.2 * L.s;
      ctx.stroke();
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.beginPath();
      ctx.arc(0, 0, 3 * L.s, 0, TAU);
      ctx.fill();
      ctx.restore();
    } else if (e.kind === 'core') {
      glow = 0.4 + 0.6 * (1 - e.hp / (G.blitz ? 16 : 12));
      cx = x + w * 0.5;
      cy = y + h * 0.5;
      ctx.fillStyle = '#1a0a14';
      ctx.strokeStyle = rgba(e.flash > 0 ? WHT : MAG, 0.95);
      ctx.lineWidth = 2.2 * L.s;
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(x + w, cy);
      ctx.lineTo(cx, y + h);
      ctx.lineTo(x, cy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = rgba(MAG, 0.25 + glow * 0.5);
      ctx.beginPath();
      ctx.arc(cx, cy, (12 + glow * 10) * L.s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(cx, cy, 7 * L.s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.font = '700 ' + (10 * L.s) + 'px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('核', cx, cy);
    }
  }
}

function drawProjectiles() {
  var i, s, b, len;
  for (i = 0; i < G.shots.length; i++) {
    s = G.shots[i];
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.shadowColor = rgba(CYN, 0.7);
    ctx.shadowBlur = 8 * L.s;
    len = 11;
    if (s.dx !== 0) {
      ctx.fillRect(sx(s.x) - (s.dx > 0 ? 2 : len - 2) * L.s, sy(s.y) - 1.5 * L.s, len * L.s, 3 * L.s);
    } else {
      ctx.fillRect(sx(s.x) - 1.5 * L.s, sy(s.y) - (s.dy > 0 ? 2 : len - 2) * L.s, 3 * L.s, len * L.s);
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(sx(s.x), sy(s.y), 1.6 * L.s, 0, TAU);
    ctx.fill();
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
  var x, y, blink, md;
  if (G.mode === 'play' && G.deadT > 0) return;
  blink = G.invuln > 0 && ((G.invuln * 12) | 0) % 2 === 0;
  if (blink) return;
  x = sx(wx());
  y = sy(G.ship.sy);
  ctx.save();
  ctx.translate(x, y);
  if (G.muzzle > 0) {
    md = G.muzzleDir;
    ctx.fillStyle = rgba(WHT, 0.9);
    if (md.x > 0) ctx.fillRect(12 * L.s, -1.6 * L.s, 11 * L.s, 3.2 * L.s);
    else if (md.x < 0) ctx.fillRect(-22 * L.s, -1.6 * L.s, 11 * L.s, 3.2 * L.s);
    else if (md.y < 0) ctx.fillRect(-1.6 * L.s, -22 * L.s, 3.2 * L.s, 11 * L.s);
    else ctx.fillRect(-1.6 * L.s, 12 * L.s, 3.2 * L.s, 11 * L.s);
    ctx.fillStyle = rgba(CYN, 0.8);
    if (md.x > 0) ctx.fillRect(12 * L.s, -3 * L.s, 6 * L.s, 6 * L.s);
    else if (md.x < 0) ctx.fillRect(-18 * L.s, -3 * L.s, 6 * L.s, 6 * L.s);
    else if (md.y < 0) ctx.fillRect(-3 * L.s, -18 * L.s, 6 * L.s, 6 * L.s);
    else ctx.fillRect(-3 * L.s, 12 * L.s, 6 * L.s, 6 * L.s);
  }
  ctx.fillStyle = rgba(CYN, 0.95);
  ctx.beginPath();
  ctx.moveTo(13 * L.s, 0);
  ctx.lineTo(-8 * L.s, -8 * L.s);
  ctx.lineTo(-5 * L.s, 0);
  ctx.lineTo(-8 * L.s, 8 * L.s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = rgba(GOLD, 0.95);
  ctx.beginPath();
  ctx.moveTo(5 * L.s, 0);
  ctx.lineTo(-2 * L.s, -3.2 * L.s);
  ctx.lineTo(-2 * L.s, 3.2 * L.s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = rgba(HOT, 0.9);
  ctx.fillRect(-10 * L.s, -2 * L.s, 5 * L.s, 4 * L.s);
  ctx.fillStyle = rgba(CYN, 0.85);
  if (G.face.x > 0) {
    ctx.beginPath();
    ctx.moveTo(15 * L.s, 0);
    ctx.lineTo(10 * L.s, -3 * L.s);
    ctx.lineTo(10 * L.s, 3 * L.s);
    ctx.fill();
  } else if (G.face.x < 0) {
    ctx.beginPath();
    ctx.moveTo(-14 * L.s, 0);
    ctx.lineTo(-9 * L.s, -3 * L.s);
    ctx.lineTo(-9 * L.s, 3 * L.s);
    ctx.fill();
  } else if (G.face.y < 0) {
    ctx.beginPath();
    ctx.moveTo(0, -12 * L.s);
    ctx.lineTo(-3 * L.s, -7 * L.s);
    ctx.lineTo(3 * L.s, -7 * L.s);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, 12 * L.s);
    ctx.lineTo(-3 * L.s, 7 * L.s);
    ctx.lineTo(3 * L.s, 7 * L.s);
    ctx.fill();
  }
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
  ctx.fillStyle = '#0c0703';
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
  return {
    x: (x - L.x) / Math.max(0.001, L.s),
    y: (y - L.y) / Math.max(0.001, L.s)
  };
}

function onKey(e, down) {
  var k = e.key;
  var code = e.code;
  var fireKey = false;
  var moveKey = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' ||
    k === 'w' || k === 'a' || k === 's' || k === 'd' ||
    k === 'W' || k === 'A' || k === 'S' || k === 'D';
  var space = k === ' ' || k === 'Spacebar' || code === 'Space';
  if (moveKey || space || k === 'r' || k === 'R' || k === 'm' || k === 'M' ||
      k === 'i' || k === 'I' || k === 'j' || k === 'J' || k === 'k' || k === 'K' ||
      k === 'l' || k === 'L') {
    e.preventDefault();
  }
  if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.l = down;
  if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.r = down;
  if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.u = down;
  if (k === 'ArrowDown' || k === 's' || k === 'S') keys.d = down;
  if (k === 'i' || k === 'I') keys.fu = down;
  if (k === 'k' || k === 'K') keys.fd = down;
  if (k === 'j' || k === 'J') keys.fl = down;
  if (k === 'l' || k === 'L') keys.fr = down;
  if (space) keys.space = down;
  if (!down) {
    if (space) {
      keys.shot = false;
      if (!pointer.down) G.holdShot = false;
    }
    return;
  }
  if (e.repeat && (k === 'r' || k === 'R' || k === 'm' || k === 'M')) return;
  inputSrc = 'key';
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
  fireKey = k === 'i' || k === 'I' || k === 'j' || k === 'J' || k === 'k' || k === 'K' || k === 'l' || k === 'L';
  if (fireKey) {
    audio.ensure();
    fireWanted();
    return;
  }
  if (space || k === 'Enter') {
    audio.ensure();
    if (overlayOpen()) {
      if (G.mode === 'title') startGame(false);
      else if (G.mode === 'lose' || G.mode === 'win') startGame(G.blitz);
      return;
    }
    keys.shot = true;
    G.holdShot = true;
    fireWanted();
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
    if (G.mode === 'play') fireWanted();
    if (canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
  });
  canvas.addEventListener('pointermove', function (e) {
    var p = pointerWorld(e);
    var dx, dy;
    dx = p.x - pointer.x;
    dy = p.y - pointer.y;
    pointer.x = p.x;
    pointer.y = p.y;
    if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
    if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
    if (pointer.down && (Math.abs(dx) > 1.2 || Math.abs(dy) > 1.2)) setFacing(dx, dy);
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
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
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

if (btnZone) {
  btnZone.addEventListener('click', function () {
    audio.ensure();
    startGame(false);
  });
}
if (btnBlitz) {
  btnBlitz.addEventListener('click', function () {
    audio.ensure();
    startGame(true);
  });
}
if (ovRetry) {
  ovRetry.addEventListener('click', function () {
    audio.ensure();
    startGame(G.blitz);
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
  fireWanted();
}, function () { G.holdShot = false; });
bindPad(btnFu, function () {
  keys.fu = true;
  fireWanted();
}, function () { keys.fu = false; });
bindPad(btnFd, function () {
  keys.fd = true;
  fireWanted();
}, function () { keys.fd = false; });
bindPad(btnFl, function () {
  keys.fl = true;
  fireWanted();
}, function () { keys.fl = false; });
bindPad(btnFr, function () {
  keys.fr = true;
  fireWanted();
}, function () { keys.fr = false; });

window.addEventListener('keydown', function (e) { onKey(e, true); });
window.addEventListener('keyup', function (e) { onKey(e, false); });
window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', function () {
  hidden = document.hidden;
  if (hidden) {
    keys.l = keys.r = keys.u = keys.d = false;
    keys.shot = keys.space = false;
    keys.fu = keys.fd = keys.fl = keys.fr = false;
    G.holdShot = false;
  }
});

requestAnimationFrame(frame);

}
