'use strict';

/* 汉堡 — BurgerTime-lite. No CDN. */

var WORLD_W = 400;
var WORLD_H = 500;
var LIVES = 3;
var PW = 12;
var PH = 20;
var WALK = 112;
var CLIMB = 96;
var LAYER_W = 54;
var LAYER_H = 12;
var DROP_V = 268;
var PEPPER_RANGE = 58;
var PEPPER_STUN = 3.18;
var MAX_PEPPER = 6;
var INVULN = 1.12;
var DIE_T = 0.68;
var COMBO_AGE = 1.52;
var STEP = 1 / 60;
var TAU = Math.PI * 2;
var BEST_KEY = 'playbox-burger-stack-best';
var MUTE_KEY = 'playbox-burger-stack-mute';
var YS = [448, 356, 264, 172, 80];
var KINDS = ['bot', 'patty', 'lettuce', 'top'];
var KIND_CN = { bot: '底包', patty: '肉饼', lettuce: '生菜', top: '顶包' };

var KITCHENS = [
  {
    plats: [
      [{ x0: 16, x1: 384 }],
      [{ x0: 16, x1: 384 }],
      [{ x0: 16, x1: 148 }, { x0: 168, x1: 232 }, { x0: 252, x1: 384 }],
      [{ x0: 16, x1: 384 }],
      [{ x0: 16, x1: 148 }, { x0: 168, x1: 232 }, { x0: 252, x1: 384 }]
    ],
    ladders: [
      { x: 40, lo: 0, hi: 4 },
      { x: 200, lo: 0, hi: 4 },
      { x: 360, lo: 0, hi: 4 },
      { x: 108, lo: 0, hi: 2 },
      { x: 292, lo: 2, hi: 4 }
    ],
    burgers: [
      { x: 88, floors: [1, 2, 3, 4] },
      { x: 200, floors: [1, 2, 3, 4] },
      { x: 312, floors: [1, 2, 3, 4] }
    ],
    shakers: [{ x: 200, floor: 3 }],
    enemies: [
      { type: 'sausage', x: 40, floor: 4 },
      { type: 'egg', x: 360, floor: 4 },
      { type: 'pickle', x: 40, floor: 0 }
    ],
    extra: [
      { type: 'sausage', x: 360, floor: 0 },
      { type: 'pickle', x: 108, floor: 2 }
    ],
    spawn: { x: 200, floor: 0 }
  },
  {
    plats: [
      [{ x0: 16, x1: 384 }],
      [{ x0: 16, x1: 384 }],
      [{ x0: 16, x1: 92 }, { x0: 112, x1: 192 }, { x0: 208, x1: 288 }, { x0: 308, x1: 384 }],
      [{ x0: 16, x1: 384 }],
      [{ x0: 16, x1: 92 }, { x0: 112, x1: 192 }, { x0: 208, x1: 288 }, { x0: 308, x1: 384 }]
    ],
    ladders: [
      { x: 48, lo: 0, hi: 4 },
      { x: 152, lo: 0, hi: 4 },
      { x: 248, lo: 0, hi: 4 },
      { x: 360, lo: 0, hi: 4 },
      { x: 80, lo: 1, hi: 3 },
      { x: 320, lo: 0, hi: 2 }
    ],
    burgers: [
      { x: 56, floors: [1, 2, 3, 4] },
      { x: 152, floors: [1, 2, 3, 4] },
      { x: 248, floors: [1, 2, 3, 4] },
      { x: 344, floors: [1, 2, 3, 4] }
    ],
    shakers: [{ x: 80, floor: 3 }, { x: 320, floor: 1 }],
    enemies: [
      { type: 'sausage', x: 48, floor: 4 },
      { type: 'egg', x: 360, floor: 4 },
      { type: 'pickle', x: 152, floor: 0 },
      { type: 'sausage', x: 248, floor: 2 }
    ],
    extra: [
      { type: 'pickle', x: 48, floor: 1 },
      { type: 'egg', x: 344, floor: 0 }
    ],
    spawn: { x: 200, floor: 0 }
  },
  {
    plats: [
      [{ x0: 16, x1: 384 }],
      [{ x0: 16, x1: 184 }, { x0: 216, x1: 384 }],
      [{ x0: 16, x1: 384 }],
      [{ x0: 16, x1: 184 }, { x0: 216, x1: 384 }],
      [{ x0: 16, x1: 384 }]
    ],
    ladders: [
      { x: 36, lo: 0, hi: 4 },
      { x: 364, lo: 0, hi: 4 },
      { x: 164, lo: 0, hi: 2 },
      { x: 236, lo: 2, hi: 4 },
      { x: 100, lo: 2, hi: 4 },
      { x: 300, lo: 0, hi: 2 }
    ],
    burgers: [
      { x: 80, floors: [1, 2, 3, 4] },
      { x: 148, floors: [1, 4, 3, 2] },
      { x: 252, floors: [1, 2, 3, 4] },
      { x: 328, floors: [1, 4, 3, 2] }
    ],
    shakers: [{ x: 200, floor: 2 }],
    enemies: [
      { type: 'egg', x: 36, floor: 4 },
      { type: 'sausage', x: 364, floor: 4 },
      { type: 'pickle', x: 36, floor: 0 },
      { type: 'sausage', x: 300, floor: 1 },
      { type: 'pickle', x: 100, floor: 3 }
    ],
    extra: [
      { type: 'egg', x: 252, floor: 0 },
      { type: 'pickle', x: 328, floor: 4 }
    ],
    spawn: { x: 80, floor: 0 }
  },
  {
    plats: [
      [{ x0: 16, x1: 384 }],
      [{ x0: 16, x1: 130 }, { x0: 154, x1: 246 }, { x0: 270, x1: 384 }],
      [{ x0: 16, x1: 384 }],
      [{ x0: 16, x1: 130 }, { x0: 154, x1: 246 }, { x0: 270, x1: 384 }],
      [{ x0: 16, x1: 384 }]
    ],
    ladders: [
      { x: 40, lo: 0, hi: 4 },
      { x: 200, lo: 0, hi: 4 },
      { x: 360, lo: 0, hi: 4 },
      { x: 108, lo: 0, hi: 2 },
      { x: 292, lo: 2, hi: 4 },
      { x: 108, lo: 3, hi: 4 },
      { x: 292, lo: 0, hi: 1 }
    ],
    burgers: [
      { x: 76, floors: [1, 2, 3, 4] },
      { x: 200, floors: [1, 2, 3, 4] },
      { x: 324, floors: [1, 2, 3, 4] }
    ],
    shakers: [{ x: 200, floor: 4 }, { x: 40, floor: 2 }],
    enemies: [
      { type: 'pickle', x: 40, floor: 4 },
      { type: 'egg', x: 360, floor: 4 },
      { type: 'sausage', x: 324, floor: 0 },
      { type: 'sausage', x: 108, floor: 3 },
      { type: 'egg', x: 292, floor: 1 }
    ],
    extra: [
      { type: 'pickle', x: 76, floor: 2 },
      { type: 'sausage', x: 360, floor: 0 }
    ],
    spawn: { x: 200, floor: 0 }
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

function floorY(i) {
  return YS[i];
}

function kitchenIndex(round) {
  return (Math.max(1, round) - 1) % KITCHENS.length;
}

function startPeppers(extra) {
  return extra ? 4 : 5;
}

function roundMul(round) {
  return 1 + Math.max(0, round - 1) * 0.12;
}

function enemySpeed(type, round, extra) {
  var base = type === 'pickle' ? 72 : type === 'egg' ? 48 : 58;
  return base * roundMul(round) * (extra ? 1.34 : 1);
}

function respawnT(extra, round) {
  var t = (extra ? 1.65 : 2.4) / (1 + Math.max(0, round - 1) * 0.08);
  return t < 1.05 ? 1.05 : t;
}

function crushScore(n) {
  var s = 100;
  var i;
  for (i = 0; i < n; i++) s *= 2;
  return s > 1600 ? 1600 : s;
}

function comboMul(c) {
  return Math.max(1, c);
}

function inPepperCone(px, face, py, ex, ey) {
  var dx = (ex - px) * face;
  if (dx < 8 || dx > PEPPER_RANGE) return false;
  if (Math.abs(ey - py) > 24) return false;
  return true;
}

function hitsChef(px, py, ex, ey) {
  return Math.abs(px - ex) < 11 && Math.abs(py - ey) < 15;
}

function layerHitsEnemy(lx, ly, ex, ey) {
  return Math.abs(lx - ex) < LAYER_W * 0.52 && ey >= ly - 18 && ey <= ly + 10;
}

function platIndex(kit, floor, x) {
  var plats, i;
  if (!kit || floor < 0 || floor >= kit.plats.length) return -1;
  plats = kit.plats[floor];
  for (i = 0; i < plats.length; i++) {
    if (x >= plats[i].x0 - 2 && x <= plats[i].x1 + 2) return i;
  }
  return -1;
}

function platformAt(kit, floor, x) {
  var i = platIndex(kit, floor, x);
  return i < 0 ? null : kit.plats[floor][i];
}

function walkClamp(kit, floor, x) {
  var p = platformAt(kit, floor, x);
  if (!p) return x;
  return clamp(x, p.x0 + 6, p.x1 - 6);
}

function nearestFloor(y) {
  var i, best = 0, bd = 1e9, d;
  for (i = 0; i < YS.length; i++) {
    d = Math.abs(YS[i] - y);
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}

function ladderAt(kit, x, y, dir) {
  var i, L, top, bot;
  for (i = 0; i < kit.ladders.length; i++) {
    L = kit.ladders[i];
    if (Math.abs(x - L.x) > 10) continue;
    top = floorY(L.hi);
    bot = floorY(L.lo);
    if (dir < 0) {
      if (y > top + 4 && y <= bot + 8) return L;
    } else if (dir > 0) {
      if (y < bot - 4 && y >= top - 8) return L;
    } else if (y >= top - 8 && y <= bot + 8) return L;
  }
  return null;
}

function ladderOnFloor(kit, L, floor) {
  return floor >= L.lo && floor <= L.hi && platIndex(kit, floor, L.x) >= 0;
}

function reachable(kit, sx, sf, tx, tf) {
  var startPi = platIndex(kit, sf, sx);
  var goalPi = platIndex(kit, tf, tx);
  var start, goal, seen, q, cur, parts, f, pi, plat, i, L, nf, npi, key;
  if (startPi < 0 || goalPi < 0) return false;
  start = sf + ':' + startPi;
  goal = tf + ':' + goalPi;
  if (start === goal) return true;
  seen = {};
  q = [start];
  seen[start] = true;
  while (q.length) {
    cur = q.shift();
    if (cur === goal) return true;
    parts = cur.split(':');
    f = +parts[0];
    pi = +parts[1];
    plat = kit.plats[f][pi];
    for (i = 0; i < kit.ladders.length; i++) {
      L = kit.ladders[i];
      if (L.x < plat.x0 - 2 || L.x > plat.x1 + 2) continue;
      if (f < L.lo || f > L.hi) continue;
      for (nf = L.lo; nf <= L.hi; nf++) {
        if (nf === f) continue;
        npi = platIndex(kit, nf, L.x);
        if (npi < 0) continue;
        key = nf + ':' + npi;
        if (!seen[key]) {
          seen[key] = true;
          q.push(key);
        }
      }
    }
  }
  return false;
}

function makeLayer(col, x, floor, kind) {
  return {
    col: col,
    x: x,
    floor: floor,
    dest: floor,
    kind: kind,
    y: floorY(floor),
    state: 'sit',
    left: false,
    right: false,
    squash: 1,
    wobble: 0,
    crushN: 0,
    plateI: 0
  };
}

function makeEnemy(type, x, floor) {
  return {
    type: type,
    x: x,
    y: floorY(floor),
    floor: floor,
    dir: x < WORLD_W * 0.5 ? 1 : -1,
    face: x < WORLD_W * 0.5 ? 1 : -1,
    state: 'walk',
    stun: 0,
    dead: 0,
    climbL: null,
    climbDir: 0,
    walk: 0,
    spawnX: x,
    spawnFloor: floor
  };
}

function makePlayer(spawn) {
  return {
    x: spawn.x,
    y: floorY(spawn.floor),
    face: 1,
    floor: spawn.floor,
    state: 'walk',
    walk: 0,
    squash: 1,
    inv: 0,
    deadT: 0,
    climbL: null,
    climbDir: 0,
    pepperT: 0
  };
}

function makeShaker(x, floor) {
  return { x: x, floor: floor, taken: false, bob: rand(0, TAU) };
}

function specKitchen(round, extra) {
  var src = KITCHENS[kitchenIndex(round)];
  var kit = {
    plats: src.plats,
    ladders: src.ladders,
    burgers: src.burgers,
    shakers: src.shakers,
    enemies: src.enemies.slice(),
    spawn: src.spawn,
    extra: extra
  };
  if (extra) {
    kit.enemies = src.enemies.concat(src.extra);
    if (round >= 3) kit.enemies = kit.enemies.concat([{ type: 'pickle', x: src.spawn.x, floor: 4 }]);
  }
  return kit;
}

function stompSide(layer, px) {
  var local = px - layer.x;
  if (local < -7) return -1;
  if (local > 7) return 1;
  return 0;
}

function applyStomp(layer, side) {
  if (side < 0) {
    if (layer.left) return false;
    layer.left = true;
    return true;
  }
  if (side > 0) {
    if (layer.right) return false;
    layer.right = true;
    return true;
  }
  return false;
}

function readyToDrop(layer) {
  return layer.state === 'sit' && layer.left && layer.right;
}

function sittingAt(layers, col, floor) {
  var i, L;
  for (i = 0; i < layers.length; i++) {
    L = layers[i];
    if (L.col === col && L.floor === floor && L.state === 'sit') return L;
  }
  return null;
}

function nextLandFloor(kit, layers, col, x, fromFloor) {
  var f = fromFloor - 1;
  while (f > 0) {
    if (sittingAt(layers, col, f) || platformAt(kit, f, x)) return f;
    f--;
  }
  return 0;
}

function platedCount(layers, col) {
  var n = 0, i;
  for (i = 0; i < layers.length; i++) {
    if (layers[i].col === col && layers[i].state === 'plate') n++;
  }
  return n;
}

function allPlated(layers) {
  var i;
  for (i = 0; i < layers.length; i++) {
    if (layers[i].state !== 'plate') return false;
  }
  return layers.length > 0;
}

function burgerDone(layers, col, need) {
  return platedCount(layers, col) >= need;
}

function bestLadder(kit, e, wantFloor) {
  var best = null, bestSc = 1e9, i, L, plat, dist, align, sc, goingUp;
  goingUp = wantFloor > e.floor;
  plat = platformAt(kit, e.floor, e.x);
  if (!plat) return null;
  for (i = 0; i < kit.ladders.length; i++) {
    L = kit.ladders[i];
    if (L.x < plat.x0 - 2 || L.x > plat.x1 + 2) continue;
    if (!ladderOnFloor(kit, L, e.floor)) continue;
    if (goingUp && L.hi <= e.floor) continue;
    if (!goingUp && L.lo >= e.floor) continue;
    dist = Math.abs(L.x - e.x);
    align = Math.abs(L.x - (wantFloor === e.floor ? e.x : L.x)) * 0.05;
    sc = dist + align;
    if (e.type === 'egg') sc -= 12;
    if (sc < bestSc) {
      bestSc = sc;
      best = L;
    }
  }
  return best;
}

function selfCheck() {
  var k1, k1x, i, j, b, L, layer, kit, layers, sit, p, fi;

  if (YS.length !== 5) throw new Error('5 floors');
  if (LIVES !== 3) throw new Error('3 lives');
  if (KITCHENS.length < 3) throw new Error('several kitchens');
  if (startPeppers(true) >= startPeppers(false)) throw new Error('extra fewer peppers');
  if (enemySpeed('sausage', 1, true) <= enemySpeed('sausage', 1, false)) throw new Error('extra faster');
  if (enemySpeed('sausage', 2, false) <= enemySpeed('sausage', 1, false)) throw new Error('round speeds');
  if (crushScore(0) !== 100 || crushScore(1) !== 200 || crushScore(2) !== 400) throw new Error('crush chain');
  if (comboMul(3) < comboMul(1)) throw new Error('combo mul');
  if (respawnT(true, 1) >= respawnT(false, 1)) throw new Error('extra respawn');

  if (!inPepperCone(100, 1, 200, 140, 200)) throw new Error('pepper front');
  if (inPepperCone(100, 1, 200, 70, 200)) throw new Error('pepper behind');
  if (inPepperCone(100, -1, 200, 140, 200)) throw new Error('pepper face');
  if (inPepperCone(100, 1, 200, 140, 280)) throw new Error('pepper far y');
  if (!hitsChef(100, 200, 106, 204)) throw new Error('touch hit');
  if (hitsChef(100, 200, 160, 200)) throw new Error('touch miss');
  if (!layerHitsEnemy(200, 172, 210, 172)) throw new Error('crush hit');
  if (layerHitsEnemy(200, 172, 280, 172)) throw new Error('crush miss');

  k1 = specKitchen(1, false);
  k1x = specKitchen(1, true);
  if (k1.burgers.length < 3) throw new Error('3 burgers k1');
  if (k1x.enemies.length <= k1.enemies.length) throw new Error('extra more enemies');
  if (k1.plats.length !== 5) throw new Error('5 plat rows');
  if (!reachable(k1, k1.spawn.x, k1.spawn.floor, k1.burgers[0].x, 4)) throw new Error('reach burger 0');
  if (!reachable(k1, k1.spawn.x, k1.spawn.floor, k1.burgers[1].x, 4)) throw new Error('reach burger 1');
  if (!reachable(k1, k1.spawn.x, k1.spawn.floor, k1.burgers[2].x, 4)) throw new Error('reach burger 2');

  for (i = 0; i < KITCHENS.length; i++) {
    kit = specKitchen(i + 1, false);
    if (kit.ladders.length < 4) throw new Error('ladders kitchen ' + i);
    for (j = 0; j < kit.ladders.length; j++) {
      L = kit.ladders[j];
      if (L.lo >= L.hi) throw new Error('ladder span ' + i + '/' + j);
      if (platIndex(kit, L.lo, L.x) < 0) throw new Error('ladder lo plat ' + i + '/' + j);
      if (platIndex(kit, L.hi, L.x) < 0) throw new Error('ladder hi plat ' + i + '/' + j);
    }
    for (j = 0; j < kit.burgers.length; j++) {
      b = kit.burgers[j];
      if (b.floors.length !== 4) throw new Error('4 layers');
      for (fi = 0; fi < 4; fi++) {
        if (platIndex(kit, b.floors[fi], b.x) < 0) throw new Error('layer plat ' + i + '/' + j + '/' + fi);
        if (!reachable(kit, kit.spawn.x, kit.spawn.floor, b.x, b.floors[fi])) {
          throw new Error('unreachable layer ' + i + '/' + j + '/' + fi);
        }
      }
    }
  }

  layer = makeLayer(0, 88, 3, 'patty');
  if (stompSide(layer, 88) !== 0) throw new Error('center no stomp');
  if (stompSide(layer, 70) !== -1) throw new Error('left half');
  if (stompSide(layer, 106) !== 1) throw new Error('right half');
  if (!applyStomp(layer, -1) || !layer.left) throw new Error('stamp left');
  if (applyStomp(layer, -1)) throw new Error('left once');
  if (readyToDrop(layer)) throw new Error('need both');
  applyStomp(layer, 1);
  if (!readyToDrop(layer)) throw new Error('both drop');

  kit = specKitchen(1, false);
  layers = [
    makeLayer(0, 88, 3, 'lettuce'),
    makeLayer(0, 88, 2, 'patty')
  ];
  if (nextLandFloor(kit, layers, 0, 88, 3) !== 2) throw new Error('land on sitting');
  sit = sittingAt(layers, 0, 2);
  if (!sit || sit.kind !== 'patty') throw new Error('sitting find');
  if (nextLandFloor(kit, [], 0, 88, 1) !== 0) throw new Error('plate dest');

  layers[0].state = 'plate';
  layers[1].state = 'plate';
  if (!allPlated(layers)) throw new Error('all plated');
  if (!burgerDone(layers, 0, 2)) throw new Error('burger done');

  p = makePlayer(k1.spawn);
  if (p.floor !== 0) throw new Error('spawn floor');
  if (walkClamp(k1, 0, 20) !== 22) throw new Error('walk clamp');
  if (walkClamp(k1, 0, 200) !== 200) throw new Error('walk mid');

  kit = specKitchen(1, false);
  layers = [
    makeLayer(0, 88, 3, 'lettuce'),
    makeLayer(0, 88, 2, 'patty'),
    makeLayer(0, 88, 1, 'bot')
  ];
  applyStomp(layers[0], -1);
  applyStomp(layers[0], 1);
  if (!readyToDrop(layers[0])) throw new Error('stomp both');
  if (nextLandFloor(kit, layers, 0, 88, 3) !== 2) throw new Error('drop onto patty');
  layers[0].state = 'drop';
  layers[1].state = 'drop';
  if (nextLandFloor(kit, layers, 0, 88, 2) !== 1) throw new Error('cascade onto bun');
  layers[2].state = 'drop';
  if (nextLandFloor(kit, layers, 0, 88, 1) !== 0) throw new Error('cascade to plate');
  layers[0].state = 'plate';
  layers[1].state = 'plate';
  layers[2].state = 'plate';
  if (!allPlated(layers)) throw new Error('stack plated');

  if (KIND_CN.patty !== '肉饼') throw new Error('cn kinds');
  if (kitchenIndex(5) !== kitchenIndex(1)) throw new Error('cycle kitchens');
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
var btnKitchen = document.getElementById('btn-kitchen');
var btnExtra = document.getElementById('btn-extra');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var btnLeft = document.getElementById('btn-left');
var btnRight = document.getElementById('btn-right');
var btnUp = document.getElementById('btn-up');
var btnDown = document.getElementById('btn-down');
var btnPepper = document.getElementById('btn-pepper');
var scoreEl = document.getElementById('score');
var roundEl = document.getElementById('round');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var comboBox = document.getElementById('combo-box');
var scoreBox = document.getElementById('score-box');
var scoreAdd = document.getElementById('score-add');
var modeLabel = document.getElementById('mode-label');
var pepperBar = document.getElementById('pepper-bar');
var pepperN = document.getElementById('pepper-n');
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
var clouds = [];

var keys = { l: false, r: false, u: false, d: false };
var G = {
  mode: 'title',
  kind: 'kitchen',
  extra: false,
  clock: 0,
  round: 1,
  lives: LIVES,
  score: 0,
  bestK: 0,
  bestX: 0,
  combo: 0,
  maxCombo: 0,
  comboAge: 0,
  peppers: 5,
  player: makePlayer({ x: 200, floor: 0 }),
  kit: specKitchen(1, false),
  layers: [],
  enemies: [],
  shakers: [],
  stop: 0,
  shake: 0,
  kickX: 0,
  kickY: 0,
  flash: 0,
  flashRgb: [255, 122, 41],
  clearT: 0,
  lock: 0,
  sprayT: 0,
  why: '',
  paused: false
};

function reduceMotion() {
  return motionQ.matches;
}

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
      this.master.gain.value = this.muted ? 0 : 0.34;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  setMuted: function (m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.34;
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
  stomp: function () {
    this.ensure();
    this.noise(0.05, 0.05, 320, 'lowpass');
    this.beep(180, 0.05, 'square', 0.035, 90);
  },
  drop: function () {
    this.ensure();
    this.beep(240, 0.1, 'square', 0.06, 90);
    this.noise(0.08, 0.07, 180, 'lowpass');
  },
  land: function () {
    this.ensure();
    this.noise(0.07, 0.07, 240, 'bandpass');
    this.beep(140, 0.06, 'sine', 0.04, 70);
  },
  plate: function () {
    this.ensure();
    this.beep(392, 0.07, 'triangle', 0.05, 523);
    this.beep(523, 0.1, 'square', 0.04, 784);
  },
  crush: function (n) {
    this.ensure();
    var p = 1 + Math.min(5, n) * 0.08;
    this.noise(0.14, 0.13, 220, 'lowpass');
    this.beep(160 * p, 0.12, 'square', 0.07, 60);
    this.beep(480 * p, 0.09, 'sawtooth', 0.035, 160);
  },
  pepper: function () {
    this.ensure();
    this.noise(0.16, 0.1, 2400, 'highpass');
    this.beep(880, 0.05, 'square', 0.03, 420);
  },
  deny: function () {
    this.ensure();
    this.beep(140, 0.08, 'square', 0.04, 80);
  },
  die: function () {
    this.ensure();
    this.noise(0.16, 0.11, 280, 'lowpass');
    this.beep(320, 0.22, 'sawtooth', 0.06, 70);
    this.beep(180, 0.18, 'square', 0.04, 50);
  },
  climb: function () {
    this.ensure();
    this.beep(260, 0.03, 'square', 0.016, 300);
  },
  pickup: function () {
    this.ensure();
    this.beep(520, 0.08, 'triangle', 0.06, 880);
    this.beep(780, 0.12, 'square', 0.04, 1180);
  },
  clear: function () {
    this.ensure();
    this.beep(392, 0.1, 'square', 0.06, 523);
    this.beep(523, 0.12, 'square', 0.055, 659);
    this.beep(784, 0.2, 'triangle', 0.05, 1046);
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
  },
  burger: function () {
    this.ensure();
    this.beep(523, 0.08, 'square', 0.05, 659);
    this.beep(784, 0.14, 'triangle', 0.05, 1046);
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
      G.bestK = o.k | 0;
      G.bestX = o.x | 0;
      return;
    }
    if (typeof o === 'number') {
      G.bestK = o | 0;
      G.bestX = o | 0;
    }
  } catch (e) { /* ignore */ }
}

function persistBest() {
  var cur = G.extra ? G.bestX : G.bestK;
  if (G.score > cur) {
    if (G.extra) G.bestX = G.score;
    else G.bestK = G.score;
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ k: G.bestK, x: G.bestX }));
  } catch (e) { /* ignore */ }
}

function currentBest() {
  return G.extra ? G.bestX : G.bestK;
}

loadBest();

function hitStop(t) {
  if (reduceMotion()) return;
  if (t > G.stop) G.stop = t;
}

function shake(n) {
  if (reduceMotion()) return;
  G.shake = Math.max(G.shake, n);
}

function kick(n) {
  if (reduceMotion()) return;
  G.kickX = (Math.random() < 0.5 ? -1 : 1) * n;
  G.kickY = -n * 0.4;
  stageEl.classList.remove('hop');
  void stageEl.offsetWidth;
  stageEl.classList.add('hop');
  clearTimeout(kickTok);
  kickTok = setTimeout(function () { stageEl.classList.remove('hop'); }, 180);
}

function smashKick() {
  if (reduceMotion()) return;
  stageEl.classList.remove('smash');
  void stageEl.offsetWidth;
  stageEl.classList.add('smash');
  clearTimeout(kickTok);
  kickTok = setTimeout(function () { stageEl.classList.remove('smash'); }, 220);
}

function flash(rgb, t) {
  G.flashRgb = rgb;
  G.flash = t;
}

function burst(x, y, n, rgb, spd, life, grav) {
  var i, a;
  for (i = 0; i < n; i++) {
    a = rand(0, TAU);
    particles.push({
      x: x, y: y,
      vx: Math.cos(a) * rand(spd * 0.3, spd),
      vy: Math.sin(a) * rand(spd * 0.3, spd) - 30,
      t: rand(life * 0.5, life),
      max: life,
      r: rand(1.2, 2.8),
      rgb: rgb,
      g: grav == null ? 220 : grav
    });
  }
}

function dust(x, y) {
  burst(x, y, 7, [255, 186, 120], 46, 0.28, 180);
}

function spark(x, y, rgb, n) {
  var i;
  for (i = 0; i < n; i++) {
    sparks.push({
      x: x, y: y,
      vx: rand(-1, 1) * 50,
      vy: rand(-80, -20),
      t: rand(0.12, 0.28),
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

function shatter(x, y, rgb) {
  var i, a;
  for (i = 0; i < 10; i++) {
    a = (i / 10) * TAU + rand(-0.2, 0.2);
    shards.push({
      x: x, y: y,
      vx: Math.cos(a) * rand(40, 120),
      vy: Math.sin(a) * rand(30, 90) - 50,
      rot: rand(0, TAU),
      vr: rand(-10, 10),
      t: rand(0.28, 0.52),
      w: rand(3, 7),
      rgb: rgb || [196, 90, 24]
    });
  }
}

function puffCloud(x, y, face) {
  var i;
  for (i = 0; i < 14; i++) {
    clouds.push({
      x: x + face * rand(6, 28),
      y: y + rand(-14, 8),
      vx: face * rand(40, 90),
      vy: rand(-24, 18),
      r: rand(4, 9),
      t: rand(0.18, 0.38),
      max: 0.38
    });
  }
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
  if (x != null) floatText(x, y - 18, label || ('+' + n), [255, 227, 107]);
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
    toast(G.combo >= 10 ? '连踩 ×' + G.combo : '连踩', false, true);
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

function syncPepper() {
  var p = clamp(G.peppers / MAX_PEPPER, 0, 1);
  pepperBar.style.transform = 'scaleX(' + p + ')';
  pepperBar.classList.toggle('on', G.peppers > 0);
  pepperN.textContent = String(G.peppers);
}

function hudPlay() {
  scoreEl.textContent = String(G.score);
  roundEl.textContent = String(G.round);
  bestEl.textContent = String(currentBest());
  comboEl.textContent = '×' + Math.max(1, G.combo);
  renderPips();
  modeLabel.textContent = G.extra ? '加料' : '厨房';
  modeLabel.classList.toggle('extra', G.extra);
  syncPepper();
  if (G.mode === 'play') {
    hintEl.textContent = G.extra
      ? '加料赶工 · 踩料掉层 · 空格胡椒 · R 重开'
      : '踩料掉层 · 胡椒冻敌 · 叠满过关 · 碰到敌人丢命';
  }
}

function resetFx() {
  particles.length = 0;
  sparks.length = 0;
  floats.length = 0;
  rings.length = 0;
  shards.length = 0;
  clouds.length = 0;
  G.stop = 0;
  G.shake = 0;
  G.kickX = 0;
  G.kickY = 0;
  G.flash = 0;
}

function buildLevel(round, extra) {
  var spec = specKitchen(round, extra);
  var layers = [];
  var enemies = [];
  var shakers = [];
  var i, j, b, e, s;
  for (i = 0; i < spec.burgers.length; i++) {
    b = spec.burgers[i];
    for (j = 0; j < 4; j++) {
      layers.push(makeLayer(i, b.x, b.floors[j], KINDS[j]));
    }
  }
  for (i = 0; i < spec.enemies.length; i++) {
    e = spec.enemies[i];
    enemies.push(makeEnemy(e.type, e.x, e.floor));
  }
  for (i = 0; i < spec.shakers.length; i++) {
    s = spec.shakers[i];
    shakers.push(makeShaker(s.x, s.floor));
  }
  return { kit: spec, layers: layers, enemies: enemies, shakers: shakers };
}

function resetLevel(attract) {
  var built = buildLevel(attract ? 1 : G.round, attract ? false : G.extra);
  G.kit = built.kit;
  G.layers = built.layers;
  G.enemies = built.enemies;
  G.shakers = built.shakers;
  G.player = makePlayer(G.kit.spawn);
  if (!attract) G.player.inv = 0.9;
  G.clearT = 0;
  G.combo = attract ? 0 : G.combo;
  G.comboAge = 0;
  G.sprayT = 0;
  if (!attract) resetFx();
}

function showTitle() {
  G.mode = 'title';
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel';
  ovTitle.textContent = '汉堡';
  ovLead.textContent = '多层厨房，踩过面包、肉饼、生菜，料就掉下一层。砸到敌人身上碾碎。胡椒能冻住他们。全部叠到盘子里过关。';
  ovOps.textContent = '方向键或 WASD 走 / 爬梯 · 空格胡椒 · 触屏方向+椒 · R 重开 · M 静音';
  ovStart.classList.remove('gone');
  ovEnd.classList.add('gone');
  hintEl.textContent = '踩料掉层 · 胡椒冻敌 · 叠满过关 · 碰到敌人丢命';
  resetLevel(true);
}

function showOver() {
  G.mode = 'over';
  persistBest();
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  panelEl.className = 'panel lose';
  ovTitle.textContent = '糊了';
  ovLead.textContent = '第 ' + G.round + ' 厨 · ' + G.score + ' 分 · 连踩最高 ×' + G.maxCombo +
    (G.why ? ' · ' + whyText(G.why) : '');
  ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
  ovStart.classList.add('gone');
  ovEnd.classList.remove('gone');
  audio.over();
  ovRetry.focus();
}

function whyText(w) {
  if (w === 'egg') return '撞上蛋了';
  if (w === 'sausage') return '撞上肠了';
  if (w === 'pickle') return '撞上瓜了';
  return '';
}

function startRun(kind) {
  G.kind = kind;
  G.extra = kind === 'extra';
  G.mode = 'play';
  G.clock = 0;
  G.round = 1;
  G.lives = LIVES;
  G.score = 0;
  G.combo = 0;
  G.maxCombo = 0;
  G.comboAge = 0;
  G.why = '';
  G.lock = 0;
  G.peppers = startPeppers(G.extra);
  resetLevel(false);
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  panelEl.className = 'panel';
  audio.start();
  hudPlay();
  toast(G.extra ? '加料' : '出餐', false, !G.extra);
  canvas.focus({ preventScroll: true });
}

function retry() {
  audio.ui();
  if (G.mode === 'title') startRun('kitchen');
  else startRun(G.kind);
}

function nextRound() {
  G.round += 1;
  persistBest();
  G.peppers = Math.min(MAX_PEPPER, G.peppers + 1);
  resetLevel(false);
  hudPlay();
  toast('第 ' + G.round + ' 厨', false, true);
  audio.start();
}

function layersNeeded(col) {
  return 4;
}

function startDrop(layer) {
  var dest;
  if (layer.state === 'drop' || layer.state === 'plate') return;
  dest = nextLandFloor(G.kit, G.layers, layer.col, layer.x, layer.floor);
  layer.state = 'drop';
  layer.dest = dest;
  layer.crushN = 0;
  layer.squash = 0.42;
  layer.wobble = 0;
}

function plateLayer(layer) {
  var n, i, done;
  layer.state = 'plate';
  layer.floor = 0;
  n = platedCount(G.layers, layer.col);
  layer.plateI = n - 1;
  layer.y = floorY(0) + 26 - layer.plateI * 10;
  layer.squash = 1.2;
  if (G.mode === 'play') {
    bumpCombo();
    addScore(100 * comboMul(G.combo), layer.x, layer.y, '+' + (100 * comboMul(G.combo)));
    audio.plate();
    burst(layer.x, layer.y, 10, [255, 227, 107], 70, 0.36, 160);
    ringAt(layer.x, layer.y, [255, 227, 107]);
    hitStop(0.045);
    if (burgerDone(G.layers, layer.col, layersNeeded(layer.col))) {
      done = true;
      for (i = 0; i < G.layers.length; i++) {
        if (G.layers[i].col === layer.col && G.layers[i].state !== 'plate') done = false;
      }
      if (done) {
        addScore(400, layer.x, layer.y - 24, '完成');
        audio.burger();
        toast('一只汉堡', false, true);
        kick(3);
      }
    }
  }
}

function landLayer(layer) {
  var sit, dest;
  if (layer.dest <= 0) {
    plateLayer(layer);
    return;
  }
  sit = sittingAt(G.layers, layer.col, layer.dest);
  if (sit) {
    startDrop(sit);
    layer.floor = layer.dest;
    dest = nextLandFloor(G.kit, G.layers, layer.col, layer.x, layer.floor);
    layer.dest = dest;
    layer.squash = 0.5;
    if (G.mode === 'play') {
      spark(layer.x, layer.y, [255, 186, 80], 6);
      hitStop(0.04);
      audio.land();
    }
    return;
  }
  layer.floor = layer.dest;
  layer.y = floorY(layer.floor);
  layer.state = 'sit';
  layer.left = false;
  layer.right = false;
  layer.squash = 1.28;
  if (G.mode === 'play') {
    audio.land();
    dust(layer.x, layer.y);
    hitStop(0.038);
    kick(1.6);
  }
}

function crushEnemy(e, layer) {
  var sc, rgb;
  if (e.dead > 0) return;
  e.dead = respawnT(G.extra, G.round);
  e.state = 'dead';
  e.stun = 0;
  rgb = e.type === 'egg' ? [244, 236, 220] : e.type === 'pickle' ? [61, 204, 106] : [196, 90, 40];
  if (G.mode === 'play') {
    sc = crushScore(layer.crushN) * comboMul(Math.max(1, G.combo));
    layer.crushN += 1;
    bumpCombo();
    addScore(sc, e.x, e.y, '+' + sc);
    audio.crush(layer.crushN);
    burst(e.x, e.y - 8, 16, rgb, 110, 0.42, 200);
    shatter(e.x, e.y - 6, rgb);
    ringAt(e.x, e.y - 8, [255, 122, 41]);
    hitStop(0.07);
    shake(7);
    smashKick();
    flash([255, 186, 80], 0.12);
  }
}

function tryPepper() {
  var i, e, px, py;
  if (G.mode === 'title') {
    startRun('kitchen');
    return;
  }
  if (G.mode === 'over') {
    startRun(G.kind);
    return;
  }
  if (G.mode !== 'play') return;
  if (G.lock > 0 || G.clearT > 0) return;
  if (G.player.state === 'dead') return;
  if (G.peppers <= 0) {
    audio.deny();
    toast('没胡椒了', true, false);
    return;
  }
  G.peppers -= 1;
  G.sprayT = 0.3;
  G.player.pepperT = 0.22;
  px = G.player.x;
  py = G.player.y;
  puffCloud(px + G.player.face * 16, py - 10, G.player.face);
  audio.pepper();
  flash([255, 227, 107], 0.08);
  hitStop(0.03);
  for (i = 0; i < G.enemies.length; i++) {
    e = G.enemies[i];
    if (e.dead > 0) continue;
    if (inPepperCone(px, G.player.face, py, e.x, e.y)) {
      e.stun = PEPPER_STUN;
      e.state = e.state === 'climb' ? 'climb' : 'walk';
      burst(e.x, e.y - 10, 8, [255, 227, 107], 50, 0.28, 80);
      floatText(e.x, e.y - 22, '冻', [255, 227, 107]);
    }
  }
  hudPlay();
}

function killPlayer(why) {
  var p = G.player;
  if (p.state === 'dead' || p.inv > 0 || G.clearT > 0) return;
  if (G.mode !== 'play') return;
  p.state = 'dead';
  p.deadT = DIE_T;
  G.lock = DIE_T;
  G.why = why;
  G.lives -= 1;
  renderPips();
  G.combo = 0;
  G.comboAge = 0;
  audio.die();
  flash([255, 61, 184], 0.2);
  hitStop(0.08);
  shake(10);
  stageEl.classList.remove('die');
  void stageEl.offsetWidth;
  stageEl.classList.add('die');
  burst(p.x, p.y - 10, 14, [255, 61, 184], 90, 0.4, 180);
  if (reduceMotion()) stageEl.classList.remove('die');
}

function respawnPlayer() {
  if (G.mode !== 'play') return;
  if (G.lives <= 0) {
    showOver();
    return;
  }
  G.player = makePlayer(G.kit.spawn);
  G.player.inv = INVULN;
  G.lock = 0.15;
  toast('小心', true, false);
  hudPlay();
}

function maybeClear() {
  if (G.mode !== 'play' || G.clearT > 0) return;
  if (!allPlated(G.layers)) return;
  G.clearT = 1.15;
  addScore(1000 + 200 * G.round, G.player.x, G.player.y - 20, '出餐');
  audio.clear();
  toast('出餐', false, true);
  flash([255, 227, 107], 0.18);
  kick(4);
  stageEl.classList.remove('clear');
  void stageEl.offsetWidth;
  stageEl.classList.add('clear');
}

function tickFx(dt) {
  var i, o;
  G.flash = Math.max(0, G.flash - dt);
  G.shake *= Math.pow(0.001, dt);
  if (G.shake < 0.2) G.shake = 0;
  G.kickX *= Math.pow(0.0004, dt);
  G.kickY *= Math.pow(0.0004, dt);
  for (i = particles.length - 1; i >= 0; i--) {
    o = particles[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.vy += o.g * dt;
    if (o.t <= 0) particles.splice(i, 1);
  }
  for (i = sparks.length - 1; i >= 0; i--) {
    o = sparks[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    if (o.t <= 0) sparks.splice(i, 1);
  }
  for (i = floats.length - 1; i >= 0; i--) {
    o = floats[i];
    o.t += dt;
    o.y -= 22 * dt;
    if (o.t > 0.7) floats.splice(i, 1);
  }
  for (i = rings.length - 1; i >= 0; i--) {
    o = rings[i];
    o.t += dt;
    o.r += 48 * dt;
    if (o.t > 0.35) rings.splice(i, 1);
  }
  for (i = shards.length - 1; i >= 0; i--) {
    o = shards[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.vy += 240 * dt;
    o.rot += o.vr * dt;
    if (o.t <= 0) shards.splice(i, 1);
  }
  for (i = clouds.length - 1; i >= 0; i--) {
    o = clouds[i];
    o.t -= dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.vx *= 0.9;
    if (o.t <= 0) clouds.splice(i, 1);
  }
}

function tickPlayer(dt) {
  var p = G.player, kit = G.kit, Ladd, near, plat, vx, want;
  if (p.inv > 0) p.inv -= dt;
  if (p.pepperT > 0) p.pepperT -= dt;
  p.squash += (1 - p.squash) * Math.min(1, dt * 10);
  if (p.state === 'dead') {
    p.deadT -= dt;
    p.squash = 0.55;
    if (p.deadT <= 0) respawnPlayer();
    return;
  }
  if (G.lock > 0 || G.clearT > 0) return;

  if (p.state === 'climb') {
    Ladd = p.climbL;
    if (!Ladd) { p.state = 'walk'; return; }
    p.x = Ladd.x;
    want = (keys.u ? -1 : 0) + (keys.d ? 1 : 0);
    if (want) p.climbDir = want;
    p.y += p.climbDir * CLIMB * dt;
    p.walk += dt * 10;
    p.y = clamp(p.y, floorY(Ladd.hi), floorY(Ladd.lo));
    if ((G.clock * 9 | 0) !== ((G.clock - dt) * 9 | 0)) audio.climb();
    near = nearestFloor(p.y);
    if (Math.abs(p.y - floorY(near)) < 5 && ladderOnFloor(kit, Ladd, near)) {
      if ((keys.l || keys.r) || (p.climbDir < 0 && near === Ladd.hi) || (p.climbDir > 0 && near === Ladd.lo)) {
        p.floor = near;
        p.y = floorY(near);
        p.state = 'walk';
        p.climbL = null;
      }
    }
    return;
  }

  if (keys.u || keys.d) {
    Ladd = ladderAt(kit, p.x, p.y, keys.u ? -1 : 1);
    if (Ladd && Math.abs(p.x - Ladd.x) < 11) {
      p.state = 'climb';
      p.climbL = Ladd;
      p.climbDir = keys.u ? -1 : 1;
      p.x = Ladd.x;
      p.walk = 0;
      return;
    }
  }

  vx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
  if (vx) {
    p.face = vx;
    p.x += vx * WALK * dt;
    p.walk += dt * 12;
    plat = platformAt(kit, p.floor, p.x);
    if (!plat) {
      p.x -= vx * WALK * dt;
    } else {
      p.x = clamp(p.x, plat.x0 + 6, plat.x1 - 6);
    }
  }
  p.y = floorY(p.floor);
}

function tickStomp() {
  var p = G.player, i, layer, side;
  if (G.mode !== 'play') return;
  if (p.state !== 'walk' || G.lock > 0 || G.clearT > 0) return;
  if (!(keys.l || keys.r)) return;
  for (i = 0; i < G.layers.length; i++) {
    layer = G.layers[i];
    if (layer.state !== 'sit' || layer.floor !== p.floor) continue;
    if (Math.abs(p.x - layer.x) > LAYER_W * 0.55) continue;
    side = stompSide(layer, p.x);
    if (!applyStomp(layer, side)) continue;
    layer.squash = 0.58;
    dust(layer.x + side * 14, layer.y);
    audio.stomp();
    hitStop(0.03);
    p.squash = 0.78;
    if (readyToDrop(layer)) {
      startDrop(layer);
      bumpCombo();
      addScore(50 * comboMul(G.combo), layer.x, layer.y, '+' + (50 * comboMul(G.combo)));
      audio.drop();
      hitStop(0.055);
      kick(2.4);
      flash([255, 122, 41], 0.08);
      burst(layer.x, layer.y, 12, [255, 186, 90], 80, 0.32, 160);
      ringAt(layer.x, layer.y, [255, 122, 41]);
    }
  }
}

function tickLayers(dt) {
  var i, layer, j, e, destY;
  for (i = 0; i < G.layers.length; i++) {
    layer = G.layers[i];
    layer.squash += (1 - layer.squash) * Math.min(1, dt * 8);
    if (layer.state === 'drop') {
      layer.wobble += dt * 14;
      layer.y += DROP_V * dt;
      destY = layer.dest <= 0 ? floorY(0) + 8 : floorY(layer.dest);
      if (G.mode === 'play') {
        for (j = 0; j < G.enemies.length; j++) {
          e = G.enemies[j];
          if (e.dead > 0) continue;
          if (layerHitsEnemy(layer.x, layer.y, e.x, e.y)) crushEnemy(e, layer);
        }
      }
      if (layer.y >= destY) {
        layer.y = destY;
        landLayer(layer);
      }
    } else if (layer.state === 'plate') {
      layer.y = lerp(layer.y, floorY(0) + 26 - layer.plateI * 10, Math.min(1, dt * 8));
    } else {
      layer.y = floorY(layer.floor);
    }
  }
}

function tickShakers(dt) {
  var i, s, p;
  p = G.player;
  for (i = 0; i < G.shakers.length; i++) {
    s = G.shakers[i];
    s.bob += dt * 3.2;
    if (s.taken || G.mode !== 'play') continue;
    if (p.state === 'dead') continue;
    if (p.floor !== s.floor) continue;
    if (Math.abs(p.x - s.x) > 12) continue;
    s.taken = true;
    G.peppers = Math.min(MAX_PEPPER, G.peppers + 1);
    audio.pickup();
    addScore(50, s.x, floorY(s.floor), '+椒');
    burst(s.x, floorY(s.floor) - 8, 10, [255, 227, 107], 60, 0.3, 100);
    hudPlay();
    toast('胡椒 +1', false, true);
  }
}

function tickEnemies(dt) {
  var i, e, kit = G.kit, p = G.player, want, lad, plat, spd, vx, near, targetX;
  for (i = 0; i < G.enemies.length; i++) {
    e = G.enemies[i];
    if (e.dead > 0) {
      e.dead -= dt;
      if (e.dead <= 0) {
        e.dead = 0;
        e.x = e.spawnX;
        e.floor = e.spawnFloor;
        e.y = floorY(e.floor);
        e.state = 'walk';
        e.stun = 0;
        e.climbL = null;
        burst(e.x, e.y - 8, 8, [255, 122, 41], 40, 0.22, 80);
      }
      continue;
    }
    if (e.stun > 0) {
      e.stun -= dt;
      e.walk += dt * 8;
      continue;
    }
    spd = enemySpeed(e.type, G.round, G.extra);
    if (G.mode === 'title') spd *= 0.45;

    if (e.state === 'climb' && e.climbL) {
      e.x = e.climbL.x;
      e.y += e.climbDir * spd * 0.92 * dt;
      e.walk += dt * 9;
      e.y = clamp(e.y, floorY(e.climbL.hi), floorY(e.climbL.lo));
      near = nearestFloor(e.y);
      want = G.mode === 'title' ? e.spawnFloor : (p.state === 'climb' ? nearestFloor(p.y) : p.floor);
      if (Math.abs(e.y - floorY(near)) < 4 && ladderOnFloor(kit, e.climbL, near)) {
        if (near === want || (e.climbDir < 0 && near === e.climbL.hi) || (e.climbDir > 0 && near === e.climbL.lo)) {
          e.floor = near;
          e.y = floorY(near);
          e.state = 'walk';
          e.climbL = null;
        }
      }
      continue;
    }

    want = G.mode === 'title' ? e.spawnFloor : (p.state === 'climb' ? nearestFloor(p.y) : p.floor);
    targetX = G.mode === 'title' ? e.spawnX + Math.sin(G.clock * 0.6 + i) * 80 : p.x;
    plat = platformAt(kit, e.floor, e.x);
    if (!plat) {
      e.x = walkClamp(kit, e.floor, e.x);
      plat = platformAt(kit, e.floor, e.x);
    }

    if (e.floor === want && plat && (targetX < plat.x0 - 2 || targetX > plat.x1 + 2)) {
      want = e.floor < YS.length - 1 ? e.floor + 1 : e.floor - 1;
    }

    if (e.floor !== want) {
      lad = bestLadder(kit, e, want);
      if (lad) {
        if (Math.abs(e.x - lad.x) < 8) {
          e.state = 'climb';
          e.climbL = lad;
          e.climbDir = want > e.floor ? -1 : 1;
          e.x = lad.x;
          continue;
        }
        e.dir = lad.x > e.x ? 1 : -1;
      } else if (plat) {
        if (e.x <= plat.x0 + 7) e.dir = 1;
        else if (e.x >= plat.x1 - 7) e.dir = -1;
      }
    } else {
      e.dir = targetX > e.x + 4 ? 1 : targetX < e.x - 4 ? -1 : e.dir;
      if (G.mode !== 'title' && p.state === 'climb' && p.climbL && plat &&
          p.climbL.x >= plat.x0 && p.climbL.x <= plat.x1 && Math.abs(e.x - p.climbL.x) < 8) {
        e.state = 'climb';
        e.climbL = p.climbL;
        e.climbDir = p.climbDir || (p.y < e.y ? -1 : 1);
        e.x = p.climbL.x;
        continue;
      }
    }

    vx = e.dir * spd * dt;
    e.x += vx;
    e.face = e.dir;
    e.walk += dt * 10;
    plat = platformAt(kit, e.floor, e.x);
    if (!plat) {
      e.x -= vx;
      e.dir *= -1;
    } else {
      if (e.x < plat.x0 + 6) { e.x = plat.x0 + 6; e.dir = 1; }
      if (e.x > plat.x1 - 6) { e.x = plat.x1 - 6; e.dir = -1; }
    }
    e.y = floorY(e.floor);
  }
}

function tickHits() {
  var p = G.player, i, e;
  if (G.mode !== 'play' || p.state === 'dead' || G.clearT > 0) return;
  if (p.inv > 0) return;
  for (i = 0; i < G.enemies.length; i++) {
    e = G.enemies[i];
    if (e.dead > 0 || e.stun > 0) continue;
    if (hitsChef(p.x, p.y, e.x, e.y)) {
      killPlayer(e.type);
      return;
    }
  }
}

function tick(dt) {
  G.clock += dt;
  if (G.lock > 0) G.lock -= dt;
  if (G.sprayT > 0) G.sprayT -= dt;
  if (G.combo > 0) {
    G.comboAge += dt;
    if (G.comboAge > COMBO_AGE) {
      G.combo = 0;
      G.comboAge = 0;
      comboEl.textContent = '×1';
    }
  }
  if (G.mode === 'title') {
    tickEnemies(dt);
    tickFx(dt);
    return;
  }
  if (G.mode !== 'play') {
    tickFx(dt);
    return;
  }
  if (G.clearT > 0) {
    G.clearT -= dt;
    tickLayers(dt);
    tickFx(dt);
    if (G.clearT <= 0) nextRound();
    return;
  }
  tickPlayer(dt);
  tickStomp();
  tickLayers(dt);
  tickShakers(dt);
  tickEnemies(dt);
  tickHits();
  maybeClear();
  tickFx(dt);
}

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

function drawBg() {
  var g, i, x, y;
  ctx.fillStyle = '#07030c';
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(70), sy(90), 10, sx(70), sy(90), 200 * L.s);
  g.addColorStop(0, 'rgba(255,122,41,0.16)');
  g.addColorStop(1, 'rgba(255,122,41,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);
  g = ctx.createRadialGradient(sx(330), sy(40), 8, sx(330), sy(40), 150 * L.s);
  g.addColorStop(0, 'rgba(255,61,184,0.1)');
  g.addColorStop(1, 'rgba(255,61,184,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.fillStyle = 'rgba(18, 10, 22, 0.92)';
  ctx.fillRect(sx(4), sy(12), 10 * L.s, (WORLD_H - 24) * L.s);
  ctx.fillRect(sx(WORLD_W - 14), sy(12), 10 * L.s, (WORLD_H - 24) * L.s);

  ctx.strokeStyle = 'rgba(255,122,41,0.07)';
  ctx.lineWidth = 1 * L.s;
  for (i = 0; i < 12; i++) {
    x = sx(24 + i * 32);
    ctx.beginPath();
    ctx.moveTo(x, sy(20));
    ctx.lineTo(x, sy(WORLD_H - 18));
    ctx.stroke();
  }
  for (i = 0; i < YS.length; i++) {
    y = sy(YS[i] - 40);
    ctx.beginPath();
    ctx.moveTo(sx(16), y);
    ctx.lineTo(sx(WORLD_W - 16), y);
    ctx.stroke();
  }
}

function drawLadders() {
  var i, Ladd, top, bot, x, y, r;
  ctx.lineCap = 'round';
  for (i = 0; i < G.kit.ladders.length; i++) {
    Ladd = G.kit.ladders[i];
    top = floorY(Ladd.hi);
    bot = floorY(Ladd.lo);
    x = sx(Ladd.x);
    ctx.strokeStyle = 'rgba(0,240,255,0.55)';
    ctx.lineWidth = 1.6 * L.s;
    ctx.beginPath();
    ctx.moveTo(x - 4.2 * L.s, sy(top));
    ctx.lineTo(x - 4.2 * L.s, sy(bot));
    ctx.moveTo(x + 4.2 * L.s, sy(top));
    ctx.lineTo(x + 4.2 * L.s, sy(bot));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,240,255,0.35)';
    ctx.lineWidth = 1.3 * L.s;
    for (r = top + 8; r < bot - 4; r += 10) {
      y = sy(r);
      ctx.beginPath();
      ctx.moveTo(x - 4.4 * L.s, y);
      ctx.lineTo(x + 4.4 * L.s, y);
      ctx.stroke();
    }
  }
}

function drawPlatforms() {
  var f, i, p, x0, x1, y, yy;
  for (f = 0; f < G.kit.plats.length; f++) {
    yy = floorY(f);
    y = sy(yy);
    for (i = 0; i < G.kit.plats[f].length; i++) {
      p = G.kit.plats[f][i];
      x0 = sx(p.x0);
      x1 = sx(p.x1);
      ctx.fillStyle = '#1a0c14';
      ctx.fillRect(x0, y, x1 - x0, 7 * L.s);
      ctx.fillStyle = '#ff7a29';
      ctx.fillRect(x0, y, x1 - x0, 2.4 * L.s);
      ctx.fillStyle = 'rgba(255,227,107,0.55)';
      ctx.fillRect(x0, y, x1 - x0, 0.8 * L.s);
      ctx.fillStyle = 'rgba(0,240,255,0.35)';
      ctx.fillRect(x0, y + 5.2 * L.s, x1 - x0, 1.1 * L.s);
    }
  }
}

function drawPlates() {
  var i, b, x, y, g;
  for (i = 0; i < G.kit.burgers.length; i++) {
    b = G.kit.burgers[i];
    x = sx(b.x);
    y = sy(floorY(0) + 22);
    g = ctx.createRadialGradient(x, y, 2, x, y, 18 * L.s);
    g.addColorStop(0, 'rgba(216,232,255,0.55)');
    g.addColorStop(1, 'rgba(216,232,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, 22 * L.s, 5 * L.s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,240,255,0.7)';
    ctx.lineWidth = 1.4 * L.s;
    ctx.beginPath();
    ctx.ellipse(x, y, 16 * L.s, 3.4 * L.s, 0, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, y, 11 * L.s, 2.2 * L.s, 0, 0, TAU);
    ctx.stroke();
  }
}

function drawLayerShape(kind, w, h, sagL, sagR) {
  var s = L.s;
  ctx.beginPath();
  if (kind === 'top') {
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.ellipse(0, h * 0.15 * s, w * 0.5 * s, h * 0.7 * s, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#e8b84a';
    ctx.fillRect(-w * 0.48 * s, -2 * s, w * 0.96 * s, 4 * s);
    ctx.fillStyle = '#c47a28';
    ctx.fillRect(-w * 0.18 * s, -h * 0.45 * s, 2.2 * s, 2 * s);
    ctx.fillRect(w * 0.12 * s, -h * 0.3 * s, 2 * s, 1.8 * s);
  } else if (kind === 'bot') {
    ctx.fillStyle = '#e8b84a';
    ctx.fillRect(-w * 0.48 * s, (-h * 0.2 + sagL) * s, w * 0.48 * s, h * 0.7 * s);
    ctx.fillRect(0, (-h * 0.2 + sagR) * s, w * 0.48 * s, h * 0.7 * s);
    ctx.fillStyle = '#ffe36b';
    ctx.fillRect(-w * 0.48 * s, (-h * 0.2 + sagL) * s, w * 0.48 * s, 3 * s);
    ctx.fillRect(0, (-h * 0.2 + sagR) * s, w * 0.48 * s, 3 * s);
  } else if (kind === 'lettuce') {
    ctx.fillStyle = '#3dcc6a';
    ctx.beginPath();
    ctx.moveTo(-w * 0.5 * s, sagL * s);
    ctx.quadraticCurveTo(-w * 0.25 * s, (-h * 0.7 + sagL) * s, 0, sagL * 0.5 * s);
    ctx.quadraticCurveTo(w * 0.25 * s, (-h * 0.7 + sagR) * s, w * 0.5 * s, sagR * s);
    ctx.quadraticCurveTo(w * 0.2 * s, (h * 0.55 + sagR) * s, 0, h * 0.25 * s);
    ctx.quadraticCurveTo(-w * 0.2 * s, (h * 0.55 + sagL) * s, -w * 0.5 * s, sagL * s);
    ctx.fill();
    ctx.fillStyle = '#7af6a4';
    ctx.fillRect(-w * 0.2 * s, -2 * s, w * 0.4 * s, 2 * s);
  } else {
    ctx.fillStyle = '#7a3a18';
    ctx.fillRect(-w * 0.48 * s, (-h * 0.25 + sagL) * s, w * 0.48 * s, h * 0.75 * s);
    ctx.fillRect(0, (-h * 0.25 + sagR) * s, w * 0.48 * s, h * 0.75 * s);
    ctx.strokeStyle = 'rgba(40,16,8,0.7)';
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.moveTo(-w * 0.3 * s, sagL * s);
    ctx.lineTo(w * 0.32 * s, (-1.2 + sagR) * s);
    ctx.moveTo(-w * 0.22 * s, (3 + sagL) * s);
    ctx.lineTo(w * 0.28 * s, (2 + sagR) * s);
    ctx.stroke();
    ctx.fillStyle = '#c45a28';
    ctx.fillRect(-w * 0.48 * s, (-h * 0.25 + sagL) * s, w * 0.48 * s, 2 * s);
    ctx.fillRect(0, (-h * 0.25 + sagR) * s, w * 0.48 * s, 2 * s);
  }
}

function drawLayer(layer) {
  var sagL = layer.left && layer.state === 'sit' ? 5 : 0;
  var sagR = layer.right && layer.state === 'sit' ? 5 : 0;
  var wob = layer.state === 'drop' ? Math.sin(layer.wobble) * 0.12 : 0;
  ctx.save();
  ctx.translate(sx(layer.x), sy(layer.y - 4));
  ctx.rotate(wob);
  ctx.scale(1, layer.squash);
  drawLayerShape(layer.kind, LAYER_W, LAYER_H, sagL, sagR);
  ctx.restore();
}

function drawShakers() {
  var i, s, x, y, bob;
  for (i = 0; i < G.shakers.length; i++) {
    s = G.shakers[i];
    if (s.taken) continue;
    bob = Math.sin(s.bob) * 2.4;
    x = sx(s.x);
    y = sy(floorY(s.floor) - 14 + bob);
    ctx.fillStyle = '#ffe36b';
    ctx.fillRect(x - 3.2 * L.s, y, 6.4 * L.s, 8 * L.s);
    ctx.fillStyle = '#ff7a29';
    ctx.fillRect(x - 4 * L.s, y - 3 * L.s, 8 * L.s, 3.2 * L.s);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(x - 1.2 * L.s, y + 1.5 * L.s, 2.4 * L.s, 3.2 * L.s);
  }
}

function drawEnemy(e) {
  var x, y, bob, a;
  if (e.dead > 0) return;
  x = sx(e.x);
  y = sy(e.y);
  bob = Math.sin(e.walk * 1.6) * 1.4 * L.s;
  ctx.save();
  ctx.translate(x, y - bob);
  ctx.scale(e.face, 1);
  if (e.stun > 0) ctx.globalAlpha = 0.7;
  if (e.type === 'egg') {
    ctx.fillStyle = '#f4efe4';
    ctx.beginPath();
    ctx.ellipse(0, -8 * L.s, 7.2 * L.s, 9 * L.s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffd24a';
    ctx.beginPath();
    ctx.ellipse(0.6 * L.s, -8 * L.s, 3.2 * L.s, 3.6 * L.s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#05030c';
    ctx.beginPath();
    ctx.arc(2.2 * L.s, -10 * L.s, 1.1 * L.s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#c45a28';
    ctx.fillRect(-3 * L.s, -1 * L.s, 2.2 * L.s, 4 * L.s);
    ctx.fillRect(1 * L.s, -1 * L.s, 2.2 * L.s, 4 * L.s);
  } else if (e.type === 'pickle') {
    ctx.fillStyle = '#3dcc6a';
    ctx.beginPath();
    ctx.ellipse(0, -8 * L.s, 3.4 * L.s, 8.2 * L.s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,80,40,0.55)';
    ctx.lineWidth = 1 * L.s;
    ctx.beginPath();
    ctx.moveTo(-1.5 * L.s, -13 * L.s);
    ctx.lineTo(1.6 * L.s, -9 * L.s);
    ctx.moveTo(-1.6 * L.s, -7 * L.s);
    ctx.lineTo(1.5 * L.s, -3 * L.s);
    ctx.stroke();
    ctx.fillStyle = '#05030c';
    ctx.beginPath();
    ctx.arc(1.4 * L.s, -11 * L.s, 1 * L.s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2a8a48';
    ctx.fillRect(-3 * L.s, -1 * L.s, 2.2 * L.s, 4 * L.s);
    ctx.fillRect(0.8 * L.s, -1 * L.s, 2.2 * L.s, 4 * L.s);
  } else {
    ctx.fillStyle = '#c45a28';
    ctx.beginPath();
    ctx.ellipse(0, -6.6 * L.s, 8.2 * L.s, 3.8 * L.s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#7a3a18';
    ctx.fillRect(-7 * L.s, -8.4 * L.s, 3 * L.s, 3.4 * L.s);
    ctx.fillRect(4 * L.s, -8.4 * L.s, 3 * L.s, 3.4 * L.s);
    ctx.fillStyle = '#05030c';
    ctx.beginPath();
    ctx.arc(4.2 * L.s, -7.6 * L.s, 1.05 * L.s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ff7a29';
    ctx.fillRect(-4 * L.s, -3 * L.s, 2.4 * L.s, 4 * L.s);
    ctx.fillRect(1.4 * L.s, -3 * L.s, 2.4 * L.s, 4 * L.s);
  }
  ctx.restore();
  if (e.stun > 0) {
    ctx.strokeStyle = 'rgba(255,227,107,0.8)';
    ctx.lineWidth = 1.2 * L.s;
    for (a = 0; a < 3; a++) {
      ctx.beginPath();
      ctx.arc(x + Math.cos(G.clock * 6 + a * 2.1) * 9 * L.s, sy(e.y - 20) + Math.sin(G.clock * 6 + a * 2.1) * 3 * L.s, 2 * L.s, 0, TAU);
      ctx.stroke();
    }
  }
}

function drawPlayer() {
  var p = G.player, x, y, stride, cap;
  if (G.mode === 'title') return;
  if (p.inv > 0 && ((G.clock * 18) | 0) % 2 === 0) return;
  x = sx(p.x);
  y = sy(p.y);
  stride = Math.sin(p.walk);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p.face, p.squash);
  if (p.state === 'dead') ctx.rotate(0.7);

  ctx.fillStyle = '#2a1a10';
  ctx.fillRect(-3.6 * L.s, -4 * L.s, 2.5 * L.s, 4 * L.s + stride * 3 * L.s);
  ctx.fillRect(1.1 * L.s, -4 * L.s, 2.5 * L.s, 4 * L.s - stride * 3 * L.s);

  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(-5.2 * L.s, -14 * L.s, 10.4 * L.s, 11 * L.s);
  ctx.fillStyle = '#ffe36b';
  ctx.fillRect(-5.2 * L.s, -9 * L.s, 10.4 * L.s, 2.2 * L.s);

  ctx.fillStyle = '#ffd0c0';
  ctx.beginPath();
  ctx.arc(0.3 * L.s, -16.6 * L.s, 4.1 * L.s, 0, TAU);
  ctx.fill();
  cap = p.pepperT > 0 ? '#ffe36b' : '#ff7a29';
  ctx.fillStyle = cap;
  ctx.fillRect(-4.8 * L.s, -21.2 * L.s, 9.6 * L.s, 4.4 * L.s);
  ctx.fillRect(1.4 * L.s, -19.2 * L.s, 5.6 * L.s, 2.2 * L.s);
  ctx.fillStyle = '#05030c';
  ctx.beginPath();
  ctx.arc(1.6 * L.s, -16.4 * L.s, 0.7 * L.s, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#ff7a29';
  ctx.fillRect(4.2 * L.s, -13 * L.s, 3.2 * L.s, 7 * L.s);
  ctx.fillRect(-7.2 * L.s, -13 * L.s, 3.2 * L.s, 7 * L.s);
  if (p.pepperT > 0 || G.sprayT > 0) {
    ctx.fillStyle = '#ffe36b';
    ctx.fillRect(6.2 * L.s, -16 * L.s, 5 * L.s, 6 * L.s);
    ctx.fillStyle = '#ff7a29';
    ctx.fillRect(6 * L.s, -18.2 * L.s, 5.4 * L.s, 2.4 * L.s);
  }

  ctx.restore();
}



function drawFx() {
  var i, o, a;
  for (i = 0; i < clouds.length; i++) {
    o = clouds[i];
    a = clamp(o.t / o.max, 0, 1);
    ctx.fillStyle = rgba([255, 214, 120], a * 0.55);
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), o.r * L.s, 0, TAU);
    ctx.fill();
  }
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
    ctx.fillStyle = rgba(o.rgb, o.t > 0.12 ? 1 : 0.4);
    ctx.fillRect(-o.w * 0.5 * L.s, -1.2 * L.s, o.w * L.s, 2.4 * L.s);
    ctx.restore();
  }
  ctx.font = 'bold ' + (9 * L.s) + 'px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  for (i = 0; i < floats.length; i++) {
    o = floats[i];
    a = 1 - o.t / 0.7;
    ctx.fillStyle = rgba(o.rgb, a);
    ctx.fillText(o.text, sx(o.x), sy(o.y));
  }
}

function drawSpray() {
  var p, i, a;
  if (G.sprayT <= 0 || G.mode === 'title') return;
  p = G.player;
  a = G.sprayT / 0.3;
  ctx.save();
  ctx.globalAlpha = a * 0.55;
  ctx.fillStyle = '#ffe36b';
  for (i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.arc(
      sx(p.x + p.face * (16 + i * 6)),
      sy(p.y - 10 + Math.sin(G.clock * 20 + i) * 5),
      (5 - i * 0.4) * L.s,
      0, TAU
    );
    ctx.fill();
  }
  ctx.restore();
}

function drawFlash() {
  if (G.flash <= 0) return;
  ctx.fillStyle = rgba(G.flashRgb, clamp(G.flash * 2.2, 0, 0.28));
  ctx.fillRect(0, 0, cssW, cssH);
}

function draw() {
  var i, shx, shy;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  shx = (G.shake ? (Math.random() - 0.5) * G.shake : 0) + G.kickX;
  shy = (G.shake ? (Math.random() - 0.5) * G.shake * 0.6 : 0) + G.kickY;
  ctx.translate(shx, shy);
  drawBg();
  drawLadders();
  drawPlatforms();
  drawPlates();
  for (i = 0; i < G.layers.length; i++) {
    if (G.layers[i].state === 'plate') drawLayer(G.layers[i]);
  }
  for (i = 0; i < G.layers.length; i++) {
    if (G.layers[i].state !== 'plate') drawLayer(G.layers[i]);
  }
  drawShakers();
  for (i = 0; i < G.enemies.length; i++) drawEnemy(G.enemies[i]);
  drawPlayer();
  drawSpray();
  drawFx();
  drawFlash();
}

function frame(ts) {
  var dt, steps;
  if (!lastTs) lastTs = ts;
  dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (dt > 0.08) dt = 0.08;
  if (!hidden) {
    if (G.stop > 0) {
      G.stop -= dt;
      tickFx(dt);
    } else {
      acc += dt;
      steps = 0;
      while (acc >= STEP && steps < 5) {
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

function bindPad(el, setter) {
  function down(ev) {
    ev.preventDefault();
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
bindPad(btnUp, function (v) { keys.u = v; });
bindPad(btnDown, function (v) { keys.d = v; });

btnPepper.addEventListener('pointerdown', function (ev) {
  ev.preventDefault();
  btnPepper.classList.add('held');
  audio.ensure();
  tryPepper();
});
btnPepper.addEventListener('pointerup', function () { btnPepper.classList.remove('held'); });
btnPepper.addEventListener('pointercancel', function () { btnPepper.classList.remove('held'); });

function keyOn(e, down) {
  var k = e.code;
  if (k === 'ArrowLeft' || k === 'KeyA') { keys.l = down; e.preventDefault(); }
  else if (k === 'ArrowRight' || k === 'KeyD') { keys.r = down; e.preventDefault(); }
  else if (k === 'ArrowDown' || k === 'KeyS') { keys.d = down; e.preventDefault(); }
  else if (k === 'ArrowUp' || k === 'KeyW') { keys.u = down; e.preventDefault(); }
  else if (k === 'Space') e.preventDefault();
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
      startRun('kitchen');
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit2') {
      startRun('extra');
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
      startRun('extra');
      e.preventDefault();
      return;
    }
  }
  if (e.code === 'Space') {
    tryPepper();
    e.preventDefault();
    return;
  }
  keyOn(e, true);
});

window.addEventListener('keyup', function (e) { keyOn(e, false); });

btnMute.addEventListener('click', function () {
  audio.ensure();
  audio.setMuted(!audio.muted);
});
btnRetry.addEventListener('click', function () {
  audio.ensure();
  retry();
});
btnKitchen.addEventListener('click', function () {
  audio.ensure();
  startRun('kitchen');
});
btnExtra.addEventListener('click', function () {
  audio.ensure();
  startRun('extra');
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

bestEl.textContent = String(G.bestK);
renderPips();
showTitle();
resize();
hudPlay();
modeLabel.textContent = '厨房';
requestAnimationFrame(frame);

}
