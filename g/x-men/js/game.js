'use strict';

/* 变种 — X-Men arcade lite. Side-scroll brawler. No CDN. Distinct from 神龟 / 制裁. */

(function () {
  var VW = 640;
  var VH = 360;
  var GY = 318;
  var LIVES = 3;
  var LIFE_CAP = 6;
  var LIFE_EVERY = 20000;
  var HP_MAX = 16;
  var SP_MAX = 3;
  var SP_START = 2;
  var SP_REGEN = 16;
  var STEP = 1 / 60;
  var TAU = Math.PI * 2;
  var COMBO_WIN = 1.5;
  var AIR = 0.9;
  var JUMP_V = 410;
  var GRAV = 1350;
  var MAX_FALL = 640;
  var COYOTE = 0.09;
  var BUFFER = 0.12;
  var INVULN = 0.95;
  var DIE_T = 0.82;
  var BEST_KEY = 'playbox-x-men-best';
  var MUTE_KEY = 'playbox-x-men-mute';
  var MUTANT_KEY = 'playbox-x-men-mutant';
  var OPS = '方向 / WASD 走 · 上跳 · 空格斩 · Shift/Z 技 · R 重开 · M 静音';

  var MAG = [255, 61, 184];
  var CYN = [0, 240, 255];
  var GOLD = [255, 227, 107];
  var HOT = [180, 76, 255];
  var HOT2 = [208, 154, 255];
  var WHT = [239, 232, 248];
  var RED = [255, 61, 74];
  var BLU = [61, 122, 255];
  var SKIN = [232, 176, 132];
  var STEEL = [106, 114, 128];
  var STEEL2 = [58, 64, 80];

  var MUTANTS = {
    claw: {
      id: 'claw', name: '爪', wep: '爪',
      mask: GOLD, suit: [232, 196, 48], hair: [28, 22, 18],
      reach: 36, dmg: 2, t: 0.18, h0: 0.04, h1: 0.12,
      knock: 72, stop: 0.048, walk: 198, sp: 'dash', spName: '狂斩'
    },
    ice: {
      id: 'ice', name: '冰', wep: '冰',
      mask: CYN, suit: [120, 220, 240], hair: [210, 246, 255],
      reach: 34, dmg: 2, t: 0.22, h0: 0.05, h1: 0.14,
      knock: 64, stop: 0.052, walk: 168, sp: 'freeze', spName: '冰封'
    },
    storm: {
      id: 'storm', name: '闪', wep: '风',
      mask: [220, 210, 255], suit: [48, 42, 72], hair: [244, 244, 250],
      reach: 44, dmg: 2, t: 0.24, h0: 0.06, h1: 0.16,
      knock: 88, stop: 0.056, walk: 186, sp: 'bolt', spName: '落雷'
    },
    eye: {
      id: 'eye', name: '眼', wep: '视',
      mask: RED, suit: [36, 72, 180], hair: [60, 40, 28],
      reach: 28, dmg: 2, t: 0.20, h0: 0.05, h1: 0.13,
      knock: 58, stop: 0.046, walk: 176, sp: 'beam', spName: '目波'
    }
  };
  var MUTANT_IDS = ['claw', 'ice', 'storm', 'eye'];

  var KINDS = {
    grunt: { hp: 3, name: '兵', spd: 90, dmg: 2, score: 180, reach: 26, w: 16, h: 28, scale: 1 },
    gun: { hp: 3, name: '枪', spd: 74, dmg: 2, score: 260, reach: 20, w: 16, h: 28, scale: 1 },
    drone: { hp: 4, name: '机', spd: 102, dmg: 2, score: 340, reach: 22, w: 18, h: 16, scale: 0.92, fly: true },
    sent: { hp: 24, name: '哨兵', spd: 58, dmg: 3, score: 3600, reach: 38, w: 28, h: 52, scale: 1.42 },
    prime: { hp: 30, name: '精卫', spd: 64, dmg: 3, score: 5000, reach: 40, w: 30, h: 54, scale: 1.5 },
    mag: { hp: 36, name: '磁王', spd: 78, dmg: 3, score: 8000, reach: 36, w: 22, h: 38, scale: 1.22 }
  };

  var SCORE = {
    hit: 45, crate: 80, gem: 100, aid: 140, stage: 1600, wave: 700
  };

  var STAGES = [
    {
      name: '街头', w: 2320, theme: 'street',
      ents: [
        [340, 'grunt'], [500, 'grunt'], [680, 'gun'], [860, 'grunt'],
        [1040, 'drone'], [1220, 'grunt'], [1400, 'gun'], [1580, 'grunt'],
        [1760, 'drone']
      ],
      crates: [280, 760, 1180, 1640],
      gems: [620],
      aids: [1320],
      boss: ['sent', 2020]
    },
    {
      name: '工场', w: 2480, theme: 'factory',
      ents: [
        [300, 'grunt'], [460, 'gun'], [640, 'drone'], [820, 'grunt'],
        [1000, 'gun'], [1180, 'drone'], [1360, 'grunt'], [1540, 'gun'],
        [1720, 'drone'], [1880, 'grunt']
      ],
      crates: [400, 900, 1480, 1960],
      gems: [720, 1600],
      aids: [1100],
      boss: ['prime', 2160]
    },
    {
      name: '星核', w: 2180, theme: 'astro',
      ents: [
        [280, 'gun'], [440, 'drone'], [620, 'grunt'], [800, 'drone'],
        [980, 'gun'], [1160, 'drone'], [1340, 'grunt'], [1520, 'gun']
      ],
      crates: [360, 880, 1400],
      gems: [680, 1240],
      aids: [1040],
      boss: ['mag', 1860]
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
  function comboMul(n) {
    return 1 + Math.min(4, Math.max(0, Math.floor(((n | 0) - 1) / 2)));
  }
  function kindHp(kind, wave) {
    var base = KINDS[kind] ? KINDS[kind].hp : 3;
    if (!wave) return base;
    return Math.max(2, Math.round(base * (1 + Math.max(0, wave - 1) * 0.08)));
  }
  function waveCount(n) {
    return Math.min(14, 4 + ((n * 0.9) | 0));
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
  function jumpH() {
    return (JUMP_V * JUMP_V) / (2 * GRAV);
  }
  function isBoss(kind) {
    return kind === 'sent' || kind === 'prime' || kind === 'mag';
  }

  function selfCheck() {
    if (MUTANT_IDS.length !== 4) throw new Error('4 mutants');
    if (!MUTANTS.claw || !MUTANTS.ice || !MUTANTS.storm || !MUTANTS.eye) throw new Error('mutant ids');
    if (MUTANTS.claw.name !== '爪' || MUTANTS.ice.name !== '冰') throw new Error('names');
    if (MUTANTS.storm.name !== '闪' || MUTANTS.eye.name !== '眼') throw new Error('names 2');
    if (!(MUTANTS.storm.reach > MUTANTS.claw.reach && MUTANTS.claw.reach > MUTANTS.ice.reach && MUTANTS.ice.reach > MUTANTS.eye.reach)) {
      throw new Error('reach order');
    }
    if (MUTANTS.claw.t >= MUTANTS.ice.t || MUTANTS.eye.t <= MUTANTS.claw.t) throw new Error('swing time');
    if (MUTANTS.claw.sp !== 'dash' || MUTANTS.ice.sp !== 'freeze') throw new Error('sp kinds');
    if (MUTANTS.storm.sp !== 'bolt' || MUTANTS.eye.sp !== 'beam') throw new Error('sp kinds 2');
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (HP_MAX < 12) throw new Error('hp');
    if (SP_MAX !== 3 || SP_START !== 2) throw new Error('sp');
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(3) !== 2) throw new Error('combo 3');
    if (comboMul(9) !== 5) throw new Error('combo 9');
    if (BEST_KEY !== 'playbox-x-men-best') throw new Error('best key');
    if (kindHp('grunt', 0) !== 3) throw new Error('grunt hp');
    if (kindHp('sent', 1) <= kindHp('gun', 1)) throw new Error('boss hp');
    if (waveCount(1) < 4 || waveCount(20) > 14) throw new Error('wave cap');
    if (jumpH() < 50) throw new Error('jump');
    if (STAGES[0].boss[0] !== 'sent' || STAGES[1].boss[0] !== 'prime') throw new Error('early bosses');
    if (STAGES[2].boss[0] !== 'mag') throw new Error('mag boss');
    if (STAGES[0].w >= STAGES[1].w) throw new Error('wider later');
    var i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ents.length) throw new Error('ents');
      if (s.w < 1800) throw new Error('short stage');
      if (!s.boss) throw new Error('boss');
    }
  }
  selfCheck();

  if (typeof document === 'undefined') return;

  var REDUCE = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  var canvas = document.getElementById('c');
  var ctx = canvas.getContext('2d', { alpha: false });
  var overlay = document.getElementById('overlay');
  var panel = document.getElementById('panel');
  var ovKicker = document.getElementById('ov-kicker');
  var ovTitle = document.getElementById('ov-title');
  var ovLead = document.getElementById('ov-lead');
  var ovOps = document.getElementById('ov-ops');
  var ovStart = document.getElementById('ov-start');
  var ovEnd = document.getElementById('ov-end');
  var btnPost = document.getElementById('btn-post');
  var btnHunt = document.getElementById('btn-hunt');
  var ovAgain = document.getElementById('ov-again');
  var ovMenu = document.getElementById('ov-menu');
  var modePost = document.getElementById('mode-post');
  var modeHunt = document.getElementById('mode-hunt');
  var btnMute = document.getElementById('btn-mute');
  var btnRetry = document.getElementById('btn-retry');
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');
  var scoreBox = document.getElementById('score-box');
  var scoreAdd = document.getElementById('score-add');
  var comboBox = document.getElementById('combo-box');
  var comboEl = document.getElementById('combo');
  var stageLabel = document.getElementById('stage-label');
  var tagLabel = document.getElementById('tag-label');
  var mutantLabel = document.getElementById('mutant-label');
  var hpBar = document.getElementById('hp-bar');
  var spBar = document.getElementById('sp-bar');
  var pipsEl = document.getElementById('pips');
  var toastEl = document.getElementById('toast');
  var hintEl = document.getElementById('hint');
  var stageEl = document.getElementById('stage');
  var chainPop = document.getElementById('chain-pop');
  var mutantRow = document.getElementById('mutant-row');

  var W = 1;
  var H = 1;
  var dpr = 1;
  var scale = 1;
  var ox = 0;
  var oy = 0;
  var hidden = false;
  var addTok = 0;
  var toastTok = 0;
  var kickTok = 0;
  var chainTok = 0;

  var keys = { l: false, r: false, jump: false, atk: false, sp: false };
  var demo = { l: false, r: true, jump: false };
  var pips = [];
  var particles = [];
  var sparks = [];
  var rings = [];
  var floats = [];
  var trails = [];

  var G = {
    mode: 'title',
    kind: 'post',
    mutant: 'claw',
    t: 0,
    clock: 0,
    stage: 1,
    wave: 1,
    camX: 0,
    camY: 0,
    levelW: 2320,
    theme: 'street',
    ents: [],
    crates: [],
    gems: [],
    aids: [],
    bullets: [],
    beams: [],
    player: null,
    lives: LIVES,
    hp: HP_MAX,
    sp: SP_START,
    spRegen: 0,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    chainN: 0,
    atkT: 0,
    atkHit: false,
    atkBuf: 0,
    atkAir: false,
    jumpBuf: 0,
    jumpHeld: false,
    airAtk: false,
    deadT: 0,
    hurtT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    toastT: 0,
    nextLife: LIFE_EVERY,
    why: '',
    waveT: 0,
    spawnQ: [],
    clearT: 0,
    arena: false,
    lockL: 0,
    lockR: 0,
    spT: 0,
    spKind: '',
    spHit: false,
    dashHit: null
  };

  function isHunt() {
    return G.kind === 'hunt';
  }
  function playing() {
    return G.mode === 'play';
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function mutant() {
    return MUTANTS[G.mutant] || MUTANTS.claw;
  }
  function inL() { return G.mode === 'title' ? demo.l : keys.l; }
  function inR() { return G.mode === 'title' ? demo.r : keys.r; }
  function inJump() { return G.mode === 'title' ? demo.jump : keys.jump; }

  function sx(x) { return ox + (x - G.camX) * scale; }
  function sy(y) { return oy + (y - G.camY) * scale; }

  var audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure: function () {
      if (!this.ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.34;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.34;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (err) { /* ignore */ }
    },
    beep: function (freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      var t = this.ctx.currentTime;
      var o = this.ctx.createOscillator();
      var g = this.ctx.createGain();
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
    noise: function (dur, vol, hp) {
      if (!this.ctx || this.muted) return;
      var n = Math.max(0.04, dur);
      var sr = this.ctx.sampleRate;
      var buf = this.ctx.createBuffer(1, Math.max(1, (sr * n) | 0), sr);
      var data = buf.getChannelData(0);
      var i;
      for (i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      var src = this.ctx.createBufferSource();
      src.buffer = buf;
      var f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = hp || 900;
      var g = this.ctx.createGain();
      var t = this.ctx.currentTime;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    whoosh: function (id) {
      this.ensure();
      if (id === 'claw') {
        this.noise(0.05, 0.038, 700);
        this.beep(220, 0.07, 'sawtooth', 0.04, 90);
      } else if (id === 'ice') {
        this.noise(0.04, 0.03, 1800);
        this.beep(880, 0.06, 'triangle', 0.036, 420);
      } else if (id === 'storm') {
        this.noise(0.06, 0.036, 1200);
        this.beep(180, 0.08, 'sawtooth', 0.04, 70);
      } else {
        this.noise(0.04, 0.03, 1600);
        this.beep(360, 0.06, 'square', 0.034, 140);
      }
    },
    hit: function (combo, id) {
      this.ensure();
      var lift = 1 + Math.min(0.5, combo * 0.04);
      if (id === 'claw') {
        this.noise(0.05, 0.046, 600);
        this.beep(160 * lift, 0.08, 'sawtooth', 0.05, 70);
      } else if (id === 'ice') {
        this.noise(0.04, 0.034, 1400);
        this.beep(740 * lift, 0.07, 'triangle', 0.04, 320);
      } else if (id === 'storm') {
        this.noise(0.055, 0.044, 500);
        this.beep(140 * lift, 0.09, 'square', 0.048, 60);
      } else {
        this.noise(0.04, 0.04, 900);
        this.beep(280 * lift, 0.07, 'square', 0.046, 90);
      }
      this.beep(520 * lift, 0.05, 'triangle', 0.024, 180);
    },
    special: function (kind) {
      this.ensure();
      if (kind === 'dash') {
        this.noise(0.1, 0.05, 500);
        this.beep(90, 0.16, 'sawtooth', 0.055, 220);
        this.beep(440, 0.1, 'square', 0.03, 880);
      } else if (kind === 'freeze') {
        this.beep(990, 0.08, 'sine', 0.04, 1320);
        this.beep(1320, 0.14, 'triangle', 0.04, 660);
        this.noise(0.08, 0.03, 2000);
      } else if (kind === 'bolt') {
        this.noise(0.14, 0.06, 280);
        this.beep(80, 0.18, 'sawtooth', 0.06, 40);
        this.beep(880, 0.08, 'square', 0.03, 220);
      } else {
        this.beep(220, 0.06, 'sawtooth', 0.05, 880);
        this.beep(1320, 0.12, 'square', 0.04, 220);
        this.noise(0.08, 0.04, 1100);
      }
    },
    hop: function () {
      this.ensure();
      this.beep(280, 0.06, 'square', 0.04, 620);
    },
    land: function () {
      this.ensure();
      this.noise(0.04, 0.024, 500);
      this.beep(140, 0.05, 'triangle', 0.02, 80);
    },
    gun: function () {
      this.ensure();
      this.noise(0.05, 0.04, 1200);
      this.beep(320, 0.06, 'square', 0.04, 90);
    },
    beam: function () {
      this.ensure();
      this.noise(0.07, 0.042, 800);
      this.beep(180, 0.1, 'sawtooth', 0.04, 70);
    },
    gem: function () {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.04, 990);
      this.beep(990, 0.1, 'triangle', 0.035, 1320);
    },
    aid: function () {
      this.ensure();
      this.beep(523, 0.08, 'sine', 0.04, 784);
      this.beep(784, 0.12, 'triangle', 0.035, 1046);
    },
    crate: function () {
      this.ensure();
      this.noise(0.08, 0.046, 600);
      this.beep(200, 0.1, 'square', 0.036, 70);
    },
    combo: function (m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    hurt: function () {
      this.ensure();
      this.noise(0.08, 0.045, 400);
      this.beep(180, 0.12, 'sawtooth', 0.045, 70);
    },
    death: function () {
      this.ensure();
      this.noise(0.16, 0.055, 320);
      this.beep(280, 0.2, 'sawtooth', 0.05, 70);
      this.beep(140, 0.32, 'sine', 0.045, 42);
    },
    empty: function () {
      this.ensure();
      this.beep(140, 0.08, 'square', 0.03, 80);
    },
    win: function () {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
    },
    lose: function () {
      this.ensure();
      this.beep(200, 0.18, 'sawtooth', 0.04, 80);
      this.beep(120, 0.3, 'sine', 0.05, 44);
    },
    start: function () {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
    },
    oneup: function () {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.04, 880);
      this.beep(880, 0.12, 'triangle', 0.045, 1320);
    },
    stage: function () {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.12, 'triangle', 0.04, 784);
    },
    wave: function () {
      this.ensure();
      this.beep(220, 0.1, 'sawtooth', 0.04, 110);
      this.beep(440, 0.12, 'square', 0.035, 330);
    },
    boss: function () {
      this.ensure();
      this.beep(110, 0.16, 'sawtooth', 0.05, 70);
      this.beep(220, 0.2, 'square', 0.04, 90);
    }
  };

  function loadBest() {
    try {
      var n = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
      G.best = isFinite(n) && n > 0 ? n : 0;
    } catch (err) {
      G.best = 0;
    }
    if (bestEl) bestEl.textContent = String(G.best);
  }
  function saveBest() {
    if (G.score <= G.best) return;
    G.best = G.score;
    if (bestEl) bestEl.textContent = String(G.best);
    try { localStorage.setItem(BEST_KEY, String(G.best)); } catch (err) { /* ignore */ }
  }
  function loadMutant() {
    try {
      var id = localStorage.getItem(MUTANT_KEY);
      if (id && MUTANTS[id]) G.mutant = id;
    } catch (err) { /* ignore */ }
  }
  function saveMutant() {
    try { localStorage.setItem(MUTANT_KEY, G.mutant); } catch (err) { /* ignore */ }
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
    var tok = addTok;
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
    var tok = toastTok;
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
    var n = Math.max(LIVES, G.lives);
    var el, i;
    while (pips.length < n) {
      el = document.createElement('span');
      el.className = 'pip';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    while (pips.length > n) {
      el = pips.pop();
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    for (i = 0; i < pips.length; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', i >= G.lives && G.mode !== 'title');
    }
  }
  function syncModes() {
    var w = isHunt();
    if (modePost) modePost.setAttribute('aria-pressed', w ? 'false' : 'true');
    if (modeHunt) modeHunt.setAttribute('aria-pressed', w ? 'true' : 'false');
  }
  function syncMutants() {
    var id, btn, i;
    for (i = 0; i < MUTANT_IDS.length; i++) {
      id = MUTANT_IDS[i];
      btn = document.getElementById('m-' + id);
      if (btn) btn.setAttribute('aria-pressed', id === G.mutant ? 'true' : 'false');
    }
    if (mutantLabel) {
      mutantLabel.textContent = mutant().name;
      mutantLabel.className = 'mutant ' + G.mutant;
    }
  }
  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 3);
    if (stageLabel) {
      if (isHunt()) stageLabel.textContent = '潮 ' + G.wave;
      else stageLabel.textContent = (STAGES[G.stage - 1] || STAGES[0]).name;
      stageLabel.classList.toggle('hot', isHunt() ? G.wave >= 5 : G.stage >= 3);
    }
    if (tagLabel) {
      tagLabel.textContent = isHunt() ? '围捕' : '哨站';
      tagLabel.classList.toggle('warn', isHunt());
      tagLabel.classList.toggle('hot', !isHunt() && G.stage >= 3);
    }
    if (hpBar) {
      var r = G.hp / HP_MAX;
      hpBar.style.transform = 'scaleX(' + clamp(r, 0, 1) + ')';
      hpBar.classList.toggle('low', r <= 0.34);
    }
    if (spBar) {
      var sr = G.sp / SP_MAX;
      spBar.style.transform = 'scaleX(' + clamp(sr, 0, 1) + ')';
      spBar.classList.toggle('low', sr <= 0.34);
    }
    syncPips();
    syncModes();
    syncMutants();
  }
  function popCombo() {
    if (!chainPop) return;
    chainTok += 1;
    chainPop.textContent = '×' + G.mult;
    chainPop.classList.remove('hidden');
    chainPop.style.animation = 'none';
    void chainPop.offsetWidth;
    chainPop.style.animation = '';
    var tok = chainTok;
    setTimeout(function () {
      if (tok === chainTok) chainPop.classList.add('hidden');
    }, 700);
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'XMEN';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (mutantRow) mutantRow.style.display = kind === 'title' ? '' : 'none';
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' && !isHunt() ? '围捕' : '换模式';
  }
  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus({ preventScroll: true });
  }

  function hitStop(sec) {
    if (REDUCE || G.mode === 'title') return;
    G.stop = Math.max(G.stop, sec);
  }
  function kick(mag, cls) {
    if (REDUCE || G.mode === 'title') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.007));
    if (!stageEl) return;
    var c = cls || (mag >= 6 ? 'die' : mag >= 3.4 ? 'boom' : 'hit');
    kickTok += 1;
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'win-flash');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    var tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'win-flash');
      }
    }, 380);
  }
  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
    G.flashRgb = rgb;
  }
  function emit(n, spec) {
    if (REDUCE) n = Math.min(n, 6);
    var i;
    for (i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        r: rand(spec.r0, spec.r1),
        life: rand(spec.life * 0.55, spec.life),
        max: spec.life,
        rgb: spec.rgb,
        g: spec.g == null ? 420 : spec.g
      });
    }
    capArr(particles, 280);
  }
  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    capArr(sparks, 40);
  }
  function popRing(x, y, rgb, rad) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 22 });
    capArr(rings, 24);
  }
  function popFloat(x, y, text, rgb) {
    floats.push({ x: x, y: y, text: text, rgb: rgb || GOLD, t: 0, life: 0.7, size: 13 });
    capArr(floats, 24);
  }
  function swingTrail(x, y, face, kind) {
    trails.push({ x: x, y: y, face: face, kind: kind || 'claw', t: 0, life: 0.16, reach: mutant().reach });
    capArr(trails, 18);
  }

  function makePlayer(x) {
    return {
      x: x, y: GY, vx: 0, vy: 0, face: 1,
      grounded: true, coyote: 0, run: 0, squash: 1,
      act: 'idle', scale: 1
    };
  }
  function makeEnt(x, kind, wave) {
    var spec = KINDS[kind] || KINDS.grunt;
    var fly = !!spec.fly;
    return {
      x: x, y: fly ? GY - 92 : GY, vx: 0, vy: 0,
      face: x > (G.player ? G.player.x : 200) ? -1 : 1,
      kind: kind,
      hp: kindHp(kind, wave),
      max: kindHp(kind, wave),
      spd: spec.spd * (wave ? 1 + Math.max(0, wave - 1) * 0.05 : 1),
      dmg: spec.dmg,
      scale: spec.scale,
      reach: spec.reach,
      w: spec.w,
      h: spec.h,
      fly: fly,
      hover: fly ? GY - 92 : GY,
      think: rand(0.08, 0.5),
      act: 'idle',
      atkT: 0,
      atkHit: false,
      stunT: 0,
      hurtT: 0,
      freeze: 0,
      deadT: 0,
      dead: false,
      flash: 0,
      run: rand(0, 8),
      cd: rand(0.2, 0.8),
      grounded: !fly,
      squash: 1
    };
  }
  function makeCrate(x) {
    return { x: x, hp: 1, dead: false, deadT: 0 };
  }
  function makeGem(x) {
    return { x: x, y: GY - 14, taken: false, bob: rand(0, TAU), kind: 'gem' };
  }
  function makeAid(x) {
    return { x: x, y: GY - 14, taken: false, bob: rand(0, TAU), kind: 'aid' };
  }

  function clearFx() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    trails.length = 0;
  }

  function livingCount() {
    var n = 0, i, e;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (!e.dead) n += 1;
    }
    return n;
  }
  function findBoss() {
    var i, e;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (isBoss(e.kind) && !e.dead) return e;
    }
    return null;
  }

  function loadStage(n, demoMode) {
    var spec = STAGES[clamp(n, 1, STAGES.length) - 1];
    var i, e;
    G.stage = n;
    G.theme = spec.theme;
    G.levelW = spec.w;
    G.ents = [];
    G.crates = [];
    G.gems = [];
    G.aids = [];
    G.bullets = [];
    G.beams = [];
    G.arena = false;
    G.lockL = 0;
    G.lockR = spec.w;
    G.camX = 0;
    G.camY = 0;
    G.player = makePlayer(72);
    G.atkT = 0;
    G.atkHit = false;
    G.atkBuf = 0;
    G.atkAir = false;
    G.airAtk = false;
    G.deadT = 0;
    G.hurtT = 0;
    G.chainN = 0;
    G.clearT = 0;
    G.spT = 0;
    G.dashHit = null;
    if (!demoMode) {
      for (i = 0; i < spec.ents.length; i++) {
        e = spec.ents[i];
        G.ents.push(makeEnt(e[0], e[1], 0));
      }
      if (spec.boss) G.ents.push(makeEnt(spec.boss[1], spec.boss[0], 0));
      for (i = 0; i < spec.crates.length; i++) G.crates.push(makeCrate(spec.crates[i]));
      for (i = 0; i < spec.gems.length; i++) G.gems.push(makeGem(spec.gems[i]));
      for (i = 0; i < spec.aids.length; i++) G.aids.push(makeAid(spec.aids[i]));
    } else {
      G.ents.push(makeEnt(420, 'grunt', 0));
      G.ents.push(makeEnt(620, 'gun', 0));
      G.ents.push(makeEnt(780, 'drone', 0));
      G.crates.push(makeCrate(300));
      G.gems.push(makeGem(520));
    }
  }

  function spawnWave(n) {
    var count = waveCount(n);
    var i, kind, side, x;
    G.wave = n;
    G.waveT = 0.5;
    G.spawnQ = [];
    G.clearT = 0;
    for (i = 0; i < count; i++) {
      if (n >= 8 && n % 8 === 0 && i === 0) kind = 'mag';
      else if (n >= 4 && n % 4 === 0 && i === 0) kind = 'sent';
      else if (n >= 6 && n % 6 === 0 && i === 1) kind = 'prime';
      else if (i % 4 === 2) kind = 'drone';
      else if (n >= 2 && i % 3 === 1) kind = 'gun';
      else kind = 'grunt';
      side = i % 2 === 0 ? 1 : -1;
      x = (G.player ? G.player.x : 320) + side * rand(300, 480);
      x = clamp(x, 40, G.levelW - 40);
      G.spawnQ.push({ t: 0.1 * i, kind: kind, x: x });
    }
    toast('第 ' + n + ' 潮', false, n % 4 === 0);
    audio.wave();
    syncHud();
  }

  function setMutant(id) {
    if (!MUTANTS[id]) return;
    G.mutant = id;
    saveMutant();
    syncMutants();
  }

  function startGame(kind) {
    G.kind = kind === 'hunt' ? 'hunt' : 'post';
    G.mode = 'play';
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.sp = SP_START;
    G.spRegen = 0;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.nextLife = LIFE_EVERY;
    G.why = '';
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.invuln = 0.45;
    G.wave = 1;
    G.atkT = 0;
    G.atkHit = false;
    G.atkBuf = 0;
    G.deadT = 0;
    G.chainN = 0;
    G.arena = false;
    G.spT = 0;
    G.dashHit = null;
    clearFx();
    if (isHunt()) {
      G.theme = 'street';
      G.levelW = 2100;
      G.ents = [];
      G.crates = [makeCrate(360), makeCrate(900), makeCrate(1500)];
      G.gems = [makeGem(640), makeGem(1200)];
      G.aids = [makeAid(1680)];
      G.bullets = [];
      G.beams = [];
      G.player = makePlayer(280);
      G.camX = 0;
      G.stage = 1;
      spawnWave(1);
    } else {
      loadStage(1, false);
    }
    hideOverlay();
    audio.start();
    toast(isHunt() ? '围捕' : STAGES[0].name, false, !isHunt());
    setHint(isHunt() ? '一潮接一潮 · 机兵悬空 · 短技清场' : '往右打 · 跳开射束 · Shift 短技 · 打到磁王', '');
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'post';
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.sp = SP_START;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '变种', '侧向哨站。选一位变种，近战加短技清场。哨兵悬停射束，磁王会吸人。体力打空扣一命。');
    setHint('走跳斩 · Shift 短技 · 跳开射束 · 四变种不同技', '');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('post');
    else startGame(G.kind || 'post');
  }
  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('post');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    kick(7, 'die');
    var why = G.why === 'life' ? '体力见底，倒在哨站。' : '被打趴了。';
    showOverlay('lose', '倒了', why + ' 分数 ' + G.score + ' · 最高连击 ' + G.maxCombo);
    setHint('R 立刻重开', 'warn');
    syncHud();
  }
  function goWin() {
    G.mode = 'win';
    audio.win();
    kick(2, 'win-flash');
    screenFlash(GOLD, 0.5);
    showOverlay('win', '清场了', '磁王倒了，星核归你们。分数 ' + G.score + ' · 最高连击 ' + G.maxCombo);
    setHint('R 再来一局', 'hot');
    if (stageEl) stageEl.classList.add('win-flash');
    syncHud();
  }

  function bumpCombo() {
    if (!playing()) return;
    G.combo += 1;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    G.comboT = COMBO_WIN;
    var prev = G.mult;
    G.mult = comboMul(G.combo);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) {
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
    }
    if (G.mult > prev) {
      popCombo();
      audio.combo(G.mult);
      screenFlash(GOLD, 0.28);
    }
  }
  function dropCombo() {
    G.combo = 0;
    G.mult = 1;
    G.chainN = 0;
    if (comboEl) comboEl.textContent = '×1';
    if (comboBox) comboBox.classList.remove('hot');
  }

  function hurtPlayer(dmg, fromX, knock) {
    if (G.invuln > 0 || G.deadT > 0 || G.mode === 'title') return;
    var p = G.player;
    G.hp -= dmg;
    G.hurtT = 0.28;
    G.invuln = INVULN;
    p.vx = (p.x < fromX ? -1 : 1) * (knock || 140);
    p.vy = Math.min(p.vy, -90);
    p.act = 'hurt';
    dropCombo();
    audio.hurt();
    kick(4.2, 'die');
    screenFlash(MAG, 0.35);
    emit(10, {
      x: p.x, y: p.y - 16, j: 8,
      vx0: -80, vx1: 80, vy0: -220, vy1: -40,
      r0: 1.4, r1: 3.4, life: 0.4, rgb: MAG
    });
    if (hpBar) {
      hpBar.style.transform = 'scaleX(' + clamp(G.hp / HP_MAX, 0, 1) + ')';
      hpBar.classList.toggle('low', G.hp / HP_MAX <= 0.34);
    }
    if (G.hp <= 0) {
      G.hp = 0;
      G.lives -= 1;
      G.deadT = DIE_T;
      G.why = 'life';
      audio.death();
      kick(6.5, 'die');
      if (G.lives <= 0) {
        G.lives = 0;
        goLose();
      }
      syncPips();
    }
  }

  function respawn() {
    if (!playing()) return;
    var p = G.player;
    G.hp = HP_MAX;
    G.deadT = 0;
    G.invuln = 1.35;
    G.hurtT = 0;
    G.atkT = 0;
    G.spT = 0;
    p.y = GY;
    p.vy = 0;
    p.vx = 0;
    p.grounded = true;
    p.act = 'idle';
    p.squash = 1.1;
    syncHud();
    toast('再起', false, true);
  }

  function atkSpec() {
    var t = mutant();
    var air = G.atkAir;
    var chain = G.chainN;
    var spec = {
      t: t.t, h0: t.h0, h1: t.h1, dmg: t.dmg, reach: t.reach,
      knock: t.knock, stop: t.stop, down: false, id: t.id
    };
    if (air) {
      spec.t = 0.28;
      spec.h0 = 0.04;
      spec.h1 = 0.22;
      spec.reach = t.reach * 0.9;
      spec.dmg = Math.max(1, t.dmg);
      spec.knock = t.knock * 0.85;
    } else if (chain >= 3 && chain % 3 === 0) {
      spec.knock += 28;
      spec.down = true;
      spec.stop += 0.012;
    }
    return spec;
  }

  function doAtk() {
    if (G.deadT > 0 || G.spT > 0) return;
    if (G.mode !== 'play' && G.mode !== 'title') return;
    if (G.atkT > 0) {
      var spec = atkSpec();
      if (G.atkT < spec.t * 0.5) G.atkBuf = 1;
      return;
    }
    startAtk();
  }
  function startAtk() {
    var p = G.player;
    if (!p) return;
    if (!p.grounded) {
      if (G.airAtk) return;
      G.airAtk = true;
      G.atkAir = true;
    } else {
      G.atkAir = false;
    }
    G.chainN += 1;
    var spec = atkSpec();
    G.atkT = spec.t;
    G.atkHit = false;
    G.atkBuf = 0;
    p.act = G.atkAir ? 'spin' : 'atk';
    audio.whoosh(spec.id);
    swingTrail(p.x, p.y - 18, p.face, spec.id);
  }

  function applyHit(e, dmg, knock, face, down, stop, id) {
    if (e.dead || e.hurtT > 0.1) return false;
    var p = G.player;
    e.hp -= dmg;
    e.hurtT = 0.16;
    e.stunT = down ? 0.42 : 0.22;
    e.flash = 0.12;
    e.face = -face;
    e.vx = face * knock;
    if (down || G.atkAir) e.vy = -160;
    if (id === 'ice') e.freeze = Math.max(e.freeze, 0.35);
    e.act = 'hurt';
    bumpCombo();
    audio.hit(G.combo, id);
    hitStop(stop);
    kick(down ? 4.4 : 2.6, down ? 'boom' : 'hit');
    var hx = e.x;
    var hy = e.y - (e.h * 0.5);
    var rgb = mutant().mask;
    emit(down ? 14 : 9, {
      x: hx, y: hy, j: 10,
      vx0: face * 40, vx1: face * 220, vy0: -240, vy1: -20,
      r0: 1.5, r1: 3.8, life: 0.42, rgb: rgb
    });
    emit(4, {
      x: hx, y: hy, j: 6,
      vx0: -40, vx1: 40, vy0: -180, vy1: -40,
      r0: 1.2, r1: 2.6, life: 0.3, rgb: GOLD
    });
    popSpark(hx, hy, rgb, down ? 22 : 14);
    var pts = Math.round(SCORE.hit * G.mult * (down ? 1.4 : 1));
    addScore(pts);
    popFloat(hx, hy - 10, '+' + pts, GOLD);
    if (e.hp <= 0) {
      killEnt(e, face, knock, rgb);
    }
    return true;
  }

  function killEnt(e, face, knock, rgb) {
    e.dead = true;
    e.deadT = 0.55;
    e.vy = -220;
    e.vx = face * ((knock || 80) + 80);
    popRing(e.x, e.y - 16, rgb, 26);
    var ks = Math.round((KINDS[e.kind] ? KINDS[e.kind].score : 180) * G.mult);
    addScore(ks);
    popFloat(e.x, e.y - 36, '+' + ks, rgb);
    if (playing() && hash2((e.x * 13 + G.t * 10) | 0) > 0.82 && G.sp < SP_MAX) {
      G.gems.push(makeGem(e.x));
    }
    if (isBoss(e.kind)) {
      screenFlash(GOLD, 0.45);
      kick(6, 'boom');
      toast(KINDS[e.kind].name + '倒了', false, true);
    }
  }

  function hitEnt(e, spec, p) {
    if (e.dead || e.hurtT > 0.12) return false;
    var dx = (e.x - p.x) * p.face;
    if (dx < 8 || dx > spec.reach + 12) return false;
    var py = p.y - 14;
    var ey = e.y - e.h * 0.5;
    var yTol = 28 + (G.atkAir ? 28 : 0) + (e.fly ? 18 : 0);
    if (Math.abs(py - ey) > yTol) return false;
    return applyHit(e, spec.dmg, spec.knock, p.face, spec.down, spec.stop, spec.id);
  }

  function smashCrate(c, spec, p) {
    var dx = (c.x - p.x) * p.face;
    if (dx < 4 || dx > spec.reach + 8) return false;
    if (Math.abs(p.y - GY) > 40) return false;
    c.dead = true;
    c.deadT = 0.4;
    bumpCombo();
    audio.crate();
    hitStop(0.04);
    kick(2.2, 'thump');
    emit(12, {
      x: c.x, y: GY - 14, j: 8,
      vx0: -160, vx1: 160, vy0: -280, vy1: -40,
      r0: 1.6, r1: 4, life: 0.45, rgb: STEEL
    });
    addScore(Math.round(SCORE.crate * G.mult));
    var roll = hash2((c.x * 17) | 0);
    if (roll > 0.62) G.gems.push(makeGem(c.x));
    else if (roll > 0.38) G.aids.push(makeAid(c.x));
    return true;
  }

  function tryHit() {
    var p = G.player;
    if (!p || G.atkHit) return;
    var spec = atkSpec();
    var i, any = false;
    for (i = 0; i < G.ents.length; i++) {
      if (hitEnt(G.ents[i], spec, p)) any = true;
    }
    for (i = 0; i < G.crates.length; i++) {
      if (!G.crates[i].dead && smashCrate(G.crates[i], spec, p)) any = true;
    }
    if (any) G.atkHit = true;
  }

  function giveSp(n) {
    G.sp = clamp(G.sp + n, 0, SP_MAX);
    if (spBar) {
      spBar.style.transform = 'scaleX(' + clamp(G.sp / SP_MAX, 0, 1) + ')';
      spBar.classList.toggle('low', G.sp / SP_MAX <= 0.34);
    }
  }

  function doSpecial() {
    var p = G.player;
    var m, kind, i, e, dmg, rgb;
    if (!p || G.deadT > 0) return;
    if (G.mode !== 'play' && G.mode !== 'title') return;
    if (G.spT > 0) return;
    if (playing() && G.sp < 1) {
      toast('能尽', true, false);
      audio.empty();
      return;
    }
    m = mutant();
    kind = m.sp;
    if (playing()) giveSp(-1);
    G.spT = kind === 'dash' ? 0.32 : kind === 'freeze' ? 0.38 : kind === 'bolt' ? 0.4 : 0.22;
    G.spKind = kind;
    G.spHit = false;
    G.dashHit = {};
    G.atkT = 0;
    p.act = 'sp';
    rgb = m.mask;
    audio.special(kind);
    toast(m.spName, false, true);

    if (kind === 'dash') {
      p.vy = 0;
      G.invuln = Math.max(G.invuln, 0.32);
      emit(16, {
        x: p.x, y: p.y - 16, j: 10,
        vx0: -p.face * 240, vx1: -p.face * 40, vy0: -80, vy1: 40,
        r0: 1.6, r1: 4, life: 0.4, rgb: rgb, g: 80
      });
      popRing(p.x, p.y - 16, rgb, 20);
      kick(3.6, 'boom');
    } else if (kind === 'freeze') {
      screenFlash(CYN, 0.4);
      hitStop(0.06);
      kick(3.2, 'thump');
      popRing(p.x + p.face * 40, p.y - 18, CYN, 28);
      emit(18, {
        x: p.x + p.face * 36, y: p.y - 18, j: 18,
        vx0: p.face * 40, vx1: p.face * 220, vy0: -160, vy1: 40,
        r0: 1.4, r1: 3.6, life: 0.5, rgb: CYN, g: 40
      });
      dmg = 3;
      for (i = 0; i < G.ents.length; i++) {
        e = G.ents[i];
        if (e.dead) continue;
        if ((e.x - p.x) * p.face < 8 || (e.x - p.x) * p.face > 108) continue;
        if (Math.abs((p.y - 14) - (e.y - e.h * 0.5)) > (e.fly ? 92 : 46)) continue;
        applyHit(e, dmg, 40, p.face, false, 0.055, 'ice');
        e.freeze = Math.max(e.freeze, 1.55);
        e.vx *= 0.2;
      }
      for (i = 0; i < G.crates.length; i++) {
        if (!G.crates[i].dead) smashCrate(G.crates[i], { reach: 90 }, p);
      }
    } else if (kind === 'bolt') {
      screenFlash(HOT2, 0.5);
      hitStop(0.072);
      kick(5, 'boom');
      popRing(p.x, p.y - 20, HOT2, 36);
      emit(22, {
        x: p.x, y: p.y - 40, j: 40,
        vx0: -180, vx1: 180, vy0: -280, vy1: 40,
        r0: 1.4, r1: 4.2, life: 0.5, rgb: HOT2, g: 60
      });
      dmg = 3;
      for (i = 0; i < G.ents.length; i++) {
        e = G.ents[i];
        if (e.dead) continue;
        if (Math.abs(e.x - p.x) > 150) continue;
        applyHit(e, dmg, 90, e.x >= p.x ? 1 : -1, true, 0.07, 'storm');
        e.stunT = Math.max(e.stunT, 0.4);
      }
      for (i = 0; i < G.crates.length; i++) {
        if (!G.crates[i].dead && Math.abs(G.crates[i].x - p.x) < 150) {
          smashCrate(G.crates[i], { reach: 160 }, p);
        }
      }
    } else if (kind === 'beam') {
      G.beams.push({
        x: p.x + p.face * 18,
        y: p.y - 20,
        vx: p.face * 640,
        dmg: 4,
        pierce: 3,
        life: 0.85,
        rgb: RED,
        kind: 'beam',
        hit: {}
      });
      emit(10, {
        x: p.x + p.face * 20, y: p.y - 20, j: 6,
        vx0: p.face * 80, vx1: p.face * 280, vy0: -40, vy1: 40,
        r0: 1.2, r1: 2.8, life: 0.28, rgb: RED, g: 20
      });
      kick(2.4, 'hit');
    }
    syncHud();
  }

  function nearestEnt() {
    var i, e, best = null, bd = 1e9, d;
    var p = G.player;
    if (!p) return null;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      d = Math.abs(e.x - p.x);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  function demoThink() {
    var p = G.player;
    var e, dx, spec, nNear, i;
    if (!p) return;
    demo.l = false;
    demo.r = false;
    demo.jump = false;
    e = nearestEnt();
    spec = mutant();
    if (!e) {
      demo.r = p.x < 380;
      demo.l = p.x > 720;
      return;
    }
    dx = e.x - p.x;
    if ((e.kind === 'gun' || e.kind === 'sent' || e.kind === 'prime') && Math.abs(dx) < 210 && p.grounded) demo.jump = true;
    if (e.fly && Math.abs(dx) < spec.reach + 20 && p.grounded) demo.jump = true;
    nNear = 0;
    for (i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].dead && Math.abs(G.ents[i].x - p.x) < 130) nNear += 1;
    }
    if (nNear >= 2 && G.spT <= 0 && G.atkT <= 0 && hash2((G.t * 8) | 0) > 0.72) {
      doSpecial();
      return;
    }
    if (Math.abs(dx) > spec.reach - 6) {
      if (dx > 0) demo.r = true;
      else demo.l = true;
    } else if (G.atkT <= 0) {
      doAtk();
    }
  }

  function updatePlayer(dt) {
    var p = G.player;
    var spec = mutant();
    var ax, spd, busy, dashing;
    if (!p) return;
    if (G.deadT > 0) {
      G.deadT -= dt;
      p.act = 'down';
      p.vy += GRAV * dt;
      p.y += p.vy * dt;
      if (p.y > GY) { p.y = GY; p.vy = 0; }
      if (G.deadT <= 0) respawn();
      return;
    }
    if (G.hurtT > 0) G.hurtT -= dt;
    if (G.invuln > 0 && G.mode !== 'title') G.invuln -= dt;

    dashing = G.spT > 0 && G.spKind === 'dash';
    if (dashing) {
      p.vx = p.face * 540;
      p.x += p.vx * dt;
      p.x = clamp(p.x, 18, G.levelW - 18);
      if (G.arena) p.x = clamp(p.x, Math.max(18, G.lockL), Math.min(G.levelW - 18, G.lockR));
      p.act = 'sp';
      p.y = GY;
      p.vy = 0;
      p.grounded = true;
      emit(1, {
        x: p.x - p.face * 12, y: p.y - 14, j: 5,
        vx0: -p.face * 40, vx1: -p.face * 10, vy0: -30, vy1: 10,
        r0: 1.4, r1: 3, life: 0.22, rgb: spec.mask, g: 40
      });
      return;
    }

    busy = (G.atkT > 0 && G.atkT > atkSpec().t * 0.28 && p.grounded && G.hurtT <= 0) || (G.spT > 0 && G.spKind !== 'dash');
    ax = 0;
    if (!busy) {
      if (inL()) ax -= 1;
      if (inR()) ax += 1;
    }
    if (ax) p.face = ax;
    spd = spec.walk * (p.grounded ? 1 : AIR);
    if (G.hurtT > 0) {
      p.vx *= Math.max(0, 1 - 6 * dt);
    } else {
      p.vx = ax * spd;
    }
    p.x += p.vx * dt;
    p.x = clamp(p.x, 18, G.levelW - 18);
    if (G.arena) p.x = clamp(p.x, Math.max(18, G.lockL), Math.min(G.levelW - 18, G.lockR));

    if (p.grounded) p.coyote = COYOTE;
    else p.coyote -= dt;
    G.jumpBuf = inJump() ? BUFFER : G.jumpBuf - dt;
    if (G.jumpBuf > 0 && p.coyote > 0 && !G.jumpHeld && G.hurtT <= 0 && G.spT <= 0) {
      p.vy = -JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      G.jumpBuf = 0;
      G.airAtk = false;
      p.squash = 0.78;
      audio.hop();
    }
    G.jumpHeld = inJump();

    p.vy += GRAV * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    p.y += p.vy * dt;
    if (p.y >= GY) {
      if (!p.grounded && p.vy > 90) {
        audio.land();
        p.squash = 1.2;
      }
      p.y = GY;
      p.vy = 0;
      p.grounded = true;
      G.airAtk = false;
    } else p.grounded = false;

    p.squash = lerp(p.squash, 1, Math.min(1, 14 * dt));
    p.run += dt * (ax ? 11 : 3.2);

    if (G.spT > 0) p.act = 'sp';
    else if (G.atkT > 0) p.act = G.atkAir ? 'spin' : 'atk';
    else if (!p.grounded) p.act = 'jump';
    else if (G.hurtT > 0) p.act = 'hurt';
    else if (ax) p.act = 'walk';
    else p.act = 'idle';
  }

  function updateAtk(dt) {
    if (G.atkT <= 0) {
      if (G.atkBuf && G.deadT <= 0 && G.spT <= 0) startAtk();
      return;
    }
    var spec = atkSpec();
    var prev = G.atkT;
    G.atkT -= dt;
    if (!G.atkHit && prev > spec.t - spec.h1 && G.atkT <= spec.t - spec.h0) tryHit();
    if (G.atkT <= 0) {
      G.atkT = 0;
      if (G.atkBuf && G.spT <= 0) startAtk();
    }
  }

  function updateSpecial(dt) {
    var p = G.player;
    var i, e, id;
    if (G.spT <= 0) return;
    G.spT -= dt;
    if (G.spKind === 'dash' && p) {
      for (i = 0; i < G.ents.length; i++) {
        e = G.ents[i];
        if (e.dead) continue;
        id = e.x | 0;
        if (G.dashHit[id]) continue;
        if (Math.abs(e.x - p.x) > 28) continue;
        if (Math.abs((p.y - 14) - (e.y - e.h * 0.5)) > 40) continue;
        G.dashHit[id] = true;
        applyHit(e, 3, 120, p.face, true, 0.05, 'claw');
      }
      for (i = 0; i < G.crates.length; i++) {
        if (!G.crates[i].dead && Math.abs(G.crates[i].x - p.x) < 22) {
          smashCrate(G.crates[i], { reach: 30 }, p);
        }
      }
    }
    if (G.spT <= 0) {
      G.spT = 0;
      G.spKind = '';
      G.dashHit = null;
    }
  }

  function overlapPlayer(e) {
    var p = G.player;
    if (!p || G.deadT > 0) return false;
    if (Math.abs(e.x - p.x) > (e.w * 0.5 + 10)) return false;
    var pTop = p.y - 28;
    var eTop = e.y - e.h;
    return p.y > eTop + 6 && e.y > pTop + 6;
  }

  function updateEnt(e, dt) {
    var p = G.player;
    var dx, dist, want, cap, hover;
    if (e.dead) {
      e.deadT -= dt;
      e.vy += GRAV * dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.vx *= 0.98;
      if (e.y > GY) { e.y = GY; e.vy = 0; e.vx *= 0.5; }
      e.act = 'down';
      return;
    }
    if (e.flash > 0) e.flash -= dt;
    if (e.hurtT > 0) e.hurtT -= dt;
    if (e.freeze > 0) {
      e.freeze -= dt;
      e.vx *= Math.max(0, 1 - 8 * dt);
      e.x += e.vx * dt;
      if (!e.fly) {
        e.vy += GRAV * dt;
        e.y += e.vy * dt;
        if (e.y >= GY) { e.y = GY; e.vy = 0; }
      }
      e.act = 'hurt';
      return;
    }
    if (e.stunT > 0) {
      e.stunT -= dt;
      e.vx *= Math.max(0, 1 - 5 * dt);
      e.x += e.vx * dt;
      e.vy += GRAV * dt;
      e.y += e.vy * dt;
      if (e.y >= GY) { e.y = GY; e.vy = 0; e.grounded = true; }
      e.act = 'hurt';
      return;
    }
    if (!p) return;
    dx = p.x - e.x;
    dist = Math.abs(dx);
    e.face = dx >= 0 ? 1 : -1;
    e.run += dt * 9;
    e.think -= dt;
    e.cd -= dt;

    if (e.atkT > 0) {
      e.atkT -= dt;
      if (e.kind === 'prime' && e.act === 'charge') {
        e.x += e.face * 300 * dt;
        e.x = clamp(e.x, 24, G.levelW - 24);
        if (!e.atkHit && overlapPlayer(e) && Math.abs(p.y - e.y) < 42) {
          e.atkHit = true;
          hurtPlayer(e.dmg, e.x, 210);
        }
        emit(1, {
          x: e.x - e.face * 10, y: GY - 2, j: 4,
          vx0: -e.face * 40, vx1: -e.face * 10, vy0: -40, vy1: -8,
          r0: 1.5, r1: 3.2, life: 0.28, rgb: STEEL, g: 80
        });
        if (e.atkT <= 0) { e.act = 'tired'; e.cd = 0.65; }
        return;
      }
      if (e.kind === 'prime' && e.act === 'snort') {
        e.squash = 1 + Math.sin(G.clock * 24) * 0.04;
        if (e.atkT <= 0) {
          e.act = 'charge';
          e.atkT = 0.7;
          e.atkHit = false;
          audio.boss();
        }
        return;
      }
      if ((e.kind === 'gun' || e.kind === 'sent' || e.kind === 'prime') && e.act === 'atk' && !e.atkHit && e.atkT < 0.1) {
        e.atkHit = true;
        if (e.kind === 'gun') {
          G.bullets.push({ x: e.x + e.face * 16, y: e.y - 18, vx: e.face * 260, life: 1.35, dmg: 2, kind: 'shot' });
          audio.gun();
          popSpark(e.x + e.face * 16, e.y - 18, GOLD, 10);
        } else {
          G.bullets.push({
            x: e.x + e.face * 22, y: e.y - (e.kind === 'prime' ? 28 : 26),
            vx: e.face * 300, life: 1.4, dmg: 2, kind: 'laser', w: 22
          });
          if (e.kind === 'prime') {
            G.bullets.push({
              x: e.x + e.face * 22, y: e.y - 40,
              vx: e.face * 280, life: 1.3, dmg: 2, kind: 'laser', w: 18
            });
          }
          audio.beam();
          popSpark(e.x + e.face * 20, e.y - 26, RED, 12);
        }
      }
      if (e.kind === 'mag' && e.act === 'throw' && !e.atkHit && e.atkT < 0.18) {
        e.atkHit = true;
        G.bullets.push({ x: e.x + e.face * 14, y: e.y - 24, vx: e.face * 210, vy: -50, life: 1.5, dmg: 2, kind: 'orb' });
        G.bullets.push({ x: e.x + e.face * 14, y: e.y - 18, vx: e.face * 240, vy: 0, life: 1.5, dmg: 2, kind: 'orb' });
        G.bullets.push({ x: e.x + e.face * 14, y: e.y - 12, vx: e.face * 210, vy: 40, life: 1.5, dmg: 2, kind: 'orb' });
        audio.beam();
      }
      if (e.kind === 'mag' && e.act === 'pull') {
        if (p && playing() && G.deadT <= 0) {
          p.x += (e.x > p.x ? 1 : -1) * 110 * dt;
        }
        emit(1, {
          x: lerp(p.x, e.x, 0.4), y: e.y - 20, j: 8,
          vx0: -20, vx1: 20, vy0: -20, vy1: 20,
          r0: 1.2, r1: 2.4, life: 0.22, rgb: MAG, g: 0
        });
        if (e.atkT <= 0) e.cd = 0.8;
      }
      if ((e.kind === 'grunt' || e.kind === 'mag' || e.kind === 'sent') && e.act === 'melee' && !e.atkHit && e.atkT < 0.16 && e.atkT > 0.04) {
        if (overlapPlayer(e) && Math.abs(p.y - e.y) < (e.fly ? 36 : 26)) {
          e.atkHit = true;
          hurtPlayer(e.dmg, e.x, 150);
        }
      }
      if (e.kind === 'drone' && e.act === 'dive' && !e.atkHit) {
        e.x += e.face * 160 * dt;
        e.y += 90 * dt;
        if (!e.atkHit && overlapPlayer(e)) {
          e.atkHit = true;
          hurtPlayer(e.dmg, e.x, 120);
        }
        if (e.atkT <= 0) {
          e.act = 'idle';
          e.cd = 0.9;
        }
        return;
      }
      if (e.atkT <= 0) e.act = 'idle';
      if (!e.fly) {
        e.vy += GRAV * dt;
        e.y += e.vy * dt;
        if (e.y >= GY) { e.y = GY; e.vy = 0; e.grounded = true; }
      }
      return;
    }

    if (e.fly) {
      hover = e.hover + Math.sin(G.clock * 3 + e.x * 0.01) * 8;
      e.y = lerp(e.y, hover, Math.min(1, 4 * dt));
      if (G.mode === 'title') {
        e.x += e.face * e.spd * 0.3 * dt;
        e.act = 'walk';
        return;
      }
      if (dist > 90) e.x += e.face * e.spd * dt;
      else if (dist < 50) e.x -= e.face * e.spd * 0.5 * dt;
      if (e.cd <= 0 && dist < 180 && dist > 40) {
        e.act = 'dive';
        e.atkT = 0.55;
        e.atkHit = false;
        e.cd = rand(1.2, 1.8);
      } else e.act = 'walk';
      cap = G.arena ? G.lockR : G.levelW - 20;
      e.x = clamp(e.x, G.arena ? G.lockL : 20, cap);
      return;
    }

    e.vy += GRAV * dt;
    e.y += e.vy * dt;
    if (e.y >= GY) { e.y = GY; e.vy = 0; e.grounded = true; }
    else e.grounded = false;

    if (G.mode === 'title') {
      want = dist > 40 ? (dx > 0 ? 1 : -1) * e.spd * 0.45 : 0;
      e.x += want * dt;
      e.act = want ? 'walk' : 'idle';
      return;
    }

    if (e.kind === 'gun') {
      if (dist < 150) e.x -= e.face * e.spd * 0.7 * dt;
      else if (dist > 280) e.x += e.face * e.spd * dt;
      else if (e.cd <= 0 && Math.abs(p.y - e.y) < 70) {
        e.act = 'atk';
        e.atkT = 0.34;
        e.atkHit = false;
        e.cd = rand(1.1, 1.7);
      }
      e.act = e.atkT > 0 ? 'atk' : (dist > 40 ? 'walk' : 'idle');
    } else if (e.kind === 'sent') {
      if (e.cd <= 0 && dist < 340) {
        if (dist > 70) {
          e.act = 'atk';
          e.atkT = 0.42;
          e.atkHit = false;
          e.cd = rand(1.2, 1.8);
        } else {
          e.act = 'melee';
          e.atkT = 0.34;
          e.atkHit = false;
          e.cd = 0.8;
        }
      } else {
        e.x += e.face * e.spd * dt;
        e.act = 'walk';
      }
    } else if (e.kind === 'prime') {
      if (e.act === 'tired') {
        if (e.cd <= 0) e.act = 'idle';
      } else if (dist < 240 && e.cd <= 0 && e.grounded && hash2((G.t * 20 + e.x) | 0) > 0.5) {
        e.act = 'snort';
        e.atkT = 0.42;
        e.cd = 1.7;
        audio.boss();
      } else if (e.cd <= 0 && dist < 320 && dist > 80) {
        e.act = 'atk';
        e.atkT = 0.4;
        e.atkHit = false;
        e.cd = rand(1.0, 1.5);
      } else {
        e.x += e.face * e.spd * dt;
        e.act = 'walk';
      }
    } else if (e.kind === 'mag') {
      if (e.cd <= 0 && dist < 340) {
        if (dist > 80 && hash2((G.t * 100 + e.x) | 0) > 0.42) {
          if (hash2((G.t * 40) | 0) > 0.55) {
            e.act = 'throw';
            e.atkT = 0.4;
            e.atkHit = false;
            e.cd = rand(0.9, 1.5);
          } else {
            e.act = 'pull';
            e.atkT = 0.7;
            e.atkHit = false;
            e.cd = 1.4;
            audio.boss();
            popRing(e.x, e.y - 20, MAG, 24);
          }
        } else if (dist < 50) {
          e.act = 'melee';
          e.atkT = 0.32;
          e.atkHit = false;
          e.cd = 0.7;
        } else {
          e.x += e.face * e.spd * 1.1 * dt;
          e.act = 'walk';
        }
      } else {
        e.x += e.face * e.spd * dt;
        e.act = 'walk';
      }
    } else {
      if (dist > e.reach - 2) {
        e.x += e.face * e.spd * dt;
        e.act = 'walk';
      } else if (e.cd <= 0) {
        e.act = 'melee';
        e.atkT = 0.3;
        e.atkHit = false;
        e.cd = rand(0.45, 0.85);
      } else e.act = 'idle';
    }
    cap = G.arena ? G.lockR : G.levelW - 20;
    e.x = clamp(e.x, G.arena ? G.lockL : 20, cap);
    e.squash = lerp(e.squash, 1, 10 * dt);
  }

  function updateBullets(dt) {
    var i, b, p = G.player;
    for (i = G.bullets.length - 1; i >= 0; i--) {
      b = G.bullets[i];
      b.x += b.vx * dt;
      if (b.vy) b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.x < G.camX - 40 || b.x > G.camX + VW + 40) {
        G.bullets.splice(i, 1);
        continue;
      }
      if (!p || G.invuln > 0 || G.deadT > 0 || G.mode === 'title') continue;
      if (Math.abs(b.x - p.x) < (b.w ? 14 : 10) && Math.abs(b.y - (p.y - 16)) < 12) {
        G.bullets.splice(i, 1);
        hurtPlayer(b.dmg || 2, b.x - b.vx, 120);
      }
    }
  }

  function updateBeams(dt) {
    var i, j, b, e, c;
    for (i = G.beams.length - 1; i >= 0; i--) {
      b = G.beams[i];
      b.x += b.vx * dt;
      b.life -= dt;
      if (b.life <= 0 || b.x < G.camX - 40 || b.x > G.camX + VW + 40 || b.pierce <= 0) {
        G.beams.splice(i, 1);
        continue;
      }
      for (j = 0; j < G.ents.length; j++) {
        e = G.ents[j];
        if (e.dead || b.hit[j]) continue;
        if (Math.abs(e.x - b.x) < (e.w * 0.5 + 10) && Math.abs((e.y - e.h * 0.5) - b.y) < e.h * 0.55 + 8) {
          b.hit[j] = true;
          b.pierce -= 1;
          applyHit(e, b.dmg, 80, b.vx > 0 ? 1 : -1, false, 0.05, 'eye');
        }
      }
      for (j = 0; j < G.crates.length; j++) {
        c = G.crates[j];
        if (c.dead) continue;
        if (Math.abs(c.x - b.x) < 14 && Math.abs(GY - 12 - b.y) < 18) {
          smashCrate(c, { reach: 40 }, G.player || { x: c.x - 10, y: GY, face: 1 });
          b.pierce -= 1;
        }
      }
    }
  }

  function takePickup(z, kind) {
    z.taken = true;
    if (kind === 'gem') {
      giveSp(1);
      addScore(SCORE.gem);
      audio.gem();
      toast('晶核', false, true);
      popRing(z.x, z.y, CYN, 18);
      emit(10, {
        x: z.x, y: z.y, j: 6,
        vx0: -80, vx1: 80, vy0: -180, vy1: -20,
        r0: 1.4, r1: 3, life: 0.4, rgb: CYN
      });
    } else {
      G.hp = Math.min(HP_MAX, G.hp + 5);
      addScore(SCORE.aid);
      audio.aid();
      toast('急救', false, true);
      popRing(z.x, z.y, GOLD, 18);
      emit(10, {
        x: z.x, y: z.y, j: 6,
        vx0: -80, vx1: 80, vy0: -180, vy1: -20,
        r0: 1.4, r1: 3, life: 0.4, rgb: GOLD
      });
    }
    syncHud();
  }

  function updatePickups(dt) {
    var i, z, p = G.player, c;
    if (!p) return;
    for (i = 0; i < G.gems.length; i++) {
      z = G.gems[i];
      if (z.taken) continue;
      z.bob += dt * 4;
      if (G.mode === 'title' || G.deadT > 0) continue;
      if (Math.abs(z.x - p.x) < 16 && Math.abs(z.y - (p.y - 10)) < 22) takePickup(z, 'gem');
    }
    for (i = 0; i < G.aids.length; i++) {
      z = G.aids[i];
      if (z.taken) continue;
      z.bob += dt * 4;
      if (G.mode === 'title' || G.deadT > 0) continue;
      if (Math.abs(z.x - p.x) < 16 && Math.abs(z.y - (p.y - 10)) < 22) takePickup(z, 'aid');
    }
    for (i = 0; i < G.crates.length; i++) {
      c = G.crates[i];
      if (c.dead && c.deadT > 0) c.deadT -= dt;
    }
  }

  function updateWaves(dt) {
    var i, s;
    if (!isHunt() || !playing()) return;
    G.waveT -= dt;
    for (i = G.spawnQ.length - 1; i >= 0; i--) {
      s = G.spawnQ[i];
      s.t -= dt;
      if (s.t <= 0) {
        G.ents.push(makeEnt(s.x, s.kind, G.wave));
        G.spawnQ.splice(i, 1);
      }
    }
  }

  function nextStageOrWave() {
    if (isHunt()) {
      G.gems.push(makeGem(clamp((G.player ? G.player.x : 400) + 80, 60, G.levelW - 60)));
      spawnWave(G.wave + 1);
      G.hp = Math.min(HP_MAX, G.hp + 2);
      giveSp(1);
      addScore(SCORE.wave * G.wave);
      syncHud();
      return;
    }
    if (G.stage >= STAGES.length) {
      addScore(SCORE.stage * G.stage);
      goWin();
      return;
    }
    addScore(SCORE.stage * G.stage);
    G.hp = Math.min(HP_MAX, G.hp + 4);
    giveSp(1);
    loadStage(G.stage + 1, false);
    G.invuln = 0.6;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    setHint(G.stage === 2 ? '工场 · 精卫会冲撞，跳开射束再打' : '星核 · 磁王会吸人，跳开磁球再近身', G.stage === 3 ? 'hot' : '');
    syncHud();
  }

  function checkClear(dt) {
    var boss;
    if (!playing()) return;
    boss = findBoss();
    if (boss && G.player && G.player.x > boss.x - 380) {
      if (!G.arena) {
        G.arena = true;
        G.lockL = Math.max(20, boss.x - 360);
        G.lockR = Math.min(G.levelW - 20, boss.x + 120);
        toast(KINDS[boss.kind].name + '来了', true, false);
        audio.boss();
        kick(3, 'boom');
      }
    }
    if (G.clearT > 0) {
      if (livingCount() > 0 || G.spawnQ.length) {
        G.clearT = 0;
        return;
      }
      G.clearT -= dt;
      if (G.clearT <= 0) nextStageOrWave();
      return;
    }
    if (livingCount() > 0) return;
    if (G.spawnQ.length) return;
    G.clearT = isHunt() ? 0.85 : 1.05;
  }

  function updateCam(dt) {
    var p = G.player;
    var target, maxX;
    if (!p) return;
    target = p.x - 200;
    maxX = Math.max(0, G.levelW - VW);
    if (G.arena) {
      target = clamp(target, G.lockL - 40, G.lockR - VW + 80);
    }
    target = clamp(target, 0, maxX);
    G.camX = lerp(G.camX, target, Math.min(1, 6 * dt));
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, Math.min(1, 8 * dt));
  }

  function updateFx(dt) {
    var i, p, s, r, f, t;
    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      s = sparks[i];
      s.t += dt;
      if (s.t > 0.18) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      r = rings[i];
      r.t += dt;
      if (r.t > 0.32) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      f = floats[i];
      f.t += dt;
      f.y -= 28 * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (i = trails.length - 1; i >= 0; i--) {
      t = trails[i];
      t.t += dt;
      if (t.t > t.life) trails.splice(i, 1);
    }
  }

  function update(dt) {
    var i;
    G.clock += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.35);
      return;
    }
    G.t += dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) dropCombo();
    }
    if (playing()) {
      G.spRegen += dt;
      if (G.spRegen >= SP_REGEN) {
        G.spRegen = 0;
        if (G.sp < SP_MAX) giveSp(1);
      }
    }
    updateFx(dt);
    if (G.mode === 'title') {
      demoThink();
      updatePlayer(dt);
      updateAtk(dt);
      updateSpecial(dt);
      for (i = G.ents.length - 1; i >= 0; i--) {
        updateEnt(G.ents[i], dt);
        if (G.ents[i].dead && G.ents[i].deadT < 0) G.ents.splice(i, 1);
      }
      updateBullets(dt);
      updateBeams(dt);
      updatePickups(dt);
      updateCam(dt);
      return;
    }
    if (!playing()) {
      updateCam(dt);
      return;
    }
    updatePlayer(dt);
    updateAtk(dt);
    updateSpecial(dt);
    for (i = G.ents.length - 1; i >= 0; i--) {
      updateEnt(G.ents[i], dt);
      if (G.ents[i].dead && G.ents[i].deadT < 0) G.ents.splice(i, 1);
    }
    updateBullets(dt);
    updateBeams(dt);
    updatePickups(dt);
    updateWaves(dt);
    checkClear(dt);
    updateCam(dt);
  }

  function fillRound(x, y, w, h, r) {
    var rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
    ctx.fill();
  }

  function drawSky() {
    var g, i, px, py, tw;
    g = ctx.createLinearGradient(0, oy, 0, oy + VH * scale);
    if (G.theme === 'factory') {
      g.addColorStop(0, '#1a0c10');
      g.addColorStop(0.5, '#1c1014');
      g.addColorStop(1, '#241418');
    } else if (G.theme === 'astro') {
      g.addColorStop(0, '#08041a');
      g.addColorStop(0.5, '#100828');
      g.addColorStop(1, '#180c2c');
    } else {
      g.addColorStop(0, '#0c0618');
      g.addColorStop(0.45, '#140c22');
      g.addColorStop(1, '#1a1028');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    if (G.theme === 'street') {
      ctx.fillStyle = 'rgba(255,227,107,0.12)';
      ctx.beginPath();
      ctx.arc(sx(G.camX + 520), sy(48), 22 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,227,107,0.45)';
      ctx.beginPath();
      ctx.arc(sx(G.camX + 520), sy(48), 8 * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < 22; i++) {
      tw = hash2(i * 19 + (G.theme === 'astro' ? 7 : 1));
      px = ((i * 137 + G.camX * 0.12) % (VW + 40)) - 20;
      py = 18 + tw * 90;
      ctx.fillStyle = rgba(WHT, 0.14 + tw * 0.28);
      ctx.fillRect(ox + px * scale, oy + py * scale, 1.4 * scale, 1.4 * scale);
    }
    if (G.theme === 'astro') {
      ctx.fillStyle = rgba(HOT, 0.08 + 0.04 * Math.sin(G.clock));
      ctx.beginPath();
      ctx.ellipse(sx(G.camX + 480), sy(70), 90 * scale, 28 * scale, 0.2, 0, TAU);
      ctx.fill();
    }
  }

  function drawBuildings() {
    var x, w, h, b, wy, wx, lit, sign;
    var start = ((G.camX / 70) | 0) - 1;
    var end = start + 16;
    for (b = start; b < end; b++) {
      x = b * 70;
      w = 54 + hash2(b * 3) * 18;
      h = 90 + hash2(b * 7) * 80;
      if (G.theme === 'factory') {
        ctx.fillStyle = b % 3 === 0 ? '#2a1820' : '#22141c';
        ctx.fillRect(sx(x), sy(GY - 8 - h), w * scale, (h + 10) * scale);
        ctx.fillStyle = 'rgba(255,90,40,0.12)';
        ctx.fillRect(sx(x + 8), sy(GY - h + 10), 8 * scale, h * 0.6 * scale);
        ctx.fillStyle = rgba(RED, 0.18 + 0.1 * Math.sin(G.clock * 2 + b));
        ctx.fillRect(sx(x + 6), sy(GY - h + 16), (w - 12) * scale, 5 * scale);
        if (hash2(b) > 0.55) {
          ctx.strokeStyle = 'rgba(160,90,70,0.45)';
          ctx.lineWidth = 3 * scale;
          ctx.beginPath();
          ctx.moveTo(sx(x + 4), sy(GY - 50));
          ctx.lineTo(sx(x + w - 4), sy(GY - 50));
          ctx.stroke();
        }
      } else if (G.theme === 'astro') {
        ctx.fillStyle = b % 2 === 0 ? '#1a1030' : '#221438';
        fillRound(sx(x + 6), sy(GY - 8 - h * 0.7), (w - 8) * scale, (h * 0.7 + 10) * scale, 8 * scale);
        ctx.fillStyle = rgba(HOT, 0.14 + 0.08 * Math.sin(G.clock * 2 + b));
        ctx.fillRect(sx(x + 14), sy(GY - h * 0.55), (w - 24) * scale, 6 * scale);
        ctx.fillStyle = 'rgba(180,190,220,0.16)';
        ctx.fillRect(sx(x + w * 0.45), sy(GY - h * 0.7 - 18), 3 * scale, 22 * scale);
      } else {
        ctx.fillStyle = b % 2 === 0 ? '#1a1028' : '#140c20';
        ctx.fillRect(sx(x), sy(GY - 8 - h), w * scale, (h + 10) * scale);
        ctx.fillStyle = 'rgba(180,76,255,0.06)';
        ctx.fillRect(sx(x), sy(GY - 8 - h), 3 * scale, (h + 10) * scale);
        for (wy = 16; wy < h - 20; wy += 16) {
          for (wx = 8; wx < w - 10; wx += 12) {
            lit = hash2(b * 31 + wy + wx) > 0.55;
            ctx.fillStyle = lit
              ? (hash2(b + wx) > 0.7 ? rgba(GOLD, 0.45) : rgba(CYN, 0.28))
              : 'rgba(8,6,16,0.7)';
            ctx.fillRect(sx(x + wx), sy(GY - h + wy), 7 * scale, 8 * scale);
          }
        }
        if (hash2(b * 11) > 0.72) {
          sign = hash2(b * 5) > 0.5 ? 'X' : 'MUTANT';
          ctx.fillStyle = rgba(hash2(b) > 0.5 ? MAG : GOLD, 0.55);
          ctx.font = (7 * scale) + 'px sans-serif';
          ctx.fillText(sign, sx(x + 8), sy(GY - h + 12));
        }
      }
    }
  }

  function drawGround() {
    var g, i, x;
    g = ctx.createLinearGradient(0, sy(GY - 6), 0, sy(VH));
    if (G.theme === 'factory') {
      g.addColorStop(0, '#3a2428');
      g.addColorStop(0.35, '#221418');
      g.addColorStop(1, '#14080c');
    } else if (G.theme === 'astro') {
      g.addColorStop(0, '#2a1840');
      g.addColorStop(1, '#100818');
    } else {
      g.addColorStop(0, '#2a1a38');
      g.addColorStop(0.4, '#1a1024');
      g.addColorStop(1, '#0c0814');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(G.camX - 20), sy(GY), (VW + 40) * scale, (VH - GY + 20) * scale);
    ctx.fillStyle = rgba(HOT, 0.35);
    ctx.fillRect(sx(G.camX - 20), sy(GY), (VW + 40) * scale, 2 * scale);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (i = 0; i < 14; i++) {
      x = ((i * 90 - G.camX * 0.4) % (VW + 80)) + G.camX - 40;
      ctx.fillRect(sx(x), sy(GY + 10), 40 * scale, 3 * scale);
    }
  }

  function drawShadow(x, y, s) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y), 10 * scale * s, 3.2 * scale * s, 0, 0, TAU);
    ctx.fill();
  }

  function drawCrate(c) {
    var sc, x, y;
    if (c.dead && c.deadT <= 0) return;
    sc = scale * (c.dead ? 0.7 : 1);
    x = sx(c.x);
    y = sy(GY);
    ctx.save();
    ctx.translate(x, y);
    if (c.dead) ctx.rotate(0.4);
    ctx.fillStyle = c.dead ? 'rgba(90,70,50,0.4)' : '#6a4a28';
    fillRound(-10 * sc, -20 * sc, 20 * sc, 20 * sc, 2 * sc);
    ctx.strokeStyle = rgba(GOLD, 0.45);
    ctx.lineWidth = 1.4 * sc;
    ctx.strokeRect(-8 * sc, -18 * sc, 16 * sc, 16 * sc);
    ctx.fillStyle = rgba(HOT, 0.55);
    ctx.font = (8 * sc) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('X', 0, -6 * sc);
    ctx.restore();
  }

  function drawPickup(z, rgb, glyph) {
    var bob;
    if (z.taken) return;
    bob = Math.sin(z.bob) * 4;
    ctx.save();
    ctx.translate(sx(z.x), sy(z.y + bob));
    ctx.fillStyle = rgba(rgb, 0.22);
    ctx.beginPath();
    ctx.arc(0, 0, 10 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -7 * scale);
    ctx.lineTo(5 * scale, 0);
    ctx.lineTo(0, 7 * scale);
    ctx.lineTo(-5 * scale, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = (7 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyph, 0, 0);
    ctx.restore();
  }

  function drawMutantBody(p, hide) {
    var m = mutant();
    var sc = scale;
    var x = sx(p.x);
    var y = sy(p.y);
    var bob = p.act === 'walk' ? Math.sin(p.run) * 1.6 * sc : 0;
    var atk = p.act === 'atk' || p.act === 'spin' || p.act === 'sp';
    var leg = p.act === 'walk' ? Math.sin(p.run) * 4 * sc : 0;
    var id = m.id;
    if (hide) return;
    ctx.save();
    ctx.translate(x, y);
    if (p.act === 'down') { ctx.rotate(-0.5 * (p.face || 1)); ctx.translate(0, 6 * sc); }
    ctx.scale(p.face || 1, p.squash || 1);

    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(0, 1 * sc, 9 * sc, 2.4 * sc, 0, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = rgba(m.suit, 0.95);
    ctx.lineWidth = 3 * sc;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3 * sc, -8 * sc);
    ctx.lineTo(-4 * sc - leg, 0);
    ctx.moveTo(3 * sc, -8 * sc);
    ctx.lineTo(4 * sc + leg, 0);
    ctx.stroke();

    ctx.fillStyle = rgba(m.suit, 0.98);
    ctx.beginPath();
    ctx.moveTo(-7 * sc, -10 * sc + bob);
    ctx.lineTo(7 * sc, -11 * sc + bob);
    ctx.lineTo(5.4 * sc, -24 * sc + bob);
    ctx.lineTo(-5.4 * sc, -23 * sc + bob);
    ctx.fill();
    if (id === 'claw') {
      ctx.fillStyle = '#1a1410';
      ctx.fillRect(-5 * sc, -16 * sc + bob, 10 * sc, 2.2 * sc);
    } else if (id === 'eye') {
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(-5 * sc, -16 * sc + bob, 10 * sc, 2 * sc);
    } else if (id === 'storm') {
      ctx.fillStyle = rgba(WHT, 0.55);
      ctx.beginPath();
      ctx.moveTo(-2 * sc, -18 * sc + bob);
      ctx.quadraticCurveTo(-16 * sc, -6 * sc + Math.sin(G.clock * 5) * 3 * sc, -4 * sc, 0);
      ctx.lineTo(2 * sc, -8 * sc);
      ctx.fill();
    }

    ctx.strokeStyle = rgba(SKIN, 0.95);
    ctx.lineWidth = 2.4 * sc;
    ctx.beginPath();
    ctx.moveTo(-5 * sc, -20 * sc + bob);
    ctx.lineTo(-9 * sc, (atk ? -14 : -12) * sc + bob);
    ctx.moveTo(5 * sc, -20 * sc + bob);
    ctx.lineTo(8 * sc + (atk ? 8 * sc : 0), (atk ? -24 : -16) * sc + bob);
    ctx.stroke();

    if (id === 'claw') {
      ctx.strokeStyle = rgba(STEEL, 0.95);
      ctx.lineWidth = 1.5 * sc;
      ctx.beginPath();
      ctx.moveTo(8 * sc + (atk ? 8 * sc : 0), (atk ? -24 : -16) * sc + bob);
      ctx.lineTo(16 * sc + (atk ? 10 * sc : 2 * sc), (atk ? -28 : -18) * sc + bob);
      ctx.moveTo(8 * sc + (atk ? 8 * sc : 0), (atk ? -22 : -14) * sc + bob);
      ctx.lineTo(15 * sc + (atk ? 10 * sc : 2 * sc), (atk ? -22 : -12) * sc + bob);
      ctx.moveTo(-9 * sc, (atk ? -14 : -12) * sc + bob);
      ctx.lineTo(-14 * sc, (atk ? -16 : -10) * sc + bob);
      ctx.stroke();
    } else if (id === 'ice') {
      ctx.fillStyle = rgba(CYN, 0.85);
      ctx.beginPath();
      ctx.moveTo(8 * sc + (atk ? 8 * sc : 0), (atk ? -26 : -18) * sc + bob);
      ctx.lineTo(18 * sc + (atk ? 8 * sc : 0), (atk ? -20 : -12) * sc + bob);
      ctx.lineTo(8 * sc + (atk ? 8 * sc : 0), (atk ? -14 : -8) * sc + bob);
      ctx.fill();
    } else if (id === 'storm') {
      ctx.strokeStyle = rgba(HOT2, atk ? 0.95 : 0.45);
      ctx.lineWidth = 1.6 * sc;
      ctx.beginPath();
      ctx.moveTo(8 * sc + (atk ? 6 * sc : 0), (atk ? -26 : -16) * sc + bob);
      ctx.lineTo(14 * sc + (atk ? 8 * sc : 0), (atk ? -18 : -10) * sc + bob);
      ctx.lineTo(20 * sc + (atk ? 6 * sc : 0), (atk ? -24 : -14) * sc + bob);
      ctx.stroke();
    } else if (id === 'eye' && (atk || G.spKind === 'beam')) {
      ctx.fillStyle = rgba(RED, 0.9);
      ctx.fillRect(6 * sc, -22 * sc + bob, (atk ? 18 : 8) * sc, 2.2 * sc);
    }

    ctx.fillStyle = rgba(SKIN, 1);
    ctx.beginPath();
    ctx.arc(1 * sc, -29 * sc + bob, 5.5 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(m.hair, 1);
    if (id === 'storm') {
      ctx.beginPath();
      ctx.moveTo(-4 * sc, -32 * sc + bob);
      ctx.lineTo(1 * sc, -42 * sc + bob);
      ctx.lineTo(6 * sc, -32 * sc + bob);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(1 * sc, -31 * sc + bob, 5.6 * sc, 3.2 * sc, 0, 0, TAU);
      ctx.fill();
    }
    if (id === 'eye') {
      ctx.fillStyle = rgba(RED, 0.95);
      ctx.fillRect(-4.4 * sc, -30.4 * sc + bob, 10 * sc, 2.4 * sc);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(-2 * sc, -29.8 * sc + bob, 6 * sc, 1.2 * sc);
    } else {
      ctx.fillStyle = '#f4fff8';
      ctx.beginPath();
      ctx.ellipse(3.4 * sc, -28.6 * sc + bob, 1.4 * sc, 1.6 * sc, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#102018';
      ctx.beginPath();
      ctx.arc(3.8 * sc, -28.4 * sc + bob, 0.8 * sc, 0, TAU);
      ctx.fill();
    }

    if (G.hurtT > 0 || p.act === 'hurt') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-12 * sc, -44 * sc, 26 * sc, 46 * sc);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawGrunt(e) {
    var sc = scale * (e.scale || 1);
    var x = sx(e.x);
    var y = sy(e.y);
    var bob = e.act === 'walk' ? Math.sin(e.run || 0) * 1.6 * sc : 0;
    var atk = e.act === 'atk' || e.act === 'melee' || e.act === 'throw';
    var leg = e.act === 'walk' ? Math.sin(e.run || 0) * 4 * sc : 0;
    var pal = e.kind === 'gun' ? [72, 52, 96] : [88, 48, 58];
    ctx.save();
    ctx.translate(x, y);
    if (e.act === 'down') { ctx.rotate(-0.5 * (e.face || 1)); ctx.translate(0, 6 * sc); }
    ctx.scale(e.face || 1, e.squash || 1);

    ctx.strokeStyle = '#2a1828';
    ctx.lineWidth = 3 * sc;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3 * sc, -8 * sc);
    ctx.lineTo(-4 * sc - leg, 0);
    ctx.moveTo(3 * sc, -8 * sc);
    ctx.lineTo(4 * sc + leg, 0);
    ctx.stroke();

    ctx.fillStyle = rgba(pal, 0.98);
    ctx.beginPath();
    ctx.moveTo(-7 * sc, -10 * sc + bob);
    ctx.lineTo(7 * sc, -11 * sc + bob);
    ctx.lineTo(5.2 * sc, -24 * sc + bob);
    ctx.lineTo(-5.2 * sc, -23 * sc + bob);
    ctx.fill();
    ctx.fillStyle = rgba(STEEL, 0.85);
    ctx.fillRect(-5 * sc, -14 * sc + bob, 10 * sc, 2 * sc);

    ctx.strokeStyle = rgba(SKIN, 0.95);
    ctx.lineWidth = 2.3 * sc;
    ctx.beginPath();
    ctx.moveTo(-5 * sc, -20 * sc + bob);
    ctx.lineTo(-9 * sc, -12 * sc + bob);
    ctx.moveTo(5 * sc, -20 * sc + bob);
    ctx.lineTo(6 * sc + (atk ? 14 * sc : 0), (atk ? -22 : -16) * sc + bob);
    ctx.stroke();
    if (e.kind === 'gun') {
      ctx.fillStyle = '#3a2a1c';
      ctx.fillRect(6 * sc + (atk ? 10 * sc : 2 * sc), -20 * sc + bob, 12 * sc, 3 * sc);
      ctx.fillRect(16 * sc + (atk ? 10 * sc : 2 * sc), -22 * sc + bob, 3 * sc, 6 * sc);
    }

    ctx.fillStyle = rgba(SKIN, 1);
    ctx.beginPath();
    ctx.arc(0, -29 * sc + bob, 5.2 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1024';
    ctx.beginPath();
    ctx.ellipse(0, -29 * sc + bob, 5.4 * sc, 3.2 * sc, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.35);
    ctx.fillRect(-4 * sc, -28 * sc + bob, 8 * sc, 1.2 * sc);

    if (e.freeze > 0) {
      ctx.strokeStyle = rgba(CYN, 0.7);
      ctx.lineWidth = 1.4 * sc;
      ctx.strokeRect(-10 * sc, -38 * sc, 20 * sc, 38 * sc);
    }
    if (e.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.32);
      ctx.fillRect(-10 * sc, -40 * sc, 22 * sc, 42 * sc);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawDrone(e) {
    var sc = scale * (e.scale || 1);
    var x = sx(e.x);
    var y = sy(e.y);
    var spin = G.clock * 10;
    ctx.save();
    ctx.translate(x, y);
    if (e.act === 'down') ctx.rotate(0.4);
    ctx.scale(e.face || 1, 1);
    ctx.fillStyle = rgba(STEEL, 0.95);
    fillRound(-10 * sc, -10 * sc, 20 * sc, 12 * sc, 4 * sc);
    ctx.fillStyle = rgba(RED, e.act === 'dive' ? 0.95 : 0.55);
    ctx.fillRect(-4 * sc, -7 * sc, 8 * sc, 4 * sc);
    ctx.strokeStyle = rgba(CYN, 0.5);
    ctx.lineWidth = 1.4 * sc;
    ctx.beginPath();
    ctx.moveTo(-12 * sc, -4 * sc);
    ctx.lineTo(-18 * sc, -4 * sc + Math.sin(spin) * 3 * sc);
    ctx.moveTo(12 * sc, -4 * sc);
    ctx.lineTo(18 * sc, -4 * sc + Math.cos(spin) * 3 * sc);
    ctx.stroke();
    ctx.fillStyle = rgba(STEEL2, 0.9);
    ctx.fillRect(-3 * sc, 2 * sc, 6 * sc, 4 * sc);
    if (e.flash > 0 || e.freeze > 0) {
      ctx.strokeStyle = rgba(e.freeze > 0 ? CYN : WHT, 0.6);
      ctx.strokeRect(-12 * sc, -12 * sc, 24 * sc, 18 * sc);
    }
    ctx.restore();
  }

  function drawSent(e) {
    var sc = scale * (e.scale || 1);
    var x = sx(e.x);
    var y = sy(e.y);
    var bob = e.act === 'walk' ? Math.sin(e.run || 0) * 1.2 * sc : 0;
    var charge = e.act === 'charge';
    var prime = e.kind === 'prime';
    ctx.save();
    ctx.translate(x, y);
    if (e.act === 'down') ctx.rotate(-0.35 * (e.face || 1));
    ctx.scale(e.face || 1, e.squash || 1);
    if (charge) ctx.rotate(-0.16);

    ctx.fillStyle = prime ? '#8a9098' : '#6a7280';
    fillRound(-11 * sc, -36 * sc + bob, 24 * sc, 32 * sc, 4 * sc);
    ctx.fillStyle = prime ? '#5a6270' : '#3a4050';
    fillRound(-8 * sc, -26 * sc + bob, 16 * sc, 10 * sc, 2 * sc);
    ctx.fillStyle = rgba(RED, e.act === 'atk' ? 0.95 : 0.55);
    ctx.fillRect(-5 * sc, -24 * sc + bob, 12 * sc, 5 * sc);
    ctx.fillStyle = '#4a5260';
    ctx.fillRect(-9 * sc, -8 * sc, 6 * sc, 10 * sc);
    ctx.fillRect(5 * sc, -8 * sc, 6 * sc, 10 * sc);
    ctx.fillStyle = prime ? '#9aa0aa' : '#7a828c';
    fillRound(-8 * sc, -48 * sc + bob, 18 * sc, 14 * sc, 3 * sc);
    ctx.fillStyle = '#1a1810';
    ctx.fillRect(2 * sc, -44 * sc + bob, 6 * sc, 3 * sc);
    ctx.fillStyle = rgba(RED, 0.8);
    ctx.fillRect(3 * sc, -43.4 * sc + bob, 4 * sc, 1.6 * sc);
    if (prime) {
      ctx.fillStyle = rgba(GOLD, 0.5);
      ctx.fillRect(-6 * sc, -32 * sc + bob, 14 * sc, 2 * sc);
    }
    if (e.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.3);
      ctx.fillRect(-14 * sc, -52 * sc, 30 * sc, 56 * sc);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawMag(e) {
    var sc = scale * (e.scale || 1);
    var x = sx(e.x);
    var y = sy(e.y);
    var bob = e.act === 'walk' ? Math.sin(e.run || 0) * 1.4 * sc : Math.sin(G.clock * 3) * 2 * sc;
    var atk = e.act === 'melee' || e.act === 'throw' || e.act === 'pull';
    ctx.save();
    ctx.translate(x, y);
    if (e.act === 'down') ctx.rotate(-0.5 * (e.face || 1));
    ctx.scale(e.face || 1, e.squash || 1);

    ctx.fillStyle = 'rgba(140,20,70,0.85)';
    ctx.beginPath();
    ctx.moveTo(-2 * sc, -18 * sc + bob);
    ctx.quadraticCurveTo(-22 * sc, -8 * sc + Math.sin(G.clock * 4) * 3 * sc, -10 * sc, 0);
    ctx.lineTo(2 * sc, -8 * sc);
    ctx.fill();

    ctx.fillStyle = '#6a1840';
    fillRound(-7 * sc, -14 * sc + bob, 16 * sc, 14 * sc, 2 * sc);
    ctx.fillStyle = rgba(GOLD, 0.7);
    ctx.fillRect(-4 * sc, -10 * sc + bob, 10 * sc, 1.6 * sc);

    ctx.strokeStyle = rgba(SKIN, 0.95);
    ctx.lineWidth = 2.2 * sc;
    ctx.beginPath();
    ctx.moveTo(-5 * sc, -20 * sc + bob);
    ctx.lineTo(-10 * sc, -10 * sc + bob);
    ctx.moveTo(6 * sc, -20 * sc + bob);
    ctx.lineTo(8 * sc + (atk ? 12 * sc : 4 * sc), (atk ? -28 : -14) * sc + bob);
    ctx.stroke();

    ctx.fillStyle = '#d0d4dc';
    ctx.beginPath();
    ctx.moveTo(-6 * sc, -26 * sc + bob);
    ctx.lineTo(0, -40 * sc + bob);
    ctx.lineTo(8 * sc, -26 * sc + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1a1010';
    ctx.fillRect(2 * sc, -30 * sc + bob, 2 * sc, 1.6 * sc);
    ctx.fillStyle = rgba(MAG, e.act === 'pull' ? 0.95 : 0.55);
    ctx.fillRect(-2 * sc, -24 * sc + bob, 8 * sc, 1.6 * sc);

    if (e.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.3);
      ctx.fillRect(-12 * sc, -42 * sc, 26 * sc, 44 * sc);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawEnt(e) {
    if (e.dead && e.deadT < 0) return;
    if (e.dead && e.deadT < 0.2 && ((G.t * 24) | 0) % 2 === 0) return;
    drawShadow(e.x, e.y, e.scale || 1);
    if (e.kind === 'sent' || e.kind === 'prime') drawSent(e);
    else if (e.kind === 'mag') drawMag(e);
    else if (e.kind === 'drone') drawDrone(e);
    else drawGrunt(e);
    if (e.max && e.hp < e.max && e.hp > 0 && !e.dead) {
      var bw = 22 * scale * (e.scale || 1);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(sx(e.x) - bw / 2, sy(e.y - (e.h + 10) * (e.scale > 1.1 ? 1 : 1.15)), bw, 3.2 * scale);
      ctx.fillStyle = rgba(e.hp / e.max < 0.34 ? MAG : GOLD, 0.9);
      ctx.fillRect(sx(e.x) - bw / 2, sy(e.y - (e.h + 10) * (e.scale > 1.1 ? 1 : 1.15)), bw * (e.hp / e.max), 3.2 * scale);
    }
  }

  function drawBullet(b) {
    var x = sx(b.x);
    var y = sy(b.y);
    ctx.save();
    if (b.kind === 'orb') {
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.arc(x, y, 5 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.5);
      ctx.beginPath();
      ctx.arc(x, y, 8 * scale, 0, TAU);
      ctx.fill();
    } else if (b.kind === 'laser') {
      ctx.fillStyle = rgba(RED, 0.95);
      ctx.fillRect(x - (b.vx > 0 ? 16 : 0) * scale, y - 2 * scale, 16 * scale, 4 * scale);
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(x - (b.vx > 0 ? 10 : 0) * scale, y - 1 * scale, 10 * scale, 2 * scale);
    } else {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.ellipse(x, y, 5 * scale, 2 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.5);
      ctx.fillRect(x - (b.vx > 0 ? 10 : 0) * scale, y - 1 * scale, 10 * scale, 2 * scale);
    }
    ctx.restore();
  }

  function drawBeam(b) {
    var x = sx(b.x);
    var y = sy(b.y);
    ctx.save();
    ctx.fillStyle = rgba(RED, 0.95);
    ctx.fillRect(x - (b.vx > 0 ? 22 : 0) * scale, y - 2.4 * scale, 22 * scale, 4.8 * scale);
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.fillRect(x - (b.vx > 0 ? 16 : 0) * scale, y - 1.2 * scale, 16 * scale, 2.4 * scale);
    ctx.fillStyle = rgba(WHT, 0.7);
    ctx.fillRect(x - (b.vx > 0 ? 8 : 0) * scale, y - 0.6 * scale, 8 * scale, 1.2 * scale);
    ctx.restore();
  }

  function drawTrails() {
    var i, t, a, x, y;
    for (i = 0; i < trails.length; i++) {
      t = trails[i];
      a = 1 - t.t / t.life;
      x = sx(t.x);
      y = sy(t.y);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(t.face, 1);
      ctx.strokeStyle = rgba(mutant().mask, 0.5 * a);
      ctx.lineWidth = 2.6 * scale;
      ctx.beginPath();
      ctx.moveTo(8 * scale, -4 * scale);
      ctx.quadraticCurveTo((t.reach * 0.55) * scale, -18 * scale, t.reach * scale, 2 * scale);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawFx() {
    var i, p, s, r, f, a;
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = rgba(p.rgb, 0.85 * a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < sparks.length; i++) {
      s = sparks[i];
      a = 1 - s.t / 0.18;
      ctx.strokeStyle = rgba(s.rgb, 0.8 * a);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.rad * (0.4 + s.t * 4)) * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < rings.length; i++) {
      r = rings[i];
      a = 1 - r.t / 0.32;
      ctx.strokeStyle = rgba(r.rgb, 0.7 * a);
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.rad + r.t * 70) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (i = 0; i < floats.length; i++) {
      f = floats[i];
      a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.font = '700 ' + (f.size * scale) + 'px sans-serif';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawGate() {
    var boss = findBoss();
    if (!boss || G.arena) return;
    var x = boss.x - 40;
    ctx.fillStyle = rgba(MAG, 0.12 + 0.06 * Math.sin(G.clock * 4));
    ctx.fillRect(sx(x), sy(40), 6 * scale, (GY - 40) * scale);
    ctx.fillStyle = rgba(HOT, 0.55);
    ctx.font = (9 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('先打倒头目', sx(x + 4), sy(70));
  }

  function draw() {
    var i, p, shx = 0, shy = 0;
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0a0414';
    ctx.fillRect(0, 0, W, H);
    if (G.shake > 0 && !REDUCE) {
      shx = (hash2((G.t * 80) | 0) - 0.5) * G.shake * 1.6;
      shy = (hash2((G.t * 80 + 9) | 0) - 0.5) * G.shake * 1.2;
    }
    ctx.save();
    ctx.translate(shx, shy);
    if (G.punch !== 1) {
      ctx.translate(W / 2, H / 2);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-W / 2, -H / 2);
    }

    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();

    drawSky();
    drawBuildings();
    drawGround();
    for (i = 0; i < G.crates.length; i++) drawCrate(G.crates[i]);
    for (i = 0; i < G.gems.length; i++) drawPickup(G.gems[i], CYN, '能');
    for (i = 0; i < G.aids.length; i++) drawPickup(G.aids[i], GOLD, '体');
    drawTrails();
    G.ents.sort(function (a, b) { return a.y - b.y; });
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    for (i = 0; i < G.bullets.length; i++) drawBullet(G.bullets[i]);
    for (i = 0; i < G.beams.length; i++) drawBeam(G.beams[i]);
    p = G.player;
    if (p) {
      drawShadow(p.x, p.y, 1);
      drawMutantBody(p, G.invuln > 0 && G.mode !== 'title' && ((G.t * 16) | 0) % 2 === 0);
    }
    drawGate();
    drawFx();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb || HOT, G.flash * 0.35);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
    ctx.restore();
  }

  function resize() {
    var wrap = canvas.parentElement;
    var rect = wrap ? wrap.getBoundingClientRect() : canvas.getBoundingClientRect();
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function onKey(e, down) {
    var k = e.key;
    var code = e.code;
    var isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    var space = k === ' ' || k === 'Spacebar' || code === 'Space';
    var jump = k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up';
    var sp = k === 'Shift' || k === 'z' || k === 'Z' || code === 'ShiftLeft' || code === 'ShiftRight';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (jump) keys.jump = down;
    if (space) keys.atk = down;
    if (sp) keys.sp = down;

    if (down && (isMove || space || sp || k === 'Enter')) e.preventDefault();
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
    if (G.mode === 'title') {
      if (k === '1') { setMutant('claw'); return; }
      if (k === '2') { setMutant('ice'); return; }
      if (k === '3') { setMutant('storm'); return; }
      if (k === '4') { setMutant('eye'); return; }
    }
    if (overlayOpen()) {
      if (space || k === 'Enter') primaryAction();
      return;
    }
    if (space) {
      if (playing() || G.mode === 'title') doAtk();
    }
    if (sp && !e.repeat) {
      if (playing() || G.mode === 'title') doSpecial();
    }
  }

  function bindPad() {
    function hold(el, on, off) {
      if (!el) return;
      var down = function (e) {
        e.preventDefault();
        audio.ensure();
        el.classList.add('held');
        on();
      };
      var up = function (e) {
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
    hold(document.getElementById('btn-jump'), function () { keys.jump = true; }, function () { keys.jump = false; });
    hold(document.getElementById('btn-atk'), function () {
      if (overlayOpen()) { primaryAction(); return; }
      if (playing()) doAtk();
    }, null);
    hold(document.getElementById('btn-sp'), function () {
      if (overlayOpen()) { primaryAction(); return; }
      if (playing()) doSpecial();
    }, null);
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen()) return;
      if (playing()) doAtk();
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  function bindMutants() {
    var i, id, btn;
    if (!mutantRow) return;
    mutantRow.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.getAttribute) return;
      id = t.getAttribute('data-id');
      if (!id) return;
      audio.ensure();
      setMutant(id);
      if (G.mode === 'title' && G.player) G.player.squash = 1.18;
      toast(mutant().name + ' · ' + mutant().spName, false, true);
    });
    for (i = 0; i < MUTANT_IDS.length; i++) {
      id = MUTANT_IDS[i];
      btn = document.getElementById('m-' + id);
      if (btn) btn.setAttribute('type', 'button');
    }
  }

  var acc = 0;
  var last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = now * 0.001;
      return;
    }
    var t = now * 0.001;
    if (!last) last = t;
    var dt = t - last;
    last = t;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    var n = 0;
    while (acc >= STEP && n < 5) {
      update(STEP);
      acc -= STEP;
      n += 1;
    }
    draw();
  }

  function initMute() {
    var m = false;
    try { m = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { m = false; }
    audio.setMuted(m);
  }

  loadBest();
  loadMutant();
  initMute();
  goTitle();
  resize();
  bindPointer();
  bindPad();
  bindMutants();

  if (btnPost) {
    btnPost.addEventListener('click', function () {
      audio.ensure();
      startGame('post');
    });
  }
  if (btnHunt) {
    btnHunt.addEventListener('click', function () {
      audio.ensure();
      startGame('hunt');
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
      if (G.mode === 'win' && !isHunt()) startGame('hunt');
      else goTitle();
    });
  }
  if (modePost) {
    modePost.addEventListener('click', function () {
      audio.ensure();
      startGame('post');
    });
  }
  if (modeHunt) {
    modeHunt.addEventListener('click', function () {
      audio.ensure();
      startGame('hunt');
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.l = false;
      keys.r = false;
      keys.jump = false;
      keys.atk = false;
      keys.sp = false;
    }
  });

  requestAnimationFrame(frame);
})();
