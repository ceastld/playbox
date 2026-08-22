'use strict';

/* Classic Gabriele Cirulli 2048 on a 5×5 board. Merge once per move — never cascade. */
var SIZE = 5;
var WIN = 8192;
var TIME_LIMIT = 90;
var SLIDE_MS = 110;
var POP_MS = 130;
var SPAWN_MS = 140;
var SWIPE_MIN = 24;
var BEST_KEY = 'playbox-five48-best';
var MODE_KEY = 'playbox-five48-mode';
var DIRS = { left: 1, right: 1, up: 1, down: 1 };

function emptyGrid() {
  var g = [];
  var r, c;
  for (r = 0; r < SIZE; r++) {
    g[r] = [];
    for (c = 0; c < SIZE; c++) g[r][c] = 0;
  }
  return g;
}

function gridsEqual(a, b) {
  var r, c;
  for (r = 0; r < SIZE; r++) {
    for (c = 0; c < SIZE; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

function eqArr(a, b) {
  if (a.length !== b.length) return false;
  var i;
  for (i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * Slide one 5-length line toward index 0 (LEFT).
 * Compact, then merge equal neighbors once, left-to-right, then compact again.
 * A tile created by a merge cannot merge again in this call.
 */
function slideLine(row) {
  var packed = [];
  var i;
  for (i = 0; i < SIZE; i++) {
    if (row[i] !== 0) packed.push({ value: row[i], from: i });
  }
  var line = [0, 0, 0, 0, 0];
  var moves = [];
  var score = 0;
  var dst = 0;
  i = 0;
  while (i < packed.length) {
    var a = packed[i];
    var b = packed[i + 1];
    if (b && a.value === b.value) {
      var merged = a.value * 2;
      line[dst] = merged;
      score += merged;
      moves.push({ from: a.from, to: dst, value: a.value, result: merged, merged: true });
      moves.push({ from: b.from, to: dst, value: b.value, result: merged, merged: true });
      dst += 1;
      i += 2;
    } else {
      line[dst] = a.value;
      moves.push({ from: a.from, to: dst, value: a.value, result: a.value, merged: false });
      dst += 1;
      i += 1;
    }
  }
  return { line: line, score: score, moves: moves };
}

/** dir: 'L' toward index 0, 'R' toward index SIZE-1. */
function slide(row, dir) {
  if (dir === 'R') {
    var reversed = row.slice().reverse();
    var res = slideLine(reversed);
    res.line.reverse();
    for (var i = 0; i < res.moves.length; i++) {
      var m = res.moves[i];
      m.from = SIZE - 1 - m.from;
      m.to = SIZE - 1 - m.to;
    }
    return res;
  }
  return slideLine(row.slice());
}

function mapIndex(dir, i, j) {
  if (dir === 'left') return { r: i, c: j };
  if (dir === 'right') return { r: i, c: SIZE - 1 - j };
  if (dir === 'up') return { r: j, c: i };
  return { r: SIZE - 1 - j, c: i };
}

function extractLine(grid, dir, i) {
  var line = [0, 0, 0, 0, 0];
  var k;
  if (dir === 'left') {
    for (k = 0; k < SIZE; k++) line[k] = grid[i][k];
  } else if (dir === 'right') {
    for (k = 0; k < SIZE; k++) line[k] = grid[i][SIZE - 1 - k];
  } else if (dir === 'up') {
    for (k = 0; k < SIZE; k++) line[k] = grid[k][i];
  } else {
    for (k = 0; k < SIZE; k++) line[k] = grid[SIZE - 1 - k][i];
  }
  return line;
}

function moveBoard(grid, dir) {
  var next = emptyGrid();
  var traces = [];
  var score = 0;
  var i, j, res, p, mv;

  for (i = 0; i < SIZE; i++) {
    res = slideLine(extractLine(grid, dir, i));
    score += res.score;
    for (j = 0; j < SIZE; j++) {
      p = mapIndex(dir, i, j);
      next[p.r][p.c] = res.line[j];
    }
    for (j = 0; j < res.moves.length; j++) {
      mv = res.moves[j];
      traces.push({
        from: mapIndex(dir, i, mv.from),
        to: mapIndex(dir, i, mv.to),
        value: mv.value,
        result: mv.result,
        merged: mv.merged
      });
    }
  }

  return {
    grid: next,
    score: score,
    traces: traces,
    changed: !gridsEqual(grid, next)
  };
}

function emptyCells(grid) {
  var cells = [];
  var r, c;
  for (r = 0; r < SIZE; r++) {
    for (c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) cells.push({ r: r, c: c });
    }
  }
  return cells;
}

function spawn(grid) {
  var cells = emptyCells(grid);
  if (!cells.length) return null;
  var pick = cells[(Math.random() * cells.length) | 0];
  var value = Math.random() < 0.9 ? 2 : 4;
  grid[pick.r][pick.c] = value;
  return { r: pick.r, c: pick.c, value: value };
}

function canMove(grid) {
  var r, c, v;
  for (r = 0; r < SIZE; r++) {
    for (c = 0; c < SIZE; c++) {
      v = grid[r][c];
      if (v === 0) return true;
      if (c + 1 < SIZE && grid[r][c + 1] === v) return true;
      if (r + 1 < SIZE && grid[r + 1][c] === v) return true;
    }
  }
  return false;
}

function maxTile(grid) {
  var m = 0;
  var r, c;
  for (r = 0; r < SIZE; r++) {
    for (c = 0; c < SIZE; c++) {
      if (grid[r][c] > m) m = grid[r][c];
    }
  }
  return m;
}

function check(cond, msg) {
  if (!cond) throw new Error('self-check failed: ' + msg);
}

function selfCheck() {
  var L = function (row) { return slideLine(row).line; };

  check(eqArr(L([2, 2, 2, 2, 2]), [4, 4, 2, 0, 0]), '2,2,2,2,2 left → 4,4,2');
  check(!eqArr(L([2, 2, 2, 2, 2]), [8, 2, 0, 0, 0]), 'not greedy 8');
  check(!eqArr(L([2, 2, 2, 2, 2]), [4, 2, 2, 2, 0]), 'not under-merge');
  check(eqArr(L([2, 2, 2, 2, 0]), [4, 4, 0, 0, 0]), '2,2,2,2,0 left');
  check(eqArr(L([2, 2, 2, 0, 0]), [4, 2, 0, 0, 0]), '2,2,2,0,0 left');
  check(eqArr(L([2, 2, 4, 0, 0]), [4, 4, 0, 0, 0]), '2,2,4,0,0 left');
  check(eqArr(L([4, 2, 2, 0, 0]), [4, 4, 0, 0, 0]), '4,2,2,0,0 left');
  check(eqArr(L([2, 0, 2, 0, 0]), [4, 0, 0, 0, 0]), '2,0,2,0,0 left');
  check(eqArr(L([2, 0, 0, 0, 2]), [4, 0, 0, 0, 0]), '2,0,0,0,2 left');
  check(eqArr(L([2, 0, 2, 0, 2]), [4, 2, 0, 0, 0]), '2,0,2,0,2 left');
  check(eqArr(L([8, 8, 8, 8, 8]), [16, 16, 8, 0, 0]), '8,8,8,8,8 left');
  check(eqArr(L([4, 4, 8, 0, 0]), [8, 8, 0, 0, 0]), '4,4,8 no cascade');
  check(!eqArr(L([4, 4, 8, 0, 0]), [16, 0, 0, 0, 0]), 'not cascade 16');
  check(eqArr(L([2, 2, 4, 4, 8]), [4, 8, 8, 0, 0]), '2,2,4,4,8 no cascade 8s');
  check(eqArr(L([2, 2, 2, 4, 4]), [4, 2, 8, 0, 0]), '2,2,2,4,4 left');
  check(eqArr(L([4, 2, 2, 2, 2]), [4, 4, 4, 0, 0]), '4,2,2,2,2 left');
  check(eqArr(L([2, 4, 4, 2, 2]), [2, 8, 4, 0, 0]), '2,4,4,2,2 left');
  check(eqArr(L([2, 2, 0, 2, 2]), [4, 4, 0, 0, 0]), '2,2,0,2,2 left');
  check(eqArr(L([8, 8, 8, 0, 8]), [16, 16, 0, 0, 0]), '8,8,8,0,8 compact then merge');
  check(eqArr(L([16, 16, 16, 16, 16]), [32, 32, 16, 0, 0]), '16s left');
  check(eqArr(L([2, 4, 2, 4, 2]), [2, 4, 2, 4, 2]), 'no merge checker');
  check(eqArr(L([0, 0, 0, 0, 0]), [0, 0, 0, 0, 0]), 'empty');
  check(eqArr(L([0, 2, 0, 2, 0]), [4, 0, 0, 0, 0]), 'gaps');
  check(eqArr(L([4, 4, 4, 4, 4]), [8, 8, 4, 0, 0]), 'five 4s');

  check(slideLine([2, 2, 2, 2, 2]).score === 8, 'score 8 from five 2s');
  check(slideLine([8, 8, 0, 0, 0]).score === 16, 'score 16');
  check(slideLine([2, 2, 2, 4, 4]).score === 12, 'score 4+8');
  check(eqArr(slide([2, 2, 2, 2, 2], 'R').line, [0, 0, 2, 4, 4]), 'right 2s');
  check(eqArr(slide([2, 0, 0, 0, 2], 'R').line, [0, 0, 0, 0, 4]), 'right across');

  var g = [[2, 2, 2, 2, 2], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]];
  var m = moveBoard(g, 'left');
  check(eqArr(m.grid[0], [4, 4, 2, 0, 0]) && m.score === 8 && m.changed, 'board left five 2s');

  var col = [[2, 0, 0, 0, 0], [2, 0, 0, 0, 0], [2, 0, 0, 0, 0], [2, 0, 0, 0, 0], [2, 0, 0, 0, 0]];
  var up = moveBoard(col, 'up');
  check(up.grid[0][0] === 4 && up.grid[1][0] === 4 && up.grid[2][0] === 2 && up.grid[3][0] === 0 && up.score === 8, 'board up');
  var down = moveBoard(col, 'down');
  check(down.grid[4][0] === 4 && down.grid[3][0] === 4 && down.grid[2][0] === 2 && down.grid[1][0] === 0, 'board down');

  var rr = moveBoard([[0, 0, 0, 2, 2], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]], 'right');
  check(rr.grid[0][4] === 4 && rr.grid[0][3] === 0 && rr.changed, 'board right');

  var stuck = [
    [2, 4, 2, 4, 2],
    [4, 2, 4, 2, 4],
    [2, 4, 2, 4, 2],
    [4, 2, 4, 2, 4],
    [2, 4, 2, 4, 8]
  ];
  check(!canMove(stuck), 'lose board');
  check(!moveBoard(stuck, 'left').changed, 'noop left');
  check(!moveBoard(stuck, 'right').changed, 'noop right');
  check(!moveBoard(stuck, 'up').changed, 'noop up');
  check(!moveBoard(stuck, 'down').changed, 'noop down');

  var open = [
    [2, 4, 2, 4, 2],
    [4, 2, 4, 2, 4],
    [2, 4, 2, 4, 2],
    [4, 2, 4, 2, 4],
    [2, 4, 2, 4, 4]
  ];
  check(canMove(open), 'bottom pair still legal');
  var vert = [
    [2, 4, 2, 4, 2],
    [4, 2, 4, 2, 4],
    [2, 4, 2, 4, 2],
    [4, 2, 4, 2, 8],
    [2, 4, 2, 4, 8]
  ];
  check(canMove(vert), 'vertical merge still legal');

  var pair = moveBoard([[2, 2, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]], 'left');
  check(pair.traces.length === 2 && pair.traces[0].to.c === 0 && pair.traces[1].to.c === 0, 'merge traces share dest');
  check(pair.score === 4 && pair.grid[0][0] === 4, 'merge score 4');

  var winG = emptyGrid();
  winG[0][0] = 4096;
  winG[0][1] = 4096;
  var hit = moveBoard(winG, 'left');
  check(hit.grid[0][0] === 8192 && hit.score === 8192, 'merge to 8192');
  check(maxTile(hit.grid) >= WIN, 'win tile');

  var fullEmpty = emptyGrid();
  check(emptyCells(fullEmpty).length === 25, '25 empty');
  check(canMove(fullEmpty), 'empty can move');
}

selfCheck();

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function mergeScale(t) {
  if (t < 0.45) return 1 + 0.12 * (t / 0.45);
  return 1.12 - 0.12 * ((t - 0.45) / 0.55);
}

function tileClass(v) {
  var known = {
    2: 1, 4: 1, 8: 1, 16: 1, 32: 1, 64: 1,
    128: 1, 256: 1, 512: 1, 1024: 1, 2048: 1,
    4096: 1, 8192: 1, 16384: 1, 32768: 1
  };
  return known[v] ? 'tile v' + v : 'tile vsuper';
}

function fontSize(value, cell) {
  if (value < 100) return cell * 0.44;
  if (value < 1000) return cell * 0.36;
  if (value < 10000) return cell * 0.28;
  return cell * 0.22;
}

function loadBest() {
  try {
    var n = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
    return isFinite(n) && n > 0 ? n : 0;
  } catch (e) {
    return 0;
  }
}

function saveBest(n) {
  try { localStorage.setItem(BEST_KEY, String(n)); } catch (e) { /* ignore */ }
}

function loadMode() {
  try {
    var m = localStorage.getItem(MODE_KEY);
    if (m === 'timed' || m === 'classic') return m;
  } catch (e) { /* ignore */ }
  return 'classic';
}

function saveMode(m) {
  try { localStorage.setItem(MODE_KEY, m); } catch (e) { /* ignore */ }
}

function formatTime(sec) {
  if (sec <= 0) return '0:00';
  var whole = Math.ceil(sec - 1e-6);
  if (whole < 0) whole = 0;
  var m = (whole / 60) | 0;
  var s = whole % 60;
  return m + ':' + (s < 10 ? '0' : '') + s;
}

/* ---- audio (Web Audio, no files) ---- */
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

function beep(freq, dur, vol, type, slideTo) {
  if (muted) return;
  var ctx = audioCtx();
  if (!ctx) return;
  var t0 = ctx.currentTime;
  var osc = ctx.createOscillator();
  var g = ctx.createGain();
  osc.type = type || 'square';
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

var sfx = {
  slide: function () { beep(196, 0.05, 0.035, 'triangle', 140); },
  merge: function (value) {
    var f = 280 + Math.min(48, Math.log(value) / Math.LN2 * 16);
    beep(f, 0.09, 0.055, 'square', f * 1.5);
  },
  win: function () {
    beep(392, 0.12, 0.06, 'square', 523);
    setTimeout(function () { beep(523, 0.12, 0.06, 'square', 659); }, 90);
    setTimeout(function () { beep(784, 0.22, 0.07, 'square'); }, 180);
  },
  lose: function () { beep(220, 0.28, 0.05, 'sawtooth', 80); },
  timeup: function () { beep(330, 0.16, 0.05, 'triangle', 110); },
  tick: function () { beep(880, 0.04, 0.03, 'square'); }
};

/* ---- DOM / game state ---- */
if (typeof document !== 'undefined') {

var boardEl = document.getElementById('board');
var tilesEl = document.getElementById('tiles');
var gridBg = document.getElementById('grid-bg');
var overlayEl = document.getElementById('overlay');
var panelEl = document.getElementById('panel');
var ovTitle = document.getElementById('ov-title');
var ovLead = document.getElementById('ov-lead');
var ovKicker = document.getElementById('ov-kicker');
var ovContinue = document.getElementById('ov-continue');
var ovRetry = document.getElementById('ov-retry');
var scoreEl = document.getElementById('score');
var bestEl = document.getElementById('best');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var timeBox = document.getElementById('time-box');
var timeEl = document.getElementById('time');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnClassic = document.getElementById('mode-classic');
var btnTimed = document.getElementById('mode-timed');
var hintEl = document.getElementById('hint');
var motionQ = window.matchMedia('(prefers-reduced-motion: reduce)');

var grid = emptyGrid();
var score = 0;
var best = loadBest();
var mode = loadMode();
var wonThisRun = false;
var overlayMode = null; /* 'win' | 'lose' | 'time' | null */
var lostPeek = false;
var ended = false;
var sprites = [];
var nextId = 1;
var sliding = false;
var animStart = 0;
var queued = null;
var metrics = { cell: 72, gap: 8 };
var lastLayoutW = 0;

var timerLeft = TIME_LIMIT;
var timerRunning = false;
var timerStarted = false;
var lastTick = 0;
var timeExpired = false;
var lastShownTime = '';
var lastTickSec = -1;

for (var ci = 0; ci < SIZE * SIZE; ci++) {
  var cell = document.createElement('div');
  cell.className = 'cell';
  gridBg.appendChild(cell);
}

function reduceMotion() {
  return motionQ.matches;
}

function snapMoves() {
  return reduceMotion();
}

function measure() {
  var gapStr = getComputedStyle(boardEl).getPropertyValue('--gap') || '8px';
  var gap = parseFloat(gapStr) || 8;
  var w = tilesEl.clientWidth;
  if (w < 32) return metrics;
  var cell = (w - gap * (SIZE - 1)) / SIZE;
  metrics = { cell: cell, gap: gap };
  return metrics;
}

function cellPos(r, c, m) {
  m = m || metrics;
  return { x: c * (m.cell + m.gap), y: r * (m.cell + m.gap) };
}

function paintSprite(s) {
  s.el.className = tileClass(s.value);
  s.el.textContent = String(s.value);
  s.el.style.width = metrics.cell + 'px';
  s.el.style.height = metrics.cell + 'px';
  s.el.style.fontSize = fontSize(s.value, metrics.cell) + 'px';
}

function placeSprite(s) {
  var z = 2;
  if (s.moving) z = 4;
  if (s.merging) z = 5;
  if (s.spawning) z = 6;
  s.el.style.zIndex = String(z);
  s.el.style.transform = 'translate(' + s.x + 'px,' + s.y + 'px) scale(' + s.scale + ')';
}

function createSprite(r, c, value, opts) {
  opts = opts || {};
  var el = document.createElement('div');
  var p = cellPos(r, c);
  var s = {
    id: nextId++,
    r: r,
    c: c,
    value: value,
    el: el,
    x: p.x,
    y: p.y,
    fromX: p.x,
    fromY: p.y,
    toX: p.x,
    toY: p.y,
    scale: opts.spawn && !snapMoves() ? 0.4 : 1,
    spawning: !!opts.spawn,
    spawnStart: opts.spawn ? performance.now() : 0,
    merging: false,
    mergeStart: 0,
    moving: false,
    willMerge: false,
    result: value,
    dead: false
  };
  tilesEl.appendChild(el);
  paintSprite(s);
  placeSprite(s);
  sprites.push(s);
  return s;
}

function clearSprites() {
  for (var i = 0; i < sprites.length; i++) {
    if (sprites[i].el.parentNode) sprites[i].el.parentNode.removeChild(sprites[i].el);
  }
  sprites = [];
}

function overlayOpen() {
  return overlayMode !== null;
}

function inputBlocked() {
  return overlayMode !== null || lostPeek || ended;
}

function pauseTimer() {
  timerRunning = false;
}

function resumeTimer(now) {
  if (mode !== 'timed' || !timerStarted || ended || overlayOpen()) return;
  if (timerLeft <= 0) return;
  timerRunning = true;
  lastTick = now || performance.now();
}

function hideOverlay() {
  overlayMode = null;
  lostPeek = false;
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  boardEl.focus({ preventScroll: true });
}

function showOverlay(kind, title, lead) {
  overlayMode = kind;
  pauseTimer();
  ovTitle.textContent = title;
  ovLead.textContent = lead;
  ovKicker.textContent = 'FIVE';
  panelEl.className = 'panel ' + kind;
  if (kind === 'win') {
    ovContinue.hidden = false;
  } else {
    ovContinue.hidden = true;
  }
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  var focusBtn = kind === 'win' ? ovContinue : ovRetry;
  focusBtn.focus();
}

function updateScoreUI(gained) {
  scoreEl.textContent = String(score);
  bestEl.textContent = String(best);
  if (gained) {
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + gained;
    scoreAdd.style.animation = 'none';
    void scoreAdd.offsetWidth;
    scoreAdd.style.animation = 'addFloat 0.7s ease forwards';
  }
}

function paintTime() {
  var label = formatTime(timerLeft);
  if (label !== lastShownTime) {
    lastShownTime = label;
    timeEl.textContent = label;
  }
  var low = mode === 'timed' && timerStarted && timerLeft > 0 && timerLeft <= 10;
  timeBox.classList.toggle('low', low);
}

function syncModeUI() {
  var timed = mode === 'timed';
  document.body.classList.toggle('mode-classic', !timed);
  document.body.classList.toggle('mode-timed', timed);
  btnClassic.setAttribute('aria-pressed', timed ? 'false' : 'true');
  btnTimed.setAttribute('aria-pressed', timed ? 'true' : 'false');
  timeBox.hidden = !timed;
  hintEl.textContent = timed
    ? '九十秒冲分。滑动合并。合到 8192 也可继续。'
    : '滑动格子，相同数字合并。五乘五，合到 8192。';
}

function setMode(next) {
  if (next !== 'classic' && next !== 'timed') return;
  if (next === mode) return;
  mode = next;
  saveMode(mode);
  syncModeUI();
  newGame();
}

function endTimed() {
  if (ended) return;
  ended = true;
  queued = null;
  timeExpired = false;
  timerLeft = 0;
  pauseTimer();
  paintTime();
  showOverlay('time', '时间到', '本局 ' + score + ' 分。点空白处可看棋盘。');
  sfx.timeup();
}

function newGame() {
  grid = emptyGrid();
  score = 0;
  wonThisRun = false;
  sliding = false;
  queued = null;
  overlayMode = null;
  lostPeek = false;
  ended = false;
  timeExpired = false;
  timerLeft = TIME_LIMIT;
  timerRunning = false;
  timerStarted = false;
  lastTick = 0;
  lastTickSec = -1;
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  clearSprites();
  measure();
  spawn(grid);
  spawn(grid);
  var r, c;
  for (r = 0; r < SIZE; r++) {
    for (c = 0; c < SIZE; c++) {
      if (grid[r][c]) createSprite(r, c, grid[r][c], { spawn: true });
    }
  }
  scoreAdd.hidden = true;
  updateScoreUI(0);
  paintTime();
  boardEl.classList.remove('noop');
  boardEl.focus({ preventScroll: true });
}

function beginTravel(traces) {
  var used = [];
  var i, s, k, t, dest;
  for (i = 0; i < traces.length; i++) used[i] = false;
  for (s = 0; s < sprites.length; s++) {
    var sp = sprites[s];
    if (sp.dead) continue;
    t = null;
    for (k = 0; k < traces.length; k++) {
      if (used[k]) continue;
      var tr = traces[k];
      if (tr.from.r === sp.r && tr.from.c === sp.c) {
        t = tr;
        used[k] = true;
        break;
      }
    }
    if (!t) continue;
    dest = cellPos(t.to.r, t.to.c);
    sp.fromX = sp.x;
    sp.fromY = sp.y;
    sp.toX = dest.x;
    sp.toY = dest.y;
    sp.r = t.to.r;
    sp.c = t.to.c;
    sp.willMerge = t.merged;
    sp.result = t.result;
    sp.moving = sp.fromX !== sp.toX || sp.fromY !== sp.toY;
    sp.spawning = false;
    sp.merging = false;
    sp.scale = 1;
  }
}

function afterSettle() {
  if (!wonThisRun && maxTile(grid) >= WIN) {
    queued = null;
    showOverlay('win', '合到 8192', '还可以继续合成。');
    sfx.win();
    return;
  }
  if (!canMove(grid)) {
    queued = null;
    ended = true;
    showOverlay('lose', '没有空位了', '点空白处可看棋盘。');
    sfx.lose();
    return;
  }
  if (timeExpired || (mode === 'timed' && timerStarted && timerLeft <= 0)) {
    endTimed();
    return;
  }
  if (queued && DIRS[queued]) {
    var d = queued;
    queued = null;
    tryMove(d);
  }
}

function finishTravel(now) {
  var i, s, key, groups = {};
  for (i = 0; i < sprites.length; i++) {
    s = sprites[i];
    if (s.dead) continue;
    s.x = s.toX;
    s.y = s.toY;
    s.moving = false;
    key = s.r + ',' + s.c;
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  }
  var keys = Object.keys(groups);
  for (i = 0; i < keys.length; i++) {
    var group = groups[keys[i]];
    if (group.length === 1) {
      var only = group[0];
      if (only.willMerge) {
        only.value = only.result;
        only.merging = true;
        only.mergeStart = now;
        paintSprite(only);
      }
      continue;
    }
    var keep = group[0];
    keep.value = keep.result;
    keep.willMerge = false;
    keep.merging = true;
    keep.mergeStart = now;
    paintSprite(keep);
    for (var g = 1; g < group.length; g++) {
      group[g].dead = true;
      if (group[g].el.parentNode) group[g].el.parentNode.removeChild(group[g].el);
    }
  }
  sprites = sprites.filter(function (sp) { return !sp.dead; });

  var born = spawn(grid);
  if (born) createSprite(born.r, born.c, born.value, { spawn: true });

  sliding = false;
  afterSettle();
}

function tryMove(dir) {
  if (!DIRS[dir]) return;
  if (inputBlocked()) return;
  if (sliding) {
    queued = dir;
    return;
  }
  var result = moveBoard(grid, dir);
  if (!result.changed) {
    boardEl.classList.remove('noop');
    void boardEl.offsetWidth;
    if (!snapMoves()) boardEl.classList.add('noop');
    return;
  }
  grid = result.grid;
  score += result.score;
  if (score > best) {
    best = score;
    saveBest(best);
  }
  updateScoreUI(result.score);
  if (result.score) sfx.merge(result.score);
  else sfx.slide();

  if (mode === 'timed' && !timerStarted && !ended) {
    timerStarted = true;
    timerRunning = true;
    lastTick = performance.now();
  }

  measure();
  beginTravel(result.traces);
  sliding = true;
  animStart = performance.now();
  if (snapMoves()) finishTravel(animStart);
}

function updateTimer(now) {
  if (mode !== 'timed') return;
  if (!timerRunning || ended || overlayOpen()) {
    paintTime();
    return;
  }
  var dt = (now - lastTick) / 1000;
  lastTick = now;
  if (dt < 0) dt = 0;
  if (dt > 0.25) dt = 0.25;
  timerLeft -= dt;
  if (timerLeft <= 0) {
    timerLeft = 0;
    pauseTimer();
    if (sliding) timeExpired = true;
    else endTimed();
  } else if (timerLeft <= 10) {
    var sec = Math.ceil(timerLeft);
    if (sec !== lastTickSec && lastTickSec !== -1) sfx.tick();
    lastTickSec = sec;
  }
  paintTime();
}

function frame(now) {
  requestAnimationFrame(frame);
  updateTimer(now);
  var bw = tilesEl.clientWidth;
  if (!sliding && bw > 32 && bw !== lastLayoutW) {
    lastLayoutW = bw;
    relayout();
  }
  if (!sliding && !sprites.length) return;

  var i, s, t;
  if (sliding) {
    if (snapMoves()) {
      finishTravel(now);
    } else {
      t = Math.min(1, (now - animStart) / SLIDE_MS);
      var e = easeOutCubic(t);
      for (i = 0; i < sprites.length; i++) {
        s = sprites[i];
        if (s.spawning) continue;
        s.x = s.fromX + (s.toX - s.fromX) * e;
        s.y = s.fromY + (s.toY - s.fromY) * e;
      }
      if (t >= 1) finishTravel(now);
    }
  }

  for (i = 0; i < sprites.length; i++) {
    s = sprites[i];
    if (s.merging) {
      t = Math.min(1, (now - s.mergeStart) / POP_MS);
      if (snapMoves()) t = 1;
      s.scale = mergeScale(t);
      if (t >= 1) {
        s.merging = false;
        s.scale = 1;
      }
    } else if (s.spawning) {
      t = Math.min(1, (now - s.spawnStart) / SPAWN_MS);
      if (snapMoves()) t = 1;
      s.scale = 0.4 + 0.6 * easeOutCubic(t);
      if (t >= 1) {
        s.spawning = false;
        s.scale = 1;
      }
    }
    placeSprite(s);
  }
}

function relayout() {
  measure();
  for (var i = 0; i < sprites.length; i++) {
    var s = sprites[i];
    var p = cellPos(s.r, s.c);
    s.x = p.x;
    s.y = p.y;
    s.fromX = p.x;
    s.fromY = p.y;
    s.toX = p.x;
    s.toY = p.y;
    paintSprite(s);
    placeSprite(s);
  }
}

/* ---- input ---- */
var touchX = 0;
var touchY = 0;
var tracking = false;
var pointerX = 0;
var pointerY = 0;
var pointerTracking = false;

function swipeFrom(dx, dy) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN) return;
  if (Math.abs(dx) > Math.abs(dy)) tryMove(dx > 0 ? 'right' : 'left');
  else tryMove(dy > 0 ? 'down' : 'up');
}

boardEl.addEventListener('touchstart', function (e) {
  if (inputBlocked()) return;
  var t = e.changedTouches[0];
  if (!t) return;
  tracking = true;
  touchX = t.clientX;
  touchY = t.clientY;
}, { passive: true });

boardEl.addEventListener('touchmove', function (e) {
  e.preventDefault();
}, { passive: false });

boardEl.addEventListener('touchend', function (e) {
  if (!tracking) return;
  tracking = false;
  var t = e.changedTouches[0];
  if (!t) return;
  swipeFrom(t.clientX - touchX, t.clientY - touchY);
}, { passive: true });

boardEl.addEventListener('touchcancel', function () {
  tracking = false;
});

boardEl.addEventListener('pointerdown', function (e) {
  if (e.pointerType === 'touch') return;
  if (e.button !== 0) return;
  if (inputBlocked()) return;
  pointerTracking = true;
  pointerX = e.clientX;
  pointerY = e.clientY;
  try { boardEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
});

boardEl.addEventListener('pointerup', function (e) {
  if (e.pointerType === 'touch') return;
  if (!pointerTracking) return;
  pointerTracking = false;
  swipeFrom(e.clientX - pointerX, e.clientY - pointerY);
});

boardEl.addEventListener('pointercancel', function () {
  pointerTracking = false;
});

window.addEventListener('keydown', function (e) {
  var key = e.key;
  var code = e.code;
  if (key === 'm' || key === 'M' || code === 'KeyM') {
    e.preventDefault();
    toggleMute();
    return;
  }
  if (key === 'r' || key === 'R' || code === 'KeyR') {
    e.preventDefault();
    newGame();
    return;
  }
  if (inputBlocked()) {
    if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown' ||
        key === 'w' || key === 'W' || key === 'a' || key === 'A' ||
        key === 's' || key === 'S' || key === 'd' || key === 'D') {
      e.preventDefault();
    }
    return;
  }
  var dir = null;
  if (key === 'ArrowLeft' || code === 'KeyA') dir = 'left';
  else if (key === 'ArrowRight' || code === 'KeyD') dir = 'right';
  else if (key === 'ArrowUp' || code === 'KeyW') dir = 'up';
  else if (key === 'ArrowDown' || code === 'KeyS') dir = 'down';
  if (dir) {
    e.preventDefault();
    tryMove(dir);
  }
});

function toggleMute() {
  muted = !muted;
  btnMute.classList.toggle('muted', muted);
  btnMute.textContent = muted ? '静' : '声';
  btnMute.setAttribute('aria-label', muted ? '开启声音' : '静音');
  if (!muted) audioCtx();
}

function continuePlay() {
  if (overlayMode !== 'win') return;
  wonThisRun = true;
  hideOverlay();
  if (mode === 'timed' && (timeExpired || timerLeft <= 0)) {
    endTimed();
    return;
  }
  if (!canMove(grid)) {
    ended = true;
    lostPeek = false;
    showOverlay('lose', '没有空位了', '点空白处可看棋盘。');
    sfx.lose();
    return;
  }
  resumeTimer(performance.now());
}

document.getElementById('stage').addEventListener('pointerdown', function () {
  if (!overlayOpen()) boardEl.focus({ preventScroll: true });
});

btnMute.addEventListener('click', toggleMute);
btnRetry.addEventListener('click', function () { newGame(); });
ovRetry.addEventListener('click', function () { newGame(); });
ovContinue.addEventListener('click', continuePlay);
btnClassic.addEventListener('click', function () { setMode('classic'); });
btnTimed.addEventListener('click', function () { setMode('timed'); });

overlayEl.addEventListener('click', function (e) {
  if (e.target !== overlayEl) return;
  if (overlayMode === 'win') {
    continuePlay();
    return;
  }
  if (overlayMode === 'lose' || overlayMode === 'time') {
    lostPeek = true;
    ended = true;
    overlayMode = null;
    overlayEl.classList.add('hidden');
    overlayEl.setAttribute('aria-hidden', 'true');
  }
});
panelEl.addEventListener('click', function (e) { e.stopPropagation(); });

boardEl.addEventListener('animationend', function () {
  boardEl.classList.remove('noop');
});

document.addEventListener('visibilitychange', function () {
  if (document.hidden) {
    pauseTimer();
  } else if (mode === 'timed' && timerStarted && !ended && !overlayOpen()) {
    resumeTimer(performance.now());
  }
});

window.addEventListener('resize', relayout);
if (motionQ.addEventListener) motionQ.addEventListener('change', relayout);

bestEl.textContent = String(best);
syncModeUI();
newGame();
requestAnimationFrame(frame);

}
