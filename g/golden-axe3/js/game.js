'use strict';

/* 斧三 — Golden Axe III remake. No CDN. Distinct from 斧二 / 战斧 / 终斗. */

(function () {
  const VW = 640;
  const VH = 360;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const HP_MAX = 12;
  const HP_MEAT = 4;
  const MAGIC_MAX = 6;
  const MAGIC_START = 2;
  const MAGIC_COST = 1;
  const MAGIC_DMG = 4;
  const COMBO_WIN = 1.5;
  const BELT_TOP = 222;
  const BELT_BOT = 322;
  const WALK_X = 176;
  const WALK_Y = 112;
  const AIR = 0.74;
  const JUMP_V = 430;
  const GRAV = 1280;
  const MAX_FALL = 620;
  const INVULN = 1.35;
  const DIE_T = 0.85;
  const HURT_T = 0.34;
  const BEST_KEY = 'playbox-golden-axe3-best';
  const MUTE_KEY = 'playbox-golden-axe3-mute';
  const OPS = '方向键 / WASD 走 · 空格 / Z 斩 · C 跳 · X 魔法 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 138, 24];
  const HOT2 = [255, 180, 74];
  const WHT = [246, 241, 234];
  const LEAF = [61, 255, 122];
  const SKIN = [232, 192, 144];
  const STEEL = [196, 208, 216];
  const TEAL = [40, 160, 176];
  const PUR = [120, 56, 168];
  const BRN = [176, 108, 56];
  const NIGHT = [48, 20, 36];

  const SCORE = {
    chop: 50, lift: 80, spin: 120, air: 90, magic: 90,
    wolf: 180, blade: 320, feather: 260, rider: 400, steed: 500, boss: 8000,
    stage: 2000, gold: 250, clear: 8000
  };

  const SWORD = [
    { name: 'chop', dmg: 1, range: 36, dur: 0.22, hit0: 0.04, hit1: 0.14, kb: 56, stop: 0.045, down: false, score: 50 },
    { name: 'lift', dmg: 2, range: 38, dur: 0.26, hit0: 0.05, hit1: 0.16, kb: 78, stop: 0.055, down: false, score: 80 },
    { name: 'spin', dmg: 3, range: 40, dur: 0.34, hit0: 0.08, hit1: 0.22, kb: 118, stop: 0.075, down: true, score: 120 }
  ];
  const AIR_ATK = { name: 'air', dmg: 2, range: 34, dur: 0.28, hit0: 0.04, hit1: 0.2, kb: 96, stop: 0.06, down: true, score: 90 };
  const MAGIC_STOP = 0.07;

  const FOES = {
    wolf: {
      hp: 3, spd: 122, dmg: 1, range: 26, score: 180, w: 15, h: 28,
      think: 0.5, punchDur: 0.26, name: '狼兵'
    },
    blade: {
      hp: 6, spd: 74, dmg: 2, range: 32, score: 320, w: 17, h: 32,
      think: 0.72, punchDur: 0.36, name: '刃卫', heavy: true
    },
    feather: {
      hp: 4, spd: 82, dmg: 1, range: 96, score: 260, w: 15, h: 30,
      think: 0.68, punchDur: 0.34, name: '咒羽', caster: true
    },
    rider: {
      hp: 5, spd: 108, dmg: 2, range: 34, score: 400, w: 18, h: 32,
      think: 0.46, punchDur: 0.3, name: '骑奴', charge: true
    },
    steed: {
      hp: 8, spd: 156, dmg: 2, range: 30, score: 500, w: 22, h: 18,
      think: 0.36, punchDur: 0.22, name: '夜兽', charge: true, beast: true
    },
    riderBoss: {
      hp: 26, spd: 72, dmg: 3, range: 42, score: 8000, w: 22, h: 42,
      think: 0.4, punchDur: 0.38, name: '骑煞', boss: true, charge: true, shock: true
    }
  };

  const STAGES = [
    {
      name: '宁村', w: 2040, theme: 'village', bossKind: null, boss: '',
      packs: [
        { x: 180, gate: 500, foes: [['wolf', 250, 262], ['wolf', 340, 286]] },
        { x: 540, gate: 880, foes: [['wolf', 580, 258], ['blade', 680, 278], ['wolf', 780, 266]] },
        { x: 920, gate: 1320, foes: [['blade', 980, 260], ['wolf', 1080, 284], ['feather', 1200, 270]] },
        { x: 1380, gate: 1760, foes: [['wolf', 1420, 256], ['blade', 1520, 280], ['wolf', 1640, 268], ['blade', 1720, 254]] }
      ],
      drops: [[420, 268, 'meat'], [760, 252, 'pot'], [1180, 276, 'gold'], [1580, 262, 'meat']]
    },
    {
      name: '瀑窟', w: 2200, theme: 'cave', bossKind: null, boss: '',
      packs: [
        { x: 160, gate: 500, foes: [['wolf', 220, 264], ['feather', 340, 278]] },
        { x: 540, gate: 900, foes: [['blade', 580, 258], ['feather', 700, 282], ['wolf', 800, 266]] },
        { x: 960, gate: 1360, foes: [['feather', 1000, 254], ['rider', 1120, 276], ['blade', 1240, 268]] },
        { x: 1420, gate: 1860, foes: [['wolf', 1460, 260], ['feather', 1560, 284], ['blade', 1680, 256], ['rider', 1780, 274]] }
      ],
      drops: [[380, 270, 'pot'], [860, 250, 'meat'], [1280, 288, 'gold'], [1680, 262, 'pot']]
    },
    {
      name: '骑殿', w: 2380, theme: 'palace', bossKind: 'riderBoss', boss: '骑煞',
      packs: [
        { x: 150, gate: 500, foes: [['blade', 220, 262], ['feather', 330, 280], ['wolf', 420, 256]] },
        { x: 540, gate: 920, foes: [['rider', 580, 268], ['blade', 700, 254], ['feather', 820, 282]] },
        { x: 980, gate: 1400, foes: [['wolf', 1020, 258], ['blade', 1140, 276], ['feather', 1240, 264], ['rider', 1340, 286]] },
        { x: 1480, gate: 1880, foes: [['blade', 1520, 256], ['feather', 1640, 278], ['blade', 1740, 268], ['wolf', 1840, 254]] }
      ],
      drops: [[360, 268, 'pot'], [780, 250, 'meat'], [1180, 286, 'pot'], [1600, 262, 'gold'], [1780, 274, 'meat']]
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
  function comboMul(n) {
    return 1 + Math.min(4, Math.floor(Math.max(0, (n | 0) - 1) / 2));
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
  function stageAt(i) {
    return STAGES[((i | 0) % STAGES.length + STAGES.length) % STAGES.length];
  }
  function denser() {
    return G.kind === 'core';
  }
  function jumpHeight() {
    return (JUMP_V * JUMP_V) / (2 * GRAV);
  }
  function grounded(e) {
    return !e || e.h <= 0.5;
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (MAGIC_COST !== 1) throw new Error('magic cost');
    if (MAGIC_MAX !== 6) throw new Error('magic max');
    if (SWORD.length !== 3) throw new Error('3 sword');
    if (SWORD[0].name !== 'chop' || SWORD[2].name !== 'spin') throw new Error('sword chain');
    if (AIR_ATK.down !== true) throw new Error('air knockdown');
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(2) !== 1) throw new Error('combo 2');
    if (comboMul(3) !== 2) throw new Error('combo 3');
    if (comboMul(9) !== 5) throw new Error('combo cap');
    if (BELT_BOT - BELT_TOP < 80) throw new Error('belt');
    if (!FOES.wolf || !FOES.blade || !FOES.feather || !FOES.rider) throw new Error('foes');
    if (!FOES.riderBoss || !FOES.riderBoss.boss) throw new Error('rider boss');
    if (!FOES.steed || !FOES.steed.beast) throw new Error('steed');
    if (!FOES.feather.caster) throw new Error('feather cast');
    if (!FOES.rider.charge) throw new Error('rider charge');
    if (FOES.wolf.hp >= FOES.blade.hp) throw new Error('blade tankier');
    if (FOES.riderBoss.hp < 20) throw new Error('boss hp');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (BEST_KEY !== 'playbox-golden-axe3-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-golden-axe3-mute') throw new Error('mute key');
    if (MAGIC_STOP < 0.03 || MAGIC_STOP > 0.08) throw new Error('magic hit-stop');
    if (SWORD[2].stop < 0.06) throw new Error('spin stop');
    if (jumpHeight() < 50) throw new Error('jump');
    if (STAGES[0].name !== '宁村' || STAGES[2].name !== '骑殿') throw new Error('stage names');
    if (STAGES[2].bossKind !== 'riderBoss') throw new Error('rider last');
    if (STAGES[0].bossKind) throw new Error('no early boss');
    if (WALK_X < 120) throw new Error('walk');
    let i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.packs.length || !s.drops.length) throw new Error('stage ' + s.name);
    }
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
  const btnAxe = document.getElementById('btn-axe');
  const btnCore = document.getElementById('btn-core');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeAxe = document.getElementById('mode-axe');
  const modeCore = document.getElementById('mode-core');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const comboBox = document.getElementById('combo-box');
  const comboEl = document.getElementById('combo');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const airLabel = document.getElementById('air-label');
  const hpBar = document.getElementById('hp-bar');
  const pipsEl = document.getElementById('pips');
  const mpipsEl = document.getElementById('mpips');
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
  let uid = 1;

  const keys = { l: false, r: false, u: false, d: false, slash: false, magic: false, jump: false };
  const slashEdge = { down: false, was: false };
  const magicEdge = { down: false, was: false };
  const jumpEdge = { down: false, was: false };

  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const ghosts = [];
  const bolts = [];

  const G = {
    mode: 'title',
    kind: 'axe',
    clock: 0,
    stage: 1,
    camX: 0,
    levelW: 2040,
    theme: 'village',
    packs: [],
    enemies: [],
    drops: [],
    shots: [],
    player: null,
    boss: null,
    lives: LIVES,
    hp: HP_MAX,
    magic: MAGIC_START,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    stop: 0,
    shake: 0,
    kickX: 0,
    kickY: 0,
    flash: 0,
    flashRgb: HOT,
    invuln: 0,
    deadT: 0,
    intro: 0,
    clearT: 0,
    goT: 0,
    arenaL: 0,
    arenaR: 640,
    nextLife: LIFE_EVERY,
    why: '',
    won: false,
    hudDirty: true
  };

  function overlayOpen() {
    return overlay && !overlay.classList.contains('hidden');
  }
  function inputOk() {
    return G.mode === 'play' && !overlayOpen() && G.deadT <= 0;
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
    swing: function () {
      this.ensure();
      this.noise(0.07, 0.08, 1600, 'highpass');
      this.beep(240, 0.05, 'sawtooth', 0.03, 80);
    },
    hit: function (combo, heavy) {
      this.ensure();
      const p = 1 + Math.min(6, combo) * 0.06;
      this.noise(0.12, heavy ? 0.22 : 0.15, 240, 'lowpass');
      this.beep(180 * p, 0.1, 'square', 0.08, 62);
      this.beep((heavy ? 980 : 720) * p, 0.07, 'triangle', 0.05, 420 * p);
      if (heavy) this.beep(1320 * p, 0.09, 'square', 0.04, 1700 * p);
    },
    magic: function () {
      this.ensure();
      this.noise(0.24, 0.18, 780, 'bandpass');
      this.beep(160, 0.22, 'sawtooth', 0.07, 70);
      this.beep(880, 0.16, 'square', 0.06, 1480);
      this.beep(1320, 0.2, 'triangle', 0.05, 1880);
    },
    jump: function () {
      this.ensure();
      this.beep(280, 0.08, 'square', 0.04, 180);
      this.noise(0.06, 0.05, 900, 'highpass');
    },
    land: function () {
      this.ensure();
      this.noise(0.08, 0.1, 140, 'lowpass');
      this.beep(90, 0.07, 'square', 0.04, 50);
    },
    thunder: function () {
      this.ensure();
      this.noise(0.16, 0.2, 180, 'lowpass');
      this.beep(90, 0.14, 'sawtooth', 0.06, 40);
      this.beep(640, 0.1, 'square', 0.05, 220);
    },
    shot: function () {
      this.ensure();
      this.noise(0.08, 0.1, 780, 'bandpass');
      this.beep(320, 0.08, 'square', 0.05, 90);
    },
    food: function () {
      this.ensure();
      this.beep(392, 0.07, 'sine', 0.05, 523);
      this.beep(523, 0.1, 'triangle', 0.045, 784);
    },
    pot: function () {
      this.ensure();
      this.beep(660, 0.07, 'sine', 0.045, 880);
      this.beep(880, 0.1, 'triangle', 0.04, 1180);
    },
    gold: function () {
      this.ensure();
      this.beep(784, 0.06, 'square', 0.04, 1046);
      this.beep(1046, 0.1, 'triangle', 0.04, 1318);
    },
    hurt: function () {
      this.ensure();
      this.noise(0.16, 0.14, 240, 'lowpass');
      this.beep(280, 0.16, 'sawtooth', 0.05, 70);
    },
    ko: function () {
      this.ensure();
      this.noise(0.22, 0.16, 140, 'lowpass');
      this.beep(120, 0.26, 'sine', 0.07, 48);
    },
    win: function () {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.05, 659);
      this.beep(659, 0.1, 'square', 0.05, 784);
      this.beep(1046, 0.18, 'triangle', 0.045, 1318);
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
    oneup: function () {
      this.ensure();
      this.beep(523, 0.07, 'square', 0.05, 784);
      this.beep(784, 0.12, 'triangle', 0.045, 1046);
    },
    go: function () {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.04, 880);
      this.beep(880, 0.1, 'triangle', 0.04, 1180);
    },
    crash: function () {
      this.ensure();
      this.noise(0.2, 0.22, 150, 'lowpass');
      this.beep(90, 0.18, 'square', 0.07, 40);
    }
  };

  function loadBest() {
    try {
      const n = parseInt(localStorage.getItem(BEST_KEY), 10);
      if (n > 0) G.best = n;
    } catch (e) { /* ignore */ }
  }
  function persistBest() {
    if (G.score > G.best) G.best = G.score;
    try { localStorage.setItem(BEST_KEY, String(G.best)); } catch (e) { /* ignore */ }
  }

  /* ---- fx ---- */
  function hitStop(t) {
    if (REDUCE) return;
    if (t > G.stop) G.stop = t;
  }
  function shake(n) {
    if (REDUCE) return;
    G.shake = Math.max(G.shake, n);
  }
  function kick(kx, ky) {
    if (REDUCE) return;
    G.kickX = kx;
    G.kickY = ky;
    if (!stageEl) return;
    stageEl.classList.remove('hit');
    void stageEl.offsetWidth;
    stageEl.classList.add('hit');
    clearTimeout(kickTok);
    kickTok = setTimeout(function () { stageEl.classList.remove('hit'); }, 160);
  }
  function dieKick() {
    if (REDUCE || !stageEl) return;
    stageEl.classList.remove('die');
    void stageEl.offsetWidth;
    stageEl.classList.add('die');
    setTimeout(function () { stageEl.classList.remove('die'); }, 340);
  }
  function boomKick() {
    if (REDUCE || !stageEl) return;
    stageEl.classList.remove('boom');
    void stageEl.offsetWidth;
    stageEl.classList.add('boom');
    setTimeout(function () { stageEl.classList.remove('boom'); }, 180);
  }
  function pickupKick() {
    if (REDUCE || !stageEl) return;
    stageEl.classList.remove('pickup');
    void stageEl.offsetWidth;
    stageEl.classList.add('pickup');
    setTimeout(function () { stageEl.classList.remove('pickup'); }, 180);
  }
  function winKick() {
    if (REDUCE || !stageEl) return;
    stageEl.classList.remove('win-flash');
    void stageEl.offsetWidth;
    stageEl.classList.add('win-flash');
    setTimeout(function () { stageEl.classList.remove('win-flash'); }, 720);
  }
  function magicKick() {
    if (REDUCE || !stageEl) return;
    stageEl.classList.remove('magic');
    void stageEl.offsetWidth;
    stageEl.classList.add('magic');
    setTimeout(function () { stageEl.classList.remove('magic'); }, 440);
  }
  function thumpKick() {
    if (REDUCE || !stageEl) return;
    stageEl.classList.remove('thump');
    void stageEl.offsetWidth;
    stageEl.classList.add('thump');
    setTimeout(function () { stageEl.classList.remove('thump'); }, 160);
  }
  function flash(rgb, t) {
    G.flashRgb = rgb;
    G.flash = t;
  }
  function burst(x, y, n, rgb, spd, life) {
    let i, cap;
    cap = 180 - particles.length;
    if (n > cap) n = cap < 0 ? 0 : cap;
    if (REDUCE) n = Math.min(n, 8);
    for (i = 0; i < n; i++) {
      particles.push({
        x: x, y: y,
        vx: rand(-1, 1) * spd,
        vy: rand(-1.15, 0.35) * spd,
        t: life * rand(0.55, 1.2),
        max: life,
        r: rand(1.1, 2.8),
        rgb: rgb
      });
    }
  }
  function spark(x, y, rgb, n) {
    let i;
    if (REDUCE) n = Math.min(n, 4);
    for (i = 0; i < n; i++) {
      sparks.push({
        x: x, y: y,
        vx: rand(-1, 1) * 140,
        vy: rand(-160, -20),
        t: rand(0.1, 0.28),
        rgb: rgb
      });
    }
  }
  function ringAt(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0.45, rgb: rgb, r: 8 });
  }
  function pop(x, y, text, rgb) {
    floats.push({ x: x, y: y, vy: -42, text: text, rgb: rgb, t: 0.9, life: 0.9 });
  }
  function ghostAt(e, a) {
    if (REDUCE) return;
    ghosts.push({
      x: e.x, y: e.y, h: e.h || 0, face: e.face, t: 0.22,
      a: a || 0.35, kind: e.kind || 'player', mount: e.mount || null, step: e.step || 0,
      act: e.act, comboStep: e.comboStep
    });
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
      if (tok === chainTok) chainPop.classList.add('hidden');
    }, 700);
  }
  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastTok += 1;
    const tok = toastTok;
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden', 'warn', 'gold');
    if (warn) toastEl.classList.add('warn');
    if (gold) toastEl.classList.add('gold');
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1100);
  }
  function bumpScore(n) {
    if (n <= 0 || G.mode !== 'play') return;
    G.score += n | 0;
    persistBest();
    while (G.score >= G.nextLife) {
      G.nextLife += LIFE_EVERY;
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        audio.oneup();
        toast('1UP', false, true);
        G.hudDirty = true;
      }
    }
    if (!scoreAdd || !scoreBox) return;
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + n;
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    addTok += 1;
    const tok = addTok;
    setTimeout(function () {
      if (tok === addTok) scoreAdd.hidden = true;
    }, 700);
    G.hudDirty = true;
  }
  function bumpCombo() {
    const prev = comboMul(G.combo);
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    const mul = comboMul(G.combo);
    if (comboBox) {
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
    }
    if (mul > prev) {
      showChain(mul);
      audio.combo(mul);
    }
    G.hudDirty = true;
    return mul;
  }
  function breakCombo() {
    if (G.combo > 0) G.hudDirty = true;
    G.combo = 0;
    G.comboT = 0;
  }
  function addMagic(n) {
    G.magic = clamp(G.magic + n, 0, MAGIC_MAX);
    G.hudDirty = true;
  }
  function resetFx() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    ghosts.length = 0;
    bolts.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.kickX = 0;
    G.kickY = 0;
    G.flash = 0;
  }
  function tickFx(dt) {
    let i, p;
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.shake *= Math.max(0, 1 - dt * 7);
    G.kickX *= Math.max(0, 1 - dt * 10);
    G.kickY *= Math.max(0, 1 - dt * 10);
    if (G.shake < 0.2) G.shake = 0;
    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 90 * dt;
      if (p.t <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      p = sparks[i];
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 240 * dt;
      if (p.t <= 0) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      p = rings[i];
      p.t -= dt;
      if (p.t <= 0) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      p = floats[i];
      p.t -= dt;
      p.y += p.vy * dt;
      if (p.t <= 0) floats.splice(i, 1);
    }
    for (i = ghosts.length - 1; i >= 0; i--) {
      p = ghosts[i];
      p.t -= dt;
      if (p.t <= 0) ghosts.splice(i, 1);
    }
    capArr(particles, 180);
    capArr(sparks, 80);
    capArr(ghosts, 16);
    capArr(bolts, 24);
  }

  /* ---- hud / overlay ---- */
  function setHint(t, cls) {
    if (!hintEl) return;
    hintEl.textContent = t;
    hintEl.classList.remove('hot', 'warn');
    if (cls) hintEl.classList.add(cls);
  }
  function showOverlay() {
    overlay.classList.remove('hidden', 'end');
  }
  function showEndOverlay() {
    overlay.classList.remove('hidden');
    overlay.classList.add('end');
  }
  function hideOverlay() {
    overlay.classList.add('hidden');
    overlay.classList.remove('end');
  }
  function setModes(kind) {
    if (modeAxe) modeAxe.setAttribute('aria-pressed', kind === 'axe' ? 'true' : 'false');
    if (modeCore) modeCore.setAttribute('aria-pressed', kind === 'core' ? 'true' : 'false');
  }
  function syncHud() {
    const p = G.player;
    const hp = p ? p.hp : G.hp;
    const max = p ? p.maxHp : HP_MAX;
    if (scoreEl) scoreEl.textContent = String(G.score | 0);
    if (bestEl) bestEl.textContent = String(G.best | 0);
    if (comboEl) comboEl.textContent = '×' + comboMul(G.combo);
    if (hpBar) {
      hpBar.style.transform = 'scaleX(' + clamp(hp / max, 0, 1) + ')';
      hpBar.classList.toggle('low', hp / max < 0.32);
    }
    if (airLabel) {
      const air = p && p.h > 2;
      airLabel.textContent = air ? '跳起' : '落地';
      airLabel.classList.toggle('hot', !!air);
      airLabel.classList.toggle('empty', !air);
    }
    if (tagLabel) {
      tagLabel.textContent = G.kind === 'core' ? '斧核' : '斧三';
      tagLabel.classList.toggle('warn', G.kind === 'core');
    }
    if (stageLabel) {
      stageLabel.textContent = stageAt(G.stage - 1).name;
      stageLabel.classList.toggle('hot', !!G.boss);
    }
    if (pipsEl) {
      const n = Math.max(LIVES, G.lives);
      let html = '';
      let i;
      for (i = 0; i < n; i++) {
        html += '<i class="pip' + (i < G.lives ? ' on' : ' gone') + '"></i>';
      }
      pipsEl.innerHTML = html;
    }
    if (mpipsEl) {
      let html = '';
      let i;
      for (i = 0; i < MAGIC_MAX; i++) {
        html += '<i class="mpip' + (i < G.magic ? ' on' : '') + '"></i>';
      }
      mpipsEl.innerHTML = html;
    }
    G.hudDirty = false;
  }

  /* ---- factories ---- */
  function makePlayer(x, y) {
    return {
      id: uid++,
      kind: 'player',
      x: x, y: y,
      vx: 0, vy: 0,
      h: 0, vh: 0,
      face: 1,
      hp: HP_MAX,
      maxHp: HP_MAX,
      act: 'idle',
      t: 0,
      step: 0,
      hit: false,
      slashBuf: 0,
      magicBuf: 0,
      jumpBuf: 0,
      comboStep: 0,
      chainT: 0,
      stun: 0,
      coyote: 0,
      airUsed: false,
      squash: 1,
      run: 0
    };
  }
  function makeFoe(kind, x, y, scaleHp, scaleSpd, mount) {
    const spec = FOES[kind];
    const hpMul = scaleHp || 1;
    const spdMul = scaleSpd || 1;
    const isRider = kind === 'rider' || kind === 'riderBoss';
    return {
      id: uid++,
      kind: kind,
      spec: spec,
      x: x, y: y,
      vx: 0, vy: 0,
      h: 0, vh: 0,
      face: -1,
      hp: Math.round(spec.hp * hpMul),
      maxHp: Math.round(spec.hp * hpMul),
      spd: spec.spd * spdMul,
      act: 'idle',
      t: rand(0.1, spec.think),
      step: 0,
      hit: false,
      stun: 0,
      dead: false,
      deadT: 0,
      charge: 0,
      boss: !!spec.boss,
      flashT: 0,
      think: spec.think / spdMul,
      pack: -1,
      cool: 0,
      mount: mount || (isRider ? 'night' : null)
    };
  }
  function makeDrop(x, y, kind) {
    return { x: x, y: y, kind: kind, bob: rand(0, TAU), taken: false };
  }
  function makeShot(x, y, face, kind, from) {
    return {
      x: x, y: y, face: face,
      vx: face * (kind === 'shock' ? 240 : 270),
      life: kind === 'shock' ? 0.8 : 0.72,
      kind: kind,
      from: from || 'foe',
      hit: {},
      dmg: kind === 'shock' ? 3 : 2
    };
  }
  function makeBolt(x, y, delay) {
    return { x: x, y: y, delay: delay || 0, t: 0.46, struck: false };
  }

  function lookOf(kind) {
    if (kind === 'player') {
      return { jacket: TEAL, pants: [28, 40, 64], hair: [24, 28, 36], skin: SKIN, accent: GOLD, hairStyle: 'helm', size: 1, sword: true };
    }
    if (kind === 'wolf') {
      return { jacket: [118, 92, 74], pants: [46, 36, 30], hair: [72, 54, 44], skin: [176, 142, 114], accent: HOT, hairStyle: 'wolf', size: 0.94, claw: true };
    }
    if (kind === 'blade') {
      return { jacket: [56, 64, 78], pants: [32, 34, 42], hair: [22, 20, 24], skin: [196, 140, 108], accent: STEEL, hairStyle: 'helm', size: 1.08, sword: true };
    }
    if (kind === 'feather') {
      return { jacket: PUR, pants: [28, 18, 48], hair: [40, 20, 60], skin: [210, 160, 140], accent: MAG, hairStyle: 'hood', size: 0.98, staff: true };
    }
    if (kind === 'rider') {
      return { jacket: [88, 36, 48], pants: [32, 22, 28], hair: [80, 40, 20], skin: SKIN, accent: HOT, hairStyle: 'wild', size: 1.0, sword: true };
    }
    if (kind === 'steed') {
      return { jacket: NIGHT, pants: NIGHT, hair: MAG, skin: NIGHT, accent: MAG, hairStyle: 'beast', size: 1.15, beast: true };
    }
    return { jacket: [32, 18, 28], pants: [18, 12, 16], hair: [12, 8, 10], skin: [176, 120, 92], accent: GOLD, hairStyle: 'crown', size: 1.32, sword: true };
  }

  /* ---- world helpers ---- */
  function clampBelt(e) {
    e.y = clamp(e.y, BELT_TOP, BELT_BOT);
    e.x = clamp(e.x, G.arenaL + 18, G.arenaR - 18);
  }
  function facingToward(e, tx) {
    if (tx > e.x + 4) e.face = 1;
    else if (tx < e.x - 4) e.face = -1;
  }
  function depthHit(a, b) {
    return Math.abs(a.y - b.y) < 22;
  }

  function packAlive(packId) {
    let i, e, n = 0;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.pack === packId && !e.dead) n += 1;
    }
    return n;
  }

  function tickAir(e, dt) {
    if (e.h > 0 || e.vh !== 0) {
      e.vh -= GRAV * dt;
      if (e.vh < -MAX_FALL) e.vh = -MAX_FALL;
      e.h += e.vh * dt;
      if (e.h <= 0) {
        const hard = e.vh < -220;
        e.h = 0;
        e.vh = 0;
        e.airUsed = false;
        e.coyote = 0.1;
        e.squash = 0.82;
        if (hard && e.kind === 'player') {
          thumpKick();
          audio.land();
          burst(e.x, e.y, 6, HOT2, 70, 0.22);
        }
      }
    } else {
      e.h = 0;
      e.vh = 0;
      e.coyote = Math.max(0, (e.coyote || 0) - dt);
    }
    if (e.squash != null && e.squash < 1) {
      e.squash = Math.min(1, e.squash + dt * 4.5);
    }
  }

  function doJump(p) {
    if (p.act === 'hurt' || p.act === 'down' || p.act === 'magic') return false;
    if (p.h > 4 && p.coyote <= 0) return false;
    p.h = Math.max(p.h, 1);
    p.vh = JUMP_V;
    p.coyote = 0;
    p.airUsed = false;
    p.squash = 1.12;
    audio.jump();
    ghostAt(p, 0.28);
    return true;
  }

  /* ---- combat ---- */
  function hurtEnemy(e, dmg, kb, face, finisher) {
    if (e.dead) return;
    if (G.mode !== 'play') {
      e.hp -= dmg;
      e.stun = 0.2;
      e.act = e.hp <= 0 ? 'down' : 'hurt';
      e.t = e.hp <= 0 ? 0.4 : 0.2;
      e.vx = face * kb * 0.5;
      e.flashT = 0.1;
      if (e.hp <= 0) {
        e.dead = true;
        e.deadT = 0.5;
      }
      return;
    }
    e.hp -= dmg;
    e.stun = finisher ? 0.5 : 0.2;
    e.act = e.hp <= 0 ? 'down' : 'hurt';
    e.t = e.hp <= 0 ? 0.55 : 0.28;
    e.vx = face * kb;
    e.flashT = 0.12;
    e.face = -face;
    e.charge = 0;
    if (finisher && e.h < 8) e.vh = 180;
    const mul = bumpCombo();
    const kill = Math.round(e.spec.score * mul);
    const chip = Math.max(12, Math.round((14 + dmg * 8) * mul));
    maybeDismount(e);
    if (e.hp <= 0) {
      e.dead = true;
      e.deadT = 0.64;
      e.act = 'down';
      bumpScore(kill);
      pop(e.x, e.y - 36 - e.h, '+' + kill, GOLD);
      burst(e.x, e.y - 18 - e.h, 20, e.kind === 'feather' ? PUR : MAG, 200, 0.46);
      spark(e.x, e.y - 20 - e.h, GOLD, 9);
      if (e.boss) {
        burst(e.x, e.y - 24 - e.h, 36, GOLD, 260, 0.6);
        flash(GOLD, 0.55);
        audio.ko();
      }
      maybeDrop(e);
    } else {
      bumpScore(chip);
      pop(e.x, e.y - 32 - e.h, '+' + chip, WHT);
    }
    G.hudDirty = true;
  }

  function maybeDismount(e) {
    if (!e.boss || !e.mount) return;
    if (e.hp > e.maxHp * 0.5) return;
    const st = makeFoe('steed', e.x + e.face * 22, e.y, denser() ? 1.16 : 1, denser() ? 1.12 : 1);
    st.pack = -4;
    st.face = e.face;
    G.enemies.push(st);
    e.mount = null;
    audio.crash();
    flash(MAG, 0.28);
    shake(10);
    boomKick();
    burst(e.x, e.y - 8, 18, MAG, 180, 0.4);
    toast('骑煞摔下', true, false);
  }

  function maybeDrop(e) {
    if (G.mode !== 'play') return;
    if (e.boss) {
      G.drops.push(makeDrop(e.x, e.y, 'pot'));
      G.drops.push(makeDrop(e.x + 16, e.y + 8, 'meat'));
      return;
    }
    const r = Math.random();
    if (r < 0.12) G.drops.push(makeDrop(e.x, e.y, 'meat'));
    else if (r < 0.2) G.drops.push(makeDrop(e.x, e.y, 'pot'));
    else if (r < 0.26) G.drops.push(makeDrop(e.x, e.y, 'gold'));
  }

  function hurtPlayer(dmg, face, why) {
    const p = G.player;
    if (!p || G.invuln > 0 || G.deadT > 0) return;
    if (G.mode !== 'play') return;
    p.hp -= dmg;
    G.hp = p.hp;
    breakCombo();
    p.act = 'hurt';
    p.t = HURT_T;
    p.stun = HURT_T;
    p.vx = face * 150;
    p.comboStep = 0;
    if (p.h > 2) p.vh = Math.min(p.vh, -40);
    G.invuln = 0.5;
    audio.hurt();
    flash(MAG, 0.28);
    shake(7);
    kick(face * 5, 2);
    burst(p.x, p.y - 20 - p.h, 10, HOT, 140, 0.32);
    G.why = why || '摔了';
    G.hudDirty = true;
    if (p.hp <= 0) {
      p.hp = 0;
      G.hp = 0;
      loseLife(why || '摔了');
    }
  }

  function loseLife(why) {
    const p = G.player;
    G.why = why || '摔了';
    G.deadT = DIE_T;
    G.lives -= 1;
    G.hudDirty = true;
    if (p) {
      p.act = 'down';
      p.t = DIE_T;
      p.hp = 0;
    }
    audio.ko();
    dieKick();
    flash(HOT, 0.5);
    shake(11);
    if (G.lives < 0) G.lives = 0;
  }

  function respawn() {
    const p = G.player;
    if (G.lives <= 0) {
      showOver(false);
      return;
    }
    if (!p) return;
    p.hp = HP_MAX;
    p.maxHp = HP_MAX;
    G.hp = HP_MAX;
    p.act = 'idle';
    p.t = 0;
    p.vx = 0;
    p.vh = 0;
    p.h = 0;
    p.stun = 0;
    p.comboStep = 0;
    p.airUsed = false;
    G.deadT = 0;
    G.invuln = INVULN;
    G.hudDirty = true;
    toast('再上', false, true);
  }

  function slashHits(p, atk) {
    const face = p.face;
    let i, e, d, n = 0;
    const extra = p.h > 8 ? 8 : 0;
    const hTol = p.h > 6 ? 56 : 26;
    const behind = atk.name === 'spin' || atk.name === 'air' ? atk.range : 14;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead) continue;
      if (!depthHit(p, e)) continue;
      if (Math.abs((p.h || 0) - (e.h || 0)) > hTol) continue;
      d = (e.x - p.x) * face;
      if (d < -behind || d > atk.range + extra) continue;
      hurtEnemy(e, atk.dmg, atk.kb, face, !!atk.down);
      n += 1;
    }
    return n;
  }

  function startSlash(p) {
    if (!grounded(p) && p.h > 6) {
      if (p.airUsed) return;
      p.airUsed = true;
      p.act = 'air';
      p.t = AIR_ATK.dur;
      p.hit = false;
      p.vh = Math.min(p.vh, 80);
      audio.swing();
      ghostAt(p, 0.4);
      return;
    }
    let step = 0;
    if (p.chainT > 0) step = Math.min(2, p.comboStep + 1);
    p.comboStep = step;
    p.act = 'slash';
    p.t = SWORD[step].dur;
    p.hit = false;
    p.vx *= 0.25;
    audio.swing();
  }

  function startMagic(p) {
    if (G.mode === 'play' && G.magic < MAGIC_COST) {
      toast('魔法空了', true, false);
      audio.ui();
      return;
    }
    if (G.mode === 'play') addMagic(-MAGIC_COST);
    p.act = 'magic';
    p.t = 0.42;
    p.hit = false;
    audio.magic();
    flash(CYN, 0.45);
    shake(8);
    magicKick();
    ringAt(p.x, p.y - 16 - p.h, CYN);
    burst(p.x, p.y - 18 - p.h, 16, CYN, 180, 0.36);
    ghostAt(p, 0.45);
    spawnThunder(p);
  }

  function spawnThunder(p) {
    const marks = [];
    let i, e, d;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead) continue;
      d = hypot(e.x - p.x, e.y - p.y);
      if (d < 168) marks.push(e);
    }
    if (!marks.length) {
      bolts.push(makeBolt(p.x + p.face * 46, p.y, 0.02));
      bolts.push(makeBolt(p.x + p.face * 78, p.y + 10, 0.1));
      return;
    }
    marks.sort(function (a, b) {
      return hypot(a.x - p.x, a.y - p.y) - hypot(b.x - p.x, b.y - p.y);
    });
    const n = Math.min(marks.length, 5);
    for (i = 0; i < n; i++) {
      bolts.push(makeBolt(marks[i].x, marks[i].y, 0.04 + i * 0.07));
    }
  }

  function applyBolt(b) {
    let i, e, n = 0, dmg, face;
    const p = G.player;
    face = p ? p.face : 1;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead) continue;
      if (Math.abs(e.x - b.x) > 22) continue;
      if (Math.abs(e.y - b.y) > 20) continue;
      dmg = e.boss ? 2 : MAGIC_DMG;
      hurtEnemy(e, dmg, 90, face, true);
      n += 1;
    }
    if (n > 0) {
      hitStop(MAGIC_STOP);
      shake(8);
      kick(0, 4);
      burst(b.x, b.y - 16, 18, CYN, 210, 0.4);
      spark(b.x, b.y - 16, GOLD, 8);
      ringAt(b.x, b.y - 10, CYN);
      audio.hit(G.combo, true);
      audio.thunder();
    } else {
      burst(b.x, b.y - 8, 8, CYN, 90, 0.24);
      audio.thunder();
    }
  }

  function tickBolts(dt) {
    let i, b;
    for (i = bolts.length - 1; i >= 0; i--) {
      b = bolts[i];
      if (b.delay > 0) {
        b.delay -= dt;
        continue;
      }
      b.t -= dt;
      if (!b.struck && b.t < 0.32) {
        b.struck = true;
        applyBolt(b);
      }
      if (b.t <= 0) bolts.splice(i, 1);
    }
  }

  /* ---- player ---- */
  function followUp(p) {
    if (p.magicBuf > 0) {
      p.magicBuf = 0;
      startMagic(p);
      return true;
    }
    if (p.slashBuf > 0) {
      p.slashBuf = 0;
      startSlash(p);
      return true;
    }
    if (p.jumpBuf > 0 && (grounded(p) || p.coyote > 0)) {
      p.jumpBuf = 0;
      doJump(p);
      return true;
    }
    return false;
  }

  function tickPlayer(dt) {
    const p = G.player;
    if (!p) return;
    p.slashBuf = Math.max(0, p.slashBuf - dt);
    p.magicBuf = Math.max(0, p.magicBuf - dt);
    p.jumpBuf = Math.max(0, p.jumpBuf - dt);
    p.chainT = Math.max(0, p.chainT - dt);
    p.stun = Math.max(0, p.stun - dt);
    p.step += dt;
    tickAir(p, dt);

    if (G.deadT > 0) {
      G.deadT -= dt;
      p.act = 'down';
      p.vx *= Math.max(0, 1 - dt * 6);
      p.x += p.vx * dt;
      clampBelt(p);
      if (G.deadT <= 0) respawn();
      return;
    }

    if (G.invuln > 0) G.invuln = Math.max(0, G.invuln - dt);

    if (p.act === 'hurt') {
      p.t -= dt;
      p.x += p.vx * dt;
      p.vx *= Math.max(0, 1 - dt * 5);
      clampBelt(p);
      if (p.t <= 0) p.act = 'idle';
      return;
    }

    if (p.act === 'magic') {
      p.t -= dt;
      clampBelt(p);
      if (p.t <= 0) {
        p.act = 'idle';
        if (followUp(p)) return;
      }
      return;
    }

    if (p.act === 'air') {
      p.t -= dt;
      p.x += p.vx * dt * 0.4;
      if (!p.hit && p.t < AIR_ATK.dur - AIR_ATK.hit0 && p.t > AIR_ATK.dur - AIR_ATK.hit1) {
        const n = slashHits(p, AIR_ATK);
        p.hit = true;
        if (n > 0) {
          hitStop(AIR_ATK.stop);
          shake(7);
          kick(p.face * 5, 3);
          burst(p.x + p.face * 20, p.y - 16 - p.h, 14, CYN, 170, 0.32);
          spark(p.x + p.face * 20, p.y - 16 - p.h, GOLD, 7);
          audio.hit(G.combo, true);
          p.vh = 160;
        }
      }
      clampBelt(p);
      if (p.t <= 0) {
        p.act = 'idle';
        if (followUp(p)) return;
      }
      return;
    }

    if (p.act === 'slash') {
      p.t -= dt;
      const atk = SWORD[p.comboStep] || SWORD[0];
      if (!p.hit && p.t < atk.dur - atk.hit0 && p.t > atk.dur - atk.hit1) {
        const n = slashHits(p, atk);
        p.hit = true;
        if (n > 0) {
          hitStop(atk.stop);
          shake(atk.down ? 8 : 5);
          kick(p.face * (atk.down ? 6 : 4), 2);
          burst(p.x + p.face * 22, p.y - 16, atk.down ? 16 : 8, HOT, 160, 0.32);
          spark(p.x + p.face * 22, p.y - 16, GOLD, atk.down ? 8 : 4);
          audio.hit(G.combo, !!atk.down);
          if (p.comboStep === 1) {
            let j, e;
            for (j = 0; j < G.enemies.length; j++) {
              e = G.enemies[j];
              if (!e.dead && depthHit(p, e) && (e.x - p.x) * p.face > 0) e.vh = 220;
            }
          }
        }
      }
      if (p.t <= 0) {
        p.chainT = 0.32;
        p.act = 'idle';
        if (followUp(p)) return;
      }
      clampBelt(p);
      return;
    }

    let mx = 0, my = 0;
    if (G.mode === 'title') {
      demoMove(p);
      mx = p._mx || 0;
      my = p._my || 0;
    } else if (inputOk()) {
      if (keys.l) mx -= 1;
      if (keys.r) mx += 1;
      if (keys.u) my -= 1;
      if (keys.d) my += 1;
    }
    if (mx) p.face = mx > 0 ? 1 : -1;
    const mag = hypot(mx, my) || 1;
    const airMul = grounded(p) ? 1 : AIR;
    p.x += (mx / mag) * WALK_X * airMul * dt;
    p.y += (my / mag) * WALK_Y * airMul * dt;
    p.act = (mx || my) ? 'walk' : 'idle';
    if (p.act === 'walk') p.step += dt * 2.2;
    clampBelt(p);

    const canAct = G.mode === 'title' || inputOk();
    if (canAct && p.jumpBuf > 0 && (grounded(p) || p.coyote > 0)) {
      p.jumpBuf = 0;
      doJump(p);
    }
    if (canAct && p.magicBuf > 0) {
      p.magicBuf = 0;
      startMagic(p);
      return;
    }
    if (canAct && p.slashBuf > 0) {
      p.slashBuf = 0;
      startSlash(p);
    }
    const airNow = p.h > 2;
    if (airNow !== p._airHud) {
      p._airHud = airNow;
      G.hudDirty = true;
    }
  }

  function demoMove(p) {
    let best = null, bd = 9999, i, e, d;
    p._mx = 0;
    p._my = 0;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead) continue;
      d = hypot(e.x - p.x, e.y - p.y);
      if (d < bd) { bd = d; best = e; }
    }
    if (!best) {
      p._mx = 1;
      if (p.x > 420) p.x = 120;
      return;
    }
    if (best.x > p.x + 10) p._mx = 1;
    else if (best.x < p.x - 10) p._mx = -1;
    if (best.y > p.y + 8) p._my = 1;
    else if (best.y < p.y - 8) p._my = -1;
    if (bd < 46 && grounded(p) && (p.act === 'idle' || p.act === 'walk')) p.slashBuf = 0.1;
    else if (bd > 54 && bd < 90 && grounded(p) && G.clock % 2.4 < 0.08) p.jumpBuf = 0.1;
    else if (bd > 100 && G.clock % 3.2 < 0.05) p.magicBuf = 0.1;
    if (!grounded(p) && bd < 50 && !p.airUsed) p.slashBuf = 0.1;
  }

  /* ---- enemies ---- */
  function foePunchHit(e) {
    const p = G.player;
    if (!p || G.deadT > 0) return;
    if (!depthHit(e, p)) return;
    if (p.h > 22 && e.h < 4 && !e.spec.beast) return;
    const d = (p.x - e.x) * e.face;
    if (d < 4 || d > e.spec.range + (e.mount ? 10 : 0)) return;
    hurtPlayer(e.spec.dmg, e.face, '被' + e.spec.name + '打中了');
  }

  function foeChargeHit(e) {
    const p = G.player;
    if (!p || G.deadT > 0) return;
    if (!depthHit(e, p)) return;
    if (p.h > 26 && !e.spec.beast) return;
    if (Math.abs(p.x - e.x) > 22) return;
    const why = e.boss ? '被骑煞碾了' : (e.spec.beast ? '被夜兽撞了' : '被撞倒了');
    hurtPlayer(e.spec.dmg + (e.boss ? 1 : 0), e.vx > 0 ? 1 : -1, why);
  }

  function tickFoe(e, dt) {
    if (e.dead) {
      e.deadT -= dt;
      e.act = 'down';
      e.vx *= Math.max(0, 1 - dt * 5);
      e.x += e.vx * dt;
      tickAir(e, dt);
      return;
    }
    e.flashT = Math.max(0, e.flashT - dt);
    e.stun = Math.max(0, e.stun - dt);
    e.cool = Math.max(0, e.cool - dt);
    e.step += dt;
    tickAir(e, dt);

    if (e.act === 'hurt' || e.act === 'down') {
      e.t -= dt;
      e.x += e.vx * dt;
      e.vx *= Math.max(0, 1 - dt * 5);
      clampBelt(e);
      if (e.t <= 0) {
        e.act = 'idle';
        e.t = e.think;
      }
      return;
    }
    if (e.act === 'punch') {
      e.t -= dt;
      if (!e.hit && e.t < e.spec.punchDur * 0.55) {
        e.hit = true;
        foePunchHit(e);
      }
      if (e.t <= 0) {
        e.act = 'idle';
        e.t = e.think;
      }
      clampBelt(e);
      return;
    }
    if (e.act === 'charge') {
      e.t -= dt;
      e.x += e.vx * dt;
      foeChargeHit(e);
      if ((G.clock * 14) % 1 < dt * 14) ghostAt(e, 0.22);
      clampBelt(e);
      if (e.t <= 0 || e.x <= G.arenaL + 20 || e.x >= G.arenaR - 20) {
        e.act = 'idle';
        e.t = e.think;
        e.vx = 0;
      }
      return;
    }
    if (e.act === 'cast') {
      e.t -= dt;
      if (!e.hit && e.t < 0.16) {
        e.hit = true;
        const kind = e.spec.shock ? 'shock' : 'feather';
        G.shots.push(makeShot(e.x + e.face * 16, e.y, e.face, kind, 'foe'));
        audio.shot();
      }
      if (e.t <= 0) {
        e.act = 'idle';
        e.t = e.think * 1.15;
      }
      return;
    }

    const p = G.player;
    if (!p) return;
    facingToward(e, p.x);
    const dx = p.x - e.x;
    const dy = p.y - e.y;
    const dist = hypot(dx, dy);
    e.t -= dt;

    const canCharge = (e.spec.charge || e.mount || e.spec.beast) && Math.abs(dy) < 14 && Math.abs(dx) > 48 && e.cool <= 0;
    const canCast = (e.spec.caster || e.spec.shock) && Math.abs(dy) < 18 && Math.abs(dx) > 52 && Math.abs(dx) < e.spec.range && e.cool <= 0;
    const meleeR = e.spec.caster ? 30 : e.spec.range;
    const inMelee = Math.abs(dx) < meleeR && Math.abs(dy) < 16;
    const hold = e.spec.beast ? 22 : 28;

    if (e.t <= 0) {
      if (e.kind === 'riderBoss' && e.cool <= 0 && G.mode === 'play' && !e.mount) {
        let steeds = 0;
        let gi;
        for (gi = 0; gi < G.enemies.length; gi++) {
          if (!G.enemies[gi].dead && G.enemies[gi].kind === 'steed') steeds += 1;
        }
        if (steeds < 1 && Math.random() < 0.35) {
          const ge = makeFoe('wolf', e.x - e.face * 70, clamp(e.y + rand(-18, 18), BELT_TOP, BELT_BOT), denser() ? 1.16 : 1, denser() ? 1.12 : 1);
          ge.pack = -3;
          G.enemies.push(ge);
          e.cool = 2.6;
          e.t = e.think;
          toast('狼卫', true, false);
          return;
        }
      }
      if (canCharge) {
        e.act = 'charge';
        e.t = e.spec.beast ? 0.7 : 0.52;
        e.vx = e.face * e.spd * (e.spec.beast ? 2.4 : 2.15);
        e.cool = e.spec.beast ? 1.1 : 1.5;
        return;
      }
      if (canCast) {
        e.act = 'cast';
        e.t = 0.38;
        e.hit = false;
        e.cool = e.spec.shock ? 1.2 : 1.35;
        return;
      }
      if (inMelee && !e.spec.beast) {
        e.act = 'punch';
        e.t = e.spec.punchDur;
        e.hit = false;
        return;
      }
      e.t = e.think;
    }

    let spd = e.spd;
    if (e.spec.heavy) spd *= 0.86;
    if (e.mount) spd *= 1.16;
    if (e.spec.caster && dist < 70) spd *= 0.3;
    const slotY = p.y + ((e.id % 5) - 2) * 10;
    const ddy = slotY - e.y;
    const dist2 = hypot(dx, ddy) || 1;
    if (dist > hold) {
      e.x += (dx / dist2) * spd * dt;
      e.y += (ddy / dist2) * spd * 0.72 * dt;
      e.act = 'walk';
    } else {
      e.act = 'idle';
    }
    clampBelt(e);
  }

  function tickShots(dt) {
    let i, s, p;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      s.life -= dt;
      s.x += s.vx * dt;
      if (s.kind === 'feather') burst(s.x, s.y - 10, REDUCE ? 1 : 2, MAG, 40, 0.16);
      if (s.life <= 0 || s.x < G.camX - 50 || s.x > G.camX + VW + 50) {
        G.shots.splice(i, 1);
        continue;
      }
      p = G.player;
      if (!p || G.deadT > 0 || G.invuln > 0) continue;
      if (p.h > 28 && s.kind !== 'shock') continue;
      if (Math.abs(s.y - p.y) > 14) continue;
      if (Math.abs(s.x - p.x) > 14) continue;
      G.shots.splice(i, 1);
      burst(p.x, p.y - 16 - p.h, 10, s.kind === 'shock' ? GOLD : MAG, 140, 0.28);
      hurtPlayer(s.kind === 'shock' ? 3 : 2, s.face, s.kind === 'shock' ? '被骑煞砸了' : '被咒羽刺了');
    }
  }

  function tickDrops(dt) {
    let i, d, p;
    p = G.player;
    for (i = G.drops.length - 1; i >= 0; i--) {
      d = G.drops[i];
      d.bob += dt * 3;
      if (!p || G.deadT > 0 || G.mode !== 'play') continue;
      if (Math.abs(d.x - p.x) < 16 && Math.abs(d.y - p.y) < 14 && grounded(p)) {
        if (d.kind === 'meat') {
          p.hp = Math.min(p.maxHp, p.hp + HP_MEAT);
          G.hp = p.hp;
          audio.food();
          toast('烤肉', false, true);
          pop(d.x, d.y - 20, '+HP', GOLD);
        } else if (d.kind === 'pot') {
          addMagic(1);
          audio.pot();
          toast('魔壶', false, true);
          pop(d.x, d.y - 20, '+雷', CYN);
        } else {
          const n = Math.round(SCORE.gold * comboMul(Math.max(1, G.combo)));
          bumpScore(n);
          audio.gold();
          toast('金币', false, true);
          pop(d.x, d.y - 20, '+' + n, GOLD);
        }
        pickupKick();
        burst(d.x, d.y - 8, 10, d.kind === 'pot' ? CYN : GOLD, 90, 0.3);
        G.drops.splice(i, 1);
        G.hudDirty = true;
      }
    }
  }

  /* ---- stage flow ---- */
  function extraFoes(list) {
    if (!denser()) return list;
    const out = list.slice();
    let i, f, y, k;
    for (i = 0; i < list.length; i++) {
      if (out.length >= list.length + 2) break;
      f = list[i];
      y = clamp(f[2] + (i % 2 === 0 ? 14 : -14), BELT_TOP + 8, BELT_BOT - 8);
      k = f[0] === 'feather' ? 'wolf' : f[0];
      out.push([k, f[1] + 34, y]);
    }
    return out;
  }

  function spawnPack(pack, idx) {
    if (pack.spawned) return;
    pack.spawned = true;
    const hpMul = denser() ? 1.16 : 1;
    const spdMul = denser() ? 1.12 : 1;
    const list = extraFoes(pack.foes);
    let i, f, e;
    for (i = 0; i < list.length; i++) {
      f = list[i];
      e = makeFoe(f[0], f[1], f[2], hpMul, spdMul);
      e.pack = idx;
      G.enemies.push(e);
    }
    G.arenaR = Math.min(G.levelW - 8, pack.gate + 40);
    G.arenaL = Math.max(0, pack.x - 80);
    toast('来了', false, false);
  }

  function spawnBoss() {
    if (G.boss) return;
    const st = stageAt(G.stage - 1);
    if (!st.bossKind) return;
    const hpMul = denser() ? 1.16 : 1;
    const spdMul = denser() ? 1.1 : 1;
    const x = G.levelW - 170;
    const e = makeFoe(st.bossKind, x, 270, hpMul, spdMul);
    e.pack = -2;
    G.enemies.push(e);
    G.boss = e;
    G.arenaL = Math.max(0, x - 280);
    G.arenaR = G.levelW - 8;
    toast(st.boss + ' 来了', true, false);
    audio.go();
    G.hudDirty = true;
  }

  function allPacksClear() {
    let i;
    for (i = 0; i < G.packs.length; i++) {
      if (!G.packs[i].cleared) return false;
    }
    return true;
  }

  function tickPacks() {
    const p = G.player;
    if (!p) return;
    let i, pack, locked = false;
    for (i = 0; i < G.packs.length; i++) {
      pack = G.packs[i];
      if (!pack.spawned && p.x > pack.x - 40) spawnPack(pack, i);
      if (pack.spawned && !pack.cleared) {
        if (packAlive(i) <= 0) {
          pack.cleared = true;
          G.goT = 1.1;
          audio.go();
          toast('GO →', false, true);
        } else {
          locked = true;
          G.arenaR = Math.min(G.levelW - 8, pack.gate + 40);
          G.arenaL = Math.max(0, pack.x - 90);
        }
      }
    }
    const st = stageAt(G.stage - 1);
    if (!locked && !G.boss) {
      G.arenaL = 0;
      G.arenaR = G.levelW - 8;
      if (st.bossKind && allPacksClear() && p.x > G.levelW - 380) spawnBoss();
    }
    if (G.boss && !G.boss.dead) {
      G.arenaL = Math.max(0, G.boss.x - 300);
      G.arenaR = Math.min(G.levelW - 8, G.boss.x + 220);
    }
  }

  function tickCamera(dt) {
    const p = G.player;
    if (!p) return;
    let target = p.x - 190;
    target = clamp(target, 0, Math.max(0, G.levelW - VW));
    if (G.boss && !G.boss.dead) {
      const mid = (G.arenaL + G.arenaR) * 0.5 - VW * 0.5;
      target = lerp(target, mid, 0.45);
    }
    G.camX = lerp(G.camX, target, 1 - Math.pow(0.001, dt));
    G.camX = clamp(G.camX, 0, Math.max(0, G.levelW - VW));
  }

  function loadStage(n, keep) {
    const st = stageAt(n - 1);
    G.stage = n;
    G.theme = st.theme;
    G.levelW = st.w;
    G.packs = st.packs.map(function (pk) {
      return { x: pk.x, gate: pk.gate, foes: pk.foes, spawned: false, cleared: false };
    });
    G.enemies = [];
    G.shots = [];
    G.drops = st.drops.map(function (d) { return makeDrop(d[0], d[1], d[2]); });
    G.boss = null;
    G.arenaL = 0;
    G.arenaR = 640;
    G.camX = 0;
    G.intro = 0.95;
    G.clearT = 0;
    G.goT = 0;
    const px = keep && G.player ? 70 : 80;
    const py = keep && G.player ? G.player.y : 272;
    const hp = keep && G.player ? G.player.hp : HP_MAX;
    G.player = makePlayer(px, py);
    G.player.hp = keep ? Math.min(HP_MAX, hp + 2) : HP_MAX;
    G.player.maxHp = HP_MAX;
    G.hp = G.player.hp;
    G.invuln = keep ? 0.6 : 0;
    G.deadT = 0;
    G.hudDirty = true;
    resetFx();
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      if (G.mode === 'play') {
        bumpScore(SCORE.stage * G.stage);
        bumpScore(SCORE.clear);
      }
      showOver(true);
      return;
    }
    bumpScore(SCORE.stage * G.stage);
    toast(stageAt(G.stage - 1).name + ' 清了', false, true);
    G.stage += 1;
    loadStage(G.stage, true);
    audio.go();
  }

  function tickClear(dt) {
    const p = G.player;
    if (!p || G.deadT > 0 || G.mode !== 'play') return;
    const st = stageAt(G.stage - 1);
    if (st.bossKind) {
      if (!G.boss || !G.boss.dead) return;
      if (G.clearT === 0) G.clearT = 1.4;
      G.clearT -= dt;
      if (G.clearT <= 0) nextStage();
      return;
    }
    if (allPacksClear() && p.x > G.levelW - 110) nextStage();
  }

  /* ---- title / run ---- */
  function showTitle() {
    G.mode = 'title';
    G.kind = G.kind || 'axe';
    G.stage = 1;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.lives = LIVES;
    G.magic = MAGIC_START;
    G.won = false;
    G.why = '';
    setModes(G.kind);
    loadStage(1, false);
    G.arenaR = 620;
    G.player.x = 140;
    G.player.y = 272;
    G.enemies = [
      makeFoe('wolf', 280, 260, 1, 1),
      makeFoe('blade', 380, 294, 1, 1)
    ];
    panel.classList.remove('win', 'lose');
    ovKicker.textContent = 'GA3';
    ovTitle.textContent = '斧三';
    ovLead.innerHTML = '走跳挥剑，天雷从天上砸。打穿三关，骑殿尽头是骑煞。<br />没有坐骑可抢，跳斩才是这把的味道。';
    ovOps.textContent = OPS;
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    showOverlay();
    setHint('走跳挥剑 · 天雷砸场 · 跳斩骑煞 · 血空丢命');
    G.hudDirty = true;
    try { btnAxe.focus(); } catch (e) { /* ignore */ }
  }

  function startRun(kind) {
    G.kind = kind === 'core' ? 'core' : 'axe';
    setModes(G.kind);
    G.mode = 'play';
    G.stage = 1;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.lives = LIVES;
    G.magic = MAGIC_START;
    G.nextLife = LIFE_EVERY;
    G.won = false;
    G.why = '';
    G.deadT = 0;
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(G.kind === 'core' ? '斧核' : '斧三', false, G.kind === 'core');
    setHint(G.kind === 'core' ? '斧核更密 · 空格斩 · C 跳 · X 天雷' : '空格斩 · C 跳 · X 天雷');
    G.hudDirty = true;
    try { canvas.focus(); } catch (e) { /* ignore */ }
  }

  function showOver(win) {
    G.mode = 'over';
    G.won = win;
    persistBest();
    panel.classList.toggle('win', win);
    panel.classList.toggle('lose', !win);
    ovKicker.textContent = win ? 'CLEAR' : 'FALL';
    ovTitle.textContent = win ? (G.kind === 'core' ? '斧核清了' : '骑殿倒了') : '摔了';
    ovLead.innerHTML = win
      ? ('骑煞倒下。' + (G.kind === 'core' ? '核里也通了。' : '再开斧核更密。') + '<br />分 ' + G.score + ' · 最高连击 ×' + comboMul(G.maxCombo))
      : ((G.why || '摔了') + '。命没了。<br />分 ' + G.score + ' · 最高 ' + G.best);
    ovOps.textContent = win
      ? '空格 / 1 再来 · 2 斧核 · R 重开'
      : '空格 / 1 再来 · 2 换模式 · R 重开';
    ovStart.classList.add('gone');
    ovEnd.classList.remove('gone');
    if (ovMenu) ovMenu.textContent = win ? '斧核' : '换模式';
    showEndOverlay();
    setHint(win ? '通关 · R 再来' : '摔了丢命 · R 重开', win ? 'hot' : 'warn');
    if (win) {
      audio.win();
      winKick();
    } else {
      audio.over();
    }
    G.hudDirty = true;
  }

  function retry() {
    if (G.mode === 'title') startRun('axe');
    else startRun(G.kind || 'axe');
  }

  function tickDemoRespawn() {
    if (G.mode !== 'title') return;
    let n = 0, i;
    for (i = 0; i < G.enemies.length; i++) if (!G.enemies[i].dead) n += 1;
    if (n <= 0) {
      G.enemies.push(makeFoe('wolf', G.player.x + 180, 264, 1, 1));
      G.enemies.push(makeFoe('feather', G.player.x + 250, 292, 1, 1));
    }
    if (G.player && G.player.x > 520) G.player.x = 120;
    G.magic = MAGIC_START;
    if (G.player) G.player.hp = HP_MAX;
  }

  function tick(dt) {
    G.clock += dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.goT > 0) G.goT = Math.max(0, G.goT - dt);
    tickPlayer(dt);
    let i;
    for (i = 0; i < G.enemies.length; i++) tickFoe(G.enemies[i], dt);
    tickShots(dt);
    tickBolts(dt);
    tickDrops(dt);
    if (G.mode === 'play') {
      tickPacks();
      tickClear(dt);
    } else if (G.mode === 'title') {
      tickDemoRespawn();
      G.arenaL = 40;
      G.arenaR = 600;
    }
    tickCamera(dt);
  }

  /* ---- draw ---- */
  function wx(x) { return ox + (x - G.camX) * scale; }
  function wy(y) { return oy + y * scale; }

  function rr(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(ox, oy, ox, oy + 210 * scale);
    if (G.theme === 'cave') {
      g.addColorStop(0, '#08141c');
      g.addColorStop(1, '#143848');
    } else if (G.theme === 'palace') {
      g.addColorStop(0, '#140610');
      g.addColorStop(1, '#2a1020');
    } else {
      g.addColorStop(0, '#1c100c');
      g.addColorStop(1, '#3a2414');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
    ctx.fillStyle = rgba(G.theme === 'cave' ? CYN : GOLD, G.theme === 'palace' ? 0.16 : 0.3);
    ctx.beginPath();
    ctx.arc(ox + (520 - G.camX * 0.08) * scale, oy + 48 * scale, 22 * scale, 0, TAU);
    ctx.fill();
  }

  function drawBackdrop() {
    let i, h, x, w, u;
    for (i = 0; i < 18; i++) {
      u = hash2(i * 17 + (G.theme === 'cave' ? 5 : G.theme === 'palace' ? 9 : 2));
      x = ((i * 140) - G.camX * 0.35) % (VW + 160) - 40;
      w = 28 + u * 36;
      h = 70 + u * 90;
      if (G.theme === 'palace') {
        ctx.fillStyle = rgba([36, 16, 28], 0.95);
        ctx.fillRect(ox + x * scale, oy + (210 - h) * scale, w * scale, h * scale);
        ctx.fillStyle = rgba(u > 0.5 ? GOLD : MAG, 0.38);
        ctx.fillRect(ox + (x + 6) * scale, oy + (210 - h + 12) * scale, 5 * scale, 10 * scale);
        ctx.fillRect(ox + (x + 16) * scale, oy + (210 - h + 28) * scale, 5 * scale, 10 * scale);
      } else if (G.theme === 'cave') {
        ctx.fillStyle = rgba([16, 48, 58], 0.92);
        ctx.beginPath();
        ctx.moveTo(ox + x * scale, oy + 210 * scale);
        ctx.lineTo(ox + (x + w * 0.5) * scale, oy + (210 - h) * scale);
        ctx.lineTo(ox + (x + w) * scale, oy + 210 * scale);
        ctx.fill();
        ctx.fillStyle = rgba(CYN, 0.18);
        ctx.fillRect(ox + (x + w * 0.4) * scale, oy + (210 - h * 0.4) * scale, 4 * scale, h * 0.4 * scale);
      } else {
        ctx.fillStyle = rgba([48, 32, 22], 0.92);
        ctx.fillRect(ox + x * scale, oy + (210 - h) * scale, w * scale, h * scale);
        ctx.fillStyle = rgba([28, 18, 14], 0.7);
        ctx.fillRect(ox + (x + w * 0.3) * scale, oy + (210 - h - 18) * scale, 8 * scale, 18 * scale);
        ctx.fillStyle = rgba(HOT, 0.22);
        ctx.fillRect(ox + (x + 6) * scale, oy + (210 - h + 16) * scale, 4 * scale, 6 * scale);
      }
    }
  }

  function drawStreet() {
    const top = BELT_TOP - 18;
    const g = ctx.createLinearGradient(ox, oy + top * scale, ox, oy + VH * scale);
    if (G.theme === 'cave') {
      g.addColorStop(0, '#1a3844');
      g.addColorStop(0.4, '#102028');
      g.addColorStop(1, '#0a1014');
    } else if (G.theme === 'palace') {
      g.addColorStop(0, '#2a1830');
      g.addColorStop(1, '#120814');
    } else {
      g.addColorStop(0, '#3a2818');
      g.addColorStop(1, '#18100a');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy + top * scale, VW * scale, (VH - top) * scale);
    ctx.strokeStyle = rgba(HOT, 0.22);
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(ox, oy + BELT_TOP * scale);
    ctx.lineTo(ox + VW * scale, oy + BELT_TOP * scale);
    ctx.stroke();
    let i, x;
    ctx.strokeStyle = rgba(GOLD, 0.08);
    ctx.lineWidth = 1 * scale;
    for (i = 0; i < 12; i++) {
      x = ((i * 80 - (G.camX % 80)));
      ctx.beginPath();
      ctx.moveTo(ox + x * scale, oy + BELT_TOP * scale);
      ctx.lineTo(ox + (x - 30) * scale, oy + VH * scale);
      ctx.stroke();
    }
    if (G.theme === 'cave') {
      ctx.fillStyle = rgba(CYN, 0.12);
      for (i = 0; i < 8; i++) {
        x = ((i * 110 - G.camX * 0.6) % (VW + 80));
        ctx.beginPath();
        ctx.ellipse(ox + x * scale, oy + (BELT_BOT + 8) * scale, 18 * scale, 4 * scale, 0, 0, TAU);
        ctx.fill();
      }
    }
  }

  function drawNightBeast(face, s, step) {
    const bob = Math.sin(step * 8) * 1.2 * s;
    ctx.save();
    ctx.scale(face, 1);
    ctx.translate(0, bob);
    ctx.fillStyle = rgba(NIGHT, 0.96);
    ctx.beginPath();
    ctx.ellipse(2 * s, 4 * s, 16 * s, 7 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(PUR, 0.9);
    ctx.beginPath();
    ctx.moveTo(-8 * s, -2 * s);
    ctx.lineTo(-4 * s, -12 * s);
    ctx.lineTo(0, -2 * s);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4 * s, -2 * s);
    ctx.lineTo(8 * s, -11 * s);
    ctx.lineTo(10 * s, -1 * s);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.ellipse(14 * s, 1 * s, 7 * s, 5 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 1);
    ctx.beginPath();
    ctx.arc(17 * s, 0, 1.5 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba([32, 12, 22], 1);
    ctx.fillRect(-6 * s, 8 * s, 3 * s, 6 * s);
    ctx.fillRect(6 * s, 8 * s, 3 * s, 6 * s);
    ctx.restore();
  }

  function drawSword(s, pose, t) {
    let ang = -0.55;
    if (pose === 'slash') ang = -1.15 + (1 - t) * 1.9;
    else if (pose === 'lift') ang = 0.4 - (1 - t) * 1.7;
    else if (pose === 'spin') ang = (1 - t) * TAU;
    else if (pose === 'air') ang = 1.1 - (1 - t) * 2.2;
    else if (pose === 'magic') ang = -1.5;
    ctx.save();
    ctx.translate(6 * s, -12 * s);
    ctx.rotate(ang);
    ctx.fillStyle = rgba(BRN, 1);
    ctx.fillRect(-1.1 * s, 0, 2.2 * s, 7 * s);
    ctx.fillStyle = rgba(STEEL, 1);
    ctx.beginPath();
    ctx.moveTo(-1.6 * s, 7 * s);
    ctx.lineTo(0, 24 * s);
    ctx.lineTo(1.6 * s, 7 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.85);
    ctx.fillRect(-0.4 * s, 8 * s, 0.8 * s, 14 * s);
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.fillRect(-3.2 * s, 5.4 * s, 6.4 * s, 1.8 * s);
    ctx.restore();
  }

  function drawFighter(e, look, opt) {
    const sq = e.squash || 1;
    const s = scale * (look.size || 1);
    const x = wx(e.x);
    const y = wy(e.y - (e.h || 0));
    const face = e.face || 1;
    const blink = opt && opt.blink && ((G.clock * 16) | 0) % 2 === 0;
    if (blink) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 2 * s + (e.h || 0) * scale, (e.mount || look.beast ? 16 : 11) * s, 4 * s, 0, 0, TAU);
    ctx.fill();
    if (look.beast) {
      drawNightBeast(face, s, e.step || 0);
      ctx.restore();
      return;
    }
    if (e.mount) {
      drawNightBeast(face, s, e.step || 0);
      ctx.translate(0, -11 * s);
    }
    const bob = (e.act === 'walk' ? Math.sin((e.step || 0) * 10) * 1.5 : 0) * s;
    const down = e.act === 'down' || (opt && opt.down);
    ctx.translate(0, bob + (down ? 8 * s : 0));
    ctx.scale(1, sq);
    if (down) ctx.rotate(face * 0.9);
    ctx.scale(face, 1);
    if (e.flashT > 0) ctx.globalAlpha = 0.65;

    const bodyY = -16 * s;
    ctx.fillStyle = rgba(look.pants, 1);
    ctx.fillRect(-5 * s, -8 * s, 3.4 * s, 10 * s);
    ctx.fillRect(1.4 * s, -8 * s, 3.4 * s, 10 * s);
    ctx.fillStyle = rgba(look.jacket, 1);
    rr(-7 * s, bodyY - 2 * s, 14 * s, 14 * s, 3 * s);
    ctx.fill();
    ctx.fillStyle = rgba(look.skin, 1);
    ctx.beginPath();
    ctx.arc(0, bodyY - 9 * s, 6 * s, 0, TAU);
    ctx.fill();
    if (look.hairStyle === 'helm') {
      ctx.fillStyle = rgba(e.kind === 'player' ? TEAL : STEEL, 1);
      ctx.beginPath();
      ctx.arc(0, bodyY - 11 * s, 6.4 * s, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(-4 * s, bodyY - 12 * s, 8 * s, 1.4 * s);
    } else if (look.hairStyle === 'hood') {
      ctx.fillStyle = rgba(PUR, 1);
      ctx.beginPath();
      ctx.arc(0, bodyY - 10 * s, 7 * s, Math.PI, 0);
      ctx.fill();
    } else if (look.hairStyle === 'crown') {
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.fillRect(-5 * s, bodyY - 16 * s, 10 * s, 3 * s);
      ctx.fillRect(-4 * s, bodyY - 20 * s, 2 * s, 4 * s);
      ctx.fillRect(2 * s, bodyY - 20 * s, 2 * s, 4 * s);
    } else if (look.hairStyle === 'wolf') {
      ctx.fillStyle = rgba(look.hair, 1);
      ctx.beginPath();
      ctx.moveTo(-5.2 * s, bodyY - 12 * s);
      ctx.lineTo(-3.2 * s, bodyY - 18 * s);
      ctx.lineTo(-0.6 * s, bodyY - 13 * s);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0.4 * s, bodyY - 13 * s);
      ctx.lineTo(3.2 * s, bodyY - 18 * s);
      ctx.lineTo(5 * s, bodyY - 12 * s);
      ctx.fill();
      ctx.fillStyle = rgba(look.skin, 1);
      ctx.beginPath();
      ctx.ellipse(5.2 * s, bodyY - 8 * s, 4.2 * s, 2.3 * s, 0.12, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#1a1010';
      ctx.beginPath();
      ctx.arc(2.2 * s, bodyY - 10 * s, 1.15 * s, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(look.hair, 1);
      ctx.beginPath();
      ctx.arc(-1 * s, bodyY - 13 * s, 5.4 * s, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = rgba(look.accent, 0.9);
    ctx.fillRect(-4 * s, bodyY + 2 * s, 8 * s, 2 * s);

    let pose = 'idle';
    if (e.act === 'slash') pose = e.comboStep === 2 ? 'spin' : e.comboStep === 1 ? 'lift' : 'slash';
    else if (e.act === 'air') pose = 'air';
    else if (e.act === 'magic' || e.act === 'cast') pose = 'magic';
    if (look.sword || e.kind === 'player') drawSword(s, pose, e.t || 0);
    if (look.claw) {
      ctx.fillStyle = rgba(HOT, 0.95);
      ctx.beginPath();
      ctx.moveTo(7 * s, -8 * s);
      ctx.lineTo(14 * s, -4 * s);
      ctx.lineTo(7 * s, -2 * s);
      ctx.fill();
    }
    if (look.staff) {
      ctx.strokeStyle = rgba(MAG, 0.95);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(8 * s, -4 * s);
      ctx.lineTo(12 * s, -22 * s);
      ctx.stroke();
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.beginPath();
      ctx.arc(12 * s, -22 * s, 3 * s, 0, TAU);
      ctx.fill();
    }
    if (e.boss) {
      ctx.strokeStyle = rgba(GOLD, 0.55);
      ctx.lineWidth = 1.3 * s;
      ctx.beginPath();
      ctx.arc(0, bodyY - 9 * s, 9 * s, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDrop(d) {
    const x = wx(d.x);
    const y = wy(d.y - 8 + Math.sin(d.bob) * 3);
    ctx.save();
    if (d.kind === 'meat') {
      ctx.fillStyle = rgba(HOT, 0.95);
      ctx.beginPath();
      ctx.ellipse(x, y, 7 * scale, 4.5 * scale, 0.3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(BRN, 1);
      ctx.fillRect(x - 1 * scale, y - 8 * scale, 2 * scale, 7 * scale);
    } else if (d.kind === 'pot') {
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.beginPath();
      ctx.moveTo(x, y - 8 * scale);
      ctx.lineTo(x + 5 * scale, y + 4 * scale);
      ctx.lineTo(x - 5 * scale, y + 4 * scale);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(x, y, 5 * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShot(s) {
    const x = wx(s.x);
    const y = wy(s.y - 12);
    ctx.save();
    if (s.kind === 'shock') {
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 2.4 * scale;
      ctx.beginPath();
      ctx.arc(x, wy(s.y), 10 * scale, 0, TAU);
      ctx.stroke();
    } else {
      ctx.strokeStyle = rgba(MAG, 0.9);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(x - s.face * 10 * scale, y - 5 * scale);
      ctx.lineTo(x, y);
      ctx.lineTo(x - s.face * 8 * scale, y + 6 * scale);
      ctx.stroke();
      ctx.fillStyle = rgba(PUR, 0.85);
      ctx.beginPath();
      ctx.arc(x, y, 3.4 * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBolt(b) {
    if (b.delay > 0) return;
    const x = wx(b.x);
    const y0 = oy + 8 * scale;
    const y1 = wy(b.y - 4);
    const a = b.struck ? clamp(b.t / 0.32, 0, 1) : 0.85;
    ctx.save();
    ctx.strokeStyle = rgba(CYN, 0.95 * a);
    ctx.lineWidth = (b.struck ? 3.2 : 1.8) * scale;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    const segs = 6;
    let i, t, px, py;
    for (i = 1; i <= segs; i++) {
      t = i / segs;
      px = x + Math.sin(t * 18 + b.x) * 8 * scale * (1 - t * 0.3);
      py = y0 + (y1 - y0) * t;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.strokeStyle = rgba(WHT, 0.8 * a);
    ctx.lineWidth = 1.1 * scale;
    ctx.stroke();
    if (b.struck) {
      ctx.fillStyle = rgba(GOLD, 0.7 * a);
      ctx.beginPath();
      ctx.arc(x, y1, 7 * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawGhosts() {
    let i, g, a;
    for (i = 0; i < ghosts.length; i++) {
      g = ghosts[i];
      a = ctx.globalAlpha;
      ctx.globalAlpha = clamp(g.t / 0.22, 0, 1) * g.a;
      drawFighter(g, lookOf(g.kind || 'player'), {});
      ctx.globalAlpha = a;
    }
  }

  function drawHpChip(e, look) {
    if (e.hp >= e.maxHp && !e.boss) return;
    const w = (e.boss ? 44 : 22) * scale;
    const x = wx(e.x) - w / 2;
    const y = wy(e.y - (e.h || 0) - (e.boss ? 56 : 42) * (look.size || 1) - (e.mount ? 12 : 0));
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, 4 * scale);
    ctx.fillStyle = rgba(e.hp / e.maxHp < 0.32 ? MAG : (e.boss ? GOLD : HOT), 0.9);
    ctx.fillRect(x, y, w * clamp(e.hp / e.maxHp, 0, 1), 4 * scale);
  }

  function drawFxWorld() {
    let i, p;
    for (i = 0; i < bolts.length; i++) drawBolt(bolts[i]);
    for (i = 0; i < rings.length; i++) {
      p = rings[i];
      ctx.strokeStyle = rgba(p.rgb, clamp(p.t / 0.45, 0, 1));
      ctx.lineWidth = 2.4 * scale;
      ctx.beginPath();
      ctx.arc(wx(p.x), wy(p.y), (p.r + (0.45 - p.t) * 90) * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.t / p.max, 0, 1));
      ctx.beginPath();
      ctx.arc(wx(p.x), wy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < sparks.length; i++) {
      p = sparks[i];
      ctx.strokeStyle = rgba(p.rgb, clamp(p.t / 0.28, 0, 1));
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(wx(p.x), wy(p.y));
      ctx.lineTo(wx(p.x - p.vx * 0.04), wy(p.y - p.vy * 0.04));
      ctx.stroke();
    }
    ctx.font = '800 ' + (14 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    for (i = 0; i < floats.length; i++) {
      p = floats[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.t / p.life, 0, 1));
      ctx.fillText(p.text, wx(p.x), wy(p.y));
    }
  }

  function drawBossBar() {
    if (!G.boss || G.boss.dead) return;
    const e = G.boss;
    const w = 220 * scale;
    const x = ox + (VW * scale - w) / 2;
    const y = oy + 14 * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    rr(x - 4 * scale, y - 4 * scale, w + 8 * scale, 18 * scale, 6 * scale);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x, y + 8 * scale, w, 5 * scale);
    ctx.fillStyle = rgba(e.hp / e.maxHp < 0.3 ? MAG : HOT, 0.95);
    ctx.fillRect(x, y + 8 * scale, w * clamp(e.hp / e.maxHp, 0, 1), 5 * scale);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.font = '700 ' + (10 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(e.mount ? '骑煞 · 马上' : '骑煞 · 落马', x + w / 2, y + 7 * scale);
  }

  function drawIntro() {
    if (G.intro <= 0 || G.mode !== 'play') return;
    const t = clamp(G.intro / 0.9, 0, 1);
    const a = t > 0.3 ? 1 : t / 0.3;
    const name = stageAt(G.stage - 1).name;
    ctx.fillStyle = 'rgba(18,8,4,' + (0.55 * a) + ')';
    rr(ox + 190 * scale, oy + 118 * scale, 260 * scale, 52 * scale, 12 * scale);
    ctx.fill();
    ctx.strokeStyle = rgba(GOLD, 0.45 * a);
    ctx.lineWidth = 1.4 * scale;
    rr(ox + 190 * scale, oy + 118 * scale, 260 * scale, 52 * scale, 12 * scale);
    ctx.stroke();
    ctx.fillStyle = rgba(GOLD, 0.95 * a);
    ctx.font = '900 ' + (22 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, ox + 320 * scale, oy + 142 * scale);
    ctx.font = '700 ' + (11 * scale) + 'px sans-serif';
    ctx.fillStyle = rgba(CYN, 0.9 * a);
    ctx.fillText(G.kind === 'core' ? '斧核' : (G.boss ? '骑煞' : '清场'), ox + 320 * scale, oy + 158 * scale);
  }

  function drawGo() {
    if (G.goT <= 0 || G.mode !== 'play') return;
    const a = G.goT > 0.3 ? 1 : G.goT / 0.3;
    ctx.fillStyle = rgba(GOLD, 0.9 * a);
    ctx.font = '900 ' + (28 * scale) + 'px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('GO →', ox + (VW - 24) * scale, oy + 64 * scale);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0a0602';
    ctx.fillRect(0, 0, W, H);

    const shx = (G.shake ? (Math.random() - 0.5) * G.shake : 0) + G.kickX;
    const shy = (G.shake ? (Math.random() - 0.5) * G.shake * 0.55 : 0) + G.kickY;
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();
    ctx.translate(shx, shy);

    drawSky();
    drawBackdrop();
    drawStreet();

    const list = [];
    let i;
    for (i = 0; i < G.drops.length; i++) list.push({ z: G.drops[i].y - 80, kind: 'drop', o: G.drops[i] });
    for (i = 0; i < G.shots.length; i++) list.push({ z: G.shots[i].y, kind: 'shot', o: G.shots[i] });
    for (i = 0; i < G.enemies.length; i++) list.push({ z: G.enemies[i].y, kind: 'foe', o: G.enemies[i] });
    if (G.player) list.push({ z: G.player.y, kind: 'ply', o: G.player });
    list.sort(function (a, b) { return a.z - b.z; });

    drawGhosts();
    for (i = 0; i < list.length; i++) {
      if (list[i].kind === 'drop') drawDrop(list[i].o);
      else if (list[i].kind === 'shot') drawShot(list[i].o);
      else if (list[i].kind === 'foe') {
        drawFighter(list[i].o, lookOf(list[i].o.kind), {});
        drawHpChip(list[i].o, lookOf(list[i].o.kind));
      } else {
        drawFighter(list[i].o, lookOf('player'), {
          blink: G.invuln > 0 && G.mode === 'play'
        });
        if (G.mode === 'play') drawHpChip(list[i].o, lookOf('player'));
      }
    }

    drawFxWorld();
    drawBossBar();
    drawIntro();
    drawGo();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
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

  /* ---- input ---- */
  function consumeEdges() {
    slashEdge.down = keys.slash && !slashEdge.was;
    magicEdge.down = keys.magic && !magicEdge.was;
    jumpEdge.down = keys.jump && !jumpEdge.was;
    if (slashEdge.down && G.player) G.player.slashBuf = 0.2;
    if (magicEdge.down && G.player) G.player.magicBuf = 0.22;
    if (jumpEdge.down && G.player) G.player.jumpBuf = 0.2;
    slashEdge.was = keys.slash;
    magicEdge.was = keys.magic;
    jumpEdge.was = keys.jump;
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const magKey = code === 'KeyX' || k === 'x' || k === 'X';
    const jumpKey = code === 'KeyC' || k === 'c' || k === 'C'
      || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'Shift';
    const slashKey = space || k === 'z' || k === 'Z' || k === 'j' || k === 'J';
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (slashKey) keys.slash = down;
    if (magKey) keys.magic = down;
    if (jumpKey) keys.jump = down;

    if (down && (isMove || space || k === 'Enter' || magKey || jumpKey || slashKey)) e.preventDefault();
    if (!down) return;

    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restartOrRetry();
      return;
    }
    if (overlayOpen()) {
      if (G.mode === 'title') {
        if (k === '1' || space || k === 'Enter') {
          keys.slash = false;
          startRun('axe');
          return;
        }
        if (k === '2') { startRun('core'); return; }
      }
      if (G.mode === 'over') {
        if (k === '1' || space || k === 'Enter') {
          keys.slash = false;
          startRun(G.kind);
          return;
        }
        if (k === '2') {
          if (G.won) startRun('core');
          else showTitle();
          return;
        }
      }
      return;
    }
    if (G.player) {
      if (slashKey) G.player.slashBuf = 0.2;
      if (magKey) G.player.magicBuf = 0.22;
      if (jumpKey) G.player.jumpBuf = 0.2;
    }
  }

  function restartOrRetry() {
    audio.ensure();
    retry();
  }

  function bindHold(el, setter) {
    if (!el) return;
    function down(ev) {
      ev.preventDefault();
      setter(true);
      el.classList.add('held');
      audio.ensure();
      try { el.setPointerCapture(ev.pointerId); } catch (err) { /* ignore */ }
    }
    function up(ev) {
      ev.preventDefault();
      setter(false);
      el.classList.remove('held');
    }
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', function () {
      setter(false);
      el.classList.remove('held');
    });
  }

  bindHold(document.getElementById('btn-left'), function (v) { keys.l = v; });
  bindHold(document.getElementById('btn-right'), function (v) { keys.r = v; });
  bindHold(document.getElementById('btn-up'), function (v) { keys.u = v; });
  bindHold(document.getElementById('btn-down'), function (v) { keys.d = v; });
  bindHold(document.getElementById('btn-slash'), function (v) {
    keys.slash = v;
    if (v && G.player) G.player.slashBuf = 0.2;
  });
  bindHold(document.getElementById('btn-magic'), function (v) {
    keys.magic = v;
    if (v && G.player) G.player.magicBuf = 0.22;
  });
  bindHold(document.getElementById('btn-jump'), function (v) {
    keys.jump = v;
    if (v && G.player) G.player.jumpBuf = 0.2;
  });

  canvas.addEventListener('pointerdown', function (ev) {
    audio.ensure();
    ev.preventDefault();
    if (overlayOpen()) return;
    keys.slash = true;
    if (G.player) G.player.slashBuf = 0.2;
  });
  canvas.addEventListener('pointerup', function () { keys.slash = false; });
  canvas.addEventListener('pointercancel', function () { keys.slash = false; });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) {
    audio.ensure();
    onKey(e, true);
  });
  window.addEventListener('keyup', function (e) { onKey(e, false); });

  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    retry();
  });
  btnAxe.addEventListener('click', function () {
    audio.ensure();
    startRun('axe');
  });
  btnCore.addEventListener('click', function () {
    audio.ensure();
    startRun('core');
  });
  modeAxe.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') { setModes('axe'); G.kind = 'axe'; return; }
    startRun('axe');
  });
  modeCore.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') { setModes('core'); G.kind = 'core'; return; }
    startRun('core');
  });
  ovAgain.addEventListener('click', function () {
    audio.ensure();
    startRun(G.kind);
  });
  ovMenu.addEventListener('click', function () {
    audio.ensure();
    audio.ui();
    if (G.won) startRun('core');
    else showTitle();
  });

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) last = 0;
  });
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(stageEl);
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
    consumeEdges();
    if (G.stop > 0) {
      G.stop -= dt;
      tickFx(dt);
    } else {
      acc += dt;
      let n = 0;
      while (acc >= STEP && n < 5) {
        tick(STEP);
        acc -= STEP;
        n += 1;
      }
      if (acc > STEP * 4) acc = 0;
      tickFx(dt);
    }
    if (G.hudDirty) syncHud();
    if (G.intro > 0 && G.mode === 'play') G.intro = Math.max(0, G.intro - dt);
    draw();
  }

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) { /* ignore */ }
  loadBest();
  resize();
  showTitle();
  requestAnimationFrame(frame);
})();
