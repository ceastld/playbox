'use strict';

/* 末刃 — The Last Blade lite. No CDN. */

(function () {
  const VW = 720;
  const VH = 400;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const GROUND = 338;
  const WALK = 168;
  const BACK = 124;
  const JUMP_V = 502;
  const GRAV = 1480;
  const MAX_FALL = 660;
  const ROUND_DUEL = 99;
  const ROUND_CHAIN = 72;
  const WINS_NEED = 2;
  const HP_DUEL = 100;
  const HP_CHAIN = 88;
  const COMBO_DUEL = 1.2;
  const COMBO_CHAIN = 1.55;
  const EDGE = 40;
  const GAP = 30;
  const METER_MAX = 100;
  const MOON_COST = 50;
  const SUPER_COST = 100;
  const BEST_KEY = 'playbox-last-blade-best';
  const MUTE_KEY = 'playbox-last-blade-mute';
  const OPS = '方向 / WASD 走跳 · 空格斩 · Shift / Z 月华 · R 重开 · M 静音';

  const MAG = [255, 61, 120];
  const CYN = [94, 232, 208];
  const GOLD = [255, 227, 107];
  const HOT = [255, 58, 26];
  const HOT2 = [255, 110, 66];
  const WHT = [255, 244, 232];
  const MOON = [255, 232, 160];
  const SKIN = [232, 184, 152];
  const INK = [28, 10, 10];

  const MOVES = {
    s1: { dur: 0.26, hit0: 0.05, hit1: 0.13, dmg: 10, stun: 0.22, kb: 52, range: 54, h0: 18, h1: 50, stop: 0.046, height: 'mid', score: 80, name: '斩' },
    s2: { dur: 0.32, hit0: 0.07, hit1: 0.17, dmg: 14, stun: 0.26, kb: 86, range: 60, h0: 14, h1: 56, stop: 0.058, height: 'mid', score: 120, name: '二斩' },
    s3: { dur: 0.38, hit0: 0.08, hit1: 0.2, dmg: 16, stun: 0.42, kb: 130, range: 64, h0: 10, h1: 58, stop: 0.07, height: 'mid', score: 160, knockdown: true, name: '三斩' },
    air: { dur: 0.3, hit0: 0.04, hit1: 0.22, dmg: 12, stun: 0.2, kb: 64, range: 50, h0: 8, h1: 46, stop: 0.05, height: 'high', score: 100, name: '跳斩' },
    low: { dur: 0.34, hit0: 0.09, hit1: 0.2, dmg: 11, stun: 0.46, kb: 140, range: 52, h0: 0, h1: 18, stop: 0.052, height: 'low', score: 90, knockdown: true, name: '下斩' },
    moon: { dur: 0.5, hit0: 0.16, hit1: 0.28, dmg: 20, stun: 0.32, kb: 92, range: 36, h0: 20, h1: 52, stop: 0.068, height: 'mid', score: 240, knockdown: true, proj: true, cost: 50, name: '月华' },
    super: { dur: 0.62, hit0: 0.18, hit1: 0.38, dmg: 30, stun: 0.46, kb: 150, range: 44, h0: 8, h1: 72, stop: 0.08, height: 'mid', score: 400, knockdown: true, proj: true, cost: 100, name: '超月华' }
  };

  const FIGHTERS = [
    {
      id: 'mo', name: '末剑', en: 'LAST',
      hp: HP_DUEL, hpChain: HP_CHAIN, walk: WALK, back: BACK, jump: JUMP_V, size: 1,
      haori: [196, 28, 24], sash: [255, 220, 90], hakama: [48, 14, 16],
      hair: [22, 12, 10], skin: SKIN, accent: GOLD, blade: GOLD, moon: MOON,
      ai: { agg: 0.58, spec: 0.22, jump: 0.24, think: 0.26, clash: 0.34 }
    },
    {
      id: 'yue', name: '月影', en: 'MOON',
      hp: HP_DUEL, hpChain: HP_CHAIN, walk: 176, back: 132, jump: 518, size: 0.98,
      haori: [18, 92, 118], sash: [180, 245, 255], hakama: [10, 42, 56],
      hair: [12, 28, 36], skin: SKIN, accent: CYN, blade: CYN, moon: CYN,
      ai: { agg: 0.62, spec: 0.28, jump: 0.32, think: 0.22, clash: 0.4 }
    },
    {
      id: 'chan', name: '赤蝉', en: 'CICADA',
      hp: HP_CHAIN, hpChain: HP_CHAIN, walk: 198, back: 148, jump: 530, size: 0.96,
      haori: [210, 28, 92], sash: [255, 170, 210], hakama: [72, 10, 36],
      hair: [36, 8, 18], skin: [236, 176, 148], accent: MAG, blade: HOT2, moon: MAG,
      ai: { agg: 0.78, spec: 0.36, jump: 0.4, think: 0.14, clash: 0.48 }
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
    return chainMode() ? 0.78 : 1;
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
      cost: m.cost,
      name: m.name
    };
  }

  function selfCheck() {
    if (WINS_NEED !== 2) throw new Error('2 wins');
    if (HP_DUEL !== 100) throw new Error('hp duel');
    if (HP_CHAIN !== 88) throw new Error('hp chain');
    if (ROUND_DUEL !== 99 || ROUND_CHAIN !== 72) throw new Error('timer');
    if (BEST_KEY !== 'playbox-last-blade-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-last-blade-mute') throw new Error('mute key');
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(2) !== 1) throw new Error('combo 2');
    if (comboMul(3) !== 2) throw new Error('combo 3');
    if (comboMul(9) !== 5) throw new Error('combo cap');
    const h = jumpHeight(JUMP_V, GRAV);
    if (h < 78 || h > 95) throw new Error('jump height ' + h);
    if (FIGHTERS.length !== 3) throw new Error('3 fighters');
    if (FIGHTERS[0].id !== 'mo' || FIGHTERS[1].id !== 'yue' || FIGHTERS[2].id !== 'chan') throw new Error('ids');
    if (MOVES.s1.dmg >= MOVES.s2.dmg) throw new Error('s2 stronger');
    if (MOVES.s2.range <= MOVES.s1.range) throw new Error('s2 reach');
    if (MOVES.low.height !== 'low' || MOVES.air.height !== 'high') throw new Error('heights');
    if (!MOVES.moon.proj || MOVES.moon.cost !== 50) throw new Error('moon');
    if (MOVES.super.dmg <= MOVES.moon.dmg) throw new Error('super dmg');
    if (MOVES.s3.knockdown !== true) throw new Error('s3 kd');
    if (MOON_COST !== 50 || SUPER_COST !== 100) throw new Error('meter cost');
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
    slash: document.getElementById('btn-slash'),
    spec: document.getElementById('btn-spec')
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

  const keys = { l: false, r: false, u: false, d: false, slash: false, spec: false };
  const slashEdge = { down: false };
  const specEdge = { down: false };
  const jumpEdge = { down: false };

  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const trails = [];
  const petals = [];
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
    moons: [],
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
    swing: function (heavy) {
      this.ensure();
      this.noise(heavy ? 0.09 : 0.055, heavy ? 0.09 : 0.06, heavy ? 640 : 1500, 'highpass');
      this.beep(heavy ? 150 : 240, 0.05, 'sawtooth', 0.032, 68);
    },
    hit: function (combo, heavy) {
      this.ensure();
      const p = 1 + Math.min(7, combo) * 0.07;
      this.noise(0.13, heavy ? 0.22 : 0.15, 200, 'lowpass');
      this.beep(180 * p, 0.1, 'square', 0.085, 58);
      this.beep((heavy ? 980 : 720) * p, 0.07, 'triangle', 0.05, 420 * p);
      if (heavy) this.beep(1280 * p, 0.09, 'square', 0.04, 1680 * p);
    },
    clash: function () {
      this.ensure();
      this.noise(0.1, 0.16, 1800, 'bandpass');
      this.beep(920, 0.08, 'square', 0.07, 240);
      this.beep(1480, 0.07, 'triangle', 0.05, 620);
      this.beep(210, 0.1, 'sawtooth', 0.04, 90);
    },
    moon: function (supered) {
      this.ensure();
      this.noise(0.18, supered ? 0.18 : 0.12, 380, 'bandpass');
      this.beep(supered ? 160 : 210, 0.2, 'sawtooth', 0.07, 70);
      this.beep(supered ? 720 : 880, 0.16, 'square', 0.05, 360);
      this.beep(1400, supered ? 0.16 : 0.1, 'triangle', 0.04, 720);
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
    chainPop.textContent = n + ' 斩';
    chainPop.classList.remove('hidden');
    void chainPop.offsetWidth;
    clearTimeout(chainTok);
    chainTok = setTimeout(function () { chainPop.classList.add('hidden'); }, 700);
  }
  function kickStage(cls) {
    if (!stageEl || REDUCE) return;
    stageEl.classList.remove('hit', 'boom', 'die', 'thump', 'spec', 'win-flash', 'clash');
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
    slashes.push({ x: x, y: y, face: face, t: 0.18, rgb: rgb, r: r || 36 });
    capArr(slashes, 16);
  }
  function spawnPetal() {
    const dense = chainMode() ? 1.6 : 1;
    if (REDUCE) return;
    if (petals.length > (chainMode() ? 48 : 28)) return;
    petals.push({
      x: rand(-20, VW + 20),
      y: rand(-30, 80),
      vx: rand(-18, 18) * dense,
      vy: rand(28, 64) * dense,
      a: rand(0, TAU),
      va: rand(-3, 3),
      s: rand(2.2, 4.4),
      rgb: Math.random() < 0.45 ? HOT2 : (Math.random() < 0.5 ? GOLD : MAG),
      t: rand(4, 8)
    });
  }
  function seedPetals() {
    petals.length = 0;
    let i;
    const n = REDUCE ? 6 : (chainMode() ? 22 : 14);
    for (i = 0; i < n; i++) {
      spawnPetal();
      petals[petals.length - 1].y = rand(20, GROUND - 40);
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
    for (i = petals.length - 1; i >= 0; i--) {
      p = petals[i];
      p.t -= dt;
      p.x += p.vx * dt + Math.sin(p.a) * 12 * dt;
      p.y += p.vy * dt;
      p.a += p.va * dt;
      if (p.t <= 0 || p.y > GROUND + 8) petals.splice(i, 1);
    }
    if (!REDUCE && Math.random() < (chainMode() ? 0.22 : 0.12)) spawnPetal();
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
      airSlash: false,
      thinkT: 0.2,
      plan: null,
      cpu: !!cpu,
      keys: { l: false, r: false, u: false, d: false, slash: false, spec: false }
    };
  }

  function foeOf(f) {
    return f === G.p1 ? G.p2 : G.p1;
  }
  function busy(f) {
    return !!(f.atk || f.hurtT > 0 || f.ko || f.win);
  }
  function canAct(f) {
    return !f.ko && !f.win && f.hurtT <= 0;
  }
  function canCancel(f, into) {
    if (!f.atk || !f.atk.hit) return false;
    const k = f.atk.kind;
    if (into === 's2') return k === 's1';
    if (into === 's3') return k === 's2' && chainMode();
    if (into === 'moon' || into === 'super') return k === 's1' || k === 's2' || k === 's3';
    return false;
  }
  function bodyBox(f) {
    const crouch = f.crouch && f.grounded && !f.atk;
    const h = f.ko && f.grounded ? 16 : crouch ? 32 : 56 * (f.spec.size || 1);
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

  function addMeter(f, n) {
    const gain = n * (chainMode() ? 1.25 : 1);
    f.meter = clamp(f.meter + gain, 0, METER_MAX);
    G.hudDirty = true;
  }

  function startAtk(f, kind) {
    if (!canAct(f)) return false;
    if (f.atk && !canCancel(f, kind)) return false;
    if (kind === 's3' && !chainMode()) return false;
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
    f.atk = { kind: kind, t: 0, spent: false, def: def, hit: false, fired: false };
    f.crouch = kind === 'low';
    if (kind === 'moon' || kind === 'super') {
      const supered = kind === 'super';
      flash(supered ? GOLD : f.spec.moon, supered ? 0.22 : 0.14);
      kickStage('spec');
      audio.moon(supered);
      burst(f.x + f.face * 12, f.y - 40, f.spec.moon, supered ? 22 : 14, supered ? 260 : 200);
      ringAt(f.x, f.y - 30, f.spec.moon);
      if (G.mode === 'play' && f === G.p1) toast(supered ? '超月华！' : '月华！', 'gold');
    } else {
      audio.swing(kind === 's2' || kind === 's3' || kind === 'low');
    }
    return true;
  }

  function trySlash(f) {
    if (!canAct(f) && !(f.atk && (canCancel(f, 's2') || canCancel(f, 's3')))) return false;
    if (!f.grounded) {
      if (f.airSlash) return false;
      if (startAtk(f, 'air')) {
        f.airSlash = true;
        return true;
      }
      return false;
    }
    if (f.crouch || f.keys.d) return startAtk(f, 'low');
    if (f.atk && f.atk.kind === 's2' && canCancel(f, 's3')) return startAtk(f, 's3');
    if (f.atk && f.atk.kind === 's1' && canCancel(f, 's2')) return startAtk(f, 's2');
    return startAtk(f, 's1');
  }

  function trySpecial(f) {
    if (!f.grounded) return false;
    const kind = f.meter >= SUPER_COST ? 'super' : 'moon';
    if (f.atk && !canCancel(f, kind) && !canAct(f)) return false;
    return startAtk(f, kind);
  }

  function spawnMoon(f, supered) {
    G.moons.push({
      owner: f,
      x: f.x + f.face * 34,
      y: f.y - (supered ? 40 : 36),
      vx: f.face * (supered ? 340 : 280) * speedMul(),
      life: supered ? 1.15 : 0.92,
      dmg: supered ? 28 : 18,
      score: supered ? 400 : 240,
      rgb: supered ? GOLD : f.spec.moon,
      face: f.face,
      r: supered ? 18 : 13,
      supered: supered
    });
  }

  function applyHit(att, vic, move, isProj, hx, hy) {
    if (vic.ko || vic.win) return false;
    if (vic.invuln > 0) return false;
    const heavy = move.dmg >= 16 || isProj || move.knockdown;
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
      vic.airSlash = false;
    } else if (!vic.grounded) {
      vic.vy = Math.min(vic.vy, -80);
    }
    sparkAt(hx, hy, heavy ? GOLD : WHT);
    burst(hx, hy, heavy ? HOT : GOLD, heavy ? 18 : 12, heavy ? 270 : 190);
    ringAt(hx, hy, att.spec.blade);
    slashArc(hx, hy, att.face, att.spec.blade, heavy ? 48 : 34);
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
    addMeter(G.p1, 18);
    addMeter(G.p2, 18);
    sparkAt(hx, hy, GOLD);
    burst(hx, hy, WHT, 16, 240);
    burst(hx, hy, GOLD, 10, 180);
    ringAt(hx, hy, GOLD);
    slashArc(hx, hy, 1, GOLD, 42);
    slashArc(hx, hy, -1, CYN, 42);
    audio.clash();
    hitStop(REDUCE ? 0 : 0.056);
    shake(0.42);
    kickStage('clash');
    flash(MOON, 0.1);
    if (G.mode === 'play') {
      addScore(50, hx, hy - 16, CYN);
      floatTxt('交刃', hx, hy - 36, GOLD);
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
    const sm = speedMul();
    if (f.flashT > 0) f.flashT -= dt;
    if (f.invuln > 0) f.invuln -= dt;

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
      f.airSlash = false;
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
        f.airSlash = false;
        audio.jump();
      }
    } else if (f.grounded && f.atk) {
      f.vx *= 0.5;
    }

    if (live && (canAct(f) || (f.atk && f.atk.hit))) {
      const sl = f.keys._slash;
      const sp = f.keys._spec;
      f.keys._slash = false;
      f.keys._spec = false;
      if (sp) trySpecial(f);
      else if (sl) trySlash(f);
    }

    if (f.atk) {
      f.atk.t += dt;
      const k = f.atk.kind;
      const m = f.atk.def;
      if ((k === 'moon' || k === 'super') && !f.atk.fired && f.atk.t >= m.hit0) {
        f.atk.fired = true;
        spawnMoon(f, k === 'super');
        burst(f.x + f.face * 28, f.y - 38, f.spec.moon, 12, 160);
      }
      if (f.atk.t >= m.hit0 && f.atk.t <= m.hit1 && !m.proj && (G.clock * 60 | 0) % 2 === 0) {
        slashArc(f.x + f.face * (18 + m.range * 0.45), f.y - (m.h0 + m.h1) * 0.5, f.face, f.spec.blade, 28);
      }
      if (f.atk.t >= m.dur) f.atk = null;
    }

    f.x += f.vx * dt;
    f.y += f.vy * dt;
    if (f.y >= GROUND) {
      if (!f.grounded) {
        if (f.vy > 120) audio.land();
        if (f.atk && f.atk.kind === 'air') f.atk = null;
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
    const p1hit = !!(a && G.p1.atk && !G.p1.atk.spent && aabb(a, hb1));
    const p2hit = !!(b && G.p2.atk && !G.p2.atk.spent && aabb(b, hb2));
    const blades = !!(a && b && aabb(a, b) && G.p1.atk && G.p2.atk && !G.p1.atk.spent && !G.p2.atk.spent);
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
      applyHit(G.p1, G.p2, G.p1.atk.def, false, G.p2.x - G.p2.face * 8, G.p2.y - 36);
    }
    if (p2hit) {
      G.p2.atk.spent = true;
      G.p2.atk.hit = true;
      applyHit(G.p2, G.p1, G.p2.atk.def, false, G.p1.x - G.p1.face * 8, G.p1.y - 36);
    }
  }

  function tickMoons(dt) {
    let i, j, p, q;
    for (i = G.moons.length - 1; i >= 0; i--) {
      p = G.moons[i];
      p.life -= dt;
      p.x += p.vx * dt;
      trailAt(p.x, p.y, p.rgb, p.r);
      if (p.life <= 0 || p.x < -30 || p.x > VW + 30) {
        G.moons.splice(i, 1);
        continue;
      }
      const box = { x: p.x - p.r, y: p.y - p.r * 0.7, w: p.r * 2, h: p.r * 1.4 };
      const vic = p.owner === G.p1 ? G.p2 : G.p1;
      const foAtk = atkBox(vic);
      if (foAtk && aabb(box, foAtk)) {
        burst(p.x, p.y, GOLD, 12, 160);
        ringAt(p.x, p.y, GOLD);
        audio.clash();
        G.moons.splice(i, 1);
        if (vic.atk) vic.atk.spent = true;
        continue;
      }
      if (aabb(box, bodyBox(vic))) {
        const def = {
          dmg: p.dmg, stun: p.supered ? 0.4 : 0.3, kb: p.supered ? 130 : 90,
          height: 'mid', score: p.score, stop: p.supered ? 0.078 : 0.064, knockdown: true
        };
        applyHit(p.owner, vic, def, true, p.x, p.y);
        burst(p.x, p.y, p.rgb, 14, 180);
        G.moons.splice(i, 1);
      }
    }
    for (i = G.moons.length - 1; i >= 0; i--) {
      p = G.moons[i];
      for (j = i - 1; j >= 0; j--) {
        q = G.moons[j];
        if (p.owner === q.owner) continue;
        if (hypot(p.x - q.x, p.y - q.y) < p.r + q.r + 4) {
          burst((p.x + q.x) / 2, (p.y + q.y) / 2, WHT, 16, 200);
          ringAt((p.x + q.x) / 2, (p.y + q.y) / 2, GOLD);
          audio.clash();
          G.moons.splice(i, 1);
          G.moons.splice(j, 1);
          i--;
          break;
        }
      }
    }
  }

  /* ---- CPU ---- */
  function cpuThink(f, dt) {
    const p = foeOf(f);
    const ai = f.spec.ai;
    const dist = Math.abs(p.x - f.x);
    const k = f.keys;
    k.l = k.r = k.u = k.d = false;
    k._slash = false;
    k._spec = false;

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
          k._slash = true;
          plan.did = true;
        }
      } else if (plan.type === 'slash') {
        if (!plan.did) { k._slash = true; plan.did = true; }
      } else if (plan.type === 'low') {
        k.d = true;
        if (!plan.did) { k._slash = true; plan.did = true; }
      } else if (plan.type === 'spec') {
        if (!plan.did) { k._spec = true; plan.did = true; }
      } else if (plan.type === 'back') {
        if (f.face > 0) k.l = true;
        else k.r = true;
      }
      if (f.atk && f.atk.hit && (f.atk.kind === 's1' || (chainMode() && f.atk.kind === 's2'))) {
        k._slash = true;
      }
      if (f.thinkT > 0) return;
    }

    f.thinkT = (ai.think / speedMul()) * (0.55 + Math.random() * 0.7);
    if (!canAct(f)) {
      f.plan = { type: 'wait', t: 0.08 };
      return;
    }

    const incoming = p.atk && dist < 78 && p.atk.t < p.atk.def.hit1;
    const r = Math.random();
    if (incoming && r < ai.jump + 0.12) {
      f.plan = { type: 'jump', dir: -f.face, t: 0.22 };
    } else if (incoming && r < ai.clash && f.meter < SUPER_COST) {
      f.plan = { type: 'slash', t: 0.18 };
    } else if (p.airT > 0.06 && dist < 110 && p.y < f.y - 20 && f.grounded) {
      f.plan = { type: r < 0.45 ? 'slash' : 'spec', t: 0.22 };
    } else if (dist > 210) {
      if (r < ai.spec && f.meter >= MOON_COST) f.plan = { type: 'spec', t: 0.4 };
      else f.plan = { type: 'walk', dir: f.face, t: 0.42 };
    } else if (dist > 96) {
      if (r < ai.spec * 0.7 && f.meter >= MOON_COST) f.plan = { type: 'spec', t: 0.36 };
      else if (r < ai.spec * 0.7 + ai.jump) f.plan = { type: 'jumpin', t: 0.5 };
      else if (r < 0.8) f.plan = { type: 'walk', dir: f.face, t: 0.28 };
      else f.plan = { type: 'back', t: 0.2 };
    } else {
      if (r < ai.agg * 0.5) f.plan = { type: 'slash', t: 0.2 };
      else if (r < ai.agg * 0.72) f.plan = { type: 'low', t: 0.26 };
      else if (r < ai.agg && f.meter >= MOON_COST) f.plan = { type: 'spec', t: 0.3 };
      else if (r < ai.agg + 0.12) f.plan = { type: 'jumpin', t: 0.4 };
      else f.plan = { type: 'back', t: 0.18 };
    }
  }

  function copyPlayerKeys(f) {
    f.keys.l = keys.l;
    f.keys.r = keys.r;
    f.keys.u = keys.u;
    f.keys.d = keys.d;
    f.keys.slash = keys.slash;
    f.keys.spec = keys.spec;
    if (slashEdge.down) { f.keys._slash = true; slashEdge.down = false; }
    if (specEdge.down) { f.keys._spec = true; specEdge.down = false; }
    if (jumpEdge.down) { f.keys.u = true; jumpEdge.down = false; }
  }

  function clearEdges() {
    slashEdge.down = specEdge.down = jumpEdge.down = false;
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
    G.moons.length = 0;
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
    seedPetals();
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
    toast((chainMode() ? '连斩' : '末刃') + ' · ' + foeSpec().name);
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
    G.moons.length = 0;
    G.call = '';
    seedPetals();
    overlay.classList.remove('hidden', 'end');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.remove('win', 'lose');
    ovKicker.textContent = 'LBLD';
    ovTitle.textContent = '末刃';
    ovLead.innerHTML = '月下对剑。空格斩，上跳，Shift 月华。先赢两局，刀光见血。';
    ovOps.textContent = OPS;
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    G.hudDirty = true;
    if (hintEl) {
      hintEl.textContent = '空格斩 · 上跳 · 下蹲斩 · Shift 月华 · 气满超月华 · 先赢两局';
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
    ovKicker.textContent = win ? 'LBLD' : 'KO';
    ovTitle.textContent = win ? (chainMode() ? '连尽' : '刃尽') : '刃折';
    const foe = (G.p2 && G.p2.spec && G.p2.spec.name) || '对手';
    let lead = why || (win ? '两局到手。' : '血条见底。');
    lead += ' 分数 ' + G.score + ' · 最高连斩 ×' + G.maxCombo + ' · 对 ' + foe;
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
    toast((pWin ? '末剑' : G.p2.spec.name) + ' 拿下第 ' + G.round + ' 局', pWin ? 'gold' : 'warn');
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
      G.moons.length = 0;
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
    awardRound(!pKo, pKo ? '血条见底。' : '一刀定局。');
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
      tickMoons(dt);
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
      tickMoons(dt);
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
        G.p1.keys._slash = G.p1.keys._spec = false;
      }
      cpuThink(G.p2, dt);
      tickFighter(G.p1, dt, live);
      tickFighter(G.p2, dt, true);
      separate(G.p1, G.p2);
      tickHits();
      tickMoons(dt);
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
      modeLabel.textContent = chainMode() ? '连斩' : '末刃';
      modeLabel.classList.toggle('chain', chainMode());
    }
    if (tagLabel) {
      tagLabel.textContent = G.p2 && G.p2.spec ? G.p2.spec.name : '—';
      tagLabel.className = G.p2 && G.p2.hp < G.p2.maxHp * 0.28 ? 'warn' : '';
    }
    if (roundLabel) roundLabel.textContent = '第' + G.round + '局';
    if (p1NameEl) p1NameEl.textContent = G.p1 && G.p1.spec ? G.p1.spec.name : '末剑';
    if (p2NameEl) p2NameEl.textContent = G.p2 && G.p2.spec ? G.p2.spec.name : '月影';
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
    g.addColorStop(0, chainMode() ? '#2a0810' : '#18060c');
    g.addColorStop(0.45, chainMode() ? '#1c0610' : '#12040a');
    g.addColorStop(1, '#0c0204');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    const mx = 560;
    const my = 78;
    const glow = ctx.createRadialGradient(mx, my, 8, mx, my, 90);
    glow.addColorStop(0, rgba(MOON, 0.95));
    glow.addColorStop(0.35, rgba(MOON, 0.35));
    glow.addColorStop(1, rgba(MOON, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(mx, my, 90, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MOON, 0.92);
    ctx.beginPath();
    ctx.arc(mx, my, 28, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.55);
    ctx.beginPath();
    ctx.arc(mx - 7, my - 6, 10, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(18, 6, 8, 0.85)';
    ctx.fillRect(40, 148, 18, GROUND - 148);
    ctx.fillRect(VW - 58, 138, 18, GROUND - 138);
    ctx.fillStyle = rgba(HOT, 0.18);
    ctx.fillRect(42, 150, 14, 8);
    ctx.fillStyle = rgba(CYN, 0.16);
    ctx.fillRect(VW - 56, 140, 14, 8);

    ctx.fillStyle = 'rgba(40, 14, 12, 0.55)';
    ctx.beginPath();
    ctx.moveTo(110, GROUND);
    ctx.lineTo(168, 210);
    ctx.lineTo(226, GROUND);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(VW - 226, GROUND);
    ctx.lineTo(VW - 168, 200);
    ctx.lineTo(VW - 110, GROUND);
    ctx.fill();

    let i;
    for (i = 0; i < 5; i++) {
      const lx = 90 + i * 135;
      ctx.fillStyle = rgba(GOLD, 0.12);
      ctx.fillRect(lx, 118, 4, 36);
      ctx.fillStyle = rgba(HOT2, 0.55);
      ctx.beginPath();
      ctx.ellipse(lx + 2, 116, 7, 10, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.35);
      ctx.beginPath();
      ctx.ellipse(lx + 2, 114, 3, 4, 0, 0, TAU);
      ctx.fill();
    }

    const floor = ctx.createLinearGradient(0, GROUND - 8, 0, VH);
    floor.addColorStop(0, chainMode() ? '#3a1018' : '#2a1210');
    floor.addColorStop(1, '#100406');
    ctx.fillStyle = floor;
    ctx.fillRect(0, GROUND, VW, VH - GROUND);
    ctx.strokeStyle = rgba(HOT, 0.22);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND);
    ctx.lineTo(VW, GROUND);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(80, 28, 20, 0.35)';
    ctx.lineWidth = 1;
    for (i = 1; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(0, GROUND + i * 8);
      ctx.lineTo(VW, GROUND + i * 8);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(GOLD, 0.08);
    for (i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.moveTo(40 + i * 80, GROUND);
      ctx.lineTo(20 + i * 90, VH);
      ctx.stroke();
    }
  }

  function drawPetals() {
    let i, p;
    for (i = 0; i < petals.length; i++) {
      p = petals[i];
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.fillStyle = rgba(p.rgb, 0.7);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function bladePose(f) {
    const k = f.atk && f.atk.kind;
    const t = f.atk ? f.atk.t : 0;
    const m = f.atk && f.atk.def;
    const u = m ? clamp(t / m.dur, 0, 1) : 0;
    if (f.ko && f.grounded) return { ang: 1.4, len: 46, ox: 8, oy: 8 };
    if (f.hurtT > 0) return { ang: -0.4, len: 48, ox: -6, oy: -8 };
    if (k === 's1') return { ang: lerp(-2.4, 0.5, clamp(u / 0.5, 0, 1)), len: 58, ox: 10, oy: -8 };
    if (k === 's2') return { ang: lerp(-2.7, 1.1, clamp(u / 0.45, 0, 1)), len: 62, ox: 8, oy: -16 };
    if (k === 's3') return { ang: -2.2 + u * 6.4, len: 64, ox: 6, oy: -12 };
    if (k === 'air') return { ang: lerp(-2.6, 1.2, clamp(u / 0.4, 0, 1)), len: 56, ox: 6, oy: 4 };
    if (k === 'low') return { ang: lerp(-0.2, 0.7, clamp(u / 0.4, 0, 1)), len: 54, ox: 12, oy: 18 };
    if (k === 'moon' || k === 'super') {
      const wind = u < 0.35 ? lerp(-2.8, -3.1, u / 0.35) : lerp(-3.1, 0.4, (u - 0.35) / 0.65);
      return { ang: wind, len: k === 'super' ? 70 : 62, ox: 8, oy: -18 };
    }
    if (f.win) return { ang: -2.5, len: 58, ox: 4, oy: -22 };
    if (f.crouch) return { ang: 0.55, len: 46, ox: 10, oy: 10 };
    return { ang: 2.5, len: 52, ox: -10, oy: -4 };
  }

  function drawFighter(f) {
    const spec = f.spec;
    const s = spec.size || 1;
    const crouch = f.crouch && f.grounded && !f.atk;
    const koDown = f.ko && f.grounded;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(f.face, 1);
    ctx.scale(s, s);

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 2, koDown ? 28 : 16, 5, 0, 0, TAU);
    ctx.fill();

    if (koDown) {
      ctx.rotate(1.45);
      ctx.translate(0, -10);
    } else if (f.hurtT > 0) {
      ctx.rotate(-0.18);
    } else if (!f.grounded) {
      ctx.rotate(f.vy < 0 ? -0.12 : 0.18);
    }

    const hip = crouch ? -16 : -22;
    const walk = Math.sin(f.step) * (f.grounded && !busy(f) && Math.abs(f.vx) > 8 ? 7 : 0);

    ctx.fillStyle = rgba(spec.hakama, 1);
    ctx.fillRect(-8, hip, 7, 22 + (crouch ? -6 : 0));
    ctx.fillRect(1, hip, 7, 22 + (crouch ? -6 : 0));
    ctx.fillStyle = rgba(spec.hakama, 0.85);
    ctx.beginPath();
    ctx.moveTo(-11, hip - 2);
    ctx.lineTo(11, hip - 2);
    ctx.lineTo(9, hip + 16);
    ctx.lineTo(-9, hip + 16);
    ctx.fill();

    ctx.save();
    ctx.translate(-4, hip + 20);
    ctx.rotate(walk * 0.04);
    ctx.fillStyle = '#1a0c0a';
    ctx.fillRect(-3, 0, 6, 8);
    ctx.restore();
    ctx.save();
    ctx.translate(5, hip + 20);
    ctx.rotate(-walk * 0.04);
    ctx.fillStyle = '#120808';
    ctx.fillRect(-3, 0, 6, 8);
    ctx.restore();

    const torsoY = hip - 22;
    ctx.fillStyle = rgba(spec.haori, 1);
    ctx.beginPath();
    ctx.moveTo(-13, torsoY + 4);
    ctx.lineTo(13, torsoY + 4);
    ctx.lineTo(11, hip + 2);
    ctx.lineTo(-11, hip + 2);
    ctx.fill();
    ctx.fillStyle = rgba(spec.sash, 1);
    ctx.fillRect(-11, hip - 5, 22, 5);
    ctx.fillStyle = rgba(WHT, 0.35);
    ctx.fillRect(-2, torsoY + 6, 4, hip - (torsoY + 6) - 2);

    const pose = bladePose(f);
    ctx.save();
    ctx.translate(pose.ox, torsoY + 14 + pose.oy * 0.15);
    ctx.rotate(pose.ang);
    ctx.strokeStyle = rgba(spec.blade, 0.95);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(pose.len, 0);
    ctx.stroke();
    ctx.strokeStyle = rgba(WHT, 0.7);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(pose.len - 2, 0);
    ctx.stroke();
    ctx.fillStyle = rgba(spec.sash, 1);
    ctx.fillRect(-4, -3, 8, 6);
    ctx.restore();

    ctx.fillStyle = rgba(spec.haori, 1);
    ctx.save();
    ctx.translate(-11, torsoY + 10);
    ctx.rotate(f.atk ? -0.6 : 0.15);
    ctx.fillRect(-3, 0, 6, 16);
    ctx.fillStyle = rgba(spec.skin, 1);
    ctx.fillRect(-2, 14, 5, 5);
    ctx.restore();
    ctx.save();
    ctx.translate(10, torsoY + 10);
    ctx.rotate(f.atk ? 0.9 : -0.2);
    ctx.fillStyle = rgba(spec.haori, 1);
    ctx.fillRect(-3, 0, 6, 15);
    ctx.fillStyle = rgba(spec.skin, 1);
    ctx.fillRect(-2, 13, 5, 5);
    ctx.restore();

    const headY = torsoY - 2;
    ctx.fillStyle = rgba(spec.skin, 1);
    ctx.beginPath();
    ctx.arc(0, headY, 8.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(spec.hair, 1);
    ctx.beginPath();
    ctx.arc(0, headY - 1, 8.4, Math.PI, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, headY - 6, 4.5, 3.2, -0.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(spec.accent, 0.9);
    ctx.fillRect(-7, headY - 3, 14, 2);

    if (f.flashT > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, clamp(f.flashT * 6, 0, 0.55));
      ctx.fillRect(-16, torsoY - 14, 32, 58);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawMoonWave(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.face, 1);
    ctx.strokeStyle = rgba(p.rgb, 0.95);
    ctx.lineWidth = p.supered ? 4.2 : 3;
    ctx.beginPath();
    ctx.arc(0, 0, p.r, -1.15, 1.15);
    ctx.stroke();
    ctx.strokeStyle = rgba(WHT, 0.7);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(2, 0, p.r * 0.7, -1.0, 1.0);
    ctx.stroke();
    ctx.fillStyle = rgba(p.rgb, 0.18);
    ctx.beginPath();
    ctx.arc(0, 0, p.r + 6, 0, TAU);
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
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(0, 0, p.r * (1.15 - p.t), -1.2, 0.9);
      ctx.stroke();
      ctx.restore();
    }
    for (i = 0; i < G.moons.length; i++) drawMoonWave(G.moons[i]);
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

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#140404';
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
    drawPetals();
    if (G.p1 && G.p2) {
      if (G.p1.y <= G.p2.y) {
        drawFighter(G.p1);
        drawFighter(G.p2);
      } else {
        drawFighter(G.p2);
        drawFighter(G.p1);
      }
    }
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
      setKey('slash', down);
      if (down && !e.repeat) slashEdge.down = true;
    } else if (k === 'j' || k === 'J') {
      setKey('slash', down);
      if (down && !e.repeat) slashEdge.down = true;
    } else if (k === 'Shift' || c === 'ShiftLeft' || c === 'ShiftRight' || k === 'z' || k === 'Z') {
      setKey('spec', down);
      if (down && !e.repeat) specEdge.down = true;
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
  bindPad(padBtns.slash, function () { keys.slash = true; slashEdge.down = true; }, function () { keys.slash = false; });
  bindPad(padBtns.spec, function () { specEdge.down = true; }, function () {});

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
    } else if (Math.abs(dx) > 24) {
      if (dx < 0) { keys.l = true; setTimeout(function () { keys.l = false; }, 120); }
      else { keys.r = true; setTimeout(function () { keys.r = false; }, 120); }
    } else {
      slashEdge.down = true;
    }
  });
  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    audio.ensure();
  }, { passive: false });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = keys.slash = keys.spec = false;
    clearEdges();
  });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      last = 0;
      keys.l = keys.r = keys.u = keys.d = keys.slash = keys.spec = false;
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
