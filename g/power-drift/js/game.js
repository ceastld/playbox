'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const CX = VW * 0.5;
  const HORIZON = VH * 0.34;
  const SEG = 200;
  const ROAD_W = 2000;
  const CAM_H = 920;
  const CAM_D = 0.84;
  const PLAYER_Z = CAM_H * CAM_D;
  const DRAW = 168;
  const RUMBLE = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const BEST_KEY = 'playbox-power-drift-best';
  const MUTE_KEY = 'playbox-power-drift-mute';
  const AUTO_SPEED_KEY = 'playbox-power-drift-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 0.48, 0.72, 1, 2.6];
  const OPS = '← → / D 转向 · ↑ W 油门 · ↓ S 刹车 · 空格漂移 · A 自动 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 45, 120];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const SUN = [255, 110, 26];
  const COR = [255, 72, 32];
  const WHT = [255, 244, 234];
  const PNK = [255, 168, 176];
  const ORG = [255, 140, 66];

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
  const btnNight = document.getElementById('btn-night');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
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
  const placeLabel = document.getElementById('place-label');
  const comboEl = document.getElementById('combo-label');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const timeBar = document.getElementById('time-bar');
  const timeWrap = document.getElementById('time-wrap');
  const lapBar = document.getElementById('lap-bar');
  const lapWrap = document.getElementById('lap-wrap');
  const lapEl = document.getElementById('lap');

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

  const keys = { l: false, r: false, u: false, d: false, drift: false };
  const pointer = { down: false, hover: false, x: CX, y: VH * 0.7, id: null };
  const particles = [];
  const floats = [];
  const smears = [];
  const segs = [];
  const karts = [];

  const dummy = {
    i: 0, y1: 0, y2: 0, z1: 0, z2: SEG, curve: 0, bank: 0,
    sprites: null,
    p1: { x: CX, y: VH, w: 0, s: 0, z: 1, yl: VH, yr: VH },
    p2: { x: CX, y: VH, w: 0, s: 0, z: 1, yl: VH, yr: VH },
    clip: VH
  };

  const G = {
    mode: 'title',
    kind: 'course',
    t: 0,
    clock: 0,
    z: 0,
    x: 0,
    spd: 0,
    lean: 0,
    steerVis: 0,
    drift: 0,
    driftHold: 0,
    slide: 0,
    roll: 0,
    air: 0,
    score: 0,
    best: { c: 0, n: 0 },
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
    lapsDone: 0,
    lapMax: 3,
    lapArmed: false,
    place: 1,
    field: 5,
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
    bankMem: 0,
    kmh: 0,
    goT: 0,
    goFlash: 0,
    camYMem: 0
  };

  let inputSrc = 'key';
  let autoOn = false;
  let autoSpeed = 3;
  let autoOvWait = 0;
  let autoSteer = 0;
  let autoGas = true;
  let autoBrake = false;
  let autoDrift = false;

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
  function lapMax() {
    return isNight() ? 4 : 3;
  }
  function maxSpd() {
    return isNight() ? 12800 : 10200;
  }
  function accel() {
    return maxSpd() / (isNight() ? 2.72 : 3.05);
  }
  function brake() {
    return -maxSpd() / 1.22;
  }
  function coast() {
    return -maxSpd() / 6.4;
  }
  function offDecel() {
    return -maxSpd() / (isNight() ? 1.28 : 1.62);
  }
  function startTime() {
    return isNight() ? 38 : 52;
  }
  function lapTime() {
    return isNight() ? 11 : 16;
  }
  function kindBest() {
    return isNight() ? G.best.n : G.best.c;
  }
  function kmhMax() {
    return isNight() ? 248 : 198;
  }
  function centrif() {
    return isNight() ? 0.62 : 0.44;
  }
  function wrapI(i) {
    const n = segs.length;
    if (!n) return 0;
    i %= n;
    if (i < 0) i += n;
    return i;
  }
  function wrapZ(z) {
    const L = G.trackLen || 1;
    z %= L;
    if (z < 0) z += L;
    return z;
  }
  function playerZ() {
    return wrapZ(G.z + PLAYER_Z);
  }
  function progressOf(laps, z) {
    return laps * G.trackLen + z;
  }

  function findSeg(z) {
    if (!segs.length) return dummy;
    return segs[wrapI(Math.floor(z / SEG))];
  }

  function lastY() {
    return segs.length ? segs[segs.length - 1].y2 : 0;
  }

  function addSeg(curve, y, bank) {
    const n = segs.length;
    segs.push({
      i: n,
      y1: n ? segs[n - 1].y2 : 0,
      y2: y,
      z1: n * SEG,
      z2: (n + 1) * SEG,
      curve: curve,
      bank: bank || 0,
      sprites: null,
      p1: { x: 0, y: 0, w: 0, s: 0, z: 0, yl: 0, yr: 0 },
      p2: { x: 0, y: 0, w: 0, s: 0, z: 0, yl: 0, yr: 0 },
      clip: VH
    });
  }

  function addRoad(enter, hold, leave, curve, yEnd, bank) {
    const startY = lastY();
    const total = Math.max(1, enter + hold + leave);
    const b = bank || 0;
    let n;
    for (n = 0; n < enter; n++) {
      addSeg(easeIn(0, curve, n / enter), easeInOut(startY, yEnd, n / total), easeIn(0, b, n / enter));
    }
    for (n = 0; n < hold; n++) {
      addSeg(curve, easeInOut(startY, yEnd, (enter + n) / total), b);
    }
    for (n = 0; n < leave; n++) {
      addSeg(easeInOut(curve, 0, n / leave), easeInOut(startY, yEnd, (enter + hold + n) / total), easeInOut(b, 0, n / leave));
    }
  }

  function addSprite(i, offset, kind, h, w, lab) {
    i = wrapI(i);
    if (i < 0 || i >= segs.length) return;
    const s = segs[i];
    if (!s.sprites) s.sprites = [];
    s.sprites.push({ o: offset, k: kind, h: h, w: w, lab: lab || '' });
  }

  function buildTrack() {
    segs.length = 0;
    karts.length = 0;
    const night = isNight();
    const cAmp = night ? 1.24 : 1;
    const bAmp = night ? 1.32 : 1;

    addRoad(14, 32, 10, 0, 0, 0);
    addRoad(16, 46, 14, 6.4 * cAmp, 160, 0.16 * bAmp);
    addRoad(8, 16, 8, 0, 210, 0);
    addRoad(14, 38, 12, -7.6 * cAmp, 40, -0.19 * bAmp);
    addRoad(12, 26, 10, 2.4 * cAmp, 880, 0.06 * bAmp);
    addRoad(8, 14, 12, -1.6, -80, -0.04);
    addRoad(10, 20, 8, 8.4 * cAmp, 20, 0.2 * bAmp);
    addRoad(10, 22, 8, -8.8 * cAmp, 110, -0.21 * bAmp);
    addRoad(12, 34, 10, 9.6 * cAmp, 50, 0.22 * bAmp);
    addRoad(18, 64, 16, -7.0 * cAmp, 260, -0.18 * bAmp);
    addRoad(10, 18, 14, 1.4, -220, 0.05);
    addRoad(8, 14, 8, 7.8 * cAmp, -60, 0.17 * bAmp);
    addRoad(8, 14, 8, -8.0 * cAmp, 30, -0.18 * bAmp);
    addRoad(14, 28, 12, 2.2, 0, 0.04);
    addRoad(10, 22, 8, 0, 0, 0);

    G.trackLen = segs.length * SEG;
    G.lapArmed = false;
    placeSprites(night);
    placeKarts(night);
  }

  function placeSprites(night) {
    const n = segs.length;
    const step = night ? 3 : 4;
    for (let i = 6; i < n - 4; i += step) {
      const r = hash2(22 * 91 + i * 17);
      const side = hash2(22 + i * 3) > 0.5 ? 1 : -1;
      const dist = 1.22 + hash2(i + 9) * 1.45;
      if (night) {
        if (r > 0.18) addSprite(i, -dist - 0.2, 'build', 820 + (r * 720) | 0, 360);
        if (r > 0.34) addSprite(i, dist + 0.18, r > 0.78 ? 'lamp' : 'build', r > 0.78 ? 640 : 700, r > 0.78 ? 70 : 320);
        if ((i % 6) === 0) addSprite(i, side * 1.12, 'lamp', 640, 68);
      } else {
        if (r > 0.22) addSprite(i, -dist - 0.12, r > 0.7 ? 'rock' : 'palm', r > 0.7 ? 280 : 880 + (r * 220) | 0, r > 0.7 ? 230 : 240);
        if (r > 0.4) addSprite(i, dist + 0.1, r > 0.82 ? 'rock' : 'palm', r > 0.82 ? 260 : 820, r > 0.82 ? 210 : 230);
        if ((i % 16) === 0) addSprite(i, side * 1.08, 'flag', 520, 90);
      }
      if ((i % 22) === 0) addSprite(i, side * 1.35, 'stand', 420 + ((r * 180) | 0), 620);
      if ((i % 28) === 4) addSprite(i, side * 1.06, 'tire', 160, 220);
    }
    for (let k = 0; k < 8; k++) {
      addSprite(k, -1.28, 'stand', 480, 700);
      addSprite(k, 1.28, 'stand', 480, 700);
    }
    addSprite(2, -1.02, 'pillar', 1280, 140);
    addSprite(2, 1.02, 'pillar', 1280, 140);
    addSprite(2, 0, 'goal', 480, 860);
    addSprite(n - 3, -1.02, 'pillar', 1100, 130);
    addSprite(n - 3, 1.02, 'pillar', 1100, 130);
  }

  function kartColor(h) {
    if (h < 0.14) return [70, 210, 255];
    if (h < 0.28) return [255, 210, 70];
    if (h < 0.42) return [80, 230, 140];
    if (h < 0.56) return [220, 90, 255];
    if (h < 0.7) return [250, 250, 255];
    if (h < 0.84) return [255, 90, 160];
    return [90, 140, 255];
  }

  function placeKarts(night) {
    const n = night ? 8 : 4;
    const max = maxSpd();
    G.field = n + 1;
    for (let i = 0; i < n; i++) {
      const z = wrapZ((90 + i * (segs.length / (n + 1)) * 0.72 + hash2(22 + i) * 28) * SEG);
      karts.push({
        z: z,
        offset: (hash2(66 + i) - 0.5) * 1.05,
        spd: max * (0.42 + hash2(i + 8) * 0.38),
        col: kartColor(hash2(22 + i * 19)),
        passed: false,
        wob: hash2(i + 4) * TAU,
        near: false,
        laps: 0,
        drift: 0
      });
    }
  }

  function palette() {
    const night = isNight();
    if (night) {
      return {
        skyTop: [8, 4, 16],
        skyMid: [28, 10, 42],
        skyHor: [72, 18, 58],
        fog: [28, 12, 36],
        lg: [16, 14, 28], lg2: [12, 10, 22],
        rg: [18, 12, 30], rg2: [14, 10, 24],
        road: [26, 24, 36], road2: [34, 32, 46],
        rumble: [0, 240, 255], rumble2: [255, 45, 120],
        lane: [180, 230, 255],
        sun: [255, 196, 140],
        mtn1: [18, 10, 32], mtn2: [12, 8, 24],
        wall: [255, 45, 120]
      };
    }
    return {
      skyTop: [22, 8, 14],
      skyMid: [186, 52, 28],
      skyHor: [255, 132, 48],
      fog: [255, 150, 80],
      lg: [46, 92, 36], lg2: [38, 78, 30],
      rg: [132, 78, 32], rg2: [112, 64, 26],
      road: [42, 36, 40], road2: [52, 44, 48],
      rumble: [255, 110, 26], rumble2: [248, 236, 220],
      lane: [255, 214, 130],
      sun: [255, 196, 72],
      mtn1: [72, 28, 22], mtn2: [48, 18, 16],
      wall: [255, 110, 26]
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
        this.master.gain.value = this.muted ? 0 : 0.36;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.startEngine();
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
      const pulse = Math.sin(G.t * (16 + spd01 * 26)) * (4 + spd01 * 12);
      const f = 72 + spd01 * 188 + pulse + G.drift * 18;
      this.eng.frequency.setTargetAtTime(f, t, 0.04);
      this.eng2.frequency.setTargetAtTime(f * 0.48, t, 0.04);
      this.eng3.frequency.setTargetAtTime(f * 2.08, t, 0.04);
      this.engF.frequency.setTargetAtTime(380 + spd01 * 1500 + G.drift * 400, t, 0.07);
      const crashMul = G.crashT > 0 ? 0.32 : 1;
      this.engG.gain.setTargetAtTime(this.muted ? 0 : (0.026 + spd01 * 0.075 + G.drift * 0.02) * crashMul, t, 0.05);
    },
    sting() {
      this.beep(392, 0.08, 'square', 0.07, 784);
      this.beep(523, 0.12, 'triangle', 0.05);
      this.beep(784, 0.16, 'square', 0.045);
    },
    count(n) {
      const f = n <= 0 ? 880 : 440;
      this.beep(f, 0.1, 'square', 0.08);
      if (n <= 0) this.beep(1320, 0.18, 'triangle', 0.06);
    },
    driftOn() {
      this.noise(0.12, 0.16, 1400);
      this.beep(420, 0.08, 'sawtooth', 0.05, 220);
    },
    driftTick() {
      this.noise(0.05, 0.09, 1800);
      this.beep(980 + G.driftCombo * 40, 0.04, 'square', 0.035, 1400);
    },
    lap() {
      this.beep(523, 0.1, 'square', 0.085);
      this.beep(659, 0.12, 'triangle', 0.07);
      this.beep(784, 0.18, 'square', 0.06, 1046);
    },
    crash() {
      this.noise(0.3, 0.28, 180);
      this.beep(150, 0.26, 'sawtooth', 0.13, 42);
      this.beep(80, 0.34, 'square', 0.07, 36);
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

  function projectBank(worldX, worldY, worldZ, bank, camX, camY, camZ, out) {
    const dz = worldZ - camZ;
    out.z = dz;
    if (dz < 1) {
      out.s = 0;
      out.x = CX;
      out.y = VH;
      out.w = 0;
      out.yl = VH;
      out.yr = VH;
      return;
    }
    const s = CAM_D / dz;
    out.s = s;
    out.x = CX + (worldX - camX) * s * CX;
    out.y = HORIZON - (worldY - camY) * s * CX;
    out.w = ROAD_W * s * CX;
    out.yl = HORIZON - (worldY + bank * ROAD_W - camY) * s * CX;
    out.yr = HORIZON - (worldY - bank * ROAD_W - camY) * s * CX;
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
    if (particles.length > 260) particles.splice(0, particles.length - 260);
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
    ovKicker.textContent = kind === 'win' ? 'GOAL' : kind === 'lose' ? 'TIME UP' : 'DRFT';
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

  function loadAutoSpeed() {
    try {
      const n = parseInt(localStorage.getItem(AUTO_SPEED_KEY) || '3', 10);
      if (!isFinite(n) || n < 1 || n > 4) return 3;
      return n;
    } catch (err) {
      return 3;
    }
  }
  function saveAutoSpeed(n) {
    try { localStorage.setItem(AUTO_SPEED_KEY, String(n)); } catch (err) { /* ignore */ }
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

  function hud() {
    if (scoreEl) scoreEl.textContent = String(G.score | 0);
    if (bestEl) bestEl.textContent = String(kindBest() | 0);
    if (timeEl) timeEl.textContent = fmtTime(G.time);
    if (spdEl) spdEl.textContent = String(G.kmh | 0);
    if (stageLabel) {
      stageLabel.textContent = isNight() ? '夜涡' : '涡坡';
      stageLabel.classList.toggle('hot', G.lapsDone >= G.lapMax - 1 && G.mode === 'play');
    }
    if (tagLabel) {
      tagLabel.textContent = isNight() ? '夜漂' : '赛道';
      tagLabel.classList.toggle('night', isNight());
    }
    if (placeLabel) {
      placeLabel.textContent = G.mode === 'title' ? '名次 —' : ('名次 ' + G.place + '/' + G.field);
    }
    if (timeBox) timeBox.classList.toggle('low', G.mode === 'play' && G.time < 10);
    if (timeBar) {
      const t = clamp(G.time / Math.max(1, G.timeCap), 0, 1);
      timeBar.style.transform = 'scaleX(' + t + ')';
    }
    if (timeWrap) timeWrap.classList.toggle('low', G.mode === 'play' && G.time < 10);
    const lapShown = Math.min(G.lapMax, G.lapsDone + 1);
    if (lapEl) lapEl.textContent = lapShown + '/' + G.lapMax;
    if (lapBar) {
      const pct = G.trackLen ? (playerZ() / G.trackLen) : 0;
      lapBar.style.transform = 'scaleX(' + clamp(pct, 0, 1) + ')';
    }
    if (comboEl) {
      const show = G.mode === 'play' && (G.driftCombo > 1 || G.combo > 1 || G.flowN > 2);
      comboEl.hidden = !show;
      if (show) {
        if (G.driftCombo >= G.combo && G.driftCombo > 1) comboEl.textContent = '连漂 ×' + G.driftCombo;
        else if (G.combo > 1) comboEl.textContent = '连超 ×' + G.combo;
        else comboEl.textContent = '疾风 ×' + G.flowN;
      }
    }
    if (G.mode === 'title') setHint(autoOn ? '自动托管 · 即将开局 · A 停下' : OPS, autoOn ? 'hot' : '');
    else if (G.mode === 'win') setHint(autoOn ? '自动仍开着 · 即将再漂 · A 停下' : 'R 再漂 · 侧坡甩尾完圈', 'hot');
    else if (G.mode === 'lose') setHint(autoOn ? '自动仍开着 · 即将再漂 · A 停下' : 'R 重开 · 撞车只会减速，超时才结束', autoOn ? 'hot' : 'warn');
    else if (autoOn) setHint('托管中 · 过弯漂移 · A 停下', 'hot');
    else if (G.goT > 0) setHint('灯未绿 · 预备漂移', '');
    else if (G.time < 10) setHint('时间将尽 · 冲线加时', 'warn');
    else if (G.crashT > 0.4) setHint('复原中 · 油门起来再甩尾', 'warn');
    else if (G.drift > 0.45) setHint('漂移中 · 压住侧坡', 'hot');
    else setHint('← → 转向 · ↑ 油门 · 空格漂移过弯 · A 自动 · R 重开', '');
  }

  function resetRunVars() {
    G.z = 80;
    G.x = 0;
    G.lean = 0;
    G.steerVis = 0;
    G.drift = 0;
    G.driftHold = 0;
    G.slide = 0;
    G.roll = 0;
    G.air = 0;
    G.crashT = 0;
    G.bounce = 0;
    G.combo = 0;
    G.comboT = 0;
    G.driftCombo = 0;
    G.driftTick = 0;
    G.flow = 0;
    G.flowN = 0;
    G.gear = 1;
    G.ending = '';
    G.endT = 0;
    G.off = false;
    G.lapsDone = 0;
    G.lapArmed = false;
    G.place = 1;
    G.camYMem = 0;
    particles.length = 0;
    floats.length = 0;
    smears.length = 0;
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'course';
    G.score = 0;
    G.lapMax = lapMax();
    G.time = startTime();
    G.timeCap = G.time;
    G.goT = 0;
    resetRunVars();
    G.z = 0;
    G.spd = maxSpd() * 0.56;
    buildTrack();
    showOverlay('title', '漂移', '后视卡丁，侧坡甩尾。过弯漂移，超车完圈。撞了减速，超时出局。');
    hud();
  }

  function startGame(kind) {
    audio.ensure();
    autoOvWait = 0;
    G.kind = kind === 'night' ? 'night' : 'course';
    G.mode = 'play';
    G.lapMax = lapMax();
    G.score = 0;
    G.time = startTime();
    G.timeCap = G.time;
    resetRunVars();
    G.spd = 0;
    G.goT = 3;
    G.goFlash = 0.55;
    G.flash = 0.34;
    G.flashRgb = isNight() ? MAG : SUN;
    G.stop = 0;
    G.shake = 0;
    buildTrack();
    hideOverlay();
    audio.sting();
    audio.count(3);
    toast('3', false, true);
    hud();
  }

  function onOvertake(kart) {
    G.combo += 1;
    G.comboT = 2.15;
    const n = 90 * G.combo;
    bumpScore(n);
    floatText(CX + kart.offset * 80, VH * 0.58, '超车 ×' + G.combo, GOLD);
    audio.overtake(G.combo);
    if (G.combo >= 3) {
      hitStop(0.036);
      kick(3);
      screenFlash(CYN, 0.18);
    }
    if (G.combo === 3) toast('连超 ×3', false, true);
    if (G.combo === 6) toast('连超 ×6 · 爆走', false, true);
    popCombo();
    emit(10, {
      x: CX + kart.offset * 90, y: VH * 0.66, j: 14,
      vx0: -90, vx1: 90, vy0: -50, vy1: 70,
      r0: 1.4, r1: 3.2, life: 0.32, rgb: kart.col
    });
  }

  function onDriftCombo() {
    G.driftCombo += 1;
    const n = 42 * G.driftCombo;
    bumpScore(n);
    floatText(CX + G.slide * 40, VH * 0.52, '连漂 ×' + G.driftCombo, ORG);
    audio.driftTick();
    popCombo();
    if (G.driftCombo === 4) toast('连漂 ×4', false, true);
    if (G.driftCombo === 8) toast('连漂 ×8 · 贴墙', false, true);
    if (G.driftCombo === 12) toast('连漂 ×12 · 侧坡之王', false, true);
    if (G.driftCombo >= 3) {
      hitStop(0.032);
      kick(2.4);
    }
  }

  function crash(kind, other) {
    if (G.crashT > 0.18) return;
    G.crashT = 1.48;
    G.bounce = 1;
    G.spd *= kind === 'off' ? 0.22 : 0.34;
    G.drift = 0;
    G.driftHold = 0;
    if (other) {
      const dir = G.x >= other.offset ? 1 : -1;
      G.x += dir * 0.3;
    } else {
      G.x = clamp(G.x * 0.52, -0.82, 0.82);
    }
    G.combo = 0;
    G.driftCombo = 0;
    G.flowN = 0;
    G.flow = 0;
    audio.crash();
    hitStop(0.068);
    kick(8);
    screenFlash(MAG, 0.58);
    emit(34, {
      x: CX, y: VH - 64, j: 32,
      vx0: -280, vx1: 280, vy0: -220, vy1: 50,
      r0: 2, r1: 6, life: 0.55, rgb: COR
    });
    emit(16, {
      x: CX, y: VH - 70, j: 12,
      vx0: -90, vx1: 90, vy0: -170, vy1: -20,
      r0: 1, r1: 2.8, life: 0.36, rgb: GOLD
    });
    if (kind === 'off') {
      emit(16, {
        x: CX + G.lean * 30, y: VH - 40, j: 22,
        vx0: -70, vx1: 70, vy0: -40, vy1: 40,
        r0: 1.5, r1: 3.4, life: 0.4, rgb: isNight() ? [80, 90, 130] : [150, 110, 60]
      });
      toast('冲出 · 翻车减速', true, false);
    } else {
      toast('撞击 · 减速复原', true, false);
    }
  }

  function onLap() {
    G.lapsDone += 1;
    if (G.lapsDone >= G.lapMax) {
      finish('win');
      return;
    }
    const add = lapTime();
    G.time += add;
    G.timeCap = Math.max(G.timeCap, G.time);
    const bonus = 800 + ((G.time * 8) | 0) + G.driftCombo * 30 + G.combo * 24;
    bumpScore(bonus);
    audio.lap();
    hitStop(0.05);
    kick(4.6);
    screenFlash(GOLD, 0.62);
    floatText(CX, VH * 0.38, '+' + add + '″', GOLD);
    toast('第 ' + G.lapsDone + ' 圈  ·  +' + add + '″', false, true);
    emit(28, {
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
      const placeBonus = G.place === 1 ? 1500 : G.place === 2 ? 800 : G.place === 3 ? 400 : 160;
      const bonus = 2400 + ((G.time * 80) | 0) + placeBonus;
      bumpScore(bonus);
      maybeBest();
      G.mode = 'win';
      audio.win();
      hitStop(0.08);
      screenFlash(GOLD, 0.7);
      showOverlay('win', '冲线', (isNight() ? '夜漂' : '赛道') + ' 第 ' + G.place + ' 名　·　' + (G.score | 0) + ' 分');
    } else {
      maybeBest();
      G.mode = 'lose';
      audio.lose();
      kick(6);
      showOverlay('lose', '时间到', '跑完 ' + G.lapsDone + '/' + G.lapMax + ' 圈　·　' + (G.score | 0) + ' 分。撞车不会出局，超时才会。');
    }
    hud();
  }

  function updatePlace() {
    const pz = playerZ();
    const mine = progressOf(G.lapsDone, pz);
    let better = 0;
    for (let i = 0; i < karts.length; i++) {
      const c = karts[i];
      if (progressOf(c.laps, c.z) > mine) better += 1;
    }
    G.place = better + 1;
  }

  function updateKarts(dt) {
    const pz = playerZ();
    const playing = G.mode === 'play' && !G.ending && G.goT <= 0;
    const max = maxSpd();
    for (let i = 0; i < karts.length; i++) {
      const c = karts[i];
      const seg = findSeg(c.z);
      c.wob += dt * 2.1;
      if (G.goT > 0) continue;
      const want = clamp(-seg.curve * 0.08, -0.72, 0.72);
      c.offset = lerp(c.offset, want + Math.sin(c.wob) * 0.18, 1 - Math.pow(0.08, dt));
      c.offset = clamp(c.offset, -0.86, 0.86);
      const bankBoost = Math.abs(seg.bank) > 0.08 ? 1.04 : 1;
      c.spd = lerp(c.spd, max * (0.46 + hash2(i + 3) * 0.34) * bankBoost, 1 - Math.pow(0.2, dt));
      if (Math.abs(seg.curve) > 5) c.drift = lerp(c.drift, 1, 1 - Math.pow(0.05, dt));
      else c.drift = lerp(c.drift, 0, 1 - Math.pow(0.02, dt));
      const prevZ = c.z;
      const prevLaps = c.laps;
      c.z += c.spd * dt;
      if (c.z >= G.trackLen) {
        c.z -= G.trackLen;
        c.laps += 1;
      }
      const pProg = progressOf(G.lapsDone, pz);
      const cProg = progressOf(c.laps, c.z);
      const prevProg = progressOf(prevLaps, prevZ);
      if (!c.passed && pProg > prevProg && pProg - prevProg < 900) {
        c.passed = true;
        if (playing && G.crashT <= 0) onOvertake(c);
      }
      if (cProg > pProg + 500) c.passed = false;

      const dForward = (pz - c.z + G.trackLen) % G.trackLen;
      const dzLoop = Math.min(dForward, (c.z - pz + G.trackLen) % G.trackLen);
      const dx = Math.abs(c.offset - G.x);
      if (playing && G.crashT <= 0) {
        if (dzLoop < 200 && dx < 0.28) {
          crash('kart', c);
        } else if (dzLoop < 250 && dx < 0.44 && !c.near) {
          c.near = true;
          audio.near();
          emit(6, {
            x: CX + (c.offset - G.x) * 90, y: VH - 80, j: 8,
            vx0: -40, vx1: 40, vy0: -30, vy1: 40,
            r0: 1, r1: 2.2, life: 0.22, rgb: CYN
          });
        }
      }
      if (dzLoop > 900) c.near = false;
    }
  }

  function updateJuice(dt) {
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0003, dt));
    G.shake = Math.max(0, G.shake - dt * 26);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.goFlash = Math.max(0, G.goFlash - dt * 2.8);
    G.crashT = Math.max(0, G.crashT - dt);
    G.bounce = Math.max(0, G.bounce - dt);
    G.comboT = Math.max(0, G.comboT - dt);
    G.air = Math.max(0, G.air - dt * 1.6);
    if (G.comboT <= 0) G.combo = 0;
    if (G.drift < 0.25) {
      G.driftTick = 0;
      if (G.driftHold <= 0) G.driftCombo = Math.max(0, G.driftCombo - dt * 2.4);
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
  }

  function autoDemo(dt) {
    const seg = findSeg(G.z + PLAYER_Z);
    const want = clamp(-seg.curve * 0.15 + seg.bank * 1.4, -0.88, 0.88);
    G.lean = lerp(G.lean, want, 1 - Math.pow(0.012, dt));
    G.x += (want * 0.55 - G.x) * 2.3 * dt;
    G.x = clamp(G.x, -0.82, 0.82);
    G.spd = lerp(G.spd, maxSpd() * 0.62, 1 - Math.pow(0.08, dt));
    const wantDrift = Math.abs(seg.curve) > 4.5 && Math.abs(seg.bank) > 0.08 ? 0.85 : 0;
    G.drift = lerp(G.drift, wantDrift, 1 - Math.pow(0.04, dt));
    G.slide = lerp(G.slide, G.drift * (G.lean >= 0 ? 1 : -1) * 0.7, 1 - Math.pow(0.03, dt));
    G.z += G.spd * dt;
    if (G.z >= G.trackLen) G.z -= G.trackLen;
    if (G.z < 0) G.z += G.trackLen;
  }

  function wantGas() {
    if (autoOn) return autoGas;
    if (keys.u) return true;
    if (inputSrc === 'ptr' && pointer.down && pointer.y < VH * 0.86) return true;
    return false;
  }
  function wantBrake() {
    if (autoOn) return autoBrake;
    if (keys.d) return true;
    if (inputSrc === 'ptr' && pointer.down && pointer.y >= VH * 0.86) return true;
    return false;
  }
  function wantDrift() {
    if (autoOn) return autoDrift;
    return keys.drift;
  }

  function scanAhead(z0, dist) {
    let peak = 0;
    let peakB = 0;
    let sumC = 0;
    let sumB = 0;
    let n = 0;
    const step = SEG * 2;
    const span = Math.max(step, dist);
    for (let d = 0; d <= span; d += step) {
      const s = findSeg(wrapZ(z0 + d));
      const ac = Math.abs(s.curve);
      const ab = Math.abs(s.bank);
      if (ac > peak) peak = ac;
      if (ab > peakB) peakB = ab;
      sumC += s.curve;
      sumB += s.bank;
      n += 1;
    }
    return {
      peak: peak,
      peakB: peakB,
      curve: n ? sumC / n : 0,
      bank: n ? sumB / n : 0
    };
  }

  function thinkAuto(dt) {
    autoGas = true;
    autoBrake = false;
    autoDrift = false;
    if (G.mode !== 'play' || G.ending || G.goT > 0) {
      autoSteer = lerp(autoSteer, 0, 1 - Math.pow(0.02, dt || STEP));
      return;
    }

    const pz = playerZ();
    const spd01 = clamp(G.spd / maxSpd(), 0, 1);
    const seg = findSeg(pz);
    const lookDist = Math.max(1400, G.spd * 0.48);
    const now = scanAhead(pz, SEG * 4);
    const look = scanAhead(pz, lookDist);
    const next = scanAhead(pz + Math.max(1600, G.spd * 0.28), Math.max(1800, G.spd * 0.36));
    const curveNow = seg.curve * 0.82 + now.curve * 0.18;
    const bankNow = seg.bank * 0.82 + now.bank * 0.18;
    const peakC = Math.max(Math.abs(seg.curve), now.peak, look.peak);
    const peakB = Math.max(Math.abs(seg.bank), now.peakB, look.peakB);
    const corner = peakC > 2.2 || peakB > 0.05;
    const off = Math.abs(G.x) > 1.08;
    const crashed = G.crashT > 0.12;

    const tooInside = G.x * curveNow > 0 && Math.abs(G.x) > (G.drift > 0.5 ? 0.46 : 0.6);
    if (!crashed && !off && spd01 > 0.2 && corner && !tooInside) autoDrift = true;
    else if (!crashed && !off && G.drift > 0.38 && Math.abs(seg.curve) > 1.9 && !tooInside) autoDrift = true;

    const drifting = autoDrift || G.drift > 0.35;
    const cf = centrif() * (drifting ? 0.38 : 1);
    const driftSteer = 1 + (G.drift > 0.35 ? 0.62 : 0);

    let want = clamp(-curveNow * 0.08 - bankNow * 0.45, -0.62, 0.62);
    if (seg.curve * next.curve < -6 && Math.abs(next.curve) > 3.5) {
      want = clamp(-next.curve * 0.12, -0.58, 0.58);
    }
    if (Math.abs(want) < 0.04) want = 0;

    let threat = 0;
    let dodgeWant = want;
    const L = G.trackLen || 1;
    for (let i = 0; i < karts.length; i++) {
      const c = karts[i];
      const dForward = (c.z - pz + L) % L;
      if (dForward > 720 && dForward < L - 180) continue;
      const ahead = dForward <= 720 ? dForward : 0;
      const dx = c.offset - G.x;
      if (Math.abs(dx) > 0.38) continue;
      const urg = clamp(1.1 - ahead / 620, 0, 1) * (1 - Math.abs(dx) / 0.38);
      if (urg < 0.32 || urg < threat) continue;
      let side = dx >= 0 ? -1 : 1;
      const leftRoom = G.x + 0.8;
      const rightRoom = 0.8 - G.x;
      if (side < 0 && leftRoom < 0.2) side = 1;
      else if (side > 0 && rightRoom < 0.2) side = -1;
      dodgeWant = clamp(G.x + side * (0.28 + urg * 0.36), -0.78, 0.78);
      threat = urg;
    }
    if (threat > 0.34) want = dodgeWant;
    want = clamp(want, -0.8, 0.8);

    let err = want - G.x;
    if (Math.abs(err) < 0.04 && threat < 0.34) err = 0;
    const force = spd01 * (curveNow * cf - bankNow * 16);
    const edge = Math.max(0, Math.abs(G.x) - 0.42);
    const pull = -G.x * 2.6 * edge;
    let rawSteer = clamp(force / Math.max(0.42, driftSteer) * 1.18 + err * (off ? 5.2 : 3.6) + pull, -1, 1);

    if (off) {
      rawSteer = clamp(-G.x * 3.8 + force * 0.12, -1, 1);
      if (spd01 > 0.7 && Math.abs(G.x) > 1.28) autoBrake = true;
    }
    if (crashed) {
      rawSteer = clamp(-G.x * 2.2, -1, 1);
      autoDrift = false;
      autoBrake = false;
    }

    autoSteer = lerp(autoSteer, rawSteer, 1 - Math.pow(0.0016, dt || STEP));
    autoGas = !autoBrake;
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    tickAutoFlow(dt);
    const playing = G.mode === 'play' && !G.ending;
    const demo = G.mode === 'title';
    if (autoOn && playing && G.goT <= 0) thinkAuto(dt);
    const spd01 = clamp(G.spd / maxSpd(), 0, 1);
    audio.tickEngine(spd01, (playing || demo) && G.spd > 40);

    if (G.stop > 0) {
      if (autoOn && autoSpeed >= 4 && playing) G.stop = 0;
      else {
        G.stop -= dt;
        updateJuice(dt * 0.35);
        return;
      }
    }

    updateJuice(dt);

    if (G.mode === 'win' || G.mode === 'lose') {
      G.spd = Math.max(0, G.spd - maxSpd() * 0.62 * dt);
      G.z = wrapZ(G.z + G.spd * dt);
      G.kmh = (G.spd / maxSpd()) * kmhMax();
      G.lean = lerp(G.lean, 0, 1 - Math.pow(0.02, dt));
      G.drift = lerp(G.drift, 0, 1 - Math.pow(0.02, dt));
      return;
    }

    if (demo) autoDemo(dt);

    const seg = findSeg(G.z + PLAYER_Z);
    const playerY = lerp(seg.y1, seg.y2, clamp(((G.z + PLAYER_Z) / SEG) - Math.floor((G.z + PLAYER_Z) / SEG), 0, 1));
    if (G.camYMem && playerY < G.camYMem - 90 && spd01 > 0.46) {
      G.air = Math.max(G.air, 0.55);
    }
    G.camYMem = playerY;

    if (playing && G.goT > 0) {
      const shown = G.goT > 2 ? 3 : G.goT > 1 ? 2 : 1;
      G.goT -= dt;
      const next = G.goT > 2 ? 3 : G.goT > 1 ? 2 : G.goT > 0 ? 1 : 0;
      if (next !== shown) {
        G.goFlash = 0.55;
        if (next <= 0) {
          G.goT = 0;
          audio.count(0);
          toast('冲！', false, true);
          screenFlash(GOLD, 0.4);
        } else {
          audio.count(next);
          toast(String(next), false, true);
        }
      }
      G.kmh = 0;
      G.spd = 0;
      updatePlace();
      if (G.clock > 0.12) {
        G.clock = 0;
        hud();
      }
      return;
    }

    const dx = dt * (isNight() ? 2.42 : 2.08) * Math.max(0.22, spd01);

    let steer = 0;
    if (!demo) {
      if (autoOn) {
        steer = autoSteer;
      } else {
        if (keys.l) steer -= 1;
        if (keys.r) steer += 1;
        if (inputSrc === 'ptr' && pointer.down) {
          const tx = (pointer.x - CX) / (CX * 0.68);
          steer = clamp(tx * 1.4, -1, 1);
        }
      }
      if (G.crashT > 0) steer *= 0.28;
    }

    const canDrift = !demo && playing && G.crashT <= 0 && spd01 > 0.28 && wantDrift();
    const wasDrift = G.drift;
    if (!demo) {
      G.drift = lerp(G.drift, canDrift ? 1 : 0, 1 - Math.pow(canDrift ? 0.0004 : 0.008, dt));
      if (canDrift && wasDrift < 0.35 && G.drift >= 0.35) {
        audio.driftOn();
        hitStop(0.042);
        kick(3.2);
        screenFlash(ORG, 0.22);
        emit(18, {
          x: CX + (G.lean > 0 ? 36 : -36), y: VH - 36, j: 10,
          vx0: -140, vx1: 140, vy0: -40, vy1: 80,
          r0: 1.2, r1: 3.2, life: 0.32, rgb: GOLD
        });
      }
    }

    if (!demo) {
      const leanPow = isNight() ? 0.018 : 0.0005;
      G.lean = lerp(G.lean, steer, 1 - Math.pow(leanPow, dt));
      const driftSteer = 1 + G.drift * 0.62;
      G.x += G.lean * dx * (G.off ? 0.6 : 1) * driftSteer;
      const cf = centrif() * (G.drift > 0.35 ? 0.38 : 1);
      G.x -= dx * spd01 * (seg.curve * cf - seg.bank * 16);
      G.slide = lerp(G.slide, G.drift * (Math.abs(steer) > 0.1 ? (steer >= 0 ? 1 : -1) : (G.lean >= 0 ? 1 : -1)), 1 - Math.pow(0.02, dt));
    }
    if (G.crashT > 0) G.x += (0 - G.x) * 2.2 * dt;
    G.x = clamp(G.x, -2.18, 2.18);
    G.steerVis = lerp(G.steerVis, G.lean + G.slide * 0.35, 1 - Math.pow(0.0008, dt));
    G.curveMem = lerp(G.curveMem, seg.curve * spd01, 1 - Math.pow(0.04, dt));
    G.bankMem = lerp(G.bankMem, seg.bank, 1 - Math.pow(0.05, dt));
    G.roll = lerp(G.roll, G.bankMem * 1.65 + G.lean * 0.09, 1 - Math.pow(0.04, dt));

    const max = maxSpd();
    if (!demo) {
      if (G.crashT > 0) {
        G.spd += accel() * 0.18 * dt;
      } else if (wantBrake()) {
        G.spd += brake() * dt;
      } else if (wantGas()) {
        G.spd += accel() * (G.drift > 0.4 ? 0.78 : 1) * dt;
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
        r0: 1, r1: 2.3, life: 0.22, rgb: isNight() ? [90, 100, 140] : [170, 130, 70]
      });
    }
    G.spd = clamp(G.spd, 0, max);

    if (!demo) {
      const prevZ = G.z;
      G.z += G.spd * dt;
      if (G.z >= G.trackLen) G.z -= G.trackLen;
      if (G.z < 0) G.z += G.trackLen;
      const prevPct = prevZ / Math.max(1, G.trackLen);
      const nowPct = G.z / Math.max(1, G.trackLen);
      if (playing && prevPct > 0.72 && nowPct < 0.22) {
        onLap();
      }
    }

    G.kmh = clamp(G.spd / max, 0, 1) * kmhMax();

    const gear = spd01 < 0.2 ? 1 : spd01 < 0.46 ? 2 : spd01 < 0.72 ? 3 : 4;
    if (gear > G.gear && playing) audio.gear();
    G.gear = gear;

    if (playing && G.crashT <= 0) {
      if (G.off && spd01 > 0.42) crash('off');
      else if (Math.abs(G.x) > 1.52) crash('off');
    }

    if (playing && G.drift > 0.45 && G.crashT <= 0 && Math.abs(seg.curve) > 2.2) {
      G.driftHold += dt;
      G.driftTick += dt;
      if (G.driftTick >= 0.32) {
        G.driftTick = 0;
        onDriftCombo();
      }
      if (!REDUCE && Math.random() < 0.7) {
        const side = G.slide >= 0 ? 1 : -1;
        emit(2, {
          x: CX + side * 38 + G.lean * 10, y: VH - 30, j: 6,
          vx0: -80 * side, vx1: 40 * side, vy0: -20, vy1: 50,
          r0: 1.1, r1: 2.8, life: 0.22, rgb: Math.random() > 0.45 ? GOLD : ORG
        });
      }
    } else {
      G.driftHold = 0;
    }

    if (playing && spd01 > 0.82 && !G.off && G.crashT <= 0 && G.drift < 0.3) {
      G.flow += dt;
      if (G.flow >= 0.7) {
        G.flow = 0;
        G.flowN += 1;
        bumpScore(26 + G.flowN * 6);
        if (G.flowN === 4) toast('疾风', false, true);
        if (G.flowN === 8) toast('爆走', false, true);
      }
    } else {
      G.flow = 0;
      if (G.crashT > 0 || G.off) G.flowN = 0;
    }

    if (spd01 > 0.5 && !REDUCE) {
      if (smears.length < 22 && Math.random() < 0.55) {
        smears.push({
          x: rand(0, VW),
          y: rand(HORIZON + 8, VH),
          len: rand(16, 72) * spd01,
          a: rand(0.08, 0.24) * spd01,
          v: 860 + spd01 * 1500,
          lean: G.lean + G.roll * 2
        });
      }
    }
    for (let i = smears.length - 1; i >= 0; i--) {
      smears[i].y += smears[i].v * dt * 0.26;
      smears[i].x += smears[i].lean * 140 * dt;
      smears[i].a -= dt * 0.72;
      if (smears[i].a <= 0 || smears[i].y > VH + 10) smears.splice(i, 1);
    }

    if (spd01 > 0.55 && playing && G.crashT <= 0 && Math.random() < 0.16) {
      emit(1, {
        x: CX - G.lean * 18 + rand(-8, 8), y: VH - 28, j: 4,
        vx0: -20, vx1: 20, vy0: 10, vy1: 40,
        r0: 1, r1: 2, life: 0.18, rgb: [255, 170, 70]
      });
    }

    updateKarts(dt);
    updatePlace();

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

    const night = isNight();
    if (night) {
      for (let i = 0; i < 42; i++) {
        const hx = hash2(i * 19 + 3);
        const hy = hash2(i * 23 + 7);
        ctx.fillStyle = rgba(WHT, 0.22 + hash2(i) * 0.5);
        ctx.fillRect((hx * VW + G.curveMem * 2) % VW, hy * (HORIZON - 8), 1.4, 1.4);
      }
    }

    const sunX = CX + 176 - G.x * 14 - G.curveMem * 8;
    const sunY = HORIZON * (night ? 0.38 : 0.52);
    const sunR = night ? 11 : 22;
    const sg = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, 68);
    sg.addColorStop(0, rgba(night ? WHT : pal.sun, 0.95));
    sg.addColorStop(0.25, rgba(pal.sun, 0.55));
    sg.addColorStop(1, rgba(pal.sun, 0));
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 68, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(night ? [210, 200, 255] : pal.sun, 1);
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
    layer(pal.mtn1, 28, 44, 0.35, 22);
    layer(pal.mtn2, 12, 28, 0.62, 31);
  }

  function drawOneRoad(p1, p2, pal, alt, fog, chk) {
    const x1 = p1.x;
    const x2 = p2.x;
    const w1 = p1.w;
    const w2 = p2.w;
    const y1l = p1.yl;
    const y1r = p1.yr;
    const y2l = p2.yl;
    const y2r = p2.yr;
    const r1 = w1 * 1.18;
    const r2 = w2 * 1.18;
    const rd = mix(alt ? pal.road : pal.road2, pal.fog, fog);
    const rb = mix(alt ? pal.rumble : pal.rumble2, pal.fog, fog);
    const ln = mix(pal.lane, pal.fog, fog);
    quad(x1 - r1, y1l, x1 - w1, y1l, x2 - w2, y2l, x2 - r2, y2l, rb);
    quad(x1 + w1, y1r, x1 + r1, y1r, x2 + r2, y2r, x2 + w2, y2r, rb);
    quad(x1 - w1, y1l, x1 + w1, y1r, x2 + w2, y2r, x2 - w2, y2l, rd);
    if (chk) {
      const a = mix(alt ? WHT : [20, 16, 18], pal.fog, fog);
      const b = mix(alt ? [20, 16, 18] : WHT, pal.fog, fog);
      quad(x1 - w1, y1l, x1, (y1l + y1r) * 0.5, x2, (y2l + y2r) * 0.5, x2 - w2, y2l, a);
      quad(x1, (y1l + y1r) * 0.5, x1 + w1, y1r, x2 + w2, y2r, x2, (y2l + y2r) * 0.5, b);
    }
    if (!alt && !chk) {
      const lw1 = Math.max(1, w1 * 0.02);
      const lw2 = Math.max(0.8, w2 * 0.02);
      quad(x1 - lw1, (y1l + y1r) * 0.5, x1 + lw1, (y1l + y1r) * 0.5, x2 + lw2, (y2l + y2r) * 0.5, x2 - lw2, (y2l + y2r) * 0.5, ln);
    }
  }

  function drawSeg(seg, pal, fogT) {
    const p1 = seg.p1;
    const p2 = seg.p2;
    const alt = (Math.floor(seg.i / RUMBLE) & 1) === 0;
    const fog = fogT * fogT * 0.88;
    const lg = mix(alt ? pal.lg : pal.lg2, pal.fog, fog);
    const rg = mix(alt ? pal.rg : pal.rg2, pal.fog, fog);
    quad(0, p1.yl, p1.x - p1.w, p1.yl, p2.x - p2.w, p2.yl, 0, p2.yl, lg);
    quad(p1.x + p1.w, p1.yr, VW, p1.yr, VW, p2.yr, p2.x + p2.w, p2.yr, rg);
    const chk = seg.i < 9 || seg.i > segs.length - 8;
    drawOneRoad(p1, p2, pal, alt, fog, chk);

    const bank = Math.abs(seg.bank);
    if (bank > 0.07 && p1.w > 4) {
      const highL = seg.bank > 0;
      const h1 = bank * 520 * p1.s * CX * 0.00115;
      const h2 = bank * 520 * p2.s * CX * 0.00115;
      const wall = mix(pal.wall, pal.fog, fog * 0.7);
      if (highL) {
        quad(p1.x - p1.w * 1.18, p1.yl, p1.x - p1.w * 1.18, p1.yl - h1, p2.x - p2.w * 1.18, p2.yl - h2, p2.x - p2.w * 1.18, p2.yl, wall, 0.55);
      } else {
        quad(p1.x + p1.w * 1.18, p1.yr, p1.x + p1.w * 1.18, p1.yr - h1, p2.x + p2.w * 1.18, p2.yr - h2, p2.x + p2.w * 1.18, p2.yr, wall, 0.55);
      }
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
    const edgeY = spr.o < 0 ? p.yl : spr.o > 0 ? p.yr : p.y;
    const x = p.x + spr.o * p.w;
    const y0 = edgeY;
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
      ctx.fillStyle = rgba(night ? CYN : GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(x, y + h * 0.12, Math.max(2, w * 0.28), 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(night ? CYN : GOLD, 0.12);
      ctx.beginPath();
      ctx.arc(x, y + h * 0.12, w * 1.1, 0, TAU);
      ctx.fill();
    } else if (spr.k === 'flag') {
      ctx.fillStyle = rgba([70, 50, 40], 1);
      ctx.fillRect(x - w * 0.08, y, w * 0.12, h);
      ctx.fillStyle = rgba(altFlag(spr.h) ? SUN : WHT, 1);
      ctx.beginPath();
      ctx.moveTo(x + w * 0.04, y + h * 0.06);
      ctx.lineTo(x + w * 0.95, y + h * 0.16);
      ctx.lineTo(x + w * 0.04, y + h * 0.28);
      ctx.fill();
    } else if (spr.k === 'stand') {
      ctx.fillStyle = rgba(night ? [22, 14, 36] : [48, 28, 28], 1);
      ctx.fillRect(x - w * 0.5, y + h * 0.28, w, h * 0.72);
      ctx.fillStyle = rgba(night ? [36, 18, 48] : [72, 36, 30], 1);
      ctx.fillRect(x - w * 0.48, y + h * 0.18, w * 0.96, h * 0.16);
      for (let c = 0; c < 6; c++) {
        ctx.fillStyle = rgba(c & 1 ? PNK : WHT, 0.7);
        ctx.beginPath();
        ctx.arc(x - w * 0.36 + c * w * 0.14, y + h * 0.42, w * 0.04, 0, TAU);
        ctx.fill();
      }
    } else if (spr.k === 'tire') {
      ctx.fillStyle = '#141018';
      ctx.fillRect(x - w * 0.5, y + h * 0.15, w, h * 0.85);
      ctx.fillStyle = rgba(SUN, 0.55);
      ctx.fillRect(x - w * 0.5, y + h * 0.4, w, h * 0.12);
    } else if (spr.k === 'pillar') {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fillRect(x - w * 0.28, y, w * 0.56, h);
      ctx.fillStyle = rgba(SUN, 0.7);
      ctx.fillRect(x - w * 0.18, y + h * 0.08, w * 0.36, h * 0.84);
    } else if (spr.k === 'goal') {
      const tiles = 8;
      const tw = w / tiles;
      const th = h * 0.28;
      for (let i = 0; i < tiles; i++) {
        ctx.fillStyle = rgba(i & 1 ? WHT : [16, 12, 14], 0.92);
        ctx.fillRect(x - w * 0.5 + i * tw, y + h * 0.12, tw, th * 0.5);
        ctx.fillStyle = rgba(i & 1 ? [16, 12, 14] : WHT, 0.92);
        ctx.fillRect(x - w * 0.5 + i * tw, y + h * 0.12 + th * 0.5, tw, th * 0.5);
      }
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.font = 'bold ' + Math.max(10, h * 0.2) + 'px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GOAL', x, y + h * 0.08);
    }
    ctx.restore();
  }

  function altFlag(h) {
    return ((h | 0) % 2) === 0;
  }

  function drawRivalKart(c, p, clip) {
    const destW = 520 * p.s * CX * 0.00115;
    const destH = destW * 0.95;
    const x = p.x + c.offset * p.w;
    const y0 = lerp(p.yl, p.yr, (c.offset + 1) * 0.5);
    if (clipSprite(y0 - destH, destH, clip) <= 2 || destW < 2) return;
    const wob = Math.sin(c.wob) * destW * 0.04;
    const lean = Math.sin(c.wob * 0.6) * 0.1 + c.drift * 0.18 * (c.offset >= 0 ? 1 : -1);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VW, clip);
    ctx.clip();
    ctx.translate(x + wob, y0);
    ctx.rotate(lean);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, -destH * 0.05, destW * 0.48, destH * 0.1, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#121016';
    ctx.beginPath();
    ctx.ellipse(-destW * 0.28, -destH * 0.14, destW * 0.2, destH * 0.14, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(destW * 0.28, -destH * 0.14, destW * 0.2, destH * 0.14, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(mix(c.col, CYN, 0.3), 0.85);
    ctx.lineWidth = Math.max(1, destW * 0.03);
    ctx.stroke();
    ctx.fillStyle = rgba(c.col, 1);
    ctx.beginPath();
    ctx.moveTo(-destW * 0.28, -destH * 0.18);
    ctx.lineTo(-destW * 0.16, -destH * 0.52);
    ctx.lineTo(destW * 0.16, -destH * 0.52);
    ctx.lineTo(destW * 0.28, -destH * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(GOLD, 0.8);
    ctx.lineWidth = Math.max(1, destW * 0.025);
    ctx.beginPath();
    ctx.moveTo(-destW * 0.14, -destH * 0.5);
    ctx.lineTo(-destW * 0.14, -destH * 0.72);
    ctx.lineTo(destW * 0.14, -destH * 0.72);
    ctx.lineTo(destW * 0.14, -destH * 0.5);
    ctx.stroke();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.arc(0, -destH * 0.78, destW * 0.1, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawKartBody(leanAmt, crashSpin, scaleY, driftAmt) {
    ctx.save();
    ctx.rotate(leanAmt * 0.42 + crashSpin + driftAmt * 0.18);
    ctx.scale(1, scaleY);

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 52, 9, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#121016';
    ctx.beginPath();
    ctx.ellipse(-28, 10, 16, 12, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(28, 10, 16, 12, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(CYN, 0.85);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(-28, 10, 16, 12, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba(MAG, 0.85);
    ctx.beginPath();
    ctx.ellipse(28, 10, 16, 12, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#2a2430';
    ctx.beginPath();
    ctx.ellipse(-28, 10, 6, 5, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(28, 10, 6, 5, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#1a141c';
    ctx.beginPath();
    ctx.ellipse(-16, -2, 8, 6, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(16, -2, 8, 6, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(COR, 1);
    ctx.beginPath();
    ctx.moveTo(-22, 8);
    ctx.lineTo(-16, -16);
    ctx.lineTo(16, -16);
    ctx.lineTo(22, 8);
    ctx.lineTo(12, 14);
    ctx.lineTo(-12, 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(SUN, 0.95);
    ctx.beginPath();
    ctx.moveTo(-12, 4);
    ctx.lineTo(-8, -14);
    ctx.lineTo(8, -14);
    ctx.lineTo(12, 4);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = rgba(GOLD, 0.9);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-12, -14);
    ctx.lineTo(-12, -26);
    ctx.lineTo(12, -26);
    ctx.lineTo(12, -14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(0, -14);
    ctx.stroke();

    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillRect(-9, 2, 18, 7);
    ctx.fillStyle = '#1a1014';
    ctx.font = 'bold 8px "Segoe UI",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('22', 0, 5.5);

    ctx.fillStyle = rgba(WHT, 0.96);
    ctx.beginPath();
    ctx.arc(0, -32, 8.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(COR, 1);
    ctx.fillRect(-5, -36, 10, 4);

    ctx.fillStyle = rgba(CYN, 0.75);
    ctx.fillRect(-20, 8, 7, 4);
    ctx.fillRect(13, 8, 7, 4);

    if (driftAmt > 0.4) {
      ctx.strokeStyle = rgba(GOLD, 0.55);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-28, 16);
      ctx.lineTo(-48, 28);
      ctx.moveTo(28, 16);
      ctx.lineTo(48, 28);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawPlayer() {
    const lean = G.steerVis;
    const hop = (G.crashT > 0 ? Math.abs(Math.sin(G.crashT * 17)) * 16 * Math.min(1, G.crashT) : 0) + G.air * 18;
    const squat = (G.spd / maxSpd()) * 5 - G.drift * 3;
    const x = CX + lean * 48 + G.slide * 16;
    const y = VH - 30 - hop + squat;
    const spd01 = clamp(G.spd / maxSpd(), 0, 1);
    const crashSpin = G.crashT > 0 ? G.crashT * 9.2 : 0;

    if (spd01 > 0.42 && !REDUCE && (Math.abs(lean) > 0.08 || G.drift > 0.3)) {
      for (let i = 4; i >= 1; i--) {
        const k = i / 4;
        ctx.save();
        ctx.globalAlpha = (0.07 + Math.abs(lean) * 0.14 + G.drift * 0.1) * k * spd01;
        ctx.translate(x - lean * 22 * i - G.slide * 8 * i, y + 5 * i);
        drawKartBody(lean * 0.9, 0, 1, G.drift);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    ctx.save();
    ctx.translate(x, y);
    drawKartBody(lean * 0.38, crashSpin, 1 - hop * 0.008, G.drift);
    ctx.restore();
  }

  function drawRoad() {
    const pal = palette();
    const pz = G.z;
    const playerSeg = findSeg(pz + PLAYER_Z);
    const pPct = ((pz + PLAYER_Z) / SEG) - Math.floor((pz + PLAYER_Z) / SEG);
    const playerY = lerp(playerSeg.y1, playerSeg.y2, clamp(pPct, 0, 1));
    const baseI = Math.floor(pz / SEG);
    const baseSeg = segs[wrapI(baseI)] || dummy;
    const bPct = (pz / SEG) - baseI;
    const camX = G.x * ROAD_W;
    const camY = playerY + CAM_H + G.air * 90;
    const camZ = pz;

    let x = 0;
    let dx = -baseSeg.curve * clamp(bPct, 0, 1);
    const nDraw = Math.min(DRAW, segs.length);
    let maxy = VH;

    for (let n = 0; n < nDraw; n++) {
      const seg = segs[wrapI(baseI + n)];
      const nxt = segs[wrapI(baseI + n + 1)];
      const z1 = (baseI + n) * SEG;
      const z2 = z1 + SEG;
      projectBank(0, seg.y1, z1, seg.bank, camX - x, camY, camZ, seg.p1);
      projectBank(0, seg.y2, z2, nxt.bank, camX - x, camY, camZ, seg.p2);
      seg.clip = maxy;
      x += dx;
      dx += seg.curve;
    }

    const kartOn = [];
    for (let i = 0; i < karts.length; i++) {
      let ci = wrapI(Math.floor(karts[i].z / SEG)) - wrapI(baseI);
      if (ci < 0) ci += segs.length;
      if (ci >= 0 && ci < nDraw) {
        if (!kartOn[ci]) kartOn[ci] = [];
        kartOn[ci].push(karts[i]);
      }
    }

    for (let n = nDraw - 1; n >= 0; n--) {
      const seg = segs[wrapI(baseI + n)];
      const p1 = seg.p1;
      const p2 = seg.p2;
      if (p1.z <= CAM_D * 0.9 || Math.min(p2.yl, p2.yr, p2.y) >= maxy) continue;
      const fogT = n / Math.max(1, nDraw);
      drawSeg(seg, pal, fogT);
      if (p2.y < maxy) maxy = Math.min(maxy, Math.max(p2.yl, p2.yr, p2.y));
      if (seg.sprites) {
        for (let s = 0; s < seg.sprites.length; s++) {
          drawScenery(seg.sprites[s], p2, seg.clip, pal);
        }
      }
      if (kartOn[n]) {
        for (let k = 0; k < kartOn[n].length; k++) {
          const c = kartOn[n][k];
          const u = clamp((c.z - seg.z1) / SEG, 0, 1);
          drawRivalKart(c, {
            x: lerp(p1.x, p2.x, u),
            y: lerp(p1.y, p2.y, u),
            w: lerp(p1.w, p2.w, u),
            s: lerp(p1.s, p2.s, u),
            yl: lerp(p1.yl, p2.yl, u),
            yr: lerp(p1.yr, p2.yr, u)
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
    ctx.strokeStyle = rgba(G.drift > 0.3 ? GOLD : MAG, 0.04 + spd01 * 0.07 + G.drift * 0.06);
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

    if (G.drift > 0.2) {
      ctx.save();
      ctx.translate(70, VH - 58);
      ctx.fillStyle = rgba(WHT, 0.14);
      ctx.fillRect(-40, -3, 80, 6);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(-40, -3, 80 * G.drift, 6);
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.font = '9px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('漂', 0, -8);
      ctx.restore();
    }

    if (G.mode === 'play' && G.goT > 0) {
      const n = G.goT > 2 ? '3' : G.goT > 1 ? '2' : '1';
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.font = 'bold 64px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n, CX, VH * 0.42);
      ctx.restore();
    } else if (G.goFlash > 0) {
      ctx.save();
      ctx.globalAlpha = G.goFlash;
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.font = 'bold 64px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('冲', CX, VH * 0.42);
      ctx.restore();
    }

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

    const roll = REDUCE ? 0 : G.roll;
    ctx.save();
    ctx.translate(CX, HORIZON + 48);
    ctx.rotate(roll);
    ctx.translate(-CX, -(HORIZON + 48));

    if (segs.length) {
      drawSky(pal);
      drawMountains(pal);
      ctx.fillStyle = rgba(mix(pal.lg, pal.rg, 0.5), 1);
      ctx.fillRect(0, HORIZON, VW, VH - HORIZON);
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

  function autoClearInput() {
    keys.l = false;
    keys.r = false;
    keys.u = false;
    keys.d = false;
    keys.drift = false;
    pointer.down = false;
    pointer.id = null;
    autoSteer = 0;
    autoGas = true;
    autoBrake = false;
    autoDrift = false;
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    if (!speedEl) return;
    speedEl.value = String(autoSpeed);
    if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
    speedEl.title = SPEED_LABELS[autoSpeed];
    speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
  }

  function toggleAuto() {
    autoOn = !autoOn;
    autoOvWait = 0;
    autoClearInput();
    syncAutoUi();
    if (autoOn) {
      audio.ensure();
      if (G.mode === 'title') startGame('course');
    }
    hud();
  }

  function setAutoSpeed(n) {
    n = n | 0;
    if (n < 1 || n > 4 || !isFinite(n)) n = 3;
    autoSpeed = n;
    saveAutoSpeed(autoSpeed);
    syncSpeedUi();
  }

  function autoScale() {
    if (!autoOn || G.mode !== 'play') return 1;
    return AUTO_SCALE[autoSpeed] || 1;
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.25 : 0.5)) {
        autoOvWait = 0;
        startGame('course');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.7 : 1.15)) {
        autoOvWait = 0;
        startGame(G.kind || 'course');
      }
    }
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
    const code = e.code || '';
    if (k === 'a' || k === 'A' || code === 'KeyA') {
      if (down) {
        e.preventDefault();
        if (!e.repeat) toggleAuto();
      }
      return;
    }
    if (e.target === speedEl) return;
    const left = k === 'ArrowLeft' || k === 'Left';
    const right = k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D';
    const up = k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W';
    const dn = k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    if (down && (left || right || up || dn || space || k === 'Enter')) e.preventDefault();
    if (left) { keys.l = down && !autoOn; if (down) inputSrc = 'key'; }
    if (right) { keys.r = down && !autoOn; if (down) inputSrc = 'key'; }
    if (up) { keys.u = down && !autoOn; if (down) inputSrc = 'key'; }
    if (dn) { keys.d = down && !autoOn; if (down) inputSrc = 'key'; }
    if (space) {
      keys.drift = down && !autoOn && G.mode === 'play' && !overlayOpen();
      if (down) inputSrc = 'key';
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
    if (autoOn && (left || right || up || dn || space || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S')) {
      return;
    }
    if (k === '1') {
      startGame('course');
      return;
    }
    if (k === '2') {
      startGame('night');
      return;
    }
    if (k === 'Enter' || space) {
      if (overlayOpen()) primaryAction();
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      if (autoOn) return;
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
      if (autoOn) return;
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
      if (autoOn) return;
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
    const turbo = autoOn && autoSpeed >= 4 && G.mode === 'play';
    if (turbo) G.stop = 0;
    acc += dt * autoScale();
    let n = 0;
    const maxSteps = turbo ? 16 : 5;
    while (acc >= STEP && n < maxSteps) {
      update(STEP);
      acc -= STEP;
      n += 1;
    }
    if (acc > STEP * 4) acc = 0;
    draw();
  }

  function initMute() {
    let m = false;
    try { m = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { m = false; }
    audio.setMuted(m);
  }

  loadBest();
  initMute();
  autoSpeed = loadAutoSpeed();
  syncSpeedUi();
  syncAutoUi();
  goTitle();
  resize();
  bindPointer();
  holdKey(btnLeft, 'l');
  holdKey(btnRight, 'r');
  holdKey(btnGas, 'u');
  holdKey(btnBrake, 'd');
  holdKey(btnDrift, 'drift');

  if (btnCourse) {
    btnCourse.addEventListener('click', function () {
      audio.ensure();
      startGame('course');
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
  if (btnAuto) btnAuto.addEventListener('click', function () { toggleAuto(); });
  if (speedEl) {
    const onSpeed = function () {
      setAutoSpeed(parseInt(speedEl.value, 10) || 3);
    };
    speedEl.addEventListener('input', onSpeed);
    speedEl.addEventListener('change', onSpeed);
  }

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      autoClearInput();
    }
  });

  requestAnimationFrame(frame);
})();
