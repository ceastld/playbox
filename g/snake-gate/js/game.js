'use strict';

/* Nokia Snake with colored portal pairs. Solid walls. No wrap. Optional autoplay. */

var COLS = 16;
var ROWS = 16;
var BASE_MS = 145;
var FLOOR_MS = 80;
var SPEED_EVERY = 5;
var SPEED_STEP = 10;
var SCORE_PER = 1;
var PAIR_COUNT = 3;
var SHUFFLE_EVERY = 5;
var SWIPE_MIN = 24;
var BEST_KEY = 'playbox-snake-gate-best';
var AUTO_SPEED_KEY = 'playbox-snake-gate-auto-speed';
var AUTO_MS = [0, 160, 90, 45, 16];
var SPEED_LABELS = ['', '慢', '中', '快', '极快'];
var AUTO_DIRS = ['up', 'left', 'down', 'right'];

var DIRS = {
  left: { c: -1, r: 0 },
  right: { c: 1, r: 0 },
  up: { c: 0, r: -1 },
  down: { c: 0, r: 1 }
};
var OPP = { left: 'right', right: 'left', up: 'down', down: 'up' };
var KEY_DIR = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  KeyD: 'right', KeyW: 'up', KeyS: 'down',
  d: 'right', w: 'up', s: 'down',
  D: 'right', W: 'up', S: 'down'
};

var PAIR_META = [
  { id: 'A', fill: '#ff3db8', glow: '#ff9ad4' },
  { id: 'B', fill: '#00f0ff', glow: '#7af6ff' },
  { id: 'C', fill: '#ffe36b', glow: '#fff3b0' }
];

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
  var i;
  for (i = 0; i < s.length; i++) out.push({ c: s[i].c, r: s[i].r });
  return out;
}

function inBounds(c, r) {
  return c >= 0 && r >= 0 && c < COLS && r < ROWS;
}

function cellKey(c, r) {
  return c + ',' + r;
}

function manh(a, b) {
  return Math.abs(a.c - b.c) + Math.abs(a.r - b.r);
}

function bodyIndex(snake, c, r) {
  var i;
  for (i = 0; i < snake.length; i++) {
    if (snake[i].c === c && snake[i].r === r) return i;
  }
  return -1;
}

function occupiedSet(snake) {
  var set = {};
  var i;
  for (i = 0; i < snake.length; i++) set[cellKey(snake[i].c, snake[i].r)] = 1;
  return set;
}

function markPortals(set, portals) {
  var i, p;
  if (!portals) return set;
  for (i = 0; i < portals.length; i++) {
    p = portals[i];
    if (!p) continue;
    if (p.a) set[cellKey(p.a.c, p.a.r)] = 1;
    if (p.b) set[cellKey(p.b.c, p.b.r)] = 1;
  }
  return set;
}

function intervalFor(score) {
  var steps = Math.floor(Math.max(0, score) / SPEED_EVERY);
  var ms = BASE_MS - steps * SPEED_STEP;
  return ms < FLOOR_MS ? FLOOR_MS : ms;
}

function foodsUntilShuffle(score) {
  var m = score % SHUFFLE_EVERY;
  return m === 0 ? SHUFFLE_EVERY : SHUFFLE_EVERY - m;
}

function classicPortals() {
  return [
    { id: 'A', fill: PAIR_META[0].fill, glow: PAIR_META[0].glow, a: { c: 1, r: 1 }, b: { c: 14, r: 14 } },
    { id: 'B', fill: PAIR_META[1].fill, glow: PAIR_META[1].glow, a: { c: 14, r: 1 }, b: { c: 1, r: 14 } },
    { id: 'C', fill: PAIR_META[2].fill, glow: PAIR_META[2].glow, a: { c: 1, r: 8 }, b: { c: 14, r: 8 } }
  ];
}

function copyPortals(portals) {
  var out = [];
  var i, p;
  for (i = 0; i < portals.length; i++) {
    p = portals[i];
    out.push({
      id: p.id,
      fill: p.fill,
      glow: p.glow,
      a: { c: p.a.c, r: p.a.r },
      b: { c: p.b.c, r: p.b.r }
    });
  }
  return out;
}

function portalSig(portals) {
  var parts = [];
  var i, p;
  for (i = 0; i < portals.length; i++) {
    p = portals[i];
    parts.push(p.id + ':' + p.a.c + ',' + p.a.r + '-' + p.b.c + ',' + p.b.r);
  }
  return parts.join('|');
}

function portalAt(portals, c, r) {
  var i, p;
  if (!portals) return null;
  for (i = 0; i < portals.length; i++) {
    p = portals[i];
    if (p.a && p.a.c === c && p.a.r === r) return { pair: p, other: p.b, entered: 'a' };
    if (p.b && p.b.c === c && p.b.r === r) return { pair: p, other: p.a, entered: 'b' };
  }
  return null;
}

function shuffleInPlace(arr, rand) {
  var i, j, t;
  for (i = arr.length - 1; i > 0; i--) {
    j = Math.floor(rand() * (i + 1));
    if (j < 0) j = 0;
    if (j > i) j = i;
    t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}

function tooClose(cell, taken, minD) {
  var i;
  for (i = 0; i < taken.length; i++) {
    if (manh(cell, taken[i]) < minD) return true;
  }
  return false;
}

function pickPortalsFromFree(free, rand, nPairs, minD) {
  var pool = free.slice();
  var taken = [];
  var result = [];
  var i, k, a, b, meta;
  shuffleInPlace(pool, rand);
  for (i = 0; i < nPairs; i++) {
    meta = PAIR_META[i];
    a = null;
    b = null;
    for (k = 0; k < pool.length; k++) {
      if (tooClose(pool[k], taken, minD)) continue;
      if (!a) {
        a = pool[k];
        continue;
      }
      b = pool[k];
      break;
    }
    if (!a || !b) return null;
    taken.push(a, b);
    result.push({
      id: meta.id,
      fill: meta.fill,
      glow: meta.glow,
      a: { c: a.c, r: a.r },
      b: { c: b.c, r: b.r }
    });
  }
  return result;
}

function reserveRunway(occ, snake, dir) {
  var d = DIRS[dir] || DIRS.right;
  var head = snake && snake[0];
  var i, k, c, r, dc, dr, sc, sr, body;
  if (!head) return;
  for (i = 1; i <= 4; i++) {
    c = head.c + d.c * i;
    r = head.r + d.r * i;
    if (inBounds(c, r)) occ[cellKey(c, r)] = 1;
  }
  for (k = 0; k < snake.length; k++) {
    body = snake[k];
    for (dr = -1; dr <= 1; dr++) {
      for (dc = -1; dc <= 1; dc++) {
        sc = body.c + dc;
        sr = body.r + dr;
        if (inBounds(sc, sr)) occ[cellKey(sc, sr)] = 1;
      }
    }
  }
}

function placePortals(snake, food, rand, nPairs, dir) {
  var n = nPairs || PAIR_COUNT;
  var occ = occupiedSet(snake);
  if (food) occ[cellKey(food.c, food.r)] = 1;
  reserveRunway(occ, snake, dir);
  var free = [];
  var r, c;
  for (r = 0; r < ROWS; r++) {
    for (c = 0; c < COLS; c++) {
      if (!occ[cellKey(c, r)]) free.push({ c: c, r: r });
    }
  }
  if (free.length < n * 2) return [];
  var attempt, found, minD, count;
  for (attempt = 0; attempt < 48; attempt++) {
    minD = attempt < 18 ? 4 : attempt < 32 ? 3 : 2;
    found = pickPortalsFromFree(free, rand, n, minD);
    if (found && found.length === n) return found;
  }
  for (count = n; count >= 2; count--) {
    found = pickPortalsFromFree(free, rand, count, 2);
    if (found && found.length === count) return found;
  }
  return pickPortalsFromFree(free, rand, 2, 1) || [];
}

function spawnFood(snake, portals, rand) {
  var occ = occupiedSet(snake);
  markPortals(occ, portals);
  var free = [];
  var r, c, key, pick;
  for (r = 0; r < ROWS; r++) {
    for (c = 0; c < COLS; c++) {
      key = cellKey(c, r);
      if (!occ[key]) free.push({ c: c, r: r });
    }
  }
  if (!free.length) return null;
  pick = Math.floor(rand() * free.length);
  if (pick >= free.length) pick = free.length - 1;
  if (pick < 0) pick = 0;
  return { c: free[pick].c, r: free[pick].r };
}

function freshState(mode, rand) {
  if (!rand) rand = Math.random;
  if (mode !== 'chaos') mode = 'classic';
  var snake = startSnake();
  var portals = mode === 'chaos' ? placePortals(snake, null, rand, PAIR_COUNT, 'right') : classicPortals();
  if (!portals || portals.length < 2) portals = classicPortals();
  return {
    snake: snake,
    prev: copySnake(snake),
    dir: 'right',
    pending: null,
    food: spawnFood(snake, portals, rand),
    portals: portals,
    mode: mode,
    score: 0,
    alive: true,
    won: false,
    grew: false,
    warped: false,
    shuffled: false,
    death: null,
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

function cellBlocked(snake, c, r, eating) {
  var hit = bodyIndex(snake, c, r);
  if (hit === -1) return false;
  var isTail = hit === snake.length - 1;
  if (isTail && !eating) return false;
  return true;
}

function step(state, rand) {
  if (!state.alive || state.won) return state;
  if (!rand) rand = Math.random;
  state.prev = copySnake(state.snake);
  state.grew = false;
  state.warped = false;
  state.shuffled = false;
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
    state.death = 'wall';
    state.pending = null;
    return state;
  }

  var gate = portalAt(state.portals, nc, nr);
  var eating;
  if (gate && gate.other) {
    var ec = gate.other.c;
    var er = gate.other.r;
    if (!inBounds(ec, er) || cellBlocked(state.snake, ec, er, false)) {
      state.alive = false;
      state.death = 'gate';
      state.pending = null;
      return state;
    }
    nc = ec;
    nr = er;
    state.warped = true;
    eating = false;
  } else {
    eating = !!(state.food && state.food.c === nc && state.food.r === nr);
    if (cellBlocked(state.snake, nc, nr, eating)) {
      state.alive = false;
      state.death = 'self';
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
    if (state.mode === 'chaos' && state.score % SHUFFLE_EVERY === 0) {
      var next = placePortals(state.snake, null, rand, PAIR_COUNT, state.dir);
      if (next && next.length >= 2) {
        state.portals = next;
        state.shuffled = true;
      }
    }
    if (state.snake.length >= COLS * ROWS) {
      state.won = true;
      state.food = null;
      state.pending = null;
      return state;
    }
    state.food = spawnFood(state.snake, state.portals, rand);
  }
  return state;
}

function occupyMask(snake, allowTail, startC, startR) {
  var blocked = {};
  var n = snake.length;
  var end = allowTail ? n - 1 : n;
  var i;
  if (end < 0) end = 0;
  for (i = 0; i < end; i++) blocked[cellKey(snake[i].c, snake[i].r)] = 1;
  if (startC !== undefined) delete blocked[cellKey(startC, startR)];
  return blocked;
}

function walkLand(c, r, dirName, blocked, portals) {
  var d = DIRS[dirName];
  var nc;
  var nr;
  var gate;
  if (!d) return null;
  nc = c + d.c;
  nr = r + d.r;
  if (!inBounds(nc, nr)) return null;
  gate = portalAt(portals, nc, nr);
  if (gate && gate.other) {
    nc = gate.other.c;
    nr = gate.other.r;
    if (!inBounds(nc, nr)) return null;
    if (blocked[cellKey(nc, nr)]) return null;
    return { c: nc, r: nr };
  }
  if (blocked[cellKey(nc, nr)]) return null;
  return { c: nc, r: nr };
}

function landAfter(snake, food, portals, nc, nr) {
  var gate;
  var eating;
  if (!inBounds(nc, nr)) return null;
  gate = portalAt(portals, nc, nr);
  if (gate && gate.other) {
    if (!inBounds(gate.other.c, gate.other.r)) return null;
    if (cellBlocked(snake, gate.other.c, gate.other.r, false)) return null;
    return { c: gate.other.c, r: gate.other.r };
  }
  eating = !!(food && food.c === nc && food.r === nr);
  if (cellBlocked(snake, nc, nr, eating)) return null;
  return { c: nc, r: nr };
}

function bfsPath(blocked, sc, sr, gc, gr, portals) {
  if (sc === gc && sr === gr) return [];
  if (!inBounds(gc, gr) || !inBounds(sc, sr)) return null;
  var q = [sc, sr];
  var qi = 0;
  var cameC = {};
  var cameR = {};
  var seen = {};
  seen[cellKey(sc, sr)] = 1;
  var i, name, land, nc, nr, k, pc, pr, path, prevC;
  while (qi < q.length) {
    var c = q[qi++];
    var r = q[qi++];
    for (i = 0; i < 4; i++) {
      name = AUTO_DIRS[i];
      land = walkLand(c, r, name, blocked, portals);
      if (!land) continue;
      nc = land.c;
      nr = land.r;
      k = cellKey(nc, nr);
      if (seen[k]) continue;
      seen[k] = 1;
      cameC[k] = c;
      cameR[k] = r;
      if (nc === gc && nr === gr) {
        path = [];
        pc = nc;
        pr = nr;
        while (pc !== sc || pr !== sr) {
          path.push({ c: pc, r: pr });
          k = cellKey(pc, pr);
          prevC = cameC[k];
          pr = cameR[k];
          pc = prevC;
        }
        path.reverse();
        return path;
      }
      q.push(nc, nr);
    }
  }
  return null;
}

function findPath(snake, gc, gr, allowTail, portals) {
  var head = snake[0];
  if (!head) return null;
  return bfsPath(occupyMask(snake, allowTail, head.c, head.r), head.c, head.r, gc, gr, portals);
}

function isSafeMove(snake, food, portals, c, r) {
  return !!landAfter(snake, food, portals, c, r);
}

function virtualAfterPath(snake, food, path) {
  var body = copySnake(snake);
  var i, p, eating, hit, isTail;
  for (i = 0; i < path.length; i++) {
    p = path[i];
    eating = !!(food && food.c === p.c && food.r === p.r);
    if (!inBounds(p.c, p.r)) return null;
    hit = bodyIndex(body, p.c, p.r);
    if (hit !== -1) {
      isTail = hit === body.length - 1;
      if (!(isTail && !eating)) return null;
    }
    body.unshift({ c: p.c, r: p.r });
    if (!eating) body.pop();
  }
  return body;
}

function tailReachable(snake, portals) {
  if (!snake || !snake.length) return false;
  if (snake.length === 1) return true;
  var tail = snake[snake.length - 1];
  var path = findPath(snake, tail.c, tail.r, true, portals);
  return path !== null;
}

function floodFrom(snake, food, nc, nr, portals) {
  var eating = !!(food && food.c === nc && food.r === nr);
  var blocked = occupyMask(snake, !eating, nc, nr);
  var q = [nc, nr];
  var qi = 0;
  var seen = {};
  seen[cellKey(nc, nr)] = 1;
  var count = 0;
  var i, name, land, k;
  while (qi < q.length) {
    var c = q[qi++];
    var r = q[qi++];
    count++;
    for (i = 0; i < 4; i++) {
      name = AUTO_DIRS[i];
      land = walkLand(c, r, name, blocked, portals);
      if (!land) continue;
      k = cellKey(land.c, land.r);
      if (seen[k]) continue;
      seen[k] = 1;
      q.push(land.c, land.r);
    }
  }
  return count;
}

function chooseAutoDir(state) {
  if (!state || !state.alive || state.won) return null;
  var snake = state.snake;
  if (!snake || !snake.length) return null;
  var head = snake[0];
  var food = state.food;
  var portals = state.portals;
  var cur = state.dir;
  var forbidden = OPP[cur];
  var i, name, adjc, adjr, land, virt, fpath, after, tpath, space;
  var foodBest = null;
  var foodBestDist = 1e9;
  var foodBestSpace = -1;
  var tailBest = null;
  var tailBestLen = -1;
  var spaceBest = null;
  var spaceBestN = -1;

  for (i = 0; i < 4; i++) {
    name = AUTO_DIRS[i];
    if (!name || name === forbidden || !DIRS[name]) continue;
    adjc = head.c + DIRS[name].c;
    adjr = head.r + DIRS[name].r;
    land = landAfter(snake, food, portals, adjc, adjr);
    if (!land) continue;
    virt = virtualAfterPath(snake, food, [land]);
    if (!virt) continue;
    space = floodFrom(snake, food, land.c, land.r, portals);
    if (space > spaceBestN || (space === spaceBestN && name === cur)) {
      spaceBestN = space;
      spaceBest = name;
    }

    tpath = findPath(virt, virt[virt.length - 1].c, virt[virt.length - 1].r, true, portals);
    if (tpath !== null) {
      var tlen = tpath.length;
      if (name === cur) tlen += 1;
      if (tlen > tailBestLen) {
        tailBestLen = tlen;
        tailBest = name;
      }
    }

    if (!food) continue;
    if (land.c === food.c && land.r === food.r) {
      if (tpath !== null) {
        if (0 < foodBestDist || (0 === foodBestDist && space > foodBestSpace)) {
          foodBestDist = 0;
          foodBestSpace = space;
          foodBest = name;
        }
      }
      continue;
    }
    fpath = findPath(virt, food.c, food.r, true, portals);
    if (!fpath) continue;
    after = virtualAfterPath(virt, food, fpath);
    if (!after || tpath === null) continue;
    if (!tailReachable(after, portals)) continue;
    if (fpath.length < foodBestDist || (fpath.length === foodBestDist && space > foodBestSpace)) {
      foodBestDist = fpath.length;
      foodBestSpace = space;
      foodBest = name;
    }
  }

  if (foodBest) return foodBest;
  if (tailBest) return tailBest;
  return spaceBest;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

function adjacent(a, b) {
  if (!a || !b) return false;
  return manh(a, b) === 1;
}

function autoWarped(oldC, oldR, dir, newC, newR, portals) {
  var d = DIRS[dir];
  var gate;
  if (!d) return false;
  gate = portalAt(portals, oldC + d.c, oldR + d.r);
  return !!(gate && gate.other && gate.other.c === newC && gate.other.r === newR);
}

/* ---- logic self-check (runs in node and browser) ---- */
function selfCheck() {
  var i, s, n, before, k, hitP, seen, sig, sig2;
  var ad, ag, autoState, autoTicks, hc, hr, dist, autoFails, fp, land;

  s = freshState('classic', function () { return 0; });
  if (s.snake.length !== 3) throw new Error('start length 3');
  if (s.dir !== 'right') throw new Error('start facing right');
  if (s.snake[0].c !== midC() || s.snake[0].r !== midR()) throw new Error('start middle');
  if (s.snake[1].c !== midC() - 1 || s.snake[2].c !== midC() - 2) throw new Error('body left of head');
  if (s.portals.length < 2 || s.portals.length > 3) throw new Error('2–3 portal pairs');
  if (s.food && bodyIndex(s.snake, s.food.c, s.food.r) !== -1) throw new Error('food on snake');
  if (s.food && portalAt(s.portals, s.food.c, s.food.r)) throw new Error('food on portal');

  for (i = 0; i < s.portals.length; i++) {
    if (s.portals[i].id !== PAIR_META[i].id) throw new Error('pair labels A/B/C');
    if (s.portals[i].fill === s.portals[(i + 1) % s.portals.length].fill) {
      throw new Error('portal colors must be distinct');
    }
  }

  s.food = { c: 0, r: 0 };
  n = s.snake[0].c;
  step(s, function () { return 0; });
  if (!s.alive) throw new Error('first step should live');
  if (s.snake[0].c !== n + 1 || s.snake[0].r !== midR()) throw new Error('moved right');
  if (s.snake.length !== 3) throw new Error('no grow without food');
  if (s.snake[2].c !== midC() - 1) throw new Error('tail followed');

  s = freshState('classic', function () { return 0; });
  s.snake = [{ c: COLS - 1, r: 4 }, { c: COLS - 2, r: 4 }, { c: COLS - 3, r: 4 }];
  s.prev = copySnake(s.snake);
  s.dir = 'right';
  s.food = { c: 4, r: 4 };
  s.portals = [];
  step(s);
  if (s.alive) throw new Error('right wall must kill');
  if (s.death !== 'wall') throw new Error('right wall death reason');
  if (s.snake[0].c !== COLS - 1) throw new Error('no wrap on right wall');
  if (s.snake[0].c === 0) throw new Error('wrapped — that is a different game');

  s = freshState('classic', function () { return 0; });
  s.snake = [{ c: 0, r: 4 }, { c: 1, r: 4 }, { c: 2, r: 4 }];
  s.dir = 'left';
  s.food = { c: 8, r: 8 };
  s.portals = [];
  step(s);
  if (s.alive || s.snake[0].c !== 0 || s.death !== 'wall') throw new Error('left wall must kill, no wrap');

  s = freshState('classic', function () { return 0; });
  s.snake = [{ c: 4, r: 0 }, { c: 4, r: 1 }, { c: 4, r: 2 }];
  s.dir = 'up';
  s.food = { c: 8, r: 8 };
  s.portals = [];
  step(s);
  if (s.alive || s.snake[0].r !== 0 || s.death !== 'wall') throw new Error('top wall must kill, no wrap');

  s = freshState('classic', function () { return 0; });
  s.snake = [{ c: 4, r: ROWS - 1 }, { c: 4, r: ROWS - 2 }, { c: 4, r: ROWS - 3 }];
  s.dir = 'down';
  s.food = { c: 8, r: 8 };
  s.portals = [];
  step(s);
  if (s.alive || s.snake[0].r !== ROWS - 1 || s.death !== 'wall') throw new Error('bottom wall must kill, no wrap');

  s = freshState('classic', function () { return 0; });
  s.snake = [
    { c: 5, r: 5 }, { c: 5, r: 6 }, { c: 6, r: 6 },
    { c: 6, r: 5 }, { c: 6, r: 4 }, { c: 5, r: 4 }, { c: 4, r: 4 }
  ];
  s.dir = 'right';
  s.food = { c: 0, r: 0 };
  s.portals = [];
  step(s);
  if (s.alive || s.death !== 'self') throw new Error('bite self must kill');
  if (s.snake[0].c !== 5 || s.snake[0].r !== 5) throw new Error('self-bite keeps last valid head');

  s = freshState('classic', function () { return 0; });
  s.snake = [
    { c: 2, r: 1 }, { c: 1, r: 1 }, { c: 1, r: 2 },
    { c: 2, r: 2 }, { c: 3, r: 2 }, { c: 3, r: 1 }
  ];
  s.dir = 'right';
  s.food = { c: 0, r: 0 };
  s.portals = [];
  step(s);
  if (!s.alive) throw new Error('moving onto leaving tail must live');
  if (s.snake[0].c !== 3 || s.snake[0].r !== 1) throw new Error('landed on old tail');

  s = freshState('classic', function () { return 0; });
  s.food = { c: s.snake[0].c + 1, r: s.snake[0].r };
  s.portals = classicPortals();
  before = s.snake.length;
  step(s, function () { return 0; });
  if (!s.alive) throw new Error('eat should live');
  if (s.snake.length !== before + 1) throw new Error('grow by 1');
  if (s.score !== SCORE_PER) throw new Error('score +1');
  if (!s.food) throw new Error('new pellet');
  if (bodyIndex(s.snake, s.food.c, s.food.r) !== -1) throw new Error('new food on snake');
  if (portalAt(s.portals, s.food.c, s.food.r)) throw new Error('new food on portal');

  s = freshState('classic', function () { return 0; });
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

  s = freshState('classic', function () { return 0; });
  s.snake = [{ c: 4, r: 5 }, { c: 3, r: 5 }, { c: 2, r: 5 }];
  s.prev = copySnake(s.snake);
  s.dir = 'right';
  s.portals = [{ id: 'A', fill: '#ff3db8', glow: '#f', a: { c: 5, r: 5 }, b: { c: 10, r: 10 } }];
  s.food = { c: 0, r: 0 };
  step(s);
  if (!s.alive) throw new Error('open portal should live');
  if (!s.warped) throw new Error('entering A1 should warp');
  if (s.snake[0].c !== 10 || s.snake[0].r !== 10) throw new Error('exit at A2');
  if (s.dir !== 'right') throw new Error('keep heading after warp');
  if (s.snake[1].c !== 4 || s.snake[1].r !== 5) throw new Error('neck stays at pre-gate cell');

  s = freshState('classic', function () { return 0; });
  s.snake = [{ c: 11, r: 10 }, { c: 12, r: 10 }, { c: 13, r: 10 }];
  s.dir = 'left';
  s.portals = [{ id: 'A', fill: '#ff3db8', glow: '#f', a: { c: 5, r: 5 }, b: { c: 10, r: 10 } }];
  s.food = { c: 0, r: 0 };
  step(s);
  if (!s.alive || s.snake[0].c !== 5 || s.snake[0].r !== 5) throw new Error('B to A sibling');
  if (s.dir !== 'left') throw new Error('keep heading B→A');

  s = freshState('classic', function () { return 0; });
  s.snake = [{ c: 4, r: 5 }, { c: 10, r: 10 }, { c: 10, r: 11 }];
  s.dir = 'right';
  s.portals = [{ id: 'A', fill: '#ff3db8', glow: '#f', a: { c: 5, r: 5 }, b: { c: 10, r: 10 } }];
  s.food = { c: 0, r: 0 };
  step(s);
  if (s.alive) throw new Error('blocked portal exit must kill');
  if (s.death !== 'gate') throw new Error('blocked exit death reason');
  if (s.snake[0].c !== 4 || s.snake[0].r !== 5) throw new Error('blocked gate keeps last valid head');

  s = freshState('classic', function () { return 0; });
  s.snake = [{ c: 4, r: 5 }, { c: 3, r: 5 }, { c: 10, r: 10 }];
  s.dir = 'right';
  s.portals = [{ id: 'A', fill: '#ff3db8', glow: '#f', a: { c: 5, r: 5 }, b: { c: 10, r: 10 } }];
  s.food = { c: 0, r: 0 };
  step(s);
  if (!s.alive) throw new Error('exit onto leaving tail must live');
  if (s.snake[0].c !== 10 || s.snake[0].r !== 10) throw new Error('landed on vacating tail via gate');

  s = freshState('classic', function () { return 0; });
  s.snake = [{ c: 1, r: 5 }, { c: 2, r: 5 }, { c: 3, r: 5 }];
  s.dir = 'left';
  s.portals = [{ id: 'A', fill: '#ff3db8', glow: '#f', a: { c: 0, r: 5 }, b: { c: 0, r: 8 } }];
  s.food = { c: 4, r: 4 };
  step(s);
  if (!s.alive || s.snake[0].c !== 0 || s.snake[0].r !== 8) throw new Error('warp from edge portal');
  if (s.dir !== 'left') throw new Error('still facing left on far cell');
  step(s);
  if (s.alive) throw new Error('after edge warp, next step into wall must kill');
  if (s.death !== 'wall') throw new Error('post-warp wall, not wrap');
  if (s.snake[0].c !== 0 || s.snake[0].r !== 8) throw new Error('no wrap after portal');
  if (s.snake[0].c === COLS - 1) throw new Error('wrapped through left wall after gate');

  s = freshState('classic', function () { return 0; });
  s.portals = [
    { id: 'A', fill: '#ff3db8', glow: '#f', a: { c: 5, r: 5 }, b: { c: 10, r: 10 } },
    { id: 'B', fill: '#00f0ff', glow: '#c', a: { c: 5, r: 8 }, b: { c: 10, r: 2 } }
  ];
  s.snake = [{ c: 4, r: 5 }, { c: 3, r: 5 }, { c: 2, r: 5 }];
  s.dir = 'right';
  s.food = { c: 0, r: 0 };
  step(s);
  if (s.snake[0].c !== 10 || s.snake[0].r !== 10) throw new Error('A does not dump into B');

  s = freshState('classic', function () { return 0; });
  sig = portalSig(s.portals);
  s.score = 4;
  s.food = { c: s.snake[0].c + 1, r: s.snake[0].r };
  if (portalAt(s.portals, s.food.c, s.food.r)) throw new Error('classic start food cleared');
  step(s, function () { return 0.7; });
  if (s.score !== 5) throw new Error('fifth food');
  if (s.shuffled) throw new Error('classic must not reshuffle');
  if (portalSig(s.portals) !== sig) throw new Error('classic portals stay fixed');

  s = freshState('chaos', function () { return 0.31; });
  if (s.portals.length < 2) throw new Error('chaos still has pairs');
  sig = portalSig(s.portals);
  s.score = 4;
  s.food = { c: s.snake[0].c + 1, r: s.snake[0].r };
  if (portalAt(s.portals, s.food.c, s.food.r)) {
    s.food = { c: s.snake[0].c, r: s.snake[0].r - 1 };
    s.dir = 'up';
  }
  if (portalAt(s.portals, s.food.c, s.food.r)) throw new Error('could not place eat cell off portals');
  step(s, function () { return 0.82; });
  if (s.score !== 5) throw new Error('chaos fifth food');
  if (!s.shuffled) throw new Error('乱门 reshuffles every 5 foods');
  sig2 = portalSig(s.portals);
  if (sig2 === sig) throw new Error('乱门 portal positions should change');
  if (s.food && portalAt(s.portals, s.food.c, s.food.r)) throw new Error('food after shuffle on portal');
  for (i = 0; i < s.snake.length; i++) {
    if (portalAt(s.portals, s.snake[i].c, s.snake[i].r)) throw new Error('reshuffle on snake');
  }

  seen = {};
  for (i = 0; i < 50; i++) {
    s = freshState('classic', function () { return Math.random(); });
    if (!s.food) throw new Error('food required at start');
    seen[s.food.c + ',' + s.food.r] = 1;
    if (bodyIndex(s.snake, s.food.c, s.food.r) !== -1) throw new Error('start food overlap snake');
    if (portalAt(s.portals, s.food.c, s.food.r)) throw new Error('start food overlap portal');
  }

  for (i = 0; i < 24; i++) {
    s = freshState('chaos', Math.random);
    if (s.portals.length < 2) throw new Error('chaos pair count');
    if (portalAt(s.portals, midC() + 1, midR()) || portalAt(s.portals, midC() + 2, midR())) {
      throw new Error('chaos portal on opening runway');
    }
    if (s.food && portalAt(s.portals, s.food.c, s.food.r)) throw new Error('chaos food on portal');
  }

  if (intervalFor(0) !== BASE_MS) throw new Error('start interval');
  if (intervalFor(5) !== BASE_MS - SPEED_STEP) throw new Error('speed every 5 foods');
  if (intervalFor(99) !== FLOOR_MS) throw new Error('stay at floor');
  if (foodsUntilShuffle(0) !== 5) throw new Error('five foods to first shuffle');
  if (foodsUntilShuffle(7) !== 3) throw new Error('countdown 3');

  s = freshState('classic', function () { return 0; });
  s.alive = false;
  queueTurn(s, 'up');
  if (s.pending) throw new Error('no turns while dead');

  if (COLS !== 16 || ROWS !== 16) throw new Error('grid 16×16');
  k = classicPortals();
  for (i = 0; i < k.length; i++) {
    if (!inBounds(k[i].a.c, k[i].a.r) || !inBounds(k[i].b.c, k[i].b.r)) {
      throw new Error('classic portals in bounds');
    }
    hitP = bodyIndex(startSnake(), k[i].a.c, k[i].a.r);
    if (hitP !== -1) throw new Error('classic portal on start snake');
    hitP = bodyIndex(startSnake(), k[i].b.c, k[i].b.r);
    if (hitP !== -1) throw new Error('classic portal on start snake b');
  }

  s = freshState('classic', function () { return 0; });
  s.food = { c: s.snake[0].c + 1, r: s.snake[0].r };
  if (portalAt(s.portals, s.food.c, s.food.r)) throw new Error('test food on portal');
  ad = chooseAutoDir(s);
  if (ad !== 'right') throw new Error('auto eats food in front');

  s = freshState('classic', function () { return 0; });
  s.snake = [{ c: 0, r: 8 }, { c: 0, r: 9 }, { c: 0, r: 10 }];
  s.prev = copySnake(s.snake);
  s.dir = 'up';
  s.food = { c: COLS - 1, r: 8 };
  s.portals = [];
  fp = findPath(s.snake, COLS - 1, 8, true, s.portals);
  if (!fp || !fp.length) throw new Error('path across board');
  if (fp[0].c < 0 || fp[0].c >= COLS || fp[0].r < 0 || fp[0].r >= ROWS) {
    throw new Error('path left the board');
  }
  if (fp[0].c === COLS - 1) throw new Error('path wrapped through the wall');
  ad = chooseAutoDir(s);
  if (ad === 'left') throw new Error('auto must not wrap through left wall');
  if (ad !== 'right') throw new Error('auto should run along the row to food');

  s = freshState('classic', function () { return 0; });
  s.snake = [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 2, r: 0 }];
  s.prev = copySnake(s.snake);
  s.dir = 'left';
  s.food = { c: 0, r: 10 };
  s.portals = [];
  ad = chooseAutoDir(s);
  if (ad === 'left' || ad === 'up') throw new Error('auto must not hit corner walls');
  if (ad === 'right') throw new Error('auto 180 into neck');
  if (ad !== 'down') throw new Error('corner only has down');

  s = freshState('classic', function () { return 0; });
  s.snake = [{ c: 4, r: 5 }, { c: 3, r: 5 }, { c: 2, r: 5 }];
  s.prev = copySnake(s.snake);
  s.dir = 'right';
  s.portals = [{ id: 'A', fill: '#ff3db8', glow: '#f', a: { c: 5, r: 5 }, b: { c: 10, r: 10 } }];
  s.food = { c: 10, r: 9 };
  fp = findPath(s.snake, 10, 9, true, s.portals);
  if (!fp || !fp.length) throw new Error('path should use portal');
  if (fp[0].c !== 10 || fp[0].r !== 10) throw new Error('first hop should exit A2');
  ad = chooseAutoDir(s);
  if (ad !== 'right') throw new Error('auto should take portal to food');
  queueTurn(s, ad);
  step(s);
  if (!s.alive || !s.warped) throw new Error('auto warped through open gate');
  if (s.snake[0].c !== 10 || s.snake[0].r !== 10) throw new Error('auto landed on A2');
  if (s.dir !== 'right') throw new Error('auto kept heading after gate');
  ad = chooseAutoDir(s);
  if (ad !== 'up') throw new Error('auto after warp toward food');

  s = freshState('classic', function () { return 0; });
  s.snake = [{ c: 4, r: 5 }, { c: 3, r: 5 }, { c: 10, r: 10 }, { c: 10, r: 11 }];
  s.prev = copySnake(s.snake);
  s.dir = 'right';
  s.portals = [{ id: 'A', fill: '#ff3db8', glow: '#f', a: { c: 5, r: 5 }, b: { c: 10, r: 10 } }];
  s.food = { c: 10, r: 9 };
  land = landAfter(s.snake, s.food, s.portals, 5, 5);
  if (land) throw new Error('blocked portal exit is not a land');
  ad = chooseAutoDir(s);
  if (ad === 'right') throw new Error('auto must not enter blocked portal');

  s = freshState('classic', function () { return 0; });
  s.dir = 'right';
  for (i = 0; i < 30; i++) {
    ad = chooseAutoDir(s);
    if (ad === OPP[s.dir]) throw new Error('auto never reverse 180');
    if (ad) {
      land = landAfter(
        s.snake,
        s.food,
        s.portals,
        s.snake[0].c + DIRS[ad].c,
        s.snake[0].r + DIRS[ad].r
      );
      if (!land) throw new Error('auto picked an unsafe opening cell');
      queueTurn(s, ad);
    }
    hc = s.snake[0].c;
    hr = s.snake[0].r;
    step(s);
    if (!s.alive) throw new Error('auto should live the opening');
    dist = Math.abs(s.snake[0].c - hc) + Math.abs(s.snake[0].r - hr);
    if (dist !== 1 && !autoWarped(hc, hr, s.dir, s.snake[0].c, s.snake[0].r, s.portals)) {
      throw new Error('auto head moves one cell or through a gate');
    }
  }

  autoFails = 0;
  for (ag = 0; ag < 4; ag++) {
    autoState = freshState('classic', Math.random);
    autoTicks = 0;
    while (autoState.alive && !autoState.won && autoTicks < 2500 && autoState.score < 20) {
      hc = autoState.snake[0].c;
      hr = autoState.snake[0].r;
      ad = chooseAutoDir(autoState);
      if (ad === OPP[autoState.dir]) throw new Error('auto 180 during play');
      if (ad && !isSafeMove(
        autoState.snake,
        autoState.food,
        autoState.portals,
        autoState.snake[0].c + DIRS[ad].c,
        autoState.snake[0].r + DIRS[ad].r
      )) throw new Error('auto picked an unsafe cell');
      if (ad) queueTurn(autoState, ad);
      step(autoState);
      autoTicks++;
      if (autoState.alive) {
        dist = Math.abs(autoState.snake[0].c - hc) + Math.abs(autoState.snake[0].r - hr);
        if (dist !== 1 && !autoWarped(hc, hr, autoState.dir, autoState.snake[0].c, autoState.snake[0].r, autoState.portals)) {
          throw new Error('auto tunneled or wrapped');
        }
      }
    }
    if (!autoState.won && autoState.score < 20) autoFails += 1;
  }
  if (autoFails > 1) throw new Error('auto should routinely score 20+');

  autoState = freshState('chaos', Math.random);
  autoTicks = 0;
  while (autoState.alive && !autoState.won && autoTicks < 800) {
    hc = autoState.snake[0].c;
    hr = autoState.snake[0].r;
    ad = chooseAutoDir(autoState);
    if (ad === OPP[autoState.dir]) throw new Error('auto 180 in 乱门');
    if (ad && !isSafeMove(
      autoState.snake,
      autoState.food,
      autoState.portals,
      autoState.snake[0].c + DIRS[ad].c,
      autoState.snake[0].r + DIRS[ad].r
    )) throw new Error('auto picked an unsafe 乱门 cell');
    if (ad) queueTurn(autoState, ad);
    step(autoState, Math.random);
    autoTicks++;
    if (autoState.alive) {
      dist = Math.abs(autoState.snake[0].c - hc) + Math.abs(autoState.snake[0].r - hr);
      if (dist !== 1 && !autoWarped(hc, hr, autoState.dir, autoState.snake[0].c, autoState.snake[0].r, autoState.portals)) {
        throw new Error('乱门 auto tunneled or wrapped');
      }
    }
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
  warp: function () { beep(220, 0.07, 0.045, 'sine', 740); },
  shuffle: function () {
    beep(392, 0.08, 0.05, 'square', 523);
    setTimeout(function () { beep(523, 0.1, 0.05, 'square', 784); }, 70);
  },
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
var ovOps = document.getElementById('ov-ops');
var ovRetry = document.getElementById('ov-retry');
var ovClassic = document.getElementById('ov-classic');
var ovChaos = document.getElementById('ov-chaos');
var scoreEl = document.getElementById('score');
var bestEl = document.getElementById('best');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var gateBox = document.getElementById('gate-box');
var gateNum = document.getElementById('gate-num');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnMode = document.getElementById('btn-mode');
var btnAuto = document.getElementById('btn-auto');
var speedEl = document.getElementById('speed');
var speedLab = document.getElementById('speed-lab');
var toastEl = document.getElementById('toast');
var hintEl = document.getElementById('hint');
var ctx = canvas.getContext('2d');
var motionQ = window.matchMedia('(prefers-reduced-motion: reduce)');

var best = loadBest();
var autoOn = false;
var autoSpeed = loadAutoSpeed();
var playMode = 'classic';
var state = freshState('classic', Math.random);
var acc = 0;
var lastTs = 0;
var overlayMode = 'title';
var dpr = 1;
var cssW = 0;
var cssH = 0;
var headPopUntil = 0;
var foodPopUntil = 0;
var eatFlashUntil = 0;
var warpFlashUntil = 0;
var toastUntil = 0;
var toastTimer = 0;

function reduceMotion() {
  return motionQ.matches;
}

function overlayOpen() {
  return overlayMode !== null;
}

function playing() {
  return state.alive && !state.won && overlayMode === null;
}

function tickInterval() {
  if (autoOn) return AUTO_MS[autoSpeed] || AUTO_MS[3];
  return state.tickMs;
}

function autoSnap() {
  return autoOn && autoSpeed === 4;
}

function syncAutoUI() {
  btnAuto.classList.toggle('on', autoOn);
  btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
  btnAuto.setAttribute('aria-label', autoOn ? '关闭自动' : '自动');
  speedEl.value = String(autoSpeed);
  speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
  speedLab.textContent = SPEED_LABELS[autoSpeed];
}

function setAutoSpeed(n) {
  n = n | 0;
  if (n < 1) n = 1;
  if (n > 4) n = 4;
  autoSpeed = n;
  acc = 0;
  saveAutoSpeed(autoSpeed);
  syncAutoUI();
}

function toggleAuto() {
  autoOn = !autoOn;
  acc = 0;
  syncAutoUI();
  if (autoOn && !muted) audioCtx();
  if (!overlayOpen()) canvas.focus({ preventScroll: true });
}

function hideOverlay() {
  overlayMode = null;
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  canvas.focus({ preventScroll: true });
}

var TITLE_LEAD = '钻门换边，撞墙仍死。<br>同色霓虹门成对，钻进去从另一扇出来，朝向不变。<br>出口被身子占着就死。';

function showOverlay(mode, title, lead) {
  overlayMode = mode;
  ovTitle.textContent = title;
  if (mode === 'title') ovLead.innerHTML = TITLE_LEAD;
  else ovLead.textContent = lead;
  panelEl.className = 'panel ' + mode;
  var isTitle = mode === 'title';
  ovClassic.hidden = !isTitle;
  ovChaos.hidden = !isTitle;
  ovRetry.hidden = isTitle;
  ovOps.hidden = !isTitle;
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  if (isTitle) ovClassic.focus();
  else ovRetry.focus();
}

function modeLabel() {
  return playMode === 'chaos' ? '乱门' : '经典';
}

function syncModeUI() {
  btnMode.textContent = modeLabel();
  btnMode.classList.toggle('chaos', playMode === 'chaos');
  btnMode.setAttribute('aria-label', '模式 ' + modeLabel());
  gateBox.hidden = playMode !== 'chaos';
  hintEl.textContent = playMode === 'chaos'
    ? '乱门：每吃五颗，门会换位。墙是实心的。A 自动。'
    : '钻进同色门，从另一扇出来。墙是实心的，不会穿到对侧。A 自动。';
}

function updateScoreUI(gained) {
  scoreEl.textContent = String(state.score);
  bestEl.textContent = String(best);
  gateNum.textContent = String(foodsUntilShuffle(state.score));
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

function showToast(msg, now) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  toastUntil = now + 900;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toastEl.classList.add('hidden');
  }, 900);
}

function deathLead() {
  var n = state.score;
  if (state.death === 'gate') return '门后那格被身子堵住了。本局 ' + n + ' 分。';
  if (state.death === 'self') return '咬到自己了。本局 ' + n + ' 分。';
  return '墙是实心的，不会穿到对侧。本局 ' + n + ' 分。';
}

function dieFx() {
  sfx.die();
  if (!reduceMotion()) {
    stageEl.classList.remove('die');
    void stageEl.offsetWidth;
    stageEl.classList.add('die');
  }
  persistBest();
  showOverlay('lose', '撞上了', deathLead());
}

function winFx() {
  sfx.win();
  persistBest();
  showOverlay('win', '盘满了', '格子全占满了。本局 ' + state.score + ' 分。');
}

function newGame(mode) {
  if (mode === 'chaos' || mode === 'classic') playMode = mode;
  state = freshState(playMode, Math.random);
  acc = 0;
  lastTs = performance.now();
  if (autoSnap()) {
    headPopUntil = 0;
    foodPopUntil = 0;
  } else {
    headPopUntil = lastTs + 180;
    foodPopUntil = lastTs + 220;
  }
  eatFlashUntil = 0;
  warpFlashUntil = 0;
  stageEl.classList.remove('die');
  scoreAdd.hidden = true;
  syncModeUI();
  updateScoreUI(0);
  hideOverlay();
  if (!muted) audioCtx();
  canvas.focus({ preventScroll: true });
}

function applyTick(now) {
  if (autoOn) {
    var ad = chooseAutoDir(state);
    if (ad) queueTurn(state, ad);
  }
  var before = state.score;
  var wasAlive = state.alive;
  step(state, Math.random);
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
  if (autoSnap() || reduceMotion()) {
    headPopUntil = 0;
  } else {
    headPopUntil = now + Math.min(160, tickInterval() * 0.9);
  }
  if (state.warped) {
    warpFlashUntil = now + 220;
    sfx.warp();
  }
  if (state.shuffled) {
    showToast('门换了', now);
    sfx.shuffle();
    updateScoreUI(0);
  }
  if (state.score > before) {
    if (!autoSnap() && !reduceMotion()) {
      eatFlashUntil = now + 180;
      foodPopUntil = now + 240;
    }
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
  if (!from || manh(from, to) > 1) return { c: to.c, r: to.r };
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

function drawGrid(L) {
  var c, r, x, y;
  ctx.save();
  ctx.translate(L.ox, L.oy);
  ctx.fillStyle = '#071414';
  ctx.fillRect(0, 0, L.gw, L.gh);

  ctx.fillStyle = 'rgba(61,255,176,0.04)';
  for (r = 0; r < ROWS; r++) {
    for (c = 0; c < COLS; c++) {
      if ((c + r) % 2 === 0) ctx.fillRect(c * L.cell, r * L.cell, L.cell, L.cell);
    }
  }

  ctx.strokeStyle = 'rgba(61,255,176,0.06)';
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
    : 'rgba(61,255,176,0.4)';
  ctx.lineWidth = 1.4;
  roundRect(L.ox - m * 0.55, L.oy - m * 0.55, L.gw + m * 1.1, L.gh + m * 1.1, 10);
  ctx.stroke();
  ctx.restore();
}

function hueAt(i, n) {
  return 150 + (188 - 150) * (n <= 1 ? 0 : i / (n - 1));
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
  ctx.shadowColor = 'rgba(61,255,176,0.55)';
  ctx.shadowBlur = L.cell * 0.45;

  ctx.shadowBlur = L.cell * 0.25;
  for (i = n - 1; i >= 1; i--) {
    var a = pts[i];
    var b = pts[i - 1];
    if (!adjacent(a, b)) continue;
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
    var ht = 1 - (headPopUntil - now) / Math.max(1, Math.min(160, tickInterval() * 0.9));
    hp = 1 + 0.14 * Math.sin(clamp(ht, 0, 1) * Math.PI);
  }
  if (eatFlashUntil > now && !reduceMotion()) hp *= 1.06;
  var hr = radius * 1.12 * hp;
  ctx.shadowColor = '#3dffb0';
  ctx.shadowBlur = L.cell * 0.55;
  var hd = ctx.createRadialGradient(hx - hr * 0.25, hy - hr * 0.3, hr * 0.12, hx, hy, hr);
  hd.addColorStop(0, '#e8fff8');
  hd.addColorStop(0.35, '#3dffb0');
  hd.addColorStop(1, '#0a8f6a');
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

function drawGate(L, now, cell, pair, letter) {
  var cx = L.ox + (cell.c + 0.5) * L.cell;
  var cy = L.oy + (cell.r + 0.5) * L.cell;
  var pulse = 1;
  if (!reduceMotion()) pulse = 1 + 0.08 * Math.sin(now / 160 + cell.c);
  if (now < warpFlashUntil && !reduceMotion()) {
    pulse *= 1 + 0.18 * ((warpFlashUntil - now) / 220);
  }
  var rad = L.cell * 0.38 * pulse;
  ctx.save();
  ctx.shadowColor = pair.fill;
  ctx.shadowBlur = L.cell * 0.7;
  ctx.strokeStyle = pair.fill;
  ctx.lineWidth = Math.max(2, L.cell * 0.11);
  ctx.beginPath();
  ctx.arc(cx, cy, rad, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = L.cell * 0.25;
  ctx.strokeStyle = pair.glow;
  ctx.lineWidth = Math.max(1, L.cell * 0.04);
  ctx.beginPath();
  ctx.arc(cx, cy, rad * 0.58, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(5,3,12,0.35)';
  ctx.beginPath();
  ctx.arc(cx, cy, rad * 0.46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = pair.glow;
  ctx.font = '700 ' + Math.max(9, L.cell * 0.32) + 'px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = 0.92;
  ctx.fillText(letter, cx, cy + 0.5);
  ctx.restore();
}

function drawPortals(L, now) {
  var i, p;
  for (i = 0; i < state.portals.length; i++) {
    p = state.portals[i];
    drawGate(L, now, p.a, p, p.id);
    drawGate(L, now, p.b, p, p.id);
  }
}

function render(now) {
  resize();
  if (cssW < 8) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  var L = cellLayout();
  var t = 1;
  if (playing() && !reduceMotion() && !autoSnap()) {
    t = clamp(acc / Math.max(1, tickInterval()), 0, 1);
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
  drawPortals(L, now);
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
    if (autoSnap()) {
      acc += dt;
      if (acc >= AUTO_MS[4]) {
        acc = 0;
        applyTick(now);
      }
    } else {
      var interval = tickInterval();
      acc += dt;
      var guard = 0;
      while (acc >= interval && playing() && guard < 5) {
        acc -= interval;
        guard += 1;
        applyTick(now);
      }
      if (!playing()) acc = 0;
    }
  }
  if (toastUntil && now > toastUntil) {
    toastEl.classList.add('hidden');
    toastUntil = 0;
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
  if (!d || overlayOpen() || autoOn) return;
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
  if (key === 'a' || key === 'A' || code === 'KeyA') {
    e.preventDefault();
    if (e.repeat) return;
    toggleAuto();
    return;
  }
  if (key === 'r' || key === 'R' || code === 'KeyR') {
    e.preventDefault();
    newGame(playMode);
    return;
  }
  if (e.target && (e.target === speedEl || e.target.tagName === 'INPUT')) return;
  var dir = KEY_DIR[key] || KEY_DIR[code];
  if (dir) {
    e.preventDefault();
    if (e.repeat) return;
    onDir(dir);
  }
});

btnMute.addEventListener('click', toggleMute);
btnAuto.addEventListener('click', function () { toggleAuto(); });
speedEl.addEventListener('input', function () {
  setAutoSpeed(parseInt(speedEl.value, 10));
});
btnRetry.addEventListener('click', function () { newGame(playMode); });
ovRetry.addEventListener('click', function () { newGame(playMode); });
ovClassic.addEventListener('click', function () { newGame('classic'); });
ovChaos.addEventListener('click', function () { newGame('chaos'); });
btnMode.addEventListener('click', function () {
  newGame(playMode === 'chaos' ? 'classic' : 'chaos');
});

stageEl.addEventListener('pointerdown', function () {
  if (!overlayOpen()) canvas.focus({ preventScroll: true });
});

stageEl.addEventListener('animationend', function () {
  stageEl.classList.remove('die');
});

window.addEventListener('resize', function () { resize(); });
if (motionQ.addEventListener) motionQ.addEventListener('change', function () { /* snap next frame */ });

bestEl.textContent = String(best);
syncAutoUI();
syncModeUI();
updateScoreUI(0);
showOverlay('title', '门蛇', '');
requestAnimationFrame(frame);

}
