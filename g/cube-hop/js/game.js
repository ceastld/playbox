'use strict';

/* 立体跳 — Q*bert remake. No CDN. */

var SIZE = 7;
var LIVES = 3;
var HW = 36;
var HH = 21;
var FACE = 26;
var OX = 280;
var OY = 54;
var WORLD_W = 560;
var WORLD_H = 400;
var UL = 0;
var UR = 1;
var DR = 2;
var DL = 3;
var PLAYER_HOP = 0.168;
var FLIP_SCORE = 25;
var COILY_SCORE = 500;
var ROUND_BONUS = 750;
var ROUND_STEP = 250;
var COMBO_AGE = 1.55;
var INVULN = 0.85;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var BEST_KEY = 'playbox-cube-hop-best';
var MUTE_KEY = 'playbox-cube-hop-mute';

var DIRS = [
  { dr: -1, dc: -1 },
  { dr: -1, dc: 0 },
  { dr: 1, dc: 1 },
  { dr: 1, dc: 0 }
];

var KEY_DIR = {
  KeyQ: UL, ArrowLeft: UL,
  KeyW: UR, ArrowUp: UR,
  KeyE: DR, ArrowRight: DR,
  KeyA: DL, ArrowDown: DL, KeyS: DL
};

var PALS = [
  {
    L: [86, 42, 22],
    R: [48, 22, 14],
    tops: [[78, 62, 128], [255, 138, 40], [255, 196, 72]]
  },
  {
    L: [72, 32, 58],
    R: [40, 16, 36],
    tops: [[62, 52, 118], [255, 92, 150], [0, 236, 214]]
  },
  {
    L: [28, 48, 72],
    R: [14, 28, 48],
    tops: [[48, 70, 122], [255, 138, 40], [80, 255, 170]]
  },
  {
    L: [58, 24, 78],
    R: [32, 12, 48],
    tops: [[70, 40, 120], [255, 70, 180], [255, 220, 80]]
  }
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
function cubeCount() {
  return SIZE * (SIZE + 1) / 2;
}
function valid(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c <= r;
}
function cubeXY(r, c) {
  return { x: OX + (2 * c - r) * HW, y: OY + r * HH };
}
function standXY(r, c) {
  var p = cubeXY(r, c);
  return { x: p.x, y: p.y + HH * 0.72 };
}
function inDiamond(px, py, x, y) {
  var dx = Math.abs(px - x) / HW;
  var dy = Math.abs(py - (y + HH)) / HH;
  return dx + dy <= 1.02;
}
function needFlips(round) {
  return round <= 1 ? 1 : 2;
}
function doesRevert(round, chase) {
  return !chase && round >= 4;
}
function palette(round) {
  return PALS[(round - 1) % PALS.length];
}
function applyFlip(level, need, revert) {
  if (level < need) {
    return { level: level + 1, flipped: true, done: level + 1 >= need, revert: false };
  }
  if (revert) {
    return { level: Math.max(0, need - 1), flipped: false, done: false, revert: true };
  }
  return { level: level, flipped: false, done: true, revert: false };
}
function hopDest(r, c, dir, discs) {
  var d = DIRS[dir];
  var nr = r + d.dr;
  var nc = c + d.dc;
  var i, disc;
  if (valid(nr, nc)) return { kind: 'cube', r: nr, c: nc };
  if (discs) {
    for (i = 0; i < discs.length; i++) {
      disc = discs[i];
      if (!disc || disc.gone || disc.fly) continue;
      if (disc.side === 'L' && dir === UL && c === 0 && r === disc.row) {
        return { kind: 'disc', id: i, r: nr, c: nc };
      }
      if (disc.side === 'R' && dir === UR && c === r && r === disc.row) {
        return { kind: 'disc', id: i, r: nr, c: nc };
      }
    }
  }
  return { kind: 'fall', r: nr, c: nc };
}
function neighbors(r, c) {
  var out = [];
  var i, d;
  for (i = 0; i < 4; i++) {
    d = hopDest(r, c, i, null);
    if (d.kind === 'cube') out.push({ r: d.r, c: d.c, dir: i });
  }
  return out;
}
function bfsDist(r0, c0, r1, c1) {
  var q, seen, cur, nbs, k, n, key, head;
  if (r0 === r1 && c0 === c1) return 0;
  if (!valid(r0, c0) || !valid(r1, c1)) return 99;
  q = [{ r: r0, c: c0, d: 0 }];
  seen = {};
  seen[r0 + ',' + c0] = 1;
  head = 0;
  while (head < q.length) {
    cur = q[head++];
    nbs = neighbors(cur.r, cur.c);
    for (k = 0; k < nbs.length; k++) {
      n = nbs[k];
      if (n.r === r1 && n.c === c1) return cur.d + 1;
      key = n.r + ',' + n.c;
      if (seen[key]) continue;
      seen[key] = 1;
      q.push({ r: n.r, c: n.c, d: cur.d + 1 });
    }
  }
  return 99;
}
function pickCoilyDir(cr, cc, pr, pc) {
  var best = -1;
  var bestD = 1e9;
  var i, dest, dist, tie;
  for (i = 0; i < 4; i++) {
    dest = hopDest(cr, cc, i, null);
    if (dest.kind !== 'cube') continue;
    dist = bfsDist(dest.r, dest.c, pr, pc);
    tie = dist === bestD && Math.random() < 0.5;
    if (dist < bestD || tie) {
      bestD = dist;
      best = i;
    }
  }
  return best;
}
function pickBallDir(r, c) {
  var dl = hopDest(r, c, DL, null);
  var dr = hopDest(r, c, DR, null);
  if (dl.kind === 'cube' && dr.kind === 'cube') return Math.random() < 0.5 ? DL : DR;
  if (dl.kind === 'cube') return DL;
  if (dr.kind === 'cube') return DR;
  return Math.random() < 0.5 ? DL : DR;
}
function playerHopTime() {
  return PLAYER_HOP;
}
function ballHopTime(round, chase) {
  var t = 0.33 - Math.min(7, round - 1) * 0.016;
  if (chase) t *= 0.78;
  return t < 0.2 ? 0.2 : t;
}
function coilyHopTime(round, chase) {
  var t = 0.225 - Math.min(7, round - 1) * 0.01;
  if (chase) t *= 0.7;
  return t < 0.125 ? 0.125 : t;
}
function coilyWait(round, chase) {
  var t = 0.09 - Math.min(6, round - 1) * 0.006;
  if (chase) t *= 0.35;
  return t < 0.016 ? 0.016 : t;
}
function ballWait(round, chase) {
  var t = 0.08 - Math.min(6, round - 1) * 0.004;
  if (chase) t *= 0.7;
  return t < 0.03 ? 0.03 : t;
}
function maxBalls(round, chase) {
  if (chase) return Math.min(4, 2 + ((round / 2) | 0));
  return Math.min(2, 1 + (((round - 1) / 2) | 0));
}
function spawnInterval(round, chase) {
  var t = chase ? 1.35 : 2.7;
  t /= 1 + Math.max(0, round - 1) * 0.12;
  return t < (chase ? 0.7 : 1.35) ? (chase ? 0.7 : 1.35) : t;
}
function coilySpawnDelay(chase) {
  return chase ? 0.7 : 1.25;
}
function discSpots(round, chase) {
  var a = 2 + (round % 3);
  var b = 3 + ((round + 1) % 3);
  if (a > 5) a = 5;
  if (b > 5) b = 5;
  if (chase) return [{ side: 'L', row: b }];
  return [
    { side: 'L', row: a === b ? 3 : a },
    { side: 'R', row: b }
  ];
}
function makeTiles() {
  var t = [];
  var r, c, row;
  for (r = 0; r < SIZE; r++) {
    row = [];
    for (c = 0; c <= r; c++) row.push(0);
    t.push(row);
  }
  return t;
}
function makeFlash() {
  return makeTiles();
}
function flippedCount(tiles, need) {
  var n = 0, r, c;
  for (r = 0; r < SIZE; r++) {
    for (c = 0; c <= r; c++) if (tiles[r][c] >= need) n++;
  }
  return n;
}
function makeDiscs(round, chase) {
  var spots = discSpots(round, chase);
  return spots.map(function (s) {
    return { side: s.side, row: s.row, gone: false, fly: false, flyT: 0 };
  });
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
    dir: DL,
    destKind: 'cube',
    discId: -1,
    squash: 1,
    state: 'idle',
    snake: false,
    inv: 0,
    dead: false,
    spin: 0,
    fallY: 0,
    fallV: 0,
    fallX: 0,
    rideT: 0,
    rideX0: 0,
    rideY0: 0,
    face: 1,
    trail: [],
    dropT: 1
  };
}

function selfCheck() {
  var n, d, f, tiles, i, dest, dist, spots;

  if (SIZE !== 7) throw new Error('7 rows');
  if (cubeCount() !== 28) throw new Error('28 cubes');
  if (!valid(0, 0) || valid(0, 1) || !valid(6, 6) || valid(6, 7) || valid(-1, 0)) {
    throw new Error('valid');
  }
  if (valid(3, 4) || !valid(3, 3) || !valid(3, 0)) throw new Error('row cols');
  n = neighbors(0, 0);
  if (n.length !== 2) throw new Error('top 2 neighbors');
  if (!(n[0].r === 1 && (n[0].c === 0 || n[0].c === 1))) throw new Error('top n0');
  n = neighbors(6, 0);
  if (n.length !== 1 || n[0].r !== 5 || n[0].c !== 0) throw new Error('bot-left');
  n = neighbors(6, 6);
  if (n.length !== 1 || n[0].r !== 5 || n[0].c !== 5) throw new Error('bot-right');
  n = neighbors(3, 1);
  if (n.length !== 4) throw new Error('interior 4');

  d = hopDest(0, 0, UL, null);
  if (d.kind !== 'fall') throw new Error('top UL fall');
  d = hopDest(0, 0, DL, null);
  if (d.kind !== 'cube' || d.r !== 1 || d.c !== 0) throw new Error('top DL');
  d = hopDest(0, 0, DR, null);
  if (d.kind !== 'cube' || d.r !== 1 || d.c !== 1) throw new Error('top DR');
  d = hopDest(2, 2, UR, null);
  if (d.kind !== 'fall') throw new Error('right edge UR fall');

  spots = [{ side: 'L', row: 3, gone: false, fly: false }];
  d = hopDest(3, 0, UL, spots);
  if (d.kind !== 'disc' || d.id !== 0) throw new Error('left disc');
  d = hopDest(3, 0, UL, [{ side: 'L', row: 4, gone: false, fly: false }]);
  if (d.kind !== 'fall') throw new Error('wrong row no disc');
  spots = [{ side: 'R', row: 2, gone: false, fly: false }];
  d = hopDest(2, 2, UR, spots);
  if (d.kind !== 'disc') throw new Error('right disc');

  f = applyFlip(0, 1, false);
  if (!f.flipped || f.level !== 1 || !f.done) throw new Error('flip once');
  f = applyFlip(1, 1, false);
  if (f.flipped || f.level !== 1) throw new Error('stay done');
  f = applyFlip(0, 2, false);
  if (!f.flipped || f.done || f.level !== 1) throw new Error('mid');
  f = applyFlip(1, 2, false);
  if (!f.done || f.level !== 2) throw new Error('second flip');
  f = applyFlip(2, 2, true);
  if (!f.revert || f.level !== 1) throw new Error('revert');
  f = applyFlip(2, 2, false);
  if (f.revert || f.level !== 2) throw new Error('no revert');

  if (needFlips(1) !== 1 || needFlips(2) !== 2 || needFlips(9) !== 2) throw new Error('need');
  if (doesRevert(3, false) || !doesRevert(4, false) || doesRevert(9, true)) throw new Error('revert flag');

  if (bfsDist(0, 0, 0, 0) !== 0) throw new Error('dist 0');
  if (bfsDist(0, 0, 1, 0) !== 1) throw new Error('dist 1');
  if (bfsDist(0, 0, 2, 1) !== 2) throw new Error('dist 2');
  dist = bfsDist(6, 0, 6, 6);
  if (dist !== 12) throw new Error('bottom row dist ' + dist);

  dest = pickCoilyDir(2, 1, 0, 0);
  if (dest !== UL && dest !== UR) throw new Error('coily goes up');
  d = hopDest(2, 1, dest, null);
  if (bfsDist(d.r, d.c, 0, 0) >= bfsDist(2, 1, 0, 0)) throw new Error('greedy closer');

  if (coilyHopTime(1, true) >= coilyHopTime(1, false)) throw new Error('chase coily faster');
  if (ballHopTime(1, true) >= ballHopTime(1, false)) throw new Error('chase balls faster');
  if (maxBalls(1, true) <= maxBalls(1, false)) throw new Error('chase more balls');
  if (spawnInterval(1, true) >= spawnInterval(1, false)) throw new Error('chase denser');
  if (coilyHopTime(3, false) >= coilyHopTime(1, false)) throw new Error('round speeds coily');
  if (playerHopTime() >= coilyHopTime(1, false)) throw new Error('player faster than coily');

  tiles = makeTiles();
  if (tiles.length !== 7 || tiles[6].length !== 7 || tiles[0].length !== 1) throw new Error('tiles shape');
  if (flippedCount(tiles, 1) !== 0) throw new Error('none flipped');
  tiles[0][0] = 1;
  if (flippedCount(tiles, 1) !== 1) throw new Error('one flipped');

  if (inDiamond(OX, OY + HH, OX, OY) !== true) throw new Error('diamond center');
  if (inDiamond(OX + HW * 2, OY, OX, OY)) throw new Error('diamond out');

  spots = discSpots(1, false);
  if (spots.length !== 2) throw new Error('2 discs campaign');
  spots = discSpots(1, true);
  if (spots.length !== 1) throw new Error('1 disc chase');

  for (i = 0; i < 4; i++) {
    if (typeof DIRS[i].dr !== 'number') throw new Error('dirs');
  }
  if (KEY_DIR.KeyQ !== UL || KEY_DIR.KeyW !== UR || KEY_DIR.KeyE !== DR || KEY_DIR.KeyA !== DL) {
    throw new Error('QWEA map');
  }
  if (KEY_DIR.ArrowLeft !== UL || KEY_DIR.ArrowUp !== UR) throw new Error('arrows iso');
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
var btnChase = document.getElementById('btn-chase');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnUl = document.getElementById('btn-ul');
var btnUr = document.getElementById('btn-ur');
var btnDl = document.getElementById('btn-dl');
var btnDr = document.getElementById('btn-dr');
var scoreEl = document.getElementById('score');
var roundEl = document.getElementById('round');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var tileBar = document.getElementById('tile-bar');
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

var ptr = { on: false, x: 0, y: 0, id: -1 };

var G = {
  mode: 'title',
  kind: 'classic',
  chase: false,
  clock: 0,
  round: 1,
  lives: LIVES,
  score: 0,
  bestC: 0,
  bestE: 0,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  tiles: makeTiles(),
  flash: makeFlash(),
  pop: makeFlash(),
  need: 1,
  player: makeHopper('player', 0, 0),
  coily: null,
  balls: [],
  discs: makeDiscs(1, false),
  pending: -1,
  spawnCd: 2,
  coilyCd: 1.2,
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flashA: 0,
  flashRgb: [255, 138, 40],
  lock: 0,
  lureT: 0,
  lureDir: 0,
  lureR: 0,
  lureC: 0,
  why: '',
  clearT: 0
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
  hop: function (combo) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.05;
    this.beep(310 * p, 0.055, 'square', 0.055, 560 * p);
    this.noise(0.035, 0.04, 1500, 'highpass');
  },
  land: function () {
    this.ensure();
    this.noise(0.05, 0.055, 340, 'bandpass');
    this.beep(150, 0.04, 'sine', 0.03, 70);
  },
  flip: function (combo) {
    this.ensure();
    var p = 1 + Math.min(10, combo) * 0.06;
    this.beep(520 * p, 0.07, 'square', 0.06, 840 * p);
    this.beep(780 * p, 0.1, 'triangle', 0.04, 1180 * p);
  },
  disc: function () {
    this.ensure();
    this.beep(392, 0.08, 'sine', 0.05, 523);
    this.beep(523, 0.1, 'triangle', 0.045, 784);
    this.beep(784, 0.16, 'square', 0.04, 1046);
  },
  splat: function () {
    this.ensure();
    this.noise(0.16, 0.14, 220, 'lowpass');
    this.noise(0.08, 0.08, 1100, 'bandpass');
    this.beep(280, 0.16, 'sawtooth', 0.07, 60);
    this.beep(180, 0.12, 'square', 0.04, 50);
  },
  die: function () {
    this.ensure();
    this.noise(0.18, 0.12, 260, 'lowpass');
    this.beep(320, 0.22, 'sawtooth', 0.06, 70);
    this.beep(160, 0.2, 'square', 0.04, 48);
  },
  hatch: function () {
    this.ensure();
    this.beep(180, 0.08, 'square', 0.05, 90);
    this.noise(0.1, 0.07, 180, 'lowpass');
    this.beep(90, 0.12, 'sawtooth', 0.04, 50);
  },
  bounce: function () {
    this.ensure();
    this.beep(220, 0.04, 'triangle', 0.025, 140);
  },
  clear: function () {
    this.ensure();
    this.beep(392, 0.1, 'square', 0.055, 523);
    this.beep(523, 0.12, 'square', 0.05, 659);
    this.beep(784, 0.22, 'triangle', 0.055, 1046);
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
  },
  revert: function () {
    this.ensure();
    this.beep(420, 0.08, 'square', 0.04, 180);
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
      G.bestC = o.c | 0;
      G.bestE = o.e | 0;
      return;
    }
    if (typeof o === 'number') {
      G.bestC = o | 0;
      G.bestE = o | 0;
    }
  } catch (err) { /* ignore */ }
}

function persistBest() {
  var cur = G.chase ? G.bestE : G.bestC;
  if (G.score > cur) {
    if (G.chase) G.bestE = G.score;
    else G.bestC = G.score;
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ c: G.bestC, e: G.bestE }));
  } catch (err) { /* ignore */ }
}

function currentBest() {
  return G.chase ? G.bestE : G.bestC;
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
  capArr(particles, 220);
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
  capArr(sparks, 120);
}

function ringAt(x, y, rgb) {
  rings.push({ x: x, y: y, t: 0, max: 0.34, rgb: rgb });
  capArr(rings, 18);
}

function floatText(x, y, text, rgb) {
  floats.push({ x: x, y: y, text: text, t: 0.72, rgb: rgb || [255, 227, 107] });
  capArr(floats, 16);
}

function shardBurst(x, y, rgb) {
  var i;
  for (i = 0; i < 10; i++) {
    shards.push({
      x: x, y: y,
      vx: rand(-1, 1) * 90,
      vy: rand(-1.2, -0.1) * 110,
      rot: rand(0, TAU),
      vr: rand(-8, 8),
      t: rand(0.35, 0.6),
      rgb: rgb,
      s: rand(3, 7)
    });
  }
  capArr(shards, 40);
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

function syncTiles() {
  var n = flippedCount(G.tiles, G.need);
  var tot = cubeCount();
  var p = n / tot;
  tileBar.style.transform = 'scaleX(' + p + ')';
  tileBar.classList.toggle('on', p >= 1);
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
  syncTiles();
  modeLabel.textContent = G.chase ? '追逃' : '闯关';
  modeLabel.classList.toggle('chase', G.chase);
  if (G.mode === 'play') {
    hintEl.textContent = G.chase
      ? '科伊更快 · 球更多 · 飞碟只有一个 · R 重开'
      : '点相邻块翻色 · 科伊会追 · 飞碟回顶 · 跳下塔掉命';
  }
}

function discWorld(d) {
  var p, x, y, top, k;
  if (!d) return { x: OX, y: OY };
  p = cubeXY(d.row, d.side === 'L' ? 0 : d.row);
  x = p.x + (d.side === 'L' ? -HW * 1.78 : HW * 1.78);
  y = p.y + HH * 0.92;
  if (d.fly) {
    top = standXY(0, 0);
    k = d.flyT * d.flyT * (3 - 2 * d.flyT);
    return {
      x: lerp(x, top.x, k),
      y: lerp(y, top.y - 6, k) - Math.sin(d.flyT * Math.PI) * 78
    };
  }
  return { x: x, y: y };
}

function visEnt(e) {
  var a, b, k, arc, p;
  if (!e) return { x: OX, y: OY };
  if (e.state === 'drop') {
    p = standXY(0, 0);
    k = easeOut(e.dropT);
    return { x: p.x, y: lerp(p.y - 70, p.y, k) };
  }
  if (e.state === 'fall' || e.state === 'dead') {
    p = standXY(e.fr, e.fc);
    return { x: p.x + e.fallX, y: p.y + e.fallY };
  }
  if (e.state === 'ride') {
    p = standXY(0, 0);
    k = e.rideT * e.rideT * (3 - 2 * e.rideT);
    return {
      x: lerp(e.rideX0, p.x, k),
      y: lerp(e.rideY0, p.y, k) - Math.sin(e.rideT * Math.PI) * 78
    };
  }
  if (e.hopT < 1) {
    a = standXY(e.fr, e.fc);
    if (e.destKind === 'disc' && G.discs[e.discId]) b = discWorld(G.discs[e.discId]);
    else if (e.destKind === 'fall') {
      p = cubeXY(e.r, e.c);
      b = { x: p.x, y: p.y + HH * 0.72 };
    } else b = standXY(e.r, e.c);
    k = easeOut(e.hopT);
    arc = Math.sin(e.hopT * Math.PI) * (e.destKind === 'fall' ? 16 : 28);
    return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) - arc };
  }
  if (e.destKind === 'disc' && e.state === 'idle' && G.discs[e.discId] && !G.discs[e.discId].gone) {
    return discWorld(G.discs[e.discId]);
  }
  return standXY(e.r, e.c);
}

function addScore(n, x, y, label) {
  if (n <= 0) return;
  G.score += n;
  persistBest();
  bestEl.textContent = String(currentBest());
  flashScore(n);
  if (x != null) floatText(x, y - 18, label || ('+' + n), [61, 255, 136]);
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

/* ---- round / run ---- */
function resetRoundKeepScore() {
  G.tiles = makeTiles();
  G.flash = makeFlash();
  G.pop = makeFlash();
  G.need = needFlips(G.round);
  G.player = makeHopper('player', 0, 0);
  G.player.inv = 0.35;
  G.coily = null;
  G.balls = [];
  G.discs = makeDiscs(G.round, G.chase);
  G.pending = -1;
  G.spawnCd = spawnInterval(G.round, G.chase) * 0.45;
  G.coilyCd = coilySpawnDelay(G.chase);
  G.lock = 0;
  G.lureT = 0;
  G.clearT = 0;
  G.player.squash = 0.7;
  resetFx();
}

function startRun(kind) {
  G.kind = kind;
  G.chase = kind === 'chase';
  G.mode = 'play';
  G.clock = 0;
  G.round = 1;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  G.maxCombo = 0;
  G.comboAge = 0;
  G.why = '';
  resetRoundKeepScore();
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  panelEl.className = 'panel';
  audio.start();
  hudPlay();
  toast(G.chase ? '追逃' : '开跳', false, !G.chase);
  canvas.focus({ preventScroll: true });
}

function retry() {
  audio.ui();
  if (G.mode === 'title') startRun('classic');
  else startRun(G.kind);
}

function showTitle() {
  G.mode = 'title';
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel';
  ovTitle.textContent = '立体跳';
  ovLead.textContent = '跳上相邻方块翻色。科伊来追，飞碟能送回顶。跳下去会掉命。';
  ovOps.textContent = '点相邻块 · Q W E A / 方向键等距跳 · R 重开 · M 静音';
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
  hintEl.textContent = '点相邻块翻色 · 科伊会追 · 飞碟回顶 · 跳下塔掉命';
  G.round = 1;
  G.chase = false;
  G.tiles = makeTiles();
  G.flash = makeFlash();
  G.pop = makeFlash();
  G.need = 1;
  G.player = makeHopper('player', 0, 0);
  G.coily = null;
  G.balls = [];
  G.discs = makeDiscs(1, false);
  resetFx();
  hudPlay();
  modeLabel.textContent = '闯关';
}

function showOver() {
  G.mode = 'over';
  persistBest();
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel lose';
  ovTitle.textContent = '命尽';
  ovLead.textContent = '第 ' + G.round + ' 轮 · ' + G.score + ' 分 · 连跳最高 ×' + G.maxCombo +
    (G.why ? ' · ' + G.why : '');
  ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
  audio.over();
  if (ovRetry) ovRetry.focus();
}

function nextRound() {
  var bonus = ROUND_BONUS + ROUND_STEP * G.round;
  var p = visEnt(G.player);
  addScore(bonus, p.x, p.y - 24, '清轮 +' + bonus);
  toast('第 ' + G.round + ' 轮清了', false, true);
  audio.clear();
  hitStop(0.075);
  screenFlash([255, 227, 107], 0.38);
  burst(OX, OY + 80, 36, [255, 227, 107], 90, 0.6, 18);
  stageEl.classList.remove('clear');
  void stageEl.offsetWidth;
  stageEl.classList.add('clear');
  G.round += 1;
  G.lock = 0.55;
  G.clearT = 0.55;
}

function beginNextRound() {
  resetRoundKeepScore();
  hudPlay();
  toast('第 ' + G.round + ' 轮' + (G.need >= 2 ? ' · 跳两次' : ''), false, true);
  audio.start();
}

function kill(why) {
  var p = G.player;
  var v, rgb;
  if (p.dead || G.mode !== 'play') return;
  if (p.state === 'ride') return;
  p.dead = true;
  p.state = 'fall';
  p.why = why;
  G.why = whyText(why);
  if (valid(p.r, p.c)) {
    p.fr = p.r;
    p.fc = p.c;
  }
  v = visEnt(p);
  p.fallX = 0;
  p.fallY = 0;
  p.fallV = why === 'fall' ? 40 : 10;
  resetCombo();
  G.lives -= 1;
  renderPips();
  hitStop(0.08);
  dieShake();
  shake(9);
  rgb = why === 'coily' ? [196, 92, 255] : why === 'ball' ? [255, 61, 184] : [255, 138, 40];
  burst(v.x, v.y, 28, rgb, 110, 0.52, 28);
  burst(v.x, v.y, 10, [255, 227, 107], 70, 0.32, 12);
  spark(v.x, v.y, rgb, 8);
  screenFlash(rgb, 0.4);
  audio.die();
  toast(G.why, true, false);
  G.lock = 0.78;
  G.pending = -1;
}

function whyText(w) {
  if (w === 'coily') return '被科伊撞了';
  if (w === 'ball') return '被球砸了';
  if (w === 'fall') return '跳下塔了';
  return '';
}

function respawnOrOver() {
  if (G.lives <= 0) {
    showOver();
    return;
  }
  G.player = makeHopper('player', 0, 0);
  G.player.inv = INVULN;
  G.player.squash = 0.62;
  G.coily = null;
  G.balls = [];
  G.pending = -1;
  G.spawnCd = spawnInterval(G.round, G.chase) * 0.4;
  G.coilyCd = coilySpawnDelay(G.chase) * 0.7;
  G.lock = 0;
  G.lureT = 0;
  toast('再跳', false, false);
  hudPlay();
}

function landPlayer() {
  var p = G.player;
  var dest = { kind: p.destKind, r: p.r, c: p.c, id: p.discId };
  var v, res, col, gained, pal;
  p.hopT = 1;
  p.squash = 0.52;
  v = visEnt(p);

  if (dest.kind === 'fall') {
    kill('fall');
    p.fallV = 90;
    return;
  }
  if (dest.kind === 'disc') {
    startRide(dest.id);
    return;
  }

  p.state = 'idle';
  G.pop[p.r][p.c] = 1.22;
  audio.land();
  kick(2.8);
  burst(v.x, v.y + 6, 8, [255, 200, 120], 46, 0.22, 30);
  ringAt(v.x, v.y + 4, [255, 196, 90]);

  res = applyFlip(G.tiles[p.r][p.c], G.need, doesRevert(G.round, G.chase));
  G.tiles[p.r][p.c] = res.level;
  pal = palette(G.round);
  col = pal.tops[Math.min(res.level, pal.tops.length - 1)];

  if (res.flipped) {
    G.flash[p.r][p.c] = 1;
    bumpCombo();
    gained = FLIP_SCORE * G.combo;
    addScore(gained, v.x, v.y, G.combo >= 2 ? '+' + gained : null);
    audio.flip(G.combo);
    hitStop(0.042);
    spark(v.x, v.y, col, 7);
    burst(v.x, v.y, 12, col, 70, 0.32, 16);
    screenFlash(col, 0.16);
    kick(3.6);
  } else if (res.revert) {
    G.flash[p.r][p.c] = 0.7;
    resetCombo();
    audio.revert();
    hitStop(0.03);
    burst(v.x, v.y, 8, pal.tops[0], 50, 0.24, 14);
  } else {
    hitStop(0.026);
  }
  syncTiles();

  if (flippedCount(G.tiles, G.need) >= cubeCount()) {
    nextRound();
    return;
  }
  checkHits();
}

function startRide(id) {
  var p = G.player;
  var d = G.discs[id];
  var w = d ? discWorld(d) : standXY(p.fr, p.fc);
  p.state = 'ride';
  p.discId = id;
  p.hopT = 1;
  p.rideT = 0;
  p.rideX0 = w.x;
  p.rideY0 = w.y;
  if (d) {
    d.fly = true;
    d.flyT = 0;
  }
  audio.disc();
  hitStop(0.05);
  kick(4);
  burst(w.x, w.y, 14, [0, 240, 255], 70, 0.36, 8);
  spark(w.x, w.y, [255, 227, 107], 6);
  toast('飞碟', false, true);
}

function finishRide() {
  var p = G.player;
  var d = G.discs[p.discId];
  var res, v, pal, col, gained;
  p.state = 'idle';
  p.r = 0;
  p.c = 0;
  p.fr = 0;
  p.fc = 0;
  p.hopT = 1;
  p.destKind = 'cube';
  p.squash = 0.6;
  if (d) {
    d.gone = true;
    d.fly = false;
  }
  p.discId = -1;
  v = standXY(0, 0);
  G.pop[0][0] = 1.2;
  res = applyFlip(G.tiles[0][0], G.need, doesRevert(G.round, G.chase));
  G.tiles[0][0] = res.level;
  pal = palette(G.round);
  col = pal.tops[Math.min(res.level, pal.tops.length - 1)];
  if (res.flipped) {
    G.flash[0][0] = 1;
    bumpCombo();
    gained = FLIP_SCORE * G.combo;
    addScore(gained, v.x, v.y, '+' + gained);
    audio.flip(G.combo);
  }
  audio.land();
  burst(v.x, v.y, 16, [0, 240, 255], 80, 0.4, 12);
  ringAt(v.x, v.y, [0, 240, 255]);
  syncTiles();
  if (flippedCount(G.tiles, G.need) >= cubeCount()) nextRound();
}

function tryHop(dir) {
  var p, dest, face;
  if (G.mode !== 'play') return;
  if (G.lock > 0) return;
  p = G.player;
  if (p.dead || p.state === 'fall' || p.state === 'ride') return;
  if (p.hopT < 1 || p.state === 'hop') {
    G.pending = dir;
    return;
  }
  dest = hopDest(p.r, p.c, dir, G.discs);
  p.fr = p.r;
  p.fc = p.c;
  p.dir = dir;
  p.destKind = dest.kind;
  p.discId = dest.kind === 'disc' ? dest.id : -1;
  p.r = dest.r;
  p.c = dest.c;
  p.hopT = reduceMotion() ? 1 : 0;
  p.hopDur = playerHopTime();
  p.state = 'hop';
  p.squash = 1.32;
  face = (dir === UR || dir === DR) ? 1 : -1;
  p.face = face;
  G.pending = -1;
  if (valid(p.fr, p.fc)) G.pop[p.fr][p.fc] = 1.1;
  if (dest.kind === 'disc') {
    G.lureT = 1.15;
    G.lureDir = dir;
    G.lureR = p.fr;
    G.lureC = p.fc;
  }
  audio.hop(G.combo);
  kick(2.2);
  if (reduceMotion()) landPlayer();
}

function occupierAt(r, c) {
  var i, b;
  if (!valid(r, c)) return null;
  if (G.coily && !G.coily.dead && G.coily.hopT >= 1 && G.coily.state !== 'drop' && G.coily.state !== 'fall') {
    if (G.coily.r === r && G.coily.c === c) return G.coily.snake ? 'coily' : 'ball';
  }
  for (i = 0; i < G.balls.length; i++) {
    b = G.balls[i];
    if (b.dead || b.hopT < 1 || b.state === 'drop' || b.state === 'fall') continue;
    if (b.r === r && b.c === c) return 'ball';
  }
  return null;
}

function checkHits() {
  var p = G.player;
  var hit;
  if (G.mode !== 'play' || p.dead || p.inv > 0) return;
  if (p.state === 'ride' || p.state === 'hop' || p.state === 'fall') return;
  if (p.hopT < 1) return;
  hit = occupierAt(p.r, p.c);
  if (hit) kill(hit);
}

function startEnemyHop(e, dir) {
  var dest, discs;
  discs = e.snake && G.lureT > 0 ? G.discs : null;
  dest = hopDest(e.r, e.c, dir, discs);
  e.fr = e.r;
  e.fc = e.c;
  e.dir = dir;
  e.destKind = dest.kind;
  e.discId = dest.kind === 'disc' ? dest.id : -1;
  e.r = dest.r;
  e.c = dest.c;
  e.hopT = reduceMotion() ? 1 : 0;
  e.state = 'hop';
  e.squash = 1.28;
  e.face = (dir === UR || dir === DR) ? 1 : -1;
  if (e.trail) {
    e.trail.push({ r: e.fr, c: e.fc });
    if (e.trail.length > 5) e.trail.shift();
  }
  if (reduceMotion()) landEnemy(e);
}

function landEnemy(e) {
  var v;
  e.hopT = 1;
  e.squash = 0.62;
  v = visEnt(e);
  if (e.destKind === 'fall' || e.destKind === 'disc') {
    e.state = 'fall';
    e.dead = true;
    e.fallV = 80;
    e.fallY = 0;
    burst(v.x, v.y, 8, e.kind === 'coily' ? [180, 90, 255] : [255, 80, 140], 50, 0.25, 20);
    return;
  }
  e.state = 'idle';
  if (valid(e.r, e.c)) G.pop[e.r][e.c] = Math.max(G.pop[e.r][e.c], 1.08);
  if (e.kind === 'ball' || (e.kind === 'coily' && !e.snake)) audio.bounce();
  burst(v.x, v.y + 4, 4, e.kind === 'coily' ? [180, 90, 255] : [255, 70, 140], 30, 0.16, 18);

  if (e.kind === 'coily' && !e.snake && e.r === SIZE - 1) {
    e.snake = true;
    e.wait = 0.18;
    e.squash = 1.4;
    audio.hatch();
    burst(v.x, v.y, 16, [196, 92, 255], 80, 0.4, 14);
    spark(v.x, v.y, [255, 180, 255], 8);
    toast('科伊出洞', true, false);
  } else {
    e.wait = e.kind === 'coily' && e.snake
      ? coilyWait(G.round, G.chase)
      : ballWait(G.round, G.chase);
  }
  if (G.player && !G.player.dead && G.player.hopT >= 1 && G.player.state === 'idle') {
    if (e.r === G.player.r && e.c === G.player.c) {
      kill(e.kind === 'coily' && e.snake ? 'coily' : 'ball');
    }
  }
}

function splatCoily(e) {
  var v = visEnt(e);
  e.state = 'dead';
  burst(v.x, v.y, 34, [196, 92, 255], 140, 0.62, 26);
  burst(v.x, v.y, 16, [255, 61, 184], 100, 0.5, 18);
  burst(v.x, v.y, 10, [255, 227, 107], 70, 0.32, 10);
  spark(v.x, v.y, [230, 160, 255], 14);
  shardBurst(v.x, v.y, [160, 70, 230]);
  ringAt(v.x, v.y, [196, 92, 255]);
  audio.splat();
  hitStop(0.07);
  splatKick();
  shake(8);
  screenFlash([196, 92, 255], 0.42);
  addScore(COILY_SCORE, v.x, v.y, '科伊 +' + COILY_SCORE);
  toast('科伊摔了', false, true);
  G.coily = null;
  G.coilyCd = coilySpawnDelay(G.chase) + 0.45;
  G.lureT = 0;
}

function spawnCoily() {
  var e = makeHopper('coily', 0, 0);
  e.state = 'drop';
  e.dropT = 0;
  e.snake = false;
  e.hopDur = ballHopTime(G.round, G.chase);
  e.wait = 0.05;
  G.coily = e;
}

function spawnBall() {
  var e = makeHopper('ball', 0, 0);
  e.state = 'drop';
  e.dropT = 0;
  e.hopDur = ballHopTime(G.round, G.chase);
  e.wait = 0.04;
  G.balls.push(e);
}

function liveBalls() {
  var n = 0, i;
  for (i = 0; i < G.balls.length; i++) if (!G.balls[i].dead) n++;
  return n;
}

function thinkEnemy(e) {
  var dir, pr, pc;
  if (e.wait > 0) return;
  if (e.hopT < 1) return;
  if (e.state !== 'idle') return;
  if (e.kind === 'coily' && e.snake) {
    if (G.lureT > 0) {
      if (e.r === G.lureR && e.c === G.lureC) {
        dir = G.lureDir;
        e.hopDur = coilyHopTime(G.round, G.chase);
        startEnemyHop(e, dir);
        return;
      }
      if (bfsDist(e.r, e.c, G.lureR, G.lureC) <= 1) {
        dir = pickCoilyDir(e.r, e.c, G.lureR, G.lureC);
        if (dir >= 0) {
          e.hopDur = coilyHopTime(G.round, G.chase);
          startEnemyHop(e, dir);
          return;
        }
      }
    }
    pr = G.player.r;
    pc = G.player.c;
    if (G.player.hopT < 1 && G.player.destKind === 'cube' && valid(G.player.r, G.player.c)) {
      pr = G.player.r;
      pc = G.player.c;
    } else if (G.player.hopT >= 1) {
      pr = G.player.r;
      pc = G.player.c;
    } else {
      pr = G.player.fr;
      pc = G.player.fc;
    }
    dir = pickCoilyDir(e.r, e.c, pr, pc);
    if (dir < 0) return;
    e.hopDur = coilyHopTime(G.round, G.chase);
    startEnemyHop(e, dir);
  } else {
    dir = pickBallDir(e.r, e.c);
    e.hopDur = ballHopTime(G.round, G.chase);
    startEnemyHop(e, dir);
  }
}

function tickHopper(e, dt) {
  if (!e || e.dead && e.state !== 'fall' && e.state !== 'dead') return;
  e.squash += (1 - e.squash) * Math.min(1, dt * 12);
  if (e.inv > 0) e.inv -= dt;
  if (e.state === 'drop') {
    e.dropT += dt / 0.38;
    if (e.dropT >= 1) {
      e.dropT = 1;
      e.state = 'idle';
      e.hopT = 1;
      e.squash = 0.6;
      e.wait = 0.06;
      if (e.kind !== 'player') {
        if (G.player && !G.player.dead && G.player.hopT >= 1 && G.player.r === 0 && G.player.c === 0 && G.player.state === 'idle') {
          kill(e.kind === 'coily' && e.snake ? 'coily' : 'ball');
        }
      }
    }
    return;
  }
  if (e.state === 'ride') {
    e.rideT += dt / 0.82;
    if (e.rideT >= 1) {
      e.rideT = 1;
      finishRide();
    }
    return;
  }
  if (e.state === 'fall' || (e.dead && e.state === 'dead')) {
    e.fallV += 520 * dt;
    e.fallY += e.fallV * dt;
    e.spin += dt * 8;
    e.fallX += (e.face || 1) * 18 * dt;
    return;
  }
  if (e.hopT < 1) {
    e.hopT += dt / (e.hopDur || PLAYER_HOP);
    if (e.hopT >= 1) {
      e.hopT = 1;
      if (e.kind === 'player') landPlayer();
      else landEnemy(e);
    }
    return;
  }
  if (e.wait > 0) e.wait -= dt;
}

function tickFx(dt) {
  var i, p;
  for (i = particles.length - 1; i >= 0; i--) {
    p = particles[i];
    p.t -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.g * dt * 18;
    if (p.t <= 0) particles.splice(i, 1);
  }
  for (i = sparks.length - 1; i >= 0; i--) {
    p = sparks[i];
    p.t -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.t <= 0) sparks.splice(i, 1);
  }
  for (i = rings.length - 1; i >= 0; i--) {
    p = rings[i];
    p.t += dt;
    if (p.t >= p.max) rings.splice(i, 1);
  }
  for (i = floats.length - 1; i >= 0; i--) {
    p = floats[i];
    p.t -= dt;
    p.y -= 28 * dt;
    if (p.t <= 0) floats.splice(i, 1);
  }
  for (i = shards.length - 1; i >= 0; i--) {
    p = shards[i];
    p.t -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 220 * dt;
    p.rot += p.vr * dt;
    if (p.t <= 0) shards.splice(i, 1);
  }
  var r, c;
  for (r = 0; r < SIZE; r++) {
    for (c = 0; c <= r; c++) {
      if (G.flash[r][c] > 0) G.flash[r][c] = Math.max(0, G.flash[r][c] - dt * 3.2);
      if (G.pop[r][c] > 1) G.pop[r][c] = lerp(G.pop[r][c], 1, Math.min(1, dt * 10));
    }
  }
  if (G.flashA > 0) G.flashA = Math.max(0, G.flashA - dt * 1.8);
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
  G.kickX *= Math.max(0, 1 - dt * 14);
  G.kickY *= Math.max(0, 1 - dt * 14);
}

function step(dt) {
  var i, d, b;
  if (G.mode === 'title') {
    G.clock += dt;
    tickFx(dt);
    G.player.squash = 1 + Math.sin(G.clock * 3.2) * 0.04;
    return;
  }
  if (G.mode === 'over') {
    G.clock += dt;
    tickHopper(G.player, dt);
    if (G.coily) tickHopper(G.coily, dt);
    for (i = 0; i < G.balls.length; i++) tickHopper(G.balls[i], dt);
    tickFx(dt);
    return;
  }

  G.clock += dt;
  if (G.comboAge > 0) {
    G.comboAge -= dt;
    if (G.comboAge <= 0) resetCombo();
  }
  if (G.lureT > 0) G.lureT -= dt;

  if (G.clearT > 0) {
    G.clearT -= dt;
    G.lock = Math.max(G.lock, G.clearT);
    tickHopper(G.player, dt);
    tickFx(dt);
    if (G.clearT <= 0) beginNextRound();
    return;
  }

  tickHopper(G.player, dt);
  if (G.coily) {
    tickHopper(G.coily, dt);
    if (G.coily && G.coily.dead && G.coily.state === 'fall' && G.coily.fallY > 48) {
      if (G.coily.snake) splatCoily(G.coily);
      else G.coily = null;
    }
  }
  for (i = G.balls.length - 1; i >= 0; i--) {
    b = G.balls[i];
    tickHopper(b, dt);
    if (b.dead && b.fallY > 110) G.balls.splice(i, 1);
  }

  for (i = 0; i < G.discs.length; i++) {
    d = G.discs[i];
    if (d.fly && !d.gone) {
      d.flyT += dt / 0.82;
      if (d.flyT > 1) d.flyT = 1;
    }
  }

  if (G.lock > 0) {
    G.lock -= dt;
    if (G.lock <= 0) {
      G.lock = 0;
      if (G.player.dead) respawnOrOver();
    }
    tickFx(dt);
    return;
  }

  if (G.player.hopT >= 1 && G.pending >= 0 && G.player.state === 'idle') {
    tryHop(G.pending);
  }

  if (G.coily && !G.coily.dead) thinkEnemy(G.coily);
  for (i = 0; i < G.balls.length; i++) {
    if (!G.balls[i].dead) thinkEnemy(G.balls[i]);
  }

  if (!G.coily) {
    G.coilyCd -= dt;
    if (G.coilyCd <= 0) spawnCoily();
  }
  G.spawnCd -= dt;
  if (G.spawnCd <= 0 && liveBalls() < maxBalls(G.round, G.chase)) {
    spawnBall();
    G.spawnCd = spawnInterval(G.round, G.chase);
  } else if (G.spawnCd <= 0) {
    G.spawnCd = 0.4;
  }

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
  L.y = Math.max(2, (avH - WORLD_H * s) / 2 * 0.72);
}

function sx(x) { return L.x + x * L.s; }
function sy(y) { return L.y + y * L.s; }
function sc(n) { return n * L.s; }

function topColor(r, c) {
  var pal = palette(G.round);
  var lv = G.tiles[r][c];
  var tops = pal.tops;
  var col, nxt, t;
  if (lv >= G.need) col = tops[tops.length - 1];
  else if (lv <= 0) col = tops[0];
  else col = tops[Math.min(lv, tops.length - 2)];
  if (G.flash[r][c] > 0) {
    nxt = [255, 255, 255];
    t = Math.min(1, G.flash[r][c]);
    col = mixRgb(col, nxt, t * 0.85);
  }
  if (G.mode === 'title') {
    t = 0.5 + 0.5 * Math.sin(G.clock * 2.4 + r * 0.7 + c);
    col = mixRgb(tops[0], tops[tops.length - 1], t * 0.35);
  }
  return col;
}

function drawCube(r, c) {
  var p = cubeXY(r, c);
  var x = sx(p.x);
  var y = sy(p.y);
  var hw = sc(HW);
  var hh = sc(HH);
  var f = sc(FACE);
  var pal = palette(G.round);
  var pop = G.pop[r][c] || 1;
  var top = topColor(r, c);
  var cx, cy, k;
  var Lcol = pal.L;
  var Rcol = pal.R;
  var g;

  ctx.beginPath();
  ctx.moveTo(x - hw, y + hh);
  ctx.lineTo(x, y + hh * 2);
  ctx.lineTo(x, y + hh * 2 + f);
  ctx.lineTo(x - hw, y + hh + f);
  ctx.closePath();
  ctx.fillStyle = rgba(Lcol, 1);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + hw, y + hh);
  ctx.lineTo(x, y + hh * 2);
  ctx.lineTo(x, y + hh * 2 + f);
  ctx.lineTo(x + hw, y + hh + f);
  ctx.closePath();
  ctx.fillStyle = rgba(Rcol, 1);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = Math.max(1, sc(0.8));
  ctx.beginPath();
  ctx.moveTo(x, y + hh * 2);
  ctx.lineTo(x, y + hh * 2 + f);
  ctx.stroke();

  cx = x;
  cy = y + hh;
  k = pop;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(k, k);
  ctx.translate(-cx, -cy);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + hw, y + hh);
  ctx.lineTo(x, y + hh * 2);
  ctx.lineTo(x - hw, y + hh);
  ctx.closePath();
  g = ctx.createLinearGradient(x - hw * 0.2, y, x + hw * 0.3, y + hh * 2);
  g.addColorStop(0, rgba(mixRgb(top, [255, 255, 255], 0.22), 1));
  g.addColorStop(0.55, rgba(top, 1));
  g.addColorStop(1, rgba(mixRgb(top, [0, 0, 0], 0.18), 1));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = rgba(mixRgb(top, [255, 255, 255], 0.4), 0.55);
  ctx.lineWidth = Math.max(1, sc(1.1));
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - hw, y + hh);
  ctx.stroke();
  ctx.restore();

  if (G.tiles[r][c] >= G.need && G.mode !== 'title') {
    ctx.strokeStyle = rgba([0, 240, 255], 0.22 + 0.12 * Math.sin(G.clock * 5 + r));
    ctx.lineWidth = Math.max(1, sc(1.4));
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + hw, y + hh);
    ctx.lineTo(x, y + hh * 2);
    ctx.lineTo(x - hw, y + hh);
    ctx.closePath();
    ctx.stroke();
  }
}

function drawDisc(d) {
  var w, x, y, bob, rx, ry;
  if (d.gone && !d.fly) return;
  w = discWorld(d);
  x = sx(w.x);
  y = sy(w.y);
  bob = d.fly ? 0 : Math.sin(G.clock * 4.2 + d.row) * sc(1.6);
  y += bob;
  rx = sc(16);
  ry = sc(6.2);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, sc(7), rx * 0.8, ry * 0.6, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#00f0ff';
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#7af6ff';
  ctx.beginPath();
  ctx.ellipse(0, -sc(1.2), rx * 0.72, ry * 0.55, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffe36b';
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 0.28, ry * 0.32, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,61,184,0.7)';
  ctx.lineWidth = Math.max(1, sc(1.2));
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 0.92, ry * 0.92, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function drawShadow(x, y, s) {
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.ellipse(sx(x), sy(y + 8), sc(8 * (s || 1)), sc(3.2 * (s || 1)), 0, 0, TAU);
  ctx.fill();
}

function drawPlayerAt(x, y, e) {
  var hop, feet, blink, s;
  hop = e.hopT < 1 ? Math.sin(e.hopT * Math.PI) : 0;
  feet = Math.sin(G.clock * 10) * (e.hopT < 1 ? 3.2 : 1.2);
  blink = e.inv > 0 && ((G.clock * 18) | 0) % 2 === 0;
  if (blink) return;
  s = sc(1);
  ctx.save();
  ctx.translate(sx(x), sy(y));
  ctx.scale(e.face || 1, 1);
  ctx.scale(2 - e.squash, e.squash);
  if (e.state === 'fall' || e.dead) ctx.rotate(e.spin || 0.4);

  ctx.fillStyle = '#c45a12';
  ctx.beginPath();
  ctx.ellipse(-4.2 * s, 6.5 * s + feet, 3.1 * s, 2.4 * s, -0.3, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(4.4 * s, 6.5 * s - feet, 3.1 * s, 2.4 * s, 0.3, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#ff8a28';
  ctx.beginPath();
  ctx.ellipse(0, -1 * s - hop * sc(2), 9.4 * s, 8.6 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffc078';
  ctx.beginPath();
  ctx.ellipse(-1.5 * s, -3.2 * s, 5.2 * s, 4.4 * s, -0.2, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#ffd8a0';
  ctx.beginPath();
  ctx.ellipse(7.4 * s, 1.2 * s, 6.4 * s, 3.6 * s, 0.15, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff8a28';
  ctx.beginPath();
  ctx.ellipse(11.2 * s, 1.4 * s, 2.1 * s, 2.4 * s, 0.2, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.ellipse(2.4 * s, -4.2 * s, 1.35 * s, 1.7 * s, 0, 0, TAU);
  ctx.ellipse(5.6 * s, -4.4 * s, 1.2 * s, 1.55 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(2.7 * s, -4.7 * s, 0.45 * s, 0, TAU);
  ctx.arc(5.85 * s, -4.85 * s, 0.4 * s, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(-6.5 * s, -2.2 * s, 9 * s, 1.4 * s);

  ctx.restore();
}

function drawBallAt(x, y, e, snake) {
  var s = sc(1);
  var bob = e.hopT < 1 ? Math.sin(e.hopT * Math.PI) * sc(2) : 0;
  var col = snake ? [196, 92, 255] : (e.kind === 'coily' ? [168, 80, 255] : [255, 70, 150]);
  ctx.save();
  ctx.translate(sx(x), sy(y - bob));
  ctx.scale(2 - e.squash, e.squash);
  if (e.state === 'fall') ctx.rotate(e.spin || 0);

  if (snake) {
    ctx.fillStyle = rgba([120, 40, 180], 0.85);
    ctx.beginPath();
    ctx.ellipse(-6 * s, 6 * s, 5.5 * s, 4.2 * s, -0.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba([150, 60, 220], 0.9);
    ctx.beginPath();
    ctx.ellipse(-2 * s, 3 * s, 5.2 * s, 4.4 * s, -0.2, 0, TAU);
    ctx.fill();
  }

  ctx.fillStyle = rgba(col, 1);
  ctx.beginPath();
  ctx.ellipse(0, 0, snake ? 7.6 * s : 6.4 * s, snake ? 7.2 * s : 6.2 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(mixRgb(col, [255, 255, 255], 0.35), 0.9);
  ctx.beginPath();
  ctx.ellipse(-1.8 * s, -2.2 * s, 3 * s, 2.2 * s, -0.3, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(1.6 * s, -1.6 * s, 1.7 * s, 2.1 * s, 0, 0, TAU);
  ctx.ellipse(4.4 * s, -1.4 * s, 1.5 * s, 1.9 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(2 * s, -1.4 * s, 0.7 * s, 0, TAU);
  ctx.arc(4.7 * s, -1.2 * s, 0.62 * s, 0, TAU);
  ctx.fill();

  if (snake) {
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.moveTo(6.8 * s, 1.2 * s);
    ctx.lineTo(11.5 * s, 2.6 * s);
    ctx.lineTo(6.6 * s, 3.4 * s);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawCoilyTail(e) {
  var i, p, t, x, y, s;
  if (!e || !e.snake || !e.trail) return;
  s = sc(1);
  for (i = 0; i < e.trail.length; i++) {
    t = e.trail[i];
    if (!valid(t.r, t.c)) continue;
    p = standXY(t.r, t.c);
    x = sx(p.x);
    y = sy(p.y + 4);
    ctx.fillStyle = rgba([140, 50, 210], 0.28 + i * 0.12);
    ctx.beginPath();
    ctx.ellipse(x, y, (4.2 + i * 0.6) * s, (3.2 + i * 0.4) * s, -0.3, 0, TAU);
    ctx.fill();
  }
}

function drawHints() {
  var p = G.player;
  var i, dest, pos, d;
  if (G.mode !== 'play' || p.dead || p.hopT < 1 || p.state !== 'idle') return;
  ctx.save();
  ctx.globalAlpha = 0.28 + 0.1 * Math.sin(G.clock * 6);
  for (i = 0; i < 4; i++) {
    dest = hopDest(p.r, p.c, i, G.discs);
    if (dest.kind === 'cube') {
      pos = cubeXY(dest.r, dest.c);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = Math.max(1, sc(1.4));
      ctx.beginPath();
      ctx.moveTo(sx(pos.x), sy(pos.y));
      ctx.lineTo(sx(pos.x + HW), sy(pos.y + HH));
      ctx.lineTo(sx(pos.x), sy(pos.y + HH * 2));
      ctx.lineTo(sx(pos.x - HW), sy(pos.y + HH));
      ctx.closePath();
      ctx.stroke();
    } else if (dest.kind === 'disc' && G.discs[dest.id]) {
      d = discWorld(G.discs[dest.id]);
      ctx.strokeStyle = '#ffe36b';
      ctx.lineWidth = Math.max(1, sc(1.6));
      ctx.beginPath();
      ctx.ellipse(sx(d.x), sy(d.y), sc(18), sc(7), 0, 0, TAU);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawFx() {
  var i, o, a, r;
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

function depthOf(e) {
  if (!e) return -1;
  if (e.state === 'ride' || e.state === 'fall' || e.state === 'drop' || e.dead) return 100;
  if (e.hopT < 1) return Math.max(e.fr, valid(e.r, e.c) ? e.r : e.fr) + 0.45;
  return e.r;
}

function drawActors() {
  var list = [];
  var i, e, v, d;
  if (G.player && G.mode !== 'title') list.push(G.player);
  if (G.mode === 'title') list.push(G.player);
  if (G.coily && !G.coily.dead) list.push(G.coily);
  if (G.coily && G.coily.dead && G.coily.state === 'fall') list.push(G.coily);
  for (i = 0; i < G.balls.length; i++) {
    if (!G.balls[i].dead || G.balls[i].state === 'fall') list.push(G.balls[i]);
  }
  list.sort(function (a, b) { return depthOf(a) - depthOf(b); });

  for (d = 0; d < G.discs.length; d++) drawDisc(G.discs[d]);

  for (i = 0; i < list.length; i++) {
    e = list[i];
    v = visEnt(e);
    if (e.state !== 'fall' && e.state !== 'drop') drawShadow(v.x, v.y, e.kind === 'player' ? 1 : 0.75);
    if (e.kind === 'player') drawPlayerAt(v.x, v.y, e);
    else {
      if (e.kind === 'coily' && e.snake) drawCoilyTail(e);
      drawBallAt(v.x, v.y, e, e.kind === 'coily' && e.snake);
    }
  }
}

function drawBg() {
  var g, i, x, y;
  ctx.fillStyle = '#07030c';
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(OX), sy(OY + 40), sc(20), sx(OX), sy(OY + 90), sc(240));
  g.addColorStop(0, 'rgba(255,138,40,0.14)');
  g.addColorStop(1, 'rgba(255,138,40,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(OX + 120), sy(OY + 200), sc(10), sx(OX + 120), sy(OY + 200), sc(180));
  g.addColorStop(0, 'rgba(255,61,184,0.08)');
  g.addColorStop(1, 'rgba(255,61,184,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  for (i = 0; i < 28; i++) {
    x = ((i * 97 + 13) % (WORLD_W - 20)) + 10;
    y = ((i * 53 + 8) % 90) + 8;
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), sc(0.7 + (i % 3) * 0.35), 0, TAU);
    ctx.fill();
  }
}

function draw() {
  var r, c, shx = 0, shy = 0;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawBg();

  if (G.shake > 0 && !reduceMotion()) {
    shx = (Math.random() - 0.5) * G.shake * 0.7;
    shy = (Math.random() - 0.5) * G.shake * 0.7;
  }
  ctx.save();
  ctx.translate(shx + G.kickX, shy + G.kickY);

  for (r = 0; r < SIZE; r++) {
    for (c = 0; c <= r; c++) drawCube(r, c);
  }
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
  var r, c, p, best, d, w, dx, dy, dist;
  best = null;
  for (r = SIZE - 1; r >= 0; r--) {
    for (c = 0; c <= r; c++) {
      p = cubeXY(r, c);
      if (inDiamond(wx, wy, p.x, p.y)) {
        return { kind: 'cube', r: r, c: c };
      }
    }
  }
  for (d = 0; d < G.discs.length; d++) {
    if (G.discs[d].gone || G.discs[d].fly) continue;
    w = discWorld(G.discs[d]);
    dx = wx - w.x;
    dy = wy - w.y;
    dist = (dx * dx) / (18 * 18) + (dy * dy) / (8 * 8);
    if (dist < 1.15) return { kind: 'disc', id: d };
  }
  return best;
}

function dirBetween(r0, c0, r1, c1) {
  var i, d;
  for (i = 0; i < 4; i++) {
    d = hopDest(r0, c0, i, G.discs);
    if (d.kind === 'cube' && d.r === r1 && d.c === c1) return i;
  }
  return -1;
}

function tapWorld(wx, wy) {
  var hit, p, i, dest, d;
  p = G.player;
  hit = findTap(wx, wy);
  if (!hit) {
    audio.ui();
    p.squash = 0.82;
    return;
  }
  if (hit.kind === 'cube') {
    if (hit.r === p.r && hit.c === p.c && p.hopT >= 1) {
      p.squash = 0.72;
      audio.ui();
      return;
    }
    i = dirBetween(p.r, p.c, hit.r, hit.c);
    if (i >= 0) tryHop(i);
    else {
      audio.ui();
      p.squash = 0.84;
    }
    return;
  }
  if (hit.kind === 'disc') {
    for (i = 0; i < 4; i++) {
      dest = hopDest(p.r, p.c, i, G.discs);
      if (dest.kind === 'disc' && dest.id === hit.id) {
        tryHop(i);
        return;
      }
    }
    audio.ui();
  }
}

function toWorld(clientX, clientY) {
  var r = canvas.getBoundingClientRect();
  return {
    x: (clientX - r.left - L.x) / L.s,
    y: (clientY - r.top - L.y) / L.s
  };
}

function swipeDir(dx, dy) {
  if (dx * dx + dy * dy < 24 * 24) return -1;
  if (dy < 0 && dx < 0) return UL;
  if (dy < 0 && dx >= 0) return UR;
  if (dy >= 0 && dx >= 0) return DR;
  return DL;
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

bindPad(btnUl, UL);
bindPad(btnUr, UR);
bindPad(btnDl, DL);
bindPad(btnDr, DR);

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
      startRun('classic');
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      startRun('chase');
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
      startRun('chase');
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
btnClassic.addEventListener('click', function () {
  audio.ensure();
  startRun('classic');
});
btnChase.addEventListener('click', function () {
  audio.ensure();
  startRun('chase');
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

bestEl.textContent = String(G.bestC);
renderPips();
showTitle();
resize();
hudPlay();
requestAnimationFrame(frame);

}
