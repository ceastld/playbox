'use strict';

/* 拳台 — Punch-Out!! lite. No CDN. */

(function () {
  var WORLD_W = 480;
  var WORLD_H = 420;
  var STEP = 1 / 60;
  var TAU = Math.PI * 2;
  var HEARTS = 4;
  var KD_LIM = 3;
  var COMBO_WIN = 2.2;
  var DODGE_MAX = 0.52;
  var PUNCH_T = 0.24;
  var PUNCH_HIT = 0.075;
  var BEST_KEY = 'playbox-punch-bag-best';
  var MUTE_KEY = 'playbox-punch-bag-mute';

  var MAG = [255, 61, 184];
  var CYN = [0, 240, 255];
  var GOLD = [255, 227, 107];
  var HOT = [255, 58, 34];
  var HOT2 = [255, 122, 74];
  var WHT = [246, 243, 255];
  var PUR = [155, 92, 255];

  var BOXERS = [
    {
      id: 'qing', name: '青皮', en: 'JADE',
      stam: 72, tell: 0.82, strike: 0.28, open: 0.96,
      idle0: 0.72, idle1: 1.42, stun: 0.46, taunt: 0.42,
      interrupt: true, fake: 0,
      attacks: ['lhook', 'rhook', 'jab'],
      punch: 12, rise: 6,
      skin: [232, 184, 152], hair: [48, 34, 28],
      shirt: [46, 230, 160], shorts: [16, 92, 68],
      glove: [236, 232, 224], lace: [40, 42, 52],
      boot: [32, 36, 44], thin: 1.14, bald: 0.2, must: false
    },
    {
      id: 'iron', name: '铁腕', en: 'IRON',
      stam: 98, tell: 0.54, strike: 0.22, open: 0.64,
      idle0: 0.52, idle1: 1.08, stun: 0.34, taunt: 0.36,
      interrupt: false, fake: 0,
      attacks: ['lhook', 'rhook', 'jab', 'upper'],
      punch: 14, rise: 5,
      skin: [214, 162, 118], hair: [232, 208, 118],
      shirt: [200, 48, 42], shorts: [72, 22, 22],
      glove: [148, 78, 42], lace: [255, 220, 140],
      boot: [48, 28, 22], thin: 0.92, bald: 0.05, must: true
    },
    {
      id: 'gold', name: '金拳', en: 'GOLD',
      stam: 122, tell: 0.34, strike: 0.18, open: 0.42,
      idle0: 0.36, idle1: 0.78, stun: 0.28, taunt: 0.32,
      interrupt: false, fake: 0.42,
      attacks: ['lhook', 'rhook', 'jab', 'upper', 'body'],
      punch: 16, rise: 4,
      skin: [92, 58, 40], hair: [24, 18, 16],
      shirt: [28, 18, 42], shorts: [18, 12, 28],
      glove: [220, 36, 32], lace: [255, 210, 80],
      boot: [20, 16, 22], thin: 0.98, bald: 0.92, must: false
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
  function comboMul(n) {
    return 1 + Math.min(4, Math.max(0, (n | 0) - 1));
  }
  function boxerAt(i) {
    return BOXERS[((i | 0) % BOXERS.length + BOXERS.length) % BOXERS.length];
  }
  function speedOf(kind, fight) {
    if (kind !== 'gauntlet') return 1;
    return Math.max(0.5, 1 - Math.max(0, fight - 1) * 0.07);
  }
  function openScale(kind, fight) {
    if (kind !== 'gauntlet') return 1;
    return Math.max(0.55, 1 - Math.max(0, fight - 1) * 0.05);
  }
  function dodgeOk(atk, pose) {
    if (atk === 'lhook') return pose === 'right' || pose === 'duck';
    if (atk === 'rhook') return pose === 'left' || pose === 'duck';
    if (atk === 'jab') return pose === 'left' || pose === 'right';
    if (atk === 'upper') return pose === 'duck';
    if (atk === 'body') return pose === 'left' || pose === 'right';
    return false;
  }
  function atkSide(atk) {
    if (atk === 'lhook' || atk === 'jab') return -1;
    if (atk === 'rhook') return 1;
    return 0;
  }
  function mashNeed(kd) {
    if (kd <= 1) return 0.42;
    if (kd === 2) return 0.68;
    return 1.2;
  }

  function selfCheck() {
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(5) !== 5) throw new Error('combo 5');
    if (!dodgeOk('lhook', 'right') || dodgeOk('lhook', 'left')) throw new Error('lhook dodge');
    if (!dodgeOk('upper', 'duck') || dodgeOk('upper', 'left')) throw new Error('upper dodge');
    if (!dodgeOk('body', 'left') || dodgeOk('body', 'duck')) throw new Error('body dodge');
    if (dodgeOk('jab', 'duck')) throw new Error('jab duck');
    if (boxerAt(0).id !== 'qing' || boxerAt(3).id !== 'qing') throw new Error('cycle');
    if (speedOf('challenge', 9) !== 1) throw new Error('chal speed');
    if (speedOf('gauntlet', 1) !== 1) throw new Error('g1');
    if (speedOf('gauntlet', 20) < 0.5 || speedOf('gauntlet', 20) > 0.51) throw new Error('gcap');
    if (mashNeed(3) <= mashNeed(2)) throw new Error('mash');
    if (BOXERS.length < 3) throw new Error('boxers');
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
  var btnCh = document.getElementById('btn-challenge');
  var btnGa = document.getElementById('btn-gauntlet');
  var btnMute = document.getElementById('btn-mute');
  var btnRetry = document.getElementById('btn-retry');
  var btnLeft = document.getElementById('btn-left');
  var btnRight = document.getElementById('btn-right');
  var btnDuck = document.getElementById('btn-duck');
  var btnPl = document.getElementById('btn-pl');
  var btnPr = document.getElementById('btn-pr');
  var scoreEl = document.getElementById('score');
  var boutEl = document.getElementById('bout');
  var bestEl = document.getElementById('best');
  var comboEl = document.getElementById('combo');
  var comboBox = document.getElementById('combo-box');
  var scoreBox = document.getElementById('score-box');
  var scoreAdd = document.getElementById('score-add');
  var modeLabel = document.getElementById('mode-label');
  var tagLabel = document.getElementById('tag-label');
  var stamBar = document.getElementById('stam-bar');
  var heartsEl = document.getElementById('hearts');
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
  var starsFx = [];
  var crowd = [];
  var sweat = [];

  var keys = { l: false, r: false, d: false, pl: false, pr: false };
  var ptr = { l: false, r: false, d: false };

  var G = {
    mode: 'title',
    kind: 'challenge',
    clock: 0,
    fight: 1,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboAge: 0,
    stars: 0,
    stop: 0,
    shake: 0,
    kickX: 0,
    kickY: 0,
    flash: 0,
    flashRgb: HOT,
    crowd: 0,
    intro: 0,
    lock: 0,
    why: '',
    won: false,
    spec: BOXERS[0],
    opp: null,
    ply: null,
    gloveL: { x: 118, y: 362, r: 46 },
    gloveR: { x: 362, y: 362, r: 46 }
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
        var buf = this.ctx.createBuffer(1, (sr * 0.45) | 0, sr);
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
      f.Q.value = type === 'lowpass' ? 0.7 : 1.15;
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
    dodge: function () {
      this.ensure();
      this.beep(420, 0.06, 'square', 0.04, 880);
      this.noise(0.05, 0.05, 1800, 'highpass');
    },
    swing: function () {
      this.ensure();
      this.noise(0.07, 0.07, 900, 'highpass');
      this.beep(180, 0.05, 'sawtooth', 0.035, 70);
    },
    hit: function (combo, star) {
      this.ensure();
      var p = 1 + Math.min(6, combo) * 0.07;
      this.noise(0.14, star ? 0.2 : 0.15, 200, 'lowpass');
      this.beep(150 * p, 0.12, 'square', 0.09, 55);
      this.beep((star ? 920 : 680) * p, 0.08, 'triangle', 0.055, 420 * p);
      if (star) this.beep(1240 * p, 0.1, 'square', 0.045, 1680 * p);
    },
    block: function () {
      this.ensure();
      this.beep(210, 0.06, 'square', 0.05, 90);
      this.noise(0.06, 0.08, 1400, 'bandpass');
    },
    hurt: function () {
      this.ensure();
      this.noise(0.16, 0.14, 240, 'lowpass');
      this.beep(280, 0.18, 'sawtooth', 0.055, 70);
    },
    down: function () {
      this.ensure();
      this.noise(0.22, 0.16, 140, 'lowpass');
      this.beep(120, 0.28, 'sine', 0.07, 48);
      this.beep(90, 0.2, 'square', 0.04, 40);
    },
    bell: function () {
      this.ensure();
      this.beep(880, 0.18, 'sine', 0.07, 760);
      this.beep(1320, 0.12, 'triangle', 0.045, 990);
    },
    crowd: function (big) {
      this.ensure();
      this.noise(big ? 0.28 : 0.12, big ? 0.12 : 0.06, 420, 'bandpass');
      this.noise(big ? 0.22 : 0.1, big ? 0.08 : 0.04, 900, 'highpass');
    },
    count: function (n) {
      this.ensure();
      this.beep(520 + n * 18, 0.07, 'square', 0.04);
    },
    ko: function () {
      this.ensure();
      this.beep(523, 0.12, 'square', 0.06, 392);
      this.beep(392, 0.16, 'triangle', 0.05, 262);
      this.beep(196, 0.28, 'sawtooth', 0.05, 98);
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
    tell: function () {
      this.ensure();
      this.beep(160, 0.05, 'sine', 0.03, 110);
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

  function makeCrowd() {
    var i, row, n, x, y;
    crowd.length = 0;
    for (row = 0; row < 4; row++) {
      n = 18 + row * 2;
      for (i = 0; i < n; i++) {
        x = 12 + (i + (row % 2) * 0.5) * ((WORLD_W - 24) / n);
        y = 10 + row * 11 + rand(-2, 2);
        crowd.push({
          x: x, y: y,
          s: rand(3.2, 5.4) - row * 0.2,
          rgb: [HOT, MAG, CYN, GOLD, PUR][(i + row) % 5],
          ph: rand(0, TAU),
          jump: rand(0.6, 1.4)
        });
      }
    }
  }
  makeCrowd();

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
  function dieKick() {
    if (reduceMotion()) return;
    stageEl.classList.remove('die');
    void stageEl.offsetWidth;
    stageEl.classList.add('die');
    setTimeout(function () { stageEl.classList.remove('die'); }, 340);
  }
  function flash(rgb, t) {
    G.flashRgb = rgb;
    G.flash = t;
  }
  function burst(x, y, n, rgb, spd, life, grav) {
    var i, cap;
    cap = 160 - particles.length;
    if (n > cap) n = cap < 0 ? 0 : cap;
    if (reduceMotion()) n = Math.min(n, 8);
    for (i = 0; i < n; i++) {
      particles.push({
        x: x, y: y,
        vx: rand(-1, 1) * spd,
        vy: rand(-1.2, 0.3) * spd,
        t: life * rand(0.55, 1.2),
        max: life,
        r: rand(1.1, 2.8),
        rgb: rgb,
        g: grav || 28
      });
    }
  }
  function starBurst(x, y, n) {
    var i, cap, a, sp;
    cap = 40 - starsFx.length;
    if (n > cap) n = cap < 0 ? 0 : cap;
    if (reduceMotion()) n = Math.min(n, 5);
    for (i = 0; i < n; i++) {
      a = rand(0, TAU);
      sp = rand(70, 220);
      starsFx.push({
        x: x, y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 40,
        t: rand(0.35, 0.7),
        max: 0.6,
        r: rand(4, 9),
        rot: rand(0, TAU),
        rv: rand(-8, 8),
        rgb: Math.random() < 0.5 ? GOLD : WHT
      });
    }
  }
  function spark(x, y, rgb, n) {
    var i;
    if (reduceMotion()) n = Math.min(n, 4);
    for (i = 0; i < n; i++) {
      sparks.push({
        x: x, y: y,
        vx: rand(-1, 1) * 90,
        vy: rand(-110, -20),
        t: rand(0.1, 0.28),
        rgb: rgb
      });
    }
  }
  function ringAt(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: 6 });
  }
  function pop(x, y, text, rgb) {
    floats.push({ x: x, y: y, text: text, rgb: rgb, t: 0.9, life: 0.9 });
  }
  function showChain(n) {
    if (!chainPop || reduceMotion()) return;
    chainTok += 1;
    var tok = chainTok;
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
    var tok = toastTok;
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden', 'warn', 'gold');
    if (warn) toastEl.classList.add('warn');
    if (gold) toastEl.classList.add('gold');
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1100);
  }
  function bumpScore(n) {
    var add;
    if (n <= 0) return;
    G.score += n | 0;
    persistBest();
    if (!scoreAdd || !scoreBox) return;
    add = '+' + n;
    scoreAdd.hidden = false;
    scoreAdd.textContent = add;
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    addTok += 1;
    var tok = addTok;
    setTimeout(function () {
      if (tok === addTok) scoreAdd.hidden = true;
    }, 700);
  }
  function bumpCombo() {
    var prev = comboMul(G.combo);
    G.combo += 1;
    G.comboAge = COMBO_WIN;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    if (G.combo >= 2) audio.combo(G.combo);
    if (comboMul(G.combo) > prev) showChain(comboMul(G.combo));
    if (comboBox) {
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
    }
  }
  function breakCombo() {
    G.combo = 0;
    G.comboAge = 0;
  }

  function tickFx(dt) {
    var i, p;
    G.shake *= Math.pow(0.12, dt * 8);
    if (G.shake < 0.2) G.shake = 0;
    G.kickX *= Math.pow(0.04, dt * 6);
    G.kickY *= Math.pow(0.04, dt * 6);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.crowd = Math.max(0, G.crowd - dt * 1.6);
    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.t <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      p = sparks[i];
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.t <= 0) sparks.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      p = floats[i];
      p.t -= dt;
      p.y -= 38 * dt;
      if (p.t <= 0) floats.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      p = rings[i];
      p.t += dt;
      if (p.t > 0.45) rings.splice(i, 1);
    }
    for (i = starsFx.length - 1; i >= 0; i--) {
      p = starsFx[i];
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt;
      p.rot += p.rv * dt;
      if (p.t <= 0) starsFx.splice(i, 1);
    }
    for (i = sweat.length - 1; i >= 0; i--) {
      p = sweat[i];
      p.t -= dt;
      p.y += 40 * dt;
      if (p.t <= 0) sweat.splice(i, 1);
    }
  }

  function resetFx() {
    particles.length = 0;
    sparks.length = 0;
    floats.length = 0;
    rings.length = 0;
    starsFx.length = 0;
    sweat.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.kickX = 0;
    G.kickY = 0;
    G.flash = 0;
    G.crowd = 0;
  }

  /* ---- fighters ---- */
  function makeOpp(spec) {
    return {
      spec: spec,
      stam: spec.stam,
      max: spec.stam,
      kd: 0,
      phase: 'idle',
      atk: '',
      nextAtk: '',
      t: 0,
      wait: rand(spec.idle0, spec.idle1),
      bob: 0,
      hitFlash: 0,
      count: 0,
      starKO: false,
      fakeFlip: false,
      willOpen: false,
      landed: false
    };
  }
  function makePly() {
    return {
      hearts: HEARTS,
      maxH: HEARTS,
      kd: 0,
      pose: 'idle',
      t: 0,
      punch: '',
      punchT: 0,
      punched: false,
      hitT: 0,
      dodgeT: 0,
      mash: 0,
      count: 0,
      countT: 0,
      inv: 0,
      bob: 0,
      x: 0,
      y: 0
    };
  }

  function setHint(text, cls) {
    hintEl.classList.remove('warn', 'hot');
    if (cls) hintEl.classList.add(cls);
    hintEl.textContent = text;
  }

  function syncHud() {
    var spec = G.spec;
    var ratio, i, h, pip;
    scoreEl.textContent = String(G.score);
    boutEl.textContent = String(G.fight);
    bestEl.textContent = String(G.best);
    comboEl.textContent = '×' + comboMul(G.combo);
    modeLabel.textContent = G.kind === 'gauntlet' ? '连战' : '挑战';
    modeLabel.classList.toggle('gaunt', G.kind === 'gauntlet');
    tagLabel.textContent = spec.name;
    tagLabel.className = '';
    if (spec.id === 'gold') tagLabel.classList.add('hot');
    if (G.opp && G.opp.phase === 'tell') tagLabel.classList.add('warn');
    ratio = G.opp ? G.opp.stam / G.opp.max : 1;
    stamBar.style.transform = 'scaleX(' + clamp(ratio, 0, 1) + ')';
    stamBar.classList.toggle('low', ratio < 0.28);
    heartsEl.innerHTML = '';
    for (i = 0; i < HEARTS; i++) {
      h = document.createElement('span');
      h.className = 'heart' + (G.ply && i < G.ply.hearts ? ' on' : ' gone');
      heartsEl.appendChild(h);
    }
    pipsEl.innerHTML = '';
    for (i = 0; i < KD_LIM; i++) {
      pip = document.createElement('span');
      pip.className = 'pip' + (G.opp && i < G.opp.kd ? ' gone' : ' on');
      pipsEl.appendChild(pip);
    }
  }

  function hideOverlay() {
    overlayEl.classList.add('hidden');
    overlayEl.setAttribute('aria-hidden', 'true');
    panelEl.className = 'panel';
  }
  function showOverlay() {
    overlayEl.classList.remove('hidden');
    overlayEl.setAttribute('aria-hidden', 'false');
  }

  function startBout(spec) {
    G.spec = spec;
    G.opp = makeOpp(spec);
    G.ply.pose = 'idle';
    G.ply.punch = '';
    G.ply.punchT = 0;
    G.ply.hitT = 0;
    G.ply.mash = 0;
    G.ply.inv = 0.4;
    G.intro = 1.35;
    G.lock = 0;
    G.opp.wait = 0.55;
    breakCombo();
    resetFx();
    audio.bell();
    audio.crowd(false);
    setHint('看预备 · ' + spec.name + ' · 躲开再打', spec.id === 'gold' ? 'hot' : '');
    syncHud();
  }

  function startRun(kind) {
    G.kind = kind === 'gauntlet' ? 'gauntlet' : 'challenge';
    G.mode = 'play';
    G.fight = 1;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.stars = 0;
    G.why = '';
    G.won = false;
    G.ply = makePly();
    hideOverlay();
    audio.start();
    startBout(boxerAt(0));
    canvas.focus({ preventScroll: true });
  }

  function showTitle() {
    G.mode = 'title';
    G.kind = 'challenge';
    G.fight = 1;
    G.score = 0;
    G.combo = 0;
    G.stars = 0;
    G.ply = makePly();
    G.spec = BOXERS[0];
    G.opp = makeOpp(BOXERS[0]);
    G.opp.wait = 0.8;
    G.intro = 0;
    resetFx();
    panelEl.className = 'panel';
    ovKicker.textContent = 'PUNCH';
    ovTitle.textContent = '拳台';
    ovLead.textContent = '盯破绽出拳，躲开重击。对手有预备动作，躲开再打。硬接或躲错都会挨打。';
    ovOps.textContent = '← → 躲 · ↓ 蹲 · Z / X 或点手套出拳 · R 重开 · M 静音';
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    showOverlay();
    setHint('看预备再躲 · 躲开的空档打出去 · 硬接和躲错都会掉红心');
    syncHud();
  }

  function showOver(win) {
    G.mode = 'over';
    G.won = win;
    persistBest();
    panelEl.className = 'panel ' + (win ? 'win' : 'lose');
    ovKicker.textContent = win ? 'TKO' : 'DOWN';
    ovTitle.textContent = win ? (G.kind === 'challenge' ? '卫冕' : '连胜') : (G.why || '倒下');
    ovLead.textContent = (G.kind === 'gauntlet' ? ('撑到第 ' + G.fight + ' 场 · ') : ('第 ' + G.fight + ' 场 · ')) +
      G.score + ' 分 · 连击最高 ×' + G.maxCombo +
      (G.score >= G.best ? ' · 新纪录' : '');
    ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
    ovStart.classList.add('gone');
    ovEnd.classList.remove('gone');
    showOverlay();
    if (win) audio.win(); else audio.over();
    setHint('R 再来 · 换模式回标题', win ? 'hot' : 'warn');
    try { ovRetry.focus(); } catch (e) { /* ignore */ }
    syncHud();
  }

  function retry() {
    audio.ui();
    hintEl.classList.remove('warn', 'hot');
    if (G.mode === 'title') startRun('challenge');
    else startRun(G.kind);
  }

  function nextFight() {
    var idx;
    bumpScore(G.kind === 'challenge' ? 1200 : 800);
    G.fight += 1;
    G.stars = Math.min(3, G.stars + 1);
    G.ply.hearts = Math.min(HEARTS, G.ply.hearts + 1);
    G.ply.kd = 0;
    G.ply.maxH = HEARTS;
    if (G.kind === 'challenge') {
      if (G.fight > BOXERS.length) {
        bumpScore(4000);
        showOver(true);
        return;
      }
      startBout(boxerAt(G.fight - 1));
    } else {
      idx = (G.fight - 1) % BOXERS.length;
      startBout(boxerAt(idx));
    }
  }

  function landOnPlayer(blocked) {
    var ply = G.ply;
    if (ply.inv > 0 || ply.pose === 'down') return;
    breakCombo();
    ply.hearts = Math.max(0, ply.hearts - 1);
    ply.hitT = blocked ? 0.28 : 0.42;
    ply.pose = 'hit';
    ply.punch = '';
    audio.hurt();
    audio.crowd(false);
    flash(MAG, blocked ? 0.18 : 0.32);
    hitStop(blocked ? 0.04 : 0.055);
    shake(blocked ? 5 : 9);
    kick(0, 4);
    dieKick();
    burst(WORLD_W * 0.5, 300, blocked ? 10 : 18, MAG, 140, 0.4, 40);
    spark(WORLD_W * 0.5, 310, HOT, 8);
    G.crowd = Math.min(1, G.crowd + 0.35);
    syncHud();
    if (ply.hearts <= 0) knockPlayer();
  }

  function knockPlayer() {
    var ply = G.ply;
    ply.kd += 1;
    ply.pose = 'down';
    ply.t = 0;
    ply.mash = 0;
    ply.count = 0;
    ply.countT = 0;
    ply.hearts = 0;
    audio.down();
    audio.crowd(true);
    hitStop(0.08);
    shake(14);
    flash(HOT, 0.4);
    toast(ply.kd >= KD_LIM ? '三次倒下' : '倒地', true, false);
    if (ply.kd >= KD_LIM) {
      G.why = '三次倒下';
      G.lock = 0.9;
    }
    syncHud();
  }

  function knockOpp(star) {
    var opp = G.opp;
    opp.stam = 0;
    opp.kd += 1;
    opp.phase = 'down';
    opp.t = 0;
    opp.count = 0;
    opp.starKO = !!star && opp.kd < KD_LIM;
    G.ply.hearts = Math.min(HEARTS, G.ply.hearts + 1);
    bumpScore(star ? 2000 : 800);
    audio.down();
    audio.crowd(true);
    audio.bell();
    hitStop(0.08);
    shake(16);
    kick(0, 6);
    flash(GOLD, 0.45);
    starBurst(WORLD_W * 0.5, 150, 14);
    burst(WORLD_W * 0.5, 160, 28, GOLD, 180, 0.55, 30);
    G.crowd = 1;
    toast(opp.kd >= KD_LIM ? 'TKO' : (opp.starKO ? 'KO' : 'DOWN'), false, true);
    if (opp.kd >= KD_LIM || opp.starKO) G.lock = 1.15;
    syncHud();
  }

  function hitOpp(star) {
    var spec = G.spec;
    var dmg, mul, n, wasOpen, early;
    wasOpen = G.opp.phase === 'open' || (G.opp.phase === 'strike' && G.opp.willOpen);
    early = G.opp.phase === 'open' ? G.opp.t < 0.22 : (G.opp.phase === 'strike' && G.opp.willOpen);
    mul = comboMul(G.combo + 1);
    dmg = spec.punch + (star ? spec.punch + 8 : 0);
    if (G.opp.phase === 'tell') dmg = Math.round(dmg * 0.7);
    G.opp.stam = Math.max(0, G.opp.stam - dmg);
    G.opp.hitFlash = 0.18;
    bumpCombo();
    n = (star ? 240 : 80) * mul;
    bumpScore(n);
    pop(WORLD_W * 0.5 + rand(-12, 12), 120, star ? 'STAR' : String(n), star ? GOLD : WHT);
    audio.hit(G.combo, star);
    audio.crowd(star);
    hitStop(star ? 0.08 : (G.combo >= 4 ? 0.07 : 0.055));
    shake(star ? 12 : 7);
    kick(G.ply.punch === 'L' ? -3 : 3, 3);
    flash(star ? GOLD : HOT, star ? 0.28 : 0.16);
    burst(WORLD_W * 0.5, 148, star ? 22 : 14, star ? GOLD : HOT, star ? 200 : 140, 0.45, 24);
    starBurst(WORLD_W * 0.5, 148, star ? 10 : 5);
    ringAt(WORLD_W * 0.5, 150, star ? GOLD : CYN);
    if (!reduceMotion()) {
      sweat.push({ x: WORLD_W * 0.5 + rand(-10, 10), y: 130, t: 0.4 });
    }
    G.crowd = Math.min(1, G.crowd + (star ? 0.85 : 0.5));
    if (star) {
      G.stars = Math.max(0, G.stars - 1);
    } else if (wasOpen && early) {
      G.stars = Math.min(3, G.stars + 1);
    }
    if (G.opp.stam <= 0) {
      knockOpp(star);
    } else {
      G.opp.phase = 'stun';
      G.opp.t = 0;
    }
    syncHud();
  }

  function pickAtk(spec) {
    var a = spec.attacks;
    return a[(Math.random() * a.length) | 0];
  }

  function tellLen() {
    return G.spec.tell * speedOf(G.kind, G.fight);
  }
  function strikeLen() {
    return G.spec.strike * (0.85 + 0.15 * speedOf(G.kind, G.fight));
  }
  function openLen() {
    return G.spec.open * openScale(G.kind, G.fight);
  }

  function playerPoseNow() {
    var p = G.ply.pose;
    if (p === 'left' || p === 'right' || p === 'duck') return p;
    return 'idle';
  }

  function tryPunch(side) {
    var ply = G.ply;
    if (G.mode !== 'play' && G.mode !== 'title') return;
    if (G.mode === 'title') return;
    if (ply.pose === 'down' || ply.pose === 'hit') {
      if (ply.pose === 'down') ply.mash = Math.min(1, ply.mash + 0.14);
      return;
    }
    if (ply.punch) return;
    ply.punch = side;
    ply.punchT = 0;
    ply.punched = false;
    audio.swing();
  }

  function tickPunch(dt) {
    var ply = G.ply;
    var opp = G.opp;
    var star;
    if (!ply.punch) return;
    ply.punchT += dt;
    if (!ply.punched && ply.punchT >= PUNCH_HIT) {
      ply.punched = true;
      if (opp.phase === 'down' || opp.phase === 'getup' || G.intro > 0) {
        /* miss air */
      } else if (opp.phase === 'open' || (opp.phase === 'tell' && G.spec.interrupt) ||
          (opp.phase === 'strike' && opp.willOpen)) {
        star = G.stars > 0 && (opp.phase === 'open' || opp.willOpen);
        hitOpp(star);
      } else if (opp.phase === 'strike') {
        /* eating the punch — strike handler deals it */
      } else if (opp.phase === 'stun') {
        hitOpp(false);
      } else {
        audio.block();
        hitStop(0.03);
        spark(WORLD_W * 0.5 + (ply.punch === 'L' ? -18 : 18), 168, CYN, 6);
        pop(WORLD_W * 0.5, 140, '挡', CYN);
        if (opp.phase === 'idle' || opp.phase === 'taunt') {
          G.opp.phase = 'block';
          G.opp.t = 0;
        }
        breakCombo();
      }
    }
    if (ply.punchT >= PUNCH_T) {
      ply.punch = '';
      ply.punchT = 0;
    }
  }

  function tickPlayer(dt) {
    var ply = G.ply;
    var want;
    ply.bob += dt;
    if (ply.inv > 0) ply.inv -= dt;
    if (ply.pose === 'down') {
      ply.t += dt;
      ply.countT += dt;
      if (ply.countT >= 0.72) {
        ply.countT = 0;
        ply.count += 1;
        audio.count(ply.count);
        if (ply.count >= 10) {
          G.why = '数到十';
          G.lock = 0.6;
        }
      }
      if (ply.kd < KD_LIM && ply.count >= 2 && ply.count < 10 && ply.mash >= mashNeed(ply.kd)) {
        ply.pose = 'idle';
        ply.hearts = Math.max(2, HEARTS - ply.kd);
        ply.maxH = ply.hearts;
        ply.inv = 0.9;
        ply.mash = 0;
        ply.punch = '';
        toast('起来', false, true);
        audio.bell();
        syncHud();
      }
      return;
    }
    if (ply.hitT > 0) {
      ply.hitT -= dt;
      ply.pose = 'hit';
      if (ply.hitT <= 0) ply.pose = 'idle';
      tickPunch(dt);
      return;
    }
    want = 'idle';
    if (keys.d || ptr.d) want = 'duck';
    else if (keys.l || ptr.l) want = 'left';
    else if (keys.r || ptr.r) want = 'right';
    if (want !== 'idle') {
      if (ply.pose !== want) {
        audio.dodge();
        ply.dodgeT = 0;
      }
      ply.dodgeT += dt;
      if (ply.dodgeT > DODGE_MAX) want = 'idle';
    } else {
      ply.dodgeT = 0;
    }
    if (!ply.punch) ply.pose = want;
    tickPunch(dt);
  }

  function beginTell() {
    var spec = G.spec;
    var atk = pickAtk(spec);
    G.opp.phase = 'tell';
    G.opp.atk = atk;
    G.opp.nextAtk = atk;
    G.opp.t = 0;
    G.opp.fakeFlip = spec.fake > 0 && Math.random() < spec.fake;
    G.opp.willOpen = false;
    G.opp.landed = false;
    audio.tell();
    if (atk === 'upper') toast('上勾', true, false);
    syncHud();
  }

  function tickOpp(dt) {
    var opp = G.opp;
    var spec = G.spec;
    var pose, blocked, ok;
    opp.bob += dt;
    if (opp.hitFlash > 0) opp.hitFlash -= dt;
    if (G.intro > 0) return;
    if (G.ply.pose === 'down' && (opp.phase === 'idle' || opp.phase === 'tell' || opp.phase === 'open')) {
      opp.phase = 'idle';
      opp.wait = 2;
      return;
    }
    if (opp.phase === 'idle') {
      opp.wait -= dt;
      if (opp.wait <= 0) beginTell();
      return;
    }
    if (opp.phase === 'tell') {
      opp.t += dt;
      if (opp.fakeFlip && opp.t > tellLen() * 0.55) {
        opp.atk = opp.atk === 'lhook' ? 'rhook' : (opp.atk === 'rhook' ? 'lhook' : opp.atk);
        opp.fakeFlip = false;
      }
      if (opp.t >= tellLen()) {
        opp.phase = 'strike';
        opp.t = 0;
        opp.landed = false;
        opp.willOpen = false;
      }
      return;
    }
    if (opp.phase === 'strike') {
      opp.t += dt;
      if (!opp.landed && opp.t >= strikeLen() * 0.45) {
        opp.landed = true;
        pose = playerPoseNow();
        ok = dodgeOk(opp.atk, pose);
        if (ok) {
          opp.willOpen = true;
          audio.dodge();
          hitStop(0.032);
          kick(atkSide(opp.atk) * 3, 0);
          ringAt(WORLD_W * 0.5, 170, CYN);
          pop(WORLD_W * 0.5, 110, '空档', CYN);
          burst(WORLD_W * 0.5 + atkSide(opp.atk) * 40, 150, 8, CYN, 80, 0.3, 10);
        } else {
          opp.willOpen = false;
          blocked = pose === 'idle';
          landOnPlayer(blocked);
        }
      }
      if (opp.t >= strikeLen()) {
        if (opp.willOpen) {
          opp.phase = 'open';
          opp.t = 0;
        } else {
          opp.phase = 'taunt';
          opp.t = 0;
        }
      }
      return;
    }
    if (opp.phase === 'open') {
      opp.t += dt;
      if (opp.t >= openLen()) {
        opp.phase = 'idle';
        opp.wait = rand(spec.idle0 * 0.5, spec.idle1 * 0.7) * speedOf(G.kind, G.fight);
      }
      return;
    }
    if (opp.phase === 'stun') {
      opp.t += dt;
      if (opp.t >= spec.stun) {
        opp.phase = 'idle';
        opp.wait = rand(0.28, 0.6) * speedOf(G.kind, G.fight);
      }
      return;
    }
    if (opp.phase === 'block') {
      opp.t += dt;
      if (opp.t >= 0.22) {
        opp.phase = 'idle';
        opp.wait = rand(0.2, 0.45);
      }
      return;
    }
    if (opp.phase === 'taunt') {
      opp.t += dt;
      if (opp.t >= spec.taunt) {
        opp.phase = 'idle';
        opp.wait = rand(spec.idle0 * 0.6, spec.idle1 * 0.8) * speedOf(G.kind, G.fight);
      }
      return;
    }
    if (opp.phase === 'down') {
      opp.t += dt;
      if (opp.t >= 0.72) {
        opp.t = 0;
        opp.count += 1;
        audio.count(opp.count);
      }
      if (opp.kd >= KD_LIM || opp.starKO) {
        if (opp.count >= 3 && G.lock <= 0 && G.mode === 'play') {
          if (opp.kd >= KD_LIM) bumpScore(1500);
          else bumpScore(2000);
          nextFight();
        }
        return;
      }
      if (opp.count >= spec.rise) {
        opp.phase = 'getup';
        opp.t = 0;
        opp.stam = Math.round(spec.stam * (opp.kd === 1 ? 0.72 : 0.55));
        opp.max = spec.stam;
        syncHud();
      }
      return;
    }
    if (opp.phase === 'getup') {
      opp.t += dt;
      if (opp.t >= 0.55) {
        opp.phase = 'idle';
        opp.wait = 0.7;
        toast('起来', false, false);
      }
    }
  }

  function tick(dt) {
    G.clock += dt;
    if (G.comboAge > 0) {
      G.comboAge -= dt;
      if (G.comboAge <= 0) breakCombo();
    }
    if (G.intro > 0) G.intro -= dt;
    if (G.lock > 0) {
      G.lock -= dt;
      if (G.lock <= 0 && G.mode === 'play') {
        if (G.ply.pose === 'down' && (G.ply.kd >= KD_LIM || G.why === '数到十')) {
          showOver(false);
          return;
        }
      }
    }
    if (G.mode === 'title') {
      G.opp.bob += dt;
      if (G.opp.phase === 'idle') {
        G.opp.wait -= dt;
        if (G.opp.wait <= 0) beginTell();
      } else if (G.opp.phase === 'tell') {
        G.opp.t += dt;
        if (G.opp.t >= G.spec.tell) {
          G.opp.phase = 'taunt';
          G.opp.t = 0;
        }
      } else {
        G.opp.t += dt;
        if (G.opp.t > 0.8) {
          G.opp.phase = 'idle';
          G.opp.wait = rand(1.2, 2.2);
        }
      }
      G.ply.bob += dt;
      return;
    }
    if (G.mode !== 'play') {
      G.opp.bob += dt;
      G.ply.bob += dt;
      return;
    }
    tickPlayer(dt);
    tickOpp(dt);
  }

  /* ---- draw ---- */
  function sx(x) { return L.x + x * L.s; }
  function sy(y) { return L.y + y * L.s; }

  function rr(x, y, w, h, r) {
    var rad = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }
  function starPath(x, y, r, rot) {
    var i, a, inner;
    inner = r * 0.42;
    ctx.beginPath();
    for (i = 0; i < 5; i++) {
      a = rot + i * TAU / 5 - Math.PI / 2;
      if (i === 0) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      a += TAU / 10;
      ctx.lineTo(x + Math.cos(a) * inner, y + Math.sin(a) * inner);
    }
    ctx.closePath();
  }

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

  function drawCrowd() {
    var i, c, j, glow;
    glow = G.crowd;
    for (i = 0; i < crowd.length; i++) {
      c = crowd[i];
      j = Math.sin(G.clock * 6 * c.jump + c.ph) * (2 + glow * 6);
      ctx.fillStyle = rgba(c.rgb, 0.18 + glow * 0.45 + 0.08 * Math.sin(c.ph + G.clock * 3));
      ctx.beginPath();
      ctx.arc(sx(c.x), sy(c.y - j), c.s * L.s, 0, TAU);
      ctx.fill();
    }
  }

  function drawRing() {
    var g, i;
    g = ctx.createLinearGradient(sx(0), sy(70), sx(0), sy(340));
    g.addColorStop(0, 'rgba(18, 8, 16, 0)');
    g.addColorStop(0.35, 'rgba(18, 8, 16, 0.4)');
    g.addColorStop(1, 'rgba(28, 10, 14, 0.95)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(sx(70), sy(250));
    ctx.lineTo(sx(410), sy(250));
    ctx.lineTo(sx(470), sy(400));
    ctx.lineTo(sx(10), sy(400));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,58,34,0.35)';
    ctx.lineWidth = 2 * L.s;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,227,107,0.12)';
    ctx.lineWidth = 1 * L.s;
    for (i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(sx(70 + i * 56), sy(250));
      ctx.lineTo(sx(10 + i * 77), sy(400));
      ctx.stroke();
    }
    function rope(y0, y1, rgb) {
      ctx.strokeStyle = rgba(rgb, 0.85);
      ctx.lineWidth = 3.2 * L.s;
      ctx.beginPath();
      ctx.moveTo(sx(78), sy(y0));
      ctx.lineTo(sx(52), sy(y1));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx(402), sy(y0));
      ctx.lineTo(sx(428), sy(y1));
      ctx.stroke();
    }
    rope(248, 318, CYN);
    rope(268, 348, MAG);
    rope(288, 378, GOLD);
    ctx.fillStyle = rgba(HOT, 0.55);
    rr(sx(46), sy(312), 10 * L.s, 68 * L.s, 3 * L.s);
    ctx.fill();
    rr(sx(424), sy(312), 10 * L.s, 68 * L.s, 3 * L.s);
    ctx.fill();
  }

  function drawLamp() {
    var pulse = 0.55 + 0.45 * Math.sin(G.clock * 3);
    ctx.fillStyle = rgba(GOLD, 0.12 + pulse * 0.08);
    ctx.beginPath();
    ctx.arc(sx(240), sy(46), 48 * L.s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.7);
    rr(sx(210), sy(18), 60 * L.s, 10 * L.s, 4 * L.s);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.font = '900 ' + (11 * L.s) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PUNCH', sx(240), sy(27));
  }

  function oppPose() {
    var opp = G.opp;
    var spec = G.spec;
    var u = 0;
    var p = {
      x: 240, y: 168,
      lean: 0, crouch: 0, twist: 0,
      lArm: 0, rArm: 0, lOut: 0, rOut: 0,
      lLow: 0, rLow: 0, scaleL: 1, scaleR: 1,
      glowL: 0, glowR: 0, mouth: 0, eye: 0,
      down: 0, rot: 0
    };
    p.y += Math.sin(opp.bob * 5.2) * (opp.phase === 'down' ? 0 : 2.4) * spec.thin;
    if (opp.phase === 'tell' || opp.phase === 'strike') {
      u = opp.phase === 'tell' ? clamp(opp.t / Math.max(0.01, tellLen()), 0, 1) : 1;
      if (opp.atk === 'lhook') {
        p.lArm = -0.7 * u; p.lOut = -22 * u; p.twist = 0.18 * u;
        p.glowL = 0.4 + 0.6 * u; p.lean = -8 * u;
        if (opp.phase === 'strike') { p.scaleL = 1.6; p.lOut = 18; p.lArm = 0.4; }
      } else if (opp.atk === 'rhook') {
        p.rArm = -0.7 * u; p.rOut = 22 * u; p.twist = -0.18 * u;
        p.glowR = 0.4 + 0.6 * u; p.lean = 8 * u;
        if (opp.phase === 'strike') { p.scaleR = 1.6; p.rOut = -18; p.rArm = 0.4; }
      } else if (opp.atk === 'jab') {
        p.lArm = -0.25 * u; p.glowL = 0.5 + 0.5 * u; p.y -= 4 * u;
        if (opp.phase === 'strike') { p.scaleL = 1.45; p.lOut = 8; }
      } else if (opp.atk === 'upper') {
        p.crouch = 14 * u; p.lLow = 16 * u; p.rLow = 16 * u;
        p.glowL = p.glowR = 0.3 + 0.7 * u; p.mouth = 1;
        if (opp.phase === 'strike') { p.crouch = -6; p.scaleL = p.scaleR = 1.35; p.lLow = p.rLow = -10; }
      } else if (opp.atk === 'body') {
        p.crouch = 10 * u; p.lLow = 10 * u; p.rLow = 10 * u;
        p.glowL = p.glowR = 0.45 * u;
        if (opp.phase === 'strike') { p.scaleL = 1.3; p.lOut = 6; }
      }
    } else if (opp.phase === 'open') {
      p.lArm = 0.35; p.rArm = 0.35; p.mouth = 1; p.eye = 1;
      p.lean = Math.sin(opp.t * 18) * 4;
    } else if (opp.phase === 'stun') {
      p.lean = Math.sin(opp.t * 30) * 6; p.eye = 1; p.mouth = 1;
      p.y -= 4;
    } else if (opp.phase === 'taunt') {
      p.rArm = -0.9; p.rOut = 10; p.mouth = 1;
    } else if (opp.phase === 'block') {
      p.lArm = -0.2; p.rArm = -0.2; p.y += 4;
    } else if (opp.phase === 'down') {
      p.down = clamp(opp.t * 2.2, 0, 1);
      p.y += 70 * p.down; p.rot = 1.15 * p.down; p.eye = 1;
    } else if (opp.phase === 'getup') {
      p.down = 1 - clamp(opp.t / 0.55, 0, 1);
      p.y += 70 * p.down; p.rot = 1.15 * p.down;
    }
    if (opp.hitFlash > 0) p.lean += (Math.random() - 0.5) * 6;
    return p;
  }

  function drawGlove(x, y, sc, rgb, lace, glow) {
    var r = 16 * sc * L.s;
    if (glow > 0) {
      ctx.fillStyle = rgba(GOLD, 0.18 * glow);
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), r * 1.45, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = rgba(rgb, 1);
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y), r, r * 0.86, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(lace, 0.9);
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y + 2 * sc), r * 0.42, r * 0.28, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(WHT, 0.35);
    ctx.lineWidth = 1.2 * L.s;
    ctx.beginPath();
    ctx.arc(sx(x - 3 * sc), sy(y - 3 * sc), r * 0.45, 0.2, 1.8);
    ctx.stroke();
  }

  function drawOpp() {
    var spec = G.spec;
    var opp = G.opp;
    var p = oppPose();
    var thin = spec.thin;
    var flashA = G.opp.hitFlash > 0;
    var skin = flashA ? WHT : spec.skin;
    var hx = p.x + p.lean;
    var hy = p.y + p.crouch;
    var i, ang;
    ctx.save();
    ctx.translate(sx(hx), sy(hy + 40));
    ctx.rotate(p.rot);
    ctx.translate(-sx(hx), -sy(hy + 40));

    ctx.fillStyle = rgba(spec.boot, 1);
    rr(sx(hx - 22 * thin), sy(hy + 78), 16 * L.s, 10 * L.s, 3 * L.s);
    ctx.fill();
    rr(sx(hx + 6 * thin), sy(hy + 78), 16 * L.s, 10 * L.s, 3 * L.s);
    ctx.fill();
    ctx.fillStyle = rgba(spec.shorts, 1);
    rr(sx(hx - 24 * thin), sy(hy + 42), 48 * thin * L.s, 38 * L.s, 8 * L.s);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.7);
    ctx.fillRect(sx(hx - 18 * thin), sy(hy + 44), 36 * thin * L.s, 3 * L.s);

    ctx.strokeStyle = rgba(skin, 1);
    ctx.lineWidth = 7 * thin * L.s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx(hx - 16), sy(hy + 18));
    ctx.quadraticCurveTo(sx(hx - 38 + p.lOut), sy(hy + 8 + p.lLow), sx(hx - 42 + p.lOut), sy(hy + 22 + p.lArm * 20 + p.lLow));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx(hx + 16), sy(hy + 18));
    ctx.quadraticCurveTo(sx(hx + 38 + p.rOut), sy(hy + 8 + p.rLow), sx(hx + 42 + p.rOut), sy(hy + 22 + p.rArm * 20 + p.rLow));
    ctx.stroke();

    ctx.fillStyle = rgba(spec.shirt, 1);
    rr(sx(hx - 28 * thin), sy(hy + 2), 56 * thin * L.s, 46 * L.s, 14 * L.s);
    ctx.fill();
    if (spec.id === 'gold') {
      ctx.strokeStyle = rgba(GOLD, 0.85);
      ctx.lineWidth = 2 * L.s;
      ctx.beginPath();
      ctx.arc(sx(hx), sy(hy + 8), 10 * L.s, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }

    ctx.fillStyle = rgba(skin, 1);
    ctx.beginPath();
    ctx.ellipse(sx(hx), sy(hy - 28), 22 * thin * L.s, 24 * L.s, 0, 0, TAU);
    ctx.fill();
    if (spec.bald < 0.7) {
      ctx.fillStyle = rgba(spec.hair, 1);
      ctx.beginPath();
      ctx.ellipse(sx(hx), sy(hy - 40), 20 * thin * L.s, 12 * L.s, 0, 0, TAU);
      ctx.fill();
      if (spec.bald > 0) {
        ctx.fillStyle = rgba(skin, 1);
        ctx.beginPath();
        ctx.ellipse(sx(hx), sy(hy - 38), 10 * L.s, 8 * L.s, 0, 0, TAU);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = rgba(spec.hair, 0.5);
      ctx.beginPath();
      ctx.ellipse(sx(hx), sy(hy - 46), 8 * L.s, 4 * L.s, 0, 0, TAU);
      ctx.fill();
    }
    if (spec.must) {
      ctx.fillStyle = rgba(spec.hair, 1);
      rr(sx(hx - 10), sy(hy - 18), 20 * L.s, 4 * L.s, 2 * L.s);
      ctx.fill();
    }
    ctx.fillStyle = '#1a1020';
    ctx.beginPath();
    ctx.ellipse(sx(hx - 7), sy(hy - 30), (p.eye ? 3.2 : 2.2) * L.s, (p.eye ? 1.2 : 2.6) * L.s, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sx(hx + 7), sy(hy - 30), (p.eye ? 3.2 : 2.2) * L.s, (p.eye ? 1.2 : 2.6) * L.s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(HOT, 0.7);
    ctx.lineWidth = 1.4 * L.s;
    ctx.beginPath();
    if (p.mouth) {
      ctx.arc(sx(hx), sy(hy - 16), 5 * L.s, 0.15, Math.PI - 0.15);
    } else {
      ctx.moveTo(sx(hx - 5), sy(hy - 16));
      ctx.lineTo(sx(hx + 5), sy(hy - 16));
    }
    ctx.stroke();

    drawGlove(hx - 44 + p.lOut, hy + 24 + p.lArm * 22 + p.lLow, p.scaleL, spec.glove, spec.lace, p.glowL);
    drawGlove(hx + 44 + p.rOut, hy + 24 + p.rArm * 22 + p.rLow, p.scaleR, spec.glove, spec.lace, p.glowR);

    if (opp.phase === 'tell') {
      ctx.fillStyle = rgba(GOLD, 0.85 + 0.15 * Math.sin(G.clock * 20));
      ctx.font = '900 ' + (22 * L.s) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', sx(hx + 34), sy(hy - 48));
    }
    if (opp.phase === 'stun' || opp.phase === 'open') {
      for (i = 0; i < 3; i++) {
        ang = G.clock * 4 + i * TAU / 3;
        starPath(sx(hx + Math.cos(ang) * 28), sy(hy - 52 + Math.sin(ang) * 6), 5 * L.s, ang);
        ctx.fillStyle = rgba(GOLD, 0.85);
        ctx.fill();
      }
    }
    ctx.restore();

    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.font = '800 ' + (13 * L.s) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(spec.name, sx(240), sy(96));
    ctx.fillStyle = rgba(spec.shirt, 0.9);
    ctx.font = '700 ' + (9 * L.s) + 'px sans-serif';
    ctx.fillText(spec.en, sx(240), sy(108));
  }

  function drawIncoming() {
    var opp = G.opp;
    var spec = G.spec;
    var u, sc, x, y, side, dodged;
    if (opp.phase !== 'strike' && !(opp.phase === 'open' && opp.t < 0.16)) return;
    u = opp.phase === 'strike' ? clamp(opp.t / Math.max(0.001, strikeLen()), 0, 1) : 1;
    dodged = opp.willOpen || opp.phase === 'open';
    side = atkSide(opp.atk);
    sc = lerp(1.1, dodged ? 1.6 : 2.4, u);
    x = 240 + side * (dodged ? 90 * u : 18 * (1 - u));
    y = lerp(170, dodged ? 210 : 280, u);
    drawGlove(x, y, sc, spec.glove, spec.lace, 1);
  }

  function drawPly() {
    var ply = G.ply;
    var ox = 0;
    var oy = 0;
    var duck = 0;
    var lx, ly, rx, ry, ext, blink;
    if (ply.pose === 'left') ox = -38;
    if (ply.pose === 'right') ox = 38;
    if (ply.pose === 'duck') duck = 26;
    if (ply.pose === 'hit') ox += Math.sin(G.clock * 40) * 5;
    if (ply.pose === 'down') {
      oy = 40; duck = 20;
    }
    oy += Math.sin(ply.bob * 5) * 2 + duck;
    ctx.fillStyle = rgba(HOT, 0.14);
    ctx.beginPath();
    ctx.ellipse(sx(240 + ox), sy(398), 70 * L.s, 10 * L.s, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgb(28, 22, 40)';
    ctx.beginPath();
    ctx.ellipse(sx(240 + ox), sy(318 + oy), 22 * L.s, 16 * L.s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgb(214, 164, 124)';
    ctx.beginPath();
    ctx.ellipse(sx(240 + ox), sy(328 + oy), 18 * L.s, 12 * L.s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.95);
    rr(sx(214 + ox), sy(338 + oy), 52 * L.s, 28 * L.s, 10 * L.s);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.7);
    ctx.fillRect(sx(222 + ox), sy(340 + oy), 36 * L.s, 3 * L.s);

    ext = 0;
    lx = 108 + ox * 0.7;
    ly = 378 + oy * 0.25;
    rx = 372 + ox * 0.7;
    ry = 378 + oy * 0.25;
    if (ply.punch === 'L') {
      ext = clamp(ply.punchT / PUNCH_HIT, 0, 1);
      if (ply.punchT > PUNCH_HIT) ext = 1 - (ply.punchT - PUNCH_HIT) / (PUNCH_T - PUNCH_HIT);
      lx = lerp(108, 210, ext);
      ly = lerp(378, 200, ext);
    }
    if (ply.punch === 'R') {
      ext = clamp(ply.punchT / PUNCH_HIT, 0, 1);
      if (ply.punchT > PUNCH_HIT) ext = 1 - (ply.punchT - PUNCH_HIT) / (PUNCH_T - PUNCH_HIT);
      rx = lerp(372, 270, ext);
      ry = lerp(378, 200, ext);
    }
    G.gloveL.x = lx; G.gloveL.y = ly; G.gloveL.r = 52;
    G.gloveR.x = rx; G.gloveR.y = ry; G.gloveR.r = 52;
    drawGlove(lx, ly, ply.punch === 'L' ? lerp(1.55, 2.05, ext) : 1.55, HOT, GOLD, ply.punch === 'L' ? 1 : 0.2);
    drawGlove(rx, ry, ply.punch === 'R' ? lerp(1.55, 2.05, ext) : 1.55, HOT, GOLD, ply.punch === 'R' ? 1 : 0.2);

    blink = ply.inv > 0 && ((G.clock * 12) | 0) % 2 === 0;
    if (blink) {
      ctx.fillStyle = 'rgba(0,240,255,0.12)';
      ctx.fillRect(sx(0), sy(280), WORLD_W * L.s, 140 * L.s);
    }

    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.font = '800 ' + (11 * L.s) + 'px sans-serif';
    ctx.textAlign = 'center';
    for (ext = 0; ext < 3; ext++) {
      starPath(sx(240 - 16 + ext * 16), sy(404), (ext < G.stars ? 6 : 4) * L.s, -0.2);
      ctx.fillStyle = ext < G.stars ? rgba(GOLD, 1) : 'rgba(255,227,107,0.2)';
      ctx.fill();
    }
  }

  function drawBars() {
    var x = sx(150), y = sy(78), w = 180 * L.s, h = 7 * L.s, r;
    r = G.opp ? G.opp.stam / G.opp.max : 1;
    ctx.fillStyle = 'rgba(8,6,18,0.65)';
    rr(x, y, w, h, 4 * L.s);
    ctx.fill();
    ctx.fillStyle = rgba(r < 0.28 ? MAG : GOLD, 0.9);
    rr(x, y, w * clamp(r, 0, 1), h, 4 * L.s);
    ctx.fill();
  }

  function drawCount() {
    var n = 0, mash = 0, down = false;
    if (G.opp && G.opp.phase === 'down') { n = G.opp.count; down = true; }
    if (G.ply && G.ply.pose === 'down') { n = G.ply.count; mash = G.ply.mash; down = true; }
    if (!down || n <= 0) return;
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.font = '900 ' + (64 * L.s) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(n), sx(240), sy(210));
    ctx.textBaseline = 'alphabetic';
    if (G.ply && G.ply.pose === 'down' && G.ply.kd < KD_LIM) {
      ctx.fillStyle = 'rgba(8,6,18,0.7)';
      rr(sx(170), sy(252), 140 * L.s, 10 * L.s, 4 * L.s);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.9);
      rr(sx(170), sy(252), 140 * L.s * clamp(mash, 0, 1), 10 * L.s, 4 * L.s);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.font = '700 ' + (10 * L.s) + 'px sans-serif';
      ctx.fillText('连打起身', sx(240), sy(278));
    }
  }

  function drawFx() {
    var i, p, a;
    for (i = 0; i < rings.length; i++) {
      p = rings[i];
      a = 1 - p.t / 0.45;
      ctx.strokeStyle = rgba(p.rgb, a);
      ctx.lineWidth = 2.4 * L.s;
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), (p.r + p.t * 90) * L.s, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.t / p.max, 0, 1));
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * L.s, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < sparks.length; i++) {
      p = sparks[i];
      ctx.strokeStyle = rgba(p.rgb, clamp(p.t / 0.28, 0, 1));
      ctx.lineWidth = 1.4 * L.s;
      ctx.beginPath();
      ctx.moveTo(sx(p.x), sy(p.y));
      ctx.lineTo(sx(p.x - p.vx * 0.04), sy(p.y - p.vy * 0.04));
      ctx.stroke();
    }
    for (i = 0; i < starsFx.length; i++) {
      p = starsFx[i];
      starPath(sx(p.x), sy(p.y), p.r * L.s * clamp(p.t / 0.3, 0.3, 1), p.rot);
      ctx.fillStyle = rgba(p.rgb, clamp(p.t / p.max, 0, 1));
      ctx.fill();
    }
    for (i = 0; i < floats.length; i++) {
      p = floats[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.t / p.life, 0, 1));
      ctx.font = '800 ' + (16 * L.s) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.text, sx(p.x), sy(p.y));
    }
    for (i = 0; i < sweat.length; i++) {
      p = sweat[i];
      ctx.fillStyle = 'rgba(180,220,255,' + clamp(p.t / 0.4, 0, 1) + ')';
      ctx.beginPath();
      ctx.ellipse(sx(p.x), sy(p.y), 1.6 * L.s, 3.2 * L.s, 0, 0, TAU);
      ctx.fill();
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.35);
    ctx.fillRect(0, 0, cssW, cssH);
  }

  function drawVignette() {
    var atk, a;
    if (!G.opp || G.opp.phase !== 'tell') return;
    atk = G.opp.atk;
    a = 0.12 + 0.1 * Math.sin(G.clock * 14);
    if (atk === 'lhook') {
      ctx.fillStyle = 'rgba(0,240,255,' + a + ')';
      ctx.fillRect(sx(0), sy(0), 90 * L.s, WORLD_H * L.s);
    } else if (atk === 'rhook') {
      ctx.fillStyle = 'rgba(255,61,184,' + a + ')';
      ctx.fillRect(sx(390), sy(0), 90 * L.s, WORLD_H * L.s);
    } else if (atk === 'jab') {
      ctx.fillStyle = 'rgba(0,240,255,' + a + ')';
      ctx.fillRect(sx(180), sy(70), 120 * L.s, 150 * L.s);
    } else if (atk === 'upper') {
      ctx.fillStyle = 'rgba(255,227,107,' + a + ')';
      ctx.fillRect(sx(0), sy(300), WORLD_W * L.s, 120 * L.s);
    } else if (atk === 'body') {
      ctx.fillStyle = 'rgba(255,58,34,' + a + ')';
      ctx.fillRect(sx(140), sy(200), 200 * L.s, 80 * L.s);
    }
  }

  function drawIntro() {
    var a, t;
    if (G.intro <= 0 || G.mode !== 'play') return;
    t = clamp(G.intro / 1.35, 0, 1);
    a = t > 0.28 ? 1 : t / 0.28;
    ctx.fillStyle = 'rgba(8,6,18,' + (0.62 * a) + ')';
    rr(sx(108), sy(118), 264 * L.s, 58 * L.s, 14 * L.s);
    ctx.fill();
    ctx.strokeStyle = rgba(GOLD, 0.45 * a);
    ctx.lineWidth = 1.4 * L.s;
    rr(sx(108), sy(118), 264 * L.s, 58 * L.s, 14 * L.s);
    ctx.stroke();
    ctx.fillStyle = rgba(GOLD, 0.95 * a);
    ctx.font = '900 ' + (26 * L.s) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(G.spec.name, sx(240), sy(146));
    ctx.font = '700 ' + (12 * L.s) + 'px sans-serif';
    ctx.fillStyle = rgba(CYN, 0.9 * a);
    ctx.fillText('第 ' + G.fight + ' 场', sx(240), sy(166));
  }

  function draw() {
    var shx, shy, g;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    shx = (G.shake ? (Math.random() - 0.5) * G.shake : 0) + G.kickX;
    shy = (G.shake ? (Math.random() - 0.5) * G.shake * 0.55 : 0) + G.kickY;
    ctx.translate(shx, shy);
    ctx.fillStyle = '#07030b';
    ctx.fillRect(0, 0, cssW, cssH);
    g = ctx.createRadialGradient(sx(240), sy(40), 10, sx(240), sy(40), 260 * L.s);
    g.addColorStop(0, 'rgba(255,58,34,0.16)');
    g.addColorStop(1, 'rgba(255,58,34,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cssW, cssH);
    drawCrowd();
    drawLamp();
    drawRing();
    drawVignette();
    drawBars();
    if (G.opp) drawOpp();
    drawIncoming();
    if (G.ply) drawPly();
    drawFx();
    drawCount();
    drawIntro();
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
  function bindEdge(el, fn) {
    el.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      el.classList.add('held');
      audio.ensure();
      fn();
      try { el.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
    });
    function up(ev) {
      ev.preventDefault();
      el.classList.remove('held');
    }
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  bindHold(btnLeft, function (v) { keys.l = v; });
  bindHold(btnRight, function (v) { keys.r = v; });
  bindHold(btnDuck, function (v) { keys.d = v; });
  bindEdge(btnPl, function () { tryPunch('L'); });
  bindEdge(btnPr, function () { tryPunch('R'); });

  function worldFromPtr(ev) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: (ev.clientX - rect.left - L.x) / L.s,
      y: (ev.clientY - rect.top - L.y) / L.s
    };
  }

  canvas.addEventListener('pointerdown', function (ev) {
    var w, dl, dr;
    ev.preventDefault();
    audio.ensure();
    w = worldFromPtr(ev);
    dl = hypot(w.x - G.gloveL.x, w.y - G.gloveL.y);
    dr = hypot(w.x - G.gloveR.x, w.y - G.gloveR.y);
    if (dl < G.gloveL.r + 8) { tryPunch('L'); return; }
    if (dr < G.gloveR.r + 8) { tryPunch('R'); return; }
    if (w.y > 290) {
      if (w.x < 160) ptr.l = true;
      else if (w.x > 320) ptr.r = true;
      else ptr.d = true;
    }
  });
  canvas.addEventListener('pointerup', function () {
    ptr.l = ptr.r = ptr.d = false;
  });
  canvas.addEventListener('pointercancel', function () {
    ptr.l = ptr.r = ptr.d = false;
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  function keyOn(e, down) {
    var k = e.code;
    if (k === 'ArrowLeft' || k === 'KeyA') { keys.l = down; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { keys.r = down; e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { keys.d = down; e.preventDefault(); }
    else if (k === 'KeyZ' || k === 'KeyJ') {
      if (down && !e.repeat) tryPunch('L');
      e.preventDefault();
    } else if (k === 'KeyX' || k === 'KeyK') {
      if (down && !e.repeat) tryPunch('R');
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
        startRun('challenge');
        e.preventDefault();
        return;
      }
      if (e.code === 'Digit2') {
        startRun('gauntlet');
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
  btnCh.addEventListener('click', function () {
    audio.ensure();
    startRun('challenge');
  });
  btnGa.addEventListener('click', function () {
    audio.ensure();
    startRun('gauntlet');
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
