'use strict';

/* 气斗 — Balloon Fight remake. No CDN. */

(function () {
  var WORLD_W = 640;
  var WORLD_H = 400;
  var WATER_Y = 366;
  var LIVES = 3;
  var POP_EPS = 6;
  var HW = 10;
  var HH = 12;
  var GRAV = [780, 505, 412];
  var FLAP = [0, -186, -238];
  var MAX_UP = [40, -248, -292];
  var MAX_FALL = [390, 248, 206];
  var ACCEL_G = 540;
  var ACCEL_A = 365;
  var FRICT_G = 6.8;
  var FRICT_A = 0.48;
  var MAX_VX_G = 132;
  var MAX_VX_A = 172;
  var FLAP_CD = 0.086;
  var PAD_FLAP = 0.11;
  var COMBO_WIN = 2.05;
  var INVULN = 1.55;
  var DIE_T = 0.82;
  var FISH_HOVER = 1.12;
  var FISH_LOW = 48;
  var STEP = 1 / 60;
  var TAU = Math.PI * 2;
  var BEST_KEY = 'playbox-balloon-kid-best';
  var MUTE_KEY = 'playbox-balloon-kid-mute';
  var LIFE_CAP = 6;
  var LIFE_AT = 20000;

  var CYN = [0, 240, 255];
  var SKY = [30, 168, 255];
  var MAG = [255, 61, 184];
  var GOLD = [255, 227, 107];
  var HOT = [255, 154, 74];
  var WHT = [232, 244, 255];
  var PNK = [255, 140, 200];
  var GRN = [80, 220, 140];
  var PUR = [170, 120, 255];

  var KIND_RGB = {
    hero: SKY,
    pink: PNK,
    green: GRN,
    gold: GOLD
  };

  var KIND_BALL = {
    hero: 2,
    pink: 1,
    green: 2,
    gold: 2
  };

  var KIND_SCORE = { pink: 500, green: 750, gold: 1000 };

  var STAGES = [
    {
      name: '港湾',
      plats: [
        { x: 0, y: 232, w: 168, h: 14, kind: 'land' },
        { x: 472, y: 232, w: 168, h: 14, kind: 'land' },
        { x: 248, y: 142, w: 144, h: 12, kind: 'cloud' }
      ]
    },
    {
      name: '双岛',
      plats: [
        { x: 24, y: 168, w: 150, h: 14, kind: 'land' },
        { x: 466, y: 168, w: 150, h: 14, kind: 'land' },
        { x: 210, y: 248, w: 220, h: 14, kind: 'land' },
        { x: 268, y: 96, w: 104, h: 12, kind: 'cloud' }
      ]
    },
    {
      name: '云桥',
      plats: [
        { x: 40, y: 118, w: 130, h: 12, kind: 'cloud', vx: 26 },
        { x: 430, y: 118, w: 130, h: 12, kind: 'cloud', vx: -26 },
        { x: 200, y: 210, w: 240, h: 14, kind: 'land' },
        { x: 0, y: 292, w: 110, h: 12, kind: 'cloud' },
        { x: 530, y: 292, w: 110, h: 12, kind: 'cloud' }
      ]
    },
    {
      name: '断崖',
      plats: [
        { x: 0, y: 156, w: 118, h: 14, kind: 'land' },
        { x: 522, y: 156, w: 118, h: 14, kind: 'land' },
        { x: 248, y: 112, w: 144, h: 12, kind: 'cloud' },
        { x: 176, y: 268, w: 96, h: 12, kind: 'cloud', vx: 32 },
        { x: 368, y: 268, w: 96, h: 12, kind: 'cloud', vx: -32 }
      ]
    },
    {
      name: '密云',
      plats: [
        { x: 70, y: 92, w: 120, h: 12, kind: 'cloud' },
        { x: 450, y: 92, w: 120, h: 12, kind: 'cloud' },
        { x: 220, y: 168, w: 200, h: 12, kind: 'cloud', vx: 18 },
        { x: 16, y: 248, w: 140, h: 14, kind: 'land' },
        { x: 484, y: 248, w: 140, h: 14, kind: 'land' },
        { x: 270, y: 300, w: 100, h: 12, kind: 'cloud' }
      ]
    }
  ];

  var TRIP_PLATS = [
    { x: 80, y: 150, w: 120, h: 12, kind: 'cloud', vx: 22 },
    { x: 360, y: 210, w: 130, h: 12, kind: 'cloud', vx: -18 },
    { x: 200, y: 88, w: 100, h: 12, kind: 'cloud', vx: 14 }
  ];

  var BONUS_RGB = [MAG, GOLD, CYN];

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
  function wrapX(x) {
    return ((x % WORLD_W) + WORLD_W) % WORLD_W;
  }
  function wrapDx(ax, bx) {
    var d = bx - ax;
    if (d > WORLD_W * 0.5) d -= WORLD_W;
    if (d < -WORLD_W * 0.5) d += WORLD_W;
    return d;
  }
  function comboMul(n) {
    return 1 + Math.min(4, Math.max(0, (n | 0) - 1));
  }
  function balloonsOf(u) {
    var n = u.balloons | 0;
    if (n < 0) return 0;
    if (n > 2) return 2;
    return n;
  }
  function gravOf(u) {
    if (u.state === 'chute') return 118;
    if (u.state === 'fall') return GRAV[0];
    return GRAV[balloonsOf(u)];
  }
  function flapOf(u) {
    if (u.state === 'chute' || u.state === 'fall' || u.state === 'dead') return 0;
    return FLAP[balloonsOf(u)];
  }
  function maxFallOf(u) {
    if (u.state === 'chute') return 72;
    if (u.state === 'fall') return MAX_FALL[0];
    return MAX_FALL[balloonsOf(u)];
  }
  function maxUpOf(u) {
    if (u.state === 'chute' || u.state === 'fall') return 40;
    return MAX_UP[balloonsOf(u)];
  }
  function bodyHW(u) {
    return u.role === 'bonus' ? (u.r || 16) : HW;
  }
  function bodyHH(u) {
    if (u.role === 'bonus') return u.r || 16;
    if (u.state === 'chute') return 16;
    return HH + (balloonsOf(u) > 0 ? 8 : 0);
  }
  function popWinner(ay, by, eps) {
    if (ay < by - eps) return -1;
    if (by < ay - eps) return 1;
    return 0;
  }
  function stageIndex(wave) {
    return ((wave < 1 ? 1 : wave) - 1) % STAGES.length;
  }
  function waveSpec(wave) {
    var w = wave < 1 ? 1 : wave;
    var g = 2;
    var p = 1;
    var y = 0;
    if (w === 1) { g = 2; p = 1; y = 0; }
    else if (w === 2) { g = 2; p = 2; y = 0; }
    else if (w === 3) { g = 3; p = 2; y = 0; }
    else if (w === 4) { g = 2; p = 2; y = 1; }
    else if (w === 5) { g = 3; p = 1; y = 2; }
    else {
      g = 2 + (w % 2);
      p = 1 + ((w + 1) % 2);
      y = Math.min(3, 1 + ((w - 4) >> 1));
    }
    var total = g + p + y;
    if (total > 7) {
      p = Math.max(0, p - (total - 7));
      total = g + p + y;
    }
    return { g: g, p: p, y: y, total: total };
  }
  function clonePlats(src) {
    var i, a = [], p;
    for (i = 0; i < src.length; i++) {
      p = src[i];
      a.push({
        x: p.x, y: p.y, w: p.w, h: p.h,
        kind: p.kind || 'land',
        vx: p.vx || 0,
        ox: p.x
      });
    }
    return a;
  }
  function xOnPlat(p, x) {
    return x >= p.x - 2 && x <= p.x + p.w + 2;
  }
  function platLandAt(plats, x, y, prevY, foot) {
    var i, p, feet, prevFeet;
    feet = y + foot;
    prevFeet = prevY + foot;
    for (i = 0; i < plats.length; i++) {
      p = plats[i];
      if (!xOnPlat(p, x)) continue;
      if (prevFeet <= p.y + 3 && feet >= p.y && feet <= p.y + 18) return i;
    }
    return -1;
  }
  function platCeilAt(plats, x, y, prevY, headOff) {
    var i, p, head, prevHead, bot;
    head = y - headOff;
    prevHead = prevY - headOff;
    for (i = 0; i < plats.length; i++) {
      p = plats[i];
      if (x < p.x + 6 || x > p.x + p.w - 6) continue;
      bot = p.y + p.h;
      if (prevHead >= bot - 2 && head <= bot && head >= p.y - 4) return i;
    }
    return -1;
  }
  function spawnX(i, n) {
    var t = (i + 0.5) / Math.max(1, n);
    return wrapX(40 + t * (WORLD_W - 80) + (i % 2 ? 28 : -28));
  }

  function selfCheck() {
    var w1, w5, w8, a, b, plats, i;

    if (STAGES.length !== 5) throw new Error('5 stage layouts');
    if (LIVES !== 3) throw new Error('3 lives');
    if (FLAP[2] >= 0 || FLAP[1] >= 0) throw new Error('flap lifts');
    if (WATER_Y <= 300) throw new Error('water low');
    if (popWinner(100, 120, POP_EPS) !== -1) throw new Error('higher wins');
    if (popWinner(120, 100, POP_EPS) !== 1) throw new Error('lower loses');
    if (popWinner(100, 104, POP_EPS) !== 0) throw new Error('near-equal bounce');
    if (popWinner(100, 100 + POP_EPS, POP_EPS) !== 0) throw new Error('eps is bounce');
    if (Math.abs(wrapX(-5) - (WORLD_W - 5)) > 0.01) throw new Error('wrap left');
    if (Math.abs(wrapX(WORLD_W + 8) - 8) > 0.01) throw new Error('wrap right');
    if (Math.abs(wrapDx(10, WORLD_W - 10) + 20) > 0.01) throw new Error('wrap dx seam');
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(2) !== 2) throw new Error('combo 2');
    if (comboMul(5) !== 5) throw new Error('combo cap 5');
    if (comboMul(9) !== 5) throw new Error('combo max 5x');
    if (KIND_BALL.pink !== 1) throw new Error('pink 1 balloon');
    if (KIND_BALL.green !== 2) throw new Error('green 2 balloons');
    if (KIND_SCORE.gold <= KIND_SCORE.pink) throw new Error('gold pays more');
    w1 = waveSpec(1);
    w5 = waveSpec(5);
    w8 = waveSpec(8);
    if (w1.g !== 2 || w1.p !== 1 || w1.y !== 0) throw new Error('wave1 mix');
    if (w1.total < 3) throw new Error('wave1 count');
    if (w5.y < 1) throw new Error('wave5 gold');
    if (w8.total < w1.total) throw new Error('later denser');
    if (stageIndex(1) !== 0) throw new Error('stage1 idx');
    if (stageIndex(6) !== 0) throw new Error('stage wrap');
    if (STAGES[0].plats.length < 3) throw new Error('harbor plats');
    plats = clonePlats(STAGES[0].plats);
    i = platLandAt(plats, 80, plats[0].y - 12, plats[0].y - 24, 12);
    if (i !== 0) throw new Error('land left dock');
    if (platLandAt(plats, 320, 40, 20, 12) !== -1) throw new Error('air no land');
    if (WATER_Y <= plats[0].y) throw new Error('plats above water');
    if (TRIP_PLATS.length !== 3) throw new Error('trip 3 clouds');
    if (BONUS_RGB.length !== 3) throw new Error('3 bonus balloons');
    if (gravOf({ state: 'fly', balloons: 2 }) >= gravOf({ state: 'fly', balloons: 1 })) {
      throw new Error('2 balloons lighter');
    }
    if (gravOf({ state: 'chute', balloons: 0 }) >= gravOf({ state: 'fall', balloons: 0 })) {
      throw new Error('chute slower than fall');
    }
    if (flapOf({ state: 'fly', balloons: 0 }) !== 0) throw new Error('no flap empty');
    a = { x: 10, y: 80 };
    b = { x: WORLD_W - 10, y: 80 };
    if (Math.abs(wrapDx(a.x, b.x)) >= 40) throw new Error('wrap near');
    if (LIFE_AT < 10000) throw new Error('1up spacing');
  }

  selfCheck();

  if (typeof document === 'undefined') return;

  var canvas = document.getElementById('c');
  var ctx = canvas.getContext('2d', { alpha: false });
  var stageEl = document.getElementById('stage');
  var overlayEl = document.getElementById('overlay');
  var panelEl = document.getElementById('panel');
  var ovTitle = document.getElementById('ov-title');
  var ovLead = document.getElementById('ov-lead');
  var ovOps = document.getElementById('ov-ops');
  var ovKicker = document.getElementById('ov-kicker');
  var ovStart = document.getElementById('ov-start');
  var ovEnd = document.getElementById('ov-end');
  var ovRetry = document.getElementById('ov-retry');
  var ovMenu = document.getElementById('ov-menu');
  var btnSky = document.getElementById('btn-sky');
  var btnTrip = document.getElementById('btn-trip');
  var btnMute = document.getElementById('btn-mute');
  var btnRetry = document.getElementById('btn-retry');
  var btnLeft = document.getElementById('btn-left');
  var btnRight = document.getElementById('btn-right');
  var btnFlap = document.getElementById('btn-flap');
  var scoreEl = document.getElementById('score');
  var waveEl = document.getElementById('wave');
  var bestEl = document.getElementById('best');
  var comboEl = document.getElementById('combo');
  var comboBox = document.getElementById('combo-box');
  var scoreBox = document.getElementById('score-box');
  var scoreAdd = document.getElementById('score-add');
  var labWave = document.getElementById('lab-wave');
  var modeLabel = document.getElementById('mode-label');
  var tagLabel = document.getElementById('tag-label');
  var pipsEl = document.getElementById('pips');
  var toastEl = document.getElementById('toast');
  var hintEl = document.getElementById('hint');
  var motionQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var coarseQ = window.matchMedia('(pointer: coarse)');

  var dpr = 1;
  var cssW = 0;
  var cssH = 0;
  var L = { x: 0, y: 0, s: 1 };
  var lastTs = 0;
  var acc = 0;
  var hidden = false;
  var toastTok = 0;
  var addTok = 0;
  var kickTok = 0;

  var particles = [];
  var sparks = [];
  var floats = [];
  var rings = [];
  var motes = [];
  var splashes = [];

  var keys = { l: false, r: false, flap: false, flapHeld: false };
  var ptr = { down: false, id: null, l: false, r: false };

  var G = {
    mode: 'title',
    kind: 'sky',
    clock: 0,
    wave: 1,
    waveT: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboAge: 0,
    nextLife: LIFE_AT,
    player: null,
    foes: [],
    balloons: [],
    bubbles: [],
    bolts: [],
    plats: [],
    fish: null,
    spawnQ: [],
    spawnCd: 0,
    clearT: 0,
    stop: 0,
    shake: 0,
    kickX: 0,
    kickY: 0,
    flash: 0,
    flashRgb: SKY,
    why: '',
    popLeft: 3,
    wind: 0
  };

  function reduceMotion() {
    return motionQ.matches;
  }

  function isTrip() {
    return G.kind === 'trip';
  }

  /* ---- audio ---- */
  var audio = {
    ctx: null,
    master: null,
    muted: false,
    noiseBuf: null,
    ensure: function () {
      if (!this.ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.38;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.38;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) { /* ignore */ }
    },
    beep: function (freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      var t = this.ctx.currentTime;
      var o = this.ctx.createOscillator();
      var g = this.ctx.createGain();
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
        var sr = this.ctx.sampleRate;
        var buf = this.ctx.createBuffer(1, (sr * 0.4) | 0, sr);
        var data = buf.getChannelData(0);
        var i;
        for (i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      var src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      var f = this.ctx.createBiquadFilter();
      f.type = type || 'bandpass';
      f.frequency.value = freq || 900;
      f.Q.value = type === 'lowpass' ? 0.7 : 1.1;
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
    flap: function () {
      this.ensure();
      this.beep(260, 0.046, 'square', 0.038, 560);
      this.noise(0.04, 0.04, 1500, 'highpass');
    },
    pop: function (combo) {
      this.ensure();
      var p = 1 + Math.min(6, combo) * 0.07;
      this.beep(520 * p, 0.07, 'square', 0.07, 180);
      this.beep(980 * p, 0.09, 'triangle', 0.055, 420 * p);
      this.noise(0.08, 0.1, 1200, 'bandpass');
    },
    bounce: function () {
      this.ensure();
      this.beep(300, 0.05, 'square', 0.04, 160);
      this.noise(0.04, 0.04, 700, 'bandpass');
    },
    chute: function () {
      this.ensure();
      this.beep(420, 0.1, 'triangle', 0.04, 240);
      this.noise(0.07, 0.05, 800, 'highpass');
    },
    knock: function (combo) {
      this.ensure();
      var p = 1 + Math.min(5, combo) * 0.05;
      this.noise(0.12, 0.12, 220, 'lowpass');
      this.beep(180 * p, 0.1, 'square', 0.06, 70);
      this.beep(640 * p, 0.07, 'triangle', 0.04, 380 * p);
    },
    splash: function () {
      this.ensure();
      this.noise(0.18, 0.14, 380, 'lowpass');
      this.beep(140, 0.12, 'sine', 0.045, 50);
      this.beep(90, 0.16, 'triangle', 0.03, 40);
    },
    ping: function (combo) {
      this.ensure();
      var p = 1 + Math.min(5, combo) * 0.06;
      this.beep(880 * p, 0.07, 'sine', 0.055, 1320 * p);
      this.beep(1180 * p, 0.1, 'triangle', 0.035, 1560 * p);
    },
    fish: function () {
      this.ensure();
      this.noise(0.16, 0.12, 280, 'lowpass');
      this.beep(110, 0.2, 'sawtooth', 0.05, 48);
      this.beep(70, 0.18, 'sine', 0.04, 36);
    },
    die: function () {
      this.ensure();
      this.noise(0.2, 0.12, 240, 'lowpass');
      this.beep(320, 0.24, 'sawtooth', 0.055, 70);
      this.beep(170, 0.22, 'square', 0.04, 48);
    },
    bolt: function () {
      this.ensure();
      this.noise(0.08, 0.1, 1800, 'highpass');
      this.beep(1400, 0.06, 'square', 0.04, 400);
    },
    wave: function () {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.05, 523);
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(784, 0.16, 'triangle', 0.04, 1046);
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
    life: function () {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.05, 784);
      this.beep(784, 0.14, 'triangle', 0.045, 1046);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function loadBest() {
    try {
      var n = parseInt(localStorage.getItem(BEST_KEY), 10);
      if (n > 0) G.best = n;
    } catch (e) { /* ignore */ }
  }

  function persistBest() {
    if (G.score > G.best) G.best = G.score;
    try { localStorage.setItem(BEST_KEY, String(G.best)); } catch (e) { /* ignore */ }
  }

  loadBest();

  /* ---- fx ---- */
  function hitStop(t) {
    if (reduceMotion()) return;
    if (t > G.stop) G.stop = t;
  }
  function shake(n) {
    if (reduceMotion()) return;
    G.shake = Math.max(G.shake, n);
  }
  function kick(kx, ky) {
    if (reduceMotion()) return;
    G.kickX = kx;
    G.kickY = ky;
    stageEl.classList.remove('hit');
    void stageEl.offsetWidth;
    stageEl.classList.add('hit');
    clearTimeout(kickTok);
    kickTok = setTimeout(function () { stageEl.classList.remove('hit'); }, 160);
  }
  function flash(rgb, t) {
    G.flashRgb = rgb;
    G.flash = t;
  }
  function burst(x, y, n, rgb, spd, life, grav) {
    var i, cap;
    cap = 150 - particles.length;
    if (n > cap) n = cap < 0 ? 0 : cap;
    for (i = 0; i < n; i++) {
      particles.push({
        x: x, y: y,
        vx: rand(-1, 1) * spd,
        vy: rand(-1.2, 0.3) * spd,
        t: life * rand(0.55, 1.2),
        max: life,
        r: rand(1.1, 2.7),
        rgb: rgb,
        g: grav || 24
      });
    }
  }
  function spark(x, y, rgb, n) {
    var i;
    for (i = 0; i < n; i++) {
      sparks.push({
        x: x, y: y,
        vx: rand(-1, 1) * 80,
        vy: rand(-100, -12),
        t: rand(0.1, 0.3),
        rgb: rgb
      });
    }
  }
  function ringAt(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: 6 });
  }
  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, text: text, t: 0, rgb: rgb });
  }
  function splashAt(x, big) {
    splashes.push({ x: wrapX(x), t: 0, big: !!big });
    burst(x, WATER_Y - 2, big ? 22 : 12, SKY, big ? 90 : 60, 0.42, 50);
    burst(x, WATER_Y - 2, big ? 10 : 6, CYN, 50, 0.3, 36);
    spark(x, WATER_Y - 6, WHT, big ? 8 : 4);
  }

  function toast(msg, warn, gold) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    clearTimeout(toastTok);
    toastTok = setTimeout(function () { toastEl.classList.add('hidden'); }, 980);
  }

  function flashScore(n) {
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + n;
    scoreAdd.style.animation = 'none';
    void scoreAdd.offsetWidth;
    scoreAdd.style.animation = '';
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    clearTimeout(addTok);
    addTok = setTimeout(function () { scoreAdd.hidden = true; }, 700);
  }

  function addScore(n, x, y, label) {
    var got;
    if (n <= 0 || G.mode !== 'play') return;
    G.score += n;
    flashScore(n);
    persistBest();
    if (G.score >= G.nextLife) {
      G.nextLife += LIFE_AT;
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        toast('1UP', false, true);
        audio.life();
      }
    }
    hudPlay();
    if (x != null) floatText(x, y - 16, label || ('+' + n), GOLD);
    got = n;
    return got;
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboAge = 0;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    comboEl.textContent = '×' + Math.max(1, comboMul(G.combo));
    if (G.combo >= 2) {
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
    }
    if (G.combo === 3 || G.combo === 6 || G.combo === 10) {
      audio.combo(G.combo);
      toast(G.combo >= 10 ? '连爆 ×' + G.combo : '连爆', false, true);
    }
  }

  function resetCombo() {
    G.combo = 0;
    G.comboAge = 0;
    comboEl.textContent = '×1';
    comboBox.classList.remove('hot');
  }

  function renderPips() {
    var html = '';
    var i;
    for (i = 0; i < Math.max(LIVES, G.lives); i++) {
      html += '<i class="pip ' + (i < G.lives ? 'on' : 'gone') + '"></i>';
    }
    pipsEl.innerHTML = html;
  }

  function hudPlay() {
    scoreEl.textContent = String(G.score);
    waveEl.textContent = String(G.wave);
    bestEl.textContent = String(G.best);
    comboEl.textContent = '×' + Math.max(1, comboMul(G.combo));
    labWave.textContent = isTrip() ? '漂' : '关';
    renderPips();
    modeLabel.textContent = isTrip() ? '漂流' : '对空';
    modeLabel.classList.toggle('trip', isTrip());
    if (G.fish && G.fish.state === 'leap') {
      tagLabel.textContent = '大鱼';
      tagLabel.classList.add('warn');
    } else if (G.player && G.player.balloons === 1 && G.mode === 'play') {
      tagLabel.textContent = '一球';
      tagLabel.classList.add('warn');
    } else {
      tagLabel.textContent = 'BALLOON';
      tagLabel.classList.remove('warn');
    }
    if (G.mode === 'play') {
      hintEl.textContent = isTrip()
        ? '顶爆三只漂球 · 躲开电花 · 落水即死'
        : '从上方顶爆气球 · 伞兵再撞进水 · 低空招鱼';
      hintEl.classList.remove('warn', 'hot');
    }
  }

  function resetFx() {
    particles.length = 0;
    sparks.length = 0;
    floats.length = 0;
    rings.length = 0;
    splashes.length = 0;
  }

  function seedMotes() {
    var i;
    motes.length = 0;
    for (i = 0; i < 28; i++) {
      motes.push({
        x: rand(0, WORLD_W),
        y: rand(12, WATER_Y - 40),
        s: rand(0.6, 1.8),
        ph: rand(0, TAU),
        sp: rand(0.2, 0.7)
      });
    }
  }

  /* ---- entities ---- */
  function makeUnit(role, kind, x, y) {
    var balls = KIND_BALL[kind] || 2;
    return {
      role: role,
      kind: kind,
      x: wrapX(x),
      y: y,
      vx: 0,
      vy: 0,
      face: x < WORLD_W * 0.5 ? 1 : -1,
      balloons: balls,
      state: 'fly',
      grounded: false,
      plat: -1,
      flapT: 0,
      flapCd: 0,
      flapBuf: 0,
      flapHeld: false,
      flapRep: 0,
      walk: 0,
      sqX: 1,
      sqY: 1,
      inv: 0,
      dead: false,
      deadT: 0,
      why: '',
      wantL: false,
      wantR: false,
      phase: Math.random() * TAU,
      think: rand(0.15, 0.5),
      aiChase: false,
      spin: 0
    };
  }

  function makeBonus(x, y, rgb, i) {
    var a = rand(0, TAU);
    var sp = 70 + i * 12;
    return {
      role: 'bonus',
      x: wrapX(x),
      y: y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp * 0.7,
      r: 15 + i,
      rgb: rgb,
      popped: false,
      sq: 1,
      spin: rand(0, TAU),
      idx: i
    };
  }

  function makeBubble(x, y, val) {
    return {
      x: wrapX(x),
      y: y,
      vx: rand(-18, 18),
      vy: -28 - Math.random() * 22,
      r: val >= 800 ? 9 : val >= 500 ? 7.5 : 6,
      val: val,
      t: 0,
      bob: rand(0, TAU),
      life: 7.5
    };
  }

  function makeBolt(x, y, vx) {
    return {
      x: wrapX(x),
      y: y,
      vx: vx || 0,
      vy: 0,
      rot: rand(0, TAU),
      vr: rand(4, 8) * (Math.random() < 0.5 ? -1 : 1),
      amp: rand(16, 36),
      baseY: y,
      ph: rand(0, TAU)
    };
  }

  function resetFish() {
    G.fish = {
      state: 'hide',
      x: WORLD_W * 0.5,
      y: WATER_Y + 28,
      hover: 0,
      cd: 0.8,
      leapT: 0,
      leapDur: 0.7,
      sx: 0, sy: 0, tx: 0, ty: 0,
      mouth: 0
    };
  }

  function spawnPlayer(inv) {
    var p, plat, x, y;
    plat = G.plats[0] || { x: 40, y: 220, w: 120 };
    x = plat.x + Math.min(60, plat.w * 0.4);
    y = plat.y - 14;
    p = makeUnit('player', 'hero', x, y);
    p.balloons = 2;
    p.inv = inv == null ? INVULN : inv;
    p.grounded = true;
    p.plat = 0;
    G.player = p;
    return p;
  }

  function queueWave(wave) {
    var spec = waveSpec(wave);
    var i, list = [];
    for (i = 0; i < spec.g; i++) list.push('green');
    for (i = 0; i < spec.p; i++) list.push('pink');
    for (i = 0; i < spec.y; i++) list.push('gold');
    for (i = list.length - 1; i > 0; i--) {
      var j = (Math.random() * (i + 1)) | 0;
      var t = list[i];
      list[i] = list[j];
      list[j] = t;
    }
    G.spawnQ = list;
    G.spawnCd = 0.25;
  }

  function spawnFoe(kind) {
    var side = Math.random() < 0.5 ? -20 : WORLD_W + 20;
    var y = rand(70, 180);
    var e = makeUnit('enemy', kind, side, y);
    e.vx = side < 0 ? 70 : -70;
    e.face = e.vx >= 0 ? 1 : -1;
    e.grounded = false;
    G.foes.push(e);
    burst(e.x, e.y, 6, KIND_RGB[kind] || PNK, 40, 0.25, 10);
  }

  function spawnTripRound(wave) {
    var i, x, y;
    G.balloons.length = 0;
    G.bolts.length = 0;
    G.popLeft = 3;
    for (i = 0; i < 3; i++) {
      x = 120 + i * 180 + rand(-20, 20);
      y = 70 + i * 40 + rand(-10, 10);
      G.balloons.push(makeBonus(x, y, BONUS_RGB[i], i));
    }
    var n = 1 + Math.min(4, 1 + ((wave - 1) >> 1));
    for (i = 0; i < n; i++) {
      G.bolts.push(makeBolt(
        rand(40, WORLD_W - 40),
        60 + i * 50 + rand(0, 30),
        (i % 2 ? 1 : -1) * (40 + wave * 8)
      ));
    }
  }

  function liveFoes() {
    var i, n = 0;
    for (i = 0; i < G.foes.length; i++) {
      if (!G.foes[i].dead) n++;
    }
    return n;
  }

  /* ---- physics ---- */
  function doFlap(u) {
    var f = flapOf(u);
    if (!f) return;
    u.vy = Math.max(maxUpOf(u), u.vy + f);
    u.flapT = 0.14;
    u.flapCd = FLAP_CD;
    u.grounded = false;
    u.plat = -1;
    u.sqY = 0.82;
    u.sqX = 1.16;
    if (u.role === 'player' && G.mode === 'play') {
      audio.flap();
      burst(u.x, u.y + 10, 3, SKY, 28, 0.18, 8);
    }
  }

  function steerUnit(u, dt, maxVx, accel) {
    var want = 0;
    if (u.wantL) want -= 1;
    if (u.wantR) want += 1;
    if (want) {
      u.vx += want * accel * dt;
      u.face = want > 0 ? 1 : -1;
    } else if (u.grounded) {
      u.vx *= Math.exp(-FRICT_G * dt);
    } else {
      u.vx *= Math.exp(-FRICT_A * dt);
    }
    u.vx += G.wind * dt;
    if (u.vx > maxVx) u.vx = maxVx;
    if (u.vx < -maxVx) u.vx = -maxVx;
  }

  function tickUnit(u, dt) {
    var prevY, landed, ceil, p, foot, headOff, maxVx, accel, balls;

    if (u.dead) {
      u.deadT += dt;
      u.spin += dt * 8;
      u.vy = Math.min(MAX_FALL[0], u.vy + GRAV[0] * dt);
      u.y += u.vy * dt;
      u.x = wrapX(u.x + u.vx * dt);
      return;
    }

    balls = balloonsOf(u);
    u.flapT = Math.max(0, u.flapT - dt);
    u.flapCd = Math.max(0, u.flapCd - dt);
    if (u.inv > 0) u.inv = Math.max(0, u.inv - dt);
    u.phase += dt;
    u.sqX += (1 - u.sqX) * Math.min(1, 14 * dt);
    u.sqY += (1 - u.sqY) * Math.min(1, 14 * dt);

    if (u.flapHeld && u.state === 'fly') {
      u.flapRep -= dt;
      if (u.flapRep <= 0) {
        u.flapBuf = 0.08;
        u.flapRep = PAD_FLAP;
      }
    }

    if (u.flapBuf > 0) {
      u.flapBuf -= dt;
      if (u.flapCd <= 0 && u.state === 'fly') doFlap(u);
    }

    maxVx = u.grounded ? MAX_VX_G : MAX_VX_A;
    accel = u.grounded ? ACCEL_G : ACCEL_A;
    if (u.kind === 'pink') { maxVx *= 0.78; accel *= 0.82; }
    if (u.kind === 'gold') { maxVx *= 1.12; accel *= 1.1; }
    if (u.state === 'chute') { maxVx = 70; accel = 120; }
    if (u.state === 'fall') { maxVx = 80; accel = 40; }

    steerUnit(u, dt, maxVx, accel);

    prevY = u.y;
    if (!u.grounded) {
      u.vy = Math.min(maxFallOf(u), u.vy + gravOf(u) * dt);
    } else {
      u.vy = 0;
    }

    u.x = wrapX(u.x + u.vx * dt);
    u.y += u.vy * dt;

    if (u.y < 18) {
      u.y = 18;
      if (u.vy < 0) u.vy *= -0.35;
    }

    foot = 12;
    headOff = balls > 0 && u.state === 'fly' ? 26 : (u.state === 'chute' ? 20 : 12);

    if (u.state !== 'fall') {
      landed = platLandAt(G.plats, u.x, u.y, prevY, foot);
      if (landed >= 0 && u.vy >= 0) {
        p = G.plats[landed];
        u.y = p.y - foot;
        if (u.state === 'chute') {
          u.state = 'fly';
          u.balloons = 1;
          u.vy = 0;
          u.grounded = true;
          u.plat = landed;
          ringAt(u.x, u.y - 18, SKY);
          audio.chute();
        } else {
          if (!u.grounded && Math.abs(u.vy) > 40 && u.role === 'player') audio.bounce();
          if (p.kind === 'cloud' && u.vy > 90) {
            u.vy *= -0.22;
            u.grounded = false;
            u.plat = -1;
          } else {
            u.vy = 0;
            u.grounded = true;
            u.plat = landed;
          }
        }
      } else if (u.grounded) {
        if (u.plat < 0 || u.plat >= G.plats.length || !xOnPlat(G.plats[u.plat], u.x)) {
          u.grounded = false;
          u.plat = -1;
        } else {
          u.y = G.plats[u.plat].y - foot;
          u.x = wrapX(u.x + (G.plats[u.plat].vx || 0) * dt);
        }
      }

      ceil = platCeilAt(G.plats, u.x, u.y, prevY, headOff);
      if (ceil >= 0 && u.vy < 0) {
        p = G.plats[ceil];
        u.y = p.y + p.h + headOff;
        u.vy *= -0.25;
      }
    }

    if (u.grounded) u.walk += Math.abs(u.vx) * dt * 0.04;
  }

  function overlapUnits(a, b) {
    var dx = Math.abs(wrapDx(a.x, b.x));
    var dy = Math.abs(a.y - b.y);
    return dx < bodyHW(a) + bodyHW(b) + 2 && dy < bodyHH(a) * 0.72 + bodyHH(b) * 0.72 + 4;
  }

  function popBalloon(u, byWho) {
    var rgb = KIND_RGB[u.kind] || MAG;
    if (u.balloons <= 0) return;
    u.balloons -= 1;
    u.sqX = 1.28;
    u.sqY = 0.72;
    burst(u.x, u.y - 22, 16, rgb, 90, 0.38, 18);
    burst(u.x, u.y - 22, 8, WHT, 70, 0.22, 8);
    ringAt(u.x, u.y - 22, rgb);
    spark(u.x, u.y - 20, GOLD, 6);
    audio.pop(G.combo);
    hitStop(0.055);
    kick(0, 3);
    flash(rgb, 0.08);
    if (u.balloons <= 0) {
      if (u.role === 'player') {
        u.state = 'fall';
        u.vy = Math.max(u.vy, 40);
      } else {
        u.state = 'chute';
        u.vy = Math.min(u.vy, 40);
        audio.chute();
      }
    } else if (u.role === 'player') {
      u.inv = Math.max(u.inv, 0.62);
    }
    if (byWho === 'player' && G.mode === 'play') {
      bumpCombo();
      addScore(500 * comboMul(G.combo), u.x, u.y, String(500 * comboMul(G.combo)));
    }
  }

  function knockChute(e) {
    if (e.state !== 'chute') return;
    e.state = 'fall';
    e.vy = 140;
    e.sqX = 0.8;
    e.sqY = 1.25;
    burst(e.x, e.y, 10, GOLD, 70, 0.28, 20);
    audio.knock(G.combo);
    hitStop(0.045);
    kick(0, 4);
    if (G.mode === 'play') {
      bumpCombo();
      addScore(300 * comboMul(G.combo), e.x, e.y, '落');
    }
  }

  function drownEnemy(e) {
    if (e.dead) return;
    e.dead = true;
    e.deadT = 0;
    e.state = 'dead';
    splashAt(e.x, true);
    audio.splash();
    hitStop(0.06);
    shake(0.28);
    if (G.mode === 'play') {
      bumpCombo();
      addScore((KIND_SCORE[e.kind] || 500) * comboMul(G.combo), e.x, WATER_Y - 20);
      if (Math.random() < 0.78) {
        G.bubbles.push(makeBubble(e.x, WATER_Y - 12, 300 + 250 * ((Math.random() * 3) | 0)));
      }
    }
  }

  function killPlayer(why) {
    var p = G.player;
    if (!p || p.dead || G.mode !== 'play') return;
    if (p.inv > 0 && why !== 'water' && why !== 'fish') return;
    p.dead = true;
    p.deadT = 0;
    p.state = 'dead';
    p.why = why;
    p.balloons = 0;
    p.vy = 80;
    resetCombo();
    G.lives -= 1;
    hudPlay();
    shake(0.4);
    hitStop(0.07);
    flash(MAG, 0.12);
    stageEl.classList.remove('die');
    void stageEl.offsetWidth;
    stageEl.classList.add('die');
    setTimeout(function () { stageEl.classList.remove('die'); }, 340);
    if (why === 'water' || why === 'fish') {
      splashAt(p.x, true);
      audio.splash();
      if (why === 'fish') audio.fish();
    } else {
      audio.die();
      burst(p.x, p.y, 18, MAG, 90, 0.4, 20);
    }
    toast(why === 'fish' ? '被鱼吞了' : why === 'water' ? '落水' : '球爆了', true, false);
  }

  function collidePair(a, b) {
    var w, who;
    if (!overlapUnits(a, b)) return;
    if (a.dead || b.dead) return;
    if (a.state === 'fall' || b.state === 'fall') {
      if (a.state === 'chute') knockChute(a);
      if (b.state === 'chute') knockChute(b);
      return;
    }
    if (a.state === 'chute' && b.role === 'player' && b.state === 'fly') {
      knockChute(a);
      b.vy = Math.min(b.vy, -40);
      return;
    }
    if (b.state === 'chute' && a.role === 'player' && a.state === 'fly') {
      knockChute(b);
      a.vy = Math.min(a.vy, -40);
      return;
    }
    if (a.state === 'chute' || b.state === 'chute') return;
    if ((a.role === 'player' && a.inv > 0) || (b.role === 'player' && b.inv > 0)) {
      bounceApart(a, b);
      return;
    }

    w = popWinner(a.y, b.y, POP_EPS);
    if (w === 0) {
      bounceApart(a, b);
      audio.bounce();
      return;
    }
    who = w < 0 ? a : b;
    var other = w < 0 ? b : a;
    if (who.role === 'player' || other.role === 'player') {
      if (other.role === 'player') {
        popBalloon(other, 'foe');
        if (other.balloons <= 0) killPlayer('pop');
        who.vy = Math.min(who.vy, -50);
      } else {
        popBalloon(other, 'player');
        who.vy = Math.min(who.vy, -50);
      }
    } else {
      popBalloon(other, 'foe');
      who.vy = Math.min(who.vy, -40);
    }
    bounceApart(who, other);
  }

  function bounceApart(a, b) {
    var dx = wrapDx(a.x, b.x);
    if (dx === 0) dx = a.face || 1;
    var s = dx > 0 ? 1 : -1;
    a.vx = -s * 90;
    b.vx = s * 90;
    a.x = wrapX(a.x - s * 4);
    b.x = wrapX(b.x + s * 4);
    a.sqX = 0.86;
    b.sqX = 0.86;
  }

  function thinkEnemy(e, dt) {
    var p = G.player;
    var dx, high;
    e.wantL = false;
    e.wantR = false;
    e.flapHeld = false;
    e.think -= dt;
    if (e.state === 'chute') {
      if (Math.sin(e.phase * 1.6) > 0) e.wantL = true;
      else e.wantR = true;
      return;
    }
    if (e.state !== 'fly') return;

    if (e.y > WATER_Y - 78) e.flapBuf = 0.1;
    if (e.y < 40) e.flapBuf = 0;

    if (!p || p.dead) {
      if (Math.sin(e.phase * 0.8) > 0) e.wantR = true;
      else e.wantL = true;
      if (e.y > 160) e.flapBuf = 0.06;
      return;
    }

    dx = wrapDx(e.x, p.x);
    high = e.y < p.y - POP_EPS - 2;
    e.aiChase = Math.abs(dx) < 180;

    if (e.kind === 'pink') {
      if (Math.sin(e.phase * 0.55 + e.x * 0.01) > 0) e.wantR = true;
      else e.wantL = true;
      if (!high || e.y > 150) e.flapBuf = 0.07;
    } else {
      if (dx > 10) e.wantR = true;
      else if (dx < -10) e.wantL = true;
      if (!high) {
        e.flapBuf = 0.1;
        if (Math.abs(dx) < 36) {
          if (dx > 0) { e.wantL = true; e.wantR = false; }
          else { e.wantR = true; e.wantL = false; }
        }
      } else if (e.y < p.y - 28 && Math.abs(dx) < 70) {
        e.flapHeld = false;
        e.flapBuf = 0;
      } else if (e.y > 130) {
        e.flapBuf = 0.05;
      }
    }
    if (e.kind === 'gold' && high && Math.abs(dx) < 90) {
      if (dx > 0) e.wantR = true;
      else e.wantL = true;
    }
  }

  function thinkPlayer(p, dt) {
    p.wantL = false;
    p.wantR = false;
    p.flapHeld = false;
    if (G.mode !== 'play' || p.dead) return;
    if (keys.l || ptr.l) p.wantL = true;
    if (keys.r || ptr.r) p.wantR = true;
    if (keys.flap) {
      p.flapBuf = 0.1;
      keys.flap = false;
    }
    if (keys.flapHeld) p.flapHeld = true;
  }

  function tickPlats(dt) {
    var i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (!p.vx) continue;
      p.x += p.vx * dt;
      if (p.x > WORLD_W - 30) { p.x = WORLD_W - 30; p.vx *= -1; }
      if (p.x < -p.w + 30) { p.x = -p.w + 30; p.vx *= -1; }
    }
  }

  function tickBubbles(dt) {
    var i, b, p, dx, dy;
    p = G.player;
    for (i = G.bubbles.length - 1; i >= 0; i--) {
      b = G.bubbles[i];
      b.t += dt;
      b.bob += dt * 3.2;
      b.vy = Math.max(-42, b.vy - 6 * dt);
      b.x = wrapX(b.x + b.vx * dt + Math.sin(b.bob) * 10 * dt);
      b.y += b.vy * dt;
      if (b.y < 16 || b.t > b.life) {
        G.bubbles.splice(i, 1);
        continue;
      }
      if (p && !p.dead && G.mode === 'play') {
        dx = wrapDx(p.x, b.x);
        dy = p.y - b.y;
        if (dx * dx + dy * dy < (14 + b.r) * (14 + b.r)) {
          bumpCombo();
          addScore(b.val * comboMul(G.combo), b.x, b.y);
          audio.ping(G.combo);
          ringAt(b.x, b.y, CYN);
          burst(b.x, b.y, 10, CYN, 60, 0.28, 8);
          hitStop(0.032);
          G.bubbles.splice(i, 1);
        }
      }
    }
  }

  function tickBalloons(dt) {
    var i, b, p, dx, dy, w, speed;
    p = G.player;
    speed = 1 + Math.min(0.55, (G.wave - 1) * 0.08);
    for (i = G.balloons.length - 1; i >= 0; i--) {
      b = G.balloons[i];
      if (b.popped) {
        b.sq *= 0.9;
        if (b.sq < 0.08) G.balloons.splice(i, 1);
        continue;
      }
      b.spin += dt * 1.4;
      b.vy += 40 * dt;
      b.x = wrapX(b.x + b.vx * dt * speed);
      b.y += b.vy * dt * speed;
      if (b.y < 28) { b.y = 28; b.vy *= -1; }
      if (b.y > WATER_Y - b.r - 4) { b.y = WATER_Y - b.r - 4; b.vy *= -0.92; }
      if (b.vy > 160) b.vy = 160;
      if (b.vy < -160) b.vy = -160;
      if (b.vx > 160) b.vx = 160;
      if (b.vx < -160) b.vx = -160;
      b.sq += (1 - b.sq) * Math.min(1, 10 * dt);

      if (p && !p.dead && G.mode === 'play' && p.inv <= 0) {
        dx = wrapDx(p.x, b.x);
        dy = p.y - b.y;
        if (dx * dx + dy * dy < (12 + b.r) * (12 + b.r)) {
          w = popWinner(p.y, b.y, 4);
          if (w <= 0) {
            popBonus(b);
          } else {
            popBalloon(p, 'foe');
            if (p.balloons <= 0) killPlayer('pop');
            else p.inv = Math.max(p.inv, 0.62);
            b.vy = Math.min(b.vy, -80);
            p.vy = 80;
          }
        }
      }
    }
  }

  function popBonus(b) {
    var pay;
    if (b.popped) return;
    b.popped = true;
    b.sq = 1.4;
    G.popLeft = Math.max(0, G.popLeft - 1);
    pay = (1000 * (4 - G.popLeft)) * comboMul(G.combo + 1);
    bumpCombo();
    addScore(pay, b.x, b.y);
    audio.pop(G.combo);
    burst(b.x, b.y, 22, b.rgb, 110, 0.42, 16);
    burst(b.x, b.y, 10, WHT, 80, 0.24, 6);
    ringAt(b.x, b.y, b.rgb);
    hitStop(0.07);
    kick(0, 4);
    flash(b.rgb, 0.1);
    spark(b.x, b.y, GOLD, 10);
    if (G.popLeft <= 0) {
      toast('清漂', false, true);
      audio.wave();
      G.clearT = 1.15;
    }
  }

  function tickBolts(dt) {
    var i, z, p, dx, dy;
    p = G.player;
    for (i = 0; i < G.bolts.length; i++) {
      z = G.bolts[i];
      z.ph += dt * 1.8;
      z.rot += z.vr * dt;
      z.x = wrapX(z.x + z.vx * dt);
      z.y = z.baseY + Math.sin(z.ph) * z.amp;
      if (p && !p.dead && G.mode === 'play' && p.inv <= 0) {
        dx = wrapDx(p.x, z.x);
        dy = p.y - z.y;
        if (dx * dx + dy * dy < 18 * 18) {
          audio.bolt();
          burst(p.x, p.y, 12, CYN, 80, 0.28, 10);
          flash(CYN, 0.08);
          hitStop(0.04);
          popBalloon(p, 'foe');
          if (p.balloons <= 0) killPlayer('pop');
          else p.inv = 0.7;
          p.vy = -40;
        }
      }
    }
  }

  function tickFish(dt) {
    var f = G.fish;
    var p = G.player;
    var t, u, low, dx, dy;
    if (!f) return;
    f.cd = Math.max(0, f.cd - dt);

    if (f.state === 'leap') {
      f.leapT += dt;
      u = f.leapT / f.leapDur;
      if (u >= 1) {
        f.state = 'hide';
        f.y = WATER_Y + 30;
        f.cd = 1.6;
        splashAt(f.x, false);
        return;
      }
      t = u;
      f.x = wrapX(lerp(f.sx, f.tx, t));
      f.y = lerp(f.sy, f.ty, t) - Math.sin(t * Math.PI) * 86;
      f.mouth = Math.sin(t * Math.PI);
      if (p && !p.dead && G.mode === 'play') {
        dx = wrapDx(p.x, f.x);
        dy = p.y - f.y;
        if (dx * dx + dy * dy < 26 * 26) killPlayer('fish');
      }
      var i, e;
      for (i = 0; i < G.foes.length; i++) {
        e = G.foes[i];
        if (e.dead) continue;
        dx = wrapDx(e.x, f.x);
        dy = e.y - f.y;
        if (dx * dx + dy * dy < 24 * 24) drownEnemy(e);
      }
      return;
    }

    low = p && !p.dead && G.mode === 'play' && (p.y + 12) > WATER_Y - FISH_LOW;
    if (low) {
      f.hover += dt;
      f.x = wrapX(lerp(f.x, p.x, Math.min(1, 3 * dt)));
    } else {
      f.hover = Math.max(0, f.hover - dt * 0.85);
    }

    if (f.state === 'hide' && f.cd <= 0 && f.hover >= FISH_HOVER && p && !p.dead) {
      f.state = 'leap';
      f.leapT = 0;
      f.leapDur = 0.68;
      f.sx = p.x;
      f.sy = WATER_Y + 18;
      f.tx = p.x + p.vx * 0.18;
      f.ty = Math.min(p.y, WATER_Y - 28);
      f.x = f.sx;
      f.y = f.sy;
      splashAt(f.sx, true);
      audio.fish();
      toast('大鱼', true, false);
      tagLabel.textContent = '大鱼';
      tagLabel.classList.add('warn');
    }
  }

  function tickWaterDeaths() {
    var p = G.player;
    var i, e;
    if (p && !p.dead && p.y + 10 > WATER_Y) {
      if (G.mode === 'play') killPlayer('water');
      else {
        p.y = WATER_Y - 16;
        p.vy = -80;
      }
    }
    for (i = 0; i < G.foes.length; i++) {
      e = G.foes[i];
      if (e.dead) continue;
      if (e.y + 10 > WATER_Y) drownEnemy(e);
    }
  }

  function tickFx(dt) {
    var i, o;
    G.clock += dt;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt);
    G.kickX *= Math.exp(-10 * dt);
    G.kickY *= Math.exp(-10 * dt);
    if (G.combo > 0) {
      G.comboAge += dt;
      if (G.comboAge > COMBO_WIN) resetCombo();
    }
    for (i = particles.length - 1; i >= 0; i--) {
      o = particles[i];
      o.t -= dt;
      o.vy += o.g * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      if (o.t <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      o = sparks[i];
      o.t -= dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.vy += 80 * dt;
      if (o.t <= 0) sparks.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      o = floats[i];
      o.t += dt;
      o.y -= 28 * dt;
      if (o.t > 0.7) floats.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      o = rings[i];
      o.t += dt;
      o.r += 90 * dt;
      if (o.t > 0.32) rings.splice(i, 1);
    }
    for (i = splashes.length - 1; i >= 0; i--) {
      o = splashes[i];
      o.t += dt;
      if (o.t > 0.45) splashes.splice(i, 1);
    }
    for (i = 0; i < motes.length; i++) {
      motes[i].ph += dt * motes[i].sp;
      motes[i].x = wrapX(motes[i].x + Math.sin(motes[i].ph) * 8 * dt);
    }
  }

  function collideAll() {
    var i, j, p = G.player;
    if (p && !p.dead) {
      for (i = 0; i < G.foes.length; i++) collidePair(p, G.foes[i]);
    }
    for (i = 0; i < G.foes.length; i++) {
      if (G.foes[i].dead) continue;
      for (j = i + 1; j < G.foes.length; j++) collidePair(G.foes[i], G.foes[j]);
    }
  }

  function pruneFoes() {
    var i, e;
    for (i = G.foes.length - 1; i >= 0; i--) {
      e = G.foes[i];
      if (e.dead && (e.deadT > 0.9 || e.y > WORLD_H + 40)) G.foes.splice(i, 1);
    }
  }

  function maybeBubble(dt) {
    G.waveT += dt;
    if (!isTrip() && G.mode === 'play' && G.waveT > 0 && (G.waveT / 7.5 | 0) !== ((G.waveT - dt) / 7.5 | 0)) {
      G.bubbles.push(makeBubble(rand(40, WORLD_W - 40), WATER_Y - 8, 300 + 200 * ((Math.random() * 3) | 0)));
    }
    if (isTrip() && G.mode === 'play' && (G.waveT / 4.2 | 0) !== ((G.waveT - dt) / 4.2 | 0)) {
      G.bubbles.push(makeBubble(rand(40, WORLD_W - 40), rand(80, 200), 500));
    }
  }

  function checkClear() {
    if (G.mode !== 'play' || G.clearT > 0) return;
    if (isTrip()) return;
    if (G.spawnQ.length) return;
    if (liveFoes() === 0) {
      G.clearT = 1.2;
      toast('清空', false, true);
      audio.wave();
      addScore(1500 + 250 * G.wave, WORLD_W * 0.5, 80, '清关');
    }
  }

  function nextWave() {
    G.wave += 1;
    G.waveT = 0;
    G.clearT = 0;
    if (isTrip()) {
      G.plats = clonePlats(TRIP_PLATS);
      spawnTripRound(G.wave);
      toast('漂 ' + G.wave, false, true);
    } else {
      G.plats = clonePlats(STAGES[stageIndex(G.wave)].plats);
      G.foes.length = 0;
      queueWave(G.wave);
      toast(STAGES[stageIndex(G.wave)].name, false, true);
    }
    hudPlay();
  }

  function checkOver() {
    var p = G.player;
    if (G.mode !== 'play') return;
    if (!p) return;
    if (p.dead && p.deadT > DIE_T) {
      if (G.lives <= 0) {
        showOver();
        return;
      }
      spawnPlayer(INVULN);
      hudPlay();
    }
  }

  /* ---- screens ---- */
  function hideOverlay() {
    overlayEl.classList.add('hidden');
    overlayEl.setAttribute('aria-hidden', 'true');
  }

  function showOverlay() {
    overlayEl.classList.remove('hidden');
    overlayEl.setAttribute('aria-hidden', 'false');
  }

  function showTitle() {
    G.mode = 'title';
    G.kind = 'sky';
    G.wave = 1;
    G.score = 0;
    G.lives = LIVES;
    G.combo = 0;
    G.nextLife = LIFE_AT;
    G.why = '';
    G.wind = 0;
    G.plats = clonePlats(STAGES[0].plats);
    G.foes.length = 0;
    G.balloons.length = 0;
    G.bubbles.length = 0;
    G.bolts.length = 0;
    G.spawnQ = [];
    resetFx();
    resetFish();
    spawnPlayer(99);
    G.player.inv = 99;
    queueWave(1);
    G.clearT = 0;
    panelEl.classList.remove('win', 'lose');
    ovKicker.textContent = 'BALLOON';
    ovTitle.textContent = '气斗';
    ovLead.textContent = '扇翅飞上海空。从上方顶爆对方气球，落地的人撑伞，再撞进水里。落水即死，低空会招大鱼。';
    ovOps.textContent = '← → / A D 移动 · 空格 / ↑ / W 扇翅 · 触屏左 扇 右 · R 重开 · M 静音';
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    showOverlay();
    hintEl.textContent = '从上方顶爆气球 · 伞兵再撞进水 · 落水即死 · 低空招鱼';
    hintEl.classList.remove('warn', 'hot');
    hudPlay();
  }

  function startRun(kind) {
    G.kind = kind === 'trip' ? 'trip' : 'sky';
    G.mode = 'play';
    G.wave = 1;
    G.waveT = 0;
    G.score = 0;
    G.lives = LIVES;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboAge = 0;
    G.nextLife = LIFE_AT;
    G.why = '';
    G.clearT = 0;
    G.stop = 0;
    G.wind = isTrip() ? 18 : 0;
    resetFx();
    resetFish();
    G.foes.length = 0;
    G.balloons.length = 0;
    G.bubbles.length = 0;
    G.bolts.length = 0;
    G.spawnQ = [];
    if (isTrip()) {
      G.plats = clonePlats(TRIP_PLATS);
      spawnTripRound(1);
    } else {
      G.plats = clonePlats(STAGES[0].plats);
      queueWave(1);
    }
    spawnPlayer(0.45);
    hideOverlay();
    audio.start();
    toast(isTrip() ? '漂流' : STAGES[0].name, false, true);
    hudPlay();
    try { canvas.focus(); } catch (e) { /* ignore */ }
  }

  function retry() {
    audio.ui();
    if (G.mode === 'title') startRun('sky');
    else startRun(G.kind);
  }

  function showOver() {
    G.mode = 'over';
    persistBest();
    panelEl.classList.remove('win');
    panelEl.classList.add('lose');
    ovKicker.textContent = 'BALLOON';
    ovTitle.textContent = '落海了';
    ovLead.textContent = '分数 ' + G.score + ' · 最高 ' + G.best + ' · 连爆 ×' + Math.max(1, G.maxCombo) +
      (isTrip() ? ' · 漂流 ' + G.wave : ' · 对空 ' + G.wave + ' 关');
    ovOps.textContent = 'R 重开 · Enter / 空格 再来 · 2 换模式';
    ovStart.classList.add('gone');
    ovEnd.classList.remove('gone');
    showOverlay();
    hintEl.textContent = 'R 立刻重开 · 顶栏重开随时可用';
    hintEl.classList.add('warn');
    audio.over();
    hudPlay();
  }

  /* ---- tick ---- */
  function tick(dt) {
    var i, p;

    tickPlats(dt);

    if (G.mode === 'title' || G.mode === 'play') {
      G.spawnCd -= dt;
      if (G.spawnQ.length && G.spawnCd <= 0) {
        spawnFoe(G.spawnQ.shift());
        G.spawnCd = 0.48;
      }
    }

    p = G.player;
    if (p) {
      if (G.mode === 'play') thinkPlayer(p, dt);
      else {
        p.wantL = false;
        p.wantR = false;
        p.flapHeld = false;
        p.inv = 99;
        if (p.y > 160) p.flapBuf = 0.08;
      }
      tickUnit(p, dt);
    }

    for (i = 0; i < G.foes.length; i++) {
      thinkEnemy(G.foes[i], dt);
      tickUnit(G.foes[i], dt);
    }

    collideAll();
    tickBubbles(dt);
    if (isTrip() || (G.mode === 'title' && G.kind === 'trip')) {
      tickBalloons(dt);
      tickBolts(dt);
    }
    tickFish(dt);
    tickWaterDeaths();
    pruneFoes();
    maybeBubble(dt);

    if (G.mode === 'title' && !isTrip() && !G.spawnQ.length && liveFoes() === 0) {
      queueWave(1);
    }

    if (G.clearT > 0) {
      G.clearT -= dt;
      if (G.clearT <= 0) nextWave();
    } else {
      checkClear();
    }

    tickFx(dt);
    checkOver();
  }

  /* ---- draw ---- */
  function resize() {
    var rect = stageEl.getBoundingClientRect();
    cssW = rect.width;
    cssH = rect.height;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, (cssW * dpr) | 0);
    canvas.height = Math.max(1, (cssH * dpr) | 0);
    var padB = coarseQ.matches ? 62 : 8;
    var avW = cssW;
    var avH = Math.max(40, cssH - padB);
    var s = Math.min(avW / WORLD_W, avH / WORLD_H);
    L.s = s;
    L.x = (avW - WORLD_W * s) / 2;
    L.y = Math.max(4, (avH - WORLD_H * s) / 2);
  }

  function sx(x) { return L.x + x * L.s; }
  function sy(y) { return L.y + y * L.s; }

  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }

  function eachWrap(x, fn) {
    fn(x);
    if (x < 40) fn(x + WORLD_W);
    if (x > WORLD_W - 40) fn(x - WORLD_W);
  }

  function drawBg() {
    var g, i, t;
    ctx.fillStyle = '#041018';
    ctx.fillRect(0, 0, cssW, cssH);

    g = ctx.createRadialGradient(sx(120), sy(40), 8, sx(120), sy(40), 240 * L.s);
    g.addColorStop(0, 'rgba(30,168,255,0.16)');
    g.addColorStop(1, 'rgba(30,168,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cssW, cssH);
    g = ctx.createRadialGradient(sx(520), sy(70), 8, sx(520), sy(70), 200 * L.s);
    g.addColorStop(0, 'rgba(255,61,184,0.08)');
    g.addColorStop(1, 'rgba(255,61,184,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.fillStyle = 'rgba(232,244,255,0.55)';
    ctx.beginPath();
    ctx.arc(sx(72), sy(44), 22 * L.s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#041018';
    ctx.beginPath();
    ctx.arc(sx(82), sy(40), 18 * L.s, 0, TAU);
    ctx.fill();

    t = G.clock;
    for (i = 0; i < motes.length; i++) {
      ctx.fillStyle = rgba(SKY, 0.08 + 0.06 * Math.sin(motes[i].ph));
      ctx.beginPath();
      ctx.arc(sx(motes[i].x), sy(motes[i].y), motes[i].s * L.s, 0, TAU);
      ctx.fill();
    }

    g = ctx.createLinearGradient(0, sy(WATER_Y - 50), 0, sy(WORLD_H));
    g.addColorStop(0, 'rgba(30,168,255,0)');
    g.addColorStop(0.4, 'rgba(10,70,140,0.18)');
    g.addColorStop(1, 'rgba(4,20,48,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(WATER_Y - 50), WORLD_W * L.s, (WORLD_H - WATER_Y + 50) * L.s);
  }

  function drawPlat(p) {
    var x = sx(p.x);
    var y = sy(p.y);
    var w = p.w * L.s;
    var h = p.h * L.s;
    var g, i, c;
    if (p.kind === 'cloud') {
      ctx.fillStyle = 'rgba(180, 220, 255, 0.16)';
      ctx.beginPath();
      ctx.ellipse(x + w * 0.2, y + h * 0.4, w * 0.22, h * 0.9, 0, 0, TAU);
      ctx.ellipse(x + w * 0.5, y + h * 0.1, w * 0.32, h * 1.15, 0, 0, TAU);
      ctx.ellipse(x + w * 0.8, y + h * 0.4, w * 0.24, h * 0.9, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(210, 236, 255, 0.82)';
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 6 * L.s);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(x + 4 * L.s, y + 2 * L.s, w - 8 * L.s, 2.4 * L.s);
      return;
    }
    g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#5ad0ff');
    g.addColorStop(0.35, '#1a6cb0');
    g.addColorStop(1, '#0a2a48');
    ctx.fillStyle = g;
    ctx.strokeStyle = 'rgba(0,240,255,0.45)';
    ctx.lineWidth = 1.1 * L.s;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 3 * L.s);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(180, 240, 255, 0.35)';
    ctx.fillRect(x + 2 * L.s, y + 1 * L.s, w - 4 * L.s, 2.2 * L.s);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(x + 3 * L.s, y + h - 3.2 * L.s, w - 6 * L.s, 2.2 * L.s);
    ctx.fillStyle = 'rgba(255, 227, 107, 0.18)';
    for (i = 0; i < 3; i++) {
      c = x + (i + 0.5) * (w / 3);
      ctx.fillRect(c - 2 * L.s, y + 4 * L.s, 4 * L.s, h - 6 * L.s);
    }
  }

  function drawWater() {
    var i, x, y, t, g;
    t = G.clock;
    g = ctx.createLinearGradient(0, sy(WATER_Y - 6), 0, sy(WORLD_H + 4));
    g.addColorStop(0, '#4ad8ff');
    g.addColorStop(0.16, '#1ea8ff');
    g.addColorStop(0.45, '#0a4a88');
    g.addColorStop(1, '#041428');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(WORLD_H + 8));
    ctx.lineTo(sx(0), sy(WATER_Y));
    for (i = 0; i <= 32; i++) {
      x = (i / 32) * WORLD_W;
      y = WATER_Y + Math.sin(t * 3.1 + i * 0.5) * 3.2 + Math.sin(t * 5.2 + i * 1.05) * 1.5;
      ctx.lineTo(sx(x), sy(y));
    }
    ctx.lineTo(sx(WORLD_W), sy(WORLD_H + 8));
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,240,255,0.55)';
    ctx.lineWidth = 1.5 * L.s;
    ctx.beginPath();
    for (i = 0; i <= 32; i++) {
      x = (i / 32) * WORLD_W;
      y = WATER_Y + Math.sin(t * 3.1 + i * 0.5) * 3.2 + Math.sin(t * 5.2 + i * 1.05) * 1.5;
      if (i === 0) ctx.moveTo(sx(x), sy(y));
      else ctx.lineTo(sx(x), sy(y));
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(180, 240, 255, 0.12)';
    ctx.lineWidth = 1 * L.s;
    for (i = 0; i < 6; i++) {
      y = WATER_Y + 10 + i * 8 + Math.sin(t * 2 + i) * 2;
      ctx.beginPath();
      ctx.moveTo(sx(0), sy(y));
      ctx.lineTo(sx(WORLD_W), sy(y));
      ctx.stroke();
    }

    for (i = 0; i < splashes.length; i++) {
      var sp = splashes[i];
      var k = sp.t / 0.45;
      ctx.strokeStyle = rgba(CYN, 0.55 * (1 - k));
      ctx.lineWidth = (sp.big ? 2.2 : 1.4) * L.s;
      ctx.beginPath();
      ctx.ellipse(sx(sp.x), sy(WATER_Y), (12 + k * 28) * L.s, (4 + k * 8) * L.s, 0, 0, TAU);
      ctx.stroke();
    }
  }

  function drawBalloonPair(n, bob, rgb, face) {
    var i, bx, by, cols;
    if (n <= 0) return;
    cols = n === 1 ? [rgb] : [rgb, n === 2 && rgb === SKY ? MAG : GOLD];
    if (n === 2 && rgb === SKY) cols = [MAG, SKY];
    if (n === 2 && rgb !== SKY) cols = [rgb, GOLD];
    for (i = 0; i < n; i++) {
      bx = (i - (n - 1) * 0.5) * 9 * face;
      by = -22 + Math.sin(bob + i) * 1.4;
      ctx.strokeStyle = 'rgba(200,220,240,0.7)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(bx, by + 7);
      ctx.stroke();
      ctx.fillStyle = rgba(cols[i], 1);
      ctx.beginPath();
      ctx.ellipse(bx, by, 6.2, 7.4, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.ellipse(bx - 2, by - 2.4, 2.1, 2.6, -0.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(40,10,20,0.35)';
      ctx.beginPath();
      ctx.moveTo(bx - 1.4, by + 7);
      ctx.lineTo(bx + 1.4, by + 7);
      ctx.lineTo(bx, by + 9.2);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawChute() {
    ctx.fillStyle = 'rgba(255, 227, 107, 0.9)';
    ctx.beginPath();
    ctx.ellipse(0, -18, 12, 7, 0, Math.PI, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,227,107,0.7)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-10, -16);
    ctx.lineTo(0, -6);
    ctx.lineTo(10, -16);
    ctx.stroke();
  }

  function drawFighterAt(u, ox) {
    var rgb, wing, blink;
    if (u.inv > 0 && !u.dead && ((G.clock * 16) | 0) % 2 === 0) return;
    rgb = KIND_RGB[u.kind] || SKY;
    ctx.save();
    ctx.translate(sx(u.x + ox), sy(u.y));
    ctx.scale(L.s * (u.face || 1), L.s);
    ctx.scale(u.sqX, u.sqY);
    if (u.dead || u.state === 'fall') ctx.rotate(Math.min(1.4, (u.deadT || 0) * 3.2 + u.spin * 0.4));

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 14, 8, 2.1, 0, 0, TAU);
    ctx.fill();

    if (u.state === 'chute') drawChute();
    else if (u.state === 'fly') drawBalloonPair(u.balloons, G.clock * 5 + u.phase, rgb, 1);

    wing = u.flapT > 0
      ? -0.95 + (0.14 - Math.min(u.flapT, 0.14)) / 0.14 * 1.7
      : (u.grounded ? Math.sin(u.walk * 12) * 0.18 : Math.sin(G.clock * 8 + u.phase) * 0.28);

    ctx.save();
    ctx.translate(-1, 1);
    ctx.rotate(wing);
    ctx.fillStyle = u.kind === 'hero' ? '#c8f4ff' : rgba(rgb, 0.85);
    ctx.beginPath();
    ctx.ellipse(-5, 0, 7.5, 2.6, -0.15, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(1, 1);
    ctx.rotate(-wing * 0.85);
    ctx.fillStyle = u.kind === 'hero' ? '#c8f4ff' : rgba(rgb, 0.85);
    ctx.beginPath();
    ctx.ellipse(5, 0, 7.5, 2.6, 0.15, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = u.kind === 'hero' ? '#1ea8ff' : rgba(rgb, 1);
    ctx.beginPath();
    ctx.ellipse(0, 3.4, 7.2, 6.2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.ellipse(-1.2, 1.4, 4, 2.2, -0.2, 0, TAU);
    ctx.fill();

    ctx.fillStyle = u.kind === 'hero' ? '#ffe36b' : '#f4fbff';
    ctx.beginPath();
    ctx.arc(0, -6.2, 5.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = u.kind === 'hero' ? '#1ea8ff' : rgba(rgb, 0.9);
    ctx.beginPath();
    ctx.ellipse(0, -8.4, 5.4, 2.4, 0, Math.PI, TAU);
    ctx.fill();

    ctx.fillStyle = '#1a2430';
    blink = ((G.clock + u.phase) * 2) % 5 < 0.12;
    if (!blink) {
      ctx.beginPath();
      ctx.ellipse(1.6, -6.2, 1.1, 1.3, 0, 0, TAU);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#1a2430';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0.6, -6.2);
      ctx.lineTo(2.6, -6.2);
      ctx.stroke();
    }

    if (u.kind !== 'hero') {
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.moveTo(4.6, -5.4);
      ctx.lineTo(8.2, -4.4);
      ctx.lineTo(4.6, -3.4);
      ctx.closePath();
      ctx.fill();
    }

    if (u.grounded) {
      ctx.strokeStyle = 'rgba(20,30,40,0.8)';
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-2.5, 8);
      ctx.lineTo(-3, 13);
      ctx.moveTo(2.5, 8);
      ctx.lineTo(3.2, 13);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawUnit(u) {
    eachWrap(u.x, function (ox) {
      drawFighterAt(u, ox - u.x);
    });
  }

  function drawBonusAt(b, ox) {
    var s = b.r * b.sq;
    ctx.save();
    ctx.translate(sx(b.x + ox), sy(b.y));
    ctx.scale(L.s, L.s);
    ctx.rotate(Math.sin(b.spin) * 0.12);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(0, s + 6, s * 0.7, 2.2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(b.rgb, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 1.18, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(-s * 0.32, -s * 0.4, s * 0.28, s * 0.36, -0.4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.72, s * 0.86, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = 'rgba(20,10,20,0.4)';
    ctx.beginPath();
    ctx.moveTo(-2, s * 1.12);
    ctx.lineTo(2, s * 1.12);
    ctx.lineTo(0, s * 1.32);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawBoltAt(z, ox) {
    var i, a, r;
    ctx.save();
    ctx.translate(sx(z.x + ox), sy(z.y));
    ctx.rotate(z.rot);
    ctx.scale(L.s, L.s);
    ctx.strokeStyle = 'rgba(0,240,255,0.9)';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (i = 0; i < 8; i++) {
      a = (i / 8) * TAU;
      r = i % 2 ? 4.2 : 11;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawFish() {
    var f = G.fish;
    if (!f || f.state === 'hide') return;
    eachWrap(f.x, function (ox) {
      var dir = f.tx >= f.sx ? 1 : -1;
      ctx.save();
      ctx.translate(sx(ox), sy(f.y));
      ctx.scale(L.s * dir, L.s);
      ctx.rotate(-0.4 + (f.mouth || 0) * 0.3);
      ctx.fillStyle = '#0a2040';
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 12, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#1ea8ff';
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-30, -10);
      ctx.lineTo(-30, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ff3db8';
      ctx.beginPath();
      ctx.arc(10, -3, 3.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(10.6, -3.4, 1.1, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#041018';
      ctx.beginPath();
      ctx.arc(12, 4, 6, 0.15, 1.1);
      ctx.lineTo(18, 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawBubble(b) {
    eachWrap(b.x, function (ox) {
      var r = b.r + Math.sin(b.bob) * 0.6;
      ctx.save();
      ctx.translate(sx(ox), sy(b.y));
      ctx.scale(L.s, L.s);
      ctx.strokeStyle = 'rgba(0,240,255,0.75)';
      ctx.fillStyle = 'rgba(30,168,255,0.18)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.3, -r * 0.35, r * 0.22, r * 0.18, -0.4, 0, TAU);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawFx() {
    var i, o, a;
    for (i = 0; i < rings.length; i++) {
      o = rings[i];
      a = 1 - o.t / 0.32;
      ctx.strokeStyle = rgba(o.rgb, 0.55 * a);
      ctx.lineWidth = 2 * L.s;
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), o.r * L.s, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < particles.length; i++) {
      o = particles[i];
      a = o.t / (o.max || 0.4);
      ctx.fillStyle = rgba(o.rgb, 0.15 + 0.75 * a);
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), o.r * L.s * (0.6 + 0.4 * a), 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < sparks.length; i++) {
      o = sparks[i];
      ctx.strokeStyle = rgba(o.rgb, 0.8);
      ctx.lineWidth = 1.2 * L.s;
      ctx.beginPath();
      ctx.moveTo(sx(o.x), sy(o.y));
      ctx.lineTo(sx(o.x - o.vx * 0.04), sy(o.y - o.vy * 0.04));
      ctx.stroke();
    }
    ctx.font = (11 * L.s) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    for (i = 0; i < floats.length; i++) {
      o = floats[i];
      a = 1 - o.t / 0.7;
      ctx.fillStyle = rgba(o.rgb, a);
      ctx.fillText(o.text, sx(o.x), sy(o.y));
    }
  }

  function drawFlash() {
    var g;
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, 0.12 * (G.flash / 0.12));
    ctx.fillRect(0, 0, cssW, cssH);
    g = G.flash;
    return g;
  }

  function draw() {
    var i, shx, shy;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    shx = (G.kickX + (G.shake > 0 ? rand(-3, 3) * G.shake : 0));
    shy = (G.kickY + (G.shake > 0 ? rand(-2, 2) * G.shake : 0));
    ctx.translate(shx, shy);

    drawBg();
    for (i = 0; i < G.plats.length; i++) drawPlat(G.plats[i]);
    for (i = 0; i < G.bubbles.length; i++) drawBubble(G.bubbles[i]);
    for (i = 0; i < G.balloons.length; i++) {
      eachWrap(G.balloons[i].x, function (ox) {
        drawBonusAt(G.balloons[i], ox - G.balloons[i].x);
      });
    }
    for (i = 0; i < G.bolts.length; i++) {
      eachWrap(G.bolts[i].x, function (ox) {
        drawBoltAt(G.bolts[i], ox - G.bolts[i].x);
      });
    }
    for (i = 0; i < G.foes.length; i++) drawUnit(G.foes[i]);
    if (G.player) drawUnit(G.player);
    drawFish();
    drawWater();
    drawFx();
    drawFlash();
  }

  function frame(ts) {
    var dt;
    if (!lastTs) lastTs = ts;
    dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (hidden) {
      requestAnimationFrame(frame);
      return;
    }
    acc += Math.min(0.08, dt);
    while (acc >= STEP) {
      if (G.stop > 0) G.stop -= STEP;
      else tick(STEP);
      acc -= STEP;
    }
    draw();
    requestAnimationFrame(frame);
  }

  /* ---- input ---- */
  function worldFromPtr(ev) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (ev.clientX - r.left - L.x) / L.s,
      y: (ev.clientY - r.top - L.y) / L.s
    };
  }

  function setPtrSteer(x) {
    ptr.l = x < WORLD_W * 0.38;
    ptr.r = x > WORLD_W * 0.62;
  }

  function holdBtn(el, on, off) {
    var down = false;
    function go(e) {
      if (e.cancelable) e.preventDefault();
      down = true;
      el.classList.add('held');
      on();
    }
    function stop(e) {
      if (e && e.cancelable) e.preventDefault();
      if (!down) return;
      down = false;
      el.classList.remove('held');
      off();
    }
    el.addEventListener('pointerdown', go);
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointerleave', stop);
    el.addEventListener('pointercancel', stop);
  }

  holdBtn(btnLeft, function () { keys.l = true; audio.ensure(); }, function () { keys.l = false; });
  holdBtn(btnRight, function () { keys.r = true; audio.ensure(); }, function () { keys.r = false; });
  holdBtn(btnFlap, function () {
    keys.flap = true;
    keys.flapHeld = true;
    audio.ensure();
  }, function () { keys.flapHeld = false; });

  canvas.addEventListener('pointerdown', function (ev) {
    if (ev.button != null && ev.button !== 0) return;
    if (G.mode !== 'play') return;
    var w = worldFromPtr(ev);
    ptr.down = true;
    ptr.id = ev.pointerId;
    setPtrSteer(w.x);
    keys.flap = true;
    audio.ensure();
    try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
    if (ev.cancelable) ev.preventDefault();
  });
  canvas.addEventListener('pointermove', function (ev) {
    if (!ptr.down || ev.pointerId !== ptr.id) return;
    setPtrSteer(worldFromPtr(ev).x);
  });
  function ptrUp(ev) {
    if (ev && ptr.id != null && ev.pointerId !== ptr.id) return;
    ptr.down = false;
    ptr.id = null;
    ptr.l = false;
    ptr.r = false;
  }
  canvas.addEventListener('pointerup', ptrUp);
  canvas.addEventListener('pointercancel', ptrUp);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  function keyOn(e, down) {
    var k = e.code;
    if (k === 'ArrowLeft' || k === 'KeyA') { keys.l = down; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { keys.r = down; e.preventDefault(); }
    else if (k === 'ArrowUp' || k === 'KeyW') {
      if (down && !e.repeat) keys.flap = true;
      keys.flapHeld = down;
      e.preventDefault();
    } else if (k === 'Space') {
      if (down && !e.repeat && G.mode === 'play') keys.flap = true;
      if (G.mode === 'play') keys.flapHeld = down;
      e.preventDefault();
    } else if (k === 'ArrowDown' || k === 'KeyS') {
      e.preventDefault();
    }
  }

  window.addEventListener('keydown', function (e) {
    if (e.repeat) {
      keyOn(e, true);
      return;
    }
    audio.ensure();
    if (e.code === 'KeyM') {
      audio.setMuted(!audio.muted);
      e.preventDefault();
      return;
    }
    if (e.code === 'KeyR') {
      retry();
      e.preventDefault();
      return;
    }
    if (G.mode === 'title') {
      if (e.code === 'Digit1' || e.code === 'Enter' || e.code === 'Space') {
        startRun('sky');
        e.preventDefault();
        return;
      }
      if (e.code === 'Digit2') {
        startRun('trip');
        e.preventDefault();
        return;
      }
    }
    if (G.mode === 'over') {
      if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Digit1') {
        startRun(G.kind);
        e.preventDefault();
        return;
      }
      if (e.code === 'Digit2') {
        showTitle();
        e.preventDefault();
        return;
      }
    }
    keyOn(e, true);
  });

  window.addEventListener('keyup', function (e) {
    keyOn(e, false);
  });

  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    retry();
  });
  btnSky.addEventListener('click', function () {
    audio.ensure();
    startRun('sky');
  });
  btnTrip.addEventListener('click', function () {
    audio.ensure();
    startRun('trip');
  });
  ovRetry.addEventListener('click', function () {
    audio.ensure();
    startRun(G.kind);
  });
  ovMenu.addEventListener('click', function () {
    audio.ensure();
    audio.ui();
    hintEl.classList.remove('warn');
    showTitle();
  });

  window.addEventListener('resize', resize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resize);
  }
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) {
      lastTs = 0;
      acc = 0;
    }
  });

  seedMotes();
  bestEl.textContent = String(G.best);
  showTitle();
  resize();
  hudPlay();
  requestAnimationFrame(frame);
})();
