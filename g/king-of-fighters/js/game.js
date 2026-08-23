'use strict';

/* 拳皇 — King of Fighters lite. No CDN. Distinct from 饿狼 / 末刃 / 侍魂 / 红侠 / 街霸. */

(function () {
  const VW = 720;
  const VH = 400;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const GROUND = 338;
  const WALK = 172;
  const BACK = 126;
  const JUMP_V = 490;
  const HOP_V = 360;
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
  const QI_COST = 35;
  const MAX_COST = 50;
  const SUPER_COST = 100;
  const MAX_DUR = 3.6;
  const HOP_HOLD = 0.09;
  const QI_Y = 44;
  const BEST_KEY = 'playbox-king-of-fighters-best';
  const MUTE_KEY = 'playbox-king-of-fighters-mute';
  const OPS = '方向 / WASD 走跳 · 空格拳 · Shift / Z 踢 · 拳+踢 MAX · R 重开 · M 静音';

  const MAG = [255, 61, 120];
  const CYN = [94, 232, 208];
  const GOLD = [255, 227, 107];
  const HOT = [255, 58, 26];
  const HOT2 = [255, 106, 50];
  const WHT = [255, 244, 232];
  const NEON = [255, 90, 40];
  const PURP = [196, 92, 255];
  const SKIN = [232, 184, 152];

  const MOVES = {
    punch: { dur: 0.24, hit0: 0.04, hit1: 0.12, dmg: 8, stun: 0.18, kb: 42, range: 44, h0: 22, h1: 48, stop: 0.038, height: 'mid', score: 70, name: '拳' },
    punch2: { dur: 0.28, hit0: 0.05, hit1: 0.14, dmg: 10, stun: 0.22, kb: 58, range: 48, h0: 18, h1: 52, stop: 0.048, height: 'mid', score: 110, name: '二拳' },
    punch3: { dur: 0.34, hit0: 0.07, hit1: 0.18, dmg: 13, stun: 0.38, kb: 110, range: 52, h0: 12, h1: 56, stop: 0.062, height: 'mid', score: 150, knockdown: true, name: '三拳' },
    kick: { dur: 0.32, hit0: 0.08, hit1: 0.18, dmg: 12, stun: 0.28, kb: 88, range: 56, h0: 16, h1: 46, stop: 0.054, height: 'mid', score: 95, name: '踢' },
    apunch: { dur: 0.28, hit0: 0.04, hit1: 0.2, dmg: 9, stun: 0.18, kb: 50, range: 42, h0: 8, h1: 44, stop: 0.044, height: 'high', score: 80, name: '跳拳' },
    akick: { dur: 0.3, hit0: 0.05, hit1: 0.22, dmg: 11, stun: 0.22, kb: 64, range: 50, h0: 4, h1: 40, stop: 0.05, height: 'high', score: 100, name: '跳踢' },
    lpunch: { dur: 0.22, hit0: 0.04, hit1: 0.12, dmg: 7, stun: 0.16, kb: 36, range: 38, h0: 8, h1: 28, stop: 0.034, height: 'mid', score: 60, name: '下拳' },
    rush: { dur: 0.4, hit0: 0.08, hit1: 0.26, dmg: 13, stun: 0.34, kb: 120, range: 50, h0: 10, h1: 40, stop: 0.056, height: 'mid', score: 120, knockdown: true, dash: true, inv: 0.14, name: '突进' },
    qi: { dur: 0.46, hit0: 0.12, hit1: 0.22, dmg: 14, stun: 0.28, kb: 72, range: 24, h0: 28, h1: 56, stop: 0.06, height: 'air', score: 180, proj: true, cost: 35, name: '气功' },
    super: { dur: 0.72, hit0: 0.1, hit1: 0.6, dmg: 11, stun: 0.22, kb: 70, range: 52, h0: 8, h1: 56, stop: 0.048, height: 'mid', score: 140, knockdown: true, multi: 3, cost: 100, name: '三连炎' }
  };

  const FIGHTERS = [
    {
      id: 'blaze', name: '炎王', en: 'BLAZE',
      hp: HP_DUEL, hpChain: HP_CHAIN, walk: WALK, back: BACK, jump: JUMP_V, size: 1,
      top: [196, 30, 28], pants: [18, 14, 16], shoes: [28, 18, 16],
      hair: [28, 16, 12], skin: SKIN, accent: GOLD, belt: GOLD,
      glow: HOT, gi: true,
      ai: { agg: 0.62, spec: 0.28, jump: 0.24, think: 0.22, max: 0.34, kick: 0.32, hop: 0.28 }
    },
    {
      id: 'fang', name: '紫牙', en: 'FANG',
      hp: HP_DUEL, hpChain: HP_CHAIN, walk: 166, back: 122, jump: 478, size: 1.04,
      top: [64, 24, 88], pants: [16, 10, 18], shoes: [22, 12, 24],
      hair: [48, 12, 64], skin: [236, 176, 148], accent: PURP, belt: PURP,
      glow: PURP, wild: true,
      ai: { agg: 0.68, spec: 0.36, jump: 0.2, think: 0.18, max: 0.4, kick: 0.3, hop: 0.22 }
    },
    {
      id: 'gale', name: '迅风', en: 'GALE',
      hp: HP_CHAIN, hpChain: HP_CHAIN, walk: 204, back: 150, jump: 518, size: 0.96,
      top: [40, 170, 170], pants: [236, 236, 228], shoes: [20, 90, 110],
      hair: [240, 236, 220], skin: [236, 186, 150], accent: CYN, belt: CYN,
      glow: CYN, band: true,
      ai: { agg: 0.82, spec: 0.3, jump: 0.38, think: 0.12, max: 0.48, kick: 0.5, hop: 0.4 }
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
  function chainMode() {
    return G.kind === 'chain';
  }
  function speedMul() {
    return chainMode() ? 1.28 : 1;
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
      dash: m.dash,
      multi: m.multi,
      inv: m.inv ? m.inv * t : 0,
      cost: m.cost,
      name: m.name
    };
  }

  function selfCheck() {
    if (WINS_NEED !== 2) throw new Error('2 wins');
    if (HP_DUEL !== 100) throw new Error('hp duel');
    if (HP_CHAIN !== 86) throw new Error('hp chain');
    if (ROUND_DUEL !== 99 || ROUND_CHAIN !== 70) throw new Error('timer');
    if (BEST_KEY !== 'playbox-king-of-fighters-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-king-of-fighters-mute') throw new Error('mute key');
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(2) !== 1) throw new Error('combo 2');
    if (comboMul(3) !== 2) throw new Error('combo 3');
    if (comboMul(9) !== 5) throw new Error('combo cap');
    const h = jumpHeight(JUMP_V, GRAV);
    if (h < 78 || h > 95) throw new Error('jump height ' + h);
    const hop = jumpHeight(HOP_V, GRAV);
    if (hop < 40 || hop > 55) throw new Error('hop height ' + hop);
    if (hop >= h) throw new Error('hop vs jump');
    if (FIGHTERS.length !== 3) throw new Error('3 fighters');
    if (FIGHTERS[0].id !== 'blaze' || FIGHTERS[1].id !== 'fang' || FIGHTERS[2].id !== 'gale') throw new Error('ids');
    if (MOVES.punch.dmg >= MOVES.punch2.dmg) throw new Error('p2 stronger');
    if (MOVES.kick.range <= MOVES.punch.range) throw new Error('kick reach');
    if (MOVES.qi.height !== 'air' || MOVES.qi.cost !== 35) throw new Error('qi air');
    if (!MOVES.rush.dash || MOVES.rush.height !== 'mid') throw new Error('rush');
    if (!MOVES.super.multi || MOVES.super.multi !== 3) throw new Error('super multi');
    if (QI_COST !== 35 || MAX_COST !== 50 || SUPER_COST !== 100) throw new Error('meter cost');
    if (MAX_DUR < 3 || MAX_DUR > 5) throw new Error('max dur');
    if (QI_Y < 36 || QI_Y > 52) throw new Error('qi height');
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
  const maxLabel = document.getElementById('max-label');
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
    max: document.getElementById('btn-max')
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

  const keys = { l: false, r: false, u: false, d: false, punch: false, kick: false, max: false };
  const punchEdge = { down: false };
  const kickEdge = { down: false };
  const maxEdge = { down: false };
  const jumpEdge = { down: false };
  const dashTap = { l: -9, r: -9 };

  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const trails = [];
  const embers = [];
  const slashes = [];
  const crowd = [];

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
    orbs: [],
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
    qi: function () {
      this.ensure();
      this.noise(0.16, 0.12, 480, 'bandpass');
      this.beep(420, 0.18, 'sine', 0.06, 180);
      this.beep(880, 0.12, 'triangle', 0.04, 440);
    },
    super: function () {
      this.ensure();
      this.noise(0.22, 0.2, 140, 'lowpass');
      this.beep(110, 0.28, 'sawtooth', 0.08, 55);
      this.beep(330, 0.2, 'square', 0.06, 880);
      this.beep(660, 0.16, 'triangle', 0.05, 1320);
    },
    maxOn: function () {
      this.ensure();
      this.beep(220, 0.1, 'sawtooth', 0.05, 440);
      this.beep(440, 0.12, 'square', 0.05, 880);
      this.beep(880, 0.16, 'triangle', 0.04, 1760);
    },
    rush: function () {
      this.ensure();
      this.noise(0.12, 0.1, 700, 'highpass');
      this.beep(210, 0.12, 'sawtooth', 0.045, 90);
    },
    hop: function () {
      this.ensure();
      this.beep(520, 0.05, 'square', 0.028, 280);
    },
    jump: function () {
      this.ensure();
      this.beep(390, 0.07, 'square', 0.03, 190);
    },
    land: function () {
      this.ensure();
      this.noise(0.05, 0.05, 280, 'lowpass');
    },
    duck: function () {
      this.ensure();
      this.beep(640, 0.06, 'triangle', 0.035, 980);
      this.noise(0.06, 0.05, 1400, 'highpass');
    },
    whiff: function () {
      this.ensure();
      this.noise(0.06, 0.05, 1800, 'highpass');
      this.beep(240, 0.05, 'square', 0.02, 120);
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
    stageEl.classList.remove('hit', 'boom', 'die', 'thump', 'spec', 'win-flash', 'clash', 'max');
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
    const dense = chainMode() ? 1.8 : 1;
    if (REDUCE) return;
    if (embers.length > (chainMode() ? 56 : 32)) return;
    embers.push({
      x: rand(-20, VW + 20),
      y: rand(-30, 80),
      vx: rand(-18, 18) * dense,
      vy: rand(28, 64) * dense,
      a: rand(0, TAU),
      va: rand(-4, 4),
      s: rand(1.2, 3),
      rgb: Math.random() < 0.4 ? GOLD : (Math.random() < 0.5 ? HOT2 : PURP),
      t: rand(3.2, 7)
    });
  }
  function seedEmbers() {
    embers.length = 0;
    let i;
    const n = REDUCE ? 6 : (chainMode() ? 26 : 16);
    for (i = 0; i < n; i++) {
      spawnEmber();
      embers[embers.length - 1].y = rand(20, GROUND - 40);
    }
  }
  function seedCrowd() {
    crowd.length = 0;
    let i;
    for (i = 0; i < 28; i++) {
      crowd.push({
        x: 18 + (i % 14) * 50 + rand(-8, 8),
        y: 86 + Math.floor(i / 14) * 22 + rand(-4, 4),
        s: rand(0.8, 1.2),
        rgb: i % 3 === 0 ? HOT : (i % 3 === 1 ? PURP : GOLD),
        ph: rand(0, TAU)
      });
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
    if (!REDUCE && Math.random() < (chainMode() ? 0.28 : 0.14)) spawnEmber();
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
      hopping: false,
      hopHold: 0,
      jumpLock: false,
      maxT: 0,
      dashT: 0,
      keys: { l: false, r: false, u: false, d: false, punch: false, kick: false, max: false }
    };
  }

  function foeOf(f) {
    return f === G.p1 ? G.p2 : G.p1;
  }
  function busy(f) {
    return !!(f.atk || f.hurtT > 0 || f.ko || f.win || f.dashT > 0.12);
  }
  function canAct(f) {
    return !f.ko && !f.win && f.hurtT <= 0;
  }
  function isMax(f) {
    return f.maxT > 0;
  }
  function canCancel(f, into) {
    if (!f.atk || !f.atk.hit) return false;
    const k = f.atk.kind;
    if (into === 'punch2') return k === 'punch';
    if (into === 'punch3') return k === 'punch2' && chainMode();
    if (into === 'kick') return k === 'punch' || k === 'punch2';
    if (into === 'qi' || into === 'super' || into === 'rush') {
      if (isMax(f)) return k === 'punch' || k === 'punch2' || k === 'punch3' || k === 'kick' || k === 'rush';
      return k === 'punch' || k === 'punch2' || k === 'punch3' || k === 'kick';
    }
    return false;
  }
  function bodyBox(f) {
    const crouch = f.crouch && f.grounded && !f.atk;
    const h = f.ko && f.grounded ? 16 : crouch ? 24 : 54 * (f.spec.size || 1);
    const w = 20 * (f.spec.size || 1);
    return { x: f.x - w / 2, y: f.y - h, w: w, h: h };
  }
  function atkBox(f) {
    if (!f.atk) return null;
    const m = f.atk.def;
    if (m.proj) return null;
    if (f.atk.t < m.hit0 || f.atk.t > m.hit1) return null;
    const face = f.face;
    const x0 = f.x + face * 10;
    const x1 = f.x + face * (10 + m.range);
    const x = Math.min(x0, x1);
    const w = Math.abs(x1 - x0);
    const y0 = f.y - m.h1;
    const h = Math.max(6, m.h1 - m.h0);
    return { x: x, y: y0, w: w, h: h };
  }
  function canHitHeight(move, vic) {
    if (move.height === 'high' && vic.crouch && vic.grounded && !vic.atk) return false;
    if (move.height === 'low' && !vic.grounded) return false;
    if (move.height === 'air') {
      if (vic.crouch && vic.grounded && !vic.atk) return false;
      if (!vic.grounded && (GROUND - vic.y) > 70) return false;
    }
    return true;
  }

  function addMeter(f, n) {
    if (isMax(f)) return;
    const gain = n * (chainMode() ? 1.28 : 1);
    f.meter = clamp(f.meter + gain, 0, METER_MAX);
    G.hudDirty = true;
  }

  function enterMax(f) {
    if (!canAct(f) && !(f.atk && f.atk.hit)) return false;
    if (isMax(f)) return false;
    if (f.meter < MAX_COST) {
      if (f === G.p1 && G.mode === 'play') {
        audio.empty();
        toast('气不足', 'warn');
      }
      return false;
    }
    if (!f.grounded) return false;
    f.meter -= MAX_COST;
    f.maxT = MAX_DUR;
    f.atk = null;
    flash(GOLD, 0.2);
    kickStage('max');
    audio.maxOn();
    burst(f.x, f.y - 28, GOLD, 22, 240);
    ringAt(f.x, f.y - 24, GOLD);
    callout('MAX', 0.7);
    if (G.mode === 'play' && f === G.p1) toast('MAX！', 'gold');
    G.hudDirty = true;
    return true;
  }

  function startAtk(f, kind) {
    if (!canAct(f)) return false;
    if (f.atk && !canCancel(f, kind)) return false;
    if (kind === 'punch3' && !chainMode()) return false;
    const def = moveOf(kind);
    if (!def) return false;
    if (def.cost) {
      const freeSuper = kind === 'super' && isMax(f);
      if (!freeSuper && f.meter < def.cost) {
        if (f === G.p1 && G.mode === 'play') {
          audio.empty();
          toast('气不足', 'warn');
        }
        return false;
      }
      if (!freeSuper) f.meter -= def.cost;
      if (kind === 'super' && isMax(f)) f.maxT = 0;
      G.hudDirty = true;
    }
    f.atk = { kind: kind, t: 0, spent: false, def: def, hit: false, fired: false, missed: false, slot: -1 };
    f.crouch = kind === 'lpunch';
    if (def.inv) f.invuln = Math.max(f.invuln, def.inv);
    if (kind === 'qi') {
      flash(f.spec.glow, 0.14);
      kickStage('spec');
      audio.qi();
      burst(f.x + f.face * 16, f.y - QI_Y, f.spec.glow, 12, 170);
      ringAt(f.x, f.y - QI_Y, f.spec.glow);
      if (G.mode === 'play' && f === G.p1) toast('气功！', 'gold');
    } else if (kind === 'super') {
      flash(GOLD, 0.24);
      kickStage('spec');
      audio.super();
      burst(f.x, f.y - 28, GOLD, 24, 260);
      ringAt(f.x, f.y - 20, GOLD);
      hitStop(REDUCE ? 0 : 0.07);
      callout('三连炎', 0.7);
      if (G.mode === 'play' && f === G.p1) toast('三连炎！', 'gold');
    } else if (kind === 'rush') {
      audio.rush();
      burst(f.x - f.face * 10, f.y - 18, f.spec.glow, 8, 140);
    } else {
      audio.swing(kind === 'kick' || kind === 'akick' || kind === 'punch3');
    }
    return true;
  }

  function tryPunch(f) {
    if (!canAct(f) && !(f.atk && (canCancel(f, 'punch2') || canCancel(f, 'punch3') || canCancel(f, 'qi') || canCancel(f, 'super')))) return false;
    if (!f.grounded) {
      if (f.airAtk) return false;
      if (startAtk(f, 'apunch')) {
        f.airAtk = true;
        return true;
      }
      return false;
    }
    if (f.crouch || f.keys.d) {
      if (isMax(f)) return startAtk(f, 'super');
      if (f.meter >= SUPER_COST) return startAtk(f, 'super');
      if (f.meter >= QI_COST) return startAtk(f, 'qi');
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
    if (f.crouch || f.keys.d) return startAtk(f, 'rush');
    return startAtk(f, 'kick');
  }

  function spawnOrb(f) {
    G.orbs.push({
      owner: f,
      x: f.x + f.face * 28,
      y: f.y - QI_Y,
      vx: f.face * 292 * speedMul(),
      life: 1.05,
      dmg: 14,
      score: 180,
      rgb: f.spec.glow,
      face: f.face,
      r: 12,
      ducked: false
    });
  }

  function applyHit(att, vic, move, isProj, hx, hy) {
    if (vic.ko || vic.win) return false;
    if (vic.invuln > 0) return false;
    const heavy = move.dmg >= 13 || isProj || move.knockdown || move.dash || move.multi;
    vic.hp -= move.dmg;
    vic.hurtT = move.stun;
    vic.atk = null;
    vic.crouch = false;
    vic.flashT = 0.1;
    vic.vx = att.face * move.kb;
    vic.maxT = 0;
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
    slashArc(hx, hy, -1, PURP, 38);
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
    const sm = speedMul() * (isMax(f) ? 1.14 : 1);
    if (f.flashT > 0) f.flashT -= dt;
    if (f.invuln > 0) f.invuln -= dt;
    if (f.dashT > 0) f.dashT -= dt;
    if (f.maxT > 0) {
      f.maxT -= dt;
      G.hudDirty = true;
      if (f.maxT <= 0) f.maxT = 0;
      else if (!REDUCE && (G.clock * 60 | 0) % 4 === 0) {
        trailAt(f.x + rand(-6, 6), f.y - rand(10, 48), GOLD, 6);
      }
    }

    if (f.hurtT > 0) {
      f.hurtT -= dt;
      f.atk = null;
      f.hopping = false;
    }

    if (f.win && f.grounded) {
      f.vx = 0;
      f.step += dt;
      return;
    }

    if (f.ko) {
      f.atk = null;
      f.maxT = 0;
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
      if (f.hopping) {
        if (f.keys.u) {
          f.hopHold += dt;
          if (f.hopHold >= HOP_HOLD) {
            f.vy = Math.min(f.vy, -(spec.jump || JUMP_V));
            f.hopping = false;
            audio.jump();
          }
        } else {
          f.hopping = false;
        }
      }
      if (live && canAct(f) && !f.atk) {
        if (f.keys.l) f.vx -= 52 * dt;
        if (f.keys.r) f.vx += 52 * dt;
        f.vx = clamp(f.vx, -200, 200);
      }
    } else {
      f.airT = 0;
      f.jdir = 0;
      f.airAtk = false;
      f.hopping = false;
    }

    const acting = busy(f);
    if (f.grounded && !acting && live) {
      const toward = fo.x >= f.x ? 1 : -1;
      f.face = toward;
      f.crouch = !!f.keys.d && !f.keys.u;
      if (f.crouch) {
        f.vx = 0;
      } else if (f.dashT > 0) {
        f.vx = f.face * 340 * sm;
        f.step += dt * 16;
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
      if (f.keys.u && !f.crouch && !f.jumpLock) {
        f.grounded = false;
        f.vy = -HOP_V;
        f.hopping = true;
        f.hopHold = 0;
        f.jumpLock = true;
        f.jdir = 0;
        if (f.keys.l && !f.keys.r) f.jdir = -1;
        else if (f.keys.r && !f.keys.l) f.jdir = 1;
        f.vx = f.jdir * spec.walk * sm * 0.85;
        f.airT = 0.001;
        f.airAtk = false;
        audio.hop();
      }
    } else if (f.grounded && f.atk) {
      if (f.atk.def.dash && f.atk.t >= f.atk.def.hit0 && f.atk.t <= f.atk.def.hit1) {
        f.vx = f.face * 380 * sm;
      } else {
        f.vx *= 0.5;
      }
    }
    if (!f.keys.u) f.jumpLock = false;

    if (live && (canAct(f) || (f.atk && f.atk.hit))) {
      const pu = f.keys._punch;
      const ki = f.keys._kick;
      const mx = f.keys._max;
      f.keys._punch = false;
      f.keys._kick = false;
      f.keys._max = false;
      if (mx) enterMax(f);
      else if (pu && ki) {
        if (f.meter >= MAX_COST && !isMax(f)) enterMax(f);
        else tryKick(f);
      } else if (ki) tryKick(f);
      else if (pu) tryPunch(f);
    }

    if (f.atk) {
      f.atk.t += dt;
      const k = f.atk.kind;
      const m = f.atk.def;
      if (k === 'qi' && !f.atk.fired && f.atk.t >= m.hit0) {
        f.atk.fired = true;
        spawnOrb(f);
        burst(f.x + f.face * 26, f.y - QI_Y, f.spec.glow, 10, 140);
      }
      if (m.multi && f.atk.t >= m.hit0 && f.atk.t <= m.hit1) {
        const span = (m.hit1 - m.hit0) / m.multi;
        const slot = Math.min(m.multi - 1, Math.floor((f.atk.t - m.hit0) / span));
        if (slot !== f.atk.slot) {
          f.atk.slot = slot;
          f.atk.spent = false;
          burst(f.x + f.face * 22, f.y - 30, GOLD, 8, 160);
        }
      }
      if (f.atk.t >= m.hit0 && f.atk.t <= m.hit1 && !m.proj && (G.clock * 60 | 0) % 2 === 0) {
        slashArc(f.x + f.face * (16 + m.range * 0.4), f.y - (m.h0 + m.h1) * 0.5, f.face, f.spec.glow, 22);
      }
      if (k === 'rush' && (G.clock * 60 | 0) % 2 === 0) {
        trailAt(f.x - f.face * 8, f.y - 22, f.spec.glow, 9);
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
      f.hopping = false;
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
    if (p1hit && !canHitHeight(G.p1.atk.def, G.p2)) {
      if (!G.p1.atk.missed) {
        G.p1.atk.missed = true;
        audio.whiff();
        floatTxt('空', G.p2.x, G.p2.y - 64, CYN);
      }
      p1hit = false;
    }
    if (p2hit && !canHitHeight(G.p2.atk.def, G.p1)) {
      if (!G.p2.atk.missed) {
        G.p2.atk.missed = true;
        audio.whiff();
        floatTxt('空', G.p1.x, G.p1.y - 64, NEON);
      }
      p2hit = false;
    }
    const blades = !!(a && b && aabb(a, b) && G.p1.atk && G.p2.atk && !G.p1.atk.spent && !G.p2.atk.spent);
    const bothMid = G.p1.atk && G.p2.atk && G.p1.atk.def.height !== 'air' && G.p2.atk.def.height !== 'air';
    if ((p1hit && p2hit) || (blades && bothMid)) {
      const hx = (G.p1.x + G.p2.x) / 2;
      const hy = GROUND - 36;
      doClash(hx, hy);
      return;
    }
    if (p1hit) {
      G.p1.atk.spent = true;
      G.p1.atk.hit = true;
      applyHit(G.p1, G.p2, G.p1.atk.def, false, G.p2.x - G.p2.face * 8, G.p2.y - 36);
    }
    if (p2hit) {
      G.p2.atk.spent = true;
      G.p2.atk.hit = true;
      applyHit(G.p2, G.p1, G.p2.atk.def, false, G.p1.x - G.p1.face * 8, G.p1.y - 36);
    }
  }

  function tickOrbs(dt) {
    let i, j, p, q;
    for (i = G.orbs.length - 1; i >= 0; i--) {
      p = G.orbs[i];
      p.life -= dt;
      p.x += p.vx * dt;
      trailAt(p.x, p.y, p.rgb, p.r * 0.7);
      if (p.life <= 0 || p.x < -36 || p.x > VW + 36) {
        G.orbs.splice(i, 1);
        continue;
      }
      const box = { x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 };
      const vic = p.owner === G.p1 ? G.p2 : G.p1;
      const foAtk = atkBox(vic);
      if (foAtk && aabb(box, foAtk) && vic.atk && (vic.atk.kind === 'rush' || vic.invuln > 0)) {
        burst(p.x, p.y, GOLD, 10, 150);
        ringAt(p.x, p.y, GOLD);
        audio.clash();
        G.orbs.splice(i, 1);
        continue;
      }
      if (aabb(box, bodyBox(vic))) {
        if (!canHitHeight({ height: 'air' }, vic)) {
          if (!p.ducked) {
            p.ducked = true;
            audio.duck();
            floatTxt('蹲过！', vic.x, vic.y - 70, CYN);
            if (G.mode === 'play' && vic === G.p1) addScore(80, vic.x, vic.y - 86, CYN);
            ringAt(p.x, p.y, CYN);
          }
        } else {
          const def = {
            dmg: p.dmg, stun: 0.3, kb: 90,
            height: 'air', score: p.score, stop: 0.06, knockdown: true
          };
          applyHit(p.owner, vic, def, true, p.x, p.y);
          burst(p.x, p.y, p.rgb, 14, 180);
          G.orbs.splice(i, 1);
        }
      }
    }
    for (i = G.orbs.length - 1; i >= 0; i--) {
      p = G.orbs[i];
      for (j = i - 1; j >= 0; j--) {
        q = G.orbs[j];
        if (p.owner === q.owner) continue;
        if (hypot(p.x - q.x, p.y - q.y) < p.r + q.r + 4) {
          burst((p.x + q.x) / 2, (p.y + q.y) / 2, WHT, 16, 200);
          ringAt((p.x + q.x) / 2, (p.y + q.y) / 2, GOLD);
          audio.clash();
          G.orbs.splice(i, 1);
          G.orbs.splice(j, 1);
          i--;
          break;
        }
      }
    }
  }

  /* ---- CPU ---- */
  function incomingOrb(f) {
    let i;
    for (i = 0; i < G.orbs.length; i++) {
      const w = G.orbs[i];
      if (w.owner === f) continue;
      const closing = (w.vx > 0 && w.x < f.x) || (w.vx < 0 && w.x > f.x);
      if (closing && Math.abs(w.x - f.x) < 150) return w;
    }
    return null;
  }

  function incomingMelee(f) {
    const p = foeOf(f);
    const dist = Math.abs(p.x - f.x);
    return !!(p.atk && !p.atk.spent && dist < 86 && p.atk.t < p.atk.def.hit1);
  }

  function cpuThink(f, dt) {
    const p = foeOf(f);
    const ai = f.spec.ai;
    const dist = Math.abs(p.x - f.x);
    const k = f.keys;
    k.l = k.r = k.u = k.d = false;
    k._punch = false;
    k._kick = false;
    k._max = false;

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
      } else if (plan.type === 'hop') {
        k.u = true;
        if (!plan.held) {
          plan.held = true;
          plan.t = Math.min(plan.t, 0.06);
        }
      } else if (plan.type === 'punch') {
        if (!plan.did) { k._punch = true; plan.did = true; }
      } else if (plan.type === 'kick') {
        if (!plan.did) { k._kick = true; plan.did = true; }
      } else if (plan.type === 'rush') {
        k.d = true;
        if (!plan.did) { k._kick = true; plan.did = true; }
      } else if (plan.type === 'qi') {
        k.d = true;
        if (!plan.did) { k._punch = true; plan.did = true; }
      } else if (plan.type === 'max') {
        if (!plan.did) { k._max = true; plan.did = true; }
      } else if (plan.type === 'duck') {
        k.d = true;
      } else if (plan.type === 'back') {
        if (f.face > 0) k.l = true;
        else k.r = true;
      }
      if (f.atk && f.atk.hit && (f.atk.kind === 'punch' || (chainMode() && f.atk.kind === 'punch2'))) {
        k._punch = true;
      }
      if (f.atk && f.atk.hit && isMax(f) && f.meter >= QI_COST && Math.random() < 0.4) {
        k.d = true;
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
    const orb = incomingOrb(f);
    const melee = incomingMelee(f);

    if (orb && Math.abs(orb.x - f.x) < 130) {
      if (r < 0.62) f.plan = { type: 'duck', t: 0.38 };
      else f.plan = { type: 'jump', dir: -f.face, t: 0.28 };
    } else if (melee && r < 0.45) {
      f.plan = { type: r < 0.22 ? 'hop' : 'back', t: 0.18 };
    } else if (!isMax(f) && f.meter >= MAX_COST && r < ai.max) {
      f.plan = { type: 'max', t: 0.2 };
    } else if (p.airT > 0.06 && dist < 110 && p.y < f.y - 20 && f.grounded) {
      f.plan = { type: r < 0.5 ? 'punch' : 'kick', t: 0.22 };
    } else if (dist > 210) {
      if (r < ai.spec && (f.meter >= QI_COST || isMax(f))) f.plan = { type: 'qi', t: 0.4 };
      else f.plan = { type: 'walk', dir: f.face, t: 0.42 };
    } else if (dist > 92) {
      if (r < ai.spec * 0.6 && (f.meter >= QI_COST || isMax(f))) f.plan = { type: 'qi', t: 0.36 };
      else if (r < ai.spec * 0.6 + ai.jump) f.plan = { type: 'jumpin', t: 0.5 };
      else if (r < 0.8) f.plan = { type: 'walk', dir: f.face, t: 0.28 };
      else if (r < 0.9) f.plan = { type: 'hop', t: 0.16 };
      else f.plan = { type: 'back', t: 0.2 };
    } else {
      if (r < ai.agg * 0.34) f.plan = { type: 'punch', t: 0.2 };
      else if (r < ai.agg * 0.34 + ai.kick * 0.45) f.plan = { type: 'kick', t: 0.22 };
      else if (r < ai.agg * 0.72) f.plan = { type: 'rush', t: 0.28 };
      else if (r < ai.agg && (f.meter >= QI_COST || isMax(f))) f.plan = { type: 'qi', t: 0.3 };
      else if (r < ai.agg + 0.12) f.plan = { type: 'jumpin', t: 0.4 };
      else if (r < ai.agg + 0.22) f.plan = { type: 'hop', t: 0.16 };
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
    f.keys.max = keys.max;
    if (punchEdge.down) { f.keys._punch = true; punchEdge.down = false; }
    if (kickEdge.down) { f.keys._kick = true; kickEdge.down = false; }
    if (maxEdge.down) { f.keys._max = true; maxEdge.down = false; }
    if (jumpEdge.down) { f.keys.u = true; jumpEdge.down = false; }
  }

  function clearEdges() {
    punchEdge.down = kickEdge.down = maxEdge.down = jumpEdge.down = false;
  }

  function tryDash(dir) {
    if (!inputOk() || !G.p1) return;
    const f = G.p1;
    if (!f.grounded || busy(f) || f.hurtT > 0) return;
    f.dashT = 0.2;
    f.face = dir > 0 ? (foeOf(f).x >= f.x ? 1 : -1) : f.face;
    f.vx = dir * 340;
    audio.rush();
    trailAt(f.x, f.y - 20, f.spec.glow, 8);
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
    G.orbs.length = 0;
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
    toast((chainMode() ? '连打' : '拳皇') + ' · ' + foeSpec().name);
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
    G.orbs.length = 0;
    G.call = '';
    seedEmbers();
    overlay.classList.remove('hidden', 'end');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.remove('win', 'lose');
    ovKicker.textContent = 'KOF';
    ovTitle.textContent = '拳皇';
    ovLead.innerHTML = '擂台拳踢。空格拳，轻点上为小跳，Shift 踢。下加拳放气功弹，拳加踢开 MAX。先赢两局。';
    ovOps.textContent = OPS;
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    G.hudDirty = true;
    if (hintEl) {
      hintEl.textContent = '空格拳 · Shift 踢 · 下+拳气功 · 拳+踢 MAX · 气满超炎 · 先赢两局';
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
    ovKicker.textContent = win ? 'KOF' : 'KO';
    ovTitle.textContent = win ? (chainMode() ? '连尽' : '皇胜') : '皇败';
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
    toast((pWin ? '炎王' : G.p2.spec.name) + ' 拿下第 ' + G.round + ' 局', pWin ? 'gold' : 'warn');
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
      G.orbs.length = 0;
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
      tickOrbs(dt);
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
      tickOrbs(dt);
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
        G.p1.keys._punch = G.p1.keys._kick = G.p1.keys._max = false;
      }
      cpuThink(G.p2, dt);
      tickFighter(G.p1, dt, live);
      tickFighter(G.p2, dt, true);
      separate(G.p1, G.p2);
      tickHits();
      tickOrbs(dt);
    }
  }

  /* ---- hud ---- */
  function setBar(el, ratio, low) {
    if (!el) return;
    el.style.transform = 'scaleX(' + clamp(ratio, 0, 1) + ')';
    el.classList.toggle('low', !!low && ratio < 0.28);
  }
  function setMeter(el, ratio, maxing) {
    if (!el) return;
    el.style.transform = 'scaleX(' + clamp(ratio, 0, 1) + ')';
    el.classList.toggle('full', ratio >= 0.99);
    el.classList.toggle('maxing', !!maxing);
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
      modeLabel.textContent = chainMode() ? '连打' : '拳皇';
      modeLabel.classList.toggle('chain', chainMode());
    }
    if (tagLabel) {
      tagLabel.textContent = G.p2 && G.p2.spec ? G.p2.spec.name : '—';
      tagLabel.className = G.p2 && G.p2.hp < G.p2.maxHp * 0.28 ? 'warn' : '';
    }
    if (roundLabel) roundLabel.textContent = '第' + G.round + '局';
    if (maxLabel) {
      const on = !!(G.p1 && isMax(G.p1));
      maxLabel.textContent = on ? 'MAX' : 'MAX';
      maxLabel.classList.toggle('on', on);
    }
    if (p1NameEl) p1NameEl.textContent = G.p1 && G.p1.spec ? G.p1.spec.name : '炎王';
    if (p2NameEl) p2NameEl.textContent = G.p2 && G.p2.spec ? G.p2.spec.name : '紫牙';
    if (G.p1) {
      setBar(hp1El, G.p1.hp / G.p1.maxHp, true);
      setMeter(mt1El, isMax(G.p1) ? (G.p1.maxT / MAX_DUR) : (G.p1.meter / METER_MAX), isMax(G.p1));
    }
    if (G.p2) {
      setBar(hp2El, G.p2.hp / G.p2.maxHp, true);
      setMeter(mt2El, isMax(G.p2) ? (G.p2.maxT / MAX_DUR) : (G.p2.meter / METER_MAX), isMax(G.p2));
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
    g.addColorStop(0, chainMode() ? '#2a0818' : '#1c0810');
    g.addColorStop(0.32, chainMode() ? '#3a1020' : '#2a1018');
    g.addColorStop(0.58, chainMode() ? '#14080c' : '#12080a');
    g.addColorStop(1, '#080404');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    const sx = 360;
    const sy = 58;
    const glow = ctx.createRadialGradient(sx, sy, 8, sx, sy, 130);
    glow.addColorStop(0, rgba(GOLD, 0.85));
    glow.addColorStop(0.35, rgba(HOT, 0.28));
    glow.addColorStop(1, rgba(PURP, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, sy, 130, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.92);
    ctx.beginPath();
    ctx.arc(sx, sy, 18, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.5);
    ctx.beginPath();
    ctx.arc(sx - 5, sy - 5, 6, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(8, 4, 8, 0.86)';
    ctx.fillRect(0, 78, VW, 64);
    let i;
    for (i = 0; i < crowd.length; i++) {
      const c = crowd[i];
      const bob = Math.sin(G.clock * 3.2 + c.ph) * 2.2;
      ctx.fillStyle = rgba(c.rgb, 0.38);
      ctx.beginPath();
      ctx.ellipse(c.x, c.y + bob, 7 * c.s, 11 * c.s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(SKIN, 0.45);
      ctx.beginPath();
      ctx.arc(c.x, c.y + bob - 10 * c.s, 3.2 * c.s, 0, TAU);
      ctx.fill();
    }

    ctx.fillStyle = rgba(GOLD, chainMode() ? 0.85 : 0.7);
    ctx.font = '900 22px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KOF', VW / 2, 74);
    ctx.font = '700 11px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillStyle = rgba(HOT2, 0.75);
    ctx.fillText('拳皇擂台', VW / 2, 90);

    ctx.fillStyle = 'rgba(18, 8, 10, 0.78)';
    ctx.fillRect(48, 148, 14, GROUND - 148);
    ctx.fillRect(VW - 62, 148, 14, GROUND - 148);
    ctx.fillStyle = rgba(GOLD, 0.55);
    ctx.fillRect(44, 168, 22, 5);
    ctx.fillRect(VW - 66, 168, 22, 5);
    ctx.fillRect(44, 210, 22, 5);
    ctx.fillRect(VW - 66, 210, 22, 5);
    ctx.fillRect(44, 252, 22, 5);
    ctx.fillRect(VW - 66, 252, 22, 5);
    ctx.strokeStyle = rgba(GOLD, 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(62, 170);
    ctx.lineTo(VW - 62, 170);
    ctx.moveTo(62, 212);
    ctx.lineTo(VW - 62, 212);
    ctx.moveTo(62, 254);
    ctx.lineTo(VW - 62, 254);
    ctx.stroke();

    const floor = ctx.createLinearGradient(0, GROUND - 8, 0, VH);
    floor.addColorStop(0, chainMode() ? '#3a1420' : '#2a1218');
    floor.addColorStop(1, '#100406');
    ctx.fillStyle = floor;
    ctx.fillRect(0, GROUND, VW, VH - GROUND);
    ctx.strokeStyle = rgba(GOLD, 0.45);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND);
    ctx.lineTo(VW, GROUND);
    ctx.stroke();
    ctx.strokeStyle = rgba(HOT, 0.22);
    ctx.lineWidth = 2;
    ctx.setLineDash([14, 16]);
    ctx.beginPath();
    ctx.moveTo(0, GROUND + 12);
    ctx.lineTo(VW, GROUND + 12);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = rgba(GOLD, 0.08);
    ctx.lineWidth = 1;
    for (i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.moveTo(40 + i * 80, GROUND);
      ctx.lineTo(16 + i * 92, VH);
      ctx.stroke();
    }
    ctx.fillStyle = rgba(GOLD, 0.12);
    ctx.beginPath();
    ctx.ellipse(VW / 2, GROUND + 8, 70, 8, 0, 0, TAU);
    ctx.fill();
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
    if (k === 'punch3' || k === 'super') {
      return { L: lerp(-0.3, 1.2, u), R: lerp(-0.4, 1.35, u), LL: -0.1, RL: 0.2, kick: 0 };
    }
    if (k === 'kick' || k === 'akick') {
      return { L: 0.4, R: -0.5, LL: -0.15, RL: lerp(0.1, 1.35, clamp(u / 0.4, 0, 1)), kick: 1 };
    }
    if (k === 'rush') {
      return { L: 0.6, R: -0.4, LL: 0.35, RL: lerp(0.2, 1.2, clamp(u / 0.4, 0, 1)), kick: 1 };
    }
    if (k === 'qi') {
      return { L: lerp(0.2, 1.25, u), R: lerp(-0.2, 0.4, u), LL: 0.12, RL: 0.1, kick: 0 };
    }
    if (f.win) return { L: -1.4, R: 0.4, LL: 0, RL: 0, kick: 0 };
    if (f.crouch) return { L: 0.35, R: 0.4, LL: 0.45, RL: 0.5, kick: 0 };
    if (f.dashT > 0) return { L: 0.7, R: -0.5, LL: 0.35, RL: -0.15, kick: 0 };
    return { L: 0.18 + walk * 0.2, R: -0.18 - walk * 0.2, LL: walk * 0.18, RL: -walk * 0.18, kick: 0 };
  }

  function drawFighter(f) {
    const spec = f.spec;
    const s = spec.size || 1;
    const crouch = f.crouch && f.grounded && !f.atk;
    const koDown = f.ko && f.grounded;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(f.face * s, s);

    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.beginPath();
    ctx.ellipse(0, 3, koDown ? 28 : 15, 4.5, 0, 0, TAU);
    ctx.fill();

    if (isMax(f)) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(GOLD, 0.18 + Math.sin(G.clock * 12) * 0.06);
      ctx.beginPath();
      ctx.ellipse(0, -28, 22, 36, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    if (koDown) {
      ctx.rotate(1.42);
      ctx.translate(0, -10);
    } else if (f.hurtT > 0) {
      ctx.rotate(-0.16);
    } else if (!f.grounded) {
      ctx.rotate(f.vy < 0 ? (f.hopping ? -0.06 : -0.12) : 0.16);
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
    if (spec.belt) {
      ctx.fillStyle = rgba(spec.belt, 0.95);
      ctx.fillRect(-8, hip + 1, 16, 3.2);
    }

    const torsoY = hip - 20;
    ctx.fillStyle = rgba(spec.top, 1);
    ctx.beginPath();
    ctx.moveTo(-12, torsoY + 4);
    ctx.lineTo(12, torsoY + 4);
    ctx.lineTo(10, hip + 2);
    ctx.lineTo(-10, hip + 2);
    ctx.fill();
    if (spec.gi) {
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-1.4, torsoY + 6, 2.8, hip - torsoY - 6);
    }
    if (spec.band) {
      ctx.fillStyle = rgba(spec.accent, 0.9);
      ctx.fillRect(-8, hip + 6, 16, 3);
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
    if (f.atk && (f.atk.kind === 'punch' || f.atk.kind === 'punch2' || f.atk.kind === 'punch3' || f.atk.kind === 'super' || f.atk.kind === 'qi')) {
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
    if (spec.wild) {
      ctx.beginPath();
      ctx.moveTo(-9, headY);
      ctx.lineTo(-6, headY - 12);
      ctx.lineTo(-2, headY - 6);
      ctx.lineTo(2, headY - 13);
      ctx.lineTo(6, headY - 5);
      ctx.lineTo(9, headY - 10);
      ctx.lineTo(8, headY);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, headY - 1.2, 8.2, Math.PI, TAU);
      ctx.fill();
      if (spec.gi) {
        ctx.beginPath();
        ctx.moveTo(-4, headY - 6);
        ctx.lineTo(0, headY - 13);
        ctx.lineTo(4, headY - 6);
        ctx.fill();
      }
    }
    if (spec.band) {
      ctx.fillStyle = rgba(spec.accent, 1);
      ctx.fillRect(-8, headY - 3, 16, 3);
    }

    if (f.flashT > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, clamp(f.flashT * 6, 0, 0.55));
      ctx.fillRect(-16, torsoY - 14, 32, 56);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawOrb(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(p.rgb, 0.22);
    ctx.beginPath();
    ctx.arc(0, 0, p.r + 10, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(p.rgb, 0.85);
    ctx.beginPath();
    ctx.arc(0, 0, p.r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.7);
    ctx.beginPath();
    ctx.arc(-2 * p.face, -3, p.r * 0.4, 0, TAU);
    ctx.fill();
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
    for (i = 0; i < G.orbs.length; i++) drawOrb(G.orbs[i]);
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
    ctx.fillText(G.call, VW / 2, 108);
    ctx.restore();
  }

  function drawFighters() {
    if (!G.p1 || !G.p2) return;
    if (G.p1.y <= G.p2.y) {
      drawFighter(G.p1);
      drawFighter(G.p2);
    } else {
      drawFighter(G.p2);
      drawFighter(G.p1);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#140606';
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

  function onDashTap(side) {
    const t = G.clock;
    if (t - dashTap[side] < 0.22) {
      tryDash(side === 'l' ? -1 : 1);
      dashTap[side] = -9;
    } else {
      dashTap[side] = t;
    }
  }

  function onKey(e, down) {
    const c = e.code || '';
    const k = e.key || '';
    let hit = true;
    if (c === 'ArrowLeft' || k === 'a' || k === 'A') {
      setKey('l', down);
      if (down && !e.repeat) onDashTap('l');
    } else if (c === 'ArrowRight' || k === 'd' || k === 'D') {
      setKey('r', down);
      if (down && !e.repeat) onDashTap('r');
    } else if (c === 'ArrowUp' || k === 'w' || k === 'W') {
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
    } else if (k === 'x' || k === 'X' || k === 'c' || k === 'C' || k === 'v' || k === 'V') {
      if (down && !e.repeat) maxEdge.down = true;
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

  bindPad(padBtns.l, function () { keys.l = true; onDashTap('l'); }, function () { keys.l = false; });
  bindPad(padBtns.r, function () { keys.r = true; onDashTap('r'); }, function () { keys.r = false; });
  bindPad(padBtns.u, function () { keys.u = true; jumpEdge.down = true; }, function () { keys.u = false; });
  bindPad(padBtns.d, function () { keys.d = true; }, function () { keys.d = false; });
  bindPad(padBtns.punch, function () { keys.punch = true; punchEdge.down = true; }, function () { keys.punch = false; });
  bindPad(padBtns.kick, function () { keys.kick = true; kickEdge.down = true; }, function () { keys.kick = false; });
  bindPad(padBtns.max, function () { maxEdge.down = true; }, function () {});

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
      setTimeout(function () { keys.u = false; }, 160);
    } else if (Math.abs(dy) > 28 && dy > 12 && Math.abs(dy) > Math.abs(dx)) {
      keys.d = true;
      setTimeout(function () { keys.d = false; }, 140);
    } else if (Math.abs(dx) > 24) {
      if (dx < 0) { keys.l = true; onDashTap('l'); setTimeout(function () { keys.l = false; }, 120); }
      else { keys.r = true; onDashTap('r'); setTimeout(function () { keys.r = false; }, 120); }
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
    keys.l = keys.r = keys.u = keys.d = keys.punch = keys.kick = keys.max = false;
    clearEdges();
  });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      last = 0;
      keys.l = keys.r = keys.u = keys.d = keys.punch = keys.kick = keys.max = false;
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
  seedCrowd();
  loadBest();
  resize();
  showTitle();
  requestAnimationFrame(frame);
})();
