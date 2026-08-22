'use strict';

/* 虹岛 — Rainbow Islands-lite. No CDN. */

var WORLD_W = 360;
var VIEW_H = 500;
var LIVES = 3;
var STAGES = 3;
var PW = 12;
var PH = 20;
var WALK = 112;
var AIR = 120;
var JUMP_V = 272;
var GRAV = 840;
var MAX_FALL = 430;
var FAST_FALL = 260;
var COYOTE = 0.09;
var BUFFER = 0.12;
var RB_W = 100;
var RB_H = 44;
var RB_GROW = 0.2;
var RB_LIFE = 5.05;
var RB_MAX = 2;
var RB_CD = 0.26;
var FALL_G = 760;
var INVULN = 1.02;
var DIE_T = 0.68;
var COMBO_WIN = 1.38;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var BEST_KEY = 'playbox-rain-isle-best';
var MUTE_KEY = 'playbox-rain-isle-mute';

var RB_COLS = [
  [255, 72, 96],
  [255, 140, 52],
  [255, 220, 72],
  [70, 255, 140],
  [40, 210, 255],
  [90, 120, 255],
  [210, 96, 255]
];

var FRUIT = [
  { name: '樱桃', pts: 200, rgb: [255, 80, 110] },
  { name: '柠檬', pts: 300, rgb: [255, 227, 107] },
  { name: '葡萄', pts: 400, rgb: [186, 92, 255] },
  { name: '西瓜', pts: 500, rgb: [80, 255, 140] },
  { name: '星果', pts: 800, rgb: [0, 240, 255] }
];

var ISLE = [
  { name: '虫岛', sub: 'BUG', hint: '彩虹当台阶，踩上去再跳会砸怪' },
  { name: '鸟岛', sub: 'BIRD', hint: '飞鸟横掠，虹桥接着往上爬' },
  { name: '魔岛', sub: 'KING', hint: '岛主在顶上，砸虹收工' }
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
function jumpHeight() {
  return (JUMP_V * JUMP_V) / (2 * GRAV);
}
function waterRate(tide) {
  return tide ? 34 : 18.5;
}
function waterDelay(tide) {
  return tide ? 3.05 : 6.4;
}
function makeRng(seed) {
  var a = seed | 0;
  return function () {
    a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rbT(rb, x) {
  return (x - rb.x0) * rb.face / rb.w;
}
function rbYFromT(rb, t) {
  t = clamp(t, 0, 1);
  return rb.y0 + 4 * rb.h * t * (1 - t);
}
function rainbowYAt(rb, x) {
  if (!rb || rb.dead) return null;
  var t = rbT(rb, x);
  if (t < -0.04 || t > rb.grow + 0.04) return null;
  if (rb.grow < 0.22) return null;
  return rbYFromT(rb, t);
}
function rainbowSpan(rb) {
  var x1 = rb.x0 + rb.face * rb.w * rb.grow;
  return {
    x0: Math.min(rb.x0, x1),
    x1: Math.max(rb.x0, x1)
  };
}
function rainbowPeak(rb) {
  return { x: rb.x0 + rb.face * rb.w * 0.5, y: rb.y0 + rb.h };
}
function underRainbow(rb, x, y, h) {
  if (!rb || rb.dead || rb.grow < 0.42) return false;
  var sp = rainbowSpan(rb);
  if (x < sp.x0 - 6 || x > sp.x1 + 6) return false;
  var top = rbYFromT(rb, clamp(rbT(rb, x), 0, 1));
  var bot = Math.min(rb.y0, top) - 18;
  return y <= top + 10 && y - (h || 12) >= bot - 8;
}
function canStandOn(surfaceY, py, prevY, grounded) {
  if (surfaceY == null) return false;
  if (prevY >= surfaceY - 3 && py <= surfaceY + 10) return true;
  if (grounded && surfaceY >= py - 2 && surfaceY <= py + 14) return true;
  return false;
}

function makeRainbow(x0, y0, face) {
  return {
    x0: x0,
    y0: y0,
    face: face < 0 ? -1 : 1,
    w: RB_W,
    h: RB_H,
    grow: 0,
    age: 0,
    life: RB_LIFE,
    falling: false,
    vy: 0,
    dead: false,
    just: false
  };
}

function makePlayer(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    vx: 0,
    vy: 0,
    face: 1,
    grounded: true,
    walk: 0,
    coyote: 0,
    squash: 1,
    inv: 0,
    deadT: 0,
    onRb: null,
    why: ''
  };
}

function makeEnemy(kind, x, y, plat) {
  var e = {
    kind: kind,
    x: x,
    y: y,
    face: Math.random() < 0.5 ? -1 : 1,
    plat: plat,
    dead: false,
    flash: 0,
    trapped: null,
    hurt: 0,
    hopT: rand(0.4, 1.4),
    bob: rand(0, TAU),
    hp: 1,
    maxHp: 1,
    w: 12,
    h: 12,
    spd: 30,
    vy: 0,
    grounded: true
  };
  if (kind === 'crawl') {
    e.spd = 26;
    e.h = 11;
  } else if (kind === 'hop') {
    e.spd = 18;
    e.h = 13;
    e.w = 13;
  } else if (kind === 'fly') {
    e.spd = 42;
    e.h = 10;
    e.w = 14;
    e.y = y + 26;
    e.home = y + 26;
    e.grounded = false;
  } else if (kind === 'boss') {
    e.w = 24;
    e.h = 30;
    e.spd = 22;
    e.hp = 5;
    e.maxHp = 5;
  }
  return e;
}

function makeFruit(x, y, kind, sit) {
  kind = clamp(kind | 0, 0, FRUIT.length - 1);
  return {
    x: x,
    y: y,
    vy: sit ? 0 : 80,
    kind: kind,
    pts: FRUIT[kind].pts,
    rgb: FRUIT[kind].rgb,
    name: FRUIT[kind].name,
    bob: rand(0, TAU),
    sit: !!sit,
    dead: false
  };
}

function pickKind(idx, rng) {
  var u = rng();
  if (idx === 0) return u < 0.72 ? 'crawl' : 'hop';
  if (idx === 1) {
    if (u < 0.38) return 'crawl';
    if (u < 0.72) return 'fly';
    return 'hop';
  }
  if (u < 0.28) return 'crawl';
  if (u < 0.62) return 'fly';
  return 'hop';
}

function buildIsland(idx, tide) {
  var meta = ISLE[idx] || ISLE[0];
  var rng = makeRng(1960 + idx * 131 + (tide ? 17 : 0));
  var plats = [{ x: 8, y: 34, w: 344 }];
  var enemies = [];
  var fruits = [];
  var y = 34;
  var rows = 11 + idx;
  var r, n, x, w, plat, i, kind, fx;
  for (r = 1; r <= rows; r++) {
    y += 70 + (r % 4) * 6;
    if (r === rows) {
      plats.push({ x: 32, y: y, w: 296 });
    } else if (r % 3 === 0) {
      w = 128 + rng() * 70;
      x = 18 + rng() * (WORLD_W - 36 - w);
      plats.push({ x: x, y: y, w: w });
    } else {
      w = 68 + rng() * 48;
      x = 14 + rng() * 48;
      plats.push({ x: x, y: y, w: w });
      w = 72 + rng() * 52;
      x = WORLD_W - 16 - w - rng() * 40;
      if (x < 150) x = 158;
      plats.push({ x: x, y: y + (rng() < 0.45 ? 8 : 0), w: w });
    }
  }
  for (i = 1; i < plats.length - 1; i++) {
    plat = plats[i];
    if (plat.w < 54) continue;
    if (rng() > (tide ? 0.2 : 0.36)) {
      kind = pickKind(idx, rng);
      enemies.push(makeEnemy(kind, plat.x + plat.w * (0.28 + rng() * 0.44), plat.y, plat));
      if (tide && rng() > 0.62 && kind !== 'fly') {
        enemies.push(makeEnemy(pickKind(idx, rng), plat.x + plat.w * 0.7, plat.y, plat));
      }
    }
    if (rng() > 0.5) {
      fx = (rng() * 4) | 0;
      fruits.push(makeFruit(plat.x + 16 + rng() * Math.max(20, plat.w - 32), plat.y, fx, true));
    }
  }
  plat = plats[plats.length - 1];
  var boss = makeEnemy('boss', plat.x + plat.w * 0.55, plat.y, plat);
  boss.hp = 4 + idx * 2;
  boss.maxHp = boss.hp;
  boss.spd = 20 + idx * 4;
  enemies.push(boss);
  return {
    name: meta.name,
    sub: meta.sub,
    hint: meta.hint,
    plats: plats,
    enemies: enemies,
    fruits: fruits,
    boss: boss,
    spawn: { x: 76, y: 34 },
    top: y + 140
  };
}

function liveRainbows(list) {
  var n = 0, i;
  for (i = 0; i < list.length; i++) if (!list[i].dead) n++;
  return n;
}

function selfCheck() {
  var h, rb, isle, tideIsle, peak, e;

  if (LIVES !== 3) throw new Error('3 lives');
  if (STAGES !== 3) throw new Error('3 stages');
  if (RB_MAX !== 2) throw new Error('2 rainbows');
  if (ISLE.length !== 3) throw new Error('3 islands');

  h = jumpHeight();
  if (h < 36 || h > 56) throw new Error('jump height window');
  if (h + 6 >= 70) throw new Error('need rainbow to climb a row');
  if (RB_H + h < 76) throw new Error('rainbow plus jump must reach a row');

  if (waterRate(true) <= waterRate(false)) throw new Error('tide faster water');
  if (waterDelay(true) >= waterDelay(false)) throw new Error('tide shorter delay');

  rb = makeRainbow(100, 40, 1);
  rb.grow = 1;
  if (Math.abs(rainbowYAt(rb, 100) - 40) > 1.2) throw new Error('rainbow start');
  if (Math.abs(rainbowYAt(rb, 100 + RB_W) - 40) > 1.2) throw new Error('rainbow end');
  peak = rainbowPeak(rb);
  if (Math.abs(rainbowYAt(rb, peak.x) - (40 + RB_H)) > 0.6) throw new Error('rainbow peak');
  if (rainbowYAt(rb, peak.x) <= rainbowYAt(rb, 110)) throw new Error('arc up');
  rb.grow = 0.2;
  if (rainbowYAt(rb, 100 + RB_W * 0.9) != null) throw new Error('ungrown end solid');

  rb = makeRainbow(100, 40, 1);
  rb.grow = 1;
  e = { x: peak.x, y: 40 + RB_H * 0.45, h: 12, w: 12 };
  if (!underRainbow(rb, e.x, e.y, e.h)) throw new Error('crush under');
  if (underRainbow(rb, 20, 40, 12)) throw new Error('crush miss side');

  isle = buildIsland(0, false);
  if (isle.plats.length < 10) throw new Error('plats');
  if (isle.plats[0].y !== 34) throw new Error('ground');
  if (!isle.boss || isle.boss.kind !== 'boss') throw new Error('boss');
  if (isle.top < 700) throw new Error('island height');
  if (isle.spawn.y !== 34) throw new Error('spawn ground');
  if (isle.name !== '虫岛') throw new Error('isle1 name');

  tideIsle = buildIsland(0, true);
  if (tideIsle.enemies.length <= isle.enemies.length) throw new Error('tide more enemies');

  isle = buildIsland(2, false);
  if (isle.name !== '魔岛') throw new Error('isle3 name');
  if (isle.boss.hp <= 5) throw new Error('final boss hp');

  if (FRUIT[0].pts >= FRUIT[4].pts) throw new Error('fruit ladder');
  if (typeof BEST_KEY !== 'string' || BEST_KEY.indexOf('rain-isle') < 0) throw new Error('best key');
  if (!canStandOn(40, 34, 34, true)) throw new Error('step onto rainbow');
  if (canStandOn(80, 34, 34, true)) throw new Error('no step 46px');
  if (!canStandOn(40, 42, 50, false)) throw new Error('land from above');
  if (canStandOn(40, 20, 18, false)) throw new Error('no land from below');
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
var btnIsle = document.getElementById('btn-isle');
var btnTide = document.getElementById('btn-tide');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnLeft = document.getElementById('btn-left');
var btnRight = document.getElementById('btn-right');
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
var isleLabel = document.getElementById('isle-label');
var tideBar = document.getElementById('tide-bar');
var pipsEl = document.getElementById('pips');
var toastEl = document.getElementById('toast');
var hintEl = document.getElementById('hint');
var chainPop = document.getElementById('chain-pop');
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
var chainTok = 0;

var particles = [];
var sparks = [];
var floats = [];
var rings = [];
var shards = [];
var motes = [];

var keys = { l: false, r: false, u: false, d: false };
var G = {
  mode: 'title',
  kind: 'isle',
  tide: false,
  clock: 0,
  round: 1,
  lives: LIVES,
  score: 0,
  bestI: 0,
  bestT: 0,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  player: makePlayer({ x: 76, y: 34 }),
  plats: [],
  enemies: [],
  fruits: [],
  rainbows: [],
  boss: null,
  spawn: { x: 76, y: 34 },
  top: 900,
  name: '虫岛',
  sub: 'BUG',
  hint: '',
  water: 0,
  waterWait: 6.4,
  camY: 0,
  fireCd: 0,
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flash: 0,
  flashRgb: [0, 240, 255],
  clearT: 0,
  lock: 0,
  jumpBuf: 0,
  why: '',
  warned: false,
  lastSafe: { x: 76, y: 34 },
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
  rainbow: function () {
    this.ensure();
    this.beep(392, 0.05, 'square', 0.045, 523);
    this.beep(523, 0.07, 'triangle', 0.04, 659);
    this.beep(784, 0.1, 'sine', 0.03, 1046);
    this.noise(0.05, 0.03, 2400, 'highpass');
  },
  harden: function () {
    this.ensure();
    this.beep(660, 0.06, 'triangle', 0.04, 880);
    this.beep(990, 0.08, 'sine', 0.03, 1320);
  },
  drop: function () {
    this.ensure();
    this.beep(420, 0.09, 'sawtooth', 0.05, 140);
    this.noise(0.08, 0.06, 500, 'lowpass');
  },
  crush: function (combo) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.07;
    this.noise(0.12, 0.13, 220, 'lowpass');
    this.beep(180 * p, 0.1, 'square', 0.07, 70);
    this.beep(540 * p, 0.09, 'triangle', 0.04, 220);
  },
  fruit: function (combo) {
    this.ensure();
    var p = 1 + Math.min(6, combo) * 0.06;
    this.beep(520 * p, 0.07, 'triangle', 0.06, 780 * p);
    this.beep(780 * p, 0.1, 'square', 0.035, 1180 * p);
  },
  die: function () {
    this.ensure();
    this.noise(0.16, 0.11, 280, 'lowpass');
    this.beep(320, 0.22, 'sawtooth', 0.06, 70);
    this.beep(180, 0.18, 'square', 0.04, 50);
  },
  warn: function () {
    this.ensure();
    this.beep(220, 0.12, 'square', 0.05, 140);
    this.noise(0.1, 0.05, 180, 'lowpass');
  },
  bossHit: function (combo) {
    this.ensure();
    var p = 1 + Math.min(6, combo) * 0.05;
    this.noise(0.14, 0.12, 180, 'lowpass');
    this.beep(140 * p, 0.12, 'sawtooth', 0.07, 60);
    this.beep(420 * p, 0.1, 'square', 0.04, 180);
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
    this.beep(660, 0.12, 'sine', 0.03, 880);
  },
  dud: function () {
    this.ensure();
    this.beep(180, 0.05, 'square', 0.03, 120);
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
      G.bestI = o.i | 0;
      G.bestT = o.t | 0;
      return;
    }
    if (typeof o === 'number') {
      G.bestI = o | 0;
      G.bestT = o | 0;
    }
  } catch (err) { /* ignore */ }
}

function persistBest() {
  var cur = G.tide ? G.bestT : G.bestI;
  if (G.score > cur) {
    if (G.tide) G.bestT = G.score;
    else G.bestI = G.score;
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ i: G.bestI, t: G.bestT }));
  } catch (err) { /* ignore */ }
}

function currentBest() {
  return G.tide ? G.bestT : G.bestI;
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
      vy: rand(-1.1, 0.35) * spd,
      t: life * rand(0.6, 1.2),
      max: life,
      r: rand(1.1, 2.6),
      rgb: rgb,
      g: grav || 18
    });
  }
}

function sparkAt(x, y, rgb) {
  sparks.push({
    x: x, y: y,
    vx: rand(-80, 80),
    vy: rand(40, 160),
    t: 0.18,
    rgb: rgb
  });
}

function ringAt(x, y, rgb) {
  rings.push({ x: x, y: y, r: 6, t: 0, rgb: rgb });
}

function floatText(x, y, text, rgb) {
  floats.push({ x: x, y: y + 18, text: text, t: 0, rgb: rgb || [255, 227, 107] });
}

function shardBurst(x, y) {
  var i, c;
  for (i = 0; i < 10; i++) {
    c = RB_COLS[i % RB_COLS.length];
    shards.push({
      x: x, y: y,
      vx: rand(-90, 90),
      vy: rand(30, 140),
      rot: rand(0, TAU),
      spin: rand(-8, 8),
      t: 0.42,
      w: rand(4, 9),
      rgb: c
    });
  }
}

function toast(msg, warn, gold) {
  toastEl.textContent = msg;
  toastEl.classList.toggle('warn', !!warn);
  toastEl.classList.toggle('gold', !!gold && !warn);
  toastEl.classList.remove('hidden');
  clearTimeout(toastTok);
  toastTok = setTimeout(function () { toastEl.classList.add('hidden'); }, 1400);
}

function showChain(n) {
  if (n < 2) return;
  chainPop.textContent = '×' + n;
  chainPop.classList.remove('hidden');
  clearTimeout(chainTok);
  chainTok = setTimeout(function () { chainPop.classList.add('hidden'); }, 460);
}

function bumpCombo() {
  G.combo += 1;
  if (G.combo > G.maxCombo) G.maxCombo = G.combo;
  G.comboAge = COMBO_WIN;
  comboEl.textContent = '×' + G.combo;
  comboBox.classList.remove('hot');
  void comboBox.offsetWidth;
  if (G.combo > 1) comboBox.classList.add('hot');
  if (G.combo >= 2) {
    showChain(G.combo);
    audio.combo(G.combo);
  }
  return G.combo;
}

function addScore(n, x, y, rgb) {
  var mul = Math.max(1, G.combo);
  var got = Math.round(n * (mul > 1 ? (0.7 + mul * 0.3) : 1));
  G.score += got;
  scoreEl.textContent = String(G.score);
  scoreBox.classList.remove('flash');
  void scoreBox.offsetWidth;
  scoreBox.classList.add('flash');
  scoreAdd.hidden = false;
  scoreAdd.textContent = '+' + got;
  clearTimeout(addTok);
  addTok = setTimeout(function () { scoreAdd.hidden = true; }, 700);
  if (x != null) floatText(x, y, '+' + got, rgb || [255, 227, 107]);
  persistBest();
  bestEl.textContent = String(currentBest());
  return got;
}

function seedMotes() {
  var i;
  motes.length = 0;
  for (i = 0; i < 42; i++) {
    motes.push({
      x: rand(0, WORLD_W),
      y: rand(0, VIEW_H),
      s: rand(0.6, 1.8),
      v: rand(8, 22),
      p: rand(0, TAU),
      rgb: RB_COLS[i % RB_COLS.length]
    });
  }
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

function renderPips() {
  var html = '';
  var i;
  for (i = 0; i < LIVES; i++) {
    html += '<i class="pip' + (i < G.lives ? ' on' : ' gone') + '"></i>';
  }
  pipsEl.innerHTML = html;
}

function hudPlay() {
  scoreEl.textContent = String(G.score);
  roundEl.textContent = String(G.round);
  bestEl.textContent = String(currentBest());
  comboEl.textContent = '×' + Math.max(1, G.combo);
  modeLabel.textContent = G.tide ? '涨潮' : '岛升';
  modeLabel.classList.toggle('tide', G.tide);
  isleLabel.textContent = G.name;
  renderPips();
  syncTide();
}

function syncTide() {
  var p = G.player;
  var span = Math.max(80, (p ? p.y : 80) - 8);
  var t = clamp(G.water / span, 0, 1);
  tideBar.style.transform = 'scaleX(' + t + ')';
  tideBar.classList.toggle('warn', t > 0.72 || (p && p.y - G.water < 90));
}

function resetWorld(round, kind, attract) {
  var isle = buildIsland(round - 1, kind === 'tide');
  G.round = round;
  G.kind = kind;
  G.tide = kind === 'tide';
  G.plats = isle.plats;
  G.enemies = isle.enemies;
  G.fruits = isle.fruits;
  G.boss = isle.boss;
  G.spawn = isle.spawn;
  G.top = isle.top;
  G.name = isle.name;
  G.sub = isle.sub;
  G.hint = isle.hint;
  G.rainbows = [];
  G.player = makePlayer(isle.spawn);
  G.water = -6;
  G.waterWait = waterDelay(G.tide);
  G.camY = 0;
  G.fireCd = 0;
  G.clearT = 0;
  G.lock = 0;
  G.jumpBuf = 0;
  G.warned = false;
  G.lastSafe = { x: isle.spawn.x, y: isle.spawn.y };
  G.comboAge = G.combo ? G.comboAge : 0;
  seedMotes();
  if (!attract) resetFx();
}

function showTitle() {
  G.mode = 'title';
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel';
  ovTitle.textContent = '虹岛';
  ovLead.textContent = '射出彩虹当台阶，踩上去再跳，虹会砸下去压怪。摘果子，潮水从底下涨，顶上有岛主。';
  ovOps.textContent = '方向键或 WASD 走跳 · 空格射虹 · 触屏左 跳 虹 右 · R 重开 · M 静音';
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
  hintEl.textContent = '空格射虹当台阶 · 踩虹再跳会砸下去 · 潮水会追';
  resetWorld(1, 'isle', true);
  G.kind = 'isle';
  G.tide = false;
  var rb = makeRainbow(88, 34, 1);
  rb.grow = 1;
  G.rainbows.push(rb);
  hudPlay();
}

function whyText(w) {
  if (w === 'hit') return '撞怪了';
  if (w === 'water') return '被潮水追上了';
  if (w === 'fall') return '掉下去了';
  return '';
}

function showOver(win) {
  G.mode = 'over';
  persistBest();
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel ' + (win ? 'win' : 'lose');
  ovTitle.textContent = win ? '登顶' : '命尽';
  ovLead.textContent = (G.tide ? '涨潮 ' : '岛升 ') +
    G.score + ' 分 · 第 ' + G.round + ' 关 · 连击最高 ×' + G.maxCombo +
    (G.why ? ' · ' + whyText(G.why) : '');
  ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
  if (win) audio.clear();
  else audio.over();
  ovRetry.focus();
}

function startRun(kind) {
  G.kind = kind;
  G.tide = kind === 'tide';
  G.mode = 'play';
  G.clock = 0;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  G.maxCombo = 0;
  G.comboAge = 0;
  G.why = '';
  G.lock = 0;
  resetWorld(1, kind, false);
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  panelEl.className = 'panel';
  audio.start();
  hudPlay();
  toast(G.tide ? '涨潮 · 水更快' : '岛升 · ' + G.name, G.tide, !G.tide);
  hintEl.textContent = G.hint;
  canvas.focus({ preventScroll: true });
}

function retry() {
  audio.ui();
  if (G.mode === 'title') startRun('isle');
  else startRun(G.kind);
}

function nextStage() {
  persistBest();
  if (G.round >= STAGES) {
    addScore(2000 + G.lives * 300, G.player.x, G.player.y, [255, 227, 107]);
    showOver(true);
    return;
  }
  G.round += 1;
  resetWorld(G.round, G.kind, false);
  G.player.inv = 0.4;
  hudPlay();
  toast(G.name, false, true);
  hintEl.textContent = G.hint;
  audio.start();
}

/* ---- sim ---- */
function findStand(px, py, prevY, grounded) {
  var best = null;
  var bestRb = null;
  var i, plat, y, rb;
  if (grounded == null) grounded = !!(G.player && G.player.grounded);
  for (i = 0; i < G.plats.length; i++) {
    plat = G.plats[i];
    if (px < plat.x - 2 || px > plat.x + plat.w + 2) continue;
    if (canStandOn(plat.y, py, prevY, grounded)) {
      if (best == null || plat.y > best) {
        best = plat.y;
        bestRb = null;
      }
    }
  }
  for (i = 0; i < G.rainbows.length; i++) {
    rb = G.rainbows[i];
    if (rb.dead || rb.falling) continue;
    y = rainbowYAt(rb, px);
    if (!canStandOn(y, py, prevY, grounded)) continue;
    if (best == null || y >= best - 0.2) {
      best = y;
      bestRb = rb;
    }
  }
  if (best == null) return null;
  return { y: best, rb: bestRb };
}

function fireRainbow() {
  var p, rb, n, i;
  if (G.mode !== 'play' || G.clearT > 0) return;
  p = G.player;
  if (p.deadT > 0) return;
  if (G.fireCd > 0) {
    audio.dud();
    return;
  }
  n = liveRainbows(G.rainbows);
  if (n >= RB_MAX) {
    audio.dud();
    return;
  }
  rb = makeRainbow(p.x + p.face * 6, p.y, p.face);
  rb.just = true;
  G.rainbows.push(rb);
  G.fireCd = RB_CD;
  audio.rainbow();
  hitStop(0.032);
  kick(1.1);
  for (i = 0; i < 8; i++) {
    sparkAt(rb.x0 + rb.face * (6 + i * 4), rb.y0 + 4 + i * 2, RB_COLS[i % RB_COLS.length]);
  }
  burst(rb.x0, rb.y0 + 8, 6, [0, 240, 255], 46, 0.28, 8);
}

function dropRainbow(rb) {
  if (!rb || rb.falling || rb.dead) return;
  rb.falling = true;
  rb.vy = 30;
  audio.drop();
  kick(1.6);
}

function shatterRainbow(rb, crush) {
  var i, t, x, y, c;
  if (rb.dead) return;
  rb.dead = true;
  for (i = 0; i < 9; i++) {
    t = i / 8;
    x = rb.x0 + rb.face * rb.w * t * rb.grow;
    y = rbYFromT(rb, t);
    c = RB_COLS[i % RB_COLS.length];
    burst(x, y, 3, c, 52, 0.34, 22);
  }
  shardBurst(rb.x0 + rb.face * rb.w * 0.5 * rb.grow, rb.y0 + rb.h * 0.7);
  if (crush) crushPass(rb, true);
}

function crushPass(rb, force) {
  var i, e;
  if (!force && !rb.falling) return;
  for (i = 0; i < G.enemies.length; i++) {
    e = G.enemies[i];
    if (e.dead || e.hurt > 0) continue;
    if (!underRainbow(rb, e.x, e.y, e.h) && e.trapped !== rb) continue;
    hitEnemy(e, rb);
  }
}

function trapPass(rb) {
  var i, e;
  if (rb.dead || rb.falling || rb.grow < 0.45) return;
  for (i = 0; i < G.enemies.length; i++) {
    e = G.enemies[i];
    if (e.dead) continue;
    if (underRainbow(rb, e.x, e.y, e.h)) {
      e.trapped = rb;
    } else if (e.trapped === rb) {
      e.trapped = null;
    }
  }
}

function hitEnemy(e, rb) {
  var pts;
  e.hurt = 0.18;
  e.flash = 0.18;
  if (e.kind === 'boss') {
    e.hp -= 1;
    bumpCombo();
    pts = addScore(300, e.x, e.y, [255, 80, 160]);
    audio.bossHit(G.combo);
    hitStop(0.08);
    shake(7);
    kick(2.4);
    flash([255, 61, 184], 0.12);
    burst(e.x, e.y + 10, 16, [255, 80, 160], 70, 0.4, 16);
    ringAt(e.x, e.y + 8, [255, 61, 184]);
    stageEl.classList.remove('smash');
    void stageEl.offsetWidth;
    stageEl.classList.add('smash');
    if (e.hp <= 0) killEnemy(e, true);
    return pts;
  }
  return killEnemy(e, false);
}

function killEnemy(e, isBoss) {
  var k, f, i, c;
  e.dead = true;
  e.trapped = null;
  bumpCombo();
  c = isBoss ? [255, 227, 107] : RB_COLS[(G.combo + 2) % RB_COLS.length];
  addScore(isBoss ? 1500 : 200, e.x, e.y + 8, c);
  audio.crush(G.combo);
  hitStop(isBoss ? 0.08 : 0.07);
  shake(isBoss ? 9 : 5);
  kick(isBoss ? 3 : 2);
  flash(c, 0.1);
  burst(e.x, e.y + 6, isBoss ? 22 : 14, c, 80, 0.42, 20);
  ringAt(e.x, e.y + 6, c);
  shardBurst(e.x, e.y + 8);
  k = clamp((G.combo - 1) % FRUIT.length, 0, FRUIT.length - 1);
  if (G.combo >= 3) k = 4;
  f = makeFruit(e.x, e.y + 4, k, false);
  G.fruits.push(f);
  if (isBoss) {
    for (i = 0; i < 3; i++) {
      G.fruits.push(makeFruit(e.x + rand(-18, 18), e.y + 10, 4, false));
    }
    G.clearT = 1.45;
    audio.clear();
    toast(G.round >= STAGES ? '岛主倒下' : G.name + ' 过关', false, true);
    stageEl.classList.remove('clear');
    void stageEl.offsetWidth;
    stageEl.classList.add('clear');
  }
}

function platAt(x, y) {
  var i, p;
  for (i = 0; i < G.plats.length; i++) {
    p = G.plats[i];
    if (x >= p.x - 2 && x <= p.x + p.w + 2 && Math.abs(y - p.y) < 8) return p;
  }
  return null;
}

function tickRainbows(dt) {
  var i, rb, plat, sp, mid;
  for (i = G.rainbows.length - 1; i >= 0; i--) {
    rb = G.rainbows[i];
    if (rb.dead) {
      G.rainbows.splice(i, 1);
      continue;
    }
    if (rb.grow < 1) {
      rb.grow = Math.min(1, rb.grow + dt / RB_GROW);
      if (rb.grow >= 1) {
        audio.harden();
        mid = rainbowPeak(rb);
        burst(mid.x, mid.y, 8, [255, 227, 107], 40, 0.28, 6);
        ringAt(mid.x, mid.y, [0, 240, 255]);
      }
    } else if (!rb.falling) {
      rb.age += dt;
      if (rb.age >= rb.life) shatterRainbow(rb, true);
    }
    if (rb.falling && !rb.dead) {
      rb.vy += FALL_G * dt;
      rb.y0 -= rb.vy * dt;
      crushPass(rb, false);
      sp = rainbowSpan(rb);
      plat = platAt((sp.x0 + sp.x1) * 0.5, rb.y0);
      if (plat && rb.vy > 90 && rb.y0 <= plat.y + 3) shatterRainbow(rb, true);
      else if (rb.y0 + rb.h < G.camY - 36 || rb.y0 < G.water - 12) shatterRainbow(rb, true);
    }
    if (!rb.dead) trapPass(rb);
  }
}

function tickEnemies(dt) {
  var i, e, plat, edge, hop;
  for (i = 0; i < G.enemies.length; i++) {
    e = G.enemies[i];
    if (e.dead) continue;
    e.flash = Math.max(0, e.flash - dt);
    e.hurt = Math.max(0, e.hurt - dt);
    e.bob += dt * (e.kind === 'fly' ? 3.2 : 2.2);
    if (e.trapped && (e.trapped.dead || !underRainbow(e.trapped, e.x, e.y, e.h))) {
      if (e.trapped.dead || e.trapped.falling) {
        /* shatter/crush handles it */
      }
      e.trapped = null;
    }
    if (e.trapped) {
      e.x += Math.sin(G.clock * 18) * 0.15;
      continue;
    }
    if (e.kind === 'fly') {
      e.x += e.face * e.spd * dt;
      e.y = e.home + Math.sin(e.bob) * 16;
      if (e.x < 18) { e.x = 18; e.face = 1; }
      if (e.x > WORLD_W - 18) { e.x = WORLD_W - 18; e.face = -1; }
      continue;
    }
    plat = e.plat;
    if (e.kind === 'hop' || e.kind === 'boss') {
      e.hopT -= dt;
      if (e.grounded && e.hopT <= 0) {
        e.vy = e.kind === 'boss' ? 210 : 168;
        e.grounded = false;
        e.hopT = e.kind === 'boss' ? rand(1.1, 1.8) : rand(0.9, 1.6);
      }
      if (!e.grounded) {
        e.vy -= GRAV * dt;
        e.y += e.vy * dt;
        if (plat && e.y <= plat.y && e.vy <= 0) {
          e.y = plat.y;
          e.vy = 0;
          e.grounded = true;
        }
      }
    }
    hop = e.kind === 'boss' && e.hp <= e.maxHp * 0.4 ? 1.35 : 1;
    e.x += e.face * e.spd * hop * dt;
    if (plat) {
      edge = 8;
      if (e.x < plat.x + edge) { e.x = plat.x + edge; e.face = 1; }
      if (e.x > plat.x + plat.w - edge) { e.x = plat.x + plat.w - edge; e.face = -1; }
      if (e.grounded) e.y = plat.y;
    } else {
      if (e.x < 16) e.face = 1;
      if (e.x > WORLD_W - 16) e.face = -1;
    }
    if (e.y < G.water - 4 && e.kind !== 'boss') {
      e.dead = true;
      burst(e.x, e.y, 6, [0, 240, 255], 30, 0.24, 10);
    }
  }
}

function tickFruits(dt) {
  var i, f, st;
  for (i = G.fruits.length - 1; i >= 0; i--) {
    f = G.fruits[i];
    if (f.dead) {
      G.fruits.splice(i, 1);
      continue;
    }
    f.bob += dt * 5;
    if (!f.sit) {
      f.vy -= GRAV * dt;
      if (f.vy < -240) f.vy = -240;
      f.y += f.vy * dt;
      st = findStand(f.x, f.y, f.y - f.vy * dt, false);
      if (st && f.vy <= 0) {
        f.y = st.y;
        f.vy = 0;
        f.sit = true;
      }
      if (f.y < G.water - 8) f.dead = true;
    }
  }
}

function collectFruit(f) {
  f.dead = true;
  bumpCombo();
  addScore(f.pts, f.x, f.y + 12, f.rgb);
  audio.fruit(G.combo);
  hitStop(0.04);
  kick(1.3);
  burst(f.x, f.y + 8, 12, f.rgb, 58, 0.36, 12);
  ringAt(f.x, f.y + 8, f.rgb);
  floatText(f.x, f.y + 16, f.name, f.rgb);
}

function aabbHit(ax, ay, aw, ah, bx, by, bw, bh) {
  return Math.abs(ax - bx) < (aw + bw) * 0.5 && ay < by + 4 && ay - ah < by && ay > by - bh - 2;
}

function kill(why) {
  var p = G.player;
  if (p.deadT > 0 || p.inv > 0 || G.clearT > 0) return;
  p.why = why;
  G.why = why;
  p.deadT = DIE_T;
  p.vy = 90;
  p.grounded = false;
  p.onRb = null;
  G.lives -= 1;
  renderPips();
  audio.die();
  hitStop(0.08);
  shake(8);
  flash([255, 61, 184], 0.16);
  burst(p.x, p.y + 10, 16, [255, 61, 184], 70, 0.4, 18);
  stageEl.classList.remove('die');
  void stageEl.offsetWidth;
  stageEl.classList.add('die');
}

function respawn() {
  var p = G.player;
  if (G.lives <= 0) {
    showOver(false);
    return;
  }
  p.x = G.lastSafe.x;
  p.y = Math.max(G.lastSafe.y, G.water + 28);
  if (p.y < G.water + 24) p.y = G.water + 40;
  var st = findStand(p.x, p.y + 8, p.y + 20);
  if (st) { p.x = clamp(p.x, 20, WORLD_W - 20); p.y = st.y; }
  p.vx = 0;
  p.vy = 0;
  p.deadT = 0;
  p.inv = INVULN;
  p.grounded = true;
  p.onRb = null;
  p.squash = 0.8;
  G.combo = 0;
  G.comboAge = 0;
  comboEl.textContent = '×1';
  toast('再上', true, false);
}

function tickPlayer(dt) {
  var p = G.player;
  var ax, prevY, st, i, e, f, drop;
  if (p.deadT > 0) {
    p.deadT -= dt;
    p.vy -= GRAV * dt;
    p.y += p.vy * dt;
    p.squash = 0.7;
    if (p.deadT <= 0) respawn();
    return;
  }
  if (G.clearT > 0) return;

  p.inv = Math.max(0, p.inv - dt);
  p.squash += (1 - p.squash) * Math.min(1, dt * 14);

  ax = 0;
  if (keys.l) ax -= 1;
  if (keys.r) ax += 1;
  if (ax) p.face = ax;
  p.vx = ax * (p.grounded ? WALK : AIR);
  p.x = clamp(p.x + p.vx * dt, 12, WORLD_W - 12);
  if (p.grounded && ax) p.walk += dt * 11;

  if (p.onRb && !p.onRb.dead && !p.onRb.falling) {
    var ry = rainbowYAt(p.onRb, p.x);
    if (ry != null) {
      p.y = ry;
      p.vy = 0;
      p.grounded = true;
      p.coyote = COYOTE;
    } else {
      p.onRb = null;
      p.grounded = false;
    }
  }

  prevY = p.y;
  if (!p.grounded) {
    p.vy -= GRAV * dt;
    if (keys.d) p.vy -= FAST_FALL * dt;
    if (p.vy < -MAX_FALL) p.vy = -MAX_FALL;
    p.y += p.vy * dt;
  }

  st = findStand(p.x, p.y, prevY, p.grounded || p.coyote > 0);
  if (st && p.vy <= 60) {
    if (!p.grounded && p.vy < -50) {
      audio.land();
      p.squash = 1.18;
      burst(p.x, p.y, 4, [180, 220, 255], 28, 0.18, 30);
    }
    p.y = st.y;
    p.vy = 0;
    p.grounded = true;
    p.coyote = COYOTE;
    p.onRb = st.rb;
    if (!st.rb && p.y > G.water + 18) G.lastSafe = { x: p.x, y: p.y };
  } else if (!(p.onRb && !p.onRb.dead && !p.onRb.falling && rainbowYAt(p.onRb, p.x) != null)) {
    p.grounded = false;
    p.onRb = null;
  }

  p.coyote = Math.max(0, p.coyote - dt);

  if (G.jumpBuf > 0 && (p.grounded || p.coyote > 0) && p.vy <= 40) {
    drop = p.onRb;
    p.vy = JUMP_V;
    p.grounded = false;
    p.coyote = 0;
    G.jumpBuf = 0;
    p.squash = 0.72;
    p.onRb = null;
    if (drop && !drop.falling && !drop.dead) dropRainbow(drop);
    audio.hop();
    hitStop(0.028);
    burst(p.x, prevY, 5, [0, 240, 255], 32, 0.2, 24);
  }

  if (p.y < G.water + 3) kill('water');
  if (p.y < G.camY - 28) kill('fall');

  for (i = 0; i < G.enemies.length; i++) {
    e = G.enemies[i];
    if (e.dead || e.flash > 0) continue;
    if (e.trapped) continue;
    if (aabbHit(p.x, p.y, PW * 0.78, PH - 2, e.x, e.y, e.w, e.h)) kill('hit');
  }
  for (i = 0; i < G.fruits.length; i++) {
    f = G.fruits[i];
    if (f.dead) continue;
    if (hypot(p.x - f.x, p.y - 8 - f.y) < 16) collectFruit(f);
  }
}

function tickCam(dt) {
  var p = G.player;
  var target = p.y - VIEW_H * 0.38;
  var maxCam = Math.max(0, G.top - VIEW_H * 0.62);
  if (target < 0) target = 0;
  if (target > maxCam) target = maxCam;
  if (target > G.camY) G.camY += (target - G.camY) * Math.min(1, 0.14 + dt * 2);
  else G.camY += (target - G.camY) * 0.05;
  if (G.camY < 0) G.camY = 0;
}

function tickWater(dt) {
  if (G.mode !== 'play' || G.clearT > 0) return;
  if (G.waterWait > 0) {
    G.waterWait -= dt;
    return;
  }
  G.water += waterRate(G.tide) * dt;
  if (!G.warned && G.player.y - G.water < 110) {
    G.warned = true;
    toast('潮水来了', true, false);
    audio.warn();
  }
  syncTide();
}

function tickFx(dt) {
  var i, o;
  G.kickX *= 0.82;
  G.kickY *= 0.82;
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
  if (G.flash > 0) G.flash = Math.max(0, G.flash - dt);
  for (i = particles.length - 1; i >= 0; i--) {
    o = particles[i];
    o.t -= dt;
    o.vy -= o.g * dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    if (o.t <= 0) particles.splice(i, 1);
  }
  for (i = sparks.length - 1; i >= 0; i--) {
    o = sparks[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.vy -= 80 * dt;
    if (o.t <= 0) sparks.splice(i, 1);
  }
  for (i = rings.length - 1; i >= 0; i--) {
    o = rings[i];
    o.t += dt;
    o.r += dt * 90;
    if (o.t > 0.35) rings.splice(i, 1);
  }
  for (i = shards.length - 1; i >= 0; i--) {
    o = shards[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.vy -= 220 * dt;
    o.rot += o.spin * dt;
    if (o.t <= 0) shards.splice(i, 1);
  }
  for (i = floats.length - 1; i >= 0; i--) {
    o = floats[i];
    o.t += dt;
    o.y += dt * 28;
    if (o.t > 0.7) floats.splice(i, 1);
  }
  for (i = 0; i < motes.length; i++) {
    o = motes[i];
    o.y += o.v * dt;
    o.x += Math.sin(G.clock * 0.6 + o.p) * 8 * dt;
    if (o.y < G.camY - 20) o.y = G.camY + VIEW_H + rand(0, 40);
    if (o.y > G.camY + VIEW_H + 40) o.y = G.camY - 10;
  }
}

function tick(dt) {
  G.clock += dt;
  G.jumpBuf = Math.max(0, G.jumpBuf - dt);
  G.fireCd = Math.max(0, G.fireCd - dt);
  if (G.comboAge > 0) {
    G.comboAge -= dt;
    if (G.comboAge <= 0) {
      G.combo = 0;
      comboEl.textContent = '×1';
      comboBox.classList.remove('hot');
    }
  }
  if (G.clearT > 0) {
    G.clearT -= dt;
    tickRainbows(dt);
    tickFruits(dt);
    tickCam(dt);
    tickFx(dt);
    if (G.clearT <= 0) nextStage();
    return;
  }
  tickWater(dt);
  tickRainbows(dt);
  if (G.mode === 'play') {
    tickPlayer(dt);
    tickEnemies(dt);
    tickFruits(dt);
  } else {
    tickEnemies(dt);
  }
  if (G.mode === 'play' || G.mode === 'over') tickCam(dt);
  else G.camY = (1 - Math.cos(G.clock * 0.22)) * 90;
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
  var s = Math.min(avW / WORLD_W, avH / VIEW_H);
  L.s = s;
  L.x = (avW - WORLD_W * s) / 2;
  L.y = Math.max(4, (avH - VIEW_H * s) / 2);
}

function sx(x) { return L.x + x * L.s; }
function sy(y) { return L.y + (VIEW_H - (y - G.camY)) * L.s; }

function drawBg() {
  var g, i, y, x;
  ctx.fillStyle = '#050814';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  g = ctx.createRadialGradient(sx(70), sy(G.camY + VIEW_H * 0.88), 8, sx(70), sy(G.camY + VIEW_H * 0.88), 240 * L.s);
  g.addColorStop(0, 'rgba(30, 200, 255, 0.16)');
  g.addColorStop(1, 'rgba(30, 200, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(sx(0), sy(G.camY + VIEW_H), WORLD_W * L.s, VIEW_H * L.s);

  g = ctx.createRadialGradient(sx(290), sy(G.camY + VIEW_H * 0.2), 6, sx(290), sy(G.camY + VIEW_H * 0.2), 180 * L.s);
  g.addColorStop(0, 'rgba(255, 61, 184, 0.1)');
  g.addColorStop(1, 'rgba(255, 61, 184, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(sx(0), sy(G.camY + VIEW_H), WORLD_W * L.s, VIEW_H * L.s);

  ctx.fillStyle = 'rgba(255, 227, 107, 0.85)';
  ctx.beginPath();
  ctx.arc(sx(292), sy(G.top - 20), 16 * L.s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 227, 107, 0.18)';
  ctx.beginPath();
  ctx.arc(sx(292), sy(G.top - 20), 28 * L.s, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
  ctx.lineWidth = 1;
  for (i = 0; i < 8; i++) {
    y = G.camY + i * 70 + ((G.clock * 8) % 70);
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(y));
    ctx.lineTo(sx(WORLD_W), sy(y));
    ctx.stroke();
  }

  for (i = 0; i < motes.length; i++) {
    x = motes[i];
    ctx.fillStyle = rgba(x.rgb, 0.35);
    ctx.beginPath();
    ctx.arc(sx(x.x), sy(x.y), x.s * L.s, 0, TAU);
    ctx.fill();
  }
}

function drawPalms() {
  var i, base, sway;
  for (i = 0; i < 6; i++) {
    base = 80 + i * 210;
    if (base < G.camY - 40 || base > G.camY + VIEW_H + 80) continue;
    sway = Math.sin(G.clock * 1.3 + i) * 6;
    ctx.strokeStyle = 'rgba(0, 180, 140, 0.55)';
    ctx.lineWidth = 3.2 * L.s;
    ctx.beginPath();
    ctx.moveTo(sx(i % 2 ? 18 : WORLD_W - 18), sy(base));
    ctx.quadraticCurveTo(sx(i % 2 ? 22 + sway : WORLD_W - 22 - sway), sy(base + 40), sx(i % 2 ? 16 : WORLD_W - 16), sy(base + 70));
    ctx.stroke();
    ctx.fillStyle = 'rgba(50, 220, 160, 0.35)';
    ctx.beginPath();
    ctx.ellipse(sx(i % 2 ? 22 + sway : WORLD_W - 22 - sway), sy(base + 74), 16 * L.s, 6 * L.s, sway * 0.04, 0, TAU);
    ctx.fill();
  }
}

function drawClouds() {
  var i, x, y, bob;
  ctx.fillStyle = 'rgba(180, 230, 255, 0.1)';
  for (i = 0; i < 7; i++) {
    bob = Math.sin(G.clock * 0.5 + i) * 6;
    x = (i * 73 + G.clock * 6) % (WORLD_W + 80) - 40;
    y = 120 + (i * 97) % 380 + bob;
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(G.camY * 0.3 + y), 22 * L.s, 8 * L.s, 0, 0, TAU);
    ctx.ellipse(sx(x + 16), sy(G.camY * 0.3 + y + 2), 16 * L.s, 7 * L.s, 0, 0, TAU);
    ctx.fill();
  }
}

function drawPlats() {
  var i, p, x, y, w, h, k;
  h = 9 * L.s;
  for (i = 0; i < G.plats.length; i++) {
    p = G.plats[i];
    if (p.y < G.camY - 20 || p.y > G.camY + VIEW_H + 24) continue;
    x = sx(p.x);
    y = sy(p.y);
    w = p.w * L.s;
    ctx.fillStyle = 'rgba(8, 40, 58, 0.9)';
    ctx.fillRect(x, y, w, h + 3 * L.s);
    ctx.fillStyle = i === 0 ? '#1ec8ff' : '#12b8c8';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(180, 255, 240, 0.7)';
    ctx.fillRect(x, y, w, 1.6 * L.s);
    ctx.fillStyle = 'rgba(255, 227, 107, 0.55)';
    for (k = 0; k < p.w; k += 14) {
      ctx.fillRect(x + k * L.s, y + 3.2 * L.s, 2.1 * L.s, 2.1 * L.s);
    }
  }
}

function drawRainbow(rb) {
  var i, t, n, x, y, c, a, fade, lw, g;
  if (rb.dead) return;
  fade = 1;
  if (!rb.falling && rb.grow >= 1) {
    g = rb.life - rb.age;
    if (g < 0.7) fade = clamp(g / 0.7, 0.15, 1);
  }
  n = 14;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (i = 0; i < RB_COLS.length; i++) {
    c = RB_COLS[i];
    a = fade * (rb.falling ? 0.75 : 0.95);
    lw = (5.2 - i * 0.42) * L.s;
    ctx.strokeStyle = rgba(c, a);
    ctx.lineWidth = lw;
    ctx.beginPath();
    for (t = 0; t <= n; t++) {
      g = (t / n) * rb.grow;
      x = sx(rb.x0 + rb.face * rb.w * g);
      y = sy(rbYFromT(rb, g) + i * 1.15);
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  if (rb.grow < 1) {
    t = rb.grow;
    x = rb.x0 + rb.face * rb.w * t;
    y = rbYFromT(rb, t);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), 3.2 * L.s, 0, TAU);
    ctx.fill();
  }
}

function drawFruit(f) {
  var x, y, bob, r;
  if (f.dead) return;
  if (f.y < G.camY - 16 || f.y > G.camY + VIEW_H + 16) return;
  bob = Math.sin(f.bob) * 2.2;
  x = sx(f.x);
  y = sy(f.y + 9 + bob);
  r = (5.2 + (f.kind === 4 ? 1.4 : 0)) * L.s;
  ctx.fillStyle = rgba(f.rgb, 0.28);
  ctx.beginPath();
  ctx.arc(x, y, r * 1.7, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(f.rgb, 1);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc(x - 1.4 * L.s, y - 1.6 * L.s, r * 0.32, 0, TAU);
  ctx.fill();
}

function drawEnemy(e) {
  var x, y, bob, blink, s, crown;
  if (e.dead) return;
  if (e.y < G.camY - 28 || e.y > G.camY + VIEW_H + 28) return;
  if (e.flash > 0 && ((G.clock * 22) | 0) % 2 === 0) return;
  bob = e.kind === 'fly' ? 0 : Math.sin(e.bob) * 1.2;
  x = sx(e.x);
  y = sy(e.y + bob);
  blink = e.trapped ? 0.7 : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(e.face, 1);
  ctx.globalAlpha = blink;

  if (e.kind === 'boss') {
    s = L.s;
    ctx.fillStyle = '#5a1a68';
    ctx.beginPath();
    ctx.ellipse(0, -14 * s, 16 * s, 14 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ff3db8';
    ctx.beginPath();
    ctx.ellipse(0, -12 * s, 11 * s, 10 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.arc(-4 * s, -16 * s, 2 * s, 0, TAU);
    ctx.arc(5 * s, -16 * s, 2 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#05030c';
    ctx.beginPath();
    ctx.arc(-4 * s, -16 * s, 0.8 * s, 0, TAU);
    ctx.arc(5 * s, -16 * s, 0.8 * s, 0, TAU);
    ctx.fill();
    crown = -26 * s;
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.moveTo(-8 * s, crown + 8 * s);
    ctx.lineTo(-5 * s, crown);
    ctx.lineTo(-2 * s, crown + 8 * s);
    ctx.lineTo(2 * s, crown);
    ctx.lineTo(5 * s, crown + 8 * s);
    ctx.lineTo(8 * s, crown);
    ctx.lineTo(8 * s, crown + 10 * s);
    ctx.lineTo(-8 * s, crown + 10 * s);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,61,184,0.35)';
    ctx.fillRect(-10 * s, 2 * s, 20 * s * (e.hp / e.maxHp), 3 * s);
    ctx.restore();
    return;
  }

  if (e.kind === 'fly') {
    ctx.fillStyle = '#7af6ff';
    ctx.beginPath();
    ctx.ellipse(0, -6 * L.s, 8 * L.s, 4.2 * L.s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,227,107,0.8)';
    ctx.beginPath();
    ctx.ellipse(-2 * L.s, -10 * L.s, 7 * L.s, 3 * L.s, -0.4 + Math.sin(e.bob * 8) * 0.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#05030c';
    ctx.beginPath();
    ctx.arc(3 * L.s, -7 * L.s, 0.8 * L.s, 0, TAU);
    ctx.fill();
  } else if (e.kind === 'hop') {
    ctx.fillStyle = '#3dff88';
    ctx.beginPath();
    ctx.ellipse(0, -7 * L.s, 7 * L.s, 7 * L.s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.arc(2.4 * L.s, -9 * L.s, 1.4 * L.s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#05030c';
    ctx.beginPath();
    ctx.arc(2.6 * L.s, -9 * L.s, 0.6 * L.s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2a8a4a';
    ctx.fillRect(-6 * L.s, -3 * L.s, 4 * L.s, 3.2 * L.s);
    ctx.fillRect(1 * L.s, -3 * L.s, 4 * L.s, 3.2 * L.s);
  } else {
    ctx.fillStyle = '#ff3db8';
    ctx.beginPath();
    ctx.ellipse(0, -6 * L.s, 8 * L.s, 5.5 * L.s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ff9ad4';
    ctx.beginPath();
    ctx.ellipse(2 * L.s, -7 * L.s, 4 * L.s, 3 * L.s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#ffe36b';
    ctx.lineWidth = 1.1 * L.s;
    ctx.beginPath();
    ctx.moveTo(-6 * L.s, -4 * L.s);
    ctx.lineTo(-10 * L.s, 0);
    ctx.moveTo(6 * L.s, -4 * L.s);
    ctx.lineTo(10 * L.s, 0);
    ctx.stroke();
    ctx.fillStyle = '#05030c';
    ctx.beginPath();
    ctx.arc(3 * L.s, -7.5 * L.s, 0.7 * L.s, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlayer() {
  var p = G.player;
  var x, y, stride, leg, cap;
  if (G.mode === 'title') return;
  if (p.inv > 0 && ((G.clock * 18) | 0) % 2 === 0) return;
  x = sx(p.x);
  y = sy(p.y);
  stride = Math.sin(p.walk);
  leg = p.grounded ? stride * 3.1 * L.s : 2.2 * L.s;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p.face, p.squash);
  if (p.deadT > 0) ctx.rotate(0.55);

  ctx.fillStyle = '#152028';
  ctx.fillRect(-3.4 * L.s, -4 * L.s, 2.4 * L.s, 4 * L.s + leg);
  ctx.fillRect(1 * L.s, -4 * L.s, 2.4 * L.s, 4 * L.s - leg);

  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(-5.1 * L.s, -14 * L.s, 10.2 * L.s, 11 * L.s);
  ctx.fillStyle = '#ffe36b';
  ctx.fillRect(-5.1 * L.s, -8.2 * L.s, 10.2 * L.s, 2.1 * L.s);

  ctx.fillStyle = '#ffd8c4';
  ctx.beginPath();
  ctx.arc(0.3 * L.s, -16.6 * L.s, 4.1 * L.s, 0, TAU);
  ctx.fill();
  cap = '#ff4d6d';
  ctx.fillStyle = cap;
  ctx.fillRect(-4.6 * L.s, -21.2 * L.s, 9.4 * L.s, 4.2 * L.s);
  ctx.fillRect(1.5 * L.s, -19.2 * L.s, 5.4 * L.s, 2.2 * L.s);
  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(1.6 * L.s, -16.4 * L.s, 0.7 * L.s, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#ff4d6d';
  ctx.fillRect(4 * L.s, -13 * L.s, 3 * L.s, 6.4 * L.s);
  ctx.fillRect(-7 * L.s, -13 * L.s, 3 * L.s, 6.4 * L.s);

  ctx.restore();
}

function drawWater() {
  var y, i, x, amp, surface, bot, g;
  surface = G.water;
  if (surface < G.camY - 8) return;
  y = sy(surface);
  bot = sy(Math.min(surface, G.camY) - 40) + VIEW_H * L.s + 40;
  g = ctx.createLinearGradient(0, y, 0, y + 160 * L.s);
  g.addColorStop(0, 'rgba(0, 220, 255, 0.42)');
  g.addColorStop(0.35, 'rgba(20, 80, 180, 0.55)');
  g.addColorStop(1, 'rgba(10, 16, 60, 0.72)');
  ctx.fillStyle = g;
  ctx.fillRect(sx(0), y, WORLD_W * L.s, canvas.height);
  ctx.beginPath();
  ctx.moveTo(sx(0), y);
  for (i = 0; i <= 18; i++) {
    x = (i / 18) * WORLD_W;
    amp = Math.sin(G.clock * 3.2 + i * 0.7) * 3.4 + Math.sin(G.clock * 5.1 + i) * 1.6;
    ctx.lineTo(sx(x), sy(surface + amp));
  }
  ctx.lineTo(sx(WORLD_W), y + 12 * L.s);
  ctx.lineTo(sx(0), y + 12 * L.s);
  ctx.closePath();
  ctx.fillStyle = 'rgba(122, 246, 255, 0.35)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1.4 * L.s;
  ctx.beginPath();
  for (i = 0; i <= 18; i++) {
    x = (i / 18) * WORLD_W;
    amp = Math.sin(G.clock * 3.2 + i * 0.7) * 3.4;
    if (i === 0) ctx.moveTo(sx(x), sy(surface + amp));
    else ctx.lineTo(sx(x), sy(surface + amp));
  }
  ctx.stroke();
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
    ctx.lineWidth = 1.3 * L.s;
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
    ctx.fillStyle = rgba(o.rgb, clamp(o.t / 0.42, 0, 1));
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

function drawFlash() {
  var a;
  if (G.flash <= 0) return;
  a = clamp(G.flash / 0.16, 0, 1) * 0.28;
  ctx.fillStyle = rgba(G.flashRgb, a);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBossGate() {
  var p, x, y, i;
  if (!G.boss || G.boss.dead) return;
  p = G.boss.plat;
  if (!p) return;
  if (p.y < G.camY - 10 || p.y > G.camY + VIEW_H + 40) return;
  x = sx(p.x + p.w * 0.5);
  y = sy(p.y + 48 + Math.sin(G.clock * 2.4) * 3);
  ctx.fillStyle = 'rgba(255, 227, 107, 0.9)';
  ctx.font = 'bold ' + (8 * L.s) + 'px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('岛主', x, y);
  ctx.strokeStyle = 'rgba(255, 227, 107, 0.35)';
  ctx.lineWidth = 1.2 * L.s;
  for (i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(x, sy(p.y + 20), (12 + i * 7 + Math.sin(G.clock * 3 + i) * 2) * L.s, 0, TAU);
    ctx.stroke();
  }
}

function draw() {
  var i, shx, shy;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  shx = G.kickX;
  shy = G.kickY;
  if (G.shake > 0 && !reduceMotion()) {
    shx += rand(-G.shake, G.shake);
    shy += rand(-G.shake, G.shake);
  }
  ctx.save();
  ctx.translate(shx * L.s, shy * L.s);
  drawBg();
  drawClouds();
  drawPalms();
  drawPlats();
  for (i = 0; i < G.rainbows.length; i++) drawRainbow(G.rainbows[i]);
  for (i = 0; i < G.fruits.length; i++) drawFruit(G.fruits[i]);
  drawBossGate();
  for (i = 0; i < G.enemies.length; i++) drawEnemy(G.enemies[i]);
  drawPlayer();
  drawWater();
  drawFx();
  ctx.restore();
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
bindPad(btnFire, function (v) {
  if (v) fireRainbow();
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
  }
}

window.addEventListener('keydown', function (e) {
  if (e.repeat) {
    keyOn(e, true);
    if (e.code === 'Space') e.preventDefault();
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
      startRun('isle');
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      startRun('tide');
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
      startRun('tide');
      e.preventDefault();
      return;
    }
  }
  if (e.code === 'Space') {
    fireRainbow();
    e.preventDefault();
    return;
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
btnIsle.addEventListener('click', function () {
  audio.ensure();
  startRun('isle');
});
btnTide.addEventListener('click', function () {
  audio.ensure();
  startRun('tide');
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

bestEl.textContent = String(G.bestI);
renderPips();
showTitle();
resize();
hudPlay();
modeLabel.textContent = '岛升';
requestAnimationFrame(frame);

}
