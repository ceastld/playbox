'use strict';

/* 终斗 — Final Fight 2 remake. No CDN. Distinct from 怒街 / 怒二 / 怒三. */

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
  const COMBO_WIN = 1.4;
  const BELT_TOP = 222;
  const BELT_BOT = 322;
  const WALK_X = 186;
  const WALK_Y = 118;
  const INVULN = 1.35;
  const DIE_T = 0.8;
  const HURT_T = 0.36;
  const GRAB_RANGE = 24;
  const BEST_KEY = 'playbox-final-fight2-best';
  const MUTE_KEY = 'playbox-final-fight2-mute';
  const OPS = '方向键 / WASD 走 · 空格出拳 · Shift / Z 旋扫 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 100, 24];
  const HOT2 = [255, 149, 80];
  const WHT = [246, 240, 234];
  const LEAF = [61, 255, 122];
  const SKIN = [232, 192, 144];
  const PUR = [180, 74, 208];
  const APPLE = [220, 48, 52];
  const WOOD = [168, 98, 42];

  const COMBO_PUNCH = [
    { dmg: 8, range: 34, dur: 0.15, hit0: 0.04, hit1: 0.12, kb: 70, stop: 0.04 },
    { dmg: 12, range: 38, dur: 0.17, hit0: 0.04, hit1: 0.13, kb: 90, stop: 0.05 },
    { dmg: 16, range: 44, dur: 0.3, hit0: 0.05, hit1: 0.18, kb: 160, stop: 0.072, stun: true }
  ];
  const SPEC_ATK = {
    dmg: 20, range: 52, dur: 0.48, kb: 190, stop: 0.08,
    wave: [
      { a: 0.06, b: 0.16 },
      { a: 0.26, b: 0.4 }
    ]
  };
  const KNEE_HIT = { dmg: 10, kb: 20, stop: 0.05 };
  const SLAM_HIT = { dmg: 22, kb: 40, stop: 0.08 };
  const WAVE_HIT = { dmg: 12, kb: 140, stop: 0.055, range: 58 };

  const FOES = {
    punk: {
      hp: 26, spd: 84, dmg: 11, range: 28, score: 180, w: 16, h: 30,
      think: 0.5, punchDur: 0.3, name: '痞子'
    },
    kunai: {
      hp: 22, spd: 90, dmg: 10, range: 88, score: 240, w: 15, h: 29,
      think: 0.68, punchDur: 0.34, name: '苦无', thrower: true
    },
    andore: {
      hp: 52, spd: 60, dmg: 17, range: 34, score: 340, w: 22, h: 38,
      think: 0.64, punchDur: 0.42, name: '安多', heavy: true
    },
    biker: {
      hp: 40, spd: 132, dmg: 15, range: 34, score: 280, w: 18, h: 32,
      think: 0.4, punchDur: 0.28, name: '飞车', charge: true
    },
    wonwon: {
      hp: 170, spd: 78, dmg: 19, range: 40, score: 4200, w: 24, h: 42,
      think: 0.4, punchDur: 0.38, name: '旺旺', boss: true, heavy: true
    },
    freddie: {
      hp: 230, spd: 116, dmg: 18, range: 38, score: 5400, w: 20, h: 38,
      think: 0.32, punchDur: 0.3, name: '弗雷迪', boss: true, charge: true
    },
    retu: {
      hp: 310, spd: 90, dmg: 20, range: 94, score: 9200, w: 22, h: 42,
      think: 0.36, punchDur: 0.34, name: '雷图', boss: true, shooter: true
    }
  };

  const STAGES = [
    {
      name: '香港', boss: '旺旺', w: 1980, theme: 'hongkong', bossKind: 'wonwon',
      packs: [
        { x: 200, gate: 480, foes: [['punk', 260, 262], ['punk', 340, 284]] },
        { x: 520, gate: 840, foes: [['punk', 560, 258], ['kunai', 660, 278], ['punk', 740, 268]] },
        { x: 880, gate: 1220, foes: [['punk', 920, 260], ['biker', 1020, 276], ['kunai', 1140, 254]] },
        { x: 1280, gate: 1600, foes: [['andore', 1320, 258], ['punk', 1420, 282], ['kunai', 1520, 264]] }
      ],
      drops: [[420, 268, 'food'], [980, 250, 'food'], [1400, 274, 'food']],
      barrels: [[480, 270], [900, 256], [1480, 280]]
    },
    {
      name: '巴黎', boss: '弗雷迪', w: 2180, theme: 'paris', bossKind: 'freddie',
      packs: [
        { x: 180, gate: 500, foes: [['biker', 240, 262], ['punk', 340, 284]] },
        { x: 540, gate: 900, foes: [['andore', 580, 260], ['biker', 700, 278], ['kunai', 800, 256]] },
        { x: 940, gate: 1300, foes: [['punk', 980, 258], ['biker', 1080, 276], ['andore', 1180, 286], ['kunai', 1260, 254]] },
        { x: 1360, gate: 1760, foes: [['biker', 1400, 258], ['andore', 1500, 282], ['punk', 1600, 264], ['biker', 1700, 276]] }
      ],
      drops: [[400, 270, 'food'], [860, 252, 'food'], [1280, 288, 'food'], [1640, 264, 'food']],
      barrels: [[460, 266], [1100, 252], [1560, 278]]
    },
    {
      name: '罗马', boss: '雷图', w: 2380, theme: 'rome', bossKind: 'retu',
      packs: [
        { x: 160, gate: 500, foes: [['punk', 220, 262], ['biker', 320, 280], ['kunai', 400, 256]] },
        { x: 540, gate: 920, foes: [['andore', 580, 256], ['biker', 680, 278], ['punk', 780, 264], ['kunai', 860, 272]] },
        { x: 980, gate: 1400, foes: [['punk', 1020, 258], ['andore', 1120, 274], ['biker', 1220, 286], ['kunai', 1320, 254]] },
        { x: 1460, gate: 1920, foes: [['biker', 1500, 258], ['andore', 1600, 282], ['punk', 1700, 264], ['biker', 1800, 276], ['kunai', 1880, 256]] }
      ],
      drops: [[380, 268, 'food'], [760, 250, 'food'], [1180, 290, 'food'], [1540, 262, 'food'], [1780, 278, 'food']],
      barrels: [[440, 270], [980, 254], [1360, 282], [1720, 266]]
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

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (ENERGY_COST !== 1) throw new Error('energy cost');
    if (ENERGY_MAX !== 3) throw new Error('energy max');
    if (COMBO_PUNCH.length !== 3) throw new Error('3 punch');
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(2) !== 1) throw new Error('combo 2');
    if (comboMul(3) !== 2) throw new Error('combo 3');
    if (comboMul(9) !== 5) throw new Error('combo cap');
    if (BELT_BOT - BELT_TOP < 80) throw new Error('belt');
    if (!FOES.punk || !FOES.kunai || !FOES.andore || !FOES.biker) throw new Error('foes');
    if (!FOES.wonwon || !FOES.freddie || !FOES.retu) throw new Error('bosses');
    if (!FOES.kunai.thrower) throw new Error('kunai throw');
    if (!FOES.biker.charge) throw new Error('biker charge');
    if (!FOES.retu.shooter) throw new Error('retu shoot');
    if (FOES.wonwon.hp >= FOES.freddie.hp || FOES.freddie.hp >= FOES.retu.hp) throw new Error('boss hp');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (BEST_KEY !== 'playbox-final-fight2-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-final-fight2-mute') throw new Error('mute key');
    if (SPEC_ATK.range <= COMBO_PUNCH[2].range) throw new Error('spec range');
    if (GRAB_RANGE >= COMBO_PUNCH[0].range) throw new Error('grab closer than jab');
    if (SPEC_ATK.wave.length !== 2) throw new Error('spin two waves');
    if (SLAM_HIT.stop < 0.07) throw new Error('slam stop');
    if (WAVE_HIT.range <= GRAB_RANGE) throw new Error('shockwave');
    let i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.packs.length || !s.drops.length || !s.bossKind || !s.barrels.length) throw new Error('stage ' + s.name);
    }
    if (STAGES[0].theme !== 'hongkong' || STAGES[1].theme !== 'paris' || STAGES[2].theme !== 'rome') {
      throw new Error('cities');
    }
    if (STAGES[0].bossKind !== 'wonwon' || STAGES[2].bossKind !== 'retu') throw new Error('crime-boss last');
    if (STAGES[0].name === '闹市' || STAGES[0].name === '霓虹街' || STAGES[0].name === '船坞') {
      throw new Error('not neighbor streets');
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

  const keys = { l: false, r: false, u: false, d: false, punch: false, spec: false };
  const punchEdge = { down: false, was: false };
  const specEdge = { down: false, was: false };

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
    levelW: 1980,
    theme: 'hongkong',
    packs: [],
    enemies: [],
    drops: [],
    shots: [],
    barrels: [],
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
      this.noise(0.07, 0.07, 1200, 'highpass');
      this.beep(210, 0.05, 'sawtooth', 0.03, 80);
    },
    hit: function (combo, heavy) {
      this.ensure();
      const p = 1 + Math.min(6, combo) * 0.06;
      this.noise(0.12, heavy ? 0.2 : 0.14, 220, 'lowpass');
      this.beep(170 * p, 0.1, 'square', 0.08, 58);
      this.beep((heavy ? 920 : 680) * p, 0.07, 'triangle', 0.05, 400 * p);
      if (heavy) this.beep(1240 * p, 0.09, 'square', 0.04, 1600 * p);
    },
    special: function () {
      this.ensure();
      this.noise(0.3, 0.22, 160, 'lowpass');
      this.beep(150, 0.24, 'sawtooth', 0.09, 48);
      this.beep(480, 0.18, 'square', 0.07, 920);
      this.beep(760, 0.22, 'triangle', 0.05, 1480);
    },
    grab: function () {
      this.ensure();
      this.beep(240, 0.06, 'square', 0.04, 150);
      this.noise(0.06, 0.06, 380, 'lowpass');
    },
    slam: function () {
      this.ensure();
      this.noise(0.16, 0.2, 120, 'lowpass');
      this.beep(90, 0.16, 'square', 0.08, 36);
      this.beep(220, 0.1, 'sawtooth', 0.05, 70);
    },
    barrel: function () {
      this.ensure();
      this.noise(0.1, 0.12, 480, 'bandpass');
      this.beep(180, 0.08, 'square', 0.04, 70);
    },
    crash: function () {
      this.ensure();
      this.noise(0.18, 0.2, 160, 'lowpass');
      this.beep(90, 0.16, 'square', 0.07, 40);
    },
    food: function () {
      this.ensure();
      this.beep(392, 0.07, 'sine', 0.05, 523);
      this.beep(523, 0.1, 'triangle', 0.045, 784);
    },
    knife: function () {
      this.ensure();
      this.noise(0.06, 0.06, 2000, 'highpass');
      this.beep(1100, 0.05, 'square', 0.03, 620);
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
      x: e.x, y: e.y, h: e.h, face: e.face, t: 0.22,
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
      const held = !!(p && p.grab);
      grabLabel.textContent = held ? (p.grabHits >= 2 ? '抱摔' : '抱住') : '徒手';
      grabLabel.classList.toggle('grab', held);
      grabLabel.classList.toggle('hot', !held);
    }
    if (tagLabel) {
      tagLabel.textContent = G.kind === 'core' ? '斗核' : '终斗';
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
      vx: 0, vy: 0,
      face: 1,
      hp: HP_MAX,
      maxHp: HP_MAX,
      act: 'idle',
      t: 0,
      step: 0,
      punch: 0,
      comboStep: 0,
      hit: false,
      hit2: false,
      punchBuf: 0,
      specBuf: 0,
      stun: 0,
      grab: null,
      grabHits: 0,
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
      vx: 0, vy: 0,
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
  function makeBarrel(x, y) {
    return { x: x, y: y, hp: 1, dead: false, bob: rand(0, TAU) };
  }
  function makeShot(x, y, face, kind) {
    return {
      x: x, y: y, face: face,
      vx: face * (kind === 'gun' ? 340 : 310),
      life: kind === 'gun' ? 0.85 : 0.74,
      spin: 0,
      kind: kind || 'kunai',
      from: 'foe'
    };
  }

  function lookOf(kind) {
    if (kind === 'player') {
      return { jacket: PUR, pants: [36, 22, 48], hair: [22, 16, 20], skin: SKIN, accent: CYN, hairStyle: 'maki', size: 1 };
    }
    if (kind === 'punk') {
      return { jacket: HOT, pants: [36, 28, 32], hair: MAG, skin: SKIN, accent: GOLD, hairStyle: 'mohawk', size: 1 };
    }
    if (kind === 'kunai') {
      return { jacket: [48, 28, 72], pants: [32, 22, 40], hair: [28, 16, 22], skin: [228, 176, 140], accent: MAG, hairStyle: 'pony', size: 0.96 };
    }
    if (kind === 'andore') {
      return { jacket: [200, 110, 60], pants: [40, 28, 28], hair: [28, 18, 16], skin: [196, 140, 108], accent: GOLD, hairStyle: 'bald', size: 1.28 };
    }
    if (kind === 'biker') {
      return { jacket: [28, 24, 34], pants: [20, 18, 26], hair: [18, 16, 20], skin: [210, 160, 120], accent: HOT, hairStyle: 'helm', size: 1.04 };
    }
    if (kind === 'wonwon') {
      return { jacket: [220, 48, 40], pants: [36, 24, 28], hair: [24, 18, 16], skin: [200, 148, 112], accent: GOLD, hairStyle: 'bald', size: 1.32 };
    }
    if (kind === 'freddie') {
      return { jacket: [40, 90, 160], pants: [24, 28, 40], hair: MAG, skin: [214, 164, 128], accent: CYN, hairStyle: 'mohawk', size: 1.16 };
    }
    return { jacket: [32, 22, 28], pants: [18, 16, 20], hair: [12, 10, 12], skin: [176, 128, 100], accent: GOLD, hairStyle: 'slick', size: 1.26 };
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
  function hurtEnemy(e, dmg, kb, face, finisher, src) {
    if (e.dead) return;
    if (e.act === 'held' && src !== 'knee' && src !== 'slam') return;
    if (G.mode !== 'play') {
      e.hp -= dmg;
      e.stun = 0.22;
      if (e.act !== 'held') {
        e.act = e.hp <= 0 ? 'down' : 'hurt';
        e.t = e.hp <= 0 ? 0.45 : 0.22;
        e.vx = face * kb * 0.55;
      }
      e.flashT = 0.1;
      if (e.hp <= 0) {
        e.dead = true;
        e.deadT = 0.5;
        e.act = 'down';
      }
      return;
    }
    e.hp -= dmg;
    e.stun = finisher ? 0.6 : 0.22;
    e.flashT = 0.12;
    e.face = -face;
    if (e.act !== 'held') {
      e.act = e.hp <= 0 ? 'down' : 'hurt';
      e.t = e.hp <= 0 ? 0.55 : 0.3;
      e.vx = face * kb;
    }
    if (src !== 'knee') addEnergy(0.14);
    const mul = bumpCombo();
    const kill = Math.round(e.spec.score * mul);
    const chip = Math.max(12, Math.round((14 + dmg) * mul));
    if (e.hp <= 0) {
      e.dead = true;
      e.deadT = 0.64;
      e.act = 'down';
      if (G.player && G.player.grab === e) {
        G.player.grab = null;
        G.player.grabHits = 0;
      }
      bumpScore(kill);
      pop(e.x, e.y - 36, '+' + kill, GOLD);
      burst(e.x, e.y - 18, 18, e.kind === 'biker' ? CYN : MAG, 190, 0.44);
      spark(e.x, e.y - 20, GOLD, 8);
      if (e.boss) {
        burst(e.x, e.y - 24, 32, GOLD, 250, 0.58);
        flash(GOLD, 0.55);
        audio.ko();
      }
      maybeDrop(e);
    } else {
      bumpScore(chip);
      pop(e.x, e.y - 32, '+' + chip, WHT);
    }
    G.hudDirty = true;
  }

  function maybeDrop(e) {
    if (G.mode !== 'play') return;
    if (e.boss) {
      G.drops.push(makeDrop(e.x, e.y, 'food'));
      return;
    }
    if (Math.random() < 0.16) G.drops.push(makeDrop(e.x, e.y, 'food'));
  }

  function smashBarrel(b, fromX) {
    if (!b || b.dead) return;
    b.dead = true;
    audio.barrel();
    hitStop(0.045);
    shake(5);
    burst(b.x, b.y - 10, 16, WOOD, 160, 0.36);
    spark(b.x, b.y - 12, GOLD, 6);
    ringAt(b.x, b.y - 6, HOT);
    if (G.mode === 'play') {
      const mul = bumpCombo();
      const n = Math.round(80 * mul);
      bumpScore(n);
      pop(b.x, b.y - 24, '+' + n, GOLD);
      if (Math.random() < 0.72) G.drops.push(makeDrop(b.x, b.y, 'food'));
    }
    void fromX;
  }

  function smashBarrelsAt(x, y, range) {
    let i, b, n = 0;
    for (i = 0; i < G.barrels.length; i++) {
      b = G.barrels[i];
      if (b.dead) continue;
      if (Math.abs(b.x - x) > range) continue;
      if (Math.abs(b.y - y) > 20) continue;
      smashBarrel(b, x);
      n += 1;
    }
    return n;
  }

  function hurtPlayer(dmg, face, why) {
    const p = G.player;
    if (!p || G.invuln > 0 || p.act === 'special' || G.deadT > 0) return;
    if (G.mode !== 'play') return;
    if (p.grab) dropGrab(p);
    p.hp -= dmg;
    G.hp = p.hp;
    breakCombo();
    p.act = 'hurt';
    p.t = HURT_T;
    p.stun = HURT_T;
    p.vx = face * 160;
    p.punch = 0;
    p.comboStep = 0;
    G.invuln = 0.52;
    audio.hurt();
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
      if (p.grab) dropGrab(p);
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
    p.stun = 0;
    p.punch = 0;
    p.comboStep = 0;
    p.grab = null;
    p.grabHits = 0;
    G.deadT = 0;
    G.invuln = INVULN;
    G.hudDirty = true;
    toast('再上', false, true);
  }

  function dropGrab(p) {
    const e = p.grab;
    if (e && !e.dead) {
      e.act = 'hurt';
      e.t = 0.2;
      e.stun = 0.2;
    }
    p.grab = null;
    p.grabHits = 0;
    G.hudDirty = true;
  }

  function tryGrab(p) {
    let i, e, best = null, d, ad, bd = GRAB_RANGE + 8;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead || e.boss || e.act === 'held' || e.act === 'down') continue;
      if (e.stun <= 0 && e.act !== 'hurt') continue;
      if (!depthHit(p, e)) continue;
      d = (e.x - p.x) * p.face;
      ad = Math.abs(e.x - p.x);
      if (ad > GRAB_RANGE + 6) continue;
      if (d < -8 && ad > 18) continue;
      if (ad < bd) { bd = ad; best = e; }
    }
    if (!best) return false;
    if (best.x >= p.x) p.face = 1;
    else p.face = -1;
    p.grab = best;
    p.grabHits = 0;
    p.act = 'grab';
    p.t = 0.12;
    best.act = 'held';
    best.vx = 0;
    best.charge = 0;
    audio.grab();
    toast('抱住', false, true);
    G.hudDirty = true;
    return true;
  }

  function shockwave(p, skip) {
    let i, e, n = 0;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e === skip || e.dead || e.act === 'held') continue;
      if (Math.abs(e.y - p.y) > 26) continue;
      if (Math.abs(e.x - p.x) > WAVE_HIT.range) continue;
      hurtEnemy(e, WAVE_HIT.dmg, WAVE_HIT.kb, e.x >= p.x ? 1 : -1, true, 'wave');
      n += 1;
    }
    smashBarrelsAt(p.x, p.y, WAVE_HIT.range);
    return n;
  }

  function doPiledriver(p) {
    const e = p.grab;
    if (!e) return;
    p.grab = null;
    p.grabHits = 0;
    p.act = 'slam';
    p.t = 0.36;
    e.x = p.x + p.face * 10;
    e.y = p.y;
    e.act = 'down';
    e.t = 0.5;
    e.stun = 0.55;
    e.vx = 0;
    e.h = 0;
    audio.slam();
    hitStop(SLAM_HIT.stop);
    shake(11);
    kick(0, 5);
    thumpKick();
    flash(HOT, 0.28);
    burst(e.x, e.y - 8, 22, HOT, 210, 0.42);
    spark(e.x, e.y - 10, GOLD, 12);
    ringAt(e.x, e.y - 4, GOLD);
    ghostAt(p, 0.45);
    G.hudDirty = true;
    if (G.mode === 'play') {
      hurtEnemy(e, SLAM_HIT.dmg, SLAM_HIT.kb, p.face, true, 'slam');
      shockwave(p, e);
    }
  }

  function doPummel(p) {
    const e = p.grab;
    if (!e || e.dead) {
      p.grab = null;
      return;
    }
    p.grabHits += 1;
    G.hudDirty = true;
    if (p.grabHits >= 3) {
      doPiledriver(p);
      return;
    }
    p.act = 'knee';
    p.t = 0.22;
    p.hit = false;
    audio.swing();
  }

  function punchHits(p, atk) {
    const face = p.face;
    let i, e, d, n = 0;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead || e.act === 'held') continue;
      if (!depthHit(p, e)) continue;
      d = (e.x - p.x) * face;
      if (d < 6 || d > atk.range) continue;
      hurtEnemy(e, atk.dmg, atk.kb, face, !!atk.stun);
      n += 1;
    }
    n += smashBarrelsAt(p.x + face * 18, p.y, atk.range);
    return n;
  }

  function specialHits(p) {
    let i, e, n = 0;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead || e.act === 'held') continue;
      if (Math.abs(e.y - p.y) > 28) continue;
      if (Math.abs(e.x - p.x) > SPEC_ATK.range) continue;
      hurtEnemy(e, SPEC_ATK.dmg, SPEC_ATK.kb, e.x >= p.x ? 1 : -1, true, 'spin');
      n += 1;
    }
    n += smashBarrelsAt(p.x, p.y, SPEC_ATK.range);
    return n;
  }

  function startPunch(p) {
    if (p.grab) {
      doPummel(p);
      return;
    }
    if (p.chainT <= 0 && tryGrab(p)) return;
    let step = 0;
    if (p.chainT > 0) step = Math.min(2, p.comboStep + 1);
    p.comboStep = step;
    p.act = 'punch';
    p.t = COMBO_PUNCH[step].dur;
    p.hit = false;
    p.punch = 0;
    p.vx *= 0.3;
    audio.swing();
  }

  function startSpecial(p) {
    if (p.grab) {
      doPiledriver(p);
      return;
    }
    if (G.energy < ENERGY_COST && G.mode === 'play') {
      toast('忍气不足', true, false);
      audio.ui();
      return;
    }
    if (G.mode === 'play') addEnergy(-ENERGY_COST);
    p.act = 'special';
    p.t = SPEC_ATK.dur;
    p.hit = false;
    p.hit2 = false;
    p.vx = 0;
    audio.special();
    flash(PUR, 0.42);
    shake(10);
    boomKick();
    ringAt(p.x, p.y - 16, PUR);
    burst(p.x, p.y - 16, 24, PUR, 230, 0.42);
    ghostAt(p, 0.5);
  }

  /* ---- player ---- */
  function tickPlayer(dt) {
    const p = G.player;
    if (!p) return;
    p.punchBuf = Math.max(0, p.punchBuf - dt);
    p.specBuf = Math.max(0, p.specBuf - dt);
    p.chainT = Math.max(0, p.chainT - dt);
    p.stun = Math.max(0, p.stun - dt);
    p.step += dt;

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

    if (p.act === 'slam') {
      p.t -= dt;
      clampBelt(p);
      if (p.t <= 0) p.act = 'idle';
      return;
    }

    if (p.act === 'knee') {
      p.t -= dt;
      const e = p.grab;
      if (!p.hit && p.t < 0.14) {
        p.hit = true;
        if (e && !e.dead) {
          hurtEnemy(e, KNEE_HIT.dmg, KNEE_HIT.kb, p.face, false, 'knee');
          hitStop(KNEE_HIT.stop);
          shake(5);
          kick(p.face * 3, 2);
          burst(e.x, e.y - 14, 8, HOT, 130, 0.26);
          spark(e.x, e.y - 14, GOLD, 4);
          audio.hit(G.combo, false);
        }
      }
      if (e && !e.dead) {
        e.x = p.x + p.face * 16;
        e.y = p.y;
        e.act = 'held';
        e.face = -p.face;
      }
      clampBelt(p);
      if (p.t <= 0) {
        if (p.grab && !p.grab.dead) p.act = 'grab';
        else p.act = 'idle';
      }
      return;
    }

    if (p.act === 'special') {
      p.t -= dt;
      if ((G.clock * 20) % 1 < dt * 20) ghostAt(p, 0.3);
      const spent = SPEC_ATK.dur - p.t;
      const w0 = SPEC_ATK.wave[0];
      const w1 = SPEC_ATK.wave[1];
      if (!p.hit && spent > w0.a && spent < w0.b) {
        const n = specialHits(p);
        p.hit = true;
        if (n > 0) {
          hitStop(SPEC_ATK.stop);
          shake(9);
          kick(0, 3);
          burst(p.x, p.y - 18, 16, PUR, 200, 0.36);
          spark(p.x, p.y - 18, GOLD, 10);
          audio.hit(G.combo, true);
        }
      }
      if (!p.hit2 && spent > w1.a && spent < w1.b) {
        const n2 = specialHits(p);
        p.hit2 = true;
        if (n2 > 0) {
          hitStop(SPEC_ATK.stop);
          shake(8);
          burst(p.x, p.y - 18, 14, CYN, 190, 0.32);
          audio.hit(G.combo, true);
        }
      }
      clampBelt(p);
      if (p.t <= 0) p.act = 'idle';
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
          shake(atk.stun ? 8 : 5);
          kick(p.face * (atk.stun ? 6 : 4), 2);
          burst(p.x + p.face * 22, p.y - 16, atk.stun ? 14 : 8, HOT, 150, 0.3);
          spark(p.x + p.face * 22, p.y - 16, GOLD, atk.stun ? 8 : 4);
          audio.hit(G.combo, !!atk.stun);
        }
      }
      if (p.t <= 0) {
        p.chainT = 0.26;
        p.act = 'idle';
      }
      clampBelt(p);
      return;
    }

    if (p.grab) {
      const e = p.grab;
      if (!e || e.dead) {
        p.grab = null;
        p.grabHits = 0;
        G.hudDirty = true;
      } else {
        let mx = 0, my = 0;
        if (inputOk()) {
          if (keys.l) mx -= 1;
          if (keys.r) mx += 1;
          if (keys.u) my -= 1;
          if (keys.d) my += 1;
        }
        if (mx) p.face = mx > 0 ? 1 : -1;
        p.x += mx * WALK_X * 0.52 * dt;
        p.y += my * WALK_Y * 0.52 * dt;
        clampBelt(p);
        e.x = p.x + p.face * 16;
        e.y = p.y;
        e.act = 'held';
        e.face = -p.face;
        p.act = 'grab';
        p.run = Math.abs(mx) + Math.abs(my);
        if (p.run) p.step += dt * 1.4;
        if (inputOk() && p.specBuf > 0) {
          p.specBuf = 0;
          doPiledriver(p);
          return;
        }
        if (inputOk() && p.punchBuf > 0) {
          p.punchBuf = 0;
          doPummel(p);
          return;
        }
        return;
      }
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
    clampBelt(p);

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
    if (e.dead) {
      e.deadT -= dt;
      e.act = 'down';
      e.vx *= Math.max(0, 1 - dt * 5);
      e.x += e.vx * dt;
      return;
    }
    e.flashT = Math.max(0, e.flashT - dt);
    e.stun = Math.max(0, e.stun - dt);
    e.cool = Math.max(0, e.cool - dt);
    e.step += dt;

    if (e.act === 'held') return;
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
        G.shots.push(makeShot(e.x + e.face * 16, e.y, e.face, e.spec.shooter ? 'gun' : 'kunai'));
        if (e.spec.shooter) audio.shot();
        else audio.knife();
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
      if (e.kind === 'retu' && e.cool <= 0) {
        let guards = 0;
        let gi;
        for (gi = 0; gi < G.enemies.length; gi++) {
          if (!G.enemies[gi].dead && G.enemies[gi].pack === -3) guards += 1;
        }
        if (guards < (denser() ? 3 : 2)) {
          const gk = Math.random() < 0.5 ? 'andore' : 'punk';
          const ge = makeFoe(gk, e.x - e.face * 70, clamp(e.y + rand(-18, 18), BELT_TOP, BELT_BOT), denser() ? 1.16 : 1, denser() ? 1.12 : 1);
          ge.pack = -3;
          G.enemies.push(ge);
          e.cool = 2.6;
          e.t = e.think;
          if (G.mode === 'play') toast('打手', true, false);
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
        e.cool = e.spec.shooter ? 1.1 : 1.4;
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
      s.spin += dt * 14;
      s.x += s.vx * dt;
      if (s.life <= 0 || s.x < G.camX - 40 || s.x > G.camX + VW + 40) {
        G.shots.splice(i, 1);
        continue;
      }
      p = G.player;
      if (!p || G.deadT > 0 || G.invuln > 0 || p.act === 'special') continue;
      if (Math.abs(s.y - p.y) > 12) continue;
      if (Math.abs(s.x - p.x) > 12) continue;
      G.shots.splice(i, 1);
      burst(p.x, p.y - 16, 8, s.kind === 'gun' ? GOLD : MAG, 130, 0.24);
      hurtPlayer(s.kind === 'gun' ? 16 : 12, s.face, s.kind === 'gun' ? '中弹了' : '中镖了');
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
        p.hp = Math.min(p.maxHp, p.hp + 28);
        G.hp = p.hp;
        addEnergy(0.5);
        audio.food();
        pickupKick();
        toast('烤鸡', false, true);
        burst(d.x, d.y - 8, 10, GOLD, 90, 0.3);
        pop(d.x, d.y - 20, '+HP', GOLD);
        G.drops.splice(i, 1);
        G.hudDirty = true;
      }
    }
  }

  function tickBarrels(dt) {
    let i, b;
    for (i = G.barrels.length - 1; i >= 0; i--) {
      b = G.barrels[i];
      b.bob += dt * 2;
      if (b.dead) G.barrels.splice(i, 1);
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
      out.push([f[0] === 'kunai' ? 'punk' : f[0], f[1] + 36, y]);
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
    G.barrels = (st.barrels || []).map(function (b) { return makeBarrel(b[0], b[1]); });
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
    const d2 = makeFoe('kunai', 360, 300, 1, 1);
    G.enemies = [d1, d2];
    panel.classList.remove('win', 'lose');
    ovKicker.textContent = 'FF2';
    ovTitle.textContent = '终斗';
    ovLead.innerHTML = '跨国清场。出拳连击，晕了抱住膝撞再砸地。旋扫耗忍气。<br />打穿三城，最后是雷图。';
    ovOps.textContent = OPS;
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    showOverlay();
    setHint('走出拳 · 抱住摔 · 旋扫清场 · 血空丢命');
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
    toast(G.kind === 'core' ? '斗核' : '终斗', false, G.kind === 'core');
    setHint(G.kind === 'core' ? '斗核更密 · 空格拳 · Shift 旋扫' : '空格出拳 · 抱住摔 · Shift 旋扫');
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
    ovTitle.textContent = win ? (G.kind === 'core' ? '核清了' : '罗马清了') : (G.why || '被打倒了');
    const extra = '第 ' + G.stage + ' 城 · ';
    ovLead.textContent = extra + G.score + ' 分 · 连击最高 ×' + G.maxCombo + (G.score >= G.best && G.score > 0 ? ' · 新纪录' : '');
    ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
    ovStart.classList.add('gone');
    ovEnd.classList.remove('gone');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = win ? '斗核' : '换模式';
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
    if (p.grab && (p.act === 'grab' || p.act === 'knee')) {
      if (p.act === 'knee') {
        tickPlayer(dt);
      } else {
        p.t -= dt;
        const held = p.grab;
        if (held && !held.dead) {
          held.x = p.x + p.face * 16;
          held.y = p.y;
          held.act = 'held';
          held.face = -p.face;
        }
        if (p.t <= 0) doPiledriver(p);
      }
    } else if (p.act === 'punch' || p.act === 'slam' || p.act === 'special' || p.act === 'knee') {
      tickPlayer(dt);
    } else {
      p.face = 1;
      p.x += 38 * dt;
      if (p.x > 430) p.x = 90;
      p.y = 272 + Math.sin(G.clock * 1.4) * 6;
      p.act = 'walk';
      const beat = (G.clock * 1.05) | 0;
      const prev = ((G.clock - dt) * 1.05) | 0;
      if (beat !== prev) {
        if (beat % 5 === 4) startSpecial(p);
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
    tickBarrels(dt);
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
    if (G.theme === 'paris') {
      g = ctx.createLinearGradient(0, oy, 0, oy + 210 * scale);
      g.addColorStop(0, '#0c1018');
      g.addColorStop(1, '#243040');
    } else if (G.theme === 'rome') {
      g = ctx.createLinearGradient(0, oy, 0, oy + 210 * scale);
      g.addColorStop(0, '#140c08');
      g.addColorStop(1, '#2a1c12');
    } else {
      g = ctx.createLinearGradient(0, oy, 0, oy + 210 * scale);
      g.addColorStop(0, '#10060c');
      g.addColorStop(1, '#281014');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
    ctx.fillStyle = rgba(GOLD, G.theme === 'rome' ? 0.16 : 0.22);
    ctx.beginPath();
    ctx.arc(wx(G.camX * 0.16 + 500), wy(42), 18 * scale, 0, TAU);
    ctx.fill();
  }

  function drawBuildings() {
    const start = Math.floor((G.camX * 0.34) / 70) - 1;
    let i, hsh, bx, bw, bh, win, c, neon;
    if (G.theme === 'paris') {
      ctx.fillStyle = 'rgba(40, 52, 68, 0.45)';
      ctx.beginPath();
      ctx.moveTo(wx(G.camX + 420), wy(198));
      ctx.lineTo(wx(G.camX + 460), wy(70));
      ctx.lineTo(wx(G.camX + 500), wy(198));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 232, 255, 0.18)';
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.moveTo(wx(G.camX + 460), wy(70));
      ctx.lineTo(wx(G.camX + 430), wy(150));
      ctx.lineTo(wx(G.camX + 490), wy(150));
      ctx.closePath();
      ctx.stroke();
    }
    for (i = start; i < start + 16; i++) {
      hsh = hash2(i * 17 + (G.theme === 'paris' ? 7 : G.theme === 'rome' ? 13 : 3));
      bx = i * 70 - G.camX * 0.34;
      bw = 48 + hsh * 28;
      bh = 72 + hsh * 88;
      if (G.theme === 'rome') {
        ctx.fillStyle = '#24160e';
        ctx.fillRect(wx(G.camX + bx), wy(210 - bh * 0.7), bw * scale, bh * 0.7 * scale);
        ctx.fillStyle = '#2c1c12';
        ctx.fillRect(wx(G.camX + bx + 8), wy(210 - bh * 0.7), 6 * scale, bh * 0.7 * scale);
        ctx.fillRect(wx(G.camX + bx + bw - 14), wy(210 - bh * 0.7), 6 * scale, bh * 0.7 * scale);
        ctx.strokeStyle = 'rgba(255, 180, 80, 0.22)';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.arc(wx(G.camX + bx + bw * 0.5), wy(210 - bh * 0.35), bw * 0.28 * scale, Math.PI, 0);
        ctx.stroke();
      } else {
        ctx.fillStyle = G.theme === 'paris' ? '#161820' : '#1a0a10';
        ctx.fillRect(wx(G.camX + bx), wy(210 - bh), bw * scale, bh * scale);
        if (G.theme === 'hongkong') {
          ctx.fillStyle = rgba(hsh > 0.5 ? HOT : PUR, 0.55);
          ctx.fillRect(wx(G.camX + bx + 4), wy(210 - bh + 8), 6 * scale, Math.min(36, bh * 0.4) * scale);
          ctx.fillStyle = rgba(GOLD, 0.4);
          ctx.fillRect(wx(G.camX + bx + bw - 12), wy(210 - bh + 14), 5 * scale, 18 * scale);
        }
        if (G.theme === 'paris' && hsh > 0.45) {
          ctx.fillStyle = rgba(HOT, 0.35);
          ctx.fillRect(wx(G.camX + bx + 4), wy(210 - 28), (bw - 8) * scale, 8 * scale);
        }
        for (win = 0; win < 8; win++) {
          if (hash2(i * 90 + win) < 0.58) {
            c = hash2(i + win * 3) < 0.33 ? GOLD : (hash2(i + win) < 0.5 ? CYN : (G.theme === 'hongkong' ? HOT : MAG));
            ctx.fillStyle = rgba(c, 0.35 + 0.25 * Math.sin(G.clock * 2 + win));
            ctx.fillRect(
              wx(G.camX + bx + 6 + (win % 3) * 14),
              wy(210 - bh + 10 + Math.floor(win / 3) * 16),
              7 * scale, 8 * scale
            );
          }
        }
        if (hsh > 0.6) {
          neon = hsh > 0.8 ? HOT : (G.theme === 'hongkong' ? PUR : CYN);
          ctx.fillStyle = rgba(neon, 0.58);
          ctx.fillRect(wx(G.camX + bx + 8), wy(210 - bh - 10), 22 * scale, 6 * scale);
        }
      }
    }
    if (G.theme === 'hongkong') {
      const lx0 = Math.floor(G.camX / 90) * 90;
      let lx;
      for (lx = lx0; lx < G.camX + VW + 40; lx += 90) {
        ctx.fillStyle = rgba(HOT, 0.55);
        ctx.beginPath();
        ctx.ellipse(wx(lx + 18), wy(92), 5 * scale, 7 * scale, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 180, 80, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(wx(lx + 18), wy(85));
        ctx.lineTo(wx(lx + 18), wy(70));
        ctx.stroke();
      }
    }
  }

  function drawStreet() {
    const g = ctx.createLinearGradient(0, wy(BELT_TOP - 18), 0, wy(VH));
    g.addColorStop(0, G.theme === 'rome' ? '#241810' : G.theme === 'paris' ? '#181c22' : '#1c1014');
    g.addColorStop(0.35, '#141014');
    g.addColorStop(1, '#0a0608');
    ctx.fillStyle = g;
    ctx.fillRect(ox, wy(BELT_TOP - 18), VW * scale, (VH - (BELT_TOP - 18)) * scale);

    ctx.fillStyle = G.theme === 'paris' ? '#2a3038' : G.theme === 'rome' ? '#3a2a18' : '#2a1814';
    ctx.fillRect(ox, wy(BELT_TOP - 18), VW * scale, 8 * scale);
    ctx.fillStyle = rgba(HOT, 0.22);
    ctx.fillRect(ox, wy(BELT_TOP - 12), VW * scale, 2 * scale);

    ctx.fillStyle = '#0c0810';
    ctx.fillRect(ox, wy(BELT_BOT + 6), VW * scale, 8 * scale);
    ctx.fillStyle = rgba(HOT, 0.3);
    ctx.fillRect(ox, wy(BELT_BOT + 4), VW * scale, 2 * scale);

    const x0 = Math.floor(G.camX / 80) * 80;
    let x;
    ctx.strokeStyle = 'rgba(255, 227, 107, 0.12)';
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
      ctx.fillStyle = rgba(GOLD, 0.12);
      ctx.beginPath();
      ctx.arc(wx(lampX + 2), wy(124), 22 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.55);
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

  function drawBarrel(b) {
    if (b.dead) return;
    const s = scale;
    const x = wx(b.x);
    const y = wy(b.y);
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(x, y, 9 * s, 3.2 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WOOD, 1);
    rr(x - 8 * s, y - 18 * s, 16 * s, 18 * s, 3 * s);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.55);
    ctx.fillRect(x - 8 * s, y - 14 * s, 16 * s, 1.6 * s);
    ctx.fillRect(x - 8 * s, y - 6 * s, 16 * s, 1.6 * s);
    ctx.fillStyle = rgba(HOT, 0.35);
    ctx.fillRect(x - 2 * s, y - 16 * s, 4 * s, 14 * s);
  }

  function drawShot(s) {
    const x = wx(s.x);
    const y = wy(s.y - 18);
    ctx.save();
    ctx.translate(x, y);
    if (s.kind === 'gun') {
      ctx.scale(s.face, 1);
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fillRect(0, -2 * scale, 12 * scale, 4 * scale);
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.beginPath();
      ctx.arc(0, 0, 3 * scale, 0, TAU);
      ctx.fill();
    } else {
      ctx.rotate(s.spin);
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.beginPath();
      ctx.moveTo(8 * scale, 0);
      ctx.lineTo(0, 3.2 * scale);
      ctx.lineTo(-8 * scale, 0);
      ctx.lineTo(0, -3.2 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.7);
      ctx.beginPath();
      ctx.arc(0, 0, 2 * scale, 0, TAU);
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

    ctx.fillStyle = 'rgba(0,0,0,' + (0.35 + (e.h > 0 ? 0.08 : 0)) + ')';
    ctx.beginPath();
    ctx.ellipse(0, (e.h || 0) * scale, 11 * s, 4 * s, 0, 0, TAU);
    ctx.fill();

    const walk = (e.act === 'walk' || e.act === 'charge') ? Math.sin(e.step * 2.2) : 0;
    const punch = e.act === 'punch' || e.act === 'knee';
    const spec = e.act === 'special';
    const slam = e.act === 'slam';
    const hurt = e.act === 'hurt';
    const down = e.act === 'down';
    const grab = e.act === 'grab' || e.act === 'held';
    let bodyY = -16 * s;
    if (down) {
      ctx.rotate(-1.15);
      bodyY = -8 * s;
    } else if (hurt) {
      ctx.rotate(-0.18);
    } else if (spec) {
      ctx.rotate(G.clock * 18);
      bodyY = -18 * s;
    } else if (slam) {
      ctx.rotate(0.55);
      bodyY = -10 * s;
    } else if (e.act === 'knee') {
      ctx.rotate(-0.12);
    } else if (grab && e.kind === 'player') {
      ctx.rotate(-0.08);
    }

    if (e.flashT > 0) ctx.globalAlpha = 0.55 + 0.45 * Math.sin(G.clock * 40);

    ctx.fillStyle = rgba(look.pants, 1);
    if (!down) {
      ctx.fillRect(-6 * s + walk * 3 * s, spec ? -14 * s : -10 * s, 4.2 * s, spec ? 10 * s : 12 * s);
      ctx.fillRect(1.4 * s - walk * 3 * s, spec ? -14 * s : -10 * s, 4.2 * s, spec ? 10 * s : 12 * s);
    } else {
      ctx.fillRect(-10 * s, -6 * s, 14 * s, 5 * s);
    }
    ctx.fillStyle = '#d8dce8';
    if (!down) {
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
      ctx.fillRect(6 * s, armY - 3 * s, 14 * s, 4.2 * s);
      ctx.fillRect(-10 * s, armY + 2 * s, 7 * s, 3.4 * s);
    } else if (spec) {
      ctx.fillRect(8 * s, armY - 8 * s, 12 * s, 4 * s);
      ctx.fillRect(-16 * s, armY + 2 * s, 12 * s, 4 * s);
      ctx.fillStyle = rgba(PUR, 0.85);
      ctx.beginPath();
      ctx.arc(18 * s, armY - 6 * s, 5 * s, 0, TAU);
      ctx.fill();
    } else if (slam) {
      ctx.fillRect(4 * s, armY - 10 * s, 5 * s, 12 * s);
      ctx.fillRect(-10 * s, armY, 7 * s, 3.4 * s);
    } else if (grab && e.kind === 'player') {
      ctx.fillRect(6 * s, armY - 2 * s, 11 * s, 4 * s);
      ctx.fillRect(-10 * s, armY + 1 * s, 8 * s, 3.4 * s);
    } else {
      ctx.fillRect(5 * s, armY + walk * 2 * s, 4 * s, 9 * s);
      ctx.fillRect(-9 * s, armY - walk * 2 * s, 4 * s, 9 * s);
    }

    ctx.fillStyle = rgba(look.skin, 1);
    ctx.beginPath();
    ctx.arc(0, bodyY - 8 * s, 6.2 * s, 0, TAU);
    ctx.fill();

    if (look.hairStyle === 'maki') {
      ctx.fillStyle = rgba(look.hair, 1);
      ctx.beginPath();
      ctx.ellipse(0, bodyY - 11 * s, 6.4 * s, 4 * s, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-5 * s, bodyY - 8 * s, 2.6 * s, 4.4 * s, 0.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(look.accent, 0.9);
      ctx.fillRect(-6.2 * s, bodyY - 10 * s, 12.4 * s, 1.6 * s);
    } else if (look.hairStyle === 'mohawk') {
      ctx.fillStyle = rgba(look.hair, 1);
      ctx.fillRect(-1.6 * s, bodyY - 18 * s, 3.2 * s, 10 * s);
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
    ctx.fillStyle = 'rgba(18,7,4,' + (0.55 * a) + ')';
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
    ctx.fillText(G.kind === 'core' ? '斗核' : (G.boss ? G.boss.spec.name : '清街'), ox + 320 * scale, oy + 158 * scale);
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
    ctx.fillStyle = '#080204';
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
    for (i = 0; i < G.barrels.length; i++) list.push({ z: G.barrels[i].y - 4, kind: 'barrel', o: G.barrels[i] });
    for (i = 0; i < G.shots.length; i++) list.push({ z: G.shots[i].y, kind: 'shot', o: G.shots[i] });
    for (i = 0; i < G.enemies.length; i++) list.push({ z: G.enemies[i].y, kind: 'foe', o: G.enemies[i] });
    if (G.player) list.push({ z: G.player.y, kind: 'ply', o: G.player });
    list.sort(function (a, b) { return a.z - b.z; });

    drawGhosts();
    for (i = 0; i < list.length; i++) {
      if (list[i].kind === 'drop') drawDrop(list[i].o);
      else if (list[i].kind === 'barrel') drawBarrel(list[i].o);
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
  function consumeEdges() {
    punchEdge.down = keys.punch && !punchEdge.was;
    specEdge.down = keys.spec && !specEdge.was;
    if (punchEdge.down && G.player) G.player.punchBuf = 0.12;
    if (specEdge.down && G.player) G.player.specBuf = 0.12;
    punchEdge.was = keys.punch;
    specEdge.was = keys.spec;
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

    if (down && (isMove || space || k === 'Enter' || specKey)) e.preventDefault();
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
