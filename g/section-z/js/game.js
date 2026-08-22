'use strict';

/* Z区 — Section Z remake. No CDN. */

var VW = 720;
var VH = 400;
var LIVES = 3;
var SUIT_SPD = 228;
var SUIT_SPD_D = 270;
var SHOT_V = 560;
var SHOT_MAX = 4;
var SHOT_MAX_D = 5;
var SHOT_CD = 0.112;
var SHOT_CD_D = 0.09;
var FUEL_MAX = 100;
var FUEL_GAIN = 34;
var FUEL_DRAIN = 4.2;
var FUEL_DRAIN_D = 5.8;
var SHOT_FUEL = 0.22;
var CELL_EVERY = 470;
var COMBO_WIN = 1.38;
var INVULN = 1.4;
var DIE_T = 0.78;
var SCROLL = 118;
var SCROLL_D = 168;
var CORE_HP = 22;
var CORE_HP_D = 30;
var ONEUP = 16000;
var LIFE_CAP = 6;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var BEST_KEY = 'playbox-section-z-best';
var MUTE_KEY = 'playbox-section-z-mute';
var OPS = '方向键 / WASD 移动 · 空格射击 · 区末飞进闸门选路 · R 重开 · M 静音';

var MAG = [255, 61, 184];
var CYN = [62, 200, 255];
var TEAL = [26, 208, 200];
var GOLD = [255, 227, 107];
var WHT = [232, 246, 255];
var HOT = [92, 184, 255];
var PUR = [176, 152, 255];
var ORG = [255, 168, 72];

var SECS = {
  A: { id: 'A', name: '闸口', dir: 1, len: 1680, gap: 236, hue: 210, up: 'B', down: 'C', dens: 0.88 },
  B: { id: 'B', name: '青廊', dir: 1, len: 1680, gap: 198, hue: 192, up: 'D', down: 'E', dens: 1.08 },
  C: { id: 'C', name: '逆流', dir: -1, len: 1680, gap: 206, hue: 228, up: 'E', down: 'F', dens: 1.12 },
  D: { id: 'D', name: '密管', dir: 1, len: 1560, gap: 164, hue: 200, up: 'Z', down: 'Z', dens: 1.28 },
  E: { id: 'E', name: '回廊', dir: -1, len: 1560, gap: 176, hue: 248, up: 'Z', down: 'Z', dens: 1.26 },
  F: { id: 'F', name: '环舱', dir: 1, len: 1560, gap: 188, hue: 178, up: 'Z', down: 'Z', dens: 1.18 },
  Z: { id: 'Z', name: '核芯', dir: 1, len: 1480, gap: 228, hue: 210, up: null, down: null, dens: 1.22, core: true }
};

var MAP_POS = {
  A: [0.50, 0.10],
  B: [0.26, 0.36],
  C: [0.74, 0.36],
  D: [0.14, 0.62],
  E: [0.50, 0.62],
  F: [0.86, 0.62],
  Z: [0.50, 0.90]
};

var MAP_EDGES = [
  ['A', 'B'], ['A', 'C'],
  ['B', 'D'], ['B', 'E'],
  ['C', 'E'], ['C', 'F'],
  ['D', 'Z'], ['E', 'Z'], ['F', 'Z']
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
function hueRgb(h) {
  var a = ((h % 360) + 360) % 360 / 60;
  var i = Math.floor(a);
  var f = a - i;
  var v = 1;
  var p = 0.16;
  var q = 1 - f * 0.84;
  var t = 0.16 + f * 0.84;
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
function specOf(id) {
  return SECS[id] || SECS.A;
}
function bulkX(spec) {
  return spec.len - 176;
}
function coreX(spec) {
  return 920;
}
function scrollSpeed(dense, spec, nearEnd) {
  var sp = dense ? SCROLL_D : SCROLL;
  sp += (spec.dens - 1) * (dense ? 22 : 14);
  if (spec.core) sp *= 0.72;
  if (nearEnd) sp *= 0.48;
  return sp;
}
function fuelDrain(dense) {
  return dense ? FUEL_DRAIN_D : FUEL_DRAIN;
}
function suitSpd(dense) {
  return dense ? SUIT_SPD_D : SUIT_SPD;
}
function whyText(w) {
  if (w === 'wall') return '撞舱壁';
  if (w === 'bulk') return '撞闸门';
  if (w === 'hit') return '撞机体';
  if (w === 'shot') return '中弹了';
  if (w === 'fuel') return '能量耗尽';
  if (w === 'core') return '撞核芯';
  return '坠落了';
}
function faceGlyph(dir) {
  return dir < 0 ? '向←' : '向→';
}
function pathText(path) {
  return path && path.length ? path.join('→') : 'A';
}
function nextOf(id, up) {
  var s = specOf(id);
  return up ? s.up : s.down;
}
function routesToZ() {
  return [
    ['A', 'B', 'D', 'Z'],
    ['A', 'B', 'E', 'Z'],
    ['A', 'C', 'E', 'Z'],
    ['A', 'C', 'F', 'Z']
  ];
}

function makeSuit() {
  return { sx: 92, sy: 200 };
}
function makeShot(x, y, vx) {
  return { x: x, y: y, vx: vx, r: 3.2, life: 0.85, dead: false };
}
function makeCell(x, y) {
  return { kind: 'cell', x: x, y: y, w: 16, h: 16, fuel: FUEL_GAIN, score: 40, dead: false, bob: 0 };
}
function makeDrone(x, y) {
  return {
    kind: 'drone', x: x, y: y, baseY: y, w: 18, h: 14, hp: 1, score: 50,
    vx: -36, amp: 18 + hash2(x) * 14, bob: hash2(x + 3) * TAU, dead: false, hitT: 0
  };
}
function makeWasp(x, y) {
  return {
    kind: 'wasp', x: x, y: y, w: 16, h: 12, hp: 1, score: 80,
    vx: -70, dead: false, hitT: 0
  };
}
function makeTurret(x, y, ceil) {
  return {
    kind: 'turret', x: x, y: y, w: 18, h: 16, hp: 2, score: 120,
    ceil: !!ceil, cd: 0.4 + hash2(x) * 0.8, flash: 0, dead: false, hitT: 0
  };
}
function makeOrbiter(x, y) {
  return {
    kind: 'orbiter', x: x, y: y, cx: x, cy: y, w: 16, h: 16, hp: 2, score: 100,
    ang: hash2(x + 1) * TAU, rad: 26 + hash2(x + 5) * 10, spin: 1.6 + hash2(x) * 0.8,
    dead: false, hitT: 0
  };
}
function makeSentinel(x, y) {
  return {
    kind: 'sent', x: x, y: y, baseY: y, w: 28, h: 24, hp: 6, score: 400,
    vx: -22, bob: 0, amp: 22, cd: 1.1, flash: 0, dead: false, hitT: 0
  };
}
function makeCore(x, y) {
  return {
    kind: 'core', x: x, y: y, w: 64, h: 64, hp: CORE_HP, maxhp: CORE_HP, score: 3000,
    ang: 0, cd: 0.8, flash: 0, dead: false, hitT: 0, open: 1
  };
}
function makeBulk(spec) {
  var x = bulkX(spec);
  return {
    kind: 'bulk', x: x, w: 34, y: 0, h: VH,
    up: spec.up, down: spec.down, dead: false
  };
}
function makeEbullet(x, y, vx, vy) {
  return { x: x, y: y, vx: vx, vy: vy, r: 3.4, life: 2.4, dead: false };
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function circleHits(x, y, r, b) {
  var nx = clamp(x, b.x, b.x + b.w);
  var ny = clamp(y, b.y, b.y + b.h);
  var dx = x - nx;
  var dy = y - ny;
  return dx * dx + dy * dy <= r * r;
}
function entBox(e) {
  if (e.kind === 'core') return { x: e.x - e.w * 0.5, y: e.y - e.h * 0.5, w: e.w, h: e.h };
  if (e.kind === 'orbiter') return { x: e.x - 8, y: e.y - 8, w: 16, h: 16 };
  return { x: e.x, y: e.y, w: e.w, h: e.h };
}

function heights(wx, spec, dense) {
  var s = spec || specOf(G ? G.sec : 'A');
  var n = fbm(wx * 0.0048 + s.id.charCodeAt(0) * 1.7);
  var n2 = fbm(wx * 0.0021 + 13.4 + s.id.charCodeAt(0));
  var gap = s.gap + (n - 0.5) * (s.id === 'D' ? 8 : 16);
  var mid;
  var c;
  var f;
  var t;
  var bx;
  if (dense) gap -= 12;
  mid = 200 + (n2 - 0.5) * (s.id === 'D' ? 16 : 30);
  if (s.id === 'F') {
    mid = 200 + Math.sin(wx * 0.012) * 22;
  }
  if (s.core && wx > 760) {
    t = clamp((wx - 760) / 180, 0, 1);
    gap = lerp(gap, 252, t);
    mid = lerp(mid, 200, t);
  }
  bx = bulkX(s);
  if (s.up && wx > bx - 50 && wx < bx + 90) {
    gap = Math.max(gap, 214);
  }
  c = mid - gap * 0.5;
  f = mid + gap * 0.5;
  c = clamp(c, 16, 148);
  f = clamp(f, 252, VH - 16);
  if (f - c < 118) {
    mid = (c + f) * 0.5;
    c = mid - 59;
    f = mid + 59;
  }
  return { c: c, f: f };
}
function terrainHit(wx, y, spec, dense) {
  var h = heights(wx, spec, dense);
  return y < h.c + 1 || y > h.f - 1;
}
function holesOf(spec, wx) {
  var h = heights(wx, spec, false);
  var hole = 52;
  var pad = 16;
  return {
    upY: h.c + pad,
    upH: hole,
    downY: h.f - pad - hole,
    downH: hole
  };
}
function holeAt(y, hs) {
  if (y > hs.upY + 7 && y < hs.upY + hs.upH - 7) return 'up';
  if (y > hs.downY + 7 && y < hs.downY + hs.downH - 7) return 'down';
  return null;
}
function cellXForSlot(slot, spec) {
  var jitter = (hash2(slot * 3.1 + spec.id.charCodeAt(0)) - 0.5) * 70;
  return 260 + slot * CELL_EVERY + jitter;
}

function selfCheck() {
  var v, s, r, i, routes, id, nxt, seen, h0, hD, gap0, gapD, hs, fuel, x, dt, sp, cells, slot, fx, spec, shot;
  if (BEST_KEY !== 'playbox-section-z-best') throw new Error('best key');
  if (MUTE_KEY !== 'playbox-section-z-mute') throw new Error('mute key');
  if (LIVES !== 3) throw new Error('3 lives');
  if (SECS.A.dir !== 1) throw new Error('A forward');
  if (SECS.C.dir !== -1) throw new Error('C reverse');
  if (SECS.E.dir !== -1) throw new Error('E reverse');
  if (SECS.B.dir !== 1 || SECS.Z.dir !== 1) throw new Error('forward secs');
  if (SECS.C.name !== '逆流' || SECS.Z.name !== '核芯') throw new Error('names');
  if (nextOf('A', true) !== 'B' || nextOf('A', false) !== 'C') throw new Error('A branches');
  if (nextOf('B', true) !== 'D' || nextOf('C', false) !== 'F') throw new Error('mid branches');
  if (nextOf('D', true) !== 'Z' || nextOf('F', false) !== 'Z') throw new Error('to core');
  if (SECS.Z.up || SECS.Z.down) throw new Error('Z no gate');
  if (!SECS.Z.core) throw new Error('Z core flag');
  if (scrollSpeed(true, SECS.A, false) <= scrollSpeed(false, SECS.A, false)) throw new Error('dense faster');
  if (fuelDrain(true) <= fuelDrain(false)) throw new Error('dense hungrier');
  if (comboMul(1) !== 1) throw new Error('combo 1');
  if (comboMul(4) !== 2) throw new Error('combo 4');
  if (comboMul(7) !== 3) throw new Error('combo 7');
  if (comboMul(13) !== 5) throw new Error('combo cap');
  v = moveVec(true, false, true, false);
  if (Math.abs(Math.abs(v.x) - 0.7071) > 0.02) throw new Error('8dir');
  shot = makeShot(0, 0, SHOT_V);
  if (shot.vx < 400) throw new Error('shot speed');
  if (shot.life * SHOT_V < VW * 0.6) throw new Error('shot reach');
  h0 = heights(400, SECS.A, false);
  hD = heights(400, SECS.D, false);
  gap0 = h0.f - h0.c;
  gapD = hD.f - hD.c;
  if (gap0 < 200) throw new Error('A open');
  if (gapD >= gap0 - 20) throw new Error('D tighter');
  if (terrainHit(400, 4, SECS.A, false) !== true) throw new Error('ceil hit');
  if (terrainHit(400, 396, SECS.A, false) !== true) throw new Error('floor hit');
  if (terrainHit(400, 200, SECS.A, false)) throw new Error('mid safe');
  hs = holesOf(SECS.A, bulkX(SECS.A));
  if (holeAt(hs.upY + 20, hs) !== 'up') throw new Error('up hole');
  if (holeAt(hs.downY + 20, hs) !== 'down') throw new Error('down hole');
  if (holeAt((hs.upY + hs.upH + hs.downY) * 0.5, hs)) throw new Error('mid bulk solid');
  if (!overlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 8, y: 8, w: 10, h: 10 })) throw new Error('overlap');
  if (overlap({ x: 0, y: 0, w: 4, h: 4 }, { x: 8, y: 8, w: 4, h: 4 })) throw new Error('no overlap');
  if (whyText('fuel') !== '能量耗尽') throw new Error('why');
  if (faceGlyph(-1) !== '向←') throw new Error('rev face');
  if (pathText(['A', 'C', 'F']) !== 'A→C→F') throw new Error('path');
  if (CORE_HP_D <= CORE_HP) throw new Error('dense core');
  if (FUEL_GAIN < 20) throw new Error('fuel gain');
  routes = routesToZ();
  if (routes.length !== 4) throw new Error('four routes');
  for (i = 0; i < routes.length; i++) {
    r = routes[i];
    if (r[0] !== 'A' || r[r.length - 1] !== 'Z') throw new Error('route ends');
    if (r.length !== 4) throw new Error('four hops');
    for (id = 0; id < r.length - 1; id++) {
      nxt = nextOf(r[id], true);
      if (nxt !== r[id + 1] && nextOf(r[id], false) !== r[id + 1]) throw new Error('edge ' + r[id]);
    }
  }
  seen = {};
  function walk(id, depth) {
    var s = specOf(id);
    if (id === 'Z') { seen.Z = true; return; }
    if (depth > 6) throw new Error('loop');
    if (s.up) walk(s.up, depth + 1);
    if (s.down) walk(s.down, depth + 1);
  }
  walk('A', 0);
  if (!seen.Z) throw new Error('cannot reach Z');
  spec = SECS.A;
  fuel = FUEL_MAX;
  x = 0;
  dt = 0.05;
  cells = 0;
  slot = 0;
  while (x < spec.len - 40) {
    sp = scrollSpeed(false, spec, x > bulkX(spec) - 80);
    x += sp * dt;
    fuel -= fuelDrain(false) * dt;
    fx = cellXForSlot(slot, spec);
    if (fx < spec.len - 220 && x >= fx && fx > 200) {
      fuel = Math.min(FUEL_MAX, fuel + FUEL_GAIN);
      cells += 1;
      slot += 1;
    }
  }
  if (cells < 2) throw new Error('too few cells');
  if (fuel < 8) throw new Error('cannot clear A on fuel');
  if (makeCore(100, 200).hp !== CORE_HP) throw new Error('core hp');
  if (makeCore(100, 200).maxhp !== CORE_HP) throw new Error('core maxhp');
  if (makeShot(0, 200, SHOT_V).vx <= 0) throw new Error('shot forward');
  if (makeTurret(10, 10, true).hp !== 2) throw new Error('turret hp');
  if (makeSentinel(10, 10).hp < 5) throw new Error('sent hp');
  if (SECS.A.hue < 200 || SECS.A.hue > 220) throw new Error('hue 210');
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
var btnRaid = document.getElementById('btn-raid');
var btnDense = document.getElementById('btn-dense');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnShot = document.getElementById('btn-shot');
var scoreEl = document.getElementById('score');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var zoneLabel = document.getElementById('zone-label');
var pathLabel = document.getElementById('path-label');
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
  l: false, r: false, u: false, d: false, space: false, shot: false
};
var pointer = { down: false, hover: false, x: 96, y: 200, id: null };
var inputSrc = 'key';
var pips = [];

var G = {
  mode: 'title',
  dense: false,
  t: 0,
  clock: 0,
  cam: 0,
  spawnX: 0,
  sec: 'A',
  dir: 1,
  path: ['A'],
  ship: makeSuit(),
  lives: LIVES,
  fuel: FUEL_MAX,
  score: 0,
  bestS: 0,
  bestD: 0,
  next1up: ONEUP,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  shots: [],
  ents: [],
  ebullets: [],
  shotCd: 0,
  holdShot: false,
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
  core: null,
  bulk: null,
  warned: false,
  entering: false
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
  shoot: function (rev) {
    this.ensure();
    this.beep(rev ? 640 : 920, 0.05, 'square', 0.03, rev ? 420 : 1480);
  },
  boom: function (big) {
    this.ensure();
    this.noise(big ? 0.16 : 0.07, big ? 0.07 : 0.04, big ? 280 : 700);
    this.beep(big ? 220 : 360, big ? 0.2 : 0.08, 'sawtooth', 0.045, 70);
  },
  hit: function (combo) {
    this.ensure();
    var lift = 1 + Math.min(0.5, combo * 0.04);
    this.noise(0.035, 0.032, 1200);
    this.beep(540 * lift, 0.07, 'square', 0.042, 900 * lift);
  },
  cell: function () {
    this.ensure();
    this.beep(700, 0.07, 'sine', 0.05, 1040);
    this.beep(1040, 0.12, 'triangle', 0.04, 1560);
    this.beep(1320, 0.16, 'sine', 0.028, 1760);
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
  gate: function () {
    this.ensure();
    this.beep(523, 0.08, 'square', 0.045, 784);
    this.beep(784, 0.12, 'triangle', 0.04, 1046);
    this.beep(1175, 0.18, 'sine', 0.035, 1568);
  },
  rev: function () {
    this.ensure();
    this.beep(880, 0.1, 'sawtooth', 0.04, 330);
    this.beep(440, 0.16, 'triangle', 0.035, 196);
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
  return G.dense ? G.bestD : G.bestS;
}
function loadBest() {
  var raw, o;
  G.bestS = 0;
  G.bestD = 0;
  try {
    raw = localStorage.getItem(BEST_KEY);
    if (raw) {
      o = JSON.parse(raw);
      if (o && typeof o === 'object') {
        G.bestS = o.s | 0;
        G.bestD = o.d | 0;
      } else {
        G.bestS = parseInt(raw, 10) || 0;
      }
    }
  } catch (err) { /* ignore */ }
}
function persistBest() {
  var n = G.score;
  if (G.dense) {
    if (n > G.bestD) G.bestD = n;
  } else if (n > G.bestS) G.bestS = n;
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ s: G.bestS, d: G.bestD }));
  } catch (err) { /* ignore */ }
}
function addScore(n, x, y, gold) {
  var prev, now, gained, el;
  if (!n) return;
  prev = Math.floor(G.score / ONEUP);
  G.score += n;
  persistBest();
  now = Math.floor(G.score / ONEUP);
  if (now > prev && G.lives < LIFE_CAP) {
    G.lives += 1;
    audio.oneup();
    toast('1UP', 'gold', 800);
    syncPips();
  }
  if (scoreEl) {
    scoreEl.textContent = String(G.score);
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    if (scoreAdd) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + n;
      addTok += 1;
      gained = addTok;
      setTimeout(function () {
        if (gained === addTok) scoreAdd.hidden = true;
      }, 700);
    }
  }
  if (bestEl) bestEl.textContent = String(currentBest());
  if (x != null) {
    floats.push({
      x: x, y: y, text: '+' + n, t: 0, life: 0.7,
      gold: !!gold, rgb: gold ? GOLD : WHT, size: gold ? 14 : 12
    });
  }
  el = n;
  return el;
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
  ovKicker.textContent = kind === 'win' ? 'CLEAR' : kind === 'lose' ? 'DOWN' : 'SECZ';
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
  var spec = specOf(G.sec);
  if (scoreEl) scoreEl.textContent = String(G.score);
  if (bestEl) bestEl.textContent = String(currentBest());
  if (comboEl) comboEl.textContent = '×' + comboMul(G.combo);
  if (modeLabel) {
    modeLabel.textContent = G.dense ? '密火' : '穿区';
    modeLabel.classList.toggle('dense', G.dense);
  }
  if (zoneLabel) {
    zoneLabel.textContent = spec.name;
    zoneLabel.classList.toggle('rev', spec.dir < 0);
    zoneLabel.classList.toggle('core', !!spec.core);
  }
  if (pathLabel) pathLabel.textContent = pathText(G.path);
  if (faceLabel) faceLabel.textContent = faceGlyph(G.dir);
  syncFuel();
  syncPips();
  if (G.mode === 'title') setHint(OPS, '');
  else if (G.mode === 'lose') setHint('R 重开 · ' + whyText(G.why), 'warn');
  else if (G.mode === 'win') setHint('R 重开 · 核芯击破', 'hot');
  else if (G.fuel < 26) setHint('能量低 · 吃能芯', 'warn');
  else if (spec.up) setHint('区末两扇闸门 · 飞进去选下一区', '');
  else setHint('空格射击 · 打爆核芯', spec.core ? 'hot' : '');
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
  stageEl.classList.remove('die', 'hit', 'boom', 'fuel', 'gate');
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
    vx0: -160, vx1: 160, vy0: -220, vy1: 90,
    r0: 1.4, r1: 3.6, life: 0.42, rgb: rgb, g: 260
  });
  popSpark(x, y, rgb, 12 + mag * 1.4);
  popRing(x, y, rgb);
}

function pwx() {
  return G.dir > 0 ? G.cam + G.ship.sx : G.cam + (VW - G.ship.sx);
}
function toSX(wx) {
  var local = wx - G.cam;
  if (G.dir > 0) return L.x + local * L.s;
  return L.x + (VW - local) * L.s;
}
function boxLeft(wx, w) {
  return G.dir > 0 ? toSX(wx) : toSX(wx + w);
}
function toSY(y) {
  return L.y + y * L.s;
}

function currentSpec() {
  return specOf(G.sec);
}

function stampRange(x0, x1) {
  var spec = currentSpec();
  var dense = G.dense;
  var dens = spec.dens * (dense ? 1.38 : 1);
  var x, r, h, mid, ceil, slot, fx, bx, e, y;
  var step = dense ? 78 : 92;
  bx = spec.up ? bulkX(spec) : spec.len + 80;
  slot = Math.floor((x0 - 200) / CELL_EVERY);
  if (slot < 0) slot = 0;
  while (slot < 12) {
    fx = cellXForSlot(slot, spec);
    if (fx >= x1 + 40) break;
    if (fx >= x0 && fx < x1 && fx > 240 && fx < bx - 120) {
      h = heights(fx, spec, dense);
      mid = (h.c + h.f) * 0.5;
      y = mid + (hash2(slot * 2.2 + spec.id.charCodeAt(0)) - 0.5) * (h.f - h.c) * 0.32;
      y = clamp(y, h.c + 22, h.f - 22);
      G.ents.push(makeCell(fx, y - 8));
    }
    slot += 1;
  }
  for (x = Math.ceil(x0 / step) * step; x < x1; x += step) {
    if (x < 210 || x > bx - 90) continue;
    r = hash2(x * 0.017 + spec.id.charCodeAt(0) * 1.9 + (dense ? 2.4 : 0));
    h = heights(x, spec, dense);
    mid = (h.c + h.f) * 0.5;
    if (spec.id === 'A') {
      if (r < 0.42 * dens) G.ents.push(makeDrone(x, mid + (hash2(x + 1) - 0.5) * 28));
      else if (r < 0.52 * dens) {
        ceil = hash2(x + 8) > 0.5;
        G.ents.push(makeTurret(x, ceil ? h.c + 6 : h.f - 20, ceil));
      }
    } else if (spec.id === 'B') {
      if (r < 0.34 * dens) G.ents.push(makeDrone(x, mid + (hash2(x) - 0.5) * 24));
      else if (r < 0.58 * dens) {
        ceil = hash2(x + 3) > 0.45;
        G.ents.push(makeTurret(x, ceil ? h.c + 6 : h.f - 20, ceil));
      } else if (r < 0.7 * dens) G.ents.push(makeWasp(x, mid));
      if (hash2(x * 0.11) > 0.72) G.ents.push(makeDrone(x + 22, mid - 20));
    } else if (spec.id === 'C') {
      if (r < 0.4 * dens) G.ents.push(makeWasp(x, mid + (hash2(x) - 0.5) * 20));
      else if (r < 0.62 * dens) G.ents.push(makeDrone(x, mid));
      else if (r < 0.78 * dens) {
        ceil = hash2(x + 2) > 0.5;
        G.ents.push(makeTurret(x, ceil ? h.c + 6 : h.f - 20, ceil));
      }
    } else if (spec.id === 'D') {
      if (r < 0.46 * dens) {
        ceil = hash2(x + 4) > 0.5;
        G.ents.push(makeTurret(x, ceil ? h.c + 5 : h.f - 18, ceil));
      } else if (r < 0.68 * dens) G.ents.push(makeDrone(x, mid));
      else if (r < 0.82 * dens) G.ents.push(makeWasp(x, mid));
    } else if (spec.id === 'E') {
      if (r < 0.4 * dens) G.ents.push(makeOrbiter(x, mid + (hash2(x) - 0.5) * 16));
      else if (r < 0.62 * dens) G.ents.push(makeWasp(x, mid));
      else if (r < 0.8 * dens) {
        ceil = hash2(x + 6) > 0.5;
        G.ents.push(makeTurret(x, ceil ? h.c + 6 : h.f - 20, ceil));
      }
    } else if (spec.id === 'F') {
      if (r < 0.5 * dens) G.ents.push(makeOrbiter(x, mid));
      else if (r < 0.7 * dens) G.ents.push(makeDrone(x, mid + Math.sin(x) * 12));
      else if (r < 0.84 * dens) G.ents.push(makeWasp(x, mid));
    } else {
      if (r < 0.36 * dens) G.ents.push(makeDrone(x, mid + (hash2(x) - 0.5) * 30));
      else if (r < 0.55 * dens) G.ents.push(makeWasp(x, mid));
      else if (r < 0.7 * dens) {
        ceil = hash2(x + 1) > 0.5;
        G.ents.push(makeTurret(x, ceil ? h.c + 8 : h.f - 22, ceil));
      }
    }
    if (dense && hash2(x * 0.19 + 9) > 0.78) {
      G.ents.push(makeDrone(x + 36, mid - 16));
    }
  }
  if (!G.sentPlaced && spec.id !== 'A' && spec.id !== 'Z') {
    x = spec.len * 0.46;
    if (x0 <= x && x1 > x) {
      h = heights(x, spec, dense);
      e = makeSentinel(x, (h.c + h.f) * 0.5);
      G.ents.push(e);
      G.sentPlaced = true;
    }
  }
  if (!G.bulk && spec.up) {
    x = bulkX(spec);
    if (x0 <= x && x1 > x) {
      e = makeBulk(spec);
      G.ents.push(e);
      G.bulk = e;
    }
  }
  if (!G.core && spec.core) {
    x = coreX(spec);
    if (x0 <= x && x1 > x) {
      h = heights(x, spec, dense);
      e = makeCore(x, (h.c + h.f) * 0.5);
      if (dense) {
        e.hp = CORE_HP_D;
        e.maxhp = CORE_HP_D;
      }
      G.ents.push(e);
      G.core = e;
    }
  }
}
function ensureWorld() {
  var spec = currentSpec();
  var target = G.cam + VW + 260;
  var step = 240;
  var i, e;
  if (target > spec.len + 80) target = spec.len + 80;
  while (G.spawnX < target) {
    stampRange(G.spawnX, G.spawnX + step);
    G.spawnX += step;
  }
  for (i = G.ents.length - 1; i >= 0; i--) {
    e = G.ents[i];
    if (e.dead || e.x + (e.w || 40) < G.cam - 90) G.ents.splice(i, 1);
  }
  for (i = G.ebullets.length - 1; i >= 0; i--) {
    if (G.ebullets[i].dead || G.ebullets[i].x < G.cam - 40) G.ebullets.splice(i, 1);
  }
}

function enterSec(id, fromGate) {
  var spec = specOf(id);
  var h;
  G.sec = id;
  G.dir = spec.dir;
  G.cam = 0;
  G.spawnX = 0;
  G.ents = [];
  G.ebullets = [];
  G.shots = [];
  G.core = null;
  G.bulk = null;
  G.sentPlaced = false;
  G.entering = false;
  G.ship.sx = spec.dir > 0 ? 92 : VW - 92;
  h = heights(pwx(), spec, G.dense);
  G.ship.sy = clamp(G.ship.sy, h.c + 24, h.f - 24);
  G.invuln = fromGate ? 0.7 : G.invuln;
  G.muzzle = 0;
  ensureWorld();
  syncHud();
}

function resetRun(dense) {
  G.dense = !!dense;
  G.mode = 'play';
  G.t = 0;
  G.clock = 0;
  G.path = [];
  G.ship = makeSuit();
  G.lives = LIVES;
  G.fuel = FUEL_MAX;
  G.score = 0;
  G.next1up = ONEUP;
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
  G.invuln = 0.4;
  G.winT = 0;
  G.why = '';
  G.warned = false;
  G.holdShot = false;
  particles.length = 0;
  sparks.length = 0;
  floats.length = 0;
  rings.length = 0;
  G.path.push('A');
  enterSec('A', false);
  syncHud();
}

function goTitle() {
  G.mode = 'title';
  G.dense = false;
  G.sec = 'A';
  G.dir = 1;
  G.cam = 60;
  G.spawnX = 0;
  G.ents = [];
  G.ebullets = [];
  G.shots = [];
  G.ship = makeSuit();
  G.ship.sx = 120;
  G.ship.sy = 196;
  G.fuel = FUEL_MAX;
  G.score = 0;
  G.combo = 0;
  G.lives = LIVES;
  G.path = ['A'];
  G.core = null;
  G.bulk = null;
  G.deadT = 0;
  G.winT = 0;
  G.stop = 0;
  ensureWorld();
  syncHud();
  showOverlay('title', 'Z区', '飞行服穿舱。区末两扇闸门选路，有的区会逆飞。能量会耗，撞了掉命。');
}
function startGame(dense) {
  audio.start();
  resetRun(dense);
  hideOverlay();
  toast(dense ? '密火 · 更密更快' : '穿区 · 闸口', dense ? 'warn' : 'gold', 900);
}
function goLose() {
  G.mode = 'lose';
  persistBest();
  syncHud();
  showOverlay('lose', '坠落了', whyText(G.why) + ' · ' + (G.dense ? '密火' : '穿区') + '  ' + G.score + ' 分 · ' + pathText(G.path) + ' · 连击最高 ' + G.maxCombo);
}
function goWin() {
  G.mode = 'win';
  addScore(8000, pwx(), G.ship.sy, true);
  persistBest();
  syncHud();
  audio.win();
  showOverlay('win', '核芯击破', (G.dense ? '密火' : '穿区') + ' 路线 ' + pathText(G.path) + ' · ' + G.score + ' 分 · 连击最高 ' + G.maxCombo);
}
function restart() {
  audio.ensure();
  if (G.mode === 'title') startGame(false);
  else startGame(G.dense);
}

function liveShots() {
  var n = 0;
  var i;
  for (i = 0; i < G.shots.length; i++) if (!G.shots[i].dead) n += 1;
  return n;
}
function spawnShot() {
  var x = pwx() + 14;
  var y = G.ship.sy;
  var vx = SHOT_V;
  G.shots.push(makeShot(x, y, vx));
  G.muzzle = 0.07;
  G.fuel = Math.max(0, G.fuel - SHOT_FUEL);
  audio.shoot(G.dir < 0);
  emit(5, {
    x: x, y: y, j: 2,
    vx0: 80, vx1: 220, vy0: -40, vy1: 40,
    r0: 1, r1: 2.2, life: 0.16, rgb: CYN, g: 0
  });
  screenFlash(CYN, 0.1);
  if (!reduceOn()) G.punch = Math.max(G.punch, 1.012);
  syncFuel();
}
function fireWanted() {
  var max = G.dense ? SHOT_MAX_D : SHOT_MAX;
  if (G.mode !== 'play' || G.deadT > 0) return;
  if (G.shotCd > 0) return;
  if (!(keys.shot || G.holdShot)) return;
  if (liveShots() >= max) return;
  spawnShot();
  G.shotCd = G.dense ? SHOT_CD_D : SHOT_CD;
}

function pingFuelBar() {
  if (!fuelWrap) return;
  fuelWrap.classList.add('ping');
  pingTok += 1;
  (function (tok) {
    setTimeout(function () { if (tok === pingTok) fuelWrap.classList.remove('ping'); }, 380);
  }(pingTok));
}
function collectCell(e) {
  if (e.dead) return;
  e.dead = true;
  G.fuel = Math.min(FUEL_MAX, G.fuel + e.fuel);
  syncFuel();
  audio.cell();
  hitStop(0.055);
  kick(4.2, 'fuel');
  screenFlash(GOLD, 0.36);
  toast('能量 +' + e.fuel, 'fuel', 700);
  pingFuelBar();
  boomAt(e.x + 8, e.y + 8, GOLD, 20, 4);
  floats.push({
    x: e.x + 8, y: e.y, text: '+能量', t: 0, life: 0.72, gold: true, rgb: GOLD, size: 14
  });
  bumpCombo();
  addScore(e.score, e.x + 8, e.y, true);
}

function pickGate(up) {
  var spec = currentSpec();
  var nid = nextOf(spec.id, up);
  var nxt;
  if (!nid || G.entering) return;
  nxt = specOf(nid);
  G.entering = true;
  audio.gate();
  if (nxt.dir < 0) audio.rev();
  hitStop(0.07);
  kick(5.5, 'gate');
  screenFlash(nxt.dir < 0 ? PUR : GOLD, 0.5);
  addScore(200, pwx(), G.ship.sy, true);
  G.path.push(nid);
  toast('转入 ' + nxt.name, nxt.dir < 0 ? 'warn' : 'gold', 1000);
  popRing(pwx(), G.ship.sy, GOLD);
  boomAt(pwx(), G.ship.sy, nxt.dir < 0 ? PUR : CYN, 24, 6);
  enterSec(nid, true);
}

function killEnt(e) {
  var cx, cy, rgb, n;
  if (e.dead) return;
  e.dead = true;
  cx = e.kind === 'core' ? e.x : e.x + (e.w || 16) * 0.5;
  cy = e.kind === 'core' ? e.y : e.y + (e.h || 16) * 0.5;
  rgb = e.kind === 'turret' ? ORG : e.kind === 'sent' ? MAG : e.kind === 'core' ? GOLD : CYN;
  n = e.kind === 'core' ? 48 : e.kind === 'sent' ? 28 : 16;
  audio.boom(e.kind === 'core' || e.kind === 'sent');
  hitStop(e.kind === 'core' ? 0.078 : e.kind === 'sent' ? 0.06 : 0.036);
  kick(e.kind === 'core' ? 8 : e.kind === 'sent' ? 5.5 : 3.4, e.kind === 'core' ? 'boom' : 'hit');
  screenFlash(rgb, e.kind === 'core' ? 0.55 : 0.28);
  boomAt(cx, cy, rgb, n, e.kind === 'core' ? 10 : 5);
  bumpCombo();
  addScore(e.score * comboMul(G.combo), cx, cy, e.kind === 'core' || e.kind === 'sent');
  if (e.kind === 'core') {
    G.winT = 1.22;
    toast('核芯崩解', 'gold', 1000);
  }
}
function hurtEnt(e, hx, hy) {
  if (e.kind === 'cell') {
    collectCell(e);
    return;
  }
  if (e.kind === 'bulk') return;
  e.hp -= 1;
  e.hitT = 0.1;
  audio.hit(G.combo + 1);
  popSpark(hx, hy, CYN, 10);
  emit(8, {
    x: hx, y: hy, j: 3,
    vx0: -90, vx1: 90, vy0: -110, vy1: 60,
    r0: 1, r1: 2.4, life: 0.22, rgb: CYN, g: 40
  });
  hitStop(0.032);
  if (e.hp <= 0) killEnt(e);
}

function crash(why) {
  var i;
  if (G.deadT > 0 || G.mode !== 'play') return;
  G.why = why;
  G.deadT = DIE_T;
  G.lives -= 1;
  G.holdShot = false;
  audio.death();
  hitStop(0.078);
  kick(8, 'die');
  screenFlash(MAG, 0.6);
  boomAt(pwx(), G.ship.sy, MAG, 36, 9);
  emit(16, {
    x: pwx(), y: G.ship.sy, j: 8,
    vx0: -180, vx1: 180, vy0: -240, vy1: 80,
    r0: 2, r1: 5, life: 0.55, rgb: ORG, g: 200
  });
  for (i = 0; i < G.shots.length; i++) G.shots[i].dead = true;
  G.ebullets = [];
  syncPips();
  toast(whyText(why), 'warn', 800);
}
function respawn() {
  var spec = currentSpec();
  var h;
  G.cam = Math.max(0, G.cam - 140);
  G.ship.sx = spec.dir > 0 ? 92 : VW - 92;
  h = heights(pwx(), spec, G.dense);
  G.ship.sy = (h.c + h.f) * 0.5;
  G.fuel = Math.max(G.fuel, 70);
  G.invuln = INVULN;
  G.deadT = 0;
  G.combo = 0;
  G.comboAge = 0;
  G.ebullets = [];
  G.warned = false;
  syncHud();
}

function tickShip(dt) {
  var v, h, pad, ny, aimX, aimY, dx, dy, m, spd, kspd, spec, nx;
  spec = currentSpec();
  kspd = suitSpd(G.dense);
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
    }
  } else {
    v = moveVec(keys.l, keys.r, keys.u, keys.d);
    G.ship.sx += v.x * kspd * dt;
    G.ship.sy += v.y * kspd * dt;
  }
  G.ship.sx = clamp(G.ship.sx, 28, VW - 36);
  h = heights(pwx(), spec, G.dense);
  pad = 12;
  ny = clamp(G.ship.sy, h.c + pad, h.f - pad);
  if (G.invuln > 0) G.ship.sy = ny;
  else G.ship.sy = clamp(G.ship.sy, 14, VH - 14);
  nx = pwx();
  if (G.invuln <= 0) {
    if (terrainHit(nx - 6, G.ship.sy, spec, G.dense) || terrainHit(nx + 8, G.ship.sy, spec, G.dense) ||
        terrainHit(nx, G.ship.sy - 6, spec, G.dense) || terrainHit(nx, G.ship.sy + 6, spec, G.dense)) {
      crash('wall');
      return;
    }
  }
  fireWanted();
  emit(1, {
    x: nx - 12, y: G.ship.sy + rand(-2, 2), j: 1,
    vx0: -80, vx1: -28, vy0: -18, vy1: 18,
    r0: 1, r1: 2.1, life: 0.18, rgb: G.dir < 0 ? PUR : CYN, g: 0
  });
}
function tickFuel(dt) {
  if (G.invuln > 0) return;
  G.fuel -= fuelDrain(G.dense) * dt;
  if (G.fuel < 0) G.fuel = 0;
  syncFuel();
  if (G.fuel <= 0) {
    crash('fuel');
    return;
  }
  if (G.fuel < 26 && !G.warned) {
    G.warned = true;
    audio.warn();
    toast('能量低', 'warn', 800);
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
  var i, s, j, e, hit, spec;
  spec = currentSpec();
  for (i = G.shots.length - 1; i >= 0; i--) {
    s = G.shots[i];
    if (s.dead) {
      G.shots.splice(i, 1);
      continue;
    }
    s.x += s.vx * dt;
    s.life -= dt;
    if (s.life <= 0 || s.x > G.cam + VW + 30 || s.x < G.cam - 30 || s.y < -20 || s.y > VH + 20) {
      G.shots.splice(i, 1);
      continue;
    }
    if (terrainHit(s.x, s.y, spec, G.dense)) {
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
      if (e.dead || e.kind === 'bulk') continue;
      if (circleHits(s.x, s.y, s.r + 1, entBox(e))) {
        hit = true;
        hurtEnt(e, s.x, s.y);
        break;
      }
    }
    if (hit) G.shots.splice(i, 1);
  }
}
function fireAtPlayer(ex, ey, spd, spread) {
  var dx = pwx() - ex;
  var dy = G.ship.sy - ey;
  var m = hypot(dx, dy) || 1;
  var ang, k;
  if (!spread) {
    G.ebullets.push(makeEbullet(ex, ey, dx / m * spd, dy / m * spd));
    return;
  }
  ang = Math.atan2(dy, dx);
  for (k = -spread; k <= spread; k++) {
    G.ebullets.push(makeEbullet(
      ex, ey,
      Math.cos(ang + k * 0.22) * spd,
      Math.sin(ang + k * 0.22) * spd
    ));
  }
}
function tickEnts(dt) {
  var i, e, spec, h, shipX, shipY, on, spd, dense;
  spec = currentSpec();
  dense = G.dense;
  shipX = pwx();
  shipY = G.ship.sy;
  for (i = 0; i < G.ents.length; i++) {
    e = G.ents[i];
    if (e.dead) continue;
    if (e.flash > 0) e.flash -= dt;
    if (e.hitT > 0) e.hitT -= dt;
    on = e.x < G.cam + VW - 12 && e.x > G.cam + 20;
    if (e.kind === 'drone') {
      e.bob += dt * 2.6;
      e.x += e.vx * dt;
      e.y = e.baseY + Math.sin(e.bob) * e.amp;
    } else if (e.kind === 'wasp') {
      e.x += e.vx * (dense ? 1.2 : 1) * dt;
      e.y += clamp(shipY - (e.y + 6), -80, 80) * dt * 0.62;
    } else if (e.kind === 'orbiter') {
      e.ang += e.spin * dt;
      e.x = e.cx + Math.cos(e.ang) * e.rad;
      e.y = e.cy + Math.sin(e.ang) * e.rad * 0.72;
    } else if (e.kind === 'turret') {
      h = heights(e.x + 8, spec, dense);
      e.y = e.ceil ? h.c + 4 : h.f - e.h - 4;
      e.cd -= dt;
      if (e.cd <= 0 && on) {
        e.cd = dense ? rand(0.72, 1.2) : rand(1.05, 1.7);
        e.flash = 0.09;
        spd = dense ? 178 : 142;
        fireAtPlayer(e.x + 9, e.y + 8, spd, 0);
      }
    } else if (e.kind === 'sent') {
      e.bob += dt * 1.6;
      e.x += e.vx * dt;
      e.y = e.baseY + Math.sin(e.bob) * e.amp;
      e.cd -= dt;
      if (e.cd <= 0 && on) {
        e.cd = dense ? rand(0.7, 1.1) : rand(1.0, 1.5);
        e.flash = 0.1;
        fireAtPlayer(e.x + 14, e.y + 12, dense ? 170 : 136, 1);
      }
    } else if (e.kind === 'cell') {
      e.bob += dt * 3;
      e.y += Math.sin(e.bob) * 8 * dt;
    } else if (e.kind === 'core') {
      h = heights(e.x, spec, dense);
      e.y = (h.c + h.f) * 0.5;
      e.ang += dt * 0.9;
      e.open = 0.55 + 0.45 * Math.sin(G.clock * 1.4);
      e.cd -= dt;
      if (e.cd <= 0 && on) {
        e.cd = e.hp < e.maxhp * 0.5 ? (dense ? 0.55 : 0.72) : (dense ? 0.78 : 1.05);
        e.flash = 0.1;
        if (e.hp < e.maxhp * 0.5) fireAtPlayer(e.x, e.y, dense ? 176 : 148, 2);
        else fireAtPlayer(e.x, e.y, dense ? 160 : 132, 1);
      }
    }
  }
}
function tickEbullets(dt) {
  var i, b, spec;
  spec = currentSpec();
  for (i = G.ebullets.length - 1; i >= 0; i--) {
    b = G.ebullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || b.x < G.cam - 24 || b.x > G.cam + VW + 36 || b.y < -16 || b.y > VH + 16 ||
        terrainHit(b.x, b.y, spec, G.dense)) {
      G.ebullets.splice(i, 1);
    }
  }
}
function collidePlay() {
  var box, i, e, b, spec, hs, hole, nx;
  if (G.invuln > 0 || G.deadT > 0) return;
  spec = currentSpec();
  nx = pwx();
  box = { x: nx - 7, y: G.ship.sy - 7, w: 15, h: 14 };
  for (i = 0; i < G.ents.length; i++) {
    e = G.ents[i];
    if (e.dead) continue;
    if (e.kind === 'bulk') {
      if (nx + 6 > e.x && nx - 6 < e.x + e.w) {
        hs = holesOf(spec, e.x);
        hole = holeAt(G.ship.sy, hs);
        if (!hole) {
          crash('bulk');
          return;
        }
        if (nx > e.x + e.w * 0.45) {
          pickGate(hole === 'up');
          return;
        }
      }
      continue;
    }
    if (overlap(box, entBox(e))) {
      if (e.kind === 'cell') {
        collectCell(e);
        continue;
      }
      crash(e.kind === 'core' ? 'core' : 'hit');
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

function update(dt) {
  var spec, near, sp;
  G.t += dt;
  tickFx(dt);
  if (G.mode === 'title') {
    G.cam += 46 * dt;
    if (G.cam > 900) {
      G.cam = 40;
      G.spawnX = 0;
      G.ents = [];
      G.bulk = null;
      G.core = null;
    }
    ensureWorld();
    G.ship.sy = 196 + Math.sin(G.t * 2.1) * 6;
    emit(1, {
      x: pwx() - 12, y: G.ship.sy, j: 1,
      vx0: -70, vx1: -20, vy0: -10, vy1: 10,
      r0: 1, r1: 2, life: 0.2, rgb: CYN, g: 0
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
  spec = currentSpec();
  G.clock += dt;
  near = !!(spec.up && G.cam > bulkX(spec) - VW * 0.62);
  if (G.core && !G.core.dead) near = true;
  sp = scrollSpeed(G.dense, spec, near);
  G.cam += sp * dt;
  if (spec.up && G.cam > bulkX(spec) + 8) G.cam = bulkX(spec) + 8;
  ensureWorld();
  tickShip(dt);
  if (G.deadT > 0 || G.entering) return;
  tickFuel(dt);
  if (G.deadT > 0) return;
  tickShots(dt);
  tickEnts(dt);
  tickEbullets(dt);
  collidePlay();
  ageCombo(dt);
}

function seedStars() {
  var i;
  stars.length = 0;
  for (i = 0; i < 78; i++) {
    stars.push({
      x: hash2(i * 3.1) * VW,
      y: hash2(i * 7.7 + 2) * VH,
      r: 0.7 + hash2(i * 1.4) * 1.6,
      a: 0.22 + hash2(i * 2.2) * 0.55,
      par: 0.12 + hash2(i * 4.8) * 0.5,
      ph: hash2(i * 5.5) * TAU
    });
  }
}

function drawBg() {
  var i, s, tw, gx, x, spec, rgb, k;
  spec = currentSpec();
  rgb = hueRgb(spec.hue);
  ctx.fillStyle = '#031018';
  ctx.fillRect(L.x, L.y, VW * L.s, VH * L.s);
  ctx.fillStyle = rgba(rgb, 0.07);
  ctx.fillRect(L.x, L.y, VW * L.s, VH * L.s);
  for (i = 0; i < stars.length; i++) {
    s = stars[i];
    tw = 0.55 + 0.45 * Math.sin(G.t * 2.2 + s.ph);
    gx = s.x - G.cam * s.par;
    gx = ((gx % VW) + VW) % VW;
    if (G.dir < 0) gx = VW - gx;
    ctx.fillStyle = rgba(WHT, s.a * tw);
    ctx.fillRect(L.x + gx * L.s, L.y + s.y * L.s, s.r * L.s, s.r * L.s);
  }
  k = (G.cam * 0.35) % 48;
  ctx.strokeStyle = rgba(rgb, 0.08);
  ctx.lineWidth = 1;
  for (x = -k; x < VW + 20; x += 48) {
    ctx.beginPath();
    ctx.moveTo(L.x + x * L.s, L.y);
    ctx.lineTo(L.x + x * L.s, L.y + VH * L.s);
    ctx.stroke();
  }
}

function drawTerrain() {
  var spec = currentSpec();
  var rgb = hueRgb(spec.hue);
  var x, h, sx0, sx1, y0, y1, step, rib, lit, wx;
  step = 6;
  ctx.beginPath();
  for (x = 0; x <= VW; x += step) {
    wx = G.dir > 0 ? G.cam + x : G.cam + (VW - x);
    h = heights(wx, spec, G.dense);
    sx0 = L.x + x * L.s;
    if (x === 0) ctx.moveTo(sx0, L.y);
    ctx.lineTo(sx0, toSY(h.c));
  }
  ctx.lineTo(L.x + VW * L.s, L.y);
  ctx.closePath();
  ctx.fillStyle = '#07141e';
  ctx.fill();
  ctx.beginPath();
  for (x = 0; x <= VW; x += step) {
    wx = G.dir > 0 ? G.cam + x : G.cam + (VW - x);
    h = heights(wx, spec, G.dense);
    sx0 = L.x + x * L.s;
    if (x === 0) ctx.moveTo(sx0, L.y + VH * L.s);
    ctx.lineTo(sx0, toSY(h.f));
  }
  ctx.lineTo(L.x + VW * L.s, L.y + VH * L.s);
  ctx.closePath();
  ctx.fillStyle = '#07141e';
  ctx.fill();
  ctx.strokeStyle = rgba(rgb, 0.85);
  ctx.lineWidth = 1.6 * L.s;
  ctx.beginPath();
  for (x = 0; x <= VW; x += step) {
    wx = G.dir > 0 ? G.cam + x : G.cam + (VW - x);
    h = heights(wx, spec, G.dense);
    sx0 = L.x + x * L.s;
    if (x === 0) ctx.moveTo(sx0, toSY(h.c));
    else ctx.lineTo(sx0, toSY(h.c));
  }
  ctx.stroke();
  ctx.beginPath();
  for (x = 0; x <= VW; x += step) {
    wx = G.dir > 0 ? G.cam + x : G.cam + (VW - x);
    h = heights(wx, spec, G.dense);
    sx0 = L.x + x * L.s;
    if (x === 0) ctx.moveTo(sx0, toSY(h.f));
    else ctx.lineTo(sx0, toSY(h.f));
  }
  ctx.stroke();
  rib = spec.id === 'D' ? 18 : 26;
  for (x = -((G.cam | 0) % rib); x < VW + rib; x += rib) {
    wx = G.dir > 0 ? G.cam + x : G.cam + (VW - x);
    h = heights(wx, spec, G.dense);
    sx0 = L.x + x * L.s;
    ctx.strokeStyle = rgba(rgb, 0.22);
    ctx.lineWidth = 2 * L.s;
    ctx.beginPath();
    ctx.moveTo(sx0, L.y);
    ctx.lineTo(sx0, toSY(h.c));
    ctx.moveTo(sx0, toSY(h.f));
    ctx.lineTo(sx0, L.y + VH * L.s);
    ctx.stroke();
    lit = hash2((wx / rib) * 1.7 + spec.id.charCodeAt(0)) > 0.55;
    if (lit) {
      ctx.fillStyle = rgba(hash2(wx) > 0.7 ? GOLD : rgb, 0.45 + 0.25 * Math.sin(G.t * 3 + wx));
      ctx.fillRect(sx0 - 2 * L.s, toSY(h.c) - 7 * L.s, 5 * L.s, 4 * L.s);
      ctx.fillRect(sx0 - 2 * L.s, toSY(h.f) + 3 * L.s, 5 * L.s, 4 * L.s);
    }
  }
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

function drawEnts() {
  var i, e, x, y, w, h, a, rgb, spec, hs, bx, pulse;
  spec = currentSpec();
  rgb = hueRgb(spec.hue);
  for (i = 0; i < G.ents.length; i++) {
    e = G.ents[i];
    if (e.dead) continue;
    if (e.kind === 'bulk') {
      hs = holesOf(spec, e.x);
      bx = boxLeft(e.x, e.w);
      w = e.w * L.s;
      ctx.fillStyle = rgba(rgb, 0.78);
      ctx.fillRect(bx, L.y, w, toSY(hs.upY) - L.y);
      ctx.fillRect(bx, toSY(hs.upY + hs.upH), w, toSY(hs.downY) - toSY(hs.upY + hs.upH));
      ctx.fillRect(bx, toSY(hs.downY + hs.downH), w, L.y + VH * L.s - toSY(hs.downY + hs.downH));
      pulse = 0.45 + 0.35 * Math.sin(G.t * 6);
      ctx.strokeStyle = rgba(GOLD, 0.4 + pulse * 0.5);
      ctx.lineWidth = 2 * L.s;
      ctx.strokeRect(bx + 2 * L.s, toSY(hs.upY), w - 4 * L.s, hs.upH * L.s);
      ctx.strokeStyle = rgba(PUR, 0.4 + pulse * 0.5);
      ctx.strokeRect(bx + 2 * L.s, toSY(hs.downY), w - 4 * L.s, hs.downH * L.s);
      ctx.fillStyle = rgba(GOLD, 0.18 + pulse * 0.12);
      ctx.fillRect(bx, toSY(hs.upY), w, hs.upH * L.s);
      ctx.fillStyle = rgba(PUR, 0.18 + pulse * 0.12);
      ctx.fillRect(bx, toSY(hs.downY), w, hs.downH * L.s);
      ctx.font = 'bold ' + (18 * L.s) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fillText(e.up || 'Z', bx + w * 0.5, toSY(hs.upY + hs.upH * 0.5));
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.fillText(e.down || 'Z', bx + w * 0.5, toSY(hs.downY + hs.downH * 0.5));
      ctx.font = (9 * L.s) + 'px sans-serif';
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.fillText(specOf(e.up).name, bx + w * 0.5, toSY(hs.upY + 10));
      ctx.fillStyle = rgba(PUR, 0.85);
      ctx.fillText(specOf(e.down).name, bx + w * 0.5, toSY(hs.downY + 10));
      continue;
    }
    if (e.kind === 'core') {
      x = toSX(e.x);
      y = toSY(e.y);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(e.ang);
      ctx.strokeStyle = rgba(e.hitT > 0 ? WHT : MAG, 0.9);
      ctx.lineWidth = 3 * L.s;
      ctx.beginPath();
      ctx.arc(0, 0, 30 * L.s, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, 0.55 + 0.25 * e.open);
      ctx.beginPath();
      ctx.arc(0, 0, 22 * L.s, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = rgba(e.flash > 0 ? WHT : MAG, 0.85);
      ctx.beginPath();
      ctx.moveTo(-10 * L.s, -12 * L.s);
      ctx.lineTo(12 * L.s, -12 * L.s);
      ctx.lineTo(-4 * L.s, 0);
      ctx.lineTo(12 * L.s, 12 * L.s);
      ctx.lineTo(-10 * L.s, 12 * L.s);
      ctx.lineTo(2 * L.s, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      continue;
    }
    w = (e.w || 16) * L.s;
    h = (e.h || 14) * L.s;
    if (e.kind === 'orbiter') {
      x = toSX(e.x);
      y = toSY(e.y);
      ctx.strokeStyle = rgba(PUR, 0.25);
      ctx.beginPath();
      ctx.arc(toSX(e.cx), toSY(e.cy), e.rad * L.s, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = rgba(e.hitT > 0 ? WHT : PUR, 0.95);
      ctx.beginPath();
      ctx.arc(x, y, 7 * L.s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.fillRect(x - 2 * L.s, y - 2 * L.s, 4 * L.s, 4 * L.s);
      continue;
    }
    x = boxLeft(e.x, e.w || 16);
    y = toSY(e.y);
    if (e.kind === 'cell') {
      a = 0.7 + 0.3 * Math.sin(G.t * 6 + e.x);
      ctx.fillStyle = rgba(GOLD, a);
      roundRect(x, y, 16 * L.s, 16 * L.s, 4 * L.s);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.fillRect(x + 6.5 * L.s, y + 3 * L.s, 3 * L.s, 10 * L.s);
      ctx.fillRect(x + 3 * L.s, y + 6.5 * L.s, 10 * L.s, 3 * L.s);
      continue;
    }
    if (e.kind === 'turret') {
      ctx.fillStyle = rgba(e.hitT > 0 ? WHT : ORG, 0.95);
      roundRect(x, y, w, h, 3 * L.s);
      ctx.fill();
      ctx.fillStyle = rgba(e.flash > 0 ? WHT : MAG, 0.9);
      ctx.fillRect(x + 5 * L.s, y + (e.ceil ? 10 : 2) * L.s, 8 * L.s, 4 * L.s);
      continue;
    }
    if (e.kind === 'sent') {
      ctx.fillStyle = rgba(e.hitT > 0 ? WHT : MAG, 0.95);
      ctx.beginPath();
      ctx.moveTo(x + w * 0.5, y);
      ctx.lineTo(x + w, y + h * 0.5);
      ctx.lineTo(x + w * 0.5, y + h);
      ctx.lineTo(x, y + h * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(x + w * 0.5, y + h * 0.5, 4 * L.s, 0, TAU);
      ctx.fill();
      continue;
    }
    if (e.kind === 'wasp') {
      ctx.fillStyle = rgba(e.hitT > 0 ? WHT : MAG, 0.95);
      ctx.beginPath();
      ctx.moveTo(x + (G.dir > 0 ? 0 : w), y + h * 0.5);
      ctx.lineTo(x + (G.dir > 0 ? w : 0), y);
      ctx.lineTo(x + (G.dir > 0 ? w : 0), y + h);
      ctx.closePath();
      ctx.fill();
      continue;
    }
    ctx.fillStyle = rgba(e.hitT > 0 ? WHT : CYN, 0.95);
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.5, w * 0.5, h * 0.42, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(TEAL, 0.8);
    ctx.fillRect(x + 4 * L.s, y + 5 * L.s, w - 8 * L.s, 3 * L.s);
  }
}

function drawProjectiles() {
  var i, s, b, x, y;
  for (i = 0; i < G.shots.length; i++) {
    s = G.shots[i];
    x = toSX(s.x);
    y = toSY(s.y);
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.fillRect(x - 5 * L.s, y - 1.4 * L.s, 10 * L.s, 2.8 * L.s);
    ctx.fillStyle = rgba(CYN, 0.85);
    ctx.fillRect(x - 8 * L.s, y - 2.2 * L.s, 7 * L.s, 4.4 * L.s);
  }
  for (i = 0; i < G.ebullets.length; i++) {
    b = G.ebullets[i];
    x = toSX(b.x);
    y = toSY(b.y);
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.arc(x, y, b.r * L.s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.7);
    ctx.beginPath();
    ctx.arc(x, y, b.r * 0.4 * L.s, 0, TAU);
    ctx.fill();
  }
}

function drawShip() {
  var x, y, blink, s;
  if (G.mode === 'play' && G.deadT > 0) return;
  blink = G.invuln > 0 && ((G.invuln * 12) | 0) % 2 === 0;
  if (blink) return;
  x = L.x + G.ship.sx * L.s;
  y = toSY(G.ship.sy);
  s = L.s;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(G.dir, 1);
  if (G.muzzle > 0) {
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.fillRect(14 * s, -1.6 * s, 12 * s, 3.2 * s);
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.fillRect(14 * s, -3 * s, 6 * s, 6 * s);
  }
  ctx.fillStyle = rgba(CYN, 0.55);
  ctx.beginPath();
  ctx.moveTo(-14 * s, -2 * s);
  ctx.lineTo(-22 * s, -6 * s);
  ctx.lineTo(-18 * s, 0);
  ctx.lineTo(-22 * s, 6 * s);
  ctx.lineTo(-14 * s, 2 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = rgba(HOT, 0.95);
  roundRect(-12 * s, -8 * s, 10 * s, 16 * s, 3 * s);
  ctx.fill();
  ctx.fillStyle = rgba(WHT, 0.96);
  ctx.beginPath();
  ctx.arc(2 * s, 0, 7.2 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(CYN, 0.95);
  roundRect(-2 * s, -3.2 * s, 10 * s, 6.4 * s, 2 * s);
  ctx.fill();
  ctx.fillStyle = rgba(WHT, 0.5);
  ctx.fillRect(1 * s, -2.2 * s, 5 * s, 1.6 * s);
  ctx.fillStyle = rgba(TEAL, 0.9);
  ctx.fillRect(8 * s, -2 * s, 10 * s, 4 * s);
  ctx.fillStyle = rgba(GOLD, 0.9);
  ctx.fillRect(16 * s, -1.2 * s, 6 * s, 2.4 * s);
  ctx.fillStyle = rgba(WHT, 0.85);
  ctx.fillRect(-4 * s, 7 * s, 4 * s, 5 * s);
  ctx.fillRect(-4 * s, -12 * s, 4 * s, 5 * s);
  ctx.restore();
}

function drawParticles() {
  var i, o, a, x, y;
  for (i = 0; i < particles.length; i++) {
    o = particles[i];
    a = clamp(o.life / o.max, 0, 1);
    x = toSX(o.x);
    y = toSY(o.y);
    ctx.fillStyle = rgba(o.rgb, a);
    ctx.fillRect(x - o.r * L.s * 0.5, y - o.r * L.s * 0.5, o.r * L.s, o.r * L.s);
  }
  for (i = 0; i < sparks.length; i++) {
    o = sparks[i];
    a = 1 - o.t / 0.28;
    x = toSX(o.x);
    y = toSY(o.y);
    ctx.strokeStyle = rgba(o.rgb, 0.75 * a);
    ctx.lineWidth = 1.4 * L.s;
    ctx.beginPath();
    ctx.arc(x, y, o.rad * (0.4 + o.t * 3) * L.s, 0, TAU);
    ctx.stroke();
  }
  for (i = 0; i < rings.length; i++) {
    o = rings[i];
    a = 1 - o.t / 0.34;
    x = toSX(o.x);
    y = toSY(o.y);
    ctx.strokeStyle = rgba(o.rgb, 0.7 * a);
    ctx.lineWidth = 2 * L.s;
    ctx.beginPath();
    ctx.arc(x, y, o.r * L.s, 0, TAU);
    ctx.stroke();
  }
}
function drawFloats() {
  var i, o, a;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (i = 0; i < floats.length; i++) {
    o = floats[i];
    a = 1 - o.t / o.life;
    ctx.font = 'bold ' + (o.size * L.s) + 'px sans-serif';
    ctx.fillStyle = rgba(o.rgb, a);
    ctx.fillText(o.text, toSX(o.x), toSY(o.y));
  }
}
function drawFlash() {
  if (G.flash <= 0) return;
  ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
  ctx.fillRect(L.x, L.y, VW * L.s, VH * L.s);
}
function drawLowFuel() {
  var a;
  if (G.mode !== 'play' || G.fuel >= 26) return;
  a = (0.08 + 0.08 * (0.5 + 0.5 * Math.sin(G.t * 8))) * (1 - G.fuel / 26);
  ctx.fillStyle = rgba(MAG, a);
  ctx.fillRect(L.x, L.y, VW * L.s, VH * L.s);
}

function drawMinimap() {
  var ox, oy, mw, mh, i, id, p, q, vis, cur, x, y;
  if (G.mode === 'title') return;
  mw = 108;
  mh = 86;
  ox = L.x + 10 * L.s;
  oy = L.y + 10 * L.s;
  ctx.fillStyle = 'rgba(4,16,24,0.55)';
  roundRect(ox, oy, mw * L.s, mh * L.s, 8 * L.s);
  ctx.fill();
  ctx.strokeStyle = rgba(CYN, 0.28);
  ctx.lineWidth = 1;
  ctx.stroke();
  vis = {};
  for (i = 0; i < G.path.length; i++) vis[G.path[i]] = 1;
  cur = G.sec;
  ctx.lineWidth = 1.4 * L.s;
  for (i = 0; i < MAP_EDGES.length; i++) {
    p = MAP_POS[MAP_EDGES[i][0]];
    q = MAP_POS[MAP_EDGES[i][1]];
    ctx.strokeStyle = vis[MAP_EDGES[i][0]] && vis[MAP_EDGES[i][1]] ? rgba(GOLD, 0.8) : rgba(CYN, 0.25);
    ctx.beginPath();
    ctx.moveTo(ox + p[0] * mw * L.s, oy + p[1] * mh * L.s);
    ctx.lineTo(ox + q[0] * mw * L.s, oy + q[1] * mh * L.s);
    ctx.stroke();
  }
  ctx.font = 'bold ' + (8 * L.s) + 'px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (id in MAP_POS) {
    if (!MAP_POS.hasOwnProperty(id)) continue;
    p = MAP_POS[id];
    x = ox + p[0] * mw * L.s;
    y = oy + p[1] * mh * L.s;
    ctx.beginPath();
    ctx.arc(x, y, (id === cur ? 7 : 5) * L.s, 0, TAU);
    if (id === cur) ctx.fillStyle = rgba(GOLD, 0.95);
    else if (vis[id]) ctx.fillStyle = rgba(CYN, 0.85);
    else ctx.fillStyle = rgba(WHT, 0.25);
    ctx.fill();
    ctx.fillStyle = id === cur ? '#041018' : '#e8f6ff';
    ctx.fillText(id, x, y);
  }
}

function draw() {
  var shx, shy, cx, cy;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#041018';
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
  drawMinimap();
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
  var moveKey = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' ||
    k === 'w' || k === 'a' || k === 's' || k === 'd' ||
    k === 'W' || k === 'A' || k === 'S' || k === 'D';
  var space = k === ' ' || k === 'Spacebar' || code === 'Space';
  if (moveKey || space || k === 'r' || k === 'R' || k === 'm' || k === 'M' ||
      k === '1' || k === '2' || k === 'Enter') {
    e.preventDefault();
  }
  if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.l = down;
  if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.r = down;
  if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.u = down;
  if (k === 'ArrowDown' || k === 's' || k === 'S') keys.d = down;
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
  if (space || k === 'Enter') {
    audio.ensure();
    if (overlayOpen()) {
      if (G.mode === 'title') startGame(false);
      else if (G.mode === 'lose' || G.mode === 'win') startGame(G.dense);
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

if (btnRaid) {
  btnRaid.addEventListener('click', function () {
    audio.ensure();
    startGame(false);
  });
}
if (btnDense) {
  btnDense.addEventListener('click', function () {
    audio.ensure();
    startGame(true);
  });
}
if (ovRetry) {
  ovRetry.addEventListener('click', function () {
    audio.ensure();
    startGame(G.dense);
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

window.addEventListener('keydown', function (e) { onKey(e, true); });
window.addEventListener('keyup', function (e) { onKey(e, false); });
window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', function () {
  hidden = document.hidden;
});
requestAnimationFrame(frame);

}
