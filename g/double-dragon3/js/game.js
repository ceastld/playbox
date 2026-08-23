'use strict';

/* 双截3 — Double Dragon 3: The Rosetta Stone remake.
   World tour, jump + punch + kick, smash crates for nunchaku/sai/blade.
   Hits drain HP. Distinct from 双截 (rescue+whip), 双截2 (flykick+grab, crash=death), 终斗 (hold-knee-slam). */

(function () {
  const VW = 640;
  const VH = 360;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const HP_MAX = 100;
  const FOOD_HEAL = 36;
  const COMBO_WIN = 1.4;
  const BELT_TOP = 224;
  const BELT_BOT = 324;
  const WALK_X = 190;
  const WALK_Y = 116;
  const AIR = 0.82;
  const JUMP_V = 490;
  const GRAV = 1320;
  const MAX_FALL = 640;
  const INVULN = 1.28;
  const DIE_T = 0.82;
  const HURT_T = 0.34;
  const BEST_KEY = 'playbox-double-dragon3-best';
  const MUTE_KEY = 'playbox-double-dragon3-mute';
  const OPS = '方向键 / WASD 走 · C / Shift 跳 · 空格 / Z 出拳 · X 踢 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 58, 24];
  const HOT2 = [255, 122, 66];
  const WHT = [246, 238, 232];
  const LEAF = [61, 255, 122];
  const SKIN = [232, 184, 148];
  const NAVY = [42, 58, 120];

  const COMBO_PUNCH = [
    { dmg: 8, range: 32, dur: 0.15, hit0: 0.04, hit1: 0.12, kb: 72, stop: 0.04 },
    { dmg: 11, range: 36, dur: 0.17, hit0: 0.04, hit1: 0.13, kb: 94, stop: 0.052 },
    { dmg: 16, range: 40, dur: 0.28, hit0: 0.05, hit1: 0.18, kb: 176, stop: 0.07, stun: true }
  ];
  const KICK = { dmg: 13, range: 40, dur: 0.28, hit0: 0.06, hit1: 0.2, kb: 168, stop: 0.062, stun: true };
  const JKICK = { dmg: 15, range: 44, kb: 210, stop: 0.07, stun: true };
  const AIRP = { dmg: 10, range: 34, dur: 0.2, hit0: 0.04, hit1: 0.14, kb: 96, stop: 0.05 };

  const WEPS = {
    nun: {
      name: '双截棍', hits: 10,
      combo: [
        { dmg: 9, range: 40, dur: 0.12, hit0: 0.03, hit1: 0.1, kb: 82, stop: 0.046 },
        { dmg: 11, range: 44, dur: 0.13, hit0: 0.03, hit1: 0.11, kb: 96, stop: 0.052 },
        { dmg: 16, range: 50, dur: 0.26, hit0: 0.05, hit1: 0.18, kb: 188, stop: 0.072, stun: true }
      ]
    },
    sai: {
      name: '釵', hits: 8,
      combo: [
        { dmg: 10, range: 38, dur: 0.14, hit0: 0.04, hit1: 0.11, kb: 70, stop: 0.05 },
        { dmg: 12, range: 42, dur: 0.16, hit0: 0.04, hit1: 0.12, kb: 88, stop: 0.056, stun: true },
        { dmg: 17, range: 46, dur: 0.28, hit0: 0.05, hit1: 0.18, kb: 176, stop: 0.074, stun: true }
      ]
    },
    blade: {
      name: '刀', hits: 6,
      combo: [
        { dmg: 12, range: 48, dur: 0.16, hit0: 0.05, hit1: 0.13, kb: 96, stop: 0.056 },
        { dmg: 14, range: 54, dur: 0.18, hit0: 0.05, hit1: 0.14, kb: 118, stop: 0.062 },
        { dmg: 20, range: 60, dur: 0.32, hit0: 0.06, hit1: 0.2, kb: 220, stop: 0.08, stun: true }
      ]
    }
  };

  const FOES = {
    fist: {
      hp: 28, spd: 86, dmg: 11, range: 28, score: 170, w: 16, h: 30,
      think: 0.5, punchDur: 0.28, name: '铁拳'
    },
    bat: {
      hp: 40, spd: 62, dmg: 16, range: 40, score: 280, w: 18, h: 34,
      think: 0.64, punchDur: 0.4, name: '棒手', heavy: true
    },
    ninja: {
      hp: 24, spd: 98, dmg: 10, range: 92, score: 240, w: 15, h: 29,
      think: 0.62, punchDur: 0.32, name: '忍', thrower: true, jkick: true
    },
    spear: {
      hp: 34, spd: 80, dmg: 14, range: 46, score: 260, w: 16, h: 32,
      think: 0.48, punchDur: 0.3, name: '矛手', charge: true
    },
    bruiser: {
      hp: 170, spd: 88, dmg: 18, range: 36, score: 4200, w: 22, h: 40,
      think: 0.36, punchDur: 0.34, name: '黑拳', boss: true, charge: true
    },
    shadow: {
      hp: 230, spd: 108, dmg: 19, range: 40, score: 5400, w: 20, h: 38,
      think: 0.3, punchDur: 0.28, name: '刃影', boss: true, jkick: true, thrower: true
    },
    stone: {
      hp: 310, spd: 94, dmg: 20, range: 92, score: 9200, w: 24, h: 44,
      think: 0.34, punchDur: 0.32, name: '石王', boss: true, shooter: true
    }
  };

  const STAGES = [
    {
      name: '纽约', boss: '黑拳', w: 1980, theme: 'nyc', bossKind: 'bruiser',
      packs: [
        { x: 180, gate: 460, foes: [['fist', 240, 262], ['fist', 340, 286]] },
        { x: 500, gate: 820, foes: [['fist', 540, 258], ['bat', 640, 278], ['fist', 740, 266]] },
        { x: 860, gate: 1180, foes: [['spear', 900, 260], ['fist', 1000, 284], ['ninja', 1100, 254]] },
        { x: 1240, gate: 1580, foes: [['bat', 1280, 258], ['fist', 1380, 276], ['spear', 1480, 264], ['ninja', 1540, 282]] }
      ],
      crates: [[380, 268, 'nun'], [720, 250, 'food'], [1080, 274, 'nun'], [1420, 262, 'food']]
    },
    {
      name: '京都', boss: '刃影', w: 2180, theme: 'kyoto', bossKind: 'shadow',
      packs: [
        { x: 170, gate: 500, foes: [['ninja', 230, 262], ['fist', 340, 284]] },
        { x: 540, gate: 880, foes: [['bat', 580, 258], ['ninja', 680, 278], ['spear', 780, 256]] },
        { x: 920, gate: 1280, foes: [['fist', 960, 260], ['ninja', 1060, 282], ['bat', 1160, 254], ['spear', 1240, 274]] },
        { x: 1340, gate: 1760, foes: [['ninja', 1380, 258], ['bat', 1480, 280], ['fist', 1580, 264], ['ninja', 1680, 272]] }
      ],
      crates: [[400, 270, 'sai'], [780, 252, 'food'], [1140, 286, 'sai'], [1520, 264, 'food']]
    },
    {
      name: '开罗', boss: '石王', w: 2380, theme: 'cairo', bossKind: 'stone',
      packs: [
        { x: 160, gate: 500, foes: [['fist', 220, 262], ['spear', 320, 280], ['ninja', 400, 256]] },
        { x: 540, gate: 920, foes: [['bat', 580, 256], ['spear', 680, 278], ['fist', 780, 264], ['ninja', 860, 272]] },
        { x: 980, gate: 1400, foes: [['ninja', 1020, 258], ['bat', 1120, 274], ['spear', 1220, 286], ['fist', 1320, 254]] },
        { x: 1460, gate: 1920, foes: [['spear', 1500, 258], ['bat', 1600, 282], ['ninja', 1700, 264], ['fist', 1800, 276], ['spear', 1880, 256]] }
      ],
      crates: [[360, 268, 'blade'], [740, 250, 'food'], [1160, 290, 'blade'], [1540, 262, 'food'], [1780, 278, 'blade']]
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
  function jumpH() {
    return (JUMP_V * JUMP_V) / (2 * GRAV);
  }
  function jumpAir() {
    return WALK_X * AIR * (2 * JUMP_V / GRAV);
  }
  function wepOf(id) {
    return WEPS[id] || null;
  }
  function punchSet(p) {
    const w = p && p.wep ? wepOf(p.wep) : null;
    return w ? w.combo : COMBO_PUNCH;
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (HP_MAX !== 100) throw new Error('hp');
    if (COMBO_PUNCH.length !== 3) throw new Error('3 punch');
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(2) !== 1) throw new Error('combo 2');
    if (comboMul(3) !== 2) throw new Error('combo 3');
    if (comboMul(9) !== 5) throw new Error('combo cap');
    if (BELT_BOT - BELT_TOP < 80) throw new Error('belt');
    if (jumpH() < 70) throw new Error('jump height');
    if (jumpAir() < 100) throw new Error('jump air');
    if (!WEPS.nun || !WEPS.sai || !WEPS.blade) throw new Error('weapons');
    if (WEPS.nun.hits <= WEPS.sai.hits) throw new Error('nun more hits');
    if (WEPS.sai.hits <= WEPS.blade.hits) throw new Error('sai more than blade');
    if (WEPS.blade.combo[2].range <= COMBO_PUNCH[2].range) throw new Error('blade longer');
    if (KICK.range <= COMBO_PUNCH[0].range) throw new Error('kick range');
    if (JKICK.range <= KICK.range) throw new Error('jkick range');
    if (!FOES.fist || !FOES.bat || !FOES.ninja || !FOES.spear) throw new Error('foes');
    if (!FOES.bruiser || !FOES.shadow || !FOES.stone) throw new Error('bosses');
    if (FOES.bruiser.hp >= FOES.shadow.hp || FOES.shadow.hp >= FOES.stone.hp) throw new Error('boss hp');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (BEST_KEY !== 'playbox-double-dragon3-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-double-dragon3-mute') throw new Error('mute key');
    if (STAGES[0].name !== '纽约' || STAGES[1].name !== '京都' || STAGES[2].name !== '开罗') {
      throw new Error('world tour');
    }
    if (STAGES[0].theme !== 'nyc' || STAGES[1].theme !== 'kyoto' || STAGES[2].theme !== 'cairo') {
      throw new Error('themes');
    }
    if (STAGES[0].bossKind !== 'bruiser' || STAGES[2].bossKind !== 'stone') throw new Error('stone last');
    if (!FOES.ninja.thrower) throw new Error('ninja throw');
    if (!FOES.bruiser.charge) throw new Error('bruiser charge');
    if (!FOES.shadow.jkick) throw new Error('shadow jkick');
    if (!FOES.stone.shooter) throw new Error('stone shoot');
    if (FOOD_HEAL < 24) throw new Error('food heal');
    let i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.packs.length || !s.bossKind) throw new Error('stage ' + s.name);
      if (!s.crates || s.crates.length < 3) throw new Error('crates ' + s.name);
    }
    if (STAGES[0].crates[0][2] !== 'nun') throw new Error('nyc nun');
    if (STAGES[1].crates[0][2] !== 'sai') throw new Error('kyoto sai');
    if (STAGES[2].crates[0][2] !== 'blade') throw new Error('cairo blade');
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
  const btnStage = document.getElementById('btn-stage');
  const btnCore = document.getElementById('btn-core');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeStage = document.getElementById('mode-stage');
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
  const grabLabel = document.getElementById('grab-label');
  const hpBar = document.getElementById('hp-bar');
  const wepBar = document.getElementById('wep-bar');
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
  let uid = 1;

  const keys = { l: false, r: false, u: false, d: false, punch: false, kick: false, jump: false };
  const punchEdge = { down: false, was: false };
  const kickEdge = { down: false, was: false };
  const jumpEdge = { down: false, was: false };

  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const ghosts = [];

  const G = {
    mode: 'title',
    kind: 'stage',
    clock: 0,
    stage: 1,
    camX: 0,
    levelW: 1980,
    theme: 'nyc',
    packs: [],
    crates: [],
    drops: [],
    enemies: [],
    shots: [],
    player: null,
    boss: null,
    lives: LIVES,
    hp: HP_MAX,
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
  function airborne(p) {
    return p && (p.h || 0) > 6;
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
      this.noise(0.07, 0.07, 1100, 'highpass');
      this.beep(190, 0.05, 'sawtooth', 0.03, 70);
    },
    kickWhoosh: function () {
      this.ensure();
      this.noise(0.12, 0.1, 700, 'highpass');
      this.beep(140, 0.1, 'sawtooth', 0.05, 60);
      this.beep(520, 0.08, 'triangle', 0.035, 280);
    },
    wep: function (kind) {
      this.ensure();
      if (kind === 'blade') {
        this.noise(0.08, 0.08, 1600, 'highpass');
        this.beep(880, 0.07, 'square', 0.04, 420);
      } else if (kind === 'sai') {
        this.beep(720, 0.06, 'triangle', 0.045, 980);
        this.noise(0.05, 0.05, 1400, 'highpass');
      } else {
        this.noise(0.09, 0.08, 900, 'bandpass');
        this.beep(260, 0.07, 'sawtooth', 0.04, 140);
      }
    },
    hit: function (combo, heavy) {
      this.ensure();
      const p = 1 + Math.min(6, combo) * 0.06;
      this.noise(0.12, heavy ? 0.2 : 0.14, 220, 'lowpass');
      this.beep(160 * p, 0.1, 'square', 0.08, 58);
      this.beep((heavy ? 880 : 640) * p, 0.07, 'triangle', 0.05, 380 * p);
      if (heavy) this.beep(1180 * p, 0.09, 'square', 0.04, 1540 * p);
    },
    hurt: function () {
      this.ensure();
      this.noise(0.1, 0.12, 280, 'lowpass');
      this.beep(180, 0.1, 'sawtooth', 0.05, 70);
    },
    smash: function () {
      this.ensure();
      this.noise(0.14, 0.16, 180, 'lowpass');
      this.beep(140, 0.1, 'square', 0.05, 60);
    },
    pickup: function () {
      this.ensure();
      this.beep(520, 0.06, 'square', 0.045, 780);
      this.beep(780, 0.1, 'triangle', 0.04, 1040);
    },
    breakWep: function () {
      this.ensure();
      this.noise(0.12, 0.12, 500, 'bandpass');
      this.beep(320, 0.1, 'sawtooth', 0.04, 90);
    },
    shuriken: function () {
      this.ensure();
      this.noise(0.05, 0.05, 1800, 'highpass');
      this.beep(980, 0.05, 'square', 0.03, 520);
    },
    ko: function () {
      this.ensure();
      this.noise(0.24, 0.18, 140, 'lowpass');
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
  function kickCam(kx, ky) {
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
  function winKick() {
    if (REDUCE || !stageEl) return;
    stageEl.classList.remove('win-flash');
    void stageEl.offsetWidth;
    stageEl.classList.add('win-flash');
    setTimeout(function () { stageEl.classList.remove('win-flash'); }, 720);
  }
  function thumpKick() {
    if (REDUCE || !stageEl) return;
    stageEl.classList.remove('thump');
    void stageEl.offsetWidth;
    stageEl.classList.add('thump');
    setTimeout(function () { stageEl.classList.remove('thump'); }, 160);
  }
  function pickupKick() {
    if (REDUCE || !stageEl) return;
    stageEl.classList.remove('pickup');
    void stageEl.offsetWidth;
    stageEl.classList.add('pickup');
    setTimeout(function () { stageEl.classList.remove('pickup'); }, 440);
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
      a: a || 0.35, kind: e.kind || 'player', act: e.act, wep: e.wep, comboStep: e.comboStep
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
    if (n <= 0) return;
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
  function resetFx() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    ghosts.length = 0;
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
    if (modeStage) modeStage.setAttribute('aria-pressed', kind === 'stage' ? 'true' : 'false');
    if (modeCore) modeCore.setAttribute('aria-pressed', kind === 'core' ? 'true' : 'false');
  }
  function poseLabel(p) {
    if (!p) return '徒手';
    if (p.act === 'jkick') return '跳踢';
    if (p.act === 'kick') return '踢';
    if (p.act === 'jump' || p.act === 'airpunch') return '跳';
    if (p.wep === 'nun') return '双截棍';
    if (p.wep === 'sai') return '釵';
    if (p.wep === 'blade') return '刀';
    return '徒手';
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
    if (wepBar) {
      const spec = p && p.wep ? wepOf(p.wep) : null;
      const ratio = spec ? clamp(p.wepHits / spec.hits, 0, 1) : 0;
      wepBar.style.transform = 'scaleX(' + ratio + ')';
      wepBar.classList.toggle('low', !!spec && p.wepHits <= 2);
    }
    if (grabLabel) {
      const lab = poseLabel(p);
      grabLabel.textContent = lab;
      grabLabel.classList.toggle('grab', lab === '双截棍' || lab === '釵' || lab === '刀');
      grabLabel.classList.toggle('kick', lab === '跳踢' || lab === '踢' || lab === '跳');
      grabLabel.classList.toggle('hot', lab === '徒手');
    }
    if (tagLabel) {
      tagLabel.textContent = G.kind === 'core' ? '截核' : '双截3';
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
    G.hudDirty = false;
  }

  /* ---- factories ---- */
  function makePlayer(x, y) {
    return {
      id: uid++,
      kind: 'player',
      x: x, y: y, h: 0,
      vx: 0, vy: 0, vh: 0,
      face: 1,
      hp: HP_MAX,
      maxHp: HP_MAX,
      act: 'idle',
      t: 0,
      step: 0,
      punch: 0,
      comboStep: 0,
      hit: false,
      punchBuf: 0,
      kickBuf: 0,
      jumpBuf: 0,
      stun: 0,
      chainT: 0,
      landT: 0,
      wep: null,
      wepHits: 0
    };
  }
  function makeFoe(kind, x, y, scaleHp, scaleSpd) {
    const spec = FOES[kind];
    const hpMul = scaleHp || 1;
    const spdMul = scaleSpd || 1;
    return {
      id: uid++,
      kind: kind,
      spec: spec,
      x: x, y: y, h: 0,
      vx: 0, vy: 0, vh: 0,
      face: -1,
      hp: Math.round(spec.hp * hpMul),
      maxHp: Math.round(spec.hp * hpMul),
      spd: spec.spd * spdMul,
      act: 'idle',
      t: rand(0.1, spec.think),
      step: 0,
      punch: 0,
      hit: false,
      stun: 0,
      dead: false,
      deadT: 0,
      charge: 0,
      flyT: 0,
      boss: !!spec.boss,
      flashT: 0,
      think: spec.think / spdMul,
      pack: -1,
      cool: 0
    };
  }
  function makeCrate(x, y, drop) {
    return { x: x, y: y, hp: 3, maxHp: 3, drop: drop, smashed: false, flashT: 0 };
  }
  function makeDrop(x, y, kind) {
    return { x: x, y: y, kind: kind, bob: rand(0, TAU), taken: false };
  }
  function makeShot(x, y, face, kind) {
    return {
      x: x, y: y, face: face,
      vx: face * (kind === 'bolt' ? 340 : 300),
      life: kind === 'bolt' ? 0.85 : 0.72,
      kind: kind || 'star',
      from: 'foe'
    };
  }

  function lookOf(kind) {
    if (kind === 'player') {
      return { jacket: HOT, pants: NAVY, hair: GOLD, skin: SKIN, accent: WHT, hairStyle: 'billy', size: 1 };
    }
    if (kind === 'fist') {
      return { jacket: [200, 70, 36], pants: [36, 32, 44], hair: MAG, skin: SKIN, accent: MAG, hairStyle: 'mohawk', size: 1 };
    }
    if (kind === 'bat') {
      return { jacket: [180, 90, 40], pants: [36, 28, 32], hair: [24, 18, 16], skin: [196, 140, 108], accent: GOLD, hairStyle: 'bald', size: 1.16 };
    }
    if (kind === 'ninja') {
      return { jacket: [28, 22, 36], pants: [16, 14, 22], hair: [10, 10, 14], skin: [210, 160, 128], accent: MAG, hairStyle: 'slick', size: 0.96 };
    }
    if (kind === 'spear') {
      return { jacket: [24, 120, 140], pants: [20, 28, 48], hair: [16, 18, 22], skin: [210, 160, 128], accent: CYN, hairStyle: 'slick', size: 1.02 };
    }
    if (kind === 'bruiser') {
      return { jacket: [22, 16, 20], pants: [28, 28, 36], hair: [24, 20, 18], skin: [196, 140, 108], accent: GOLD, hairStyle: 'bald', size: 1.24 };
    }
    if (kind === 'shadow') {
      return { jacket: [160, 24, 40], pants: [18, 14, 20], hair: [12, 10, 14], skin: [220, 170, 140], accent: MAG, hairStyle: 'pony', size: 1.12 };
    }
    return { jacket: [176, 140, 48], pants: [40, 28, 16], hair: [24, 18, 12], skin: [210, 168, 120], accent: GOLD, hairStyle: 'helm', size: 1.28 };
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

  /* ---- combat ---- */
  function hurtEnemy(e, dmg, kb, face, finisher) {
    if (e.dead) return;
    if (G.mode !== 'play') {
      e.hp -= dmg;
      e.stun = 0.22;
      e.act = e.hp <= 0 ? 'down' : 'hurt';
      e.t = e.hp <= 0 ? 0.45 : 0.22;
      e.vx = face * kb * 0.55;
      e.vh = 0;
      e.flashT = 0.1;
      if (e.hp <= 0) {
        e.dead = true;
        e.deadT = 0.5;
        e.act = 'down';
      }
      return;
    }
    e.hp -= dmg;
    e.stun = finisher ? 0.58 : 0.2;
    e.act = e.hp <= 0 ? 'down' : 'hurt';
    e.t = e.hp <= 0 ? 0.55 : 0.3;
    e.vx = face * kb;
    e.vy = 0;
    e.vh = finisher ? 70 : 0;
    if (e.h > 0 && !finisher) e.vh = -40;
    e.charge = 0;
    e.flashT = 0.12;
    e.face = -face;
    const mul = bumpCombo();
    const kill = Math.round(e.spec.score * mul);
    const chip = Math.max(12, Math.round((14 + dmg) * mul));
    if (e.hp <= 0) {
      e.dead = true;
      e.deadT = 0.64;
      e.act = 'down';
      bumpScore(kill);
      pop(e.x, e.y - 36 - e.h, '+' + kill, GOLD);
      burst(e.x, e.y - 18 - e.h, 22, e.kind === 'ninja' ? MAG : HOT, 210, 0.48);
      spark(e.x, e.y - 20 - e.h, GOLD, 10);
      ringAt(e.x, e.y - 12 - e.h, HOT);
      maybeDrop(e);
      if (e.boss) {
        burst(e.x, e.y - 24, 36, GOLD, 260, 0.62);
        flash(GOLD, 0.55);
        audio.ko();
      }
    } else {
      bumpScore(chip);
      pop(e.x, e.y - 32 - e.h, '+' + chip, WHT);
    }
    G.hudDirty = true;
  }

  function maybeDrop(e) {
    if (G.mode !== 'play') return;
    if (e.boss) {
      G.drops.push(makeDrop(e.x, e.y, 'food'));
      return;
    }
    const r = Math.random();
    if (r < 0.14) G.drops.push(makeDrop(e.x, e.y, 'food'));
    else if (r < 0.2) {
      const st = stageAt(G.stage - 1);
      const kind = st.theme === 'cairo' ? 'blade' : st.theme === 'kyoto' ? 'sai' : 'nun';
      G.drops.push(makeDrop(e.x, e.y, kind));
    }
  }

  function hurtCrate(c, face) {
    if (c.smashed) return false;
    c.hp -= 1;
    c.flashT = 0.1;
    burst(c.x, c.y - 10, 8, GOLD, 120, 0.28);
    spark(c.x, c.y - 10, HOT, 4);
    audio.smash();
    hitStop(0.04);
    if (c.hp <= 0) {
      c.smashed = true;
      G.drops.push(makeDrop(c.x, c.y, c.drop));
      burst(c.x, c.y - 8, 16, GOLD, 180, 0.4);
      ringAt(c.x, c.y - 6, GOLD);
      if (G.mode === 'play') {
        const n = Math.round(80 * comboMul(Math.max(1, G.combo)));
        bumpScore(n);
        pop(c.x, c.y - 28, '+' + n, GOLD);
      }
    }
    c.vx = face * 40;
    return true;
  }

  function hurtPlayer(dmg, face, why) {
    const p = G.player;
    if (!p || G.invuln > 0 || G.deadT > 0) return;
    if (G.mode !== 'play') return;
    if (p.act === 'jkick' && p.h > 12) return;
    p.hp -= dmg;
    G.hp = p.hp;
    breakCombo();
    p.act = 'hurt';
    p.t = HURT_T;
    p.stun = HURT_T;
    p.vx = face * 160;
    p.vh = airborne(p) ? -40 : 0;
    p.punch = 0;
    p.comboStep = 0;
    G.invuln = 0.5;
    audio.hurt();
    flash(MAG, 0.28);
    shake(7);
    kickCam(face * 5, 2);
    burst(p.x, p.y - 20 - (p.h || 0), 10, HOT, 140, 0.32);
    G.why = why || '被打倒了';
    G.hudDirty = true;
    if (p.hp <= 0) {
      p.hp = 0;
      G.hp = 0;
      loseLife(why || '血空了');
    }
  }

  function loseLife(why) {
    const p = G.player;
    G.why = why;
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
    if (p) {
      burst(p.x, p.y - 18 - (p.h || 0), 26, HOT, 230, 0.5);
      spark(p.x, p.y - 18 - (p.h || 0), GOLD, 10);
    }
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
    p.punch = 0;
    p.comboStep = 0;
    G.deadT = 0;
    G.invuln = INVULN;
    G.hudDirty = true;
    toast('再上', false, true);
  }

  function giveWep(p, kind) {
    const spec = wepOf(kind);
    if (!spec) return;
    p.wep = kind;
    p.wepHits = spec.hits;
    audio.pickup();
    pickupKick();
    toast(spec.name, false, true);
    G.hudDirty = true;
  }

  function spendWep(p) {
    if (!p.wep) return;
    p.wepHits -= 1;
    if (p.wepHits <= 0) {
      const name = wepOf(p.wep).name;
      p.wep = null;
      p.wepHits = 0;
      audio.breakWep();
      toast(name + ' 断了', true, false);
      spark(p.x + p.face * 18, p.y - 18, GOLD, 8);
    }
    G.hudDirty = true;
  }

  function meleeHits(p, atk) {
    const face = p.face;
    let i, e, d, n = 0, c;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead) continue;
      if (!depthHit(p, e)) continue;
      d = (e.x - p.x) * face;
      if (d < 4 || d > atk.range) continue;
      if (Math.abs((e.h || 0) - (p.h || 0)) > 36) continue;
      hurtEnemy(e, atk.dmg, atk.kb, face, !!atk.stun);
      n += 1;
    }
    for (i = 0; i < G.crates.length; i++) {
      c = G.crates[i];
      if (c.smashed) continue;
      if (Math.abs(c.y - p.y) > 24) continue;
      d = (c.x - p.x) * face;
      if (d < 2 || d > atk.range + 6) continue;
      if (p.h > 28) continue;
      if (hurtCrate(c, face)) n += 1;
    }
    return n;
  }

  function startPunch(p) {
    const set = punchSet(p);
    let step = 0;
    if (p.chainT > 0) step = Math.min(2, p.comboStep + 1);
    p.comboStep = step;
    p.act = airborne(p) ? 'airpunch' : 'punch';
    p.t = (airborne(p) ? AIRP : set[step]).dur;
    p.hit = false;
    p.punch = 0;
    p.vx *= 0.35;
    if (p.wep) audio.wep(p.wep);
    else audio.swing();
    G.hudDirty = true;
  }

  function startKick(p) {
    if (airborne(p)) {
      startJumpKick(p, true);
      return;
    }
    p.act = 'kick';
    p.t = KICK.dur;
    p.hit = false;
    p.vx *= 0.25;
    audio.kickWhoosh();
    G.hudDirty = true;
  }

  function startJump(p) {
    if (p.h > 4 || p.act === 'jkick' || p.landT > 0) return;
    if (p.act === 'punch' || p.act === 'kick' || p.act === 'hurt') return;
    p.act = 'jump';
    p.h = 2;
    p.vh = JUMP_V;
    p.vx = p.face * WALK_X * 0.28;
    audio.kickWhoosh();
    burst(p.x, p.y - 4, 5, CYN, 70, 0.18);
    G.hudDirty = true;
  }

  function startJumpKick(p, fromAir) {
    if (p.act === 'jkick') return;
    if (!fromAir && (p.h > 4 || p.landT > 0)) return;
    p.act = 'jkick';
    p.hit = false;
    if (!fromAir) {
      p.h = 2;
      p.vh = JUMP_V * 0.92;
    }
    p.vx = p.face * WALK_X * 0.55;
    audio.kickWhoosh();
    ghostAt(p, 0.45);
    burst(p.x, p.y - 4 - p.h, 6, CYN, 80, 0.22);
    G.hudDirty = true;
  }

  function applyHitFeel(p, atk, n, rgb) {
    if (n <= 0) return;
    hitStop(atk.stop);
    shake(atk.stun ? 8 : 5);
    kickCam(p.face * (atk.stun ? 6 : 4), 2);
    burst(p.x + p.face * 22, p.y - 16 - (p.h || 0), atk.stun ? 14 : 8, rgb, 150, 0.3);
    spark(p.x + p.face * 22, p.y - 16 - (p.h || 0), GOLD, atk.stun ? 8 : 4);
    audio.hit(G.combo, !!atk.stun);
    if (p.wep && (p.act === 'punch' || p.act === 'airpunch')) spendWep(p);
  }

  /* ---- player ---- */
  function tickAir(p, dt, allowSteer) {
    let mx = 0, my = 0;
    if (allowSteer && inputOk()) {
      if (keys.l) mx -= 1;
      if (keys.r) mx += 1;
      if (keys.u) my -= 1;
      if (keys.d) my += 1;
    }
    if (mx) p.face = mx > 0 ? 1 : -1;
    p.x += p.vx * dt;
    if (mx) {
      p.x += mx * WALK_X * AIR * dt;
      p.vx = mx * WALK_X * 0.45;
    }
    p.y += my * WALK_Y * 0.55 * dt;
    p.vh -= GRAV * dt;
    if (p.vh < -MAX_FALL) p.vh = -MAX_FALL;
    p.h += p.vh * dt;
    if (p.h <= 0) {
      p.h = 0;
      p.vh = 0;
      p.act = 'land';
      p.landT = 0.1;
      p.t = 0.1;
      thumpKick();
      G.hudDirty = true;
      clampBelt(p);
      return true;
    }
    clampBelt(p);
    return false;
  }

  function tickPlayer(dt) {
    const p = G.player;
    if (!p) return;
    p.punchBuf = Math.max(0, p.punchBuf - dt);
    p.kickBuf = Math.max(0, p.kickBuf - dt);
    p.jumpBuf = Math.max(0, p.jumpBuf - dt);
    p.chainT = Math.max(0, p.chainT - dt);
    p.stun = Math.max(0, p.stun - dt);
    p.landT = Math.max(0, p.landT - dt);
    p.step += dt;

    if (G.deadT > 0) {
      G.deadT -= dt;
      p.act = 'down';
      p.vx *= Math.max(0, 1 - dt * 6);
      p.x += p.vx * dt;
      p.h = Math.max(0, p.h + p.vh * dt);
      p.vh -= GRAV * dt;
      if (G.deadT <= 0) respawn();
      return;
    }

    if (G.invuln > 0) G.invuln = Math.max(0, G.invuln - dt);

    if (p.act === 'hurt') {
      p.t -= dt;
      p.x += p.vx * dt;
      p.vx *= Math.max(0, 1 - dt * 5);
      p.h = Math.max(0, p.h + p.vh * dt);
      p.vh -= GRAV * dt;
      if (p.h <= 0) { p.h = 0; p.vh = 0; }
      clampBelt(p);
      if (p.t <= 0) p.act = p.h > 4 ? 'jump' : 'idle';
      return;
    }

    if (p.act === 'land') {
      p.t -= dt;
      p.vx *= Math.max(0, 1 - dt * 8);
      p.x += p.vx * dt;
      clampBelt(p);
      if (p.t <= 0) p.act = 'idle';
      return;
    }

    if (p.act === 'jkick') {
      if ((G.clock * 22) % 1 < dt * 22) ghostAt(p, 0.28);
      if (!p.hit && p.h > 8) {
        const n = meleeHits(p, JKICK);
        if (n > 0) {
          p.hit = true;
          applyHitFeel(p, JKICK, n, CYN);
          boomKick();
        }
      }
      if (tickAir(p, dt, true)) return;
      return;
    }

    if (p.act === 'airpunch') {
      p.t -= dt;
      if (!p.hit && p.t < AIRP.dur - AIRP.hit0 && p.t > AIRP.dur - AIRP.hit1) {
        const n = meleeHits(p, AIRP);
        p.hit = true;
        applyHitFeel(p, AIRP, n, HOT);
      }
      if (tickAir(p, dt, true)) return;
      if (p.t <= 0) p.act = 'jump';
      if (inputOk() && p.kickBuf > 0) {
        p.kickBuf = 0;
        startJumpKick(p, true);
      }
      return;
    }

    if (p.act === 'jump') {
      if (tickAir(p, dt, true)) return;
      if (inputOk() && p.kickBuf > 0) {
        p.kickBuf = 0;
        startJumpKick(p, true);
        return;
      }
      if (inputOk() && p.punchBuf > 0) {
        p.punchBuf = 0;
        startPunch(p);
      }
      return;
    }

    if (p.act === 'punch') {
      p.t -= dt;
      const set = punchSet(p);
      const atk = set[p.comboStep] || set[0];
      if (!p.hit && p.t < atk.dur - atk.hit0 && p.t > atk.dur - atk.hit1) {
        const n = meleeHits(p, atk);
        p.hit = true;
        applyHitFeel(p, atk, n, p.wep ? LEAF : HOT);
      }
      if (p.t <= 0) {
        p.chainT = 0.26;
        p.act = 'idle';
        G.hudDirty = true;
        if (inputOk() && p.kickBuf > 0) {
          p.kickBuf = 0;
          startKick(p);
          return;
        }
        if (inputOk() && p.jumpBuf > 0) {
          p.jumpBuf = 0;
          startJump(p);
          return;
        }
      }
      clampBelt(p);
      return;
    }

    if (p.act === 'kick') {
      p.t -= dt;
      if (!p.hit && p.t < KICK.dur - KICK.hit0 && p.t > KICK.dur - KICK.hit1) {
        const n = meleeHits(p, KICK);
        p.hit = true;
        applyHitFeel(p, KICK, n, CYN);
      }
      if (p.t <= 0) p.act = 'idle';
      clampBelt(p);
      return;
    }

    let mx = 0, my = 0;
    if (inputOk()) {
      if (keys.l) mx -= 1;
      if (keys.r) mx += 1;
      if (keys.u) my -= 1;
      if (keys.d) my += 1;
    }
    if (mx) p.face = mx > 0 ? 1 : -1;
    const mag = hypot(mx, my) || 1;
    p.x += (mx / mag) * WALK_X * dt;
    p.y += (my / mag) * WALK_Y * dt;
    p.act = (mx || my) ? 'walk' : 'idle';
    if (p.act === 'walk') p.step += dt * 2.2;
    p.h = 0;
    p.vh = 0;
    clampBelt(p);

    if (inputOk() && p.jumpBuf > 0 && p.landT <= 0) {
      p.jumpBuf = 0;
      startJump(p);
      return;
    }
    if (inputOk() && p.kickBuf > 0 && p.landT <= 0) {
      p.kickBuf = 0;
      startKick(p);
      return;
    }
    if (inputOk() && p.punchBuf > 0) {
      p.punchBuf = 0;
      startPunch(p);
    }
  }

  /* ---- enemies ---- */
  function foePunchHit(e) {
    const p = G.player;
    if (!p || G.deadT > 0) return;
    if (!depthHit(e, p)) return;
    const d = (p.x - e.x) * e.face;
    if (d < 4 || d > e.spec.range) return;
    if (Math.abs((p.h || 0) - (e.h || 0)) > 28) return;
    hurtPlayer(e.spec.dmg, e.face, '被' + e.spec.name + '打中了');
  }
  function foeChargeHit(e) {
    const p = G.player;
    if (!p || G.deadT > 0) return;
    if (!depthHit(e, p)) return;
    if (Math.abs(p.x - e.x) > 18) return;
    if (p.h > 22) return;
    hurtPlayer(e.spec.dmg + 2, e.vx > 0 ? 1 : -1, '被' + e.spec.name + '撞了');
  }
  function foeKickHit(e) {
    const p = G.player;
    if (!p || G.deadT > 0) return;
    if (!depthHit(e, p)) return;
    if (Math.abs((p.h || 0) - (e.h || 0)) > 28) return;
    const d = (p.x - e.x) * e.face;
    if (d < 4 || d > 42) return;
    hurtPlayer(e.spec.dmg, e.face, '被' + e.spec.name + '踢了');
  }

  function tickFoe(e, dt) {
    if (e.dead) {
      e.deadT -= dt;
      e.act = 'down';
      e.vx *= Math.max(0, 1 - dt * 5);
      e.x += e.vx * dt;
      e.h = Math.max(0, e.h + e.vh * dt);
      e.vh -= GRAV * dt;
      return;
    }
    e.flashT = Math.max(0, e.flashT - dt);
    e.stun = Math.max(0, e.stun - dt);
    e.cool = Math.max(0, e.cool - dt);
    e.step += dt;

    if (e.act === 'hurt' || e.act === 'down') {
      e.t -= dt;
      e.x += e.vx * dt;
      e.vx *= Math.max(0, 1 - dt * 5);
      e.h = Math.max(0, e.h + e.vh * dt);
      e.vh -= GRAV * dt;
      if (e.h <= 0) { e.h = 0; e.vh = 0; }
      clampBelt(e);
      if (e.t <= 0) {
        e.act = 'idle';
        e.t = e.think;
      }
      return;
    }
    if (e.act === 'jkick') {
      e.t -= dt;
      e.x += e.vx * dt;
      e.vh -= GRAV * dt;
      e.h += e.vh * dt;
      if (!e.hit && e.h > 10) {
        e.hit = true;
        foeKickHit(e);
      }
      if (e.h <= 0) {
        e.h = 0;
        e.vh = 0;
        e.act = 'idle';
        e.t = e.think;
        e.vx = 0;
      }
      clampBelt(e);
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
      clampBelt(e);
      if (e.t <= 0 || e.x <= G.arenaL + 20 || e.x >= G.arenaR - 20) {
        e.act = 'idle';
        e.t = e.think;
        e.vx = 0;
      }
      return;
    }
    if (e.act === 'throw') {
      e.t -= dt;
      if (!e.hit && e.t < 0.18) {
        e.hit = true;
        const kind = e.spec.shooter ? 'bolt' : 'star';
        G.shots.push(makeShot(e.x + e.face * 16, e.y, e.face, kind));
        audio.shuriken();
      }
      if (e.t <= 0) {
        e.act = 'idle';
        e.t = e.think * 1.2;
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

    const canCharge = e.spec.charge && Math.abs(dy) < 14 && Math.abs(dx) > 50 && e.cool <= 0;
    const canThrow = (e.spec.thrower || e.spec.shooter) && Math.abs(dy) < 18 && Math.abs(dx) > 48 && Math.abs(dx) < e.spec.range && e.cool <= 0;
    const canJkick = e.spec.jkick && Math.abs(dy) < 16 && Math.abs(dx) > 36 && Math.abs(dx) < 90 && e.cool <= 0 && p.h < 40;
    const meleeR = e.spec.thrower ? 32 : e.spec.range;
    const inMelee = Math.abs(dx) < meleeR && Math.abs(dy) < 16 && p.h < 20;

    if (e.t <= 0) {
      if (e.kind === 'stone' && e.cool <= 0) {
        let guards = 0;
        let gi;
        for (gi = 0; gi < G.enemies.length; gi++) {
          if (!G.enemies[gi].dead && G.enemies[gi].pack === -3) guards += 1;
        }
        if (guards < (denser() ? 3 : 2)) {
          const gk = Math.random() < 0.5 ? 'ninja' : 'fist';
          const ge = makeFoe(gk, e.x - e.face * 70, clamp(e.y + rand(-18, 18), BELT_TOP, BELT_BOT), denser() ? 1.16 : 1, denser() ? 1.12 : 1);
          ge.pack = -3;
          G.enemies.push(ge);
          e.cool = 2.6;
          e.t = e.think;
          if (G.mode === 'play') toast('石卫', true, false);
          return;
        }
      }
      if (canJkick) {
        e.act = 'jkick';
        e.h = 2;
        e.vh = 420;
        e.vx = e.face * e.spd * 1.55;
        e.hit = false;
        e.t = 0.7;
        e.cool = 1.5;
        return;
      }
      if (canCharge) {
        e.act = 'charge';
        e.t = 0.55;
        e.vx = e.face * e.spd * 2.1;
        e.cool = 1.6;
        return;
      }
      if (canThrow) {
        e.act = 'throw';
        e.t = 0.36;
        e.hit = false;
        e.cool = 1.35;
        return;
      }
      if (inMelee) {
        e.act = 'punch';
        e.t = e.spec.punchDur;
        e.hit = false;
        return;
      }
      e.t = e.think;
    }

    let spd = e.spd;
    if (e.spec.heavy) spd *= 0.85;
    if (dist > 18) {
      e.x += (dx / dist) * spd * dt;
      e.y += (dy / dist) * spd * 0.72 * dt;
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
      if (s.life <= 0 || s.x < G.camX - 40 || s.x > G.camX + VW + 40) {
        G.shots.splice(i, 1);
        continue;
      }
      p = G.player;
      if (!p || G.deadT > 0 || G.invuln > 0) continue;
      if (p.act === 'jkick' && p.h > 10) continue;
      if (Math.abs(s.y - p.y) > 12) continue;
      if (Math.abs(s.x - p.x) > 12) continue;
      if (p.h > 24) continue;
      G.shots.splice(i, 1);
      burst(p.x, p.y - 16, 8, s.kind === 'bolt' ? GOLD : MAG, 130, 0.24);
      hurtPlayer(s.kind === 'bolt' ? 16 : 12, s.face, s.kind === 'bolt' ? '中石矢了' : '中手里剑了');
    }
  }

  function tickDrops(dt) {
    const p = G.player;
    let i, d;
    for (i = G.drops.length - 1; i >= 0; i--) {
      d = G.drops[i];
      d.bob += dt * 4;
      if (d.taken) {
        G.drops.splice(i, 1);
        continue;
      }
      if (!p || G.deadT > 0) continue;
      if (Math.abs(d.x - p.x) > 18 || Math.abs(d.y - p.y) > 18) continue;
      if (p.h > 16) continue;
      d.taken = true;
      if (d.kind === 'food') {
        const before = p.hp;
        p.hp = Math.min(p.maxHp, p.hp + FOOD_HEAL);
        G.hp = p.hp;
        audio.pickup();
        pickupKick();
        toast('烤鸡 +' + (p.hp - before), false, true);
        pop(d.x, d.y - 24, '+' + (p.hp - before), LEAF);
        burst(d.x, d.y - 8, 10, GOLD, 90, 0.3);
        G.hudDirty = true;
      } else {
        giveWep(p, d.kind);
        burst(d.x, d.y - 8, 12, LEAF, 110, 0.32);
      }
      G.drops.splice(i, 1);
    }
    let c;
    for (i = 0; i < G.crates.length; i++) {
      c = G.crates[i];
      c.flashT = Math.max(0, c.flashT - dt);
    }
  }

  /* ---- stage flow ---- */
  function extraFoes(list) {
    if (!denser()) return list;
    const out = list.slice();
    let i, f, y;
    for (i = 0; i < list.length; i++) {
      if (out.length >= list.length + 2) break;
      f = list[i];
      y = clamp(f[2] + (i % 2 === 0 ? 14 : -14), BELT_TOP + 8, BELT_BOT - 8);
      out.push([f[0] === 'ninja' ? 'fist' : f[0], f[1] + 36, y]);
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
    const hpMul = denser() ? 1.2 : 1;
    const spdMul = denser() ? 1.12 : 1;
    const x = G.levelW - 160;
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
    if (!locked && !G.boss) {
      G.arenaL = 0;
      G.arenaR = G.levelW - 8;
      if (p.x > G.levelW - 360) spawnBoss();
    }
    if (G.boss && !G.boss.dead) {
      G.arenaL = Math.max(0, G.boss.x - 300);
      G.arenaR = Math.min(G.levelW - 8, G.boss.x + 220);
    }
  }

  function tickCamera(dt) {
    const p = G.player;
    if (!p) return;
    let target = p.x - 180;
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
    const keepWep = keep && G.player ? { wep: G.player.wep, wepHits: G.player.wepHits, hp: G.player.hp } : null;
    G.stage = n;
    G.theme = st.theme;
    G.levelW = st.w;
    G.packs = st.packs.map(function (pk) {
      return { x: pk.x, gate: pk.gate, foes: pk.foes, spawned: false, cleared: false };
    });
    G.crates = (st.crates || []).map(function (c) {
      return makeCrate(c[0], c[1], c[2]);
    });
    G.drops = [];
    G.enemies = [];
    G.shots = [];
    G.boss = null;
    G.arenaL = 0;
    G.arenaR = 640;
    G.camX = 0;
    G.intro = 0.95;
    G.clearT = 0;
    G.goT = 0;
    const px = keep && G.player ? 70 : 80;
    const py = keep && G.player ? G.player.y : 272;
    G.player = makePlayer(px, py);
    if (keepWep) {
      G.player.wep = keepWep.wep;
      G.player.wepHits = keepWep.wepHits;
      G.player.hp = keepWep.hp;
      G.player.maxHp = HP_MAX;
      G.hp = keepWep.hp;
    } else {
      G.hp = HP_MAX;
    }
    G.invuln = keep ? 0.6 : 0;
    G.deadT = 0;
    G.hudDirty = true;
    resetFx();
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      if (G.mode === 'play') {
        bumpScore(2000 * G.stage);
        bumpScore(8000);
      }
      showOver(true);
      return;
    }
    bumpScore(2000 * G.stage);
    toast(stageAt(G.stage - 1).name + ' 清了', false, true);
    G.stage += 1;
    loadStage(G.stage, true);
    audio.go();
  }

  function tickClear(dt) {
    if (!G.boss || !G.boss.dead || G.clearT < 0) return;
    if (G.clearT === 0) G.clearT = 1.35;
    G.clearT -= dt;
    if (G.clearT <= 0) {
      G.clearT = -1;
      nextStage();
    }
  }

  /* ---- title / run ---- */
  function showTitle() {
    G.mode = 'title';
    G.kind = G.kind || 'stage';
    G.stage = 1;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.won = false;
    G.why = '';
    setModes(G.kind);
    loadStage(1, false);
    G.arenaR = G.levelW - 8;
    G.player.x = 140;
    G.player.y = 272;
    G.crates = [makeCrate(220, 270, 'nun')];
    const d1 = makeFoe('fist', 300, 260, 1, 1);
    const d2 = makeFoe('ninja', 380, 300, 1, 1);
    G.enemies = [d1, d2];
    panel.classList.remove('win', 'lose');
    ovKicker.textContent = 'DD3';
    ovTitle.textContent = '双截3';
    ovLead.innerHTML = '环球清场。跳、出拳、踢，砸箱捡棍釵刀。体力打空扣一命。<br />纽约→京都→开罗，最后是石王。';
    ovOps.textContent = OPS;
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    showOverlay();
    setHint('走跳拳踢 · 砸箱捡械 · 体力打空丢命');
    G.hudDirty = true;
    try { btnStage.focus(); } catch (e) { /* ignore */ }
  }

  function startRun(kind) {
    G.kind = kind === 'core' ? 'core' : 'stage';
    setModes(G.kind);
    G.mode = 'play';
    G.stage = 1;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.lives = LIVES;
    G.nextLife = LIFE_EVERY;
    G.hp = HP_MAX;
    G.won = false;
    G.why = '';
    G.deadT = 0;
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(G.kind === 'core' ? '截核' : '双截3', false, G.kind === 'core');
    setHint(G.kind === 'core' ? '截核更密 · 空格拳 · X 踢 · C 跳' : '空格出拳 · X 踢 · C 跳 · 砸箱捡械');
    G.hudDirty = true;
    try { canvas.focus(); } catch (e) { /* ignore */ }
  }

  function showOver(win) {
    G.mode = 'over';
    G.won = win;
    persistBest();
    panel.classList.toggle('win', win);
    panel.classList.toggle('lose', !win);
    ovKicker.textContent = win ? 'CLEAR' : 'DOWN';
    ovTitle.textContent = win
      ? (G.kind === 'core' ? '截核清场' : '开罗清了')
      : (G.why || '被打倒了');
    const extra = '第 ' + G.stage + ' 关 · ';
    ovLead.textContent = extra + G.score + ' 分 · 连击最高 ×' + G.maxCombo + (G.score >= G.best && G.score > 0 ? ' · 新纪录' : '');
    ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
    ovStart.classList.add('gone');
    ovEnd.classList.remove('gone');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = win ? '截核' : '换模式';
    showEndOverlay();
    if (win) {
      audio.win();
      winKick();
    } else {
      audio.over();
    }
    setHint('R 再来 · 换模式回标题', win ? 'hot' : 'warn');
    try { ovAgain.focus(); } catch (e) { /* ignore */ }
    G.hudDirty = true;
  }

  function retry() {
    audio.ui();
    if (hintEl) hintEl.classList.remove('warn', 'hot');
    if (G.mode === 'title') startRun('stage');
    else startRun(G.kind);
  }

  function tickDemo(dt) {
    const p = G.player;
    if (!p) return;
    p.step += dt;
    if (p.act === 'jkick' || p.act === 'punch' || p.act === 'kick' || p.act === 'jump' || p.act === 'airpunch' || p.act === 'land') {
      tickPlayer(dt);
    } else {
      p.face = 1;
      p.x += 36 * dt;
      if (p.x > 430) p.x = 90;
      p.y = 272 + Math.sin(G.clock * 1.4) * 6;
      p.act = 'walk';
      const beat = (G.clock * 0.85) | 0;
      const prev = ((G.clock - dt) * 0.85) | 0;
      if (beat !== prev) {
        const m = beat % 4;
        if (m === 0) startJump(p);
        else if (m === 1) startKick(p);
        else {
          p.punchBuf = 0.1;
          startPunch(p);
        }
      }
    }
    let i;
    for (i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.dead && e.deadT <= 0) {
        G.enemies[i] = makeFoe(e.kind, 380 + i * 70, 250 + i * 30, 1, 1);
        continue;
      }
      tickFoe(e, dt);
    }
    tickDrops(dt);
    G.camX = lerp(G.camX, clamp(p.x - 180, 0, G.levelW - VW), 0.08);
  }

  function tick(dt) {
    G.clock += dt;
    if (G.goT > 0) G.goT -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.mode === 'title') {
      tickDemo(dt);
      return;
    }
    if (G.mode !== 'play') return;
    tickPlayer(dt);
    let i;
    for (i = 0; i < G.enemies.length; i++) tickFoe(G.enemies[i], dt);
    for (i = G.enemies.length - 1; i >= 0; i--) {
      if (G.enemies[i].dead && G.enemies[i].deadT <= 0) G.enemies.splice(i, 1);
    }
    tickShots(dt);
    tickDrops(dt);
    tickPacks();
    tickCamera(dt);
    tickClear(dt);
  }

  /* ---- draw ---- */
  function wx(x) {
    return ox + (x - G.camX) * scale;
  }
  function wy(y) {
    return oy + y * scale;
  }
  function rr(x, y, w, h, r) {
    const m = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + m, y);
    ctx.arcTo(x + w, y, x + w, y + h, m);
    ctx.arcTo(x + w, y + h, x, y + h, m);
    ctx.arcTo(x, y + h, x, y, m);
    ctx.arcTo(x, y, x + w, y, m);
    ctx.closePath();
  }

  function drawSky() {
    let g;
    if (G.theme === 'kyoto') {
      g = ctx.createLinearGradient(0, oy, 0, oy + 210 * scale);
      g.addColorStop(0, '#14060c');
      g.addColorStop(1, '#241018');
    } else if (G.theme === 'cairo') {
      g = ctx.createLinearGradient(0, oy, 0, oy + 210 * scale);
      g.addColorStop(0, '#100810');
      g.addColorStop(1, '#24180c');
    } else {
      g = ctx.createLinearGradient(0, oy, 0, oy + 210 * scale);
      g.addColorStop(0, '#12060a');
      g.addColorStop(1, '#1c1010');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
    ctx.fillStyle = rgba(GOLD, G.theme === 'cairo' ? 0.28 : 0.18);
    ctx.beginPath();
    ctx.arc(wx(G.camX * 0.16 + 520), wy(G.theme === 'cairo' ? 48 : 42), (G.theme === 'cairo' ? 22 : 16) * scale, 0, TAU);
    ctx.fill();
  }

  function drawBack() {
    const start = Math.floor((G.camX * 0.32) / 70) - 1;
    let i, hsh, bx, bw, bh, win, c;
    if (G.theme === 'nyc') {
      for (i = start; i < start + 14; i++) {
        hsh = hash2(i * 13 + 3);
        bx = i * 78 - G.camX * 0.3;
        bw = 52 + hsh * 22;
        bh = 96 + hsh * 70;
        ctx.fillStyle = '#16080c';
        ctx.fillRect(wx(G.camX + bx), wy(210 - bh), bw * scale, bh * scale);
        ctx.fillStyle = rgba(HOT, 0.14);
        ctx.fillRect(wx(G.camX + bx + 8), wy(210 - bh), 4 * scale, bh * scale);
        for (win = 0; win < 8; win++) {
          if (hash2(i * 90 + win) < 0.62) {
            c = hash2(i + win * 3) < 0.4 ? GOLD : CYN;
            ctx.fillStyle = rgba(c, 0.32 + 0.22 * Math.sin(G.clock * 2 + win));
            ctx.fillRect(
              wx(G.camX + bx + 10 + (win % 3) * 14),
              wy(210 - bh + 12 + Math.floor(win / 3) * 18),
              8 * scale, 10 * scale
            );
          }
        }
      }
      ctx.fillStyle = rgba(GOLD, 0.12);
      ctx.fillRect(ox, wy(168), VW * scale, 3 * scale);
    } else if (G.theme === 'kyoto') {
      for (i = start; i < start + 12; i++) {
        hsh = hash2(i * 17 + 5);
        bx = i * 88 - G.camX * 0.28;
        ctx.fillStyle = '#1a0a10';
        ctx.fillRect(wx(G.camX + bx + 18), wy(118), 8 * scale, 92 * scale);
        ctx.fillStyle = '#6a1820';
        ctx.fillRect(wx(G.camX + bx), wy(108), 44 * scale, 12 * scale);
        ctx.fillStyle = rgba(HOT, 0.55);
        ctx.fillRect(wx(G.camX + bx + 4), wy(112), 36 * scale, 4 * scale);
        if (hsh > 0.4) {
          ctx.fillStyle = rgba(GOLD, 0.35 + 0.2 * Math.sin(G.clock * 3 + i));
          ctx.beginPath();
          ctx.arc(wx(G.camX + bx + 22), wy(132), 6 * scale, 0, TAU);
          ctx.fill();
        }
      }
      for (i = start; i < start + 16; i++) {
        hsh = hash2(i * 11 + 2);
        if (hsh < 0.45) continue;
        ctx.fillStyle = rgba(MAG, 0.18);
        ctx.beginPath();
        ctx.ellipse(wx(G.camX + i * 48 - G.camX * 0.4), wy(70 + hsh * 40), 7 * scale, 3 * scale, 0.4, 0, TAU);
        ctx.fill();
      }
    } else {
      for (i = start; i < start + 10; i++) {
        hsh = hash2(i * 9 + 4);
        bx = i * 110 - G.camX * 0.22;
        bw = 36 + hsh * 18;
        bh = 70 + hsh * 50;
        ctx.fillStyle = '#2a1c10';
        ctx.beginPath();
        ctx.moveTo(wx(G.camX + bx + bw * 0.5), wy(210 - bh));
        ctx.lineTo(wx(G.camX + bx + bw), wy(210));
        ctx.lineTo(wx(G.camX + bx), wy(210));
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(GOLD, 0.18);
        ctx.fillRect(wx(G.camX + bx + bw * 0.42), wy(210 - bh * 0.45), 5 * scale, bh * 0.35 * scale);
      }
      ctx.fillStyle = 'rgba(40, 28, 12, 0.35)';
      ctx.fillRect(ox, wy(160), VW * scale, 50 * scale);
      for (i = start; i < start + 14; i++) {
        bx = i * 70 - G.camX * 0.34;
        ctx.fillStyle = '#24180e';
        ctx.fillRect(wx(G.camX + bx + 10), wy(128), 8 * scale, 82 * scale);
        ctx.fillStyle = rgba(GOLD, 0.2);
        ctx.fillRect(wx(G.camX + bx + 8), wy(124), 12 * scale, 6 * scale);
      }
    }
  }

  function drawStreet() {
    const g = ctx.createLinearGradient(0, wy(BELT_TOP - 18), 0, wy(VH));
    g.addColorStop(0, G.theme === 'cairo' ? '#24180e' : G.theme === 'kyoto' ? '#1c1014' : '#1a1410');
    g.addColorStop(0.35, '#121016');
    g.addColorStop(1, '#0a0608');
    ctx.fillStyle = g;
    ctx.fillRect(ox, wy(BELT_TOP - 18), VW * scale, (VH - (BELT_TOP - 18)) * scale);

    ctx.fillStyle = G.theme === 'nyc' ? '#2a1a14' : G.theme === 'kyoto' ? '#2a1418' : '#2a2214';
    ctx.fillRect(ox, wy(BELT_TOP - 18), VW * scale, 8 * scale);
    ctx.fillStyle = rgba(HOT, 0.22);
    ctx.fillRect(ox, wy(BELT_TOP - 12), VW * scale, 2 * scale);

    ctx.fillStyle = '#0c0810';
    ctx.fillRect(ox, wy(BELT_BOT + 6), VW * scale, 8 * scale);
    ctx.fillStyle = rgba(HOT, 0.3);
    ctx.fillRect(ox, wy(BELT_BOT + 4), VW * scale, 2 * scale);

    const x0 = Math.floor(G.camX / 80) * 80;
    let x;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (x = x0; x < G.camX + VW + 40; x += 90) {
      ctx.beginPath();
      ctx.moveTo(wx(x), wy(BELT_TOP));
      ctx.lineTo(wx(x + 40), wy(BELT_BOT));
      ctx.stroke();
    }

    for (x = x0; x < G.camX + VW + 60; x += 160) {
      const lampX = x + 40;
      ctx.fillStyle = '#1a1014';
      ctx.fillRect(wx(lampX), wy(118), 4 * scale, (BELT_TOP - 118) * scale);
      const glow = G.theme === 'kyoto' ? MAG : G.theme === 'cairo' ? GOLD : HOT;
      ctx.fillStyle = rgba(glow, 0.12);
      ctx.beginPath();
      ctx.arc(wx(lampX + 2), wy(124), 22 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(G.theme === 'cairo' ? GOLD : glow, 0.55);
      ctx.beginPath();
      ctx.arc(wx(lampX + 2), wy(120), 5 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawCrate(c) {
    if (c.smashed) return;
    const x = wx(c.x);
    const y = wy(c.y);
    ctx.save();
    if (c.flashT > 0) ctx.globalAlpha = 0.55 + 0.45 * Math.sin(G.clock * 40);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + 2 * scale, 11 * scale, 4 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#6a3a18';
    rr(x - 10 * scale, y - 16 * scale, 20 * scale, 16 * scale, 2 * scale);
    ctx.fill();
    ctx.strokeStyle = rgba(GOLD, 0.45);
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
    ctx.fillStyle = rgba(GOLD, 0.35);
    ctx.fillRect(x - 8 * scale, y - 9 * scale, 16 * scale, 1.4 * scale);
    ctx.fillRect(x - 1 * scale, y - 14 * scale, 1.4 * scale, 12 * scale);
    const col = c.drop === 'food' ? LEAF : c.drop === 'blade' ? CYN : c.drop === 'sai' ? MAG : GOLD;
    ctx.fillStyle = rgba(col, 0.7);
    ctx.beginPath();
    ctx.arc(x, y - 8 * scale, 2.4 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawDrop(d) {
    const y = wy(d.y - 8 + Math.sin(d.bob) * 3);
    const x = wx(d.x);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, wy(d.y + 2), 8 * scale, 3 * scale, 0, 0, TAU);
    ctx.fill();
    if (d.kind === 'food') {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.ellipse(x, y, 7 * scale, 4 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.85);
      ctx.fillRect(x - 5 * scale, y - 2 * scale, 10 * scale, 3 * scale);
    } else if (d.kind === 'nun') {
      ctx.strokeStyle = rgba(GOLD, 0.95);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(x - 8 * scale, y - 4 * scale);
      ctx.lineTo(x + 8 * scale, y + 4 * scale);
      ctx.stroke();
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.fillRect(x - 10 * scale, y - 6 * scale, 5 * scale, 4 * scale);
      ctx.fillRect(x + 5 * scale, y + 2 * scale, 5 * scale, 4 * scale);
    } else if (d.kind === 'sai') {
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.fillRect(x - 1.2 * scale, y - 10 * scale, 2.4 * scale, 16 * scale);
      ctx.fillRect(x - 5 * scale, y - 4 * scale, 10 * scale, 2 * scale);
    } else {
      ctx.fillStyle = rgba(LEAF, 0.95);
      ctx.beginPath();
      ctx.moveTo(x + 10 * scale, y);
      ctx.lineTo(x - 8 * scale, y + 3 * scale);
      ctx.lineTo(x - 8 * scale, y - 3 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.fillRect(x - 12 * scale, y - 1.5 * scale, 6 * scale, 3 * scale);
    }
  }

  function drawShot(s) {
    const x = wx(s.x);
    const y = wy(s.y - 18);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s.face, 1);
    if (s.kind === 'bolt') {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.moveTo(12 * scale, 0);
      ctx.lineTo(-8 * scale, 3 * scale);
      ctx.lineTo(-8 * scale, -3 * scale);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.beginPath();
      ctx.moveTo(8 * scale, 0);
      ctx.lineTo(0, 4 * scale);
      ctx.lineTo(-6 * scale, 0);
      ctx.lineTo(0, -4 * scale);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWep(p, s, armY, punch, kickPose) {
    if (!p.wep) return;
    if (p.wep === 'nun') {
      ctx.strokeStyle = rgba(GOLD, 0.95);
      ctx.lineWidth = 1.8 * s;
      ctx.beginPath();
      if (punch) {
        ctx.moveTo(16 * s, armY);
        ctx.lineTo(28 * s, armY - 6 * s);
      } else {
        ctx.moveTo(8 * s, armY + 4 * s);
        ctx.lineTo(14 * s, armY + 12 * s);
      }
      ctx.stroke();
    } else if (p.wep === 'sai') {
      ctx.fillStyle = rgba(CYN, 0.95);
      if (punch) ctx.fillRect(16 * s, armY - 10 * s, 2.2 * s, 16 * s);
      else ctx.fillRect(8 * s, armY - 2 * s, 2.2 * s, 12 * s);
    } else {
      ctx.fillStyle = rgba(LEAF, 0.95);
      if (punch || kickPose) {
        ctx.fillRect(14 * s, armY - 3 * s, 18 * s, 2.6 * s);
      } else {
        ctx.fillRect(7 * s, armY - 8 * s, 2.4 * s, 16 * s);
      }
    }
  }

  function drawFighter(e, look, opts) {
    const s = scale * look.size;
    const x = wx(e.x);
    const y = wy(e.y - (e.h || 0));
    const face = e.face || 1;
    const blink = opts && opts.blink && ((G.clock * 16) | 0) % 2 === 0;
    if (blink) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(face, 1);

    ctx.fillStyle = 'rgba(0,0,0,' + (0.35 + ((e.h || 0) > 0 ? 0.08 : 0)) + ')';
    ctx.beginPath();
    ctx.ellipse(0, (e.h || 0) * scale, 11 * s, 4 * s, 0, 0, TAU);
    ctx.fill();

    const walk = (e.act === 'walk' || e.act === 'charge') ? Math.sin(e.step * 2.2) : 0;
    const punch = e.act === 'punch' || e.act === 'airpunch' || e.act === 'throw';
    const jkick = e.act === 'jkick';
    const kickPose = e.act === 'kick';
    const hurt = e.act === 'hurt';
    const down = e.act === 'down';
    const jumping = e.act === 'jump';
    let bodyY = -16 * s;
    if (down) {
      ctx.rotate(-1.15);
      bodyY = -8 * s;
    } else if (jkick) {
      ctx.rotate(-0.95);
      bodyY = -20 * s;
    } else if (kickPose) {
      ctx.rotate(-0.55);
      bodyY = -18 * s;
    } else if (jumping) {
      bodyY = -18 * s;
    } else if (hurt) {
      ctx.rotate(-0.18);
    }

    if (e.flashT > 0) ctx.globalAlpha = 0.55 + 0.45 * Math.sin(G.clock * 40);

    ctx.fillStyle = rgba(look.pants, 1);
    if (!down) {
      if (jkick || kickPose) {
        ctx.fillRect(-6 * s, -12 * s, 4.2 * s, 10 * s);
        ctx.fillRect(6 * s, -8 * s, 16 * s, 4.2 * s);
        ctx.fillStyle = rgba(CYN, 0.7);
        ctx.fillRect(20 * s, -9 * s, 6 * s, 5 * s);
      } else {
        ctx.fillRect(-6 * s + walk * 3 * s, -10 * s, 4.2 * s, 12 * s);
        ctx.fillRect(1.4 * s - walk * 3 * s, -10 * s, 4.2 * s, 12 * s);
      }
    } else {
      ctx.fillRect(-10 * s, -6 * s, 14 * s, 5 * s);
    }
    ctx.fillStyle = '#d8dce8';
    if (!down && !jkick && !kickPose) {
      ctx.fillRect(-6.2 * s + walk * 3 * s, 0, 4.4 * s, 3 * s);
      ctx.fillRect(1.2 * s - walk * 3 * s, 0, 4.4 * s, 3 * s);
    }

    ctx.fillStyle = rgba(look.jacket, 1);
    rr(-8 * s, bodyY - 2 * s, 16 * s, 14 * s, 3 * s);
    ctx.fill();
    ctx.fillStyle = rgba(look.accent, 0.7);
    ctx.fillRect(-2 * s, bodyY, 4 * s, 10 * s);

    const armY = bodyY + 2 * s;
    ctx.fillStyle = rgba(look.skin, 1);
    if (punch) {
      ctx.fillRect(6 * s, armY - 3 * s, 14 * s, 4.2 * s);
      ctx.fillRect(-10 * s, armY + 2 * s, 7 * s, 3.4 * s);
    } else if (jkick || kickPose) {
      ctx.fillRect(8 * s, armY - 6 * s, 4.2 * s, 10 * s);
      ctx.fillRect(-12 * s, armY + 2 * s, 7 * s, 3.4 * s);
    } else {
      ctx.fillRect(5 * s, armY + walk * 2 * s, 4 * s, 9 * s);
      ctx.fillRect(-9 * s, armY - walk * 2 * s, 4 * s, 9 * s);
    }

    if (e.kind === 'player') drawWep(e, s, armY, punch, kickPose || jkick);

    if (e.kind === 'bat' && e.act === 'punch') {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fillRect(16 * s, armY - 12 * s, 3.4 * s, 18 * s);
    }
    if (e.kind === 'spear') {
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.fillRect(punch ? 16 * s : 8 * s, armY - 14 * s, 2 * s, 22 * s);
    }

    ctx.fillStyle = rgba(look.skin, 1);
    ctx.beginPath();
    ctx.arc(0, bodyY - 8 * s, 6.2 * s, 0, TAU);
    ctx.fill();

    if (look.hairStyle === 'mohawk') {
      ctx.fillStyle = rgba(look.hair, 1);
      ctx.fillRect(-1.6 * s, bodyY - 18 * s, 3.2 * s, 10 * s);
    } else if (look.hairStyle === 'billy') {
      ctx.fillStyle = rgba(look.hair, 1);
      ctx.beginPath();
      ctx.ellipse(-1 * s, bodyY - 10 * s, 6.4 * s, 4.2 * s, -0.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(look.accent, 0.95);
      ctx.fillRect(-6.4 * s, bodyY - 8 * s, 12.8 * s, 1.8 * s);
    } else if (look.hairStyle === 'helm') {
      ctx.fillStyle = rgba(look.hair, 1);
      rr(-6.4 * s, bodyY - 14 * s, 12.8 * s, 8 * s, 3 * s);
      ctx.fill();
      ctx.fillStyle = rgba(look.accent, 0.9);
      ctx.fillRect(-6.4 * s, bodyY - 9 * s, 12.8 * s, 2 * s);
    } else if (look.hairStyle === 'pony') {
      ctx.fillStyle = rgba(look.hair, 1);
      ctx.beginPath();
      ctx.ellipse(0, bodyY - 10 * s, 6.2 * s, 3.6 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(-8 * s, bodyY - 8 * s, 4 * s, 10 * s);
    } else if (look.hairStyle === 'slick') {
      ctx.fillStyle = rgba(look.hair, 1);
      ctx.beginPath();
      ctx.ellipse(0, bodyY - 10 * s, 6.4 * s, 3.4 * s, 0, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(look.hair, 0.8);
      ctx.beginPath();
      ctx.arc(0, bodyY - 10 * s, 5.4 * s, Math.PI, 0);
      ctx.fill();
    }

    ctx.fillStyle = '#1a1014';
    ctx.fillRect(1.4 * s, bodyY - 9 * s, 2.2 * s, 2.2 * s);

    if (e.boss) {
      ctx.strokeStyle = rgba(GOLD, 0.5);
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.arc(0, bodyY - 8 * s, 8 * s, 0, TAU);
      ctx.stroke();
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
    if (!e.boss && e.hp >= e.maxHp) return;
    const w = (e.boss ? 42 : 22) * scale;
    const x = wx(e.x) - w / 2;
    const y = wy(e.y - (e.h || 0) - (e.boss ? 52 : 40) * (look.size || 1));
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, 4 * scale);
    ctx.fillStyle = rgba(e.hp / e.maxHp < 0.32 ? MAG : (e.boss ? GOLD : HOT), 0.9);
    ctx.fillRect(x, y, w * clamp(e.hp / e.maxHp, 0, 1), 4 * scale);
  }

  function drawFxWorld() {
    let i, p;
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
    for (i = sparks.length - 1; i >= 0; i--) {
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
    ctx.fillText(e.spec.name, x + w / 2, y + 7 * scale);
  }

  function drawIntro() {
    if (G.intro <= 0 || G.mode !== 'play') return;
    const t = clamp(G.intro / 0.9, 0, 1);
    const a = t > 0.3 ? 1 : t / 0.3;
    const name = stageAt(G.stage - 1).name;
    ctx.fillStyle = 'rgba(22,6,6,' + (0.55 * a) + ')';
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
    ctx.fillText(G.kind === 'core' ? '截核' : (G.boss ? G.boss.spec.name : '清场'), ox + 320 * scale, oy + 158 * scale);
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
    ctx.fillStyle = '#0a0402';
    ctx.fillRect(0, 0, W, H);

    const shx = (G.shake ? (Math.random() - 0.5) * G.shake : 0) + G.kickX;
    const shy = (G.shake ? (Math.random() - 0.5) * G.shake * 0.55 : 0) + G.kickY;
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();
    ctx.translate(shx, shy);

    drawSky();
    drawBack();
    drawStreet();

    const list = [];
    let i;
    for (i = 0; i < G.crates.length; i++) {
      if (!G.crates[i].smashed) list.push({ z: G.crates[i].y, kind: 'crate', o: G.crates[i] });
    }
    for (i = 0; i < G.drops.length; i++) list.push({ z: G.drops[i].y, kind: 'drop', o: G.drops[i] });
    for (i = 0; i < G.shots.length; i++) list.push({ z: G.shots[i].y, kind: 'shot', o: G.shots[i] });
    for (i = 0; i < G.enemies.length; i++) list.push({ z: G.enemies[i].y, kind: 'foe', o: G.enemies[i] });
    if (G.player) list.push({ z: G.player.y, kind: 'ply', o: G.player });
    list.sort(function (a, b) { return a.z - b.z; });

    drawGhosts();
    for (i = 0; i < list.length; i++) {
      if (list[i].kind === 'crate') drawCrate(list[i].o);
      else if (list[i].kind === 'drop') drawDrop(list[i].o);
      else if (list[i].kind === 'shot') drawShot(list[i].o);
      else if (list[i].kind === 'foe') {
        drawFighter(list[i].o, lookOf(list[i].o.kind), { blink: false });
        drawHpChip(list[i].o, lookOf(list[i].o.kind));
      } else {
        drawFighter(list[i].o, lookOf('player'), {
          blink: G.invuln > 0 && G.mode === 'play'
        });
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
    punchEdge.down = keys.punch && !punchEdge.was;
    kickEdge.down = keys.kick && !kickEdge.was;
    jumpEdge.down = keys.jump && !jumpEdge.was;
    if (punchEdge.down && G.player) G.player.punchBuf = 0.16;
    if (kickEdge.down && G.player) G.player.kickBuf = 0.16;
    if (jumpEdge.down && G.player) G.player.jumpBuf = 0.16;
    punchEdge.was = keys.punch;
    kickEdge.was = keys.kick;
    jumpEdge.was = keys.jump;
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const punchKey = space || k === 'z' || k === 'Z' || k === 'j' || k === 'J' || code === 'KeyZ';
    const kickKey = k === 'x' || k === 'X' || k === 'k' || k === 'K' || code === 'KeyX';
    const jumpKey = code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyC'
      || k === 'c' || k === 'C' || k === 'Shift';
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (punchKey) keys.punch = down;
    if (kickKey) keys.kick = down;
    if (jumpKey) keys.jump = down;

    if (down && (isMove || space || k === 'Enter' || punchKey || kickKey || jumpKey)) e.preventDefault();
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
          keys.punch = false;
          startRun('stage');
          return;
        }
        if (k === '2') { startRun('core'); return; }
      }
      if (G.mode === 'over') {
        if (k === '1' || space || k === 'Enter') {
          keys.punch = false;
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
  bindHold(document.getElementById('btn-punch'), function (v) { keys.punch = v; });
  bindHold(document.getElementById('btn-kick'), function (v) { keys.kick = v; });
  bindHold(document.getElementById('btn-jump'), function (v) { keys.jump = v; });

  canvas.addEventListener('pointerdown', function (ev) {
    audio.ensure();
    ev.preventDefault();
    if (overlayOpen()) return;
    keys.punch = true;
  });
  canvas.addEventListener('pointerup', function () { keys.punch = false; });
  canvas.addEventListener('pointercancel', function () { keys.punch = false; });
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
  btnStage.addEventListener('click', function () {
    audio.ensure();
    startRun('stage');
  });
  btnCore.addEventListener('click', function () {
    audio.ensure();
    startRun('core');
  });
  modeStage.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') { setModes('stage'); G.kind = 'stage'; return; }
    startRun('stage');
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
