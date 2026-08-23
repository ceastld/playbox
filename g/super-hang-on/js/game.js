'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const CX = VW * 0.5;
  const HORIZON = VH * 0.33;
  const SEG = 200;
  const ROAD_W = 2100;
  const CAM_H = 1050;
  const CAM_D = 0.88;
  const PLAYER_Z = CAM_H * CAM_D;
  const DRAW = 186;
  const RUMBLE = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.85;
  const BEST_KEY = 'playbox-super-hang-on-best';
  const MUTE_KEY = 'playbox-super-hang-on-mute';
  const OPS = '方向 / WASD 压弯 · 空格 / ↑ 油门 · Shift / Z 涡轮 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 136];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 138, 184];
  const WHT = [255, 240, 246];
  const RED = [255, 48, 86];
  const PNK = [255, 154, 196];

  const STAGES = [
    { name: '非原', theme: 'africa', seed: 19, pack: '砂狼团', bossHp: 3, bossHpD: 4 },
    { name: '亚霓', theme: 'asia', seed: 37, pack: '霓骑团', bossHp: 3, bossHpD: 5 },
    { name: '欧极', theme: 'europe', seed: 71, pack: '悬王团', bossHp: 4, bossHpD: 6, goal: true }
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
  let comboTok = 0;

  const keys = { l: false, r: false, u: false, d: false, t: false };
  const pointer = { down: false, hover: false, x: CX, y: VH * 0.7, id: null };
  const particles = [];
  const floats = [];
  const smears = [];
  const rings = [];
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
    kind: 'core',
    stageI: 0,
    t: 0,
    clock: 0,
    z: 0,
    x: 0,
    spd: 0,
    lean: 0,
    steerVis: 0,
    score: 0,
    best: { c: 0, m: 0 },
    time: 46,
    timeCap: 46,
    combo: 0,
    comboT: 0,
    comboMax: 0,
    mult: 1,
    flow: 0,
    flowN: 0,
    gear: 1,
    turbo: 1,
    turboOn: false,
    turboHold: false,
    trackLen: 0,
    gateZ: 0,
    gated: false,
    bossOn: false,
    bossDead: false,
    packNeed: 0,
    packDown: 0,
    crashT: 0,
    bounce: 0,
    off: false,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: MAG,
    punch: 1,
    ending: '',
    endT: 0,
    why: '',
    curveMem: 0,
    kmh: 0,
    emptyT: 0
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
    return STAGES[G.stageI] || STAGES[0];
  }
  function lastStage() {
    return G.stageI >= STAGES.length - 1;
  }
  function kindBest() {
    return isDense() ? G.best.m : G.best.c;
  }
  function modeName() {
    return isDense() ? '悬核' : '超悬';
  }
  function maxSpd() {
    const turbo = G.turboOn ? 1.38 : 1;
    return (isDense() ? 12800 : 10200) * turbo;
  }
  function baseMax() {
    return isDense() ? 12800 : 10200;
  }
  function accel() {
    const boost = G.turboOn ? 1.55 : 1;
    return baseMax() / (isDense() ? 2.55 : 2.95) * boost;
  }
  function brake() {
    return -baseMax() / (isDense() ? 1.12 : 1.35);
  }
  function coast() {
    return -baseMax() / (G.turboOn ? 8.4 : 6.1);
  }
  function offDecel() {
    return -baseMax() / (isDense() ? 1.2 : 1.55);
  }
  function startTime() {
    return isDense() ? 34 : 46;
  }
  function gateTime() {
    return isDense() ? 11 : 15;
  }
  function kmhMax() {
    return G.turboOn ? (isDense() ? 364 : 324) : (isDense() ? 300 : 280);
  }
  function centrif() {
    return (isDense() ? 0.72 : 0.52) * (G.turboOn ? 1.22 : 1);
  }
  function turboDrain() {
    return isDense() ? 0.48 : 0.34;
  }
  function turboFill() {
    return isDense() ? 0.16 : 0.22;
  }
  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
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
    const dense = isDense();
    const target = dense ? 740 : 900;
    const hillAmp = st.theme === 'asia' ? 280 : st.theme === 'europe' ? 620 : 780;
    const curveAmp = (dense ? 7.8 : 5.8) * (1 + G.stageI * 0.14) * (st.theme === 'asia' ? 0.88 : 1);

    addRoad(18, 36, 16, 0, 0);
    let k = 0;
    while (segs.length < target - 160) {
      const h = hash2(st.seed * 13 + k * 3);
      const h2 = hash2(st.seed * 17 + k * 5 + 2);
      const h3 = hash2(st.seed * 19 + k * 7 + 4);
      let curve = (h - 0.5) * 2 * curveAmp;
      if (h > 0.86) curve = 0;
      if (h < 0.1) curve *= 1.42;
      const hill = lastY() + (h2 - 0.46) * hillAmp;
      const enter = 12 + (h3 * 20) | 0;
      const hold = 18 + (hash2(k + 41 + st.seed) * 48) | 0;
      const leave = 10 + (hash2(k + 43 + st.seed) * 20) | 0;
      addRoad(enter, hold, leave, curve, hill);
      k += 1;
    }
    addRoad(16, 36, 14, 0, lastY() * 0.16);
    addRoad(8, 36, 8, 0, 0);

    G.trackLen = segs.length * SEG;
    G.gateZ = (segs.length - 16) * SEG;
    G.gated = false;
    G.bossOn = false;
    G.bossDead = false;
    G.packNeed = 0;
    G.packDown = 0;
    placeSprites(st);
    placeBikes(st);
  }

  function placeSprites(st) {
    const theme = st.theme;
    const step = theme === 'asia' ? 3 : 4;
    for (let i = 8; i < segs.length - 22; i += step) {
      const r = hash2(st.seed * 91 + i * 17);
      const side = hash2(st.seed + i * 3) > 0.5 ? 1 : -1;
      const dist = 1.2 + hash2(i + 9) * 1.5;
      if (theme === 'africa') {
        if (r > 0.18) addSprite(i, -dist - 0.08, 'baobab', 820 + (r * 280) | 0, 520);
        if (r > 0.42) addSprite(i, dist + 0.1, r > 0.8 ? 'dune' : 'baobab', r > 0.8 ? 240 : 760, r > 0.8 ? 380 : 480);
        if ((i % 16) === 0) addSprite(i, side * 1.08, 'post', 360, 58);
      } else if (theme === 'asia') {
        if (r > 0.14) addSprite(i, -dist - 0.16, r > 0.72 ? 'sign' : 'tower', 880 + (r * 720) | 0, 280 + (r * 180) | 0);
        if (r > 0.3) addSprite(i, dist + 0.18, r > 0.66 ? 'pagoda' : 'tower', 760 + (hash2(i) * 640) | 0, 300);
        if ((i % 6) === 0) addSprite(i, side * 1.08, 'neon', 620, 64);
      } else {
        if (r > 0.16) addSprite(i, -dist - 0.1, r > 0.78 ? 'castle' : 'pine', r > 0.78 ? 980 : 860 + (r * 220) | 0, r > 0.78 ? 420 : 260);
        if (r > 0.34) addSprite(i, dist + 0.12, r > 0.7 ? 'snow' : 'pine', r > 0.7 ? 280 : 800, r > 0.7 ? 240 : 240);
        if ((i % 8) === 0) addSprite(i, side * 1.06, 'lamp', 600, 62);
      }
    }
    const gate = segs.length - 16;
    addSprite(gate, -1.08, 'pillar', 1480, 150);
    addSprite(gate, 1.08, 'pillar', 1480, 150);
    addSprite(gate, 0, st.goal ? 'goal' : 'check', 540, 920);
  }

  function bikeColor(h) {
    if (h < 0.16) return [70, 220, 255];
    if (h < 0.32) return [255, 214, 70];
    if (h < 0.48) return [90, 235, 150];
    if (h < 0.64) return [230, 90, 255];
    if (h < 0.8) return [250, 250, 255];
    return [255, 110, 80];
  }

  function placeBikes(st) {
    const n = isDense() ? 16 : 11;
    const max = baseMax();
    const packStart = segs.length * 0.76;
    for (let i = 0; i < n; i++) {
      const z = (55 + i * ((packStart - 90) / n) + hash2(st.seed + i) * 32) * SEG;
      if (z > G.trackLen - 28000) continue;
      bikes.push({
        z: z,
        offset: (hash2(st.seed * 3 + i) - 0.5) * 1.18,
        spd: max * (0.28 + hash2(i + 8) * 0.38),
        col: bikeColor(hash2(st.seed + i * 19)),
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
    const pz = G.z + PLAYER_Z;
    const max = baseMax();
    G.packNeed = n;
    G.packDown = 0;
    for (let i = 0; i < n; i++) {
      const isBoss = i === 0;
      bikes.push({
        z: pz + 2200 + i * 380 + rand(0, 120),
        offset: isBoss ? 0 : ((i % 3) - 1) * 0.42 + rand(-0.06, 0.06),
        spd: max * (isBoss ? 0.62 : 0.5 + i * 0.018),
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
    setHint('终段悬团 · 涡轮顶上去撞飞', 'hot');
    if (stageLabel) stageLabel.classList.add('boss');
  }

  function palette() {
    const theme = def().theme;
    if (theme === 'africa') {
      return {
        skyTop: [36, 8, 22],
        skyMid: [168, 42, 58],
        skyHor: [255, 120, 70],
        fog: [255, 140, 90],
        lg: [168, 92, 36], lg2: [142, 76, 28],
        rg: [176, 98, 38], rg2: [148, 80, 30],
        road: [46, 32, 40], road2: [56, 40, 48],
        rumble: [255, 61, 136], rumble2: [255, 236, 214],
        lane: [255, 210, 140],
        sun: [255, 186, 72],
        mtn1: [86, 28, 32], mtn2: [58, 18, 24],
        sea: false
      };
    }
    if (theme === 'asia') {
      return {
        skyTop: [10, 4, 22],
        skyMid: [42, 10, 58],
        skyHor: [96, 18, 72],
        fog: [42, 12, 48],
        lg: [22, 12, 32], lg2: [16, 10, 26],
        rg: [24, 14, 34], rg2: [18, 10, 28],
        road: [28, 22, 38], road2: [36, 28, 48],
        rumble: [0, 240, 255], rumble2: [255, 61, 136],
        lane: [200, 230, 255],
        sun: [255, 140, 200],
        mtn1: [22, 10, 36], mtn2: [14, 8, 26],
        sea: false
      };
    }
    return {
      skyTop: [6, 4, 18],
      skyMid: [18, 10, 44],
      skyHor: [58, 22, 72],
      fog: [24, 14, 40],
      lg: [18, 22, 36], lg2: [14, 18, 30],
      rg: [20, 24, 38], rg2: [16, 18, 30],
      road: [26, 24, 38], road2: [34, 32, 48],
      rumble: [255, 61, 136], rumble2: [220, 236, 255],
      lane: [210, 230, 255],
      sun: [210, 220, 255],
      mtn1: [16, 12, 32], mtn2: [10, 8, 22],
      sea: false
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
      const turbo = G.turboOn ? 1.28 : 1;
      const pulse = Math.sin(G.t * (18 + spd01 * 24)) * (3 + spd01 * 12);
      const f = (72 + spd01 * 188 + pulse) * turbo;
      this.eng.frequency.setTargetAtTime(f, t, 0.04);
      this.eng2.frequency.setTargetAtTime(f * 0.5, t, 0.04);
      this.eng3.frequency.setTargetAtTime(f * 2.08, t, 0.04);
      this.engF.frequency.setTargetAtTime(440 + spd01 * 1600 + (G.turboOn ? 400 : 0), t, 0.07);
      const crashMul = G.crashT > 0 ? 0.32 : 1;
      const vol = (0.028 + spd01 * 0.074 + (G.turboOn ? 0.03 : 0)) * crashMul;
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
    comboTok += 1;
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'win' ? 'GOAL' : kind === 'lose' ? 'TIME UP' : 'SHON';
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
    if (spdEl) spdEl.textContent = String(G.kmh | 0);
    if (stageLabel) {
      stageLabel.textContent = def().name + ' · ' + (G.stageI + 1) + '/3';
      stageLabel.classList.toggle('hot', !!def().goal);
      stageLabel.classList.toggle('boss', G.mode === 'play' && G.bossOn && !G.gated);
    }
    if (tagLabel) {
      tagLabel.textContent = G.turboOn ? '涡' : modeName();
      tagLabel.classList.toggle('hot', G.turboOn);
      tagLabel.classList.toggle('warn', isDense() && !G.turboOn);
    }
    if (timeBox) timeBox.classList.toggle('low', G.mode === 'play' && G.time < 10);
    if (timeBar) {
      const t = clamp(G.time / Math.max(1, G.timeCap), 0, 1);
      timeBar.style.transform = 'scaleX(' + t + ')';
    }
    if (timeWrap) timeWrap.classList.toggle('low', G.mode === 'play' && G.time < 10);
    if (turboBar) turboBar.style.transform = 'scaleX(' + clamp(G.turbo, 0, 1) + ')';
    if (turboWrap) {
      turboWrap.classList.toggle('on', G.turboOn);
      turboWrap.classList.toggle('low', G.turbo < 0.22 && G.mode === 'play');
    }
    if (btnTurbo) {
      btnTurbo.classList.toggle('on', G.turboOn);
      btnTurbo.classList.toggle('ready', G.turbo > 0.35 && !G.turboOn);
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
    else if (G.mode === 'win') setHint('R 再冲 · 三段冲线', 'hot');
    else if (G.mode === 'lose') setHint('R 重开 · 涡轮顶上撞飞，超时才结束', 'warn');
    else if (G.time < 10) setHint('时间将尽 · 冲过检查点加时', 'warn');
    else if (G.crashT > 0.4) setHint('复原中 · 油门起来再压弯', 'warn');
    else if (G.bossOn) setHint('终段悬团 · Shift 涡轮撞飞', 'hot');
    else setHint('← → 压弯 · ↑ 油门 · Shift 涡轮 · 别摔 · R 重开', '');
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
    G.comboMax = 0;
    G.mult = 1;
    G.flow = 0;
    G.flowN = 0;
    G.gear = 1;
    G.turbo = 1;
    G.turboOn = false;
    G.ending = '';
    G.endT = 0;
    G.off = false;
    G.gated = false;
    G.bossOn = false;
    G.bossDead = false;
    G.packNeed = 0;
    G.packDown = 0;
    G.emptyT = 0;
    particles.length = 0;
    floats.length = 0;
    smears.length = 0;
    rings.length = 0;
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'core';
    G.stageI = 0;
    G.score = 0;
    G.time = startTime();
    G.timeCap = G.time;
    resetRunVars();
    G.z = 0;
    G.spd = baseMax() * 0.58;
    buildStage();
    showOverlay('title', '超悬', '把车身挂进画面。涡轮顶上，别摔。短关之后是终段悬团。');
    hud();
  }

  function startGame(kind) {
    audio.ensure();
    G.kind = kind === 'dense' ? 'dense' : 'core';
    G.mode = 'play';
    G.stageI = 0;
    G.score = 0;
    G.time = startTime();
    G.timeCap = G.time;
    resetRunVars();
    G.spd = baseMax() * 0.28;
    G.flash = 0.4;
    G.flashRgb = isDense() ? CYN : MAG;
    G.stop = 0;
    G.shake = 0;
    buildStage();
    hideOverlay();
    audio.sting();
    toast(modeName() + (isDense() ? ' · 更密更快' : ' · 挂进去'), false, true);
    hud();
  }

  function addCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.comboMax) G.comboMax = G.combo;
    G.mult = comboMult();
    popCombo();
    if (G.combo === 3) toast('连击 ×3', false, true);
    if (G.combo === 6) toast('连击 ×6 · 爆悬', false, true);
    if (G.combo === 10) toast('连击 ×10 · 无人能及', false, true);
  }

  function onOvertake(bike) {
    addCombo();
    const n = (70 * G.combo * G.mult) | 0;
    bumpScore(n);
    floatText(CX + bike.offset * 80, VH * 0.6, '超车 ×' + G.combo, GOLD);
    audio.overtake(G.combo);
    if (G.combo >= 3) {
      hitStop(0.034);
      kick(2.6);
      screenFlash(CYN, 0.16);
    }
    emit(10, {
      x: CX + bike.offset * 90, y: VH * 0.68, j: 14,
      vx0: -90, vx1: 90, vy0: -50, vy1: 70,
      r0: 1.4, r1: 3.2, life: 0.32, rgb: bike.col
    });
  }

  function ramBike(c) {
    const sx = CX + (c.offset - G.x) * 110;
    const sy = VH * 0.62;
    audio.hit(G.combo + 1);
    c.hitT = 0.42;
    c.z += 240;
    if (c.hp > 1) {
      c.hp -= 1;
      c.offset += (G.x >= c.offset ? -1 : 1) * 0.28;
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
      toast(c.boss ? '悬王还在 · 再顶' : '顶飞一层', false, true);
      return;
    }
    c.dead = true;
    c.passed = true;
    addCombo();
    const big = !!c.boss;
    const n = ((big ? 420 : 140) * G.combo * G.mult) | 0;
    bumpScore(n);
    floatText(sx, sy - 8, big ? '悬王击破 ×' + G.combo : '爆悬 ×' + G.combo, big ? GOLD : MAG);
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
        toast('悬王爆了', false, true);
      }
    }
  }

  function crash(kind, other) {
    if (G.crashT > 0.18) return;
    G.crashT = 1.55;
    G.bounce = 1;
    G.spd *= kind === 'off' ? 0.16 : 0.14;
    G.turboOn = false;
    if (other) {
      const dir = G.x >= other.offset ? 1 : -1;
      G.x += dir * 0.3;
    } else {
      G.x = clamp(G.x * 0.5, -0.82, 0.82);
    }
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
      x: CX, y: VH - 64, j: 32,
      vx0: -260, vx1: 260, vy0: -210, vy1: 50,
      r0: 2, r1: 6, life: 0.55, rgb: RED
    });
    emit(14, {
      x: CX, y: VH - 70, j: 12,
      vx0: -90, vx1: 90, vy0: -160, vy1: -20,
      r0: 1, r1: 2.6, life: 0.36, rgb: GOLD
    });
    burstRing(CX, VH - 70, MAG, 18);
    if (kind === 'off') {
      emit(16, {
        x: CX + G.lean * 30, y: VH - 40, j: 22,
        vx0: -70, vx1: 70, vy0: -40, vy1: 40,
        r0: 1.5, r1: 3.4, life: 0.4, rgb: def().theme === 'europe' ? [120, 140, 170] : [150, 90, 50]
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
    const bonus = 720 + ((G.time * 8) | 0) + G.combo * 50;
    bumpScore(bonus);
    G.stageI += 1;
    G.z = 36;
    G.x = clamp(G.x, -0.55, 0.55);
    G.gated = false;
    G.turbo = Math.min(1, G.turbo + 0.28);
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
      const bonus = 2600 + ((G.time * 80) | 0) + G.comboMax * 40;
      bumpScore(bonus);
      maybeBest();
      G.mode = 'win';
      audio.win();
      hitStop(0.08);
      screenFlash(GOLD, 0.7);
      showOverlay('win', '冲线', modeName() + ' 三段到齐　·　' + (G.score | 0) + ' 分');
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
    if (G.mode !== 'play' || G.crashT > 0) return false;
    if (keys.t || G.turboHold) return true;
    if (inputSrc === 'ptr' && pointer.down && pointer.y < VH * 0.34) return true;
    return false;
  }

  function updateBikes(dt) {
    const pz = G.z + PLAYER_Z;
    const maxz = G.gateZ - 1400;
    const spd01 = clamp(G.spd / baseMax(), 0, 1.4);
    for (let i = bikes.length - 1; i >= 0; i--) {
      const c = bikes[i];
      if (c.dead) {
        c.z += c.spd * dt * 0.2;
        c.offset += (c.offset >= 0 ? 1 : -1) * dt * 1.6;
        if (c.z < pz - 800 || Math.abs(c.offset) > 2.4) bikes.splice(i, 1);
        continue;
      }
      c.hitT = Math.max(0, (c.hitT || 0) - dt);
      c.z += c.spd * dt;
      if (c.pack && c.z > G.gateZ - 900) {
        c.z = G.gateZ - 900;
        c.spd = Math.min(c.spd, Math.max(G.spd * 0.72, baseMax() * 0.2));
      }
      c.wob += dt * (c.boss ? 3.1 : 2.2);
      if (c.boss && G.mode === 'play') {
        const aim = clamp(G.x * 0.82, -0.7, 0.7);
        c.offset = lerp(c.offset, aim, 1 - Math.pow(0.18, dt));
      } else if (c.pack) {
        c.offset += Math.sin(c.wob * 0.7 + i) * dt * 0.18;
        c.offset = clamp(c.offset, -0.78, 0.78);
      }
      if (!c.passed && pz > c.z + 40 && pz - c.z < 680) {
        c.passed = true;
        if (G.mode === 'play' && G.crashT <= 0) onOvertake(c);
      }
      const dz = Math.abs(c.z - pz);
      const dx = Math.abs(c.offset - G.x);
      if (G.mode === 'play' && G.crashT <= 0 && G.ending === '' && c.hitT <= 0) {
        if (dz < 195 && dx < 0.28) {
          if (G.turboOn && spd01 > 0.38) ramBike(c);
          else crash('bike', c);
        } else if (dz < 250 && dx < 0.44 && !c.near) {
          c.near = true;
          audio.near();
          emit(6, {
            x: CX + (c.offset - G.x) * 90, y: VH - 80, j: 8,
            vx0: -40, vx1: 40, vy0: -30, vy1: 40,
            r0: 1, r1: 2.2, life: 0.22, rgb: CYN
          });
        }
      }
      if (!c.pack && c.z < pz - 1600) {
        c.z = Math.min(maxz, pz + 2400 + rand(0, 3800));
        c.offset = rand(-0.7, 0.7);
        c.passed = false;
        c.near = false;
        c.col = bikeColor(Math.random());
        c.hp = 1;
        c.dead = false;
        c.hitT = 0;
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
    G.emptyT = Math.max(0, G.emptyT - dt);
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
    const seg = findSeg(G.z + PLAYER_Z);
    const want = clamp(-seg.curve * 0.16, -0.82, 0.82);
    G.lean = lerp(G.lean, want, 1 - Math.pow(0.01, dt));
    G.x += (want * 0.62 - G.x) * 2.4 * dt;
    G.x = clamp(G.x, -0.85, 0.85);
    G.spd = lerp(G.spd, baseMax() * 0.66, 1 - Math.pow(0.08, dt));
    if (G.z + PLAYER_Z > G.gateZ - 500) {
      G.z = 80;
      G.x = 0;
      G.lean = 0;
      G.bossOn = false;
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    const playing = G.mode === 'play' && !G.ending;
    const demo = G.mode === 'title';
    const spd01 = clamp(G.spd / baseMax(), 0, 1.5);
    audio.tickEngine(Math.min(1, spd01), (playing || demo) && G.spd > 40);

    if (G.stop > 0) {
      G.stop -= dt;
      updateJuice(dt * 0.35);
      return;
    }

    updateJuice(dt);

    if (G.mode === 'win' || G.mode === 'lose') {
      G.spd = Math.max(0, G.spd - baseMax() * 0.62 * dt);
      G.z += G.spd * dt;
      G.kmh = (G.spd / baseMax()) * (G.turboOn ? kmhMax() : (isDense() ? 300 : 280));
      G.lean = lerp(G.lean, 0, 1 - Math.pow(0.02, dt));
      G.turboOn = false;
      return;
    }

    if (demo) autoDemo(dt);

    const wantT = wantTurbo();
    if (playing) {
      if (wantT && G.turbo > 0.06) {
        if (!G.turboOn) audio.turboOn();
        G.turboOn = true;
        G.turbo = Math.max(0, G.turbo - turboDrain() * dt);
        if (G.turbo <= 0) {
          G.turbo = 0;
          G.turboOn = false;
          if (G.emptyT <= 0) {
            G.emptyT = 0.7;
            audio.empty();
            toast('涡轮空了', true, false);
          }
        }
      } else {
        G.turboOn = false;
        if (!wantT) G.turbo = Math.min(1, G.turbo + turboFill() * dt);
      }
    } else {
      G.turboOn = false;
    }

    const seg = findSeg(G.z + PLAYER_Z);
    const dx = dt * (isDense() ? 2.55 : 2.18) * Math.max(0.22, Math.min(1, spd01));

    let steer = 0;
    if (!demo) {
      if (keys.l) steer -= 1;
      if (keys.r) steer += 1;
      if (inputSrc === 'ptr' && pointer.down) {
        const tx = (pointer.x - CX) / (CX * 0.68);
        steer = clamp(tx * 1.4, -1, 1);
      }
      if (G.crashT > 0) steer *= 0.26;
      if (G.turboOn) steer *= 1.08;
    }

    if (!demo) {
      const leanPow = isDense() ? 0.018 : 0.0005;
      G.lean = lerp(G.lean, steer, 1 - Math.pow(leanPow, dt));
      G.x += G.lean * dx * (G.off ? 0.6 : 1) * (isDense() ? 0.9 : 1);
      G.x -= dx * Math.min(1, spd01) * seg.curve * centrif();
    }
    if (G.crashT > 0) G.x += (0 - G.x) * 2.2 * dt;
    G.x = clamp(G.x, -2.18, 2.18);
    G.steerVis = lerp(G.steerVis, G.lean, 1 - Math.pow(0.0007, dt));
    G.curveMem = lerp(G.curveMem, seg.curve * Math.min(1, spd01), 1 - Math.pow(0.04, dt));

    const gas = keys.u || (pointer.down && inputSrc === 'ptr');
    const max = maxSpd();
    if (!demo) {
      if (G.crashT > 0) {
        G.spd += accel() * 0.18 * dt;
      } else if (keys.d) {
        G.spd += brake() * dt;
      } else if (gas) {
        G.spd += accel() * dt;
      } else {
        G.spd += coast() * dt;
      }
    }

    G.off = Math.abs(G.x) > 1.08;
    if (G.off && G.spd > baseMax() * 0.36) G.spd += offDecel() * dt;
    if (G.off && playing && Math.random() < 0.42) {
      emit(1, {
        x: CX + G.lean * 22, y: VH - 34, j: 10,
        vx0: -50, vx1: 50, vy0: -12, vy1: 28,
        r0: 1, r1: 2.3, life: 0.22, rgb: def().theme === 'europe' ? [100, 120, 150] : [170, 110, 70]
      });
    }
    G.spd = clamp(G.spd, 0, max);
    G.z += G.spd * dt;
    if (G.z < 0) G.z = 0;

    G.kmh = clamp(G.spd / baseMax(), 0, 1.5) * (isDense() ? 300 : 280);
    if (G.turboOn) G.kmh = Math.min(kmhMax(), G.kmh * 1.16);

    const gear = spd01 < 0.2 ? 1 : spd01 < 0.46 ? 2 : spd01 < 0.72 ? 3 : 4;
    if (gear > G.gear && playing) audio.gear();
    G.gear = gear;

    if (playing && G.crashT <= 0) {
      if (G.off && spd01 > 0.38) crash('off');
      else if (Math.abs(G.x) > 1.52) crash('off');
    }

    if (playing && spd01 > 0.8 && !G.off && G.crashT <= 0) {
      G.flow += dt;
      const gap = G.turboOn ? 0.52 : 0.68;
      if (G.flow >= gap) {
        G.flow = 0;
        G.flowN += 1;
        bumpScore((G.turboOn ? 38 : 24) + G.flowN * 6);
        if (G.flowN === 4) toast(G.turboOn ? '涡轮疾风' : '疾风', false, true);
        if (G.flowN === 8) toast('爆走', false, true);
        if (G.flowN === 12) toast('极速', false, true);
      }
    } else {
      G.flow = 0;
      if (G.crashT > 0 || G.off) G.flowN = 0;
    }

    if (spd01 > 0.48 && !REDUCE) {
      if (smears.length < (G.turboOn ? 28 : 20) && Math.random() < 0.58) {
        smears.push({
          x: rand(0, VW),
          y: rand(HORIZON + 8, VH),
          len: rand(16, 80) * Math.min(1.2, spd01),
          a: rand(0.08, 0.26) * Math.min(1.2, spd01),
          v: 900 + spd01 * 1600,
          lean: G.lean,
          turbo: G.turboOn
        });
      }
    }
    for (let i = smears.length - 1; i >= 0; i--) {
      smears[i].y += smears[i].v * dt * 0.28;
      smears[i].x += smears[i].lean * 150 * dt;
      smears[i].a -= dt * 0.78;
      if (smears[i].a <= 0 || smears[i].y > VH + 10) smears.splice(i, 1);
    }

    if (G.turboOn && playing && G.crashT <= 0 && Math.random() < 0.55) {
      emit(1, {
        x: CX - G.lean * 16 + rand(-6, 6), y: VH - 22, j: 4,
        vx0: -30, vx1: 30, vy0: 20, vy1: 80,
        r0: 1.4, r1: 3.2, life: 0.22, rgb: Math.random() > 0.5 ? CYN : MAG
      });
    } else if (spd01 > 0.55 && playing && G.crashT <= 0 && Math.random() < 0.16) {
      emit(1, {
        x: CX - G.lean * 18 + rand(-8, 8), y: VH - 28, j: 4,
        vx0: -20, vx1: 20, vy0: 10, vy1: 40,
        r0: 1, r1: 2, life: 0.18, rgb: HOT
      });
    }

    updateBikes(dt);

    if (playing && !G.bossOn && G.z + PLAYER_Z > G.trackLen * 0.76) {
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
      G.score += G.spd * dt * 0.014;
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
    g.addColorStop(0.5, rgba(pal.skyMid, 1));
    g.addColorStop(1, rgba(pal.skyHor, 1));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, HORIZON + 22);

    const night = def().theme !== 'africa';
    if (night) {
      for (let i = 0; i < 42; i++) {
        const hx = hash2(i * 19 + 3);
        const hy = hash2(i * 23 + 7);
        ctx.fillStyle = rgba(WHT, 0.22 + hash2(i) * 0.5);
        ctx.fillRect((hx * VW + G.curveMem * 2) % VW, hy * (HORIZON - 8), 1.4, 1.4);
      }
    }

    const sunX = CX + 170 - G.x * 14 - G.curveMem * 8;
    const sunY = HORIZON * (night ? 0.38 : 0.52);
    const sunR = night ? 11 : 22;
    const sg = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, 68);
    sg.addColorStop(0, rgba(night ? PNK : pal.sun, 0.95));
    sg.addColorStop(0.25, rgba(pal.sun, 0.55));
    sg.addColorStop(1, rgba(pal.sun, 0));
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 68, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(night ? [230, 210, 255] : pal.sun, 1);
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, TAU);
    ctx.fill();
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
    layer(pal.mtn1, 30, 46, 0.35, def().seed);
    layer(pal.mtn2, 12, 28, 0.62, def().seed + 9);
  }

  function drawOneRoad(p1, p2, pal, alt, fog) {
    const x1 = p1.x;
    const x2 = p2.x;
    const w1 = p1.w;
    const w2 = p2.w;
    const r1 = w1 * 1.18;
    const r2 = w2 * 1.18;
    const rd = mix(alt ? pal.road : pal.road2, pal.fog, fog);
    const rb = mix(alt ? pal.rumble : pal.rumble2, pal.fog, fog);
    const ln = mix(pal.lane, pal.fog, fog);
    quad(x1 - r1, p1.y, x1 - w1, p1.y, x2 - w2, p2.y, x2 - r2, p2.y, rb);
    quad(x1 + w1, p1.y, x1 + r1, p1.y, x2 + r2, p2.y, x2 + w2, p2.y, rb);
    quad(x1 - w1, p1.y, x1 + w1, p1.y, x2 + w2, p2.y, x2 - w2, p2.y, rd);
    if (G.turboOn && !alt) {
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
    const night = def().theme !== 'africa';
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VW, clip);
    ctx.clip();

    if (spr.k === 'baobab') {
      ctx.fillStyle = rgba([92, 56, 32], 1);
      ctx.fillRect(x - w * 0.12, y + h * 0.38, w * 0.24, h * 0.62);
      ctx.fillStyle = rgba(night ? [48, 86, 42] : [62, 140, 58], 1);
      ctx.beginPath();
      ctx.ellipse(x, y + h * 0.32, w * 0.46, h * 0.22, 0, 0, TAU);
      ctx.fill();
    } else if (spr.k === 'dune') {
      ctx.fillStyle = rgba(mix([196, 140, 70], pal.fog, 0.15), 1);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, y + h);
      ctx.quadraticCurveTo(x, y, x + w * 0.5, y + h);
      ctx.fill();
    } else if (spr.k === 'tower') {
      ctx.fillStyle = rgba(night ? [18, 10, 36] : [42, 28, 58], 1);
      ctx.fillRect(x - w * 0.42, y, w * 0.84, h);
      const rows = 6;
      for (let r = 0; r < rows; r++) {
        const on = hash2(spr.h + r * 7 + (p.x | 0)) > 0.32;
        ctx.fillStyle = rgba(on ? (r & 1 ? MAG : CYN) : [16, 10, 28], on ? 0.88 : 0.4);
        ctx.fillRect(x - w * 0.28, y + h * 0.08 + r * h * 0.14, w * 0.18, h * 0.08);
        ctx.fillRect(x + w * 0.08, y + h * 0.08 + r * h * 0.14, w * 0.18, h * 0.08);
      }
    } else if (spr.k === 'sign') {
      ctx.fillStyle = rgba([28, 16, 40], 1);
      ctx.fillRect(x - w * 0.08, y + h * 0.35, w * 0.16, h * 0.65);
      ctx.fillStyle = rgba(MAG, 0.92);
      ctx.fillRect(x - w * 0.48, y, w * 0.96, h * 0.38);
      ctx.fillStyle = rgba(CYN, 0.85);
      ctx.fillRect(x - w * 0.4, y + h * 0.08, w * 0.8, h * 0.1);
    } else if (spr.k === 'pagoda') {
      ctx.fillStyle = rgba([40, 18, 28], 1);
      ctx.fillRect(x - w * 0.18, y + h * 0.2, w * 0.36, h * 0.8);
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, y + h * 0.28);
      ctx.lineTo(x, y);
      ctx.lineTo(x + w * 0.5, y + h * 0.28);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(x - w * 0.42, y + h * 0.42, w * 0.84, h * 0.08);
    } else if (spr.k === 'neon') {
      ctx.fillStyle = rgba([36, 36, 48], 1);
      ctx.fillRect(x - w * 0.08, y + h * 0.12, w * 0.16, h * 0.88);
      ctx.fillStyle = rgba((spr.h | 0) % 2 ? MAG : CYN, 0.9);
      ctx.beginPath();
      ctx.arc(x, y + h * 0.1, Math.max(2, w * 0.3), 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba((spr.h | 0) % 2 ? MAG : CYN, 0.12);
      ctx.beginPath();
      ctx.arc(x, y + h * 0.1, w * 1.15, 0, TAU);
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
    } else if (spr.k === 'castle') {
      ctx.fillStyle = rgba([32, 24, 48], 1);
      ctx.fillRect(x - w * 0.42, y + h * 0.28, w * 0.84, h * 0.72);
      ctx.fillRect(x - w * 0.5, y + h * 0.12, w * 0.18, h * 0.88);
      ctx.fillRect(x + w * 0.32, y + h * 0.12, w * 0.18, h * 0.88);
      ctx.fillStyle = rgba(MAG, 0.55);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, y + h * 0.14);
      ctx.lineTo(x - w * 0.41, y);
      ctx.lineTo(x - w * 0.32, y + h * 0.14);
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
    }
    ctx.restore();
  }

  function drawTrafficBike(c, p, clip) {
    const destW = (c.boss ? 520 : 430) * p.s * CX * 0.00115;
    const destH = destW * 1.18;
    const x = p.x + c.offset * p.w;
    const y0 = p.y;
    if (clipSprite(y0 - destH, destH, clip) <= 2 || destW < 2) return;
    const wob = Math.sin(c.wob) * destW * 0.04;
    const lean = Math.sin(c.wob * 0.6) * 0.12;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VW, clip);
    ctx.clip();
    ctx.translate(x + wob, y0);
    ctx.rotate(lean);
    if (c.dead) ctx.globalAlpha = 0.45;
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
    ctx.moveTo(-destW * 0.24, -destH * 0.16);
    ctx.lineTo(-destW * 0.14, -destH * 0.58);
    ctx.lineTo(destW * 0.14, -destH * 0.58);
    ctx.lineTo(destW * 0.24, -destH * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(mix(c.col, WHT, 0.28), 1);
    ctx.fillRect(-destW * 0.08, -destH * 0.74, destW * 0.16, destH * 0.22);
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.arc(0, -destH * 0.84, destW * 0.12, 0, TAU);
    ctx.fill();
    if (c.boss) {
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(-destW * 0.16, -destH * 0.28, destW * 0.32, destH * 0.08);
      ctx.strokeStyle = rgba(GOLD, 0.85);
      ctx.lineWidth = Math.max(1.2, destW * 0.04);
      ctx.strokeRect(-destW * 0.38, -destH * 0.96, destW * 0.76, destH * 0.92);
    }
    if (c.pack && !c.boss) {
      ctx.fillStyle = rgba(MAG, 0.7);
      ctx.fillRect(-destW * 0.06, -destH * 0.3, destW * 0.12, destH * 0.08);
    }
    ctx.restore();
  }

  function drawMotoBody(leanAmt, crashSpin, scaleY) {
    ctx.save();
    ctx.rotate(leanAmt + crashSpin);
    ctx.scale(1, scaleY);

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 50, 9, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#121016';
    ctx.beginPath();
    ctx.ellipse(0, 10, 30, 12, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2a2030';
    ctx.beginPath();
    ctx.ellipse(0, 10, 18, 7, 0, 0, TAU);
    ctx.fill();

    if (G.turboOn && G.crashT <= 0) {
      const flick = 0.7 + Math.sin(G.t * 42) * 0.3;
      ctx.fillStyle = rgba(CYN, 0.45 * flick);
      ctx.beginPath();
      ctx.moveTo(-8, 14);
      ctx.lineTo(0, 14 + 28 * flick);
      ctx.lineTo(8, 14);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.7 * flick);
      ctx.beginPath();
      ctx.moveTo(-5, 14);
      ctx.lineTo(0, 14 + 18 * flick);
      ctx.lineTo(5, 14);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.moveTo(-3, 14);
      ctx.lineTo(0, 14 + 10 * flick);
      ctx.lineTo(3, 14);
      ctx.fill();
    }

    ctx.fillStyle = rgba(MAG, 1);
    ctx.beginPath();
    ctx.moveTo(-20, 6);
    ctx.lineTo(-15, -20);
    ctx.lineTo(15, -20);
    ctx.lineTo(20, 6);
    ctx.lineTo(11, 13);
    ctx.lineTo(-11, 13);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.moveTo(-11, 2);
    ctx.lineTo(-8, -16);
    ctx.lineTo(8, -16);
    ctx.lineTo(11, 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(MAG, 1);
    ctx.fillRect(-18, -8, 9, 16);
    ctx.fillRect(9, -8, 9, 16);

    const hang = leanAmt * 14;
    ctx.fillStyle = rgba(WHT, 0.96);
    ctx.beginPath();
    ctx.arc(-1 + hang, -30, 9, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 1);
    ctx.fillRect(-6 + hang, -35, 10, 5);

    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillRect(-9, 4, 18, 6);
    ctx.fillStyle = '#1a1014';
    ctx.font = 'bold 7px "Segoe UI",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', 0, 7);

    ctx.fillStyle = rgba(CYN, 0.78);
    ctx.fillRect(-24, 2, 8, 4);
    ctx.fillRect(16, 2, 8, 4);

    ctx.fillStyle = '#1a1218';
    ctx.fillRect(-28, -2, 11, 3);
    ctx.fillRect(17, -2, 11, 3);

    ctx.restore();
  }

  function drawPlayer() {
    const lean = G.steerVis;
    const hop = G.crashT > 0 ? Math.abs(Math.sin(G.crashT * 17)) * 16 * Math.min(1, G.crashT) : 0;
    const squat = Math.min(1, G.spd / baseMax()) * 5;
    const x = CX + lean * 58;
    const y = VH - 26 - hop + squat;
    const spd01 = clamp(G.spd / baseMax(), 0, 1.4);
    const crashSpin = G.crashT > 0 ? Math.sin(G.crashT * 21) * 0.85 * Math.min(1, G.crashT) : 0;

    if (spd01 > 0.38 && !REDUCE && Math.abs(lean) > 0.08) {
      for (let i = 5; i >= 1; i--) {
        const k = i / 5;
        ctx.save();
        ctx.globalAlpha = (0.08 + Math.abs(lean) * 0.18 + (G.turboOn ? 0.08 : 0)) * k * Math.min(1, spd01);
        ctx.translate(x - lean * 28 * i, y + 5 * i);
        drawMotoBody(lean * 0.95, 0, 1);
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
      ctx.fillStyle = rgba(MAG, 1);
      ctx.fillRect(-8, -10, 16, 20);
      ctx.restore();
    }

    ctx.save();
    ctx.translate(x, y);
    drawMotoBody(lean * 0.42 + crashSpin * 0.35, crashSpin, 1 - hop * 0.008);
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
    const spd01 = clamp(G.spd / baseMax(), 0, 1.4);
    if (spd01 < 0.4 || REDUCE) return;
    const vpX = CX - G.x * 28 + G.lean * 18;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(G.turboOn ? MAG : CYN, 0.05 + spd01 * 0.09);
    ctx.lineWidth = G.turboOn ? 1.6 : 1.2;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(vpX, HORIZON + 8);
      ctx.lineTo((i / 12) * VW + G.lean * 28, VH);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(G.turboOn ? CYN : MAG, 0.04 + spd01 * 0.08);
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(vpX + 8, HORIZON + 10);
      ctx.lineTo((i / 7) * VW + G.lean * 40, VH);
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

  function drawHudCanvas() {
    const spd01 = clamp(G.spd / baseMax(), 0, 1.5);
    ctx.save();
    ctx.translate(VW - 86, VH - 70);
    ctx.strokeStyle = rgba(MAG, 0.35);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 34, Math.PI * 0.75, Math.PI * 2.25);
    ctx.stroke();
    ctx.strokeStyle = rgba(spd01 > 1 ? GOLD : (spd01 > 0.85 ? MAG : CYN), 0.95);
    ctx.beginPath();
    ctx.arc(0, 0, 34, Math.PI * 0.75, Math.PI * 0.75 + Math.min(1, spd01) * Math.PI * 1.5);
    ctx.stroke();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.font = 'bold 13px "Segoe UI",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(G.kmh | 0), 0, 4);
    ctx.font = '9px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillStyle = rgba(G.turboOn ? GOLD : MAG, 0.85);
    ctx.fillText(G.turboOn ? 'TURBO' : 'km/h', 0, 16);
    ctx.restore();

    ctx.save();
    ctx.translate(78, VH - 38);
    ctx.fillStyle = rgba(WHT, 0.16);
    ctx.fillRect(-44, -5, 88, 10);
    ctx.fillStyle = rgba(Math.abs(G.lean) > 0.7 ? MAG : CYN, 0.88);
    ctx.fillRect(-2 + G.lean * 40, -8, 4, 16);
    ctx.fillStyle = rgba(GOLD, 0.55);
    ctx.fillRect(-1, -9, 2, 18);
    ctx.fillStyle = rgba(WHT, 0.45);
    ctx.font = '9px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HANG', 0, -14);
    ctx.restore();

    if (G.mode === 'play' && G.bossOn) {
      ctx.save();
      ctx.fillStyle = rgba(MAG, 0.14 + Math.sin(G.t * 8) * 0.05);
      ctx.fillRect(0, 0, VW, 10);
      ctx.fillRect(0, VH - 10, VW, 10);
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.font = 'bold 12px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(def().pack, CX, 22);
      ctx.restore();
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

    const roll = REDUCE ? 0 : G.lean * (G.turboOn ? 0.14 : 0.1);
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
    if (hidden) {
      keys.l = false;
      keys.r = false;
      keys.u = false;
      keys.d = false;
      keys.t = false;
      G.turboHold = false;
      pointer.down = false;
    }
  });

  requestAnimationFrame(frame);
})();
