'use strict';

/* 蛙路 — Frogger remake. No CDN. */

var COLS = 13;
var ROWS = 11;
var HOME_ROW = 0;
var START_ROW = 10;
var MEDIAN_ROW = 5;
var HOME_COLS = [1, 4, 6, 8, 11];
var LIVES = 3;
var HOP_SCORE = 10;
var HOME_SCORE = 50;
var FLY_SCORE = 150;
var ROUND_BONUS = 200;
var TIME_SCORE = 10;
var FROG_HW = 0.32;
var SWIPE_MIN = 24;
var BEST_KEY = 'playbox-frog-hop-best';
var MUTE_KEY = 'playbox-frog-hop-mute';
var AUTO_SPEED_KEY = 'playbox-frog-hop-auto-speed';
var AUTO_SPEED_NAME = ['', '慢', '中', '快', '极快'];
var AUTO_DELAY = [0, 420, 200, 70, 0];
var AUTO_HOP = 0.092;
var AUTO_DT = 1 / 60;
var AUTO_WAITS = [0, 0.05, 0.1, 0.16, 0.22, 0.3, 0.4, 0.52, 0.66, 0.82, 1.0, 1.22, 1.48];
var AUTO_DIRS = [0, 3, 1, 2];
var LOOK_WAITS = [0, 0.08, 0.18, 0.32, 0.5, 0.78, 1.1];
var TAU = Math.PI * 2;
var DIVE = { up: 2.65, sink: 0.72, down: 1.12, rise: 0.72 };
var DIVE_FAST = { up: 1.85, sink: 0.56, down: 1.38, rise: 0.56 };
var PALS = [
  [255, 61, 184],
  [0, 240, 255],
  [255, 227, 107],
  [255, 132, 72],
  [176, 148, 255],
  [255, 82, 118]
];
var KEY_DIR = {
  ArrowLeft: 3, ArrowRight: 1, ArrowUp: 0, ArrowDown: 2,
  KeyD: 1, KeyW: 0, KeyS: 2
};
var DIR_XY = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 }
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
function wrapPos(x, loop) {
  return ((x % loop) + loop) % loop;
}
function rgba(rgb, a) {
  return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
}
function homeIndex(c) {
  for (var i = 0; i < HOME_COLS.length; i++) if (HOME_COLS[i] === c) return i;
  return -1;
}
function isHomePad(c, r) {
  return r === HOME_ROW && homeIndex(c) >= 0;
}
function rowType(r) {
  if (r === HOME_ROW) return 'home';
  if (r >= 1 && r <= 4) return 'river';
  if (r === MEDIAN_ROW) return 'median';
  if (r >= 6 && r <= 9) return 'road';
  if (r === START_ROW) return 'start';
  return 'void';
}
function isRiver(r) { return r >= 1 && r <= 4; }
function isRoad(r) { return r >= 6 && r <= 9; }
function isSafeRow(r) { return r === START_ROW || r === MEDIAN_ROW; }
function frogRow(y) { return Math.round(y - 0.5); }
function frogHitbox(x, y) {
  return { x: x - FROG_HW, y: y - FROG_HW, w: FROG_HW * 2, h: FROG_HW * 2 };
}
function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function overlapX(fx, itemX, itemW, pad) {
  var left = itemX + pad;
  var right = itemX + itemW - pad;
  var fl = fx - FROG_HW;
  var fr = fx + FROG_HW;
  return Math.min(fr, right) - Math.max(fl, left);
}
function copies(x, w, loop, left, right) {
  var out = [];
  var k, xx;
  for (k = -1; k <= 2; k++) {
    xx = x + k * loop;
    if (xx < right && xx + w > left) out.push(xx);
  }
  return out;
}
function turtleSub(phase, spec) {
  if (!spec) return 0;
  var T = spec.up + spec.sink + spec.down + spec.rise;
  var t = phase % T;
  if (t < 0) t += T;
  if (t < spec.up) return 0;
  t -= spec.up;
  if (t < spec.sink) return t / spec.sink;
  t -= spec.sink;
  if (t < spec.down) return 1;
  t -= spec.down;
  return Math.max(0, 1 - t / spec.rise);
}
function roundMul(round) {
  return 1 + Math.max(0, round - 1) * 0.13;
}
function timeLimit(round) {
  var t = 30 - (round - 1) * 1.4;
  return t < 18 ? 18 : t;
}
function diveSpec(round) {
  return round >= 3 ? DIVE_FAST : DIVE;
}

function hopTarget(x, y, dx, dy, homes) {
  var nx = x + dx;
  var ny = y + dy;
  var row = Math.round(ny - 0.5);
  var hi, d, best, bestD;
  if (row < 0 || row > START_ROW) return null;
  if (row === HOME_ROW) {
    best = -1;
    bestD = 99;
    for (hi = 0; hi < HOME_COLS.length; hi++) {
      d = Math.abs(nx - (HOME_COLS[hi] + 0.5));
      if (d < bestD) {
        bestD = d;
        best = hi;
      }
    }
    if (best < 0 || bestD > 0.62) return null;
    if (homes[best]) return null;
    return { x: HOME_COLS[best] + 0.5, y: 0.5, home: best };
  }
  if (nx < 0.32 || nx > COLS - 0.32) return null;
  return { x: nx, y: row + 0.5, home: -1 };
}

function itemWorldX(lane, item, clock) {
  return wrapPos(item.base + lane.dir * lane.speed * clock, lane.loop);
}

function itemCopies(lane, item, clock) {
  return copies(itemWorldX(lane, item, clock), item.w, lane.loop, -item.w - 1, COLS + 1);
}

function findRide(x, row, lanes, clock) {
  var i, j, k, lane, item, xs, xx, pad, ov, sub;
  if (!isRiver(row)) return null;
  for (i = 0; i < lanes.length; i++) {
    lane = lanes[i];
    if (lane.row !== row) continue;
    for (j = 0; j < lane.items.length; j++) {
      item = lane.items[j];
      if (item.kind === 'turtle') {
        sub = turtleSub(clock + (item.phase0 || 0), item.dive ? item.cycle : null);
        if (sub >= 0.55) continue;
      }
      xs = itemCopies(lane, item, clock);
      pad = item.kind === 'log' ? 0.16 : 0.08;
      for (k = 0; k < xs.length; k++) {
        xx = xs[k];
        ov = overlapX(x, xx, item.w, pad);
        if (ov > 0.1) return { lane: lane, item: item, x: xx, sub: 0 };
      }
    }
  }
  return null;
}

function carHit(x, y, lanes, clock) {
  var row = frogRow(y);
  var hb, i, j, k, lane, item, xs, xx, box;
  if (!isRoad(row)) return false;
  hb = frogHitbox(x, y);
  for (i = 0; i < lanes.length; i++) {
    lane = lanes[i];
    if (lane.kind !== 'road' || lane.row !== row) continue;
    for (j = 0; j < lane.items.length; j++) {
      item = lane.items[j];
      xs = itemCopies(lane, item, clock);
      for (k = 0; k < xs.length; k++) {
        xx = xs[k];
        box = { x: xx + 0.06, y: lane.row + 0.16, w: item.w - 0.12, h: 0.68 };
        if (aabb(hb, box)) return true;
      }
    }
  }
  return false;
}

function carriedOff(x) {
  return x < -0.18 || x > COLS + 0.18;
}

function submergedAt(x, row, lanes, clock) {
  var i, j, k, lane, item, xs, xx, sub;
  if (!isRiver(row)) return false;
  for (i = 0; i < lanes.length; i++) {
    lane = lanes[i];
    if (lane.row !== row) continue;
    for (j = 0; j < lane.items.length; j++) {
      item = lane.items[j];
      if (item.kind !== 'turtle' || !item.dive) continue;
      sub = turtleSub(clock + (item.phase0 || 0), item.cycle);
      if (sub < 0.55) continue;
      xs = itemCopies(lane, item, clock);
      for (k = 0; k < xs.length; k++) {
        xx = xs[k];
        if (overlapX(x, xx, item.w, 0.08) > 0.1) return true;
      }
    }
  }
  return false;
}

function hazardAt(x, y, lanes, clock) {
  var row = frogRow(y);
  var ride;
  if (row === HOME_ROW) {
    return isHomePad(Math.round(x - 0.5), HOME_ROW) ? null : 'bank';
  }
  if (isSafeRow(row)) return null;
  if (isRoad(row)) return carHit(x, y, lanes, clock) ? 'car' : null;
  if (isRiver(row)) {
    ride = findRide(x, row, lanes, clock);
    if (!ride) return submergedAt(x, row, lanes, clock) ? 'dive' : 'water';
    if (carriedOff(x)) return 'edge';
    return null;
  }
  return null;
}

function simWait(x, y, clock, lanes, dur) {
  var row = frogRow(y);
  var nx = x;
  var left, step, ride, hz;
  if (dur <= 0) return { dead: null, x: x, y: y, clock: clock };
  if (isSafeRow(row) || row === HOME_ROW) {
    return { dead: null, x: x, y: y, clock: clock + dur };
  }
  left = dur;
  while (left > 1e-8) {
    step = left > AUTO_DT ? AUTO_DT : left;
    clock += step;
    left -= step;
    if (isRiver(row)) {
      ride = findRide(nx, row, lanes, clock);
      if (ride) nx += ride.lane.dir * ride.lane.speed * step;
    }
    if (carriedOff(nx)) return { dead: 'edge', x: nx, y: y, clock: clock };
    if (isRoad(row)) {
      if (carHit(nx, y, lanes, clock)) return { dead: 'car', x: nx, y: y, clock: clock };
    } else {
      hz = hazardAt(nx, y, lanes, clock);
      if (hz) return { dead: hz, x: nx, y: y, clock: clock };
    }
  }
  return { dead: null, x: nx, y: y, clock: clock };
}

function simHop(x, y, dir, clock, homes, lanes) {
  var d = DIR_XY[dir];
  var dest, nx, ny, hz, t, step, row, ride;
  dest = hopTarget(x, y, d.dx, d.dy, homes);
  if (!dest) return null;
  nx = dest.x;
  ny = dest.y;
  if (dest.home >= 0) {
    return { dead: null, x: nx, y: ny, clock: clock, home: dest.home };
  }
  hz = hazardAt(nx, ny, lanes, clock);
  if (hz) return { dead: hz, x: nx, y: ny, clock: clock, home: -1 };
  t = 0;
  row = frogRow(ny);
  while (t < AUTO_HOP - 1e-8) {
    step = AUTO_HOP - t > AUTO_DT ? AUTO_DT : AUTO_HOP - t;
    clock += step;
    t += step;
    if (isRiver(row)) {
      ride = findRide(nx, row, lanes, clock);
      if (ride) nx += ride.lane.dir * ride.lane.speed * step;
    }
    if (carriedOff(nx)) return { dead: 'edge', x: nx, y: ny, clock: clock, home: -1 };
    if (isRoad(row) && carHit(nx, ny, lanes, clock)) {
      return { dead: 'car', x: nx, y: ny, clock: clock, home: -1 };
    }
  }
  hz = hazardAt(nx, ny, lanes, clock);
  if (hz) return { dead: hz, x: nx, y: ny, clock: clock, home: -1 };
  return { dead: null, x: nx, y: ny, clock: clock, home: -1 };
}

function survivalTime(x, y, clock, lanes, limit) {
  var st, t = 0, slice;
  if (limit == null) limit = 0.6;
  if (isSafeRow(frogRow(y)) || frogRow(y) === HOME_ROW) return limit;
  while (t < limit - 1e-8) {
    slice = limit - t > 0.05 ? 0.05 : limit - t;
    st = simWait(x, y, clock, lanes, slice);
    t += slice;
    if (st.dead) return t;
    x = st.x;
    y = st.y;
    clock = st.clock;
  }
  return limit;
}

function nearestEmptyHomeX(x, homes, fly) {
  var i, cx, d, best = 6.5, bestD = 99;
  for (i = 0; i < HOME_COLS.length; i++) {
    if (homes[i]) continue;
    cx = HOME_COLS[i] + 0.5;
    d = Math.abs(x - cx);
    if (fly === i) d -= 0.9;
    if (d < bestD) {
      bestD = d;
      best = cx;
    }
  }
  return best;
}

function landingOk(st, homes, lanes, hold) {
  var surv, i, w, mid, hop, di, dir;
  if (!st || st.dead) return false;
  if (st.home >= 0) return true;
  surv = survivalTime(st.x, st.y, st.clock, lanes, 0.55);
  if (surv >= Math.min(0.24, hold + 0.06)) return true;
  for (i = 0; i < LOOK_WAITS.length; i++) {
    w = LOOK_WAITS[i];
    if (w > 0.5) break;
    mid = w ? simWait(st.x, st.y, st.clock, lanes, w) : { dead: null, x: st.x, y: st.y, clock: st.clock };
    if (mid.dead) return false;
    for (di = 0; di < 3; di++) {
      dir = AUTO_DIRS[di];
      hop = simHop(mid.x, mid.y, dir, mid.clock, homes, lanes);
      if (hop && !hop.dead) return true;
    }
  }
  return surv >= 0.12;
}

function soonestUp(x, y, clock, homes, lanes, maxWait, hold) {
  var i, w, held, hop;
  for (i = 0; i < AUTO_WAITS.length; i++) {
    w = AUTO_WAITS[i];
    if (w > maxWait) break;
    held = w ? simWait(x, y, clock, lanes, w) : { dead: null, x: x, y: y, clock: clock };
    if (held.dead) return null;
    hop = simHop(held.x, held.y, 0, held.clock, homes, lanes);
    if (hop && !hop.dead && landingOk(hop, homes, lanes, hold)) {
      return { dir: 0, wait: w, st: hop };
    }
  }
  return null;
}

function scoreLanding(x, y, clock, homes, lanes, fly, dir, wait, hold) {
  var row = frogRow(y);
  var target = nearestEmptyHomeX(x, homes, fly);
  var survive = survivalTime(x, y, clock, lanes, Math.max(0.7, hold + 0.2));
  var s = (START_ROW - row) * 560;
  s -= Math.abs(x - target) * (row <= 4 ? 48 : (row <= 8 ? 16 : 8));
  s += Math.min(survive, 0.7) * 110;
  s -= wait * 10;
  if (dir === 0) s += 140;
  if (dir === 2) s -= 420;
  if (dir === 1 || dir === 3) s -= 24;
  if (isRiver(row)) {
    if (x < 0.65 || x > COLS - 0.65) s -= 1200;
    else if (x < 1.35 || x > COLS - 1.35) s -= 220;
  }
  if (isSafeRow(row)) s += 50;
  if (survive < hold) s -= 700 + (hold - survive) * 800;
  if (survive < 0.16) s -= 400;
  return s;
}

function pickAutoHop(x, y, clock, homes, lanes, fly, hold) {
  var row = frogRow(y);
  var danger, wi, di, dir, w, held, st, s, best, bestS, up, chain, k, cx, cy, cc, nxt;
  if (hold == null) hold = 0.12;
  danger = !isSafeRow(row) && survivalTime(x, y, clock, lanes, 0.18) < 0.16;

  up = soonestUp(x, y, clock, homes, lanes, danger ? 0.08 : 1.48, hold);
  if (up) return { dir: 0, wait: up.wait };

  bestS = -1e12;
  best = null;
  for (wi = 0; wi < AUTO_WAITS.length; wi++) {
    w = AUTO_WAITS[wi];
    if (danger && w > 0.1) break;
    held = w ? simWait(x, y, clock, lanes, w) : { dead: null, x: x, y: y, clock: clock };
    if (held.dead) break;
    for (di = 0; di < AUTO_DIRS.length; di++) {
      dir = AUTO_DIRS[di];
      if (dir === 0) continue;
      if (dir === 2 && !danger && (row >= MEDIAN_ROW || row <= 2)) continue;
      st = simHop(held.x, held.y, dir, held.clock, homes, lanes);
      if (!st || st.dead) continue;
      if (st.home >= 0) {
        s = 60000 + (fly === st.home ? 800 : 0) - w * 25;
      } else {
        s = scoreLanding(st.x, st.y, st.clock, homes, lanes, fly, dir, w, hold);
        nxt = soonestUp(st.x, st.y, st.clock, homes, lanes, 1.35, hold);
        if (nxt) {
          s += 900 - nxt.wait * 40;
          if (nxt.st.home >= 0) s += 8000 + (fly === nxt.st.home ? 400 : 0);
          else {
            chain = 1;
            cx = nxt.st.x;
            cy = nxt.st.y;
            cc = nxt.st.clock;
            for (k = 0; k < 2; k++) {
              nxt = soonestUp(cx, cy, cc, homes, lanes, 1.1, hold);
              if (!nxt) break;
              chain += 1;
              if (nxt.st.home >= 0) {
                chain += 5;
                break;
              }
              cx = nxt.st.x;
              cy = nxt.st.y;
              cc = nxt.st.clock;
            }
            s += chain * 280;
          }
        } else {
          s -= 180;
        }
      }
      if (s > bestS) {
        bestS = s;
        best = { dir: dir, wait: w };
      }
    }
  }
  return best;
}

function autoPlayToHome(round, clock0, homes0) {
  var homes = homes0 || emptyHomes();
  var lanes = buildLanes(round || 1);
  var x = 6.5;
  var y = START_ROW + 0.5;
  var clock = clock0 || 0;
  var hops = 0;
  var guard = 0;
  var side = 0;
  var fwd = 0;
  var plan, held, st;
  while (hops < 48 && guard < 280) {
    guard += 1;
    plan = pickAutoHop(x, y, clock, homes, lanes, -1, 0.12);
    if (!plan) {
      held = simWait(x, y, clock, lanes, 0.06);
      if (held.dead) return { ok: false, why: held.dead, hops: hops, y: y };
      x = held.x;
      y = held.y;
      clock = held.clock;
      continue;
    }
    if (plan.wait > 0) {
      held = simWait(x, y, clock, lanes, plan.wait);
      if (held.dead) return { ok: false, why: held.dead, hops: hops, y: y, dir: plan.dir };
      x = held.x;
      y = held.y;
      clock = held.clock;
    }
    st = simHop(x, y, plan.dir, clock, homes, lanes);
    if (!st || st.dead) return { ok: false, why: st && st.dead, hops: hops, dir: plan.dir, y: y };
    hops += 1;
    if (plan.dir === 0) fwd += 1;
    else if (plan.dir === 1 || plan.dir === 3) side += 1;
    x = st.x;
    y = st.y;
    clock = st.clock;
    if (st.home >= 0) {
      return { ok: true, hops: hops, home: st.home, fwd: fwd, side: side, clock: clock };
    }
  }
  return { ok: false, why: 'timeout', hops: hops, y: y, fwd: fwd, side: side };
}

function buildLanes(round) {
  var m = roundMul(round);
  var dive = diveSpec(round);
  var lanes = [
    {
      row: 1, dir: 1, speed: 1.42 * m, loop: 18, kind: 'river',
      items: [
        { kind: 'turtle', base: 0.35, w: 2.08, n: 2, dive: true, phase0: 0, cycle: dive },
        { kind: 'turtle', base: 6.3, w: 2.08, n: 2, dive: false, phase0: 0, cycle: dive },
        { kind: 'turtle', base: 12.1, w: 2.08, n: 2, dive: true, phase0: 1.35, cycle: dive }
      ]
    },
    {
      row: 2, dir: -1, speed: 2.12 * m, loop: 20, kind: 'river',
      items: [
        { kind: 'log', base: 0.1, w: 2.65 },
        { kind: 'log', base: 5.9, w: 3.45 },
        { kind: 'log', base: 12.5, w: 2.85 }
      ]
    },
    {
      row: 3, dir: 1, speed: 1.72 * m, loop: 22, kind: 'river',
      items: [
        { kind: 'turtle', base: 0.2, w: 3.08, n: 3, dive: true, phase0: 0.15, cycle: dive },
        { kind: 'turtle', base: 8.5, w: 3.08, n: 3, dive: round >= 2, phase0: 1.7, cycle: dive },
        { kind: 'turtle', base: 16.1, w: 2.08, n: 2, dive: false, phase0: 0, cycle: dive }
      ]
    },
    {
      row: 4, dir: -1, speed: 1.52 * m, loop: 19.2, kind: 'river',
      items: [
        { kind: 'log', base: 0.25, w: 4.15 },
        { kind: 'log', base: 7.5, w: 3.55 },
        { kind: 'log', base: 13.9, w: 3.15 }
      ]
    },
    {
      row: 6, dir: 1, speed: 2.62 * m, loop: 18, kind: 'road',
      items: [
        { kind: 'car', base: 0.35, w: 1.55, pal: 0 },
        { kind: 'car', base: 4.95, w: 1.55, pal: 1 },
        { kind: 'car', base: 9.55, w: 1.55, pal: 2 },
        { kind: 'car', base: 14.15, w: 1.55, pal: 3 }
      ]
    },
    {
      row: 7, dir: -1, speed: 2.02 * m, loop: 17.2, kind: 'road',
      items: [
        { kind: 'car', base: 0.2, w: 1.72, pal: 4 },
        { kind: 'car', base: 4.5, w: 1.72, pal: 0 },
        { kind: 'car', base: 8.9, w: 1.72, pal: 1 },
        { kind: 'car', base: 13.3, w: 1.72, pal: 2 }
      ]
    },
    {
      row: 8, dir: 1, speed: 1.68 * m, loop: 20, kind: 'road',
      items: [
        { kind: 'truck', base: 0.55, w: 3.18, pal: 5 },
        { kind: 'truck', base: 8.15, w: 3.18, pal: 3 },
        { kind: 'car', base: 14.55, w: 1.82, pal: 4 }
      ]
    },
    {
      row: 9, dir: -1, speed: 1.32 * m, loop: 18.4, kind: 'road',
      items: [
        { kind: 'car', base: 0.45, w: 1.86, pal: 2 },
        { kind: 'car', base: 5.25, w: 1.86, pal: 0 },
        { kind: 'car', base: 10.05, w: 1.86, pal: 1 },
        { kind: 'car', base: 14.85, w: 1.86, pal: 4 }
      ]
    }
  ];
  return lanes;
}

function emptyHomes() {
  return [false, false, false, false, false];
}

function homesFilled(homes) {
  var i;
  for (i = 0; i < 5; i++) if (!homes[i]) return false;
  return true;
}

function spawnFrog() {
  return {
    x: 6.5,
    y: START_ROW + 0.5,
    dir: 0,
    visFromX: 6.5,
    visFromY: START_ROW + 0.5,
    hopT: 1,
    squash: 1,
    dead: false,
    why: ''
  };
}

function selfCheck() {
  var homes, t, lanes, ride, i, s;

  if (HOME_COLS.length !== 5) throw new Error('five home pads');
  if (rowType(0) !== 'home') throw new Error('row0 home');
  if (rowType(1) !== 'river' || rowType(4) !== 'river') throw new Error('4 river lanes');
  if (rowType(5) !== 'median') throw new Error('median');
  if (rowType(6) !== 'road' || rowType(9) !== 'road') throw new Error('4 car lanes');
  if (rowType(10) !== 'start') throw new Error('start');
  if (isRiver(5) || isRoad(5) || !isSafeRow(5) || !isSafeRow(10)) throw new Error('safe rows');

  homes = emptyHomes();
  t = hopTarget(6.5, 10.5, 0, 1, homes);
  if (t) throw new Error('cannot hop off start down');
  t = hopTarget(6.5, 10.5, 0, -1, homes);
  if (!t || t.y !== 9.5) throw new Error('hop up from start onto cars');
  t = hopTarget(0.5, 10.5, -1, 0, homes);
  if (t) throw new Error('cannot hop off left');
  t = hopTarget(12.5, 10.5, 1, 0, homes);
  if (t) throw new Error('cannot hop off right');

  t = hopTarget(1.5, 1.5, 0, -1, homes);
  if (!t || t.home !== 0 || t.x !== 1.5) throw new Error('land on first pad');
  t = hopTarget(2.5, 1.5, 0, -1, homes);
  if (t) throw new Error('home wall blocks');
  homes[0] = true;
  t = hopTarget(1.5, 1.5, 0, -1, homes);
  if (t) throw new Error('occupied home blocks');
  homes[0] = false;
  t = hopTarget(6.5, 1.5, 0, -1, homes);
  if (!t || t.home !== 2) throw new Error('middle pad');
  t = hopTarget(1.85, 1.5, 0, -1, homes);
  if (!t || t.home !== 0 || t.x !== 1.5) throw new Error('snap to nearby pad');

  if (turtleSub(0, DIVE) !== 0) throw new Error('turtle up start');
  if (turtleSub(DIVE.up + DIVE.sink + 0.1, DIVE) !== 1) throw new Error('turtle down');
  if (turtleSub(DIVE.up + 0.5 * DIVE.sink, DIVE) < 0.4) throw new Error('turtle sinking');
  if (turtleSub(0, null) !== 0) throw new Error('no-dive turtles stay up');

  if (!aabb({ x: 0, y: 0, w: 1, h: 1 }, { x: 0.5, y: 0.5, w: 1, h: 1 })) throw new Error('aabb hit');
  if (aabb({ x: 0, y: 0, w: 1, h: 1 }, { x: 2, y: 0, w: 1, h: 1 })) throw new Error('aabb miss');

  if (wrapPos(-1, 10) !== 9) throw new Error('wrap neg');
  if (wrapPos(10, 10) !== 0) throw new Error('wrap end');
  if (copies(18, 2, 20, -3, 14).length < 1) throw new Error('wrap copies');

  if (Math.abs(roundMul(1) - 1) > 1e-9) throw new Error('round1 mul');
  if (roundMul(2) <= roundMul(1)) throw new Error('speed up');
  if (timeLimit(1) !== 30) throw new Error('time 30');
  if (timeLimit(20) < 18 || timeLimit(20) > 18) throw new Error('time floor 18');
  if (LIVES !== 3) throw new Error('3 lives');

  lanes = buildLanes(1);
  if (lanes.length !== 8) throw new Error('8 traffic lanes');
  s = 0;
  for (i = 0; i < lanes.length; i++) {
    if (lanes[i].kind === 'road') s++;
    if (lanes[i].speed <= 0) throw new Error('lane speed');
  }
  if (s !== 4) throw new Error('4 car lanes built');

  ride = findRide(1.6, 4, lanes, 0);
  if (!ride || ride.item.kind !== 'log') throw new Error('log ride at t0');
  if (findRide(6.4, 4, lanes, 0)) throw new Error('water gap between logs');
  if (hazardAt(6.4, 4.5, lanes, 0) !== 'water') throw new Error('water kills');
  if (hazardAt(1.6, 4.5, lanes, 0)) throw new Error('log is safe');

  if (hazardAt(6.5, 10.5, lanes, 0)) throw new Error('start safe');
  if (hazardAt(6.5, 5.5, lanes, 0)) throw new Error('median safe');
  for (i = 0; i < 180; i++) {
    if (hazardAt(6.5, 10.5, lanes, i / 60)) throw new Error('start always safe');
    if (hazardAt(6.5, 5.5, lanes, i / 60)) throw new Error('median always safe');
  }

  /* parked car at known place: row 9 dir -1, item base 0.45 w 1.86 at t=0 x=0.45 */
  if (!carHit(0.9, 9.5, lanes, 0)) throw new Error('car overlap kills');
  if (carHit(3.4, 9.5, lanes, 0)) throw new Error('car gap lives');
  if (hazardAt(0.9, 9.5, lanes, 0) !== 'car') throw new Error('hazard car');

  lanes = [{
    row: 1, dir: 1, speed: 0, loop: 18, kind: 'river',
    items: [{ kind: 'turtle', base: 0.4, w: 2.08, n: 2, dive: true, phase0: DIVE.up + DIVE.sink + 0.2, cycle: DIVE }]
  }];
  ride = findRide(1.3, 1, lanes, 0);
  if (ride) throw new Error('dived turtle not rideable');
  if (hazardAt(1.3, 1.5, lanes, 0) !== 'dive') throw new Error('dived turtle is lethal');
  lanes[0].items[0].dive = false;
  if (!findRide(1.3, 1, lanes, 0)) throw new Error('surface turtle rideable');
  if (carriedOff(6.5)) throw new Error('center not off');
  if (!carriedOff(-0.4) || !carriedOff(13.4)) throw new Error('edge off');

  homes = emptyHomes();
  for (i = 0; i < 5; i++) homes[i] = true;
  if (!homesFilled(homes)) throw new Error('five homes clear round');

  lanes = buildLanes(1);
  homes = emptyHomes();
  t = simHop(6.5, 10.5, 0, 0, homes, lanes);
  if (!t || !t.dead) throw new Error('auto sim hop into car at t0');
  if (simHop(6.5, 10.5, 2, 0, homes, lanes)) throw new Error('auto sim cannot hop off start');
  t = pickAutoHop(6.5, 10.5, 0, homes, lanes, -1, 0.12);
  if (!t) throw new Error('auto plans from start');
  if (t.dir === 0 && t.wait < 0.05) throw new Error('auto must not hop into first car');
  s = autoPlayToHome(1, 0);
  if (!s.ok) throw new Error('auto must cross round1: ' + s.why + ' hops=' + s.hops + ' y=' + s.y);
  if (s.fwd < 8) throw new Error('auto must hop forward not wiggle fwd=' + s.fwd);
  if (s.side > s.fwd) throw new Error('auto wiggled side=' + s.side + ' fwd=' + s.fwd);
  s = autoPlayToHome(1, 2.4);
  if (!s.ok) throw new Error('auto must cross later clock: ' + s.why);
  s = autoPlayToHome(3, 0.8);
  if (!s.ok) throw new Error('auto must cross round3: ' + s.why + ' hops=' + s.hops);
  homes = emptyHomes();
  for (i = 0; i < 5; i++) {
    s = autoPlayToHome(1, 0.35 * i, homes);
    if (!s.ok) throw new Error('auto fill home ' + i + ': ' + s.why + ' y=' + s.y);
    if (homes[s.home]) throw new Error('auto reused occupied home');
    homes[s.home] = true;
    if (s.fwd < 8) throw new Error('auto fill wiggle fwd=' + s.fwd);
  }
  if (!homesFilled(homes)) throw new Error('auto did not fill five homes');
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

selfCheck();

if (typeof document === 'undefined') {
  /* node --check / selfCheck only */
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
var btnClassic = document.getElementById('btn-classic');
var btnNight = document.getElementById('btn-night');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnAuto = document.getElementById('btn-auto');
var speedEl = document.getElementById('speed');
var speedLab = document.getElementById('speed-lab');
var scoreEl = document.getElementById('score');
var roundEl = document.getElementById('round');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var timeBar = document.getElementById('time-bar');
var pipsEl = document.getElementById('pips');
var toastEl = document.getElementById('toast');
var hintEl = document.getElementById('hint');
var motionQ = window.matchMedia('(prefers-reduced-motion: reduce)');
var autoOn = false;
var autoSpeed = loadAutoSpeed();
var autoPlan = null;
var autoMs = 0;

var dpr = 1;
var cssW = 0;
var cssH = 0;
var L = { x: 0, y: 0, cell: 32, w: 0, h: 0 };
var lastTs = 0;
var hidden = false;
var toastTok = 0;
var addTok = 0;
var kickTok = 0;

var particles = [];
var sparks = [];
var floats = [];
var rings = [];

var G = {
  mode: 'title',
  kind: 'classic',
  night: false,
  clock: 0,
  round: 1,
  lives: LIVES,
  score: 0,
  best: 0,
  combo: 0,
  maxCombo: 0,
  time: 30,
  timeMax: 30,
  homes: emptyHomes(),
  lanes: buildLanes(1),
  frog: spawnFrog(),
  pending: -1,
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flash: 0,
  flashRgb: [255, 61, 184],
  lock: 0,
  fly: -1,
  flyT: 0,
  flyCd: 7,
  tickWarn: 0,
  why: ''
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
  hop: function (combo) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.045;
    this.beep(390 * p, 0.055, 'square', 0.05, 620 * p);
    this.noise(0.04, 0.04, 1400, 'highpass');
  },
  landRoad: function () {
    this.ensure();
    this.noise(0.045, 0.05, 420, 'bandpass');
    this.beep(180, 0.04, 'sine', 0.03, 90);
  },
  landWater: function () {
    this.ensure();
    this.noise(0.08, 0.055, 720, 'bandpass');
    this.beep(240, 0.07, 'sine', 0.035, 110);
  },
  home: function () {
    this.ensure();
    this.beep(523, 0.09, 'square', 0.055, 784);
    this.beep(659, 0.11, 'triangle', 0.045);
    this.beep(784, 0.16, 'square', 0.04, 1046);
  },
  fly: function () {
    this.ensure();
    this.beep(880, 0.07, 'sine', 0.05, 1320);
    this.beep(1174, 0.1, 'triangle', 0.04);
  },
  round: function () {
    this.ensure();
    this.beep(392, 0.1, 'square', 0.055, 523);
    this.beep(523, 0.1, 'square', 0.05, 659);
    this.beep(784, 0.22, 'triangle', 0.06, 1046);
  },
  car: function () {
    this.ensure();
    this.noise(0.16, 0.12, 180, 'lowpass');
    this.noise(0.08, 0.07, 900, 'bandpass');
    this.beep(140, 0.22, 'sawtooth', 0.07, 42);
  },
  water: function () {
    this.ensure();
    this.noise(0.18, 0.09, 380, 'lowpass');
    this.beep(210, 0.16, 'sine', 0.05, 70);
    this.beep(90, 0.22, 'triangle', 0.045, 40);
  },
  time: function () {
    this.ensure();
    this.beep(880, 0.05, 'square', 0.04);
    this.beep(440, 0.12, 'square', 0.045, 160);
  },
  warn: function () {
    this.ensure();
    this.beep(920, 0.04, 'square', 0.03);
  },
  combo: function (n) {
    this.ensure();
    var f = 480 + n * 55;
    this.beep(f, 0.07, 'sine', 0.045, f * 1.4);
  },
  over: function () {
    this.ensure();
    this.beep(196, 0.2, 'sawtooth', 0.05, 80);
    this.beep(110, 0.32, 'sine', 0.055, 46);
  },
  start: function () {
    this.ensure();
    this.beep(392, 0.08, 'square', 0.045, 523);
    this.beep(659, 0.12, 'triangle', 0.04);
  },
  ui: function () {
    this.ensure();
    this.beep(640, 0.04, 'square', 0.03, 880);
  }
};

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
function persistBest() {
  var n = homesFilled(G.homes) ? G.round : G.round - 1;
  if (n < 0) n = 0;
  if (G.best < n) {
    G.best = n;
    saveBest(G.best);
  }
  bestEl.textContent = String(G.best);
}

function loadMute() {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { return false; }
}

function hitStop(sec) {
  if (reduceMotion()) return;
  G.stop = Math.max(G.stop, sec);
}

function kick(mag) {
  if (reduceMotion()) return;
  G.shake = Math.max(G.shake, mag);
  G.kickY += mag * 0.015;
  kickTok += 1;
  stageEl.classList.remove('hop');
  void stageEl.offsetWidth;
  stageEl.classList.add('hop');
}

function dieShake() {
  if (reduceMotion()) return;
  stageEl.classList.remove('die');
  void stageEl.offsetWidth;
  stageEl.classList.add('die');
}

function screenFlash(rgb, a) {
  G.flash = Math.max(G.flash, a || 0.4);
  G.flashRgb = rgb;
}

function capArr(arr, n) {
  if (arr.length > n) arr.splice(0, arr.length - n);
}

function burst(x, y, n, rgb, spd, life, grav) {
  var i, ang, v;
  for (i = 0; i < n; i++) {
    ang = Math.random() * TAU;
    v = rand(spd * 0.25, spd);
    particles.push({
      x: x + rand(-0.12, 0.12),
      y: y + rand(-0.12, 0.12),
      vx: Math.cos(ang) * v,
      vy: Math.sin(ang) * v - rand(0, spd * 0.25),
      r: rand(0.05, 0.14),
      life: rand(life * 0.55, life),
      max: life,
      rgb: rgb,
      g: grav == null ? 3.4 : grav
    });
  }
  capArr(particles, 420);
}

function spark(x, y, rgb, n) {
  var i;
  for (i = 0; i < n; i++) {
    sparks.push({
      x: x, y: y,
      vx: rand(-2.4, 2.4),
      vy: rand(-3.2, 0.4),
      life: rand(0.12, 0.28),
      max: 0.28,
      rgb: rgb
    });
  }
  capArr(sparks, 80);
}

function ringAt(x, y, rgb) {
  rings.push({ x: x, y: y, r: 0.12, life: 0.32, rgb: rgb });
}

function floatText(x, y, text, rgb) {
  floats.push({ x: x, y: y, text: text, life: 0.7, rgb: rgb || [61, 255, 136] });
}

function toast(msg, warn, gold) {
  toastTok += 1;
  var id = toastTok;
  toastEl.textContent = msg;
  toastEl.classList.toggle('warn', !!warn);
  toastEl.classList.toggle('gold', !!gold);
  toastEl.classList.remove('hidden');
  setTimeout(function () {
    if (toastTok === id) toastEl.classList.add('hidden');
  }, 900);
}

function renderPips() {
  var html = '';
  var i;
  for (i = 0; i < LIVES; i++) {
    html += '<i class="pip ' + (i < G.lives ? 'on' : 'gone') + '"></i>';
  }
  pipsEl.innerHTML = html;
}

function flashScore(gained) {
  scoreEl.textContent = String(G.score);
  if (!gained) return;
  scoreBox.classList.remove('flash');
  void scoreBox.offsetWidth;
  scoreBox.classList.add('flash');
  scoreAdd.hidden = false;
  scoreAdd.textContent = '+' + gained;
  addTok += 1;
  var id = addTok;
  scoreAdd.style.animation = 'none';
  void scoreAdd.offsetWidth;
  scoreAdd.style.animation = 'addFloat 0.7s ease forwards';
  setTimeout(function () {
    if (addTok === id) scoreAdd.hidden = true;
  }, 700);
}

function syncCombo() {
  comboEl.textContent = '×' + Math.max(1, G.combo);
  if (G.combo >= 2) {
    comboBox.classList.remove('hot');
    void comboBox.offsetWidth;
    comboBox.classList.add('hot');
  }
}

function syncTimeBar() {
  var p = G.timeMax > 0 ? clamp(G.time / G.timeMax, 0, 1) : 0;
  if (G.mode !== 'play' && G.mode !== 'deadwait') p = 1;
  timeBar.style.transform = 'scaleX(' + p + ')';
  timeBar.classList.toggle('low', p < 0.28 && G.mode === 'play');
  timeBar.classList.toggle('dead', p <= 0);
}

function hudPlay() {
  scoreEl.textContent = String(G.score);
  roundEl.textContent = String(G.round);
  bestEl.textContent = String(G.best);
  syncCombo();
  renderPips();
  syncTimeBar();
  modeLabel.textContent = G.night ? '夜路' : '经典';
  modeLabel.classList.toggle('night', G.night);
  hintEl.textContent = (autoOn ? '托管中 · ' : '') + (G.night
    ? '夜路只剩车灯 · A 自动 · R 重开'
    : '方向键或滑动 · A 自动 · 水要踩木 · 龟会沉');
}

function showTitle() {
  G.mode = 'title';
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel';
  ovTitle.textContent = '蛙路';
  ovLead.textContent = '过马路过河，别被撞。填满五个家。';
  ovOps.textContent = '方向键或滑动起跳 · 点一下向前 · A 自动 · R 重开 · M 静音';
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
  hintEl.textContent = '方向键或滑动 · A 自动 · 车撞即死 · 水要踩木 · 龟会沉';
}

function showOver() {
  G.mode = 'over';
  persistBest();
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel lose';
  ovTitle.textContent = '命尽';
  ovLead.textContent = '第 ' + G.round + ' 轮 · ' + G.score + ' 分 · 连跳最高 ×' + G.maxCombo +
    (G.why ? ' · ' + whyText(G.why) : '');
  ovOps.textContent = 'R 或「再来」重开 · A 自动 · 顶栏重开随时可用';
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
  ovRetry.focus();
}

function whyText(w) {
  if (w === 'car') return '被撞了';
  if (w === 'water') return '落水了';
  if (w === 'dive') return '龟沉了';
  if (w === 'edge') return '漂走了';
  if (w === 'time') return '超时了';
  if (w === 'bank') return '撞岸了';
  return '';
}

function resetFx() {
  particles.length = 0;
  sparks.length = 0;
  floats.length = 0;
  rings.length = 0;
  G.stop = 0;
  G.shake = 0;
  G.kickX = 0;
  G.kickY = 0;
  G.flash = 0;
}

function startRun(kind) {
  G.kind = kind;
  G.night = kind === 'night';
  G.mode = 'play';
  G.clock = 0;
  G.round = 1;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  G.maxCombo = 0;
  G.timeMax = timeLimit(1);
  G.time = G.timeMax;
  G.homes = emptyHomes();
  G.lanes = buildLanes(1);
  G.frog = spawnFrog();
  G.pending = -1;
  G.lock = 0;
  G.fly = -1;
  G.flyT = 0;
  G.flyCd = rand(6, 11);
  G.tickWarn = 0;
  G.why = '';
  autoPlan = null;
  autoMs = 0;
  resetFx();
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  panelEl.className = 'panel';
  audio.start();
  hudPlay();
  toast(G.night ? '夜路' : '起跳', false, !G.night);
  canvas.focus({ preventScroll: true });
}

function addScore(n, x, y, label) {
  if (n <= 0) return;
  G.score += n;
  flashScore(n);
  if (x != null) floatText(x, y - 0.35, label || ('+' + n), [61, 255, 136]);
}

function tryHop(dir) {
  var f, d, dest, row, gained, hz;
  if (G.mode !== 'play') return;
  if (G.lock > 0) return;
  f = G.frog;
  if (f.dead) return;
  if (f.hopT < 1) {
    G.pending = dir;
    return;
  }
  d = DIR_XY[dir];
  dest = hopTarget(f.x, f.y, d.dx, d.dy, G.homes);
  if (!dest) {
    audio.ui();
    f.squash = 0.82;
    return;
  }
  f.visFromX = visX();
  f.visFromY = visY();
  f.x = dest.x;
  f.y = dest.y;
  f.dir = dir;
  f.hopT = reduceMotion() ? 1 : 0;
  f.squash = 0.62;
  G.pending = -1;

  if (d.dy < 0) {
    G.combo += 1;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    gained = HOP_SCORE * G.combo;
    addScore(gained, f.x, f.y, G.combo >= 2 ? ('+' + gained) : null);
    syncCombo();
    if (G.combo === 3 || G.combo === 6 || G.combo === 10) {
      audio.combo(G.combo);
      toast(G.combo >= 10 ? '连跳 ×' + G.combo : '连跳', false, true);
    }
  } else if (d.dy > 0) {
    G.combo = 0;
    syncCombo();
  }

  audio.hop(G.combo);
  hitStop(0.036);
  kick(2.4);
  row = frogRow(f.y);
  if (isRiver(row)) {
    burst(f.x, f.y, 10, [0, 240, 255], 2.4, 0.32, 1.2);
    ringAt(f.x, f.y, [0, 240, 255]);
    audio.landWater();
  } else if (row === HOME_ROW) {
    /* handled in landHome */
  } else {
    burst(f.x, f.y, 8, [61, 255, 136], 2.1, 0.28, 2.6);
    spark(f.x, f.y, [232, 255, 240], 5);
    audio.landRoad();
  }

  if (dest.home >= 0) {
    landHome(dest.home);
    return;
  }
  hz = hazardAt(f.x, f.y, G.lanes, G.clock);
  if (hz) kill(hz);
}

function visX() {
  var f = G.frog;
  var k;
  if (f.hopT >= 1) return f.x;
  k = 1 - (1 - f.hopT) * (1 - f.hopT);
  return lerp(f.visFromX, f.x, k);
}
function visY() {
  var f = G.frog;
  var k, arc;
  if (f.hopT >= 1) return f.y;
  k = 1 - (1 - f.hopT) * (1 - f.hopT);
  arc = Math.sin(f.hopT * Math.PI) * 0.38;
  return lerp(f.visFromY, f.y, k) - arc;
}

function landHome(idx) {
  var f = G.frog;
  var leftover = Math.max(0, G.time);
  var gained = HOME_SCORE + Math.floor(leftover * TIME_SCORE) + G.combo * 15;
  var flyHit = G.fly === idx;
  G.homes[idx] = true;
  if (flyHit) {
    gained += FLY_SCORE;
    G.fly = -1;
    G.flyT = 0;
    G.flyCd = rand(7, 13);
    audio.fly();
    floatText(f.x, f.y - 0.7, '蝇 +' + FLY_SCORE, [255, 227, 107]);
  }
  addScore(gained, f.x, f.y, '+' + gained);
  burst(f.x, f.y, 28, [61, 255, 136], 3.6, 0.55, 1.4);
  burst(f.x, f.y, 12, [255, 227, 107], 2.8, 0.45, 0.8);
  spark(f.x, f.y, [232, 255, 244], 10);
  ringAt(f.x, f.y, [61, 255, 136]);
  audio.home();
  hitStop(0.07);
  kick(6);
  screenFlash([61, 255, 136], 0.28);
  stageEl.classList.remove('home');
  void stageEl.offsetWidth;
  stageEl.classList.add('home');
  persistBest();

  if (homesFilled(G.homes)) {
    clearRound();
    return;
  }
  toast('到家了', false, true);
  G.lock = 0.38;
  G.frog.dead = true;
}

function clearRound() {
  var bonus = ROUND_BONUS * G.round;
  addScore(bonus, 6.5, 2.5, '清轮 +' + bonus);
  toast('第 ' + G.round + ' 轮清了', false, true);
  audio.round();
  hitStop(0.08);
  screenFlash([255, 227, 107], 0.35);
  burst(6.5, 0.5, 40, [255, 227, 107], 4.2, 0.7, 1.1);
  persistBest();
  G.round += 1;
  G.homes = emptyHomes();
  G.lanes = buildLanes(G.round);
  G.timeMax = timeLimit(G.round);
  G.lock = 0.55;
  G.frog.dead = true;
  G.fly = -1;
  G.flyCd = rand(5, 10);
  roundEl.textContent = String(G.round);
}

function kill(why) {
  var f = G.frog;
  var rgb;
  if (f.dead || G.mode !== 'play') return;
  f.dead = true;
  f.why = why;
  G.why = why;
  G.combo = 0;
  syncCombo();
  G.lives -= 1;
  renderPips();
  hitStop(0.08);
  dieShake();
  G.shake = Math.max(G.shake, 8);

  if (why === 'car') {
    rgb = [255, 61, 184];
    burst(f.x, f.y, 26, rgb, 4.2, 0.5, 3.2);
    burst(f.x, f.y, 8, [255, 227, 107], 2.4, 0.3, 1);
    audio.car();
    screenFlash(rgb, 0.4);
  } else if (why === 'time') {
    rgb = [255, 227, 107];
    burst(f.x, f.y, 16, rgb, 2.4, 0.4, 1.6);
    audio.time();
    screenFlash(rgb, 0.3);
  } else {
    rgb = [0, 240, 255];
    burst(f.x, f.y, 22, rgb, 2.8, 0.48, 1.2);
    burst(f.x, f.y, 10, [61, 255, 136], 1.8, 0.4, 0.6);
    ringAt(f.x, f.y, rgb);
    audio.water();
    screenFlash(rgb, 0.32);
  }
  toast(whyText(why), true, false);
  G.lock = 0.7;
  G.mode = 'deadwait';
}

function respawnOrOver() {
  if (G.lives <= 0) {
    audio.over();
    showOver();
    return;
  }
  G.mode = 'play';
  G.frog = spawnFrog();
  G.timeMax = timeLimit(G.round);
  G.time = G.timeMax;
  G.pending = -1;
  G.lock = 0;
  G.tickWarn = 0;
  autoPlan = null;
  autoMs = 0;
  syncTimeBar();
}

function stepFly(dt) {
  var empty, i;
  if (G.mode !== 'play') return;
  if (G.fly >= 0) {
    G.flyT -= dt;
    if (G.flyT <= 0) {
      G.fly = -1;
      G.flyCd = rand(5, 11);
    }
    return;
  }
  G.flyCd -= dt;
  if (G.flyCd > 0) return;
  empty = [];
  for (i = 0; i < 5; i++) if (!G.homes[i]) empty.push(i);
  if (!empty.length) {
    G.flyCd = 4;
    return;
  }
  G.fly = empty[(Math.random() * empty.length) | 0];
  G.flyT = rand(5.5, 8.5);
}

function stepWorld(dt) {
  var f, row, ride, hz;

  if (G.mode === 'title') {
    G.clock += dt;
    return;
  }
  if (G.mode === 'over') {
    G.clock += dt * 0.35;
    return;
  }

  G.clock += dt;
  f = G.frog;
  if (f.hopT < 1) {
    f.hopT += dt / 0.092;
    if (f.hopT >= 1) f.hopT = 1;
  }
  f.squash += (1 - f.squash) * Math.min(1, dt * 12);

  if (G.lock > 0) {
    G.lock -= dt;
    if (G.lock <= 0) {
      G.lock = 0;
      if (G.frog.dead) respawnOrOver();
    }
    return;
  }

  if (G.mode !== 'play') return;

  if (f.hopT >= 1 && G.pending >= 0 && !f.dead) {
    tryHop(G.pending);
    return;
  }

  if (f.dead) return;

  G.time -= dt;
  if (G.time <= 0) {
    G.time = 0;
    kill('time');
    syncTimeBar();
    return;
  }
  if (G.time < 5) {
    G.tickWarn -= dt;
    if (G.tickWarn <= 0) {
      G.tickWarn += 1;
      audio.warn();
    }
  } else {
    G.tickWarn = 0;
  }
  syncTimeBar();

  row = frogRow(f.y);
  if (isRiver(row)) {
    ride = findRide(f.x, row, G.lanes, G.clock);
    if (ride) f.x += ride.lane.dir * ride.lane.speed * dt;
  }

  if (carriedOff(f.x)) {
    kill('edge');
    return;
  }
  if (f.hopT < 1) {
    if (isRoad(row) && carHit(f.x, f.y, G.lanes, G.clock)) kill('car');
    stepFly(dt);
    return;
  }
  hz = hazardAt(f.x, f.y, G.lanes, G.clock);
  if (hz) kill(hz);
  stepFly(dt);
  if (autoOn) tickAuto(dt);
}

function stepFx(dt) {
  var i, p;
  for (i = particles.length - 1; i >= 0; i--) {
    p = particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.g * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (i = sparks.length - 1; i >= 0; i--) {
    p = sparks[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.life <= 0) sparks.splice(i, 1);
  }
  for (i = floats.length - 1; i >= 0; i--) {
    p = floats[i];
    p.life -= dt;
    p.y -= dt * 0.7;
    if (p.life <= 0) floats.splice(i, 1);
  }
  for (i = rings.length - 1; i >= 0; i--) {
    p = rings[i];
    p.life -= dt;
    p.r += dt * 1.6;
    if (p.life <= 0) rings.splice(i, 1);
  }
  G.shake *= 0.86;
  G.kickX *= 0.84;
  G.kickY *= 0.84;
  if (G.shake < 0.04) G.shake = 0;
  if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
}

/* ---- draw ---- */
function resize() {
  var w = stageEl.clientWidth;
  var h = stageEl.clientHeight;
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

function layout() {
  var pad = Math.max(10, Math.min(cssW, cssH) * 0.03);
  var rows = ROWS + 0.52;
  var cell = Math.min((cssW - pad * 2) / COLS, (cssH - pad * 2) / rows);
  var w = cell * COLS;
  var h = cell * rows;
  L.x = (cssW - w) / 2;
  L.y = (cssH - h) / 2;
  L.cell = cell;
  L.w = w;
  L.h = h;
}

function sx(x) { return (L.x + x * L.cell) * dpr; }
function sy(y) { return (L.y + y * L.cell) * dpr; }
function sc(n) { return n * L.cell * dpr; }

function rr(c, x, y, w, h, r) {
  var m = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + m, y);
  c.arcTo(x + w, y, x + w, y + h, m);
  c.arcTo(x + w, y + h, x, y + h, m);
  c.arcTo(x, y + h, x, y, m);
  c.arcTo(x, y, x + w, y, m);
  c.closePath();
}

function drawGrass(c, row, night) {
  var y = sy(row);
  var h = sc(1);
  var x = sx(0);
  var w = sc(COLS);
  var g;
  g = c.createLinearGradient(0, y, 0, y + h);
  if (night) {
    g.addColorStop(0, '#0a1c12');
    g.addColorStop(1, '#07140e');
  } else {
    g.addColorStop(0, row === START_ROW ? '#10361c' : '#0e2e18');
    g.addColorStop(1, row === START_ROW ? '#0a2414' : '#081c10');
  }
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  c.fillStyle = night ? 'rgba(61,255,136,0.04)' : 'rgba(61,255,136,0.07)';
  var i, px, py;
  for (i = 0; i < COLS * 3; i++) {
    px = sx((i * 2.17 + row * 0.4) % COLS);
    py = y + ((i * 13) % (h - 2));
    c.fillRect(px, py, sc(0.08), sc(0.16));
  }
  c.fillStyle = 'rgba(0,240,255,0.12)';
  c.fillRect(x, y, w, Math.max(1, sc(0.03)));
  c.fillRect(x, y + h - Math.max(1, sc(0.03)), w, Math.max(1, sc(0.03)));
}

function drawRoad(c, row, night) {
  var y = sy(row);
  var h = sc(1);
  var x = sx(0);
  var w = sc(COLS);
  c.fillStyle = night ? '#07080e' : (row % 2 ? '#14161f' : '#10121a');
  c.fillRect(x, y, w, h);
  c.strokeStyle = night ? 'rgba(255,227,107,0.12)' : 'rgba(255,227,107,0.28)';
  c.lineWidth = Math.max(1, sc(0.03));
  c.setLineDash([sc(0.28), sc(0.22)]);
  c.beginPath();
  c.moveTo(x + sc(0.1), y + h * 0.5);
  c.lineTo(x + w - sc(0.1), y + h * 0.5);
  c.stroke();
  c.setLineDash([]);
  c.fillStyle = 'rgba(255,255,255,0.06)';
  c.fillRect(x, y, w, Math.max(1, sc(0.025)));
}

function drawRiver(c, row, night) {
  var y = sy(row);
  var h = sc(1);
  var x = sx(0);
  var w = sc(COLS);
  var g = c.createLinearGradient(0, y, 0, y + h);
  if (night) {
    g.addColorStop(0, '#031018');
    g.addColorStop(1, '#020c14');
  } else {
    g.addColorStop(0, row % 2 ? '#08344a' : '#072c40');
    g.addColorStop(1, row % 2 ? '#042030' : '#031c2c');
  }
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  c.strokeStyle = night ? 'rgba(0,240,255,0.08)' : 'rgba(0,240,255,0.18)';
  c.lineWidth = Math.max(1, sc(0.025));
  var i, yy;
  for (i = 0; i < 3; i++) {
    yy = y + h * (0.22 + i * 0.28);
    c.beginPath();
    c.moveTo(x, yy);
    var k, px;
    for (k = 0; k <= COLS; k++) {
      px = sx(k);
      c.lineTo(px, yy + Math.sin(G.clock * 2.2 + k * 0.9 + row) * sc(0.06));
    }
    c.stroke();
  }
}

function drawHomeRow(c, night) {
  var y = sy(0);
  var h = sc(1);
  var x = sx(0);
  var w = sc(COLS);
  var g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, night ? '#06140c' : '#0c2816');
  g.addColorStop(1, night ? '#03100a' : '#071c10');
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  var i, col, px, occupied, flyHere, pad;
  for (i = 0; i < COLS; i++) {
    if (isHomePad(i, 0)) continue;
    px = sx(i);
    c.fillStyle = night ? '#071a10' : '#0a2414';
    rr(c, px + sc(0.04), y + sc(0.04), sc(0.92), h - sc(0.08), sc(0.12));
    c.fill();
    c.fillStyle = night ? 'rgba(61,255,136,0.08)' : 'rgba(61,255,136,0.16)';
    c.fill();
  }
  for (i = 0; i < HOME_COLS.length; i++) {
    col = HOME_COLS[i];
    px = sx(col);
    occupied = G.homes[i];
    flyHere = G.fly === i;
    pad = sc(0.08);
    c.fillStyle = night ? '#041820' : '#0a3040';
    rr(c, px + pad, y + pad, sc(1) - pad * 2, h - pad * 2, sc(0.18));
    c.fill();
    c.strokeStyle = occupied ? 'rgba(61,255,136,0.85)' : (flyHere ? 'rgba(255,227,107,0.8)' : 'rgba(0,240,255,0.35)');
    c.lineWidth = Math.max(1, sc(0.045));
    c.stroke();
    c.fillStyle = occupied ? 'rgba(61,255,136,0.22)' : 'rgba(0,240,255,0.08)';
    c.fill();
    if (occupied) drawFrogAt(c, col + 0.5, 0.52, 0, 0.9, false, 1);
    else {
      c.fillStyle = night ? 'rgba(61,255,136,0.18)' : 'rgba(61,255,136,0.35)';
      c.beginPath();
      c.ellipse(sx(col + 0.5), sy(0.62), sc(0.28), sc(0.12), 0, 0, TAU);
      c.fill();
      if (flyHere) drawFly(c, col + 0.5, 0.38);
    }
  }
}

function drawFly(c, x, y) {
  var px = sx(x);
  var py = sy(y + Math.sin(G.clock * 10) * 0.04);
  c.fillStyle = '#ffe36b';
  c.beginPath();
  c.arc(px, py, sc(0.1), 0, TAU);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.7)';
  c.beginPath();
  c.ellipse(px - sc(0.1), py - sc(0.04), sc(0.08), sc(0.04), -0.4, 0, TAU);
  c.ellipse(px + sc(0.1), py - sc(0.04), sc(0.08), sc(0.04), 0.4, 0, TAU);
  c.fill();
}

function drawLog(c, x, y, w, night) {
  var px = sx(x);
  var py = sy(y + 0.16);
  var pw = sc(w);
  var ph = sc(0.68);
  rr(c, px, py, pw, ph, sc(0.22));
  c.fillStyle = night ? '#2a1c12' : '#6a4324';
  c.fill();
  c.strokeStyle = night ? 'rgba(255,180,90,0.25)' : 'rgba(255,210,140,0.35)';
  c.lineWidth = Math.max(1, sc(0.035));
  c.stroke();
  c.fillStyle = night ? 'rgba(61,255,136,0.08)' : 'rgba(61,255,136,0.16)';
  rr(c, px + sc(0.12), py + sc(0.1), pw - sc(0.24), sc(0.16), sc(0.08));
  c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.25)';
  c.beginPath();
  c.moveTo(px + sc(0.4), py + sc(0.12));
  c.lineTo(px + sc(0.4), py + ph - sc(0.12));
  c.moveTo(px + pw - sc(0.4), py + sc(0.12));
  c.lineTo(px + pw - sc(0.4), py + ph - sc(0.12));
  c.stroke();
}

function drawTurtle(c, x, y, n, sub, night, dir) {
  var i, cx, cy, s, hide, hx, d;
  hide = clamp(sub, 0, 1);
  s = 1 - hide * 0.72;
  d = dir >= 0 ? 1 : -1;
  for (i = 0; i < n; i++) {
    cx = sx(x + 0.5 + i * 1.0);
    cy = sy(y + 0.5 + hide * 0.18);
    c.globalAlpha = 1 - hide * 0.75;
    c.fillStyle = night ? '#14281c' : '#3a6a28';
    c.beginPath();
    c.ellipse(cx - d * sc(0.06), cy + sc(0.14), sc(0.16 * s), sc(0.07 * s), 0, 0, TAU);
    c.ellipse(cx + d * sc(0.08), cy + sc(0.14), sc(0.14 * s), sc(0.06 * s), 0, 0, TAU);
    c.fill();
    hx = cx + d * sc(0.3 * s);
    c.fillStyle = night ? '#1a3c24' : '#4a8a3a';
    c.beginPath();
    c.ellipse(hx, cy + sc(0.02), sc(0.12 * s), sc(0.09 * s), 0, 0, TAU);
    c.fill();
    c.fillStyle = night ? '#0c2818' : '#1c5a30';
    c.beginPath();
    c.ellipse(cx, cy, sc(0.34 * s), sc(0.26 * s), 0, 0, TAU);
    c.fill();
    c.strokeStyle = night ? 'rgba(180, 210, 90, 0.28)' : 'rgba(210, 230, 120, 0.45)';
    c.lineWidth = Math.max(1, sc(0.035));
    c.stroke();
    c.strokeStyle = night ? 'rgba(61,255,136,0.18)' : 'rgba(80,140,50,0.45)';
    c.beginPath();
    c.ellipse(cx, cy, sc(0.18 * s), sc(0.13 * s), 0, 0, TAU);
    c.moveTo(cx, cy - sc(0.13 * s));
    c.lineTo(cx, cy + sc(0.13 * s));
    c.moveTo(cx - sc(0.16 * s), cy);
    c.lineTo(cx + sc(0.16 * s), cy);
    c.stroke();
    if (hide < 0.55) {
      c.fillStyle = '#0a140e';
      c.beginPath();
      c.arc(hx + d * sc(0.04), cy - sc(0.01), sc(0.03 * s), 0, TAU);
      c.fill();
    }
    c.globalAlpha = 1;
  }
}

function drawCar(c, x, y, w, pal, dir, truck, night) {
  var px = sx(x);
  var py = sy(y + 0.18);
  var pw = sc(w);
  var ph = sc(0.64);
  var rgb = PALS[pal % PALS.length];
  var body = night ? 'rgba(' + rgb[0] * 0.18 + ',' + rgb[1] * 0.18 + ',' + rgb[2] * 0.2 + ',0.95)' : rgba(rgb, 0.95);
  rr(c, px, py, pw, ph, sc(0.16));
  c.fillStyle = body;
  c.fill();
  c.strokeStyle = night ? rgba(rgb, 0.35) : 'rgba(255,255,255,0.22)';
  c.lineWidth = Math.max(1, sc(0.03));
  c.stroke();
  c.fillStyle = night ? 'rgba(180,220,255,0.18)' : 'rgba(20,24,40,0.45)';
  rr(c, px + sc(0.18), py + sc(0.1), pw - sc(0.36), sc(0.22), sc(0.06));
  c.fill();
  var hx = dir > 0 ? px + pw - sc(0.08) : px + sc(0.08);
  var tx = dir > 0 ? px + sc(0.1) : px + pw - sc(0.1);
  c.fillStyle = night ? '#fff6c8' : '#ffe9a0';
  c.beginPath();
  c.arc(hx, py + sc(0.18), sc(0.07), 0, TAU);
  c.arc(hx, py + ph - sc(0.18), sc(0.07), 0, TAU);
  c.fill();
  c.fillStyle = '#ff4d6d';
  c.beginPath();
  c.arc(tx, py + sc(0.18), sc(0.055), 0, TAU);
  c.arc(tx, py + ph - sc(0.18), sc(0.055), 0, TAU);
  c.fill();
  if (truck && !night) {
    c.fillStyle = 'rgba(0,0,0,0.18)';
    c.fillRect(px + pw * 0.38, py + sc(0.08), Math.max(1, sc(0.04)), ph - sc(0.16));
  }
}

function drawHeadlights(c) {
  var i, j, k, lane, item, xs, xx, dir, hx, hy, beam, grd;
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (i = 0; i < G.lanes.length; i++) {
    lane = G.lanes[i];
    if (lane.kind !== 'road') continue;
    dir = lane.dir;
    for (j = 0; j < lane.items.length; j++) {
      item = lane.items[j];
      xs = itemCopies(lane, item, G.clock);
      for (k = 0; k < xs.length; k++) {
        xx = xs[k];
        hx = sx(dir > 0 ? xx + item.w : xx);
        hy = sy(lane.row + 0.5);
        beam = sc(3.4);
        grd = c.createRadialGradient(hx, hy, sc(0.08), hx + dir * beam * 0.55, hy, beam);
        grd.addColorStop(0, 'rgba(255, 244, 180, 0.55)');
        grd.addColorStop(0.35, 'rgba(255, 220, 120, 0.16)');
        grd.addColorStop(1, 'rgba(255, 200, 80, 0)');
        c.fillStyle = grd;
        c.beginPath();
        c.moveTo(hx, hy - sc(0.18));
        c.lineTo(hx + dir * beam, hy - sc(1.05));
        c.lineTo(hx + dir * beam, hy + sc(1.05));
        c.lineTo(hx, hy + sc(0.18));
        c.closePath();
        c.fill();
      }
    }
  }
  /* frog glow + homes */
  grd = c.createRadialGradient(sx(visX()), sy(visY()), sc(0.1), sx(visX()), sy(visY()), sc(1.4));
  grd.addColorStop(0, 'rgba(61,255,136,0.42)');
  grd.addColorStop(1, 'rgba(61,255,136,0)');
  c.fillStyle = grd;
  c.beginPath();
  c.arc(sx(visX()), sy(visY()), sc(1.4), 0, TAU);
  c.fill();
  for (i = 0; i < HOME_COLS.length; i++) {
    hx = sx(HOME_COLS[i] + 0.5);
    hy = sy(0.5);
    grd = c.createRadialGradient(hx, hy, sc(0.1), hx, hy, sc(0.9));
    grd.addColorStop(0, G.homes[i] ? 'rgba(61,255,136,0.28)' : 'rgba(0,240,255,0.16)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = grd;
    c.beginPath();
    c.arc(hx, hy, sc(0.9), 0, TAU);
    c.fill();
  }
  c.restore();
}

function drawFrogAt(c, x, y, dir, squash, dead, alpha) {
  var px = sx(x);
  var py = sy(y);
  c.save();
  c.translate(px, py);
  c.rotate(dir * Math.PI / 2);
  c.scale(1, squash || 1);
  c.globalAlpha = alpha == null ? 1 : alpha;
  c.fillStyle = dead ? '#6a3058' : '#3dff88';
  c.beginPath();
  c.ellipse(0, sc(0.04), sc(0.34), sc(0.3), 0, 0, TAU);
  c.fill();
  c.fillStyle = dead ? '#4a203c' : '#2ad06e';
  c.beginPath();
  c.ellipse(-sc(0.22), sc(0.18), sc(0.14), sc(0.1), -0.4, 0, TAU);
  c.ellipse(sc(0.22), sc(0.18), sc(0.14), sc(0.1), 0.4, 0, TAU);
  c.fill();
  c.fillStyle = dead ? '#3dff88' : '#b8ffd0';
  c.beginPath();
  c.ellipse(0, -sc(0.02), sc(0.18), sc(0.14), 0, 0, TAU);
  c.fill();
  c.fillStyle = dead ? '#ff3db8' : '#3dff88';
  c.beginPath();
  c.arc(-sc(0.16), -sc(0.2), sc(0.13), 0, TAU);
  c.arc(sc(0.16), -sc(0.2), sc(0.13), 0, TAU);
  c.fill();
  c.fillStyle = '#07140e';
  c.beginPath();
  c.arc(-sc(0.16), -sc(0.22), sc(0.055), 0, TAU);
  c.arc(sc(0.16), -sc(0.22), sc(0.055), 0, TAU);
  c.fill();
  c.fillStyle = '#fff';
  c.beginPath();
  c.arc(-sc(0.14), -sc(0.24), sc(0.02), 0, TAU);
  c.arc(sc(0.18), -sc(0.24), sc(0.02), 0, TAU);
  c.fill();
  c.restore();
}

function drawTimeStrip(c) {
  var x = sx(0);
  var y = sy(ROWS);
  var w = sc(COLS);
  var h = sc(0.48);
  var p = G.mode === 'play' || G.mode === 'deadwait' ? clamp(G.time / G.timeMax, 0, 1) : 1;
  rr(c, x, y + sc(0.06), w, h - sc(0.08), sc(0.12));
  c.fillStyle = 'rgba(8,6,18,0.85)';
  c.fill();
  c.strokeStyle = 'rgba(61,255,136,0.25)';
  c.lineWidth = Math.max(1, sc(0.025));
  c.stroke();
  if (p > 0) {
    c.save();
    c.beginPath();
    rr(c, x + sc(0.06), y + sc(0.12), (w - sc(0.12)) * p, h - sc(0.2), sc(0.08));
    c.clip();
    c.fillStyle = p < 0.28 ? '#ff3db8' : (p < 0.5 ? '#ffe36b' : '#3dff88');
    c.fillRect(x, y, w, h);
    c.restore();
  }
  c.fillStyle = 'rgba(246,243,255,0.7)';
  c.font = Math.max(9, sc(0.22) | 0) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText('TIME', x + sc(0.2), y + h * 0.52);
}

function drawLanes(c, night) {
  var i, j, k, lane, item, xs, xx, sub;
  for (i = 0; i < G.lanes.length; i++) {
    lane = G.lanes[i];
    for (j = 0; j < lane.items.length; j++) {
      item = lane.items[j];
      xs = itemCopies(lane, item, G.clock);
      for (k = 0; k < xs.length; k++) {
        xx = xs[k];
        if (item.kind === 'log') drawLog(c, xx, lane.row, item.w, night);
        else if (item.kind === 'turtle') {
          sub = turtleSub(G.clock + (item.phase0 || 0), item.dive ? item.cycle : null);
          drawTurtle(c, xx, lane.row, item.n || 2, sub, night, lane.dir);
        } else {
          drawCar(c, xx, lane.row, item.w, item.pal || 0, lane.dir, item.kind === 'truck', night);
        }
      }
    }
  }
}

function drawFx(c) {
  var i, p, a;
  for (i = 0; i < rings.length; i++) {
    p = rings[i];
    a = p.life / 0.32;
    c.strokeStyle = rgba(p.rgb, a * 0.7);
    c.lineWidth = Math.max(1, sc(0.04));
    c.beginPath();
    c.arc(sx(p.x), sy(p.y), sc(p.r), 0, TAU);
    c.stroke();
  }
  for (i = 0; i < particles.length; i++) {
    p = particles[i];
    a = clamp(p.life / p.max, 0, 1);
    c.fillStyle = rgba(p.rgb, a);
    c.beginPath();
    c.arc(sx(p.x), sy(p.y), sc(p.r * (0.6 + a * 0.4)), 0, TAU);
    c.fill();
  }
  for (i = 0; i < sparks.length; i++) {
    p = sparks[i];
    a = p.life / p.max;
    c.strokeStyle = rgba(p.rgb, a);
    c.lineWidth = Math.max(1, sc(0.035));
    c.beginPath();
    c.moveTo(sx(p.x), sy(p.y));
    c.lineTo(sx(p.x - p.vx * 0.04), sy(p.y - p.vy * 0.04));
    c.stroke();
  }
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  for (i = 0; i < floats.length; i++) {
    p = floats[i];
    a = clamp(p.life / 0.7, 0, 1);
    c.fillStyle = rgba(p.rgb, a);
    c.font = '700 ' + Math.max(11, sc(0.32) | 0) + 'px "Segoe UI","PingFang SC",sans-serif';
    c.fillText(p.text, sx(p.x), sy(p.y));
  }
}

function draw() {
  var c = ctx;
  var night = G.night;
  var f = G.frog;
  var shx = 0;
  var shy = 0;
  var i;

  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = '#03010a';
  c.fillRect(0, 0, cssW, cssH);

  layout();

  if (G.shake > 0 && !reduceMotion()) {
    shx = (Math.random() - 0.5) * G.shake * 0.7;
    shy = (Math.random() - 0.5) * G.shake * 0.7;
  }
  c.save();
  c.translate(shx + G.kickX, shy + G.kickY);

  /* board bg */
  rr(c, sx(0) - sc(0.08), sy(0) - sc(0.08), sc(COLS) + sc(0.16), sc(ROWS + 0.52) + sc(0.16), sc(0.22));
  c.fillStyle = '#05070c';
  c.fill();
  c.save();
  c.clip();

  drawHomeRow(c, night);
  for (i = 1; i <= 4; i++) drawRiver(c, i, night);
  drawGrass(c, MEDIAN_ROW, night);
  for (i = 6; i <= 9; i++) drawRoad(c, i, night);
  drawGrass(c, START_ROW, night);
  drawLanes(c, night);

  if (night) {
    c.fillStyle = 'rgba(2, 6, 16, 0.62)';
    c.fillRect(sx(0), sy(0), sc(COLS), sc(ROWS + 0.52));
    drawHeadlights(c);
    for (i = 0; i < HOME_COLS.length; i++) {
      if (G.homes[i]) drawFrogAt(c, HOME_COLS[i] + 0.5, 0.52, 0, 0.9, false, 1);
      else if (G.fly === i) drawFly(c, HOME_COLS[i] + 0.5, 0.38);
    }
  }

  drawFrogAt(
    c,
    visX(),
    visY(),
    f.dir,
    f.squash * (f.dead ? 0.55 : 1),
    f.dead,
    f.dead ? 0.85 : 1
  );

  drawFx(c);
  c.restore();
  drawTimeStrip(c);

  if (G.flash > 0) {
    c.fillStyle = rgba(G.flashRgb, G.flash);
    c.fillRect(sx(0), sy(0), sc(COLS), sc(ROWS + 0.52));
  }

  c.restore();
}

/* ---- autoplay ---- */
function holdForSpeed() {
  return 0.1 + AUTO_DELAY[autoSpeed] / 1000;
}

function tickAuto(dt) {
  var plan, check, surv;
  if (!autoOn || G.mode !== 'play') return;
  if (G.lock > 0 || G.frog.dead) return;
  if (G.frog.hopT < 1) return;
  autoMs += dt;
  surv = survivalTime(G.frog.x, G.frog.y, G.clock, G.lanes, 0.16);
  if (autoMs < AUTO_DELAY[autoSpeed] / 1000 && surv >= 0.16) return;
  if (!autoPlan) {
    plan = pickAutoHop(G.frog.x, G.frog.y, G.clock, G.homes, G.lanes, G.fly, holdForSpeed());
    if (!plan) return;
    autoPlan = { dir: plan.dir, at: G.clock + plan.wait };
  }
  if (G.clock + 1e-4 < autoPlan.at && surv >= 0.14) return;
  check = simHop(G.frog.x, G.frog.y, autoPlan.dir, G.clock, G.homes, G.lanes);
  if (!check || check.dead) {
    autoPlan = null;
    return;
  }
  tryHop(autoPlan.dir);
  autoPlan = null;
  autoMs = 0;
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

function toggleAuto() {
  autoOn = !autoOn;
  autoPlan = null;
  autoMs = 0;
  G.pending = -1;
  syncAutoUi();
  if (autoOn) {
    audio.ensure();
    if (G.mode === 'title') startRun('classic');
  }
  if (G.mode === 'play' || G.mode === 'deadwait') hudPlay();
}

function setAutoSpeed(n) {
  if (n < 1 || n > 4 || !isFinite(n)) n = 3;
  autoSpeed = n;
  saveAutoSpeed(autoSpeed);
  syncSpeedUi();
}

/* ---- input ---- */
var swipe = { on: false, x: 0, y: 0, id: 0 };

function playingInput() {
  return G.mode === 'play' && G.lock <= 0 && !G.frog.dead && !autoOn;
}

function onDir(dir) {
  audio.ensure();
  if (autoOn) return;
  if (G.mode === 'title') return;
  if (G.mode === 'over') return;
  tryHop(dir);
}

function restart() {
  audio.ensure();
  if (G.mode === 'title') startRun('classic');
  else startRun(G.night ? 'night' : 'classic');
}

function onKey(e) {
  var dir;
  if (e.code === 'KeyM') {
    e.preventDefault();
    audio.setMuted(!audio.muted);
    return;
  }
  if (e.code === 'KeyR') {
    e.preventDefault();
    restart();
    return;
  }
  if (e.code === 'KeyA' || e.key === 'a' || e.key === 'A') {
    if (e.repeat) return;
    e.preventDefault();
    toggleAuto();
    return;
  }
  if (e.target === speedEl) return;
  if (G.mode === 'title') {
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Digit1') {
      e.preventDefault();
      startRun('classic');
    } else if (e.code === 'Digit2' || e.code === 'KeyN') {
      e.preventDefault();
      startRun('night');
    }
    return;
  }
  if (G.mode === 'over') {
    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      restart();
    }
    return;
  }
  dir = KEY_DIR[e.code];
  if (dir == null) return;
  e.preventDefault();
  if (autoOn) return;
  onDir(dir);
}

function ptrPos(e) {
  var r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function onPtrDown(e) {
  audio.ensure();
  if (e.button != null && e.button !== 0) return;
  if (G.mode === 'title' || G.mode === 'over') return;
  swipe.on = true;
  swipe.x = e.clientX;
  swipe.y = e.clientY;
  swipe.id = e.pointerId;
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
}

function onPtrUp(e) {
  var dx, dy, adx, ady;
  if (!swipe.on) return;
  if (e.pointerId != null && e.pointerId !== swipe.id && swipe.id) return;
  swipe.on = false;
  dx = e.clientX - swipe.x;
  dy = e.clientY - swipe.y;
  adx = Math.abs(dx);
  ady = Math.abs(dy);
  if (adx < SWIPE_MIN && ady < SWIPE_MIN) {
    if (playingInput()) tryHop(0);
    return;
  }
  if (adx > ady) onDir(dx > 0 ? 1 : 3);
  else onDir(dy > 0 ? 2 : 0);
}

function onPtrCancel() {
  swipe.on = false;
}

/* ---- loop ---- */
function frame(ts) {
  var dt, step, acc;
  if (!lastTs) lastTs = ts;
  dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (dt < 0) dt = 0;
  if (dt > 0.05) dt = 0.05;
  if (hidden) {
    draw();
    requestAnimationFrame(frame);
    return;
  }
  acc = dt;
  while (acc > 0) {
    step = acc > 1 / 60 ? 1 / 60 : acc;
    acc -= step;
    if (G.stop > 0 && !reduceMotion()) {
      G.stop -= step;
      if (G.stop < 0) G.stop = 0;
      stepFx(step);
    } else {
      stepWorld(step);
      stepFx(step);
    }
  }
  draw();
  requestAnimationFrame(frame);
}

function boot() {
  G.best = loadBest();
  bestEl.textContent = String(G.best);
  audio.setMuted(loadMute());
  syncAutoUi();
  syncSpeedUi();
  renderPips();
  hudPlay();
  showTitle();
  resize();
  layout();
  window.addEventListener('resize', resize);
  document.addEventListener('keydown', onKey);
  canvas.addEventListener('pointerdown', onPtrDown);
  canvas.addEventListener('pointerup', onPtrUp);
  canvas.addEventListener('pointercancel', onPtrCancel);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  btnMute.addEventListener('click', function () { audio.setMuted(!audio.muted); });
  btnAuto.addEventListener('click', function () { toggleAuto(); });
  btnRetry.addEventListener('click', function () { restart(); });
  ovRetry.addEventListener('click', function () { restart(); });
  btnClassic.addEventListener('click', function () { startRun('classic'); });
  btnNight.addEventListener('click', function () { startRun('night'); });
  speedEl.addEventListener('input', function () { setAutoSpeed(parseInt(speedEl.value, 10)); });
  speedEl.addEventListener('change', function () { setAutoSpeed(parseInt(speedEl.value, 10)); });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) lastTs = 0;
  });
  requestAnimationFrame(frame);
}

boot();

}
