'use strict';

(function () {
  const VW = 720;
  const VH = 480;
  const CX = 360;
  const VIEW_TOP = 16;
  const DASH = 118;
  const FOCAL = 340;
  const NEAR = 1.4;
  const WORLD = 420;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 12000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 2.6;
  const YAW_SPD = 1.48;
  const PITCH_SPD = 1.18;
  const PITCH_MIN = -0.52;
  const PITCH_MAX = 0.58;
  const SPD_BASE = 28;
  const SHOT_V = 92;
  const ESHOT_V = 42;
  const P_RAD = 2.4;
  const RADAR_RANGE = 120;
  const ALT_MIN = 2.05;
  const ALT_MAX = 40;
  const ALT_SAFE = 14;
  const BEST_KEY = 'playbox-red-baron-best';
  const MUTE_KEY = 'playbox-red-baron-mute';
  const OPS = '←→ 偏航 · ↑↓ 俯仰 · 空格开火 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  const COARSE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(pointer: coarse)').matches
    : false;

  const RED = [255, 58, 40];
  const DIMR = [160, 72, 58];
  const ORG = [255, 138, 74];
  const GOLD = [255, 227, 107];
  const MAG = [255, 61, 184];
  const CYN = [128, 220, 255];
  const WHT = [255, 236, 228];
  const GRN = [120, 210, 90];

  const KIND_RGB = { scout: CYN, fighter: RED, ace: GOLD, aa: MAG };
  const KIND_SCORE = { scout: 200, fighter: 400, ace: 800, aa: 300 };
  const KIND_RAD = { scout: 2.15, fighter: 2.45, ace: 2.7, aa: 2.9 };
  const KIND_HP = { scout: 1, fighter: 1, ace: 2, aa: 2 };

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnPatrol = document.getElementById('btn-patrol');
  const btnMelee = document.getElementById('btn-melee');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const radarLabel = document.getElementById('radar-label');
  const altLabel = document.getElementById('alt-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
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
  let hudN = -1;

  const keys = { l: false, r: false, u: false, d: false };
  const ptrs = {};
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const shards = [];
  const streaks = [];
  const mountains = [];
  const barns = [];
  const vis = [];

  function boxEdges(x0, y0, z0, x1, y1, z1) {
    const c = [
      [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1],
      [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]
    ];
    const e = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7];
    const out = [];
    for (let i = 0; i < e.length; i += 2) {
      const a = c[e[i]];
      const b = c[e[i + 1]];
      out.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    }
    return out;
  }

  function concatEdges() {
    const out = [];
    for (let i = 0; i < arguments.length; i++) {
      const e = arguments[i];
      for (let j = 0; j < e.length; j++) out.push(e[j]);
    }
    return out;
  }

  function linePush(out, a, b) {
    out.push(a[0], a[1], a[2], b[0], b[1], b[2]);
  }

  function makeBiplane(s) {
    const k = s || 1;
    const e = [];
    const nose = [0, 0.06 * k, 2.25 * k];
    const mid = [0, 0.1 * k, 0.15 * k];
    const tail = [0, 0.28 * k, -2.45 * k];
    linePush(e, nose, mid);
    linePush(e, mid, tail);
    linePush(e, [-2.65 * k, 0.66 * k, 0.42 * k], [2.65 * k, 0.66 * k, 0.42 * k]);
    linePush(e, [-2.65 * k, 0.66 * k, 0.42 * k], [-2.65 * k, 0.66 * k, -0.18 * k]);
    linePush(e, [2.65 * k, 0.66 * k, 0.42 * k], [2.65 * k, 0.66 * k, -0.18 * k]);
    linePush(e, [-2.65 * k, 0.66 * k, -0.18 * k], [2.65 * k, 0.66 * k, -0.18 * k]);
    linePush(e, [-2.2 * k, -0.22 * k, 0.48 * k], [2.2 * k, -0.22 * k, 0.48 * k]);
    linePush(e, [-2.2 * k, -0.22 * k, 0.48 * k], [-2.2 * k, -0.22 * k, -0.12 * k]);
    linePush(e, [2.2 * k, -0.22 * k, 0.48 * k], [2.2 * k, -0.22 * k, -0.12 * k]);
    linePush(e, [-2.2 * k, -0.22 * k, -0.12 * k], [2.2 * k, -0.22 * k, -0.12 * k]);
    linePush(e, [-1.35 * k, 0.66 * k, 0.22 * k], [-1.35 * k, -0.22 * k, 0.22 * k]);
    linePush(e, [1.35 * k, 0.66 * k, 0.22 * k], [1.35 * k, -0.22 * k, 0.22 * k]);
    linePush(e, [-1.35 * k, 0.66 * k, 0.02 * k], [-1.35 * k, -0.22 * k, 0.02 * k]);
    linePush(e, [1.35 * k, 0.66 * k, 0.02 * k], [1.35 * k, -0.22 * k, 0.02 * k]);
    linePush(e, tail, [0, 1.12 * k, -2.12 * k]);
    linePush(e, [0, 1.12 * k, -2.12 * k], [0, 0.38 * k, -1.62 * k]);
    linePush(e, [-0.9 * k, 0.32 * k, -2.18 * k], [0.9 * k, 0.32 * k, -2.18 * k]);
    linePush(e, [-0.9 * k, 0.32 * k, -2.18 * k], tail);
    linePush(e, [0.9 * k, 0.32 * k, -2.18 * k], tail);
    linePush(e, [-0.42 * k, -0.22 * k, 0.55 * k], [-0.5 * k, -0.72 * k, 0.32 * k]);
    linePush(e, [0.42 * k, -0.22 * k, 0.55 * k], [0.5 * k, -0.72 * k, 0.32 * k]);
    linePush(e, [-0.5 * k, -0.72 * k, 0.32 * k], [0.5 * k, -0.72 * k, 0.32 * k]);
    linePush(e, [-0.22 * k, 0.1 * k, 0.55 * k], [-0.22 * k, 0.46 * k, 0.12 * k]);
    linePush(e, [0.22 * k, 0.1 * k, 0.55 * k], [0.22 * k, 0.46 * k, 0.12 * k]);
    linePush(e, [-0.22 * k, 0.46 * k, 0.12 * k], [0.22 * k, 0.46 * k, 0.12 * k]);
    return e;
  }

  const PLANE_SCOUT = makeBiplane(0.82);
  const PLANE_FIGHT = makeBiplane(1);
  const PLANE_ACE = makeBiplane(1.18);
  const AA_EDGES = concatEdges(
    boxEdges(-1.6, 0, -1.6, 1.6, 1.5, 1.6),
    boxEdges(-0.35, 1.5, -0.35, 0.35, 2.4, 0.35)
  );
  const BARN_EDGES = concatEdges(
    boxEdges(-4.2, 0, -3.2, 4.2, 4.4, 3.2),
    [
      -4.2, 4.4, -3.2, 0, 6.6, -3.2,
      4.2, 4.4, -3.2, 0, 6.6, -3.2,
      -4.2, 4.4, 3.2, 0, 6.6, 3.2,
      4.2, 4.4, 3.2, 0, 6.6, 3.2,
      0, 6.6, -3.2, 0, 6.6, 3.2
    ]
  );
  const TREE_EDGES = [
    0, 0, 0, 0, 3.2, 0,
    -1.8, 3.0, 0, 1.8, 3.0, 0,
    0, 3.0, -1.8, 0, 3.0, 1.8,
    -1.8, 3.0, 0, 0, 5.6, 0,
    1.8, 3.0, 0, 0, 5.6, 0,
    0, 3.0, -1.8, 0, 5.6, 0,
    0, 3.0, 1.8, 0, 5.6, 0
  ];
  const SHELL_EDGES = boxEdges(-0.18, -0.18, -0.5, 0.18, 0.18, 0.5);

  const G = {
    mode: 'title',
    kind: 'patrol',
    t: 0,
    clock: 0,
    wave: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    next1up: LIFE_EVERY,
    px: WORLD * 0.5,
    py: ALT_SAFE,
    pz: WORLD * 0.5,
    yaw: 0,
    pitch: 0,
    bank: 0,
    spd: SPD_BASE,
    cosY: 1,
    sinY: 0,
    cosP: 1,
    sinP: 0,
    enemies: [],
    shots: [],
    fireCd: 0,
    fireHold: false,
    gunSide: 1,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: RED,
    punch: 1,
    toastT: 0,
    why: '',
    muzzle: 0,
    recoil: 0,
    sweep: 0,
    sight: false,
    warnT: 0,
    waveT: 0,
    contacts: 0,
    yawIn: 0,
    pitchIn: 0
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function wrap(v) {
    v %= WORLD;
    if (v < 0) v += WORLD;
    return v;
  }
  function wrapD(d) {
    const h = WORLD * 0.5;
    if (d > h) d -= WORLD;
    if (d < -h) d += WORLD;
    return d;
  }
  function wrapAng(a) {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return a;
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function hypot3(x, y, z) {
    return Math.sqrt(x * x + y * y + z * z);
  }
  function distWrap(ax, az, bx, bz) {
    return hypot(wrapD(bx - ax), wrapD(bz - az));
  }
  function dist3(ax, ay, az, bx, by, bz) {
    return hypot3(wrapD(bx - ax), by - ay, wrapD(bz - az));
  }
  function turnToward(ang, want, max) {
    let d = wrapAng(want - ang);
    if (d > max) d = max;
    if (d < -max) d = -max;
    return ang + d;
  }
  function isMelee() {
    return G.kind === 'melee';
  }
  function dashY() {
    return VH - DASH;
  }
  function viewCy() {
    return (VIEW_TOP + dashY()) * 0.5;
  }
  function padL() {
    return { x: 86, y: VH - 58, r: 54 };
  }
  function padF() {
    return { x: VW - 86, y: VH - 58, r: 42 };
  }
  function radC() {
    return { x: CX, y: VH - 58, r: 50 };
  }

  function camPoint(wx, wy, wz) {
    const dx = wrapD(wx - G.px);
    const dy = wy - G.py;
    const dz = wrapD(wz - G.pz);
    const rx = dx * G.cosY - dz * G.sinY;
    const rz = dx * G.sinY + dz * G.cosY;
    const ry = dy * G.cosP - rz * G.sinP;
    const fz = dy * G.sinP + rz * G.cosP;
    return { x: rx, y: ry, z: fz };
  }

  function projCam(p) {
    const z = Math.max(NEAR, p.z);
    const inv = 1 / z;
    return {
      x: CX + FOCAL * p.x * inv,
      y: viewCy() - FOCAL * p.y * inv,
      s: FOCAL * inv,
      z: p.z,
      inv: inv
    };
  }

  function project(wx, wy, wz) {
    const c = camPoint(wx, wy, wz);
    if (c.z < NEAR) return null;
    return projCam(c);
  }

  function clipNear(a, b) {
    if (a.z < NEAR && b.z < NEAR) return null;
    if (a.z >= NEAR && b.z >= NEAR) return [a, b];
    const t = (NEAR - a.z) / (b.z - a.z);
    const n = {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: NEAR
    };
    return a.z >= NEAR ? [a, n] : [n, b];
  }

  function xf(lx, ly, lz, px, py, pz, yaw, pitch) {
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const y1 = ly * cp + lz * sp;
    const z1 = -ly * sp + lz * cp;
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    return {
      x: px + cy * lx + sy * z1,
      y: py + y1,
      z: pz - sy * lx + cy * z1
    };
  }

  function fwd() {
    return {
      x: G.sinY * G.cosP,
      y: G.sinP,
      z: G.cosY * G.cosP
    };
  }

  function right() {
    return { x: G.cosY, z: -G.sinY };
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    engOsc: null,
    engOsc2: null,
    engGain: null,
    engFilt: null,
    engOn: false,
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
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.34;
      if (this.engGain) {
        const t = this.ctx ? this.ctx.currentTime : 0;
        const vol = m ? 0 : (G.mode === 'play' ? 0.048 : 0.016);
        this.engGain.gain.setTargetAtTime(vol, t, 0.08);
      }
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (err) { /* ignore */ }
    },
    startEngine() {
      this.ensure();
      if (!this.ctx || this.engOn) return;
      const t = this.ctx.currentTime;
      this.engFilt = this.ctx.createBiquadFilter();
      this.engFilt.type = 'lowpass';
      this.engFilt.frequency.value = 380;
      this.engFilt.Q.value = 0.7;
      this.engGain = this.ctx.createGain();
      this.engGain.gain.value = 0.0001;
      this.engOsc = this.ctx.createOscillator();
      this.engOsc.type = 'sawtooth';
      this.engOsc.frequency.value = 58;
      this.engOsc2 = this.ctx.createOscillator();
      this.engOsc2.type = 'square';
      this.engOsc2.frequency.value = 29;
      const g2 = this.ctx.createGain();
      g2.gain.value = 0.28;
      this.engOsc.connect(this.engFilt);
      this.engOsc2.connect(g2);
      g2.connect(this.engFilt);
      this.engFilt.connect(this.engGain);
      this.engGain.connect(this.master);
      this.engOsc.start(t);
      this.engOsc2.start(t);
      this.engOn = true;
      const vol = this.muted ? 0 : (G.mode === 'play' ? 0.048 : 0.016);
      this.engGain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.22);
    },
    tickEngine() {
      if (!this.engOn || !this.engOsc || !this.ctx) return;
      const t = this.ctx.currentTime;
      const f = 50 + G.spd * 1.15 + G.pitch * 10;
      this.engOsc.frequency.setTargetAtTime(f, t, 0.07);
      this.engOsc2.frequency.setTargetAtTime(f * 0.5, t, 0.07);
      this.engFilt.frequency.setTargetAtTime(260 + G.spd * 7, t, 0.1);
      const vol = this.muted ? 0 : (G.mode === 'play' && G.deadT <= 0 ? 0.05 : G.mode === 'title' ? 0.016 : 0.01);
      this.engGain.gain.setTargetAtTime(vol, t, 0.12);
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
      f.frequency.value = hp || 900;
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
    shoot() {
      this.ensure();
      this.beep(980, 0.045, 'square', 0.036, 220);
      this.beep(240, 0.04, 'sawtooth', 0.028, 90);
      this.noise(0.035, 0.028, 1100);
    },
    enemyShot() {
      this.ensure();
      this.beep(210, 0.055, 'square', 0.022, 80);
    },
    hit(kind) {
      this.ensure();
      const base = kind === 'ace' ? 320 : kind === 'aa' ? 180 : kind === 'fighter' ? 480 : 620;
      this.noise(0.06, 0.045, 700);
      this.beep(base, 0.09, 'square', 0.05, base * 1.6);
    },
    explode() {
      this.ensure();
      this.noise(0.16, 0.058, 380);
      this.beep(210, 0.2, 'sawtooth', 0.05, 48);
    },
    ping() {
      this.ensure();
      this.beep(1480, 0.045, 'sine', 0.024, 2200);
    },
    warn() {
      this.ensure();
      this.beep(760, 0.07, 'square', 0.036, 380);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1320);
    },
    extra() {
      this.ensure();
      this.beep(784, 0.1, 'square', 0.04, 1046);
      this.beep(1175, 0.16, 'sine', 0.04, 1568);
    },
    death() {
      this.ensure();
      this.noise(0.2, 0.065, 240);
      this.beep(240, 0.24, 'sawtooth', 0.055, 52);
      this.beep(110, 0.34, 'sine', 0.048, 36);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 523);
      this.beep(523, 0.1, 'sine', 0.04, 659);
      this.beep(784, 0.18, 'triangle', 0.044, 1046);
    },
    start() {
      this.ensure();
      this.startEngine();
      this.beep(330, 0.09, 'square', 0.04, 660);
      this.beep(660, 0.14, 'triangle', 0.034, 990);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.042, 90);
      this.beep(140, 0.3, 'sine', 0.05, 48);
    },
    miss() {
      this.ensure();
      this.beep(150, 0.04, 'sine', 0.012, 70);
    },
    ground() {
      this.ensure();
      this.noise(0.12, 0.05, 180);
      this.beep(90, 0.22, 'sine', 0.05, 40);
    }
  };

  function loadBest() {
    try {
      const n = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
      G.best = isFinite(n) && n > 0 ? n : 0;
    } catch (err) {
      G.best = 0;
    }
    if (bestEl) bestEl.textContent = String(G.best);
  }

  function saveBest() {
    if (G.score <= G.best) return;
    G.best = G.score;
    if (bestEl) bestEl.textContent = String(G.best);
    try {
      localStorage.setItem(BEST_KEY, String(G.best));
    } catch (err) { /* ignore */ }
  }

  function addScore(n) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    if (scoreAdd) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + n;
      addTok += 1;
      const tok = addTok;
      setTimeout(function () {
        if (tok === addTok) scoreAdd.hidden = true;
      }, 700);
    }
    while (G.score >= G.next1up && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.next1up += LIFE_EVERY;
      audio.extra();
      toast('1UP', false, true);
      syncPips();
    }
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (G.mult > prev) {
      audio.combo(G.mult);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
    }
    comboTok += 1;
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    toastTok += 1;
    const tok = toastTok;
    G.toastT = 1.15;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1150);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = LIFE_CAP;
    while (pips.length < n) {
      const d = document.createElement('span');
      d.className = 'pip';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    for (let i = 0; i < n; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', G.mode !== 'title' && i >= G.lives && i < LIVES);
      pips[i].style.display = i < Math.max(LIVES, G.lives) ? '' : 'none';
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '红爵';
      else stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.wave >= 5);
    }
    if (tagLabel) {
      let tag = isMelee() ? '混战' : '巡空';
      if (G.mode === 'play' && G.warnT > 0) tag = '近敌';
      if (G.mode === 'play' && G.py < 5) tag = '低空';
      tagLabel.textContent = tag;
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || G.warnT > 0 || G.py < 5);
      tagLabel.classList.toggle('hot', G.combo >= 6 || (G.mode === 'play' && G.wave >= 6));
    }
    if (radarLabel) {
      if (G.mode === 'play') {
        radarLabel.textContent = '雷达 ' + G.contacts;
        radarLabel.classList.toggle('hot', G.contacts > 0);
        radarLabel.classList.toggle('warn', G.warnT > 0);
      } else {
        radarLabel.textContent = '雷达 —';
        radarLabel.classList.remove('hot');
        radarLabel.classList.remove('warn');
      }
    }
    if (altLabel) {
      altLabel.textContent = '高 ' + Math.round(G.py);
      altLabel.classList.toggle('warn', G.py < 5);
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.mult >= 2 ? '连击 ×' + G.mult : '连击 ' + G.combo;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 中弹、相撞或坠地扣命', 'warn');
    else if (G.py < 5) setHint('拉升 · 别撞地', 'warn');
    else if (G.warnT > 0) setHint('敌机接近 · 瞄准打掉', 'warn');
    else if (G.lives === 1) setHint('最后一命 · 雷达找敌', 'warn');
    else if (G.combo >= 6) setHint('连击 ×' + G.mult + ' · 继续扫', 'hot');
    else setHint('←→ 偏航 · ↑↓ 俯仰 · 空格开火 · 雷达找敌', '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, secondary) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : 'BARON';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (btnPatrol) btnPatrol.textContent = primary;
    if (btnMelee) {
      btnMelee.textContent = secondary;
      btnMelee.classList.remove('hidden');
    }
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag) {
    if (REDUCE) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.007));
    if (!stageEl || G.mode === 'title') return;
    kickTok += 1;
    const cls = mag >= 6 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
    G.flashRgb = rgb;
  }

  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }

  function burst(x, y, rgb, n, spd) {
    const count = REDUCE ? Math.min(8, n) : n;
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const v = rand(spd * 0.35, spd);
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v * 0.72 - v * 0.12,
        g: 52,
        life: rand(0.22, 0.6),
        max: 0.6,
        r: rand(1.2, 3.4),
        rgb: i % 3 === 0 ? WHT : rgb
      });
    }
    capArr(particles, 200);
  }

  function spark(x, y, rgb) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(sparks, 28);
  }

  function ring(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(rings, 18);
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, t: 0, life: 0.82, vy: -52, text: text, rgb: rgb });
    capArr(floats, 16);
  }

  function explodeAt(wx, wy, wz, rgb, n, scoreStr) {
    const p = project(wx, wy, wz);
    const sxv = p ? p.x : CX;
    const syv = p ? p.y : viewCy();
    burst(sxv, syv, rgb, n, 240);
    spark(sxv, syv, rgb);
    ring(sxv, syv, rgb);
    if (scoreStr) floatText(sxv, syv - 12, scoreStr, GOLD);
    const count = REDUCE ? 7 : 16;
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const v = rand(8, 28);
      shards.push({
        x: wx,
        y: wy + rand(-0.4, 0.8),
        z: wz,
        vx: Math.cos(a) * v,
        vy: rand(4, 18),
        vz: Math.sin(a) * v,
        lx: rand(-1.8, 1.8),
        ly: rand(-0.6, 1.2),
        lz: rand(-1.8, 1.8),
        life: rand(0.32, 0.78),
        rgb: i % 2 ? rgb : WHT
      });
    }
    capArr(shards, 90);
  }

  function seedMountains() {
    mountains.length = 0;
    const n = 72;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      let h = 6
        + Math.abs(Math.sin(i * 0.37) * 14)
        + Math.abs(Math.sin(i * 1.21) * 9)
        + Math.abs(Math.cos(i * 0.19) * 6);
      mountains.push({ a: a, h: h });
    }
  }

  function seedBarns() {
    barns.length = 0;
    const spots = [
      { x: 70, z: 90, kind: 'barn' },
      { x: 210, z: 60, kind: 'tree' },
      { x: 330, z: 140, kind: 'barn' },
      { x: 40, z: 250, kind: 'tree' },
      { x: 180, z: 280, kind: 'barn' },
      { x: 300, z: 320, kind: 'tree' },
      { x: 380, z: 40, kind: 'barn' },
      { x: 120, z: 360, kind: 'tree' },
      { x: 260, z: 200, kind: 'tree' },
      { x: 50, z: 170, kind: 'tree' },
      { x: 350, z: 250, kind: 'barn' },
      { x: 160, z: 40, kind: 'tree' }
    ];
    for (let i = 0; i < spots.length; i++) barns.push(spots[i]);
  }

  function waveSpec(n) {
    const melee = isMelee();
    let scouts = n <= 1 ? 3 : 2 + Math.min(4, Math.floor(n * 0.7));
    let fighters = n < 2 ? 0 : 1 + Math.min(3, n - 2);
    let aces = n < 4 ? 0 : (n >= 8 ? 2 : 1);
    let aa = n < 3 ? 0 : Math.min(4, n - 2);
    if (melee) {
      scouts += 2;
      fighters += n >= 2 ? 2 : 1;
      if (n >= 3) aces += 1;
      aa = n < 2 ? 1 : aa + 1;
    }
    return { scouts: scouts, fighters: fighters, aces: aces, aa: aa };
  }

  function diff() {
    return 1 + (G.wave - 1) * 0.07 + (isMelee() ? 0.16 : 0);
  }

  function spawnPlane(kind, near) {
    for (let i = 0; i < 24; i++) {
      const side = Math.random() < 0.22 ? (Math.random() < 0.5 ? -1 : 1) : 0;
      const da = side ? side * rand(0.7, 1.35) : rand(-0.55, 0.55);
      const d = near ? rand(72, 108) : rand(105, 178);
      const a = G.yaw + da;
      const x = wrap(G.px + Math.sin(a) * d);
      const z = wrap(G.pz + Math.cos(a) * d);
      const y = clamp(G.py + rand(-6, 8), 6, 32);
      if (dist3(x, y, z, G.px, G.py, G.pz) < 40) continue;
      const dx = wrapD(G.px - x);
      const dz = wrapD(G.pz - z);
      const yaw = Math.atan2(dx, dz) + rand(-0.85, 0.85);
      const spd = kind === 'ace' ? rand(30, 38) : kind === 'fighter' ? rand(24, 32) : rand(20, 27);
      G.enemies.push({
        kind: kind,
        x: x,
        y: y,
        z: z,
        yaw: yaw,
        pitch: rand(-0.12, 0.12),
        spd: spd,
        cool: rand(0.4, 1.4),
        weave: rand(0, TAU),
        weaveA: kind === 'ace' ? 1.6 : kind === 'fighter' ? 1.1 : 0.7,
        hp: KIND_HP[kind] || 1,
        alive: true,
        blip: 0,
        hitFlash: 0,
        age: 0,
        passT: 0
      });
      return;
    }
  }

  function spawnAA() {
    for (let i = 0; i < 18; i++) {
      const a = G.yaw + rand(-1.1, 1.1);
      const d = rand(50, 130);
      const x = wrap(G.px + Math.sin(a) * d);
      const z = wrap(G.pz + Math.cos(a) * d);
      if (distWrap(x, z, G.px, G.pz) < 28) continue;
      G.enemies.push({
        kind: 'aa',
        x: x,
        y: 1.2,
        z: z,
        yaw: 0,
        pitch: 0.6,
        spd: 0,
        cool: rand(0.8, 2.0),
        weave: 0,
        weaveA: 0,
        hp: KIND_HP.aa,
        alive: true,
        blip: 0,
        hitFlash: 0,
        age: 0,
        passT: 0
      });
      return;
    }
  }

  function clearField() {
    G.enemies.length = 0;
    G.shots.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    shards.length = 0;
    streaks.length = 0;
  }

  function spawnWave() {
    const spec = waveSpec(G.wave);
    let i;
    for (i = 0; i < spec.scouts; i++) spawnPlane('scout', i === 0);
    for (i = 0; i < spec.fighters; i++) spawnPlane('fighter', false);
    for (i = 0; i < spec.aces; i++) spawnPlane('ace', false);
    for (i = 0; i < spec.aa; i++) spawnAA();
    G.waveT = 0;
  }

  function aliveCount() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) n += 1;
    }
    return n;
  }

  function spawnShot(x, y, z, vx, vy, vz, from) {
    G.shots.push({
      x: x,
      y: y,
      z: z,
      px: x,
      py: y,
      pz: z,
      vx: vx,
      vy: vy,
      vz: vz,
      from: from,
      life: from === 'p' ? 1.55 : 2.4,
      alive: true
    });
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const f = fwd();
    const r = right();
    const side = G.gunSide;
    G.gunSide *= -1;
    const oxv = r.x * 0.55 * side;
    const ozv = r.z * 0.55 * side;
    spawnShot(
      wrap(G.px + f.x * 3.2 + oxv),
      G.py + f.y * 3.2 - 0.15,
      wrap(G.pz + f.z * 3.2 + ozv),
      f.x * SHOT_V,
      f.y * SHOT_V,
      f.z * SHOT_V,
      'p'
    );
    G.fireCd = isMelee() ? 0.07 : 0.085;
    G.muzzle = 0.08;
    G.recoil = 1;
    audio.shoot();
    kick(1.1);
    screenFlash(WHT, 0.1);
  }

  function killEnemy(e) {
    if (!e.alive) return;
    e.hp -= 1;
    e.hitFlash = 0.12;
    if (e.hp > 0) {
      audio.hit(e.kind);
      const p = project(e.x, e.y, e.z);
      if (p) {
        spark(p.x, p.y, WHT);
        burst(p.x, p.y, KIND_RGB[e.kind] || RED, 8, 140);
      }
      hitStop(0.032);
      kick(1.8);
      return;
    }
    e.alive = false;
    const rgb = KIND_RGB[e.kind] || RED;
    const base = KIND_SCORE[e.kind] || 200;
    bumpCombo();
    const pts = base * G.mult;
    addScore(pts);
    explodeAt(e.x, e.y, e.z, rgb, e.kind === 'ace' ? 32 : 22, '+' + pts);
    audio.hit(e.kind);
    audio.explode();
    hitStop(e.kind === 'ace' ? 0.072 : e.kind === 'aa' ? 0.048 : 0.055);
    kick(e.kind === 'ace' ? 5.4 : 3.8);
    screenFlash(rgb, 0.4);
  }

  function hitPlayer(why) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    G.lives -= 1;
    G.deadT = 0.95;
    G.invuln = 0;
    G.why = why || 'hit';
    breakCombo();
    explodeAt(G.px, G.py, G.pz, MAG, 36, '');
    if (why === 'ground') audio.ground();
    else audio.death();
    kick(7.4);
    hitStop(0.072);
    screenFlash(MAG, 0.55);
    syncPips();
    for (let i = 0; i < G.shots.length; i++) {
      if (G.shots[i].from === 'e') G.shots[i].alive = false;
    }
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'ground' ? '坠地了' : G.why === 'ram' ? '相撞了' : '击坠了';
    showOverlay(
      'lose',
      why,
      '第 ' + G.wave + ' 波 · ' + G.score + ' 分。R 立刻再来。',
      '再来',
      '换模式'
    );
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'patrol';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    G.deadT = 0;
    G.invuln = 0;
    G.px = WORLD * 0.5;
    G.py = ALT_SAFE;
    G.pz = WORLD * 0.5;
    G.yaw = 0.35;
    G.pitch = 0.04;
    G.bank = 0;
    G.flash = 0;
    G.shake = 0;
    G.warnT = 0;
    G.spd = SPD_BASE * 0.7;
    clearField();
    spawnPlane('scout', false);
    spawnPlane('fighter', false);
    spawnPlane('ace', false);
    showOverlay(
      'title',
      '红爵',
      '第一人称双翼机空战。俯仰偏航瞄准，机枪打飞机，雷达找敌。',
      '巡空',
      '混战'
    );
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'melee' ? 'melee' : 'patrol';
    G.mode = 'play';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.next1up = LIFE_EVERY;
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    G.px = WORLD * 0.5;
    G.py = ALT_SAFE;
    G.pz = WORLD * 0.4;
    G.yaw = 0;
    G.pitch = 0;
    G.bank = 0;
    G.deadT = 0;
    G.invuln = 1.2;
    G.fireCd = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.muzzle = 0;
    G.recoil = 0;
    G.fireHold = false;
    G.sweep = 0;
    G.warnT = 0;
    G.waveT = 0;
    G.spd = SPD_BASE;
    clearField();
    spawnWave();
    hideOverlay();
    audio.start();
    toast((isMelee() ? '混战' : '巡空') + ' · 第 1 波', false, true);
    syncHud();
  }

  function restart() {
    audio.ensure();
    audio.startEngine();
    if (G.mode === 'title') startGame('patrol');
    else startGame(G.kind);
  }

  function nextWave() {
    G.wave += 1;
    spawnWave();
    audio.wave();
    toast('第 ' + G.wave + ' 波 · 加速', false, true);
    kick(2.2);
    screenFlash(GOLD, 0.22);
  }

  function readStick(consume) {
    let sxv = 0;
    let syv = 0;
    let fire = false;
    const p = padL();
    const f = padF();
    const ids = Object.keys(ptrs);
    for (let i = 0; i < ids.length; i++) {
      const pt = ptrs[ids[i]];
      if (!pt) continue;
      if (pt.role === 'fire') fire = true;
      else if (pt.role === 'stick') {
        sxv = clamp((pt.x - p.x) / p.r, -1, 1);
        syv = clamp(-(pt.y - p.y) / p.r, -1, 1);
        const m = hypot(sxv, syv);
        if (m > 1) {
          sxv /= m;
          syv /= m;
        }
        if (m < 0.12) {
          sxv = 0;
          syv = 0;
        }
      } else if (pt.role === 'view' && pt.lx != null) {
        sxv += clamp((pt.x - pt.lx) * 0.16, -1, 1);
        syv += clamp(-(pt.y - pt.ly) * 0.16, -1, 1);
        if (consume) {
          pt.lx = pt.x;
          pt.ly = pt.y;
        }
      }
    }
    return { x: clamp(sxv, -1, 1), y: clamp(syv, -1, 1), fire: fire };
  }

  function inCircle(x, y, c) {
    return hypot(x - c.x, y - c.y) <= c.r + 6;
  }

  function classifyPtr(x, y) {
    if (inCircle(x, y, padF())) return 'fire';
    if (inCircle(x, y, padL())) return 'stick';
    if (inCircle(x, y, radC())) return 'radar';
    if (y > dashY() - 8) {
      if (x < CX) return 'stick';
      return 'fire';
    }
    return 'view';
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    const st = readStick(true);
    let yawIn = 0;
    let pitchIn = 0;
    if (keys.l) yawIn -= 1;
    if (keys.r) yawIn += 1;
    if (keys.u) pitchIn += 1;
    if (keys.d) pitchIn -= 1;
    yawIn = clamp(yawIn + st.x, -1, 1);
    pitchIn = clamp(pitchIn + st.y, -1, 1);
    G.yawIn = yawIn;
    G.pitchIn = pitchIn;
    G.yaw = wrapAng(G.yaw + yawIn * YAW_SPD * dt);
    G.pitch = clamp(G.pitch + pitchIn * PITCH_SPD * dt, PITCH_MIN, PITCH_MAX);
    syncTrig();
    G.bank = lerp(G.bank, yawIn * 0.22, clamp(dt * 5.5, 0, 1));
    G.spd = SPD_BASE * (1 - G.pitch * 0.32) * (isMelee() ? 1.06 : 1);
    const f = fwd();
    G.px = wrap(G.px + f.x * G.spd * dt);
    G.py = clamp(G.py + f.y * G.spd * dt, 1.2, ALT_MAX);
    G.pz = wrap(G.pz + f.z * G.spd * dt);
    if (G.py <= ALT_MIN && G.invuln <= 0) hitPlayer('ground');
    if ((G.fireHold || st.fire) && G.mode === 'play') fire();
    if (!REDUCE && G.spd > 30 && Math.random() < dt * 14) {
      streaks.push({
        x: rand(40, VW - 40),
        y: rand(VIEW_TOP + 20, dashY() - 20),
        v: 420 + G.spd * 8,
        life: rand(0.08, 0.16),
        max: 0.16
      });
      capArr(streaks, 40);
    }
  }

  function updateEnemies(dt) {
    const dmul = diff();
    G.contacts = 0;
    G.sight = false;
    let close = false;
    const sweepA = G.sweep;
    let didPing = false;
    const cy = viewCy();

    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      e.age += dt;
      e.cool = Math.max(0, e.cool - dt);
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      e.blip = Math.max(0, e.blip - dt * 2.4);
      e.weave += dt * e.weaveA;

      const dx = wrapD(G.px - e.x);
      const dy = G.py - e.y;
      const dz = wrapD(G.pz - e.z);
      const dist = hypot3(dx, dy, dz);
      const distH = hypot(dx, dz);
      const wantYaw = Math.atan2(dx, dz);
      const wantPitch = Math.atan2(dy, Math.max(4, distH));
      const cam = camPoint(e.x, e.y, e.z);

      if (distH < RADAR_RANGE && (e.kind === 'aa' || Math.abs(e.y - G.py) < 28)) {
        G.contacts += 1;
        const rx = dx * G.cosY - dz * G.sinY;
        const rz = dx * G.sinY + dz * G.cosY;
        const ba = Math.atan2(rx, rz);
        const da = wrapAng(ba - sweepA);
        if (da > 0 && da < 0.1 && e.blip <= 0) {
          e.blip = 1;
          if (!didPing && G.mode === 'play') {
            audio.ping();
            didPing = true;
          }
        }
      }

      if (cam.z > NEAR && cam.z < 90) {
        const p = projCam(cam);
        const box = e.kind === 'aa' ? 28 : 22;
        if (Math.abs(p.x - CX) < box && Math.abs(p.y - cy) < box) G.sight = true;
      }

      if (G.mode === 'title') {
        if (e.kind !== 'aa') {
          e.yaw = wrapAng(e.yaw + dt * 0.35);
          e.x = wrap(e.x + Math.sin(e.yaw) * 12 * dt);
          e.z = wrap(e.z + Math.cos(e.yaw) * 12 * dt);
        }
        continue;
      }

      if (e.kind === 'aa') {
        e.yaw = turnToward(e.yaw, wantYaw, 1.6 * dt);
        e.pitch = turnToward(e.pitch, clamp(wantPitch, 0.15, 1.1), 1.2 * dt);
        if (e.cool <= 0 && dist < 95 && dist > 10 && Math.abs(wrapAng(wantYaw - e.yaw)) < 0.28) {
          const cp = Math.cos(e.pitch);
          const sp = Math.sin(e.pitch);
          const cyw = Math.cos(e.yaw);
          const syw = Math.sin(e.yaw);
          const spd = (isMelee() ? 48 : 38) * (0.9 + dmul * 0.08);
          spawnShot(e.x, e.y + 2.2, e.z, syw * cp * spd, sp * spd, cyw * cp * spd, 'e');
          e.cool = (isMelee() ? 1.15 : 1.7) / Math.min(1.5, dmul);
          audio.enemyShot();
        }
        continue;
      }

      const ace = e.kind === 'ace';
      const fight = e.kind === 'fighter';
      const turn = (ace ? 2.1 : fight ? 1.55 : 1.15) * dmul;
      let face = wantYaw;
      if (dist < 18) {
        e.passT = 1.4;
        face = wantYaw + (ace ? 2.4 : 1.8);
      }
      if (e.passT > 0) {
        e.passT -= dt;
        face = e.yaw;
      }
      face += Math.sin(e.weave) * (ace ? 0.55 : 0.32);
      e.yaw = turnToward(e.yaw, face, turn * dt);
      let pit = wantPitch + Math.sin(e.weave * 0.7) * 0.18;
      if (e.y < 5) pit = Math.max(pit, 0.25);
      if (e.y > 34) pit = Math.min(pit, -0.15);
      e.pitch = clamp(turnToward(e.pitch, pit, (ace ? 1.4 : 0.95) * dt), -0.5, 0.5);
      const spd = e.spd * dmul * (0.92 + (isMelee() ? 0.12 : 0));
      const cp = Math.cos(e.pitch);
      const sp = Math.sin(e.pitch);
      e.x = wrap(e.x + Math.sin(e.yaw) * cp * spd * dt);
      e.y = clamp(e.y + sp * spd * dt, 3.2, 36);
      e.z = wrap(e.z + Math.cos(e.yaw) * cp * spd * dt);

      const dang = wrapAng(wantYaw - e.yaw);
      const aim = ace ? 0.18 : fight ? 0.24 : 0.3;
      if (
        e.cool <= 0 &&
        Math.abs(dang) < aim &&
        dist > 10 &&
        dist < (ace ? 78 : 62) &&
        cam.z > 4
      ) {
        const fx = Math.sin(e.yaw) * Math.cos(e.pitch);
        const fy = Math.sin(e.pitch);
        const fz = Math.cos(e.yaw) * Math.cos(e.pitch);
        const sv = ESHOT_V * (ace ? 1.2 : 1) * (0.9 + dmul * 0.1);
        spawnShot(e.x, e.y, e.z, fx * sv, fy * sv, fz * sv, 'e');
        e.cool = (ace ? 0.85 : fight ? 1.25 : 1.7) / Math.min(1.55, dmul);
        audio.enemyShot();
      }

      if (dist < 22) close = true;
      if (dist < 3.4) hitPlayer('ram');
    }

    if (close) {
      if (G.warnT <= 0) audio.warn();
      G.warnT = 0.45;
    } else {
      G.warnT = Math.max(0, G.warnT - dt);
    }

    if (G.mode === 'play' && aliveCount() === 0) {
      G.waveT += dt;
      if (G.waveT > 1.05) {
        addScore(500 * G.wave);
        nextWave();
      }
    }
  }

  function shotHits(s, e) {
    const r = (KIND_RAD[e.kind] || 2.2) + (s.from === 'p' ? 1.7 : 0.9);
    const d = dist3(s.x, s.y, s.z, e.x, e.y, e.z);
    if (d < r) return true;
    const dx = wrapD(s.x - s.px);
    const dy = s.y - s.py;
    const dz = wrapD(s.z - s.pz);
    const len = hypot3(dx, dy, dz);
    if (len < 0.2) return false;
    const ex = wrapD(e.x - s.px);
    const ey = e.y - s.py;
    const ez = wrapD(e.z - s.pz);
    let t = (ex * dx + ey * dy + ez * dz) / (len * len);
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    const hx = wrapD(s.px + dx * t - e.x);
    const hy = s.py + dy * t - e.y;
    const hz = wrapD(s.pz + dz * t - e.z);
    return hypot3(hx, hy, hz) < r;
  }

  function updateShots(dt) {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (!s.alive) continue;
      s.life -= dt;
      if (s.life <= 0) {
        s.alive = false;
        if (s.from === 'p') audio.miss();
        continue;
      }
      s.px = s.x;
      s.py = s.y;
      s.pz = s.z;
      s.x = wrap(s.x + s.vx * dt);
      s.y += s.vy * dt;
      s.z = wrap(s.z + s.vz * dt);
      if (s.y < 0.4) {
        s.alive = false;
        explodeAt(s.x, 0.4, s.z, s.from === 'p' ? WHT : MAG, 6, '');
        continue;
      }
      if (s.from === 'p') {
        for (let j = 0; j < G.enemies.length; j++) {
          const e = G.enemies[j];
          if (!e.alive) continue;
          if (shotHits(s, e)) {
            s.alive = false;
            killEnemy(e);
            break;
          }
        }
      } else if (G.deadT <= 0 && G.invuln <= 0) {
        if (dist3(s.x, s.y, s.z, G.px, G.py, G.pz) < P_RAD + 0.85) {
          s.alive = false;
          hitPlayer('shot');
        }
      }
    }
    let w = 0;
    for (let i = 0; i < G.shots.length; i++) {
      if (G.shots[i].alive) G.shots[w++] = G.shots[i];
    }
    G.shots.length = w;
    w = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) G.enemies[w++] = G.enemies[i];
    }
    G.enemies.length = w;
  }

  function updateFx(dt) {
    G.muzzle = Math.max(0, G.muzzle - dt * 1.6);
    G.recoil = Math.max(0, G.recoil - dt * 4.2);
    G.flash = Math.max(0, G.flash - dt * 2.6);
    G.shake = Math.max(0, G.shake - dt * 18);
    G.punch = lerp(G.punch, 1, clamp(dt * 10, 0, 1));
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.42) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      s.life -= dt;
      s.x = wrap(s.x + s.vx * dt);
      s.z = wrap(s.z + s.vz * dt);
      s.y += s.vy * dt;
      s.vy -= 22 * dt;
      if (s.y < 0.2) {
        s.y = 0.2;
        s.vy *= -0.28;
      }
      if (s.life <= 0) shards.splice(i, 1);
    }
    for (let i = streaks.length - 1; i >= 0; i--) {
      streaks[i].life -= dt;
      streaks[i].y += streaks[i].v * dt * 0.15;
      if (streaks[i].life <= 0) streaks.splice(i, 1);
    }
  }

  function syncTrig() {
    G.cosY = Math.cos(G.yaw);
    G.sinY = Math.sin(G.yaw);
    G.cosP = Math.cos(G.pitch);
    G.sinP = Math.sin(G.pitch);
  }

  function update(dt) {
    G.clock += dt;
    G.t += dt;
    syncTrig();
    G.sweep = wrapAng(G.sweep + dt * 1.9);
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.toastT > 0) G.toastT -= dt;
    audio.tickEngine();
    updateFx(dt);
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    if (G.mode === 'title') {
      G.yaw = wrapAng(G.yaw + dt * 0.16);
      G.pitch = Math.sin(G.clock * 0.35) * 0.06;
      syncTrig();
      G.bank = lerp(G.bank, 0.08, dt * 2);
      G.px = wrap(G.px + Math.sin(G.yaw) * 8 * dt);
      G.pz = wrap(G.pz + Math.cos(G.yaw) * 8 * dt);
      updateEnemies(dt);
      return;
    }
    if (G.mode !== 'play') return;
    if (G.deadT > 0) {
      G.deadT -= dt;
      updateEnemies(dt);
      updateShots(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          goLose();
          return;
        }
        G.py = Math.max(G.py, ALT_SAFE);
        G.pitch = 0;
        G.invuln = 1.55;
      }
      return;
    }
    if (G.invuln > 0) G.invuln -= dt;
    updatePlayer(dt);
    updateEnemies(dt);
    updateShots(dt);
  }

  function windowPath() {
    const top = VIEW_TOP;
    const bot = dashY();
    ctx.beginPath();
    ctx.moveTo(sx(52), sy(top));
    ctx.lineTo(sx(VW - 52), sy(top));
    ctx.lineTo(sx(VW - 12), sy(bot));
    ctx.lineTo(sx(12), sy(bot));
    ctx.closePath();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(viewCy() + 40));
    g.addColorStop(0, '#140608');
    g.addColorStop(0.55, '#2a0c10');
    g.addColorStop(1, '#3a1412');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, dashY() * scale);
    const sunA = wrapAng(1.15 - G.yaw);
    if (Math.abs(sunA) < 1.2) {
      const sxv = CX + FOCAL * Math.tan(sunA);
      const syv = viewCy() - FOCAL * Math.tan(0.18 - G.pitch);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.arc(sx(sxv), sy(syv), 18 * scale, 0, TAU);
      ctx.fillStyle = rgba(GOLD, 0.22);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx(sxv), sy(syv), 7 * scale, 0, TAU);
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawMountains() {
    const hy = viewCy() + FOCAL * Math.tan(G.pitch);
    ctx.beginPath();
    let pen = false;
    const n = mountains.length;
    for (let k = -1; k <= 1; k++) {
      for (let i = 0; i <= n; i++) {
        const m = mountains[i % n];
        const da = wrapAng(m.a - G.yaw + k * TAU);
        if (Math.abs(da) > 1.32) {
          pen = false;
          continue;
        }
        const x = CX + FOCAL * Math.tan(da);
        const y = hy - m.h * (0.85 + 0.2 * Math.cos(da));
        if (!pen) {
          ctx.moveTo(sx(x), sy(y));
          pen = true;
        } else {
          ctx.lineTo(sx(x), sy(y));
        }
      }
      pen = false;
    }
    ctx.strokeStyle = rgba(DIMR, 0.85);
    ctx.lineWidth = Math.max(1, 1.2 * scale);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(sx(-20), sy(hy));
    ctx.lineTo(sx(VW + 20), sy(hy));
    ctx.strokeStyle = rgba(RED, 0.55);
    ctx.lineWidth = Math.max(1, 1.2 * scale);
    ctx.stroke();
  }

  function drawGround() {
    const step = 18;
    const range = 9;
    const gx = Math.floor(G.px / step) * step;
    const gz = Math.floor(G.pz / step) * step;
    ctx.beginPath();
    let any = false;
    function addLine(x0, z0, x1, z1) {
      const c1 = camPoint(x0, 0, z0);
      const c2 = camPoint(x1, 0, z1);
      const cl = clipNear(c1, c2);
      if (!cl) return;
      const p1 = projCam(cl[0]);
      const p2 = projCam(cl[1]);
      if ((p1.y < VIEW_TOP - 20 && p2.y < VIEW_TOP - 20) || (p1.y > dashY() + 30 && p2.y > dashY() + 30)) return;
      ctx.moveTo(sx(p1.x), sy(p1.y));
      ctx.lineTo(sx(p2.x), sy(p2.y));
      any = true;
    }
    for (let i = -range; i <= range; i++) {
      const z = gz + i * step;
      addLine(gx - range * step, z, gx + range * step, z);
      const x = gx + i * step;
      addLine(x, gz - range * step, x, gz + range * step);
    }
    if (any) {
      ctx.strokeStyle = rgba(DIMR, 0.28);
      ctx.lineWidth = Math.max(1, 0.9 * scale);
      ctx.stroke();
    }
  }

  function strokeEdges(edges, px, py, pz, yaw, pitch, rgb, a, lw) {
    ctx.beginPath();
    let any = false;
    for (let i = 0; i < edges.length; i += 6) {
      const p1 = xf(edges[i], edges[i + 1], edges[i + 2], px, py, pz, yaw, pitch);
      const p2 = xf(edges[i + 3], edges[i + 4], edges[i + 5], px, py, pz, yaw, pitch);
      const c1 = camPoint(p1.x, p1.y, p1.z);
      const c2 = camPoint(p2.x, p2.y, p2.z);
      const cl = clipNear(c1, c2);
      if (!cl) continue;
      const a1 = projCam(cl[0]);
      const a2 = projCam(cl[1]);
      if ((a1.x < -40 && a2.x < -40) || (a1.x > VW + 40 && a2.x > VW + 40)) continue;
      if ((a1.y < -20 && a2.y < -20) || (a1.y > dashY() + 20 && a2.y > dashY() + 20)) continue;
      ctx.moveTo(sx(a1.x), sy(a1.y));
      ctx.lineTo(sx(a2.x), sy(a2.y));
      any = true;
    }
    if (!any) return;
    ctx.strokeStyle = rgba(rgb, a);
    ctx.lineWidth = Math.max(1, lw * scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function drawProp(e) {
    const ang = G.clock * (e.kind === 'ace' ? 38 : 28) + e.age * 4;
    const len = e.kind === 'ace' ? 1.15 : e.kind === 'scout' ? 0.78 : 0.95;
    const a1 = [Math.cos(ang) * len, Math.sin(ang) * 0.18, 2.28 * (e.kind === 'ace' ? 1.18 : e.kind === 'scout' ? 0.82 : 1)];
    const a2 = [-a1[0], -a1[1], a1[2]];
    const b1 = [Math.cos(ang + 1.57) * len * 0.7, Math.sin(ang + 1.57) * 0.14, a1[2]];
    const b2 = [-b1[0], -b1[1], a1[2]];
    const edges = [];
    linePush(edges, a1, a2);
    linePush(edges, b1, b2);
    strokeEdges(edges, e.x, e.y, e.z, e.yaw, e.pitch, WHT, 0.55, 1.05);
  }

  function planeEdges(kind) {
    if (kind === 'ace') return PLANE_ACE;
    if (kind === 'scout') return PLANE_SCOUT;
    return PLANE_FIGHT;
  }

  function collectVis() {
    vis.length = 0;
    for (let i = 0; i < barns.length; i++) {
      const b = barns[i];
      const c = camPoint(b.x, 2.5, b.z);
      if (c.z > NEAR && c.z < 180) vis.push({ z: c.z, kind: 'barn', o: b });
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const c = camPoint(e.x, e.y, e.z);
      if (c.z > 0.5 && c.z < 200) vis.push({ z: c.z, kind: 'enemy', o: e });
    }
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (!s.alive) continue;
      const c = camPoint(s.x, s.y, s.z);
      if (c.z > 0.5 && c.z < 200) vis.push({ z: c.z, kind: 'shot', o: s });
    }
    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      const c = camPoint(s.x, s.y, s.z);
      if (c.z > 0.5 && c.z < 200) vis.push({ z: c.z, kind: 'shard', o: s });
    }
    vis.sort(function (a, b) { return b.z - a.z; });
  }

  function drawVis() {
    for (let i = 0; i < vis.length; i++) {
      const v = vis[i];
      if (v.kind === 'barn') {
        const b = v.o;
        const fade = clamp(1.1 - v.z / 170, 0.18, 0.72);
        if (b.kind === 'tree') strokeEdges(TREE_EDGES, b.x, 0, b.z, 0, 0, GRN, fade, 1.1);
        else strokeEdges(BARN_EDGES, b.x, 0, b.z, 0, 0, DIMR, fade, 1.15);
      } else if (v.kind === 'enemy') {
        const e = v.o;
        let rgb = e.hitFlash > 0 ? WHT : (KIND_RGB[e.kind] || RED);
        const fade = clamp(1.2 - v.z / 170, 0.35, 1);
        const lw = clamp(1.15 + 10 / Math.max(4, v.z), 1.15, 2.6);
        if (e.kind === 'aa') {
          strokeEdges(AA_EDGES, e.x, 0, e.z, e.yaw, 0, rgb, fade, lw);
          const barrel = [
            0, 2.2, 0, 0, 2.2 + Math.sin(e.pitch) * 3.2, Math.cos(e.pitch) * 3.2
          ];
          strokeEdges(barrel, e.x, 0, e.z, e.yaw, 0, rgb, fade, lw);
        } else {
          strokeEdges(planeEdges(e.kind), e.x, e.y, e.z, e.yaw, e.pitch, rgb, fade, lw);
          drawProp(e);
        }
      } else if (v.kind === 'shot') {
        const s = v.o;
        const rgb = s.from === 'p' ? WHT : MAG;
        const p1 = project(s.px, s.py, s.pz);
        const p2 = project(s.x, s.y, s.z);
        if (p2) {
          ctx.beginPath();
          if (p1) {
            ctx.moveTo(sx(p1.x), sy(p1.y));
            ctx.lineTo(sx(p2.x), sy(p2.y));
          } else {
            ctx.moveTo(sx(p2.x), sy(p2.y));
            ctx.lineTo(sx(p2.x), sy(p2.y + 1));
          }
          ctx.strokeStyle = rgba(rgb, 0.9);
          ctx.lineWidth = Math.max(1.2, (s.from === 'p' ? 2.1 : 1.6) * scale);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(sx(p2.x), sy(p2.y), Math.max(1.3, 2.6 * p2.inv * 6) * scale, 0, TAU);
          ctx.fillStyle = rgba(rgb, 0.7);
          ctx.fill();
        } else {
          strokeEdges(SHELL_EDGES, s.x, s.y, s.z, 0, 0, rgb, 0.9, 1.3);
        }
      } else if (v.kind === 'shard') {
        const s = v.o;
        const p1 = project(s.x, s.y, s.z);
        const p2 = project(s.x + s.lx, s.y + s.ly, s.z + s.lz);
        if (!p1 || !p2) continue;
        ctx.beginPath();
        ctx.moveTo(sx(p1.x), sy(p1.y));
        ctx.lineTo(sx(p2.x), sy(p2.y));
        ctx.strokeStyle = rgba(s.rgb, clamp(s.life * 2.2, 0, 1));
        ctx.lineWidth = Math.max(1, 1.3 * scale);
        ctx.stroke();
      }
    }
  }

  function drawFx() {
    for (let i = 0; i < streaks.length; i++) {
      const s = streaks[i];
      const a = s.life / s.max;
      ctx.beginPath();
      ctx.moveTo(sx(s.x), sy(s.y));
      ctx.lineTo(sx(s.x), sy(s.y + 18 * a));
      ctx.strokeStyle = rgba(WHT, 0.18 * a);
      ctx.lineWidth = Math.max(1, 1.1 * scale);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const t = r.t / 0.42;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (12 + t * 50) * scale, 0, TAU);
      ctx.strokeStyle = rgba(r.rgb, 0.7 * (1 - t));
      ctx.lineWidth = Math.max(1, (2.2 - t) * scale);
      ctx.stroke();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const t = s.t / 0.28;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(s.rgb, 0.55 * (1 - t));
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (18 - t * 8) * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.fillRect(sx(p.x) - p.r * scale * 0.5, sy(p.y) - p.r * scale * 0.5, p.r * scale, p.r * scale);
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = '700 ' + Math.max(11, 14 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
      ctx.restore();
    }
  }

  function drawSight() {
    const cy = viewCy();
    const rgb = G.sight ? GOLD : RED;
    const a = G.sight ? 0.95 : 0.62;
    const w = 28;
    const h = 20;
    ctx.strokeStyle = rgba(rgb, a);
    ctx.lineWidth = Math.max(1, 1.4 * scale);
    ctx.strokeRect(sx(CX - w), sy(cy - h), w * 2 * scale, h * 2 * scale);
    ctx.beginPath();
    ctx.moveTo(sx(CX), sy(cy - h - 8));
    ctx.lineTo(sx(CX), sy(cy - h));
    ctx.moveTo(sx(CX), sy(cy + h));
    ctx.lineTo(sx(CX), sy(cy + h + 8));
    ctx.moveTo(sx(CX - w - 8), sy(cy));
    ctx.lineTo(sx(CX - w), sy(cy));
    ctx.moveTo(sx(CX + w), sy(cy));
    ctx.lineTo(sx(CX + w + 8), sy(cy));
    ctx.moveTo(sx(CX - 6), sy(cy));
    ctx.lineTo(sx(CX + 6), sy(cy));
    ctx.moveTo(sx(CX), sy(cy - 6));
    ctx.lineTo(sx(CX), sy(cy + 6));
    ctx.stroke();
    if (G.muzzle > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const rec = G.recoil * 8;
      ctx.fillStyle = rgba(GOLD, G.muzzle * 4.2);
      ctx.beginPath();
      ctx.arc(sx(CX - 18), sy(cy + 36 + rec), 10 * scale, 0, TAU);
      ctx.arc(sx(CX + 18), sy(cy + 36 + rec), 10 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawFrame() {
    ctx.fillStyle = '#0c0506';
    ctx.fillRect(sx(0), sy(0), VW * scale, VIEW_TOP * scale);
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(0));
    ctx.lineTo(sx(52), sy(VIEW_TOP));
    ctx.lineTo(sx(12), sy(dashY()));
    ctx.lineTo(sx(0), sy(dashY()));
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx(VW), sy(0));
    ctx.lineTo(sx(VW - 52), sy(VIEW_TOP));
    ctx.lineTo(sx(VW - 12), sy(dashY()));
    ctx.lineTo(sx(VW), sy(dashY()));
    ctx.closePath();
    ctx.fill();
    windowPath();
    ctx.strokeStyle = rgba(RED, 0.48);
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx(CX - 90), sy(dashY() - 4));
    ctx.lineTo(sx(CX - 28), sy(viewCy() + 70));
    ctx.lineTo(sx(CX + 28), sy(viewCy() + 70));
    ctx.lineTo(sx(CX + 90), sy(dashY() - 4));
    ctx.strokeStyle = rgba(ORG, 0.35);
    ctx.lineWidth = Math.max(1, 1.2 * scale);
    ctx.stroke();
  }

  function drawDash() {
    ctx.fillStyle = '#100406';
    ctx.fillRect(sx(0), sy(dashY()), VW * scale, DASH * scale);
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(dashY()));
    ctx.lineTo(sx(VW), sy(dashY()));
    ctx.strokeStyle = rgba(RED, 0.38);
    ctx.lineWidth = Math.max(1, 1.2 * scale);
    ctx.stroke();

    const rc = radC();
    ctx.beginPath();
    ctx.arc(sx(rc.x), sy(rc.y), (rc.r + 4) * scale, 0, TAU);
    ctx.fillStyle = '#080203';
    ctx.fill();
    ctx.strokeStyle = rgba(RED, 0.72);
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx(rc.x), sy(rc.y), rc.r * scale, 0, TAU);
    ctx.strokeStyle = rgba(DIMR, 0.5);
    ctx.lineWidth = Math.max(1, 1 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx(rc.x), sy(rc.y), rc.r * 0.5 * scale, 0, TAU);
    ctx.strokeStyle = rgba(DIMR, 0.28);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx(rc.x - rc.r), sy(rc.y));
    ctx.lineTo(sx(rc.x + rc.r), sy(rc.y));
    ctx.moveTo(sx(rc.x), sy(rc.y - rc.r));
    ctx.lineTo(sx(rc.x), sy(rc.y + rc.r));
    ctx.strokeStyle = rgba(DIMR, 0.22);
    ctx.stroke();

    const sweep = G.sweep;
    ctx.save();
    ctx.beginPath();
    ctx.arc(sx(rc.x), sy(rc.y), rc.r * scale, 0, TAU);
    ctx.clip();
    ctx.translate(sx(rc.x), sy(rc.y));
    ctx.rotate(-sweep);
    const grd = ctx.createLinearGradient(0, 0, 0, -rc.r * scale);
    grd.addColorStop(0, rgba(ORG, 0.0));
    grd.addColorStop(1, rgba(ORG, 0.24));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, rc.r * scale, -0.55, 0.02);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -rc.r * scale);
    ctx.strokeStyle = rgba(ORG, 0.7);
    ctx.lineWidth = Math.max(1, 1.2 * scale);
    ctx.stroke();
    ctx.restore();

    const k = (rc.r - 5) / RADAR_RANGE;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const dx = wrapD(e.x - G.px);
      const dz = wrapD(e.z - G.pz);
      const d = hypot(dx, dz);
      if (d > RADAR_RANGE) continue;
      const rx = dx * G.cosY - dz * G.sinY;
      const rz = dx * G.sinY + dz * G.cosY;
      const x = rc.x + rx * k;
      const y = rc.y - rz * k;
      const rgb = KIND_RGB[e.kind] || RED;
      const r = (e.kind === 'aa' ? 2.2 : 3.0) + e.blip * 2.4;
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), r * scale, 0, TAU);
      ctx.fillStyle = rgba(rgb, 0.55 + e.blip * 0.45);
      ctx.fill();
      if (e.y > G.py + 3) {
        ctx.beginPath();
        ctx.moveTo(sx(x), sy(y - r - 2));
        ctx.lineTo(sx(x - 2), sy(y - r + 2));
        ctx.lineTo(sx(x + 2), sy(y - r + 2));
        ctx.closePath();
        ctx.fillStyle = rgba(rgb, 0.8);
        ctx.fill();
      } else if (e.y < G.py - 3) {
        ctx.beginPath();
        ctx.moveTo(sx(x), sy(y + r + 2));
        ctx.lineTo(sx(x - 2), sy(y + r - 2));
        ctx.lineTo(sx(x + 2), sy(y + r - 2));
        ctx.closePath();
        ctx.fillStyle = rgba(rgb, 0.8);
        ctx.fill();
      }
      if (e.blip > 0.2) {
        ctx.beginPath();
        ctx.arc(sx(x), sy(y), (r + 4) * scale, 0, TAU);
        ctx.strokeStyle = rgba(rgb, e.blip);
        ctx.lineWidth = Math.max(1, 1.1 * scale);
        ctx.stroke();
      }
    }
    ctx.beginPath();
    ctx.moveTo(sx(rc.x), sy(rc.y - 7));
    ctx.lineTo(sx(rc.x - 5), sy(rc.y + 5));
    ctx.lineTo(sx(rc.x + 5), sy(rc.y + 5));
    ctx.closePath();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.fill();

    const showPad = COARSE || Object.keys(ptrs).length > 0;
    const pl = padL();
    const pf = padF();
    const pa = showPad ? 0.55 : 0.22;
    ctx.beginPath();
    ctx.arc(sx(pl.x), sy(pl.y), pl.r * scale, 0, TAU);
    ctx.strokeStyle = rgba(RED, pa);
    ctx.lineWidth = Math.max(1, 1.3 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx(pl.x), sy(pl.y), 8 * scale, 0, TAU);
    ctx.fillStyle = rgba(RED, pa * 0.5);
    ctx.fill();
    ctx.fillStyle = rgba(RED, pa * 0.9);
    ctx.font = '600 ' + Math.max(9, 11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('瞄准', sx(pl.x), sy(pl.y + 28));

    ctx.beginPath();
    ctx.arc(sx(pf.x), sy(pf.y), pf.r * scale, 0, TAU);
    ctx.strokeStyle = rgba(GOLD, pa);
    ctx.fillStyle = rgba(GOLD, pa * 0.08);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = rgba(GOLD, pa * 0.95);
    ctx.font = '700 ' + Math.max(11, 13 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillText('开火', sx(pf.x), sy(pf.y));

    if (G.yawIn || G.pitchIn) {
      ctx.beginPath();
      ctx.arc(sx(pl.x + G.yawIn * 22), sy(pl.y - G.pitchIn * 22), 7 * scale, 0, TAU);
      ctx.fillStyle = rgba(ORG, 0.8);
      ctx.fill();
    }

    ctx.fillStyle = rgba(ORG, 0.75);
    ctx.font = '600 ' + Math.max(9, 11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('俯 ' + (G.pitch * 57.3 | 0) + '°', sx(CX), sy(VH - 12));
  }

  function drawFlash() {
    if (G.invuln > 0 && G.mode === 'play' && ((G.clock * 10) | 0) % 2 === 0) {
      ctx.fillStyle = 'rgba(255,58,40,0.05)';
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.5);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
  }

  function drawLetterbox() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0c0506';
    if (oy > 0) {
      ctx.fillRect(0, 0, W, oy);
      ctx.fillRect(0, H - oy, W, oy + 1);
    }
    if (ox > 0) {
      ctx.fillRect(0, 0, ox, H);
      ctx.fillRect(W - ox, 0, ox + 1, H);
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0c0506';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = rand(-G.shake, G.shake);
      shy = rand(-G.shake, G.shake);
    }
    ctx.translate(W * 0.5 + shx, H * 0.5 + shy);
    const punch = REDUCE ? 1 : G.punch;
    ctx.scale(punch, punch);
    ctx.translate(-W * 0.5, -H * 0.5);

    ctx.save();
    windowPath();
    ctx.clip();
    const cy = viewCy();
    ctx.save();
    ctx.translate(sx(CX), sy(cy));
    if (!REDUCE) ctx.rotate(G.bank);
    ctx.translate(-sx(CX), -sy(cy));
    drawSky();
    drawMountains();
    drawGround();
    collectVis();
    drawVis();
    drawFx();
    ctx.restore();
    drawSight();
    ctx.restore();

    drawFrame();
    drawDash();
    drawFlash();
    ctx.restore();
    drawLetterbox();
  }

  function resize() {
    if (!stageEl || !canvas) return;
    const r = stageEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function eventToVirtual(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(0.001, r.width) * W;
    const y = (e.clientY - r.top) / Math.max(0.001, r.height) * H;
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function primaryAction() {
    audio.ensure();
    audio.startEngine();
    if (G.mode === 'title') {
      startGame('patrol');
      return;
    }
    if (G.mode === 'lose') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const space = k === ' ' || k === 'Spacebar' || k === 'Space';
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      if (down) e.preventDefault();
      return;
    }
    if (space) {
      if (down) e.preventDefault();
    }
    if (!down) {
      if (space) G.fireHold = false;
      return;
    }
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (k === '1' && G.mode === 'title') {
      startGame('patrol');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('melee');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') {
        G.fireHold = true;
        fire();
      }
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      audio.startEngine();
      e.preventDefault();
      const v = eventToVirtual(e);
      let role = classifyPtr(v.x, v.y);
      if (role === 'radar') role = 'view';
      ptrs[e.pointerId] = { x: v.x, y: v.y, role: role, lx: v.x, ly: v.y };
      if (G.mode === 'play') {
        if (role === 'fire' || role === 'view') {
          G.fireHold = true;
          fire();
        }
      }
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      const v = eventToVirtual(e);
      if (ptrs[e.pointerId]) {
        ptrs[e.pointerId].x = v.x;
        ptrs[e.pointerId].y = v.y;
      }
    });
    function up(e) {
      delete ptrs[e.pointerId];
      let hold = false;
      const ids = Object.keys(ptrs);
      for (let i = 0; i < ids.length; i++) {
        if (ptrs[ids[i]] && ptrs[ids[i]].role === 'fire') hold = true;
      }
      if (!hold) G.fireHold = false;
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
    if (((G.clock * 8) | 0) !== hudN) {
      hudN = (G.clock * 8) | 0;
      syncHud();
    }
  }

  function initMute() {
    let m = false;
    try { m = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { m = false; }
    audio.setMuted(m);
  }

  seedMountains();
  seedBarns();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnPatrol) {
    btnPatrol.addEventListener('click', function () {
      audio.ensure();
      audio.startEngine();
      if (G.mode === 'lose') startGame(G.kind);
      else startGame('patrol');
    });
  }
  if (btnMelee) {
    btnMelee.addEventListener('click', function () {
      audio.ensure();
      audio.startEngine();
      if (G.mode === 'lose') goTitle();
      else startGame('melee');
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
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
