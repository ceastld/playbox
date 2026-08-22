'use strict';

/* Classic Gabriele Cirulli 2048. Merge once per move — never cascade. */
var SIZE = 4;
var SLIDE_MS = 110;
var POP_MS = 130;
var SPAWN_MS = 140;
var SWIPE_MIN = 24;
var BEST_KEY = 'playbox-twenty48-best';
var DIRS = { left: 1, right: 1, up: 1, down: 1 };

function emptyGrid() {
  var g = [];
  for (var r = 0; r < SIZE; r++) {
    g[r] = [0, 0, 0, 0];
  }
  return g;
}

function gridsEqual(a, b) {
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

/**
 * Slide one 4-length line toward index 0 (LEFT).
 * Compact, then merge equal neighbors once, left-to-right, then compact again.
 * A tile created by a merge cannot merge again in this call.
 */
function slideLine(row) {
  var packed = [];
  var i;
  for (i = 0; i < SIZE; i++) {
    if (row[i] !== 0) packed.push({ value: row[i], from: i });
  }
  var line = [0, 0, 0, 0];
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

/** dir: 'L' toward index 0, 'R' toward index 3. */
function slide(row, dir) {
  if (dir === 'R') {
    var reversed = [row[3], row[2], row[1], row[0]];
    var res = slideLine(reversed);
    res.line.reverse();
    for (var i = 0; i < res.moves.length; i++) {
      var m = res.moves[i];
      m.from = 3 - m.from;
      m.to = 3 - m.to;
    }
    return res;
  }
  return slideLine(row.slice());
}

function axisMap(dir, i) {
  if (dir === 'left') return function (c) { return { r: i, c: c }; };
  if (dir === 'right') return function (c) { return { r: i, c: 3 - c }; };
  if (dir === 'up') return function (r) { return { r: r, c: i }; };
  return function (r) { return { r: 3 - r, c: i }; };
}

function moveBoard(grid, dir) {
  var next = emptyGrid();
  var traces = [];
  var score = 0;
  var i, j, line, res, map;

  for (i = 0; i < SIZE; i++) {
    if (dir === 'left') line = grid[i].slice();
    else if (dir === 'right') line = [grid[i][3], grid[i][2], grid[i][1], grid[i][0]];
    else if (dir === 'up') line = [grid[0][i], grid[1][i], grid[2][i], grid[3][i]];
    else line = [grid[3][i], grid[2][i], grid[1][i], grid[0][i]];

    map = axisMap(dir, i);
    res = slideLine(line);
    score += res.score;
    for (j = 0; j < SIZE; j++) {
      var p = map(j);
      next[p.r][p.c] = res.line[j];
    }
    for (j = 0; j < res.moves.length; j++) {
      var mv = res.moves[j];
      traces.push({
        from: map(mv.from),
        to: map(mv.to),
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
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
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
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      if (grid[r][c] > m) m = grid[r][c];
    }
  }
  return m;
}

function eqArr(a, b) {
  if (a.length !== b.length) return false;
  for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function selfCheck() {
  var L = function (row) { return slideLine(row).line; };
  console.assert(eqArr(L([2, 2, 2, 2]), [4, 4, 0, 0]), '2,2,2,2 left');
  console.assert(eqArr(L([2, 2, 4, 0]), [4, 4, 0, 0]), '2,2,4,0 left');
  console.assert(eqArr(L([4, 2, 2, 0]), [4, 4, 0, 0]), '4,2,2,0 left');
  console.assert(eqArr(L([2, 0, 2, 0]), [4, 0, 0, 0]), '2,0,2,0 left');
  console.assert(eqArr(L([2, 2, 2, 0]), [4, 2, 0, 0]), '2,2,2,0 left');
  console.assert(eqArr(L([8, 8, 8, 8]), [16, 16, 0, 0]), '8,8,8,8 left');
  console.assert(eqArr(L([4, 4, 8, 0]), [8, 8, 0, 0]), '4,4,8,0 no cascade');
  console.assert(eqArr(L([2, 0, 0, 2]), [4, 0, 0, 0]), '2,0,0,2 left');
  console.assert(slideLine([2, 2, 2, 2]).score === 8, 'score 8');
  console.assert(slideLine([8, 8, 0, 0]).score === 16, 'score 16');
  console.assert(eqArr(slide([2, 2, 2, 2], 'R').line, [0, 0, 4, 4]), 'right 2s');
  console.assert(!eqArr(L([2, 2, 2, 2]), [8, 0, 0, 0]), 'not greedy 8');
  console.assert(!eqArr(L([2, 2, 4, 0]), [8, 0, 0, 0]), 'not cascade 8');
  var g = [[2, 2, 2, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  var m = moveBoard(g, 'left');
  console.assert(eqArr(m.grid[0], [4, 4, 0, 0]) && m.score === 8 && m.changed, 'board left');
  var col = [[2, 0, 0, 0], [2, 0, 0, 0], [2, 0, 0, 0], [2, 0, 0, 0]];
  var up = moveBoard(col, 'up');
  console.assert(up.grid[0][0] === 4 && up.grid[1][0] === 4 && up.grid[2][0] === 0 && up.score === 8, 'board up');
  var down = moveBoard(col, 'down');
  console.assert(down.grid[3][0] === 4 && down.grid[2][0] === 4 && down.grid[1][0] === 0, 'board down');
  var stuck = [[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]];
  console.assert(!canMove(stuck), 'lose board');
  console.assert(!moveBoard(stuck, 'left').changed, 'noop');
  var open = [[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 8], [4, 2, 4, 8]];
  console.assert(canMove(open), 'vertical merge still legal');
  var pair = moveBoard([[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], 'left');
  console.assert(pair.traces.length === 2 && pair.traces[0].to.c === 0 && pair.traces[1].to.c === 0, 'merge traces share dest');
  console.assert(pair.score === 4 && pair.grid[0][0] === 4, 'merge score 4');
  var rr = moveBoard([[0, 0, 2, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], 'right');
  console.assert(rr.grid[0][3] === 4 && rr.grid[0][2] === 0 && rr.changed, 'board right');
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
  if (value < 100) return cell * 0.46;
  if (value < 1000) return cell * 0.38;
  if (value < 10000) return cell * 0.3;
  return cell * 0.24;
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

function beep(freq, dur, vol, type, slide) {
  if (muted) return;
  var ctx = audioCtx();
  if (!ctx) return;
  var t0 = ctx.currentTime;
  var osc = ctx.createOscillator();
  var g = ctx.createGain();
  osc.type = type || 'square';
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t0 + dur);
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
    var f = 280 + Math.min(40, Math.log2(value) * 18);
    beep(f, 0.09, 0.055, 'square', f * 1.5);
  },
  win: function () {
    beep(392, 0.12, 0.06, 'square', 523);
    setTimeout(function () { beep(523, 0.12, 0.06, 'square', 659); }, 90);
    setTimeout(function () { beep(784, 0.22, 0.07, 'square'); }, 180);
  },
  lose: function () { beep(220, 0.28, 0.05, 'sawtooth', 80); }
};

/* ---- DOM / game state ---- */
if (typeof document === 'undefined') {
  /* node --check / pure tests only */
} else {

var boardEl = document.getElementById('board');
var tilesEl = document.getElementById('tiles');
var gridBg = document.getElementById('grid-bg');
var overlayEl = document.getElementById('overlay');
var panelEl = document.getElementById('panel');
var ovTitle = document.getElementById('ov-title');
var ovLead = document.getElementById('ov-lead');
var ovContinue = document.getElementById('ov-continue');
var ovRetry = document.getElementById('ov-retry');
var scoreEl = document.getElementById('score');
var bestEl = document.getElementById('best');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var motionQ = window.matchMedia('(prefers-reduced-motion: reduce)');

var grid = emptyGrid();
var score = 0;
var best = loadBest();
var wonThisRun = false;
var overlayMode = null; /* 'win' | 'lose' | null */
var sprites = [];
var nextId = 1;
var sliding = false;
var animStart = 0;
var queued = null;
var metrics = { cell: 80, gap: 10 };
var lastLayoutW = 0;

for (var ci = 0; ci < 16; ci++) {
  var cell = document.createElement('div');
  cell.className = 'cell';
  gridBg.appendChild(cell);
}

function reduceMotion() {
  return motionQ.matches;
}

function measure() {
  var gapStr = getComputedStyle(boardEl).getPropertyValue('--gap') || '10px';
  var gap = parseFloat(gapStr) || 10;
  var w = tilesEl.clientWidth;
  if (w < 32) return metrics;
  var cell = (w - gap * 3) / 4;
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
    scale: opts.spawn && !reduceMotion() ? 0.4 : 1,
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

function hideOverlay() {
  overlayMode = null;
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  boardEl.focus({ preventScroll: true });
}

function showOverlay(mode, title, lead) {
  overlayMode = mode;
  ovTitle.textContent = title;
  ovLead.textContent = lead;
  panelEl.className = 'panel ' + mode;
  if (mode === 'win') {
    ovContinue.hidden = false;
  } else {
    ovContinue.hidden = true;
  }
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  var focusBtn = mode === 'win' ? ovContinue : ovRetry;
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

function newGame() {
  grid = emptyGrid();
  score = 0;
  wonThisRun = false;
  sliding = false;
  queued = null;
  overlayMode = null;
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  clearSprites();
  measure();
  spawn(grid);
  spawn(grid);
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      if (grid[r][c]) createSprite(r, c, grid[r][c], { spawn: true });
    }
  }
  scoreAdd.hidden = true;
  updateScoreUI(0);
  boardEl.classList.remove('noop');
  boardEl.focus({ preventScroll: true });
}

function beginTravel(traces) {
  var used = [];
  for (var i = 0; i < traces.length; i++) used[i] = false;
  for (var s = 0; s < sprites.length; s++) {
    var sp = sprites[s];
    if (sp.dead) continue;
    var t = null;
    for (var k = 0; k < traces.length; k++) {
      if (used[k]) continue;
      var tr = traces[k];
      if (tr.from.r === sp.r && tr.from.c === sp.c) {
        t = tr;
        used[k] = true;
        break;
      }
    }
    if (!t) continue;
    var dest = cellPos(t.to.r, t.to.c);
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

  if (!wonThisRun && maxTile(grid) >= 2048) {
    queued = null;
    showOverlay('win', '你到了 2048', '还可以继续合成 4096。');
    sfx.win();
    return;
  }
  if (!canMove(grid)) {
    queued = null;
    showOverlay('lose', '没有空位了', '没有能合并的格子了。');
    sfx.lose();
    return;
  }
  if (queued && DIRS[queued]) {
    var d = queued;
    queued = null;
    tryMove(d);
  }
}

function tryMove(dir) {
  if (!DIRS[dir]) return;
  if (overlayOpen()) return;
  if (sliding) {
    queued = dir;
    return;
  }
  var result = moveBoard(grid, dir);
  if (!result.changed) {
    boardEl.classList.remove('noop');
    void boardEl.offsetWidth;
    if (!reduceMotion()) boardEl.classList.add('noop');
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

  measure();
  beginTravel(result.traces);
  sliding = true;
  animStart = performance.now();
  if (reduceMotion()) finishTravel(animStart);
}

function frame(now) {
  requestAnimationFrame(frame);
  var bw = tilesEl.clientWidth;
  if (!sliding && bw > 32 && bw !== lastLayoutW) {
    lastLayoutW = bw;
    relayout();
  }
  if (!sliding && !sprites.length) return;

  var i, s, t;
  if (sliding && !reduceMotion()) {
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

  for (i = 0; i < sprites.length; i++) {
    s = sprites[i];
    if (s.merging) {
      t = Math.min(1, (now - s.mergeStart) / POP_MS);
      s.scale = mergeScale(t);
      if (t >= 1) {
        s.merging = false;
        s.scale = 1;
      }
    } else if (s.spawning) {
      t = Math.min(1, (now - s.spawnStart) / SPAWN_MS);
      if (reduceMotion()) t = 1;
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
  if (overlayOpen()) return;
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
  if (overlayOpen()) return;
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
  if (overlayOpen()) return;
  var dir = null;
  if (key === 'ArrowLeft' || code === 'KeyA') dir = 'left';
  else if (key === 'ArrowRight' || code === 'KeyD') dir = 'right';
  else if (key === 'ArrowUp' || code === 'KeyW') dir = 'up';
  else if (key === 'ArrowDown' || code === 'KeyS') dir = 'down';
  if (dir) {
    e.preventDefault();
    tryMove(dir);
    return;
  }
  if (key === 'r' || key === 'R' || code === 'KeyR') {
    e.preventDefault();
    newGame();
  }
});

function toggleMute() {
  muted = !muted;
  btnMute.classList.toggle('muted', muted);
  btnMute.textContent = muted ? '静' : '声';
  btnMute.setAttribute('aria-label', muted ? '开启声音' : '静音');
  if (!muted) audioCtx();
}

document.getElementById('stage').addEventListener('pointerdown', function () {
  if (!overlayOpen()) boardEl.focus({ preventScroll: true });
});

btnMute.addEventListener('click', toggleMute);
btnRetry.addEventListener('click', function () { newGame(); });
ovRetry.addEventListener('click', function () { newGame(); });
ovContinue.addEventListener('click', function () {
  if (overlayMode !== 'win') return;
  wonThisRun = true;
  hideOverlay();
  if (!canMove(grid)) {
    showOverlay('lose', '没有空位了', '没有能合并的格子了。');
    sfx.lose();
  }
});

boardEl.addEventListener('animationend', function () {
  boardEl.classList.remove('noop');
});

window.addEventListener('resize', relayout);
if (motionQ.addEventListener) motionQ.addEventListener('change', relayout);

bestEl.textContent = String(best);
newGame();
requestAnimationFrame(frame);

}
