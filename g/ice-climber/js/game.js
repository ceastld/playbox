'use strict';

/* 冰锤 — Ice Climber remake. Jump-hammer ice, Topi steal bricks. Optional autoplay. No CDN. */

var WORLD_W = 384;
var VIEW_H = 500;
var COLS = 16;
var BW = 22;
var BH = 14;
var PAD = 16;
var INNER = COLS * BW;
var BASE = 28;
var ROW_H = 46;
var SUMMIT = 10;
var LIVES = 3;
var PW = 12;
var PH = 20;
var WALK = 108;
var AIR = 118;
var JUMP_V = 292;
var GRAV = 800;
var MAX_FALL = 430;
var FAST_FALL = 240;
var COYOTE = 0.09;
var BUFFER = 0.12;
var INVULN = 1.05;
var DIE_T = 0.62;
var COMBO_WIN = 1.2;
var SMASH_CD = 0.09;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var BEST_KEY = 'playbox-ice-climber-best';
var MUTE_KEY = 'playbox-ice-climber-mute';
var AUTO_SPEED_KEY = 'playbox-ice-climber-auto-speed';
var SPEED_LABELS = ['', '慢', '中', '快', '极快'];
var AUTO_SCALE = [1, 0.52, 0.78, 1, 3.4];

var EMPTY = 0;
var ICE = 1;
var ICE2 = 2;
var STONE = 9;

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
function wrapCol(c) {
  c %= COLS;
  if (c < 0) c += COLS;
  return c;
}
function wrapX(x) {
  var a = PAD;
  var w = INNER;
  return ((x - a) % w + w) % w + a;
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
function colCenter(c) {
  return colX(c) + BW * 0.5;
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
function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
function comboMul(n) {
  return 1 + Math.max(0, n - 1) * 0.18;
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

function wrapColDist(a, b) {
  var d = wrapCol(b - a);
  if (d > COLS / 2) d -= COLS;
  return d;
}

function wrapColAbs(a, b) {
  return Math.abs(wrapColDist(a, b));
}

function landDirFor(grid, c, row, face) {
  var leftC = cellOf(grid, c - 1, row + 1);
  var rightC = cellOf(grid, c + 1, row + 1);
  if (isSolid(leftC) && !isSolid(rightC)) return -1;
  if (isSolid(rightC) && !isSolid(leftC)) return 1;
  if (isSolid(leftC) && isSolid(rightC)) return face >= 0 ? 1 : -1;
  if (isSolid(cellOf(grid, c - 2, row + 1))) return -1;
  if (isSolid(cellOf(grid, c + 2, row + 1))) return 1;
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
    if (!isSolid(cellOf(grid, c, row))) return i;
  }
  return 0;
}

function nearestStandX(grid, x, row) {
  var i, c0, c, bestX, best, d, rr;
  bestX = x;
  best = 1e9;
  c0 = colOfX(x);
  for (rr = row; rr >= Math.max(0, row - 1); rr--) {
    for (i = 0; i < COLS; i++) {
      c = wrapCol(c0 + (i % 2 === 0 ? (i / 2) | 0 : -((i + 1) / 2) | 0));
      if (!isSolid(cellOf(grid, c, rr))) continue;
      d = Math.abs(wrapDx(colCenter(c), x));
      if (d < best) {
        best = d;
        bestX = colCenter(c);
      }
    }
    if (best < BW) break;
  }
  return bestX;
}

function pickClimbCol(grid, p, sticky, enemies, idle) {
  var row = Math.max(0, p.row | 0);
  var pCol = colOfX(p.x);
  var best = pCol;
  var bestS = 1e9;
  var c, s, ceil, floor, dist, i, e, ld, ignoreSticky, landL, landR;
  ignoreSticky = idle > 1.6;
  for (c = 0; c < COLS; c++) {
    floor = cellOf(grid, c, row);
    ceil = cellOf(grid, c, row + 1);
    dist = wrapColAbs(pCol, c);
    s = dist * 7;
    if (!isSolid(floor)) s += 420;
    if (ceil === STONE) s += 520;
    else if (isIce(ceil)) {
      s += 12;
      if (row + 1 === SUMMIT) s -= 36;
    } else {
      ld = landDirFor(grid, c, row, p.face);
      landL = isSolid(cellOf(grid, c + ld, row + 1));
      landR = isSolid(cellOf(grid, c - ld, row + 1));
      if (!landL && !landR) s += 90;
      else {
        s -= 48;
        if (cellOf(grid, c + ld, row + 1) === STONE) s += 80;
      }
      if (row + 1 === SUMMIT) s += 24;
    }
    if (row + 1 >= SUMMIT && isIce(cellOf(grid, c, SUMMIT))) s -= 18;
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
    jump: false,
    col: st.stickyCol, landDir: st.landDir || 1
  };
  var row, col, ceil, tx, dx, dir, threat, bird, ld, cond, landX, steps, other, idle;
  var aligned, want, aimRow, holeAhead, landC;

  if (!p || p.state === 'dead' || p.state === 'win') return out;

  row = Math.max(0, p.row | 0);
  col = colOfX(p.x);
  cond = st.condor;
  idle = st.idle || 0;

  if (cond && cond.live && row >= SUMMIT) {
    dx = wrapDx(cond.x, p.x);
    if (dx > 4) out.r = true;
    else if (dx < -4) out.l = true;
    if (Math.abs(dx) < 22 && (p.grounded || p.coyote > 0)) out.jump = true;
    if (!p.grounded) {
      out.l = dx < -3;
      out.r = dx > 3;
    }
    out.col = col;
    return out;
  }

  out.col = pickClimbCol(grid, p, st.stickyCol, st.enemies, idle);
  ceil = cellOf(grid, out.col, row + 1);
  ld = landDirFor(grid, out.col, row, p.face || 1);
  out.landDir = ld;
  tx = colCenter(out.col) + (ceil === STONE ? 0 : (isIce(ceil) ? 0 : ld * 6));

  threat = p.inv > 0 ? null : topiAt(st.enemies, p.x, row, 22);
  bird = p.inv > 0 ? null : birdNear(st.enemies, p.x, p.y, 22);

  if (!p.grounded) {
    aimRow = Math.max(row, rowOfY(p.y));
    if (isIce(cellOf(grid, out.col, row + 1)) && Math.abs(wrapDx(colCenter(out.col), p.x)) < 14 && !p.struck) {
      landX = colCenter(out.col);
    } else if (p.y < rowStand(row) + ROW_H - 8) {
      landX = colCenter(out.col);
    } else {
      landC = wrapCol(out.col + ld);
      if (isSolid(cellOf(grid, landC, row + 1))) landX = colCenter(landC);
      else landX = nearestStandX(grid, p.x, Math.max(aimRow, row + 1));
    }
    if (threat) {
      dx = wrapDx(threat.x, p.x);
      if (Math.abs(dx) < 16) {
        if (dx > 2) out.r = true;
        else if (dx < -2) out.l = true;
        return out;
      }
    }
    if (bird) {
      dx = wrapDx(bird.x, p.x);
      if (Math.abs(dx) < 16) {
        if (dx > 3) out.r = true;
        else if (dx < -3) out.l = true;
        return out;
      }
    }
    want = wrapDx(landX, p.x);
    if (want > 3) out.r = true;
    else if (want < -3) out.l = true;
    if (p.vy < 0 && Math.abs(want) < 10) out.d = true;
    return out;
  }

  if (threat && Math.abs(wrapDx(threat.x, p.x)) < 18) {
    dx = wrapDx(threat.x, p.x);
    if (dx > 2) out.r = true;
    else if (dx < -2) out.l = true;
    if (Math.abs(dx) < 15) out.jump = true;
    return out;
  }
  if (bird && Math.abs(wrapDx(bird.x, p.x)) < 18) {
    dx = wrapDx(bird.x, p.x);
    if (dx > 3) out.r = true;
    else if (dx < -3) out.l = true;
    out.jump = true;
    return out;
  }

  if (idle > 2.2) {
    out.jump = true;
    if (isSolid(cellOf(grid, wrapCol(col + 1), row))) out.r = true;
    else if (isSolid(cellOf(grid, wrapCol(col - 1), row))) out.l = true;
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
      if (isSolid(cellOf(grid, wrapCol(col + dir * 2), row))) {
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

  if (isIce(ceil)) {
    out.jump = true;
    return out;
  }
  if (ceil === EMPTY) {
    out.jump = true;
    return out;
  }
  if (isIce(cellOf(grid, wrapCol(col + 1), row + 1))) {
    out.r = true;
    out.jump = true;
  } else if (isIce(cellOf(grid, wrapCol(col - 1), row + 1))) {
    out.l = true;
    out.jump = true;
  } else {
    out.jump = true;
    out.r = true;
  }
  return out;
}

function playAutoClimb(kind, seconds, seed) {
  var m = makeMountain(kind, seed, 1);
  var grid = m.grid;
  var p = makePlayer();
  var cond = makeCondor();
  var keysL = { l: false, r: false, d: false };
  var jumpBuf = 0;
  var autoCol = -1;
  var autoLand = 1;
  var idle = 0;
  var lastRow = 0;
  var t = 0;
  var dt = STEP;
  var smashed = 0;
  var cracked = 0;
  var maxH = 0;
  var groundH = 0;
  var jumps = 0;
  var grabs = 0;
  var lastSafe = { x: p.x, y: p.y, row: 0 };
  var d, wish, spd, nx, stand, prevY, i, c0, r0, br, hb, near, cell, cx, cy;
  var list;

  function hitSim(cHit, rHit) {
    var tHit = cellOf(grid, cHit, rHit);
    cx = colX(cHit) + BW * 0.5;
    cy = rowStand(rHit) - BH * 0.45;
    if (tHit === ICE2) {
      setCell(grid, cHit, rHit, ICE);
      p.vy = -110;
      p.y = Math.min(p.y, cy - PH * 0.45);
      p.smashCd = SMASH_CD;
      p.struck = true;
      cracked++;
      return 'crack';
    }
    if (tHit === ICE) {
      setCell(grid, cHit, rHit, EMPTY);
      p.smashCd = SMASH_CD;
      p.struck = true;
      smashed++;
      return 'smash';
    }
    if (tHit === STONE) {
      p.vy = -80;
      p.y = Math.min(p.y, cy - PH * 0.4);
      p.smashCd = SMASH_CD;
      p.struck = true;
      return 'stone';
    }
    return '';
  }

  function doHammer() {
    var colH = colOfX(p.x);
    var rowH = rowOfY(p.y);
    if (p.struck) return;
    hb = hammerBox(p);
    list = [
      [colH, rowH + 1],
      [colH + p.face, rowH + 1],
      [colH, rowH + 2],
      [colH + p.face, rowH + 2]
    ];
    for (i = 0; i < list.length; i++) {
      c0 = wrapCol(list[i][0]);
      r0 = list[i][1];
      if (r0 < 0) continue;
      cell = cellOf(grid, c0, r0);
      if (cell === EMPTY) continue;
      br = brickRect(c0, r0);
      near = Math.abs(wrapDx(p.x, br.x + BW * 0.5)) < BW * 1.05;
      if (!near) continue;
      if (!overlap(hb.x, hb.y, hb.w, hb.h, br.x, br.y, br.w, br.h) &&
          Math.abs((p.y + PH) - br.y) > 16) continue;
      if (hitSim(c0, r0)) return;
    }
  }

  while (t < seconds) {
    t += dt;
    jumpBuf = Math.max(0, jumpBuf - dt);

    if (p.row !== lastRow) {
      if (p.row > lastRow) idle = 0;
      lastRow = p.row;
      autoCol = -1;
    } else idle += dt;

    d = autoDecide({
      grid: grid, player: p, enemies: [],
      condor: cond, veggies: [], kind: kind,
      stickyCol: autoCol, landDir: autoLand, idle: idle
    });
    autoCol = d.col;
    autoLand = d.landDir;
    keysL.l = d.l;
    keysL.r = d.r;
    keysL.d = d.d;
    if (d.jump) jumpBuf = BUFFER;

    if (p.inv > 0) p.inv -= dt;
    if (p.smashCd > 0) p.smashCd -= dt;
    if (p.coyote > 0) p.coyote -= dt;

    wish = (keysL.r ? 1 : 0) - (keysL.l ? 1 : 0);
    if (wish) p.face = wish;
    spd = p.grounded ? WALK : AIR;
    p.vx = lerp(p.vx, wish * spd, p.grounded ? 0.18 : 0.12);

    if (jumpBuf > 0 && (p.grounded || p.coyote > 0)) {
      p.vy = JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      jumpBuf = 0;
      p.struck = false;
      p.smashCd = 0;
      jumps++;
    }

    nx = wrapX(p.x + p.vx * dt);
    p.x = nx;

    if (p.grounded) {
      stand = standOnGrid(grid, p.x, p.y - 6, p.y + 8);
      if (!stand) {
        p.grounded = false;
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

      if (p.smashCd <= 0) doHammer();

      if (p.vy <= 0) {
        stand = standOnGrid(grid, p.x, p.y - 2, prevY + 4);
        if (stand && prevY >= stand.y - 1 && p.y <= stand.y + 3) {
          p.y = stand.y;
          p.vy = 0;
          p.grounded = true;
          p.row = stand.row;
          p.coyote = COYOTE;
          p.struck = false;
          lastSafe = { x: p.x, y: p.y, row: p.row };
        }
      }
    }

    if (cond.live) {
      cond.x += cond.vx * dt;
      if (cond.x > PAD + INNER - 30) { cond.x = PAD + INNER - 30; cond.vx = -Math.abs(cond.vx); cond.face = -1; }
      if (cond.x < PAD + 30) { cond.x = PAD + 30; cond.vx = Math.abs(cond.vx); cond.face = 1; }
      cond.y = rowStand(SUMMIT) + 34 + Math.sin(t * 1.7) * 7;
      if (Math.abs(wrapDx(p.x, cond.x)) < 16 && Math.abs((p.y + 12) - cond.y) < 16) {
        grabs++;
        break;
      }
    }

    if (rowOfY(p.y) > maxH) maxH = Math.max(0, rowOfY(p.y));
    if (p.grounded && p.row > groundH) groundH = p.row;

    if (p.y < -40) {
      p.x = lastSafe.x;
      p.y = lastSafe.y;
      p.row = lastSafe.row;
      p.grounded = true;
      p.vy = 0;
      p.vx = 0;
      p.struck = false;
    }
  }

  return {
    maxH: maxH, groundH: groundH, smashed: smashed, cracked: cracked,
    grabs: grabs, t: t, row: p.row, jumps: jumps, grounded: p.grounded
  };
}

function cellOf(grid, c, r) {
  if (r < 0 || r >= grid.length) return EMPTY;
  return grid[r][wrapCol(c)];
}
function setCell(grid, c, r, v) {
  if (r < 0 || r >= grid.length) return;
  grid[r][wrapCol(c)] = v;
}
function isSolid(t) {
  return t === ICE || t === ICE2 || t === STONE;
}
function isIce(t) {
  return t === ICE || t === ICE2;
}
function brickRect(c, r) {
  return { x: colX(c), y: rowStand(r) - BH, w: BW, h: BH };
}
function iceHpFor(kind) {
  return kind === 'thin' ? ICE : ICE2;
}

function countSolid(grid, r) {
  var c, n = 0;
  if (r < 0 || r >= grid.length) return 0;
  for (c = 0; c < COLS; c++) if (isSolid(grid[r][c])) n++;
  return n;
}

function genRow(r, rng, kind, mtn) {
  var cells = [];
  var c, g, i, nGaps, start, len, iceN, hp;
  hp = iceHpFor(kind);
  for (c = 0; c < COLS; c++) cells[c] = hp;

  if (r === 0 || r === 1) return cells;

  if (r === SUMMIT) {
    for (c = 0; c < COLS; c++) cells[c] = (c >= 4 && c <= 11) ? hp : EMPTY;
    cells[4] = STONE;
    cells[11] = STONE;
    return cells;
  }
  if (r > SUMMIT) {
    for (c = 0; c < COLS; c++) cells[c] = EMPTY;
    return cells;
  }
  if (r === SUMMIT - 1) {
    for (c = 0; c < COLS; c++) cells[c] = hp;
    cells[7] = EMPTY;
    cells[8] = EMPTY;
    cells[3] = STONE;
    cells[12] = STONE;
    return cells;
  }

  nGaps = 1 + (r % 3 === 0 ? 1 : 0) + (r > 6 ? 1 : 0) + (mtn > 2 && r % 2 === 0 ? 1 : 0);
  if (kind === 'thin') nGaps += 1;
  if (nGaps > 5) nGaps = 5;
  for (g = 0; g < nGaps; g++) {
    start = (Math.floor(rng() * (COLS - 2)) + r * 3 + g * 5 + mtn * 2) % COLS;
    len = 1 + (rng() > 0.42 ? 1 : 0);
    if (r > 7 && rng() > 0.65) len = 3;
    for (i = 0; i < len; i++) cells[wrapCol(start + i)] = EMPTY;
  }

  if (r > 2 && rng() < 0.34 + mtn * 0.06) {
    c = Math.floor(rng() * COLS);
    if (isIce(cells[c])) cells[c] = STONE;
    if (r > 6 && rng() < 0.4) {
      c = Math.floor(rng() * COLS);
      if (isIce(cells[c])) cells[c] = STONE;
    }
  }

  iceN = 0;
  for (c = 0; c < COLS; c++) if (isIce(cells[c])) iceN++;
  if (iceN < 6) {
    for (c = 0; c < COLS && iceN < 6; c++) {
      if (cells[c] === EMPTY) { cells[c] = hp; iceN++; }
    }
  }
  iceN = 0;
  for (c = 0; c < COLS; c++) if (isIce(cells[c]) || cells[c] === EMPTY) iceN++;
  if (iceN < 2) {
    cells[1] = hp;
    cells[8] = hp;
  }
  return cells;
}

function makeTopi(x, row, dir, thin) {
  return {
    kind: 'topi',
    x: x,
    y: rowStand(row),
    row: row,
    vx: dir * (thin ? 42 : 30),
    face: dir,
    job: 'walk',
    grabT: 0,
    grabC: -1,
    carry: false,
    haul: 0,
    dead: false,
    wob: Math.random() * TAU
  };
}

function makeBird(x, y, dir, thin, mtn) {
  var spd = (thin ? 58 : 44) + mtn * 4 + Math.random() * 16;
  return {
    kind: 'bird',
    x: x,
    y: y,
    homeY: y,
    vx: dir * spd,
    face: dir,
    phase: Math.random() * TAU,
    dead: false
  };
}

function makeCondor() {
  return {
    x: PAD + INNER * 0.5,
    y: rowStand(SUMMIT) + 34,
    vx: 52,
    face: 1,
    flap: 0,
    live: true
  };
}

function makePlayer() {
  return {
    x: PAD + BW * 4.5,
    y: rowStand(0),
    vx: 0,
    vy: 0,
    face: 1,
    grounded: true,
    row: 0,
    coyote: COYOTE,
    squash: 1,
    stretch: 1,
    smashCd: 0,
    struck: false,
    inv: 0,
    deadT: 0,
    walk: 0,
    state: 'walk',
    why: '',
    landVy: 0
  };
}

function makeMountain(kind, seed, mtn) {
  var rng = makeRng(seed);
  var rows = SUMMIT + 4;
  var grid = [];
  var enemies = [];
  var r, c, dir, i, step, thin;
  thin = kind === 'thin';
  for (r = 0; r < rows; r++) grid[r] = genRow(r, rng, kind, mtn);

  step = thin ? 1 : 2;
  for (r = 3; r < SUMMIT; r += step) {
    for (c = 0; c < COLS; c++) {
      if (isIce(grid[r][c])) {
        dir = rng() < 0.5 ? -1 : 1;
        enemies.push(makeTopi(colCenter(c), r, dir, thin));
        break;
      }
    }
  }
  if (thin) {
    for (r = 4; r < SUMMIT; r += 3) {
      for (c = COLS - 1; c >= 0; c--) {
        if (isIce(grid[r][c])) {
          enemies.push(makeTopi(colCenter(c), r, rng() < 0.5 ? -1 : 1, true));
          break;
        }
      }
    }
  }
  for (i = 0; i < (thin ? 4 : 3) + Math.min(3, mtn - 1); i++) {
    r = 4 + i * 2;
    if (r >= SUMMIT) break;
    enemies.push(makeBird(
      PAD + rng() * INNER,
      rowStand(r) + 18,
      rng() < 0.5 ? -1 : 1,
      thin,
      mtn
    ));
  }

  return { grid: grid, enemies: enemies, rows: rows, seed: seed };
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
      if (!isSolid(cellOf(grid, c, r))) continue;
      if (Math.abs(wrapDx(x, colCenter(c))) > BW * 0.52 + PW * 0.4) continue;
      if (!best || top > best.y) best = { y: top, row: r, c: wrapCol(c) };
    }
  }
  return best;
}

function hammerBox(p) {
  var hw = 17;
  var hh = 15;
  var hx = p.x + p.face * 9 - hw * 0.42;
  var hy = p.y + PH - 4;
  return { x: hx, y: hy, w: hw, h: hh };
}

function playerHurtBox(p) {
  return { x: p.x - PW * 0.42, y: p.y + 2, w: PW * 0.84, h: PH - 4 };
}

function bearMax(kind, mtn) {
  var t = kind === 'thin' ? 15 : 22;
  return Math.max(11, t - (mtn - 1) * 1.2);
}

/* ---- DOM ---- */
var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var stageEl = document.getElementById('stage');
var overlayEl = document.getElementById('overlay');
var panelEl = document.getElementById('panel');
var ovTitle = document.getElementById('ov-title');
var ovLead = document.getElementById('ov-lead');
var ovOps = document.getElementById('ov-ops');
var ovKicker = document.getElementById('ov-kicker');
var ovStart = document.getElementById('ov-start');
var ovEnd = document.getElementById('ov-end');
var ovRetry = document.getElementById('ov-retry');
var btnClimb = document.getElementById('btn-climb');
var btnThin = document.getElementById('btn-thin');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnAuto = document.getElementById('btn-auto');
var speedEl = document.getElementById('speed');
var speedLab = document.getElementById('speed-lab');
var btnLeft = document.getElementById('btn-left');
var btnRight = document.getElementById('btn-right');
var btnJump = document.getElementById('btn-jump');
var scoreEl = document.getElementById('score');
var mtnEl = document.getElementById('mtn');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var bearBar = document.getElementById('bear-bar');
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

var keys = { l: false, r: false, u: false, d: false };
var autoOn = false;
var autoSpeed = loadAutoSpeed();
var autoCol = -1;
var autoLandDir = 1;
var autoIdle = 0;
var autoLastRow = 0;
var autoOvWait = 0;

var G = {
  mode: 'title',
  kind: 'climb',
  clock: 0,
  lives: LIVES,
  score: 0,
  bestM: 0,
  bestT: 0,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  player: makePlayer(),
  grid: [],
  enemies: [],
  veggies: [],
  condor: makeCondor(),
  broken: [],
  vegged: [],
  rows: 0,
  camY: 0,
  maxH: 0,
  mtn: 1,
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flash: 0,
  flashRgb: [30, 200, 255],
  jumpBuf: 0,
  lock: 0,
  why: '',
  lastSafe: { x: PAD + BW * 4.5, y: rowStand(0), row: 0 },
  seed: 196,
  taught: false,
  bearT: 0,
  bearMax: 22,
  bear: { phase: 'idle', y: 0, t: 0 },
  spawnT: 0
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
      this.master.gain.value = this.muted ? 0 : 0.38;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  setMuted: function (m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.38;
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
    this.beep(310, 0.06, 'square', 0.052, 560);
    this.noise(0.04, 0.032, 1800, 'highpass');
  },
  land: function () {
    this.ensure();
    this.noise(0.055, 0.07, 380, 'bandpass');
    this.beep(150, 0.045, 'sine', 0.034, 70);
  },
  crack: function () {
    this.ensure();
    this.noise(0.06, 0.08, 1600, 'highpass');
    this.beep(420, 0.05, 'triangle', 0.045, 220);
  },
  smash: function (combo) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.07;
    this.noise(0.12, 0.14, 2300, 'highpass');
    this.noise(0.08, 0.08, 340, 'lowpass');
    this.beep(540 * p, 0.07, 'triangle', 0.065, 1020 * p);
    this.beep(190 * p, 0.09, 'square', 0.042, 70);
  },
  stone: function () {
    this.ensure();
    this.beep(130, 0.06, 'square', 0.05, 65);
    this.noise(0.05, 0.055, 680, 'bandpass');
  },
  steal: function () {
    this.ensure();
    this.beep(210, 0.07, 'sine', 0.03, 360);
    this.noise(0.05, 0.035, 900, 'bandpass');
  },
  hitEnemy: function (combo) {
    this.ensure();
    var p = 1 + Math.min(6, combo) * 0.05;
    this.noise(0.1, 0.11, 260, 'lowpass');
    this.beep(250 * p, 0.1, 'sawtooth', 0.06, 80);
    this.beep(680 * p, 0.08, 'square', 0.04, 220);
  },
  veggie: function (n) {
    this.ensure();
    var p = 1 + n * 0.08;
    this.beep(520 * p, 0.08, 'triangle', 0.06, 780 * p);
    this.beep(780 * p, 0.12, 'square', 0.04, 1180 * p);
  },
  die: function () {
    this.ensure();
    this.noise(0.16, 0.12, 260, 'lowpass');
    this.beep(300, 0.22, 'sawtooth', 0.06, 70);
    this.beep(170, 0.18, 'square', 0.04, 48);
  },
  bear: function () {
    this.ensure();
    this.noise(0.18, 0.14, 140, 'lowpass');
    this.beep(90, 0.16, 'sine', 0.07, 50);
    this.beep(140, 0.1, 'square', 0.04, 60);
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
    this.beep(440 + n * 42, 0.08, 'square', 0.05, 900 + n * 48);
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
      G.bestM = (o.m | 0) || (o.c | 0);
      G.bestT = o.t | 0;
      return;
    }
    if (typeof o === 'number') {
      G.bestM = o | 0;
      G.bestT = o | 0;
    }
  } catch (e) { /* ignore */ }
}

function persistBest() {
  var cur = G.kind === 'thin' ? G.bestT : G.bestM;
  if (G.score > cur) {
    if (G.kind === 'thin') G.bestT = G.score;
    else G.bestM = G.score;
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ m: G.bestM, t: G.bestT }));
  } catch (e) { /* ignore */ }
}

function currentBest() {
  return G.kind === 'thin' ? G.bestT : G.bestM;
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
      vx: rand(-spd, spd),
      vy: rand(spd * 0.2, spd),
      r: rand(1.1, 2.6),
      t: life * rand(0.6, 1),
      max: life,
      rgb: rgb,
      g: grav
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
      t: rand(0.08, 0.2),
      rgb: rgb
    });
  }
}

function shardBurst(x, y, rgb) {
  var i, a;
  for (i = 0; i < 9; i++) {
    a = rand(0, TAU);
    shards.push({
      x: x, y: y,
      vx: Math.cos(a) * rand(30, 140),
      vy: Math.sin(a) * rand(40, 180) + 40,
      w: rand(3, 7),
      h: rand(2, 5),
      rot: rand(0, TAU),
      vr: rand(-10, 10),
      t: rand(0.28, 0.55),
      rgb: rgb
    });
  }
}

function ringAt(x, y, rgb) {
  rings.push({ x: x, y: y, r: 6, t: 0, rgb: rgb });
}

function floatText(x, y, text, rgb) {
  floats.push({ x: x, y: y, text: text, t: 0, rgb: rgb || [255, 227, 107] });
}

function dust(x, y) {
  burst(x, y, 7, [180, 220, 255], 36, 0.28, 80);
}

function toast(msg, warn, gold) {
  toastEl.textContent = msg;
  toastEl.classList.toggle('warn', !!warn);
  toastEl.classList.toggle('gold', !!gold);
  toastEl.classList.remove('hidden');
  clearTimeout(toastTok);
  toastTok = setTimeout(function () { toastEl.classList.add('hidden'); }, 980);
}

function addScore(n, x, y, label) {
  if (n <= 0) return;
  G.score += n;
  scoreEl.textContent = String(G.score);
  scoreBox.classList.remove('flash');
  void scoreBox.offsetWidth;
  scoreBox.classList.add('flash');
  scoreAdd.hidden = false;
  scoreAdd.textContent = '+' + n;
  clearTimeout(addTok);
  addTok = setTimeout(function () { scoreAdd.hidden = true; }, 700);
  if (x != null) floatText(x, y + 16, label ? label : '+' + n, [255, 227, 107]);
  if (G.score > currentBest()) {
    if (G.kind === 'thin') G.bestT = G.score;
    else G.bestM = G.score;
    bestEl.textContent = String(currentBest());
    persistBest();
  }
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

function syncBear() {
  var t = G.bearMax <= 0.01 ? 0 : clamp(G.bearT / G.bearMax, 0, 1);
  bearBar.style.transform = 'scaleX(' + t + ')';
  bearBar.classList.toggle('hot', t > 0.62);
}

function hudPlay() {
  scoreEl.textContent = String(G.score);
  bestEl.textContent = String(currentBest());
  mtnEl.textContent = String(G.mtn);
  comboEl.textContent = '×' + Math.max(1, G.combo);
  renderPips();
  modeLabel.textContent = G.kind === 'thin' ? '薄冰' : '登山';
  modeLabel.classList.toggle('thin', G.kind === 'thin');
  if (G.mode === 'play') {
    if (autoOn) {
      hintEl.textContent = G.kind === 'thin'
        ? '自动 · 薄冰 · 跳锤开路 · 躲开托皮 · A 停下'
        : '自动托管 · 跳进冰里砸开 · 躲开托皮神鹰 · A 停下';
    } else {
      hintEl.textContent = G.kind === 'thin'
        ? '薄冰一锤即碎 · 托皮更勤 · 跳上神鹰拿奖励'
        : '跳进冰里砸开 · 从碎洞往上爬 · 顶上神鹰';
    }
  }
}

function resetFx() {
  particles.length = 0;
  sparks.length = 0;
  floats.length = 0;
  rings.length = 0;
  shards.length = 0;
  G.stop = 0;
  G.shake = 0;
  G.kickX = 0;
  G.kickY = 0;
  G.flash = 0;
}

function seedSnow() {
  var i;
  snow.length = 0;
  for (i = 0; i < 52; i++) {
    snow.push({
      x: rand(0, WORLD_W),
      y: rand(0, VIEW_H),
      s: rand(0.6, 1.8),
      v: rand(18, 46),
      p: rand(0, TAU)
    });
  }
}

function resetWorld(kind, mtn, attract) {
  var seed = kind === 'climb'
    ? (196 + (mtn - 1) * 97)
    : (0xC0FFEE ^ ((mtn * 131 + (Date.now() & 0xff)) & 0xffff));
  var m = makeMountain(kind, seed, mtn);
  var r;
  G.kind = kind;
  G.seed = seed;
  G.mtn = mtn;
  G.grid = m.grid;
  G.enemies = m.enemies;
  G.rows = m.rows;
  G.veggies = [];
  G.broken = [];
  G.vegged = [];
  G.condor = makeCondor();
  G.player = makePlayer();
  G.camY = 0;
  G.maxH = 0;
  G.combo = 0;
  G.comboAge = 0;
  G.jumpBuf = 0;
  G.lastSafe = { x: G.player.x, y: G.player.y, row: 0 };
  G.bearT = 0;
  G.bearMax = bearMax(kind, mtn);
  G.bear = { phase: 'idle', y: 0, t: 0 };
  G.spawnT = 0;
  autoCol = -1;
  autoLandDir = 1;
  autoIdle = 0;
  autoLastRow = 0;
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
  ovKicker.textContent = 'ICE';
  ovTitle.textContent = '冰锤';
  ovLead.textContent = '跳起来用锤砸头顶的冰，开路往上爬。托皮会偷砖，顶上神鹰带奖励。掉下去或没命就结束。';
  ovOps.textContent = '方向键或 D 走 · 空格 / 上 / W 跳进冰里砸 · A 自动 · 触屏左跳右 · R 重开 · M 静音';
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
  hintEl.textContent = '跳进头顶的冰砖把它砸开 · 从洞钻上去 · 别让托皮把脚底下的砖偷走 · A 自动';
  resetWorld('climb', 1, true);
  G.kind = 'climb';
  hudPlay();
}

function showOver(win) {
  G.mode = 'over';
  persistBest();
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel ' + (win ? 'win' : 'lose');
  ovKicker.textContent = win ? 'ICE' : 'ICE';
  ovTitle.textContent = win ? '神鹰' : '命尽';
  ovLead.textContent = (G.kind === 'thin' ? '薄冰 ' : '登山 ') +
    G.score + ' 分 · 第 ' + G.mtn + ' 座 · 连锤最高 ×' + G.maxCombo +
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
  autoOvWait = 0;
  resetWorld(kind, 1, false);
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  panelEl.className = 'panel';
  audio.start();
  hudPlay();
  toast(kind === 'thin' ? '薄冰 · 一锤即碎' : '登山 · 两锤开路', false, kind !== 'thin');
  canvas.focus({ preventScroll: true });
}

function retry() {
  audio.ui();
  if (G.mode === 'title') startRun('climb');
  else startRun(G.kind);
}

function maybeVeggie(r, x, y) {
  var v;
  if (G.vegged[r] || G.broken[r] < 3) return;
  G.vegged[r] = true;
  v = VEG[Math.min(VEG.length - 1, (r / 3) | 0)];
  G.veggies.push({
    x: x, y: y + 10, r: r, t: 0,
    name: v.name, pts: v.pts, rgb: v.rgb, dead: false
  });
  toast(v.name, false, true);
}

function spawnSummitVeggies() {
  var i, v, c;
  if (G.vegged[SUMMIT]) return;
  G.vegged[SUMMIT] = true;
  for (i = 0; i < 4; i++) {
    v = VEG[Math.min(VEG.length - 1, 1 + i)];
    c = 5 + i;
    G.veggies.push({
      x: colCenter(c),
      y: rowStand(SUMMIT) + 12,
      r: SUMMIT,
      t: i * 0.08,
      name: v.name,
      pts: v.pts,
      rgb: v.rgb,
      dead: false
    });
  }
  toast('山顶奖励', false, true);
}

function hitIce(c, r) {
  var t = cellOf(G.grid, c, r);
  var cx = colX(c) + BW * 0.5;
  var cy = rowStand(r) - BH * 0.45;
  var p = G.player;
  if (t === ICE2) {
    setCell(G.grid, c, r, ICE);
    spark(cx, cy, 7, [122, 246, 255]);
    burst(cx, cy, 6, [140, 230, 255], 50, 0.28, 120);
    ringAt(cx, cy, [30, 200, 255]);
    hitStop(0.04);
    shake(3);
    kick('hop');
    flash([30, 200, 255], 0.08);
    bumpCombo();
    addScore(Math.floor(10 * G.combo * comboMul(G.combo)), cx, cy, null);
    audio.crack();
    p.vy = -110;
    p.y = Math.min(p.y, cy - PH * 0.45);
    p.smashCd = SMASH_CD;
    p.struck = true;
    p.squash = 0.78;
    p.stretch = 1.22;
    return 'crack';
  }
  if (t === ICE) {
    setCell(G.grid, c, r, EMPTY);
    if (!G.broken[r]) G.broken[r] = 0;
    G.broken[r]++;
    shardBurst(cx, cy, [140, 230, 255]);
    burst(cx, cy, 11 + Math.min(8, G.combo), [140, 230, 255], 78 + G.combo * 6, 0.46, 260);
    burst(cx, cy, 6, [255, 255, 255], 52, 0.28, 80);
    spark(cx, cy, 9, [0, 240, 255]);
    ringAt(cx, cy, [30, 200, 255]);
    hitStop(0.052 + Math.min(0.028, G.combo * 0.004));
    shake(5 + Math.min(4, G.combo));
    kick('smash');
    flash([30, 200, 255], 0.13);
    bumpCombo();
    addScore(Math.floor(20 * G.combo * comboMul(G.combo)), cx, cy, null);
    audio.smash(G.combo);
    maybeVeggie(r, cx, cy);
    p.smashCd = SMASH_CD;
    p.struck = true;
    p.squash = 1.18;
    p.stretch = 0.82;
    if (!G.taught && G.mode === 'play') {
      G.taught = true;
      toast('碎冰', false, false);
    }
    return 'smash';
  }
  return '';
}

function clinkStone(c, r) {
  var cx = colX(c) + BW * 0.5;
  var cy = rowStand(r) - BH * 0.4;
  var p = G.player;
  spark(cx, cy, 5, [255, 61, 184]);
  burst(cx, cy, 4, [255, 150, 220], 30, 0.18, 40);
  hitStop(0.03);
  shake(2);
  audio.stone();
  p.vy = -80;
  p.y = Math.min(p.y, cy - PH * 0.4);
  p.smashCd = SMASH_CD;
  p.struck = true;
}

function hammerCells(p) {
  var col = colOfX(p.x);
  var row = rowOfY(p.y);
  var list, i, c, r, br, hb, near, t;
  if (p.struck) return;
  hb = hammerBox(p);
  list = [
    [col, row + 1],
    [col + p.face, row + 1],
    [col, row + 2],
    [col + p.face, row + 2]
  ];
  for (i = 0; i < list.length; i++) {
    c = wrapCol(list[i][0]);
    r = list[i][1];
    if (r < 0) continue;
    t = cellOf(G.grid, c, r);
    if (t === EMPTY) continue;
    br = brickRect(c, r);
    near = Math.abs(wrapDx(p.x, br.x + BW * 0.5)) < BW * 1.05;
    if (!near) continue;
    if (!overlap(hb.x, hb.y, hb.w, hb.h, br.x, br.y, br.w, br.h) &&
        Math.abs((p.y + PH) - br.y) > 16) continue;
    if (t === STONE) {
      clinkStone(c, r);
      return;
    }
    if (hitIce(c, r)) return;
  }
}

function hammerEnemies(p) {
  var hb = hammerBox(p);
  var i, e, hit;
  for (i = 0; i < G.enemies.length; i++) {
    e = G.enemies[i];
    if (e.dead) continue;
    if (e.kind === 'topi') hit = overlap(hb.x, hb.y, hb.w, hb.h, e.x - 8, e.y, 16, 14);
    else hit = overlap(hb.x, hb.y, hb.w, hb.h, e.x - 9, e.y - 6, 18, 14);
    if (!hit) continue;
    e.dead = true;
    bumpCombo();
    burst(e.x, e.y + 8, 12, e.kind === 'bird' ? [255, 61, 184] : [220, 240, 255], 80, 0.4, 200);
    shardBurst(e.x, e.y + 6, e.kind === 'bird' ? [255, 120, 190] : [180, 220, 255]);
    ringAt(e.x, e.y + 8, [255, 227, 107]);
    hitStop(0.065);
    shake(6);
    kick('smash');
    flash(e.kind === 'bird' ? [255, 61, 184] : [30, 200, 255], 0.14);
    addScore(Math.floor(120 * G.combo), e.x, e.y, e.kind === 'bird' ? '鸟' : '托皮');
    audio.hitEnemy(G.combo);
    p.smashCd = SMASH_CD * 0.6;
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
      if (isSolid(t)) {
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
  found = findSafe(s.x, s.row);
  p.x = found.x;
  p.y = found.y;
  p.row = found.row;
  p.inv = INVULN;
  p.grounded = true;
  G.player = p;
  G.lastSafe = { x: p.x, y: p.y, row: p.row };
  G.bearT = Math.min(G.bearT, G.bearMax * 0.45);
  G.bear.phase = 'idle';
  burst(p.x, p.y + 8, 10, [0, 240, 255], 40, 0.3, 60);
}

function grabCondor() {
  var p = G.player;
  var bonus;
  if (p.state === 'win' || p.state === 'dead') return;
  p.state = 'win';
  p.deadT = 1.15;
  G.condor.live = false;
  bonus = 2000 + 200 * G.lives + 150 * G.mtn;
  bumpCombo();
  addScore(bonus, G.condor.x, G.condor.y, '神鹰');
  burst(G.condor.x, G.condor.y, 22, [255, 227, 107], 110, 0.6, 80);
  burst(G.condor.x, G.condor.y, 12, [255, 61, 184], 80, 0.45, 40);
  ringAt(G.condor.x, G.condor.y, [255, 227, 107]);
  hitStop(0.08);
  shake(7);
  kick('clear');
  flash([255, 227, 107], 0.22);
  audio.condor();
  toast('第 ' + G.mtn + ' 座 · 神鹰', false, true);
}

function nextMountain() {
  var kind = G.kind;
  var mtn = G.mtn + 1;
  var score = G.score;
  var lives = G.lives;
  var maxC = G.maxCombo;
  resetWorld(kind, mtn, false);
  G.score = score;
  G.lives = lives;
  G.maxCombo = maxC;
  G.mode = 'play';
  hudPlay();
  toast('第 ' + mtn + ' 座山', false, true);
  audio.start();
}

function stealBrick(e) {
  var c = e.grabC;
  var r = e.row;
  var t, cx, cy;
  if (c < 0) return;
  t = cellOf(G.grid, c, r);
  if (!isIce(t)) return;
  if (countSolid(G.grid, r) <= 3) return;
  setCell(G.grid, c, r, EMPTY);
  e.carry = true;
  e.job = 'carry';
  e.haul = 0;
  cx = colCenter(c);
  cy = rowStand(r) - BH * 0.4;
  burst(cx, cy, 6, [180, 230, 255], 40, 0.25, 80);
  spark(cx, cy, 4, [122, 246, 255]);
  audio.steal();
}

function pickStealCol(e) {
  var dir = e.face >= 0 ? 1 : -1;
  var i, c, t;
  for (i = 0; i <= 2; i++) {
    c = wrapCol(colOfX(e.x) + dir * i);
    t = cellOf(G.grid, c, e.row);
    if (isIce(t) && countSolid(G.grid, e.row) > 3) return c;
  }
  c = colOfX(e.x);
  t = cellOf(G.grid, c, e.row);
  if (isIce(t) && countSolid(G.grid, e.row) > 3) return c;
  return -1;
}

function tickTopi(e, dt) {
  var thin = G.kind === 'thin';
  var stand, ahead, spd;
  if (e.dead) return;
  e.wob += dt * 8;
  e.y = rowStand(e.row);

  if (e.job === 'grab') {
    e.grabT -= dt;
    if (e.grabT <= 0) stealBrick(e);
    return;
  }

  spd = (e.carry ? (thin ? 70 : 52) : Math.abs(e.vx)) * (e.face >= 0 ? 1 : -1);
  e.x = wrapX(e.x + spd * dt);
  if (e.carry) {
    e.haul += Math.abs(spd) * dt;
    if (e.haul > INNER * 0.72) {
      e.dead = true;
      e.carry = false;
    }
    return;
  }

  ahead = cellOf(G.grid, colOfX(e.x) + (e.face >= 0 ? 1 : -1), e.row);
  if (!isSolid(ahead)) {
    e.face *= -1;
    e.vx = Math.abs(e.vx) * e.face;
  }
  stand = isSolid(cellOf(G.grid, colOfX(e.x), e.row));
  if (!stand) {
    e.face *= -1;
    e.vx = Math.abs(e.vx) * e.face;
  }

  if (Math.random() < dt * (thin ? 0.38 : 0.16)) {
    e.grabC = pickStealCol(e);
    if (e.grabC >= 0) {
      e.job = 'grab';
      e.grabT = thin ? 0.22 : 0.4;
    }
  }
}

function tickBird(e, dt) {
  if (e.dead) return;
  e.phase += dt * 3.2;
  e.x = wrapX(e.x + e.vx * dt);
  e.y = e.homeY + Math.sin(e.phase) * 14;
  e.face = e.vx >= 0 ? 1 : -1;
}

function tickEnemies(dt) {
  var i, e, liveTopi, r, c, dir, thin;
  liveTopi = 0;
  for (i = 0; i < G.enemies.length; i++) {
    e = G.enemies[i];
    if (e.dead) continue;
    if (e.kind === 'topi') {
      liveTopi++;
      tickTopi(e, dt);
    } else tickBird(e, dt);
  }
  if (G.mode !== 'play') return;
  G.spawnT += dt;
  thin = G.kind === 'thin';
  if (G.spawnT > (thin ? 2.2 : 3.6) && liveTopi < (thin ? 6 : 4)) {
    G.spawnT = 0;
    r = clamp(G.player.row + (Math.random() < 0.5 ? 0 : 1), 2, SUMMIT - 1);
    dir = Math.random() < 0.5 ? -1 : 1;
    c = dir > 0 ? 0 : COLS - 1;
    if (isSolid(cellOf(G.grid, c, r)) || countSolid(G.grid, r) > 4) {
      G.enemies.push(makeTopi(colCenter(c), r, dir, thin));
    }
  }
}

function tickCondor(dt) {
  var c = G.condor;
  if (!c.live) return;
  c.flap += dt * 10;
  c.x += c.vx * dt;
  if (c.x > PAD + INNER - 30) { c.x = PAD + INNER - 30; c.vx = -Math.abs(c.vx); c.face = -1; }
  if (c.x < PAD + 30) { c.x = PAD + 30; c.vx = Math.abs(c.vx); c.face = 1; }
  c.y = rowStand(SUMMIT) + 34 + Math.sin(G.clock * 1.7) * 7;
}

function tickVeggies(dt) {
  var i, v, p, dx;
  p = G.player;
  for (i = 0; i < G.veggies.length; i++) {
    v = G.veggies[i];
    if (v.dead) continue;
    v.t += dt;
    if (p.state === 'dead' || p.state === 'win') continue;
    dx = wrapDx(p.x, v.x);
    if (Math.abs(dx) < 12 && Math.abs((p.y + 10) - v.y) < 16) {
      v.dead = true;
      bumpCombo();
      addScore(v.pts, v.x, v.y, v.name);
      burst(v.x, v.y, 10, v.rgb, 70, 0.4, 60);
      ringAt(v.x, v.y, v.rgb);
      audio.veggie(G.combo);
      hitStop(0.035);
    }
  }
}

function stompBear() {
  var p = G.player;
  var r = Math.max(0, p.row);
  var c, t, n;
  n = 0;
  for (c = 0; c < COLS; c++) {
    t = cellOf(G.grid, c, r);
    if (t === ICE2) {
      setCell(G.grid, c, r, ICE);
      n++;
    } else if (t === ICE && G.kind === 'thin' && n < 3 && countSolid(G.grid, r) > 4) {
      setCell(G.grid, c, r, EMPTY);
      shardBurst(colCenter(c), rowStand(r) - 6, [140, 230, 255]);
      n++;
    }
  }
  if (p.grounded) {
    p.vy = 150;
    p.grounded = false;
    p.coyote = 0;
  }
  shake(10);
  hitStop(0.08);
  kick('die');
  flash([255, 227, 107], 0.16);
  audio.bear();
  toast('北极熊', true, false);
  burst(p.x, p.y + 8, 14, [255, 240, 220], 70, 0.4, 80);
}

function tickBear(dt) {
  var b = G.bear;
  var p = G.player;
  if (G.mode !== 'play' || p.state !== 'walk') {
    if (b.phase === 'idle') syncBear();
    return;
  }
  if (b.phase === 'idle') {
    if (p.row >= 1) G.bearT += dt;
    if (p.row > G.maxH) G.bearT = Math.max(0, G.bearT - dt * 2);
    if (G.bearT >= G.bearMax) {
      b.phase = 'drop';
      b.t = 0;
      b.y = G.camY + VIEW_H + 40;
    }
  } else if (b.phase === 'drop') {
    b.t += dt;
    b.y = lerp(G.camY + VIEW_H + 40, G.camY + VIEW_H - 70, clamp(b.t / 0.35, 0, 1));
    if (b.t > 0.35) {
      b.phase = 'stomp';
      b.t = 0;
      stompBear();
    }
  } else if (b.phase === 'stomp') {
    b.t += dt;
    if (b.t > 0.55) {
      b.phase = 'leave';
      b.t = 0;
    }
  } else if (b.phase === 'leave') {
    b.t += dt;
    b.y = lerp(G.camY + VIEW_H - 70, G.camY + VIEW_H + 50, clamp(b.t / 0.4, 0, 1));
    if (b.t > 0.4) {
      b.phase = 'idle';
      G.bearT = 0;
    }
  }
  syncBear();
}

function tickPlayer(dt) {
  var p = G.player;
  var wish, spd, nx, stand, prevY, pb, i, e, hit;
  if (p.state === 'dead') {
    p.deadT -= dt;
    p.vy -= GRAV * dt * 0.4;
    p.y += p.vy * dt * 0.2;
    if (p.deadT <= 0) respawn();
    return;
  }
  if (p.state === 'win') {
    p.deadT -= dt;
    p.x = lerp(p.x, G.condor.x, 0.12);
    p.y = lerp(p.y, G.condor.y - 8, 0.12);
    if (p.deadT <= 0) nextMountain();
    return;
  }

  if (p.inv > 0) p.inv -= dt;
  if (p.smashCd > 0) p.smashCd -= dt;
  if (p.coyote > 0) p.coyote -= dt;
  p.squash = lerp(p.squash, 1, 0.18);
  p.stretch = lerp(p.stretch, 1, 0.18);
  p.walk += Math.abs(p.vx) * dt * 0.08;

  wish = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
  if (wish) p.face = wish;
  spd = p.grounded ? WALK : AIR;
  p.vx = lerp(p.vx, wish * spd, p.grounded ? 0.18 : 0.12);

  if (G.jumpBuf > 0 && (p.grounded || p.coyote > 0)) {
    p.vy = JUMP_V;
    p.grounded = false;
    p.coyote = 0;
    G.jumpBuf = 0;
    p.struck = false;
    p.smashCd = 0;
    p.squash = 0.72;
    p.stretch = 1.28;
    dust(p.x, p.y);
    audio.hop();
    if (!reduceMotion()) hitStop(0.028);
    kick('hop');
  }

  nx = wrapX(p.x + p.vx * dt);
  p.x = nx;

  if (p.grounded) {
    stand = standOnGrid(G.grid, p.x, p.y - 6, p.y + 8);
    if (!stand) {
      p.grounded = false;
      p.coyote = COYOTE;
    } else {
      p.y = stand.y;
      p.row = stand.row;
      G.lastSafe = { x: p.x, y: p.y, row: p.row };
    }
  }

  if (!p.grounded) {
    p.vy -= GRAV * dt;
    if (keys.d && p.vy < 0) p.vy -= FAST_FALL * dt;
    if (p.vy < -MAX_FALL) p.vy = -MAX_FALL;
    prevY = p.y;
    p.y += p.vy * dt;
    p.landVy = p.vy;

    if (p.smashCd <= 0) {
      hammerCells(p);
      hammerEnemies(p);
    }

    if (p.vy <= 0) {
      stand = standOnGrid(G.grid, p.x, p.y - 2, prevY + 4);
      if (stand && prevY >= stand.y - 1 && p.y <= stand.y + 3) {
        p.y = stand.y;
        p.vy = 0;
        p.grounded = true;
        p.row = stand.row;
        p.coyote = COYOTE;
        p.struck = false;
        G.lastSafe = { x: p.x, y: p.y, row: p.row };
        p.squash = 1.32;
        p.stretch = 0.7;
        dust(p.x, p.y);
        if (p.landVy < -90) {
          audio.land();
          if (!reduceMotion()) hitStop(0.03);
          shake(2);
        }
      }
    }
  }

  if (G.condor.live && p.row >= SUMMIT - 1) spawnSummitVeggies();
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
    G.maxH = Math.max(0, rowOfY(p.y));
    G.bearT = Math.max(0, G.bearT - 2.4);
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
    o.x = wrapX(o.x + Math.sin(o.p) * 10 * dt);
    o.y -= o.v * dt;
    if (o.y < G.camY - 20) o.y = G.camY + VIEW_H + rand(0, 40);
    if (o.y > G.camY + VIEW_H + 40) o.y = G.camY - 10;
  }
}

function tick(dt) {
  G.clock += dt;
  G.jumpBuf = Math.max(0, G.jumpBuf - dt);
  if (autoOn) tickAutoFlow(dt);
  tickCondor(dt);
  if (G.mode === 'play') {
    if (autoOn) tickAuto();
    tickPlayer(dt);
    tickEnemies(dt);
    tickVeggies(dt);
    tickBear(dt);
  } else {
    tickEnemies(dt);
  }
  tickCam(dt);
  tickFx(dt);
}

/* ---- draw ---- */
function resize() {
  var rect = stageEl.getBoundingClientRect();
  var padB, avW, avH, s;
  cssW = rect.width;
  cssH = rect.height;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, (cssW * dpr) | 0);
  canvas.height = Math.max(1, (cssH * dpr) | 0);
  padB = coarseQ.matches ? 62 : 10;
  avW = cssW;
  avH = Math.max(40, cssH - padB);
  s = Math.min(avW / WORLD_W, avH / VIEW_H);
  L.s = s;
  L.x = (avW - WORLD_W * s) / 2;
  L.y = Math.max(4, (avH - VIEW_H * s) / 2);
}

function sx(x) { return L.x + x * L.s; }
function sy(y) { return L.y + (VIEW_H - (y - G.camY)) * L.s; }

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

function drawBg() {
  var g, i, y, a;
  ctx.fillStyle = '#070314';
  ctx.fillRect(0, 0, cssW, cssH);

  g = ctx.createRadialGradient(sx(90), sy(G.camY + VIEW_H * 0.86), 8, sx(90), sy(G.camY + VIEW_H * 0.86), 230 * L.s);
  g.addColorStop(0, 'rgba(30,200,255,0.16)');
  g.addColorStop(1, 'rgba(30,200,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  g = ctx.createRadialGradient(sx(300), sy(G.camY + VIEW_H * 0.9), 8, sx(300), sy(G.camY + VIEW_H * 0.9), 180 * L.s);
  g.addColorStop(0, 'rgba(255,61,184,0.1)');
  g.addColorStop(1, 'rgba(255,61,184,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

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

  ctx.fillStyle = 'rgba(12, 28, 48, 0.85)';
  ctx.beginPath();
  ctx.moveTo(sx(-10), sy(G.camY));
  ctx.lineTo(sx(50), sy(G.camY + 100));
  ctx.lineTo(sx(100), sy(G.camY + 36));
  ctx.lineTo(sx(170), sy(G.camY + 150));
  ctx.lineTo(sx(230), sy(G.camY + 48));
  ctx.lineTo(sx(300), sy(G.camY + 170));
  ctx.lineTo(sx(360), sy(G.camY + 40));
  ctx.lineTo(sx(400), sy(G.camY + 120));
  ctx.lineTo(sx(400), sy(G.camY));
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (i = 0; i < 20; i++) {
    y = ((i * 97 + 40) % (VIEW_H + 80));
    ctx.globalAlpha = 0.25 + (i % 5) * 0.1;
    ctx.fillRect(sx((i * 53 + 12) % WORLD_W), sy(G.camY + y), 1.4 * L.s, 1.4 * L.s);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = 'rgba(8, 18, 32, 0.55)';
  ctx.fillRect(sx(0), sy(G.camY + VIEW_H), PAD * L.s, VIEW_H * L.s);
  ctx.fillRect(sx(PAD + INNER), sy(G.camY + VIEW_H), PAD * L.s, VIEW_H * L.s);
}

function drawBrick(c, r) {
  var t = cellOf(G.grid, c, r);
  var x, y, w, h, g;
  if (t === EMPTY) return;
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
  ctx.fillStyle = t === ICE2 ? '#0b4c72' : '#083a58';
  roundRect(x + 1, y, w - 2, h - 1, 2.4 * L.s);
  ctx.fill();
  g = ctx.createLinearGradient(x, y, x, y + h);
  if (t === ICE2) {
    g.addColorStop(0, 'rgba(180, 245, 255, 0.62)');
    g.addColorStop(0.35, 'rgba(30, 200, 255, 0.58)');
    g.addColorStop(1, 'rgba(10, 90, 140, 0.22)');
  } else {
    g.addColorStop(0, 'rgba(160, 220, 255, 0.38)');
    g.addColorStop(0.4, 'rgba(30, 170, 220, 0.4)');
    g.addColorStop(1, 'rgba(10, 70, 110, 0.18)');
  }
  ctx.fillStyle = g;
  roundRect(x + 1.5, y + 0.5, w - 3, h - 2, 2 * L.s);
  ctx.fill();
  ctx.strokeStyle = t === ICE2 ? 'rgba(122, 246, 255, 0.78)' : 'rgba(122, 246, 255, 0.45)';
  ctx.lineWidth = 1.15 * L.s;
  roundRect(x + 1, y, w - 2, h - 1, 2.4 * L.s);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(x + 4 * L.s, y + 3 * L.s, w * 0.34, 1.6 * L.s);
  if (t === ICE) {
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.7)';
    ctx.lineWidth = 1.05 * L.s;
    ctx.beginPath();
    ctx.moveTo(x + 4 * L.s, y + 3 * L.s);
    ctx.lineTo(x + w * 0.45, y + h * 0.55);
    ctx.lineTo(x + w - 4 * L.s, y + h - 3 * L.s);
    ctx.stroke();
  }
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

function drawHammer(p, px, py, s) {
  var ang, hx, hy, air;
  air = !p.grounded;
  if (air) ang = -1.25 + Math.sin(G.clock * 18) * 0.08;
  else ang = -0.55 + Math.sin(p.walk) * 0.12;
  hx = 0;
  hy = -PH * s + 2 * s;
  ctx.save();
  ctx.translate(px, py + hy);
  ctx.rotate(ang);
  ctx.strokeStyle = '#6a3a18';
  ctx.lineWidth = 2.2 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -12 * s);
  ctx.stroke();
  ctx.fillStyle = '#ffe36b';
  roundRect(-7 * s, -17.5 * s, 14 * s, 7 * s, 1.8 * s);
  ctx.fill();
  ctx.strokeStyle = 'rgba(30,200,255,0.85)';
  ctx.lineWidth = 1.15 * s;
  roundRect(-7 * s, -17.5 * s, 14 * s, 7 * s, 1.8 * s);
  ctx.stroke();
  if (air) {
    ctx.strokeStyle = 'rgba(122,246,255,0.55)';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.arc(0, -4 * s, 15 * s, p.face > 0 ? -0.2 : Math.PI - 0.4, p.face > 0 ? 1.15 : Math.PI + 0.95);
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
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 7 * s, 2.2 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#1a2a44';
  roundRect(-5 * s, -4 * s, 4.2 * s, 4 * s, 1 * s);
  ctx.fill();
  roundRect(0.6 * s, -4 * s, 4.2 * s, 4 * s, 1 * s);
  ctx.fill();
  ctx.fillStyle = '#12b8e8';
  roundRect(-bodyW * 0.55, -bodyH + 3 * s, bodyW * 1.1, bodyH * 0.62, 3 * s);
  ctx.fill();
  ctx.fillStyle = '#ff3db8';
  roundRect(-bodyW * 0.42, -bodyH + 7 * s, bodyW * 0.84, 2.4 * s, 1.2 * s);
  ctx.fill();
  ctx.fillStyle = '#eaf6ff';
  ctx.beginPath();
  ctx.arc(0, -bodyH + 6 * s, 5.4 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#12b8e8';
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

function drawTopi(e) {
  var s = L.s;
  var x = sx(e.x);
  var y = sy(e.y);
  var bob = Math.sin(e.wob) * 1.4 * s;
  ctx.save();
  ctx.translate(x, y - bob);
  ctx.scale(e.face, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 8 * s, 2.2 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e8f4ff';
  ctx.beginPath();
  ctx.ellipse(0, -7 * s, 8.2 * s, 7.4 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c5d8ee';
  ctx.beginPath();
  ctx.ellipse(0, -4 * s, 6 * s, 4 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(-2.4 * s, -8 * s, 1.15 * s, 0, TAU);
  ctx.arc(2.6 * s, -8 * s, 1.15 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff3db8';
  ctx.beginPath();
  ctx.arc(0, -5.6 * s, 1.1 * s, 0, TAU);
  ctx.fill();
  if (e.job === 'grab' || e.carry) {
    ctx.fillStyle = '#1ec8ff';
    roundRect(4 * s, -11 * s, 10 * s, 6 * s, 1.4 * s);
    ctx.fill();
    ctx.strokeStyle = 'rgba(122,246,255,0.8)';
    ctx.lineWidth = 1 * s;
    roundRect(4 * s, -11 * s, 10 * s, 6 * s, 1.4 * s);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBird(e) {
  var s = L.s;
  var x = sx(e.x);
  var y = sy(e.y);
  var flap = Math.sin(e.phase * 2.2) * 0.55;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(e.face, 1);
  ctx.fillStyle = '#ff3db8';
  ctx.beginPath();
  ctx.ellipse(0, 0, 6.2 * s, 3.6 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffe36b';
  ctx.beginPath();
  ctx.moveTo(6 * s, 0);
  ctx.lineTo(10 * s, 1.4 * s);
  ctx.lineTo(6 * s, 2.6 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,180,220,0.9)';
  ctx.beginPath();
  ctx.ellipse(-1 * s, -1 * s, 8 * s, 2.4 * s, flap, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(2.2 * s, -0.6 * s, 0.9 * s, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawCondor() {
  var c = G.condor;
  var s, x, y, flap;
  if (!c.live && G.player.state !== 'win') return;
  if (c.y < G.camY - 30 || c.y > G.camY + VIEW_H + 30) return;
  s = L.s;
  x = sx(c.x);
  y = sy(c.y);
  flap = Math.sin(c.flap) * 0.5;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(c.face, 1);
  ctx.fillStyle = 'rgba(255,61,184,0.85)';
  ctx.beginPath();
  ctx.ellipse(-2 * s, 0, 9 * s, 4.5 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffe36b';
  ctx.beginPath();
  ctx.ellipse(6 * s, -1 * s, 4 * s, 3 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,227,107,0.8)';
  ctx.beginPath();
  ctx.ellipse(-4 * s, -2 * s, 16 * s, 3.2 * s, flap, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,227,107,0.7)';
  ctx.lineWidth = 1.3 * s;
  ctx.beginPath();
  ctx.moveTo(-18 * s, flap * 8 * s);
  ctx.quadraticCurveTo(-4 * s, -10 * s, 8 * s, -2 * s);
  ctx.stroke();
  ctx.restore();
}

function drawBear() {
  var b = G.bear;
  var s, x, y;
  if (b.phase === 'idle') return;
  s = L.s;
  x = sx(WORLD_W * 0.5);
  y = sy(b.y);
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = '#eef4ff';
  roundRect(-22 * s, -28 * s, 44 * s, 30 * s, 10 * s);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-16 * s, -28 * s, 7 * s, 0, TAU);
  ctx.arc(16 * s, -28 * s, 7 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(-8 * s, -18 * s, 2.2 * s, 0, TAU);
  ctx.arc(8 * s, -18 * s, 2.2 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff3db8';
  ctx.beginPath();
  ctx.arc(0, -10 * s, 3 * s, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawVeggies() {
  var i, v, s, x, y, bob;
  s = L.s;
  for (i = 0; i < G.veggies.length; i++) {
    v = G.veggies[i];
    if (v.dead) continue;
    if (v.y < G.camY - 16 || v.y > G.camY + VIEW_H + 16) continue;
    bob = Math.sin(G.clock * 4 + i) * 3;
    x = sx(v.x);
    y = sy(v.y + bob);
    ctx.fillStyle = rgba(v.rgb, 0.95);
    ctx.beginPath();
    ctx.arc(x, y, 6 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(x - 1.6 * s, y - 1.8 * s, 1.6 * s, 0, TAU);
    ctx.fill();
  }
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
    y = sy(o.y);
    x = sx(o.x);
    ctx.fillStyle = 'rgba(220,245,255,0.55)';
    ctx.fillRect(x, y, o.s * L.s, o.s * L.s);
  }
  if (G.flash > 0) {
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.28);
    ctx.fillRect(0, 0, cssW, cssH);
  }
}

function draw() {
  var shx = 0;
  var shy = 0;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  if (G.shake > 0.2) {
    shx = (Math.random() - 0.5) * G.shake;
    shy = (Math.random() - 0.5) * G.shake;
  }
  ctx.save();
  ctx.translate(G.kickX + shx, G.kickY + shy);
  drawBg();
  drawBricks();
  drawVeggies();
  drawEnemies();
  drawCondor();
  drawPlayer();
  drawBear();
  drawFx();
  ctx.restore();
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
  if (hidden) {
    requestAnimationFrame(frame);
    return;
  }
  if (dt > 0.08) dt = 0.08;
  turbo = autoOn && autoSpeed >= 4 && G.mode === 'play';
  if (G.stop > 0 && !turbo) {
    G.stop -= dt;
    tickFx(dt);
    if (autoOn && G.mode !== 'play') tickAutoFlow(dt);
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
  draw();
  requestAnimationFrame(frame);
}

/* ---- autoplay ---- */
function clearAutoKeys() {
  keys.l = false;
  keys.r = false;
  keys.u = false;
  keys.d = false;
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
    condor: G.condor,
    veggies: G.veggies,
    kind: G.kind,
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
  if (autoIdle > 2.2 && d.jump) autoIdle = 1.65;
}

function tickAutoFlow(dt) {
  if (!autoOn) return;
  if (G.mode === 'title') {
    autoOvWait += dt;
    if (autoOvWait >= (autoSpeed >= 3 ? 0.25 : 0.5)) {
      autoOvWait = 0;
      startRun('climb');
    }
    return;
  }
  if (G.mode === 'over') {
    autoOvWait += dt;
    if (autoOvWait >= (autoSpeed >= 3 ? 0.7 : 1.15)) {
      autoOvWait = 0;
      startRun(G.kind);
    }
  }
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
  autoOvWait = 0;
  clearAutoKeys();
  G.jumpBuf = 0;
  syncAutoUi();
  if (autoOn) {
    audio.ensure();
    if (G.mode === 'title') startRun('climb');
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

function keyOn(e, down) {
  var k = e.code;
  if (k === 'ArrowLeft') { keys.l = down; e.preventDefault(); }
  else if (k === 'ArrowRight' || k === 'KeyD') { keys.r = down; e.preventDefault(); }
  else if (k === 'ArrowDown' || k === 'KeyS') { keys.d = down; e.preventDefault(); }
  else if (k === 'ArrowUp' || k === 'KeyW' || k === 'Space') {
    keys.u = down;
    if (down) G.jumpBuf = BUFFER;
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
      startRun('climb');
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      startRun('thin');
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
      startRun(G.kind === 'thin' ? 'climb' : 'thin');
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
btnClimb.addEventListener('click', function () {
  audio.ensure();
  startRun('climb');
});
btnThin.addEventListener('click', function () {
  audio.ensure();
  startRun('thin');
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

function selfCheck() {
  var h, m, p, hb, i, ice, holes, thin, t;
  if (LIVES !== 3) throw new Error('3 lives');
  if (COLS !== 16) throw new Error('16 cols');
  h = jumpHeight();
  if (h < ROW_H + 2) throw new Error('jump must reach next floor ' + h);
  if (h > ROW_H * 1.6) throw new Error('jump too high ' + h);
  if (Math.abs(rowStand(1) - rowStand(0) - ROW_H) > 0.01) throw new Error('row spacing');
  if (wrapCol(-1) !== COLS - 1) throw new Error('wrap col');
  if (Math.abs(wrapX(PAD - 4) - (PAD + INNER - 4)) > 0.2) throw new Error('wrap x');

  m = makeMountain('climb', 196, 1);
  if (m.grid.length < SUMMIT + 2) throw new Error('summit rows');
  for (i = 0; i < COLS; i++) if (m.grid[0][i] !== ICE2) throw new Error('floor0 thick');
  for (i = 0; i < COLS; i++) if (m.grid[1][i] !== ICE2) throw new Error('floor1 thick smash');
  ice = 0;
  for (i = 0; i < COLS; i++) if (m.grid[SUMMIT][i] !== EMPTY) ice++;
  if (ice < 4) throw new Error('peak platform');

  thin = makeMountain('thin', 7, 1);
  for (i = 0; i < COLS; i++) {
    t = thin.grid[0][i];
    if (t !== ICE) throw new Error('thin floor0');
  }

  holes = 0;
  ice = 0;
  for (i = 0; i < COLS; i++) {
    if (m.grid[6][i] === EMPTY) holes++;
    if (isIce(m.grid[6][i])) ice++;
  }
  if (ice < 2) throw new Error('climbable mid');

  p = makePlayer();
  if (p.y !== rowStand(0) || p.grounded !== true) throw new Error('spawn');
  hb = hammerBox(p);
  if (hb.y + hb.h < p.y + PH - 6) throw new Error('hammer above head');
  if (VEG.length < 3) throw new Error('veggies');
  if (makeCondor().live !== true) throw new Error('condor');
  if (iceHpFor('climb') !== ICE2 || iceHpFor('thin') !== ICE) throw new Error('hp modes');
  if (comboMul(5) <= comboMul(2)) throw new Error('combo scales');

  if (loadAutoSpeed() < 1 || loadAutoSpeed() > 4) throw new Error('auto speed range');
  if (AUTO_SCALE[3] !== 1 || AUTO_SCALE[4] <= AUTO_SCALE[3]) throw new Error('auto scale');
  if (AUTO_SCALE[1] >= AUTO_SCALE[2] || AUTO_SCALE[2] >= AUTO_SCALE[3]) throw new Error('auto scale order');
  if (SPEED_LABELS[3] !== '快' || SPEED_LABELS[4] !== '极快') throw new Error('speed labels');

  (function autoPlayCheck() {
    var m2, p2, d, d2, st, holeC, i, walked, climb, endRun;
    m2 = makeMountain('climb', 196, 1);
    p2 = makePlayer();
    st = {
      grid: m2.grid, player: p2, enemies: [],
      condor: makeCondor(), veggies: [], kind: 'climb',
      stickyCol: -1, landDir: 1, idle: 0
    };
    d = autoDecide(st);
    if (!d.jump) throw new Error('AI must jump-hammer ice at spawn');
    if (d.l && d.r) throw new Error('AI spawn wiggle');
    st.stickyCol = d.col;
    d2 = autoDecide(st);
    if (!d2.jump) throw new Error('AI spawn must keep jumping the ceiling');
    if ((d.l ? 1 : 0) !== (d2.l ? 1 : 0) || (d.r ? 1 : 0) !== (d2.r ? 1 : 0)) {
      throw new Error('AI spawn direction flip');
    }

    holeC = wrapCol(colOfX(p2.x) + 5);
    setCell(m2.grid, holeC, 1, EMPTY);
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
    st.condor.y = rowStand(SUMMIT) + 34;
    d = autoDecide(st);
    if (!d.r || d.l) throw new Error('AI should chase condor');

    p2 = makePlayer();
    st.kind = 'thin';
    st.condor = makeCondor();
    st.player = p2;
    st.grid = makeMountain('thin', 7, 1).grid;
    st.stickyCol = -1;
    d = autoDecide(st);
    if (!d.jump && !d.l && !d.r) throw new Error('AI idle thin');

    climb = playAutoClimb('climb', 70, 196);
    if (climb.smashed < 4) throw new Error('AI should smash ice, got ' + climb.smashed);
    if (climb.groundH < 6 && climb.maxH < 6) {
      throw new Error('AI should climb the peak, h=' + climb.groundH + '/' + climb.maxH);
    }
    if (climb.jumps > 220) throw new Error('AI climb should not jump-spam, jumps=' + climb.jumps);
    if (climb.grabs < 1 && climb.maxH < SUMMIT) throw new Error('AI climb should reach condor or summit');
    endRun = playAutoClimb('thin', 28, 7);
    if (endRun.groundH < 4 && endRun.maxH < 4) {
      throw new Error('AI thin should climb, h=' + endRun.groundH + '/' + endRun.maxH);
    }
    if (endRun.jumps > 120) throw new Error('AI thin should not jump-spam, jumps=' + endRun.jumps);
  }());
}

selfCheck();
seedSnow();
bestEl.textContent = String(G.bestM);
renderPips();
syncSpeedUi();
syncAutoUi();
showTitle();
resize();
hudPlay();
modeLabel.textContent = '登山';
requestAnimationFrame(frame);
