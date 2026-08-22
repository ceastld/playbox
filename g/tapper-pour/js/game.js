'use strict';

/* 酒保 — Tapper-lite. No CDN. */

var WORLD_W = 480;
var WORLD_H = 400;
var BARS = 4;
var BAR_Y = [68, 154, 240, 326];
var BAR_LEFT = 34;
var BAR_RIGHT = 452;
var TAP_ZONE = 400;
var TAP_MISS = 438;
var MUG_LEFT = 26;
var MUG_RIGHT = 450;
var LIVES = 3;
var WALK = 228;
var HOP_T = 0.1;
var POUR_CD = 0.16;
var DRINK_T = 0.42;
var CATCH_R = 16;
var MUG_W = 10;
var CUST_W = 13;
var GAP = 22;
var COMBO_AGE = 1.42;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var BEST_KEY = 'playbox-tapper-pour-best';
var MUTE_KEY = 'playbox-tapper-pour-mute';

var RGB_BEER = [240, 160, 32];
var RGB_FOAM = [255, 244, 210];
var RGB_CYAN = [0, 240, 255];
var RGB_MAG = [255, 61, 184];
var RGB_GOLD = [255, 227, 107];
var RGB_HOT = [255, 106, 34];
var RGB_GREEN = [61, 255, 136];

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
function barY(i) {
  return BAR_Y[clamp(i, 0, BARS - 1)];
}
function inTapZone(x) {
  return x >= TAP_ZONE;
}
function mugFallsLeft(full, x) {
  return full && x <= MUG_LEFT;
}
function mugFallsRight(full, x) {
  return !full && x >= MUG_RIGHT;
}
function customerRushes(thirst, x) {
  return thirst > 0 && x >= TAP_MISS;
}
function canCatch(px, pbar, mx, mbar, full) {
  if (full) return false;
  if (pbar !== mbar) return false;
  return Math.abs(px - mx) <= CATCH_R;
}
function mugHitsCust(mx, mbar, full, cx, cbar, drink, thirst, dir) {
  if (!full || drink > 0 || thirst <= 0 || dir < 0) return false;
  if (mbar !== cbar) return false;
  return Math.abs(mx - cx) <= (MUG_W + CUST_W) * 0.55;
}
function waveCount(round, party) {
  return party
    ? Math.min(18, 6 + (round - 1) * 3)
    : Math.min(12, 4 + (round - 1) * 2);
}
function waveGap(round, party) {
  var gap = party ? 0.38 : 0.62;
  return gap / (1 + Math.max(0, round - 1) * 0.08);
}
function mugSpeed(full, round, party) {
  var base = full ? (party ? 196 : 158) : (party ? 218 : 176);
  return base * (1 + Math.max(0, round - 1) * 0.07);
}
function custSpeed(round, party, type) {
  var base = party ? 40 : 27;
  return (base + (type % 4) * 2.4) * (1 + Math.max(0, round - 1) * 0.1);
}
function maxFull(party) {
  return party ? 4 : 3;
}
function hopBar(bar, dir) {
  return clamp(bar + dir, 0, BARS - 1);
}
function comboMul(combo) {
  return Math.max(1, combo | 0);
}

function makeWave(round, party) {
  var total = waveCount(round, party);
  var queue = [];
  var i, bar, thirst, gap;
  gap = waveGap(round, party);
  for (i = 0; i < total; i++) {
    bar = i % BARS;
    thirst = 1;
    if (round >= 3 && i % 4 === 2) thirst = 2;
    if (party && round >= 2 && i % 3 === 0) thirst = 2;
    if (party && round >= 4 && i % 5 === 0) thirst = 3;
    queue.push({
      bar: bar,
      delay: 0.18 + i * gap,
      thirst: thirst,
      type: (i + round) % 4
    });
  }
  return queue;
}

function makePlayer() {
  return {
    x: TAP_ZONE + 22,
    bar: 1,
    face: -1,
    hopT: 0,
    hopFrom: barY(1),
    hopTo: barY(1),
    squash: 1,
    pourT: 0,
    pourCd: 0,
    walk: 0,
    state: 'walk',
    deadT: 0,
    inv: 0,
    denyT: 0
  };
}

function makeMug(x, bar, full, spd) {
  return {
    x: x,
    bar: bar,
    full: full,
    vx: full ? -spd : spd,
    squash: full ? 1.32 : 1.18,
    dead: false,
    spin: 0
  };
}

function makeCust(spec, round, party) {
  return {
    x: BAR_LEFT - 10,
    bar: spec.bar,
    dir: 1,
    thirst: spec.thirst,
    drink: 0,
    type: spec.type % 4,
    spd: custSpeed(round, party, spec.type),
    walk: rand(0, 4),
    face: 1,
    pop: 0
  };
}

function makeTip(x, bar) {
  return { x: x, bar: bar, t: 0, taken: false };
}

function selfCheck() {
  var w, m, c, p;

  if (BAR_Y.length !== 4) throw new Error('4 bars');
  if (LIVES !== 3) throw new Error('3 lives');
  if (!(TAP_ZONE < TAP_MISS)) throw new Error('tap zone before miss');
  if (!(MUG_LEFT < BAR_LEFT)) throw new Error('mug left of door');
  if (!(MUG_RIGHT > TAP_ZONE)) throw new Error('empty smash past tap');
  if (barY(0) >= barY(1) || barY(3) <= barY(2)) throw new Error('bars top to bottom');
  if (!inTapZone(TAP_ZONE) || inTapZone(TAP_ZONE - 1)) throw new Error('tap zone');
  if (!mugFallsLeft(true, MUG_LEFT) || mugFallsLeft(false, MUG_LEFT)) throw new Error('full mug left');
  if (!mugFallsRight(false, MUG_RIGHT) || mugFallsRight(true, MUG_RIGHT)) throw new Error('empty mug right');
  if (!customerRushes(1, TAP_MISS) || customerRushes(0, TAP_MISS)) throw new Error('rush');
  if (!canCatch(100, 1, 108, 1, false)) throw new Error('catch hit');
  if (canCatch(100, 1, 108, 1, true)) throw new Error('no catch full');
  if (canCatch(100, 1, 108, 2, false)) throw new Error('catch same bar');
  if (canCatch(100, 1, 160, 1, false)) throw new Error('catch range');
  if (!mugHitsCust(120, 0, true, 122, 0, 0, 1, 1)) throw new Error('serve hit');
  if (mugHitsCust(120, 0, false, 122, 0, 0, 1, 1)) throw new Error('empty no serve');
  if (mugHitsCust(120, 0, true, 122, 1, 0, 1, 1)) throw new Error('serve bar');
  if (mugHitsCust(120, 0, true, 122, 0, 0.2, 1, 1)) throw new Error('no serve drinking');
  if (mugHitsCust(120, 0, true, 122, 0, 0, 1, -1)) throw new Error('no serve leaving');
  if (waveCount(1, false) !== 4) throw new Error('classic r1 = 4');
  if (waveCount(1, true) <= waveCount(1, false)) throw new Error('party more');
  if (waveCount(3, false) <= waveCount(1, false)) throw new Error('later more');
  if (waveCount(20, false) > 12) throw new Error('classic cap');
  if (mugSpeed(true, 1, true) <= mugSpeed(true, 1, false)) throw new Error('party mugs faster');
  if (mugSpeed(true, 3, false) <= mugSpeed(true, 1, false)) throw new Error('round mugs faster');
  if (custSpeed(1, true, 0) <= custSpeed(1, false, 0)) throw new Error('party walk faster');
  if (maxFull(true) <= maxFull(false)) throw new Error('party more mugs');
  if (hopBar(0, -1) !== 0 || hopBar(3, 1) !== 3) throw new Error('hop clamp');
  if (hopBar(1, -1) !== 0 || hopBar(1, 1) !== 2) throw new Error('hop step');
  if (comboMul(0) !== 1 || comboMul(4) !== 4) throw new Error('combo mul');
  if (waveGap(1, true) >= waveGap(1, false)) throw new Error('party denser');

  w = makeWave(1, false);
  if (w.length !== 4) throw new Error('wave len');
  if (w[0].bar !== 0 || w[3].bar !== 3) throw new Error('wave bars');
  if (w[0].thirst < 1) throw new Error('thirst');

  p = makePlayer();
  if (p.bar !== 1 || !inTapZone(p.x)) throw new Error('player spawn tap');
  m = makeMug(p.x - 12, p.bar, true, mugSpeed(true, 1, false));
  if (!m.full || m.vx >= 0) throw new Error('full mug leftward');
  c = makeCust({ bar: 2, thirst: 2, type: 1 }, 1, false);
  if (c.dir !== 1 || c.thirst !== 2) throw new Error('cust spawn');

  if (STEP <= 0 || STEP > 1 / 30) throw new Error('60fps step');

  (function simServe() {
    var mx = 200, cx = 80, spd = mugSpeed(true, 1, false), t = 0, hit = false;
    while (t < 3) {
      mx -= spd * STEP;
      t += STEP;
      if (mugHitsCust(mx, 1, true, cx, 1, 0, 1, 1)) { hit = true; break; }
      if (mugFallsLeft(true, mx)) break;
    }
    if (!hit) throw new Error('mug should reach customer');
  })();

  (function simCatch() {
    var mx = 300, px = 420, spd = mugSpeed(false, 1, false), t = 0, caught = false;
    while (t < 3) {
      mx += spd * STEP;
      t += STEP;
      if (canCatch(px, 0, mx, 0, false)) { caught = true; break; }
      if (mugFallsRight(false, mx)) break;
    }
    if (!caught) throw new Error('empty mug should be catchable');
  })();

  (function simRush() {
    var x = BAR_LEFT, spd = custSpeed(1, false, 0), t = 0, rushed = false;
    while (t < 30) {
      x += spd * STEP;
      t += STEP;
      if (customerRushes(1, x)) { rushed = true; break; }
    }
    if (!rushed) throw new Error('customer should reach tap');
    if (t < 8) throw new Error('round1 walk too fast');
  })();
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
var btnParty = document.getElementById('btn-party');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnLeft = document.getElementById('btn-left');
var btnRight = document.getElementById('btn-right');
var btnUp = document.getElementById('btn-up');
var btnDown = document.getElementById('btn-down');
var btnPour = document.getElementById('btn-pour');
var scoreEl = document.getElementById('score');
var roundEl = document.getElementById('round');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var waveLabel = document.getElementById('wave-label');
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
var denyTok = 0;

var particles = [];
var sparks = [];
var floats = [];
var rings = [];
var shards = [];
var drips = [];

var keys = { l: false, r: false, u: false, d: false };
var holdU = 0;
var holdD = 0;
var ptr = { down: false, x: 0, y: 0, pour: false, target: -1 };

var G = {
  mode: 'title',
  kind: 'classic',
  party: false,
  clock: 0,
  round: 1,
  lives: LIVES,
  score: 0,
  bestC: 0,
  bestP: 0,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  player: makePlayer(),
  mugs: [],
  customers: [],
  queue: [],
  tips: [],
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flash: 0,
  flashRgb: RGB_HOT,
  clearT: 0,
  lock: 0,
  pourBuf: 0,
  hopUpBuf: 0,
  hopDownBuf: 0,
  why: '',
  tapPull: 0
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
  hop: function () {
    this.ensure();
    this.beep(280, 0.055, 'square', 0.045, 520);
    this.noise(0.035, 0.04, 1500, 'highpass');
  },
  pour: function () {
    this.ensure();
    this.noise(0.12, 0.09, 420, 'lowpass');
    this.beep(220, 0.08, 'sine', 0.05, 140);
    this.beep(880, 0.05, 'triangle', 0.035, 420);
  },
  serve: function () {
    this.ensure();
    this.noise(0.07, 0.06, 700, 'bandpass');
    this.beep(360, 0.07, 'square', 0.045, 180);
    this.beep(240, 0.1, 'sine', 0.04, 90);
  },
  catch: function (combo) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.07;
    this.beep(520 * p, 0.07, 'square', 0.075, 880 * p);
    this.beep(780 * p, 0.11, 'triangle', 0.05, 1180 * p);
    this.noise(0.05, 0.05, 1800, 'highpass');
  },
  coin: function () {
    this.ensure();
    this.beep(980, 0.06, 'triangle', 0.05, 1320);
    this.beep(1320, 0.08, 'square', 0.03, 1760);
  },
  deny: function () {
    this.ensure();
    this.beep(180, 0.07, 'square', 0.04, 90);
  },
  die: function () {
    this.ensure();
    this.noise(0.16, 0.12, 260, 'lowpass');
    this.beep(320, 0.22, 'sawtooth', 0.06, 70);
    this.beep(180, 0.18, 'square', 0.04, 50);
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
      G.bestP = o.p | 0;
      return;
    }
    if (typeof o === 'number') {
      G.bestC = o | 0;
      G.bestP = o | 0;
    }
  } catch (e) { /* ignore */ }
}

function persistBest() {
  var cur = G.party ? G.bestP : G.bestC;
  if (G.score > cur) {
    if (G.party) G.bestP = G.score;
    else G.bestC = G.score;
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ c: G.bestC, p: G.bestP }));
  } catch (e) { /* ignore */ }
}

function currentBest() {
  return G.party ? G.bestP : G.bestC;
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
}

function stageKick(cls) {
  if (reduceMotion()) return;
  stageEl.classList.remove('pour', 'catch', 'die', 'clear');
  void stageEl.offsetWidth;
  stageEl.classList.add(cls);
  clearTimeout(kickTok);
  kickTok = setTimeout(function () {
    stageEl.classList.remove('pour', 'catch', 'die', 'clear');
  }, 320);
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
      r: rand(1.1, 2.5),
      rgb: rgb,
      g: grav == null ? 22 : grav
    });
  }
}

function spark(x, y, rgb, n) {
  var i;
  for (i = 0; i < n; i++) {
    sparks.push({
      x: x, y: y,
      vx: rand(-1, 1) * 52,
      vy: rand(-80, -16),
      t: rand(0.12, 0.3),
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
  for (i = 0; i < 10; i++) {
    a = (i / 10) * TAU + rand(-0.2, 0.2);
    shards.push({
      x: x, y: y,
      vx: Math.cos(a) * rand(40, 120),
      vy: Math.sin(a) * rand(28, 90) - 36,
      rot: rand(0, TAU),
      vr: rand(-9, 9),
      t: rand(0.28, 0.52),
      w: rand(2.6, 5.6)
    });
  }
}

function dripAt(x, y, bar) {
  drips.push({
    x: x, y: y, bar: bar,
    vx: rand(-18, 8),
    vy: rand(-30, -4),
    t: rand(0.18, 0.36),
    rgb: Math.random() < 0.45 ? RGB_FOAM : RGB_BEER
  });
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
  if (G.mode !== 'play' || n <= 0) return;
  G.score += n;
  flashScore(n);
  persistBest();
  hudPlay();
  if (x != null) floatText(x, y - 16, label || ('+' + n), RGB_GOLD);
}

function bumpCombo() {
  if (G.mode !== 'play') return;
  G.combo += 1;
  G.comboAge = 0;
  if (G.combo > G.maxCombo) G.maxCombo = G.combo;
  comboEl.textContent = '×' + G.combo;
  if (G.combo >= 2) {
    comboBox.classList.remove('hot');
    void comboBox.offsetWidth;
    comboBox.classList.add('hot');
  }
  if (G.combo === 5 || G.combo === 8 || G.combo === 12) {
    audio.combo(G.combo);
    toast(G.combo >= 12 ? '飞杯 ×' + G.combo : G.combo >= 8 ? '连杯' : '好接', false, true);
  }
}

function remainingGuests() {
  var n = G.queue.length + G.customers.length;
  var i, c;
  for (i = 0; i < G.customers.length; i++) {
    c = G.customers[i];
    if (c.thirst <= 0) n -= 1;
  }
  return Math.max(0, n);
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
  comboEl.textContent = '×' + G.combo;
  modeLabel.textContent = G.party ? '狂欢' : '经典';
  modeLabel.classList.toggle('party', G.party);
  waveLabel.textContent = G.mode === 'play' ? ('客 ' + remainingGuests()) : '开台';
  renderPips();
  if (G.mode === 'play') {
    hintEl.textContent = G.party
      ? '狂欢飞杯 · 空格斟 · 接住空杯 · R 重开'
      : '空格斟酒 · 接住空杯 · 客人别摸到龙头';
  }
}

function showTitle() {
  G.mode = 'title';
  G.party = false;
  G.kind = 'classic';
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel';
  ovTitle.textContent = '酒保';
  ovLead.textContent = '四条吧台，把酒滑给客人。空杯飞回来，接住才算。客人摸到龙头就砸了。';
  ovOps.textContent = '方向键或 WASD 换台滑步 · 空格斟酒 · 触屏方向+斟 · R 重开 · M 静音';
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
  hintEl.textContent = '空格斟酒 · 接住空杯 · 客人别摸到龙头';
  G.round = 1;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  resetLevel(true);
  hudPlay();
}

function showOver() {
  G.mode = 'over';
  persistBest();
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel lose';
  ovTitle.textContent = '打烊了';
  ovLead.textContent = '第 ' + G.round + ' 巡 · ' + G.score + ' 分 · 连击最高 ×' + G.maxCombo +
    (G.why ? ' · ' + whyText(G.why) : '');
  ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
  audio.over();
  hudPlay();
  ovRetry.focus();
}

function whyText(w) {
  if (w === 'spill') return '酒洒了';
  if (w === 'smash') return '杯子碎了';
  if (w === 'rush') return '客人冲台';
  return '';
}

function resetFx() {
  particles.length = 0;
  sparks.length = 0;
  floats.length = 0;
  rings.length = 0;
  shards.length = 0;
  drips.length = 0;
  G.stop = 0;
  G.shake = 0;
  G.kickX = 0;
  G.kickY = 0;
  G.flash = 0;
}

function resetLevel(attract) {
  G.mugs = [];
  G.customers = [];
  G.tips = [];
  G.player = makePlayer();
  G.queue = makeWave(attract ? 1 : G.round, attract ? false : G.party);
  G.clearT = 0;
  G.lock = 0;
  G.tapPull = 0;
  G.pourBuf = 0;
  G.hopUpBuf = 0;
  G.hopDownBuf = 0;
  ptr.target = -1;
  ptr.pour = false;
  ptr.down = false;
  if (!attract) {
    resetFx();
    G.combo = 0;
    G.comboAge = 0;
  }
}

function hideOverlay() {
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
}

function startRun(kind) {
  G.kind = kind === 'party' ? 'party' : 'classic';
  G.party = G.kind === 'party';
  G.mode = 'play';
  G.round = 1;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  G.maxCombo = 0;
  G.comboAge = 0;
  G.why = '';
  resetLevel(false);
  hideOverlay();
  audio.start();
  toast(G.party ? '狂欢开台' : '经典开台', false, G.party);
  hudPlay();
  canvas.focus({ preventScroll: true });
}

function retry() {
  audio.ui();
  if (G.mode === 'title') startRun('classic');
  else startRun(G.kind);
}

function nextRound() {
  G.round += 1;
  G.mugs = [];
  G.customers = [];
  G.tips = [];
  G.queue = makeWave(G.round, G.party);
  G.player.x = TAP_ZONE + 22;
  G.player.bar = 1;
  G.player.hopT = 0;
  G.player.state = 'walk';
  G.clearT = 0;
  toast('第 ' + G.round + ' 巡 · 加速', false, true);
  hudPlay();
}

function beginClear() {
  var bonus = 400 + 200 * G.round;
  G.clearT = 1.15;
  audio.clear();
  hitStop(0.04);
  flash(RGB_GOLD, 0.22);
  stageKick('clear');
  addScore(bonus, WORLD_W * 0.5, 90, '清巡 +' + bonus);
  toast('下一巡', false, true);
  burst(WORLD_W * 0.5, 70, 18, RGB_GOLD, 90, 0.45, 8);
}

function waveDone() {
  var i;
  if (G.queue.length) return false;
  if (G.customers.length) return false;
  for (i = 0; i < G.mugs.length; i++) {
    if (!G.mugs[i].dead) return false;
  }
  return true;
}

function fullMugsOn(bar) {
  var n = 0, i, m;
  for (i = 0; i < G.mugs.length; i++) {
    m = G.mugs[i];
    if (!m.dead && m.full && m.bar === bar) n++;
  }
  return n;
}

function thirstyOn(bar) {
  var n = 0, i, c;
  for (i = 0; i < G.customers.length; i++) {
    c = G.customers[i];
    if (c.bar === bar && c.thirst > 0 && c.dir > 0) n++;
  }
  return n;
}

function countOnBar(bar) {
  var n = 0, i, c;
  for (i = 0; i < G.customers.length; i++) {
    c = G.customers[i];
    if (c.bar === bar && c.thirst > 0) n++;
  }
  return n;
}

function findAhead(c) {
  var i, o, best = null, bestX;
  bestX = c.dir > 0 ? 1e9 : -1e9;
  for (i = 0; i < G.customers.length; i++) {
    o = G.customers[i];
    if (o === c || o.bar !== c.bar) continue;
    if (c.dir > 0 && o.x > c.x && o.x < bestX) { best = o; bestX = o.x; }
    if (c.dir < 0 && o.x < c.x && o.x > bestX) { best = o; bestX = o.x; }
  }
  return best;
}

function playerY() {
  var p = G.player, t;
  if (p.hopT > 0) {
    t = 1 - p.hopT / HOP_T;
    return lerp(p.hopFrom, p.hopTo, t) - Math.sin(t * Math.PI) * 16;
  }
  return barY(p.bar);
}

function hop(dir) {
  var p = G.player;
  var nb;
  if (p.state === 'dead' || G.lock > 0) return;
  if (p.hopT > 0) return;
  nb = hopBar(p.bar, dir);
  if (nb === p.bar) return;
  p.hopFrom = playerY();
  p.hopTo = barY(nb);
  p.bar = nb;
  p.hopT = HOP_T;
  p.squash = 0.68;
  audio.hop();
  hitStop(0.028);
  kick(1.6);
  burst(p.x, p.hopFrom - 2, 5, RGB_CYAN, 36, 0.18, 40);
}

function denyPour() {
  var p = G.player;
  audio.deny();
  p.denyT = 0.16;
  if (G.mode !== 'play') return;
  if (denyTok) return;
  toast(inTapZone(p.x) ? '台上酒满' : '回龙头', true, false);
  denyTok = setTimeout(function () { denyTok = 0; }, 800);
}

function tryPour() {
  var p = G.player;
  if (G.mode !== 'play' && G.mode !== 'title') return;
  if (G.lock > 0 || p.state === 'dead') return;
  if (p.hopT > 0 || p.pourCd > 0) return;
  if (!inTapZone(p.x)) { denyPour(); return; }
  if (fullMugsOn(p.bar) >= maxFull(G.party)) { denyPour(); return; }
  doPour();
}

function doPour() {
  var p = G.player;
  var spd = mugSpeed(true, G.round, G.party);
  var mug = makeMug(p.x - 14, p.bar, true, spd);
  var y = barY(p.bar);
  G.mugs.push(mug);
  p.pourT = 0.22;
  p.pourCd = POUR_CD;
  p.squash = 1.2;
  p.face = -1;
  G.tapPull = 0.2;
  audio.pour();
  hitStop(0.032);
  kick(2.2);
  stageKick('pour');
  burst(p.x - 10, y - 14, 12, RGB_BEER, 70, 0.32, 28);
  burst(p.x - 8, y - 18, 6, RGB_FOAM, 48, 0.22, 10);
  dripAt(BAR_RIGHT - 6, y - 18, p.bar);
  dripAt(BAR_RIGHT - 4, y - 16, p.bar);
}

function catchMug(m) {
  var p = G.player;
  var y = barY(m.bar);
  m.dead = true;
  bumpCombo();
  audio.catch(G.combo);
  hitStop(0.05);
  shake(2.4);
  kick(3.2);
  stageKick('catch');
  ringAt(p.x, y - 12, RGB_CYAN);
  spark(p.x, y - 10, RGB_GOLD, 10);
  burst(p.x, y - 8, 8, RGB_FOAM, 55, 0.24, 12);
  addScore(100 * comboMul(G.combo), p.x, y - 8, '+' + (100 * comboMul(G.combo)));
  p.squash = 1.22;
}

function serveCustomer(c, m) {
  var y = barY(c.bar);
  m.dead = true;
  c.drink = DRINK_T;
  c.thirst -= 1;
  c.pop = 0.18;
  bumpCombo();
  audio.serve();
  hitStop(0.036);
  kick(1.8);
  burst(c.x, y - 16, 10, RGB_FOAM, 58, 0.28, 8);
  burst(c.x + 4, y - 10, 6, RGB_BEER, 40, 0.22, 18);
  ringAt(c.x, y - 14, RGB_GOLD);
  addScore(50 * comboMul(G.combo), c.x, y - 10, '+' + (50 * comboMul(G.combo)));
  if (c.thirst <= 0 || Math.random() < 0.45) {
    G.tips.push(makeTip(c.x + rand(-6, 6), c.bar));
  }
}

function sendEmpty(c) {
  var spd = mugSpeed(false, G.round, G.party);
  var mug = makeMug(c.x + 10, c.bar, false, spd);
  G.mugs.push(mug);
  burst(c.x + 8, barY(c.bar) - 10, 4, RGB_CYAN, 30, 0.16, 8);
}

function rallyLive() {
  var i, m, c;
  for (i = 0; i < G.mugs.length; i++) {
    m = G.mugs[i];
    if (!m.dead && !m.full) return true;
  }
  for (i = 0; i < G.customers.length; i++) {
    c = G.customers[i];
    if (c.drink > 0) return true;
  }
  return false;
}

function miss(kind, x, y, mug) {
  var i, c, b;
  if (G.lock > 0) return;
  G.why = kind;
  if (mug) mug.dead = true;
  b = mug ? mug.bar : G.player.bar;
  shatter(x, y - 8);
  if (kind === 'spill') burst(x, y - 6, 14, RGB_BEER, 80, 0.34, 30);
  flash(RGB_MAG, 0.28);
  shake(kind === 'rush' ? 9 : 7);
  hitStop(0.075);
  audio.die();
  stageKick('die');
  G.combo = 0;
  G.comboAge = 0;
  comboEl.textContent = '×0';

  if (kind === 'rush') {
    for (i = 0; i < G.customers.length; i++) {
      c = G.customers[i];
      if (c.thirst > 0 && c.bar === b && c.x >= TAP_MISS - 2) {
        c.x = TAP_MISS - 78;
        c.pop = 0.2;
      }
    }
    for (i = 0; i < G.mugs.length; i++) {
      if (G.mugs[i].bar === b) G.mugs[i].dead = true;
    }
  }

  toast(whyText(kind), true, false);

  if (G.mode === 'title') return;

  G.lives -= 1;
  G.lock = 0.72;
  G.player.state = 'dead';
  G.player.deadT = 0.72;
  G.player.squash = 1.25;
  hudPlay();
  if (G.lives < 0) G.lives = 0;
}

function respawn() {
  var p = G.player;
  p.state = 'walk';
  p.x = TAP_ZONE + 22;
  p.hopT = 0;
  p.inv = 0.85;
  p.squash = 0.8;
  p.deadT = 0;
  G.lock = 0;
  if (G.lives <= 0) {
    showOver();
  }
}

function collectTip(t) {
  var y = barY(t.bar);
  t.taken = true;
  audio.coin();
  hitStop(0.022);
  spark(t.x, y - 8, RGB_GOLD, 7);
  addScore(25 * G.round, t.x, y - 6, '赏 +' + (25 * G.round));
}

/* ---- sim ---- */
function thinkAI() {
  var p = G.player;
  var urgent = null;
  var urg = -1e9;
  var i, m, c, s, needPour;

  keys.l = false;
  keys.r = false;

  for (i = 0; i < G.mugs.length; i++) {
    m = G.mugs[i];
    if (m.dead || m.full) continue;
    s = 520 + m.x * 2.2;
    if (s > urg) { urg = s; urgent = { kind: 'mug', bar: m.bar, x: m.x }; }
  }
  for (i = 0; i < G.customers.length; i++) {
    c = G.customers[i];
    if (c.thirst <= 0) continue;
    s = c.x * 1.55 + (c.drink > 0 ? -90 : 0);
    if (s > urg) { urg = s; urgent = { kind: 'cust', bar: c.bar, x: c.x }; }
  }

  if (!urgent) {
    if (p.x < TAP_ZONE + 10) keys.r = true;
    else if (p.x > TAP_ZONE + 28) keys.l = true;
    return;
  }
  if (urgent.bar < p.bar && p.hopT <= 0) G.hopUpBuf = 0.06;
  else if (urgent.bar > p.bar && p.hopT <= 0) G.hopDownBuf = 0.06;
  else if (urgent.bar === p.bar) {
    if (urgent.kind === 'mug') {
      if (p.x < urgent.x - 6) keys.r = true;
      else if (p.x > urgent.x + 12) keys.l = true;
    } else {
      if (p.x < TAP_ZONE + 4) keys.r = true;
      needPour = thirstyOn(p.bar) > fullMugsOn(p.bar);
      if (needPour && inTapZone(p.x) && p.pourCd <= 0 && p.hopT <= 0) G.pourBuf = 0.05;
    }
  }
}

function tickPlayer(dt) {
  var p = G.player;
  var dir, nx;

  if (p.inv > 0) p.inv -= dt;
  if (p.pourCd > 0) p.pourCd -= dt;
  if (p.pourT > 0) p.pourT -= dt;
  if (p.denyT > 0) p.denyT -= dt;
  if (G.tapPull > 0) G.tapPull -= dt;
  p.squash = lerp(p.squash, 1, 1 - Math.pow(0.0008, dt));

  if (p.hopT > 0) {
    p.hopT -= dt;
    if (p.hopT < 0) {
      p.hopT = 0;
      p.squash = 1.22;
    }
  }

  if (p.hopT <= 0 && p.state !== 'dead' && G.lock <= 0) {
    if (G.hopUpBuf > 0) {
      hop(-1);
      G.hopUpBuf = 0;
      ptr.target = -1;
      ptr.pour = false;
    } else if (G.hopDownBuf > 0) {
      hop(1);
      G.hopDownBuf = 0;
      ptr.target = -1;
      ptr.pour = false;
    } else if (ptr.target >= 0 && ptr.target !== p.bar) {
      hop(ptr.target > p.bar ? 1 : -1);
    }
  }

  if (keys.u) {
    holdU += dt;
    if (holdU > 0.22) { G.hopUpBuf = 0.08; holdU = 0; }
  } else holdU = 0;
  if (keys.d) {
    holdD += dt;
    if (holdD > 0.22) { G.hopDownBuf = 0.08; holdD = 0; }
  } else holdD = 0;

  if (G.pourBuf > 0 && G.lock <= 0 && p.state !== 'dead') {
    G.pourBuf = 0;
    tryPour();
  }
  if (ptr.target === p.bar && p.hopT <= 0 && p.state !== 'dead' && G.lock <= 0) {
    if (ptr.pour) tryPour();
    ptr.pour = false;
    ptr.target = -1;
  }

  if (p.state === 'dead') {
    p.deadT -= dt;
    p.x += p.face * 36 * dt;
    return;
  }

  dir = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
  if (ptr.down && G.mode !== 'over') {
    if (Math.abs(ptr.x - p.x) > 6) dir = ptr.x > p.x ? 1 : -1;
  }
  if (dir) p.face = dir;
  if (p.hopT > 0) dir *= 0.35;
  nx = p.x + dir * WALK * dt;
  p.x = clamp(nx, BAR_LEFT + 8, BAR_RIGHT - 6);
  if (dir) p.walk += Math.abs(dir) * WALK * dt * 0.2;
}

function tickSpawn(dt) {
  var i, q, nOn, cap;
  cap = G.party ? 4 : 3;
  for (i = 0; i < G.queue.length; i++) G.queue[i].delay -= dt;
  i = 0;
  while (i < G.queue.length) {
    q = G.queue[i];
    if (q.delay > 0) { i++; continue; }
    nOn = countOnBar(q.bar);
    if (nOn >= cap) { i++; continue; }
    G.queue.splice(i, 1);
    G.customers.push(makeCust(q, G.round, G.party));
    burst(BAR_LEFT + 4, barY(q.bar) - 10, 5, RGB_MAG, 28, 0.18, 12);
  }
}

function tickCustomers(dt) {
  var i, c, ahead, spd, y;
  for (i = G.customers.length - 1; i >= 0; i--) {
    c = G.customers[i];
    if (c.pop > 0) c.pop -= dt;
    if (c.drink > 0) {
      c.drink -= dt;
      if (c.drink <= 0) {
        c.drink = 0;
        sendEmpty(c);
        if (c.thirst <= 0) {
          c.dir = -1;
          c.face = -1;
        }
      }
      continue;
    }
    spd = c.spd * (c.dir < 0 ? 1.32 : 1);
    ahead = findAhead(c);
    if (ahead && Math.abs(ahead.x - c.x) < GAP) {
      if (c.dir > 0 && ahead.x > c.x) {
        spd = ahead.drink > 0 ? 0 : Math.min(spd, ahead.spd * 0.4);
      }
      if (c.dir < 0 && ahead.x < c.x) spd = Math.min(spd, ahead.spd);
    }
    c.x += c.dir * spd * dt;
    c.walk += spd * dt * 0.18;
    y = barY(c.bar);
    if (c.dir < 0 && c.x < BAR_LEFT - 14) {
      addScore(150 * comboMul(G.combo), BAR_LEFT + 12, y - 12, '+' + (150 * comboMul(G.combo)));
      burst(BAR_LEFT + 6, y - 12, 8, RGB_GREEN, 42, 0.22, 10);
      G.customers.splice(i, 1);
      hudPlay();
      continue;
    }
    if (customerRushes(c.thirst, c.x)) {
      miss('rush', c.x, y, { bar: c.bar, dead: false });
      return;
    }
  }
}

function tickMugs(dt) {
  var i, m, y;
  for (i = G.mugs.length - 1; i >= 0; i--) {
    m = G.mugs[i];
    if (m.dead) {
      G.mugs.splice(i, 1);
      continue;
    }
    m.x += m.vx * dt;
    m.squash = lerp(m.squash, 1, 1 - Math.pow(0.002, dt));
    m.spin += dt * (m.full ? 1.2 : 7);
    y = barY(m.bar);
    if (mugFallsLeft(m.full, m.x)) {
      miss('spill', m.x, y, m);
      G.mugs.splice(i, 1);
      return;
    }
    if (mugFallsRight(m.full, m.x)) {
      miss('smash', m.x, y, m);
      G.mugs.splice(i, 1);
      return;
    }
  }
}

function collide() {
  var i, j, m, c, p, best, bestX;
  p = G.player;
  if (p.state === 'dead') return;
  for (i = 0; i < G.mugs.length; i++) {
    m = G.mugs[i];
    if (!m.full || m.dead) continue;
    best = null;
    bestX = -1e9;
    for (j = 0; j < G.customers.length; j++) {
      c = G.customers[j];
      if (mugHitsCust(m.x, m.bar, m.full, c.x, c.bar, c.drink, c.thirst, c.dir)) {
        if (c.x > bestX) { best = c; bestX = c.x; }
      }
    }
    if (best) serveCustomer(best, m);
  }
  for (i = 0; i < G.mugs.length; i++) {
    m = G.mugs[i];
    if (m.dead || m.full) continue;
    if (canCatch(p.x, p.bar, m.x, m.bar, m.full)) catchMug(m);
  }
}

function tickTips(dt) {
  var i, t, p;
  p = G.player;
  for (i = G.tips.length - 1; i >= 0; i--) {
    t = G.tips[i];
    if (t.taken) {
      G.tips.splice(i, 1);
      continue;
    }
    t.t += dt;
    if (p.state !== 'dead' && t.bar === p.bar && Math.abs(p.x - t.x) < 12) {
      collectTip(t);
      G.tips.splice(i, 1);
    }
  }
}

function tickFx(dt) {
  var i, o;
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
    o.vy += 90 * dt;
    if (o.t <= 0) sparks.splice(i, 1);
  }
  for (i = rings.length - 1; i >= 0; i--) {
    o = rings[i];
    o.t += dt;
    o.r += 70 * dt;
    if (o.t > 0.34) rings.splice(i, 1);
  }
  for (i = shards.length - 1; i >= 0; i--) {
    o = shards[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.vy += 160 * dt;
    o.rot += o.vr * dt;
    if (o.t <= 0) shards.splice(i, 1);
  }
  for (i = drips.length - 1; i >= 0; i--) {
    o = drips[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.vy += 120 * dt;
    if (o.t <= 0) drips.splice(i, 1);
  }
  for (i = floats.length - 1; i >= 0; i--) {
    o = floats[i];
    o.t += dt;
    o.y -= 28 * dt;
    if (o.t > 0.7) floats.splice(i, 1);
  }
}

function tick(dt) {
  G.clock += dt;
  tickFx(dt);
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 26);
  G.kickX *= Math.max(0, 1 - dt * 14);
  G.kickY *= Math.max(0, 1 - dt * 14);
  if (G.flash > 0) G.flash = Math.max(0, G.flash - dt);

  if (G.mode === 'over') return;

  if (G.combo > 0 && G.lock <= 0 && G.clearT <= 0 && !rallyLive()) {
    G.comboAge += dt;
    if (G.comboAge > COMBO_AGE) {
      G.combo = 0;
      comboEl.textContent = '×0';
    }
  }

  if (G.lock > 0) {
    G.lock -= dt;
    tickPlayer(dt);
    if (G.lock <= 0 && G.player.state === 'dead') respawn();
    return;
  }

  if (G.clearT > 0) {
    G.clearT -= dt;
    if (G.clearT <= 0) nextRound();
    return;
  }

  if (G.mode === 'title') thinkAI();

  tickPlayer(dt);
  if (G.lock > 0) return;
  tickSpawn(dt);
  tickCustomers(dt);
  if (G.lock > 0) return;
  tickMugs(dt);
  if (G.lock > 0) return;
  collide();
  tickTips(dt);

  if (G.mode === 'play') waveLabel.textContent = '客 ' + remainingGuests();

  if (G.mode === 'play' && waveDone()) beginClear();
  if (G.mode === 'title' && waveDone()) {
    G.queue = makeWave(1, false);
    G.player.x = TAP_ZONE + 22;
    G.player.bar = 1;
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

function barAtY(y) {
  var i, d, best = 0, bd = 1e9;
  for (i = 0; i < BARS; i++) {
    d = Math.abs(y - (BAR_Y[i] - 18));
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}

function drawBg() {
  var g, i;
  ctx.fillStyle = '#07030c';
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(430), sy(200), 8, sx(430), sy(200), 220 * L.s);
  g.addColorStop(0, 'rgba(255,106,34,0.16)');
  g.addColorStop(1, 'rgba(255,106,34,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(40), sy(200), 8, sx(40), sy(200), 160 * L.s);
  g.addColorStop(0, 'rgba(255,61,184,0.12)');
  g.addColorStop(1, 'rgba(255,61,184,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#ffe36b';
  ctx.font = '900 ' + (42 * L.s) + 'px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('酒', sx(240), sy(210));
  ctx.font = '700 ' + (11 * L.s) + 'px "Segoe UI", sans-serif';
  ctx.fillStyle = '#00f0ff';
  ctx.globalAlpha = 0.35;
  ctx.fillText('TAP', sx(240), sy(228));
  ctx.restore();

  for (i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(255,227,107,0.07)' : 'rgba(0,240,255,0.06)';
    ctx.beginPath();
    ctx.arc(sx(70 + i * 68), sy(28 + (i % 3) * 6), 3.2 * L.s, 0, TAU);
    ctx.fill();
  }
}

function drawDoor(i) {
  var y = sy(BAR_Y[i]);
  var x = sx(BAR_LEFT - 8);
  var g = ctx.createLinearGradient(x, y - 36 * L.s, x, y);
  g.addColorStop(0, 'rgba(255,61,184,0.18)');
  g.addColorStop(1, 'rgba(255,61,184,0.02)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 8 * L.s, y - 38 * L.s, 18 * L.s, 38 * L.s);
  ctx.strokeStyle = 'rgba(255,61,184,0.45)';
  ctx.lineWidth = 1.2 * L.s;
  ctx.strokeRect(x - 7 * L.s, y - 36 * L.s, 16 * L.s, 34 * L.s);
}

function drawTap(i) {
  var y = BAR_Y[i];
  var x = BAR_RIGHT - 4;
  var pull = (G.player.bar === i && G.tapPull > 0) ? 0.55 : 0;
  var px = sx(x);
  var py = sy(y);
  var active = G.player.bar === i;
  ctx.save();
  ctx.strokeStyle = active ? '#00f0ff' : 'rgba(0,240,255,0.55)';
  ctx.lineWidth = 2.2 * L.s;
  ctx.beginPath();
  ctx.moveTo(px, py - 36 * L.s);
  ctx.lineTo(px, py - 10 * L.s);
  ctx.stroke();
  ctx.fillStyle = active ? '#ffe36b' : '#c48a28';
  ctx.beginPath();
  ctx.arc(px, py - 10 * L.s, 4.2 * L.s, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.translate(px, py - 10 * L.s);
  ctx.rotate(-0.4 - pull);
  ctx.fillStyle = '#ff6a22';
  ctx.fillRect(2 * L.s, -1.4 * L.s, 10 * L.s, 2.8 * L.s);
  ctx.restore();
  if (active) {
    ctx.strokeStyle = 'rgba(255,227,107,0.35)';
    ctx.lineWidth = 6 * L.s;
    ctx.beginPath();
    ctx.arc(px, py - 12 * L.s, 12 * L.s, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBar(i) {
  var y = BAR_Y[i];
  var x0 = sx(BAR_LEFT);
  var x1 = sx(BAR_RIGHT);
  var yy = sy(y);
  var h = 11 * L.s;
  var g, active;
  active = G.player.bar === i;
  g = ctx.createLinearGradient(x0, yy, x0, yy + h);
  g.addColorStop(0, active ? '#5a2a14' : '#3a1c10');
  g.addColorStop(0.45, '#24100a');
  g.addColorStop(1, '#12080a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x0, yy);
  ctx.lineTo(x1, yy);
  ctx.lineTo(x1 + 6 * L.s, yy + h);
  ctx.lineTo(x0 - 4 * L.s, yy + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = active ? 'rgba(255,227,107,0.85)' : 'rgba(255,106,34,0.55)';
  ctx.lineWidth = (active ? 2.2 : 1.5) * L.s;
  ctx.beginPath();
  ctx.moveTo(x0, yy);
  ctx.lineTo(x1, yy);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0 + 8 * L.s, yy + 5 * L.s);
  ctx.lineTo(x1 - 8 * L.s, yy + 5 * L.s);
  ctx.stroke();
  if (active) {
    g = ctx.createLinearGradient(x0, yy - 18 * L.s, x0, yy);
    g.addColorStop(0, 'rgba(255,106,34,0)');
    g.addColorStop(1, 'rgba(255,106,34,0.12)');
    ctx.fillStyle = g;
    ctx.fillRect(x0, yy - 22 * L.s, x1 - x0, 22 * L.s);
  }
  drawDoor(i);
  drawTap(i);
}

function drawMug(m) {
  var x = sx(m.x);
  var y = sy(barY(m.bar) - 7);
  var s = L.s * m.squash;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(m.spin) * 0.12);
  ctx.scale(m.full ? 1 : 1, 1);
  if (m.full) {
    ctx.fillStyle = '#c45a10';
    ctx.fillRect(-4.2 * s, -8 * s, 8.4 * s, 11 * s);
    ctx.fillStyle = '#f0a020';
    ctx.fillRect(-3.4 * s, -4 * s, 6.8 * s, 6.2 * s);
    ctx.fillStyle = '#fff4d2';
    ctx.fillRect(-4.2 * s, -9.2 * s, 8.4 * s, 2.4 * s);
    ctx.strokeStyle = '#ffe36b';
    ctx.lineWidth = 1.1 * L.s;
    ctx.strokeRect(-4.2 * s, -8 * s, 8.4 * s, 11 * s);
  } else {
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.4 * L.s;
    ctx.strokeRect(-3.8 * s, -7.4 * s, 7.6 * s, 10 * s);
    ctx.globalAlpha = 0.35;
    ctx.strokeRect(-2.4 * s, -5.4 * s, 4.8 * s, 6.4 * s);
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = m.full ? '#ffe36b' : '#00f0ff';
  ctx.lineWidth = 1.3 * L.s;
  ctx.beginPath();
  ctx.arc(5.4 * s, -2 * s, 2.6 * s, -0.6, 0.6);
  ctx.stroke();
  ctx.restore();
}

function custColor(type) {
  if (type === 0) return '#ff8a4a';
  if (type === 1) return '#ff3db8';
  if (type === 2) return '#00f0ff';
  return '#7affb0';
}

function drawCustomer(c) {
  var y = barY(c.bar);
  var x = sx(c.x);
  var base = sy(y);
  var s = L.s * (c.pop > 0 ? 1.08 : 1);
  var leg = Math.sin(c.walk) * 3.1 * s;
  var col = custColor(c.type);
  var bob = c.drink > 0 ? Math.sin(G.clock * 18) * 1.2 * s : 0;
  ctx.save();
  ctx.translate(x, base + bob);
  ctx.scale(c.face, 1);

  ctx.fillStyle = '#1a1018';
  ctx.fillRect(-3.2 * s, -4 * s, 2.4 * s, 4 * s + leg);
  ctx.fillRect(0.8 * s, -4 * s, 2.4 * s, 4 * s - leg);

  ctx.fillStyle = col;
  ctx.fillRect(-5 * s, -16 * s, 10 * s, 12 * s);
  ctx.fillStyle = '#ffd0c0';
  ctx.beginPath();
  ctx.arc(0.4 * s, -19.2 * s, 3.8 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(1.4 * s, -19 * s, 0.7 * s, 0, TAU);
  ctx.fill();

  if (c.type === 0) {
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(-6.2 * s, -22.4 * s, 12.4 * s, 2.2 * s);
    ctx.fillRect(-3.4 * s, -25.2 * s, 6.8 * s, 3.2 * s);
  } else if (c.type === 1) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-3.4 * s, -22 * s);
    ctx.lineTo(0, -28 * s);
    ctx.lineTo(3.4 * s, -22 * s);
    ctx.fill();
  } else if (c.type === 2) {
    ctx.fillStyle = '#ffe36b';
    ctx.fillRect(-5.4 * s, -23.4 * s, 10.8 * s, 2.6 * s);
  } else {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-6 * s, -6 * s);
    ctx.lineTo(6 * s, -6 * s);
    ctx.lineTo(7.4 * s, 0);
    ctx.lineTo(-7.4 * s, 0);
    ctx.fill();
  }

  if (c.drink > 0) {
    ctx.fillStyle = '#f0a020';
    ctx.fillRect(5 * s, -16 * s, 4.4 * s, 6 * s);
    ctx.fillStyle = '#fff4d2';
    ctx.fillRect(5 * s, -17.2 * s, 4.4 * s, 1.5 * s);
  }

  if (c.thirst > 1) {
    ctx.fillStyle = '#ffe36b';
    ctx.font = 'bold ' + (7 * L.s) + 'px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(c.thirst), 0, -28 * s);
  }
  ctx.restore();
}

function drawTip(t) {
  var x = sx(t.x);
  var y = sy(barY(t.bar) - 5 + Math.sin(G.clock * 6 + t.x) * 1.4);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#ffe36b';
  ctx.beginPath();
  ctx.arc(0, 0, 3.4 * L.s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c48a18';
  ctx.beginPath();
  ctx.arc(0, 0, 1.6 * L.s, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawPlayer() {
  var p = G.player;
  var x, y, stride, leg, pour;
  if (p.inv > 0 && ((G.clock * 18) | 0) % 2 === 0) return;
  x = sx(p.x);
  y = sy(playerY());
  stride = Math.sin(p.walk);
  leg = p.state === 'dead' ? 2 * L.s : stride * 3.2 * L.s;
  pour = p.pourT > 0 ? (1 - p.pourT / 0.22) : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p.face, p.squash);
  if (p.state === 'dead') ctx.rotate(0.7 + G.clock * 8);
  ctx.globalAlpha = p.denyT > 0 ? 0.7 : 1;

  ctx.fillStyle = '#1a1010';
  ctx.fillRect(-3.4 * L.s, -4 * L.s, 2.4 * L.s, 4 * L.s + leg);
  ctx.fillRect(1 * L.s, -4 * L.s, 2.4 * L.s, 4 * L.s - leg);

  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(-5.2 * L.s, -16 * L.s, 10.4 * L.s, 12 * L.s);
  ctx.fillStyle = '#ff3db8';
  ctx.fillRect(-5.2 * L.s, -10 * L.s, 10.4 * L.s, 2.2 * L.s);

  ctx.fillStyle = '#ffd0c0';
  ctx.beginPath();
  ctx.arc(0.3 * L.s, -19.2 * L.s, 4.1 * L.s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffe36b';
  ctx.fillRect(-4.8 * L.s, -24.2 * L.s, 9.6 * L.s, 4.2 * L.s);
  ctx.fillRect(1.4 * L.s, -22 * L.s, 5.6 * L.s, 2.2 * L.s);
  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(1.5 * L.s, -18.8 * L.s, 0.7 * L.s, 0, TAU);
  ctx.fill();

  ctx.save();
  ctx.translate(-6 * L.s, -13 * L.s);
  ctx.rotate(p.face < 0 ? (-0.3 - pour * 0.8) : (0.4 + pour * 0.5));
  ctx.fillStyle = '#00c8d8';
  ctx.fillRect(0, -1.6 * L.s, 11 * L.s, 3.2 * L.s);
  if (p.pourT > 0) {
    ctx.fillStyle = '#f0a020';
    ctx.fillRect(9 * L.s, -6 * L.s, 5 * L.s, 7 * L.s);
    ctx.fillStyle = '#fff4d2';
    ctx.fillRect(9 * L.s, -7.2 * L.s, 5 * L.s, 1.6 * L.s);
  }
  ctx.restore();

  ctx.restore();
}

function drawFx() {
  var i, o, a;
  for (i = 0; i < rings.length; i++) {
    o = rings[i];
    a = 1 - o.t / 0.34;
    ctx.strokeStyle = rgba(o.rgb, a * 0.9);
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
    ctx.lineTo(sx(o.x - o.vx * 0.04), sy(o.y - o.vy * 0.04));
    ctx.stroke();
  }
  for (i = 0; i < shards.length; i++) {
    o = shards[i];
    ctx.save();
    ctx.translate(sx(o.x), sy(o.y));
    ctx.rotate(o.rot);
    ctx.fillStyle = rgba(RGB_CYAN, clamp(o.t * 3, 0, 0.9));
    ctx.fillRect(-o.w * 0.5 * L.s, -1.1 * L.s, o.w * L.s, 2.2 * L.s);
    ctx.restore();
  }
  for (i = 0; i < drips.length; i++) {
    o = drips[i];
    ctx.fillStyle = rgba(o.rgb, clamp(o.t * 4, 0, 1));
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), 1.6 * L.s, 0, TAU);
    ctx.fill();
  }
  ctx.font = 'bold ' + (10 * L.s) + 'px "Segoe UI", "PingFang SC", sans-serif';
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
  for (i = 0; i < BARS; i++) drawBar(i);
  for (i = 0; i < G.tips.length; i++) drawTip(G.tips[i]);
  for (i = 0; i < G.customers.length; i++) drawCustomer(G.customers[i]);
  for (i = 0; i < G.mugs.length; i++) drawMug(G.mugs[i]);
  if (G.player.pourT > 0) {
    ctx.strokeStyle = 'rgba(240,160,32,0.85)';
    ctx.lineWidth = 2.4 * L.s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx(BAR_RIGHT - 8), sy(barY(G.player.bar) - 12));
    ctx.lineTo(sx(G.player.x - 10), sy(barY(G.player.bar) - 10));
    ctx.stroke();
  }
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
bindPad(btnUp, function (v) {
  keys.u = v;
  if (v) G.hopUpBuf = 0.08;
});
bindPad(btnDown, function (v) {
  keys.d = v;
  if (v) G.hopDownBuf = 0.08;
});
bindPad(btnPour, function (v) {
  if (v) G.pourBuf = 0.08;
});

function worldFromEvent(e) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left - L.x) / L.s,
    y: (e.clientY - rect.top - L.y) / L.s
  };
}

function keyOn(e, down) {
  var k = e.code;
  if (k === 'ArrowLeft' || k === 'KeyA') { keys.l = down; e.preventDefault(); }
  else if (k === 'ArrowRight' || k === 'KeyD') { keys.r = down; e.preventDefault(); }
  else if (k === 'ArrowDown' || k === 'KeyS') {
    keys.d = down;
    if (down) G.hopDownBuf = 0.08;
    e.preventDefault();
  } else if (k === 'ArrowUp' || k === 'KeyW') {
    keys.u = down;
    if (down) G.hopUpBuf = 0.08;
    e.preventDefault();
  } else if (k === 'Space') {
    if (down) G.pourBuf = 0.08;
    e.preventDefault();
  }
}

window.addEventListener('keydown', function (e) {
  if (e.repeat) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown' ||
        e.code === 'KeyW' || e.code === 'KeyS') {
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
      startRun('party');
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
      startRun('party');
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
btnParty.addEventListener('click', function () {
  audio.ensure();
  startRun('party');
});
ovRetry.addEventListener('click', function () {
  audio.ensure();
  startRun(G.kind);
});

canvas.addEventListener('pointerdown', function (e) {
  var w;
  audio.ensure();
  canvas.focus({ preventScroll: true });
  if (G.mode === 'over' || G.mode === 'title') return;
  e.preventDefault();
  w = worldFromEvent(e);
  ptr.down = true;
  ptr.x = w.x;
  ptr.y = w.y;
  ptr.target = barAtY(w.y);
  ptr.pour = w.x >= TAP_ZONE - 18;
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  if (ptr.target === G.player.bar && ptr.pour) {
    G.pourBuf = 0.08;
    ptr.pour = false;
    ptr.target = -1;
  }
});
canvas.addEventListener('pointermove', function (e) {
  var w;
  if (!ptr.down) return;
  w = worldFromEvent(e);
  ptr.x = w.x;
  ptr.y = w.y;
  ptr.target = barAtY(w.y);
});
function ptrUp() { ptr.down = false; }
canvas.addEventListener('pointerup', ptrUp);
canvas.addEventListener('pointercancel', ptrUp);
canvas.addEventListener('lostpointercapture', ptrUp);

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
