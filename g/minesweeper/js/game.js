'use strict';

/* Classic Minesweeper (Microsoft / minesweeper.info). */

var DIFF = {
  9: { size: 9, mines: 10, key: 'playbox-minesweeper-best-9', name: '初级' },
  16: { size: 16, mines: 40, key: 'playbox-minesweeper-best-16', name: '中级' }
};
var D8 = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];
var LONG_MS = 400;
var MOVE_PX = 12;
var TIME_CAP = 999;

function idx(size, r, c) {
  return r * size + c;
}

function neighbors(size, i) {
  var r = (i / size) | 0;
  var c = i % size;
  var out = [];
  for (var k = 0; k < 8; k++) {
    var rr = r + D8[k][0];
    var cc = c + D8[k][1];
    if (rr >= 0 && rr < size && cc >= 0 && cc < size) out.push(idx(size, rr, cc));
  }
  return out;
}

function makeCells(n) {
  var cells = [];
  for (var i = 0; i < n; i++) {
    cells.push({
      mine: false,
      adj: 0,
      open: false,
      flag: false,
      hit: false,
      wrong: false
    });
  }
  return cells;
}

function createGame(size, mines) {
  return {
    size: size,
    mines: mines,
    cells: makeCells(size * size),
    placed: false,
    status: 'play',
    flags: 0,
    opened: 0,
    startAt: 0,
    seconds: 0
  };
}

function computeAdj(game) {
  var n = game.size * game.size;
  for (var i = 0; i < n; i++) {
    var cell = game.cells[i];
    if (cell.mine) {
      cell.adj = 0;
      continue;
    }
    var ns = neighbors(game.size, i);
    var a = 0;
    for (var k = 0; k < ns.length; k++) {
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

function excludeAround(size, i) {
  var ex = {};
  ex[i] = true;
  var ns = neighbors(size, i);
  for (var k = 0; k < ns.length; k++) ex[ns[k]] = true;
  return ex;
}

function seedMines(game, mineList) {
  var n = game.size * game.size;
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
  var total = game.size * game.size;
  var picked = pickIndices(total, game.mines, excludeAround(game.size, safeIndex), rng);
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
  return game.opened === game.size * game.size - game.mines;
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
      var ns = neighbors(game.size, j);
      for (var k = 0; k < ns.length; k++) stack.push(ns[k]);
    }
  }
  return newly;
}

function autoFlagMines(game) {
  var n = game.size * game.size;
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
  var n = game.size * game.size;
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
  return { type: newly.length > 1 || (newly.length === 1 && game.cells[newly[0]].adj === 0) ? 'flood' : 'open', cells: newly };
}

function chordCell(game, i) {
  if (game.status !== 'play') return { type: 'noop' };
  var c = game.cells[i];
  if (!c.open || c.adj === 0) return { type: 'noop' };
  var ns = neighbors(game.size, i);
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
      for (var p = 0; p < part.length; p++) newly.push(part[p]);
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

/* ---------- self-tests (node) ---------- */

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assert failed');
}

function runSelfTests() {
  var g = createGame(9, 10);
  var r = openCell(g, 40);
  assert(g.placed, 'mines after first open');
  assert(!g.cells[40].mine, 'first click safe');
  var ns = neighbors(9, 40);
  var k;
  for (k = 0; k < ns.length; k++) {
    assert(!g.cells[ns[k]].mine, 'first-click neighborhood safe');
  }
  assert(g.cells[40].adj === 0, 'first click is a zero');
  assert(g.cells[40].open, 'first cell opens');
  assert(r.type === 'flood' || r.type === 'win', 'first click floods');
  assert(g.startAt > 0, 'timer starts on first open');

  g = createGame(5, 2);
  seedMines(g, [0, 4]);
  /*  * 1 0 1 *
      1 1 0 1 1
      0 0 0 0 0  ... */
  assert(g.cells[1].adj === 1 && g.cells[2].adj === 0, 'adj counts');
  r = openCell(g, 12);
  assert(r.type === 'win', 'flood opens all safe cells');
  assert(g.status === 'win', 'win status');
  assert(g.cells[0].flag && g.cells[4].flag, 'auto-flag remaining mines');
  assert(remaining(g) === 0, 'counter zero on win');

  g = createGame(5, 2);
  seedMines(g, [0, 4]);
  r = openCell(g, 0);
  assert(r.type === 'hit' && g.status === 'lose', 'opening a mine loses');
  assert(g.cells[0].hit && g.cells[4].open, 'hit mine marked, others shown');

  g = createGame(5, 2);
  seedMines(g, [0, 4]);
  r = flagCell(g, 0);
  assert(r.type === 'flag' && remaining(g) === 1, 'flag decrements');
  r = openCell(g, 0);
  assert(r.type === 'noop', 'flagged cell will not open');
  flagCell(g, 1);
  flagCell(g, 2);
  assert(remaining(g) === -1, 'counter can go negative');
  flagCell(g, 1);
  assert(!g.cells[1].flag, 'flag toggles off');

  g = createGame(5, 2);
  seedMines(g, [0, 4]);
  flagCell(g, 10);
  openCell(g, 24);
  assert(g.cells[10].flag && !g.cells[10].open, 'flood skips flags');

  g = createGame(5, 2);
  seedMines(g, [0, 4]);
  g.cells[1].open = true;
  g.opened = 1;
  r = chordCell(g, 1);
  assert(r.type === 'deny', 'chord needs matching flags');
  flagCell(g, 0);
  r = chordCell(g, 1);
  assert(g.status === 'win', 'correct chord wins');
  assert(g.cells[2].open, 'chord opens unflagged neighbors');

  g = createGame(5, 2);
  seedMines(g, [0, 4]);
  g.cells[1].open = true;
  g.opened = 1;
  flagCell(g, 2);
  r = chordCell(g, 1);
  assert(r.type === 'hit' && g.status === 'lose', 'wrong-flag chord hits mine');
  assert(g.cells[0].hit, 'unflagged mine blows');
  assert(g.cells[2].wrong, 'wrong flag marked');

  g = createGame(3, 1);
  seedMines(g, [0]);
  openCell(g, 8);
  g.cells[1].open = true;
  g.opened = Math.max(g.opened, 2);
  flagCell(g, 0);
  /* 1 at (0,1) has correct flag; extra covered mine-free cells still closed */
  r = chordCell(g, 1);
  assert(r.type !== 'deny', 'chord with correct count proceeds');

  g = createGame(3, 1);
  r = chordCell(g, 4);
  assert(r.type === 'noop', 'no chord on covered cells');

  var seen = {};
  var rngI = 0;
  var seq = [0.1, 0.8, 0.3, 0.9, 0.05, 0.6, 0.2, 0.7, 0.4, 0.55];
  function rng() {
    var v = seq[rngI % seq.length];
    rngI += 1;
    return v;
  }
  g = createGame(9, 10);
  placeMines(g, 0, rng);
  var mines = 0;
  for (k = 0; k < 81; k++) {
    if (g.cells[k].mine) {
      mines += 1;
      seen[k] = 1;
    }
  }
  assert(mines === 10, 'exactly 10 mines');
  assert(!g.cells[0].mine && !g.cells[1].mine && !g.cells[9].mine, 'corner neighborhood excluded');

  return 'ok';
}

/* ---------- audio ---------- */

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
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ctx.destination);
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

/* ---------- DOM ---------- */

if (typeof document === 'undefined') {
  console.log(runSelfTests());
} else {

var boardEl = document.getElementById('board');
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
var diff9 = document.getElementById('diff-9');
var diff16 = document.getElementById('diff-16');
var modeEl = document.getElementById('mode');
var modeOpen = document.getElementById('mode-open');
var modeFlag = document.getElementById('mode-flag');
var motionQ = window.matchMedia('(prefers-reduced-motion: reduce)');

var size = 9;
var game = createGame(9, 10);
var cellEls = [];
var flagMode = false;
var cursor = 0;
var showCursor = false;
var timerId = 0;
var press = null;

function bestKey() {
  return DIFF[size].key;
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

function paintCell(i) {
  var c = game.cells[i];
  var el = cellEls[i];
  if (!el) return;
  var r = (i / game.size) | 0;
  var col = i % game.size;
  var cls = 'cell';
  if ((r + col) % 2) cls += ' shade';
  if (showCursor && i === cursor) cls += ' cursor';
  var mark = el.firstChild;
  var label = '未开';
  mark.textContent = '';
  mark.className = 'mark';

  var showMine = c.mine && (c.open || game.status === 'lose') && !c.flag;
  var showFlag = c.flag && !c.wrong;
  var showWrong = c.wrong;
  var showNum = c.open && !c.mine && c.adj > 0;

  if (c.open) cls += ' open';
  if (showNum) {
    cls += ' n' + c.adj;
    mark.textContent = String(c.adj);
    label = String(c.adj);
  } else if (c.open && !c.mine) {
    label = '空';
  }
  if (showMine) {
    cls += ' mine';
    if (c.hit) cls += ' hit';
    label = c.hit ? '踩雷' : '雷';
  }
  if (showFlag) {
    cls += ' flag';
    label = '旗';
  }
  if (showWrong) {
    cls += ' wrong';
    label = '错旗';
  }
  el.className = cls;
  el.setAttribute('aria-label', label);
}

function paintAll() {
  for (var i = 0; i < cellEls.length; i++) paintCell(i);
}

function paintMany(list) {
  for (var i = 0; i < list.length; i++) paintCell(list[i]);
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
  if (!res || res.type === 'noop') return;
  if (res.type === 'deny') {
    sfx.deny();
    return;
  }
  if (res.type === 'flag') {
    sfx.flag();
    if (navigator.vibrate) navigator.vibrate(12);
    paintCell(res.i);
    paintCell(cursor);
    return;
  }
  if (res.type === 'unflag') {
    sfx.unflag();
    paintCell(res.i);
    return;
  }

  var i;
  if (res.cells) {
    paintMany(res.cells);
    if (!reduceMotion() && game.status === 'play') {
      for (i = 0; i < res.cells.length; i++) {
        if (cellEls[res.cells[i]]) cellEls[res.cells[i]].classList.add('fresh');
      }
    }
  }
  if (res.hits) paintMany(res.hits);

  if (res.type === 'hit') {
    freezeTimer(game);
    paintAll();
    sfx.lose();
    if (!reduceMotion()) {
      boardEl.classList.remove('boom');
      void boardEl.offsetWidth;
      boardEl.classList.add('boom');
    }
    showOverlay('lose', '用时 ' + game.seconds + ' 秒');
    return;
  }
  if (res.type === 'win') {
    freezeTimer(game);
    paintAll();
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

function buildBoard() {
  boardEl.innerHTML = '';
  boardEl.style.setProperty('--n', String(size));
  boardEl.classList.toggle('size-16', size === 16);
  cellEls = [];
  var n = size * size;
  var frag = document.createDocumentFragment();
  for (var i = 0; i < n; i++) {
    var el = document.createElement('div');
    el.className = 'cell';
    el.setAttribute('role', 'gridcell');
    el.dataset.i = String(i);
    var mark = document.createElement('span');
    mark.className = 'mark';
    el.appendChild(mark);
    frag.appendChild(el);
    cellEls.push(el);
  }
  boardEl.appendChild(frag);
}

function restart(nextSize) {
  if (nextSize) size = nextSize;
  game = createGame(size, DIFF[size].mines);
  cursor = 0;
  showCursor = false;
  press = null;
  hideOverlay();
  boardEl.classList.remove('boom');
  document.body.classList.toggle('d16', size === 16);
  diff9.setAttribute('aria-pressed', size === 9 ? 'true' : 'false');
  diff16.setAttribute('aria-pressed', size === 16 ? 'true' : 'false');
  buildBoard();
  paintAll();
  updateMeters();
  boardEl.focus();
}

function cellIndexFromEl(el) {
  if (!el) return -1;
  var cell = el.closest ? el.closest('.cell') : null;
  if (!cell || !boardEl.contains(cell)) return -1;
  return parseInt(cell.dataset.i, 10);
}

function clearPressVisual() {
  for (var i = 0; i < cellEls.length; i++) {
    cellEls[i].classList.remove('pressed', 'press-nb');
  }
}

function depressFor(i) {
  clearPressVisual();
  if (i < 0) return;
  var c = game.cells[i];
  if (!c.open) {
    if (!c.flag) cellEls[i].classList.add('pressed');
    return;
  }
  if (c.adj === 0) return;
  var ns = neighbors(game.size, i);
  for (var k = 0; k < ns.length; k++) {
    var nb = game.cells[ns[k]];
    if (!nb.open && !nb.flag) cellEls[ns[k]].classList.add('press-nb');
  }
}

function cancelPress() {
  if (press && press.timer) clearTimeout(press.timer);
  press = null;
  clearPressVisual();
}

function doFlag(i) {
  var prevCursor = cursor;
  cursor = i;
  var res = flagCell(game, i);
  paintCell(prevCursor);
  handleResult(res);
}

function doOpen(i) {
  var prevCursor = cursor;
  cursor = i;
  paintCell(prevCursor);
  var c = game.cells[i];
  var res;
  if (c.open) res = chordCell(game, i);
  else res = openCell(game, i);
  handleResult(res);
}

function doChord(i) {
  var prevCursor = cursor;
  cursor = i;
  paintCell(prevCursor);
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

boardEl.addEventListener('pointerdown', function (ev) {
  if (game.status !== 'play') return;
  var i = cellIndexFromEl(ev.target);
  if (i < 0) return;
  ev.preventDefault();
  try { boardEl.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
  audioCtx();

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
      clearPressVisual();
      return;
    }
    doFlag(i);
    return;
  }
  if (ev.button !== 0) return;

  if (ev.buttons & 2) {
    doChord(i);
    press = { i: i, x: ev.clientX, y: ev.clientY, timer: 0, flagged: false, chorded: true, id: ev.pointerId };
    return;
  }

  depressFor(i);
  var t = 0;
  if (!game.cells[i].open) {
    t = setTimeout(function () {
      if (!press || press.timer !== t) return;
      press.flagged = true;
      clearPressVisual();
      doFlag(press.i);
    }, LONG_MS);
  }
  press = {
    i: i,
    x: ev.clientX,
    y: ev.clientY,
    timer: t,
    flagged: false,
    chorded: false,
    id: ev.pointerId
  };
});

boardEl.addEventListener('pointermove', function (ev) {
  if (!press || press.id !== ev.pointerId) return;
  var dx = ev.clientX - press.x;
  var dy = ev.clientY - press.y;
  if (dx * dx + dy * dy > MOVE_PX * MOVE_PX) {
    if (press.timer) clearTimeout(press.timer);
    press.moved = true;
    clearPressVisual();
  }
});

boardEl.addEventListener('pointerup', function (ev) {
  if (ev.button === 1 || ev.button === 2) {
    clearPressVisual();
    return;
  }
  if (!press || press.id !== ev.pointerId) {
    clearPressVisual();
    return;
  }
  var info = press;
  if (info.timer) clearTimeout(info.timer);
  press = null;
  clearPressVisual();
  if (info.flagged || info.chorded || info.moved) return;
  primaryAction(info.i);
});

boardEl.addEventListener('pointercancel', function () {
  cancelPress();
});

boardEl.addEventListener('contextmenu', function (ev) {
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
diff9.addEventListener('click', function () { restart(9); });
diff16.addEventListener('click', function () { restart(16); });

function moveCursor(dr, dc) {
  var r = (cursor / size) | 0;
  var c = cursor % size;
  r = Math.max(0, Math.min(size - 1, r + dr));
  c = Math.max(0, Math.min(size - 1, c + dc));
  var next = idx(size, r, c);
  if (next === cursor) return;
  var prev = cursor;
  cursor = next;
  paintCell(prev);
  paintCell(cursor);
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
  if (game.status !== 'play') return;
  if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
    ev.preventDefault();
    showCursor = true;
    moveCursor(
      key === 'ArrowUp' ? -1 : key === 'ArrowDown' ? 1 : 0,
      key === 'ArrowLeft' ? -1 : key === 'ArrowRight' ? 1 : 0
    );
    return;
  }
  if (key === ' ' || key === 'Enter') {
    ev.preventDefault();
    primaryAction(cursor);
    return;
  }
  if (key === 'f' || key === 'F') {
    ev.preventDefault();
    doFlag(cursor);
  }
});

showTouchMode();
restart(9);
timerId = setInterval(tick, 200);
boardEl.addEventListener('click', function () { boardEl.focus(); });

} /* document */
