'use strict';

/* 猪羊 — Pooyan-lite. No CDN. */

var WORLD_W = 400;
var WORLD_H = 540;
var LIVES = 3;
var ROPE_X = 62;
var LADDER_X = 108;
var GROUND_Y = 508;
var HOUSE_Y = 22;
var HOUSE_H = 72;
var HOUSE_MAX = 7;
var Y_MIN = 112;
var Y_MAX = 478;
var ELEV_SPD = 210;
var ARROW_V = 480;
var ARROW_MAX = 2;
var LETHAL_FALL = 96;
var COMBO_WIN = 1.42;
var INVULN = 1.45;
var DIE_T = 0.78;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var BEST_KEY = 'playbox-pooyan-best';
var MUTE_KEY = 'playbox-pooyan-mute';
var GUARD_STAGES = 5;
var OPS = '↑↓ / WS 升降 · 空格射箭 · F / Shift 丢饵 · 触屏拖绳点射 · R 重开 · M 静音';

var STAGE_NAMES = ['', '暮林', '气球升', '头狼', '夹击', '大王'];
var BALLOON_RGB = [
  [255, 45, 98],
  [255, 227, 107],
  [0, 240, 255],
  [255, 61, 184]
];
var BALLOON_SCORE = [100, 150, 200, 250];
var WOLF_RGB = [150, 148, 168];
var GOLD = [255, 227, 107];
var CYN = [0, 240, 255];
var MAG = [255, 61, 184];
var HOT = [255, 45, 98];
var WHT = [255, 244, 248];
var MEAT_RGB = [255, 110, 70];

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function rand(a, b) {
  return a + Math.random() * (b - a);
}
function hypot(x, y) {
  return Math.sqrt(x * x + y * y);
}
function rgba(rgb, a) {
  return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
}
function comboMult(combo) {
  return 1 + Math.min(4, Math.floor(Math.max(0, combo - 1) / 3));
}
function fallLethal(fallFrom, groundY) {
  return groundY - fallFrom >= LETHAL_FALL;
}
function balloonHit(ax, ay, bx, by, r) {
  var dx = ax - bx;
  var dy = ay - by;
  var rr = r + 4;
  return dx * dx + dy * dy <= rr * rr;
}
function houseFull(n) {
  return n >= HOUSE_MAX;
}
function basketHit(px, py, bx, by, r) {
  var left = px - 15;
  var right = px + 18;
  var top = py - 20;
  var bot = py + 11;
  var cx = clamp(bx, left, right);
  var cy = clamp(by, top, bot);
  var dx = bx - cx;
  var dy = by - cy;
  return dx * dx + dy * dy < r * r;
}
function stageDir(stage) {
  if (stage === 2 || stage === 4) return 'up';
  return 'down';
}
function stageCount(stage) {
  var n = [0, 8, 10, 10, 12, 8][stage];
  return n || 10;
}
function stageHasBoss(stage) {
  return stage === 3 || stage === 5;
}
function spawnInterval(stage, pack) {
  var base = pack ? 0.42 : 0.62;
  var t = base / (1 + Math.max(0, stage - 1) * (pack ? 0.16 : 0.11));
  var floor = pack ? 0.2 : 0.34;
  return t < floor ? floor : t;
}
function wolfSpeed(stage, pack) {
  return (pack ? 52 : 40) * (1 + Math.max(0, stage - 1) * 0.12);
}
function climbSpeed(stage, pack) {
  return (pack ? 58 : 44) * (1 + Math.max(0, stage - 1) * 0.08);
}
function bossHp(stage, pack) {
  if (pack) return 5 + Math.min(4, (stage / 4) | 0);
  return stage >= 5 ? 7 : 5;
}
function popScore(color, mult) {
  return ((BALLOON_SCORE[color] || 100) * mult) | 0;
}
function liveWolf(w) {
  return w && !w.dead && w.state !== 'dead' && w.state !== 'house';
}
function floatingWolf(w) {
  return liveWolf(w) && w.state === 'float';
}

function makePlayer() {
  return {
    y: 280,
    fireCd: 0,
    meatCd: 0,
    inv: 0,
    deadT: 0,
    squash: 1,
    muzzle: 0,
    bob: 0
  };
}

function makeWolf(x, y, dir, color, spd, boss) {
  var up = dir === 'up';
  return {
    x: x,
    y: y,
    vx: -spd * (boss ? 0.55 : rand(0.85, 1.15)),
    vy: up ? -spd * 0.55 : spd * 0.42,
    r: boss ? 22 : rand(10.2, 12.4),
    state: 'float',
    color: color,
    boss: !!boss,
    hp: boss ? 5 : 1,
    phase: rand(0, TAU),
    spin: 0,
    fallFrom: y,
    bob: rand(0, TAU),
    dead: false,
    dir: dir
  };
}

function makeArrow(x, y) {
  return { x: x, y: y, vx: ARROW_V, live: true };
}

function makeMeat(x, y) {
  return { x: x, y: y, vx: 118, vy: -92, live: true, t: 2.4 };
}

function selfCheck() {
  var p, w, a;

  if (LIVES !== 3) throw new Error('3 lives');
  if (HOUSE_MAX !== 7) throw new Error('house 7');
  if (GUARD_STAGES !== 5) throw new Error('5 stages');
  if (comboMult(1) !== 1) throw new Error('combo 1');
  if (comboMult(4) !== 2) throw new Error('combo 4');
  if (comboMult(7) !== 3) throw new Error('combo 7');
  if (comboMult(13) !== 5) throw new Error('combo cap');
  if (comboMult(99) !== 5) throw new Error('combo max 5');
  if (!fallLethal(GROUND_Y - 140, GROUND_Y)) throw new Error('high fall kills');
  if (fallLethal(GROUND_Y - 40, GROUND_Y)) throw new Error('low fall lands');
  if (!balloonHit(200, 200, 205, 198, 11)) throw new Error('balloon hit');
  if (balloonHit(200, 200, 240, 200, 11)) throw new Error('balloon miss');
  if (!houseFull(7) || houseFull(6)) throw new Error('house full');
  if (!basketHit(ROPE_X, 200, ROPE_X + 8, 196, 11)) throw new Error('basket hit');
  if (basketHit(ROPE_X, 200, 200, 200, 11)) throw new Error('basket miss');
  if (stageDir(1) !== 'down' || stageDir(2) !== 'up') throw new Error('stage dir');
  if (stageCount(1) !== 8 || stageCount(5) !== 8) throw new Error('stage count');
  if (!stageHasBoss(3) || !stageHasBoss(5) || stageHasBoss(1)) throw new Error('boss stages');
  if (spawnInterval(2, false) >= spawnInterval(1, false)) throw new Error('stage faster spawn');
  if (spawnInterval(1, true) >= spawnInterval(1, false)) throw new Error('pack denser');
  if (wolfSpeed(2, false) <= wolfSpeed(1, false)) throw new Error('stage faster wolves');
  if (bossHp(5, false) <= bossHp(3, false)) throw new Error('final boss tankier');
  if (popScore(0, 1) !== 100 || popScore(2, 2) !== 400) throw new Error('pop score');
  if (Y_MIN >= Y_MAX) throw new Error('elevator range');
  if (ROPE_X >= LADDER_X) throw new Error('rope left of ladder');
  if (LETHAL_FALL < 80) throw new Error('lethal window');

  p = makePlayer();
  if (p.y < Y_MIN || p.y > Y_MAX) throw new Error('player spawn');
  w = makeWolf(360, 120, 'down', 0, 40, false);
  if (w.state !== 'float' || w.vx >= 0) throw new Error('wolf drift left');
  w = makeWolf(360, 480, 'up', 1, 40, false);
  if (w.vy >= 0) throw new Error('up wolf rises');
  w = makeWolf(300, 160, 'down', 0, 30, true);
  if (!w.boss || w.r <= 16) throw new Error('boss size');
  a = makeArrow(80, 200);
  if (a.vx !== ARROW_V) throw new Error('arrow speed');
  if (makeMeat(80, 200).vy >= 0) throw new Error('meat lob');
  if (BALLOON_RGB.length !== 4) throw new Error('4 balloon colors');
  if (STAGE_NAMES.length !== 6) throw new Error('stage names');
  if (!liveWolf(w) || floatingWolf({ state: 'walk', dead: false })) throw new Error('wolf flags');
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
var ovAgain = document.getElementById('ov-again');
var ovMenu = document.getElementById('ov-menu');
var btnGuard = document.getElementById('btn-guard');
var btnPack = document.getElementById('btn-pack');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnUp = document.getElementById('btn-up');
var btnDown = document.getElementById('btn-down');
var btnFire = document.getElementById('btn-fire');
var btnMeat = document.getElementById('btn-meat');
var scoreEl = document.getElementById('score');
var stageNumEl = document.getElementById('stage');
var stageEm = document.getElementById('stage-em');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var tagLabel = document.getElementById('tag-label');
var houseBar = document.getElementById('house-bar');
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
var comboTok = 0;

var particles = [];
var sparks = [];
var floats = [];
var rings = [];
var stars = [];

var keys = { u: false, d: false, fire: false, meat: false };
var pointer = { down: false, y: 280, id: null };
var meatEdge = false;

var G = {
  mode: 'title',
  kind: 'guard',
  pack: false,
  t: 0,
  clock: 0,
  stage: 1,
  wave: 1,
  lives: LIVES,
  score: 0,
  bestG: 0,
  bestP: 0,
  combo: 0,
  comboT: 0,
  maxCombo: 0,
  house: 0,
  wolves: [],
  arrows: [],
  meats: [],
  player: makePlayer(),
  spawnLeft: 0,
  spawnCd: 0,
  dir: 'down',
  phase: 'wolves',
  bossSoon: false,
  ready: 0,
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flash: 0,
  flashRgb: HOT,
  next1up: 10000,
  lock: 0,
  why: '',
  kills: 0
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
    o.frequency.setValueAtTime(Math.max(40, freq), t);
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
  shoot: function () {
    this.ensure();
    this.beep(920, 0.055, 'square', 0.038, 1640);
    this.noise(0.03, 0.03, 2200, 'highpass');
  },
  pop: function (combo, boss) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.07;
    if (boss) {
      this.noise(0.1, 0.1, 280, 'lowpass');
      this.beep(220 * p, 0.12, 'sawtooth', 0.06, 90);
      this.beep(640 * p, 0.1, 'square', 0.045, 220);
      return;
    }
    this.beep(480 * p, 0.07, 'square', 0.07, 820 * p);
    this.beep(720 * p, 0.1, 'triangle', 0.045, 1080 * p);
    this.noise(0.055, 0.055, 1900, 'highpass');
  },
  splat: function () {
    this.ensure();
    this.noise(0.12, 0.1, 240, 'lowpass');
    this.beep(160, 0.1, 'sine', 0.04, 70);
  },
  meat: function () {
    this.ensure();
    this.beep(260, 0.08, 'triangle', 0.05, 140);
    this.beep(520, 0.1, 'square', 0.035, 280);
    this.noise(0.06, 0.05, 700, 'bandpass');
  },
  climb: function () {
    this.ensure();
    this.beep(180, 0.04, 'square', 0.02, 240);
  },
  house: function () {
    this.ensure();
    this.beep(140, 0.1, 'sawtooth', 0.05, 70);
    this.noise(0.08, 0.06, 180, 'lowpass');
  },
  die: function () {
    this.ensure();
    this.noise(0.18, 0.12, 260, 'lowpass');
    this.beep(320, 0.24, 'sawtooth', 0.06, 70);
    this.beep(180, 0.2, 'square', 0.04, 50);
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
  win: function () {
    this.ensure();
    this.beep(523, 0.1, 'square', 0.055, 659);
    this.beep(659, 0.12, 'triangle', 0.05, 784);
    this.beep(1046, 0.22, 'square', 0.045, 1318);
  },
  oneup: function () {
    this.ensure();
    this.beep(660, 0.08, 'square', 0.05, 880);
    this.beep(880, 0.12, 'triangle', 0.045, 1320);
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
  warn: function () {
    this.ensure();
    this.beep(220, 0.08, 'square', 0.04, 160);
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
      G.bestG = (o.g | 0) || (o.c | 0);
      G.bestP = (o.p | 0) || (o.r | 0);
      return;
    }
    if (typeof o === 'number') {
      G.bestG = o | 0;
      G.bestP = o | 0;
    }
  } catch (e) { /* ignore */ }
}

function persistBest() {
  var cur = G.pack ? G.bestP : G.bestG;
  if (G.score > cur) {
    if (G.pack) G.bestP = G.score;
    else G.bestG = G.score;
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ g: G.bestG, p: G.bestP }));
  } catch (e) { /* ignore */ }
}

function currentBest() {
  return G.pack ? G.bestP : G.bestG;
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

function kick(n, cls) {
  if (reduceMotion()) return;
  G.kickX = (Math.random() < 0.5 ? -1 : 1) * n;
  G.kickY = -n * 0.35;
  stageEl.classList.remove('hop', 'pop', 'die', 'clear');
  void stageEl.offsetWidth;
  stageEl.classList.add(cls || 'hop');
  clearTimeout(kickTok);
  kickTok = setTimeout(function () {
    stageEl.classList.remove('hop', 'pop', 'die', 'clear');
  }, 220);
}

function flash(rgb, t) {
  G.flashRgb = rgb;
  G.flash = t;
}

function capArr(arr, n) {
  if (arr.length > n) arr.splice(0, arr.length - n);
}

function burst(x, y, n, rgb, spd, life, grav) {
  var i, count;
  count = reduceMotion() ? Math.min(6, n) : n;
  for (i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: rand(-1, 1) * spd,
      vy: rand(-1.15, 0.35) * spd,
      t: life * rand(0.55, 1.2),
      max: life,
      r: rand(1.1, 2.6),
      rgb: rgb,
      g: grav == null ? 220 : grav
    });
  }
  capArr(particles, 180);
}

function spark(x, y, n, rgb) {
  var i;
  for (i = 0; i < n; i++) {
    sparks.push({
      x: x,
      y: y,
      vx: rand(-1, 1) * 180,
      vy: rand(-1, 1) * 180,
      t: rand(0.08, 0.18),
      rgb: rgb
    });
  }
  capArr(sparks, 80);
}

function ringAt(x, y, rgb, r) {
  rings.push({ x: x, y: y, r: r || 6, t: 0.28, rgb: rgb });
  capArr(rings, 16);
}

function floatText(x, y, text, rgb) {
  floats.push({ x: x, y: y, text: text, t: 0.7, rgb: rgb || GOLD });
  capArr(floats, 24);
}

function toast(msg, kind) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden', 'warn', 'gold');
  if (kind) toastEl.classList.add(kind);
  clearTimeout(toastTok);
  toastTok = setTimeout(function () { toastEl.classList.add('hidden'); }, 1100);
}

function addScore(n, x, y) {
  if (n <= 0) return;
  G.score += n;
  if (G.score > currentBest()) persistBest();
  scoreEl.textContent = String(G.score);
  bestEl.textContent = String(currentBest());
  scoreBox.classList.remove('flash');
  void scoreBox.offsetWidth;
  scoreBox.classList.add('flash');
  scoreAdd.hidden = false;
  scoreAdd.textContent = '+' + n;
  clearTimeout(addTok);
  addTok = setTimeout(function () { scoreAdd.hidden = true; }, 680);
  if (x != null) floatText(x, y - 14, '+' + n, GOLD);
  while (G.score >= G.next1up && G.lives < 6) {
    G.lives += 1;
    G.next1up += 10000;
    renderPips();
    audio.oneup();
    toast('1UP', 'gold');
  }
}

function bumpCombo() {
  G.combo += 1;
  G.comboT = COMBO_WIN;
  if (G.combo > G.maxCombo) G.maxCombo = G.combo;
  comboEl.textContent = '×' + comboMult(G.combo);
  comboBox.classList.remove('hot');
  void comboBox.offsetWidth;
  comboBox.classList.add('hot');
  clearTimeout(comboTok);
  comboTok = setTimeout(function () { comboBox.classList.remove('hot'); }, 340);
}

function resetCombo() {
  if (G.combo >= 4) toast('连爆断了', 'warn');
  G.combo = 0;
  G.comboT = 0;
  comboEl.textContent = '×1';
}

function renderPips() {
  var i, html;
  html = '';
  for (i = 0; i < Math.max(LIVES, G.lives); i++) {
    html += '<span class="pip' + (i < G.lives ? ' on' : ' gone') + '"></span>';
  }
  pipsEl.innerHTML = html;
}

function renderHouse() {
  var t = clamp(G.house / HOUSE_MAX, 0, 1);
  houseBar.style.transform = 'scaleX(' + t + ')';
  houseBar.classList.toggle('warn', G.house >= 5);
}

function hudPlay() {
  scoreEl.textContent = String(G.score);
  bestEl.textContent = String(currentBest());
  comboEl.textContent = '×' + (G.combo ? comboMult(G.combo) : 1);
  modeLabel.textContent = G.pack ? '群狼' : '护栏';
  modeLabel.classList.toggle('pack', G.pack);
  stageEm.textContent = G.pack ? '波' : '关';
  stageNumEl.textContent = String(G.pack ? G.wave : G.stage);
  tagLabel.textContent = G.pack ? ('第' + G.wave + '波') : (STAGE_NAMES[G.stage] || '护栏');
  renderPips();
  renderHouse();
}

function overlayOpen() {
  return !overlayEl.classList.contains('hidden');
}

function hideOverlay() {
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  if (canvas.focus) canvas.focus({ preventScroll: true });
}

function showOverlay(kind, title, lead, kicker) {
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.classList.remove('win', 'lose');
  if (kind) panelEl.classList.add(kind);
  ovTitle.textContent = title;
  ovLead.textContent = lead;
  ovOps.textContent = OPS;
  ovKicker.textContent = kicker || 'POO';
}

function showTitle() {
  G.mode = 'title';
  G.pack = false;
  G.kind = 'guard';
  G.lock = 0;
  G.house = 0;
  G.combo = 0;
  seedDemo();
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
  showOverlay('', '猪羊', '妈妈猪坐升降绳，射爆狼气球。落地的狼会爬梯，宅里进满就完了。丢肉能把一串气球拽下来。', 'POO');
  hintEl.textContent = '射爆气球 · 高处坠落的狼会摔死 · 落地的会爬宅 · F 丢肉饵';
  hudPlay();
  bestEl.textContent = String(Math.max(G.bestG, G.bestP));
}

function showOver() {
  G.mode = 'over';
  persistBest();
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
  showOverlay('lose', '命尽', '最高 ' + currentBest() + ' · 本局 ' + G.score + ' · 连爆 ' + G.maxCombo + (G.why ? ' · ' + G.why : ''), 'POO');
  audio.over();
}

function showWin() {
  G.mode = 'win';
  addScore(8000, WORLD_W * 0.55, 180);
  persistBest();
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
  showOverlay('win', '栏外清净', '五关护完。最高 ' + currentBest() + ' · 本局 ' + G.score + ' · 连爆 ' + G.maxCombo, 'POO');
  audio.win();
  kick(5, 'clear');
}

/* ---- spawn ---- */
function seedStars() {
  var i;
  stars.length = 0;
  for (i = 0; i < 46; i++) {
    stars.push({
      x: rand(90, WORLD_W - 8),
      y: rand(10, GROUND_Y - 30),
      s: rand(0.5, 1.6),
      p: rand(0, TAU)
    });
  }
}

function seedDemo() {
  var i, y;
  G.wolves = [];
  G.arrows = [];
  G.meats = [];
  G.player = makePlayer();
  G.house = 0;
  G.phase = 'demo';
  for (i = 0; i < 6; i++) {
    y = 70 + i * 58;
    G.wolves.push(makeWolf(210 + (i % 3) * 48, y, i % 2 ? 'up' : 'down', i % 4, 28, false));
  }
}

function clearFx() {
  particles.length = 0;
  sparks.length = 0;
  floats.length = 0;
  rings.length = 0;
}

function beginWave() {
  var st = G.pack ? G.wave : G.stage;
  G.spawnLeft = G.pack ? (6 + Math.min(10, G.wave)) : stageCount(G.stage);
  G.dir = G.pack ? (G.wave % 2 === 0 ? 'up' : 'down') : stageDir(G.stage);
  G.bossSoon = G.pack ? (G.wave % 4 === 0) : stageHasBoss(G.stage);
  G.spawnCd = 0.28;
  G.phase = 'wolves';
  G.ready = 0.45;
  tagLabel.textContent = G.pack ? ('第' + G.wave + '波') : (STAGE_NAMES[G.stage] || '护栏');
  stageNumEl.textContent = String(st);
  toast(G.dir === 'up' ? '气球升上来了' : '狼从林子里来了', G.dir === 'up' ? 'gold' : '');
}

function spawnOne(boss) {
  var st = G.pack ? Math.max(1, G.wave) : G.stage;
  var spd = wolfSpeed(st, G.pack);
  var dir = G.dir;
  var color = (Math.random() * 4) | 0;
  var x = WORLD_W + rand(8, 36);
  var y;
  if (boss) {
    G.wolves.push(makeWolf(WORLD_W + 20, G.player.y, 'down', 3, spd * 0.7, true));
    G.wolves[G.wolves.length - 1].hp = bossHp(st, G.pack);
    G.wolves[G.wolves.length - 1].vy = 0;
    toast('大王来了', 'warn');
    audio.warn();
    return;
  }
  if (G.stage === 4 && !G.pack && Math.random() < 0.45) dir = dir === 'up' ? 'down' : 'up';
  if (G.pack && Math.random() < 0.22) dir = dir === 'up' ? 'down' : 'up';
  y = dir === 'up' ? rand(GROUND_Y - 36, GROUND_Y - 10) : rand(58, 240);
  G.wolves.push(makeWolf(x, y, dir, color, spd, false));
}

function countLive() {
  var i, n = 0;
  for (i = 0; i < G.wolves.length; i++) if (liveWolf(G.wolves[i])) n++;
  return n;
}

function fire() {
  var p, n, i;
  if (G.mode !== 'play' || G.lock > 0 || G.ready > 0) return;
  p = G.player;
  if (p.fireCd > 0) return;
  n = 0;
  for (i = 0; i < G.arrows.length; i++) if (G.arrows[i].live) n++;
  if (n >= ARROW_MAX) return;
  G.arrows.push(makeArrow(ROPE_X + 18, p.y - 2));
  p.fireCd = 0.15;
  p.muzzle = 0.07;
  audio.shoot();
  spark(ROPE_X + 20, p.y - 2, 4, CYN);
}

function dropMeat() {
  var p, i, w;
  if (G.mode !== 'play' || G.lock > 0) return;
  p = G.player;
  if (p.meatCd > 0) return;
  for (i = 0; i < G.meats.length; i++) if (G.meats[i].live) return;
  G.meats.push(makeMeat(ROPE_X + 16, p.y + 4));
  p.meatCd = 3.5;
  for (i = 0; i < G.wolves.length; i++) {
    w = G.wolves[i];
    if (!floatingWolf(w) || w.boss) continue;
    if (w.x < ROPE_X + 36) continue;
    w.vy += 96;
    w.vx *= 0.55;
  }
  audio.meat();
  burst(ROPE_X + 16, p.y + 4, 10, MEAT_RGB, 90, 0.35, 80);
  kick(2.2, 'hop');
  hitStop(0.032);
  toast('丢饵', 'gold');
}

function popBalloon(w, ax, ay, fromMeat) {
  var mult, pts, rgb;
  w.hp -= 1;
  rgb = w.boss ? MAG : BALLOON_RGB[w.color] || HOT;
  burst(w.x, w.y - w.r * 0.2, w.boss ? 22 : 14, rgb, w.boss ? 220 : 160, 0.42, 40);
  ringAt(w.x, w.y, rgb, w.r);
  spark(w.x, w.y, w.boss ? 10 : 6, WHT);
  if (w.hp > 0) {
    audio.pop(G.combo, true);
    hitStop(0.055);
    kick(2.8, 'pop');
    addScore(150, w.x, w.y);
    w.r = Math.max(14, w.r - 2.2);
    return;
  }
  bumpCombo();
  mult = comboMult(G.combo);
  pts = popScore(w.boss ? 3 : w.color, mult);
  if (fromMeat) pts += 50 * mult;
  if (w.boss) pts += 2000;
  addScore(pts, w.x, w.y);
  audio.pop(G.combo, w.boss);
  hitStop(w.boss ? 0.075 : 0.048);
  kick(w.boss ? 5 : 3.2, 'pop');
  flash(rgb, w.boss ? 0.28 : 0.12);
  w.state = 'fall';
  w.fallFrom = w.y;
  w.vy = 50;
  w.vx *= 0.25;
  G.kills += 1;
}

function splatWolf(w) {
  w.dead = true;
  w.state = 'dead';
  burst(w.x, GROUND_Y - 6, 16, WOLF_RGB, 140, 0.4, 260);
  burst(w.x, GROUND_Y - 6, 6, GOLD, 80, 0.28, 40);
  audio.splat();
  hitStop(0.04);
  addScore(200 * comboMult(Math.max(1, G.combo)), w.x, GROUND_Y - 18);
}

function landWolf(w) {
  w.state = 'walk';
  w.y = GROUND_Y - 8;
  w.vy = 0;
  w.vx = 0;
  burst(w.x, w.y, 6, WOLF_RGB, 50, 0.22, 80);
  audio.climb();
}

function enterHouse(w) {
  w.dead = true;
  w.state = 'house';
  G.house += 1;
  renderHouse();
  audio.house();
  flash(MAG, 0.22);
  shake(5);
  kick(3.4, 'die');
  if (G.house >= 4) toast('狼上房了', 'warn');
  if (houseFull(G.house)) die('宅被破了');
}

function die(why) {
  var p;
  if (G.mode !== 'play' || G.lock > 0) return;
  p = G.player;
  if (p.inv > 0) return;
  G.why = why || '';
  G.lock = DIE_T;
  p.deadT = DIE_T;
  G.lives -= 1;
  renderPips();
  audio.die();
  hitStop(0.08);
  shake(8);
  kick(6, 'die');
  flash(MAG, 0.45);
  burst(ROPE_X, p.y, 22, HOT, 200, 0.5, 120);
  resetCombo();
}

function afterDie() {
  var i, w;
  if (G.lives <= 0) {
    showOver();
    return;
  }
  G.player = makePlayer();
  G.player.y = clamp(G.player.y, Y_MIN, Y_MAX);
  G.player.inv = INVULN;
  G.lock = 0;
  G.house = 0;
  renderHouse();
  for (i = 0; i < G.wolves.length; i++) {
    w = G.wolves[i];
    if (w.state === 'walk' || w.state === 'climb') {
      w.dead = true;
      w.state = 'dead';
    }
  }
  toast('再来', '');
}

function startGame(kind) {
  G.kind = kind === 'pack' ? 'pack' : 'guard';
  G.pack = G.kind === 'pack';
  G.mode = 'play';
  G.stage = 1;
  G.wave = 1;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  G.comboT = 0;
  G.maxCombo = 0;
  G.house = 0;
  G.kills = 0;
  G.next1up = 10000;
  G.lock = 0;
  G.why = '';
  G.stop = 0;
  G.player = makePlayer();
  G.wolves = [];
  G.arrows = [];
  G.meats = [];
  clearFx();
  hideOverlay();
  audio.start();
  hudPlay();
  beginWave();
  hintEl.textContent = G.pack
    ? '群狼不停。气球更快更密，大王每隔几波就来。'
    : '护栏五关。单数关气球往下飘，双数关往上升。';
}

function retry() {
  audio.ui();
  if (G.mode === 'title') startGame('guard');
  else startGame(G.kind);
}

function nextStage() {
  if (G.pack) {
    G.wave += 1;
    addScore(400 * G.wave, WORLD_W * 0.55, 160);
    beginWave();
    return;
  }
  if (G.stage >= GUARD_STAGES) {
    showWin();
    return;
  }
  G.stage += 1;
  addScore(800 * G.stage, WORLD_W * 0.55, 160);
  audio.clear();
  kick(4, 'clear');
  toast(STAGE_NAMES[G.stage] || ('第' + G.stage + '关'), 'gold');
  hudPlay();
  beginWave();
}

function waveCleared() {
  if (G.phase === 'clear') return;
  if (G.phase === 'wolves' && G.spawnLeft > 0) return;
  if (countLive() > 0) return;
  if (G.phase === 'wolves' && G.bossSoon) {
    G.phase = 'boss';
    G.bossSoon = false;
    G.ready = 0.55;
    spawnOne(true);
    return;
  }
  G.phase = 'clear';
  G.ready = 1.05;
  toast('清场', 'gold');
  audio.clear();
}

/* ---- update ---- */
function attractToMeat(w, dt) {
  var i, m, dx, dy, dist, pull;
  for (i = 0; i < G.meats.length; i++) {
    m = G.meats[i];
    if (!m.live) continue;
    dx = m.x - w.x;
    dy = m.y - w.y;
    dist = hypot(dx, dy);
    if (dist < 8 || dist > 118) continue;
    pull = 210 * dt;
    w.vx += (dx / dist) * pull;
    w.vy += (dy / dist) * pull * 1.15;
  }
}

function updatePlayer(dt) {
  var p = G.player;
  var want;
  p.bob += dt * 7;
  p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
  if (p.fireCd > 0) p.fireCd -= dt;
  if (p.meatCd > 0) p.meatCd -= dt;
  if (p.muzzle > 0) p.muzzle -= dt;
  if (p.inv > 0) p.inv -= dt;
  if (G.lock > 0) return;
  want = 0;
  if (keys.u) want -= 1;
  if (keys.d) want += 1;
  if (want !== 0) {
    p.y += want * ELEV_SPD * dt;
    p.squash = 1.08;
  } else if (pointer.down && !coarseQ.matches) {
    p.y = lerp(p.y, pointer.y, 1 - Math.pow(0.012, dt));
  } else if (pointer.down) {
    p.y = lerp(p.y, pointer.y, 1 - Math.pow(0.02, dt));
  }
  p.y = clamp(p.y, Y_MIN, Y_MAX);
  if (keys.fire || (pointer.down && !keys.u && !keys.d)) fire();
}

function updateArrows(dt) {
  var i, a, j, w, hit;
  for (i = 0; i < G.arrows.length; i++) {
    a = G.arrows[i];
    if (!a.live) continue;
    a.x += a.vx * dt;
    if (a.x > WORLD_W + 16) {
      a.live = false;
      continue;
    }
    hit = false;
    for (j = 0; j < G.wolves.length; j++) {
      w = G.wolves[j];
      if (!floatingWolf(w)) continue;
      if (balloonHit(a.x, a.y, w.x, w.y - w.r * 0.15, w.r)) {
        popBalloon(w, a.x, a.y, false);
        a.live = false;
        hit = true;
        break;
      }
    }
    if (hit) continue;
  }
  if (G.arrows.length > 8) {
    G.arrows = G.arrows.filter(function (ar) { return ar.live; });
  }
}

function updateMeats(dt) {
  var i, m, j, w;
  for (i = 0; i < G.meats.length; i++) {
    m = G.meats[i];
    if (!m.live) continue;
    m.vy += 420 * dt;
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    m.vx *= 0.985;
    m.t -= dt;
    if (m.y >= GROUND_Y - 6) {
      m.y = GROUND_Y - 6;
      m.vy = 0;
      m.vx *= 0.4;
    }
    if (m.x > WORLD_W - 12) m.x = WORLD_W - 12;
    if (m.t <= 0) {
      m.live = false;
      burst(m.x, m.y, 8, MEAT_RGB, 70, 0.25, 40);
    }
    for (j = 0; j < G.wolves.length; j++) {
      w = G.wolves[j];
      if (!floatingWolf(w)) continue;
      if (hypot(w.x - m.x, (w.y + 10) - m.y) < w.r + 8) {
        popBalloon(w, m.x, m.y, true);
        m.live = false;
        burst(m.x, m.y, 12, MEAT_RGB, 110, 0.3, 60);
        break;
      }
    }
  }
}

function updateWolf(w, dt) {
  var st, meatPull;
  if (!liveWolf(w)) return;
  st = G.pack ? G.wave : G.stage;
  w.phase += dt * 3.2;
  if (w.state === 'float') {
    attractToMeat(w, dt);
    meatPull = G.meats.some(function (m) { return m.live; });
    w.bob += dt * (meatPull ? 5 : 3.4);
    w.x += w.vx * dt;
    w.y += w.vy * dt + Math.sin(w.bob) * (w.boss ? 10 : 16) * dt;
    if (w.boss) {
      w.vy += clamp(G.player.y - w.y, -80, 80) * 0.9 * dt;
      w.vy = clamp(w.vy, -70, 70);
      w.vx = clamp(w.vx, -46, -16);
      if (w.x < 168) w.vx = -18;
    } else {
      w.vx = clamp(w.vx, -90, 20);
      w.vy = clamp(w.vy, -80, 80);
      w.x = clamp(w.x, LADDER_X + 2, WORLD_W + 48);
    }
    if (w.y < 36) {
      w.y = 36;
      if (w.dir === 'up') {
        enterHouse(w);
        return;
      }
      w.vy = Math.abs(w.vy) * 0.4;
    }
    if (w.y > GROUND_Y - 18) {
      w.y = GROUND_Y - 18;
      landWolf(w);
      return;
    }
    if (w.x < LADDER_X + 8) {
      if (w.boss) {
        w.x = LADDER_X + 8;
        w.vx = 22;
        return;
      }
      if (w.dir === 'up' && w.y < HOUSE_Y + HOUSE_H + 10) {
        enterHouse(w);
        return;
      }
      if (w.y >= GROUND_Y - 40) {
        landWolf(w);
        w.x = LADDER_X;
      } else {
        w.state = 'climb';
        w.x = LADDER_X;
        audio.climb();
      }
      return;
    }
    if (G.mode === 'play' && G.lock <= 0 && G.player.inv <= 0) {
      if (basketHit(ROPE_X, G.player.y, w.x, w.y + 8, w.r * 0.7)) {
        die('撞上狼了');
      }
    }
    return;
  }
  if (w.state === 'fall') {
    w.vy += 540 * dt;
    w.y += w.vy * dt;
    w.x += w.vx * dt;
    w.spin += 9 * dt;
    if (w.y >= GROUND_Y - 8) {
      if (fallLethal(w.fallFrom, GROUND_Y) || w.boss) splatWolf(w);
      else landWolf(w);
    }
    return;
  }
  if (w.state === 'walk') {
    w.x -= 56 * dt;
    w.spin = 0;
    if (w.x <= LADDER_X) {
      w.x = LADDER_X;
      w.state = 'climb';
      audio.climb();
    }
    if (G.mode === 'play' && G.lock <= 0 && G.player.inv <= 0) {
      if (G.player.y > GROUND_Y - 42 && Math.abs(w.x - ROPE_X) < 22) die('撞上狼了');
    }
    return;
  }
  if (w.state === 'climb') {
    w.y -= climbSpeed(st, G.pack) * dt;
    w.x = LADDER_X;
    if (w.y <= HOUSE_Y + HOUSE_H - 8) enterHouse(w);
  }
}

function updateWolves(dt) {
  var i;
  for (i = 0; i < G.wolves.length; i++) updateWolf(G.wolves[i], dt);
  if (G.wolves.length > 28) {
    G.wolves = G.wolves.filter(liveWolf);
  }
}

function updateFx(dt) {
  var i, p, s, r, f;
  for (i = particles.length - 1; i >= 0; i--) {
    p = particles[i];
    p.t -= dt;
    p.vy += p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.99;
    if (p.t <= 0) particles.splice(i, 1);
  }
  for (i = sparks.length - 1; i >= 0; i--) {
    s = sparks[i];
    s.t -= dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (s.t <= 0) sparks.splice(i, 1);
  }
  for (i = rings.length - 1; i >= 0; i--) {
    r = rings[i];
    r.t -= dt;
    r.r += 90 * dt;
    if (r.t <= 0) rings.splice(i, 1);
  }
  for (i = floats.length - 1; i >= 0; i--) {
    f = floats[i];
    f.t -= dt;
    f.y -= 28 * dt;
    if (f.t <= 0) floats.splice(i, 1);
  }
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
  if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
  G.kickX *= 0.86;
  G.kickY *= 0.86;
}

function updateDemo(dt) {
  var i, w;
  G.t += dt;
  for (i = 0; i < G.wolves.length; i++) {
    w = G.wolves[i];
    if (w.state !== 'float') continue;
    w.bob += dt * 2.4;
    w.y += Math.sin(w.bob + i) * 12 * dt;
    w.x += Math.sin(G.t * 0.6 + i) * 8 * dt;
    w.y = clamp(w.y, 50, 460);
    w.x = clamp(w.x, 160, 360);
  }
  G.player.y = 260 + Math.sin(G.t * 0.8) * 70;
  G.player.bob += dt * 6;
  updateFx(dt);
}

function updatePlay(dt) {
  var maxOn;
  G.clock += dt;
  G.t += dt;
  if (G.comboT > 0) {
    G.comboT -= dt;
    if (G.comboT <= 0 && G.combo > 0) resetCombo();
  }
  if (G.lock > 0) {
    G.lock -= dt;
    G.player.deadT = G.lock;
    updateFx(dt);
    if (G.lock <= 0) afterDie();
    return;
  }
  if (G.ready > 0) {
    G.ready -= dt;
    updatePlayer(dt);
    updateArrows(dt);
    updateMeats(dt);
    updateWolves(dt);
    updateFx(dt);
    return;
  }
  if (G.phase === 'clear') {
    nextStage();
    return;
  }
  maxOn = G.pack ? 16 : 12;
  if (G.phase === 'wolves' && G.spawnLeft > 0 && countLive() < maxOn) {
    G.spawnCd -= dt;
    if (G.spawnCd <= 0) {
      spawnOne(false);
      G.spawnLeft -= 1;
      G.spawnCd = spawnInterval(G.pack ? G.wave : G.stage, G.pack);
    }
  }
  updatePlayer(dt);
  updateArrows(dt);
  updateMeats(dt);
  updateWolves(dt);
  updateFx(dt);
  if (G.phase === 'wolves' || G.phase === 'boss') waveCleared();
}

function update(dt) {
  if (G.stop > 0) {
    G.stop -= dt;
    updateFx(dt * 0.35);
    return;
  }
  if (G.mode === 'title' || G.mode === 'over' || G.mode === 'win') {
    updateDemo(dt);
    return;
  }
  if (G.mode === 'play') updatePlay(dt);
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

function drawBg() {
  var g, i, st;
  ctx.fillStyle = '#08010a';
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(70), sy(40), 8, sx(70), sy(80), 220 * L.s);
  g.addColorStop(0, 'rgba(255,45,98,0.18)');
  g.addColorStop(1, 'rgba(255,45,98,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(330), sy(70), 6, sx(330), sy(70), 160 * L.s);
  g.addColorStop(0, 'rgba(255,61,184,0.12)');
  g.addColorStop(1, 'rgba(255,61,184,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.fillStyle = '#ffe36b';
  for (i = 0; i < stars.length; i++) {
    st = stars[i];
    ctx.globalAlpha = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(G.t * 1.4 + st.p));
    ctx.beginPath();
    ctx.arc(sx(st.x), sy(st.y), st.s * L.s, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#f4e8c8';
  ctx.beginPath();
  ctx.arc(sx(348), sy(48), 16 * L.s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#08010a';
  ctx.beginPath();
  ctx.arc(sx(356), sy(44), 13 * L.s, 0, TAU);
  ctx.fill();
}

function drawTrees() {
  var i, x, base, h;
  for (i = 0; i < 5; i++) {
    x = 292 + i * 22;
    base = GROUND_Y;
    h = 110 + (i % 3) * 36;
    ctx.fillStyle = i % 2 ? '#1a0810' : '#220a14';
    ctx.beginPath();
    ctx.moveTo(sx(x), sy(base - h));
    ctx.lineTo(sx(x + 18), sy(base));
    ctx.lineTo(sx(x - 18), sy(base));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,45,98,0.12)';
    ctx.beginPath();
    ctx.moveTo(sx(x), sy(base - h + 10));
    ctx.lineTo(sx(x + 10), sy(base - 24));
    ctx.lineTo(sx(x - 10), sy(base - 24));
    ctx.closePath();
    ctx.fill();
  }
}

function drawCliff() {
  var i, y;
  ctx.fillStyle = '#2a1018';
  ctx.fillRect(sx(0), sy(HOUSE_Y + HOUSE_H - 4), 96 * L.s, (GROUND_Y - HOUSE_Y - HOUSE_H + 8) * L.s);
  ctx.fillStyle = '#3a1824';
  ctx.fillRect(sx(0), sy(HOUSE_Y + HOUSE_H - 4), 48 * L.s, (GROUND_Y - HOUSE_Y - HOUSE_H + 8) * L.s);
  ctx.strokeStyle = 'rgba(255,45,98,0.22)';
  ctx.lineWidth = 1 * L.s;
  for (i = 0; i < 16; i++) {
    y = HOUSE_Y + HOUSE_H + 8 + i * 24;
    ctx.beginPath();
    ctx.moveTo(sx(4), sy(y));
    ctx.lineTo(sx(90), sy(y));
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(8,1,10,0.55)';
  ctx.fillRect(sx(48), sy(HOUSE_Y + HOUSE_H), 28 * L.s, (GROUND_Y - HOUSE_Y - HOUSE_H) * L.s);
  ctx.strokeStyle = 'rgba(0,240,255,0.28)';
  ctx.lineWidth = 1.2 * L.s;
  ctx.strokeRect(sx(48), sy(HOUSE_Y + HOUSE_H), 28 * L.s, (GROUND_Y - HOUSE_Y - HOUSE_H) * L.s);
}

function drawHouse() {
  var x = 8, y = HOUSE_Y;
  ctx.fillStyle = '#ff2d62';
  ctx.beginPath();
  ctx.moveTo(sx(x - 4), sy(y + 28));
  ctx.lineTo(sx(x + 46), sy(y - 6));
  ctx.lineTo(sx(x + 96), sy(y + 28));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a2230';
  roundRect(sx(x + 6), sy(y + 24), 84 * L.s, 48 * L.s, 4 * L.s);
  ctx.fill();
  ctx.fillStyle = '#ffe36b';
  ctx.globalAlpha = 0.85 + 0.15 * Math.sin(G.t * 3);
  roundRect(sx(x + 18), sy(y + 34), 22 * L.s, 18 * L.s, 2 * L.s);
  ctx.fill();
  roundRect(sx(x + 54), sy(y + 34), 22 * L.s, 18 * L.s, 2 * L.s);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ff8aa8';
  ctx.beginPath();
  ctx.arc(sx(x + 26), sy(y + 44), 3.2 * L.s, 0, TAU);
  ctx.arc(sx(x + 64), sy(y + 44), 3.2 * L.s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#2a1018';
  ctx.fillRect(sx(x + 40), sy(y + 48), 12 * L.s, 24 * L.s);
  if (G.house > 0) {
    ctx.fillStyle = rgba(MAG, 0.18 + 0.08 * G.house);
    ctx.fillRect(sx(x + 6), sy(y + 24), 84 * L.s, 48 * L.s);
  }
}

function drawRope() {
  var top = HOUSE_Y + HOUSE_H;
  var bot = GROUND_Y;
  var x = sx(ROPE_X);
  ctx.strokeStyle = 'rgba(0,240,255,0.85)';
  ctx.lineWidth = 2.1 * L.s;
  ctx.setLineDash([5 * L.s, 4 * L.s]);
  ctx.beginPath();
  ctx.moveTo(x, sy(top));
  ctx.lineTo(x, sy(bot));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(255,227,107,0.35)';
  ctx.lineWidth = 1 * L.s;
  ctx.beginPath();
  ctx.moveTo(x, sy(top));
  ctx.lineTo(x, sy(bot));
  ctx.stroke();
}

function drawLadder() {
  var x = sx(LADDER_X);
  var top = sy(HOUSE_Y + HOUSE_H - 4);
  var bot = sy(GROUND_Y);
  var rungs, r, yy;
  ctx.strokeStyle = 'rgba(0,240,255,0.8)';
  ctx.lineWidth = 1.6 * L.s;
  ctx.beginPath();
  ctx.moveTo(x - 5 * L.s, top);
  ctx.lineTo(x - 5 * L.s, bot);
  ctx.moveTo(x + 5 * L.s, top);
  ctx.lineTo(x + 5 * L.s, bot);
  ctx.stroke();
  rungs = 22;
  ctx.lineWidth = 1.3 * L.s;
  for (r = 0; r <= rungs; r++) {
    yy = lerp(top, bot, r / rungs);
    ctx.beginPath();
    ctx.moveTo(x - 5.4 * L.s, yy);
    ctx.lineTo(x + 5.4 * L.s, yy);
    ctx.stroke();
  }
}

function drawGround() {
  ctx.fillStyle = '#1a0810';
  ctx.fillRect(sx(0), sy(GROUND_Y), WORLD_W * L.s, (WORLD_H - GROUND_Y) * L.s);
  ctx.fillStyle = '#3a1824';
  ctx.fillRect(sx(0), sy(GROUND_Y), WORLD_W * L.s, 4 * L.s);
  ctx.fillStyle = 'rgba(255,45,98,0.35)';
  ctx.fillRect(sx(0), sy(GROUND_Y), WORLD_W * L.s, 2 * L.s);
}

function drawBalloon(x, y, r, rgb, boss) {
  var g;
  g = ctx.createRadialGradient(sx(x - r * 0.3), sy(y - r * 0.35), 1, sx(x), sy(y), r * L.s);
  g.addColorStop(0, rgba(WHT, 0.85));
  g.addColorStop(0.18, rgba(rgb, 0.95));
  g.addColorStop(1, rgba(rgb, 0.55));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(sx(x), sy(y), r * L.s, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba(rgb, 0.9);
  ctx.lineWidth = (boss ? 2.2 : 1.4) * L.s;
  ctx.stroke();
  ctx.fillStyle = rgba(WHT, 0.55);
  ctx.beginPath();
  ctx.ellipse(sx(x - r * 0.28), sy(y - r * 0.32), r * 0.22 * L.s, r * 0.14 * L.s, -0.4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(rgb, 0.9);
  ctx.beginPath();
  ctx.moveTo(sx(x - 2), sy(y + r * 0.92));
  ctx.lineTo(sx(x + 2), sy(y + r * 0.92));
  ctx.lineTo(sx(x), sy(y + r * 1.18));
  ctx.closePath();
  ctx.fill();
  if (boss) {
    ctx.fillStyle = 'rgba(8,1,10,0.7)';
    ctx.beginPath();
    ctx.arc(sx(x - 5), sy(y - 2), 2.2 * L.s, 0, TAU);
    ctx.arc(sx(x + 5), sy(y - 2), 2.2 * L.s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ff2d62';
    ctx.beginPath();
    ctx.arc(sx(x - 5), sy(y - 2), 0.8 * L.s, 0, TAU);
    ctx.arc(sx(x + 5), sy(y - 2), 0.8 * L.s, 0, TAU);
    ctx.fill();
  }
}

function drawWolfBody(x, y, scale, spin, pose) {
  var s = scale * L.s;
  ctx.save();
  ctx.translate(sx(x), sy(y));
  ctx.rotate(spin);
  ctx.fillStyle = '#8a889c';
  if (pose === 'hang') {
    ctx.beginPath();
    ctx.ellipse(0, 6 * s, 6.2 * s, 8.2 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#c8c4d8';
    ctx.beginPath();
    ctx.arc(0, 1.2 * s, 5.4 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#6a6878';
    ctx.beginPath();
    ctx.moveTo(-4.4 * s, -3 * s);
    ctx.lineTo(-1.2 * s, -7.4 * s);
    ctx.lineTo(0.2 * s, -2.2 * s);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4.4 * s, -3 * s);
    ctx.lineTo(1.2 * s, -7.4 * s);
    ctx.lineTo(-0.2 * s, -2.2 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2a1018';
    ctx.beginPath();
    ctx.arc(-1.8 * s, 0.6 * s, 0.9 * s, 0, TAU);
    ctx.arc(1.8 * s, 0.6 * s, 0.9 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ff6b8a';
    ctx.beginPath();
    ctx.ellipse(0, 3.2 * s, 2.1 * s, 1.3 * s, 0, 0, TAU);
    ctx.fill();
  } else if (pose === 'walk') {
    ctx.beginPath();
    ctx.ellipse(0, 0, 8 * s, 4.2 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#c8c4d8';
    ctx.beginPath();
    ctx.arc(-6 * s, -1 * s, 4.2 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2a1018';
    ctx.beginPath();
    ctx.arc(-7.2 * s, -1.4 * s, 0.8 * s, 0, TAU);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.4 * s, 8 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#c8c4d8';
    ctx.beginPath();
    ctx.arc(0, -6 * s, 4 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2a1018';
    ctx.beginPath();
    ctx.arc(-1.4 * s, -6.4 * s, 0.7 * s, 0, TAU);
    ctx.arc(1.4 * s, -6.4 * s, 0.7 * s, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawWolf(w) {
  var by, strY, pose, rgb;
  if (w.state === 'dead' || w.state === 'house') return;
  rgb = BALLOON_RGB[w.color] || HOT;
  if (w.state === 'float') {
    by = w.y - w.r * 0.15;
    drawBalloon(w.x, by, w.r, w.boss ? MAG : rgb, w.boss);
    strY = by + w.r * 1.15;
    ctx.strokeStyle = rgba(GOLD, 0.75);
    ctx.lineWidth = 1.1 * L.s;
    ctx.beginPath();
    ctx.moveTo(sx(w.x), sy(strY));
    ctx.lineTo(sx(w.x), sy(strY + 12));
    ctx.stroke();
    drawWolfBody(w.x, strY + 18, w.boss ? 1.5 : 1.18, 0, 'hang');
  } else if (w.state === 'fall') {
    drawWolfBody(w.x, w.y, w.boss ? 1.45 : 1, w.spin, 'hang');
  } else if (w.state === 'walk') {
    pose = 'walk';
    drawWolfBody(w.x, w.y - 2, 1, Math.sin(G.t * 10) * 0.12, pose);
  } else if (w.state === 'climb') {
    drawWolfBody(w.x, w.y, 1, 0, 'climb');
  }
}

function drawPlayer() {
  var p = G.player;
  var blink = p.inv > 0 && ((p.inv * 12) | 0) % 2 === 0;
  var y = p.y;
  var squash = p.squash;
  var bx, by;
  if (G.lock > 0 && p.deadT > 0) {
    ctx.globalAlpha = clamp(p.deadT / DIE_T, 0, 1);
  } else if (blink) {
    ctx.globalAlpha = 0.35;
  }
  bx = sx(ROPE_X - 14);
  by = sy(y - 6);
  ctx.fillStyle = '#6a3a22';
  roundRect(bx, by, 28 * L.s, 16 * L.s * squash, 3 * L.s);
  ctx.fill();
  ctx.strokeStyle = '#ffe36b';
  ctx.lineWidth = 1.1 * L.s;
  ctx.stroke();
  ctx.fillStyle = '#ff8aa8';
  ctx.beginPath();
  ctx.ellipse(sx(ROPE_X), sy(y - 10 * squash), 8.4 * L.s, 7.2 * L.s * squash, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff2d62';
  ctx.beginPath();
  ctx.moveTo(sx(ROPE_X - 6), sy(y - 16 * squash));
  ctx.lineTo(sx(ROPE_X - 3), sy(y - 22 * squash));
  ctx.lineTo(sx(ROPE_X - 1), sy(y - 15 * squash));
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(sx(ROPE_X + 6), sy(y - 16 * squash));
  ctx.lineTo(sx(ROPE_X + 3), sy(y - 22 * squash));
  ctx.lineTo(sx(ROPE_X + 1), sy(y - 15 * squash));
  ctx.fill();
  ctx.fillStyle = '#ffb0c4';
  ctx.beginPath();
  ctx.ellipse(sx(ROPE_X + 7), sy(y - 8 * squash), 3.4 * L.s, 2.4 * L.s, 0.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#2a1018';
  ctx.beginPath();
  ctx.arc(sx(ROPE_X + 4), sy(y - 12 * squash), 1.05 * L.s, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#c8a070';
  ctx.lineWidth = 1.4 * L.s;
  ctx.beginPath();
  ctx.arc(sx(ROPE_X + 12), sy(y - 4), 7 * L.s, -0.6, 0.6);
  ctx.stroke();
  if (p.muzzle > 0) {
    ctx.fillStyle = rgba(CYN, p.muzzle / 0.07);
    ctx.beginPath();
    ctx.arc(sx(ROPE_X + 20), sy(y - 2), 4.5 * L.s, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawArrows() {
  var i, a;
  ctx.strokeStyle = '#00f0ff';
  ctx.fillStyle = '#ffe36b';
  ctx.lineWidth = 1.6 * L.s;
  ctx.lineCap = 'round';
  for (i = 0; i < G.arrows.length; i++) {
    a = G.arrows[i];
    if (!a.live) continue;
    ctx.beginPath();
    ctx.moveTo(sx(a.x - 10), sy(a.y));
    ctx.lineTo(sx(a.x + 6), sy(a.y));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx(a.x + 8), sy(a.y));
    ctx.lineTo(sx(a.x + 2), sy(a.y - 3.2));
    ctx.lineTo(sx(a.x + 2), sy(a.y + 3.2));
    ctx.closePath();
    ctx.fill();
    if (!reduceMotion()) {
      ctx.strokeStyle = 'rgba(0,240,255,0.28)';
      ctx.beginPath();
      ctx.moveTo(sx(a.x - 22), sy(a.y));
      ctx.lineTo(sx(a.x - 10), sy(a.y));
      ctx.stroke();
      ctx.strokeStyle = '#00f0ff';
    }
  }
}

function drawMeats() {
  var i, m;
  for (i = 0; i < G.meats.length; i++) {
    m = G.meats[i];
    if (!m.live) continue;
    ctx.fillStyle = '#ff6e46';
    ctx.beginPath();
    ctx.ellipse(sx(m.x), sy(m.y), 6.2 * L.s, 4.4 * L.s, 0.3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.arc(sx(m.x - 2), sy(m.y - 1), 1.2 * L.s, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,227,107,0.45)';
    ctx.lineWidth = 1.2 * L.s;
    ctx.beginPath();
    ctx.arc(sx(m.x), sy(m.y), 11 * L.s, 0, TAU);
    ctx.stroke();
  }
}

function drawFx() {
  var i, p, s, r, f, a;
  for (i = 0; i < particles.length; i++) {
    p = particles[i];
    a = clamp(p.t / p.max, 0, 1);
    ctx.fillStyle = rgba(p.rgb, a);
    ctx.beginPath();
    ctx.arc(sx(p.x), sy(p.y), p.r * L.s, 0, TAU);
    ctx.fill();
  }
  for (i = 0; i < sparks.length; i++) {
    s = sparks[i];
    ctx.strokeStyle = rgba(s.rgb, clamp(s.t / 0.18, 0, 1));
    ctx.lineWidth = 1.2 * L.s;
    ctx.beginPath();
    ctx.moveTo(sx(s.x), sy(s.y));
    ctx.lineTo(sx(s.x - s.vx * 0.04), sy(s.y - s.vy * 0.04));
    ctx.stroke();
  }
  for (i = 0; i < rings.length; i++) {
    r = rings[i];
    ctx.strokeStyle = rgba(r.rgb, clamp(r.t / 0.28, 0, 1));
    ctx.lineWidth = 2 * L.s;
    ctx.beginPath();
    ctx.arc(sx(r.x), sy(r.y), r.r * L.s, 0, TAU);
    ctx.stroke();
  }
  ctx.font = '700 ' + Math.max(10, 11 * L.s) + 'px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  for (i = 0; i < floats.length; i++) {
    f = floats[i];
    ctx.fillStyle = rgba(f.rgb, clamp(f.t / 0.7, 0, 1));
    ctx.fillText(f.text, sx(f.x), sy(f.y));
  }
  ctx.textAlign = 'left';
}

function drawFlash() {
  var g;
  if (G.flash <= 0) return;
  ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.28);
  ctx.fillRect(0, 0, cssW, cssH);
}

function drawHudWorld() {
  var p = G.player;
  if (G.mode !== 'play') return;
  if (p.meatCd > 0 && p.meatCd < 3.4) {
    ctx.fillStyle = 'rgba(255,227,107,0.2)';
    roundRect(sx(ROPE_X - 16), sy(p.y + 16), 32 * L.s, 4 * L.s, 2 * L.s);
    ctx.fill();
    ctx.fillStyle = '#ffe36b';
    ctx.fillRect(sx(ROPE_X - 16), sy(p.y + 16), 32 * L.s * (1 - p.meatCd / 3.5), 4 * L.s);
  }
}

function draw() {
  var i, ox, oy;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ox = G.kickX + (G.shake ? rand(-G.shake, G.shake) : 0);
  oy = G.kickY + (G.shake ? rand(-G.shake, G.shake) * 0.6 : 0);
  ctx.translate(ox, oy);
  drawBg();
  drawTrees();
  drawCliff();
  drawHouse();
  drawRope();
  drawLadder();
  drawGround();
  for (i = 0; i < G.wolves.length; i++) drawWolf(G.wolves[i]);
  drawMeats();
  drawArrows();
  drawPlayer();
  drawFx();
  drawHudWorld();
  drawFlash();
}

function pointerWorldY(e) {
  var rect = canvas.getBoundingClientRect();
  return (e.clientY - rect.top - L.y) / L.s;
}

/* ---- input ---- */
function bindPad(el, setter, tap) {
  function down(ev) {
    ev.preventDefault();
    setter(true);
    el.classList.add('held');
    audio.ensure();
    if (tap) tap();
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

bindPad(btnUp, function (v) { keys.u = v; });
bindPad(btnDown, function (v) { keys.d = v; });
bindPad(btnFire, function (v) { keys.fire = v; }, function () { fire(); });
bindPad(btnMeat, function (v) { keys.meat = v; }, function () { dropMeat(); });

function keyMove(e, down) {
  var k = e.code;
  if (k === 'ArrowUp' || k === 'KeyW') { keys.u = down; e.preventDefault(); }
  else if (k === 'ArrowDown' || k === 'KeyS') { keys.d = down; e.preventDefault(); }
  else if (k === 'Space') { keys.fire = down; e.preventDefault(); }
  else if (k === 'KeyF' || k === 'ShiftLeft' || k === 'ShiftRight' || k === 'KeyX') {
    keys.meat = down;
    e.preventDefault();
  }
}

window.addEventListener('keydown', function (e) {
  if (e.repeat) {
    keyMove(e, true);
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
      startGame('guard');
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      startGame('pack');
      e.preventDefault();
      return;
    }
  }
  if (G.mode === 'over' || G.mode === 'win') {
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Digit1') {
      startGame(G.kind);
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      if (G.mode === 'win') startGame('pack');
      else showTitle();
      e.preventDefault();
      return;
    }
  }
  if (overlayOpen() && G.mode !== 'play') return;
  keyMove(e, true);
  if ((e.code === 'KeyF' || e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyX') && !meatEdge) {
    meatEdge = true;
    dropMeat();
  }
  if (e.code === 'Space') fire();
});

window.addEventListener('keyup', function (e) {
  keyMove(e, false);
  if (e.code === 'KeyF' || e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyX') meatEdge = false;
});

btnMute.addEventListener('click', function () {
  audio.ensure();
  audio.setMuted(!audio.muted);
});
btnRetry.addEventListener('click', function () {
  audio.ensure();
  retry();
});
btnGuard.addEventListener('click', function () {
  audio.ensure();
  startGame('guard');
});
btnPack.addEventListener('click', function () {
  audio.ensure();
  startGame('pack');
});
ovAgain.addEventListener('click', function () {
  audio.ensure();
  startGame(G.kind);
});
ovMenu.addEventListener('click', function () {
  audio.ensure();
  showTitle();
});

canvas.addEventListener('pointerdown', function (e) {
  audio.ensure();
  e.preventDefault();
  if (overlayOpen() && G.mode !== 'play') return;
  pointer.down = true;
  pointer.id = e.pointerId;
  pointer.y = clamp(pointerWorldY(e), Y_MIN, Y_MAX);
  fire();
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  canvas.focus({ preventScroll: true });
});
canvas.addEventListener('pointermove', function (e) {
  pointer.y = clamp(pointerWorldY(e), Y_MIN, Y_MAX);
});
function ptrUp(e) {
  if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
  pointer.down = false;
  pointer.id = null;
}
canvas.addEventListener('pointerup', ptrUp);
canvas.addEventListener('pointercancel', ptrUp);
canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

window.addEventListener('resize', resize);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resize);
}
document.addEventListener('visibilitychange', function () {
  hidden = document.hidden;
  if (!hidden) {
    lastTs = 0;
    acc = 0;
  } else {
    keys.u = keys.d = keys.fire = keys.meat = false;
    pointer.down = false;
  }
});

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

seedStars();
renderPips();
showTitle();
resize();
hudPlay();
modeLabel.textContent = '护栏';
bestEl.textContent = String(Math.max(G.bestG, G.bestP));
requestAnimationFrame(frame);

}
