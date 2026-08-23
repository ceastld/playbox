'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const VX = 400;
  const VCX = 200;
  const HORIZON = VH * 0.34;
  const SEG = 200;
  const ROAD_W = 2100;
  const CAM_H = 1050;
  const CAM_D = 0.84;
  const PLAYER_Z = CAM_H * CAM_D;
  const DRAW = 138;
  const RUMBLE = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.8;
  const BEST_KEY = 'playbox-outrunners-best';
  const MUTE_KEY = 'playbox-outrunners-mute';
  const OPS = '方向 / WASD 转向 · 空格油门 · Shift / Z 涡轮 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 90, 40];
  const CYN = [0, 232, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 154, 74];
  const WHT = [255, 244, 234];
  const RED = [255, 64, 72];
  const PNK = [255, 168, 120];
  const ORG = [255, 122, 50];

  const GRAPH = {
    flame: { name: '焰湾', theme: 'desert', seed: 16, left: 'ridge', right: 'harbor', pack: '焰团', bossHp: 3, bossHpD: 4 },
    ridge: { name: '岩脊', theme: 'canyon', seed: 28, left: 'snow', right: 'falls', pack: '岩团', bossHp: 3, bossHpD: 5 },
    harbor: { name: '霓港', theme: 'city', seed: 41, left: 'falls', right: 'ring', pack: '港团', bossHp: 3, bossHpD: 5 },
    snow: { name: '雪冠', theme: 'snow', seed: 53, goal: true, pack: '冠团', bossHp: 4, bossHpD: 6 },
    falls: { name: '森瀑', theme: 'forest', seed: 67, goal: true, pack: '瀑团', bossHp: 4, bossHpD: 6 },
    ring: { name: '星环', theme: 'night', seed: 79, goal: true, pack: '环团', bossHp: 4, bossHpD: 6 }
  };

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const ovStart = document.getElementById('ov-start');
  const ovEnd = document.getElementById('ov-end');
  const btnCore = document.getElementById('btn-core');
  const btnDense = document.getElementById('btn-dense');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnTurbo = document.getElementById('btn-turbo');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const timeEl = document.getElementById('time');
  const spdEl = document.getElementById('spd');
  const scoreBox = document.getElementById('score-box');
  const timeBox = document.getElementById('time-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const gapLabel = document.getElementById('gap-label');
  const comboEl = document.getElementById('combo-label');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const timeBar = document.getElementById('time-bar');
  const timeWrap = document.getElementById('time-wrap');
  const turboBar = document.getElementById('turbo-bar');
  const turboWrap = document.getElementById('turbo-wrap');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let toastTok = 0;
  let kickTok = 0;

  const keys = { l: false, r: false, u: false, d: false, t: false };
  const pointer = { down: false, hover: false, x: VCX, y: VH * 0.7, id: null };
  const particles = [];
  const floats = [];
  const smears = [];
  const rings = [];
  const segs = [];
  const cars = [];

  const dummy = {
    i: 0, y1: 0, y2: 0, z1: 0, z2: SEG, curve: 0, split: 0, fork: 0,
    sprites: null,
    p1: { x: VCX, y: VH, w: 0, s: 0, z: 1 },
    p2: { x: VCX, y: VH, w: 0, s: 0, z: 1 },
    clip: VH
  };

  function makeDriver(id) {
    return {
      id: id,
      z: 40,
      x: id === 'p' ? -0.2 : 0.22,
      spd: 0,
      lean: 0,
      steerVis: 0,
      crashT: 0,
      bounce: 0,
      off: false,
      turbo: 1,
      turboOn: false,
      kmh: 0,
      gear: 1,
      curveMem: 0,
      gated: false,
      emptyT: 0,
      forkPick: 0,
      passed: false,
      near: false
    };
  }

  const P = makeDriver('p');
  const R = makeDriver('r');

  const G = {
    mode: 'title',
    kind: 'core',
    stage: 'flame',
    route: ['焰湾'],
    t: 0,
    clock: 0,
    score: 0,
    best: { c: 0, m: 0 },
    time: 48,
    timeCap: 48,
    combo: 0,
    comboT: 0,
    comboMax: 0,
    mult: 1,
    flow: 0,
    flowN: 0,
    trackLen: 0,
    gateZ: 0,
    gated: false,
    bossOn: false,
    bossDead: false,
    packNeed: 0,
    packDown: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: MAG,
    punch: 1,
    ending: '',
    endT: 0,
    why: '',
    turboHold: false,
    rivalFirst: false,
    depth: 1
  };

  let inputSrc = 'key';

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function easeIn(a, b, p) {
    return a + (b - a) * p * p;
  }
  function easeInOut(a, b, p) {
    return a + (b - a) * ((-Math.cos(p * Math.PI) / 2) + 0.5);
  }
  function mix(a, b, t) {
    const k = t < 0 ? 0 : t > 1 ? 1 : t;
    return [
      (a[0] + (b[0] - a[0]) * k) | 0,
      (a[1] + (b[1] - a[1]) * k) | 0,
      (a[2] + (b[2] - a[2]) * k) | 0
    ];
  }
  function rgba(rgb, a) {
    if (a == null || a >= 0.995) return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function isDense() {
    return G.kind === 'dense';
  }
  function def() {
    return GRAPH[G.stage] || GRAPH.flame;
  }
  function kindBest() {
    return isDense() ? G.best.m : G.best.c;
  }
  function modeName() {
    return isDense() ? '驶核' : '双驶';
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function baseMax() {
    return isDense() ? 12600 : 10400;
  }
  function maxSpdOf(d) {
    return baseMax() * (d.turboOn ? 1.36 : 1);
  }
  function accelOf(d) {
    return baseMax() / (isDense() ? 2.5 : 2.9) * (d.turboOn ? 1.52 : 1);
  }
  function brakeOf() {
    return -baseMax() / (isDense() ? 1.12 : 1.32);
  }
  function coastOf(d) {
    return -baseMax() / (d.turboOn ? 8.2 : 6.0);
  }
  function offDecel() {
    return -baseMax() / (isDense() ? 1.18 : 1.5);
  }
  function startTime() {
    return isDense() ? 36 : 48;
  }
  function gateTime() {
    return isDense() ? 12 : 16;
  }
  function kmhMax() {
    return isDense() ? 348 : 312;
  }
  function centrif() {
    return (isDense() ? 0.7 : 0.5);
  }
  function turboDrain() {
    return isDense() ? 0.46 : 0.32;
  }
  function turboFill() {
    return isDense() ? 0.16 : 0.22;
  }
  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }
  function gapM() {
    return ((P.z - R.z) / 28) | 0;
  }

  function findSeg(z) {
    if (!segs.length) return dummy;
    let i = Math.floor(z / SEG);
    if (i < 0) i = 0;
    if (i >= segs.length) i = segs.length - 1;
    return segs[i];
  }
  function lastY() {
    return segs.length ? segs[segs.length - 1].y2 : 0;
  }
  function addSeg(curve, y) {
    const n = segs.length;
    segs.push({
      i: n,
      y1: n ? segs[n - 1].y2 : 0,
      y2: y,
      z1: n * SEG,
      z2: (n + 1) * SEG,
      curve: curve,
      split: 0,
      fork: 0,
      sprites: null,
      p1: { x: 0, y: 0, w: 0, s: 0, z: 0 },
      p2: { x: 0, y: 0, w: 0, s: 0, z: 0 },
      clip: VH
    });
  }
  function addRoad(enter, hold, leave, curve, yEnd) {
    const startY = lastY();
    const total = Math.max(1, enter + hold + leave);
    let n;
    for (n = 0; n < enter; n++) addSeg(easeIn(0, curve, n / enter), easeInOut(startY, yEnd, n / total));
    for (n = 0; n < hold; n++) addSeg(curve, easeInOut(startY, yEnd, (enter + n) / total));
    for (n = 0; n < leave; n++) addSeg(easeInOut(curve, 0, n / leave), easeInOut(startY, yEnd, (enter + hold + n) / total));
  }
  function addSprite(i, offset, kind, h, w, lab) {
    if (i < 0 || i >= segs.length) return;
    const s = segs[i];
    if (!s.sprites) s.sprites = [];
    s.sprites.push({ o: offset, k: kind, h: h, w: w, lab: lab || '' });
  }

  function buildStage(id) {
    const st = GRAPH[id] || GRAPH.flame;
    G.stage = st === GRAPH[id] ? id : 'flame';
    segs.length = 0;
    cars.length = 0;
    const dense = isDense();
    const target = dense ? 720 : 860;
    const hillAmp = st.theme === 'canyon' ? 980 : st.theme === 'city' || st.theme === 'night' ? 240 : st.theme === 'snow' ? 640 : 720;
    const curveAmp = (dense ? 7.6 : 5.6) * (1 + (G.depth - 1) * 0.12) * (st.theme === 'city' ? 0.78 : st.theme === 'canyon' ? 1.12 : 1);

    addRoad(16, 32, 14, 0, 0);
    let k = 0;
    while (segs.length < target - 150) {
      const h = hash2(st.seed * 13 + k * 3);
      const h2 = hash2(st.seed * 17 + k * 5 + 2);
      const h3 = hash2(st.seed * 19 + k * 7 + 4);
      let curve = (h - 0.5) * 2 * curveAmp;
      if (h > 0.84) curve = 0;
      if (h < 0.1) curve *= 1.38;
      const hill = lastY() + (h2 - 0.46) * hillAmp;
      const enter = 12 + (h3 * 20) | 0;
      const hold = 18 + (hash2(k + 41 + st.seed) * 46) | 0;
      const leave = 10 + (hash2(k + 43 + st.seed) * 20) | 0;
      addRoad(enter, hold, leave, curve, hill);
      k += 1;
    }
    addRoad(16, 36, 14, 0, lastY() * 0.16);
    addRoad(8, 32, 8, 0, 0);

    const forkStart = segs.length - 100;
    if (!st.goal) {
      for (let i = forkStart; i < segs.length; i++) {
        const t = (i - forkStart) / 100;
        segs[i].fork = 1;
        segs[i].split = t < 0.2
          ? easeIn(0, 0.28, t / 0.2)
          : easeInOut(0.28, 1, Math.min(1, (t - 0.2) / 0.52));
      }
    } else {
      for (let i = segs.length - 44; i < segs.length; i++) segs[i].fork = 2;
    }

    G.trackLen = segs.length * SEG;
    G.gateZ = (segs.length - 16) * SEG;
    G.gated = false;
    G.bossOn = false;
    G.bossDead = false;
    G.packNeed = 0;
    G.packDown = 0;
    G.rivalFirst = false;
    P.gated = false;
    R.gated = false;
    P.forkPick = 0;
    R.forkPick = 0;
    placeSprites(st);
    placeCars(st);
  }

  function placeSprites(st) {
    const theme = st.theme;
    const step = theme === 'city' || theme === 'night' ? 3 : 4;
    for (let i = 8; i < segs.length - 22; i += step) {
      if (segs[i].fork === 1 && segs[i].split > 0.2) continue;
      const r = hash2(st.seed * 91 + i * 17);
      const side = hash2(st.seed + i * 3) > 0.5 ? 1 : -1;
      const dist = 1.18 + hash2(i + 9) * 1.5;
      if (theme === 'desert') {
        if (r > 0.18) addSprite(i, -dist - 0.08, r > 0.72 ? 'cactus' : 'dune', r > 0.72 ? 520 : 260, r > 0.72 ? 180 : 380);
        if (r > 0.4) addSprite(i, dist + 0.1, r > 0.78 ? 'cactus' : 'palm', r > 0.78 ? 480 : 860, r > 0.78 ? 160 : 240);
        if ((i % 16) === 0) addSprite(i, side * 1.08, 'post', 360, 58);
      } else if (theme === 'canyon') {
        if (r > 0.16) addSprite(i, -dist, r > 0.62 ? 'cliff' : 'rock', r > 0.62 ? 1100 : 340, r > 0.62 ? 480 : 280);
        if (r > 0.32) addSprite(i, dist + 0.06, r > 0.7 ? 'cactus' : 'rock', r > 0.7 ? 500 : 300, 200);
      } else if (theme === 'city' || theme === 'night') {
        if (r > 0.12) addSprite(i, -dist - 0.16, r > 0.7 ? 'neon' : 'build', 880 + (r * 700) | 0, 300 + (r * 180) | 0);
        if (r > 0.28) addSprite(i, dist + 0.18, 'build', 760 + (hash2(i) * 640) | 0, 300);
        if ((i % 6) === 0) addSprite(i, side * 1.08, 'lamp', 620, 64);
      } else if (theme === 'snow') {
        if (r > 0.16) addSprite(i, -dist - 0.1, r > 0.78 ? 'snow' : 'pine', r > 0.78 ? 280 : 860, r > 0.78 ? 240 : 240);
        if (r > 0.34) addSprite(i, dist + 0.12, 'pine', 800 + (r * 180) | 0, 240);
        if ((i % 8) === 0) addSprite(i, side * 1.06, 'lamp', 600, 62);
      } else {
        if (r > 0.14) addSprite(i, -dist - 0.08, 'pine', 860 + (r * 220) | 0, 250);
        if (r > 0.3) addSprite(i, dist + 0.1, r > 0.72 ? 'rock' : 'pine', r > 0.72 ? 300 : 780, r > 0.72 ? 220 : 230);
        if ((i % 10) === 0) addSprite(i, side * 1.08, 'post', 400, 56);
      }
    }
    const gate = segs.length - 16;
    addSprite(gate, -1.08, 'pillar', 1480, 150);
    addSprite(gate, 1.08, 'pillar', 1480, 150);
    addSprite(gate, 0, st.goal ? 'goal' : 'check', 540, 920);
    if (!st.goal) {
      const L = GRAPH[st.left];
      const Rg = GRAPH[st.right];
      addSprite(segs.length - 64, -1.32, 'bill', 500, 400, L ? L.name : '左');
      addSprite(segs.length - 64, 1.32, 'bill', 500, 400, Rg ? Rg.name : '右');
    }
  }

  function carColor(h) {
    if (h < 0.16) return [70, 220, 255];
    if (h < 0.32) return [255, 214, 70];
    if (h < 0.48) return [90, 235, 150];
    if (h < 0.64) return [230, 90, 255];
    if (h < 0.8) return [250, 250, 255];
    return [255, 110, 80];
  }

  function placeCars(st) {
    const n = isDense() ? 18 : 12;
    const max = baseMax();
    const packStart = segs.length * 0.76;
    for (let i = 0; i < n; i++) {
      const z = (50 + i * ((packStart - 80) / n) + hash2(st.seed + i) * 30) * SEG;
      if (z > G.trackLen - 26000) continue;
      cars.push({
        z: z,
        offset: (hash2(st.seed * 3 + i) - 0.5) * 1.18,
        spd: max * (0.3 + hash2(i + 8) * 0.38),
        col: carColor(hash2(st.seed + i * 19)),
        passed: false,
        wob: hash2(i + 4) * TAU,
        near: false,
        boss: false,
        pack: false,
        hp: 1,
        dead: false,
        hitT: 0
      });
    }
  }

  function spawnBossPack() {
    if (G.bossOn) return;
    G.bossOn = true;
    const st = def();
    const n = isDense() ? 7 : 5;
    const pz = P.z + PLAYER_Z;
    const max = baseMax();
    G.packNeed = n;
    G.packDown = 0;
    for (let i = 0; i < n; i++) {
      const isBoss = i === 0;
      cars.push({
        z: pz + 2100 + i * 360 + rand(0, 110),
        offset: isBoss ? 0 : ((i % 3) - 1) * 0.42 + rand(-0.06, 0.06),
        spd: max * (isBoss ? 0.6 : 0.48 + i * 0.018),
        col: isBoss ? GOLD : (i & 1 ? MAG : CYN),
        passed: false,
        wob: rand(0, TAU),
        near: false,
        boss: isBoss,
        pack: true,
        hp: isBoss ? (isDense() ? st.bossHpD : st.bossHp) : 1,
        dead: false,
        hitT: 0
      });
    }
    audio.boss();
    hitStop(0.055);
    kick(4.2);
    screenFlash(MAG, 0.42);
    toast('终段 · ' + st.pack, false, true);
    setHint('终段驶团 · 涡轮顶上去撞飞', 'hot');
    if (stageLabel) stageLabel.classList.add('boss');
  }

  function palette() {
    const theme = def().theme;
    if (theme === 'desert') {
      return {
        skyTop: [38, 10, 14], skyMid: [168, 48, 32], skyHor: [255, 130, 64],
        fog: [255, 140, 80], lg: [168, 88, 40], lg2: [142, 72, 30],
        rg: [176, 94, 42], rg2: [148, 78, 32],
        road: [46, 32, 36], road2: [56, 40, 44],
        rumble: [255, 90, 40], rumble2: [255, 232, 200],
        lane: [255, 210, 140], sun: [255, 186, 72],
        mtn1: [86, 28, 24], mtn2: [58, 18, 18]
      };
    }
    if (theme === 'canyon') {
      return {
        skyTop: [28, 8, 12], skyMid: [120, 36, 28], skyHor: [220, 90, 48],
        fog: [180, 70, 42], lg: [110, 46, 28], lg2: [88, 34, 22],
        rg: [124, 52, 30], rg2: [96, 38, 24],
        road: [44, 34, 36], road2: [54, 42, 44],
        rumble: [255, 170, 50], rumble2: [40, 24, 20],
        lane: [255, 210, 120], sun: [255, 160, 70],
        mtn1: [72, 24, 18], mtn2: [48, 16, 14]
      };
    }
    if (theme === 'city') {
      return {
        skyTop: [10, 4, 18], skyMid: [36, 12, 48], skyHor: [80, 22, 64],
        fog: [36, 14, 44], lg: [22, 14, 30], lg2: [16, 10, 24],
        rg: [24, 16, 32], rg2: [18, 12, 26],
        road: [28, 24, 36], road2: [36, 32, 46],
        rumble: [0, 232, 255], rumble2: [255, 90, 40],
        lane: [200, 230, 255], sun: [255, 140, 180],
        mtn1: [20, 10, 32], mtn2: [12, 8, 24]
      };
    }
    if (theme === 'snow') {
      return {
        skyTop: [8, 8, 22], skyMid: [28, 28, 52], skyHor: [70, 62, 92],
        fog: [40, 38, 62], lg: [28, 32, 48], lg2: [20, 24, 38],
        rg: [32, 36, 52], rg2: [22, 26, 40],
        road: [30, 32, 44], road2: [38, 40, 54],
        rumble: [255, 90, 40], rumble2: [220, 230, 255],
        lane: [210, 230, 255], sun: [210, 220, 255],
        mtn1: [18, 20, 36], mtn2: [12, 14, 26]
      };
    }
    if (theme === 'forest') {
      return {
        skyTop: [8, 14, 12], skyMid: [22, 48, 36], skyHor: [48, 90, 62],
        fog: [28, 52, 40], lg: [24, 48, 32], lg2: [16, 36, 24],
        rg: [28, 52, 34], rg2: [18, 38, 26],
        road: [32, 30, 30], road2: [42, 40, 38],
        rumble: [255, 90, 40], rumble2: [90, 200, 140],
        lane: [200, 255, 180], sun: [255, 210, 90],
        mtn1: [16, 36, 24], mtn2: [10, 24, 18]
      };
    }
    return {
      skyTop: [6, 4, 18], skyMid: [18, 10, 44], skyHor: [48, 18, 70],
      fog: [22, 12, 40], lg: [16, 12, 28], lg2: [12, 8, 22],
      rg: [18, 14, 30], rg2: [14, 10, 24],
      road: [26, 24, 38], road2: [34, 32, 48],
      rumble: [0, 232, 255], rumble2: [255, 90, 40],
      lane: [210, 230, 255], sun: [180, 200, 255],
      mtn1: [14, 10, 32], mtn2: [8, 6, 22]
    };
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    eng: null,
    eng2: null,
    eng3: null,
    engG: null,
    engF: null,
    ensure() {
      if (!this.ctx) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.34;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.startEngine();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.34;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (err) { /* ignore */ }
    },
    beep(freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(Math.max(40, freq), t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.03);
    },
    noise(dur, vol, hp) {
      if (!this.ctx || this.muted) return;
      const n = Math.max(0.04, dur);
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, Math.max(1, (sr * n) | 0), sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = hp || 700;
      const g = this.ctx.createGain();
      const t = this.ctx.currentTime;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    startEngine() {
      if (!this.ctx || this.eng) return;
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth';
      const o2 = this.ctx.createOscillator();
      o2.type = 'square';
      const o3 = this.ctx.createOscillator();
      o3.type = 'triangle';
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 920;
      const g = this.ctx.createGain();
      g.gain.value = 0;
      o.connect(f);
      o2.connect(f);
      o3.connect(f);
      f.connect(g);
      g.connect(this.master);
      o.start();
      o2.start();
      o3.start();
      this.eng = o;
      this.eng2 = o2;
      this.eng3 = o3;
      this.engG = g;
      this.engF = f;
    },
    tickEngine(spd01, on) {
      if (!this.engG || !this.ctx) return;
      const t = this.ctx.currentTime;
      if (!on) {
        this.engG.gain.setTargetAtTime(0, t, 0.08);
        return;
      }
      const turbo = P.turboOn ? 1.28 : 1;
      const pulse = Math.sin(G.t * (18 + spd01 * 24)) * (3 + spd01 * 12);
      const f = (68 + spd01 * 196 + pulse) * turbo;
      this.eng.frequency.setTargetAtTime(f, t, 0.04);
      this.eng2.frequency.setTargetAtTime(f * 0.5, t, 0.04);
      this.eng3.frequency.setTargetAtTime(f * 2.04, t, 0.04);
      this.engF.frequency.setTargetAtTime(440 + spd01 * 1600 + (P.turboOn ? 400 : 0), t, 0.07);
      const crashMul = P.crashT > 0 ? 0.32 : 1;
      const vol = (0.028 + spd01 * 0.074 + (P.turboOn ? 0.03 : 0)) * crashMul;
      this.engG.gain.setTargetAtTime(this.muted ? 0 : vol, t, 0.05);
    },
    sting() {
      this.beep(392, 0.08, 'square', 0.07, 784);
      this.beep(523, 0.12, 'triangle', 0.05);
      this.beep(784, 0.16, 'square', 0.045);
    },
    check() {
      this.beep(523, 0.1, 'square', 0.085);
      this.beep(659, 0.12, 'triangle', 0.07);
      this.beep(784, 0.18, 'square', 0.06, 1046);
    },
    crash() {
      this.noise(0.28, 0.26, 220);
      this.beep(160, 0.24, 'sawtooth', 0.12, 48);
      this.beep(90, 0.32, 'square', 0.06, 40);
    },
    hit(combo) {
      const lift = 1 + Math.min(0.6, combo * 0.042);
      this.noise(0.034, 0.03, 1400);
      this.beep(480 * lift, 0.055, 'square', 0.04, 980 * lift);
    },
    boom(big) {
      this.noise(big ? 0.24 : 0.1, big ? 0.082 : 0.046, big ? 200 : 420);
      this.beep(big ? 130 : 220, big ? 0.3 : 0.12, 'sawtooth', 0.052, 42);
    },
    combo(m) {
      this.beep(392 * m, 0.07, 'sine', 0.038, 588 * m);
      this.beep(523 * m, 0.1, 'triangle', 0.032, 784 * m);
    },
    overtake(n) {
      const f = 440 + Math.min(8, n) * 58;
      this.beep(f, 0.08, 'square', 0.065, f * 1.75);
      this.beep(f * 0.5, 0.1, 'triangle', 0.03);
    },
    passRival(n) {
      const f = 520 + Math.min(8, n) * 70;
      this.beep(f, 0.09, 'square', 0.08, f * 1.9);
      this.beep(f * 1.5, 0.14, 'triangle', 0.05);
      this.noise(0.05, 0.04, 900);
    },
    near() {
      this.beep(980, 0.045, 'square', 0.04, 1320);
    },
    gear() {
      this.beep(210, 0.045, 'square', 0.045, 480);
    },
    turboOn() {
      this.noise(0.08, 0.05, 900);
      this.beep(220, 0.1, 'sawtooth', 0.05, 640);
      this.beep(880, 0.08, 'square', 0.03, 1320);
    },
    empty() {
      this.beep(140, 0.08, 'square', 0.03, 70);
    },
    boss() {
      this.beep(86, 0.28, 'sawtooth', 0.06, 50);
      this.beep(132, 0.36, 'square', 0.04, 72);
      this.beep(330, 0.12, 'square', 0.04, 660);
    },
    warn() {
      this.beep(880, 0.08, 'square', 0.075);
      this.beep(660, 0.1, 'square', 0.05);
    },
    win() {
      this.beep(523, 0.12, 'square', 0.08);
      this.beep(659, 0.14, 'triangle', 0.07);
      this.beep(784, 0.18, 'square', 0.07);
      this.beep(1046, 0.28, 'triangle', 0.06);
    },
    lose() {
      this.beep(220, 0.3, 'sawtooth', 0.085, 70);
      this.noise(0.2, 0.12, 380);
    }
  };

  function project(worldX, worldY, worldZ, camX, camY, camZ, out) {
    const dz = worldZ - camZ;
    out.z = dz;
    if (dz < 1) {
      out.s = 0;
      out.x = VCX;
      out.y = VH;
      out.w = 0;
      return;
    }
    const s = CAM_D / dz;
    out.s = s;
    out.x = VCX + (worldX - camX) * s * VCX;
    out.y = HORIZON - (worldY - camY) * s * VCX;
    out.w = ROAD_W * s * VCX;
  }

  function quad(x1, y1, x2, y2, x3, y3, x4, y4, rgb, a) {
    ctx.fillStyle = rgba(rgb, a == null ? 1 : a);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }
  function kick(mag) {
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.007));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 6 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die');
        stageEl.classList.remove('hit');
      }
    }, 360);
  }
  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
    G.flashRgb = rgb;
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    toastTok += 1;
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 980);
  }

  function bumpScore(n) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n | 0;
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    if (scoreAdd) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + (n | 0);
      addTok += 1;
      const tok = addTok;
      setTimeout(function () {
        if (tok === addTok) scoreAdd.hidden = true;
      }, 700);
    }
    maybeBest();
    hud();
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, text: text, rgb: rgb, t: 0.9 });
  }

  function emit(n, spec) {
    const count = REDUCE ? Math.ceil(n * 0.4) : n;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        r: rand(spec.r0, spec.r1),
        life: rand(spec.life * 0.5, spec.life),
        max: spec.life,
        rgb: spec.rgb,
        g: spec.g || 0
      });
    }
    if (particles.length > 260) particles.splice(0, particles.length - 260);
  }

  function burstRing(x, y, rgb, r0) {
    if (REDUCE) return;
    rings.push({ x: x, y: y, r: r0 || 8, t: 0.42, rgb: rgb });
  }

  function popCombo() {
    if (!comboEl) return;
    comboEl.classList.remove('hot');
    void comboEl.offsetWidth;
    comboEl.classList.add('hot');
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'win' ? 'GOAL' : kind === 'lose' ? 'TIME UP' : 'ORUN';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function setHint(t, cls) {
    if (!hintEl) return;
    hintEl.textContent = t;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      if (o && typeof o === 'object') {
        G.best.c = o.c | 0;
        G.best.m = o.m | 0;
      } else {
        const n = parseInt(raw, 10);
        if (n > 0) G.best.c = n;
      }
    } catch (err) { /* ignore */ }
  }

  function maybeBest() {
    const k = isDense() ? 'm' : 'c';
    if (G.score > G.best[k]) {
      G.best[k] = G.score | 0;
      try { localStorage.setItem(BEST_KEY, JSON.stringify(G.best)); } catch (err) { /* ignore */ }
    }
  }

  function fmtTime(t) {
    const s = Math.max(0, t);
    const w = Math.floor(s);
    const d = Math.floor((s - w) * 10);
    return w + '.' + d;
  }

  function hud() {
    if (scoreEl) scoreEl.textContent = String(G.score | 0);
    if (bestEl) bestEl.textContent = String(kindBest() | 0);
    if (timeEl) timeEl.textContent = fmtTime(G.time);
    if (spdEl) spdEl.textContent = String(P.kmh | 0);
    if (stageLabel) {
      stageLabel.textContent = def().name + ' · ' + G.depth + '/3';
      stageLabel.classList.toggle('hot', !!def().goal);
      stageLabel.classList.toggle('boss', G.mode === 'play' && G.bossOn && !G.gated);
    }
    if (tagLabel) {
      tagLabel.textContent = P.turboOn ? '涡' : modeName();
      tagLabel.classList.toggle('hot', P.turboOn);
      tagLabel.classList.toggle('warn', isDense() && !P.turboOn);
    }
    if (gapLabel) {
      const g = gapM();
      if (G.mode !== 'play') {
        gapLabel.textContent = '对开';
        gapLabel.className = 'gap';
      } else if (g > 4) {
        gapLabel.textContent = '领先 ' + g + 'm';
        gapLabel.className = 'gap ahead';
      } else if (g < -4) {
        gapLabel.textContent = '落后 ' + (-g) + 'm';
        gapLabel.className = 'gap behind';
      } else {
        gapLabel.textContent = '并驾';
        gapLabel.className = 'gap';
      }
    }
    if (timeBox) timeBox.classList.toggle('low', G.mode === 'play' && G.time < 10);
    if (timeBar) {
      const t = clamp(G.time / Math.max(1, G.timeCap), 0, 1);
      timeBar.style.transform = 'scaleX(' + t + ')';
    }
    if (timeWrap) timeWrap.classList.toggle('low', G.mode === 'play' && G.time < 10);
    if (turboBar) turboBar.style.transform = 'scaleX(' + clamp(P.turbo, 0, 1) + ')';
    if (turboWrap) {
      turboWrap.classList.toggle('on', P.turboOn);
      turboWrap.classList.toggle('low', P.turbo < 0.22 && G.mode === 'play');
    }
    if (btnTurbo) {
      btnTurbo.classList.toggle('on', P.turboOn);
      btnTurbo.classList.toggle('ready', P.turbo > 0.35 && !P.turboOn);
    }
    if (comboEl) {
      const show = G.mode === 'play' && (G.combo > 1 || G.flowN > 2);
      comboEl.hidden = !show;
      if (show) {
        if (G.combo > 1) comboEl.textContent = '连击 ×' + G.combo + (G.mult > 1 ? ' ·' + G.mult + '倍' : '');
        else comboEl.textContent = '疾风 ×' + G.flowN;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'win') setHint('R 再冲 · 把对手甩开冲线', 'hot');
    else if (G.mode === 'lose') setHint('R 重开 · 摔车不会出局，超时才会', 'warn');
    else if (G.time < 10) setHint('时间将尽 · 冲过检查点加时', 'warn');
    else if (P.crashT > 0.4) setHint('复原中 · 油门起来再转向', 'warn');
    else if (G.bossOn) setHint('终段驶团 · Shift 涡轮撞飞', 'hot');
    else if (gapM() < -18) setHint('落后 · 涡轮追上去甩开', 'warn');
    else setHint('← → 转向 · 空格油门 · Shift 涡轮甩开 · R 重开', '');
  }

  function resetDriver(d, side) {
    d.z = side < 0 ? 48 : 18;
    d.x = side * 0.22;
    d.lean = 0;
    d.steerVis = 0;
    d.crashT = 0;
    d.bounce = 0;
    d.off = false;
    d.turbo = 1;
    d.turboOn = false;
    d.gated = false;
    d.emptyT = 0;
    d.forkPick = 0;
    d.passed = false;
    d.near = false;
    d.gear = 1;
    d.curveMem = 0;
    d.kmh = 0;
  }

  function resetRunVars() {
    resetDriver(P, -1);
    resetDriver(R, 1);
    G.combo = 0;
    G.comboT = 0;
    G.comboMax = 0;
    G.mult = 1;
    G.flow = 0;
    G.flowN = 0;
    G.ending = '';
    G.endT = 0;
    G.gated = false;
    G.bossOn = false;
    G.bossDead = false;
    G.packNeed = 0;
    G.packDown = 0;
    G.rivalFirst = false;
    particles.length = 0;
    floats.length = 0;
    smears.length = 0;
    rings.length = 0;
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'core';
    G.stage = 'flame';
    G.route = ['焰湾'];
    G.depth = 1;
    G.score = 0;
    G.time = startTime();
    G.timeCap = G.time;
    resetRunVars();
    P.spd = baseMax() * 0.58;
    R.spd = baseMax() * 0.54;
    buildStage('flame');
    showOverlay('title', '双驶', '左右分屏进屏对开。把对手从弯里甩开。短关之后是终段驶团。');
    hud();
  }

  function startGame(kind) {
    audio.ensure();
    G.kind = kind === 'dense' ? 'dense' : 'core';
    G.mode = 'play';
    G.stage = 'flame';
    G.route = ['焰湾'];
    G.depth = 1;
    G.score = 0;
    G.time = startTime();
    G.timeCap = G.time;
    resetRunVars();
    P.spd = baseMax() * 0.28;
    R.spd = baseMax() * 0.3;
    G.flash = 0.4;
    G.flashRgb = isDense() ? CYN : MAG;
    G.stop = 0;
    G.shake = 0;
    buildStage('flame');
    hideOverlay();
    audio.sting();
    toast(modeName() + (isDense() ? ' · 更密更快' : ' · 对开甩开'), false, true);
    hud();
  }

  function addCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.comboMax) G.comboMax = G.combo;
    G.mult = comboMult();
    popCombo();
    if (G.combo === 3) toast('连击 ×3', false, true);
    if (G.combo === 6) toast('连击 ×6 · 双爆', false, true);
    if (G.combo === 10) toast('连击 ×10 · 无人能及', false, true);
  }

  function onOvertake(car) {
    addCombo();
    const n = (80 * G.combo * G.mult) | 0;
    bumpScore(n);
    floatText(VCX + car.offset * 80, VH * 0.6, '超车 ×' + G.combo, GOLD);
    audio.overtake(G.combo);
    if (G.combo >= 3) {
      hitStop(0.034);
      kick(2.6);
      screenFlash(CYN, 0.16);
    }
    emit(10, {
      x: VCX + car.offset * 90, y: VH * 0.68, j: 14,
      vx0: -90, vx1: 90, vy0: -50, vy1: 70,
      r0: 1.4, r1: 3.2, life: 0.32, rgb: car.col
    });
  }

  function onPassRival() {
    addCombo();
    const n = (220 * G.combo * G.mult) | 0;
    bumpScore(n);
    floatText(VCX, VH * 0.52, '甩开 ×' + G.combo, CYN);
    audio.passRival(G.combo);
    hitStop(0.048);
    kick(4.4);
    screenFlash(CYN, 0.36);
    emit(22, {
      x: VCX + 40, y: VH * 0.6, j: 22,
      vx0: -200, vx1: 200, vy0: -160, vy1: 40,
      r0: 2, r1: 5, life: 0.46, rgb: CYN
    });
    burstRing(VCX, VH * 0.6, CYN, 16);
    toast('甩开对手', false, true);
  }

  function ramCar(c) {
    const sx = VCX + (c.offset - P.x) * 110;
    const sy = VH * 0.62;
    audio.hit(G.combo + 1);
    c.hitT = 0.42;
    c.z += 240;
    if (c.hp > 1) {
      c.hp -= 1;
      c.offset += (P.x >= c.offset ? -1 : 1) * 0.28;
      addCombo();
      const n = (90 * G.combo * G.mult) | 0;
      bumpScore(n);
      floatText(sx, sy, '顶 ' + c.hp, GOLD);
      hitStop(0.036);
      kick(3.4);
      screenFlash(GOLD, 0.28);
      emit(16, {
        x: sx, y: sy, j: 18,
        vx0: -180, vx1: 180, vy0: -140, vy1: 40,
        r0: 1.6, r1: 3.8, life: 0.36, rgb: GOLD
      });
      burstRing(sx, sy, GOLD, 12);
      toast(c.boss ? '双王还在 · 再顶' : '顶飞一层', false, true);
      return;
    }
    c.dead = true;
    c.passed = true;
    addCombo();
    const big = !!c.boss;
    const n = ((big ? 450 : 150) * G.combo * G.mult) | 0;
    bumpScore(n);
    floatText(sx, sy - 8, big ? '双王击破 ×' + G.combo : '爆驶 ×' + G.combo, big ? GOLD : MAG);
    audio.boom(big);
    audio.combo(G.mult);
    hitStop(big ? 0.078 : 0.048);
    kick(big ? 7.4 : 4.8);
    screenFlash(big ? GOLD : MAG, big ? 0.62 : 0.42);
    emit(big ? 42 : 26, {
      x: sx, y: sy, j: 28,
      vx0: -280, vx1: 280, vy0: -240, vy1: 80,
      r0: 2, r1: 6.2, life: 0.55, rgb: c.col
    });
    emit(14, {
      x: sx, y: sy, j: 12,
      vx0: -90, vx1: 90, vy0: -180, vy1: -20,
      r0: 1, r1: 2.8, life: 0.4, rgb: WHT
    });
    burstRing(sx, sy, MAG, big ? 22 : 14);
    burstRing(sx, sy, GOLD, big ? 10 : 6);
    if (c.pack) {
      G.packDown += 1;
      if (c.boss) {
        G.bossDead = true;
        toast('双王爆了', false, true);
      }
    }
  }

  function ramRival() {
    if (R.crashT > 0.2) return;
    R.crashT = 1.15;
    R.bounce = 1;
    R.spd *= 0.42;
    R.turboOn = false;
    const dir = P.x >= R.x ? 1 : -1;
    R.x += dir * 0.34;
    P.x -= dir * 0.12;
    addCombo();
    const n = (180 * G.combo * G.mult) | 0;
    bumpScore(n);
    floatText(VCX, VH * 0.58, '顶飞对手 ×' + G.combo, MAG);
    audio.hit(G.combo);
    audio.boom(false);
    hitStop(0.058);
    kick(5.6);
    screenFlash(MAG, 0.48);
    emit(30, {
      x: VCX, y: VH * 0.62, j: 24,
      vx0: -240, vx1: 240, vy0: -200, vy1: 50,
      r0: 2, r1: 5.4, life: 0.5, rgb: CYN
    });
    burstRing(VCX, VH * 0.6, MAG, 18);
    toast('涡轮顶开', false, true);
  }

  function crashDriver(d, kind, other) {
    if (d.crashT > 0.18) return;
    d.crashT = d.id === 'p' ? 1.45 : 1.2;
    d.bounce = 1;
    d.spd *= kind === 'off' ? 0.16 : 0.18;
    d.turboOn = false;
    if (other) {
      const dir = d.x >= other.offset ? 1 : -1;
      d.x += dir * 0.3;
    } else {
      d.x = clamp(d.x * 0.5, -0.82, 0.82);
    }
    if (d.id !== 'p') return;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.flowN = 0;
    G.flow = 0;
    audio.crash();
    hitStop(0.07);
    kick(8);
    screenFlash(MAG, 0.6);
    emit(34, {
      x: VCX, y: VH - 64, j: 32,
      vx0: -260, vx1: 260, vy0: -210, vy1: 50,
      r0: 2, r1: 6, life: 0.55, rgb: RED
    });
    emit(14, {
      x: VCX, y: VH - 70, j: 12,
      vx0: -90, vx1: 90, vy0: -160, vy1: -20,
      r0: 1, r1: 2.6, life: 0.36, rgb: GOLD
    });
    burstRing(VCX, VH - 70, MAG, 18);
    toast(kind === 'off' ? '冲出 · 减速复原' : '撞车 · 减速复原', true, false);
  }

  function passGate() {
    const st = def();
    const first = !G.rivalFirst;
    if (st.goal) {
      finish('win');
      return;
    }
    const next = P.x < 0 ? st.left : st.right;
    const nxt = GRAPH[next];
    const add = gateTime();
    G.time += add;
    G.timeCap = Math.max(G.timeCap, G.time);
    const bonus = 800 + ((G.time * 8) | 0) + G.combo * 50 + (first ? 360 : 0);
    bumpScore(bonus);
    G.route.push(nxt ? nxt.name : next);
    G.depth += 1;
    G.stage = next;
    const dz = R.z - P.z;
    P.z = 36;
    R.z = clamp(36 + dz, 8, 2200);
    P.x = P.x < 0 ? -0.42 : 0.42;
    R.x = clamp(R.x, -0.6, 0.6);
    P.gated = false;
    R.gated = false;
    G.gated = false;
    P.turbo = Math.min(1, P.turbo + 0.28);
    R.turbo = Math.min(1, R.turbo + 0.22);
    G.rivalFirst = false;
    buildStage(next);
    audio.check();
    hitStop(0.05);
    kick(4.4);
    screenFlash(GOLD, 0.6);
    floatText(VCX, VH * 0.4, '+' + add + '″' + (first ? ' 先到' : ''), GOLD);
    toast((nxt ? nxt.name : next) + '  ·  +' + add + '″' + (first ? ' · 先到' : ''), false, true);
    emit(26, {
      x: VCX, y: HORIZON + 40, j: 90,
      vx0: -150, vx1: 150, vy0: -70, vy1: 90,
      r0: 2, r1: 4.6, life: 0.55, rgb: GOLD
    });
    hud();
  }

  function finish(why) {
    if (G.mode !== 'play') return;
    G.ending = '';
    if (why === 'win') {
      const beat = P.z >= R.z;
      const bonus = 2800 + ((G.time * 80) | 0) + G.comboMax * 40 + (beat ? 800 : 0);
      bumpScore(bonus);
      maybeBest();
      G.mode = 'win';
      audio.win();
      hitStop(0.08);
      screenFlash(GOLD, 0.7);
      const route = G.route.join(' → ');
      showOverlay('win', beat ? '先到' : '冲线', modeName() + '  ' + route + '　·　' + (G.score | 0) + ' 分' + (beat ? '　·　甩开对手' : '　·　对手先到'));
    } else {
      maybeBest();
      G.mode = 'lose';
      audio.lose();
      kick(6);
      showOverlay('lose', '时间到', '冲到 ' + def().name + '　·　' + (G.score | 0) + ' 分。摔车不会出局，超时才会。');
    }
    hud();
  }

  function wantTurbo() {
    if (G.mode !== 'play' || P.crashT > 0) return false;
    if (keys.t || G.turboHold) return true;
    if (inputSrc === 'ptr' && pointer.down && pointer.y < VH * 0.34) return true;
    return false;
  }

  function applyTurbo(d, want, dt, isP) {
    if (want && d.turbo > 0.06 && d.crashT <= 0) {
      if (!d.turboOn && isP) audio.turboOn();
      d.turboOn = true;
      d.turbo = Math.max(0, d.turbo - turboDrain() * dt);
      if (d.turbo <= 0) {
        d.turbo = 0;
        d.turboOn = false;
        if (isP && d.emptyT <= 0) {
          d.emptyT = 0.7;
          audio.empty();
          toast('涡轮空了', true, false);
        }
      }
    } else {
      d.turboOn = false;
      if (!want) d.turbo = Math.min(1, d.turbo + turboFill() * dt);
    }
  }

  function updateDriver(d, dt, ctrl, isP) {
    const playing = G.mode === 'play' && !G.ending;
    const demo = G.mode === 'title';
    const spd01 = clamp(d.spd / baseMax(), 0, 1.5);
    const seg = findSeg(d.z + PLAYER_Z);
    const dx = dt * (isDense() ? 2.5 : 2.16) * Math.max(0.22, Math.min(1, spd01));

    if (playing) applyTurbo(d, ctrl.turbo, dt, isP);
    else d.turboOn = false;

    let steer = ctrl.steer;
    if (d.crashT > 0) steer *= 0.26;
    if (d.turboOn) steer *= 1.08;

    if (!demo || !isP) {
      const leanPow = isDense() ? 0.018 : 0.0005;
      d.lean = lerp(d.lean, steer, 1 - Math.pow(leanPow, dt));
      d.x += d.lean * dx * (d.off ? 0.6 : 1) * (isDense() ? 0.9 : 1);
      d.x -= dx * Math.min(1, spd01) * seg.curve * centrif() * (d.turboOn ? 1.2 : 1);
    }
    if (d.crashT > 0) d.x += (0 - d.x) * 2.2 * dt;
    d.x = clamp(d.x, -2.18, 2.18);
    d.steerVis = lerp(d.steerVis, d.lean, 1 - Math.pow(0.0007, dt));
    d.curveMem = lerp(d.curveMem, seg.curve * Math.min(1, spd01), 1 - Math.pow(0.04, dt));

    const max = maxSpdOf(d);
    if (!demo || !isP) {
      if (d.crashT > 0) d.spd += accelOf(d) * 0.18 * dt;
      else if (ctrl.brake) d.spd += brakeOf() * dt;
      else if (ctrl.gas) d.spd += accelOf(d) * dt;
      else d.spd += coastOf(d) * dt;
    }

    const split = seg.split || 0;
    d.off = split > 0.16
      ? Math.abs(Math.abs(d.x) - split * 1.12) > 0.72
      : Math.abs(d.x) > 1.08;
    if (d.off && d.spd > baseMax() * 0.36) d.spd += offDecel() * dt;
    d.spd = clamp(d.spd, 0, max);
    if (d.gated) {
      d.spd = Math.min(d.spd, baseMax() * 0.22);
      d.z = Math.min(d.z, G.gateZ - PLAYER_Z + 80);
    } else {
      d.z += d.spd * dt;
    }
    if (d.z < 0) d.z = 0;

    d.kmh = clamp(d.spd / baseMax(), 0, 1.5) * (isDense() ? 300 : 280);
    if (d.turboOn) d.kmh = Math.min(kmhMax(), d.kmh * 1.16);

    const gear = spd01 < 0.2 ? 1 : spd01 < 0.46 ? 2 : spd01 < 0.72 ? 3 : 4;
    if (gear > d.gear && playing && isP) audio.gear();
    d.gear = gear;

    if (playing && d.crashT <= 0) {
      if (d.off && spd01 > 0.38) crashDriver(d, 'off');
      else if (Math.abs(d.x) > 1.52) crashDriver(d, 'off');
    }

    if (isP && d.off && playing && Math.random() < 0.42) {
      emit(1, {
        x: VCX + d.lean * 22, y: VH - 34, j: 10,
        vx0: -50, vx1: 50, vy0: -12, vy1: 28,
        r0: 1, r1: 2.3, life: 0.22, rgb: def().theme === 'snow' ? [120, 140, 170] : [170, 110, 70]
      });
    }
  }

  function rivalCtrl(dt) {
    const seg = findSeg(R.z + PLAYER_Z);
    const pz = R.z + PLAYER_Z;
    let aim = 0;
    if (seg.split > 0.16) {
      if (R.forkPick === 0) {
        const prefer = P.x < 0 ? -1 : 1;
        R.forkPick = hash2(((G.t * 3) | 0) + def().seed) > 0.58 ? -prefer : prefer;
      }
      aim = R.forkPick * (0.4 + seg.split * 0.42);
    } else {
      R.forkPick = 0;
      aim = clamp(P.x * 0.22 + Math.sin(G.t * 0.55) * 0.2, -0.62, 0.62);
    }
    let dodge = 0;
    for (let i = 0; i < cars.length; i++) {
      const c = cars[i];
      if (c.dead) continue;
      const dz = c.z - pz;
      if (dz > 80 && dz < 1400 && Math.abs(c.offset - R.x) < 0.38) {
        dodge += R.x >= c.offset ? 0.9 : -0.9;
      }
    }
    const err = (aim + dodge * 0.35) - R.x;
    let steer = clamp(-seg.curve * 0.18 + err * 2.4, -1, 1);
    if (R.crashT > 0) steer *= 0.2;
    const behind = P.z - R.z;
    const wantTurbo = (behind > 380 || G.bossOn) && R.turbo > 0.18 && R.crashT <= 0;
    const gas = R.crashT <= 0;
    const skill = isDense() ? 0.92 : 0.78;
    steer *= skill;
    const cap = isDense() ? 0.98 : 0.9;
    const keep = R.spd < baseMax() * cap;
    return { steer: steer, gas: gas && keep, brake: false, turbo: wantTurbo };
  }

  function playerCtrl() {
    let steer = 0;
    if (keys.l) steer -= 1;
    if (keys.r) steer += 1;
    if (inputSrc === 'ptr' && pointer.down) {
      const local = pointer.x < VX ? pointer.x : pointer.x - VX;
      const tx = (local - VCX) / (VCX * 0.68);
      steer = clamp(tx * 1.4, -1, 1);
    }
    const gas = keys.u || (pointer.down && inputSrc === 'ptr');
    return { steer: steer, gas: gas, brake: keys.d, turbo: wantTurbo() };
  }

  function updateCars(dt) {
    const pz = P.z + PLAYER_Z;
    const rz = R.z + PLAYER_Z;
    const maxz = G.gateZ - 1400;
    const spd01 = clamp(P.spd / baseMax(), 0, 1.4);
    const playing = G.mode === 'play' && !G.ending;
    for (let i = cars.length - 1; i >= 0; i--) {
      const c = cars[i];
      if (c.dead) {
        c.z += c.spd * dt * 0.2;
        c.offset += (c.offset >= 0 ? 1 : -1) * dt * 1.6;
        if (c.z < pz - 800 || Math.abs(c.offset) > 2.4) cars.splice(i, 1);
        continue;
      }
      c.hitT = Math.max(0, (c.hitT || 0) - dt);
      c.z += c.spd * dt;
      if (c.pack && c.z > G.gateZ - 900) {
        c.z = G.gateZ - 900;
        c.spd = Math.min(c.spd, Math.max(P.spd * 0.72, baseMax() * 0.2));
      }
      c.wob += dt * (c.boss ? 3.1 : 2.2);
      if (c.boss && playing) {
        const aim = clamp(P.x * 0.82, -0.7, 0.7);
        c.offset = lerp(c.offset, aim, 1 - Math.pow(0.18, dt));
      } else if (c.pack) {
        c.offset += Math.sin(c.wob * 0.7 + i) * dt * 0.18;
        c.offset = clamp(c.offset, -0.78, 0.78);
      }
      if (!c.passed && pz > c.z + 40 && pz - c.z < 680) {
        c.passed = true;
        if (playing && P.crashT <= 0) onOvertake(c);
      }
      const dz = Math.abs(c.z - pz);
      const dx = Math.abs(c.offset - P.x);
      if (playing && P.crashT <= 0 && G.ending === '' && c.hitT <= 0) {
        if (dz < 195 && dx < 0.28) {
          if (P.turboOn && spd01 > 0.38) ramCar(c);
          else crashDriver(P, 'car', c);
        } else if (dz < 250 && dx < 0.44 && !c.near) {
          c.near = true;
          audio.near();
          emit(6, {
            x: VCX + (c.offset - P.x) * 90, y: VH - 80, j: 8,
            vx0: -40, vx1: 40, vy0: -30, vy1: 40,
            r0: 1, r1: 2.2, life: 0.22, rgb: CYN
          });
        }
      }
      const rdz = Math.abs(c.z - rz);
      if (playing && R.crashT <= 0 && rdz < 190 && Math.abs(c.offset - R.x) < 0.28 && c.hitT <= 0) {
        if (R.turboOn && R.spd > baseMax() * 0.4) {
          c.z += 180;
          c.offset += (R.x >= c.offset ? -1 : 1) * 0.24;
          c.hitT = 0.3;
        } else {
          crashDriver(R, 'car', c);
        }
      }
      if (!c.pack && c.z < pz - 1600) {
        c.z = Math.min(maxz, pz + 2400 + rand(0, 3800));
        c.offset = rand(-0.7, 0.7);
        c.passed = false;
        c.near = false;
        c.col = carColor(Math.random());
        c.hp = 1;
        c.dead = false;
        c.hitT = 0;
      }
    }
  }

  function updateRivalTouch() {
    const playing = G.mode === 'play' && !G.ending;
    if (!playing || P.crashT > 0.1) return;
    const dz = Math.abs((P.z + PLAYER_Z) - (R.z + PLAYER_Z));
    const dx = Math.abs(P.x - R.x);
    if (dz < 200 && dx < 0.3 && R.crashT <= 0) {
      const spd01 = clamp(P.spd / baseMax(), 0, 1.4);
      if (P.turboOn && spd01 > 0.38) ramRival();
      else {
        crashDriver(P, 'car', { offset: R.x });
        if (R.crashT <= 0) {
          R.crashT = 0.7;
          R.spd *= 0.55;
          R.x += (R.x >= P.x ? 1 : -1) * 0.22;
        }
      }
    }
    if (!R.passed && P.z > R.z + 80) {
      R.passed = true;
      onPassRival();
    }
    if (R.z > P.z + 220 && R.passed) {
      R.passed = false;
      toast('被超了', true, false);
      audio.warn();
    }
  }

  function updateJuice(dt) {
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0003, dt));
    G.shake = Math.max(0, G.shake - dt * 26);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    P.crashT = Math.max(0, P.crashT - dt);
    R.crashT = Math.max(0, R.crashT - dt);
    P.bounce = Math.max(0, P.bounce - dt);
    R.bounce = Math.max(0, R.bounce - dt);
    G.comboT = Math.max(0, G.comboT - dt);
    P.emptyT = Math.max(0, P.emptyT - dt);
    if (G.comboT <= 0) {
      G.combo = 0;
      G.mult = 1;
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 420) * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      floats[i].t -= dt;
      floats[i].y -= 30 * dt;
      if (floats[i].t <= 0) floats.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t -= dt;
      rings[i].r += 90 * dt;
      if (rings[i].t <= 0) rings.splice(i, 1);
    }
  }

  function autoDemo(dt) {
    const seg = findSeg(P.z + PLAYER_Z);
    const want = clamp(-seg.curve * 0.16, -0.82, 0.82);
    P.lean = lerp(P.lean, want, 1 - Math.pow(0.01, dt));
    P.x += (want * 0.62 - P.x) * 2.4 * dt;
    P.x = clamp(P.x, -0.85, 0.85);
    P.spd = lerp(P.spd, baseMax() * 0.66, 1 - Math.pow(0.08, dt));
    const rseg = findSeg(R.z + PLAYER_Z);
    const rwant = clamp(-rseg.curve * 0.16 + 0.18, -0.82, 0.82);
    R.lean = lerp(R.lean, rwant, 1 - Math.pow(0.01, dt));
    R.x += (rwant * 0.5 - R.x) * 2.2 * dt;
    R.x = clamp(R.x, -0.85, 0.85);
    R.spd = lerp(R.spd, baseMax() * 0.6, 1 - Math.pow(0.08, dt));
    P.z += P.spd * dt;
    R.z += R.spd * dt;
    P.kmh = (P.spd / baseMax()) * 280;
    R.kmh = (R.spd / baseMax()) * 268;
    P.steerVis = lerp(P.steerVis, P.lean, 1 - Math.pow(0.0007, dt));
    R.steerVis = lerp(R.steerVis, R.lean, 1 - Math.pow(0.0007, dt));
    if (P.z + PLAYER_Z > G.gateZ - 500) {
      P.z = 80;
      R.z = 40;
      P.x = -0.2;
      R.x = 0.22;
      G.bossOn = false;
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    const playing = G.mode === 'play' && !G.ending;
    const demo = G.mode === 'title';
    const spd01 = clamp(P.spd / baseMax(), 0, 1.5);
    audio.tickEngine(Math.min(1, spd01), (playing || demo) && P.spd > 40);

    if (G.stop > 0) {
      G.stop -= dt;
      updateJuice(dt * 0.35);
      return;
    }

    updateJuice(dt);

    if (G.mode === 'win' || G.mode === 'lose') {
      P.spd = Math.max(0, P.spd - baseMax() * 0.62 * dt);
      R.spd = Math.max(0, R.spd - baseMax() * 0.62 * dt);
      P.z += P.spd * dt;
      R.z += R.spd * dt;
      P.kmh = (P.spd / baseMax()) * (isDense() ? 300 : 280);
      P.lean = lerp(P.lean, 0, 1 - Math.pow(0.02, dt));
      R.lean = lerp(R.lean, 0, 1 - Math.pow(0.02, dt));
      P.turboOn = false;
      R.turboOn = false;
      return;
    }

    if (demo) autoDemo(dt);
    else {
      updateDriver(P, dt, playerCtrl(), true);
      updateDriver(R, dt, rivalCtrl(dt), false);
    }
    updateCars(dt);
    if (!demo) updateRivalTouch();

    if (playing && spd01 > 0.8 && !P.off && P.crashT <= 0) {
      G.flow += dt;
      const gap = P.turboOn ? 0.5 : 0.66;
      if (G.flow >= gap) {
        G.flow = 0;
        G.flowN += 1;
        bumpScore((P.turboOn ? 40 : 26) + G.flowN * 6);
        if (G.flowN === 4) toast(P.turboOn ? '涡轮疾风' : '疾风', false, true);
        if (G.flowN === 8) toast('爆走', false, true);
        if (G.flowN === 12) toast('极速', false, true);
      }
    } else {
      G.flow = 0;
      if (P.crashT > 0 || P.off) G.flowN = 0;
    }

    if (spd01 > 0.48 && !REDUCE) {
      if (smears.length < (P.turboOn ? 28 : 20) && Math.random() < 0.58) {
        smears.push({
          x: rand(0, VX),
          y: rand(HORIZON + 8, VH),
          len: rand(16, 80) * Math.min(1.2, spd01),
          a: rand(0.08, 0.26) * Math.min(1.2, spd01),
          v: 900 + spd01 * 1600,
          lean: P.lean,
          turbo: P.turboOn
        });
      }
    }
    for (let i = smears.length - 1; i >= 0; i--) {
      smears[i].y += smears[i].v * dt * 0.28;
      smears[i].x += smears[i].lean * 150 * dt;
      smears[i].a -= dt * 0.78;
      if (smears[i].a <= 0 || smears[i].y > VH + 10) smears.splice(i, 1);
    }

    if (P.turboOn && playing && P.crashT <= 0 && Math.random() < 0.55) {
      emit(1, {
        x: VCX - P.lean * 16 + rand(-6, 6), y: VH - 22, j: 4,
        vx0: -30, vx1: 30, vy0: 20, vy1: 80,
        r0: 1.4, r1: 3.2, life: 0.22, rgb: Math.random() > 0.5 ? CYN : MAG
      });
    }

    if (playing && !G.bossOn && P.z + PLAYER_Z > G.trackLen * 0.76) {
      spawnBossPack();
    }

    if (playing) {
      G.time -= dt;
      if (G.time < 10 && G.time + dt >= Math.ceil(G.time) && G.time > 0) audio.warn();
      if (G.time <= 0) {
        G.time = 0;
        if (!G.ending) {
          G.ending = 'time';
          G.endT = 0.82;
          toast('时间到', true, false);
        }
      }
      if (!R.gated && R.z + PLAYER_Z >= G.gateZ) {
        R.gated = true;
        G.rivalFirst = true;
        toast('对手先到', true, false);
        audio.warn();
      }
      if (!G.gated && P.z + PLAYER_Z >= G.gateZ) {
        G.gated = true;
        P.gated = true;
        passGate();
      }
    }

    if (G.ending === 'time') {
      G.endT -= dt;
      P.spd *= Math.pow(0.08, dt);
      R.spd *= Math.pow(0.08, dt);
      if (G.endT <= 0) finish('time');
    }

    if (playing) G.score += P.spd * dt * 0.014;

    if (G.clock > 0.12) {
      G.clock = 0;
      if (playing) maybeBest();
      hud();
    }
  }

  function drawSky(pal, camX) {
    const g = ctx.createLinearGradient(0, 0, 0, HORIZON + 18);
    g.addColorStop(0, rgba(pal.skyTop, 1));
    g.addColorStop(0.5, rgba(pal.skyMid, 1));
    g.addColorStop(1, rgba(pal.skyHor, 1));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VX, HORIZON + 22);

    const night = def().theme === 'city' || def().theme === 'night' || def().theme === 'snow';
    if (night) {
      for (let i = 0; i < 28; i++) {
        const hx = hash2(i * 19 + 3);
        const hy = hash2(i * 23 + 7);
        ctx.fillStyle = rgba(WHT, 0.22 + hash2(i) * 0.5);
        ctx.fillRect((hx * VX + camX * 0.00002) % VX, hy * (HORIZON - 8), 1.4, 1.4);
      }
    }

    const sunX = VCX + 90 - camX * 0.008;
    const sunY = HORIZON * (night ? 0.38 : 0.52);
    const sunR = night ? 10 : 18;
    const sg = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, 56);
    sg.addColorStop(0, rgba(night ? PNK : pal.sun, 0.95));
    sg.addColorStop(0.25, rgba(pal.sun, 0.55));
    sg.addColorStop(1, rgba(pal.sun, 0));
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 56, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(night ? [230, 210, 255] : pal.sun, 1);
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, TAU);
    ctx.fill();
  }

  function drawMountains(pal, camX, curveMem) {
    const drift = -camX * 0.018 + curveMem * 10;
    function layer(rgb, base, amp, par, seed) {
      ctx.fillStyle = rgba(rgb, 1);
      ctx.beginPath();
      ctx.moveTo(-20, HORIZON + 8);
      for (let i = 0; i <= 12; i++) {
        const px = (i / 12) * (VX + 40) - 20 + drift * par;
        const h = hash2(seed + i) * amp + hash2(seed + i * 3) * amp * 0.4;
        ctx.lineTo(px, HORIZON - base - h);
      }
      ctx.lineTo(VX + 20, HORIZON + 8);
      ctx.closePath();
      ctx.fill();
    }
    layer(pal.mtn1, 26, 40, 0.35, def().seed);
    layer(pal.mtn2, 10, 24, 0.62, def().seed + 9);
  }

  function drawOneRoad(p1, p2, off1, off2, wk, pal, alt, fog, turbo) {
    const x1 = p1.x + off1 * p1.s * VCX;
    const x2 = p2.x + off2 * p2.s * VCX;
    const w1 = p1.w * wk;
    const w2 = p2.w * wk;
    const r1 = w1 * 1.18;
    const r2 = w2 * 1.18;
    const rd = mix(alt ? pal.road : pal.road2, pal.fog, fog);
    const rb = mix(alt ? pal.rumble : pal.rumble2, pal.fog, fog);
    const ln = mix(pal.lane, pal.fog, fog);
    quad(x1 - r1, p1.y, x1 - w1, p1.y, x2 - w2, p2.y, x2 - r2, p2.y, rb);
    quad(x1 + w1, p1.y, x1 + r1, p1.y, x2 + r2, p2.y, x2 + w2, p2.y, rb);
    quad(x1 - w1, p1.y, x1 + w1, p1.y, x2 + w2, p2.y, x2 - w2, p2.y, rd);
    if (turbo && !alt) {
      const sh = mix(MAG, pal.fog, 0.45);
      quad(x1 - w1 * 0.1, p1.y, x1 + w1 * 0.1, p1.y, x2 + w2 * 0.1, p2.y, x2 - w2 * 0.1, p2.y, sh, 0.16);
    }
    if (!alt) {
      const lw1 = Math.max(1, w1 * 0.02);
      const lw2 = Math.max(0.8, w2 * 0.02);
      quad(x1 - lw1, p1.y, x1 + lw1, p1.y, x2 + lw2, p2.y, x2 - lw2, p2.y, ln);
      const o = 0.34;
      quad(x1 - w1 * o - lw1, p1.y, x1 - w1 * o + lw1, p1.y, x2 - w2 * o + lw2, p2.y, x2 - w2 * o - lw2, p2.y, ln);
      quad(x1 + w1 * o - lw1, p1.y, x1 + w1 * o + lw1, p1.y, x2 + w2 * o + lw2, p2.y, x2 + w2 * o - lw2, p2.y, ln);
    }
  }

  function drawSeg(seg, pal, fogT, turbo) {
    const p1 = seg.p1;
    const p2 = seg.p2;
    const alt = (Math.floor(seg.i / RUMBLE) & 1) === 0;
    const fog = fogT * fogT * 0.88;
    const lg = mix(alt ? pal.lg : pal.lg2, pal.fog, fog);
    const rg = mix(alt ? pal.rg : pal.rg2, pal.fog, fog);
    const sp1 = seg.i > 0 ? segs[seg.i - 1].split : 0;
    const sp2 = seg.split;
    quad(0, p1.y, p1.x, p1.y, p2.x, p2.y, 0, p2.y, lg);
    quad(p1.x, p1.y, VX, p1.y, VX, p2.y, p2.x, p2.y, rg);
    if (sp2 < 0.08 && sp1 < 0.08) {
      drawOneRoad(p1, p2, 0, 0, 1, pal, alt, fog, turbo);
    } else {
      const o1 = sp1 * 2280;
      const o2 = sp2 * 2280;
      drawOneRoad(p1, p2, -o1, -o2, 0.76, pal, alt, fog, turbo);
      drawOneRoad(p1, p2, o1, o2, 0.76, pal, alt, fog, turbo);
    }
  }

  function clipSprite(y, h, clip) {
    if (y >= clip) return 0;
    if (y + h > clip) return clip - y;
    return h;
  }

  function drawScenery(spr, p, clip, pal) {
    const destH = spr.h * p.s * VCX * 0.00115;
    const destW = spr.w * p.s * VCX * 0.00115;
    const x = p.x + spr.o * p.w;
    const y0 = p.y;
    const w = destW;
    const vis = clipSprite(y0 - destH, destH, clip);
    if (vis <= 1 || w < 1) return;
    const y = y0 - destH;
    const h = destH;
    const night = def().theme === 'city' || def().theme === 'night';
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VX, clip);
    ctx.clip();

    if (spr.k === 'palm') {
      ctx.fillStyle = rgba([92, 52, 28], 1);
      ctx.fillRect(x - w * 0.08, y + h * 0.28, w * 0.16, h * 0.72);
      ctx.fillStyle = rgba(night ? [20, 90, 80] : [36, 150, 92], 1);
      ctx.beginPath();
      ctx.moveTo(x, y + h * 0.38);
      ctx.quadraticCurveTo(x - w * 0.7, y + h * 0.1, x - w * 0.15, y + h * 0.22);
      ctx.quadraticCurveTo(x + w * 0.75, y, x + w * 0.12, y + h * 0.24);
      ctx.quadraticCurveTo(x - w * 0.1, y - h * 0.05, x, y + h * 0.3);
      ctx.fill();
    } else if (spr.k === 'cactus') {
      ctx.fillStyle = rgba([40, 130, 70], 1);
      ctx.fillRect(x - w * 0.12, y, w * 0.24, h);
      ctx.fillRect(x - w * 0.42, y + h * 0.3, w * 0.3, w * 0.16);
      ctx.fillRect(x + w * 0.12, y + h * 0.22, w * 0.28, w * 0.16);
    } else if (spr.k === 'dune') {
      ctx.fillStyle = rgba(mix([196, 140, 70], pal.fog, 0.15), 1);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, y + h);
      ctx.quadraticCurveTo(x, y, x + w * 0.5, y + h);
      ctx.fill();
    } else if (spr.k === 'rock') {
      ctx.fillStyle = rgba(mix([90, 70, 62], pal.fog, 0.2), 1);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, y + h);
      ctx.lineTo(x - w * 0.2, y + h * 0.2);
      ctx.lineTo(x + w * 0.15, y);
      ctx.lineTo(x + w * 0.5, y + h);
      ctx.fill();
    } else if (spr.k === 'cliff') {
      ctx.fillStyle = rgba([110, 42, 28], 1);
      ctx.fillRect(x - w * 0.5, y, w, h);
      ctx.fillStyle = rgba([160, 70, 40], 0.5);
      ctx.fillRect(x - w * 0.2, y + h * 0.1, w * 0.2, h * 0.8);
    } else if (spr.k === 'build') {
      ctx.fillStyle = rgba(night ? [18, 14, 36] : [40, 32, 52], 1);
      ctx.fillRect(x - w * 0.5, y, w, h);
      const rows = 5;
      for (let r = 0; r < rows; r++) {
        const on = hash2(spr.h + r * 7 + (p.x | 0)) > 0.32;
        ctx.fillStyle = rgba(on ? (r & 1 ? MAG : CYN) : [16, 10, 28], on ? 0.88 : 0.4);
        ctx.fillRect(x - w * 0.28, y + h * 0.08 + r * h * 0.16, w * 0.18, h * 0.08);
        ctx.fillRect(x + w * 0.08, y + h * 0.08 + r * h * 0.16, w * 0.18, h * 0.08);
      }
    } else if (spr.k === 'neon') {
      ctx.fillStyle = rgba([36, 36, 48], 1);
      ctx.fillRect(x - w * 0.08, y + h * 0.12, w * 0.16, h * 0.88);
      ctx.fillStyle = rgba((spr.h | 0) % 2 ? MAG : CYN, 0.9);
      ctx.beginPath();
      ctx.arc(x, y + h * 0.1, Math.max(2, w * 0.3), 0, TAU);
      ctx.fill();
    } else if (spr.k === 'pine') {
      ctx.fillStyle = rgba([62, 40, 28], 1);
      ctx.fillRect(x - w * 0.08, y + h * 0.62, w * 0.16, h * 0.38);
      ctx.fillStyle = rgba(night ? [18, 58, 52] : [28, 92, 62], 1);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w * 0.48, y + h * 0.72);
      ctx.lineTo(x - w * 0.48, y + h * 0.72);
      ctx.closePath();
      ctx.fill();
    } else if (spr.k === 'snow') {
      ctx.fillStyle = rgba(mix([200, 210, 230], pal.fog, 0.2), 1);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, y + h);
      ctx.lineTo(x, y);
      ctx.lineTo(x + w * 0.5, y + h);
      ctx.fill();
    } else if (spr.k === 'lamp') {
      ctx.fillStyle = rgba([40, 40, 52], 1);
      ctx.fillRect(x - w * 0.08, y + h * 0.15, w * 0.16, h * 0.85);
      ctx.fillStyle = rgba(PNK, 0.88);
      ctx.beginPath();
      ctx.arc(x, y + h * 0.12, Math.max(2, w * 0.28), 0, TAU);
      ctx.fill();
    } else if (spr.k === 'post') {
      ctx.fillStyle = rgba([80, 50, 40], 1);
      ctx.fillRect(x - w * 0.1, y, w * 0.2, h);
    } else if (spr.k === 'pillar') {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fillRect(x - w * 0.28, y, w * 0.56, h);
      ctx.fillStyle = rgba(MAG, 0.72);
      ctx.fillRect(x - w * 0.18, y + h * 0.08, w * 0.36, h * 0.84);
    } else if (spr.k === 'check' || spr.k === 'goal') {
      ctx.fillStyle = rgba(spr.k === 'goal' ? GOLD : CYN, 0.55);
      ctx.fillRect(x - w * 0.5, y + h * 0.15, w, h * 0.28);
      ctx.fillStyle = rgba(WHT, 0.92);
      ctx.font = 'bold ' + Math.max(10, h * 0.22) + 'px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(spr.k === 'goal' ? 'GOAL' : 'CHECK', x, y + h * 0.3);
    } else if (spr.k === 'bill') {
      ctx.fillStyle = rgba([20, 12, 18], 0.9);
      ctx.fillRect(x - w * 0.5, y, w, h * 0.7);
      ctx.strokeStyle = rgba(ORG, 0.85);
      ctx.lineWidth = Math.max(1, w * 0.03);
      ctx.strokeRect(x - w * 0.5, y, w, h * 0.7);
      if (spr.lab) {
        ctx.fillStyle = rgba(GOLD, 0.95);
        ctx.font = 'bold ' + Math.max(9, h * 0.18) + 'px "Segoe UI","PingFang SC",sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(spr.lab, x, y + h * 0.35);
      }
    }
    ctx.restore();
  }

  function drawTrafficCar(c, p, clip) {
    const destW = (c.boss ? 640 : 560) * p.s * VCX * 0.00115;
    const destH = destW * 0.62;
    const x = p.x + c.offset * p.w;
    const y0 = p.y;
    if (clipSprite(y0 - destH, destH, clip) <= 2 || destW < 2) return;
    const wob = Math.sin(c.wob) * destW * 0.02;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VX, clip);
    ctx.clip();
    if (c.dead) ctx.globalAlpha = 0.45;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(x + wob, y0 - destH * 0.08, destW * 0.46, destH * 0.12, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(c.col, 1);
    ctx.beginPath();
    ctx.moveTo(x - destW * 0.46 + wob, y0);
    ctx.lineTo(x - destW * 0.38 + wob, y0 - destH * 0.62);
    ctx.lineTo(x - destW * 0.18 + wob, y0 - destH * 0.78);
    ctx.lineTo(x + destW * 0.18 + wob, y0 - destH * 0.78);
    ctx.lineTo(x + destW * 0.38 + wob, y0 - destH * 0.62);
    ctx.lineTo(x + destW * 0.46 + wob, y0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.45);
    ctx.fillRect(x - destW * 0.2 + wob, y0 - destH * 0.7, destW * 0.4, destH * 0.16);
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.fillRect(x - destW * 0.34 + wob, y0 - destH * 0.28, destW * 0.14, destH * 0.12);
    ctx.fillRect(x + destW * 0.2 + wob, y0 - destH * 0.28, destW * 0.14, destH * 0.12);
    ctx.fillStyle = '#1a1218';
    ctx.fillRect(x - destW * 0.4 + wob, y0 - destH * 0.18, destW * 0.16, destH * 0.14);
    ctx.fillRect(x + destW * 0.24 + wob, y0 - destH * 0.18, destW * 0.16, destH * 0.14);
    if (c.boss) {
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = Math.max(1.2, destW * 0.04);
      ctx.strokeRect(x - destW * 0.5 + wob, y0 - destH, destW, destH);
    }
    ctx.restore();
  }

  function drawCarBody(col, leanAmt, crashSpin, scaleY, turbo, badge) {
    ctx.save();
    ctx.rotate(leanAmt + crashSpin);
    ctx.scale(1, scaleY);

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 52, 9, 0, 0, TAU);
    ctx.fill();

    if (turbo) {
      const flick = 0.7 + Math.sin(G.t * 42) * 0.3;
      ctx.fillStyle = rgba(CYN, 0.45 * flick);
      ctx.beginPath();
      ctx.moveTo(-10, 14);
      ctx.lineTo(0, 14 + 30 * flick);
      ctx.lineTo(10, 14);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.7 * flick);
      ctx.beginPath();
      ctx.moveTo(-6, 14);
      ctx.lineTo(0, 14 + 18 * flick);
      ctx.lineTo(6, 14);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.moveTo(-3, 14);
      ctx.lineTo(0, 14 + 10 * flick);
      ctx.lineTo(3, 14);
      ctx.fill();
    }

    ctx.fillStyle = '#141018';
    ctx.fillRect(-46, 6, 16, 12);
    ctx.fillRect(30, 6, 16, 12);
    ctx.fillStyle = '#2a2430';
    ctx.beginPath();
    ctx.ellipse(-38, 12, 11, 7, 0, 0, TAU);
    ctx.ellipse(38, 12, 11, 7, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(col, 1);
    ctx.beginPath();
    ctx.moveTo(-50, 10);
    ctx.lineTo(-38, -8);
    ctx.lineTo(-16, -16);
    ctx.lineTo(16, -16);
    ctx.lineTo(38, -8);
    ctx.lineTo(50, 10);
    ctx.lineTo(38, 16);
    ctx.lineTo(-38, 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(mix(col, WHT, 0.28), 0.95);
    ctx.beginPath();
    ctx.moveTo(-34, 4);
    ctx.lineTo(-20, -10);
    ctx.lineTo(20, -10);
    ctx.lineTo(34, 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(CYN, 0.5);
    ctx.beginPath();
    ctx.moveTo(-18, -10);
    ctx.lineTo(-10, -22);
    ctx.lineTo(10, -22);
    ctx.lineTo(18, -10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba([40, 24, 28], 1);
    ctx.fillRect(-14, -12, 8, 10);
    ctx.fillRect(6, -12, 8, 10);

    ctx.fillStyle = rgba(MAG, 1);
    ctx.fillRect(-32, 8, 12, 5);
    ctx.fillRect(20, 8, 12, 5);
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.fillRect(-28, 9, 5, 3);
    ctx.fillRect(24, 9, 5, 3);

    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.fillRect(-8, 11, 16, 3);
    ctx.fillStyle = '#1a1014';
    ctx.font = 'bold 7px "Segoe UI",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge || 'OR', 0, 6);

    ctx.restore();
  }

  function drawSelf(d, col, badge) {
    const lean = d.steerVis;
    const hop = d.crashT > 0 ? Math.abs(Math.sin(d.crashT * 17)) * 14 * Math.min(1, d.crashT) : 0;
    const squat = Math.min(1, d.spd / baseMax()) * 5;
    const x = VCX + lean * 48;
    const y = VH - 26 - hop + squat;
    const spd01 = clamp(d.spd / baseMax(), 0, 1.4);
    const crashSpin = d.crashT > 0 ? Math.sin(d.crashT * 21) * 0.55 * Math.min(1, d.crashT) : 0;

    if (spd01 > 0.38 && !REDUCE && Math.abs(lean) > 0.08) {
      for (let i = 4; i >= 1; i--) {
        const k = i / 4;
        ctx.save();
        ctx.globalAlpha = (0.07 + Math.abs(lean) * 0.16 + (d.turboOn ? 0.08 : 0)) * k * Math.min(1, spd01);
        ctx.translate(x - lean * 24 * i, y + 5 * i);
        drawCarBody(col, lean * 0.9, 0, 1, false, badge);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    ctx.save();
    ctx.translate(x, y);
    drawCarBody(col, lean * 0.38 + crashSpin * 0.3, crashSpin, 1 - hop * 0.008, d.turboOn && d.crashT <= 0, badge);
    ctx.restore();
  }

  function drawOtherRacer(other, cam, pal) {
    const dz = (other.z + PLAYER_Z) - cam.z;
    if (dz < 80 || dz > DRAW * SEG) return;
    const seg = findSeg(other.z + PLAYER_Z);
    const u = clamp(((other.z + PLAYER_Z) - seg.z1) / SEG, 0, 1);
    const p = {
      x: lerp(seg.p1.x, seg.p2.x, u),
      y: lerp(seg.p1.y, seg.p2.y, u),
      w: lerp(seg.p1.w, seg.p2.w, u),
      s: lerp(seg.p1.s, seg.p2.s, u)
    };
    const fake = {
      offset: other.x,
      col: other.id === 'p' ? MAG : CYN,
      wob: G.t * 4,
      boss: false,
      dead: other.crashT > 0.4,
      pack: false
    };
    drawTrafficCar(fake, p, seg.clip);
    void pal;
  }

  function drawSmearLocal() {
    const spd01 = clamp(P.spd / baseMax(), 0, 1.4);
    if (spd01 < 0.4 || REDUCE) return;
    const vpX = VCX - P.x * 28 + P.lean * 18;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(P.turboOn ? MAG : CYN, 0.05 + spd01 * 0.09);
    ctx.lineWidth = P.turboOn ? 1.6 : 1.2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(vpX, HORIZON + 8);
      ctx.lineTo((i / 8) * VX + P.lean * 28, VH);
      ctx.stroke();
    }
    ctx.restore();
    for (let i = 0; i < smears.length; i++) {
      const s = smears[i];
      ctx.strokeStyle = rgba(s.turbo ? MAG : WHT, s.a);
      ctx.lineWidth = s.turbo ? 1.8 : 1.4;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + s.lean * 12, s.y + s.len);
      ctx.stroke();
    }
  }

  function drawRoadFor(cam) {
    const pal = palette();
    const pz = cam.z;
    const playerSeg = findSeg(pz + PLAYER_Z);
    const pPct = ((pz + PLAYER_Z) / SEG) - playerSeg.i;
    const playerY = lerp(playerSeg.y1, playerSeg.y2, clamp(pPct, 0, 1));
    const base = findSeg(pz);
    const bPct = (pz / SEG) - base.i;
    const camX = cam.x * ROAD_W;
    const camY = playerY + CAM_H;
    const camZ = pz;

    let x = 0;
    let dx = -base.curve * clamp(bPct, 0, 1);
    const nDraw = Math.min(DRAW, segs.length - base.i);
    let maxy = VH;

    for (let n = 0; n < nDraw; n++) {
      const seg = segs[base.i + n];
      project(0, seg.y1, seg.z1, camX - x, camY, camZ, seg.p1);
      project(0, seg.y2, seg.z2, camX - x, camY, camZ, seg.p2);
      seg.clip = maxy;
      x += dx;
      dx += seg.curve;
    }

    const carOn = [];
    for (let i = 0; i < cars.length; i++) {
      const ci = Math.floor(cars[i].z / SEG) - base.i;
      if (ci >= 0 && ci < nDraw) {
        if (!carOn[ci]) carOn[ci] = [];
        carOn[ci].push(cars[i]);
      }
    }

    for (let n = nDraw - 1; n >= 0; n--) {
      const seg = segs[base.i + n];
      const p1 = seg.p1;
      const p2 = seg.p2;
      if (p1.z <= CAM_D * 0.9 || p2.y >= p1.y || p2.y >= maxy) continue;
      const fogT = n / Math.max(1, nDraw);
      drawSeg(seg, pal, fogT, cam.turboOn);
      maxy = p2.y;
      if (seg.sprites) {
        for (let s = 0; s < seg.sprites.length; s++) {
          drawScenery(seg.sprites[s], p2, seg.clip, pal);
        }
      }
      if (carOn[n]) {
        for (let k = 0; k < carOn[n].length; k++) {
          const c = carOn[n][k];
          const u = clamp((c.z - seg.z1) / SEG, 0, 1);
          drawTrafficCar(c, {
            x: lerp(p1.x, p2.x, u),
            y: lerp(p1.y, p2.y, u),
            w: lerp(p1.w, p2.w, u),
            s: lerp(p1.s, p2.s, u)
          }, seg.clip);
        }
      }
    }
    return pal;
  }

  function drawView(cam, other, originX, selfCol, badge, label, isPlayerView) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(originX, 0, VX, VH);
    ctx.clip();
    ctx.translate(originX, 0);

    const pal = palette();
    const roll = REDUCE ? 0 : cam.lean * (cam.turboOn ? 0.12 : 0.08);
    ctx.save();
    ctx.translate(VCX, HORIZON + 48);
    ctx.rotate(roll);
    ctx.translate(-VCX, -(HORIZON + 48));

    drawSky(pal, cam.x * ROAD_W);
    drawMountains(pal, cam.x * ROAD_W, cam.curveMem);
    if (segs.length) {
      drawRoadFor(cam);
      drawOtherRacer(other, cam, pal);
      if (isPlayerView) drawSmearLocal();
      drawSelf(cam, selfCol, badge);
    }
    ctx.restore();

    ctx.fillStyle = rgba(isPlayerView ? MAG : CYN, 0.88);
    ctx.font = 'bold 11px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, 10, 18);
    ctx.fillStyle = rgba(WHT, 0.7);
    ctx.font = '10px "Segoe UI",sans-serif';
    ctx.fillText(String(cam.kmh | 0) + ' km/h', 10, 32);

    if (cam.turboOn) {
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.font = 'bold 10px "Segoe UI",sans-serif';
      ctx.fillText('TURBO', 10, 46);
    }
    ctx.restore();
  }

  function drawHudCanvas() {
    ctx.save();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillRect(VX - 2, 0, 4, VH);
    ctx.fillStyle = rgba(MAG, 0.55);
    ctx.fillRect(VX - 3, 0, 1, VH);
    ctx.fillStyle = rgba(CYN, 0.55);
    ctx.fillRect(VX + 2, 0, 1, VH);

    const g = gapM();
    ctx.save();
    ctx.translate(VX, 56);
    ctx.fillStyle = rgba([20, 8, 6], 0.72);
    ctx.fillRect(-36, -16, 72, 28);
    ctx.strokeStyle = rgba(g > 4 ? CYN : g < -4 ? MAG : GOLD, 0.7);
    ctx.strokeRect(-36, -16, 72, 28);
    ctx.fillStyle = rgba(g > 4 ? CYN : g < -4 ? MAG : GOLD, 0.95);
    ctx.font = 'bold 11px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(g > 4 ? '▲' + g : g < -4 ? '▼' + (-g) : '═', 0, 0);
    ctx.restore();

    if (G.mode === 'play' && G.bossOn) {
      ctx.fillStyle = rgba(MAG, 0.14 + Math.sin(G.t * 8) * 0.05);
      ctx.fillRect(0, 0, VW, 8);
      ctx.fillRect(0, VH - 8, VW, 8);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.font = 'bold 12px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(def().pack, VX, 22);
    }

    if (G.mode === 'play' && G.time < 10) {
      ctx.fillStyle = rgba(MAG, 0.12 + Math.sin(G.t * 10) * 0.06);
      ctx.fillRect(0, 0, VW, 8);
      ctx.fillRect(0, VH - 8, VW, 8);
    }

    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, clamp(r.t * 2.2, 0, 0.85));
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.globalAlpha = clamp(f.t * 1.4, 0, 1);
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = 'bold 18px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.life / (p.max || 0.4), 0, 1));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
      ctx.fillRect(0, 0, VW, VH);
    }
    ctx.restore();
  }

  function draw() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const pw = stageEl ? stageEl.clientWidth : 800;
    const ph = stageEl ? stageEl.clientHeight : 450;
    if (pw !== W || ph !== H || canvas.width !== (pw * dpr | 0)) resize();

    const pal = palette();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = rgba(pal.skyTop, 1);
    ctx.fillRect(0, 0, W, H);

    const shx = G.shake > 0 && !REDUCE ? (Math.random() - 0.5) * G.shake : 0;
    const shy = G.shake > 0 && !REDUCE ? (Math.random() - 0.5) * G.shake * 0.6 : 0;
    ctx.save();
    ctx.translate(ox + shx, oy + shy);
    ctx.scale(scale * G.punch, scale * G.punch);
    if (G.punch !== 1) {
      ctx.translate(VW * (1 / G.punch - 1) * 0.5, VH * (1 / G.punch - 1) * 0.5);
    }

    ctx.beginPath();
    ctx.rect(0, 0, VW, VH);
    ctx.clip();
    ctx.fillStyle = rgba(pal.skyHor, 1);
    ctx.fillRect(0, 0, VW, VH);

    drawView(P, R, 0, MAG, 'OR', '你', true);
    drawView(R, P, VX, CYN, 'RV', '对手', false);
    drawHudCanvas();
    ctx.restore();
  }

  function resize() {
    if (!stageEl) return;
    W = Math.max(1, stageEl.clientWidth);
    H = Math.max(1, stageEl.clientHeight);
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function pointerVirtX(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientX - rect.left - ox) / scale;
  }
  function pointerVirtY(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientY - rect.top - oy) / scale;
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('core');
    else startGame(G.kind || 'core');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('core');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W' || k === ' ' || k === 'Spacebar' || e.code === 'Space') {
      keys.u = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'Shift' || k === 'z' || k === 'Z' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      keys.t = down;
      if (down) inputSrc = 'key';
    }
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || k === ' ' || k === 'Enter')) {
      e.preventDefault();
    }
    if (!down) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (k === '1') {
      startGame('core');
      return;
    }
    if (k === '2') {
      startGame('dense');
      return;
    }
    if (k === 'Enter' || k === ' ' || k === 'Spacebar' || e.code === 'Space') {
      if (overlayOpen()) primaryAction();
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerVirtX(e), 0, VW);
      pointer.y = pointerVirtY(e);
      inputSrc = 'ptr';
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerVirtX(e), 0, VW);
      pointer.y = pointerVirtY(e);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down) inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  let acc = 0;
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = now * 0.001;
      return;
    }
    const t = now * 0.001;
    if (!last) last = t;
    let dt = t - last;
    last = t;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 5) {
      update(STEP);
      acc -= STEP;
      n += 1;
    }
    draw();
  }

  function initMute() {
    let m = false;
    try { m = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { m = false; }
    audio.setMuted(m);
  }

  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnCore) {
    btnCore.addEventListener('click', function () {
      audio.ensure();
      startGame('core');
    });
  }
  if (btnDense) {
    btnDense.addEventListener('click', function () {
      audio.ensure();
      startGame('dense');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'core');
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      goTitle();
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  if (btnTurbo) {
    const turboDown = function (e) {
      e.preventDefault();
      audio.ensure();
      G.turboHold = true;
      inputSrc = 'key';
    };
    const turboUp = function () { G.turboHold = false; };
    btnTurbo.addEventListener('pointerdown', turboDown);
    btnTurbo.addEventListener('pointerup', turboUp);
    btnTurbo.addEventListener('pointerleave', turboUp);
    btnTurbo.addEventListener('pointercancel', turboUp);
  }

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) last = 0;
  });
  requestAnimationFrame(frame);
})();
