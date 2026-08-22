'use strict';

/* 米皮 — Mappy remake. Trampolines, door slams, loot. No CDN. Hue 12. */

var WORLD_W = 480;
var WORLD_H = 540;
var N_FLOORS = 5;
var FLOOR_YS = [460, 372, 284, 196, 108];
var FLOOR_GAP = 88;
var WELL_W = 38;
var LIVES = 3;
var PW = 13;
var PH = 22;
var WALK = 150;
var STEER = 128;
var GRAV = 1650;
var BOUNCE = 575;
var BOUNCE_HI = 792;
var MAX_FALL = 540;
var SLAM_T = 0.15;
var SLAM_BUF = 0.12;
var DOOR_RANGE = 32;
var STUN_MEOW = 3.2;
var STUN_GORO = 1.72;
var INVULN = 0.95;
var DIE_T = 0.62;
var COMBO_WIN = 1.52;
var MICRO_T = 4.4;
var LAND_SLACK = 12;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var BEST_KEY = 'playbox-mappy-best';
var MUTE_KEY = 'playbox-mappy-mute';

var ITEM_SCORE = [100, 200, 300, 400, 500, 800];
var ITEM_NAME = ['收音机', '电视', '电脑', '名画', '保险箱', '微波炉'];

var MAG = [255, 61, 184];
var CYN = [0, 240, 255];
var GOLD = [255, 227, 107];
var HOT = [255, 78, 36];
var HOT2 = [255, 138, 74];
var LIME = [61, 255, 136];
var RED = [255, 58, 62];
var WHT = [246, 243, 255];
var PINK = [255, 122, 216];
var WEAR_COL = [MAG, GOLD, LIME, CYN, MAG];

var STAGES = [
  {
    name: '一号宅',
    wells: [
      { x: 120, rainbow: false },
      { x: 240, rainbow: false },
      { x: 360, rainbow: false }
    ],
    missing: [],
    doors: [
      { floor: 0, x: 70 }, { floor: 0, x: 300 },
      { floor: 1, x: 180 }, { floor: 1, x: 420 },
      { floor: 2, x: 70 }, { floor: 2, x: 300 },
      { floor: 3, x: 180 }, { floor: 3, x: 420 },
      { floor: 4, x: 70 }, { floor: 4, x: 300 }
    ],
    items: [
      { floor: 4, x: 48, kind: 3 },
      { floor: 4, x: 430, kind: 1 },
      { floor: 3, x: 190, kind: 0 },
      { floor: 2, x: 300, kind: 2 },
      { floor: 1, x: 50, kind: 4 },
      { floor: 0, x: 430, kind: 5 }
    ],
    cats: [
      { floor: 1, x: 190, goro: false },
      { floor: 2, x: 300, goro: false },
      { floor: 3, x: 420, goro: false },
      { floor: 4, x: 200, goro: true }
    ],
    extra: [
      { floor: 0, x: 200, goro: false },
      { floor: 2, x: 50, goro: false },
      { floor: 3, x: 70, goro: false },
      { floor: 1, x: 300, goro: true }
    ],
    spawn: { floor: 0, x: 40 }
  },
  {
    name: '夹层馆',
    wells: [
      { x: 96, rainbow: false },
      { x: 210, rainbow: false },
      { x: 324, rainbow: true }
    ],
    missing: [{ f: 2, i: 1 }],
    doors: [
      { floor: 0, x: 44 }, { floor: 0, x: 260 }, { floor: 0, x: 400 },
      { floor: 1, x: 150 }, { floor: 1, x: 400 },
      { floor: 2, x: 44 }, { floor: 2, x: 400 },
      { floor: 3, x: 150 }, { floor: 3, x: 260 },
      { floor: 4, x: 44 }, { floor: 4, x: 400 }
    ],
    items: [
      { floor: 4, x: 44, kind: 4 },
      { floor: 4, x: 260, kind: 2 },
      { floor: 3, x: 400, kind: 1 },
      { floor: 2, x: 44, kind: 0 },
      { floor: 1, x: 150, kind: 3 },
      { floor: 0, x: 400, kind: 5 }
    ],
    cats: [
      { floor: 1, x: 150, goro: false },
      { floor: 2, x: 400, goro: false },
      { floor: 3, x: 260, goro: false },
      { floor: 3, x: 44, goro: false },
      { floor: 4, x: 260, goro: true }
    ],
    extra: [
      { floor: 0, x: 150, goro: false },
      { floor: 1, x: 400, goro: false },
      { floor: 4, x: 44, goro: false },
      { floor: 2, x: 260, goro: true }
    ],
    spawn: { floor: 0, x: 36 }
  },
  {
    name: '虹跃楼',
    wells: [
      { x: 120, rainbow: false },
      { x: 240, rainbow: true },
      { x: 360, rainbow: false }
    ],
    missing: [{ f: 1, i: 2 }, { f: 3, i: 1 }],
    doors: [
      { floor: 0, x: 70 }, { floor: 0, x: 190 }, { floor: 0, x: 420 },
      { floor: 1, x: 70 }, { floor: 1, x: 420 },
      { floor: 2, x: 190 }, { floor: 2, x: 300 },
      { floor: 3, x: 70 }, { floor: 3, x: 420 },
      { floor: 4, x: 190 }, { floor: 4, x: 300 }
    ],
    items: [
      { floor: 4, x: 48, kind: 2 },
      { floor: 4, x: 430, kind: 4 },
      { floor: 3, x: 70, kind: 1 },
      { floor: 2, x: 190, kind: 3 },
      { floor: 1, x: 48, kind: 0 },
      { floor: 0, x: 300, kind: 5 }
    ],
    cats: [
      { floor: 1, x: 70, goro: false },
      { floor: 2, x: 300, goro: false },
      { floor: 2, x: 70, goro: false },
      { floor: 3, x: 420, goro: false },
      { floor: 4, x: 300, goro: true }
    ],
    extra: [
      { floor: 0, x: 190, goro: false },
      { floor: 1, x: 420, goro: false },
      { floor: 3, x: 70, goro: false },
      { floor: 4, x: 70, goro: true },
      { floor: 0, x: 420, goro: false }
    ],
    spawn: { floor: 0, x: 40 }
  }
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
function sign(v) {
  return v < 0 ? -1 : v > 0 ? 1 : 0;
}
function capArr(arr, n) {
  if (arr.length > n) arr.splice(0, arr.length - n);
}

function bounceHeight(v) {
  return (v * v) / (2 * GRAV);
}

function comboMul(n) {
  var c = n | 0;
  if (c < 1) return 1;
  if (c > 8) return 8;
  return c;
}

function roundMul(round) {
  return 1 + Math.max(0, round - 1) * 0.11;
}

function catSpd(round, swarm, goro) {
  var base = goro ? 46 : 58;
  if (swarm) base *= 1.22;
  return base * roundMul(round);
}

function stunTime(goro, swarm) {
  var t = goro ? STUN_GORO : STUN_MEOW;
  if (swarm) t *= 0.82;
  return t;
}

function stageOf(round) {
  return STAGES[((round | 0) - 1 + STAGES.length * 8) % STAGES.length];
}

function itemScore(kind) {
  return ITEM_SCORE[kind | 0] || 100;
}

function segsFromWells(wells) {
  var segs = [];
  var x = 8;
  var i, left, hw;
  hw = WELL_W * 0.5;
  for (i = 0; i < wells.length; i++) {
    left = wells[i].x - hw;
    if (left - x >= 22) segs.push({ x: x, w: left - x });
    x = wells[i].x + hw;
  }
  if (WORLD_W - 8 - x >= 22) segs.push({ x: x, w: WORLD_W - 8 - x });
  return segs;
}

function makeFloors(tpl) {
  var base = segsFromWells(tpl.wells);
  var floors = [];
  var f, i, segs, miss, drop;
  for (f = 0; f < N_FLOORS; f++) {
    segs = [];
    for (i = 0; i < base.length; i++) segs.push({ x: base[i].x, w: base[i].w });
    floors.push({ y: FLOOR_YS[f], segs: segs });
  }
  if (tpl.missing) {
    for (i = 0; i < tpl.missing.length; i++) {
      miss = tpl.missing[i];
      drop = floors[miss.f];
      if (drop && drop.segs[miss.i]) drop.segs.splice(miss.i, 1);
    }
  }
  return floors;
}

function onSeg(floor, x, pad) {
  var i, s;
  pad = pad == null ? 0 : pad;
  if (!floor) return null;
  for (i = 0; i < floor.segs.length; i++) {
    s = floor.segs[i];
    if (x >= s.x - pad && x <= s.x + s.w + pad) return s;
  }
  return null;
}

function wellAt(wells, x, pad) {
  var i, w, hw;
  pad = pad == null ? 4 : pad;
  hw = WELL_W * 0.5 + pad;
  for (i = 0; i < wells.length; i++) {
    w = wells[i];
    if (Math.abs(x - w.x) <= hw) return w;
  }
  return null;
}

function nearestWell(wells, x) {
  var i, w, best = null, d, bd = 1e9;
  for (i = 0; i < wells.length; i++) {
    w = wells[i];
    d = Math.abs(x - w.x);
    if (d < bd) { bd = d; best = w; }
  }
  return best;
}

function floorIndexAtY(y, slop) {
  var i, d, best = -1, bd = 1e9;
  slop = slop == null ? 12 : slop;
  for (i = 0; i < N_FLOORS; i++) {
    d = Math.abs(FLOOR_YS[i] - y);
    if (d < bd) { bd = d; best = i; }
  }
  return bd <= slop ? best : -1;
}

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function playerBox(p) {
  return { x: p.x - PW * 0.38, y: p.y - PH + 3, w: PW * 0.76, h: PH - 5 };
}

function catBox(c) {
  var w = c.goro ? 20 : 15;
  var h = c.goro ? 22 : 18;
  return { x: c.x - w * 0.5, y: c.y - h + 2, w: w, h: h - 3 };
}

function slamBox(d) {
  return { x: d.x - 30, y: FLOOR_YS[d.floor] - 30, w: 60, h: 32 };
}

function doorBlocks(doors, floor, x0, x1) {
  var i, d, a, b;
  a = Math.min(x0, x1);
  b = Math.max(x0, x1);
  for (i = 0; i < doors.length; i++) {
    d = doors[i];
    if (d.floor !== floor) continue;
    if (d.open) continue;
    if (d.x + 5 >= a && d.x - 5 <= b) return d;
  }
  return null;
}

function applyDoorBlock(doors, floor, x0, x1, half) {
  var d = doorBlocks(doors, floor, x0, x1);
  if (!d) return x1;
  half = half == null ? 7 : half;
  if (x1 > x0) return Math.min(x1, d.x - half);
  return Math.max(x1, d.x + half);
}

function makePlayer(spawn) {
  return {
    x: spawn.x,
    y: FLOOR_YS[spawn.floor],
    vx: 0,
    vy: 0,
    face: 1,
    floor: spawn.floor,
    state: 'walk',
    walk: 0,
    squash: 1,
    stretch: 1,
    inv: 0,
    deadT: 0,
    bounces: 0,
    fromFloor: -1,
    why: ''
  };
}

function makeCat(spec, round, swarm) {
  return {
    x: spec.x,
    y: FLOOR_YS[spec.floor],
    vx: 0,
    vy: 0,
    face: spec.x > 240 ? -1 : 1,
    floor: spec.floor,
    want: spec.floor,
    state: 'walk',
    goro: !!spec.goro,
    spd: catSpd(round, swarm, spec.goro),
    walk: rand(0, 4),
    stun: 0,
    think: rand(0.4, 1.6),
    squash: 1,
    stretch: 1,
    bounces: 0,
    fromFloor: -1
  };
}

function makeDoor(spec) {
  return {
    floor: spec.floor,
    x: spec.x,
    open: false,
    slam: 0,
    cool: 0,
    ang: 0
  };
}

function makeItem(spec) {
  return {
    floor: spec.floor,
    x: spec.x,
    y: FLOOR_YS[spec.floor] - 16,
    kind: spec.kind | 0,
    taken: false,
    bob: rand(0, TAU)
  };
}

function makeWell(spec) {
  var cells = [];
  var i;
  for (i = 0; i < N_FLOORS; i++) {
    cells.push({ wear: 0, broken: false, fix: 0, squash: 1 });
  }
  return {
    x: spec.x,
    rainbow: !!spec.rainbow,
    cells: cells
  };
}

function nearestDoor(doors, floor, x, y) {
  var i, d, dist, best = null, bd = DOOR_RANGE;
  var fy;
  for (i = 0; i < doors.length; i++) {
    d = doors[i];
    fy = FLOOR_YS[d.floor];
    if (Math.abs(y - fy) > 16 && d.floor !== floor) continue;
    if (Math.abs(y - fy) > 16) continue;
    dist = Math.abs(x - d.x);
    if (dist < bd) { bd = dist; best = d; }
  }
  return best;
}

function lootLeft(items) {
  var i, n = 0;
  for (i = 0; i < items.length; i++) if (!items[i].taken) n++;
  return n;
}

function selfCheck() {
  var h, hi, floors, segs, p, c, d, it, doors, wells, i, j, tpl, s, box, sb;

  if (STAGES.length !== 3) throw new Error('3 stages');
  if (N_FLOORS !== 5) throw new Error('5 floors');
  if (LIVES !== 3) throw new Error('3 lives');
  if (FLOOR_YS[0] <= FLOOR_YS[4]) throw new Error('floor 0 is bottom');
  if (FLOOR_YS[0] - FLOOR_YS[1] !== FLOOR_GAP) throw new Error('floor gap');

  h = bounceHeight(BOUNCE);
  hi = bounceHeight(BOUNCE_HI);
  if (h < FLOOR_GAP || h > FLOOR_GAP + 18) throw new Error('bounce 1 floor');
  if (hi < FLOOR_GAP * 2 || hi > FLOOR_GAP * 2 + 24) throw new Error('rainbow 2 floors');
  if (hi <= h) throw new Error('rainbow higher');

  if (comboMul(0) !== 1 || comboMul(3) !== 3 || comboMul(99) !== 8) throw new Error('combo');
  if (itemScore(0) !== 100 || itemScore(5) !== 800) throw new Error('item scores');
  if (ITEM_NAME[5] !== '微波炉') throw new Error('microwave name');
  if (catSpd(1, true, false) <= catSpd(1, false, false)) throw new Error('swarm faster');
  if (catSpd(2, false, false) <= catSpd(1, false, false)) throw new Error('round faster');
  if (stunTime(true, false) >= stunTime(false, false)) throw new Error('goro shorter stun');
  if (stunTime(false, true) >= stunTime(false, false)) throw new Error('swarm shorter stun');

  if (stageOf(1) !== STAGES[0] || stageOf(4) !== STAGES[0]) throw new Error('stage wrap');
  if (stageOf(2) !== STAGES[1] || stageOf(3) !== STAGES[2]) throw new Error('stage order');

  p = { x: 80, y: 460, floor: 0 };
  box = playerBox(p);
  if (box.h < 14 || box.w < 8) throw new Error('player box');
  c = { x: 90, y: 460, goro: false };
  if (!aabb(playerBox(p), catBox(c))) throw new Error('touch cat');
  c.x = 160;
  if (aabb(playerBox(p), catBox(c))) throw new Error('far cat miss');

  d = { floor: 0, x: 70, open: false };
  sb = slamBox(d);
  c = { x: 70, y: 460, goro: false };
  if (!aabb(sb, catBox(c))) throw new Error('slam hits cat at door');
  c.x = 160;
  if (aabb(sb, catBox(c))) throw new Error('slam miss far cat');

  doors = [{ floor: 0, x: 100, open: false }, { floor: 0, x: 200, open: true }];
  if (!doorBlocks(doors, 0, 80, 120)) throw new Error('closed door blocks');
  if (doorBlocks(doors, 0, 180, 220)) throw new Error('open door free');
  if (doorBlocks(doors, 1, 80, 120)) throw new Error('other floor free');
  if (applyDoorBlock(doors, 0, 80, 120, 7) >= 100) throw new Error('block snap');

  for (i = 0; i < STAGES.length; i++) {
    tpl = STAGES[i];
    if (!tpl.wells || tpl.wells.length < 3) throw new Error('wells');
    if (!tpl.doors || tpl.doors.length < 8) throw new Error('doors');
    if (!tpl.items || tpl.items.length < 6) throw new Error('items');
    if (!tpl.cats || tpl.cats.length < 4) throw new Error('cats');
    if (!tpl.extra || tpl.extra.length < 3) throw new Error('swarm extra');
    if (tpl.extra.length <= tpl.cats.length - 2) throw new Error('swarm more');
    floors = makeFloors(tpl);
    if (floors.length !== 5) throw new Error('5 floor objs');
    segs = segsFromWells(tpl.wells);
    if (segs.length < 3) throw new Error('segs');
    if (!onSeg(floors[tpl.spawn.floor], tpl.spawn.x, 0)) throw new Error('spawn on seg');
    if (tpl.spawn.floor !== 0) throw new Error('spawn bottom');
    s = false;
    for (j = 0; j < tpl.items.length; j++) {
      it = tpl.items[j];
      if (!onSeg(floors[it.floor], it.x, 2)) throw new Error('item on seg ' + i + '/' + j);
      if (it.kind === 5) s = true;
    }
    if (!s) throw new Error('microwave present');
    for (j = 0; j < tpl.doors.length; j++) {
      d = tpl.doors[j];
      if (!onSeg(floors[d.floor], d.x, 2)) throw new Error('door on seg ' + i + '/' + j);
    }
    for (j = 0; j < tpl.cats.length; j++) {
      c = tpl.cats[j];
      if (!onSeg(floors[c.floor], c.x, 2)) throw new Error('cat on seg');
    }
    wells = tpl.wells.map(makeWell);
    if (!wellAt(wells, tpl.wells[0].x, 0)) throw new Error('well at');
    if (wellAt(wells, segs[0].x + 8, 0)) throw new Error('well not on seg');
    p = makePlayer(tpl.spawn);
    if (p.state !== 'walk' || p.floor !== 0) throw new Error('player spawn');
  }

  if (STAGES[1].wells.filter(function (w) { return w.rainbow; }).length < 1) {
    throw new Error('stage2 rainbow');
  }
  if (STAGES[2].wells.filter(function (w) { return w.rainbow; }).length < 1) {
    throw new Error('stage3 rainbow');
  }
  if (lootLeft(STAGES[0].items.map(makeItem)) !== 6) throw new Error('loot 6');

  it = makeItem({ floor: 0, x: 40, kind: 5 });
  if (it.kind !== 5 || it.taken) throw new Error('micro item');

  (function bounceApex() {
    var y = FLOOR_YS[0];
    var vy = -BOUNCE;
    var minY = y;
    var t, n = 0;
    for (t = 0; t < 2.2 && n < 180; t += STEP, n++) {
      vy += GRAV * STEP;
      y += vy * STEP;
      if (y < minY) minY = y;
      if (vy > 0 && y > FLOOR_YS[0]) break;
    }
    if (FLOOR_YS[0] - minY < FLOOR_GAP - 2) throw new Error('apex below next floor');
    if (Math.abs(minY - FLOOR_YS[1]) > 14) throw new Error('apex near floor 1');
    y = FLOOR_YS[0];
    vy = -BOUNCE_HI;
    minY = y;
    n = 0;
    for (t = 0; t < 2.6 && n < 220; t += STEP, n++) {
      vy += GRAV * STEP;
      y += vy * STEP;
      if (y < minY) minY = y;
      if (vy > 0 && y > FLOOR_YS[0]) break;
    }
    if (FLOOR_YS[0] - minY < FLOOR_GAP * 2 - 2) throw new Error('hi apex below floor 2');
    if (Math.abs(minY - FLOOR_YS[2]) > 16) throw new Error('hi apex near floor 2');
  }());

  (function bounceThenLand() {
    var floors = makeFloors(STAGES[0]);
    var wells = STAGES[0].wells.map(makeWell);
    var x = STAGES[0].wells[0].x;
    var y = FLOOR_YS[0];
    var vy = 70;
    var bounced = false;
    var landed = false;
    var landFloor = -1;
    var n, prevY, w, f, fy, cell, high;
    if (onSeg(floors[0], x, 0)) throw new Error('well x not a gap');
    if (!wellAt(wells, x, 2)) throw new Error('well detect');
    for (n = 0; n < 240; n++) {
      vy += GRAV * STEP;
      if (vy > MAX_FALL) vy = MAX_FALL;
      prevY = y;
      y += vy * STEP;
      x = bounced ? STAGES[0].wells[0].x + 28 : STAGES[0].wells[0].x;
      if (vy >= -200) {
        for (f = 0; f < N_FLOORS; f++) {
          fy = FLOOR_YS[f];
          if (Math.abs(y - fy) > LAND_SLACK) continue;
          if (!onSeg(floors[f], x, 0)) continue;
          y = fy;
          landed = true;
          landFloor = f;
          break;
        }
      }
      if (landed) break;
      w = wellAt(wells, STAGES[0].wells[0].x, 2);
      if (w && vy > 24) {
        for (f = 0; f < N_FLOORS; f++) {
          fy = FLOOR_YS[f];
          if (prevY > fy + 8) continue;
          if (y < fy - 4) continue;
          cell = w.cells[f];
          if (cell.broken) continue;
          high = w.rainbow || cell.wear >= 4;
          vy = high ? -BOUNCE_HI : -BOUNCE;
          y = fy;
          bounced = true;
          break;
        }
      }
    }
    if (!bounced) throw new Error('must bounce');
    if (!landed) throw new Error('must land after bounce');
    if (landFloor !== 1) throw new Error('land next floor');
  }());

  (function dropThenLand() {
    var floors = makeFloors(STAGES[0]);
    var wells = STAGES[0].wells.map(makeWell);
    var wellX = STAGES[0].wells[0].x;
    var x = wellX;
    var y = FLOOR_YS[2];
    var vy = 120;
    var fromFloor = 2;
    var bounced = false;
    var landed = false;
    var landFloor = -1;
    var n, prevY, w, f, fy, cell;
    for (n = 0; n < 200; n++) {
      vy += GRAV * STEP;
      if (vy > MAX_FALL) vy = MAX_FALL;
      prevY = y;
      y += vy * STEP;
      x = y > FLOOR_YS[2] + 24 ? wellX + 28 : wellX;
      if (vy >= 0) {
        for (f = 0; f < N_FLOORS; f++) {
          fy = FLOOR_YS[f];
          if (!onSeg(floors[f], x, 0)) continue;
          if (prevY <= fy + 4 && y >= fy - 1) {
            landed = true;
            landFloor = f;
            y = fy;
            break;
          }
        }
      }
      if (landed) break;
      w = wellAt(wells, wellX, 2);
      if (w && vy > 24) {
        for (f = 0; f < N_FLOORS; f++) {
          fy = FLOOR_YS[f];
          if (f === N_FLOORS - 1) continue;
          if (fromFloor === f) continue;
          if (prevY > fy + 8) continue;
          if (y < fy - 4) continue;
          cell = w.cells[f];
          if (cell.broken) continue;
          bounced = true;
          break;
        }
      }
      if (bounced) break;
    }
    if (!landed) throw new Error('drop must land lower');
    if (landFloor !== 1) throw new Error('drop onto floor 1');
    if (bounced) throw new Error('drop should land before bounce');
  }());
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
var btnSearch = document.getElementById('btn-search');
var btnSwarm = document.getElementById('btn-swarm');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnLeft = document.getElementById('btn-left');
var btnRight = document.getElementById('btn-right');
var btnDown = document.getElementById('btn-down');
var btnDoor = document.getElementById('btn-door');
var scoreEl = document.getElementById('score');
var roundEl = document.getElementById('round');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var lootBar = document.getElementById('loot-bar');
var lootNum = document.getElementById('loot-num');
var waveBar = document.getElementById('wave-bar');
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
var poofs = [];
var dust = [];

var keys = { l: false, r: false, d: false };

var G = {
  mode: 'title',
  kind: 'search',
  swarm: false,
  clock: 0,
  round: 1,
  lives: LIVES,
  score: 0,
  bestS: 0,
  bestQ: 0,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  player: null,
  floors: [],
  wells: [],
  doors: [],
  items: [],
  cats: [],
  spawn: { floor: 0, x: 40 },
  tpl: STAGES[0],
  micro: 0,
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flash: 0,
  flashRgb: HOT,
  clearT: 0,
  lock: 0,
  slamBuf: 0,
  why: '',
  stageName: STAGES[0].name,
  lootMax: 6
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
  thump: function (high) {
    this.ensure();
    this.noise(0.07, high ? 0.12 : 0.09, high ? 180 : 240, 'lowpass');
    this.beep(high ? 140 : 110, 0.08, 'sine', 0.07, 55);
    this.beep(high ? 420 : 280, 0.05, 'triangle', 0.035, 180);
    if (high) this.beep(660, 0.07, 'square', 0.03, 990);
  },
  slam: function () {
    this.ensure();
    this.noise(0.08, 0.11, 280, 'lowpass');
    this.beep(180, 0.07, 'square', 0.07, 70);
    this.beep(90, 0.09, 'sine', 0.05, 40);
  },
  pow: function (combo) {
    this.ensure();
    var p = 1 + Math.min(8, combo) * 0.07;
    this.noise(0.1, 0.13, 200, 'lowpass');
    this.beep(220 * p, 0.09, 'square', 0.08, 80);
    this.beep(540 * p, 0.07, 'sawtooth', 0.04, 180);
    this.beep(880 * p, 0.05, 'triangle', 0.03, 420);
  },
  ping: function (kind) {
    this.ensure();
    var f = 420 + (kind | 0) * 70;
    this.beep(f, 0.07, 'triangle', 0.06, f * 1.6);
    this.beep(f * 1.5, 0.1, 'square', 0.035, f * 2.1);
  },
  micro: function () {
    this.ensure();
    this.beep(180, 0.12, 'sawtooth', 0.05, 90);
    this.beep(540, 0.16, 'square', 0.05, 1080);
    this.beep(720, 0.2, 'triangle', 0.04, 1440);
    this.noise(0.14, 0.08, 900, 'bandpass');
  },
  die: function () {
    this.ensure();
    this.noise(0.16, 0.12, 260, 'lowpass');
    this.beep(320, 0.22, 'sawtooth', 0.06, 70);
    this.beep(170, 0.18, 'square', 0.04, 50);
  },
  clear: function () {
    this.ensure();
    this.beep(392, 0.1, 'square', 0.065, 523);
    this.beep(523, 0.12, 'square', 0.055, 659);
    this.beep(659, 0.14, 'triangle', 0.05, 784);
    this.beep(784, 0.22, 'triangle', 0.045, 1046);
  },
  over: function () {
    this.ensure();
    this.beep(196, 0.18, 'sawtooth', 0.05, 98);
    this.beep(130, 0.28, 'square', 0.04, 60);
  },
  combo: function (n) {
    this.ensure();
    this.beep(440 + n * 40, 0.08, 'square', 0.05, 880 + n * 50);
  },
  start: function () {
    this.ensure();
    this.beep(330, 0.08, 'square', 0.04, 440);
    this.beep(440, 0.1, 'triangle', 0.04, 660);
  },
  whiff: function () {
    this.ensure();
    this.noise(0.04, 0.04, 1400, 'highpass');
    this.beep(220, 0.04, 'square', 0.02, 90);
  },
  land: function () {
    this.ensure();
    this.noise(0.04, 0.04, 380, 'bandpass');
    this.beep(180, 0.04, 'sine', 0.025, 80);
  },
  pop: function () {
    this.ensure();
    this.noise(0.08, 0.08, 420, 'bandpass');
    this.beep(260, 0.06, 'square', 0.04, 80);
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
      G.bestS = (o.s | 0) || (o.j | 0);
      G.bestQ = (o.q | 0);
      return;
    }
    if (typeof o === 'number') {
      G.bestS = o | 0;
      G.bestQ = o | 0;
    }
  } catch (e) { /* ignore */ }
}

function persistBest() {
  var cur = G.swarm ? G.bestQ : G.bestS;
  if (G.score > cur) {
    if (G.swarm) G.bestQ = G.score;
    else G.bestS = G.score;
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ s: G.bestS, q: G.bestQ }));
  } catch (e) { /* ignore */ }
}

function currentBest() {
  return G.swarm ? G.bestQ : G.bestS;
}

loadBest();

/* ---- fx ---- */
function hitStop(t) {
  if (reduceMotion()) return;
  if (t > G.stop) G.stop = t;
}

function shake(n) {
  if (reduceMotion()) return;
  G.shake = Math.max(G.shake, n);
}

function kick(n, cls) {
  if (reduceMotion()) return;
  G.kickX = (Math.random() < 0.5 ? -1 : 1) * n;
  G.kickY = -n * 0.4;
  stageEl.classList.remove('hop', 'smash', 'clear', 'die');
  void stageEl.offsetWidth;
  stageEl.classList.add(cls || 'hop');
  clearTimeout(kickTok);
  kickTok = setTimeout(function () {
    stageEl.classList.remove('hop', 'smash', 'clear', 'die');
  }, 220);
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
      vy: rand(-1.15, 0.25) * spd,
      t: life * rand(0.55, 1.2),
      max: life,
      r: rand(1.1, 2.6),
      rgb: rgb,
      g: grav || 22
    });
  }
}

function spark(x, y, rgb, n) {
  var i;
  for (i = 0; i < n; i++) {
    sparks.push({
      x: x, y: y,
      vx: rand(-1, 1) * 52,
      vy: rand(-80, -16),
      t: rand(0.12, 0.3),
      rgb: rgb
    });
  }
}

function ringAt(x, y, rgb) {
  rings.push({ x: x, y: y, t: 0, rgb: rgb, r: 4 });
}

function floatText(x, y, text, rgb) {
  floats.push({ x: x, y: y, text: text, t: 0, rgb: rgb });
}

function poofAt(x, y, rgb) {
  poofs.push({ x: x, y: y, t: 0, rgb: rgb || WHT });
}

function toast(msg, warn, gold) {
  toastEl.textContent = msg;
  toastEl.classList.toggle('warn', !!warn);
  toastEl.classList.toggle('gold', !!gold);
  toastEl.classList.remove('hidden');
  clearTimeout(toastTok);
  toastTok = setTimeout(function () { toastEl.classList.add('hidden'); }, 900);
}

function flashScore(n) {
  scoreAdd.hidden = false;
  scoreAdd.textContent = '+' + n;
  scoreAdd.style.animation = 'none';
  void scoreAdd.offsetWidth;
  scoreAdd.style.animation = '';
  scoreBox.classList.remove('flash');
  void scoreBox.offsetWidth;
  scoreBox.classList.add('flash');
  clearTimeout(addTok);
  addTok = setTimeout(function () { scoreAdd.hidden = true; }, 700);
}

function addScore(n, x, y, label) {
  if (n <= 0) return;
  G.score += n;
  flashScore(n);
  persistBest();
  hudPlay();
  if (x != null) floatText(x, y - 18, label || ('+' + n), GOLD);
}

function bumpCombo() {
  G.combo += 1;
  G.comboAge = 0;
  if (G.combo > G.maxCombo) G.maxCombo = G.combo;
  comboEl.textContent = '×' + Math.max(1, G.combo);
  if (G.combo >= 2) {
    comboBox.classList.remove('hot');
    void comboBox.offsetWidth;
    comboBox.classList.add('hot');
  }
  if (G.combo === 3 || G.combo === 6 || G.combo === 10) {
    audio.combo(G.combo);
    toast(G.combo >= 10 ? '连击 ×' + G.combo : '连击', false, true);
  }
}

function renderPips() {
  var html = '';
  var i;
  for (i = 0; i < LIVES; i++) {
    html += '<i class="pip ' + (i < G.lives ? 'on' : 'gone') + '"></i>';
  }
  pipsEl.innerHTML = html;
}

function syncBars() {
  var left = lootLeft(G.items);
  var tot = G.lootMax || G.items.length || 1;
  var got = (tot - left) / tot;
  lootBar.style.transform = 'scaleX(' + clamp(got, 0, 1) + ')';
  lootBar.classList.toggle('on', got > 0.001);
  lootNum.textContent = String(left);
  waveBar.style.transform = 'scaleX(' + clamp(G.micro / MICRO_T, 0, 1) + ')';
}

function hudPlay() {
  scoreEl.textContent = String(G.score);
  roundEl.textContent = String(G.round);
  bestEl.textContent = String(currentBest());
  comboEl.textContent = '×' + Math.max(1, G.combo);
  renderPips();
  modeLabel.textContent = G.swarm ? '群猫' : '搜家';
  modeLabel.classList.toggle('swarm', G.swarm);
  if (G.mode === 'play') {
    hintEl.textContent = G.swarm
      ? '群猫围宅 · ↓ 落下 · 甩门砸晕 · R 重开'
      : '蹦床上楼 · ↓ 落下 · 甩门砸猫 · R 重开';
  }
  syncBars();
}

function resetFx() {
  particles.length = 0;
  sparks.length = 0;
  floats.length = 0;
  rings.length = 0;
  poofs.length = 0;
  G.stop = 0;
  G.shake = 0;
  G.kickX = 0;
  G.kickY = 0;
  G.flash = 0;
}

function seedDust() {
  var i;
  dust.length = 0;
  for (i = 0; i < 22; i++) {
    dust.push({
      x: rand(16, WORLD_W - 16),
      y: rand(40, WORLD_H - 40),
      p: rand(0, TAU),
      s: rand(0.5, 1.3)
    });
  }
}

function buildLevel(round, swarm) {
  var tpl = stageOf(round);
  var list = [];
  var i, spec;
  G.tpl = tpl;
  G.floors = makeFloors(tpl);
  G.wells = tpl.wells.map(makeWell);
  G.doors = tpl.doors.map(makeDoor);
  G.items = tpl.items.map(makeItem);
  G.lootMax = G.items.length;
  G.spawn = tpl.spawn;
  G.stageName = tpl.name;
  for (i = 0; i < tpl.cats.length; i++) {
    list.push(makeCat(tpl.cats[i], round, swarm));
  }
  if (swarm) {
    for (i = 0; i < tpl.extra.length; i++) {
      spec = tpl.extra[i];
      list.push(makeCat(spec, round, swarm));
    }
  }
  G.cats = list;
  G.player = makePlayer(tpl.spawn);
  G.micro = 0;
  G.clearT = 0;
}

function hideOverlay() {
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
}

function showTitle() {
  G.mode = 'title';
  G.kind = 'search';
  G.swarm = false;
  G.round = 1;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel';
  ovTitle.textContent = '米皮';
  ovLead.textContent = '蹦床换层，甩门砸晕猫，搜刮微波炉和电视。碰到猫丢一条命。';
  ovOps.textContent = '方向键或 WASD 走 · ↓ 下落 · 空格甩门 · 触屏左 下 门 右 · R 重开 · M 静音';
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
  hintEl.textContent = '蹦床换层 · 甩门砸猫 · 搜刮赃物 · R 重开';
  resetFx();
  buildLevel(1, false);
  hudPlay();
}

function showOver() {
  G.mode = 'over';
  persistBest();
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel lose';
  ovTitle.textContent = '命尽';
  ovLead.textContent = '第 ' + G.round + ' 关 · ' + G.score + ' 分 · 连击最高 ×' + G.maxCombo +
    (G.why ? ' · ' + whyText(G.why) : '');
  ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
  audio.over();
  ovRetry.focus();
}

function whyText(w) {
  if (w === 'cat') return '撞上了猫';
  if (w === 'goro') return '被哥罗撞到';
  if (w === 'fall') return '蹦床裂了';
  return '';
}

function startRun(kind) {
  G.kind = kind === 'swarm' ? 'swarm' : 'search';
  G.swarm = G.kind === 'swarm';
  G.mode = 'play';
  G.round = 1;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  G.maxCombo = 0;
  G.comboAge = 0;
  G.lock = 0.15;
  G.why = '';
  G.slamBuf = 0;
  resetFx();
  buildLevel(1, G.swarm);
  hideOverlay();
  audio.start();
  toast(G.swarm ? '群猫' : '搜家 · ' + G.stageName, false, !G.swarm);
  hudPlay();
  try { canvas.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
}

function retry() {
  if (G.mode === 'title') {
    startRun('search');
    return;
  }
  startRun(G.kind);
}

function nextRound() {
  G.round += 1;
  G.lock = 0.22;
  G.combo = 0;
  G.comboAge = 0;
  resetFx();
  buildLevel(G.round, G.swarm);
  G.player.inv = 0.35;
  toast('第 ' + G.round + ' 关 · ' + G.stageName, false, true);
  hudPlay();
}

function kill(why) {
  var p = G.player;
  if (!p || p.deadT > 0 || G.clearT > 0) return;
  if (p.inv > 0 && why !== 'fall') return;
  p.deadT = DIE_T;
  p.vy = -80;
  p.why = why;
  G.why = why;
  G.lives -= 1;
  audio.die();
  kick(7, 'die');
  shake(8);
  flash(MAG, 0.18);
  burst(p.x, p.y - 12, 16, MAG, 90, 0.4, 30);
  spark(p.x, p.y - 10, HOT, 8);
  hudPlay();
}

function afterDeath() {
  if (G.lives <= 0) {
    showOver();
    return;
  }
  G.player = makePlayer(G.spawn);
  G.player.inv = INVULN;
  G.lock = 0.2;
  toast('还剩 ' + G.lives + ' 命', true, false);
  hudPlay();
}

function resetWear() {
  var i, f, cell;
  for (i = 0; i < G.wells.length; i++) {
    for (f = 0; f < N_FLOORS; f++) {
      cell = G.wells[i].cells[f];
      if (!cell.broken) cell.wear = 0;
    }
  }
}

function doBounce(body, well, f) {
  var cell = well.cells[f];
  var isPlayer = G.player && body === G.player;
  var high = well.rainbow || (isPlayer && cell.wear >= 4);
  var col = well.rainbow || high ? rainbowRgb(G.clock) : (WEAR_COL[clamp(cell.wear, 0, 4)] || MAG);
  cell.squash = 0.45;
  if (isPlayer && !well.rainbow) {
    cell.wear += 1;
    if (cell.wear >= 5) {
      cell.broken = true;
      cell.wear = 0;
      cell.fix = 2.15;
      audio.pop();
      burst(well.x, FLOOR_YS[f], 14, MAG, 80, 0.32, 18);
      poofAt(well.x, FLOOR_YS[f], MAG);
    }
  }
  body.vy = high ? -BOUNCE_HI : -BOUNCE;
  body.y = FLOOR_YS[f];
  body.squash = 0.55;
  body.stretch = 1.42;
  body.bounces = (body.bounces || 0) + 1;
  if (isPlayer) {
    audio.thump(high);
    burst(well.x, FLOOR_YS[f], high ? 12 : 8, col, high ? 90 : 60, 0.28, 16);
    if (high) {
      spark(well.x, FLOOR_YS[f], GOLD, 6);
      ringAt(well.x, FLOOR_YS[f] - 4, CYN);
      flash(CYN, 0.06);
      kick(5, 'hop');
    } else {
      kick(3, 'hop');
    }
  }
}

function landBody(body, f) {
  body.y = FLOOR_YS[f];
  body.floor = f;
  body.state = 'walk';
  body.vy = 0;
  body.vx = 0;
  body.bounces = 0;
  body.fromFloor = -1;
  body.squash = 1.22;
  body.stretch = 0.82;
  if (G.player && body === G.player) {
    resetWear();
    audio.land();
  }
}

function tryLand(body, prevY) {
  var f, fy;
  for (f = 0; f < N_FLOORS; f++) {
    fy = FLOOR_YS[f];
    if (!onSeg(G.floors[f], body.x, 0)) continue;
    if (body.vy >= 0) {
      if (prevY <= fy + 4 && body.y >= fy - 1) {
        landBody(body, f);
        return true;
      }
    } else if (body.vy > -220 && Math.abs(body.y - fy) <= LAND_SLACK) {
      landBody(body, f);
      return true;
    }
  }
  return false;
}

function tryTramp(body, prevY) {
  var w = wellAt(G.wells, body.x, 2);
  var f, fy, cell;
  if (!w || body.vy <= 24) return;
  for (f = 0; f < N_FLOORS; f++) {
    fy = FLOOR_YS[f];
    if (f === N_FLOORS - 1) continue;
    if (body.fromFloor === f && (body.bounces | 0) === 0) continue;
    if (prevY > fy + 8) continue;
    if (body.y < fy - 4) continue;
    if (onSeg(G.floors[f], body.x, 0)) continue;
    cell = w.cells[f];
    if (cell.broken) continue;
    doBounce(body, w, f);
    body.fromFloor = f;
    return;
  }
}

function tryCollect() {
  var p = G.player;
  var i, it, dy;
  if (!p || p.deadT > 0) return;
  for (i = 0; i < G.items.length; i++) {
    it = G.items[i];
    if (it.taken) continue;
    dy = Math.abs(p.y - FLOOR_YS[it.floor]);
    if (dy > 18) continue;
    if (Math.abs(p.x - it.x) > 16) continue;
    grabItem(it);
  }
}

function grabItem(it) {
  var sc, mul;
  it.taken = true;
  bumpCombo();
  mul = comboMul(G.combo);
  sc = itemScore(it.kind) * mul;
  addScore(sc, it.x, it.y, ITEM_NAME[it.kind]);
  audio.ping(it.kind);
  burst(it.x, it.y, 12, it.kind === 5 ? CYN : GOLD, 70, 0.32, 14);
  spark(it.x, it.y, WHT, 6);
  ringAt(it.x, it.y, it.kind === 5 ? CYN : GOLD);
  if (it.kind === 5) {
    G.micro = MICRO_T;
    stunAll(MICRO_T);
    hitStop(0.08);
    shake(6);
    flash(CYN, 0.28);
    audio.micro();
    toast('微波定身', false, true);
    addScore(1000, it.x, it.y - 10, '微波');
    ringAt(it.x, it.y, MAG);
    ringAt(WORLD_W * 0.5, WORLD_H * 0.5, CYN);
  }
  hudPlay();
  if (lootLeft(G.items) <= 0) beginClear();
}

function stunAll(t) {
  var i, c;
  for (i = 0; i < G.cats.length; i++) {
    c = G.cats[i];
    c.stun = Math.max(c.stun, t);
    c.squash = 0.7;
  }
}

function beginClear() {
  if (G.clearT > 0) return;
  G.clearT = 1.28;
  addScore(1000 + 250 * G.round, G.player.x, G.player.y - 24, '搜完');
  audio.clear();
  kick(6, 'clear');
  flash(GOLD, 0.2);
  burst(G.player.x, G.player.y - 10, 18, GOLD, 100, 0.4, 20);
  toast('搜刮完毕', false, true);
}

function trySlam() {
  var p = G.player;
  var d, hits, i, c, sc, mul;
  if (!p || p.deadT > 0 || G.clearT > 0) return false;
  d = nearestDoor(G.doors, p.floor, p.x, p.y);
  if (!d || d.cool > 0) return false;
  d.open = !d.open;
  d.slam = SLAM_T;
  d.cool = 0.2;
  audio.slam();
  kick(4, 'smash');
  burst(d.x, FLOOR_YS[d.floor] - 14, 6, HOT2, 50, 0.2, 12);

  hits = 0;
  for (i = 0; i < G.cats.length; i++) {
    c = G.cats[i];
    if (c.stun > 0.4) continue;
    if (!aabb(slamBox(d), catBox(c))) continue;
    c.stun = stunTime(c.goro, G.swarm);
    c.squash = 0.5;
    c.vx = 0;
    c.vy = 0;
    hits += 1;
    bumpCombo();
    mul = comboMul(G.combo);
    sc = (c.goro ? 400 : 200) * mul;
    addScore(sc, c.x, c.y - 10, c.goro ? '哥罗' : '砸晕');
    burst(c.x, c.y - 12, 14, c.goro ? HOT : LIME, 90, 0.34, 18);
    spark(c.x, c.y - 10, GOLD, 7);
    floatText(c.x, c.y - 28, 'POW', MAG);
    poofAt(c.x, c.y - 8, GOLD);
  }
  if (hits > 0) {
    hitStop(hits > 1 ? 0.072 : 0.055);
    shake(hits > 1 ? 7 : 5);
    flash(HOT, 0.1);
    audio.pow(G.combo);
  }
  return true;
}

/* ---- sim ---- */
function tickPlayer(dt) {
  var p = G.player;
  var ax, nx, prevY;
  if (!p) return;
  if (p.deadT > 0) {
    p.deadT -= dt;
    p.vy += GRAV * dt * 0.35;
    p.y += p.vy * dt;
    p.walk += dt * 8;
    if (p.deadT <= 0) afterDeath();
    return;
  }
  if (p.inv > 0) p.inv -= dt;
  p.squash += (1 - p.squash) * Math.min(1, dt * 12);
  p.stretch += (1 - p.stretch) * Math.min(1, dt * 12);

  ax = 0;
  if (keys.l) ax -= 1;
  if (keys.r) ax += 1;
  if (ax) p.face = ax;

  if (G.slamBuf > 0) {
    G.slamBuf -= dt;
    if (trySlam()) G.slamBuf = 0;
    else if (G.slamBuf <= 0) audio.whiff();
  }

  if (p.state === 'walk') {
    p.vx = ax * WALK;
    nx = clamp(p.x + p.vx * dt, 12, WORLD_W - 12);
    nx = applyDoorBlock(G.doors, p.floor, p.x, nx, 7);
    if (!onSeg(G.floors[p.floor], nx, 0)) {
      p.x = nx;
      p.state = 'bounce';
      p.bounces = 0;
      if ((keys.d && p.floor > 0) || p.floor === N_FLOORS - 1) {
        p.fromFloor = p.floor;
        p.vy = 120;
      } else {
        p.fromFloor = -1;
        p.vy = 55;
      }
    } else {
      p.x = nx;
    }
    p.y = FLOOR_YS[p.floor];
    p.walk += Math.abs(p.vx) * dt * 0.085;
    tryCollect();
  } else {
    p.vx = ax * STEER;
    p.x = clamp(p.x + p.vx * dt, 12, WORLD_W - 12);
    p.vy += GRAV * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    prevY = p.y;
    p.y += p.vy * dt;
    if (p.y < 72) { p.y = 72; if (p.vy < 0) p.vy = 40; }
    if (!tryLand(p, prevY)) tryTramp(p, prevY);
    if (p.y > WORLD_H + 8) kill('fall');
    tryCollect();
  }
}

function tickCats(dt, idle) {
  var i, c, p, ax, nx, prevY, w, target, same, edge;
  p = G.player;
  for (i = 0; i < G.cats.length; i++) {
    c = G.cats[i];
    c.squash += (1 - c.squash) * Math.min(1, dt * 10);
    c.walk += dt * (c.stun > 0 ? 6 : 3);
    if (G.micro > 0) c.stun = Math.max(c.stun, 0.08);
    if (c.stun > 0) {
      c.stun -= dt;
      continue;
    }
    if (c.state === 'bounce') {
      if (!idle) {
        same = p && c.want === p.floor ? p.floor : c.want;
        if (Math.abs(c.y - FLOOR_YS[same]) < 28 && onSeg(G.floors[same], c.x + c.face * 18, 8)) {
          c.vx = sign(onSeg(G.floors[same], c.x + 16, 4) ? 1 : -1) * STEER;
          if (!onSeg(G.floors[same], c.x + 16, 4) && onSeg(G.floors[same], c.x - 16, 4)) c.vx = -STEER;
        } else {
          w = wellAt(G.wells, c.x, 8);
          c.vx = w ? clamp(w.x - c.x, -40, 40) : 0;
        }
      }
      c.x = clamp(c.x + c.vx * dt, 12, WORLD_W - 12);
      c.vy += GRAV * dt;
      if (c.vy > MAX_FALL) c.vy = MAX_FALL;
      prevY = c.y;
      c.y += c.vy * dt;
      if (c.y < 72) { c.y = 72; if (c.vy < 0) c.vy = 40; }
      if (!tryLand(c, prevY)) tryTramp(c, prevY);
      if (c.y > WORLD_H + 10) {
        c.x = G.spawn.x + rand(-20, 20);
        c.y = FLOOR_YS[0];
        c.floor = 0;
        c.state = 'walk';
        c.vy = 0;
      }
      continue;
    }

    c.think -= dt;
    if (c.think <= 0) {
      c.think = c.goro ? rand(0.35, 0.9) : rand(0.7, 1.8);
      if (idle) {
        c.want = c.floor;
        c.face = Math.random() < 0.5 ? -1 : 1;
      } else if (p) {
        if (c.goro || Math.random() < 0.62) c.want = p.floor;
        else if (Math.random() < 0.35) c.want = clamp(c.floor + (Math.random() < 0.5 ? 1 : -1), 0, 4);
      }
    }

    if (!idle && p && c.floor !== c.want) {
      w = nearestWell(G.wells, c.x);
      target = w ? w.x : c.x;
      c.face = target >= c.x ? 1 : -1;
      nx = c.x + c.face * c.spd * dt;
      nx = clamp(nx, 12, WORLD_W - 12);
      nx = applyDoorBlock(G.doors, c.floor, c.x, nx, 8);
      if (!onSeg(G.floors[c.floor], nx, 0)) {
        c.x = nx;
        c.state = 'bounce';
        c.bounces = 0;
        if (c.want < c.floor || c.floor === N_FLOORS - 1) {
          c.fromFloor = c.floor;
          c.vy = 120;
        } else {
          c.fromFloor = -1;
          c.vy = 55;
        }
      } else {
        if (Math.abs(nx - c.x) < 0.2) c.face *= -1;
        c.x = nx;
      }
    } else {
      if (!idle && p) c.face = p.x >= c.x ? 1 : -1;
      nx = c.x + c.face * c.spd * dt;
      nx = clamp(nx, 12, WORLD_W - 12);
      nx = applyDoorBlock(G.doors, c.floor, c.x, nx, 8);
      edge = !onSeg(G.floors[c.floor], nx, 0);
      if (edge || Math.abs(nx - c.x) < 0.15) {
        c.face *= -1;
      } else {
        c.x = nx;
      }
    }
    c.y = FLOOR_YS[c.floor];

    if (!idle && p && p.deadT <= 0 && p.inv <= 0 && c.stun <= 0) {
      if (aabb(playerBox(p), catBox(c))) kill(c.goro ? 'goro' : 'cat');
    }
  }
}

function tickDoors(dt) {
  var i, d, t;
  for (i = 0; i < G.doors.length; i++) {
    d = G.doors[i];
    if (d.cool > 0) d.cool -= dt;
    if (d.slam > 0) d.slam -= dt;
    t = d.open ? 1 : 0;
    if (d.slam > 0) t = d.open ? 1 - d.slam / SLAM_T : d.slam / SLAM_T;
    d.ang += (t - d.ang) * Math.min(1, dt * 18);
  }
}

function tickWells(dt) {
  var i, f, cell;
  for (i = 0; i < G.wells.length; i++) {
    for (f = 0; f < N_FLOORS; f++) {
      cell = G.wells[i].cells[f];
      cell.squash += (1 - cell.squash) * Math.min(1, dt * 10);
      if (cell.broken) {
        cell.fix -= dt;
        if (cell.fix <= 0) {
          cell.broken = false;
          cell.wear = 0;
        }
      }
    }
  }
}

function tickFx(dt) {
  var i, o;
  for (i = particles.length - 1; i >= 0; i--) {
    o = particles[i];
    o.t -= dt;
    o.vy += (o.g || 22) * dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    if (o.t <= 0) particles.splice(i, 1);
  }
  for (i = sparks.length - 1; i >= 0; i--) {
    o = sparks[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.vy += 120 * dt;
    if (o.t <= 0) sparks.splice(i, 1);
  }
  for (i = floats.length - 1; i >= 0; i--) {
    o = floats[i];
    o.t += dt;
    o.y -= 28 * dt;
    if (o.t > 0.7) floats.splice(i, 1);
  }
  for (i = rings.length - 1; i >= 0; i--) {
    o = rings[i];
    o.t += dt;
    o.r += 70 * dt;
    if (o.t > 0.32) rings.splice(i, 1);
  }
  for (i = poofs.length - 1; i >= 0; i--) {
    o = poofs[i];
    o.t += dt;
    if (o.t > 0.28) poofs.splice(i, 1);
  }
  capArr(particles, 180);
  capArr(sparks, 80);
  capArr(floats, 24);
}

function tick(dt) {
  if (G.combo > 0) {
    G.comboAge += dt;
    if (G.comboAge > COMBO_WIN) {
      G.combo = 0;
      G.comboAge = 0;
      comboEl.textContent = '×1';
    }
  }
  if (G.micro > 0) {
    G.micro -= dt;
    if (G.micro < 0) G.micro = 0;
    syncBars();
  }
  if (G.mode === 'title') {
    G.clock += dt;
    tickCats(dt, true);
    tickDoors(dt);
    tickWells(dt);
    tickFx(dt);
    if (G.player) {
      G.player.walk += dt * 2;
      G.player.squash += (1 - G.player.squash) * dt * 8;
    }
    return;
  }
  if (G.mode !== 'play') {
    G.clock += dt;
    tickFx(dt);
    tickDoors(dt);
    return;
  }
  if (G.lock > 0) {
    G.lock -= dt;
    G.clock += dt;
    tickFx(dt);
    tickDoors(dt);
    return;
  }
  G.clock += dt;
  if (G.clearT > 0) {
    G.clearT -= dt;
    tickFx(dt);
    tickDoors(dt);
    tickWells(dt);
    if (G.player) {
      G.player.walk += dt * 3;
      G.player.squash += (1 - G.player.squash) * dt * 8;
    }
    if (G.clearT <= 0) nextRound();
    return;
  }
  tickPlayer(dt);
  tickCats(dt, false);
  tickDoors(dt);
  tickWells(dt);
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
  var s = Math.min(avW / WORLD_W, avH / WORLD_H);
  L.s = s;
  L.x = (avW - WORLD_W * s) / 2;
  L.y = Math.max(4, (avH - WORLD_H * s) / 2);
}

function sx(x) { return L.x + x * L.s; }
function sy(y) { return L.y + y * L.s; }

function roundRect(x, y, w, h, r) {
  if (w < 0) { x += w; w = -w; }
  if (h < 0) { y += h; h = -h; }
  r = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function rainbowRgb(t) {
  var h = ((t * 220) % 360);
  var a = h / 60;
  var x = 1 - Math.abs(a % 2 - 1);
  var r = 0, g = 0, b = 0;
  if (h < 60) { r = 1; g = x; }
  else if (h < 120) { r = x; g = 1; }
  else if (h < 180) { g = 1; b = x; }
  else if (h < 240) { g = x; b = 1; }
  else if (h < 300) { r = x; b = 1; }
  else { r = 1; b = x; }
  return [40 + r * 215, 40 + g * 215, 40 + b * 215];
}

function drawBg() {
  var g, i, f, y, x, d;
  ctx.fillStyle = '#07030c';
  ctx.fillRect(0, 0, cssW, cssH);

  g = ctx.createRadialGradient(sx(80), sy(90), 8, sx(80), sy(90), 220 * L.s);
  g.addColorStop(0, 'rgba(255,78,36,0.16)');
  g.addColorStop(1, 'rgba(255,78,36,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(380), sy(40), 8, sx(380), sy(40), 180 * L.s);
  g.addColorStop(0, 'rgba(255,61,184,0.12)');
  g.addColorStop(1, 'rgba(255,61,184,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  roundRect(sx(4), sy(70), (WORLD_W - 8) * L.s, 410 * L.s, 14 * L.s);
  ctx.fillStyle = 'rgba(18, 8, 28, 0.88)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,78,36,0.18)';
  ctx.lineWidth = 1.4 * L.s;
  ctx.stroke();

  for (i = 0; i < 5; i++) {
    x = 28 + i * 92;
    for (f = 0; f < 4; f++) {
      y = 128 + f * 88;
      roundRect(sx(x), sy(y), 36 * L.s, 22 * L.s, 3 * L.s);
      ctx.fillStyle = 'rgba(0,240,255,' + (0.05 + 0.03 * Math.sin(G.clock * 1.4 + i + f)) + ')';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,240,255,0.16)';
      ctx.lineWidth = 0.8 * L.s;
      ctx.stroke();
    }
  }

  ctx.fillStyle = 'rgba(255,78,36,0.08)';
  ctx.fillRect(sx(8), sy(FLOOR_YS[0] + 6), (WORLD_W - 16) * L.s, 18 * L.s);

  for (i = 0; i < dust.length; i++) {
    d = dust[i];
    x = d.x + Math.sin(G.clock * d.s + d.p) * 8;
    y = d.y + Math.cos(G.clock * 0.6 * d.s + d.p) * 6;
    ctx.fillStyle = rgba(CYN, 0.12 + 0.08 * Math.sin(G.clock * 2 + d.p));
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), 1.2 * L.s * d.s, 0, TAU);
    ctx.fill();
  }
}

function drawFloors() {
  var f, i, s, y, fl;
  for (f = 0; f < G.floors.length; f++) {
    fl = G.floors[f];
    y = fl.y;
    for (i = 0; i < fl.segs.length; i++) {
      s = fl.segs[i];
      ctx.fillStyle = 'rgba(255,78,36,0.18)';
      ctx.fillRect(sx(s.x), sy(y), s.w * L.s, 5 * L.s);
      ctx.fillStyle = '#ff8a4a';
      ctx.fillRect(sx(s.x), sy(y), s.w * L.s, 2.2 * L.s);
      ctx.fillStyle = 'rgba(255,227,107,0.35)';
      ctx.fillRect(sx(s.x + 2), sy(y), Math.max(0, s.w - 4) * L.s, 0.8 * L.s);
    }
  }
}

function drawWells() {
  var i, w, f, cell, y, col, high, t, rgb, sag;
  for (i = 0; i < G.wells.length; i++) {
    w = G.wells[i];
    ctx.strokeStyle = 'rgba(0,240,255,0.14)';
    ctx.lineWidth = 1.2 * L.s;
    ctx.beginPath();
    ctx.moveTo(sx(w.x - WELL_W * 0.5), sy(FLOOR_YS[4] - 18));
    ctx.lineTo(sx(w.x - WELL_W * 0.5), sy(FLOOR_YS[0] + 10));
    ctx.moveTo(sx(w.x + WELL_W * 0.5), sy(FLOOR_YS[4] - 18));
    ctx.lineTo(sx(w.x + WELL_W * 0.5), sy(FLOOR_YS[0] + 10));
    ctx.stroke();

    for (f = 0; f < N_FLOORS; f++) {
      cell = w.cells[f];
      y = FLOOR_YS[f];
      if (cell.broken) {
        ctx.strokeStyle = 'rgba(255,61,184,0.35)';
        ctx.setLineDash([4 * L.s, 4 * L.s]);
        ctx.beginPath();
        ctx.moveTo(sx(w.x - WELL_W * 0.46), sy(y + 2));
        ctx.lineTo(sx(w.x + WELL_W * 0.46), sy(y + 2));
        ctx.stroke();
        ctx.setLineDash([]);
        continue;
      }
      high = w.rainbow || cell.wear >= 4;
      if (high) {
        rgb = rainbowRgb(G.clock * 1.8 + i + f);
        col = rgba(rgb, 0.95);
      } else {
        rgb = WEAR_COL[clamp(cell.wear, 0, 4)];
        col = rgba(rgb, 0.9);
      }
      sag = 5 * cell.squash;
      ctx.strokeStyle = col;
      ctx.lineWidth = (high ? 3.2 : 2.4) * L.s * (2 - cell.squash);
      ctx.beginPath();
      ctx.moveTo(sx(w.x - WELL_W * 0.48), sy(y));
      ctx.quadraticCurveTo(sx(w.x), sy(y + sag + 6), sx(w.x + WELL_W * 0.48), sy(y));
      ctx.stroke();
      ctx.strokeStyle = rgba(WHT, high ? 0.45 : 0.2);
      ctx.lineWidth = 0.8 * L.s;
      ctx.beginPath();
      ctx.moveTo(sx(w.x - WELL_W * 0.3), sy(y + sag * 0.5));
      ctx.lineTo(sx(w.x + WELL_W * 0.3), sy(y + sag * 0.5));
      ctx.stroke();
    }
    t = 0;
  }
}

function drawDoors() {
  var i, d, y, ang, h;
  for (i = 0; i < G.doors.length; i++) {
    d = G.doors[i];
    y = FLOOR_YS[d.floor];
    ang = -1.22 * d.ang;
    h = 30;
    ctx.save();
    ctx.translate(sx(d.x), sy(y));
    ctx.rotate(ang);
    if (d.slam > 0) {
      ctx.shadowColor = rgba(GOLD, 0.7);
      ctx.shadowBlur = 12 * L.s;
    }
    ctx.fillStyle = d.slam > 0 ? '#ffe36b' : '#ff8a4a';
    roundRect(-2 * L.s, -h * L.s, 7 * L.s, h * L.s, 2 * L.s);
    ctx.fill();
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(3.2 * L.s, -18 * L.s, 1.6 * L.s, 4 * L.s);
    ctx.fillStyle = 'rgba(255,227,107,0.7)';
    ctx.fillRect(-0.6 * L.s, -h * L.s, 1.2 * L.s, h * L.s);
    ctx.restore();
  }
}

function drawItem(it) {
  var x, y, k, bob;
  if (it.taken) return;
  bob = Math.sin(G.clock * 3.2 + it.bob) * 2.4;
  x = sx(it.x);
  y = sy(it.y + bob);
  k = it.kind;
  ctx.save();
  ctx.translate(x, y);
  if (k === 0) {
    ctx.fillStyle = '#5a4a6a';
    roundRect(-8 * L.s, -6 * L.s, 16 * L.s, 10 * L.s, 2 * L.s);
    ctx.fill();
    ctx.strokeStyle = '#ffe36b';
    ctx.lineWidth = 1.2 * L.s;
    ctx.beginPath();
    ctx.moveTo(0, -6 * L.s);
    ctx.lineTo(5 * L.s, -13 * L.s);
    ctx.stroke();
    ctx.fillStyle = '#ff3db8';
    ctx.beginPath();
    ctx.arc(5 * L.s, -13 * L.s, 1.6 * L.s, 0, TAU);
    ctx.fill();
  } else if (k === 1) {
    ctx.fillStyle = '#1a2230';
    roundRect(-10 * L.s, -9 * L.s, 20 * L.s, 14 * L.s, 2 * L.s);
    ctx.fill();
    ctx.fillStyle = '#00f0ff';
    roundRect(-7.5 * L.s, -6.5 * L.s, 15 * L.s, 8 * L.s, 1 * L.s);
    ctx.fill();
    ctx.fillStyle = '#ff8a4a';
    ctx.fillRect(-4 * L.s, 5 * L.s, 8 * L.s, 2 * L.s);
  } else if (k === 2) {
    ctx.fillStyle = '#243044';
    roundRect(-9 * L.s, -11 * L.s, 18 * L.s, 12 * L.s, 2 * L.s);
    ctx.fill();
    ctx.fillStyle = '#3dff88';
    roundRect(-6.5 * L.s, -8.5 * L.s, 13 * L.s, 7 * L.s, 1 * L.s);
    ctx.fill();
    ctx.fillStyle = '#ffe36b';
    ctx.fillRect(-7 * L.s, 2 * L.s, 14 * L.s, 3 * L.s);
  } else if (k === 3) {
    ctx.fillStyle = '#ffe36b';
    ctx.fillRect(-9 * L.s, -12 * L.s, 18 * L.s, 16 * L.s);
    ctx.fillStyle = '#ff4e24';
    ctx.fillRect(-7 * L.s, -10 * L.s, 14 * L.s, 12 * L.s);
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(0, -5 * L.s, 3 * L.s, 0, TAU);
    ctx.fill();
  } else if (k === 4) {
    ctx.fillStyle = '#6a5040';
    roundRect(-9 * L.s, -10 * L.s, 18 * L.s, 16 * L.s, 2 * L.s);
    ctx.fill();
    ctx.strokeStyle = '#ffe36b';
    ctx.lineWidth = 1.1 * L.s;
    ctx.stroke();
    ctx.fillStyle = '#ff8a4a';
    ctx.beginPath();
    ctx.arc(0, -1 * L.s, 3.2 * L.s, 0, TAU);
    ctx.fill();
  } else {
    ctx.fillStyle = '#d8d0e8';
    roundRect(-10 * L.s, -9 * L.s, 20 * L.s, 14 * L.s, 2 * L.s);
    ctx.fill();
    ctx.fillStyle = '#00f0ff';
    roundRect(-6 * L.s, -6 * L.s, 9 * L.s, 8 * L.s, 1 * L.s);
    ctx.fill();
    ctx.fillStyle = '#ff3db8';
    ctx.fillRect(5 * L.s, -4 * L.s, 2.2 * L.s, 2.2 * L.s);
    ctx.strokeStyle = rgba(CYN, 0.7);
    ctx.lineWidth = 1 * L.s;
    ctx.beginPath();
    ctx.arc(0, 0, (10 + Math.sin(G.clock * 8) * 2) * L.s, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMappy(p) {
  var x, y, blink, duck;
  if (!p) return;
  x = sx(p.x);
  y = sy(p.y);
  blink = p.inv > 0 && ((p.inv * 18) | 0) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.4;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p.face >= 0 ? 1 : -1, 1);
  ctx.scale(p.stretch, p.squash);

  ctx.fillStyle = '#ff6ad0';
  ctx.beginPath();
  ctx.ellipse(0, -8 * L.s, 6.2 * L.s, 8.4 * L.s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff9ae0';
  ctx.beginPath();
  ctx.arc(0.6 * L.s, -20 * L.s, 6.4 * L.s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff7ad8';
  ctx.beginPath();
  ctx.ellipse(-5.4 * L.s, -24 * L.s, 2.6 * L.s, 3.4 * L.s, -0.4, 0, TAU);
  ctx.ellipse(5.2 * L.s, -24.4 * L.s, 2.6 * L.s, 3.4 * L.s, 0.4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#00f0ff';
  roundRect(-6.2 * L.s, -27.2 * L.s, 12.6 * L.s, 5.2 * L.s, 1.4 * L.s);
  ctx.fill();
  ctx.fillStyle = '#ffe36b';
  ctx.beginPath();
  ctx.arc(0, -24.6 * L.s, 1.5 * L.s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff4fb';
  ctx.beginPath();
  ctx.ellipse(1.4 * L.s, -18.4 * L.s, 3.2 * L.s, 2.4 * L.s, 0, 0, TAU);
  ctx.fill();
  if (p.deadT > 0) {
    ctx.strokeStyle = '#1a1020';
    ctx.lineWidth = 1.2 * L.s;
    ctx.beginPath();
    ctx.moveTo(-1.2 * L.s, -21.4 * L.s);
    ctx.lineTo(2.2 * L.s, -18.6 * L.s);
    ctx.moveTo(2.2 * L.s, -21.4 * L.s);
    ctx.lineTo(-1.2 * L.s, -18.6 * L.s);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#1a1020';
    ctx.beginPath();
    ctx.arc(2.2 * L.s, -19.8 * L.s, 1.15 * L.s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(2.5 * L.s, -20.1 * L.s, 0.4 * L.s, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = '#ff4e9a';
  ctx.lineWidth = 1.4 * L.s;
  ctx.beginPath();
  ctx.moveTo(-5.5 * L.s, -6 * L.s);
  ctx.quadraticCurveTo(-12 * L.s, -2 * L.s, -8 * L.s, 1 * L.s);
  ctx.stroke();
  duck = Math.sin(p.walk * 2.2) * 2.2;
  ctx.fillStyle = '#ff8a4a';
  ctx.fillRect(-4 * L.s, -2 * L.s, 3 * L.s, (4 + duck) * L.s);
  ctx.fillRect(1 * L.s, -2 * L.s, 3 * L.s, (4 - duck) * L.s);
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawCat(c) {
  var x, y, col, ear, i, a;
  x = sx(c.x);
  y = sy(c.y);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(c.face >= 0 ? 1 : -1, 1);
  ctx.scale(c.stretch || 1, c.squash);
  col = c.goro ? '#ff6a28' : '#3dff88';
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(0, c.goro ? -9 * L.s : -8 * L.s, (c.goro ? 10 : 6.6) * L.s, (c.goro ? 10 : 7.6) * L.s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = c.goro ? '#ff8a4a' : '#7affb0';
  ctx.beginPath();
  ctx.arc(1 * L.s, (c.goro ? -20 : -18) * L.s, (c.goro ? 7.2 : 5.6) * L.s, 0, TAU);
  ctx.fill();
  ear = c.goro ? 6.2 : 4.4;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(-5.2 * L.s, -22 * L.s);
  ctx.lineTo(-2.2 * L.s, (-22 - ear) * L.s);
  ctx.lineTo(0.4 * L.s, -22 * L.s);
  ctx.moveTo(1.6 * L.s, -22 * L.s);
  ctx.lineTo(5.4 * L.s, (-22 - ear) * L.s);
  ctx.lineTo(7.2 * L.s, -20 * L.s);
  ctx.fill();
  ctx.fillStyle = '#fff6e8';
  ctx.beginPath();
  ctx.ellipse(2.2 * L.s, (c.goro ? -18 : -16.5) * L.s, 3 * L.s, 2.2 * L.s, 0, 0, TAU);
  ctx.fill();
  if (c.stun > 0) {
    ctx.strokeStyle = '#1a1020';
    ctx.lineWidth = 1.1 * L.s;
    ctx.beginPath();
    ctx.moveTo(0.4 * L.s, -19.2 * L.s);
    ctx.lineTo(3.4 * L.s, -16.4 * L.s);
    ctx.moveTo(3.4 * L.s, -19.2 * L.s);
    ctx.lineTo(0.4 * L.s, -16.4 * L.s);
    ctx.stroke();
    for (i = 0; i < 3; i++) {
      a = G.clock * 4 + i * 2.1;
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 10 * L.s, -26 * L.s + Math.sin(a * 2) * 2 * L.s, 1.5 * L.s, 0, TAU);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = '#1a1020';
    ctx.beginPath();
    ctx.arc(2.6 * L.s, (c.goro ? -18.2 : -16.8) * L.s, 1.2 * L.s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(2.9 * L.s, (c.goro ? -18.5 : -17.1) * L.s, 0.4 * L.s, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = c.goro ? '#ff3a3a' : '#ff8a4a';
  ctx.beginPath();
  ctx.ellipse(4.2 * L.s, (c.goro ? -16 : -15) * L.s, 1.5 * L.s, 1.1 * L.s, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.5 * L.s;
  ctx.beginPath();
  ctx.moveTo((c.goro ? -8 : -5) * L.s, -6 * L.s);
  ctx.quadraticCurveTo(-14 * L.s, -8 * L.s, -11 * L.s, -2 * L.s);
  ctx.stroke();
  ctx.restore();
}

function drawFx() {
  var i, o, a;
  for (i = 0; i < particles.length; i++) {
    o = particles[i];
    a = clamp(o.t / (o.max || 0.3), 0, 1);
    ctx.fillStyle = rgba(o.rgb, a);
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), o.r * L.s * (0.6 + a), 0, TAU);
    ctx.fill();
  }
  ctx.lineCap = 'round';
  for (i = 0; i < sparks.length; i++) {
    o = sparks[i];
    ctx.strokeStyle = rgba(o.rgb, clamp(o.t * 5, 0, 1));
    ctx.lineWidth = 1.4 * L.s;
    ctx.beginPath();
    ctx.moveTo(sx(o.x), sy(o.y));
    ctx.lineTo(sx(o.x - o.vx * 0.04), sy(o.y - o.vy * 0.04));
    ctx.stroke();
  }
  for (i = 0; i < rings.length; i++) {
    o = rings[i];
    ctx.strokeStyle = rgba(o.rgb, 1 - o.t / 0.32);
    ctx.lineWidth = 2 * L.s;
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), o.r * L.s, 0, TAU);
    ctx.stroke();
  }
  for (i = 0; i < poofs.length; i++) {
    o = poofs[i];
    a = 1 - o.t / 0.28;
    ctx.strokeStyle = rgba(o.rgb, a);
    ctx.lineWidth = 2 * L.s;
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), (6 + o.t * 40) * L.s, 0, TAU);
    ctx.stroke();
  }
  ctx.font = '700 ' + Math.max(11, 12 * L.s) + 'px "Segoe UI","PingFang SC",sans-serif';
  ctx.textAlign = 'center';
  for (i = 0; i < floats.length; i++) {
    o = floats[i];
    ctx.fillStyle = rgba(o.rgb, 1 - o.t / 0.7);
    ctx.fillText(o.text, sx(o.x), sy(o.y));
  }
  ctx.textAlign = 'left';
}

function drawFlash() {
  var a;
  if (G.flash <= 0) return;
  ctx.fillStyle = rgba(G.flashRgb, clamp(G.flash * 2.2, 0, 0.28));
  ctx.fillRect(0, 0, cssW, cssH);
  if (G.micro > 0) {
    a = 0.06 + 0.04 * Math.sin(G.clock * 14);
    ctx.fillStyle = rgba(CYN, a);
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.strokeStyle = rgba(CYN, 0.12);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, (G.clock * 80 % cssH));
    ctx.lineTo(cssW, (G.clock * 80 % cssH));
    ctx.stroke();
  }
}

function draw() {
  var i, shx, shy;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  shx = (G.shake ? (Math.random() - 0.5) * G.shake : 0) + G.kickX;
  shy = (G.shake ? (Math.random() - 0.5) * G.shake * 0.6 : 0) + G.kickY;
  ctx.translate(shx, shy);
  drawBg();
  drawWells();
  drawFloors();
  drawDoors();
  for (i = 0; i < G.items.length; i++) drawItem(G.items[i]);
  for (i = 0; i < G.cats.length; i++) drawCat(G.cats[i]);
  drawMappy(G.player);
  drawFx();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawFlash();
}

function frame(ts) {
  var steps;
  requestAnimationFrame(frame);
  if (!lastTs) lastTs = ts;
  var dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (hidden) return;
  if (dt > 0.05) dt = 0.05;
  acc += dt;
  steps = 0;
  while (acc >= STEP && steps < 5) {
    acc -= STEP;
    if (G.stop > 0) G.stop -= STEP;
    else tick(STEP);
    steps += 1;
  }
  G.kickX *= 0.82;
  G.kickY *= 0.82;
  G.shake *= 0.86;
  if (G.flash > 0) G.flash -= dt;
  draw();
}

/* ---- input ---- */
function bindPad(el, setter, tap) {
  function down(ev) {
    ev.preventDefault();
    try { el.setPointerCapture(ev.pointerId); } catch (err) { /* ignore */ }
    setter(true);
    el.classList.add('held');
    audio.ensure();
    if (tap) tap();
  }
  function up(ev) {
    setter(false);
    el.classList.remove('held');
    if (ev) ev.preventDefault();
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
bindPad(btnDown, function (v) { keys.d = v; });
bindPad(btnDoor, function (v) {
  if (v) G.slamBuf = SLAM_BUF;
}, function () { /* tap already buffered */ });

function keyOn(e, down) {
  var k = e.code;
  if (k === 'ArrowLeft' || k === 'KeyA') { keys.l = down; e.preventDefault(); }
  else if (k === 'ArrowRight' || k === 'KeyD') { keys.r = down; e.preventDefault(); }
  else if (k === 'ArrowDown' || k === 'KeyS') { keys.d = down; e.preventDefault(); }
  else if (k === 'ArrowUp' || k === 'KeyW') {
    e.preventDefault();
  } else if (k === 'Space') {
    if (down) G.slamBuf = SLAM_BUF;
    e.preventDefault();
  }
}

window.addEventListener('keydown', function (e) {
  if (e.repeat) {
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
      startRun('search');
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      startRun('swarm');
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
      startRun('swarm');
      e.preventDefault();
      return;
    }
  }
  keyOn(e, true);
});

window.addEventListener('keyup', function (e) {
  keyOn(e, false);
});

btnMute.addEventListener('click', function () {
  audio.ensure();
  audio.setMuted(!audio.muted);
});
btnRetry.addEventListener('click', function () {
  audio.ensure();
  retry();
});
btnSearch.addEventListener('click', function () {
  audio.ensure();
  startRun('search');
});
btnSwarm.addEventListener('click', function () {
  audio.ensure();
  startRun('swarm');
});
ovRetry.addEventListener('click', function () {
  audio.ensure();
  startRun(G.kind);
});

var ptrHold = 0;
canvas.addEventListener('pointerdown', function (e) {
  var rect, nx;
  audio.ensure();
  try { canvas.focus({ preventScroll: true }); } catch (err) { /* ignore */ }
  if (G.mode !== 'play') return;
  rect = canvas.getBoundingClientRect();
  nx = (e.clientX - rect.left) / Math.max(1, rect.width);
  if (nx < 0.32) { keys.l = true; ptrHold = 1; }
  else if (nx > 0.68) { keys.r = true; ptrHold = 2; }
  else { G.slamBuf = SLAM_BUF; ptrHold = 0; }
});
canvas.addEventListener('pointerup', function () {
  if (ptrHold === 1) keys.l = false;
  if (ptrHold === 2) keys.r = false;
  ptrHold = 0;
});
canvas.addEventListener('pointercancel', function () {
  keys.l = false;
  keys.r = false;
  ptrHold = 0;
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

seedDust();
bestEl.textContent = String(G.bestS);
renderPips();
showTitle();
resize();
hudPlay();
modeLabel.textContent = '搜家';
requestAnimationFrame(frame);

}
