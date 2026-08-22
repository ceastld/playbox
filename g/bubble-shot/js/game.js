'use strict';

(function () {
  var COLS = 8;
  var MAX_ROWS = 16;
  var VW = 420;
  var VH = 740;
  var R = 21;
  var D = 42;
  var ROW_H = R * Math.sqrt(3);
  var LEFT = (VW - COLS * D) / 2;
  var RIGHT = LEFT + COLS * D;
  var CEIL0 = 46;
  var FLOOR_Y = 578;
  var SHOOT_X = VW * 0.5;
  var SHOOT_Y = 662;
  var AIM_MAX = 1.28;
  var AIM_SPD = 2.35;
  var SHOT_SPD = 1180;
  var STEP = 1 / 60;
  var TAU = Math.PI * 2;
  var TIMED_SEC = 90;
  var COLLIDE = R * 1.92;
  var COLLIDE2 = COLLIDE * COLLIDE;
  var WARN_SHOTS = 3;
  var COMBO_RESET = 1;
  var BEST_KEY = 'playbox-bubble-shot-best';
  var MUTE_KEY = 'playbox-bubble-shot-mute';
  var MODE_KEY = 'playbox-bubble-shot-mode';
  var AUTO_SPEED_KEY = 'playbox-bubble-shot-auto-speed';
  var AUTO_DELAY = [0, 420, 200, 70, 0];
  var AUTO_SPEED_NAME = ['', '慢', '中', '快', '极快'];

  var MAG = [255, 61, 184];
  var CYN = [0, 240, 255];
  var GOLD = [255, 227, 107];
  var PUR = [180, 108, 255];
  var LIME = [61, 255, 154];
  var HOT = [255, 122, 48];
  var WHITE = [255, 255, 255];

  var PAL = [
    { rgb: MAG, hi: [255, 186, 230], lo: [118, 10, 74], glow: 'rgba(255,61,184,0.55)' },
    { rgb: CYN, hi: [186, 255, 255], lo: [0, 78, 96], glow: 'rgba(0,240,255,0.5)' },
    { rgb: GOLD, hi: [255, 248, 210], lo: [148, 108, 16], glow: 'rgba(255,227,107,0.5)' },
    { rgb: PUR, hi: [226, 196, 255], lo: [72, 28, 132], glow: 'rgba(180,108,255,0.55)' },
    { rgb: LIME, hi: [200, 255, 220], lo: [8, 96, 52], glow: 'rgba(61,255,154,0.5)' },
    { rgb: HOT, hi: [255, 210, 176], lo: [132, 42, 8], glow: 'rgba(255,122,48,0.5)' }
  ];

  var EVEN_N = [[-1, 0], [1, 0], [-1, -1], [0, -1], [-1, 1], [0, 1]];
  var ODD_N = [[-1, 0], [1, 0], [0, -1], [1, -1], [0, 1], [1, 1]];

  var STAGES = [
    { name: '初泡', sub: 'FIRST', rows: 5, colors: 4, dropEvery: 8 },
    { name: '连珠', sub: 'CHAIN', rows: 5, colors: 4, dropEvery: 7 },
    { name: '五彩', sub: 'PENTA', rows: 6, colors: 5, dropEvery: 7 },
    { name: '压顶', sub: 'DROP', rows: 6, colors: 5, dropEvery: 6 },
    { name: '密织', sub: 'DENSE', rows: 6, colors: 6, dropEvery: 6 },
    { name: '急坠', sub: 'FALL', rows: 7, colors: 6, dropEvery: 5 },
    { name: '满弦', sub: 'FULL', rows: 7, colors: 6, dropEvery: 5 },
    { name: '终幕', sub: 'FINALE', rows: 8, colors: 6, dropEvery: 4 }
  ];

  var hasDom = typeof document !== 'undefined';
  var REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function easeOut(t) {
    t = clamp(t, 0, 1);
    return 1 - (1 - t) * (1 - t);
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function mix(a, b, t) {
    return [
      (a[0] + (b[0] - a[0]) * t + 0.5) | 0,
      (a[1] + (b[1] - a[1]) * t + 0.5) | 0,
      (a[2] + (b[2] - a[2]) * t + 0.5) | 0
    ];
  }
  function colsInRow(r) {
    return (r & 1) ? COLS - 1 : COLS;
  }
  function neighbors(c, r) {
    var dirs = (r & 1) ? ODD_N : EVEN_N;
    var out = [];
    var i, nc, nr;
    for (i = 0; i < 6; i++) {
      nc = c + dirs[i][0];
      nr = r + dirs[i][1];
      if (nr < 0 || nr >= MAX_ROWS) continue;
      if (nc < 0 || nc >= colsInRow(nr)) continue;
      out.push({ c: nc, r: nr });
    }
    return out;
  }
  function emptyGrid() {
    var g = [];
    var r, c, row;
    for (r = 0; r < MAX_ROWS; r++) {
      row = [];
      for (c = 0; c < COLS; c++) row.push(-1);
      g.push(row);
    }
    return g;
  }
  function cloneGrid(src) {
    var g = [];
    var r, c, row;
    for (r = 0; r < MAX_ROWS; r++) {
      row = [];
      for (c = 0; c < COLS; c++) row.push(src[r][c]);
      g.push(row);
    }
    return g;
  }
  function cellAt(grid, c, r) {
    if (r < 0 || c < 0 || r >= MAX_ROWS || c >= colsInRow(r)) return -1;
    return grid[r][c];
  }
  function cellX(c, r) {
    return LEFT + R + c * D + ((r & 1) ? R : 0);
  }
  function cellY(r, dropY) {
    return CEIL0 + dropY + R + r * ROW_H;
  }
  function findGroup(grid, c0, r0) {
    var color = cellAt(grid, c0, r0);
    var out = [];
    if (color < 0) return out;
    var seen = {};
    var stack = [{ c: c0, r: r0 }];
    seen[c0 + ',' + r0] = 1;
    while (stack.length) {
      var cur = stack.pop();
      out.push(cur);
      var n = neighbors(cur.c, cur.r);
      var i, k;
      for (i = 0; i < n.length; i++) {
        if (cellAt(grid, n[i].c, n[i].r) !== color) continue;
        k = n[i].c + ',' + n[i].r;
        if (seen[k]) continue;
        seen[k] = 1;
        stack.push(n[i]);
      }
    }
    return out;
  }
  function hangingMap(grid) {
    var seen = {};
    var stack = [];
    var c, k;
    for (c = 0; c < colsInRow(0); c++) {
      if (cellAt(grid, c, 0) < 0) continue;
      k = c + ',0';
      seen[k] = 1;
      stack.push({ c: c, r: 0 });
    }
    while (stack.length) {
      var cur = stack.pop();
      var n = neighbors(cur.c, cur.r);
      var i;
      for (i = 0; i < n.length; i++) {
        if (cellAt(grid, n[i].c, n[i].r) < 0) continue;
        k = n[i].c + ',' + n[i].r;
        if (seen[k]) continue;
        seen[k] = 1;
        stack.push(n[i]);
      }
    }
    return seen;
  }
  function floatersOf(grid) {
    var hang = hangingMap(grid);
    var out = [];
    var r, c, k;
    for (r = 0; r < MAX_ROWS; r++) {
      for (c = 0; c < colsInRow(r); c++) {
        if (grid[r][c] < 0) continue;
        k = c + ',' + r;
        if (!hang[k]) out.push({ c: c, r: r, color: grid[r][c] });
      }
    }
    return out;
  }
  function stripFloaters(grid) {
    var fell = floatersOf(grid);
    var i;
    for (i = 0; i < fell.length; i++) grid[fell[i].r][fell[i].c] = -1;
    return fell;
  }
  function countCells(grid) {
    var n = 0;
    var r, c;
    for (r = 0; r < MAX_ROWS; r++) {
      for (c = 0; c < colsInRow(r); c++) if (grid[r][c] >= 0) n += 1;
    }
    return n;
  }
  function colorsOn(grid) {
    var seen = [];
    var r, c, v;
    for (r = 0; r < MAX_ROWS; r++) {
      for (c = 0; c < colsInRow(r); c++) {
        v = grid[r][c];
        if (v >= 0 && seen.indexOf(v) < 0) seen.push(v);
      }
    }
    return seen;
  }
  function canPlace(grid, c, r) {
    if (r < 0 || r >= MAX_ROWS || c < 0 || c >= colsInRow(r)) return false;
    if (cellAt(grid, c, r) >= 0) return false;
    if (r === 0) return true;
    var n = neighbors(c, r);
    var i;
    for (i = 0; i < n.length; i++) {
      if (cellAt(grid, n[i].c, n[i].r) >= 0) return true;
    }
    return false;
  }
  function scorePop(n, combo) {
    if (n < 3) return 0;
    var k = combo < 1 ? 1 : combo;
    return n * 10 * k;
  }
  function scoreFall(i, combo) {
    var k = combo < 1 ? 1 : combo;
    var base = 20 * Math.pow(2, Math.min(i, 6));
    return base * k;
  }
  function stageAt(round) {
    if (round < STAGES.length) return STAGES[round];
    var last = STAGES[STAGES.length - 1];
    var extra = round - STAGES.length + 1;
    return {
      name: last.name,
      sub: last.sub,
      rows: Math.min(8, last.rows),
      colors: 6,
      dropEvery: Math.max(3, last.dropEvery - extra)
    };
  }
  function fillBoard(rows, nColors, rnd) {
    rnd = rnd || Math.random;
    var g = emptyGrid();
    var r, c, i, n, opts, pick, nb;
    for (r = 0; r < rows; r++) {
      for (c = 0; c < colsInRow(r); c++) {
        if (r >= 2 && rnd() < 0.06) continue;
        opts = [];
        n = neighbors(c, r);
        for (i = 0; i < n.length; i++) {
          nb = cellAt(g, n[i].c, n[i].r);
          if (nb >= 0) opts.push(nb);
        }
        if (opts.length && rnd() < 0.5) pick = opts[(rnd() * opts.length) | 0];
        else pick = (rnd() * nColors) | 0;
        g[r][c] = pick;
      }
    }
    stripFloaters(g);
    return g;
  }
  function makeBoard(rows, nColors, rnd) {
    var g;
    var guard = 24;
    do {
      g = fillBoard(rows, nColors, rnd);
      guard -= 1;
    } while (countCells(g) < rows * 4 && guard > 0);
    return g;
  }
  function resolveAt(grid, c, r) {
    var group = findGroup(grid, c, r);
    var popped = [];
    var fell = [];
    var i;
    if (group.length < 3) return { popped: popped, fell: fell };
    popped = group.slice();
    for (i = 0; i < popped.length; i++) grid[popped[i].r][popped[i].c] = -1;
    fell = floatersOf(grid);
    for (i = 0; i < fell.length; i++) grid[fell[i].r][fell[i].c] = -1;
    return { popped: popped, fell: fell };
  }
  function lowestRow(grid) {
    var r, c, max = -1;
    for (r = 0; r < MAX_ROWS; r++) {
      for (c = 0; c < colsInRow(r); c++) {
        if (grid[r][c] >= 0) max = r;
      }
    }
    return max;
  }
  function findHitOn(grid, dropY, x, y) {
    var best = null;
    var bestD = COLLIDE2;
    var r, c, dx, dy, d, cx, cy;
    for (r = 0; r < MAX_ROWS; r++) {
      cy = cellY(r, dropY);
      if (cy + R + 4 < y - R || cy - R - 4 > y + R) continue;
      for (c = 0; c < colsInRow(r); c++) {
        if (grid[r][c] < 0) continue;
        cx = cellX(c, r);
        dx = cx - x;
        dy = cy - y;
        d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          best = { c: c, r: r };
        }
      }
    }
    return best;
  }
  function placeShotOn(grid, dropY, x, y, hit) {
    var cand = [];
    var seen = {};
    var i, n, p, d, best, bestD, k, rr, cc, ap;
    function add(c, r) {
      if (r < 0 || r >= MAX_ROWS || c < 0 || c >= colsInRow(r)) return;
      if (cellAt(grid, c, r) >= 0) return;
      k = c + ',' + r;
      if (seen[k]) return;
      seen[k] = 1;
      cand.push({ c: c, r: r });
    }
    if (hit) {
      n = neighbors(hit.c, hit.r);
      for (i = 0; i < n.length; i++) add(n[i].c, n[i].r);
    }
    if (y - R <= CEIL0 + dropY + R * 1.2) {
      for (i = 0; i < colsInRow(0); i++) add(i, 0);
    }
    if (!cand.length) {
      ap = {
        r: clamp(Math.round((y - CEIL0 - dropY - R) / ROW_H), 0, MAX_ROWS - 1),
        c: 0
      };
      ap.c = clamp(
        Math.round((x - LEFT - R - ((ap.r & 1) ? R : 0)) / D),
        0,
        colsInRow(ap.r) - 1
      );
      add(ap.c, ap.r);
      n = neighbors(ap.c, ap.r);
      for (i = 0; i < n.length; i++) add(n[i].c, n[i].r);
      for (rr = Math.max(0, ap.r - 2); rr <= Math.min(MAX_ROWS - 1, ap.r + 2); rr++) {
        for (cc = 0; cc < colsInRow(rr); cc++) {
          if (canPlace(grid, cc, rr)) add(cc, rr);
        }
      }
    }
    best = null;
    bestD = 1e15;
    for (i = 0; i < cand.length; i++) {
      p = { x: cellX(cand[i].c, cand[i].r), y: cellY(cand[i].r, dropY) };
      d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
      if (d < bestD) {
        bestD = d;
        best = cand[i];
      }
    }
    return best;
  }
  function simLand(grid, dropY, aim) {
    var x = SHOOT_X + Math.sin(aim) * 26;
    var y = SHOOT_Y - Math.cos(aim) * 26;
    var vx = Math.sin(aim) * SHOT_SPD;
    var vy = -Math.cos(aim) * SHOT_SPD;
    var adt = STEP / 6;
    var i, hit, ceil;
    ceil = CEIL0 + dropY;
    for (i = 0; i < 720; i++) {
      x += vx * adt;
      y += vy * adt;
      if (x < LEFT + R) {
        x = LEFT + R;
        if (vx < 0) vx = -vx;
      } else if (x > RIGHT - R) {
        x = RIGHT - R;
        if (vx > 0) vx = -vx;
      }
      hit = findHitOn(grid, dropY, x, y);
      if (hit) return placeShotOn(grid, dropY, x, y, hit);
      if (y - R <= ceil) return placeShotOn(grid, dropY, x, y, null);
      if (y < -40) break;
    }
    return null;
  }
  function aimToPoint(x, y) {
    var dx = x - SHOOT_X;
    var dy = SHOOT_Y - y;
    if (dy < 10) dy = 10;
    return clamp(Math.atan2(dx, dy), -AIM_MAX, AIM_MAX);
  }
  function bestPopSize(grid, color) {
    var best = 0;
    var r, c, n;
    if (color < 0) return 0;
    for (r = 0; r < MAX_ROWS; r++) {
      for (c = 0; c < colsInRow(r); c++) {
        if (!canPlace(grid, c, r)) continue;
        grid[r][c] = color;
        n = findGroup(grid, c, r).length;
        grid[r][c] = -1;
        if (n > best) best = n;
      }
    }
    return best;
  }
  function evalPlace(grid, c, r, color, nextColor, dropY) {
    var copy = cloneGrid(grid);
    var res;
    var popped;
    var fell;
    var left;
    var sc;
    var grp;
    var nxt;
    var low;
    var threat;
    copy[r][c] = color;
    res = resolveAt(copy, c, r);
    popped = res.popped.length;
    fell = res.fell.length;
    left = countCells(copy);
    low = lowestRow(copy);
    threat = Math.max(0, cellY(low < 0 ? 0 : low, dropY || 0) + R - (FLOOR_Y - 88));
    if (popped >= 3) {
      sc = 900 + popped * 140 + fell * 320;
      if (fell >= 2) sc += fell * 180;
      if (left === 0) sc += 5200;
      sc += r * 12;
    } else {
      grp = findGroup(copy, c, r).length;
      sc = grp * 48 - 140 - r * 16;
      if (grp < 2) sc -= 80;
    }
    nxt = bestPopSize(copy, nextColor);
    if (nxt >= 3) sc += nxt * 70 + 40;
    else sc += nxt * 10;
    sc -= threat * 2.4;
    if (low >= 12) sc -= (low - 11) * 90;
    return { sc: sc, popped: popped, fell: fell, left: left };
  }
  function pickAiAim(grid, dropY, color, nextColor) {
    var seen = {};
    var best = null;
    var bestSc = -1e15;
    var ang;
    var slot;
    var ev;
    var key;
    var r;
    var c;
    var px;
    var py;
    var wallL = LEFT + R;
    var wallR = RIGHT - R;
    function consider(aim) {
      if (aim < -AIM_MAX - 1e-6 || aim > AIM_MAX + 1e-6) return;
      aim = clamp(aim, -AIM_MAX, AIM_MAX);
      slot = simLand(grid, dropY, aim);
      if (!slot) return;
      key = slot.c + ',' + slot.r;
      if (seen[key]) {
        if (Math.abs(aim) < Math.abs(seen[key].aim)) seen[key].aim = aim;
        if (seen[key] === best) best.aim = seen[key].aim;
        return;
      }
      ev = evalPlace(grid, slot.c, slot.r, color, nextColor, dropY);
      seen[key] = { aim: aim, c: slot.c, r: slot.r, sc: ev.sc, popped: ev.popped, fell: ev.fell };
      if (
        ev.sc > bestSc + 0.01 ||
        (Math.abs(ev.sc - bestSc) <= 0.01 && best &&
          (ev.popped > best.popped ||
            (ev.popped === best.popped && ev.fell > best.fell) ||
            (ev.popped === best.popped && ev.fell === best.fell && Math.abs(aim) < Math.abs(best.aim))))
      ) {
        bestSc = ev.sc;
        best = seen[key];
      }
    }
    for (ang = -AIM_MAX; ang <= AIM_MAX + 1e-9; ang += 0.024) consider(ang);
    consider(0);
    consider(-AIM_MAX);
    consider(AIM_MAX);
    for (r = 0; r < MAX_ROWS; r++) {
      for (c = 0; c < colsInRow(r); c++) {
        if (!canPlace(grid, c, r)) continue;
        px = cellX(c, r);
        py = cellY(r, dropY);
        consider(aimToPoint(px, py));
        consider(aimToPoint(2 * wallL - px, py));
        consider(aimToPoint(2 * wallR - px, py));
      }
    }
    return best;
  }
  function playAutoN(maxShots, seed) {
    var rnd = (function (s) {
      return function () {
        s = (s * 1664525 + 1013904223) | 0;
        return (s >>> 0) / 4294967296;
      };
    })(seed || 2026);
    var grid = makeBoard(5, 4, rnd);
    var pops = 0;
    var fells = 0;
    var shots = 0;
    var color;
    var next;
    var cols;
    var pick;
    var slot;
    var res;
    var start = countCells(grid);
    function takeColor(list) {
      if (!list.length) return 0;
      return list[(rnd() * list.length) | 0];
    }
    cols = colorsOn(grid);
    color = takeColor(cols);
    next = takeColor(cols);
    while (shots < maxShots) {
      if (countCells(grid) === 0) break;
      cols = colorsOn(grid);
      if (!cols.length) break;
      if (cols.indexOf(color) < 0) color = takeColor(cols);
      if (cols.indexOf(next) < 0) next = takeColor(cols);
      pick = pickAiAim(grid, 0, color, next);
      if (!pick) break;
      slot = simLand(grid, 0, pick.aim);
      if (!slot) break;
      grid[slot.r][slot.c] = color;
      res = resolveAt(grid, slot.c, slot.r);
      if (res.popped.length >= 3) pops += 1;
      fells += res.fell.length;
      color = next;
      next = takeColor(colorsOn(grid).length ? colorsOn(grid) : cols);
      shots += 1;
    }
    return {
      shots: shots,
      pops: pops,
      fells: fells,
      start: start,
      left: countCells(grid)
    };
  }

  function runSelfTest() {
    var fail = 0;
    function eq(a, b, msg) {
      if (a !== b) {
        fail += 1;
        if (typeof console !== 'undefined') console.error('fail', msg, a, b);
      }
    }
    eq(colsInRow(0), 8, 'even cols');
    eq(colsInRow(1), 7, 'odd cols');
    eq(scorePop(2, 1), 0, 'no pop under 3');
    eq(scorePop(3, 1), 30, '3 pop');
    eq(scorePop(6, 2), 120, '6 x2');
    eq(scoreFall(0, 1), 20, 'fall0');
    eq(scoreFall(1, 1), 40, 'fall1');
    eq(scoreFall(3, 2), 320, 'fall3 x2');

    var n0 = neighbors(1, 0);
    var has = function (list, c, r) {
      var i;
      for (i = 0; i < list.length; i++) if (list[i].c === c && list[i].r === r) return true;
      return false;
    };
    eq(has(n0, 0, 0) && has(n0, 2, 0) && has(n0, 0, 1) && has(n0, 1, 1) ? 1 : 0, 1, 'even nbs');
    var n1 = neighbors(1, 1);
    eq(has(n1, 1, 0) && has(n1, 2, 0) ? 1 : 0, 1, 'odd up nbs');
    eq(has(neighbors(1, 0), 1, 1) && has(neighbors(1, 1), 1, 0) ? 1 : 0, 1, 'sym');

    var g = emptyGrid();
    g[0][0] = 1; g[0][1] = 1; g[1][0] = 1;
    eq(findGroup(g, 0, 0).length, 3, 'group 3');
    g[0][2] = 1;
    eq(findGroup(g, 1, 0).length, 4, 'group 4');
    g[1][1] = 2;
    eq(findGroup(g, 1, 1).length, 1, 'lone 2');

    var g2 = emptyGrid();
    g2[0][0] = 0; g2[0][1] = 0; g2[1][1] = 2;
    g2[0][2] = 0;
    var res = resolveAt(g2, 2, 0);
    eq(res.popped.length, 3, 'pop 3');
    eq(res.fell.length, 1, 'tail fell');
    eq(g2[1][1], -1, 'floater gone');
    eq(countCells(g2), 0, 'cleared');

    var g3 = emptyGrid();
    g3[0][0] = 1; g3[0][1] = 1;
    eq(resolveAt(g3, 0, 0).popped.length, 0, 'pair stays');
    eq(g3[0][0], 1, 'pair kept');

    var gShot = emptyGrid();
    gShot[0][1] = 1; gShot[0][2] = 1;
    gShot[1][1] = 1;
    var shotRes = resolveAt(gShot, 1, 1);
    eq(shotRes.popped.length, 3, 'shoot pair from below');
    eq(gShot[0][1], -1, 'pair popped');

    var g4 = emptyGrid();
    g4[0][3] = 4;
    g4[5][2] = 3;
    var fell = stripFloaters(g4);
    eq(fell.length, 1, 'orphan stripped');
    eq(g4[5][2], -1, 'orphan gone');
    eq(g4[0][3], 4, 'ceiling kept');

    var g5 = emptyGrid();
    g5[0][0] = 0; g5[0][1] = 1;
    eq(canPlace(g5, 0, 1), true, 'place hang');
    eq(canPlace(g5, 6, 6), false, 'no float place');
    eq(canPlace(g5, 2, 0), true, 'ceiling place');

    var board = makeBoard(5, 4);
    eq(countCells(board) > 12 ? 1 : 0, 1, 'board filled');
    eq(floatersOf(board).length, 0, 'no start float');
    eq(colorsOn(board).length >= 1 ? 1 : 0, 1, 'has colors');

    var spec = stageAt(0);
    eq(spec.dropEvery, 8, 'stage0 drop');
    eq(stageAt(7).name, '终幕', 'finale');
    eq(stageAt(10).dropEvery <= 4 ? 1 : 0, 1, 'faster later');

    var gAi = emptyGrid();
    gAi[0][2] = 1; gAi[0][3] = 1;
    var aiPop = pickAiAim(gAi, 0, 1, 2);
    eq(aiPop && simLand(gAi, 0, aiPop.aim) ? 1 : 0, 1, 'ai finds pair');
    var gAiLand = cloneGrid(gAi);
    var aiSlot = simLand(gAiLand, 0, aiPop.aim);
    gAiLand[aiSlot.r][aiSlot.c] = 1;
    var aiRes = resolveAt(gAiLand, aiSlot.c, aiSlot.r);
    eq(aiRes.popped.length >= 3 ? 1 : 0, 1, 'ai pops 3 not random');

    var gDrop = emptyGrid();
    gDrop[0][0] = 1; gDrop[0][1] = 1;
    gDrop[0][4] = 1; gDrop[0][5] = 1;
    gDrop[1][4] = 2;
    var aiDrop = pickAiAim(gDrop, 0, 1, 0);
    var gDropLand = cloneGrid(gDrop);
    var dropSlot = simLand(gDropLand, 0, aiDrop.aim);
    gDropLand[dropSlot.r][dropSlot.c] = 1;
    var dropRes = resolveAt(gDropLand, dropSlot.c, dropSlot.r);
    eq(dropRes.popped.length >= 3 ? 1 : 0, 1, 'ai drop-pop');
    eq(dropRes.fell.length >= 1 ? 1 : 0, 1, 'ai prefers chain drop');

    var gStay = emptyGrid();
    gStay[0][0] = 0; gStay[0][3] = 1; gStay[0][6] = 2;
    var aiStay = pickAiAim(gStay, 0, 0, 1);
    var staySlot = simLand(gStay, 0, aiStay.aim);
    eq(staySlot ? 1 : 0, 1, 'ai setup lands');
    var around0 = 0;
    var nStay = neighbors(staySlot.c, staySlot.r);
    var si;
    for (si = 0; si < nStay.length; si++) {
      if (cellAt(gStay, nStay[si].c, nStay[si].r) === 0) around0 += 1;
    }
    eq(around0 >= 1 || (staySlot.c === 0 && staySlot.r === 0) ? 1 : 0, 1, 'ai attaches same color');

    var autoRun = playAutoN(22, 2026);
    eq(autoRun.pops >= 6 ? 1 : 0, 1, 'ai clears groups over a run');
    eq(autoRun.left < autoRun.start ? 1 : 0, 1, 'ai reduces board');

    if (fail) {
      if (typeof console !== 'undefined') console.error('self-test failures', fail);
      if (typeof process !== 'undefined') process.exit(1);
    } else if (typeof console !== 'undefined') {
      console.log('bubble-shot self-test ok');
    }
  }

  if (!hasDom) {
    runSelfTest();
    return;
  }

  var canvas = document.getElementById('c');
  var ctx = canvas.getContext('2d', { alpha: false });
  var overlay = document.getElementById('overlay');
  var panel = document.getElementById('panel');
  var ovKicker = document.getElementById('ov-kicker');
  var ovTitle = document.getElementById('ov-title');
  var ovLead = document.getElementById('ov-lead');
  var ovOps = document.getElementById('ov-ops');
  var ovCampaign = document.getElementById('ov-campaign');
  var ovTimed = document.getElementById('ov-timed');
  var btnMute = document.getElementById('btn-mute');
  var btnRetry = document.getElementById('btn-retry');
  var btnAuto = document.getElementById('btn-auto');
  var speedEl = document.getElementById('speed');
  var speedLab = document.getElementById('speed-lab');
  var modeCampaignBtn = document.getElementById('mode-campaign');
  var modeTimedBtn = document.getElementById('mode-timed');
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');
  var comboEl = document.getElementById('combo');
  var scoreBox = document.getElementById('score-box');
  var comboBox = document.getElementById('combo-box');
  var scoreAdd = document.getElementById('score-add');
  var timeBox = document.getElementById('time-box');
  var timeEl = document.getElementById('time');
  var stageLabel = document.getElementById('stage-label');
  var tagLabel = document.getElementById('tag-label');
  var pipsEl = document.getElementById('pips');
  var toastEl = document.getElementById('toast');
  var hintEl = document.getElementById('hint');
  var stageEl = document.getElementById('stage');

  var W = 1;
  var H = 1;
  var dpr = 1;
  var scale = 1;
  var ox = 0;
  var oy = 0;
  var last = 0;
  var acc = 0;
  var hidden = false;
  var addTok = 0;
  var toastTok = 0;
  var overlayKind = 'title';
  var frozen = true;

  var particles = [];
  var sparks = [];
  var rings = [];
  var floats = [];
  var motes = [];
  var trails = [];
  var pops = [];
  var falls = [];

  var keys = { l: false, r: false };
  var autoOn = false;
  var autoSpeed = 3;
  var autoMs = 0;
  var autoPlan = null;

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
  function autoTurbo() {
    return autoOn && autoSpeed >= 4;
  }
  function syncAutoUi() {
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }
  function syncSpeedUi() {
    speedEl.value = String(autoSpeed);
    speedLab.textContent = AUTO_SPEED_NAME[autoSpeed];
    speedEl.title = AUTO_SPEED_NAME[autoSpeed];
    speedEl.setAttribute('aria-valuetext', AUTO_SPEED_NAME[autoSpeed]);
  }
  function setAutoSpeed(n) {
    n = parseInt(n, 10);
    if (!(n >= 1 && n <= 4)) n = 3;
    autoSpeed = n;
    saveAutoSpeed(n);
    syncSpeedUi();
  }
  function playHint() {
    if (autoOn && G.mode === 'play' && !frozen) {
      setHint('托管中 · A 或「停下」取消', 'hot');
      return;
    }
    if (G.kind === 'timed') {
      setHint('九十秒冲分 · 对上颜色就爆串 · 清盘接着打', '');
    } else {
      setHint('清八关 · 对上颜色就爆串 · 天花板会往下压', '');
    }
  }
  function clearPlayerAim() {
    keys.l = false;
    keys.r = false;
  }
  function toggleAuto() {
    autoOn = !autoOn;
    autoPlan = null;
    autoMs = 0;
    clearPlayerAim();
    syncAutoUi();
    audio.ensure();
    if (autoOn) {
      if (overlayKind === 'title' || G.mode === 'title') {
        startPlay(G.kind === 'timed' ? 'timed' : 'campaign');
      }
    }
    playHint();
  }
  function tickAuto(dt) {
    if (!autoOn || frozen || G.mode !== 'play') return;
    if (!canShoot()) {
      autoPlan = null;
      return;
    }
    if (!autoPlan) {
      var pick = pickAiAim(G.grid, G.dropY, G.current, G.next);
      if (!pick) return;
      autoPlan = { aim: pick.aim, from: G.aim };
      autoMs = 0;
      if (autoTurbo()) {
        G.aim = pick.aim;
        fire();
        autoPlan = null;
        return;
      }
    }
    autoMs += dt * 1000;
    var wait = AUTO_DELAY[autoSpeed] || 0;
    var t = wait <= 0 ? 1 : Math.min(1, autoMs / Math.max(1, wait));
    var ease = t * t * (3 - 2 * t);
    G.aim = lerp(autoPlan.from, autoPlan.aim, ease);
    if (autoMs >= wait) {
      G.aim = autoPlan.aim;
      fire();
      autoPlan = null;
      autoMs = 0;
    }
  }

  var G = {
    mode: 'title',
    kind: 'campaign',
    phase: 'idle',
    grid: emptyGrid(),
    round: 0,
    rows: 5,
    nColors: 4,
    dropEvery: 8,
    shotsLeft: 8,
    drop: 0,
    dropY: 0,
    dropFrom: 0,
    dropT: 0,
    aim: 0,
    current: 0,
    next: 1,
    shot: null,
    score: 0,
    bestC: 0,
    bestT: 0,
    combo: 1,
    comboChain: false,
    maxCombo: 1,
    time: TIMED_SEC,
    ticking: false,
    pendingTime: false,
    pops: 0,
    biggest: 0,
    dropped: 0,
    startBest: 0,
    lock: 0,
    stop: 0,
    shake: 0,
    kickX: 0,
    kickY: 0,
    punch: 1,
    flash: 0,
    flashRgb: CYN,
    toastT: 0,
    clock: 0,
    lastTickSec: 99,
    pulse: {},
    ghost: null
  };

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
        this.master.gain.value = this.muted ? 0 : 0.32;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.32;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) { /* ignore */ }
    },
    beep: function (freq, dur, type, vol, slide, delay) {
      if (!this.ctx || this.muted) return;
      var t = this.ctx.currentTime + (delay || 0);
      var o = this.ctx.createOscillator();
      var g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.012);
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
        var buf = this.ctx.createBuffer(1, (sr * 0.28) | 0, sr);
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
    shoot: function () {
      this.ensure();
      this.noise(0.05, 0.06, 1400, 'bandpass');
      this.beep(420, 0.08, 'triangle', 0.04, 280);
    },
    bounce: function () {
      this.ensure();
      this.beep(880, 0.04, 'square', 0.025, 440);
    },
    dry: function () {
      this.ensure();
      this.noise(0.09, 0.06, 240, 'lowpass');
      this.beep(170, 0.14, 'sawtooth', 0.035, 70);
    },
    pop: function (n, combo) {
      this.ensure();
      var pitch = 210 + Math.min(n, 14) * 38 + Math.min(combo, 8) * 46;
      this.noise(0.08 + n * 0.006, 0.14 + Math.min(0.12, n * 0.01), 700 + n * 40, 'bandpass');
      this.beep(pitch, 0.1, 'square', 0.058, pitch * 1.9);
      this.beep(pitch * 0.5, 0.14, 'triangle', 0.05, pitch * 0.22);
      if (n >= 5) this.beep(pitch * 1.4, 0.16, 'sine', 0.04, pitch * 2.1, 0.03);
      if (combo >= 3) this.beep(880 + combo * 70, 0.15, 'sine', 0.034, 1500, 0.05);
    },
    fall: function (n) {
      this.ensure();
      var i, max = Math.min(n, 8);
      for (i = 0; i < max; i++) {
        this.beep(500 + i * 95, 0.07, 'sine', 0.038, 760 + i * 90, 0.04 + i * 0.042);
      }
    },
    warn: function () {
      this.ensure();
      this.beep(720, 0.07, 'square', 0.04, 420);
      this.beep(420, 0.12, 'sawtooth', 0.03, 220, 0.07);
    },
    ceiling: function () {
      this.ensure();
      this.noise(0.16, 0.1, 160, 'lowpass');
      this.beep(110, 0.22, 'triangle', 0.05, 48);
    },
    clear: function () {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.06, 784);
      this.beep(784, 0.14, 'triangle', 0.05, 1175, 0.05);
      this.beep(1175, 0.22, 'sine', 0.045, 1568, 0.1);
    },
    win: function () {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06, 659);
      this.beep(659, 0.14, 'triangle', 0.05, 784, 0.06);
      this.beep(784, 0.22, 'sine', 0.05, 1046, 0.12);
    },
    lose: function () {
      this.ensure();
      this.beep(220, 0.2, 'sawtooth', 0.055, 90);
      this.beep(140, 0.36, 'triangle', 0.06, 48, 0.08);
    },
    tick: function () {
      this.ensure();
      this.beep(1480, 0.03, 'sine', 0.02);
    },
    start: function () {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.045, 588);
      this.beep(784, 0.14, 'triangle', 0.04, 1175, 0.05);
    }
  };

  function loadBest() {
    G.bestC = 0;
    G.bestT = 0;
    try {
      var raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      if (raw.charAt(0) === '{') {
        var o = JSON.parse(raw);
        G.bestC = Math.max(0, parseInt(o.campaign, 10) || 0);
        G.bestT = Math.max(0, parseInt(o.timed, 10) || 0);
      } else {
        G.bestC = Math.max(0, parseInt(raw, 10) || 0);
      }
    } catch (e) { /* ignore */ }
  }

  function saveBest() {
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ campaign: G.bestC, timed: G.bestT }));
    } catch (e) { /* ignore */ }
  }

  function currentBest() {
    return G.kind === 'timed' ? G.bestT : G.bestC;
  }

  function maybeBest() {
    if (G.kind === 'timed') {
      if (G.score > G.bestT) {
        G.bestT = G.score;
        saveBest();
        return true;
      }
    } else if (G.score > G.bestC) {
      G.bestC = G.score;
      saveBest();
      return true;
    }
    return false;
  }

  function bumpScore(add) {
    if (add <= 0) return;
    G.score += add;
    maybeBest();
    scoreEl.textContent = String(G.score);
    bestEl.textContent = String(currentBest());
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    addTok += 1;
    var tok = addTok;
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + add;
    scoreAdd.style.animation = 'none';
    void scoreAdd.offsetWidth;
    scoreAdd.style.animation = '';
    setTimeout(function () {
      if (tok === addTok) scoreAdd.hidden = true;
    }, 700);
  }

  function syncCombo() {
    comboEl.textContent = '×' + G.combo;
    comboBox.classList.toggle('hot', G.combo >= 2);
    if (G.combo >= 2) {
      comboBox.classList.remove('flash');
      void comboBox.offsetWidth;
      comboBox.classList.add('flash');
    }
  }

  function showToast(msg, kind) {
    G.toastT = 1.4;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', kind === 'warn');
    toastEl.classList.toggle('gold', kind === 'gold');
    toastEl.classList.remove('hidden');
    toastTok += 1;
  }

  function setHint(text, kind) {
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function renderPips() {
    var n = G.dropEvery;
    var left = G.shotsLeft;
    var warn = left <= WARN_SHOTS && G.mode === 'play';
    var i, el;
    while (pipsEl.childNodes.length > n) pipsEl.removeChild(pipsEl.lastChild);
    while (pipsEl.childNodes.length < n) {
      el = document.createElement('i');
      el.className = 'pip';
      pipsEl.appendChild(el);
    }
    for (i = 0; i < pipsEl.childNodes.length; i++) {
      el = pipsEl.childNodes[i];
      el.classList.toggle('on', i < left);
      el.classList.toggle('warn', warn);
    }
  }

  function renderHud() {
    scoreEl.textContent = String(G.score);
    bestEl.textContent = String(currentBest());
    comboEl.textContent = '×' + G.combo;
    comboBox.classList.toggle('hot', G.combo >= 2);
    var spec = stageAt(G.round);
    var warn = G.mode === 'play' && G.shotsLeft <= WARN_SHOTS;
    if (G.kind === 'timed') {
      stageLabel.textContent = G.ticking ? '限时' : '限时 · 开第一发';
      stageLabel.classList.toggle('hot', G.ticking && G.time < 12);
      timeBox.hidden = false;
      timeEl.textContent = String(Math.ceil(Math.max(0, G.time)));
      timeBox.classList.toggle('low', G.ticking && G.time < 10);
    } else {
      stageLabel.textContent = '第 ' + (G.round + 1) + '/' + STAGES.length + ' · ' + spec.name;
      stageLabel.classList.toggle('hot', warn);
      timeBox.hidden = true;
    }
    if (warn) {
      tagLabel.textContent = '还剩 ' + G.shotsLeft + ' 发';
      tagLabel.className = 'warn';
    } else if (G.combo >= 3) {
      tagLabel.textContent = '连击';
      tagLabel.className = 'hot';
    } else {
      tagLabel.textContent = spec.sub;
      tagLabel.className = '';
    }
    renderPips();
  }

  function setModeUi(kind) {
    document.body.classList.toggle('mode-timed', kind === 'timed');
    document.body.classList.toggle('mode-campaign', kind !== 'timed');
    modeCampaignBtn.setAttribute('aria-pressed', kind !== 'timed' ? 'true' : 'false');
    modeTimedBtn.setAttribute('aria-pressed', kind === 'timed' ? 'true' : 'false');
  }

  function setOverlay(kind) {
    overlayKind = kind;
    frozen = kind !== 'none';
    if (kind === 'none') {
      overlay.classList.add('hidden');
      overlay.classList.remove('end');
      overlay.setAttribute('aria-hidden', 'true');
      panel.classList.remove('win', 'lose', 'time');
      return;
    }
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.toggle('end', kind !== 'title');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    panel.classList.toggle('time', kind === 'time');
    if (kind === 'title') {
      ovKicker.textContent = 'BUBBLE';
      ovTitle.textContent = '泡弹';
      ovLead.textContent = '对上颜色就爆串。三颗同色炸掉，悬空的整串砸下来。';
      ovOps.textContent = '瞄准点按或空格发射 · 方向键微调 · A 自动 · 天花板会往下压';
      ovCampaign.textContent = '闯关';
      ovTimed.textContent = '限时 90s';
    } else if (kind === 'win') {
      maybeBest();
      var rec = G.score > G.startBest;
      ovKicker.textContent = rec ? 'NEW' : 'CLEAR';
      ovTitle.textContent = '通关了';
      ovLead.textContent = '八关清完 · ' + G.score + ' 分 · 最大一爆 ' + G.biggest +
        ' · 连击 ×' + G.maxCombo + (rec ? ' · 新纪录' : ' · 最高 ' + currentBest());
      ovOps.textContent = 'R 重开 · 点弹层外可看盘 · A 自动 · M 静音';
      ovCampaign.textContent = '再闯';
      ovTimed.textContent = '限时';
    } else if (kind === 'lose') {
      maybeBest();
      ovKicker.textContent = 'FLOOR';
      ovTitle.textContent = '贴地了';
      ovLead.textContent = G.score + ' 分 · 第 ' + (G.round + 1) + ' 关 · 炸掉 ' + G.pops +
        ' 次 · 坠落 ' + G.dropped + ' · 最高 ' + currentBest();
      ovOps.textContent = 'R 重开 · 点弹层外可看盘 · A 自动 · M 静音';
      ovCampaign.textContent = '再闯';
      ovTimed.textContent = '限时';
    } else if (kind === 'time') {
      maybeBest();
      var recT = G.score > G.startBest;
      ovKicker.textContent = recT ? 'NEW' : 'TIME';
      ovTitle.textContent = '时间到';
      ovLead.textContent = G.score + ' 分 · 清了 ' + G.round + ' 盘 · 连击 ×' + G.maxCombo +
        (recT ? ' · 新纪录' : ' · 最高 ' + currentBest());
      ovOps.textContent = 'R 重开 · 点弹层外可看盘 · A 自动 · M 静音';
      ovCampaign.textContent = '闯关';
      ovTimed.textContent = '再冲';
    }
    renderHud();
  }

  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }

  function hitStop(sec) {
    if (REDUCE || autoTurbo()) {
      G.stop = Math.max(G.stop, autoTurbo() ? 0 : 0.012);
      return;
    }
    G.stop = Math.max(G.stop, sec);
  }

  function kick(nx, ny, mag) {
    if (REDUCE) {
      G.kickY += ny * mag * 0.25;
      return;
    }
    G.kickX += nx * mag;
    G.kickY += ny * mag;
    G.shake = Math.max(G.shake, mag * 0.55);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.004));
    stageEl.classList.remove('boom');
    void stageEl.offsetWidth;
    stageEl.classList.add('boom');
  }

  function missKick() {
    G.shake = Math.max(G.shake, REDUCE ? 2 : 5);
    stageEl.classList.remove('miss');
    void stageEl.offsetWidth;
    stageEl.classList.add('miss');
  }

  function dieKick() {
    G.shake = Math.max(G.shake, REDUCE ? 3 : 8);
    stageEl.classList.remove('die');
    void stageEl.offsetWidth;
    stageEl.classList.add('die');
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.42);
    G.flashRgb = rgb;
  }

  function emit(n, spec) {
    var i;
    for (i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        r: rand(spec.r0, spec.r1),
        life: rand(spec.life * 0.55, spec.life),
        max: spec.life,
        rgb: spec.rgb,
        g: spec.g == null ? 980 : spec.g,
        rot: rand(0, TAU),
        spin: rand(-10, 10)
      });
    }
    capArr(particles, 420);
  }

  function spark(x, y, rgb, n) {
    var i, a, sp;
    for (i = 0; i < n; i++) {
      a = rand(0, TAU);
      sp = rand(90, 480);
      sparks.push({
        x: x, y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.12, 0.34),
        max: 0.34,
        rgb: rgb,
        w: rand(1.2, 3.6)
      });
    }
    capArr(sparks, 220);
  }

  function ring(x, y, rgb, r0, r1, life) {
    rings.push({ x: x, y: y, rgb: rgb, r0: r0, r1: r1, t: 0, life: life || 0.3 });
  }

  function floatText(x, y, text, rgb, size, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 1.05 : 0.78,
      size: size || 18, gold: !!gold, vy: -86
    });
  }

  function seedMotes() {
    motes.length = 0;
    var i;
    for (i = 0; i < 32; i++) {
      motes.push({
        x: rand(0, W),
        y: rand(0, H),
        s: rand(0.6, 1.8),
        v: rand(6, 18),
        a: rand(0.04, 0.14),
        rgb: Math.random() < 0.55 ? CYN : PUR
      });
    }
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
    seedMotes();
  }

  function toWorld(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    var x = (clientX - rect.left) * (W / Math.max(1, rect.width));
    var y = (clientY - rect.top) * (H / Math.max(1, rect.height));
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function aimAt(x, y) {
    var dx = x - SHOOT_X;
    var dy = SHOOT_Y - y;
    if (dy < 10) dy = 10;
    G.aim = clamp(Math.atan2(dx, dy), -AIM_MAX, AIM_MAX);
  }

  function pickColor(existing) {
    var cols = existing || colorsOn(G.grid);
    if (!cols.length) return (Math.random() * G.nColors) | 0;
    return cols[(Math.random() * cols.length) | 0];
  }

  function refreshQueue() {
    var cols = colorsOn(G.grid);
    if (!cols.length) return;
    if (cols.indexOf(G.current) < 0) G.current = pickColor(cols);
    if (cols.indexOf(G.next) < 0) G.next = pickColor(cols);
  }

  function applyStage() {
    var spec = stageAt(G.round);
    G.rows = spec.rows;
    G.nColors = spec.colors;
    G.dropEvery = spec.dropEvery;
  }

  function buildBoard() {
    G.grid = makeBoard(G.rows, G.nColors);
    G.drop = 0;
    G.dropY = 0;
    G.shotsLeft = G.dropEvery;
    G.pulse = {};
    G.current = pickColor();
    G.next = pickColor();
    if (G.next === G.current && colorsOn(G.grid).length > 1) {
      var guard = 6;
      while (G.next === G.current && guard--) G.next = pickColor();
    }
  }

  function isDead() {
    var dropY = G.drop * ROW_H;
    var r, c, y;
    for (r = 0; r < MAX_ROWS; r++) {
      for (c = 0; c < colsInRow(r); c++) {
        if (G.grid[r][c] < 0) continue;
        y = cellY(r, dropY);
        if (y + R >= FLOOR_Y - 0.5) return true;
      }
    }
    return false;
  }

  function findHit(x, y) {
    return findHitOn(G.grid, G.dropY, x, y);
  }

  function placeShot(x, y, hit) {
    return placeShotOn(G.grid, G.dropY, x, y, hit);
  }

  function peekGhost() {
    if (!canShoot()) {
      G.ghost = null;
      return;
    }
    G.ghost = simLand(G.grid, G.dropY, G.aim);
  }

  function traceAim() {
    var pts = [];
    var x = SHOOT_X + Math.sin(G.aim) * 26;
    var y = SHOOT_Y - Math.cos(G.aim) * 26;
    var vx = Math.sin(G.aim);
    var vy = -Math.cos(G.aim);
    var step = 9;
    var i, hit, ceil;
    ceil = CEIL0 + G.dropY;
    for (i = 0; i < 88; i++) {
      x += vx * step;
      y += vy * step;
      if (x < LEFT + R) { x = LEFT + R; vx = Math.abs(vx); }
      else if (x > RIGHT - R) { x = RIGHT - R; vx = -Math.abs(vx); }
      if (y - R <= ceil) break;
      if (findHit(x, y)) break;
      if (y < 0) break;
      if ((i & 1) === 0) pts.push({ x: x, y: y, a: 1 - i / 96 });
    }
    return pts;
  }

  function setPulse(c, r, sx, sy, flash) {
    G.pulse[c + ',' + r] = { sx: sx, sy: sy, flash: flash || 0 };
  }

  function centroidCells(list) {
    var x = 0, y = 0, i;
    if (!list.length) return { x: SHOOT_X, y: 180 };
    for (i = 0; i < list.length; i++) {
      x += cellX(list[i].c, list[i].r);
      y += cellY(list[i].r, G.dropY);
    }
    return { x: x / list.length, y: y / list.length };
  }

  function burstAt(x, y, pal, n) {
    emit(REDUCE ? 4 : n, {
      x: x, y: y, j: R * 0.4,
      vx0: -260, vx1: 260, vy0: -380, vy1: 90,
      r0: 1.6, r1: R * 0.28, life: 0.46, rgb: pal.rgb, g: 900
    });
    spark(x, y, pal.hi, REDUCE ? 3 : 8);
    ring(x, y, pal.rgb, R * 0.4, R * 2.4, 0.32);
  }

  function afterLand(c, r) {
    var group = findGroup(G.grid, c, r);
    var pal = PAL[G.grid[r][c]] || PAL[0];
    var p = { x: cellX(c, r), y: cellY(r, G.dropY) };
    setPulse(c, r, 1.22, 0.72, 0.55);
    if (group.length < 3) {
      G.combo = COMBO_RESET;
      G.comboChain = false;
      syncCombo();
      audio.dry();
      missKick();
      screenFlash(MAG, 0.12);
      emit(REDUCE ? 2 : 5, {
        x: p.x, y: p.y, j: 4,
        vx0: -80, vx1: 80, vy0: -120, vy1: 20,
        r0: 1.2, r1: 3.2, life: 0.22, rgb: pal.rgb, g: 700
      });
      afterShotSettled();
      return;
    }

    if (G.comboChain) G.combo += 1;
    else G.combo = 1;
    G.comboChain = true;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    G.pops += 1;
    if (group.length > G.biggest) G.biggest = group.length;

    var add = scorePop(group.length, G.combo);
    var mid = centroidCells(group);
    var i, cell, col, px, py, fell, stop, fpal, fs;
    stop = clamp(0.038 + group.length * 0.004 + G.combo * 0.004, 0.034, 0.078);
    hitStop(stop);
    kick(rand(-0.35, 0.35), 1, 6 + group.length * 0.65 + G.combo * 0.45);
    screenFlash(pal.rgb, 0.3 + Math.min(0.32, group.length * 0.02));
    audio.pop(group.length, G.combo);

    for (i = 0; i < group.length; i++) {
      cell = group[i];
      col = G.grid[cell.r][cell.c];
      px = cellX(cell.c, cell.r);
      py = cellY(cell.r, G.dropY);
      pops.push({ x: px, y: py, color: col, t: 0, life: 0.16 });
      G.grid[cell.r][cell.c] = -1;
      burstAt(px, py, PAL[col] || pal, REDUCE ? 5 : 11);
    }
    emit(REDUCE ? 6 : 16 + group.length, {
      x: mid.x, y: mid.y, j: R * 0.7,
      vx0: -300, vx1: 300, vy0: -460, vy1: 40,
      r0: 2, r1: R * 0.32, life: 0.52, rgb: pal.hi, g: 820
    });
    spark(mid.x, mid.y, WHITE, REDUCE ? 4 : 12);

    fell = floatersOf(G.grid);
    for (i = 0; i < fell.length; i++) {
      cell = fell[i];
      px = cellX(cell.c, cell.r);
      py = cellY(cell.r, G.dropY);
      fs = scoreFall(i, G.combo);
      add += fs;
      G.dropped += 1;
      fpal = PAL[cell.color] || pal;
      falls.push({
        x: px, y: py,
        vx: rand(-50, 50),
        vy: rand(40, 90),
        color: cell.color,
        rot: rand(0, TAU),
        spin: rand(-6, 6),
        t: 0,
        score: fs,
        scored: false,
        delay: 0.05 + i * 0.045
      });
      G.grid[cell.r][cell.c] = -1;
      ring(px, py, fpal.rgb, R * 0.2, R * 1.6, 0.22);
    }
    if (fell.length) audio.fall(fell.length);

    var label = '+' + add;
    if (G.combo >= 2) label += ' ×' + G.combo;
    floatText(mid.x, mid.y - 8, label, pal.hi, group.length >= 6 ? 28 : 20, group.length >= 5 || G.combo >= 3);
    if (fell.length >= 3) {
      floatText(mid.x, mid.y + 18, '坠落 ' + fell.length, GOLD, 16, true);
      showToast('坠落 ' + fell.length, 'gold');
    } else if (group.length >= 6) showToast('大爆 ' + group.length, 'gold');
    else if (G.combo >= 4) showToast('连击 ×' + G.combo, 'gold');

    bumpScore(add);
    syncCombo();
    G.phase = 'resolve';
    G.lock = autoTurbo() ? 0.02 : (REDUCE ? 0.1 : clamp(0.14 + fell.length * 0.012, 0.14, 0.3));
    refreshQueue();
  }

  function afterShotSettled() {
    if (G.mode !== 'play') return;
    if (G.pendingTime) {
      endGame('time');
      return;
    }
    if (countCells(G.grid) === 0) {
      onClear();
      return;
    }
    if (isDead()) {
      endGame('lose');
      return;
    }
    G.shotsLeft -= 1;
    if (G.shotsLeft === 3 || G.shotsLeft === 2 || G.shotsLeft === 1) {
      audio.warn();
      showToast(G.shotsLeft === 1 ? '最后一发！' : '还剩 ' + G.shotsLeft + ' 发', 'warn');
      setHint('天花板要压下来了 · 还剩 ' + G.shotsLeft + ' 发', 'warn');
    }
    renderHud();
    if (G.shotsLeft <= 0) {
      startCeilingDrop();
      return;
    }
    refreshQueue();
    G.phase = 'idle';
    G.lock = autoTurbo() ? 0 : 0.04;
  }

  function onClear() {
    var bonus = 400 + (G.round + 1) * 120;
    bumpScore(bonus);
    floatText(VW * 0.5, VH * 0.28, '清盘 +' + bonus, GOLD, 28, true);
    audio.clear();
    hitStop(0.055);
    kick(0, 1, 8);
    screenFlash(GOLD, 0.42);
    showToast('清盘', 'gold');
    if (G.kind === 'campaign' && G.round >= STAGES.length - 1) {
      bumpScore(1000);
      floatText(VW * 0.5, VH * 0.36, '通关 +1000', GOLD, 22, true);
      endGame('win');
      return;
    }
    G.phase = 'clear';
    G.lock = autoTurbo() ? 0.04 : (REDUCE ? 0.18 : 0.48);
  }

  function nextRound() {
    G.round += 1;
    applyStage();
    buildBoard();
    G.phase = 'idle';
    G.lock = 0.12;
    var spec = stageAt(G.round);
    showToast((G.kind === 'timed' ? '下一盘 · ' : '第 ' + (G.round + 1) + ' 关 · ') + spec.name, 'gold');
    if (autoOn) playHint();
    else setHint(spec.name + ' · 压顶更快了', 'hot');
    renderHud();
    kick(0, 0.4, 4);
    screenFlash(CYN, 0.2);
  }

  function startCeilingDrop() {
    G.phase = 'ceiling';
    G.drop += 1;
    G.dropFrom = G.dropY;
    G.dropT = 0;
    audio.ceiling();
    kick(0, 1.4, 7);
    screenFlash(MAG, 0.22);
    showToast('天花板下压', 'warn');
  }

  function finishCeiling() {
    G.dropY = G.drop * ROW_H;
    G.shotsLeft = G.dropEvery;
    if (isDead()) {
      endGame('lose');
      return;
    }
    if (G.pendingTime) {
      endGame('time');
      return;
    }
    refreshQueue();
    G.phase = 'idle';
    G.lock = autoTurbo() ? 0 : 0.06;
    if (autoOn) playHint();
    else setHint('瞄准同色 · 三颗起爆 · 悬空坠落加分', '');
    renderHud();
  }

  function landShot(shot, hit) {
    var slot = placeShot(shot.x, shot.y, hit);
    G.shot = null;
    if (!slot) {
      audio.dry();
      afterShotSettled();
      return;
    }
    G.grid[slot.r][slot.c] = shot.color;
    afterLand(slot.c, slot.r);
  }

  function fire() {
    if (!canShoot()) return;
    audio.ensure();
    if (G.kind === 'timed' && !G.ticking) G.ticking = true;
    var ang = G.aim;
    G.shot = {
      x: SHOOT_X + Math.sin(ang) * 26,
      y: SHOOT_Y - Math.cos(ang) * 26,
      vx: Math.sin(ang) * SHOT_SPD,
      vy: -Math.cos(ang) * SHOT_SPD,
      color: G.current,
      trail: 0
    };
    G.current = G.next;
    G.next = pickColor();
    G.phase = 'fly';
    audio.shoot();
    spark(G.shot.x, G.shot.y, PAL[G.shot.color].hi, REDUCE ? 3 : 7);
    emit(REDUCE ? 3 : 8, {
      x: G.shot.x, y: G.shot.y, j: 4,
      vx0: -G.shot.vx * 0.15, vx1: G.shot.vx * 0.05,
      vy0: 40, vy1: 120,
      r0: 1.2, r1: 3.4, life: 0.22, rgb: PAL[G.shot.color].rgb, g: 500
    });
  }

  function canShoot() {
    return G.mode === 'play' && !frozen && G.phase === 'idle' && !G.shot && G.lock <= 0;
  }

  function stepShot(dt) {
    var s = G.shot;
    if (!s) return;
    var sub = 6;
    var adt = dt / sub;
    var i, hit, bounced;
    for (i = 0; i < sub; i++) {
      bounced = false;
      s.x += s.vx * adt;
      s.y += s.vy * adt;
      if (s.x < LEFT + R) {
        s.x = LEFT + R;
        if (s.vx < 0) { s.vx = -s.vx; bounced = true; }
      } else if (s.x > RIGHT - R) {
        s.x = RIGHT - R;
        if (s.vx > 0) { s.vx = -s.vx; bounced = true; }
      }
      if (bounced) {
        audio.bounce();
        spark(s.x, s.y, WHITE, REDUCE ? 2 : 5);
      }
      hit = findHit(s.x, s.y);
      if (hit) {
        landShot(s, hit);
        return;
      }
      if (s.y - R <= CEIL0 + G.dropY) {
        landShot(s, null);
        return;
      }
    }
    trails.push({
      x: s.x, y: s.y, rgb: PAL[s.color].rgb,
      life: 0.16, max: 0.16, r: R * 0.55
    });
    capArr(trails, 48);
  }

  function endGame(kind) {
    G.mode = 'end';
    G.phase = 'idle';
    G.shot = null;
    G.ticking = false;
    G.pendingTime = false;
    maybeBest();
    renderHud();
    if (kind === 'win') {
      audio.win();
      screenFlash(GOLD, 0.5);
      kick(0, 1, 8);
      setOverlay('win');
    } else if (kind === 'time') {
      audio.lose();
      setOverlay('time');
    } else {
      audio.lose();
      dieKick();
      screenFlash(MAG, 0.4);
      setOverlay('lose');
    }
    setHint('R 重开 · 点弹层外可看盘', kind === 'win' ? 'hot' : 'warn');
  }

  function startPlay(kind) {
    audio.start();
    G.kind = kind === 'timed' ? 'timed' : 'campaign';
    G.mode = 'play';
    G.round = 0;
    applyStage();
    G.score = 0;
    G.combo = 1;
    G.comboChain = false;
    G.maxCombo = 1;
    G.time = TIMED_SEC;
    G.ticking = false;
    G.pendingTime = false;
    G.pops = 0;
    G.biggest = 0;
    G.dropped = 0;
    G.aim = 0;
    G.stop = 0;
    G.shake = 0;
    G.kickX = 0;
    G.kickY = 0;
    G.punch = 1;
    G.flash = 0;
    G.lock = 0.08;
    G.lastTickSec = 99;
    G.startBest = currentBest();
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    trails.length = 0;
    pops.length = 0;
    falls.length = 0;
    buildBoard();
    G.phase = 'idle';
    setModeUi(G.kind);
    setOverlay('none');
    try { localStorage.setItem(MODE_KEY, G.kind); } catch (e) { /* ignore */ }
    scoreAdd.hidden = true;
    G.toastT = 0;
    toastEl.classList.add('hidden');
    syncCombo();
    renderHud();
    var spec = stageAt(0);
    showToast(G.kind === 'timed' ? '90 秒冲分' : spec.name, 'gold');
    autoPlan = null;
    autoMs = 0;
    canvas.focus();
    playHint();
  }

  function retry() {
    audio.ensure();
    startPlay(G.kind === 'timed' ? 'timed' : 'campaign');
  }

  function drawBall(x, y, rad, pal, sx, sy, flash, glow) {
    var g, fill;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx || 1, sy || 1);
    if (glow) {
      ctx.shadowColor = pal.glow;
      ctx.shadowBlur = glow;
    }
    fill = flash ? mix(pal.rgb, WHITE, Math.min(1, flash)) : pal.rgb;
    g = ctx.createRadialGradient(-rad * 0.32, -rad * 0.34, rad * 0.08, 0, rad * 0.1, rad);
    g.addColorStop(0, rgba(pal.hi, 1));
    g.addColorStop(0.42, rgba(fill, 1));
    g.addColorStop(1, rgba(pal.lo, 1));
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, TAU);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.save();
    ctx.translate(-rad * 0.28, -rad * 0.34);
    ctx.scale(1, 0.62);
    ctx.beginPath();
    ctx.arc(0, 0, rad * 0.34, 0, TAU);
    ctx.fillStyle = rgba(WHITE, 0.42 + (flash ? 0.2 : 0));
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(0, 0, rad - 0.7, 0, TAU);
    ctx.strokeStyle = rgba(pal.hi, 0.38);
    ctx.lineWidth = 1.15;
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    var i, p, a, k, r, c, pal, px, py, pulse, breathe, sx, sy;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#03010a';
    ctx.fillRect(0, 0, W, H);

    var bg = ctx.createRadialGradient(W * 0.5, H * 0.18, 12, W * 0.5, H * 0.42, Math.max(W, H) * 0.72);
    bg.addColorStop(0, 'rgba(0,240,255,0.08)');
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    for (i = 0; i < motes.length; i++) {
      p = motes[i];
      ctx.fillStyle = rgba(p.rgb, p.a);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, TAU);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    var skx = (Math.random() * 2 - 1) * G.shake * 0.32 + G.kickX;
    var sky = (Math.random() * 2 - 1) * G.shake * 0.32 + G.kickY;
    ctx.translate(skx, sky);
    ctx.translate(VW * 0.5, VH * 0.5);
    ctx.scale(G.punch, G.punch);
    ctx.translate(-VW * 0.5, -VH * 0.5);

    ctx.fillStyle = 'rgba(8,12,22,0.92)';
    ctx.beginPath();
    ctx.rect(LEFT - 10, CEIL0 + G.dropY - 18, RIGHT - LEFT + 20, FLOOR_Y - (CEIL0 + G.dropY) + 28);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.rect(LEFT - 2, CEIL0 + G.dropY - 8, RIGHT - LEFT + 4, FLOOR_Y - (CEIL0 + G.dropY) + 10);
    ctx.clip();

    for (r = 0; r < MAX_ROWS; r++) {
      for (c = 0; c < colsInRow(r); c++) {
        px = cellX(c, r);
        py = cellY(r, G.dropY);
        if (py > FLOOR_Y + R) continue;
        ctx.beginPath();
        ctx.arc(px, py, R * 0.92, 0, TAU);
        ctx.fillStyle = 'rgba(0,240,255,0.035)';
        ctx.fill();
      }
    }

    var threat = 0;
    for (r = 0; r < MAX_ROWS; r++) {
      for (c = 0; c < colsInRow(r); c++) {
        if (G.grid[r][c] < 0) continue;
        py = cellY(r, G.dropY);
        threat = Math.max(threat, (py + R - (FLOOR_Y - 90)) / 90);
      }
    }
    threat = clamp(threat, 0, 1);

    for (r = 0; r < MAX_ROWS; r++) {
      for (c = 0; c < colsInRow(r); c++) {
        if (G.grid[r][c] < 0) continue;
        pal = PAL[G.grid[r][c]] || PAL[0];
        px = cellX(c, r);
        py = cellY(r, G.dropY);
        pulse = G.pulse[c + ',' + r];
        sx = pulse ? pulse.sx : 1;
        sy = pulse ? pulse.sy : 1;
        breathe = REDUCE ? 0 : Math.sin(G.clock * 2.4 + c * 0.7 + r * 0.5) * 0.03;
        drawBall(px, py, R - 0.4, pal, sx * (1 + breathe), sy * (1 - breathe * 0.6), pulse ? pulse.flash : 0, 10);
      }
    }

    if (G.ghost && canShoot()) {
      px = cellX(G.ghost.c, G.ghost.r);
      py = cellY(G.ghost.r, G.dropY);
      pal = PAL[G.current] || PAL[0];
      ctx.beginPath();
      ctx.arc(px, py, R - 1, 0, TAU);
      ctx.strokeStyle = rgba(pal.rgb, 0.55);
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = rgba(pal.rgb, 0.12);
      ctx.fill();
    }

    for (i = 0; i < pops.length; i++) {
      p = pops[i];
      pal = PAL[p.color] || PAL[0];
      k = clamp(p.t / p.life, 0, 1);
      drawBall(p.x, p.y, R * (1 + k * 0.55), pal, 1 + k * 0.4, 1 + k * 0.4, 0.8, 16);
    }

    ctx.restore();

    var ceilY = CEIL0 + G.dropY;
    ctx.fillStyle = '#0a2430';
    ctx.fillRect(LEFT - 12, 18, RIGHT - LEFT + 24, ceilY - 18);
    ctx.fillStyle = rgba(CYN, 0.55);
    ctx.fillRect(LEFT - 12, ceilY - 5, RIGHT - LEFT + 24, 5);
    ctx.beginPath();
    ctx.moveTo(LEFT - 12, ceilY);
    for (i = 0; i <= 16; i++) {
      var tx = LEFT - 12 + (RIGHT - LEFT + 24) * (i / 16);
      ctx.lineTo(tx, ceilY + ((i & 1) ? 9 : 2));
    }
    ctx.lineTo(RIGHT + 12, ceilY);
    ctx.closePath();
    ctx.fillStyle = '#10303c';
    ctx.fill();
    ctx.strokeStyle = rgba(CYN, 0.7);
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.strokeStyle = rgba(MAG, 0.35 + threat * 0.5 + (G.shotsLeft <= 3 ? 0.2 : 0));
    ctx.lineWidth = 1.4;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(LEFT - 4, FLOOR_Y);
    ctx.lineTo(RIGHT + 4, FLOOR_Y);
    ctx.stroke();
    ctx.setLineDash([]);
    if (threat > 0.35 || G.shotsLeft <= 3) {
      ctx.fillStyle = rgba(MAG, 0.04 + threat * 0.1);
      ctx.fillRect(LEFT - 4, FLOOR_Y, RIGHT - LEFT + 8, 8);
    }

    ctx.fillStyle = 'rgba(0,240,255,0.22)';
    ctx.fillRect(LEFT - 11, ceilY, 5, FLOOR_Y - ceilY + 8);
    ctx.fillRect(RIGHT + 6, ceilY, 5, FLOOR_Y - ceilY + 8);

    for (i = 0; i < falls.length; i++) {
      p = falls[i];
      pal = PAL[p.color] || PAL[0];
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      drawBall(0, 0, R * 0.92, pal, 0.92, 1.08, 0.15, 8);
      ctx.restore();
    }

    if (G.mode === 'play' && !G.shot && (overlayKind === 'none' || overlayKind === 'title')) {
      var path = traceAim();
      pal = PAL[G.current] || PAL[0];
      for (i = 0; i < path.length; i++) {
        p = path[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, i === path.length - 1 ? 4.2 : 2.1, 0, TAU);
        ctx.fillStyle = rgba(pal.rgb, 0.18 + p.a * 0.45);
        ctx.fill();
      }
    }

    for (i = 0; i < trails.length; i++) {
      p = trails[i];
      a = p.life / p.max;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * a, 0, TAU);
      ctx.fillStyle = rgba(p.rgb, 0.22 * a);
      ctx.fill();
    }

    if (G.shot) {
      pal = PAL[G.shot.color] || PAL[0];
      drawBall(G.shot.x, G.shot.y, R - 0.2, pal, 1.05, 0.92, 0.12, 16);
    }

    ctx.save();
    ctx.translate(SHOOT_X, SHOOT_Y + 8);
    ctx.fillStyle = '#0c1822';
    ctx.beginPath();
    ctx.arc(0, 12, 30, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(CYN, 0.7);
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0,240,255,0.45)';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.rotate(G.aim);
    var barrel = ctx.createLinearGradient(-12, 8, 12, -30);
    barrel.addColorStop(0, '#0a2834');
    barrel.addColorStop(0.45, '#1a4c5c');
    barrel.addColorStop(1, '#7af0ff');
    ctx.fillStyle = barrel;
    ctx.beginPath();
    ctx.moveTo(-11, 8);
    ctx.lineTo(-8, -28);
    ctx.lineTo(8, -28);
    ctx.lineTo(11, 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(CYN, 0.85);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = rgba(WHITE, 0.18);
    ctx.fillRect(-3.5, -26, 2.2, 28);
    ctx.restore();

    if (!G.shot) {
      pal = PAL[G.current] || PAL[0];
      drawBall(
        SHOOT_X + Math.sin(G.aim) * 26,
        SHOOT_Y - Math.cos(G.aim) * 26,
        R - 0.6, pal, 1, 1, 0, 12
      );
    }
    pal = PAL[G.next] || PAL[0];
    drawBall(SHOOT_X + 58, SHOOT_Y + 10, R * 0.62, pal, 1, 1, 0, 8);
    ctx.font = '700 9px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillStyle = rgba(CYN, 0.7);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('下一个', SHOOT_X + 58, SHOOT_Y + 10 + R * 0.72);

    for (i = 0; i < rings.length; i++) {
      p = rings[i];
      k = p.t / p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, lerp(p.r0, p.r1, k), 0, TAU);
      ctx.strokeStyle = rgba(p.rgb, 0.72 * (1 - k));
      ctx.lineWidth = 3.2 * (1 - k);
      ctx.stroke();
    }
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      a = p.life / p.max;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = rgba(p.rgb, 0.2 + 0.8 * a);
      ctx.fillRect(-p.r, -p.r * 0.45, p.r * 2, p.r * 0.9);
      ctx.restore();
    }
    for (i = 0; i < sparks.length; i++) {
      p = sparks[i];
      a = p.life / p.max;
      ctx.strokeStyle = rgba(p.rgb, a);
      ctx.lineWidth = p.w * a;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.018, p.y - p.vy * 0.018);
      ctx.stroke();
    }
    for (i = 0; i < floats.length; i++) {
      p = floats[i];
      k = p.t / p.life;
      ctx.globalAlpha = k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88;
      ctx.font = (p.gold ? '800 ' : '700 ') + p.size + 'px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = rgba(p.gold ? GOLD : p.rgb, 1);
      ctx.shadowColor = rgba(p.rgb, 0.65);
      ctx.shadowBlur = 12;
      ctx.fillText(p.text, p.x, p.y);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.42);
      ctx.fillRect(0, 0, W, H);
    }
  }

  function stepFx(dt) {
    var i, p, key;
    G.toastT = Math.max(0, G.toastT - dt);
    if (G.toastT <= 0 && !toastEl.classList.contains('hidden')) toastEl.classList.add('hidden');
    G.flash = Math.max(0, G.flash - dt * 2.5);
    G.shake *= Math.pow(0.0004, dt);
    if (G.shake < 0.12) G.shake = 0;
    G.kickX *= Math.pow(0.0008, dt);
    G.kickY *= Math.pow(0.0008, dt);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.00025, dt));

    for (key in G.pulse) {
      if (!G.pulse.hasOwnProperty(key)) continue;
      p = G.pulse[key];
      p.sx = lerp(p.sx, 1, 1 - Math.pow(0.0002, dt));
      p.sy = lerp(p.sy, 1, 1 - Math.pow(0.0002, dt));
      p.flash = Math.max(0, p.flash - dt * 3.4);
      if (Math.abs(p.sx - 1) < 0.01 && p.flash <= 0) delete G.pulse[key];
    }

    for (i = 0; i < motes.length; i++) {
      p = motes[i];
      p.y -= p.v * dt;
      if (p.y < -6) { p.y = H + 6; p.x = rand(0, W); }
    }
    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.vx *= 0.985;
      p.rot += p.spin * dt;
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      p = sparks[i];
      p.life -= dt;
      if (p.life <= 0) { sparks.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.9;
      p.vy *= 0.9;
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t >= rings[i].life) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      p = floats[i];
      p.t += dt;
      p.y += p.vy * dt;
      if (p.t >= p.life) floats.splice(i, 1);
    }
    for (i = trails.length - 1; i >= 0; i--) {
      trails[i].life -= dt;
      if (trails[i].life <= 0) trails.splice(i, 1);
    }
    for (i = pops.length - 1; i >= 0; i--) {
      pops[i].t += dt;
      if (pops[i].t >= pops[i].life) pops.splice(i, 1);
    }
    for (i = falls.length - 1; i >= 0; i--) {
      p = falls[i];
      p.t += dt;
      p.vy += 1480 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      if (!p.scored && p.t >= p.delay) {
        p.scored = true;
        floatText(p.x, p.y, '+' + p.score, GOLD, p.score >= 160 ? 20 : 14, p.score >= 80);
      }
      if (p.y > VH + 40 || p.t > 1.6) falls.splice(i, 1);
    }
  }

  function update(dt) {
    if (G.stop > 0) {
      G.stop -= dt;
      G.clock += dt;
      stepFx(dt * 0.22);
      return;
    }
    G.clock += dt;
    stepFx(dt);
    G.lock = Math.max(0, G.lock - dt);

    if (frozen) {
      if (overlayKind === 'title' && !autoOn) {
        G.aim = Math.sin(G.clock * 0.65) * 0.52;
      }
      return;
    }

    if (G.mode !== 'play') return;

    if (!autoOn) {
      if (keys.l) G.aim = Math.max(-AIM_MAX, G.aim - AIM_SPD * dt);
      if (keys.r) G.aim = Math.min(AIM_MAX, G.aim + AIM_SPD * dt);
    }

    if (G.kind === 'timed' && G.ticking) {
      G.time -= dt;
      if (G.time < 10) {
        var sec = Math.ceil(G.time);
        if (sec !== G.lastTickSec && sec >= 0) {
          G.lastTickSec = sec;
          audio.tick();
          renderHud();
        }
      }
      if (G.time <= 0) {
        G.time = 0;
        G.ticking = false;
        if (G.shot || G.phase !== 'idle') G.pendingTime = true;
        else endGame('time');
      }
    }

    if (G.phase === 'fly' && G.shot) stepShot(dt);
    else if (G.phase === 'resolve') {
      if (G.lock <= 0) afterShotSettled();
    } else if (G.phase === 'clear') {
      if (G.lock <= 0) nextRound();
    } else if (G.phase === 'ceiling') {
      G.dropT += dt;
      kEase(dt);
    } else if (G.phase === 'idle') {
      peekGhost();
      if (autoOn) tickAuto(dt);
    }
  }

  function kEase() {
    var k = easeOut(clamp(G.dropT / 0.24, 0, 1));
    G.dropY = lerp(G.dropFrom, G.drop * ROW_H, k);
    if (G.dropT >= 0.24) finishCeiling();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) { last = now; return; }
    var dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    var steps = 0;
    while (acc >= STEP && steps < 5) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    draw();
  }

  function onPointerMove(ev) {
    if (autoOn) return;
    if (frozen && overlayKind !== 'title') return;
    var w = toWorld(ev.clientX, ev.clientY);
    if (G.mode === 'play' && !frozen) aimAt(w.x, w.y);
  }

  function onPointerDown(ev) {
    if (ev.button != null && ev.button !== 0) return;
    audio.ensure();
    if (overlayKind === 'title') return;
    if (frozen && overlayKind !== 'none') return;
    if (G.mode !== 'play') return;
    if (autoOn) return;
    var w = toWorld(ev.clientX, ev.clientY);
    aimAt(w.x, w.y);
    fire();
    ev.preventDefault();
  }

  function onKeyDown(ev) {
    var k = ev.key;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      ev.preventDefault();
      return;
    }
    if (k === 'r' || k === 'R') {
      retry();
      ev.preventDefault();
      return;
    }
    if (k === 'a' || k === 'A') {
      if (ev.repeat) return;
      audio.ensure();
      toggleAuto();
      ev.preventDefault();
      return;
    }
    if (ev.target === speedEl) return;
    audio.ensure();
    if (k === ' ' || k === 'Enter') {
      ev.preventDefault();
      if (overlayKind === 'title') { startPlay('campaign'); return; }
      if (overlayKind !== 'none' && overlayKind !== 'title') { retry(); return; }
      if (autoOn) return;
      fire();
      return;
    }
    if (autoOn) {
      if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'd' || k === 'D') ev.preventDefault();
      return;
    }
    if (k === 'ArrowLeft') {
      keys.l = true;
      ev.preventDefault();
    } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
      keys.r = true;
      ev.preventDefault();
    }
  }

  function onKeyUp(ev) {
    var k = ev.key;
    if (k === 'ArrowLeft') keys.l = false;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.r = false;
  }

  function boot() {
    loadBest();
    try {
      if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
    } catch (e) { /* ignore */ }
    var kind = 'campaign';
    try {
      var m = localStorage.getItem(MODE_KEY);
      if (m === 'timed') kind = 'timed';
    } catch (e) { /* ignore */ }
    G.kind = kind;
    setModeUi(kind);
    applyStage();
    buildBoard();
    G.mode = 'title';
    G.phase = 'idle';
    autoSpeed = loadAutoSpeed();
    syncSpeedUi();
    syncAutoUi();
    renderHud();
    setOverlay('title');
    resize();
    last = performance.now();
    requestAnimationFrame(frame);

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () {
      hidden = document.hidden;
      if (!hidden) last = performance.now();
    });
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    overlay.addEventListener('pointerdown', function (ev) {
      if (ev.target === overlay && overlayKind !== 'title') setOverlay('none');
    });
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
    btnRetry.addEventListener('click', retry);
    btnAuto.addEventListener('click', function () { toggleAuto(); });
    speedEl.addEventListener('input', function () { setAutoSpeed(speedEl.value); });
    speedEl.addEventListener('change', function () { setAutoSpeed(speedEl.value); });
    modeCampaignBtn.addEventListener('click', function () {
      if (G.kind === 'campaign' && G.mode === 'play' && overlayKind === 'none') return;
      startPlay('campaign');
    });
    modeTimedBtn.addEventListener('click', function () {
      if (G.kind === 'timed' && G.mode === 'play' && overlayKind === 'none') return;
      startPlay('timed');
    });
    ovCampaign.addEventListener('click', function () { startPlay('campaign'); });
    ovTimed.addEventListener('click', function () { startPlay('timed'); });
  }

  boot();
})();
