'use strict';

/* 街霸 — Street Fighter lite. No CDN. */

(function () {
  const VW = 640;
  const VH = 360;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const GROUND = 308;
  const WALK = 158;
  const BACK = 118;
  const JUMP_V = 478;
  const GRAV = 1450;
  const MAX_FALL = 640;
  const ROUND_TIME = 99;
  const WINS_NEED = 2;
  const HP_BASE = 100;
  const COMBO_WIN = 1.15;
  const EDGE = 36;
  const GAP = 28;
  const BEST_KEY = 'playbox-street-fist-best';
  const MUTE_KEY = 'playbox-street-fist-mute';
  const OPS = '方向键 / WASD 走跳蹲 · Z 轻拳 · X 重拳 · C 踢 · 下前拳 气波 · 前跳 Z 升龙 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 46, 10];
  const HOT2 = [255, 106, 58];
  const WHT = [246, 241, 238];
  const LEAF = [61, 255, 122];
  const SKIN = [232, 184, 148];

  const MOVES = {
    lp: { dur: 0.18, hit0: 0.04, hit1: 0.12, dmg: 8, stun: 0.22, kb: 48, range: 34, h0: 30, h1: 52, stop: 0.04, height: 'mid', score: 50, chip: 0, block: 0.16, name: '轻拳' },
    hp: { dur: 0.34, hit0: 0.08, hit1: 0.2, dmg: 16, stun: 0.3, kb: 96, range: 42, h0: 26, h1: 54, stop: 0.07, height: 'mid', score: 110, chip: 0, block: 0.26, name: '重拳' },
    kick: { dur: 0.26, hit0: 0.06, hit1: 0.17, dmg: 12, stun: 0.24, kb: 74, range: 50, h0: 8, h1: 30, stop: 0.054, height: 'mid', score: 80, chip: 0, block: 0.2, name: '踢' },
    clp: { dur: 0.16, hit0: 0.03, hit1: 0.11, dmg: 7, stun: 0.2, kb: 36, range: 30, h0: 8, h1: 32, stop: 0.034, height: 'mid', score: 45, chip: 0, block: 0.14, name: '蹲拳' },
    chp: { dur: 0.3, hit0: 0.08, hit1: 0.18, dmg: 14, stun: 0.26, kb: 84, range: 38, h0: 6, h1: 34, stop: 0.058, height: 'mid', score: 95, chip: 0, block: 0.22, name: '蹲重' },
    sweep: { dur: 0.4, hit0: 0.1, hit1: 0.22, dmg: 12, stun: 0.5, kb: 150, range: 48, h0: 0, h1: 16, stop: 0.062, height: 'low', score: 90, chip: 0, block: 0.28, knockdown: true, name: '扫腿' },
    jlp: { dur: 0.22, hit0: 0.03, hit1: 0.2, dmg: 8, stun: 0.18, kb: 40, range: 32, h0: 22, h1: 50, stop: 0.04, height: 'high', score: 55, chip: 0, block: 0.16, name: '跳拳' },
    jhp: { dur: 0.28, hit0: 0.04, hit1: 0.24, dmg: 14, stun: 0.22, kb: 70, range: 38, h0: 18, h1: 52, stop: 0.056, height: 'high', score: 100, chip: 0, block: 0.2, name: '跳重' },
    jkick: { dur: 0.3, hit0: 0.05, hit1: 0.26, dmg: 12, stun: 0.22, kb: 80, range: 46, h0: 4, h1: 28, stop: 0.05, height: 'high', score: 90, chip: 0, block: 0.2, name: '跳踢' },
    hadou: { dur: 0.52, hit0: 0.18, hit1: 0.28, dmg: 14, stun: 0.28, kb: 70, range: 22, h0: 28, h1: 46, stop: 0.06, height: 'mid', score: 160, chip: 3, block: 0.24, proj: true, name: '气波' },
    dp: { dur: 0.48, hit0: 0.04, hit1: 0.28, dmg: 22, stun: 0.4, kb: 130, range: 36, h0: 20, h1: 70, stop: 0.078, height: 'mid', score: 220, chip: 4, block: 0.3, knockdown: true, name: '升龙' }
  };

  const FIGHTERS = [
    {
      id: 'chi', name: '赤拳', en: 'CRIMSON',
      hp: 100, walk: 158, back: 118, jump: 478, size: 1,
      gi: [220, 36, 28], sash: [244, 236, 220], pants: [176, 24, 20],
      hair: [28, 18, 16], band: [244, 236, 228], skin: SKIN,
      accent: GOLD, ball: CYN,
      ai: { agg: 0.56, fire: 0.26, block: 0.4, jump: 0.22, anti: 0.48, think: 0.28 }
    },
    {
      id: 'qing', name: '青影', en: 'AZURE',
      hp: 100, walk: 176, back: 132, jump: 500, size: 0.98,
      gi: [16, 168, 196], sash: [220, 250, 255], pants: [10, 110, 132],
      hair: [18, 40, 52], band: null, skin: SKIN,
      accent: CYN, ball: [120, 255, 255],
      ai: { agg: 0.62, fire: 0.22, block: 0.38, jump: 0.34, anti: 0.55, think: 0.24 }
    },
    {
      id: 'tie', name: '铁腕', en: 'IRON',
      hp: 118, walk: 128, back: 96, jump: 430, size: 1.12,
      gi: [168, 64, 28], sash: [255, 196, 80], pants: [92, 36, 16],
      hair: [42, 28, 18], band: [48, 28, 16], skin: [214, 162, 118],
      accent: HOT2, ball: [255, 168, 64],
      ai: { agg: 0.8, fire: 0.12, block: 0.3, jump: 0.1, anti: 0.4, think: 0.32 }
    },
    {
      id: 'zi', name: '紫焰', en: 'VIOLET',
      hp: 96, walk: 170, back: 140, jump: 492, size: 1,
      gi: [168, 36, 140], sash: [255, 180, 230], pants: [92, 16, 78],
      hair: [48, 12, 40], band: [255, 210, 80], skin: SKIN,
      accent: MAG, ball: MAG,
      ai: { agg: 0.42, fire: 0.5, block: 0.52, jump: 0.26, anti: 0.6, think: 0.22 }
    },
    {
      id: 'jin', name: '金霸', en: 'GOLD',
      hp: 132, walk: 150, back: 118, jump: 468, size: 1.14,
      gi: [212, 156, 28], sash: [255, 240, 180], pants: [140, 92, 16],
      hair: [24, 16, 10], band: [255, 220, 80], skin: [232, 196, 140],
      accent: GOLD, ball: GOLD,
      ai: { agg: 0.72, fire: 0.32, block: 0.5, jump: 0.2, anti: 0.74, think: 0.18 }
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
  function fighterAt(i) {
    return FIGHTERS[((i | 0) % FIGHTERS.length + FIGHTERS.length) % FIGHTERS.length];
  }
  function gauntFoe(fight) {
    const cycle = ((fight | 0) - 1) % 4;
    return FIGHTERS[cycle + 1];
  }
  function gauntScale(fight) {
    const loop = Math.max(0, Math.floor(((fight | 0) - 1) / 4));
    return 1 + Math.min(0.55, loop * 0.12);
  }
  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function stickNum(keys, face) {
    let x = 0;
    let y = 0;
    if (keys.l) x -= 1;
    if (keys.r) x += 1;
    if (keys.u) y -= 1;
    if (keys.d) y += 1;
    const fx = x * (face >= 0 ? 1 : -1);
    const col = fx < 0 ? 0 : fx > 0 ? 2 : 1;
    const row = y > 0 ? 0 : y < 0 ? 2 : 1;
    return row * 3 + col + 1;
  }
  function hasQCF(buf, clock) {
    let i;
    let saw6 = -1;
    for (i = buf.length - 1; i >= 0; i--) {
      if (clock - buf[i].t > 0.42) break;
      if (saw6 < 0 && buf[i].d === 6) saw6 = i;
      if (saw6 >= 0 && i < saw6 && (buf[i].d === 2 || buf[i].d === 3)) return true;
    }
    return false;
  }
  function blockOk(crouch, height) {
    if (height === 'low') return !!crouch;
    if (height === 'high') return !crouch;
    return true;
  }

  function selfCheck() {
    if (WINS_NEED !== 2) throw new Error('2 wins');
    if (HP_BASE !== 100) throw new Error('hp 100');
    if (ROUND_TIME !== 99) throw new Error('timer 99');
    if (BEST_KEY !== 'playbox-street-fist-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-street-fist-mute') throw new Error('mute key');
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(2) !== 1) throw new Error('combo 2');
    if (comboMul(3) !== 2) throw new Error('combo 3');
    if (comboMul(9) !== 5) throw new Error('combo cap');
    const h = jumpHeight(JUMP_V, GRAV);
    if (h < 70 || h > 90) throw new Error('jump height ' + h);
    if (FIGHTERS.length !== 5) throw new Error('5 fighters');
    if (fighterAt(0).id !== 'chi' || fighterAt(5).id !== 'chi') throw new Error('cycle');
    if (gauntFoe(1).id !== 'qing' || gauntFoe(4).id !== 'jin') throw new Error('gaunt order');
    if (gauntFoe(5).id !== 'qing') throw new Error('gaunt wrap');
    if (gauntScale(1) !== 1 || gauntScale(5) < 1.1) throw new Error('gaunt scale');
    if (!blockOk(false, 'high') || blockOk(true, 'high')) throw new Error('high block');
    if (!blockOk(true, 'low') || blockOk(false, 'low')) throw new Error('low block');
    if (!blockOk(false, 'mid') || !blockOk(true, 'mid')) throw new Error('mid block');
    if (!hasQCF([{ d: 2, t: 0 }, { d: 3, t: 0.08 }, { d: 6, t: 0.16 }], 0.2)) throw new Error('qcf');
    if (hasQCF([{ d: 6, t: 0 }, { d: 2, t: 0.1 }], 0.2)) throw new Error('qcf reverse');
    if (MOVES.lp.dmg >= MOVES.hp.dmg) throw new Error('hp stronger');
    if (MOVES.kick.range <= MOVES.lp.range) throw new Error('kick reach');
    if (!MOVES.hadou.proj || !MOVES.sweep.knockdown) throw new Error('specials');
    if (MOVES.dp.dmg <= MOVES.hp.dmg) throw new Error('dp dmg');
    if (stickNum({ l: false, r: true, u: false, d: true }, 1) !== 3) throw new Error('stick df');
    if (stickNum({ l: true, r: false, u: false, d: true }, 1) !== 1) throw new Error('stick db');
    if (stickNum({ l: true, r: false, u: false, d: false }, -1) !== 6) throw new Error('stick face');
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
  const btnVersus = document.getElementById('btn-versus');
  const btnGauntlet = document.getElementById('btn-gauntlet');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeVersus = document.getElementById('mode-versus');
  const modeGaunt = document.getElementById('mode-gauntlet');
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
    lp: document.getElementById('btn-lp'),
    hp: document.getElementById('btn-hp'),
    kick: document.getElementById('btn-kick'),
    wave: document.getElementById('btn-wave')
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

  const keys = { l: false, r: false, u: false, d: false, lp: false, hp: false, kick: false };
  const lpEdge = { down: false };
  const hpEdge = { down: false };
  const kickEdge = { down: false };
  const jumpEdge = { down: false };
  const waveEdge = { down: false };

  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const trails = [];

  const G = {
    mode: 'title',
    kind: 'versus',
    clock: 0,
    score: 0,
    best: 0,
    bestV: 0,
    bestG: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    fight: 1,
    round: 1,
    pWins: 0,
    cWins: 0,
    timer: ROUND_TIME,
    phase: 'intro',
    introT: 0,
    koT: 0,
    stop: 0,
    shake: 0,
    kickX: 0,
    kickY: 0,
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
    balls: [],
    demo: true
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
      this.noise(heavy ? 0.08 : 0.055, heavy ? 0.08 : 0.055, heavy ? 700 : 1400, 'highpass');
      this.beep(heavy ? 140 : 210, 0.05, 'sawtooth', 0.03, 70);
    },
    hit: function (combo, heavy) {
      this.ensure();
      const p = 1 + Math.min(7, combo) * 0.07;
      this.noise(0.13, heavy ? 0.22 : 0.15, 210, 'lowpass');
      this.beep(170 * p, 0.1, 'square', 0.085, 58);
      this.beep((heavy ? 920 : 680) * p, 0.07, 'triangle', 0.05, 400 * p);
      if (heavy) this.beep(1240 * p, 0.09, 'square', 0.04, 1600 * p);
    },
    block: function () {
      this.ensure();
      this.beep(210, 0.06, 'square', 0.05, 90);
      this.noise(0.06, 0.08, 1400, 'bandpass');
    },
    hadou: function () {
      this.ensure();
      this.noise(0.16, 0.12, 420, 'bandpass');
      this.beep(220, 0.18, 'sawtooth', 0.07, 90);
      this.beep(880, 0.16, 'square', 0.045, 420);
      this.beep(1320, 0.1, 'triangle', 0.035, 640);
    },
    dp: function () {
      this.ensure();
      this.noise(0.18, 0.16, 180, 'lowpass');
      this.beep(140, 0.16, 'sawtooth', 0.08, 70);
      this.beep(520, 0.12, 'square', 0.05, 980);
      this.beep(1100, 0.1, 'triangle', 0.04, 1600);
    },
    jump: function () {
      this.ensure();
      this.beep(380, 0.07, 'square', 0.03, 190);
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
    tick: function () {
      this.ensure();
      this.beep(880, 0.04, 'square', 0.03);
    }
  };

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      if (o && typeof o === 'object') {
        G.bestV = o.v | 0;
        G.bestG = o.g | 0;
      } else {
        const n = parseInt(raw, 10);
        if (n > 0) G.bestV = n;
      }
    } catch (e) { /* ignore */ }
    G.best = G.kind === 'gauntlet' ? G.bestG : G.bestV;
  }
  function persistBest() {
    if (G.kind === 'gauntlet') {
      if (G.score > G.bestG) G.bestG = G.score;
      G.best = G.bestG;
    } else {
      if (G.score > G.bestV) G.bestV = G.score;
      G.best = G.bestV;
    }
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ v: G.bestV, g: G.bestG }));
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
    chainPop.textContent = '×' + n;
    chainPop.classList.remove('hidden');
    void chainPop.offsetWidth;
    chainPop.classList.remove('hidden');
    clearTimeout(chainTok);
    chainTok = setTimeout(function () { chainPop.classList.add('hidden'); }, 700);
  }
  function kickStage(cls) {
    if (!stageEl || REDUCE) return;
    stageEl.classList.remove('hit', 'boom', 'die', 'thump', 'spec', 'win-flash');
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
    for (i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const v = rand(s * 0.3, s);
      particles.push({
        x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - rand(20, 80),
        r: rand(1.4, 3.6), rgb: rgb, t: rand(0.22, 0.5), max: 0.5, g: 420
      });
    }
    capArr(particles, 220);
  }
  function sparkAt(x, y, rgb) {
    let i;
    for (i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + rand(-0.2, 0.2);
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
  function trailAt(x, y, rgb) {
    trails.push({ x: x, y: y, t: 0.22, rgb: rgb, r: 7 });
    capArr(trails, 60);
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
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 3.2);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt);
    if (G.slam > 0) G.slam = Math.max(0, G.slam - dt);
    if (G.callT > 0) G.callT = Math.max(0, G.callT - dt);
  }

  /* ---- fighters ---- */
  function makeFighter(spec, x, face, cpu) {
    return {
      spec: spec,
      x: x,
      y: GROUND,
      vx: 0,
      vy: 0,
      face: face,
      grounded: true,
      crouch: false,
      hp: spec.hp,
      maxHp: spec.hp,
      atk: null,
      hurtT: 0,
      blockT: 0,
      flashT: 0,
      invuln: 0,
      ko: false,
      win: false,
      airT: 0,
      jdir: 0,
      step: 0,
      riseT: 0,
      thinkT: 0.2,
      plan: null,
      cpu: !!cpu,
      keys: { l: false, r: false, u: false, d: false, lp: false, hp: false, kick: false },
      buf: [],
      lastStick: 5,
      zBuf: 0,
      landed: 0
    };
  }

  function foeOf(f) {
    return f === G.p1 ? G.p2 : G.p1;
  }
  function busy(f) {
    return !!(f.atk || f.hurtT > 0 || f.blockT > 0 || f.ko || f.win || f.riseT > 0);
  }
  function canAct(f) {
    return !f.ko && !f.win && f.hurtT <= 0 && f.blockT <= 0 && f.riseT <= 0;
  }
  function canCancel(f, into) {
    if (!f.atk || !f.atk.hit) return false;
    const k = f.atk.kind;
    if (k === 'lp' || k === 'clp' || k === 'jlp') return true;
    if (into === 'hadou' || into === 'dp') return k !== 'hadou' && k !== 'dp';
    return false;
  }
  function bodyBox(f) {
    const crouch = f.crouch && f.grounded && !f.atk;
    const h = f.ko && f.grounded ? 16 : crouch ? 34 : 54 * (f.spec.size || 1);
    const w = 20 * (f.spec.size || 1);
    return { x: f.x - w / 2, y: f.y - h, w: w, h: h };
  }
  function atkBox(f) {
    if (!f.atk) return null;
    const m = f.atk.def;
    if (f.atk.t < m.hit0 || f.atk.t > m.hit1) return null;
    const face = f.face;
    const x0 = f.x + face * 8;
    const x1 = f.x + face * (8 + m.range);
    const x = Math.min(x0, x1);
    const w = Math.abs(x1 - x0);
    const y0 = f.y - m.h1;
    const h = m.h1 - m.h0;
    return { x: x, y: y0, w: w, h: h };
  }

  function recordStick(f) {
    const d = stickNum(f.keys, f.face);
    if (d !== f.lastStick) {
      f.buf.push({ d: d, t: G.clock });
      capArr(f.buf, 16);
      f.lastStick = d;
    }
  }

  function startAtk(f, kind) {
    if (!canAct(f)) return false;
    if (f.atk && !canCancel(f, kind)) return false;
    const def = MOVES[kind];
    if (!def) return false;
    f.atk = { kind: kind, t: 0, spent: false, def: def, hit: false };
    f.crouch = kind === 'clp' || kind === 'chp' || kind === 'sweep';
    if (kind === 'dp') {
      f.vy = -540;
      f.vx = f.face * 92;
      f.grounded = false;
      f.invuln = 0.13;
      f.jdir = f.face;
      f.airT = 0.01;
      flash(f.spec.ball, 0.16);
      kickStage('spec');
      audio.dp();
      burst(f.x + f.face * 10, f.y - 40, f.spec.ball, 14, 220);
      ringAt(f.x, f.y - 30, f.spec.ball);
      if (G.mode === 'play') toast('升龙！', 'gold');
    } else if (kind === 'hadou') {
      flash(f.spec.ball, 0.12);
      kickStage('spec');
      audio.hadou();
    } else {
      audio.swing(kind === 'hp' || kind === 'chp' || kind === 'jhp');
    }
    return true;
  }

  function tryHadou(f) {
    if (!f.grounded) return false;
    if (ownBall(f)) return false;
    if (!canAct(f) && !(f.atk && canCancel(f, 'hadou'))) return false;
    return startAtk(f, 'hadou');
  }
  function tryDP(f) {
    if (f.airT > 0.32 && f.atk) return false;
    return startAtk(f, 'dp');
  }

  function pickGroundAtk(f, lp, hp, kick) {
    if (f.crouch) {
      if (kick) return 'sweep';
      if (hp) return 'chp';
      if (lp) return 'clp';
    }
    if (kick) return 'kick';
    if (hp) return 'hp';
    if (lp) return 'lp';
    return null;
  }
  function pickAirAtk(f, lp, hp, kick) {
    if (kick) return 'jkick';
    if (hp) return 'jhp';
    if (lp) {
      if (f.jdir === f.face) return 'dp';
      return 'jlp';
    }
    return null;
  }

  function ownBall(f) {
    let i;
    for (i = 0; i < G.balls.length; i++) if (G.balls[i].owner === f) return G.balls[i];
    return null;
  }

  function spawnBall(f) {
    if (ownBall(f)) return;
    const heavy = f.keys && f.keys.hp;
    G.balls.push({
      owner: f,
      x: f.x + f.face * 30,
      y: f.y - 38,
      vx: f.face * (heavy ? 320 : 270),
      life: 1.35,
      dmg: heavy ? 18 : 14,
      score: heavy ? 200 : 160,
      rgb: f.spec.ball,
      face: f.face,
      r: 9
    });
  }

  function isBlocking(f, height) {
    if (!f.grounded || f.atk || f.hurtT > 0 || f.ko || f.win || f.riseT > 0) return false;
    const back = (f.face > 0 && f.keys.l && !f.keys.r) || (f.face < 0 && f.keys.r && !f.keys.l);
    if (!back) return false;
    return blockOk(f.crouch, height);
  }

  function applyHit(att, vic, move, isProj, hx, hy) {
    if (vic.ko || vic.win) return false;
    if (vic.invuln > 0) return false;
    const heavy = move.dmg >= 16 || isProj;
    if (isBlocking(vic, move.height)) {
      const chip = move.chip || 0;
      if (chip && G.mode === 'play') {
        vic.hp = Math.max(1, vic.hp - chip);
        G.hudDirty = true;
      }
      vic.blockT = move.block;
      vic.vx = att.face * (isProj ? 28 : 36);
      vic.atk = null;
      sparkAt(hx, hy, CYN);
      ringAt(hx, hy, CYN);
      audio.block();
      kickStage('hit');
      hitStop(0.03);
      return true;
    }
    vic.hp -= move.dmg;
    vic.hurtT = move.stun;
    vic.atk = null;
    vic.crouch = false;
    vic.blockT = 0;
    vic.flashT = 0.1;
    vic.vx = att.face * move.kb;
    if (move.knockdown || vic.hp <= 0) {
      vic.vy = vic.hp <= 0 ? -260 : -180;
      vic.grounded = false;
      vic.airT = 0.01;
    } else if (!vic.grounded) {
      vic.vy = Math.min(vic.vy, -80);
    }
    sparkAt(hx, hy, heavy ? GOLD : WHT);
    burst(hx, hy, heavy ? HOT : GOLD, heavy ? 16 : 10, heavy ? 260 : 180);
    ringAt(hx, hy, att.spec.ball);
    audio.hit(G.combo + 1, heavy);
    hitStop(REDUCE ? 0 : (vic.hp <= 0 ? 0.08 : move.stop));
    shake(vic.hp <= 0 ? 1.1 : heavy ? 0.55 : 0.32);
    kickStage(vic.hp <= 0 ? 'die' : (heavy ? 'boom' : 'hit'));
    if (G.mode === 'play' && att === G.p1) {
      G.combo += 1;
      G.comboT = COMBO_WIN + Math.min(0.4, G.combo * 0.04);
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
    if (f.flashT > 0) f.flashT -= dt;
    if (f.invuln > 0) f.invuln -= dt;
    if (f.zBuf > 0) f.zBuf -= dt;
    if (f.landed > 0) f.landed -= dt;

    if (live) recordStick(f);

    if (f.hurtT > 0) {
      f.hurtT -= dt;
      f.atk = null;
    }
    if (f.blockT > 0) f.blockT -= dt;
    if (f.riseT > 0) {
      f.riseT -= dt;
      if (f.riseT <= 0) f.crouch = false;
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
      if (!(f.atk && f.atk.kind === 'dp')) {
        f.vy += GRAV * dt;
        if (f.vy > MAX_FALL) f.vy = MAX_FALL;
        if (live && canAct(f) && !f.atk) {
          if (f.keys.l) f.vx -= 50 * dt;
          if (f.keys.r) f.vx += 50 * dt;
          f.vx = clamp(f.vx, -190, 190);
        }
      } else {
        f.vy += GRAV * 0.72 * dt;
      }
    } else {
      f.airT = 0;
      f.jdir = 0;
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
        if (ax < 0) f.vx = -((f.face > 0) ? spec.back : spec.walk);
        else if (ax > 0) f.vx = (f.face > 0) ? spec.walk : spec.back;
        else f.vx = 0;
        if (ax) f.step += dt * 10;
      }
      if (f.keys.u && !f.crouch) {
        f.grounded = false;
        f.vy = -(spec.jump || JUMP_V);
        f.jdir = 0;
        if (f.keys.l && !f.keys.r) f.jdir = -1;
        else if (f.keys.r && !f.keys.l) f.jdir = 1;
        f.vx = f.jdir * spec.walk * 0.92;
        f.airT = 0.001;
        audio.jump();
        if (f.zBuf > 0 && f.jdir === f.face) tryDP(f);
      }
    } else if (f.grounded && f.atk) {
      f.vx *= 0.55;
    }

    if (live && canAct(f)) {
      const lp = f.keys._lp;
      const hp = f.keys._hp;
      const kick = f.keys._kick;
      const wave = f.keys._wave;
      f.keys._lp = false;
      f.keys._hp = false;
      f.keys._kick = false;
      f.keys._wave = false;
      if (lp) f.zBuf = 0.12;
      const qcf = hasQCF(f.buf, G.clock);
      if (wave || ((lp || hp) && qcf && f.grounded)) {
        tryHadou(f);
      } else if (!f.grounded && lp && f.jdir === f.face && (!f.atk || canCancel(f, 'dp'))) {
        tryDP(f);
      } else {
        const kind = f.grounded ? pickGroundAtk(f, lp, hp, kick) : pickAirAtk(f, lp, hp, kick);
        if (kind) startAtk(f, kind);
      }
    }

    if (f.atk) {
      f.atk.t += dt;
      if (f.atk.kind === 'hadou' && !f.atk.fired && f.atk.t >= f.atk.def.hit0) {
        f.atk.fired = true;
        spawnBall(f);
        burst(f.x + f.face * 26, f.y - 38, f.spec.ball, 10, 140);
      }
      if (f.atk.t >= f.atk.def.dur) f.atk = null;
    }

    f.x += f.vx * dt;
    f.y += f.vy * dt;
    if (f.y >= GROUND) {
      if (!f.grounded) {
        f.landed = 0.08;
        if (f.vy > 120) audio.land();
        if (f.atk && (f.atk.kind === 'jlp' || f.atk.kind === 'jhp' || f.atk.kind === 'jkick' || f.atk.kind === 'dp')) {
          if (f.atk.kind === 'dp' && f.atk.t < f.atk.def.dur) {
            /* keep dp until duration, snap ground after */
          } else {
            f.atk = null;
          }
        }
      }
      f.y = GROUND;
      f.vy = 0;
      f.grounded = true;
      if (f.atk && f.atk.kind === 'dp' && f.atk.t > 0.22) {
        f.vx *= 0.4;
      }
    }
    f.x = clamp(f.x, EDGE, VW - EDGE);
  }

  function tickHits() {
    const a = atkBox(G.p1);
    const b = atkBox(G.p2);
    const hb1 = bodyBox(G.p2);
    const hb2 = bodyBox(G.p1);
    if (a && G.p1.atk && !G.p1.atk.spent && aabb(a, hb1)) {
      G.p1.atk.spent = true;
      G.p1.atk.hit = true;
      const hx = G.p2.x - G.p2.face * 8;
      const hy = G.p2.y - 36;
      applyHit(G.p1, G.p2, G.p1.atk.def, false, hx, hy);
    }
    if (b && G.p2.atk && !G.p2.atk.spent && aabb(b, hb2)) {
      G.p2.atk.spent = true;
      G.p2.atk.hit = true;
      const hx = G.p1.x - G.p1.face * 8;
      const hy = G.p1.y - 36;
      applyHit(G.p2, G.p1, G.p2.atk.def, false, hx, hy);
    }
  }

  function tickBalls(dt) {
    let i, j, p, q;
    for (i = G.balls.length - 1; i >= 0; i--) {
      p = G.balls[i];
      p.life -= dt;
      p.x += p.vx * dt;
      trailAt(p.x, p.y, p.rgb);
      if (p.life <= 0 || p.x < -20 || p.x > VW + 20) {
        G.balls.splice(i, 1);
        continue;
      }
      const box = { x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 };
      const vic = p.owner === G.p1 ? G.p2 : G.p1;
      if (aabb(box, bodyBox(vic))) {
        const def = {
          dmg: p.dmg, stun: 0.28, kb: 70, height: 'mid', score: p.score,
          chip: 3, block: 0.24, stop: 0.055, knockdown: false
        };
        applyHit(p.owner, vic, def, true, p.x, p.y);
        burst(p.x, p.y, p.rgb, 12, 160);
        G.balls.splice(i, 1);
        continue;
      }
      const foAtk = atkBox(vic);
      if (foAtk && vic.atk && vic.atk.kind === 'dp' && aabb(box, foAtk)) {
        burst(p.x, p.y, GOLD, 10, 140);
        G.balls.splice(i, 1);
        continue;
      }
    }
    for (i = G.balls.length - 1; i >= 0; i--) {
      p = G.balls[i];
      for (j = i - 1; j >= 0; j--) {
        q = G.balls[j];
        if (p.owner === q.owner) continue;
        if (hypot(p.x - q.x, p.y - q.y) < p.r + q.r + 2) {
          burst((p.x + q.x) / 2, (p.y + q.y) / 2, WHT, 14, 180);
          ringAt((p.x + q.x) / 2, (p.y + q.y) / 2, CYN);
          audio.block();
          G.balls.splice(i, 1);
          G.balls.splice(j, 1);
          i--;
          break;
        }
      }
    }
  }

  /* ---- CPU ---- */
  function incomingBall(f) {
    let i, p;
    for (i = 0; i < G.balls.length; i++) {
      p = G.balls[i];
      if (p.owner === f) continue;
      if (p.vx * (f.x - p.x) > 0 && Math.abs(p.x - f.x) < 210) return p;
    }
    return null;
  }

  function cpuPress(f, which) {
    f.keys['_' + which] = true;
  }

  function applyPlan(f, dt) {
    const plan = f.plan;
    if (!plan) return;
    const k = f.keys;
    k.l = k.r = k.u = k.d = false;
    if (plan.t != null) {
      plan.t -= dt;
      if (plan.t <= 0) f.plan = null;
    }
    if (plan.type === 'walk') {
      if (plan.dir < 0) k.l = true;
      else k.r = true;
    } else if (plan.type === 'block') {
      if (f.face > 0) k.l = true;
      else k.r = true;
      if (plan.low) k.d = true;
    } else if (plan.type === 'crouch') {
      k.d = true;
    } else if (plan.type === 'jump' || plan.type === 'jumpin') {
      k.u = true;
      if (plan.dir < 0 || (plan.type === 'jumpin' && f.face < 0)) k.l = true;
      if (plan.dir > 0 || (plan.type === 'jumpin' && f.face > 0)) k.r = true;
      if (plan.type === 'jumpin' && !f.grounded && f.airT > 0.08 && !plan.did) {
        cpuPress(f, 'kick');
        plan.did = true;
      }
    } else if (plan.type === 'hadou') {
      if (!plan.did) { tryHadou(f); plan.did = true; }
    } else if (plan.type === 'dp') {
      if (!plan.did) { tryDP(f); plan.did = true; }
    } else if (plan.type === 'lp') {
      if (!plan.did) { cpuPress(f, 'lp'); plan.did = true; }
    } else if (plan.type === 'hp') {
      if (!plan.did) { cpuPress(f, 'hp'); plan.did = true; }
    } else if (plan.type === 'kick') {
      if (!plan.did) { cpuPress(f, 'kick'); plan.did = true; }
    } else if (plan.type === 'sweep') {
      k.d = true;
      if (!plan.did) { cpuPress(f, 'kick'); plan.did = true; }
    }
  }

  function cpuThink(f, dt) {
    const p = foeOf(f);
    const ai = f.spec.ai;
    const mul = G.kind === 'gauntlet' ? gauntScale(G.fight) : 1;
    const ball = incomingBall(f);
    const dist = Math.abs(p.x - f.x);

    if (ball && Math.abs(ball.x - f.x) < 160 && f.grounded && canAct(f)) {
      if (Math.random() < 0.62) f.plan = { type: 'jump', dir: f.face, t: 0.2 };
      else f.plan = { type: 'block', t: 0.4, low: false };
      f.thinkT = 0.18;
      applyPlan(f, dt);
      return;
    }
    if (p.airT > 0.04 && dist < 100 && p.y < f.y - 18 && canAct(f) && f.grounded) {
      if (Math.random() < ai.anti) {
        f.plan = { type: 'dp', t: 0.2 };
        f.thinkT = 0.3;
        applyPlan(f, dt);
        return;
      }
    }

    f.thinkT -= dt;
    if (f.plan && f.thinkT > 0) {
      applyPlan(f, dt);
      return;
    }
    f.thinkT = (ai.think / mul) * (0.65 + Math.random() * 0.7);

    if (!canAct(f)) {
      f.plan = { type: 'wait', t: 0.1 };
      return;
    }

    const r = Math.random();
    if (p.atk && dist < 70 && r < ai.block) {
      f.plan = { type: 'block', t: 0.32, low: p.atk.kind === 'sweep' || p.crouch };
    } else if (dist > 210) {
      if (r < ai.fire) f.plan = { type: 'hadou', t: 0.4 };
      else f.plan = { type: 'walk', dir: f.face, t: 0.45 };
    } else if (dist > 92) {
      if (r < ai.fire * 0.85) f.plan = { type: 'hadou', t: 0.4 };
      else if (r < ai.fire * 0.85 + ai.jump) f.plan = { type: 'jumpin', t: 0.5 };
      else if (r < 0.78) f.plan = { type: 'walk', dir: f.face, t: 0.32 };
      else f.plan = { type: 'walk', dir: -f.face, t: 0.22 };
    } else {
      if (r < ai.agg * 0.35) f.plan = { type: 'lp', t: 0.2 };
      else if (r < ai.agg * 0.62) f.plan = { type: 'kick', t: 0.24 };
      else if (r < ai.agg * 0.85) f.plan = { type: 'hp', t: 0.28 };
      else if (r < ai.agg) f.plan = { type: 'sweep', t: 0.3 };
      else if (r < ai.agg + 0.12) f.plan = { type: 'dp', t: 0.2 };
      else f.plan = { type: 'walk', dir: -f.face, t: 0.2 };
    }
    applyPlan(f, dt);
  }

  function copyPlayerKeys(f) {
    f.keys.l = keys.l;
    f.keys.r = keys.r;
    f.keys.u = keys.u;
    f.keys.d = keys.d;
    f.keys.lp = keys.lp;
    f.keys.hp = keys.hp;
    f.keys.kick = keys.kick;
    if (lpEdge.down) { f.keys._lp = true; lpEdge.down = false; }
    if (hpEdge.down) { f.keys._hp = true; hpEdge.down = false; }
    if (kickEdge.down) { f.keys._kick = true; kickEdge.down = false; }
    if (waveEdge.down) { f.keys._wave = true; waveEdge.down = false; }
    if (jumpEdge.down) { f.keys.u = true; jumpEdge.down = false; }
  }

  function clearEdges() {
    lpEdge.down = hpEdge.down = kickEdge.down = jumpEdge.down = waveEdge.down = false;
  }

  /* ---- rounds / modes ---- */
  function foeSpec() {
    if (G.kind === 'gauntlet') {
      const s = gauntFoe(G.fight);
      const sc = gauntScale(G.fight);
      return Object.assign({}, s, { hp: Math.round(s.hp * Math.min(1.35, 0.92 + sc * 0.2)) });
    }
    return FIGHTERS[1];
  }

  function spawnRound() {
    const pSpec = FIGHTERS[0];
    const cSpec = foeSpec();
    G.p1 = makeFighter(pSpec, 150, 1, G.mode === 'title');
    G.p2 = makeFighter(cSpec, 490, -1, true);
    if (G.kind === 'gauntlet' && G.mode === 'play') {
      const sc = gauntScale(G.fight);
      G.p2.spec = Object.assign({}, cSpec, {
        walk: cSpec.walk * Math.min(1.25, sc),
        back: cSpec.back * Math.min(1.2, sc),
        ai: Object.assign({}, cSpec.ai, {
          think: cSpec.ai.think / sc,
          block: Math.min(0.7, cSpec.ai.block + (sc - 1) * 0.15),
          anti: Math.min(0.9, cSpec.ai.anti + (sc - 1) * 0.12)
        })
      });
      G.p2.hp = G.p2.maxHp = G.p2.spec.hp;
    }
    G.balls.length = 0;
    G.timer = ROUND_TIME;
    G.phase = 'intro';
    G.introT = 1.35;
    G.koT = 0;
    G._drawRound = false;
    G._timeAward = null;
    G._tShow = ROUND_TIME;
    clearEdges();
    G.combo = 0;
    G.comboT = 0;
    G.call = '第 ' + G.round + ' 局';
    G.callT = 0.85;
    G.hudDirty = true;
    audio.bell();
  }

  function startMatch(kind) {
    G.kind = kind || 'versus';
    G.mode = 'play';
    G.demo = false;
    G.score = 0;
    G.fight = 1;
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
    toast(G.kind === 'gauntlet' ? '无尽 · ' + foeSpec().name : '对战 · ' + foeSpec().name);
    G.hudDirty = true;
    if (canvas) canvas.focus();
  }

  function showTitle() {
    G.mode = 'title';
    G.demo = true;
    G.kind = G.kind || 'versus';
    G.round = 1;
    G.fight = 1;
    G.pWins = 0;
    G.cWins = 0;
    G.phase = 'fight';
    G.introT = 0;
    G.p1 = makeFighter(FIGHTERS[0], 150, 1, true);
    G.p2 = makeFighter(FIGHTERS[1], 490, -1, true);
    G.balls.length = 0;
    G.call = '';
    overlay.classList.remove('hidden', 'end');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.remove('win', 'lose');
    ovKicker.textContent = 'FIST';
    ovTitle.textContent = '街霸';
    ovLead.innerHTML = '出拳出腿，气波升龙。先赢两局。<br />蹲防低扫，站防跳攻，下前拳放气波。';
    ovOps.textContent = OPS;
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    G.hudDirty = true;
    if (hintEl) {
      hintEl.textContent = '走跳蹲 · Z 轻 / X 重 / C 踢 · 下前拳 气波 · 前跳 Z 升龙';
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
    ovKicker.textContent = win ? 'FIST' : 'KO';
    ovTitle.textContent = win ? (G.kind === 'gauntlet' ? '连胜' : '完胜') : '倒下了';
    const foe = (G.p2 && G.p2.spec && G.p2.spec.name) || '对手';
    let lead = why || (win ? '两局到手。' : '血条见底。');
    lead += ' 分数 ' + G.score + ' · 最高连击 ×' + G.maxCombo;
    if (G.kind === 'gauntlet') lead += ' · 第 ' + G.fight + ' 战 ' + foe;
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
    toast((pWin ? '赤拳' : G.p2.spec.name) + ' 拿下第 ' + G.round + ' 局', pWin ? 'gold' : 'warn');
    if (G.pWins >= WINS_NEED || G.cWins >= WINS_NEED) {
      const matchWin = G.pWins >= WINS_NEED;
      if (matchWin && G.mode === 'play') addScore(G.kind === 'gauntlet' ? 1500 * G.fight : 2000, VW / 2, 100, CYN);
      if (G.kind === 'gauntlet' && matchWin && G.mode === 'play') {
        G.fight += 1;
        G.round = 1;
        G.pWins = 0;
        G.cWins = 0;
        toast('下一战 · ' + foeSpec().name, 'gold');
        spawnRound();
        return;
      }
      if (G.mode === 'play') showEnd(matchWin, why);
      else spawnRound();
      return;
    }
    G.round += 1;
    spawnRound();
  }

  function finishKo() {
    if (G.mode !== 'play') {
      G.p1 = makeFighter(FIGHTERS[0], 150, 1, true);
      G.p2 = makeFighter(FIGHTERS[1 + ((Math.random() * 4) | 0)], 490, -1, true);
      G.balls.length = 0;
      G.phase = 'fight';
      G.koT = 0;
      return;
    }
    const pKo = G.p1.ko;
    const cKo = G.p2.ko;
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
  }

  /* ---- tick ---- */
  function tick(dt) {
    G.clock += dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.hudDirty = true;
      }
    }
    if (!G.p1 || !G.p2) return;

    if (G.mode === 'title') {
      cpuThink(G.p1, dt);
      cpuThink(G.p2, dt);
      tickFighter(G.p1, dt, true);
      tickFighter(G.p2, dt, true);
      separate(G.p1, G.p2);
      tickHits();
      tickBalls(dt);
      if (G.p1.ko || G.p2.ko) {
        G.koT -= dt;
        if (G.koT <= 0) {
          G.p1 = makeFighter(FIGHTERS[0], 150, 1, true);
          G.p2 = makeFighter(FIGHTERS[1 + ((Math.random() * 4) | 0)], 490, -1, true);
          G.balls.length = 0;
          G.koT = 0;
        }
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
      if (G.introT < 0.45 && G.call.indexOf('局') >= 0) {
        G.call = '开打';
        G.callT = 0.5;
      }
      G.p1.face = 1;
      G.p2.face = -1;
      if (G.introT <= 0) {
        G.phase = 'fight';
        G.call = '';
        clearEdges();
        audio.ui();
      }
      return;
    }

    if (G.phase === 'ko') {
      tickFighter(G.p1, dt, false);
      tickFighter(G.p2, dt, false);
      tickBalls(dt);
      G.koT -= dt;
      if (G.koT <= 0) {
        if (G._drawRound) {
          G._drawRound = false;
          spawnRound();
          return;
        }
        if (G._timeAward != null) {
          const w = G._timeAward;
          G._timeAward = null;
          awardRound(w, '时间到，血多者胜。');
          return;
        }
        finishKo();
      }
      return;
    }

    if (G.phase === 'fight') {
      G.timer -= dt;
      if (Math.ceil(G.timer) !== G._tShow) {
        G._tShow = Math.ceil(G.timer);
        G.hudDirty = true;
        if (G._tShow <= 10 && G._tShow >= 0) audio.tick();
      }
      if (G.timer <= 0) {
        G.timer = 0;
        timeOver();
        G.hudDirty = true;
        return;
      }
      copyPlayerKeys(G.p1);
      G.p1.cpu = false;
      cpuThink(G.p2, dt);
      tickFighter(G.p1, dt, true);
      tickFighter(G.p2, dt, true);
      separate(G.p1, G.p2);
      tickHits();
      tickBalls(dt);
    }
  }

  /* ---- hud ---- */
  function renderPips(el, n, on) {
    if (!el) return;
    let html = '';
    let i;
    for (i = 0; i < n; i++) html += '<i class="pip' + (i < on ? ' on' : '') + '"></i>';
    el.innerHTML = html;
  }
  function syncHud() {
    G.hudDirty = false;
    if (scoreEl) scoreEl.textContent = String(G.score | 0);
    if (bestEl) bestEl.textContent = String(G.best | 0);
    if (comboEl) comboEl.textContent = '×' + Math.max(1, G.combo | 0);
    if (modeLabel) {
      modeLabel.textContent = G.kind === 'gauntlet' ? '无尽' : '对战';
      modeLabel.classList.toggle('gaunt', G.kind === 'gauntlet');
    }
    const foe = G.p2 && G.p2.spec ? G.p2.spec.name : '青影';
    if (tagLabel) {
      tagLabel.textContent = G.kind === 'gauntlet' ? '第' + G.fight + '战 ' + foe : foe;
      tagLabel.classList.toggle('hot', G.kind === 'gauntlet' && G.fight >= 4);
    }
    if (roundLabel) roundLabel.textContent = '第' + G.round + '局';
    if (p1NameEl) p1NameEl.textContent = '赤拳';
    if (p2NameEl) p2NameEl.textContent = foe;
    const r1 = G.p1 ? clamp(G.p1.hp / G.p1.maxHp, 0, 1) : 1;
    const r2 = G.p2 ? clamp(G.p2.hp / G.p2.maxHp, 0, 1) : 1;
    if (hp1El) {
      hp1El.style.transform = 'scaleX(' + r1 + ')';
      hp1El.classList.toggle('low', r1 < 0.28);
    }
    if (hp2El) {
      hp2El.style.transform = 'scaleX(' + r2 + ')';
      hp2El.classList.toggle('low', r2 < 0.28);
    }
    if (timerEl) {
      timerEl.textContent = String(Math.max(0, Math.ceil(G.timer)));
      timerEl.classList.toggle('low', G.timer <= 10);
    }
    renderPips(pips1El, WINS_NEED, G.pWins);
    renderPips(pips2El, WINS_NEED, G.cWins);
    if (modeVersus) modeVersus.setAttribute('aria-pressed', G.kind !== 'gauntlet' ? 'true' : 'false');
    if (modeGaunt) modeGaunt.setAttribute('aria-pressed', G.kind === 'gauntlet' ? 'true' : 'false');
  }

  /* ---- draw ---- */
  function wx(x) { return ox + x * scale; }
  function wy(y) { return oy + y * scale; }

  function rr(x, y, w, h, r) {
    const cr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + cr, y);
    ctx.arcTo(x + w, y, x + w, y + h, cr);
    ctx.arcTo(x + w, y + h, x, y + h, cr);
    ctx.arcTo(x, y + h, x, y, cr);
    ctx.arcTo(x, y, x + w, y, cr);
    ctx.closePath();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) / 2;
    oy = (H - VH * scale) / 2;
  }

  function drawArena() {
    const g = ctx.createLinearGradient(ox, oy, ox, wy(VH));
    g.addColorStop(0, '#1a0810');
    g.addColorStop(0.45, '#2a1020');
    g.addColorStop(0.72, '#140810');
    g.addColorStop(1, '#0a0406');
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    ctx.fillStyle = rgba(GOLD, 0.16);
    ctx.beginPath();
    ctx.arc(wx(540), wy(58), 28 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.55);
    ctx.beginPath();
    ctx.arc(wx(540), wy(58), 16 * scale, 0, TAU);
    ctx.fill();

    let i;
    const buildings = [
      [20, 90, 70, 170, HOT],
      [100, 120, 54, 140, MAG],
      [168, 80, 80, 180, CYN],
      [400, 100, 64, 160, MAG],
      [478, 70, 90, 190, HOT],
      [572, 110, 50, 150, CYN]
    ];
    for (i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      ctx.fillStyle = 'rgba(8,4,10,0.85)';
      ctx.fillRect(wx(b[0]), wy(GROUND - b[3] + 8), b[2] * scale, b[3] * scale);
      ctx.fillStyle = rgba(b[4], 0.55 + Math.sin(G.clock * 2 + i) * 0.12);
      ctx.fillRect(wx(b[0] + 6), wy(GROUND - b[3] + 16), (b[2] - 12) * scale, 8 * scale);
      let wyi;
      for (wyi = 28; wyi < b[3] - 20; wyi += 16) {
        ctx.fillStyle = rgba(GOLD, 0.08 + ((i + wyi) % 3) * 0.04);
        ctx.fillRect(wx(b[0] + 10), wy(GROUND - b[3] + 8 + wyi), 8 * scale, 6 * scale);
        ctx.fillRect(wx(b[0] + b[2] - 18), wy(GROUND - b[3] + 8 + wyi), 8 * scale, 6 * scale);
      }
    }

    ctx.fillStyle = rgba(HOT, 0.12);
    ctx.beginPath();
    ctx.moveTo(wx(240), wy(GROUND - 160));
    ctx.lineTo(wx(400), wy(GROUND - 160));
    ctx.lineTo(wx(430), wy(GROUND));
    ctx.lineTo(wx(210), wy(GROUND));
    ctx.fill();

    ctx.strokeStyle = rgba(HOT2, 0.35);
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(wx(40), wy(GROUND - 52));
    ctx.lineTo(wx(600), wy(GROUND - 52));
    ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, 0.18);
    ctx.beginPath();
    ctx.moveTo(wx(40), wy(GROUND - 44));
    ctx.lineTo(wx(600), wy(GROUND - 44));
    ctx.stroke();

    ctx.fillStyle = '#1a0c08';
    ctx.fillRect(ox, wy(GROUND), VW * scale, (VH - GROUND) * scale + 2);
    ctx.fillStyle = rgba(HOT, 0.45);
    ctx.fillRect(ox, wy(GROUND), VW * scale, 3 * scale);
    ctx.fillStyle = rgba(GOLD, 0.16);
    ctx.fillRect(ox, wy(GROUND + 3), VW * scale, 1.5 * scale);
    ctx.strokeStyle = 'rgba(255, 120, 60, 0.1)';
    ctx.lineWidth = 1;
    for (i = 0; i < 18; i++) {
      ctx.beginPath();
      ctx.moveTo(wx(i * 40), wy(GROUND + 4));
      ctx.lineTo(wx(i * 40 + 18), wy(VH));
      ctx.stroke();
    }

    const lan = G.clock;
    for (i = 0; i < 5; i++) {
      const lx = 80 + i * 120;
      const bob = Math.sin(lan * 2 + i) * 2;
      ctx.fillStyle = rgba(HOT, 0.5);
      ctx.beginPath();
      ctx.ellipse(wx(lx), wy(92 + bob), 7 * scale, 9 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.beginPath();
      ctx.arc(wx(lx), wy(90 + bob), 2.2 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.25);
      ctx.beginPath();
      ctx.moveTo(wx(lx), wy(70));
      ctx.lineTo(wx(lx), wy(84 + bob));
      ctx.stroke();
    }
  }

  function drawFighter(f) {
    const spec = f.spec;
    const s = scale * (spec.size || 1);
    const x = wx(f.x);
    const y = wy(f.y);
    const flashOn = f.flashT > 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(f.face * s, s);

    ctx.fillStyle = 'rgba(0,0,0,0.34)';
    ctx.beginPath();
    ctx.ellipse(0, 2, f.ko && f.grounded ? 18 : 12, 3.4, 0, 0, TAU);
    ctx.fill();

    if (f.ko && f.grounded) ctx.rotate(-1.22);
    else if (f.hurtT > 0) ctx.rotate(-0.2);
    else if (f.atk && f.atk.kind === 'dp') ctx.rotate(-0.42 + f.atk.t * 1.4);
    else if (f.win) ctx.rotate(Math.sin(G.clock * 6) * 0.04);

    const gi = flashOn ? [255, 255, 236] : spec.gi;
    const pants = flashOn ? [255, 244, 220] : spec.pants;
    const sash = flashOn ? WHT : spec.sash;
    const skin = spec.skin;
    const walk = (!f.atk && f.grounded && Math.abs(f.vx) > 20) ? Math.sin(f.step) : 0;
    const crouch = f.crouch && f.grounded && !(f.atk && f.atk.kind === 'dp');
    const air = !f.grounded;
    const punch = f.atk && (f.atk.kind === 'lp' || f.atk.kind === 'hp' || f.atk.kind === 'clp' || f.atk.kind === 'chp' || f.atk.kind === 'jlp' || f.atk.kind === 'jhp');
    const kick = f.atk && (f.atk.kind === 'kick' || f.atk.kind === 'sweep' || f.atk.kind === 'jkick');
    const had = f.atk && f.atk.kind === 'hadou';
    const dp = f.atk && f.atk.kind === 'dp';
    const blk = f.blockT > 0;
    const bodyH = crouch ? 14 : 20;
    const bodyY = crouch ? -16 : -22;

    ctx.fillStyle = rgba(pants, 1);
    if (kick) {
      ctx.fillRect(-5, -12, 5, 11);
      ctx.save();
      ctx.translate(2, crouch ? -6 : -8);
      ctx.rotate(crouch ? 1.15 : 0.95);
      ctx.fillRect(0, 0, 5, 18);
      ctx.restore();
    } else if (dp) {
      ctx.fillRect(-7, -14, 5, 10);
      ctx.fillRect(1, -8, 5, 8);
    } else if (air) {
      ctx.fillRect(-7, -12, 5, 10);
      ctx.fillRect(1, -9, 5, 8);
    } else {
      ctx.fillRect(-7 + walk * 3, crouch ? -8 : -12, 5, crouch ? 8 : 12);
      ctx.fillRect(1 - walk * 3, crouch ? -8 : -12, 5, crouch ? 8 : 12);
    }

    ctx.fillStyle = rgba(gi, 1);
    ctx.fillRect(-9, bodyY - bodyH + 4, 18, bodyH);
    ctx.fillStyle = rgba(sash, 1);
    ctx.fillRect(-9, bodyY + 2, 18, 3.2);

    ctx.strokeStyle = rgba(gi, 1);
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (punch) {
      const t = f.atk.t / f.atk.def.dur;
      const ext = t < 0.55 ? 18 : 10;
      ctx.moveTo(-6, bodyY - 6);
      ctx.lineTo(-11, bodyY + 4);
      ctx.moveTo(5, bodyY - 4);
      ctx.lineTo(ext, bodyY - 6);
    } else if (had) {
      ctx.moveTo(-4, bodyY - 2);
      ctx.lineTo(10, bodyY - 4);
      ctx.moveTo(4, bodyY - 2);
      ctx.lineTo(12, bodyY - 4);
    } else if (dp) {
      ctx.moveTo(-6, bodyY);
      ctx.lineTo(-10, bodyY + 8);
      ctx.moveTo(4, bodyY - 8);
      ctx.lineTo(8, bodyY - 24);
    } else if (blk) {
      ctx.moveTo(-5, bodyY - 4);
      ctx.lineTo(6, bodyY - 10);
      ctx.moveTo(4, bodyY - 2);
      ctx.lineTo(10, bodyY - 8);
    } else if (kick) {
      ctx.moveTo(-5, bodyY - 4);
      ctx.lineTo(-8, bodyY + 6);
      ctx.moveTo(5, bodyY - 2);
      ctx.lineTo(8, bodyY + 4);
    } else {
      ctx.moveTo(-6, bodyY - 4);
      ctx.lineTo(-8 + walk * 2, bodyY + 8);
      ctx.moveTo(6, bodyY - 4);
      ctx.lineTo(8 - walk * 2, bodyY + 8);
    }
    ctx.stroke();

    if (punch) {
      ctx.fillStyle = rgba(skin, 1);
      ctx.beginPath();
      ctx.arc(f.atk.kind.indexOf('h') === 0 || f.atk.kind === 'hp' || f.atk.kind === 'chp' || f.atk.kind === 'jhp' ? 20 : 18, bodyY - 6, 2.8, 0, TAU);
      ctx.fill();
    }
    if (had) {
      ctx.fillStyle = rgba(spec.ball, 0.9);
      ctx.beginPath();
      ctx.arc(16, bodyY - 4, 4.2, 0, TAU);
      ctx.fill();
    }
    if (dp) {
      ctx.fillStyle = rgba(skin, 1);
      ctx.beginPath();
      ctx.arc(8, bodyY - 26, 2.8, 0, TAU);
      ctx.fill();
    }

    const headY = bodyY - bodyH - 2;
    ctx.fillStyle = rgba(skin, 1);
    ctx.beginPath();
    ctx.arc(0, headY, 6.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(spec.hair, 1);
    ctx.beginPath();
    ctx.ellipse(-0.6, headY - 2.4, 6.4, 4.2, -0.2, 0, TAU);
    ctx.fill();
    if (spec.band) {
      ctx.fillStyle = rgba(spec.band, 1);
      ctx.fillRect(-6.2, headY - 1.2, 12.4, 2.1);
      ctx.fillStyle = rgba(spec.accent, 1);
      ctx.fillRect(4.2, headY - 0.8, 6, 1.4);
    }
    ctx.fillStyle = '#1a1014';
    ctx.fillRect(1.6, headY - 1.4, 2.1, 2.1);

    if (f.win) {
      ctx.strokeStyle = rgba(GOLD, 0.7);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, headY, 10, 0, TAU);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawBalls() {
    let i, p, a;
    for (i = 0; i < G.balls.length; i++) {
      p = G.balls[i];
      a = 0.55 + Math.sin(G.clock * 18 + i) * 0.25;
      ctx.fillStyle = rgba(p.rgb, 0.22);
      ctx.beginPath();
      ctx.arc(wx(p.x), wy(p.y), (p.r + 7) * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(wx(p.x), wy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.beginPath();
      ctx.arc(wx(p.x - p.face * 2), wy(p.y - 2), 2.4 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawFx() {
    let i, p;
    for (i = 0; i < trails.length; i++) {
      p = trails[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.t / 0.22, 0, 1) * 0.45);
      ctx.beginPath();
      ctx.arc(wx(p.x), wy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < rings.length; i++) {
      p = rings[i];
      ctx.strokeStyle = rgba(p.rgb, clamp(p.t / 0.4, 0, 1));
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.arc(wx(p.x), wy(p.y), p.r * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.t / (p.max || 0.45), 0, 1));
      ctx.beginPath();
      ctx.arc(wx(p.x), wy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < sparks.length; i++) {
      p = sparks[i];
      ctx.strokeStyle = rgba(p.rgb, clamp(p.t / 0.22, 0, 1));
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      ctx.moveTo(wx(p.x), wy(p.y));
      ctx.lineTo(wx(p.x - p.vx * 0.04), wy(p.y - p.vy * 0.04));
      ctx.stroke();
    }
    ctx.font = '800 ' + (13 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    for (i = 0; i < floats.length; i++) {
      p = floats[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.t / p.life, 0, 1));
      ctx.fillText(p.text, wx(p.x), wy(p.y));
    }
  }

  function drawHudWorld() {
    const y = 16;
    const bw = 210;
    const p1h = G.p1 ? clamp(G.p1.hp / G.p1.maxHp, 0, 1) : 1;
    const p2h = G.p2 ? clamp(G.p2.hp / G.p2.maxHp, 0, 1) : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    rr(wx(40), wy(y), bw * scale, 12 * scale, 4 * scale);
    ctx.fill();
    rr(wx(VW - 40 - bw), wy(y), bw * scale, 12 * scale, 4 * scale);
    ctx.fill();
    ctx.fillStyle = rgba(p1h < 0.28 ? MAG : HOT, 0.95);
    ctx.fillRect(wx(40 + bw * (1 - p1h)), wy(y), bw * p1h * scale, 12 * scale);
    ctx.fillStyle = rgba(p2h < 0.28 ? MAG : CYN, 0.95);
    ctx.fillRect(wx(VW - 40 - bw), wy(y), bw * p2h * scale, 12 * scale);
    ctx.strokeStyle = rgba(GOLD, 0.45);
    ctx.lineWidth = 1.2 * scale;
    rr(wx(40), wy(y), bw * scale, 12 * scale, 4 * scale);
    ctx.stroke();
    rr(wx(VW - 40 - bw), wy(y), bw * scale, 12 * scale, 4 * scale);
    ctx.stroke();

    ctx.fillStyle = rgba(GOLD, G.timer <= 10 ? 0.95 : 0.85);
    ctx.font = '900 ' + (18 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(Math.max(0, Math.ceil(G.timer))), wx(VW / 2), wy(30));

    ctx.font = '700 ' + (11 * scale) + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = rgba(HOT2, 0.9);
    ctx.fillText(G.p1 ? G.p1.spec.name : '赤拳', wx(40), wy(y + 24));
    ctx.textAlign = 'right';
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.fillText(G.p2 ? G.p2.spec.name : '青影', wx(VW - 40), wy(y + 24));

    let i;
    for (i = 0; i < WINS_NEED; i++) {
      ctx.beginPath();
      ctx.fillStyle = i < G.pWins ? rgba(HOT, 1) : 'rgba(255,255,255,0.12)';
      ctx.arc(wx(52 + i * 12), wy(y + 34), 4 * scale, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = i < G.cWins ? rgba(CYN, 1) : 'rgba(255,255,255,0.12)';
      ctx.arc(wx(VW - 52 - i * 12), wy(y + 34), 4 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawCall() {
    if (G.callT <= 0 || !G.call) return;
    const a = G.callT > 0.2 ? 1 : G.callT / 0.2;
    const big = G.call === 'KO' || G.call === '开打';
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = '900 ' + ((big ? 56 : 36) * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = G.call === 'KO' ? rgba(HOT, 1) : rgba(GOLD, 1);
    ctx.shadowColor = G.call === 'KO' ? rgba(HOT, 0.8) : rgba(GOLD, 0.6);
    ctx.shadowBlur = 18 * scale;
    const slam = G.call === 'KO' ? 1 + (1 - Math.min(1, 1.4 - G.callT)) * 0.15 : 1;
    ctx.translate(wx(VW / 2), wy(140));
    ctx.scale(slam, slam);
    ctx.fillText(G.call, 0, 0);
    ctx.restore();
  }

  function draw() {
    ctx.fillStyle = '#080208';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    let sx = 0;
    let sy = 0;
    if (G.shake > 0) {
      sx = (Math.random() - 0.5) * 10 * G.shake;
      sy = (Math.random() - 0.5) * 8 * G.shake;
    }
    if (G.slam > 0) sy += 10 * G.slam;
    ctx.translate(sx, sy);
    drawArena();
    if (G.p1) drawFighter(G.p1);
    if (G.p2) drawFighter(G.p2);
    drawBalls();
    drawFx();
    drawHudWorld();
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
    else if (k === 'z' || k === 'Z') {
      setKey('lp', down);
      if (down && !e.repeat) lpEdge.down = true;
    } else if (k === 'x' || k === 'X') {
      setKey('hp', down);
      if (down && !e.repeat) hpEdge.down = true;
    } else if (k === 'c' || k === 'C') {
      setKey('kick', down);
      if (down && !e.repeat) kickEdge.down = true;
    } else if (down && (k === 'r' || k === 'R')) {
      e.preventDefault();
      retry();
      return;
    } else if (down && (k === 'm' || k === 'M')) {
      e.preventDefault();
      audio.setMuted(!audio.muted);
      return;
    } else if (down && overlayOpen() && G.mode === 'title' && (k === 'Enter' || k === ' ' || k === '1')) {
      e.preventDefault();
      startMatch('versus');
      return;
    } else if (down && overlayOpen() && G.mode === 'title' && k === '2') {
      e.preventDefault();
      startMatch('gauntlet');
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
    if (G.mode === 'title') startMatch('versus');
    else startMatch(G.kind || 'versus');
  }

  function goMenu() {
    audio.ui();
    showTitle();
  }

  bindPad(padBtns.l, function () { keys.l = true; }, function () { keys.l = false; });
  bindPad(padBtns.r, function () { keys.r = true; }, function () { keys.r = false; });
  bindPad(padBtns.u, function () { keys.u = true; jumpEdge.down = true; }, function () { keys.u = false; });
  bindPad(padBtns.d, function () { keys.d = true; }, function () { keys.d = false; });
  bindPad(padBtns.lp, function () { keys.lp = true; lpEdge.down = true; }, function () { keys.lp = false; });
  bindPad(padBtns.hp, function () { keys.hp = true; hpEdge.down = true; }, function () { keys.hp = false; });
  bindPad(padBtns.kick, function () { keys.kick = true; kickEdge.down = true; }, function () { keys.kick = false; });
  bindPad(padBtns.wave, function () { waveEdge.down = true; }, function () {});

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = keys.lp = keys.hp = keys.kick = false;
    clearEdges();
  });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      last = 0;
      keys.l = keys.r = keys.u = keys.d = keys.lp = keys.hp = keys.kick = false;
      clearEdges();
    }
  });
  window.addEventListener('resize', resize);

  if (btnRetry) btnRetry.addEventListener('click', function () { retry(); });
  if (btnMute) btnMute.addEventListener('click', function () { audio.ensure(); audio.setMuted(!audio.muted); });
  if (btnVersus) btnVersus.addEventListener('click', function () { startMatch('versus'); });
  if (btnGauntlet) btnGauntlet.addEventListener('click', function () { startMatch('gauntlet'); });
  if (modeVersus) modeVersus.addEventListener('click', function () {
    if (G.mode === 'play' || G.mode === 'end') startMatch('versus');
    else { G.kind = 'versus'; loadBest(); G.hudDirty = true; startMatch('versus'); }
  });
  if (modeGaunt) modeGaunt.addEventListener('click', function () {
    startMatch('gauntlet');
  });
  if (ovAgain) ovAgain.addEventListener('click', function () { startMatch(G.kind); });
  if (ovMenu) ovMenu.addEventListener('click', goMenu);

  canvas.addEventListener('pointerdown', function () {
    audio.ensure();
    if (G.mode === 'title' && overlayOpen()) return;
    canvas.focus();
  });
  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    audio.ensure();
  }, { passive: false });

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) { /* ignore */ }
  loadBest();
  resize();
  showTitle();
  requestAnimationFrame(frame);
})();
