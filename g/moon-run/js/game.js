'use strict';

/* 月巡 — Moon Patrol remake. No CDN. */

var VW = 640;
var VH = 360;
var GROUND = 278;
var PIT = 92;
var BUGGY_SX = 126;
var LIVES = 3;
var JUMP_V = 318;
var GRAV = 920;
var CUT_G = 1480;
var MAX_FALL = 520;
var CLASSIC_SPD = 168;
var DASH_SPD = 248;
var COYOTE = 0.09;
var BUFFER = 0.12;
var INVULN = 1.35;
var DIE_T = 0.68;
var COMBO_WIN = 1.55;
var SHOT_CD = 0.18;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var BEST_KEY = 'playbox-moon-run-best';
var MUTE_KEY = 'playbox-moon-run-mute';
var AUTO_SPEED_KEY = 'playbox-moon-run-auto-speed';
var SPEED_LABELS = ['', '慢', '中', '快', '极快'];
var AUTO_SCALE = [1, 0.48, 0.72, 1, 2.6];
var LETTERS = 'ABCDEF';
var OPS = '空格 / 上 跳 · Z / 点按 双炮 · 触屏 跳/射 · A 自动 · R 重开 · M 静音';

var ICE = [61, 184, 255];
var CYN = [0, 240, 255];
var MAG = [255, 61, 184];
var GOLD = [255, 227, 107];
var HOT = [255, 140, 64];
var WHT = [246, 243, 255];
var MINT = [92, 255, 196];

var SECTIONS = [
  { len: 1080, gap0: 96, gap1: 152, hole: 0.46, rock: 0.22, plant: 0.10, ufo: 0.00, hw0: 38, hw1: 52 },
  { len: 1160, gap0: 78, gap1: 128, hole: 0.42, rock: 0.26, plant: 0.14, ufo: 0.08, hw0: 40, hw1: 58 },
  { len: 1240, gap0: 66, gap1: 112, hole: 0.40, rock: 0.28, plant: 0.14, ufo: 0.16, hw0: 42, hw1: 64 },
  { len: 1320, gap0: 56, gap1: 98, hole: 0.38, rock: 0.32, plant: 0.16, ufo: 0.22, hw0: 44, hw1: 70 },
  { len: 1400, gap0: 50, gap1: 88, hole: 0.40, rock: 0.30, plant: 0.12, ufo: 0.30, hw0: 46, hw1: 74 },
  { len: 1480, gap0: 44, gap1: 78, hole: 0.42, rock: 0.32, plant: 0.10, ufo: 0.28, hw0: 48, hw1: 80 }
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
function hash(n) {
  n = Math.sin(n * 127.1) * 43758.5453;
  return n - Math.floor(n);
}
function rng(seed) {
  var s = seed | 0;
  return function () {
    s = Math.imul(s ^ (s >>> 15), 1 | s);
    s ^= s + Math.imul(s ^ (s >>> 7), 61 | s);
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
  };
}

function jumpApex(v, g) {
  return (v * v) / (2 * g);
}
function jumpHang(v, g) {
  return (2 * v) / g;
}
function jumpDist(speed, v, g) {
  return speed * jumpHang(v, g);
}
function hazSpan(h) {
  if (!h) return 18;
  if (h.kind === 'hole') return h.w;
  return h.w || 18;
}
function autoJumpLatest(jd, w) {
  return clamp(jd - w - 16, 18, Math.max(18, jd - 8));
}
function comboMul(c) {
  return 1 + Math.min(4, Math.floor(Math.max(0, c - 1) / 3));
}
function scrollSpeed(dash, t) {
  if (dash) return DASH_SPD + Math.min(72, t * 1.55);
  return CLASSIC_SPD;
}
function dashSpec(dist) {
  var t = clamp(dist / 14000, 0, 1);
  return {
    gap0: lerp(64, 34, t),
    gap1: lerp(110, 60, t),
    hole: 0.40,
    rock: 0.33,
    plant: 0.14,
    ufo: lerp(0.14, 0.4, t),
    hw0: 40,
    hw1: lerp(56, 80, t)
  };
}
function ufoMax(dash, sec) {
  var n = dash ? 3 : (sec < 2 ? 1 : sec < 4 ? 2 : 3);
  return n;
}

function makeHole(x, w) {
  return { kind: 'hole', x: x, w: w, rim: 8, dead: false, cleared: false };
}
function makeRock(x, tall) {
  return {
    kind: 'rock',
    x: x,
    w: tall ? 18 : 14,
    h: tall ? 22 : 14,
    hp: tall ? 2 : 1,
    dead: false,
    cleared: false
  };
}
function makePlant(x) {
  return { kind: 'plant', x: x, w: 12, h: 16, dead: false, cleared: false };
}
function makeBase(x, letter, goal) {
  return { kind: 'base', x: x, w: 54, letter: letter, goal: !!goal, hit: false, dead: false };
}
function makeShot(kind, x, y) {
  if (kind === 'air') {
    return { kind: 'air', x: x, y: y, vx: 96, vy: -540, r: 3.2, life: 0.92, dead: false };
  }
  return { kind: 'gnd', x: x, y: y, vx: 580, vy: 0, r: 3.4, life: 0.55, dead: false };
}
function dualFire(x, y) {
  return [makeShot('air', x + 6, y - 20), makeShot('gnd', x + 16, y - 8)];
}
function makeUfo(x, y, type) {
  return {
    kind: type,
    x: x,
    y: y,
    vx: type === 2 ? -78 : -52 - type * 8,
    bob: rand(0, TAU),
    hp: type === 2 ? 2 : 1,
    drop: rand(0.45, 1.1),
    drops: type === 1 ? 2 : 1,
    dead: false,
    hitT: 0
  };
}
function makeBomb(x, y) {
  return { x: x, y: y, vy: 40, spin: 0, dead: false };
}
function makePlayer() {
  return {
    y: GROUND,
    vy: 0,
    grounded: true,
    coyote: 0,
    spin: 0,
    squashX: 1,
    squashY: 1,
    tilt: 0,
    inv: 0,
    deadT: 0,
    muzzle: 0,
    px: 0,
    why: ''
  };
}

function holeOpen(h, wx) {
  return wx > h.x + h.rim && wx < h.x + h.w - h.rim;
}

function solidAtX(haz, wx) {
  var i, h;
  for (i = 0; i < haz.length; i++) {
    h = haz[i];
    if (h.kind !== 'hole' || h.dead) continue;
    if (holeOpen(h, wx)) return false;
  }
  return true;
}

function sampleGround(haz, wx) {
  return solidAtX(haz, wx) ? GROUND : GROUND + PIT;
}

function supportY(haz, x) {
  var a = sampleGround(haz, x - 13);
  var b = sampleGround(haz, x);
  var c = sampleGround(haz, x + 13);
  return Math.max(a, b, c);
}

function rockHits(r, bx, by) {
  var left = bx - 16;
  var right = bx + 16;
  var top = by - 18;
  var bot = by - 2;
  var rx0 = r.x;
  var rx1 = r.x + r.w;
  var ry0 = GROUND - r.h;
  var ry1 = GROUND;
  return right > rx0 && left < rx1 && bot > ry0 && top < ry1;
}

function jumpClearsRock(r, bx, by, grounded) {
  if (grounded) return false;
  if (by > GROUND - r.h + 5) return false;
  return bx + 16 > r.x && bx - 16 < r.x + r.w;
}

function overlapHole(h, x0, x1) {
  return x1 > h.x && x0 < h.x + h.w;
}

function placeGap(spec, r) {
  return lerp(spec.gap0, spec.gap1, r());
}

function placeHoleW(spec, r) {
  return lerp(spec.hw0, spec.hw1, r());
}

function stampHaz(haz, spec, x0, x1, r, doubles) {
  var x = x0;
  var roll, w, gap, tall, twin;
  while (x < x1) {
    gap = placeGap(spec, r);
    roll = r();
    if (roll < spec.hole) {
      w = placeHoleW(spec, r);
      twin = doubles && r() < 0.2 && x + w + 70 + w < x1;
      haz.push(makeHole(x, w));
      x += w;
      if (twin) {
        x += lerp(38, 52, r());
        w = placeHoleW(spec, r) * 0.78;
        haz.push(makeHole(x, w));
        x += w;
      }
      x += gap;
    } else if (roll < spec.hole + spec.rock) {
      tall = r() < 0.38;
      haz.push(makeRock(x, tall));
      x += (tall ? 22 : 16) + gap;
    } else if (roll < spec.hole + spec.rock + spec.plant) {
      haz.push(makePlant(x));
      x += 18 + gap * 0.7;
    } else {
      x += gap * 0.55;
    }
  }
  return x;
}

function buildClassic(seed) {
  var r = rng(seed);
  var haz = [];
  var checks = [];
  var x = 280;
  var i, spec, letter, start;
  for (i = 0; i < SECTIONS.length; i++) {
    spec = SECTIONS[i];
    letter = LETTERS.charAt(i);
    start = x + 36;
    stampHaz(haz, spec, start, start + spec.len, r, i >= 2);
    x = start + spec.len + 90;
    haz.push(makeBase(x, letter, false));
    checks.push({ x: x, letter: letter, i: i });
    x += 72;
  }
  haz.push(makeBase(x + 16, 'Z', true));
  return { haz: haz, checks: checks, endX: x + 90, startX: 80 };
}

function sectionAt(checks, x) {
  var i;
  var s = 0;
  for (i = 0; i < checks.length; i++) {
    if (x >= checks[i].x) s = i;
  }
  return s;
}

function ufoRate(dash, sec, dist) {
  if (dash) return dashSpec(dist).ufo;
  return SECTIONS[clamp(sec, 0, SECTIONS.length - 1)].ufo;
}

function whyText(w) {
  if (w === 'hole') return '栽坑了';
  if (w === 'rock') return '撞岩了';
  if (w === 'bomb') return '中弹了';
  if (w === 'ufo') return '擦机了';
  return '';
}

function selfCheck() {
  var h, d, dual, cl, i, rock, p;
  if (LIVES !== 3) throw new Error('3 lives');
  if (SECTIONS.length !== 6) throw new Error('6 sections');
  if (LETTERS.length !== 6) throw new Error('A-F');
  if (BEST_KEY !== 'playbox-moon-run-best') throw new Error('best key');
  if (AUTO_SPEED_KEY !== 'playbox-moon-run-auto-speed') throw new Error('auto speed key');
  if (SPEED_LABELS.length !== 5 || SPEED_LABELS[3] !== '快') throw new Error('speed labels');
  if (AUTO_SCALE[3] !== 1 || AUTO_SCALE[4] <= AUTO_SCALE[3]) throw new Error('auto scale');
  if (AUTO_SCALE[1] >= AUTO_SCALE[2] || AUTO_SCALE[2] >= AUTO_SCALE[3]) throw new Error('auto scale order');
  if (DASH_SPD <= CLASSIC_SPD) throw new Error('dash faster');
  h = jumpApex(JUMP_V, GRAV);
  if (h < 48 || h > 64) throw new Error('jump height window');
  d = jumpDist(CLASSIC_SPD, JUMP_V, GRAV);
  if (d < 100) throw new Error('classic jump must clear large hole');
  if (jumpDist(DASH_SPD, JUMP_V, GRAV) <= d) throw new Error('dash jump farther');
  if (d - autoJumpLatest(d, 56) < 56 + 8) throw new Error('auto jump lands past hole');
  if (autoJumpLatest(d, 80) < 18) throw new Error('auto jump still attempts wide hole');
  if (jumpDist(DASH_SPD, JUMP_V, GRAV) - autoJumpLatest(jumpDist(DASH_SPD, JUMP_V, GRAV), 80) < 80 + 8) {
    throw new Error('dash auto jump lands past hole');
  }
  if (h < 22 + 10) throw new Error('jump over tall rock');
  if (comboMul(1) !== 1) throw new Error('combo 1');
  if (comboMul(4) !== 2) throw new Error('combo 4');
  if (comboMul(7) !== 3) throw new Error('combo 7');
  if (comboMul(13) !== 5) throw new Error('combo cap 5');
  if (scrollSpeed(true, 0) <= scrollSpeed(false, 0)) throw new Error('dash spd');
  if (scrollSpeed(true, 40) <= scrollSpeed(true, 0)) throw new Error('dash ramps');
  if (dashSpec(8000).gap0 >= SECTIONS[0].gap0) throw new Error('dash denser');
  if (ufoRate(false, 0, 0) !== 0) throw new Error('A no ufo');
  if (ufoRate(false, 4, 0) <= ufoRate(false, 1, 0)) throw new Error('later more ufo');
  if (ufoMax(true, 0) < ufoMax(false, 0)) throw new Error('dash more ufos');

  dual = dualFire(100, GROUND);
  if (dual.length !== 2) throw new Error('dual shot');
  if (dual[0].kind !== 'air' || dual[1].kind !== 'gnd') throw new Error('air+gnd');
  if (dual[0].vy >= 0) throw new Error('air goes up');
  if (dual[1].vx < 400) throw new Error('gnd goes forward');

  h = makeHole(200, 56);
  if (!holeOpen(h, 228)) throw new Error('hole interior');
  if (holeOpen(h, 204)) throw new Error('hole rim solid');
  if (solidAtX([h], 228)) throw new Error('not solid in hole');
  if (!solidAtX([h], 100)) throw new Error('solid outside');
  if (supportY([h], 228) <= GROUND) throw new Error('pit support');
  if (supportY([h], 100) !== GROUND) throw new Error('ground support');

  rock = makeRock(400, true);
  p = makePlayer();
  if (!rockHits(rock, 408, GROUND)) throw new Error('rock hit grounded');
  if (jumpClearsRock(rock, 408, GROUND - 40, false) !== true) throw new Error('jump over rock');
  if (jumpClearsRock(rock, 408, GROUND, true)) throw new Error('grounded not over');

  cl = buildClassic(210);
  if (cl.checks.length !== 6) throw new Error('6 checkpoints');
  if (cl.checks[0].letter !== 'A' || cl.checks[5].letter !== 'F') throw new Error('A-F checks');
  if (cl.endX < 7000) throw new Error('course length');
  if (sectionAt(cl.checks, cl.checks[0].x) !== 0) throw new Error('sec A');
  if (sectionAt(cl.checks, cl.checks[3].x + 10) !== 3) throw new Error('sec D');
  for (i = 0; i < cl.haz.length; i++) {
    if (cl.haz[i].kind === 'base' && cl.haz[i].goal) break;
  }
  if (i >= cl.haz.length) throw new Error('goal base');
  if (!overlapHole(makeHole(10, 40), 20, 30)) throw new Error('overlap hole');
  if (SHOT_CD > 0.3) throw new Error('shot responsive');

  cl = buildClassic(210);
  d = jumpDist(CLASSIC_SPD, JUMP_V, GRAV);
  for (i = 0; i < cl.haz.length; i++) {
    h = cl.haz[i];
    if (h.kind !== 'hole') continue;
    p = h.x - autoJumpLatest(d, h.w);
    if (supportY([h], p) !== GROUND) throw new Error('auto takeoff not solid');
    if (supportY([h], p + d) !== GROUND) throw new Error('auto landing in hole');
  }
  simAutoDrive(cl, CLASSIC_SPD, 'classic');
  simAutoDrive(buildDashSim(210), DASH_SPD, 'dash');
}

function buildDashSim(seed) {
  var haz = [];
  var x = 200;
  var i, spec, r;
  for (i = 0; i < 10; i++) {
    spec = dashSpec(x);
    r = rng((i * 9973 + seed) | 0);
    stampHaz(haz, spec, x + 20, x + 740, r, i > 1);
    x += 780;
  }
  return { haz: haz, checks: [], endX: x, startX: 80 };
}

function simCanSmash(r, x, spd) {
  var collide = (r.x - 16 - x) / Math.max(40, spd);
  var fireT, travel;
  if (collide < 0.08) return false;
  fireT = (Math.max(1, r.hp) - 1) * SHOT_CD;
  travel = Math.max(0, r.x - (x + 16 + spd * fireT)) / 580;
  return fireT + travel < collide - 0.05;
}

function simAutoDrive(cl, spd, tag) {
  var haz = cl.haz;
  var x = cl.startX;
  var y = GROUND;
  var vy = 0;
  var grounded = true;
  var coyote = 0;
  var jumpHeld = false;
  var t = 0;
  var crashes = 0;
  var jd = jumpDist(spd, JUMP_V, GRAV);
  var dt = STEP;
  var i, o, h, d, latest, want, sup, span;
  while (x < cl.endX && t < 90) {
    t += dt;
    for (i = 0; i < haz.length; i++) {
      o = haz[i];
      if (o.kind === 'rock' && !o.dead && o.x - x < 36 && simCanSmash(o, o.x - 180, spd)) o.dead = true;
    }
    h = null;
    d = jd + 48;
    for (i = 0; i < haz.length; i++) {
      o = haz[i];
      if (o.dead) continue;
      if (o.kind === 'hole') {
        if (o.x - x > -16 && o.x - x < d) {
          d = o.x - x;
          h = o;
        }
      } else if (o.kind === 'rock') {
        if (o.x - x > -8 && o.x - x < 36 && !simCanSmash(o, o.x - 180, spd)) {
          d = o.x - x;
          h = o;
        }
      }
    }
    want = false;
    if (h && (grounded || coyote > 0)) {
      span = hazSpan(h);
      latest = h.kind === 'rock'
        ? clamp(spd * 0.34 - 6, 22, autoJumpLatest(jd, span))
        : autoJumpLatest(jd, span);
      if (h.x - x > -8 && h.x - x <= latest + 10) want = true;
    }
    if (grounded || coyote > 0) {
      if (supportY(haz, x) > GROUND + 4) want = true;
      else if (supportY(haz, x + 22) > GROUND + 4) want = true;
    }
    if (want && (grounded || coyote > 0)) {
      vy = -JUMP_V;
      grounded = false;
      coyote = 0;
      jumpHeld = true;
    }
    jumpHeld = !grounded;
    x += spd * dt;
    if (grounded) {
      coyote = COYOTE;
      vy = 0;
      sup = supportY(haz, x);
      if (sup > GROUND + 4) {
        grounded = false;
        vy = 30;
      } else y = GROUND;
    } else {
      coyote -= dt;
      if (!jumpHeld && vy < 0) vy += (CUT_G - GRAV) * dt;
      vy = Math.min(MAX_FALL, vy + GRAV * dt);
      y += vy * dt;
      sup = supportY(haz, x);
      if (vy >= 0 && y >= sup) {
        if (sup > GROUND + 4) {
          y = Math.max(y, sup * 0.02 + GROUND);
        } else {
          y = GROUND;
          vy = 0;
          grounded = true;
        }
      }
    }
    if (y > GROUND + 16) {
      crashes += 1;
      x += 50;
      y = GROUND;
      vy = 0;
      grounded = true;
    }
    for (i = 0; i < haz.length; i++) {
      o = haz[i];
      if (o.kind === 'rock' && !o.dead && rockHits(o, x, y)) {
        crashes += 1;
        x = o.x + o.w + 24;
        y = GROUND;
        vy = 0;
        grounded = true;
      }
    }
  }
  if (x < cl.endX - 80) throw new Error('auto sim stalled ' + tag);
  if (crashes > 4) throw new Error('auto sim crashes ' + crashes + ' ' + tag);
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
var btnClassic = document.getElementById('btn-classic');
var btnDash = document.getElementById('btn-dash');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnAuto = document.getElementById('btn-auto');
var speedEl = document.getElementById('speed');
var speedLab = document.getElementById('speed-lab');
var btnJump = document.getElementById('btn-jump');
var btnShot = document.getElementById('btn-shot');
var scoreEl = document.getElementById('score');
var distEl = document.getElementById('dist');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var secLabel = document.getElementById('sec-label');
var courseBar = document.getElementById('course-bar');
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

var particles = [];
var sparks = [];
var floats = [];
var rings = [];
var shards = [];
var stars = [];

var keys = { jump: false, shot: false };
var autoOn = false;
var autoSpeed = 3;
var G = {
  mode: 'title',
  kind: 'classic',
  dash: false,
  clock: 0,
  x: 80,
  endX: 8000,
  haz: [],
  checks: [],
  ufos: [],
  bombs: [],
  shots: [],
  player: makePlayer(),
  lives: LIVES,
  score: 0,
  bestC: 0,
  bestD: 0,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  distScore: 0,
  section: 0,
  checkX: 40,
  genX: 0,
  chunk: 0,
  ufoCd: 1.6,
  shotCd: 0,
  jumpBuf: 0,
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flash: 0,
  flashRgb: ICE,
  lock: 0,
  why: '',
  holdShot: false,
  winTok: 0,
  bestAge: 0
};

function reduceMotion() {
  return motionQ.matches;
}

function initStars() {
  var i;
  stars.length = 0;
  for (i = 0; i < 78; i++) {
    stars.push({
      x: Math.random() * VW,
      y: Math.random() * (GROUND - 40),
      r: Math.random() < 0.18 ? 1.4 : 0.7,
      a: rand(0.25, 0.9),
      p: rand(0.04, 0.22),
      ph: rand(0, TAU)
    });
  }
}
initStars();

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
    this.beep(270, 0.07, 'square', 0.055, 540);
    this.noise(0.04, 0.04, 1700, 'highpass');
  },
  land: function () {
    this.ensure();
    this.noise(0.05, 0.055, 340, 'bandpass');
    this.beep(150, 0.04, 'sine', 0.03, 70);
  },
  shoot: function () {
    this.ensure();
    this.beep(880, 0.05, 'square', 0.05, 420);
    this.beep(240, 0.07, 'sawtooth', 0.04, 90);
    this.noise(0.04, 0.035, 2200, 'highpass');
  },
  airHit: function (combo) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.06;
    this.beep(520 * p, 0.07, 'square', 0.06, 920 * p);
    this.beep(780 * p, 0.1, 'triangle', 0.04, 1200 * p);
    this.noise(0.07, 0.06, 1800, 'highpass');
  },
  gndHit: function (combo) {
    this.ensure();
    var p = 1 + Math.min(6, combo) * 0.05;
    this.noise(0.08, 0.08, 280, 'lowpass');
    this.beep(210 * p, 0.08, 'square', 0.05, 80);
  },
  jumpOver: function (combo) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.07;
    this.beep(440 * p, 0.07, 'square', 0.065, 760 * p);
    this.beep(660 * p, 0.1, 'triangle', 0.045, 980 * p);
  },
  bomb: function () {
    this.ensure();
    this.noise(0.12, 0.1, 240, 'lowpass');
    this.beep(160, 0.1, 'sawtooth', 0.045, 60);
  },
  check: function () {
    this.ensure();
    this.beep(392, 0.08, 'square', 0.05, 523);
    this.beep(523, 0.1, 'square', 0.05, 659);
    this.beep(784, 0.16, 'triangle', 0.045, 1046);
  },
  die: function () {
    this.ensure();
    this.noise(0.18, 0.12, 260, 'lowpass');
    this.beep(300, 0.22, 'sawtooth', 0.06, 70);
    this.beep(160, 0.2, 'square', 0.04, 50);
  },
  over: function () {
    this.ensure();
    this.beep(196, 0.18, 'sawtooth', 0.05, 98);
    this.beep(130, 0.28, 'square', 0.04, 60);
  },
  win: function () {
    this.ensure();
    this.beep(523, 0.1, 'square', 0.055, 659);
    this.beep(659, 0.12, 'square', 0.05, 784);
    this.beep(1046, 0.22, 'triangle', 0.05, 1318);
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

function loadAutoSpeed() {
  try {
    var n = parseInt(localStorage.getItem(AUTO_SPEED_KEY) || '3', 10);
    if (!isFinite(n) || n < 1 || n > 4) return 3;
    return n;
  } catch (e) {
    return 3;
  }
}

function saveAutoSpeed(n) {
  try { localStorage.setItem(AUTO_SPEED_KEY, String(n)); } catch (e) { /* ignore */ }
}

try {
  if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
} catch (e) { /* ignore */ }
autoSpeed = loadAutoSpeed();

function loadBest() {
  try {
    var s = localStorage.getItem(BEST_KEY);
    var o = JSON.parse(s);
    if (o && typeof o === 'object') {
      G.bestC = o.c | 0;
      G.bestD = o.d | 0;
      return;
    }
    if (typeof o === 'number') {
      G.bestC = o | 0;
      G.bestD = o | 0;
    }
  } catch (e) { /* ignore */ }
}

function persistBest() {
  var cur = G.dash ? G.bestD : G.bestC;
  if (G.score <= cur) return;
  if (G.dash) G.bestD = G.score;
  else G.bestC = G.score;
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ c: G.bestC, d: G.bestD }));
  } catch (e) { /* ignore */ }
}

function currentBest() {
  return G.dash ? G.bestD : G.bestC;
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
  if (particles.length > 140) particles.splice(0, 40);
  for (i = 0; i < n; i++) {
    particles.push({
      x: x, y: y,
      vx: rand(-1, 1) * spd,
      vy: rand(-1.15, 0.25) * spd,
      t: life * rand(0.55, 1.2),
      max: life,
      r: rand(1.1, 2.5),
      rgb: rgb,
      g: grav || 22
    });
  }
}

function spark(x, y, n, rgb) {
  var i;
  for (i = 0; i < n; i++) {
    sparks.push({
      x: x, y: y,
      vx: rand(-1, 1) * 90,
      vy: rand(-80, -10),
      t: rand(0.12, 0.28),
      rgb: rgb
    });
  }
}

function ring(x, y, rgb) {
  rings.push({ x: x, y: y, r: 6, t: 0, rgb: rgb });
}

function floatScore(x, y, n, rgb) {
  floats.push({ x: x, y: y - 10, t: 0, n: '+' + n, rgb: rgb || GOLD });
}

function toast(msg, warn, gold) {
  toastEl.textContent = msg;
  toastEl.classList.toggle('warn', !!warn);
  toastEl.classList.toggle('gold', !!gold);
  toastEl.classList.remove('hidden');
  clearTimeout(toastTok);
  toastTok = setTimeout(function () { toastEl.classList.add('hidden'); }, 1100);
}

function popScore(n) {
  scoreBox.classList.remove('flash');
  void scoreBox.offsetWidth;
  scoreBox.classList.add('flash');
  scoreAdd.hidden = false;
  scoreAdd.textContent = '+' + n;
  clearTimeout(addTok);
  addTok = setTimeout(function () { scoreAdd.hidden = true; }, 700);
}

function popCombo() {
  comboBox.classList.remove('hot');
  void comboBox.offsetWidth;
  comboBox.classList.add('hot');
}

function boardDie() {
  stageEl.classList.remove('die');
  void stageEl.offsetWidth;
  stageEl.classList.add('die');
  setTimeout(function () { stageEl.classList.remove('die'); }, 360);
}

function boardHit() {
  stageEl.classList.remove('hit');
  void stageEl.offsetWidth;
  stageEl.classList.add('hit');
  setTimeout(function () { stageEl.classList.remove('hit'); }, 180);
}

function renderPips() {
  var i, el;
  if (!pipsEl.childNodes.length) {
    for (i = 0; i < LIVES; i++) {
      el = document.createElement('i');
      el.className = 'pip on';
      pipsEl.appendChild(el);
    }
  }
  for (i = 0; i < LIVES; i++) {
    el = pipsEl.childNodes[i];
    el.classList.toggle('on', i < G.lives);
    el.classList.toggle('gone', i >= G.lives);
  }
}

function meters() {
  return Math.floor(Math.max(0, G.x) / 10);
}

function courseProg() {
  if (G.dash) return clamp((G.x % 2000) / 2000, 0, 1);
  return clamp(G.x / Math.max(1, G.endX), 0, 1);
}

function hudPlay() {
  scoreEl.textContent = String(G.score | 0);
  distEl.textContent = String(meters());
  bestEl.textContent = String(currentBest());
  comboEl.textContent = '×' + Math.max(1, G.combo);
  modeLabel.textContent = G.dash ? '疾驰' : '经典';
  modeLabel.classList.toggle('dash', G.dash);
  if (G.dash) secLabel.textContent = meters() + ' m';
  else secLabel.textContent = '路段 ' + LETTERS.charAt(G.section);
  courseBar.style.transform = 'scaleX(' + courseProg() + ')';
  renderPips();
  if (G.mode === 'play') {
    if (autoOn) {
      hintEl.textContent = '托管中 · A 停下 · ' + (G.dash ? '疾驰' : '经典');
    } else {
      hintEl.textContent = G.dash
        ? '疾驰 · 更快更密 · 空格跳 · Z 双炮 · R 重开'
        : '跳过陨坑 · 双炮打飞碟和石头 · 炸弹会炸出新坑';
    }
  }
}

function addScore(n, x, y, rgb) {
  var m;
  if (G.mode !== 'play' || n <= 0) return;
  m = Math.round(n);
  G.score += m;
  persistBest();
  popScore(m);
  if (x != null) floatScore(x, y, m, rgb);
  hudPlay();
}

function bumpCombo() {
  G.combo += 1;
  if (G.combo > G.maxCombo) G.maxCombo = G.combo;
  G.comboAge = 0;
  comboEl.textContent = '×' + Math.max(1, G.combo);
  popCombo();
}

/* ---- world ---- */
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

function wipeRun() {
  G.ufos = [];
  G.bombs = [];
  G.shots = [];
  G.player = makePlayer();
  G.ufoCd = 1.2;
  G.shotCd = 0;
  G.jumpBuf = 0;
  G.combo = 0;
  G.comboAge = 0;
  G.lock = 0;
}

function nextSolid(x) {
  var n = 0;
  while (!solidAtX(G.haz, x) && n < 240) {
    x += 6;
    n++;
  }
  return x + 12;
}

function genDashChunk() {
  var spec = dashSpec(G.genX);
  var r = rng((G.chunk * 9973 + 210) | 0);
  var x0 = G.genX;
  var x1 = G.genX + 780;
  if (G.chunk % 3 === 0) {
    G.haz.push(makeBase(x0, String((G.chunk / 3 | 0) + 1), false));
    x0 += 64;
  }
  stampHaz(G.haz, spec, x0 + 20, x1 - 40, r, G.chunk > 1);
  G.genX = x1;
  G.chunk += 1;
}

function ensureWorld() {
  var i, h;
  if (G.dash) {
    while (G.genX < G.x + VW + 480) genDashChunk();
  }
  for (i = G.haz.length - 1; i >= 0; i--) {
    h = G.haz[i];
    if (h.kind === 'base' && !h.goal) {
      if (h.x + 54 < G.x - 420 && h.x < G.checkX - 8) G.haz.splice(i, 1);
      continue;
    }
    if (h.x + (h.w || 20) < G.x - 280) G.haz.splice(i, 1);
  }
}

function loadCourse(attract) {
  var cl;
  wipeRun();
  if (!attract) resetFx();
  G.section = 0;
  G.checkX = 40;
  G.chunk = 0;
  if (G.dash) {
    G.haz = [];
    G.checks = [];
    G.genX = 200;
    G.endX = 1e9;
    G.x = 80;
    genDashChunk();
    genDashChunk();
  } else {
    cl = buildClassic(attract ? 77 : 210);
    G.haz = cl.haz;
    G.checks = cl.checks;
    G.endX = cl.endX;
    G.x = cl.startX;
  }
  G.player.px = G.x;
}

function startRun(kind) {
  G.kind = kind;
  G.dash = kind === 'dash';
  G.mode = 'play';
  G.clock = 0;
  G.lives = LIVES;
  G.score = 0;
  G.distScore = 0;
  G.combo = 0;
  G.maxCombo = 0;
  G.why = '';
  G.winTok += 1;
  G.lock = 0;
  loadCourse(false);
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  panelEl.className = 'panel';
  audio.start();
  hudPlay();
  toast(G.dash ? '疾驰' : '路段 A', false, !G.dash);
  canvas.focus({ preventScroll: true });
}

function showTitle() {
  G.mode = 'title';
  G.dash = false;
  G.kind = 'classic';
  G.winTok += 1;
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel';
  ovKicker.textContent = 'MOON';
  ovTitle.textContent = '月巡';
  ovLead.textContent = '月面车自己往前开。空格跳过陨坑，Z 同时打天上和地上。栽进坑里就炸。';
  ovOps.textContent = OPS;
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
  hintEl.textContent = '跳过陨坑 · 双炮打飞碟和石头 · 炸弹会炸出新坑';
  G.lives = LIVES;
  loadCourse(true);
  hudPlay();
}

function showOver(win) {
  G.mode = win ? 'win' : 'over';
  persistBest();
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = win ? 'panel win' : 'panel lose';
  ovKicker.textContent = win ? 'CLEAR' : 'MOON';
  ovTitle.textContent = win ? '巡成' : '炸车';
  ovLead.textContent = (G.dash ? '疾驰' : '经典') + ' · ' + meters() + ' m · ' + G.score + ' 分 · 连击最高 ×' +
    Math.max(1, G.maxCombo) + (G.why && !win ? ' · ' + whyText(G.why) : '');
  ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
  if (win) audio.win();
  else audio.over();
  ovRetry.focus();
}

function retry() {
  audio.ui();
  if (G.mode === 'title') startRun('classic');
  else startRun(G.kind);
}

function cam() {
  return G.x - BUGGY_SX;
}

function sx(x) {
  return x - cam();
}

/* ---- actions ---- */
function doJump() {
  var p = G.player;
  if (!p.grounded && p.coyote <= 0) return false;
  if (p.deadT > 0) return false;
  p.vy = -JUMP_V;
  p.grounded = false;
  p.coyote = 0;
  p.squashX = 0.84;
  p.squashY = 1.22;
  G.jumpBuf = 0;
  burst(G.x - 10, GROUND, 6, ICE, 40, 0.28, 30);
  spark(G.x, GROUND, 4, CYN);
  if (G.mode === 'play') {
    audio.hop();
    hitStop(0.028);
    kick(1.6);
  }
  return true;
}

function fire() {
  var p = G.player;
  var dual, i;
  if (p.deadT > 0) return;
  if (G.shotCd > 0) return;
  if (G.shots.length > 7) return;
  dual = dualFire(G.x, p.y);
  for (i = 0; i < dual.length; i++) G.shots.push(dual[i]);
  G.shotCd = SHOT_CD;
  p.muzzle = 0.09;
  p.squashX = 1.1;
  p.squashY = 0.92;
  flash(CYN, 0.045);
  burst(G.x + 18, p.y - 8, 4, GOLD, 50, 0.16, 8);
  burst(G.x + 6, p.y - 20, 4, CYN, 46, 0.16, 4);
  if (G.mode === 'play') audio.shoot();
}

function scoreClear(h) {
  var n, mul;
  if (G.mode !== 'play') return;
  bumpCombo();
  mul = comboMul(G.combo);
  n = (h.kind === 'hole' ? 60 : 40) * mul;
  addScore(n, h.x + (h.w || 8) * 0.5, GROUND - 24, GOLD);
  ring(h.x + (h.w || 8) * 0.5, GROUND - 8, CYN);
  audio.jumpOver(G.combo);
  hitStop(0.05);
  kick(2.2);
}

function killHaz(h, air) {
  var n, mul, rgb;
  h.dead = true;
  bumpCombo();
  mul = comboMul(G.combo);
  if (h.kind === 'rock') n = (h.h > 16 ? 90 : 70) * mul;
  else if (h.kind === 'plant') n = 110 * mul;
  else n = 50 * mul;
  rgb = air ? CYN : GOLD;
  addScore(n, h.x + (h.w || 8) * 0.5, GROUND - h.h, rgb);
  burst(h.x + 6, GROUND - 8, 12, rgb, 70, 0.32, 28);
  spark(h.x, GROUND - 10, 6, rgb);
  ring(h.x + 6, GROUND - 10, rgb);
  if (air) audio.airHit(G.combo);
  else audio.gndHit(G.combo);
  hitStop(0.048);
  shake(3.2);
  boardHit();
}

function killUfo(u) {
  var n, mul, rgb;
  u.dead = true;
  bumpCombo();
  mul = comboMul(G.combo);
  n = (u.kind === 2 ? 400 : u.kind === 1 ? 300 : 200) * mul;
  rgb = u.kind === 2 ? MAG : GOLD;
  addScore(n, u.x, u.y, rgb);
  burst(u.x, u.y, 16, rgb, 90, 0.4, 12);
  burst(u.x, u.y, 8, CYN, 60, 0.28, 6);
  spark(u.x, u.y, 10, WHT);
  ring(u.x, u.y, rgb);
  audio.airHit(G.combo);
  hitStop(0.062);
  shake(4.5);
  flash(GOLD, 0.07);
  boardHit();
}

function explodeBomb(b, makeHole) {
  var hole, i, h, ok;
  b.dead = true;
  burst(b.x, b.y, 14, HOT, 80, 0.34, 24);
  spark(b.x, b.y, 8, GOLD);
  ring(b.x, b.y, MAG);
  audio.bomb();
  shake(3.5);
  if (G.mode === 'play' && hypot(b.x - G.x, b.y - (G.player.y - 10)) < 26) {
    crash('bomb');
    return;
  }
  if (!makeHole || G.mode === 'title') return;
  ok = true;
  for (i = 0; i < G.haz.length; i++) {
    h = G.haz[i];
    if (h.kind === 'base' && Math.abs(h.x + 20 - b.x) < 50) ok = false;
    if (h.kind === 'hole' && overlapHole(h, b.x - 24, b.x + 24)) ok = false;
  }
  if (!ok) return;
  hole = makeHole(b.x - 24, 48);
  G.haz.push(hole);
}

function crash(why) {
  var p = G.player;
  var i;
  if (G.mode === 'title') {
    G.x = nextSolid(G.x + 40);
    p.y = GROUND;
    p.vy = 0;
    p.grounded = true;
    p.deadT = 0;
    return;
  }
  if (G.mode !== 'play') return;
  if (p.inv > 0 || p.deadT > 0) return;
  p.deadT = DIE_T;
  p.why = why;
  G.why = why;
  G.combo = 0;
  G.comboAge = 0;
  G.lives -= 1;
  hudPlay();
  burst(G.x, p.y - 10, 22, MAG, 110, 0.5, 30);
  burst(G.x, p.y - 8, 12, GOLD, 80, 0.36, 18);
  ring(G.x, p.y - 12, MAG);
  for (i = 0; i < 8; i++) {
    shards.push({
      x: G.x + rand(-10, 10),
      y: p.y - rand(4, 16),
      vx: rand(-70, 90),
      vy: rand(-180, -40),
      t: rand(0.4, 0.7),
      w: rand(4, 9),
      rgb: i & 1 ? CYN : ICE,
      rot: rand(0, TAU),
      vr: rand(-8, 8)
    });
  }
  flash(MAG, 0.14);
  hitStop(0.08);
  shake(9);
  boardDie();
  audio.die();
}

function respawn() {
  var p = G.player;
  if (G.lives <= 0) {
    showOver(false);
    return;
  }
  G.x = nextSolid(Math.max(G.checkX + 28, G.x + 18));
  p.y = GROUND;
  p.vy = 0;
  p.grounded = true;
  p.deadT = 0;
  p.inv = INVULN;
  p.tilt = 0;
  p.squashX = 1;
  p.squashY = 1;
  G.shots = [];
  toast('重启', true, false);
}

function doCheck(b) {
  var n, idx;
  if (b.hit) return;
  b.hit = true;
  if (b.goal && !G.dash) {
    if (G.mode === 'play') {
      addScore(2000, b.x, GROUND - 40, GOLD);
      hitStop(0.07);
      shake(4);
      flash(GOLD, 0.12);
      audio.check();
      toast('巡成', false, true);
      G.lock = 0.55;
      G.player.inv = 9;
      G.winTok += 1;
      (function (tok) {
        setTimeout(function () {
          if (tok !== G.winTok) return;
          if (G.mode === 'play') showOver(true);
        }, 560);
      })(G.winTok);
    }
    return;
  }
  G.checkX = b.x;
  if (!G.dash) {
    idx = LETTERS.indexOf(b.letter);
    if (idx >= 0) G.section = Math.min(SECTIONS.length - 1, idx + 1);
  }
  n = 400 + G.section * 150;
  if (G.mode === 'play') {
    addScore(n, b.x + 20, GROUND - 36, MINT);
    audio.check();
    hitStop(0.04);
    kick(2);
    flash(CYN, 0.06);
    ring(b.x + 24, GROUND - 20, GOLD);
    toast(G.dash ? '补给 ' + b.letter : '检查点 ' + b.letter, false, true);
    hudPlay();
  }
}

function spawnUfo() {
  var type, y, u;
  var sec = G.section;
  var rate = ufoRate(G.dash, sec, G.x);
  if (rate <= 0 && !G.dash) return;
  if (G.ufos.length >= ufoMax(G.dash, sec)) return;
  type = Math.random() < 0.22 ? 2 : Math.random() < 0.45 ? 1 : 0;
  if (!G.dash && sec < 3 && type === 2) type = 0;
  y = rand(58, 128);
  u = makeUfo(cam() + VW + 28, y, type);
  if (Math.random() < 0.35) u.vx = rand(-30, 20);
  G.ufos.push(u);
}

function shotsOnRock(r) {
  var n = 0, i, s;
  if (!G.shots) return 0;
  for (i = 0; i < G.shots.length; i++) {
    s = G.shots[i];
    if (!s || s.dead || s.kind !== 'gnd') continue;
    if (s.x < r.x + r.w + 10 && s.x + s.vx * s.life > r.x - 6) n++;
  }
  return n;
}

function shotsBlocking(r) {
  var extra = 0, i, h;
  for (i = 0; i < G.haz.length; i++) {
    h = G.haz[i];
    if (h.dead || h === r) continue;
    if (h.kind !== 'plant' && h.kind !== 'rock') continue;
    if (h.x > G.x - 4 && h.x < r.x) extra += h.kind === 'rock' ? Math.max(1, h.hp) : 1;
  }
  return extra;
}

function canSmashRock(r, spd) {
  var collide, fireT, arrive, travel, need;
  if (!r || r.kind !== 'rock' || r.dead) return false;
  collide = (r.x - 16 - G.x) / Math.max(40, spd);
  if (collide < 0.08) return false;
  need = Math.max(1, r.hp) + shotsBlocking(r);
  fireT = Math.max(0, G.shotCd) + (need - 1) * SHOT_CD;
  arrive = G.x + 16 + spd * fireT;
  travel = Math.max(0, r.x - arrive) / 580;
  return fireT + travel < collide - 0.05;
}

function bombLandT(b) {
  var dist = (GROUND - 4) - b.y;
  var disc;
  if (dist <= 0) return 0;
  disc = b.vy * b.vy + 840 * dist;
  if (disc < 0) return -1;
  return (-b.vy + Math.sqrt(disc)) / 420;
}

function pickJumpHaz(jd, spd) {
  var i, h, d, best, bd, b, tLand, hx;
  bd = jd + 48;
  best = null;
  for (i = 0; i < G.haz.length; i++) {
    h = G.haz[i];
    if (h.dead) continue;
    if (h.kind === 'hole') {
      d = h.x - G.x;
      if (d > -12 && d < bd) {
        bd = d;
        best = h;
      }
    } else if (h.kind === 'rock') {
      d = h.x - G.x;
      if (d > -8 && d < 36 && !canSmashRock(h, spd) && !shotsOnRock(h)) {
        bd = d;
        best = h;
      }
    }
  }
  for (i = 0; i < G.bombs.length; i++) {
    b = G.bombs[i];
    if (b.dead) continue;
    if (b.x - G.x > -28 && b.x - G.x < 92 && b.y < GROUND - 8) continue;
    tLand = bombLandT(b);
    if (tLand < 0 || tLand > 0.9) continue;
    if (Math.abs((G.x + spd * tLand) - b.x) > 50) continue;
    hx = b.x - 24;
    d = hx - G.x;
    if (d > 8 && d < bd) {
      bd = d;
      best = { kind: 'hole', x: hx, w: 48, dead: false };
    }
  }
  return best;
}

function wantShotAt(spd) {
  var i, u, b, h, dx;
  for (i = 0; i < G.ufos.length; i++) {
    u = G.ufos[i];
    if (u.dead) continue;
    dx = u.x - G.x;
    if (dx > -30 && dx < (u.kind === 2 ? 230 : 155) && u.y < 180) return true;
  }
  for (i = 0; i < G.bombs.length; i++) {
    b = G.bombs[i];
    if (b.dead) continue;
    dx = b.x - G.x;
    if (dx > -28 && dx < 210 && b.y < GROUND - 2) return true;
  }
  for (i = 0; i < G.haz.length; i++) {
    h = G.haz[i];
    if (h.dead || h.kind !== 'rock') continue;
    dx = h.x - G.x;
    if (dx > -8 && dx < 250) return true;
  }
  return false;
}

function autoPlay() {
  var p = G.player;
  var spd, jd, h, d, latest, span, wantJump, wantShot;
  if (p.deadT > 0 || G.lock > 0) {
    keys.jump = false;
    G.holdShot = false;
    return;
  }
  spd = scrollSpeed(G.dash, G.clock);
  jd = jumpDist(spd, JUMP_V, GRAV);
  wantJump = false;
  h = pickJumpHaz(jd, spd);
  if (h && (p.grounded || p.coyote > 0)) {
    span = hazSpan(h);
    d = h.x - G.x;
    latest = h.kind === 'rock'
      ? clamp(spd * 0.34 - 6, 22, autoJumpLatest(jd, span))
      : autoJumpLatest(jd, span);
    if (d > -8 && d <= latest + 10) wantJump = true;
  }
  if (p.grounded || p.coyote > 0) {
    if (supportY(G.haz, G.x) > GROUND + 4) wantJump = true;
    else if (supportY(G.haz, G.x + 22) > GROUND + 4) wantJump = true;
  }
  wantShot = wantShotAt(spd);

  if (wantJump) {
    G.jumpBuf = BUFFER;
    keys.jump = true;
  } else if (!p.grounded) {
    keys.jump = true;
  } else {
    keys.jump = false;
  }

  G.holdShot = wantShot;
  if (wantShot) fire();
}

function autoScale() {
  if (!autoOn || G.mode !== 'play') return 1;
  return AUTO_SCALE[autoSpeed] || 1;
}

function clearAutoInput() {
  keys.jump = false;
  keys.shot = false;
  G.holdShot = false;
  G.jumpBuf = 0;
  btnJump.classList.remove('held');
  btnShot.classList.remove('held');
}

function syncAutoUi() {
  btnAuto.classList.toggle('on', autoOn);
  btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
  btnAuto.textContent = autoOn ? '停下' : '自动';
  btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
}

function syncSpeedUi() {
  speedEl.value = String(autoSpeed);
  speedLab.textContent = SPEED_LABELS[autoSpeed];
  speedEl.title = SPEED_LABELS[autoSpeed];
  speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
}

function toggleAuto() {
  autoOn = !autoOn;
  clearAutoInput();
  syncAutoUi();
  if (autoOn) {
    audio.ensure();
    if (G.mode === 'title') startRun('classic');
  }
  hudPlay();
}

function setAutoSpeed(n) {
  if (n < 1 || n > 4 || !isFinite(n)) n = 3;
  autoSpeed = n;
  saveAutoSpeed(autoSpeed);
  syncSpeedUi();
}

/* ---- sim ---- */
function tickPlayer(dt) {
  var p = G.player;
  var sup, spd, falling;
  p.px = G.x;
  if (p.deadT > 0) {
    p.deadT -= dt;
    p.vy = Math.min(MAX_FALL, p.vy + GRAV * dt);
    p.y += p.vy * dt;
    p.tilt += 3.4 * dt;
    if (p.deadT <= 0) respawn();
    return;
  }
  if (p.inv > 0) p.inv -= dt;
  if (G.shotCd > 0) G.shotCd -= dt;
  if (p.muzzle > 0) p.muzzle -= dt;
  if (G.lock > 0) {
    G.lock -= dt;
    return;
  }

  if (G.jumpBuf > 0) {
    G.jumpBuf -= dt;
    if (p.grounded || p.coyote > 0) doJump();
  }

  spd = scrollSpeed(G.dash, G.clock);
  G.x += spd * dt;
  p.spin += spd * dt * 0.18;

  if (p.grounded) {
    p.coyote = COYOTE;
    p.vy = 0;
    sup = supportY(G.haz, G.x);
    if (sup > GROUND + 4) {
      p.grounded = false;
      p.vy = 30;
    } else {
      p.y = GROUND;
    }
  } else {
    p.coyote -= dt;
    if (!keys.jump && p.vy < 0) p.vy += (CUT_G - GRAV) * dt;
    p.vy = Math.min(MAX_FALL, p.vy + GRAV * dt);
    p.y += p.vy * dt;
    sup = supportY(G.haz, G.x);
    if (p.vy >= 0 && p.y >= sup) {
      if (sup > GROUND + 4) {
        p.y = Math.max(p.y, sup * 0.02 + GROUND);
      } else {
        p.y = GROUND;
        p.vy = 0;
        p.grounded = true;
        p.squashX = 1.24;
        p.squashY = 0.72;
        burst(G.x, GROUND, 5, ICE, 32, 0.22, 18);
        if (G.mode === 'play') audio.land();
      }
    }
  }

  if (p.y > GROUND + 16) crash('hole');

  falling = !p.grounded && supportY(G.haz, G.x) > GROUND + 4;
  p.tilt = lerp(p.tilt, falling ? 0.42 : (!p.grounded ? -0.12 : 0), 1 - Math.pow(0.001, dt));
  p.squashX = lerp(p.squashX, 1, 1 - Math.pow(0.0003, dt));
  p.squashY = lerp(p.squashY, 1, 1 - Math.pow(0.0003, dt));

  if (p.grounded && Math.random() < 0.2) {
    particles.push({
      x: G.x - 16, y: GROUND - 2,
      vx: rand(-40, -10), vy: rand(-18, -4),
      t: 0.22, max: 0.22, r: rand(0.8, 1.6),
      rgb: ICE, g: 30
    });
  }
}

function tickClears() {
  var p = G.player;
  var i, h, mid;
  if (p.deadT > 0 || p.grounded) return;
  for (i = 0; i < G.haz.length; i++) {
    h = G.haz[i];
    if (h.dead || h.cleared) continue;
    if (h.kind === 'hole') {
      mid = h.x + h.w * 0.5;
      if (p.px < mid && G.x >= mid && p.y < GROUND - 8) {
        h.cleared = true;
        scoreClear(h);
      }
    } else if (h.kind === 'rock') {
      if (jumpClearsRock(h, G.x, p.y, false) && p.px < h.x + h.w && G.x >= h.x) {
        h.cleared = true;
        scoreClear(h);
      }
    }
  }
}

function tickHazards() {
  var p = G.player;
  var i, h;
  if (p.deadT > 0 || p.inv > 0) return;
  for (i = 0; i < G.haz.length; i++) {
    h = G.haz[i];
    if (h.dead) continue;
    if (h.kind === 'rock') {
      if (rockHits(h, G.x, p.y)) {
        crash('rock');
        return;
      }
    } else if (h.kind === 'plant') {
      if (p.grounded && G.x + 14 > h.x && G.x - 10 < h.x + h.w) {
        h.dead = true;
        burst(h.x, GROUND - 8, 7, MINT, 40, 0.24, 16);
        if (G.mode === 'play') addScore(25, h.x, GROUND - 18, MINT);
      }
    } else if (h.kind === 'base') {
      if (!h.hit && G.x > h.x + 16) doCheck(h);
    }
  }
}

function tickShots(dt) {
  var i, s;
  for (i = G.shots.length - 1; i >= 0; i--) {
    s = G.shots[i];
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
    if (s.kind === 'gnd') s.y = GROUND - 9;
    if (s.dead || s.life <= 0 || s.y < -20 || sx(s.x) > VW + 40) {
      G.shots.splice(i, 1);
    }
  }
}

function tickUfos(dt) {
  var i, u, p, rate;
  p = G.player;
  rate = ufoRate(G.dash, G.section, G.x);
  G.ufoCd -= dt;
  if (G.ufoCd <= 0) {
    if (rate > 0 || G.dash) spawnUfo();
    G.ufoCd = lerp(2.6, 0.85, clamp(rate / 0.4, 0, 1)) * rand(0.7, 1.25);
    if (G.dash) G.ufoCd *= 0.72;
  }
  for (i = G.ufos.length - 1; i >= 0; i--) {
    u = G.ufos[i];
    if (u.dead) {
      G.ufos.splice(i, 1);
      continue;
    }
    u.bob += dt * (1.6 + u.kind);
    u.x += u.vx * dt;
    if (u.kind === 2) {
      u.y += Math.sin(u.bob * 1.4) * 18 * dt;
      if (u.x < G.x + 220 && u.y < 160) u.y += 12 * dt;
    } else {
      u.y += Math.sin(u.bob) * 22 * dt;
    }
    u.y = clamp(u.y, 40, 168);
    if (u.hitT > 0) u.hitT -= dt;
    u.drop -= dt;
    if (u.drop <= 0 && u.drops > 0 && u.x < cam() + VW - 40 && u.x > G.x + 30) {
      G.bombs.push(makeBomb(u.x, u.y + 10));
      u.drops -= 1;
      u.drop = u.kind === 1 ? 0.55 : 1.4;
    }
    if (sx(u.x) < -40) {
      G.ufos.splice(i, 1);
      continue;
    }
    if (p.deadT <= 0 && p.inv <= 0 && hypot(u.x - G.x, u.y - (p.y - 12)) < 20) {
      crash('ufo');
    }
  }
}

function tickBombs(dt) {
  var i, b;
  for (i = G.bombs.length - 1; i >= 0; i--) {
    b = G.bombs[i];
    if (b.dead) {
      G.bombs.splice(i, 1);
      continue;
    }
    b.vy += 420 * dt;
    b.y += b.vy * dt;
    b.spin += 8 * dt;
    if (b.y >= GROUND - 4) {
      explodeBomb(b, true);
      G.bombs.splice(i, 1);
    }
  }
}

function collideShots() {
  var i, j, s, h, u, b, hit;
  for (i = 0; i < G.shots.length; i++) {
    s = G.shots[i];
    if (s.dead) continue;
    if (s.kind === 'air') {
      for (j = 0; j < G.ufos.length; j++) {
        u = G.ufos[j];
        if (u.dead) continue;
        if (hypot(s.x - u.x, s.y - u.y) < 16) {
          s.dead = true;
          u.hp -= 1;
          u.hitT = 0.08;
          burst(s.x, s.y, 6, CYN, 50, 0.18, 4);
          if (u.hp <= 0) killUfo(u);
          else {
            audio.airHit(G.combo);
            hitStop(0.03);
          }
          break;
        }
      }
      if (s.dead) continue;
      for (j = 0; j < G.bombs.length; j++) {
        b = G.bombs[j];
        if (b.dead) continue;
        if (hypot(s.x - b.x, s.y - b.y) < 10) {
          s.dead = true;
          explodeBomb(b, false);
          bumpCombo();
          addScore(50 * comboMul(G.combo), b.x, b.y, GOLD);
          break;
        }
      }
    } else {
      hit = false;
      for (j = 0; j < G.haz.length; j++) {
        h = G.haz[j];
        if (h.dead) continue;
        if (h.kind !== 'rock' && h.kind !== 'plant') continue;
        if (s.x > h.x - 2 && s.x < h.x + h.w + 8 && s.y > GROUND - h.h - 8) {
          s.dead = true;
          if (h.kind === 'rock') {
            h.hp -= 1;
            burst(h.x + 6, GROUND - 8, 6, GOLD, 40, 0.2, 14);
            if (h.hp <= 0) killHaz(h, false);
            else audio.gndHit(1);
          } else {
            killHaz(h, false);
          }
          hit = true;
          break;
        }
      }
      if (hit) continue;
      for (j = 0; j < G.bombs.length; j++) {
        b = G.bombs[j];
        if (b.dead) continue;
        if (Math.abs(s.x - b.x) < 10 && b.y > GROUND - 36) {
          s.dead = true;
          explodeBomb(b, false);
          bumpCombo();
          addScore(50 * comboMul(G.combo), b.x, b.y, GOLD);
          break;
        }
      }
    }
  }
}

function tickFx(dt) {
  var i, o;
  G.comboAge += dt;
  if (G.comboAge > COMBO_WIN && G.combo > 0) {
    G.combo = 0;
    comboEl.textContent = '×1';
    comboBox.classList.remove('hot');
  }
  G.shake *= Math.pow(0.04, dt);
  G.kickX *= Math.pow(0.02, dt);
  G.kickY *= Math.pow(0.02, dt);
  G.flash = Math.max(0, G.flash - dt);

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
    o.r += 78 * dt;
    if (o.t > 0.36) rings.splice(i, 1);
  }
  for (i = shards.length - 1; i >= 0; i--) {
    o = shards[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.vy += GRAV * dt;
    o.y += o.vy * dt;
    o.rot += o.vr * dt;
    if (o.t <= 0) shards.splice(i, 1);
  }
}

function tick(dt) {
  var distPts;
  G.clock += dt;
  ensureWorld();
  if (G.mode === 'title' || (autoOn && G.mode === 'play')) autoPlay();
  if (G.holdShot && G.mode === 'play') fire();
  tickPlayer(dt);
  tickClears();
  tickHazards();
  tickShots(dt);
  tickUfos(dt);
  tickBombs(dt);
  collideShots();
  tickFx(dt);
  if (G.mode === 'play' && G.player.deadT <= 0) {
    distPts = scrollSpeed(G.dash, G.clock) * dt * 0.18;
    G.distScore += distPts;
    if (G.distScore >= 1) {
      G.score += G.distScore | 0;
      G.distScore -= G.distScore | 0;
      G.bestAge += dt;
      if (G.bestAge > 0.45) {
        persistBest();
        G.bestAge = 0;
      }
      scoreEl.textContent = String(G.score | 0);
      distEl.textContent = String(meters());
      bestEl.textContent = String(currentBest());
      if (!G.dash) secLabel.textContent = '路段 ' + LETTERS.charAt(G.section);
      else secLabel.textContent = meters() + ' m';
      courseBar.style.transform = 'scaleX(' + courseProg() + ')';
    }
  }
}

/* ---- draw ---- */
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

function drawStars() {
  var i, s, tw;
  for (i = 0; i < stars.length; i++) {
    s = stars[i];
    tw = 0.55 + 0.45 * Math.sin(G.clock * 2.2 + s.ph);
    ctx.fillStyle = rgba(WHT, s.a * tw);
    ctx.fillRect(s.x - s.r * 0.5, s.y - s.r * 0.5, s.r, s.r);
  }
}

function drawEarth() {
  var x = VW - 72 - cam() * 0.02;
  var y = 48;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#1a3a88';
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#3dffb0';
  ctx.beginPath();
  ctx.ellipse(x - 4, y + 2, 7, 4, -0.4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#7ad0ff';
  ctx.beginPath();
  ctx.ellipse(x + 5, y - 6, 5, 3, 0.3, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba(CYN, 0.35);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function drawMounts(par, y, amp, rgb, a) {
  var x, wx, h, first;
  ctx.beginPath();
  ctx.moveTo(0, VH);
  first = true;
  for (x = -8; x <= VW + 8; x += 10) {
    wx = (cam() * par + x) * 0.018;
    h = y - amp * (0.45 + 0.55 * hash(Math.floor(wx * 3.1)) * (0.6 + 0.4 * Math.sin(wx * 1.7)));
    if (first) {
      ctx.lineTo(x, h);
      first = false;
    } else ctx.lineTo(x, h);
  }
  ctx.lineTo(VW + 8, VH);
  ctx.closePath();
  ctx.fillStyle = rgba(rgb, a);
  ctx.fill();
}

function drawGround() {
  var i, h, x0, x1, vis, d, gx;
  vis = [];
  for (i = 0; i < G.haz.length; i++) {
    h = G.haz[i];
    if (h.kind !== 'hole' || h.dead) continue;
    x0 = sx(h.x);
    x1 = sx(h.x + h.w);
    if (x1 < -20 || x0 > VW + 20) continue;
    vis.push({ x0: x0, x1: x1, mid: (x0 + x1) / 2, w: h.w });
  }
  vis.sort(function (a, b) { return a.x0 - b.x0; });

  ctx.beginPath();
  ctx.moveTo(-20, VH + 20);
  ctx.lineTo(-20, GROUND);
  ctx.lineTo(-20, GROUND);
  for (i = 0; i < vis.length; i++) {
    h = vis[i];
    ctx.lineTo(h.x0, GROUND);
    ctx.quadraticCurveTo(h.mid, GROUND + 38 + Math.min(18, h.w * 0.22), h.x1, GROUND);
  }
  ctx.lineTo(VW + 20, GROUND);
  ctx.lineTo(VW + 20, VH + 20);
  ctx.closePath();
  ctx.fillStyle = '#10182c';
  ctx.fill();

  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#0a1020';
  ctx.fillRect(-20, GROUND, VW + 40, VH);
  gx = (-cam() * 0.5) % 18;
  ctx.strokeStyle = 'rgba(61,184,255,0.06)';
  ctx.lineWidth = 1;
  for (d = gx - 18; d < VW + 20; d += 18) {
    ctx.beginPath();
    ctx.moveTo(d, GROUND);
    ctx.lineTo(d - 28, VH);
    ctx.stroke();
  }
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(-20, GROUND);
  for (i = 0; i < vis.length; i++) {
    h = vis[i];
    ctx.lineTo(h.x0, GROUND);
    ctx.quadraticCurveTo(h.mid, GROUND + 38 + Math.min(18, h.w * 0.22), h.x1, GROUND);
  }
  ctx.lineTo(VW + 20, GROUND);
  ctx.strokeStyle = rgba(ICE, 0.85);
  ctx.lineWidth = 2.2;
  ctx.shadowColor = rgba(CYN, 0.55);
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = rgba(CYN, 0.18);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-20, GROUND + 6);
  ctx.lineTo(VW + 20, GROUND + 6);
  ctx.stroke();
}

function drawHoleGlow() {
  var i, h, x0, x1;
  for (i = 0; i < G.haz.length; i++) {
    h = G.haz[i];
    if (h.kind !== 'hole' || h.dead) continue;
    x0 = sx(h.x);
    x1 = sx(h.x + h.w);
    if (x1 < 0 || x0 > VW) continue;
    ctx.fillStyle = 'rgba(5,6,14,0.85)';
    ctx.beginPath();
    ctx.ellipse((x0 + x1) / 2, GROUND + 16, h.w * 0.42, 14, 0, 0, TAU);
    ctx.fill();
  }
}

function drawRock(h) {
  var x = sx(h.x);
  var y = GROUND;
  if (x < -30 || x > VW + 30) return;
  ctx.save();
  ctx.translate(x + h.w * 0.5, y);
  ctx.fillStyle = '#1c2a44';
  ctx.strokeStyle = rgba(ICE, 0.8);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-h.w * 0.55, 0);
  ctx.lineTo(-h.w * 0.2, -h.h);
  ctx.lineTo(h.w * 0.15, -h.h * 0.72);
  ctx.lineTo(h.w * 0.55, -h.h * 0.92);
  ctx.lineTo(h.w * 0.62, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = rgba(CYN, 0.45);
  ctx.beginPath();
  ctx.moveTo(-h.w * 0.08, -h.h * 0.2);
  ctx.lineTo(h.w * 0.1, -h.h * 0.7);
  ctx.stroke();
  ctx.restore();
}

function drawPlant(h) {
  var x = sx(h.x + 6);
  if (x < -20 || x > VW + 20) return;
  ctx.save();
  ctx.translate(x, GROUND);
  ctx.strokeStyle = rgba(MINT, 0.85);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-4, -8, 0, -16);
  ctx.stroke();
  ctx.fillStyle = rgba(MAG, 0.9);
  ctx.beginPath();
  ctx.arc(0, -18, 3.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(GOLD, 0.8);
  ctx.beginPath();
  ctx.arc(-5, -10, 2.1, 0, TAU);
  ctx.arc(5, -11, 2.1, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawBase(h) {
  var x = sx(h.x);
  var on;
  if (x < -80 || x > VW + 80) return;
  on = h.hit;
  ctx.save();
  ctx.translate(x, GROUND);
  ctx.fillStyle = on ? 'rgba(61,255,136,0.12)' : 'rgba(61,184,255,0.1)';
  roundRect(0, -46, 54, 46, 6);
  ctx.fill();
  ctx.strokeStyle = on ? rgba(MINT, 0.9) : rgba(ICE, 0.85);
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(27, -46, 18, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = on ? rgba(GOLD, 0.95) : rgba(CYN, 0.95);
  ctx.font = 'bold 16px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(h.letter, 27, -18);
  ctx.fillStyle = rgba(GOLD, 0.8);
  ctx.fillRect(8, -8, 10, 8);
  ctx.fillRect(36, -8, 10, 8);
  ctx.restore();
}

function drawUfo(u) {
  var x = sx(u.x);
  var y = u.y + Math.sin(u.bob) * 3;
  var rgb = u.kind === 2 ? MAG : u.kind === 1 ? GOLD : CYN;
  if (x < -40 || x > VW + 40) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = u.hitT > 0 ? 0.55 + 0.45 * Math.sin(G.clock * 40) : 1;
  ctx.fillStyle = rgba(rgb, 0.18);
  ctx.beginPath();
  ctx.ellipse(0, 4, 18, 5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#1a2240';
  ctx.strokeStyle = rgba(rgb, 0.95);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 5.5, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = rgba(WHT, 0.85);
  ctx.beginPath();
  ctx.ellipse(0, -4, 7, 4.2, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba(CYN, 0.7);
  ctx.stroke();
  ctx.fillStyle = rgba(rgb, 0.9);
  ctx.beginPath();
  ctx.arc(-8, 1, 1.6, 0, TAU);
  ctx.arc(0, 2.2, 1.6, 0, TAU);
  ctx.arc(8, 1, 1.6, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawBomb(b) {
  var x = sx(b.x);
  ctx.save();
  ctx.translate(x, b.y);
  ctx.rotate(b.spin);
  ctx.fillStyle = rgba(MAG, 0.95);
  ctx.strokeStyle = rgba(GOLD, 0.8);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(5, 0);
  ctx.lineTo(0, 6);
  ctx.lineTo(-5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = rgba(MAG, 0.35);
  ctx.beginPath();
  ctx.moveTo(x, b.y);
  ctx.lineTo(x, b.y - 12);
  ctx.stroke();
}

function drawShot(s) {
  var x = sx(s.x);
  ctx.save();
  if (s.kind === 'air') {
    ctx.strokeStyle = rgba(CYN, 0.95);
    ctx.shadowColor = rgba(CYN, 0.8);
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x, s.y);
    ctx.lineTo(x - 2, s.y + 14);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 1.4, s.y - 3, 2.8, 5);
  } else {
    ctx.strokeStyle = rgba(GOLD, 0.95);
    ctx.shadowColor = rgba(GOLD, 0.8);
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x - 14, s.y);
    ctx.lineTo(x + 4, s.y);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillRect(x, s.y - 1.6, 6, 3.2);
  }
  ctx.restore();
}

function drawWheel(wx, spin) {
  ctx.save();
  ctx.translate(wx, 0);
  ctx.rotate(spin);
  ctx.fillStyle = '#0b1020';
  ctx.strokeStyle = rgba(CYN, 0.9);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 5.4, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = rgba(ICE, 0.7);
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-3.6, 0);
  ctx.lineTo(3.6, 0);
  ctx.moveTo(0, -3.6);
  ctx.lineTo(0, 3.6);
  ctx.stroke();
  ctx.restore();
}

function drawBuggy() {
  var p = G.player;
  var x = BUGGY_SX;
  var blink;
  if (p.deadT > 0) return;
  blink = p.inv > 0 && Math.sin(G.clock * 28) > 0.2;
  if (blink) ctx.globalAlpha = 0.38;
  ctx.save();
  ctx.translate(x, p.y);
  ctx.rotate(p.tilt);
  ctx.scale(p.squashX, p.squashY);

  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 3, 20, 3.2, 0, 0, TAU);
  ctx.fill();

  drawWheel(-14, p.spin);
  drawWheel(0, p.spin * 1.05);
  drawWheel(14, p.spin * 0.97);

  ctx.fillStyle = '#102038';
  ctx.strokeStyle = rgba(ICE, 0.95);
  ctx.lineWidth = 1.6;
  roundRect(-18, -18, 36, 14, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = rgba(MAG, 0.85);
  ctx.fillRect(-10, -16, 22, 3);

  ctx.fillStyle = 'rgba(180,240,255,0.35)';
  ctx.strokeStyle = rgba(CYN, 0.7);
  ctx.lineWidth = 1;
  roundRect(-6, -26, 14, 9, 3);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0c1428';
  ctx.strokeStyle = rgba(GOLD, 0.9);
  roundRect(2, -30, 10, 6, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = rgba(GOLD, 0.95);
  ctx.fillRect(11, -28, 8, 2.2);

  ctx.fillStyle = rgba(CYN, 0.9);
  ctx.fillRect(16, -14, 6, 3);

  if (p.muzzle > 0) {
    ctx.globalAlpha = p.muzzle / 0.09;
    ctx.fillStyle = '#fff';
    ctx.fillRect(18, -29, 10, 3);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(20, -13, 14, 3);
    ctx.globalAlpha = blink ? 0.38 : 1;
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawFx() {
  var i, o, a, x;
  for (i = 0; i < rings.length; i++) {
    o = rings[i];
    a = 1 - o.t / 0.36;
    x = sx(o.x);
    ctx.strokeStyle = rgba(o.rgb, a * 0.85);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, o.y, o.r, 0, TAU);
    ctx.stroke();
  }
  for (i = 0; i < particles.length; i++) {
    o = particles[i];
    a = clamp(o.t / o.max, 0, 1);
    ctx.fillStyle = rgba(o.rgb, a);
    ctx.beginPath();
    ctx.arc(sx(o.x), o.y, o.r, 0, TAU);
    ctx.fill();
  }
  for (i = 0; i < sparks.length; i++) {
    o = sparks[i];
    ctx.strokeStyle = rgba(o.rgb, clamp(o.t / 0.28, 0, 1));
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(sx(o.x), o.y);
    ctx.lineTo(sx(o.x - o.vx * 0.04), o.y - o.vy * 0.04);
    ctx.stroke();
  }
  for (i = 0; i < shards.length; i++) {
    o = shards[i];
    ctx.save();
    ctx.translate(sx(o.x), o.y);
    ctx.rotate(o.rot);
    ctx.fillStyle = rgba(o.rgb, clamp(o.t / 0.5, 0, 1));
    ctx.fillRect(-o.w * 0.5, -2, o.w, 4);
    ctx.restore();
  }
  ctx.font = 'bold 12px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  for (i = 0; i < floats.length; i++) {
    o = floats[i];
    a = 1 - o.t / 0.7;
    ctx.fillStyle = rgba(o.rgb, a);
    ctx.fillText(o.n, sx(o.x), o.y);
  }
}

function drawHudMarks() {
  var i, c, x;
  if (G.dash || !G.checks.length) return;
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = 'rgba(8,10,24,0.45)';
  roundRect(90, 10, 460, 10, 5);
  ctx.fill();
  for (i = 0; i < G.checks.length; i++) {
    c = G.checks[i];
    x = 90 + (c.x / G.endX) * 460;
    ctx.fillStyle = rgba(ICE, 0.85);
    ctx.fillRect(x - 1, 10, 2, 10);
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.font = '9px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(c.letter, x, 32);
  }
  x = 90 + clamp(G.x / G.endX, 0, 1) * 460;
  ctx.fillStyle = rgba(GOLD, 0.95);
  ctx.beginPath();
  ctx.moveTo(x, 8);
  ctx.lineTo(x + 4, 16);
  ctx.lineTo(x - 4, 16);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function draw() {
  var i, h, s, shx, shy, u, b;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#04020c';
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.save();
  ctx.translate(L.x, L.y);
  ctx.scale(L.s, L.s);
  ctx.beginPath();
  ctx.rect(0, 0, VW, VH);
  ctx.clip();

  shx = (G.shake ? (Math.random() - 0.5) * G.shake : 0) + G.kickX;
  shy = (G.shake ? (Math.random() - 0.5) * G.shake * 0.6 : 0) + G.kickY;
  if (reduceMotion()) {
    shx = 0;
    shy = 0;
  }
  ctx.translate(shx, shy);

  ctx.fillStyle = '#07041a';
  ctx.fillRect(-4, -4, VW + 8, VH + 8);
  ctx.fillStyle = '#0a1830';
  ctx.fillRect(-4, GROUND - 90, VW + 8, 90);

  drawStars();
  drawEarth();
  drawMounts(0.12, 210, 38, [12, 22, 48], 0.85);
  drawMounts(0.28, 232, 28, [16, 32, 64], 0.7);
  drawMounts(0.5, 252, 18, [20, 40, 78], 0.55);

  for (i = 0; i < G.ufos.length; i++) {
    u = G.ufos[i];
    if (!u.dead) drawUfo(u);
  }
  for (i = 0; i < G.bombs.length; i++) {
    b = G.bombs[i];
    if (!b.dead) drawBomb(b);
  }
  for (i = 0; i < G.shots.length; i++) {
    s = G.shots[i];
    if (!s.dead && s.kind === 'air') drawShot(s);
  }

  drawGround();
  drawHoleGlow();

  for (i = 0; i < G.haz.length; i++) {
    h = G.haz[i];
    if (h.dead) continue;
    if (h.kind === 'rock') drawRock(h);
    else if (h.kind === 'plant') drawPlant(h);
    else if (h.kind === 'base') drawBase(h);
  }

  for (i = 0; i < G.shots.length; i++) {
    s = G.shots[i];
    if (!s.dead && s.kind === 'gnd') drawShot(s);
  }

  drawBuggy();
  drawFx();
  drawHudMarks();

  if (G.flash > 0) {
    ctx.fillStyle = rgba(G.flashRgb, Math.min(0.22, G.flash * 2.4));
    ctx.fillRect(0, 0, VW, VH);
  }

  ctx.restore();
}

function resize() {
  cssW = canvas.clientWidth;
  cssH = canvas.clientHeight;
  dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  L.s = Math.min(cssW / VW, cssH / VH);
  L.x = (cssW - VW * L.s) / 2;
  L.y = (cssH - VH * L.s) / 2;
}

function frame(ts) {
  var dt, steps, turbo, maxSteps;
  requestAnimationFrame(frame);
  if (hidden) return;
  if (!lastTs) lastTs = ts;
  dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (dt > 0.08) dt = 0.08;
  turbo = autoOn && autoSpeed >= 4 && G.mode === 'play';
  if (turbo) G.stop = 0;
  acc += dt * autoScale();
  steps = 0;
  maxSteps = turbo ? 16 : 8;
  while (acc >= STEP && steps < maxSteps) {
    if (G.stop > 0 && !turbo) G.stop -= STEP;
    else tick(STEP);
    acc -= STEP;
    steps++;
  }
  if (acc > STEP * 4) acc = 0;
  draw();
}

/* ---- input ---- */
function bindPad(el, on) {
  var hold = function (e) {
    e.preventDefault();
    audio.ensure();
    if (autoOn) return;
    el.classList.add('held');
    on(true);
  };
  var up = function (e) {
    e.preventDefault();
    el.classList.remove('held');
    on(false);
  };
  el.addEventListener('pointerdown', hold);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', function (e) {
    if (el.classList.contains('held')) up(e);
  });
}

bindPad(btnJump, function (v) {
  if (autoOn) return;
  keys.jump = v;
  if (v) G.jumpBuf = BUFFER;
});
bindPad(btnShot, function (v) {
  if (autoOn) return;
  keys.shot = v;
  G.holdShot = v;
  if (v) fire();
});

function keyOn(e, down) {
  var k = e.code;
  if (k === 'ArrowUp' || k === 'KeyW') {
    keys.jump = down;
    if (down) G.jumpBuf = BUFFER;
    e.preventDefault();
  } else if (k === 'Space') {
    if (down) G.jumpBuf = BUFFER;
    keys.jump = down;
    e.preventDefault();
  } else if (k === 'KeyZ' || k === 'KeyJ' || k === 'KeyX') {
    keys.shot = down;
    G.holdShot = down;
    if (down) fire();
    e.preventDefault();
  }
}

function isAutoKey(e) {
  return e.code === 'KeyA' || e.key === 'a' || e.key === 'A';
}

window.addEventListener('keydown', function (e) {
  if (isAutoKey(e)) {
    if (e.repeat) return;
    audio.ensure();
    toggleAuto();
    e.preventDefault();
    return;
  }
  if (e.target === speedEl) return;
  if (e.repeat) {
    if (autoOn) {
      e.preventDefault();
      return;
    }
    if (e.code === 'KeyZ' || e.code === 'KeyJ' || e.code === 'KeyX' ||
        e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
    }
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
      startRun('dash');
      e.preventDefault();
      return;
    }
  }
  if (G.mode === 'over' || G.mode === 'win') {
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Digit1') {
      startRun(G.kind);
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      showTitle();
      e.preventDefault();
      return;
    }
  }
  if (autoOn) {
    if (
      e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'Space' ||
      e.code === 'KeyW' || e.code === 'KeyZ' || e.code === 'KeyJ' || e.code === 'KeyX'
    ) {
      e.preventDefault();
    }
    return;
  }
  if (G.mode === 'play') keyOn(e, true);
});

window.addEventListener('keyup', function (e) {
  if (isAutoKey(e)) {
    e.preventDefault();
    return;
  }
  if (autoOn) return;
  keyOn(e, false);
});

btnMute.addEventListener('click', function () {
  audio.ensure();
  audio.setMuted(!audio.muted);
});
btnAuto.addEventListener('click', function () { toggleAuto(); });
speedEl.addEventListener('input', function () { setAutoSpeed(parseInt(speedEl.value, 10)); });
speedEl.addEventListener('change', function () { setAutoSpeed(parseInt(speedEl.value, 10)); });
btnRetry.addEventListener('click', function () {
  audio.ensure();
  retry();
});
btnClassic.addEventListener('click', function () {
  audio.ensure();
  startRun('classic');
});
btnDash.addEventListener('click', function () {
  audio.ensure();
  startRun('dash');
});
ovRetry.addEventListener('click', function () {
  audio.ensure();
  startRun(G.kind);
});
ovModes.addEventListener('click', function () {
  audio.ensure();
  audio.ui();
  showTitle();
});

canvas.addEventListener('pointerdown', function (e) {
  audio.ensure();
  canvas.focus({ preventScroll: true });
  if (G.mode !== 'play' || autoOn) return;
  if (e.pointerType === 'touch') return;
  G.holdShot = true;
  fire();
  e.preventDefault();
});
canvas.addEventListener('pointerup', function () { G.holdShot = false; });
canvas.addEventListener('pointercancel', function () { G.holdShot = false; });
canvas.addEventListener('pointerleave', function () { G.holdShot = false; });

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
syncAutoUi();
syncSpeedUi();
showTitle();
resize();
hudPlay();
modeLabel.textContent = '经典';
requestAnimationFrame(frame);

}
