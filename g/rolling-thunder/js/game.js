'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 16000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.48;
  const GY = 328;
  const UY = 236;
  const WALK = 208;
  const AIR = 0.84;
  const JUMP_V = 530;
  const GRAV = 1480;
  const MAX_FALL = 560;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const PW = 14;
  const PH = 28;
  const HP_MAX = 5;
  const AMMO_P = 50;
  const AMMO_S = 80;
  const AMMO_HAIL = 40;
  const SHOT_SPD = 580;
  const FIRE_P = 0.155;
  const FIRE_S = 0.086;
  const INVULN = 1.38;
  const DIE_T = 0.82;
  const DOOR_R = 22;
  const BEST_KEY = 'playbox-rolling-thunder-best';
  const MUTE_KEY = 'playbox-rolling-thunder-mute';
  const AUTO_SPEED_KEY = 'playbox-rolling-thunder-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 0.52, 0.78, 1, 3.4];
  const OPS = '方向 / D 走 · 上跳 · 下钻门装填 · 空格开枪 · A 自动 · R 重开 · M 静音';

  const MAG = [255, 61, 120];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 58, 24];
  const HOT2 = [255, 122, 90];
  const WHT = [246, 240, 232];
  const CREAM = [232, 220, 196];
  const SKIN = [255, 210, 168];
  const TEAL = [18, 42, 52];
  const PINK = [255, 120, 168];
  const HOOD = [28, 22, 32];

  const SCORE = {
    panther: 100, pink: 200, popper: 150, gunner: 180,
    boss: 2800, stage: 1400
  };

  const STAGES = [
    {
      name: '货仓', boss: '库管', w: 2460, hp: 18, theme: 'ware',
      holes: [[300, 64], [960, 72], [1580, 70], [2100, 60]],
      doors: [
        [150, 'g', 'ammo'], [380, 'g', 'ammo'], [620, 'g', 'ammo'],
        [880, 'g', 'ammo'], [1140, 'g', 'smg'], [1420, 'g', 'ammo'],
        [1720, 'g', 'ammo'], [2040, 'g', 'ammo'], [2280, 'g', 'ammo'],
        [180, 'u', 'ammo'], [460, 'u', 'ammo'], [740, 'u', 'ammo'],
        [1080, 'u', 'ammo'], [1340, 'u', 'ammo'], [1700, 'u', 'smg'],
        [1980, 'u', 'ammo'], [2220, 'u', 'ammo']
      ],
      ents: [
        [260, 'g', 'panther', 40, 360],
        [500, 'g', 'gunner', 430, 560],
        [540, 'u', 'panther', 400, 700],
        [780, 'g', 'panther', 640, 980],
        [900, 'u', 'gunner', 760, 1040],
        [1220, 'g', 'pink', 1100, 1480],
        [1280, 'u', 'panther', 1100, 1500],
        [1560, 'g', 'gunner', 1440, 1700],
        [1820, 'g', 'panther', 1680, 2100],
        [1880, 'u', 'pink', 1720, 2060],
        [2160, 'g', 'gunner', 2060, 2320]
      ],
      crates: [240, 700, 1280, 1900]
    },
    {
      name: '廊道', boss: '双枪', w: 2840, hp: 26, theme: 'hall',
      holes: [[260, 70], [820, 68], [1480, 74], [2040, 70], [2520, 62]],
      doors: [
        [140, 'g', 'ammo'], [360, 'g', 'ammo'], [560, 'g', 'ammo'],
        [800, 'g', 'smg'], [1060, 'g', 'ammo'], [1320, 'g', 'ammo'],
        [1620, 'g', 'ammo'], [1900, 'g', 'smg'], [2200, 'g', 'ammo'],
        [2480, 'g', 'ammo'], [2700, 'g', 'ammo'],
        [170, 'u', 'ammo'], [430, 'u', 'ammo'], [680, 'u', 'ammo'],
        [980, 'u', 'ammo'], [1240, 'u', 'smg'], [1580, 'u', 'ammo'],
        [1860, 'u', 'ammo'], [2160, 'u', 'ammo'], [2440, 'u', 'ammo'],
        [2680, 'u', 'ammo']
      ],
      ents: [
        [240, 'g', 'panther', 40, 340],
        [420, 'u', 'gunner', 300, 560],
        [620, 'g', 'pink', 480, 820],
        [740, 'u', 'panther', 500, 900],
        [980, 'g', 'gunner', 860, 1140],
        [1120, 'u', 'pink', 1000, 1320],
        [1380, 'g', 'panther', 1200, 1580],
        [1500, 'u', 'gunner', 1380, 1700],
        [1740, 'g', 'pink', 1600, 1960],
        [1980, 'u', 'panther', 1800, 2200],
        [2140, 'g', 'gunner', 2000, 2360],
        [2360, 'u', 'pink', 2180, 2520],
        [2580, 'g', 'panther', 2440, 2760]
      ],
      crates: [300, 980, 1680, 2300]
    },
    {
      name: '顶层', boss: '面具', w: 3220, hp: 36, theme: 'pent',
      holes: [[240, 68], [760, 72], [1320, 70], [1880, 76], [2460, 68], [2920, 60]],
      doors: [
        [130, 'g', 'ammo'], [340, 'g', 'ammo'], [540, 'g', 'smg'],
        [780, 'g', 'ammo'], [1020, 'g', 'ammo'], [1280, 'g', 'ammo'],
        [1560, 'g', 'smg'], [1840, 'g', 'ammo'], [2140, 'g', 'ammo'],
        [2420, 'g', 'ammo'], [2720, 'g', 'smg'], [3000, 'g', 'ammo'],
        [160, 'u', 'ammo'], [400, 'u', 'ammo'], [640, 'u', 'ammo'],
        [940, 'u', 'smg'], [1180, 'u', 'ammo'], [1480, 'u', 'ammo'],
        [1760, 'u', 'ammo'], [2080, 'u', 'smg'], [2380, 'u', 'ammo'],
        [2660, 'u', 'ammo'], [3040, 'u', 'ammo']
      ],
      ents: [
        [220, 'g', 'gunner', 80, 320],
        [380, 'u', 'panther', 200, 560],
        [560, 'g', 'pink', 400, 780],
        [700, 'u', 'gunner', 520, 880],
        [960, 'g', 'panther', 800, 1180],
        [1100, 'u', 'pink', 960, 1320],
        [1360, 'g', 'gunner', 1200, 1540],
        [1540, 'u', 'panther', 1400, 1760],
        [1780, 'g', 'pink', 1600, 2000],
        [1960, 'u', 'gunner', 1800, 2200],
        [2200, 'g', 'panther', 2040, 2440],
        [2320, 'u', 'pink', 2140, 2520],
        [2580, 'g', 'gunner', 2420, 2780],
        [2740, 'u', 'panther', 2560, 2960],
        [2960, 'g', 'pink', 2800, 3140]
      ],
      crates: [280, 1100, 1900, 2600]
    }
  ];

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function jumpHeight() {
    return (JUMP_V * JUMP_V) / (2 * GRAV);
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }
  function spdMul(hail, stage) {
    return (hail ? 1.32 : 1) * (1 + Math.max(0, stage - 1) * 0.08);
  }
  function ammoStart(hail) {
    return hail ? AMMO_HAIL : AMMO_P;
  }
  function floorY(fl) {
    return fl === 'u' ? UY : GY;
  }
  function upperSegs(w, holes) {
    const hs = holes.slice().sort(function (a, b) { return a[0] - b[0]; });
    const segs = [];
    let x = 16;
    let i;
    for (i = 0; i < hs.length; i++) {
      const h = hs[i];
      if (h[0] > x + 10) segs.push([x, h[0] - x]);
      x = h[0] + h[1];
    }
    if (x < w - 16) segs.push([x, w - 16 - x]);
    return segs;
  }
  function inHole(x, holes) {
    let i;
    for (i = 0; i < holes.length; i++) {
      if (x >= holes[i][0] && x <= holes[i][0] + holes[i][1]) return true;
    }
    return false;
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (GY - UY !== 92) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 88 || h > 104) throw new Error('jump height ' + h);
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('hail faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (ammoStart(true) >= ammoStart(false)) throw new Error('hail less ammo');
    if (AMMO_S <= AMMO_P) throw new Error('smg ammo');
    if (FIRE_S >= FIRE_P) throw new Error('smg faster');
    if (BEST_KEY !== 'playbox-rolling-thunder-best') throw new Error('best key');
    if (AUTO_SPEED_KEY !== 'playbox-rolling-thunder-auto-speed') throw new Error('auto key');
    if (SPEED_LABELS[3] !== '快' || SPEED_LABELS[4] !== '极快') throw new Error('speed labels');
    if (AUTO_SCALE[3] !== 1 || AUTO_SCALE[4] <= AUTO_SCALE[3]) throw new Error('auto scale');
    if (AUTO_SCALE[1] >= AUTO_SCALE[2] || AUTO_SCALE[2] >= AUTO_SCALE[3]) throw new Error('auto scale order');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    let i, s, j, hasSmg, hasU, hasG;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (s.doors.length < 12) throw new Error('doors ' + s.name);
      if (s.ents.length < 8) throw new Error('ents ' + s.name);
      hasSmg = false;
      hasU = false;
      hasG = false;
      for (j = 0; j < s.doors.length; j++) {
        const d = s.doors[j];
        if (d[2] === 'smg') hasSmg = true;
        if (d[1] === 'u') {
          hasU = true;
          if (inHole(d[0], s.holes)) throw new Error('door in hole ' + s.name);
        } else hasG = true;
      }
      if (!hasSmg || !hasU || !hasG) throw new Error('door mix ' + s.name);
      if (upperSegs(s.w, s.holes).length < 3) throw new Error('upper segs');
    }
    if (SCORE.pink <= SCORE.panther) throw new Error('pink score');
    if (DOOR_R < 16) throw new Error('door reach');
  }

  selfCheck();
  if (typeof document === 'undefined') return;

  const REDUCE = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

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
  const btnInfil = document.getElementById('btn-infil');
  const btnHail = document.getElementById('btn-hail');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeInfil = document.getElementById('mode-infil');
  const modeHail = document.getElementById('mode-hail');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const comboBox = document.getElementById('combo-box');
  const comboEl = document.getElementById('combo');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const gunLabel = document.getElementById('gun-label');
  const ammoWrap = document.getElementById('ammo-wrap');
  const ammoN = document.getElementById('ammo-n');
  const ammoBar = document.getElementById('ammo-bar');
  const hpWrap = document.getElementById('hp-wrap');
  const hpBar = document.getElementById('hp-bar');
  const bossWrap = document.getElementById('boss-wrap');
  const bossName = document.getElementById('boss-name');
  const bossBar = document.getElementById('boss-bar');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const chainPop = document.getElementById('chain-pop');

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
  let chainTok = 0;

  const keys = { l: false, r: false, u: false, d: false, fire: false };
  const demo = { l: false, r: true, u: false, d: false, fire: true };
  const autoIn = { l: false, r: false, u: false, d: false, fire: false };
  let autoOn = false;
  let autoSpeed = 3;
  let autoOvWait = 0;
  let autoStuck = 0;
  let autoLastX = 70;
  let autoWalkDir = 1;
  let autoBackT = 0;
  let autoPeekT = 0;
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];

  const G = {
    mode: 'title',
    kind: 'infil',
    t: 0,
    clock: 0,
    stage: 1,
    wave: 1,
    camX: 0,
    camY: 0,
    levelW: 2460,
    theme: 'ware',
    plats: [],
    doors: [],
    holes: [],
    ents: [],
    shots: [],
    crates: [],
    player: null,
    boss: null,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    ammo: AMMO_P,
    gun: 'pistol',
    fireCd: 0,
    emptyCd: 0,
    wasD: false,
    jumpBuf: 0,
    dropT: 0,
    dropPlat: null,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    toastT: 0,
    nextLife: LIFE_EVERY,
    clearT: 0,
    checkX: 70,
    checkY: GY,
    why: '',
    muzzle: 0,
    ready: 0
  };

  function isHail() {
    return G.kind === 'hail';
  }
  function playing() {
    return G.mode === 'play';
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function canControl() {
    return playing() && !overlayOpen() && G.deadT <= 0;
  }
  function autoPlaying() {
    return autoOn && G.mode === 'play';
  }
  function inL() {
    if (autoPlaying()) return autoIn.l;
    return G.mode === 'title' ? demo.l : keys.l;
  }
  function inR() {
    if (autoPlaying()) return autoIn.r;
    return G.mode === 'title' ? demo.r : keys.r;
  }
  function inU() {
    if (autoPlaying()) return autoIn.u;
    return G.mode === 'title' ? demo.u : keys.u;
  }
  function inD() {
    if (autoPlaying()) return autoIn.d;
    return G.mode === 'title' ? demo.d : keys.d;
  }
  function fireHeld() {
    if (autoPlaying()) return autoIn.fire;
    return G.mode === 'title' ? demo.fire : keys.fire;
  }
  function specNow() {
    return STAGES[(G.stage - 1) % 3];
  }
  function ammoMax() {
    return G.gun === 'smg' ? AMMO_S : AMMO_P;
  }
  function pFloor() {
    const p = G.player;
    if (!p) return 'g';
    return p.y < (GY + UY) * 0.5 ? 'u' : 'g';
  }
  function sx(x) {
    return ox + (x - G.camX) * scale;
  }
  function sy(y) {
    return oy + (y - G.camY) * scale;
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
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
    shot(smg) {
      this.ensure();
      this.noise(0.03, smg ? 0.04 : 0.032, smg ? 1400 : 1800);
      this.beep(smg ? 620 : 760, 0.05, 'square', 0.042, 220);
      if (smg) this.beep(980, 0.04, 'triangle', 0.022, 360);
    },
    empty() {
      this.ensure();
      this.beep(140, 0.07, 'square', 0.03, 70);
      this.noise(0.04, 0.018, 2400);
    },
    slam() {
      this.ensure();
      this.noise(0.08, 0.055, 180);
      this.beep(90, 0.12, 'sine', 0.05, 42);
      this.beep(180, 0.07, 'square', 0.03, 70);
    },
    reload() {
      this.ensure();
      this.beep(420, 0.05, 'square', 0.036, 280);
      this.beep(640, 0.07, 'triangle', 0.032, 880);
    },
    hop() {
      this.ensure();
      this.beep(280, 0.06, 'square', 0.04, 620);
    },
    land() {
      this.ensure();
      this.noise(0.04, 0.026, 500);
      this.beep(140, 0.05, 'triangle', 0.022, 80);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.045, 0.04, 1100);
      this.beep(520 * lift, 0.07, 'square', 0.046, 880 * lift);
    },
    spark() {
      this.ensure();
      this.noise(0.03, 0.028, 2200);
      this.beep(1480, 0.04, 'triangle', 0.03, 2200);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    hurt() {
      this.ensure();
      this.noise(0.1, 0.05, 400);
      this.beep(220, 0.12, 'sawtooth', 0.045, 70);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.055, 320);
      this.beep(280, 0.2, 'sawtooth', 0.05, 70);
      this.beep(140, 0.32, 'sine', 0.045, 42);
    },
    boss() {
      this.ensure();
      this.beep(180, 0.18, 'sawtooth', 0.05, 90);
      this.beep(110, 0.3, 'square', 0.04, 64);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(200, 0.18, 'sawtooth', 0.04, 80);
      this.beep(120, 0.3, 'sine', 0.05, 44);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
    },
    oneup() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.04, 880);
      this.beep(880, 0.12, 'triangle', 0.045, 1320);
    },
    smg() {
      this.ensure();
      this.beep(520, 0.07, 'square', 0.04, 780);
      this.beep(880, 0.12, 'triangle', 0.04, 1320);
    },
    stage() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.12, 'triangle', 0.04, 784);
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

  function saveBest() {
    if (G.score <= G.best) return;
    G.best = G.score;
    if (bestEl) bestEl.textContent = String(G.best);
    try { localStorage.setItem(BEST_KEY, String(G.best)); } catch (err) { /* ignore */ }
  }

  function addScore(n) {
    if (!playing() || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (G.score >= G.nextLife && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.nextLife += LIFE_EVERY;
      toast('1UP', false, true);
      audio.oneup();
      syncPips();
    }
    if (!scoreBox || !scoreAdd) return;
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    addTok += 1;
    const tok = addTok;
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + n;
    scoreAdd.style.animation = 'none';
    void scoreAdd.offsetWidth;
    scoreAdd.style.animation = '';
    setTimeout(function () {
      if (tok === addTok) scoreAdd.hidden = true;
    }, 700);
  }

  function toast(msg, warn, gold) {
    G.toastT = 1.35;
    toastTok += 1;
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1350);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = Math.max(LIVES, G.lives);
    while (pips.length < n) {
      const el = document.createElement('span');
      el.className = 'pip';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    while (pips.length > n) {
      const el = pips.pop();
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', i >= G.lives && G.mode !== 'title');
    }
  }

  function syncModes() {
    const h = isHail();
    if (modeInfil) modeInfil.setAttribute('aria-pressed', h ? 'false' : 'true');
    if (modeHail) modeHail.setAttribute('aria-pressed', h ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = specNow();
    if (stageLabel) {
      stageLabel.textContent = isHail() ? ('乱枪 ' + G.wave) : spec.name;
      stageLabel.classList.toggle('hot', !!(G.boss && G.boss.active && !G.boss.dead) || G.stage >= 3);
    }
    if (tagLabel) {
      tagLabel.textContent = isHail() ? '乱枪' : '潜入';
      tagLabel.classList.toggle('warn', isHail());
      tagLabel.classList.toggle('hot', !isHail() && G.stage >= 3);
    }
    if (gunLabel) {
      gunLabel.textContent = G.ammo <= 0 ? '空仓' : (G.gun === 'smg' ? '机枪' : '手枪');
      gunLabel.className = 'gun' + (G.ammo <= 0 ? ' empty' : G.gun === 'smg' ? ' smg' : '');
    }
    if (ammoN) ammoN.textContent = String(G.ammo);
    if (ammoBar) {
      const m = ammoMax();
      ammoBar.style.transform = 'scaleX(' + (m > 0 ? clamp(G.ammo / m, 0, 1) : 0) + ')';
    }
    if (ammoWrap) ammoWrap.classList.toggle('low', G.ammo <= 8);
    const p = G.player;
    if (hpBar && p) hpBar.style.transform = 'scaleX(' + clamp(p.hp / HP_MAX, 0, 1) + ')';
    if (hpWrap && p) hpWrap.classList.toggle('low', p.hp <= 2);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    const b = G.boss;
    if (bossWrap) {
      const show = !!(b && b.active && !b.dead);
      bossWrap.hidden = !show;
      if (show) {
        if (bossName) bossName.textContent = b.name;
        const ratio = b.max > 0 ? clamp(b.hp / b.max, 0, 1) : 0;
        if (bossBar) bossBar.style.transform = 'scaleX(' + ratio + ')';
        bossWrap.classList.toggle('low', ratio < 0.34);
      }
    }
    if (autoOn) {
      if (G.mode === 'title') setHint('自动托管 · 即将开局 · A 停下', 'hot');
      else if (G.mode === 'lose') setHint('自动仍开着 · 即将再开 · A 停下', 'warn');
      else if (G.mode === 'win') setHint('自动仍开着 · 即将再开 · A 停下', 'hot');
      else if (G.ammo <= 0) setHint('托管中 · 钻门装填 · A 停下', 'warn');
      else if (b && b.active && !b.dead) setHint('托管中 · 头目 ' + b.name + ' · A 停下', 'hot');
      else setHint(isHail() ? '托管中 · 乱枪钻门射击 · A 停下' : '托管中 · 潜入钻门射击 · A 停下', 'hot');
    } else if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 打空钻门 · 挨打掉血', 'warn');
    else if (G.mode === 'win') setHint('潜入得手 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 钻门躲弹装填', 'warn');
    else if (G.ammo <= 0) setHint('没弹了 · 下钻门装填', 'warn');
    else if (b && b.active && !b.dead) setHint('头目 · ' + b.name + ' · 钻门换弹再打', 'hot');
    else setHint('走跳开枪 · 下钻门躲弹装填 · A 自动', '');
    syncPips();
    syncModes();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.classList.toggle('end', kind === 'win' || kind === 'lose');
    overlay.setAttribute('aria-hidden', 'false');
    if (panel) {
      panel.classList.toggle('win', kind === 'win');
      panel.classList.toggle('lose', kind === 'lose');
    }
    if (ovKicker) {
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'ROLL';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '乱枪' : '换模式';
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus({ preventScroll: true });
  }

  function hitStop(sec) {
    if (REDUCE || G.mode === 'title') return;
    if (autoOn && autoSpeed >= 4) return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(n, kind) {
    if (REDUCE) return;
    G.shake = Math.max(G.shake, n);
    if (!stageEl || !kind) return;
    stageEl.classList.remove('boom', 'die', 'hit', 'thump', 'slam', 'win-flash');
    void stageEl.offsetWidth;
    stageEl.classList.add(kind);
    kickTok += 1;
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('boom', 'die', 'hit', 'thump', 'slam', 'win-flash');
      }
    }, 360);
  }

  function screenFlash(rgb, a) {
    if (REDUCE) return;
    G.flashRgb = rgb;
    G.flash = Math.max(G.flash, a);
  }

  function emit(n, o) {
    if (REDUCE) n = Math.min(n, 5);
    let i;
    for (i = 0; i < n; i++) {
      particles.push({
        x: o.x + rand(-o.j, o.j),
        y: o.y + rand(-o.j * 0.4, o.j * 0.4),
        vx: rand(o.vx0, o.vx1),
        vy: rand(o.vy0, o.vy1),
        life: o.life * rand(0.7, 1.15),
        max: o.life,
        r: rand(o.r0, o.r1),
        rgb: o.rgb,
        g: o.g || 420
      });
    }
    capArr(particles, REDUCE ? 40 : 120);
  }

  function popSpark(x, y, rgb, n) {
    const c = REDUCE ? Math.min(n, 4) : n;
    let i;
    for (i = 0; i < c; i++) {
      const a = rand(0, TAU);
      const sp = rand(90, 280);
      sparks.push({
        x: x, y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 40,
        t: 0, rad: rand(1.4, 3.2), rgb: rgb
      });
    }
    capArr(sparks, REDUCE ? 24 : 80);
  }

  function ring(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, r: 8, rgb: rgb });
    capArr(rings, 18);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.95 : 0.68,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? 90 : 72
    });
    capArr(floats, 28);
  }

  function juice(x, y, rgb, power) {
    const p = power || 1;
    emit(8 + (p * 10) | 0, {
      x: x, y: y, j: 6 + p * 5,
      vx0: -200 * p, vx1: 200 * p, vy0: -280 * p, vy1: -20 * p,
      life: 0.28 + p * 0.14, r0: 1, r1: 2.8 + p, rgb: rgb
    });
    popSpark(x, y, rgb, 10 + p * 10);
    ring(x, y, rgb);
    screenFlash(rgb, 0.12 + p * 0.08);
    kick(2.1 + p * 2.2, p > 1.2 ? 'boom' : 'hit');
  }

  function showChain(n) {
    if (!chainPop || REDUCE) return;
    chainTok += 1;
    const tok = chainTok;
    chainPop.textContent = '×' + n;
    chainPop.classList.remove('hidden');
    chainPop.style.animation = 'none';
    void chainPop.offsetWidth;
    chainPop.style.animation = '';
    setTimeout(function () {
      if (tok === chainTok && chainPop) chainPop.classList.add('hidden');
    }, 700);
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    const prev = G.mult;
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (G.combo >= 2) showChain(G.combo);
    if (G.mult > prev) audio.combo(G.mult);
    syncHud();
  }

  function makePlayer(x, y) {
    return {
      x: x, y: y, vx: 0, vy: 0, face: 1,
      w: PW, h: PH,
      grounded: true, coyote: 0,
      squash: 1, run: 0, pose: 0,
      inDoor: null, doorT: 0, reloaded: false,
      hp: HP_MAX
    };
  }

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 40 : 10, base: !!base };
  }

  function makeDoor(x, fl, kind, i) {
    return {
      x: x, floor: fl, kind: kind || 'ammo',
      open: 0, slam: 0, popT: 0.8 + (i % 5) * 0.35,
      occ: false
    };
  }

  function makeEnt(x, fl, kind, a, b) {
    const hp = kind === 'pink' ? 2 : 1;
    return {
      x: x, y: floorY(fl), vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b, t: rand(0, 1),
      fire: rand(0.4, 1.4),
      grounded: true, dead: false,
      hitN: 0, w: kind === 'gunner' ? 15 : 14, h: 26,
      fromDoor: null
    };
  }

  function makeBoss(spec) {
    const hail = isHail();
    const hp = (spec.hp * (hail ? 1.18 : 1) + (G.wave - 1) * 4) | 0;
    return {
      x: spec.w - 160, y: GY, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: spec.boss,
      t: 0, fire: 1.1, state: 'wait',
      grounded: true, dead: false, active: false,
      hitN: 0, w: 22, h: 34, name: spec.boss
    };
  }

  function loadStage(n, attract) {
    const spec = STAGES[(clamp(n, 1, 99) - 1) % 3];
    G.stage = attract ? 1 : n;
    G.levelW = spec.w;
    G.theme = spec.theme;
    G.holes = spec.holes;
    G.plats = [makePlat(0, GY, spec.w, true)];
    const segs = upperSegs(spec.w, spec.holes);
    let i;
    for (i = 0; i < segs.length; i++) {
      G.plats.push(makePlat(segs[i][0], UY, segs[i][1], false));
    }
    G.doors = [];
    for (i = 0; i < spec.doors.length; i++) {
      const d = spec.doors[i];
      G.doors.push(makeDoor(d[0], d[1], d[2], i));
    }
    G.ents = [];
    for (i = 0; i < spec.ents.length; i++) {
      const e = spec.ents[i];
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4]));
    }
    if (isHail() && !attract) {
      for (i = 0; i < spec.ents.length; i += 2) {
        const e = spec.ents[i];
        const nx = e[0] + 48;
        if (nx < spec.w - 80) {
          G.ents.push(makeEnt(nx, e[1], e[2] === 'gunner' ? 'panther' : e[2], e[3], e[4]));
        }
      }
    }
    G.crates = spec.crates.slice();
    G.shots = [];
    G.boss = makeBoss(spec);
    G.player = makePlayer(70, GY);
    G.camX = 0;
    G.camY = 0;
    G.fireCd = 0;
    G.emptyCd = 0;
    G.deadT = 0;
    G.invuln = attract ? 99 : 0.45;
    G.clearT = 0;
    G.dropT = 0;
    G.dropPlat = null;
    G.jumpBuf = 0;
    G.wasD = false;
    G.muzzle = 0;
    G.checkX = 70;
    G.checkY = GY;
    if (!attract) {
      G.ammo = ammoStart(isHail());
      G.gun = 'pistol';
      particles.length = 0;
      sparks.length = 0;
      rings.length = 0;
      floats.length = 0;
    } else {
      G.ammo = AMMO_P;
      G.gun = 'pistol';
    }
    if (G.player) G.player.hp = HP_MAX;
    syncHud();
  }

  function platUnder(x, fy, ignore) {
    let best = null;
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      if (p === ignore) continue;
      if (x < p.x + 3 || x > p.x + p.w - 3) continue;
      if (fy >= p.y - 3 && fy <= p.y + 8) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function landOn(x, y0, y1, ignore) {
    let best = null;
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      if (p === ignore) continue;
      if (x < p.x + 4 || x > p.x + p.w - 4) continue;
      if (y0 <= p.y + 2 && y1 >= p.y) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function standAt(x, y) {
    return !!platUnder(x, y, null);
  }

  function nearDoor() {
    const p = G.player;
    if (!p || !p.grounded) return null;
    const fl = pFloor();
    let best = null;
    let bd = DOOR_R;
    for (let i = 0; i < G.doors.length; i++) {
      const d = G.doors[i];
      if (d.floor !== fl) continue;
      const dx = Math.abs(d.x - p.x);
      if (dx < bd) {
        bd = dx;
        best = d;
      }
    }
    return best;
  }

  function countAlive() {
    let n = 0;
    for (let i = 0; i < G.ents.length; i++) if (!G.ents[i].dead) n += 1;
    return n;
  }

  function countShots(from) {
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) {
      if (G.shots[i].from === from && G.shots[i].life > 0) n += 1;
    }
    return n;
  }

  function spawnShot(x, y, vx, from, rgb) {
    G.shots.push({
      x: x, y: y, vx: vx, vy: 0,
      from: from, life: 1.05, rgb: rgb || (from === 'p' ? GOLD : HOT2)
    });
    capArr(G.shots, 40);
  }

  function enterDoor(d) {
    const p = G.player;
    if (!p || p.inDoor) return;
    p.inDoor = d;
    p.doorT = 0;
    p.reloaded = false;
    p.x = d.x;
    p.vx = 0;
    p.vy = 0;
    d.occ = true;
    d.open = 1;
    d.slam = 1;
    G.checkX = d.x;
    G.checkY = floorY(d.floor);
    audio.slam();
    hitStop(0.042);
    kick(3.2, 'slam');
    emit(10, {
      x: d.x, y: floorY(d.floor) - 18, j: 10,
      vx0: -80, vx1: 80, vy0: -40, vy1: 20,
      life: 0.28, r0: 1, r1: 2.6, rgb: CREAM, g: 260
    });
    screenFlash(CYN, 0.1);
  }

  function exitDoor() {
    const p = G.player;
    if (!p || !p.inDoor) return;
    const d = p.inDoor;
    d.occ = false;
    d.slam = 0.55;
    d.open = 0.4;
    p.inDoor = null;
    p.doorT = 0;
    p.x = d.x + p.face * 16;
    p.y = floorY(d.floor);
    p.grounded = true;
    audio.slam();
    kick(2.2, 'thump');
    emit(6, {
      x: p.x, y: p.y - 12, j: 8,
      vx0: p.face * 40, vx1: p.face * 140, vy0: -60, vy1: 10,
      life: 0.2, r0: 1, r1: 2.2, rgb: CYN
    });
  }

  function doReload(d) {
    const p = G.player;
    if (!p || p.reloaded) return;
    p.reloaded = true;
    let changed = false;
    if (d.kind === 'smg') {
      if (G.gun !== 'smg') changed = true;
      G.gun = 'smg';
      G.ammo = AMMO_S;
    } else {
      const cap = ammoMax();
      if (G.ammo < cap) changed = true;
      G.ammo = cap;
    }
    audio.reload();
    if (d.kind === 'smg' && changed) {
      audio.smg();
      toast('机枪装填', false, true);
    } else toast('装填', false, true);
    popSpark(d.x, floorY(d.floor) - 22, CYN, 12);
    ring(d.x, floorY(d.floor) - 18, CYN);
    hitStop(0.03);
    syncHud();
  }

  function tryFire() {
    const p = G.player;
    if (!p || p.inDoor || G.deadT > 0) return;
    if (overlayOpen() && playing()) return;
    if (G.mode !== 'play' && G.mode !== 'title') return;
    if (G.fireCd > 0) return;
    if (G.ammo <= 0) {
      if (G.emptyCd <= 0) {
        audio.empty();
        if (playing()) toast('没弹了 · 钻门装填', true, false);
        G.emptyCd = 0.55;
      }
      return;
    }
    const smg = G.gun === 'smg';
    const cap = smg ? 6 : 4;
    if (countShots('p') >= cap) return;
    G.ammo -= 1;
    if (G.ammo <= 0 && smg) {
      G.gun = 'pistol';
      if (playing()) toast('机枪打空', true, false);
    }
    G.fireCd = smg ? FIRE_S : FIRE_P;
    G.muzzle = 0.08;
    p.pose = 0.12;
    const bx = p.x + p.face * 18;
    const by = p.y - 16;
    spawnShot(bx, by, p.face * SHOT_SPD, 'p', smg ? CYN : GOLD);
    audio.shot(smg);
    emit(4, {
      x: bx, y: by, j: 4,
      vx0: p.face * 40, vx1: p.face * 160, vy0: -40, vy1: 30,
      life: 0.14, r0: 1, r1: 2.1, rgb: smg ? CYN : GOLD
    });
    popSpark(bx, by, smg ? CYN : GOLD, 5);
    if (ammoN) ammoN.textContent = String(G.ammo);
    if (ammoBar) {
      const m = ammoMax();
      ammoBar.style.transform = 'scaleX(' + clamp(G.ammo / Math.max(1, m), 0, 1) + ')';
    }
    if (ammoWrap) ammoWrap.classList.toggle('low', G.ammo <= 8);
    if (gunLabel) {
      gunLabel.textContent = G.ammo <= 0 ? '空仓' : (G.gun === 'smg' ? '机枪' : '手枪');
      gunLabel.className = 'gun' + (G.ammo <= 0 ? ' empty' : G.gun === 'smg' ? ' smg' : '');
    }
  }

  function hurtPlayer(why, srcX) {
    const p = G.player;
    if (!p || p.inDoor || G.deadT > 0) return;
    if (G.invuln > 0 || G.mode === 'title') return;
    p.hp -= 1;
    G.invuln = 0.85;
    p.vx = (p.x < srcX ? -1 : 1) * 140;
    p.face = p.x < srcX ? 1 : -1;
    audio.hurt();
    juice(p.x, p.y - 14, MAG, 0.85);
    hitStop(0.055);
    kick(4.2, 'hit');
    screenFlash(MAG, 0.28);
    if (p.hp <= 0) die(why);
    else {
      toast('中弹 −1', true, false);
      syncHud();
    }
  }

  function die(why) {
    const p = G.player;
    if (!p || G.deadT > 0) return;
    if (p.inDoor) {
      p.inDoor.occ = false;
      p.inDoor = null;
    }
    G.why = why || 'hit';
    G.deadT = DIE_T;
    G.lives -= 1;
    p.hp = 0;
    p.vy = -220;
    p.vx = -p.face * 80;
    audio.death();
    juice(p.x, p.y - 12, HOT, 1.4);
    kick(6, 'die');
    hitStop(0.07);
    syncHud();
  }

  function respawn() {
    const p = G.player;
    if (!p) return;
    p.x = G.checkX;
    p.y = G.checkY;
    p.vx = 0;
    p.vy = 0;
    p.hp = HP_MAX;
    p.inDoor = null;
    p.grounded = true;
    p.face = 1;
    G.invuln = INVULN;
    G.deadT = 0;
    G.gun = 'pistol';
    G.ammo = Math.max(G.ammo, 12);
    toast('重整', false, true);
    syncHud();
  }

  function hurtEnt(e, dmg) {
    if (!e || e.dead || e.hitN > 0) return;
    e.hp -= dmg;
    e.hitN = 0.08;
    popSpark(e.x, e.y - 14, GOLD, 8);
    audio.spark();
    hitStop(e.kind && e.max > 10 ? 0.07 : 0.048);
    if (e.hp <= 0) {
      e.dead = true;
      const kind = e.name ? 'boss' : e.kind;
      const base = SCORE[kind] || SCORE.panther;
      bumpCombo();
      const sc = base * G.mult;
      addScore(sc);
      floatText(e.x, e.y - 28, '+' + sc, GOLD, G.combo >= 4);
      juice(e.x, e.y - 12, kind === 'boss' ? MAG : (e.kind === 'pink' ? PINK : HOT), kind === 'boss' ? 1.6 : 1);
      audio.hit(G.combo);
      if (kind === 'boss') {
        G.clearT = 1.35;
        audio.boss();
        kick(7, 'boom');
      }
    } else {
      e.vx = (G.player && G.player.x < e.x ? 1 : -1) * 40;
      kick(1.6, 'hit');
    }
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'infil';
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.lives = LIVES;
    G.wave = 1;
    G.stage = 1;
    loadStage(1, true);
    showOverlay(
      'title',
      '滚雷',
      '侧向潜入货仓。钻门躲弹、装填。弹有限，打空就钻。货仓、廊道，顶层见面具。'
    );
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'hail' ? 'hail' : 'infil';
    G.mode = 'play';
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    G.comboT = 0;
    G.lives = LIVES;
    G.wave = 1;
    G.stage = 1;
    G.nextLife = LIFE_EVERY;
    G.why = '';
    hideOverlay();
    autoStuck = 0;
    autoBackT = 0;
    autoPeekT = 0;
    autoLastX = 70;
    autoWalkDir = 1;
    autoOvWait = 0;
    clearAutoKeys();
    loadStage(1, false);
    audio.start();
    toast(isHail() ? '乱枪 · 门里往外涌' : '潜入 · 货仓', false, true);
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('infil');
    else startGame(G.kind);
  }

  function goWin() {
    addScore(8000);
    G.mode = 'win';
    audio.win();
    kick(4, 'win-flash');
    screenFlash(GOLD, 0.4);
    showOverlay('win', '潜入得手', '面具倒下。最高连击 ×' + G.maxCombo + ' · ' + G.score + ' 分');
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'touch' ? '贴上了' : (G.why === 'shot' ? '中弹了' : '被击中了');
    showOverlay('lose', why, '血条打空丢命。钻门躲弹、装填再打。R 随时重开。');
    syncHud();
  }

  function nextStage() {
    const bonus = SCORE.stage * G.mult * G.stage;
    addScore(bonus);
    if (!isHail() && G.stage >= 3) {
      goWin();
      return;
    }
    if (G.stage >= 3) {
      G.stage = 1;
      G.wave += 1;
    } else G.stage += 1;
    loadStage(G.stage, false);
    audio.stage();
    toast(isHail() ? ('下一波 · ' + specNow().name) : ('进入 · ' + specNow().name), false, true);
    syncHud();
  }

  function clearAutoKeys() {
    autoIn.l = false;
    autoIn.r = false;
    autoIn.u = false;
    autoIn.d = false;
    autoIn.fire = false;
  }

  function autoSteer(tx) {
    autoIn.l = false;
    autoIn.r = false;
    const p = G.player;
    if (!p) return;
    const dx = tx - p.x;
    if (dx > 6) {
      autoIn.r = true;
      autoWalkDir = 1;
    } else if (dx < -6) {
      autoIn.l = true;
      autoWalkDir = -1;
    }
  }

  function autoFace(tx) {
    const p = G.player;
    if (!p) return;
    const want = tx >= p.x ? 1 : -1;
    if (p.face !== want) autoSteer(p.x + want * 14);
  }

  function canStandUpper(x) {
    return !!platUnder(x, UY, null) && !inHole(x, G.holes);
  }

  function holeAhead(x, dir) {
    const nx = x + dir * 22;
    let i;
    for (i = 0; i < G.holes.length; i++) {
      const h = G.holes[i];
      if (nx >= h[0] - 6 && nx <= h[0] + h[1] + 6) return h;
    }
    return null;
  }

  function autoShotThreat() {
    const p = G.player;
    if (!p) return null;
    let best = null;
    let bestT = 0.46;
    let i, s;
    for (i = 0; i < G.shots.length; i++) {
      s = G.shots[i];
      if (s.from === 'p' || s.life <= 0) continue;
      if (Math.abs(s.y - (p.y - 14)) > 22) continue;
      const dx = p.x - s.x;
      if (dx * s.vx <= 0) continue;
      const t = dx / s.vx;
      if (t > 0 && t < bestT) {
        bestT = t;
        best = s;
      }
    }
    return best;
  }

  function autoClosestFoe() {
    const p = G.player;
    if (!p) return null;
    let best = null;
    let bestD = 320;
    let i, e, d;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      d = hypot(e.x - p.x, (e.y - p.y) * 1.35);
      if (d > 300) continue;
      if (e.x < p.x - 10) d += 70;
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    const b = G.boss;
    if (b && b.active && !b.dead) {
      d = hypot(b.x - p.x, (b.y - p.y) * 1.2);
      if (d < bestD + 50) best = b;
    }
    return best;
  }

  function autoPickDoor(p, fl) {
    let best = null;
    let bestS = 1e9;
    let i, d, adx, s;
    for (i = 0; i < G.doors.length; i++) {
      d = G.doors[i];
      adx = Math.abs(d.x - p.x);
      if (adx > 520) continue;
      s = adx;
      if (d.floor !== fl) s += 88;
      if (d.kind === 'smg' && G.gun !== 'smg') s -= 22;
      if (s < bestS) {
        bestS = s;
        best = d;
      }
    }
    return best;
  }

  function autoGoDoor(d, p, fl) {
    if (!d) return;
    if (d.floor === fl) {
      autoSteer(d.x);
      if (Math.abs(d.x - p.x) <= DOOR_R && p.grounded) autoIn.d = true;
      return;
    }
    if (d.floor === 'u' && fl === 'g') {
      if (canStandUpper(p.x) && Math.abs(d.x - p.x) < 80) autoIn.u = true;
      else autoSteer(d.x);
      return;
    }
    if (d.floor === 'g' && fl === 'u') {
      if (Math.abs(d.x - p.x) < 46 && p.grounded && !nearDoor()) autoIn.d = true;
      else autoSteer(d.x);
    }
  }

  function autoThink() {
    clearAutoKeys();
    if (!autoOn || G.mode !== 'play') return;
    const p = G.player;
    if (!p || G.deadT > 0) return;

    const moved = Math.abs(p.x - autoLastX);
    if (moved < 2.2 && p.grounded) autoStuck += STEP;
    else if (moved > 7) autoStuck = 0;
    autoLastX = p.x;
    if (autoBackT > 0) autoBackT -= STEP;
    if (autoPeekT > 0) autoPeekT -= STEP;

    const fl = pFloor();
    const threat = G.invuln <= 0 ? autoShotThreat() : null;
    const foe = autoClosestFoe();
    const doorHere = nearDoor();
    const needAmmo = G.ammo <= 0 || (G.ammo <= 5 && (!foe || Math.abs(foe.x - p.x) > 90));
    const melee = !!(foe && Math.abs(foe.x - p.x) < 26 && Math.abs(foe.y - p.y) < 24);
    const wantCover = !!(threat || needAmmo || (melee && p.hp <= 2));

    if (p.inDoor) {
      const threatClose = threat && Math.abs(threat.x - p.x) < 110;
      if (p.doorT < 0.38) return;
      if (!p.reloaded && G.ammo < ammoMax()) return;
      if (threatClose && p.doorT < 1.15) return;
      const dir = (foe && foe.x + 8 < p.x) ? -1 : 1;
      if (dir > 0) autoIn.r = true;
      else autoIn.l = true;
      autoPeekT = 0.42;
      autoWalkDir = dir;
      return;
    }

    if (doorHere && p.grounded && (needAmmo || ((threat || (melee && p.hp <= 2)) && autoPeekT <= 0))) {
      autoIn.d = true;
      return;
    }

    if (wantCover) {
      const d = autoPickDoor(p, fl);
      if (d) {
        autoGoDoor(d, p, fl);
        if (G.ammo > 0 && foe && Math.abs(foe.y - p.y) < 40) autoIn.fire = true;
        return;
      }
    }

    if (foe && G.ammo > 0) {
      const same = Math.abs(foe.y - p.y) < 40;
      const dx = foe.x - p.x;
      const adx = Math.abs(dx);
      if (same) {
        autoIn.fire = true;
        if (adx < 24 && doorHere && autoPeekT <= 0) {
          autoIn.d = true;
          return;
        }
        if (adx < 22 && p.grounded && fl === 'g' && canStandUpper(p.x)) {
          autoIn.u = true;
          autoSteer(foe.x);
          return;
        }
        if (p.face !== (dx >= 0 ? 1 : -1)) autoFace(foe.x);
        else if (adx > 150) autoSteer(foe.x);
        if (adx < 220) return;
      } else if (adx < 200) {
        if (foe.y < p.y - 18 && fl === 'g' && canStandUpper(p.x) && p.grounded) {
          autoIn.u = true;
          autoSteer(foe.x);
          return;
        }
        if (foe.y > p.y + 18 && fl === 'u' && p.grounded && !doorHere) {
          autoIn.d = true;
          return;
        }
      }
    }

    const b = G.boss;
    if (b && b.active && !b.dead) {
      const dx = b.x - p.x;
      if (G.ammo > 0 && Math.abs(b.y - p.y) < 52) {
        autoIn.fire = true;
        autoFace(b.x);
        if (dx > 118) autoSteer(b.x - 108);
        else if (dx < 54) autoSteer(p.x - 36);
      }
      if (threat && doorHere && autoPeekT <= 0) autoIn.d = true;
      if (G.ammo <= 10) {
        const d = autoPickDoor(p, fl);
        if (d) autoGoDoor(d, p, fl);
      }
      return;
    }

    if (G.gun !== 'smg' && G.ammo > 12) {
      let smg = null;
      let smgD = 220;
      let i, d, dist;
      for (i = 0; i < G.doors.length; i++) {
        d = G.doors[i];
        if (d.kind !== 'smg') continue;
        if (d.x < p.x - 24) continue;
        dist = Math.abs(d.x - p.x) + (d.floor === fl ? 0 : 70);
        if (dist < smgD) {
          smgD = dist;
          smg = d;
        }
      }
      if (smg) {
        autoGoDoor(smg, p, fl);
        if (foe && G.ammo > 0 && Math.abs(foe.y - p.y) < 40) autoIn.fire = true;
        return;
      }
    }

    if (autoBackT > 0) autoSteer(p.x + autoWalkDir * 70);
    else autoSteer(p.x + 200);

    if (fl === 'u') {
      const hole = holeAhead(p.x, autoIn.r ? 1 : autoIn.l ? -1 : autoWalkDir);
      if (hole) {
        if (hole[1] <= 90 && p.grounded) autoIn.u = true;
        else if (!doorHere && p.grounded) autoIn.d = true;
      }
    }

    if (fl === 'g' && p.grounded && canStandUpper(p.x) && foe && foe.y < p.y - 20 && foe.x > p.x - 20) {
      autoIn.u = true;
    }

    if (threat && p.grounded && !doorHere) autoIn.u = true;

    if (autoStuck > 0.48) autoIn.u = true;
    if (autoStuck > 0.95 && fl === 'u' && !doorHere) autoIn.d = true;
    if (autoStuck > 1.35) {
      autoBackT = 0.32;
      autoStuck = 0;
      autoWalkDir *= -1;
    }

    if (G.ammo > 0 && foe && Math.abs(foe.y - p.y) < 40 && foe.x >= p.x - 28) {
      autoIn.fire = true;
    } else if (G.ammo > 0 && b && b.active && !b.dead) {
      autoIn.fire = true;
    }
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    const wait = autoSpeed >= 3 ? 0.28 : 0.55;
    const retry = autoSpeed >= 3 ? 0.72 : 1.15;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= wait) {
        autoOvWait = 0;
        startGame(G.kind || 'infil');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= retry) {
        autoOvWait = 0;
        startGame(G.kind || 'infil');
      }
    }
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    if (speedEl) speedEl.value = String(autoSpeed);
    if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
    if (speedEl) {
      speedEl.title = SPEED_LABELS[autoSpeed];
      speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
    }
  }

  function autoScale() {
    if (!autoOn || G.mode !== 'play') return 1;
    return AUTO_SCALE[autoSpeed] || 1;
  }

  function setAutoSpeed(n) {
    n = parseInt(n, 10);
    if (!isFinite(n) || n < 1 || n > 4) n = 3;
    autoSpeed = n;
    saveAutoSpeed(autoSpeed);
    syncSpeedUi();
  }

  function toggleAuto() {
    autoOn = !autoOn;
    autoOvWait = 0;
    autoStuck = 0;
    autoBackT = 0;
    autoPeekT = 0;
    clearAutoKeys();
    keys.l = false;
    keys.r = false;
    keys.u = false;
    keys.d = false;
    keys.fire = false;
    syncAutoUi();
    if (autoOn) {
      audio.ensure();
      if (G.mode === 'title') startGame(G.kind || 'infil');
    }
    syncHud();
  }

  function isAutoKey(e) {
    return e.code === 'KeyA' || e.key === 'a' || e.key === 'A';
  }

  function attractThink() {
    const p = G.player;
    demo.l = false;
    demo.r = false;
    demo.u = false;
    demo.d = false;
    demo.fire = false;
    if (!p) return;
    if (p.inDoor) {
      if (p.doorT > 1.05) demo.d = true;
      return;
    }
    const cyc = G.clock % 7.2;
    if (p.x > 620) demo.l = true;
    else if (p.x < 80) demo.r = true;
    else if (cyc < 4.4) demo.r = true;
    else if (cyc < 5.6) demo.l = true;
    else demo.r = true;
    const d = nearDoor();
    if (d && p.grounded && (G.ammo < 22 || (cyc > 5.8 && cyc < 6.4))) demo.d = true;
    if (pFloor() === 'g' && platUnder(p.x, UY, null) && p.grounded && (cyc > 1.2 && cyc < 1.45)) {
      demo.u = true;
    }
    if (pFloor() === 'u' && cyc > 3.5 && cyc < 3.7 && !nearDoor()) demo.d = true;
    demo.fire = G.ammo > 0;
  }

  function updatePlayer(dt) {
    const p = G.player;
    if (!p) return;
    if (G.mode === 'win' || G.mode === 'lose') return;
    if (G.invuln > 0 && G.mode !== 'title') G.invuln -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.emptyCd > 0) G.emptyCd -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;

    if (G.deadT > 0) {
      G.deadT -= dt;
      p.vy += GRAV * dt;
      p.y += p.vy * dt * 0.45;
      p.squash = 1.14;
      if (G.deadT <= 0) {
        if (G.lives <= 0) goLose();
        else respawn();
      }
      return;
    }

    if (p.inDoor) {
      p.doorT += dt;
      p.vx = 0;
      p.vy = 0;
      p.x = p.inDoor.x;
      p.y = floorY(p.inDoor.floor);
      p.grounded = true;
      if (!p.reloaded && p.doorT > 0.42) doReload(p.inDoor);
      const edge = inD() && !G.wasD;
      if (p.doorT > 0.28 && (edge || inL() || inR())) exitDoor();
      p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
      return;
    }

    let ax = 0;
    if (inL()) ax -= 1;
    if (inR()) ax += 1;
    if (ax) p.face = ax;
    const spd = WALK * (p.grounded ? 1 : AIR);
    p.vx = ax * spd;
    p.x += p.vx * dt;
    p.x = clamp(p.x, 16, G.levelW - 16);

    const b = G.boss;
    if (b && b.active && !b.dead && p.x > b.x - 28) p.x = b.x - 28;

    if (inU()) G.jumpBuf = BUFFER;
    else G.jumpBuf -= dt;
    if (G.jumpBuf < 0) G.jumpBuf = 0;

    const downEdge = inD() && !G.wasD;
    const door = downEdge ? nearDoor() : null;
    if (door) {
      enterDoor(door);
      return;
    }
    if (downEdge && p.grounded && G.dropT <= 0) {
      const under = platUnder(p.x, p.y, null);
      if (under && !under.base) {
        G.dropPlat = under;
        G.dropT = 0.18;
        p.vy = 80;
        p.grounded = false;
      }
    }
    if (G.dropT > 0) G.dropT -= dt;
    else G.dropPlat = null;

    const canJump = p.grounded || p.coyote > 0;
    if (G.jumpBuf > 0 && canJump) {
      p.vy = -JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      G.jumpBuf = 0;
      p.squash = 0.78;
      audio.hop();
      emit(5, {
        x: p.x, y: p.y, j: 8,
        vx0: -60, vx1: 60, vy0: -20, vy1: 40,
        life: 0.22, r0: 1, r1: 2.2, rgb: WHT, g: 200
      });
      hitStop(0.028);
    }
    if (!inU() && p.vy < -80) p.vy *= Math.pow(0.42, dt * 8);

    p.vy += GRAV * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    const y0 = p.y;
    let y1 = p.y + p.vy * dt;
    p.grounded = false;
    if (p.vy >= 0) {
      const plat = landOn(p.x, y0, y1, G.dropPlat);
      if (plat) {
        y1 = plat.y;
        if (p.vy > 220) {
          audio.land();
          p.squash = 0.82;
          emit(6, {
            x: p.x, y: p.y, j: 10,
            vx0: -80, vx1: 80, vy0: -30, vy1: 10,
            life: 0.2, r0: 1, r1: 2.4, rgb: HOT2, g: 180
          });
          kick(1.6, 'thump');
        }
        p.vy = 0;
        p.grounded = true;
        p.coyote = COYOTE;
      }
    }
    p.y = y1;
    if (p.grounded) p.coyote = COYOTE;
    else p.coyote -= dt;
    if (p.y > VH + 80) p.y = GY;

    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    if (ax && p.grounded) p.run += dt * 9;
    else p.run += dt * 2;
    if (p.pose > 0) p.pose -= dt;

    if (fireHeld()) tryFire();
  }

  function spawnPopper(d) {
    if (d.occ) return;
    const cap = isHail() ? 11 : 7;
    if (countAlive() >= cap) return;
    const p = G.player;
    if (!p) return;
    if (Math.abs(d.x - p.x) > 420) return;
    const kind = isHail() && Math.random() < 0.35 ? 'pink' : 'popper';
    const e = makeEnt(d.x, d.floor, kind, d.x - 80, d.x + 80);
    e.fromDoor = d;
    e.face = p.x >= d.x ? 1 : -1;
    e.t = 0;
    G.ents.push(e);
    d.slam = 1;
    d.open = 1;
    audio.slam();
    emit(8, {
      x: d.x, y: floorY(d.floor) - 16, j: 8,
      vx0: -70, vx1: 70, vy0: -50, vy1: 20,
      life: 0.24, r0: 1, r1: 2.4, rgb: HOOD
    });
    if (playing()) kick(2.4, 'slam');
  }

  function updateDoors(dt) {
    const p = G.player;
    const hail = isHail();
    let i;
    for (i = 0; i < G.doors.length; i++) {
      const d = G.doors[i];
      if (d.slam > 0) d.slam -= dt * 3.6;
      const want = d.occ ? 1 : (d.slam > 0.15 ? 0.85 : 0);
      d.open = lerp(d.open, want, 1 - Math.pow(0.0008, dt));
      if (!playing() && G.mode !== 'title') continue;
      if (d.occ) continue;
      d.popT -= dt;
      const vis = p && Math.abs(d.x - p.x) < 460;
      const rate = (hail ? 1.55 : 2.45) / spdMul(hail, G.stage);
      if (d.popT <= 0) {
        d.popT = rate + rand(0, 1.1);
        if (vis && G.deadT <= 0) spawnPopper(d);
      }
    }
  }

  function enemyShoot(e, mul) {
    const p = G.player;
    if (!p || p.inDoor || G.deadT > 0) return;
    if (Math.abs(e.y - p.y) > 40) return;
    const dx = p.x - e.x;
    if (Math.abs(dx) > 360) return;
    e.face = dx > 0 ? 1 : -1;
    if (countShots('e') >= (isHail() ? 10 : 7)) return;
    const spd = 300 * mul;
    spawnShot(e.x + e.face * 14, e.y - 16, e.face * spd, 'e', HOT2);
    emit(3, {
      x: e.x + e.face * 14, y: e.y - 16, j: 3,
      vx0: e.face * 20, vx1: e.face * 80, vy0: -20, vy1: 20,
      life: 0.12, r0: 1, r1: 1.8, rgb: HOT
    });
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    if (e.hitN > 0) e.hitN -= dt;
    const mul = spdMul(isHail(), G.stage);
    const p = G.player;
    e.t += dt;
    if (!e.grounded) {
      e.vy += GRAV * dt;
      const y0 = e.y;
      const y1 = e.y + e.vy * dt;
      const plat = landOn(e.x, y0, y1, null);
      if (plat && e.vy >= 0) {
        e.y = plat.y;
        e.vy = 0;
        e.grounded = true;
      } else e.y = y1;
    }

    if (e.kind === 'panther' || e.kind === 'popper' || e.kind === 'gunner') {
      let dir = e.face;
      if (p && Math.abs(p.x - e.x) < 220 && Math.abs(p.y - e.y) < 48) {
        dir = p.x > e.x ? 1 : -1;
      }
      const spd = (e.kind === 'gunner' ? 28 : e.kind === 'popper' ? 92 : 70) * mul;
      if (e.kind === 'gunner') {
        e.face = dir;
      } else {
        const nx = e.x + dir * spd * dt;
        if (nx < e.a || nx > e.b || !standAt(nx + dir * 8, e.y)) e.face = -e.face;
        else {
          e.x = nx;
          e.face = dir;
        }
      }
    }

    if (e.kind === 'pink') {
      if (e.grounded && p && Math.abs(p.x - e.x) < 230 && Math.abs(p.y - e.y) < 110 && e.t > 0.5) {
        e.face = p.x > e.x ? 1 : -1;
        e.vx = e.face * 160 * mul;
        e.vy = -400;
        e.grounded = false;
        e.t = 0;
      }
      if (!e.grounded) e.x += e.vx * dt;
      e.x = clamp(e.x, 20, G.levelW - 20);
    }

    e.fire -= dt;
    const interval = (e.kind === 'gunner' ? 0.85 : e.kind === 'pink' ? 1.15 : 1.45) / mul;
    if (e.fire <= 0 && playing() && G.deadT <= 0) {
      e.fire = interval + rand(0, 0.35);
      enemyShoot(e, mul);
    }

    if (playing() && p && !p.inDoor && G.deadT <= 0 && G.invuln <= 0) {
      if (Math.abs(e.x - p.x) < 14 && Math.abs(e.y - p.y) < 22) {
        hurtPlayer('touch', e.x);
      }
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    if (b.hitN > 0) b.hitN -= dt;
    const p = G.player;
    if (!b.active) {
      if (p && p.x > G.levelW - 380) {
        b.active = true;
        audio.boss();
        toast('头目 · ' + b.name, false, true);
        screenFlash(HOT, 0.25);
        syncHud();
      }
      return;
    }
    const mul = spdMul(isHail(), G.stage);
    b.t += dt;
    if (!b.grounded) {
      b.vy += GRAV * dt;
      const y0 = b.y;
      const y1 = b.y + b.vy * dt;
      const plat = landOn(b.x, y0, y1, null);
      if (plat && b.vy >= 0) {
        b.y = plat.y;
        b.vy = 0;
        b.grounded = true;
      } else b.y = y1;
    }
    if (p) b.face = p.x > b.x ? 1 : -1;
    const left = G.levelW - 340;
    const right = G.levelW - 50;
    const spd = (b.kind === '面具' ? 78 : b.kind === '双枪' ? 70 : 58) * mul;
    b.x += b.face * spd * dt * (Math.sin(b.t * 1.4) > 0 ? 1 : -0.4);
    b.x = clamp(b.x, left, right);

    if (b.grounded && b.kind === '面具' && b.t > 2.4 && p && Math.abs(p.y - UY) < 12) {
      b.vy = -JUMP_V * 0.92;
      b.grounded = false;
      b.t = 0;
    }

    b.fire -= dt;
    const rate = (b.kind === '双枪' ? 0.55 : b.kind === '面具' ? 0.7 : 0.9) / mul;
    if (b.fire <= 0 && playing() && p && !p.inDoor && G.deadT <= 0) {
      b.fire = rate;
      const by = b.y - 18;
      spawnShot(b.x + b.face * 16, by, b.face * 340 * mul, 'e', GOLD);
      if (b.kind !== '库管') {
        spawnShot(b.x + b.face * 16, by - 8, b.face * 300 * mul, 'e', HOT);
      }
      if (b.kind === '面具') {
        spawnShot(b.x + b.face * 12, by + 8, b.face * 280 * mul, 'e', MAG);
        if (Math.random() < 0.45) {
          const d = G.doors[G.doors.length - 1 - ((Math.random() * 4) | 0)];
          if (d) spawnPopper(d);
        }
      }
      audio.shot(true);
    }

    if (playing() && p && !p.inDoor && G.deadT <= 0 && G.invuln <= 0) {
      if (Math.abs(b.x - p.x) < 18 && Math.abs(b.y - p.y) < 26) hurtPlayer('touch', b.x);
    }
  }

  function updateShots(dt) {
    const p = G.player;
    let i, s;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      s.life -= dt;
      s.x += s.vx * dt;
      if (s.life <= 0 || s.x < G.camX - 40 || s.x > G.camX + VW + 40) {
        G.shots.splice(i, 1);
        continue;
      }
      if (s.from === 'p') {
        let j, e;
        for (j = 0; j < G.ents.length; j++) {
          e = G.ents[j];
          if (e.dead) continue;
          if (Math.abs(s.x - e.x) < 12 && Math.abs(s.y - (e.y - 14)) < 16) {
            hurtEnt(e, 1);
            G.shots.splice(i, 1);
            s = null;
            break;
          }
        }
        if (!s) continue;
        if (G.boss && !G.boss.dead && G.boss.active) {
          e = G.boss;
          if (Math.abs(s.x - e.x) < 16 && Math.abs(s.y - (e.y - 16)) < 20) {
            hurtEnt(e, 1);
            G.shots.splice(i, 1);
          }
        }
      } else if (p && !p.inDoor && G.deadT <= 0) {
        if (Math.abs(s.x - p.x) < 10 && Math.abs(s.y - (p.y - 14)) < 16) {
          hurtPlayer('shot', s.x);
          popSpark(p.x, p.y - 14, HOT, 8);
          G.shots.splice(i, 1);
        }
      }
    }
  }

  function updateFx(dt) {
    let i, o;
    for (i = particles.length - 1; i >= 0; i--) {
      o = particles[i];
      o.life -= dt;
      o.vy += (o.g || 400) * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      if (o.life <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      o = sparks[i];
      o.t += dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.vy += 380 * dt;
      if (o.t > 0.28) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      o = rings[i];
      o.t += dt;
      if (o.t > 0.4) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      o = floats[i];
      o.t += dt;
      o.y -= o.vy * dt;
      if (o.t > o.life) floats.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    if (G.toastT > 0) G.toastT -= dt;
  }

  function updateCam(dt) {
    const p = G.player;
    if (!p) return;
    const look = p.face > 0 ? 70 : -30;
    let tx = p.x - VW * 0.36 - look * 0.15;
    tx = clamp(tx, 0, Math.max(0, G.levelW - VW));
    G.camX = lerp(G.camX, tx, 1 - Math.pow(0.012, dt));
    const ty = pFloor() === 'u' ? -18 : 0;
    G.camY = lerp(G.camY, ty, 1 - Math.pow(0.04, dt));
  }

  function update(dt) {
    G.clock += dt;
    if (autoOn) tickAutoFlow(dt);
    updateFx(dt);
    if (G.stop > 0 && !(autoOn && autoSpeed >= 4 && G.mode === 'play')) {
      G.stop -= dt;
      G.wasD = inD();
      return;
    }
    if (autoOn && autoSpeed >= 4) G.stop = 0;
    if (G.mode === 'title' && !autoOn) attractThink();
    if (autoOn && G.mode === 'play' && G.deadT <= 0) autoThink();
    if (G.mode === 'title' && G.ammo <= 0) G.ammo = AMMO_P;
    updatePlayer(dt);
    G.wasD = inD();
    updateDoors(dt);
    let i;
    for (i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    updateBoss(dt);
    updateShots(dt);
    updateCam(dt);
    if (G.clearT > 0) {
      G.clearT -= dt;
      if (G.clearT <= 0 && playing()) nextStage();
    }
    if (G.mode === 'title' && G.player && G.player.x > 720) {
      G.player.x = 90;
      G.camX = 0;
      G.ammo = AMMO_P;
    }
  }

  function themeWall() {
    if (G.theme === 'hall') return [22, 12, 28];
    if (G.theme === 'pent') return [28, 10, 12];
    return [14, 28, 34];
  }

  function themeStrip() {
    if (G.theme === 'hall') return MAG;
    if (G.theme === 'pent') return GOLD;
    return CYN;
  }

  function drawSky() {
    const wall = themeWall();
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    g.addColorStop(0, rgba([wall[0] - 6, wall[1] - 6, wall[2] - 4], 1));
    g.addColorStop(0.55, rgba(wall, 1));
    g.addColorStop(1, rgba([8, 6, 6], 1));
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
  }

  function drawWarehouse() {
    const strip = themeStrip();
    const x0 = G.camX - 20;
    const x1 = G.camX + VW + 20;
    const bay = 88;
    const s0 = Math.floor(x0 / bay);
    const s1 = Math.ceil(x1 / bay);
    let i;
    for (i = s0; i <= s1; i++) {
      const x = i * bay;
      const h = hash2(i * 13 + G.stage * 7);
      ctx.fillStyle = rgba([10, 8, 10], 0.35);
      ctx.fillRect(sx(x + 4), sy(48), 6 * scale, (GY - 52) * scale);
      ctx.strokeStyle = rgba(strip, 0.18 + h * 0.12);
      ctx.lineWidth = 1.2 * scale;
      ctx.strokeRect(sx(x + 18), sy(62), 52 * scale, 46 * scale);
      ctx.fillStyle = rgba(CYN, 0.05 + h * 0.04);
      ctx.fillRect(sx(x + 22), sy(66), 20 * scale, 18 * scale);
      ctx.fillStyle = rgba(HOT, 0.04 + h * 0.03);
      ctx.fillRect(sx(x + 44), sy(66), 20 * scale, 18 * scale);
      ctx.strokeRect(sx(x + 18), sy(UY - 70), 52 * scale, 40 * scale);
    }
    ctx.fillStyle = rgba(strip, 0.22);
    ctx.fillRect(sx(G.camX), sy(UY - 8), VW * scale, 2 * scale);
    ctx.fillStyle = rgba(strip, 0.16);
    ctx.fillRect(sx(G.camX), sy(GY - 10), VW * scale, 2 * scale);
    ctx.fillStyle = rgba(HOT, 0.08);
    for (i = Math.floor(G.camX / 28); i < (G.camX + VW) / 28 + 1; i++) {
      ctx.fillRect(sx(i * 28), sy(GY + 4), 14 * scale, 6 * scale);
    }
  }

  function drawPlats() {
    let i;
    for (i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      if (p.x + p.w < G.camX - 10 || p.x > G.camX + VW + 10) continue;
      if (p.base) {
        ctx.fillStyle = rgba([24, 16, 16], 1);
        ctx.fillRect(sx(p.x), sy(p.y), p.w * scale, 40 * scale);
        ctx.fillStyle = rgba(HOT, 0.35);
        ctx.fillRect(sx(p.x), sy(p.y), p.w * scale, 3 * scale);
      } else {
        ctx.fillStyle = rgba([36, 44, 52], 0.95);
        ctx.fillRect(sx(p.x), sy(p.y), p.w * scale, 8 * scale);
        ctx.fillStyle = rgba(themeStrip(), 0.45);
        ctx.fillRect(sx(p.x), sy(p.y), p.w * scale, 2 * scale);
      }
    }
  }

  function drawCrates() {
    let i;
    for (i = 0; i < G.crates.length; i++) {
      const x = G.crates[i];
      if (x < G.camX - 30 || x > G.camX + VW + 30) continue;
      ctx.fillStyle = rgba([92, 54, 28], 0.95);
      ctx.fillRect(sx(x), sy(GY - 22), 28 * scale, 22 * scale);
      ctx.strokeStyle = rgba(GOLD, 0.35);
      ctx.lineWidth = 1;
      ctx.strokeRect(sx(x), sy(GY - 22), 28 * scale, 22 * scale);
      ctx.fillStyle = rgba([70, 40, 20], 0.9);
      ctx.fillRect(sx(x + 32), sy(GY - 14), 18 * scale, 14 * scale);
    }
  }

  function drawDoor(d) {
    const fy = floorY(d.floor);
    if (d.x < G.camX - 30 || d.x > G.camX + VW + 30) return;
    const w = 32;
    const h = 50;
    const x = d.x - w * 0.5;
    const y = fy - h;
    const glow = d.kind === 'smg' ? GOLD : CYN;
    ctx.fillStyle = rgba([6, 8, 10], 0.92);
    ctx.fillRect(sx(x), sy(y), w * scale, h * scale);
    ctx.strokeStyle = rgba(glow, 0.55 + d.slam * 0.4);
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(sx(x), sy(y), w * scale, h * scale);
    const swing = 4 + d.open * 16 + d.slam * 3;
    ctx.fillStyle = rgba(d.kind === 'smg' ? [48, 32, 12] : [22, 18, 20], 0.92);
    ctx.fillRect(sx(x + 2), sy(y + 3), (w * 0.5 + swing * 0.2) * scale, (h - 6) * scale);
    ctx.fillStyle = rgba(glow, 0.18 + d.open * 0.2);
    ctx.fillRect(sx(x + w * 0.45), sy(y + 8), 6 * scale, (h - 16) * scale);
    if (d.kind === 'smg') {
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(sx(d.x - 5), sy(y + 8), 10 * scale, 3 * scale);
    }
    const p = G.player;
    if (p && p.inDoor === d) {
      ctx.fillStyle = rgba(CREAM, 0.55);
      ctx.fillRect(sx(d.x - 5), sy(fy - 36), 10 * scale, 28 * scale);
      ctx.fillStyle = rgba(SKIN, 0.7);
      ctx.beginPath();
      ctx.arc(sx(d.x), sy(fy - 40), 5 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawShot(s) {
    const a = clamp(s.life * 2, 0, 1);
    ctx.fillStyle = rgba(s.rgb, 0.9 * a);
    ctx.fillRect(sx(s.x - 5), sy(s.y - 1.5), 10 * scale, 3 * scale);
    ctx.fillStyle = rgba(WHT, 0.7 * a);
    ctx.fillRect(sx(s.x - 2), sy(s.y - 1), 4 * scale, 2 * scale);
  }

  function drawFigure(x, y, face, t, coat, scaleN, opt) {
    const blink = opt.blink && ((t * 16) % 1) < 0.42;
    if (blink) ctx.globalAlpha = 0.35;
    const px = sx(x);
    const py = sy(y);
    const sq = opt.squash || 1;
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(scale * face, scale * sq * (scaleN || 1));
    ctx.fillStyle = rgba(HOOD, 0.9);
    ctx.fillRect(-6, -8, 5, 8);
    ctx.fillRect(1, -8, 5, 8);
    ctx.fillStyle = rgba(coat, 0.98);
    ctx.fillRect(-8, -24, 16, 18);
    if (opt.agent) {
      ctx.fillStyle = rgba(HOT, 0.95);
      ctx.fillRect(-1.2, -22, 2.4, 8);
      ctx.fillStyle = rgba(SKIN, 1);
      ctx.beginPath();
      ctx.arc(0, -30, 5.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba([22, 16, 16], 1);
      ctx.fillRect(-7, -36, 14, 4);
      ctx.fillRect(-8, -33, 16, 2.2);
    } else if (opt.boss) {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(0, -32, 6.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.fillRect(-3, -33, 2, 2);
      ctx.fillRect(1, -33, 2, 2);
      ctx.fillStyle = rgba(HOOD, 1);
      ctx.fillRect(-8, -40, 16, 5);
    } else {
      ctx.fillStyle = rgba(opt.pink ? PINK : HOOD, 1);
      ctx.beginPath();
      ctx.arc(0, -30, 5.4, 0, TAU);
      ctx.fill();
      ctx.fillRect(-7, -36, 14, 8);
      ctx.fillStyle = rgba(opt.pink ? MAG : CYN, 0.7);
      ctx.fillRect(-3, -29, 2, 1.4);
      ctx.fillRect(1, -29, 2, 1.4);
    }
    ctx.fillStyle = rgba(opt.gunRgb || GOLD, 0.95);
    ctx.fillRect(6, -18, 12, 2.2);
    if (opt.muzzle) {
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.fillRect(16, -20, 8, 6);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawFx() {
    let i, o, a;
    for (i = 0; i < rings.length; i++) {
      o = rings[i];
      a = 1 - o.t / 0.4;
      ctx.strokeStyle = rgba(o.rgb, 0.55 * a);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.r + o.t * 90) * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < sparks.length; i++) {
      o = sparks[i];
      a = 1 - o.t / 0.28;
      ctx.fillStyle = rgba(o.rgb, 0.75 * a);
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.rad * a) * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < particles.length; i++) {
      o = particles[i];
      a = o.life / o.max;
      ctx.fillStyle = rgba(o.rgb, 0.85 * a);
      ctx.fillRect(sx(o.x), sy(o.y), o.r * scale, o.r * scale);
    }
    for (i = 0; i < floats.length; i++) {
      o = floats[i];
      a = 1 - o.t / o.life;
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(o.rgb, 1);
      ctx.font = 'bold ' + (o.size * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(o.text, sx(o.x), sy(o.y));
      ctx.globalAlpha = 1;
    }
  }

  function drawPrompt() {
    const p = G.player;
    if (!p || p.inDoor || G.deadT > 0 || !playing()) return;
    const d = nearDoor();
    if (!d) return;
    ctx.fillStyle = rgba(CYN, 0.85);
    ctx.font = 'bold ' + (11 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('↓ 钻门', sx(d.x), sy(floorY(d.floor) - 58));
  }

  function draw() {
    dpr = dpr || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0c0808';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    const sh = REDUCE ? 0 : G.shake;
    if (sh > 0) {
      ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh * 0.7);
    }
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();

    drawSky();
    drawWarehouse();
    drawPlats();
    drawCrates();

    let i;
    for (i = 0; i < G.doors.length; i++) drawDoor(G.doors[i]);

    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      const coat = e.kind === 'pink' ? PINK : (e.kind === 'gunner' ? [60, 48, 70] : [36, 32, 48]);
      drawFigure(e.x, e.y, e.face, G.clock, coat, 0.95, {
        run: G.clock * 8, grounded: e.grounded, squash: 1,
        pink: e.kind === 'pink', muzzle: false
      });
    }

    if (G.boss && !G.boss.dead) {
      ctx.globalAlpha = G.boss.active ? 1 : 0.45;
      drawFigure(G.boss.x, G.boss.y, G.boss.face, G.clock, MAG, 1.22, {
        boss: true, grounded: G.boss.grounded, squash: 1,
        muzzle: G.boss.fire < 0.12
      });
      ctx.globalAlpha = 1;
    }

    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);

    const p = G.player;
    if (p && !p.inDoor) {
      const blink = playing() && G.invuln > 0 && G.deadT <= 0;
      drawFigure(p.x, p.y, p.face, G.clock, CREAM, 1, {
        agent: true, blink: blink, squash: p.squash,
        muzzle: G.muzzle > 0, gunRgb: G.gun === 'smg' ? CYN : GOLD
      });
    }

    drawPrompt();
    drawFx();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
    ctx.restore();
  }

  function resize() {
    if (!stageEl || !canvas) return;
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function primaryAction() {
    if (G.mode === 'title') startGame('infil');
    else if (G.mode === 'win' || G.mode === 'lose') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    if (isAutoKey(e)) {
      if (down && !e.repeat) {
        audio.ensure();
        toggleAuto();
      }
      e.preventDefault();
      return;
    }
    if (e.target === speedEl) return;

    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';

    if (!autoOn) {
      if (k === 'ArrowLeft' || k === 'Left') keys.l = down;
      if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
      if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
      if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
      if (space) keys.fire = down;
    } else if (down && (isMove || space)) {
      e.preventDefault();
    }

    if (down && (isMove || space || k === 'Enter')) e.preventDefault();
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
    if (k === '1' && G.mode === 'title') {
      startGame('infil');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('hail');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (playing() && space) tryFire();
    }
  }

  function bindPad() {
    function hold(el, on, off) {
      if (!el) return;
      const down = function (e) {
        e.preventDefault();
        if (autoOn) return;
        audio.ensure();
        el.classList.add('held');
        on();
      };
      const up = function (e) {
        e.preventDefault();
        el.classList.remove('held');
        if (off) off();
      };
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('pointerleave', up);
    }
    hold(document.getElementById('btn-left'), function () { keys.l = true; }, function () { keys.l = false; });
    hold(document.getElementById('btn-right'), function () { keys.r = true; }, function () { keys.r = false; });
    hold(document.getElementById('btn-jump'), function () { keys.u = true; }, function () { keys.u = false; });
    hold(document.getElementById('btn-door'), function () { keys.d = true; }, function () { keys.d = false; });
    hold(document.getElementById('btn-fire'), function () {
      keys.fire = true;
      if (playing()) tryFire();
    }, function () { keys.fire = false; });
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen() || autoOn) return;
      keys.fire = true;
      if (playing()) tryFire();
    });
    canvas.addEventListener('pointerup', function () { keys.fire = false; });
    canvas.addEventListener('pointercancel', function () { keys.fire = false; });
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
    const turbo = autoOn && autoSpeed >= 4 && G.mode === 'play';
    acc += dt * autoScale();
    let n = 0;
    const maxSteps = turbo ? 16 : 5;
    while (acc >= STEP && n < maxSteps) {
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
  autoSpeed = loadAutoSpeed();
  syncSpeedUi();
  syncAutoUi();
  goTitle();
  resize();
  bindPointer();
  bindPad();

  if (btnInfil) {
    btnInfil.addEventListener('click', function () {
      audio.ensure();
      startGame('infil');
    });
  }
  if (btnHail) {
    btnHail.addEventListener('click', function () {
      audio.ensure();
      startGame('hail');
    });
  }
  if (ovAgain) {
    ovAgain.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind);
    });
  }
  if (ovMenu) {
    ovMenu.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'win') startGame('hail');
      else goTitle();
    });
  }
  if (modeInfil) {
    modeInfil.addEventListener('click', function () {
      audio.ensure();
      startGame('infil');
    });
  }
  if (modeHail) {
    modeHail.addEventListener('click', function () {
      audio.ensure();
      startGame('hail');
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  if (btnAuto) {
    btnAuto.addEventListener('click', function () {
      audio.ensure();
      toggleAuto();
    });
  }
  if (speedEl) {
    speedEl.addEventListener('input', function () { setAutoSpeed(parseInt(speedEl.value, 10)); });
    speedEl.addEventListener('change', function () { setAutoSpeed(parseInt(speedEl.value, 10)); });
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
      keys.fire = false;
    }
  });

  requestAnimationFrame(frame);
})();
