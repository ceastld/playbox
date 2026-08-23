'use strict';

/* 红侠 — Viewtiful Joe arcade lite. VFX brawler. Optional autoplay. No CDN. Distinct from 街霸 / 神龟 / 制裁. */

(function () {
  var VW = 640;
  var VH = 360;
  var GY = 318;
  var LIVES = 3;
  var LIFE_CAP = 6;
  var LIFE_EVERY = 20000;
  var HP_MAX = 16;
  var STEP = 1 / 60;
  var TAU = Math.PI * 2;
  var COMBO_WIN = 1.42;
  var AIR = 0.9;
  var JUMP_V = 410;
  var GRAV = 1350;
  var MAX_FALL = 640;
  var COYOTE = 0.09;
  var BUFFER = 0.12;
  var INVULN = 0.95;
  var DIE_T = 0.82;
  var WALK = 196;
  var VFX_MAX = 100;
  var VFX_MIN = 8;
  var SLOW_SCALE = 0.26;
  var SLOW_PLAYER = 0.62;
  var ZOOM_AMT = 1.42;
  var SLOW_DMG = 2.2;
  var ZOOM_DMG = 1.8;
  var BEST_KEY = 'playbox-viewtiful-best';
  var MUTE_KEY = 'playbox-viewtiful-mute';
  var AUTO_SPEED_KEY = 'playbox-viewtiful-auto-speed';
  var SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  var AUTO_SCALE = [1, 0.52, 0.78, 1, 3.4];
  var OPS = '方向 / D 走 · 上跳 · 空格出拳 · 下/X 踢 · V 慢镜 · C 拉近 · A 自动 · R 重开 · M 静音';

  var MAG = [255, 61, 184];
  var CYN = [0, 240, 255];
  var GOLD = [255, 227, 107];
  var HOT = [255, 42, 60];
  var HOT2 = [255, 106, 120];
  var WHT = [246, 239, 230];
  var SKIN = [232, 176, 132];
  var RED = [224, 32, 48];
  var SCARF = [244, 240, 232];
  var DUST = [160, 96, 96];
  var INK = [32, 24, 36];
  var CAST = [88, 72, 104];
  var LAVA = [255, 70, 24];

  var KINDS = {
    extra: { hp: 3, name: '群演', spd: 94, dmg: 2, score: 160, reach: 26, w: 16, h: 28, scale: 1 },
    shooter: { hp: 3, name: '镜手', spd: 72, dmg: 2, score: 220, reach: 20, w: 16, h: 28, scale: 1 },
    drone: { hp: 3, name: '航拍', spd: 120, dmg: 2, score: 240, reach: 22, w: 22, h: 16, scale: 1 },
    knight: { hp: 4, name: '甲士', spd: 78, dmg: 2, score: 280, reach: 32, w: 18, h: 30, scale: 1.08 },
    bomber: { hp: 3, name: '爆破', spd: 86, dmg: 2, score: 260, reach: 24, w: 16, h: 28, scale: 1 },
    director: { hp: 22, name: '导播机', spd: 58, dmg: 3, score: 3600, reach: 38, w: 28, h: 42, scale: 1.35 },
    hammer: { hp: 26, name: '重锤王', spd: 64, dmg: 3, score: 4200, reach: 40, w: 30, h: 46, scale: 1.5 },
    devil: { hp: 32, name: '红帽魔', spd: 80, dmg: 4, score: 6000, reach: 42, w: 28, h: 50, scale: 1.62 }
  };

  var SCORE = {
    hit: 40, kick: 55, reflect: 80, crate: 80, reel: 120,
    stage: 1500, wave: 600
  };

  var STAGES = [
    {
      name: '街拍棚', w: 1980, theme: 'street',
      ents: [
        [320, 'extra'], [480, 'extra'], [640, 'shooter'], [820, 'drone'],
        [980, 'extra'], [1140, 'shooter'], [1280, 'extra'], [1480, 'drone']
      ],
      crates: [400, 900, 1380],
      reels: [700, 1580],
      boss: ['director', 1760]
    },
    {
      name: '古堡棚', w: 2080, theme: 'castle',
      ents: [
        [300, 'knight'], [460, 'extra'], [640, 'drone'], [820, 'knight'],
        [1000, 'shooter'], [1180, 'knight'], [1360, 'drone'], [1540, 'extra']
      ],
      crates: [380, 980, 1420],
      reels: [720, 1640],
      boss: ['hammer', 1860]
    },
    {
      name: '火山棚', w: 1920, theme: 'volcano',
      ents: [
        [280, 'bomber'], [440, 'extra'], [620, 'shooter'], [800, 'bomber'],
        [980, 'drone'], [1160, 'extra'], [1340, 'bomber'], [1500, 'shooter']
      ],
      crates: [360, 920, 1320],
      reels: [680, 1540],
      boss: ['devil', 1720]
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
    return Math.min(14, 4 + ((n * 1.05) | 0));
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
    return kind === 'director' || kind === 'hammer' || kind === 'devil';
  }
  function isFly(kind) {
    return kind === 'drone';
  }
  function vfxDmg(base) {
    var m = 1;
    if (G.slowOn) m *= SLOW_DMG;
    if (G.zoomOn) m *= ZOOM_DMG;
    return Math.max(1, Math.round(base * m));
  }
  function vfxStop(base) {
    var s = base;
    if (G.slowOn) s *= 1.25;
    if (G.zoomOn) s *= 1.45;
    return Math.min(0.08, s);
  }
  function vfxReach(base) {
    return base + (G.zoomOn ? 14 : 0);
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (STAGES[0].name !== '街拍棚' || STAGES[1].name !== '古堡棚' || STAGES[2].name !== '火山棚') throw new Error('names');
    if (STAGES[0].boss[0] !== 'director' || STAGES[1].boss[0] !== 'hammer' || STAGES[2].boss[0] !== 'devil') throw new Error('bosses');
    if (LIVES !== 3) throw new Error('3 lives');
    if (HP_MAX < 12) throw new Error('hp');
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(3) !== 2) throw new Error('combo 3');
    if (comboMul(9) !== 5) throw new Error('combo 9');
    if (BEST_KEY !== 'playbox-viewtiful-best') throw new Error('best key');
    if (AUTO_SPEED_KEY !== 'playbox-viewtiful-auto-speed') throw new Error('auto key');
    if (AUTO_SCALE[3] !== 1 || AUTO_SCALE[4] <= AUTO_SCALE[3]) throw new Error('auto scale');
    if (AUTO_SCALE[1] >= AUTO_SCALE[2] || AUTO_SCALE[2] >= AUTO_SCALE[3]) throw new Error('auto scale order');
    if (SPEED_LABELS[3] !== '快' || SPEED_LABELS[4] !== '极快') throw new Error('speed labels');
    if (kindHp('extra', 0) !== 3) throw new Error('extra hp');
    if (kindHp('devil', 1) <= kindHp('extra', 1)) throw new Error('boss hp');
    if (waveCount(1) < 4 || waveCount(20) > 14) throw new Error('wave cap');
    if (jumpH() < 50) throw new Error('jump');
    if (WALK < 160) throw new Error('walk');
    if (SLOW_DMG <= 1 || ZOOM_DMG <= 1) throw new Error('vfx dmg');
    if (SLOW_SCALE >= 0.5) throw new Error('slow scale');
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
  var btnShoot = document.getElementById('btn-shoot');
  var btnCut = document.getElementById('btn-cut');
  var ovAgain = document.getElementById('ov-again');
  var ovMenu = document.getElementById('ov-menu');
  var modeShoot = document.getElementById('mode-shoot');
  var modeCut = document.getElementById('mode-cut');
  var btnMute = document.getElementById('btn-mute');
  var btnRetry = document.getElementById('btn-retry');
  var btnAuto = document.getElementById('btn-auto');
  var speedEl = document.getElementById('speed');
  var speedLab = document.getElementById('speed-lab');
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');
  var scoreBox = document.getElementById('score-box');
  var scoreAdd = document.getElementById('score-add');
  var comboBox = document.getElementById('combo-box');
  var comboEl = document.getElementById('combo');
  var stageLabel = document.getElementById('stage-label');
  var tagLabel = document.getElementById('tag-label');
  var vfxLabel = document.getElementById('vfx-label');
  var hpBar = document.getElementById('hp-bar');
  var vfxBar = document.getElementById('vfx-bar');
  var vfxWrap = document.getElementById('vfx-wrap');
  var pipsEl = document.getElementById('pips');
  var toastEl = document.getElementById('toast');
  var hintEl = document.getElementById('hint');
  var stageEl = document.getElementById('stage');
  var chainPop = document.getElementById('chain-pop');

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

  var keys = { l: false, r: false, jump: false, atk: false, kick: false, slow: false, zoom: false };
  var demo = { l: false, r: true, jump: false, slow: false };
  var autoIn = { l: false, r: false, jump: false, slow: false, zoom: false };
  var autoOn = false;
  var autoSpeed = 3;
  var autoOvWait = 0;
  var autoStuck = 0;
  var autoLastX = 0;
  var autoWalkDir = 1;
  var autoBackT = 0;
  var pips = [];
  var particles = [];
  var sparks = [];
  var rings = [];
  var floats = [];
  var trails = [];
  var ghosts = [];

  var G = {
    mode: 'title',
    kind: 'shoot',
    t: 0,
    clock: 0,
    stage: 1,
    wave: 1,
    camX: 0,
    camY: 0,
    levelW: 1980,
    theme: 'street',
    ents: [],
    crates: [],
    reels: [],
    bullets: [],
    shots: [],
    waves: [],
    player: null,
    lives: LIVES,
    hp: HP_MAX,
    vfx: 70,
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
    atkKind: 'punch',
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
    waveLeft: 0,
    spawnQ: [],
    clearT: 0,
    arena: false,
    lockL: 0,
    lockR: 0,
    slowOn: false,
    zoomOn: false,
    zoomAmt: 1,
    vfxFlash: 0
  };

  function isCut() {
    return G.kind === 'cut';
  }
  function playing() {
    return G.mode === 'play';
  }
  function combatOn() {
    return G.mode === 'play' || G.mode === 'title';
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function autoPlaying() {
    return autoOn && G.mode === 'play';
  }
  function inL() {
    if (autoPlaying()) return autoIn.l;
    return G.mode === 'title' ? demo.l : keys.l;
  }
  function inR() {
    if (autoPlaying()) return autoIn.r;
    return G.mode === 'title' ? demo.r : keys.r;
  }
  function inJump() {
    if (autoPlaying()) return autoIn.jump;
    return G.mode === 'title' ? demo.jump : keys.jump;
  }
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
    whoosh: function () {
      this.ensure();
      this.noise(0.04, 0.03, 1600);
      this.beep(380, 0.06, 'sawtooth', 0.038, 140);
    },
    kickWhoosh: function () {
      this.ensure();
      this.noise(0.05, 0.036, 900);
      this.beep(220, 0.08, 'sawtooth', 0.04, 90);
    },
    hit: function (combo, kick) {
      this.ensure();
      var lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.05, kick ? 0.05 : 0.04, kick ? 380 : 900);
      this.beep((kick ? 160 : 240) * lift, 0.08, 'square', 0.05, 70);
      this.beep(520 * lift, 0.05, 'triangle', 0.028, 180);
    },
    boom: function () {
      this.ensure();
      this.noise(0.1, 0.055, 280);
      this.beep(90, 0.14, 'sawtooth', 0.046, 42);
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
      this.noise(0.045, 0.04, 1100);
      this.beep(280, 0.07, 'square', 0.04, 80);
    },
    reflect: function () {
      this.ensure();
      this.beep(660, 0.06, 'square', 0.045, 1320);
      this.beep(990, 0.1, 'triangle', 0.04, 1480);
      this.noise(0.05, 0.03, 1800);
    },
    pickup: function () {
      this.ensure();
      this.beep(520, 0.07, 'square', 0.04, 880);
      this.beep(880, 0.1, 'triangle', 0.035, 1320);
    },
    crate: function () {
      this.ensure();
      this.noise(0.08, 0.046, 600);
      this.beep(200, 0.1, 'square', 0.036, 70);
    },
    slowOn: function () {
      this.ensure();
      this.beep(420, 0.14, 'sine', 0.04, 180);
      this.noise(0.08, 0.03, 400);
    },
    zoomOn: function () {
      this.ensure();
      this.beep(220, 0.12, 'sawtooth', 0.04, 660);
      this.beep(880, 0.1, 'triangle', 0.03, 440);
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
    roar: function () {
      this.ensure();
      this.noise(0.16, 0.06, 220);
      this.beep(70, 0.22, 'sawtooth', 0.055, 42);
      this.beep(110, 0.18, 'square', 0.04, 60);
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
  function loadAutoSpeed() {
    try {
      var n = parseInt(localStorage.getItem(AUTO_SPEED_KEY) || '3', 10);
      if (!isFinite(n) || n < 1 || n > 4) return 3;
      return n;
    } catch (err) {
      return 3;
    }
  }
  function saveAutoSpeed(n) {
    try { localStorage.setItem(AUTO_SPEED_KEY, String(n)); } catch (err) { /* ignore */ }
  }
  function saveBest() {
    if (G.score <= G.best) return;
    G.best = G.score;
    if (bestEl) bestEl.textContent = String(G.best);
    try { localStorage.setItem(BEST_KEY, String(G.best)); } catch (err) { /* ignore */ }
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
    var c = isCut();
    if (modeShoot) modeShoot.setAttribute('aria-pressed', c ? 'false' : 'true');
    if (modeCut) modeCut.setAttribute('aria-pressed', c ? 'true' : 'false');
  }
  function vfxName() {
    if (G.slowOn && G.zoomOn) return '红侠';
    if (G.slowOn) return '慢镜';
    if (G.zoomOn) return '拉近';
    return '拳踢';
  }
  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 3);
    if (stageLabel) {
      if (isCut()) stageLabel.textContent = '潮 ' + G.wave;
      else stageLabel.textContent = (STAGES[G.stage - 1] || STAGES[0]).name;
      stageLabel.classList.toggle('hot', isCut() ? G.wave >= 5 : G.stage >= 3);
    }
    if (tagLabel) {
      tagLabel.textContent = isCut() ? '快剪' : '开拍';
      tagLabel.classList.toggle('warn', isCut());
      tagLabel.classList.toggle('hot', !isCut() && G.stage >= 3);
    }
    if (vfxLabel) {
      vfxLabel.textContent = vfxName();
      vfxLabel.classList.toggle('slow', G.slowOn && !G.zoomOn);
      vfxLabel.classList.toggle('zoom', G.zoomOn && !G.slowOn);
      vfxLabel.classList.toggle('both', G.slowOn && G.zoomOn);
    }
    if (hpBar) {
      var r = G.hp / HP_MAX;
      hpBar.style.transform = 'scaleX(' + clamp(r, 0, 1) + ')';
      hpBar.classList.toggle('low', r <= 0.34);
    }
    if (vfxBar) {
      vfxBar.style.transform = 'scaleX(' + clamp(G.vfx / VFX_MAX, 0, 1) + ')';
    }
    if (vfxWrap) vfxWrap.classList.toggle('on', G.slowOn || G.zoomOn);
    if (stageEl) {
      stageEl.classList.toggle('slow', G.slowOn);
      stageEl.classList.toggle('zoom', G.zoomOn);
    }
    syncPips();
    syncModes();
  }
  function popCombo() {
    if (!chainPop) return;
    chainTok += 1;
    chainPop.textContent = G.slowOn && G.zoomOn ? 'VIEW!' : ('×' + G.mult);
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
      ovKicker.textContent = kind === 'lose' ? 'CUT' : kind === 'win' ? 'CLEAR' : 'VIEW';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' && !isCut() ? '快剪' : '换模式';
  }
  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus({ preventScroll: true });
  }

  function hitStop(sec) {
    if (REDUCE || G.mode === 'title') return;
    if (autoOn && autoSpeed >= 4) return;
    G.stop = Math.max(G.stop, sec);
  }
  function kickCam(mag, cls) {
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
  function swingTrail(x, y, face, kick) {
    trails.push({ x: x, y: y, face: face, t: 0, life: 0.16, reach: kick ? 40 : 34, kick: !!kick });
    capArr(trails, 18);
  }
  function splatAt(x, y, face, big) {
    var rgb = G.slowOn && G.zoomOn ? GOLD : HOT;
    var rgb2 = G.zoomOn ? CYN : GOLD;
    var n = big ? 22 : 10;
    emit(n, {
      x: x, y: y, j: big ? 14 : 9,
      vx0: face * 30, vx1: face * 240, vy0: -260, vy1: -10,
      r0: 1.6, r1: big ? 5.2 : 3.8, life: big ? 0.62 : 0.42, rgb: rgb
    });
    emit(big ? 10 : 5, {
      x: x, y: y, j: 8,
      vx0: -60, vx1: 60, vy0: -200, vy1: -20,
      r0: 1.2, r1: 3, life: 0.36, rgb: rgb2
    });
    popSpark(x, y, rgb, big ? 26 : 14);
    if (big) {
      popRing(x, y, rgb, 28);
      audio.boom();
    }
  }

  function makePlayer(x) {
    return {
      x: x, y: GY, vx: 0, vy: 0, face: 1,
      grounded: true, coyote: 0, run: 0, squash: 1,
      act: 'idle', scale: 1
    };
  }
  function makeEnt(x, kind, wave) {
    var spec = KINDS[kind] || KINDS.extra;
    var fly = isFly(kind);
    return {
      x: x, y: fly ? GY - 96 : GY, vx: 0, vy: 0,
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
      think: rand(0.08, 0.5),
      act: 'idle',
      atkT: 0,
      atkHit: false,
      stunT: 0,
      hurtT: 0,
      deadT: 0,
      dead: false,
      flash: 0,
      run: rand(0, 8),
      cd: rand(0.2, 0.8),
      grounded: !fly,
      squash: 1,
      flyY: fly ? GY - 96 : GY,
      dashT: 0
    };
  }
  function makeCrate(x) {
    return { x: x, hp: 1, dead: false, deadT: 0 };
  }
  function makeReel(x) {
    return { x: x, y: GY - 12, taken: false, bob: rand(0, TAU) };
  }

  function clearFx() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    trails.length = 0;
    ghosts.length = 0;
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
    G.reels = [];
    G.bullets = [];
    G.shots = [];
    G.waves = [];
    G.arena = false;
    G.lockL = 0;
    G.lockR = spec.w;
    G.camX = 0;
    G.camY = 0;
    G.player = makePlayer(72);
    G.atkT = 0;
    G.atkHit = false;
    G.atkBuf = 0;
    G.atkKind = 'punch';
    G.airAtk = false;
    if (!demoMode) {
      for (i = 0; i < spec.ents.length; i++) {
        e = spec.ents[i];
        G.ents.push(makeEnt(e[0], e[1], 0));
      }
      if (spec.boss) G.ents.push(makeEnt(spec.boss[1], spec.boss[0], 0));
      for (i = 0; i < spec.crates.length; i++) G.crates.push(makeCrate(spec.crates[i]));
      for (i = 0; i < spec.reels.length; i++) G.reels.push(makeReel(spec.reels[i]));
    } else {
      G.ents.push(makeEnt(420, 'extra', 0));
      G.ents.push(makeEnt(640, 'shooter', 0));
      G.ents.push(makeEnt(860, 'drone', 0));
      G.crates.push(makeCrate(300));
      G.reels.push(makeReel(520));
    }
  }

  function spawnWave(n) {
    var count = waveCount(n);
    var i, kind, side, x;
    G.wave = n;
    G.waveLeft = count;
    G.waveT = 0.5;
    G.spawnQ = [];
    G.clearT = 0;
    G.arena = false;
    G.lockL = 0;
    G.lockR = G.levelW;
    for (i = 0; i < count; i++) {
      if (n >= 8 && n % 8 === 0 && i === 0) kind = 'devil';
      else if (n >= 4 && n % 4 === 0 && i === 0) kind = 'director';
      else if (n >= 6 && n % 6 === 0 && i === 1) kind = 'hammer';
      else if (n >= 2 && i % 4 === 2) kind = 'drone';
      else if (i % 5 === 1) kind = 'shooter';
      else if (i % 3 === 0) kind = 'bomber';
      else if (i % 2 === 0) kind = 'knight';
      else kind = 'extra';
      side = i % 2 === 0 ? 1 : -1;
      x = (G.player ? G.player.x : 320) + side * rand(300, 480);
      x = clamp(x, 40, G.levelW - 40);
      G.spawnQ.push({ t: 0.1 * i, kind: kind, x: x });
    }
    toast('第 ' + n + ' 潮', false, n % 4 === 0);
    audio.wave();
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'cut' ? 'cut' : 'shoot';
    G.mode = 'play';
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.vfx = 70;
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
    G.slowOn = false;
    G.zoomOn = false;
    G.zoomAmt = 1;
    clearFx();
    if (isCut()) {
      G.theme = 'street';
      G.levelW = 1900;
      G.ents = [];
      G.crates = [makeCrate(360), makeCrate(900), makeCrate(1500)];
      G.reels = [makeReel(480), makeReel(1100)];
      G.bullets = [];
      G.shots = [];
      G.waves = [];
      G.player = makePlayer(280);
      G.camX = 0;
      G.stage = 1;
      spawnWave(1);
    } else {
      loadStage(1, false);
    }
    hideOverlay();
    audio.start();
    toast('ACTION!', false, true);
    setHint(isCut() ? '一潮接一潮 · 更密更快 · 慢镜打回子弹' : '往右打 · V 慢镜 · C 拉近 · 打到红帽魔', '');
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'shoot';
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.vfx = 70;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '红侠', '走跳拳踢。按 V 开慢镜，拳更重、子弹爬行可打回；按 C 拉近出大招。体力打空扣一命。片场三关见头目。');
    setHint('走跳拳踢 · V 慢镜打回子弹 · C 拉近大招 · A 自动 · 片场见头目', '');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('shoot');
    else startGame(G.kind || 'shoot');
  }
  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('shoot');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function goLose() {
    G.mode = 'lose';
    G.slowOn = false;
    G.zoomOn = false;
    audio.lose();
    kickCam(7, 'die');
    var why = G.why === 'life' ? '体力见底，片子喊停。' : '被拍倒了。';
    showOverlay('lose', 'CUT', why + ' 分数 ' + G.score + ' · 最高连击 ' + G.maxCombo);
    setHint('R 立刻重开', 'warn');
    syncHud();
  }
  function goWin() {
    G.mode = 'win';
    G.slowOn = false;
    G.zoomOn = false;
    audio.win();
    kickCam(2, 'win-flash');
    screenFlash(GOLD, 0.5);
    showOverlay('win', '杀青', '三棚拍完。分数 ' + G.score + ' · 最高连击 ' + G.maxCombo);
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
    G.vfx = Math.min(VFX_MAX, G.vfx + 7);
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
    kickCam(4.2, 'die');
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
      kickCam(6.5, 'die');
      toast('CUT', true, false);
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
    var air = G.atkAir;
    var kick = G.atkKind === 'kick';
    var chain = G.chainN;
    var spec = {
      t: 0.18, h0: 0.04, h1: 0.12, dmg: 1, reach: 30,
      knock: 70, stop: 0.042, down: false, kick: false
    };
    if (kick && air) {
      spec.t = 0.28;
      spec.h0 = 0.04;
      spec.h1 = 0.22;
      spec.reach = 32;
      spec.dmg = 2;
      spec.knock = 110;
      spec.stop = 0.058;
      spec.down = true;
      spec.kick = true;
    } else if (kick) {
      spec.t = 0.26;
      spec.h0 = 0.06;
      spec.h1 = 0.18;
      spec.reach = 38;
      spec.dmg = 2;
      spec.knock = 120;
      spec.stop = 0.058;
      spec.down = true;
      spec.kick = true;
    } else if (air) {
      spec.t = 0.24;
      spec.h0 = 0.04;
      spec.h1 = 0.2;
      spec.reach = 28;
      spec.dmg = 2;
      spec.knock = 90;
      spec.stop = 0.055;
    } else if (chain % 3 === 0) {
      spec.t = 0.28;
      spec.h0 = 0.08;
      spec.h1 = 0.2;
      spec.dmg = 2;
      spec.reach = 36;
      spec.knock = 130;
      spec.down = true;
      spec.stop = 0.07;
    } else if (chain % 3 === 2) {
      spec.t = 0.2;
      spec.dmg = 2;
      spec.reach = 32;
      spec.knock = 88;
      spec.stop = 0.052;
    }
    spec.dmg = vfxDmg(spec.dmg);
    spec.reach = vfxReach(spec.reach);
    spec.stop = vfxStop(spec.stop);
    return spec;
  }

  function doAtk(kind) {
    if (G.deadT > 0) return;
    if (G.mode !== 'play' && G.mode !== 'title') return;
    if (G.atkT > 0) {
      var spec = atkSpec();
      if (G.atkT < spec.t * 0.5) {
        G.atkBuf = kind === 'kick' ? 2 : 1;
      }
      return;
    }
    startAtk(kind);
  }
  function startAtk(kind) {
    var p = G.player;
    if (!p) return;
    if (kind === 'kick') G.atkKind = 'kick';
    else G.atkKind = 'punch';
    if (G.atkBuf === 2) G.atkKind = 'kick';
    if (!p.grounded) {
      if (G.airAtk) return;
      G.airAtk = true;
      G.atkAir = true;
    } else {
      G.atkAir = false;
    }
    if (G.atkKind === 'punch') G.chainN += 1;
    else G.chainN = 0;
    var spec = atkSpec();
    G.atkT = spec.t;
    G.atkHit = false;
    G.atkBuf = 0;
    p.act = G.atkKind === 'kick' ? 'kick' : (G.atkAir ? 'spin' : 'atk');
    if (G.atkKind === 'kick') audio.kickWhoosh();
    else audio.whoosh();
    swingTrail(p.x, p.y - 18, p.face, G.atkKind === 'kick');
  }

  function applyHit(e, opt) {
    if (e.dead || e.hurtT > 0.1) return false;
    var p = G.player;
    var face = opt.face || (p ? p.face : 1);
    e.hp -= opt.dmg;
    e.hurtT = 0.16;
    e.stunT = opt.down ? 0.42 : 0.2;
    e.flash = 0.12;
    e.face = -face;
    e.vx = face * (opt.knock || 80);
    if (opt.down || isFly(e.kind)) e.vy = -160;
    e.act = 'hurt';
    bumpCombo();
    audio.hit(G.combo, opt.kick);
    hitStop(opt.stop || 0.045);
    kickCam(opt.down ? 4.4 : 2.8, opt.down ? 'boom' : 'hit');
    var hx = e.x - face * 6;
    var hy = e.y - (e.h * 0.45);
    splatAt(hx, hy, face, false);
    var base = opt.pts || (opt.kick ? SCORE.kick : SCORE.hit);
    var pts = Math.round(base * G.mult * (opt.down ? 1.4 : 1) * (G.slowOn && G.zoomOn ? 1.25 : 1));
    addScore(pts);
    popFloat(hx, hy - 10, '+' + pts, G.slowOn && G.zoomOn ? GOLD : (opt.kick ? CYN : HOT));
    if (G.slowOn && G.zoomOn) {
      popRing(hx, hy, GOLD, 22);
      screenFlash(GOLD, 0.18);
    }
    if (e.hp <= 0) killEnt(e, face, opt.knock || 80);
    return true;
  }
  function killEnt(e, face, knock) {
    e.dead = true;
    e.deadT = 0.55;
    e.vy = -220;
    e.vx = face * (knock + 80);
    e.act = 'down';
    splatAt(e.x, e.y - e.h * 0.5, face, true);
    G.vfx = Math.min(VFX_MAX, G.vfx + 14);
    var ks = Math.round((KINDS[e.kind] ? KINDS[e.kind].score : 160) * G.mult);
    addScore(ks);
    popFloat(e.x, e.y - 36, '+' + ks, isBoss(e.kind) ? GOLD : HOT);
    if (isBoss(e.kind)) {
      screenFlash(GOLD, 0.45);
      kickCam(6, 'boom');
      toast(KINDS[e.kind].name + '倒了', false, true);
      audio.roar();
    }
  }

  function hitEntPunch(e, spec, p) {
    if (e.dead || e.hurtT > 0.12) return false;
    var dx = (e.x - p.x) * p.face;
    if (dx < 8 || dx > spec.reach + 10) return false;
    var py = p.y - 14;
    var ey = e.y - e.h * 0.5;
    if (Math.abs(py - ey) > 28 + (G.atkAir ? 18 : 0)) return false;
    G.atkHit = true;
    return applyHit(e, {
      dmg: spec.dmg, knock: spec.knock, face: p.face,
      stop: spec.stop, down: spec.down, kick: spec.kick,
      pts: spec.kick ? SCORE.kick : SCORE.hit
    });
  }
  function smashCrate(c) {
    if (c.dead) return;
    c.dead = true;
    c.deadT = 0.4;
    audio.crate();
    hitStop(0.04);
    kickCam(2.2, 'thump');
    emit(12, {
      x: c.x, y: GY - 14, j: 8,
      vx0: -160, vx1: 160, vy0: -280, vy1: -40,
      r0: 1.6, r1: 4, life: 0.45, rgb: DUST
    });
    addScore(Math.round(SCORE.crate * Math.max(1, G.mult)));
    var h = hash2((c.x * 17) | 0);
    if (h > 0.42) G.reels.push(makeReel(c.x));
  }
  function hitCrates(spec, p) {
    var i, c, dx;
    for (i = 0; i < G.crates.length; i++) {
      c = G.crates[i];
      if (c.dead) continue;
      dx = (c.x - p.x) * p.face;
      if (dx < 4 || dx > spec.reach + 8) continue;
      if (Math.abs(p.y - GY) > 36) continue;
      G.atkHit = true;
      bumpCombo();
      smashCrate(c);
    }
  }
  function reflectBullets(spec, p) {
    var i, b, dx, dy, any = false;
    for (i = 0; i < G.bullets.length; i++) {
      b = G.bullets[i];
      if (b.dead) continue;
      dx = (b.x - p.x) * p.face;
      if (dx < 4 || dx > spec.reach + 16) continue;
      dy = Math.abs((p.y - 16) - b.y);
      if (dy > 22 + (G.atkAir ? 12 : 0)) continue;
      b.dead = true;
      G.shots.push({
        x: b.x, y: b.y, vx: p.face * 520, vy: 0, dmg: vfxDmg(3), life: 0.7
      });
      any = true;
      G.atkHit = true;
      bumpCombo();
      audio.reflect();
      hitStop(vfxStop(0.05));
      kickCam(3.2, 'boom');
      popSpark(b.x, b.y, CYN, 16);
      popRing(b.x, b.y, GOLD, 14);
      var pts = Math.round(SCORE.reflect * G.mult);
      addScore(pts);
      popFloat(b.x, b.y - 12, '+' + pts, CYN);
      emit(8, {
        x: b.x, y: b.y, j: 6,
        vx0: p.face * 40, vx1: p.face * 180, vy0: -120, vy1: 40,
        r0: 1.2, r1: 2.8, life: 0.32, rgb: CYN, g: 80
      });
    }
    return any;
  }
  function tryHit() {
    var p = G.player;
    if (!p || G.atkHit) return;
    var spec = atkSpec();
    var i, any = false;
    for (i = 0; i < G.ents.length; i++) {
      if (hitEntPunch(G.ents[i], spec, p)) any = true;
    }
    hitCrates(spec, p);
    if (reflectBullets(spec, p)) any = true;
    if (any) G.atkHit = true;
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
  function nearestBullet() {
    var i, b, best = null, bd = 1e9, d;
    var p = G.player;
    if (!p) return null;
    for (i = 0; i < G.bullets.length; i++) {
      b = G.bullets[i];
      if (b.dead) continue;
      d = Math.abs(b.x - p.x);
      if (d < bd && d < 220) { bd = d; best = b; }
    }
    return best;
  }

  function demoThink() {
    var p = G.player;
    var e, b, dx;
    if (!p) return;
    demo.l = false;
    demo.r = false;
    demo.jump = false;
    demo.slow = false;
    b = nearestBullet();
    if (b && Math.abs(b.x - p.x) < 160) {
      demo.slow = true;
      if (Math.abs(b.x - p.x) < 40 && G.atkT <= 0) doAtk('punch');
      if (b.x > p.x + 20) demo.r = true;
      else if (b.x < p.x - 20) demo.l = true;
      if (p.grounded && b.y < p.y - 40) demo.jump = true;
      return;
    }
    e = nearestEnt();
    if (!e) {
      demo.r = p.x < 420;
      demo.l = p.x > 780;
      return;
    }
    dx = e.x - p.x;
    if ((e.kind === 'shooter' || e.kind === 'drone' || e.kind === 'bomber') && Math.abs(dx) < 210 && p.grounded) demo.jump = true;
    if (Math.abs(dx) > 28) {
      if (dx > 0) demo.r = true;
      else demo.l = true;
    } else if (G.atkT <= 0) {
      doAtk(G.clock % 3 < 1 ? 'kick' : 'punch');
    }
  }

  function clearAutoKeys() {
    autoIn.l = false;
    autoIn.r = false;
    autoIn.jump = false;
    autoIn.slow = false;
    autoIn.zoom = false;
  }
  function autoSteer(tx) {
    autoIn.l = false;
    autoIn.r = false;
    if (!G.player) return;
    var dx = tx - G.player.x;
    if (dx > 8) {
      autoIn.r = true;
      autoWalkDir = 1;
    } else if (dx < -8) {
      autoIn.l = true;
      autoWalkDir = -1;
    }
  }
  function autoShotThreat() {
    var p = G.player;
    var i, b, t, dy;
    if (!p) return null;
    for (i = 0; i < G.bullets.length; i++) {
      b = G.bullets[i];
      if (b.dead) continue;
      dy = Math.abs(b.y - (p.y - 16));
      if (b.vx === 0) {
        if (Math.abs(b.x - p.x) < 42 && dy < 28) return b;
        continue;
      }
      t = (p.x - b.x) / b.vx;
      if (t < -0.04 || t > 0.72) {
        if (Math.abs(b.x - p.x) < 36 && dy < 26) return b;
        continue;
      }
      if (dy < 36 || (t < 0.38 && dy < 52)) return b;
    }
    return null;
  }
  function autoWaveThreat() {
    var p = G.player;
    var i, w, t;
    if (!p) return null;
    for (i = 0; i < G.waves.length; i++) {
      w = G.waves[i];
      if (w.hit) continue;
      if (w.vx === 0) {
        if (Math.abs(w.x - p.x) < 22) return w;
        continue;
      }
      t = (p.x - w.x) / w.vx;
      if (t >= 0 && t < 0.4 && Math.abs(w.x - p.x) < 96) return w;
      if (Math.abs(w.x - p.x) < 22) return w;
    }
    return null;
  }
  function autoPick() {
    var p = G.player;
    var best = null;
    var bestS = -1e9;
    var i, e, c, r, d, pri, dx;
    function consider(x, y, score, kind) {
      if (score > bestS) {
        bestS = score;
        best = { x: x, y: y, kind: kind };
      }
    }
    if (!p) return { x: 200, y: GY, kind: 'go' };
    for (i = 0; i < G.reels.length; i++) {
      r = G.reels[i];
      if (r.taken) continue;
      d = Math.abs(r.x - p.x);
      pri = G.hp <= 8 ? 940 : (G.vfx < 30 ? 360 : 180);
      pri -= d * 0.45;
      consider(r.x, GY, pri, 'reel');
    }
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      dx = e.x - p.x;
      d = Math.abs(dx);
      pri = (isBoss(e.kind) ? 980 : 720) - d * 0.55;
      if (dx > 0) pri += 55;
      if (isFly(e.kind)) pri -= 30;
      consider(e.x, e.y, pri, 'fight');
    }
    for (i = 0; i < G.crates.length; i++) {
      c = G.crates[i];
      if (c.dead) continue;
      d = Math.abs(c.x - p.x);
      if (d > 140) continue;
      consider(c.x, GY, 300 - d * 0.4, 'crate');
    }
    if (!best) consider(Math.min(G.levelW - 40, p.x + 220), GY, 50, 'go');
    return best;
  }
  function autoThink() {
    var p, shot, wave, goal, e, dx, adx, reach, hold, wantJump, wantAtk, wantKick;
    var i, close, closeD, d, flyish, atkKind;
    clearAutoKeys();
    if (!autoOn || G.mode !== 'play') return;
    p = G.player;
    if (!p || G.deadT > 0) return;

    d = Math.abs(p.x - autoLastX);
    if (d < 1.4 && p.grounded && G.atkT <= 0) autoStuck += STEP;
    else autoStuck = Math.max(0, autoStuck - STEP * 2);
    autoLastX = p.x;
    if (autoBackT > 0) autoBackT -= STEP;

    goal = autoPick();
    shot = autoShotThreat();
    wave = autoWaveThreat();
    reach = vfxReach(32);
    hold = false;
    wantJump = false;
    wantAtk = false;
    wantKick = false;

    close = null;
    closeD = 1e9;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      dx = e.x - p.x;
      adx = Math.abs(dx);
      if (adx > reach + 56) continue;
      if (isFly(e.kind) && adx > reach + 28) continue;
      d = adx + Math.abs(e.y - p.y) * 0.35;
      if (d < closeD) {
        closeD = d;
        close = e;
      }
    }

    if (shot && G.invuln <= 0) {
      autoIn.slow = G.vfx > 6;
      dx = shot.x - p.x;
      adx = Math.abs(dx);
      if (dx > 4) p.face = 1;
      else if (dx < -4) p.face = -1;
      if (adx <= reach + 16) {
        wantAtk = true;
        hold = adx <= reach + 4;
        if (!hold) autoSteer(shot.x);
      } else {
        autoSteer(shot.x);
      }
      if (shot.y < p.y - 40 && p.grounded) wantJump = true;
      if (!autoIn.slow && shot.y > p.y - 36 && adx < 80) wantJump = true;
    }

    if (wave && G.invuln <= 0 && p.grounded) wantJump = true;

    if (close && !shot) {
      dx = close.x - p.x;
      adx = Math.abs(dx);
      flyish = isFly(close.kind) || close.y < p.y - 36;
      if (dx > 4) p.face = 1;
      else if (dx < -4) p.face = -1;
      if (adx <= reach + 6 && (!flyish || !p.grounded || Math.abs((p.y - 14) - (close.y - close.h * 0.5)) < 46)) {
        wantAtk = true;
        if (close.kind === 'knight' || isBoss(close.kind) || G.chainN % 3 === 0) wantKick = true;
        if (adx < 8) {
          autoSteer(p.x + (dx > 0 ? -22 : 22));
        } else if (adx > reach - 2) {
          autoSteer(close.x);
        } else {
          hold = true;
        }
        if (flyish && p.grounded && adx < reach + 18) wantJump = true;
      } else {
        autoSteer(close.x);
        if (flyish && p.grounded && adx < 90) wantJump = true;
      }
      if (close.atkT > 0 && adx < 34 && p.grounded && !isFly(close.kind)) {
        if (close.kind === 'hammer' || close.kind === 'director') wantJump = true;
      }
      if (close.kind === 'devil' && close.dashT > 0 && adx < 70) wantJump = true;
    }

    if (goal.kind === 'crate' && Math.abs(goal.x - p.x) < 36) wantAtk = true;

    if (!shot && !hold && !autoIn.l && !autoIn.r) {
      if (autoBackT > 0) autoSteer(p.x - autoWalkDir * 70);
      else autoSteer(goal.x);
    }

    if (autoStuck > 0.45) wantJump = true;
    if (autoStuck > 1.05) {
      hold = false;
      autoSteer(p.x + autoWalkDir * 120);
      wantAtk = true;
    }
    if (autoStuck > 1.7) {
      autoBackT = 0.28;
      autoStuck = 0.15;
      autoWalkDir *= -1;
    }

    if (hold) {
      autoIn.l = false;
      autoIn.r = false;
    }

    if (wantJump && (p.grounded || p.vy > 40)) autoIn.jump = true;

    if (close && Math.abs(close.x - p.x) < 70 && G.vfx > 24) {
      autoIn.zoom = true;
      if (G.vfx > 52 && (G.combo >= 2 || isBoss(close.kind))) autoIn.slow = true;
    }
    if (G.vfx < 14) {
      if (!shot) autoIn.slow = false;
      autoIn.zoom = false;
    }

    if (wantAtk && G.atkT <= 0.08) {
      atkKind = wantKick ? 'kick' : 'punch';
      if (G.chainN > 0 && G.chainN % 3 === 0) atkKind = 'kick';
      doAtk(atkKind);
    }
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.25 : 0.5)) {
        autoOvWait = 0;
        startGame(G.kind || 'shoot');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.7 : 1.15)) {
        autoOvWait = 0;
        startGame(G.kind || 'shoot');
      }
    }
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    if (speedEl) speedEl.value = String(autoSpeed);
    if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
    if (speedEl) {
      speedEl.title = SPEED_LABELS[autoSpeed];
      speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
    }
  }

  function autoScale() {
    if (!autoOn || G.mode !== 'play') return 1;
    return AUTO_SCALE[autoSpeed] || 1;
  }

  function setAutoSpeed(n) {
    n = parseInt(n, 10);
    if (!isFinite(n) || n < 1 || n > 4) n = 3;
    autoSpeed = n;
    saveAutoSpeed(autoSpeed);
    syncSpeedUi();
  }

  function toggleAuto() {
    autoOn = !autoOn;
    autoOvWait = 0;
    autoStuck = 0;
    autoBackT = 0;
    clearAutoKeys();
    keys.l = false;
    keys.r = false;
    keys.jump = false;
    keys.atk = false;
    keys.kick = false;
    keys.slow = false;
    keys.zoom = false;
    syncAutoUi();
    if (autoOn) {
      audio.ensure();
      if (G.mode === 'title') startGame(G.kind || 'shoot');
    }
  }

  function isAutoKey(e) {
    return e.code === 'KeyA' || e.key === 'a' || e.key === 'A';
  }

  function fireBullet(x, y, vx, vy, dmg) {
    G.bullets.push({
      x: x, y: y, vx: vx, vy: vy || 0, dmg: dmg || 2, life: 1.6, dead: false
    });
    capArr(G.bullets, 48);
  }
  function fireWave(x, vx, dmg) {
    G.waves.push({ x: x, vx: vx, life: 0.9, dmg: dmg || 2, hit: false });
    capArr(G.waves, 16);
  }

  function updateVfx(dt) {
    var wantS, wantZ, drain;
    if (G.mode === 'title') {
      wantS = !!demo.slow;
      wantZ = false;
    } else if (!playing()) {
      wantS = false;
      wantZ = false;
    } else if (autoPlaying()) {
      wantS = autoIn.slow && (G.slowOn ? G.vfx > 0 : G.vfx > VFX_MIN);
      wantZ = autoIn.zoom && (G.zoomOn ? G.vfx > 0 : G.vfx > VFX_MIN);
    } else {
      wantS = keys.slow && (G.slowOn ? G.vfx > 0 : G.vfx > VFX_MIN);
      wantZ = keys.zoom && (G.zoomOn ? G.vfx > 0 : G.vfx > VFX_MIN);
    }
    if (G.deadT > 0) { wantS = false; wantZ = false; }
    if (wantS && !G.slowOn) audio.slowOn();
    if (wantZ && !G.zoomOn) audio.zoomOn();
    G.slowOn = !!wantS;
    G.zoomOn = !!wantZ;
    drain = 0;
    if (G.slowOn && G.zoomOn) drain = 34;
    else if (G.slowOn) drain = 22;
    else if (G.zoomOn) drain = 18;
    if (drain) G.vfx = Math.max(0, G.vfx - drain * dt);
    else G.vfx = Math.min(VFX_MAX, G.vfx + 9 * dt);
    if (G.vfx <= 0) {
      G.slowOn = false;
      G.zoomOn = false;
    }
    G.zoomAmt = lerp(G.zoomAmt, REDUCE ? 1 : (G.zoomOn ? ZOOM_AMT : 1), Math.min(1, 8 * dt));
    if (vfxBar) vfxBar.style.transform = 'scaleX(' + clamp(G.vfx / VFX_MAX, 0, 1) + ')';
    if (vfxWrap) vfxWrap.classList.toggle('on', G.slowOn || G.zoomOn);
    if (vfxLabel) {
      vfxLabel.textContent = vfxName();
      vfxLabel.classList.toggle('slow', G.slowOn && !G.zoomOn);
      vfxLabel.classList.toggle('zoom', G.zoomOn && !G.slowOn);
      vfxLabel.classList.toggle('both', G.slowOn && G.zoomOn);
    }
    if (stageEl) {
      stageEl.classList.toggle('slow', G.slowOn);
      stageEl.classList.toggle('zoom', G.zoomOn);
    }
    if (G.slowOn && G.player && !REDUCE && ((G.clock * 24) | 0) !== ((G.clock - dt) * 24 | 0)) {
      ghosts.push({
        x: G.player.x, y: G.player.y, face: G.player.face,
        act: G.player.act, t: 0, life: 0.22
      });
      capArr(ghosts, 10);
    }
  }

  function updatePlayer(dt) {
    var p = G.player;
    var ax, spd, busy;
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

    busy = G.atkT > 0 && G.atkT > atkSpec().t * 0.28 && p.grounded && G.hurtT <= 0;
    ax = 0;
    if (!busy) {
      if (inL()) ax -= 1;
      if (inR()) ax += 1;
    }
    if (ax) p.face = ax;
    spd = WALK * (p.grounded ? 1 : AIR);
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
    if (G.jumpBuf > 0 && p.coyote > 0 && !G.jumpHeld && G.hurtT <= 0) {
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
        emit(3, {
          x: p.x, y: GY - 2, j: 6,
          vx0: -40, vx1: 40, vy0: -60, vy1: -8,
          r0: 1.2, r1: 2.4, life: 0.24, rgb: DUST, g: 80
        });
      }
      p.y = GY;
      p.vy = 0;
      p.grounded = true;
      G.airAtk = false;
    } else p.grounded = false;

    p.squash = lerp(p.squash, 1, Math.min(1, 14 * dt));
    p.run += dt * (ax ? 11 : 3.2);

    if (G.atkT > 0) p.act = G.atkKind === 'kick' ? 'kick' : (G.atkAir ? 'spin' : 'atk');
    else if (!p.grounded) p.act = 'jump';
    else if (G.hurtT > 0) p.act = 'hurt';
    else if (ax) p.act = 'walk';
    else p.act = 'idle';
  }

  function updateAtk(dt) {
    if (G.atkT <= 0) {
      if (G.atkBuf && G.deadT <= 0) startAtk(G.atkBuf === 2 ? 'kick' : 'punch');
      return;
    }
    var spec = atkSpec();
    var prev = G.atkT;
    G.atkT -= dt;
    if (!G.atkHit && prev > spec.t - spec.h1 && G.atkT <= spec.t - spec.h0) tryHit();
    if (G.atkT <= 0) {
      G.atkT = 0;
      if (G.atkBuf) startAtk(G.atkBuf === 2 ? 'kick' : 'punch');
    }
  }

  function overlapPlayer(e) {
    var p = G.player;
    if (!p || G.deadT > 0) return false;
    var hw = e.w * 0.5 + 10;
    if (Math.abs(e.x - p.x) > hw) return false;
    var pTop = p.y - 28;
    var eTop = e.y - e.h;
    return p.y > eTop + 6 && e.y > pTop + 6;
  }

  function tryEnemyHit(e) {
    if (e.atkHit || e.dead) return;
    if (!overlapPlayer(e)) return;
    e.atkHit = true;
    hurtPlayer(e.dmg, e.x, 150);
  }

  function updateEnt(e, dt) {
    var p = G.player;
    var dx, dist, want, fly;
    if (e.dead) {
      e.deadT -= dt;
      e.vy += GRAV * dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.vx *= 0.98;
      if (!isFly(e.kind) && e.y > GY) { e.y = GY; e.vy = 0; e.vx *= 0.5; }
      e.act = 'down';
      return;
    }
    if (e.flash > 0) e.flash -= dt;
    if (e.hurtT > 0) e.hurtT -= dt;
    if (e.stunT > 0) {
      e.stunT -= dt;
      e.x += e.vx * dt;
      e.vx *= Math.max(0, 1 - 5 * dt);
      e.vy += GRAV * dt;
      e.y += e.vy * dt;
      if (!isFly(e.kind) && e.y > GY) { e.y = GY; e.vy = 0; }
      e.act = 'hurt';
      return;
    }
    if (!p) return;
    fly = isFly(e.kind);
    dx = p.x - e.x;
    dist = Math.abs(dx);
    e.face = dx >= 0 ? 1 : -1;
    e.run += dt * 8;
    e.squash = lerp(e.squash, 1, Math.min(1, 10 * dt));
    if (e.cd > 0) e.cd -= dt;
    if (e.dashT > 0) e.dashT -= dt;

    if (e.atkT > 0) {
      e.atkT -= dt;
      e.act = 'atk';
      e.vx *= Math.max(0, 1 - 4 * dt);
      e.x += e.vx * dt;
      if (!e.atkHit && e.atkT < 0.16 && e.atkT > 0.04) tryEnemyHit(e);
      if (e.atkT <= 0) e.act = 'idle';
      if (!fly) {
        e.vy += GRAV * dt;
        e.y += e.vy * dt;
        if (e.y >= GY) { e.y = GY; e.vy = 0; e.grounded = true; }
      }
      return;
    }

    if (fly) {
      e.flyY = GY - 88 + Math.sin(G.t * 2 + e.x * 0.01) * 16;
      e.y = lerp(e.y, e.flyY, Math.min(1, 3 * dt));
      want = dist > 150 ? e.face * e.spd * 0.7 : (dist < 90 ? -e.face * e.spd * 0.5 : 0);
      e.vx = lerp(e.vx, want, Math.min(1, 4 * dt));
      e.x += e.vx * dt;
      e.act = 'walk';
      if (e.cd <= 0 && dist < 280 && combatOn()) {
        fireBullet(e.x, e.y, e.face * 220, 40, 2);
        audio.gun();
        e.cd = 1.35;
      }
      return;
    }

    e.vy += GRAV * dt;
    e.y += e.vy * dt;
    if (e.y >= GY) {
      if (!e.grounded && e.kind === 'hammer' && e.vy > 200) {
        fireWave(e.x, -160, 2);
        fireWave(e.x, 160, 2);
        kickCam(3.4, 'thump');
        audio.boom();
        e.squash = 1.18;
      }
      e.y = GY;
      e.vy = 0;
      e.grounded = true;
    } else e.grounded = false;

    if (e.kind === 'shooter') {
      if (dist < 150) want = -e.face * e.spd;
      else if (dist > 220) want = e.face * e.spd;
      else want = 0;
      e.vx = want;
      e.x += e.vx * dt;
      e.act = want ? 'walk' : 'idle';
      if (e.cd <= 0 && dist < 280 && combatOn()) {
        fireBullet(e.x + e.face * 12, e.y - 18, e.face * 260, 0, 2);
        audio.gun();
        e.cd = 1.15;
        e.act = 'atk';
      }
    } else if (e.kind === 'bomber') {
      if (dist > 100) { e.vx = e.face * e.spd; e.act = 'walk'; }
      else { e.vx = 0; e.act = 'idle'; }
      e.x += e.vx * dt;
      if (e.cd <= 0 && dist < 220 && combatOn()) {
        fireBullet(e.x, e.y - 20, e.face * 140, -220, 2);
        audio.gun();
        e.cd = 1.4;
        e.act = 'atk';
      }
    } else if (e.kind === 'director') {
      if (dist > 90) { e.vx = e.face * e.spd; e.act = 'walk'; }
      else e.vx = 0;
      e.x += e.vx * dt;
      if (e.cd <= 0 && combatOn()) {
        if (dist < 56) {
          e.atkT = 0.42;
          e.atkHit = false;
          e.act = 'atk';
          fireWave(e.x, e.face * 180, 3);
          audio.roar();
          e.cd = 1.6;
        } else {
          fireBullet(e.x + e.face * 16, e.y - 28, e.face * 200, 0, 2);
          fireBullet(e.x + e.face * 16, e.y - 22, e.face * 180, 40, 2);
          fireBullet(e.x + e.face * 16, e.y - 34, e.face * 180, -30, 2);
          audio.gun();
          e.cd = 1.5;
          e.act = 'atk';
        }
      }
    } else if (e.kind === 'hammer') {
      if (e.grounded && dist > 70 && dist < 180 && e.cd <= 0 && combatOn()) {
        e.vy = -380;
        e.vx = e.face * 160;
        e.grounded = false;
        e.cd = 1.8;
        e.act = 'jump';
      } else if (dist > 40) {
        e.vx = e.face * e.spd;
        e.act = 'walk';
      } else if (e.cd <= 0) {
        e.atkT = 0.4;
        e.atkHit = false;
        e.act = 'atk';
        e.cd = 1.1;
      } else e.vx *= 0.8;
      e.x += e.vx * dt;
    } else if (e.kind === 'devil') {
      if (e.dashT > 0) {
        e.vx = e.face * 280;
        e.act = 'atk';
        if (!e.atkHit) tryEnemyHit(e);
      } else if (e.grounded && dist > 90 && dist < 220 && e.cd <= 0 && combatOn() && ((G.t * 3) | 0) % 2 === 0) {
        e.dashT = 0.38;
        e.atkHit = false;
        e.cd = 1.4;
        audio.whoosh();
      } else if (dist > 50) {
        e.vx = e.face * e.spd;
        e.act = 'walk';
        if (e.cd <= 0 && combatOn() && dist < 260) {
          fireBullet(e.x + e.face * 14, e.y - 28, e.face * 240, -20, 3);
          fireBullet(e.x + e.face * 14, e.y - 20, e.face * 220, 30, 3);
          audio.gun();
          e.cd = 1.2;
        }
      } else if (e.cd <= 0) {
        e.atkT = 0.36;
        e.atkHit = false;
        e.act = 'atk';
        e.cd = 0.9;
      } else e.vx *= 0.7;
      e.x += e.vx * dt;
    } else {
      if (dist > 26) {
        e.vx = e.face * e.spd;
        e.act = 'walk';
      } else {
        e.vx = 0;
        if (e.cd <= 0 && combatOn()) {
          e.atkT = e.kind === 'knight' ? 0.4 : 0.32;
          e.atkHit = false;
          e.act = 'atk';
          e.cd = e.kind === 'knight' ? 0.95 : 0.7;
        } else e.act = 'idle';
      }
      e.x += e.vx * dt;
    }
    e.x = clamp(e.x, 20, G.levelW - 20);
    if (G.arena) e.x = clamp(e.x, G.lockL, G.lockR);
  }

  function updateBullets(dt) {
    var i, b, p = G.player;
    for (i = G.bullets.length - 1; i >= 0; i--) {
      b = G.bullets[i];
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.vy) b.vy += GRAV * 0.55 * dt;
      if (b.y > GY - 6) { b.y = GY - 6; b.vy *= -0.2; b.vx *= 0.7; }
      if (b.dead || b.life <= 0 || b.x < G.camX - 40 || b.x > G.camX + VW + 40) {
        G.bullets.splice(i, 1);
        continue;
      }
      if (p && G.deadT <= 0 && G.invuln <= 0 && G.mode !== 'title') {
        if (Math.abs(b.x - p.x) < 12 && Math.abs(b.y - (p.y - 16)) < 16) {
          G.bullets.splice(i, 1);
          hurtPlayer(b.dmg || 2, b.x, 120);
        }
      }
    }
  }
  function updateShots(dt) {
    var i, s, j, e;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      s.life -= dt;
      s.x += s.vx * dt;
      if (s.life <= 0 || s.x < G.camX - 40 || s.x > G.camX + VW + 40) {
        G.shots.splice(i, 1);
        continue;
      }
      for (j = 0; j < G.ents.length; j++) {
        e = G.ents[j];
        if (e.dead || e.hurtT > 0.08) continue;
        if (Math.abs(e.x - s.x) < e.w * 0.6 + 8 && Math.abs((e.y - e.h * 0.5) - s.y) < e.h * 0.5) {
          applyHit(e, {
            dmg: s.dmg || 2, knock: 90, face: s.vx > 0 ? 1 : -1,
            stop: 0.04, down: false, pts: SCORE.reflect
          });
          G.shots.splice(i, 1);
          break;
        }
      }
    }
  }
  function updateWaves(dt) {
    var i, w, p = G.player;
    for (i = G.waves.length - 1; i >= 0; i--) {
      w = G.waves[i];
      w.life -= dt;
      w.x += w.vx * dt;
      if (w.life <= 0) {
        G.waves.splice(i, 1);
        continue;
      }
      if (!w.hit && p && G.deadT <= 0 && G.invuln <= 0 && p.grounded && G.mode !== 'title') {
        if (Math.abs(w.x - p.x) < 18) {
          w.hit = true;
          hurtPlayer(w.dmg || 2, w.x, 160);
        }
      }
    }
  }
  function updatePickups(dt) {
    var i, r, p = G.player, c;
    for (i = 0; i < G.reels.length; i++) {
      r = G.reels[i];
      r.bob += dt * 4;
      if (r.taken || !p || G.deadT > 0) continue;
      if (Math.abs(r.x - p.x) < 16 && Math.abs(p.y - GY) < 28) {
        r.taken = true;
        G.hp = Math.min(HP_MAX, G.hp + 5);
        G.vfx = Math.min(VFX_MAX, G.vfx + 12);
        addScore(SCORE.reel);
        audio.pickup();
        toast('胶片', false, true);
        popSpark(r.x, r.y, GOLD, 12);
        syncHud();
      }
    }
    for (i = G.crates.length - 1; i >= 0; i--) {
      c = G.crates[i];
      if (c.dead) {
        c.deadT -= dt;
        if (c.deadT < 0) G.crates.splice(i, 1);
      }
    }
  }
  function updateWavesSpawn(dt) {
    var i, s;
    if (!isCut() || !playing()) return;
    G.waveT -= dt;
    for (i = G.spawnQ.length - 1; i >= 0; i--) {
      s = G.spawnQ[i];
      s.t -= dt;
      if (s.t <= 0) {
        G.ents.push(makeEnt(s.x, s.kind, G.wave));
        G.spawnQ.splice(i, 1);
        if (isBoss(s.kind)) {
          toast(KINDS[s.kind].name + '来了', true, false);
          audio.boss();
        }
      }
    }
  }

  function nextStageOrWave() {
    if (isCut()) {
      addScore(Math.round(SCORE.wave * G.wave * Math.max(1, G.mult)));
      spawnWave(G.wave + 1);
      return;
    }
    if (G.stage >= 3) {
      addScore(Math.round(SCORE.stage * G.stage));
      goWin();
      return;
    }
    addScore(Math.round(SCORE.stage * G.stage));
    G.stage += 1;
    G.hp = Math.min(HP_MAX, G.hp + 4);
    G.vfx = Math.min(VFX_MAX, G.vfx + 20);
    G.invuln = 0.6;
    loadStage(G.stage, false);
    toast('SCENE ' + G.stage, false, true);
    audio.stage();
    setHint(G.stage === 3 ? '火山棚 · 红帽魔' : '下一棚 · 连击别断', G.stage === 3 ? 'hot' : '');
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
        G.lockR = Math.min(G.levelW - 20, boss.x + 140);
        toast(KINDS[boss.kind].name + '来了', true, false);
        audio.boss();
        kickCam(3, 'boom');
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
    G.clearT = isCut() ? 0.85 : 1.05;
  }

  function updateCam(dt) {
    var p = G.player;
    var target, maxX, focus;
    if (!p) return;
    focus = G.zoomOn ? 0.48 : 0.32;
    target = p.x - VW * focus;
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
    var i, p, s, r, f, t, g;
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
    for (i = ghosts.length - 1; i >= 0; i--) {
      g = ghosts[i];
      g.t += dt;
      if (g.t > g.life) ghosts.splice(i, 1);
    }
  }

  function update(dt) {
    var i, pdt, wdt;
    G.clock += dt;
    if (autoOn) tickAutoFlow(dt);
    updateVfx(dt);
    if (G.stop > 0 && !(autoOn && autoSpeed >= 4 && G.mode === 'play')) {
      G.stop -= dt;
      updateFx(dt * 0.35);
      return;
    }
    if (autoOn && autoSpeed >= 4) G.stop = 0;
    if (autoOn && G.mode === 'play' && G.deadT <= 0) autoThink();
    wdt = G.slowOn ? dt * SLOW_SCALE : dt;
    pdt = G.slowOn ? dt * SLOW_PLAYER : dt;
    G.t += wdt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) dropCombo();
    }
    if (G.mode === 'title') demoThink();
    updatePlayer(pdt);
    updateAtk(pdt);
    for (i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], wdt);
    updateBullets(wdt);
    updateShots(wdt);
    updateWaves(wdt);
    updatePickups(wdt);
    updateWavesSpawn(wdt);
    if (playing()) checkClear(dt);
    updateCam(dt);
    updateFx(dt);
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
  function drawShadow(x, y, sca) {
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y) + 1 * scale, 10 * scale * (sca || 1), 3.2 * scale * (sca || 1), 0, 0, TAU);
    ctx.fill();
  }

  function drawSky() {
    var g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (G.theme === 'castle') {
      g.addColorStop(0, '#1a1020');
      g.addColorStop(0.5, '#241428');
      g.addColorStop(1, '#3a2038');
    } else if (G.theme === 'volcano') {
      g.addColorStop(0, '#1a0808');
      g.addColorStop(0.5, '#2a0c0c');
      g.addColorStop(1, '#4a1810');
    } else {
      g.addColorStop(0, '#2a1020');
      g.addColorStop(0.45, '#3a1424');
      g.addColorStop(1, '#5a2030');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    ctx.fillStyle = rgba(G.theme === 'volcano' ? LAVA : GOLD, G.theme === 'volcano' ? 0.22 : 0.14);
    ctx.beginPath();
    ctx.arc(sx(G.camX + 520), sy(70), 48 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(G.slowOn ? CYN : GOLD, 0.18);
    ctx.beginPath();
    ctx.arc(sx(G.camX + 520), sy(70), 22 * scale, 0, TAU);
    ctx.fill();
  }

  function drawFacade(x, w, h, rgb) {
    var px = sx(x);
    var py = sy(GY);
    var sc = scale;
    ctx.fillStyle = rgba(rgb, 0.92);
    ctx.fillRect(px, py - h * sc, w * sc, h * sc);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(px + 6 * sc, py - h * sc + 10 * sc, 8 * sc, 10 * sc);
    ctx.fillRect(px + w * sc - 16 * sc, py - h * 0.55 * sc, 8 * sc, 10 * sc);
    ctx.fillStyle = rgba(GOLD, 0.2);
    ctx.fillRect(px + 8 * sc, py - h * sc + 12 * sc, 4 * sc, 4 * sc);
  }
  function drawLight(x, h) {
    var px = sx(x);
    var py = sy(GY);
    var sc = scale;
    ctx.fillStyle = '#3a3040';
    ctx.fillRect(px - 2 * sc, py - h * sc, 4 * sc, h * sc);
    ctx.fillStyle = rgba(GOLD, 0.55);
    ctx.beginPath();
    ctx.arc(px, py - h * sc, 6 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.08);
    ctx.beginPath();
    ctx.moveTo(px - 4 * sc, py - h * sc);
    ctx.lineTo(px - 28 * sc, py);
    ctx.lineTo(px + 28 * sc, py);
    ctx.lineTo(px + 4 * sc, py - h * sc);
    ctx.fill();
  }
  function drawClap(x) {
    var px = sx(x);
    var py = sy(GY);
    var sc = scale;
    ctx.fillStyle = '#1a1a20';
    ctx.fillRect(px - 8 * sc, py - 22 * sc, 16 * sc, 12 * sc);
    ctx.fillStyle = rgba(GOLD, 0.8);
    ctx.fillRect(px - 8 * sc, py - 28 * sc, 16 * sc, 6 * sc);
    ctx.fillStyle = '#120408';
    var i;
    for (i = 0; i < 4; i++) ctx.fillRect(px - 7 * sc + i * 4 * sc, py - 27 * sc, 2 * sc, 4 * sc);
  }
  function drawTower(x, h) {
    var px = sx(x);
    var py = sy(GY);
    var sc = scale;
    ctx.fillStyle = rgba(CAST, 0.9);
    ctx.fillRect(px, py - h * sc, 22 * sc, h * sc);
    ctx.fillStyle = rgba(MAG, 0.35);
    ctx.beginPath();
    ctx.moveTo(px - 4 * sc, py - h * sc);
    ctx.lineTo(px + 11 * sc, py - (h + 16) * sc);
    ctx.lineTo(px + 26 * sc, py - h * sc);
    ctx.fill();
  }
  function drawRock(x, w, h) {
    ctx.fillStyle = rgba(G.theme === 'volcano' ? [80, 32, 28] : [48, 28, 36], 0.9);
    ctx.beginPath();
    ctx.moveTo(sx(x), sy(GY));
    ctx.lineTo(sx(x + 6), sy(GY - h));
    ctx.lineTo(sx(x + w - 6), sy(GY - h * 0.7));
    ctx.lineTo(sx(x + w), sy(GY));
    ctx.fill();
  }

  function drawDecor() {
    var x0 = G.camX - 40;
    var x1 = G.camX + VW + 80;
    var x, h, n;
    for (x = Math.floor(x0 / 80) * 80; x < x1; x += 80) {
      n = hash2((x * 13 + (G.theme === 'castle' ? 7 : G.theme === 'volcano' ? 19 : 3)) | 0);
      if (G.theme === 'castle') {
        if (n > 0.55) drawTower(x, 70 + n * 50);
        else if (n > 0.28) drawFacade(x, 48, 56 + n * 30, CAST);
      } else if (G.theme === 'volcano') {
        if (n > 0.5) drawRock(x, 36 + n * 20, 18 + n * 22);
        else if (n > 0.22) drawFacade(x, 40, 40 + n * 28, [90, 36, 32]);
      } else {
        if (n > 0.62) drawFacade(x, 52, 64 + n * 36, [72, 28, 40]);
        else if (n > 0.34) drawFacade(x, 40, 48 + n * 24, [56, 24, 36]);
        else if (n > 0.18) drawLight(x + 10, 90 + n * 40);
      }
      if (n > 0.82) drawClap(x + 18);
    }
    ctx.fillStyle = rgba(INK, 0.35);
    ctx.fillRect(sx(G.camX), sy(18), VW * scale, 10 * scale);
    var i, px;
    for (i = 0; i < 18; i++) {
      px = sx(G.camX + ((i * 42 + G.t * 30) % (VW + 40)) - 20);
      ctx.fillStyle = rgba(WHT, 0.18);
      ctx.fillRect(px, sy(20), 8 * scale, 6 * scale);
    }
  }

  function drawGround() {
    var g = ctx.createLinearGradient(0, sy(GY - 8), 0, sy(VH));
    if (G.theme === 'volcano') {
      g.addColorStop(0, '#5a2018');
      g.addColorStop(1, '#2a0c0c');
    } else if (G.theme === 'castle') {
      g.addColorStop(0, '#3a2844');
      g.addColorStop(1, '#1a101c');
    } else {
      g.addColorStop(0, '#4a2030');
      g.addColorStop(1, '#1a0c12');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, sy(GY), VW * scale, (VH - (GY - G.camY)) * scale);
    ctx.fillStyle = rgba(HOT, 0.35);
    ctx.fillRect(ox, sy(GY), VW * scale, 3 * scale);
    var x, n;
    for (x = Math.floor((G.camX - 20) / 36) * 36; x < G.camX + VW + 20; x += 36) {
      n = hash2((x * 9) | 0);
      ctx.fillStyle = rgba(INK, 0.18 + n * 0.1);
      ctx.fillRect(sx(x), sy(GY + 8), 22 * scale, 4 * scale);
    }
  }

  function drawCrate(c) {
    if (c.dead && c.deadT < 0.15) return;
    var sc = scale * (c.dead ? 0.7 : 1);
    var x = sx(c.x);
    var y = sy(GY);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = rgba([72, 44, 40], 0.95);
    ctx.fillRect(-10 * sc, -20 * sc, 20 * sc, 20 * sc);
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.lineWidth = 1.2 * sc;
    ctx.strokeRect(-10 * sc, -20 * sc, 20 * sc, 20 * sc);
    ctx.fillStyle = rgba(GOLD, 0.7);
    ctx.fillRect(-8 * sc, -18 * sc, 16 * sc, 3 * sc);
    var i;
    for (i = 0; i < 4; i++) ctx.fillRect(-7 * sc + i * 4 * sc, -17.5 * sc, 2 * sc, 2 * sc);
    ctx.restore();
  }
  function drawReel(z) {
    if (z.taken) return;
    var x = sx(z.x);
    var y = sy(z.y + Math.sin(z.bob) * 3);
    var sc = scale;
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.beginPath();
    ctx.arc(x, y, 7 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(INK, 0.85);
    ctx.beginPath();
    ctx.arc(x, y, 3 * sc, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(HOT, 0.7);
    ctx.lineWidth = 1.4 * sc;
    ctx.beginPath();
    ctx.arc(x, y, 5.2 * sc, 0, TAU);
    ctx.stroke();
  }

  function drawJoe(p, blink, ghostA) {
    if (blink && ((G.t * 18) | 0) % 2 === 0) return;
    var sc = scale * (p.scale || 1);
    var face = p.face || 1;
    var act = p.act || 'idle';
    var bob = (act === 'walk') ? Math.sin(p.run || 0) * 1.8 * sc : Math.sin(G.clock * 3) * 0.5 * sc;
    var sq = p.squash || 1;
    var x = sx(p.x);
    var y = sy(p.y);
    var atk = act === 'atk' || act === 'spin';
    var kicking = act === 'kick';
    var leg = act === 'walk' ? Math.sin(p.run || 0) * 4.2 * sc : (act === 'jump' || act === 'spin' ? -5 * sc : 0);
    var scarf = Math.sin(G.clock * 8) * 3 * sc;
    ctx.save();
    ctx.globalAlpha = ghostA == null ? 1 : ghostA;
    ctx.translate(x, y);
    if (act === 'spin') ctx.rotate(G.clock * 16 * face);
    if (act === 'down') { ctx.rotate(-0.55 * face); ctx.translate(0, 6 * sc); }
    ctx.scale(face, sq);

    ctx.strokeStyle = rgba(SCARF, 0.9);
    ctx.lineWidth = 2.4 * sc;
    ctx.beginPath();
    ctx.moveTo(-4 * sc, -18 * sc + bob);
    ctx.quadraticCurveTo(-14 * sc - scarf, -8 * sc, -16 * sc - scarf, 2 * sc);
    ctx.stroke();

    ctx.strokeStyle = rgba(RED, 0.95);
    ctx.lineWidth = 3.4 * sc;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3.4 * sc, -8 * sc);
    ctx.lineTo(-5 * sc - (kicking ? 0 : leg), kicking ? 2 * sc : 0);
    ctx.moveTo(3.4 * sc, -8 * sc);
    ctx.lineTo(kicking ? 16 * sc : (5 * sc + leg), kicking ? -6 * sc : 0);
    ctx.stroke();
    ctx.fillStyle = rgba(SCARF, 1);
    ctx.beginPath();
    ctx.ellipse(-5 * sc - (kicking ? 0 : leg), 1 * sc, 3.2 * sc, 1.6 * sc, 0, 0, TAU);
    ctx.ellipse(kicking ? 16 * sc : (5 * sc + leg), kicking ? -5 * sc : 1 * sc, 3.2 * sc, 1.6 * sc, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(RED, 1);
    fillRound(-6.5 * sc, -22 * sc + bob, 13 * sc, 16 * sc, 3.5 * sc);
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.moveTo(-1 * sc, -20 * sc + bob);
    ctx.lineTo(4 * sc, -16 * sc + bob);
    ctx.lineTo(-1 * sc, -12 * sc + bob);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = rgba(RED, 0.95);
    ctx.lineWidth = 2.8 * sc;
    ctx.beginPath();
    ctx.moveTo(-5 * sc, -18 * sc + bob);
    ctx.lineTo(-9 * sc, (atk ? -12 : -11) * sc + bob);
    ctx.moveTo(5 * sc, -19 * sc + bob);
    ctx.lineTo(atk ? 16 * sc : 8 * sc, (atk ? -20 : (kicking ? -14 : -16)) * sc + bob);
    ctx.stroke();
    ctx.fillStyle = rgba(SCARF, 1);
    ctx.beginPath();
    ctx.arc(-9 * sc, (atk ? -12 : -11) * sc + bob, 2.4 * sc, 0, TAU);
    ctx.arc(atk ? 16 * sc : 8 * sc, (atk ? -20 : (kicking ? -14 : -16)) * sc + bob, 2.5 * sc, 0, TAU);
    ctx.fill();

    if (atk || kicking) {
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc((kicking ? 18 : 16) * sc, (kicking ? -6 : -20) * sc + bob, 3.6 * sc, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(G.zoomOn ? GOLD : CYN, 0.6);
      ctx.lineWidth = 1.4 * sc;
      ctx.beginPath();
      ctx.arc((kicking ? 18 : 16) * sc, (kicking ? -6 : -20) * sc + bob, 7 * sc, 0, TAU);
      ctx.stroke();
    }

    ctx.fillStyle = rgba(RED, 1);
    ctx.beginPath();
    ctx.ellipse(1 * sc, -30 * sc + bob, 7.2 * sc, 7.6 * sc, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.beginPath();
    ctx.moveTo(-3.4 * sc, -32 * sc + bob);
    ctx.lineTo(6.4 * sc, -30 * sc + bob);
    ctx.lineTo(-3.4 * sc, -27.2 * sc + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(INK, 0.85);
    ctx.fillRect(-2.2 * sc, -31.2 * sc + bob, 7.2 * sc, 2.4 * sc);

    if (G.hurtT > 0 && ghostA == null) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-14 * sc, -42 * sc, 30 * sc, 44 * sc);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawGoon(e, pal, hat) {
    var sc = scale * (e.scale || 1);
    var x = sx(e.x);
    var y = sy(e.y);
    var bob = e.act === 'walk' ? Math.sin(e.run || 0) * 1.6 * sc : 0;
    var atk = e.act === 'atk';
    var leg = e.act === 'walk' ? Math.sin(e.run || 0) * 4 * sc : 0;
    ctx.save();
    ctx.translate(x, y);
    if (e.act === 'down') { ctx.rotate(-0.5 * e.face); ctx.translate(0, 6 * sc); }
    ctx.scale(e.face || 1, e.squash || 1);
    ctx.strokeStyle = rgba(pal, 0.95);
    ctx.lineWidth = 3 * sc;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3 * sc, -8 * sc);
    ctx.lineTo(-5 * sc - leg, 0);
    ctx.moveTo(3 * sc, -8 * sc);
    ctx.lineTo(5 * sc + leg, 0);
    ctx.stroke();
    ctx.fillStyle = rgba(pal, 1);
    fillRound(-6 * sc, -22 * sc + bob, 12 * sc, 16 * sc, 3 * sc);
    ctx.strokeStyle = rgba(SKIN, 0.95);
    ctx.lineWidth = 2.4 * sc;
    ctx.beginPath();
    ctx.moveTo(-5 * sc, -16 * sc + bob);
    ctx.lineTo(atk ? 14 * sc : -8 * sc, atk ? -18 * sc : -10 * sc);
    ctx.moveTo(5 * sc, -16 * sc + bob);
    ctx.lineTo(8 * sc, -10 * sc);
    ctx.stroke();
    ctx.fillStyle = rgba(SKIN, 1);
    ctx.beginPath();
    ctx.arc(1 * sc, -28 * sc + bob, 5 * sc, 0, TAU);
    ctx.fill();
    if (hat === 'cam') {
      ctx.fillStyle = '#2a2a32';
      ctx.fillRect(6 * sc, -22 * sc + bob, 10 * sc, 4 * sc);
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.beginPath();
      ctx.arc(16 * sc, -20 * sc + bob, 2 * sc, 0, TAU);
      ctx.fill();
    } else if (hat === 'knight') {
      ctx.fillStyle = rgba(CAST, 1);
      ctx.fillRect(-5 * sc, -34 * sc + bob, 12 * sc, 8 * sc);
      ctx.fillRect(-1 * sc, -38 * sc + bob, 4 * sc, 5 * sc);
    } else if (hat === 'bomb') {
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.arc(10 * sc, -16 * sc + bob, 4 * sc, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = '#1a1a22';
      ctx.fillRect(-5.5 * sc, -32 * sc + bob, 12 * sc, 3 * sc);
    }
    ctx.fillStyle = '#102018';
    ctx.beginPath();
    ctx.arc(2.6 * sc, -28 * sc + bob, 1.1 * sc, 0, TAU);
    ctx.fill();
    if (e.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-12 * sc, -40 * sc, 26 * sc, 42 * sc);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawDrone(e) {
    var sc = scale;
    var x = sx(e.x);
    var y = sy(e.y);
    var spin = G.t * 14;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = rgba(INK, 0.9);
    ctx.fillRect(-10 * sc, -6 * sc, 20 * sc, 12 * sc);
    ctx.fillStyle = rgba(CYN, 0.7);
    ctx.beginPath();
    ctx.arc(8 * sc, 0, 3 * sc, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(GOLD, 0.7);
    ctx.lineWidth = 1.4 * sc;
    ctx.beginPath();
    ctx.moveTo(-12 * sc, -8 * sc);
    ctx.lineTo(-4 * sc + Math.cos(spin) * 6 * sc, -14 * sc);
    ctx.moveTo(12 * sc, -8 * sc);
    ctx.lineTo(4 * sc + Math.cos(spin + 1) * 6 * sc, -14 * sc);
    ctx.stroke();
    if (e.flash > 0) {
      ctx.fillStyle = rgba(WHT, 0.3);
      ctx.fillRect(-12 * sc, -10 * sc, 24 * sc, 16 * sc);
    }
    ctx.restore();
  }

  function drawDirector(e) {
    var sc = scale * (e.scale || 1);
    var x = sx(e.x);
    var y = sy(e.y);
    var bob = Math.sin(e.run || 0) * 1.2 * sc;
    var atk = e.act === 'atk';
    ctx.save();
    ctx.translate(x, y);
    if (e.act === 'down') { ctx.rotate(-0.4 * e.face); ctx.translate(0, 8 * sc); }
    ctx.scale(e.face || 1, e.squash || 1);
    ctx.fillStyle = rgba(INK, 0.95);
    fillRound(-14 * sc, -36 * sc + bob, 28 * sc, 36 * sc, 4 * sc);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(-16 * sc, -48 * sc + bob, 32 * sc, 12 * sc);
    ctx.fillStyle = '#120408';
    var i;
    for (i = 0; i < 6; i++) ctx.fillRect(-14 * sc + i * 5 * sc, -46 * sc + bob, 3 * sc, 8 * sc);
    ctx.fillStyle = rgba(CYN, 0.8);
    ctx.fillRect(-8 * sc, -28 * sc + bob, 8 * sc, 6 * sc);
    ctx.fillRect(2 * sc, -28 * sc + bob, 8 * sc, 6 * sc);
    ctx.strokeStyle = rgba(INK, 0.9);
    ctx.lineWidth = 3.4 * sc;
    ctx.beginPath();
    ctx.moveTo(-12 * sc, -18 * sc);
    ctx.lineTo(atk ? -22 * sc : -16 * sc, atk ? -6 * sc : -4 * sc);
    ctx.moveTo(12 * sc, -18 * sc);
    ctx.lineTo(atk ? 24 * sc : 16 * sc, atk ? -8 * sc : -4 * sc);
    ctx.stroke();
    if (e.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.25);
      ctx.fillRect(-20 * sc, -52 * sc, 44 * sc, 56 * sc);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawHammer(e) {
    var sc = scale * (e.scale || 1);
    var x = sx(e.x);
    var y = sy(e.y);
    var bob = e.act === 'walk' ? Math.sin(e.run || 0) * 1.4 * sc : 0;
    var atk = e.act === 'atk';
    ctx.save();
    ctx.translate(x, y);
    if (e.act === 'down') { ctx.rotate(-0.4 * e.face); ctx.translate(0, 8 * sc); }
    ctx.scale(e.face || 1, e.squash || 1);
    ctx.fillStyle = '#5a3a28';
    fillRound(-12 * sc, -32 * sc + bob, 24 * sc, 32 * sc, 5 * sc);
    ctx.fillStyle = rgba(SKIN, 1);
    ctx.beginPath();
    ctx.arc(2 * sc, -40 * sc + bob, 8 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3a2218';
    ctx.fillRect(-6 * sc, -48 * sc + bob, 16 * sc, 6 * sc);
    ctx.fillStyle = '#8a6a48';
    ctx.save();
    ctx.translate(10 * sc, -24 * sc + bob);
    ctx.rotate(atk ? -0.9 : -0.2);
    ctx.fillRect(0, -4 * sc, 28 * sc, 6 * sc);
    ctx.fillStyle = '#3a2a20';
    ctx.fillRect(22 * sc, -12 * sc, 14 * sc, 22 * sc);
    ctx.restore();
    if (e.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.25);
      ctx.fillRect(-16 * sc, -52 * sc, 36 * sc, 54 * sc);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawDevil(e) {
    var sc = scale * (e.scale || 1);
    var x = sx(e.x);
    var y = sy(e.y);
    var bob = Math.sin(e.run || 0) * 1.5 * sc;
    var atk = e.act === 'atk';
    ctx.save();
    ctx.translate(x, y);
    if (e.act === 'down') { ctx.rotate(-0.45 * e.face); ctx.translate(0, 8 * sc); }
    ctx.scale(e.face || 1, e.squash || 1);
    ctx.fillStyle = rgba(RED, 0.55);
    ctx.beginPath();
    ctx.moveTo(-4 * sc, -20 * sc);
    ctx.quadraticCurveTo(-22 * sc, -10 * sc, -18 * sc, 4 * sc);
    ctx.lineTo(-2 * sc, -8 * sc);
    ctx.fill();
    ctx.fillStyle = rgba(RED, 1);
    fillRound(-10 * sc, -34 * sc + bob, 20 * sc, 34 * sc, 6 * sc);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.beginPath();
    ctx.moveTo(-2 * sc, -30 * sc + bob);
    ctx.lineTo(6 * sc, -24 * sc + bob);
    ctx.lineTo(-2 * sc, -18 * sc + bob);
    ctx.fill();
    ctx.fillStyle = rgba(RED, 1);
    ctx.beginPath();
    ctx.arc(2 * sc, -44 * sc + bob, 9 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.beginPath();
    ctx.moveTo(-8 * sc, -50 * sc + bob);
    ctx.lineTo(-4 * sc, -62 * sc + bob);
    ctx.lineTo(0, -50 * sc + bob);
    ctx.moveTo(4 * sc, -50 * sc + bob);
    ctx.lineTo(10 * sc, -64 * sc + bob);
    ctx.lineTo(12 * sc, -48 * sc + bob);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.beginPath();
    ctx.moveTo(-4 * sc, -46 * sc + bob);
    ctx.lineTo(8 * sc, -44 * sc + bob);
    ctx.lineTo(-4 * sc, -40 * sc + bob);
    ctx.fill();
    ctx.strokeStyle = rgba(RED, 0.95);
    ctx.lineWidth = 3 * sc;
    ctx.beginPath();
    ctx.moveTo(8 * sc, -24 * sc);
    ctx.lineTo(atk ? 22 * sc : 12 * sc, atk ? -28 * sc : -12 * sc);
    ctx.stroke();
    if (e.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.25);
      ctx.fillRect(-16 * sc, -66 * sc, 36 * sc, 70 * sc);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawEnt(e) {
    if (e.dead && e.deadT < 0) return;
    if (e.dead && e.deadT < 0.2 && ((G.t * 24) | 0) % 2 === 0) return;
    if (e.kind !== 'drone') drawShadow(e.x, e.y, (e.scale || 1) * (isBoss(e.kind) ? 1.4 : 1));
    if (e.kind === 'drone') drawDrone(e);
    else if (e.kind === 'director') drawDirector(e);
    else if (e.kind === 'hammer') drawHammer(e);
    else if (e.kind === 'devil') drawDevil(e);
    else if (e.kind === 'knight') drawGoon(e, CAST, 'knight');
    else if (e.kind === 'bomber') drawGoon(e, [90, 40, 36], 'bomb');
    else if (e.kind === 'shooter') drawGoon(e, [48, 40, 56], 'cam');
    else drawGoon(e, INK, 'hat');
    if (e.max && e.hp < e.max && e.hp > 0 && !e.dead) {
      var bw = 22 * scale * (e.scale || 1);
      var by = e.kind === 'drone' ? e.y - 16 : e.y - 46 * (e.scale || 1);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(sx(e.x) - bw / 2, sy(by), bw, 3.2 * scale);
      ctx.fillStyle = rgba(e.hp / e.max < 0.34 ? MAG : HOT, 0.9);
      ctx.fillRect(sx(e.x) - bw / 2, sy(by), bw * (e.hp / e.max), 3.2 * scale);
    }
  }

  function drawBullet(b, friend) {
    var x = sx(b.x);
    var y = sy(b.y);
    var crawl = G.slowOn && !friend;
    ctx.fillStyle = rgba(friend ? CYN : GOLD, 0.95);
    ctx.beginPath();
    ctx.ellipse(x, y, (friend ? 6 : 5) * scale, 2 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(friend ? WHT : HOT, 0.5);
    ctx.fillRect(x - (b.vx > 0 ? 10 : 0) * scale, y - 1 * scale, 10 * scale, 2 * scale);
    if (crawl) {
      ctx.strokeStyle = rgba(CYN, 0.55);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.arc(x, y, 8 * scale, 0, TAU);
      ctx.stroke();
    }
  }
  function drawShock(w) {
    var x = sx(w.x);
    var y = sy(GY - 4);
    ctx.fillStyle = rgba(GOLD, 0.45 * (w.life / 0.9));
    ctx.beginPath();
    ctx.ellipse(x, y, 16 * scale, 5 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(HOT, 0.6);
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(x - 10 * scale, y);
    ctx.lineTo(x + 10 * scale, y - 8 * scale);
    ctx.stroke();
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
      ctx.strokeStyle = rgba(t.kick ? GOLD : HOT, 0.5 * a);
      ctx.lineWidth = 2.6 * scale;
      ctx.beginPath();
      ctx.moveTo(8 * scale, -4 * scale);
      ctx.quadraticCurveTo((t.reach * 0.55) * scale, t.kick ? 8 * scale : -18 * scale, t.reach * scale, t.kick ? 4 * scale : 2 * scale);
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

  function drawLetterbox() {
    var bar;
    if (G.zoomAmt <= 1.02) return;
    bar = 26 * ((G.zoomAmt - 1) / (ZOOM_AMT - 1));
    ctx.fillStyle = '#080204';
    ctx.fillRect(ox, oy, VW * scale, bar * scale);
    ctx.fillRect(ox, oy + (VH - bar) * scale, VW * scale, bar * scale);
  }

  function drawVfxBanner() {
    var txt, rgb;
    if (!G.slowOn && !G.zoomOn) return;
    if (G.slowOn && G.zoomOn) { txt = 'VIEWTIFUL'; rgb = GOLD; }
    else if (G.slowOn) { txt = 'SLOW'; rgb = CYN; }
    else { txt = 'ZOOM'; rgb = GOLD; }
    ctx.save();
    ctx.font = '900 ' + (16 * scale) + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = rgba(rgb, 0.85);
    ctx.fillText(txt, ox + 12 * scale, oy + 28 * scale);
    ctx.restore();
  }

  function draw() {
    var i, p, shx = 0, shy = 0, z;
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#120408';
    ctx.fillRect(0, 0, W, H);
    if (G.shake > 0 && !REDUCE) {
      shx = (hash2((G.t * 80) | 0) - 0.5) * G.shake * 1.6;
      shy = (hash2((G.t * 80 + 9) | 0) - 0.5) * G.shake * 1.2;
    }
    ctx.save();
    ctx.translate(shx, shy);
    z = G.punch * (REDUCE ? 1 : G.zoomAmt);
    if (z !== 1) {
      ctx.translate(W / 2, H / 2);
      ctx.scale(z, z);
      ctx.translate(-W / 2, -H / 2);
    }

    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();

    drawSky();
    drawDecor();
    drawGround();
    for (i = 0; i < G.crates.length; i++) drawCrate(G.crates[i]);
    for (i = 0; i < G.reels.length; i++) drawReel(G.reels[i]);
    drawTrails();
    G.ents.sort(function (a, b) { return a.y - b.y; });
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    for (i = 0; i < G.bullets.length; i++) drawBullet(G.bullets[i], false);
    for (i = 0; i < G.shots.length; i++) drawBullet(G.shots[i], true);
    for (i = 0; i < G.waves.length; i++) drawShock(G.waves[i]);
    for (i = 0; i < ghosts.length; i++) {
      drawJoe(ghosts[i], false, 0.28 * (1 - ghosts[i].t / ghosts[i].life));
    }
    p = G.player;
    if (p) {
      drawShadow(p.x, p.y, 1);
      drawJoe(p, G.invuln > 0 && G.mode !== 'title' && ((G.t * 16) | 0) % 2 === 0);
    }
    drawGate();
    drawFx();
    drawLetterbox();
    drawVfxBanner();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb || HOT, G.flash * 0.35);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
    if (G.slowOn) {
      ctx.fillStyle = 'rgba(0, 40, 80, 0.12)';
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
    var isMove, space, jump, kick, slow, zoom;
    if (isAutoKey(e)) {
      if (down && !e.repeat) {
        audio.ensure();
        toggleAuto();
      }
      e.preventDefault();
      return;
    }
    if (e.target === speedEl) return;

    isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    space = k === ' ' || k === 'Spacebar' || code === 'Space';
    jump = k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up';
    kick = k === 'ArrowDown' || k === 's' || k === 'S' || k === 'x' || k === 'X' || k === 'k' || k === 'K';
    slow = k === 'v' || k === 'V';
    zoom = k === 'c' || k === 'C';

    if (!autoOn) {
      if (k === 'ArrowLeft' || k === 'Left') keys.l = down;
      if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
      if (jump) keys.jump = down;
      if (space) keys.atk = down;
      if (kick) keys.kick = down;
      if (slow) keys.slow = down;
      if (zoom) keys.zoom = down;
    } else if (down && (isMove || space || kick || slow || zoom)) {
      e.preventDefault();
    }

    if (down && (isMove || space || k === 'Enter' || slow || zoom || kick)) e.preventDefault();
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
    if (overlayOpen()) {
      if (space || k === 'Enter') primaryAction();
      if (k === '2' && G.mode === 'title') startGame('cut');
      if (k === '1' && G.mode === 'title') startGame('shoot');
      return;
    }
    if (autoOn) return;
    if (space) {
      if (playing() || G.mode === 'title') doAtk('punch');
    }
    if (kick) {
      if (playing() || G.mode === 'title') doAtk('kick');
    }
  }

  function bindPad() {
    function hold(el, on, off) {
      if (!el) return;
      var down = function (e) {
        e.preventDefault();
        if (autoOn) return;
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
      keys.atk = true;
      if (playing()) doAtk('punch');
    }, function () { keys.atk = false; });
    hold(document.getElementById('btn-kick'), function () {
      if (overlayOpen()) return;
      keys.kick = true;
      if (playing()) doAtk('kick');
    }, function () { keys.kick = false; });
    hold(document.getElementById('btn-slow'), function () { keys.slow = true; }, function () { keys.slow = false; });
    hold(document.getElementById('btn-zoom'), function () { keys.zoom = true; }, function () { keys.zoom = false; });
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen() || autoOn) return;
      if (playing()) doAtk('punch');
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
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
    var turbo = autoOn && autoSpeed >= 4 && G.mode === 'play';
    if (turbo) G.stop = 0;
    acc += dt * autoScale();
    var n = 0;
    var maxSteps = turbo ? 16 : 5;
    while (acc >= STEP && n < maxSteps) {
      update(STEP);
      acc -= STEP;
      n += 1;
    }
    if (acc > STEP * 4) acc = 0;
    draw();
  }

  function initMute() {
    var m = false;
    try { m = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { m = false; }
    audio.setMuted(m);
  }

  loadBest();
  initMute();
  autoSpeed = loadAutoSpeed();
  syncSpeedUi();
  syncAutoUi();
  goTitle();
  resize();
  bindPointer();
  bindPad();

  if (btnShoot) {
    btnShoot.addEventListener('click', function () {
      audio.ensure();
      startGame('shoot');
    });
  }
  if (btnCut) {
    btnCut.addEventListener('click', function () {
      audio.ensure();
      startGame('cut');
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
      if (G.mode === 'win' && !isCut()) startGame('cut');
      else goTitle();
    });
  }
  if (modeShoot) {
    modeShoot.addEventListener('click', function () {
      audio.ensure();
      startGame('shoot');
    });
  }
  if (modeCut) {
    modeCut.addEventListener('click', function () {
      audio.ensure();
      startGame('cut');
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  if (btnAuto) {
    btnAuto.addEventListener('click', function () {
      audio.ensure();
      toggleAuto();
    });
  }
  if (speedEl) {
    speedEl.addEventListener('input', function () { setAutoSpeed(parseInt(speedEl.value, 10)); });
    speedEl.addEventListener('change', function () { setAutoSpeed(parseInt(speedEl.value, 10)); });
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
      keys.kick = false;
      keys.slow = false;
      keys.zoom = false;
    }
  });

  requestAnimationFrame(frame);
})();
