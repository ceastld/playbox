'use strict';

/* Classic Gabriele Cirulli 2048. Merge once per move — never cascade. */
var SIZE = 4;
var SLIDE_MS = 110;
var POP_MS = 130;
var SPAWN_MS = 140;
var SWIPE_MIN = 24;
var BEST_KEY = 'playbox-twenty48-best';
var AUTO_SPEED_KEY = 'playbox-twenty48-auto-speed';
var AUTO_DELAY = [0, 420, 200, 70, 0];
var AUTO_SPEED_NAME = ['', '慢', '中', '快', '极快'];
var DIRS = { left: 1, right: 1, up: 1, down: 1 };
/* AI: row-table expectimax. Values stored as exponents (2 -> 1). */
var AI_DIRS = ['up', 'left', 'down', 'right'];
var aiDeadline = 0;
var ROW_LEFT = new Uint16Array(65536);
var ROW_REV = new Uint16Array(65536);
var ROW_LEFT_CHANGED = new Uint8Array(65536);
(function initRowTables() {
  var i, j, k, cells, out, a, b, packed, line;
  for (i = 0; i < 65536; i++) {
    line = [(i >> 12) & 15, (i >> 8) & 15, (i >> 4) & 15, i & 15];
    ROW_REV[i] = (line[3] << 12) | (line[2] << 8) | (line[1] << 4) | line[0];
    cells = [];
    for (j = 0; j < 4; j++) if (line[j]) cells.push(line[j]);
    out = [0, 0, 0, 0];
    k = 0;
    j = 0;
    while (j < cells.length) {
      if (j + 1 < cells.length && cells[j] === cells[j + 1] && cells[j] < 15) {
        out[k] = cells[j] + 1;
        k += 1;
        j += 2;
      } else {
        out[k] = cells[j];
        k += 1;
        j += 1;
      }
    }
    packed = (out[0] << 12) | (out[1] << 8) | (out[2] << 4) | out[3];
    ROW_LEFT[i] = packed;
    ROW_LEFT_CHANGED[i] = packed !== i ? 1 : 0;
  }
})();
function flipH(m) {
  return [m[0].slice().reverse(), m[1].slice().reverse(), m[2].slice().reverse(), m[3].slice().reverse()];
}
function flipV(m) { return [m[3], m[2], m[1], m[0]]; }
function transM(m) {
  var o = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  var r, c;
  for (r = 0; r < 4; r++) for (c = 0; c < 4; c++) o[c][r] = m[r][c];
  return o;
}
var SNAKE_BASE = [
  [Math.pow(4, 15), Math.pow(4, 14), Math.pow(4, 13), Math.pow(4, 12)],
  [Math.pow(4, 8), Math.pow(4, 9), Math.pow(4, 10), Math.pow(4, 11)],
  [Math.pow(4, 7), Math.pow(4, 6), Math.pow(4, 5), Math.pow(4, 4)],
  [Math.pow(4, 0), Math.pow(4, 1), Math.pow(4, 2), Math.pow(4, 3)]
];
var SNAKES = (function () {
  var tr = transM(SNAKE_BASE);
  return [
    SNAKE_BASE, flipH(SNAKE_BASE), flipV(SNAKE_BASE), flipH(flipV(SNAKE_BASE)),
    tr, flipH(tr), flipV(tr), flipH(flipV(tr))
  ];
})();
function snakeFor(maxR, maxC) {
  var best = 0, bestW = -1, s, w;
  for (s = 0; s < 8; s++) {
    w = SNAKES[s][maxR][maxC];
    if (w > bestW) { bestW = w; best = s; }
  }
  return SNAKES[best];
}
function transposeRows(a) {
  var r0 = a[0], r1 = a[1], r2 = a[2], r3 = a[3];
  return [
    (((r0 >> 12) & 15) << 12) | (((r1 >> 12) & 15) << 8) | (((r2 >> 12) & 15) << 4) | ((r3 >> 12) & 15),
    (((r0 >> 8) & 15) << 12) | (((r1 >> 8) & 15) << 8) | (((r2 >> 8) & 15) << 4) | ((r3 >> 8) & 15),
    (((r0 >> 4) & 15) << 12) | (((r1 >> 4) & 15) << 8) | (((r2 >> 4) & 15) << 4) | ((r3 >> 4) & 15),
    ((r0 & 15) << 12) | ((r1 & 15) << 8) | ((r2 & 15) << 4) | (r3 & 15)
  ];
}
function moveRows(rows, dir) {
  var next = [0, 0, 0, 0];
  var changed = 0;
  var i, r, x, y, t;
  if (dir === 'left') {
    for (i = 0; i < 4; i++) {
      r = rows[i];
      x = ROW_LEFT[r];
      next[i] = x;
      if (x !== r) changed = 1;
    }
  } else if (dir === 'right') {
    for (i = 0; i < 4; i++) {
      r = rows[i];
      x = ROW_REV[ROW_LEFT[ROW_REV[r]]];
      next[i] = x;
      if (x !== r) changed = 1;
    }
  } else if (dir === 'up') {
    t = transposeRows(rows);
    for (i = 0; i < 4; i++) {
      y = ROW_LEFT[t[i]];
      if (y !== t[i]) changed = 1;
      t[i] = y;
    }
    next = transposeRows(t);
  } else {
    t = transposeRows(rows);
    for (i = 0; i < 4; i++) {
      y = ROW_REV[ROW_LEFT[ROW_REV[t[i]]]];
      if (y !== t[i]) changed = 1;
      t[i] = y;
    }
    next = transposeRows(t);
  }
  return { rows: next, changed: changed };
}
function gridToRows(grid) {
  var rows = [0, 0, 0, 0], r, c, e, row;
  for (r = 0; r < 4; r++) {
    row = 0;
    for (c = 0; c < 4; c++) {
      e = grid[r][c] ? (log2v(grid[r][c]) | 0) : 0;
      row = (row << 4) | e;
    }
    rows[r] = row;
  }
  return rows;
}

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

function findMax(grid) {
  var m = 0, rr = 0, cc = 0, r, c, v;
  for (r = 0; r < SIZE; r++) {
    for (c = 0; c < SIZE; c++) {
      v = grid[r][c];
      if (v > m) {
        m = v;
        rr = r;
        cc = c;
      }
    }
  }
  return { v: m, r: rr, c: cc };
}

function log2v(v) {
  return Math.log(v) / Math.LN2;
}

/**
 * Use the one snake whose peak sits on the current max tile.
 * Taking max over all 8 lets the corner jump and dies at 4096.
 */
function evalRows(rows) {
  var empty = 0, max = 0, maxR = 0, maxC = 0;
  var r, c, e, row, W, snake, v;
  var cells = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (r = 0; r < 4; r++) {
    row = rows[r];
    for (c = 0; c < 4; c++) {
      e = (row >> (12 - 4 * c)) & 15;
      cells[r * 4 + c] = e;
      if (!e) empty += 1;
      else if (e > max) { max = e; maxR = r; maxC = c; }
    }
  }
  if (!max) return 0;
  if (!empty) {
    var can = 0;
    for (r = 0; r < 4; r++) {
      for (c = 0; c < 4; c++) {
        e = cells[r * 4 + c];
        if (c < 3 && cells[r * 4 + c + 1] === e) can = 1;
        if (r < 3 && cells[(r + 1) * 4 + c] === e) can = 1;
      }
    }
    if (!can) return -1e12;
  }
  W = snakeFor(maxR, maxC);
  snake = 0;
  for (r = 0; r < 4; r++) {
    for (c = 0; c < 4; c++) {
      e = cells[r * 4 + c];
      if (e) snake += (1 << e) * W[r][c];
    }
  }
  var corner = ((maxR === 0 || maxR === 3) && (maxC === 0 || maxC === 3)) ? (1 << max) * 80 : -(1 << max) * 50;
  return snake + empty * empty * 400000 + empty * 200000 + corner;
}

function evalGrid(grid) {
  return evalRows(gridToRows(grid));
}

function evalAfterMove(before, result) {
  return evalGrid(result.grid);
}

function maxNodeRows(rows, depth) {
  if (depth <= 0 || Date.now() >= aiDeadline) return evalRows(rows);
  var best = -1e15, found = 0, i, res, s;
  for (i = 0; i < 4; i++) {
    res = moveRows(rows, AI_DIRS[i]);
    if (!res.changed) continue;
    found = 1;
    s = chanceNodeRows(res.rows, depth - 1);
    if (s > best) best = s;
  }
  return found ? best : evalRows(rows);
}

function chanceNodeRows(rows, depth) {
  if (depth <= 0 || Date.now() >= aiDeadline) return evalRows(rows);
  var list = [];
  var r, c, e, row, n, i, bit, total, use4;
  for (r = 0; r < 4; r++) {
    row = rows[r];
    for (c = 0; c < 4; c++) {
      if (((row >> (12 - 4 * c)) & 15) === 0) list.push((r << 2) | c);
    }
  }
  n = list.length;
  if (!n) return evalRows(rows);
  use4 = n <= 3;
  total = 0;
  for (i = 0; i < n; i++) {
    r = list[i] >> 2;
    c = list[i] & 3;
    bit = 12 - 4 * c;
    rows[r] |= (1 << bit);
    total += (use4 ? 0.9 : 1) * maxNodeRows(rows, depth - 1);
    if (use4) {
      rows[r] = (rows[r] & ~(15 << bit)) | (2 << bit);
      total += 0.1 * maxNodeRows(rows, depth - 1);
    }
    rows[r] &= ~(15 << bit);
  }
  return total / n;
}

function aiBudgetMs() {
  var s = typeof autoSpeed === 'number' ? autoSpeed : 3;
  if (s >= 4) return 24;
  if (s === 3) return 50;
  if (s === 2) return 75;
  return 120;
}

function pickAiMove(grid) {
  var rows = gridToRows(grid);
  var empties = emptyCells(grid).length;
  var maxD = empties >= 8 ? 4 : empties >= 4 ? 5 : 6;
  var bestDir = null, bestScore = -Infinity;
  var d, i, res, s, layerDir, layerScore, timedOut;
  aiDeadline = Date.now() + aiBudgetMs();
  for (d = 3; d <= maxD; d++) {
    layerDir = null;
    layerScore = -Infinity;
    timedOut = false;
    for (i = 0; i < 4; i++) {
      res = moveRows(rows, AI_DIRS[i]);
      if (!res.changed) continue;
      s = chanceNodeRows(res.rows, d);
      if (Date.now() >= aiDeadline) { timedOut = true; break; }
      if (layerDir === null || s > layerScore) {
        layerDir = AI_DIRS[i];
        layerScore = s;
      }
    }
    if (layerDir !== null && !timedOut) {
      bestDir = layerDir;
      bestScore = layerScore;
    }
    if (timedOut) break;
  }
  if (bestDir === null) {
    for (i = 0; i < 4; i++) {
      res = moveRows(rows, AI_DIRS[i]);
      if (!res.changed) continue;
      s = evalRows(res.rows);
      if (bestDir === null || s > bestScore) {
        bestDir = AI_DIRS[i];
        bestScore = s;
      }
    }
  }
  return bestDir;
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

  var onlyRight = [[4, 2, 0, 0], [8, 4, 0, 0], [16, 8, 0, 0], [32, 16, 0, 0]];
  console.assert(pickAiMove(onlyRight) === 'right', 'only legal move');
  console.assert(!moveBoard(onlyRight, 'left').changed, 'only-right: left noop');
  console.assert(!moveBoard(onlyRight, 'up').changed, 'only-right: up noop');
  console.assert(!moveBoard(onlyRight, 'down').changed, 'only-right: down noop');

  var inCorner = [[1024, 4, 2, 0], [8, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  var inCenter = [[2, 4, 0, 0], [8, 1024, 2, 0], [0, 2, 0, 0], [0, 0, 0, 0]];
  console.assert(evalGrid(inCorner) > evalGrid(inCenter), 'max tile prefers corner');

  var stuckAi = [[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]];
  console.assert(pickAiMove(stuckAi) === null, 'no move when stuck');

  var early = [[2, 0, 0, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  var first = pickAiMove(early);
  console.assert(first === 'up' || first === 'left' || first === 'down' || first === 'right', 'early move legal');
  console.assert(moveBoard(early, first).changed, 'early pick is not a noop');
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

function loadAutoSpeed() {
  try {
    var n = parseInt(localStorage.getItem(AUTO_SPEED_KEY) || '3', 10);
    if (n >= 1 && n <= 4) return n;
  } catch (e) { /* ignore */ }
  return 3;
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
var btnAuto = document.getElementById('btn-auto');
var speedEl = document.getElementById('speed');
var speedLab = document.getElementById('speed-lab');
var motionQ = window.matchMedia('(prefers-reduced-motion: reduce)');

var grid = emptyGrid();
var score = 0;
var best = loadBest();
var wonThisRun = false;
var overlayMode = null; /* 'win' | 'lose' | null */
var lostPeek = false;
var sprites = [];
var nextId = 1;
var sliding = false;
var animStart = 0;
var queued = null;
var metrics = { cell: 80, gap: 10 };
var lastLayoutW = 0;
var autoOn = false;
var autoSpeed = loadAutoSpeed();
var autoTid = 0;

for (var ci = 0; ci < 16; ci++) {
  var cell = document.createElement('div');
  cell.className = 'cell';
  gridBg.appendChild(cell);
}

function reduceMotion() {
  return motionQ.matches;
}

function snapMoves() {
  return reduceMotion() || (autoOn && autoSpeed >= 4);
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
  return overlayMode !== null || lostPeek;
}

function hideOverlay() {
  overlayMode = null;
  lostPeek = false;
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
  clearAutoTimer();
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
  if (autoOn) scheduleAuto();
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
    if (autoOn) {
      wonThisRun = true;
      sfx.win();
    } else {
      queued = null;
      showOverlay('win', '你到了 2048', '还可以继续合成 4096。');
      sfx.win();
      return;
    }
  }
  if (!canMove(grid)) {
    queued = null;
    showOverlay('lose', '没有空位了', '点空白处可看棋盘。');
    sfx.lose();
    return;
  }
  if (autoOn) {
    queued = null;
    scheduleAuto();
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
  if (inputBlocked()) return;
  if (sliding) {
    if (!autoOn) queued = dir;
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

  measure();
  beginTravel(result.traces);
  sliding = true;
  animStart = performance.now();
  if (snapMoves()) finishTravel(animStart);
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
  if (autoOn) return;
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
  if (key === 'a' || key === 'A' || code === 'KeyA') {
    if (e.repeat) return;
    e.preventDefault();
    toggleAuto();
    return;
  }
  if (key === 'r' || key === 'R' || code === 'KeyR') {
    e.preventDefault();
    newGame();
    return;
  }
  if (e.target === speedEl) return;
  if (inputBlocked() || autoOn) {
    if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown' ||
        key === 'w' || key === 'W' || key === 's' || key === 'S' || key === 'd' || key === 'D') {
      e.preventDefault();
    }
    return;
  }
  var dir = null;
  if (key === 'ArrowLeft') dir = 'left';
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

function clearAutoTimer() {
  if (autoTid) {
    clearTimeout(autoTid);
    autoTid = 0;
  }
}

function scheduleAuto() {
  clearAutoTimer();
  if (!autoOn) return;
  if (inputBlocked()) return;
  autoTid = setTimeout(autoStep, AUTO_DELAY[autoSpeed]);
}

function autoStep() {
  autoTid = 0;
  if (!autoOn) return;
  if (inputBlocked()) return;
  if (sliding) return;
  var dir = pickAiMove(grid);
  if (!dir) return;
  tryMove(dir);
  if (autoOn && !sliding && !inputBlocked()) scheduleAuto();
}

function syncAutoBtn() {
  btnAuto.classList.toggle('on', autoOn);
  btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
  btnAuto.textContent = autoOn ? '停下' : '自动';
  btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
}

function toggleAuto() {
  autoOn = !autoOn;
  queued = null;
  syncAutoBtn();
  if (!autoOn) {
    clearAutoTimer();
    return;
  }
  if (overlayMode === 'win') {
    wonThisRun = true;
    hideOverlay();
  }
  if (!overlayOpen() && !sliding) scheduleAuto();
}

function syncSpeedUI() {
  speedEl.value = String(autoSpeed);
  speedLab.textContent = AUTO_SPEED_NAME[autoSpeed];
  speedEl.title = AUTO_SPEED_NAME[autoSpeed];
  speedEl.setAttribute('aria-valuetext', AUTO_SPEED_NAME[autoSpeed]);
}

function onSpeedInput() {
  var n = parseInt(speedEl.value, 10);
  if (!(n >= 1 && n <= 4)) n = 3;
  autoSpeed = n;
  saveAutoSpeed(n);
  syncSpeedUI();
}

document.getElementById('stage').addEventListener('pointerdown', function () {
  if (!overlayOpen()) boardEl.focus({ preventScroll: true });
});

btnMute.addEventListener('click', toggleMute);
btnAuto.addEventListener('click', toggleAuto);
btnRetry.addEventListener('click', function () { newGame(); });
ovRetry.addEventListener('click', function () { newGame(); });
overlayEl.addEventListener('click', function (e) {
  if (e.target !== overlayEl) return;
  if (overlayMode === 'win') {
    wonThisRun = true;
    hideOverlay();
    if (!canMove(grid)) {
      lostPeek = true;
      showOverlay('lose', '没有空位了', '点空白处可看棋盘。');
      sfx.lose();
      return;
    }
    if (autoOn) scheduleAuto();
    return;
  }
  if (overlayMode === 'lose') {
    lostPeek = true;
    hideOverlay();
  }
});
panelEl.addEventListener('click', function (e) { e.stopPropagation(); });
speedEl.addEventListener('input', onSpeedInput);
speedEl.addEventListener('change', onSpeedInput);
ovContinue.addEventListener('click', function () {
  if (overlayMode !== 'win') return;
  wonThisRun = true;
  hideOverlay();
  if (!canMove(grid)) {
    showOverlay('lose', '没有空位了', '点空白处可看棋盘。');
    sfx.lose();
    return;
  }
  if (autoOn) scheduleAuto();
});

boardEl.addEventListener('animationend', function () {
  boardEl.classList.remove('noop');
});

window.addEventListener('resize', relayout);
if (motionQ.addEventListener) motionQ.addEventListener('change', relayout);

bestEl.textContent = String(best);
syncSpeedUI();
syncAutoBtn();
newGame();
requestAnimationFrame(frame);

}
