'use strict';

/* 桶山 — Donkey Kong-lite. No CDN. */

var WORLD_W = 360;
var WORLD_H = 500;
var LIVES = 3;
var PW = 12;
var PH = 20;
var WALK = 100;
var CLIMB = 84;
var JUMP_V = 256;
var GRAV = 920;
var MAX_FALL = 440;
var BARREL_R = 7.2;
var HAMMER_T = 6.8;
var INVULN = 0.9;
var DIE_T = 0.62;
var COYOTE = 0.08;
var BUFFER = 0.1;
var JUMP_SCORE = 100;
var SMASH_SCORE = 300;
var CLEAR_SCORE = 1000;
var CLEAR_ROUND = 200;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var BEST_KEY = 'playbox-kong-climb-best';
var MUTE_KEY = 'playbox-kong-climb-mute';

var FLOORS = [
  { x0: 16, x1: 344, yL: 430, yR: 408 },
  { x0: 16, x1: 344, yL: 308, yR: 330 },
  { x0: 16, x1: 344, yL: 228, yR: 206 },
  { x0: 16, x1: 344, yL: 114, yR: 136 }
];

var LADDERS = [
  { x: 76, lo: 0, hi: 1, kind: 'full' },
  { x: 172, lo: 0, hi: 1, kind: 'full' },
  { x: 268, lo: 0, hi: 1, kind: 'low' },
  { x: 52, lo: 1, hi: 2, kind: 'full' },
  { x: 148, lo: 1, hi: 2, kind: 'high' },
  { x: 254, lo: 1, hi: 2, kind: 'full' },
  { x: 88, lo: 2, hi: 3, kind: 'low' },
  { x: 186, lo: 2, hi: 3, kind: 'full' },
  { x: 292, lo: 2, hi: 3, kind: 'full' }
];

var HAMMER_SPOTS = [
  { x: 236, floor: 1 },
  { x: 118, floor: 2 }
];

var SPAWN = { x: 108, floor: 0 };
var KONG = { x: 46, floor: 3 };
var GOAL = { x0: 58, x1: 104 };
var OIL = { x: 34, floor: 0 };

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

function floorY(i, x) {
  var f = FLOORS[i];
  var t = (x - f.x0) / (f.x1 - f.x0);
  return lerp(f.yL, f.yR, clamp(t, 0, 1));
}

function xOnFloor(i, x) {
  var f = FLOORS[i];
  return x >= f.x0 - 2 && x <= f.x1 + 2;
}

function rollDir(i) {
  var f = FLOORS[i];
  return f.yR > f.yL ? 1 : -1;
}

function floorLowX(i) {
  return rollDir(i) > 0 ? FLOORS[i].x1 : FLOORS[i].x0;
}

function floorHighX(i) {
  return rollDir(i) > 0 ? FLOORS[i].x0 : FLOORS[i].x1;
}

function roundMul(round) {
  return 1 + Math.max(0, round - 1) * 0.18;
}

function barrelSpeed(round, rain) {
  return (rain ? 86 : 74) * roundMul(round);
}

function spawnInterval(round, rain) {
  var base = rain ? 0.68 : 1.32;
  var t = base / (1 + Math.max(0, round - 1) * 0.14);
  return t < (rain ? 0.36 : 0.56) ? (rain ? 0.36 : 0.56) : t;
}

function maxBarrels(rain) {
  return rain ? 14 : 8;
}

function ladderChance(rain) {
  return rain ? 0.12 : 0.22;
}

function jumpHeight() {
  return (JUMP_V * JUMP_V) / (2 * GRAV);
}

function ladderSpan(L) {
  var bot = floorY(L.lo, L.x);
  var top = floorY(L.hi, L.x);
  var span = bot - top;
  if (L.kind === 'low') return { top: bot - span * 0.46, bot: bot, broken: true };
  if (L.kind === 'high') return { top: top, bot: top + span * 0.46, broken: true };
  return { top: top, bot: bot, broken: false };
}

function floorAt(x, y, slop) {
  var i, fy;
  slop = slop == null ? 8 : slop;
  for (i = 0; i < FLOORS.length; i++) {
    if (!xOnFloor(i, x)) continue;
    fy = floorY(i, x);
    if (Math.abs(fy - y) <= slop) return i;
  }
  return -1;
}

function findLadder(x, y, dir) {
  var i, L, s;
  for (i = 0; i < LADDERS.length; i++) {
    L = LADDERS[i];
    if (Math.abs(x - L.x) > 8) continue;
    s = ladderSpan(L);
    if (dir > 0) {
      if (y > s.top + 5 && y <= s.bot + 10) return L;
    } else {
      if (y < s.bot - 5 && y >= s.top - 10) return L;
    }
  }
  return null;
}

function jumpClearsBarrel(px, py, state, bx, by, r) {
  if (state !== 'jump') return false;
  if (Math.abs(px - bx) > r + 11) return false;
  if (py >= by - 1) return false;
  if (py < by - 36) return false;
  return true;
}

function playerHitsBarrel(px, py, bx, by, r) {
  var hw = PW * 0.42;
  var left = px - hw;
  var right = px + hw;
  var top = py - PH + 2;
  var bot = py - 3;
  var cx = clamp(bx, left, right);
  var cy = clamp(by, top, bot);
  var dx = bx - cx;
  var dy = by - cy;
  return dx * dx + dy * dy < r * r;
}

function inGoal(x, floor) {
  return floor === 3 && x >= GOAL.x0 && x <= GOAL.x1;
}

function makeHammers() {
  return HAMMER_SPOTS.map(function (h) {
    return { x: h.x, floor: h.floor, taken: false };
  });
}

function makePlayer() {
  return {
    x: SPAWN.x,
    y: floorY(SPAWN.floor, SPAWN.x),
    vx: 0,
    vy: 0,
    face: 1,
    floor: SPAWN.floor,
    state: 'walk',
    grounded: true,
    walk: 0,
    coyote: 0,
    squash: 1,
    hammer: 0,
    inv: 0,
    deadT: 0,
    jumpY: 0,
    climbL: null,
    why: ''
  };
}

function makeBarrel(x, y, floor, spd) {
  return {
    x: x,
    y: y,
    r: BARREL_R,
    floor: floor,
    state: floor >= 0 ? 'roll' : 'fall',
    vx: 0,
    vy: 0,
    spd: spd,
    spin: 0,
    px: x,
    jumped: false,
    dead: false,
    destFloor: -1
  };
}

function selfCheck() {
  var h, i, L, s, p;

  if (FLOORS.length !== 4) throw new Error('4 floors');
  if (LIVES !== 3) throw new Error('3 lives');
  if (rollDir(3) !== 1) throw new Error('F3 rolls right');
  if (rollDir(2) !== -1) throw new Error('F2 rolls left');
  if (rollDir(1) !== 1) throw new Error('F1 rolls right');
  if (rollDir(0) !== -1) throw new Error('F0 rolls left');
  if (Math.abs(floorY(3, 16) - 114) > 0.01) throw new Error('F3 left y');
  if (Math.abs(floorY(3, 344) - 136) > 0.01) throw new Error('F3 right y');
  if (floorY(0, 180) <= 0) throw new Error('F0 y');
  if (jumpHeight() < BARREL_R * 2 + 8) throw new Error('jump must clear barrel');
  if (spawnInterval(1, true) >= spawnInterval(1, false)) throw new Error('rain denser');
  if (spawnInterval(2, false) >= spawnInterval(1, false)) throw new Error('round speeds spawn');
  if (barrelSpeed(2, false) <= barrelSpeed(1, false)) throw new Error('round speeds barrels');
  if (maxBarrels(true) <= maxBarrels(false)) throw new Error('rain more barrels');
  if (!inGoal(80, 3) || inGoal(80, 2) || inGoal(200, 3)) throw new Error('goal zone');
  if (HAMMER_SPOTS.length !== 2) throw new Error('2 hammers');
  if (HAMMER_SPOTS[0].floor === HAMMER_SPOTS[1].floor) throw new Error('hammers on different floors');
  if (floorAt(SPAWN.x, floorY(SPAWN.floor, SPAWN.x), 2) !== 0) throw new Error('spawn on F0');
  if (findLadder(76, floorY(0, 76), 1) == null) throw new Error('climb up from F0');
  if (findLadder(76, floorY(1, 76), -1) == null) throw new Error('climb down from F1');
  L = LADDERS[2];
  if (L.kind !== 'low') throw new Error('broken low ladder');
  s = ladderSpan(L);
  if (!s.broken) throw new Error('low is broken');
  if (s.top <= floorY(L.hi, L.x) + 4) throw new Error('low does not reach top');
  if (findLadder(L.x, floorY(L.hi, L.x), -1)) throw new Error('cannot descend broken low');

  h = jumpHeight();
  if (h < 28 || h > 50) throw new Error('jump height window');

  p = makePlayer();
  if (p.floor !== 0 || p.state !== 'walk') throw new Error('player spawn');

  if (!jumpClearsBarrel(100, 80, 'jump', 100, 100, 7)) throw new Error('jump over');
  if (jumpClearsBarrel(100, 110, 'jump', 100, 100, 7)) throw new Error('too low not over');
  if (jumpClearsBarrel(100, 80, 'walk', 100, 100, 7)) throw new Error('must be jumping');
  if (jumpClearsBarrel(140, 80, 'jump', 100, 100, 7)) throw new Error('too far');
  if (jumpClearsBarrel(100, 50, 'jump', 100, 100, 7)) throw new Error('other floor not over');
  if (!playerHitsBarrel(100, 108, 100, 100, 7.2)) throw new Error('barrel hit body');
  if (playerHitsBarrel(140, 108, 100, 100, 7.2)) throw new Error('barrel miss');

  if (roundMul(1) !== 1) throw new Error('round1 mul');
  if (floorLowX(3) !== FLOORS[3].x1) throw new Error('F3 low right');
  if (floorHighX(3) !== FLOORS[3].x0) throw new Error('F3 high left');

  for (i = 0; i < LADDERS.length; i++) {
    L = LADDERS[i];
    if (L.lo >= L.hi) throw new Error('ladder lo<hi');
    if (L.hi - L.lo !== 1) throw new Error('adjacent floors');
  }
  if (typeof GOAL.x0 !== 'number') throw new Error('goal');
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
var btnClassic = document.getElementById('btn-classic');
var btnRain = document.getElementById('btn-rain');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnLeft = document.getElementById('btn-left');
var btnRight = document.getElementById('btn-right');
var btnJump = document.getElementById('btn-jump');
var btnDown = document.getElementById('btn-down');
var scoreEl = document.getElementById('score');
var roundEl = document.getElementById('round');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var hammerBar = document.getElementById('hammer-bar');
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

var keys = { l: false, r: false, u: false, d: false };
var G = {
  mode: 'title',
  kind: 'classic',
  rain: false,
  clock: 0,
  round: 1,
  lives: LIVES,
  score: 0,
  bestC: 0,
  bestR: 0,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  player: makePlayer(),
  barrels: [],
  hammers: makeHammers(),
  spawnCd: 1.2,
  throwT: 0,
  kongBounce: 0,
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flash: 0,
  flashRgb: [255, 106, 40],
  clearT: 0,
  lock: 0,
  jumpBuf: 0,
  why: '',
  paused: false
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
    this.beep(280, 0.06, 'square', 0.05, 520);
    this.noise(0.04, 0.04, 1600, 'highpass');
  },
  land: function () {
    this.ensure();
    this.noise(0.05, 0.05, 380, 'bandpass');
    this.beep(160, 0.04, 'sine', 0.03, 80);
  },
  jumpOver: function (combo) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.07;
    this.beep(420 * p, 0.07, 'square', 0.07, 780 * p);
    this.beep(630 * p, 0.11, 'triangle', 0.05, 980 * p);
    this.noise(0.06, 0.06, 1800, 'highpass');
  },
  smash: function (combo) {
    this.ensure();
    var p = 1 + Math.min(6, combo) * 0.05;
    this.noise(0.12, 0.12, 240, 'lowpass');
    this.beep(180 * p, 0.1, 'square', 0.07, 70);
    this.beep(520 * p, 0.08, 'sawtooth', 0.03, 180);
  },
  die: function () {
    this.ensure();
    this.noise(0.16, 0.11, 280, 'lowpass');
    this.beep(320, 0.22, 'sawtooth', 0.06, 70);
    this.beep(180, 0.18, 'square', 0.04, 50);
  },
  climb: function () {
    this.ensure();
    this.beep(240, 0.03, 'square', 0.018, 280);
  },
  pickup: function () {
    this.ensure();
    this.beep(520, 0.08, 'triangle', 0.06, 880);
    this.beep(780, 0.12, 'square', 0.04, 1180);
  },
  throw: function () {
    this.ensure();
    this.noise(0.08, 0.06, 220, 'lowpass');
    this.beep(140, 0.09, 'sine', 0.04, 70);
  },
  oil: function () {
    this.ensure();
    this.noise(0.1, 0.07, 420, 'bandpass');
    this.beep(90, 0.08, 'sine', 0.03);
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
  ui: function () {
    this.ensure();
    this.beep(640, 0.05, 'square', 0.035, 420);
  },
  combo: function (n) {
    this.ensure();
    this.beep(440 + n * 40, 0.08, 'square', 0.05, 880 + n * 50);
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
    var s = localStorage.getItem(BEST_KEY);
    var o = JSON.parse(s);
    if (o && typeof o === 'object') {
      G.bestC = o.c | 0;
      G.bestR = o.r | 0;
      return;
    }
    if (typeof o === 'number') {
      G.bestC = o | 0;
      G.bestR = o | 0;
    }
  } catch (e) { /* ignore */ }
}

function persistBest() {
  var cur = G.rain ? G.bestR : G.bestC;
  if (G.score > cur) {
    if (G.rain) G.bestR = G.score;
    else G.bestC = G.score;
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ c: G.bestC, r: G.bestR }));
  } catch (e) { /* ignore */ }
}

function currentBest() {
  return G.rain ? G.bestR : G.bestC;
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
  for (i = 0; i < n; i++) {
    particles.push({
      x: x, y: y,
      vx: rand(-1, 1) * spd,
      vy: rand(-1.1, 0.2) * spd,
      t: life * rand(0.6, 1.2),
      max: life,
      r: rand(1.1, 2.4),
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
      vx: rand(-1, 1) * 46,
      vy: rand(-70, -20),
      t: rand(0.12, 0.28),
      rgb: rgb
    });
  }
}

function ringAt(x, y, rgb) {
  rings.push({ x: x, y: y, t: 0, rgb: rgb, r: 4 });
}

function floatText(x, y, text, rgb) {
  floats.push({ x: x, y: y, text: text, t: 0, rgb: rgb });
}

function shatter(x, y) {
  var i, a;
  for (i = 0; i < 9; i++) {
    a = (i / 9) * TAU + rand(-0.2, 0.2);
    shards.push({
      x: x, y: y,
      vx: Math.cos(a) * rand(40, 110),
      vy: Math.sin(a) * rand(30, 90) - 40,
      rot: rand(0, TAU),
      vr: rand(-8, 8),
      t: rand(0.28, 0.5),
      w: rand(3, 6)
    });
  }
}

function toast(msg, warn, gold) {
  toastEl.textContent = msg;
  toastEl.classList.toggle('warn', !!warn);
  toastEl.classList.toggle('gold', !!gold);
  toastEl.classList.remove('hidden');
  clearTimeout(toastTok);
  toastTok = setTimeout(function () { toastEl.classList.add('hidden'); }, 900);
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
  if (x != null) floatText(x, y - 18, label || ('+' + n), [255, 227, 107]);
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
    toast(G.combo >= 10 ? '连跳 ×' + G.combo : '连跳', false, true);
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

function hudPlay() {
  scoreEl.textContent = String(G.score);
  roundEl.textContent = String(G.round);
  bestEl.textContent = String(currentBest());
  comboEl.textContent = '×' + Math.max(1, G.combo);
  renderPips();
  modeLabel.textContent = G.rain ? '雨桶' : '经典';
  modeLabel.classList.toggle('rain', G.rain);
  if (G.mode === 'play') {
    hintEl.textContent = G.rain
      ? '雨桶如注 · 跳过去 · 空格跳 · R 重开'
      : '跳过木桶 · 爬梯上楼 · 锤子能砸 · 掉下去丢命';
  }
  syncHammer();
}

function syncHammer() {
  var p = G.player.hammer > 0 ? clamp(G.player.hammer / HAMMER_T, 0, 1) : 0;
  hammerBar.style.transform = 'scaleX(' + p + ')';
  hammerBar.classList.toggle('on', p > 0.001);
}

function showTitle() {
  G.mode = 'title';
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel';
  ovTitle.textContent = '桶山';
  ovLead.textContent = '四层钢梁，桶从顶上滚下来。跳过去最爽，拿锤砸更爽。爬到顶上救人。';
  ovOps.textContent = '方向键或 WASD · 空格 / 上 跳 · 触屏左 下 跳 右 · R 重开 · M 静音';
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
  hintEl.textContent = '跳过木桶 · 爬梯上楼 · 锤子能砸 · 掉下去或撞桶丢命';
  resetLevel(true);
  G.spawnCd = 0.4;
}

function showOver() {
  G.mode = 'over';
  persistBest();
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel lose';
  ovTitle.textContent = '命尽';
  ovLead.textContent = '第 ' + G.round + ' 关 · ' + G.score + ' 分 · 连跳最高 ×' + G.maxCombo +
    (G.why ? ' · ' + whyText(G.why) : '');
  ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
  audio.over();
  ovRetry.focus();
}

function whyText(w) {
  if (w === 'barrel') return '撞桶了';
  if (w === 'fall') return '摔下去了';
  return '';
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
  G.flash = 0;
}

function resetLevel(attract) {
  G.barrels = [];
  G.hammers = makeHammers();
  G.player = makePlayer();
  G.spawnCd = attract ? 0.5 : spawnInterval(G.round, G.rain) * 0.5;
  G.throwT = 0;
  G.clearT = 0;
  G.combo = 0;
  G.comboAge = 0;
  G.jumpBuf = 0;
  if (!attract) resetFx();
}

function startRun(kind) {
  G.kind = kind;
  G.rain = kind === 'rain';
  G.mode = 'play';
  G.clock = 0;
  G.round = 1;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  G.maxCombo = 0;
  G.comboAge = 0;
  G.why = '';
  G.lock = 0;
  resetLevel(false);
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  panelEl.className = 'panel';
  audio.start();
  hudPlay();
  toast(G.rain ? '雨桶' : '上梁', false, !G.rain);
  canvas.focus({ preventScroll: true });
}

function retry() {
  audio.ui();
  if (G.mode === 'title') startRun('classic');
  else startRun(G.kind);
}

function nextRound() {
  G.round += 1;
  persistBest();
  resetLevel(false);
  G.player.inv = 0.35;
  hudPlay();
  toast('第 ' + G.round + ' 关', false, true);
  audio.start();
}

/* ---- sim ---- */
function liveBarrels() {
  var n = 0, i;
  for (i = 0; i < G.barrels.length; i++) if (!G.barrels[i].dead) n++;
  return n;
}

function spawnBarrel() {
  var spd = barrelSpeed(G.round, G.rain);
  var x = KONG.x + 22;
  var y = floorY(3, x) - BARREL_R;
  G.barrels.push(makeBarrel(x, y, 3, spd));
  G.throwT = 0.32;
  if (G.mode === 'play') audio.throw();
}

function consumeBarrel(b) {
  b.dead = true;
  burst(b.x, b.y, 8, [255, 106, 40], 38, 0.32, 20);
  if (G.mode === 'play') audio.oil();
}

function maybeTakeLadder(b) {
  var i, L, crossed;
  for (i = 0; i < LADDERS.length; i++) {
    L = LADDERS[i];
    if (L.kind !== 'full' || L.hi !== b.floor) continue;
    crossed = (b.px - L.x) * (b.x - L.x) <= 0;
    if (!crossed) continue;
    if (Math.abs(b.x - L.x) > 10) continue;
    if (Math.random() > ladderChance(G.rain)) return;
    b.state = 'down';
    b.x = L.x;
    b.destFloor = L.lo;
    b.vx = 0;
    return;
  }
}

function tickBarrel(b, dt) {
  var i, fy, feet, prev, dir, f;
  if (b.dead) return;
  b.px = b.x;
  if (b.state === 'roll') {
    dir = rollDir(b.floor);
    b.vx = dir * b.spd;
    b.x += b.vx * dt;
    b.spin += dir * b.spd * dt * 0.24;
    if (xOnFloor(b.floor, b.x)) {
      b.y = floorY(b.floor, b.x) - b.r;
    }
    maybeTakeLadder(b);
    if (b.state !== 'roll') return;
    f = FLOORS[b.floor];
    if (dir > 0 && b.x > f.x1 - 5) {
      b.state = 'fall';
      b.floor = -1;
      b.vy = 30;
    } else if (dir < 0 && b.x < f.x0 + 5) {
      b.state = 'fall';
      b.floor = -1;
      b.vy = 30;
    }
  } else if (b.state === 'down') {
    b.y += b.spd * 0.9 * dt;
    b.spin += 10 * dt;
    fy = floorY(b.destFloor, b.x);
    if (b.y + b.r >= fy) {
      b.floor = b.destFloor;
      b.state = 'roll';
      b.y = fy - b.r;
      b.vy = 0;
    }
  } else if (b.state === 'fall') {
    b.vy = Math.min(MAX_FALL, b.vy + GRAV * dt);
    b.x += b.vx * dt;
    prev = b.y;
    b.y += b.vy * dt;
    b.spin += 12 * dt;
    b.x = clamp(b.x, 12, WORLD_W - 12);
    for (i = 0; i < FLOORS.length; i++) {
      if (!xOnFloor(i, b.x)) continue;
      fy = floorY(i, b.x);
      feet = b.y + b.r;
      if (prev + b.r <= fy + 1 && feet >= fy && b.vy > 0) {
        b.floor = i;
        b.state = 'roll';
        b.y = fy - b.r;
        b.vy = 0;
        break;
      }
    }
    if (b.y > WORLD_H - 28) consumeBarrel(b);
  }
}

function tickBarrels(dt) {
  var i;
  for (i = 0; i < G.barrels.length; i++) tickBarrel(G.barrels[i], dt);
  if (G.barrels.length > 28) {
    G.barrels = G.barrels.filter(function (b) { return !b.dead; });
  }
}

function canJump(p) {
  return (p.grounded || p.coyote > 0) && p.state !== 'dead' && p.state !== 'win';
}

function doJump(p) {
  p.vy = -JUMP_V;
  p.grounded = false;
  p.state = 'jump';
  p.jumpY = p.y;
  p.coyote = 0;
  p.squash = 0.62;
  p.climbL = null;
  audio.hop();
  hitStop(0.03);
  kick(1.6);
  burst(p.x, p.y, 6, [255, 180, 120], 28, 0.22, 16);
}

function jumpOff(p) {
  var dir = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
  p.vy = -JUMP_V * 0.82;
  p.vx = (dir || p.face) * WALK * 0.85;
  p.face = dir || p.face;
  p.grounded = false;
  p.state = 'jump';
  p.jumpY = p.y;
  p.climbL = null;
  p.squash = 0.7;
  audio.hop();
}

function grabLadder(p, L, dir) {
  p.state = 'climb';
  p.climbL = L;
  p.x = L.x;
  p.vx = 0;
  p.vy = 0;
  p.grounded = false;
  p.floor = -1;
  if (dir > 0) p.y -= 2;
  else p.y += 2;
  audio.climb();
}

function landOn(p, i) {
  var wasJump = p.state === 'jump';
  p.floor = i;
  p.y = floorY(i, p.x);
  p.vy = 0;
  p.grounded = true;
  p.state = 'walk';
  p.coyote = COYOTE;
  p.squash = 0.78;
  p.climbL = null;
  if (wasJump) {
    audio.land();
    burst(p.x, p.y, 5, [255, 160, 90], 22, 0.18, 14);
  }
}

function kill(why) {
  var p = G.player;
  if (p.state === 'dead' || p.state === 'win') return;
  if (p.inv > 0 && why === 'barrel') return;
  p.state = 'dead';
  p.why = why;
  p.deadT = DIE_T;
  p.vy = -150;
  p.vx = -p.face * 55;
  p.grounded = false;
  p.hammer = 0;
  G.why = why;
  G.combo = 0;
  audio.die();
  hitStop(0.08);
  shake(7);
  flash([255, 61, 184], 0.18);
  burst(p.x, p.y - 10, 16, [255, 61, 184], 70, 0.4, 24);
  spark(p.x, p.y - 8, [255, 200, 230], 8);
  stageEl.classList.remove('die');
  void stageEl.offsetWidth;
  stageEl.classList.add('die');
  setTimeout(function () { stageEl.classList.remove('die'); }, 360);
}

function finishDead() {
  G.lives -= 1;
  hudPlay();
  if (G.lives <= 0) {
    showOver();
    return;
  }
  G.player = makePlayer();
  G.player.inv = INVULN;
  toast(G.why === 'fall' ? '摔了' : '撞桶', true, false);
}

function doClear() {
  var p = G.player;
  var bonus;
  if (p.state === 'win') return;
  p.state = 'win';
  p.vx = 0;
  p.vy = 0;
  G.clearT = 1.05;
  bonus = CLEAR_SCORE + G.round * CLEAR_ROUND;
  addScore(bonus, p.x, p.y, '+' + bonus);
  audio.clear();
  hitStop(0.09);
  flash([255, 227, 107], 0.22);
  burst(p.x, p.y - 16, 22, [255, 227, 107], 80, 0.5, 10);
  burst(GOAL.x0 + 20, floorY(3, 80) - 24, 14, [255, 61, 184], 50, 0.4, 8);
  ringAt(p.x, p.y - 12, [255, 227, 107]);
  stageEl.classList.remove('clear');
  void stageEl.offsetWidth;
  stageEl.classList.add('clear');
  setTimeout(function () { stageEl.classList.remove('clear'); }, 320);
  toast('过关', false, true);
}

function smashBarrel(b) {
  var n;
  if (b.dead) return;
  b.dead = true;
  bumpCombo();
  n = SMASH_SCORE * G.combo;
  addScore(n, b.x, b.y, '+' + n);
  audio.smash(G.combo);
  hitStop(0.07);
  kick(2.8);
  shake(3);
  flash([255, 180, 60], 0.1);
  shatter(b.x, b.y);
  burst(b.x, b.y, 14, [255, 140, 50], 70, 0.36, 22);
  ringAt(b.x, b.y, [255, 227, 107]);
  stageEl.classList.remove('smash');
  void stageEl.offsetWidth;
  stageEl.classList.add('smash');
  setTimeout(function () { stageEl.classList.remove('smash'); }, 220);
}

function scoreJump(b, p) {
  var n;
  if (b.jumped) return;
  b.jumped = true;
  bumpCombo();
  n = JUMP_SCORE * G.combo;
  addScore(n, p.x, p.y - 8, '+' + n);
  audio.jumpOver(G.combo);
  hitStop(0.055);
  kick(2.2);
  spark(b.x, b.y - 6, [255, 227, 107], 7);
  burst(p.x, p.y, 8, [0, 240, 255], 36, 0.28, 8);
  ringAt(b.x, b.y, [0, 240, 255]);
  floatText(p.x, p.y - 28, G.combo >= 2 ? '连跳 ×' + G.combo : '跳过', [0, 240, 255]);
}

function pickupHammer(h) {
  var p = G.player;
  h.taken = true;
  p.hammer = HAMMER_T;
  audio.pickup();
  hitStop(0.04);
  kick(1.8);
  burst(h.x, floorY(h.floor, h.x) - 12, 12, [255, 227, 107], 50, 0.32, 8);
  spark(h.x, floorY(h.floor, h.x) - 10, [255, 250, 200], 8);
  toast('锤子', false, true);
  syncHammer();
}

function handleInput(p, dt) {
  var dir, Ladd;
  if (p.state === 'dead' || p.state === 'win') return;

  if (p.state === 'climb') {
    dir = (keys.u ? -1 : 0) + (keys.d ? 1 : 0);
    if (dir) {
      p.y += dir * CLIMB * dt;
      p.walk += CLIMB * dt * 0.08;
    }
    if (p.climbL) {
      var s = ladderSpan(p.climbL);
      var fi;
      if (p.y <= s.top + 1.5) {
        if (keys.u) {
          fi = floorAt(p.x, s.top, 10);
          if (fi >= 0) landOn(p, fi);
          else p.y = s.top;
        } else {
          p.y = Math.max(p.y, s.top);
        }
      } else if (p.y >= s.bot - 1.5) {
        if (keys.d) {
          fi = floorAt(p.x, s.bot, 10);
          if (fi >= 0) landOn(p, fi);
          else p.y = s.bot;
        } else {
          p.y = Math.min(p.y, s.bot);
        }
      }
    }
    if (G.jumpBuf > 0 && (!keys.u || keys.l || keys.r) && p.state === 'climb') {
      jumpOff(p);
      G.jumpBuf = 0;
    }
    return;
  }

  if (p.hammer <= 0 && p.state !== 'fall') {
    if (keys.d) {
      Ladd = findLadder(p.x, p.y, -1);
      if (Ladd) {
        grabLadder(p, Ladd, -1);
        return;
      }
    }
    if (keys.u) {
      Ladd = findLadder(p.x, p.y, 1);
      if (Ladd) {
        grabLadder(p, Ladd, 1);
        G.jumpBuf = 0;
        return;
      }
    }
  }

  if (G.jumpBuf > 0 && canJump(p)) {
    doJump(p);
    G.jumpBuf = 0;
  }
}

function tickPlayer(dt) {
  var p = G.player;
  var dir, nx, high, low, i, fy, prev, fi;

  if (p.inv > 0) p.inv -= dt;
  if (p.hammer > 0) {
    p.hammer -= dt;
    if (p.hammer < 0) p.hammer = 0;
  }
  p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));

  if (p.state === 'dead') {
    p.vy += GRAV * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.deadT -= dt;
    if (p.deadT <= 0) finishDead();
    return;
  }
  if (p.state === 'win') return;

  handleInput(p, dt);
  if (p.state === 'dead' || p.state === 'win') return;

  if (p.state === 'climb') return;

  dir = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
  if (dir) p.face = dir;
  p.vx = dir * WALK * (p.grounded ? 1 : 0.9);
  if (dir) p.walk += Math.abs(p.vx) * dt * 0.22;
  nx = p.x + p.vx * dt;

  if (p.grounded && p.floor >= 0) {
    high = floorHighX(p.floor);
    low = floorLowX(p.floor);
    if (rollDir(p.floor) > 0) {
      if (nx < high + 6) nx = high + 6;
      if (nx > low - 4) {
        p.grounded = false;
        p.state = 'fall';
        p.vy = 20;
      }
    } else {
      if (nx > high - 6) nx = high - 6;
      if (nx < low + 4) {
        p.grounded = false;
        p.state = 'fall';
        p.vy = 20;
      }
    }
  }
  p.x = clamp(nx, 14, WORLD_W - 14);

  if (!p.grounded && p.state !== 'climb') {
    p.vy = Math.min(MAX_FALL, p.vy + GRAV * dt);
    if (p.state === 'jump' && p.y > p.jumpY + 38) p.state = 'fall';
    prev = p.y;
    p.y += p.vy * dt;
    if (p.vy >= 0) {
      for (i = 0; i < FLOORS.length; i++) {
        if (!xOnFloor(i, p.x)) continue;
        fy = floorY(i, p.x);
        if (prev <= fy + 2 && p.y >= fy && p.y < fy + 18) {
          if (p.state === 'fall') {
            p.y = fy;
            kill('fall');
            return;
          }
          if (p.state === 'jump' && p.floor >= 0 && i < p.floor) {
            p.y = fy;
            kill('fall');
            return;
          }
          landOn(p, i);
          break;
        }
      }
    }
    if (p.y > WORLD_H - 20) {
      kill('fall');
      return;
    }
  } else if (p.floor >= 0) {
    p.y = floorY(p.floor, p.x);
    p.coyote = COYOTE;
  } else if (p.coyote > 0) {
    p.coyote -= dt;
  }

  if (p.grounded && p.hammer <= 0) {
    for (i = 0; i < G.hammers.length; i++) {
      var h = G.hammers[i];
      if (h.taken || h.floor !== p.floor) continue;
      if (Math.abs(p.x - h.x) < 12) pickupHammer(h);
    }
  }

  if (inGoal(p.x, p.floor) && p.grounded) doClear();
}

function collideBarrels() {
  var p = G.player;
  var i, b;
  if (p.state === 'dead' || p.state === 'win') return;
  if (G.mode !== 'play') return;
  for (i = 0; i < G.barrels.length; i++) {
    b = G.barrels[i];
    if (b.dead) continue;
    if (p.hammer > 0 && playerHitsBarrel(p.x + p.face * 8, p.y, b.x, b.y, b.r + 2)) {
      smashBarrel(b);
      continue;
    }
    if (jumpClearsBarrel(p.x, p.y, p.state, b.x, b.y, b.r)) {
      scoreJump(b, p);
      continue;
    }
    if (!playerHitsBarrel(p.x, p.y, b.x, b.y, b.r)) continue;
    kill('barrel');
    return;
  }
}

function tickFx(dt) {
  var i, o;
  G.comboAge += dt;
  if (G.comboAge > 1.45 && G.combo > 0) {
    G.combo = 0;
    comboEl.textContent = '×1';
  }
  G.shake *= Math.pow(0.04, dt);
  G.kickX *= Math.pow(0.02, dt);
  G.kickY *= Math.pow(0.02, dt);
  G.flash = Math.max(0, G.flash - dt);
  G.kongBounce += dt;

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
}

function tick(dt) {
  G.clock += dt;
  G.jumpBuf = Math.max(0, G.jumpBuf - dt);

  if (G.mode === 'play' && G.clearT > 0) {
    G.clearT -= dt;
    tickFx(dt);
    if (G.clearT <= 0) nextRound();
    return;
  }

  if (G.throwT > 0) G.throwT -= dt;

  G.spawnCd -= dt;
  if (G.spawnCd <= 0 && liveBarrels() < maxBarrels(G.rain)) {
    spawnBarrel();
    G.spawnCd = spawnInterval(G.round, G.rain) * rand(0.82, 1.18);
  }

  tickBarrels(dt);

  if (G.mode === 'play') {
    tickPlayer(dt);
    collideBarrels();
  }

  tickFx(dt);
  if (G.mode === 'play') syncHammer();
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
  var g, i, x;
  ctx.fillStyle = '#07030c';
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(60), sy(80), 10, sx(60), sy(80), 180 * L.s);
  g.addColorStop(0, 'rgba(255,106,40,0.16)');
  g.addColorStop(1, 'rgba(255,106,40,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(300), sy(40), 8, sx(300), sy(40), 140 * L.s);
  g.addColorStop(0, 'rgba(255,61,184,0.1)');
  g.addColorStop(1, 'rgba(255,61,184,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.fillStyle = 'rgba(18, 10, 22, 0.9)';
  ctx.fillRect(sx(4), sy(8), 12 * L.s, (WORLD_H - 16) * L.s);
  ctx.fillRect(sx(WORLD_W - 16), sy(8), 12 * L.s, (WORLD_H - 16) * L.s);

  ctx.strokeStyle = 'rgba(255,106,40,0.18)';
  ctx.lineWidth = 1.2 * L.s;
  for (i = 0; i < 14; i++) {
    x = sy(24 + i * 34);
    ctx.beginPath();
    ctx.moveTo(sx(4), x);
    ctx.lineTo(sx(16), x);
    ctx.moveTo(sx(WORLD_W - 16), x);
    ctx.lineTo(sx(WORLD_W - 4), x);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 106, 40, 0.05)';
  for (i = 0; i < 9; i++) {
    ctx.fillRect(sx(28 + i * 36), sy(20), 2 * L.s, (WORLD_H - 40) * L.s);
  }
}

function drawGirder(i) {
  var f = FLOORS[i];
  var x0 = sx(f.x0);
  var y0 = sy(f.yL);
  var x1 = sx(f.x1);
  var y1 = sy(f.yR);
  var th = 9 * L.s;
  var dx = f.x1 - f.x0;
  var dy = f.yR - f.yL;
  var len = hypot(dx, dy);
  var n = Math.max(8, (len / 16) | 0);
  var k, t, px, py, nx, ny, rx, ry;

  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(80, 16, 8, 0.7)';
  ctx.lineWidth = th + 3 * L.s;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();

  gStroke('#6a2210', th + 1.2 * L.s, x0, y0, x1, y1);
  gStroke('#ff6a28', th, x0, y0, x1, y1);
  ctx.strokeStyle = 'rgba(255, 210, 140, 0.55)';
  ctx.lineWidth = 2.1 * L.s;
  ctx.beginPath();
  ctx.moveTo(x0, y0 - 2.4 * L.s);
  ctx.lineTo(x1, y1 - 2.4 * L.s);
  ctx.stroke();

  nx = -dy / len;
  ny = dx / len;
  for (k = 0; k <= n; k++) {
    t = k / n;
    px = lerp(x0, x1, t);
    py = lerp(y0, y1, t);
    rx = px + nx * 0.4 * L.s;
    ry = py + ny * 0.4 * L.s;
    ctx.fillStyle = k % 2 ? '#ffe36b' : '#ffb070';
    ctx.beginPath();
    ctx.arc(rx, ry, 1.35 * L.s, 0, TAU);
    ctx.fill();
  }
}

function gStroke(col, w, x0, y0, x1, y1) {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

function drawLadders() {
  var i, Ladd, s, x, top, bot, rungs, r, yy;
  ctx.lineCap = 'butt';
  for (i = 0; i < LADDERS.length; i++) {
    Ladd = LADDERS[i];
    s = ladderSpan(Ladd);
    x = sx(Ladd.x);
    top = sy(s.top);
    bot = sy(s.bot);
    ctx.strokeStyle = s.broken ? 'rgba(0, 240, 255, 0.45)' : 'rgba(0, 240, 255, 0.85)';
    ctx.lineWidth = 1.6 * L.s;
    ctx.beginPath();
    ctx.moveTo(x - 4.2 * L.s, top);
    ctx.lineTo(x - 4.2 * L.s, bot);
    ctx.moveTo(x + 4.2 * L.s, top);
    ctx.lineTo(x + 4.2 * L.s, bot);
    ctx.stroke();
    rungs = Math.max(3, ((s.bot - s.top) / 9) | 0);
    ctx.strokeStyle = s.broken ? 'rgba(0, 200, 220, 0.4)' : '#00f0ff';
    ctx.lineWidth = 1.35 * L.s;
    for (r = 0; r <= rungs; r++) {
      yy = lerp(top, bot, r / rungs);
      ctx.beginPath();
      ctx.moveTo(x - 4.6 * L.s, yy);
      ctx.lineTo(x + 4.6 * L.s, yy);
      ctx.stroke();
    }
  }
}

function drawOil() {
  var x = sx(OIL.x);
  var y = sy(floorY(OIL.floor, OIL.x));
  var t = G.clock;
  var i, f;
  ctx.fillStyle = '#2a1018';
  ctx.fillRect(x - 9 * L.s, y - 16 * L.s, 18 * L.s, 16 * L.s);
  ctx.strokeStyle = '#ff6a28';
  ctx.lineWidth = 1.3 * L.s;
  ctx.strokeRect(x - 9 * L.s, y - 16 * L.s, 18 * L.s, 16 * L.s);
  ctx.fillStyle = '#ff3db8';
  ctx.fillRect(x - 7 * L.s, y - 6 * L.s, 14 * L.s, 3 * L.s);
  for (i = 0; i < 4; i++) {
    f = (Math.sin(t * 11 + i * 1.7) + 1) * 0.5;
    ctx.fillStyle = i % 2 ? 'rgba(255,180,40,0.9)' : 'rgba(255,80,40,0.85)';
    ctx.beginPath();
    ctx.moveTo(x - 5 * L.s + i * 3.2 * L.s, y - 16 * L.s);
    ctx.lineTo(x - 3 * L.s + i * 3.2 * L.s, y - (22 + f * 10) * L.s);
    ctx.lineTo(x - 1 * L.s + i * 3.2 * L.s, y - 16 * L.s);
    ctx.fill();
  }
}

function drawHammers() {
  var i, h, x, y, swing;
  for (i = 0; i < G.hammers.length; i++) {
    h = G.hammers[i];
    if (h.taken) continue;
    x = sx(h.x);
    y = sy(floorY(h.floor, h.x) - 13);
    swing = Math.sin(G.clock * 4) * 0.18;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(swing);
    ctx.fillStyle = '#6a3a12';
    ctx.fillRect(-1.1 * L.s, -2 * L.s, 2.2 * L.s, 12 * L.s);
    ctx.fillStyle = '#ffe36b';
    ctx.fillRect(-6 * L.s, -8 * L.s, 12 * L.s, 7 * L.s);
    ctx.fillStyle = '#ffb020';
    ctx.fillRect(-6 * L.s, -8 * L.s, 12 * L.s, 2 * L.s);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,227,107,0.25)';
    ctx.beginPath();
    ctx.arc(x, y, (8 + Math.sin(G.clock * 5) * 1.5) * L.s, 0, TAU);
    ctx.fill();
  }
}

function drawBarrel(b) {
  var x, y, g;
  if (b.dead) return;
  x = sx(b.x);
  y = sy(b.y);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(b.spin);
  g = ctx.createRadialGradient(-2 * L.s, -2 * L.s, 1, 0, 0, b.r * L.s);
  g.addColorStop(0, '#e09048');
  g.addColorStop(1, '#8a3810');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, b.r * L.s, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#ffe36b';
  ctx.lineWidth = 1.15 * L.s;
  ctx.beginPath();
  ctx.arc(0, 0, b.r * 0.62 * L.s, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-b.r * L.s, 0);
  ctx.lineTo(b.r * L.s, 0);
  ctx.stroke();
  ctx.strokeStyle = '#c45a18';
  ctx.lineWidth = 1.4 * L.s;
  ctx.stroke();
  ctx.restore();
}

function drawKong() {
  var x = sx(KONG.x);
  var base = sy(floorY(KONG.floor, KONG.x));
  var bob = Math.abs(Math.sin(G.kongBounce * 3.2)) * 3.2 * L.s;
  var throwN = G.throwT > 0 ? (1 - G.throwT / 0.32) : 0;
  var arm = throwN > 0 ? -0.9 + throwN * 1.8 : Math.sin(G.kongBounce * 2.4) * 0.2;
  ctx.save();
  ctx.translate(x, base - bob);

  ctx.fillStyle = '#6a2e12';
  ctx.beginPath();
  ctx.ellipse(0, -16 * L.s, 14 * L.s, 16 * L.s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c87840';
  ctx.beginPath();
  ctx.ellipse(1 * L.s, -13 * L.s, 8 * L.s, 10 * L.s, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#5a2410';
  ctx.beginPath();
  ctx.arc(-1 * L.s, -32 * L.s, 10 * L.s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e0a060';
  ctx.beginPath();
  ctx.ellipse(3 * L.s, -29 * L.s, 6 * L.s, 5 * L.s, 0.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#00f0ff';
  ctx.beginPath();
  ctx.arc(-4 * L.s, -34 * L.s, 1.5 * L.s, 0, TAU);
  ctx.arc(3 * L.s, -34.5 * L.s, 1.5 * L.s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(-4 * L.s, -34 * L.s, 0.6 * L.s, 0, TAU);
  ctx.arc(3.2 * L.s, -34.5 * L.s, 0.6 * L.s, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#ffe36b';
  ctx.fillRect(-2.2 * L.s, -8 * L.s, 4.4 * L.s, 9 * L.s);

  ctx.save();
  ctx.translate(12 * L.s, -18 * L.s);
  ctx.rotate(arm);
  ctx.fillStyle = '#6a2e12';
  ctx.fillRect(0, -3 * L.s, 16 * L.s, 6 * L.s);
  ctx.beginPath();
  ctx.arc(16 * L.s, 0, 4 * L.s, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#5a2410';
  ctx.fillRect(-12 * L.s, -8 * L.s, 6 * L.s, 12 * L.s);
  ctx.fillRect(-8 * L.s, -2 * L.s, 5 * L.s, 8 * L.s);
  ctx.fillRect(3 * L.s, -2 * L.s, 5 * L.s, 8 * L.s);

  ctx.restore();
}

function drawPauline() {
  var x = sx(82);
  var y = sy(floorY(3, 82));
  var bob = Math.sin(G.clock * 2.6) * 1.4 * L.s;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = '#ff3db8';
  ctx.beginPath();
  ctx.moveTo(-5 * L.s, -6 * L.s);
  ctx.lineTo(5 * L.s, -6 * L.s);
  ctx.lineTo(6.5 * L.s, 0);
  ctx.lineTo(-6.5 * L.s, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd0c0';
  ctx.beginPath();
  ctx.arc(0, -11 * L.s, 3.4 * L.s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffe36b';
  ctx.beginPath();
  ctx.arc(0, -15.2 * L.s, 2.1 * L.s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff3db8';
  ctx.fillRect(-2.4 * L.s, -8 * L.s, 4.8 * L.s, 3 * L.s);
  ctx.restore();

  var hx = sx(82);
  var hy = sy(floorY(3, 82) - 28 + Math.sin(G.clock * 3) * 2);
  ctx.fillStyle = 'rgba(255,61,184,0.9)';
  ctx.save();
  ctx.translate(hx + 12 * L.s, hy);
  ctx.beginPath();
  ctx.moveTo(0, 2.4 * L.s);
  ctx.bezierCurveTo(-6 * L.s, -3 * L.s, -3 * L.s, -7 * L.s, 0, -3.5 * L.s);
  ctx.bezierCurveTo(3 * L.s, -7 * L.s, 6 * L.s, -3 * L.s, 0, 2.4 * L.s);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = 'rgba(255, 61, 184, 0.8)';
  ctx.font = 'bold ' + (7 * L.s) + 'px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('救', sx(82), sy(floorY(3, 82) - 34 + Math.sin(G.clock * 2.6) * 1.4));
}

function drawPlayer() {
  var p = G.player;
  var x, y, stride, leg, blink, ham, swing, cap;
  if (G.mode === 'title') return;
  if (p.inv > 0 && ((G.clock * 18) | 0) % 2 === 0) return;
  x = sx(p.x);
  y = sy(p.y);
  stride = p.state === 'climb' ? Math.sin(p.walk * 1.4) : Math.sin(p.walk);
  leg = p.grounded || p.state === 'climb' ? stride * 3.2 * L.s : 2 * L.s;
  blink = p.state === 'dead' ? 0.4 : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p.face, p.squash);
  ctx.globalAlpha = blink;

  if (p.state === 'dead') ctx.rotate(0.6);

  cap = p.hammer > 0 ? '#ffe36b' : '#ff6a28';

  ctx.fillStyle = '#2a1a10';
  ctx.fillRect(-3.4 * L.s, -4 * L.s, 2.4 * L.s, 4 * L.s + leg);
  ctx.fillRect(1 * L.s, -4 * L.s, 2.4 * L.s, 4 * L.s - leg);

  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(-5 * L.s, -14 * L.s, 10 * L.s, 11 * L.s);
  ctx.fillStyle = '#0090aa';
  ctx.fillRect(-5 * L.s, -8 * L.s, 10 * L.s, 2 * L.s);

  ctx.fillStyle = '#ffd0c0';
  ctx.beginPath();
  ctx.arc(0.4 * L.s, -16.5 * L.s, 4.1 * L.s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = cap;
  ctx.fillRect(-4.6 * L.s, -21 * L.s, 9.4 * L.s, 4.2 * L.s);
  ctx.fillRect(1.6 * L.s, -19 * L.s, 5.4 * L.s, 2.2 * L.s);
  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(1.6 * L.s, -16.4 * L.s, 0.7 * L.s, 0, TAU);
  ctx.fill();

  if (p.hammer > 0) {
    ham = (HAMMER_T - p.hammer);
    swing = Math.sin(ham * 14) * 0.9 - 0.2;
    ctx.save();
    ctx.translate(5 * L.s, -12 * L.s);
    ctx.rotate(swing);
    ctx.fillStyle = '#6a3a12';
    ctx.fillRect(0, -1.2 * L.s, 13 * L.s, 2.4 * L.s);
    ctx.fillStyle = '#ffe36b';
    ctx.fillRect(11 * L.s, -5 * L.s, 7 * L.s, 10 * L.s);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,227,107,0.35)';
    ctx.lineWidth = 3 * L.s;
    ctx.beginPath();
    ctx.arc(0, -10 * L.s, 16 * L.s, 0, TAU);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#ff6a28';
    ctx.fillRect(4 * L.s, -13 * L.s, 3 * L.s, 7 * L.s);
    ctx.fillRect(-7 * L.s, -13 * L.s, 3 * L.s, 7 * L.s);
  }

  ctx.restore();
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
    ctx.fillStyle = o.t > 0.15 ? '#c45a18' : 'rgba(196,90,24,0.4)';
    ctx.fillRect(-o.w * 0.5 * L.s, -1.2 * L.s, o.w * L.s, 2.4 * L.s);
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

function drawGoalGlow() {
  var x = sx((GOAL.x0 + GOAL.x1) * 0.5);
  var y = sy(floorY(3, 82) - 8);
  var g = ctx.createRadialGradient(x, y, 4, x, y, 28 * L.s);
  g.addColorStop(0, 'rgba(255,61,184,0.22)');
  g.addColorStop(1, 'rgba(255,61,184,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, 28 * L.s, 0, TAU);
  ctx.fill();
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
  drawGoalGlow();
  drawLadders();
  for (i = 0; i < FLOORS.length; i++) drawGirder(i);
  drawOil();
  drawHammers();
  drawKong();
  drawPauline();
  for (i = 0; i < G.barrels.length; i++) drawBarrel(G.barrels[i]);
  drawPlayer();
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
bindPad(btnJump, function (v) {
  keys.u = v;
  if (v) G.jumpBuf = BUFFER;
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
  } else if (k === 'Space') {
    if (down) G.jumpBuf = BUFFER;
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
      startRun('classic');
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      startRun('rain');
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
      startRun('rain');
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
btnClassic.addEventListener('click', function () {
  audio.ensure();
  startRun('classic');
});
btnRain.addEventListener('click', function () {
  audio.ensure();
  startRun('rain');
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

bestEl.textContent = String(G.bestC);
renderPips();
showTitle();
resize();
hudPlay();
modeLabel.textContent = '经典';
requestAnimationFrame(frame);

}
