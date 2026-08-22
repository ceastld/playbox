'use strict';

/* 电梯 — Elevator Action-lite. No CDN. */

var WORLD_W = 456;
var FH = 58;
var TOP = 26;
var STREET = 42;
var LIVES = 3;
var PW = 11;
var PH = 22;
var WALK = 118;
var JUMP_V = 252;
var GRAV = 980;
var MAX_FALL = 480;
var COYOTE = 0.08;
var BUFFER = 0.1;
var INVULN = 1.05;
var DIE_T = 0.7;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var SHAFT_W = 30;
var DOOR_W = 18;
var DOOR_H = 30;
var CAR_H = 46;
var LIFT_SPD_IN = 86;
var LIFT_SPD_EX = 108;
var DOC_SCORE = 400;
var KILL_SCORE = 120;
var BULB_SCORE = 80;
var ESCAPE_SCORE = 1800;
var LIFE_BONUS = 350;
var BEST_KEY = 'playbox-lift-gun-best';
var MUTE_KEY = 'playbox-lift-gun-mute';

var SHAFTS = [
  { x: 100, w: SHAFT_W },
  { x: 214, w: SHAFT_W },
  { x: 328, w: SHAFT_W }
];
var DOOR_XS = [58, 172, 286, 400];
var CAR_X = 430;

var INFIL_SECRETS = [
  { floor: 8, di: 0 },
  { floor: 7, di: 2 },
  { floor: 5, di: 1 },
  { floor: 3, di: 3 },
  { floor: 2, di: 0 }
];
var EXTRACT_SECRETS = [
  { floor: 5, di: 1 },
  { floor: 3, di: 3 },
  { floor: 1, di: 0 }
];
var INFIL_ESC = [
  { x: 34, lo: 7, hi: 8 },
  { x: 148, lo: 5, hi: 6 },
  { x: 262, lo: 3, hi: 4 },
  { x: 376, lo: 0, hi: 1 }
];
var EXTRACT_ESC = [
  { x: 34, lo: 4, hi: 5 },
  { x: 262, lo: 1, hi: 2 }
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

function nFloors(extract) {
  return extract ? 7 : 10;
}
function floorY(i, n) {
  return TOP + (n - 1 - i) * FH;
}
function worldH(n) {
  return floorY(0, n) + STREET;
}
function jumpHeight() {
  return (JUMP_V * JUMP_V) / (2 * GRAV);
}
function shaftIndex(x) {
  var i, s;
  for (i = 0; i < SHAFTS.length; i++) {
    s = SHAFTS[i];
    if (x > s.x + 2 && x < s.x + s.w - 2) return i;
  }
  return -1;
}
function shaftCenter(i) {
  return SHAFTS[i].x + SHAFTS[i].w * 0.5;
}
function hallAt(x) {
  var i, s, left = 14, right;
  for (i = 0; i < SHAFTS.length; i++) {
    s = SHAFTS[i];
    right = s.x;
    if (x >= left && x <= right) return { x0: left, x1: right };
    left = s.x + s.w;
  }
  return { x0: left, x1: WORLD_W - 14 };
}
function comboMul(n) {
  return 1 + Math.min(4, Math.floor(Math.max(0, n - 1) / 2));
}
function spawnInterval(extract, alarm) {
  var t = extract ? 1.15 : 2.05;
  if (alarm) t *= 0.52;
  return t;
}
function maxAgents(extract, alarm) {
  var n = extract ? 7 : 4;
  if (alarm) n += extract ? 2 : 2;
  return n;
}
function agentWalk(extract) {
  return extract ? 58 : 40;
}
function agentShootCd(extract) {
  return extract ? 0.82 : 1.35;
}
function liftSpeed(extract) {
  return extract ? LIFT_SPD_EX : LIFT_SPD_IN;
}
function secretList(extract) {
  return extract ? EXTRACT_SECRETS : INFIL_SECRETS;
}
function escList(extract) {
  return extract ? EXTRACT_ESC : INFIL_ESC;
}
function nearestFloor(y, n) {
  var i, best = 0, d, bd = 1e9;
  for (i = 0; i < n; i++) {
    d = Math.abs(floorY(i, n) - y);
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}
function alignedFloor(y, n, slop) {
  var i, fy;
  slop = slop == null ? 5 : slop;
  for (i = 0; i < n; i++) {
    fy = floorY(i, n);
    if (Math.abs(fy - y) <= slop) return i;
  }
  return -1;
}
function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function makeDoors(extract) {
  var n = nFloors(extract);
  var secrets = secretList(extract);
  var out = [];
  var f, d, i, s, red;
  for (f = 0; f < n; f++) {
    for (d = 0; d < DOOR_XS.length; d++) {
      if (f === 0 && d === 3) continue;
      red = false;
      for (i = 0; i < secrets.length; i++) {
        s = secrets[i];
        if (s.floor === f && s.di === d) red = true;
      }
      out.push({
        x: DOOR_XS[d],
        floor: f,
        secret: red,
        taken: false,
        open: 0,
        kick: 0
      });
    }
  }
  return out;
}

function bulbY(floor, n) {
  return floorY(floor, n) - 18;
}

function makeLights(n) {
  var i, xs = [78, 186, 300, 414];
  var out = [];
  for (i = 1; i < n; i++) {
    out.push({
      x: xs[i % xs.length],
      floor: i,
      on: true
    });
  }
  return out;
}

function makeEscalators(extract) {
  return escList(extract).map(function (e) {
    return { x: e.x, lo: e.lo, hi: e.hi, w: 40 };
  });
}

function makeCars(n, extract) {
  var i, dest;
  var cars = [];
  for (i = 0; i < SHAFTS.length; i++) {
    dest = Math.min(n - 1, i * 2 + (extract ? 1 : 2));
    cars.push({
      i: i,
      y: floorY(dest, n),
      dest: dest,
      wait: 0.4 + i * 0.5,
      occ: false,
      ding: 0
    });
  }
  return cars;
}

function makePlayer(n) {
  var f = n - 1;
  return {
    x: 48,
    y: floorY(f, n),
    vx: 0,
    vy: 0,
    face: 1,
    floor: f,
    state: 'walk',
    grounded: true,
    walk: 0,
    coyote: COYOTE,
    squash: 1,
    inv: 0,
    deadT: 0,
    fireCd: 0,
    muzzle: 0,
    door: null,
    doorT: 0,
    ride: -1,
    esc: null,
    escT: 0,
    why: ''
  };
}

function makeAgent(door, extract) {
  var hall = hallAt(door.x);
  return {
    x: door.x,
    y: 0,
    floor: door.floor,
    face: Math.random() < 0.5 ? -1 : 1,
    state: 'walk',
    walk: rand(0, 8),
    shootCd: rand(0.4, 1.1),
    dropT: 0,
    vx: 0,
    vy: 0,
    hall: hall,
    extract: extract,
    emerge: 0.28
  };
}

function papersLeft(doors) {
  var i, n = 0;
  for (i = 0; i < doors.length; i++) {
    if (doors[i].secret && !doors[i].taken) n++;
  }
  return n;
}
function papersTotal(extract) {
  return secretList(extract).length;
}
function papersGot(doors) {
  var i, n = 0;
  for (i = 0; i < doors.length; i++) {
    if (doors[i].secret && doors[i].taken) n++;
  }
  return n;
}
function floorDark(lights, floor) {
  var i;
  for (i = 0; i < lights.length; i++) {
    if (lights[i].floor === floor && !lights[i].on) return true;
  }
  return false;
}

function inEscape(x, floor, got, need) {
  return floor === 0 && got >= need && x >= CAR_X - 18;
}

function playerHitsAgent(px, py, ax, ay) {
  var hw = PW * 0.42;
  return aabb(px - hw, py - PH + 2, hw * 2, PH - 4, ax - 6, ay - 20, 12, 18);
}

function bulletHits(b, x, y, w, h) {
  return aabb(b.x - 3, b.y - 2, 8, 4, x, y, w, h);
}

function selfCheck() {
  var nI = nFloors(false);
  var nE = nFloors(true);
  var h, doors, i, d, red, halls, a, b;
  if (nI !== 10) throw new Error('infil 10 floors');
  if (nE !== 7) throw new Error('extract 7 floors');
  if (nI <= nE) throw new Error('infil taller');
  if (papersTotal(false) !== 5) throw new Error('5 secrets infil');
  if (papersTotal(true) !== 3) throw new Error('3 secrets extract');
  if (maxAgents(true, false) <= maxAgents(false, false)) throw new Error('extract more agents');
  if (spawnInterval(true, false) >= spawnInterval(false, false)) throw new Error('extract faster spawn');
  if (spawnInterval(false, true) >= spawnInterval(false, false)) throw new Error('alarm faster');
  if (agentWalk(true) <= agentWalk(false)) throw new Error('extract faster walk');
  if (agentShootCd(true) >= agentShootCd(false)) throw new Error('extract shoot faster');
  if (liftSpeed(true) <= liftSpeed(false)) throw new Error('extract lifts faster');
  h = jumpHeight();
  if (h < 26 || h > 42) throw new Error('jump window ' + h);
  if (h < 16) throw new Error('jump must clear bullet');
  if (h >= FH - 8) throw new Error('jump must not skip floor');
  if (SHAFTS.length !== 3) throw new Error('3 shafts');
  if (shaftIndex(115) !== 0) throw new Error('shaft0');
  if (shaftIndex(229) !== 1) throw new Error('shaft1');
  if (shaftIndex(343) !== 2) throw new Error('shaft2');
  if (shaftIndex(58) !== -1) throw new Error('door not shaft');
  if (comboMul(1) !== 1) throw new Error('combo1');
  if (comboMul(3) !== 2) throw new Error('combo3');
  if (comboMul(9) !== 5) throw new Error('combo cap');
  if (floorY(nI - 1, nI) !== TOP) throw new Error('top floor y');
  if (floorY(0, nI) <= floorY(1, nI)) throw new Error('ground below');
  doors = makeDoors(false);
  red = 0;
  for (i = 0; i < doors.length; i++) if (doors[i].secret) red++;
  if (red !== 5) throw new Error('infil red doors');
  doors = makeDoors(true);
  red = 0;
  for (i = 0; i < doors.length; i++) if (doors[i].secret) red++;
  if (red !== 3) throw new Error('extract red doors');
  for (i = 0; i < doors.length; i++) {
    d = doors[i];
    if (shaftIndex(d.x) !== -1) throw new Error('door in shaft');
  }
  if (inEscape(CAR_X, 0, 5, 5) !== true) throw new Error('escape zone');
  if (inEscape(CAR_X, 1, 5, 5)) throw new Error('escape only ground');
  if (inEscape(40, 0, 5, 5)) throw new Error('escape only car');
  if (inEscape(CAR_X, 0, 2, 5)) throw new Error('need papers');
  halls = hallAt(58);
  if (halls.x1 - halls.x0 < 40) throw new Error('left hall');
  if (playerHitsAgent(100, 100, 100, 100) !== true) throw new Error('touch agent');
  if (playerHitsAgent(160, 100, 100, 100)) throw new Error('far miss');
  a = { x: 50, y: 80 };
  b = { x: 52, y: 80, vx: 10 };
  if (!bulletHits(b, 48, 76, 12, 10)) throw new Error('bullet hit');
  if (INFIL_ESC.length <= EXTRACT_ESC.length) throw new Error('infil more escalators');
  if (alignedFloor(floorY(3, 10), 10, 2) !== 3) throw new Error('align');
  if (nearestFloor(floorY(2, 10) + 3, 10) !== 2) throw new Error('nearest');
  if (bulbY(3, 10) !== floorY(3, 10) - 18) throw new Error('bulb y');
  if (Math.abs((floorY(3, 10) - 14) - bulbY(3, 10)) > 8) throw new Error('bulb in shot line');
  for (i = 0; i < INFIL_SECRETS.length; i++) {
    if (INFIL_SECRETS[i].floor < 1 || INFIL_SECRETS[i].floor >= nI) throw new Error('infil secret floor');
    if (INFIL_SECRETS[i].di < 0 || INFIL_SECRETS[i].di > 3) throw new Error('infil secret door');
  }
  for (i = 0; i < EXTRACT_SECRETS.length; i++) {
    if (EXTRACT_SECRETS[i].floor < 1 || EXTRACT_SECRETS[i].floor >= nE) throw new Error('extract secret floor');
  }
  if (makeLights(nI).length !== nI - 1) throw new Error('infil lights');
  if (makeLights(nE).length !== nE - 1) throw new Error('extract lights');
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
var ovModes = document.getElementById('ov-modes');
var btnInfil = document.getElementById('btn-infil');
var btnExtract = document.getElementById('btn-extract');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnLeft = document.getElementById('btn-left');
var btnRight = document.getElementById('btn-right');
var btnUp = document.getElementById('btn-up');
var btnDown = document.getElementById('btn-down');
var btnJump = document.getElementById('btn-jump');
var btnShot = document.getElementById('btn-shot');
var scoreEl = document.getElementById('score');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var floorLabel = document.getElementById('floor-label');
var docBar = document.getElementById('doc-bar');
var docLab = document.getElementById('doc-lab');
var pipsEl = document.getElementById('pips');
var toastEl = document.getElementById('toast');
var hintEl = document.getElementById('hint');
var motionQ = window.matchMedia('(prefers-reduced-motion: reduce)');
var coarseQ = window.matchMedia('(pointer: coarse)');

var dpr = 1;
var cssW = 0;
var cssH = 0;
var L = { x: 0, y: 0, s: 1, viewH: 320 };
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
var casings = [];

var keys = { l: false, r: false, u: false, d: false, jump: false, shot: false };
var shotHeld = false;

var G = {
  mode: 'title',
  kind: 'infil',
  extract: false,
  n: 10,
  clock: 0,
  lives: LIVES,
  score: 0,
  bestI: 0,
  bestE: 0,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  player: makePlayer(10),
  agents: [],
  bullets: [],
  doors: makeDoors(false),
  lights: makeLights(10),
  cars: makeCars(10, false),
  escs: makeEscalators(false),
  spawnCd: 1.4,
  alarm: false,
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flash: 0,
  flashRgb: [255, 176, 32],
  darkPulse: 0,
  winT: 0,
  carGo: 0,
  camY: 0,
  camT: 0,
  jumpBuf: 0,
  shotBuf: 0,
  why: '',
  uLatch: false,
  dLatch: false
};

function reduceMotion() {
  return motionQ.matches;
}

function N() { return G.n; }
function FY(i) { return floorY(i, G.n); }
function WH() { return worldH(G.n); }

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
    this.noise(0.05, 0.09, 1400, 'highpass');
    this.beep(620, 0.05, 'square', 0.06, 180);
    this.beep(240, 0.04, 'sawtooth', 0.04, 80);
  },
  hit: function (combo) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.08;
    this.beep(380 * p, 0.07, 'square', 0.07, 820 * p);
    this.beep(220 * p, 0.1, 'sawtooth', 0.04, 70);
    this.noise(0.08, 0.1, 420, 'lowpass');
  },
  kick: function () {
    this.ensure();
    this.noise(0.08, 0.1, 180, 'lowpass');
    this.beep(140, 0.09, 'square', 0.05, 70);
    this.beep(420, 0.05, 'triangle', 0.03, 220);
  },
  paper: function () {
    this.ensure();
    this.beep(520, 0.08, 'triangle', 0.06, 880);
    this.beep(780, 0.14, 'square', 0.045, 1240);
    this.beep(1040, 0.1, 'sine', 0.03, 1560);
  },
  glass: function () {
    this.ensure();
    this.noise(0.12, 0.1, 2400, 'highpass');
    this.beep(1480, 0.08, 'square', 0.04, 420);
  },
  hop: function () {
    this.ensure();
    this.beep(300, 0.05, 'square', 0.04, 540);
    this.noise(0.03, 0.03, 1600, 'highpass');
  },
  land: function () {
    this.ensure();
    this.noise(0.05, 0.05, 360, 'bandpass');
    this.beep(150, 0.04, 'sine', 0.025, 70);
  },
  ding: function () {
    this.ensure();
    this.beep(880, 0.06, 'sine', 0.04, 1320);
    this.beep(1320, 0.08, 'triangle', 0.03);
  },
  lift: function () {
    this.ensure();
    this.beep(180, 0.04, 'sine', 0.02, 240);
  },
  die: function () {
    this.ensure();
    this.noise(0.18, 0.12, 260, 'lowpass');
    this.beep(280, 0.24, 'sawtooth', 0.06, 60);
    this.beep(160, 0.2, 'square', 0.04, 50);
  },
  alarm: function () {
    this.ensure();
    this.beep(740, 0.12, 'square', 0.06, 520);
    this.beep(520, 0.16, 'square', 0.05, 740);
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
  ui: function () {
    this.ensure();
    this.beep(640, 0.05, 'square', 0.035, 420);
  },
  start: function () {
    this.ensure();
    this.beep(330, 0.08, 'square', 0.04, 440);
    this.beep(440, 0.1, 'triangle', 0.04, 660);
  },
  enemyShot: function () {
    this.ensure();
    this.beep(280, 0.05, 'square', 0.035, 120);
    this.noise(0.04, 0.05, 900, 'bandpass');
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
      G.bestI = o.i | 0;
      G.bestE = o.e | 0;
      return;
    }
    if (typeof o === 'number') {
      G.bestI = o | 0;
      G.bestE = o | 0;
    }
  } catch (e) { /* ignore */ }
}

function persistBest() {
  var cur = G.extract ? G.bestE : G.bestI;
  if (G.score > cur) {
    if (G.extract) G.bestE = G.score;
    else G.bestI = G.score;
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ i: G.bestI, e: G.bestE }));
  } catch (e) { /* ignore */ }
}

function currentBest() {
  return G.extract ? G.bestE : G.bestI;
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

function stageKick(cls, ms) {
  stageEl.classList.remove(cls);
  void stageEl.offsetWidth;
  stageEl.classList.add(cls);
  setTimeout(function () { stageEl.classList.remove(cls); }, ms);
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
      g: grav || 18
    });
  }
}

function spark(x, y, rgb, n) {
  var i;
  for (i = 0; i < n; i++) {
    sparks.push({
      x: x, y: y,
      vx: rand(-1, 1) * 90,
      vy: rand(-120, -20),
      t: 0.18 * rand(0.7, 1.2),
      rgb: rgb
    });
  }
}

function ringAt(x, y, rgb) {
  rings.push({ x: x, y: y, r: 6, t: 0, rgb: rgb });
}

function floatText(x, y, text, rgb) {
  floats.push({ x: x, y: y, text: text, t: 0, rgb: rgb });
}

function shatter(x, y) {
  var i;
  for (i = 0; i < 9; i++) {
    shards.push({
      x: x, y: y,
      vx: rand(-90, 90),
      vy: rand(-160, -20),
      t: rand(0.28, 0.55),
      rot: rand(0, TAU),
      vr: rand(-10, 10),
      w: rand(2.2, 5.5)
    });
  }
}

function casing(x, y, face) {
  casings.push({
    x: x, y: y,
    vx: -face * rand(40, 80),
    vy: rand(-140, -60),
    t: 0.45,
    rot: rand(0, TAU),
    vr: rand(-12, 12)
  });
}

function toast(msg, warn, gold) {
  toastEl.textContent = msg;
  toastEl.classList.toggle('warn', !!warn);
  toastEl.classList.toggle('gold', !!gold);
  toastEl.classList.remove('hidden');
  clearTimeout(toastTok);
  toastTok = setTimeout(function () { toastEl.classList.add('hidden'); }, 1100);
}

function addScore(n, x, y, label) {
  G.score += n;
  scoreEl.textContent = String(G.score);
  scoreBox.classList.remove('flash');
  void scoreBox.offsetWidth;
  scoreBox.classList.add('flash');
  scoreAdd.hidden = false;
  scoreAdd.textContent = '+' + n;
  clearTimeout(addTok);
  addTok = setTimeout(function () { scoreAdd.hidden = true; }, 700);
  if (label) floatText(x, y - 22, label, [255, 227, 107]);
  persistBest();
  bestEl.textContent = String(currentBest());
}

function bumpCombo() {
  G.combo += 1;
  if (G.combo > G.maxCombo) G.maxCombo = G.combo;
  G.comboAge = 0;
  comboEl.textContent = '×' + G.combo;
  comboBox.classList.toggle('hot', G.combo >= 2);
  if (G.combo >= 2) {
    comboBox.classList.remove('hot');
    void comboBox.offsetWidth;
    comboBox.classList.add('hot');
  }
}

function renderPips() {
  var i, html = '';
  for (i = 0; i < LIVES; i++) {
    html += '<i class="pip' + (i < G.lives ? ' on' : ' gone') + '"></i>';
  }
  pipsEl.innerHTML = html;
}

function syncDocs() {
  var got = papersGot(G.doors);
  var tot = papersTotal(G.extract);
  var t = tot ? got / tot : 0;
  docBar.style.transform = 'scaleX(' + t + ')';
  docBar.classList.toggle('on', got >= tot && tot > 0);
  docLab.textContent = got + '/' + tot;
}

function hudPlay() {
  scoreEl.textContent = String(G.score);
  bestEl.textContent = String(currentBest());
  comboEl.textContent = '×' + Math.max(1, G.combo);
  modeLabel.textContent = G.alarm ? '警报' : (G.extract ? '撤离' : '潜入');
  modeLabel.classList.toggle('extract', G.extract && !G.alarm);
  modeLabel.classList.toggle('alarm', G.alarm);
  var fl = G.player.floor;
  if (fl < 0) fl = nearestFloor(G.player.y, G.n);
  floorLabel.textContent = (fl + 1) + 'F';
  renderPips();
  syncDocs();
}

/* ---- overlay ---- */
function showTitle() {
  G.mode = 'title';
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel';
  ovTitle.textContent = '电梯';
  ovLead.textContent = '侧视大楼。坐电梯、踹红门夺密件、打特工。带上文件跑到地面座驾。';
  ovOps.textContent = '方向键 / WASD 走 · 上 进门/电梯 · 跳 · 空格射击 · R 重开 · M 静音';
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
  hintEl.textContent = '踹红门夺密件 · 坐电梯下楼 · 空格开枪 · 打灯泡会熄灯 · 带文件上车';
  resetLevel(true);
}

function showOver(win) {
  G.mode = 'over';
  persistBest();
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = win ? 'panel win' : 'panel lose';
  ovTitle.textContent = win ? '逃脱了' : '暴露了';
  ovLead.textContent = (G.extract ? '撤离' : '潜入') + ' · ' + G.score + ' 分 · 连击最高 ×' +
    G.maxCombo + (G.why && !win ? ' · ' + whyText(G.why) : '') +
    (win ? ' · 密件 ' + papersGot(G.doors) + '/' + papersTotal(G.extract) : '');
  ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
  if (!win) audio.over();
  ovRetry.focus();
}

function whyText(w) {
  if (w === 'shot') return '中弹了';
  if (w === 'touch') return '撞上特工';
  if (w === 'fall') return '坠井了';
  if (w === 'crush') return '被电梯挤了';
  return '';
}

function resetFx() {
  particles.length = 0;
  sparks.length = 0;
  floats.length = 0;
  rings.length = 0;
  shards.length = 0;
  casings.length = 0;
  G.stop = 0;
  G.shake = 0;
  G.kickX = 0;
  G.kickY = 0;
  G.flash = 0;
}

function resetLevel(attract) {
  G.n = nFloors(G.extract);
  G.doors = makeDoors(G.extract);
  G.lights = makeLights(G.n);
  G.cars = makeCars(G.n, G.extract);
  G.escs = makeEscalators(G.extract);
  G.player = makePlayer(G.n);
  G.agents = [];
  G.bullets = [];
  G.spawnCd = attract ? 1.2 : spawnInterval(G.extract, false) * 0.7;
  G.alarm = false;
  G.winT = 0;
  G.carGo = 0;
  G.camY = Math.max(0, G.player.y - 180);
  G.camT = 0;
  G.why = '';
  G.jumpBuf = 0;
  G.shotBuf = 0;
  resetFx();
  if (attract) {
    spawnAgent();
    spawnAgent();
  }
}

function startRun(kind) {
  G.kind = kind;
  G.extract = kind === 'extract';
  G.mode = 'play';
  G.clock = 0;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  G.maxCombo = 0;
  G.comboAge = 0;
  G.why = '';
  resetLevel(false);
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  panelEl.className = 'panel';
  audio.start();
  hudPlay();
  toast(G.extract ? '撤离' : '潜入', G.extract, !G.extract);
  canvas.focus({ preventScroll: true });
}

function retry() {
  audio.ui();
  if (G.mode === 'title') startRun('infil');
  else startRun(G.kind);
}

function goMenu() {
  audio.ui();
  persistBest();
  showTitle();
  hudPlay();
}

/* ---- sim ---- */
function liveAgents() {
  var n = 0, i;
  for (i = 0; i < G.agents.length; i++) if (G.agents[i].state !== 'drop') n++;
  return n;
}

function spawnAgent() {
  var cands = [];
  var i, d, a, px;
  px = G.player.x;
  for (i = 0; i < G.doors.length; i++) {
    d = G.doors[i];
    if (d.secret && !d.taken) continue;
    if (G.mode === 'play' && d.floor === G.player.floor && Math.abs(d.x - px) < 36) continue;
    cands.push(d);
  }
  if (!cands.length) {
    for (i = 0; i < G.doors.length; i++) cands.push(G.doors[i]);
  }
  d = cands[(Math.random() * cands.length) | 0];
  d.open = 1;
  d.kick = 0.28;
  a = makeAgent(d, G.extract);
  a.y = FY(d.floor);
  G.agents.push(a);
}

function playerBullets() {
  var n = 0, i;
  for (i = 0; i < G.bullets.length; i++) if (G.bullets[i].from === 'p') n++;
  return n;
}

function fire(fromP, x, y, face) {
  var spd = fromP ? 360 : (G.extract ? 210 : 168);
  G.bullets.push({
    x: x + face * 10,
    y: y - 14,
    vx: face * spd,
    vy: 0,
    from: fromP ? 'p' : 'e',
    life: 0.85
  });
  if (fromP) {
    audio.shot();
    flash([255, 230, 140], 0.05);
    spark(x + face * 12, y - 14, [255, 227, 107], 5);
    burst(x + face * 10, y - 14, 4, [255, 200, 80], 40, 0.16, 8);
    casing(x, y - 12, face);
    G.player.muzzle = 0.06;
  } else {
    audio.enemyShot();
    spark(x + face * 10, y - 14, [255, 61, 184], 3);
  }
}

function killAgent(a) {
  var n;
  if (a.state === 'drop') return;
  a.state = 'drop';
  a.dropT = 0.55;
  a.vy = -110;
  a.vx = (G.player.face || 1) * 70;
  bumpCombo();
  n = KILL_SCORE * G.combo * comboMul(G.combo);
  addScore(n, a.x, a.y, '+' + n);
  audio.hit(G.combo);
  hitStop(0.055);
  kick(2.4);
  shake(3);
  flash([255, 80, 140], 0.08);
  burst(a.x, a.y - 10, 16, [255, 61, 184], 78, 0.38, 22);
  burst(a.x, a.y - 8, 8, [255, 227, 107], 50, 0.28, 14);
  spark(a.x, a.y - 12, [255, 200, 230], 8);
  ringAt(a.x, a.y - 10, [255, 61, 184]);
  if (G.combo >= 2) floatText(a.x, a.y - 30, '连击 ×' + G.combo, [0, 240, 255]);
}

function shootBulb(Lgt) {
  var by = bulbY(Lgt.floor, G.n);
  Lgt.on = false;
  addScore(BULB_SCORE, Lgt.x, by, '+' + BULB_SCORE);
  audio.glass();
  hitStop(0.04);
  kick(1.8);
  flash([255, 255, 220], 0.07);
  shatter(Lgt.x, by);
  burst(Lgt.x, by, 10, [255, 227, 107], 55, 0.3, 16);
  G.darkPulse = 0.25;
  toast('熄灯', false, true);
}

function collectDoor(d, p) {
  var left;
  d.taken = true;
  d.kick = 0.32;
  d.open = 1;
  addScore(DOC_SCORE, d.x, p.y, '+' + DOC_SCORE);
  audio.paper();
  hitStop(0.06);
  kick(2.6);
  flash([255, 227, 107], 0.12);
  burst(d.x, p.y - 14, 14, [255, 227, 107], 70, 0.4, 10);
  ringAt(d.x, p.y - 16, [255, 227, 107]);
  syncDocs();
  left = papersLeft(G.doors);
  if (left <= 0) {
    G.alarm = true;
    audio.alarm();
    toast('警报！去地面座驾', true, false);
    flash([255, 50, 80], 0.16);
    hudPlay();
  } else {
    toast('密件 ' + papersGot(G.doors) + '/' + papersTotal(G.extract), false, true);
  }
}

function enterDoor(p, d) {
  p.state = 'door';
  p.door = d;
  p.doorT = 0.42;
  p.vx = 0;
  p.vy = 0;
  p.grounded = true;
  p.ride = -1;
  d.kick = 0.3;
  d.open = 1;
  audio.kick();
  hitStop(0.05);
  kick(2.2);
  burst(d.x, p.y - 8, 8, [255, 176, 32], 36, 0.22, 14);
  stageKick('kick', 220);
  if (d.secret && !d.taken) collectDoor(d, p);
}

function emerge(p) {
  var d = p.door;
  p.state = 'walk';
  p.door = null;
  p.grounded = true;
  p.floor = d ? d.floor : p.floor;
  if (d) {
    p.x = d.x + p.face * 10;
    p.y = FY(d.floor);
    p.inv = Math.max(p.inv, 0.28);
  }
}

function findDoor(p) {
  var i, d;
  if (!p.grounded && p.state !== 'ride') return null;
  for (i = 0; i < G.doors.length; i++) {
    d = G.doors[i];
    if (d.floor !== p.floor && !(p.state === 'ride' && alignedFloor(p.y, G.n, 6) === d.floor)) continue;
    if (Math.abs(p.x - d.x) < 12) return d;
  }
  return null;
}

function findEsc(p, dir) {
  var i, e, fy, ty;
  if (!p.grounded && p.state !== 'walk') return null;
  for (i = 0; i < G.escs.length; i++) {
    e = G.escs[i];
    if (p.x < e.x - 4 || p.x > e.x + e.w + 4) continue;
    fy = FY(e.lo);
    ty = FY(e.hi);
    if (dir > 0 && p.floor === e.lo && Math.abs(p.y - fy) < 8) return e;
    if (dir < 0 && p.floor === e.hi && Math.abs(p.y - ty) < 8) return e;
  }
  return null;
}

function boardEsc(p, e, dir) {
  p.state = 'esc';
  p.esc = e;
  p.escT = 0;
  p.grounded = false;
  p.ride = -1;
  p.vx = 0;
  p.vy = 0;
  audio.lift();
}

function doJump(p) {
  p.vy = -JUMP_V;
  p.grounded = false;
  p.state = 'jump';
  p.coyote = 0;
  p.squash = 0.62;
  p.ride = -1;
  p.esc = null;
  audio.hop();
  hitStop(0.03);
  kick(1.4);
  burst(p.x, p.y, 5, [255, 200, 120], 26, 0.2, 16);
}

function landOn(p, i, riding) {
  var wasAir = !p.grounded;
  p.floor = i;
  p.y = riding ? p.y : FY(i);
  p.vy = 0;
  p.grounded = true;
  p.state = riding ? 'ride' : 'walk';
  p.coyote = COYOTE;
  p.squash = 0.78;
  p.esc = null;
  if (wasAir) {
    audio.land();
    burst(p.x, p.y, 4, [255, 180, 90], 20, 0.16, 12);
  }
}

function kill(why) {
  var p = G.player;
  if (p.state === 'dead' || p.state === 'win' || G.mode !== 'play') return;
  if (p.inv > 0 && why !== 'fall' && why !== 'crush') return;
  if (p.state === 'door') return;
  p.state = 'dead';
  p.why = why;
  p.deadT = DIE_T;
  p.vy = -160;
  p.vx = -p.face * 50;
  p.grounded = false;
  p.ride = -1;
  G.why = why;
  G.combo = 0;
  comboEl.textContent = '×1';
  audio.die();
  hitStop(0.08);
  shake(7);
  flash([255, 61, 184], 0.18);
  burst(p.x, p.y - 10, 18, [255, 61, 184], 72, 0.42, 24);
  spark(p.x, p.y - 8, [255, 200, 230], 8);
  stageKick('die', 360);
}

function finishDead() {
  G.lives -= 1;
  hudPlay();
  if (G.lives <= 0) {
    showOver(false);
    return;
  }
  G.player = makePlayer(G.n);
  G.player.inv = INVULN;
  G.bullets = [];
  toast(whyText(G.why) || '再来', true, false);
}

function doEscape() {
  var p = G.player;
  var bonus, got;
  if (p.state === 'win') return;
  p.state = 'win';
  p.vx = 0;
  p.vy = 0;
  G.winT = 1.15;
  G.carGo = 0;
  got = papersGot(G.doors);
  bonus = ESCAPE_SCORE + G.lives * LIFE_BONUS + got * 80;
  addScore(bonus, p.x, p.y, '+' + bonus);
  audio.clear();
  hitStop(0.09);
  flash([255, 227, 107], 0.22);
  burst(p.x, p.y - 16, 22, [255, 227, 107], 80, 0.5, 10);
  ringAt(p.x, p.y - 12, [255, 227, 107]);
  stageKick('clear', 320);
  toast('上车', false, true);
}

function carAtFloor(si, fi) {
  return Math.abs(G.cars[si].y - FY(fi)) < 8;
}

function tickCars(dt) {
  var i, c, n = G.n, destY, spd, fl, prev, p = G.player, aligned;
  spd = liftSpeed(G.extract);
  for (i = 0; i < G.cars.length; i++) {
    c = G.cars[i];
    c.occ = p.ride === i && p.state === 'ride';
    if (c.ding > 0) c.ding -= dt;
    aligned = alignedFloor(c.y, n, 4);
    if (c.occ) {
      if (aligned >= 0 && Math.abs(c.y - FY(aligned)) < 3) {
        c.y = FY(aligned);
        if (keys.u && aligned < n - 1) c.dest = aligned + 1;
        else if (keys.d && aligned > 0) c.dest = aligned - 1;
        else c.dest = aligned;
      }
    } else {
      if (aligned >= 0 && aligned === c.dest && Math.abs(c.y - FY(aligned)) < 3) {
        c.y = FY(aligned);
        c.wait -= dt;
        if (c.wait <= 0) {
          c.dest = (c.dest + 1 + ((Math.random() * (n - 1)) | 0)) % n;
          c.wait = G.extract ? rand(0.28, 0.8) : rand(0.55, 1.6);
        }
      }
    }
    destY = FY(c.dest);
    prev = c.y;
    if (Math.abs(c.y - destY) > 1.2) {
      c.y += (destY > c.y ? spd : -spd) * dt;
      if ((prev - destY) * (c.y - destY) <= 0) {
        c.y = destY;
        c.ding = 0.2;
        if (G.mode === 'play' && Math.abs(p.y - c.y) < FH * 1.2 && shaftIndex(p.x) === i) audio.ding();
      }
    } else {
      c.y = destY;
    }
    if (G.mode === 'play' && p.state !== 'dead' && p.state !== 'win' && p.state !== 'door') {
      if (p.ride !== i && shaftIndex(p.x) === i) {
        if (prev < p.y - PH + 2 && c.y >= p.y - PH + 2 && c.y < p.y + 6) {
          kill('crush');
        }
      }
    }
    fl = alignedFloor(c.y, n, 5);
    if (fl >= 0 && !c.occ && G.mode === 'title') {
      /* attract */
    }
  }
}

function tickAgents(dt) {
  var i, a, p = G.player, spd, see, dark, dx, same;
  for (i = G.agents.length - 1; i >= 0; i--) {
    a = G.agents[i];
    if (a.emerge > 0) {
      a.emerge -= dt;
      a.walk += dt * 8;
      continue;
    }
    if (a.state === 'drop') {
      a.dropT -= dt;
      a.vy += GRAV * dt;
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      if (a.dropT <= 0 || a.y > WH() + 20) G.agents.splice(i, 1);
      continue;
    }
    a.y = FY(a.floor);
    spd = agentWalk(G.extract);
    if (G.alarm) spd *= 1.18;
    a.x += a.face * spd * dt;
    a.walk += spd * dt * 0.2;
    if (a.x < a.hall.x0 + 8) { a.x = a.hall.x0 + 8; a.face = 1; }
    if (a.x > a.hall.x1 - 8) { a.x = a.hall.x1 - 8; a.face = -1; }

    if (G.mode !== 'play' || p.state === 'dead' || p.state === 'win' || p.state === 'door') continue;

    same = a.floor === p.floor || (p.state === 'ride' && alignedFloor(p.y, G.n, 8) === a.floor);
    dx = p.x - a.x;
    dark = floorDark(G.lights, a.floor);
    see = same && (dx * a.face > 0);
    if (dark && Math.abs(dx) > 52) see = false;
    if (p.inv > 0) see = false;
    if ((G.extract || G.alarm) && same && p.inv <= 0 && !(dark && Math.abs(dx) > 52)) {
      if (Math.abs(dx) > 10) a.face = dx > 0 ? 1 : -1;
      see = true;
    }
    if (see && Math.abs(dx) > 14) a.face = dx > 0 ? 1 : -1;

    a.shootCd -= dt;
    if (see && a.shootCd <= 0 && Math.abs(dx) > 16 && Math.abs(dx) < 240) {
      fire(false, a.x, a.y, a.face);
      a.shootCd = agentShootCd(G.extract) * rand(0.85, 1.15);
    }

    if (p.state !== 'jump' && p.state !== 'esc' && playerHitsAgent(p.x, p.y, a.x, a.y)) {
      if (!(p.state === 'jump' || (!p.grounded && p.y < a.y - 10))) {
        kill('touch');
      }
    } else if (!p.grounded && p.y < a.y - 8 && playerHitsAgent(p.x, p.y + 8, a.x, a.y)) {
      /* jump over */
    } else if (p.grounded && playerHitsAgent(p.x, p.y, a.x, a.y)) {
      kill('touch');
    }
  }
}

function tickBullets(dt) {
  var i, b, j, a, Lgt, by, p = G.player;
  for (i = G.bullets.length - 1; i >= 0; i--) {
    b = G.bullets[i];
    b.life -= dt;
    b.x += b.vx * dt;
    if (b.life <= 0 || b.x < 6 || b.x > WORLD_W - 6) {
      G.bullets.splice(i, 1);
      continue;
    }
    if (b.from === 'p') {
      for (j = 0; j < G.agents.length; j++) {
        a = G.agents[j];
        if (a.state === 'drop') continue;
        if (Math.abs(a.y - (b.y + 14)) > FH * 0.7 && Math.abs(a.y - p.y) > 30) {
          /* allow cross if visually on floor */
        }
        if (bulletHits(b, a.x - 7, a.y - 20, 14, 18)) {
          killAgent(a);
          G.bullets.splice(i, 1);
          b = null;
          break;
        }
      }
      if (!b) continue;
      for (j = 0; j < G.lights.length; j++) {
        Lgt = G.lights[j];
        if (!Lgt.on) continue;
        by = bulbY(Lgt.floor, G.n);
        if (hypot(b.x - Lgt.x, b.y - by) < 11) {
          shootBulb(Lgt);
          G.bullets.splice(i, 1);
          b = null;
          break;
        }
      }
      if (!b) continue;
      for (j = G.bullets.length - 1; j >= 0; j--) {
        if (j === i) continue;
        if (G.bullets[j].from === 'e' && hypot(G.bullets[j].x - b.x, G.bullets[j].y - b.y) < 8) {
          burst(b.x, b.y, 6, [255, 227, 107], 40, 0.18, 6);
          hitStop(0.03);
          G.bullets.splice(Math.max(i, j), 1);
          G.bullets.splice(Math.min(i, j), 1);
          if (j < i) i--;
          b = null;
          break;
        }
      }
    } else if (G.mode === 'play' && p.state !== 'dead' && p.state !== 'win' && p.state !== 'door') {
      if (p.inv <= 0 && bulletHits(b, p.x - 6, p.y - PH + 2, 12, PH - 4)) {
        if (p.state === 'jump' && p.y < b.y + 6 && p.vy < 0) {
          /* jumped over roughly */
        } else {
          G.bullets.splice(i, 1);
          kill('shot');
        }
      }
    }
  }
}

function tryBoard(p) {
  var si = shaftIndex(p.x);
  var fl;
  if (si < 0) return false;
  fl = p.floor;
  if (fl < 0) fl = alignedFloor(p.y, G.n, 8);
  if (fl >= 0 && carAtFloor(si, fl)) {
    p.ride = si;
    p.state = 'ride';
    p.grounded = true;
    p.y = G.cars[si].y;
    p.floor = fl;
    p.vy = 0;
    G.cars[si].occ = true;
    G.cars[si].dest = fl;
    return true;
  }
  return false;
}

function tickPlayer(dt) {
  var p = G.player;
  var dir, nx, si, i, fy, prev, fi, e, destY, t, d;
  if (p.inv > 0) p.inv -= dt;
  if (p.fireCd > 0) p.fireCd -= dt;
  if (p.muzzle > 0) p.muzzle -= dt;
  p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));

  if (p.state === 'dead') {
    p.vy += GRAV * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.deadT -= dt;
    if (p.deadT <= 0) finishDead();
    return;
  }
  if (p.state === 'win') {
    G.carGo += dt * 70;
    return;
  }
  if (p.state === 'door') {
    p.doorT -= dt;
    if (p.door && p.door.kick > 0) p.door.kick -= dt;
    if (p.doorT <= 0) emerge(p);
    return;
  }

  if (p.state === 'esc' && p.esc) {
    e = p.esc;
    p.escT += dt;
    t = clamp(p.escT / 0.55, 0, 1);
    if (p.floor === e.lo) {
      p.x = lerp(clamp(p.x, e.x, e.x + e.w), e.x + e.w * 0.7, t);
      p.y = lerp(FY(e.lo), FY(e.hi), t);
      if (t >= 1) {
        p.floor = e.hi;
        p.y = FY(e.hi);
        p.state = 'walk';
        p.grounded = true;
        p.esc = null;
      }
    } else {
      p.x = lerp(clamp(p.x, e.x, e.x + e.w), e.x + 8, t);
      p.y = lerp(FY(e.hi), FY(e.lo), t);
      if (t >= 1) {
        p.floor = e.lo;
        p.y = FY(e.lo);
        p.state = 'walk';
        p.grounded = true;
        p.esc = null;
      }
    }
    return;
  }

  if (!G.uLatch && keys.u) {
    d = findDoor(p);
    if (d && (p.grounded || p.state === 'ride')) {
      if (p.state === 'ride') {
        p.ride = -1;
        p.floor = d.floor;
        p.y = FY(d.floor);
      }
      enterDoor(p, d);
      G.uLatch = true;
      return;
    }
    e = findEsc(p, 1);
    if (e) {
      boardEsc(p, e, 1);
      G.uLatch = true;
      return;
    }
  }
  if (!G.dLatch && keys.d) {
    e = findEsc(p, -1);
    if (e) {
      boardEsc(p, e, -1);
      G.dLatch = true;
      return;
    }
  }

  if (G.shotBuf > 0 || (keys.shot && p.fireCd <= 0)) {
    if (p.fireCd <= 0 && playerBullets() < 2) {
      fire(true, p.x, p.y, p.face);
      p.fireCd = 0.2;
    }
    G.shotBuf = 0;
  }

  if (p.state === 'ride') {
    var c = G.cars[p.ride];
    if (!c) { p.state = 'fall'; p.ride = -1; }
    else {
      dir = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
      if (dir) p.face = dir;
      p.x += dir * WALK * dt;
      p.y = c.y;
      p.vy = 0;
      p.grounded = true;
      p.floor = alignedFloor(c.y, G.n, 8);
      if (dir) p.walk += WALK * dt * 0.2;
      si = p.ride;
      if (shaftIndex(p.x) !== si) {
        fi = alignedFloor(c.y, G.n, 6);
        if (fi >= 0 && shaftIndex(p.x) < 0) {
          p.ride = -1;
          landOn(p, fi, false);
        } else if (fi >= 0) {
          p.x = clamp(p.x, SHAFTS[si].x + 4, SHAFTS[si].x + SHAFTS[si].w - 4);
        } else {
          p.ride = -1;
          p.state = 'fall';
          p.grounded = false;
        }
      }
      if (G.jumpBuf > 0 && keys.jump) {
        doJump(p);
        G.jumpBuf = 0;
      }
      if (inEscape(p.x, p.floor < 0 ? 0 : p.floor, papersGot(G.doors), papersTotal(G.extract))) doEscape();
      return;
    }
  }

  if (G.jumpBuf > 0 && (p.grounded || p.coyote > 0) && p.state !== 'dead') {
    if (keys.jump || !findDoor(p)) {
      doJump(p);
      G.jumpBuf = 0;
    }
  }

  dir = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
  if (dir) p.face = dir;
  p.vx = dir * WALK * (p.grounded ? 1 : 0.92);
  if (dir) p.walk += Math.abs(p.vx) * dt * 0.22;
  nx = p.x + p.vx * dt;
  nx = clamp(nx, 14, WORLD_W - 14);

  if (p.grounded && p.state === 'walk') {
    si = shaftIndex(nx);
    if (si >= 0) {
      if (carAtFloor(si, p.floor)) {
        p.x = nx;
        tryBoard(p);
        return;
      }
      p.grounded = false;
      p.state = 'fall';
      p.vy = 30;
      p.x = nx;
    } else {
      p.x = nx;
      p.y = FY(p.floor);
      p.coyote = COYOTE;
    }
  } else {
    p.x = nx;
  }

  if (!p.grounded && p.state !== 'esc') {
    p.vy = Math.min(MAX_FALL, p.vy + GRAV * dt);
    prev = p.y;
    p.y += p.vy * dt;
    if (p.vy >= 0) {
      for (i = 0; i < G.n; i++) {
        fy = FY(i);
        if (prev <= fy + 2 && p.y >= fy && p.y < fy + 16) {
          si = shaftIndex(p.x);
          if (si >= 0) {
            if (carAtFloor(si, i)) {
              p.ride = si;
              landOn(p, i, true);
              p.y = G.cars[si].y;
              break;
            }
          } else {
            if (p.state === 'fall' && p.floor >= 0 && i < p.floor - 1) {
              p.y = fy;
              kill('fall');
              return;
            }
            landOn(p, i, false);
            break;
          }
        }
      }
      for (i = 0; i < G.cars.length; i++) {
        destY = G.cars[i].y;
        if (shaftIndex(p.x) !== i) continue;
        if (prev <= destY + 2 && p.y >= destY && p.y < destY + 14) {
          p.ride = i;
          fi = alignedFloor(destY, G.n, 10);
          landOn(p, fi < 0 ? nearestFloor(destY, G.n) : fi, true);
          p.y = destY;
          break;
        }
      }
    }
    if (p.y > WH() - 8) {
      kill('fall');
      return;
    }
  } else if (p.floor >= 0 && p.state === 'walk') {
    p.y = FY(p.floor);
  } else if (p.coyote > 0) {
    p.coyote -= dt;
  }

  if (p.grounded && p.state === 'walk' && inEscape(p.x, p.floor, papersGot(G.doors), papersTotal(G.extract))) {
    doEscape();
  }
}

function tickDoors(dt) {
  var i, d;
  for (i = 0; i < G.doors.length; i++) {
    d = G.doors[i];
    if (d.kick > 0) d.kick -= dt;
    if (d.open > 0 && d.kick <= 0) d.open = Math.max(0, d.open - dt * 1.8);
  }
}

function tickFx(dt) {
  var i, o;
  G.comboAge += dt;
  if (G.comboAge > 1.5 && G.combo > 0) {
    G.combo = 0;
    comboEl.textContent = '×1';
    comboBox.classList.remove('hot');
  }
  G.shake *= Math.pow(0.04, dt);
  G.kickX *= Math.pow(0.02, dt);
  G.kickY *= Math.pow(0.02, dt);
  G.flash = Math.max(0, G.flash - dt);
  G.darkPulse = Math.max(0, G.darkPulse - dt);

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
    o.r += 70 * dt;
    if (o.t > 0.35) rings.splice(i, 1);
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
  for (i = casings.length - 1; i >= 0; i--) {
    o = casings[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.vy += 420 * dt;
    o.y += o.vy * dt;
    o.rot += o.vr * dt;
    if (o.t <= 0) casings.splice(i, 1);
  }
}

function tickCam(dt) {
  var target, maxY, p = G.player;
  maxY = Math.max(0, WH() - L.viewH);
  if (G.mode === 'title') {
    G.camT += dt;
    target = (Math.sin(G.camT * 0.22) * 0.5 + 0.5) * maxY;
  } else {
    target = p.y - L.viewH * 0.62;
  }
  target = clamp(target, 0, maxY);
  G.camY = lerp(G.camY, target, 1 - Math.pow(0.012, dt));
}

function tick(dt) {
  G.clock += dt;
  G.jumpBuf = Math.max(0, G.jumpBuf - dt);
  G.shotBuf = Math.max(0, G.shotBuf - dt);
  if (!keys.u) G.uLatch = false;
  if (!keys.d) G.dLatch = false;

  if (G.mode === 'play' && G.winT > 0) {
    G.winT -= dt;
    tickCars(dt);
    tickFx(dt);
    tickCam(dt);
    if (G.winT <= 0) showOver(true);
    return;
  }

  tickCars(dt);
  tickDoors(dt);

  G.spawnCd -= dt;
  if (G.spawnCd <= 0 && liveAgents() < maxAgents(G.extract, G.alarm)) {
    spawnAgent();
    G.spawnCd = spawnInterval(G.extract, G.alarm) * rand(0.8, 1.2);
  }

  tickAgents(dt);
  tickBullets(dt);

  if (G.mode === 'play') tickPlayer(dt);

  tickFx(dt);
  tickCam(dt);
  if (G.mode === 'play') {
    var fl = G.player.floor;
    if (fl < 0) fl = nearestFloor(G.player.y, G.n);
    floorLabel.textContent = (fl + 1) + 'F';
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
  var padB = coarseQ.matches ? 64 : 8;
  var avW = cssW;
  var avH = Math.max(40, cssH - padB);
  var s = avW / WORLD_W;
  var minShow = FH * 4.5;
  if (avH / s < minShow) s = avH / minShow;
  if (s * WORLD_W > avW) s = avW / WORLD_W;
  L.s = s;
  L.x = (avW - WORLD_W * s) / 2;
  L.y = 0;
  L.viewH = avH / s;
}

function sx(x) { return L.x + x * L.s; }
function sy(y) { return (y - G.camY) * L.s; }

function drawBg() {
  var g, i, x, y, n = G.n, wh = WH();
  ctx.fillStyle = '#07030c';
  ctx.fillRect(0, 0, cssW, cssH);

  g = ctx.createLinearGradient(0, sy(-40), 0, sy(wh));
  g.addColorStop(0, '#0a0614');
  g.addColorStop(1, '#12080c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.fillStyle = 'rgba(255,227,107,0.55)';
  for (i = 0; i < 28; i++) {
    x = sx((i * 97 + 13) % WORLD_W);
    y = sy(((i * 53) % (TOP + 40)) - 10);
    ctx.fillRect(x, y, 1.2 * L.s, 1.2 * L.s);
  }

  ctx.fillStyle = '#100814';
  ctx.fillRect(sx(8), sy(TOP - 18), (WORLD_W - 16) * L.s, (wh - (TOP - 18)) * L.s);

  ctx.fillStyle = '#1a0e18';
  ctx.fillRect(sx(4), sy(TOP - 22), (WORLD_W - 8) * L.s, 10 * L.s);
  ctx.fillStyle = '#ffb020';
  ctx.globalAlpha = 0.85;
  ctx.fillRect(sx(10), sy(TOP - 20), (WORLD_W - 20) * L.s, 3 * L.s);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#14101c';
  ctx.fillRect(sx(0), sy(FY(0) + 4), WORLD_W * L.s, STREET * L.s);
  ctx.fillStyle = 'rgba(255,176,32,0.12)';
  ctx.fillRect(sx(0), sy(FY(0) + 4), WORLD_W * L.s, 2 * L.s);

  for (i = 0; i < n; i++) {
    y = FY(i);
    if (sy(y) < -20 || sy(y - FH) > cssH + 20) continue;
    drawFloor(i);
  }
}

function drawFloor(i) {
  var y = FY(i);
  var dark = floorDark(G.lights, i);
  var k, s, x0, x1, yy, g;
  yy = sy(y);

  ctx.fillStyle = dark ? 'rgba(4, 6, 16, 0.92)' : 'rgba(18, 12, 24, 0.88)';
  ctx.fillRect(sx(12), sy(y - FH + 6), (WORLD_W - 24) * L.s, (FH - 8) * L.s);

  if (dark) {
    ctx.fillStyle = 'rgba(0, 8, 24, 0.45)';
    ctx.fillRect(sx(12), sy(y - FH + 6), (WORLD_W - 24) * L.s, (FH - 8) * L.s);
  }

  function slab(xa, xb) {
    if (xb <= xa) return;
    ctx.fillStyle = '#3a2418';
    ctx.fillRect(sx(xa), yy - 5 * L.s, (xb - xa) * L.s, 7 * L.s);
    ctx.fillStyle = '#ffb020';
    ctx.fillRect(sx(xa), yy - 5 * L.s, (xb - xa) * L.s, 2.2 * L.s);
    ctx.fillStyle = 'rgba(255, 227, 107, 0.45)';
    ctx.fillRect(sx(xa), yy - 5 * L.s, (xb - xa) * L.s, 0.8 * L.s);
  }
  x0 = 12;
  for (k = 0; k < SHAFTS.length; k++) {
    s = SHAFTS[k];
    slab(x0, s.x);
    x0 = s.x + s.w;
  }
  slab(x0, WORLD_W - 12);

  ctx.fillStyle = dark ? 'rgba(0, 40, 70, 0.25)' : 'rgba(255, 176, 32, 0.05)';
  ctx.fillRect(sx(12), sy(y - 7), (WORLD_W - 24) * L.s, 3 * L.s);

  ctx.font = 'bold ' + (8 * L.s) + 'px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
  ctx.textAlign = 'left';
  ctx.fillText((i + 1) + 'F', sx(16), sy(y - FH + 16));

  for (k = 0; k < SHAFTS.length; k++) {
    s = SHAFTS[k];
    ctx.fillStyle = '#06040c';
    ctx.fillRect(sx(s.x), sy(y - FH + 6), s.w * L.s, (FH - 6) * L.s);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 1.1 * L.s;
    ctx.beginPath();
    ctx.moveTo(sx(s.x), sy(y - FH + 6));
    ctx.lineTo(sx(s.x), yy);
    ctx.moveTo(sx(s.x + s.w), sy(y - FH + 6));
    ctx.lineTo(sx(s.x + s.w), yy);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 176, 32, 0.18)';
    ctx.beginPath();
    ctx.moveTo(sx(s.x + s.w * 0.5), sy(y - FH + 6));
    ctx.lineTo(sx(s.x + s.w * 0.5), yy);
    ctx.stroke();
  }
}

function drawEscalators() {
  var i, e, x, y0, y1, steps, s, t, px, py;
  t = G.clock * 2.4;
  for (i = 0; i < G.escs.length; i++) {
    e = G.escs[i];
    x = e.x;
    y0 = FY(e.lo);
    y1 = FY(e.hi);
    ctx.strokeStyle = 'rgba(255, 176, 32, 0.55)';
    ctx.lineWidth = 7 * L.s;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(sx(x), sy(y0));
    ctx.lineTo(sx(x + e.w), sy(y1));
    ctx.stroke();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.4 * L.s;
    ctx.stroke();
    steps = 7;
    for (s = 0; s < steps; s++) {
      px = lerp(x, x + e.w, ((s + (t % 1)) / steps) % 1);
      py = lerp(y0, y1, ((s + (t % 1)) / steps) % 1);
      ctx.fillStyle = '#ffe36b';
      ctx.fillRect(sx(px) - 3 * L.s, sy(py) - 1.5 * L.s, 6 * L.s, 3 * L.s);
    }
  }
}

function drawDoors() {
  var i, d, x, y, w, h, kick, col, frame;
  for (i = 0; i < G.doors.length; i++) {
    d = G.doors[i];
    y = FY(d.floor);
    if (sy(y) < -40 || sy(y - FH) > cssH + 20) continue;
    kick = d.kick > 0 ? Math.sin((1 - d.kick / 0.32) * Math.PI) * 8 : 0;
    w = DOOR_W;
    h = DOOR_H;
    x = d.x - w * 0.5 + (d.open > 0 ? 5 : 0);
    frame = d.secret ? '#ff3a4a' : '#4a5a78';
    ctx.fillStyle = '#0a0c14';
    ctx.fillRect(sx(d.x - w * 0.5), sy(y - h), w * L.s, h * L.s);
    col = d.secret ? (d.taken ? '#6a2030' : '#ff3a4a') : '#2a3450';
    ctx.fillStyle = col;
    ctx.fillRect(sx(x + kick * 0.2), sy(y - h + 1), (w - 2) * L.s, (h - 2) * L.s);
    ctx.strokeStyle = frame;
    ctx.lineWidth = 1.4 * L.s;
    ctx.strokeRect(sx(d.x - w * 0.5), sy(y - h), w * L.s, h * L.s);
    ctx.fillStyle = d.secret ? '#ffe36b' : '#00f0ff';
    ctx.fillRect(sx(d.x + 4), sy(y - h * 0.5), 1.6 * L.s, 1.6 * L.s);
    if (d.secret && !d.taken) {
      ctx.fillStyle = 'rgba(255, 58, 74, 0.25)';
      ctx.beginPath();
      ctx.arc(sx(d.x), sy(y - h * 0.6), (7 + Math.sin(G.clock * 5) * 1.4) * L.s, 0, TAU);
      ctx.fill();
    }
  }
}

function drawLights() {
  var i, Lgt, x, y, glow;
  for (i = 0; i < G.lights.length; i++) {
    Lgt = G.lights[i];
    x = sx(Lgt.x);
    y = sy(bulbY(Lgt.floor, G.n));
    ctx.strokeStyle = 'rgba(200, 200, 220, 0.35)';
    ctx.lineWidth = 1 * L.s;
    ctx.beginPath();
    ctx.moveTo(x, sy(FY(Lgt.floor) - FH + 6));
    ctx.lineTo(x, y);
    ctx.stroke();
    if (Lgt.on) {
      glow = ctx.createRadialGradient(x, y, 1, x, y, 16 * L.s);
      glow.addColorStop(0, 'rgba(255, 227, 107, 0.5)');
      glow.addColorStop(1, 'rgba(255, 227, 107, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 16 * L.s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffe36b';
      ctx.beginPath();
      ctx.arc(x, y, 3.4 * L.s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,240,0.85)';
      ctx.beginPath();
      ctx.arc(x - 0.8 * L.s, y - 0.8 * L.s, 1.1 * L.s, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = '#3a3040';
      ctx.beginPath();
      ctx.arc(x, y, 2.4 * L.s, 0, TAU);
      ctx.fill();
    }
  }
}

function drawCars() {
  var i, c, s, x, y, w, h;
  for (i = 0; i < G.cars.length; i++) {
    c = G.cars[i];
    s = SHAFTS[c.i];
    w = s.w - 4;
    h = CAR_H;
    x = sx(s.x + 2);
    y = sy(c.y - h);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.fillRect(x, y, w * L.s, h * L.s);
    ctx.strokeStyle = c.occ ? '#ffe36b' : '#00f0ff';
    ctx.lineWidth = 1.6 * L.s;
    ctx.strokeRect(x, y, w * L.s, h * L.s);
    ctx.fillStyle = '#ffb020';
    ctx.fillRect(x, sy(c.y - 4), w * L.s, 4 * L.s);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
    ctx.lineWidth = 1.1 * L.s;
    ctx.beginPath();
    ctx.moveTo(x + 4 * L.s, y + 6 * L.s);
    ctx.lineTo(x + 4 * L.s, sy(c.y - 6));
    ctx.moveTo(x + (w - 4) * L.s, y + 6 * L.s);
    ctx.lineTo(x + (w - 4) * L.s, sy(c.y - 6));
    ctx.stroke();
    ctx.fillStyle = c.ding > 0 ? '#ffe36b' : 'rgba(0,240,255,0.5)';
    ctx.fillRect(x + (w * 0.5 - 2) * L.s, y + 3 * L.s, 4 * L.s, 2.2 * L.s);
  }
}

function drawCarGetaway() {
  var x = sx(CAR_X + G.carGo - 6);
  var y = sy(FY(0));
  var ready = papersGot(G.doors) >= papersTotal(G.extract);
  var bob = Math.sin(G.clock * 6) * 0.6 * L.s;
  if (ready) {
    var g = ctx.createRadialGradient(x, y - 10 * L.s, 4, x, y - 10 * L.s, 28 * L.s);
    g.addColorStop(0, 'rgba(255,227,107,0.35)');
    g.addColorStop(1, 'rgba(255,227,107,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y - 8 * L.s, 28 * L.s, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#1a1020';
  ctx.fillRect(x - 16 * L.s, y - 12 * L.s + bob, 32 * L.s, 12 * L.s);
  ctx.fillStyle = ready ? '#ffb020' : '#6a4a20';
  ctx.fillRect(x - 14 * L.s, y - 18 * L.s + bob, 22 * L.s, 8 * L.s);
  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(x - 10 * L.s, y - 16.5 * L.s + bob, 8 * L.s, 4 * L.s);
  ctx.fillStyle = '#ff3db8';
  ctx.fillRect(x + 8 * L.s, y - 11 * L.s + bob, 3 * L.s, 2 * L.s);
  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(x - 9 * L.s, y - 2 * L.s + bob, 3.2 * L.s, 0, TAU);
  ctx.arc(x + 10 * L.s, y - 2 * L.s + bob, 3.2 * L.s, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 0.9 * L.s;
  ctx.beginPath();
  ctx.arc(x - 9 * L.s, y - 2 * L.s + bob, 3.2 * L.s, 0, TAU);
  ctx.arc(x + 10 * L.s, y - 2 * L.s + bob, 3.2 * L.s, 0, TAU);
  ctx.stroke();
}

function drawHuman(x, y, face, walk, kind, extra) {
  var sc = L.s;
  var stride = Math.sin(walk) * 3.1 * sc;
  var gun = extra && extra.muzzle > 0;
  ctx.save();
  ctx.translate(sx(x), sy(y));
  ctx.scale(face, extra && extra.squash ? extra.squash : 1);
  if (extra && extra.dead) ctx.rotate(0.7);
  if (extra && extra.drop) ctx.rotate(0.5);

  ctx.fillStyle = '#1a1018';
  ctx.fillRect(-3.2 * sc, -4 * sc, 2.3 * sc, 4 * sc + stride);
  ctx.fillRect(1 * sc, -4 * sc, 2.3 * sc, 4 * sc - stride);

  if (kind === 'spy') {
    ctx.fillStyle = '#141820';
    ctx.fillRect(-5 * sc, -15 * sc, 10 * sc, 12 * sc);
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(-2.2 * sc, -15 * sc, 4.4 * sc, 5 * sc);
  } else {
    ctx.fillStyle = '#1a0c14';
    ctx.fillRect(-5 * sc, -15 * sc, 10 * sc, 12 * sc);
    ctx.fillStyle = '#ff3db8';
    ctx.fillRect(-2 * sc, -12 * sc, 4 * sc, 2.2 * sc);
  }

  ctx.fillStyle = '#ffd0c0';
  ctx.beginPath();
  ctx.arc(0.3 * sc, -17.4 * sc, 3.8 * sc, 0, TAU);
  ctx.fill();

  if (kind === 'spy') {
    ctx.fillStyle = '#ffb020';
    ctx.fillRect(-4.6 * sc, -22 * sc, 9.4 * sc, 4 * sc);
    ctx.fillRect(1.4 * sc, -19.6 * sc, 5.2 * sc, 2 * sc);
  } else {
    ctx.fillStyle = '#2a1020';
    ctx.fillRect(-4.2 * sc, -21.2 * sc, 8.6 * sc, 3.4 * sc);
  }

  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(1.4 * sc, -17.2 * sc, 0.7 * sc, 0, TAU);
  ctx.fill();

  ctx.fillStyle = kind === 'spy' ? '#ffb020' : '#ff3db8';
  ctx.fillRect(4.2 * sc, -13 * sc, 7 * sc, 2.1 * sc);
  if (gun) {
    ctx.fillStyle = '#fff6c8';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(11 * sc, -12 * sc);
    ctx.lineTo(18 * sc, -14 * sc);
    ctx.lineTo(18 * sc, -10 * sc);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawPlayer() {
  var p = G.player;
  if (G.mode === 'title') return;
  if (p.state === 'door') return;
  if (p.state === 'win') return;
  if (p.inv > 0 && ((G.clock * 18) | 0) % 2 === 0) return;
  drawHuman(p.x, p.y, p.face, p.walk, 'spy', {
    squash: p.squash,
    muzzle: p.muzzle,
    dead: p.state === 'dead'
  });
}

function drawAgents() {
  var i, a, em;
  for (i = 0; i < G.agents.length; i++) {
    a = G.agents[i];
    em = a.emerge > 0 ? 1 - a.emerge / 0.28 : 1;
    if (em < 1) {
      ctx.save();
      ctx.globalAlpha = em;
      drawHuman(a.x, a.y, a.face, a.walk, 'agent', { drop: a.state === 'drop' });
      ctx.restore();
    } else {
      drawHuman(a.x, a.y, a.face, a.walk, 'agent', { drop: a.state === 'drop' });
    }
  }
}

function drawBullets() {
  var i, b, x, y;
  for (i = 0; i < G.bullets.length; i++) {
    b = G.bullets[i];
    x = sx(b.x);
    y = sy(b.y);
    ctx.fillStyle = b.from === 'p' ? '#ffe36b' : '#ff3db8';
    ctx.shadowColor = b.from === 'p' ? '#ffb020' : '#ff3db8';
    ctx.shadowBlur = 8 * L.s;
    ctx.fillRect(x - 4 * L.s, y - 1.2 * L.s, 8 * L.s, 2.4 * L.s);
    ctx.shadowBlur = 0;
  }
}

function drawFx() {
  var i, o, a;
  for (i = 0; i < rings.length; i++) {
    o = rings[i];
    a = 1 - o.t / 0.35;
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
    ctx.strokeStyle = rgba(o.rgb, clamp(o.t / 0.2, 0, 1));
    ctx.lineWidth = 1.2 * L.s;
    ctx.beginPath();
    ctx.moveTo(sx(o.x), sy(o.y));
    ctx.lineTo(sx(o.x - o.vx * 0.03), sy(o.y - o.vy * 0.03));
    ctx.stroke();
  }
  for (i = 0; i < shards.length; i++) {
    o = shards[i];
    ctx.save();
    ctx.translate(sx(o.x), sy(o.y));
    ctx.rotate(o.rot);
    ctx.fillStyle = o.t > 0.15 ? '#ffe36b' : 'rgba(255,227,107,0.4)';
    ctx.fillRect(-o.w * 0.5 * L.s, -1.2 * L.s, o.w * L.s, 2.4 * L.s);
    ctx.restore();
  }
  for (i = 0; i < casings.length; i++) {
    o = casings[i];
    ctx.save();
    ctx.translate(sx(o.x), sy(o.y));
    ctx.rotate(o.rot);
    ctx.fillStyle = '#ffb020';
    ctx.fillRect(-1.4 * L.s, -0.7 * L.s, 2.8 * L.s, 1.4 * L.s);
    ctx.restore();
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

function drawAlarmVignette() {
  if (!G.alarm || G.mode === 'title') return;
  var a = 0.08 + Math.sin(G.clock * 6) * 0.04;
  ctx.fillStyle = 'rgba(255, 40, 70, ' + a + ')';
  ctx.fillRect(0, 0, cssW, 8);
  ctx.fillRect(0, cssH - 8, cssW, 8);
}

function draw() {
  var shx, shy;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  shx = (G.shake ? (Math.random() - 0.5) * G.shake : 0) + G.kickX;
  shy = (G.shake ? (Math.random() - 0.5) * G.shake * 0.6 : 0) + G.kickY;
  ctx.translate(shx, shy);
  drawBg();
  drawEscalators();
  drawDoors();
  drawLights();
  drawCars();
  drawCarGetaway();
  drawAgents();
  drawPlayer();
  drawBullets();
  drawFx();
  drawFlash();
  drawAlarmVignette();
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
bindPad(btnDown, function (v) { keys.d = v; });
bindPad(btnUp, function (v) { keys.u = v; });
bindPad(btnJump, function (v) {
  keys.jump = v;
  if (v) G.jumpBuf = BUFFER;
});
bindPad(btnShot, function (v) {
  keys.shot = v;
  if (v) G.shotBuf = BUFFER;
});

function keyOn(e, down) {
  var k = e.code;
  if (k === 'ArrowLeft' || k === 'KeyA') { keys.l = down; e.preventDefault(); }
  else if (k === 'ArrowRight' || k === 'KeyD') { keys.r = down; e.preventDefault(); }
  else if (k === 'ArrowDown' || k === 'KeyS') { keys.d = down; e.preventDefault(); }
  else if (k === 'ArrowUp' || k === 'KeyW') {
    keys.u = down;
    if (down) G.jumpBuf = BUFFER;
    e.preventDefault();
  } else if (k === 'KeyZ' || k === 'KeyJ' || k === 'KeyK') {
    keys.jump = down;
    if (down) G.jumpBuf = BUFFER;
    e.preventDefault();
  } else if (k === 'Space' || k === 'KeyX') {
    keys.shot = down;
    if (down) G.shotBuf = BUFFER;
    e.preventDefault();
  }
}

window.addEventListener('keydown', function (e) {
  if (e.repeat) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown' ||
        e.code === 'ArrowLeft' || e.code === 'ArrowRight' ||
        e.code === 'KeyW' || e.code === 'KeyA' || e.code === 'KeyS' || e.code === 'KeyD' ||
        e.code === 'KeyZ' || e.code === 'KeyJ' || e.code === 'KeyK' || e.code === 'KeyX') {
      e.preventDefault();
    }
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.l = true;
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.r = true;
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.d = true;
    else if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.u = true;
    else if (e.code === 'KeyZ' || e.code === 'KeyJ' || e.code === 'KeyK') keys.jump = true;
    else if (e.code === 'Space' || e.code === 'KeyX') keys.shot = true;
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
      startRun('infil');
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      startRun('extract');
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
      goMenu();
      e.preventDefault();
      return;
    }
  }
  keyOn(e, true);
});

window.addEventListener('keyup', function (e) { keyOn(e, false); });

btnMute.addEventListener('click', function () {
  audio.ensure();
  audio.setMuted(!audio.muted);
});
btnRetry.addEventListener('click', function () {
  audio.ensure();
  retry();
});
btnInfil.addEventListener('click', function () {
  audio.ensure();
  startRun('infil');
});
btnExtract.addEventListener('click', function () {
  audio.ensure();
  startRun('extract');
});
ovRetry.addEventListener('click', function () {
  audio.ensure();
  startRun(G.kind);
});
ovModes.addEventListener('click', function () {
  audio.ensure();
  goMenu();
});

canvas.addEventListener('pointerdown', function () {
  audio.ensure();
  canvas.focus({ preventScroll: true });
  if (G.mode === 'play') G.shotBuf = BUFFER;
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

bestEl.textContent = String(G.bestI);
renderPips();
showTitle();
resize();
hudPlay();
modeLabel.textContent = '潜入';
requestAnimationFrame(frame);

}
