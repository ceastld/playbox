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
  const BEST_KEY = 'playbox-hang-on-best';
  const MUTE_KEY = 'playbox-hang-on-mute';
  const OPS = '← → / A D 压弯 · ↑ W 油门 · ↓ S 刹车 · 点按加速 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 136];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const SUN = [255, 90, 32];
  const COR = [255, 58, 50];
  const WHT = [255, 244, 234];
  const PNK = [255, 154, 196];
  const RED = [255, 42, 48];

  const STAGES = [
    { name: '旷原', theme: 'savanna', seed: 11 },
    { name: '海崖', theme: 'coast', seed: 27 },
    { name: '城环', theme: 'city', seed: 43 },
    { name: '终夜', theme: 'night', seed: 61, goal: true }
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
  const btnCourse = document.getElementById('btn-course');
  const btnRain = document.getElementById('btn-rain');
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

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: CX, y: VH * 0.7, id: null };
  const particles = [];
  const floats = [];
  const smears = [];
  const rainDrops = [];
  const segs = [];
  const bikes = [];

  const dummy = {
    i: 0, y1: 0, y2: 0, z1: 0, z2: SEG, curve: 0,
    sprites: null,
    p1: { x: CX, y: VH, w: 0, s: 0, z: 1 },
    p2: { x: CX, y: VH, w: 0, s: 0, z: 1 },
    clip: VH
  };

  const G = {
    mode: 'title',
    kind: 'course',
    stageI: 0,
    t: 0,
    clock: 0,
    z: 0,
    x: 0,
    spd: 0,
    lean: 0,
    steerVis: 0,
    score: 0,
    best: { c: 0, r: 0 },
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
    kmh: 0
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
  function isRain() {
    return G.kind === 'rain';
  }
  function def() {
    return STAGES[G.stageI] || STAGES[0];
  }
  function maxSpd() {
    return isRain() ? 14200 : 10800;
  }
  function accel() {
    return maxSpd() / (isRain() ? 2.85 : 3.15);
  }
  function brake() {
    return -maxSpd() / (isRain() ? 1.15 : 1.4);
  }
  function coast() {
    return -maxSpd() / 6.2;
  }
  function offDecel() {
    return -maxSpd() / (isRain() ? 1.35 : 1.7);
  }
  function startTime() {
    return isRain() ? 36 : 50;
  }
  function gateTime() {
    return isRain() ? 12 : 16;
  }
  function kindBest() {
    return isRain() ? G.best.r : G.best.c;
  }
  function kmhMax() {
    return isRain() ? 340 : 270;
  }
  function centrif() {
    return isRain() ? 0.78 : 0.48;
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
    bikes.length = 0;
    const rain = isRain();
    const target = rain ? 760 : 920;
    const hillAmp = st.theme === 'city' ? 240 : st.theme === 'night' ? 380 : st.theme === 'coast' ? 720 : 860;
    const curveAmp = (rain ? 7.6 : 5.6) * (1 + G.stageI * 0.12) * (st.theme === 'city' ? 0.82 : 1);

    addRoad(20, 40, 18, 0, 0);
    let k = 0;
    while (segs.length < target - 140) {
      const h = hash2(st.seed * 13 + k * 3);
      const h2 = hash2(st.seed * 17 + k * 5 + 2);
      const h3 = hash2(st.seed * 19 + k * 7 + 4);
      let curve = (h - 0.5) * 2 * curveAmp;
      if (h > 0.84) curve = 0;
      if (h < 0.12) curve *= 1.35;
      const hill = lastY() + (h2 - 0.46) * hillAmp;
      const enter = 14 + (h3 * 22) | 0;
      const hold = 20 + (hash2(k + 41 + st.seed) * 52) | 0;
      const leave = 12 + (hash2(k + 43 + st.seed) * 22) | 0;
      addRoad(enter, hold, leave, curve, hill);
      k += 1;
    }
    addRoad(20, 44, 16, 0, lastY() * 0.18);
    addRoad(10, 28, 8, 0, 0);

    G.trackLen = segs.length * SEG;
    G.gateZ = (segs.length - 14) * SEG;
    G.gated = false;
    placeSprites(st, rain);
    placeBikes(st, rain);
  }

  function placeSprites(st, rain) {
    const theme = st.theme;
    const step = theme === 'city' || theme === 'night' ? 3 : 4;
    for (let i = 8; i < segs.length - 18; i += step) {
      const r = hash2(st.seed * 91 + i * 17);
      const side = hash2(st.seed + i * 3) > 0.5 ? 1 : -1;
      const dist = 1.18 + hash2(i + 9) * 1.55;
      if (theme === 'savanna') {
        if (r > 0.2) addSprite(i, -dist - 0.1, 'acacia', 780 + (r * 260) | 0, 420);
        if (r > 0.4) addSprite(i, dist + 0.08, r > 0.78 ? 'rock' : 'acacia', r > 0.78 ? 260 : 720, r > 0.78 ? 220 : 380);
        if ((i % 18) === 0) addSprite(i, side * 1.06, 'post', 380, 64);
      } else if (theme === 'coast') {
        if (r > 0.22) addSprite(i, -dist - 0.12, 'palm', 900 + (r * 260) | 0, 250);
        if (r > 0.36) addSprite(i, dist + 0.1, r > 0.74 ? 'rock' : 'palm', r > 0.74 ? 280 : 840, r > 0.74 ? 230 : 240);
        if ((i % 20) === 0) addSprite(i, side * 1.05, 'post', 400, 68);
      } else {
        if (r > 0.12) addSprite(i, -dist - 0.18, 'build', 960 + (r * 880) | 0, 400 + (r * 260) | 0);
        if (r > 0.28) addSprite(i, dist + 0.22, 'build', 840 + (hash2(i) * 760) | 0, 360);
        if ((i % 6) === 0) addSprite(i, side * 1.1, 'lamp', 640, 70);
      }
      if ((rain || theme === 'night') && (i % 8) === 0) addSprite(i, side * 1.08, 'lamp', 640, 70);
    }
    const gate = segs.length - 14;
    addSprite(gate, -1.05, 'pillar', 1400, 160);
    addSprite(gate, 1.05, 'pillar', 1400, 160);
    addSprite(gate, 0, st.goal ? 'goal' : 'check', 520, 900);
  }

  function placeBikes(st, rain) {
    const n = rain ? 15 : 11;
    const max = maxSpd();
    for (let i = 0; i < n; i++) {
      const z = (70 + i * ((segs.length - 180) / n) + hash2(st.seed + i) * 36) * SEG;
      if (z > G.trackLen - 22000) continue;
      bikes.push({
        z: z,
        offset: (hash2(st.seed * 3 + i) - 0.5) * 1.22,
        spd: max * (0.3 + hash2(i + 8) * 0.4),
        col: bikeColor(hash2(st.seed + i * 19)),
        passed: false,
        wob: hash2(i + 4) * TAU,
        near: false
      });
    }
  }

  function bikeColor(h) {
    if (h < 0.16) return [70, 210, 255];
    if (h < 0.32) return [255, 210, 70];
    if (h < 0.48) return [80, 230, 140];
    if (h < 0.64) return [220, 90, 255];
    if (h < 0.8) return [250, 250, 255];
    return [255, 120, 70];
  }

  function palette() {
    const theme = def().theme;
    const rain = isRain();
    const night = rain || theme === 'night' || theme === 'city';
    if (theme === 'savanna' && !rain) {
      return {
        skyTop: [28, 8, 16],
        skyMid: [186, 58, 36],
        skyHor: [255, 148, 58],
        fog: [255, 150, 80],
        lg: [150, 92, 32], lg2: [128, 78, 26],
        rg: [162, 98, 34], rg2: [138, 82, 28],
        road: [48, 38, 40], road2: [58, 46, 48],
        rumble: [255, 90, 32], rumble2: [248, 236, 220],
        lane: [255, 214, 130],
        sun: [255, 196, 72],
        mtn1: [78, 28, 24], mtn2: [52, 18, 18],
        sea: false
      };
    }
    if (theme === 'coast' && !rain) {
      return {
        skyTop: [18, 8, 36],
        skyMid: [70, 28, 78],
        skyHor: [255, 132, 72],
        fog: [255, 140, 90],
        lg: [14, 96, 132], lg2: [18, 114, 148],
        rg: [188, 132, 52], rg2: [158, 108, 40],
        road: [44, 40, 50], road2: [54, 48, 60],
        rumble: [255, 92, 40], rumble2: [248, 236, 220],
        lane: [255, 220, 140],
        sun: [255, 200, 80],
        mtn1: [52, 24, 44], mtn2: [34, 16, 30],
        sea: true
      };
    }
    if (theme === 'city' && !rain) {
      return {
        skyTop: [8, 4, 16],
        skyMid: [28, 12, 42],
        skyHor: [78, 24, 64],
        fog: [36, 16, 42],
        lg: [24, 18, 30], lg2: [18, 14, 24],
        rg: [26, 20, 32], rg2: [20, 16, 26],
        road: [30, 26, 36], road2: [38, 34, 46],
        rumble: [0, 240, 255], rumble2: [255, 61, 136],
        lane: [200, 220, 255],
        sun: [255, 220, 170],
        mtn1: [18, 10, 30], mtn2: [12, 8, 22],
        sea: false
      };
    }
    return {
      skyTop: [6, 4, 16],
      skyMid: night && theme === 'night' ? [18, 10, 42] : [22, 12, 40],
      skyHor: rain ? [48, 22, 62] : [70, 24, 72],
      fog: rain ? [28, 16, 40] : [32, 16, 44],
      lg: rain ? [10, 36, 52] : [16, 18, 30],
      lg2: rain ? [8, 28, 42] : [12, 14, 24],
      rg: rain ? [12, 32, 48] : [20, 18, 30],
      rg2: rain ? [10, 24, 38] : [14, 14, 24],
      road: rain ? [26, 28, 40] : [28, 26, 36],
      road2: rain ? [34, 36, 50] : [36, 34, 46],
      rumble: rain ? [0, 220, 255] : [255, 90, 32],
      rumble2: rain ? [255, 61, 136] : [240, 230, 220],
      lane: rain ? [180, 230, 255] : [255, 214, 140],
      sun: rain ? [180, 210, 255] : [255, 210, 150],
      mtn1: [16, 10, 28], mtn2: [10, 8, 20],
      sea: theme === 'coast'
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
    tickEngine(spd01, on) {
      if (!this.engG || !this.ctx) return;
      const t = this.ctx.currentTime;
      if (!on) {
        this.engG.gain.setTargetAtTime(0, t, 0.08);
        return;
      }
      const pulse = Math.sin(G.t * (18 + spd01 * 22)) * (3 + spd01 * 10);
      const f = 68 + spd01 * 168 + pulse;
      this.eng.frequency.setTargetAtTime(f, t, 0.04);
      this.eng2.frequency.setTargetAtTime(f * 0.5, t, 0.04);
      this.eng3.frequency.setTargetAtTime(f * 2.04, t, 0.04);
      this.engF.frequency.setTargetAtTime(420 + spd01 * 1400, t, 0.07);
      const crashMul = G.crashT > 0 ? 0.35 : 1;
      this.engG.gain.setTargetAtTime(this.muted ? 0 : (0.028 + spd01 * 0.07) * crashMul, t, 0.05);
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
    overtake(n) {
      const f = 440 + Math.min(8, n) * 58;
      this.beep(f, 0.08, 'square', 0.065, f * 1.75);
      this.beep(f * 0.5, 0.1, 'triangle', 0.03);
    },
    near() {
      this.beep(980, 0.045, 'square', 0.04, 1320);
    },
    gear() {
      this.beep(210, 0.045, 'square', 0.045, 480);
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

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'win' ? 'GOAL' : kind === 'lose' ? 'TIME UP' : 'HANGON';
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
        G.best.r = o.r | 0;
      } else {
        const n = parseInt(raw, 10);
        if (n > 0) G.best.c = n;
      }
    } catch (err) { /* ignore */ }
  }

  function maybeBest() {
    const k = isRain() ? 'r' : 'c';
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
      stageLabel.textContent = def().name + ' · ' + (G.stageI + 1) + '/4';
      stageLabel.classList.toggle('hot', !!def().goal);
    }
    if (tagLabel) {
      tagLabel.textContent = isRain() ? '雨夜' : '赛道';
      tagLabel.classList.toggle('rain', isRain());
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
    else if (G.mode === 'win') setHint('R 再冲 · 四段冲线', 'hot');
    else if (G.mode === 'lose') setHint('R 重开 · 摔车只会减速，超时才结束', 'warn');
    else if (G.time < 10) setHint('时间将尽 · 冲过检查点加时', 'warn');
    else if (G.crashT > 0.4) setHint('复原中 · 油门起来再压弯', 'warn');
    else setHint('← → 压弯过弯 · ↑ 油门 · 别摔 · R 重开', '');
  }

  function resetRunVars() {
    G.z = 40;
    G.x = 0;
    G.lean = 0;
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
    G.gated = false;
    particles.length = 0;
    floats.length = 0;
    smears.length = 0;
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'course';
    G.stageI = 0;
    G.score = 0;
    G.time = startTime();
    G.timeCap = G.time;
    resetRunVars();
    G.z = 0;
    G.spd = maxSpd() * 0.58;
    buildStage();
    showOverlay('title', '摩托', '后视摩托，压弯过弯。别摔，赶检查点加时冲线。');
    hud();
  }

  function startGame(kind) {
    audio.ensure();
    G.kind = kind === 'rain' ? 'rain' : 'course';
    G.mode = 'play';
    G.stageI = 0;
    G.score = 0;
    G.time = startTime();
    G.timeCap = G.time;
    resetRunVars();
    G.spd = maxSpd() * 0.26;
    G.flash = 0.38;
    G.flashRgb = isRain() ? CYN : SUN;
    G.stop = 0;
    G.shake = 0;
    buildStage();
    hideOverlay();
    audio.sting();
    toast(isRain() ? '雨夜 · 路滑更快' : '赛道 · 压弯过弯', false, true);
    hud();
  }

  function onOvertake(bike) {
    G.combo += 1;
    G.comboT = 2.15;
    const n = 85 * G.combo;
    bumpScore(n);
    floatText(CX + bike.offset * 80, VH * 0.6, '超车 ×' + G.combo, GOLD);
    audio.overtake(G.combo);
    if (G.combo >= 3) {
      hitStop(0.038);
      kick(3);
      screenFlash(CYN, 0.2);
    }
    if (G.combo === 3) toast('连超 ×3', false, true);
    if (G.combo === 6) toast('连超 ×6 · 爆走', false, true);
    if (G.combo === 10) toast('连超 ×10 · 无人能及', false, true);
    if (comboEl) {
      comboEl.classList.remove('hot');
      void comboEl.offsetWidth;
      comboEl.classList.add('hot');
      comboTok += 1;
    }
    emit(10, {
      x: CX + bike.offset * 90, y: VH * 0.68, j: 14,
      vx0: -90, vx1: 90, vy0: -50, vy1: 70,
      r0: 1.4, r1: 3.2, life: 0.32, rgb: bike.col
    });
  }

  function crash(kind, other) {
    if (G.crashT > 0.18) return;
    G.crashT = 1.62;
    G.bounce = 1;
    G.spd *= kind === 'off' ? 0.18 : 0.16;
    if (other) {
      const dir = G.x >= other.offset ? 1 : -1;
      G.x += dir * 0.28;
    } else {
      G.x = clamp(G.x * 0.55, -0.85, 0.85);
    }
    G.combo = 0;
    G.flowN = 0;
    G.flow = 0;
    audio.crash();
    hitStop(0.065);
    kick(8);
    screenFlash(MAG, 0.58);
    emit(32, {
      x: CX, y: VH - 64, j: 32,
      vx0: -260, vx1: 260, vy0: -210, vy1: 50,
      r0: 2, r1: 6, life: 0.55, rgb: COR
    });
    emit(14, {
      x: CX, y: VH - 70, j: 12,
      vx0: -90, vx1: 90, vy0: -160, vy1: -20,
      r0: 1, r1: 2.6, life: 0.36, rgb: GOLD
    });
    if (kind === 'off') {
      emit(16, {
        x: CX + G.lean * 30, y: VH - 40, j: 22,
        vx0: -70, vx1: 70, vy0: -40, vy1: 40,
        r0: 1.5, r1: 3.4, life: 0.4, rgb: isRain() ? [80, 110, 140] : [140, 110, 60]
      });
      toast('冲出 · 摔车复原', true, false);
    } else {
      toast('撞车 · 减速复原', true, false);
    }
  }

  function passGate() {
    const st = def();
    if (st.goal) {
      finish('win');
      return;
    }
    const add = gateTime();
    G.time += add;
    G.timeCap = Math.max(G.timeCap, G.time);
    const bonus = 650 + ((G.time * 7) | 0) + G.combo * 40;
    bumpScore(bonus);
    G.stageI += 1;
    G.z = 36;
    G.x = clamp(G.x, -0.55, 0.55);
    G.gated = false;
    buildStage();
    audio.check();
    hitStop(0.05);
    kick(4.4);
    screenFlash(GOLD, 0.6);
    floatText(CX, VH * 0.4, '+' + add + '″', GOLD);
    toast(def().name + '  ·  +' + add + '″', false, true);
    emit(26, {
      x: CX, y: HORIZON + 40, j: 90,
      vx0: -150, vx1: 150, vy0: -70, vy1: 90,
      r0: 2, r1: 4.6, life: 0.55, rgb: GOLD
    });
    hud();
  }

  function finish(why) {
    if (G.mode !== 'play') return;
    G.ending = '';
    if (why === 'win') {
      const bonus = 2200 + ((G.time * 75) | 0);
      bumpScore(bonus);
      maybeBest();
      G.mode = 'win';
      audio.win();
      hitStop(0.08);
      screenFlash(GOLD, 0.7);
      showOverlay('win', '冲线', (isRain() ? '雨夜' : '赛道') + ' 四段到齐　·　' + (G.score | 0) + ' 分');
    } else {
      maybeBest();
      G.mode = 'lose';
      audio.lose();
      kick(6);
      showOverlay('lose', '时间到', '冲到 ' + def().name + '　·　' + (G.score | 0) + ' 分。摔车不会出局，超时才会。');
    }
    hud();
  }

  function updateBikes(dt) {
    const pz = G.z + PLAYER_Z;
    const maxz = G.gateZ - 1600;
    for (let i = 0; i < bikes.length; i++) {
      const c = bikes[i];
      c.z += c.spd * dt;
      c.wob += dt * 2.2;
      if (!c.passed && pz > c.z + 40 && pz - c.z < 680) {
        c.passed = true;
        if (G.mode === 'play' && G.crashT <= 0) onOvertake(c);
      }
      const dz = Math.abs(c.z - pz);
      const dx = Math.abs(c.offset - G.x);
      if (G.mode === 'play' && G.crashT <= 0 && G.ending === '') {
        if (dz < 190 && dx < 0.27) {
          crash('bike', c);
        } else if (dz < 240 && dx < 0.42 && !c.near) {
          c.near = true;
          audio.near();
          emit(6, {
            x: CX + (c.offset - G.x) * 90, y: VH - 80, j: 8,
            vx0: -40, vx1: 40, vy0: -30, vy1: 40,
            r0: 1, r1: 2.2, life: 0.22, rgb: CYN
          });
        }
      }
      if (c.z < pz - 1500) {
        c.z = Math.min(maxz, pz + 2600 + rand(0, 4000));
        c.offset = rand(-0.72, 0.72);
        c.passed = false;
        c.near = false;
        c.col = bikeColor(Math.random());
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
    if (isRain()) {
      if (!rainDrops.length) {
        for (let i = 0; i < 70; i++) {
          rainDrops.push({
            x: rand(0, VW),
            y: rand(0, VH),
            len: rand(10, 26),
            v: rand(820, 1480),
            a: rand(0.18, 0.45)
          });
        }
      }
      for (let i = 0; i < rainDrops.length; i++) {
        const d = rainDrops[i];
        d.y += d.v * dt;
        d.x += (G.lean * 90 + 18) * dt;
        if (d.y > VH + 8) {
          d.y = rand(-30, HORIZON * 0.4);
          d.x = rand(-20, VW + 20);
        }
      }
    } else if (rainDrops.length) {
      rainDrops.length = 0;
    }
  }

  function autoDemo(dt) {
    const seg = findSeg(G.z + PLAYER_Z);
    const want = clamp(-seg.curve * 0.16, -0.82, 0.82);
    G.lean = lerp(G.lean, want, 1 - Math.pow(0.01, dt));
    G.x += (want * 0.62 - G.x) * 2.4 * dt;
    G.x = clamp(G.x, -0.85, 0.85);
    G.spd = lerp(G.spd, maxSpd() * 0.64, 1 - Math.pow(0.08, dt));
    if (G.z + PLAYER_Z > G.gateZ - 500) {
      G.z = 80;
      G.x = 0;
      G.lean = 0;
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    const playing = G.mode === 'play' && !G.ending;
    const demo = G.mode === 'title';
    const spd01 = clamp(G.spd / maxSpd(), 0, 1);
    audio.tickEngine(spd01, (playing || demo) && G.spd > 40);

    if (G.stop > 0) {
      G.stop -= dt;
      updateJuice(dt * 0.35);
      return;
    }

    updateJuice(dt);

    if (G.mode === 'win' || G.mode === 'lose') {
      G.spd = Math.max(0, G.spd - maxSpd() * 0.62 * dt);
      G.z += G.spd * dt;
      G.kmh = (G.spd / maxSpd()) * kmhMax();
      G.lean = lerp(G.lean, 0, 1 - Math.pow(0.02, dt));
      return;
    }

    if (demo) autoDemo(dt);

    const seg = findSeg(G.z + PLAYER_Z);
    const dx = dt * (isRain() ? 2.5 : 2.12) * Math.max(0.22, spd01);

    let steer = 0;
    if (!demo) {
      if (keys.l) steer -= 1;
      if (keys.r) steer += 1;
      if (inputSrc === 'ptr' && pointer.down) {
        const tx = (pointer.x - CX) / (CX * 0.68);
        steer = clamp(tx * 1.4, -1, 1);
      }
      if (G.crashT > 0) steer *= 0.28;
    }

    if (!demo) {
      const leanPow = isRain() ? 0.022 : 0.00055;
      G.lean = lerp(G.lean, steer, 1 - Math.pow(leanPow, dt));
      G.x += G.lean * dx * (G.off ? 0.62 : 1) * (isRain() ? 0.86 : 1);
      G.x -= dx * spd01 * seg.curve * centrif();
    }
    if (G.crashT > 0) G.x += (0 - G.x) * 2.2 * dt;
    G.x = clamp(G.x, -2.18, 2.18);
    G.steerVis = lerp(G.steerVis, G.lean, 1 - Math.pow(0.0008, dt));
    G.curveMem = lerp(G.curveMem, seg.curve * spd01, 1 - Math.pow(0.04, dt));

    const gas = keys.u || (pointer.down && inputSrc === 'ptr');
    const max = maxSpd();
    if (!demo) {
      if (G.crashT > 0) {
        G.spd += accel() * 0.2 * dt;
      } else if (keys.d) {
        G.spd += brake() * dt;
      } else if (gas) {
        G.spd += accel() * dt;
      } else {
        G.spd += coast() * dt;
      }
    }

    G.off = Math.abs(G.x) > 1.08;
    if (G.off && G.spd > max * 0.38) G.spd += offDecel() * dt;
    if (G.off && playing && Math.random() < 0.4) {
      emit(1, {
        x: CX + G.lean * 22, y: VH - 34, j: 10,
        vx0: -50, vx1: 50, vy0: -12, vy1: 28,
        r0: 1, r1: 2.3, life: 0.22, rgb: isRain() ? [90, 110, 130] : [170, 130, 70]
      });
    }
    G.spd = clamp(G.spd, 0, max);
    G.z += G.spd * dt;
    if (G.z < 0) G.z = 0;

    G.kmh = clamp(G.spd / max, 0, 1) * kmhMax();

    const gear = spd01 < 0.2 ? 1 : spd01 < 0.46 ? 2 : spd01 < 0.72 ? 3 : 4;
    if (gear > G.gear && playing) audio.gear();
    G.gear = gear;

    if (playing && G.crashT <= 0) {
      if (G.off && spd01 > 0.4) crash('off');
      else if (Math.abs(G.x) > 1.52) crash('off');
    }

    if (playing && spd01 > 0.82 && !G.off && G.crashT <= 0) {
      G.flow += dt;
      if (G.flow >= 0.7) {
        G.flow = 0;
        G.flowN += 1;
        bumpScore(26 + G.flowN * 6);
        if (G.flowN === 4) toast('疾风', false, true);
        if (G.flowN === 8) toast('爆走', false, true);
        if (G.flowN === 12) toast('极速', false, true);
      }
    } else {
      G.flow = 0;
      if (G.crashT > 0 || G.off) G.flowN = 0;
    }

    if (spd01 > 0.5 && !REDUCE) {
      if (smears.length < 20 && Math.random() < 0.55) {
        smears.push({
          x: rand(0, VW),
          y: rand(HORIZON + 8, VH),
          len: rand(16, 72) * spd01,
          a: rand(0.08, 0.24) * spd01,
          v: 860 + spd01 * 1500,
          lean: G.lean
        });
      }
    }
    for (let i = smears.length - 1; i >= 0; i--) {
      smears[i].y += smears[i].v * dt * 0.26;
      smears[i].x += smears[i].lean * 140 * dt;
      smears[i].a -= dt * 0.72;
      if (smears[i].a <= 0 || smears[i].y > VH + 10) smears.splice(i, 1);
    }

    if (spd01 > 0.55 && playing && G.crashT <= 0 && Math.random() < 0.18) {
      emit(1, {
        x: CX - G.lean * 18 + rand(-8, 8), y: VH - 28, j: 4,
        vx0: -20, vx1: 20, vy0: 10, vy1: 40,
        r0: 1, r1: 2, life: 0.18, rgb: [255, 180, 80]
      });
    }

    updateBikes(dt);

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

    if (playing) {
      G.score += G.spd * dt * 0.013;
    }

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

    const night = isRain() || def().theme === 'city' || def().theme === 'night';
    if (night) {
      for (let i = 0; i < 38; i++) {
        const hx = hash2(i * 19 + 3);
        const hy = hash2(i * 23 + 7);
        ctx.fillStyle = rgba(WHT, 0.22 + hash2(i) * 0.5);
        ctx.fillRect((hx * VW + G.curveMem * 2) % VW, hy * (HORIZON - 8), 1.4, 1.4);
      }
    }

    const sunX = CX + 176 - G.x * 14 - G.curveMem * 8;
    const sunY = HORIZON * (night ? 0.4 : 0.54);
    const sunR = night ? 12 : 22;
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
      ctx.fillRect(0, HORIZON, VW * 0.48, 16);
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
    if (isRain() && !alt) {
      const sh = mix(WHT, pal.fog, 0.7);
      quad(x1 - w1 * 0.12, p1.y, x1 + w1 * 0.12, p1.y, x2 + w2 * 0.12, p2.y, x2 - w2 * 0.12, p2.y, sh, 0.12);
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
    const night = isRain() || def().theme === 'city' || def().theme === 'night';
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VW, clip);
    ctx.clip();

    if (spr.k === 'acacia') {
      ctx.fillStyle = rgba([86, 52, 28], 1);
      ctx.fillRect(x - w * 0.05, y + h * 0.42, w * 0.1, h * 0.58);
      ctx.fillStyle = rgba(night ? [28, 70, 42] : [48, 128, 52], 1);
      ctx.beginPath();
      ctx.ellipse(x, y + h * 0.38, w * 0.48, h * 0.16, 0, 0, TAU);
      ctx.fill();
    } else if (spr.k === 'palm') {
      ctx.fillStyle = rgba([92, 52, 28], 1);
      ctx.fillRect(x - w * 0.08, y + h * 0.28, w * 0.16, h * 0.72);
      ctx.fillStyle = rgba(night ? [20, 90, 80] : [36, 150, 92], 1);
      ctx.beginPath();
      ctx.moveTo(x, y + h * 0.38);
      ctx.quadraticCurveTo(x - w * 0.7, y + h * 0.1, x - w * 0.15, y + h * 0.22);
      ctx.quadraticCurveTo(x + w * 0.75, y, x + w * 0.12, y + h * 0.24);
      ctx.quadraticCurveTo(x - w * 0.1, y - h * 0.05, x, y + h * 0.3);
      ctx.fill();
    } else if (spr.k === 'rock') {
      ctx.fillStyle = rgba(mix([90, 70, 62], pal.fog, 0.2), 1);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, y + h);
      ctx.lineTo(x - w * 0.2, y + h * 0.2);
      ctx.lineTo(x + w * 0.15, y);
      ctx.lineTo(x + w * 0.5, y + h);
      ctx.fill();
    } else if (spr.k === 'build') {
      ctx.fillStyle = rgba(night ? [16, 12, 32] : [40, 32, 52], 1);
      ctx.fillRect(x - w * 0.5, y, w, h);
      const rows = 5;
      const cols = 3;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const on = hash2(spr.h + r * 9 + c * 3 + (p.x | 0)) > 0.35;
          ctx.fillStyle = rgba(on ? (c & 1 ? GOLD : CYN) : [20, 16, 28], on ? 0.85 : 0.4);
          ctx.fillRect(
            x - w * 0.38 + c * w * 0.28,
            y + h * 0.1 + r * h * 0.16,
            w * 0.14,
            h * 0.1
          );
        }
      }
    } else if (spr.k === 'lamp') {
      ctx.fillStyle = rgba([40, 40, 48], 1);
      ctx.fillRect(x - w * 0.08, y + h * 0.15, w * 0.16, h * 0.85);
      ctx.fillStyle = rgba(isRain() ? CYN : GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(x, y + h * 0.12, Math.max(2, w * 0.28), 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(isRain() ? CYN : GOLD, 0.12);
      ctx.beginPath();
      ctx.arc(x, y + h * 0.12, w * 1.1, 0, TAU);
      ctx.fill();
    } else if (spr.k === 'post') {
      ctx.fillStyle = rgba([70, 50, 40], 1);
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
    }
    ctx.restore();
  }

  function drawTrafficBike(c, p, clip) {
    const destW = 420 * p.s * CX * 0.00115;
    const destH = destW * 1.15;
    const x = p.x + c.offset * p.w;
    const y0 = p.y;
    if (clipSprite(y0 - destH, destH, clip) <= 2 || destW < 2) return;
    const y = y0 - destH;
    const wob = Math.sin(c.wob) * destW * 0.04;
    const lean = Math.sin(c.wob * 0.6) * 0.12;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VW, clip);
    ctx.clip();
    ctx.translate(x + wob, y0);
    ctx.rotate(lean);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, -destH * 0.06, destW * 0.42, destH * 0.1, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#141018';
    ctx.beginPath();
    ctx.ellipse(0, -destH * 0.12, destW * 0.28, destH * 0.1, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(c.col, 1);
    ctx.beginPath();
    ctx.moveTo(-destW * 0.22, -destH * 0.16);
    ctx.lineTo(-destW * 0.12, -destH * 0.55);
    ctx.lineTo(destW * 0.12, -destH * 0.55);
    ctx.lineTo(destW * 0.22, -destH * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(mix(c.col, WHT, 0.25), 1);
    ctx.fillRect(-destW * 0.08, -destH * 0.72, destW * 0.16, destH * 0.22);
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.arc(0, -destH * 0.82, destW * 0.11, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(c.col, 0.85);
    ctx.fillRect(-destW * 0.2, -destH * 0.22, destW * 0.08, destH * 0.08);
    ctx.fillRect(destW * 0.12, -destH * 0.22, destW * 0.08, destH * 0.08);
    ctx.restore();
  }

  function drawMotoBody(leanAmt, crashSpin, scaleY) {
    ctx.save();
    ctx.rotate(leanAmt + crashSpin);
    ctx.scale(1, scaleY);

    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 46, 9, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#121016';
    ctx.beginPath();
    ctx.ellipse(0, 10, 28, 11, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2a2430';
    ctx.beginPath();
    ctx.ellipse(0, 10, 18, 7, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(RED, 1);
    ctx.beginPath();
    ctx.moveTo(-18, 6);
    ctx.lineTo(-14, -18);
    ctx.lineTo(14, -18);
    ctx.lineTo(18, 6);
    ctx.lineTo(10, 12);
    ctx.lineTo(-10, 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(SUN, 0.95);
    ctx.beginPath();
    ctx.moveTo(-10, 2);
    ctx.lineTo(-7, -14);
    ctx.lineTo(7, -14);
    ctx.lineTo(10, 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(COR, 1);
    ctx.fillRect(-16, -8, 8, 16);
    ctx.fillRect(8, -8, 8, 16);

    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.arc(-1 + leanAmt * 4, -28, 8.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(RED, 1);
    ctx.fillRect(-5 + leanAmt * 4, -32, 8, 4);

    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillRect(-8, 4, 16, 6);
    ctx.fillStyle = '#1a1014';
    ctx.font = 'bold 7px "Segoe UI",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H', 0, 7);

    ctx.fillStyle = rgba(CYN, 0.7);
    ctx.fillRect(-22, 2, 7, 4);
    ctx.fillRect(15, 2, 7, 4);

    ctx.fillStyle = '#1a1218';
    ctx.fillRect(-26, -2, 10, 3);
    ctx.fillRect(16, -2, 10, 3);

    ctx.restore();
  }

  function drawPlayer() {
    const lean = G.steerVis;
    const hop = G.crashT > 0 ? Math.abs(Math.sin(G.crashT * 17)) * 16 * Math.min(1, G.crashT) : 0;
    const squat = (G.spd / maxSpd()) * 5;
    const x = CX + lean * 48;
    const y = VH - 28 - hop + squat;
    const spd01 = clamp(G.spd / maxSpd(), 0, 1);
    const crashSpin = G.crashT > 0 ? Math.sin(G.crashT * 21) * 0.85 * Math.min(1, G.crashT) : 0;

    if (spd01 > 0.42 && !REDUCE && Math.abs(lean) > 0.08) {
      for (let i = 4; i >= 1; i--) {
        const k = i / 4;
        ctx.save();
        ctx.globalAlpha = (0.07 + Math.abs(lean) * 0.16) * k * spd01;
        ctx.translate(x - lean * 26 * i, y + 5 * i);
        drawMotoBody(lean * 0.9, 0, 1);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    if (G.crashT > 0.2) {
      ctx.save();
      ctx.translate(x + Math.sin(G.crashT * 14) * 28, y - 10);
      ctx.rotate(G.crashT * 9);
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.arc(0, -18, 7, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(RED, 1);
      ctx.fillRect(-8, -10, 16, 20);
      ctx.restore();
    }

    ctx.save();
    ctx.translate(x, y);
    drawMotoBody(lean * 0.38 + crashSpin * 0.35, crashSpin, 1 - hop * 0.008);
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

    const bikeOn = [];
    for (let i = 0; i < bikes.length; i++) {
      const ci = Math.floor(bikes[i].z / SEG) - base.i;
      if (ci >= 0 && ci < nDraw) {
        if (!bikeOn[ci]) bikeOn[ci] = [];
        bikeOn[ci].push(bikes[i]);
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
      if (bikeOn[n]) {
        for (let k = 0; k < bikeOn[n].length; k++) {
          const c = bikeOn[n][k];
          const u = clamp((c.z - seg.z1) / SEG, 0, 1);
          drawTrafficBike(c, {
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
    if (spd01 < 0.42 || REDUCE) return;
    const vpX = CX - G.x * 28 + G.lean * 18;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(CYN, 0.045 + spd01 * 0.08);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(vpX, HORIZON + 8);
      ctx.lineTo((i / 10) * VW + G.lean * 24, VH);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(MAG, 0.04 + spd01 * 0.07);
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(vpX + 8, HORIZON + 10);
      ctx.lineTo((i / 6) * VW + G.lean * 36, VH);
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

  function drawRain() {
    if (!isRain() || !rainDrops.length) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(180,220,255,0.28)';
    ctx.lineWidth = 1.15;
    for (let i = 0; i < rainDrops.length; i++) {
      const d = rainDrops[i];
      ctx.globalAlpha = d.a;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + 3 + G.lean * 6, d.y + d.len);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawHudCanvas() {
    const spd01 = clamp(G.spd / maxSpd(), 0, 1);
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

    ctx.save();
    ctx.translate(70, VH - 36);
    ctx.fillStyle = rgba(WHT, 0.18);
    ctx.fillRect(-40, -4, 80, 8);
    ctx.fillStyle = rgba(Math.abs(G.lean) > 0.7 ? MAG : CYN, 0.85);
    ctx.fillRect(-2 + G.lean * 36, -7, 4, 14);
    ctx.fillStyle = rgba(SUN, 0.55);
    ctx.fillRect(-1, -8, 2, 16);
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

    const roll = REDUCE ? 0 : G.lean * (isRain() ? 0.11 : 0.08);
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

    drawRain();
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
    if (G.mode === 'title') startGame('course');
    else startGame(G.kind || 'course');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('course');
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
      startGame('course');
      return;
    }
    if (k === '2') {
      startGame('rain');
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

  if (btnCourse) {
    btnCourse.addEventListener('click', function () {
      audio.ensure();
      startGame('course');
    });
  }
  if (btnRain) {
    btnRain.addEventListener('click', function () {
      audio.ensure();
      startGame('rain');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'course');
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
