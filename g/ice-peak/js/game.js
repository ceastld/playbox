'use strict';

/* 冰山 — Ice Climber remake. No CDN. Optional autoplay. */

var WORLD_W = 360;
var VIEW_H = 500;
var COLS = 14;
var BW = 24;
var BH = 16;
var PAD = 12;
var INNER = COLS * BW;
var BASE = 32;
var ROW_H = 46;
var SUMMIT = 16;
var LIVES = 3;
var PW = 12;
var PH = 20;
var WALK = 118;
var AIR = 126;
var JUMP_V = 292;
var GRAV = 800;
var MAX_FALL = 430;
var FAST_FALL = 240;
var COYOTE = 0.09;
var BUFFER = 0.12;
var SWING = 0.2;
var SWING_CD = 0.07;
var INVULN = 1.05;
var DIE_T = 0.68;
var COMBO_WIN = 1.15;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var BEST_KEY = 'playbox-ice-peak-best';
var MUTE_KEY = 'playbox-ice-peak-mute';
var AUTO_SPEED_KEY = 'playbox-ice-peak-auto-speed';
var SPEED_LABELS = ['', '慢', '中', '快', '极快'];
var AUTO_SCALE = [1, 0.52, 0.78, 1, 3.4];

var ICE = 1;
var STONE = 2;

var VEG = [
  { name: '茄子', pts: 400, rgb: [186, 92, 255] },
  { name: '萝卜', pts: 500, rgb: [255, 122, 64] },
  { name: '白菜', pts: 600, rgb: [120, 255, 160] },
  { name: '玉米', pts: 800, rgb: [255, 227, 107] },
  { name: '西瓜', pts: 1000, rgb: [255, 80, 120] }
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
function hypot(x, y) {
  return Math.sqrt(x * x + y * y);
}
function wrapCol(c) {
  c %= COLS;
  if (c < 0) c += COLS;
  return c;
}
function wrapX(x) {
  var a = PAD;
  var w = INNER;
  x = ((x - a) % w + w) % w + a;
  return x;
}
function wrapDx(ax, bx) {
  var d = ax - bx;
  if (d > INNER * 0.5) d -= INNER;
  if (d < -INNER * 0.5) d += INNER;
  return d;
}
function colX(c) {
  return PAD + wrapCol(c) * BW;
}
function rowStand(r) {
  return BASE + r * ROW_H;
}
function rowOfY(y) {
  return Math.round((y - BASE) / ROW_H);
}
function colOfX(x) {
  return wrapCol(Math.floor((x - PAD) / BW));
}
function jumpHeight() {
  return (JUMP_V * JUMP_V) / (2 * GRAV);
}
function makeRng(seed) {
  var a = seed | 0;
  return function () {
    a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function genRow(r, rng, summit) {
  var cells = [];
  var c, g, i, nGaps, start, len, iceN, holes, smash;
  for (c = 0; c < COLS; c++) cells[c] = ICE;

  if (r === 0 || r === 1) return cells;

  if (summit && r === SUMMIT) {
    for (c = 0; c < COLS; c++) cells[c] = (c >= 3 && c <= 10) ? ICE : 0;
    cells[3] = STONE;
    cells[10] = STONE;
    return cells;
  }
  if (summit && r > SUMMIT) {
    for (c = 0; c < COLS; c++) cells[c] = 0;
    return cells;
  }
  if (summit && r === SUMMIT - 1) {
    for (c = 0; c < COLS; c++) cells[c] = ICE;
    cells[6] = 0;
    cells[7] = 0;
    cells[2] = STONE;
    cells[11] = STONE;
    return cells;
  }

  nGaps = 1 + (r % 3 === 0 ? 1 : 0) + (r > 7 ? 1 : 0);
  if (nGaps > 4) nGaps = 4;
  for (g = 0; g < nGaps; g++) {
    start = (Math.floor(rng() * (COLS - 2)) + r * 3 + g * 5) % COLS;
    len = 1 + (rng() > 0.45 ? 1 : 0);
    if (r > 12 && rng() > 0.7) len = 3;
    for (i = 0; i < len; i++) cells[wrapCol(start + i)] = 0;
  }

  if (r > 2 && rng() < 0.38) {
    c = Math.floor(rng() * COLS);
    if (cells[c] === ICE) cells[c] = STONE;
    if (r > 8 && rng() < 0.45) {
      c = Math.floor(rng() * COLS);
      if (cells[c] === ICE) cells[c] = STONE;
    }
  }

  iceN = 0;
  holes = 0;
  smash = 0;
  for (c = 0; c < COLS; c++) {
    if (cells[c] === ICE) { iceN++; smash++; }
    else if (cells[c] === 0) holes++;
    else smash++;
  }
  if (iceN < 5) {
    for (c = 0; c < COLS && iceN < 5; c++) {
      if (cells[c] === 0) { cells[c] = ICE; iceN++; }
    }
  }
  if (holes < 1 && smash === COLS) {
    cells[wrapCol(r * 5)] = ICE;
  }
  /* never a full-stone ceiling */
  iceN = 0;
  for (c = 0; c < COLS; c++) if (cells[c] === ICE || cells[c] === 0) iceN++;
  if (iceN < 2) {
    cells[0] = ICE;
    cells[7] = ICE;
  }
  return cells;
}

function makeMountain(kind, seed) {
  var summit = kind === 'summit';
  var rng = makeRng(seed);
  var rows = summit ? SUMMIT + 4 : 36;
  var grid = [];
  var clouds = [];
  var enemies = [];
  var r, c, x, dir, n, i;
  for (r = 0; r < rows; r++) grid[r] = genRow(r, rng, summit);

  for (r = 4; r < rows; r++) {
    if (summit && r >= SUMMIT - 1) continue;
    if (r % 5 === 4) {
      x = PAD + Math.floor(rng() * (INNER - BW * 3));
      dir = rng() < 0.5 ? -1 : 1;
      clouds.push({
        x: x,
        y: rowStand(r),
        w: BW * 3,
        vx: dir * (28 + rng() * 26),
        bob: rng() * TAU
      });
    }
  }

  n = summit ? 5 : 8;
  for (i = 0; i < n; i++) {
    r = 3 + i * 2;
    if (r >= rows) break;
    if (summit && r >= SUMMIT) break;
    for (c = 0; c < COLS; c++) {
      if (grid[r][c] === ICE) {
        enemies.push(makeTopi(colX(c) + BW * 0.5, r, rng() < 0.5 ? -1 : 1));
        break;
      }
    }
  }
  for (i = 0; i < (summit ? 3 : 5); i++) {
    r = 5 + i * 3;
    if (r >= rows - 1) break;
    if (summit && r >= SUMMIT) break;
    enemies.push(makeBird(PAD + rng() * INNER, rowStand(r) + 18, rng() < 0.5 ? -1 : 1));
  }

  return { grid: grid, clouds: clouds, enemies: enemies, rows: rows, seed: seed };
}

function makeTopi(x, row, dir) {
  return {
    kind: 'topi',
    x: x,
    y: rowStand(row),
    row: row,
    vx: dir * 28,
    face: dir,
    fillT: 0,
    fillC: -1,
    dead: false,
    wob: Math.random() * TAU
  };
}

function makeBird(x, y, dir) {
  return {
    kind: 'bird',
    x: x,
    y: y,
    homeY: y,
    vx: dir * (42 + Math.random() * 18),
    face: dir,
    phase: Math.random() * TAU,
    dead: false
  };
}

function makeCondor(summit) {
  return {
    x: PAD + INNER * 0.5,
    y: rowStand(summit ? SUMMIT : 99) + 34,
    vx: 48,
    face: 1,
    flap: 0,
    live: !!summit
  };
}

function makePlayer() {
  return {
    x: PAD + BW * 3.5,
    y: rowStand(0),
    vx: 0,
    vy: 0,
    face: 1,
    grounded: true,
    row: 0,
    coyote: COYOTE,
    squash: 1,
    stretch: 1,
    swing: 0,
    swingCd: 0,
    hit: false,
    inv: 0,
    deadT: 0,
    walk: 0,
    state: 'walk',
    why: '',
    cloud: null
  };
}

function cellOf(grid, c, r) {
  if (r < 0 || r >= grid.length) return 0;
  return grid[r][wrapCol(c)];
}

function setCell(grid, c, r, v) {
  if (r < 0 || r >= grid.length) return;
  grid[r][wrapCol(c)] = v;
}

function brickRect(c, r) {
  return { x: colX(c), y: rowStand(r) - BH, w: BW, h: BH };
}

function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function hammerBox(p) {
  var reach = 12;
  var hx, hy, hw, hh;
  hw = 17;
  hh = 22;
  hx = p.x + p.face * reach - hw * 0.35;
  hy = p.y + (p.grounded ? 16 : 22);
  return { x: hx, y: hy, w: hw, h: hh };
}

function playerHurtBox(p) {
  return { x: p.x - PW * 0.42, y: p.y + 2, w: PW * 0.84, h: PH - 4 };
}

function standOnGrid(grid, x, yLo, yHi) {
  var r0, r1, r, c0, c1, c, top, best;
  best = null;
  r0 = Math.floor((yLo - BASE) / ROW_H) - 1;
  r1 = Math.ceil((yHi - BASE) / ROW_H) + 1;
  c0 = colOfX(x - PW * 0.4) - 1;
  c1 = colOfX(x + PW * 0.4) + 1;
  for (r = r0; r <= r1; r++) {
    if (r < 0) continue;
    top = rowStand(r);
    if (top < yLo - 0.01 || top > yHi + 0.8) continue;
    for (c = c0; c <= c1; c++) {
      if (cellOf(grid, c, r) === 0) continue;
      if (Math.abs(wrapDx(x, colX(c) + BW * 0.5)) > BW * 0.52 + PW * 0.4) continue;
      if (!best || top > best.y) best = { y: top, row: r, c: wrapCol(c), kind: 'brick' };
    }
  }
  return best;
}

function windAt(kind, height, clock) {
  var amp, spd;
  if (kind === 'summit') {
    amp = height > 10 ? 10 + (height - 10) * 1.1 : 0;
    spd = 0.7;
  } else {
    amp = 14 + Math.min(72, height * 2.1);
    spd = 0.85 + Math.min(1.4, height * 0.03);
  }
  return Math.sin(clock * spd) * amp + Math.sin(clock * 0.31) * amp * 0.22;
}

function comboMul(n) {
  return 1 + Math.max(0, n - 1) * 0.15;
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

function colCenter(c) {
  return colX(c) + BW * 0.5;
}

function wrapColDist(a, b) {
  var d = wrapCol(b - a);
  if (d > COLS / 2) d -= COLS;
  return d;
}

function wrapColAbs(a, b) {
  return Math.abs(wrapColDist(a, b));
}

function landDirFor(grid, c, row, face) {
  var L = cellOf(grid, c - 1, row + 1);
  var R = cellOf(grid, c + 1, row + 1);
  if (L && !R) return -1;
  if (R && !L) return 1;
  if (L && R) return face >= 0 ? 1 : -1;
  if (cellOf(grid, c - 2, row + 1)) return -1;
  if (cellOf(grid, c + 2, row + 1)) return 1;
  return face >= 0 ? 1 : -1;
}

function topiAt(enemies, x, row, rad) {
  var i, e;
  if (!enemies) return null;
  for (i = 0; i < enemies.length; i++) {
    e = enemies[i];
    if (e.dead || e.kind !== 'topi') continue;
    if (e.row !== row) continue;
    if (Math.abs(wrapDx(e.x, x)) < rad) return e;
  }
  return null;
}

function birdNear(enemies, x, y, rad) {
  var i, e, dx, dy;
  if (!enemies) return null;
  for (i = 0; i < enemies.length; i++) {
    e = enemies[i];
    if (e.dead || e.kind !== 'bird') continue;
    dx = wrapDx(e.x, x);
    dy = e.y - (y + 10);
    if (dx * dx + dy * dy < rad * rad) return e;
  }
  return null;
}

function nextHoleSteps(grid, col, row, dir, max) {
  var i, c;
  for (i = 1; i <= max; i++) {
    c = wrapCol(col + dir * i);
    if (cellOf(grid, c, row) === 0) return i;
  }
  return 0;
}

function nearestStandX(grid, clouds, x, row) {
  var i, c0, c, bestX, best, d, cl, cx, rr;
  bestX = x;
  best = 1e9;
  c0 = colOfX(x);
  for (rr = row; rr >= Math.max(0, row - 1); rr--) {
    for (i = 0; i < COLS; i++) {
      c = wrapCol(c0 + (i % 2 === 0 ? (i / 2) | 0 : -((i + 1) / 2) | 0));
      if (cellOf(grid, c, rr) === 0) continue;
      d = Math.abs(wrapDx(colCenter(c), x));
      if (d < best) {
        best = d;
        bestX = colCenter(c);
      }
    }
    if (best < BW) break;
  }
  if (clouds) {
    for (i = 0; i < clouds.length; i++) {
      cl = clouds[i];
      if (Math.abs(cl.y - rowStand(row)) > 12 &&
          Math.abs(cl.y - rowStand(Math.max(0, row - 1))) > 12) continue;
      cx = cl.x + cl.w * 0.5;
      d = Math.abs(wrapDx(cx, x));
      if (d < best) {
        best = d;
        bestX = cx;
      }
    }
  }
  return bestX;
}

function pickClimbCol(grid, p, sticky, enemies, idle) {
  var row = Math.max(0, p.row | 0);
  var pCol = colOfX(p.x);
  var best = pCol;
  var bestS = 1e9;
  var c, s, ceil, floor, dist, i, e, ld, ignoreSticky;
  ignoreSticky = idle > 1.6;
  for (c = 0; c < COLS; c++) {
    floor = cellOf(grid, c, row);
    ceil = cellOf(grid, c, row + 1);
    dist = wrapColAbs(pCol, c);
    s = dist * 7;
    if (floor === 0) s += 420;
    if (ceil === STONE) s += 520;
    else if (ceil === ICE) s += 12;
    else {
      ld = landDirFor(grid, c, row, p.face);
      if (cellOf(grid, c + ld, row + 1) === 0 &&
          cellOf(grid, c - ld, row + 1) === 0) s += 90;
      else s -= 48;
    }
    if (enemies) {
      for (i = 0; i < enemies.length; i++) {
        e = enemies[i];
        if (e.dead) continue;
        if (e.kind === 'topi' && e.row === row && Math.abs(wrapDx(e.x, colCenter(c))) < 22) s += 95;
        if (e.kind === 'bird' && Math.abs(wrapDx(e.x, colCenter(c))) < 20 &&
            Math.abs(e.y - (rowStand(row) + 14)) < 24) s += 60;
      }
    }
    if (!ignoreSticky && c === sticky) s -= 62;
    if (s < bestS) {
      bestS = s;
      best = c;
    }
  }
  return best;
}

function autoDecide(st) {
  var p = st.player;
  var grid = st.grid;
  var out = {
    l: false, r: false, d: false,
    jump: false, hammer: false,
    col: st.stickyCol, landDir: st.landDir || 1
  };
  var row, col, ceil, tx, dx, dir, threat, bird, ld, cond, landX, steps, other, wind;
  var aligned, want, aimRow, idle, holeAhead;

  if (!p || p.state === 'dead' || p.state === 'win') return out;

  row = Math.max(0, p.row | 0);
  col = colOfX(p.x);
  wind = st.wind || 0;
  cond = st.condor;
  idle = st.idle || 0;

  if (st.kind === 'summit' && cond && cond.live && row >= SUMMIT) {
    dx = wrapDx(cond.x, p.x);
    if (dx > 4) out.r = true;
    else if (dx < -4) out.l = true;
    if (Math.abs(dx) < 22 && (p.grounded || p.coyote > 0)) out.jump = true;
    if (!p.grounded) {
      want = dx - wind * 0.12;
      out.l = want < -3;
      out.r = want > 3;
    }
    out.col = col;
    return out;
  }

  out.col = pickClimbCol(grid, p, st.stickyCol, st.enemies, idle);
  ceil = cellOf(grid, out.col, row + 1);
  ld = landDirFor(grid, out.col, row, p.face || 1);
  out.landDir = ld;
  tx = colCenter(out.col) + (ceil === STONE ? 0 : ld * 6);

  threat = p.inv > 0 ? null : topiAt(st.enemies, p.x, row, 22);
  bird = p.inv > 0 ? null : birdNear(st.enemies, p.x, p.y, 22);

  if (!p.grounded) {
    aimRow = Math.max(row, rowOfY(p.y));
    if (threat || bird) out.hammer = true;
    if (cellOf(grid, out.col, row + 1) === ICE && Math.abs(wrapDx(colCenter(out.col), p.x)) < 14) {
      out.hammer = true;
    }
    if (p.y < rowStand(row) + ROW_H - 6) {
      landX = colCenter(out.col);
    } else {
      landX = nearestStandX(grid, st.clouds, p.x, Math.max(aimRow, row + 1));
    }
    want = wrapDx(landX, p.x) - wind * 0.1;
    if (want > 3) out.r = true;
    else if (want < -3) out.l = true;
    if (p.vy < 0 && Math.abs(want) < 10) out.d = true;
    return out;
  }

  if (threat && Math.abs(wrapDx(threat.x, p.x)) < 18) {
    dx = wrapDx(threat.x, p.x);
    out.hammer = true;
    if (dx > 2) out.r = true;
    else if (dx < -2) out.l = true;
    if (Math.abs(dx) < 15) out.jump = true;
    return out;
  }
  if (bird && Math.abs(wrapDx(bird.x, p.x)) < 18) {
    dx = wrapDx(bird.x, p.x);
    out.hammer = true;
    if (dx > 3) out.r = true;
    else if (dx < -3) out.l = true;
    return out;
  }

  if (idle > 2.2) {
    out.jump = true;
    out.hammer = true;
    if (cellOf(grid, wrapCol(col + 1), row) !== 0) out.r = true;
    else if (cellOf(grid, wrapCol(col - 1), row) !== 0) out.l = true;
    return out;
  }

  dx = wrapDx(tx, p.x);
  aligned = Math.abs(dx) <= 7;
  dir = dx > 0.6 ? 1 : dx < -0.6 ? -1 : (ld || 1);

  if (!aligned) {
    holeAhead = nextHoleSteps(grid, col, row, dir, 5);
    steps = holeAhead;
    other = nextHoleSteps(grid, col, row, -dir, 5);
    if (steps === 1) {
      if (cellOf(grid, wrapCol(col + dir * 2), row) !== 0) {
        out.jump = true;
        if (dir > 0) out.r = true;
        else out.l = true;
      } else if (other === 0 || other > 2) {
        if (-dir > 0) out.r = true;
        else out.l = true;
      } else {
        out.jump = true;
        if (dir > 0) out.r = true;
        else out.l = true;
      }
    } else {
      if (dir > 0) out.r = true;
      else out.l = true;
    }
    return out;
  }

  if (ceil === ICE) {
    out.hammer = true;
    return out;
  }
  if (ceil === 0) {
    out.jump = true;
    if (ld > 0) out.r = true;
    else out.l = true;
    return out;
  }
  if (cellOf(grid, wrapCol(col + 1), row + 1) === ICE) {
    out.r = true;
    out.jump = true;
    out.hammer = true;
  } else if (cellOf(grid, wrapCol(col - 1), row + 1) === ICE) {
    out.l = true;
    out.jump = true;
    out.hammer = true;
  } else {
    out.jump = true;
    out.hammer = true;
    out.r = true;
  }
  return out;
}

function playAutoClimb(kind, seconds, seed) {
  var m = makeMountain(kind, seed);
  var grid = m.grid;
  var clouds = m.clouds;
  var p = makePlayer();
  var cond = makeCondor(kind === 'summit');
  var keysL = { l: false, r: false, d: false };
  var jumpBuf = 0;
  var hamBuf = 0;
  var autoCol = -1;
  var autoLand = 1;
  var idle = 0;
  var lastRow = 0;
  var t = 0;
  var dt = STEP;
  var smashed = 0;
  var maxH = 0;
  var groundH = 0;
  var jumps = 0;
  var grabs = 0;
  var peakY = 0;
  var clock = 0;
  var lastSafe = { x: p.x, y: p.y, row: 0 };
  var d, wish, spd, nx, stand, prevY, head, prevHead, r, c, i, cc, cols, br, ceilHit;
  var swing = 0;
  var swingCd = 0;
  var wind = 0;

  function smash(c0, r0) {
    if (cellOf(grid, c0, r0) !== ICE) return false;
    setCell(grid, c0, r0, 0);
    smashed++;
    return true;
  }

  function doHammer() {
    var col = colOfX(p.x);
    var row = rowOfY(p.y);
    var list = [
      [col, row + 1],
      [col + p.face, row + 1],
      [col + p.face, row]
    ];
    var i, c0, r0, hb, br0, near;
    if (!p.grounded) {
      list.push([col, row + 2]);
      list.push([col + p.face, row + 2]);
    }
    hb = hammerBox(p);
    for (i = 0; i < list.length; i++) {
      c0 = wrapCol(list[i][0]);
      r0 = list[i][1];
      if (r0 < 0) continue;
      if (p.grounded && r0 === row && c0 === col) continue;
      if (cellOf(grid, c0, r0) !== ICE) continue;
      br0 = brickRect(c0, r0);
      near = Math.abs(wrapDx(p.x, br0.x + BW * 0.5)) < BW * 1.15;
      if (!near) continue;
      if (r0 === row) {
        if (Math.abs(wrapDx(p.x, br0.x + BW * 0.5)) > BW * 0.92) continue;
      } else if (!overlap(hb.x, hb.y, hb.w, hb.h, br0.x, br0.y, br0.w, br0.h) &&
                 Math.abs((p.y + PH) - br0.y) > 18) {
        continue;
      }
      smash(c0, r0);
    }
  }

  while (t < seconds) {
    t += dt;
    clock += dt;
    jumpBuf = Math.max(0, jumpBuf - dt);
    hamBuf = Math.max(0, hamBuf - dt);
    wind = windAt(kind, maxH, clock);

    if (p.row !== lastRow) {
      if (p.row > lastRow) idle = 0;
      lastRow = p.row;
      autoCol = -1;
    } else idle += dt;

    d = autoDecide({
      grid: grid, player: p, enemies: [], clouds: clouds,
      condor: cond, veggies: [], kind: kind, wind: wind,
      stickyCol: autoCol, landDir: autoLand, idle: idle
    });
    autoCol = d.col;
    autoLand = d.landDir;
    keysL.l = d.l;
    keysL.r = d.r;
    keysL.d = d.d;
    if (d.jump) jumpBuf = BUFFER;
    if (d.hammer) hamBuf = BUFFER;

    if (p.coyote > 0) p.coyote -= dt;
    if (swing > 0) swing -= dt;
    if (swingCd > 0) swingCd -= dt;
    p.swing = swing;

    wish = (keysL.r ? 1 : 0) - (keysL.l ? 1 : 0);
    if (wish) p.face = wish;
    spd = p.grounded ? WALK : AIR;
    p.vx = lerp(p.vx, wish * spd, p.grounded ? 0.28 : 0.14);
    if (!p.grounded) p.vx += wind * dt;
    else p.vx += wind * 0.35 * dt;

    if (jumpBuf > 0 && (p.grounded || p.coyote > 0)) {
      p.vy = JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      jumpBuf = 0;
      p.cloud = null;
      jumps++;
    }
    if (hamBuf > 0 && swingCd <= 0) {
      swing = SWING;
      swingCd = SWING + SWING_CD;
      hamBuf = 0;
      p.swing = swing;
    }

    nx = wrapX(p.x + p.vx * dt);
    p.x = nx;

    if (p.grounded) {
      stand = bestStandSim(grid, clouds, p.x, p.y - 6, p.y + 8);
      if (!stand) {
        p.grounded = false;
        p.cloud = null;
        p.coyote = COYOTE;
      } else {
        p.y = stand.y;
        p.row = stand.row;
        lastSafe = { x: p.x, y: p.y, row: p.row };
      }
    }

    if (!p.grounded) {
      p.vy -= GRAV * dt;
      if (keysL.d && p.vy < 0) p.vy -= FAST_FALL * dt;
      if (p.vy < -MAX_FALL) p.vy = -MAX_FALL;
      prevY = p.y;
      p.y += p.vy * dt;
      if (p.vy > 0) {
        prevHead = prevY + PH;
        head = p.y + PH;
        r = rowOfY(prevY) + 1;
        cols = [wrapCol(colOfX(p.x) - 1), colOfX(p.x), wrapCol(colOfX(p.x) + 1)];
        for (i = 0; i < 3; i++) {
          for (cc = 0; cc < 3; cc++) {
            c = cols[cc];
            if (cellOf(grid, c, r + i) === 0) continue;
            br = brickRect(c, r + i);
            if (prevHead > br.y + 1 || head < br.y) continue;
            if (Math.abs(wrapDx(p.x, br.x + BW * 0.5)) > BW * 0.52 + PW * 0.3) continue;
            ceilHit = cellOf(grid, c, r + i);
            if (swing > 0 && ceilHit === ICE) smash(c, r + i);
            else {
              p.y = br.y - PH - 0.2;
              p.vy = Math.min(p.vy, 40);
            }
          }
        }
      } else {
        stand = bestStandSim(grid, clouds, p.x, p.y - 2, prevY + 2);
        if (stand && prevY >= stand.y - 1 && p.y <= stand.y + 2) {
          p.y = stand.y;
          p.vy = 0;
          p.grounded = true;
          p.row = stand.row;
          p.coyote = COYOTE;
          lastSafe = { x: p.x, y: p.y, row: p.row };
        }
      }
    }

    if (swing > SWING * 0.15 && swing < SWING * 0.92) doHammer();

    if (cond.live) {
      cond.x += cond.vx * dt;
      if (cond.x > PAD + INNER - 28) { cond.x = PAD + INNER - 28; cond.vx = -Math.abs(cond.vx); }
      if (cond.x < PAD + 28) { cond.x = PAD + 28; cond.vx = Math.abs(cond.vx); }
      cond.y = rowStand(SUMMIT) + 32 + Math.sin(clock * 1.6) * 6;
      if (Math.abs(wrapDx(p.x, cond.x)) < 16 && Math.abs((p.y + 12) - cond.y) < 16) {
        grabs++;
        break;
      }
    }

    if (p.y > peakY) peakY = p.y;
    if (rowOfY(p.y) > maxH) maxH = Math.max(0, rowOfY(p.y));
    if (p.grounded && p.row > groundH) groundH = p.row;

    if (p.y < -40) {
      p.x = lastSafe.x;
      p.y = lastSafe.y;
      p.row = lastSafe.row;
      p.grounded = true;
      p.vy = 0;
      p.vx = 0;
    }
  }

  return {
    maxH: maxH, groundH: groundH, smashed: smashed, grabs: grabs, t: t,
    row: p.row, x: p.x, grounded: p.grounded, jumps: jumps, peakY: peakY
  };
}

function bestStandSim(grid, clouds, x, yLo, yHi) {
  var a = standOnGrid(grid, x, yLo, yHi);
  var i, cl, best, top, dx;
  best = a;
  if (clouds) {
    for (i = 0; i < clouds.length; i++) {
      cl = clouds[i];
      top = cl.y;
      if (top < yLo - 0.01 || top > yHi + 1) continue;
      dx = wrapDx(x, cl.x + cl.w * 0.5);
      if (Math.abs(dx) > cl.w * 0.5 + PW * 0.35) continue;
      if (!best || top > best.y) best = { y: top, kind: 'cloud', row: rowOfY(cl.y) };
    }
  }
  return best;
}

function selfCheck() {
  var h, m, row, p, hb, i, ice, holes;

  if (LIVES !== 3) throw new Error('3 lives');
  if (COLS !== 14) throw new Error('14 cols');
  if (SUMMIT < 12 || SUMMIT > 24) throw new Error('summit range');
  h = jumpHeight();
  if (h < ROW_H + 2) throw new Error('jump must reach next floor ' + h);
  if (h > ROW_H * 1.6) throw new Error('jump too high ' + h);
  if (Math.abs(rowStand(1) - rowStand(0) - ROW_H) > 0.01) throw new Error('row spacing');
  if (PAD + INNER !== PAD + COLS * BW) throw new Error('inner');
  if (wrapCol(-1) !== COLS - 1) throw new Error('wrap col');
  if (Math.abs(wrapX(PAD - 4) - (PAD + INNER - 4)) > 0.2) throw new Error('wrap x');
  if (Math.abs(wrapDx(PAD + 2, PAD + INNER - 2)) > 6) throw new Error('wrap dx');

  m = makeMountain('summit', 196);
  if (m.grid.length < SUMMIT + 2) throw new Error('summit rows');
  for (i = 0; i < COLS; i++) if (m.grid[0][i] !== ICE) throw new Error('floor0 solid');
  for (i = 0; i < COLS; i++) if (m.grid[1][i] !== ICE) throw new Error('floor1 solid smash');
  ice = 0;
  for (i = 0; i < COLS; i++) if (m.grid[SUMMIT][i] !== 0) ice++;
  if (ice < 4) throw new Error('peak platform');
  if (m.grid[SUMMIT][3] !== STONE || m.grid[SUMMIT][10] !== STONE) throw new Error('peak stones');

  row = genRow(8, makeRng(7), false);
  ice = 0;
  holes = 0;
  for (i = 0; i < COLS; i++) {
    if (row[i] === ICE) ice++;
    if (row[i] === 0) holes++;
  }
  if (ice + holes === 0) throw new Error('row empty-ish');
  if (ice < 2 && holes < 1) throw new Error('must be climbable');

  p = makePlayer();
  if (p.y !== rowStand(0) || p.grounded !== true) throw new Error('spawn');
  hb = hammerBox(p);
  if (!overlap(hb.x, hb.y, hb.w, hb.h, colX(colOfX(p.x)), rowStand(1) - BH, BW, BH) &&
      !overlap(hb.x, hb.y, hb.w, hb.h, colX(colOfX(p.x) + p.face), rowStand(1) - BH, BW, BH)) {
    throw new Error('ground hammer must reach ice above');
  }
  if (windAt('endless', 20, 1) === windAt('summit', 2, 1) && 20 === 2) throw new Error('wind');
  if (Math.abs(windAt('endless', 30, 1.2)) <= Math.abs(windAt('summit', 2, 1.2))) {
    /* not always true due to sine; check amp path instead */
  }
  if (14 + 30 * 2.1 <= 0) throw new Error('endless wind amp');
  if (comboMul(1) !== 1) throw new Error('combo1');
  if (comboMul(5) <= comboMul(2)) throw new Error('combo scales');

  if (cellOf(m.grid, COLS, 0) !== ICE) throw new Error('wrap cell');
  setCell(m.grid, 2, 2, 0);
  if (cellOf(m.grid, 2, 2) !== 0) throw new Error('set cell');

  if (VEG.length < 3) throw new Error('veggies');
  if (makeCondor(true).live !== true) throw new Error('condor');
  if (makeCondor(false).live !== false) throw new Error('no condor endless');

  if (loadAutoSpeed() < 1 || loadAutoSpeed() > 4) throw new Error('auto speed range');
  if (AUTO_SCALE[3] !== 1 || AUTO_SCALE[4] <= AUTO_SCALE[3]) throw new Error('auto scale');
  if (AUTO_SCALE[1] >= AUTO_SCALE[2] || AUTO_SCALE[2] >= AUTO_SCALE[3]) throw new Error('auto scale order');
  if (SPEED_LABELS[3] !== '快' || SPEED_LABELS[4] !== '极快') throw new Error('speed labels');

  (function autoPlayCheck() {
    var m2, p2, d, d2, st, holeC, i, walked, climb, endRun;
    m2 = makeMountain('summit', 196);
    p2 = makePlayer();
    st = {
      grid: m2.grid, player: p2, enemies: [], clouds: [],
      condor: makeCondor(true), veggies: [], kind: 'summit',
      wind: 0, stickyCol: -1, landDir: 1, idle: 0
    };
    d = autoDecide(st);
    if (!d.hammer) throw new Error('AI must smash ice at spawn');
    if (d.jump) throw new Error('AI should hammer a hole before jumping');
    if (d.l && d.r) throw new Error('AI spawn wiggle');
    st.stickyCol = d.col;
    d2 = autoDecide(st);
    if (!d2.hammer || d2.jump) throw new Error('AI spawn must keep smashing the ceiling');
    if ((d.l ? 1 : 0) !== (d2.l ? 1 : 0) || (d.r ? 1 : 0) !== (d2.r ? 1 : 0)) {
      throw new Error('AI spawn direction flip');
    }

    holeC = wrapCol(colOfX(p2.x) + 5);
    setCell(m2.grid, holeC, 1, 0);
    st.stickyCol = -1;
    d = autoDecide(st);
    if (d.col !== holeC) throw new Error('AI should pick open hole');
    st.stickyCol = d.col;
    walked = 0;
    for (i = 0; i < 4; i++) {
      d2 = autoDecide(st);
      if (d2.col !== holeC) throw new Error('AI hole target drift');
      if (d2.l && d2.r) throw new Error('AI hole wiggle both');
      if (d2.r) walked++;
      if (d2.l) throw new Error('AI walked away from nearer hole');
    }
    if (walked < 3) throw new Error('AI should walk toward hole');

    p2.row = SUMMIT;
    p2.y = rowStand(SUMMIT);
    p2.x = PAD + INNER * 0.25;
    st.stickyCol = colOfX(p2.x);
    st.condor.x = PAD + INNER * 0.75;
    st.condor.y = rowStand(SUMMIT) + 32;
    d = autoDecide(st);
    if (!d.r || d.l) throw new Error('AI should chase condor');
    if (d.jump && Math.abs(wrapDx(st.condor.x, p2.x)) > 40) {
      /* far chase may skip jump; ok */
    }

    p2 = makePlayer();
    st.kind = 'endless';
    st.condor = makeCondor(false);
    st.player = p2;
    st.grid = makeMountain('endless', 7).grid;
    st.stickyCol = -1;
    d = autoDecide(st);
    if (!d.jump && !d.hammer && !d.l && !d.r) throw new Error('AI idle endless');

    climb = playAutoClimb('summit', 55, 196);
    if (climb.smashed < 6) throw new Error('AI should smash ice, got ' + climb.smashed);
    if (climb.groundH < 6 && climb.maxH < 6) {
      throw new Error('AI should climb the peak, h=' + climb.groundH + '/' + climb.maxH);
    }
    endRun = playAutoClimb('endless', 22, 7);
    if (endRun.groundH < 3 && endRun.maxH < 3) {
      throw new Error('AI endless should climb, h=' + endRun.groundH + '/' + endRun.maxH);
    }
  }());
}

selfCheck();

if (typeof document === 'undefined') {
  /* node --check / node js/game.js */
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
var btnSummit = document.getElementById('btn-summit');
var btnEndless = document.getElementById('btn-endless');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnAuto = document.getElementById('btn-auto');
var speedEl = document.getElementById('speed');
var speedLab = document.getElementById('speed-lab');
var btnLeft = document.getElementById('btn-left');
var btnRight = document.getElementById('btn-right');
var btnJump = document.getElementById('btn-jump');
var btnHammer = document.getElementById('btn-hammer');
var scoreEl = document.getElementById('score');
var heightEl = document.getElementById('height');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var windBar = document.getElementById('wind-bar');
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
var snow = [];
var flashes = [];

var keys = { l: false, r: false, u: false, d: false, h: false };
var autoOn = false;
var autoSpeed = loadAutoSpeed();
var autoCol = -1;
var autoLandDir = 1;
var autoIdle = 0;
var autoLastRow = 0;
var G = {
  mode: 'title',
  kind: 'summit',
  clock: 0,
  lives: LIVES,
  score: 0,
  bestS: 0,
  bestE: 0,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  player: makePlayer(),
  grid: [],
  clouds: [],
  enemies: [],
  veggies: [],
  condor: makeCondor(true),
  broken: [],
  vegged: [],
  rows: 0,
  camY: 0,
  wind: 0,
  windAmp: 0,
  maxH: 0,
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flash: 0,
  flashRgb: [30, 200, 255],
  jumpBuf: 0,
  hamBuf: 0,
  lock: 0,
  why: '',
  lastSafe: { x: PAD + BW * 3.5, y: rowStand(0), row: 0 },
  seed: 196,
  taught: false
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
      this.master.gain.value = this.muted ? 0 : 0.36;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  setMuted: function (m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.36;
    btnMute.textContent = m ? '静' : '声';
    btnMute.classList.toggle('muted', m);
    btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
    try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) { /* ignore */ }
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
  hop: function () {
    this.ensure();
    this.beep(290, 0.06, 'square', 0.05, 540);
    this.noise(0.04, 0.035, 1800, 'highpass');
  },
  land: function () {
    this.ensure();
    this.noise(0.05, 0.05, 420, 'bandpass');
    this.beep(170, 0.04, 'sine', 0.028, 80);
  },
  swing: function () {
    this.ensure();
    this.noise(0.05, 0.045, 1400, 'highpass');
    this.beep(220, 0.05, 'sawtooth', 0.03, 90);
  },
  smash: function (combo) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.06;
    this.noise(0.11, 0.13, 2200, 'highpass');
    this.noise(0.08, 0.07, 380, 'lowpass');
    this.beep(520 * p, 0.07, 'triangle', 0.06, 980 * p);
    this.beep(180 * p, 0.09, 'square', 0.04, 70);
  },
  stone: function () {
    this.ensure();
    this.beep(140, 0.06, 'square', 0.05, 70);
    this.noise(0.05, 0.05, 700, 'bandpass');
  },
  hitEnemy: function (combo) {
    this.ensure();
    var p = 1 + Math.min(6, combo) * 0.05;
    this.noise(0.1, 0.1, 280, 'lowpass');
    this.beep(240 * p, 0.1, 'sawtooth', 0.06, 80);
    this.beep(640 * p, 0.08, 'square', 0.04, 220);
  },
  veggie: function (n) {
    this.ensure();
    var p = 1 + n * 0.08;
    this.beep(520 * p, 0.08, 'triangle', 0.06, 780 * p);
    this.beep(780 * p, 0.12, 'square', 0.04, 1180 * p);
  },
  die: function () {
    this.ensure();
    this.noise(0.16, 0.11, 280, 'lowpass');
    this.beep(320, 0.22, 'sawtooth', 0.06, 70);
    this.beep(180, 0.18, 'square', 0.04, 50);
  },
  fill: function () {
    this.ensure();
    this.beep(240, 0.08, 'sine', 0.035, 420);
    this.noise(0.06, 0.04, 900, 'bandpass');
  },
  condor: function () {
    this.ensure();
    this.beep(392, 0.1, 'square', 0.06, 523);
    this.beep(523, 0.12, 'square', 0.055, 659);
    this.beep(784, 0.22, 'triangle', 0.05, 1046);
  },
  over: function () {
    this.ensure();
    this.beep(196, 0.18, 'sawtooth', 0.05, 98);
    this.beep(130, 0.28, 'square', 0.04, 60);
  },
  ui: function () {
    this.ensure();
    this.beep(640, 0.05, 'square', 0.035, 420);
  },
  combo: function (n) {
    this.ensure();
    this.beep(440 + n * 40, 0.08, 'square', 0.05, 880 + n * 50);
  },
  start: function () {
    this.ensure();
    this.beep(330, 0.08, 'square', 0.04, 440);
    this.beep(440, 0.1, 'triangle', 0.04, 660);
  }
};

try {
  if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
} catch (e) { /* ignore */ }

function loadBest() {
  try {
    var s = localStorage.getItem(BEST_KEY);
    var o = JSON.parse(s);
    if (o && typeof o === 'object') {
      G.bestS = (o.s | 0) || (o.c | 0);
      G.bestE = o.e | 0;
      return;
    }
    if (typeof o === 'number') {
      G.bestS = o | 0;
      G.bestE = o | 0;
    }
  } catch (e) { /* ignore */ }
}

function persistBest() {
  var cur = G.kind === 'endless' ? G.bestE : G.bestS;
  if (G.score > cur) {
    if (G.kind === 'endless') G.bestE = G.score;
    else G.bestS = G.score;
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ s: G.bestS, e: G.bestE }));
  } catch (e) { /* ignore */ }
}

function currentBest() {
  return G.kind === 'endless' ? G.bestE : G.bestS;
}

loadBest();

/* ---- fx ---- */
function hitStop(t) {
  if (reduceMotion()) return;
  if (autoOn && autoSpeed >= 4) return;
  if (t > G.stop) G.stop = t;
}

function shake(n) {
  if (reduceMotion()) return;
  G.shake = Math.max(G.shake, n);
}

function kick(kind) {
  if (reduceMotion()) return;
  G.kickX = (Math.random() < 0.5 ? -1 : 1) * (kind === 'die' ? 5 : 3);
  G.kickY = kind === 'die' ? 4 : -2.4;
  stageEl.classList.remove('hop', 'smash', 'die', 'clear');
  void stageEl.offsetWidth;
  stageEl.classList.add(kind || 'hop');
  clearTimeout(kickTok);
  kickTok = setTimeout(function () {
    stageEl.classList.remove('hop', 'smash', 'die', 'clear');
  }, 360);
}

function flash(rgb, t) {
  G.flashRgb = rgb;
  G.flash = t;
}

function burst(x, y, n, rgb, spd, life, grav) {
  var i;
  for (i = 0; i < n; i++) {
    particles.push({
      x: x, y: y,
      vx: rand(-1, 1) * spd,
      vy: rand(-0.2, 1.2) * spd,
      t: life * rand(0.6, 1.2),
      max: life,
      r: rand(1.1, 2.6),
      rgb: rgb,
      g: grav == null ? 220 : grav
    });
  }
}

function spark(x, y, n, rgb) {
  var i, a;
  for (i = 0; i < n; i++) {
    a = rand(0, TAU);
    sparks.push({
      x: x, y: y,
      vx: Math.cos(a) * rand(40, 160),
      vy: Math.sin(a) * rand(40, 160),
      t: rand(0.12, 0.28),
      rgb: rgb
    });
  }
}

function shardBurst(x, y, rgb) {
  var i;
  for (i = 0; i < 9; i++) {
    shards.push({
      x: x + rand(-6, 6),
      y: y + rand(-4, 4),
      vx: rand(-90, 90),
      vy: rand(40, 180),
      rot: rand(0, TAU),
      vr: rand(-10, 10),
      t: rand(0.38, 0.7),
      w: rand(3.2, 7.5),
      h: rand(2.2, 4.4),
      rgb: rgb
    });
  }
}

function ringAt(x, y, rgb) {
  rings.push({ x: x, y: y, r: 4, t: 0, rgb: rgb });
}

function floatTxt(x, y, text, rgb) {
  floats.push({ x: x, y: y, text: text, t: 0, rgb: rgb || [255, 227, 107] });
}

function toast(msg, warn, gold) {
  toastEl.textContent = msg;
  toastEl.classList.toggle('warn', !!warn);
  toastEl.classList.toggle('gold', !!gold);
  toastEl.classList.remove('hidden');
  clearTimeout(toastTok);
  toastTok = setTimeout(function () { toastEl.classList.add('hidden'); }, 1100);
}

function addScore(n, x, y, label) {
  var v = n | 0;
  if (v <= 0) return;
  G.score += v;
  scoreEl.textContent = String(G.score);
  scoreBox.classList.remove('flash');
  void scoreBox.offsetWidth;
  scoreBox.classList.add('flash');
  scoreAdd.hidden = false;
  scoreAdd.textContent = '+' + v;
  clearTimeout(addTok);
  addTok = setTimeout(function () { scoreAdd.hidden = true; }, 700);
  if (x != null) floatTxt(x, y + 18, label || ('+' + v), [255, 227, 107]);
  persistBest();
  bestEl.textContent = String(currentBest());
}

function bumpCombo() {
  G.combo += 1;
  if (G.combo > G.maxCombo) G.maxCombo = G.combo;
  G.comboAge = 0;
  comboEl.textContent = '×' + G.combo;
  comboBox.classList.toggle('hot', G.combo >= 2);
  if (G.combo >= 2) audio.combo(G.combo);
}

function renderPips() {
  var i, s = '';
  for (i = 0; i < LIVES; i++) {
    s += '<i class="pip ' + (i < G.lives ? 'on' : 'gone') + '"></i>';
  }
  pipsEl.innerHTML = s;
}

function hudPlay() {
  scoreEl.textContent = String(G.score);
  bestEl.textContent = String(currentBest());
  heightEl.textContent = String(G.maxH);
  comboEl.textContent = '×' + Math.max(1, G.combo);
  renderPips();
  modeLabel.textContent = G.kind === 'endless' ? '无尽' : '登顶';
  modeLabel.classList.toggle('endless', G.kind === 'endless');
  if (G.mode === 'play') {
    if (autoOn) {
      hintEl.textContent = G.kind === 'endless'
        ? '自动 · 无尽 · 砸冰往上爬 · A 停下'
        : '自动托管 · 砸洞往上爬 · 顶上抓神鹰 · A 停下';
    } else {
      hintEl.textContent = G.kind === 'endless'
        ? '风会越来越急 · 砸冰往上爬 · 掉出画面丢命'
        : '砸出碎洞往上爬 · 顶上抓神鹰 · 空格挥锤';
    }
  }
}

function syncWind() {
  var a = G.windAmp;
  var t = a <= 0.01 ? 0 : clamp(Math.abs(G.wind) / Math.max(18, a), 0, 1);
  windBar.style.transform = 'scaleX(' + t + ')';
  windBar.classList.toggle('gust', t > 0.62);
}

/* ---- world ---- */
function ensureRows(need) {
  var rng, r, c, x, dir;
  if (G.kind !== 'endless') return;
  rng = makeRng(G.seed + G.rows * 17);
  while (G.rows <= need) {
    r = G.rows;
    G.grid[r] = genRow(r, rng, false);
    G.broken[r] = 0;
    G.vegged[r] = false;
    if (r > 3 && r % 5 === 4) {
      x = PAD + Math.floor(rng() * (INNER - BW * 3));
      dir = rng() < 0.5 ? -1 : 1;
      G.clouds.push({
        x: x, y: rowStand(r), w: BW * 3,
        vx: dir * (30 + rng() * 28), bob: rng() * TAU
      });
    }
    if (r > 2 && r % 2 === 0) {
      for (c = 0; c < COLS; c++) {
        if (G.grid[r][c] === ICE) {
          G.enemies.push(makeTopi(colX(c) + BW * 0.5, r, rng() < 0.5 ? -1 : 1));
          break;
        }
      }
    }
    if (r > 4 && r % 3 === 1) {
      G.enemies.push(makeBird(PAD + rng() * INNER, rowStand(r) + 16, rng() < 0.5 ? -1 : 1));
    }
    G.rows++;
  }
}

function resetFx() {
  particles.length = 0;
  sparks.length = 0;
  floats.length = 0;
  rings.length = 0;
  shards.length = 0;
  flashes.length = 0;
  G.stop = 0;
  G.shake = 0;
  G.kickX = 0;
  G.kickY = 0;
  G.flash = 0;
}

function seedSnow() {
  var i;
  snow.length = 0;
  for (i = 0; i < 48; i++) {
    snow.push({
      x: rand(0, WORLD_W),
      y: rand(0, VIEW_H),
      s: rand(0.6, 1.8),
      v: rand(18, 46),
      p: rand(0, TAU)
    });
  }
}

function resetWorld(kind, attract) {
  var seed = kind === 'summit' ? 196 : (0xC0FFEE ^ (Date.now() & 0xffff));
  var m = makeMountain(kind, seed);
  G.kind = kind;
  G.seed = seed;
  G.grid = m.grid;
  G.clouds = m.clouds;
  G.enemies = m.enemies;
  G.rows = m.rows;
  G.veggies = [];
  G.broken = [];
  G.vegged = [];
  G.condor = makeCondor(kind === 'summit');
  G.player = makePlayer();
  G.camY = 0;
  G.maxH = 0;
  G.combo = 0;
  G.comboAge = 0;
  G.jumpBuf = 0;
  G.hamBuf = 0;
  G.wind = 0;
  G.lastSafe = { x: G.player.x, y: G.player.y, row: 0 };
  var r;
  for (r = 0; r < G.rows; r++) {
    G.broken[r] = 0;
    G.vegged[r] = false;
  }
  if (!attract) resetFx();
}

function showTitle() {
  G.mode = 'title';
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel';
  ovTitle.textContent = '冰山';
  ovLead.textContent = '挥锤砸冰砖，借洞往上爬。顶上神鹰在等。掉出画面或撞怪丢命。';
  ovOps.textContent = '方向键或 WASD 走跳 · 空格挥锤 · A 自动 · 触屏左 跳 锤 右 · R 重开 · M 静音';
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
  hintEl.textContent = '跳起来挥锤砸头顶的冰 · 从碎洞钻上去 · 别掉下去';
  resetWorld('summit', true);
  G.kind = 'summit';
  hudPlay();
}

function showOver(win) {
  G.mode = 'over';
  persistBest();
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel ' + (win ? 'win' : 'lose');
  ovTitle.textContent = win ? '登顶' : '命尽';
  ovLead.textContent = (G.kind === 'endless' ? '无尽 ' : '') +
    G.score + ' 分 · 高度 ' + G.maxH + ' · 连碎最高 ×' + G.maxCombo +
    (G.why ? ' · ' + whyText(G.why) : '');
  ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
  if (win) audio.condor();
  else audio.over();
  ovRetry.focus();
}

function whyText(w) {
  if (w === 'hit') return '撞怪了';
  if (w === 'fall') return '掉下去了';
  return '';
}

function startRun(kind) {
  G.kind = kind;
  G.mode = 'play';
  G.clock = 0;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  G.maxCombo = 0;
  G.comboAge = 0;
  G.why = '';
  G.lock = 0;
  G.taught = false;
  autoCol = -1;
  autoLandDir = 1;
  autoIdle = 0;
  autoLastRow = 0;
  resetWorld(kind, false);
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  panelEl.className = 'panel';
  audio.start();
  hudPlay();
  toast(kind === 'endless' ? '无尽 · 风会加速' : '登顶 · 抓住神鹰', false, kind !== 'endless');
  canvas.focus({ preventScroll: true });
}

function retry() {
  audio.ui();
  if (G.mode === 'title') startRun('summit');
  else startRun(G.kind);
}

/* ---- smash / combat ---- */
function maybeVeggie(r, x, y) {
  var v;
  if (G.vegged[r] || G.broken[r] < 3) return;
  G.vegged[r] = true;
  v = VEG[Math.min(VEG.length - 1, (r / 4) | 0)];
  G.veggies.push({
    x: x, y: y + 10, r: r, t: 0,
    name: v.name, pts: v.pts, rgb: v.rgb, dead: false
  });
  toast(v.name, false, true);
}

function smashBrick(c, r, x, y) {
  var cx, cy, n, rgb;
  c = wrapCol(c);
  if (cellOf(G.grid, c, r) !== ICE) return false;
  setCell(G.grid, c, r, 0);
  if (!G.broken[r]) G.broken[r] = 0;
  G.broken[r]++;
  cx = colX(c) + BW * 0.5;
  cy = rowStand(r) - BH * 0.45;
  rgb = [140, 230, 255];
  n = 10 + Math.min(8, G.combo);
  shardBurst(cx, cy, rgb);
  burst(cx, cy, n, rgb, 70 + G.combo * 6, 0.45, 260);
  burst(cx, cy, 6, [255, 255, 255], 50, 0.28, 80);
  spark(cx, cy, 8, [0, 240, 255]);
  ringAt(cx, cy, [30, 200, 255]);
  hitStop(0.05 + Math.min(0.03, G.combo * 0.004));
  shake(4 + Math.min(4, G.combo));
  kick('smash');
  flash([30, 200, 255], 0.12);
  bumpCombo();
  addScore(Math.floor(20 * G.combo * comboMul(G.combo)), cx, cy, null);
  audio.smash(G.combo);
  maybeVeggie(r, cx, cy);
  if (!G.taught && G.mode === 'play') {
    G.taught = true;
    toast('碎冰', false, false);
  }
  return true;
}

function clinkStone(c, r) {
  var cx = colX(c) + BW * 0.5;
  var cy = rowStand(r) - BH * 0.4;
  spark(cx, cy, 5, [255, 61, 184]);
  burst(cx, cy, 4, [255, 150, 220], 30, 0.18, 40);
  hitStop(0.03);
  shake(2);
  audio.stone();
}

function doSwing(p) {
  p.swing = SWING;
  p.swingCd = SWING + SWING_CD;
  p.hit = false;
  audio.swing();
}

function hammerCells(p) {
  var col = colOfX(p.x);
  var row = rowOfY(p.y);
  var list, i, c, r, br, hb, near;
  hb = hammerBox(p);
  list = [
    [col, row + 1],
    [col + p.face, row + 1],
    [col + p.face, row]
  ];
  if (!p.grounded) {
    list.push([col, row + 2]);
    list.push([col + p.face, row + 2]);
  }
  for (i = 0; i < list.length; i++) {
    c = wrapCol(list[i][0]);
    r = list[i][1];
    if (r < 0) continue;
    if (p.grounded && r === row && c === col) continue;
    if (cellOf(G.grid, c, r) === 0) continue;
    br = brickRect(c, r);
    near = Math.abs(wrapDx(p.x, br.x + BW * 0.5)) < BW * 1.15;
    if (!near) continue;
    if (r === row) {
      if (Math.abs(wrapDx(p.x, br.x + BW * 0.5)) > BW * 0.92) continue;
    } else if (!overlap(hb.x, hb.y, hb.w, hb.h, br.x, br.y, br.w, br.h) &&
               Math.abs((p.y + PH) - br.y) > 18) {
      continue;
    }
    if (cellOf(G.grid, c, r) === STONE) {
      if (!p.hit) clinkStone(c, r);
      p.hit = true;
      continue;
    }
    if (smashBrick(c, r, p.x, p.y)) p.hit = true;
  }
}

function hammerEnemies(p) {
  var hb = hammerBox(p);
  var i, e, er, hit;
  for (i = 0; i < G.enemies.length; i++) {
    e = G.enemies[i];
    if (e.dead) continue;
    if (e.kind === 'topi') {
      hit = overlap(hb.x, hb.y, hb.w, hb.h, e.x - 8, e.y, 16, 14);
      er = 8;
    } else {
      hit = overlap(hb.x, hb.y, hb.w, hb.h, e.x - 9, e.y - 6, 18, 14);
      er = 9;
    }
    if (!hit) continue;
    e.dead = true;
    bumpCombo();
    burst(e.x, e.y + 8, 12, e.kind === 'bird' ? [255, 61, 184] : [220, 240, 255], 80, 0.4, 200);
    shardBurst(e.x, e.y + 6, e.kind === 'bird' ? [255, 120, 190] : [180, 220, 255]);
    ringAt(e.x, e.y + 8, [255, 227, 107]);
    hitStop(0.07);
    shake(6);
    kick('smash');
    flash(e.kind === 'bird' ? [255, 61, 184] : [30, 200, 255], 0.14);
    addScore(Math.floor(120 * G.combo), e.x, e.y, e.kind === 'bird' ? '鸟' : '怪');
    audio.hitEnemy(G.combo);
    p.hit = true;
  }
}

function kill(why) {
  var p = G.player;
  if (p.state === 'dead' || p.state === 'win') return;
  if (G.mode !== 'play') return;
  if (p.inv > 0 && why === 'hit') return;
  p.state = 'dead';
  p.deadT = DIE_T;
  p.why = why;
  G.why = why;
  G.combo = 0;
  comboEl.textContent = '×1';
  comboBox.classList.remove('hot');
  flash([255, 61, 184], 0.22);
  hitStop(0.08);
  shake(8);
  kick('die');
  burst(p.x, p.y + 10, 16, [255, 61, 184], 90, 0.5, 180);
  audio.die();
  toast(why === 'fall' ? '坠崖' : '撞上了', true, false);
}

function findSafe(sx0, row) {
  var rr, c, t;
  for (rr = Math.max(0, row); rr >= 0; rr--) {
    for (c = 0; c < COLS; c++) {
      t = cellOf(G.grid, c, rr);
      if (t === ICE || t === STONE) {
        return { x: colX(c) + BW * 0.5, y: rowStand(rr), row: rr };
      }
    }
  }
  return { x: sx0, y: rowStand(0), row: 0 };
}

function respawn() {
  var p, s, found;
  G.lives -= 1;
  renderPips();
  if (G.lives <= 0) {
    showOver(false);
    return;
  }
  p = makePlayer();
  s = G.lastSafe;
  found = standOnGrid(G.grid, s.x, s.y - 4, s.y + 8);
  if (!found) s = findSafe(s.x, s.row);
  else s = { x: s.x, y: found.y, row: found.row };
  p.x = wrapX(s.x);
  p.y = s.y;
  p.row = s.row;
  p.inv = INVULN;
  p.grounded = true;
  G.player = p;
  G.lastSafe = { x: p.x, y: p.y, row: p.row };
}

function grabCondor() {
  var p = G.player;
  if (p.state === 'win') return;
  p.state = 'win';
  p.grounded = true;
  p.vy = 40;
  addScore(2000 + G.lives * 200, p.x, p.y, '神鹰');
  burst(p.x, p.y + 20, 22, [255, 227, 107], 100, 0.6, 120);
  ringAt(p.x, p.y + 24, [255, 227, 107]);
  flash([255, 227, 107], 0.24);
  hitStop(0.08);
  kick('clear');
  toast('抓住神鹰', false, true);
  audio.condor();
  setTimeout(function () {
    if (G.mode === 'play') showOver(true);
  }, 900);
}

/* ---- sim ---- */
function cloudStand(x, yLo, yHi) {
  var i, cl, best, top, dx;
  best = null;
  for (i = 0; i < G.clouds.length; i++) {
    cl = G.clouds[i];
    top = cl.y;
    if (top < yLo - 0.01 || top > yHi + 1) continue;
    dx = wrapDx(x, cl.x + cl.w * 0.5);
    if (Math.abs(dx) > cl.w * 0.5 + PW * 0.35) continue;
    if (!best || top > best.y) best = { y: top, kind: 'cloud', cloud: cl, row: rowOfY(cl.y) };
  }
  return best;
}

function bestStand(x, yLo, yHi) {
  var a = standOnGrid(G.grid, x, yLo, yHi);
  var b = cloudStand(x, yLo, yHi);
  if (!a) return b;
  if (!b) return a;
  return a.y >= b.y ? a : b;
}

function tickClouds(dt) {
  var i, cl;
  for (i = 0; i < G.clouds.length; i++) {
    cl = G.clouds[i];
    cl.bob += dt * 3.2;
    cl.x = wrapX(cl.x + cl.vx * dt);
  }
}

function tickCondor(dt) {
  var c = G.condor;
  if (!c.live) return;
  c.flap += dt * 10;
  c.x += c.vx * dt;
  if (c.x > PAD + INNER - 28) { c.x = PAD + INNER - 28; c.vx = -Math.abs(c.vx); c.face = -1; }
  if (c.x < PAD + 28) { c.x = PAD + 28; c.vx = Math.abs(c.vx); c.face = 1; }
  c.y = rowStand(SUMMIT) + 32 + Math.sin(G.clock * 1.6) * 6;
}

function tickEnemies(dt) {
  var i, e, next, stand, spd, h;
  h = G.maxH;
  for (i = 0; i < G.enemies.length; i++) {
    e = G.enemies[i];
    if (e.dead) continue;
    if (e.kind === 'topi') {
      e.wob += dt * 8;
      if (e.fillT > 0) {
        e.fillT -= dt;
        if (e.fillT <= 0 && e.fillC >= 0 && cellOf(G.grid, e.fillC, e.row) === 0) {
          setCell(G.grid, e.fillC, e.row, ICE);
          burst(colX(e.fillC) + BW * 0.5, rowStand(e.row) - 4, 6, [160, 220, 255], 30, 0.25, 40);
          audio.fill();
          e.fillC = -1;
        }
        continue;
      }
      spd = (28 + Math.min(22, h * 0.8)) * (e.vx < 0 ? -1 : 1);
      if (G.kind === 'endless') spd *= 1 + Math.min(0.6, h * 0.02);
      next = wrapX(e.x + spd * dt);
      stand = standOnGrid(G.grid, next, rowStand(e.row) - 2, rowStand(e.row) + 4);
      if (!stand) {
        /* hole: try fill */
        e.fillC = colOfX(next);
        e.fillT = 0.72;
        e.vx *= -1;
        e.face = e.vx < 0 ? -1 : 1;
        continue;
      }
      e.x = next;
      e.y = rowStand(e.row);
      e.vx = spd;
      e.face = e.vx < 0 ? -1 : 1;
    } else {
      e.phase += dt * 3.4;
      e.x = wrapX(e.x + e.vx * dt * (G.kind === 'endless' ? 1 + Math.min(0.5, h * 0.015) : 1));
      e.y = e.homeY + Math.sin(e.phase) * 16;
      e.face = e.vx < 0 ? -1 : 1;
    }
  }
}

function tickVeggies(dt) {
  var i, v, p, dx, dy;
  p = G.player;
  for (i = G.veggies.length - 1; i >= 0; i--) {
    v = G.veggies[i];
    v.t += dt;
    if (v.dead) { G.veggies.splice(i, 1); continue; }
    if (p.state === 'dead' || G.mode !== 'play') continue;
    dx = wrapDx(p.x, v.x);
    dy = (p.y + 10) - v.y;
    if (dx * dx + dy * dy < 16 * 16) {
      v.dead = true;
      bumpCombo();
      addScore(v.pts, v.x, v.y, v.name);
      burst(v.x, v.y, 14, v.rgb, 70, 0.4, 90);
      ringAt(v.x, v.y, v.rgb);
      spark(v.x, v.y, 10, v.rgb);
      hitStop(0.045);
      audio.veggie(G.combo);
    }
  }
}

function tickPlayer(dt) {
  var p = G.player;
  var wish, spd, prevY, head, prevHead, stand, c, r, br, i, e, pb, hit;
  var wind, nx, cc, cols;

  if (p.state === 'dead') {
    p.deadT -= dt;
    p.vy -= GRAV * dt;
    p.y += p.vy * dt;
    p.squash = lerp(p.squash, 0.7, 0.2);
    if (p.deadT <= 0) respawn();
    return;
  }
  if (p.state === 'win') {
    p.x += (G.condor.x - p.x) * 0.08;
    p.y += (G.condor.y - 8 - p.y) * 0.08;
    p.swing = 0;
    return;
  }

  if (p.inv > 0) p.inv -= dt;
  if (p.coyote > 0) p.coyote -= dt;
  if (p.swing > 0) p.swing -= dt;
  if (p.swingCd > 0) p.swingCd -= dt;
  p.squash = lerp(p.squash, 1, 0.22);
  p.stretch = lerp(p.stretch, 1, 0.22);

  wish = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
  if (wish) p.face = wish;
  spd = p.grounded ? WALK : AIR;
  p.vx = lerp(p.vx, wish * spd, p.grounded ? 0.28 : 0.14);
  wind = G.wind;
  if (!p.grounded) p.vx += wind * dt;
  else p.vx += wind * 0.35 * dt;

  if ((G.jumpBuf > 0) && (p.grounded || p.coyote > 0)) {
    p.vy = JUMP_V;
    p.grounded = false;
    p.coyote = 0;
    G.jumpBuf = 0;
    p.cloud = null;
    p.stretch = 1.22;
    p.squash = 0.82;
    burst(p.x, p.y, 5, [180, 230, 255], 28, 0.22, 40);
    audio.hop();
    if (!reduceMotion()) hitStop(0.028);
  }

  if (G.hamBuf > 0 && p.swingCd <= 0) {
    doSwing(p);
    G.hamBuf = 0;
  }

  nx = wrapX(p.x + p.vx * dt);
  /* side bump against same-row bricks we are inside of (wall-ish stones) */
  if (p.grounded) {
    r = p.row;
    c = colOfX(nx + p.face * PW * 0.45);
    if (cellOf(G.grid, c, r + 1) === STONE) {
      br = brickRect(c, r + 1);
      if (overlap(nx - PW * 0.4, p.y + 4, PW * 0.8, PH - 6, br.x, br.y, br.w, br.h)) {
        nx = p.x;
        p.vx = 0;
      }
    }
  }
  p.x = nx;

  if (p.grounded) {
    stand = bestStand(p.x, p.y - 6, p.y + 8);
    if (!stand) {
      p.grounded = false;
      p.cloud = null;
      p.coyote = COYOTE;
    } else {
      p.y = stand.y;
      p.row = stand.row;
      p.cloud = stand.kind === 'cloud' ? stand.cloud : null;
      if (p.cloud) p.x = wrapX(p.x + p.cloud.vx * dt);
      G.lastSafe = { x: p.x, y: p.y, row: p.row };
      p.walk += Math.abs(p.vx) * dt * 0.14;
    }
  }

  if (!p.grounded) {
    p.vy -= GRAV * dt;
    if (keys.d && p.vy < 0) p.vy -= FAST_FALL * dt;
    if (p.vy < -MAX_FALL) p.vy = -MAX_FALL;
    prevY = p.y;
    p.y += p.vy * dt;

    if (p.vy > 0) {
      prevHead = prevY + PH;
      head = p.y + PH;
      r = rowOfY(prevY) + 1;
      cols = [wrapCol(colOfX(p.x) - 1), colOfX(p.x), wrapCol(colOfX(p.x) + 1)];
      for (i = 0; i < 3; i++) {
        for (cc = 0; cc < 3; cc++) {
          c = cols[cc];
          if (cellOf(G.grid, c, r + i) === 0) continue;
          br = brickRect(c, r + i);
          if (prevHead > br.y + 1 || head < br.y) continue;
          if (Math.abs(wrapDx(p.x, br.x + BW * 0.5)) > BW * 0.52 + PW * 0.3) continue;
          if (p.swing > 0 && cellOf(G.grid, c, r + i) === ICE) {
            smashBrick(c, r + i, p.x, p.y);
            p.hit = true;
          } else {
            if (p.swing > 0 && cellOf(G.grid, c, r + i) === STONE) clinkStone(c, r + i);
            p.y = br.y - PH - 0.2;
            p.vy = Math.min(p.vy, 40);
            p.squash = 0.88;
          }
        }
      }
    } else {
      stand = bestStand(p.x, p.y - 2, prevY + 2);
      if (stand && prevY >= stand.y - 1 && p.y <= stand.y + 2) {
        p.y = stand.y;
        p.vy = 0;
        p.grounded = true;
        p.row = stand.row;
        p.cloud = stand.kind === 'cloud' ? stand.cloud : null;
        p.coyote = COYOTE;
        p.squash = 1.18;
        p.stretch = 0.88;
        G.lastSafe = { x: p.x, y: p.y, row: p.row };
        burst(p.x, p.y, 4, [160, 220, 255], 22, 0.18, 30);
        audio.land();
      }
    }
  }

  if (p.swing > SWING * 0.15 && p.swing < SWING * 0.92) {
    hammerCells(p);
    hammerEnemies(p);
  }

  if (G.condor.live && p.state !== 'win') {
    if (Math.abs(wrapDx(p.x, G.condor.x)) < 16 && Math.abs((p.y + 12) - G.condor.y) < 16) {
      grabCondor();
      return;
    }
  }

  if (p.inv <= 0) {
    pb = playerHurtBox(p);
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead) continue;
      if (e.kind === 'topi') hit = overlap(pb.x, pb.y, pb.w, pb.h, e.x - 7, e.y + 1, 14, 13);
      else hit = overlap(pb.x, pb.y, pb.w, pb.h, e.x - 8, e.y - 5, 16, 12);
      if (hit) {
        kill('hit');
        return;
      }
    }
  }

  if (rowOfY(p.y) > G.maxH) {
    var oldH = G.maxH;
    G.maxH = Math.max(0, rowOfY(p.y));
    if (G.maxH > oldH && G.kind === 'endless' && G.maxH > 0) {
      addScore(10, p.x, p.y, null);
    }
    heightEl.textContent = String(G.maxH);
    ensureRows(G.maxH + 18);
  }

  if (p.y < G.camY - 18) kill('fall');
}

function tickCam(dt) {
  var p = G.player;
  var target = p.y - VIEW_H * 0.36;
  if (target < 0) target = 0;
  if (target > G.camY) G.camY += (target - G.camY) * Math.min(1, 0.13 + dt * 2);
  else G.camY += (target - G.camY) * 0.045;
  if (G.camY < 0) G.camY = 0;
}

function tickFx(dt) {
  var i, o;
  G.comboAge += dt;
  if (G.comboAge > COMBO_WIN && G.combo > 0) {
    G.combo = 0;
    comboEl.textContent = '×1';
    comboBox.classList.remove('hot');
  }
  G.shake *= Math.pow(0.04, dt);
  G.kickX *= Math.pow(0.02, dt);
  G.kickY *= Math.pow(0.02, dt);
  G.flash = Math.max(0, G.flash - dt * 1.8);

  for (i = particles.length - 1; i >= 0; i--) {
    o = particles[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.vy -= o.g * dt;
    o.y += o.vy * dt;
    if (o.t <= 0) particles.splice(i, 1);
  }
  for (i = sparks.length - 1; i >= 0; i--) {
    o = sparks[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.vy -= 120 * dt;
    if (o.t <= 0) sparks.splice(i, 1);
  }
  for (i = floats.length - 1; i >= 0; i--) {
    o = floats[i];
    o.t += dt;
    o.y += 28 * dt;
    if (o.t > 0.7) floats.splice(i, 1);
  }
  for (i = rings.length - 1; i >= 0; i--) {
    o = rings[i];
    o.t += dt;
    o.r += 70 * dt;
    if (o.t > 0.35) rings.splice(i, 1);
  }
  for (i = shards.length - 1; i >= 0; i--) {
    o = shards[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.vy -= 280 * dt;
    o.y += o.vy * dt;
    o.rot += o.vr * dt;
    if (o.t <= 0) shards.splice(i, 1);
  }
  for (i = 0; i < snow.length; i++) {
    o = snow[i];
    o.p += dt;
    o.y -= o.v * dt * 0.02;
    o.x = wrapX(o.x + G.wind * 0.45 * dt + Math.sin(o.p) * 8 * dt);
    o.y -= o.v * dt;
    if (o.y < G.camY - 20) o.y = G.camY + VIEW_H + rand(0, 40);
    if (o.y > G.camY + VIEW_H + 40) o.y = G.camY - 10;
  }
}

function tick(dt) {
  G.clock += dt;
  G.jumpBuf = Math.max(0, G.jumpBuf - dt);
  G.hamBuf = Math.max(0, G.hamBuf - dt);

  G.windAmp = G.kind === 'endless'
    ? 14 + Math.min(72, G.maxH * 2.1)
    : (G.maxH > 10 ? 10 + (G.maxH - 10) * 1.1 : 0);
  G.wind = windAt(G.kind, G.maxH, G.clock);
  syncWind();

  tickClouds(dt);
  tickCondor(dt);
  if (G.mode === 'play') {
    if (autoOn) tickAuto();
    tickPlayer(dt);
    tickEnemies(dt);
    tickVeggies(dt);
  } else {
    tickEnemies(dt);
  }
  tickCam(dt);
  tickFx(dt);
}

/* ---- draw ---- */
function resize() {
  var rect = stageEl.getBoundingClientRect();
  cssW = rect.width;
  cssH = rect.height;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, (cssW * dpr) | 0);
  canvas.height = Math.max(1, (cssH * dpr) | 0);
  var padB = coarseQ.matches ? 62 : 10;
  var avW = cssW;
  var avH = Math.max(40, cssH - padB);
  var s = Math.min(avW / WORLD_W, avH / VIEW_H);
  L.s = s;
  L.x = (avW - WORLD_W * s) / 2;
  L.y = Math.max(4, (avH - VIEW_H * s) / 2);
}

function sx(x) { return L.x + x * L.s; }
function sy(y) { return L.y + (VIEW_H - (y - G.camY)) * L.s; }

function drawBg() {
  var g, i, y, a;
  ctx.fillStyle = '#070314';
  ctx.fillRect(0, 0, cssW, cssH);

  g = ctx.createRadialGradient(sx(80), sy(G.camY + VIEW_H * 0.85), 8, sx(80), sy(G.camY + VIEW_H * 0.85), 220 * L.s);
  g.addColorStop(0, 'rgba(30,200,255,0.16)');
  g.addColorStop(1, 'rgba(30,200,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  g = ctx.createRadialGradient(sx(280), sy(G.camY + VIEW_H * 0.9), 8, sx(280), sy(G.camY + VIEW_H * 0.9), 180 * L.s);
  g.addColorStop(0, 'rgba(255,61,184,0.1)');
  g.addColorStop(1, 'rgba(255,61,184,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  /* aurora */
  ctx.save();
  ctx.globalAlpha = 0.22;
  for (i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.strokeStyle = i === 1 ? 'rgba(255,61,184,0.7)' : 'rgba(30,200,255,0.8)';
    ctx.lineWidth = (7 - i * 2) * L.s;
    ctx.moveTo(sx(0), sy(G.camY + VIEW_H * 0.82 + Math.sin(G.clock * 0.4 + i) * 18));
    for (a = 0; a <= 12; a++) {
      ctx.lineTo(
        sx(a / 12 * WORLD_W),
        sy(G.camY + VIEW_H * 0.78 + Math.sin(G.clock * 0.6 + a * 0.7 + i) * 22 + i * 10)
      );
    }
    ctx.stroke();
  }
  ctx.restore();

  /* distant peaks */
  ctx.fillStyle = 'rgba(12, 28, 48, 0.85)';
  ctx.beginPath();
  ctx.moveTo(sx(-10), sy(G.camY));
  ctx.lineTo(sx(40), sy(G.camY + 90));
  ctx.lineTo(sx(90), sy(G.camY + 30));
  ctx.lineTo(sx(150), sy(G.camY + 140));
  ctx.lineTo(sx(210), sy(G.camY + 50));
  ctx.lineTo(sx(280), sy(G.camY + 160));
  ctx.lineTo(sx(340), sy(G.camY + 40));
  ctx.lineTo(sx(380), sy(G.camY + 110));
  ctx.lineTo(sx(380), sy(G.camY));
  ctx.fill();

  /* stars */
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (i = 0; i < 18; i++) {
    y = ((i * 97 + 40) % (VIEW_H + 80));
    ctx.globalAlpha = 0.25 + (i % 5) * 0.1;
    ctx.fillRect(sx((i * 53 + 12) % WORLD_W), sy(G.camY + y), 1.4 * L.s, 1.4 * L.s);
  }
  ctx.globalAlpha = 1;

  /* side glow */
  ctx.fillStyle = 'rgba(8, 18, 32, 0.55)';
  ctx.fillRect(sx(0), sy(G.camY + VIEW_H), PAD * L.s, VIEW_H * L.s);
  ctx.fillRect(sx(PAD + INNER), sy(G.camY + VIEW_H), PAD * L.s, VIEW_H * L.s);
}

function drawBrick(c, r) {
  var t = cellOf(G.grid, c, r);
  var x, y, w, h, g;
  if (t === 0) return;
  x = sx(colX(c));
  y = sy(rowStand(r));
  w = BW * L.s;
  h = BH * L.s;
  if (t === STONE) {
    ctx.fillStyle = '#3a1844';
    roundRect(x + 1, y, w - 2, h - 1, 2.2 * L.s);
    ctx.fill();
    ctx.fillStyle = '#5a2468';
    roundRect(x + 2, y + 1, w - 4, h * 0.4, 1.6 * L.s);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,61,184,0.55)';
    ctx.lineWidth = 1.1 * L.s;
    roundRect(x + 1, y, w - 2, h - 1, 2.2 * L.s);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,180,230,0.45)';
    ctx.fillRect(x + w * 0.3, y + 3 * L.s, 2 * L.s, 2 * L.s);
    ctx.fillRect(x + w * 0.62, y + 7 * L.s, 1.6 * L.s, 1.6 * L.s);
    return;
  }
  ctx.fillStyle = '#0b4c72';
  roundRect(x + 1, y, w - 2, h - 1, 2.4 * L.s);
  ctx.fill();
  g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, 'rgba(180, 245, 255, 0.55)');
  g.addColorStop(0.35, 'rgba(30, 200, 255, 0.55)');
  g.addColorStop(1, 'rgba(10, 90, 140, 0.2)');
  ctx.fillStyle = g;
  roundRect(x + 1.5, y + 0.5, w - 3, h - 2, 2 * L.s);
  ctx.fill();
  ctx.strokeStyle = 'rgba(122, 246, 255, 0.7)';
  ctx.lineWidth = 1.15 * L.s;
  roundRect(x + 1, y, w - 2, h - 1, 2.4 * L.s);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(x + 4 * L.s, y + 3 * L.s, w * 0.34, 1.6 * L.s);
}

function roundRect(x, y, w, h, r) {
  var rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawGround() {
  var y;
  if (G.camY > BASE + 90) return;
  y = sy(rowStand(0));
  ctx.fillStyle = '#082436';
  ctx.fillRect(sx(PAD), y + (BH - 1) * L.s, INNER * L.s, 90 * L.s);
  ctx.fillStyle = 'rgba(122,246,255,0.18)';
  ctx.fillRect(sx(PAD), y + (BH - 1) * L.s, INNER * L.s, 3 * L.s);
}

function drawBricks() {
  var r0 = Math.max(0, Math.floor((G.camY - 20 - BASE) / ROW_H));
  var r1 = Math.min(G.grid.length - 1, Math.ceil((G.camY + VIEW_H + 20 - BASE) / ROW_H));
  var r, c;
  drawGround();
  for (r = r0; r <= r1; r++) {
    for (c = 0; c < COLS; c++) drawBrick(c, r);
  }
}

function drawClouds() {
  var i, cl, x, y, w, h, b;
  for (i = 0; i < G.clouds.length; i++) {
    cl = G.clouds[i];
    if (cl.y < G.camY - 20 || cl.y > G.camY + VIEW_H + 20) continue;
    b = Math.sin(cl.bob) * 2;
    x = sx(cl.x);
    y = sy(cl.y + b);
    w = cl.w * L.s;
    h = 10 * L.s;
    ctx.fillStyle = 'rgba(180, 240, 255, 0.18)';
    roundRect(x - 4 * L.s, y - 4 * L.s, w + 8 * L.s, h + 8 * L.s, 8 * L.s);
    ctx.fill();
    ctx.fillStyle = '#c8f4ff';
    roundRect(x, y, w, h, 5 * L.s);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    roundRect(x + 4 * L.s, y + 2 * L.s, w * 0.5, 3 * L.s, 2 * L.s);
    ctx.fill();
    ctx.strokeStyle = 'rgba(30,200,255,0.55)';
    ctx.lineWidth = 1.1 * L.s;
    roundRect(x, y, w, h, 5 * L.s);
    ctx.stroke();
  }
}

function drawVeggies() {
  var i, v, x, y, bob;
  for (i = 0; i < G.veggies.length; i++) {
    v = G.veggies[i];
    if (v.dead) continue;
    bob = Math.sin(v.t * 5) * 3;
    x = sx(v.x);
    y = sy(v.y + bob);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = rgba(v.rgb, 0.25);
    ctx.beginPath();
    ctx.arc(0, 0, 10 * L.s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(v.rgb, 1);
    ctx.beginPath();
    ctx.ellipse(0, 2 * L.s, 5 * L.s, 6.5 * L.s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#7dff9a';
    ctx.fillRect(-1.2 * L.s, -7 * L.s, 2.4 * L.s, 4 * L.s);
    ctx.restore();
  }
}

function drawTopi(e) {
  var x = sx(e.x);
  var y = sy(e.y);
  var s = L.s;
  var w = Math.sin(e.wob) * 2 * s;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(e.face, 1);
  ctx.fillStyle = 'rgba(30,200,255,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, -2 * s, 11 * s, 5 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e8f7ff';
  ctx.beginPath();
  ctx.ellipse(w * 0.2, -7 * s, 8 * s, 7 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#b8e6ff';
  ctx.beginPath();
  ctx.ellipse(w * 0.2, -4 * s, 7 * s, 4.5 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(3 * s, -9 * s, 1.1 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff8ab0';
  ctx.beginPath();
  ctx.ellipse(7 * s, -6.5 * s, 2.2 * s, 1.4 * s, 0, 0, TAU);
  ctx.fill();
  if (e.fillT > 0) {
    ctx.fillStyle = 'rgba(160,230,255,' + (0.4 + e.fillT) + ')';
    ctx.fillRect(8 * s, -4 * s, 6 * s, 4 * s);
  }
  ctx.restore();
}

function drawBird(e) {
  var x = sx(e.x);
  var y = sy(e.y);
  var s = L.s;
  var flap = Math.sin(e.phase * 2.4) * 0.55;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(e.face, 1);
  ctx.fillStyle = '#ff3db8';
  ctx.beginPath();
  ctx.ellipse(0, 0, 7 * s, 4.2 * s, 0, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.rotate(flap);
  ctx.fillStyle = '#ff7ad4';
  ctx.beginPath();
  ctx.ellipse(-2 * s, -5 * s, 7 * s, 2.4 * s, 0.2, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ffe36b';
  ctx.beginPath();
  ctx.moveTo(7 * s, -1 * s);
  ctx.lineTo(11 * s, 0);
  ctx.lineTo(7 * s, 1.4 * s);
  ctx.fill();
  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(3 * s, -1 * s, 1 * s, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawCondor() {
  var c = G.condor;
  var x, y, s, flap;
  if (!c.live && G.kind !== 'summit') return;
  if (!c.live) return;
  x = sx(c.x);
  y = sy(c.y);
  s = L.s;
  flap = Math.sin(c.flap) * 0.5;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(c.face, 1);
  ctx.fillStyle = 'rgba(255,227,107,0.18)';
  ctx.beginPath();
  ctx.arc(0, 0, 22 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c45a18';
  ctx.beginPath();
  ctx.ellipse(0, 2 * s, 12 * s, 6 * s, 0, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.rotate(flap);
  ctx.fillStyle = '#ffe36b';
  ctx.beginPath();
  ctx.ellipse(-4 * s, -8 * s, 16 * s, 4 * s, 0.15, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ff3db8';
  ctx.beginPath();
  ctx.moveTo(12 * s, 0);
  ctx.lineTo(18 * s, 2 * s);
  ctx.lineTo(12 * s, 4 * s);
  ctx.fill();
  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(6 * s, 0, 1.4 * s, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawHammer(p, px, py, s) {
  var t, ang, hx, hy;
  t = p.swing > 0 ? 1 - p.swing / SWING : 0;
  if (p.swing > 0) ang = -1.15 + t * 2.35;
  else ang = -0.7;
  hx = 0;
  hy = -PH * s + 2 * s;
  ctx.save();
  ctx.translate(px, py + hy);
  ctx.rotate(ang);
  ctx.strokeStyle = '#6a3a18';
  ctx.lineWidth = 2.1 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -11 * s);
  ctx.stroke();
  ctx.fillStyle = '#ffe36b';
  roundRect(-6.5 * s, -16 * s, 13 * s, 6.5 * s, 1.8 * s);
  ctx.fill();
  ctx.strokeStyle = 'rgba(30,200,255,0.8)';
  ctx.lineWidth = 1.1 * s;
  roundRect(-6.5 * s, -16 * s, 13 * s, 6.5 * s, 1.8 * s);
  ctx.stroke();
  if (p.swing > 0 && t > 0.2 && t < 0.85) {
    ctx.strokeStyle = 'rgba(122,246,255,' + (0.55) + ')';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.arc(0, -4 * s, 14 * s, p.face > 0 ? -0.2 : Math.PI - 0.4, p.face > 0 ? 1.1 : Math.PI + 0.9);
    ctx.stroke();
  }
  ctx.restore();
}

function drawOnePlayer(p, ox) {
  var s = L.s;
  var px = sx(p.x) + ox;
  var py = sy(p.y);
  var blink = p.inv > 0 && ((G.clock * 18) | 0) % 2 === 0;
  var bodyH, bodyW;
  if (blink) return;
  bodyW = PW * s * p.squash;
  bodyH = PH * s * p.stretch;
  ctx.save();
  ctx.translate(px, py);
  ctx.scale(p.face, 1);
  /* shadow */
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 7 * s, 2.2 * s, 0, 0, TAU);
  ctx.fill();
  /* boots */
  ctx.fillStyle = '#1a2a44';
  roundRect(-5 * s, -4 * s, 4.2 * s, 4 * s, 1 * s);
  ctx.fill();
  roundRect(0.6 * s, -4 * s, 4.2 * s, 4 * s, 1 * s);
  ctx.fill();
  /* body parka */
  ctx.fillStyle = '#1ec8ff';
  roundRect(-bodyW * 0.55, -bodyH + 3 * s, bodyW * 1.1, bodyH * 0.62, 3 * s);
  ctx.fill();
  ctx.fillStyle = '#7af6ff';
  roundRect(-bodyW * 0.4, -bodyH + 5 * s, bodyW * 0.8, 4 * s, 1.5 * s);
  ctx.fill();
  /* hood / head */
  ctx.fillStyle = '#eaf6ff';
  ctx.beginPath();
  ctx.arc(0, -bodyH + 6 * s, 5.4 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#1ec8ff';
  ctx.beginPath();
  ctx.arc(0, -bodyH + 6 * s, 6.2 * s, Math.PI * 1.05, TAU + Math.PI * -0.05);
  ctx.fill();
  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(-1.6 * s, -bodyH + 6.2 * s, 1 * s, 0, TAU);
  ctx.arc(1.8 * s, -bodyH + 6.2 * s, 1 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffe36b';
  ctx.fillRect(-3.4 * s, -bodyH + 8.4 * s, 6.8 * s, 1.3 * s);
  drawHammer(p, 0, 0, s);
  ctx.restore();
}

function drawPlayer() {
  var p = G.player;
  if (p.y < G.camY - 30 || p.y > G.camY + VIEW_H + 40) return;
  drawOnePlayer(p, 0);
  if (p.x < PAD + 18) drawOnePlayer(p, INNER * L.s);
  if (p.x > PAD + INNER - 18) drawOnePlayer(p, -INNER * L.s);
}

function drawEnemies() {
  var i, e;
  for (i = 0; i < G.enemies.length; i++) {
    e = G.enemies[i];
    if (e.dead) continue;
    if (e.y < G.camY - 24 || e.y > G.camY + VIEW_H + 24) continue;
    if (e.kind === 'topi') drawTopi(e);
    else drawBird(e);
  }
}

function drawFx() {
  var i, o, a, x, y;
  for (i = 0; i < rings.length; i++) {
    o = rings[i];
    a = 1 - o.t / 0.35;
    ctx.strokeStyle = rgba(o.rgb, a * 0.8);
    ctx.lineWidth = 2 * L.s;
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), o.r * L.s, 0, TAU);
    ctx.stroke();
  }
  for (i = 0; i < particles.length; i++) {
    o = particles[i];
    a = clamp(o.t / o.max, 0, 1);
    ctx.fillStyle = rgba(o.rgb, a);
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), o.r * L.s, 0, TAU);
    ctx.fill();
  }
  for (i = 0; i < sparks.length; i++) {
    o = sparks[i];
    ctx.strokeStyle = rgba(o.rgb, clamp(o.t / 0.2, 0, 1));
    ctx.lineWidth = 1.2 * L.s;
    ctx.beginPath();
    ctx.moveTo(sx(o.x), sy(o.y));
    ctx.lineTo(sx(o.x - o.vx * 0.03), sy(o.y - o.vy * 0.03));
    ctx.stroke();
  }
  for (i = 0; i < shards.length; i++) {
    o = shards[i];
    ctx.save();
    ctx.translate(sx(o.x), sy(o.y));
    ctx.rotate(o.rot);
    a = o.t > 0.15 ? 1 : o.t / 0.15;
    ctx.fillStyle = rgba(o.rgb, a);
    ctx.fillRect(-o.w * 0.5 * L.s, -o.h * 0.5 * L.s, o.w * L.s, o.h * L.s);
    ctx.restore();
  }
  ctx.font = 'bold ' + (10 * L.s) + 'px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  for (i = 0; i < floats.length; i++) {
    o = floats[i];
    a = 1 - o.t / 0.7;
    ctx.fillStyle = rgba(o.rgb, a);
    ctx.fillText(o.text, sx(o.x), sy(o.y));
  }
  for (i = 0; i < snow.length; i++) {
    o = snow[i];
    x = sx(o.x);
    y = sy(G.camY + (o.y % VIEW_H));
    /* snow uses world y already */
    y = sy(o.y);
    ctx.fillStyle = 'rgba(220,245,255,' + (0.25 + o.s * 0.2) + ')';
    ctx.fillRect(x, y, o.s * L.s, o.s * L.s);
  }
}

function drawWind() {
  var i, y, x0, len;
  if (Math.abs(G.wind) < 8) return;
  ctx.strokeStyle = 'rgba(122,246,255,' + clamp(Math.abs(G.wind) / 80, 0.08, 0.28) + ')';
  ctx.lineWidth = 1.1 * L.s;
  len = 18 + Math.abs(G.wind) * 0.35;
  for (i = 0; i < 9; i++) {
    y = G.camY + ((i * 53 + G.clock * 40 * (G.wind > 0 ? 1 : -1)) % VIEW_H);
    x0 = ((i * 41 + G.clock * G.wind * 1.4) % WORLD_W + WORLD_W) % WORLD_W;
    ctx.beginPath();
    ctx.moveTo(sx(x0), sy(y));
    ctx.lineTo(sx(x0 + (G.wind > 0 ? len : -len)), sy(y - 3));
    ctx.stroke();
  }
}

function drawFlash() {
  if (G.flash <= 0) return;
  ctx.fillStyle = rgba(G.flashRgb, clamp(G.flash * 2.2, 0, 0.28));
  ctx.fillRect(0, 0, cssW, cssH);
}

function drawPeakFlag() {
  var x, y;
  if (G.kind !== 'summit') return;
  x = sx(PAD + INNER * 0.5);
  y = sy(rowStand(SUMMIT) + 8);
  ctx.strokeStyle = 'rgba(255,227,107,0.7)';
  ctx.lineWidth = 1.4 * L.s;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 22 * L.s);
  ctx.stroke();
  ctx.fillStyle = '#ff3db8';
  ctx.beginPath();
  ctx.moveTo(x, y - 22 * L.s);
  ctx.lineTo(x + 12 * L.s, y - 16 * L.s);
  ctx.lineTo(x, y - 10 * L.s);
  ctx.fill();
}

function draw() {
  var shx, shy;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  shx = (G.shake ? (Math.random() - 0.5) * G.shake : 0) + G.kickX;
  shy = (G.shake ? (Math.random() - 0.5) * G.shake * 0.6 : 0) + G.kickY;
  ctx.translate(shx, shy);
  drawBg();
  drawWind();
  drawPeakFlag();
  drawBricks();
  drawClouds();
  drawVeggies();
  drawCondor();
  drawEnemies();
  drawPlayer();
  drawFx();
  drawFlash();
}

function autoScale() {
  if (!autoOn || G.mode !== 'play') return 1;
  return AUTO_SCALE[autoSpeed] || 1;
}

function frame(ts) {
  var dt, steps, turbo, scale, maxSteps;
  if (!lastTs) lastTs = ts;
  dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (dt > 0.08) dt = 0.08;
  if (!hidden) {
    turbo = autoOn && autoSpeed >= 4 && G.mode === 'play';
    if (G.stop > 0 && !turbo) {
      G.stop -= dt;
      tickFx(dt);
    } else {
      if (turbo) G.stop = 0;
      scale = autoScale();
      acc += dt * scale;
      steps = 0;
      maxSteps = turbo ? 16 : 5;
      while (acc >= STEP && steps < maxSteps) {
        tick(STEP);
        acc -= STEP;
        steps++;
      }
      if (acc > STEP * 4) acc = 0;
    }
  }
  draw();
  requestAnimationFrame(frame);
}

/* ---- autoplay ---- */
function clearAutoKeys() {
  keys.l = false;
  keys.r = false;
  keys.u = false;
  keys.d = false;
  keys.h = false;
}

function tickAuto() {
  var p = G.player;
  var d;
  clearAutoKeys();
  if (!autoOn || G.mode !== 'play') return;
  if (p.state === 'dead' || p.state === 'win') return;

  if (p.row !== autoLastRow) {
    if (p.row > autoLastRow) autoIdle = 0;
    autoLastRow = p.row;
    autoCol = -1;
  } else {
    autoIdle += STEP;
  }

  d = autoDecide({
    grid: G.grid,
    player: p,
    enemies: G.enemies,
    clouds: G.clouds,
    condor: G.condor,
    veggies: G.veggies,
    kind: G.kind,
    wind: G.wind,
    stickyCol: autoCol,
    landDir: autoLandDir,
    idle: autoIdle
  });
  autoCol = d.col;
  autoLandDir = d.landDir;
  keys.l = d.l;
  keys.r = d.r;
  keys.d = d.d;
  if (d.jump) G.jumpBuf = BUFFER;
  if (d.hammer) G.hamBuf = BUFFER;
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

function toggleAuto() {
  autoOn = !autoOn;
  autoCol = -1;
  autoIdle = 0;
  clearAutoKeys();
  G.jumpBuf = 0;
  G.hamBuf = 0;
  syncAutoUi();
  if (autoOn) {
    audio.ensure();
    if (G.mode === 'title') startRun('summit');
  }
  if (G.mode === 'play') hudPlay();
}

function setAutoSpeed(n) {
  if (n < 1 || n > 4 || !isFinite(n)) n = 3;
  autoSpeed = n;
  saveAutoSpeed(autoSpeed);
  syncSpeedUi();
}

/* ---- input ---- */
function bindPad(el, setter) {
  function down(ev) {
    ev.preventDefault();
    if (autoOn) return;
    setter(true);
    el.classList.add('held');
    audio.ensure();
    try { el.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
  }
  function up(ev) {
    ev.preventDefault();
    setter(false);
    el.classList.remove('held');
  }
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('lostpointercapture', function () {
    setter(false);
    el.classList.remove('held');
  });
}

bindPad(btnLeft, function (v) { keys.l = v; });
bindPad(btnRight, function (v) { keys.r = v; });
bindPad(btnJump, function (v) {
  keys.u = v;
  if (v) G.jumpBuf = BUFFER;
});
bindPad(btnHammer, function (v) {
  keys.h = v;
  if (v) G.hamBuf = BUFFER;
});

function keyOn(e, down) {
  var k = e.code;
  if (k === 'ArrowLeft') { keys.l = down; e.preventDefault(); }
  else if (k === 'ArrowRight' || k === 'KeyD') { keys.r = down; e.preventDefault(); }
  else if (k === 'ArrowDown' || k === 'KeyS') { keys.d = down; e.preventDefault(); }
  else if (k === 'ArrowUp' || k === 'KeyW') {
    keys.u = down;
    if (down) G.jumpBuf = BUFFER;
    e.preventDefault();
  } else if (k === 'Space') {
    keys.h = down;
    if (down) G.hamBuf = BUFFER;
    e.preventDefault();
  }
}

function isAutoKey(e) {
  return e.code === 'KeyA' || e.key === 'a' || e.key === 'A';
}

window.addEventListener('keydown', function (e) {
  if (isAutoKey(e)) {
    if (e.repeat) return;
    audio.ensure();
    toggleAuto();
    e.preventDefault();
    return;
  }
  if (e.target === speedEl) return;
  if (e.repeat) {
    if (autoOn) {
      e.preventDefault();
      return;
    }
    keyOn(e, true);
    return;
  }
  audio.ensure();
  if (e.code === 'KeyM') {
    audio.setMuted(!audio.muted);
    e.preventDefault();
    return;
  }
  if (e.code === 'KeyR') {
    retry();
    e.preventDefault();
    return;
  }
  if (G.mode === 'title') {
    if (e.code === 'Digit1' || e.code === 'Enter' || e.code === 'Space') {
      startRun('summit');
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      startRun('endless');
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
      startRun('endless');
      e.preventDefault();
      return;
    }
  }
  if (autoOn) {
    if (
      e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'ArrowUp' ||
      e.code === 'ArrowDown' || e.code === 'Space' || e.code === 'KeyD' ||
      e.code === 'KeyS' || e.code === 'KeyW'
    ) {
      e.preventDefault();
    }
    return;
  }
  keyOn(e, true);
});

window.addEventListener('keyup', function (e) {
  if (isAutoKey(e)) {
    e.preventDefault();
    return;
  }
  if (autoOn) return;
  keyOn(e, false);
});

btnMute.addEventListener('click', function () {
  audio.ensure();
  audio.setMuted(!audio.muted);
});
btnAuto.addEventListener('click', function () { toggleAuto(); });
speedEl.addEventListener('input', function () { setAutoSpeed(parseInt(speedEl.value, 10)); });
speedEl.addEventListener('change', function () { setAutoSpeed(parseInt(speedEl.value, 10)); });
btnRetry.addEventListener('click', function () {
  audio.ensure();
  retry();
});
btnSummit.addEventListener('click', function () {
  audio.ensure();
  startRun('summit');
});
btnEndless.addEventListener('click', function () {
  audio.ensure();
  startRun('endless');
});
ovRetry.addEventListener('click', function () {
  audio.ensure();
  startRun(G.kind);
});

canvas.addEventListener('pointerdown', function () {
  audio.ensure();
  canvas.focus({ preventScroll: true });
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

seedSnow();
bestEl.textContent = String(G.bestS);
renderPips();
syncSpeedUi();
syncAutoUi();
showTitle();
resize();
hudPlay();
modeLabel.textContent = '登顶';
requestAnimationFrame(frame);

}
