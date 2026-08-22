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
  const BEST_KEY = 'playbox-out-run-best';
  const MUTE_KEY = 'playbox-out-run-mute';
  const OPS = '← → / A D 转向 · ↑ W 油门 · ↓ S 刹车 · 点按加速 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const SUN = [255, 138, 50];
  const COR = [255, 90, 60];
  const WHT = [255, 244, 234];
  const PNK = [255, 154, 212];

  const GRAPH = {
    coconut: { name: '椰湾', theme: 'beach', seed: 11, left: 'cliff', right: 'shore', goal: false },
    cliff: { name: '断崖', theme: 'canyon', seed: 22, left: 'gorge', right: 'suburb', goal: false },
    shore: { name: '湾岸', theme: 'beach', seed: 33, left: 'suburb', right: 'light', goal: false },
    gorge: { name: '石谷', theme: 'canyon', seed: 44, left: 'sunset', right: 'neon', goal: false },
    suburb: { name: '城郊', theme: 'city', seed: 55, left: 'neon', right: 'harbor', goal: false },
    light: { name: '灯塔', theme: 'beach', seed: 66, left: 'harbor', right: 'star', goal: false },
    sunset: { name: '落日', theme: 'beach', seed: 77, goal: true },
    neon: { name: '霓虹', theme: 'city', seed: 88, goal: true },
    harbor: { name: '夜港', theme: 'city', seed: 99, goal: true },
    star: { name: '星湾', theme: 'beach', seed: 111, goal: true }
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

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: CX, y: VH * 0.7, id: null };
  const particles = [];
  const floats = [];
  const smears = [];
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
    route: ['椰湾'],
    t: 0,
    clock: 0,
    z: 0,
    x: 0,
    spd: 0,
    steerVis: 0,
    score: 0,
    best: { h: 0, n: 0 },
    time: 54,
    timeCap: 54,
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
  function isNight() {
    return G.kind === 'night';
  }
  function maxSpd() {
    return isNight() ? 14600 : 11200;
  }
  function accel() {
    return maxSpd() / 3.05;
  }
  function brake() {
    return -maxSpd() / 1.35;
  }
  function coast() {
    return -maxSpd() / 6.4;
  }
  function offDecel() {
    return -maxSpd() / 1.8;
  }
  function startTime() {
    return isNight() ? 38 : 54;
  }
  function gateTime() {
    return isNight() ? 13 : 18;
  }
  function def() {
    return GRAPH[G.stage] || GRAPH.coconut;
  }
  function kindBest() {
    return isNight() ? G.best.n : G.best.h;
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

  function buildStage(id) {
    const st = GRAPH[id] || GRAPH.coconut;
    G.stage = st === GRAPH[id] ? id : 'coconut';
    segs.length = 0;
    cars.length = 0;
    const night = isNight();
    const target = night ? 1080 : 1200;
    const hillAmp = st.theme === 'canyon' ? 1480 : st.theme === 'city' ? 260 : 780;
    const curveAmp = (night ? 7.4 : 5.9) * (st.theme === 'city' ? 0.72 : st.theme === 'canyon' ? 1.08 : 1);

    addRoad(18, 36, 18, 0, 0);
    let k = 0;
    while (segs.length < target - 150) {
      const h = hash2(st.seed * 13 + k * 3);
      const h2 = hash2(st.seed * 17 + k * 5 + 2);
      const h3 = hash2(st.seed * 19 + k * 7 + 4);
      let curve = (h - 0.5) * 2 * curveAmp;
      if (h > 0.82) curve = 0;
      const hill = lastY() + (h2 - 0.46) * hillAmp;
      const enter = 16 + (h3 * 24) | 0;
      const hold = 22 + (hash2(k + 41 + st.seed) * 58) | 0;
      const leave = 14 + (hash2(k + 43 + st.seed) * 24) | 0;
      addRoad(enter, hold, leave, curve, hill);
      k += 1;
    }
    addRoad(22, 48, 18, 0, lastY() * 0.22);
    addRoad(12, 36, 10, 0, 0);

    const forkStart = segs.length - 108;
    if (!st.goal) {
      for (let i = forkStart; i < segs.length; i++) {
        const t = (i - forkStart) / 108;
        segs[i].fork = 1;
        segs[i].split = t < 0.2
          ? easeIn(0, 0.28, t / 0.2)
          : easeInOut(0.28, 1, Math.min(1, (t - 0.2) / 0.52));
      }
    } else {
      for (let i = segs.length - 48; i < segs.length; i++) segs[i].fork = 2;
    }

    G.trackLen = segs.length * SEG;
    G.gateZ = (segs.length - 16) * SEG;
    G.gated = false;
    placeSprites(st, night);
    placeCars(st, night);
  }

  function placeSprites(st, night) {
    const theme = st.theme;
    const step = theme === 'city' ? 3 : 4;
    for (let i = 8; i < segs.length - 20; i += step) {
      if (segs[i].fork) continue;
      const r = hash2(st.seed * 91 + i * 17);
      const side = hash2(st.seed + i * 3) > 0.5 ? 1 : -1;
      const dist = 1.18 + hash2(i + 9) * 1.6;
      if (theme === 'beach') {
        if (r > 0.22) addSprite(i, -dist - 0.15, 'palm', 920 + (r * 280) | 0, 260);
        if (r > 0.38) addSprite(i, dist + 0.1, r > 0.78 ? 'rock' : 'palm', r > 0.78 ? 280 : 860, r > 0.78 ? 240 : 240);
        if ((i % 22) === 0) addSprite(i, side * (1.05), 'post', 420, 70);
      } else if (theme === 'canyon') {
        if (r > 0.18) addSprite(i, -dist, r > 0.7 ? 'cliff' : 'rock', r > 0.7 ? 1100 : 340, r > 0.7 ? 520 : 300);
        if (r > 0.3) addSprite(i, dist + 0.05, r > 0.62 ? 'cactus' : 'rock', r > 0.62 ? 520 : 300, 180);
      } else {
        if (r > 0.12) addSprite(i, -dist - 0.2, 'build', 980 + (r * 900) | 0, 420 + (r * 280) | 0);
        if (r > 0.28) addSprite(i, dist + 0.25, 'build', 860 + (hash2(i) * 800) | 0, 380);
        if ((i % 6) === 0) addSprite(i, side * 1.12, 'lamp', 640, 70);
      }
      if (night && (i % 10) === 0) addSprite(i, side * 1.08, 'lamp', 640, 70);
    }
    const gate = segs.length - 16;
    addSprite(gate, -1.05, 'pillar', 1400, 160);
    addSprite(gate, 1.05, 'pillar', 1400, 160);
    addSprite(gate, 0, st.goal ? 'goal' : 'check', 520, 900);
    if (!st.goal) {
      const L = GRAPH[st.left];
      const R = GRAPH[st.right];
      addSprite(segs.length - 70, -1.35, 'bill', 520, 420, L ? L.name : '左');
      addSprite(segs.length - 70, 1.35, 'bill', 520, 420, R ? R.name : '右');
    }
  }

  function placeCars(st, night) {
    const n = night ? 16 : 12;
    const max = maxSpd();
    for (let i = 0; i < n; i++) {
      const z = (80 + i * ((segs.length - 200) / n) + hash2(st.seed + i) * 40) * SEG;
      if (z > G.trackLen - 24000) continue;
      cars.push({
        z: z,
        offset: (hash2(st.seed * 3 + i) - 0.5) * 1.35,
        spd: max * (0.32 + hash2(i + 8) * 0.38),
        col: carColor(hash2(st.seed + i * 19)),
        passed: false,
        wob: hash2(i + 4) * TAU
      });
    }
  }

  function carColor(h) {
    if (h < 0.2) return [255, 70, 90];
    if (h < 0.4) return [80, 170, 255];
    if (h < 0.55) return [255, 210, 70];
    if (h < 0.7) return [70, 220, 140];
    if (h < 0.85) return [220, 90, 255];
    return [250, 250, 255];
  }

  function palette() {
    const theme = def().theme;
    const night = isNight() || theme === 'city';
    if (theme === 'canyon') {
      return {
        skyTop: night ? [18, 6, 14] : [42, 12, 20],
        skyMid: night ? [80, 18, 28] : [180, 48, 32],
        skyHor: night ? [160, 50, 40] : [255, 140, 64],
        fog: night ? [80, 24, 28] : [255, 150, 80],
        lg: [120, 48, 32], lg2: [96, 36, 24],
        rg: [140, 58, 34], rg2: [110, 42, 26],
        road: [46, 36, 38], road2: [56, 44, 46],
        rumble: [255, 170, 50], rumble2: [40, 24, 20],
        lane: [255, 210, 120],
        sun: [255, 170, 70],
        mtn1: [70, 22, 20], mtn2: [48, 16, 16],
        sea: false
      };
    }
    if (theme === 'city') {
      return {
        skyTop: [6, 4, 18],
        skyMid: [22, 12, 48],
        skyHor: [70, 24, 80],
        fog: [30, 16, 48],
        lg: [22, 20, 32], lg2: [16, 14, 24],
        rg: [24, 22, 34], rg2: [18, 16, 26],
        road: [28, 26, 36], road2: [36, 34, 46],
        rumble: [0, 240, 255], rumble2: [255, 61, 184],
        lane: [200, 220, 255],
        sun: [255, 230, 180],
        mtn1: [18, 12, 36], mtn2: [12, 8, 28],
        sea: false
      };
    }
    return {
      skyTop: night ? [10, 6, 28] : [22, 8, 40],
      skyMid: night ? [48, 16, 64] : [210, 52, 58],
      skyHor: night ? [90, 40, 80] : [255, 158, 72],
      fog: night ? [40, 20, 50] : [255, 148, 88],
      lg: night ? [8, 50, 80] : [14, 102, 138],
      lg2: night ? [10, 64, 96] : [18, 122, 156],
      rg: night ? [90, 64, 36] : [198, 148, 62],
      rg2: night ? [70, 48, 28] : [168, 122, 48],
      road: [44, 40, 50], road2: [54, 48, 60],
      rumble: [255, 92, 40], rumble2: [248, 236, 220],
      lane: [255, 220, 140],
      sun: [255, 208, 86],
      mtn1: night ? [28, 14, 36] : [62, 28, 48],
      mtn2: night ? [18, 10, 28] : [40, 18, 32],
      sea: true
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
      o2.type = 'triangle';
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 720;
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
      const f = 52 + spd01 * 118 + Math.sin(G.t * 26) * (2 + spd01 * 7);
      this.eng.frequency.setTargetAtTime(f, t, 0.045);
      this.eng2.frequency.setTargetAtTime(f * 2.02, t, 0.045);
      this.engF.frequency.setTargetAtTime(380 + spd01 * 980, t, 0.08);
      this.engG.gain.setTargetAtTime(this.muted ? 0 : (0.03 + spd01 * 0.06), t, 0.06);
    },
    radio(freq) {
      this.beep(freq, 0.11, 'triangle', 0.045);
      this.beep(freq * 0.5, 0.14, 'square', 0.02);
    },
    sting() {
      this.beep(392, 0.09, 'square', 0.07, 784);
      this.beep(523, 0.12, 'triangle', 0.05);
      this.beep(784, 0.16, 'square', 0.04);
    },
    check() {
      this.beep(523, 0.1, 'square', 0.08);
      this.beep(659, 0.12, 'triangle', 0.07);
      this.beep(784, 0.18, 'square', 0.06, 1046);
    },
    crash() {
      this.noise(0.22, 0.22, 280);
      this.beep(140, 0.2, 'sawtooth', 0.1, 50);
    },
    overtake(n) {
      const f = 420 + Math.min(8, n) * 55;
      this.beep(f, 0.08, 'square', 0.06, f * 1.7);
      this.beep(f * 0.5, 0.1, 'triangle', 0.03);
    },
    gear() {
      this.beep(180, 0.05, 'square', 0.04, 420);
    },
    warn() {
      this.beep(880, 0.08, 'square', 0.07);
      this.beep(660, 0.1, 'square', 0.05);
    },
    win() {
      this.beep(523, 0.12, 'square', 0.08);
      this.beep(659, 0.14, 'triangle', 0.07);
      this.beep(784, 0.18, 'square', 0.07);
      this.beep(1046, 0.28, 'triangle', 0.06);
    },
    lose() {
      this.beep(220, 0.28, 'sawtooth', 0.08, 80);
      this.noise(0.18, 0.1, 400);
    }
  };

  const RIFF = [523, 0, 659, 784, 659, 0, 523, 392, 440, 523, 0, 659, 784, 880, 784, 0];

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
    ovKicker.textContent = kind === 'win' ? 'GOAL' : kind === 'lose' ? 'TIME UP' : 'OUTRUN';
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
      stageLabel.textContent = def().name + ' · ' + G.depth + '/4';
      stageLabel.classList.toggle('hot', def().goal);
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
    else if (G.mode === 'lose') setHint('R 重开 · 撞车只会减速，超时才结束', 'warn');
    else if (G.time < 10) setHint('时间将尽 · 冲过终点门加时', 'warn');
    else if (findSeg(G.z + PLAYER_Z).fork === 1) setHint('分叉 · 靠左或靠右选下一段', 'hot');
    else setHint('← → 转向 · ↑ 油门 · 超车连击 · R 重开', '');
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'coast';
    G.stage = 'coconut';
    G.route = ['椰湾'];
    G.depth = 1;
    G.score = 0;
    G.time = startTime();
    G.timeCap = G.time;
    G.z = 0;
    G.x = 0;
    G.spd = maxSpd() * 0.55;
    G.crashT = 0;
    G.ending = '';
    G.combo = 0;
    G.flowN = 0;
    G.gated = false;
    buildStage('coconut');
    showOverlay('title', '疾驶', '敞篷后视，分叉选路。赶在时间耗尽前冲过终点门。');
    hud();
  }

  function startGame(kind) {
    audio.ensure();
    G.kind = kind === 'night' ? 'night' : 'coast';
    G.mode = 'play';
    G.stage = 'coconut';
    G.route = ['椰湾'];
    G.depth = 1;
    G.score = 0;
    G.time = startTime();
    G.timeCap = G.time;
    G.z = 40;
    G.x = 0;
    G.spd = maxSpd() * 0.28;
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
    G.flash = 0.35;
    G.flashRgb = SUN;
    G.stop = 0;
    G.shake = 0;
    particles.length = 0;
    floats.length = 0;
    buildStage('coconut');
    hideOverlay();
    audio.sting();
    toast(isNight() ? '夜奔 · 更快更紧' : '海岸 · 分叉选路', false, true);
    hud();
  }

  function onOvertake(car) {
    G.combo += 1;
    G.comboT = 2.2;
    const n = 90 * G.combo;
    bumpScore(n);
    floatText(CX + car.offset * 80, VH * 0.62, '超车 ×' + G.combo, GOLD);
    audio.overtake(G.combo);
    if (G.combo >= 3) {
      hitStop(0.04);
      kick(3);
      screenFlash(CYN, 0.22);
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
      x: CX + car.offset * 90, y: VH * 0.7, j: 16,
      vx0: -80, vx1: 80, vy0: -40, vy1: 80,
      r0: 1.5, r1: 3.5, life: 0.35, rgb: car.col
    });
  }

  function crashInto(car) {
    if (G.crashT > 0.15) return;
    G.crashT = 1.18;
    G.bounce = 1;
    G.spd *= 0.36;
    const dir = G.x >= car.offset ? 1 : -1;
    G.x += dir * 0.22;
    G.combo = 0;
    G.flowN = 0;
    G.flow = 0;
    audio.crash();
    hitStop(0.07);
    kick(7.5);
    screenFlash(MAG, 0.55);
    emit(28, {
      x: CX, y: VH - 70, j: 28,
      vx0: -220, vx1: 220, vy0: -180, vy1: 40,
      r0: 2, r1: 5.5, life: 0.5, rgb: COR
    });
    emit(12, {
      x: CX, y: VH - 70, j: 10,
      vx0: -80, vx1: 80, vy0: -120, vy1: -20,
      r0: 1, r1: 2.4, life: 0.32, rgb: GOLD
    });
    toast('擦碰 · 减速复原', true, false);
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
    const next = G.x < 0 ? st.left : st.right;
    const nxt = GRAPH[next];
    const add = gateTime();
    G.time += add;
    G.timeCap = Math.max(G.timeCap, G.time);
    const bonus = 700 + ((G.time * 6) | 0) + G.combo * 40;
    bumpScore(bonus);
    G.route.push(nxt ? nxt.name : next);
    G.depth += 1;
    G.stage = next;
    G.z = 30;
    G.x = G.x < 0 ? -0.45 : 0.45;
    G.gated = false;
    buildStage(next);
    audio.check();
    hitStop(0.055);
    kick(4.5);
    screenFlash(GOLD, 0.62);
    floatText(CX, VH * 0.42, '+' + add + '″', GOLD);
    toast((nxt ? nxt.name : next) + '  ·  +' + add + '″', false, true);
    emit(24, {
      x: CX, y: HORIZON + 40, j: 80,
      vx0: -140, vx1: 140, vy0: -60, vy1: 90,
      r0: 2, r1: 4.5, life: 0.55, rgb: GOLD
    });
    hud();
  }

  function finish(why) {
    if (G.mode !== 'play') return;
    G.ending = '';
    if (why === 'win') {
      const bonus = 2400 + ((G.time * 70) | 0);
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
      showOverlay('lose', '时间到', '冲到 ' + def().name + '　·　' + (G.score | 0) + ' 分。撞车不会出局，超时才会。');
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
        c.z = Math.min(maxz, pz + 2800 + rand(0, 4200));
        c.offset = rand(-0.7, 0.7);
        c.passed = false;
        c.col = carColor(Math.random());
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
      p.t = (p.t || p.life);
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
      G.kmh = (G.spd / maxSpd()) * (isNight() ? 320 : 260);
      return;
    }

    if (demo) autoDemo(dt);

    const seg = findSeg(G.z + PLAYER_Z);
    const speedPct = clamp(G.spd / maxSpd(), 0, 1);
    const dx = dt * (isNight() ? 2.4 : 2.08) * Math.max(0.22, speedPct);

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
    const max = maxSpd();
    if (G.crashT > 0) {
      G.spd += accel() * 0.22 * dt;
    } else if (!demo && keys.d) {
      G.spd += brake() * dt;
    } else if (gas) {
      G.spd += accel() * dt;
    } else {
      G.spd += coast() * dt;
    }

    G.off = !onRoadX(G.x, seg.split);
    if (G.off && G.spd > max * 0.42) G.spd += offDecel() * dt;
    if (G.off && playing && (Math.random() < 0.35)) {
      emit(1, {
        x: CX + G.steerVis * 20, y: VH - 36, j: 10,
        vx0: -40, vx1: 40, vy0: -10, vy1: 30,
        r0: 1, r1: 2.2, life: 0.22, rgb: def().theme === 'beach' ? [180, 150, 80] : [90, 70, 50]
      });
    }
    G.spd = clamp(G.spd, 0, max);
    G.z += G.spd * dt;
    if (G.z < 0) G.z = 0;

    const kmhMax = isNight() ? 320 : 260;
    G.kmh = speedPct * kmhMax;

    const gear = speedPct < 0.22 ? 1 : speedPct < 0.48 ? 2 : speedPct < 0.74 ? 3 : 4;
    if (gear > G.gear && playing) audio.gear();
    G.gear = gear;

    if (playing && speedPct > 0.82 && !G.off && G.crashT <= 0) {
      G.flow += dt;
      if (G.flow >= 0.72) {
        G.flow = 0;
        G.flowN += 1;
        bumpScore(28 + G.flowN * 6);
        if (G.flowN === 4) toast('疾风', false, true);
        if (G.flowN === 8) toast('爆走', false, true);
        if (G.flowN === 12) toast('极速', false, true);
      }
    } else {
      G.flow = 0;
      if (G.crashT > 0 || G.off) G.flowN = 0;
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

    if (playing) {
      G.score += G.spd * dt * 0.012;
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

    const night = isNight() || def().theme === 'city';
    if (night) {
      for (let i = 0; i < 36; i++) {
        const hx = hash2(i * 19 + 3);
        const hy = hash2(i * 23 + 7);
        ctx.fillStyle = rgba(WHT, 0.25 + hash2(i) * 0.5);
        ctx.fillRect((hx * VW + G.curveMem * 2) % VW, hy * (HORIZON - 8), 1.4, 1.4);
      }
    }

    const sunX = CX + 180 - G.x * 14 - G.curveMem * 8;
    const sunY = HORIZON * (night ? 0.42 : 0.55);
    const sunR = night ? 14 : 22;
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

    if (pal.sea) {
      ctx.fillStyle = rgba(mix(pal.lg, pal.skyHor, 0.35), 1);
      ctx.fillRect(0, HORIZON, VW * 0.46, 16);
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
    const night = isNight() || def().theme === 'city';
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
    } else if (spr.k === 'rock') {
      ctx.fillStyle = rgba(mix([90, 70, 62], pal.fog, 0.2), 1);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, y + h);
      ctx.lineTo(x - w * 0.2, y + h * 0.2);
      ctx.lineTo(x + w * 0.15, y);
      ctx.lineTo(x + w * 0.5, y + h);
      ctx.fill();
    } else if (spr.k === 'cactus') {
      ctx.fillStyle = rgba([40, 130, 70], 1);
      ctx.fillRect(x - w * 0.12, y, w * 0.24, h);
      ctx.fillRect(x - w * 0.42, y + h * 0.3, w * 0.3, w * 0.16);
      ctx.fillRect(x + w * 0.12, y + h * 0.22, w * 0.28, w * 0.16);
    } else if (spr.k === 'cliff') {
      ctx.fillStyle = rgba([110, 42, 28], 1);
      ctx.fillRect(x - w * 0.5, y, w, h);
      ctx.fillStyle = rgba([160, 70, 40], 0.5);
      ctx.fillRect(x - w * 0.2, y + h * 0.1, w * 0.2, h * 0.8);
    } else if (spr.k === 'build') {
      ctx.fillStyle = rgba(night ? [18, 14, 36] : [40, 32, 52], 1);
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
      ctx.fillStyle = rgba(CYN, 0.85);
      ctx.beginPath();
      ctx.arc(x, y + h * 0.12, Math.max(2, w * 0.28), 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.12);
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
    } else if (spr.k === 'bill') {
      ctx.fillStyle = rgba([20, 12, 24], 0.9);
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
    const destW = 620 * p.s * CX * 0.00115;
    const destH = destW * 0.62;
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
    ctx.ellipse(x + wob, y0 - destH * 0.08, destW * 0.46, destH * 0.12, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(c.col, 1);
    ctx.beginPath();
    ctx.moveTo(x - destW * 0.46 + wob, y + destH);
    ctx.lineTo(x - destW * 0.38 + wob, y + destH * 0.38);
    ctx.lineTo(x - destW * 0.18 + wob, y + destH * 0.22);
    ctx.lineTo(x + destW * 0.18 + wob, y + destH * 0.22);
    ctx.lineTo(x + destW * 0.38 + wob, y + destH * 0.38);
    ctx.lineTo(x + destW * 0.46 + wob, y + destH);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.45);
    ctx.fillRect(x - destW * 0.2 + wob, y + destH * 0.28, destW * 0.4, destH * 0.16);
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.fillRect(x - destW * 0.34 + wob, y + destH * 0.72, destW * 0.14, destH * 0.12);
    ctx.fillRect(x + destW * 0.2 + wob, y + destH * 0.72, destW * 0.14, destH * 0.12);
    ctx.fillStyle = '#1a1218';
    ctx.fillRect(x - destW * 0.4 + wob, y + destH * 0.82, destW * 0.16, destH * 0.14);
    ctx.fillRect(x + destW * 0.24 + wob, y + destH * 0.82, destW * 0.16, destH * 0.14);
    ctx.restore();
  }

  function drawPlayer() {
    const steer = G.steerVis;
    const hop = G.crashT > 0 ? Math.abs(Math.sin(G.crashT * 16.5)) * 13 * Math.min(1, G.crashT) : 0;
    const squat = (G.spd / maxSpd()) * 4;
    const x = CX + steer * 42;
    const y = VH - 30 - hop + squat;
    const lean = steer * 0.2 + (G.crashT > 0 ? Math.sin(G.crashT * 19) * 0.24 * G.crashT : 0);
    const spd01 = clamp(G.spd / maxSpd(), 0, 1);

    if (spd01 > 0.5 && !REDUCE) {
      for (let i = 3; i >= 1; i--) {
        const k = i / 3;
        ctx.globalAlpha = 0.1 * spd01 * k;
        ctx.fillStyle = rgba(COR, 1);
        ctx.beginPath();
        const gx = x - steer * 18 * i;
        const gy = y + 6 * i;
        ctx.ellipse(gx, gy, 46 + i * 8, 10, lean, 0, TAU);
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
    ctx.ellipse(0, 18, 54, 10, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#141018';
    ctx.fillRect(-48, 8, 18, 12);
    ctx.fillRect(30, 8, 18, 12);
    ctx.fillStyle = '#2a2430';
    ctx.beginPath();
    ctx.ellipse(-38, 12, 12, 8, 0, 0, TAU);
    ctx.ellipse(38, 12, 12, 8, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(COR, 1);
    ctx.beginPath();
    ctx.moveTo(-52, 10);
    ctx.lineTo(-40, -6);
    ctx.lineTo(-16, -14);
    ctx.lineTo(16, -14);
    ctx.lineTo(40, -6);
    ctx.lineTo(52, 10);
    ctx.lineTo(40, 16);
    ctx.lineTo(-40, 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(SUN, 0.95);
    ctx.beginPath();
    ctx.moveTo(-36, 4);
    ctx.lineTo(-22, -8);
    ctx.lineTo(22, -8);
    ctx.lineTo(36, 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(CYN, 0.55);
    ctx.beginPath();
    ctx.moveTo(-20, -8);
    ctx.lineTo(-12, -22);
    ctx.lineTo(12, -22);
    ctx.lineTo(20, -8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba([40, 24, 28], 1);
    ctx.fillRect(-14, -10, 8, 10);
    ctx.fillRect(6, -10, 8, 10);
    ctx.fillStyle = rgba(PNK, 0.9);
    ctx.beginPath();
    ctx.arc(-10, -14, 4.2, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(MAG, 1);
    ctx.fillRect(-34, 8, 14, 6);
    ctx.fillRect(20, 8, 14, 6);
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.fillRect(-30, 9, 6, 4);
    ctx.fillRect(24, 9, 6, 4);

    ctx.fillStyle = rgba(GOLD, 0.7);
    ctx.fillRect(-8, 12, 16, 3);

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
    ctx.strokeStyle = 'rgba(10,6,16,0.65)';
    ctx.lineWidth = 4;
    ctx.textAlign = 'left';
    ctx.strokeText('◀ ' + (L ? L.name : '左'), 28, HORIZON + 36);
    ctx.fillText('◀ ' + (L ? L.name : '左'), 28, HORIZON + 36);
    ctx.textAlign = 'right';
    ctx.strokeText((R ? R.name : '右') + ' ▶', VW - 28, HORIZON + 36);
    ctx.fillText((R ? R.name : '右') + ' ▶', VW - 28, HORIZON + 36);
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
      startGame('coast');
      return;
    }
    if (k === '2') {
      startGame('night');
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
