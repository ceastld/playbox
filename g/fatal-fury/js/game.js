'use strict';

/* 饿狼 — Fatal Fury lite. No CDN. Distinct from 末刃 / 侍魂 / 红侠 / 街霸. */

(function () {
  const VW = 720;
  const VH = 400;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const GROUND = 336;
  const WALK = 176;
  const BACK = 128;
  const JUMP_V = 490;
  const GRAV = 1410;
  const MAX_FALL = 660;
  const ROUND_DUEL = 99;
  const ROUND_CHAIN = 70;
  const WINS_NEED = 2;
  const HP_DUEL = 100;
  const HP_CHAIN = 86;
  const COMBO_DUEL = 1.18;
  const COMBO_CHAIN = 1.52;
  const EDGE = 42;
  const GAP = 28;
  const METER_MAX = 100;
  const WAVE_COST = 40;
  const BURN_COST = 50;
  const SUPER_COST = 100;
  const SWAY_DUR = 0.26;
  const SWAY_INV = 0.16;
  const PLANE_Y = 22;
  const PLANE_SC = 0.84;
  const BEST_KEY = 'playbox-fatal-fury-best';
  const MUTE_KEY = 'playbox-fatal-fury-mute';
  const OPS = '方向 / WASD 走跳 · 空格拳 · Shift / Z 踢 · X 换线 · R 重开 · M 静音';

  const MAG = [255, 61, 120];
  const CYN = [94, 232, 208];
  const GOLD = [255, 227, 107];
  const HOT = [255, 74, 20];
  const HOT2 = [255, 122, 50];
  const WHT = [255, 244, 232];
  const NEON = [255, 154, 58];
  const SKIN = [232, 184, 152];
  const JEAN = [42, 74, 148];

  const MOVES = {
    punch: { dur: 0.24, hit0: 0.04, hit1: 0.12, dmg: 8, stun: 0.18, kb: 42, range: 44, h0: 22, h1: 48, stop: 0.038, height: 'mid', score: 70, name: '拳' },
    punch2: { dur: 0.28, hit0: 0.05, hit1: 0.14, dmg: 10, stun: 0.22, kb: 58, range: 48, h0: 18, h1: 52, stop: 0.048, height: 'mid', score: 110, name: '二拳' },
    punch3: { dur: 0.34, hit0: 0.07, hit1: 0.18, dmg: 13, stun: 0.38, kb: 110, range: 52, h0: 12, h1: 56, stop: 0.062, height: 'mid', score: 150, knockdown: true, name: '三拳' },
    kick: { dur: 0.32, hit0: 0.08, hit1: 0.18, dmg: 12, stun: 0.28, kb: 88, range: 56, h0: 16, h1: 46, stop: 0.054, height: 'mid', score: 90, name: '踢' },
    apunch: { dur: 0.28, hit0: 0.04, hit1: 0.2, dmg: 9, stun: 0.18, kb: 50, range: 42, h0: 8, h1: 44, stop: 0.044, height: 'high', score: 80, name: '跳拳' },
    akick: { dur: 0.3, hit0: 0.05, hit1: 0.22, dmg: 11, stun: 0.22, kb: 64, range: 50, h0: 4, h1: 40, stop: 0.05, height: 'high', score: 100, name: '跳踢' },
    lpunch: { dur: 0.22, hit0: 0.04, hit1: 0.12, dmg: 7, stun: 0.16, kb: 36, range: 38, h0: 8, h1: 28, stop: 0.034, height: 'mid', score: 60, name: '下拳' },
    sweep: { dur: 0.36, hit0: 0.1, hit1: 0.22, dmg: 11, stun: 0.44, kb: 130, range: 50, h0: 0, h1: 16, stop: 0.052, height: 'low', score: 85, knockdown: true, name: '扫腿' },
    wave: { dur: 0.48, hit0: 0.14, hit1: 0.26, dmg: 16, stun: 0.3, kb: 80, range: 28, h0: 0, h1: 22, stop: 0.064, height: 'low', score: 200, knockdown: true, proj: true, cost: 40, name: '地波' },
    super: { dur: 0.58, hit0: 0.16, hit1: 0.34, dmg: 24, stun: 0.42, kb: 130, range: 34, h0: 0, h1: 28, stop: 0.078, height: 'mid', score: 360, knockdown: true, proj: true, both: true, cost: 100, name: '超地波' },
    burn: { dur: 0.46, hit0: 0.08, hit1: 0.28, dmg: 18, stun: 0.36, kb: 140, range: 46, h0: 10, h1: 50, stop: 0.07, height: 'mid', score: 280, knockdown: true, dash: true, cost: 50, name: '燃拳' }
  };

  const FIGHTERS = [
    {
      id: 'wolf', name: '赤狼', en: 'WOLF',
      hp: HP_DUEL, hpChain: HP_CHAIN, walk: WALK, back: BACK, jump: JUMP_V, size: 1,
      top: [244, 240, 232], pants: JEAN, shoes: [196, 28, 24],
      hair: [232, 196, 90], skin: SKIN, accent: GOLD, cap: [196, 28, 24],
      glow: HOT, capOn: true,
      ai: { agg: 0.6, spec: 0.24, jump: 0.22, think: 0.24, sway: 0.42, kick: 0.34 }
    },
    {
      id: 'crane', name: '白鹫', en: 'CRANE',
      hp: HP_DUEL, hpChain: HP_CHAIN, walk: 168, back: 124, jump: 476, size: 1.04,
      top: [236, 232, 220], pants: [228, 224, 214], shoes: [18, 14, 16],
      hair: [220, 190, 80], skin: SKIN, accent: [160, 90, 220], cap: [90, 40, 140],
      glow: [180, 120, 255], suit: true,
      ai: { agg: 0.64, spec: 0.32, jump: 0.18, think: 0.2, sway: 0.5, kick: 0.28 }
    },
    {
      id: 'tiger', name: '炎踢', en: 'TIGER',
      hp: HP_CHAIN, hpChain: HP_CHAIN, walk: 198, back: 146, jump: 512, size: 0.96,
      top: [220, 90, 30], pants: [22, 16, 14], shoes: [40, 140, 70],
      hair: [28, 16, 12], skin: [236, 176, 140], accent: GOLD, cap: [40, 140, 70],
      glow: HOT2, band: true,
      ai: { agg: 0.8, spec: 0.28, jump: 0.36, think: 0.12, sway: 0.58, kick: 0.62 }
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
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }
  function comboMul(n) {
    return 1 + Math.min(4, Math.floor(Math.max(0, (n | 0) - 1) / 2));
  }
  function jumpHeight(v, g) {
    return (v * v) / (2 * g);
  }
  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function ease(t) {
    return t * t * (3 - 2 * t);
  }
  function chainMode() {
    return G.kind === 'chain';
  }
  function speedMul() {
    return chainMode() ? 1.3 : 1;
  }
  function timeMul() {
    return chainMode() ? 0.76 : 1;
  }
  function roundTime() {
    return chainMode() ? ROUND_CHAIN : ROUND_DUEL;
  }
  function comboWin() {
    return chainMode() ? COMBO_CHAIN : COMBO_DUEL;
  }
  function foeSpec() {
    return chainMode() ? FIGHTERS[2] : FIGHTERS[1];
  }
  function playerHp() {
    return chainMode() ? HP_CHAIN : HP_DUEL;
  }

  function moveOf(kind) {
    const m = MOVES[kind];
    if (!m) return m;
    const t = timeMul();
    if (t === 1) return m;
    return {
      dur: m.dur * t,
      hit0: m.hit0 * t,
      hit1: m.hit1 * t,
      dmg: m.dmg,
      stun: m.stun * t,
      kb: m.kb,
      range: m.range,
      h0: m.h0,
      h1: m.h1,
      stop: Math.min(0.08, m.stop * 0.92),
      height: m.height,
      score: m.score,
      knockdown: m.knockdown,
      proj: m.proj,
      both: m.both,
      dash: m.dash,
      cost: m.cost,
      name: m.name
    };
  }

  function selfCheck() {
    if (WINS_NEED !== 2) throw new Error('2 wins');
    if (HP_DUEL !== 100) throw new Error('hp duel');
    if (HP_CHAIN !== 86) throw new Error('hp chain');
    if (ROUND_DUEL !== 99 || ROUND_CHAIN !== 70) throw new Error('timer');
    if (BEST_KEY !== 'playbox-fatal-fury-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-fatal-fury-mute') throw new Error('mute key');
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(2) !== 1) throw new Error('combo 2');
    if (comboMul(3) !== 2) throw new Error('combo 3');
    if (comboMul(9) !== 5) throw new Error('combo cap');
    const h = jumpHeight(JUMP_V, GRAV);
    if (h < 78 || h > 95) throw new Error('jump height ' + h);
    if (FIGHTERS.length !== 3) throw new Error('3 fighters');
    if (FIGHTERS[0].id !== 'wolf' || FIGHTERS[1].id !== 'crane' || FIGHTERS[2].id !== 'tiger') throw new Error('ids');
    if (MOVES.punch.dmg >= MOVES.punch2.dmg) throw new Error('p2 stronger');
    if (MOVES.kick.range <= MOVES.punch.range) throw new Error('kick reach');
    if (MOVES.sweep.height !== 'low' || MOVES.apunch.height !== 'high') throw new Error('heights');
    if (!MOVES.wave.proj || MOVES.wave.cost !== 40) throw new Error('wave');
    if (!MOVES.super.both || MOVES.super.dmg <= MOVES.wave.dmg) throw new Error('super');
    if (!MOVES.burn.dash || MOVES.burn.cost !== 50) throw new Error('burn');
    if (WAVE_COST !== 40 || BURN_COST !== 50 || SUPER_COST !== 100) throw new Error('meter cost');
    if (SWAY_DUR < 0.18 || SWAY_INV >= SWAY_DUR) throw new Error('sway');
  }
  selfCheck();
  if (typeof document === 'undefined') return;

  const REDUCE = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const stageEl = document.getElementById('stage');
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const ovStart = document.getElementById('ov-start');
  const ovEnd = document.getElementById('ov-end');
  const btnDuel = document.getElementById('btn-duel');
  const btnChain = document.getElementById('btn-chain');
  const ovRetry = document.getElementById('ov-retry');
  const ovModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const comboEl = document.getElementById('combo');
  const scoreBox = document.getElementById('score-box');
  const comboBox = document.getElementById('combo-box');
  const scoreAdd = document.getElementById('score-add');
  const modeLabel = document.getElementById('mode-label');
  const tagLabel = document.getElementById('tag-label');
  const roundLabel = document.getElementById('round-label');
  const laneLabel = document.getElementById('lane-label');
  const p1NameEl = document.getElementById('p1-name');
  const p2NameEl = document.getElementById('p2-name');
  const hp1El = document.getElementById('hp1');
  const hp2El = document.getElementById('hp2');
  const mt1El = document.getElementById('mt1');
  const mt2El = document.getElementById('mt2');
  const timerEl = document.getElementById('timer');
  const pips1El = document.getElementById('pips1');
  const pips2El = document.getElementById('pips2');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const chainPop = document.getElementById('chain-pop');
  const padBtns = {
    l: document.getElementById('btn-left'),
    r: document.getElementById('btn-right'),
    u: document.getElementById('btn-up'),
    d: document.getElementById('btn-down'),
    punch: document.getElementById('btn-punch'),
    kick: document.getElementById('btn-kick'),
    sway: document.getElementById('btn-sway')
  };

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
  let last = 0;
  let acc = 0;

  const keys = { l: false, r: false, u: false, d: false, punch: false, kick: false, sway: false };
  const punchEdge = { down: false };
  const kickEdge = { down: false };
  const swayEdge = { down: false };
  const jumpEdge = { down: false };

  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const trails = [];
  const embers = [];
  const slashes = [];

  const G = {
    mode: 'title',
    kind: 'duel',
    clock: 0,
    score: 0,
    best: 0,
    bestV: 0,
    bestL: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    round: 1,
    pWins: 0,
    cWins: 0,
    timer: ROUND_DUEL,
    phase: 'intro',
    introT: 0,
    koT: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    slam: 0,
    call: '',
    callT: 0,
    why: '',
    won: false,
    hudDirty: true,
    p1: null,
    p2: null,
    waves: [],
    demo: true,
    _drawRound: false,
    _timeAward: null,
    _tShow: ROUND_DUEL
  };

  function overlayOpen() {
    return overlay && !overlay.classList.contains('hidden');
  }
  function inputOk() {
    return G.mode === 'play' && !overlayOpen() && G.phase === 'fight';
  }

  /* ---- audio ---- */
  const audio = {
    ctx: null,
    master: null,
    muted: false,
    noiseBuf: null,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.4;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.4;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) { /* ignore */ }
    },
    beep: function (freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.03);
    },
    noise: function (dur, vol, freq, type) {
      if (!this.ctx || this.muted) return;
      if (!this.noiseBuf) {
        const sr = this.ctx.sampleRate;
        const buf = this.ctx.createBuffer(1, (sr * 0.45) | 0, sr);
        const data = buf.getChannelData(0);
        let i;
        for (i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = this.ctx.createBiquadFilter();
      f.type = type || 'bandpass';
      f.frequency.value = freq || 900;
      f.Q.value = type === 'lowpass' ? 0.7 : 1.15;
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
    swing: function (kick) {
      this.ensure();
      this.noise(kick ? 0.08 : 0.05, kick ? 0.08 : 0.055, kick ? 520 : 1400, 'highpass');
      this.beep(kick ? 140 : 260, 0.05, 'sawtooth', 0.03, 62);
    },
    hit: function (combo, heavy) {
      this.ensure();
      const p = 1 + Math.min(7, combo) * 0.07;
      this.noise(0.12, heavy ? 0.22 : 0.14, 180, 'lowpass');
      this.beep(170 * p, 0.1, 'square', 0.08, 54);
      this.beep((heavy ? 920 : 680) * p, 0.07, 'triangle', 0.048, 400 * p);
      if (heavy) this.beep(1240 * p, 0.08, 'square', 0.038, 1640 * p);
    },
    clash: function () {
      this.ensure();
      this.noise(0.1, 0.16, 1600, 'bandpass');
      this.beep(880, 0.08, 'square', 0.07, 220);
      this.beep(1400, 0.07, 'triangle', 0.05, 580);
      this.beep(200, 0.1, 'sawtooth', 0.04, 86);
    },
    wave: function (supered) {
      this.ensure();
      this.noise(0.2, supered ? 0.2 : 0.13, 220, 'lowpass');
      this.beep(supered ? 140 : 190, 0.22, 'sawtooth', 0.07, 64);
      this.beep(supered ? 640 : 780, 0.16, 'square', 0.05, 280);
    },
    burn: function () {
      this.ensure();
      this.noise(0.16, 0.16, 300, 'bandpass');
      this.beep(180, 0.18, 'sawtooth', 0.07, 90);
      this.beep(520, 0.12, 'square', 0.045, 220);
    },
    sway: function () {
      this.ensure();
      this.noise(0.08, 0.07, 1100, 'highpass');
      this.beep(420, 0.08, 'triangle', 0.035, 880);
    },
    whiff: function () {
      this.ensure();
      this.noise(0.06, 0.05, 1800, 'highpass');
      this.beep(240, 0.05, 'square', 0.02, 120);
    },
    jump: function () {
      this.ensure();
      this.beep(390, 0.07, 'square', 0.03, 190);
    },
    land: function () {
      this.ensure();
      this.noise(0.05, 0.05, 280, 'lowpass');
    },
    hurt: function () {
      this.ensure();
      this.noise(0.16, 0.15, 240, 'lowpass');
      this.beep(280, 0.16, 'sawtooth', 0.05, 70);
    },
    ko: function () {
      this.ensure();
      this.noise(0.28, 0.2, 120, 'lowpass');
      this.beep(110, 0.32, 'sine', 0.08, 42);
      this.beep(196, 0.22, 'sawtooth', 0.05, 80);
    },
    slam: function () {
      this.ensure();
      this.noise(0.22, 0.2, 90, 'lowpass');
      this.beep(70, 0.2, 'sine', 0.09, 36);
    },
    bell: function () {
      this.ensure();
      this.beep(880, 0.16, 'sine', 0.06, 760);
      this.beep(1320, 0.1, 'triangle', 0.04, 990);
    },
    win: function () {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.05, 659);
      this.beep(659, 0.1, 'square', 0.05, 784);
      this.beep(1046, 0.2, 'triangle', 0.045, 1318);
    },
    over: function () {
      this.ensure();
      this.beep(196, 0.18, 'sawtooth', 0.05, 98);
      this.beep(130, 0.28, 'square', 0.04, 60);
    },
    ui: function () {
      this.ensure();
      this.beep(640, 0.05, 'square', 0.035, 420);
    },
    combo: function (n) {
      this.ensure();
      this.beep(440 + n * 42, 0.08, 'square', 0.05, 880 + n * 48);
    },
    start: function () {
      this.ensure();
      this.beep(330, 0.08, 'square', 0.04, 440);
      this.beep(440, 0.1, 'triangle', 0.04, 660);
    },
    empty: function () {
      this.ensure();
      this.beep(140, 0.08, 'square', 0.03, 80);
    }
  };

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      if (o && typeof o === 'object') {
        G.bestV = o.v | 0;
        G.bestL = o.l | 0;
      } else {
        const n = parseInt(raw, 10);
        if (n > 0) G.bestV = n;
      }
    } catch (e) { /* ignore */ }
    G.best = chainMode() ? G.bestL : G.bestV;
  }
  function persistBest() {
    if (chainMode()) {
      if (G.score > G.bestL) G.bestL = G.score;
      G.best = G.bestL;
    } else {
      if (G.score > G.bestV) G.bestV = G.score;
      G.best = G.bestV;
    }
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ v: G.bestV, l: G.bestL }));
    } catch (e) { /* ignore */ }
    G.hudDirty = true;
  }

  function addScore(n, x, y, rgb) {
    if (G.mode !== 'play' || n <= 0) return;
    const v = Math.round(n);
    G.score += v;
    persistBest();
    G.hudDirty = true;
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    if (scoreAdd) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + v;
      clearTimeout(addTok);
      addTok = setTimeout(function () { scoreAdd.hidden = true; }, 700);
    }
    if (x != null) floatTxt('+' + v, x, y == null ? GROUND - 80 : y, rgb || GOLD);
  }

  function toast(msg, kind) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = 'toast' + (kind ? ' ' + kind : '');
    clearTimeout(toastTok);
    toastTok = setTimeout(function () { toastEl.classList.add('hidden'); }, 1400);
  }
  function popChain(n) {
    if (!chainPop || REDUCE) return;
    chainPop.textContent = n + ' 打';
    chainPop.classList.remove('hidden');
    void chainPop.offsetWidth;
    clearTimeout(chainTok);
    chainTok = setTimeout(function () { chainPop.classList.add('hidden'); }, 700);
  }
  function kickStage(cls) {
    if (!stageEl || REDUCE) return;
    stageEl.classList.remove('hit', 'boom', 'die', 'thump', 'spec', 'win-flash', 'clash', 'sway');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    clearTimeout(kickTok);
    kickTok = setTimeout(function () {
      stageEl.classList.remove(cls);
    }, 420);
  }
  function hitStop(t) {
    if (REDUCE) return;
    G.stop = Math.max(G.stop, t);
  }
  function shake(n) {
    if (REDUCE) return;
    G.shake = Math.max(G.shake, n);
  }
  function flash(rgb, t) {
    G.flash = Math.max(G.flash, t || 0.12);
    G.flashRgb = rgb || WHT;
  }
  function callout(text, t) {
    G.call = text;
    G.callT = t || 0.9;
  }

  /* ---- fx ---- */
  function burst(x, y, rgb, n, spd) {
    let i;
    const s = spd || 180;
    const count = REDUCE ? Math.min(n, 6) : n;
    for (i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const v = rand(s * 0.3, s);
      particles.push({
        x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - rand(20, 80),
        r: rand(1.4, 3.6), rgb: rgb, t: rand(0.22, 0.5), max: 0.5, g: 420
      });
    }
    capArr(particles, 240);
  }
  function sparkAt(x, y, rgb) {
    let i;
    const n = REDUCE ? 4 : 8;
    for (i = 0; i < n; i++) {
      const a = (i / n) * TAU + rand(-0.2, 0.2);
      sparks.push({
        x: x, y: y, vx: Math.cos(a) * rand(140, 280), vy: Math.sin(a) * rand(140, 280),
        t: 0.22, rgb: rgb
      });
    }
    capArr(sparks, 80);
  }
  function ringAt(x, y, rgb) {
    rings.push({ x: x, y: y, r: 6, t: 0.4, rgb: rgb });
    capArr(rings, 24);
  }
  function floatTxt(text, x, y, rgb) {
    floats.push({ text: text, x: x, y: y, vy: -48, t: 0.7, life: 0.7, rgb: rgb || GOLD });
    capArr(floats, 28);
  }
  function trailAt(x, y, rgb, r) {
    trails.push({ x: x, y: y, t: 0.22, rgb: rgb, r: r || 7 });
    capArr(trails, 70);
  }
  function slashArc(x, y, face, rgb, r) {
    slashes.push({ x: x, y: y, face: face, t: 0.16, rgb: rgb, r: r || 28 });
    capArr(slashes, 16);
  }
  function spawnEmber() {
    const dense = chainMode() ? 1.7 : 1;
    if (REDUCE) return;
    if (embers.length > (chainMode() ? 52 : 30)) return;
    embers.push({
      x: rand(-20, VW + 20),
      y: rand(-30, 90),
      vx: rand(-22, 16) * dense,
      vy: rand(36, 78) * dense,
      a: rand(0, TAU),
      va: rand(-4, 4),
      s: rand(1.4, 3.2),
      rgb: Math.random() < 0.5 ? HOT2 : (Math.random() < 0.5 ? GOLD : NEON),
      t: rand(3.2, 7)
    });
  }
  function seedEmbers() {
    embers.length = 0;
    let i;
    const n = REDUCE ? 6 : (chainMode() ? 24 : 14);
    for (i = 0; i < n; i++) {
      spawnEmber();
      embers[embers.length - 1].y = rand(20, GROUND - 40);
    }
  }

  function tickFx(dt) {
    let i, p;
    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      if (p.t <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      p = sparks[i];
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.t <= 0) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      p = rings[i];
      p.t -= dt;
      p.r += 90 * dt;
      if (p.t <= 0) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      p = floats[i];
      p.t -= dt;
      p.y += p.vy * dt;
      if (p.t <= 0) floats.splice(i, 1);
    }
    for (i = trails.length - 1; i >= 0; i--) {
      p = trails[i];
      p.t -= dt;
      if (p.t <= 0) trails.splice(i, 1);
    }
    for (i = slashes.length - 1; i >= 0; i--) {
      p = slashes[i];
      p.t -= dt;
      if (p.t <= 0) slashes.splice(i, 1);
    }
    for (i = embers.length - 1; i >= 0; i--) {
      p = embers[i];
      p.t -= dt;
      p.x += p.vx * dt + Math.sin(p.a) * 10 * dt;
      p.y += p.vy * dt;
      p.a += p.va * dt;
      if (p.t <= 0 || p.y > GROUND + 8) embers.splice(i, 1);
    }
    if (!REDUCE && Math.random() < (chainMode() ? 0.26 : 0.13)) spawnEmber();
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 3.2);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt);
    if (G.slam > 0) G.slam = Math.max(0, G.slam - dt);
    if (G.callT > 0) G.callT = Math.max(0, G.callT - dt);
  }

  /* ---- fighters ---- */
  function makeFighter(spec, x, face, cpu, hp) {
    const max = hp == null ? spec.hp : hp;
    return {
      spec: spec,
      x: x,
      y: GROUND,
      vx: 0,
      vy: 0,
      face: face,
      grounded: true,
      crouch: false,
      hp: max,
      maxHp: max,
      meter: 0,
      atk: null,
      hurtT: 0,
      flashT: 0,
      invuln: 0,
      ko: false,
      win: false,
      airT: 0,
      jdir: 0,
      step: 0,
      airAtk: false,
      thinkT: 0.2,
      plan: null,
      cpu: !!cpu,
      plane: 0,
      swayT: 0,
      swayFrom: 0,
      swayInv: 0,
      keys: { l: false, r: false, u: false, d: false, punch: false, kick: false, sway: false }
    };
  }

  function foeOf(f) {
    return f === G.p1 ? G.p2 : G.p1;
  }
  function busy(f) {
    return !!(f.atk || f.hurtT > 0 || f.ko || f.win || f.swayT > 0);
  }
  function canAct(f) {
    return !f.ko && !f.win && f.hurtT <= 0 && f.swayT <= 0;
  }
  function canCancel(f, into) {
    if (!f.atk || !f.atk.hit) return false;
    const k = f.atk.kind;
    if (into === 'punch2') return k === 'punch';
    if (into === 'punch3') return k === 'punch2' && chainMode();
    if (into === 'kick') return k === 'punch' || k === 'punch2';
    if (into === 'wave' || into === 'super' || into === 'burn') {
      return k === 'punch' || k === 'punch2' || k === 'punch3' || k === 'kick';
    }
    return false;
  }
  function planeVis(f) {
    let u = f.plane;
    if (f.swayT > 0) {
      const t = 1 - f.swayT / SWAY_DUR;
      u = lerp(f.swayFrom, f.plane, ease(clamp(t, 0, 1)));
    }
    return u;
  }
  function planeOff(f) {
    return -PLANE_Y * planeVis(f);
  }
  function planeScale(f) {
    return lerp(1, PLANE_SC, planeVis(f));
  }
  function samePlane(a, b) {
    if (a.swayInv > 0 || b.swayInv > 0) return false;
    return a.plane === b.plane;
  }
  function bodyBox(f) {
    const crouch = f.crouch && f.grounded && !f.atk;
    const sc = planeScale(f);
    const h = (f.ko && f.grounded ? 16 : crouch ? 30 : 54 * (f.spec.size || 1)) * sc;
    const w = 20 * (f.spec.size || 1) * sc;
    return { x: f.x - w / 2, y: f.y + planeOff(f) - h, w: w, h: h };
  }
  function atkBox(f) {
    if (!f.atk) return null;
    const m = f.atk.def;
    if (m.proj) return null;
    if (f.atk.t < m.hit0 || f.atk.t > m.hit1) return null;
    const sc = planeScale(f);
    const face = f.face;
    const x0 = f.x + face * 10 * sc;
    const x1 = f.x + face * (10 + m.range) * sc;
    const x = Math.min(x0, x1);
    const w = Math.abs(x1 - x0);
    const y0 = f.y + planeOff(f) - m.h1 * sc;
    const h = Math.max(6, (m.h1 - m.h0) * sc);
    return { x: x, y: y0, w: w, h: h };
  }
  function canHitHeight(move, vic) {
    if (move.height === 'high' && vic.crouch && vic.grounded && !vic.atk) return false;
    if (move.height === 'low' && !vic.grounded) return false;
    return true;
  }

  function addMeter(f, n) {
    const gain = n * (chainMode() ? 1.28 : 1);
    f.meter = clamp(f.meter + gain, 0, METER_MAX);
    G.hudDirty = true;
  }

  function startAtk(f, kind) {
    if (!canAct(f)) return false;
    if (f.atk && !canCancel(f, kind)) return false;
    if (kind === 'punch3' && !chainMode()) return false;
    const def = moveOf(kind);
    if (!def) return false;
    if (def.cost) {
      if (f.meter < def.cost) {
        if (f === G.p1 && G.mode === 'play') {
          audio.empty();
          toast('气不足', 'warn');
        }
        return false;
      }
      f.meter -= def.cost;
      G.hudDirty = true;
    }
    f.atk = { kind: kind, t: 0, spent: false, def: def, hit: false, fired: false, missed: false };
    f.crouch = kind === 'sweep' || kind === 'lpunch' || kind === 'wave' || kind === 'super';
    if (kind === 'wave' || kind === 'super') {
      const supered = kind === 'super';
      flash(supered ? GOLD : f.spec.glow, supered ? 0.22 : 0.14);
      kickStage('spec');
      audio.wave(supered);
      burst(f.x + f.face * 16, f.y - 12, f.spec.glow, supered ? 20 : 12, supered ? 240 : 170);
      ringAt(f.x, f.y - 10, f.spec.glow);
      if (G.mode === 'play' && f === G.p1) toast(supered ? '超地波！' : '地波！', 'gold');
    } else if (kind === 'burn') {
      flash(HOT, 0.16);
      kickStage('spec');
      audio.burn();
      burst(f.x, f.y - 28, HOT, 16, 220);
      if (G.mode === 'play' && f === G.p1) toast('燃拳！', 'gold');
    } else {
      audio.swing(kind === 'kick' || kind === 'akick' || kind === 'sweep' || kind === 'punch3');
    }
    return true;
  }

  function tryPunch(f) {
    if (!canAct(f) && !(f.atk && (canCancel(f, 'punch2') || canCancel(f, 'punch3')))) return false;
    if (!f.grounded) {
      if (f.airAtk) return false;
      if (startAtk(f, 'apunch')) {
        f.airAtk = true;
        return true;
      }
      return false;
    }
    if (f.crouch || f.keys.d) {
      if (f.meter >= SUPER_COST) return startAtk(f, 'super');
      if (f.meter >= WAVE_COST) return startAtk(f, 'wave');
      return startAtk(f, 'lpunch');
    }
    if (f.atk && f.atk.kind === 'punch2' && canCancel(f, 'punch3')) return startAtk(f, 'punch3');
    if (f.atk && f.atk.kind === 'punch' && canCancel(f, 'punch2')) return startAtk(f, 'punch2');
    return startAtk(f, 'punch');
  }

  function tryKick(f) {
    if (!canAct(f) && !(f.atk && canCancel(f, 'kick'))) return false;
    if (!f.grounded) {
      if (f.airAtk) return false;
      if (startAtk(f, 'akick')) {
        f.airAtk = true;
        return true;
      }
      return false;
    }
    if (f.crouch || f.keys.d) return startAtk(f, 'sweep');
    return startAtk(f, 'kick');
  }

  function tryBurn(f) {
    if (!f.grounded) return false;
    if (f.meter < BURN_COST) return false;
    if (f.atk && !canCancel(f, 'burn') && !canAct(f)) return false;
    return startAtk(f, 'burn');
  }

  function trySway(f) {
    if (!f.grounded) return false;
    if (f.hurtT > 0 || f.ko || f.win) return false;
    if (f.swayT > 0) return false;
    if (f.atk && !f.atk.hit) return false;
    const fo = foeOf(f);
    const old = f.plane;
    f.atk = null;
    f.swayFrom = old;
    f.plane = old === 0 ? 1 : 0;
    f.swayT = SWAY_DUR;
    f.swayInv = SWAY_INV;
    f.vx *= 0.3;
    audio.sway();
    kickStage('sway');
    ringAt(f.x, f.y - 24, CYN);
    burst(f.x, f.y - 20, CYN, 8, 140);
    G.hudDirty = true;
    let dodged = false;
    if (fo && fo.atk && !fo.atk.spent && fo.plane === old) {
      if (atkBox(fo) || (fo.atk.def && fo.atk.def.proj)) dodged = true;
    }
    let wi;
    for (wi = 0; wi < G.waves.length; wi++) {
      const w = G.waves[wi];
      if (w.owner === f) continue;
      if (w.both) continue;
      if (w.plane === old && Math.abs(w.x - f.x) < 110) dodged = true;
    }
    if (dodged && G.mode === 'play' && f === G.p1) {
      addScore(80, f.x, f.y - 70, CYN);
      floatTxt('换线！', f.x, f.y - 86, CYN);
      toast('换线躲开', 'gold');
    }
    return true;
  }

  function spawnWave(f, supered) {
    G.waves.push({
      owner: f,
      x: f.x + f.face * 28,
      y: GROUND - (supered ? 16 : 12),
      vx: f.face * (supered ? 320 : 268) * speedMul(),
      life: supered ? 1.2 : 0.95,
      dmg: supered ? 22 : 15,
      score: supered ? 360 : 200,
      rgb: supered ? GOLD : f.spec.glow,
      face: f.face,
      r: supered ? 20 : 14,
      supered: supered,
      plane: f.plane,
      both: !!supered
    });
  }

  function applyHit(att, vic, move, isProj, hx, hy) {
    if (vic.ko || vic.win) return false;
    if (vic.invuln > 0 || vic.swayInv > 0) return false;
    const heavy = move.dmg >= 13 || isProj || move.knockdown || move.dash;
    vic.hp -= move.dmg;
    vic.hurtT = move.stun;
    vic.atk = null;
    vic.crouch = false;
    vic.flashT = 0.1;
    vic.vx = att.face * move.kb;
    addMeter(vic, 6);
    addMeter(att, isProj ? 8 : 12);
    if (move.knockdown || vic.hp <= 0) {
      vic.vy = vic.hp <= 0 ? -270 : -188;
      vic.grounded = false;
      vic.airT = 0.01;
      vic.airAtk = false;
    } else if (!vic.grounded) {
      vic.vy = Math.min(vic.vy, -80);
    }
    sparkAt(hx, hy, heavy ? GOLD : WHT);
    burst(hx, hy, heavy ? HOT : GOLD, heavy ? 18 : 12, heavy ? 270 : 190);
    ringAt(hx, hy, att.spec.glow);
    slashArc(hx, hy, att.face, att.spec.glow, heavy ? 42 : 30);
    audio.hit(G.combo + 1, heavy);
    hitStop(REDUCE ? 0 : (vic.hp <= 0 ? 0.08 : move.stop));
    shake(vic.hp <= 0 ? 1.1 : heavy ? 0.55 : 0.32);
    kickStage(vic.hp <= 0 ? 'die' : (heavy ? 'boom' : 'hit'));
    if (G.mode === 'play' && att === G.p1) {
      G.combo += 1;
      G.comboT = comboWin() + Math.min(0.4, G.combo * 0.04);
      if (G.combo > G.maxCombo) G.maxCombo = G.combo;
      G.hudDirty = true;
      const pts = Math.round(move.score * comboMul(G.combo));
      addScore(pts, hx, hy - 12, G.combo >= 3 ? GOLD : WHT);
      if (G.combo === 3 || G.combo === 5 || G.combo === 8) {
        popChain(G.combo);
        audio.combo(G.combo);
      }
      floatTxt(G.combo + ' HIT', hx, hy - 28, MAG);
      if (comboBox) {
        comboBox.classList.remove('hot');
        void comboBox.offsetWidth;
        comboBox.classList.add('hot');
      }
    } else if (G.mode === 'play') {
      G.combo = 0;
      G.comboT = 0;
      G.hudDirty = true;
      audio.hurt();
    }
    if (vic.hp <= 0) {
      vic.hp = 0;
      vic.ko = true;
      vic.hurtT = 2.4;
      startKo(att, vic);
    }
    G.hudDirty = true;
    return true;
  }

  function doClash(hx, hy) {
    G.p1.atk.spent = true;
    G.p2.atk.spent = true;
    G.p1.vx = -G.p1.face * 90;
    G.p2.vx = -G.p2.face * 90;
    addMeter(G.p1, 16);
    addMeter(G.p2, 16);
    sparkAt(hx, hy, GOLD);
    burst(hx, hy, WHT, 16, 240);
    burst(hx, hy, GOLD, 10, 180);
    ringAt(hx, hy, GOLD);
    slashArc(hx, hy, 1, GOLD, 38);
    slashArc(hx, hy, -1, CYN, 38);
    audio.clash();
    hitStop(REDUCE ? 0 : 0.056);
    shake(0.42);
    kickStage('clash');
    flash(NEON, 0.1);
    if (G.mode === 'play') {
      addScore(50, hx, hy - 16, CYN);
      floatTxt('对打', hx, hy - 36, GOLD);
    }
  }

  function startKo(att, vic) {
    audio.ko();
    flash(HOT, 0.22);
    kickStage('die');
    callout('KO', 1.4);
    burst(vic.x, vic.y - 30, HOT, 28, 320);
    burst(vic.x, vic.y - 24, GOLD, 16, 240);
    if (G.mode !== 'play') {
      G.koT = 1.2;
      G.phase = 'ko';
      return;
    }
    G.phase = 'ko';
    G.koT = 1.85;
    if (att === G.p1 && !att.ko) {
      const perfect = att.hp >= att.maxHp;
      addScore(1000, att.x, att.y - 70, GOLD);
      if (perfect) {
        addScore(2000, att.x, att.y - 90, CYN);
        toast('完美！', 'gold');
      }
      att.win = true;
    }
  }

  function landSlam(f) {
    if (!f.ko) return;
    G.slam = 0.35;
    shake(0.9);
    kickStage('thump');
    audio.slam();
    burst(f.x, f.y - 8, HOT, 18, 200);
    ringAt(f.x, f.y - 6, HOT);
  }

  function separate(a, b) {
    if (!samePlane(a, b)) return;
    const gap = GAP * (((a.spec.size || 1) + (b.spec.size || 1)) * 0.5);
    const d = b.x - a.x;
    if (Math.abs(d) >= gap) return;
    const mid = (a.x + b.x) / 2;
    let left = a;
    let right = b;
    if (d < 0) { left = b; right = a; }
    left.x = mid - gap / 2;
    right.x = mid + gap / 2;
    if (left.x < EDGE) {
      right.x += EDGE - left.x;
      left.x = EDGE;
    }
    if (right.x > VW - EDGE) {
      left.x -= right.x - (VW - EDGE);
      right.x = VW - EDGE;
    }
    left.x = clamp(left.x, EDGE, VW - EDGE);
    right.x = clamp(right.x, EDGE, VW - EDGE);
  }

  function tickFighter(f, dt, live) {
    const spec = f.spec;
    const fo = foeOf(f);
    const sm = speedMul();
    if (f.flashT > 0) f.flashT -= dt;
    if (f.invuln > 0) f.invuln -= dt;
    if (f.swayInv > 0) f.swayInv -= dt;
    if (f.swayT > 0) {
      f.swayT -= dt;
      if (f.swayT < 0) f.swayT = 0;
    }

    if (f.hurtT > 0) {
      f.hurtT -= dt;
      f.atk = null;
    }

    if (f.win && f.grounded) {
      f.vx = 0;
      f.step += dt;
      return;
    }

    if (f.ko) {
      f.atk = null;
      f.vy += GRAV * dt;
      if (f.vy > MAX_FALL) f.vy = MAX_FALL;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.vx *= 0.98;
      if (f.y >= GROUND) {
        if (!f.grounded && f.vy > 80) landSlam(f);
        f.y = GROUND;
        f.vy = 0;
        f.vx *= 0.4;
        f.grounded = true;
      }
      f.x = clamp(f.x, EDGE, VW - EDGE);
      return;
    }

    if (!f.grounded) {
      f.airT += dt;
      f.vy += GRAV * dt;
      if (f.vy > MAX_FALL) f.vy = MAX_FALL;
      if (live && canAct(f) && !f.atk) {
        if (f.keys.l) f.vx -= 52 * dt;
        if (f.keys.r) f.vx += 52 * dt;
        f.vx = clamp(f.vx, -200, 200);
      }
    } else {
      f.airT = 0;
      f.jdir = 0;
      f.airAtk = false;
    }

    const acting = busy(f);
    if (f.grounded && !acting && live) {
      const toward = fo.x >= f.x ? 1 : -1;
      f.face = toward;
      f.crouch = !!f.keys.d && !f.keys.u;
      if (f.crouch) {
        f.vx = 0;
      } else {
        let ax = 0;
        if (f.keys.l) ax -= 1;
        if (f.keys.r) ax += 1;
        const walk = spec.walk * sm;
        const back = spec.back * sm;
        if (ax < 0) f.vx = -((f.face > 0) ? back : walk);
        else if (ax > 0) f.vx = (f.face > 0) ? walk : back;
        else f.vx = 0;
        if (ax) f.step += dt * 10 * sm;
      }
      if (f.keys.u && !f.crouch) {
        f.grounded = false;
        f.vy = -(spec.jump || JUMP_V);
        f.jdir = 0;
        if (f.keys.l && !f.keys.r) f.jdir = -1;
        else if (f.keys.r && !f.keys.l) f.jdir = 1;
        f.vx = f.jdir * spec.walk * sm * 0.9;
        f.airT = 0.001;
        f.airAtk = false;
        audio.jump();
      }
    } else if (f.grounded && f.atk) {
      if (f.atk.def.dash && f.atk.t >= f.atk.def.hit0 && f.atk.t <= f.atk.def.hit1) {
        f.vx = f.face * 360 * sm;
      } else {
        f.vx *= 0.5;
      }
    }

    if (live && (canAct(f) || (f.atk && f.atk.hit))) {
      const pu = f.keys._punch;
      const ki = f.keys._kick;
      const sw = f.keys._sway;
      f.keys._punch = false;
      f.keys._kick = false;
      f.keys._sway = false;
      if (sw) trySway(f);
      else if (pu && ki) {
        if (!tryBurn(f)) {
          if (ki) tryKick(f);
          else tryPunch(f);
        }
      } else if (ki) tryKick(f);
      else if (pu) tryPunch(f);
    }

    if (f.atk) {
      f.atk.t += dt;
      const k = f.atk.kind;
      const m = f.atk.def;
      if ((k === 'wave' || k === 'super') && !f.atk.fired && f.atk.t >= m.hit0) {
        f.atk.fired = true;
        spawnWave(f, k === 'super');
        burst(f.x + f.face * 26, f.y - 12, f.spec.glow, 10, 140);
      }
      if (f.atk.t >= m.hit0 && f.atk.t <= m.hit1 && !m.proj && (G.clock * 60 | 0) % 2 === 0) {
        slashArc(f.x + f.face * (16 + m.range * 0.4), f.y + planeOff(f) - (m.h0 + m.h1) * 0.5, f.face, f.spec.glow, 22);
      }
      if (k === 'burn' && (G.clock * 60 | 0) % 2 === 0) {
        trailAt(f.x - f.face * 8, f.y - 28, HOT, 10);
      }
      if (f.atk.t >= m.dur) f.atk = null;
    }

    f.x += f.vx * dt;
    f.y += f.vy * dt;
    if (f.y >= GROUND) {
      if (!f.grounded) {
        if (f.vy > 120) audio.land();
        if (f.atk && (f.atk.kind === 'apunch' || f.atk.kind === 'akick')) f.atk = null;
      }
      f.y = GROUND;
      f.vy = 0;
      f.grounded = true;
    }
    f.x = clamp(f.x, EDGE, VW - EDGE);
  }

  function tickHits() {
    const a = atkBox(G.p1);
    const b = atkBox(G.p2);
    const hb1 = bodyBox(G.p2);
    const hb2 = bodyBox(G.p1);
    let p1hit = !!(a && G.p1.atk && !G.p1.atk.spent && aabb(a, hb1));
    let p2hit = !!(b && G.p2.atk && !G.p2.atk.spent && aabb(b, hb2));
    if (p1hit && (!samePlane(G.p1, G.p2) || !canHitHeight(G.p1.atk.def, G.p2))) {
      if (!G.p1.atk.missed) {
        G.p1.atk.missed = true;
        audio.whiff();
        floatTxt(samePlane(G.p1, G.p2) ? '空' : '换线', G.p2.x, G.p2.y - 64, CYN);
      }
      p1hit = false;
    }
    if (p2hit && (!samePlane(G.p2, G.p1) || !canHitHeight(G.p2.atk.def, G.p1))) {
      if (!G.p2.atk.missed) {
        G.p2.atk.missed = true;
        audio.whiff();
        floatTxt(samePlane(G.p2, G.p1) ? '空' : '换线', G.p1.x, G.p1.y - 64, NEON);
      }
      p2hit = false;
    }
    const blades = !!(a && b && aabb(a, b) && G.p1.atk && G.p2.atk && !G.p1.atk.spent && !G.p2.atk.spent && samePlane(G.p1, G.p2));
    const bothMid = G.p1.atk && G.p2.atk && G.p1.atk.def.height !== 'low' && G.p2.atk.def.height !== 'low';
    if ((p1hit && p2hit) || (blades && bothMid)) {
      const hx = (G.p1.x + G.p2.x) / 2;
      const hy = GROUND - 36;
      doClash(hx, hy);
      return;
    }
    if (p1hit) {
      G.p1.atk.spent = true;
      G.p1.atk.hit = true;
      applyHit(G.p1, G.p2, G.p1.atk.def, false, G.p2.x - G.p2.face * 8, G.p2.y + planeOff(G.p2) - 36);
    }
    if (p2hit) {
      G.p2.atk.spent = true;
      G.p2.atk.hit = true;
      applyHit(G.p2, G.p1, G.p2.atk.def, false, G.p1.x - G.p1.face * 8, G.p1.y + planeOff(G.p1) - 36);
    }
  }

  function tickWaves(dt) {
    let i, j, p, q;
    for (i = G.waves.length - 1; i >= 0; i--) {
      p = G.waves[i];
      p.life -= dt;
      p.x += p.vx * dt;
      trailAt(p.x, p.y, p.rgb, p.r * 0.7);
      if (p.life <= 0 || p.x < -36 || p.x > VW + 36) {
        G.waves.splice(i, 1);
        continue;
      }
      const box = { x: p.x - p.r, y: p.y - p.r * 0.45, w: p.r * 2, h: p.r * 0.95 };
      const vic = p.owner === G.p1 ? G.p2 : G.p1;
      const planeOk = p.both || (p.plane === vic.plane && vic.swayInv <= 0);
      const foAtk = atkBox(vic);
      if (planeOk && foAtk && aabb(box, foAtk) && !vic.atk.def.proj) {
        burst(p.x, p.y, GOLD, 10, 150);
        ringAt(p.x, p.y, GOLD);
        audio.clash();
        G.waves.splice(i, 1);
        if (vic.atk) vic.atk.spent = true;
        continue;
      }
      if (planeOk && aabb(box, bodyBox(vic)) && canHitHeight({ height: p.supered ? 'mid' : 'low' }, vic)) {
        const def = {
          dmg: p.dmg, stun: p.supered ? 0.4 : 0.3, kb: p.supered ? 130 : 90,
          height: p.supered ? 'mid' : 'low', score: p.score, stop: p.supered ? 0.078 : 0.064, knockdown: true
        };
        applyHit(p.owner, vic, def, true, p.x, p.y);
        burst(p.x, p.y, p.rgb, 14, 180);
        G.waves.splice(i, 1);
      } else if (!planeOk && aabb(box, bodyBox(vic))) {
        if (!p._whiff) {
          p._whiff = true;
          floatTxt('换线', vic.x, vic.y - 60, CYN);
          audio.whiff();
        }
      }
    }
    for (i = G.waves.length - 1; i >= 0; i--) {
      p = G.waves[i];
      for (j = i - 1; j >= 0; j--) {
        q = G.waves[j];
        if (p.owner === q.owner) continue;
        if (p.plane !== q.plane && !p.both && !q.both) continue;
        if (hypot(p.x - q.x, p.y - q.y) < p.r + q.r + 4) {
          burst((p.x + q.x) / 2, (p.y + q.y) / 2, WHT, 16, 200);
          ringAt((p.x + q.x) / 2, (p.y + q.y) / 2, GOLD);
          audio.clash();
          G.waves.splice(i, 1);
          G.waves.splice(j, 1);
          i--;
          break;
        }
      }
    }
  }

  /* ---- CPU ---- */
  function incomingOn(f) {
    const p = foeOf(f);
    const dist = Math.abs(p.x - f.x);
    if (p.atk && !p.atk.spent && p.plane === f.plane && dist < 86 && p.atk.t < p.atk.def.hit1) return true;
    let i;
    for (i = 0; i < G.waves.length; i++) {
      const w = G.waves[i];
      if (w.owner === f) continue;
      if (!w.both && w.plane !== f.plane) continue;
      const closing = (w.vx > 0 && w.x < f.x) || (w.vx < 0 && w.x > f.x);
      if (closing && Math.abs(w.x - f.x) < 140) return true;
    }
    return false;
  }

  function cpuThink(f, dt) {
    const p = foeOf(f);
    const ai = f.spec.ai;
    const dist = Math.abs(p.x - f.x);
    const k = f.keys;
    k.l = k.r = k.u = k.d = false;
    k._punch = false;
    k._kick = false;
    k._sway = false;

    f.thinkT -= dt;
    if (f.plan && f.plan.t != null) {
      f.plan.t -= dt;
      if (f.plan.t <= 0) f.plan = null;
    }

    const plan = f.plan;
    if (plan) {
      if (plan.type === 'walk') {
        if (plan.dir < 0) k.l = true;
        else k.r = true;
      } else if (plan.type === 'jump' || plan.type === 'jumpin') {
        k.u = true;
        if (plan.dir < 0 || (plan.type === 'jumpin' && f.face < 0)) k.l = true;
        if (plan.dir > 0 || (plan.type === 'jumpin' && f.face > 0)) k.r = true;
        if (plan.type === 'jumpin' && !f.grounded && f.airT > 0.1 && !plan.did) {
          k._kick = Math.random() < ai.kick;
          k._punch = !k._kick;
          plan.did = true;
        }
      } else if (plan.type === 'punch') {
        if (!plan.did) { k._punch = true; plan.did = true; }
      } else if (plan.type === 'kick') {
        if (!plan.did) { k._kick = true; plan.did = true; }
      } else if (plan.type === 'low') {
        k.d = true;
        if (!plan.did) { k._kick = true; plan.did = true; }
      } else if (plan.type === 'wave') {
        k.d = true;
        if (!plan.did) { k._punch = true; plan.did = true; }
      } else if (plan.type === 'burn') {
        if (!plan.did) { k._punch = true; k._kick = true; plan.did = true; }
      } else if (plan.type === 'sway') {
        if (!plan.did) { k._sway = true; plan.did = true; }
      } else if (plan.type === 'back') {
        if (f.face > 0) k.l = true;
        else k.r = true;
      }
      if (f.atk && f.atk.hit && (f.atk.kind === 'punch' || (chainMode() && f.atk.kind === 'punch2'))) {
        k._punch = true;
      }
      if (f.thinkT > 0) return;
    }

    f.thinkT = (ai.think / speedMul()) * (0.5 + Math.random() * 0.7);
    if (!canAct(f)) {
      f.plan = { type: 'wait', t: 0.08 };
      return;
    }

    const r = Math.random();
    const threat = incomingOn(f);
    const otherLane = p.plane !== f.plane;

    if (threat && r < ai.sway + 0.1) {
      f.plan = { type: 'sway', t: 0.22 };
    } else if (threat && r < ai.sway + 0.1 + ai.jump) {
      f.plan = { type: 'jump', dir: -f.face, t: 0.22 };
    } else if (otherLane) {
      if (r < 0.55) f.plan = { type: 'sway', t: 0.24 };
      else if (r < 0.78) f.plan = { type: 'walk', dir: f.face, t: 0.3 };
      else if (r < 0.9 && f.meter >= WAVE_COST) f.plan = { type: 'wave', t: 0.36 };
      else f.plan = { type: 'back', t: 0.18 };
    } else if (p.airT > 0.06 && dist < 110 && p.y < f.y - 20 && f.grounded) {
      f.plan = { type: r < 0.4 ? 'punch' : (r < 0.7 ? 'kick' : 'wave'), t: 0.22 };
    } else if (dist > 210) {
      if (r < ai.spec && f.meter >= WAVE_COST) f.plan = { type: 'wave', t: 0.4 };
      else f.plan = { type: 'walk', dir: f.face, t: 0.42 };
    } else if (dist > 92) {
      if (r < ai.spec * 0.65 && f.meter >= WAVE_COST) f.plan = { type: 'wave', t: 0.36 };
      else if (r < ai.spec * 0.65 + ai.jump) f.plan = { type: 'jumpin', t: 0.5 };
      else if (r < 0.78) f.plan = { type: 'walk', dir: f.face, t: 0.28 };
      else if (r < 0.88) f.plan = { type: 'sway', t: 0.2 };
      else f.plan = { type: 'back', t: 0.2 };
    } else {
      if (r < ai.agg * 0.36) f.plan = { type: 'punch', t: 0.2 };
      else if (r < ai.agg * 0.36 + ai.kick * 0.5) f.plan = { type: 'kick', t: 0.22 };
      else if (r < ai.agg * 0.7) f.plan = { type: 'low', t: 0.26 };
      else if (r < ai.agg && f.meter >= BURN_COST && dist < 70) f.plan = { type: 'burn', t: 0.3 };
      else if (r < ai.agg + 0.1 && f.meter >= WAVE_COST) f.plan = { type: 'wave', t: 0.3 };
      else if (r < ai.agg + 0.2) f.plan = { type: 'jumpin', t: 0.4 };
      else if (r < ai.agg + 0.32) f.plan = { type: 'sway', t: 0.2 };
      else f.plan = { type: 'back', t: 0.18 };
    }
  }

  function copyPlayerKeys(f) {
    f.keys.l = keys.l;
    f.keys.r = keys.r;
    f.keys.u = keys.u;
    f.keys.d = keys.d;
    f.keys.punch = keys.punch;
    f.keys.kick = keys.kick;
    f.keys.sway = keys.sway;
    if (punchEdge.down) { f.keys._punch = true; punchEdge.down = false; }
    if (kickEdge.down) { f.keys._kick = true; kickEdge.down = false; }
    if (swayEdge.down) { f.keys._sway = true; swayEdge.down = false; }
    if (jumpEdge.down) { f.keys.u = true; jumpEdge.down = false; }
  }

  function clearEdges() {
    punchEdge.down = kickEdge.down = swayEdge.down = jumpEdge.down = false;
  }

  /* ---- rounds / modes ---- */
  function spawnRound() {
    const pSpec = FIGHTERS[0];
    const cSpec = foeSpec();
    const hp = playerHp();
    G.p1 = makeFighter(pSpec, 168, 1, G.mode === 'title', hp);
    G.p2 = makeFighter(cSpec, 552, -1, true, chainMode() ? cSpec.hp : cSpec.hp);
    G.p1.maxHp = G.p1.hp = hp;
    G.p2.maxHp = G.p2.hp = chainMode() ? cSpec.hpChain : cSpec.hp;
    G.waves.length = 0;
    G.timer = roundTime();
    G.phase = 'intro';
    G.introT = 1.35;
    G.koT = 0;
    G._drawRound = false;
    G._timeAward = null;
    G._tShow = roundTime();
    clearEdges();
    G.combo = 0;
    G.comboT = 0;
    G.call = '第 ' + G.round + ' 局';
    G.callT = 0.85;
    G.hudDirty = true;
    seedEmbers();
    audio.bell();
  }

  function startMatch(kind) {
    G.kind = kind || 'duel';
    G.mode = 'play';
    G.demo = false;
    G.score = 0;
    G.round = 1;
    G.pWins = 0;
    G.cWins = 0;
    G.won = false;
    G.why = '';
    G.maxCombo = 0;
    loadBest();
    hideOverlay();
    spawnRound();
    audio.start();
    toast((chainMode() ? '连打' : '饿狼') + ' · ' + foeSpec().name);
    G.hudDirty = true;
    if (canvas) canvas.focus();
  }

  function showTitle() {
    G.mode = 'title';
    G.demo = true;
    G.kind = G.kind || 'duel';
    G.round = 1;
    G.pWins = 0;
    G.cWins = 0;
    G.phase = 'fight';
    G.introT = 0;
    G.p1 = makeFighter(FIGHTERS[0], 168, 1, true, HP_DUEL);
    G.p2 = makeFighter(FIGHTERS[1], 552, -1, true, HP_DUEL);
    G.p1.meter = 50;
    G.p2.meter = 50;
    G.p2.plane = 1;
    G.waves.length = 0;
    G.call = '';
    seedEmbers();
    overlay.classList.remove('hidden', 'end');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.remove('win', 'lose');
    ovKicker.textContent = 'FFUR';
    ovTitle.textContent = '饿狼';
    ovLead.innerHTML = '南镇双街对打。空格拳，Shift 踢，X 换线躲招。下加拳放地波。先赢两局。';
    ovOps.textContent = OPS;
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    G.hudDirty = true;
    if (hintEl) {
      hintEl.textContent = '空格拳 · Shift 踢 · X 换线 · 下+拳地波 · 气满超波 · 先赢两局';
      hintEl.className = 'hint';
    }
  }

  function showEnd(win, why) {
    G.mode = 'end';
    G.won = win;
    G.why = why;
    overlay.classList.remove('hidden');
    overlay.classList.add('end');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', win);
    panel.classList.toggle('lose', !win);
    ovKicker.textContent = win ? 'FFUR' : 'KO';
    ovTitle.textContent = win ? (chainMode() ? '连尽' : '狼胜') : '狼败';
    const foe = (G.p2 && G.p2.spec && G.p2.spec.name) || '对手';
    let lead = why || (win ? '两局到手。' : '血条见底。');
    lead += ' 分数 ' + G.score + ' · 最高连打 ×' + G.maxCombo + ' · 对 ' + foe;
    ovLead.textContent = lead;
    ovOps.textContent = 'R 重开同模式 · 再来同模式 · 换模式回标题';
    ovStart.classList.add('gone');
    ovEnd.classList.remove('gone');
    if (win) {
      audio.win();
      kickStage('win-flash');
    } else {
      audio.over();
    }
    if (hintEl) {
      hintEl.textContent = win ? '再来一局 · R 重开' : 'R 立刻重开';
      hintEl.className = win ? 'hint hot' : 'hint warn';
    }
    G.hudDirty = true;
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
    overlay.classList.remove('end');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function awardRound(pWin, why) {
    if (pWin) G.pWins += 1;
    else G.cWins += 1;
    if (pWin && G.mode === 'play') addScore(400, VW / 2, 80, GOLD);
    G.hudDirty = true;
    toast((pWin ? '赤狼' : G.p2.spec.name) + ' 拿下第 ' + G.round + ' 局', pWin ? 'gold' : 'warn');
    if (G.pWins >= WINS_NEED || G.cWins >= WINS_NEED) {
      const matchWin = G.pWins >= WINS_NEED;
      if (matchWin && G.mode === 'play') addScore(chainMode() ? 2500 : 2000, VW / 2, 100, CYN);
      if (G.mode === 'play') showEnd(matchWin, why);
      else spawnRound();
      return;
    }
    G.round += 1;
    spawnRound();
  }

  function finishKo() {
    if (G.mode !== 'play') {
      G.p1 = makeFighter(FIGHTERS[0], 168, 1, true, HP_DUEL);
      G.p2 = makeFighter(FIGHTERS[1 + ((Math.random() * 2) | 0)], 552, -1, true, HP_DUEL);
      G.p1.plane = 0;
      G.p2.plane = Math.random() < 0.35 ? 1 : 0;
      G.waves.length = 0;
      G.phase = 'fight';
      G.koT = 0;
      return;
    }
    const pKo = G.p1.ko;
    const cKo = G.p2.ko;
    if (G._drawRound) {
      toast('平局重打', 'warn');
      spawnRound();
      return;
    }
    if (G._timeAward != null) {
      const pWin = !!G._timeAward;
      G._timeAward = null;
      awardRound(pWin, pWin ? '时间到，血多者胜。' : '时间到，血少落败。');
      return;
    }
    if (pKo && cKo) {
      toast('同归于尽', 'warn');
      spawnRound();
      return;
    }
    awardRound(!pKo, pKo ? '血条见底。' : '一拳定局。');
  }

  function timeOver() {
    G.phase = 'ko';
    G.koT = 1.2;
    callout('时间到', 1.1);
    audio.bell();
    if (G.p1.hp === G.p2.hp) {
      toast('平局', 'warn');
      G._drawRound = true;
      return;
    }
    const pWin = G.p1.hp > G.p2.hp;
    if (pWin) G.p1.win = true;
    else G.p2.win = true;
    G._timeAward = pWin;
    if (pWin && G.mode === 'play') addScore(600, VW / 2, 90, GOLD);
  }

  /* ---- tick ---- */
  function tick(dt) {
    G.clock += dt;
    if (!G.p1 || !G.p2) return;

    if (G.mode === 'title') {
      cpuThink(G.p1, dt);
      cpuThink(G.p2, dt);
      tickFighter(G.p1, dt, true);
      tickFighter(G.p2, dt, true);
      separate(G.p1, G.p2);
      tickHits();
      tickWaves(dt);
      if (G.p1.ko || G.p2.ko) {
        G.koT -= dt;
        if (G.koT <= 0) finishKo();
      }
      return;
    }

    if (G.phase === 'intro') {
      G.introT -= dt;
      if (G.introT <= 0.45 && G.call === '第 ' + G.round + ' 局') {
        callout('开始', 0.5);
      }
      tickFighter(G.p1, dt, false);
      tickFighter(G.p2, dt, false);
      if (G.introT <= 0) {
        G.phase = 'fight';
        audio.bell();
      }
      return;
    }

    if (G.phase === 'ko') {
      tickFighter(G.p1, dt, false);
      tickFighter(G.p2, dt, false);
      tickWaves(dt);
      G.koT -= dt;
      if (G.koT <= 0) finishKo();
      return;
    }

    if (G.phase === 'fight') {
      if (G.comboT > 0) {
        G.comboT -= dt;
        if (G.comboT <= 0) {
          G.combo = 0;
          G.hudDirty = true;
        }
      }
      G.timer -= dt;
      const shown = Math.max(0, Math.ceil(G.timer));
      if (shown !== G._tShow) {
        G._tShow = shown;
        G.hudDirty = true;
        if (shown <= 10 && shown > 0) audio.beep(880, 0.04, 'square', 0.03);
      }
      if (G.timer <= 0) {
        G.timer = 0;
        timeOver();
        return;
      }

      const live = inputOk();
      if (live) copyPlayerKeys(G.p1);
      else {
        G.p1.keys.l = G.p1.keys.r = G.p1.keys.u = G.p1.keys.d = false;
        G.p1.keys._punch = G.p1.keys._kick = G.p1.keys._sway = false;
      }
      cpuThink(G.p2, dt);
      tickFighter(G.p1, dt, live);
      tickFighter(G.p2, dt, true);
      separate(G.p1, G.p2);
      tickHits();
      tickWaves(dt);
    }
  }

  /* ---- hud ---- */
  function setBar(el, ratio, low) {
    if (!el) return;
    el.style.transform = 'scaleX(' + clamp(ratio, 0, 1) + ')';
    el.classList.toggle('low', !!low && ratio < 0.28);
  }
  function setMeter(el, ratio) {
    if (!el) return;
    el.style.transform = 'scaleX(' + clamp(ratio, 0, 1) + ')';
    el.classList.toggle('full', ratio >= 0.99);
  }
  function renderPips(el, n) {
    if (!el) return;
    if (el.childElementCount !== WINS_NEED) {
      el.innerHTML = '';
      let i;
      for (i = 0; i < WINS_NEED; i++) {
        const s = document.createElement('span');
        s.className = 'pip';
        el.appendChild(s);
      }
    }
    let i;
    for (i = 0; i < el.children.length; i++) {
      el.children[i].classList.toggle('on', i < n);
    }
  }

  function syncHud() {
    G.hudDirty = false;
    if (scoreEl) scoreEl.textContent = String(G.score | 0);
    if (bestEl) bestEl.textContent = String(G.best | 0);
    if (comboEl) comboEl.textContent = '×' + comboMul(G.combo);
    if (modeLabel) {
      modeLabel.textContent = chainMode() ? '连打' : '饿狼';
      modeLabel.classList.toggle('chain', chainMode());
    }
    if (tagLabel) {
      tagLabel.textContent = G.p2 && G.p2.spec ? G.p2.spec.name : '—';
      tagLabel.className = G.p2 && G.p2.hp < G.p2.maxHp * 0.28 ? 'warn' : '';
    }
    if (roundLabel) roundLabel.textContent = '第' + G.round + '局';
    if (laneLabel) {
      const back = G.p1 && G.p1.plane === 1;
      laneLabel.textContent = back ? '后街' : '前街';
      laneLabel.classList.toggle('back', !!back);
    }
    if (p1NameEl) p1NameEl.textContent = G.p1 && G.p1.spec ? G.p1.spec.name : '赤狼';
    if (p2NameEl) p2NameEl.textContent = G.p2 && G.p2.spec ? G.p2.spec.name : '白鹫';
    if (G.p1) {
      setBar(hp1El, G.p1.hp / G.p1.maxHp, true);
      setMeter(mt1El, G.p1.meter / METER_MAX);
    }
    if (G.p2) {
      setBar(hp2El, G.p2.hp / G.p2.maxHp, true);
      setMeter(mt2El, G.p2.meter / METER_MAX);
    }
    if (timerEl) {
      const t = Math.max(0, Math.ceil(G.timer));
      timerEl.textContent = String(t);
      timerEl.classList.toggle('low', t <= 10);
    }
    renderPips(pips1El, G.pWins);
    renderPips(pips2El, G.cWins);
  }

  /* ---- draw ---- */
  function resize() {
    const wrap = canvas.parentElement || canvas;
    const rw = wrap.clientWidth || 720;
    const rh = wrap.clientHeight || 400;
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    W = Math.max(1, rw);
    H = Math.max(1, rh);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) / 2;
    oy = (H - VH * scale) / 2;
  }

  function drawBg() {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, chainMode() ? '#3a1408' : '#2a120c');
    g.addColorStop(0.28, chainMode() ? '#4a1a0c' : '#3a160e');
    g.addColorStop(0.55, chainMode() ? '#1c0a08' : '#160806');
    g.addColorStop(1, '#0a0402');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    const sx = 580;
    const sy = 72;
    const glow = ctx.createRadialGradient(sx, sy, 8, sx, sy, 110);
    glow.addColorStop(0, rgba(NEON, 0.95));
    glow.addColorStop(0.4, rgba(HOT, 0.35));
    glow.addColorStop(1, rgba(HOT, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, sy, 110, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.92);
    ctx.beginPath();
    ctx.arc(sx, sy, 26, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.5);
    ctx.beginPath();
    ctx.arc(sx - 6, sy - 6, 9, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(10, 6, 8, 0.92)';
    ctx.fillRect(40, 118, 92, GROUND - 118);
    ctx.fillRect(210, 96, 70, GROUND - 96);
    ctx.fillRect(390, 108, 110, GROUND - 108);
    ctx.fillRect(560, 88, 120, GROUND - 88);
    ctx.fillStyle = rgba(HOT, 0.16);
    ctx.fillRect(52, 132, 28, 16);
    ctx.fillStyle = rgba(CYN, 0.18);
    ctx.fillRect(222, 112, 22, 14);
    ctx.fillStyle = rgba(GOLD, 0.2);
    ctx.fillRect(410, 122, 36, 14);
    ctx.fillStyle = rgba(MAG, 0.2);
    ctx.fillRect(580, 104, 40, 16);

    ctx.fillStyle = rgba(NEON, chainMode() ? 0.72 : 0.55);
    ctx.font = '900 13px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('南镇', 54, 146);
    ctx.fillStyle = rgba(CYN, 0.7);
    ctx.fillText('OPEN', 222, 124);
    ctx.fillStyle = rgba(GOLD, 0.75);
    ctx.fillText('饿狼', 414, 134);
    ctx.fillStyle = rgba(HOT2, 0.7);
    ctx.fillText('GEES', 584, 116);

    ctx.fillStyle = 'rgba(18, 8, 8, 0.7)';
    ctx.fillRect(118, 168, 10, GROUND - 168);
    ctx.fillRect(486, 154, 10, GROUND - 154);
    ctx.fillStyle = rgba(GOLD, 0.12);
    ctx.beginPath();
    ctx.ellipse(123, 164, 18, 10, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(491, 150, 18, 10, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(NEON, 0.55);
    ctx.beginPath();
    ctx.ellipse(123, 164, 6, 4, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(491, 150, 6, 4, 0, 0, TAU);
    ctx.fill();

    const backLane = GROUND - PLANE_Y;
    ctx.fillStyle = chainMode() ? '#2a1010' : '#22100c';
    ctx.fillRect(0, backLane, VW, PLANE_Y);
    ctx.strokeStyle = rgba(NEON, 0.18);
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 12]);
    ctx.beginPath();
    ctx.moveTo(0, backLane + 2);
    ctx.lineTo(VW, backLane + 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const floor = ctx.createLinearGradient(0, GROUND - 8, 0, VH);
    floor.addColorStop(0, chainMode() ? '#3a1410' : '#2a1410');
    floor.addColorStop(1, '#100404');
    ctx.fillStyle = floor;
    ctx.fillRect(0, GROUND, VW, VH - GROUND);
    ctx.strokeStyle = rgba(HOT, 0.28);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND);
    ctx.lineTo(VW, GROUND);
    ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, 0.16);
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 18]);
    ctx.beginPath();
    ctx.moveTo(0, GROUND + 14);
    ctx.lineTo(VW, GROUND + 14);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(80, 32, 18, 0.35)';
    ctx.lineWidth = 1;
    let i;
    for (i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(0, GROUND + i * 10);
      ctx.lineTo(VW, GROUND + i * 10);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(GOLD, 0.07);
    for (i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.moveTo(40 + i * 80, GROUND);
      ctx.lineTo(16 + i * 92, VH);
      ctx.stroke();
    }
  }

  function drawEmbers() {
    let i, p;
    for (i = 0; i < embers.length; i++) {
      p = embers[i];
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.fillStyle = rgba(p.rgb, 0.75);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.s, p.s * 1.6, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function limbPose(f) {
    const k = f.atk && f.atk.kind;
    const t = f.atk ? f.atk.t : 0;
    const m = f.atk && f.atk.def;
    const u = m ? clamp(t / m.dur, 0, 1) : 0;
    const walk = Math.sin(f.step) * (f.grounded && !busy(f) && Math.abs(f.vx) > 8 ? 1 : 0);
    if (f.ko && f.grounded) return { L: 1.1, R: 1.2, LL: 0.4, RL: 0.5, kick: 0 };
    if (f.hurtT > 0) return { L: -0.5, R: 0.6, LL: 0.15, RL: -0.1, kick: 0 };
    if (k === 'punch' || k === 'lpunch' || k === 'apunch') {
      return { L: -0.35, R: lerp(-0.2, 1.45, clamp(u / 0.42, 0, 1)), LL: 0.08, RL: -0.06, kick: 0 };
    }
    if (k === 'punch2') {
      return { L: lerp(-0.2, 1.4, clamp(u / 0.4, 0, 1)), R: -0.45, LL: 0.1, RL: -0.08, kick: 0 };
    }
    if (k === 'punch3') {
      return { L: lerp(-0.3, 1.2, u), R: lerp(-0.4, -1.4, u), LL: -0.1, RL: 0.2, kick: 0 };
    }
    if (k === 'kick' || k === 'akick') {
      return { L: 0.4, R: -0.5, LL: -0.15, RL: lerp(0.1, 1.35, clamp(u / 0.4, 0, 1)), kick: 1 };
    }
    if (k === 'sweep') {
      return { L: 0.2, R: 0.3, LL: 0.4, RL: lerp(0.2, 1.15, clamp(u / 0.4, 0, 1)), kick: 1 };
    }
    if (k === 'wave' || k === 'super') {
      return { L: lerp(0.2, 1.1, u), R: lerp(0.2, 1.15, u), LL: 0.15, RL: 0.15, kick: 0 };
    }
    if (k === 'burn') {
      return { L: 1.2, R: 1.35, LL: 0.2, RL: 0.25, kick: 0 };
    }
    if (f.win) return { L: -1.4, R: 0.4, LL: 0, RL: 0, kick: 0 };
    if (f.crouch) return { L: 0.35, R: 0.4, LL: 0.45, RL: 0.5, kick: 0 };
    if (f.swayT > 0) return { L: 0.8, R: -0.6, LL: 0.3, RL: -0.2, kick: 0 };
    return { L: 0.18 + walk * 0.2, R: -0.18 - walk * 0.2, LL: walk * 0.18, RL: -walk * 0.18, kick: 0 };
  }

  function drawFighter(f) {
    const spec = f.spec;
    const s = spec.size || 1;
    const sc = planeScale(f);
    const crouch = f.crouch && f.grounded && !f.atk;
    const koDown = f.ko && f.grounded;
    const dim = 1 - planeVis(f) * 0.28;
    ctx.save();
    ctx.translate(f.x, f.y + planeOff(f));
    ctx.scale(f.face * sc, sc);
    ctx.scale(s, s);
    ctx.globalAlpha = dim;

    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.beginPath();
    ctx.ellipse(0, 3, koDown ? 28 : 15, 4.5, 0, 0, TAU);
    ctx.fill();

    if (koDown) {
      ctx.rotate(1.42);
      ctx.translate(0, -10);
    } else if (f.hurtT > 0) {
      ctx.rotate(-0.16);
    } else if (!f.grounded) {
      ctx.rotate(f.vy < 0 ? -0.12 : 0.16);
    } else if (f.swayT > 0) {
      ctx.rotate((f.plane - f.swayFrom) * 0.18);
    }

    const pose = limbPose(f);
    const hip = crouch ? -15 : -22;

    ctx.save();
    ctx.translate(-4, hip + 18);
    ctx.rotate(pose.LL);
    ctx.fillStyle = rgba(spec.pants, 1);
    ctx.fillRect(-3.5, 0, 7, 16 + (crouch ? -5 : 0));
    ctx.fillStyle = rgba(spec.shoes, 1);
    ctx.fillRect(-4, 14 + (crouch ? -5 : 0), 9, 6);
    ctx.restore();
    ctx.save();
    ctx.translate(5, hip + 18);
    ctx.rotate(pose.RL);
    ctx.fillStyle = rgba(spec.pants, 0.92);
    ctx.fillRect(-3.5, 0, 7, pose.kick ? 18 : (16 + (crouch ? -5 : 0)));
    ctx.fillStyle = rgba(spec.shoes, 1);
    ctx.fillRect(-4, pose.kick ? 16 : (14 + (crouch ? -5 : 0)), 10, 6);
    ctx.restore();

    ctx.fillStyle = rgba(spec.pants, 1);
    ctx.beginPath();
    ctx.moveTo(-10, hip - 1);
    ctx.lineTo(10, hip - 1);
    ctx.lineTo(8, hip + 16);
    ctx.lineTo(-8, hip + 16);
    ctx.fill();
    if (spec.band) {
      ctx.fillStyle = rgba(spec.accent, 0.9);
      ctx.fillRect(-8, hip + 6, 16, 3);
    }

    const torsoY = hip - 20;
    ctx.fillStyle = rgba(spec.top, 1);
    ctx.beginPath();
    ctx.moveTo(-12, torsoY + 4);
    ctx.lineTo(12, torsoY + 4);
    ctx.lineTo(10, hip + 2);
    ctx.lineTo(-10, hip + 2);
    ctx.fill();
    if (spec.suit) {
      ctx.fillStyle = rgba(spec.cap, 1);
      ctx.fillRect(-8, torsoY + 10, 16, 8);
      ctx.fillStyle = rgba(WHT, 0.35);
      ctx.fillRect(-1.5, torsoY + 5, 3, hip - torsoY - 4);
    }

    ctx.save();
    ctx.translate(-10, torsoY + 9);
    ctx.rotate(pose.L);
    ctx.fillStyle = rgba(spec.top, 1);
    ctx.fillRect(-3, 0, 6, 14);
    ctx.fillStyle = rgba(spec.skin, 1);
    ctx.fillRect(-2.5, 13, 5.5, 5);
    ctx.restore();
    ctx.save();
    ctx.translate(10, torsoY + 9);
    ctx.rotate(pose.R);
    ctx.fillStyle = rgba(spec.top, 1);
    ctx.fillRect(-3, 0, 6, 14);
    ctx.fillStyle = rgba(spec.skin, 1);
    ctx.fillRect(-2.5, 13, 5.5, 5);
    if (f.atk && (f.atk.kind === 'punch' || f.atk.kind === 'punch2' || f.atk.kind === 'burn' || f.atk.kind === 'punch3')) {
      ctx.fillStyle = rgba(spec.glow, 0.55);
      ctx.beginPath();
      ctx.arc(0, 17, 5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    const headY = torsoY - 1;
    ctx.fillStyle = rgba(spec.skin, 1);
    ctx.beginPath();
    ctx.arc(0, headY, 8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(spec.hair, 1);
    ctx.beginPath();
    ctx.arc(0, headY - 1.2, 8.2, Math.PI, TAU);
    ctx.fill();
    if (spec.capOn) {
      ctx.fillStyle = rgba(spec.cap, 1);
      ctx.beginPath();
      ctx.ellipse(0, headY - 4.2, 8.6, 4.2, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(-9, headY - 5, 18, 3);
      ctx.fillRect(4, headY - 3, 10, 2.4);
      ctx.fillStyle = rgba(spec.accent, 0.9);
      ctx.fillRect(-4, headY - 6, 8, 1.6);
    } else if (spec.band) {
      ctx.fillStyle = rgba(spec.cap, 1);
      ctx.fillRect(-8, headY - 3, 16, 3);
    } else if (spec.suit) {
      ctx.fillStyle = rgba(spec.hair, 1);
      ctx.beginPath();
      ctx.ellipse(0, headY - 5, 7.5, 3.5, 0, 0, TAU);
      ctx.fill();
    }

    if (f.flashT > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, clamp(f.flashT * 6, 0, 0.55));
      ctx.fillRect(-16, torsoY - 14, 32, 56);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawWave(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.face, 1);
    ctx.fillStyle = rgba(p.rgb, 0.22);
    ctx.beginPath();
    ctx.ellipse(0, 6, p.r + 10, 7, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(p.rgb, 0.95);
    ctx.lineWidth = p.supered ? 4.4 : 3.2;
    ctx.beginPath();
    ctx.moveTo(-p.r, 4);
    ctx.quadraticCurveTo(0, -p.r * 0.9, p.r + 6, 2);
    ctx.stroke();
    ctx.strokeStyle = rgba(WHT, 0.7);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-p.r * 0.5, 3);
    ctx.quadraticCurveTo(4, -p.r * 0.5, p.r, 2);
    ctx.stroke();
    if (p.supered) {
      ctx.strokeStyle = rgba(GOLD, 0.5);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, p.r + 8, -0.4, 0.6);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFx() {
    let i, p;
    for (i = 0; i < trails.length; i++) {
      p = trails[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.t * 4, 0, 0.45));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (p.t / 0.22), 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < slashes.length; i++) {
      p = slashes[i];
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(p.face, 1);
      ctx.strokeStyle = rgba(p.rgb, clamp(p.t * 6, 0, 0.9));
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, p.r * (1.15 - p.t), -1.1, 0.8);
      ctx.stroke();
      ctx.restore();
    }
    for (i = 0; i < G.waves.length; i++) drawWave(G.waves[i]);
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.t / (p.max || 0.5), 0, 1));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < sparks.length; i++) {
      p = sparks[i];
      ctx.strokeStyle = rgba(p.rgb, clamp(p.t * 5, 0, 1));
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
      ctx.stroke();
    }
    for (i = 0; i < rings.length; i++) {
      p = rings[i];
      ctx.strokeStyle = rgba(p.rgb, clamp(p.t * 2.4, 0, 0.8));
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.stroke();
    }
    ctx.font = '700 12px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    for (i = 0; i < floats.length; i++) {
      p = floats[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.t / p.life, 0, 1));
      ctx.fillText(p.text, p.x, p.y);
    }
  }

  function drawCall() {
    if (G.callT <= 0 || !G.call) return;
    const a = G.callT > 0.2 ? 1 : G.callT / 0.2;
    ctx.save();
    ctx.font = '900 42px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rgba(GOLD, a);
    ctx.shadowColor = rgba(HOT, 0.6 * a);
    ctx.shadowBlur = 18;
    ctx.fillText(G.call, VW / 2, 92);
    ctx.restore();
  }

  function drawFighters() {
    if (!G.p1 || !G.p2) return;
    const a = G.p1;
    const b = G.p2;
    const da = planeVis(a);
    const db = planeVis(b);
    if (da > db || (da === db && a.y < b.y)) {
      drawFighter(a);
      drawFighter(b);
    } else {
      drawFighter(b);
      drawFighter(a);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#140804';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    let sx = 0;
    let sy = 0;
    if (G.shake > 0) {
      sx = (Math.random() - 0.5) * 10 * G.shake;
      sy = (Math.random() - 0.5) * 8 * G.shake;
    }
    if (G.slam > 0) sy += 10 * G.slam;
    ctx.translate(ox + sx, oy + sy);
    ctx.scale(scale, scale);
    drawBg();
    drawEmbers();
    drawFighters();
    drawFx();
    drawCall();
    ctx.restore();
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, clamp(G.flash * 3.2, 0, 0.42));
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
  }

  /* ---- loop ---- */
  function frame(ts) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = 0;
      return;
    }
    if (!last) { last = ts; draw(); return; }
    let dt = (ts - last) / 1000;
    last = ts;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    if (acc > STEP * 5) acc = STEP * 2;
    while (acc >= STEP) {
      acc -= STEP;
      if (G.stop > 0) {
        G.stop -= STEP;
        tickFx(STEP);
      } else {
        tick(STEP);
        tickFx(STEP);
      }
    }
    if (G.hudDirty) syncHud();
    draw();
  }

  /* ---- input ---- */
  function bindPad(el, on, off) {
    if (!el) return;
    const down = function (ev) {
      ev.preventDefault();
      on();
      el.classList.add('held');
    };
    const up = function (ev) {
      ev.preventDefault();
      off();
      el.classList.remove('held');
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('pointercancel', up);
  }

  function setKey(k, v) {
    keys[k] = v;
  }

  function onKey(e, down) {
    const c = e.code || '';
    const k = e.key || '';
    let hit = true;
    if (c === 'ArrowLeft' || k === 'a' || k === 'A') setKey('l', down);
    else if (c === 'ArrowRight' || k === 'd' || k === 'D') setKey('r', down);
    else if (c === 'ArrowUp' || k === 'w' || k === 'W') {
      setKey('u', down);
      if (down && !e.repeat) jumpEdge.down = true;
    } else if (c === 'ArrowDown' || k === 's' || k === 'S') setKey('d', down);
    else if (k === ' ' || c === 'Space') {
      if (down && overlayOpen() && G.mode === 'title') {
        e.preventDefault();
        startMatch('duel');
        return;
      }
      setKey('punch', down);
      if (down && !e.repeat) punchEdge.down = true;
    } else if (k === 'j' || k === 'J') {
      setKey('punch', down);
      if (down && !e.repeat) punchEdge.down = true;
    } else if (k === 'Shift' || c === 'ShiftLeft' || c === 'ShiftRight' || k === 'z' || k === 'Z') {
      setKey('kick', down);
      if (down && !e.repeat) kickEdge.down = true;
    } else if (k === 'x' || k === 'X' || k === 'c' || k === 'C' || c === 'ControlLeft' || c === 'ControlRight') {
      setKey('sway', down);
      if (down && !e.repeat) swayEdge.down = true;
    } else if (down && (k === 'r' || k === 'R')) {
      e.preventDefault();
      retry();
      return;
    } else if (down && (k === 'm' || k === 'M')) {
      e.preventDefault();
      audio.setMuted(!audio.muted);
      return;
    } else if (down && overlayOpen() && G.mode === 'title' && (k === 'Enter' || k === '1')) {
      e.preventDefault();
      startMatch('duel');
      return;
    } else if (down && overlayOpen() && G.mode === 'title' && k === '2') {
      e.preventDefault();
      startMatch('chain');
      return;
    } else {
      hit = false;
    }
    if (hit) {
      e.preventDefault();
      audio.ensure();
    }
  }

  function retry() {
    audio.ensure();
    audio.ui();
    if (G.mode === 'title') startMatch('duel');
    else startMatch(G.kind || 'duel');
  }

  function goMenu() {
    audio.ui();
    showTitle();
  }

  bindPad(padBtns.l, function () { keys.l = true; }, function () { keys.l = false; });
  bindPad(padBtns.r, function () { keys.r = true; }, function () { keys.r = false; });
  bindPad(padBtns.u, function () { keys.u = true; jumpEdge.down = true; }, function () { keys.u = false; });
  bindPad(padBtns.d, function () { keys.d = true; }, function () { keys.d = false; });
  bindPad(padBtns.punch, function () { keys.punch = true; punchEdge.down = true; }, function () { keys.punch = false; });
  bindPad(padBtns.kick, function () { keys.kick = true; kickEdge.down = true; }, function () { keys.kick = false; });
  bindPad(padBtns.sway, function () { swayEdge.down = true; }, function () {});

  let ptrId = null;
  let ptrX = 0;
  let ptrY = 0;
  canvas.addEventListener('pointerdown', function (e) {
    audio.ensure();
    if (G.mode === 'title' && overlayOpen()) return;
    canvas.focus();
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    ptrId = e.pointerId;
    ptrX = e.clientX;
    ptrY = e.clientY;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });
  canvas.addEventListener('pointerup', function (e) {
    if (ptrId !== e.pointerId) return;
    const dx = e.clientX - ptrX;
    const dy = e.clientY - ptrY;
    ptrId = null;
    if (G.mode === 'title' && overlayOpen()) return;
    if (Math.abs(dy) > 28 && dy < -12 && Math.abs(dy) > Math.abs(dx)) {
      jumpEdge.down = true;
      keys.u = true;
      setTimeout(function () { keys.u = false; }, 80);
    } else if (Math.abs(dy) > 28 && dy > 12 && Math.abs(dy) > Math.abs(dx)) {
      swayEdge.down = true;
    } else if (Math.abs(dx) > 24) {
      if (dx < 0) { keys.l = true; setTimeout(function () { keys.l = false; }, 120); }
      else { keys.r = true; setTimeout(function () { keys.r = false; }, 120); }
    } else {
      punchEdge.down = true;
    }
  });
  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    audio.ensure();
  }, { passive: false });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = keys.punch = keys.kick = keys.sway = false;
    clearEdges();
  });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      last = 0;
      keys.l = keys.r = keys.u = keys.d = keys.punch = keys.kick = keys.sway = false;
      clearEdges();
    }
  });
  window.addEventListener('resize', resize);

  if (btnRetry) btnRetry.addEventListener('click', function () { retry(); });
  if (btnMute) btnMute.addEventListener('click', function () { audio.ensure(); audio.setMuted(!audio.muted); });
  if (btnDuel) btnDuel.addEventListener('click', function () { startMatch('duel'); });
  if (btnChain) btnChain.addEventListener('click', function () { startMatch('chain'); });
  if (ovRetry) ovRetry.addEventListener('click', function () { startMatch(G.kind); });
  if (ovModes) ovModes.addEventListener('click', goMenu);

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) { /* ignore */ }
  loadBest();
  resize();
  showTitle();
  requestAnimationFrame(frame);
})();
