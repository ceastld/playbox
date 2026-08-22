'use strict';

/* 刚果 — Congo Bongo remake. Isometric hop. No CDN. */

var LIVES = 3;
var HW = 30;
var HH = 17;
var FACE = 13;
var OX = 300;
var OY = 36;
var WORLD_W = 600;
var WORLD_H = 400;
var NE = 0;
var SE = 1;
var SW = 2;
var NW = 3;
var PLAYER_HOP = 0.148;
var HOP_SCORE = 10;
var NEAR_SCORE = 30;
var GOAL_SCORE = 500;
var STAGE_BONUS = 700;
var ROUND_STEP = 200;
var COMBO_AGE = 1.58;
var INVULN = 0.88;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var SWIPE_MIN = 24;
var BEST_KEY = 'playbox-congo-bongo-best';
var MUTE_KEY = 'playbox-congo-bongo-mute';

var DIRS = [
  { dr: -1, dc: 0 },
  { dr: 0, dc: 1 },
  { dr: 1, dc: 0 },
  { dr: 0, dc: -1 }
];

var KEY_DIR = {
  ArrowUp: NE, KeyW: NE,
  ArrowRight: SE, KeyD: SE, KeyE: SE,
  ArrowDown: SW, KeyS: SW,
  ArrowLeft: NW, KeyA: NW, KeyQ: NW
};

var MAP1 = [
  '..GG...',
  '.####..',
  '.#####.',
  '######.',
  'W#####.',
  'W####..',
  'WW###..',
  '.W#S#..'
];

var MAP2 = [
  '..GG...',
  '.####..',
  '######.',
  '######.',
  '.####..',
  '.WWWWW.',
  '.WWWWW.',
  '.####..',
  '..S#...'
];

var LIME = [61, 255, 136];
var CYAN = [0, 240, 255];
var GOLD = [255, 227, 107];
var MAG = [255, 61, 184];
var HOT = [255, 138, 40];
var COCO = [196, 108, 42];
var COCO2 = [255, 188, 96];
var KHAKI = [214, 176, 82];
var APE = [122, 72, 36];

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
function mixRgb(a, b, t) {
  return [
    (a[0] + (b[0] - a[0]) * t) | 0,
    (a[1] + (b[1] - a[1]) * t) | 0,
    (a[2] + (b[2] - a[2]) * t) | 0
  ];
}
function easeOut(t) {
  return 1 - (1 - t) * (1 - t);
}
function ch(map, r, c) {
  if (r < 0 || c < 0 || r >= map.length || c >= map[r].length) return '.';
  return map[r][c];
}
function isLandCh(k) {
  return k === '#' || k === 'G' || k === 'S';
}
function isWaterCh(k) {
  return k === 'W';
}
function isGoalCh(k) {
  return k === 'G';
}
function findStart(map) {
  var r, c;
  for (r = 0; r < map.length; r++) {
    for (c = 0; c < map[r].length; c++) {
      if (map[r][c] === 'S') return { r: r, c: c };
    }
  }
  return { r: map.length - 1, c: 0 };
}
function findGoals(map) {
  var out = [];
  var r, c;
  for (r = 0; r < map.length; r++) {
    for (c = 0; c < map[r].length; c++) {
      if (map[r][c] === 'G') out.push({ r: r, c: c });
    }
  }
  return out;
}
function landCells(map) {
  var out = [];
  var r, c, k;
  for (r = 0; r < map.length; r++) {
    for (c = 0; c < map[r].length; c++) {
      k = map[r][c];
      if (isLandCh(k)) out.push({ r: r, c: c });
    }
  }
  return out;
}
function waterSpan(map, row) {
  var c, min = 99, max = -1;
  for (c = 0; c < map[row].length; c++) {
    if (map[row][c] === 'W') {
      if (c < min) min = c;
      if (c > max) max = c;
    }
  }
  return min <= max ? { min: min, max: max } : null;
}
function hopDest(map, r, c, dir) {
  var d = DIRS[dir];
  var nr = r + d.dr;
  var nc = c + d.dc;
  var k = ch(map, nr, nc);
  if (isLandCh(k)) return { kind: 'land', r: nr, c: nc, goal: k === 'G' };
  if (isWaterCh(k)) return { kind: 'water', r: nr, c: nc };
  return { kind: 'fall', r: nr, c: nc };
}
function peakXY(c, r) {
  return { x: OX + (c - r) * HW, y: OY + (c + r) * HH };
}
function standXY(c, r) {
  var p = peakXY(c, r);
  return { x: p.x, y: p.y + HH * 0.92 };
}
function inDiamond(px, py, peakX, peakY) {
  var dx = Math.abs(px - peakX) / HW;
  var dy = Math.abs(py - (peakY + HH)) / HH;
  return dx + dy <= 1.06;
}
function swipeDir(dx, dy) {
  var dc, dr;
  if (dx * dx + dy * dy < SWIPE_MIN * SWIPE_MIN) return -1;
  dc = dx / HW + dy / HH;
  dr = dy / HH - dx / HW;
  if (Math.abs(dc) > Math.abs(dr)) return dc > 0 ? SE : NW;
  return dr > 0 ? SW : NE;
}
function dirBetween(map, r0, c0, r1, c1) {
  var i, d;
  for (i = 0; i < 4; i++) {
    d = hopDest(map, r0, c0, i);
    if (d.r === r1 && d.c === c1) return i;
  }
  return -1;
}
function manh(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}
function distToGoals(r, c, goals) {
  var i, d, best = 99;
  for (i = 0; i < goals.length; i++) {
    d = Math.abs(r - goals[i].r) + Math.abs(c - goals[i].c);
    if (d < best) best = d;
  }
  return best;
}
function mapBounds(map) {
  var r, c, x, y, minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (r = 0; r < map.length; r++) {
    for (c = 0; c < map[r].length; c++) {
      if (map[r][c] === '.') continue;
      x = (c - r) * HW;
      y = (c + r) * HH;
      if (x - HW < minX) minX = x - HW;
      if (x + HW > maxX) maxX = x + HW;
      if (y < minY) minY = y;
      if (y + HH * 2 + FACE > maxY) maxY = y + HH * 2 + FACE;
    }
  }
  return { minX: minX, maxX: maxX, minY: minY, maxY: maxY };
}
function originFor(map) {
  var b = mapBounds(map);
  return {
    ox: WORLD_W / 2 - (b.minX + b.maxX) / 2,
    oy: 22 + Math.max(8, (WORLD_H - 36 - (b.maxY - b.minY)) * 0.28) - b.minY
  };
}
function cocoDirs(map, r, c) {
  var opts = [];
  var se = hopDest(map, r, c, SE);
  var sw = hopDest(map, r, c, SW);
  if (se.kind === 'land') opts.push(SE);
  if (sw.kind === 'land') opts.push(SW);
  if (opts.length === 0) {
    if (se.kind === 'water' || se.kind === 'fall') opts.push(SE);
    if (sw.kind === 'water' || sw.kind === 'fall') opts.push(SW);
  }
  if (opts.length === 0) {
    if (hopDest(map, r, c, NE).kind === 'land') opts.push(NE);
    if (hopDest(map, r, c, NW).kind === 'land') opts.push(NW);
  }
  return opts;
}
function speedMul(round, rush) {
  var m = 1 + Math.max(0, round - 1) * 0.11;
  if (rush) m *= 1.42;
  return m;
}
function playerHopTime() {
  return PLAYER_HOP;
}
function cocoHopTime(round, rush) {
  var t = 0.36 - Math.min(6, round - 1) * 0.018;
  if (rush) t *= 0.68;
  return t < 0.16 ? 0.16 : t;
}
function cocoWait(round, rush) {
  var t = 0.07 - Math.min(5, round - 1) * 0.006;
  if (rush) t *= 0.55;
  return t < 0.016 ? 0.016 : t;
}
function throwInterval(round, rush) {
  var t = rush ? 0.92 : 1.42;
  t /= 1 + Math.max(0, round - 1) * 0.12;
  return t < (rush ? 0.48 : 0.82) ? (rush ? 0.48 : 0.82) : t;
}
function maxCocos(round, rush) {
  if (rush) return Math.min(7, 5 + ((round / 2) | 0));
  return Math.min(5, 3 + (((round - 1) / 2) | 0));
}
function snakeHopTime(round, rush) {
  var t = 0.42 - Math.min(5, round - 1) * 0.02;
  if (rush) t *= 0.7;
  return t < 0.2 ? 0.2 : t;
}
function rhinoSpeed(round, rush) {
  var s = 1.55 + Math.min(6, round - 1) * 0.12;
  if (rush) s *= 1.38;
  return s;
}
function lilySpeed(round, rush) {
  var s = 0.85 + Math.min(5, round - 1) * 0.08;
  if (rush) s *= 1.32;
  return s;
}
function canReachGoal(map, allowWater) {
  var start = findStart(map);
  var goals = findGoals(map);
  var q = [{ r: start.r, c: start.c }];
  var seen = {};
  var head = 0;
  var cur, i, d, key, g;
  seen[start.r + ',' + start.c] = 1;
  while (head < q.length) {
    cur = q[head++];
    for (g = 0; g < goals.length; g++) {
      if (cur.r === goals[g].r && cur.c === goals[g].c) return true;
    }
    for (i = 0; i < 4; i++) {
      d = hopDest(map, cur.r, cur.c, i);
      if (d.kind === 'land' || (allowWater && d.kind === 'water')) {
        key = d.r + ',' + d.c;
        if (seen[key]) continue;
        seen[key] = 1;
        q.push({ r: d.r, c: d.c });
      }
    }
  }
  return false;
}

function makeHopper(kind, r, c) {
  return {
    kind: kind,
    r: r,
    c: c,
    fr: r,
    fc: c,
    hopT: 1,
    hopDur: PLAYER_HOP,
    wait: 0,
    dir: NE,
    destKind: 'land',
    squash: 1,
    state: 'idle',
    inv: 0,
    dead: false,
    spin: 0,
    fallY: 0,
    fallV: 0,
    fallX: 0,
    face: 1,
    ride: -1,
    left: { r: r, c: c, t: 9 }
  };
}

function selfCheck() {
  var s, g, d, o, b, dirs, i, m;

  if (MAP1.length !== 8 || MAP1[0].length !== 7) throw new Error('map1 size');
  if (MAP2.length !== 9 || MAP2[0].length !== 7) throw new Error('map2 size');
  for (i = 0; i < MAP1.length; i++) {
    if (MAP1[i].length !== 7) throw new Error('map1 row ' + i);
  }
  for (i = 0; i < MAP2.length; i++) {
    if (MAP2[i].length !== 7) throw new Error('map2 row ' + i);
  }

  s = findStart(MAP1);
  if (s.r !== 7 || s.c !== 3) throw new Error('start1 ' + s.r + ',' + s.c);
  s = findStart(MAP2);
  if (s.r !== 8 || s.c !== 2) throw new Error('start2');
  g = findGoals(MAP1);
  if (g.length !== 2 || g[0].r !== 0) throw new Error('goals1');
  g = findGoals(MAP2);
  if (g.length !== 2) throw new Error('goals2');

  d = hopDest(MAP1, 7, 3, NE);
  if (d.kind !== 'land' || d.r !== 6 || d.c !== 3) throw new Error('start NE');
  d = hopDest(MAP1, 7, 3, SW);
  if (d.kind !== 'fall') throw new Error('start SW fall');
  d = hopDest(MAP1, 7, 2, NW);
  if (d.kind !== 'water') throw new Error('water hop');
  d = hopDest(MAP1, 1, 2, NE);
  if (d.kind !== 'land' || !d.goal) throw new Error('to goal');
  d = hopDest(MAP1, 0, 2, NE);
  if (d.kind !== 'fall') throw new Error('goal NE fall');

  d = hopDest(MAP2, 7, 2, NE);
  if (d.kind !== 'water') throw new Error('safari water');
  d = hopDest(MAP2, 8, 2, NE);
  if (d.kind !== 'land') throw new Error('safari up');

  if (distToGoals(7, 3, findGoals(MAP1)) !== 7) throw new Error('dist 7');
  if (distToGoals(0, 2, findGoals(MAP1)) !== 0) throw new Error('dist 0');

  dirs = cocoDirs(MAP1, 0, 2);
  if (dirs.indexOf(SW) < 0 && dirs.indexOf(SE) < 0) throw new Error('coco down');

  o = originFor(MAP1);
  if (!(o.ox > 100 && o.ox < 500)) throw new Error('origin x');
  OX = o.ox;
  OY = o.oy;
  b = peakXY(3, 7);
  if (!inDiamond(b.x, b.y + HH, b.x, b.y)) throw new Error('diamond in');
  if (inDiamond(b.x + HW * 2.4, b.y, b.x, b.y)) throw new Error('diamond out');

  if (swipeDir(40, 40) !== SE) throw new Error('swipe SE');
  if (swipeDir(-40, 40) !== SW) throw new Error('swipe SW');
  if (swipeDir(40, -40) !== NE) throw new Error('swipe NE');
  if (swipeDir(-40, -40) !== NW) throw new Error('swipe NW');
  if (swipeDir(2, 2) !== -1) throw new Error('swipe dead');

  if (dirBetween(MAP1, 7, 3, 6, 3) !== NE) throw new Error('dir NE');
  if (dirBetween(MAP1, 7, 3, 7, 4) !== SE) throw new Error('dir SE');

  if (cocoHopTime(1, true) >= cocoHopTime(1, false)) throw new Error('rush coco hop');
  if (throwInterval(1, true) >= throwInterval(1, false)) throw new Error('rush throw');
  if (maxCocos(1, true) <= maxCocos(1, false)) throw new Error('rush more coco');
  if (rhinoSpeed(1, true) <= rhinoSpeed(1, false)) throw new Error('rush rhino');
  if (lilySpeed(1, true) <= lilySpeed(1, false)) throw new Error('rush lily');
  if (snakeHopTime(1, true) >= snakeHopTime(1, false)) throw new Error('rush snake');
  if (cocoHopTime(4, false) >= cocoHopTime(1, false)) throw new Error('round coco');
  if (playerHopTime() >= cocoHopTime(1, false)) throw new Error('player faster coco');
  if (speedMul(2, true) <= speedMul(2, false)) throw new Error('mul');

  m = waterSpan(MAP2, 5);
  if (!m || m.min !== 1 || m.max !== 5) throw new Error('water span');
  if (landCells(MAP1).length < 20) throw new Error('land count');

  if (KEY_DIR.KeyW !== NE || KEY_DIR.KeyD !== SE || KEY_DIR.KeyS !== SW || KEY_DIR.KeyA !== NW) {
    throw new Error('WASD');
  }
  if (KEY_DIR.ArrowUp !== NE || KEY_DIR.ArrowLeft !== NW) throw new Error('arrows');

  if (!canReachGoal(MAP1, false)) throw new Error('slope path');
  if (canReachGoal(MAP2, false)) throw new Error('safari needs water');
  if (!canReachGoal(MAP2, true)) throw new Error('safari path');
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
var btnSlope = document.getElementById('btn-slope');
var btnRush = document.getElementById('btn-rush');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnNw = document.getElementById('btn-nw');
var btnNe = document.getElementById('btn-ne');
var btnSw = document.getElementById('btn-sw');
var btnSe = document.getElementById('btn-se');
var scoreEl = document.getElementById('score');
var roundEl = document.getElementById('round');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var sceneLabel = document.getElementById('scene-label');
var climbBar = document.getElementById('climb-bar');
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
var leaves = [];

var ptr = { on: false, x: 0, y: 0, id: -1, wx: 0, wy: 0 };

var G = {
  mode: 'title',
  kind: 'slope',
  rush: false,
  clock: 0,
  round: 1,
  stage: 1,
  lives: LIVES,
  score: 0,
  bestS: 0,
  bestR: 0,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  map: MAP1,
  goals: findGoals(MAP1),
  start: findStart(MAP1),
  maxDist: 8,
  player: makeHopper('player', 7, 3),
  gorilla: { r: 0, c: 2, squash: 1, throwT: 1, arm: 0, gone: false, hopT: 1, x: 0, y: 0 },
  cocos: [],
  snakes: [],
  rhinos: [],
  lilies: [],
  monkeys: [],
  pops: {},
  pending: -1,
  throwCd: 1.2,
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flashA: 0,
  flashRgb: LIME,
  lock: 0,
  why: '',
  trans: 0,
  transKind: '',
  waterT: 0
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
  rumble: null,
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
  hop: function (combo) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.05;
    this.beep(290 * p, 0.055, 'square', 0.055, 540 * p);
    this.noise(0.03, 0.035, 1600, 'highpass');
  },
  land: function () {
    this.ensure();
    this.noise(0.05, 0.055, 320, 'bandpass');
    this.beep(140, 0.04, 'sine', 0.028, 70);
  },
  smash: function () {
    this.ensure();
    this.noise(0.14, 0.16, 180, 'lowpass');
    this.noise(0.07, 0.09, 900, 'bandpass');
    this.beep(210, 0.12, 'sawtooth', 0.07, 55);
  },
  splash: function () {
    this.ensure();
    this.noise(0.16, 0.12, 700, 'bandpass');
    this.beep(420, 0.1, 'sine', 0.04, 90);
  },
  die: function () {
    this.ensure();
    this.noise(0.18, 0.12, 240, 'lowpass');
    this.beep(300, 0.22, 'sawtooth', 0.06, 70);
    this.beep(150, 0.2, 'square', 0.04, 48);
  },
  near: function () {
    this.ensure();
    this.beep(880, 0.06, 'square', 0.045, 1320);
    this.beep(1320, 0.08, 'triangle', 0.03, 1760);
  },
  goal: function () {
    this.ensure();
    this.beep(392, 0.1, 'square', 0.055, 523);
    this.beep(523, 0.12, 'square', 0.05, 659);
    this.beep(784, 0.22, 'triangle', 0.055, 1046);
  },
  throw: function () {
    this.ensure();
    this.beep(180, 0.07, 'square', 0.04, 90);
    this.noise(0.05, 0.05, 400, 'lowpass');
  },
  rhino: function () {
    this.ensure();
    this.beep(70, 0.16, 'sawtooth', 0.04, 48);
    this.noise(0.1, 0.06, 120, 'lowpass');
  },
  snake: function () {
    this.ensure();
    this.noise(0.08, 0.05, 1400, 'bandpass');
    this.beep(240, 0.05, 'square', 0.02, 160);
  },
  over: function () {
    this.ensure();
    this.beep(196, 0.2, 'sawtooth', 0.05, 90);
    this.beep(110, 0.3, 'square', 0.04, 50);
  },
  combo: function (n) {
    this.ensure();
    this.beep(440 + n * 48, 0.08, 'square', 0.05, 880 + n * 40);
  },
  start: function () {
    this.ensure();
    this.beep(330, 0.08, 'square', 0.045, 440);
    this.beep(523, 0.12, 'triangle', 0.04, 659);
  },
  ui: function () {
    this.ensure();
    this.beep(640, 0.045, 'square', 0.03, 420);
  }
};

try {
  if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
} catch (err) { /* ignore */ }

function loadBest() {
  try {
    var s = localStorage.getItem(BEST_KEY);
    var o = JSON.parse(s);
    if (o && typeof o === 'object') {
      G.bestS = (o.s | 0) || (o.c | 0);
      G.bestR = (o.r | 0) || (o.e | 0);
      return;
    }
    if (typeof o === 'number') {
      G.bestS = o | 0;
      G.bestR = o | 0;
    }
  } catch (err) { /* ignore */ }
}

function persistBest() {
  var cur = G.rush ? G.bestR : G.bestS;
  if (G.score > cur) {
    if (G.rush) G.bestR = G.score;
    else G.bestS = G.score;
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ s: G.bestS, r: G.bestR }));
  } catch (err) { /* ignore */ }
}

function currentBest() {
  return G.rush ? G.bestR : G.bestS;
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
  G.kickX = (Math.random() < 0.5 ? -1 : 1) * n * 0.35;
  G.kickY = n * 0.55;
  stageEl.classList.remove('hop');
  void stageEl.offsetWidth;
  stageEl.classList.add('hop');
  clearTimeout(kickTok);
  kickTok = setTimeout(function () { stageEl.classList.remove('hop'); }, 180);
}

function dieShake() {
  if (reduceMotion()) return;
  stageEl.classList.remove('die');
  void stageEl.offsetWidth;
  stageEl.classList.add('die');
}

function splatKick() {
  if (reduceMotion()) return;
  stageEl.classList.remove('splat');
  void stageEl.offsetWidth;
  stageEl.classList.add('splat');
}

function screenFlash(rgb, a) {
  G.flashRgb = rgb;
  G.flashA = Math.max(G.flashA, a || 0.35);
}

function capArr(arr, n) {
  if (arr.length > n) arr.splice(0, arr.length - n);
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
      r: rand(1.2, 2.8),
      rgb: rgb,
      g: grav == null ? 22 : grav
    });
  }
  capArr(particles, 240);
}

function spark(x, y, rgb, n) {
  var i, a;
  for (i = 0; i < n; i++) {
    a = rand(0, TAU);
    sparks.push({
      x: x, y: y,
      vx: Math.cos(a) * rand(40, 140),
      vy: Math.sin(a) * rand(40, 140),
      t: rand(0.12, 0.28),
      max: 0.28,
      rgb: rgb
    });
  }
  capArr(sparks, 130);
}

function ringAt(x, y, rgb) {
  rings.push({ x: x, y: y, t: 0, max: 0.34, rgb: rgb });
  capArr(rings, 18);
}

function floatText(x, y, text, rgb) {
  floats.push({ x: x, y: y, text: text, t: 0.72, rgb: rgb || GOLD });
  capArr(floats, 16);
}

function shardBurst(x, y, rgb) {
  var i;
  for (i = 0; i < 12; i++) {
    shards.push({
      x: x, y: y,
      vx: rand(-1, 1) * 110,
      vy: rand(-1.3, -0.05) * 130,
      rot: rand(0, TAU),
      vr: rand(-10, 10),
      t: rand(0.35, 0.62),
      rgb: rgb,
      s: rand(3, 8)
    });
  }
  capArr(shards, 48);
}

function spawnLeaf() {
  leaves.push({
    x: rand(20, WORLD_W - 20),
    y: -8,
    vx: rand(-18, 18),
    vy: rand(22, 48),
    rot: rand(0, TAU),
    vr: rand(-2, 2),
    t: 6,
    rgb: Math.random() < 0.5 ? LIME : GOLD,
    s: rand(2.2, 4.2)
  });
  capArr(leaves, 28);
}

function resetFx() {
  particles.length = 0;
  sparks.length = 0;
  floats.length = 0;
  rings.length = 0;
  shards.length = 0;
  G.stop = 0;
  G.shake = 0;
  G.kickX = 0;
  G.kickY = 0;
  G.flashA = 0;
}

function toast(msg, warn, gold) {
  toastEl.textContent = msg;
  toastEl.classList.toggle('warn', !!warn);
  toastEl.classList.toggle('gold', !!gold);
  toastEl.classList.remove('hidden');
  clearTimeout(toastTok);
  toastTok = setTimeout(function () { toastEl.classList.add('hidden'); }, 1100);
}

function flashScore(n) {
  scoreEl.textContent = String(G.score);
  scoreBox.classList.remove('flash');
  void scoreBox.offsetWidth;
  scoreBox.classList.add('flash');
  scoreAdd.hidden = false;
  scoreAdd.textContent = '+' + n;
  clearTimeout(addTok);
  addTok = setTimeout(function () { scoreAdd.hidden = true; }, 680);
}

function syncCombo() {
  comboEl.textContent = '×' + Math.max(1, G.combo);
  comboBox.classList.toggle('hot', G.combo >= 2);
  if (G.combo >= 2) {
    comboBox.classList.remove('flash');
    void comboBox.offsetWidth;
    comboBox.classList.add('flash');
  }
}

function climbProgress() {
  var cell = playerCell();
  var d = distToGoals(cell.r, cell.c, G.goals);
  var p = 1 - d / Math.max(1, G.maxDist);
  return clamp(p, 0, 1);
}

function syncClimb() {
  var p = climbProgress();
  climbBar.style.transform = 'scaleX(' + p + ')';
  climbBar.classList.toggle('on', p >= 0.98);
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
  syncClimb();
  modeLabel.textContent = G.rush ? '暴走' : '斜坡';
  modeLabel.classList.toggle('rush', G.rush);
  sceneLabel.textContent = G.stage === 2 ? '草原' : '密林';
  if (G.mode === 'play') {
    hintEl.textContent = G.stage === 2
      ? '踩荷叶过河 · 犀牛会冲 · 蛇会爬 · 追上猩猩'
      : '一次跳一格 · 椰子往下砸 · 落水即死 · 追上猩猩';
  }
}

function addScore(n, x, y, label) {
  if (n <= 0) return;
  G.score += n;
  persistBest();
  bestEl.textContent = String(currentBest());
  flashScore(n);
  if (x != null) floatText(x, y - 18, label || ('+' + n), LIME);
}

function bumpCombo() {
  G.combo += 1;
  G.comboAge = COMBO_AGE;
  if (G.combo > G.maxCombo) G.maxCombo = G.combo;
  syncCombo();
  if (G.combo === 3 || G.combo === 6 || G.combo === 10 || G.combo === 15) {
    audio.combo(G.combo);
    toast(G.combo >= 10 ? '连跳 ×' + G.combo : '连跳', false, true);
  }
}

function resetCombo() {
  G.combo = 0;
  G.comboAge = 0;
  syncCombo();
}

function playerCell() {
  var lily;
  if (G.player.ride >= 0 && G.lilies[G.player.ride]) {
    lily = G.lilies[G.player.ride];
    return { r: lily.r, c: Math.round(lily.c) };
  }
  return { r: G.player.r, c: G.player.c };
}

function visEnt(e) {
  var a, b, k, arc, p, lily;
  if (!e) return { x: OX, y: OY };
  if (e.state === 'fall' || e.state === 'dead') {
    p = standXY(e.fc, e.fr);
    return { x: p.x + e.fallX, y: p.y + e.fallY };
  }
  if (e.ride >= 0 && G.lilies[e.ride] && e.hopT >= 1) {
    lily = G.lilies[e.ride];
    p = standXY(lily.c, lily.r);
    return { x: p.x, y: p.y - 4 };
  }
  if (e.hopT < 1) {
    a = standXY(e.fc, e.fr);
    if (e.destKind === 'fall' || e.destKind === 'water') {
      p = peakXY(e.c, e.r);
      b = { x: p.x, y: p.y + HH * 0.92 };
    } else b = standXY(e.c, e.r);
    k = easeOut(e.hopT);
    arc = Math.sin(e.hopT * Math.PI) * (reduceMotion() ? 0 : (e.destKind === 'fall' ? 14 : 26));
    return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) - arc };
  }
  return standXY(e.c, e.r);
}

function popAt(r, c, n) {
  G.pops[r + ',' + c] = n == null ? 1.2 : n;
}

function liveCocos() {
  var n = 0, i;
  for (i = 0; i < G.cocos.length; i++) if (!G.cocos[i].dead) n++;
  return n;
}

function makeCoco(r, c) {
  return {
    kind: 'coco',
    r: r, c: c, fr: r, fc: c,
    hopT: 1, hopDur: cocoHopTime(G.round, G.rush),
    wait: cocoWait(G.round, G.rush),
    destKind: 'land',
    squash: 0.7,
    state: 'idle',
    dead: false,
    spin: 0,
    fallY: 0, fallV: 0, fallX: 0,
    smash: false
  };
}

function makeSnake(cells) {
  var hop = snakeHopTime(G.round, G.rush);
  return {
    kind: 'snake',
    cells: cells,
    i: 0,
    sdir: 1,
    r: cells[0].r,
    c: cells[0].c,
    fr: cells[0].r,
    fc: cells[0].c,
    hopT: 1,
    hopDur: hop,
    wait: 0.35 + Math.random() * 0.4,
    destKind: 'land',
    squash: 1,
    state: 'idle',
    dead: false,
    spin: 0,
    fallY: 0, fallV: 0, fallX: 0
  };
}

function rowSpanLand(map, row) {
  var c, min = 99, max = -1;
  for (c = 0; c < map[row].length; c++) {
    if (isLandCh(map[row][c])) {
      if (c < min) min = c;
      if (c > max) max = c;
    }
  }
  return min <= max ? { min: min, max: max } : null;
}

function buildSnakes(map, stage) {
  var list = [];
  var cells, c;
  if (stage === 1) {
    cells = [];
    for (c = 1; c <= 5; c++) if (isLandCh(ch(map, 4, c))) cells.push({ r: 4, c: c });
    if (cells.length >= 2) list.push(makeSnake(cells));
  } else {
    cells = [];
    for (c = 1; c <= 4; c++) if (isLandCh(ch(map, 4, c))) cells.push({ r: 4, c: c });
    if (cells.length >= 2) list.push(makeSnake(cells));
    cells = [];
    for (c = 1; c <= 4; c++) if (isLandCh(ch(map, 7, c))) cells.push({ r: 7, c: c });
    if (cells.length >= 2) list.push(makeSnake(cells));
  }
  return list;
}

function buildRhinos(map, stage) {
  var list = [];
  var sp, spd;
  if (stage !== 2) return list;
  spd = rhinoSpeed(G.round, G.rush);
  sp = rowSpanLand(map, 2);
  if (sp) list.push({ r: 2, c: sp.min + 0.2, dir: 1, spd: spd, min: sp.min, max: sp.max, dust: 0 });
  sp = rowSpanLand(map, 3);
  if (sp) list.push({ r: 3, c: sp.max - 0.2, dir: -1, spd: spd * 0.92, min: sp.min, max: sp.max, dust: 0 });
  return list;
}

function buildLilies(map, stage) {
  var list = [];
  var sp, spd, n, i;
  if (stage !== 2) return list;
  spd = lilySpeed(G.round, G.rush);
  sp = waterSpan(map, 5);
  n = 3;
  if (sp) {
    for (i = 0; i < n; i++) {
      list.push({
        r: 5,
        c: sp.min + (i + 0.5) * ((sp.max - sp.min) / n),
        dir: 1,
        spd: spd,
        min: sp.min,
        max: sp.max
      });
    }
  }
  sp = waterSpan(map, 6);
  if (sp) {
    for (i = 0; i < n; i++) {
      list.push({
        r: 6,
        c: sp.max - (i + 0.5) * ((sp.max - sp.min) / n),
        dir: -1,
        spd: spd * 0.9,
        min: sp.min,
        max: sp.max
      });
    }
  }
  return list;
}

function buildMonkeys(stage) {
  if (stage !== 1) return [];
  return [
    { r: 3, c: 0, throwT: 0.8, bob: 0 },
    { r: 2, c: 5, throwT: 1.6, bob: 0 }
  ];
}

function lilyAt(r, c) {
  var i, L, d;
  var best = -1;
  var bestD = 0.82;
  for (i = 0; i < G.lilies.length; i++) {
    L = G.lilies[i];
    if (L.r !== r) continue;
    d = Math.abs(L.c - c);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

function loadStage(stage, keepPlayerScore) {
  var map = stage === 2 ? MAP2 : MAP1;
  var st = findStart(map);
  var gs = findGoals(map);
  var o;
  G.stage = stage;
  G.map = map;
  G.start = st;
  G.goals = gs;
  G.maxDist = distToGoals(st.r, st.c, gs);
  o = originFor(map);
  OX = o.ox;
  OY = o.oy;
  G.player = makeHopper('player', st.r, st.c);
  G.player.inv = keepPlayerScore ? 0.45 : 0.2;
  G.player.squash = 0.62;
  G.gorilla = {
    r: gs[0].r,
    c: gs[0].c,
    squash: 1,
    throwT: 1,
    arm: 0,
    gone: false,
    hopT: 1,
    flee: 0
  };
  G.cocos = [];
  G.snakes = buildSnakes(map, stage);
  G.rhinos = buildRhinos(map, stage);
  G.lilies = buildLilies(map, stage);
  G.monkeys = buildMonkeys(stage);
  G.pops = {};
  G.pending = -1;
  G.throwCd = throwInterval(G.round, G.rush) * 0.55;
  G.lock = 0;
  G.trans = 0;
  G.transKind = '';
  resetFx();
}

function startRun(kind) {
  G.kind = kind;
  G.rush = kind === 'rush';
  G.mode = 'play';
  G.clock = 0;
  G.round = 1;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  G.maxCombo = 0;
  G.comboAge = 0;
  G.why = '';
  loadStage(1, false);
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  panelEl.className = 'panel';
  audio.start();
  hudPlay();
  toast(G.rush ? '暴走' : '上山', false, !G.rush);
  canvas.focus({ preventScroll: true });
}

function retry() {
  audio.ui();
  if (G.mode === 'title') startRun('slope');
  else startRun(G.kind);
}

function showTitle() {
  G.mode = 'title';
  G.rush = false;
  G.kind = 'slope';
  G.round = 1;
  G.stage = 1;
  G.lives = LIVES;
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel';
  ovTitle.textContent = '刚果';
  ovLead.textContent = '等距跳上台阶。椰子砸下来、犀牛冲过来、蛇爬、水会淹。先追上猩猩，再进草原。';
  ovOps.textContent = '方向键或 WASD hop · 点邻格 / 滑动 · R 重开 · M 静音';
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
  hintEl.textContent = '一次跳一格 · 躲开椰子犀牛蛇 · 落水即死 · 追上猩猩进下一屏';
  loadStage(1, false);
  G.player.inv = 0;
  hudPlay();
  modeLabel.textContent = '斜坡';
}

function showOver() {
  G.mode = 'over';
  persistBest();
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel lose';
  ovTitle.textContent = '命尽';
  ovLead.textContent = '第 ' + G.round + ' 轮 · ' + (G.stage === 2 ? '草原' : '密林') + ' · ' +
    G.score + ' 分 · 连跳最高 ×' + G.maxCombo + (G.why ? ' · ' + G.why : '');
  ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
  audio.over();
  if (ovRetry) ovRetry.focus();
}

function whyText(w) {
  if (w === 'coco') return '被椰子砸了';
  if (w === 'rhino') return '被犀牛撞了';
  if (w === 'snake') return '被蛇咬了';
  if (w === 'water') return '落水了';
  if (w === 'fall') return '掉下去了';
  return '';
}

function kill(why) {
  var p = G.player;
  var v, rgb;
  if (p.dead || G.mode !== 'play') return;
  p.dead = true;
  p.state = 'fall';
  p.ride = -1;
  G.why = whyText(why);
  p.fr = p.r;
  p.fc = p.c;
  v = visEnt(p);
  p.fallX = 0;
  p.fallY = 0;
  p.fallV = why === 'fall' || why === 'water' ? 70 : 16;
  resetCombo();
  G.lives -= 1;
  renderPips();
  hitStop(why === 'coco' ? 0.072 : 0.08);
  dieShake();
  shake(why === 'coco' ? 11 : 9);
  if (why === 'coco') {
    rgb = COCO;
    splatKick();
    shardBurst(v.x, v.y, COCO2);
    audio.smash();
  } else if (why === 'water') {
    rgb = CYAN;
    burst(v.x, v.y, 22, CYAN, 80, 0.45, 8);
    audio.splash();
  } else if (why === 'rhino') {
    rgb = [160, 160, 170];
    audio.rhino();
    audio.die();
  } else if (why === 'snake') {
    rgb = LIME;
    audio.snake();
    audio.die();
  } else {
    rgb = HOT;
    audio.die();
  }
  burst(v.x, v.y, 26, rgb, 110, 0.5, 26);
  burst(v.x, v.y, 10, GOLD, 70, 0.3, 12);
  spark(v.x, v.y, rgb, 8);
  screenFlash(rgb, 0.4);
  toast(G.why, true, false);
  G.lock = 0.78;
  G.pending = -1;
}

function respawnOrOver() {
  var st;
  if (G.lives <= 0) {
    showOver();
    return;
  }
  st = G.start;
  G.player = makeHopper('player', st.r, st.c);
  G.player.inv = INVULN;
  G.player.squash = 0.62;
  G.pending = -1;
  G.lock = 0;
  toast('再跳', false, false);
  hudPlay();
}

function airborne(e) {
  return e.hopT < 1 && e.hopT > 0.18 && e.hopT < 0.78;
}

function occupy(e) {
  if (!e || e.dead) return null;
  if (e.state === 'fall') return null;
  if (e.hopT < 1) return null;
  return { r: e.r, c: e.c };
}

function nearMissCoco(coco) {
  var p = G.player;
  var v;
  if (p.dead || G.mode !== 'play') return;
  if (p.left.t < 0.28 && p.left.r === coco.r && p.left.c === coco.c) {
    v = visEnt(p);
    bumpCombo();
    addScore(NEAR_SCORE * Math.max(1, G.combo), v.x, v.y, '险 +' + (NEAR_SCORE * Math.max(1, G.combo)));
    audio.near();
    spark(v.x, v.y, GOLD, 8);
    ringAt(standXY(coco.c, coco.r).x, standXY(coco.c, coco.r).y, GOLD);
    toast('险跳', false, true);
  }
}

function smashCoco(coco, hitPlayer) {
  var v;
  if (coco.dead) return;
  coco.dead = true;
  coco.smash = true;
  coco.state = 'fall';
  coco.fallV = 40;
  v = visEnt(coco);
  shardBurst(v.x, v.y, COCO);
  burst(v.x, v.y, 16, COCO2, 90, 0.36, 22);
  spark(v.x, v.y, GOLD, 5);
  if (hitPlayer) {
    hitStop(0.07);
    shake(10);
    splatKick();
    screenFlash(COCO2, 0.38);
    audio.smash();
  } else {
    audio.noise(0.06, 0.05, 280, 'lowpass');
    nearMissCoco(coco);
  }
}

function spawnCocoAt(r, c) {
  var coco, dirs;
  if (liveCocos() >= maxCocos(G.round, G.rush)) return;
  if (!isLandCh(ch(G.map, r, c))) return;
  coco = makeCoco(r, c);
  G.cocos.push(coco);
  dirs = cocoDirs(G.map, r, c);
  if (dirs.length) beginCocoHop(coco, dirs[(Math.random() * dirs.length) | 0]);
  else coco.wait = 0.04;
  audio.throw();
}

function landPlayer() {
  var p = G.player;
  var destKind = p.destKind;
  var v, lily, gained;
  p.hopT = 1;
  p.squash = 0.5;
  v = visEnt(p);

  if (destKind === 'fall') {
    kill('fall');
    p.fallV = 96;
    return;
  }
  if (destKind === 'water') {
    lily = lilyAt(p.r, p.c);
    if (lily < 0) {
      kill('water');
      p.fallV = 40;
      return;
    }
    p.ride = lily;
    p.state = 'idle';
    audio.splash();
    kick(2.4);
    burst(v.x, v.y + 4, 10, CYAN, 50, 0.28, 6);
    ringAt(v.x, v.y + 2, CYAN);
    bumpCombo();
    gained = HOP_SCORE * G.combo;
    addScore(gained, v.x, v.y, G.combo >= 2 ? '+' + gained : null);
    hitStop(0.03);
    syncClimb();
    return;
  }

  p.ride = -1;
  p.state = 'idle';
  popAt(p.r, p.c, 1.22);
  audio.land();
  kick(2.8);
  burst(v.x, v.y + 6, 8, G.stage === 2 ? GOLD : LIME, 46, 0.22, 30);
  ringAt(v.x, v.y + 4, LIME);
  bumpCombo();
  gained = HOP_SCORE * G.combo;
  addScore(gained, v.x, v.y, G.combo >= 2 ? '+' + gained : null);
  hitStop(0.032);
  syncClimb();

  if (ch(G.map, p.r, p.c) === 'G' && !G.gorilla.gone) {
    reachGoal(v);
    return;
  }
  checkHits();
}

function reachGoal(v) {
  var bonus, p;
  if (G.trans > 0 || G.gorilla.gone) return;
  p = G.player;
  p.inv = 9;
  G.lock = 1.1;
  G.pending = -1;
  G.gorilla.gone = true;
  G.gorilla.flee = 0.01;
  bonus = GOAL_SCORE + ROUND_STEP * (G.round - 1);
  if (G.stage === 2) bonus += STAGE_BONUS + ROUND_STEP * G.round;
  addScore(bonus, v.x, v.y - 20, (G.stage === 2 ? '抓到了 +' : '追上了 +') + bonus);
  toast(G.stage === 2 ? '抓到了' : '追上了', false, true);
  audio.goal();
  hitStop(0.07);
  screenFlash(GOLD, 0.4);
  burst(v.x, v.y, 36, GOLD, 100, 0.6, 16);
  spark(v.x, v.y, LIME, 12);
  stageEl.classList.remove('clear');
  void stageEl.offsetWidth;
  stageEl.classList.add('clear');
  G.trans = G.stage === 1 ? 0.95 : 1.15;
  G.transKind = G.stage === 1 ? 'safari' : 'next';
}

function finishTrans() {
  if (G.transKind === 'safari') {
    loadStage(2, true);
    G.player.inv = 0.55;
    hudPlay();
    toast('草原', false, true);
    audio.start();
    return;
  }
  if (G.transKind === 'next') {
    G.round += 1;
    loadStage(1, true);
    G.player.inv = 0.5;
    hudPlay();
    toast('第 ' + G.round + ' 轮', false, true);
    audio.start();
  }
}

function tryHop(dir) {
  var p, dest, cell, face;
  if (G.mode !== 'play') return;
  if (G.lock > 0) return;
  p = G.player;
  if (p.dead || p.state === 'fall') return;
  if (p.hopT < 1 || p.state === 'hop') {
    G.pending = dir;
    return;
  }
  cell = playerCell();
  dest = hopDest(G.map, cell.r, cell.c, dir);
  p.left = { r: cell.r, c: cell.c, t: 0 };
  p.fr = cell.r;
  p.fc = cell.c;
  p.r = dest.r;
  p.c = dest.c;
  p.destKind = dest.kind;
  p.hopT = 0;
  p.hopDur = playerHopTime();
  p.state = 'hop';
  p.ride = -1;
  p.dir = dir;
  face = (dir === NE || dir === SE) ? 1 : -1;
  p.face = face;
  p.squash = 1.18;
  G.pending = -1;
  popAt(cell.r, cell.c, 0.86);
  audio.hop(G.combo);
}

function beginCocoHop(coco, dir) {
  var dest = hopDest(G.map, coco.r, coco.c, dir);
  coco.fr = coco.r;
  coco.fc = coco.c;
  coco.r = dest.r;
  coco.c = dest.c;
  coco.destKind = dest.kind;
  coco.hopT = 0;
  coco.hopDur = cocoHopTime(G.round, G.rush);
  coco.state = 'hop';
  coco.squash = 1.12;
}

function thinkCoco(coco, dt) {
  var dirs, dir;
  if (coco.dead) {
    coco.fallY += coco.fallV * dt;
    coco.fallV += 220 * dt;
    coco.spin += dt * 8;
    coco.fallX += (Math.random() - 0.5) * 10 * dt;
    return;
  }
  if (coco.squash > 1) coco.squash = Math.max(1, coco.squash - dt * 3);
  if (coco.squash < 1) coco.squash = Math.min(1, coco.squash + dt * 5);
  if (coco.hopT < 1) {
    coco.hopT += dt / coco.hopDur;
    if (coco.hopT >= 1) {
      coco.hopT = 1;
      coco.squash = 0.55;
      if (coco.destKind !== 'land') {
        smashCoco(coco, false);
        return;
      }
      coco.state = 'idle';
      coco.wait = cocoWait(G.round, G.rush);
      popAt(coco.r, coco.c, 1.1);
    }
    return;
  }
  coco.wait -= dt;
  if (coco.wait > 0) return;
  dirs = cocoDirs(G.map, coco.r, coco.c);
  if (!dirs.length) {
    smashCoco(coco, false);
    return;
  }
  dir = dirs[(Math.random() * dirs.length) | 0];
  beginCocoHop(coco, dir);
}

function thinkSnake(sn, dt) {
  var nxt, cell;
  if (sn.squash < 1) sn.squash = Math.min(1, sn.squash + dt * 4);
  if (sn.hopT < 1) {
    sn.hopT += dt / sn.hopDur;
    if (sn.hopT >= 1) {
      sn.hopT = 1;
      sn.squash = 0.62;
      sn.state = 'idle';
      sn.wait = 0.08 + Math.random() * 0.12;
    }
    return;
  }
  sn.wait -= dt;
  if (sn.wait > 0) return;
  nxt = sn.i + sn.sdir;
  if (nxt < 0 || nxt >= sn.cells.length) {
    sn.sdir *= -1;
    nxt = sn.i + sn.sdir;
  }
  if (nxt < 0 || nxt >= sn.cells.length) return;
  cell = sn.cells[nxt];
  sn.fr = sn.r;
  sn.fc = sn.c;
  sn.r = cell.r;
  sn.c = cell.c;
  sn.i = nxt;
  sn.hopT = 0;
  sn.hopDur = snakeHopTime(G.round, G.rush);
  sn.state = 'hop';
  sn.destKind = 'land';
  sn.squash = 1.14;
}

function thinkRhino(rh, dt) {
  rh.c += rh.dir * rh.spd * dt;
  if (rh.c > rh.max) {
    rh.c = rh.max;
    rh.dir = -1;
  } else if (rh.c < rh.min) {
    rh.c = rh.min;
    rh.dir = 1;
  }
  rh.dust += dt;
}

function thinkLily(lily, dt) {
  lily.c += lily.dir * lily.spd * dt;
  if (lily.c > lily.max) {
    lily.c = lily.max;
    lily.dir = -1;
  } else if (lily.c < lily.min) {
    lily.c = lily.min;
    lily.dir = 1;
  }
}

function thinkMonkey(m, dt) {
  m.bob += dt;
  m.throwT -= dt;
  if (m.throwT <= 0 && G.mode === 'play') {
    spawnCocoAt(m.r, m.c);
    m.throwT = throwInterval(G.round, G.rush) * (1.3 + Math.random() * 0.8);
  }
}

function thinkGorilla(dt) {
  var g = G.gorilla;
  g.arm = Math.max(0, g.arm - dt * 2.4);
  if (g.squash < 1) g.squash = Math.min(1, g.squash + dt * 3);
  if (g.flee > 0) {
    g.flee += dt;
    g.squash = 1.1;
    return;
  }
  if (G.mode !== 'play' && G.mode !== 'title') return;
  if (g.gone) return;
  G.throwCd -= dt;
  if (G.throwCd <= 0) {
    g.arm = 1;
    g.squash = 0.72;
    spawnCocoAt(g.r, g.c);
    G.throwCd = throwInterval(G.round, G.rush) * (0.75 + Math.random() * 0.5);
  }
}

function checkHits() {
  var p, oc, i, coco, sn, rh, cell, lily, pc;
  if (G.mode !== 'play') return;
  p = G.player;
  if (p.dead || p.inv > 0 || G.lock > 0) return;
  oc = occupy(p);
  cell = playerCell();

  if (p.hopT >= 1 && p.ride < 0) {
    if (isWaterCh(ch(G.map, p.r, p.c))) {
      lily = lilyAt(p.r, p.c);
      if (lily < 0) {
        kill('water');
        return;
      }
      p.ride = lily;
    } else if (!isLandCh(ch(G.map, p.r, p.c))) {
      kill('fall');
      return;
    }
  }

  for (i = 0; i < G.cocos.length; i++) {
    coco = G.cocos[i];
    if (coco.dead) continue;
    if (occupy(coco) && oc && coco.r === oc.r && coco.c === oc.c) {
      smashCoco(coco, true);
      kill('coco');
      return;
    }
    if (occupy(coco) && occupy(p) && coco.r === cell.r && coco.c === cell.c) {
      smashCoco(coco, true);
      kill('coco');
      return;
    }
  }

  for (i = 0; i < G.snakes.length; i++) {
    sn = G.snakes[i];
    if (!occupy(sn) || !occupy(p)) continue;
    if (sn.r === cell.r && sn.c === cell.c) {
      kill('snake');
      return;
    }
  }

  if (p.hopT >= 1) {
    for (i = 0; i < G.rhinos.length; i++) {
      rh = G.rhinos[i];
      if (cell.r === rh.r && Math.abs(cell.c - rh.c) < 0.48) {
        pc = visEnt(p);
        burst(pc.x, pc.y, 10, [180, 180, 190], 70, 0.3, 20);
        kill('rhino');
        return;
      }
    }
  } else if (airborne(p)) {
    for (i = 0; i < G.rhinos.length; i++) {
      rh = G.rhinos[i];
      if (p.fr === rh.r && Math.abs(((p.fc + p.c) / 2) - rh.c) < 0.85) {
        if (!rh._near) {
          rh._near = true;
          bumpCombo();
          addScore(NEAR_SCORE * Math.max(1, G.combo), visEnt(p).x, visEnt(p).y - 8, '跃');
          audio.near();
        }
      } else rh._near = false;
    }
  }
}

function tickHopper(e, dt) {
  if (e.dead) {
    e.fallY += e.fallV * dt;
    e.fallV += 240 * dt;
    e.spin += dt * 7;
    return;
  }
  if (e.inv > 0) e.inv -= dt;
  if (e.left) e.left.t += dt;
  if (e.hopT < 1) {
    e.squash = 1.16;
    e.hopT += dt / e.hopDur;
    if (e.hopT >= 1) {
      e.hopT = 1;
      if (e.kind === 'player') landPlayer();
    }
  } else if (e.squash < 1) {
    e.squash = Math.min(1, e.squash + dt * 5.2);
  } else if (e.squash > 1) {
    e.squash = Math.max(1, e.squash - dt * 4);
  }
}

function tickFx(dt) {
  var i, o, key;
  G.waterT += dt;
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
  G.kickX *= 0.78;
  G.kickY *= 0.78;
  if (G.flashA > 0) G.flashA = Math.max(0, G.flashA - dt * 2.4);
  if (G.comboAge > 0) {
    G.comboAge -= dt;
    if (G.comboAge <= 0) resetCombo();
  }
  for (key in G.pops) {
    if (!Object.prototype.hasOwnProperty.call(G.pops, key)) continue;
    G.pops[key] += (1 - G.pops[key]) * Math.min(1, dt * 10);
    if (Math.abs(G.pops[key] - 1) < 0.02) delete G.pops[key];
  }
  for (i = particles.length - 1; i >= 0; i--) {
    o = particles[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.vy += o.g * dt;
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
    if (o.t >= o.max) rings.splice(i, 1);
  }
  for (i = shards.length - 1; i >= 0; i--) {
    o = shards[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.vy += 180 * dt;
    o.rot += o.vr * dt;
    if (o.t <= 0) shards.splice(i, 1);
  }
  for (i = floats.length - 1; i >= 0; i--) {
    o = floats[i];
    o.t -= dt;
    o.y -= 28 * dt;
    if (o.t <= 0) floats.splice(i, 1);
  }
  for (i = leaves.length - 1; i >= 0; i--) {
    o = leaves[i];
    o.t -= dt;
    o.x += o.vx * dt + Math.sin(G.clock * 2 + i) * 10 * dt;
    o.y += o.vy * dt;
    o.rot += o.vr * dt;
    if (o.t <= 0 || o.y > WORLD_H + 20) leaves.splice(i, 1);
  }
  if (leaves.length < 18 && Math.random() < dt * 2.2) spawnLeaf();
}

function step(dt) {
  var i;
  G.clock += dt;
  if (G.mode === 'title') {
    thinkGorilla(dt);
    for (i = 0; i < G.cocos.length; i++) thinkCoco(G.cocos[i], dt);
    for (i = G.cocos.length - 1; i >= 0; i--) {
      if (G.cocos[i].dead && G.cocos[i].fallY > 80) G.cocos.splice(i, 1);
    }
    for (i = 0; i < G.monkeys.length; i++) thinkMonkey(G.monkeys[i], dt);
    tickFx(dt);
    return;
  }
  if (G.mode !== 'play') {
    tickFx(dt);
    return;
  }

  if (G.lock > 0) {
    G.lock -= dt;
    tickHopper(G.player, dt);
    thinkGorilla(dt);
    for (i = 0; i < G.cocos.length; i++) thinkCoco(G.cocos[i], dt);
    for (i = 0; i < G.lilies.length; i++) thinkLily(G.lilies[i], dt);
    tickFx(dt);
    if (G.player.dead && G.lock <= 0) respawnOrOver();
    if (G.trans > 0) {
      G.trans -= dt;
      if (G.trans <= 0) finishTrans();
    }
    return;
  }

  tickHopper(G.player, dt);
  if (G.player.dead) {
    tickFx(dt);
    return;
  }

  if (G.player.hopT >= 1 && G.pending >= 0 && G.player.state === 'idle') {
    tryHop(G.pending);
  }

  thinkGorilla(dt);
  for (i = 0; i < G.monkeys.length; i++) thinkMonkey(G.monkeys[i], dt);
  for (i = 0; i < G.cocos.length; i++) thinkCoco(G.cocos[i], dt);
  for (i = G.cocos.length - 1; i >= 0; i--) {
    if (G.cocos[i].dead && G.cocos[i].fallY > 90) G.cocos.splice(i, 1);
  }
  for (i = 0; i < G.snakes.length; i++) thinkSnake(G.snakes[i], dt);
  for (i = 0; i < G.rhinos.length; i++) thinkRhino(G.rhinos[i], dt);
  for (i = 0; i < G.lilies.length; i++) thinkLily(G.lilies[i], dt);

  checkHits();
  tickFx(dt);
}

/* ---- draw ---- */
function resize() {
  var rect = stageEl.getBoundingClientRect();
  cssW = rect.width;
  cssH = rect.height;
  dpr = Math.min(2.2, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, (cssW * dpr) | 0);
  canvas.height = Math.max(1, (cssH * dpr) | 0);
  var padB = coarseQ.matches ? 70 : 8;
  var avW = cssW;
  var avH = Math.max(40, cssH - padB);
  var s = Math.min(avW / WORLD_W, avH / WORLD_H);
  L.s = s;
  L.x = (avW - WORLD_W * s) / 2;
  L.y = Math.max(2, (avH - WORLD_H * s) / 2 * 0.62);
}

function sx(x) { return L.x + x * L.s; }
function sy(y) { return L.y + y * L.s; }
function sc(n) { return n * L.s; }

function tileColors(k, r, c) {
  var t = (r + c * 0.4);
  var pulse = 0.5 + 0.5 * Math.sin(G.clock * 2.2 + t);
  if (k === 'W') {
    return {
      top: mixRgb([12, 70, 96], CYAN, 0.18 + pulse * 0.12),
      L: [8, 36, 58],
      R: [6, 22, 40]
    };
  }
  if (k === 'G') {
    return {
      top: mixRgb(GOLD, [255, 255, 200], 0.25 + pulse * 0.2),
      L: [110, 72, 18],
      R: [72, 42, 10]
    };
  }
  if (G.stage === 2) {
    return {
      top: mixRgb([196, 148, 52], [255, 200, 90], 0.12 + (r % 2) * 0.05),
      L: [96, 62, 22],
      R: [64, 38, 14]
    };
  }
  return {
    top: mixRgb([28, 140, 72], LIME, 0.12 + (c % 2) * 0.06),
    L: [16, 72, 42],
    R: [12, 46, 28]
  };
}

function drawTile(r, c) {
  var k = ch(G.map, r, c);
  var p, x, y, hw, hh, f, col, pop, cx, cy, g, wave;
  if (k === '.') return;
  p = peakXY(c, r);
  x = sx(p.x);
  y = sy(p.y);
  hw = sc(HW);
  hh = sc(HH);
  f = sc(FACE);
  col = tileColors(k, r, c);
  pop = G.pops[r + ',' + c] || 1;
  if (k === 'W') {
    wave = Math.sin(G.clock * 3.2 + r * 0.8 + c) * sc(1.6);
    y += wave * 0.15;
  }

  ctx.beginPath();
  ctx.moveTo(x - hw, y + hh);
  ctx.lineTo(x, y + hh * 2);
  ctx.lineTo(x, y + hh * 2 + f);
  ctx.lineTo(x - hw, y + hh + f);
  ctx.closePath();
  ctx.fillStyle = rgba(col.L, 1);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + hw, y + hh);
  ctx.lineTo(x, y + hh * 2);
  ctx.lineTo(x, y + hh * 2 + f);
  ctx.lineTo(x + hw, y + hh + f);
  ctx.closePath();
  ctx.fillStyle = rgba(col.R, 1);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = Math.max(1, sc(0.8));
  ctx.beginPath();
  ctx.moveTo(x, y + hh * 2);
  ctx.lineTo(x, y + hh * 2 + f);
  ctx.stroke();

  cx = x;
  cy = y + hh;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pop, pop);
  ctx.translate(-cx, -cy);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + hw, y + hh);
  ctx.lineTo(x, y + hh * 2);
  ctx.lineTo(x - hw, y + hh);
  ctx.closePath();
  g = ctx.createLinearGradient(x - hw * 0.2, y, x + hw * 0.3, y + hh * 2);
  g.addColorStop(0, rgba(mixRgb(col.top, [255, 255, 255], 0.22), 1));
  g.addColorStop(0.55, rgba(col.top, 1));
  g.addColorStop(1, rgba(mixRgb(col.top, [0, 0, 0], 0.18), 1));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = rgba(mixRgb(col.top, [255, 255, 255], 0.4), 0.5);
  ctx.lineWidth = Math.max(1, sc(1.1));
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - hw, y + hh);
  ctx.stroke();
  if (k === 'W') {
    ctx.strokeStyle = rgba(CYAN, 0.28 + 0.12 * Math.sin(G.clock * 4 + c));
    ctx.beginPath();
    ctx.moveTo(x - hw * 0.4, y + hh);
    ctx.quadraticCurveTo(x, y + hh * 1.2 + wave, x + hw * 0.4, y + hh);
    ctx.stroke();
  }
  if (k === 'G') {
    ctx.strokeStyle = rgba(GOLD, 0.35 + 0.2 * Math.sin(G.clock * 5));
    ctx.lineWidth = Math.max(1, sc(1.6));
    ctx.stroke();
  }
  ctx.restore();
}

function drawPalm(c, r, side) {
  var p = peakXY(c, r);
  var x = sx(p.x + side * HW * 0.9);
  var y = sy(p.y + HH * 0.2);
  var s = sc(1);
  var i, a;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#3a2210';
  ctx.fillRect(-1.4 * s, 0, 2.8 * s, 16 * s);
  ctx.fillStyle = '#1dff70';
  for (i = 0; i < 5; i++) {
    a = -1.2 + i * 0.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.cos(a) * 14 * s, -10 * s + Math.sin(G.clock * 1.4 + i) * 2 * s, Math.cos(a) * 18 * s, 4 * s);
    ctx.quadraticCurveTo(Math.cos(a) * 8 * s, -2 * s, 0, 0);
    ctx.fill();
  }
  ctx.restore();
}

function drawShadow(x, y, s) {
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.ellipse(sx(x), sy(y + 8), sc(8 * (s || 1)), sc(3.2 * (s || 1)), 0, 0, TAU);
  ctx.fill();
}

function drawPlayerAt(x, y, e) {
  var hop, s, blink;
  hop = e.hopT < 1 ? Math.sin(e.hopT * Math.PI) : 0;
  blink = e.inv > 0 && ((G.clock * 18) | 0) % 2 === 0;
  if (blink) return;
  s = sc(1);
  ctx.save();
  ctx.translate(sx(x), sy(y));
  ctx.scale(e.face || 1, 1);
  ctx.scale(2 - e.squash, e.squash);
  if (e.state === 'fall' || e.dead) ctx.rotate(e.spin || 0.4);

  ctx.fillStyle = '#6a4a18';
  ctx.beginPath();
  ctx.ellipse(-3.6 * s, 7.2 * s, 2.6 * s, 2 * s, -0.25, 0, TAU);
  ctx.ellipse(3.8 * s, 7.2 * s, 2.6 * s, 2 * s, 0.25, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#c8a050';
  ctx.beginPath();
  ctx.ellipse(0, 1.2 * s - hop * sc(1.5), 6.4 * s, 7.2 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e8d090';
  ctx.beginPath();
  ctx.ellipse(-0.6 * s, -4.6 * s, 5.2 * s, 5 * s, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#ffe36b';
  ctx.beginPath();
  ctx.ellipse(0, -8.2 * s, 6.2 * s, 3.4 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c8a040';
  ctx.beginPath();
  ctx.ellipse(0, -6.6 * s, 7.4 * s, 1.5 * s, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.ellipse(1.4 * s, -5 * s, 1.15 * s, 1.45 * s, 0, 0, TAU);
  ctx.ellipse(4.2 * s, -5 * s, 1.05 * s, 1.35 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(1.65 * s, -5.35 * s, 0.4 * s, 0, TAU);
  ctx.arc(4.4 * s, -5.3 * s, 0.35 * s, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = '#3dff88';
  ctx.lineWidth = Math.max(1, sc(1.1));
  ctx.beginPath();
  ctx.moveTo(-5.5 * s, -0.4 * s);
  ctx.lineTo(5.2 * s, -0.4 * s);
  ctx.stroke();
  ctx.restore();
}

function gorillaPos() {
  var g = G.gorilla;
  var p = standXY(g.c, g.r);
  var k;
  if (g.flee > 0) {
    k = Math.min(1, g.flee / 0.7);
    return {
      x: p.x + k * 40,
      y: p.y - Math.sin(k * Math.PI) * 70 - k * 20
    };
  }
  return p;
}

function drawGorilla() {
  var g = G.gorilla;
  var p, x, y, s, beat, arm;
  if (g.flee > 0.75) return;
  p = gorillaPos();
  x = p.x;
  y = p.y - 10;
  s = sc(1.15);
  beat = Math.sin(G.clock * 6) * (g.arm > 0.2 ? 3 : 0.6);
  arm = g.arm;
  ctx.save();
  ctx.translate(sx(x), sy(y));
  ctx.scale(2 - g.squash, g.squash);

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, sc(16), sc(12), sc(4), 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#6a3a18';
  ctx.beginPath();
  ctx.ellipse(-8 * s, 8 * s + beat, 4.2 * s, 5.5 * s, -0.2, 0, TAU);
  ctx.ellipse(8 * s, 8 * s - beat, 4.2 * s, 5.5 * s, 0.2, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#8a5020';
  ctx.beginPath();
  ctx.ellipse(0, 2 * s, 11 * s, 11.5 * s, 0, 0, TAU);
  ctx.fill();

  ctx.save();
  ctx.rotate(-arm * 0.9);
  ctx.fillStyle = '#7a4420';
  ctx.beginPath();
  ctx.ellipse(-12 * s, -2 * s - arm * 10 * s, 4.4 * s, 7 * s, -0.4, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.rotate(arm * 0.5);
  ctx.beginPath();
  ctx.ellipse(12 * s, -1 * s, 4.4 * s, 7 * s, 0.4, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#e8b890';
  ctx.beginPath();
  ctx.ellipse(0, -8 * s, 7.2 * s, 6.4 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#5a3010';
  ctx.beginPath();
  ctx.ellipse(-2.4 * s, -10.2 * s, 1.3 * s, 1.6 * s, 0, 0, TAU);
  ctx.ellipse(2.6 * s, -10.2 * s, 1.3 * s, 1.6 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#3a1808';
  ctx.beginPath();
  ctx.ellipse(0, -6.2 * s, 2.4 * s, 1.5 * s, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawCocoAt(x, y, e) {
  var s = sc(1);
  var bob = e.hopT < 1 ? Math.sin(e.hopT * Math.PI) * sc(2) : 0;
  ctx.save();
  ctx.translate(sx(x), sy(y - bob));
  ctx.scale(2 - e.squash, e.squash);
  if (e.state === 'fall') ctx.rotate(e.spin || 0);
  ctx.fillStyle = '#a05018';
  ctx.beginPath();
  ctx.ellipse(0, 0, 6.4 * s, 6.1 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c86828';
  ctx.beginPath();
  ctx.ellipse(-0.6 * s, -0.4 * s, 5.2 * s, 5 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffe0b0';
  ctx.beginPath();
  ctx.ellipse(-1.8 * s, -2.2 * s, 2.2 * s, 1.7 * s, -0.3, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,20,0,0.45)';
  ctx.lineWidth = Math.max(1, sc(0.7));
  ctx.beginPath();
  ctx.moveTo(-1 * s, -5 * s);
  ctx.lineTo(0.6 * s, 5 * s);
  ctx.stroke();
  ctx.restore();
}

function drawSnakeAt(x, y, e) {
  var s = sc(1);
  var wiggle = Math.sin(G.clock * 9 + e.c) * 2 * s;
  ctx.save();
  ctx.translate(sx(x), sy(y));
  ctx.scale(2 - e.squash, e.squash);
  ctx.fillStyle = '#1a8a48';
  ctx.beginPath();
  ctx.ellipse(-7 * s + wiggle, 5 * s, 5.2 * s, 3.4 * s, -0.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#3dff88';
  ctx.beginPath();
  ctx.ellipse(-2 * s, 2 * s, 5.4 * s, 3.8 * s, -0.25, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#7affb0';
  ctx.beginPath();
  ctx.ellipse(3.2 * s, -1.2 * s, 5.6 * s, 4.4 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffe36b';
  ctx.beginPath();
  ctx.ellipse(2.2 * s, -2.4 * s, 1.3 * s, 1.6 * s, 0, 0, TAU);
  ctx.ellipse(4.6 * s, -2.2 * s, 1.2 * s, 1.5 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(2.4 * s, -2.2 * s, 0.55 * s, 0, TAU);
  ctx.arc(4.8 * s, -2 * s, 0.5 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff3db8';
  ctx.beginPath();
  ctx.moveTo(8.2 * s, 0.4 * s);
  ctx.lineTo(12.5 * s, 1.8 * s);
  ctx.lineTo(8 * s, 2.4 * s);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRhino(rh) {
  var p = standXY(rh.c, rh.r);
  var s = sc(1.05);
  var x = sx(p.x);
  var y = sy(p.y - 4);
  var face = rh.dir >= 0 ? 1 : -1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(face, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, sc(10), sc(14), sc(4), 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#8a8a96';
  ctx.beginPath();
  ctx.ellipse(0, 0, 13 * s, 8.2 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#b0b0ba';
  ctx.beginPath();
  ctx.ellipse(-2 * s, -2 * s, 7 * s, 4.5 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#d8d8e0';
  ctx.beginPath();
  ctx.moveTo(10 * s, -2 * s);
  ctx.lineTo(18 * s, -8 * s);
  ctx.lineTo(12 * s, 1 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(6 * s, -3 * s, 1.1 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(HOT, 0.35);
  ctx.beginPath();
  ctx.ellipse(-10 * s, 6 * s, 6 * s, 2 * s, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawLily(lily) {
  var p = standXY(lily.c, lily.r);
  var x = sx(p.x);
  var y = sy(p.y + 2);
  var bob = Math.sin(G.clock * 3 + lily.c) * sc(1.4);
  var rx = sc(13);
  var ry = sc(6);
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, sc(4), rx * 0.85, ry * 0.7, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#1a8a48';
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#3dff88';
  ctx.beginPath();
  ctx.ellipse(-sc(1), -sc(1), rx * 0.72, ry * 0.55, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba(CYAN, 0.35);
  ctx.lineWidth = Math.max(1, sc(1));
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 0.92, ry * 0.92, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function drawMonkey(m) {
  var p = standXY(m.c, m.r);
  var s = sc(0.82);
  var bob = Math.sin(G.clock * 5 + m.r) * sc(1.5);
  ctx.save();
  ctx.translate(sx(p.x + HW * 0.15), sy(p.y - 8 + bob));
  ctx.fillStyle = '#6a3a14';
  ctx.beginPath();
  ctx.ellipse(0, 2 * s, 6.2 * s, 6.8 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e0b090';
  ctx.beginPath();
  ctx.ellipse(0, -4 * s, 4.4 * s, 4 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(-1.4 * s, -4.6 * s, 0.7 * s, 0, TAU);
  ctx.arc(1.6 * s, -4.6 * s, 0.7 * s, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawTent() {
  var g, p, x, y, s;
  if (G.stage !== 2) return;
  g = G.goals[1] || G.goals[0];
  p = standXY(g.c, g.r);
  x = sx(p.x + 10);
  y = sy(p.y - 18);
  s = sc(1);
  ctx.save();
  ctx.fillStyle = '#7a2010';
  ctx.beginPath();
  ctx.moveTo(x, y - 16 * s);
  ctx.lineTo(x + 14 * s, y + 10 * s);
  ctx.lineTo(x - 14 * s, y + 10 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff8a28';
  ctx.beginPath();
  ctx.moveTo(x, y - 16 * s);
  ctx.lineTo(x + 6 * s, y + 10 * s);
  ctx.lineTo(x - 6 * s, y + 10 * s);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHints() {
  var cell, i, dest, pos, p;
  p = G.player;
  if (G.mode !== 'play' || p.dead || p.hopT < 1) return;
  cell = playerCell();
  ctx.save();
  ctx.globalAlpha = 0.26 + 0.1 * Math.sin(G.clock * 6);
  for (i = 0; i < 4; i++) {
    dest = hopDest(G.map, cell.r, cell.c, i);
    if (dest.kind === 'land' || dest.kind === 'water') {
      pos = peakXY(dest.c, dest.r);
      ctx.strokeStyle = dest.kind === 'water' ? '#00f0ff' : '#3dff88';
      ctx.lineWidth = Math.max(1, sc(1.4));
      ctx.beginPath();
      ctx.moveTo(sx(pos.x), sy(pos.y));
      ctx.lineTo(sx(pos.x + HW), sy(pos.y + HH));
      ctx.lineTo(sx(pos.x), sy(pos.y + HH * 2));
      ctx.lineTo(sx(pos.x - HW), sy(pos.y + HH));
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawFx() {
  var i, o, a, r;
  for (i = 0; i < leaves.length; i++) {
    o = leaves[i];
    a = clamp(o.t / 6, 0, 1);
    ctx.save();
    ctx.translate(sx(o.x), sy(o.y));
    ctx.rotate(o.rot);
    ctx.fillStyle = rgba(o.rgb, 0.35 * a);
    ctx.fillRect(-sc(o.s), -sc(o.s) * 0.4, sc(o.s) * 2, sc(o.s) * 0.8);
    ctx.restore();
  }
  for (i = 0; i < rings.length; i++) {
    o = rings[i];
    a = 1 - o.t / o.max;
    r = sc(8 + o.t * 70);
    ctx.strokeStyle = rgba(o.rgb, a * 0.7);
    ctx.lineWidth = Math.max(1, sc(2) * a);
    ctx.beginPath();
    ctx.ellipse(sx(o.x), sy(o.y), r, r * 0.45, 0, 0, TAU);
    ctx.stroke();
  }
  for (i = 0; i < shards.length; i++) {
    o = shards[i];
    a = clamp(o.t / 0.5, 0, 1);
    ctx.save();
    ctx.translate(sx(o.x), sy(o.y));
    ctx.rotate(o.rot);
    ctx.fillStyle = rgba(o.rgb, a);
    ctx.fillRect(-sc(o.s) * 0.5, -sc(o.s) * 0.35, sc(o.s), sc(o.s) * 0.7);
    ctx.restore();
  }
  for (i = 0; i < particles.length; i++) {
    o = particles[i];
    a = clamp(o.t / o.max, 0, 1);
    ctx.fillStyle = rgba(o.rgb, a);
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), sc(o.r * (0.55 + a * 0.5)), 0, TAU);
    ctx.fill();
  }
  for (i = 0; i < sparks.length; i++) {
    o = sparks[i];
    a = o.t / o.max;
    ctx.strokeStyle = rgba(o.rgb, a);
    ctx.lineWidth = Math.max(1, sc(1.1));
    ctx.beginPath();
    ctx.moveTo(sx(o.x), sy(o.y));
    ctx.lineTo(sx(o.x - o.vx * 0.04), sy(o.y - o.vy * 0.04));
    ctx.stroke();
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (i = 0; i < floats.length; i++) {
    o = floats[i];
    a = clamp(o.t / 0.72, 0, 1);
    ctx.fillStyle = rgba(o.rgb, a);
    ctx.font = '700 ' + Math.max(11, sc(13) | 0) + 'px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillText(o.text, sx(o.x), sy(o.y));
  }
}

function drawActors() {
  var list = [];
  var i, e, v, d, lily, rh, m;

  for (i = 0; i < G.lilies.length; i++) {
    lily = G.lilies[i];
    list.push({ z: lily.r + lily.c - 0.2, kind: 'lily', ref: lily });
  }
  for (i = 0; i < G.monkeys.length; i++) {
    m = G.monkeys[i];
    list.push({ z: m.r + m.c + 0.1, kind: 'monkey', ref: m });
  }
  for (i = 0; i < G.rhinos.length; i++) {
    rh = G.rhinos[i];
    list.push({ z: rh.r + rh.c + 0.2, kind: 'rhino', ref: rh });
  }
  for (i = 0; i < G.snakes.length; i++) {
    e = G.snakes[i];
    list.push({ z: (e.hopT < 1 ? Math.max(e.fr, e.r) : e.r) + e.c + 0.25, kind: 'snake', ref: e });
  }
  for (i = 0; i < G.cocos.length; i++) {
    e = G.cocos[i];
    d = e.state === 'fall' ? 80 : (e.hopT < 1 ? Math.max(e.fr, e.r) : e.r) + e.c + 0.35;
    list.push({ z: d, kind: 'coco', ref: e });
  }
  if (!G.gorilla.gone || G.gorilla.flee > 0) {
    list.push({ z: G.gorilla.r + G.gorilla.c + 0.3, kind: 'ape', ref: G.gorilla });
  }
  e = G.player;
  d = e.state === 'fall' ? 90 : (e.hopT < 1 ? Math.max(e.fr, e.r) : e.r) + e.c + 0.4;
  if (e.ride >= 0) d += 0.15;
  list.push({ z: d, kind: 'player', ref: e });

  list.sort(function (a, b) { return a.z - b.z; });

  for (i = 0; i < list.length; i++) {
    e = list[i];
    if (e.kind === 'lily') drawLily(e.ref);
    else if (e.kind === 'monkey') drawMonkey(e.ref);
    else if (e.kind === 'rhino') drawRhino(e.ref);
    else if (e.kind === 'ape') drawGorilla();
    else if (e.kind === 'snake') {
      v = visEnt(e.ref);
      if (e.ref.state !== 'fall') drawShadow(v.x, v.y, 0.8);
      drawSnakeAt(v.x, v.y, e.ref);
    } else if (e.kind === 'coco') {
      v = visEnt(e.ref);
      if (e.ref.state !== 'fall') drawShadow(v.x, v.y, 0.55);
      drawCocoAt(v.x, v.y, e.ref);
    } else if (e.kind === 'player') {
      v = visEnt(e.ref);
      if (e.ref.state !== 'fall') drawShadow(v.x, v.y, 1);
      if (G.mode !== 'over' || e.ref.dead) drawPlayerAt(v.x, v.y, e.ref);
    }
  }
}

function drawBg() {
  var g, i, x, y;
  ctx.fillStyle = G.stage === 2 ? '#0a0806' : '#030a06';
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(OX), sy(OY + 30), sc(20), sx(OX), sy(OY + 90), sc(260));
  g.addColorStop(0, G.stage === 2 ? 'rgba(255,180,40,0.12)' : 'rgba(61,255,136,0.14)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(WORLD_W * 0.8), sy(40), sc(10), sx(WORLD_W * 0.8), sy(40), sc(180));
  g.addColorStop(0, 'rgba(0,240,255,0.07)');
  g.addColorStop(1, 'rgba(0,240,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  for (i = 0; i < 26; i++) {
    x = ((i * 97 + 13) % (WORLD_W - 20)) + 10;
    y = ((i * 53 + 8) % 90) + 8;
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), sc(0.7 + (i % 3) * 0.35), 0, TAU);
    ctx.fill();
  }
}

function drawPalms() {
  var r, c, k;
  for (r = 0; r < G.map.length; r++) {
    for (c = 0; c < G.map[r].length; c++) {
      k = G.map[r][c];
      if (k !== '.') continue;
      if (isLandCh(ch(G.map, r, c + 1)) || isLandCh(ch(G.map, r + 1, c))) {
        if ((r + c) % 3 === 0) drawPalm(c, r, (r + c) % 2 ? 1 : -1);
      }
    }
  }
}

function draw() {
  var r, c, shx = 0, shy = 0, depths, di, pair;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawBg();

  if (G.shake > 0 && !reduceMotion()) {
    shx = (Math.random() - 0.5) * G.shake * 0.7;
    shy = (Math.random() - 0.5) * G.shake * 0.7;
  }
  ctx.save();
  ctx.translate(shx + G.kickX, shy + G.kickY);

  depths = [];
  for (r = 0; r < G.map.length; r++) {
    for (c = 0; c < G.map[r].length; c++) {
      if (ch(G.map, r, c) === '.') continue;
      depths.push({ r: r, c: c, z: r + c });
    }
  }
  depths.sort(function (a, b) { return a.z - b.z; });
  for (di = 0; di < depths.length; di++) {
    pair = depths[di];
    drawTile(pair.r, pair.c);
  }
  drawPalms();
  drawTent();
  drawHints();
  drawActors();
  drawFx();
  ctx.restore();

  if (G.flashA > 0) {
    ctx.fillStyle = rgba(G.flashRgb, G.flashA * 0.45);
    ctx.fillRect(0, 0, cssW, cssH);
  }
}

function frame(ts) {
  var dt;
  requestAnimationFrame(frame);
  if (!lastTs) lastTs = ts;
  dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (hidden) return;
  if (dt > 0.05) dt = 0.05;
  if (G.stop > 0) {
    G.stop -= dt;
    if (G.stop < 0) {
      dt = -G.stop;
      G.stop = 0;
    } else {
      draw();
      return;
    }
  }
  acc += dt;
  while (acc >= STEP) {
    step(STEP);
    acc -= STEP;
  }
  draw();
}

/* ---- input ---- */
function findTap(wx, wy) {
  var r, c, p;
  for (r = G.map.length - 1; r >= 0; r--) {
    for (c = G.map[r].length - 1; c >= 0; c--) {
      if (ch(G.map, r, c) === '.') continue;
      p = peakXY(c, r);
      if (inDiamond(wx, wy, p.x, p.y)) return { r: r, c: c };
    }
  }
  return null;
}

function tapWorld(wx, wy) {
  var hit, p, cell, i;
  p = G.player;
  hit = findTap(wx, wy);
  if (!hit) {
    audio.ui();
    p.squash = 0.82;
    return;
  }
  cell = playerCell();
  if (hit.r === cell.r && hit.c === cell.c && p.hopT >= 1) {
    p.squash = 0.72;
    audio.ui();
    return;
  }
  i = dirBetween(G.map, cell.r, cell.c, hit.r, hit.c);
  if (i >= 0) tryHop(i);
  else {
    audio.ui();
    p.squash = 0.84;
  }
}

function toWorld(clientX, clientY) {
  var r = canvas.getBoundingClientRect();
  return {
    x: (clientX - r.left - L.x) / L.s,
    y: (clientY - r.top - L.y) / L.s
  };
}

canvas.addEventListener('pointerdown', function (e) {
  var w;
  audio.ensure();
  canvas.focus({ preventScroll: true });
  if (G.mode !== 'play') return;
  ptr.on = true;
  ptr.id = e.pointerId;
  ptr.x = e.clientX;
  ptr.y = e.clientY;
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  w = toWorld(e.clientX, e.clientY);
  ptr.wx = w.x;
  ptr.wy = w.y;
});

canvas.addEventListener('pointerup', function (e) {
  var w, dir;
  if (!ptr.on || (ptr.id !== -1 && e.pointerId !== ptr.id)) return;
  ptr.on = false;
  if (G.mode !== 'play') return;
  dir = swipeDir(e.clientX - ptr.x, e.clientY - ptr.y);
  if (dir >= 0) tryHop(dir);
  else {
    w = toWorld(e.clientX, e.clientY);
    tapWorld(w.x, w.y);
  }
});

canvas.addEventListener('pointercancel', function () { ptr.on = false; });

function bindPad(el, dir) {
  if (!el) return;
  el.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    audio.ensure();
    el.classList.add('held');
    tryHop(dir);
  });
  el.addEventListener('pointerup', function () { el.classList.remove('held'); });
  el.addEventListener('pointerleave', function () { el.classList.remove('held'); });
}

bindPad(btnNw, NW);
bindPad(btnNe, NE);
bindPad(btnSw, SW);
bindPad(btnSe, SE);

window.addEventListener('keydown', function (e) {
  var dir;
  if (e.repeat) return;
  audio.ensure();
  if (e.code === 'KeyM') {
    audio.setMuted(!audio.muted);
    e.preventDefault();
    return;
  }
  if (e.code === 'KeyR') {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    retry();
    e.preventDefault();
    return;
  }
  if (G.mode === 'title') {
    if (e.code === 'Digit1' || e.code === 'Enter' || e.code === 'Space') {
      startRun('slope');
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      startRun('rush');
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
      startRun('rush');
      e.preventDefault();
      return;
    }
  }
  dir = KEY_DIR[e.code];
  if (dir != null) {
    tryHop(dir);
    e.preventDefault();
  }
});

btnMute.addEventListener('click', function () {
  audio.ensure();
  audio.setMuted(!audio.muted);
});
btnRetry.addEventListener('click', function () {
  audio.ensure();
  retry();
});
btnSlope.addEventListener('click', function () {
  audio.ensure();
  startRun('slope');
});
btnRush.addEventListener('click', function () {
  audio.ensure();
  startRun('rush');
});
ovRetry.addEventListener('click', function () {
  audio.ensure();
  startRun(G.kind);
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

bestEl.textContent = String(G.bestS);
renderPips();
showTitle();
resize();
hudPlay();
requestAnimationFrame(frame);

}
