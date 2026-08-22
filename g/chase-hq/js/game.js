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
  const BEST_KEY = 'playbox-chase-hq-best';
  const MUTE_KEY = 'playbox-chase-hq-mute';
  const OPS = '← → / A D 转向 · ↑ W 油门 · ↓ S 刹车 · 空格涡轮 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 45, 120];
  const CYN = [0, 232, 255];
  const GOLD = [255, 227, 107];
  const SUN = [255, 72, 20];
  const RED = [224, 28, 40];
  const WHT = [255, 244, 234];
  const BLU = [40, 90, 210];
  const COP = [232, 236, 244];

  const STAGES = [
    { name: '湾岸', theme: 'bay', seed: 12, car: '白跑车', col: [236, 236, 242], hp: 4, call: '白跑车 · 湾岸逃窜' },
    { name: '山道', theme: 'pass', seed: 28, car: '黄轿车', col: [255, 196, 48], hp: 5, call: '黄轿车 · 山道蛇行' },
    { name: '夜城', theme: 'city', seed: 44, car: '黑超跑', col: [48, 28, 62], hp: 6, call: '黑超跑 · 夜城狂飙' },
    { name: '港湾', theme: 'dock', seed: 66, car: '红跑车', col: [220, 36, 48], hp: 7, call: '红跑车 · 港湾末班', goal: true }
  ];

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
  const btnChase = document.getElementById('btn-chase');
  const btnNight = document.getElementById('btn-night');
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
  const comboEl = document.getElementById('combo-label');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const timeBar = document.getElementById('time-bar');
  const timeWrap = document.getElementById('time-wrap');
  const turboBar = document.getElementById('turbo-bar');
  const turboWrap = document.getElementById('turbo-wrap');
  const woundBar = document.getElementById('wound-bar');
  const woundWrap = document.getElementById('wound-wrap');

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
  const pointer = { down: false, hover: false, x: CX, y: VH * 0.7, id: null };
  const particles = [];
  const floats = [];
  const smears = [];
  const segs = [];
  const cars = [];

  const dummy = {
    i: 0, y1: 0, y2: 0, z1: 0, z2: SEG, curve: 0,
    sprites: null,
    p1: { x: CX, y: VH, w: 0, s: 0, z: 1 },
    p2: { x: CX, y: VH, w: 0, s: 0, z: 1 },
    clip: VH
  };

  const G = {
    mode: 'title',
    kind: 'chase',
    stageI: 0,
    t: 0,
    clock: 0,
    z: 0,
    x: 0,
    spd: 0,
    steerVis: 0,
    score: 0,
    best: { c: 0, n: 0 },
    time: 46,
    timeCap: 46,
    combo: 0,
    comboT: 0,
    flow: 0,
    flowN: 0,
    gear: 1,
    trackLen: 0,
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
    curveMem: 0,
    kmh: 0,
    turbo: 1,
    turboOn: false,
    ramCd: 0,
    catching: false,
    catchT: 0,
    siren: false,
    radioT: 0
  };

  const target = {
    z: 0,
    offset: 0,
    spd: 0,
    hp: 4,
    hpMax: 4,
    wob: 0,
    col: [236, 236, 242],
    name: '',
    phase: 0,
    seen: false,
    stopping: false,
    near: false
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
  function def() {
    return STAGES[G.stageI] || STAGES[0];
  }
  function maxSpd() {
    return isNight() ? 12800 : 10400;
  }
  function accel() {
    const turboMul = G.turboOn ? 1.92 : 1;
    return maxSpd() / (isNight() ? 2.72 : 3.05) * turboMul;
  }
  function brake() {
    return -maxSpd() / 1.28;
  }
  function coast() {
    return -maxSpd() / 5.8;
  }
  function offDecel() {
    return -maxSpd() / 1.55;
  }
  function startTime() {
    return isNight() ? 32 : 46;
  }
  function arrestTime() {
    return isNight() ? 12 : 16;
  }
  function kindBest() {
    return isNight() ? G.best.n : G.best.c;
  }
  function kmhMax() {
    return isNight() ? 320 : 280;
  }
  function centrif() {
    return isNight() ? 0.62 : 0.44;
  }
  function stageHp() {
    return def().hp + (isNight() ? 2 : 0);
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

  function buildStage() {
    const st = def();
    segs.length = 0;
    cars.length = 0;
    const night = isNight();
    const targetLen = night ? 820 : 980;
    const hillAmp = st.theme === 'city' ? 220 : st.theme === 'dock' ? 160 : st.theme === 'bay' ? 420 : 780;
    const curveAmp = (night ? 6.8 : 5.2) * (1 + G.stageI * 0.1) * (st.theme === 'city' ? 0.78 : 1);

    addRoad(18, 36, 16, 0, 0);
    let k = 0;
    while (segs.length < targetLen - 120) {
      const h = hash2(st.seed * 13 + k * 3);
      const h2 = hash2(st.seed * 17 + k * 5 + 2);
      const h3 = hash2(st.seed * 19 + k * 7 + 4);
      let curve = (h - 0.5) * 2 * curveAmp;
      if (h > 0.86) curve = 0;
      if (h < 0.14) curve *= 1.32;
      const hill = lastY() + (h2 - 0.48) * hillAmp;
      const enter = 12 + (h3 * 20) | 0;
      const hold = 18 + (hash2(k + 41 + st.seed) * 48) | 0;
      const leave = 10 + (hash2(k + 43 + st.seed) * 20) | 0;
      addRoad(enter, hold, leave, curve, hill);
      k += 1;
    }
    addRoad(18, 40, 14, 0, lastY() * 0.16);
    addRoad(10, 24, 8, 0, 0);

    G.trackLen = segs.length * SEG;
    placeSprites(st, night);
    placeTraffic(st, night);
    spawnTarget();
  }

  function placeSprites(st, night) {
    const theme = st.theme;
    const step = theme === 'city' || night ? 3 : 4;
    for (let i = 8; i < segs.length - 12; i += step) {
      const r = hash2(st.seed * 91 + i * 17);
      const side = hash2(st.seed + i * 3) > 0.5 ? 1 : -1;
      const dist = 1.16 + hash2(i + 9) * 1.5;
      if (theme === 'bay') {
        if (r > 0.2) addSprite(i, -dist - 0.1, 'palm', 880 + (r * 240) | 0, 240);
        if (r > 0.38) addSprite(i, dist + 0.1, r > 0.78 ? 'rock' : 'palm', r > 0.78 ? 260 : 820, r > 0.78 ? 220 : 230);
        if ((i % 18) === 0) addSprite(i, side * 1.05, 'lamp', 620, 68);
      } else if (theme === 'pass') {
        if (r > 0.16) addSprite(i, -dist - 0.08, 'pine', 920 + (r * 280) | 0, 280);
        if (r > 0.34) addSprite(i, dist + 0.1, r > 0.72 ? 'rock' : 'pine', r > 0.72 ? 280 : 860, r > 0.72 ? 230 : 260);
        if ((i % 16) === 0) addSprite(i, side * 1.04, 'post', 380, 60);
      } else if (theme === 'city') {
        if (r > 0.1) addSprite(i, -dist - 0.2, 'build', 980 + (r * 900) | 0, 380 + (r * 240) | 0);
        if (r > 0.26) addSprite(i, dist + 0.22, 'build', 860 + (hash2(i) * 780) | 0, 360);
        if ((i % 5) === 0) addSprite(i, side * 1.08, 'lamp', 660, 72);
        if ((i % 11) === 0) addSprite(i, side * (1.4 + r), 'neon', 420, 180);
      } else {
        if (r > 0.18) addSprite(i, -dist - 0.16, r > 0.7 ? 'crane' : 'ware', 720 + (r * 640) | 0, 360);
        if (r > 0.32) addSprite(i, dist + 0.18, r > 0.62 ? 'crate' : 'ware', r > 0.62 ? 220 : 640, r > 0.62 ? 200 : 340);
        if ((i % 14) === 0) addSprite(i, side * 1.06, 'lamp', 600, 68);
      }
      if (night && (i % 7) === 0) addSprite(i, side * 1.07, 'lamp', 640, 70);
    }
  }

  function trafficColor(h) {
    if (h < 0.18) return [70, 140, 210];
    if (h < 0.34) return [90, 90, 98];
    if (h < 0.5) return [46, 150, 92];
    if (h < 0.66) return [210, 150, 50];
    if (h < 0.82) return [180, 70, 90];
    return [200, 200, 210];
  }

  function placeTraffic(st, night) {
    const n = night ? 22 : 13;
    const max = maxSpd();
    for (let i = 0; i < n; i++) {
      const z = (50 + i * ((segs.length - 140) / n) + hash2(st.seed + i) * 40) * SEG;
      cars.push({
        z: z,
        offset: (hash2(st.seed * 3 + i) - 0.5) * 1.18,
        spd: max * (0.28 + hash2(i + 8) * 0.38),
        col: trafficColor(hash2(st.seed + i * 19)),
        wob: hash2(i + 4) * TAU,
        near: false
      });
    }
  }

  function spawnTarget() {
    const st = def();
    const pz = G.z + PLAYER_Z;
    target.z = pz + (isNight() ? 9200 : 7800);
    target.offset = (hash2(st.seed + G.stageI * 9) - 0.5) * 0.7;
    target.spd = maxSpd() * (isNight() ? 0.72 : 0.64);
    target.hpMax = stageHp();
    target.hp = target.hpMax;
    target.wob = 0;
    target.col = st.col.slice();
    target.name = st.car;
    target.phase = rand(0, TAU);
    target.seen = false;
    target.stopping = false;
    target.near = false;
    G.catching = false;
    G.catchT = 0;
    G.ramCd = 0;
  }

  function palette() {
    const theme = def().theme;
    const night = isNight() || theme === 'city';
    if (theme === 'bay' && !isNight()) {
      return {
        skyTop: [26, 6, 16],
        skyMid: [168, 42, 36],
        skyHor: [255, 120, 52],
        fog: [255, 140, 80],
        lg: [16, 88, 118], lg2: [18, 102, 132],
        rg: [168, 92, 42], rg2: [148, 78, 34],
        road: [46, 38, 42], road2: [56, 46, 50],
        rumble: [255, 72, 20], rumble2: [248, 236, 220],
        lane: [255, 214, 130],
        sun: [255, 190, 70],
        mtn1: [72, 24, 28], mtn2: [48, 16, 20],
        sea: true
      };
    }
    if (theme === 'pass' && !isNight()) {
      return {
        skyTop: [22, 8, 18],
        skyMid: [90, 36, 48],
        skyHor: [255, 132, 70],
        fog: [210, 120, 90],
        lg: [36, 72, 42], lg2: [28, 60, 36],
        rg: [42, 68, 40], rg2: [32, 56, 34],
        road: [48, 42, 46], road2: [58, 50, 54],
        rumble: [255, 72, 20], rumble2: [240, 230, 220],
        lane: [255, 220, 140],
        sun: [255, 196, 80],
        mtn1: [48, 28, 32], mtn2: [32, 18, 22],
        sea: false
      };
    }
    if (theme === 'dock' && !isNight()) {
      return {
        skyTop: [18, 8, 28],
        skyMid: [70, 28, 52],
        skyHor: [255, 110, 58],
        fog: [180, 90, 70],
        lg: [22, 70, 92], lg2: [18, 58, 78],
        rg: [70, 52, 40], rg2: [56, 42, 32],
        road: [42, 40, 48], road2: [52, 48, 58],
        rumble: [0, 232, 255], rumble2: [255, 72, 20],
        lane: [255, 220, 150],
        sun: [255, 186, 78],
        mtn1: [40, 22, 36], mtn2: [26, 14, 24],
        sea: true
      };
    }
    return {
      skyTop: [8, 4, 16],
      skyMid: [24, 10, 36],
      skyHor: night ? [70, 18, 52] : [90, 24, 48],
      fog: [32, 14, 36],
      lg: [16, 16, 28], lg2: [12, 12, 22],
      rg: [20, 16, 28], rg2: [14, 12, 22],
      road: [30, 26, 36], road2: [38, 34, 46],
      rumble: [0, 232, 255], rumble2: [255, 45, 120],
      lane: [200, 220, 255],
      sun: [210, 220, 255],
      mtn1: [18, 10, 28], mtn2: [12, 8, 20],
      sea: theme === 'bay' || theme === 'dock'
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
    sir: null,
    sir2: null,
    sirG: null,
    ensure() {
      if (!this.ctx) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.36;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.startEngine();
      this.startSiren();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.36;
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
      f.frequency.value = 880;
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
    startSiren() {
      if (!this.ctx || this.sir) return;
      const o = this.ctx.createOscillator();
      o.type = 'square';
      const o2 = this.ctx.createOscillator();
      o2.type = 'square';
      const g = this.ctx.createGain();
      g.gain.value = 0;
      o.connect(g);
      o2.connect(g);
      g.connect(this.master);
      o.frequency.value = 740;
      o2.frequency.value = 560;
      o.start();
      o2.start();
      this.sir = o;
      this.sir2 = o2;
      this.sirG = g;
    },
    tickEngine(spd01, on) {
      if (!this.engG || !this.ctx) return;
      const t = this.ctx.currentTime;
      if (!on) {
        this.engG.gain.setTargetAtTime(0, t, 0.08);
        return;
      }
      const pulse = Math.sin(G.t * (18 + spd01 * 22)) * (3 + spd01 * 10);
      const turboAdd = G.turboOn ? 48 : 0;
      const f = 64 + spd01 * 172 + pulse + turboAdd;
      this.eng.frequency.setTargetAtTime(f, t, 0.04);
      this.eng2.frequency.setTargetAtTime(f * 0.5, t, 0.04);
      this.eng3.frequency.setTargetAtTime(f * 2.04, t, 0.04);
      this.engF.frequency.setTargetAtTime(400 + spd01 * 1500 + (G.turboOn ? 400 : 0), t, 0.07);
      const crashMul = G.crashT > 0 ? 0.32 : 1;
      this.engG.gain.setTargetAtTime(this.muted ? 0 : (0.026 + spd01 * 0.068) * crashMul, t, 0.05);
    },
    tickSiren(on) {
      if (!this.sirG || !this.ctx) return;
      const t = this.ctx.currentTime;
      if (!on || this.muted) {
        this.sirG.gain.setTargetAtTime(0, t, 0.08);
        return;
      }
      const flip = ((G.t * 3.2) | 0) % 2;
      this.sir.frequency.setTargetAtTime(flip ? 880 : 620, t, 0.04);
      this.sir2.frequency.setTargetAtTime(flip ? 620 : 880, t, 0.04);
      this.sirG.gain.setTargetAtTime(0.018 + (G.turboOn ? 0.012 : 0), t, 0.06);
    },
    sting() {
      this.beep(392, 0.07, 'square', 0.07, 784);
      this.beep(523, 0.11, 'triangle', 0.05);
      this.beep(784, 0.16, 'square', 0.045);
    },
    radio() {
      this.beep(980, 0.04, 'square', 0.05);
      this.beep(1320, 0.05, 'square', 0.04);
      this.beep(880, 0.08, 'triangle', 0.03);
    },
    ram(n) {
      this.noise(0.16, 0.22, 480);
      this.beep(180, 0.12, 'sawtooth', 0.12, 70);
      const f = 520 + Math.min(10, n) * 70;
      this.beep(f, 0.09, 'square', 0.07, f * 1.6);
      this.beep(f * 0.5, 0.12, 'triangle', 0.04);
    },
    crash() {
      this.noise(0.26, 0.24, 220);
      this.beep(150, 0.22, 'sawtooth', 0.11, 48);
      this.beep(86, 0.3, 'square', 0.055, 40);
    },
    turbo() {
      this.noise(0.18, 0.12, 900);
      this.beep(220, 0.14, 'sawtooth', 0.07, 640);
    },
    arrest() {
      this.beep(523, 0.1, 'square', 0.08);
      this.beep(659, 0.12, 'triangle', 0.07);
      this.beep(784, 0.16, 'square', 0.065, 1046);
      this.beep(1175, 0.22, 'triangle', 0.05);
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
    },
    gear() {
      this.beep(210, 0.04, 'square', 0.04, 480);
    }
  };

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
    G.punch = Math.max(G.punch, 1 + Math.min(0.055, mag * 0.007));
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
    if (REDUCE) n = Math.max(1, (n * 0.35) | 0);
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
    if (particles.length > 260) particles.splice(0, particles.length - 260);
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
    ovKicker.textContent = kind === 'win' ? 'ARREST' : kind === 'lose' ? 'ESCAPED' : 'CHASE';
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
        G.best.n = o.n | 0;
      } else {
        const n = parseInt(raw, 10);
        if (n > 0) G.best.c = n;
      }
    } catch (err) { /* ignore */ }
  }

  function maybeBest() {
    const k = isNight() ? 'n' : 'c';
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

  function wound01() {
    if (!target.hpMax) return 0;
    return clamp(1 - target.hp / target.hpMax, 0, 1);
  }

  function hud() {
    if (scoreEl) scoreEl.textContent = String(G.score | 0);
    if (bestEl) bestEl.textContent = String(kindBest() | 0);
    if (timeEl) timeEl.textContent = fmtTime(G.time);
    if (spdEl) spdEl.textContent = String(G.kmh | 0);
    if (stageLabel) {
      stageLabel.textContent = def().name + ' · ' + (G.stageI + 1) + '/4';
      stageLabel.classList.toggle('hot', !!def().goal);
    }
    if (tagLabel) {
      tagLabel.textContent = isNight() ? '夜追' : '追车';
      tagLabel.classList.toggle('night', isNight());
    }
    if (timeBox) timeBox.classList.toggle('low', G.mode === 'play' && G.time < 10);
    if (timeBar) timeBar.style.transform = 'scaleX(' + clamp(G.time / Math.max(1, G.timeCap), 0, 1) + ')';
    if (timeWrap) timeWrap.classList.toggle('low', G.mode === 'play' && G.time < 10);
    if (turboBar) turboBar.style.transform = 'scaleX(' + clamp(G.turbo, 0, 1) + ')';
    if (turboWrap) turboWrap.classList.toggle('hot', G.turboOn);
    if (woundBar) woundBar.style.transform = 'scaleX(' + wound01() + ')';
    if (woundWrap) woundWrap.classList.toggle('hot', G.mode === 'play' && target.hp <= 2 && target.hp > 0);
    if (btnTurbo) btnTurbo.classList.toggle('hot', G.turboOn);
    if (stageEl) {
      const siren = G.mode === 'play' && (G.turboOn || target.near || G.catching);
      stageEl.classList.toggle('siren', siren && !REDUCE);
    }
    if (comboEl) {
      const show = G.mode === 'play' && (G.combo > 1 || G.flowN > 2);
      comboEl.hidden = !show;
      if (show) comboEl.textContent = G.combo > 1 ? ('连撞 ×' + G.combo) : ('狂追 ×' + G.flowN);
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'win') setHint('R 再追 · 四辆全逮', 'hot');
    else if (G.mode === 'lose') setHint('R 重开 · 撞车只会减速，超时目标就跑了', 'warn');
    else if (G.catching) setHint('目标熄火 · 贴上去逮捕', 'hot');
    else if (G.time < 10) setHint('时间将尽 · 涡轮撞停', 'warn');
    else if (target.near) setHint('目标在前 · 空格涡轮 · 对准车尾撞', 'hot');
    else setHint('← → 转向 · ↑ 油门 · 空格涡轮 · 撞停目标', '');
  }

  function resetRunVars() {
    G.z = 40;
    G.x = 0;
    G.steerVis = 0;
    G.crashT = 0;
    G.bounce = 0;
    G.combo = 0;
    G.comboT = 0;
    G.flow = 0;
    G.flowN = 0;
    G.gear = 1;
    G.ending = '';
    G.endT = 0;
    G.off = false;
    G.turbo = 1;
    G.turboOn = false;
    G.ramCd = 0;
    G.catching = false;
    G.catchT = 0;
    G.radioT = 0;
    particles.length = 0;
    floats.length = 0;
    smears.length = 0;
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'chase';
    G.stageI = 0;
    G.score = 0;
    G.time = startTime();
    G.timeCap = G.time;
    resetRunVars();
    G.z = 0;
    G.spd = maxSpd() * 0.56;
    buildStage();
    showOverlay('title', '追缉', '后视警车。涡轮追上逃车，连续撞击直到它停下来。');
    hud();
  }

  function startGame(kind) {
    audio.ensure();
    G.kind = kind === 'night' ? 'night' : 'chase';
    G.mode = 'play';
    G.stageI = 0;
    G.score = 0;
    G.time = startTime();
    G.timeCap = G.time;
    resetRunVars();
    G.spd = maxSpd() * 0.28;
    G.flash = 0.4;
    G.flashRgb = isNight() ? MAG : SUN;
    G.stop = 0;
    G.shake = 0;
    buildStage();
    hideOverlay();
    audio.sting();
    audio.radio();
    toast(isNight() ? '夜追 · 车更密更快' : '追车 · 撞停四辆', false, true);
    setTimeout(function () {
      if (G.mode === 'play') toast(def().call, false, false);
    }, 720);
    hud();
  }

  function ramTarget() {
    if (target.hp <= 0 || G.ramCd > 0 || G.crashT > 0.12) return;
    G.ramCd = 0.4;
    target.hp -= 1;
    const dir = G.x >= target.offset ? 1 : -1;
    target.offset = clamp(target.offset - dir * 0.2, -0.92, 0.92);
    G.x = clamp(G.x + dir * 0.1, -2, 2);
    G.spd *= 0.84;
    target.spd *= 0.7;
    target.wob = 1;
    G.combo += 1;
    G.comboT = 2.4;
    const n = 160 * G.combo + 40 * G.stageI;
    bumpScore(n);
    audio.ram(G.combo);
    hitStop(0.058 + Math.min(0.022, G.combo * 0.004));
    kick(5.5 + Math.min(4, G.combo));
    screenFlash(GOLD, 0.42 + Math.min(0.2, G.combo * 0.04));
    const hx = CX + (target.offset - G.x) * 90;
    const hy = VH * 0.62;
    floatText(hx, hy - 24, '连撞 ×' + G.combo, GOLD);
    emit(22, {
      x: hx, y: hy, j: 18,
      vx0: -240, vx1: 240, vy0: -180, vy1: 40,
      r0: 1.4, r1: 4.2, life: 0.42, rgb: GOLD
    });
    emit(14, {
      x: hx, y: hy, j: 10,
      vx0: -160, vx1: 160, vy0: -140, vy1: 20,
      r0: 1, r1: 2.6, life: 0.32, rgb: CYN
    });
    emit(10, {
      x: hx, y: hy + 6, j: 8,
      vx0: -80, vx1: 80, vy0: -40, vy1: 60,
      r0: 1.2, r1: 3, life: 0.28, rgb: WHT
    });
    if (comboEl) {
      comboEl.classList.remove('hot');
      void comboEl.offsetWidth;
      comboEl.classList.add('hot');
    }
    if (G.combo === 2) toast('连撞 ×2', false, true);
    if (G.combo === 4) toast('连撞 ×4 · 顶上去', false, true);
    if (G.combo === 6) toast('连撞 ×6 · 拆了它', false, true);
    if (target.hp <= 0) {
      target.hp = 0;
      target.stopping = true;
      G.catching = true;
      G.catchT = 1.65;
      toast('熄火了 · 贴上去', false, true);
      audio.radio();
    } else if (target.hp === 1) {
      toast('再撞一次', false, true);
    } else {
      toast('撞上了', false, false);
    }
  }

  function crash(kind, other) {
    if (G.crashT > 0.16) return;
    G.crashT = 0.92;
    G.bounce = 1;
    G.spd *= kind === 'off' ? 0.28 : 0.34;
    if (other) {
      const dir = G.x >= other.offset ? 1 : -1;
      G.x += dir * 0.26;
    } else {
      G.x = clamp(G.x * 0.55, -0.85, 0.85);
    }
    G.combo = 0;
    G.flowN = 0;
    G.flow = 0;
    audio.crash();
    hitStop(0.05);
    kick(7.2);
    screenFlash(MAG, 0.5);
    emit(28, {
      x: CX, y: VH - 64, j: 28,
      vx0: -240, vx1: 240, vy0: -190, vy1: 40,
      r0: 1.8, r1: 5.2, life: 0.48, rgb: RED
    });
    emit(10, {
      x: CX, y: VH - 70, j: 12,
      vx0: -80, vx1: 80, vy0: -140, vy1: -10,
      r0: 1, r1: 2.4, life: 0.3, rgb: GOLD
    });
    if (kind === 'off') toast('冲出 · 减速复原', true, false);
    else toast('擦车 · 减速', true, false);
  }

  function doArrest() {
    if (G.mode !== 'play') return;
    if (!G.catching && !target.stopping && target.hp > 0) return;
    G.catching = false;
    const add = arrestTime();
    const st = def();
    const bonus = 900 + ((G.time * 12) | 0) + G.combo * 80 + G.stageI * 220;
    bumpScore(bonus);
    audio.arrest();
    hitStop(0.07);
    kick(5);
    screenFlash(GOLD, 0.62);
    floatText(CX, VH * 0.38, '逮住了', GOLD);
    emit(32, {
      x: CX, y: HORIZON + 50, j: 100,
      vx0: -160, vx1: 160, vy0: -80, vy1: 90,
      r0: 2, r1: 5, life: 0.55, rgb: GOLD
    });
    if (st.goal) {
      finish('win');
      return;
    }
    G.time += add;
    G.timeCap = Math.max(G.timeCap, G.time);
    G.stageI += 1;
    G.z = 50;
    G.x = clamp(G.x, -0.5, 0.5);
    G.combo = 0;
    G.comboT = 0;
    buildStage();
    toast(def().call + '  ·  +' + add + '″', false, true);
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
      showOverlay('win', '逮住了', (isNight() ? '夜追' : '追车') + ' 四辆全逮　·　' + (G.score | 0) + ' 分');
    } else {
      maybeBest();
      G.mode = 'lose';
      audio.lose();
      kick(6);
      showOverlay('lose', '跑了', '追到 ' + def().name + '　·　' + (G.score | 0) + ' 分。撞车只会减速，超时才会跑掉。');
    }
    hud();
  }

  function wrapWorld() {
    const cut = 220 * SEG;
    if (G.z <= G.trackLen - 70 * SEG) return;
    G.z -= cut;
    target.z -= cut;
    for (let i = 0; i < cars.length; i++) cars[i].z -= cut;
  }

  function updateTraffic(dt) {
    const pz = G.z + PLAYER_Z;
    const maxz = G.trackLen - 8000;
    for (let i = 0; i < cars.length; i++) {
      const c = cars[i];
      c.z += c.spd * dt;
      c.wob += dt * 1.8;
      const dz = c.z - pz;
      const dx = Math.abs(c.offset - G.x);
      if (G.mode === 'play' && G.crashT <= 0 && G.ending === '' && !G.catching) {
        if (Math.abs(dz) < 200 && dx < 0.28) {
          crash('car', c);
        } else if (Math.abs(dz) < 280 && dx < 0.44 && !c.near) {
          c.near = true;
        }
      }
      if (c.z < pz - 1800) {
        c.z = Math.min(maxz, pz + 2400 + rand(0, 5200));
        c.offset = rand(-0.78, 0.78);
        c.near = false;
        c.col = trafficColor(Math.random());
        const tdz = Math.abs(c.z - target.z);
        if (tdz < 900) c.z += 1400;
      }
    }
  }

  function updateTarget(dt) {
    const pz = G.z + PLAYER_Z;
    const gap = target.z - pz;
    const max = maxSpd();
    target.wob = Math.max(0, target.wob - dt * 2.4);
    target.phase += dt * (1.4 + (isNight() ? 0.5 : 0) + (target.hp <= 2 ? 0.8 : 0));

    if (target.stopping || G.catching) {
      target.spd = Math.max(0, target.spd - max * 0.55 * dt);
      target.offset = lerp(target.offset, 0, 1 - Math.pow(0.12, dt));
      if (G.catching) {
        G.catchT -= dt;
        if ((target.spd < max * 0.12 && Math.abs(gap) < 1600) || G.catchT <= 0) {
          doArrest();
        }
      }
      return;
    }

    let want = max * (isNight() ? 0.7 : 0.62);
    if (gap > 16000) want *= 0.72;
    else if (gap > 10000) want *= 0.88;
    else if (gap < 500) want = Math.min(want, G.spd * 0.96);
    if (gap < -200) {
      target.z = pz + 220;
      want = G.spd * 1.02;
    }
    target.spd = lerp(target.spd, want, 1 - Math.pow(0.18, dt));
    target.z += target.spd * dt;

    const weave = (isNight() ? 0.42 : 0.32) * (gap < 2800 ? 1.35 : 1) * (target.hp / Math.max(1, target.hpMax) < 0.4 ? 1.25 : 1);
    const lane = Math.sin(target.phase) * weave;
    target.offset = lerp(target.offset, clamp(lane, -0.82, 0.82), 1 - Math.pow(0.08, dt));
    if (target.wob > 0) target.offset += Math.sin(G.t * 28) * 0.08 * target.wob;

    target.near = gap > -80 && gap < 3200;
    if (!target.seen && gap < 9000 && G.mode === 'play') {
      target.seen = true;
      toast('目标在前方', false, true);
      audio.radio();
    }

    if (G.mode === 'play' && G.crashT <= 0 && G.ending === '' && G.ramCd <= 0) {
      if (gap > -60 && gap < 260 && Math.abs(target.offset - G.x) < 0.34 && G.spd > target.spd * 0.55) {
        ramTarget();
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
    G.ramCd = Math.max(0, G.ramCd - dt);
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
      floats[i].y -= 30 * dt;
      if (floats[i].t <= 0) floats.splice(i, 1);
    }
  }

  function autoDemo(dt) {
    const seg = findSeg(G.z + PLAYER_Z);
    const want = clamp(-seg.curve * 0.14, -0.7, 0.7);
    G.x += (want * 0.7 - G.x) * 2.2 * dt;
    G.x = clamp(G.x, -0.8, 0.8);
    G.spd = lerp(G.spd, maxSpd() * 0.6, 1 - Math.pow(0.08, dt));
    G.turbo = 0.85;
    if (G.z + PLAYER_Z > G.trackLen * 0.45) {
      G.z = 80;
      G.x = 0;
      spawnTarget();
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    const playing = G.mode === 'play' && !G.ending;
    const demo = G.mode === 'title';
    const spd01 = clamp(G.spd / maxSpd(), 0, 1);
    audio.tickEngine(spd01, (playing || demo) && G.spd > 40);
    audio.tickSiren((playing || demo) && (G.turboOn || target.near || G.catching));

    if (G.stop > 0) {
      G.stop -= dt;
      updateJuice(dt * 0.32);
      return;
    }

    updateJuice(dt);

    if (G.mode === 'win' || G.mode === 'lose') {
      G.spd = Math.max(0, G.spd - maxSpd() * 0.62 * dt);
      G.z += G.spd * dt;
      G.kmh = (G.spd / maxSpd()) * kmhMax();
      G.steerVis = lerp(G.steerVis, 0, 1 - Math.pow(0.02, dt));
      G.turboOn = false;
      return;
    }

    if (demo) autoDemo(dt);

    const seg = findSeg(G.z + PLAYER_Z);
    const dx = dt * (isNight() ? 2.35 : 2.08) * Math.max(0.22, spd01);

    let steer = 0;
    if (!demo) {
      if (keys.l) steer -= 1;
      if (keys.r) steer += 1;
      if (inputSrc === 'ptr' && pointer.down) {
        const tx = (pointer.x - CX) / (CX * 0.68);
        steer = clamp(tx * 1.4, -1, 1);
      }
      if (G.crashT > 0) steer *= 0.32;
    }

    if (!demo) {
      G.x += steer * dx * (G.off ? 0.62 : 1);
      G.x -= dx * spd01 * seg.curve * centrif();
    }
    if (G.crashT > 0) G.x += (0 - G.x) * 2.1 * dt;
    G.x = clamp(G.x, -2.18, 2.18);
    G.steerVis = lerp(G.steerVis, steer, 1 - Math.pow(0.0007, dt));
    G.curveMem = lerp(G.curveMem, seg.curve * spd01, 1 - Math.pow(0.04, dt));

    const gas = keys.u || (pointer.down && inputSrc === 'ptr');
    const wantTurbo = (keys.t || (pointer.down && pointer.y < VH * 0.38)) && G.turbo > 0.06 && G.crashT <= 0 && !demo;
    if (wantTurbo && !G.turboOn) audio.turbo();
    G.turboOn = !!wantTurbo;
    if (G.turboOn) G.turbo = Math.max(0, G.turbo - dt * 0.52);
    else G.turbo = Math.min(1, G.turbo + dt * 0.26);
    if (G.turbo <= 0) G.turboOn = false;

    const max = maxSpd() * (G.turboOn ? 1.22 : 1);
    if (!demo) {
      if (G.crashT > 0) {
        G.spd += accel() * 0.22 * dt;
      } else if (keys.d) {
        G.spd += brake() * dt;
      } else if (gas || G.turboOn) {
        G.spd += accel() * dt;
      } else {
        G.spd += coast() * dt;
      }
    }

    G.off = Math.abs(G.x) > 1.08;
    if (G.off && G.spd > maxSpd() * 0.4) G.spd += offDecel() * dt;
    if (G.off && playing && Math.random() < 0.4) {
      emit(1, {
        x: CX + G.steerVis * 22, y: VH - 34, j: 10,
        vx0: -50, vx1: 50, vy0: -12, vy1: 28,
        r0: 1, r1: 2.3, life: 0.22, rgb: [160, 110, 70]
      });
    }
    G.spd = clamp(G.spd, 0, max);
    G.z += G.spd * dt;
    if (G.z < 0) G.z = 0;
    wrapWorld();

    G.kmh = clamp(G.spd / maxSpd(), 0, 1.22) * kmhMax();

    const gear = spd01 < 0.2 ? 1 : spd01 < 0.46 ? 2 : spd01 < 0.72 ? 3 : 4;
    if (gear > G.gear && playing) audio.gear();
    G.gear = gear;

    if (playing && G.crashT <= 0 && !G.catching) {
      if (G.off && spd01 > 0.46) crash('off');
      else if (Math.abs(G.x) > 1.55) crash('off');
    }

    if (playing && spd01 > 0.8 && G.turboOn && !G.off && G.crashT <= 0) {
      G.flow += dt;
      if (G.flow >= 0.62) {
        G.flow = 0;
        G.flowN += 1;
        bumpScore(22 + G.flowN * 7);
        if (G.flowN === 4) toast('狂追', false, true);
        if (G.flowN === 8) toast('全速', false, true);
      }
    } else {
      G.flow = 0;
      if (G.crashT > 0 || G.off) G.flowN = 0;
    }

    if (spd01 > 0.48 && !REDUCE) {
      if (smears.length < 22 && Math.random() < (G.turboOn ? 0.8 : 0.5)) {
        smears.push({
          x: rand(0, VW),
          y: rand(HORIZON + 8, VH),
          len: rand(16, 80) * spd01 * (G.turboOn ? 1.35 : 1),
          a: rand(0.08, 0.26) * spd01,
          v: 900 + spd01 * 1600,
          lean: G.steerVis
        });
      }
    }
    for (let i = smears.length - 1; i >= 0; i--) {
      smears[i].y += smears[i].v * dt * 0.26;
      smears[i].x += smears[i].lean * 140 * dt;
      smears[i].a -= dt * 0.72;
      if (smears[i].a <= 0 || smears[i].y > VH + 10) smears.splice(i, 1);
    }

    if (G.turboOn && playing && Math.random() < 0.45) {
      emit(2, {
        x: CX - G.steerVis * 16 + rand(-10, 10), y: VH - 22, j: 6,
        vx0: -30, vx1: 30, vy0: 20, vy1: 70,
        r0: 1.2, r1: 3.2, life: 0.2, rgb: Math.random() > 0.5 ? SUN : GOLD
      });
    }

    updateTraffic(dt);
    updateTarget(dt);

    if (playing) {
      G.time -= dt;
      if (G.time < 10 && G.time + dt >= Math.ceil(G.time) && G.time > 0) audio.warn();
      if (G.time <= 0) {
        G.time = 0;
        if (G.catching || target.hp <= 0) {
          doArrest();
        } else if (!G.ending) {
          G.ending = 'time';
          G.endT = 0.78;
          toast('跑了', true, false);
        }
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

    const night = isNight() || def().theme === 'city';
    if (night) {
      for (let i = 0; i < 40; i++) {
        const hx = hash2(i * 19 + 3);
        const hy = hash2(i * 23 + 7);
        ctx.fillStyle = rgba(WHT, 0.22 + hash2(i) * 0.5);
        ctx.fillRect((hx * VW + G.curveMem * 2) % VW, hy * (HORIZON - 8), 1.4, 1.4);
      }
    }

    const sunX = CX + 176 - G.x * 14 - G.curveMem * 8;
    const sunY = HORIZON * (night ? 0.38 : 0.54);
    const sunR = night ? 11 : 22;
    const sg = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, 68);
    sg.addColorStop(0, rgba(night ? WHT : pal.sun, 0.95));
    sg.addColorStop(0.25, rgba(pal.sun, 0.55));
    sg.addColorStop(1, rgba(pal.sun, 0));
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 68, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(night ? [210, 220, 255] : pal.sun, 1);
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, TAU);
    ctx.fill();

    if (pal.sea) {
      ctx.fillStyle = rgba(mix(pal.lg, pal.skyHor, 0.35), 1);
      ctx.fillRect(0, HORIZON, VW * 0.5, 16);
    }
  }

  function drawMountains(pal) {
    const drift = -G.x * 36 + G.curveMem * 10;
    function layer(rgb, base, amp, par, seed) {
      ctx.fillStyle = rgba(rgb, 1);
      ctx.beginPath();
      ctx.moveTo(-20, HORIZON + 8);
      for (let i = 0; i <= 16; i++) {
        const px = (i / 16) * (VW + 40) - 20 + drift * par;
        const h = hash2(seed + i) * amp + hash2(seed + i * 3) * amp * 0.4;
        ctx.lineTo(px, HORIZON - base - h);
      }
      ctx.lineTo(VW + 20, HORIZON + 8);
      ctx.closePath();
      ctx.fill();
    }
    layer(pal.mtn1, 28, 42, 0.35, def().seed);
    layer(pal.mtn2, 12, 28, 0.62, def().seed + 9);
  }

  function drawOneRoad(p1, p2, pal, alt, fog) {
    const x1 = p1.x;
    const x2 = p2.x;
    const w1 = p1.w;
    const w2 = p2.w;
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
      const o = 0.34;
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
    quad(0, p1.y, p1.x, p1.y, p2.x, p2.y, 0, p2.y, lg);
    quad(p1.x, p1.y, VW, p1.y, VW, p2.y, p2.x, p2.y, rg);
    drawOneRoad(p1, p2, pal, alt, fog);
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
    const night = isNight() || def().theme === 'city';
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VW, clip);
    ctx.clip();

    if (spr.k === 'palm') {
      ctx.fillStyle = rgba([92, 58, 32], 1);
      ctx.fillRect(x - w * 0.05, y + h * 0.32, w * 0.1, h * 0.68);
      ctx.fillStyle = rgba(night ? [28, 90, 52] : [36, 140, 64], 1);
      ctx.beginPath();
      ctx.ellipse(x, y + h * 0.28, w * 0.48, h * 0.22, 0, 0, TAU);
      ctx.fill();
    } else if (spr.k === 'pine') {
      ctx.fillStyle = rgba([70, 48, 30], 1);
      ctx.fillRect(x - w * 0.06, y + h * 0.62, w * 0.12, h * 0.38);
      ctx.fillStyle = rgba(night ? [20, 60, 38] : [28, 92, 48], 1);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w * 0.46, y + h * 0.72);
      ctx.lineTo(x - w * 0.46, y + h * 0.72);
      ctx.closePath();
      ctx.fill();
    } else if (spr.k === 'rock') {
      ctx.fillStyle = rgba(mix([90, 78, 70], pal.fog, 0.2), 1);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, y + h);
      ctx.lineTo(x - w * 0.2, y + h * 0.2);
      ctx.lineTo(x + w * 0.15, y);
      ctx.lineTo(x + w * 0.5, y + h);
      ctx.closePath();
      ctx.fill();
    } else if (spr.k === 'post') {
      ctx.fillStyle = rgba([180, 40, 40], 1);
      ctx.fillRect(x - w * 0.18, y, w * 0.36, h * 0.55);
      ctx.fillStyle = rgba([220, 220, 230], 1);
      ctx.fillRect(x - w * 0.08, y + h * 0.55, w * 0.16, h * 0.45);
    } else if (spr.k === 'lamp') {
      ctx.fillStyle = rgba([40, 40, 48], 1);
      ctx.fillRect(x - w * 0.08, y + h * 0.12, w * 0.16, h * 0.88);
      ctx.fillStyle = rgba(night ? GOLD : [255, 220, 160], night ? 0.9 : 0.55);
      ctx.beginPath();
      ctx.arc(x, y + h * 0.1, w * 0.42, 0, TAU);
      ctx.fill();
    } else if (spr.k === 'build') {
      ctx.fillStyle = rgba(night ? [22, 16, 36] : [48, 36, 52], 1);
      ctx.fillRect(x - w * 0.5, y, w, h);
      ctx.fillStyle = rgba(night ? [18, 12, 28] : [38, 28, 42], 1);
      ctx.fillRect(x - w * 0.18, y - h * 0.12, w * 0.36, h * 0.14);
      const rows = 4 + ((hash2((spr.h | 0) + 3) * 4) | 0);
      const cols = 3 + ((hash2((spr.w | 0) + 5) * 3) | 0);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const on = hash2(r * 17 + c * 9 + (spr.h | 0)) > 0.35;
          ctx.fillStyle = rgba(on ? (c % 2 ? GOLD : CYN) : [20, 16, 24], on ? (night ? 0.85 : 0.45) : 0.4);
          const ww = w / (cols + 1);
          const hh = h / (rows + 2);
          ctx.fillRect(x - w * 0.42 + c * ww, y + h * 0.12 + r * hh, ww * 0.55, hh * 0.45);
        }
      }
    } else if (spr.k === 'neon') {
      ctx.fillStyle = rgba(hash2(spr.h | 0) > 0.5 ? MAG : CYN, 0.85);
      ctx.fillRect(x - w * 0.5, y, w, h * 0.38);
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.font = 'bold ' + Math.max(8, h * 0.18) + 'px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NITE', x, y + h * 0.2);
    } else if (spr.k === 'crane') {
      ctx.fillStyle = rgba([210, 140, 40], 1);
      ctx.fillRect(x - w * 0.06, y, w * 0.12, h);
      ctx.fillRect(x - w * 0.48, y + h * 0.12, w * 0.96, h * 0.08);
      ctx.fillRect(x + w * 0.28, y + h * 0.12, w * 0.06, h * 0.28);
    } else if (spr.k === 'ware') {
      ctx.fillStyle = rgba([70, 58, 52], 1);
      ctx.fillRect(x - w * 0.5, y + h * 0.18, w, h * 0.82);
      ctx.fillStyle = rgba([90, 50, 42], 1);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.52, y + h * 0.2);
      ctx.lineTo(x, y);
      ctx.lineTo(x + w * 0.52, y + h * 0.2);
      ctx.closePath();
      ctx.fill();
    } else if (spr.k === 'crate') {
      ctx.fillStyle = rgba([160, 110, 50], 1);
      ctx.fillRect(x - w * 0.45, y + h * 0.2, w * 0.9, h * 0.8);
      ctx.strokeStyle = rgba([90, 60, 28], 1);
      ctx.lineWidth = Math.max(1, w * 0.06);
      ctx.strokeRect(x - w * 0.45, y + h * 0.2, w * 0.9, h * 0.8);
    }
    ctx.restore();
  }

  function drawRearCar(col, w, h, flags) {
    const cop = flags.cop;
    const dmg = flags.dmg || 0;
    const fire = flags.fire;
    const smoke = flags.smoke;
    const turbo = flags.turbo;
    const wob = flags.wob || 0;
    ctx.save();
    ctx.translate(wob, 0);

    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(0, 8, w * 0.48, h * 0.12, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#141018';
    ctx.fillRect(-w * 0.46, -h * 0.12, w * 0.2, h * 0.22);
    ctx.fillRect(w * 0.26, -h * 0.12, w * 0.2, h * 0.22);

    const body = cop ? COP : mix(col, [40, 20, 24], dmg * 0.35);
    ctx.fillStyle = rgba(body, 1);
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, 6);
    ctx.lineTo(-w * 0.36, -h * 0.42);
    ctx.lineTo(w * 0.36, -h * 0.42);
    ctx.lineTo(w * 0.42, 6);
    ctx.lineTo(w * 0.3, 12);
    ctx.lineTo(-w * 0.3, 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(cop ? BLU : mix(col, [20, 16, 28], 0.45), 0.95);
    ctx.beginPath();
    ctx.moveTo(-w * 0.28, -h * 0.4);
    ctx.lineTo(-w * 0.22, -h * 0.72);
    ctx.lineTo(w * 0.22, -h * 0.72);
    ctx.lineTo(w * 0.28, -h * 0.4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(mix([40, 70, 90], WHT, 0.35), 0.7);
    ctx.fillRect(-w * 0.2, -h * 0.68, w * 0.4, h * 0.22);

    const blink = ((G.t * 8) | 0) % 2;
    ctx.fillStyle = rgba(cop ? (blink ? CYN : MAG) : RED, 0.95);
    ctx.fillRect(-w * 0.38, -h * 0.18, w * 0.14, h * 0.1);
    ctx.fillStyle = rgba(cop ? (blink ? MAG : CYN) : RED, 0.95);
    ctx.fillRect(w * 0.24, -h * 0.18, w * 0.14, h * 0.1);

    if (cop) {
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.fillRect(-w * 0.16, -h * 0.86, w * 0.32, h * 0.14);
      ctx.fillStyle = rgba(blink ? CYN : MAG, 0.95);
      ctx.fillRect(-w * 0.14, -h * 0.84, w * 0.13, h * 0.1);
      ctx.fillStyle = rgba(blink ? MAG : CYN, 0.95);
      ctx.fillRect(w * 0.01, -h * 0.84, w * 0.13, h * 0.1);
      ctx.fillStyle = rgba(BLU, 1);
      ctx.fillRect(-w * 0.34, -h * 0.08, w * 0.68, h * 0.08);
      ctx.fillStyle = '#1a1018';
      ctx.font = 'bold ' + Math.max(7, h * 0.12) + 'px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('警', 0, -h * 0.04);
    }

    if (turbo) {
      ctx.fillStyle = rgba(SUN, 0.9);
      ctx.beginPath();
      ctx.moveTo(-w * 0.16, 12);
      ctx.lineTo(-w * 0.08, 12 + h * 0.42);
      ctx.lineTo(0, 12);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(w * 0.08, 12 + h * 0.42);
      ctx.lineTo(w * 0.16, 12);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.moveTo(-w * 0.08, 12);
      ctx.lineTo(0, 12 + h * 0.28);
      ctx.lineTo(w * 0.08, 12);
      ctx.fill();
    }

    if (smoke) {
      ctx.fillStyle = rgba([90, 90, 98], 0.45);
      ctx.beginPath();
      ctx.arc(-w * 0.12, -h * 0.9, w * 0.16, 0, TAU);
      ctx.arc(w * 0.1, -h * 1.02, w * 0.2, 0, TAU);
      ctx.fill();
    }
    if (fire) {
      ctx.fillStyle = rgba(SUN, 0.9);
      ctx.beginPath();
      ctx.moveTo(-w * 0.1, -h * 0.7);
      ctx.lineTo(0, -h * 1.15);
      ctx.lineTo(w * 0.1, -h * 0.7);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.moveTo(-w * 0.05, -h * 0.7);
      ctx.lineTo(0, -h * 0.98);
      ctx.lineTo(w * 0.05, -h * 0.7);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawWorldCar(c, p, clip, isTgt) {
    const destW = (isTgt ? 520 : 460) * p.s * CX * 0.00115;
    const destH = destW * 0.72;
    const x = p.x + c.offset * p.w;
    const y0 = p.y;
    if (clipSprite(y0 - destH, destH, clip) <= 2 || destW < 2) return { x: x, y: y0, w: destW, h: destH, ok: false };
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VW, clip);
    ctx.clip();
    ctx.translate(x, y0);
    const dmg = isTgt ? wound01() : 0;
    drawRearCar(c.col, destW, destH, {
      cop: false,
      dmg: dmg,
      fire: isTgt && (target.hp <= 1 || target.stopping),
      smoke: isTgt && (target.hp <= 2 || target.stopping),
      turbo: false,
      wob: isTgt ? Math.sin(G.t * 24) * destW * 0.04 * target.wob : Math.sin(c.wob || 0) * destW * 0.03
    });
    if (isTgt) {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.font = 'bold ' + Math.max(9, destH * 0.22) + 'px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('▼ 目标', 0, -destH * 1.15);
    }
    ctx.restore();
    return { x: x, y: y0, w: destW, h: destH, ok: true };
  }

  function drawPlayer() {
    const lean = G.steerVis;
    const hop = G.crashT > 0 ? Math.abs(Math.sin(G.crashT * 18)) * 10 * Math.min(1, G.crashT) : 0;
    const squat = clamp(G.spd / maxSpd(), 0, 1) * 4;
    const x = CX + lean * 42;
    const y = VH - 26 - hop + squat;
    const spd01 = clamp(G.spd / maxSpd(), 0, 1);

    if (spd01 > 0.45 && !REDUCE && (Math.abs(lean) > 0.1 || G.turboOn)) {
      for (let i = 3; i >= 1; i--) {
        ctx.save();
        ctx.globalAlpha = (0.08 + (G.turboOn ? 0.1 : 0)) * (i / 3) * spd01;
        ctx.translate(x - lean * 22 * i, y + 4 * i);
        drawRearCar(COP, 86, 54, { cop: true, turbo: false });
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean * 0.08);
    drawRearCar(COP, 92, 58, {
      cop: true,
      turbo: G.turboOn,
      wob: G.crashT > 0 ? Math.sin(G.crashT * 22) * 6 : 0
    });
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
    const tci = Math.floor(target.z / SEG) - base.i;

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
          drawWorldCar(c, {
            x: lerp(p1.x, p2.x, u),
            y: lerp(p1.y, p2.y, u),
            w: lerp(p1.w, p2.w, u),
            s: lerp(p1.s, p2.s, u)
          }, seg.clip, false);
        }
      }
      if (tci === n) {
        const u = clamp((target.z - seg.z1) / SEG, 0, 1);
        drawWorldCar(target, {
          x: lerp(p1.x, p2.x, u),
          y: lerp(p1.y, p2.y, u),
          w: lerp(p1.w, p2.w, u),
          s: lerp(p1.s, p2.s, u)
        }, seg.clip, true);
      }
    }
  }

  function drawSmear() {
    const spd01 = clamp(G.spd / maxSpd(), 0, 1);
    if (spd01 < 0.4 || REDUCE) return;
    const vpX = CX - G.x * 28 + G.steerVis * 18;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(G.turboOn ? SUN : CYN, 0.05 + spd01 * 0.08);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(vpX, HORIZON + 8);
      ctx.lineTo((i / 10) * VW + G.steerVis * 24, VH);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(MAG, 0.04 + spd01 * 0.07);
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(vpX + 8, HORIZON + 10);
      ctx.lineTo((i / 6) * VW + G.steerVis * 36, VH);
      ctx.stroke();
    }
    ctx.restore();
    for (let i = 0; i < smears.length; i++) {
      const s = smears[i];
      ctx.strokeStyle = rgba(WHT, s.a);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + s.lean * 12, s.y + s.len);
      ctx.stroke();
    }
  }

  function drawHudCanvas() {
    const spd01 = clamp(G.spd / maxSpd(), 0, 1.22);
    ctx.save();
    ctx.translate(VW - 86, VH - 70);
    ctx.strokeStyle = rgba(SUN, 0.35);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 34, Math.PI * 0.75, Math.PI * 2.25);
    ctx.stroke();
    ctx.strokeStyle = rgba(G.turboOn || spd01 > 0.9 ? MAG : GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(0, 0, 34, Math.PI * 0.75, Math.PI * 0.75 + clamp(spd01, 0, 1) * Math.PI * 1.5);
    ctx.stroke();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.font = 'bold 13px "Segoe UI",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(G.kmh | 0), 0, 4);
    ctx.font = '9px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillStyle = rgba(SUN, 0.8);
    ctx.fillText('km/h', 0, 16);
    ctx.restore();

    ctx.save();
    ctx.translate(78, VH - 78);
    ctx.fillStyle = 'rgba(10,4,8,0.55)';
    ctx.strokeStyle = rgba(SUN, 0.4);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-36, -48, 72, 72, 8) : ctx.rect(-36, -48, 72, 72);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.fillRect(-3, 10, 6, 8);
    const pz = G.z + PLAYER_Z;
    const gap = clamp((target.z - pz) / 14000, -0.2, 1);
    const ox = clamp((target.offset - G.x) * 28, -28, 28);
    const oy = 8 - gap * 48;
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(ox, oy, 4.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.55);
    ctx.font = '8px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('雷达', 0, -36);
    ctx.restore();

    if (G.mode === 'play' && G.time < 10) {
      ctx.fillStyle = rgba(MAG, 0.12 + Math.sin(G.t * 10) * 0.06);
      ctx.fillRect(0, 0, VW, 8);
      ctx.fillRect(0, VH - 8, VW, 8);
    }

    if (G.mode === 'play' && (G.turboOn || target.near)) {
      const a = 0.1 + Math.sin(G.t * 14) * 0.06;
      ctx.fillStyle = rgba(MAG, a);
      ctx.fillRect(0, 0, 10, VH);
      ctx.fillStyle = rgba(CYN, a);
      ctx.fillRect(VW - 10, 0, 10, VH);
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

    const roll = REDUCE ? 0 : G.steerVis * 0.06;
    ctx.save();
    ctx.translate(CX, HORIZON + 48);
    ctx.rotate(roll);
    ctx.translate(-CX, -(HORIZON + 48));

    if (segs.length) {
      drawSky(pal);
      drawMountains(pal);
      drawRoad();
      drawSmear();
      drawPlayer();
    }
    ctx.restore();

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
    if (G.mode === 'title') startGame('chase');
    else startGame(G.kind || 'chase');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('chase');
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
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      if (down) inputSrc = 'key';
    }
    if (k === ' ' || k === 'Spacebar' || e.code === 'Space') {
      if (G.mode === 'play' && !overlayOpen()) keys.t = down;
      else if (!down) keys.t = false;
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
      startGame('chase');
      return;
    }
    if (k === '2') {
      startGame('night');
      return;
    }
    if (k === 'Enter') {
      if (overlayOpen()) primaryAction();
    }
    if (k === ' ' || k === 'Spacebar' || e.code === 'Space') {
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

  if (btnChase) {
    btnChase.addEventListener('click', function () {
      audio.ensure();
      startGame('chase');
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
      startGame(G.kind || 'chase');
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
    btnTurbo.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      audio.ensure();
      keys.t = true;
      inputSrc = 'key';
    });
    btnTurbo.addEventListener('pointerup', function () { keys.t = false; });
    btnTurbo.addEventListener('pointerleave', function () { keys.t = false; });
    btnTurbo.addEventListener('pointercancel', function () { keys.t = false; });
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
      keys.t = false;
      pointer.down = false;
    }
  });

  requestAnimationFrame(frame);
})();
