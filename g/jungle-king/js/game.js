'use strict';

/* 丛林 — Jungle Hunt remake. No CDN. */

var VW = 640;
var VH = 360;
var LIVES = 3;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var GRAB_R = 46;
var GRAB_GLOW = 62;
var COMBO_WIN = 1.42;
var PW = 13;
var PH = 26;
var JUMP_V = 430;
var GRAV = 1350;
var MAX_FALL = 640;
var COYOTE = 0.08;
var BUFFER = 0.12;
var INVULN = 1.05;
var DIE_T = 0.7;
var KNIFE_CD = 0.2;
var KNIFE_LIFE = 0.14;
var WATER_Y = 98;
var BANK_X = 968;
var BANK_Y = 294;
var PIT_Y = 352;
var HILL_W = 1520;
var CAMP_W = 680;
var SWIM_W = 1680;
var VINE_W = 1180;
var BEST_KEY = 'playbox-jungle-king-best';
var MUTE_KEY = 'playbox-jungle-king-mute';
var OPS = '方向键或 WASD 移动 · 空格 跳跃 / 抓藤 / 挥刀 · 触屏底栏 · R 重开 · M 静音';
var SCENE_NAME = ['荡藤', '斩鳄', '滚石', '救人'];
var SCENE_HINT = [
  '空格在两藤靠近时抓下一根 · 抓空会摔',
  'WASD 游 · 空格挥刀斩鳄 · 浮出水面换气',
  '跳过矮石，蹲过飞石 · 冲到山顶',
  '矛落下时跃过守卫 · 跳过大锅救人'
];

var MAG = [255, 61, 184];
var CYN = [0, 240, 255];
var GOLD = [255, 227, 107];
var LEAF = [157, 255, 58];
var LEAF2 = [200, 255, 106];
var HOT = [255, 106, 40];
var WHT = [246, 243, 239];
var PNK = [255, 154, 210];

var VINE_SPEC = [
  { x: 86, len: 168, amp: 0.62, freq: 1.22, phase: 0.10 },
  { x: 218, len: 156, amp: 0.70, freq: 1.38, phase: 1.70 },
  { x: 348, len: 172, amp: 0.58, freq: 1.16, phase: 0.40 },
  { x: 486, len: 160, amp: 0.68, freq: 1.44, phase: 2.20 },
  { x: 620, len: 166, amp: 0.60, freq: 1.28, phase: 0.90 },
  { x: 756, len: 154, amp: 0.72, freq: 1.36, phase: 2.80 },
  { x: 892, len: 170, amp: 0.64, freq: 1.20, phase: 0.20 }
];

var SCORE = {
  grab: 120,
  croc: 280,
  rockJump: 160,
  rockDuck: 140,
  native: 220,
  scene: 900,
  round: 180,
  save: 2400,
  time: 8
};

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
function dist(ax, ay, bx, by) {
  return hypot(ax - bx, ay - by);
}
function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function spdMul(rush, round) {
  return (rush ? 1.32 : 1) * (1 + Math.max(0, round - 1) * 0.12);
}

function sceneTime(scene, rush, round) {
  var base = [36, 42, 34, 26][scene];
  var t = base / ((rush ? 1.28 : 1) * (1 + Math.max(0, round - 1) * 0.06));
  return t < 14 ? 14 : t;
}

function airMax(rush) {
  return rush ? 5.15 : 7.2;
}

function airTick(air, submerged, dt, max, refill) {
  if (submerged) return air - dt;
  return Math.min(max, air + dt * refill);
}

function vineHang(v, t) {
  var ang = v.amp * Math.sin(t * v.freq + v.phase);
  return {
    ang: ang,
    x: v.x + Math.sin(ang) * v.len,
    y: 44 + Math.cos(ang) * v.len
  };
}

function vineOmega(v, t) {
  return v.amp * v.freq * Math.cos(t * v.freq + v.phase);
}

function inGrabRange(ax, ay, bx, by, r) {
  var dx = ax - bx;
  var dy = ay - by;
  return dx * dx + dy * dy <= r * r;
}

function makeVines(round, rush) {
  var mul = spdMul(rush, round);
  return VINE_SPEC.map(function (s) {
    return {
      x: s.x,
      len: s.len,
      amp: s.amp,
      freq: s.freq * mul,
      phase: s.phase,
      glow: 0,
      pulse: 0
    };
  });
}

function hillY(x) {
  return 332 - clamp(x, 0, HILL_W - 40) * 0.09;
}

function jumpHeight() {
  return (JUMP_V * JUMP_V) / (2 * GRAV);
}

function spearUp(t, freq, offset) {
  return Math.sin(t * freq + offset) > 0.18;
}

function crocMouth(t, phase, period) {
  var u = ((t + phase) % period) / period;
  if (u < 0.42) return 0;
  if (u < 0.52) return (u - 0.42) / 0.1;
  if (u < 0.78) return 1;
  if (u < 0.9) return 1 - (u - 0.78) / 0.12;
  return 0;
}

function playerBox(p, duck) {
  var h = duck ? 13 : PH;
  return { x: p.x - PW * 0.42, y: p.y - h + 2, w: PW * 0.84, h: h - 3 };
}

function makePlayer() {
  return {
    x: 86,
    y: 200,
    vx: 0,
    vy: 0,
    face: 1,
    vine: 0,
    from: -1,
    state: 'hang',
    grounded: true,
    walk: 0,
    coyote: 0,
    squash: 1,
    inv: 0,
    deadT: 0,
    slash: 0,
    duck: false,
    wasDuck: false,
    swim: false,
    why: '',
    blink: 0
  };
}

function selfCheck() {
  var vines, a, b, t, found, near, rest, h, i, m0, m1, air;

  if (VINE_SPEC.length !== 7) throw new Error('7 vines');
  if (LIVES !== 3) throw new Error('3 lives');
  if (SCENE_NAME.length !== 4) throw new Error('4 scenes');
  if (GRAB_R < 40 || GRAB_R > 72) throw new Error('grab radius window');

  vines = makeVines(1, false);
  a = vineHang(vines[0], 0);
  b = vineHang(vines[1], 0);
  rest = dist(a.x, a.y, b.x, b.y);
  if (rest <= GRAB_R) throw new Error('rest too close to grab');
  if (!inGrabRange(0, 0, GRAB_R, 0, GRAB_R)) throw new Error('grab inclusive');
  if (inGrabRange(0, 0, GRAB_R + 2, 0, GRAB_R)) throw new Error('grab too loose');

  found = false;
  near = 999;
  for (t = 0; t < 10; t += 0.02) {
    a = vineHang(vines[0], t);
    b = vineHang(vines[1], t);
    i = dist(a.x, a.y, b.x, b.y);
    if (i < near) near = i;
    if (i <= GRAB_R) found = true;
  }
  if (!found) throw new Error('never in grab range');
  if (near >= rest) throw new Error('swing must close the gap');

  for (i = 0; i < vines.length - 1; i++) {
    found = false;
    for (t = 0; t < 12; t += 0.03) {
      a = vineHang(vines[i], t);
      b = vineHang(vines[i + 1], t);
      if (dist(a.x, a.y, b.x, b.y) <= GRAB_R) {
        found = true;
        break;
      }
    }
    if (!found) throw new Error('vine pair ' + i + ' unreachable');
  }

  air = airTick(7, true, 1, 7, 2.6);
  if (air >= 7) throw new Error('air must drain');
  if (airTick(1, false, 1, 7, 2.6) <= 1) throw new Error('air must refill');
  if (airMax(true) >= airMax(false)) throw new Error('rush less air');

  h = jumpHeight();
  if (h < 55 || h > 90) throw new Error('jump height window');
  if (h <= 9 * 2 + 10) throw new Error('jump must clear small boulder');

  if (hillY(0) <= hillY(900)) throw new Error('hill rises to the right');
  if (sceneTime(0, true, 1) >= sceneTime(0, false, 1)) throw new Error('rush shorter timer');
  if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('rush faster');
  if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('rounds speed up');

  m0 = crocMouth(0, 0, 2.2);
  m1 = crocMouth(1.4, 0, 2.2);
  if (m0 !== 0) throw new Error('mouth starts closed');
  if (m1 <= 0.5) throw new Error('mouth opens mid cycle');
  if (spearUp(0.5, 1, 0) === spearUp(0.5 + Math.PI, 1, 0) &&
      Math.sin(0.5) > 0.18 && Math.sin(0.5 + Math.PI) > 0.18) {
    throw new Error('spear phase');
  }
  if (spearUp(Math.PI / 2, 1, 0) !== true) throw new Error('spear up at peak');
  if (spearUp(Math.PI * 1.5, 1, 0) !== false) throw new Error('spear down at trough');

  if (BANK_X < VINE_SPEC[VINE_SPEC.length - 1].x + 50) throw new Error('bank after last vine');
  if (playerBox({ x: 100, y: 200 }, true).h >= playerBox({ x: 100, y: 200 }, false).h) {
    throw new Error('duck shorter');
  }
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
var btnRescue = document.getElementById('btn-rescue');
var btnRush = document.getElementById('btn-rush');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnLeft = document.getElementById('btn-left');
var btnRight = document.getElementById('btn-right');
var btnJump = document.getElementById('btn-jump');
var btnDown = document.getElementById('btn-down');
var btnUp = document.getElementById('btn-up');
var scoreEl = document.getElementById('score');
var roundEl = document.getElementById('round');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var sceneLabel = document.getElementById('scene-label');
var timeBar = document.getElementById('time-bar');
var airBar = document.getElementById('air-bar');
var airWrap = document.getElementById('air-wrap');
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
var floats = [];
var rings = [];
var splashes = [];
var motes = [];

var keys = { l: false, r: false, u: false, d: false, act: false };
var G = {
  mode: 'title',
  kind: 'rescue',
  rush: false,
  scene: 0,
  round: 1,
  lives: LIVES,
  score: 0,
  bestC: 0,
  bestR: 0,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  clock: 0,
  time: 36,
  timeMax: 36,
  air: 7,
  airMax: 7,
  player: makePlayer(),
  vines: makeVines(1, false),
  crocs: [],
  boulders: [],
  natives: [],
  woman: { x: 590, y: 168, saved: false },
  pot: { x: 508, y: 292 },
  worldW: VINE_W,
  camX: 0,
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flash: 0,
  flashRgb: LEAF,
  lock: 0,
  clearT: 0,
  actionBuf: 0,
  knifeT: 0,
  spawnCd: 0,
  ready: false,
  why: '',
  warnT: 0,
  wet: false
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
  snap: function (combo) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.07;
    this.beep(280 * p, 0.06, 'square', 0.07, 620 * p);
    this.beep(520 * p, 0.1, 'triangle', 0.05, 880 * p);
    this.noise(0.05, 0.07, 1400, 'highpass');
  },
  leap: function () {
    this.ensure();
    this.beep(240, 0.07, 'square', 0.045, 420);
    this.noise(0.04, 0.04, 900, 'bandpass');
  },
  miss: function () {
    this.ensure();
    this.beep(220, 0.16, 'sawtooth', 0.05, 70);
    this.noise(0.1, 0.07, 280, 'lowpass');
  },
  splash: function () {
    this.ensure();
    this.noise(0.12, 0.1, 420, 'lowpass');
    this.beep(180, 0.08, 'sine', 0.035, 90);
  },
  knife: function () {
    this.ensure();
    this.noise(0.05, 0.07, 2200, 'highpass');
    this.beep(720, 0.04, 'square', 0.045, 280);
  },
  croc: function (combo) {
    this.ensure();
    var p = 1 + Math.min(6, combo) * 0.06;
    this.noise(0.1, 0.11, 240, 'lowpass');
    this.beep(180 * p, 0.09, 'square', 0.07, 70);
    this.beep(540 * p, 0.08, 'triangle', 0.04, 220);
  },
  hop: function () {
    this.ensure();
    this.beep(300, 0.06, 'square', 0.045, 540);
    this.noise(0.035, 0.035, 1500, 'highpass');
  },
  land: function () {
    this.ensure();
    this.noise(0.05, 0.05, 360, 'bandpass');
    this.beep(150, 0.04, 'sine', 0.03, 80);
  },
  rock: function (combo) {
    this.ensure();
    var p = 1 + Math.min(7, combo) * 0.06;
    this.beep(400 * p, 0.07, 'square', 0.06, 760 * p);
    this.beep(620 * p, 0.1, 'triangle', 0.04, 920 * p);
  },
  duck: function () {
    this.ensure();
    this.noise(0.04, 0.04, 700, 'bandpass');
    this.beep(180, 0.04, 'sine', 0.025, 120);
  },
  native: function (combo) {
    this.ensure();
    var p = 1 + Math.min(5, combo) * 0.08;
    this.beep(480 * p, 0.08, 'square', 0.06, 820 * p);
    this.noise(0.06, 0.05, 1600, 'highpass');
  },
  die: function () {
    this.ensure();
    this.noise(0.18, 0.12, 260, 'lowpass');
    this.beep(320, 0.22, 'sawtooth', 0.06, 70);
    this.beep(180, 0.18, 'square', 0.04, 50);
  },
  warn: function () {
    this.ensure();
    this.beep(880, 0.06, 'square', 0.035, 440);
  },
  clear: function () {
    this.ensure();
    this.beep(392, 0.09, 'square', 0.06, 523);
    this.beep(523, 0.11, 'square', 0.05, 659);
    this.beep(784, 0.2, 'triangle', 0.05, 1046);
  },
  save: function () {
    this.ensure();
    this.beep(523, 0.1, 'triangle', 0.06, 659);
    this.beep(659, 0.12, 'square', 0.05, 784);
    this.beep(1046, 0.22, 'triangle', 0.045, 1318);
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
  var cur = G.rush ? G.bestR : G.bestC;
  if (G.score > cur) {
    if (G.rush) G.bestR = G.score;
    else G.bestC = G.score;
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ c: G.bestC, r: G.bestR }));
  } catch (e) { /* ignore */ }
}

function bestNow() {
  return G.rush ? G.bestR : G.bestC;
}

/* ---- fx ---- */
function hitStop(t) {
  if (reduceMotion()) return;
  if (t > G.stop) G.stop = t;
}

function shake(n) {
  if (reduceMotion()) return;
  G.shake = Math.max(G.shake, n);
}

function flash(rgb, n) {
  G.flashRgb = rgb;
  G.flash = n == null ? 0.16 : n;
}

function kick(kind) {
  stageEl.classList.remove('die', 'hop', 'slash', 'clear', 'snap');
  void stageEl.offsetWidth;
  stageEl.classList.add(kind);
  clearTimeout(kickTok);
  kickTok = setTimeout(function () {
    stageEl.classList.remove(kind);
  }, 360);
}

function toast(msg, kind) {
  toastEl.textContent = msg;
  toastEl.className = 'toast' + (kind ? ' ' + kind : '');
  clearTimeout(toastTok);
  toastTok = setTimeout(function () {
    toastEl.classList.add('hidden');
  }, 1100);
}

function addScore(n, x, y) {
  var mul = Math.max(1, G.combo);
  var v = Math.round(n * mul);
  G.score += v;
  persistBest();
  scoreEl.textContent = String(G.score);
  bestEl.textContent = String(bestNow());
  scoreBox.classList.remove('flash');
  void scoreBox.offsetWidth;
  scoreBox.classList.add('flash');
  scoreAdd.hidden = false;
  scoreAdd.textContent = '+' + v;
  clearTimeout(addTok);
  addTok = setTimeout(function () { scoreAdd.hidden = true; }, 700);
  if (x != null) {
    floats.push({ x: x, y: y - 18, t: 0.7, text: '+' + v, rgb: mul > 1 ? GOLD : LEAF });
  }
}

function bumpCombo() {
  G.combo += 1;
  G.comboAge = COMBO_WIN;
  if (G.combo > G.maxCombo) G.maxCombo = G.combo;
  comboEl.textContent = '×' + G.combo;
  comboBox.classList.toggle('hot', G.combo >= 2);
  if (G.combo >= 2) {
    comboBox.classList.remove('flash');
    void comboBox.offsetWidth;
    comboBox.classList.add('flash');
  }
}

function comboReset() {
  G.combo = 0;
  G.comboAge = 0;
  comboEl.textContent = '×1';
  comboBox.classList.remove('hot');
}

function burst(x, y, n, rgb, spd, life) {
  var i, a;
  if (particles.length > 160) particles.splice(0, 50);
  for (i = 0; i < n; i++) {
    a = rand(0, TAU);
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(a) * rand(spd * 0.3, spd),
      vy: Math.sin(a) * rand(spd * 0.3, spd) - rand(10, 40),
      t: rand(life * 0.5, life),
      life: life,
      r: rand(1.2, 3.2),
      rgb: rgb
    });
  }
}

function ringAt(x, y, rgb) {
  rings.push({ x: x, y: y, t: 0.34, rgb: rgb, r: 6 });
}

function splashAt(x, y, n) {
  var i;
  audio.splash();
  if (splashes.length > 40) splashes.splice(0, 12);
  for (i = 0; i < n; i++) {
    splashes.push({
      x: x + rand(-8, 8),
      y: y,
      vx: rand(-70, 70),
      vy: rand(-220, -80),
      t: rand(0.28, 0.5)
    });
  }
  burst(x, y, 8, CYN, 90, 0.4);
}

function seedMotes() {
  var i;
  motes.length = 0;
  for (i = 0; i < 28; i++) {
    motes.push({
      x: rand(0, 1600),
      y: rand(20, 300),
      ph: rand(0, TAU),
      s: rand(0.6, 1.6),
      rgb: Math.random() < 0.5 ? GOLD : LEAF
    });
  }
}

function makeCrocs(round, rush) {
  var n = (rush ? 7 : 5) + Math.min(3, round - 1);
  var a = [];
  var i, x, y, dir, spd;
  for (i = 0; i < n; i++) {
    x = 260 + i * (1380 / n);
    y = 148 + (i % 3) * 52 + (i % 2) * 10;
    dir = i % 2 ? 1 : -1;
    spd = (48 + i * 7 + (rush ? 18 : 0)) * (1 + (round - 1) * 0.08);
    a.push({
      x: x,
      y: y,
      vx: dir * spd,
      face: dir,
      lo: x - 110,
      hi: x + 110,
      phase: i * 0.47,
      period: rush ? 1.7 : 2.15,
      dead: false,
      pop: 0,
      w: 46,
      h: 16
    });
  }
  return a;
}

function makeNatives(round, rush) {
  var f = (rush ? 3.1 : 2.35) * (1 + (round - 1) * 0.08);
  return [
    { x: 248, freq: f, offset: 0.2, jumped: false, face: -1 },
    { x: 392, freq: f, offset: rush ? 0.55 : Math.PI, jumped: false, face: -1 }
  ];
}

function resetPlayerForScene(scene, inv) {
  var p = makePlayer();
  p.inv = inv ? INVULN : 0;
  if (scene === 0) {
    p.state = 'hang';
    p.vine = 0;
    p.x = VINE_SPEC[0].x;
    p.y = 180;
  } else if (scene === 1) {
    p.state = 'swim';
    p.swim = true;
    p.x = 70;
    p.y = WATER_Y + 36;
    p.face = 1;
  } else if (scene === 2) {
    p.state = 'walk';
    p.x = 48;
    p.y = hillY(48);
    p.grounded = true;
  } else {
    p.state = 'walk';
    p.x = 54;
    p.y = 300;
    p.grounded = true;
  }
  return p;
}

function worldWFor(scene) {
  if (scene === 0) return VINE_W;
  if (scene === 1) return SWIM_W;
  if (scene === 2) return HILL_W;
  return CAMP_W;
}

function setupScene(scene, respawn) {
  G.scene = scene;
  G.clock = 0;
  G.timeMax = sceneTime(scene, G.rush, G.round);
  G.time = G.timeMax;
  G.airMax = airMax(G.rush);
  G.air = G.airMax;
  G.worldW = worldWFor(scene);
  G.player = resetPlayerForScene(scene, !!respawn);
  G.vines = makeVines(G.round, G.rush);
  G.crocs = scene === 1 ? makeCrocs(G.round, G.rush) : [];
  G.boulders = [];
  G.natives = scene === 3 ? makeNatives(G.round, G.rush) : [];
  G.woman = { x: 600, y: 164, saved: false };
  G.pot = { x: 512, y: 292 };
  G.spawnCd = scene === 2 ? 0.4 : 0;
  G.lock = 0;
  G.clearT = 0;
  G.knifeT = 0;
  G.actionBuf = 0;
  G.ready = false;
  G.wet = false;
  G.camX = clamp(G.player.x - 220, 0, Math.max(0, G.worldW - VW));
  particles.length = 0;
  floats.length = 0;
  rings.length = 0;
  splashes.length = 0;
  seedMotes();
  sceneLabel.textContent = SCENE_NAME[scene];
  hintEl.textContent = SCENE_HINT[scene];
  airWrap.hidden = scene !== 1;
  hudPlay();
}

function hudPlay() {
  scoreEl.textContent = String(G.score);
  roundEl.textContent = String(G.round);
  bestEl.textContent = String(bestNow());
  comboEl.textContent = '×' + Math.max(1, G.combo);
  modeLabel.textContent = G.rush ? '急流' : '营救';
  modeLabel.classList.toggle('rush', G.rush);
  sceneLabel.textContent = SCENE_NAME[G.scene];
  renderPips();
  syncBars();
}

function renderPips() {
  var i, s = '';
  for (i = 0; i < LIVES; i++) {
    s += '<i class="pip' + (i < G.lives ? ' on' : ' gone') + '"></i>';
  }
  pipsEl.innerHTML = s;
}

function syncBars() {
  var tr = G.timeMax > 0 ? clamp(G.time / G.timeMax, 0, 1) : 0;
  var ar = G.airMax > 0 ? clamp(G.air / G.airMax, 0, 1) : 0;
  timeBar.style.transform = 'scaleX(' + tr + ')';
  timeBar.classList.toggle('low', tr < 0.28);
  airBar.style.transform = 'scaleX(' + ar + ')';
  airBar.classList.toggle('low', ar < 0.32);
}

function showTitle() {
  G.mode = 'title';
  G.scene = 0;
  G.rush = false;
  G.kind = 'rescue';
  G.round = 1;
  G.lives = LIVES;
  G.score = 0;
  G.clock = 0;
  G.vines = makeVines(1, false);
  G.player = resetPlayerForScene(0, false);
  G.worldW = VINE_W;
  G.camX = 0;
  G.crocs = [];
  G.boulders = [];
  G.natives = [];
  comboReset();
  seedMotes();
  overlayEl.classList.remove('hidden');
  panelEl.classList.remove('win', 'lose');
  ovKicker.textContent = 'JUNGLE';
  ovTitle.textContent = '丛林';
  ovLead.textContent = '荡藤要抓准时机，水下留气斩鳄，爬山躲滚石，跃过守卫救出同伴。';
  ovOps.textContent = OPS;
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
  hintEl.textContent = '空格抓下一根藤 · 水下留气挥刀 · 滚石跳或蹲 · 跃过守卫救人 · R 重开';
  airWrap.hidden = true;
  hudPlay();
  modeLabel.textContent = '营救';
}

function showOver() {
  G.mode = 'over';
  persistBest();
  overlayEl.classList.remove('hidden');
  panelEl.classList.remove('win');
  panelEl.classList.add('lose');
  ovKicker.textContent = 'JUNGLE';
  ovTitle.textContent = '命尽';
  ovLead.textContent = '分数 ' + G.score + ' · 最高连击 ×' + Math.max(1, G.maxCombo) +
    ' · 第 ' + G.round + ' 巡 · ' + (G.player.why || G.why || '失手');
  ovOps.textContent = 'R 或 再来 重开本模式 · 空格 / Enter 亦可';
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
  audio.over();
}

function startRun(kind) {
  G.kind = kind;
  G.rush = kind === 'rush';
  G.mode = 'play';
  G.round = 1;
  G.lives = LIVES;
  G.score = 0;
  G.maxCombo = 0;
  comboReset();
  overlayEl.classList.add('hidden');
  audio.start();
  setupScene(0, false);
  toast(G.rush ? '急流' : '营救', G.rush ? '' : 'gold');
}

function retry() {
  audio.ui();
  if (G.mode === 'title') {
    startRun('rescue');
    return;
  }
  startRun(G.kind);
}

function kill(why) {
  var p = G.player;
  if (G.mode !== 'play') return;
  if (p.inv > 0 || p.deadT > 0 || G.lock > 0 || G.clearT > 0) return;
  G.lives -= 1;
  p.deadT = DIE_T;
  p.why = why;
  G.why = why;
  p.vy = Math.min(p.vy, -80);
  audio.die();
  hitStop(0.08);
  shake(11);
  flash(MAG, 0.22);
  kick('die');
  comboReset();
  burst(p.x, p.y - 10, 22, MAG, 160, 0.55);
  renderPips();
  toast(why, 'warn');
}

function clearScene() {
  var bonus, p;
  if (G.clearT > 0 || G.lock > 0) return;
  p = G.player;
  bonus = SCORE.scene + SCORE.round * G.round + Math.round(G.time * SCORE.time);
  G.lock = 0.85;
  G.clearT = 0.85;
  bumpCombo();
  addScore(bonus, p.x, p.y);
  audio.clear();
  hitStop(0.05);
  kick('clear');
  flash(LEAF, 0.14);
  burst(p.x, p.y - 12, 26, GOLD, 140, 0.6);
  ringAt(p.x, p.y - 8, CYN);
  toast(SCENE_NAME[G.scene] + ' 过关', 'gold');
}

function nextAfterClear() {
  if (G.scene < 3) {
    setupScene(G.scene + 1, false);
    toast(SCENE_NAME[G.scene], '');
    return;
  }
  G.round += 1;
  bumpCombo();
  addScore(SCORE.save, G.player.x, G.player.y);
  audio.save();
  toast('救出 · 第 ' + G.round + ' 巡', 'gold');
  setupScene(0, false);
}

function grabVine(i) {
  var p = G.player;
  var v = G.vines[i];
  var pose = vineHang(v, G.clock);
  p.vine = i;
  p.from = i;
  p.state = 'hang';
  p.vx = 0;
  p.vy = 0;
  p.x = pose.x;
  p.y = pose.y + 16;
  p.squash = 0.78;
  v.pulse = 1;
  v.glow = 1;
  bumpCombo();
  addScore(SCORE.grab, p.x, p.y);
  audio.snap(G.combo);
  hitStop(0.04);
  shake(3);
  kick('snap');
  flash(LEAF, 0.08);
  burst(p.x, pose.y, 16, LEAF, 130, 0.42);
  ringAt(p.x, pose.y, GOLD);
}

function tryLeap() {
  var p = G.player;
  var v, pose, next, np, omega;
  if (p.state !== 'hang' || p.deadT > 0) return;
  v = G.vines[p.vine];
  pose = vineHang(v, G.clock);
  next = p.vine + 1;
  if (next < G.vines.length) {
    np = vineHang(G.vines[next], G.clock);
    if (inGrabRange(p.x, p.y - 14, np.x, np.y, GRAB_R)) {
      grabVine(next);
      return;
    }
  } else if (pose.ang > 0.1 && p.x > v.x + 8) {
    p.from = p.vine;
    p.vine = -1;
    p.state = 'leap';
    p.vx = Math.max(150, Math.cos(pose.ang) * v.len * vineOmega(v, G.clock) + 80);
    p.vy = -150;
    p.face = 1;
    audio.leap();
    burst(p.x, p.y, 10, GOLD, 80, 0.32);
    return;
  }
  omega = vineOmega(v, G.clock);
  p.from = p.vine;
  p.vine = -1;
  p.state = 'leap';
  p.vx = Math.cos(pose.ang) * v.len * omega + 40;
  p.vy = -Math.sin(pose.ang) * v.len * omega - 40;
  p.face = p.vx >= 0 ? 1 : -1;
  audio.leap();
  burst(p.x, p.y, 8, LEAF2, 70, 0.3);
}

function tryJump() {
  var p = G.player;
  if (p.deadT > 0 || G.lock > 0) return;
  if (G.scene === 1) return;
  if (!(p.grounded || p.coyote > 0)) return;
  p.vy = -JUMP_V;
  p.grounded = false;
  p.state = 'jump';
  p.coyote = 0;
  p.duck = false;
  p.squash = 1.18;
  G.actionBuf = 0;
  audio.hop();
  hitStop(0.03);
  kick('hop');
  burst(p.x, p.y, 7, GOLD, 60, 0.28);
}

function doKnife() {
  var p = G.player;
  var i, c, hx, hy, hw, hh, box;
  if (G.knifeT > 0 || p.deadT > 0 || G.lock > 0) return;
  G.knifeT = KNIFE_CD;
  p.slash = KNIFE_LIFE;
  audio.knife();
  hx = p.x + p.face * 10;
  hy = p.y - 8;
  hw = 30;
  hh = 16;
  box = {
    x: p.face > 0 ? hx : hx - hw,
    y: hy - hh * 0.5,
    w: hw,
    h: hh
  };
  burst(hx + p.face * 12, hy, 6, CYN, 80, 0.22);
  for (i = 0; i < G.crocs.length; i++) {
    c = G.crocs[i];
    if (c.dead) continue;
    if (aabb(box.x, box.y, box.w, box.h, c.x - c.w * 0.5, c.y - c.h * 0.5, c.w, c.h)) {
      if (crocMouth(G.clock, c.phase, c.period) > 0.55 &&
          Math.abs((p.x - c.x) * c.face) < 8 && p.y < c.y + 2) {
        continue;
      }
      c.dead = true;
      c.pop = 0.4;
      bumpCombo();
      addScore(SCORE.croc, c.x, c.y);
      audio.croc(G.combo);
      hitStop(0.07);
      shake(6);
      kick('slash');
      flash(MAG, 0.1);
      burst(c.x, c.y, 20, MAG, 150, 0.5);
      burst(c.x, c.y, 10, GOLD, 90, 0.4);
      ringAt(c.x, c.y, CYN);
    }
  }
}

function doAction() {
  if (G.mode !== 'play') return;
  if (G.player.deadT > 0 || G.lock > 0 || G.clearT > 0) return;
  G.actionBuf = BUFFER;
  if (G.scene === 0) tryLeap();
  else if (G.scene === 1) doKnife();
  else tryJump();
}

/* ---- update ---- */
function updateTitle(dt) {
  G.clock += dt;
  hangOnVine(G.player, G.vines[0], G.clock);
}

function hangOnVine(p, v, t) {
  var pose = vineHang(v, t);
  var omega = vineOmega(v, t);
  p.x = pose.x;
  p.y = pose.y + 16;
  p.face = Math.cos(pose.ang) * omega >= 0 ? 1 : -1;
}

function updateVine(dt) {
  var p = G.player;
  var i, v, pose, next, np, gy;
  G.ready = false;
  if (p.state === 'hang' && p.vine >= 0) {
    hangOnVine(p, G.vines[p.vine], G.clock);
    next = p.vine + 1;
    if (next < G.vines.length) {
      np = vineHang(G.vines[next], G.clock);
      if (inGrabRange(p.x, p.y - 14, np.x, np.y, GRAB_GLOW)) {
        G.vines[next].glow = Math.max(G.vines[next].glow, 0.55);
      }
      if (inGrabRange(p.x, p.y - 14, np.x, np.y, GRAB_R)) {
        G.ready = true;
        G.vines[next].glow = 1;
      }
    } else {
      pose = vineHang(G.vines[p.vine], G.clock);
      if (pose.ang > 0.1 && p.x > G.vines[p.vine].x + 8) G.ready = true;
    }
  } else if (p.state === 'leap') {
    p.vy += GRAV * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    for (i = 0; i < G.vines.length; i++) {
      if (i <= p.from) continue;
      pose = vineHang(G.vines[i], G.clock);
      if (inGrabRange(p.x, p.y - 14, pose.x, pose.y, GRAB_R)) {
        grabVine(i);
        return;
      }
    }
    gy = p.x >= BANK_X ? BANK_Y : PIT_Y;
    if (p.y >= gy && p.vy >= 0) {
      if (p.x >= BANK_X) {
        p.y = BANK_Y;
        p.state = 'walk';
        p.grounded = true;
        audio.land();
        burst(p.x, p.y, 10, GOLD, 80, 0.35);
        clearScene();
        return;
      }
      kill('失足');
      audio.miss();
    }
  }
  for (i = 0; i < G.vines.length; i++) {
    v = G.vines[i];
    v.glow *= Math.pow(0.08, dt);
    v.pulse = Math.max(0, v.pulse - dt * 2.4);
  }
}

function updateSwim(dt) {
  var p = G.player;
  var ax, ay, submerged, i, c, mouth, snx, sny, box, wet;
  ax = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
  ay = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
  p.vx += ax * 980 * dt;
  p.vy += ay * 900 * dt;
  p.vy += 28 * dt;
  p.vx *= Math.pow(0.08, dt);
  p.vy *= Math.pow(0.1, dt);
  if (G.rush) p.vx -= 18 * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  if (ax) p.face = ax > 0 ? 1 : -1;
  p.x = clamp(p.x, 24, G.worldW - 20);
  p.y = clamp(p.y, WATER_Y - 2, 328);
  wet = p.y > WATER_Y + 6;
  if (wet !== G.wet) {
    splashAt(p.x, WATER_Y + 2, 12);
    G.wet = wet;
  }
  submerged = p.y > WATER_Y + 10;
  G.air = airTick(G.air, submerged, dt, G.airMax, 2.65);
  if (G.air <= 0) {
    G.air = 0;
    kill('气尽');
    return;
  }
  if (G.air < G.airMax * 0.28) {
    G.warnT -= dt;
    if (G.warnT <= 0) {
      audio.warn();
      G.warnT = 0.48;
    }
  }
  if (Math.random() < dt * (submerged ? 9 : 2)) {
    particles.push({
      x: p.x + rand(-4, 4),
      y: p.y - 6,
      vx: rand(-8, 8),
      vy: rand(-40, -18),
      t: 0.7,
      life: 0.7,
      r: rand(1.4, 2.6),
      rgb: CYN
    });
  }
  box = playerBox(p, false);
  for (i = 0; i < G.crocs.length; i++) {
    c = G.crocs[i];
    if (c.dead) {
      c.pop -= dt;
      c.y += 40 * dt;
      continue;
    }
    c.x += c.vx * dt;
    if (c.x < c.lo) { c.x = c.lo; c.vx = Math.abs(c.vx); }
    if (c.x > c.hi) { c.x = c.hi; c.vx = -Math.abs(c.vx); }
    c.face = c.vx >= 0 ? 1 : -1;
    c.y += Math.sin(G.clock * 1.4 + c.phase) * 8 * dt;
    mouth = crocMouth(G.clock, c.phase, c.period);
    snx = c.x + c.face * 22;
    sny = c.y;
    if (p.inv <= 0 && p.slash <= 0) {
      if (mouth > 0.55 && dist(p.x, p.y - 8, snx, sny) < 18) {
        kill('鳄口');
        return;
      }
      if (aabb(box.x, box.y, box.w, box.h, c.x - c.w * 0.42, c.y - c.h * 0.4, c.w * 0.84, c.h * 0.8)) {
        kill('触鳄');
        return;
      }
    }
  }
  if (p.x > G.worldW - 90 && p.y <= WATER_Y + 16) {
    splashAt(p.x, WATER_Y, 14);
    clearScene();
  }
}

function spawnBoulder() {
  var roll, r, kind, x, spd;
  roll = Math.random();
  if (roll < 0.42) { kind = 0; r = 9; }
  else if (roll < 0.78) { kind = 1; r = 14; }
  else { kind = 2; r = 20; }
  x = Math.min(G.worldW - 30, Math.max(G.player.x + 340, G.camX + 520));
  if (x > G.worldW - 80) return;
  spd = (74 + rand(0, 50) + (G.rush ? 28 : 0)) * (1 + (G.round - 1) * 0.1);
  G.boulders.push({
    x: x,
    y: hillY(x) - 70 - rand(0, 40),
    vx: -spd,
    vy: rand(-30, 40),
    r: r,
    kind: kind,
    spin: rand(0, TAU),
    jumped: false,
    ducked: false
  });
}

function updateHill(dt) {
  var p = G.player;
  var ax, gy, i, b, box, bounce, over, under;
  var interval = (G.rush ? 0.62 : 0.92) / (1 + (G.round - 1) * 0.1);
  G.spawnCd -= dt;
  if (G.spawnCd <= 0 && G.boulders.length < (G.rush ? 7 : 5)) {
    spawnBoulder();
    G.spawnCd = interval;
  }
  ax = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
  p.duck = !!(keys.d && p.grounded && p.state !== 'jump');
  if (p.duck && !p.wasDuck) audio.duck();
  p.wasDuck = p.duck;
  if (ax) p.face = ax > 0 ? 1 : -1;
  if (p.grounded) {
    p.vx = ax * (p.duck ? 58 : 138);
    p.walk += Math.abs(p.vx) * dt * 0.12;
  } else {
    p.vx += ax * 240 * dt;
    p.vx *= Math.pow(0.25, dt);
  }
  p.x += p.vx * dt;
  p.x = clamp(p.x, 18, G.worldW - 16);
  gy = hillY(p.x);
  if (!p.grounded) {
    p.vy += GRAV * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    p.y += p.vy * dt;
    if (p.y >= gy && p.vy >= 0) {
      p.y = gy;
      p.grounded = true;
      p.state = p.duck ? 'duck' : 'walk';
      p.squash = 0.78;
      audio.land();
    }
  } else {
    p.y = gy;
    p.coyote = COYOTE;
    if (G.actionBuf > 0 && !p.duck) tryJump();
  }
  if (p.grounded && p.coyote > 0) p.coyote -= dt;
  if (!p.grounded) p.coyote = 0;
  box = playerBox(p, p.duck);
  for (i = G.boulders.length - 1; i >= 0; i--) {
    b = G.boulders[i];
    b.vy += 980 * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.spin += dt * 5 * (b.vx < 0 ? -1 : 1);
    bounce = hillY(b.x) - b.r;
    if (b.y > bounce) {
      b.y = bounce;
      b.vy = -Math.abs(b.vy) * 0.84;
      if (Math.abs(b.vy) < 40) b.vy = -40 - b.kind * 18;
    }
    if (b.x < G.camX - 40 || b.x > G.worldW + 20) {
      G.boulders.splice(i, 1);
      continue;
    }
    over = !p.grounded && Math.abs(p.x - b.x) < b.r + 12 && (p.y - PH) < b.y - 2 && p.y < b.y + b.r + 8;
    if (over && !b.jumped) {
      b.jumped = true;
      bumpCombo();
      addScore(SCORE.rockJump, p.x, p.y);
      audio.rock(G.combo);
      hitStop(0.045);
      kick('hop');
      burst(b.x, b.y, 10, GOLD, 90, 0.35);
      ringAt(b.x, b.y, LEAF);
    }
    under = p.duck && b.y + b.r < box.y + 2 && Math.abs(p.x - b.x) < b.r + 14;
    if (under && !b.ducked && b.kind >= 1) {
      b.ducked = true;
      bumpCombo();
      addScore(SCORE.rockDuck, p.x, p.y);
      audio.rock(G.combo);
      hitStop(0.04);
      burst(b.x, box.y - 4, 8, CYN, 70, 0.3);
    }
    if (p.inv <= 0 && dist(p.x, p.y - (p.duck ? 8 : 12), b.x, b.y) < b.r + 7) {
      if (!(over && p.y < b.y)) {
        kill('砸中');
        return;
      }
    }
  }
  if (p.x > G.worldW - 70) clearScene();
}

function nativeHitbox(n, t) {
  var up = spearUp(t, n.freq, n.offset);
  var body = { x: n.x - 11, y: 300 - 26, w: 22, h: 26, up: up };
  return body;
}

function updateCamp(dt) {
  var p = G.player;
  var ax, gy, i, n, box, up, sx, sy, over;
  gy = 300;
  ax = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
  p.duck = !!(keys.d && p.grounded);
  if (ax) p.face = ax > 0 ? 1 : -1;
  if (p.grounded) {
    p.vx = ax * (p.duck ? 52 : 128);
    p.walk += Math.abs(p.vx) * dt * 0.12;
  } else {
    p.vx += ax * 220 * dt;
    p.vx *= Math.pow(0.28, dt);
  }
  p.x += p.vx * dt;
  p.x = clamp(p.x, 18, G.worldW - 18);
  if (!p.grounded) {
    p.vy += GRAV * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    p.y += p.vy * dt;
    if (p.y >= gy && p.vy >= 0) {
      p.y = gy;
      p.grounded = true;
      p.state = 'walk';
      p.squash = 0.8;
      audio.land();
    }
  } else {
    p.y = gy;
    p.coyote = COYOTE;
    if (G.actionBuf > 0 && !p.duck) tryJump();
  }
  box = playerBox(p, p.duck);
  for (i = 0; i < G.natives.length; i++) {
    n = G.natives[i];
    n.face = p.x < n.x ? -1 : 1;
    up = spearUp(G.clock, n.freq, n.offset);
    over = !p.grounded && Math.abs(p.x - n.x) < 20 && p.y < 300 - 20;
    if (over && !n.jumped && !up) {
      n.jumped = true;
      bumpCombo();
      addScore(SCORE.native, p.x, p.y);
      audio.native(G.combo);
      hitStop(0.055);
      kick('hop');
      burst(n.x, 270, 14, GOLD, 110, 0.4);
      ringAt(n.x, 260, MAG);
    }
    if (p.inv > 0) continue;
    if (aabb(box.x, box.y, box.w, box.h, n.x - 11, 300 - 26, 22, 26)) {
      if (!(over && p.y < 286)) {
        kill('撞守卫');
        return;
      }
    }
    if (up) {
      sx = n.x + n.face * 10;
      sy = 300 - 62;
      if (aabb(box.x, box.y, box.w, box.h, sx - 5, sy, 10, 40)) {
        kill('中矛');
        return;
      }
    }
  }
  if (p.grounded && aabb(box.x, box.y, box.w, box.h, G.pot.x - 16, G.pot.y - 10, 32, 18)) {
    kill('落锅');
    return;
  }
  if (p.x > G.woman.x - 18 && p.grounded) {
    G.woman.saved = true;
    burst(G.woman.x, G.woman.y, 24, PNK, 120, 0.7);
    burst(G.woman.x, G.woman.y, 12, GOLD, 90, 0.5);
    ringAt(G.woman.x, G.woman.y, GOLD);
    clearScene();
  }
}

function updateFx(dt) {
  var i, q;
  G.flash = Math.max(0, G.flash - dt);
  G.shake *= Math.pow(0.04, dt);
  if (G.shake < 0.2) G.shake = 0;
  G.kickX = (Math.random() - 0.5) * G.shake * 1.4;
  G.kickY = (Math.random() - 0.5) * G.shake * 1.1;
  if (G.player.squash < 1) G.player.squash = Math.min(1, G.player.squash + dt * 3.2);
  if (G.player.squash > 1) G.player.squash = Math.max(1, G.player.squash - dt * 4);
  for (i = particles.length - 1; i >= 0; i--) {
    q = particles[i];
    q.t -= dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.vy += 220 * dt;
    if (q.t <= 0) particles.splice(i, 1);
  }
  for (i = floats.length - 1; i >= 0; i--) {
    q = floats[i];
    q.t -= dt;
    q.y -= 28 * dt;
    if (q.t <= 0) floats.splice(i, 1);
  }
  for (i = rings.length - 1; i >= 0; i--) {
    q = rings[i];
    q.t -= dt;
    q.r += 90 * dt;
    if (q.t <= 0) rings.splice(i, 1);
  }
  for (i = splashes.length - 1; i >= 0; i--) {
    q = splashes[i];
    q.t -= dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.vy += 760 * dt;
    if (q.t <= 0) splashes.splice(i, 1);
  }
}

function update(dt) {
  var p = G.player;
  if (G.mode === 'title') {
    updateTitle(dt);
    updateFx(dt);
    return;
  }
  if (G.mode !== 'play') {
    G.clock += dt * 0.35;
    updateFx(dt);
    return;
  }

  if (p.inv > 0) p.inv -= dt;
  if (p.slash > 0) p.slash -= dt;
  if (G.knifeT > 0) G.knifeT -= dt;
  if (G.actionBuf > 0) G.actionBuf -= dt;
  if (G.combo > 0) {
    G.comboAge -= dt;
    if (G.comboAge <= 0) comboReset();
  }
  p.blink += dt;

  if (p.deadT > 0) {
    p.deadT -= dt;
    p.vy += 900 * dt;
    p.y += p.vy * dt;
    p.x += p.vx * 0.4 * dt;
    updateFx(dt);
    if (p.deadT <= 0) {
      if (G.lives <= 0) {
        showOver();
      } else {
        setupScene(G.scene, true);
        toast('再起', '');
      }
    }
    return;
  }

  if (G.clearT > 0) {
    G.clearT -= dt;
    G.lock = Math.max(0, G.lock - dt);
    G.clock += dt;
    updateFx(dt);
    if (G.clearT <= 0) nextAfterClear();
    return;
  }

  G.clock += dt;
  G.time -= dt;
  if (G.time <= 0) {
    G.time = 0;
    kill('时尽');
    return;
  }
  if (G.time < 8) {
    G.warnT -= dt;
    if (G.warnT <= 0 && G.scene !== 1) {
      audio.warn();
      G.warnT = 0.7;
    }
  }

  if (G.scene === 0) updateVine(dt);
  else if (G.scene === 1) updateSwim(dt);
  else if (G.scene === 2) updateHill(dt);
  else updateCamp(dt);

  G.camX += (clamp(G.player.x - 210, 0, Math.max(0, G.worldW - VW)) - G.camX) * (1 - Math.pow(0.0008, dt));
  updateFx(dt);
  syncBars();
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
  var s = Math.min(avW / VW, avH / VH);
  L.s = s;
  L.x = (avW - VW * s) / 2;
  L.y = Math.max(4, (avH - VH * s) / 2);
}

function beginWorld() {
  ctx.save();
  ctx.beginPath();
  ctx.rect(L.x, L.y, VW * L.s, VH * L.s);
  ctx.clip();
  ctx.translate(L.x + G.kickX * L.s - G.camX * L.s, L.y + G.kickY * L.s);
  ctx.scale(L.s, L.s);
}

function fillCanopy() {
  var i, x;
  ctx.fillStyle = '#07140c';
  ctx.fillRect(G.camX - 20, 0, VW + 40, 52);
  ctx.fillStyle = 'rgba(157,255,58,0.08)';
  for (i = 0; i < 18; i++) {
    x = ((i * 97 + G.camX * 0.2) % (VW + 80)) + G.camX - 40;
    ctx.beginPath();
    ctx.ellipse(x, 18 + (i % 3) * 6, 28, 16, 0, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(157,255,58,0.22)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(G.camX - 10, 50);
  ctx.lineTo(G.camX + VW + 10, 50);
  ctx.stroke();
}

function drawBgVine() {
  var g, i, x;
  g = ctx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, '#08160c');
  g.addColorStop(0.55, '#05080c');
  g.addColorStop(1, '#12080c');
  ctx.fillStyle = g;
  ctx.fillRect(G.camX - 30, -10, VW + 60, VH + 20);
  ctx.fillStyle = 'rgba(157,255,58,0.045)';
  for (i = 0; i < 10; i++) {
    x = i * 140 - (G.camX * 0.25) % 140;
    ctx.beginPath();
    ctx.moveTo(x + 40, 40);
    ctx.lineTo(x + 10, VH);
    ctx.lineTo(x + 80, VH);
    ctx.closePath();
    ctx.fill();
  }
  fillCanopy();
  ctx.fillStyle = '#0a1810';
  ctx.fillRect(G.camX - 20, PIT_Y - 8, VW + 40, 30);
  ctx.fillStyle = 'rgba(255,61,184,0.12)';
  ctx.fillRect(G.camX - 20, PIT_Y - 8, VW + 40, 4);
  ctx.fillStyle = '#0c2414';
  ctx.fillRect(BANK_X, BANK_Y, G.worldW - BANK_X + 40, VH - BANK_Y);
  ctx.fillStyle = rgba(LEAF, 0.35);
  ctx.fillRect(BANK_X, BANK_Y, G.worldW - BANK_X + 40, 5);
}

function drawVines() {
  var i, v, pose, px, py;
  for (i = 0; i < G.vines.length; i++) {
    v = G.vines[i];
    pose = vineHang(v, G.clock);
    ctx.strokeStyle = v.glow > 0.2 ? rgba(GOLD, 0.55 + v.glow * 0.4) : rgba(LEAF, 0.75);
    ctx.lineWidth = 3.2 + v.pulse * 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(v.x, 42);
    ctx.quadraticCurveTo(lerp(v.x, pose.x, 0.5) + Math.sin(G.clock + i) * 6, lerp(42, pose.y, 0.45), pose.x, pose.y);
    ctx.stroke();
    ctx.strokeStyle = rgba(LEAF2, 0.45);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = v.glow > 0.25 ? rgba(GOLD, 0.95) : rgba(LEAF, 0.9);
    ctx.beginPath();
    ctx.arc(pose.x, pose.y, 4.2 + v.pulse * 3, 0, TAU);
    ctx.fill();
    if (G.ready && G.player.vine + 1 === i) {
      ctx.strokeStyle = rgba(GOLD, 0.55 + Math.sin(G.clock * 14) * 0.25);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pose.x, pose.y, GRAB_R * 0.55, 0, TAU);
      ctx.stroke();
    }
  }
  px = G.player.x;
  py = G.player.y;
  if (G.player.state === 'hang' && G.ready) {
    ctx.fillStyle = rgba(GOLD, 0.12 + Math.sin(G.clock * 12) * 0.06);
    ctx.beginPath();
    ctx.arc(px, py - 10, 26, 0, TAU);
    ctx.fill();
  }
}

function drawBgSwim() {
  var g, i, x, y;
  g = ctx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, '#071018');
  g.addColorStop(0.28, '#042030');
  g.addColorStop(1, '#021018');
  ctx.fillStyle = g;
  ctx.fillRect(G.camX - 30, -10, VW + 60, VH + 20);
  ctx.fillStyle = '#0a1c14';
  ctx.fillRect(G.camX - 20, 0, VW + 40, WATER_Y);
  ctx.fillStyle = rgba(CYN, 0.18);
  ctx.fillRect(G.camX - 20, WATER_Y - 3, VW + 40, 6);
  ctx.strokeStyle = rgba(CYN, 0.35);
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (i = 0; i <= 24; i++) {
    x = G.camX - 20 + i * (VW + 40) / 24;
    y = WATER_Y + Math.sin(G.clock * 2.4 + x * 0.04) * 3.2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = '#7af6ff';
  ctx.lineWidth = 1;
  for (i = 0; i < 8; i++) {
    ctx.beginPath();
    y = 130 + i * 26;
    ctx.moveTo(G.camX - 10, y);
    ctx.bezierCurveTo(G.camX + 160, y + Math.sin(G.clock + i) * 10, G.camX + 360, y - 8, G.camX + VW + 20, y);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#07140e';
  ctx.fillRect(G.worldW - 100, WATER_Y - 8, 140, VH);
  ctx.fillStyle = rgba(LEAF, 0.4);
  ctx.fillRect(G.worldW - 100, WATER_Y - 8, 140, 5);
}

function drawCroc(c) {
  var mouth, jaw, dir, i;
  if (c.dead && c.pop <= 0) return;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(c.face, 1);
  if (c.dead) ctx.globalAlpha = Math.max(0, c.pop * 2.2);
  mouth = c.dead ? 0 : crocMouth(G.clock, c.phase, c.period);
  ctx.fillStyle = rgba(LEAF, 0.85);
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 8, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(MAG, 0.55);
  ctx.beginPath();
  ctx.ellipse(-8, 1, 10, 6, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba(LEAF2, 0.8);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-20, 0);
  ctx.quadraticCurveTo(-30, Math.sin(G.clock * 6 + c.phase) * 5, -36, 0);
  ctx.stroke();
  jaw = 5 + mouth * 9;
  ctx.fillStyle = rgba(MAG, 0.9);
  ctx.beginPath();
  ctx.moveTo(14, -2);
  ctx.lineTo(28, -jaw);
  ctx.lineTo(28, jaw);
  ctx.lineTo(14, 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = GOLD[0] ? rgba(GOLD, 0.9) : '#ffe36b';
  for (i = 0; i < 4; i++) {
    ctx.fillRect(16 + i * 3, -jaw + 1, 2, 3);
    ctx.fillRect(16 + i * 3, jaw - 4, 2, 3);
  }
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(8, -4, 2.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(8.6, -4, 1.1, 0, TAU);
  ctx.fill();
  ctx.restore();
  dir = c.face;
  if (mouth > 0.55 && !c.dead) {
    ctx.strokeStyle = rgba(MAG, 0.55);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x + dir * 24, c.y, 12, 0, TAU);
    ctx.stroke();
  }
}

function drawBgHill() {
  var g, i, x, y0, y1;
  g = ctx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, '#140a12');
  g.addColorStop(0.45, '#0a120c');
  g.addColorStop(1, '#08140c');
  ctx.fillStyle = g;
  ctx.fillRect(G.camX - 30, -10, VW + 60, VH + 20);
  ctx.fillStyle = 'rgba(255,61,184,0.08)';
  ctx.beginPath();
  ctx.arc(G.camX + 520, 40, 80, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(G.camX - 20, VH);
  for (i = 0; i <= 20; i++) {
    x = (G.worldW) * i / 20;
    ctx.lineTo(x, hillY(x));
  }
  ctx.lineTo(G.worldW + 40, VH);
  ctx.closePath();
  ctx.fillStyle = '#0c1c10';
  ctx.fill();
  ctx.strokeStyle = rgba(LEAF, 0.55);
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (i = 0; i <= 24; i++) {
    x = (G.worldW) * i / 24;
    y0 = hillY(x);
    if (i === 0) ctx.moveTo(x, y0);
    else ctx.lineTo(x, y0);
  }
  ctx.stroke();
  ctx.strokeStyle = rgba(GOLD, 0.18);
  ctx.lineWidth = 1.4;
  for (i = 0; i < 16; i++) {
    x = i * 100;
    y0 = hillY(x);
    y1 = y0 + 18;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x - 8, y1);
    ctx.stroke();
  }
}

function drawBoulder(b) {
  var rgb = b.kind === 2 ? HOT : b.kind === 1 ? GOLD : LEAF2;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.spin);
  ctx.fillStyle = rgba(rgb, 0.92);
  ctx.beginPath();
  ctx.arc(0, 0, b.r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba(WHT, 0.35);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, b.r * 0.65, 0.2, 2.2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.arc(-b.r * 0.25, -b.r * 0.2, b.r * 0.28, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawBgCamp() {
  var g, i;
  g = ctx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, '#120810');
  g.addColorStop(0.5, '#0a100c');
  g.addColorStop(1, '#0c140c');
  ctx.fillStyle = g;
  ctx.fillRect(-20, -10, VW + 40, VH + 20);
  ctx.fillStyle = 'rgba(255,106,40,0.1)';
  ctx.beginPath();
  ctx.arc(G.pot.x, 210, 70, 0, TAU);
  ctx.fill();
  fillCanopy();
  ctx.fillStyle = '#0c1c12';
  ctx.fillRect(-20, 300, VW + 40, 70);
  ctx.fillStyle = rgba(LEAF, 0.4);
  ctx.fillRect(-20, 300, VW + 40, 4);
  for (i = 0; i < 6; i++) {
    ctx.fillStyle = rgba(LEAF, 0.15);
    ctx.fillRect(40 + i * 110, 40, 8, 90);
    ctx.strokeStyle = rgba(MAG, 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40 + i * 110, 40);
    ctx.lineTo(52 + i * 110, 28);
    ctx.lineTo(64 + i * 110, 40);
    ctx.stroke();
  }
}

function drawPot() {
  var p = G.pot;
  var i;
  ctx.fillStyle = '#2a1018';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 8, 22, 10, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(HOT, 0.95);
  ctx.beginPath();
  ctx.ellipse(p.x, p.y - 2, 18, 8, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(GOLD, 0.7);
  ctx.beginPath();
  ctx.ellipse(p.x, p.y - 4, 12, 4, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba(MAG, 0.7);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x - 20, p.y, 8, 0.2, 2.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(p.x + 20, p.y, 8, 0.8, 3);
  ctx.stroke();
  for (i = 0; i < 5; i++) {
    ctx.fillStyle = rgba(HOT, 0.5);
    ctx.beginPath();
    ctx.arc(p.x + Math.sin(G.clock * 3 + i) * 8, p.y - 10 - (G.clock * 30 + i * 12) % 22, 2.2, 0, TAU);
    ctx.fill();
  }
}

function drawNative(n) {
  var up = spearUp(G.clock, n.freq, n.offset);
  var bob = Math.sin(G.clock * n.freq + n.offset) * 3;
  var spearH = up ? 62 : 28;
  ctx.save();
  ctx.translate(n.x, 300);
  ctx.fillStyle = rgba(MAG, 0.9);
  ctx.fillRect(-8, -26 + bob, 16, 20);
  ctx.beginPath();
  ctx.arc(0, -30 + bob, 7, 0, TAU);
  ctx.fill();
  ctx.fillStyle = GOLD[0] ? rgba(GOLD, 0.9) : '#ffe';
  ctx.fillRect(-10, -12 + bob, 8, 12);
  ctx.fillRect(2, -12 + bob, 8, 12);
  ctx.save();
  ctx.translate(n.face * 8, -20 + bob);
  ctx.strokeStyle = rgba(GOLD, 0.95);
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(0, -spearH + 20);
  ctx.stroke();
  ctx.fillStyle = rgba(CYN, 0.9);
  ctx.beginPath();
  ctx.moveTo(-5, -spearH + 22);
  ctx.lineTo(0, -spearH + 10);
  ctx.lineTo(5, -spearH + 22);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

function drawWoman() {
  var w = G.woman;
  var swing = Math.sin(G.clock * 2.2) * 5;
  ctx.strokeStyle = rgba(GOLD, 0.7);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(w.x, 48);
  ctx.lineTo(w.x + swing, w.y - 10);
  ctx.stroke();
  ctx.save();
  ctx.translate(w.x + swing, w.y);
  ctx.fillStyle = rgba(PNK, 0.95);
  ctx.beginPath();
  ctx.arc(0, -8, 6.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(GOLD, 0.9);
  ctx.fillRect(-6, -2, 12, 16);
  ctx.restore();
  if (G.woman.saved) {
    ctx.fillStyle = rgba(GOLD, 0.8);
    ctx.font = '12px sans-serif';
    ctx.fillText('♥', w.x - 4, w.y - 22);
  }
}

function drawPlayer() {
  var p = G.player;
  var duck = p.duck;
  var h = (duck ? 14 : PH) * p.squash;
  var blink = p.inv > 0 && ((p.blink * 16) | 0) % 2 === 0;
  var arm;
  if (blink) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.face, 1);
  if (p.deadT > 0) ctx.rotate(p.deadT * 8);
  if (p.state === 'swim' || G.scene === 1) ctx.rotate(p.vy * 0.0012);
  ctx.fillStyle = rgba(CYN, 0.95);
  ctx.beginPath();
  ctx.ellipse(0, -h + 8, 6.2, duck ? 5 : 7, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(GOLD, 0.95);
  ctx.fillRect(-6.5, -h + 5, 13, 2.2);
  ctx.fillStyle = rgba(LEAF, 0.95);
  ctx.fillRect(-5, -h + 14, 10, duck ? 6 : 10);
  ctx.fillStyle = rgba(MAG, 0.9);
  ctx.fillRect(-5, -8, 10, 5);
  if (!duck) {
    ctx.fillStyle = rgba(CYN, 0.85);
    ctx.fillRect(-6, -4, 5, 8);
    ctx.fillRect(1, -4, 5, 8);
  }
  if (p.state === 'hang') {
    ctx.strokeStyle = rgba(GOLD, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -h + 14);
    ctx.lineTo(0, -h - 8);
    ctx.stroke();
  }
  if (p.slash > 0) {
    arm = 1 - p.slash / KNIFE_LIFE;
    ctx.strokeStyle = rgba(CYN, 0.95);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(8, -10, 16, -0.8 + arm, 0.9 + arm * 0.4);
    ctx.stroke();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.moveTo(18, -16);
    ctx.lineTo(30, -10);
    ctx.lineTo(18, -6);
    ctx.closePath();
    ctx.fill();
  } else if (G.scene === 1) {
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.fillRect(6, -12, 10, 2.4);
  }
  ctx.restore();
}

function drawMotes() {
  var i, m, a;
  for (i = 0; i < motes.length; i++) {
    m = motes[i];
    a = 0.25 + Math.sin(G.clock * 2 + m.ph) * 0.2;
    ctx.fillStyle = rgba(m.rgb, a);
    ctx.beginPath();
    ctx.arc(m.x, m.y + Math.sin(G.clock * 0.7 + m.ph) * 8, m.s, 0, TAU);
    ctx.fill();
  }
}

function drawFx() {
  var i, q, a;
  for (i = 0; i < particles.length; i++) {
    q = particles[i];
    a = q.t / q.life;
    ctx.fillStyle = rgba(q.rgb, clamp(a, 0, 1));
    ctx.beginPath();
    ctx.arc(q.x, q.y, q.r * a, 0, TAU);
    ctx.fill();
  }
  for (i = 0; i < rings.length; i++) {
    q = rings[i];
    a = q.t / 0.34;
    ctx.strokeStyle = rgba(q.rgb, a);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(q.x, q.y, q.r, 0, TAU);
    ctx.stroke();
  }
  for (i = 0; i < splashes.length; i++) {
    q = splashes[i];
    ctx.fillStyle = rgba(CYN, clamp(q.t * 2, 0, 0.8));
    ctx.beginPath();
    ctx.arc(q.x, q.y, 2.2, 0, TAU);
    ctx.fill();
  }
  ctx.font = 'bold 11px "Segoe UI","Noto Sans SC",sans-serif';
  ctx.textAlign = 'center';
  for (i = 0; i < floats.length; i++) {
    q = floats[i];
    ctx.fillStyle = rgba(q.rgb, clamp(q.t * 2, 0, 1));
    ctx.fillText(q.text, q.x, q.y);
  }
  ctx.textAlign = 'left';
}

function drawReadyHint() {
  if (G.mode !== 'play' || G.scene !== 0 || !G.ready || G.player.state !== 'hang') return;
  ctx.fillStyle = rgba(GOLD, 0.85);
  ctx.font = 'bold 12px "Segoe UI","Noto Sans SC",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('抓！', G.player.x, G.player.y - 36);
  ctx.textAlign = 'left';
}

function draw() {
  var g, i;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#03010a';
  ctx.fillRect(0, 0, cssW, cssH);

  beginWorld();
  if (G.scene === 1 && G.mode === 'play') drawBgSwim();
  else if (G.scene === 2 && G.mode === 'play') drawBgHill();
  else if (G.scene === 3 && G.mode === 'play') drawBgCamp();
  else drawBgVine();

  drawMotes();

  if (G.scene === 0 || G.mode === 'title' || (G.mode !== 'play' && G.scene === 0)) {
    drawVines();
  }
  if (G.scene === 1 && G.mode === 'play') {
    for (i = 0; i < G.crocs.length; i++) drawCroc(G.crocs[i]);
  }
  if (G.scene === 2 && G.mode === 'play') {
    for (i = 0; i < G.boulders.length; i++) drawBoulder(G.boulders[i]);
  }
  if (G.scene === 3 && G.mode === 'play') {
    drawPot();
    drawWoman();
    for (i = 0; i < G.natives.length; i++) drawNative(G.natives[i]);
  }

  drawPlayer();
  drawReadyHint();
  drawFx();

  if (G.flash > 0) {
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(G.camX - 40, -20, VW + 80, VH + 40);
  }
  ctx.restore();

  /* letterbox */
  ctx.fillStyle = '#03010a';
  ctx.fillRect(0, 0, cssW, L.y);
  ctx.fillRect(0, L.y + VH * L.s, cssW, cssH);
  ctx.fillRect(0, 0, L.x, cssH);
  ctx.fillRect(L.x + VW * L.s, 0, cssW, cssH);

  if (G.mode === 'play' && G.scene === 0 && G.player.state === 'hang') {
    /* glow edge when ready */
    if (G.ready) {
      g = ctx.createLinearGradient(L.x, L.y, L.x, L.y + 12);
      g.addColorStop(0, rgba(GOLD, 0.35));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(L.x, L.y, VW * L.s, 16);
    }
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
  if (G.stop > 0 && !reduceMotion()) {
    G.stop -= dt;
    updateFx(dt);
    draw();
    return;
  }
  acc += dt;
  if (acc > STEP * 5) acc = STEP * 5;
  while (acc >= STEP) {
    update(STEP);
    acc -= STEP;
  }
  draw();
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
  keys.act = v;
  if (v) doAction();
});

function keyOn(e, down) {
  var k = e.code;
  if (k === 'ArrowLeft' || k === 'KeyA') { keys.l = down; e.preventDefault(); }
  else if (k === 'ArrowRight' || k === 'KeyD') { keys.r = down; e.preventDefault(); }
  else if (k === 'ArrowDown' || k === 'KeyS') { keys.d = down; e.preventDefault(); }
  else if (k === 'ArrowUp' || k === 'KeyW') {
    keys.u = down;
    if (down && G.scene !== 1) doAction();
    e.preventDefault();
  } else if (k === 'Space') {
    if (down) doAction();
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
      startRun('rescue');
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
btnRescue.addEventListener('click', function () {
  audio.ensure();
  startRun('rescue');
});
btnRush.addEventListener('click', function () {
  audio.ensure();
  startRun('rush');
});
ovRetry.addEventListener('click', function () {
  audio.ensure();
  startRun(G.kind);
});

canvas.addEventListener('pointerdown', function (e) {
  audio.ensure();
  canvas.focus({ preventScroll: true });
  if (G.mode === 'title') return;
  if (G.mode === 'over') return;
  if (e.pointerType === 'touch' && coarseQ.matches) return;
  doAction();
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

loadBest();
bestEl.textContent = String(G.bestC);
renderPips();
showTitle();
resize();
hudPlay();
modeLabel.textContent = '营救';
requestAnimationFrame(frame);

}
