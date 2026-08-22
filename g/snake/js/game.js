'use strict';

/* Classic Nokia Snake. Solid walls. No wrap. */

var COLS = 18;
var ROWS = 16;
var BASE_MS = 140;
var FLOOR_MS = 70;
var SPEED_EVERY = 4;
var SPEED_STEP = 12;
var SCORE_PER = 1;
var SWIPE_MIN = 24;
var BEST_KEY = 'playbox-snake-best';

var DIRS = {
  left: { c: -1, r: 0 },
  right: { c: 1, r: 0 },
  up: { c: 0, r: -1 },
  down: { c: 0, r: 1 }
};
var OPP = { left: 'right', right: 'left', up: 'down', down: 'up' };
var KEY_DIR = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'down'
};

function midC() { return (COLS / 2) | 0; }
function midR() { return (ROWS / 2) | 0; }

function startSnake() {
  var c = midC();
  var r = midR();
  return [
    { c: c, r: r },
    { c: c - 1, r: r },
    { c: c - 2, r: r }
  ];
}

function copySnake(s) {
  var out = [];
  for (var i = 0; i < s.length; i++) out.push({ c: s[i].c, r: s[i].r });
  return out;
}

function inBounds(c, r) {
  return c >= 0 && r >= 0 && c < COLS && r < ROWS;
}

function bodyIndex(snake, c, r) {
  for (var i = 0; i < snake.length; i++) {
    if (snake[i].c === c && snake[i].r === r) return i;
  }
  return -1;
}

function intervalFor(score) {
  var steps = Math.floor(Math.max(0, score) / SPEED_EVERY);
  var ms = BASE_MS - steps * SPEED_STEP;
  return ms < FLOOR_MS ? FLOOR_MS : ms;
}

function occupiedSet(snake) {
  var set = {};
  for (var i = 0; i < snake.length; i++) set[snake[i].c + ',' + snake[i].r] = 1;
  return set;
}

function spawnFood(snake, rand) {
  var free = [];
  var occ = occupiedSet(snake);
  var r, c, key;
  for (r = 0; r < ROWS; r++) {
    for (c = 0; c < COLS; c++) {
      key = c + ',' + r;
      if (!occ[key]) free.push({ c: c, r: r });
    }
  }
  if (!free.length) return null;
  var pick = Math.floor(rand() * free.length);
  if (pick >= free.length) pick = free.length - 1;
  if (pick < 0) pick = 0;
  return { c: free[pick].c, r: free[pick].r };
}

function freshState(rand) {
  var snake = startSnake();
  return {
    snake: snake,
    prev: copySnake(snake),
    dir: 'right',
    pending: null,
    food: spawnFood(snake, rand),
    score: 0,
    alive: true,
    won: false,
    grew: false,
    tickMs: BASE_MS
  };
}

function queueTurn(state, d) {
  if (!state.alive || state.won) return;
  if (!DIRS[d]) return;
  if (OPP[d] === state.dir) return;
  if (d === state.dir) {
    state.pending = null;
    return;
  }
  state.pending = d;
}

function step(state) {
  if (!state.alive || state.won) return state;
  state.prev = copySnake(state.snake);
  state.grew = false;
  if (state.pending && DIRS[state.pending]) {
    if (OPP[state.pending] !== state.dir) state.dir = state.pending;
    state.pending = null;
  }
  var d = DIRS[state.dir];
  var head = state.snake[0];
  var nc = head.c + d.c;
  var nr = head.r + d.r;
  if (!inBounds(nc, nr)) {
    state.alive = false;
    state.pending = null;
    return state;
  }
  var eating = state.food && state.food.c === nc && state.food.r === nr;
  var hit = bodyIndex(state.snake, nc, nr);
  if (hit !== -1) {
    var isTail = hit === state.snake.length - 1;
    if (!(isTail && !eating)) {
      state.alive = false;
      state.pending = null;
      return state;
    }
  }
  state.snake.unshift({ c: nc, r: nr });
  if (!eating) {
    state.snake.pop();
  } else {
    state.grew = true;
    state.score += SCORE_PER;
    state.tickMs = intervalFor(state.score);
    if (state.snake.length >= COLS * ROWS) {
      state.won = true;
      state.food = null;
      state.pending = null;
      return state;
    }
    state.food = spawnFood(state.snake, Math.random);
  }
  return state;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

/* ---- logic self-check (runs in node and browser) ---- */
function selfCheck() {
  var i, s, n;

  s = freshState(function () { return 0; });
  if (s.snake.length !== 3) throw new Error('start length 3');
  if (s.dir !== 'right') throw new Error('start facing right');
  if (s.snake[0].c !== midC() || s.snake[0].r !== midR()) throw new Error('start middle');
  if (s.snake[1].c !== midC() - 1 || s.snake[2].c !== midC() - 2) throw new Error('body left of head');
  if (s.food && bodyIndex(s.snake, s.food.c, s.food.r) !== -1) throw new Error('food on snake');

  s.food = { c: 0, r: 0 };
  n = s.snake[0].c;
  step(s);
  if (!s.alive) throw new Error('first step should live');
  if (s.snake[0].c !== n + 1 || s.snake[0].r !== midR()) throw new Error('moved right');
  if (s.snake.length !== 3) throw new Error('no grow without food');
  if (s.snake[2].c !== midC() - 1) throw new Error('tail followed');

  s = freshState(function () { return 0; });
  s.snake = [{ c: COLS - 1, r: 4 }, { c: COLS - 2, r: 4 }, { c: COLS - 3, r: 4 }];
  s.prev = copySnake(s.snake);
  s.dir = 'right';
  s.food = { c: 0, r: 0 };
  step(s);
  if (s.alive) throw new Error('right wall must kill');
  if (s.snake[0].c !== COLS - 1) throw new Error('no wrap on right wall');
  if (s.snake[0].c === 0) throw new Error('wrapped — that is a different game');

  s = freshState(function () { return 0; });
  s.snake = [{ c: 0, r: 4 }, { c: 1, r: 4 }, { c: 2, r: 4 }];
  s.dir = 'left';
  s.food = { c: 8, r: 8 };
  step(s);
  if (s.alive || s.snake[0].c !== 0) throw new Error('left wall must kill, no wrap');

  s = freshState(function () { return 0; });
  s.snake = [{ c: 4, r: 0 }, { c: 4, r: 1 }, { c: 4, r: 2 }];
  s.dir = 'up';
  s.food = { c: 8, r: 8 };
  step(s);
  if (s.alive || s.snake[0].r !== 0) throw new Error('top wall must kill, no wrap');

  s = freshState(function () { return 0; });
  s.snake = [{ c: 4, r: ROWS - 1 }, { c: 4, r: ROWS - 2 }, { c: 4, r: ROWS - 3 }];
  s.dir = 'down';
  s.food = { c: 8, r: 8 };
  step(s);
  if (s.alive || s.snake[0].r !== ROWS - 1) throw new Error('bottom wall must kill, no wrap');

  s = freshState(function () { return 0; });
  s.snake = [
    { c: 5, r: 5 }, { c: 5, r: 6 }, { c: 6, r: 6 },
    { c: 6, r: 5 }, { c: 6, r: 4 }, { c: 5, r: 4 }, { c: 4, r: 4 }
  ];
  s.dir = 'right';
  s.food = { c: 0, r: 0 };
  step(s);
  if (s.alive) throw new Error('bite self must kill');
  if (s.snake[0].c !== 5 || s.snake[0].r !== 5) throw new Error('self-bite keeps last valid head');

  s = freshState(function () { return 0; });
  s.snake = [
    { c: 2, r: 1 }, { c: 1, r: 1 }, { c: 1, r: 2 },
    { c: 2, r: 2 }, { c: 3, r: 2 }, { c: 3, r: 1 }
  ];
  s.dir = 'right';
  s.food = { c: 0, r: 0 };
  step(s);
  if (!s.alive) throw new Error('moving onto leaving tail must live');
  if (s.snake[0].c !== 3 || s.snake[0].r !== 1) throw new Error('landed on old tail');
  if (s.snake.length !== 6) throw new Error('tail vacated');

  s = freshState(function () { return 0; });
  s.snake = [
    { c: 2, r: 1 }, { c: 1, r: 1 }, { c: 1, r: 2 },
    { c: 2, r: 2 }, { c: 3, r: 2 }, { c: 3, r: 1 }
  ];
  s.dir = 'right';
  s.food = { c: 3, r: 1 };
  step(s);
  if (s.alive) throw new Error('eating while landing on tail must kill');

  s = freshState(function () { return 0; });
  s.food = { c: s.snake[0].c + 1, r: s.snake[0].r };
  var before = s.snake.length;
  step(s);
  if (!s.alive) throw new Error('eat should live');
  if (s.snake.length !== before + 1) throw new Error('grow by 1');
  if (s.score !== SCORE_PER) throw new Error('score +1');
  if (!s.food) throw new Error('new pellet');
  if (bodyIndex(s.snake, s.food.c, s.food.r) !== -1) throw new Error('new food on snake');

  s = freshState(function () { return 0; });
  s.dir = 'right';
  queueTurn(s, 'left');
  if (s.pending) throw new Error('ignore 180');
  queueTurn(s, 'up');
  if (s.pending !== 'up') throw new Error('queue turn');
  queueTurn(s, 'down');
  if (s.pending !== 'down') throw new Error('replace pending (one slot)');
  queueTurn(s, 'left');
  if (s.pending !== 'down') throw new Error('180 of current still ignored while pending');
  queueTurn(s, 'right');
  if (s.pending !== null) throw new Error('same-as-current cancels pending');

  s = freshState(function () { return 0; });
  s.alive = false;
  queueTurn(s, 'up');
  if (s.pending) throw new Error('no turns while dead');
  s.alive = true;
  s.won = true;
  queueTurn(s, 'up');
  if (s.pending) throw new Error('no turns while won');

  if (intervalFor(0) !== 140) throw new Error('start interval 140');
  if (intervalFor(4) !== 128) throw new Error('speed every 4 foods');
  if (intervalFor(24) !== 70) throw new Error('floor 70');
  if (intervalFor(99) !== 70) throw new Error('stay at floor');

  s = freshState(function () { return 0; });
  s.snake = [{ c: COLS - 2, r: ROWS - 1 }];
  for (i = 0; i < COLS * ROWS; i++) {
    var cc = i % COLS;
    var rr = (i / COLS) | 0;
    if (cc === COLS - 2 && rr === ROWS - 1) continue;
    if (cc === COLS - 1 && rr === ROWS - 1) continue;
    s.snake.push({ c: cc, r: rr });
  }
  s.food = { c: COLS - 1, r: ROWS - 1 };
  s.dir = 'right';
  s.score = 0;
  step(s);
  if (!s.won || s.alive !== true) throw new Error('full board is a win');
  if (s.snake.length !== COLS * ROWS) throw new Error('filled every cell');
  if (s.food !== null) throw new Error('no food on full board');

  var seen = {};
  for (i = 0; i < 40; i++) {
    s = freshState(function () { return Math.random(); });
    if (!s.food) throw new Error('food required at start');
    seen[s.food.c + ',' + s.food.r] = 1;
    if (bodyIndex(s.snake, s.food.c, s.food.r) !== -1) throw new Error('start food overlap');
  }
}

selfCheck();

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
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

var sfx = {
  eat: function () { beep(520, 0.08, 0.055, 'square', 780); },
  die: function () { beep(196, 0.32, 0.055, 'sawtooth', 70); },
  win: function () {
    beep(392, 0.12, 0.06, 'square', 523);
    setTimeout(function () { beep(523, 0.12, 0.06, 'square', 659); }, 90);
    setTimeout(function () { beep(784, 0.22, 0.07, 'square'); }, 180);
  }
};

if (typeof document === 'undefined') {
  /* node --check / selfCheck only */
} else {

var canvas = document.getElementById('c');
var boardEl = document.getElementById('board');
var stageEl = document.getElementById('stage');
var overlayEl = document.getElementById('overlay');
var panelEl = document.getElementById('panel');
var ovTitle = document.getElementById('ov-title');
var ovLead = document.getElementById('ov-lead');
var ovRetry = document.getElementById('ov-retry');
var scoreEl = document.getElementById('score');
var bestEl = document.getElementById('best');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var ctx = canvas.getContext('2d');
var motionQ = window.matchMedia('(prefers-reduced-motion: reduce)');

var best = loadBest();
var state = freshState(Math.random);
var acc = 0;
var lastTs = 0;
var overlayMode = null;
var dpr = 1;
var cssW = 0;
var cssH = 0;
var headPopUntil = 0;
var foodPopUntil = 0;
var eatFlashUntil = 0;

function reduceMotion() {
  return motionQ.matches;
}

function overlayOpen() {
  return overlayMode !== null;
}

function playing() {
  return state.alive && !state.won && overlayMode === null;
}

function hideOverlay() {
  overlayMode = null;
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  canvas.focus({ preventScroll: true });
}

function showOverlay(mode, title, lead) {
  overlayMode = mode;
  ovTitle.textContent = title;
  ovLead.textContent = lead;
  panelEl.className = 'panel ' + mode;
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  ovRetry.focus();
}

function updateScoreUI(gained) {
  scoreEl.textContent = String(state.score);
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

function persistBest() {
  if (state.score > best) {
    best = state.score;
    saveBest(best);
  }
  bestEl.textContent = String(best);
}

function dieFx() {
  sfx.die();
  if (!reduceMotion()) {
    stageEl.classList.remove('die');
    void stageEl.offsetWidth;
    stageEl.classList.add('die');
  }
  persistBest();
  showOverlay(
    'lose',
    '撞上了',
    '墙是实心的，不会穿过去。本局 ' + state.score + ' 分。'
  );
}

function winFx() {
  sfx.win();
  persistBest();
  showOverlay(
    'win',
    '盘满了',
    '格子全占满了。本局 ' + state.score + ' 分。'
  );
}

function newGame() {
  state = freshState(Math.random);
  acc = 0;
  lastTs = performance.now();
  headPopUntil = lastTs + 180;
  foodPopUntil = lastTs + 220;
  eatFlashUntil = 0;
  overlayMode = null;
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  stageEl.classList.remove('die');
  scoreAdd.hidden = true;
  updateScoreUI(0);
  canvas.focus({ preventScroll: true });
}

function applyTick(now) {
  var before = state.score;
  var wasAlive = state.alive;
  step(state);
  if (state.won) {
    acc = 0;
    winFx();
    return;
  }
  if (!state.alive) {
    acc = 0;
    if (wasAlive) dieFx();
    return;
  }
  headPopUntil = now + Math.min(160, state.tickMs * 0.9);
  if (state.score > before) {
    eatFlashUntil = now + 180;
    foodPopUntil = now + 240;
    persistBest();
    updateScoreUI(state.score - before);
    sfx.eat();
  }
}

function interpCell(i, t) {
  var curr = state.snake;
  var prev = state.prev;
  var to = curr[i];
  var from;
  if (i < prev.length) from = prev[i];
  else from = prev[prev.length - 1] || to;
  return {
    c: lerp(from.c, to.c, t),
    r: lerp(from.r, to.r, t)
  };
}

function resize() {
  var wrap = boardEl;
  var w = wrap.clientWidth;
  var h = wrap.clientHeight;
  if (w < 8 || h < 8) return;
  cssW = w;
  cssH = h;
  dpr = Math.min(2.5, window.devicePixelRatio || 1);
  var pw = Math.round(w * dpr);
  var ph = Math.round(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
}

function cellLayout() {
  var pad = Math.max(14, Math.min(cssW, cssH) * 0.06);
  var innerW = cssW - pad * 2;
  var innerH = cssH - pad * 2;
  var cell = Math.min(innerW / COLS, innerH / ROWS);
  var gw = cell * COLS;
  var gh = cell * ROWS;
  return {
    pad: pad,
    cell: cell,
    ox: (cssW - gw) / 2,
    oy: (cssH - gh) / 2,
    gw: gw,
    gh: gh
  };
}

function drawGrid(L) {
  var c, r, x, y;
  ctx.save();
  ctx.translate(L.ox, L.oy);
  ctx.fillStyle = '#07140f';
  ctx.fillRect(0, 0, L.gw, L.gh);

  ctx.fillStyle = 'rgba(61,255,136,0.04)';
  for (r = 0; r < ROWS; r++) {
    for (c = 0; c < COLS; c++) {
      if ((c + r) % 2 === 0) ctx.fillRect(c * L.cell, r * L.cell, L.cell, L.cell);
    }
  }

  ctx.strokeStyle = 'rgba(61,255,136,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (c = 1; c < COLS; c++) {
    x = c * L.cell + 0.5;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, L.gh);
  }
  for (r = 1; r < ROWS; r++) {
    y = r * L.cell + 0.5;
    ctx.moveTo(0, y);
    ctx.lineTo(L.gw, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawWalls(L, now) {
  var t = overlayMode === 'lose' && !reduceMotion()
    ? 0.55 + 0.45 * Math.abs(Math.sin(now / 90))
    : 1;
  var m = Math.max(5, L.cell * 0.16);
  ctx.save();
  ctx.strokeStyle = overlayMode === 'lose'
    ? 'rgba(255,61,184,' + (0.7 * t) + ')'
    : 'rgba(0,240,255,0.7)';
  ctx.lineWidth = m;
  ctx.lineJoin = 'round';
  ctx.shadowColor = overlayMode === 'lose' ? '#ff3db8' : '#00f0ff';
  ctx.shadowBlur = 12 * t;
  roundRect(L.ox - m * 0.15, L.oy - m * 0.15, L.gw + m * 0.3, L.gh + m * 0.3, 6);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = overlayMode === 'lose'
    ? 'rgba(255,160,210,0.45)'
    : 'rgba(61,255,136,0.4)';
  ctx.lineWidth = 1.4;
  roundRect(L.ox - m * 0.55, L.oy - m * 0.55, L.gw + m * 1.1, L.gh + m * 1.1, 10);
  ctx.stroke();
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  var rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, rr);
  } else {
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }
}

function hueAt(i, n) {
  return 142 + (188 - 142) * (n <= 1 ? 0 : i / (n - 1));
}

function drawFood(L, now) {
  var f = state.food;
  if (!f) return;
  var cx = L.ox + (f.c + 0.5) * L.cell;
  var cy = L.oy + (f.r + 0.5) * L.cell;
  var pop = 1;
  if (!reduceMotion()) {
    var pulse = 1 + 0.1 * Math.sin(now / 170);
    var spawn = 1;
    if (now < foodPopUntil) {
      var u = 1 - (foodPopUntil - now) / 240;
      spawn = 0.45 + 0.55 * (1 - Math.pow(1 - clamp(u, 0, 1), 3));
    }
    pop = pulse * spawn;
  }
  var rad = L.cell * 0.28 * pop;
  ctx.save();
  ctx.shadowColor = '#ff3db8';
  ctx.shadowBlur = L.cell * 0.55;
  var g = ctx.createRadialGradient(cx - rad * 0.3, cy - rad * 0.35, rad * 0.15, cx, cy, rad);
  g.addColorStop(0, '#ffd0ee');
  g.addColorStop(0.45, '#ff3db8');
  g.addColorStop(1, '#9a1868');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc(cx - rad * 0.28, cy - rad * 0.32, rad * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSnake(L, now, t) {
  var n = state.snake.length;
  if (!n) return;
  var pts = [];
  var i;
  for (i = 0; i < n; i++) pts.push(interpCell(i, t));

  var radius = L.cell * 0.36;
  var tailR = L.cell * 0.22;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(61,255,136,0.55)';
  ctx.shadowBlur = L.cell * 0.45;

  if (n > 1) {
    ctx.lineWidth = radius * 2;
    ctx.strokeStyle = 'rgba(61,255,136,0.18)';
    ctx.beginPath();
    ctx.moveTo(L.ox + (pts[0].c + 0.5) * L.cell, L.oy + (pts[0].r + 0.5) * L.cell);
    for (i = 1; i < n; i++) {
      ctx.lineTo(L.ox + (pts[i].c + 0.5) * L.cell, L.oy + (pts[i].r + 0.5) * L.cell);
    }
    ctx.stroke();
  }

  ctx.shadowBlur = L.cell * 0.25;
  for (i = n - 1; i >= 1; i--) {
    var a = pts[i];
    var b = pts[i - 1];
    var ax = L.ox + (a.c + 0.5) * L.cell;
    var ay = L.oy + (a.r + 0.5) * L.cell;
    var bx = L.ox + (b.c + 0.5) * L.cell;
    var by = L.oy + (b.r + 0.5) * L.cell;
    var k = i / (n - 1);
    var w = lerp(radius, tailR, k);
    var hue = hueAt(i, n);
    ctx.strokeStyle = 'hsla(' + hue + ',95%,' + (58 - k * 10) + '%,1)';
    ctx.lineWidth = w * 2;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  for (i = n - 1; i >= 1; i--) {
    var p = pts[i];
    var px = L.ox + (p.c + 0.5) * L.cell;
    var py = L.oy + (p.r + 0.5) * L.cell;
    var kk = i / (n - 1);
    var rr = lerp(radius, tailR, kk) * 0.92;
    var hg = ctx.createRadialGradient(px - rr * 0.3, py - rr * 0.35, rr * 0.1, px, py, rr);
    var hue2 = hueAt(i, n);
    hg.addColorStop(0, 'hsla(' + hue2 + ',100%,78%,1)');
    hg.addColorStop(0.55, 'hsla(' + hue2 + ',95%,56%,1)');
    hg.addColorStop(1, 'hsla(' + hue2 + ',90%,38%,1)');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(px, py, rr, 0, Math.PI * 2);
    ctx.fill();
  }

  var head = pts[0];
  var hx = L.ox + (head.c + 0.5) * L.cell;
  var hy = L.oy + (head.r + 0.5) * L.cell;
  var hp = 1;
  if (!reduceMotion() && now < headPopUntil && playing()) {
    var ht = 1 - (headPopUntil - now) / Math.max(1, Math.min(160, state.tickMs * 0.9));
    hp = 1 + 0.14 * Math.sin(clamp(ht, 0, 1) * Math.PI);
  }
  if (eatFlashUntil > now && !reduceMotion()) hp *= 1.06;
  var hr = radius * 1.12 * hp;
  ctx.shadowColor = '#3dff88';
  ctx.shadowBlur = L.cell * 0.55;
  var hd = ctx.createRadialGradient(hx - hr * 0.25, hy - hr * 0.3, hr * 0.12, hx, hy, hr);
  hd.addColorStop(0, '#e8fff4');
  hd.addColorStop(0.35, '#3dff88');
  hd.addColorStop(1, '#0a8f5a');
  ctx.fillStyle = hd;
  ctx.beginPath();
  ctx.arc(hx, hy, hr, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  var face = DIRS[state.dir] || DIRS.right;
  var fx = face.c;
  var fy = face.r;
  var pxn = -fy;
  var pyn = fx;
  var eyeOff = hr * 0.42;
  var eyeFwd = hr * 0.28;
  var er = Math.max(1.6, hr * 0.18);
  function eye(side) {
    var ex = hx + fx * eyeFwd + pxn * eyeOff * side;
    var ey = hy + fy * eyeFwd + pyn * eyeOff * side;
    ctx.fillStyle = '#05030c';
    ctx.beginPath();
    ctx.arc(ex, ey, er, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7af6ff';
    ctx.beginPath();
    ctx.arc(ex + er * 0.22, ey - er * 0.22, er * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }
  eye(-1);
  eye(1);
  ctx.restore();
}

function render(now) {
  resize();
  if (cssW < 8) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  var L = cellLayout();
  var t = 1;
  if (playing() && !reduceMotion()) {
    t = clamp(acc / Math.max(1, state.tickMs), 0, 1);
  }

  ctx.fillStyle = '#05080a';
  roundRect(0, 0, cssW, cssH, 16);
  ctx.fill();

  drawGrid(L);
  ctx.save();
  ctx.beginPath();
  ctx.rect(L.ox, L.oy, L.gw, L.gh);
  ctx.clip();
  drawFood(L, now);
  drawSnake(L, now, t);
  ctx.restore();
  drawWalls(L, now);

  if (overlayMode === 'lose' && !reduceMotion()) {
    ctx.fillStyle = 'rgba(255,61,184,' + (0.05 + 0.04 * Math.abs(Math.sin(now / 140))) + ')';
    ctx.fillRect(0, 0, cssW, cssH);
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  if (!lastTs) lastTs = now;
  var dt = now - lastTs;
  lastTs = now;
  if (dt > 80) dt = 80;
  if (playing()) {
    acc += dt;
    var guard = 0;
    while (acc >= state.tickMs && playing() && guard < 5) {
      acc -= state.tickMs;
      guard += 1;
      applyTick(now);
    }
    if (!playing()) acc = 0;
  }
  render(now);
}

function toggleMute() {
  muted = !muted;
  btnMute.classList.toggle('muted', muted);
  btnMute.textContent = muted ? '静' : '声';
  btnMute.setAttribute('aria-label', muted ? '开启声音' : '静音');
  if (!muted) audioCtx();
}

function onDir(d) {
  if (!d || overlayOpen()) return;
  if (!muted) audioCtx();
  queueTurn(state, d);
}

var touchX = 0;
var touchY = 0;
var tracking = false;
var swiped = false;
var pointerX = 0;
var pointerY = 0;
var pointerTracking = false;
var pointerSwiped = false;

function swipeDir(dx, dy) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

canvas.addEventListener('touchstart', function (e) {
  var t = e.changedTouches[0];
  if (!t) return;
  tracking = true;
  swiped = false;
  touchX = t.clientX;
  touchY = t.clientY;
}, { passive: true });

canvas.addEventListener('touchmove', function (e) {
  e.preventDefault();
  if (!tracking || swiped) return;
  var t = e.changedTouches[0];
  if (!t) return;
  var d = swipeDir(t.clientX - touchX, t.clientY - touchY);
  if (d) {
    swiped = true;
    onDir(d);
  }
}, { passive: false });

canvas.addEventListener('touchend', function (e) {
  if (!tracking) return;
  tracking = false;
  if (swiped) return;
  var t = e.changedTouches[0];
  if (!t) return;
  var d = swipeDir(t.clientX - touchX, t.clientY - touchY);
  if (d) onDir(d);
}, { passive: true });

canvas.addEventListener('touchcancel', function () {
  tracking = false;
  swiped = false;
});

stageEl.addEventListener('touchmove', function (e) {
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('pointerdown', function (e) {
  if (e.pointerType === 'touch') return;
  if (e.button !== 0) return;
  pointerTracking = true;
  pointerSwiped = false;
  pointerX = e.clientX;
  pointerY = e.clientY;
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
});

canvas.addEventListener('pointermove', function (e) {
  if (e.pointerType === 'touch') return;
  if (!pointerTracking || pointerSwiped) return;
  var d = swipeDir(e.clientX - pointerX, e.clientY - pointerY);
  if (d) {
    pointerSwiped = true;
    onDir(d);
  }
});

canvas.addEventListener('pointerup', function (e) {
  if (e.pointerType === 'touch') return;
  if (!pointerTracking) return;
  pointerTracking = false;
  if (pointerSwiped) return;
  var d = swipeDir(e.clientX - pointerX, e.clientY - pointerY);
  if (d) onDir(d);
});

canvas.addEventListener('pointercancel', function () {
  pointerTracking = false;
  pointerSwiped = false;
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
  var dir = KEY_DIR[key] || KEY_DIR[code];
  if (dir) {
    e.preventDefault();
    if (e.repeat) return;
    onDir(dir);
  }
});

btnMute.addEventListener('click', toggleMute);
btnRetry.addEventListener('click', function () { newGame(); });
ovRetry.addEventListener('click', function () { newGame(); });

stageEl.addEventListener('pointerdown', function () {
  if (!overlayOpen()) canvas.focus({ preventScroll: true });
});

stageEl.addEventListener('animationend', function () {
  stageEl.classList.remove('die');
});

window.addEventListener('resize', function () { resize(); });
if (motionQ.addEventListener) motionQ.addEventListener('change', function () { /* snap next frame */ });

bestEl.textContent = String(best);
newGame();
requestAnimationFrame(frame);

}
