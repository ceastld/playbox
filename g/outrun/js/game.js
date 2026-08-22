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
  const BEST_KEY = 'playbox-outrun-best';
  const MUTE_KEY = 'playbox-outrun-mute';
  const OPS = '← → / A D 转向 · ↑ W 油门 · 空格刹车 · 点按加速 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 45, 120];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const SUN = [255, 74, 26];
  const RED = [232, 32, 40];
  const WHT = [255, 244, 234];
  const PNK = [255, 168, 196];
  const ICE = [200, 230, 255];
  const SAND = [232, 186, 92];

  const GRAPH = {
    bluebay: { name: '蓝湾', theme: 'sea', seed: 14, left: 'snowpath', right: 'sandgate', depth: 1 },
    snowpath: { name: '雪径', theme: 'alp', seed: 28, left: 'icegorge', right: 'vinhill', depth: 2 },
    sandgate: { name: '沙口', theme: 'des', seed: 42, left: 'vinhill', right: 'redsand', depth: 2 },
    icegorge: { name: '冰峡', theme: 'alp', seed: 56, left: 'frostpass', right: 'pinevale', depth: 3 },
    vinhill: { name: '葡坡', theme: 'vin', seed: 70, left: 'pinevale', right: 'heatdune', depth: 3 },
    redsand: { name: '赤漠', theme: 'des', seed: 84, left: 'heatdune', right: 'duskbay', depth: 3 },
    frostpass: { name: '霜岭', theme: 'alp', seed: 98, left: 'snowpeak', right: 'mirror', depth: 4 },
    pinevale: { name: '湖谷', theme: 'lak', seed: 112, left: 'mirror', right: 'winery', depth: 4 },
    heatdune: { name: '热丘', theme: 'des', seed: 126, left: 'winery', right: 'sandspire', depth: 4 },
    duskbay: { name: '暮湾', theme: 'sea', seed: 140, left: 'sandspire', right: 'lighthouse', depth: 4 },
    snowpeak: { name: '雪巅', theme: 'alp', seed: 154, goal: true, depth: 5 },
    mirror: { name: '镜湖', theme: 'lak', seed: 168, goal: true, depth: 5 },
    winery: { name: '葡庄', theme: 'vin', seed: 182, goal: true, depth: 5 },
    sandspire: { name: '沙塔', theme: 'des', seed: 196, goal: true, depth: 5 },
    lighthouse: { name: '灯岬', theme: 'sea', seed: 210, goal: true, depth: 5 }
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

  const keys = { l: false, r: false, u: false, d: false };
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
    stage: 'bluebay',
    route: ['蓝湾'],
    path: [0],
    t: 0,
    clock: 0,
    z: 0,
    x: 0,
    spd: 0,
    steerVis: 0,
    score: 0,
    best: { h: 0, n: 0 },
    time: 50,
    timeCap: 50,
    combo: 0,
    comboT: 0,
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
    return isNight() ? 13800 : 10800;
  }
  function accel() {
    return maxSpd() / 3.12;
  }
  function brake() {
    return -maxSpd() / 1.28;
  }
  function coastDecel() {
    return -maxSpd() / 6.6;
  }
  function offDecel() {
    return -maxSpd() / 1.75;
  }
  function startTime() {
    return isNight() ? 36 : 50;
  }
  function gateTime() {
    return isNight() ? 11 : 15;
  }
  function crashCost() {
    return isNight() ? 3.4 : 2.6;
  }
  function def() {
    return GRAPH[G.stage] || GRAPH.bluebay;
  }
  function kindBest() {
    return isNight() ? G.best.n : G.best.h;
  }
  function themeOf() {
    return def().theme;
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
      p2: { x: 0, y: 0, w: 0, z: 0, s: 0 },
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
    if (theme === 'alp') return 1680;
    if (theme === 'des') return 420;
    if (theme === 'vin') return 920;
    if (theme === 'lak') return 360;
    return 780;
  }
  function curveAmp(theme, night) {
    const base = night ? 7.6 : 6.1;
    if (theme === 'alp') return base * 1.18;
    if (theme === 'des') return base * 0.78;
    if (theme === 'vin') return base * 1.04;
    if (theme === 'lak') return base * 0.7;
    return base;
  }

  function buildStage(id) {
    const st = GRAPH[id] || GRAPH.bluebay;
    G.stage = GRAPH[id] ? id : 'bluebay';
    segs.length = 0;
    cars.length = 0;
    flakes.length = 0;
    const night = isNight();
    const theme = st.theme;
    const target = night ? 700 : 820;
    const hills = hillAmp(theme);
    const curves = curveAmp(theme, night);

    addRoad(16, 32, 16, 0, 0);
    let k = 0;
    while (segs.length < target - 140) {
      const h = hash2(st.seed * 13 + k * 3);
      const h2 = hash2(st.seed * 17 + k * 5 + 2);
      const h3 = hash2(st.seed * 19 + k * 7 + 4);
      let curve = (h - 0.5) * 2 * curves;
      if (h > 0.84) curve = 0;
      const hill = lastY() + (h2 - 0.46) * hills;
      const enter = 14 + (h3 * 22) | 0;
      const hold = 18 + (hash2(k + 41 + st.seed) * 52) | 0;
      const leave = 12 + (hash2(k + 43 + st.seed) * 22) | 0;
      addRoad(enter, hold, leave, curve, hill);
      k += 1;
    }
    addRoad(20, 42, 16, 0, lastY() * 0.2);
    addRoad(10, 32, 8, 0, 0);

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
    const step = theme === 'vin' ? 3 : 4;
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
        if (r > 0.34) addSprite(i, dist + 0.1, r > 0.6 ? 'cactus' : 'rock', r > 0.6 ? 500 : 280, 190);
      } else if (theme === 'vin') {
        if (r > 0.12) addSprite(i, -dist, r > 0.7 ? 'cypress' : 'vine', r > 0.7 ? 920 : 420, r > 0.7 ? 160 : 280);
        if (r > 0.28) addSprite(i, dist + 0.12, r > 0.62 ? 'cypress' : 'vine', r > 0.62 ? 860 : 400, r > 0.62 ? 150 : 260);
      } else {
        if (r > 0.18) addSprite(i, -dist, r > 0.7 ? 'birch' : 'reed', r > 0.7 ? 880 : 360, r > 0.7 ? 180 : 160);
        if (r > 0.36) addSprite(i, dist + 0.1, 'reed', 340, 150);
      }
      if (night && (i % 12) === 0) addSprite(i, side * 1.1, 'lamp', 620, 64);
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
    const n = night ? 20 : 12;
    const max = maxSpd();
    for (let i = 0; i < n; i++) {
      const z = (70 + i * ((segs.length - 180) / n) + hash2(st.seed + i) * 36) * SEG;
      if (z > G.trackLen - 22000) continue;
      cars.push({
        z: z,
        offset: (hash2(st.seed * 3 + i) - 0.5) * 1.32,
        spd: max * (night ? 0.48 + hash2(i + 8) * 0.4 : 0.3 + hash2(i + 8) * 0.36),
        col: carColor(hash2(st.seed + i * 19)),
        passed: false,
        wob: hash2(i + 4) * TAU
      });
    }
  }

  function carColor(h) {
    if (h < 0.16) return [70, 90, 210];
    if (h < 0.32) return [40, 190, 120];
    if (h < 0.48) return [255, 200, 50];
    if (h < 0.64) return [250, 250, 255];
    if (h < 0.8) return [180, 70, 255];
    return [30, 30, 36];
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
    if (theme === 'vin') {
      return {
        skyTop: night ? [18, 6, 28] : [90, 40, 110],
        skyMid: night ? [48, 16, 50] : [180, 70, 90],
        skyHor: night ? [80, 30, 60] : [255, 150, 90],
        fog: night ? [50, 20, 40] : [210, 120, 90],
        lg: night ? [24, 48, 28] : [62, 110, 48],
        lg2: night ? [18, 38, 22] : [48, 92, 38],
        rg: night ? [48, 28, 44] : [128, 72, 88],
        rg2: night ? [36, 20, 34] : [108, 56, 72],
        road: [44, 36, 46], road2: [54, 44, 56],
        rumble: [180, 70, 160], rumble2: [240, 230, 210],
        lane: [230, 200, 255],
        sun: [255, 170, 90],
        mtn1: night ? [32, 18, 36] : [70, 42, 70],
        mtn2: night ? [20, 12, 24] : [48, 28, 48],
        cap: [160, 80, 140]
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
      skyTop: night ? [12, 6, 32] : [28, 8, 48],
      skyMid: night ? [50, 14, 60] : [200, 36, 70],
      skyHor: night ? [90, 28, 70] : [255, 120, 50],
      fog: night ? [42, 16, 48] : [255, 140, 80],
      lg: night ? [8, 52, 84] : [12, 108, 148],
      lg2: night ? [10, 64, 98] : [16, 126, 164],
      rg: night ? [96, 64, 36] : [204, 150, 58],
      rg2: night ? [74, 48, 26] : [174, 124, 44],
      road: [44, 38, 50], road2: [54, 46, 60],
      rumble: [255, 70, 36], rumble2: [248, 236, 220],
      lane: [255, 220, 140],
      sun: [255, 196, 70],
      mtn1: night ? [30, 12, 40] : [64, 24, 52],
      mtn2: night ? [18, 8, 28] : [42, 16, 34],
      cap: [255, 160, 90]
    };
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    eng: null,
    eng2: null,
    engG: null,
    engF: null,
    ensure() {
      if (!this.ctx) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.32;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.startEngine();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.32;
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
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 680;
      const g = this.ctx.createGain();
      g.gain.value = 0;
      o.connect(f);
      o2.connect(f);
      f.connect(g);
      g.connect(this.master);
      o.start();
      o2.start();
      this.eng = o;
      this.eng2 = o2;
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
      const f = 48 + spd01 * 132 + Math.sin(G.t * 24) * (2 + spd01 * 8);
      this.eng.frequency.setTargetAtTime(f, t, 0.045);
      this.eng2.frequency.setTargetAtTime(f * 0.5, t, 0.045);
      this.engF.frequency.setTargetAtTime(340 + spd01 * 1100, t, 0.08);
      this.engG.gain.setTargetAtTime(this.muted ? 0 : (0.028 + spd01 * 0.062), t, 0.06);
    },
    radio(freq) {
      this.beep(freq, 0.1, 'triangle', 0.042);
      this.beep(freq * 1.5, 0.08, 'sine', 0.018);
    },
    sting() {
      this.beep(392, 0.08, 'square', 0.07, 784);
      this.beep(523, 0.12, 'triangle', 0.05);
      this.beep(659, 0.16, 'square', 0.04);
    },
    check() {
      this.beep(523, 0.09, 'square', 0.085);
      this.beep(659, 0.12, 'triangle', 0.07);
      this.beep(784, 0.16, 'square', 0.06);
      this.beep(1046, 0.22, 'triangle', 0.05, 1318);
    },
    crash() {
      this.noise(0.26, 0.24, 240);
      this.beep(150, 0.22, 'sawtooth', 0.11, 46);
    },
    whoosh() {
      this.noise(0.28, 0.14, 900);
      this.beep(220, 0.18, 'sine', 0.03, 90);
    },
    overtake(n) {
      const f = 440 + Math.min(8, n) * 58;
      this.beep(f, 0.07, 'square', 0.06, f * 1.75);
      this.beep(f * 0.5, 0.1, 'triangle', 0.028);
    },
    gear() {
      this.beep(190, 0.05, 'square', 0.04, 460);
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

  const RIFF = [392, 523, 0, 587, 659, 0, 784, 659, 523, 0, 440, 392, 523, 659, 784, 0];

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
    if (particles.length > 220) particles.splice(0, particles.length - 220);
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
    ovKicker.textContent = kind === 'win' ? 'GOAL' : kind === 'lose' ? 'TIME UP' : 'RUN';
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
    if (comboEl) {
      const show = G.mode === 'play' && (G.combo > 1 || G.flowN > 2);
      comboEl.hidden = !show;
      if (show) comboEl.textContent = G.combo > 1 ? ('连超 ×' + G.combo) : ('疾风 ×' + G.flowN);
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'win') setHint('R 再开 · 路线 ' + G.route.join(' → '), 'hot');
    else if (G.mode === 'lose') setHint('R 重开 · 撞击扣时，超时才结束', 'warn');
    else if (G.time < 10) setHint('时间将尽 · 冲过检查门加时', 'warn');
    else if (findSeg(G.z + PLAYER_Z).fork === 1) setHint('分叉 · 靠左或靠右选下一段风景', 'hot');
    else setHint('← → 转向 · ↑ 油门 · 空格刹车 · R 重开', '');
  }

  function resetRun(kind, play) {
    G.kind = kind === 'night' ? 'night' : 'coast';
    G.stage = 'bluebay';
    G.route = ['蓝湾'];
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
    buildStage('bluebay');
  }

  function goTitle() {
    G.mode = 'title';
    G.score = 0;
    resetRun('coast', false);
    showOverlay('title', '疾风', '后视跑车，分叉选风景。赶检查点加时，五段冲线。');
    hud();
  }

  function startGame(kind) {
    audio.ensure();
    G.mode = 'play';
    resetRun(kind, true);
    G.flash = 0.35;
    G.flashRgb = SUN;
    G.stop = 0;
    G.shake = 0;
    hideOverlay();
    audio.sting();
    toast(isNight() ? '夜奔 · 车流更快更密' : '海岸 · 五段分叉选风景', false, true);
    hud();
  }

  function onOvertake(car) {
    G.combo += 1;
    G.comboT = 2.2;
    const n = 95 * G.combo;
    bumpScore(n);
    floatText(CX + car.offset * 80, VH * 0.62, '超车 ×' + G.combo, GOLD);
    audio.overtake(G.combo);
    if (G.combo >= 3) {
      hitStop(0.04);
      kick(3);
      screenFlash(CYN, 0.2);
    }
    if (G.combo === 3) toast('连超 ×3', false, true);
    if (G.combo === 6) toast('连超 ×6 · 疾风', false, true);
    if (G.combo === 10) toast('连超 ×10 · 无人能及', false, true);
    if (comboEl) {
      comboEl.classList.remove('hot');
      void comboEl.offsetWidth;
      comboEl.classList.add('hot');
      comboTok += 1;
    }
    emit(10, {
      x: CX + car.offset * 90, y: VH * 0.7, j: 16,
      vx0: -80, vx1: 80, vy0: -40, vy1: 80,
      r0: 1.5, r1: 3.5, life: 0.35, rgb: car.col
    });
  }

  function crashInto(car) {
    if (G.crashT > 0.15) return;
    G.crashT = 1.22;
    G.bounce = 1;
    G.spd *= 0.32;
    const dir = G.x >= car.offset ? 1 : -1;
    G.x += dir * 0.24;
    G.combo = 0;
    G.flowN = 0;
    G.flow = 0;
    G.whooshOn = false;
    const cost = crashCost();
    if (G.mode === 'play' && G.ending === '') {
      G.time = Math.max(0, G.time - cost);
    }
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
    floatText(CX, VH * 0.5, '-' + cost.toFixed(1) + '″', MAG);
    toast('撞击 · -' + cost.toFixed(1) + '″', true, false);
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
    const bonus = 760 + ((G.time * 6) | 0) + G.combo * 45;
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
      const bonus = 2800 + ((G.time * 80) | 0);
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
      showOverlay('lose', '时间到', '冲到 ' + def().name + '　·　' + (G.score | 0) + ' 分。撞击扣时，超时出局。');
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
        c.spd = maxSpd() * (isNight() ? 0.5 + Math.random() * 0.38 : 0.3 + Math.random() * 0.36);
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
    const want = clamp(-seg.curve * 0.12, -0.7, 0.7);
    if (seg.split > 0.2) G.x += ((G.x < 0 ? -0.7 : 0.7) - G.x) * 2.4 * dt;
    else G.x += (want - G.x) * 2.2 * dt;
    G.spd = lerp(G.spd, maxSpd() * 0.62, 1 - Math.pow(0.08, dt));
    if (G.z + PLAYER_Z > G.gateZ - 400) {
      G.z = 80;
      G.x = 0;
    }
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
      G.kmh = (G.spd / maxSpd()) * (isNight() ? 310 : 250);
      return;
    }

    if (demo) autoDemo(dt);

    const seg = findSeg(G.z + PLAYER_Z);
    const speedPct = clamp(G.spd / maxSpd(), 0, 1);
    const dx = dt * (isNight() ? 2.35 : 2.05) * Math.max(0.22, speedPct);

    let steer = 0;
    if (!demo) {
      if (keys.l) steer -= 1;
      if (keys.r) steer += 1;
      if (inputSrc === 'ptr' && pointer.down) {
        const tx = (pointer.x - CX) / (CX * 0.7);
        steer = clamp(tx * 1.35, -1, 1);
      }
      if (G.crashT > 0) steer *= 0.4;
    }

    G.x += steer * dx * (G.off ? 0.7 : 1);
    G.x -= dx * speedPct * seg.curve * 0.44;
    G.x = clamp(G.x, -2.15, 2.15);
    G.steerVis = lerp(G.steerVis, demo ? -seg.curve * 0.08 : steer, 1 - Math.pow(0.0007, dt));
    G.curveMem = lerp(G.curveMem, seg.curve * speedPct, 1 - Math.pow(0.04, dt));

    const gas = demo || keys.u || (pointer.down && inputSrc === 'ptr');
    const braking = !demo && keys.d;
    const max = maxSpd();
    if (G.crashT > 0) {
      G.spd += accel() * 0.2 * dt;
    } else if (braking) {
      G.spd += brake() * dt;
    } else if (gas) {
      G.spd += accel() * dt;
    } else {
      G.spd += coastDecel() * dt;
    }

    G.off = !onRoadX(G.x, seg.split);
    if (G.off && G.spd > max * 0.42) G.spd += offDecel() * dt;
    if (G.off && playing && Math.random() < 0.35) {
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

    const kmhMax = isNight() ? 310 : 250;
    G.kmh = speedPct * kmhMax;

    const gear = speedPct < 0.22 ? 1 : speedPct < 0.48 ? 2 : speedPct < 0.74 ? 3 : 4;
    if (gear > G.gear && playing) audio.gear();
    G.gear = gear;

    whooshCd = Math.max(0, whooshCd - dt);
    if (playing && speedPct > 0.8 && !G.off && G.crashT <= 0) {
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
        bumpScore(30 + G.flowN * 7);
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
      if (speedPct < 0.72) G.whooshOn = false;
    }

    if (spd01 > 0.55 && !REDUCE) {
      if (smears.length < 18 && Math.random() < 0.5) {
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
    } else if (theme === 'vin') {
      layer(pal.mtn1, 22, 34, 0.36, def().seed, false);
      layer(pal.mtn2, 8, 20, 0.6, def().seed + 9, false);
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
      ctx.fillStyle = rgba([70, 160, 80], 0.5);
      ctx.fillRect(x - w * 0.06, y + h * 0.08, w * 0.08, h * 0.5);
    } else if (spr.k === 'dune') {
      ctx.fillStyle = rgba(mix(SAND, pal.fog, 0.15), 1);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, y + h);
      ctx.quadraticCurveTo(x - w * 0.1, y, x + w * 0.15, y + h * 0.35);
      ctx.quadraticCurveTo(x + w * 0.35, y + h * 0.15, x + w * 0.5, y + h);
      ctx.fill();
    } else if (spr.k === 'vine') {
      ctx.fillStyle = rgba([70, 42, 28], 1);
      ctx.fillRect(x - w * 0.5, y + h * 0.55, w, h * 0.08);
      ctx.fillRect(x - w * 0.46, y + h * 0.2, w * 0.08, h * 0.8);
      ctx.fillRect(x + w * 0.38, y + h * 0.2, w * 0.08, h * 0.8);
      ctx.fillStyle = rgba(night ? [50, 80, 40] : [80, 130, 50], 1);
      ctx.fillRect(x - w * 0.48, y + h * 0.22, w * 0.96, h * 0.28);
    } else if (spr.k === 'cypress') {
      ctx.fillStyle = rgba([60, 40, 28], 1);
      ctx.fillRect(x - w * 0.1, y + h * 0.7, w * 0.2, h * 0.3);
      ctx.fillStyle = rgba(night ? [24, 50, 32] : [36, 88, 48], 1);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - w * 0.42, y + h * 0.78);
      ctx.lineTo(x + w * 0.42, y + h * 0.78);
      ctx.closePath();
      ctx.fill();
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
    const squat = (G.spd / maxSpd()) * 4;
    const x = CX + steer * 42;
    const y = VH - 30 - hop + squat;
    const lean = steer * 0.18 + (G.crashT > 0 ? Math.sin(G.crashT * 19) * 0.24 * G.crashT : 0);
    const spd01 = clamp(G.spd / maxSpd(), 0, 1);

    if (spd01 > 0.5 && !REDUCE) {
      for (let i = 3; i >= 1; i--) {
        const k = i / 3;
        ctx.globalAlpha = 0.1 * spd01 * k;
        ctx.fillStyle = rgba(RED, 1);
        ctx.beginPath();
        const gx = x - steer * 18 * i;
        const gy = y + 6 * i;
        ctx.ellipse(gx, gy, 48 + i * 8, 10, lean, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean);
    ctx.scale(1 + hop * 0.01, 1 - hop * 0.008);

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 56, 10, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#121016';
    ctx.fillRect(-50, 7, 18, 12);
    ctx.fillRect(32, 7, 18, 12);
    ctx.fillStyle = '#2a2432';
    ctx.beginPath();
    ctx.ellipse(-40, 12, 12, 8, 0, 0, TAU);
    ctx.ellipse(40, 12, 12, 8, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(RED, 1);
    ctx.beginPath();
    ctx.moveTo(-54, 10);
    ctx.lineTo(-44, -4);
    ctx.lineTo(-18, -16);
    ctx.lineTo(18, -16);
    ctx.lineTo(44, -4);
    ctx.lineTo(54, 10);
    ctx.lineTo(42, 16);
    ctx.lineTo(-42, 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1a1016';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(-46 + i * 8, 2, 5, 8);
      ctx.fillRect(22 + i * 6, 2, 5, 8);
    }

    ctx.fillStyle = rgba([40, 16, 20], 0.95);
    ctx.beginPath();
    ctx.moveTo(-28, 2);
    ctx.lineTo(-16, -12);
    ctx.lineTo(16, -12);
    ctx.lineTo(28, 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(CYN, 0.5);
    ctx.beginPath();
    ctx.moveTo(-18, -10);
    ctx.lineTo(-10, -24);
    ctx.lineTo(10, -24);
    ctx.lineTo(18, -10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba([36, 20, 24], 1);
    ctx.fillRect(-16, -12, 10, 12);
    ctx.fillRect(6, -12, 10, 12);
    ctx.fillStyle = rgba(PNK, 0.95);
    ctx.beginPath();
    ctx.arc(-10, -16, 4.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(12, -16, 3.6, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(MAG, 1);
    ctx.fillRect(-36, 8, 14, 5);
    ctx.fillRect(22, 8, 14, 5);
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.fillRect(-32, 9, 6, 3);
    ctx.fillRect(26, 9, 6, 3);

    ctx.fillStyle = rgba(GOLD, 0.75);
    ctx.fillRect(-8, 12, 16, 3);
    ctx.fillStyle = rgba(WHT, 0.35);
    ctx.fillRect(-20, -14, 40, 2);

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
    ctx.strokeStyle = 'rgba(14,6,20,0.65)';
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
    ctx.strokeStyle = rgba(MAG, 0.04 + spd01 * 0.06);
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
        keys.d = down;
        if (down) inputSrc = 'key';
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
      pointer.down = false;
    }
  });

  requestAnimationFrame(frame);
})();
