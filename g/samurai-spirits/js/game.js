'use strict';

/* 侍魂 — Samurai Shodown lite. No CDN. Distinct from 末刃 / 侍秋 / 红侠 / 战刃. */

(function () {
  const VW = 720;
  const VH = 400;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const GROUND = 340;
  const WALK = 152;
  const BACK = 118;
  const JUMP_V = 468;
  const GRAV = 1220;
  const MAX_FALL = 640;
  const ROUND_DUEL = 99;
  const ROUND_CHAIN = 70;
  const WINS_NEED = 2;
  const HP_DUEL = 96;
  const HP_CHAIN = 84;
  const COMBO_DUEL = 1.15;
  const COMBO_CHAIN = 1.5;
  const EDGE = 42;
  const GAP = 32;
  const METER_MAX = 100;
  const RAGE_CREST = 50;
  const RAGE_SPIN = 100;
  const LOCK_T = 0.85;
  const BEST_KEY = 'playbox-samurai-spirits-best';
  const MUTE_KEY = 'playbox-samurai-spirits-mute';
  const OPS = '方向 / WASD 走跳 · 空格斩 · Shift / Z 特技 · R 重开 · M 静音';

  const MAG = [255, 61, 120];
  const CYN = [78, 232, 200];
  const GOLD = [255, 210, 74];
  const HOT = [255, 74, 20];
  const HOT2 = [255, 122, 50];
  const WHT = [255, 244, 228];
  const SAK = [255, 138, 176];
  const SAND = [232, 200, 120];
  const SKIN = [232, 184, 152];
  const PINK = [255, 200, 210];

  const MOVES = {
    s1: { dur: 0.42, hit0: 0.08, hit1: 0.16, dmg: 16, stun: 0.28, kb: 70, range: 62, h0: 16, h1: 52, stop: 0.052, height: 'mid', score: 90, name: '斩' },
    s2: { dur: 0.38, hit0: 0.07, hit1: 0.16, dmg: 20, stun: 0.32, kb: 96, range: 68, h0: 12, h1: 58, stop: 0.062, height: 'mid', score: 140, name: '二斩' },
    s3: { dur: 0.44, hit0: 0.08, hit1: 0.2, dmg: 22, stun: 0.48, kb: 140, range: 70, h0: 8, h1: 60, stop: 0.072, height: 'mid', score: 180, knockdown: true, name: '三斩' },
    air: { dur: 0.34, hit0: 0.06, hit1: 0.24, dmg: 18, stun: 0.24, kb: 72, range: 54, h0: 6, h1: 48, stop: 0.054, height: 'high', score: 110, name: '跳斩' },
    low: { dur: 0.4, hit0: 0.1, hit1: 0.2, dmg: 14, stun: 0.5, kb: 150, range: 56, h0: 0, h1: 18, stop: 0.056, height: 'low', score: 100, knockdown: true, name: '下斩' },
    cres: { dur: 0.56, hit0: 0.1, hit1: 0.28, dmg: 26, stun: 0.36, kb: 80, range: 46, h0: 20, h1: 86, stop: 0.07, height: 'high', score: 280, knockdown: true, launch: true, cost: 50, name: '弧月斩' },
    spin: { dur: 0.72, hit0: 0.08, gap: 0.18, window: 0.1, multi: 3, dmg: 12, stun: 0.18, kb: 50, range: 50, h0: 8, h1: 56, stop: 0.048, height: 'mid', score: 160, knockdown: true, cost: 100, name: '旋风烈斩' }
  };

  const FIGHTERS = [
    {
      id: 'kon', name: '魂丸', en: 'KON',
      hp: HP_DUEL, hpChain: HP_CHAIN, walk: WALK, back: BACK, jump: JUMP_V, size: 1.04,
      haori: [236, 232, 214], sash: [196, 28, 24], hakama: [40, 16, 12],
      hair: [28, 16, 10], skin: SKIN, accent: GOLD, blade: GOLD, hat: true,
      ai: { agg: 0.6, spec: 0.26, jump: 0.22, think: 0.28, lock: 0.62 }
    },
    {
      id: 'sak', name: '樱巫', en: 'SAKURA',
      hp: HP_DUEL, hpChain: HP_CHAIN, walk: 176, back: 136, jump: 520, size: 0.92,
      haori: [255, 214, 222], sash: [255, 90, 140], hakama: [82, 24, 42],
      hair: [42, 16, 22], skin: PINK, accent: SAK, blade: SAK, feather: true,
      ai: { agg: 0.64, spec: 0.3, jump: 0.42, think: 0.2, lock: 0.55 }
    },
    {
      id: 'tsuba', name: '燕刺', en: 'TSUBA',
      hp: HP_CHAIN, hpChain: HP_CHAIN, walk: 188, back: 146, jump: 500, size: 0.96,
      haori: [28, 96, 64], sash: [200, 220, 90], hakama: [12, 36, 28],
      hair: [18, 28, 20], skin: SKIN, accent: [180, 255, 120], blade: [180, 255, 120], iaido: true,
      ai: { agg: 0.8, spec: 0.4, jump: 0.28, think: 0.13, lock: 0.72 }
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
    return chainMode() ? 1.32 : 1;
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
  function rageMul(f) {
    return 1 + (f.meter || 0) / 200;
  }

  function moveOf(kind) {
    const m = MOVES[kind];
    if (!m) return m;
    const t = timeMul();
    if (t === 1) return m;
    const o = {
      dur: m.dur * t,
      hit0: m.hit0 * t,
      hit1: m.hit1 * t,
      dmg: m.dmg,
      stun: m.stun * t,
      kb: m.kb,
      range: m.range,
      h0: m.h0,
      h1: m.h1,
      stop: Math.min(0.08, m.stop * 0.9),
      height: m.height,
      score: m.score,
      knockdown: m.knockdown,
      launch: m.launch,
      cost: m.cost,
      name: m.name,
      multi: m.multi,
      gap: m.gap ? m.gap * t : undefined,
      window: m.window ? m.window * t : undefined
    };
    return o;
  }

  function selfCheck() {
    if (WINS_NEED !== 2) throw new Error('2 wins');
    if (HP_DUEL !== 96) throw new Error('hp duel');
    if (HP_CHAIN !== 84) throw new Error('hp chain');
    if (ROUND_DUEL !== 99 || ROUND_CHAIN !== 70) throw new Error('timer');
    if (BEST_KEY !== 'playbox-samurai-spirits-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-samurai-spirits-mute') throw new Error('mute key');
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(2) !== 1) throw new Error('combo 2');
    if (comboMul(3) !== 2) throw new Error('combo 3');
    if (comboMul(9) !== 5) throw new Error('combo cap');
    const h = jumpHeight(JUMP_V, GRAV);
    if (h < 80 || h > 100) throw new Error('jump height ' + h);
    if (FIGHTERS.length !== 3) throw new Error('3 fighters');
    if (FIGHTERS[0].id !== 'kon' || FIGHTERS[1].id !== 'sak' || FIGHTERS[2].id !== 'tsuba') throw new Error('ids');
    if (MOVES.s1.dmg >= MOVES.s2.dmg) throw new Error('s2 stronger');
    if (MOVES.s2.range <= MOVES.s1.range) throw new Error('s2 reach');
    if (MOVES.s1.dur < 0.38) throw new Error('whiff recovery');
    if (MOVES.low.height !== 'low' || MOVES.air.height !== 'high') throw new Error('heights');
    if (MOVES.cres.proj || MOVES.spin.proj) throw new Error('no projectile');
    if (!MOVES.cres.launch) throw new Error('crescent launch');
    if (MOVES.spin.multi !== 3) throw new Error('spin hits');
    if (MOVES.cres.cost !== 50 || MOVES.spin.cost !== 100) throw new Error('rage cost');
    if (RAGE_CREST !== 50 || RAGE_SPIN !== 100) throw new Error('rage thresholds');
    if (LOCK_T < 0.7 || LOCK_T > 1) throw new Error('lock time');
    if (rageMul({ meter: 0 }) !== 1) throw new Error('rage 0');
    if (Math.abs(rageMul({ meter: 100 }) - 1.5) > 0.001) throw new Error('rage 100');
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
  const dust = [];

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
    lockT: 0,
    lockP1: 0,
    lockP2: 0,
    lockX: 360,
    lockY: 280,
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
      this.noise(heavy ? 0.1 : 0.06, heavy ? 0.1 : 0.065, heavy ? 520 : 1400, 'highpass');
      this.beep(heavy ? 128 : 220, 0.06, 'sawtooth', 0.034, 58);
    },
    hit: function (combo, heavy) {
      this.ensure();
      const p = 1 + Math.min(7, combo) * 0.07;
      this.noise(0.14, heavy ? 0.24 : 0.16, 180, 'lowpass');
      this.beep(170 * p, 0.11, 'square', 0.09, 52);
      this.beep((heavy ? 920 : 680) * p, 0.08, 'triangle', 0.05, 400 * p);
      if (heavy) this.beep(1240 * p, 0.1, 'square', 0.042, 1600 * p);
    },
    lock: function () {
      this.ensure();
      this.noise(0.16, 0.18, 1600, 'bandpass');
      this.beep(740, 0.12, 'square', 0.07, 180);
      this.beep(1680, 0.1, 'triangle', 0.05, 520);
      this.beep(90, 0.14, 'sawtooth', 0.05, 46);
    },
    lockTick: function () {
      this.ensure();
      this.beep(980, 0.04, 'square', 0.035, 620);
      this.noise(0.04, 0.06, 2200, 'bandpass');
    },
    lockWin: function () {
      this.ensure();
      this.noise(0.12, 0.14, 900, 'bandpass');
      this.beep(220, 0.12, 'sawtooth', 0.06, 90);
      this.beep(880, 0.1, 'square', 0.05, 1320);
    },
    cres: function () {
      this.ensure();
      this.noise(0.16, 0.14, 420, 'bandpass');
      this.beep(240, 0.18, 'sawtooth', 0.07, 90);
      this.beep(980, 0.14, 'triangle', 0.05, 420);
    },
    spin: function () {
      this.ensure();
      this.noise(0.28, 0.2, 280, 'bandpass');
      this.beep(140, 0.32, 'sawtooth', 0.08, 55);
      this.beep(660, 0.22, 'square', 0.05, 220);
      this.beep(1480, 0.18, 'triangle', 0.04, 880);
    },
    jump: function () {
      this.ensure();
      this.beep(360, 0.07, 'square', 0.03, 170);
    },
    land: function () {
      this.ensure();
      this.noise(0.05, 0.05, 260, 'lowpass');
    },
    hurt: function () {
      this.ensure();
      this.noise(0.16, 0.15, 220, 'lowpass');
      this.beep(260, 0.16, 'sawtooth', 0.05, 64);
    },
    ko: function () {
      this.ensure();
      this.noise(0.3, 0.22, 110, 'lowpass');
      this.beep(98, 0.34, 'sine', 0.09, 38);
      this.beep(164, 0.24, 'sawtooth', 0.05, 70);
    },
    slam: function () {
      this.ensure();
      this.noise(0.22, 0.2, 86, 'lowpass');
      this.beep(64, 0.2, 'sine', 0.09, 32);
    },
    bell: function () {
      this.ensure();
      this.beep(784, 0.16, 'sine', 0.06, 660);
      this.beep(1176, 0.1, 'triangle', 0.04, 880);
    },
    win: function () {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.05, 523);
      this.beep(523, 0.1, 'square', 0.05, 659);
      this.beep(784, 0.22, 'triangle', 0.045, 1046);
    },
    over: function () {
      this.ensure();
      this.beep(174, 0.18, 'sawtooth', 0.05, 86);
      this.beep(110, 0.28, 'square', 0.04, 52);
    },
    ui: function () {
      this.ensure();
      this.beep(620, 0.05, 'square', 0.035, 400);
    },
    combo: function (n) {
      this.ensure();
      this.beep(420 + n * 48, 0.08, 'square', 0.05, 840 + n * 52);
    },
    start: function () {
      this.ensure();
      this.beep(294, 0.08, 'square', 0.04, 392);
      this.beep(392, 0.1, 'triangle', 0.04, 588);
    },
    empty: function () {
      this.ensure();
      this.beep(130, 0.08, 'square', 0.03, 70);
    },
    rage: function () {
      this.ensure();
      this.noise(0.2, 0.14, 200, 'lowpass');
      this.beep(110, 0.22, 'sawtooth', 0.07, 220);
      this.beep(440, 0.16, 'square', 0.05, 880);
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
    slashes.push({ x: x, y: y, face: face, t: 0.2, rgb: rgb, r: r || 38 });
    capArr(slashes, 18);
  }
  function puff(x, y, n) {
    let i;
    const c = REDUCE ? Math.min(n, 3) : n;
    for (i = 0; i < c; i++) {
      dust.push({
        x: x + rand(-8, 8), y: y + rand(-2, 2),
        vx: rand(-40, 40), vy: rand(-30, -8),
        r: rand(3, 7), t: rand(0.18, 0.36), rgb: SAND
      });
    }
    capArr(dust, 40);
  }
  function spawnPetal() {
    const dense = chainMode() ? 1.8 : 1;
    if (REDUCE) return;
    if (petals.length > (chainMode() ? 56 : 32)) return;
    const roll = Math.random();
    petals.push({
      x: rand(-20, VW + 20),
      y: rand(-30, 80),
      vx: rand(-22, 14) * dense,
      vy: rand(26, 58) * dense,
      a: rand(0, TAU),
      va: rand(-3.4, 3.4),
      s: rand(2.4, 4.8),
      rgb: roll < 0.55 ? SAK : (roll < 0.82 ? PINK : GOLD),
      t: rand(4, 8)
    });
  }
  function seedPetals() {
    petals.length = 0;
    let i;
    const n = REDUCE ? 6 : (chainMode() ? 26 : 16);
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
    for (i = dust.length - 1; i >= 0; i--) {
      p = dust[i];
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.r += 8 * dt;
      if (p.t <= 0) dust.splice(i, 1);
    }
    for (i = petals.length - 1; i >= 0; i--) {
      p = petals[i];
      p.t -= dt;
      p.x += p.vx * dt + Math.sin(p.a) * 14 * dt;
      p.y += p.vy * dt;
      p.a += p.va * dt;
      if (p.t <= 0 || p.y > GROUND + 8) petals.splice(i, 1);
    }
    if (!REDUCE && Math.random() < (chainMode() ? 0.28 : 0.14)) spawnPetal();
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
      _raged: false,
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
    if (into === 'cres' || into === 'spin') return k === 's1' || k === 's2' || k === 's3';
    return false;
  }
  function bodyBox(f) {
    const crouch = f.crouch && f.grounded && !f.atk;
    const h = f.ko && f.grounded ? 16 : crouch ? 32 : 56 * (f.spec.size || 1);
    const w = 20 * (f.spec.size || 1);
    return { x: f.x - w / 2, y: f.y - h, w: w, h: h };
  }
  function liveHitIndex(f) {
    if (!f.atk) return -1;
    const m = f.atk.def;
    if (!m.multi) {
      if (f.atk.t < m.hit0 || f.atk.t > m.hit1) return -1;
      if (f.atk.spentMask) return -1;
      return 0;
    }
    let i;
    for (i = 0; i < m.multi; i++) {
      const t0 = m.hit0 + i * m.gap;
      const t1 = t0 + m.window;
      if (f.atk.t >= t0 && f.atk.t <= t1 && !(f.atk.spentMask & (1 << i))) return i;
    }
    return -1;
  }
  function atkBox(f) {
    if (!f.atk) return null;
    const m = f.atk.def;
    const idx = liveHitIndex(f);
    if (idx < 0) return null;
    const face = f.face;
    const x0 = f.x + face * 10;
    const x1 = f.x + face * (10 + m.range);
    const x = Math.min(x0, x1);
    const w = Math.abs(x1 - x0);
    const y0 = f.y - m.h1;
    const h = Math.max(6, m.h1 - m.h0);
    return { x: x, y: y0, w: w, h: h, i: idx };
  }

  function addMeter(f, n) {
    const gain = n * (chainMode() ? 1.2 : 1);
    const was = f.meter;
    f.meter = clamp(f.meter + gain, 0, METER_MAX);
    if (f.meter >= METER_MAX && was < METER_MAX && !f._raged) {
      f._raged = true;
      burst(f.x, f.y - 36, GOLD, 16, 220);
      ringAt(f.x, f.y - 30, GOLD);
      audio.rage();
      if (G.mode === 'play' && f === G.p1) toast('怒气全开！', 'gold');
    }
    if (f.meter < METER_MAX) f._raged = false;
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
      if (f.meter < METER_MAX) f._raged = false;
      G.hudDirty = true;
    }
    f.atk = { kind: kind, t: 0, spentMask: 0, def: def, hit: false };
    f.crouch = kind === 'low';
    if (kind === 'cres') {
      f.grounded = false;
      f.vy = -(specJump(f) * 0.86);
      f.vx = f.face * 88 * speedMul();
      f.airSlash = true;
      f.airT = 0.001;
      flash(f.spec.blade, 0.14);
      kickStage('spec');
      audio.cres();
      burst(f.x + f.face * 10, f.y - 44, f.spec.blade, 16, 220);
      ringAt(f.x, f.y - 36, GOLD);
      if (G.mode === 'play' && f === G.p1) toast('弧月斩！', 'gold');
    } else if (kind === 'spin') {
      flash(GOLD, 0.2);
      kickStage('spec');
      audio.spin();
      burst(f.x, f.y - 32, GOLD, 22, 260);
      ringAt(f.x, f.y - 28, HOT);
      if (G.mode === 'play' && f === G.p1) toast('旋风烈斩！', 'gold');
    } else {
      audio.swing(kind === 's2' || kind === 's3' || kind === 'low');
    }
    return true;
  }

  function specJump(f) {
    return f.spec.jump || JUMP_V;
  }

  function trySlash(f) {
    if (!canAct(f) && !(f.atk && (canCancel(f, 's2') || canCancel(f, 's3')))) return false;
    if (!f.grounded) {
      if (f.airSlash) return false;
      if (f.atk && f.atk.kind === 'cres') return false;
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
    const kind = f.meter >= RAGE_SPIN ? 'spin' : 'cres';
    if (kind === 'spin' && !f.grounded) return false;
    if (f.atk && !canCancel(f, kind) && !canAct(f)) return false;
    return startAtk(f, kind);
  }

  function applyHit(att, vic, move, hx, hy, spinLast) {
    if (vic.ko || vic.win) return false;
    if (vic.invuln > 0) return false;
    const dmg = Math.max(1, Math.round(move.dmg * rageMul(att)));
    const heavy = dmg >= 18 || move.knockdown || move.launch || !!spinLast;
    vic.hp -= dmg;
    vic.hurtT = move.stun;
    vic.atk = null;
    vic.crouch = false;
    vic.flashT = 0.1;
    vic.vx = att.face * move.kb;
    addMeter(vic, heavy ? 16 : 11);
    addMeter(att, 5);
    const knock = move.knockdown || (move.multi && spinLast) || vic.hp <= 0 || move.launch;
    if (knock) {
      vic.vy = vic.hp <= 0 ? -280 : (move.launch ? -240 : -176);
      vic.grounded = false;
      vic.airT = 0.01;
      vic.airSlash = false;
    } else if (!vic.grounded) {
      vic.vy = Math.min(vic.vy, -70);
    }
    sparkAt(hx, hy, heavy ? GOLD : WHT);
    burst(hx, hy, heavy ? HOT : GOLD, heavy ? 18 : 12, heavy ? 280 : 190);
    ringAt(hx, hy, att.spec.blade);
    slashArc(hx, hy, att.face, att.spec.blade, heavy ? 52 : 34);
    audio.hit(G.combo + 1, heavy);
    hitStop(REDUCE ? 0 : (vic.hp <= 0 ? 0.08 : move.stop));
    shake(vic.hp <= 0 ? 1.15 : heavy ? 0.58 : 0.3);
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

  function beginLock(hx, hy) {
    G.phase = 'lock';
    G.lockT = LOCK_T;
    G.lockP1 = 0;
    G.lockP2 = 0;
    G.lockX = hx;
    G.lockY = hy;
    if (G.p1.atk) G.p1.atk.spentMask = 255;
    if (G.p2.atk) G.p2.atk.spentMask = 255;
    G.p1.vx = -G.p1.face * 28;
    G.p2.vx = -G.p2.face * 28;
    sparkAt(hx, hy, GOLD);
    burst(hx, hy, WHT, 18, 260);
    burst(hx, hy, GOLD, 10, 180);
    ringAt(hx, hy, GOLD);
    slashArc(hx, hy, 1, GOLD, 44);
    slashArc(hx, hy, -1, CYN, 44);
    audio.lock();
    hitStop(REDUCE ? 0 : 0.06);
    shake(0.48);
    kickStage('clash');
    flash(SAND, 0.12);
    callout('刃锁', 0.55);
    if (G.mode === 'play') floatTxt('刃锁', hx, hy - 36, GOLD);
  }

  function resolveLock() {
    const p = G.lockP1;
    const c = G.lockP2;
    const hx = G.lockX;
    const hy = G.lockY;
    G.phase = 'fight';
    G.lockT = 0;
    if (G.p1.atk) G.p1.atk = null;
    if (G.p2.atk) G.p2.atk = null;
    addMeter(G.p1, 8);
    addMeter(G.p2, 8);
    if (p === c) {
      G.p1.vx = -G.p1.face * 110;
      G.p2.vx = -G.p2.face * 110;
      G.p1.hurtT = 0.12;
      G.p2.hurtT = 0.12;
      burst(hx, hy, WHT, 12, 180);
      audio.lockTick();
      if (G.mode === 'play') addScore(40, hx, hy - 16, CYN);
      floatTxt('两立', hx, hy - 32, SAND);
      return;
    }
    const pWin = p > c;
    const win = pWin ? G.p1 : G.p2;
    const lose = pWin ? G.p2 : G.p1;
    lose.hurtT = 0.42;
    lose.vx = -lose.face * 168;
    lose.flashT = 0.12;
    win.vx = win.face * 36;
    win.invuln = 0.08;
    sparkAt(hx, hy, pWin ? GOLD : CYN);
    burst(hx, hy, HOT, 16, 240);
    ringAt(hx, hy, GOLD);
    audio.lockWin();
    hitStop(REDUCE ? 0 : 0.05);
    shake(0.4);
    kickStage('boom');
    floatTxt(pWin ? '压刃' : '被压', hx, hy - 36, pWin ? GOLD : MAG);
    if (G.mode === 'play' && pWin) addScore(80, hx, hy - 16, GOLD);
  }

  function tickLock(dt) {
    G.lockT -= dt;
    sparkAt(G.lockX + rand(-6, 6), G.lockY + rand(-6, 6), Math.random() < 0.5 ? GOLD : WHT);
    if ((G.clock * 60 | 0) % 3 === 0) slashArc(G.lockX, G.lockY, Math.random() < 0.5 ? 1 : -1, GOLD, 28);
    if (slashEdge.down && G.mode === 'play') {
      slashEdge.down = false;
      G.lockP1 += 1;
      audio.lockTick();
    }
    if (G.p2 && G.p2.cpu) {
      const rate = (G.p2.spec.ai.lock || 0.5) * (chainMode() ? 1.15 : 1);
      if (Math.random() < rate * dt * 9) G.lockP2 += 1;
    }
    if (G.p1 && G.p1.cpu && G.mode === 'title') {
      if (Math.random() < 0.55 * dt * 9) G.lockP1 += 1;
    }
    G.p1.x = lerp(G.p1.x, G.lockX - 22 * G.p1.face, 0.18);
    G.p2.x = lerp(G.p2.x, G.lockX - 22 * G.p2.face, 0.18);
    if (G.lockT <= 0) resolveLock();
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
    puff(f.x, f.y, 8);
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
        if (f.keys.l) f.vx -= 48 * dt;
        if (f.keys.r) f.vx += 48 * dt;
        f.vx = clamp(f.vx, -190, 190);
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
        if (ax) f.step += dt * 9 * sm;
      }
      if (f.keys.u && !f.crouch) {
        f.grounded = false;
        f.vy = -(spec.jump || JUMP_V);
        f.jdir = 0;
        if (f.keys.l && !f.keys.r) f.jdir = -1;
        else if (f.keys.r && !f.keys.l) f.jdir = 1;
        f.vx = f.jdir * spec.walk * sm * 0.88;
        f.airT = 0.001;
        f.airSlash = false;
        audio.jump();
        puff(f.x, f.y, 4);
      }
    } else if (f.grounded && f.atk) {
      if (f.atk.kind === 'spin') f.vx = f.face * 70 * sm;
      else f.vx *= 0.46;
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
      if (k === 'spin') {
        trailAt(f.x + f.face * 18, f.y - 30, f.spec.blade, 10);
        if ((G.clock * 60 | 0) % 2 === 0) {
          slashArc(f.x + f.face * 22, f.y - 32, f.face, f.spec.blade, 36);
        }
      } else if (liveHitIndex(f) >= 0 && (G.clock * 60 | 0) % 2 === 0) {
        slashArc(f.x + f.face * (18 + m.range * 0.45), f.y - (m.h0 + m.h1) * 0.5, f.face, f.spec.blade, 30);
      }
      if (f.atk.t >= m.dur) f.atk = null;
    }

    if (f.meter >= METER_MAX && !REDUCE && Math.random() < 0.35) {
      particles.push({
        x: f.x + rand(-12, 12), y: f.y - rand(10, 50),
        vx: rand(-20, 20), vy: rand(-40, -8),
        r: rand(1.2, 2.4), rgb: GOLD, t: 0.28, max: 0.28, g: 40
      });
    }

    f.x += f.vx * dt;
    f.y += f.vy * dt;
    if (f.y >= GROUND) {
      if (!f.grounded) {
        if (f.vy > 120) {
          audio.land();
          puff(f.x, f.y, 5);
        }
        if (f.atk && (f.atk.kind === 'air' || f.atk.kind === 'cres')) f.atk = null;
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
    const p1hit = !!(a && G.p1.atk && aabb(a, hb1));
    const p2hit = !!(b && G.p2.atk && aabb(b, hb2));
    const blades = !!(a && b && aabb(a, b));
    const bothMid = G.p1.atk && G.p2.atk && G.p1.atk.def.height !== 'low' && G.p2.atk.def.height !== 'low';
    if (blades && bothMid) {
      beginLock((G.p1.x + G.p2.x) / 2, GROUND - 38);
      return;
    }
    if (p1hit) {
      const i = a.i | 0;
      G.p1.atk.spentMask |= (1 << i);
      G.p1.atk.hit = true;
      const last = G.p1.atk.def.multi ? (i >= G.p1.atk.def.multi - 1) : false;
      applyHit(G.p1, G.p2, G.p1.atk.def, G.p2.x - G.p2.face * 8, G.p2.y - 36, last);
    }
    if (p2hit) {
      const i = b.i | 0;
      G.p2.atk.spentMask |= (1 << i);
      G.p2.atk.hit = true;
      const last = G.p2.atk.def.multi ? (i >= G.p2.atk.def.multi - 1) : false;
      applyHit(G.p2, G.p1, G.p2.atk.def, G.p1.x - G.p1.face * 8, G.p1.y - 36, last);
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

    const incoming = p.atk && dist < 86 && p.atk.t < (p.atk.def.hit1 || 0.2);
    const r = Math.random();
    if (incoming && r < ai.jump + 0.1) {
      f.plan = { type: 'jump', dir: -f.face, t: 0.22 };
    } else if (incoming && r < ai.lock && f.meter < RAGE_SPIN) {
      f.plan = { type: 'slash', t: 0.16 };
    } else if (p.airT > 0.06 && dist < 110 && p.y < f.y - 20 && f.grounded) {
      f.plan = { type: r < 0.4 ? 'slash' : (f.meter >= RAGE_CREST ? 'spec' : 'slash'), t: 0.22 };
    } else if (dist > 200) {
      if (r < ai.spec && f.meter >= RAGE_CREST) f.plan = { type: 'spec', t: 0.36 };
      else f.plan = { type: 'walk', dir: f.face, t: 0.4 };
    } else if (dist > 92) {
      if (r < ai.spec * 0.55 && f.meter >= RAGE_CREST) f.plan = { type: 'spec', t: 0.32 };
      else if (r < ai.spec * 0.55 + ai.jump) f.plan = { type: 'jumpin', t: 0.48 };
      else if (r < 0.82) f.plan = { type: 'walk', dir: f.face, t: 0.26 };
      else f.plan = { type: 'back', t: 0.18 };
    } else {
      if (r < ai.agg * 0.48) f.plan = { type: 'slash', t: 0.2 };
      else if (r < ai.agg * 0.7) f.plan = { type: 'low', t: 0.24 };
      else if (r < ai.agg && f.meter >= RAGE_CREST) f.plan = { type: 'spec', t: 0.28 };
      else if (r < ai.agg + 0.12) f.plan = { type: 'jumpin', t: 0.38 };
      else f.plan = { type: 'back', t: 0.16 };
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
    G.p2 = makeFighter(cSpec, 552, -1, true, chainMode() ? cSpec.hpChain : cSpec.hp);
    G.p1.maxHp = G.p1.hp = hp;
    G.p2.maxHp = G.p2.hp = chainMode() ? cSpec.hpChain : cSpec.hp;
    G.timer = roundTime();
    G.phase = 'intro';
    G.introT = 1.35;
    G.koT = 0;
    G.lockT = 0;
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
    toast((chainMode() ? '连斩' : '侍魂') + ' · ' + foeSpec().name);
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
    G.call = '';
    seedPetals();
    overlay.classList.remove('hidden', 'end');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.remove('win', 'lose');
    ovKicker.textContent = 'SSPR';
    ovTitle.textContent = '侍魂';
    ovLead.innerHTML = '落日对刀。空格斩，上跳，Shift 弧月。怒气满了旋风。先赢两局。';
    ovOps.textContent = OPS;
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    G.hudDirty = true;
    if (hintEl) {
      hintEl.textContent = '空格斩 · 上跳 · 下扫 · Shift 弧月 · 怒满旋风 · 先赢两局';
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
    ovKicker.textContent = win ? 'SSPR' : 'KO';
    ovTitle.textContent = win ? (chainMode() ? '连尽' : '魂尽') : '魂折';
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
    toast((pWin ? '魂丸' : G.p2.spec.name) + ' 拿下第 ' + G.round + ' 局', pWin ? 'gold' : 'warn');
    if (G.pWins >= WINS_NEED || G.cWins >= WINS_NEED) {
      const matchWin = G.pWins >= WINS_NEED;
      if (matchWin && G.mode === 'play') addScore(chainMode() ? 2800 : 2200, VW / 2, 100, CYN);
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
      if (G.phase === 'lock') {
        tickLock(dt);
        return;
      }
      cpuThink(G.p1, dt);
      cpuThink(G.p2, dt);
      tickFighter(G.p1, dt, true);
      tickFighter(G.p2, dt, true);
      separate(G.p1, G.p2);
      tickHits();
      if (G.p1.ko || G.p2.ko) {
        G.koT -= dt;
        if (G.koT <= 0) finishKo();
      }
      return;
    }

    if (G.mode === 'end') {
      tickFighter(G.p1, dt, false);
      tickFighter(G.p2, dt, false);
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

    if (G.phase === 'lock') {
      tickLock(dt);
      return;
    }

    if (G.phase === 'ko') {
      tickFighter(G.p1, dt, false);
      tickFighter(G.p2, dt, false);
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
      modeLabel.textContent = chainMode() ? '连斩' : '侍魂';
      modeLabel.classList.toggle('chain', chainMode());
    }
    if (tagLabel) {
      tagLabel.textContent = G.p2 && G.p2.spec ? G.p2.spec.name : '—';
      tagLabel.className = G.p2 && G.p2.hp < G.p2.maxHp * 0.28 ? 'warn' : '';
    }
    if (roundLabel) roundLabel.textContent = '第' + G.round + '局';
    if (p1NameEl) p1NameEl.textContent = G.p1 && G.p1.spec ? G.p1.spec.name : '魂丸';
    if (p2NameEl) p2NameEl.textContent = G.p2 && G.p2.spec ? G.p2.spec.name : '樱巫';
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
    g.addColorStop(0, chainMode() ? '#3a1020' : '#3a1808');
    g.addColorStop(0.28, chainMode() ? '#281018' : '#2a140c');
    g.addColorStop(0.62, chainMode() ? '#14080c' : '#160a06');
    g.addColorStop(1, '#0c0604');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    const sx = 560;
    const sy = 72;
    const glow = ctx.createRadialGradient(sx, sy, 10, sx, sy, 110);
    glow.addColorStop(0, rgba(HOT2, 0.95));
    glow.addColorStop(0.28, rgba(HOT, 0.45));
    glow.addColorStop(1, rgba(HOT, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, sy, 110, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(sx, sy, 30, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.55);
    ctx.beginPath();
    ctx.arc(sx - 8, sy - 7, 11, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(18, 8, 8, 0.92)';
    ctx.beginPath();
    ctx.moveTo(40, GROUND);
    ctx.lineTo(90, 168);
    ctx.lineTo(132, 188);
    ctx.lineTo(168, 150);
    ctx.lineTo(214, GROUND);
    ctx.fill();
    ctx.fillStyle = 'rgba(22, 10, 8, 0.88)';
    ctx.beginPath();
    ctx.moveTo(VW - 240, GROUND);
    ctx.lineTo(VW - 190, 176);
    ctx.lineTo(VW - 150, 198);
    ctx.lineTo(VW - 108, 142);
    ctx.lineTo(VW - 48, GROUND);
    ctx.fill();

    ctx.fillStyle = 'rgba(90, 22, 16, 0.72)';
    ctx.fillRect(318, 196, 10, GROUND - 196);
    ctx.fillRect(392, 196, 10, GROUND - 196);
    ctx.fillStyle = 'rgba(140, 36, 22, 0.8)';
    ctx.beginPath();
    ctx.moveTo(300, 198);
    ctx.lineTo(360, 158);
    ctx.lineTo(420, 198);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(60, 16, 12, 0.75)';
    ctx.fillRect(348, 198, 24, GROUND - 198);

    ctx.fillStyle = 'rgba(28, 12, 10, 0.7)';
    ctx.fillRect(78, 210, 14, GROUND - 210);
    ctx.fillRect(VW - 96, 204, 14, GROUND - 204);
    ctx.strokeStyle = rgba(HOT2, 0.35);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(70, 216);
    ctx.lineTo(100, 216);
    ctx.moveTo(VW - 104, 210);
    ctx.lineTo(VW - 74, 210);
    ctx.stroke();

    let i;
    for (i = 0; i < 4; i++) {
      const lx = 70 + i * 70;
      ctx.fillStyle = rgba(SAND, 0.14);
      ctx.fillRect(lx, 128, 3, 28);
      ctx.fillStyle = rgba(SAK, 0.5);
      ctx.beginPath();
      ctx.ellipse(lx + 1.5, 124, 7, 9, 0, 0, TAU);
      ctx.fill();
    }

    const floor = ctx.createLinearGradient(0, GROUND - 8, 0, VH);
    floor.addColorStop(0, chainMode() ? '#3a1418' : '#2c1610');
    floor.addColorStop(1, '#120604');
    ctx.fillStyle = floor;
    ctx.fillRect(0, GROUND, VW, VH - GROUND);
    ctx.strokeStyle = rgba(HOT, 0.28);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND);
    ctx.lineTo(VW, GROUND);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(90, 40, 20, 0.35)';
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
      ctx.lineTo(16 + i * 92, VH);
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
      ctx.fillStyle = rgba(p.rgb, 0.72);
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
    if (G.phase === 'lock') return { ang: -0.35, len: 58, ox: 16, oy: -6 };
    if (f.ko && f.grounded) return { ang: 1.4, len: 50, ox: 8, oy: 8 };
    if (f.hurtT > 0) return { ang: -0.45, len: 52, ox: -6, oy: -8 };
    if (k === 's1') return { ang: lerp(-2.55, 0.55, clamp(u / 0.48, 0, 1)), len: 66, ox: 10, oy: -10 };
    if (k === 's2') return { ang: lerp(-2.8, 1.15, clamp(u / 0.42, 0, 1)), len: 70, ox: 8, oy: -18 };
    if (k === 's3') return { ang: -2.3 + u * 6.6, len: 72, ox: 6, oy: -14 };
    if (k === 'air') return { ang: lerp(-2.7, 1.25, clamp(u / 0.4, 0, 1)), len: 62, ox: 6, oy: 4 };
    if (k === 'low') return { ang: lerp(-0.15, 0.75, clamp(u / 0.4, 0, 1)), len: 58, ox: 12, oy: 18 };
    if (k === 'cres') return { ang: lerp(-2.9, -0.2, clamp(u / 0.5, 0, 1)), len: 68, ox: 6, oy: -22 };
    if (k === 'spin') return { ang: u * 18.4, len: 64, ox: 4, oy: -10 };
    if (f.win) return { ang: -2.55, len: 64, ox: 4, oy: -24 };
    if (f.crouch) return { ang: 0.55, len: 48, ox: 10, oy: 10 };
    if (f.spec.iaido) return { ang: 1.55, len: 54, ox: -14, oy: 8 };
    return { ang: 2.45, len: 58, ox: -12, oy: -4 };
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

    if (f.meter >= METER_MAX && !koDown) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(GOLD, 0.12 + 0.08 * Math.sin(G.clock * 8));
      ctx.beginPath();
      ctx.ellipse(0, -28, 22, 36, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    if (koDown) {
      ctx.rotate(1.45);
      ctx.translate(0, -10);
    } else if (f.hurtT > 0) {
      ctx.rotate(-0.18);
    } else if (!f.grounded) {
      ctx.rotate(f.vy < 0 ? -0.14 : 0.2);
    } else if (f.atk && f.atk.kind === 'spin') {
      ctx.rotate(f.atk.t * 14);
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
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(pose.len, 0);
    ctx.stroke();
    ctx.strokeStyle = rgba(WHT, 0.72);
    ctx.lineWidth = 0.9;
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
    ctx.rotate(f.atk ? -0.62 : 0.15);
    ctx.fillRect(-3, 0, 6, 16);
    ctx.fillStyle = rgba(spec.skin, 1);
    ctx.fillRect(-2, 14, 5, 5);
    ctx.restore();
    ctx.save();
    ctx.translate(10, torsoY + 10);
    ctx.rotate(f.atk ? 0.95 : -0.2);
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
    if (spec.feather) {
      ctx.beginPath();
      ctx.ellipse(8, headY - 8, 3.2, 7, -0.5, 0, TAU);
      ctx.fillStyle = rgba(SAK, 0.95);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(8, headY - 6, 4.5, 3.2, -0.4, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = rgba(spec.accent, 0.9);
    ctx.fillRect(-7, headY - 3, 14, 2);

    if (spec.hat) {
      ctx.fillStyle = rgba(SAND, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, headY - 5, 13, 3.2, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, headY - 8.5, 6.2, 3.6, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.fillRect(-3, headY - 8, 6, 1.4);
    }

    if (f.flashT > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, clamp(f.flashT * 6, 0, 0.55));
      ctx.fillRect(-16, torsoY - 14, 32, 58);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawLockPrompt() {
    if (G.phase !== 'lock') return;
    const a = 0.7 + 0.3 * Math.sin(G.clock * 16);
    ctx.save();
    ctx.font = '800 16px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = rgba(GOLD, a);
    ctx.fillText('连砸 斩！', VW / 2, 128);
    ctx.font = '700 13px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillStyle = rgba(WHT, 0.85);
    ctx.fillText(G.lockP1 + '  :  ' + G.lockP2, VW / 2, 148);
    const w = 120;
    const t = clamp(G.lockT / LOCK_T, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(VW / 2 - w / 2, 156, w, 5);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(VW / 2 - w / 2, 156, w * t, 5);
    ctx.restore();
  }

  function drawFx() {
    let i, p;
    for (i = 0; i < dust.length; i++) {
      p = dust[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.t * 2.4, 0, 0.35));
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.r, p.r * 0.5, 0, 0, TAU);
      ctx.fill();
    }
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
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.arc(0, 0, p.r * (1.18 - p.t), -1.25, 0.95);
      ctx.stroke();
      ctx.restore();
    }
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
    ctx.fillStyle = '#160802';
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
    drawLockPrompt();
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
