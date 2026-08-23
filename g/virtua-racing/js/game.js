'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const CX = VW * 0.5;
  const HORIZON = VH * 0.34;
  const SEG = 200;
  const ROAD_W = 2200;
  const CAM_H = 980;
  const CAM_D = 0.86;
  const PLAYER_Z = CAM_H * CAM_D;
  const DRAW = 188;
  const RUMBLE = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.85;
  const LAPS = 3;
  const BEST_KEY = 'playbox-virtua-racing-best';
  const MUTE_KEY = 'playbox-virtua-racing-mute';
  const OPS = '方向 / WASD 转向 · 空格 / ↑ 油门 · Shift / Z 喷 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const SUN = [0, 228, 208];
  const MAG = [255, 61, 122];
  const CYN = [90, 255, 239];
  const GOLD = [255, 227, 107];
  const HOT = [126, 240, 255];
  const WHT = [232, 251, 255];
  const RED = [255, 52, 88];

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
  const btnBoost = document.getElementById('btn-boost');
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
  const draftBar = document.getElementById('draft-bar');
  const draftWrap = document.getElementById('draft-wrap');

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
  const cars = [];
  const proj = [];
  const mapPts = [];

  const dummy = {
    i: 0, y1: 0, y2: 0, z1: 0, z2: SEG, curve: 0, bank: 0, zone: 'forest',
    sprites: null,
    p1: { x: CX, y: VH, w: 0, s: 0, z: 1 },
    p2: { x: CX, y: VH, w: 0, s: 0, z: 1 },
    clip: VH
  };

  const G = {
    mode: 'title',
    kind: 'core',
    t: 0,
    clock: 0,
    z: 0,
    x: 0,
    spd: 0,
    lean: 0,
    steerVis: 0,
    score: 0,
    best: { c: 0, m: 0 },
    time: 44,
    timeCap: 44,
    combo: 0,
    comboT: 0,
    comboMax: 0,
    mult: 1,
    flow: 0,
    flowN: 0,
    gear: 1,
    draft: 0.35,
    boostOn: false,
    boostHold: false,
    drafting: false,
    draftCar: null,
    trackLen: 0,
    lapDone: 0,
    laps: LAPS,
    packOn: false,
    packNeed: 0,
    packDown: 0,
    kingDead: false,
    crashT: 0,
    bounce: 0,
    off: false,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: SUN,
    punch: 1,
    ending: '',
    endT: 0,
    why: '',
    curveMem: 0,
    bankMem: 0,
    kmh: 0,
    emptyT: 0,
    place: 8
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
  function kindBest() {
    return isDense() ? G.best.m : G.best.c;
  }
  function modeName() {
    return isDense() ? '赛核' : '虚赛';
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function baseMax() {
    return isDense() ? 12600 : 10200;
  }
  function maxSpd() {
    let m = 1;
    if (G.boostOn) m *= 1.32;
    else if (G.drafting) m *= 1.14;
    return baseMax() * m;
  }
  function accel() {
    const b = G.boostOn ? 1.58 : G.drafting ? 1.26 : 1;
    return baseMax() / (isDense() ? 2.42 : 2.86) * b;
  }
  function brake() {
    return -baseMax() / (isDense() ? 1.08 : 1.28);
  }
  function coast() {
    return -baseMax() / (G.boostOn ? 8.4 : 6.0);
  }
  function offDecel() {
    return -baseMax() / (isDense() ? 1.12 : 1.42);
  }
  function startTime() {
    return isDense() ? 33 : 44;
  }
  function lapTime() {
    return isDense() ? 11 : 14;
  }
  function kmhMax() {
    return G.boostOn ? (isDense() ? 338 : 308) : (isDense() ? 286 : 262);
  }
  function centrif() {
    return (isDense() ? 0.58 : 0.44) * (G.boostOn ? 1.16 : 1);
  }
  function boostDrain() {
    return isDense() ? 0.5 : 0.36;
  }
  function draftFill() {
    return isDense() ? 0.44 : 0.58;
  }
  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }
  function wrapZ(z) {
    const L = G.trackLen;
    if (L <= 0) return 0;
    z %= L;
    if (z < 0) z += L;
    return z;
  }
  function segIndex(i) {
    const n = segs.length;
    if (n <= 0) return 0;
    i %= n;
    if (i < 0) i += n;
    return i;
  }
  function lapsNow() {
    if (G.trackLen <= 0) return 0;
    return Math.floor((G.z + PLAYER_Z) / G.trackLen);
  }
  function lapFrac() {
    if (G.trackLen <= 0) return 0;
    return wrapZ(G.z + PLAYER_Z) / G.trackLen;
  }
  function onLastLap() {
    return lapsNow() >= G.laps - 1;
  }

  function findSeg(z) {
    if (!segs.length) return dummy;
    let i = Math.floor(wrapZ(z) / SEG);
    if (i < 0) i = 0;
    if (i >= segs.length) i = segs.length - 1;
    return segs[i];
  }
  function lastY() {
    return segs.length ? segs[segs.length - 1].y2 : 0;
  }
  function addSeg(curve, y, bank, zone) {
    const n = segs.length;
    segs.push({
      i: n,
      y1: n ? segs[n - 1].y2 : 0,
      y2: y,
      z1: n * SEG,
      z2: (n + 1) * SEG,
      curve: curve,
      bank: bank || 0,
      zone: zone || 'forest',
      sprites: null
    });
  }
  function addRoad(enter, hold, leave, curve, yEnd, bank, zone) {
    const startY = lastY();
    const total = Math.max(1, enter + hold + leave);
    const b = bank || 0;
    const z = zone || 'forest';
    let n;
    for (n = 0; n < enter; n++) {
      const t = n / Math.max(1, enter);
      addSeg(easeIn(0, curve, t), easeInOut(startY, yEnd, n / total), easeIn(0, b, t), z);
    }
    for (n = 0; n < hold; n++) {
      addSeg(curve, easeInOut(startY, yEnd, (enter + n) / total), b, z);
    }
    for (n = 0; n < leave; n++) {
      const t = n / Math.max(1, leave);
      addSeg(easeInOut(curve, 0, t), easeInOut(startY, yEnd, (enter + hold + n) / total), easeInOut(b, 0, t), z);
    }
  }
  function addSprite(i, offset, kind, h, w, lab) {
    if (i < 0 || i >= segs.length) return;
    const s = segs[i];
    if (!s.sprites) s.sprites = [];
    s.sprites.push({ o: offset, k: kind, h: h, w: w, lab: lab || '' });
  }

  function buildMinimap() {
    mapPts.length = 0;
    let heading = -Math.PI * 0.5;
    let x = 0;
    let y = 0;
    let minX = 0;
    let maxX = 0;
    let minY = 0;
    let maxY = 0;
    for (let i = 0; i < segs.length; i++) {
      heading += segs[i].curve * 0.012;
      x += Math.cos(heading);
      y += Math.sin(heading);
      if (i % 3 === 0) {
        mapPts.push({ x: x, y: y });
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    const dx = maxX - minX || 1;
    const dy = maxY - minY || 1;
    for (let i = 0; i < mapPts.length; i++) {
      mapPts[i].x = (mapPts[i].x - minX) / dx;
      mapPts[i].y = (mapPts[i].y - minY) / dy;
    }
  }

  function buildCircuit() {
    segs.length = 0;
    cars.length = 0;
    const dense = isDense();
    const k = dense ? 1.1 : 1;

    addRoad(12, 44, 10, 0, 0, 0, 'forest');
    addRoad(16, 26, 12, 6.4 * k, 70, 0.22, 'forest');
    addRoad(12, 20, 10, -7.2 * k, -30, 0.18, 'forest');
    addRoad(8, 14, 8, 5.6 * k, 10, 0, 'forest');
    addRoad(8, 14, 8, -6.2 * k, 30, 0, 'bridge');
    addRoad(14, 32, 10, 0, 160, 0, 'bridge');
    addRoad(10, 22, 8, -4.4 * k, 160, 0, 'bridge');
    addRoad(10, 22, 8, 5.0 * k, 160, 0, 'bridge');
    addRoad(12, 18, 10, 5.8 * k, 40, 0.12, 'ruin');
    addRoad(14, 16, 12, -10.4 * k, 100, 0.36, 'ruin');
    addRoad(12, 24, 10, 7.6 * k, 20, 0.2, 'ruin');
    addRoad(10, 40, 10, 0, 0, 0, 'forest');

    G.trackLen = segs.length * SEG;
    G.packOn = false;
    G.packNeed = 0;
    G.packDown = 0;
    G.kingDead = false;
    placeSprites();
    placeCars();
    buildMinimap();
  }

  function placeSprites() {
    const n = segs.length;
    for (let i = 4; i < n - 6; i += 3) {
      const r = hash2(i * 17 + 5);
      const side = hash2(i * 3 + 9) > 0.5 ? 1 : -1;
      const dist = 1.16 + hash2(i + 11) * 1.28;
      const zone = segs[i].zone;
      if (zone === 'forest') {
        if (r > 0.08) addSprite(i, -dist - 0.08, r > 0.78 ? 'pine' : 'tree', 720 + (r * 220) | 0, 240);
        if (r > 0.28) addSprite(i, dist + 0.1, r > 0.72 ? 'pine' : 'tree', 680 + (r * 180) | 0, 220);
        if ((i % 9) === 0) addSprite(i, side * 1.06, 'lamp', 540, 46);
        if (i < n * 0.16 && (i % 12) === 2) addSprite(i, -1.18, 'stand', 520 + (r * 140) | 0, 480);
        if (i < n * 0.16 && (i % 18) === 4) addSprite(i, 1.14, 'crowd', 260, 380);
      } else if (zone === 'bridge') {
        if ((i % 6) === 0) addSprite(i, -1.32, 'pylon', 980, 160);
        if ((i % 6) === 3) addSprite(i, 1.32, 'pylon', 980, 160);
        if ((i % 8) === 0) addSprite(i, side * 1.08, 'lamp', 500, 44);
        if (r > 0.72) addSprite(i, side * (1.7 + r * 0.4), 'boat', 180, 320);
      } else {
        if (r > 0.12) addSprite(i, -dist - 0.04, r > 0.7 ? 'temple' : 'column', r > 0.7 ? 640 : 820, r > 0.7 ? 380 : 110);
        if (r > 0.38) addSprite(i, dist + 0.08, r > 0.82 ? 'wall' : 'column', r > 0.82 ? 280 : 760, r > 0.82 ? 340 : 100);
        if ((i % 7) === 0) addSprite(i, side * 1.04, 'lamp', 500, 42);
      }
    }
    addSprite(2, -1.12, 'pillar', 1280, 130);
    addSprite(2, 1.12, 'pillar', 1280, 130);
    addSprite(2, 0, 'check', 460, 860);
    addSprite(n - 4, -1.12, 'pillar', 1280, 130);
    addSprite(n - 4, 1.12, 'pillar', 1280, 130);
    addSprite(n - 4, 0, 'goal', 480, 880);
  }

  function carColor(h) {
    if (h < 0.14) return [232, 42, 48];
    if (h < 0.28) return [36, 92, 232];
    if (h < 0.42) return [244, 214, 48];
    if (h < 0.56) return [32, 196, 96];
    if (h < 0.7) return [236, 240, 246];
    if (h < 0.84) return [255, 72, 168];
    return [0, 214, 198];
  }

  function placeCars() {
    const n = isDense() ? 16 : 11;
    const max = baseMax();
    const pz = G.z + PLAYER_Z;
    for (let i = 0; i < n; i++) {
      const z = pz + (44 + i * 42 + hash2(i * 13) * 28) * SEG;
      cars.push({
        z: z,
        offset: (hash2(i * 19 + 3) - 0.5) * 1.16,
        spd: max * (0.4 + hash2(i + 8) * 0.38),
        col: carColor(hash2(i * 17 + 2)),
        num: String((i + 2) % 99 || 7),
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

  function spawnLastPack() {
    if (G.packOn) return;
    G.packOn = true;
    const n = isDense() ? 10 : 7;
    const pz = G.z + PLAYER_Z;
    const max = baseMax();
    G.packNeed = n;
    G.packDown = 0;
    for (let i = 0; i < n; i++) {
      const isBoss = i === 0;
      cars.push({
        z: pz + 2000 + i * 340 + rand(0, 80),
        offset: isBoss ? 0.06 : ((i % 3) - 1) * 0.42 + rand(-0.05, 0.05),
        spd: max * (isBoss ? 0.64 : 0.5 + i * 0.015),
        col: isBoss ? GOLD : (i & 1 ? SUN : MAG),
        num: isBoss ? '00' : String(20 + i),
        passed: false,
        wob: rand(0, TAU),
        near: false,
        boss: isBoss,
        pack: true,
        hp: isBoss ? (isDense() ? 4 : 3) : 1,
        dead: false,
        hitT: 0
      });
    }
    audio.pack();
    hitStop(0.055);
    kick(4.4);
    screenFlash(SUN, 0.42);
    toast('终段 · 赛团', false, true);
    setHint('终段车团 · 吸力贴尾再喷出去', 'hot');
    if (stageLabel) stageLabel.classList.add('boss');
  }

  function palette() {
    if (isDense()) {
      return {
        skyTop: [4, 10, 22],
        skyMid: [8, 28, 48],
        skyHor: [18, 72, 92],
        fog: [16, 48, 62],
        lg: [10, 28, 32], lg2: [8, 22, 28],
        rg: [12, 24, 36], rg2: [8, 18, 28],
        road: [28, 34, 42], road2: [36, 42, 52],
        rumble: [255, 61, 122], rumble2: [232, 251, 255],
        lane: [180, 240, 236],
        sun: [90, 220, 255],
        mtn1: [12, 28, 42], mtn2: [8, 18, 28],
        sea: [8, 32, 58]
      };
    }
    return {
      skyTop: [6, 22, 32],
      skyMid: [12, 68, 82],
      skyHor: [48, 168, 172],
      fog: [90, 196, 188],
      lg: [28, 92, 72], lg2: [22, 78, 62],
      rg: [36, 64, 92], rg2: [28, 52, 78],
      road: [36, 42, 50], road2: [46, 52, 62],
      rumble: [0, 228, 208], rumble2: [232, 251, 255],
      lane: [200, 246, 240],
      sun: [90, 255, 239],
      mtn1: [18, 52, 48], mtn2: [12, 36, 40],
      sea: [18, 78, 108]
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
      o2.type = 'triangle';
      const o3 = this.ctx.createOscillator();
      o3.type = 'square';
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 920;
      f.Q.value = 2.4;
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
      const boost = G.boostOn ? 1.28 : G.drafting ? 1.12 : 1;
      const pulse = Math.sin(G.t * (18 + spd01 * 22)) * (3 + spd01 * 12);
      const f = (86 + spd01 * 188 + pulse) * boost;
      this.eng.frequency.setTargetAtTime(f, t, 0.035);
      this.eng2.frequency.setTargetAtTime(f * 2.02, t, 0.035);
      this.eng3.frequency.setTargetAtTime(f * 0.5, t, 0.035);
      this.engF.frequency.setTargetAtTime(520 + spd01 * 1680 + (G.boostOn ? 420 : 0), t, 0.06);
      const crashMul = G.crashT > 0 ? 0.28 : 1;
      const vol = (0.028 + spd01 * 0.072 + (G.boostOn ? 0.032 : 0) + (G.drafting ? 0.014 : 0)) * crashMul;
      this.engG.gain.setTargetAtTime(this.muted ? 0 : vol, t, 0.05);
    },
    sting() {
      this.beep(392, 0.07, 'square', 0.07, 784);
      this.beep(523, 0.11, 'triangle', 0.05);
      this.beep(784, 0.16, 'square', 0.045);
    },
    lap() {
      this.beep(587, 0.1, 'square', 0.085);
      this.beep(740, 0.12, 'triangle', 0.07);
      this.beep(880, 0.18, 'square', 0.06, 1174);
    },
    crash() {
      this.noise(0.28, 0.24, 220);
      this.beep(160, 0.24, 'sawtooth', 0.11, 48);
      this.beep(86, 0.32, 'square', 0.055, 38);
    },
    hit(combo) {
      const lift = 1 + Math.min(0.6, combo * 0.042);
      this.noise(0.034, 0.032, 1400);
      this.beep(480 * lift, 0.05, 'square', 0.04, 960 * lift);
    },
    boom(big) {
      this.noise(big ? 0.26 : 0.11, big ? 0.086 : 0.048, big ? 180 : 380);
      this.beep(big ? 126 : 230, big ? 0.32 : 0.13, 'sawtooth', 0.054, 42);
    },
    combo(m) {
      this.beep(440 * m, 0.07, 'sine', 0.038, 660 * m);
      this.beep(554 * m, 0.1, 'triangle', 0.032, 880 * m);
    },
    overtake(n) {
      const f = 494 + Math.min(8, n) * 62;
      this.beep(f, 0.08, 'square', 0.065, f * 1.72);
      this.beep(f * 0.5, 0.1, 'triangle', 0.03);
    },
    near() {
      this.beep(980, 0.042, 'square', 0.036, 1320);
    },
    gear() {
      this.beep(220, 0.045, 'square', 0.04, 520);
    },
    boostOn() {
      this.noise(0.08, 0.05, 860);
      this.beep(210, 0.11, 'sawtooth', 0.05, 720);
      this.beep(880, 0.08, 'square', 0.03, 1480);
    },
    draft() {
      this.beep(310, 0.09, 'sine', 0.03, 740);
      this.noise(0.06, 0.026, 1100);
    },
    empty() {
      this.beep(140, 0.08, 'square', 0.03, 68);
    },
    pack() {
      this.beep(82, 0.26, 'sawtooth', 0.06, 48);
      this.beep(138, 0.34, 'square', 0.04, 72);
      this.beep(360, 0.12, 'square', 0.04, 720);
    },
    warn() {
      this.beep(920, 0.08, 'square', 0.075);
      this.beep(690, 0.1, 'square', 0.05);
    },
    win() {
      this.beep(523, 0.12, 'square', 0.08);
      this.beep(659, 0.14, 'triangle', 0.07);
      this.beep(784, 0.18, 'square', 0.07);
      this.beep(1046, 0.28, 'triangle', 0.06);
    },
    lose() {
      this.beep(196, 0.32, 'sawtooth', 0.085, 64);
      this.noise(0.22, 0.12, 340);
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
        g: spec.g || 0,
        poly: !!spec.poly,
        rot: rand(0, TAU),
        rv: rand(-10, 10)
      });
    }
    if (particles.length > 280) particles.splice(0, particles.length - 280);
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
    ovKicker.textContent = kind === 'win' ? 'CHECKER' : kind === 'lose' ? 'TIME UP' : 'VRAC';
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
    const shownLap = Math.min(G.laps, (G.mode === 'play' ? lapsNow() : 0) + 1);
    if (stageLabel) {
      stageLabel.textContent = '圈 ' + shownLap + '/' + G.laps;
      stageLabel.classList.toggle('hot', onLastLap() && G.mode === 'play');
      stageLabel.classList.toggle('boss', G.mode === 'play' && G.packOn);
    }
    if (tagLabel) {
      tagLabel.textContent = G.boostOn ? '喷' : G.drafting ? '吸' : modeName();
      tagLabel.classList.toggle('hot', G.boostOn);
      tagLabel.classList.toggle('draft', G.drafting && !G.boostOn);
      tagLabel.classList.toggle('warn', isDense() && !G.boostOn && !G.drafting);
    }
    if (timeBox) timeBox.classList.toggle('low', G.mode === 'play' && G.time < 10);
    if (timeBar) {
      const t = clamp(G.time / Math.max(1, G.timeCap), 0, 1);
      timeBar.style.transform = 'scaleX(' + t + ')';
    }
    if (timeWrap) timeWrap.classList.toggle('low', G.mode === 'play' && G.time < 10);
    if (draftBar) draftBar.style.transform = 'scaleX(' + clamp(G.draft, 0, 1) + ')';
    if (draftWrap) {
      draftWrap.classList.toggle('on', G.boostOn);
      draftWrap.classList.toggle('draft', G.drafting && !G.boostOn);
      draftWrap.classList.toggle('low', G.draft < 0.2 && G.mode === 'play' && !G.drafting);
    }
    if (btnBoost) {
      btnBoost.classList.toggle('on', G.boostOn);
      btnBoost.classList.toggle('ready', G.draft > 0.35 && !G.boostOn);
    }
    if (comboEl) {
      const show = G.mode === 'play' && (G.combo > 1 || G.flowN > 2 || G.drafting);
      comboEl.hidden = !show;
      if (show) {
        if (G.combo > 1) comboEl.textContent = '连击 ×' + G.combo + (G.mult > 1 ? ' ·' + G.mult + '倍' : '');
        else if (G.drafting) comboEl.textContent = '吸力';
        else comboEl.textContent = '疾风 ×' + G.flowN;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'win') setHint('R 再冲 · 多边形圈满冲线', 'hot');
    else if (G.mode === 'lose') setHint('R 重开 · 贴尾吸力再喷，超时才结束', 'warn');
    else if (G.time < 10) setHint('时间将尽 · 过线加时', 'warn');
    else if (G.crashT > 0.4) setHint('复原中 · 油门起来再贴尾', 'warn');
    else if (G.packOn) setHint('终段车团 · Shift 喷出去撞开', 'hot');
    else if (G.drafting) setHint('吸力中 · 贴着再超，槽满就喷', 'hot');
    else setHint('← → 转向 · ↑ 油门 · Shift 喷 · 贴尾吸力 · R 重开', '');
  }

  function resetRunVars() {
    G.z = 80;
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
    G.draft = 0.42;
    G.boostOn = false;
    G.drafting = false;
    G.draftCar = null;
    G.ending = '';
    G.endT = 0;
    G.off = false;
    G.lapDone = 0;
    G.laps = LAPS;
    G.packOn = false;
    G.kingDead = false;
    G.packNeed = 0;
    G.packDown = 0;
    G.emptyT = 0;
    G.place = 8;
    particles.length = 0;
    floats.length = 0;
    smears.length = 0;
    rings.length = 0;
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'core';
    G.score = 0;
    G.time = startTime();
    G.timeCap = G.time;
    resetRunVars();
    G.z = 0;
    G.spd = baseMax() * 0.6;
    buildCircuit();
    showOverlay('title', '虚赛', '进屏多边形。贴尾吸力，喷出去超车。圈满之后是终段车团。');
    hud();
  }

  function startGame(kind) {
    audio.ensure();
    G.kind = kind === 'dense' ? 'dense' : 'core';
    G.mode = 'play';
    G.score = 0;
    G.time = startTime();
    G.timeCap = G.time;
    resetRunVars();
    G.spd = baseMax() * 0.32;
    G.flash = 0.4;
    G.flashRgb = isDense() ? CYN : SUN;
    G.stop = 0;
    G.shake = 0;
    buildCircuit();
    hideOverlay();
    audio.sting();
    toast(modeName() + (isDense() ? ' · 更密更快' : ' · 贴尾喷出'), false, true);
    hud();
  }

  function addCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.comboMax) G.comboMax = G.combo;
    G.mult = comboMult();
    popCombo();
    if (G.combo === 3) toast('连击 ×3', false, true);
    if (G.combo === 6) toast('连击 ×6 · 虚爆', false, true);
    if (G.combo === 10) toast('连击 ×10 · 虚王', false, true);
  }

  function onOvertake(car) {
    addCombo();
    const draftBonus = G.drafting || G.boostOn ? 1.32 : 1;
    const n = (85 * G.combo * G.mult * draftBonus) | 0;
    bumpScore(n);
    floatText(CX + car.offset * 80, VH * 0.6, (G.drafting ? '吸超 ×' : '超车 ×') + G.combo, G.drafting ? CYN : GOLD);
    audio.overtake(G.combo);
    if (G.combo >= 3) {
      hitStop(0.034);
      kick(2.6);
      screenFlash(CYN, 0.16);
    }
    emit(10, {
      x: CX + car.offset * 90, y: VH * 0.68, j: 14,
      vx0: -90, vx1: 90, vy0: -50, vy1: 70,
      r0: 1.4, r1: 3.2, life: 0.32, rgb: car.col, poly: true
    });
  }

  function ramCar(c) {
    const sx = CX + (c.offset - G.x) * 110;
    const sy = VH * 0.62;
    audio.hit(G.combo + 1);
    c.hitT = 0.42;
    c.z += 260;
    if (c.hp > 1) {
      c.hp -= 1;
      c.offset += (G.x >= c.offset ? -1 : 1) * 0.3;
      addCombo();
      const n = (110 * G.combo * G.mult) | 0;
      bumpScore(n);
      floatText(sx, sy, '顶 ' + c.hp, GOLD);
      hitStop(0.038);
      kick(3.6);
      screenFlash(GOLD, 0.28);
      emit(18, {
        x: sx, y: sy, j: 18,
        vx0: -180, vx1: 180, vy0: -140, vy1: 40,
        r0: 1.6, r1: 3.8, life: 0.36, rgb: GOLD, poly: true
      });
      burstRing(sx, sy, GOLD, 12);
      toast(c.boss ? '虚王还在 · 再顶' : '顶开一层', false, true);
      return;
    }
    c.dead = true;
    c.passed = true;
    addCombo();
    const big = !!c.boss;
    const n = ((big ? 500 : 170) * G.combo * G.mult) | 0;
    bumpScore(n);
    floatText(sx, sy - 8, big ? '虚王击破 ×' + G.combo : '爆虚 ×' + G.combo, big ? GOLD : SUN);
    audio.boom(big);
    audio.combo(G.mult);
    hitStop(big ? 0.078 : 0.048);
    kick(big ? 7.6 : 5);
    screenFlash(big ? GOLD : SUN, big ? 0.62 : 0.42);
    emit(big ? 46 : 30, {
      x: sx, y: sy, j: 28,
      vx0: -280, vx1: 280, vy0: -240, vy1: 80,
      r0: 2, r1: 6.2, life: 0.55, rgb: c.col, poly: true
    });
    emit(14, {
      x: sx, y: sy, j: 12,
      vx0: -90, vx1: 90, vy0: -180, vy1: -20,
      r0: 1, r1: 2.8, life: 0.4, rgb: WHT
    });
    burstRing(sx, sy, SUN, big ? 22 : 14);
    burstRing(sx, sy, GOLD, big ? 10 : 6);
    if (c.pack) {
      G.packDown += 1;
      if (c.boss) {
        G.kingDead = true;
        toast('虚王爆了', false, true);
      }
    }
  }

  function crash(kind, other) {
    if (G.crashT > 0.18) return;
    G.crashT = 1.42;
    G.bounce = 1;
    G.spd *= kind === 'off' ? 0.2 : 0.16;
    G.boostOn = false;
    if (other) {
      const dir = G.x >= other.offset ? 1 : -1;
      G.x += dir * 0.32;
    } else {
      G.x = clamp(G.x * 0.5, -0.82, 0.82);
    }
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.flowN = 0;
    G.flow = 0;
    G.drafting = false;
    audio.crash();
    hitStop(0.07);
    kick(8);
    screenFlash(MAG, 0.6);
    emit(36, {
      x: CX, y: VH - 64, j: 32,
      vx0: -260, vx1: 260, vy0: -210, vy1: 50,
      r0: 2, r1: 6, life: 0.55, rgb: RED, poly: true
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
        r0: 1.5, r1: 3.4, life: 0.4, rgb: [70, 140, 110]
      });
      toast('冲出 · 减速复原', true, false);
    } else {
      toast('撞车 · 减速复原', true, false);
    }
  }

  function onLap() {
    const add = lapTime();
    G.time += add;
    G.timeCap = Math.max(G.timeCap, G.time);
    const bonus = 850 + ((G.time * 8) | 0) + G.combo * 50;
    bumpScore(bonus);
    G.draft = Math.min(1, G.draft + 0.24);
    audio.lap();
    hitStop(0.05);
    kick(4.2);
    screenFlash(GOLD, 0.55);
    floatText(CX, VH * 0.4, '+' + add + '″', GOLD);
    const next = G.lapDone + 1;
    if (next >= G.laps) {
      toast('末圈', false, true);
    } else {
      toast('第 ' + next + ' 圈  ·  +' + add + '″', false, true);
    }
    emit(26, {
      x: CX, y: HORIZON + 40, j: 90,
      vx0: -150, vx1: 150, vy0: -70, vy1: 90,
      r0: 2, r1: 4.6, life: 0.55, rgb: GOLD, poly: true
    });
    hud();
  }

  function finish(why) {
    if (G.mode !== 'play') return;
    G.ending = '';
    if (why === 'win') {
      const bonus = 3000 + ((G.time * 80) | 0) + G.comboMax * 40;
      bumpScore(bonus);
      maybeBest();
      G.mode = 'win';
      audio.win();
      hitStop(0.08);
      screenFlash(GOLD, 0.7);
      showOverlay('win', '冲线', modeName() + ' ' + G.laps + ' 圈到齐　·　' + (G.score | 0) + ' 分');
    } else {
      maybeBest();
      G.mode = 'lose';
      audio.lose();
      kick(6);
      const shown = Math.min(G.laps, G.lapDone + 1);
      showOverlay('lose', '时间到', '冲到第 ' + shown + ' 圈　·　' + (G.score | 0) + ' 分。撞车不会出局，超时才会。');
    }
    hud();
  }

  function wantBoost() {
    if (G.mode !== 'play' || G.crashT > 0) return false;
    if (keys.t || G.boostHold) return true;
    if (inputSrc === 'ptr' && pointer.down && pointer.y < VH * 0.34) return true;
    return false;
  }

  function updateCars(dt) {
    const pz = G.z + PLAYER_Z;
    const finishZ = G.laps * G.trackLen;
    const spd01 = clamp(G.spd / baseMax(), 0, 1.4);
    let ahead = 0;
    let draftBest = null;
    let draftDz = 99999;
    const wasDraft = G.drafting;

    for (let i = cars.length - 1; i >= 0; i--) {
      const c = cars[i];
      if (c.dead) {
        c.z += c.spd * dt * 0.18;
        c.offset += (c.offset >= 0 ? 1 : -1) * dt * 1.5;
        if (c.z < pz - 900 || Math.abs(c.offset) > 2.4) cars.splice(i, 1);
        continue;
      }
      c.hitT = Math.max(0, (c.hitT || 0) - dt);
      c.z += c.spd * dt;
      if (c.pack && c.z > finishZ - 1400) {
        c.z = Math.min(c.z, finishZ - 1400);
        c.spd = Math.min(c.spd, Math.max(G.spd * 0.72, baseMax() * 0.22));
      }
      c.wob += dt * (c.boss ? 2.8 : 2.0);
      if (c.boss && G.mode === 'play') {
        const aim = clamp(G.x * 0.78, -0.72, 0.72);
        c.offset = lerp(c.offset, aim, 1 - Math.pow(0.2, dt));
      } else if (c.pack) {
        c.offset += Math.sin(c.wob * 0.7 + i) * dt * 0.16;
        c.offset = clamp(c.offset, -0.82, 0.82);
      } else {
        c.offset += Math.sin(c.wob + i) * dt * 0.08;
        c.offset = clamp(c.offset, -0.86, 0.86);
      }
      const dz = c.z - pz;
      if (dz > 0) ahead += 1;
      if (dz > 80 && dz < 2400 && Math.abs(c.offset - G.x) < 0.24 && G.crashT <= 0) {
        if (dz < draftDz) {
          draftDz = dz;
          draftBest = c;
        }
      }
      if (!c.passed && pz > c.z + 40 && pz - c.z < 720) {
        c.passed = true;
        if (G.mode === 'play' && G.crashT <= 0) onOvertake(c);
      }
      const adz = Math.abs(dz);
      const dx = Math.abs(c.offset - G.x);
      if (G.mode === 'play' && G.crashT <= 0 && G.ending === '' && c.hitT <= 0) {
        if (adz < 200 && dx < 0.3) {
          if ((G.boostOn || (G.drafting && spd01 > 0.62)) && spd01 > 0.36) ramCar(c);
          else crash('car', c);
        } else if (adz < 270 && dx < 0.46 && !c.near) {
          c.near = true;
          audio.near();
          emit(6, {
            x: CX + (c.offset - G.x) * 90, y: VH - 80, j: 8,
            vx0: -40, vx1: 40, vy0: -30, vy1: 40,
            r0: 1, r1: 2.2, life: 0.22, rgb: CYN
          });
        }
      }
      if (!c.pack && c.z < pz - 1800) {
        const aheadZ = pz + 2600 + rand(0, 4200);
        if (!(onLastLap() && aheadZ > finishZ - 800)) {
          c.z = aheadZ;
          c.offset = rand(-0.78, 0.78);
          c.passed = false;
          c.near = false;
          c.col = carColor(Math.random());
          c.hp = 1;
          c.dead = false;
          c.hitT = 0;
        }
      }
    }

    G.place = 1 + ahead;
    G.draftCar = draftBest;
    G.drafting = !!(draftBest && G.mode === 'play' && G.crashT <= 0 && !G.off);
    if (G.drafting && !wasDraft) {
      audio.draft();
      toast('吸力', false, true);
      emit(10, {
        x: CX, y: VH * 0.7, j: 16,
        vx0: -40, vx1: 40, vy0: 20, vy1: 80,
        r0: 1.2, r1: 2.6, life: 0.28, rgb: CYN
      });
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
      p.rot += (p.rv || 0) * dt;
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
    const want = clamp(-seg.curve * 0.14, -0.78, 0.78);
    G.lean = lerp(G.lean, want, 1 - Math.pow(0.012, dt));
    G.x += (want * 0.55 - G.x) * 2.2 * dt;
    G.x = clamp(G.x, -0.82, 0.82);
    G.spd = lerp(G.spd, baseMax() * 0.68, 1 - Math.pow(0.08, dt));
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
      G.kmh = (G.spd / baseMax()) * kmhMax();
      G.lean = lerp(G.lean, 0, 1 - Math.pow(0.02, dt));
      G.boostOn = false;
      G.drafting = false;
      return;
    }

    if (demo) autoDemo(dt);

    const wantB = wantBoost();
    if (playing) {
      if (wantB && G.draft > 0.06) {
        if (!G.boostOn) audio.boostOn();
        G.boostOn = true;
        G.draft = Math.max(0, G.draft - boostDrain() * dt);
        if (G.draft <= 0) {
          G.draft = 0;
          G.boostOn = false;
          if (G.emptyT <= 0) {
            G.emptyT = 0.7;
            audio.empty();
            toast('喷空了', true, false);
          }
        }
      } else {
        G.boostOn = false;
        if (G.drafting && !wantB) G.draft = Math.min(1, G.draft + draftFill() * dt);
        else if (!wantB) G.draft = Math.min(1, G.draft + 0.08 * dt);
      }
    } else {
      G.boostOn = false;
    }

    const seg = findSeg(G.z + PLAYER_Z);
    const dx = dt * (isDense() ? 2.42 : 2.08) * Math.max(0.22, Math.min(1, spd01));

    let steer = 0;
    if (!demo) {
      if (keys.l) steer -= 1;
      if (keys.r) steer += 1;
      if (inputSrc === 'ptr' && pointer.down) {
        const tx = (pointer.x - CX) / (CX * 0.68);
        steer = clamp(tx * 1.4, -1, 1);
      }
      if (G.crashT > 0) steer *= 0.26;
      if (G.boostOn) steer *= 1.06;
    }

    if (!demo) {
      G.lean = lerp(G.lean, steer, 1 - Math.pow(isDense() ? 0.012 : 0.0006, dt));
      G.x += G.lean * dx * (G.off ? 0.58 : 1);
      const outer = seg.curve < 0 ? clamp(G.x, 0, 1) : clamp(-G.x, 0, 1);
      const bankCut = 1 - (seg.bank || 0) * 0.5 * outer;
      G.x -= dx * Math.min(1, spd01) * seg.curve * centrif() * bankCut;
    }
    if (G.crashT > 0) G.x += (0 - G.x) * 2.2 * dt;
    G.x = clamp(G.x, -2.12, 2.12);
    G.steerVis = lerp(G.steerVis, G.lean, 1 - Math.pow(0.0007, dt));
    G.curveMem = lerp(G.curveMem, seg.curve * Math.min(1, spd01), 1 - Math.pow(0.04, dt));
    G.bankMem = lerp(G.bankMem, (seg.bank || 0) * Math.min(1, spd01), 1 - Math.pow(0.05, dt));

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
    if (G.off && G.spd > baseMax() * 0.32) G.spd += offDecel() * dt;
    if (G.off && playing && Math.random() < 0.42) {
      emit(1, {
        x: CX + G.lean * 22, y: VH - 34, j: 10,
        vx0: -50, vx1: 50, vy0: -12, vy1: 28,
        r0: 1, r1: 2.3, life: 0.22, rgb: [70, 140, 110]
      });
    }
    G.spd = clamp(G.spd, 0, max);
    G.z += G.spd * dt;
    if (G.z < 0) G.z = 0;

    G.kmh = clamp(G.spd / baseMax(), 0, 1.55) * (isDense() ? 286 : 262);
    if (G.boostOn) G.kmh = Math.min(kmhMax(), G.kmh * 1.18);
    else if (G.drafting) G.kmh = Math.min(kmhMax(), G.kmh * 1.08);

    const gear = spd01 < 0.2 ? 1 : spd01 < 0.46 ? 2 : spd01 < 0.72 ? 3 : 4;
    if (gear > G.gear && playing) audio.gear();
    G.gear = gear;

    if (playing && G.crashT <= 0) {
      if (G.off && spd01 > 0.38) crash('off');
      else if (Math.abs(G.x) > 1.52) crash('off');
    }

    if (playing && spd01 > 0.8 && !G.off && G.crashT <= 0) {
      G.flow += dt;
      const gap = G.boostOn ? 0.48 : G.drafting ? 0.56 : 0.64;
      if (G.flow >= gap) {
        G.flow = 0;
        G.flowN += 1;
        bumpScore((G.boostOn ? 42 : 28) + G.flowN * 6);
        if (G.flowN === 4) toast(G.boostOn ? '喷疾风' : G.drafting ? '吸疾风' : '疾风', false, true);
        if (G.flowN === 8) toast('爆走', false, true);
        if (G.flowN === 12) toast('极速', false, true);
      }
    } else {
      G.flow = 0;
      if (G.crashT > 0 || G.off) G.flowN = 0;
    }

    if (spd01 > 0.48 && !REDUCE) {
      if (smears.length < (G.boostOn ? 28 : 20) && Math.random() < 0.58) {
        smears.push({
          x: rand(0, VW),
          y: rand(HORIZON + 8, VH),
          len: rand(16, 80) * Math.min(1.2, spd01),
          a: rand(0.08, 0.26) * Math.min(1.2, spd01),
          v: 900 + spd01 * 1600,
          lean: G.lean,
          turbo: G.boostOn,
          draft: G.drafting
        });
      }
    }
    for (let i = smears.length - 1; i >= 0; i--) {
      smears[i].y += smears[i].v * dt * 0.28;
      smears[i].x += smears[i].lean * 150 * dt;
      smears[i].a -= dt * 0.78;
      if (smears[i].a <= 0 || smears[i].y > VH + 10) smears.splice(i, 1);
    }

    if (G.boostOn && playing && G.crashT <= 0 && Math.random() < 0.58) {
      emit(1, {
        x: CX - G.lean * 16 + rand(-8, 8), y: VH - 22, j: 4,
        vx0: -30, vx1: 30, vy0: 20, vy1: 80,
        r0: 1.4, r1: 3.2, life: 0.22, rgb: Math.random() > 0.5 ? CYN : GOLD
      });
    } else if (G.drafting && playing && Math.random() < 0.28) {
      emit(1, {
        x: CX - G.lean * 10 + rand(-10, 10), y: VH - 36, j: 6,
        vx0: -16, vx1: 16, vy0: 8, vy1: 36,
        r0: 1, r1: 2.2, life: 0.2, rgb: CYN
      });
    } else if (spd01 > 0.55 && playing && G.crashT <= 0 && Math.random() < 0.16) {
      emit(1, {
        x: CX - G.lean * 18 + rand(-8, 8), y: VH - 28, j: 4,
        vx0: -20, vx1: 20, vy0: 10, vy1: 40,
        r0: 1, r1: 2, life: 0.18, rgb: HOT
      });
    }

    updateCars(dt);

    if (playing && !G.packOn && onLastLap() && lapFrac() > 0.7) {
      spawnLastPack();
    }

    if (playing) {
      const done = lapsNow();
      if (done > G.lapDone) {
        G.lapDone = done;
        if (G.lapDone >= G.laps) {
          finish('win');
        } else {
          onLap();
        }
      }
    }

    if (G.mode === 'play' && G.ending === '') {
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
    g.addColorStop(0.48, rgba(pal.skyMid, 1));
    g.addColorStop(1, rgba(pal.skyHor, 1));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, HORIZON + 22);

    if (isDense()) {
      for (let i = 0; i < 40; i++) {
        const hx = hash2(i * 19 + 3);
        const hy = hash2(i * 23 + 7);
        ctx.fillStyle = rgba(WHT, 0.18 + hash2(i) * 0.5);
        ctx.fillRect((hx * VW + G.curveMem * 2) % VW, hy * (HORIZON - 8), 1.4, 1.4);
      }
    }

    const sunX = CX + 176 - G.x * 14 - G.curveMem * 8;
    const sunY = HORIZON * (isDense() ? 0.38 : 0.48);
    const sunR = isDense() ? 12 : 20;
    const sg = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, 72);
    sg.addColorStop(0, rgba(pal.sun, 0.95));
    sg.addColorStop(0.28, rgba(pal.sun, 0.48));
    sg.addColorStop(1, rgba(pal.sun, 0));
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 72, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(isDense() ? [140, 220, 255] : pal.sun, 1);
    ctx.beginPath();
    ctx.moveTo(sunX, sunY - sunR);
    ctx.lineTo(sunX + sunR * 0.86, sunY + sunR * 0.5);
    ctx.lineTo(sunX - sunR * 0.86, sunY + sunR * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(pal.sea, 1);
    ctx.fillRect(0, HORIZON - 2, VW, 16);
    ctx.fillStyle = rgba(mix(pal.sea, WHT, 0.18), 0.32);
    ctx.fillRect(0, HORIZON + 4, VW, 4);
  }

  function drawMountains(pal) {
    const drift = -G.x * 36 + G.curveMem * 10;
    function layer(rgb, base, amp, par, seed) {
      ctx.fillStyle = rgba(rgb, 1);
      ctx.beginPath();
      ctx.moveTo(-20, HORIZON + 8);
      for (let i = 0; i <= 14; i++) {
        const px = (i / 14) * (VW + 40) - 20 + drift * par;
        const h = hash2(seed + i) * amp + hash2(seed + i * 3) * amp * 0.35;
        ctx.lineTo(px, HORIZON - base - h);
      }
      ctx.lineTo(VW + 20, HORIZON + 8);
      ctx.closePath();
      ctx.fill();
    }
    layer(pal.mtn1, 28, 48, 0.3, 41);
    layer(pal.mtn2, 10, 24, 0.58, 53);
  }

  function drawOneRoad(p1, p2, pal, alt, fog, bank) {
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
    if ((G.boostOn || G.drafting) && !alt) {
      const sh = mix(G.boostOn ? GOLD : CYN, pal.fog, 0.45);
      quad(x1 - w1 * 0.07, p1.y, x1 + w1 * 0.07, p1.y, x2 + w2 * 0.07, p2.y, x2 - w2 * 0.07, p2.y, sh, G.boostOn ? 0.18 : 0.12);
    }
    if (bank > 0.28) {
      const hi = mix(SUN, pal.fog, 0.55);
      quad(x1 + w1 * 0.5, p1.y, x1 + w1, p1.y, x2 + w2, p2.y, x2 + w2 * 0.5, p2.y, hi, 0.1 * bank);
    }
    if (!alt) {
      const lw1 = Math.max(1, w1 * 0.016);
      const lw2 = Math.max(0.8, w2 * 0.016);
      const lanes = [-0.5, 0, 0.5];
      for (let k = 0; k < lanes.length; k++) {
        const o = lanes[k];
        quad(x1 + w1 * o - lw1, p1.y, x1 + w1 * o + lw1, p1.y, x2 + w2 * o + lw2, p2.y, x2 + w2 * o - lw2, p2.y, ln);
      }
    }
  }

  function clipSprite(y, h, clip) {
    if (y >= clip) return 0;
    if (y + h > clip) return clip - y;
    return h;
  }

  function drawScenery(spr, p, clip) {
    const destH = spr.h * p.s * CX * 0.00115;
    const destW = spr.w * p.s * CX * 0.00115;
    const x = p.x + spr.o * p.w;
    const y0 = p.y;
    const w = destW;
    const vis = clipSprite(y0 - destH, destH, clip);
    if (vis <= 1 || w < 1) return;
    const y = y0 - destH;
    const h = destH;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VW, clip);
    ctx.clip();

    if (spr.k === 'tree' || spr.k === 'pine') {
      ctx.fillStyle = rgba([62, 42, 28], 1);
      ctx.fillRect(x - w * 0.08, y + h * 0.48, w * 0.16, h * 0.52);
      const leaf = isDense() ? [18, 78, 58] : [28, 128, 78];
      ctx.fillStyle = rgba(leaf, 1);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - w * 0.48, y + h * 0.58);
      ctx.lineTo(x + w * 0.48, y + h * 0.58);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(mix(leaf, WHT, 0.18), 1);
      ctx.beginPath();
      ctx.moveTo(x, y + h * 0.08);
      ctx.lineTo(x - w * 0.28, y + h * 0.42);
      ctx.lineTo(x + w * 0.12, y + h * 0.42);
      ctx.closePath();
      ctx.fill();
    } else if (spr.k === 'pylon') {
      ctx.fillStyle = rgba([48, 62, 78], 1);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.22, y + h);
      ctx.lineTo(x - w * 0.1, y);
      ctx.lineTo(x + w * 0.1, y);
      ctx.lineTo(x + w * 0.22, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(SUN, 0.55);
      ctx.fillRect(x - w * 0.28, y, w * 0.56, h * 0.06);
    } else if (spr.k === 'column') {
      ctx.fillStyle = rgba([168, 156, 132], 1);
      ctx.fillRect(x - w * 0.28, y + h * 0.08, w * 0.56, h * 0.84);
      ctx.fillStyle = rgba([210, 198, 168], 1);
      ctx.fillRect(x - w * 0.4, y, w * 0.8, h * 0.1);
      ctx.fillRect(x - w * 0.36, y + h * 0.9, w * 0.72, h * 0.1);
    } else if (spr.k === 'temple') {
      ctx.fillStyle = rgba([148, 132, 108], 1);
      ctx.fillRect(x - w * 0.42, y + h * 0.38, w * 0.84, h * 0.62);
      ctx.fillStyle = rgba([196, 176, 132], 1);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - w * 0.5, y + h * 0.4);
      ctx.lineTo(x + w * 0.5, y + h * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.45);
      ctx.fillRect(x - w * 0.08, y + h * 0.52, w * 0.16, h * 0.48);
    } else if (spr.k === 'wall') {
      ctx.fillStyle = rgba([120, 108, 88], 1);
      ctx.fillRect(x - w * 0.5, y + h * 0.35, w, h * 0.65);
      ctx.fillStyle = rgba([90, 80, 64], 1);
      ctx.fillRect(x - w * 0.18, y + h * 0.2, w * 0.12, h * 0.2);
    } else if (spr.k === 'stand') {
      ctx.fillStyle = rgba(isDense() ? [16, 28, 36] : [22, 48, 52], 1);
      ctx.fillRect(x - w * 0.5, y + h * 0.28, w, h * 0.72);
      ctx.fillStyle = rgba(SUN, 0.5);
      ctx.fillRect(x - w * 0.48, y + h * 0.18, w * 0.96, h * 0.12);
      for (let r = 0; r < 4; r++) {
        ctx.fillStyle = rgba(r & 1 ? MAG : GOLD, 0.32 + hash2((x | 0) + r) * 0.4);
        ctx.fillRect(x - w * 0.44, y + h * 0.36 + r * h * 0.14, w * 0.88, h * 0.08);
      }
    } else if (spr.k === 'crowd') {
      for (let i = 0; i < 8; i++) {
        const cx = x - w * 0.4 + (i / 7) * w * 0.8;
        ctx.fillStyle = rgba(i & 1 ? SUN : MAG, 0.7);
        ctx.fillRect(cx, y + h * 0.35, w * 0.08, h * 0.4);
        ctx.fillStyle = rgba(WHT, 0.85);
        ctx.beginPath();
        ctx.moveTo(cx + w * 0.04, y + h * 0.26);
        ctx.lineTo(cx + w * 0.09, y + h * 0.36);
        ctx.lineTo(cx - w * 0.01, y + h * 0.36);
        ctx.closePath();
        ctx.fill();
      }
    } else if (spr.k === 'boat') {
      ctx.fillStyle = rgba([36, 52, 72], 1);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.46, y + h * 0.55);
      ctx.lineTo(x + w * 0.46, y + h * 0.55);
      ctx.lineTo(x + w * 0.28, y + h);
      ctx.lineTo(x - w * 0.28, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.fillRect(x - w * 0.04, y, w * 0.08, h * 0.55);
    } else if (spr.k === 'lamp') {
      ctx.fillStyle = rgba([40, 52, 62], 1);
      ctx.fillRect(x - w * 0.08, y + h * 0.15, w * 0.16, h * 0.85);
      ctx.fillStyle = rgba(isDense() ? CYN : GOLD, 0.9);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w * 0.26, y + h * 0.18);
      ctx.lineTo(x - w * 0.26, y + h * 0.18);
      ctx.closePath();
      ctx.fill();
    } else if (spr.k === 'pillar') {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fillRect(x - w * 0.28, y, w * 0.56, h);
      ctx.fillStyle = rgba(SUN, 0.72);
      ctx.fillRect(x - w * 0.18, y + h * 0.08, w * 0.36, h * 0.84);
    } else if (spr.k === 'check' || spr.k === 'goal') {
      const last = spr.k === 'goal' || onLastLap();
      ctx.fillStyle = rgba(last ? GOLD : CYN, 0.55);
      ctx.fillRect(x - w * 0.5, y + h * 0.15, w, h * 0.28);
      ctx.fillStyle = rgba(WHT, 0.92);
      ctx.font = 'bold ' + Math.max(10, h * 0.2) + 'px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(last ? 'GOAL' : 'START', x, y + h * 0.3);
    }
    ctx.restore();
  }

  function drawF1At(x, y, destW, destH, col, num, opts) {
    const lean = opts.lean || 0;
    const dead = !!opts.dead;
    const boss = !!opts.boss;
    const boost = !!opts.boost;
    const crash = opts.crash || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean * 0.16 + crash);
    if (dead) ctx.globalAlpha = 0.45;

    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(0, destH * 0.04, destW * 0.48, destH * 0.1, 0, 0, TAU);
    ctx.fill();

    if (boost) {
      const flick = 0.7 + Math.sin(G.t * 42) * 0.3;
      ctx.fillStyle = rgba(CYN, 0.38 * flick);
      ctx.beginPath();
      ctx.moveTo(-destW * 0.1, destH * 0.04);
      ctx.lineTo(0, destH * 0.04 + destH * 0.58 * flick);
      ctx.lineTo(destW * 0.1, destH * 0.04);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.78 * flick);
      ctx.beginPath();
      ctx.moveTo(-destW * 0.055, destH * 0.04);
      ctx.lineTo(0, destH * 0.04 + destH * 0.34 * flick);
      ctx.lineTo(destW * 0.055, destH * 0.04);
      ctx.fill();
    }

    const dark = mix(col, [10, 16, 22], 0.55);
    ctx.fillStyle = '#101820';
    ctx.fillRect(-destW * 0.5, -destH * 0.16, destW * 0.18, destH * 0.22);
    ctx.fillRect(destW * 0.32, -destH * 0.16, destW * 0.18, destH * 0.22);
    ctx.fillRect(-destW * 0.46, destH * 0.0, destW * 0.16, destH * 0.14);
    ctx.fillRect(destW * 0.3, destH * 0.0, destW * 0.16, destH * 0.14);

    ctx.fillStyle = rgba(col, 1);
    ctx.beginPath();
    ctx.moveTo(-destW * 0.28, destH * 0.04);
    ctx.lineTo(-destW * 0.22, -destH * 0.38);
    ctx.lineTo(destW * 0.22, -destH * 0.38);
    ctx.lineTo(destW * 0.28, destH * 0.04);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(dark, 1);
    ctx.beginPath();
    ctx.moveTo(-destW * 0.34, -destH * 0.08);
    ctx.lineTo(-destW * 0.18, -destH * 0.34);
    ctx.lineTo(-destW * 0.08, destH * 0.02);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(destW * 0.34, -destH * 0.08);
    ctx.lineTo(destW * 0.18, -destH * 0.34);
    ctx.lineTo(destW * 0.08, destH * 0.02);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(mix(col, WHT, 0.22), 1);
    ctx.fillRect(-destW * 0.3, -destH * 0.52, destW * 0.6, destH * 0.12);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(-destW * 0.26, -destH * 0.62, destW * 0.52, destH * 0.08);

    ctx.fillStyle = rgba([14, 28, 40], 0.92);
    ctx.beginPath();
    ctx.moveTo(-destW * 0.12, -destH * 0.4);
    ctx.lineTo(-destW * 0.08, -destH * 0.7);
    ctx.lineTo(destW * 0.08, -destH * 0.7);
    ctx.lineTo(destW * 0.12, -destH * 0.4);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = rgba(WHT, 0.7);
    ctx.lineWidth = Math.max(1, destW * 0.03);
    ctx.beginPath();
    ctx.moveTo(-destW * 0.14, -destH * 0.52);
    ctx.lineTo(-destW * 0.1, -destH * 0.78);
    ctx.lineTo(destW * 0.1, -destH * 0.78);
    ctx.lineTo(destW * 0.14, -destH * 0.52);
    ctx.stroke();

    ctx.fillStyle = rgba(mix(col, WHT, 0.45), 1);
    ctx.beginPath();
    ctx.moveTo(-destW * 0.06, -destH * 0.7);
    ctx.lineTo(0, -destH * 1.02);
    ctx.lineTo(destW * 0.06, -destH * 0.7);
    ctx.closePath();
    ctx.fill();

    const fw = destW * 0.42;
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.fillRect(-fw, -destH * 1.02, fw * 2, destH * 0.06);

    const steer = lean * destW * 0.08;
    ctx.fillStyle = '#101820';
    ctx.fillRect(-destW * 0.38 + steer, -destH * 0.96, destW * 0.12, destH * 0.16);
    ctx.fillRect(destW * 0.26 + steer, -destH * 0.96, destW * 0.12, destH * 0.16);

    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.font = 'bold ' + Math.max(7, destH * 0.14) + 'px "Segoe UI",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(num || '1', 0, -destH * 0.46);

    if (boss) {
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = Math.max(1.2, destW * 0.035);
      ctx.strokeRect(-destW * 0.52, -destH * 1.08, destW * 1.04, destH * 1.18);
    }

    ctx.fillStyle = rgba(CYN, 0.75);
    ctx.fillRect(-destW * 0.12, destH * 0.02, destW * 0.08, destH * 0.05);
    ctx.fillRect(destW * 0.04, destH * 0.02, destW * 0.08, destH * 0.05);

    ctx.restore();
  }

  function drawTrafficCar(c, p, clip) {
    const destW = (c.boss ? 580 : 500) * p.s * CX * 0.00115;
    const destH = destW * 0.78;
    const x = p.x + c.offset * p.w;
    const y0 = p.y;
    if (clipSprite(y0 - destH, destH, clip) <= 2 || destW < 2) return;
    const wob = Math.sin(c.wob) * destW * 0.03;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VW, clip);
    ctx.clip();
    drawF1At(x + wob, y0, destW, destH, c.col, c.num, {
      lean: Math.sin(c.wob * 0.5) * 0.4,
      dead: c.dead,
      boss: c.boss,
      boost: false,
      crash: 0
    });
    ctx.restore();
  }

  function drawPlayer() {
    const lean = G.steerVis;
    const hop = G.crashT > 0 ? Math.abs(Math.sin(G.crashT * 17)) * 14 * Math.min(1, G.crashT) : 0;
    const squat = Math.min(1, G.spd / baseMax()) * 4;
    const x = CX + lean * 52;
    const y = VH - 30 - hop + squat;
    const spd01 = clamp(G.spd / baseMax(), 0, 1.4);
    const crashSpin = G.crashT > 0 ? Math.sin(G.crashT * 19) * 0.55 * Math.min(1, G.crashT) : 0;
    const col = SUN;
    const w = 112;
    const h = 86;

    if (spd01 > 0.38 && !REDUCE && (Math.abs(lean) > 0.08 || G.boostOn || G.drafting)) {
      for (let i = 5; i >= 1; i--) {
        const k = i / 5;
        ctx.save();
        ctx.globalAlpha = (0.07 + Math.abs(lean) * 0.14 + (G.boostOn ? 0.1 : G.drafting ? 0.08 : 0)) * k * Math.min(1, spd01);
        ctx.translate(x - lean * 24 * i, y + 4 * i);
        drawF1At(0, 0, w, h, G.boostOn ? GOLD : G.drafting ? CYN : col, '1', { lean: lean, boost: false });
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    if (G.crashT > 0.2) {
      ctx.save();
      ctx.translate(x + Math.sin(G.crashT * 14) * 26, y - 8);
      ctx.rotate(G.crashT * 8);
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(6, -8);
      ctx.lineTo(-6, -8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(SUN, 1);
      ctx.fillRect(-8, -8, 16, 14);
      ctx.restore();
    }

    drawF1At(x, y, w, h, col, '1', {
      lean: lean * 0.9,
      boost: G.boostOn && G.crashT <= 0,
      crash: crashSpin,
      boss: false
    });
  }

  function ensureProj(n) {
    while (proj.length < n) {
      proj.push({
        p1: { x: 0, y: 0, w: 0, s: 0, z: 0 },
        p2: { x: 0, y: 0, w: 0, s: 0, z: 0 },
        clip: VH,
        i: 0,
        bank: 0,
        sprites: null
      });
    }
  }

  function drawRoad() {
    const pal = palette();
    const pz = G.z;
    const playerSeg = findSeg(pz + PLAYER_Z);
    const pPct = (wrapZ(pz + PLAYER_Z) / SEG) - playerSeg.i;
    const playerY = lerp(playerSeg.y1, playerSeg.y2, clamp(pPct, 0, 1));
    const baseI = Math.floor(pz / SEG);
    const baseSeg = findSeg(pz);
    const bPct = (wrapZ(pz) / SEG) - baseSeg.i;
    const camX = G.x * ROAD_W;
    const camY = playerY + CAM_H;
    const camZ = pz;
    const nDraw = DRAW;
    ensureProj(nDraw);

    let x = 0;
    let dx = -baseSeg.curve * clamp(bPct, 0, 1);
    let maxy = VH;

    for (let n = 0; n < nDraw; n++) {
      const si = segIndex(baseI + n);
      const seg = segs[si];
      const slot = proj[n];
      const z1 = (baseI + n) * SEG;
      const z2 = z1 + SEG;
      project(0, seg.y1, z1, camX - x, camY, camZ, slot.p1);
      project(0, seg.y2, z2, camX - x, camY, camZ, slot.p2);
      slot.clip = VH;
      slot.i = si;
      slot.bank = seg.bank || 0;
      slot.sprites = seg.sprites;
      x += dx;
      dx += seg.curve;
    }

    const carOn = [];
    for (let i = 0; i < cars.length; i++) {
      const ci = Math.floor(cars[i].z / SEG) - baseI;
      if (ci >= 0 && ci < nDraw) {
        if (!carOn[ci]) carOn[ci] = [];
        carOn[ci].push(cars[i]);
      }
    }

    for (let n = nDraw - 1; n >= 0; n--) {
      const slot = proj[n];
      const p1 = slot.p1;
      const p2 = slot.p2;
      if (p1.z <= CAM_D * 0.9 || p2.y >= p1.y || p2.y >= maxy) continue;
      const fogT = n / Math.max(1, nDraw);
      const fog = fogT * fogT * 0.88;
      const alt = (Math.floor(slot.i / RUMBLE) & 1) === 0;
      const lg = mix(alt ? pal.lg : pal.lg2, pal.fog, fog);
      const rg = mix(alt ? pal.rg : pal.rg2, pal.fog, fog);
      quad(0, p1.y, p1.x, p1.y, p2.x, p2.y, 0, p2.y, lg);
      quad(p1.x, p1.y, VW, p1.y, VW, p2.y, p2.x, p2.y, rg);
      drawOneRoad(p1, p2, pal, alt, fog, slot.bank);
      maxy = p2.y;
      slot.clip = maxy;
      if (slot.sprites) {
        for (let s = 0; s < slot.sprites.length; s++) {
          drawScenery(slot.sprites[s], p2, slot.clip);
        }
      }
      if (carOn[n]) {
        for (let k = 0; k < carOn[n].length; k++) {
          const c = carOn[n][k];
          const u = clamp((c.z - (baseI + n) * SEG) / SEG, 0, 1);
          drawTrafficCar(c, {
            x: lerp(p1.x, p2.x, u),
            y: lerp(p1.y, p2.y, u),
            w: lerp(p1.w, p2.w, u),
            s: lerp(p1.s, p2.s, u)
          }, slot.clip);
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
    ctx.strokeStyle = rgba(G.boostOn ? GOLD : G.drafting ? CYN : HOT, 0.05 + spd01 * 0.09);
    ctx.lineWidth = G.boostOn ? 1.6 : 1.2;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(vpX, HORIZON + 8);
      ctx.lineTo((i / 12) * VW + G.lean * 28, VH);
      ctx.stroke();
    }
    ctx.restore();
    for (let i = 0; i < smears.length; i++) {
      const s = smears[i];
      ctx.strokeStyle = rgba(s.turbo ? GOLD : s.draft ? CYN : WHT, s.a);
      ctx.lineWidth = s.turbo ? 1.8 : 1.4;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + s.lean * 12, s.y + s.len);
      ctx.stroke();
    }
  }

  function drawMinimap() {
    const mx = 70;
    const my = VH - 64;
    const rw = 34;
    const rh = 22;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.strokeStyle = rgba(SUN, 0.55);
    ctx.lineWidth = 5;
    ctx.beginPath();
    if (mapPts.length > 2) {
      ctx.moveTo(mx + (mapPts[0].x - 0.5) * rw * 2, my + (mapPts[0].y - 0.5) * rh * 2);
      for (let i = 1; i < mapPts.length; i++) {
        ctx.lineTo(mx + (mapPts[i].x - 0.5) * rw * 2, my + (mapPts[i].y - 0.5) * rh * 2);
      }
      ctx.closePath();
    } else {
      ctx.ellipse(mx, my, 28, 16, 0, 0, TAU);
    }
    ctx.stroke();
    ctx.strokeStyle = rgba(WHT, 0.28);
    ctx.lineWidth = 2;
    ctx.stroke();
    const f = lapFrac();
    let px = mx;
    let py = my;
    if (mapPts.length > 2) {
      const t = f * mapPts.length;
      const i = Math.floor(t) % mapPts.length;
      const n = (i + 1) % mapPts.length;
      const u = t - Math.floor(t);
      px = mx + (lerp(mapPts[i].x, mapPts[n].x, u) - 0.5) * rw * 2;
      py = my + (lerp(mapPts[i].y, mapPts[n].y, u) - 0.5) * rh * 2;
    }
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.beginPath();
    ctx.arc(px, py, 3.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.7);
    ctx.font = '9px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('P' + G.place, mx, my + 34);
    ctx.restore();
  }

  function drawHudCanvas() {
    const spd01 = clamp(G.spd / baseMax(), 0, 1.5);
    ctx.save();
    ctx.translate(VW - 86, VH - 70);
    ctx.strokeStyle = rgba(SUN, 0.35);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 34, Math.PI * 0.75, Math.PI * 2.25);
    ctx.stroke();
    ctx.strokeStyle = rgba(spd01 > 1 ? GOLD : (G.boostOn ? SUN : G.drafting ? CYN : HOT), 0.95);
    ctx.beginPath();
    ctx.arc(0, 0, 34, Math.PI * 0.75, Math.PI * 0.75 + Math.min(1, spd01) * Math.PI * 1.5);
    ctx.stroke();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.font = 'bold 13px "Segoe UI",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(G.kmh | 0), 0, 4);
    ctx.font = '9px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillStyle = rgba(G.boostOn ? GOLD : G.drafting ? CYN : SUN, 0.85);
    ctx.fillText(G.boostOn ? 'BOOST' : G.drafting ? 'DRAFT' : 'km/h', 0, 16);
    ctx.restore();

    drawMinimap();

    if (G.mode === 'play' && G.packOn) {
      ctx.save();
      ctx.fillStyle = rgba(SUN, 0.14 + Math.sin(G.t * 8) * 0.05);
      ctx.fillRect(0, 0, VW, 10);
      ctx.fillRect(0, VH - 10, VW, 10);
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.font = 'bold 12px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('终段赛团', CX, 22);
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
      if (p.poly) {
        const s = p.r;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot || 0);
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.fill();
      }
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

    const roll = REDUCE ? 0 : (G.lean * 0.06 + G.bankMem * 0.1 * (G.curveMem < 0 ? 1 : -1));
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
  if (btnBoost) {
    const boostDown = function (e) {
      e.preventDefault();
      audio.ensure();
      G.boostHold = true;
      inputSrc = 'key';
    };
    const boostUp = function () { G.boostHold = false; };
    btnBoost.addEventListener('pointerdown', boostDown);
    btnBoost.addEventListener('pointerup', boostUp);
    btnBoost.addEventListener('pointerleave', boostUp);
    btnBoost.addEventListener('pointercancel', boostUp);
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
      G.boostHold = false;
      pointer.down = false;
    }
  });

  requestAnimationFrame(frame);
})();
