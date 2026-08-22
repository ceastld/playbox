'use strict';

/* 杆位 — Pole Position-like. No CDN. */

(function () {
  const VW = 480;
  const VH = 720;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const SEG_LEN = 200;
  const ROAD_W = 620;
  const CAM_D = 0.84;
  const CAM_H = 1000;
  const DRAW_N = 176;
  const HORIZON = 232;
  const MAX_SPD = 6400;
  const ACCEL = 3050;
  const BRAKE = 5800;
  const COAST = 1180;
  const CENTRIF = 0.152;
  const COMBO_WIN = 2.2;
  const BEST_KEY = 'playbox-pole-dash-best';
  const MUTE_KEY = 'playbox-pole-dash-mute';
  const OPS = '← → 转向 · ↑ 油门 · ↓ 刹车 · 拖指驾驶 · R 重开';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 45, 90];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const LIME = [61, 255, 136];
  const WHT = [255, 236, 242];
  const PNK = [255, 160, 186];
  const PUR = [168, 92, 255];
  const SKY = [48, 12, 24];

  const PAL = [
    { road: [92, 52, 68], grass: [36, 10, 24], rumble: [255, 45, 90], lane: [255, 226, 234] },
    { road: [68, 38, 52], grass: [22, 6, 16], rumble: [255, 226, 234], lane: [68, 38, 52] }
  ];

  const CAR_PAL = [
    MAG, CYN, GOLD, PUR, LIME, PNK, [255, 180, 80], [120, 200, 255]
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
  const btnQual = document.getElementById('btn-qual');
  const btnEndure = document.getElementById('btn-endure');
  const ovRetry = document.getElementById('ov-retry');
  const ovModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const timeEl = document.getElementById('time');
  const comboEl = document.getElementById('combo');
  const comboBox = document.getElementById('combo-box');
  const scoreBox = document.getElementById('score-box');
  const timeBox = document.getElementById('time-box');
  const scoreAdd = document.getElementById('score-add');
  const modeLabel = document.getElementById('mode-label');
  const lapLabel = document.getElementById('lap-label');
  const spdLabel = document.getElementById('spd-label');
  const timeBar = document.getElementById('time-bar');
  const timeWrap = document.getElementById('time-wrap');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');

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
  const pointer = { down: false, x: VW * 0.5, y: VH * 0.6, id: null };
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const lines = [];
  const segs = [];
  const cars = [];
  const CPS = [0, 400, 800, 1200];

  const G = {
    mode: 'title',
    kind: 'qual',
    phase: 'qual',
    t: 0,
    clock: 0,
    pz: 0,
    px: 0,
    py: 0,
    spd: 0,
    steer: 0,
    lean: 0,
    bounce: 0,
    spinT: 0,
    spinA: 0,
    invuln: 0,
    go: 0,
    goN: 4,
    shiftT: 0,
    score: 0,
    best: { q: 0, e: 0 },
    combo: 0,
    comboT: 0,
    maxCombo: 0,
    passes: 0,
    laps: 0,
    lapsNeed: 1,
    lapBase: 0,
    time: 50,
    timeAdd: 16.5,
    cpAt: 0,
    lastSeg: 0,
    distScore: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: MAG,
    punch: 1,
    warnT: 0,
    lowSaid: false,
    record: false,
    why: '',
    vpX: VW * 0.5,
    rumbleT: 0
  };

  let inputSrc = 'key';
  let hillY = 0;
  let trackLen = 1;
  let trackN = 1;

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
  function sx(x) { return ox + x * scale; }
  function sy(y) { return oy + y * scale; }
  function ease(p) { return p * p * (3 - 2 * p); }

  function hash(n, salt) {
    n = Math.imul(n | 0, 374761393) ^ Math.imul(salt | 0, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  function zWrap(z) {
    const L = trackLen;
    z = z % L;
    if (z < 0) z += L;
    return z;
  }

  function zDelta(a, b) {
    let d = a - b;
    const L = trackLen;
    if (d > L * 0.5) d -= L;
    if (d < -L * 0.5) d += L;
    return d;
  }

  function getSeg(i) {
    const n = trackN;
    return segs[((i % n) + n) % n];
  }

  function isEndure() {
    return G.kind === 'endure';
  }
  function bestOf() {
    return isEndure() ? G.best.e : G.best.q;
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    eng: null,
    ensure() {
      if (!this.ctx) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.3;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.3;
      if (m) this.stopEngine();
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
    noise(dur, vol, hp, lp) {
      if (!this.ctx || this.muted) return;
      const n = Math.max(0.04, dur);
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, Math.max(1, (sr * n) | 0), sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = hp ? 'highpass' : 'lowpass';
      f.frequency.value = hp || lp || 900;
      const g = this.ctx.createGain();
      const t = this.ctx.currentTime;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    startEngine() {
      if (!this.ctx || this.muted || this.eng) return;
      const ctx = this.ctx;
      const o1 = ctx.createOscillator();
      o1.type = 'sawtooth';
      o1.frequency.value = 52;
      const o2 = ctx.createOscillator();
      o2.type = 'square';
      o2.frequency.value = 78;
      const g = ctx.createGain();
      g.gain.value = 0.0001;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      o1.connect(lp);
      o2.connect(lp);
      lp.connect(g);
      g.connect(this.master);
      const sr = ctx.sampleRate;
      const buf = ctx.createBuffer(1, sr | 0, sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const ns = ctx.createBufferSource();
      ns.buffer = buf;
      ns.loop = true;
      const ng = ctx.createGain();
      ng.gain.value = 0.0001;
      const nlp = ctx.createBiquadFilter();
      nlp.type = 'lowpass';
      nlp.frequency.value = 420;
      ns.connect(nlp);
      nlp.connect(ng);
      ng.connect(this.master);
      o1.start();
      o2.start();
      ns.start();
      this.eng = { o1: o1, o2: o2, g: g, lp: lp, ns: ns, ng: ng, nlp: nlp };
    },
    stopEngine() {
      if (!this.eng) return;
      const e = this.eng;
      this.eng = null;
      try {
        e.o1.stop();
        e.o2.stop();
        e.ns.stop();
      } catch (err) { /* ignore */ }
    },
    tickEngine(spd01, gas, off) {
      if (this.muted || !this.ctx) {
        this.stopEngine();
        return;
      }
      if (!this.eng) this.startEngine();
      if (!this.eng) return;
      const t = this.ctx.currentTime;
      const f = 46 + spd01 * 188 + (gas ? 14 : 0) + (off ? 8 : 0);
      const vol = G.mode === 'title'
        ? 0.012 + spd01 * 0.018
        : 0.02 + spd01 * 0.055 + (gas ? 0.01 : 0);
      const nvol = 0.006 + spd01 * 0.028 + (off ? 0.02 : 0);
      eSoft(this.eng.o1.frequency, f, t);
      eSoft(this.eng.o2.frequency, f * 1.48, t);
      eSoft(this.eng.g.gain, this.muted ? 0.0001 : vol, t);
      eSoft(this.eng.ng.gain, this.muted ? 0.0001 : nvol, t);
      eSoft(this.eng.lp.frequency, 520 + spd01 * 1400, t);
    },
    crash() {
      this.ensure();
      this.noise(0.32, 0.14, 0, 780);
      this.beep(160, 0.24, 'sawtooth', 0.09, 48);
      this.beep(90, 0.18, 'square', 0.05, 40);
    },
    pass(n) {
      this.ensure();
      const f = 520 + Math.min(8, n) * 70;
      this.beep(f, 0.08, 'square', 0.045, f * 1.7);
      this.noise(0.09, 0.05, 1200);
    },
    check() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.05, 990);
      this.beep(990, 0.12, 'triangle', 0.04, 1320);
    },
    lap() {
      this.ensure();
      this.beep(392, 0.08, 'triangle', 0.05, 523);
      this.beep(523, 0.1, 'square', 0.04, 784);
      this.beep(784, 0.16, 'triangle', 0.035, 1046);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'triangle', 0.05, 659);
      this.beep(659, 0.14, 'square', 0.04, 784);
      this.beep(784, 0.22, 'triangle', 0.045, 1046);
    },
    lose() {
      this.ensure();
      this.beep(240, 0.2, 'sawtooth', 0.07, 90);
      this.beep(160, 0.28, 'square', 0.05, 60);
    },
    go(n) {
      this.ensure();
      if (n <= 0) {
        this.beep(520, 0.1, 'square', 0.06, 880);
        this.beep(880, 0.16, 'triangle', 0.05, 1320);
      } else {
        this.beep(220 + n * 40, 0.12, 'square', 0.05);
      }
    },
    warn() {
      this.ensure();
      this.beep(880, 0.07, 'square', 0.04, 440);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'triangle', 0.04, 524);
      this.beep(524, 0.12, 'square', 0.03, 784);
    }
  };

  function eSoft(param, v, t) {
    param.setTargetAtTime(Math.max(0.0001, v), t, 0.05);
  }

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return { q: 0, e: 0 };
      if (raw.charAt(0) === '{') {
        const o = JSON.parse(raw);
        return { q: o.q | 0, e: o.e | 0 };
      }
      const n = parseInt(raw, 10) || 0;
      return { q: n, e: 0 };
    } catch (err) {
      return { q: 0, e: 0 };
    }
  }

  function saveBest() {
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify(G.best));
    } catch (err) { /* ignore */ }
  }

  function considerBest() {
    const k = isEndure() ? 'e' : 'q';
    if (G.score > G.best[k]) {
      G.best[k] = G.score | 0;
      saveBest();
      if (!G.record && G.score > 400) {
        G.record = true;
        toast('新纪录', 'gold');
      }
    }
  }

  function addRoad(num, c0, c1, dHill) {
    const y0 = hillY;
    const y1 = hillY + dHill;
    for (let i = 0; i < num; i++) {
      const p = num <= 1 ? 1 : i / (num - 1);
      const e = ease(p);
      segs.push({
        i: segs.length,
        curve: lerp(c0, c1, e),
        y: lerp(y0, y1, e),
        sprites: [],
        pal: ((segs.length / 3) | 0) % 2,
        kind: 0
      });
    }
    hillY = y1;
  }

  function buildTrack() {
    segs.length = 0;
    hillY = 0;
    addRoad(90, 0, 0, 0);
    addRoad(70, 0, 3.2, 8);
    addRoad(50, 3.2, 3.2, 12);
    addRoad(40, 3.2, 0, 0);
    addRoad(40, 0, 0, 0);
    addRoad(50, 0, -4.1, 42);
    addRoad(80, -4.1, -4.1, 18);
    addRoad(40, -4.1, 0, -12);
    addRoad(30, 0, 0, -48);
    addRoad(40, 0, 5.1, -18);
    addRoad(70, 5.1, 5.1, 0);
    addRoad(40, 5.1, 0, 12);
    addRoad(80, 0, 0, 0);
    addRoad(40, 0, 3.8, 0);
    addRoad(50, 3.8, -4.2, 16);
    addRoad(50, -4.2, 3.6, 0);
    addRoad(40, 3.6, 0, 0);
    addRoad(60, 0, -4.7, 28);
    addRoad(100, -4.7, -4.7, 0);
    addRoad(50, -4.7, 0, -28);
    addRoad(90, 0, 0, 0);
    addRoad(40, 0, 3.4, 52);
    addRoad(60, 3.4, 3.4, 0);
    addRoad(40, 3.4, 0, -42);
    addRoad(45, 0, -3.2, 0);
    addRoad(45, -3.2, 3.2, 0);
    addRoad(40, 3.2, 0, 0);
    addRoad(80, 0, 0, -40);
    while (segs.length < 1600) addRoad(Math.min(20, 1600 - segs.length), 0, 0, 0);
    trackN = segs.length;
    trackLen = trackN * SEG_LEN;
    for (let i = 0; i < 10; i++) {
      segs[i].kind = 1;
      segs[trackN - 1 - i].kind = 1;
    }
    for (let c = 1; c < CPS.length; c++) {
      const a = CPS[c];
      for (let k = -3; k <= 3; k++) {
        const s = getSeg(a + k);
        if (s.kind === 0) s.kind = 2;
      }
    }
    for (let i = 0; i < trackN; i++) {
      const h = hash(i, 11);
      if (i % 5 === 0) {
        segs[i].sprites.push({ o: -1.3, k: 'tree' });
        segs[i].sprites.push({ o: 1.3, k: 'tree' });
      } else if (i % 5 === 2 && h > 0.35) {
        segs[i].sprites.push({ o: h > 0.68 ? -1.34 : 1.34, k: 'tree' });
      }
      if (i % 9 === 0) {
        segs[i].sprites.push({ o: -1.18, k: 'lamp' });
        segs[i].sprites.push({ o: 1.18, k: 'lamp' });
      }
      if (h > 0.84 && i % 11 === 4) {
        segs[i].sprites.push({ o: h > 0.92 ? -1.62 : 1.62, k: 'bill' });
      }
    }
    segs[2].sprites.push({ o: 0, k: 'finish' });
    for (let c = 1; c < CPS.length; c++) {
      segs[CPS[c]].sprites.push({ o: 0, k: 'gate' });
    }
    for (let i = trackN - 24; i < trackN; i++) {
      segs[i].sprites.push({ o: -1.72, k: 'stand' });
      segs[i].sprites.push({ o: 1.72, k: 'stand' });
    }
    for (let i = 0; i < 18; i++) {
      segs[i].sprites.push({ o: -1.72, k: 'stand' });
      segs[i].sprites.push({ o: 1.72, k: 'stand' });
    }
  }

  function spawnCars(kind) {
    cars.length = 0;
    const n = kind === 'qual' ? 7 : kind === 'race' ? 12 : 18;
    const used = [];
    for (let i = 0; i < n; i++) {
      let z = 0;
      let ok = false;
      for (let t = 0; t < 12 && !ok; t++) {
        z = ((0.08 + hash(i * 19 + t, 3) * 0.84) * trackLen);
        ok = true;
        for (let u = 0; u < used.length; u++) {
          if (Math.abs(zDelta(z, used[u])) < 900) ok = false;
        }
        if (Math.abs(zDelta(z, G.pz)) < 1400) ok = false;
      }
      used.push(z);
      const lane = (hash(i, 21) * 3 | 0) - 1;
      const off = lane * 0.58 + (hash(i, 5) - 0.5) * 0.08;
      const spdMul = kind === 'endure'
        ? 0.42 + hash(i, 8) * 0.34
        : 0.48 + hash(i, 8) * 0.3;
      cars.push({
        z: z,
        offset: off,
        want: off,
        spd: MAX_SPD * spdMul,
        pal: CAR_PAL[i % CAR_PAL.length],
        wob: 0.6 + hash(i, 13) * 1.6,
        relPrev: 0,
        passed: false,
        bump: 0
      });
    }
  }

  function clearFx() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    lines.length = 0;
  }

  function resetCar() {
    G.pz = 40;
    G.px = 0;
    G.py = 0;
    G.spd = 0;
    G.steer = 0;
    G.lean = 0;
    G.bounce = 0;
    G.spinT = 0;
    G.spinA = 0;
    G.invuln = 0;
    G.rumbleT = 0;
  }

  function startGame(kind) {
    audio.ensure();
    audio.start();
    G.kind = kind === 'endure' ? 'endure' : 'qual';
    G.phase = G.kind === 'endure' ? 'endure' : 'qual';
    G.mode = 'play';
    G.t = 0;
    G.clock = 0;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.maxCombo = 0;
    G.passes = 0;
    G.laps = 0;
    G.lapsNeed = G.kind === 'endure' ? 6 : 1;
    G.lapBase = 0;
    G.time = G.kind === 'endure' ? 50 : 50;
    G.timeAdd = G.kind === 'endure' ? 15.4 : 16.6;
    G.cpAt = 0;
    G.lastSeg = 0;
    G.distScore = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.warnT = 0;
    G.lowSaid = false;
    G.record = false;
    G.why = '';
    G.go = 3.25;
    G.goN = 4;
    G.shiftT = 0;
    resetCar();
    clearFx();
    spawnCars(G.phase);
    hideOverlay();
    toast(G.kind === 'endure' ? '耐力 · 六圈车流更密' : '排位圈 · 限时一圈', 'gold');
    setHint(OPS, '');
    syncHud();
  }

  function beginRace() {
    G.phase = 'race';
    G.laps = 0;
    G.lapsNeed = 3;
    G.lapBase = G.pz;
    G.cpAt = 0;
    G.lastSeg = 0;
    G.time = 46 + Math.min(10, G.time * 0.22);
    G.timeAdd = 16.2;
    G.go = 2.15;
    G.goN = 3;
    G.shiftT = 0;
    G.lowSaid = false;
    G.pz = 40;
    G.px *= 0.4;
    G.spd *= 0.45;
    spawnCars('race');
    toast('正赛 · 三圈', 'cyan');
    audio.lap();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'qual';
    G.phase = 'qual';
    G.score = 0;
    G.combo = 0;
    G.time = 50;
    G.laps = 0;
    G.lapsNeed = 1;
    G.go = 0;
    G.shiftT = 0;
    G.spinT = 0;
    G.invuln = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    resetCar();
    G.spd = MAX_SPD * 0.62;
    clearFx();
    spawnCars('qual');
    showOverlay('title', '杆位', '后视公路，超车别撞栏。检查点前赶到。', true);
    setHint(OPS, '');
    syncHud();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function showOverlay(kind, title, lead, start) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'TIME' : kind === 'win' ? 'FINISH' : 'POLE';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', !start);
    if (ovEnd) ovEnd.classList.toggle('gone', !!start);
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag) {
    if (REDUCE) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.007));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 5 ? 'die' : mag >= 2.4 ? 'hit' : 'pass';
    stageEl.classList.remove('die', 'hit', 'pass');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) stageEl.classList.remove('die', 'hit', 'pass');
    }, 360);
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
    G.flashRgb = rgb;
  }

  function toast(msg, kind) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden', 'warn', 'gold', 'cyan');
    if (kind) toastEl.classList.add(kind);
    toastTok += 1;
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1100);
  }

  function setHint(t, kind) {
    if (!hintEl) return;
    hintEl.textContent = t;
    hintEl.style.color = kind === 'warn' ? '#ff9ab0' : '';
  }

  function popScore(n) {
    if (!scoreAdd || n <= 0) return;
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + n;
    scoreAdd.classList.remove('score-add');
    void scoreAdd.offsetWidth;
    scoreAdd.classList.add('score-add');
    addTok += 1;
    const tok = addTok;
    setTimeout(function () {
      if (tok === addTok) scoreAdd.hidden = true;
    }, 700);
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
  }

  function addScore(n, label, rgb) {
    if (G.mode !== 'play' || n <= 0) return;
    n = n | 0;
    G.score += n;
    popScore(n);
    considerBest();
    if (label) {
      floats.push({
        x: VW * 0.5 + rand(-30, 30),
        y: VH * 0.62,
        vy: -38,
        t: 0.7,
        life: 0.7,
        text: label,
        rgb: rgb || GOLD
      });
    }
  }

  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        r: rand(spec.r0, spec.r1),
        life: rand(spec.life * 0.55, spec.life),
        max: spec.life,
        rgb: spec.rgb,
        g: spec.g || 0
      });
    }
    capArr(particles, 220);
  }

  function burst(x, y, rgb) {
    emit(18, {
      x: x, y: y, j: 10,
      vx0: -140, vx1: 140, vy0: -220, vy1: -20,
      r0: 2, r1: 5.5, life: 0.45, rgb: rgb, g: 280
    });
    emit(10, {
      x: x, y: y, j: 8,
      vx0: -80, vx1: 80, vy0: -120, vy1: 40,
      r0: 3, r1: 8, life: 0.55, rgb: WHT, g: 120
    });
    sparks.push({ x: x, y: y, t: 0.22, r: 16, rgb: rgb });
    rings.push({ x: x, y: y, t: 0.34, r: 12, rgb: rgb });
  }

  function project(wx, wy, wz, camX, camY, camZ) {
    const relZ = wz - camZ;
    if (relZ <= CAM_D) {
      return { x: VW * 0.5, y: VH + 40, w: VW, s: 0, clip: true, z: relZ };
    }
    const s = CAM_D / relZ;
    return {
      x: VW * 0.5 + s * (wx - camX) * VW * 0.5,
      y: HORIZON - s * (wy - camY) * VH * 0.5,
      w: s * ROAD_W * VW * 0.5,
      s: s,
      clip: false,
      z: relZ
    };
  }

  function fogOf(n) {
    const t = n / DRAW_N;
    return t * t;
  }

  function mix(a, b, t) {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t
    ];
  }

  function steerInput() {
    let s = 0;
    if (keys.l) s -= 1;
    if (keys.r) s += 1;
    if (pointer.down) {
      const px = clamp((pointer.x - VW * 0.5) / (VW * 0.34), -1, 1);
      if (inputSrc === 'ptr') s = px;
      else if (!keys.l && !keys.r) s = px;
    }
    return clamp(s, -1, 1);
  }

  function gasInput() {
    if (keys.u) return 1;
    if (keys.d) return -1;
    if (pointer.down) return pointer.y > VH * 0.74 ? -1 : 1;
    return 0;
  }

  function crash(why) {
    if (G.invuln > 0 || G.spinT > 0) return;
    G.spinT = 1.18;
    G.spinA = 0;
    G.invuln = 1.35;
    G.spd *= 0.28;
    G.why = why;
    hitStop(0.062);
    kick(6.2);
    screenFlash(MAG, 0.55);
    audio.crash();
    const cx = VW * 0.5 + G.lean * 14;
    const cy = VH * 0.82 + G.bounce;
    burst(cx, cy, why === 'car' ? CYN : MAG);
    emit(12, {
      x: cx, y: cy, j: 16,
      vx0: -200, vx1: 200, vy0: -260, vy1: 40,
      r0: 2, r1: 4, life: 0.4, rgb: GOLD, g: 200
    });
    toast(why === 'car' ? '撞车 · 自旋' : '撞栏 · 自旋', 'warn');
    if (G.mode === 'play') {
      G.combo = 0;
      G.comboT = 0;
    }
  }

  function overtake() {
    G.passes += 1;
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    const mult = 1 + Math.min(4, (G.combo - 1) / 2 | 0);
    const pts = 220 * mult;
    const names = ['超车', '连超', '再超', '连破', '杆位杀'];
    const nm = names[Math.min(names.length - 1, G.combo - 1)];
    addScore(pts, nm + ' +' + pts, G.combo >= 4 ? GOLD : CYN);
    audio.pass(G.combo);
    hitStop(0.032);
    kick(2.1);
    screenFlash(CYN, 0.22);
    rings.push({ x: VW * 0.5, y: VH * 0.7, t: 0.28, r: 20, rgb: CYN });
    if (comboBox) {
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
      comboTok += 1;
      const tok = comboTok;
      setTimeout(function () {
        if (tok === comboTok && comboBox) comboBox.classList.remove('hot');
      }, 340);
    }
  }

  function onCheckpoint(idx) {
    if (G.mode !== 'play' || G.go > 0) return;
    if (idx === G.cpAt) return;
    G.cpAt = idx;
    G.time += G.timeAdd;
    G.lowSaid = false;
    addScore(420, '检查点 +' + G.timeAdd.toFixed(0), GOLD);
    audio.check();
    kick(2.6);
    screenFlash(GOLD, 0.28);
    toast('检查点 +' + G.timeAdd.toFixed(1) + 's', 'gold');
    rings.push({ x: VW * 0.5, y: HORIZON + 40, t: 0.4, r: 30, rgb: GOLD });
  }

  function onLap() {
    if (G.mode !== 'play' || G.go > 0) return;
    G.laps += 1;
    G.cpAt = 0;
    G.time += G.timeAdd + 4;
    addScore(1200 + G.laps * 200, '完圈 +' + (1200 + G.laps * 200), LIME);
    audio.lap();
    kick(3.4);
    screenFlash(LIME, 0.32);
    if (G.phase === 'qual') {
      toast('排位通过', 'cyan');
      G.shiftT = 1.15;
      return;
    }
    if (G.laps >= G.lapsNeed) {
      winGame();
      return;
    }
    toast('第 ' + (G.laps + 1) + ' 圈', 'cyan');
  }

  function winGame() {
    addScore(2800, '冲线', GOLD);
    G.mode = 'win';
    considerBest();
    audio.win();
    audio.stopEngine();
    kick(4);
    screenFlash(GOLD, 0.4);
    const tag = G.kind === 'endure' ? '耐力完赛' : '正赛完赛';
    showOverlay(
      'win',
      '完赛',
      tag + ' · 分 ' + (G.score | 0) + ' · 超车 ' + G.passes + ' · 连超 ×' + G.maxCombo,
      false
    );
    setHint('R 重开 · Enter 再赛', '');
  }

  function loseGame() {
    if (G.mode !== 'play') return;
    G.mode = 'lose';
    considerBest();
    audio.lose();
    audio.stopEngine();
    kick(5);
    screenFlash(MAG, 0.5);
    const fail = G.phase === 'qual' ? '排位失败 · 没在时间内完圈' : '超时了 · 没赶到检查点';
    showOverlay(
      'lose',
      G.phase === 'qual' ? '没排上' : '超时了',
      fail + ' · 分 ' + (G.score | 0),
      false
    );
    setHint('R 重开 · 撞车撞栏会自旋丢时间', 'warn');
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.vy += (p.g || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t -= dt;
      if (sparks[i].t <= 0) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t -= dt;
      rings[i].r += 90 * dt;
      if (rings[i].t <= 0) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t -= dt;
      f.y += f.vy * dt;
      if (f.t <= 0) floats.splice(i, 1);
    }
    for (let i = lines.length - 1; i >= 0; i--) {
      lines[i].t -= dt;
      lines[i].y += lines[i].vy * dt;
      if (lines[i].t <= 0) lines.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.pow(0.001, dt));
  }

  function updateCars(dt, frozen) {
    const play = G.mode === 'play' && G.go <= 0 && !frozen;
    for (let i = 0; i < cars.length; i++) {
      const c = cars[i];
      if (!frozen) {
        c.z = zWrap(c.z + c.spd * dt);
        c.offset = lerp(c.offset, c.want + Math.sin(G.clock * c.wob + i) * 0.05, 1 - Math.pow(0.02, dt));
        if (c.bump > 0) {
          c.offset += c.bump * dt;
          c.bump *= Math.pow(0.08, dt);
        }
        c.offset = clamp(c.offset, -0.78, 0.78);
      }
      const rel = zDelta(c.z, G.pz);
      if (play && G.spinT <= 0) {
        if (rel > 90) c.passed = false;
        if (!c.passed && c.relPrev > 28 && rel < -18) {
          c.passed = true;
          overtake();
        }
      }
      c.relPrev = rel;
      if (play && G.invuln <= 0 && G.spinT <= 0) {
        if (Math.abs(rel) < 160 && Math.abs(c.offset - G.px) < 0.40) {
          c.bump += (c.offset >= G.px ? 1.8 : -1.8);
          c.spd *= 0.86;
          crash('car');
        }
      }
    }
  }

  function updatePlayer(dt, demo) {
    const gas = demo ? 1 : gasInput();
    const st = demo ? clamp(-G.px * 1.8 - currentCurve() * 0.35, -1, 1) : steerInput();
    G.steer = lerp(G.steer, st, 1 - Math.pow(0.0008, dt));
    const spd01 = G.spd / MAX_SPD;
    const off = Math.abs(G.px) > 0.98;
    const frozen = G.go > 0 || G.shiftT > 0;

    if (G.spinT > 0) {
      G.spinT -= dt;
      G.spinA += 9.4 * dt;
      G.spd = Math.max(G.spd - BRAKE * 0.35 * dt, MAX_SPD * 0.12);
      G.px += Math.sin(G.spinA * 2) * 0.35 * dt;
      G.px = lerp(G.px, clamp(G.px, -0.7, 0.7), 0.4 * dt);
      if (G.spinT <= 0) G.spinA = 0;
    } else if (!demo) {
      if (gas > 0) G.spd += ACCEL * dt * (1.05 - spd01 * 0.35);
      else if (gas < 0) G.spd -= BRAKE * dt;
      else G.spd -= COAST * dt;
      if (off) {
        if (G.spd > MAX_SPD * 0.4) G.spd -= 5200 * dt;
        G.rumbleT += dt;
        G.bounce = Math.sin(G.t * 48) * 2.4;
        if ((G.rumbleT * 18 | 0) !== ((G.rumbleT - dt) * 18 | 0) && spd01 > 0.2) {
          audio.noise(0.04, 0.03, 700);
        }
      } else {
        G.bounce = lerp(G.bounce, 0, 8 * dt);
        G.rumbleT = 0;
      }
      if (off && spd01 > 0.18) {
        emit(1, {
          x: VW * 0.5 + rand(-30, 30),
          y: VH * 0.88,
          j: 8,
          vx0: -40, vx1: 40, vy0: -30, vy1: 20,
          r0: 3, r1: 7, life: 0.22, rgb: PNK, g: 40
        });
      }
    } else {
      G.spd = lerp(G.spd, MAX_SPD * 0.68, 1.2 * dt);
      G.bounce = 0;
    }

    G.spd = clamp(G.spd, 0, MAX_SPD);
    const sp = G.spd / MAX_SPD;
    const turn = dt * 2.62 * (0.42 + 0.58 * sp);
    if (G.spinT <= 0) {
      G.px += G.steer * turn;
      G.px -= turn * sp * currentCurve() * CENTRIF;
    }
    if (Math.abs(G.px) > 1.2 && G.spd > MAX_SPD * 0.2 && G.invuln <= 0 && !demo && G.mode === 'play') {
      G.px = Math.sign(G.px) * 0.62;
      crash('wall');
    }
    G.px = clamp(G.px, -1.48, 1.48);
    G.lean = lerp(G.lean, G.steer * 0.85 + currentCurve() * 0.08, 10 * dt);

    if (!frozen) {
      const before = G.pz;
      G.pz = zWrap(G.pz + G.spd * dt);
      if (!demo && G.mode === 'play' && G.go <= 0) {
        const dist = G.spd * dt;
        G.distScore += dist;
        if (G.distScore > 150) {
          const n = (G.distScore / 150) | 0;
          G.distScore -= n * 150;
          const bonus = n * (sp > 0.88 ? 2 : 1);
          G.score += bonus;
        }
        checkProgress(before, G.pz);
      }
    }

    if (gas < 0 && sp > 0.35 && G.spinT <= 0) {
      emit(1, {
        x: VW * 0.5 + rand(-22, 22),
        y: VH * 0.86,
        j: 4,
        vx0: -20, vx1: 20, vy0: -10, vy1: 30,
        r0: 4, r1: 9, life: 0.28, rgb: [80, 70, 80], g: -40
      });
    }
    if (sp > 0.62 && !REDUCE && (G.t * 60 | 0) % 2 === 0) {
      lines.push({
        x: rand(20, VW - 20),
        y: HORIZON + rand(20, 80),
        vy: 420 + sp * 520,
        t: 0.18,
        w: 1 + sp * 1.4
      });
      capArr(lines, 28);
    }
  }

  function currentCurve() {
    const base = Math.floor(G.pz / SEG_LEN);
    const pct = (G.pz / SEG_LEN) - base;
    return lerp(getSeg(base).curve, getSeg(base + 1).curve, pct);
  }

  function currentY() {
    const base = Math.floor(G.pz / SEG_LEN);
    const pct = (G.pz / SEG_LEN) - base;
    return lerp(getSeg(base).y, getSeg(base + 1).y, pct);
  }

  function checkProgress(before, after) {
    const bs = Math.floor(before / SEG_LEN);
    const as = Math.floor(after / SEG_LEN);
    if (after < before && before > trackLen * 0.7 && after < trackLen * 0.3) {
      onLap();
      return;
    }
    if (as === bs) return;
    for (let c = 1; c < CPS.length; c++) {
      const cp = CPS[c];
      if (bs < cp && as >= cp) onCheckpoint(c);
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    updateFx(dt);
    if (G.invuln > 0) G.invuln -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) G.combo = 0;
    }

    if (G.stop > 0) {
      G.stop -= dt;
      audio.tickEngine(G.spd / MAX_SPD, false, false);
      return;
    }

    const demo = G.mode === 'title';
    if (G.mode === 'win' || G.mode === 'lose') {
      G.spd = Math.max(0, G.spd - COAST * 1.6 * dt);
      updateCars(dt, true);
      audio.tickEngine(G.spd / MAX_SPD, false, false);
      return;
    }

    if (G.shiftT > 0) {
      G.shiftT -= dt;
      G.spd = Math.max(G.spd - COAST * dt, MAX_SPD * 0.2);
      if (G.shiftT <= 0) beginRace();
      audio.tickEngine(G.spd / MAX_SPD, false, false);
      return;
    }

    if (G.go > 0 && G.mode === 'play') {
      const prev = G.go;
      G.go -= dt;
      const n = G.go > 2 ? 3 : G.go > 1 ? 2 : G.go > 0.28 ? 1 : 0;
      if (n !== G.goN) {
        G.goN = n;
        audio.go(n);
        toast(n === 0 ? '冲！' : String(n), n === 0 ? 'gold' : 'cyan');
      }
      const st = steerInput();
      G.steer = lerp(G.steer, st, 8 * dt);
      G.px += G.steer * dt * 0.9;
      G.px = clamp(G.px, -0.9, 0.9);
      const gas = gasInput();
      if (gas > 0) G.spd += ACCEL * 0.55 * dt;
      else G.spd -= COAST * dt;
      G.spd = clamp(G.spd, 0, MAX_SPD * 0.35);
      G.lean = lerp(G.lean, G.steer, 8 * dt);
      audio.tickEngine(G.spd / MAX_SPD, gas > 0, false);
      if (prev > 0 && G.go <= 0) {
        G.spd = Math.max(G.spd, MAX_SPD * 0.18);
      }
      return;
    }

    updatePlayer(dt, demo);
    updateCars(dt, false);
    G.py = currentY();

    if (G.mode === 'play') {
      G.time -= dt;
      if (G.time < 8 && !G.lowSaid) {
        G.lowSaid = true;
        toast('时间不够', 'warn');
      }
      if (G.time < 8) {
        G.warnT -= dt;
        if (G.warnT <= 0) {
          G.warnT = 0.46;
          audio.warn();
        }
      }
      if (G.time <= 0) {
        G.time = 0;
        loseGame();
      }
    }

    if (demo && G.spinT > 0.4) {
      G.spinT = 0;
      G.px = 0;
      G.spd = MAX_SPD * 0.62;
    }

    audio.tickEngine(G.spd / MAX_SPD, gasInput() > 0 && !demo, Math.abs(G.px) > 0.98);
  }

  function trap(x1, y1, w1, x2, y2, w2, rgb) {
    if (y2 < 0 && y1 < 0) return;
    ctx.fillStyle = rgba(rgb, 1);
    ctx.beginPath();
    ctx.moveTo(sx(x1 - w1), sy(y1));
    ctx.lineTo(sx(x1 + w1), sy(y1));
    ctx.lineTo(sx(x2 + w2), sy(y2));
    ctx.lineTo(sx(x2 - w2), sy(y2));
    ctx.closePath();
    ctx.fill();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(HORIZON + 18));
    g.addColorStop(0, '#070108');
    g.addColorStop(0.55, '#1a0610');
    g.addColorStop(1, '#3a1020');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, (HORIZON + 22) * scale);

    const sunX = sx(VW * 0.72);
    const sunY = sy(HORIZON - 18);
    const rg = ctx.createRadialGradient(sunX, sunY, 2 * scale, sunX, sunY, 70 * scale);
    rg.addColorStop(0, 'rgba(255,45,90,0.55)');
    rg.addColorStop(0.4, 'rgba(255,80,120,0.18)');
    rg.addColorStop(1, 'rgba(255,45,90,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(sx(0), sy(0), VW * scale, (HORIZON + 8) * scale);

    ctx.fillStyle = 'rgba(255, 90, 120, 0.85)';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 11 * scale, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,236,242,0.55)';
    for (let i = 0; i < 28; i++) {
      const hx = hash(i, 44);
      const hy = hash(i, 91);
      ctx.globalAlpha = 0.25 + hx * 0.5;
      ctx.fillRect(sx(hx * VW), sy(hy * (HORIZON - 24)), scale, scale);
    }
    ctx.globalAlpha = 1;
  }

  function drawMounts(off) {
    const base = HORIZON + 6;
    ctx.beginPath();
    ctx.moveTo(sx(-20), sy(base + 20));
    for (let i = 0; i <= 14; i++) {
      const x = (i / 14) * VW * 1.15 - 20 + (off % VW) * 0.12;
      const h = 18 + Math.sin(i * 0.86 + 0.4) * 26 + Math.sin(i * 2.1) * 10;
      ctx.lineTo(sx(x), sy(base - h));
    }
    ctx.lineTo(sx(VW + 20), sy(base + 20));
    ctx.closePath();
    ctx.fillStyle = '#14040c';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx(-30), sy(base + 18));
    for (let i = 0; i <= 12; i++) {
      const x = (i / 12) * VW + 10 - (off % VW) * 0.07;
      const h = 10 + Math.sin(i * 1.3 + 2) * 16;
      ctx.lineTo(sx(x), sy(base - h));
    }
    ctx.lineTo(sx(VW + 20), sy(base + 18));
    ctx.closePath();
    ctx.fillStyle = '#1c0812';
    ctx.fill();
  }

  function drawTree(x, y, sc, fog) {
    const h = 170 * sc;
    const w = 46 * sc;
    if (h < 3) return;
    const col = mix([36, 8, 22], SKY, fog);
    const leaf = mix(MAG, SKY, fog * 0.7);
    const tw = Math.max(2, 5.5 * sc);
    ctx.fillStyle = rgba(col, 1);
    ctx.fillRect(sx(x - tw * 0.5), sy(y - h * 0.28), tw * scale, h * 0.28 * scale);
    ctx.fillStyle = rgba(leaf, 0.95);
    ctx.beginPath();
    ctx.moveTo(sx(x), sy(y - h));
    ctx.lineTo(sx(x + w), sy(y - h * 0.22));
    ctx.lineTo(sx(x - w), sy(y - h * 0.22));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(mix([90, 16, 36], SKY, fog), 0.9);
    ctx.beginPath();
    ctx.moveTo(sx(x), sy(y - h * 0.78));
    ctx.lineTo(sx(x + w * 0.72), sy(y - h * 0.18));
    ctx.lineTo(sx(x - w * 0.72), sy(y - h * 0.18));
    ctx.closePath();
    ctx.fill();
  }

  function drawLamp(x, y, sc, fog) {
    const h = 150 * sc;
    if (h < 3) return;
    const tw = Math.max(1.5, 4 * sc);
    ctx.fillStyle = rgba(mix([50, 40, 55], SKY, fog), 1);
    ctx.fillRect(sx(x - tw * 0.5), sy(y - h), tw * scale, h * scale);
    ctx.fillStyle = rgba(mix(MAG, SKY, fog * 0.4), 0.85);
    ctx.beginPath();
    ctx.arc(sx(x), sy(y - h), Math.max(2.4, 18 * sc) * scale, 0, TAU);
    ctx.fill();
  }

  function drawBill(x, y, sc, fog, salt) {
    const h = 110 * sc;
    const w = 70 * sc;
    if (h < 4) return;
    ctx.fillStyle = rgba(mix([40, 30, 44], SKY, fog), 1);
    ctx.fillRect(sx(x - 2 * sc * 8), sy(y - h * 0.2), 4 * sc * 8, h * 0.2 * scale);
    const rgb = salt > 0.5 ? mix(CYN, SKY, fog * 0.5) : mix(GOLD, SKY, fog * 0.5);
    ctx.fillStyle = rgba(rgb, 0.9);
    ctx.fillRect(sx(x - w * 0.5), sy(y - h), w * scale, h * 0.78 * scale);
    ctx.strokeStyle = rgba(WHT, 0.35);
    ctx.lineWidth = Math.max(1, 1.2 * scale);
    ctx.strokeRect(sx(x - w * 0.5), sy(y - h), w * scale, h * 0.78 * scale);
  }

  function drawStand(x, y, sc, fog) {
    const h = 70 * sc;
    const w = 90 * sc;
    if (h < 3) return;
    ctx.fillStyle = rgba(mix([42, 14, 28], SKY, fog), 1);
    ctx.fillRect(sx(x - w * 0.5), sy(y - h), w * scale, h * scale);
    ctx.fillStyle = rgba(mix(MAG, SKY, fog * 0.6), 0.55);
    ctx.fillRect(sx(x - w * 0.45), sy(y - h * 0.72), w * 0.9 * scale, h * 0.18 * scale);
  }

  function drawGantry(p, kind, fog) {
    const y = p.y;
    const w = p.w * 1.18;
    const h = Math.max(8, 90 * p.s * VW);
    if (h < 4) return;
    const x = p.x;
    ctx.fillStyle = rgba(mix([60, 50, 66], SKY, fog), 1);
    ctx.fillRect(sx(x - w - 4), sy(y - h), 7 * scale, h * scale);
    ctx.fillRect(sx(x + w - 3), sy(y - h), 7 * scale, h * scale);
    ctx.fillStyle = rgba(mix(kind === 'finish' ? MAG : GOLD, SKY, fog * 0.4), 0.92);
    ctx.fillRect(sx(x - w), sy(y - h), w * 2 * scale, Math.max(6, 14 * p.s * VW) * scale);
    if (kind === 'finish') {
      const bw = w * 2 / 8;
      const bh = Math.max(4, 10 * p.s * VW);
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 === 0 ? rgba(WHT, 0.9) : rgba([10, 8, 12], 0.9);
        ctx.fillRect(sx(x - w + i * bw), sy(y - h + 2), bw * scale, bh * scale);
      }
    }
  }

  function drawCarSprite(x, y, sc, rgb, steer, spin, fog) {
    const w = 92 * sc;
    const h = 56 * sc;
    if (h < 3) return;
    ctx.save();
    ctx.translate(sx(x), sy(y));
    if (spin) ctx.rotate(spin);
    ctx.rotate(steer * 0.18);
    const m = mix(rgb, SKY, fog * 0.55);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 4 * scale, w * 0.55 * scale, h * 0.18 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1a22';
    ctx.fillRect(-w * 0.5 * scale, -h * 0.18 * scale, w * 0.2 * scale, h * 0.28 * scale);
    ctx.fillRect(w * 0.3 * scale, -h * 0.18 * scale, w * 0.2 * scale, h * 0.28 * scale);
    ctx.fillStyle = rgba(m, 1);
    ctx.beginPath();
    ctx.moveTo(-w * 0.42 * scale, 0);
    ctx.lineTo(-w * 0.28 * scale, -h * 0.72 * scale);
    ctx.lineTo(w * 0.28 * scale, -h * 0.72 * scale);
    ctx.lineTo(w * 0.42 * scale, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(mix(WHT, m, 0.4), 0.9);
    ctx.fillRect(-w * 0.16 * scale, -h * 0.62 * scale, w * 0.32 * scale, h * 0.22 * scale);
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.fillRect(-w * 0.3 * scale, -h * 0.08 * scale, w * 0.6 * scale, h * 0.1 * scale);
    ctx.fillStyle = rgba(CYN, 0.7);
    ctx.fillRect(-w * 0.34 * scale, -h * 0.02 * scale, w * 0.12 * scale, h * 0.08 * scale);
    ctx.fillRect(w * 0.22 * scale, -h * 0.02 * scale, w * 0.12 * scale, h * 0.08 * scale);
    ctx.restore();
  }

  function drawPlayerCar() {
    const x = VW * 0.5 + G.lean * 16;
    const y = VH * 0.835 + G.bounce;
    const blink = G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0;
    if (blink && G.spinT <= 0) return;
    const sc = 0.78 * G.punch;
    drawCarSprite(x, y, sc, MAG, G.lean, G.spinT > 0 ? G.spinA : 0, 0);
    if (G.spd > MAX_SPD * 0.55 && G.spinT <= 0) {
      ctx.strokeStyle = rgba(CYN, 0.25 + (G.spd / MAX_SPD - 0.55) * 0.5);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(x - 18), sy(y + 8));
      ctx.lineTo(sx(x - 10), sy(y + 28));
      ctx.moveTo(sx(x + 18), sy(y + 8));
      ctx.lineTo(sx(x + 10), sy(y + 28));
      ctx.stroke();
    }
  }

  function drawFx() {
    for (let i = 0; i < lines.length; i++) {
      const L = lines[i];
      const a = clamp(L.t / 0.18, 0, 1);
      ctx.strokeStyle = rgba(WHT, 0.12 + a * 0.28);
      ctx.lineWidth = L.w * scale;
      ctx.beginPath();
      ctx.moveTo(sx(L.x), sy(L.y));
      ctx.lineTo(sx(L.x), sy(L.y + 18 + G.spd / MAX_SPD * 26));
      ctx.stroke();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * a * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = clamp(s.t / 0.22, 0, 1);
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.r + (0.22 - s.t) * 80) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = clamp(r.t / 0.34, 0, 1);
      ctx.strokeStyle = rgba(r.rgb, a * 0.7);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), r.r * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.font = '700 ' + (13 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = clamp(f.t / f.life, 0, 1);
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
    ctx.textAlign = 'left';
  }

  function drawGo() {
    if (G.mode !== 'play' || G.go <= 0) return;
    const n = G.goN;
    const txt = n === 0 ? '冲！' : String(n);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 ' + (64 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.fillStyle = rgba(n === 0 ? GOLD : CYN, 0.9);
    ctx.fillText(txt, sx(VW * 0.5), sy(VH * 0.38));
    ctx.restore();
  }

  function drawRoad() {
    const base = Math.floor(G.pz / SEG_LEN);
    const pct = (G.pz / SEG_LEN) - base;
    const camX = G.px * ROAD_W;
    const camY = G.py + CAM_H;
    const camZ = G.pz;
    let x = 0;
    let dx = -pct * getSeg(base).curve;
    G.vpX = VW * 0.5;

    const pts = [];
    for (let n = 0; n < DRAW_N; n++) {
      const idx = base + n;
      const seg = getSeg(idx);
      const wz1 = idx * SEG_LEN;
      const wz2 = (idx + 1) * SEG_LEN;
      const p1 = project(x, seg.y, wz1, camX, camY, camZ);
      x += dx;
      dx += seg.curve;
      const p2 = project(x, getSeg(idx + 1).y, wz2, camX, camY, camZ);
      pts.push({ seg: seg, p1: p1, p2: p2, idx: idx, fog: fogOf(n) });
      if (n === DRAW_N - 12) G.vpX = p2.x;
    }

    for (let n = DRAW_N - 1; n >= 0; n--) {
      const it = pts[n];
      const p1 = it.p1;
      const p2 = it.p2;
      if (p1.clip || p2.clip) continue;
      if (p2.y >= p1.y) continue;
      const pal = PAL[it.seg.pal];
      const fog = it.fog;
      const grass = mix(pal.grass, SKY, fog);
      const road = mix(pal.road, SKY, fog * 0.65);
      let rumble = mix(it.seg.kind === 2 ? GOLD : pal.rumble, SKY, fog * 0.5);
      if (it.seg.kind === 1) rumble = mix((it.idx & 1) ? WHT : MAG, SKY, fog * 0.4);
      trap(VW * 0.5, p1.y, VW, VW * 0.5, p2.y, VW, grass);
      trap(p1.x, p1.y, p1.w * 1.28, p2.x, p2.y, p2.w * 1.28, rumble);
      trap(p1.x, p1.y, p1.w, p2.x, p2.y, p2.w, road);
      if (it.seg.pal === 0) {
        const lane = mix(pal.lane, SKY, fog);
        trap(p1.x, p1.y, p1.w * 0.032, p2.x, p2.y, p2.w * 0.032, lane);
      }
      if (it.seg.kind === 1) {
        const ck = (it.idx & 1) ? WHT : [20, 12, 16];
        trap(p1.x, p1.y, p1.w * 0.5, p2.x, p2.y, p2.w * 0.5, mix(ck, SKY, fog * 0.4));
      }

      const spr = it.seg.sprites;
      for (let s = 0; s < spr.length; s++) {
        const sp = spr[s];
        if (sp.k === 'finish' || sp.k === 'gate') {
          drawGantry(p1, sp.k, fog);
          continue;
        }
        const sxv = p1.x + p1.w * sp.o;
        if (sp.k === 'tree') drawTree(sxv, p1.y, p1.s * VW, fog);
        else if (sp.k === 'lamp') drawLamp(sxv, p1.y, p1.s * VW, fog);
        else if (sp.k === 'bill') drawBill(sxv, p1.y, p1.s * VW, fog, hash(it.seg.i, 3));
        else if (sp.k === 'stand') drawStand(sxv, p1.y, p1.s * VW, fog);
      }

      const wi = ((it.idx % trackN) + trackN) % trackN;
      for (let c = 0; c < cars.length; c++) {
        const car = cars[c];
        const cSeg = Math.floor(car.z / SEG_LEN);
        if (cSeg !== wi) continue;
        const frac = car.z - cSeg * SEG_LEN;
        const cz = it.idx * SEG_LEN + frac;
        const cp = project(car.offset * ROAD_W, it.seg.y, cz, camX, camY, camZ);
        if (cp.clip || cp.y > VH * 0.86) continue;
        drawCarSprite(cp.x, cp.y, Math.min(0.82, cp.s * VW), car.pal, 0, 0, fog);
      }
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0c0308';
    ctx.fillRect(0, 0, W, H);
    const shx = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    const shy = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    ctx.setTransform(dpr, 0, 0, dpr, shx, shy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    if (G.punch !== 1 && !REDUCE) {
      const cx = sx(VW * 0.5);
      const cy = sy(VH * 0.7);
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawSky();
    drawMounts(G.pz * 0.02 + G.px * 40);
    drawRoad();
    drawFx();
    drawPlayerCar();
    drawGo();
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.42);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score | 0);
    if (bestEl) bestEl.textContent = String(bestOf() | 0);
    if (timeEl) timeEl.textContent = (Math.max(0, G.time)).toFixed(1);
    if (comboEl) comboEl.textContent = '×' + Math.max(1, G.combo);
    if (lapLabel) {
      const cur = Math.min(G.lapsNeed, G.laps + (G.mode === 'play' ? 1 : 0));
      lapLabel.textContent = '圈 ' + cur + '/' + G.lapsNeed;
    }
    if (spdLabel) spdLabel.textContent = String(Math.round((G.spd / MAX_SPD) * 324));
    if (modeLabel) {
      const lab = G.phase === 'race' ? '正赛' : G.phase === 'endure' ? '耐力' : '排位';
      modeLabel.textContent = lab;
      modeLabel.classList.toggle('race', G.phase === 'race');
      modeLabel.classList.toggle('endure', G.phase === 'endure');
    }
    if (timeBar) {
      const t = clamp(G.time / 52, 0, 1);
      timeBar.style.transform = 'scaleX(' + t + ')';
    }
    if (timeBox) timeBox.classList.toggle('low', G.mode === 'play' && G.time < 8);
    if (timeWrap) timeWrap.classList.toggle('low', G.mode === 'play' && G.time < 8);
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞车撞栏会自旋丢时间', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · Enter 再赛', '');
    else if (G.time < 8) setHint('赶检查点！超时即负', 'warn');
    else setHint('← → 转向 · ↑ 油门 · 超车连击 · 别撞栏', '');
  }

  function resize() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function pointerWorldX(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientX - rect.left - ox) / scale;
  }
  function pointerWorldY(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientY - rect.top - oy) / scale;
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('qual');
    else startGame(G.kind || 'qual');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('qual');
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
    const space = k === ' ' || k === 'Spacebar' || e.code === 'Space';
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'Enter')) {
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
    if (space || k === 'Enter') {
      if (overlayOpen()) primaryAction();
      return;
    }
    if (G.mode === 'title') {
      if (k === '1') { startGame('qual'); return; }
      if (k === '2') { startGame('endure'); return; }
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      pointer.down = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerWorldX(e), 0, VW);
      pointer.y = pointerWorldY(e);
      inputSrc = 'ptr';
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), 0, VW);
      pointer.y = pointerWorldY(e);
      if (pointer.down) inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
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
    syncHud();
  }

  function initMute() {
    let m = false;
    try { m = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { m = false; }
    audio.setMuted(m);
  }

  buildTrack();
  G.best = loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnQual) {
    btnQual.addEventListener('click', function () {
      audio.ensure();
      startGame('qual');
    });
  }
  if (btnEndure) {
    btnEndure.addEventListener('click', function () {
      audio.ensure();
      startGame('endure');
    });
  }
  if (ovRetry) {
    ovRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'qual');
    });
  }
  if (ovModes) {
    ovModes.addEventListener('click', function () {
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
