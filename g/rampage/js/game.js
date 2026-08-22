'use strict';

/* 狂砸 — Rampage remake. Smash buildings floor by floor. No CDN. */

(function () {
  var WORLD_W = 640;
  var WORLD_H = 400;
  var GROUND = 352;
  var FH = 28;
  var LIVES = 3;
  var MAX_HP = 100;
  var EAT_HP = 22;
  var PW = 30;
  var PH = 52;
  var WALK = 156;
  var CLIMB = 132;
  var LEAP = 210;
  var GRAV = 1180;
  var MAX_FALL = 640;
  var PUNCH_T = 0.22;
  var PUNCH_HIT = 0.072;
  var GRAB = 18;
  var FALL_KILL = 58;
  var INVULN = 1.14;
  var DIE_T = 0.7;
  var COMBO_WIN = 1.4;
  var STEP = 1 / 60;
  var TAU = Math.PI * 2;
  var BEST_KEY = 'playbox-rampage-best';
  var MUTE_KEY = 'playbox-rampage-mute';
  var OPS = '方向键或 WASD 走爬 · 空格砸 · 触屏左下上右砸 · R 重开 · M 静音';

  var MAG = [255, 61, 184];
  var CYN = [0, 240, 255];
  var GOLD = [255, 227, 107];
  var HOT = [255, 106, 40];
  var HOT2 = [255, 138, 74];
  var WHT = [246, 243, 255];
  var FUR = [196, 108, 42];
  var FUR2 = [232, 140, 64];
  var SKIN = [232, 176, 128];
  var BRICK = [22, 28, 48];

  var CITY_NAMES = ['夜城', '港湾', '钢区', '霓虹', '末都'];
  var SIGNS = ['夜', '酒', 'BAR', '开', 'HOT', '砸'];
  var FLOOR_BASE = [5, 7, 6, 8, 5];

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
  function makeRng(seed) {
    var a = seed | 0;
    return function () {
      a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function comboMul(n) {
    return 1 + Math.min(5, Math.max(0, (n | 0) - 1)) * 0.5;
  }
  function armyMul(kind, round) {
    var m = 1 + Math.max(0, round - 1) * 0.2;
    if (kind === 'rage') m *= 1.7;
    return m;
  }
  function buildingCount(round) {
    return round <= 1 ? 4 : 5;
  }
  function floorCountFor(round, i) {
    var h = FLOOR_BASE[i % FLOOR_BASE.length] + Math.max(0, round - 1);
    return h > 9 ? 9 : h;
  }
  function floorHpFor(fi, round) {
    var hp = fi < 2 ? 3 : 2;
    if (round >= 3) hp += 1;
    return hp;
  }
  function cityName(round) {
    return CITY_NAMES[((round - 1) % CITY_NAMES.length + CITY_NAMES.length) % CITY_NAMES.length];
  }
  function projSpd(kind, round) {
    return (kind === 'rage' ? 1.32 : 1) * (1 + Math.max(0, round - 1) * 0.08);
  }
  function spawnSoldierT(kind, round) {
    var t = 3.4 / armyMul(kind, round);
    return t < 1.15 ? 1.15 : t;
  }
  function spawnHeliT(kind, round) {
    var t = 7.6 / armyMul(kind, round);
    return t < 2.4 ? 2.4 : t;
  }
  function spawnTankT(kind, round) {
    var t = 12.4 / armyMul(kind, round);
    return t < 4.2 ? 4.2 : t;
  }
  function maxSoldiers(kind) {
    return kind === 'rage' ? 6 : 4;
  }
  function maxHelis(kind) {
    return kind === 'rage' ? 3 : 2;
  }
  function maxTanks(kind) {
    return kind === 'rage' ? 2 : 1;
  }
  function roofY(b) {
    return GROUND - b.n * FH;
  }
  function floorTop(fi) {
    return GROUND - (fi + 1) * FH;
  }
  function floorBot(fi) {
    return GROUND - fi * FH;
  }
  function floorsLeft(b) {
    var n = 0, i;
    if (!b || !b.floors) return 0;
    for (i = 0; i < b.floors.length; i++) if (!b.floors[i].gone) n++;
    return n;
  }
  function shouldCollapse(b) {
    return !!(b && !b.dead && !b.collapsing && floorsLeft(b) <= 0);
  }
  function smashFloor(b, fi, dmg) {
    if (!b || b.dead || b.collapsing) return '';
    if (fi < 0 || fi >= b.floors.length) return '';
    var fl = b.floors[fi];
    if (fl.gone) return '';
    fl.hp -= dmg || 1;
    fl.crack = 1;
    if (fl.hp <= 0) {
      fl.hp = 0;
      fl.gone = true;
      return 'break';
    }
    return 'hit';
  }
  function circRect(cx, cy, r, x, y, w, h) {
    var nx = clamp(cx, x, x + w);
    var ny = clamp(cy, y, y + h);
    var dx = cx - nx;
    var dy = cy - ny;
    return dx * dx + dy * dy <= r * r;
  }
  function floorAtChest(b, y) {
    var chest = y - PH * 0.46;
    var fi = Math.floor((GROUND - chest) / FH);
    if (fi < 0) return 0;
    if (fi >= b.n) return b.n - 1;
    return fi;
  }

  function makeFloor(fi, round, rng) {
    var hp = floorHpFor(fi, round);
    return {
      hp: hp,
      max: hp,
      gone: false,
      crack: 0,
      civ: rng() < (fi === 0 ? 0.18 : 0.34),
      glow: rng(),
      flicker: rng() * TAU
    };
  }

  function makeBuilding(x, w, n, round, rng) {
    var floors = [];
    var i;
    for (i = 0; i < n; i++) floors.push(makeFloor(i, round, rng));
    return {
      x: x,
      w: w,
      n: n,
      floors: floors,
      collapsing: false,
      fall: 0,
      dead: false,
      lean: 0,
      shake: 0,
      hue: rng(),
      sign: SIGNS[(rng() * SIGNS.length) | 0],
      signSide: rng() < 0.5 ? -1 : 1,
      smoke: 0
    };
  }

  function layoutCity(round, seed) {
    var rng = makeRng(seed || (round * 97 + 11));
    var n = buildingCount(round);
    var gap = n >= 5 ? 30 : 36;
    var margin = 22;
    var avail = WORLD_W - margin * 2 - gap * (n - 1);
    var w = Math.floor(avail / n);
    if (w > 94) w = 94;
    if (w < 58) w = 58;
    var total = n * w + (n - 1) * gap;
    var x0 = (WORLD_W - total) / 2;
    var list = [];
    var i;
    for (i = 0; i < n; i++) {
      list.push(makeBuilding(x0 + i * (w + gap), w, floorCountFor(round, i), round, rng));
    }
    return list;
  }

  function makePlayer() {
    return {
      x: 86,
      y: GROUND,
      vx: 0,
      vy: 0,
      face: 1,
      w: PW,
      h: PH,
      state: 'walk',
      climbB: -1,
      climbSide: -1,
      punchT: 0,
      punchHit: false,
      hp: MAX_HP,
      inv: 0,
      dieT: 0,
      eatT: 0,
      bob: 0,
      fallFrom: GROUND,
      squish: 0,
      noGrab: 0
    };
  }

  function selfCheck() {
    var b, city, p;
    if (comboMul(1) !== 1) throw new Error('combo1');
    if (comboMul(2) !== 1.5) throw new Error('combo2');
    if (comboMul(7) !== 3.5) throw new Error('combo cap');
    if (armyMul('rage', 1) <= armyMul('cities', 1)) throw new Error('rage faster');
    if (armyMul('cities', 3) <= armyMul('cities', 1)) throw new Error('round army');
    if (spawnSoldierT('rage', 1) >= spawnSoldierT('cities', 1)) throw new Error('rage spawn');
    if (projSpd('rage', 1) <= projSpd('cities', 1)) throw new Error('rage proj');
    if (buildingCount(1) !== 4 || buildingCount(2) !== 5) throw new Error('bldg n');
    if (floorCountFor(1, 0) !== 5) throw new Error('h0');
    if (floorCountFor(1, 1) !== 7) throw new Error('h1');
    if (floorCountFor(9, 1) !== 9) throw new Error('hcap');
    if (floorHpFor(0, 1) !== 3 || floorHpFor(3, 1) !== 2) throw new Error('hp floor');
    if (floorHpFor(0, 3) <= floorHpFor(0, 1)) throw new Error('hp round');
    if (cityName(1) !== '夜城' || cityName(6) !== '夜城') throw new Error('city name');
    if (Math.abs(floorTop(0) + FH - GROUND) > 0.01) throw new Error('floor0');
    if (roofY({ n: 5 }) !== GROUND - 5 * FH) throw new Error('roof');
    city = layoutCity(1, 198);
    if (city.length !== 4) throw new Error('city1 n');
    if (city[0].n !== 5) throw new Error('city1 h');
    b = city[1];
    if (floorsLeft(b) !== b.n) throw new Error('left full');
    if (smashFloor(b, 0, 1) !== 'hit') throw new Error('hit');
    smashFloor(b, 0, 9);
    if (!b.floors[0].gone) throw new Error('gone');
    if (shouldCollapse(b)) throw new Error('not yet');
    var i;
    for (i = 0; i < b.n; i++) smashFloor(b, i, 9);
    if (!shouldCollapse(b)) throw new Error('collapse');
    if (smashFloor(b, 0, 1) !== '') throw new Error('smashed gone');
    p = makePlayer();
    if (p.y !== GROUND || p.hp !== MAX_HP) throw new Error('spawn');
    if (circRect(10, 10, 5, 8, 8, 10, 10) !== true) throw new Error('circ in');
    if (circRect(0, 0, 3, 20, 20, 4, 4) !== false) throw new Error('circ out');
    if (maxHelis('rage') <= maxHelis('cities')) throw new Error('heli cap');
    if (EAT_HP < 10) throw new Error('eat');
    if (FALL_KILL < FH * 2) throw new Error('fall kill');
    if (LIVES !== 3) throw new Error('lives');
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
  var btnCities = document.getElementById('btn-cities');
  var btnRage = document.getElementById('btn-rage');
  var btnMute = document.getElementById('btn-mute');
  var btnRetry = document.getElementById('btn-retry');
  var btnLeft = document.getElementById('btn-left');
  var btnRight = document.getElementById('btn-right');
  var btnUp = document.getElementById('btn-up');
  var btnDown = document.getElementById('btn-down');
  var btnPunch = document.getElementById('btn-punch');
  var scoreEl = document.getElementById('score');
  var roundEl = document.getElementById('round');
  var bestEl = document.getElementById('best');
  var comboEl = document.getElementById('combo');
  var comboBox = document.getElementById('combo-box');
  var scoreBox = document.getElementById('score-box');
  var scoreAdd = document.getElementById('score-add');
  var modeLabel = document.getElementById('mode-label');
  var cityLabel = document.getElementById('city-label');
  var hpBar = document.getElementById('hp-bar');
  var pipsEl = document.getElementById('pips');
  var toastEl = document.getElementById('toast');
  var hintEl = document.getElementById('hint');
  var chainPop = document.getElementById('chain-pop');
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
  var chainTok = 0;

  var particles = [];
  var sparks = [];
  var floats = [];
  var rings = [];
  var stars = [];
  var smoke = [];

  var keys = { l: false, r: false, u: false, d: false };

  var G = {
    mode: 'title',
    kind: 'cities',
    round: 1,
    clock: 0,
    lives: LIVES,
    score: 0,
    bestC: 0,
    bestR: 0,
    combo: 0,
    maxCombo: 0,
    comboAge: 0,
    city: [],
    player: makePlayer(),
    soldiers: [],
    helis: [],
    tanks: [],
    civs: [],
    shots: [],
    spawnS: 1.2,
    spawnH: 4,
    spawnT: 6,
    spawnC: 2.4,
    stop: 0,
    shake: 0,
    kickX: 0,
    kickY: 0,
    flash: 0,
    flashRgb: HOT,
    lock: 0,
    why: '',
    pendingCity: false,
    seed: 198
  };

  function reduceMotion() {
    return motionQ.matches;
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
        var buf = this.ctx.createBuffer(1, (sr * 0.5) | 0, sr);
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
    swing: function () {
      this.ensure();
      this.noise(0.07, 0.08, 1100, 'highpass');
      this.beep(160, 0.05, 'sawtooth', 0.03, 70);
    },
    smash: function (combo) {
      this.ensure();
      var p = 1 + Math.min(6, combo) * 0.06;
      this.noise(0.14, 0.18, 180, 'lowpass');
      this.beep(140 * p, 0.11, 'square', 0.09, 52);
      this.beep((620 * p), 0.07, 'triangle', 0.045, 280);
    },
    brk: function (combo) {
      this.ensure();
      var p = 1 + Math.min(6, combo) * 0.05;
      this.noise(0.2, 0.22, 240, 'lowpass');
      this.beep(110 * p, 0.16, 'sawtooth', 0.08, 48);
      this.beep(880 * p, 0.08, 'square', 0.04, 420);
    },
    collapse: function () {
      this.ensure();
      this.noise(0.46, 0.28, 90, 'lowpass');
      this.beep(70, 0.42, 'sine', 0.08, 36);
      this.beep(48, 0.3, 'sawtooth', 0.05, 28);
    },
    eat: function () {
      this.ensure();
      this.noise(0.1, 0.1, 420, 'bandpass');
      this.beep(220, 0.08, 'square', 0.05, 90);
      this.beep(140, 0.1, 'sawtooth', 0.04, 70);
    },
    hurt: function () {
      this.ensure();
      this.noise(0.16, 0.16, 220, 'lowpass');
      this.beep(280, 0.18, 'sawtooth', 0.06, 70);
    },
    shot: function () {
      this.ensure();
      this.beep(920, 0.05, 'square', 0.035, 420);
      this.noise(0.05, 0.06, 1800, 'highpass');
    },
    rocket: function () {
      this.ensure();
      this.noise(0.16, 0.1, 500, 'bandpass');
      this.beep(240, 0.14, 'sawtooth', 0.03, 80);
    },
    boom: function () {
      this.ensure();
      this.noise(0.2, 0.18, 160, 'lowpass');
      this.beep(90, 0.16, 'sine', 0.06, 40);
    },
    combo: function (n) {
      this.ensure();
      this.beep(440 + n * 48, 0.08, 'square', 0.05, 880 + n * 40);
    },
    start: function () {
      this.ensure();
      this.beep(196, 0.08, 'square', 0.04, 330);
      this.beep(330, 0.1, 'triangle', 0.045, 523);
    },
    city: function () {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.05, 523);
      this.beep(523, 0.1, 'square', 0.05, 659);
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
    grab: function () {
      this.ensure();
      this.beep(180, 0.04, 'triangle', 0.03, 140);
    },
    punchAir: function () {
      this.ensure();
      this.noise(0.05, 0.05, 1400, 'highpass');
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function loadBest() {
    try {
      var raw = localStorage.getItem(BEST_KEY);
      var o = raw ? JSON.parse(raw) : null;
      if (o && typeof o === 'object') {
        G.bestC = o.c | 0;
        G.bestR = o.r | 0;
      }
    } catch (e) { /* ignore */ }
  }
  function currentBest() {
    return G.kind === 'rage' ? G.bestR : G.bestC;
  }
  function persistBest() {
    if (G.kind === 'rage') {
      if (G.score > G.bestR) G.bestR = G.score;
    } else if (G.score > G.bestC) G.bestC = G.score;
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ c: G.bestC, r: G.bestR }));
    } catch (e) { /* ignore */ }
  }
  loadBest();

  (function makeStars() {
    var i;
    for (i = 0; i < 46; i++) {
      stars.push({
        x: rand(8, WORLD_W - 8),
        y: rand(8, 210),
        r: rand(0.6, 1.7),
        a: rand(0.25, 0.9),
        p: rand(0, TAU)
      });
    }
  })();

  /* ---- fx ---- */
  function hitStop(t) {
    if (reduceMotion()) return;
    if (t > G.stop) G.stop = t;
  }
  function shake(n) {
    if (reduceMotion()) return;
    G.shake = Math.max(G.shake, n);
  }
  function kickStage(cls) {
    if (reduceMotion()) return;
    stageEl.classList.remove('die', 'hop', 'smash', 'clear');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls || 'smash');
    clearTimeout(kickTok);
    kickTok = setTimeout(function () {
      stageEl.classList.remove('die', 'hop', 'smash', 'clear');
    }, 340);
  }
  function flash(rgb, t) {
    G.flashRgb = rgb;
    G.flash = t;
  }
  function burst(x, y, n, rgb, spd, life, grav) {
    var i, cap, a;
    cap = 200 - particles.length;
    if (n > cap) n = cap < 0 ? 0 : cap;
    if (reduceMotion()) n = Math.min(n, 8);
    for (i = 0; i < n; i++) {
      a = rand(0, TAU);
      particles.push({
        x: x + rand(-4, 4),
        y: y + rand(-4, 4),
        vx: Math.cos(a) * rand(spd * 0.3, spd),
        vy: Math.sin(a) * rand(spd * 0.3, spd) - rand(20, 80),
        life: rand(life * 0.55, life),
        max: life,
        r: rand(1.4, 3.6),
        rgb: rgb,
        rot: rand(0, TAU),
        vr: rand(-8, 8),
        g: grav == null ? 420 : grav,
        rect: Math.random() < 0.55
      });
    }
  }
  function rubble(x, y, n) {
    var cols = [HOT, HOT2, [90, 70, 58], [48, 42, 40], GOLD, [160, 90, 50]];
    var i, cap, a, c;
    cap = 200 - particles.length;
    if (n > cap) n = cap < 0 ? 0 : cap;
    if (reduceMotion()) n = Math.min(n, 10);
    for (i = 0; i < n; i++) {
      a = rand(-2.6, -0.5);
      c = cols[(Math.random() * cols.length) | 0];
      particles.push({
        x: x + rand(-10, 10),
        y: y + rand(-6, 6),
        vx: rand(-90, 90),
        vy: Math.sin(a) * rand(80, 220),
        life: rand(0.45, 0.9),
        max: 0.9,
        r: rand(2.2, 5.4),
        rgb: c,
        rot: rand(0, TAU),
        vr: rand(-10, 10),
        g: 780,
        rect: true
      });
    }
  }
  function sparkAt(x, y, rgb) {
    if (sparks.length > 40) return;
    sparks.push({ x: x, y: y, life: 0.18, rgb: rgb || GOLD, r: rand(8, 16) });
  }
  function ringAt(x, y, rgb) {
    if (rings.length > 12) return;
    rings.push({ x: x, y: y, life: 0.32, max: 0.32, rgb: rgb || CYN, r: 8 });
  }
  function floatText(x, y, text, rgb) {
    if (floats.length > 22) floats.shift();
    floats.push({ x: x, y: y, text: text, rgb: rgb || GOLD, life: 0.72 });
  }
  function puff(x, y, n) {
    var i;
    if (smoke.length > 50) return;
    if (reduceMotion()) n = Math.min(n, 3);
    for (i = 0; i < n; i++) {
      smoke.push({
        x: x + rand(-8, 8),
        y: y + rand(-4, 4),
        vx: rand(-18, 18),
        vy: rand(-40, -12),
        life: rand(0.4, 0.9),
        r: rand(4, 10),
        a: rand(0.2, 0.45)
      });
    }
  }

  function tickFx(dt) {
    var i, o;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.kickX) G.kickX *= 0.72;
    if (G.kickY) G.kickY *= 0.72;
    if (Math.abs(G.kickX) < 0.05) G.kickX = 0;
    if (Math.abs(G.kickY) < 0.05) G.kickY = 0;
    if (G.flash > 0) G.flash -= dt;
    for (i = particles.length - 1; i >= 0; i--) {
      o = particles[i];
      o.life -= dt;
      o.vy += o.g * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.rot += o.vr * dt;
      if (o.life <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      sparks[i].life -= dt;
      if (sparks[i].life <= 0) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      o = rings[i];
      o.life -= dt;
      o.r += 90 * dt;
      if (o.life <= 0) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      o = floats[i];
      o.life -= dt;
      o.y -= 28 * dt;
      if (o.life <= 0) floats.splice(i, 1);
    }
    for (i = smoke.length - 1; i >= 0; i--) {
      o = smoke[i];
      o.life -= dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.r += 8 * dt;
      if (o.life <= 0) smoke.splice(i, 1);
    }
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
    chainPop.textContent = '×' + n;
    chainPop.classList.add('hidden');
    void chainPop.offsetWidth;
    chainPop.classList.remove('hidden');
    clearTimeout(chainTok);
    chainTok = setTimeout(function () { chainPop.classList.add('hidden'); }, 700);
  }

  function flashScore(n) {
    scoreAdd.textContent = '+' + n;
    scoreAdd.hidden = false;
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
    if (n <= 0) return;
    n = Math.round(n);
    G.score += n;
    flashScore(n);
    persistBest();
    hudPlay();
    if (x != null) floatText(x, y - 16, label || ('+' + n), GOLD);
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboAge = COMBO_WIN;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    comboEl.textContent = '×' + Math.max(1, G.combo);
    if (G.combo >= 2) {
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
    }
    if (G.combo === 3 || G.combo === 6 || G.combo === 10) {
      audio.combo(G.combo);
      showChain(G.combo);
      toast(G.combo >= 10 ? '狂砸 ×' + G.combo : '连砸 ×' + G.combo, false, true);
    }
  }

  function breakCombo() {
    G.combo = 0;
    G.comboAge = 0;
    comboEl.textContent = '×1';
    comboBox.classList.remove('hot');
  }

  function renderPips() {
    var html = '';
    var i;
    for (i = 0; i < LIVES; i++) {
      html += '<i class="pip ' + (i < G.lives ? 'on' : 'gone') + '"></i>';
    }
    pipsEl.innerHTML = html;
  }

  function syncHp() {
    var p = clamp(G.player.hp / MAX_HP, 0, 1);
    hpBar.style.transform = 'scaleX(' + p + ')';
    hpBar.classList.toggle('low', p < 0.34);
  }

  function hudPlay() {
    scoreEl.textContent = String(G.score);
    roundEl.textContent = String(G.round);
    bestEl.textContent = String(currentBest());
    comboEl.textContent = '×' + Math.max(1, G.combo);
    modeLabel.textContent = G.kind === 'rage' ? '狂怒' : '砸楼';
    modeLabel.classList.toggle('rage', G.kind === 'rage');
    cityLabel.textContent = cityName(G.round);
    renderPips();
    syncHp();
    if (G.mode === 'play') {
      hintEl.textContent = G.kind === 'rage'
        ? '狂怒 · 军队更快 · 砸楼吃人 · 躲开火箭'
        : '爬楼砸层 · 吃人回血 · 躲开炮弹 · 整栋塌完进下一城';
      hintEl.classList.toggle('warn', G.kind === 'rage');
    }
  }

  function resetFx() {
    particles.length = 0;
    sparks.length = 0;
    floats.length = 0;
    rings.length = 0;
    smoke.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.kickX = 0;
    G.kickY = 0;
    G.flash = 0;
  }

  function resetCity(attract) {
    G.seed = (G.round * 97 + (G.kind === 'rage' ? 13 : 11) + G.round * 3) | 0;
    G.city = layoutCity(G.round, G.seed);
    G.soldiers = [];
    G.helis = [];
    G.tanks = [];
    G.civs = [];
    G.shots = [];
    G.spawnS = attract ? 2 : spawnSoldierT(G.kind, G.round) * 0.45;
    G.spawnH = attract ? 5 : spawnHeliT(G.kind, G.round) * 0.55;
    G.spawnT = attract ? 8 : spawnTankT(G.kind, G.round) * 0.7;
    G.spawnC = 1.6;
    G.pendingCity = false;
    if (!attract) resetFx();
  }

  function showTitle() {
    G.mode = 'title';
    G.kind = 'cities';
    G.round = 1;
    overlayEl.classList.remove('hidden');
    overlayEl.setAttribute('aria-hidden', 'false');
    panelEl.className = 'panel';
    ovKicker.textContent = 'RAMP';
    ovTitle.textContent = '狂砸';
    ovLead.textContent = '化身巨兽攀城砸楼。一层一层打到整栋塌。吞人回血，躲开子弹火箭坦克。整城砸平进下一座。';
    ovOps.textContent = OPS;
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    hintEl.textContent = '爬楼砸层 · 吃人回血 · 躲开炮弹 · 整栋塌完进下一城';
    hintEl.classList.remove('warn', 'hot');
    resetCity(true);
    G.player = makePlayer();
    hudPlay();
  }

  function whyText(w) {
    if (w === 'fall') return '摔下去了';
    if (w === 'hp') return '体力耗尽';
    if (w === 'shot') return '被打下来了';
    return '';
  }

  function showOver() {
    G.mode = 'over';
    persistBest();
    overlayEl.classList.remove('hidden');
    overlayEl.setAttribute('aria-hidden', 'false');
    panelEl.className = 'panel lose';
    ovKicker.textContent = 'RAMP';
    ovTitle.textContent = '命尽';
    ovLead.textContent = cityName(G.round) + ' · 第 ' + G.round + ' 城 · ' + G.score + ' 分 · 连砸最高 ×' + G.maxCombo +
      (G.why ? ' · ' + whyText(G.why) : '');
    ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
    ovStart.classList.add('gone');
    ovEnd.classList.remove('gone');
    audio.over();
    try { ovRetry.focus(); } catch (e) { /* ignore */ }
  }

  function startRun(kind) {
    G.kind = kind === 'rage' ? 'rage' : 'cities';
    G.mode = 'play';
    G.clock = 0;
    G.round = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboAge = 0;
    G.why = '';
    G.lock = 0;
    G.player = makePlayer();
    G.player.inv = 0.4;
    resetCity(false);
    overlayEl.classList.add('hidden');
    overlayEl.setAttribute('aria-hidden', 'true');
    panelEl.className = 'panel';
    audio.start();
    hudPlay();
    toast(G.kind === 'rage' ? '狂怒 · ' + cityName(1) : cityName(1), G.kind === 'rage', G.kind !== 'rage');
    try { canvas.focus({ preventScroll: true }); } catch (e) { canvas.focus(); }
  }

  function retry() {
    audio.ui();
    if (G.mode === 'title') startRun('cities');
    else startRun(G.kind);
  }

  function liveBuildings() {
    var n = 0, i;
    for (i = 0; i < G.city.length; i++) if (!G.city[i].dead) n++;
    return n;
  }

  function nextCity() {
    G.round += 1;
    persistBest();
    G.player = makePlayer();
    G.player.inv = 0.55;
    G.player.hp = Math.max(G.player.hp, 64);
    resetCity(false);
    G.lock = 0;
    hudPlay();
    toast(cityName(G.round), false, true);
    audio.city();
    kickStage('clear');
  }

  /* ---- punch / combat ---- */
  function punchBox(p) {
    var u = p.punchT > 0 ? 1 - p.punchT / PUNCH_T : 0;
    var reach = 20 + 16 * Math.sin(u * Math.PI);
    return {
      x: p.x + p.face * (p.w * 0.28 + reach),
      y: p.y - p.h * 0.52,
      r: 22
    };
  }

  function beginPunch() {
    var p = G.player;
    if (G.mode !== 'play') return;
    if (p.state === 'dead') return;
    if (p.punchT > 0.04) return;
    p.punchT = PUNCH_T;
    p.punchHit = false;
    p.squish = 0.12;
    audio.swing();
  }

  function eatAt(x, y) {
    var p = G.player;
    p.hp = Math.min(MAX_HP, p.hp + EAT_HP);
    p.eatT = 0.22;
    bumpCombo();
    addScore(200 * comboMul(G.combo), x, y, '吞');
    audio.eat();
    hitStop(0.04);
    burst(x, y, 10, MAG, 90, 0.32, 80);
    ringAt(x, y, MAG);
    sparkAt(x, y, GOLD);
    syncHp();
    toast('回血', false, true);
  }

  function beginCollapse(b) {
    var i, fl, cx, cy;
    if (b.collapsing || b.dead) return;
    b.collapsing = true;
    b.fall = 0;
    b.shake = 1;
    audio.collapse();
    hitStop(0.08);
    shake(14);
    kickStage('die');
    flash(HOT, 0.16);
    addScore(600 + 80 * b.n, b.x + b.w * 0.5, roofY(b) + 20, '塌');
    toast('楼塌了', false, true);
    for (i = 0; i < b.n; i++) {
      fl = b.floors[i];
      cx = b.x + b.w * 0.5 + rand(-b.w * 0.2, b.w * 0.2);
      cy = floorTop(i) + FH * 0.5;
      rubble(cx, cy, 8);
      if (fl.civ) {
        G.civs.push(makeCiv(cx, cy, rand(-40, 40), true));
        fl.civ = false;
      }
    }
    puff(b.x + b.w * 0.5, GROUND - 10, 8);
    var p = G.player;
    if ((p.state === 'climb' && p.climbB >= 0 && G.city[p.climbB] === b) ||
        (p.state === 'roof' && p.x > b.x - 8 && p.x < b.x + b.w + 8 && p.y <= roofY(b) + 12)) {
      p.state = 'fall';
      p.climbB = -1;
      p.fallFrom = p.y;
      p.vy = -40;
      p.vx = (p.x < b.x + b.w * 0.5 ? -1 : 1) * 80;
    }
  }

  function resolvePunch() {
    var p = G.player;
    var box = punchBox(p);
    var hit = false;
    var i, j, b, fi, fl, best, bestD, d, s, h, t, sh, civ, ate;

    best = -1;
    bestD = 1e9;
    for (i = 0; i < G.city.length; i++) {
      b = G.city[i];
      if (b.dead || b.collapsing) continue;
      for (j = 0; j < b.n; j++) {
        fl = b.floors[j];
        if (fl.gone) continue;
        if (!circRect(box.x, box.y, box.r + 4, b.x, floorTop(j), b.w, FH)) continue;
        d = hypot(box.x - (b.x + b.w * 0.5), box.y - (floorTop(j) + FH * 0.5));
        if (d < bestD) {
          bestD = d;
          best = i;
          fi = j;
        }
      }
    }
    if (best >= 0) {
      b = G.city[best];
      fl = b.floors[fi];
      ate = fl.civ;
      var res = smashFloor(b, fi, 1);
      if (res) {
        hit = true;
        bumpCombo();
        b.shake = 0.28;
        b.smoke = Math.min(1, b.smoke + 0.12);
        var cx = b.x + b.w * 0.5;
        var cy = floorTop(fi) + FH * 0.5;
        G.kickX = -p.face * 3;
        G.kickY = 2;
        if (res === 'break') {
          audio.brk(G.combo);
          hitStop(0.07);
          shake(8);
          kickStage('smash');
          rubble(cx, cy, 16);
          puff(cx, cy, 5);
          ringAt(cx, cy, HOT);
          addScore(120 * comboMul(G.combo), cx, cy, '碎');
          if (ate) eatAt(cx, cy);
          fl.civ = false;
          if (shouldCollapse(b)) beginCollapse(b);
        } else {
          audio.smash(G.combo);
          hitStop(0.048);
          shake(5);
          kickStage('hop');
          rubble(cx, cy, 8);
          sparkAt(box.x, box.y, GOLD);
          addScore(40 * comboMul(G.combo), cx, cy);
          if (ate && Math.random() < 0.45) {
            fl.civ = false;
            eatAt(cx, cy);
          }
        }
        flash(HOT, 0.06);
      }
    }

    for (i = G.civs.length - 1; i >= 0; i--) {
      civ = G.civs[i];
      if (civ.dead) continue;
      if (hypot(box.x - civ.x, box.y - (civ.y - 8)) < box.r + 10) {
        civ.dead = true;
        eatAt(civ.x, civ.y);
        hit = true;
      }
    }

    for (i = G.soldiers.length - 1; i >= 0; i--) {
      s = G.soldiers[i];
      if (s.dead) continue;
      if (hypot(box.x - s.x, box.y - (s.y - 10)) < box.r + 12) {
        s.dead = true;
        hit = true;
        bumpCombo();
        addScore(80 * comboMul(G.combo), s.x, s.y, '兵');
        burst(s.x, s.y - 8, 10, CYN, 110, 0.3, 60);
        audio.boom();
        hitStop(0.04);
      }
    }
    for (i = G.helis.length - 1; i >= 0; i--) {
      h = G.helis[i];
      if (h.dead) continue;
      if (hypot(box.x - h.x, box.y - h.y) < box.r + 22) {
        h.hp -= 1;
        hit = true;
        sparkAt(h.x, h.y, CYN);
        burst(h.x, h.y, 8, CYN, 90, 0.28, 40);
        audio.smash(G.combo);
        hitStop(0.045);
        if (h.hp <= 0) {
          h.dead = true;
          bumpCombo();
          addScore(320 * comboMul(G.combo), h.x, h.y, '机');
          burst(h.x, h.y, 18, GOLD, 140, 0.4, 80);
          audio.boom();
          shake(6);
        }
      }
    }
    for (i = G.tanks.length - 1; i >= 0; i--) {
      t = G.tanks[i];
      if (t.dead) continue;
      if (circRect(box.x, box.y, box.r, t.x - 18, t.y - 16, 36, 16)) {
        t.hp -= 1;
        hit = true;
        rubble(t.x, t.y, 6);
        audio.smash(G.combo);
        hitStop(0.05);
        if (t.hp <= 0) {
          t.dead = true;
          bumpCombo();
          addScore(480 * comboMul(G.combo), t.x, t.y, '坦');
          burst(t.x, t.y, 20, HOT, 150, 0.45, 90);
          audio.boom();
          shake(8);
        }
      }
    }
    for (i = G.shots.length - 1; i >= 0; i--) {
      sh = G.shots[i];
      if (sh.dead) continue;
      if (hypot(box.x - sh.x, box.y - sh.y) < box.r + sh.r + 4) {
        sh.dead = true;
        hit = true;
        addScore(20, sh.x, sh.y);
        burst(sh.x, sh.y, 6, GOLD, 80, 0.22, 20);
        audio.punchAir();
      }
    }

    if (!hit) audio.punchAir();
  }

  function hurt(dmg, why, x, y) {
    var p = G.player;
    if (p.state === 'dead' || G.mode !== 'play') return;
    if (p.inv > 0) return;
    p.hp -= dmg;
    p.inv = INVULN;
    audio.hurt();
    hitStop(0.07);
    shake(9);
    kickStage('die');
    flash(MAG, 0.14);
    burst(x == null ? p.x : x, y == null ? p.y - 24 : y, 12, MAG, 120, 0.32, 40);
    syncHp();
    if (p.hp <= 0) {
      p.hp = 0;
      startDie(why || 'hp');
    }
  }

  function startDie(why) {
    var p = G.player;
    if (p.state === 'dead') return;
    p.state = 'dead';
    p.dieT = DIE_T;
    p.punchT = 0;
    G.why = why;
    p.vy = -120;
    breakCombo();
    flash(MAG, 0.2);
    kickStage('die');
    toast(whyText(why) || '倒下', true, false);
  }

  function loseLife() {
    G.lives -= 1;
    hudPlay();
    if (G.lives <= 0) {
      showOver();
      return;
    }
    G.player = makePlayer();
    G.player.inv = INVULN + 0.2;
    G.player.hp = MAX_HP;
    hudPlay();
    toast('剩 ' + G.lives + ' 命', true, false);
  }

  /* ---- army / civs ---- */
  function makeSoldier(x) {
    return {
      x: x, y: GROUND, vx: x < WORLD_W * 0.5 ? 42 : -42,
      face: x < WORLD_W * 0.5 ? 1 : -1,
      fireT: rand(0.6, 1.6), dead: false, bob: rand(0, TAU)
    };
  }
  function makeHeli(fromLeft) {
    return {
      x: fromLeft ? -30 : WORLD_W + 30,
      y: rand(70, 150),
      vx: (fromLeft ? 1 : -1) * rand(58, 88) * (G.kind === 'rage' ? 1.2 : 1),
      hp: 2, fireT: rand(0.8, 1.8), dead: false, bob: rand(0, TAU)
    };
  }
  function makeTank(x) {
    return {
      x: x, y: GROUND, vx: x < WORLD_W * 0.5 ? 28 : -28,
      hp: 3, fireT: rand(1.2, 2.2), dead: false
    };
  }
  function makeCiv(x, y, vx, airborne) {
    return {
      x: x, y: y, vx: vx || rand(-50, 50), vy: airborne ? rand(-80, -20) : 0,
      panic: true, dead: false, air: !!airborne, bob: rand(0, TAU)
    };
  }
  function makeShot(x, y, vx, vy, kind) {
    var r = kind === 'shell' ? 5.5 : kind === 'rocket' ? 4.2 : 2.4;
    return { x: x, y: y, vx: vx, vy: vy, kind: kind, r: r, life: 3.4, dead: false };
  }

  function countLive(arr) {
    var n = 0, i;
    for (i = 0; i < arr.length; i++) if (!arr[i].dead) n++;
    return n;
  }

  function fireShot(x, y, tx, ty, kind) {
    var dx = tx - x, dy = ty - y, len, spd, mul;
    len = hypot(dx, dy) || 1;
    mul = projSpd(G.kind, G.round);
    if (kind === 'bullet') spd = 210 * mul;
    else if (kind === 'rocket') spd = 150 * mul;
    else spd = 170 * mul;
    G.shots.push(makeShot(x, y, dx / len * spd, dy / len * spd + (kind === 'shell' ? -70 : 0), kind));
    if (kind === 'rocket') audio.rocket();
    else audio.shot();
  }

  function spawnArmy(dt) {
    G.spawnS -= dt;
    G.spawnH -= dt;
    G.spawnT -= dt;
    G.spawnC -= dt;
    if (G.spawnS <= 0 && countLive(G.soldiers) < maxSoldiers(G.kind)) {
      G.soldiers.push(makeSoldier(Math.random() < 0.5 ? -16 : WORLD_W + 16));
      G.spawnS = spawnSoldierT(G.kind, G.round);
    }
    if (G.spawnH <= 0 && countLive(G.helis) < maxHelis(G.kind)) {
      G.helis.push(makeHeli(Math.random() < 0.5));
      G.spawnH = spawnHeliT(G.kind, G.round);
    }
    if (G.spawnT <= 0 && countLive(G.tanks) < maxTanks(G.kind)) {
      G.tanks.push(makeTank(Math.random() < 0.5 ? -24 : WORLD_W + 24));
      G.spawnT = spawnTankT(G.kind, G.round);
    }
    if (G.spawnC <= 0 && countLive(G.civs) < 8) {
      G.civs.push(makeCiv(Math.random() < 0.5 ? 20 : WORLD_W - 20, GROUND, rand(-40, 40), false));
      G.spawnC = rand(2.2, 4.4);
    }
  }

  function tryGrab(p, force) {
    var i, b, dl, dr, fi, near;
    if (p.state === 'dead') return false;
    if (p.noGrab > 0) return false;
    for (i = 0; i < G.city.length; i++) {
      b = G.city[i];
      if (b.dead || b.collapsing) continue;
      dl = Math.abs(p.x - b.x);
      dr = Math.abs(p.x - (b.x + b.w));
      near = Math.min(dl, dr);
      if (near > (force ? GRAB + 8 : GRAB)) continue;
      if (p.y > GROUND - 3 && !force) continue;
      if (p.y < roofY(b) - 18) continue;
      fi = floorAtChest(b, p.y);
      if (b.floors[fi] && b.floors[fi].gone) {
        var up = fi;
        while (up < b.n && b.floors[up].gone) up++;
        if (up >= b.n) continue;
        if (p.y >= GROUND - 6) p.y = floorBot(up) - 2;
        else continue;
      }
      p.state = 'climb';
      p.climbB = i;
      p.climbSide = dl < dr ? -1 : 1;
      p.x = p.climbSide < 0 ? b.x : b.x + b.w;
      p.vx = 0;
      p.vy = 0;
      p.face = -p.climbSide;
      p.y = clamp(p.y, roofY(b), GROUND);
      audio.grab();
      return true;
    }
    return false;
  }

  function nearestFace(p) {
    var i, b, dl, dr, best = 1e9, side = 0, idx = -1;
    for (i = 0; i < G.city.length; i++) {
      b = G.city[i];
      if (b.dead || b.collapsing) continue;
      dl = Math.abs(p.x - b.x);
      dr = Math.abs(p.x - (b.x + b.w));
      if (dl < best) { best = dl; side = -1; idx = i; }
      if (dr < best) { best = dr; side = 1; idx = i; }
    }
    return { i: idx, d: best, side: side };
  }

  function tickPlayer(dt) {
    var p = G.player;
    var wantL = keys.l;
    var wantR = keys.r;
    var wantU = keys.u;
    var wantD = keys.d;
    var b, fi, face, nx, onRoof;

    p.bob += dt;
    if (p.eatT > 0) p.eatT -= dt;
    if (p.squish > 0) p.squish -= dt;
    if (p.inv > 0) p.inv -= dt;
    if (p.noGrab > 0) p.noGrab -= dt;
    if (p.punchT > 0) {
      p.punchT -= dt;
      if (!p.punchHit && p.punchT <= PUNCH_T - PUNCH_HIT) {
        p.punchHit = true;
        if (G.mode === 'play') resolvePunch();
      }
      if (p.punchT < 0) p.punchT = 0;
    }

    if (p.state === 'dead') {
      p.dieT -= dt;
      p.vy = Math.min(MAX_FALL, p.vy + GRAV * dt);
      p.y += p.vy * dt;
      p.x += p.vx * dt * 0.4;
      if (p.y > GROUND) { p.y = GROUND; p.vy = 0; }
      if (p.dieT <= 0 && G.mode === 'play') loseLife();
      return;
    }

    if (G.mode !== 'play') {
      p.x += Math.sin(p.bob * 0.7) * 8 * dt;
      return;
    }

    if (p.state === 'climb') {
      b = G.city[p.climbB];
      if (!b || b.dead || b.collapsing) {
        p.state = 'fall';
        p.fallFrom = p.y;
        p.climbB = -1;
        return;
      }
      p.x = p.climbSide < 0 ? b.x : b.x + b.w;
      p.face = -p.climbSide;
      if (wantU) p.y -= CLIMB * dt;
      if (wantD) p.y += CLIMB * dt;
      if (p.y <= roofY(b) + 2 && wantU) {
        p.state = 'roof';
        p.y = roofY(b);
        p.x = clamp(p.x + p.climbSide * 10, b.x + 8, b.x + b.w - 8);
        p.climbB = -1;
        return;
      }
      p.y = clamp(p.y, roofY(b), GROUND);
      fi = floorAtChest(b, p.y);
      if (b.floors[fi] && b.floors[fi].gone && p.y < GROUND - 8) {
        p.state = 'fall';
        p.fallFrom = p.y;
        p.vy = 50;
        p.climbB = -1;
        return;
      }
      if (p.y >= GROUND - 2) {
        p.state = 'walk';
        p.y = GROUND;
        p.climbB = -1;
        return;
      }
      face = (wantR ? 1 : 0) + (wantL ? -1 : 0);
      if (face && face === p.climbSide) {
        p.state = 'fall';
        p.fallFrom = p.y;
        p.vx = face * LEAP;
        p.vy = -90;
        p.climbB = -1;
        p.face = face;
        p.noGrab = 0.14;
      }
      return;
    }

    if (p.state === 'roof') {
      onRoof = null;
      for (fi = 0; fi < G.city.length; fi++) {
        b = G.city[fi];
        if (b.dead || b.collapsing) continue;
        if (p.x >= b.x - 6 && p.x <= b.x + b.w + 6 && Math.abs(p.y - roofY(b)) < 10) {
          onRoof = b;
          p.y = roofY(b);
          break;
        }
      }
      if (!onRoof) {
        p.state = 'fall';
        p.fallFrom = p.y;
        return;
      }
      if (wantL) { p.vx = -WALK; p.face = -1; }
      else if (wantR) { p.vx = WALK; p.face = 1; }
      else p.vx = 0;
      p.x += p.vx * dt;
      if (wantD) {
        p.state = 'climb';
        p.climbB = G.city.indexOf(onRoof);
        p.climbSide = p.x < onRoof.x + onRoof.w * 0.5 ? -1 : 1;
        p.x = p.climbSide < 0 ? onRoof.x : onRoof.x + onRoof.w;
        p.face = -p.climbSide;
        p.y = roofY(onRoof) + 8;
        p.vx = 0;
        return;
      }
      if (p.x < onRoof.x - 2 || p.x > onRoof.x + onRoof.w + 2) {
        if (!tryGrab(p, true)) {
          p.state = 'fall';
          p.fallFrom = p.y;
        }
      }
      return;
    }

    if (p.state === 'fall') {
      p.vy = Math.min(MAX_FALL, p.vy + GRAV * dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.x = clamp(p.x, 14, WORLD_W - 14);
      if (p.vy > 20 && tryGrab(p, false)) return;
      if (p.y >= GROUND) {
        p.y = GROUND;
        p.vx = 0;
        p.vy = 0;
        if (GROUND - p.fallFrom >= FALL_KILL) {
          startDie('fall');
        } else {
          p.state = 'walk';
          p.squish = 0.16;
          puff(p.x, p.y, 4);
          if (GROUND - p.fallFrom > 34) hurt(10, 'hp', p.x, p.y);
        }
      }
      return;
    }

    /* walk */
    p.state = 'walk';
    if (wantL) { p.vx = -WALK; p.face = -1; }
    else if (wantR) { p.vx = WALK; p.face = 1; }
    else p.vx = 0;
    nx = p.x + p.vx * dt;
    p.x = clamp(nx, 16, WORLD_W - 16);
    if (p.y < GROUND) {
      p.vy = Math.min(MAX_FALL, p.vy + GRAV * dt);
      p.y += p.vy * dt;
      if (p.y >= GROUND) { p.y = GROUND; p.vy = 0; }
    } else {
      p.y = GROUND;
      p.vy = 0;
    }
    if (wantU) {
      var nf = nearestFace(p);
      if (nf.d < GRAB + 10) {
        tryGrab(p, true);
      }
    }
  }

  function tickShots(dt) {
    var i, s, p, j, b, fi, hitB;
    p = G.player;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      if (s.dead) { G.shots.splice(i, 1); continue; }
      s.life -= dt;
      if (s.kind === 'rocket' && G.mode === 'play' && p.state !== 'dead') {
        var hx = p.x - s.x, hy = p.y - 26 - s.y, hl = hypot(hx, hy) || 1;
        var home = G.kind === 'rage' ? 90 : 46;
        s.vx += hx / hl * home * dt;
        s.vy += hy / hl * home * dt;
        var sp = hypot(s.vx, s.vy) || 1;
        var cap = 190 * projSpd(G.kind, G.round);
        if (sp > cap) { s.vx *= cap / sp; s.vy *= cap / sp; }
      }
      if (s.kind === 'shell') s.vy += 240 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0 || s.x < -40 || s.x > WORLD_W + 40 || s.y > GROUND + 20 || s.y < -30) {
        s.dead = true;
        continue;
      }
      hitB = false;
      for (j = 0; j < G.city.length; j++) {
        b = G.city[j];
        if (b.dead || b.collapsing) continue;
        if (s.x > b.x && s.x < b.x + b.w && s.y < GROUND && s.y > roofY(b)) {
          fi = Math.floor((GROUND - s.y) / FH);
          if (fi >= 0 && fi < b.n && !b.floors[fi].gone) {
            smashFloor(b, fi, 1);
            b.shake = 0.2;
            rubble(s.x, s.y, 6);
            if (shouldCollapse(b)) beginCollapse(b);
            burst(s.x, s.y, 8, HOT, 80, 0.24, 40);
            s.dead = true;
            hitB = true;
            break;
          }
        }
      }
      if (hitB) continue;
      if (G.mode === 'play' && p.state !== 'dead' && p.inv <= 0) {
        if (hypot(s.x - p.x, s.y - (p.y - p.h * 0.5)) < s.r + 14) {
          s.dead = true;
          if (s.kind === 'bullet') hurt(8, 'shot', s.x, s.y);
          else if (s.kind === 'rocket') hurt(16, 'shot', s.x, s.y);
          else hurt(20, 'shot', s.x, s.y);
          burst(s.x, s.y, 10, MAG, 100, 0.28, 30);
        }
      }
    }
  }

  function tickArmy(dt) {
    var i, s, p, t, h;
    p = G.player;
    for (i = G.soldiers.length - 1; i >= 0; i--) {
      s = G.soldiers[i];
      if (s.dead) { G.soldiers.splice(i, 1); continue; }
      s.bob += dt;
      s.x += s.vx * dt;
      if (s.x < 10 || s.x > WORLD_W - 10) { s.vx *= -1; s.face *= -1; }
      s.face = p.x >= s.x ? 1 : -1;
      s.fireT -= dt;
      if (s.fireT <= 0 && G.mode === 'play' && p.state !== 'dead') {
        fireShot(s.x + s.face * 8, s.y - 14, p.x, p.y - 28, 'bullet');
        s.fireT = (G.kind === 'rage' ? 1.05 : 1.65) / (1 + (G.round - 1) * 0.08);
      }
    }
    for (i = G.helis.length - 1; i >= 0; i--) {
      h = G.helis[i];
      if (h.dead) { G.helis.splice(i, 1); continue; }
      h.bob += dt * 10;
      h.x += h.vx * dt;
      h.y += Math.sin(h.bob * 0.15) * 10 * dt;
      if (h.x < -50 || h.x > WORLD_W + 50) { G.helis.splice(i, 1); continue; }
      h.fireT -= dt;
      if (h.fireT <= 0 && G.mode === 'play' && p.state !== 'dead') {
        fireShot(h.x, h.y + 10, p.x, p.y - 20, 'rocket');
        h.fireT = (G.kind === 'rage' ? 1.5 : 2.3) / (1 + (G.round - 1) * 0.06);
      }
    }
    for (i = G.tanks.length - 1; i >= 0; i--) {
      t = G.tanks[i];
      if (t.dead) { G.tanks.splice(i, 1); continue; }
      t.x += t.vx * dt;
      if (t.x < 18 || t.x > WORLD_W - 18) t.vx *= -1;
      t.fireT -= dt;
      if (t.fireT <= 0 && G.mode === 'play' && p.state !== 'dead') {
        fireShot(t.x, t.y - 18, p.x, p.y - 40, 'shell');
        t.fireT = (G.kind === 'rage' ? 2.1 : 3.1);
      }
    }
    for (i = G.civs.length - 1; i >= 0; i--) {
      s = G.civs[i];
      if (s.dead) { G.civs.splice(i, 1); continue; }
      s.bob += dt * 8;
      if (s.air) {
        s.vy += GRAV * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.y >= GROUND) { s.y = GROUND; s.air = false; s.vy = 0; }
      } else {
        s.x += s.vx * dt;
        if (s.x < 8 || s.x > WORLD_W - 8) s.vx *= -1;
      }
      if (G.mode === 'play' && p.state !== 'dead' && p.punchT > 0) {
        if (hypot(p.x - s.x, (p.y - 20) - s.y) < 26) {
          s.dead = true;
          eatAt(s.x, s.y);
        }
      }
    }
  }

  function tickCity(dt) {
    var i, b, j, fl;
    for (i = 0; i < G.city.length; i++) {
      b = G.city[i];
      if (b.dead) continue;
      if (b.shake > 0) b.shake -= dt;
      for (j = 0; j < b.n; j++) {
        fl = b.floors[j];
        if (fl.crack > 0) fl.crack = Math.max(0, fl.crack - dt * 1.6);
        fl.flicker += dt;
      }
      if (b.collapsing) {
        b.fall += dt * 1.15;
        b.lean += dt * 0.55 * (b.hue > 0.5 ? 1 : -1);
        if (Math.random() < 0.35) {
          rubble(b.x + rand(0, b.w), lerp(roofY(b), GROUND, b.fall) + rand(0, 40), 2);
        }
        if (b.fall >= 1) {
          b.dead = true;
          b.collapsing = false;
          rubble(b.x + b.w * 0.5, GROUND - 20, 22);
          puff(b.x + b.w * 0.5, GROUND, 10);
          shake(10);
        }
      }
    }
  }

  function tick(dt) {
    G.clock += dt;
    if (G.comboAge > 0) {
      G.comboAge -= dt;
      if (G.comboAge <= 0) breakCombo();
    }
    tickCity(dt);
    if (G.lock > 0) {
      G.lock -= dt;
      tickPlayer(dt);
      tickShots(dt);
      tickArmy(dt);
      if (G.lock <= 0 && G.pendingCity && G.mode === 'play') nextCity();
      return;
    }
    tickPlayer(dt);
    if (G.mode === 'play') {
      spawnArmy(dt);
      tickArmy(dt);
      tickShots(dt);
      if (!G.pendingCity && liveBuildings() <= 0) {
        G.pendingCity = true;
        G.lock = 1.15;
        addScore(1200 + 250 * G.round, WORLD_W * 0.5, 90, '夷平');
        toast('下一城', false, true);
        audio.city();
        kickStage('clear');
        flash(GOLD, 0.18);
      }
    } else {
      tickArmy(dt * 0.4);
      tickShots(dt * 0.4);
    }
  }

  /* ---- draw ---- */
  function resize() {
    var rect = stageEl.getBoundingClientRect();
    var padB, avW, avH, s;
    cssW = rect.width;
    cssH = rect.height;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, (cssW * dpr) | 0);
    canvas.height = Math.max(1, (cssH * dpr) | 0);
    padB = coarseQ.matches ? 64 : 8;
    avW = cssW;
    avH = Math.max(40, cssH - padB);
    s = Math.min(avW / WORLD_W, avH / WORLD_H);
    L.s = s;
    L.x = (avW - WORLD_W * s) / 2;
    L.y = Math.max(4, (avH - WORLD_H * s) / 2);
  }

  function sx(x) { return L.x + x * L.s; }
  function sy(y) { return L.y + y * L.s; }

  function rr(x, y, w, h, r) {
    var rad = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x, y, rad);
    ctx.closePath();
  }

  function drawBg() {
    var g, i, o, bx, bw, bh, k;
    ctx.fillStyle = '#07030b';
    ctx.fillRect(0, 0, cssW, cssH);
    g = ctx.createRadialGradient(sx(90), sy(70), 8, sx(90), sy(70), 220 * L.s);
    g.addColorStop(0, 'rgba(255,106,40,0.18)');
    g.addColorStop(1, 'rgba(255,106,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cssW, cssH);
    g = ctx.createRadialGradient(sx(520), sy(40), 8, sx(520), sy(40), 180 * L.s);
    g.addColorStop(0, 'rgba(255,61,184,0.1)');
    g.addColorStop(1, 'rgba(255,61,184,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.beginPath();
    ctx.fillStyle = 'rgba(230,244,255,0.88)';
    ctx.arc(sx(560), sy(52), 18 * L.s, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = '#07030b';
    ctx.arc(sx(568), sy(48), 14 * L.s, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#fff';
    for (i = 0; i < stars.length; i++) {
      o = stars[i];
      ctx.globalAlpha = o.a * (0.55 + 0.45 * Math.sin(G.clock * 1.3 + o.p));
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), o.r * L.s, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (i = 0; i < 12; i++) {
      bx = -20 + i * 62;
      bw = 28 + (i % 3) * 10;
      bh = 50 + ((i * 19) % 70);
      ctx.fillStyle = i % 2 ? 'rgba(14,16,32,0.9)' : 'rgba(18,14,36,0.88)';
      ctx.fillRect(sx(bx), sy(GROUND - 28 - bh), bw * L.s, bh * L.s);
      ctx.fillStyle = 'rgba(255,106,40,0.16)';
      for (k = 0; k < 4; k++) {
        ctx.globalAlpha = 0.3 + 0.4 * ((i + k + (G.clock * 0.4 | 0)) % 3 === 0 ? 1 : 0.35);
        ctx.fillRect(sx(bx + 6 + (k % 2) * 10), sy(GROUND - 40 - k * 12), 4 * L.s, 4 * L.s);
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawStreet() {
    var i, x;
    ctx.fillStyle = '#0a0814';
    ctx.fillRect(sx(-30), sy(GROUND), (WORLD_W + 60) * L.s, 80 * L.s);
    ctx.fillStyle = 'rgba(255,106,40,0.22)';
    ctx.fillRect(sx(-30), sy(GROUND), (WORLD_W + 60) * L.s, 2.2 * L.s);
    ctx.fillStyle = 'rgba(255,227,107,0.28)';
    for (i = 0; i < 8; i++) {
      x = 20 + i * 80 + Math.sin(G.clock * 0.3) * 4;
      ctx.fillRect(sx(x), sy(GROUND + 18), 22 * L.s, 2.4 * L.s);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(sx(-30), sy(GROUND + 38), (WORLD_W + 60) * L.s, 40 * L.s);
  }

  function drawBuilding(b) {
    var i, fl, x, y, w, h, glow, pane, cracked, lean, sink, wx, wy, ww, wh, g, lit;
    if (b.dead) return;
    lean = b.lean * 18 + (b.shake > 0 ? Math.sin(G.clock * 40) * 2.2 : 0);
    sink = b.collapsing ? b.fall * (GROUND - roofY(b) + 20) : 0;
    ctx.save();
    if (lean || sink || b.lean) {
      var px = sx(b.x + b.w * 0.5);
      var py = sy(GROUND);
      ctx.translate(px + lean * L.s, py + sink * L.s);
      ctx.rotate(b.lean * 0.12);
      ctx.translate(-px, -py);
    }

    x = b.x;
    w = b.w;
    y = roofY(b) - 8;
    h = GROUND - y + 6;
    g = ctx.createLinearGradient(sx(x), 0, sx(x + w), 0);
    g.addColorStop(0, '#0c1224');
    g.addColorStop(0.12, b.hue > 0.5 ? '#182040' : '#1a1838');
    g.addColorStop(0.5, '#1c2448');
    g.addColorStop(0.88, '#161c38');
    g.addColorStop(1, '#0c1224');
    ctx.globalAlpha = b.collapsing ? 1 - b.fall * 0.55 : 1;
    ctx.fillStyle = g;
    ctx.fillRect(sx(x), sy(y), w * L.s, h * L.s);
    ctx.strokeStyle = rgba(HOT, 0.28);
    ctx.lineWidth = Math.max(1, 1.3 * L.s);
    ctx.strokeRect(sx(x), sy(y), w * L.s, h * L.s);

    ctx.fillStyle = rgba(HOT, 0.55);
    ctx.fillRect(sx(x - 4), sy(y - 5), (w + 8) * L.s, 5 * L.s);
    ctx.fillStyle = rgba(GOLD, 0.35);
    ctx.fillRect(sx(x + w * 0.35), sy(y - 18), 8 * L.s, 14 * L.s);

    if (b.sign) {
      ctx.fillStyle = rgba(MAG, 0.55 + 0.25 * Math.sin(G.clock * 3 + b.hue * 8));
      ctx.font = '700 ' + (10 * L.s) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.sign, sx(x + (b.signSide < 0 ? 10 : w - 10)), sy(y + 16));
    }

    for (i = 0; i < b.n; i++) {
      fl = b.floors[i];
      wx = x + 7;
      wy = floorTop(i) + 5;
      ww = w - 14;
      wh = FH - 9;
      if (fl.gone) {
        ctx.fillStyle = 'rgba(4,2,10,0.92)';
        ctx.fillRect(sx(wx), sy(wy), ww * L.s, wh * L.s);
        ctx.strokeStyle = 'rgba(255,106,40,0.18)';
        ctx.strokeRect(sx(wx), sy(wy), ww * L.s, wh * L.s);
        ctx.fillStyle = 'rgba(80,40,20,0.45)';
        ctx.fillRect(sx(wx + 2), sy(wy + wh - 3), (ww - 4) * L.s, 3 * L.s);
        continue;
      }
      cracked = fl.hp / fl.max;
      lit = 0.45 + 0.35 * Math.sin(G.clock * 1.6 + fl.flicker);
      glow = cracked < 0.7
        ? rgba(HOT, 0.28 + 0.2 * lit)
        : (fl.glow > 0.5 ? rgba(GOLD, 0.45 + 0.25 * lit) : rgba(CYN, 0.32 + 0.22 * lit));
      ctx.fillStyle = '#070818';
      ctx.fillRect(sx(wx), sy(wy), ww * L.s, wh * L.s);
      pane = wh;
      ctx.fillStyle = glow;
      ctx.globalAlpha = 0.55 + 0.35 * cracked;
      ctx.fillRect(sx(wx + 1), sy(wy + 1), (ww - 2) * L.s, (pane - 2) * L.s);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(8,12,24,0.5)';
      ctx.lineWidth = Math.max(1, 0.8 * L.s);
      ctx.beginPath();
      ctx.moveTo(sx(wx + ww * 0.5), sy(wy));
      ctx.lineTo(sx(wx + ww * 0.5), sy(wy + wh));
      ctx.moveTo(sx(wx), sy(wy + wh * 0.5));
      ctx.lineTo(sx(wx + ww), sy(wy + wh * 0.5));
      ctx.stroke();
      if (fl.crack > 0 || cracked < 0.99) {
        ctx.strokeStyle = rgba(HOT, 0.45 + fl.crack * 0.5);
        ctx.beginPath();
        ctx.moveTo(sx(wx + 4), sy(wy + 3));
        ctx.lineTo(sx(wx + ww * 0.4), sy(wy + wh * 0.6));
        ctx.lineTo(sx(wx + ww - 5), sy(wy + wh - 3));
        ctx.stroke();
      }
      if (fl.civ) {
        ctx.fillStyle = '#e8b898';
        ctx.beginPath();
        ctx.arc(sx(wx + ww * 0.28), sy(wy + 6), 2.4 * L.s, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(MAG, 0.85);
        ctx.fillRect(sx(wx + ww * 0.28 - 2.2), sy(wy + 8.5), 4.4 * L.s, 7 * L.s);
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawCiv(c) {
    var wave;
    if (c.dead) return;
    wave = Math.sin(c.bob * 10) * 3;
    ctx.fillStyle = '#e8b898';
    ctx.beginPath();
    ctx.arc(sx(c.x), sy(c.y - 12 + wave * 0.2), 2.6 * L.s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.fillRect(sx(c.x - 2.4), sy(c.y - 9), 4.8 * L.s, 9 * L.s);
    ctx.strokeStyle = rgba(GOLD, 0.7);
    ctx.lineWidth = 1.2 * L.s;
    ctx.beginPath();
    ctx.moveTo(sx(c.x - 3), sy(c.y - 7));
    ctx.lineTo(sx(c.x - 7), sy(c.y - 12 - wave));
    ctx.moveTo(sx(c.x + 3), sy(c.y - 7));
    ctx.lineTo(sx(c.x + 7), sy(c.y - 12 + wave));
    ctx.stroke();
  }

  function drawSoldier(s) {
    if (s.dead) return;
    ctx.fillStyle = '#3a5a38';
    ctx.fillRect(sx(s.x - 4), sy(s.y - 16), 8 * L.s, 16 * L.s);
    ctx.fillStyle = '#c8a070';
    ctx.beginPath();
    ctx.arc(sx(s.x), sy(s.y - 18), 3.1 * L.s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.fillRect(sx(s.x + s.face * 4), sy(s.y - 13), 8 * L.s, 2 * L.s);
  }

  function drawHeli(h) {
    var blade;
    if (h.dead) return;
    blade = Math.abs(Math.sin(h.bob)) * 16 + 6;
    ctx.fillStyle = rgba(CYN, 0.28);
    ctx.fillRect(sx(h.x - blade), sy(h.y - 10), blade * 2 * L.s, 2 * L.s);
    ctx.fillStyle = '#1a3048';
    ctx.fillRect(sx(h.x - 16), sy(h.y - 6), 32 * L.s, 12 * L.s);
    ctx.fillStyle = rgba(HOT, 0.8);
    ctx.fillRect(sx(h.x - 6), sy(h.y - 4), 8 * L.s, 5 * L.s);
    ctx.fillStyle = rgba(CYN, 0.7);
    ctx.fillRect(sx(h.x + 12), sy(h.y - 2), 10 * L.s, 3 * L.s);
  }

  function drawTank(t) {
    if (t.dead) return;
    ctx.fillStyle = '#2a3a22';
    ctx.fillRect(sx(t.x - 20), sy(t.y - 14), 40 * L.s, 14 * L.s);
    ctx.fillStyle = '#3a4a28';
    ctx.fillRect(sx(t.x - 10), sy(t.y - 22), 20 * L.s, 10 * L.s);
    ctx.fillStyle = rgba(HOT, 0.85);
    ctx.fillRect(sx(t.x + 8), sy(t.y - 20), 18 * L.s, 3.2 * L.s);
    ctx.fillStyle = '#111';
    ctx.fillRect(sx(t.x - 16), sy(t.y - 4), 8 * L.s, 4 * L.s);
    ctx.fillRect(sx(t.x + 8), sy(t.y - 4), 8 * L.s, 4 * L.s);
  }

  function drawShot(s) {
    var trail;
    if (s.dead) return;
    if (s.kind === 'rocket') {
      ctx.strokeStyle = rgba(HOT, 0.7);
      ctx.lineWidth = 2 * L.s;
      trail = hypot(s.vx, s.vy) || 1;
      ctx.beginPath();
      ctx.moveTo(sx(s.x), sy(s.y));
      ctx.lineTo(sx(s.x - s.vx / trail * 12), sy(s.y - s.vy / trail * 12));
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * L.s, 0, TAU);
      ctx.fill();
    } else if (s.kind === 'shell') {
      ctx.fillStyle = rgba(HOT, 0.95);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * L.s, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * L.s, 0, TAU);
      ctx.fill();
    }
  }

  function drawMonster(p) {
    var x = p.x, y = p.y, f = p.face;
    var punch = p.punchT > 0 ? 1 - p.punchT / PUNCH_T : 0;
    var reach = Math.sin(punch * Math.PI);
    var bob = Math.sin(p.bob * (p.state === 'walk' && Math.abs(p.vx) > 10 ? 10 : 3)) * 2;
    var climb = p.state === 'climb';
    var dead = p.state === 'dead';
    var blink = p.inv > 0 && ((G.clock * 18) | 0) % 2 === 0;
    var squash = p.squish > 0 ? 1 - p.squish * 1.4 : 1;
    var fistX, fistY, rearX, bodyY, headY;

    if (blink && !dead) ctx.globalAlpha = 0.45;
    ctx.save();
    ctx.translate(sx(x), sy(y));
    if (dead) ctx.rotate(0.4 * f);
    ctx.scale(f * L.s, L.s * squash);

    bodyY = -26 + bob * 0.3;
    headY = -48 + bob * 0.2;
    if (climb) {
      bodyY = -28;
      headY = -50;
    }

    /* legs */
    ctx.fillStyle = rgba(FUR, 1);
    ctx.fillRect(-10, -18, 7, 18);
    ctx.fillRect(2, -16, 7, 16);
    ctx.fillStyle = rgba(SKIN, 0.9);
    ctx.fillRect(-11, -3, 8, 4);
    ctx.fillRect(2, -3, 8, 4);

    /* body */
    ctx.fillStyle = rgba(FUR2, 1);
    rr(-13, bodyY - 16, 26, 28, 8);
    ctx.fill();
    ctx.fillStyle = rgba(SKIN, 0.85);
    rr(-7, bodyY - 8, 14, 14, 5);
    ctx.fill();

    /* head */
    ctx.fillStyle = rgba(FUR, 1);
    ctx.beginPath();
    ctx.ellipse(0, headY, 13, 12, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(FUR2, 1);
    ctx.beginPath();
    ctx.ellipse(-11, headY - 4, 4.2, 5, -0.4, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(11, headY - 4, 4.2, 5, 0.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(SKIN, 1);
    ctx.beginPath();
    ctx.ellipse(1, headY + 3, 8, 7, 0, 0, TAU);
    ctx.fill();
    /* brow */
    ctx.fillStyle = rgba(FUR, 1);
    ctx.fillRect(-9, headY - 6, 18, 5);
    /* eyes */
    ctx.fillStyle = p.eatT > 0 ? rgba(MAG, 1) : rgba(GOLD, 1);
    ctx.beginPath();
    ctx.arc(-4, headY - 1, 2.1, 0, TAU);
    ctx.arc(5, headY - 1, 2.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a0a08';
    ctx.beginPath();
    ctx.arc(-3.4, headY - 1, 0.9, 0, TAU);
    ctx.arc(5.6, headY - 1, 0.9, 0, TAU);
    ctx.fill();
    /* mouth */
    ctx.fillStyle = p.punchT > 0 || p.eatT > 0 ? '#4a1020' : '#2a1810';
    ctx.beginPath();
    ctx.ellipse(1, headY + 7, p.eatT > 0 ? 5 : 3.4, p.eatT > 0 ? 3.2 : 1.6, 0, 0, TAU);
    ctx.fill();
    if (p.punchT > 0) {
      ctx.fillStyle = '#f4f0ea';
      ctx.fillRect(-1, headY + 5.2, 2, 3);
      ctx.fillRect(3, headY + 5.2, 2, 3);
    }

    /* arms */
    if (climb) {
      ctx.strokeStyle = rgba(FUR2, 1);
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-8, bodyY - 8);
      ctx.lineTo(-16, bodyY - 28);
      ctx.moveTo(8, bodyY - 6);
      ctx.lineTo(14, bodyY - 22);
      ctx.stroke();
      ctx.fillStyle = rgba(SKIN, 1);
      ctx.beginPath();
      ctx.arc(-16, bodyY - 28, 5, 0, TAU);
      ctx.arc(14, bodyY - 22, 5, 0, TAU);
      ctx.fill();
    } else {
      rearX = -16;
      fistX = 12 + reach * 22;
      fistY = bodyY - 4 - reach * 6;
      ctx.strokeStyle = rgba(FUR2, 1);
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-6, bodyY - 6);
      ctx.quadraticCurveTo(rearX, bodyY + 8, rearX - 2, -6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(6, bodyY - 8);
      ctx.quadraticCurveTo(10 + reach * 8, bodyY - 2, fistX, fistY);
      ctx.stroke();
      ctx.fillStyle = rgba(SKIN, 1);
      ctx.beginPath();
      ctx.arc(rearX - 2, -6, 4.5, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(fistX, fistY, 6 + reach * 2, 0, TAU);
      ctx.fill();
      if (reach > 0.4) {
        ctx.strokeStyle = rgba(GOLD, 0.55 * reach);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fistX - 4, fistY);
        ctx.lineTo(fistX + 14, fistY - 2);
        ctx.stroke();
      }
    }

    ctx.restore();
    ctx.globalAlpha = 1;

    /* punch shock */
    if (p.punchT > 0 && p.punchHit) {
      var box = punchBox(p);
      ctx.strokeStyle = rgba(HOT, 0.45);
      ctx.lineWidth = 2 * L.s;
      ctx.beginPath();
      ctx.arc(sx(box.x), sy(box.y), (16 + (1 - p.punchT / PUNCH_T) * 10) * L.s, 0, TAU);
      ctx.stroke();
    }
  }

  function drawFx() {
    var i, o, a;
    for (i = 0; i < smoke.length; i++) {
      o = smoke[i];
      ctx.fillStyle = rgba([80, 70, 70], o.a * (o.life / 0.9));
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), o.r * L.s, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < particles.length; i++) {
      o = particles[i];
      a = clamp(o.life / (o.max || 0.6), 0, 1);
      ctx.save();
      ctx.translate(sx(o.x), sy(o.y));
      ctx.rotate(o.rot);
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(o.rgb, 1);
      if (o.rect) ctx.fillRect(-o.r * L.s, -o.r * 0.6 * L.s, o.r * 2 * L.s, o.r * 1.2 * L.s);
      else {
        ctx.beginPath();
        ctx.arc(0, 0, o.r * L.s, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    for (i = 0; i < sparks.length; i++) {
      o = sparks[i];
      ctx.strokeStyle = rgba(o.rgb, clamp(o.life / 0.18, 0, 1));
      ctx.lineWidth = 1.6 * L.s;
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), o.r * (1 - o.life / 0.18) * L.s, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < rings.length; i++) {
      o = rings[i];
      ctx.strokeStyle = rgba(o.rgb, clamp(o.life / o.max, 0, 1) * 0.8);
      ctx.lineWidth = 2 * L.s;
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), o.r * L.s, 0, TAU);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.font = '700 ' + (11 * L.s) + 'px sans-serif';
    for (i = 0; i < floats.length; i++) {
      o = floats[i];
      ctx.fillStyle = rgba(o.rgb, clamp(o.life / 0.72, 0, 1));
      ctx.fillText(o.text, sx(o.x), sy(o.y));
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, clamp(G.flash * 2.2, 0, 0.28));
    ctx.fillRect(0, 0, cssW, cssH);
  }

  function drawBanner() {
    var left, i, b, n;
    if (G.mode !== 'play') return;
    n = 0;
    left = 0;
    for (i = 0; i < G.city.length; i++) {
      b = G.city[i];
      if (!b.dead) {
        left += floorsLeft(b);
        n++;
      }
    }
    ctx.font = '600 ' + (10 * L.s) + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = rgba(WHT, 0.45);
    ctx.fillText(n + ' 栋 · ' + left + ' 层', sx(12), sy(18));
  }

  function draw() {
    var i, shx, shy;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    shx = (G.shake ? (Math.random() - 0.5) * G.shake : 0) + G.kickX;
    shy = (G.shake ? (Math.random() - 0.5) * G.shake * 0.55 : 0) + G.kickY;
    ctx.translate(shx, shy);
    drawBg();
    drawStreet();
    for (i = 0; i < G.city.length; i++) drawBuilding(G.city[i]);
    for (i = 0; i < G.tanks.length; i++) drawTank(G.tanks[i]);
    for (i = 0; i < G.soldiers.length; i++) drawSoldier(G.soldiers[i]);
    for (i = 0; i < G.civs.length; i++) drawCiv(G.civs[i]);
    for (i = 0; i < G.helis.length; i++) drawHeli(G.helis[i]);
    drawMonster(G.player);
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);
    drawFx();
    drawBanner();
    drawFlash();
  }

  function frame(ts) {
    var dt, steps;
    if (!lastTs) lastTs = ts;
    dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (dt > 0.08) dt = 0.08;
    if (!hidden) {
      if (G.stop > 0) {
        G.stop -= dt;
        tickFx(dt);
      } else {
        acc += dt;
        steps = 0;
        while (acc >= STEP && steps < 5) {
          tick(STEP);
          acc -= STEP;
          steps++;
        }
        if (acc > STEP * 4) acc = 0;
        tickFx(dt);
      }
      draw();
    }
    requestAnimationFrame(frame);
  }

  /* ---- input ---- */
  function bindHold(el, setter) {
    function down(ev) {
      ev.preventDefault();
      setter(true);
      el.classList.add('held');
      audio.ensure();
      try { el.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
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

  bindHold(btnLeft, function (v) { keys.l = v; });
  bindHold(btnRight, function (v) { keys.r = v; });
  bindHold(btnUp, function (v) { keys.u = v; });
  bindHold(btnDown, function (v) { keys.d = v; });
  btnPunch.addEventListener('pointerdown', function (ev) {
    ev.preventDefault();
    btnPunch.classList.add('held');
    audio.ensure();
    beginPunch();
    try { btnPunch.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
  });
  function punchUp(ev) {
    ev.preventDefault();
    btnPunch.classList.remove('held');
  }
  btnPunch.addEventListener('pointerup', punchUp);
  btnPunch.addEventListener('pointercancel', punchUp);

  canvas.addEventListener('pointerdown', function (ev) {
    var rect, x, y;
    ev.preventDefault();
    audio.ensure();
    if (G.mode !== 'play') return;
    rect = canvas.getBoundingClientRect();
    x = (ev.clientX - rect.left - L.x) / L.s;
    y = (ev.clientY - rect.top - L.y) / L.s;
    if (y < WORLD_H * 0.42) beginPunch();
    else if (x < WORLD_W * 0.33) keys.l = true;
    else if (x > WORLD_W * 0.67) keys.r = true;
    else if (y < WORLD_H * 0.72) keys.u = true;
    else keys.d = true;
    try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
  });
  canvas.addEventListener('pointerup', function () {
    keys.l = keys.r = keys.u = keys.d = false;
  });
  canvas.addEventListener('pointercancel', function () {
    keys.l = keys.r = keys.u = keys.d = false;
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  function keyOn(e, down) {
    var k = e.code;
    if (k === 'ArrowLeft' || k === 'KeyA') { keys.l = down; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { keys.r = down; e.preventDefault(); }
    else if (k === 'ArrowUp' || k === 'KeyW') { keys.u = down; e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { keys.d = down; e.preventDefault(); }
    else if (k === 'Space') {
      if (down && !e.repeat) beginPunch();
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
        startRun('cities');
        e.preventDefault();
        return;
      }
      if (e.code === 'Digit2') {
        startRun('rage');
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
  window.addEventListener('keyup', function (e) { keyOn(e, false); });

  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    retry();
  });
  btnCities.addEventListener('click', function () {
    audio.ensure();
    startRun('cities');
  });
  btnRage.addEventListener('click', function () {
    audio.ensure();
    startRun('rage');
  });
  ovRetry.addEventListener('click', function () {
    audio.ensure();
    startRun(G.kind);
  });
  ovMenu.addEventListener('click', function () {
    audio.ensure();
    audio.ui();
    showTitle();
  });

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) lastTs = 0;
  });
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(stageEl);
  }

  resize();
  showTitle();
  requestAnimationFrame(frame);
})();
