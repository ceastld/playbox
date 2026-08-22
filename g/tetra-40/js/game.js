'use strict';

/* 四十行 sprint + 马拉松. 10×20 well, 7-bag, SRS, lock delay, DAS. Optional autoplay. */

var COLS = 10;
var VISIBLE = 20;
var HIDDEN = 2;
var ROWS = VISIBLE + HIDDEN;
var SPAWN_X = 3;
var LOCK_MS = 500;
var LOCK_RESETS = 15;
var DAS_MS = 167;
var ARR_MS = 33;
var SOFT_MS = 33;
var GRAVITY_FLOOR_MS = 50;
var SPRINT_LINES = 40;
var LINE_PTS = [0, 100, 300, 500, 800];
var BEST_KEY = 'playbox-tetra-40-best';
var MARATHON_BEST_KEY = 'playbox-tetra-40-marathon-best';
var MODE_KEY = 'playbox-tetra-40-mode';
var AUTO_SPEED_KEY = 'playbox-tetra-40-auto-speed';
var SPEED_LABELS = ['', '慢', '中', '快', '极快'];
var PIECE_IDS = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

/* SRS cells. Origin is the 4×4 (I,O) or 3×3 (others) box. y grows down. */
var SHAPES = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]]
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]]
  ],
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]]
  ],
  O: [
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]]
  ],
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]]
  ],
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]]
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]]
  ]
};

/* Wiki SRS kicks with Y flipped (our +y is down). */
var KICK_JLSTZ = {
  '0>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '1>0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '1>2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '3>2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '3>0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '0>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]]
};

var KICK_I = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]]
};

var PALETTE = {
  I: { fill: '#2de8f0', hi: '#c8ffff', lo: '#0a6e7a', glow: 'rgba(0,240,255,0.55)' },
  O: { fill: '#ffe36b', hi: '#fff6c8', lo: '#a87814', glow: 'rgba(255,227,107,0.5)' },
  T: { fill: '#e14cff', hi: '#f0c4ff', lo: '#6e1498', glow: 'rgba(225,76,255,0.55)' },
  S: { fill: '#3dff88', hi: '#c8ffdc', lo: '#0c7a44', glow: 'rgba(61,255,136,0.5)' },
  Z: { fill: '#ff3db8', hi: '#ffb8e4', lo: '#8e145c', glow: 'rgba(255,61,184,0.55)' },
  J: { fill: '#4d8aff', hi: '#c4daff', lo: '#163a8e', glow: 'rgba(77,138,255,0.5)' },
  L: { fill: '#ff9a3d', hi: '#ffd4a8', lo: '#a05410', glow: 'rgba(255,154,61,0.5)' }
};

function emptyMatrix() {
  var m = [];
  var r, c, row;
  for (r = 0; r < ROWS; r++) {
    row = [];
    for (c = 0; c < COLS; c++) row.push(0);
    m.push(row);
  }
  return m;
}

function copyMatrix(src) {
  var m = [];
  var r;
  for (r = 0; r < src.length; r++) m.push(src[r].slice());
  return m;
}

function cellsOf(type, rot, x, y) {
  var shape = SHAPES[type][rot];
  var out = [];
  var i;
  for (i = 0; i < 4; i++) out.push({ c: x + shape[i][0], r: y + shape[i][1] });
  return out;
}

function collides(matrix, type, rot, x, y) {
  var cells = cellsOf(type, rot, x, y);
  var i, c, r;
  for (i = 0; i < cells.length; i++) {
    c = cells[i].c;
    r = cells[i].r;
    if (c < 0 || c >= COLS || r >= ROWS || r < 0) return true;
    if (matrix[r][c]) return true;
  }
  return false;
}

function kicksFor(type, from, to) {
  if (type === 'O') return [[0, 0]];
  var table = type === 'I' ? KICK_I : KICK_JLSTZ;
  return table[from + '>' + to] || [[0, 0]];
}

function tryRotate(matrix, piece, dir) {
  var from = piece.rot;
  var to = (from + dir + 4) % 4;
  var kicks = kicksFor(piece.type, from, to);
  var i, nx, ny;
  for (i = 0; i < kicks.length; i++) {
    nx = piece.x + kicks[i][0];
    ny = piece.y + kicks[i][1];
    if (!collides(matrix, piece.type, to, nx, ny)) {
      return { x: nx, y: ny, rot: to, kick: i };
    }
  }
  return null;
}

function ghostY(matrix, piece) {
  var y = piece.y;
  while (!collides(matrix, piece.type, piece.rot, piece.x, y + 1)) y += 1;
  return y;
}

function lockTo(matrix, piece) {
  var next = copyMatrix(matrix);
  var cells = cellsOf(piece.type, piece.rot, piece.x, piece.y);
  var i, c, r;
  for (i = 0; i < cells.length; i++) {
    c = cells[i].c;
    r = cells[i].r;
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) next[r][c] = piece.type;
  }
  return next;
}

function findFullRows(matrix) {
  var rows = [];
  var r, c, full;
  for (r = 0; r < ROWS; r++) {
    full = true;
    for (c = 0; c < COLS; c++) {
      if (!matrix[r][c]) {
        full = false;
        break;
      }
    }
    if (full) rows.push(r);
  }
  return rows;
}

function clearRows(matrix, rows) {
  if (!rows || !rows.length) return copyMatrix(matrix);
  var drop = {};
  var i, r, c, next, empty;
  for (i = 0; i < rows.length; i++) drop[rows[i]] = 1;
  next = [];
  for (r = 0; r < matrix.length; r++) {
    if (!drop[r]) next.push(matrix[r].slice());
  }
  while (next.length < ROWS) {
    empty = [];
    for (c = 0; c < COLS; c++) empty.push(0);
    next.unshift(empty);
  }
  return next;
}

function shuffleSeven(rand) {
  var ids = PIECE_IDS.slice();
  var i, j, t;
  for (i = ids.length - 1; i > 0; i--) {
    j = Math.floor(rand() * (i + 1));
    if (j < 0) j = 0;
    if (j > i) j = i;
    t = ids[i];
    ids[i] = ids[j];
    ids[j] = t;
  }
  return ids;
}

function fillBag(queue, rand) {
  var bag, i;
  while (queue.length < 7) {
    bag = shuffleSeven(rand);
    for (i = 0; i < bag.length; i++) queue.push(bag[i]);
  }
  return queue;
}

function gravityMs(level) {
  var table = [
    800, 800, 720, 630, 550, 470, 380, 300, 220, 150, 100,
    80, 68, 58, 50, 50, 50, 50, 50, 50, 50
  ];
  var lv = level < 1 ? 1 : level;
  if (lv >= table.length) return GRAVITY_FLOOR_MS;
  var ms = table[lv];
  return ms < GRAVITY_FLOOR_MS ? GRAVITY_FLOOR_MS : ms;
}

function spawnPiece(matrix, type) {
  if (collides(matrix, type, 0, SPAWN_X, 0)) return null;
  var p = { type: type, rot: 0, x: SPAWN_X, y: 0 };
  var cells, i, allVisible;
  while (!collides(matrix, type, 0, SPAWN_X, p.y + 1)) {
    cells = cellsOf(type, 0, SPAWN_X, p.y);
    allVisible = true;
    for (i = 0; i < cells.length; i++) {
      if (cells[i].r < HIDDEN) {
        allVisible = false;
        break;
      }
    }
    if (allVisible) break;
    p.y += 1;
  }
  return p;
}

function uniqueSorted(arr) {
  var copy = arr.slice().sort();
  var i;
  for (i = 1; i < copy.length; i++) {
    if (copy[i] === copy[i - 1]) return false;
  }
  return copy.length === 7;
}

function bbox(cells) {
  var i, minC = 99, maxC = -99, minR = 99, maxR = -99;
  for (i = 0; i < cells.length; i++) {
    if (cells[i].c < minC) minC = cells[i].c;
    if (cells[i].c > maxC) maxC = cells[i].c;
    if (cells[i].r < minR) minR = cells[i].r;
    if (cells[i].r > maxR) maxR = cells[i].r;
  }
  return { w: maxC - minC + 1, h: maxR - minR + 1, minC: minC, minR: minR, maxC: maxC, maxR: maxR };
}

function cellKey(cells) {
  var keys = [];
  var i;
  for (i = 0; i < cells.length; i++) keys.push(cells[i].c + ':' + cells[i].r);
  keys.sort();
  return keys.join('|');
}

function pad2(n) {
  return n < 10 ? '0' + n : String(n);
}

function pad3(n) {
  var s = String(n);
  while (s.length < 3) s = '0' + s;
  return s;
}

function formatTime(ms) {
  if (ms == null || !isFinite(ms) || ms < 0) return '—';
  var t = Math.floor(ms);
  var m = Math.floor(t / 60000);
  var s = Math.floor((t % 60000) / 1000);
  var c = t % 1000;
  if (m <= 0) return s + '.' + pad3(c);
  return m + ':' + pad2(s) + '.' + pad3(c);
}

function remainOf(cleared) {
  var n = SPRINT_LINES - cleared;
  return n < 0 ? 0 : n;
}

function lineScore(n, level) {
  var k = n < 0 ? 0 : (n > 4 ? 4 : n);
  var lv = level < 1 ? 1 : level;
  return LINE_PTS[k] * lv;
}

/* Autoplay board metrics. Holes = empty cells with a filled cell above. */
function colHeights(matrix) {
  var h = [];
  var c, r, top;
  for (c = 0; c < COLS; c++) {
    top = 0;
    for (r = 0; r < ROWS; r++) {
      if (matrix[r][c]) {
        top = ROWS - r;
        break;
      }
    }
    h.push(top);
  }
  return h;
}

function countHoles(matrix) {
  var holes = 0;
  var c, r, seen;
  for (c = 0; c < COLS; c++) {
    seen = false;
    for (r = 0; r < ROWS; r++) {
      if (matrix[r][c]) seen = true;
      else if (seen) holes += 1;
    }
  }
  return holes;
}

function bumpinessOf(h) {
  var n = 0;
  var i;
  for (i = 0; i < h.length - 1; i++) n += Math.abs(h[i] - h[i + 1]);
  return n;
}

function sumHeights(h) {
  var n = 0;
  var i;
  for (i = 0; i < h.length; i++) n += h[i];
  return n;
}

/* Extra reward on top of the height drop from clearing. 2–4 lines pay more. */
var LINE_REWARD = [0, 16, 52, 120, 220];

function evalStack(matrix) {
  var h = colHeights(matrix);
  return -countHoles(matrix) * 96 - sumHeights(h) * 6 - bumpinessOf(h) * 4;
}

function evalPlacement(matrix, cleared) {
  var n = cleared < 0 ? 0 : (cleared > 4 ? 4 : cleared);
  return evalStack(matrix) + LINE_REWARD[n];
}

function dropLockClear(matrix, type, x, y, rot) {
  var gy = ghostY(matrix, { type: type, rot: rot, x: x, y: y });
  var locked = lockTo(matrix, { type: type, rot: rot, x: x, y: gy });
  var full = findFullRows(locked);
  var n = full.length;
  return { matrix: n ? clearRows(locked, full) : locked, lines: n };
}

function poseKey(x, y, rot) {
  return ((y + 2) * 16 + (x + 4)) * 4 + rot;
}

/*
 * Legal poses reachable by slide + SRS rotate only (no gravity tucks).
 * Path actions: -1 left, 1 right, 2 CW, -2 CCW.
 */
function legalDrops(matrix, piece) {
  var type = piece.type;
  var nodes = [{ x: piece.x, y: piece.y, rot: piece.rot, prev: -1, act: 0 }];
  var seen = {};
  var first = {};
  var qi = 0;
  var s, hit, k, id;
  seen[poseKey(piece.x, piece.y, piece.rot)] = 1;

  function push(x, y, rot, prev, act) {
    if (collides(matrix, type, rot, x, y)) return;
    k = poseKey(x, y, rot);
    if (seen[k]) return;
    seen[k] = 1;
    nodes.push({ x: x, y: y, rot: rot, prev: prev, act: act });
  }

  while (qi < nodes.length) {
    s = nodes[qi];
    id = (s.x + 8) * 4 + s.rot;
    if (first[id] === undefined) first[id] = qi;
    push(s.x - 1, s.y, s.rot, qi, -1);
    push(s.x + 1, s.y, s.rot, qi, 1);
    hit = tryRotate(matrix, { type: type, rot: s.rot, x: s.x, y: s.y }, 1);
    if (hit) push(hit.x, hit.y, hit.rot, qi, 2);
    hit = tryRotate(matrix, { type: type, rot: s.rot, x: s.x, y: s.y }, -1);
    if (hit) push(hit.x, hit.y, hit.rot, qi, -2);
    qi += 1;
  }

  var out = [];
  for (id in first) {
    if (!Object.prototype.hasOwnProperty.call(first, id)) continue;
    s = nodes[first[id]];
    out.push({ x: s.x, y: s.y, rot: s.rot, node: first[id], nodes: nodes });
  }
  return out;
}

function reconstructPath(nodes, idx) {
  var acts = [];
  while (idx > 0 && nodes[idx].prev >= 0) {
    acts.push(nodes[idx].act);
    idx = nodes[idx].prev;
  }
  acts.reverse();
  return acts;
}

/*
 * Pick a drop for `piece`. Optional 2-ply with `nextType`.
 * Tie-break: lower x, then lower rot.
 */
function bestPlacement(matrix, piece, nextType) {
  var opts = legalDrops(matrix, piece);
  var i, j, m, after, score, spawned, nopts, nm, after2, ns, bestN;
  var best = null;
  var bestScore = -1e15;
  var lines;

  for (i = 0; i < opts.length; i++) {
    m = opts[i];
    after = dropLockClear(matrix, piece.type, m.x, m.y, m.rot);
    lines = after.lines > 4 ? 4 : after.lines;
    if (nextType) {
      spawned = spawnPiece(after.matrix, nextType);
      if (!spawned) {
        score = evalPlacement(after.matrix, after.lines) - 1000000;
      } else {
        nopts = legalDrops(after.matrix, spawned);
        bestN = -1e15;
        for (j = 0; j < nopts.length; j++) {
          nm = nopts[j];
          after2 = dropLockClear(after.matrix, nextType, nm.x, nm.y, nm.rot);
          ns = evalPlacement(after2.matrix, after2.lines);
          if (ns > bestN) bestN = ns;
        }
        score = bestN + LINE_REWARD[lines];
      }
    } else {
      score = evalPlacement(after.matrix, after.lines);
    }
    if (
      !best ||
      score > bestScore ||
      (score === bestScore && (m.x < best.x || (m.x === best.x && m.rot < best.rot)))
    ) {
      bestScore = score;
      best = m;
    }
  }
  if (!best) return null;
  best.path = reconstructPath(best.nodes, best.node);
  best.score = bestScore;
  return best;
}

function lcgRand(seed) {
  var s = seed >>> 0;
  if (!s) s = 1;
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function playAutoN(n, seed) {
  var rand = lcgRand(seed);
  var m = emptyMatrix();
  var q = [];
  var lines = 0;
  var placed = 0;
  var i, type, p, pick, after;
  fillBag(q, rand);
  for (i = 0; i < n; i++) {
    fillBag(q, rand);
    type = q.shift();
    fillBag(q, rand);
    p = spawnPiece(m, type);
    if (!p) break;
    pick = bestPlacement(m, p, q[0]);
    if (!pick) break;
    after = dropLockClear(m, type, pick.x, pick.y, pick.rot);
    m = after.matrix;
    lines += after.lines;
    placed += 1;
  }
  return { alive: placed, lines: lines, holes: countHoles(m) };
}

function selfCheck() {
  var id, rot, cells, box, m, p, kicked, bag, i, n, cleared, key;

  for (n = 0; n < PIECE_IDS.length; n++) {
    id = PIECE_IDS[n];
    if (!SHAPES[id] || SHAPES[id].length !== 4) throw new Error(id + ' needs 4 rotations');
    for (rot = 0; rot < 4; rot++) {
      if (SHAPES[id][rot].length !== 4) throw new Error(id + ' rot ' + rot + ' is not 4 cells');
      cells = cellsOf(id, rot, 0, 0);
      if (cells.length !== 4) throw new Error(id + ' cells');
    }
  }

  box = bbox(cellsOf('I', 0, 0, 0));
  if (box.w !== 4 || box.h !== 1) throw new Error('I spawn is not a 4-long bar');
  box = bbox(cellsOf('I', 1, 0, 0));
  if (box.w !== 1 || box.h !== 4) throw new Error('I vertical is not 4-long');
  box = bbox(cellsOf('O', 0, 0, 0));
  if (box.w !== 2 || box.h !== 2) throw new Error('O is not 2×2');
  box = bbox(cellsOf('T', 0, 0, 0));
  if (box.w !== 3 || box.h !== 2) throw new Error('T spawn is not a 3×2 T');
  box = bbox(cellsOf('J', 0, 0, 0));
  if (box.w !== 3 || box.h !== 2) throw new Error('J spawn is not 3×2');
  box = bbox(cellsOf('L', 0, 0, 0));
  if (box.w !== 3 || box.h !== 2) throw new Error('L spawn is not 3×2');
  box = bbox(cellsOf('S', 0, 0, 0));
  if (box.w !== 3 || box.h !== 2) throw new Error('S spawn is not 3×2');
  box = bbox(cellsOf('Z', 0, 0, 0));
  if (box.w !== 3 || box.h !== 2) throw new Error('Z spawn is not 3×2');

  key = cellKey(cellsOf('J', 0, 0, 0));
  if (key !== '0:0|0:1|1:1|2:1') throw new Error('J spawn hook must sit on the left');
  key = cellKey(cellsOf('L', 0, 0, 0));
  if (key !== '0:1|1:1|2:0|2:1') throw new Error('L spawn hook must sit on the right');
  key = cellKey(cellsOf('S', 0, 0, 0));
  if (key !== '0:1|1:0|1:1|2:0') throw new Error('S spawn is the right-shifted bump, not Z');
  key = cellKey(cellsOf('Z', 0, 0, 0));
  if (key !== '0:0|1:0|1:1|2:1') throw new Error('Z spawn is the left-shifted bump, not S');
  key = cellKey(cellsOf('T', 0, 0, 0));
  if (key !== '0:1|1:0|1:1|2:1') throw new Error('T spawn stem must point up');
  if (cellKey(cellsOf('S', 0, 0, 0)) === cellKey(cellsOf('Z', 0, 0, 0))) {
    throw new Error('S and Z must not share a spawn shape');
  }
  if (cellKey(cellsOf('J', 0, 0, 0)) === cellKey(cellsOf('L', 0, 0, 0))) {
    throw new Error('J and L must not share a spawn shape');
  }

  bag = shuffleSeven(function () { return 0; });
  if (bag.slice().sort().join('') !== PIECE_IDS.slice().sort().join('')) {
    throw new Error('7-bag identity shuffle lost a piece');
  }
  for (i = 0; i < 24; i++) {
    bag = shuffleSeven(Math.random);
    if (!uniqueSorted(bag)) throw new Error('7-bag must deal each piece once');
  }

  m = emptyMatrix();
  if (collides(m, 'O', 0, SPAWN_X, 0)) throw new Error('O should spawn on empty');
  p = spawnPiece(m, 'I');
  if (!p || p.x !== 3) throw new Error('I spawn x=3');
  for (n = 0; n < PIECE_IDS.length; n++) {
    p = spawnPiece(m, PIECE_IDS[n]);
    if (!p) throw new Error(PIECE_IDS[n] + ' must spawn on empty');
    cells = cellsOf(PIECE_IDS[n], 0, p.x, p.y);
    for (i = 0; i < 4; i++) {
      if (cells[i].r < HIDDEN) throw new Error(PIECE_IDS[n] + ' spawn must show all four minos');
    }
  }
  box = bbox(cellsOf('O', 0, spawnPiece(m, 'O').x, spawnPiece(m, 'O').y));
  if (box.w !== 2 || box.h !== 2) throw new Error('O spawn footprint');
  if (!collides(m, 'T', 0, -1, 4)) throw new Error('T at x=-1 must hit the left wall');
  if (!collides(m, 'I', 0, 7, 10)) throw new Error('I horizontal should clip right wall at x=7');

  p = { type: 'I', rot: 1, x: 7, y: 8 };
  cells = cellsOf('I', 1, 7, 8);
  for (i = 0; i < 4; i++) {
    if (cells[i].c !== 9) throw new Error('I vertical should sit on col 9');
  }
  kicked = tryRotate(m, p, -1);
  if (!kicked) throw new Error('I must kick off the right wall');
  if (collides(m, 'I', kicked.rot, kicked.x, kicked.y)) throw new Error('I kick still collides');

  p = { type: 'I', rot: 1, x: -2, y: 8 };
  cells = cellsOf('I', 1, -2, 8);
  for (i = 0; i < 4; i++) {
    if (cells[i].c !== 0) throw new Error('I vertical should sit on col 0');
  }
  kicked = tryRotate(m, p, -1);
  if (!kicked) throw new Error('I must kick off the left wall');

  p = { type: 'T', rot: 0, x: 0, y: 10 };
  kicked = tryRotate(m, p, 1);
  if (!kicked) throw new Error('T should rotate at the left wall');

  p = { type: 'T', rot: 0, x: 3, y: ROWS - 2 };
  if (tryRotate(m, p, 1) === null) throw new Error('T must floor-kick');
  if (!collides(m, 'T', 1, p.x, p.y)) throw new Error('T CW on floor collides without a kick');
  kicked = tryRotate(m, p, 1);
  if (!kicked || kicked.kick === 0) throw new Error('T floor rotate should use a wall kick');
  if (collides(m, 'T', kicked.rot, kicked.x, kicked.y)) throw new Error('T floor kick still collides');

  p = { type: 'O', rot: 0, x: 4, y: 8 };
  kicked = tryRotate(m, p, 1);
  if (!kicked || kicked.x !== 4 || kicked.y !== 8) throw new Error('O rotate is a no-op');

  m = emptyMatrix();
  for (i = 0; i < COLS; i++) m[21][i] = 'Z';
  cleared = clearRows(m, findFullRows(m));
  if (findFullRows(cleared).length) throw new Error('full bottom row must vanish');
  for (i = 0; i < COLS; i++) {
    if (cleared[21][i]) throw new Error('rows above must fall onto the floor');
  }

  m = emptyMatrix();
  for (i = 0; i < 8; i++) m[20][i] = 'J';
  for (i = 0; i < 8; i++) m[21][i] = 'J';
  m = lockTo(m, { type: 'O', rot: 0, x: 7, y: 20 });
  if (!m[20][8] || !m[21][9]) throw new Error('lock writes minos');
  if (findFullRows(m).length !== 2) throw new Error('O should complete two rows');
  cleared = clearRows(m, findFullRows(m));
  if (findFullRows(cleared).length) throw new Error('double clear leftover');

  m = emptyMatrix();
  m[20][4] = 'T';
  for (i = 0; i < COLS; i++) m[21][i] = 'Z';
  cleared = clearRows(m, findFullRows(m));
  if (cleared[21][4] !== 'T') throw new Error('blocks above a cleared row must fall');
  if (cleared[20][4]) throw new Error('vacated row after fall');

  if (LINE_PTS[1] !== 100 || LINE_PTS[2] !== 300 || LINE_PTS[3] !== 500 || LINE_PTS[4] !== 800) {
    throw new Error('guideline line scores');
  }
  if (lineScore(1, 1) !== 100 || lineScore(4, 3) !== 2400) throw new Error('guideline score × level');
  if (gravityMs(1) !== 800) throw new Error('level 1 gravity');
  if (gravityMs(99) !== GRAVITY_FLOOR_MS) throw new Error('gravity stays at floor');
  if (LOCK_MS !== 500) throw new Error('lock delay is ~500ms');
  if (remainOf(0) !== 40 || remainOf(17) !== 23 || remainOf(40) !== 0 || remainOf(43) !== 0) {
    throw new Error('sprint remaining lines');
  }
  if (formatTime(45123) !== '45.123') throw new Error('format under a minute');
  if (formatTime(65123) !== '1:05.123') throw new Error('format over a minute');
  if (formatTime(null) !== '—') throw new Error('empty best is an em dash');

  m = emptyMatrix();
  for (i = 3; i <= 6; i++) {
    m[0][i] = 'X';
    m[1][i] = 'X';
  }
  if (spawnPiece(m, 'I')) throw new Error('occupied spawn is game over, no sideways cheat');
  if (spawnPiece(m, 'T')) throw new Error('T spawn occupied must fail');

  p = { type: 'T', rot: 0, x: 3, y: 4 };
  if (ghostY(m, p) < p.y) throw new Error('ghost cannot sit above the piece');

  m = emptyMatrix();
  if (countHoles(m) !== 0) throw new Error('empty well has no holes');
  if (sumHeights(colHeights(m)) !== 0) throw new Error('empty aggregate height');
  if (bumpinessOf(colHeights(m)) !== 0) throw new Error('empty bumpiness');
  m[20][3] = 'T';
  if (countHoles(m) !== 1) throw new Error('empty cell under a mino is a hole');
  m[21][3] = 'T';
  if (countHoles(m) !== 0) throw new Error('solid column should not count a hole');

  m = emptyMatrix();
  p = spawnPiece(m, 'I');
  var pick = bestPlacement(m, p, null);
  if (!pick) throw new Error('I must have a placement on empty');
  if (pick.rot !== 0 && pick.rot !== 2) throw new Error('I should lie flat on an empty well');
  if (pick.x > 0) throw new Error('tie-break prefers lower x');

  m = emptyMatrix();
  for (i = 0; i < 9; i++) m[21][i] = 'Z';
  p = spawnPiece(m, 'I');
  pick = bestPlacement(m, p, 'O');
  if (!pick) throw new Error('I must place with a nearly full row');
  var sim = dropLockClear(m, 'I', pick.x, pick.y, pick.rot);
  if (sim.lines < 1) throw new Error('I should complete the almost-full row');

  if (typeof document === 'undefined') {
    var autoRun = playAutoN(40, 2026);
    if (autoRun.alive < 36) throw new Error('AI should survive dozens of pieces');
    if (autoRun.lines < 8) throw new Error('AI should clear lines, not only stack');
    if (autoRun.holes > 14) throw new Error('AI buried too many holes');
    var sprintRun = playAutoN(180, 2026);
    if (sprintRun.lines < 40) throw new Error('AI should clear 40 lines in a sprint-length run');
  }
}

selfCheck();

function loadSprintBest() {
  try {
    var n = parseInt(localStorage.getItem(BEST_KEY) || '', 10);
    return isFinite(n) && n > 0 ? n : null;
  } catch (e) {
    return null;
  }
}

function saveSprintBest(n) {
  try { localStorage.setItem(BEST_KEY, String(n)); } catch (e) { /* ignore */ }
}

function loadMarathonBest() {
  try {
    var n = parseInt(localStorage.getItem(MARATHON_BEST_KEY) || '0', 10);
    return isFinite(n) && n > 0 ? n : 0;
  } catch (e) {
    return 0;
  }
}

function saveMarathonBest(n) {
  try { localStorage.setItem(MARATHON_BEST_KEY, String(n)); } catch (e) { /* ignore */ }
}

function loadMode() {
  try {
    var m = localStorage.getItem(MODE_KEY);
    return m === 'marathon' ? 'marathon' : 'sprint';
  } catch (e) {
    return 'sprint';
  }
}

function saveMode(m) {
  try { localStorage.setItem(MODE_KEY, m); } catch (e) { /* ignore */ }
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

if (typeof document === 'undefined') {
  /* node --check / selfCheck only */
} else {

var wellEl = document.getElementById('well');
var nextEl = document.getElementById('next');
var wellFrame = document.getElementById('well-frame');
var stageEl = document.getElementById('stage');
var overlayEl = document.getElementById('overlay');
var ovTitle = document.getElementById('ov-title');
var ovLead = document.getElementById('ov-lead');
var ovKicker = document.getElementById('ov-kicker');
var ovRetry = document.getElementById('ov-retry');
var panelEl = document.getElementById('panel');
var scoreEl = document.getElementById('score');
var linesEl = document.getElementById('lines');
var levelEl = document.getElementById('level');
var levelSide = document.getElementById('level-side');
var remainEl = document.getElementById('remain');
var remainSide = document.getElementById('remain-side');
var timeEl = document.getElementById('time');
var bestSprintEl = document.getElementById('best-sprint');
var bestMarathonEl = document.getElementById('best-marathon');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnAuto = document.getElementById('btn-auto');
var speedEl = document.getElementById('speed');
var speedLab = document.getElementById('speed-lab');
var modeSprintBtn = document.getElementById('mode-sprint');
var modeMarathonBtn = document.getElementById('mode-marathon');
var hintEl = document.getElementById('hint');
var railFill = document.getElementById('rail-fill');
var readyEl = document.getElementById('ready');
var brandSub = document.getElementById('brand-sub');
var padLeft = document.getElementById('pad-left');
var padRight = document.getElementById('pad-right');
var padRot = document.getElementById('pad-rot');
var padDrop = document.getElementById('pad-drop');
var wctx = wellEl.getContext('2d');
var nctx = nextEl.getContext('2d');
var motionQ = window.matchMedia('(prefers-reduced-motion: reduce)');

var sprintBest = loadSprintBest();
var marathonBest = loadMarathonBest();
var mode = loadMode();
var overlayOpen = false;
var muted = false;
var actx = null;
var lastTs = 0;
var dpr = 1;
var cssW = 0;
var cssH = 0;
var cellW = 0;

var matrix;
var piece;
var queue;
var score;
var lines;
var level;
var alive;
var phase;
var phaseMs;
var pendingRows;
var lockMs;
var lockResets;
var dropMs;
var bufRot;
var keys = { left: false, right: false, down: false };
var dasDir = 0;
var dasMs = 0;
var lockFlash = null;
var lockFlashUntil = 0;
var started = false;
var startTs = 0;
var timerMs = 0;
var frozenMs = null;
var autoOn = false;
var autoSpeed = loadAutoSpeed();
var autoPlan = null;
var autoMs = 0;
var autoPlaced = false;

function reduceMotion() {
  return motionQ.matches;
}

function playing() {
  return alive && !overlayOpen && phase === 'play';
}

function autoTurbo() {
  return autoOn && autoSpeed >= 4;
}

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
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

var sfx = {
  rotate: function () { beep(420, 0.045, 0.03, 'square', 560); },
  lock: function () { beep(180, 0.06, 0.035, 'triangle', 90); },
  drop: function () { beep(240, 0.05, 0.04, 'square', 140); },
  line: function (n) {
    if (n >= 4) {
      beep(392, 0.1, 0.05, 'square', 523);
      setTimeout(function () { beep(523, 0.1, 0.05, 'square', 659); }, 70);
      setTimeout(function () { beep(784, 0.16, 0.06, 'square'); }, 140);
    } else if (n === 3) {
      beep(440, 0.08, 0.045, 'square', 660);
    } else if (n === 2) {
      beep(392, 0.07, 0.04, 'square', 523);
    } else {
      beep(330, 0.055, 0.035, 'square', 440);
    }
  },
  die: function () { beep(196, 0.36, 0.05, 'sawtooth', 70); },
  win: function () {
    beep(523, 0.1, 0.05, 'square', 659);
    setTimeout(function () { beep(659, 0.1, 0.05, 'square', 784); }, 80);
    setTimeout(function () { beep(784, 0.22, 0.06, 'square', 1046); }, 160);
  }
};

function freezeTimer() {
  if (frozenMs != null) return;
  if (started) frozenMs = timerMs;
  else frozenMs = 0;
}

function syncReady() {
  var show = !started && alive && !overlayOpen;
  readyEl.classList.toggle('hidden', !show);
  readyEl.textContent = mode === 'sprint' ? '按键开始计时' : '按键开始';
}

function markStarted() {
  if (started || !alive || overlayOpen) return;
  started = true;
  startTs = performance.now();
  timerMs = 0;
  frozenMs = null;
  syncReady();
}

function currentTime() {
  if (frozenMs != null) return frozenMs;
  return started ? timerMs : 0;
}

function persistMarathon() {
  if (mode !== 'marathon') return;
  if (score > marathonBest) {
    marathonBest = score;
    saveMarathonBest(marathonBest);
  }
}

function persistSprint(ms) {
  if (mode !== 'sprint') return false;
  var rec = false;
  if (sprintBest == null || ms < sprintBest) {
    sprintBest = ms;
    saveSprintBest(sprintBest);
    rec = true;
  }
  return rec;
}

function updateHud(gained) {
  var remain = remainOf(lines);
  remainEl.textContent = String(remain);
  remainSide.textContent = String(remain);
  timeEl.textContent = formatTime(currentTime());
  bestSprintEl.textContent = sprintBest == null ? '—' : formatTime(sprintBest);
  scoreEl.textContent = String(score);
  linesEl.textContent = String(lines);
  levelEl.textContent = String(level);
  levelSide.textContent = String(level);
  bestMarathonEl.textContent = String(marathonBest);
  if (railFill) {
    railFill.style.height = Math.min(100, (lines / SPRINT_LINES) * 100) + '%';
  }
  if (gained && mode === 'marathon') {
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

function hideOverlay() {
  overlayOpen = false;
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  wellEl.focus({ preventScroll: true });
}

function showOverlay(kind, title, lead) {
  overlayOpen = true;
  ovTitle.textContent = title;
  ovLead.textContent = lead;
  ovKicker.textContent = mode === 'sprint' ? 'SPRINT' : 'MARATHON';
  panelEl.classList.toggle('win', kind === 'win');
  panelEl.classList.toggle('lose', kind === 'lose');
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  ovRetry.focus();
}

function syncModeUi() {
  var sprint = mode === 'sprint';
  document.body.classList.toggle('mode-sprint', sprint);
  document.body.classList.toggle('mode-marathon', !sprint);
  modeSprintBtn.setAttribute('aria-pressed', sprint ? 'true' : 'false');
  modeMarathonBtn.setAttribute('aria-pressed', sprint ? 'false' : 'true');
  hintEl.textContent = sprint
    ? '清四十行，比谁快。方向键移动，上键或 X 旋转，空格硬降。A 自动。按键开始计时。'
    : '一直玩到顶。消 1/2/3/4 行得 100/300/500/800 × 等级。方向键移动，空格硬降。A 自动。';
  brandSub.textContent = sprint ? 'SPRINT' : 'MARATHON';
  syncReady();
}

function setMode(next) {
  if (next !== 'sprint' && next !== 'marathon') next = 'sprint';
  if (next === mode) return;
  mode = next;
  saveMode(mode);
  syncModeUi();
  newGame();
}

function die() {
  alive = false;
  phase = 'over';
  piece = null;
  freezeTimer();
  sfx.die();
  if (!reduceMotion()) {
    stageEl.classList.remove('die');
    void stageEl.offsetWidth;
    stageEl.classList.add('die');
  }
  persistMarathon();
  updateHud(0);
  if (mode === 'sprint') {
    showOverlay(
      'lose',
      '到顶了',
      '堆到顶了。清了 ' + lines + ' 行，用时 ' + formatTime(currentTime()) + '。'
    );
  } else {
    showOverlay(
      'lose',
      '到顶了',
      '方块堆到顶了。本局 ' + score + ' 分 · ' + lines + ' 行。'
    );
  }
}

function winSprint() {
  alive = false;
  phase = 'over';
  piece = null;
  freezeTimer();
  var ms = currentTime();
  var rec = persistSprint(ms);
  updateHud(0);
  sfx.win();
  if (!reduceMotion()) {
    stageEl.classList.remove('win');
    void stageEl.offsetWidth;
    stageEl.classList.add('win');
  }
  showOverlay(
    'win',
    '清完了',
    rec
      ? '用时 ' + formatTime(ms) + '。新纪录！'
      : '用时 ' + formatTime(ms) + ' · 最佳 ' + formatTime(sprintBest) + '。'
  );
}

function isGrounded() {
  return piece && collides(matrix, piece.type, piece.rot, piece.x, piece.y + 1);
}

function afterControl() {
  if (!piece) return;
  if (isGrounded()) {
    if (lockResets < LOCK_RESETS) {
      lockMs = 0;
      lockResets += 1;
    }
  } else {
    lockMs = 0;
  }
}

function tryMove(dc) {
  if (!alive || overlayOpen) return false;
  if (phase !== 'play' || !piece) return false;
  if (!collides(matrix, piece.type, piece.rot, piece.x + dc, piece.y)) {
    piece.x += dc;
    afterControl();
    return true;
  }
  return false;
}

function doRotate(dir) {
  if (!alive || overlayOpen) return false;
  if (phase !== 'play' || !piece) {
    if (phase === 'clear' || phase === 'are') bufRot = dir;
    return false;
  }
  var hit = tryRotate(matrix, piece, dir);
  if (!hit) return false;
  piece.x = hit.x;
  piece.y = hit.y;
  piece.rot = hit.rot;
  afterControl();
  sfx.rotate();
  return true;
}

function startAre() {
  phase = 'are';
  phaseMs = (reduceMotion() || autoTurbo()) ? 0 : 70;
  piece = null;
}

function finishClear() {
  var n = pendingRows.length;
  var pts = lineScore(n, level);
  matrix = clearRows(matrix, pendingRows);
  pendingRows = null;
  score += pts;
  lines += n;
  if (mode === 'marathon') {
    level = 1 + Math.floor(lines / 10);
    persistMarathon();
  }
  updateHud(pts);
  sfx.line(n);
  if (mode === 'sprint' && lines >= SPRINT_LINES) {
    winSprint();
    return;
  }
  startAre();
}

function lockNow() {
  if (!piece) return;
  if (mode === 'marathon') persistMarathon();
  if (!reduceMotion() && !autoTurbo()) {
    lockFlash = {
      type: piece.type,
      cells: cellsOf(piece.type, piece.rot, piece.x, piece.y)
    };
    lockFlashUntil = performance.now() + 90;
  } else {
    lockFlash = null;
  }
  matrix = lockTo(matrix, piece);
  var full = findFullRows(matrix);
  piece = null;
  lockMs = 0;
  lockResets = 0;
  dropMs = 0;
  if (full.length) {
    if (mode === 'sprint' && lines + full.length >= SPRINT_LINES) freezeTimer();
    pendingRows = full;
    lockFlash = null;
    phase = 'clear';
    phaseMs = (reduceMotion() || autoTurbo()) ? 0 : 180;
    if (phaseMs === 0) finishClear();
  } else {
    if (!autoTurbo()) sfx.lock();
    startAre();
    if (reduceMotion() || autoTurbo()) spawnNext();
  }
}

function hardDrop() {
  if (!alive || overlayOpen) return;
  if (phase !== 'play' || !piece) return;
  markStarted();
  var gy = ghostY(matrix, piece);
  var dist = gy - piece.y;
  piece.y = gy;
  if (dist > 0) {
    score += dist * 2;
    if (mode === 'marathon') persistMarathon();
    updateHud(dist * 2);
  }
  if (!autoTurbo()) sfx.drop();
  lockNow();
}

function spawnNext() {
  if (!alive || phase === 'over') return;
  fillBag(queue, Math.random);
  var type = queue.shift();
  fillBag(queue, Math.random);
  var p = spawnPiece(matrix, type);
  if (!p) {
    die();
    return;
  }
  piece = p;
  phase = 'play';
  phaseMs = 0;
  lockMs = 0;
  lockResets = 0;
  dropMs = 0;
  autoPlan = null;
  autoMs = 0;
  if (bufRot) {
    var rot = bufRot;
    bufRot = 0;
    if (!autoOn) doRotate(rot);
  }
  if (dasDir && !autoOn) tryMove(dasDir);
}

function newGame() {
  matrix = emptyMatrix();
  queue = [];
  fillBag(queue, Math.random);
  score = 0;
  lines = 0;
  level = 1;
  alive = true;
  pendingRows = null;
  lockMs = 0;
  lockResets = 0;
  dropMs = 0;
  bufRot = 0;
  dasMs = 0;
  dasDir = 0;
  lockFlash = null;
  lockFlashUntil = 0;
  autoPlan = null;
  autoMs = 0;
  started = false;
  startTs = 0;
  timerMs = 0;
  frozenMs = null;
  lastTs = performance.now();
  stageEl.classList.remove('die');
  stageEl.classList.remove('win');
  scoreAdd.hidden = true;
  hideOverlay();
  updateHud(0);
  syncReady();
  spawnNext();
  if (!autoOn) {
    if (keys.left) beginDas(-1);
    else if (keys.right) beginDas(1);
    if (keys.left || keys.right || keys.down) markStarted();
  }
}

function dropInterval() {
  var g = mode === 'sprint' ? gravityMs(1) : gravityMs(level);
  if (keys.down) return SOFT_MS < g ? SOFT_MS : g;
  return g;
}

function tickGravity(dt) {
  if (!piece || phase !== 'play') return;
  if (!started) return;
  if (isGrounded()) {
    lockMs += dt;
    if (lockMs >= LOCK_MS) lockNow();
    return;
  }
  lockMs = 0;
  var interval = dropInterval();
  dropMs += dt;
  var steps = 0;
  var soft = keys.down;
  while (dropMs >= interval && steps < 8 && piece && phase === 'play') {
    dropMs -= interval;
    steps += 1;
    if (!collides(matrix, piece.type, piece.rot, piece.x, piece.y + 1)) {
      piece.y += 1;
      if (soft) {
        score += 1;
        if (mode === 'marathon') scoreEl.textContent = String(score);
      }
    } else {
      break;
    }
  }
}

function tickDas(dt) {
  if (!dasDir || !playing()) return;
  dasMs -= dt;
  var guard = 0;
  while (dasMs <= 0 && guard < 8 && playing()) {
    tryMove(dasDir);
    dasMs += ARR_MS;
    guard += 1;
  }
}

function autoTwist(dir) {
  var hit = tryRotate(matrix, piece, dir);
  if (!hit) return false;
  piece.x = hit.x;
  piece.y = hit.y;
  piece.rot = hit.rot;
  afterControl();
  return true;
}

function autoAct(act, audible) {
  if (act === -1) return tryMove(-1);
  if (act === 1) return tryMove(1);
  if (act === 2) return audible ? doRotate(1) : autoTwist(1);
  if (act === -2) return audible ? doRotate(-1) : autoTwist(-1);
  return false;
}

function autoSnapOrPath() {
  if (!autoPlan || !piece) return;
  if (!collides(matrix, piece.type, autoPlan.rot, autoPlan.x, autoPlan.y)) {
    piece.x = autoPlan.x;
    piece.y = autoPlan.y;
    piece.rot = autoPlan.rot;
  } else {
    var path = autoPlan.path || [];
    var i;
    for (i = 0; i < path.length && piece && phase === 'play'; i++) {
      autoAct(path[i], false);
    }
  }
  hardDrop();
  autoPlan = null;
}

function autoStepOnce() {
  if (!autoPlan || !piece) return;
  var path = autoPlan.path;
  var ok;
  if (path && path.length) {
    ok = autoAct(path.shift(), true);
    if (!ok) {
      hardDrop();
      autoPlan = null;
    }
    return;
  }
  if (piece.rot !== autoPlan.rot) {
    var cw = (autoPlan.rot - piece.rot + 4) % 4;
    ok = doRotate(cw <= 2 ? 1 : -1);
    if (!ok) {
      hardDrop();
      autoPlan = null;
    }
    return;
  }
  if (piece.x < autoPlan.x) {
    if (!tryMove(1)) {
      hardDrop();
      autoPlan = null;
    }
    return;
  }
  if (piece.x > autoPlan.x) {
    if (!tryMove(-1)) {
      hardDrop();
      autoPlan = null;
    }
    return;
  }
  hardDrop();
  autoPlan = null;
}

function tickAuto(dt) {
  if (!autoOn || !alive || overlayOpen) return;
  if (phase !== 'play' || !piece) return;
  if (autoTurbo() && autoPlaced) return;
  markStarted();
  if (!autoPlan || autoPlan.ref !== piece) {
    autoPlan = bestPlacement(matrix, piece, queue[0]);
    if (autoPlan) autoPlan.ref = piece;
    autoMs = 0;
  }
  if (!autoPlan) return;
  if (autoSpeed >= 3) {
    autoSnapOrPath();
    autoPlaced = true;
    return;
  }
  autoMs += dt;
  var interval = autoSpeed <= 1 ? 160 : 58;
  if (autoMs < interval) return;
  autoMs -= interval;
  autoStepOnce();
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

function clearPlayerMotion() {
  keys.left = false;
  keys.right = false;
  keys.down = false;
  dasDir = 0;
  dasMs = 0;
  bufRot = 0;
}

function toggleAuto() {
  autoOn = !autoOn;
  autoPlan = null;
  autoMs = 0;
  syncAutoUi();
  if (autoOn) {
    clearPlayerMotion();
    if (!muted) audioCtx();
  }
}

function setAutoSpeed(n) {
  if (n < 1 || n > 4 || !isFinite(n)) n = 3;
  autoSpeed = n;
  saveAutoSpeed(autoSpeed);
  syncSpeedUi();
}

function tick(dt) {
  if (!alive || overlayOpen) return;
  if (started && frozenMs == null) timerMs += dt;
  if (autoOn) tickAuto(dt);
  if (phase === 'play') {
    if (!autoOn) {
      tickDas(dt);
      tickGravity(dt);
    }
  } else if (phase === 'clear') {
    phaseMs -= dt;
    if (phaseMs <= 0) finishClear();
  } else if (phase === 'are') {
    phaseMs -= dt;
    if (phaseMs <= 0) spawnNext();
  }
}

function roundRectPath(ctx, x, y, w, h, r) {
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

function drawMino(ctx, x, y, size, pal, modeDraw) {
  var inset = size * (modeDraw === 'ghost' ? 0.12 : 0.07);
  var xx = x + inset;
  var yy = y + inset;
  var ss = size - inset * 2;
  var rad = size * 0.18;
  if (ss <= 0.5) return;
  if (modeDraw === 'ghost') {
    ctx.strokeStyle = pal.fill;
    ctx.globalAlpha = 0.38;
    ctx.lineWidth = Math.max(1.15, size * 0.085);
    roundRectPath(ctx, xx, yy, ss, ss, rad);
    ctx.stroke();
    ctx.globalAlpha = 1;
    return;
  }
  var g = ctx.createLinearGradient(xx, yy, xx + ss, yy + ss);
  if (modeDraw === 'flash') {
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.45, pal.hi);
    g.addColorStop(1, pal.fill);
  } else {
    g.addColorStop(0, pal.hi);
    g.addColorStop(0.42, pal.fill);
    g.addColorStop(1, pal.lo);
  }
  ctx.fillStyle = g;
  roundRectPath(ctx, xx, yy, ss, ss, rad);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.42)';
  ctx.lineWidth = Math.max(1, size * 0.055);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  roundRectPath(ctx, xx + ss * 0.12, yy + ss * 0.1, ss * 0.46, ss * 0.22, rad * 0.45);
  ctx.fill();
}

function drawCells(ctx, cells, originX, originY, size, pal, modeDraw, glow) {
  var i, cell, x, y;
  if (glow && modeDraw === 'solid') {
    ctx.save();
    ctx.shadowColor = pal.glow;
    ctx.shadowBlur = size * 0.55;
    for (i = 0; i < cells.length; i++) {
      cell = cells[i];
      if (cell.r < HIDDEN) continue;
      x = originX + cell.c * size;
      y = originY + (cell.r - HIDDEN) * size;
      drawMino(ctx, x, y, size, pal, modeDraw);
    }
    ctx.restore();
    return;
  }
  for (i = 0; i < cells.length; i++) {
    cell = cells[i];
    if (cell.r < HIDDEN && ctx === wctx) continue;
    x = originX + cell.c * size;
    y = originY + (cell.r - (ctx === wctx ? HIDDEN : 0)) * size;
    drawMino(ctx, x, y, size, pal, modeDraw);
  }
}

function layoutWell() {
  var size = Math.min(cssW / COLS, cssH / VISIBLE);
  var gw = size * COLS;
  var gh = size * VISIBLE;
  return {
    size: size,
    ox: (cssW - gw) / 2,
    oy: (cssH - gh) / 2,
    gw: gw,
    gh: gh
  };
}

function resizeWell() {
  var w = wellFrame.clientWidth;
  var h = wellFrame.clientHeight;
  if (w < 8 || h < 8) return;
  cssW = w;
  cssH = h;
  dpr = Math.min(2.5, window.devicePixelRatio || 1);
  var pw = Math.round(w * dpr);
  var ph = Math.round(h * dpr);
  if (wellEl.width !== pw || wellEl.height !== ph) {
    wellEl.width = pw;
    wellEl.height = ph;
  }
}

function resizeNext() {
  var box = nextEl.parentNode;
  var w = box ? box.clientWidth - 16 : 64;
  if (w < 24) w = 64;
  var d = Math.min(2.5, window.devicePixelRatio || 1);
  var px = Math.round(w * d);
  if (nextEl.width !== px || nextEl.height !== px) {
    nextEl.width = px;
    nextEl.height = px;
  }
}

function drawWell(now) {
  resizeWell();
  if (cssW < 8) return;
  wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  wctx.clearRect(0, 0, cssW, cssH);

  var L = layoutWell();
  cellW = L.size;
  var r, c, x, y, id, pal, flash, pulse, cells, gy, ghost;

  wctx.fillStyle = '#120818';
  wctx.fillRect(0, 0, cssW, cssH);

  wctx.save();
  wctx.beginPath();
  wctx.rect(L.ox, L.oy, L.gw, L.gh);
  wctx.clip();

  wctx.fillStyle = 'rgba(225,76,255,0.035)';
  for (r = 0; r < VISIBLE; r++) {
    for (c = 0; c < COLS; c++) {
      if ((c + r) % 2 === 0) {
        wctx.fillRect(L.ox + c * L.size, L.oy + r * L.size, L.size, L.size);
      }
    }
  }

  wctx.strokeStyle = 'rgba(225,76,255,0.09)';
  wctx.lineWidth = 1;
  wctx.beginPath();
  for (c = 1; c < COLS; c++) {
    x = L.ox + c * L.size + 0.5;
    wctx.moveTo(x, L.oy);
    wctx.lineTo(x, L.oy + L.gh);
  }
  for (r = 1; r < VISIBLE; r++) {
    y = L.oy + r * L.size + 0.5;
    wctx.moveTo(L.ox, y);
    wctx.lineTo(L.ox + L.gw, y);
  }
  wctx.stroke();

  flash = phase === 'clear' && pendingRows && !reduceMotion();
  pulse = flash ? 0.55 + 0.45 * Math.abs(Math.sin(now / 70)) : 1;

  for (r = HIDDEN; r < ROWS; r++) {
    for (c = 0; c < COLS; c++) {
      id = matrix[r][c];
      if (!id || !PALETTE[id]) continue;
      pal = PALETTE[id];
      if (flash && pendingRows.indexOf(r) !== -1) {
        wctx.globalAlpha = pulse;
        drawMino(wctx, L.ox + c * L.size, L.oy + (r - HIDDEN) * L.size, L.size, pal, 'flash');
        wctx.globalAlpha = 1;
      } else {
        drawMino(wctx, L.ox + c * L.size, L.oy + (r - HIDDEN) * L.size, L.size, pal, 'solid');
      }
    }
  }

  if (lockFlash && now < lockFlashUntil && PALETTE[lockFlash.type]) {
    drawCells(wctx, lockFlash.cells, L.ox, L.oy, L.size, PALETTE[lockFlash.type], 'flash', false);
  } else if (now >= lockFlashUntil) {
    lockFlash = null;
  }

  if (piece && PALETTE[piece.type] && phase === 'play') {
    pal = PALETTE[piece.type];
    gy = ghostY(matrix, piece);
    if (gy !== piece.y) {
      ghost = cellsOf(piece.type, piece.rot, piece.x, gy);
      drawCells(wctx, ghost, L.ox, L.oy, L.size, pal, 'ghost', false);
    }
    cells = cellsOf(piece.type, piece.rot, piece.x, piece.y);
    drawCells(wctx, cells, L.ox, L.oy, L.size, pal, 'solid', true);
  }

  wctx.restore();

  wctx.save();
  wctx.strokeStyle = 'rgba(225,76,255,0.55)';
  wctx.lineWidth = 1.4;
  roundRectPath(wctx, L.ox + 0.5, L.oy + 0.5, L.gw - 1, L.gh - 1, 4);
  wctx.stroke();
  wctx.restore();

  if (overlayOpen && !reduceMotion()) {
    var tint = panelEl.classList.contains('win')
      ? 'rgba(255,227,107,'
      : 'rgba(225,76,255,';
    wctx.fillStyle = tint + (0.05 + 0.04 * Math.abs(Math.sin(now / 140))) + ')';
    wctx.fillRect(0, 0, cssW, cssH);
  }
}

function drawNext() {
  resizeNext();
  var d = Math.min(2.5, window.devicePixelRatio || 1);
  var css = nextEl.width / d;
  nctx.setTransform(d, 0, 0, d, 0, 0);
  nctx.clearRect(0, 0, css, css);
  var type = queue && queue[0];
  if (!type || !SHAPES[type]) return;
  var cells = cellsOf(type, 0, 0, 0);
  var box = bbox(cells);
  var size = css / 4.6;
  var gw = box.w * size;
  var gh = box.h * size;
  var ox = (css - gw) / 2 - box.minC * size;
  var oy = (css - gh) / 2 - box.minR * size;
  var pal = PALETTE[type];
  var i, cell;
  nctx.save();
  nctx.shadowColor = pal.glow;
  nctx.shadowBlur = size * 0.45;
  for (i = 0; i < cells.length; i++) {
    cell = cells[i];
    drawMino(nctx, ox + cell.c * size, oy + cell.r * size, size, pal, 'solid');
  }
  nctx.restore();
}

function render(now) {
  if (started && frozenMs == null && timeEl) timeEl.textContent = formatTime(timerMs);
  drawWell(now);
  drawNext();
}

function frame(now) {
  requestAnimationFrame(frame);
  if (!lastTs) lastTs = now;
  var dt = now - lastTs;
  lastTs = now;
  if (dt > 50) dt = 50;
  if (dt < 0) dt = 0;
  autoPlaced = false;
  tick(dt);
  render(now);
}

function beginDas(dir) {
  dasDir = dir;
  dasMs = DAS_MS;
  tryMove(dir);
}

function endDas(dir) {
  if (dasDir === dir) {
    if (dir === -1 && keys.right) beginDas(1);
    else if (dir === 1 && keys.left) beginDas(-1);
    else {
      dasDir = 0;
      dasMs = 0;
    }
  }
}

function onLeftDown() {
  if (overlayOpen || autoOn) return;
  if (!muted) audioCtx();
  markStarted();
  if (keys.left) return;
  keys.left = true;
  beginDas(-1);
}

function onRightDown() {
  if (overlayOpen || autoOn) return;
  if (!muted) audioCtx();
  markStarted();
  if (keys.right) return;
  keys.right = true;
  beginDas(1);
}

function onLeftUp() {
  keys.left = false;
  endDas(-1);
}

function onRightUp() {
  keys.right = false;
  endDas(1);
}

function toggleMute() {
  muted = !muted;
  btnMute.classList.toggle('muted', muted);
  btnMute.textContent = muted ? '静' : '声';
  btnMute.setAttribute('aria-label', muted ? '开启声音' : '静音');
  if (!muted) audioCtx();
}

var ptr = {
  id: null,
  x0: 0,
  y0: 0,
  t0: 0,
  lastX: 0,
  shifted: 0,
  mode: null,
  zone: 0
};

function wellPoint(e) {
  var rect = wellEl.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
    w: rect.width,
    h: rect.height
  };
}

function zoneFromX(x, w) {
  if (x < w * 0.38) return -1;
  if (x > w * 0.62) return 1;
  return 0;
}

wellEl.addEventListener('contextmenu', function (e) { e.preventDefault(); });

wellEl.addEventListener('pointerdown', function (e) {
  if (e.button !== 0) return;
  if (overlayOpen || autoOn) return;
  if (ptr.id !== null) return;
  if (!muted) audioCtx();
  markStarted();
  var p = wellPoint(e);
  ptr.id = e.pointerId;
  ptr.x0 = p.x;
  ptr.y0 = p.y;
  ptr.lastX = p.x;
  ptr.t0 = performance.now();
  ptr.shifted = 0;
  ptr.mode = null;
  ptr.zone = zoneFromX(p.x, p.w);
  try { wellEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  if (ptr.zone) {
    ptr.holdTimer = setTimeout(function () {
      if (ptr.id === e.pointerId && !ptr.mode) {
        ptr.mode = 'move';
        if (ptr.zone === -1) onLeftDown();
        else onRightDown();
      }
    }, 140);
  }
});

wellEl.addEventListener('pointermove', function (e) {
  if (ptr.id !== e.pointerId) return;
  e.preventDefault();
  if (autoOn) return;
  var p = wellPoint(e);
  var dx = p.x - ptr.x0;
  var dy = p.y - ptr.y0;
  if (ptr.mode === 'drop') return;
  if (dy > 36 && dy > Math.abs(dx) + 6) {
    ptr.mode = 'drop';
    if (ptr.holdTimer) clearTimeout(ptr.holdTimer);
    if (keys.left) onLeftUp();
    if (keys.right) onRightUp();
    hardDrop();
    return;
  }
  var step = cellW > 8 ? cellW : (p.w / COLS);
  var want = Math.round(dx / Math.max(18, step * 0.85));
  if (want !== ptr.shifted) {
    var dir = want > ptr.shifted ? 1 : -1;
    var n = Math.abs(want - ptr.shifted);
    var i;
    ptr.mode = 'move';
    if (ptr.holdTimer) {
      clearTimeout(ptr.holdTimer);
      ptr.holdTimer = null;
    }
    for (i = 0; i < n; i++) tryMove(dir);
    ptr.shifted = want;
    if (dir === -1) {
      if (!keys.left) {
        if (keys.right) onRightUp();
        keys.left = true;
        dasDir = -1;
        dasMs = DAS_MS;
      }
    } else if (dir === 1) {
      if (!keys.right) {
        if (keys.left) onLeftUp();
        keys.right = true;
        dasDir = 1;
        dasMs = DAS_MS;
      }
    }
  }
}, { passive: false });

function endPtr(e) {
  if (ptr.id !== e.pointerId) return;
  if (ptr.holdTimer) {
    clearTimeout(ptr.holdTimer);
    ptr.holdTimer = null;
  }
  var dt = performance.now() - ptr.t0;
  var p = wellPoint(e);
  var dx = p.x - ptr.x0;
  var dy = p.y - ptr.y0;
  var tap = Math.hypot(dx, dy) < 18 && dt < 280;
  if (keys.left) onLeftUp();
  if (keys.right) onRightUp();
  if (!ptr.mode && tap && !autoOn) doRotate(1);
  ptr.id = null;
  ptr.mode = null;
}

wellEl.addEventListener('pointerup', endPtr);
wellEl.addEventListener('pointercancel', endPtr);

stageEl.addEventListener('touchmove', function (e) {
  e.preventDefault();
}, { passive: false });

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
  if (key === 'a' || key === 'A' || code === 'KeyA') {
    e.preventDefault();
    if (e.repeat) return;
    toggleAuto();
    return;
  }
  if (overlayOpen) {
    if (key === ' ' || key === 'Enter') {
      e.preventDefault();
      newGame();
    }
    if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight' || key === ' ') {
      e.preventDefault();
    }
    return;
  }
  if (autoOn) {
    if (
      key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown' ||
      key === ' ' || code === 'Space' || code === 'KeyD' || code === 'KeyS' ||
      code === 'KeyW' || code === 'KeyX' || code === 'KeyZ'
    ) {
      e.preventDefault();
    }
    return;
  }
  if (key === 'ArrowLeft') {
    e.preventDefault();
    if (e.repeat) return;
    onLeftDown();
    return;
  }
  if (key === 'ArrowRight' || code === 'KeyD') {
    e.preventDefault();
    if (e.repeat) return;
    onRightDown();
    return;
  }
  if (key === 'ArrowDown' || code === 'KeyS') {
    e.preventDefault();
    if (e.repeat) return;
    keys.down = true;
    if (!muted) audioCtx();
    markStarted();
    return;
  }
  if (key === 'ArrowUp' || code === 'KeyX' || code === 'KeyW') {
    e.preventDefault();
    if (e.repeat) return;
    if (!muted) audioCtx();
    markStarted();
    doRotate(1);
    return;
  }
  if (code === 'KeyZ' || key === 'z' || key === 'Z') {
    e.preventDefault();
    if (e.repeat) return;
    if (!muted) audioCtx();
    markStarted();
    doRotate(-1);
    return;
  }
  if (key === ' ' || code === 'Space') {
    e.preventDefault();
    if (e.repeat) return;
    if (!muted) audioCtx();
    hardDrop();
  }
});

window.addEventListener('keyup', function (e) {
  var key = e.key;
  var code = e.code;
  if (key === 'ArrowLeft') onLeftUp();
  if (key === 'ArrowRight' || code === 'KeyD') onRightUp();
  if (key === 'ArrowDown' || code === 'KeyS') keys.down = false;
});

function bindHold(btn, down, up) {
  var holding = false;
  function pd(e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    holding = true;
    try { btn.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (!muted) audioCtx();
    down();
  }
  function pu() {
    if (!holding) return;
    holding = false;
    up();
  }
  btn.addEventListener('pointerdown', pd);
  btn.addEventListener('pointerup', pu);
  btn.addEventListener('pointercancel', pu);
  btn.addEventListener('lostpointercapture', pu);
}

bindHold(padLeft, onLeftDown, onLeftUp);
bindHold(padRight, onRightDown, onRightUp);

padRot.addEventListener('click', function (e) {
  e.preventDefault();
  if (autoOn) return;
  if (!muted) audioCtx();
  markStarted();
  doRotate(1);
});

padDrop.addEventListener('click', function (e) {
  e.preventDefault();
  if (autoOn) return;
  if (!muted) audioCtx();
  hardDrop();
});

btnMute.addEventListener('click', toggleMute);
btnAuto.addEventListener('click', function () { toggleAuto(); });
speedEl.addEventListener('input', function () {
  setAutoSpeed(parseInt(speedEl.value, 10));
});
btnRetry.addEventListener('click', function () { newGame(); });
ovRetry.addEventListener('click', function () { newGame(); });
modeSprintBtn.addEventListener('click', function () { setMode('sprint'); });
modeMarathonBtn.addEventListener('click', function () { setMode('marathon'); });

stageEl.addEventListener('pointerdown', function () {
  if (!overlayOpen) wellEl.focus({ preventScroll: true });
});

stageEl.addEventListener('animationend', function () {
  stageEl.classList.remove('die');
  stageEl.classList.remove('win');
});

window.addEventListener('blur', function () {
  keys.left = false;
  keys.right = false;
  keys.down = false;
  dasDir = 0;
  dasMs = 0;
});

window.addEventListener('resize', function () {
  resizeWell();
  resizeNext();
});

syncModeUi();
syncAutoUi();
syncSpeedUi();
updateHud(0);
newGame();
requestAnimationFrame(frame);

}
