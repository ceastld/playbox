'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const CX = VW * 0.5;
  const HORIZON = VH * 0.36;
  const SEG = 200;
  const ROAD_W = 2000;
  const CAM_H = 1000;
  const CAM_D = 0.84;
  const PLAYER_Z = CAM_H * CAM_D;
  const DRAW = 178;
  const RUMBLE = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const BEST_KEY = 'playbox-outrun2-best';
  const MUTE_KEY = 'playbox-outrun2-mute';
  const OPS = '← → / A D 转向 · ↑ W 油门 · ↓ S 刹车 · 空格漂移 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 45, 120];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const SUN = [255, 90, 24];
  const YEL = [255, 194, 48];
  const RED = [255, 58, 40];
  const WHT = [255, 244, 234];
  const PNK = [255, 176, 168];
  const ICE = [200, 230, 255];
  const SAND = [232, 186, 92];
  const CHR = [210, 220, 230];

  const GRAPH = {
    coconut: { name: '椰滩', theme: 'sea', seed: 18, left: 'cloud', right: 'palm', depth: 1 },
    cloud: { name: '云岭', theme: 'alp', seed: 36, left: 'castle', right: 'deep', depth: 2 },
    palm: { name: '棕湾', theme: 'sea', seed: 54, left: 'deep', right: 'sand', depth: 2 },
    castle: { name: '城垣', theme: 'cas', seed: 72, left: 'snow', right: 'falls', depth: 3 },
    deep: { name: '深湖', theme: 'lak', seed: 90, left: 'falls', right: 'avenue', depth: 3 },
    sand: { name: '砂海', theme: 'des', seed: 108, left: 'avenue', right: 'ruins', depth: 3 },
    snow: { name: '雪廊', theme: 'alp', seed: 126, left: 'peak', right: 'cascade', depth: 4 },
    falls: { name: '瀑谷', theme: 'lak', seed: 144, left: 'cascade', right: 'capital', depth: 4 },
    avenue: { name: '王道', theme: 'cit', seed: 162, left: 'capital', right: 'relic', depth: 4 },
    ruins: { name: '遗墟', theme: 'des', seed: 180, left: 'relic', right: 'sunset', depth: 4 },
    peak: { name: '雪峰', theme: 'alp', seed: 198, goal: true, depth: 5 },
    cascade: { name: '飞瀑', theme: 'lak', seed: 216, goal: true, depth: 5 },
    capital: { name: '王城', theme: 'cit', seed: 234, goal: true, depth: 5 },
    relic: { name: '遗塔', theme: 'des', seed: 252, goal: true, depth: 5 },
    sunset: { name: '落日', theme: 'sea', seed: 270, goal: true, depth: 5 }
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
  const btnCoast = document.getElementById('btn-coast');
  const btnNight = document.getElementById('btn-night');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnLeft = document.getElementById('btn-left');
  const btnGas = document.getElementById('btn-gas');
  const btnBrake = document.getElementById('btn-brake');
  const btnDrift = document.getElementById('btn-drift');
  const btnRight = document.getElementById('btn-right');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const timeEl = document.getElementById('time');
  const spdEl = document.getElementById('spd');
  const scoreBox = document.getElementById('score-box');
  const timeBox = document.getElementById('time-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const comboEl = document.getElementById('combo-label');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const timeBar = document.getElementById('time-bar');
  const timeWrap = document.getElementById('time-wrap');
  const driftBar = document.getElementById('drift-bar');
  const driftWrap = document.getElementById('drift-wrap');

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
  let comboTok = 0;
  let radioI = 0;
  let radioAcc = 0;
  let whooshCd = 0;

  const keys = { l: false, r: false, u: false, d: false, drift: false };
  const pointer = { down: false, hover: false, x: CX, y: VH * 0.7, id: null };
  const particles = [];
  const floats = [];
  const smears = [];
  const flakes = [];
  const segs = [];
  const cars = [];

  const dummy = {
    i: 0, y1: 0, y2: 0, z1: 0, z2: SEG, curve: 0, split: 0, fork: 0,
    sprites: null,
    p1: { x: CX, y: VH, w: 0, s: 0, z: 1 },
    p2: { x: CX, y: VH, w: 0, s: 0, z: 1 },
    clip: VH
  };

  const G = {
    mode: 'title',
    kind: 'coast',
    stage: 'coconut',
    route: ['椰滩'],
    path: [0],
    t: 0,
    clock: 0,
    z: 0,
    x: 0,
    spd: 0,
    steerVis: 0,
    drift: 0,
    driftHold: 0,
    slide: 0,
    score: 0,
    best: { h: 0, n: 0 },
    time: 52,
    timeCap: 52,
    combo: 0,
    comboT: 0,
    driftCombo: 0,
    driftTick: 0,
    flow: 0,
    flowN: 0,
    gear: 1,
    trackLen: 0,
    gateZ: 0,
    gated: false,
    crashT: 0,
    bounce: 0,
    off: false,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: GOLD,
    punch: 1,
    ending: '',
    endT: 0,
    why: '',
    curveMem: 0,
    kmh: 0,
    depth: 1,
    whooshOn: false
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
  function isNight() {
    return G.kind === 'night';
  }
  function maxSpd() {
    return isNight() ? 14200 : 11200;
  }
  function accel() {
    return maxSpd() / 2.95;
  }
  function brake() {
    return -maxSpd() / 1.22;
  }
  function coastDecel() {
    return -maxSpd() / 6.4;
  }
  function offDecel() {
    return -maxSpd() / 1.62;
  }
  function startTime() {
    return isNight() ? 38 : 52;
  }
  function gateTime() {
    return isNight() ? 12 : 16;
  }
  function centrif() {
    return isNight() ? 0.58 : 0.46;
  }
  function def() {
    return GRAPH[G.stage] || GRAPH.coconut;
  }
  function kindBest() {
    return isNight() ? G.best.n : G.best.h;
  }
  function themeOf() {
    return def().theme;
  }
  function kmhMax() {
    return isNight() ? 318 : 258;
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

  function hillAmp(theme) {
    if (theme === 'alp') return 1720;
    if (theme === 'des') return 380;
    if (theme === 'cas') return 1100;
    if (theme === 'cit') return 220;
    if (theme === 'lak') return 480;
    return 760;
  }
  function curveAmp(theme, night) {
    const base = night ? 8.2 : 6.6;
    if (theme === 'alp') return base * 1.16;
    if (theme === 'des') return base * 0.76;
    if (theme === 'cas') return base * 1.22;
    if (theme === 'cit') return base * 0.92;
    if (theme === 'lak') return base * 0.82;
    return base;
  }

  function buildStage(id) {
    const st = GRAPH[id] || GRAPH.coconut;
    G.stage = GRAPH[id] ? id : 'coconut';
    segs.length = 0;
    cars.length = 0;
    flakes.length = 0;
    const night = isNight();
    const theme = st.theme;
    const target = night ? 680 : 800;
    const hills = hillAmp(theme);
    const curves = curveAmp(theme, night);

    addRoad(16, 30, 14, 0, 0);
    let k = 0;
    while (segs.length < target - 140) {
      const h = hash2(st.seed * 13 + k * 3);
      const h2 = hash2(st.seed * 17 + k * 5 + 2);
      const h3 = hash2(st.seed * 19 + k * 7 + 4);
      let curve = (h - 0.5) * 2 * curves;
      if (h > 0.86) curve = 0;
      if (theme === 'cas' && h > 0.4 && h < 0.62) curve = (h > 0.5 ? 1 : -1) * curves * 1.12;
      const hill = lastY() + (h2 - 0.46) * hills;
      const enter = 12 + (h3 * 20) | 0;
      const hold = 16 + (hash2(k + 41 + st.seed) * 48) | 0;
      const leave = 10 + (hash2(k + 43 + st.seed) * 20) | 0;
      addRoad(enter, hold, leave, curve, hill);
      k += 1;
    }
    addRoad(18, 40, 14, 0, lastY() * 0.2);
    addRoad(10, 30, 8, 0, 0);

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
    placeSprites(st, night);
    placeCars(st, night);
  }

  function placeSprites(st, night) {
    const theme = st.theme;
    const step = theme === 'cit' || theme === 'cas' ? 3 : 4;
    for (let i = 8; i < segs.length - 20; i += step) {
      if (segs[i].fork) continue;
      const r = hash2(st.seed * 91 + i * 17);
      const side = hash2(st.seed + i * 3) > 0.5 ? 1 : -1;
      const dist = 1.18 + hash2(i + 9) * 1.55;
      if (theme === 'sea') {
        if (r > 0.2) addSprite(i, -dist - 0.12, 'palm', 900 + (r * 280) | 0, 250);
        if (r > 0.4) addSprite(i, dist + 0.08, r > 0.8 ? 'rock' : 'palm', r > 0.8 ? 260 : 840, 230);
        if ((i % 20) === 0) addSprite(i, side * 1.04, 'post', 400, 64);
      } else if (theme === 'alp') {
        if (r > 0.16) addSprite(i, -dist, 'pine', 980 + (r * 420) | 0, 280);
        if (r > 0.32) addSprite(i, dist + 0.08, r > 0.72 ? 'snowrock' : 'pine', r > 0.72 ? 320 : 860, r > 0.72 ? 280 : 250);
        if ((i % 16) === 0) addSprite(i, side * 1.08, 'pole', 520, 50);
      } else if (theme === 'des') {
        if (r > 0.18) addSprite(i, -dist, r > 0.68 ? 'dune' : 'cactus', r > 0.68 ? 420 : 540, r > 0.68 ? 520 : 180);
        if (r > 0.34) addSprite(i, dist + 0.1, r > 0.62 ? 'ruin' : 'rock', r > 0.62 ? 620 : 280, r > 0.62 ? 280 : 190);
      } else if (theme === 'cas') {
        if (r > 0.1) addSprite(i, -dist - 0.06, r > 0.62 ? 'tower' : 'wall', r > 0.62 ? 980 : 620, r > 0.62 ? 280 : 520);
        if (r > 0.28) addSprite(i, dist + 0.08, r > 0.7 ? 'tower' : 'wall', r > 0.7 ? 920 : 580, r > 0.7 ? 260 : 500);
        if ((i % 10) === 0) addSprite(i, side * 1.08, 'banner', 560, 90);
      } else if (theme === 'cit') {
        if (r > 0.08) addSprite(i, -dist - 0.1, 'build', 820 + (r * 640) | 0, 340);
        if (r > 0.22) addSprite(i, dist + 0.1, 'build', 760 + (r * 520) | 0, 320);
        if ((i % 6) === 0) addSprite(i, side * 1.12, 'lamp', 640, 68);
      } else {
        if (r > 0.18) addSprite(i, -dist, r > 0.7 ? 'birch' : 'reed', r > 0.7 ? 880 : 360, r > 0.7 ? 180 : 160);
        if (r > 0.36) addSprite(i, dist + 0.1, 'reed', 340, 150);
      }
      if (night && theme !== 'cit' && (i % 12) === 0) addSprite(i, side * 1.1, 'lamp', 620, 64);
    }
    const gate = segs.length - 16;
    addSprite(gate, -1.05, 'pillar', 1400, 160);
    addSprite(gate, 1.05, 'pillar', 1400, 160);
    addSprite(gate, 0, st.goal ? 'goal' : 'check', 520, 900);
    if (!st.goal) {
      const L = GRAPH[st.left];
      const R = GRAPH[st.right];
      addSprite(segs.length - 64, -1.35, 'bill', 500, 400, L ? L.name : '左');
      addSprite(segs.length - 64, 1.35, 'bill', 500, 400, R ? R.name : '右');
    }
  }

  function placeCars(st, night) {
    const n = night ? 24 : 14;
    const max = maxSpd();
    for (let i = 0; i < n; i++) {
      const z = (64 + i * ((segs.length - 180) / n) + hash2(st.seed + i) * 32) * SEG;
      if (z > G.trackLen - 22000) continue;
      cars.push({
        z: z,
        offset: (hash2(st.seed * 3 + i) - 0.5) * 1.28,
        spd: max * (night ? 0.5 + hash2(i + 8) * 0.38 : 0.32 + hash2(i + 8) * 0.36),
        col: carColor(hash2(st.seed + i * 19)),
        passed: false,
        wob: hash2(i + 4) * TAU
      });
    }
  }

  function carColor(h) {
    if (h < 0.14) return [70, 90, 210];
    if (h < 0.28) return [40, 190, 120];
    if (h < 0.42) return [250, 250, 255];
    if (h < 0.56) return [220, 40, 70];
    if (h < 0.7) return [180, 70, 255];
    if (h < 0.84) return [30, 30, 36];
    return [255, 150, 40];
  }

  function palette() {
    const theme = themeOf();
    const night = isNight();
    if (theme === 'alp') {
      return {
        skyTop: night ? [8, 12, 32] : [70, 130, 190],
        skyMid: night ? [24, 40, 80] : [150, 190, 220],
        skyHor: night ? [50, 70, 110] : [230, 240, 250],
        fog: night ? [40, 55, 90] : [210, 225, 240],
        lg: night ? [48, 64, 88] : [210, 222, 232],
        lg2: night ? [36, 50, 72] : [188, 204, 218],
        rg: night ? [52, 66, 90] : [220, 230, 238],
        rg2: night ? [40, 54, 76] : [198, 212, 226],
        road: [42, 46, 58], road2: [52, 56, 68],
        rumble: [230, 240, 255], rumble2: [40, 70, 140],
        lane: [220, 236, 255],
        sun: night ? [210, 220, 255] : [255, 250, 240],
        mtn1: night ? [28, 40, 70] : [90, 120, 150],
        mtn2: night ? [16, 24, 48] : [60, 90, 120],
        cap: [245, 250, 255]
      };
    }
    if (theme === 'des') {
      return {
        skyTop: night ? [28, 10, 18] : [255, 170, 70],
        skyMid: night ? [70, 24, 22] : [255, 140, 50],
        skyHor: night ? [120, 48, 28] : [255, 210, 120],
        fog: night ? [90, 36, 24] : [255, 186, 96],
        lg: night ? [110, 70, 32] : [214, 168, 78],
        lg2: night ? [92, 56, 24] : [196, 148, 62],
        rg: night ? [120, 76, 34] : [226, 176, 82],
        rg2: night ? [100, 62, 26] : [204, 156, 68],
        road: [58, 44, 36], road2: [70, 54, 42],
        rumble: [255, 150, 40], rumble2: [80, 40, 20],
        lane: [255, 220, 140],
        sun: [255, 196, 70],
        mtn1: night ? [70, 28, 18] : [186, 96, 42],
        mtn2: night ? [48, 18, 12] : [150, 72, 32],
        cap: [255, 230, 160]
      };
    }
    if (theme === 'cas') {
      return {
        skyTop: night ? [16, 8, 28] : [70, 36, 90],
        skyMid: night ? [48, 16, 44] : [180, 70, 70],
        skyHor: night ? [90, 28, 48] : [255, 140, 80],
        fog: night ? [50, 18, 36] : [210, 120, 90],
        lg: night ? [42, 36, 44] : [92, 78, 68],
        lg2: night ? [32, 28, 36] : [76, 64, 54],
        rg: night ? [48, 34, 42] : [108, 82, 64],
        rg2: night ? [36, 26, 32] : [90, 68, 52],
        road: [46, 40, 46], road2: [56, 48, 54],
        rumble: [200, 60, 70], rumble2: [240, 220, 190],
        lane: [255, 210, 160],
        sun: [255, 180, 90],
        mtn1: night ? [36, 20, 36] : [80, 48, 52],
        mtn2: night ? [22, 12, 24] : [56, 34, 38],
        cap: [210, 170, 110]
      };
    }
    if (theme === 'cit') {
      return {
        skyTop: night ? [8, 6, 28] : [36, 20, 70],
        skyMid: night ? [28, 12, 52] : [90, 40, 110],
        skyHor: night ? [70, 20, 70] : [255, 110, 70],
        fog: night ? [32, 14, 44] : [180, 80, 80],
        lg: night ? [16, 14, 30] : [48, 42, 58],
        lg2: night ? [12, 10, 24] : [38, 34, 48],
        rg: night ? [20, 12, 32] : [56, 40, 52],
        rg2: night ? [14, 10, 26] : [44, 32, 42],
        road: [32, 30, 42], road2: [42, 40, 52],
        rumble: [0, 240, 255], rumble2: [255, 45, 120],
        lane: [200, 230, 255],
        sun: night ? [255, 140, 180] : [255, 170, 80],
        mtn1: night ? [18, 10, 36] : [48, 28, 62],
        mtn2: night ? [10, 8, 24] : [32, 18, 44],
        cap: [255, 120, 160]
      };
    }
    if (theme === 'lak') {
      return {
        skyTop: night ? [6, 14, 28] : [40, 90, 140],
        skyMid: night ? [12, 40, 64] : [80, 150, 170],
        skyHor: night ? [30, 70, 90] : [170, 220, 210],
        fog: night ? [20, 50, 70] : [140, 200, 200],
        lg: night ? [10, 50, 70] : [36, 120, 130],
        lg2: night ? [8, 40, 58] : [28, 104, 116],
        rg: night ? [14, 56, 72] : [48, 128, 128],
        rg2: night ? [10, 44, 60] : [36, 110, 114],
        road: [36, 42, 50], road2: [46, 52, 60],
        rumble: [0, 220, 200], rumble2: [20, 40, 50],
        lane: [180, 255, 240],
        sun: [255, 230, 170],
        mtn1: night ? [16, 36, 48] : [50, 90, 90],
        mtn2: night ? [10, 24, 36] : [32, 68, 72],
        cap: [200, 240, 230]
      };
    }
    return {
      skyTop: night ? [14, 6, 28] : [32, 8, 40],
      skyMid: night ? [54, 14, 52] : [210, 40, 58],
      skyHor: night ? [96, 28, 58] : [255, 110, 42],
      fog: night ? [46, 16, 42] : [255, 140, 72],
      lg: night ? [8, 52, 84] : [12, 108, 148],
      lg2: night ? [10, 64, 98] : [16, 126, 164],
      rg: night ? [96, 64, 36] : [204, 150, 58],
      rg2: night ? [74, 48, 26] : [174, 124, 44],
      road: [44, 38, 48], road2: [54, 46, 58],
      rumble: [255, 90, 24], rumble2: [248, 236, 220],
      lane: [255, 220, 140],
      sun: [255, 196, 70],
      mtn1: night ? [32, 12, 36] : [68, 24, 48],
      mtn2: night ? [20, 8, 26] : [46, 16, 32],
      cap: [255, 160, 90]
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
      f.frequency.value = 780;
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
      const pulse = Math.sin(G.t * (18 + spd01 * 22)) * (3 + spd01 * 10);
      const f = 56 + spd01 * 156 + pulse + G.drift * 22;
      this.eng.frequency.setTargetAtTime(f, t, 0.042);
      this.eng2.frequency.setTargetAtTime(f * 0.5, t, 0.042);
      this.eng3.frequency.setTargetAtTime(f * 2.02, t, 0.042);
      this.engF.frequency.setTargetAtTime(360 + spd01 * 1280 + G.drift * 360, t, 0.07);
      const crashMul = G.crashT > 0 ? 0.34 : 1;
      this.engG.gain.setTargetAtTime(this.muted ? 0 : (0.026 + spd01 * 0.068 + G.drift * 0.018) * crashMul, t, 0.055);
    },
    radio(freq) {
      this.beep(freq, 0.1, 'triangle', 0.04);
      this.beep(freq * 1.5, 0.08, 'sine', 0.016);
    },
    sting() {
      this.beep(440, 0.08, 'square', 0.07, 880);
      this.beep(554, 0.12, 'triangle', 0.05);
      this.beep(659, 0.16, 'square', 0.04);
    },
    driftOn() {
      this.noise(0.14, 0.18, 1500);
      this.beep(480, 0.09, 'sawtooth', 0.055, 210);
    },
    driftTick() {
      this.noise(0.05, 0.1, 1900);
      this.beep(1020 + G.driftCombo * 42, 0.04, 'square', 0.036, 1480);
    },
    check() {
      this.beep(523, 0.09, 'square', 0.085);
      this.beep(659, 0.12, 'triangle', 0.07);
      this.beep(784, 0.16, 'square', 0.06);
      this.beep(1046, 0.22, 'triangle', 0.05, 1318);
    },
    crash() {
      this.noise(0.28, 0.26, 220);
      this.beep(150, 0.24, 'sawtooth', 0.12, 44);
    },
    whoosh() {
      this.noise(0.26, 0.13, 920);
      this.beep(220, 0.16, 'sine', 0.028, 90);
    },
    overtake(n) {
      const f = 460 + Math.min(8, n) * 56;
      this.beep(f, 0.07, 'square', 0.062, f * 1.75);
      this.beep(f * 0.5, 0.1, 'triangle', 0.028);
    },
    gear() {
      this.beep(200, 0.05, 'square', 0.042, 480);
    },
    warn() {
      this.beep(880, 0.07, 'square', 0.07);
      this.beep(640, 0.1, 'square', 0.05);
    },
    win() {
      this.beep(523, 0.1, 'square', 0.08);
      this.beep(659, 0.12, 'triangle', 0.07);
      this.beep(784, 0.16, 'square', 0.07);
      this.beep(1046, 0.26, 'triangle', 0.06);
      this.beep(1318, 0.3, 'sine', 0.04);
    },
    lose() {
      this.beep(196, 0.3, 'sawtooth', 0.08, 70);
      this.noise(0.2, 0.1, 380);
    }
  };

  const RIFF = [440, 554, 0, 659, 740, 0, 880, 740, 659, 0, 494, 440, 554, 659, 880, 0];

  function project(worldX, worldY, worldZ, camX, camY, camZ, out) {
    const dz = worldZ - camZ;
    out.z = dz;
    if (dz < 1) {
      out.s = 0;
      out.x = CX;
      out.y = VH;
      out.w = 0;
      return;
    }
    const s = CAM_D / dz;
    out.s = s;
    out.x = CX + (worldX - camX) * s * CX;
    out.y = HORIZON - (worldY - camY) * s * CX;
    out.w = ROAD_W * s * CX;
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
    floats.push({ x: x, y: y, text: text, rgb: rgb, t: 0.85 });
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
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
    if (particles.length > 240) particles.splice(0, particles.length - 240);
  }

  function popCombo() {
    if (!comboEl) return;
    comboEl.classList.remove('hot');
    void comboEl.offsetWidth;
    comboEl.classList.add('hot');
    comboTok += 1;
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'win' ? 'GOAL' : kind === 'lose' ? 'TIME UP' : 'OR2';
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
        G.best.h = o.h | 0;
        G.best.n = o.n | 0;
      } else {
        const n = parseInt(raw, 10);
        if (n > 0) G.best.h = n;
      }
    } catch (err) { /* ignore */ }
  }

  function maybeBest() {
    const k = isNight() ? 'n' : 'h';
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
    if (spdEl) spdEl.textContent = String(G.kmh | 0);
    if (stageLabel) {
      stageLabel.textContent = def().name + ' · ' + G.depth + '/5';
      stageLabel.classList.toggle('hot', !!def().goal);
    }
    if (tagLabel) {
      tagLabel.textContent = isNight() ? '夜奔' : '海岸';
      tagLabel.classList.toggle('night', isNight());
    }
    if (timeBox) timeBox.classList.toggle('low', G.mode === 'play' && G.time < 10);
    if (timeBar) {
      const t = clamp(G.time / Math.max(1, G.timeCap), 0, 1);
      timeBar.style.transform = 'scaleX(' + t + ')';
    }
    if (timeWrap) timeWrap.classList.toggle('low', G.mode === 'play' && G.time < 10);
    if (driftBar) driftBar.style.transform = 'scaleX(' + clamp(G.drift, 0, 1) + ')';
    if (driftWrap) driftWrap.classList.toggle('hot', G.drift > 0.45);
    if (comboEl) {
      const show = G.mode === 'play' && (G.driftCombo > 1 || G.combo > 1 || G.flowN > 2);
      comboEl.hidden = !show;
      if (show) {
        if (G.driftCombo >= G.combo && G.driftCombo > 1) comboEl.textContent = '连漂 ×' + G.driftCombo;
        else if (G.combo > 1) comboEl.textContent = '连超 ×' + G.combo;
        else comboEl.textContent = '疾风 ×' + G.flowN;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'win') setHint('R 再开 · 路线 ' + G.route.join(' → '), 'hot');
    else if (G.mode === 'lose') setHint('R 重开 · 撞击只减速，超时才结束', 'warn');
    else if (G.time < 10) setHint('时间将尽 · 冲过检查门加时', 'warn');
    else if (G.crashT > 0.4) setHint('复原中 · 油门起来再甩尾', 'warn');
    else if (findSeg(G.z + PLAYER_Z).fork === 1) setHint('分叉 · 靠左或靠右选下一段风景', 'hot');
    else if (G.drift > 0.45) setHint('漂移中 · 压住弯道', 'hot');
    else setHint('← → 转向 · ↑ 油门 · 空格漂移过弯 · R 重开', '');
  }

  function resetRun(kind, play) {
    G.kind = kind === 'night' ? 'night' : 'coast';
    G.stage = 'coconut';
    G.route = ['椰滩'];
    G.path = [0];
    G.depth = 1;
    G.score = play ? 0 : G.score;
    G.time = startTime();
    G.timeCap = G.time;
    G.z = play ? 40 : 0;
    G.x = 0;
    G.spd = maxSpd() * (play ? 0.28 : 0.55);
    G.crashT = 0;
    G.bounce = 0;
    G.ending = '';
    G.endT = 0;
    G.combo = 0;
    G.comboT = 0;
    G.drift = 0;
    G.driftHold = 0;
    G.slide = 0;
    G.driftCombo = 0;
    G.driftTick = 0;
    G.flow = 0;
    G.flowN = 0;
    G.gear = 1;
    G.steerVis = 0;
    G.gated = false;
    G.whooshOn = false;
    G.off = false;
    particles.length = 0;
    floats.length = 0;
    smears.length = 0;
    flakes.length = 0;
    buildStage('coconut');
  }

  function goTitle() {
    G.mode = 'title';
    G.score = 0;
    resetRun('coast', false);
    showOverlay('title', '疾风2', '后视超跑，过弯甩尾。超车赶检查点，五段分叉冲线。撞了减速，超时出局。');
    hud();
  }

  function startGame(kind) {
    audio.ensure();
    G.mode = 'play';
    resetRun(kind, true);
    G.flash = 0.35;
    G.flashRgb = isNight() ? MAG : YEL;
    G.stop = 0;
    G.shake = 0;
    hideOverlay();
    audio.sting();
    toast(isNight() ? '夜奔 · 车流更密，弯更急' : '海岸 · 五段分叉，过弯甩尾', false, true);
    hud();
  }

  function onOvertake(car) {
    G.combo += 1;
    G.comboT = 2.2;
    const n = 88 * G.combo;
    bumpScore(n);
    floatText(CX + car.offset * 80, VH * 0.62, '超车 ×' + G.combo, GOLD);
    audio.overtake(G.combo);
    if (G.combo >= 3) {
      hitStop(0.036);
      kick(3);
      screenFlash(CYN, 0.18);
    }
    if (G.combo === 3) toast('连超 ×3', false, true);
    if (G.combo === 6) toast('连超 ×6 · 疾风', false, true);
    if (G.combo === 10) toast('连超 ×10 · 无人能及', false, true);
    popCombo();
    emit(10, {
      x: CX + car.offset * 90, y: VH * 0.7, j: 16,
      vx0: -80, vx1: 80, vy0: -40, vy1: 80,
      r0: 1.5, r1: 3.5, life: 0.35, rgb: car.col
    });
  }

  function onDriftCombo() {
    G.driftCombo += 1;
    const n = 48 * G.driftCombo;
    bumpScore(n);
    floatText(CX + G.slide * 36, VH * 0.5, '连漂 ×' + G.driftCombo, YEL);
    audio.driftTick();
    popCombo();
    if (G.driftCombo === 4) toast('连漂 ×4', false, true);
    if (G.driftCombo === 8) toast('连漂 ×8 · 贴弯', false, true);
    if (G.driftCombo === 12) toast('连漂 ×12 · 甩尾之王', false, true);
    if (G.driftCombo >= 3) {
      hitStop(0.038);
      kick(2.6);
    }
  }

  function crashInto(car) {
    if (G.crashT > 0.15) return;
    G.crashT = 1.22;
    G.bounce = 1;
    G.spd *= 0.34;
    const dir = G.x >= car.offset ? 1 : -1;
    G.x += dir * 0.24;
    G.combo = 0;
    G.driftCombo = 0;
    G.drift = 0;
    G.driftHold = 0;
    G.flowN = 0;
    G.flow = 0;
    G.whooshOn = false;
    audio.crash();
    hitStop(0.07);
    kick(7.8);
    screenFlash(MAG, 0.58);
    emit(30, {
      x: CX, y: VH - 70, j: 30,
      vx0: -240, vx1: 240, vy0: -200, vy1: 40,
      r0: 2, r1: 5.6, life: 0.52, rgb: RED
    });
    emit(14, {
      x: CX, y: VH - 70, j: 12,
      vx0: -90, vx1: 90, vy0: -130, vy1: -20,
      r0: 1, r1: 2.4, life: 0.32, rgb: GOLD
    });
    floatText(CX, VH * 0.5, '减速', MAG);
    toast('撞击 · 减速复原', true, false);
    hud();
  }

  function onRoadX(x, split) {
    if (split < 0.14) return Math.abs(x) <= 1.06;
    const c = split * 1.12;
    const hw = 0.7;
    return Math.abs(Math.abs(x) - c) <= hw;
  }

  function passGate() {
    const st = def();
    if (st.goal) {
      finish('win');
      return;
    }
    const goLeft = G.x < 0;
    const next = goLeft ? st.left : st.right;
    const nxt = GRAPH[next];
    const add = gateTime();
    G.time += add;
    G.timeCap = Math.max(G.timeCap, G.time);
    const bonus = 820 + ((G.time * 6) | 0) + G.combo * 40 + G.driftCombo * 28;
    bumpScore(bonus);
    G.route.push(nxt ? nxt.name : next);
    G.path.push(goLeft ? 0 : 1);
    G.depth = nxt ? nxt.depth : G.depth + 1;
    G.stage = next;
    G.z = 30;
    G.x = goLeft ? -0.45 : 0.45;
    G.gated = false;
    buildStage(next);
    audio.check();
    hitStop(0.055);
    kick(4.5);
    screenFlash(GOLD, 0.62);
    floatText(CX, VH * 0.42, '+' + add + '″', GOLD);
    toast((nxt ? nxt.name : next) + '  ·  +' + add + '″', false, true);
    emit(26, {
      x: CX, y: HORIZON + 40, j: 80,
      vx0: -140, vx1: 140, vy0: -60, vy1: 90,
      r0: 2, r1: 4.6, life: 0.55, rgb: GOLD
    });
    hud();
  }

  function finish(why) {
    if (G.mode !== 'play') return;
    G.ending = '';
    if (why === 'win') {
      const bonus = 3000 + ((G.time * 80) | 0);
      bumpScore(bonus);
      maybeBest();
      G.mode = 'win';
      audio.win();
      hitStop(0.08);
      screenFlash(GOLD, 0.7);
      showOverlay('win', '到达', '路线 ' + G.route.join(' → ') + '　·　' + (G.score | 0) + ' 分');
    } else {
      maybeBest();
      G.mode = 'lose';
      audio.lose();
      kick(6);
      showOverlay('lose', '时间到', '冲到 ' + def().name + '　·　' + (G.score | 0) + ' 分。撞击只减速，超时出局。');
    }
    hud();
  }

  function updateCars(dt) {
    const pz = G.z + PLAYER_Z;
    const maxz = G.gateZ - 1800;
    for (let i = 0; i < cars.length; i++) {
      const c = cars[i];
      c.z += c.spd * dt;
      c.wob += dt * 2;
      if (!c.passed && pz > c.z + 50 && pz - c.z < 700) {
        c.passed = true;
        if (G.mode === 'play' && G.crashT <= 0) onOvertake(c);
      }
      if (G.mode === 'play' && G.crashT <= 0 && G.ending === '') {
        if (Math.abs(c.z - pz) < 210 && Math.abs(c.offset - G.x) < 0.3) {
          crashInto(c);
        }
      }
      if (c.z < pz - 1600) {
        c.z = Math.min(maxz, pz + 2400 + rand(0, 3800));
        c.offset = rand(-0.72, 0.72);
        c.passed = false;
        c.col = carColor(Math.random());
        c.spd = maxSpd() * (isNight() ? 0.52 + Math.random() * 0.36 : 0.32 + Math.random() * 0.36);
      }
    }
  }

  function updateJuice(dt) {
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0003, dt));
    G.shake = Math.max(0, G.shake - dt * 26);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.crashT = Math.max(0, G.crashT - dt);
    G.bounce = Math.max(0, G.bounce - dt);
    G.comboT = Math.max(0, G.comboT - dt);
    if (G.comboT <= 0) G.combo = 0;
    if (G.drift < 0.25) {
      G.driftTick = 0;
      if (G.driftHold <= 0) G.driftCombo = Math.max(0, G.driftCombo - dt * 2.2);
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
      floats[i].y -= 28 * dt;
      if (floats[i].t <= 0) floats.splice(i, 1);
    }
    for (let i = flakes.length - 1; i >= 0; i--) {
      const f = flakes[i];
      f.y += f.vy * dt;
      f.x += f.vx * dt;
      f.life -= dt;
      if (f.life <= 0 || f.y > VH) flakes.splice(i, 1);
    }
  }

  function spawnWeather(dt, spd01) {
    const theme = themeOf();
    if (REDUCE) return;
    if (theme === 'alp' && flakes.length < 48 && Math.random() < 0.55 + dt) {
      flakes.push({
        x: rand(0, VW),
        y: rand(0, HORIZON + 20),
        vx: rand(-18, 12) - G.x * 8,
        vy: 40 + spd01 * 90,
        r: rand(1.1, 2.4),
        life: rand(1.2, 2.4),
        rgb: ICE
      });
    }
    if (theme === 'des' && spd01 > 0.4 && particles.length < 180 && Math.random() < 0.35) {
      emit(1, {
        x: rand(40, VW - 40), y: HORIZON + rand(8, 40), j: 8,
        vx0: -10, vx1: 10, vy0: -28, vy1: -8,
        r0: 1.4, r1: 3.2, life: 0.55, rgb: SAND, g: -40
      });
    }
  }

  function autoDemo(dt) {
    const seg = findSeg(G.z + PLAYER_Z);
    const want = clamp(-seg.curve * 0.13, -0.72, 0.72);
    if (seg.split > 0.2) G.x += ((G.x < 0 ? -0.7 : 0.7) - G.x) * 2.4 * dt;
    else G.x += (want - G.x) * 2.2 * dt;
    G.spd = lerp(G.spd, maxSpd() * 0.62, 1 - Math.pow(0.08, dt));
    const wantDrift = Math.abs(seg.curve) > 3.6 ? 0.88 : 0;
    G.drift = lerp(G.drift, wantDrift, 1 - Math.pow(0.04, dt));
    G.slide = lerp(G.slide, G.drift * (seg.curve > 0 ? -1 : 1) * 0.7, 1 - Math.pow(0.03, dt));
    if (G.z + PLAYER_Z > G.gateZ - 400) {
      G.z = 80;
      G.x = 0;
      G.drift = 0;
    }
  }

  function wantGas() {
    if (keys.u) return true;
    if (inputSrc === 'ptr' && pointer.down && pointer.y < VH * 0.86) return true;
    return false;
  }
  function wantBrake() {
    if (keys.d) return true;
    if (inputSrc === 'ptr' && pointer.down && pointer.y >= VH * 0.86) return true;
    return false;
  }
  function wantDrift() {
    return keys.drift;
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    const playing = G.mode === 'play' && !G.ending;
    const demo = G.mode === 'title';
    const spd01 = clamp(G.spd / maxSpd(), 0, 1);
    audio.tickEngine(spd01, (playing || demo) && G.spd > 40);

    if (playing) {
      radioAcc += dt;
      if (radioAcc >= 0.2) {
        radioAcc -= 0.2;
        const note = RIFF[radioI % RIFF.length];
        radioI += 1;
        if (note) audio.radio(note);
      }
    }

    if (G.stop > 0) {
      G.stop -= dt;
      updateJuice(dt * 0.35);
      return;
    }

    updateJuice(dt);

    if (G.mode === 'win' || G.mode === 'lose') {
      G.spd = Math.max(0, G.spd - maxSpd() * 0.6 * dt);
      G.z += G.spd * dt;
      G.kmh = (G.spd / maxSpd()) * kmhMax();
      G.drift = lerp(G.drift, 0, 1 - Math.pow(0.02, dt));
      return;
    }

    if (demo) autoDemo(dt);

    const seg = findSeg(G.z + PLAYER_Z);
    const dx = dt * (isNight() ? 2.4 : 2.08) * Math.max(0.22, spd01);

    let steer = 0;
    if (!demo) {
      if (keys.l) steer -= 1;
      if (keys.r) steer += 1;
      if (inputSrc === 'ptr' && pointer.down) {
        const tx = (pointer.x - CX) / (CX * 0.68);
        steer = clamp(tx * 1.38, -1, 1);
      }
      if (G.crashT > 0) steer *= 0.34;
    }

    const canDrift = !demo && playing && G.crashT <= 0 && spd01 > 0.28 && wantDrift();
    const wasDrift = G.drift;
    if (!demo) {
      G.drift = lerp(G.drift, canDrift ? 1 : 0, 1 - Math.pow(canDrift ? 0.0004 : 0.008, dt));
      if (canDrift && wasDrift < 0.35 && G.drift >= 0.35) {
        audio.driftOn();
        hitStop(0.048);
        kick(3.4);
        screenFlash(YEL, 0.24);
        emit(20, {
          x: CX + (steer >= 0 ? 38 : -38), y: VH - 34, j: 10,
          vx0: -150, vx1: 150, vy0: -40, vy1: 80,
          r0: 1.2, r1: 3.4, life: 0.34, rgb: GOLD
        });
      }
    }

    if (!demo) {
      const driftSteer = 1 + G.drift * 0.58;
      G.x += steer * dx * (G.off ? 0.64 : 1) * driftSteer;
      const cf = centrif() * (G.drift > 0.35 ? 0.34 : 1);
      G.x -= dx * spd01 * seg.curve * cf;
      G.slide = lerp(G.slide, G.drift * (Math.abs(steer) > 0.1 ? (steer >= 0 ? 1 : -1) : (G.steerVis >= 0 ? 1 : -1)), 1 - Math.pow(0.02, dt));
    }
    if (G.crashT > 0) G.x += (0 - G.x) * 1.8 * dt;
    G.x = clamp(G.x, -2.15, 2.15);
    G.steerVis = lerp(G.steerVis, demo ? -seg.curve * 0.08 + G.slide * 0.3 : steer + G.slide * 0.38, 1 - Math.pow(0.0007, dt));
    G.curveMem = lerp(G.curveMem, seg.curve * spd01, 1 - Math.pow(0.04, dt));

    const max = maxSpd();
    if (!demo) {
      if (G.crashT > 0) {
        G.spd += accel() * 0.18 * dt;
      } else if (wantBrake()) {
        G.spd += brake() * dt;
      } else if (wantGas()) {
        G.spd += accel() * (G.drift > 0.4 ? 0.82 : 1) * dt;
      } else {
        G.spd += coastDecel() * dt;
      }
    }

    G.off = !onRoadX(G.x, seg.split);
    if (G.off && G.spd > max * 0.4) G.spd += offDecel() * dt;
    if (G.off && playing && Math.random() < 0.38) {
      const dust = themeOf() === 'des' ? SAND : themeOf() === 'alp' ? ICE : [160, 130, 80];
      emit(1, {
        x: CX + G.steerVis * 20, y: VH - 36, j: 10,
        vx0: -40, vx1: 40, vy0: -10, vy1: 30,
        r0: 1, r1: 2.2, life: 0.22, rgb: dust
      });
    }
    G.spd = clamp(G.spd, 0, max);
    G.z += G.spd * dt;
    if (G.z < 0) G.z = 0;

    G.kmh = spd01 * kmhMax();

    const gear = spd01 < 0.22 ? 1 : spd01 < 0.48 ? 2 : spd01 < 0.74 ? 3 : 4;
    if (gear > G.gear && playing) audio.gear();
    G.gear = gear;

    if (playing && G.drift > 0.45 && G.crashT <= 0 && Math.abs(seg.curve) > 2.1) {
      G.driftHold += dt;
      G.driftTick += dt;
      if (G.driftTick >= 0.28) {
        G.driftTick = 0;
        onDriftCombo();
      }
      if (!REDUCE && Math.random() < 0.72) {
        const side = G.slide >= 0 ? 1 : -1;
        emit(2, {
          x: CX + side * 40 + G.steerVis * 8, y: VH - 28, j: 6,
          vx0: -90 * side, vx1: 36 * side, vy0: -22, vy1: 52,
          r0: 1.1, r1: 2.9, life: 0.24, rgb: Math.random() > 0.42 ? GOLD : YEL
        });
      }
    } else {
      G.driftHold = 0;
    }

    whooshCd = Math.max(0, whooshCd - dt);
    if (playing && spd01 > 0.8 && !G.off && G.crashT <= 0 && G.drift < 0.3) {
      if (!G.whooshOn) {
        G.whooshOn = true;
        audio.whoosh();
        screenFlash(CYN, 0.12);
      } else if (whooshCd <= 0) {
        whooshCd = 1.35;
        audio.whoosh();
      }
      G.flow += dt;
      if (G.flow >= 0.7) {
        G.flow = 0;
        G.flowN += 1;
        bumpScore(28 + G.flowN * 7);
        if (G.flowN === 4) toast('疾风', false, true);
        if (G.flowN === 8) toast('爆走', false, true);
        if (G.flowN === 12) toast('极速', false, true);
      }
    } else {
      G.flow = 0;
      if (G.crashT > 0 || G.off) {
        G.flowN = 0;
        G.whooshOn = false;
      }
      if (spd01 < 0.72) G.whooshOn = false;
    }

    if (spd01 > 0.52 && !REDUCE) {
      if (smears.length < 20 && Math.random() < 0.5) {
        smears.push({
          x: rand(0, VW),
          y: rand(HORIZON + 10, VH),
          len: rand(18, 70) * spd01,
          a: rand(0.08, 0.22) * spd01,
          v: 800 + spd01 * 1400
        });
      }
    }
    for (let i = smears.length - 1; i >= 0; i--) {
      smears[i].y += smears[i].v * dt * 0.25;
      smears[i].a -= dt * 0.7;
      if (smears[i].a <= 0 || smears[i].y > VH + 10) smears.splice(i, 1);
    }

    spawnWeather(dt, spd01);
    updateCars(dt);

    if (playing) {
      G.time -= dt;
      if (G.time < 10 && G.time + dt >= Math.ceil(G.time) && G.time > 0) audio.warn();
      if (G.time <= 0) {
        G.time = 0;
        if (!G.ending) {
          G.ending = 'time';
          G.endT = 0.85;
          toast('时间到', true, false);
        }
      }
      if (!G.gated && G.z + PLAYER_Z >= G.gateZ) {
        G.gated = true;
        passGate();
      }
    }

    if (G.ending === 'time') {
      G.endT -= dt;
      G.spd *= Math.pow(0.08, dt);
      if (G.endT <= 0) finish('time');
    }

    if (playing) G.score += G.spd * dt * 0.012;

    if (G.clock > 0.12) {
      G.clock = 0;
      if (playing) maybeBest();
      hud();
    }
  }

  function drawSky(pal) {
    const g = ctx.createLinearGradient(0, 0, 0, HORIZON + 18);
    g.addColorStop(0, rgba(pal.skyTop, 1));
    g.addColorStop(0.52, rgba(pal.skyMid, 1));
    g.addColorStop(1, rgba(pal.skyHor, 1));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, HORIZON + 22);

    const night = isNight();
    if (night) {
      for (let i = 0; i < 36; i++) {
        const hx = hash2(i * 19 + 3);
        const hy = hash2(i * 23 + 7);
        ctx.fillStyle = rgba(WHT, 0.25 + hash2(i) * 0.5);
        ctx.fillRect((hx * VW + G.curveMem * 2) % VW, hy * (HORIZON - 8), 1.4, 1.4);
      }
    }

    const sunX = CX + 180 - G.x * 14 - G.curveMem * 8;
    const sunY = HORIZON * (night ? 0.42 : themeOf() === 'alp' ? 0.38 : 0.55);
    const sunR = night ? 14 : themeOf() === 'des' ? 28 : 22;
    const sg = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, 70);
    sg.addColorStop(0, rgba(night ? WHT : pal.sun, 0.95));
    sg.addColorStop(0.25, rgba(pal.sun, 0.55));
    sg.addColorStop(1, rgba(pal.sun, 0));
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 70, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(night ? [230, 230, 255] : pal.sun, 1);
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, TAU);
    ctx.fill();

    const theme = themeOf();
    if (theme === 'sea') {
      ctx.fillStyle = rgba(mix(pal.lg, pal.skyHor, 0.35), 1);
      ctx.fillRect(0, HORIZON, VW * 0.46, 16);
    } else if (theme === 'lak') {
      ctx.fillStyle = rgba(mix(pal.lg, pal.skyHor, 0.4), 0.85);
      ctx.fillRect(0, HORIZON, VW, 14);
    }
  }

  function drawMountains(pal) {
    const drift = -G.x * 36 + G.curveMem * 10;
    const theme = themeOf();
    function layer(rgb, base, amp, par, seed, jagged) {
      ctx.fillStyle = rgba(rgb, 1);
      ctx.beginPath();
      ctx.moveTo(-20, HORIZON + 8);
      const steps = jagged ? 22 : 16;
      for (let i = 0; i <= steps; i++) {
        const px = (i / steps) * (VW + 40) - 20 + drift * par;
        const h = hash2(seed + i) * amp + hash2(seed + i * 3) * amp * (jagged ? 0.7 : 0.4);
        ctx.lineTo(px, HORIZON - base - h);
      }
      ctx.lineTo(VW + 20, HORIZON + 8);
      ctx.closePath();
      ctx.fill();
    }
    if (theme === 'alp') {
      layer(pal.mtn1, 36, 62, 0.32, def().seed, true);
      layer(pal.mtn2, 14, 36, 0.58, def().seed + 9, true);
      ctx.fillStyle = rgba(pal.cap, 0.7);
      ctx.beginPath();
      ctx.moveTo(-20, HORIZON + 4);
      for (let i = 0; i <= 18; i++) {
        const px = (i / 18) * (VW + 40) - 20 + drift * 0.32;
        const peak = hash2(def().seed + i) * 62;
        ctx.lineTo(px, HORIZON - 36 - peak * 0.55);
      }
      ctx.lineTo(VW + 20, HORIZON + 4);
      ctx.closePath();
      ctx.fill();
    } else if (theme === 'des') {
      layer(pal.mtn1, 10, 28, 0.4, def().seed, false);
      layer(pal.mtn2, 4, 16, 0.7, def().seed + 9, false);
    } else if (theme === 'cas') {
      layer(pal.mtn1, 24, 40, 0.34, def().seed, true);
      layer(pal.mtn2, 8, 22, 0.58, def().seed + 9, false);
    } else if (theme === 'cit') {
      layer(pal.mtn1, 18, 48, 0.22, def().seed, true);
      layer(pal.mtn2, 6, 22, 0.5, def().seed + 9, true);
    } else if (theme === 'lak') {
      layer(pal.mtn1, 16, 22, 0.3, def().seed, false);
      layer(pal.mtn2, 6, 12, 0.55, def().seed + 9, false);
    } else {
      layer(pal.mtn1, 28, 42, 0.35, def().seed, false);
      layer(pal.mtn2, 12, 28, 0.62, def().seed + 9, false);
    }
  }

  function drawOneRoad(p1, p2, off1, off2, wk, pal, alt, fog) {
    const x1 = p1.x + off1 * p1.s * CX;
    const x2 = p2.x + off2 * p2.s * CX;
    const w1 = p1.w * wk;
    const w2 = p2.w * wk;
    const r1 = w1 * 1.2;
    const r2 = w2 * 1.2;
    const rd = mix(alt ? pal.road : pal.road2, pal.fog, fog);
    const rb = mix(alt ? pal.rumble : pal.rumble2, pal.fog, fog);
    const ln = mix(pal.lane, pal.fog, fog);
    quad(x1 - r1, p1.y, x1 - w1, p1.y, x2 - w2, p2.y, x2 - r2, p2.y, rb);
    quad(x1 + w1, p1.y, x1 + r1, p1.y, x2 + r2, p2.y, x2 + w2, p2.y, rb);
    quad(x1 - w1, p1.y, x1 + w1, p1.y, x2 + w2, p2.y, x2 - w2, p2.y, rd);
    if (!alt) {
      const lw1 = Math.max(1, w1 * 0.02);
      const lw2 = Math.max(0.8, w2 * 0.02);
      quad(x1 - lw1, p1.y, x1 + lw1, p1.y, x2 + lw2, p2.y, x2 - lw2, p2.y, ln);
      const o = 0.35;
      quad(x1 - w1 * o - lw1, p1.y, x1 - w1 * o + lw1, p1.y, x2 - w2 * o + lw2, p2.y, x2 - w2 * o - lw2, p2.y, ln);
      quad(x1 + w1 * o - lw1, p1.y, x1 + w1 * o + lw1, p1.y, x2 + w2 * o + lw2, p2.y, x2 + w2 * o - lw2, p2.y, ln);
    }
  }

  function drawSeg(seg, pal, fogT) {
    const p1 = seg.p1;
    const p2 = seg.p2;
    const alt = (Math.floor(seg.i / RUMBLE) & 1) === 0;
    const fog = fogT * fogT * 0.88;
    const lg = mix(alt ? pal.lg : pal.lg2, pal.fog, fog);
    const rg = mix(alt ? pal.rg : pal.rg2, pal.fog, fog);
    const sp1 = seg.i > 0 ? segs[seg.i - 1].split : 0;
    const sp2 = seg.split;

    quad(0, p1.y, p1.x, p1.y, p2.x, p2.y, 0, p2.y, lg);
    quad(p1.x, p1.y, VW, p1.y, VW, p2.y, p2.x, p2.y, rg);

    if (sp2 < 0.08 && sp1 < 0.08) {
      drawOneRoad(p1, p2, 0, 0, 1, pal, alt, fog);
    } else {
      const o1 = sp1 * 2280;
      const o2 = sp2 * 2280;
      drawOneRoad(p1, p2, -o1, -o2, 0.76, pal, alt, fog);
      drawOneRoad(p1, p2, o1, o2, 0.76, pal, alt, fog);
    }
  }

  function clipSprite(y, h, clip) {
    if (y >= clip) return 0;
    if (y + h > clip) return clip - y;
    return h;
  }

  function drawScenery(spr, p, clip, pal) {
    const destH = spr.h * p.s * CX * 0.00115;
    const destW = spr.w * p.s * CX * 0.00115;
    const x = p.x + spr.o * p.w;
    const y0 = p.y;
    const w = destW;
    const vis = clipSprite(y0 - destH, destH, clip);
    if (vis <= 1 || w < 1) return;
    const y = y0 - destH;
    const h = destH;
    const night = isNight();
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VW, clip);
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
    } else if (spr.k === 'pine') {
      ctx.fillStyle = rgba([70, 42, 28], 1);
      ctx.fillRect(x - w * 0.08, y + h * 0.7, w * 0.16, h * 0.3);
      ctx.fillStyle = rgba(night ? [20, 50, 48] : [24, 92, 62], 1);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - w * 0.5, y + h * 0.42);
      ctx.lineTo(x - w * 0.18, y + h * 0.4);
      ctx.lineTo(x - w * 0.46, y + h * 0.72);
      ctx.lineTo(x + w * 0.46, y + h * 0.72);
      ctx.lineTo(x + w * 0.18, y + h * 0.4);
      ctx.lineTo(x + w * 0.5, y + h * 0.42);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(ICE, 0.35);
      ctx.fillRect(x - w * 0.12, y + h * 0.08, w * 0.24, h * 0.1);
    } else if (spr.k === 'snowrock') {
      ctx.fillStyle = rgba(mix([160, 176, 190], pal.fog, 0.2), 1);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, y + h);
      ctx.lineTo(x - w * 0.18, y + h * 0.22);
      ctx.lineTo(x + w * 0.12, y);
      ctx.lineTo(x + w * 0.5, y + h);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.12, y + h * 0.18);
      ctx.lineTo(x + w * 0.12, y);
      ctx.lineTo(x + w * 0.22, y + h * 0.2);
      ctx.fill();
    } else if (spr.k === 'rock') {
      ctx.fillStyle = rgba(mix([90, 70, 62], pal.fog, 0.2), 1);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, y + h);
      ctx.lineTo(x - w * 0.2, y + h * 0.2);
      ctx.lineTo(x + w * 0.15, y);
      ctx.lineTo(x + w * 0.5, y + h);
      ctx.fill();
    } else if (spr.k === 'cactus') {
      ctx.fillStyle = rgba([48, 128, 62], 1);
      ctx.fillRect(x - w * 0.12, y, w * 0.24, h);
      ctx.fillRect(x - w * 0.42, y + h * 0.3, w * 0.3, w * 0.16);
      ctx.fillRect(x + w * 0.12, y + h * 0.22, w * 0.28, w * 0.16);
    } else if (spr.k === 'dune') {
      ctx.fillStyle = rgba(mix(SAND, pal.fog, 0.15), 1);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, y + h);
      ctx.quadraticCurveTo(x - w * 0.1, y, x + w * 0.15, y + h * 0.35);
      ctx.quadraticCurveTo(x + w * 0.35, y + h * 0.15, x + w * 0.5, y + h);
      ctx.fill();
    } else if (spr.k === 'ruin') {
      ctx.fillStyle = rgba(mix([150, 110, 70], pal.fog, 0.18), 1);
      ctx.fillRect(x - w * 0.4, y + h * 0.22, w * 0.8, h * 0.78);
      ctx.fillStyle = rgba([120, 80, 48], 1);
      ctx.fillRect(x - w * 0.18, y, w * 0.36, h * 0.3);
      ctx.fillStyle = rgba(night ? GOLD : SAND, 0.35);
      ctx.fillRect(x - w * 0.28, y + h * 0.4, w * 0.16, h * 0.14);
    } else if (spr.k === 'wall') {
      ctx.fillStyle = rgba(night ? [48, 40, 50] : [118, 96, 78], 1);
      ctx.fillRect(x - w * 0.5, y + h * 0.18, w, h * 0.82);
      ctx.fillStyle = rgba(night ? [70, 52, 48] : [150, 110, 82], 1);
      ctx.fillRect(x - w * 0.5, y + h * 0.12, w, h * 0.1);
      ctx.fillStyle = rgba([40, 28, 28], 0.35);
      for (let r = 0; r < 3; r++) {
        ctx.fillRect(x - w * 0.42 + (r % 2) * w * 0.16, y + h * 0.3 + r * h * 0.18, w * 0.22, h * 0.08);
      }
    } else if (spr.k === 'tower') {
      ctx.fillStyle = rgba(night ? [52, 40, 50] : [132, 96, 74], 1);
      ctx.fillRect(x - w * 0.28, y + h * 0.18, w * 0.56, h * 0.82);
      ctx.fillStyle = rgba(SUN, 0.85);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - w * 0.38, y + h * 0.22);
      ctx.lineTo(x + w * 0.38, y + h * 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.55);
      ctx.fillRect(x - w * 0.1, y + h * 0.4, w * 0.2, h * 0.16);
    } else if (spr.k === 'banner') {
      ctx.fillStyle = rgba([70, 50, 40], 1);
      ctx.fillRect(x - w * 0.08, y, w * 0.12, h);
      ctx.fillStyle = rgba(MAG, 1);
      ctx.beginPath();
      ctx.moveTo(x + w * 0.04, y + h * 0.08);
      ctx.lineTo(x + w * 0.95, y + h * 0.18);
      ctx.lineTo(x + w * 0.04, y + h * 0.3);
      ctx.fill();
    } else if (spr.k === 'build') {
      ctx.fillStyle = rgba(night ? [16, 12, 32] : [42, 34, 54], 1);
      ctx.fillRect(x - w * 0.5, y, w, h);
      const rows = 5;
      const cols = 3;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const on = hash2(spr.h + r * 9 + c * 3 + (p.x | 0)) > 0.32;
          ctx.fillStyle = rgba(on ? (c & 1 ? GOLD : CYN) : [20, 16, 28], on ? 0.85 : 0.4);
          ctx.fillRect(
            x - w * 0.38 + c * w * 0.28,
            y + h * 0.1 + r * h * 0.16,
            w * 0.14,
            h * 0.1
          );
        }
      }
    } else if (spr.k === 'reed') {
      ctx.strokeStyle = rgba(night ? [40, 90, 70] : [70, 130, 80], 1);
      ctx.lineWidth = Math.max(1.2, w * 0.08);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.2, y + h);
      ctx.quadraticCurveTo(x - w * 0.3, y + h * 0.4, x - w * 0.05, y);
      ctx.moveTo(x + w * 0.1, y + h);
      ctx.quadraticCurveTo(x + w * 0.25, y + h * 0.45, x + w * 0.18, y + h * 0.08);
      ctx.stroke();
    } else if (spr.k === 'birch') {
      ctx.fillStyle = rgba([230, 230, 220], 1);
      ctx.fillRect(x - w * 0.1, y + h * 0.18, w * 0.2, h * 0.82);
      ctx.fillStyle = rgba(night ? [30, 70, 50] : [50, 120, 70], 1);
      ctx.beginPath();
      ctx.ellipse(x, y + h * 0.22, w * 0.48, h * 0.28, 0, 0, TAU);
      ctx.fill();
    } else if (spr.k === 'lamp') {
      ctx.fillStyle = rgba([40, 40, 48], 1);
      ctx.fillRect(x - w * 0.08, y + h * 0.15, w * 0.16, h * 0.85);
      ctx.fillStyle = rgba(CYN, 0.85);
      ctx.beginPath();
      ctx.arc(x, y + h * 0.12, Math.max(2, w * 0.28), 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.12);
      ctx.beginPath();
      ctx.arc(x, y + h * 0.12, w * 1.1, 0, TAU);
      ctx.fill();
    } else if (spr.k === 'post' || spr.k === 'pole') {
      ctx.fillStyle = rgba(spr.k === 'pole' ? [200, 210, 220] : [70, 50, 40], 1);
      ctx.fillRect(x - w * 0.1, y, w * 0.2, h);
    } else if (spr.k === 'pillar') {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fillRect(x - w * 0.28, y, w * 0.56, h);
      ctx.fillStyle = rgba(SUN, 0.7);
      ctx.fillRect(x - w * 0.18, y + h * 0.08, w * 0.36, h * 0.84);
    } else if (spr.k === 'check' || spr.k === 'goal') {
      ctx.fillStyle = rgba(spr.k === 'goal' ? GOLD : CYN, 0.55);
      ctx.fillRect(x - w * 0.5, y + h * 0.15, w, h * 0.28);
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.font = 'bold ' + Math.max(10, h * 0.22) + 'px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(spr.k === 'goal' ? 'GOAL' : 'CHECK', x, y + h * 0.3);
    } else if (spr.k === 'bill') {
      ctx.fillStyle = rgba([20, 10, 24], 0.9);
      ctx.fillRect(x - w * 0.5, y, w, h * 0.7);
      ctx.strokeStyle = rgba(SUN, 0.8);
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
    const destW = 580 * p.s * CX * 0.00115;
    const destH = destW * 0.58;
    const x = p.x + c.offset * p.w;
    const y0 = p.y;
    if (clipSprite(y0 - destH, destH, clip) <= 2 || destW < 2) return;
    const y = y0 - destH;
    const wob = Math.sin(c.wob) * destW * 0.02;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VW, clip);
    ctx.clip();
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(x + wob, y0 - destH * 0.08, destW * 0.44, destH * 0.12, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(c.col, 1);
    ctx.beginPath();
    ctx.moveTo(x - destW * 0.42 + wob, y + destH);
    ctx.lineTo(x - destW * 0.36 + wob, y + destH * 0.4);
    ctx.lineTo(x - destW * 0.16 + wob, y + destH * 0.26);
    ctx.lineTo(x + destW * 0.16 + wob, y + destH * 0.26);
    ctx.lineTo(x + destW * 0.36 + wob, y + destH * 0.4);
    ctx.lineTo(x + destW * 0.42 + wob, y + destH);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(ICE, 0.4);
    ctx.fillRect(x - destW * 0.18 + wob, y + destH * 0.32, destW * 0.36, destH * 0.14);
    ctx.fillStyle = rgba(SUN, 0.85);
    ctx.fillRect(x - destW * 0.32 + wob, y + destH * 0.7, destW * 0.12, destH * 0.1);
    ctx.fillRect(x + destW * 0.2 + wob, y + destH * 0.7, destW * 0.12, destH * 0.1);
    ctx.fillStyle = '#141018';
    ctx.fillRect(x - destW * 0.38 + wob, y + destH * 0.82, destW * 0.14, destH * 0.14);
    ctx.fillRect(x + destW * 0.24 + wob, y + destH * 0.82, destW * 0.14, destH * 0.14);
    ctx.restore();
  }

  function drawPlayer() {
    const steer = G.steerVis;
    const hop = G.crashT > 0 ? Math.abs(Math.sin(G.crashT * 16.5)) * 13 * Math.min(1, G.crashT) : 0;
    const squat = (G.spd / maxSpd()) * 4 + G.drift * 3;
    const x = CX + steer * 46 + G.slide * 10;
    const y = VH - 30 - hop + squat;
    const lean = steer * 0.2 + G.drift * G.slide * 0.16 + (G.crashT > 0 ? Math.sin(G.crashT * 19) * 0.24 * G.crashT : 0);
    const spd01 = clamp(G.spd / maxSpd(), 0, 1);

    if (spd01 > 0.48 && !REDUCE) {
      for (let i = 3; i >= 1; i--) {
        const k = i / 3;
        ctx.globalAlpha = 0.12 * spd01 * k;
        ctx.fillStyle = rgba(YEL, 1);
        ctx.beginPath();
        const gx = x - steer * 18 * i;
        const gy = y + 6 * i;
        ctx.ellipse(gx, gy, 50 + i * 8, 10, lean, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    if (G.drift > 0.35 && !REDUCE) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const side = G.slide >= 0 ? 1 : -1;
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = rgba(i & 1 ? GOLD : YEL, 0.18 + G.drift * 0.2);
        ctx.beginPath();
        ctx.arc(x + side * (38 + i * 5), y + 10 + i * 2, 3 + i, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean);
    ctx.scale(1 + hop * 0.01, 1 - hop * 0.008 - G.drift * 0.04);

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 58, 10, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#121016';
    ctx.fillRect(-54, 7, 20, 12);
    ctx.fillRect(34, 7, 20, 12);
    ctx.fillStyle = '#2a2432';
    ctx.beginPath();
    ctx.ellipse(-42, 12, 13, 8, 0, 0, TAU);
    ctx.ellipse(42, 12, 13, 8, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(CHR, 0.7);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(-42, 12, 13, 8, 0, 0, TAU);
    ctx.ellipse(42, 12, 13, 8, 0, 0, TAU);
    ctx.stroke();

    ctx.fillStyle = rgba(YEL, 1);
    ctx.beginPath();
    ctx.moveTo(-58, 10);
    ctx.lineTo(-46, -6);
    ctx.lineTo(-20, -18);
    ctx.lineTo(20, -18);
    ctx.lineTo(46, -6);
    ctx.lineTo(58, 10);
    ctx.lineTo(44, 16);
    ctx.lineTo(-44, 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(SUN, 0.55);
    ctx.fillRect(-40, 4, 80, 3);

    ctx.fillStyle = '#1a1016';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(-48 + i * 8, 2, 5, 8);
      ctx.fillRect(24 + i * 6, 2, 5, 8);
    }

    ctx.fillStyle = rgba([28, 16, 18], 0.95);
    ctx.beginPath();
    ctx.moveTo(-30, 2);
    ctx.lineTo(-18, -14);
    ctx.lineTo(18, -14);
    ctx.lineTo(30, 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(CYN, 0.48);
    ctx.beginPath();
    ctx.moveTo(-20, -12);
    ctx.lineTo(-12, -26);
    ctx.lineTo(12, -26);
    ctx.lineTo(20, -12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba([36, 20, 24], 1);
    ctx.fillRect(-18, -14, 11, 12);
    ctx.fillRect(7, -14, 11, 12);
    ctx.fillStyle = rgba(PNK, 0.95);
    ctx.beginPath();
    ctx.arc(-11, -18, 4.6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.arc(13, -18, 4.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(YEL, 0.85);
    ctx.beginPath();
    ctx.arc(13, -20, 2.2, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(MAG, 1);
    ctx.fillRect(-38, 8, 15, 5);
    ctx.fillRect(23, 8, 15, 5);
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.fillRect(-34, 9, 6, 3);
    ctx.fillRect(28, 9, 6, 3);

    ctx.fillStyle = rgba(GOLD, 0.8);
    ctx.fillRect(-9, 12, 18, 3);
    ctx.fillStyle = rgba(WHT, 0.4);
    ctx.fillRect(-22, -16, 44, 2);
    ctx.fillStyle = rgba(CHR, 0.55);
    ctx.fillRect(-8, -6, 16, 2);

    ctx.restore();
  }

  function drawForkLabels() {
    const st = def();
    if (st.goal) return;
    const seg = findSeg(G.z + PLAYER_Z);
    if (seg.split < 0.18 && seg.fork !== 1) return;
    const L = GRAPH[st.left];
    const R = GRAPH[st.right];
    ctx.save();
    ctx.font = 'bold 18px "Segoe UI","PingFang SC",sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rgba(GOLD, 0.92);
    ctx.strokeStyle = 'rgba(18,8,12,0.65)';
    ctx.lineWidth = 4;
    ctx.textAlign = 'left';
    ctx.strokeText('◀ ' + (L ? L.name : '左'), 28, HORIZON + 36);
    ctx.fillText('◀ ' + (L ? L.name : '左'), 28, HORIZON + 36);
    ctx.textAlign = 'right';
    ctx.strokeText((R ? R.name : '右') + ' ▶', VW - 28, HORIZON + 36);
    ctx.fillText((R ? R.name : '右') + ' ▶', VW - 28, HORIZON + 36);
    ctx.restore();
  }

  function drawRouteTree() {
    ctx.save();
    const ox0 = 22;
    const oy0 = 22;
    ctx.font = '9px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillStyle = rgba(WHT, 0.45);
    ctx.textAlign = 'left';
    ctx.fillText('五段', ox0 - 2, oy0 - 8);
    for (let row = 0; row < 5; row++) {
      const n = row + 1;
      for (let i = 0; i < n; i++) {
        const px = ox0 + i * 12 + (5 - n) * 6;
        const py = oy0 + row * 11;
        let on = false;
        if (row < G.path.length) {
          let cur = 0;
          for (let d = 1; d <= row; d++) cur += G.path[d] | 0;
          on = i === cur;
        }
        ctx.fillStyle = on ? rgba(row === G.depth - 1 ? GOLD : SUN, 0.95) : rgba(WHT, 0.18);
        ctx.beginPath();
        ctx.arc(px, py, on ? 3.1 : 2.2, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawRoad() {
    const pal = palette();
    const pz = G.z;
    const playerSeg = findSeg(pz + PLAYER_Z);
    const pPct = ((pz + PLAYER_Z) / SEG) - playerSeg.i;
    const playerY = lerp(playerSeg.y1, playerSeg.y2, clamp(pPct, 0, 1));
    const base = findSeg(pz);
    const bPct = (pz / SEG) - base.i;
    const camX = G.x * ROAD_W;
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
      drawSeg(seg, pal, fogT);
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
  }

  function drawSmear() {
    const spd01 = clamp(G.spd / maxSpd(), 0, 1);
    if (spd01 < 0.48 || REDUCE) return;
    const vpX = CX - G.x * 28;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(CYN, 0.05 + spd01 * 0.08);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * VW;
      ctx.beginPath();
      ctx.moveTo(vpX, HORIZON + 8);
      ctx.lineTo(a, VH);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(YEL, 0.05 + spd01 * 0.07);
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(vpX + 8, HORIZON + 10);
      ctx.lineTo((i / 6) * VW, VH);
      ctx.stroke();
    }
    ctx.restore();
    for (let i = 0; i < smears.length; i++) {
      const s = smears[i];
      ctx.strokeStyle = rgba(WHT, s.a);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x, s.y + s.len);
      ctx.stroke();
    }
  }

  function drawFlakes() {
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      ctx.fillStyle = rgba(f.rgb, clamp(f.life * 0.7, 0, 0.85));
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawHudCanvas() {
    const spd01 = clamp(G.spd / maxSpd(), 0, 1);
    drawRouteTree();
    ctx.save();
    ctx.translate(VW - 86, VH - 70);
    ctx.strokeStyle = rgba(SUN, 0.35);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 34, Math.PI * 0.75, Math.PI * 2.25);
    ctx.stroke();
    ctx.strokeStyle = rgba(spd01 > 0.85 ? MAG : GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(0, 0, 34, Math.PI * 0.75, Math.PI * 0.75 + spd01 * Math.PI * 1.5);
    ctx.stroke();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.font = 'bold 13px "Segoe UI",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(G.kmh | 0), 0, 4);
    ctx.font = '9px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillStyle = rgba(SUN, 0.8);
    ctx.fillText('km/h', 0, 16);
    ctx.restore();

    if (G.mode === 'play' && G.time < 10) {
      ctx.fillStyle = rgba(MAG, 0.12 + Math.sin(G.t * 10) * 0.06);
      ctx.fillRect(0, 0, VW, 8);
      ctx.fillRect(0, VH - 8, VW, 8);
    }

    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.globalAlpha = clamp(f.t * 1.4, 0, 1);
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = 'bold 20px "Segoe UI","PingFang SC",sans-serif';
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
  }

  function draw() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const pw = stageEl ? stageEl.clientWidth : 800;
    const ph = stageEl ? stageEl.clientHeight : 450;
    if (pw !== W || ph !== H || canvas.width !== (pw * dpr | 0)) resize();

    const pal = palette();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, rgba(pal.skyTop, 1));
    sky.addColorStop(1, rgba(pal.skyHor, 1));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    const shx = G.shake > 0 && !REDUCE ? (Math.random() - 0.5) * G.shake : 0;
    const shy = G.shake > 0 && !REDUCE ? (Math.random() - 0.5) * G.shake * 0.6 : 0;
    ctx.save();
    ctx.translate(ox + shx, oy + shy);
    ctx.scale(scale * G.punch, scale * G.punch);
    if (G.punch !== 1) {
      ctx.translate(CX * (1 / G.punch - 1) * 0.5, VH * (1 / G.punch - 1) * 0.5);
    }

    ctx.beginPath();
    ctx.rect(0, 0, VW, VH);
    ctx.clip();

    ctx.fillStyle = rgba(pal.skyHor, 1);
    ctx.fillRect(0, 0, VW, VH);

    if (segs.length) {
      drawSky(pal);
      drawMountains(pal);
      drawRoad();
      drawSmear();
      drawFlakes();
      drawPlayer();
      drawForkLabels();
      drawHudCanvas();
    }
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
    if (G.mode === 'title') startGame('coast');
    else startGame(G.kind || 'coast');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('coast');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const isSpace = k === ' ' || k === 'Spacebar' || e.code === 'Space';
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      if (down) inputSrc = 'key';
    }
    if (isSpace) {
      if (overlayOpen()) {
        if (down) {
          e.preventDefault();
          primaryAction();
        }
      } else {
        keys.drift = down;
        if (down) inputSrc = 'key';
        e.preventDefault();
      }
    }
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || isSpace || k === 'Enter')) {
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
      startGame('coast');
      return;
    }
    if (k === '2') {
      startGame('night');
      return;
    }
    if (k === 'Enter') {
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

  function holdKey(el, key) {
    if (!el) return;
    const down = function (e) {
      e.preventDefault();
      audio.ensure();
      keys[key] = true;
      inputSrc = 'key';
    };
    const up = function (e) {
      e.preventDefault();
      keys[key] = false;
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('pointercancel', up);
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
  holdKey(btnLeft, 'l');
  holdKey(btnRight, 'r');
  holdKey(btnGas, 'u');
  holdKey(btnBrake, 'd');
  holdKey(btnDrift, 'drift');

  if (btnCoast) {
    btnCoast.addEventListener('click', function () {
      audio.ensure();
      startGame('coast');
    });
  }
  if (btnNight) {
    btnNight.addEventListener('click', function () {
      audio.ensure();
      startGame('night');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'coast');
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

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.l = false;
      keys.r = false;
      keys.u = false;
      keys.d = false;
      keys.drift = false;
      pointer.down = false;
    }
  });

  requestAnimationFrame(frame);
})();
