'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const HP_MAX = 100;
  const ENERGY_MAX = 3;
  const ENERGY_COST = 1;
  const COMBO_WIN = 1.55;
  const BELT_TOP = 222;
  const BELT_BOT = 322;
  const WALK_X = 192;
  const WALK_Y = 122;
  const INVULN = 1.35;
  const DIE_T = 0.8;
  const HURT_T = 0.36;
  const GRAV = 920;
  const JUGGLE = true;
  const JUGGLE_DECAY = 0.84;
  const JUGGLE_CAP = 7;
  const LAUNCH_VH = 318;
  const BLITZ_WIN = 0.24;
  const BLITZ_COOL = 0.72;
  const BLITZ_DUR = 0.22;
  const BLITZ_SPD = 400;
  const BEST_KEY = 'playbox-streets-of-rage4-best';
  const MUTE_KEY = 'playbox-streets-of-rage4-mute';
  const OPS = '方向键 / WASD 走 · 空格出拳 · Shift / Z 星砸 · 双击方向星冲 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 176, 32];
  const HOT2 = [255, 208, 96];
  const WHT = [244, 240, 238];
  const LEAF = [61, 255, 122];
  const SKIN = [232, 184, 148];
  const APPLE = [220, 48, 52];
  const TEAL = [24, 168, 168];
  const VIO = [168, 72, 255];
  const STEEL = [154, 164, 180];

  const COMBO_PUNCH = [
    { dmg: 8, range: 34, dur: 0.13, hit0: 0.03, hit1: 0.1, kb: 64, stop: 0.04 },
    { dmg: 11, range: 38, dur: 0.15, hit0: 0.03, hit1: 0.12, kb: 88, stop: 0.05 },
    { dmg: 16, range: 42, dur: 0.26, hit0: 0.05, hit1: 0.16, kb: 110, stop: 0.072, launch: LAUNCH_VH }
  ];
  const SPEC_ATK = { dmg: 22, range: 56, dur: 0.52, hit0: 0.22, hit1: 0.48, kb: 150, stop: 0.08, launch: 110, slam: 460 };
  const BLITZ_ATK = { dmg: 14, range: 36, kb: 96, stop: 0.056, launch: 270 };
  const AIR_ATK = { dmg: 10, range: 40, kb: 48, stop: 0.05, launch: 248 };
  const SLAM_HIT = { dmg: 14, kb: 120, stop: 0.06, launch: 140 };

  const FOES = {
    punk: {
      hp: 26, spd: 86, dmg: 11, range: 28, score: 180, w: 16, h: 30,
      think: 0.5, punchDur: 0.3, name: '街痞'
    },
    star: {
      hp: 24, spd: 90, dmg: 10, range: 90, score: 250, w: 15, h: 29,
      think: 0.68, punchDur: 0.34, name: '星刃', thrower: true
    },
    arm: {
      hp: 52, spd: 56, dmg: 17, range: 34, score: 340, w: 21, h: 36,
      think: 0.66, punchDur: 0.42, name: '铁臂', heavy: true
    },
    bike: {
      hp: 40, spd: 134, dmg: 15, range: 34, score: 280, w: 18, h: 32,
      think: 0.38, punchDur: 0.26, name: '摩托', charge: true
    },
    muse: {
      hp: 180, spd: 84, dmg: 18, range: 88, score: 4400, w: 22, h: 40,
      think: 0.36, punchDur: 0.34, name: '画鬼', boss: true, thrower: true
    },
    shark: {
      hp: 240, spd: 122, dmg: 19, range: 40, score: 5600, w: 20, h: 38,
      think: 0.3, punchDur: 0.28, name: '夜鲨', boss: true, charge: true
    },
    don: {
      hp: 330, spd: 92, dmg: 21, range: 96, score: 9600, w: 22, h: 42,
      think: 0.34, punchDur: 0.32, name: '罪主', boss: true, shooter: true
    }
  };

  const STAGES = [
    {
      name: '画廊', boss: '画鬼', w: 2040, theme: 'gallery', bossKind: 'muse',
      packs: [
        { x: 200, gate: 500, foes: [['punk', 260, 262], ['punk', 350, 286]] },
        { x: 540, gate: 860, foes: [['punk', 580, 258], ['star', 680, 278], ['punk', 760, 268]] },
        { x: 900, gate: 1220, foes: [['bike', 940, 260], ['star', 1040, 276], ['punk', 1140, 254]] },
        { x: 1280, gate: 1640, foes: [['bike', 1320, 258], ['arm', 1420, 282], ['punk', 1500, 262], ['star', 1560, 274]] }
      ],
      drops: [[430, 268, 'food'], [1000, 250, 'food'], [1420, 274, 'star']]
    },
    {
      name: '夜港', boss: '夜鲨', w: 2240, theme: 'harbor', bossKind: 'shark',
      packs: [
        { x: 180, gate: 520, foes: [['bike', 240, 262], ['punk', 340, 284]] },
        { x: 560, gate: 900, foes: [['arm', 600, 260], ['star', 700, 278], ['bike', 800, 256]] },
        { x: 940, gate: 1300, foes: [['punk', 980, 258], ['bike', 1080, 276], ['arm', 1180, 286], ['star', 1240, 254]] },
        { x: 1360, gate: 1800, foes: [['bike', 1400, 258], ['arm', 1500, 282], ['star', 1600, 264], ['bike', 1720, 276]] }
      ],
      drops: [[400, 270, 'food'], [880, 252, 'star'], [1320, 288, 'food'], [1640, 264, 'food']]
    },
    {
      name: '罪殿', boss: '罪主', w: 2440, theme: 'palace', bossKind: 'don',
      packs: [
        { x: 160, gate: 520, foes: [['star', 220, 262], ['bike', 320, 280], ['punk', 420, 256]] },
        { x: 560, gate: 940, foes: [['arm', 600, 256], ['star', 700, 278], ['punk', 800, 264], ['bike', 880, 272]] },
        { x: 1000, gate: 1440, foes: [['star', 1040, 258], ['arm', 1140, 274], ['bike', 1240, 286], ['star', 1360, 254]] },
        { x: 1500, gate: 1960, foes: [['bike', 1540, 258], ['arm', 1640, 282], ['star', 1740, 264], ['bike', 1820, 276], ['star', 1900, 256]] }
      ],
      drops: [[380, 268, 'food'], [780, 250, 'star'], [1200, 290, 'food'], [1580, 262, 'star'], [1800, 278, 'food']]
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
    return 1 + Math.min(4, Math.floor(Math.max(0, n) / 3));
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
  function armored(p) {
    return p && (p.act === 'special' || p.act === 'blitz');
  }
  function airborne(e) {
    return !!(e && (e.act === 'air' || (e.h || 0) > 8));
  }
  function launchScale(e) {
    if (!e) return 1;
    if (e.boss) return 0.55;
    if (e.spec && e.spec.heavy) return 0.7;
    return 1;
  }

  function selfCheck() {
    if (!JUGGLE) throw new Error('juggle');
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (ENERGY_COST !== 1) throw new Error('energy cost');
    if (ENERGY_MAX !== 3) throw new Error('energy max');
    if (COMBO_PUNCH.length !== 3) throw new Error('3 punch');
    if (!COMBO_PUNCH[2].launch) throw new Error('uppercut launch');
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(2) !== 1) throw new Error('combo 2');
    if (comboMul(3) !== 2) throw new Error('combo 3');
    if (comboMul(12) !== 5) throw new Error('combo cap');
    if (BELT_BOT - BELT_TOP < 80) throw new Error('belt');
    if (!FOES.punk || !FOES.star || !FOES.arm || !FOES.bike) throw new Error('foes');
    if (!FOES.muse || !FOES.shark || !FOES.don) throw new Error('bosses');
    if (!FOES.star.thrower) throw new Error('star throw');
    if (!FOES.bike.charge) throw new Error('bike charge');
    if (!FOES.don.shooter) throw new Error('don shoot');
    if (FOES.muse.hp >= FOES.shark.hp || FOES.shark.hp >= FOES.don.hp) throw new Error('boss hp');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (BEST_KEY !== 'playbox-streets-of-rage4-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-streets-of-rage4-mute') throw new Error('mute key');
    if (SPEC_ATK.range <= COMBO_PUNCH[2].range) throw new Error('spec range');
    if (BLITZ_DUR < 0.16 || BLITZ_SPD < 300) throw new Error('blitz');
    if (LAUNCH_VH < 240 || GRAV < 600) throw new Error('juggle phys');
    if (SPEC_ATK.slam < 300) throw new Error('star slam');
    let i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.packs.length || !s.drops.length || !s.bossKind) throw new Error('stage ' + s.name);
    }
    if (STAGES[0].bossKind !== 'muse' || STAGES[2].bossKind !== 'don') throw new Error('crime-boss last');
    if (STAGES[0].name === '闹市' || STAGES[0].name === '船坞' || STAGES[0].name === '香港') throw new Error('distinct stages');
    if (STAGES[0].theme === 'street' || STAGES[0].theme === 'dock') throw new Error('distinct theme');
    if (FOES.thug || FOES.bot || FOES.punk.name === '混混') throw new Error('distinct foes');
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
  const btnStreet = document.getElementById('btn-street');
  const btnCore = document.getElementById('btn-core');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeStreet = document.getElementById('mode-street');
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
  const spBar = document.getElementById('sp-bar');
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
  let lastTapDir = 0;
  let lastTapT = -9;

  const keys = { l: false, r: false, u: false, d: false, punch: false, spec: false, blitz: false };
  const punchEdge = { down: false, was: false };
  const specEdge = { down: false, was: false };
  const blitzEdge = { down: false, was: false };
  const dirEdge = { lWas: false, rWas: false };

  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const ghosts = [];

  const G = {
    mode: 'title',
    kind: 'street',
    clock: 0,
    stage: 1,
    camX: 0,
    levelW: 2040,
    theme: 'gallery',
    packs: [],
    enemies: [],
    drops: [],
    shots: [],
    player: null,
    boss: null,
    lives: LIVES,
    hp: HP_MAX,
    energy: 2,
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
  function playing() {
    return G.mode === 'play';
  }
  function live() {
    return G.mode === 'play' || G.mode === 'title';
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
      this.noise(0.07, 0.07, 1100, 'highpass');
      this.beep(190, 0.05, 'sawtooth', 0.03, 70);
    },
    hit: function (combo, heavy) {
      this.ensure();
      const p = 1 + Math.min(6, combo) * 0.06;
      this.noise(0.12, heavy ? 0.2 : 0.14, 220, 'lowpass');
      this.beep(160 * p, 0.1, 'square', 0.08, 58);
      this.beep((heavy ? 880 : 640) * p, 0.07, 'triangle', 0.05, 380 * p);
      if (heavy) this.beep(1180 * p, 0.09, 'square', 0.04, 1540 * p);
    },
    special: function () {
      this.ensure();
      this.noise(0.28, 0.22, 260, 'bandpass');
      this.beep(220, 0.2, 'sawtooth', 0.07, 90);
      this.beep(740, 0.16, 'square', 0.07, 1680);
      this.beep(1240, 0.14, 'triangle', 0.05, 480);
    },
    blitz: function () {
      this.ensure();
      this.noise(0.14, 0.15, 1500, 'highpass');
      this.beep(280, 0.12, 'sawtooth', 0.07, 110);
      this.beep(1080, 0.09, 'square', 0.05, 1640);
    },
    juggle: function () {
      this.ensure();
      this.beep(520, 0.07, 'square', 0.05, 980);
      this.beep(880, 0.08, 'triangle', 0.04, 1400);
      this.noise(0.08, 0.08, 1200, 'highpass');
    },
    slam: function () {
      this.ensure();
      this.noise(0.2, 0.22, 140, 'lowpass');
      this.beep(110, 0.16, 'square', 0.07, 46);
      this.beep(620, 0.1, 'triangle', 0.05, 180);
    },
    crash: function () {
      this.ensure();
      this.noise(0.18, 0.2, 160, 'lowpass');
      this.beep(90, 0.16, 'square', 0.07, 40);
    },
    explode: function () {
      this.ensure();
      this.noise(0.22, 0.22, 280, 'lowpass');
      this.beep(140, 0.16, 'square', 0.07, 50);
      this.beep(720, 0.12, 'triangle', 0.05, 180);
    },
    food: function () {
      this.ensure();
      this.beep(392, 0.07, 'sine', 0.05, 523);
      this.beep(523, 0.1, 'triangle', 0.045, 784);
    },
    star: function () {
      this.ensure();
      this.beep(660, 0.06, 'sine', 0.05, 880);
      this.beep(880, 0.1, 'triangle', 0.045, 1320);
    },
    dart: function () {
      this.ensure();
      this.noise(0.07, 0.08, 1700, 'bandpass');
      this.beep(980, 0.06, 'square', 0.035, 420);
    },
    shot: function () {
      this.ensure();
      this.noise(0.08, 0.1, 700, 'bandpass');
      this.beep(240, 0.08, 'square', 0.05, 80);
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
    setTimeout(function () { stageEl.classList.remove('pickup'); }, 440);
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
      a: a || 0.35, kind: e.kind || 'player', act: e.act
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
  function addEnergy(n) {
    G.energy = clamp(G.energy + n, 0, ENERGY_MAX);
    G.hudDirty = true;
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
    if (modeStreet) modeStreet.setAttribute('aria-pressed', kind === 'street' ? 'true' : 'false');
    if (modeCore) modeCore.setAttribute('aria-pressed', kind === 'core' ? 'true' : 'false');
  }
  function anyAir() {
    let i;
    for (i = 0; i < G.enemies.length; i++) {
      if (!G.enemies[i].dead && airborne(G.enemies[i])) return true;
    }
    return false;
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
    if (spBar) {
      spBar.style.transform = 'scaleX(' + clamp(G.energy / ENERGY_MAX, 0, 1) + ')';
      spBar.classList.toggle('low', G.energy < 1);
    }
    if (grabLabel) {
      const dash = !!(p && p.act === 'blitz');
      const smash = !!(p && p.act === 'special');
      const air = anyAir();
      grabLabel.textContent = dash ? '星冲' : (smash ? '星砸' : (air ? '浮空' : '徒手'));
      grabLabel.classList.toggle('grab', air && !dash && !smash);
      grabLabel.classList.toggle('blitz', dash || smash);
      grabLabel.classList.toggle('hot', !air && !dash && !smash);
    }
    if (tagLabel) {
      tagLabel.textContent = G.kind === 'core' ? '怒核' : '怒四';
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
      specBuf: 0,
      blitzBuf: 0,
      blitzCool: 0,
      blitzHit: {},
      stun: 0,
      chainT: 0,
      run: 0
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
      juggles: 0,
      slam: false,
      bounced: false,
      slamHit: {},
      boss: !!spec.boss,
      flashT: 0,
      think: spec.think / spdMul,
      pack: -1,
      cool: 0
    };
  }
  function makeDrop(x, y, kind) {
    return { x: x, y: y, kind: kind, bob: rand(0, TAU), taken: false };
  }
  function makeShot(x, y, face, kind) {
    return {
      x: x, y: y, face: face,
      vx: face * (kind === 'gun' ? 340 : 300),
      life: kind === 'gun' ? 0.88 : 0.74,
      kind: kind || 'star',
      from: 'foe'
    };
  }

  function lookOf(kind) {
    if (kind === 'player') {
      return { jacket: HOT, pants: TEAL, hair: GOLD, skin: SKIN, accent: CYN, hairStyle: 'crop', size: 1 };
    }
    if (kind === 'punk') {
      return { jacket: MAG, pants: [36, 32, 44], hair: VIO, skin: SKIN, accent: MAG, hairStyle: 'mohawk', size: 1 };
    }
    if (kind === 'star') {
      return { jacket: [88, 40, 160], pants: [28, 22, 40], hair: GOLD, skin: SKIN, accent: GOLD, hairStyle: 'pony', size: 1 };
    }
    if (kind === 'arm') {
      return { jacket: [200, 96, 48], pants: [36, 28, 32], hair: [24, 18, 16], skin: [196, 140, 108], accent: GOLD, hairStyle: 'bald', size: 1.24 };
    }
    if (kind === 'bike') {
      return { jacket: [32, 28, 38], pants: [22, 20, 28], hair: [20, 18, 22], skin: [210, 160, 120], accent: CYN, hairStyle: 'helm', size: 1.04 };
    }
    if (kind === 'muse') {
      return { jacket: [176, 48, 140], pants: [40, 24, 48], hair: [16, 12, 28], skin: [210, 168, 140], accent: MAG, hairStyle: 'visor', size: 1.26 };
    }
    if (kind === 'shark') {
      return { jacket: [20, 120, 140], pants: [18, 28, 36], hair: [16, 20, 28], skin: [196, 156, 124], accent: CYN, hairStyle: 'helm', size: 1.16 };
    }
    return { jacket: [36, 24, 48], pants: [16, 14, 22], hair: [12, 10, 16], skin: [176, 128, 100], accent: GOLD, hairStyle: 'slick', size: 1.3 };
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
  function depthHit(a, b, extra) {
    const pad = extra || 0;
    return Math.abs(a.y - b.y) < 22 + pad;
  }
  function packAlive(packId) {
    let i, e, n = 0;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.pack === packId && !e.dead) n += 1;
    }
    return n;
  }
  function reachOk(p, e, range) {
    const air = airborne(e) || (p.h || 0) > 10;
    if (!depthHit(p, e, air ? 8 : 0)) return false;
    const d = (e.x - p.x) * p.face;
    if (d < (air ? -10 : 6) || d > range + (air ? 10 : 0)) return false;
    return true;
  }

  /* ---- combat ---- */
  function explodeStar(x, y) {
    burst(x, y, 22, GOLD, 220, 0.48);
    burst(x, y + 4, 12, CYN, 160, 0.36);
    spark(x, y, GOLD, 12);
    ringAt(x, y + 4, GOLD);
    flash(GOLD, 0.26);
    audio.explode();
  }

  function launchEnemy(e, face, vh, kb, src) {
    const sc = launchScale(e);
    const already = airborne(e);
    const n = already ? (e.juggles || 0) + 1 : 0;
    const decay = Math.pow(JUGGLE_DECAY, Math.min(JUGGLE_CAP, n));
    e.act = 'air';
    e.juggles = n;
    e.slam = src === 'slam';
    e.bounced = false;
    e.stun = 0.4;
    e.face = -face;
    e.charge = 0;
    e.vx = face * kb * (already ? 0.28 : 0.42);
    e.vh = Math.max(90, vh * sc * decay);
    if (e.slam) e.vh = -Math.abs(vh);
    e.h = Math.max(e.h || 0, already ? e.h : 12);
    if (e.slam) e.h = Math.max(e.h, 10);
    e.flashT = 0.1;
    G.hudDirty = true;
  }

  function hurtEnemy(e, dmg, kb, face, finisher, src, launchV) {
    if (e.dead) return;
    if (G.mode !== 'play') {
      e.hp -= dmg;
      e.stun = 0.22;
      e.flashT = 0.1;
      if (launchV) launchEnemy(e, face, launchV, kb, src);
      else {
        e.act = e.hp <= 0 ? 'down' : 'hurt';
        e.t = e.hp <= 0 ? 0.45 : 0.22;
        e.vx = face * kb * 0.55;
      }
      if (e.hp <= 0) {
        e.dead = true;
        e.deadT = 0.5;
        if (!launchV) e.act = 'down';
        explodeStar(e.x, e.y - 18 - (e.h || 0));
      }
      return;
    }
    e.hp -= dmg;
    e.stun = finisher ? 0.5 : 0.2;
    e.flashT = 0.12;
    e.face = -face;
    e.charge = 0;
    if (src !== 'slam-splash') addEnergy(0.14);
    const mul = bumpCombo();
    const kill = Math.round(e.spec.score * mul);
    const chip = Math.max(12, Math.round((14 + dmg) * mul));
    if (launchV) {
      launchEnemy(e, face, launchV, kb, src);
      if (src === 'juggle' || airborne(e)) {
        audio.juggle();
        if (e.juggles === 2) toast('浮空', false, true);
      }
    } else {
      e.act = e.hp <= 0 ? 'down' : 'hurt';
      e.t = e.hp <= 0 ? 0.55 : 0.3;
      e.vx = face * kb;
      e.vh = 0;
      e.h = 0;
    }
    if (e.hp <= 0) {
      e.dead = true;
      e.deadT = 0.7;
      bumpScore(kill);
      pop(e.x, e.y - 36 - (e.h || 0), '+' + kill, GOLD);
      explodeStar(e.x, e.y - 18 - (e.h || 0));
      if (e.boss) {
        burst(e.x, e.y - 24, 32, GOLD, 250, 0.58);
        flash(GOLD, 0.55);
        audio.ko();
      }
      maybeDrop(e);
    } else {
      bumpScore(chip);
      pop(e.x, e.y - 32 - (e.h || 0), '+' + chip, WHT);
    }
    G.hudDirty = true;
  }

  function maybeDrop(e) {
    if (G.mode !== 'play') return;
    if (e.boss) {
      G.drops.push(makeDrop(e.x, e.y, 'food'));
      G.drops.push(makeDrop(e.x + 18, e.y, 'star'));
      return;
    }
    if (Math.random() < 0.16) G.drops.push(makeDrop(e.x, e.y, Math.random() < 0.4 ? 'star' : 'food'));
  }

  function hurtPlayer(dmg, face, why) {
    const p = G.player;
    if (!p || G.invuln > 0 || armored(p) || G.deadT > 0) return;
    if (G.mode !== 'play') return;
    p.hp -= dmg;
    G.hp = p.hp;
    breakCombo();
    p.act = 'hurt';
    p.t = HURT_T;
    p.stun = HURT_T;
    p.vx = face * 160;
    p.h = 0;
    p.vh = 0;
    p.punch = 0;
    p.comboStep = 0;
    G.invuln = 0.52;
    audio.hurt();
    hitStop(0.045);
    flash(MAG, 0.28);
    shake(7);
    kick(face * 5, 2);
    burst(p.x, p.y - 20, 10, HOT, 140, 0.32);
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
      p.h = 0;
    }
    audio.ko();
    dieKick();
    flash(HOT, 0.5);
    shake(11);
    if (G.lives < 0) {
      G.lives = 0;
      G.deadT = DIE_T;
    }
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
    p.h = 0;
    p.vh = 0;
    p.stun = 0;
    p.punch = 0;
    p.comboStep = 0;
    p.blitzHit = {};
    G.deadT = 0;
    G.invuln = INVULN;
    G.hudDirty = true;
    toast('再上', false, true);
  }

  function punchHits(p, atk) {
    const face = p.face;
    let i, e, n = 0, launch;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead) continue;
      if (!reachOk(p, e, atk.range)) continue;
      launch = airborne(e) ? AIR_ATK.launch : (atk.launch || 0);
      hurtEnemy(e, airborne(e) ? AIR_ATK.dmg : atk.dmg, airborne(e) ? AIR_ATK.kb : atk.kb, face, !!atk.launch, airborne(e) ? 'juggle' : 'punch', launch);
      n += 1;
    }
    return n;
  }

  function specialHits(p) {
    let i, e, face, n = 0, launch;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead) continue;
      if (Math.abs(e.y - p.y) > 30) continue;
      if (Math.abs(e.x - p.x) > SPEC_ATK.range) continue;
      face = e.x >= p.x ? 1 : -1;
      if (airborne(e)) {
        hurtEnemy(e, SPEC_ATK.dmg, SPEC_ATK.kb, face, true, 'slam', SPEC_ATK.slam);
      } else {
        launch = SPEC_ATK.launch;
        hurtEnemy(e, SPEC_ATK.dmg, SPEC_ATK.kb, face, true, 'spec', launch);
      }
      n += 1;
    }
    return n;
  }

  function blitzHits(p) {
    const face = p.face;
    let i, e, n = 0;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead) continue;
      if (!reachOk(p, e, BLITZ_ATK.range)) continue;
      if (p.blitzHit[e.id]) continue;
      p.blitzHit[e.id] = 1;
      hurtEnemy(e, BLITZ_ATK.dmg, BLITZ_ATK.kb, face, false, airborne(e) ? 'juggle' : 'blitz', BLITZ_ATK.launch);
      n += 1;
    }
    return n;
  }

  function breakShotsNear(p, rad) {
    let i, s;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      if (Math.abs(s.x - p.x) > rad || Math.abs(s.y - p.y) > 16) continue;
      burst(s.x, s.y - 16, 8, s.kind === 'star' ? GOLD : CYN, 120, 0.22);
      spark(s.x, s.y - 16, GOLD, 4);
      hitStop(0.03);
      G.shots.splice(i, 1);
    }
  }

  function startPunch(p) {
    let step = 0;
    if (p.chainT > 0) step = Math.min(2, p.comboStep + 1);
    if (anyAir()) step = Math.min(2, Math.max(step, 1));
    p.comboStep = step;
    p.act = 'punch';
    p.t = COMBO_PUNCH[step].dur;
    p.hit = false;
    p.punch = 0;
    p.vx *= 0.3;
    audio.swing();
  }

  function startSpecial(p) {
    if (G.energy < ENERGY_COST && G.mode === 'play') {
      toast('星能不足', true, false);
      audio.ui();
      return;
    }
    if (G.mode === 'play') addEnergy(-ENERGY_COST);
    p.act = 'special';
    p.t = SPEC_ATK.dur;
    p.hit = false;
    p.vx = 0;
    p.h = 0;
    audio.special();
    flash(GOLD, 0.42);
    shake(10);
    boomKick();
    ringAt(p.x, p.y - 18, GOLD);
    burst(p.x, p.y - 16, 24, GOLD, 220, 0.42);
    spark(p.x, p.y - 20, CYN, 10);
    ghostAt(p, 0.5);
  }

  function startBlitz(p, face) {
    if (!p) return;
    if (p.blitzCool > 0 && G.mode === 'play') return;
    if (face) p.face = face;
    p.act = 'blitz';
    p.t = BLITZ_DUR;
    p.vx = p.face * BLITZ_SPD;
    p.blitzHit = {};
    p.blitzCool = BLITZ_COOL;
    p.hit = false;
    audio.blitz();
    flash(CYN, 0.22);
    shake(6);
    kick(p.face * 8, 1);
    ghostAt(p, 0.55);
    burst(p.x, p.y - 14, 12, GOLD, 200, 0.28);
    G.hudDirty = true;
  }

  function splashSlam(e) {
    let i, o, d;
    for (i = 0; i < G.enemies.length; i++) {
      o = G.enemies[i];
      if (o === e || o.dead || airborne(o)) continue;
      if (Math.abs(o.y - e.y) > 24) continue;
      d = Math.abs(o.x - e.x);
      if (d > 48) continue;
      hurtEnemy(o, SLAM_HIT.dmg, SLAM_HIT.kb, o.x >= e.x ? 1 : -1, true, 'slam-splash', SLAM_HIT.launch);
    }
  }

  function wallBounce(e) {
    e.vx *= -0.72;
    e.vh = Math.max(e.vh, 200) * 0.92;
    e.h = Math.max(e.h, 14);
    e.bounced = true;
    e.juggles = (e.juggles || 0) + 1;
    audio.crash();
    hitStop(0.055);
    shake(8);
    burst(e.x, e.y - 14 - e.h, 16, HOT, 180, 0.36);
    spark(e.x, e.y - 14 - e.h, GOLD, 8);
    ringAt(e.x, e.y - 8, HOT);
    if (G.mode === 'play') {
      const mul = bumpCombo();
      const n = Math.round(80 * mul);
      bumpScore(n);
      pop(e.x, e.y - 30 - e.h, '+' + n, HOT);
    }
  }

  function landFoe(e) {
    const slammed = e.slam || e.vh < -260;
    e.h = 0;
    e.vh = 0;
    e.act = e.dead ? 'down' : 'hurt';
    e.t = slammed ? 0.5 : 0.32;
    e.stun = slammed ? 0.55 : 0.36;
    e.vx *= 0.25;
    if (slammed) {
      audio.slam();
      hitStop(SLAM_HIT.stop);
      shake(11);
      thumpKick();
      flash(HOT, 0.22);
      burst(e.x, e.y - 10, 22, GOLD, 210, 0.42);
      spark(e.x, e.y - 10, HOT, 10);
      ringAt(e.x, e.y - 6, GOLD);
      explodeStar(e.x, e.y - 8);
      splashSlam(e);
      if (G.mode === 'play' && !e.dead) {
        hurtEnemy(e, 10, 40, e.face, true, 'land');
      }
    }
    e.slam = false;
    e.juggles = 0;
    G.hudDirty = true;
  }

  function tickAir(e, dt) {
    e.vh -= GRAV * dt;
    e.h += e.vh * dt;
    e.x += e.vx * dt;
    e.vx *= Math.max(0, 1 - dt * 0.9);
    const wallL = G.arenaL + 18;
    const wallR = G.arenaR - 18;
    if (e.x <= wallL || e.x >= wallR) {
      e.x = clamp(e.x, wallL, wallR);
      if (!e.bounced) wallBounce(e);
    }
    if (e.h <= 0) {
      landFoe(e);
      return;
    }
    e.act = 'air';
    e.stun = Math.max(e.stun, 0.1);
  }

  /* ---- player ---- */
  function tickPlayer(dt) {
    const p = G.player;
    if (!p) return;
    p.punchBuf = Math.max(0, p.punchBuf - dt);
    p.specBuf = Math.max(0, p.specBuf - dt);
    p.blitzBuf = Math.max(0, p.blitzBuf - dt);
    p.blitzCool = Math.max(0, p.blitzCool - dt);
    p.chainT = Math.max(0, p.chainT - dt);
    p.stun = Math.max(0, p.stun - dt);
    p.step += dt;

    if (G.deadT > 0) {
      G.deadT -= dt;
      p.act = 'down';
      p.vx *= Math.max(0, 1 - dt * 6);
      p.x += p.vx * dt;
      p.h = 0;
      clampBelt(p);
      if (G.deadT <= 0) respawn();
      return;
    }

    if (G.invuln > 0) G.invuln = Math.max(0, G.invuln - dt);

    if (p.act === 'hurt') {
      p.t -= dt;
      p.x += p.vx * dt;
      p.vx *= Math.max(0, 1 - dt * 5);
      p.h = 0;
      clampBelt(p);
      if (p.t <= 0) p.act = 'idle';
      return;
    }

    if (p.act === 'blitz') {
      p.t -= dt;
      p.x += p.vx * dt;
      if ((G.clock * 28) % 1 < dt * 28) ghostAt(p, 0.32);
      breakShotsNear(p, 26);
      const n = blitzHits(p);
      if (n > 0) {
        hitStop(BLITZ_ATK.stop);
        shake(7);
        kick(p.face * 6, 2);
        burst(p.x + p.face * 20, p.y - 16, 12, GOLD, 180, 0.3);
        spark(p.x + p.face * 20, p.y - 16, CYN, 6);
        audio.hit(G.combo, true);
      }
      clampBelt(p);
      if (p.t <= 0) {
        p.act = 'idle';
        p.vx *= 0.2;
        G.hudDirty = true;
      }
      return;
    }

    if (p.act === 'special') {
      p.t -= dt;
      const u = 1 - p.t / SPEC_ATK.dur;
      if (u < 0.42) p.h = Math.sin((u / 0.42) * Math.PI * 0.5) * 46;
      else {
        const d = (u - 0.42) / 0.58;
        p.h = 46 * (1 - d * d);
      }
      if ((G.clock * 18) % 1 < dt * 18) {
        ghostAt(p, 0.26);
        ringAt(p.x, p.y - 12 - p.h, GOLD);
      }
      breakShotsNear(p, SPEC_ATK.range * 0.75);
      if (!p.hit && p.t < SPEC_ATK.dur - SPEC_ATK.hit0 && p.t > SPEC_ATK.dur - SPEC_ATK.hit1) {
        const n = specialHits(p);
        p.hit = true;
        hitStop(SPEC_ATK.stop);
        shake(9);
        kick(0, 5);
        burst(p.x, p.y - 8, 26, GOLD, 240, 0.4);
        spark(p.x, p.y - 8, CYN, 14);
        ringAt(p.x, p.y - 6, GOLD);
        explodeStar(p.x, p.y - 10);
        audio.slam();
        if (n > 0) audio.hit(G.combo, true);
      }
      clampBelt(p);
      if (p.t <= 0) {
        p.act = 'idle';
        p.h = 0;
      }
      return;
    }

    if (p.act === 'punch') {
      p.t -= dt;
      const atk = COMBO_PUNCH[p.comboStep] || COMBO_PUNCH[0];
      if (!p.hit && p.t < atk.dur - atk.hit0 && p.t > atk.dur - atk.hit1) {
        const n = punchHits(p, atk);
        p.hit = true;
        if (n > 0) {
          hitStop(atk.stop);
          shake(atk.launch ? 8 : 5);
          kick(p.face * (atk.launch ? 6 : 4), 2);
          burst(p.x + p.face * 22, p.y - 16, atk.launch ? 16 : 8, atk.launch ? GOLD : HOT, 150, 0.3);
          spark(p.x + p.face * 22, p.y - 16, GOLD, atk.launch ? 8 : 4);
          audio.hit(G.combo, !!atk.launch);
        }
      }
      if (p.t <= 0) {
        p.chainT = 0.28;
        p.act = 'idle';
      }
      clampBelt(p);
      return;
    }

    p.h = Math.max(0, p.h - 240 * dt);

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
    clampBelt(p);

    if (inputOk() && p.blitzBuf > 0) {
      p.blitzBuf = 0;
      startBlitz(p, p.face);
      return;
    }
    if (inputOk() && p.specBuf > 0) {
      p.specBuf = 0;
      startSpecial(p);
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
    hurtPlayer(e.spec.dmg, e.face, '被' + e.spec.name + '打中了');
  }

  function foeChargeHit(e) {
    const p = G.player;
    if (!p || G.deadT > 0) return;
    if (!depthHit(e, p)) return;
    if (Math.abs(p.x - e.x) > 18) return;
    hurtPlayer(e.spec.dmg + 2, e.vx > 0 ? 1 : -1, '被' + e.spec.name + '撞了');
  }

  function tickFoe(e, dt) {
    if (e.dead && e.act !== 'air') {
      e.deadT -= dt;
      e.act = 'down';
      e.vx *= Math.max(0, 1 - dt * 5);
      e.x += e.vx * dt;
      e.h = Math.max(0, (e.h || 0) - 400 * dt);
      return;
    }
    e.flashT = Math.max(0, e.flashT - dt);
    e.stun = Math.max(0, e.stun - dt);
    e.cool = Math.max(0, e.cool - dt);
    e.step += dt;

    if (e.act === 'air') {
      tickAir(e, dt);
      if (e.dead && e.act !== 'air') e.deadT = Math.max(e.deadT, 0.45);
      return;
    }
    if (e.act === 'hurt' || e.act === 'down') {
      e.t -= dt;
      e.x += e.vx * dt;
      e.vx *= Math.max(0, 1 - dt * 5);
      e.h = 0;
      clampBelt(e);
      if (e.t <= 0) {
        if (e.dead) {
          e.act = 'down';
          return;
        }
        e.act = 'idle';
        e.t = e.think;
        e.juggles = 0;
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
        G.shots.push(makeShot(e.x + e.face * 16, e.y, e.face, e.spec.shooter ? 'gun' : 'star'));
        if (e.spec.shooter) audio.shot();
        else audio.dart();
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
    const meleeR = (e.spec.thrower || e.spec.shooter) ? 32 : e.spec.range;
    const inMelee = Math.abs(dx) < meleeR && Math.abs(dy) < 16;

    if (e.t <= 0) {
      if (e.kind === 'don' && e.cool <= 0) {
        let guards = 0;
        let gi;
        for (gi = 0; gi < G.enemies.length; gi++) {
          if (!G.enemies[gi].dead && G.enemies[gi].pack === -3) guards += 1;
        }
        if (guards < (denser() ? 3 : 2)) {
          const gk = Math.random() < 0.55 ? 'star' : 'punk';
          const ge = makeFoe(gk, e.x - e.face * 70, clamp(e.y + rand(-18, 18), BELT_TOP, BELT_BOT), denser() ? 1.16 : 1, denser() ? 1.12 : 1);
          ge.pack = -3;
          G.enemies.push(ge);
          e.cool = 2.6;
          e.t = e.think;
          if (G.mode === 'play') toast('打手增援', true, false);
          return;
        }
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
        e.cool = e.spec.shooter ? 1.1 : 1.35;
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
      if (!p || G.deadT > 0 || G.invuln > 0 || armored(p)) continue;
      if (Math.abs(s.y - p.y) > 12) continue;
      if (Math.abs(s.x - p.x) > 12) continue;
      G.shots.splice(i, 1);
      burst(p.x, p.y - 16, 8, s.kind === 'gun' ? GOLD : MAG, 130, 0.24);
      hitStop(0.05);
      hurtPlayer(s.kind === 'gun' ? 16 : 12, s.face, s.kind === 'gun' ? '中弹了' : '中星镖了');
    }
  }

  function tickDrops(dt) {
    let i, d, p;
    p = G.player;
    for (i = G.drops.length - 1; i >= 0; i--) {
      d = G.drops[i];
      d.bob += dt * 3;
      if (!p || G.deadT > 0 || G.mode !== 'play') continue;
      if (Math.abs(d.x - p.x) < 16 && Math.abs(d.y - p.y) < 14) {
        if (d.kind === 'star') {
          addEnergy(1);
          audio.star();
          toast('星能', false, true);
          pop(d.x, d.y - 20, '+星', CYN);
          burst(d.x, d.y - 8, 12, CYN, 100, 0.3);
        } else {
          p.hp = Math.min(p.maxHp, p.hp + 28);
          G.hp = p.hp;
          addEnergy(0.35);
          audio.food();
          toast('烤鸡', false, true);
          pop(d.x, d.y - 20, '+HP', GOLD);
          burst(d.x, d.y - 8, 10, GOLD, 90, 0.3);
        }
        pickupKick();
        G.drops.splice(i, 1);
        G.hudDirty = true;
      }
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
      out.push([f[0] === 'star' ? 'punk' : f[0], f[1] + 36, y]);
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
    const hpMul = denser() ? 1.16 : 1;
    const spdMul = denser() ? 1.1 : 1;
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
    G.player.hp = keep ? Math.min(HP_MAX, hp + 12) : HP_MAX;
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
    G.kind = G.kind || 'street';
    G.stage = 1;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.lives = LIVES;
    G.energy = 2;
    G.won = false;
    G.why = '';
    setModes(G.kind);
    loadStage(1, false);
    G.arenaR = G.levelW - 8;
    G.player.x = 140;
    G.player.y = 272;
    const d1 = makeFoe('punk', 280, 260, 1, 1);
    const d2 = makeFoe('star', 360, 300, 1, 1);
    G.enemies = [d1, d2];
    panel.classList.remove('win', 'lose');
    ovKicker.textContent = 'SOR4';
    ovTitle.textContent = '怒四';
    ovLead.innerHTML = '沿街清场。出拳三连末击打浮空，空中再打可连浮。星冲打飞，星砸砸地。<br />打穿三关，最后是罪主。';
    ovOps.textContent = OPS;
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    showOverlay();
    setHint('走出拳 · 浮空连打 · 星冲打飞 · 星砸砸地 · 血空丢命');
    G.hudDirty = true;
    try { btnStreet.focus(); } catch (e) { /* ignore */ }
  }

  function startRun(kind) {
    G.kind = kind === 'core' ? 'core' : 'street';
    setModes(G.kind);
    G.mode = 'play';
    G.stage = 1;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.lives = LIVES;
    G.energy = 2;
    G.nextLife = LIFE_EVERY;
    G.won = false;
    G.why = '';
    G.deadT = 0;
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(G.kind === 'core' ? '怒核' : '怒四', false, G.kind === 'core');
    setHint(G.kind === 'core' ? '怒核更密 · 空格拳 · 双击星冲 · Shift 星砸' : '空格出拳 · 末击浮空 · 双击星冲 · Shift 星砸');
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
    ovTitle.textContent = win ? (G.kind === 'core' ? '核清了' : '罪殿清了') : (G.why || '被打倒了');
    const extra = '第 ' + G.stage + ' 关 · ';
    ovLead.textContent = extra + G.score + ' 分 · 连击最高 ×' + G.maxCombo + (G.score >= G.best && G.score > 0 ? ' · 新纪录' : '');
    ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
    ovStart.classList.add('gone');
    ovEnd.classList.remove('gone');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = win ? '怒核' : '换模式';
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
    hintEl.classList.remove('warn', 'hot');
    if (G.mode === 'title') startRun('street');
    else startRun(G.kind);
  }

  function tickDemo(dt) {
    const p = G.player;
    if (!p) return;
    p.step += dt;
    if (p.act === 'blitz' || p.act === 'punch' || p.act === 'special') {
      p.punchBuf = 0;
      p.specBuf = 0;
      p.blitzBuf = 0;
      tickPlayer(dt);
    } else {
      p.face = 1;
      p.x += 42 * dt;
      if (p.x > 430) p.x = 90;
      p.y = 272 + Math.sin(G.clock * 1.4) * 6;
      p.act = 'walk';
      const beat = (G.clock * 0.85) | 0;
      const prev = ((G.clock - dt) * 0.85) | 0;
      if (beat !== prev) {
        if (beat % 5 === 4) startSpecial(p);
        else if (beat % 5 === 2) startBlitz(p, 1);
        else startPunch(p);
      }
    }
    let i;
    for (i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.dead && e.deadT <= 0 && e.act !== 'air') {
        G.enemies[i] = makeFoe(e.kind, 380 + i * 70, 250 + i * 30, 1, 1);
        continue;
      }
      tickFoe(e, dt);
    }
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
      if (G.enemies[i].dead && G.enemies[i].deadT <= 0 && G.enemies[i].act !== 'air') G.enemies.splice(i, 1);
    }
    tickShots(dt);
    tickDrops(dt);
    tickPacks();
    tickCamera(dt);
    tickClear(dt);
    if (anyAir()) G.hudDirty = true;
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
  function starPath(x, y, r) {
    let i, ang, rr;
    ctx.beginPath();
    for (i = 0; i < 10; i++) {
      ang = -Math.PI / 2 + i * Math.PI / 5;
      rr = i % 2 === 0 ? r : r * 0.42;
      if (i === 0) ctx.moveTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
      else ctx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
    }
    ctx.closePath();
  }

  function drawSky() {
    let g;
    if (G.theme === 'harbor') {
      g = ctx.createLinearGradient(0, oy, 0, oy + 210 * scale);
      g.addColorStop(0, '#061018');
      g.addColorStop(1, '#0c2430');
    } else if (G.theme === 'palace') {
      g = ctx.createLinearGradient(0, oy, 0, oy + 210 * scale);
      g.addColorStop(0, '#120814');
      g.addColorStop(1, '#241028');
    } else {
      g = ctx.createLinearGradient(0, oy, 0, oy + 210 * scale);
      g.addColorStop(0, '#100818');
      g.addColorStop(1, '#1c1028');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
    ctx.fillStyle = rgba(G.theme === 'palace' ? MAG : GOLD, G.theme === 'palace' ? 0.14 : 0.22);
    ctx.beginPath();
    ctx.arc(wx(G.camX * 0.16 + 500), wy(42), 18 * scale, 0, TAU);
    ctx.fill();
  }

  function drawBuildings() {
    const start = Math.floor((G.camX * 0.34) / 70) - 1;
    let i, hsh, bx, bw, bh, win, c, neon, px, py;
    for (i = start; i < start + 16; i++) {
      hsh = hash2(i * 17 + (G.theme === 'harbor' ? 7 : G.theme === 'palace' ? 13 : 5));
      bx = i * 70 - G.camX * 0.34;
      bw = 48 + hsh * 28;
      bh = 72 + hsh * 88;
      if (G.theme === 'harbor') {
        ctx.fillStyle = '#0e1820';
        ctx.fillRect(wx(G.camX + bx), wy(210 - bh * 0.55), bw * scale, bh * 0.55 * scale);
        ctx.fillStyle = '#c45a28';
        ctx.fillRect(wx(G.camX + bx + 6), wy(210 - bh * 0.28), (bw - 12) * scale, bh * 0.22 * scale);
        ctx.strokeStyle = 'rgba(0, 232, 255, 0.22)';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(wx(G.camX + bx + bw * 0.15), wy(210 - bh * 0.55));
        ctx.lineTo(wx(G.camX + bx + bw * 0.15), wy(70));
        ctx.lineTo(wx(G.camX + bx + bw * 0.7), wy(86));
        ctx.stroke();
      } else if (G.theme === 'palace') {
        ctx.fillStyle = '#1a0c1c';
        ctx.fillRect(wx(G.camX + bx), wy(210 - bh), bw * scale, bh * scale);
        ctx.fillStyle = rgba(GOLD, 0.18);
        ctx.fillRect(wx(G.camX + bx + bw * 0.18), wy(210 - bh), 6 * scale, bh * scale);
        ctx.fillRect(wx(G.camX + bx + bw * 0.7), wy(210 - bh), 6 * scale, bh * scale);
        ctx.fillStyle = rgba(MAG, 0.22);
        ctx.fillRect(wx(G.camX + bx + 10), wy(210 - bh + 16), (bw - 20) * scale, 10 * scale);
      } else {
        ctx.fillStyle = '#160c1c';
        ctx.fillRect(wx(G.camX + bx), wy(210 - bh), bw * scale, bh * scale);
        ctx.fillStyle = '#241428';
        ctx.fillRect(wx(G.camX + bx + 6), wy(210 - bh + 10), (bw - 12) * scale, 22 * scale);
        for (win = 0; win < 6; win++) {
          c = hash2(i + win * 3) < 0.33 ? MAG : (hash2(i + win) < 0.5 ? GOLD : CYN);
          ctx.fillStyle = rgba(c, 0.38 + 0.22 * Math.sin(G.clock * 2.2 + win));
          px = wx(G.camX + bx + 8 + (win % 3) * 12);
          py = wy(210 - bh + 14 + Math.floor(win / 3) * 10);
          ctx.fillRect(px, py, 8 * scale, 7 * scale);
        }
        if (hsh > 0.55) {
          neon = hsh > 0.78 ? MAG : GOLD;
          ctx.fillStyle = rgba(neon, 0.6);
          ctx.fillRect(wx(G.camX + bx + 8), wy(210 - bh - 10), 24 * scale, 6 * scale);
        }
      }
    }
    if (G.theme === 'harbor') {
      ctx.fillStyle = 'rgba(12, 40, 56, 0.55)';
      ctx.fillRect(ox, wy(178), VW * scale, 36 * scale);
      ctx.strokeStyle = 'rgba(0, 232, 255, 0.16)';
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.moveTo(ox, wy(192 + Math.sin(G.clock * 1.4) * 2.4));
      ctx.lineTo(ox + VW * scale, wy(192 + Math.sin(G.clock * 1.4 + 1.2) * 2.4));
      ctx.stroke();
    }
    if (G.theme === 'palace') {
      ctx.fillStyle = 'rgba(48, 16, 48, 0.32)';
      ctx.fillRect(ox, wy(164), VW * scale, 48 * scale);
      ctx.fillStyle = rgba(GOLD, 0.14);
      ctx.fillRect(ox, wy(164), VW * scale, 3 * scale);
    }
  }

  function drawStreet() {
    const g = ctx.createLinearGradient(0, wy(BELT_TOP - 18), 0, wy(VH));
    g.addColorStop(0, G.theme === 'palace' ? '#1c1018' : G.theme === 'harbor' ? '#14181c' : '#18101c');
    g.addColorStop(0.35, '#121016');
    g.addColorStop(1, '#0a060c');
    ctx.fillStyle = g;
    ctx.fillRect(ox, wy(BELT_TOP - 18), VW * scale, (VH - (BELT_TOP - 18)) * scale);

    ctx.fillStyle = G.theme === 'harbor' ? '#243038' : G.theme === 'palace' ? '#3a2430' : '#2a1830';
    ctx.fillRect(ox, wy(BELT_TOP - 18), VW * scale, 8 * scale);
    ctx.fillStyle = rgba(G.theme === 'palace' ? MAG : HOT, 0.22);
    ctx.fillRect(ox, wy(BELT_TOP - 12), VW * scale, 2 * scale);

    ctx.fillStyle = '#0c0810';
    ctx.fillRect(ox, wy(BELT_BOT + 6), VW * scale, 8 * scale);
    ctx.fillStyle = rgba(G.theme === 'harbor' ? CYN : HOT, 0.3);
    ctx.fillRect(ox, wy(BELT_BOT + 4), VW * scale, 2 * scale);

    const x0 = Math.floor(G.camX / 80) * 80;
    let x;
    ctx.strokeStyle = G.theme === 'harbor' ? 'rgba(0, 232, 255, 0.12)' : 'rgba(255, 227, 107, 0.12)';
    ctx.lineWidth = 2 * scale;
    ctx.setLineDash([12 * scale, 16 * scale]);
    ctx.beginPath();
    ctx.moveTo(wx(x0 - 80), wy((BELT_TOP + BELT_BOT) * 0.5));
    ctx.lineTo(wx(x0 + VW + 80), wy((BELT_TOP + BELT_BOT) * 0.5));
    ctx.stroke();
    ctx.setLineDash([]);

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
      const glow = G.theme === 'harbor' ? CYN : (G.theme === 'palace' ? MAG : GOLD);
      ctx.fillStyle = rgba(glow, 0.12);
      ctx.beginPath();
      ctx.arc(wx(lampX + 2), wy(124), 22 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(glow, 0.55);
      ctx.beginPath();
      ctx.arc(wx(lampX + 2), wy(120), 5 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawDrop(d) {
    const x = wx(d.x);
    const y = wy(d.y - 6 - Math.sin(d.bob) * 3);
    const s = scale;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(wx(d.x), wy(d.y), 8 * s, 3 * s, 0, 0, TAU);
    ctx.fill();
    if (d.kind === 'star') {
      ctx.fillStyle = rgba(GOLD, 1);
      starPath(x, y, 7 * s);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.9);
      starPath(x, y, 3.2 * s);
      ctx.fill();
      return;
    }
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.beginPath();
    ctx.ellipse(x, y, 7 * s, 5 * s, -0.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(APPLE, 0.95);
    ctx.fillRect(x + 2 * s, y - 7 * s, 2.2 * s, 6 * s);
    ctx.fillStyle = rgba(LEAF, 0.9);
    ctx.beginPath();
    ctx.ellipse(x + 5 * s, y - 6 * s, 3 * s, 1.6 * s, -0.6, 0, TAU);
    ctx.fill();
  }

  function drawShot(s) {
    const x = wx(s.x);
    const y = wy(s.y - 18);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s.face, 1);
    if (s.kind === 'gun') {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fillRect(0, -2 * scale, 12 * scale, 4 * scale);
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.beginPath();
      ctx.arc(0, 0, 3 * scale, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(GOLD, 0.95);
      starPath(4 * scale, 0, 7 * scale);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.85);
      starPath(0, 0, 3.2 * scale);
      ctx.fill();
    }
    ctx.restore();
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

    const walk = (e.act === 'walk' || e.act === 'charge' || e.act === 'blitz') ? Math.sin(e.step * 2.2) : 0;
    const punch = e.act === 'punch';
    const spec = e.act === 'special';
    const dash = e.act === 'blitz';
    const hurt = e.act === 'hurt';
    const down = e.act === 'down';
    const air = e.act === 'air';
    let bodyY = -16 * s;
    if (down) {
      ctx.rotate(-1.15);
      bodyY = -8 * s;
    } else if (air) {
      ctx.rotate(-0.85);
      bodyY = -10 * s;
    } else if (hurt) {
      ctx.rotate(-0.18);
    } else if (spec) {
      ctx.rotate(-0.42);
      bodyY = -20 * s;
    } else if (dash) {
      ctx.rotate(-0.28);
      bodyY = -18 * s;
    }

    if (e.flashT > 0) ctx.globalAlpha = 0.55 + 0.45 * Math.sin(G.clock * 40);

    ctx.fillStyle = rgba(look.pants, 1);
    if (!down && !air) {
      ctx.fillRect(-6 * s + walk * 3 * s, spec ? -14 * s : -10 * s, 4.2 * s, spec ? 10 * s : 12 * s);
      ctx.fillRect(1.4 * s - walk * 3 * s, spec ? -14 * s : -10 * s, 4.2 * s, spec ? 10 * s : 12 * s);
    } else {
      ctx.fillRect(-10 * s, -6 * s, 14 * s, 5 * s);
    }
    ctx.fillStyle = dash ? rgba(GOLD, 0.85) : '#2a2430';
    if (!down && !air) {
      ctx.fillRect(-6.2 * s + walk * 3 * s, spec ? -6 * s : 0, 4.4 * s, 3 * s);
      ctx.fillRect(1.2 * s - walk * 3 * s, spec ? -6 * s : 0, 4.4 * s, 3 * s);
    }

    ctx.fillStyle = rgba(look.jacket, 1);
    rr(-8 * s, bodyY - 2 * s, 16 * s, 14 * s, 3 * s);
    ctx.fill();
    ctx.fillStyle = rgba(look.accent, 0.75);
    ctx.fillRect(-2 * s, bodyY, 4 * s, 10 * s);

    const armY = bodyY + 2 * s;
    ctx.fillStyle = rgba(look.skin, 1);
    if (punch) {
      ctx.fillRect(6 * s, armY - (e.comboStep === 2 ? 8 : 3) * s, 14 * s, 4.2 * s);
      ctx.fillRect(-10 * s, armY + 2 * s, 7 * s, 3.4 * s);
      if (e.kind === 'player' && e.comboStep === 2) {
        ctx.fillStyle = rgba(GOLD, 0.9);
        starPath(20 * s, armY - 8 * s, 5 * s);
        ctx.fill();
      }
    } else if (spec) {
      ctx.fillRect(4 * s, armY - 12 * s, 5 * s, 12 * s);
      ctx.fillRect(-10 * s, armY - 10 * s, 5 * s, 10 * s);
      ctx.fillStyle = rgba(GOLD, 0.95);
      starPath(8 * s, armY - 16 * s, 7 * s);
      ctx.fill();
      starPath(-8 * s, armY - 12 * s, 5 * s);
      ctx.fill();
    } else if (dash) {
      ctx.fillRect(8 * s, armY - 2 * s, 16 * s, 3.6 * s);
      ctx.fillRect(-10 * s, armY + 2 * s, 7 * s, 3.2 * s);
      ctx.fillStyle = rgba(GOLD, 0.9);
      starPath(24 * s, armY, 6 * s);
      ctx.fill();
    } else {
      ctx.fillRect(5 * s, armY + walk * 2 * s, 4 * s, 9 * s);
      ctx.fillRect(-9 * s, armY - walk * 2 * s, 4 * s, 9 * s);
    }

    ctx.fillStyle = rgba(look.skin, 1);
    ctx.beginPath();
    ctx.arc(0, bodyY - 8 * s, 6.2 * s, 0, TAU);
    ctx.fill();

    if (look.hairStyle === 'mohawk') {
      ctx.fillStyle = rgba(look.hair, 1);
      ctx.fillRect(-1.6 * s, bodyY - 18 * s, 3.2 * s, 10 * s);
    } else if (look.hairStyle === 'crop') {
      ctx.fillStyle = rgba(look.hair, 1);
      ctx.beginPath();
      ctx.ellipse(-0.4 * s, bodyY - 10 * s, 6.2 * s, 3.8 * s, -0.12, 0, TAU);
      ctx.fill();
      ctx.fillRect(-6 * s, bodyY - 10 * s, 12 * s, 3 * s);
    } else if (look.hairStyle === 'visor') {
      ctx.fillStyle = rgba(STEEL, 1);
      rr(-6.6 * s, bodyY - 14 * s, 13.2 * s, 9 * s, 2.4 * s);
      ctx.fill();
      ctx.fillStyle = rgba(look.accent, 0.95);
      ctx.fillRect(-5.2 * s, bodyY - 10.4 * s, 10.4 * s, 3.2 * s);
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

    ctx.fillStyle = look.hairStyle === 'visor' ? rgba(MAG, 0.9) : '#1a1014';
    ctx.fillRect(1.4 * s, bodyY - 9 * s, 2.2 * s, 2.2 * s);

    if (e.boss) {
      ctx.strokeStyle = rgba(GOLD, 0.5);
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.arc(0, bodyY - 8 * s, 8 * s, 0, TAU);
      ctx.stroke();
    }

    if (spec && e.kind === 'player') {
      ctx.fillStyle = rgba(GOLD, 0.45);
      starPath(0, bodyY - 4 * s, 16 * s);
      ctx.fill();
    }
    if (air && e.juggles > 0) {
      ctx.fillStyle = rgba(CYN, 0.55);
      starPath(10 * s, bodyY - 16 * s, 4 * s);
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
    ctx.fillText(e.spec.name, x + w / 2, y + 7 * scale);
  }

  function drawIntro() {
    if (G.intro <= 0 || G.mode !== 'play') return;
    const t = clamp(G.intro / 0.9, 0, 1);
    const a = t > 0.3 ? 1 : t / 0.3;
    const name = stageAt(G.stage - 1).name;
    ctx.fillStyle = 'rgba(10,8,20,' + (0.55 * a) + ')';
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
    ctx.fillText(G.kind === 'core' ? '怒核' : (G.boss ? G.boss.spec.name : '清街'), ox + 320 * scale, oy + 158 * scale);
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
    ctx.fillStyle = '#070610';
    ctx.fillRect(0, 0, W, H);

    const shx = (G.shake ? (Math.random() - 0.5) * G.shake : 0) + G.kickX;
    const shy = (G.shake ? (Math.random() - 0.5) * G.shake * 0.55 : 0) + G.kickY;
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();
    ctx.translate(shx, shy);

    drawSky();
    drawBuildings();
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
        drawFighter(list[i].o, lookOf(list[i].o.kind), { blink: false });
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
  function noteTap(dir) {
    if (!G.player) {
      lastTapDir = dir;
      lastTapT = G.clock;
      return;
    }
    if (inputOk() && lastTapDir === dir && (G.clock - lastTapT) <= BLITZ_WIN) {
      G.player.blitzBuf = 0.12;
      G.player.face = dir;
    }
    lastTapDir = dir;
    lastTapT = G.clock;
  }

  function consumeEdges() {
    punchEdge.down = keys.punch && !punchEdge.was;
    specEdge.down = keys.spec && !specEdge.was;
    blitzEdge.down = keys.blitz && !blitzEdge.was;
    if (keys.l && !dirEdge.lWas) noteTap(-1);
    if (keys.r && !dirEdge.rWas) noteTap(1);
    dirEdge.lWas = keys.l;
    dirEdge.rWas = keys.r;
    if (punchEdge.down && G.player) G.player.punchBuf = 0.12;
    if (specEdge.down && G.player) G.player.specBuf = 0.12;
    if (blitzEdge.down && G.player) G.player.blitzBuf = 0.12;
    punchEdge.was = keys.punch;
    specEdge.was = keys.spec;
    blitzEdge.was = keys.blitz;
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const specKey = code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyZ' || code === 'KeyK'
      || k === 'z' || k === 'Z' || k === 'k' || k === 'K';
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (space || k === 'j' || k === 'J') keys.punch = down;
    if (specKey) keys.spec = down;
    if (k === 'x' || k === 'X' || k === 'c' || k === 'C') keys.blitz = down;

    if (down && (isMove || space || k === 'Enter' || specKey || k === 'x' || k === 'X' || k === 'c' || k === 'C')) e.preventDefault();
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
          startRun('street');
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
  bindHold(document.getElementById('btn-spec'), function (v) { keys.spec = v; });
  bindHold(document.getElementById('btn-blitz'), function (v) { keys.blitz = v; });

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
  btnStreet.addEventListener('click', function () {
    audio.ensure();
    startRun('street');
  });
  btnCore.addEventListener('click', function () {
    audio.ensure();
    startRun('core');
  });
  modeStreet.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') { setModes('street'); G.kind = 'street'; return; }
    startRun('street');
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
