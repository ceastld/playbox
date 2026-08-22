'use strict';

/* 奇异 — The NewZealand Story remake. Hop, shoot, ride, rescue. No CDN. */

(function () {
  var VIEW_W = 640;
  var VIEW_H = 360;
  var LIVES = 3;
  var PW = 12;
  var PH = 16;
  var FOOT = 10;
  var WALK = 156;
  var AIR = 172;
  var JUMP_V = 430;
  var AIR_JUMP = 210;
  var GRAV = 920;
  var MAX_FALL = 460;
  var COYOTE = 0.1;
  var BUFFER = 0.12;
  var INVULN = 1.42;
  var DIE_T = 0.72;
  var COMBO_WIN = 1.55;
  var SHOT_CD = 0.2;
  var SHOT_SP = 420;
  var MAX_SHOT = 3;
  var RIDE_UP = 78;
  var BLIMP_UP = 52;
  var LIFE_CAP = 6;
  var LIFE_AT = 15000;
  var STEP = 1 / 60;
  var TAU = Math.PI * 2;
  var BEST_KEY = 'playbox-kiwi-best';
  var MUTE_KEY = 'playbox-kiwi-mute';

  var LIME = [212, 255, 50];
  var KIWI = [180, 224, 24];
  var MAG = [255, 61, 184];
  var CYN = [0, 240, 255];
  var GOLD = [255, 227, 107];
  var HOT = [255, 154, 74];
  var WHT = [244, 255, 232];
  var BRN = [122, 92, 40];
  var SEAL = [120, 196, 210];
  var BEAR = [196, 128, 64];
  var BIRD = [255, 92, 168];

  var BALL_RGB = [CYN, MAG, GOLD];
  var FRUIT_PTS = [120, 240, 400];
  var FRUIT_RGB = [KIWI, MAG, GOLD];
  var FOE_PTS = { bear: 200, seal: 250, bird: 150, whale: 500 };
  var FOE_RGB = { bear: BEAR, seal: SEAL, bird: BIRD, whale: MAG };

  var STAGES = [
    {
      name: '鸟园',
      w: 920,
      h: 420,
      water: 0,
      spawn: { x: 56, y: 348 },
      plats: [
        { x: 0, y: 360, w: 240, h: 14 },
        { x: 330, y: 360, w: 250, h: 14 },
        { x: 680, y: 360, w: 240, h: 14 },
        { x: 70, y: 300, w: 150, h: 12 },
        { x: 360, y: 296, w: 140, h: 12 },
        { x: 520, y: 236, w: 80, h: 12 },
        { x: 620, y: 176, w: 150, h: 12 }
      ],
      cages: [{ x: 145, y: 288 }, { x: 690, y: 164 }],
      balloons: [{ x: 500, y: 250, c: 0 }],
      crafts: [],
      foes: [
        { kind: 'bear', x: 170, y: 348 },
        { kind: 'bear', x: 470, y: 348 },
        { kind: 'bird', x: 400, y: 210 }
      ],
      extra: [{ kind: 'bird', x: 740, y: 140 }],
      fruits: [{ x: 400, y: 284, kind: 0 }, { x: 790, y: 348, kind: 1 }],
      exit: { x: 860, y: 328, w: 36, h: 32 }
    },
    {
      name: '海豹池',
      w: 1000,
      h: 440,
      water: 392,
      spawn: { x: 50, y: 328 },
      plats: [
        { x: 0, y: 340, w: 190, h: 14 },
        { x: 250, y: 284, w: 150, h: 12 },
        { x: 470, y: 228, w: 140, h: 12 },
        { x: 680, y: 310, w: 170, h: 14 },
        { x: 560, y: 168, w: 120, h: 12 }
      ],
      cages: [{ x: 320, y: 272 }, { x: 610, y: 156 }],
      balloons: [{ x: 540, y: 200, c: 1 }],
      crafts: [{ x: 90, y: 328, kind: 'hover' }],
      foes: [
        { kind: 'seal', x: 300, y: 272 },
        { kind: 'seal', x: 740, y: 298 },
        { kind: 'bird', x: 500, y: 180 }
      ],
      extra: [{ kind: 'seal', x: 520, y: 216 }, { kind: 'bird', x: 820, y: 200 }],
      fruits: [{ x: 530, y: 216, kind: 1 }],
      exit: { x: 800, y: 278, w: 36, h: 32 },
      whale: true
    },
    {
      name: '气球谷',
      w: 780,
      h: 620,
      water: 0,
      spawn: { x: 50, y: 548 },
      plats: [
        { x: 0, y: 560, w: 210, h: 14 },
        { x: 520, y: 560, w: 260, h: 14 },
        { x: 40, y: 500, w: 140, h: 12 },
        { x: 280, y: 440, w: 120, h: 12 },
        { x: 70, y: 380, w: 130, h: 12 },
        { x: 340, y: 320, w: 150, h: 12 },
        { x: 100, y: 260, w: 140, h: 12 },
        { x: 380, y: 120, w: 200, h: 12 }
      ],
      cages: [{ x: 340, y: 428 }, { x: 130, y: 248 }, { x: 480, y: 108 }],
      balloons: [
        { x: 230, y: 470, c: 0 },
        { x: 250, y: 340, c: 1 },
        { x: 300, y: 210, c: 2 }
      ],
      crafts: [],
      foes: [
        { kind: 'bear', x: 100, y: 548 },
        { kind: 'bird', x: 400, y: 360 },
        { kind: 'bird', x: 200, y: 220 },
        { kind: 'bear', x: 450, y: 308 }
      ],
      extra: [{ kind: 'bird', x: 520, y: 160 }],
      fruits: [{ x: 140, y: 368, kind: 0 }, { x: 420, y: 308, kind: 2 }],
      exit: { x: 520, y: 88, w: 36, h: 32 }
    },
    {
      name: '鲸湾',
      w: 1080,
      h: 460,
      water: 400,
      spawn: { x: 48, y: 328 },
      plats: [
        { x: 0, y: 340, w: 170, h: 14 },
        { x: 230, y: 280, w: 130, h: 12, vx: 28 },
        { x: 430, y: 320, w: 150, h: 12 },
        { x: 660, y: 250, w: 140, h: 12, vx: -24 },
        { x: 860, y: 330, w: 200, h: 14 },
        { x: 700, y: 160, w: 120, h: 12 }
      ],
      cages: [{ x: 490, y: 308 }, { x: 750, y: 148 }],
      balloons: [{ x: 620, y: 210, c: 0 }],
      crafts: [{ x: 80, y: 328, kind: 'hover' }],
      foes: [
        { kind: 'seal', x: 480, y: 308 },
        { kind: 'bird', x: 700, y: 200 },
        { kind: 'bear', x: 920, y: 318 }
      ],
      extra: [{ kind: 'bird', x: 300, y: 180 }, { kind: 'seal', x: 900, y: 318 }],
      fruits: [{ x: 500, y: 308, kind: 1 }],
      exit: { x: 1000, y: 298, w: 36, h: 32 },
      whale: true
    },
    {
      name: '飞艇岛',
      w: 980,
      h: 560,
      water: 0,
      spawn: { x: 50, y: 508 },
      plats: [
        { x: 0, y: 520, w: 200, h: 14 },
        { x: 280, y: 450, w: 140, h: 12 },
        { x: 500, y: 520, w: 160, h: 14 },
        { x: 720, y: 450, w: 140, h: 12 },
        { x: 80, y: 360, w: 150, h: 12 },
        { x: 340, y: 300, w: 160, h: 12, vx: 22 },
        { x: 620, y: 280, w: 140, h: 12 },
        { x: 200, y: 200, w: 130, h: 12 },
        { x: 480, y: 140, w: 150, h: 12 },
        { x: 720, y: 90, w: 180, h: 12 }
      ],
      cages: [{ x: 150, y: 348 }, { x: 250, y: 188 }, { x: 800, y: 78 }],
      balloons: [{ x: 430, y: 360, c: 1 }, { x: 600, y: 200, c: 2 }],
      crafts: [{ x: 90, y: 508, kind: 'blimp' }],
      foes: [
        { kind: 'bear', x: 140, y: 508 },
        { kind: 'seal', x: 560, y: 508 },
        { kind: 'bird', x: 400, y: 260 },
        { kind: 'bird', x: 700, y: 180 },
        { kind: 'bear', x: 500, y: 128 }
      ],
      extra: [{ kind: 'bird', x: 800, y: 240 }, { kind: 'seal', x: 760, y: 438 }],
      fruits: [{ x: 360, y: 288, kind: 2 }, { x: 560, y: 128, kind: 1 }],
      exit: { x: 840, y: 58, w: 36, h: 32 }
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
    return 1 + Math.min(4, Math.max(0, (n | 0) - 1));
  }
  function jumpH() {
    return (JUMP_V * JUMP_V) / (2 * GRAV);
  }
  function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
  function aabb(x, y, hw, hh, ox, oy, ow, oh) {
    return overlap(x - hw, y - hh, hw * 2, hh * 2, ox, oy, ow, oh);
  }

  function clonePlat(p) {
    return {
      x: p.x, y: p.y, w: p.w, h: p.h,
      vx: p.vx || 0,
      ox: p.x,
      kind: p.kind || 'land'
    };
  }

  function hopReach(plats) {
    var i, j, a, b, dy;
    for (i = 0; i < plats.length; i++) {
      a = plats[i];
      for (j = 0; j < plats.length; j++) {
        if (i === j) continue;
        b = plats[j];
        dy = a.y - b.y;
        if (dy > 8 && dy < jumpH() + 6) {
          if (a.x + a.w > b.x - 40 && b.x + b.w > a.x - 40) return true;
        }
      }
    }
    return false;
  }

  function selfCheck() {
    var i, j, s, jh, cages, balls, crafts, waterCraft;
    if (STAGES.length !== 5) throw new Error('5 zoo stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (JUMP_V <= 0) throw new Error('hop lifts');
    if (SHOT_SP <= 200) throw new Error('arrows fly');
    jh = jumpH();
    if (jh < 70 || jh > 110) throw new Error('hop height ' + jh);
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(2) !== 2) throw new Error('combo 2');
    if (comboMul(5) !== 5) throw new Error('combo cap 5');
    if (comboMul(9) !== 5) throw new Error('combo max');
    if (BEST_KEY !== 'playbox-kiwi-best') throw new Error('best key');
    if (STAGES[0].name !== '鸟园') throw new Error('stage1 bird garden');
    if (STAGES[2].name !== '气球谷') throw new Error('balloon valley');
    if (STAGES[4].name !== '飞艇岛') throw new Error('airship isle');
    cages = 0;
    balls = 0;
    crafts = 0;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.plats || s.plats.length < 4) throw new Error('stage plats ' + i);
      if (!s.cages || s.cages.length < 2) throw new Error('stage cages ' + i);
      if (!s.exit) throw new Error('stage exit ' + i);
      if (!s.spawn) throw new Error('stage spawn ' + i);
      if (s.w < VIEW_W) throw new Error('stage wide ' + i);
      if (s.h < VIEW_H) throw new Error('stage tall ' + i);
      cages += s.cages.length;
      balls += (s.balloons || []).length;
      crafts += (s.crafts || []).length;
      if (s.water > 0) {
        waterCraft = 0;
        for (j = 0; j < (s.crafts || []).length; j++) {
          if (s.crafts[j].kind === 'hover') waterCraft++;
        }
        if (!waterCraft) throw new Error('water needs hover ' + i);
      }
      if (!hopReach(s.plats) && !(s.balloons && s.balloons.length)) {
        throw new Error('unreachable plats ' + i);
      }
    }
    if (cages < 10) throw new Error('need cages');
    if (balls < 5) throw new Error('need balloons');
    if (crafts < 2) throw new Error('need vehicles');
    if (STAGES[2].balloons.length < 3) throw new Error('valley balloons');
    if (!STAGES[4].crafts.length || STAGES[4].crafts[0].kind !== 'blimp') {
      throw new Error('stage5 blimp');
    }
    if (FOE_PTS.whale <= FOE_PTS.bear) throw new Error('whale pays more');
    if (LIFE_AT < 8000) throw new Error('1up spacing');
    if (RIDE_UP <= BLIMP_UP) throw new Error('balloon faster than blimp');
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
  var btnSave = document.getElementById('btn-save');
  var btnChase = document.getElementById('btn-chase');
  var btnMute = document.getElementById('btn-mute');
  var btnRetry = document.getElementById('btn-retry');
  var btnLeft = document.getElementById('btn-left');
  var btnRight = document.getElementById('btn-right');
  var btnJump = document.getElementById('btn-jump');
  var btnShot = document.getElementById('btn-shot');
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
  var saveLabel = document.getElementById('save-label');
  var pipsEl = document.getElementById('pips');
  var toastEl = document.getElementById('toast');
  var hintEl = document.getElementById('hint');
  var chainEl = document.getElementById('chain-pop');
  var motionQ = window.matchMedia('(prefers-reduced-motion: reduce)');

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
  var chainTok = 0;
  var dieTok = 0;

  var particles = [];
  var feathers = [];
  var sparks = [];
  var floats = [];
  var rings = [];
  var motes = [];

  var keys = { l: false, r: false, u: false, d: false, hop: false, hopHeld: false, shot: false };
  var pad = { l: false, r: false, hop: false, hopHeld: false, shot: false };

  var G = {
    mode: 'title',
    kind: 'save',
    clock: 0,
    wave: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboAge: 0,
    nextLife: LIFE_AT,
    saved: 0,
    need: 0,
    player: null,
    plats: [],
    cages: [],
    balloons: [],
    crafts: [],
    foes: [],
    fruits: [],
    shots: [],
    freed: [],
    whale: null,
    exit: null,
    worldW: 920,
    worldH: 420,
    waterY: 0,
    spawn: { x: 56, y: 348 },
    check: { x: 56, y: 348 },
    camX: 0,
    camY: 0,
    dropT: 0,
    dropPlat: -1,
    clearT: 0,
    stop: 0,
    shake: 0,
    kickX: 0,
    kickY: 0,
    flash: 0,
    flashRgb: LIME,
    why: '',
    won: false
  };

  function reduceMotion() {
    return motionQ.matches;
  }
  function isChase() {
    return G.kind === 'chase';
  }
  function spd() {
    return isChase() ? 1.42 : 1;
  }
  function sx(x) {
    return L.x + (x - G.camX) * L.s;
  }
  function sy(y) {
    return L.y + (y - G.camY) * L.s;
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
        this.master.gain.value = this.muted ? 0 : 0.4;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.4;
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
    hop: function (air) {
      this.ensure();
      if (air) {
        this.beep(420, 0.05, 'square', 0.04, 680);
        this.noise(0.04, 0.03, 1600, 'highpass');
      } else {
        this.beep(280, 0.055, 'square', 0.045, 520);
        this.noise(0.045, 0.04, 700, 'bandpass');
      }
    },
    land: function () {
      this.ensure();
      this.noise(0.04, 0.045, 420, 'lowpass');
      this.beep(160, 0.04, 'triangle', 0.03, 90);
    },
    shot: function () {
      this.ensure();
      this.beep(980, 0.045, 'square', 0.05, 420);
      this.noise(0.04, 0.05, 1800, 'highpass');
    },
    hit: function (combo) {
      this.ensure();
      var p = 1 + Math.min(6, combo) * 0.08;
      this.beep(520 * p, 0.07, 'square', 0.07, 180);
      this.beep(880 * p, 0.09, 'triangle', 0.05, 420 * p);
      this.noise(0.07, 0.09, 1100, 'bandpass');
    },
    cage: function () {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.055, 784);
      this.beep(659, 0.1, 'triangle', 0.05, 1046);
      this.beep(784, 0.16, 'sine', 0.04, 1318);
      this.noise(0.08, 0.06, 1400, 'highpass');
    },
    pop: function () {
      this.ensure();
      this.beep(640, 0.06, 'triangle', 0.05, 220);
      this.noise(0.07, 0.08, 900, 'bandpass');
    },
    mount: function () {
      this.ensure();
      this.beep(392, 0.07, 'square', 0.045, 587);
      this.beep(784, 0.1, 'sine', 0.035, 988);
    },
    fruit: function () {
      this.ensure();
      this.beep(880, 0.07, 'sine', 0.05, 1320);
      this.beep(1180, 0.09, 'triangle', 0.03, 1560);
    },
    die: function () {
      this.ensure();
      this.noise(0.2, 0.12, 240, 'lowpass');
      this.beep(320, 0.24, 'sawtooth', 0.055, 70);
      this.beep(170, 0.22, 'square', 0.04, 48);
    },
    splash: function () {
      this.ensure();
      this.noise(0.16, 0.13, 360, 'lowpass');
      this.beep(140, 0.12, 'sine', 0.04, 50);
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
    win: function () {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.05, 659);
      this.beep(784, 0.14, 'triangle', 0.05, 1046);
      this.beep(1046, 0.22, 'sine', 0.04, 1318);
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
    },
    whale: function () {
      this.ensure();
      this.noise(0.16, 0.12, 220, 'lowpass');
      this.beep(90, 0.2, 'sawtooth', 0.05, 42);
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
  function burst(x, y, n, rgb, spd0, life, grav) {
    var i, cap;
    cap = 160 - particles.length;
    if (n > cap) n = cap < 0 ? 0 : cap;
    for (i = 0; i < n; i++) {
      particles.push({
        x: x, y: y,
        vx: rand(-1, 1) * spd0,
        vy: rand(-1.2, 0.3) * spd0,
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
        vx: rand(-1, 1) * 90,
        vy: rand(-110, -16),
        t: rand(0.1, 0.32),
        rgb: rgb
      });
    }
  }
  function featherBurst(x, y, n, rgb) {
    var i, cap;
    cap = 80 - feathers.length;
    if (n > cap) n = cap < 0 ? 0 : cap;
    for (i = 0; i < n; i++) {
      feathers.push({
        x: x + rand(-4, 4),
        y: y + rand(-6, 4),
        vx: rand(-70, 70),
        vy: rand(-140, -20),
        rot: rand(0, TAU),
        vr: rand(-8, 8),
        t: rand(0.38, 0.7),
        max: 0.7,
        rgb: rgb || LIME,
        w: rand(4, 7),
        h: rand(1.4, 2.4)
      });
    }
  }
  function ringAt(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: 6 });
  }
  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, text: text, t: 0, rgb: rgb });
  }

  function toast(msg, warn, gold) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    clearTimeout(toastTok);
    toastTok = setTimeout(function () { toastEl.classList.add('hidden'); }, 980);
  }

  function showChain(n) {
    if (reduceMotion()) return;
    chainEl.textContent = '连击 ×' + n;
    chainEl.classList.remove('hidden');
    chainEl.style.animation = 'none';
    void chainEl.offsetWidth;
    chainEl.style.animation = '';
    stageEl.classList.remove('chain');
    void stageEl.offsetWidth;
    stageEl.classList.add('chain');
    clearTimeout(chainTok);
    chainTok = setTimeout(function () {
      chainEl.classList.add('hidden');
      stageEl.classList.remove('chain');
    }, 700);
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
      showChain(G.combo);
      toast(G.combo >= 10 ? '连击 ×' + G.combo : '连击', false, true);
    }
  }

  function resetCombo() {
    G.combo = 0;
    G.comboAge = 0;
    comboEl.textContent = '×1';
    comboBox.classList.remove('hot');
  }

  function cagesLeft() {
    var i, n = 0;
    for (i = 0; i < G.cages.length; i++) if (!G.cages[i].open) n++;
    return n;
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
    var left = cagesLeft();
    scoreEl.textContent = String(G.score);
    waveEl.textContent = String(G.wave);
    bestEl.textContent = String(G.best);
    comboEl.textContent = '×' + Math.max(1, comboMul(G.combo));
    labWave.textContent = isChase() ? '追' : '关';
    renderPips();
    modeLabel.textContent = isChase() ? '追赶' : '救人';
    modeLabel.classList.toggle('chase', isChase());
    saveLabel.textContent = '笼 ' + (G.need - left) + '/' + G.need;
    if (G.player && G.player.ride) {
      tagLabel.textContent = G.player.ride.kind === 'hover' ? '气垫' : (G.player.ride.kind === 'blimp' ? '飞艇' : '气球');
      tagLabel.classList.remove('warn');
    } else if (G.whale && G.whale.state === 'leap') {
      tagLabel.textContent = '大鲸';
      tagLabel.classList.add('warn');
    } else if (G.exit && G.exit.open) {
      tagLabel.textContent = '出口';
      tagLabel.classList.remove('warn');
    } else {
      tagLabel.textContent = STAGES[Math.max(0, G.wave - 1) % STAGES.length].name;
      tagLabel.classList.remove('warn');
    }
    if (G.mode === 'play') {
      hintEl.textContent = left
        ? '救出笼中同伴 · 还可骑气球飞艇'
        : '笼子已空 · 走进出口';
      hintEl.classList.toggle('hot', !left);
      hintEl.classList.remove('warn');
    }
  }

  function resetFx() {
    particles.length = 0;
    feathers.length = 0;
    sparks.length = 0;
    floats.length = 0;
    rings.length = 0;
  }

  function seedMotes() {
    var i;
    motes.length = 0;
    for (i = 0; i < 36; i++) {
      motes.push({
        x: rand(0, G.worldW || VIEW_W),
        y: rand(8, (G.worldH || VIEW_H) - 20),
        s: rand(0.5, 1.7),
        ph: rand(0, TAU),
        sp: rand(0.15, 0.6)
      });
    }
  }

  /* ---- entities ---- */
  function makePlayer(x, y, inv) {
    return {
      x: x, y: y, vx: 0, vy: 0,
      face: 1,
      grounded: true,
      plat: -1,
      coyote: 0,
      hopBuf: 0,
      airJumps: 0,
      hopT: 0,
      shotCd: 0,
      inv: inv || 0,
      dead: false,
      deadT: 0,
      why: '',
      sqX: 1,
      sqY: 1,
      walk: 0,
      ride: null,
      shootT: 0,
      blink: 0
    };
  }

  function makeFoe(spec) {
    return {
      kind: spec.kind,
      x: spec.x,
      y: spec.y,
      vx: spec.kind === 'bird' ? (Math.random() < 0.5 ? -70 : 70) : (Math.random() < 0.5 ? -48 : 48),
      vy: 0,
      face: 1,
      grounded: spec.kind !== 'bird',
      plat: -1,
      dead: false,
      deadT: 0,
      phase: Math.random() * TAU,
      baseY: spec.y,
      hp: 1,
      sq: 1
    };
  }

  function makeBalloon(spec) {
    return {
      kind: 'balloon',
      x: spec.x,
      y: spec.y,
      ox: spec.x,
      oy: spec.y,
      c: spec.c || 0,
      popped: false,
      ridden: false,
      rideT: 0,
      bob: Math.random() * TAU,
      sq: 1
    };
  }

  function makeCraft(spec) {
    return {
      kind: spec.kind,
      x: spec.x,
      y: spec.y,
      vx: 0,
      vy: 0,
      ridden: false,
      face: 1,
      bob: 0
    };
  }

  function makeCage(spec) {
    return {
      x: spec.x,
      y: spec.y,
      open: false,
      bob: Math.random() * TAU,
      shake: 0
    };
  }

  function makeFruit(spec) {
    return {
      x: spec.x,
      y: spec.y,
      kind: spec.kind | 0,
      got: false,
      bob: Math.random() * TAU
    };
  }

  function makeWhale() {
    return {
      state: 'hide',
      x: G.worldW * 0.5,
      y: (G.waterY || G.worldH) + 28,
      hover: 0,
      cd: 1.2,
      leapT: 0,
      sx: 0, sy: 0, tx: 0, ty: 0
    };
  }

  function loadStage(idx, keepScore) {
    var s = STAGES[idx];
    var i, list;
    G.worldW = s.w;
    G.worldH = s.h;
    G.waterY = s.water || 0;
    G.spawn.x = s.spawn.x;
    G.spawn.y = s.spawn.y;
    G.check.x = s.spawn.x;
    G.check.y = s.spawn.y;
    G.plats = [];
    for (i = 0; i < s.plats.length; i++) G.plats.push(clonePlat(s.plats[i]));
    G.cages = [];
    for (i = 0; i < s.cages.length; i++) G.cages.push(makeCage(s.cages[i]));
    G.balloons = [];
    for (i = 0; i < (s.balloons || []).length; i++) G.balloons.push(makeBalloon(s.balloons[i]));
    G.crafts = [];
    for (i = 0; i < (s.crafts || []).length; i++) G.crafts.push(makeCraft(s.crafts[i]));
    G.foes = [];
    list = (s.foes || []).slice();
    if (isChase() && s.extra) list = list.concat(s.extra);
    for (i = 0; i < list.length; i++) G.foes.push(makeFoe(list[i]));
    G.fruits = [];
    for (i = 0; i < (s.fruits || []).length; i++) G.fruits.push(makeFruit(s.fruits[i]));
    G.shots.length = 0;
    G.freed.length = 0;
    G.exit = { x: s.exit.x, y: s.exit.y, w: s.exit.w, h: s.exit.h, open: false };
    G.whale = s.whale ? makeWhale() : null;
    G.need = G.cages.length;
    G.saved = 0;
    G.dropT = 0;
    G.dropPlat = -1;
    G.clearT = 0;
    G.camX = clamp(s.spawn.x - VIEW_W * 0.35, 0, Math.max(0, G.worldW - VIEW_W));
    G.camY = clamp(s.spawn.y - VIEW_H * 0.6, 0, Math.max(0, G.worldH - VIEW_H));
    seedMotes();
    if (!keepScore) {
      /* keep */
    }
  }

  function spawnPlayer(inv) {
    var x = G.check.x;
    var y = G.check.y;
    G.player = makePlayer(x, y, inv == null ? INVULN : inv);
    G.player.grounded = true;
  }

  function ridingKind(p) {
    return p && p.ride ? p.ride.kind : '';
  }
  function waterSafe(p) {
    var k = ridingKind(p);
    return k === 'hover' || k === 'blimp';
  }

  /* ---- physics ---- */
  function platLandAt(u, prevY) {
    var i, p, feet, prevFeet;
    feet = u.y + FOOT;
    prevFeet = prevY + FOOT;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (u === G.player && G.dropT > 0 && G.dropPlat === i) continue;
      if (u.x < p.x - 3 || u.x > p.x + p.w + 3) continue;
      if (prevFeet <= p.y + 5 && feet >= p.y && feet <= p.y + 18 && u.vy >= -12) return i;
    }
    return -1;
  }

  function platUnder(x, y) {
    var i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (x >= p.x - 2 && x <= p.x + p.w + 2 && Math.abs((y + FOOT) - p.y) < 8) return i;
    }
    return -1;
  }

  function platEdgeSoon(u, dir) {
    var p, nx;
    if (u.plat < 0 || u.plat >= G.plats.length) return true;
    p = G.plats[u.plat];
    nx = u.x + dir * 10;
    return nx < p.x + 6 || nx > p.x + p.w - 6;
  }

  function doHop(p, air) {
    var v = air ? AIR_JUMP : JUMP_V;
    if (p.ride) dismount(p, true);
    p.vy = -v;
    p.grounded = false;
    p.plat = -1;
    p.coyote = 0;
    p.hopT = 0.14;
    p.sqX = 0.78;
    p.sqY = 1.28;
    if (air) p.airJumps = 1;
    else p.airJumps = 0;
    audio.hop(air);
    burst(p.x, p.y + FOOT, air ? 3 : 6, LIME, air ? 28 : 46, 0.2, 18);
    featherBurst(p.x, p.y, air ? 2 : 4, KIWI);
    kick(0, air ? 1.2 : 2.4);
  }

  function dismount(p, hopOff) {
    var r = p.ride;
    if (!r) return;
    r.ridden = false;
    if (r.kind === 'balloon') {
      popBalloon(r, hopOff);
    }
    p.ride = null;
    p.grounded = false;
    if (hopOff) {
      p.vy = -JUMP_V * 0.92;
      p.sqX = 0.8;
      p.sqY = 1.22;
    } else {
      p.vy = Math.min(p.vy, 40);
    }
  }

  function mount(p, ent) {
    if (!ent || p.dead || p.ride) return;
    p.ride = ent;
    ent.ridden = true;
    if (ent.kind === 'balloon') ent.rideT = 0;
    p.grounded = false;
    p.plat = -1;
    p.vy = 0;
    p.sqX = 1.18;
    p.sqY = 0.82;
    audio.mount();
    ringAt(p.x, p.y, ent.kind === 'balloon' ? (BALL_RGB[ent.c] || CYN) : CYN);
    burst(p.x, p.y, 8, CYN, 50, 0.24, 8);
    kick(0, 2);
  }

  function popBalloon(b, fromHop) {
    if (!b || b.popped) return;
    b.popped = true;
    b.ridden = false;
    burst(b.x, b.y, 14, BALL_RGB[b.c] || MAG, 80, 0.34, 12);
    burst(b.x, b.y, 6, WHT, 50, 0.2, 6);
    ringAt(b.x, b.y, BALL_RGB[b.c] || MAG);
    audio.pop();
    if (!fromHop) {
      hitStop(0.03);
      kick(0, 2);
    }
  }

  function tryMount(p) {
    var i, b, c;
    if (p.dead || p.ride) return;
    for (i = 0; i < G.balloons.length; i++) {
      b = G.balloons[i];
      if (b.popped || b.ridden) continue;
      if (Math.abs(p.x - b.x) < 14 && p.y < b.y + 6 && p.y > b.y - 22 && p.vy >= -20) {
        mount(p, b);
        return;
      }
    }
    for (i = 0; i < G.crafts.length; i++) {
      c = G.crafts[i];
      if (c.ridden) continue;
      if (Math.abs(p.x - c.x) < (c.kind === 'blimp' ? 22 : 18) && Math.abs(p.y - c.y) < 16) {
        mount(p, c);
        return;
      }
    }
  }

  function shoot(p) {
    if (p.shotCd > 0 || p.dead) return;
    if (G.shots.length >= MAX_SHOT) return;
    p.shotCd = SHOT_CD;
    p.shootT = 0.1;
    p.sqX = 1.18;
    p.sqY = 0.88;
    G.shots.push({
      x: p.x + p.face * 12,
      y: p.y - 2,
      vx: p.face * SHOT_SP,
      vy: p.ride ? -12 : 0,
      life: 0.9,
      face: p.face
    });
    audio.shot();
    spark(p.x + p.face * 12, p.y - 2, GOLD, 3);
    burst(p.x + p.face * 10, p.y - 2, 3, LIME, 40, 0.12, 4);
  }

  function thinkPlayer(p, dt) {
    var wantL, wantR, hop, shot, down;
    wantL = keys.l || pad.l;
    wantR = keys.r || pad.r;
    hop = keys.hop || pad.hop;
    shot = keys.shot || pad.shot;
    down = keys.d;
    keys.hop = false;
    pad.hop = false;
    keys.shot = false;
    pad.shot = false;

    if (G.mode !== 'play') {
      p.wantL = false;
      p.wantR = false;
      return;
    }

    if (wantL && !wantR) { p.face = -1; p.wantL = true; p.wantR = false; }
    else if (wantR && !wantL) { p.face = 1; p.wantL = false; p.wantR = true; }
    else { p.wantL = false; p.wantR = false; }

    if (hop) p.hopBuf = BUFFER;
    if ((keys.hopHeld || pad.hopHeld) && p.grounded && !p.ride) {
      p.hopBuf = Math.max(p.hopBuf, 0.04);
    }
    if (p.hopBuf > 0) p.hopBuf -= dt;

    if (p.hopBuf > 0 && !p.dead) {
      if (p.ride) {
        p.hopBuf = 0;
        doHop(p, false);
      } else if (p.grounded || p.coyote > 0) {
        p.hopBuf = 0;
        doHop(p, false);
      } else if (p.airJumps < 1) {
        p.hopBuf = 0;
        doHop(p, true);
      }
    }

    if (!keys.hopHeld && !pad.hopHeld && p.vy < -360 && !p.ride) {
      p.vy = -360;
    }

    if (down && p.grounded && p.plat >= 0) {
      G.dropT = 0.16;
      G.dropPlat = p.plat;
      p.grounded = false;
      p.plat = -1;
      p.vy = 40;
    }

    if (shot) shoot(p);
  }

  function tickRide(p, dt) {
    var r = p.ride;
    var want = 0;
    var maxVx;
    if (!r) return false;
    if (r.kind === 'balloon' && r.popped) {
      p.ride = null;
      return false;
    }
    if (p.wantL) want -= 1;
    if (p.wantR) want += 1;
    if (want) p.face = want;

    if (r.kind === 'balloon') {
      r.rideT += dt;
      r.y -= RIDE_UP * dt;
      r.x += want * 110 * dt;
      r.x = clamp(r.x, 16, G.worldW - 16);
      if (r.y < 28) {
        popBalloon(r, false);
        p.ride = null;
        p.vy = 20;
        return false;
      }
      if (r.rideT > 4.8) {
        popBalloon(r, false);
        p.ride = null;
        p.vy = -40;
        return false;
      }
      p.x = r.x;
      p.y = r.y - 16;
      p.vx = want * 110;
      p.vy = -RIDE_UP;
    } else if (r.kind === 'hover') {
      maxVx = 210;
      if (want) r.vx += want * 520 * dt;
      else r.vx *= Math.exp(-4.2 * dt);
      r.vx = clamp(r.vx, -maxVx, maxVx);
      r.x += r.vx * dt;
      r.x = clamp(r.x, 18, G.worldW - 18);
      if (G.waterY > 0) r.y = Math.min(r.y, G.waterY - 18);
      r.bob += dt * 6;
      p.x = r.x;
      p.y = r.y - 8 + Math.sin(r.bob) * 1.4;
      p.vx = r.vx;
      p.vy = 0;
      r.face = p.face;
    } else if (r.kind === 'blimp') {
      maxVx = 150;
      if (want) r.vx += want * 380 * dt;
      else r.vx *= Math.exp(-3.4 * dt);
      r.vx = clamp(r.vx, -maxVx, maxVx);
      r.x += r.vx * dt;
      r.x = clamp(r.x, 22, G.worldW - 22);
      r.y -= BLIMP_UP * dt;
      if (r.y < 36) r.y = 36;
      r.bob += dt * 4;
      p.x = r.x;
      p.y = r.y + 10 + Math.sin(r.bob) * 1.2;
      p.vx = r.vx;
      p.vy = -BLIMP_UP;
      r.face = p.face;
    }
    return true;
  }

  function tickPlayer(p, dt) {
    var prevY, landed, plat, maxVx, accel, want;

    if (p.dead) {
      p.deadT += dt;
      p.vy = Math.min(MAX_FALL, p.vy + GRAV * dt);
      p.y += p.vy * dt;
      p.x += p.vx * dt;
      return;
    }

    p.shotCd = Math.max(0, p.shotCd - dt);
    p.hopT = Math.max(0, p.hopT - dt);
    p.shootT = Math.max(0, p.shootT - dt);
    if (p.inv > 0) p.inv = Math.max(0, p.inv - dt);
    p.sqX += (1 - p.sqX) * Math.min(1, 14 * dt);
    p.sqY += (1 - p.sqY) * Math.min(1, 14 * dt);
    p.blink += dt;

    if (tickRide(p, dt)) {
      tryMount(p);
      return;
    }

    want = 0;
    if (p.wantL) want -= 1;
    if (p.wantR) want += 1;
    maxVx = p.grounded ? WALK : AIR;
    accel = p.grounded ? 820 : 540;
    if (want) {
      p.vx += want * accel * dt;
      p.face = want;
    } else if (p.grounded) {
      p.vx *= Math.exp(-8.5 * dt);
    } else {
      p.vx *= Math.exp(-1.6 * dt);
    }
    p.vx = clamp(p.vx, -maxVx, maxVx);

    prevY = p.y;
    if (!p.grounded) {
      p.vy = Math.min(MAX_FALL, p.vy + GRAV * dt);
      p.coyote = Math.max(0, p.coyote - dt);
    } else {
      p.vy = 0;
      p.coyote = COYOTE;
      p.airJumps = 0;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.x = clamp(p.x, 12, G.worldW - 12);

    landed = platLandAt(p, prevY);
    if (landed >= 0 && p.vy >= -12) {
      plat = G.plats[landed];
      p.y = plat.y - FOOT;
      if (!p.grounded && p.vy > 60) {
        audio.land();
        burst(p.x, p.y + FOOT, 4, LIME, 30, 0.16, 20);
        p.sqX = 1.2;
        p.sqY = 0.78;
      }
      p.vy = 0;
      p.grounded = true;
      p.plat = landed;
      p.airJumps = 0;
    } else if (p.grounded) {
      if (p.plat < 0 || p.plat >= G.plats.length || p.x < G.plats[p.plat].x - 3 || p.x > G.plats[p.plat].x + G.plats[p.plat].w + 3) {
        p.grounded = false;
        p.plat = -1;
        p.coyote = COYOTE;
      } else {
        p.y = G.plats[p.plat].y - FOOT;
        p.x += (G.plats[p.plat].vx || 0) * dt;
      }
    }

    if (p.grounded) p.walk += Math.abs(p.vx) * dt * 0.045;
    tryMount(p);
  }

  function tickFoe(e, dt) {
    var prevY, landed, plat, speed;
    if (e.dead) {
      e.deadT += dt;
      e.vy = Math.min(MAX_FALL, e.vy + GRAV * dt);
      e.y += e.vy * dt;
      e.x += e.vx * dt;
      return;
    }
    e.phase += dt;
    e.sq += (1 - e.sq) * Math.min(1, 12 * dt);
    speed = spd();

    if (e.kind === 'bird') {
      e.x += e.vx * speed * dt;
      if (e.x < 24 || e.x > G.worldW - 24) e.vx *= -1;
      e.y = e.baseY + Math.sin(e.phase * 2.2) * 16;
      e.face = e.vx >= 0 ? 1 : -1;
      return;
    }

    prevY = e.y;
    if (!e.grounded) e.vy = Math.min(MAX_FALL, e.vy + GRAV * dt);
    e.x += e.vx * speed * dt;
    e.y += e.vy * dt;
    e.face = e.vx >= 0 ? 1 : -1;

    landed = platLandAt(e, prevY);
    if (landed >= 0 && e.vy >= 0) {
      plat = G.plats[landed];
      e.y = plat.y - FOOT;
      e.vy = 0;
      e.grounded = true;
      e.plat = landed;
    } else if (e.grounded) {
      if (e.plat < 0 || e.plat >= G.plats.length || e.x < G.plats[e.plat].x - 2 || e.x > G.plats[e.plat].x + G.plats[e.plat].w + 2) {
        e.grounded = false;
        e.plat = -1;
      } else {
        e.y = G.plats[e.plat].y - FOOT;
        e.x += (G.plats[e.plat].vx || 0) * dt;
      }
    }

    if (e.grounded && platEdgeSoon(e, e.vx >= 0 ? 1 : -1)) e.vx *= -1;
    if (e.x < 16 || e.x > G.worldW - 16) e.vx *= -1;
  }

  function tickPlats(dt) {
    var i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (!p.vx) continue;
      p.x += p.vx * dt;
      if (p.x < p.ox - 52 || p.x > p.ox + 52) p.vx *= -1;
    }
  }

  function tickBalloons(dt) {
    var i, b;
    for (i = 0; i < G.balloons.length; i++) {
      b = G.balloons[i];
      if (b.popped || b.ridden) continue;
      b.bob += dt * 2.4;
      b.y = b.oy + Math.sin(b.bob) * 7;
      b.x = b.ox + Math.sin(b.bob * 0.55) * 6;
      b.sq += (1 - b.sq) * Math.min(1, 10 * dt);
    }
  }

  function tickCrafts(dt) {
    var i, c;
    for (i = 0; i < G.crafts.length; i++) {
      c = G.crafts[i];
      if (c.ridden) continue;
      c.bob += dt * 3;
      if (c.kind === 'blimp') {
        c.y += Math.sin(c.bob) * 8 * dt;
      }
    }
  }

  function tickShots(dt) {
    var i, s, j, e, c, hit;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      hit = false;
      if (s.life <= 0 || s.x < -20 || s.x > G.worldW + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      for (j = 0; j < G.foes.length; j++) {
        e = G.foes[j];
        if (e.dead) continue;
        if (Math.abs(s.x - e.x) < 14 && Math.abs(s.y - e.y) < 12) {
          killFoe(e);
          hit = true;
          break;
        }
      }
      if (!hit && G.whale && G.whale.state === 'leap') {
        if (Math.abs(s.x - G.whale.x) < 22 && Math.abs(s.y - G.whale.y) < 16) {
          stunWhale();
          hit = true;
        }
      }
      if (!hit) {
        for (j = 0; j < G.cages.length; j++) {
          c = G.cages[j];
          if (c.open) continue;
          if (Math.abs(s.x - c.x) < 14 && Math.abs(s.y - (c.y - 10)) < 16) {
            openCage(c);
            hit = true;
            break;
          }
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function killFoe(e) {
    var pts, mul, rgb;
    if (e.dead) return;
    e.dead = true;
    e.deadT = 0;
    e.vy = -80;
    e.vx = (e.face || 1) * 40;
    e.sq = 1.3;
    rgb = FOE_RGB[e.kind] || MAG;
    mul = comboMul(G.combo + 1);
    pts = (FOE_PTS[e.kind] || 150) * mul;
    featherBurst(e.x, e.y, 10, rgb);
    featherBurst(e.x, e.y, 6, LIME);
    burst(e.x, e.y, 12, rgb, 90, 0.32, 16);
    spark(e.x, e.y, GOLD, 6);
    ringAt(e.x, e.y, LIME);
    audio.hit(G.combo + 1);
    hitStop(0.055);
    kick((e.x > (G.player ? G.player.x : 0) ? 3 : -3), 2);
    flash(rgb, 0.07);
    if (G.mode === 'play') {
      bumpCombo();
      addScore(pts, e.x, e.y, String(pts));
    }
  }

  function stunWhale() {
    var w = G.whale;
    var pts, mul;
    if (!w || w.state !== 'leap') return;
    w.state = 'hide';
    w.cd = 2.4;
    w.y = (G.waterY || G.worldH) + 30;
    mul = comboMul(G.combo + 1);
    pts = FOE_PTS.whale * mul;
    burst(w.x, G.waterY || w.y, 18, MAG, 100, 0.4, 20);
    featherBurst(w.x, w.y, 8, MAG);
    audio.hit(G.combo + 1);
    audio.splash();
    hitStop(0.07);
    shake(0.3);
    if (G.mode === 'play') {
      bumpCombo();
      addScore(pts, w.x, w.y - 20, String(pts));
    }
  }

  function openCage(c) {
    var pts, mul, f;
    if (!c || c.open) return;
    c.open = true;
    G.saved += 1;
    G.check.x = c.x;
    G.check.y = c.y;
    mul = comboMul(G.combo + 1);
    pts = 500 * mul;
    f = { x: c.x, y: c.y - 8, vx: rand(-40, 40), vy: -120, t: 0, face: 1 };
    G.freed.push(f);
    burst(c.x, c.y - 12, 16, MAG, 90, 0.4, 12);
    burst(c.x, c.y - 12, 10, GOLD, 70, 0.3, 8);
    featherBurst(c.x, c.y - 8, 12, LIME);
    ringAt(c.x, c.y - 12, GOLD);
    spark(c.x, c.y - 10, WHT, 8);
    audio.cage();
    hitStop(0.07);
    kick(0, 4);
    flash(GOLD, 0.1);
    if (G.mode === 'play') {
      bumpCombo();
      addScore(pts, c.x, c.y - 20, '救+' + pts);
      toast(cagesLeft() ? '救出' : '全救出', false, true);
    }
    if (cagesLeft() === 0 && G.exit) {
      G.exit.open = true;
      ringAt(G.exit.x + 18, G.exit.y + 10, LIME);
      audio.wave();
    }
    hudPlay();
  }

  function pickFruit(f) {
    var pts;
    if (!f || f.got) return;
    f.got = true;
    pts = FRUIT_PTS[f.kind] || 120;
    burst(f.x, f.y, 10, FRUIT_RGB[f.kind] || LIME, 60, 0.28, 10);
    ringAt(f.x, f.y, FRUIT_RGB[f.kind] || LIME);
    audio.fruit();
    kick(0, 1.5);
    if (G.mode === 'play') addScore(pts, f.x, f.y, '+' + pts);
  }

  function killPlayer(why) {
    var p = G.player;
    if (!p || p.dead || G.mode !== 'play') return;
    if (p.inv > 0 && why !== 'pit' && why !== 'water' && why !== 'whale') return;
    p.dead = true;
    p.deadT = 0;
    p.why = why;
    p.vy = -90;
    p.vx = -p.face * 50;
    if (p.ride) {
      p.ride.ridden = false;
      if (p.ride.kind === 'balloon') popBalloon(p.ride, false);
      p.ride = null;
    }
    G.lives -= 1;
    G.why = why;
    resetCombo();
    featherBurst(p.x, p.y, 14, LIME);
    burst(p.x, p.y, 16, MAG, 90, 0.4, 18);
    flash(MAG, 0.12);
    hitStop(0.08);
    shake(0.4);
    stageEl.classList.remove('die');
    void stageEl.offsetWidth;
    stageEl.classList.add('die');
    clearTimeout(dieTok);
    dieTok = setTimeout(function () { stageEl.classList.remove('die'); }, 340);
    if (why === 'water' || why === 'whale') audio.splash();
    else audio.die();
    hudPlay();
  }

  function tickWhale(dt) {
    var w = G.whale;
    var p = G.player;
    var over, t;
    if (!w || G.waterY <= 0) return;
    if (w.state === 'hide') {
      w.cd -= dt;
      w.x += Math.sin(G.clock * 0.7) * 18 * dt;
      w.y = G.waterY + 26;
      over = p && !p.dead && p.y + FOOT > G.waterY - 56 && !waterSafe(p);
      if (over) w.hover += dt;
      else w.hover = Math.max(0, w.hover - dt * 0.6);
      if (w.cd <= 0 && w.hover > 0.85 && p) {
        w.state = 'leap';
        w.leapT = 0;
        w.sx = w.x;
        w.sy = G.waterY + 20;
        w.tx = p.x;
        w.ty = Math.min(p.y, G.waterY - 30);
        audio.whale();
        toast('大鲸', true, false);
      }
    } else if (w.state === 'leap') {
      w.leapT += dt;
      t = clamp(w.leapT / 0.72, 0, 1);
      w.x = lerp(w.sx, w.tx, t);
      w.y = lerp(w.sy, w.ty, t) - Math.sin(t * Math.PI) * 70;
      if (t >= 1) {
        w.state = 'hide';
        w.cd = 1.6;
        w.hover = 0;
        w.y = G.waterY + 28;
        burst(w.x, G.waterY, 12, CYN, 70, 0.3, 30);
      }
    }
  }

  function collideAll() {
    var p = G.player;
    var i, e, c, f, w;
    if (!p || p.dead || G.mode !== 'play') return;

    for (i = 0; i < G.cages.length; i++) {
      c = G.cages[i];
      if (c.open) continue;
      if (Math.abs(p.x - c.x) < 16 && Math.abs(p.y - (c.y - 8)) < 18) openCage(c);
    }
    for (i = 0; i < G.fruits.length; i++) {
      f = G.fruits[i];
      if (f.got) continue;
      if (Math.abs(p.x - f.x) < 12 && Math.abs(p.y - f.y) < 14) pickFruit(f);
    }
    if (p.inv <= 0) {
      for (i = 0; i < G.foes.length; i++) {
        e = G.foes[i];
        if (e.dead) continue;
        if (Math.abs(p.x - e.x) < 14 && Math.abs(p.y - e.y) < 14) {
          killPlayer('hit');
          return;
        }
      }
    }
    w = G.whale;
    if (w && w.state === 'leap' && p.inv <= 0) {
      if (Math.abs(p.x - w.x) < 22 && Math.abs(p.y - w.y) < 16) {
        killPlayer('whale');
        return;
      }
    }
    if (G.waterY > 0 && p.y + FOOT > G.waterY + 2 && !waterSafe(p)) {
      killPlayer('water');
      return;
    }
    if (p.y > G.worldH + 18) {
      killPlayer('pit');
      return;
    }
    if (G.exit && G.exit.open && G.clearT <= 0) {
      if (p.x > G.exit.x - 4 && p.x < G.exit.x + G.exit.w + 4 && p.y + FOOT > G.exit.y - 6 && p.y < G.exit.y + G.exit.h + 8) {
        beginClear();
      }
    }
  }

  function beginClear() {
    var bonus;
    if (G.clearT > 0) return;
    G.clearT = 1.15;
    bonus = 1200 + 300 * G.wave;
    addScore(bonus, G.player.x, G.player.y - 24, '过关');
    toast(G.wave >= STAGES.length ? '全救出' : '下一关', false, true);
    audio.wave();
    burst(G.player.x, G.player.y, 18, GOLD, 90, 0.4, 10);
    flash(LIME, 0.12);
    hitStop(0.06);
    if (G.player && G.player.ride) dismount(G.player, false);
  }

  function nextStage() {
    if (G.wave >= STAGES.length) {
      showWin();
      return;
    }
    G.wave += 1;
    loadStage(G.wave - 1, true);
    spawnPlayer(0.5);
    toast(STAGES[G.wave - 1].name, false, true);
    hudPlay();
  }

  function checkOver() {
    var p = G.player;
    if (G.mode !== 'play' || !p) return;
    if (p.dead && p.deadT > DIE_T) {
      if (G.lives <= 0) {
        showOver();
        return;
      }
      spawnPlayer(INVULN);
      hudPlay();
    }
  }

  function tickFreed(dt) {
    var i, f;
    for (i = G.freed.length - 1; i >= 0; i--) {
      f = G.freed[i];
      f.t += dt;
      f.vy += GRAV * 0.45 * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      if (f.t > 1.1) G.freed.splice(i, 1);
    }
  }

  function tickFx(dt) {
    var i, o;
    G.clock += dt;
    if (G.combo > 0) {
      G.comboAge += dt;
      if (G.comboAge > COMBO_WIN) resetCombo();
    }
    if (G.dropT > 0) G.dropT -= dt;
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 2.6);
    G.kickX *= Math.exp(-10 * dt);
    G.kickY *= Math.exp(-10 * dt);
    for (i = particles.length - 1; i >= 0; i--) {
      o = particles[i];
      o.t -= dt;
      o.vy += (o.g || 24) * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      if (o.t <= 0) particles.splice(i, 1);
    }
    for (i = feathers.length - 1; i >= 0; i--) {
      o = feathers[i];
      o.t -= dt;
      o.vy += 90 * dt;
      o.vx *= Math.exp(-0.8 * dt);
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.rot += o.vr * dt;
      if (o.t <= 0) feathers.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      o = sparks[i];
      o.t -= dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.vy += 80 * dt;
      if (o.t <= 0) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      o = rings[i];
      o.t += dt;
      o.r += 90 * dt;
      if (o.t > 0.32) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      o = floats[i];
      o.t += dt;
      o.y -= 28 * dt;
      if (o.t > 0.7) floats.splice(i, 1);
    }
  }

  function tickCam(dt) {
    var p = G.player;
    var tx, ty, look;
    if (!p) return;
    look = p.face * 48;
    tx = clamp(p.x - VIEW_W * 0.42 - look * 0.15, 0, Math.max(0, G.worldW - VIEW_W));
    ty = clamp(p.y - VIEW_H * 0.58, 0, Math.max(0, G.worldH - VIEW_H));
    G.camX = lerp(G.camX, tx, Math.min(1, 5.5 * dt));
    G.camY = lerp(G.camY, ty, Math.min(1, 5.2 * dt));
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
    G.kind = 'save';
    G.wave = 1;
    G.score = 0;
    G.lives = LIVES;
    G.combo = 0;
    G.nextLife = LIFE_AT;
    G.why = '';
    G.won = false;
    loadStage(0, false);
    spawnPlayer(99);
    G.player.inv = 99;
    panelEl.classList.remove('win', 'lose');
    ovKicker.textContent = 'KIWI';
    ovTitle.textContent = '奇异';
    ovLead.textContent = '蹦跳射箭，骑上气球和飞艇，砸开笼子救出同伴。掉进坑或撞到敌人都会丢命。';
    ovOps.textContent = '← → / A D 走 · ↑ / W 跳 · 空格射箭 · 触屏左 跳 射 右 · R 重开 · M 静音';
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    showOverlay();
    hintEl.textContent = '蹦跳射箭 · 骑气球飞艇 · 救出笼中奇异鸟';
    hintEl.classList.remove('warn', 'hot');
    hudPlay();
  }

  function startRun(kind) {
    G.kind = kind === 'chase' ? 'chase' : 'save';
    G.mode = 'play';
    G.wave = 1;
    G.score = 0;
    G.lives = LIVES;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboAge = 0;
    G.nextLife = LIFE_AT;
    G.why = '';
    G.won = false;
    G.stop = 0;
    resetFx();
    loadStage(0, false);
    spawnPlayer(0.4);
    hideOverlay();
    audio.start();
    toast(isChase() ? '追赶' : STAGES[0].name, false, true);
    hudPlay();
    try { canvas.focus(); } catch (e) { /* ignore */ }
  }

  function retry() {
    audio.ui();
    if (G.mode === 'title') startRun('save');
    else startRun(G.kind);
  }

  function showOver() {
    G.mode = 'over';
    persistBest();
    panelEl.classList.remove('win');
    panelEl.classList.add('lose');
    ovKicker.textContent = 'KIWI';
    ovTitle.textContent = G.why === 'water' ? '沉下去了' : (G.why === 'pit' ? '掉下去了' : '被撞到了');
    ovLead.textContent = '分数 ' + G.score + ' · 最高 ' + G.best + ' · 连击 ×' + Math.max(1, G.maxCombo) +
      ' · ' + (isChase() ? '追赶' : '救人') + ' ' + G.wave + ' 关';
    ovOps.textContent = 'R 重开 · Enter / 空格 再来 · 2 换模式';
    ovStart.classList.add('gone');
    ovEnd.classList.remove('gone');
    showOverlay();
    hintEl.textContent = 'R 立刻重开 · 顶栏重开随时可用';
    hintEl.classList.add('warn');
    hintEl.classList.remove('hot');
    audio.over();
    hudPlay();
  }

  function showWin() {
    var bonus = isChase() ? 8000 : 4000;
    G.won = true;
    if (G.mode === 'play') addScore(bonus, G.player ? G.player.x : 0, G.player ? G.player.y : 0, '通关');
    G.mode = 'over';
    persistBest();
    panelEl.classList.remove('lose');
    panelEl.classList.add('win');
    ovKicker.textContent = 'KIWI';
    ovTitle.textContent = isChase() ? '追赶贯通' : '岛链救通';
    ovLead.textContent = '分数 ' + G.score + ' · 最高 ' + G.best + ' · 连击 ×' + Math.max(1, G.maxCombo);
    ovOps.textContent = 'R 重开 · Enter / 空格 再来 · 2 换模式';
    ovStart.classList.add('gone');
    ovEnd.classList.remove('gone');
    showOverlay();
    hintEl.textContent = 'R 立刻重开 · 顶栏重开随时可用';
    hintEl.classList.remove('warn');
    hintEl.classList.add('hot');
    audio.win();
    hudPlay();
  }

  /* ---- tick ---- */
  function tick(dt) {
    var i, p;
    tickPlats(dt);
    tickBalloons(dt);
    tickCrafts(dt);
    p = G.player;
    if (p) {
      thinkPlayer(p, dt);
      tickPlayer(p, dt);
    }
    for (i = 0; i < G.foes.length; i++) tickFoe(G.foes[i], dt);
    tickShots(dt);
    tickWhale(dt);
    tickFreed(dt);
    collideAll();
    tickFx(dt);
    tickCam(dt);

    if (G.clearT > 0) {
      G.clearT -= dt;
      if (G.clearT <= 0) nextStage();
    }
    checkOver();
  }

  /* ---- draw ---- */
  function drawBg() {
    var g, i, m, x, y, wy;
    ctx.fillStyle = '#040802';
    ctx.fillRect(-4, -4, cssW + 8, cssH + 8);

    g = ctx.createLinearGradient(0, sy(0), 0, sy(G.worldH));
    g.addColorStop(0, '#0c1406');
    g.addColorStop(0.45, '#081008');
    g.addColorStop(1, '#061018');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), G.worldW * L.s, G.worldH * L.s);

    ctx.fillStyle = 'rgba(180,224,24,0.06)';
    ctx.beginPath();
    ctx.ellipse(sx(G.worldW * 0.2), sy(80), 140 * L.s, 50 * L.s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,61,184,0.05)';
    ctx.beginPath();
    ctx.ellipse(sx(G.worldW * 0.72), sy(60), 120 * L.s, 40 * L.s, 0, 0, TAU);
    ctx.fill();

    for (i = 0; i < motes.length; i++) {
      m = motes[i];
      x = m.x + Math.sin(G.clock * m.sp + m.ph) * 10;
      y = m.y + Math.cos(G.clock * m.sp * 0.7 + m.ph) * 6;
      ctx.fillStyle = rgba(LIME, 0.12 + 0.12 * Math.sin(G.clock * 2 + m.ph));
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), m.s * L.s, 0, TAU);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(20, 36, 8, 0.55)';
    ctx.beginPath();
    ctx.moveTo(sx(-20), sy(G.worldH));
    ctx.lineTo(sx(80), sy(G.worldH * 0.62));
    ctx.lineTo(sx(180), sy(G.worldH * 0.72));
    ctx.lineTo(sx(320), sy(G.worldH * 0.55));
    ctx.lineTo(sx(520), sy(G.worldH * 0.7));
    ctx.lineTo(sx(G.worldW + 20), sy(G.worldH * 0.58));
    ctx.lineTo(sx(G.worldW + 20), sy(G.worldH + 20));
    ctx.lineTo(sx(-20), sy(G.worldH + 20));
    ctx.fill();

    if (G.waterY > 0) {
      wy = G.waterY;
      g = ctx.createLinearGradient(0, sy(wy), 0, sy(G.worldH));
      g.addColorStop(0, 'rgba(0, 80, 110, 0.55)');
      g.addColorStop(1, 'rgba(0, 20, 40, 0.85)');
      ctx.fillStyle = g;
      ctx.fillRect(sx(0), sy(wy), G.worldW * L.s, (G.worldH - wy + 20) * L.s);
      ctx.strokeStyle = 'rgba(0,240,255,0.45)';
      ctx.lineWidth = 1.4 * L.s;
      ctx.beginPath();
      for (i = 0; i <= 24; i++) {
        x = (i / 24) * G.worldW;
        y = wy + Math.sin(G.clock * 2.4 + i * 0.5) * 2.4;
        if (i === 0) ctx.moveTo(sx(x), sy(y));
        else ctx.lineTo(sx(x), sy(y));
      }
      ctx.stroke();
    }
  }

  function drawPlat(p) {
    var x = sx(p.x);
    var y = sy(p.y);
    var w = p.w * L.s;
    var h = Math.max(8, p.h * L.s);
    ctx.fillStyle = 'rgba(40, 28, 8, 0.9)';
    ctx.fillRect(x, y, w, h + 6 * L.s);
    ctx.fillStyle = rgba(KIWI, 0.92);
    ctx.fillRect(x, y, w, 5 * L.s);
    ctx.fillStyle = rgba(LIME, 0.55);
    ctx.fillRect(x, y, w, 2 * L.s);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x, y + 5 * L.s, w, 2 * L.s);
  }

  function drawBalloon(b) {
    var rgb, s;
    if (b.popped) return;
    rgb = BALL_RGB[b.c] || MAG;
    s = 1 + Math.sin(b.bob * 2) * 0.04;
    ctx.save();
    ctx.translate(sx(b.x), sy(b.y));
    ctx.scale(L.s * s * (b.sq || 1), L.s * s);
    ctx.strokeStyle = 'rgba(200,220,180,0.55)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(0, 18);
    ctx.stroke();
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 11.5, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(-3, -3.4, 2.6, 3.4, -0.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(20,10,20,0.4)';
    ctx.beginPath();
    ctx.moveTo(-1.6, 10);
    ctx.lineTo(1.6, 10);
    ctx.lineTo(0, 12.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawCraft(c) {
    ctx.save();
    ctx.translate(sx(c.x), sy(c.y));
    ctx.scale(L.s * (c.face || 1), L.s);
    if (c.kind === 'hover') {
      ctx.fillStyle = 'rgba(0,240,255,0.18)';
      ctx.beginPath();
      ctx.ellipse(0, 8, 16, 4, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#1a3a44';
      ctx.beginPath();
      ctx.ellipse(0, 2, 16, 6, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(LIME, 0.8);
      ctx.fillRect(-4, -4, 8, 3);
    } else {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, -2, 20, 9, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.ellipse(-6, -5, 6, 3, -0.3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#2a2410';
      ctx.fillRect(-7, 6, 14, 5);
      ctx.strokeStyle = 'rgba(255,227,107,0.7)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-6, 6);
      ctx.lineTo(-10, -2);
      ctx.moveTo(6, 6);
      ctx.lineTo(10, -2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCage(c) {
    var bob = Math.sin(G.clock * 3 + c.bob) * 1.6;
    ctx.save();
    ctx.translate(sx(c.x), sy(c.y + bob));
    ctx.scale(L.s, L.s);
    if (c.open) {
      ctx.strokeStyle = 'rgba(255,61,184,0.28)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-11, -24, 22, 24);
      ctx.restore();
      return;
    }
    ctx.fillStyle = 'rgba(12,6,12,0.7)';
    ctx.fillRect(-11, -24, 22, 24);
    ctx.strokeStyle = rgba(MAG, 0.95);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-11, -24, 22, 24);
    ctx.beginPath();
    ctx.moveTo(-4, -24);
    ctx.lineTo(-4, 0);
    ctx.moveTo(4, -24);
    ctx.lineTo(4, 0);
    ctx.moveTo(-11, -12);
    ctx.lineTo(11, -12);
    ctx.stroke();
    ctx.fillStyle = rgba(KIWI, 1);
    ctx.beginPath();
    ctx.ellipse(0, -10, 5, 4.2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(4, -10);
    ctx.lineTo(8, -9.2);
    ctx.lineTo(4, -8.6);
    ctx.fill();
    ctx.fillStyle = '#1a1408';
    ctx.beginPath();
    ctx.arc(1.6, -11, 0.8, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawFruit(f) {
    var bob, rgb;
    if (f.got) return;
    bob = Math.sin(G.clock * 3.2 + f.bob) * 2.2;
    rgb = FRUIT_RGB[f.kind] || LIME;
    ctx.save();
    ctx.translate(sx(f.x), sy(f.y + bob));
    ctx.scale(L.s, L.s);
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 5.2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(-1.6, -1.4, 2, 1.5, -0.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = KIWI[0] ? rgba(BRN, 0.9) : '#7a5a20';
    ctx.fillRect(-1, -7, 2, 3);
    ctx.restore();
  }

  function drawExit() {
    var e = G.exit;
    var on, pulse;
    if (!e) return;
    on = e.open;
    pulse = 0.55 + 0.45 * Math.sin(G.clock * 6);
    ctx.save();
    ctx.translate(sx(e.x + e.w * 0.5), sy(e.y + e.h * 0.5));
    ctx.scale(L.s, L.s);
    ctx.fillStyle = on ? rgba(LIME, 0.18 * pulse) : 'rgba(40,50,20,0.35)';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = on ? rgba(LIME, 0.9) : 'rgba(140,160,80,0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-12, -14, 24, 28);
    ctx.fillStyle = on ? rgba(GOLD, 0.9) : 'rgba(80,90,40,0.5)';
    ctx.fillRect(-3, -4, 6, 10);
    if (on) {
      ctx.strokeStyle = rgba(CYN, 0.6 * pulse);
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawKiwi(p, ox, oy, scale, face, sqX, sqY, opts) {
    var wing, blink, beak;
    opts = opts || {};
    ctx.save();
    ctx.translate(sx(p.x + (ox || 0)), sy(p.y + (oy || 0)));
    ctx.scale(L.s * (face || 1), L.s);
    ctx.scale(sqX || 1, sqY || 1);
    if (opts.spin) ctx.rotate(opts.spin);

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 12, 7, 2, 0, 0, TAU);
    ctx.fill();

    wing = opts.hop
      ? -0.7
      : (opts.ground ? Math.sin((opts.walk || 0) * 10) * 0.22 : Math.sin(G.clock * 8) * 0.28);
    ctx.save();
    ctx.translate(-1, 1);
    ctx.rotate(wing);
    ctx.fillStyle = rgba(KIWI, 0.9);
    ctx.beginPath();
    ctx.ellipse(-5, 0, 6.2, 2.2, -0.2, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#6a7a18';
    ctx.beginPath();
    ctx.ellipse(0, 2.4, 7.4, 6.4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(LIME, 0.92);
    ctx.beginPath();
    ctx.ellipse(0.6, 3.2, 4.4, 4.2, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#8aa020';
    ctx.beginPath();
    ctx.arc(1, -5.2, 5.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#c8e050';
    ctx.beginPath();
    ctx.moveTo(-1, -9.4);
    ctx.lineTo(1.4, -13.2);
    ctx.lineTo(3.2, -9);
    ctx.closePath();
    ctx.fill();

    beak = opts.shoot ? 9.4 : 8.2;
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.beginPath();
    ctx.moveTo(4.4, -5.4);
    ctx.lineTo(beak, -4.4);
    ctx.lineTo(4.4, -3.2);
    ctx.closePath();
    ctx.fill();

    blink = ((G.clock + (opts.ph || 0)) * 2) % 5 < 0.12;
    ctx.fillStyle = '#1a1408';
    if (!blink && !opts.dead) {
      ctx.beginPath();
      ctx.ellipse(2.2, -5.6, 1.1, 1.3, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(2.5, -6, 0.35, 0, TAU);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#1a1408';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(1.2, -5.6);
      ctx.lineTo(3.2, -5.6);
      ctx.stroke();
    }

    if (!opts.ride) {
      ctx.strokeStyle = 'rgba(30,40,10,0.85)';
      ctx.lineWidth = 1.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-2.2, 8);
      ctx.lineTo(-3, 12);
      ctx.moveTo(2.4, 8);
      ctx.lineTo(3.2, 12);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlayer() {
    var p = G.player;
    if (!p) return;
    if (p.inv > 0 && !p.dead && ((G.clock * 16) | 0) % 2 === 0) return;
    drawKiwi(p, 0, 0, 1, p.face, p.sqX, p.sqY, {
      hop: p.hopT > 0,
      ground: p.grounded,
      walk: p.walk,
      shoot: p.shootT > 0,
      ride: !!p.ride,
      dead: p.dead,
      spin: p.dead ? Math.min(1.6, p.deadT * 4) : 0,
      ph: 0
    });
  }

  function drawFoe(e) {
    var rgb;
    if (e.dead && e.deadT > 0.8) return;
    rgb = FOE_RGB[e.kind] || MAG;
    ctx.save();
    ctx.translate(sx(e.x), sy(e.y));
    ctx.scale(L.s * (e.face || 1) * (e.sq || 1), L.s * (e.sq || 1));
    if (e.dead) ctx.rotate(Math.min(1.4, e.deadT * 4));
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 11, 7, 2, 0, 0, TAU);
    ctx.fill();
    if (e.kind === 'bird') {
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 4.4, 0, 0, TAU);
      ctx.fill();
      ctx.save();
      ctx.rotate(Math.sin(e.phase * 10) * 0.5);
      ctx.beginPath();
      ctx.ellipse(-2, -2, 7, 2.4, -0.3, 0, TAU);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.moveTo(7, -0.6);
      ctx.lineTo(11, 0);
      ctx.lineTo(7, 0.8);
      ctx.fill();
    } else if (e.kind === 'seal') {
      ctx.fillStyle = rgba(SEAL, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, 2, 11, 5.5, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(8, 0, 4.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#1a2430';
      ctx.beginPath();
      ctx.arc(9.4, -0.6, 0.8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = MAG;
      ctx.beginPath();
      ctx.arc(12, 0.6, 1.1, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(BEAR, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, 2, 8.5, 7, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-5, -6, 2.6, 0, TAU);
      ctx.arc(3, -6.4, 2.6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#f4e0c0';
      ctx.beginPath();
      ctx.ellipse(4, 2, 3.4, 2.8, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#1a1408';
      ctx.beginPath();
      ctx.arc(2.2, -1.2, 0.9, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWhale() {
    var w = G.whale;
    var dir;
    if (!w || w.state === 'hide') return;
    dir = w.tx >= w.sx ? 1 : -1;
    ctx.save();
    ctx.translate(sx(w.x), sy(w.y));
    ctx.scale(L.s * dir, L.s);
    ctx.fillStyle = '#3a1030';
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 12, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = MAG;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(-30, -10);
    ctx.lineTo(-28, 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = CYN;
    ctx.beginPath();
    ctx.arc(10, -3, 3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(10.6, -3.4, 1.1, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawShot(s) {
    ctx.save();
    ctx.translate(sx(s.x), sy(s.y));
    ctx.scale(L.s * (s.face || 1), L.s);
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-6, -2.4);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-6, 2.4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = LIME[0] ? rgba(LIME, 0.8) : '#d4ff32';
    ctx.fillRect(-8, -1.4, 4, 2.8);
    ctx.restore();
  }

  function drawFreed(f) {
    drawKiwi(f, 0, 0, 0.85, f.face, 1, 1, { hop: true, ph: f.t });
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
    for (i = 0; i < feathers.length; i++) {
      o = feathers[i];
      a = o.t / (o.max || 0.6);
      ctx.save();
      ctx.translate(sx(o.x), sy(o.y));
      ctx.rotate(o.rot);
      ctx.fillStyle = rgba(o.rgb, 0.2 + 0.7 * a);
      ctx.beginPath();
      ctx.ellipse(0, 0, o.w * L.s * 0.5, o.h * L.s * 0.5, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
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
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, 0.12 * (G.flash / 0.12));
    ctx.fillRect(0, 0, cssW, cssH);
  }

  function drawLetterbox() {
    ctx.fillStyle = '#040802';
    if (L.x > 0) {
      ctx.fillRect(0, 0, L.x, cssH);
      ctx.fillRect(cssW - L.x, 0, L.x + 2, cssH);
    }
    if (L.y > 0) {
      ctx.fillRect(0, 0, cssW, L.y);
      ctx.fillRect(0, cssH - L.y, cssW, L.y + 2);
    }
    ctx.strokeStyle = 'rgba(212,255,50,0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(L.x + 1, L.y + 1, VIEW_W * L.s - 2, VIEW_H * L.s - 2);
  }

  function draw() {
    var i, shx, shy;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    shx = G.kickX + (G.shake > 0 ? rand(-3, 3) * G.shake : 0);
    shy = G.kickY + (G.shake > 0 ? rand(-2, 2) * G.shake : 0);
    ctx.translate(shx, shy);

    drawBg();
    for (i = 0; i < G.plats.length; i++) drawPlat(G.plats[i]);
    drawExit();
    for (i = 0; i < G.fruits.length; i++) drawFruit(G.fruits[i]);
    for (i = 0; i < G.cages.length; i++) drawCage(G.cages[i]);
    for (i = 0; i < G.balloons.length; i++) drawBalloon(G.balloons[i]);
    for (i = 0; i < G.crafts.length; i++) drawCraft(G.crafts[i]);
    for (i = 0; i < G.foes.length; i++) drawFoe(G.foes[i]);
    for (i = 0; i < G.freed.length; i++) drawFreed(G.freed[i]);
    drawWhale();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);
    drawPlayer();
    drawFx();
    drawFlash();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawLetterbox();
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

  holdBtn(btnLeft, function () { pad.l = true; audio.ensure(); }, function () { pad.l = false; });
  holdBtn(btnRight, function () { pad.r = true; audio.ensure(); }, function () { pad.r = false; });
  holdBtn(btnJump, function () {
    pad.hop = true;
    pad.hopHeld = true;
    audio.ensure();
  }, function () { pad.hopHeld = false; });
  holdBtn(btnShot, function () {
    pad.shot = true;
    audio.ensure();
  }, function () { });

  canvas.addEventListener('pointerdown', function (ev) {
    if (ev.button != null && ev.button !== 0) return;
    if (G.mode !== 'play') return;
    keys.shot = true;
    audio.ensure();
    if (ev.cancelable) ev.preventDefault();
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  function keyOn(e, down) {
    var k = e.code;
    if (k === 'ArrowLeft' || k === 'KeyA') { keys.l = down; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { keys.r = down; e.preventDefault(); }
    else if (k === 'ArrowUp' || k === 'KeyW') {
      if (down && !e.repeat) keys.hop = true;
      keys.hopHeld = down;
      e.preventDefault();
    } else if (k === 'Space') {
      if (down && !e.repeat && G.mode === 'play') keys.shot = true;
      e.preventDefault();
    } else if (k === 'ArrowDown' || k === 'KeyS') {
      keys.d = down;
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
        startRun('save');
        e.preventDefault();
        return;
      }
      if (e.code === 'Digit2') {
        startRun('chase');
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
  btnSave.addEventListener('click', function () {
    audio.ensure();
    startRun('save');
  });
  btnChase.addEventListener('click', function () {
    audio.ensure();
    startRun('chase');
  });
  ovRetry.addEventListener('click', function () {
    audio.ensure();
    startRun(G.kind);
  });
  ovMenu.addEventListener('click', function () {
    audio.ensure();
    audio.ui();
    hintEl.classList.remove('warn', 'hot');
    showTitle();
  });

  function resize() {
    var s;
    cssW = canvas.clientWidth;
    cssH = canvas.clientHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, cssW * dpr);
    canvas.height = Math.max(1, cssH * dpr);
    s = Math.min(cssW / VIEW_W, cssH / VIEW_H);
    L.s = s;
    L.x = (cssW - VIEW_W * s) / 2;
    L.y = (cssH - VIEW_H * s) / 2;
  }

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

  bestEl.textContent = String(G.best);
  showTitle();
  resize();
  hudPlay();
  requestAnimationFrame(frame);
})();
