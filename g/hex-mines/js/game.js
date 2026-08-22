'use strict';

/* Classic minesweeper on a pointy-top hex grid. Radius 5 / 7. */

var DIFF = {
  5: { radius: 5, mines: 12, key: 'playbox-hex-mines-best-5', name: '小' },
  7: { radius: 7, mines: 30, key: 'playbox-hex-mines-best-7', name: '中' }
};
var HEX_DIRS = [
  [1, 0], [1, -1], [0, -1],
  [-1, 0], [-1, 1], [0, 1]
];
var LONG_MS = 400;
var MOVE_PX = 12;
var TIME_CAP = 999;
var SQRT3 = Math.sqrt(3);
var NUM_COL = ['', '#4db8ff', '#3dff9a', '#ff5d7a', '#8b7cff', '#ff7a3d', '#00e0d0'];

function hexCount(radius) {
  return 3 * radius * (radius + 1) + 1;
}

function inHex(q, r, radius) {
  return Math.abs(q) <= radius && Math.abs(r) <= radius && Math.abs(q + r) <= radius;
}

function qrKey(q, r) {
  return q + ',' + r;
}

function buildCells(radius) {
  var cells = [];
  var at = {};
  var r, q, q0, q1, i;
  i = 0;
  for (r = -radius; r <= radius; r++) {
    q0 = Math.max(-radius, -r - radius);
    q1 = Math.min(radius, -r + radius);
    for (q = q0; q <= q1; q++) {
      at[qrKey(q, r)] = i;
      cells.push({
        q: q,
        r: r,
        mine: false,
        adj: 0,
        open: false,
        flag: false,
        hit: false,
        wrong: false
      });
      i += 1;
    }
  }
  return { cells: cells, at: at };
}

function indexAt(game, q, r) {
  var v = game.at[qrKey(q, r)];
  return v == null ? -1 : v;
}

function neighbors(game, i) {
  var c = game.cells[i];
  var out = [];
  var k, j;
  for (k = 0; k < 6; k++) {
    j = indexAt(game, c.q + HEX_DIRS[k][0], c.r + HEX_DIRS[k][1]);
    if (j >= 0) out.push(j);
  }
  return out;
}

function createGame(radius, mines) {
  var pack = buildCells(radius);
  return {
    radius: radius,
    mines: mines,
    cells: pack.cells,
    at: pack.at,
    placed: false,
    status: 'play',
    flags: 0,
    opened: 0,
    startAt: 0,
    seconds: 0
  };
}

function computeAdj(game) {
  var n = game.cells.length;
  var i, k, ns, a, cell;
  for (i = 0; i < n; i++) {
    cell = game.cells[i];
    if (cell.mine) {
      cell.adj = 0;
      continue;
    }
    ns = neighbors(game, i);
    a = 0;
    for (k = 0; k < ns.length; k++) {
      if (game.cells[ns[k]].mine) a += 1;
    }
    cell.adj = a;
  }
}

function pickIndices(total, count, exclude, rng) {
  var pool = [];
  var i;
  for (i = 0; i < total; i++) {
    if (!exclude[i]) pool.push(i);
  }
  if (pool.length < count) return null;
  var rand = rng || Math.random;
  for (i = 0; i < count; i++) {
    var j = i + ((rand() * (pool.length - i)) | 0);
    var tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, count);
}

function excludeAround(game, i) {
  var ex = {};
  ex[i] = true;
  var ns = neighbors(game, i);
  var k;
  for (k = 0; k < ns.length; k++) ex[ns[k]] = true;
  return ex;
}

function seedMines(game, mineList) {
  var n = game.cells.length;
  var i;
  for (i = 0; i < n; i++) {
    game.cells[i].mine = false;
    game.cells[i].adj = 0;
  }
  for (i = 0; i < mineList.length; i++) {
    game.cells[mineList[i]].mine = true;
  }
  computeAdj(game);
  game.placed = true;
}

function placeMines(game, safeIndex, rng) {
  var total = game.cells.length;
  var picked = pickIndices(total, game.mines, excludeAround(game, safeIndex), rng);
  if (!picked) {
    var only = {};
    only[safeIndex] = true;
    picked = pickIndices(total, game.mines, only, rng);
  }
  if (!picked) return false;
  seedMines(game, picked);
  return true;
}

function remaining(game) {
  return game.mines - game.flags;
}

function isWin(game) {
  return game.opened === game.cells.length - game.mines;
}

function revealSafe(game, start) {
  var stack = [start];
  var newly = [];
  while (stack.length) {
    var j = stack.pop();
    var c = game.cells[j];
    if (c.open || c.flag || c.mine) continue;
    c.open = true;
    game.opened += 1;
    newly.push(j);
    if (c.adj === 0) {
      var ns = neighbors(game, j);
      for (var k = 0; k < ns.length; k++) stack.push(ns[k]);
    }
  }
  return newly;
}

function autoFlagMines(game) {
  var n = game.cells.length;
  for (var i = 0; i < n; i++) {
    var c = game.cells[i];
    if (c.mine && !c.flag) {
      c.flag = true;
      game.flags += 1;
    }
  }
}

function finishWin(game) {
  game.status = 'win';
  autoFlagMines(game);
}

function finishLose(game, hits) {
  game.status = 'lose';
  var n = game.cells.length;
  var mark = {};
  var i;
  for (i = 0; i < hits.length; i++) {
    mark[hits[i]] = true;
    game.cells[hits[i]].hit = true;
    game.cells[hits[i]].open = true;
  }
  for (i = 0; i < n; i++) {
    var c = game.cells[i];
    if (c.flag && !c.mine) c.wrong = true;
    if (c.mine && !c.flag && !mark[i]) {
      c.open = true;
    }
  }
}

function ensurePlaced(game, i, rng) {
  if (game.placed) return true;
  return placeMines(game, i, rng);
}

function flagCell(game, i) {
  if (game.status !== 'play') return { type: 'noop' };
  var c = game.cells[i];
  if (c.open) return { type: 'noop' };
  c.flag = !c.flag;
  game.flags += c.flag ? 1 : -1;
  return { type: c.flag ? 'flag' : 'unflag', i: i };
}

function openCell(game, i, rng) {
  if (game.status !== 'play') return { type: 'noop' };
  var c = game.cells[i];
  if (c.open || c.flag) return { type: 'noop' };
  if (!ensurePlaced(game, i, rng)) return { type: 'noop' };
  if (!game.startAt) game.startAt = Date.now();
  c = game.cells[i];
  if (c.mine) {
    finishLose(game, [i]);
    return { type: 'hit', cells: [i] };
  }
  var newly = revealSafe(game, i);
  if (isWin(game)) {
    finishWin(game);
    return { type: 'win', cells: newly };
  }
  return {
    type: newly.length > 1 || (newly.length === 1 && game.cells[newly[0]].adj === 0) ? 'flood' : 'open',
    cells: newly
  };
}

function chordCell(game, i) {
  if (game.status !== 'play') return { type: 'noop' };
  var c = game.cells[i];
  if (!c.open || c.adj === 0) return { type: 'noop' };
  var ns = neighbors(game, i);
  var flags = 0;
  var k;
  for (k = 0; k < ns.length; k++) {
    if (game.cells[ns[k]].flag) flags += 1;
  }
  if (flags !== c.adj) return { type: 'deny' };
  if (!game.startAt) game.startAt = Date.now();
  var hits = [];
  var newly = [];
  for (k = 0; k < ns.length; k++) {
    var n = ns[k];
    var nb = game.cells[n];
    if (nb.open || nb.flag) continue;
    if (nb.mine) {
      hits.push(n);
    } else {
      var part = revealSafe(game, n);
      var p;
      for (p = 0; p < part.length; p++) newly.push(part[p]);
    }
  }
  if (hits.length) {
    finishLose(game, hits);
    return { type: 'hit', cells: newly, hits: hits };
  }
  if (isWin(game)) {
    finishWin(game);
    return { type: 'win', cells: newly };
  }
  if (!newly.length) return { type: 'noop' };
  return { type: 'chord', cells: newly };
}

function currentSeconds(game) {
  if (!game.startAt) return 0;
  if (game.status !== 'play') return game.seconds;
  var s = (Date.now() - game.startAt) / 1000 | 0;
  if (s > TIME_CAP) s = TIME_CAP;
  return s;
}

function freezeTimer(game) {
  game.seconds = currentSeconds(game);
}

function hexPixel(q, r, size) {
  return {
    x: size * SQRT3 * (q + r / 2),
    y: size * 1.5 * r
  };
}

function hexRound(q, r) {
  var s = -q - r;
  var rq = Math.round(q);
  var rr = Math.round(r);
  var rs = Math.round(s);
  var dq = Math.abs(rq - q);
  var dr = Math.abs(rr - r);
  var ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return { q: rq, r: rr };
}

function pixelToHex(x, y, size) {
  var r = ((2 / 3) * y) / size;
  var q = x / (size * SQRT3) - r / 2;
  return hexRound(q, r);
}

/* ---------- self-tests (node) ---------- */

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assert failed');
}

function runSelfTests() {
  var g, r, k, ns, i, mines, c;

  assert(hexCount(5) === 91, 'radius 5 has 91 cells');
  assert(hexCount(7) === 169, 'radius 7 has 169 cells');
  g = createGame(5, 12);
  assert(g.cells.length === 91, 'built 91 cells');
  g = createGame(7, 30);
  assert(g.cells.length === 169, 'built 169 cells');

  g = createGame(5, 12);
  i = indexAt(g, 0, 0);
  assert(i >= 0, 'center exists');
  ns = neighbors(g, i);
  assert(ns.length === 6, 'center has 6 neighbors');
  i = indexAt(g, 5, 0);
  ns = neighbors(g, i);
  assert(ns.length === 3, 'vertex has 3 neighbors');
  i = indexAt(g, 5, -5);
  ns = neighbors(g, i);
  assert(ns.length === 3, 'another vertex has 3 neighbors');
  i = indexAt(g, 3, 0);
  ns = neighbors(g, i);
  assert(ns.length === 6, 'interior edge-ring has 6');
  assert(!inHex(6, 0, 5) && inHex(5, 0, 5), 'radius bound');

  g = createGame(5, 12);
  r = openCell(g, indexAt(g, 0, 0));
  assert(g.placed, 'mines after first open');
  assert(!g.cells[indexAt(g, 0, 0)].mine, 'first click safe');
  ns = neighbors(g, indexAt(g, 0, 0));
  for (k = 0; k < ns.length; k++) {
    assert(!g.cells[ns[k]].mine, 'first-click neighborhood safe');
  }
  assert(g.cells[indexAt(g, 0, 0)].adj === 0, 'first click is a zero');
  assert(g.cells[indexAt(g, 0, 0)].open, 'first cell opens');
  assert(r.type === 'flood' || r.type === 'win', 'first click floods');
  assert(g.startAt > 0, 'timer starts on first open');
  mines = 0;
  for (k = 0; k < g.cells.length; k++) {
    if (g.cells[k].mine) mines += 1;
    if (!g.cells[k].mine) assert(g.cells[k].adj >= 0 && g.cells[k].adj <= 6, 'adj 0-6');
  }
  assert(mines === 12, 'exactly 12 mines on small');

  g = createGame(2, 2);
  seedMines(g, [indexAt(g, 2, 0), indexAt(g, -2, 0)]);
  assert(g.cells[indexAt(g, 0, 0)].adj === 0, 'center far from rim mines');
  assert(g.cells[indexAt(g, 1, 0)].adj === 1, 'adj toward mine');
  assert(g.cells[indexAt(g, -1, 0)].adj === 1, 'adj toward other mine');
  r = openCell(g, indexAt(g, 0, 0));
  assert(r.type === 'win' || g.status === 'win' || g.cells[indexAt(g, 1, 0)].open, 'flood opens numbered rim');
  assert(g.cells[indexAt(g, 1, 0)].open, 'border number opens with flood');
  assert(!g.cells[indexAt(g, 2, 0)].open || g.cells[indexAt(g, 2, 0)].flag, 'mine not flooded');

  g = createGame(2, 2);
  seedMines(g, [indexAt(g, 2, 0), indexAt(g, -2, 0)]);
  r = openCell(g, indexAt(g, 0, 0));
  assert(g.status === 'win', 'flood of almost-empty board wins');
  assert(g.cells[indexAt(g, 2, 0)].flag && g.cells[indexAt(g, -2, 0)].flag, 'auto-flag remaining mines');
  assert(remaining(g) === 0, 'counter zero on win');

  g = createGame(2, 2);
  seedMines(g, [indexAt(g, 2, 0), indexAt(g, -2, 0)]);
  r = openCell(g, indexAt(g, 2, 0));
  assert(r.type === 'hit' && g.status === 'lose', 'opening a mine loses');
  assert(g.cells[indexAt(g, 2, 0)].hit, 'hit mine marked');
  assert(g.cells[indexAt(g, -2, 0)].open, 'other mines shown');

  g = createGame(2, 2);
  seedMines(g, [indexAt(g, 2, 0), indexAt(g, -2, 0)]);
  r = flagCell(g, indexAt(g, 2, 0));
  assert(r.type === 'flag' && remaining(g) === 1, 'flag decrements');
  r = openCell(g, indexAt(g, 2, 0));
  assert(r.type === 'noop', 'flagged cell will not open');
  flagCell(g, indexAt(g, 0, 0));
  flagCell(g, indexAt(g, 0, 1));
  assert(remaining(g) === -1, 'counter can go negative');
  flagCell(g, indexAt(g, 0, 0));
  assert(!g.cells[indexAt(g, 0, 0)].flag, 'flag toggles off');

  g = createGame(2, 2);
  seedMines(g, [indexAt(g, 2, 0), indexAt(g, -2, 0)]);
  flagCell(g, indexAt(g, 1, 0));
  openCell(g, indexAt(g, 0, 0));
  assert(g.cells[indexAt(g, 1, 0)].flag && !g.cells[indexAt(g, 1, 0)].open, 'flood skips flags');

  g = createGame(2, 2);
  seedMines(g, [indexAt(g, 1, 0), indexAt(g, -1, 0)]);
  assert(g.cells[indexAt(g, 0, 0)].adj === 2, 'center adj 2');
  g.cells[indexAt(g, 0, 0)].open = true;
  g.opened = 1;
  r = chordCell(g, indexAt(g, 0, 0));
  assert(r.type === 'deny', 'chord needs matching flags');
  flagCell(g, indexAt(g, 1, 0));
  flagCell(g, indexAt(g, -1, 0));
  r = chordCell(g, indexAt(g, 0, 0));
  assert(r.type !== 'deny' && r.type !== 'hit', 'matching flags chord');
  assert(g.cells[indexAt(g, 0, 1)].open, 'chord opens unflagged neighbors');
  assert(g.cells[indexAt(g, 1, 0)].flag && !g.cells[indexAt(g, 1, 0)].open, 'flagged mine stays');

  g = createGame(1, 1);
  seedMines(g, [indexAt(g, 1, 0)]);
  g.cells[indexAt(g, 0, 0)].open = true;
  g.opened = 1;
  flagCell(g, indexAt(g, 1, 0));
  r = chordCell(g, indexAt(g, 0, 0));
  assert(g.status === 'win', 'correct chord wins');
  assert(g.cells[indexAt(g, 0, 1)].open, 'radius-1 chord clears the ring');

  g = createGame(2, 2);
  seedMines(g, [indexAt(g, 1, 0), indexAt(g, -1, 0)]);
  g.cells[indexAt(g, 0, 0)].open = true;
  g.opened = 1;
  flagCell(g, indexAt(g, 0, 1));
  flagCell(g, indexAt(g, 0, -1));
  r = chordCell(g, indexAt(g, 0, 0));
  assert(r.type === 'hit' && g.status === 'lose', 'wrong-flag chord hits mine');
  assert(g.cells[indexAt(g, 1, 0)].hit, 'unflagged mine blows');
  assert(g.cells[indexAt(g, 0, 1)].wrong, 'wrong flag marked');

  g = createGame(2, 1);
  r = chordCell(g, indexAt(g, 0, 0));
  assert(r.type === 'noop', 'no chord on covered cells');

  g = createGame(1, 6);
  var ring = [];
  for (k = 0; k < 6; k++) ring.push(indexAt(g, HEX_DIRS[k][0], HEX_DIRS[k][1]));
  seedMines(g, ring);
  assert(g.cells[indexAt(g, 0, 0)].adj === 6, 'all six neighbors can be mines');

  g = createGame(5, 12);
  placeMines(g, indexAt(g, 5, 0));
  mines = 0;
  for (k = 0; k < g.cells.length; k++) if (g.cells[k].mine) mines += 1;
  assert(mines === 12, 'vertex first-click still 12 mines');
  assert(!g.cells[indexAt(g, 5, 0)].mine, 'vertex click safe');
  ns = neighbors(g, indexAt(g, 5, 0));
  for (k = 0; k < ns.length; k++) assert(!g.cells[ns[k]].mine, 'vertex neighborhood safe');

  var p = hexPixel(1, 0, 10);
  var h = pixelToHex(p.x, p.y, 10);
  assert(h.q === 1 && h.r === 0, 'pixel roundtrip east');
  p = hexPixel(0, 1, 10);
  h = pixelToHex(p.x, p.y, 10);
  assert(h.q === 0 && h.r === 1, 'pixel roundtrip south');
  p = hexPixel(-2, 3, 16);
  h = pixelToHex(p.x, p.y, 16);
  assert(h.q === -2 && h.r === 3, 'pixel roundtrip odd');

  g = createGame(7, 30);
  openCell(g, indexAt(g, 0, 0));
  mines = 0;
  for (k = 0; k < g.cells.length; k++) {
    c = g.cells[k];
    if (c.mine) mines += 1;
    if (!c.mine) assert(c.adj <= 6, 'no adj above 6');
  }
  assert(mines === 30, 'exactly 30 mines on medium');
  assert(DIFF[5].key === 'playbox-hex-mines-best-5', 'best key 5');
  assert(DIFF[7].key === 'playbox-hex-mines-best-7', 'best key 7');

  return 'ok';
}

/* ---------- audio + DOM ---------- */

if (typeof document === 'undefined') {
  console.log(runSelfTests());
} else {

var canvas = document.getElementById('board');
var ctx = canvas.getContext('2d');
var stageEl = document.getElementById('stage');
var overlayEl = document.getElementById('overlay');
var panelEl = document.getElementById('panel');
var ovTitle = document.getElementById('ov-title');
var ovLead = document.getElementById('ov-lead');
var mineEl = document.getElementById('mine-count');
var timerEl = document.getElementById('timer');
var bestEl = document.getElementById('best');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var ovRetry = document.getElementById('ov-retry');
var diff5 = document.getElementById('diff-5');
var diff7 = document.getElementById('diff-7');
var modeEl = document.getElementById('mode');
var modeOpen = document.getElementById('mode-open');
var modeFlag = document.getElementById('mode-flag');
var motionQ = window.matchMedia('(prefers-reduced-motion: reduce)');

var radius = 5;
var game = createGame(5, 12);
var flagMode = false;
var cursor = 0;
var showCursor = false;
var hoverI = -1;
var timerId = 0;
var press = null;
var layout = { ox: 0, oy: 0, size: 16, draw: 15, w: 1, h: 1, dpr: 1 };
var flashUntil = 0;
var flashSet = {};
var dirty = true;
var actx = null;
var muted = false;

function audioCtx() {
  if (!actx) {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    actx = new AC();
  }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}

function beep(freq, dur, vol, type, slide) {
  if (muted) return;
  var ac = audioCtx();
  if (!ac) return;
  var t0 = ac.currentTime;
  var osc = ac.createOscillator();
  var g = ac.createGain();
  osc.type = type || 'square';
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

var sfx = {
  open: function () { beep(620, 0.045, 0.035, 'triangle'); },
  flood: function () { beep(480, 0.07, 0.03, 'triangle', 280); },
  flag: function () { beep(740, 0.06, 0.04, 'square', 980); },
  unflag: function () { beep(420, 0.05, 0.03, 'triangle', 280); },
  deny: function () { beep(180, 0.05, 0.025, 'square'); },
  chord: function () { beep(520, 0.06, 0.035, 'square', 700); },
  win: function () {
    beep(392, 0.1, 0.055, 'square', 523);
    setTimeout(function () { beep(523, 0.1, 0.055, 'square', 659); }, 90);
    setTimeout(function () { beep(784, 0.2, 0.06, 'square'); }, 180);
  },
  lose: function () { beep(180, 0.36, 0.06, 'sawtooth', 70); }
};

function bestKey() {
  return DIFF[radius].key;
}

function loadBest() {
  try {
    var n = parseInt(localStorage.getItem(bestKey()) || '', 10);
    return isFinite(n) && n >= 0 ? n : null;
  } catch (e) {
    return null;
  }
}

function saveBest(n) {
  try { localStorage.setItem(bestKey(), String(n)); } catch (e) { /* ignore */ }
}

function reduceMotion() {
  return motionQ.matches;
}

function showTouchMode() {
  var touch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (touch) {
    modeEl.hidden = false;
    document.body.classList.add('touch');
  }
}

function requestDraw() {
  dirty = true;
}

function hexPath(c, x, y, size) {
  c.beginPath();
  var i, a;
  for (i = 0; i < 6; i++) {
    a = (60 * i - 30) * Math.PI / 180;
    if (i === 0) c.moveTo(x + size * Math.cos(a), y + size * Math.sin(a));
    else c.lineTo(x + size * Math.cos(a), y + size * Math.sin(a));
  }
  c.closePath();
}

function cellCenter(i) {
  var cell = game.cells[i];
  var p = hexPixel(cell.q, cell.r, layout.size);
  return { x: layout.ox + p.x, y: layout.oy + p.y };
}

function relayout() {
  var rect = stageEl.getBoundingClientRect();
  layout.w = Math.max(1, rect.width);
  layout.h = Math.max(1, rect.height);
  layout.dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, (layout.w * layout.dpr) | 0);
  canvas.height = Math.max(1, (layout.h * layout.dpr) | 0);
  canvas.style.width = layout.w + 'px';
  canvas.style.height = layout.h + 'px';
  ctx.setTransform(layout.dpr, 0, 0, layout.dpr, 0, 0);
  var pad = Math.max(8, Math.min(18, Math.min(layout.w, layout.h) * 0.04));
  var sizeW = (layout.w - pad * 2) / ((2 * radius + 1) * SQRT3);
  var sizeH = (layout.h - pad * 2) / (3 * radius + 2);
  layout.size = Math.max(8, Math.min(sizeW, sizeH));
  layout.draw = layout.size * 0.93;
  layout.ox = layout.w / 2;
  layout.oy = layout.h / 2;
  draw();
  dirty = false;
}

function drawFlag(x, y, size, faded) {
  var h = size * 0.72;
  var poleX = x - size * 0.16;
  var top = y - h * 0.42;
  ctx.save();
  ctx.globalAlpha = faded ? 0.45 : 1;
  ctx.strokeStyle = '#d5e4f5';
  ctx.lineWidth = Math.max(1.2, size * 0.08);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(poleX, top);
  ctx.lineTo(poleX, top + h);
  ctx.stroke();
  ctx.fillStyle = '#ff3db8';
  ctx.shadowColor = 'rgba(255, 61, 184, 0.7)';
  ctx.shadowBlur = size * 0.35;
  ctx.beginPath();
  ctx.moveTo(poleX + 1, top + h * 0.06);
  ctx.lineTo(poleX + size * 0.55, top + h * 0.28);
  ctx.lineTo(poleX + 1, top + h * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMine(x, y, size, hit) {
  var r = size * 0.22;
  ctx.save();
  ctx.fillStyle = hit ? '#ffd0e8' : '#edf5ff';
  ctx.strokeStyle = hit ? '#ffd0e8' : '#edf5ff';
  ctx.shadowColor = hit ? 'rgba(255, 61, 184, 0.7)' : 'rgba(237, 245, 255, 0.5)';
  ctx.shadowBlur = size * 0.35;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = Math.max(1.2, size * 0.08);
  ctx.lineCap = 'round';
  var k, a;
  for (k = 0; k < 4; k++) {
    a = (k * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.4, y + Math.sin(a) * r * 0.4);
    ctx.lineTo(x + Math.cos(a) * r * 1.85, y + Math.sin(a) * r * 1.85);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(x - r * 0.28, y - r * 0.28, r * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCross(x, y, size) {
  var s = size * 0.38;
  ctx.save();
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = Math.max(1.6, size * 0.1);
  ctx.lineCap = 'round';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(x - s, y - s);
  ctx.lineTo(x + s, y + s);
  ctx.moveTo(x + s, y - s);
  ctx.lineTo(x - s, y + s);
  ctx.stroke();
  ctx.restore();
}

function drawCell(i, now) {
  var c = game.cells[i];
  var pos = cellCenter(i);
  var x = pos.x;
  var y = pos.y;
  var s = layout.draw;
  var shade = ((c.q + c.r) & 1) === 1;
  var isHover = i === hoverI && game.status === 'play';
  var isCursor = showCursor && i === cursor;
  var isPressed = press && press.i === i && !press.flagged && !press.moved && !c.open && !c.flag;
  var isNb = press && press.nbs && press.nbs[i];
  var showMine = c.mine && (c.open || game.status === 'lose') && !c.flag;
  var showFlag = c.flag && !c.wrong;
  var showWrong = c.wrong;
  var showNum = c.open && !c.mine && c.adj > 0;
  var flashing = flashSet[i] && now < flashUntil;

  hexPath(ctx, x, y, s);

  if (c.open || showMine) {
    if (c.hit) ctx.fillStyle = '#4a1024';
    else if (flashing) ctx.fillStyle = shade ? '#1a3044' : '#24384c';
    else ctx.fillStyle = shade ? '#0e1720' : '#0b121a';
    ctx.fill();
    ctx.strokeStyle = c.hit ? 'rgba(255, 61, 184, 0.45)' : 'rgba(0, 240, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    var top = shade ? '#2a4156' : '#334b62';
    var bot = shade ? '#172636' : '#1c2e40';
    if (isPressed || isNb) {
      top = '#121c26';
      bot = '#0c141c';
    } else if (isHover) {
      top = shade ? '#3a536c' : '#44627c';
      bot = shade ? '#1e3244' : '#24384c';
    }
    var grd = ctx.createLinearGradient(x, y - s, x, y + s);
    grd.addColorStop(0, top);
    grd.addColorStop(1, bot);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1.35;
    ctx.stroke();
    hexPath(ctx, x, y, s * 0.98);
    ctx.strokeStyle = isHover ? 'rgba(220, 245, 255, 0.35)' : 'rgba(220, 245, 255, 0.2)';
    ctx.lineWidth = 1.05;
    ctx.stroke();
  }

  if (isCursor || (isHover && !c.open)) {
    hexPath(ctx, x, y, s * 0.98);
    ctx.strokeStyle = isCursor ? '#00f0ff' : 'rgba(0, 240, 255, 0.55)';
    ctx.lineWidth = isCursor ? 2.2 : 1.6;
    ctx.shadowColor = 'rgba(0, 240, 255, 0.45)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  if (showNum) {
    ctx.fillStyle = NUM_COL[c.adj] || '#f6f3ff';
    ctx.font = '800 ' + Math.max(10, s * 0.72) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.fillText(String(c.adj), x, y + 0.5);
    ctx.shadowBlur = 0;
  } else if (showMine) {
    drawMine(x, y, s, c.hit);
  } else if (showFlag) {
    drawFlag(x, y, s, false);
  } else if (showWrong) {
    drawFlag(x, y, s, true);
    drawCross(x, y, s);
  }
}

function draw(now) {
  now = now || Date.now();
  ctx.clearRect(0, 0, layout.w, layout.h);
  var glow = ctx.createRadialGradient(layout.ox, layout.oy, 10, layout.ox, layout.oy, Math.max(layout.w, layout.h) * 0.55);
  glow.addColorStop(0, 'rgba(0, 213, 255, 0.06)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, layout.w, layout.h);

  var i;
  for (i = 0; i < game.cells.length; i++) drawCell(i, now);

  if (flashUntil && now >= flashUntil) {
    flashSet = {};
    flashUntil = 0;
  }
}

function loop(now) {
  if (dirty || (flashUntil && now < flashUntil + 50)) {
    draw(now);
    dirty = false;
  }
  requestAnimationFrame(loop);
}

function updateMeters() {
  mineEl.textContent = String(remaining(game));
  timerEl.textContent = String(currentSeconds(game));
  var b = loadBest();
  bestEl.textContent = b === null ? '—' : String(b);
}

function tick() {
  if (game.status === 'play' && game.startAt) {
    timerEl.textContent = String(currentSeconds(game));
  }
}

function hideOverlay() {
  overlayEl.classList.add('hidden');
  panelEl.classList.remove('win', 'lose');
}

function showOverlay(kind, lead) {
  freezeTimer(game);
  panelEl.classList.remove('win', 'lose');
  panelEl.classList.add(kind);
  ovTitle.textContent = kind === 'win' ? '扫清了' : '踩雷了';
  ovLead.textContent = lead || '';
  overlayEl.classList.remove('hidden');
  ovRetry.focus();
}

function handleResult(res) {
  updateMeters();
  requestDraw();
  if (!res || res.type === 'noop') return;
  if (res.type === 'deny') {
    sfx.deny();
    return;
  }
  if (res.type === 'flag') {
    sfx.flag();
    if (navigator.vibrate) navigator.vibrate(12);
    return;
  }
  if (res.type === 'unflag') {
    sfx.unflag();
    return;
  }

  if (res.cells && !reduceMotion() && game.status === 'play') {
    var t = Date.now();
    flashUntil = t + 200;
    flashSet = {};
    var i;
    for (i = 0; i < res.cells.length; i++) flashSet[res.cells[i]] = 1;
  }

  if (res.type === 'hit') {
    freezeTimer(game);
    sfx.lose();
    if (!reduceMotion()) {
      stageEl.classList.remove('boom');
      void stageEl.offsetWidth;
      stageEl.classList.add('boom');
    }
    showOverlay('lose', '用时 ' + game.seconds + ' 秒');
    return;
  }
  if (res.type === 'win') {
    freezeTimer(game);
    var sec = game.seconds;
    var prev = loadBest();
    var note = '用时 ' + sec + ' 秒';
    if (prev === null || sec < prev) {
      saveBest(sec);
      note += ' · 新纪录';
    } else {
      note += ' · 最佳 ' + prev + ' 秒';
    }
    updateMeters();
    sfx.win();
    showOverlay('win', note);
    return;
  }
  if (res.type === 'flood') sfx.flood();
  else if (res.type === 'chord') sfx.chord();
  else sfx.open();
}

function restart(nextRadius) {
  if (nextRadius) radius = nextRadius;
  game = createGame(radius, DIFF[radius].mines);
  cursor = indexAt(game, 0, 0);
  showCursor = false;
  hoverI = -1;
  press = null;
  flashSet = {};
  flashUntil = 0;
  hideOverlay();
  stageEl.classList.remove('boom');
  diff5.setAttribute('aria-pressed', radius === 5 ? 'true' : 'false');
  diff7.setAttribute('aria-pressed', radius === 7 ? 'true' : 'false');
  relayout();
  updateMeters();
  canvas.focus();
}

function cellIndexFromEvent(ev) {
  var rect = canvas.getBoundingClientRect();
  var x = ev.clientX - rect.left;
  var y = ev.clientY - rect.top;
  var h = pixelToHex(x - layout.ox, y - layout.oy, layout.size);
  return indexAt(game, h.q, h.r);
}

function neighborMark(i) {
  var map = {};
  var c = game.cells[i];
  if (!c.open || c.adj === 0) return map;
  var ns = neighbors(game, i);
  var k;
  for (k = 0; k < ns.length; k++) {
    var nb = game.cells[ns[k]];
    if (!nb.open && !nb.flag) map[ns[k]] = 1;
  }
  return map;
}

function cancelPress() {
  if (press && press.timer) clearTimeout(press.timer);
  press = null;
  requestDraw();
}

function doFlag(i) {
  cursor = i;
  handleResult(flagCell(game, i));
}

function doOpen(i) {
  cursor = i;
  var c = game.cells[i];
  var res = c.open ? chordCell(game, i) : openCell(game, i);
  handleResult(res);
}

function doChord(i) {
  cursor = i;
  handleResult(chordCell(game, i));
}

function primaryAction(i) {
  if (game.status !== 'play') return;
  if (flagMode && !game.cells[i].open) {
    doFlag(i);
    return;
  }
  doOpen(i);
}

canvas.addEventListener('pointerdown', function (ev) {
  if (game.status !== 'play') return;
  var i = cellIndexFromEvent(ev);
  if (i < 0) return;
  ev.preventDefault();
  try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
  canvas.focus();
  audioCtx();
  hoverI = i;

  if (ev.button === 1) {
    doChord(i);
    return;
  }
  if (ev.button === 2) {
    if (press && !press.flagged) {
      if (press.timer) clearTimeout(press.timer);
      press.chorded = true;
      press.timer = 0;
      doChord(press.i);
      press = null;
      requestDraw();
      return;
    }
    doFlag(i);
    return;
  }
  if (ev.button !== 0) return;

  if (ev.buttons & 2) {
    doChord(i);
    press = { i: i, x: ev.clientX, y: ev.clientY, timer: 0, flagged: false, chorded: true, id: ev.pointerId, nbs: {} };
    return;
  }

  var t = 0;
  var nbs = {};
  if (game.cells[i].open) nbs = neighborMark(i);
  if (!game.cells[i].open) {
    t = setTimeout(function () {
      if (!press || press.timer !== t) return;
      press.flagged = true;
      press.nbs = {};
      doFlag(press.i);
      requestDraw();
    }, LONG_MS);
  }
  press = {
    i: i,
    x: ev.clientX,
    y: ev.clientY,
    timer: t,
    flagged: false,
    chorded: false,
    id: ev.pointerId,
    nbs: nbs
  };
  requestDraw();
});

canvas.addEventListener('pointermove', function (ev) {
  var i = cellIndexFromEvent(ev);
  if (press && press.id === ev.pointerId) {
    var dx = ev.clientX - press.x;
    var dy = ev.clientY - press.y;
    if (dx * dx + dy * dy > MOVE_PX * MOVE_PX) {
      if (press.timer) clearTimeout(press.timer);
      press.moved = true;
      press.nbs = {};
      requestDraw();
    }
  } else if (i !== hoverI) {
    hoverI = i;
    requestDraw();
  }
});

canvas.addEventListener('pointerup', function (ev) {
  if (ev.button === 1 || ev.button === 2) {
    if (press && press.id === ev.pointerId) press = null;
    requestDraw();
    return;
  }
  if (!press || press.id !== ev.pointerId) {
    requestDraw();
    return;
  }
  var info = press;
  if (info.timer) clearTimeout(info.timer);
  press = null;
  requestDraw();
  if (info.flagged || info.chorded || info.moved) return;
  if (info.i >= 0) primaryAction(info.i);
});

canvas.addEventListener('pointercancel', function () {
  cancelPress();
});

canvas.addEventListener('pointerleave', function () {
  if (!press) {
    hoverI = -1;
    requestDraw();
  }
});

canvas.addEventListener('contextmenu', function (ev) {
  ev.preventDefault();
});

modeOpen.addEventListener('click', function () {
  flagMode = false;
  modeOpen.setAttribute('aria-pressed', 'true');
  modeFlag.setAttribute('aria-pressed', 'false');
});

modeFlag.addEventListener('click', function () {
  flagMode = true;
  modeOpen.setAttribute('aria-pressed', 'false');
  modeFlag.setAttribute('aria-pressed', 'true');
});

function toggleMute() {
  muted = !muted;
  btnMute.classList.toggle('muted', muted);
  btnMute.textContent = muted ? '静' : '声';
  btnMute.setAttribute('aria-label', muted ? '开启声音' : '静音');
  if (!muted) audioCtx();
}

btnMute.addEventListener('click', toggleMute);
btnRetry.addEventListener('click', function () { restart(); });
ovRetry.addEventListener('click', function () { restart(); });
diff5.addEventListener('click', function () { restart(5); });
diff7.addEventListener('click', function () { restart(7); });

function moveCursor(dq, dr) {
  var cell = game.cells[cursor];
  var q = cell.q + dq;
  var r = cell.r + dr;
  var next = indexAt(game, q, r);
  if (next < 0) return;
  cursor = next;
  showCursor = true;
  hoverI = next;
  requestDraw();
}

window.addEventListener('keydown', function (ev) {
  var key = ev.key;
  if (key === 'm' || key === 'M') {
    toggleMute();
    return;
  }
  if (key === 'r' || key === 'R') {
    restart();
    return;
  }
  if (ev.target && (ev.target.tagName === 'INPUT' || ev.target.tagName === 'BUTTON')) {
    if (key === ' ' || key === 'Enter') return;
  }
  if (game.status !== 'play') return;

  var hexKeys = {
    w: [0, -1], W: [0, -1],
    e: [1, -1], E: [1, -1],
    d: [1, 0], D: [1, 0],
    x: [0, 1], X: [0, 1],
    s: [0, 1], S: [0, 1],
    z: [-1, 1], Z: [-1, 1],
    a: [-1, 0], A: [-1, 0],
    q: [-1, 0], Q: [-1, 0]
  };
  if (hexKeys[key]) {
    ev.preventDefault();
    moveCursor(hexKeys[key][0], hexKeys[key][1]);
    return;
  }
  if (key === 'ArrowUp') {
    ev.preventDefault();
    moveCursor(0, -1);
    return;
  }
  if (key === 'ArrowDown') {
    ev.preventDefault();
    moveCursor(0, 1);
    return;
  }
  if (key === 'ArrowLeft') {
    ev.preventDefault();
    moveCursor(-1, 0);
    return;
  }
  if (key === 'ArrowRight') {
    ev.preventDefault();
    moveCursor(1, 0);
    return;
  }
  if (key === ' ' || key === 'Enter') {
    ev.preventDefault();
    showCursor = true;
    primaryAction(cursor);
    return;
  }
  if (key === 'f' || key === 'F') {
    ev.preventDefault();
    showCursor = true;
    doFlag(cursor);
  }
});

window.addEventListener('resize', relayout);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', relayout);
}

showTouchMode();
restart(5);
timerId = setInterval(tick, 200);
requestAnimationFrame(loop);

} /* document */
