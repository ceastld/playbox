'use strict';

/* 电梯 — Elevator Action-lite. No CDN. */

var WORLD_W = 400;
var FLOORS_N = 8;
var FLOOR_H = 56;
var TOP = 30;
var WORLD_H = TOP + (FLOORS_N - 1) * FLOOR_H + 62;
var LIVES = 3;
var PW = 11;
var PH = 20;
var WALK = 112;
var JUMP_V = 228;
var GRAV = 900;
var MAX_FALL = 430;
var COYOTE = 0.08;
var BUFFER = 0.1;
var INVULN = 1.05;
var DIE_T = 0.58;
var SHOT_CD = 0.16;
var P_SHOT = 340;
var E_SHOT = 205;
var COMBO_WIN = 1.55;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var BEST_KEY = 'playbox-elevator-act-best';
var MUTE_KEY = 'playbox-elevator-act-mute';

var SHAFTS = [
  { x: 86, w: 32 },
  { x: 184, w: 32 },
  { x: 282, w: 32 }
];

var DOC_SPOTS = [
  { x: 48, floor: 6 },
  { x: 248, floor: 6 },
  { x: 152, floor: 5 },
  { x: 348, floor: 4 },
  { x: 50, floor: 3 },
  { x: 248, floor: 2 },
  { x: 152, floor: 1 },
  { x: 348, floor: 5 }
];

var DOOR_SPOTS = [
  { x: 48, floor: 7 }, { x: 152, floor: 7 }, { x: 248, floor: 7 }, { x: 348, floor: 7 },
  { x: 48, floor: 6 }, { x: 152, floor: 6 }, { x: 248, floor: 6 }, { x: 348, floor: 6 },
  { x: 48, floor: 5 }, { x: 152, floor: 5 }, { x: 248, floor: 5 }, { x: 348, floor: 5 },
  { x: 48, floor: 4 }, { x: 152, floor: 4 }, { x: 248, floor: 4 }, { x: 348, floor: 4 },
  { x: 48, floor: 3 }, { x: 152, floor: 3 }, { x: 248, floor: 3 }, { x: 348, floor: 3 },
  { x: 48, floor: 2 }, { x: 152, floor: 2 }, { x: 248, floor: 2 }, { x: 348, floor: 2 },
  { x: 48, floor: 1 }, { x: 152, floor: 1 }, { x: 248, floor: 1 }, { x: 348, floor: 1 }
];

var CAR = { x: 338, w: 46, floor: 0 };
var SPAWN = { x: 50, floor: 7 };

var GOLD = [255, 227, 107];
var CYN = [0, 240, 255];
var MAG = [255, 61, 184];
var HOT = [255, 176, 24];
var RED = [255, 58, 58];

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

function floorY(i) {
  return TOP + (FLOORS_N - 1 - i) * FLOOR_H;
}

function elevCenter(i) {
  return SHAFTS[i].x + SHAFTS[i].w * 0.5;
}

function inShaftAt(x) {
  var i, s;
  for (i = 0; i < SHAFTS.length; i++) {
    s = SHAFTS[i];
    if (x > s.x + 1.6 && x < s.x + s.w - 1.6) return i;
  }
  return -1;
}

function nearShaft(x, dist) {
  var i, s, edge, d, best = -1, bd = dist;
  for (i = 0; i < SHAFTS.length; i++) {
    s = SHAFTS[i];
    if (x >= s.x && x <= s.x + s.w) return i;
    edge = x < s.x ? s.x : s.x + s.w;
    d = Math.abs(x - edge);
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return best;
}

function alignedFloor(y, slop) {
  var i;
  slop = slop == null ? 5 : slop;
  for (i = 0; i < FLOORS_N; i++) {
    if (Math.abs(y - floorY(i)) <= slop) return i;
  }
  return -1;
}

function nearestFloor(y) {
  var i, best = 0, bd = 1e9, d;
  for (i = 0; i < FLOORS_N; i++) {
    d = Math.abs(y - floorY(i));
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return best;
}

function solidAt(x, floor, elevYs) {
  var si;
  if (floor < 0 || floor >= FLOORS_N) return false;
  if (x < 16 || x > WORLD_W - 16) return false;
  si = inShaftAt(x);
  if (si < 0) return true;
  if (!elevYs) return false;
  return Math.abs(elevYs[si] - floorY(floor)) <= 7;
}

function crushedBy(px, py, riding, ex, ey) {
  var head, feet, platTop, platBot;
  if (riding) return false;
  if (Math.abs(px - ex) > 17) return false;
  feet = py;
  head = py - PH;
  if (py >= ey - 8 && py <= ey + 8) return false;
  platTop = ey - 5;
  platBot = ey + 3;
  return platBot > head + 2 && platTop < feet - 3;
}

function jumpHeight() {
  return (JUMP_V * JUMP_V) / (2 * GRAV);
}

function docCount(round, brawl) {
  if (brawl) return 6;
  return Math.min(6, 2 + round);
}

function spyCap(round, brawl) {
  if (brawl) return Math.min(12, 6 + round);
  return Math.min(8, 3 + round);
}

function elevSpeed(round, brawl) {
  var base = brawl ? 124 : 80;
  return base * (1 + Math.max(0, round - 1) * 0.09);
}

function spySpeed(round, brawl) {
  var base = brawl ? 76 : 50;
  return base * (1 + Math.max(0, round - 1) * 0.07);
}

function elevWait(brawl) {
  return brawl ? 0.22 : 0.48;
}

function spawnInterval(round, brawl) {
  var t = (brawl ? 1.55 : 2.8) / (1 + Math.max(0, round - 1) * 0.12);
  return t < (brawl ? 0.7 : 1.2) ? (brawl ? 0.7 : 1.2) : t;
}

function inCar(x, floor, got, need) {
  return got >= need && floor === 0 && x >= CAR.x - 6 && x <= CAR.x + CAR.w + 8;
}

function bulletHitsBody(bx, by, px, py) {
  var hw = PW * 0.5;
  return bx > px - hw - 3 && bx < px + hw + 3 && by > py - PH + 2 && by < py - 3;
}

function hallwayX(n) {
  var spots = [50, 152, 248, 348];
  return spots[n % spots.length];
}

function makePlayer(x, floor) {
  if (x == null) x = SPAWN.x;
  if (floor == null) floor = SPAWN.floor;
  return {
    x: x,
    y: floorY(floor),
    vx: 0,
    vy: 0,
    face: 1,
    floor: floor,
    state: 'walk',
    grounded: true,
    ride: -1,
    walk: 0,
    coyote: COYOTE,
    squash: 1,
    inv: 0,
    deadT: 0,
    fireCd: 0,
    why: ''
  };
}

function makeElevs() {
  return [
    { y: floorY(2), floor: 2, dir: 1, vy: 0, wait: 0.5, called: -1, lastStop: 2, ding: 0 },
    { y: floorY(5), floor: 5, dir: -1, vy: 0, wait: 0.15, called: -1, lastStop: 5, ding: 0 },
    { y: floorY(1), floor: 1, dir: 1, vy: 0, wait: 0.9, called: -1, lastStop: 1, ding: 0 }
  ];
}

function makeSpy(x, floor) {
  return {
    x: x,
    y: floorY(floor),
    floor: floor,
    face: Math.random() < 0.5 ? -1 : 1,
    vx: 0,
    vy: 0,
    walk: rand(0, 8),
    fireCd: rand(0.4, 1.4),
    think: rand(0.2, 1),
    ride: -1,
    dest: 0,
    lastShaft: 0,
    dead: false,
    t: 0
  };
}

function makeDocs(n) {
  var a = [], i, s, used = {}, key;
  for (i = 0; i < DOC_SPOTS.length && a.length < n; i++) {
    s = DOC_SPOTS[i];
    key = s.floor + ':' + s.x;
    if (used[key]) continue;
    used[key] = 1;
    a.push({ x: s.x, floor: s.floor, got: false, bob: rand(0, TAU) });
  }
  return a;
}

function pickSpySpot(elevYs, px, pf) {
  var tries = 16, floor, x, si;
  while (tries--) {
    floor = 1 + ((Math.random() * (FLOORS_N - 1)) | 0);
    x = hallwayX((Math.random() * 8) | 0) + rand(-10, 10);
    if (inShaftAt(x) >= 0) continue;
    if (!solidAt(x, floor, elevYs)) continue;
    if (pf === floor && Math.abs(px - x) < 90) continue;
    si = inShaftAt(x);
    if (si >= 0) continue;
    return { x: x, floor: floor };
  }
  return { x: 152, floor: 4 };
}

function selfCheck() {
  var h, e, p, ys, docs;

  if (FLOORS_N !== 8) throw new Error('8 floors');
  if (SHAFTS.length !== 3) throw new Error('3 shafts');
  if (LIVES !== 3) throw new Error('3 lives');
  if (floorY(7) >= floorY(0)) throw new Error('top above ground');
  if (Math.abs(floorY(7) - TOP) > 0.01) throw new Error('roof y');
  if (Math.abs(floorY(0) - (TOP + 7 * FLOOR_H)) > 0.01) throw new Error('ground y');
  if (inShaftAt(elevCenter(0)) !== 0) throw new Error('shaft0 center');
  if (inShaftAt(elevCenter(1)) !== 1) throw new Error('shaft1 center');
  if (inShaftAt(elevCenter(2)) !== 2) throw new Error('shaft2 center');
  if (inShaftAt(50) !== -1) throw new Error('hallway not shaft');
  if (nearShaft(50, 8) !== -1) throw new Error('spawn not near shaft');
  if (nearShaft(80, 12) !== 0) throw new Error('near shaft0');

  h = jumpHeight();
  if (h < 22 || h > 40) throw new Error('jump height window');
  if (h >= FLOOR_H - 8) throw new Error('jump must not skip a floor');

  ys = [floorY(2), floorY(5), floorY(1)];
  if (!solidAt(50, 7, ys)) throw new Error('spawn solid');
  if (solidAt(elevCenter(0), 7, ys)) throw new Error('open shaft not solid');
  if (!solidAt(elevCenter(0), 2, ys)) throw new Error('covered shaft solid');

  e = makeElevs();
  if (e.length !== 3) throw new Error('3 elevs');
  p = makePlayer();
  if (p.floor !== 7 || p.state !== 'walk') throw new Error('player spawn');
  if (p.y !== floorY(7)) throw new Error('spawn y');

  if (crushedBy(elevCenter(0), floorY(3), true, elevCenter(0), floorY(3))) {
    throw new Error('rider not crushed');
  }
  if (crushedBy(elevCenter(0), floorY(3), false, elevCenter(0), floorY(3))) {
    throw new Error('standing on plat not crushed');
  }
  if (!crushedBy(elevCenter(0), floorY(3), false, elevCenter(0), floorY(3) - 14)) {
    throw new Error('descending plat crushes');
  }
  if (crushedBy(elevCenter(0), floorY(3) - 16, false, elevCenter(0), floorY(3))) {
    throw new Error('landing on plat not crush');
  }
  if (crushedBy(50, floorY(3), false, elevCenter(0), floorY(3) - 14)) {
    throw new Error('hallway not crushed');
  }

  if (docCount(1, false) !== 3) throw new Error('stealth r1 docs');
  if (docCount(1, true) !== 6) throw new Error('brawl docs');
  if (docCount(4, false) !== 6) throw new Error('stealth cap docs');
  if (spyCap(1, true) <= spyCap(1, false)) throw new Error('brawl more spies');
  if (elevSpeed(1, true) <= elevSpeed(1, false)) throw new Error('brawl faster elev');
  if (elevSpeed(2, false) <= elevSpeed(1, false)) throw new Error('round speeds elev');
  if (spySpeed(1, true) <= spySpeed(1, false)) throw new Error('brawl faster spies');
  if (elevWait(true) >= elevWait(false)) throw new Error('brawl shorter wait');
  if (spawnInterval(1, true) >= spawnInterval(1, false)) throw new Error('brawl denser spawn');

  docs = makeDocs(4);
  if (docs.length !== 4) throw new Error('4 docs');
  if (docs[0].got) throw new Error('docs start ungot');

  if (inCar(CAR.x + 8, 0, 3, 3) !== true) throw new Error('car enter');
  if (inCar(CAR.x + 8, 0, 2, 3)) throw new Error('car needs docs');
  if (inCar(CAR.x + 8, 1, 3, 3)) throw new Error('car ground only');
  if (inCar(50, 0, 3, 3)) throw new Error('car zone');

  if (!bulletHitsBody(100, floorY(3) - 12, 100, floorY(3))) throw new Error('bullet body');
  if (bulletHitsBody(140, floorY(3) - 12, 100, floorY(3))) throw new Error('bullet miss');
  if (bulletHitsBody(100, floorY(3) - 40, 100, floorY(3))) throw new Error('jumped over bullet');

  if (alignedFloor(floorY(4), 2) !== 4) throw new Error('align 4');
  if (alignedFloor(floorY(4) + 20, 5) !== -1) throw new Error('between floors');
  if (nearestFloor(floorY(2) + 4) !== 2) throw new Error('nearest');

  if (CAR.floor !== 0) throw new Error('car ground');
  if (SPAWN.floor !== FLOORS_N - 1) throw new Error('spawn roof');
  if (DOC_SPOTS.length < 6) throw new Error('doc spots');
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
var btnStealth = document.getElementById('btn-stealth');
var btnBrawl = document.getElementById('btn-brawl');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnLeft = document.getElementById('btn-left');
var btnRight = document.getElementById('btn-right');
var btnUp = document.getElementById('btn-up');
var btnDown = document.getElementById('btn-down');
var btnJump = document.getElementById('btn-jump');
var btnFire = document.getElementById('btn-fire');
var scoreEl = document.getElementById('score');
var roundEl = document.getElementById('round');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var docsBar = document.getElementById('docs-bar');
var docsN = document.getElementById('docs-n');
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

var keys = { l: false, r: false, u: false, d: false, fire: false, jmp: false };

var G = {
  mode: 'title',
  kind: 'stealth',
  brawl: false,
  clock: 0,
  round: 1,
  lives: LIVES,
  score: 0,
  bestS: 0,
  bestB: 0,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  player: makePlayer(),
  elevs: makeElevs(),
  spies: [],
  docs: [],
  bullets: [],
  windows: [],
  got: 0,
  need: 3,
  spawnCd: 2,
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flash: 0,
  flashRgb: HOT,
  clearT: 0,
  jumpBuf: 0,
  why: '',
  muzzle: 0,
  carWarn: 0
};

function reduceMotion() {
  return motionQ.matches;
}

function liveYs() {
  return [G.elevs[0].y, G.elevs[1].y, G.elevs[2].y];
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
  shot: function () {
    this.ensure();
    this.beep(880, 0.045, 'square', 0.05, 220);
    this.noise(0.04, 0.07, 1800, 'highpass');
  },
  enemyShot: function () {
    this.ensure();
    this.beep(420, 0.05, 'square', 0.04, 160);
    this.noise(0.035, 0.05, 900, 'bandpass');
  },
  hit: function (combo) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.07;
    this.beep(520 * p, 0.07, 'square', 0.07, 880 * p);
    this.beep(740 * p, 0.1, 'triangle', 0.045, 1200 * p);
    this.noise(0.07, 0.08, 1400, 'highpass');
  },
  ding: function () {
    this.ensure();
    this.beep(988, 0.07, 'triangle', 0.07, 1318);
    this.beep(1318, 0.14, 'sine', 0.045, 1760);
  },
  elevDing: function () {
    this.ensure();
    this.beep(784, 0.05, 'sine', 0.04);
    this.beep(988, 0.09, 'triangle', 0.03);
  },
  hop: function () {
    this.ensure();
    this.beep(280, 0.055, 'square', 0.045, 520);
    this.noise(0.035, 0.035, 1600, 'highpass');
  },
  land: function () {
    this.ensure();
    this.noise(0.045, 0.045, 380, 'bandpass');
    this.beep(150, 0.04, 'sine', 0.025, 70);
  },
  die: function () {
    this.ensure();
    this.noise(0.16, 0.12, 260, 'lowpass');
    this.beep(300, 0.2, 'sawtooth', 0.06, 70);
    this.beep(160, 0.16, 'square', 0.04, 50);
  },
  crush: function () {
    this.ensure();
    this.noise(0.18, 0.14, 180, 'lowpass');
    this.beep(90, 0.16, 'sawtooth', 0.07, 40);
  },
  clear: function () {
    this.ensure();
    this.beep(392, 0.1, 'square', 0.06, 523);
    this.beep(523, 0.12, 'square', 0.055, 659);
    this.beep(784, 0.22, 'triangle', 0.05, 1046);
  },
  over: function () {
    this.ensure();
    this.beep(196, 0.18, 'sawtooth', 0.05, 98);
    this.beep(130, 0.28, 'square', 0.04, 60);
  },
  start: function () {
    this.ensure();
    this.beep(330, 0.08, 'square', 0.04, 440);
    this.beep(440, 0.1, 'triangle', 0.04, 660);
  },
  combo: function (n) {
    this.ensure();
    this.beep(440 + n * 40, 0.08, 'square', 0.05, 880 + n * 50);
  },
  car: function () {
    this.ensure();
    this.beep(180, 0.12, 'sawtooth', 0.04, 90);
    this.noise(0.1, 0.05, 220, 'lowpass');
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
      G.bestS = o.s | 0;
      G.bestB = o.b | 0;
      return;
    }
    if (typeof o === 'number') {
      G.bestS = o | 0;
      G.bestB = o | 0;
    }
  } catch (err) { /* ignore */ }
}

function persistBest() {
  var cur = G.brawl ? G.bestB : G.bestS;
  if (G.score > cur) {
    if (G.brawl) G.bestB = G.score;
    else G.bestS = G.score;
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ s: G.bestS, b: G.bestB }));
  } catch (err) { /* ignore */ }
}

function currentBest() {
  return G.brawl ? G.bestB : G.bestS;
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
  stageEl.classList.remove('hop');
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
  if (particles.length > 90) particles.splice(0, 20);
  for (i = 0; i < n; i++) {
    particles.push({
      x: x, y: y,
      vx: rand(-1, 1) * spd,
      vy: rand(-1.15, 0.25) * spd,
      t: life * rand(0.55, 1.2),
      max: life,
      r: rand(1.05, 2.5),
      rgb: rgb,
      g: grav || 22
    });
  }
}

function spark(x, y, rgb, n) {
  var i;
  if (sparks.length > 70) sparks.splice(0, 16);
  for (i = 0; i < n; i++) {
    sparks.push({
      x: x, y: y,
      vx: rand(-1, 1) * 70,
      vy: rand(-90, -10),
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
    toast('连击 ×' + G.combo, false, true);
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

function syncDocs() {
  var t = G.need ? G.got / G.need : 0;
  docsBar.style.transform = 'scaleX(' + clamp(t, 0, 1) + ')';
  docsBar.classList.toggle('on', G.got >= G.need && G.need > 0);
  docsN.textContent = G.got + '/' + G.need;
}

function hudPlay() {
  scoreEl.textContent = String(G.score);
  roundEl.textContent = String(G.round);
  bestEl.textContent = String(currentBest());
  comboEl.textContent = '×' + Math.max(1, G.combo);
  renderPips();
  modeLabel.textContent = G.brawl ? '乱战' : '潜入';
  modeLabel.classList.toggle('brawl', G.brawl);
  syncDocs();
  if (G.mode === 'play') {
    hintEl.textContent = G.brawl
      ? '乱战 · 间谍更多电梯更快 · 空格开枪 · R 重开'
      : '收齐红档案 · 坐电梯下楼 · 钻进红车 · 中弹或轧到丢命';
  }
}

function makeWindows() {
  var a = [], i, j, x;
  for (i = 1; i < FLOORS_N; i++) {
    for (j = 0; j < 9; j++) {
      x = 22 + j * 42;
      if (inShaftAt(x + 10) >= 0) continue;
      a.push({ x: x, floor: i, on: Math.random() > 0.42, t: rand(0, 8) });
    }
  }
  return a;
}

function resetFx() {
  particles.length = 0;
  sparks.length = 0;
  floats.length = 0;
  rings.length = 0;
  G.stop = 0;
  G.shake = 0;
  G.kickX = 0;
  G.kickY = 0;
  G.flash = 0;
  G.muzzle = 0;
}

function seedSpies() {
  var n = G.brawl ? Math.min(spyCap(G.round, true), 5 + G.round) : Math.min(spyCap(G.round, false), 2 + G.round);
  var i, spot, ys = liveYs();
  G.spies = [];
  for (i = 0; i < n; i++) {
    spot = pickSpySpot(ys, SPAWN.x, SPAWN.floor);
    G.spies.push(makeSpy(spot.x, spot.floor));
  }
}

function resetLevel(attract) {
  G.elevs = makeElevs();
  G.need = docCount(G.round, G.brawl);
  G.docs = makeDocs(G.need);
  G.got = 0;
  G.player = makePlayer();
  G.bullets = [];
  G.windows = makeWindows();
  G.spawnCd = attract ? 0.6 : spawnInterval(G.round, G.brawl) * 0.55;
  G.clearT = 0;
  G.combo = 0;
  G.comboAge = 0;
  G.jumpBuf = 0;
  G.carWarn = 0;
  seedSpies();
  if (!attract) resetFx();
}

function showTitle() {
  G.mode = 'title';
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel';
  ovTitle.textContent = '电梯';
  ovLead.textContent = '楼里坐电梯，开门对射。红档案全收齐，下楼钻进红车就撤。';
  ovOps.textContent = '方向键或 WASD 走 · 上/下坐电梯 · 空格开枪 · Z/X 跳 · R 重开 · M 静音';
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
  hintEl.textContent = '走楼层 · 坐电梯 · 空格开枪 · 收红档案 · 下楼逃上车';
  G.brawl = false;
  G.kind = 'stealth';
  G.round = 1;
  resetLevel(true);
}

function showOver() {
  G.mode = 'over';
  persistBest();
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel lose';
  ovTitle.textContent = '命尽';
  ovLead.textContent = '第 ' + G.round + ' 栋 · ' + G.score + ' 分 · 连击最高 ×' + G.maxCombo +
    (G.why ? ' · ' + whyText(G.why) : '');
  ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
  audio.over();
  hintEl.textContent = 'R 重开 · 顶栏重开随时可用';
}

function whyText(w) {
  if (w === 'shot') return '中弹了';
  if (w === 'crush') return '被电梯轧到';
  if (w === 'fall') return '摔下去了';
  return '';
}

function startRun(kind) {
  G.kind = kind;
  G.brawl = kind === 'brawl';
  G.mode = 'play';
  G.clock = 0;
  G.round = 1;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  G.maxCombo = 0;
  G.comboAge = 0;
  G.why = '';
  resetLevel(false);
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  canvas.focus({ preventScroll: true });
  audio.start();
  hudPlay();
  toast(G.brawl ? '乱战 · 多间谍' : '潜入 · 收档案', false, !G.brawl);
}

function retry() {
  if (G.mode === 'title') startRun('stealth');
  else startRun(G.kind);
}

function doJump(p) {
  p.vy = -JUMP_V;
  p.grounded = false;
  p.state = 'jump';
  p.coyote = 0;
  p.ride = -1;
  p.squash = 0.78;
  audio.hop();
  burst(p.x, p.y, 4, [200, 200, 220], 40, 0.22, 30);
  hitStop(0.028);
}

function canJump(p) {
  return (p.grounded || p.coyote > 0 || p.ride >= 0) && p.state !== 'dead' && p.state !== 'win';
}

function landOn(p, floor, y) {
  var was = p.state;
  p.y = y;
  p.vy = 0;
  p.grounded = true;
  p.floor = floor;
  p.state = 'walk';
  p.coyote = COYOTE;
  p.squash = 1.18;
  if (was === 'jump' || was === 'fall') audio.land();
}

function tryBoard(p) {
  var i, e, c;
  if (p.ride >= 0) return;
  if (p.vy < -50) return;
  for (i = 0; i < SHAFTS.length; i++) {
    e = G.elevs[i];
    c = elevCenter(i);
    if (Math.abs(p.x - c) > SHAFTS[i].w * 0.5 - 1) continue;
    if (p.y >= e.y - 9 && p.y <= e.y + 10) {
      p.ride = i;
      p.y = e.y;
      p.vy = 0;
      p.grounded = true;
      p.state = 'walk';
      p.floor = alignedFloor(e.y, 14);
      p.squash = 1.12;
      return;
    }
  }
}

function shootPlayer(p) {
  var n = 0, i;
  if (p.fireCd > 0) return;
  for (i = 0; i < G.bullets.length; i++) if (G.bullets[i].from === 'p') n++;
  if (n >= 3) return;
  p.fireCd = SHOT_CD;
  G.bullets.push({
    x: p.x + p.face * 11,
    y: p.y - 13,
    vx: p.face * P_SHOT,
    from: 'p',
    life: 0.85
  });
  G.muzzle = 0.06;
  audio.shot();
  spark(p.x + p.face * 12, p.y - 13, CYN, 3);
}

function spyShoot(s) {
  var p = G.player;
  if (s.fireCd > 0 || s.dead) return;
  if (p.state === 'dead' || p.state === 'win') return;
  if (Math.abs(s.y - p.y) > 20) return;
  if ((p.x - s.x) * s.face < 10) return;
  if (Math.abs(p.x - s.x) > 240) return;
  s.fireCd = G.brawl ? rand(0.65, 1.15) : rand(1.05, 1.75);
  G.bullets.push({
    x: s.x + s.face * 10,
    y: s.y - 12,
    vx: s.face * E_SHOT,
    from: 'e',
    life: 1.15
  });
  audio.enemyShot();
}

function killSpy(s) {
  if (s.dead) return;
  s.dead = true;
  s.t = 0.42;
  s.vy = -70;
  s.vx = -s.face * 50;
  s.ride = -1;
  bumpCombo();
  addScore(100 * G.combo, s.x, s.y - 8);
  audio.hit(G.combo);
  hitStop(0.052);
  kick(3.2);
  flash(CYN, 0.09);
  spark(s.x, s.y - 12, GOLD, 12);
  burst(s.x, s.y - 10, 10, MAG, 90, 0.38, 40);
  ringAt(s.x, s.y - 12, CYN);
}

function kill(why) {
  var p = G.player;
  if (G.mode !== 'play') return;
  if (p.state === 'dead' || p.state === 'win') return;
  if (p.inv > 0) return;
  p.state = 'dead';
  p.why = why;
  G.why = why;
  p.deadT = DIE_T;
  p.ride = -1;
  p.grounded = false;
  p.vy = why === 'crush' ? 30 : -90;
  p.vx = -p.face * 55;
  G.lives -= 1;
  G.combo = 0;
  if (why === 'crush') audio.crush();
  else audio.die();
  hitStop(why === 'crush' ? 0.078 : 0.058);
  shake(why === 'crush' ? 11 : 7);
  flash(MAG, 0.2);
  burst(p.x, p.y - 8, 14, MAG, 110, 0.42, 50);
  spark(p.x, p.y - 10, HOT, 10);
  stageEl.classList.remove('die');
  void stageEl.offsetWidth;
  stageEl.classList.add('die');
  setTimeout(function () { stageEl.classList.remove('die'); }, 360);
  hudPlay();
  toast(whyText(why), true, false);
}

function respawn() {
  var p = G.player;
  var f = p.floor >= 0 ? p.floor : nearestFloor(p.y);
  var x = p.x;
  var si = inShaftAt(x);
  if (si >= 0) {
    x = SHAFTS[si].x - 14;
    if (x < 22) x = SHAFTS[si].x + SHAFTS[si].w + 14;
  }
  G.player = makePlayer(x, f);
  G.player.inv = INVULN;
  G.bullets = [];
  hudPlay();
}

function finishDead() {
  if (G.lives <= 0) {
    showOver();
    return;
  }
  respawn();
}

function doClear() {
  var bonus = 800 + 250 * G.round;
  G.player.state = 'win';
  G.player.ride = -1;
  G.clearT = 1.28;
  addScore(bonus, G.player.x, G.player.y, '撤离 +' + bonus);
  audio.clear();
  audio.car();
  hitStop(0.07);
  kick(5);
  flash(GOLD, 0.16);
  burst(G.player.x, G.player.y - 8, 16, GOLD, 100, 0.5, 20);
  ringAt(G.player.x, G.player.y - 12, HOT);
  toast('撤离成功', false, true);
  stageEl.classList.remove('clear');
  void stageEl.offsetWidth;
  stageEl.classList.add('clear');
  setTimeout(function () { stageEl.classList.remove('clear'); }, 320);
}

function nextRound() {
  G.round += 1;
  resetLevel(false);
  hudPlay();
  toast('第 ' + G.round + ' 栋', false, true);
  audio.start();
}

function dingElev(e) {
  if (G.mode !== 'play') return;
  e.ding = 0.22;
  audio.elevDing();
  ringAt(e._cx || 0, e.y - 8, GOLD);
}

/* ---- sim ---- */
function tickElev(e, dt, id) {
  var riding = G.player.ride === id && G.player.state !== 'dead' && G.player.state !== 'win';
  var spd = elevSpeed(G.round, G.brawl);
  var af, ty, waitT = elevWait(G.brawl);
  var topY = floorY(FLOORS_N - 1);
  var botY = floorY(0);
  e._cx = elevCenter(id);

  if (riding) {
    e.called = -1;
    if (keys.u) {
      e.dir = 1;
      e.vy = -spd;
      e.wait = 0;
    } else if (keys.d) {
      e.dir = -1;
      e.vy = spd;
      e.wait = 0;
    } else {
      af = alignedFloor(e.y, Math.max(3.5, Math.abs(e.vy) * dt + 2));
      if (af >= 0) {
        if (Math.abs(e.vy) > 8) dingElev(e);
        e.y = floorY(af);
        e.vy = 0;
        e.floor = af;
        e.lastStop = af;
      }
    }
    e.y += e.vy * dt;
  } else if (e.called >= 0) {
    ty = floorY(e.called);
    if (Math.abs(e.y - ty) <= spd * dt + 2.4) {
      e.y = ty;
      e.vy = 0;
      e.floor = e.called;
      e.lastStop = e.called;
      e.called = -1;
      e.wait = waitT;
      dingElev(e);
    } else {
      e.vy = ty < e.y ? -spd : spd;
      e.y += e.vy * dt;
      e.wait = 0;
    }
  } else if (e.wait > 0) {
    e.wait -= dt;
    e.vy = 0;
    if (e.wait <= 0) {
      if (e.floor >= FLOORS_N - 1) e.dir = -1;
      else if (e.floor <= 0) e.dir = 1;
    }
  } else {
    e.vy = e.dir > 0 ? -spd : spd;
    e.y += e.vy * dt;
    af = alignedFloor(e.y, Math.abs(e.vy) * dt + 2.4);
    if (af >= 0 && af !== e.lastStop) {
      e.y = floorY(af);
      e.floor = af;
      e.lastStop = af;
      e.wait = waitT;
      e.vy = 0;
      dingElev(e);
      if (af >= FLOORS_N - 1) e.dir = -1;
      if (af <= 0) e.dir = 1;
    }
  }

  if (e.y < topY) {
    e.y = topY;
    e.dir = -1;
    e.floor = FLOORS_N - 1;
    e.lastStop = e.floor;
    e.vy = 0;
    e.wait = waitT;
  }
  if (e.y > botY) {
    e.y = botY;
    e.dir = 1;
    e.floor = 0;
    e.lastStop = e.floor;
    e.vy = 0;
    e.wait = waitT;
  }
  if (e.ding > 0) e.ding -= dt;
}

function tickPlayer(dt) {
  var p = G.player;
  var dir, nx, si, e, af, prev, i, fy, ys, calling;

  if (p.inv > 0) p.inv -= dt;
  if (p.fireCd > 0) p.fireCd -= dt;
  p.squash = lerp(p.squash, 1, 1 - Math.pow(0.0008, dt));
  if (G.jumpBuf > 0) G.jumpBuf -= dt;

  if (p.state === 'dead') {
    p.vy += GRAV * dt;
    p.x = clamp(p.x + p.vx * dt, 16, WORLD_W - 16);
    p.y += p.vy * dt;
    p.deadT -= dt;
    if (p.deadT <= 0) finishDead();
    return;
  }
  if (p.state === 'win') return;

  if (keys.fire) shootPlayer(p);

  dir = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
  if (dir) {
    p.face = dir;
    p.walk += dt * 10;
  }

  calling = false;
  si = nearShaft(p.x, 20);
  if (p.grounded && p.ride < 0 && si >= 0 && (keys.u || keys.d) && inShaftAt(p.x) < 0) {
    G.elevs[si].called = p.floor >= 0 ? p.floor : nearestFloor(p.y);
    calling = keys.u && !keys.jmp;
  }

  if (p.ride >= 0) {
    e = G.elevs[p.ride];
    p.y = e.y;
    p.vy = e.vy;
    p.grounded = true;
    p.floor = alignedFloor(e.y, 12);
    p.vx = dir * WALK;
    nx = p.x + p.vx * dt;
    af = alignedFloor(e.y, 7);
    if (dir && af >= 0 && solidAt(nx, af, liveYs()) && inShaftAt(nx) < 0) {
      p.x = nx;
      p.ride = -1;
      p.floor = af;
      p.y = floorY(af);
      p.vy = 0;
    } else {
      si = p.ride;
      p.x = clamp(nx, SHAFTS[si].x + 7, SHAFTS[si].x + SHAFTS[si].w - 7);
    }
    if (keys.jmp && G.jumpBuf > 0) {
      p.ride = -1;
      doJump(p);
      G.jumpBuf = 0;
    }
    return;
  }

  if (G.jumpBuf > 0 && canJump(p) && !calling) {
    doJump(p);
    G.jumpBuf = 0;
  }

  p.vx = dir * WALK * (p.grounded ? 1 : 0.9);
  nx = clamp(p.x + p.vx * dt, 16, WORLD_W - 16);
  ys = liveYs();

  if (p.grounded && p.floor >= 0) {
    if (solidAt(nx, p.floor, ys) || inShaftAt(nx) >= 0) {
      p.x = nx;
    }
    if (!solidAt(p.x, p.floor, ys)) {
      p.grounded = false;
      p.state = 'fall';
      p.vy = 24;
      p.floor = -1;
    } else {
      p.y = floorY(p.floor);
      p.coyote = COYOTE;
      tryBoard(p);
    }
  } else {
    p.x = nx;
    if (p.coyote > 0) p.coyote -= dt;
    p.vy = Math.min(MAX_FALL, p.vy + GRAV * dt);
    prev = p.y;
    p.y += p.vy * dt;
    if (p.vy < 0) {
      for (i = 0; i < FLOORS_N; i++) {
        fy = floorY(i) - 8;
        if (prev - PH > fy && p.y - PH <= fy && solidAt(p.x, i, ys)) {
          p.y = fy + PH + 0.2;
          p.vy = 20;
          break;
        }
      }
    }
    if (p.vy >= 0) {
      tryBoard(p);
      if (p.ride < 0) {
        for (i = 0; i < FLOORS_N; i++) {
          if (!solidAt(p.x, i, ys)) continue;
          fy = floorY(i);
          if (prev <= fy + 3 && p.y >= fy && p.y < fy + 16) {
            landOn(p, i, fy);
            break;
          }
        }
      }
    }
    if (p.y > WORLD_H - 6) {
      kill('fall');
      return;
    }
  }
}

function spyAlight(s, floor, si) {
  var left = SHAFTS[si].x - 13;
  var right = SHAFTS[si].x + SHAFTS[si].w + 13;
  s.ride = -1;
  s.floor = floor;
  s.y = floorY(floor);
  s.vy = 0;
  if (s.face < 0) s.x = left;
  else s.x = right;
  if (s.x < 20) s.x = right;
  if (s.x > WORLD_W - 20) s.x = left;
}

function tryEnemyBoard(s) {
  var i, e, c;
  if (s.ride >= 0 || s.dead) return;
  for (i = 0; i < SHAFTS.length; i++) {
    e = G.elevs[i];
    c = elevCenter(i);
    if (Math.abs(s.x - c) > SHAFTS[i].w * 0.5 - 2) continue;
    if (Math.abs(s.y - e.y) > 7) continue;
    s.ride = i;
    s.lastShaft = i;
    s.dest = (Math.random() * FLOORS_N) | 0;
    if (s.dest === s.floor) s.dest = s.floor > 3 ? 0 : FLOORS_N - 1;
    if (G.player.ride !== i) e.called = s.dest;
    s.x = c + rand(-4, 4);
    s.y = e.y;
    return;
  }
}

function tickSpy(s, dt) {
  var p = G.player;
  var spd, nx, ys, af, e;
  if (s.dead) {
    s.t -= dt;
    s.vy += GRAV * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    return;
  }
  s.fireCd -= dt;
  s.think -= dt;
  s.walk += dt * 8;
  spd = spySpeed(G.round, G.brawl);

  if (s.ride >= 0) {
    e = G.elevs[s.ride];
    s.y = e.y;
    s.x = lerp(s.x, elevCenter(s.ride), 1 - Math.pow(0.02, dt));
    af = alignedFloor(e.y, 6);
    if (p.state !== 'dead' && Math.abs(s.y - p.y) < 20) {
      s.face = p.x >= s.x ? 1 : -1;
      if (s.fireCd <= 0 && Math.random() < 0.35) spyShoot(s);
    }
    if (af === s.dest && Math.abs(e.vy) < 8) {
      spyAlight(s, af, s.lastShaft);
    }
    return;
  }

  if (s.think <= 0) {
    s.think = rand(0.35, 1.1);
    if (p.state !== 'dead' && s.floor === p.floor && p.floor >= 0) {
      s.face = p.x > s.x ? 1 : -1;
    } else if (Math.random() < 0.25) {
      s.face *= -1;
    }
    if (Math.random() < (G.brawl ? 0.38 : 0.2)) tryEnemyBoard(s);
    if (s.ride >= 0) return;
  }

  if (p.state !== 'dead' && s.floor === p.floor && p.floor >= 0) {
    s.face = p.x > s.x ? 1 : -1;
    if (Math.abs(p.x - s.x) < 220 && s.fireCd <= 0) spyShoot(s);
    s.vx = s.face * spd;
  } else {
    s.vx = s.face * spd * 0.72;
  }

  ys = liveYs();
  nx = s.x + s.vx * dt;
  if (s.floor >= 0 && !solidAt(nx, s.floor, ys)) {
    s.face *= -1;
    tryEnemyBoard(s);
  } else {
    s.x = clamp(nx, 18, WORLD_W - 18);
    if (inShaftAt(s.x) >= 0) tryEnemyBoard(s);
  }
  if (s.floor >= 0) s.y = floorY(s.floor);
}

function tickBullets(dt) {
  var i, b, j, s, p;
  p = G.player;
  for (i = G.bullets.length - 1; i >= 0; i--) {
    b = G.bullets[i];
    b.x += b.vx * dt;
    b.life -= dt;
    if (b.life <= 0 || b.x < 8 || b.x > WORLD_W - 8) {
      G.bullets.splice(i, 1);
      continue;
    }
    if (b.from === 'p') {
      for (j = 0; j < G.spies.length; j++) {
        s = G.spies[j];
        if (s.dead) continue;
        if (bulletHitsBody(b.x, b.y, s.x, s.y)) {
          killSpy(s);
          G.bullets.splice(i, 1);
          break;
        }
      }
    } else if (G.mode === 'play' && p.state !== 'dead' && p.state !== 'win') {
      if (p.inv <= 0 && bulletHitsBody(b.x, b.y, p.x, p.y)) {
        G.bullets.splice(i, 1);
        spark(p.x, b.y, MAG, 8);
        kill('shot');
      }
    }
  }
}

function tickCrush() {
  var p = G.player, i, e;
  if (G.mode !== 'play' || p.state === 'dead' || p.state === 'win') return;
  for (i = 0; i < G.elevs.length; i++) {
    e = G.elevs[i];
    if (crushedBy(p.x, p.y, p.ride === i, elevCenter(i), e.y)) {
      kill('crush');
      return;
    }
  }
}

function tryDocs() {
  var i, d, p = G.player;
  if (G.mode !== 'play') return;
  if (p.state === 'dead' || p.state === 'win') return;
  if (p.floor < 0) return;
  for (i = 0; i < G.docs.length; i++) {
    d = G.docs[i];
    if (d.got) continue;
    if (d.floor !== p.floor) continue;
    if (Math.abs(d.x - p.x) > 14) continue;
    d.got = true;
    G.got += 1;
    addScore(250, d.x, p.y - 8, '档案');
    audio.ding();
    hitStop(0.034);
    kick(2);
    spark(d.x, p.y - 14, RED, 11);
    burst(d.x, p.y - 12, 8, GOLD, 70, 0.32, 18);
    ringAt(d.x, p.y - 12, HOT);
    flash(HOT, 0.08);
    if (G.got >= G.need) toast('档案齐了 · 下楼上车', false, true);
    else toast('机密 ' + G.got + '/' + G.need, false, true);
    hudPlay();
  }
}

function tryCar() {
  var p = G.player;
  if (G.mode !== 'play' || p.state === 'dead' || p.state === 'win') return;
  if (!p.grounded) return;
  if (inCar(p.x, p.floor, G.got, G.need)) {
    doClear();
    return;
  }
  if (p.floor === 0 && p.x >= CAR.x - 6 && p.x <= CAR.x + CAR.w + 8 && G.got < G.need) {
    if (G.carWarn <= 0) {
      toast('还缺档案 ' + G.got + '/' + G.need, true, false);
      G.carWarn = 1.6;
    }
  }
}

function tickSpawn(dt) {
  var cap, spot, ys, live, i;
  if (G.mode === 'over') return;
  G.spawnCd -= dt;
  live = 0;
  for (i = 0; i < G.spies.length; i++) if (!G.spies[i].dead) live++;
  cap = spyCap(G.round, G.brawl);
  if (G.spawnCd <= 0 && live < cap) {
    ys = liveYs();
    spot = pickSpySpot(ys, G.player.x, G.player.floor);
    G.spies.push(makeSpy(spot.x, spot.floor));
    G.spawnCd = spawnInterval(G.round, G.brawl);
  }
  if (G.spies.length > 18) {
    G.spies = G.spies.filter(function (s) { return !s.dead || s.t > 0; });
  }
}

function tickFx(dt) {
  var i, o;
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
  G.kickX = lerp(G.kickX, 0, 1 - Math.pow(0.0002, dt));
  G.kickY = lerp(G.kickY, 0, 1 - Math.pow(0.0002, dt));
  if (G.flash > 0) G.flash -= dt;
  if (G.muzzle > 0) G.muzzle -= dt;
  if (G.combo > 0) {
    G.comboAge += dt;
    if (G.comboAge > COMBO_WIN) {
      G.combo = 0;
      comboEl.textContent = '×1';
    }
  }
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
    o.vy += 140 * dt;
    if (o.t <= 0) sparks.splice(i, 1);
  }
  for (i = rings.length - 1; i >= 0; i--) {
    o = rings[i];
    o.t += dt;
    o.r += dt * 70;
    if (o.t > 0.28) rings.splice(i, 1);
  }
  for (i = floats.length - 1; i >= 0; i--) {
    o = floats[i];
    o.t += dt;
    o.y -= 28 * dt;
    if (o.t > 0.7) floats.splice(i, 1);
  }
}

function tick(dt) {
  var i;
  G.clock += dt;
  if (G.carWarn > 0) G.carWarn -= dt;

  for (i = 0; i < G.elevs.length; i++) tickElev(G.elevs[i], dt, i);

  if (G.mode === 'play') {
    if (G.player.state === 'win') {
      G.clearT -= dt;
      if (G.clearT <= 0) nextRound();
    } else {
      tickPlayer(dt);
      tickCrush();
      tryDocs();
      tryCar();
    }
  }

  for (i = 0; i < G.spies.length; i++) tickSpy(G.spies[i], dt);
  G.spies = G.spies.filter(function (s) { return !s.dead || s.t > 0; });

  tickBullets(dt);
  tickSpawn(dt);
  tickFx(dt);
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
  var g, i, w, lit;
  ctx.fillStyle = '#07040c';
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(70), sy(40), 8, sx(70), sy(40), 200 * L.s);
  g.addColorStop(0, 'rgba(255,176,24,0.16)');
  g.addColorStop(1, 'rgba(255,176,24,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(330), sy(80), 8, sx(330), sy(80), 160 * L.s);
  g.addColorStop(0, 'rgba(0,240,255,0.08)');
  g.addColorStop(1, 'rgba(0,240,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.fillStyle = '#0c0a12';
  ctx.fillRect(sx(10), sy(12), (WORLD_W - 20) * L.s, (WORLD_H - 18) * L.s);

  ctx.fillStyle = '#141018';
  ctx.fillRect(sx(8), sy(10), 10 * L.s, (WORLD_H - 16) * L.s);
  ctx.fillRect(sx(WORLD_W - 18), sy(10), 10 * L.s, (WORLD_H - 16) * L.s);

  ctx.strokeStyle = 'rgba(255,176,24,0.22)';
  ctx.lineWidth = 1.3 * L.s;
  ctx.strokeRect(sx(10), sy(12), (WORLD_W - 20) * L.s, (WORLD_H - 18) * L.s);

  ctx.fillStyle = '#161018';
  ctx.fillRect(sx(10), sy(floorY(0) + 7), (WORLD_W - 20) * L.s, (WORLD_H - floorY(0) - 14) * L.s);
  ctx.fillStyle = 'rgba(255,176,24,0.12)';
  ctx.fillRect(sx(10), sy(floorY(0) + 7), (WORLD_W - 20) * L.s, 2 * L.s);
  ctx.fillStyle = 'rgba(255,58,58,0.18)';
  ctx.fillRect(sx(CAR.x - 8), sy(floorY(0) + 8), (CAR.w + 20) * L.s, 3 * L.s);

  for (i = 0; i < G.windows.length; i++) {
    w = G.windows[i];
    lit = Math.sin(G.clock * 0.35 + w.t) > -0.15;
    ctx.fillStyle = lit ? 'rgba(255,201,74,0.16)' : 'rgba(20,18,32,0.6)';
    ctx.fillRect(sx(w.x), sy(floorY(w.floor) - 36), 14 * L.s, 18 * L.s);
    if (lit) {
      ctx.fillStyle = 'rgba(255,227,107,0.09)';
      ctx.fillRect(sx(w.x + 1), sy(floorY(w.floor) - 35), 12 * L.s, 6 * L.s);
    }
  }
}

function drawShafts() {
  var i, s, x, y0, h;
  for (i = 0; i < SHAFTS.length; i++) {
    s = SHAFTS[i];
    x = sx(s.x);
    y0 = sy(floorY(FLOORS_N - 1) - 40);
    h = (floorY(0) + 10 - (floorY(FLOORS_N - 1) - 40)) * L.s;
    ctx.fillStyle = 'rgba(4, 6, 14, 0.92)';
    ctx.fillRect(x, y0, s.w * L.s, h);
    ctx.strokeStyle = 'rgba(0,240,255,0.16)';
    ctx.lineWidth = 1 * L.s;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y0 + h);
    ctx.moveTo(x + s.w * L.s, y0);
    ctx.lineTo(x + s.w * L.s, y0 + h);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,201,74,0.28)';
    ctx.lineWidth = 1.1 * L.s;
    ctx.setLineDash([3 * L.s, 4 * L.s]);
    ctx.beginPath();
    ctx.moveTo(sx(elevCenter(i)), y0);
    ctx.lineTo(sx(elevCenter(i)), sy(floorY(0) + 8));
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawFloors() {
  var i, x, y, t, segs, a, b, si, s, x0, x1;
  for (i = 0; i < FLOORS_N; i++) {
    y = sy(floorY(i));
    segs = [{ a: 14, b: WORLD_W - 14 }];
    for (si = 0; si < SHAFTS.length; si++) {
      s = SHAFTS[si];
      t = [];
      for (a = 0; a < segs.length; a++) {
        if (s.x > segs[a].b || s.x + s.w < segs[a].a) t.push(segs[a]);
        else {
          if (s.x > segs[a].a + 2) t.push({ a: segs[a].a, b: s.x });
          if (s.x + s.w < segs[a].b - 2) t.push({ a: s.x + s.w, b: segs[a].b });
        }
      }
      segs = t;
    }
    for (a = 0; a < segs.length; a++) {
      x0 = sx(segs[a].a);
      x1 = sx(segs[a].b) - x0;
      ctx.fillStyle = '#3a2810';
      ctx.fillRect(x0, y, x1, 7 * L.s);
      ctx.fillStyle = '#ffb018';
      ctx.fillRect(x0, y, x1, 3.2 * L.s);
      ctx.fillStyle = 'rgba(255,227,107,0.55)';
      ctx.fillRect(x0, y, x1, 1.1 * L.s);
    }
    ctx.fillStyle = 'rgba(255,201,74,0.28)';
    ctx.font = 'bold ' + (7 * L.s) + 'px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(String(i), sx(12), y - 4 * L.s);
  }
}

function isDocDoor(x, floor) {
  var i, d;
  for (i = 0; i < G.docs.length; i++) {
    d = G.docs[i];
    if (!d.got && d.floor === floor && Math.abs(d.x - x) < 8) return true;
  }
  return false;
}

function drawDoors() {
  var i, d, x, y, red, h;
  h = 28 * L.s;
  for (i = 0; i < DOOR_SPOTS.length; i++) {
    d = DOOR_SPOTS[i];
    if (inShaftAt(d.x) >= 0) continue;
    red = isDocDoor(d.x, d.floor);
    x = sx(d.x - 8);
    y = sy(floorY(d.floor)) - h;
    ctx.fillStyle = red ? 'rgba(80,12,18,0.95)' : 'rgba(18,16,28,0.9)';
    ctx.fillRect(x, y, 16 * L.s, h);
    ctx.strokeStyle = red ? 'rgba(255,70,70,0.85)' : 'rgba(255,176,24,0.28)';
    ctx.lineWidth = 1.1 * L.s;
    ctx.strokeRect(x, y, 16 * L.s, h);
    ctx.fillStyle = red ? 'rgba(255,80,80,0.55)' : 'rgba(255,201,74,0.18)';
    ctx.fillRect(x + 3 * L.s, y + 8 * L.s, 3 * L.s, 5 * L.s);
    if (red) {
      ctx.fillStyle = 'rgba(255,60,60,0.18)';
      ctx.fillRect(x - 3 * L.s, y, 22 * L.s, h);
    }
  }
}

function drawDocs() {
  var i, d, x, y, bob;
  for (i = 0; i < G.docs.length; i++) {
    d = G.docs[i];
    if (d.got) continue;
    bob = Math.sin(G.clock * 5 + d.bob) * 2.2;
    x = sx(d.x);
    y = sy(floorY(d.floor) - 16 + bob);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(255,40,40,0.22)';
    ctx.beginPath();
    ctx.arc(0, 0, 10 * L.s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ff3a3a';
    ctx.fillRect(-6 * L.s, -5 * L.s, 12 * L.s, 10 * L.s);
    ctx.fillStyle = '#ffe36b';
    ctx.fillRect(-2.2 * L.s, -1.4 * L.s, 4.4 * L.s, 3.2 * L.s);
    ctx.restore();
  }
}

function drawElev(e, id) {
  var c = elevCenter(id);
  var x = sx(c);
  var y = sy(e.y);
  var w = (SHAFTS[id].w - 4) * L.s;
  var cab = (FLOOR_H - 14) * L.s;
  var glow = e.ding > 0 ? e.ding / 0.22 : 0;

  ctx.strokeStyle = 'rgba(255,201,74,0.45)';
  ctx.lineWidth = 1.4 * L.s;
  ctx.beginPath();
  ctx.moveTo(x, sy(floorY(FLOORS_N - 1) - 40));
  ctx.lineTo(x, y - cab);
  ctx.stroke();

  ctx.fillStyle = 'rgba(8, 20, 28, 0.82)';
  ctx.fillRect(x - w / 2, y - cab, w, cab);
  ctx.strokeStyle = glow ? 'rgba(255,227,107,0.95)' : 'rgba(0,240,255,0.7)';
  ctx.lineWidth = 1.6 * L.s;
  ctx.strokeRect(x - w / 2, y - cab, w, cab);

  ctx.fillStyle = '#ffb018';
  ctx.fillRect(x - w / 2 - 1 * L.s, y - 3 * L.s, w + 2 * L.s, 6 * L.s);
  ctx.fillStyle = '#ffe36b';
  ctx.fillRect(x - w / 2, y - 1.4 * L.s, w, 2 * L.s);

  if (glow) {
    ctx.fillStyle = rgba(GOLD, glow * 0.18);
    ctx.fillRect(x - w / 2, y - cab, w, cab);
  }
}

function drawCar() {
  var x = sx(CAR.x);
  var y = sy(floorY(0));
  var ready = G.got >= G.need;
  var pulse = ready ? 0.55 + Math.sin(G.clock * 8) * 0.25 : 0.2;
  ctx.save();
  ctx.translate(x, y);
  if (ready) {
    ctx.fillStyle = rgba(RED, 0.16 + pulse * 0.12);
    ctx.beginPath();
    ctx.ellipse(18 * L.s, -6 * L.s, 28 * L.s, 14 * L.s, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#c81828';
  ctx.fillRect(0, -14 * L.s, 42 * L.s, 12 * L.s);
  ctx.fillStyle = '#ff3a3a';
  ctx.fillRect(2 * L.s, -18 * L.s, 24 * L.s, 8 * L.s);
  ctx.fillStyle = ready ? '#7af6ff' : '#1a3040';
  ctx.fillRect(8 * L.s, -16.5 * L.s, 12 * L.s, 5 * L.s);
  ctx.fillStyle = '#ffe36b';
  ctx.beginPath();
  ctx.arc(8 * L.s, -3 * L.s, 3.1 * L.s, 0, TAU);
  ctx.arc(34 * L.s, -3 * L.s, 3.1 * L.s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#08060a';
  ctx.beginPath();
  ctx.arc(8 * L.s, -3 * L.s, 1.3 * L.s, 0, TAU);
  ctx.arc(34 * L.s, -3 * L.s, 1.3 * L.s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(GOLD, pulse);
  ctx.fillRect(40 * L.s, -12 * L.s, 3 * L.s, 3 * L.s);
  ctx.fillRect(-1 * L.s, -12 * L.s, 3 * L.s, 2.4 * L.s);
  ctx.restore();
}

function drawAgent(ax, ay, face, walk, squash, coat, hat, dead, muzzle) {
  var stride = Math.sin(walk) * (dead ? 0 : 1);
  var leg = 3.2 * L.s * stride;
  ctx.save();
  ctx.translate(sx(ax), sy(ay));
  ctx.scale(face, squash || 1);
  if (dead) ctx.rotate(0.55);

  ctx.fillStyle = '#1a1420';
  ctx.fillRect(-3.2 * L.s, -3.5 * L.s, 2.2 * L.s, 4 * L.s + leg);
  ctx.fillRect(0.8 * L.s, -3.5 * L.s, 2.2 * L.s, 4 * L.s - leg);

  ctx.fillStyle = coat;
  ctx.fillRect(-5 * L.s, -16 * L.s, 10 * L.s, 13 * L.s);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(-4.2 * L.s, -15 * L.s, 3 * L.s, 6 * L.s);

  ctx.fillStyle = '#f0d8c0';
  ctx.beginPath();
  ctx.arc(0.4 * L.s, -19 * L.s, 3.3 * L.s, 0, TAU);
  ctx.fill();

  ctx.fillStyle = hat;
  ctx.fillRect(-4.6 * L.s, -22.4 * L.s, 9.4 * L.s, 2.1 * L.s);
  ctx.fillRect(-3.2 * L.s, -25.2 * L.s, 6.6 * L.s, 3.2 * L.s);

  ctx.fillStyle = '#0a0810';
  ctx.fillRect(-1.6 * L.s, -20.2 * L.s, 4.2 * L.s, 1.1 * L.s);

  ctx.fillStyle = '#c8d0d8';
  ctx.fillRect(4.2 * L.s, -14 * L.s, 7.5 * L.s, 1.6 * L.s);
  if (muzzle) {
    ctx.fillStyle = '#fff6c8';
    ctx.beginPath();
    ctx.arc(12.4 * L.s, -13.2 * L.s, 3.4 * L.s, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlayer() {
  var p = G.player;
  if (G.mode === 'title') return;
  if (p.inv > 0 && ((G.clock * 18) | 0) % 2 === 0) return;
  drawAgent(p.x, p.y, p.face, p.walk, p.squash, '#00d8e8', '#ffe36b', p.state === 'dead', G.muzzle > 0);
}

function drawSpies() {
  var i, s;
  for (i = 0; i < G.spies.length; i++) {
    s = G.spies[i];
    if (s.dead && s.t < 0.08) continue;
    ctx.globalAlpha = s.dead ? clamp(s.t / 0.42, 0, 1) : 1;
    drawAgent(s.x, s.y, s.face, s.walk, 1, '#c02070', '#2a1020', s.dead, false);
    ctx.globalAlpha = 1;
  }
}

function drawBullets() {
  var i, b, x, y;
  for (i = 0; i < G.bullets.length; i++) {
    b = G.bullets[i];
    x = sx(b.x);
    y = sy(b.y);
    ctx.fillStyle = b.from === 'p' ? '#7af6ff' : '#ff6ad2';
    ctx.shadowColor = b.from === 'p' ? '#00f0ff' : '#ff3db8';
    ctx.shadowBlur = 8 * L.s;
    ctx.fillRect(x - 4 * L.s, y - 1.1 * L.s, 8 * L.s, 2.2 * L.s);
    ctx.shadowBlur = 0;
  }
}

function drawFx() {
  var i, o, a;
  for (i = 0; i < rings.length; i++) {
    o = rings[i];
    a = 1 - o.t / 0.28;
    ctx.strokeStyle = rgba(o.rgb, a * 0.85);
    ctx.lineWidth = 1.6 * L.s;
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), o.r * L.s, 0, TAU);
    ctx.stroke();
  }
  for (i = 0; i < particles.length; i++) {
    o = particles[i];
    ctx.fillStyle = rgba(o.rgb, clamp(o.t / o.max, 0, 1));
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), o.r * L.s, 0, TAU);
    ctx.fill();
  }
  for (i = 0; i < sparks.length; i++) {
    o = sparks[i];
    ctx.strokeStyle = rgba(o.rgb, clamp(o.t / 0.22, 0, 1));
    ctx.lineWidth = 1.25 * L.s;
    ctx.beginPath();
    ctx.moveTo(sx(o.x), sy(o.y));
    ctx.lineTo(sx(o.x - o.vx * 0.025), sy(o.y - o.vy * 0.025));
    ctx.stroke();
  }
  ctx.font = 'bold ' + (9 * L.s) + 'px "Segoe UI", "PingFang SC", sans-serif';
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

function draw() {
  var i, shx, shy;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  shx = (G.shake ? (Math.random() - 0.5) * G.shake : 0) + G.kickX;
  shy = (G.shake ? (Math.random() - 0.5) * G.shake * 0.6 : 0) + G.kickY;
  ctx.translate(shx, shy);
  drawBg();
  drawShafts();
  drawDoors();
  drawFloors();
  for (i = 0; i < G.elevs.length; i++) drawElev(G.elevs[i], i);
  drawDocs();
  drawCar();
  drawSpies();
  drawPlayer();
  drawBullets();
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
bindPad(btnUp, function (v) { keys.u = v; });
bindPad(btnDown, function (v) { keys.d = v; });
bindPad(btnJump, function (v) {
  keys.jmp = v;
  if (v) G.jumpBuf = BUFFER;
});
bindPad(btnFire, function (v) { keys.fire = v; });

function keyOn(e, down) {
  var k = e.code;
  if (k === 'ArrowLeft' || k === 'KeyA') { keys.l = down; e.preventDefault(); }
  else if (k === 'ArrowRight' || k === 'KeyD') { keys.r = down; e.preventDefault(); }
  else if (k === 'ArrowDown' || k === 'KeyS') { keys.d = down; e.preventDefault(); }
  else if (k === 'ArrowUp' || k === 'KeyW') {
    keys.u = down;
    if (down) G.jumpBuf = BUFFER;
    e.preventDefault();
  } else if (k === 'KeyZ' || k === 'KeyX' || k === 'KeyK' || k === 'KeyJ' || k === 'ShiftLeft' || k === 'ShiftRight') {
    keys.jmp = down;
    if (down) G.jumpBuf = BUFFER;
    e.preventDefault();
  } else if (k === 'Space') {
    keys.fire = down;
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
      startRun('stealth');
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      startRun('brawl');
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
      startRun('brawl');
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
btnStealth.addEventListener('click', function () {
  audio.ensure();
  startRun('stealth');
});
btnBrawl.addEventListener('click', function () {
  audio.ensure();
  startRun('brawl');
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

bestEl.textContent = String(G.bestS);
renderPips();
showTitle();
resize();
hudPlay();
modeLabel.textContent = '潜入';
requestAnimationFrame(frame);

}
