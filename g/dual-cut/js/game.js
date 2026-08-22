'use strict';

/* 双截 — Double Dragon lite. No CDN. */

(function () {
  var VW = 640;
  var VH = 360;
  var GY = 318;
  var ZS = 0.72;
  var ZMIN = 4;
  var ZMAX = 88;
  var LIVES = 3;
  var LIFE_CAP = 6;
  var LIFE_EVERY = 20000;
  var HP_MAX = 16;
  var STEP = 1 / 60;
  var TAU = Math.PI * 2;
  var COMBO_WIN = 1.55;
  var WALK = 168;
  var WALK_Z = 96;
  var AIR = 0.88;
  var JUMP_V = 420;
  var GRAV = 1280;
  var MAX_FALL = 620;
  var INVULN = 0.92;
  var DIE_T = 0.85;
  var BEST_KEY = 'playbox-dual-cut-best';
  var MUTE_KEY = 'playbox-dual-cut-mute';
  var OPS = '方向 / WASD 走 · 空格跳 · Z 拳 · X 踢 · R 重开 · M 静音';

  var MAG = [255, 61, 184];
  var CYN = [0, 240, 255];
  var GOLD = [255, 227, 107];
  var HOT = [255, 75, 10];
  var HOT2 = [255, 138, 72];
  var WHT = [246, 243, 239];
  var LEAF = [61, 255, 122];
  var PUR = [168, 92, 255];
  var BRN = [196, 122, 52];
  var SKIN = [232, 176, 132];

  var SCORE = {
    hit: 50, kick: 80, wep: 110, throw: 200,
    thug: 220, whip: 320, brute: 420, boss: 4200,
    stage: 1800, rescue: 8000, wave: 700, pickup: 80
  };

  var KINDS = {
    thug: { hp: 4, name: '混混', spd: 78, dmg: 2, score: 'thug', scale: 1, reach: 30, think: 0.7 },
    whip: { hp: 5, name: '鞭女', spd: 86, dmg: 2, score: 'whip', scale: 0.96, reach: 58, think: 0.55 },
    brute: { hp: 8, name: '壮汉', spd: 58, dmg: 3, score: 'brute', scale: 1.18, reach: 34, think: 0.85 },
    boss: { hp: 22, name: '头目', spd: 72, dmg: 3, score: 'boss', scale: 1.32, reach: 36, think: 0.48 }
  };

  var STAGES = [
    {
      name: '夜巷', w: 2040, theme: 'street',
      ents: [
        [360, 28, 'thug'], [520, 58, 'thug'], [700, 22, 'thug'],
        [920, 44, 'whip'], [1140, 30, 'thug'], [1280, 64, 'thug'],
        [1480, 36, 'brute'], [1680, 50, 'thug']
      ],
      weps: [[640, 40, 'bat']],
      boss: null, rescue: false
    },
    {
      name: '工厂', w: 2280, theme: 'factory',
      ents: [
        [320, 24, 'thug'], [480, 60, 'whip'], [640, 36, 'thug'],
        [820, 20, 'brute'], [1040, 52, 'whip'], [1220, 30, 'thug'],
        [1400, 66, 'thug'], [1580, 28, 'whip'], [1760, 44, 'brute'],
        [1960, 34, 'thug']
      ],
      weps: [[900, 48, 'whip'], [1500, 26, 'bat']],
      boss: null, rescue: false
    },
    {
      name: '巢穴', w: 2160, theme: 'lair',
      ents: [
        [300, 30, 'thug'], [460, 58, 'whip'], [640, 24, 'brute'],
        [860, 44, 'thug'], [1040, 62, 'whip'], [1220, 28, 'thug'],
        [1400, 50, 'brute'], [1560, 22, 'whip']
      ],
      weps: [[720, 38, 'bat']],
      boss: [1780, 40], rescue: true
    }
  ];

  var ATK = {
    jab:   { t: 0.20, h0: 0.04, h1: 0.12, dmg: 1, reach: 28, knock: 42, stun: 0.22, down: false, stop: 0.045, pose: 'punch' },
    cross: { t: 0.24, h0: 0.05, h1: 0.14, dmg: 1, reach: 32, knock: 56, stun: 0.26, down: false, stop: 0.05, pose: 'punch' },
    upper: { t: 0.34, h0: 0.10, h1: 0.20, dmg: 2, reach: 30, knock: 88, stun: 0.12, down: true,  stop: 0.07, pose: 'upper' },
    kick:  { t: 0.26, h0: 0.07, h1: 0.16, dmg: 1, reach: 34, knock: 62, stun: 0.24, down: false, stop: 0.055, pose: 'kick' },
    round: { t: 0.34, h0: 0.10, h1: 0.22, dmg: 2, reach: 38, knock: 96, stun: 0.12, down: true,  stop: 0.07, pose: 'round' },
    jkick: { t: 0.30, h0: 0.04, h1: 0.22, dmg: 2, reach: 32, knock: 78, stun: 0.14, down: true,  stop: 0.06, pose: 'jkick' },
    bat:   { t: 0.30, h0: 0.07, h1: 0.20, dmg: 3, reach: 46, knock: 110, stun: 0.14, down: true, stop: 0.065, pose: 'bat' },
    whip:  { t: 0.32, h0: 0.10, h1: 0.22, dmg: 2, reach: 64, knock: 54, stun: 0.28, down: false, stop: 0.055, pose: 'whip' },
    throw: { t: 0.42, h0: 0.08, h1: 0.20, dmg: 3, reach: 20, knock: 180, stun: 0.1, down: true,  stop: 0.08, pose: 'throw' }
  };

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
    return 1 + Math.min(4, Math.max(0, Math.floor(((n | 0) - 1) / 2)));
  }
  function wepName(k) {
    if (k === 'bat') return '铁棍';
    if (k === 'whip') return '长鞭';
    return '徒手';
  }
  function kindHp(kind, wave) {
    var base = KINDS[kind] ? KINDS[kind].hp : 4;
    if (!wave) return base;
    return Math.max(2, Math.round(base * (1 + Math.max(0, wave - 1) * 0.08)));
  }
  function waveCount(n) {
    return Math.min(8, 2 + ((n * 0.75) | 0));
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
  function punchChain(n) {
    if (n <= 1) return 'jab';
    if (n === 2) return 'cross';
    return 'upper';
  }
  function kickChain(n) {
    return n <= 1 ? 'kick' : 'round';
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (HP_MAX < 12) throw new Error('hp');
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(3) !== 2) throw new Error('combo 3');
    if (comboMul(9) !== 5) throw new Error('combo 9');
    if (punchChain(1) !== 'jab' || punchChain(3) !== 'upper') throw new Error('punch chain');
    if (kickChain(2) !== 'round') throw new Error('kick chain');
    if (wepName('bat') !== '铁棍' || wepName(null) !== '徒手') throw new Error('wep name');
    if (kindHp('thug', 0) !== 4) throw new Error('thug hp');
    if (kindHp('boss', 1) <= kindHp('brute', 1)) throw new Error('boss hp');
    if (waveCount(1) < 2 || waveCount(20) > 8) throw new Error('wave cap');
    if (BEST_KEY !== 'playbox-dual-cut-best') throw new Error('best key');
    if (ATK.whip.reach <= ATK.bat.reach) throw new Error('whip longer');
    if (ATK.upper.down !== true || ATK.jab.down !== false) throw new Error('knockdown');
    if (STAGES[2].rescue !== true || STAGES[0].rescue) throw new Error('rescue last');
    if (STAGES[0].w >= STAGES[1].w) throw new Error('wider later');
    if (!KINDS.whip || !KINDS.thug || !KINDS.boss) throw new Error('kinds');
    if (JUMP_V * JUMP_V / (2 * GRAV) < 50) throw new Error('jump');
    var i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ents.length) throw new Error('ents');
      if (s.w < 1600) throw new Error('short stage');
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
  var btnStreet = document.getElementById('btn-street');
  var btnWave = document.getElementById('btn-wave');
  var ovAgain = document.getElementById('ov-again');
  var ovMenu = document.getElementById('ov-menu');
  var modeStreet = document.getElementById('mode-street');
  var modeWave = document.getElementById('mode-wave');
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
  var wepLabel = document.getElementById('wep-label');
  var hpBar = document.getElementById('hp-bar');
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

  var keys = { l: false, r: false, u: false, d: false, jump: false };
  var demo = { l: false, r: true, u: false, d: false, jump: false, punch: false, kick: false };
  var pips = [];
  var particles = [];
  var sparks = [];
  var rings = [];
  var floats = [];
  var trails = [];

  var G = {
    mode: 'title',
    kind: 'street',
    t: 0,
    clock: 0,
    stage: 1,
    wave: 1,
    camX: 0,
    camY: 0,
    levelW: 2040,
    theme: 'street',
    ents: [],
    weps: [],
    player: null,
    hostage: null,
    lives: LIVES,
    hp: HP_MAX,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    chainN: 0,
    wep: null,
    wepHits: 0,
    atk: null,
    atkT: 0,
    atkHit: false,
    atkBuf: 0,
    grab: null,
    throwT: 0,
    jumpBuf: 0,
    jumpHeld: false,
    airAtk: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    toastT: 0,
    nextLife: LIFE_EVERY,
    lock: 0,
    why: '',
    rescued: false,
    waveT: 0,
    waveLeft: 0,
    spawnQ: []
  };

  function isWave() {
    return G.kind === 'wave';
  }
  function playing() {
    return G.mode === 'play';
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function inL() { return G.mode === 'title' ? demo.l : keys.l; }
  function inR() { return G.mode === 'title' ? demo.r : keys.r; }
  function inU() { return G.mode === 'title' ? demo.u : keys.u; }
  function inD() { return G.mode === 'title' ? demo.d : keys.d; }
  function inJump() { return G.mode === 'title' ? demo.jump : keys.jump; }

  function sx(x) { return ox + (x - G.camX) * scale; }
  function sy(y) { return oy + (y - G.camY) * scale; }
  function feetY(z, h) { return GY - z * ZS - (h || 0); }
  function toY(e) { return feetY(e.z, e.h); }

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
      this.noise(0.05, 0.034, 1600);
      this.beep(380, 0.07, 'sawtooth', 0.04, 140);
    },
    punch: function (combo) {
      this.ensure();
      var lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.04, 0.04, 900);
      this.beep(220 * lift, 0.07, 'square', 0.05, 90);
      this.beep(520 * lift, 0.05, 'triangle', 0.03, 180);
    },
    kick: function (combo) {
      this.ensure();
      var lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.05, 0.042, 700);
      this.beep(180 * lift, 0.08, 'sawtooth', 0.048, 70);
    },
    bat: function () {
      this.ensure();
      this.noise(0.06, 0.05, 500);
      this.beep(140, 0.1, 'square', 0.055, 60);
      this.beep(420, 0.06, 'triangle', 0.03, 180);
    },
    whip: function () {
      this.ensure();
      this.noise(0.05, 0.046, 2200);
      this.beep(980, 0.06, 'square', 0.04, 420);
      this.beep(1540, 0.04, 'triangle', 0.028, 880);
    },
    throw: function () {
      this.ensure();
      this.noise(0.08, 0.05, 400);
      this.beep(160, 0.14, 'sawtooth', 0.05, 70);
    },
    hop: function () {
      this.ensure();
      this.beep(280, 0.06, 'square', 0.04, 620);
    },
    land: function () {
      this.ensure();
      this.noise(0.04, 0.026, 500);
      this.beep(140, 0.05, 'triangle', 0.022, 80);
    },
    pickup: function () {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.04, 990);
      this.beep(990, 0.1, 'triangle', 0.035, 1320);
    },
    breakW: function () {
      this.ensure();
      this.noise(0.1, 0.05, 600);
      this.beep(240, 0.12, 'sawtooth', 0.04, 80);
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
    rescue: function () {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.042, 784);
      this.beep(784, 0.12, 'triangle', 0.038, 1046);
    },
    wave: function () {
      this.ensure();
      this.beep(220, 0.1, 'sawtooth', 0.04, 110);
      this.beep(440, 0.12, 'square', 0.035, 330);
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
  function addScore(n) {
    if ((!playing() && G.mode !== 'title') || n <= 0) return;
    if (G.mode === 'title') return;
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
    var w = isWave();
    if (modeStreet) modeStreet.setAttribute('aria-pressed', w ? 'false' : 'true');
    if (modeWave) modeWave.setAttribute('aria-pressed', w ? 'true' : 'false');
  }
  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 3);
    if (stageLabel) {
      if (isWave()) stageLabel.textContent = '波 ' + G.wave;
      else stageLabel.textContent = (STAGES[G.stage - 1] || STAGES[0]).name;
      stageLabel.classList.toggle('hot', isWave() ? G.wave >= 5 : G.stage >= 3);
    }
    if (tagLabel) {
      tagLabel.textContent = isWave() ? '无尽' : '巷战';
      tagLabel.classList.toggle('warn', isWave());
      tagLabel.classList.toggle('hot', !isWave() && G.stage >= 3);
    }
    if (wepLabel) {
      wepLabel.textContent = wepName(G.wep);
      wepLabel.classList.toggle('empty', !G.wep);
      wepLabel.classList.toggle('hot', !!G.wep);
    }
    if (hpBar) {
      var r = G.hp / HP_MAX;
      hpBar.style.transform = 'scaleX(' + clamp(r, 0, 1) + ')';
      hpBar.classList.toggle('low', r <= 0.34);
    }
    syncPips();
    syncModes();
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'DRAGON';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' && !isWave() ? '无尽' : '换模式';
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
  function swingTrail(x, y, z, face, kind) {
    trails.push({
      x: x, y: y, z: z, face: face, kind: kind || 'punch', t: 0, life: 0.16
    });
    capArr(trails, 18);
  }

  function makePlayer(x, z) {
    return {
      x: x, z: z, h: 0, vx: 0, vz: 0, vh: 0,
      face: 1, grounded: true, coyote: 0, run: 0,
      squash: 1, act: 'idle', hurtT: 0, downT: 0
    };
  }
  function makeEnt(x, z, kind, wave) {
    var spec = KINDS[kind] || KINDS.thug;
    return {
      x: x, z: z, h: 0, vx: 0, vz: 0, vh: 0,
      face: x > 400 ? -1 : 1,
      kind: kind,
      hp: kindHp(kind, wave),
      max: kindHp(kind, wave),
      spd: spec.spd,
      dmg: spec.dmg,
      scale: spec.scale,
      reach: spec.reach,
      think: rand(0.1, spec.think),
      act: 'idle',
      atkT: 0,
      atkHit: false,
      stunT: 0,
      downT: 0,
      getupT: 0,
      hurtT: 0,
      deadT: 0,
      dead: false,
      flash: 0,
      run: rand(0, 8),
      cd: rand(0.2, 0.8),
      drop: kind === 'whip' ? 'whip' : (kind === 'brute' || kind === 'thug') && hash2((x * 13) | 0) > 0.72 ? 'bat' : null
    };
  }
  function makeWep(x, z, kind) {
    return { x: x, z: z, kind: kind, bob: rand(0, TAU), dead: false };
  }
  function makeHostage(x, z) {
    return { x: x, z: z, h: 0, face: -1, free: false, bob: 0 };
  }

  function clearFx() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    trails.length = 0;
  }

  function loadStage(n, demoMode) {
    var spec = STAGES[clamp(n, 1, STAGES.length) - 1];
    var i, e;
    G.stage = n;
    G.theme = spec.theme;
    G.levelW = spec.w;
    G.ents = [];
    G.weps = [];
    G.hostage = null;
    G.rescued = false;
    G.camX = 0;
    G.camY = 0;
    G.player = makePlayer(72, 36);
    G.atk = null;
    G.atkT = 0;
    G.atkHit = false;
    G.atkBuf = 0;
    G.grab = null;
    G.throwT = 0;
    G.airAtk = false;
    G.deadT = 0;
    G.lock = 0;
    G.chainN = 0;
    if (!demoMode) {
      for (i = 0; i < spec.ents.length; i++) {
        e = spec.ents[i];
        G.ents.push(makeEnt(e[0], e[1], e[2], 0));
      }
      if (spec.boss) G.ents.push(makeEnt(spec.boss[0], spec.boss[1], 'boss', 0));
      for (i = 0; i < spec.weps.length; i++) {
        e = spec.weps[i];
        G.weps.push(makeWep(e[0], e[1], e[2]));
      }
      if (spec.rescue) G.hostage = makeHostage(spec.w - 90, 42);
    } else {
      G.ents.push(makeEnt(420, 30, 'thug', 0));
      G.ents.push(makeEnt(620, 55, 'whip', 0));
      G.ents.push(makeEnt(820, 24, 'thug', 0));
      G.weps.push(makeWep(520, 40, 'bat'));
    }
  }

  function spawnWave(n) {
    var count = waveCount(n);
    var i, kind, side, x, z;
    G.wave = n;
    G.waveLeft = count;
    G.waveT = 0.55;
    G.spawnQ = [];
    for (i = 0; i < count; i++) {
      if (n >= 5 && n % 5 === 0 && i === 0) kind = 'boss';
      else if (n >= 3 && i % 3 === 0) kind = 'whip';
      else if (n >= 4 && i % 4 === 1) kind = 'brute';
      else kind = 'thug';
      side = i % 2 === 0 ? 1 : -1;
      x = G.player.x + side * rand(280, 420);
      z = rand(ZMIN + 8, ZMAX - 10);
      G.spawnQ.push({ t: 0.15 * i, kind: kind, x: x, z: z });
    }
    toast('第 ' + n + ' 波', false, n % 5 === 0);
    audio.wave();
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'wave' ? 'wave' : 'street';
    G.mode = 'play';
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.wep = null;
    G.wepHits = 0;
    G.nextLife = LIFE_EVERY;
    G.why = '';
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.invuln = 0.4;
    G.wave = 1;
    G.atk = null;
    G.atkT = 0;
    G.atkHit = false;
    G.atkBuf = 0;
    G.grab = null;
    G.throwT = 0;
    G.deadT = 0;
    G.chainN = 0;
    clearFx();
    if (isWave()) {
      G.theme = 'street';
      G.levelW = 2400;
      G.ents = [];
      G.weps = [makeWep(420, 40, 'bat')];
      G.hostage = null;
      G.player = makePlayer(320, 40);
      G.camX = 0;
      G.stage = 1;
      spawnWave(1);
    } else {
      loadStage(1, false);
    }
    hideOverlay();
    audio.start();
    toast(isWave() ? '无尽' : STAGES[0].name, false, !isWave());
    setHint(isWave() ? '一波接一波 · 连击抓投 · 捡武器' : '打到尽头 · 连击抓投 · 第三关救人', '');
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'street';
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    G.wep = null;
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '双截', '侧向巷战，拳脚连击。捡棍鞭，抓住再甩出去。打到尽头救人。');
    setHint('走跳 · Z拳 X踢 · 连击抓投 · 捡棍鞭 · 尽头救人', '');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('street');
    else startGame(G.kind || 'street');
  }
  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('street');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    kick(7, 'die');
    var why = G.why === 'life' ? '体力见底，倒在巷里。' : '被打趴了。';
    showOverlay('lose', '倒了', why + ' 分数 ' + G.score + ' · 最高连击 ' + G.maxCombo);
    setHint('R 立刻重开', 'warn');
    syncHud();
  }
  function goWin() {
    G.mode = 'win';
    audio.win();
    kick(2, 'win-flash');
    screenFlash(GOLD, 0.5);
    var msg = isWave()
      ? '撑到第 ' + G.wave + ' 波。分数 ' + G.score
      : '把人救出来了。分数 ' + G.score + ' · 最高连击 ' + G.maxCombo;
    showOverlay('win', isWave() ? '巷战不熄' : '救回了', msg);
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

  function zOk(a, b) {
    return Math.abs(a.z - b.z) < 16;
  }
  function inFront(att, vic, reach) {
    var dx = (vic.x - att.x) * att.face;
    return dx > -8 && dx < reach && zOk(att, vic) && Math.abs((att.h || 0) - (vic.h || 0)) < 36;
  }
  function nearestEnemy(x, z, lim) {
    var best = null, bd = lim * lim, i, e, d;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead || e.deadT > 0 || e.downT > 0) continue;
      d = (e.x - x) * (e.x - x) + (e.z - z) * (e.z - z) * 2.2;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  function magnetZ(p, reach) {
    var e = nearestEnemy(p.x + p.face * reach * 0.45, p.z, reach + 18);
    if (!e) return;
    if (Math.abs(e.x - p.x) < reach + 12 && Math.abs(e.z - p.z) < 28) {
      p.z = lerp(p.z, e.z, 0.38);
    }
  }

  function hitEnemy(e, dmg, knock, stun, down, src) {
    if (e.dead || e.deadT > 0 || e.getupT > 0) return false;
    e.hp -= dmg;
    e.hurtT = 0.16;
    e.flash = 0.12;
    e.face = src.face > 0 ? -1 : 1;
    e.vx = src.face * knock;
    e.vz = 0;
    e.atkT = 0;
    e.act = 'hurt';
    if (down || e.hp <= 0) {
      e.downT = e.hp <= 0 ? 0.55 : 0.72;
      e.stunT = 0;
      e.vh = 90;
      e.h = Math.max(e.h, 8);
      e.act = 'down';
    } else {
      e.stunT = stun;
    }
    bumpCombo();
    var pts = Math.round((dmg >= 3 ? SCORE.wep : dmg >= 2 ? SCORE.kick : SCORE.hit) * G.mult);
    addScore(pts);
    popFloat(e.x, toY(e) - 34, '+' + pts, GOLD);
    popSpark(e.x + src.face * 10, toY(e) - 18, G.combo >= 5 ? GOLD : HOT, 14 + dmg * 3);
    emit(8 + dmg * 2, {
      x: e.x + src.face * 8, y: toY(e) - 16, j: 8,
      vx0: src.face * 40, vx1: src.face * 220, vy0: -180, vy1: 40,
      life: 0.32, r0: 1.2, r1: 3.2, rgb: G.combo >= 4 ? GOLD : HOT2, g: 380
    });
    if (e.hp <= 0) {
      e.deadT = 0.55;
      var base = SCORE[KINDS[e.kind] ? KINDS[e.kind].score : 'thug'] || 200;
      var bonus = Math.round(base * G.mult);
      addScore(bonus);
      popFloat(e.x, toY(e) - 50, KINDS[e.kind] ? KINDS[e.kind].name : 'KO', CYN);
      if (e.drop && hash2((e.x * 7) | 0) > 0.35) {
        G.weps.push(makeWep(e.x, e.z, e.drop));
      }
      if (isWave()) {
        G.waveLeft = Math.max(0, G.waveLeft - 1);
      }
    }
    return true;
  }

  function hurtPlayer(dmg, from) {
    if (!playing() || G.invuln > 0 || G.deadT > 0) return;
    var p = G.player;
    G.hp -= dmg;
    if (G.hp < 0) G.hp = 0;
    G.invuln = INVULN;
    p.hurtT = 0.22;
    p.act = 'hurt';
    p.vx = (from && from.x < p.x ? 1 : -1) * 140;
    G.atk = null;
    G.atkT = 0;
    G.grab = null;
    dropCombo();
    audio.hurt();
    kick(4.2, 'hit');
    screenFlash(MAG, 0.32);
    emit(10, {
      x: p.x, y: toY(p) - 16, j: 10,
      vx0: -160, vx1: 160, vy0: -160, vy1: 20,
      life: 0.28, r0: 1.4, r1: 3, rgb: MAG, g: 360
    });
    if (G.wep && Math.random() < 0.22) {
      G.weps.push(makeWep(p.x - p.face * 16, p.z, G.wep));
      G.wep = null;
      G.wepHits = 0;
      toast('武器掉了', true, false);
      syncHud();
    }
    syncHud();
    if (G.hp <= 0) loseLife();
  }

  function loseLife() {
    G.lives -= 1;
    G.deadT = DIE_T;
    G.hp = 0;
    G.player.act = 'down';
    G.player.vh = 60;
    G.why = 'life';
    audio.death();
    kick(6.5, 'die');
    syncPips();
    toast(G.lives > 0 ? '再来' : '倒了', true, false);
  }

  function respawn() {
    var p = G.player;
    G.hp = HP_MAX;
    G.deadT = 0;
    G.invuln = 1.35;
    G.atk = null;
    G.atkT = 0;
    G.grab = null;
    p.h = 0;
    p.vh = 0;
    p.vx = 0;
    p.act = 'idle';
    p.grounded = true;
    p.hurtT = 0;
    syncHud();
  }

  function beginAtk(name) {
    var spec = ATK[name];
    if (!spec) return;
    var p = G.player;
    if (p.hurtT > 0 || G.deadT > 0 || G.grab) return;
    G.atk = name;
    G.atkT = spec.t;
    G.atkHit = false;
    p.act = spec.pose;
    magnetZ(p, spec.reach);
    swingTrail(p.x, toY(p) - 18, p.z, p.face, name);
    if (name === 'bat') {
      audio.bat();
      emit(10, {
        x: p.x + p.face * 22, y: toY(p) - 16, j: 10,
        vx0: p.face * 40, vx1: p.face * 260, vy0: -80, vy1: 80,
        life: 0.22, r0: 1.2, r1: 2.8, rgb: BRN, g: 280
      });
    } else if (name === 'whip') {
      audio.whip();
      emit(8, {
        x: p.x + p.face * 30, y: toY(p) - 18, j: 14,
        vx0: p.face * 80, vx1: p.face * 320, vy0: -40, vy1: 40,
        life: 0.2, r0: 1, r1: 2.2, rgb: MAG, g: 240
      });
    } else if (name === 'kick' || name === 'round' || name === 'jkick') {
      audio.whoosh();
    } else {
      audio.whoosh();
    }
  }

  function doPunch() {
    var p = G.player;
    if (!playing() && G.mode !== 'title') return;
    if (G.deadT > 0 || p.hurtT > 0) return;
    if (G.grab) { doThrow(); return; }
    if (!p.grounded) {
      if (G.airAtk) return;
      G.airAtk = true;
      beginAtk('jkick');
      return;
    }
    if (G.atk) { G.atkBuf = 'punch'; return; }
    if (G.wep === 'bat' || G.wep === 'whip') {
      beginAtk(G.wep);
      return;
    }
    if (G.comboT <= 0) G.chainN = 0;
    G.chainN += 1;
    beginAtk(punchChain(G.chainN));
    if (G.chainN >= 3) G.chainN = 0;
  }
  function doKick() {
    var p = G.player;
    if (!playing() && G.mode !== 'title') return;
    if (G.deadT > 0 || p.hurtT > 0) return;
    if (G.grab) { doThrow(); return; }
    if (!p.grounded) {
      if (G.airAtk) return;
      G.airAtk = true;
      beginAtk('jkick');
      return;
    }
    if (G.atk) { G.atkBuf = 'kick'; return; }
    if (G.wep === 'bat' || G.wep === 'whip') {
      beginAtk(G.wep);
      return;
    }
    if (G.comboT <= 0) G.chainN = 0;
    G.chainN += 1;
    beginAtk(kickChain(G.chainN));
    if (G.chainN >= 2) G.chainN = 0;
  }

  function tryGrab() {
    var p = G.player;
    if (!p.grounded || G.atk || G.grab || G.deadT > 0) return;
    var i, e;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead || e.deadT > 0 || e.kind === 'boss') continue;
      if (e.stunT <= 0 && e.hurtT <= 0) continue;
      if (Math.abs(e.x - p.x) < 22 && Math.abs(e.z - p.z) < 14 && e.h < 8) {
        G.grab = e;
        e.act = 'grabbed';
        e.stunT = 0;
        e.vx = 0;
        p.act = 'grab';
        p.face = e.x >= p.x ? 1 : -1;
        toast('抓住了', false, true);
        audio.beep(300, 0.06, 'square', 0.04, 180);
        return;
      }
    }
  }
  function doThrow() {
    var p = G.player;
    var e = G.grab;
    if (!e) return;
    G.grab = null;
    G.throwT = 0.28;
    p.act = 'throw';
    e.act = 'fly';
    e.vx = p.face * 320;
    e.vh = 140;
    e.h = 12;
    e.downT = 0.9;
    e.hurtT = 0.2;
    e.hp -= 2;
    audio.throw();
    hitStop(0.08);
    kick(3.6, 'boom');
    bumpCombo();
    addScore(Math.round(SCORE.throw * G.mult));
    popFloat(e.x, toY(e) - 40, '投', CYN);
    emit(14, {
      x: e.x, y: toY(e) - 10, j: 12,
      vx0: p.face * 80, vx1: p.face * 280, vy0: -120, vy1: 40,
      life: 0.3, r0: 1.4, r1: 3.4, rgb: CYN, g: 300
    });
    if (e.hp <= 0) {
      e.deadT = 0.6;
      addScore(Math.round((SCORE[KINDS[e.kind].score] || 200) * G.mult));
      if (isWave()) G.waveLeft = Math.max(0, G.waveLeft - 1);
    }
  }

  function resolveHits() {
    if (!G.atk || G.atkHit) return;
    var spec = ATK[G.atk];
    if (!spec) return;
    var elapsed = spec.t - G.atkT;
    if (elapsed < spec.h0 || elapsed > spec.h1) return;
    var p = G.player;
    var i, e, hit = false;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead || e.deadT > 0 || e.downT > 0.2) continue;
      if (!inFront(p, e, spec.reach)) continue;
      hit = hitEnemy(e, spec.dmg, spec.knock, spec.stun, spec.down, p) || hit;
    }
    if (hit) {
      G.atkHit = true;
      hitStop(spec.stop);
      kick(spec.down ? 3.8 : 2.4, spec.down ? 'boom' : 'hit');
      screenFlash(HOT, spec.down ? 0.34 : 0.18);
      if (G.atk === 'jab' || G.atk === 'cross' || G.atk === 'upper') audio.punch(G.combo);
      else if (G.atk === 'kick' || G.atk === 'round' || G.atk === 'jkick') audio.kick(G.combo);
      if (G.wep && (G.atk === 'bat' || G.atk === 'whip')) {
        G.wepHits += 1;
        if (G.wepHits >= (G.wep === 'bat' ? 8 : 10)) {
          toast('武器碎了', true, false);
          audio.breakW();
          emit(12, {
            x: p.x + p.face * 18, y: toY(p) - 14, j: 12,
            vx0: -140, vx1: 140, vy0: -160, vy1: 20,
            life: 0.3, r0: 1.2, r1: 3, rgb: BRN, g: 280
          });
          G.wep = null;
          G.wepHits = 0;
          syncHud();
        }
      }
    }
  }

  function resolveThrows() {
    var i, j, e, o;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.act !== 'fly' || e.dead) continue;
      for (j = 0; j < G.ents.length; j++) {
        o = G.ents[j];
        if (o === e || o.dead || o.deadT > 0 || o.downT > 0) continue;
        if (Math.abs(o.x - e.x) < 22 && Math.abs(o.z - e.z) < 16) {
          hitEnemy(o, 2, 80, 0.2, true, { face: e.vx >= 0 ? 1 : -1, x: e.x });
          e.vx *= 0.4;
        }
      }
    }
  }

  function pickupWeapons() {
    var p = G.player;
    var i, w;
    if (!p.grounded || G.grab) return;
    for (i = 0; i < G.weps.length; i++) {
      w = G.weps[i];
      if (w.dead) continue;
      if (Math.abs(w.x - p.x) < 16 && Math.abs(w.z - p.z) < 14) {
        if (G.wep && G.wep !== w.kind) {
          G.weps.push(makeWep(p.x - p.face * 18, p.z, G.wep));
        }
        G.wep = w.kind;
        G.wepHits = 0;
        w.dead = true;
        audio.pickup();
        addScore(SCORE.pickup);
        toast(wepName(G.wep), false, true);
        popRing(w.x, feetY(w.z, 0), GOLD, 16);
        syncHud();
      }
    }
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    var keepWep = G.wep;
    var keepHits = G.wepHits;
    var hp = G.hp;
    loadStage(G.stage + 1, false);
    G.wep = keepWep;
    G.wepHits = keepHits;
    G.hp = hp;
    G.invuln = 0.6;
    addScore(Math.round(SCORE.stage * G.stage * G.mult));
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    kick(2, 'thump');
    syncHud();
  }

  function demoThink() {
    var p = G.player;
    var e = nearestEnemy(p.x, p.z, 220);
    demo.r = !e || e.x > p.x + 36;
    demo.l = !!(e && e.x < p.x - 40);
    demo.u = !!(e && e.z > p.z + 10);
    demo.d = !!(e && e.z < p.z - 10);
    demo.jump = false;
    if (e && Math.abs(e.x - p.x) < 50 && Math.abs(e.z - p.z) < 18) {
      if (((G.clock * 4) | 0) % 3 === 0) doPunch();
      else if (((G.clock * 4) | 0) % 5 === 0) doKick();
    }
    if (p.x > 900) {
      G.player = makePlayer(72, 36);
      G.camX = 0;
      G.ents = [makeEnt(420, 30, 'thug', 0), makeEnt(620, 55, 'whip', 0), makeEnt(820, 24, 'brute', 0)];
    }
  }

  function updatePlayer(dt) {
    var p = G.player;
    var ax, az, spd, canJump;
    if (G.deadT > 0) {
      G.deadT -= dt;
      p.vh -= GRAV * dt;
      p.h += p.vh * dt;
      if (p.h < 0) { p.h = 0; p.vh = 0; }
      p.x += p.vx * dt;
      p.squash = 1.12;
      if (G.deadT <= 0) {
        if (G.lives <= 0) goLose();
        else respawn();
      }
      return;
    }
    if (G.lock > 0) return;
    if (p.hurtT > 0) {
      p.hurtT -= dt;
      p.x += p.vx * dt;
      p.vx *= Math.pow(0.08, dt);
      p.x = clamp(p.x, 18, G.levelW - 18);
      return;
    }
    if (G.grab) {
      if (inL()) { p.face = -1; p.x -= WALK * 0.55 * dt; }
      if (inR()) { p.face = 1; p.x += WALK * 0.55 * dt; }
      if (inU()) p.z += WALK_Z * 0.5 * dt;
      if (inD()) p.z -= WALK_Z * 0.5 * dt;
      p.x = clamp(p.x, 18, G.levelW - 18);
      p.z = clamp(p.z, ZMIN, ZMAX);
      G.grab.x = p.x + p.face * 16;
      G.grab.z = p.z;
      G.grab.h = 6;
      p.act = 'grab';
      return;
    }
    if (G.throwT > 0) {
      G.throwT -= dt;
      p.act = 'throw';
      return;
    }

    ax = 0;
    az = 0;
    if (inL()) ax -= 1;
    if (inR()) ax += 1;
    if (inU()) az += 1;
    if (inD()) az -= 1;
    if (ax) p.face = ax > 0 ? 1 : -1;
    spd = WALK * (p.grounded ? 1 : AIR);
    if (G.atk) spd *= 0.28;
    p.vx = ax * spd;
    p.vz = az * WALK_Z * (p.grounded ? 1 : 0.7);
    p.x += p.vx * dt;
    p.z += p.vz * dt;
    p.x = clamp(p.x, 18, G.levelW - 18);
    p.z = clamp(p.z, ZMIN, ZMAX);
    if (!isWave() && G.stage === 3) {
      var bossAlive = false, bi, be;
      for (bi = 0; bi < G.ents.length; bi++) {
        be = G.ents[bi];
        if (be.kind === 'boss' && !be.dead && be.deadT <= 0) bossAlive = true;
      }
      if (bossAlive && p.x > G.levelW - 170) {
        p.x = G.levelW - 170;
        if (playing() && G.toastT <= 0) toast('先打倒头目', true, false);
      }
    }

    if (inJump()) G.jumpBuf = 0.12;
    else G.jumpBuf -= dt;
    if (G.jumpBuf < 0) G.jumpBuf = 0;

    canJump = p.grounded || p.coyote > 0;
    if (G.jumpBuf > 0 && canJump && !G.atk) {
      p.vh = JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      G.jumpBuf = 0;
      G.airAtk = false;
      p.squash = 0.78;
      p.act = 'jump';
      audio.hop();
      emit(5, {
        x: p.x, y: toY(p), j: 8,
        vx0: -60, vx1: 60, vy0: -20, vy1: 40,
        life: 0.2, r0: 1, r1: 2.2, rgb: WHT, g: 200
      });
      hitStop(0.025);
    }
    if (!inJump() && p.vh > 80) p.vh *= Math.pow(0.42, dt * 8);

    p.vh -= GRAV * dt;
    if (p.vh < -MAX_FALL) p.vh = -MAX_FALL;
    p.h += p.vh * dt;
    if (p.h <= 0) {
      if (!p.grounded && p.vh < -180) {
        audio.land();
        p.squash = 0.82;
        kick(1.4, 'thump');
      }
      p.h = 0;
      p.vh = 0;
      p.grounded = true;
      p.coyote = 0.09;
      G.airAtk = false;
    } else {
      p.grounded = false;
      p.coyote -= dt;
    }

    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    if ((ax || az) && p.grounded) p.run += dt * 10;
    else p.run *= Math.pow(0.2, dt);

    if (!G.atk) {
      if (!p.grounded) p.act = G.airAtk ? p.act : 'jump';
      else if (ax || az) p.act = 'walk';
      else p.act = 'idle';
    }

    tryGrab();
    pickupWeapons();

    if (!isWave() && G.stage === 3 && G.hostage && !G.hostage.free) {
      var bossDead = true, i, e;
      for (i = 0; i < G.ents.length; i++) {
        e = G.ents[i];
        if (e.kind === 'boss' && !e.dead && e.deadT <= 0) bossDead = false;
      }
      if (bossDead && Math.abs(p.x - G.hostage.x) < 22 && Math.abs(p.z - G.hostage.z) < 16) {
        G.hostage.free = true;
        G.rescued = true;
        addScore(SCORE.rescue);
        audio.rescue();
        toast('得救了', false, true);
        popRing(G.hostage.x, feetY(G.hostage.z, 0) - 20, GOLD, 28);
        screenFlash(GOLD, 0.4);
        setTimeout(function () { if (G.mode === 'play') goWin(); }, 700);
      }
    } else if (!isWave() && G.stage < 3 && p.x > G.levelW - 70) {
      nextStage();
    }
  }

  function updateAtk(dt) {
    if (!G.atk) {
      var buf = G.atkBuf;
      G.atkBuf = 0;
      if (buf === 'punch') doPunch();
      else if (buf === 'kick') doKick();
      return;
    }
    G.atkT -= dt;
    resolveHits();
    if (G.atkT <= 0) {
      G.atk = null;
      G.atkHit = false;
    }
  }

  function updateEnt(e, dt) {
    var p = G.player;
    var spec = KINDS[e.kind] || KINDS.thug;
    var dx, dz, dist, want, speed;
    if (e.dead) return;
    if (e.flash > 0) e.flash -= dt;
    if (e.deadT > 0) {
      e.deadT -= dt;
      e.act = 'down';
      e.vh -= GRAV * dt;
      e.h += e.vh * dt;
      if (e.h < 0) { e.h = 0; e.vh = 0; }
      e.x += e.vx * dt;
      e.vx *= Math.pow(0.2, dt);
      if (e.deadT <= 0) e.dead = true;
      return;
    }
    if (e.downT > 0) {
      e.downT -= dt;
      e.act = e.act === 'fly' ? 'fly' : 'down';
      e.vh -= GRAV * dt;
      e.h += e.vh * dt;
      if (e.h < 0) { e.h = 0; e.vh = 0; }
      e.x += e.vx * dt;
      e.z = clamp(e.z, ZMIN, ZMAX);
      e.vx *= Math.pow(0.18, dt);
      if (e.downT <= 0) {
        e.getupT = 0.35;
        e.act = 'getup';
        e.vx = 0;
      }
      return;
    }
    if (e.getupT > 0) {
      e.getupT -= dt;
      e.act = 'getup';
      return;
    }
    if (e.hurtT > 0 || e.stunT > 0) {
      e.hurtT -= dt;
      e.stunT -= dt;
      e.x += e.vx * dt;
      e.vx *= Math.pow(0.05, dt);
      e.x = clamp(e.x, 18, G.levelW - 18);
      if (e.hurtT <= 0 && e.stunT > 0) e.act = 'stun';
      return;
    }
    if (G.grab === e) return;
    if (e.act === 'fly') return;

    if (e.atkT > 0) {
      e.atkT -= dt;
      if (!e.atkHit && e.atkT < 0.16 && e.atkT > 0.04 && playing() && G.deadT <= 0) {
        if (inFront(e, p, e.reach) && p.h < 28) {
          e.atkHit = true;
          hurtPlayer(e.dmg, e);
        }
      }
      if (e.atkT <= 0) e.act = 'idle';
      return;
    }

    if (!playing()) {
      e.run += dt * 4;
      return;
    }

    dx = p.x - e.x;
    dz = p.z - e.z;
    dist = hypot(dx, dz);
    e.face = dx >= 0 ? 1 : -1;
    e.think -= dt;
    e.cd -= dt;
    speed = spec.spd * (isWave() ? 1 + Math.min(0.55, (G.wave - 1) * 0.05) : 1);

    want = 'chase';
    if (e.kind === 'whip' && dist < 70 && dist > 36) want = 'hold';
    if (e.kind === 'brute' && dist > 80 && dist < 160 && e.cd <= 0) want = 'charge';
    if (e.kind === 'boss' && dist < 50 && e.cd <= 0) want = 'attack';

    if (want === 'charge') {
      e.act = 'charge';
      e.vx = e.face * speed * 2.2;
      e.x += e.vx * dt;
      e.z += clamp(dz, -1, 1) * 40 * dt;
      e.run += dt * 14;
      if (dist < 34 && zOk(e, p)) {
        e.atkT = 0.32;
        e.atkHit = false;
        e.act = 'punch';
        e.cd = 1.1;
        audio.whoosh();
      }
      return;
    }

    if (dist > (e.kind === 'whip' ? 48 : 28) || !zOk(e, p)) {
      e.act = 'walk';
      e.x += Math.sign(dx) * speed * dt;
      e.z += clamp(dz, -1, 1) * spec.spd * 0.7 * dt;
      e.z = clamp(e.z, ZMIN, ZMAX);
      e.run += dt * 8;
      if (e.kind === 'whip' && dist < 62 && zOk(e, p) && e.cd <= 0) {
        e.atkT = 0.38;
        e.atkHit = false;
        e.act = 'whip';
        e.cd = 0.9;
        audio.whip();
        swingTrail(e.x, toY(e) - 16, e.z, e.face, 'whip');
      }
      return;
    }

    if (e.cd <= 0) {
      e.atkT = e.kind === 'whip' ? 0.38 : 0.3;
      e.atkHit = false;
      e.act = e.kind === 'whip' ? 'whip' : (e.kind === 'boss' && Math.random() < 0.4 ? 'kick' : 'punch');
      e.cd = spec.think + rand(0, 0.35);
      if (e.act === 'whip') audio.whip();
      else audio.whoosh();
    } else {
      e.act = 'idle';
      e.run += dt * 3;
    }
  }

  function updateCam(dt) {
    var p = G.player;
    var target = p.x - VW * 0.38 + p.face * 36;
    if (isWave()) target = p.x - VW * 0.42;
    G.camX = lerp(G.camX, clamp(target, 0, Math.max(0, G.levelW - VW)), 1 - Math.pow(0.04, dt));
    G.camY = lerp(G.camY, -p.h * 0.12, 1 - Math.pow(0.08, dt));
  }

  function updateFx(dt) {
    var i, o;
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.002, dt));
    for (i = particles.length - 1; i >= 0; i--) {
      o = particles[i];
      o.life -= dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.vy += o.g * dt;
      if (o.life <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.22) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.32) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      o = floats[i];
      o.t += dt;
      o.y -= 38 * dt;
      if (o.t > o.life) floats.splice(i, 1);
    }
    for (i = trails.length - 1; i >= 0; i--) {
      trails[i].t += dt;
      if (trails[i].t > trails[i].life) trails.splice(i, 1);
    }
  }

  function updateWaves(dt) {
    var i, s, e;
    if (!isWave() || !playing()) return;
    G.waveT -= dt;
    for (i = G.spawnQ.length - 1; i >= 0; i--) {
      s = G.spawnQ[i];
      s.t -= dt;
      if (s.t <= 0) {
        e = makeEnt(clamp(s.x, 40, G.levelW - 40), s.z, s.kind, G.wave);
        G.ents.push(e);
        popRing(e.x, feetY(e.z, 0), HOT, 18);
        G.spawnQ.splice(i, 1);
      }
    }
    if (G.spawnQ.length === 0 && G.waveLeft <= 0 && G.waveT <= 0) {
      addScore(Math.round(SCORE.wave * G.wave * G.mult));
      if (G.wave % 4 === 0) {
        G.weps.push(makeWep(G.player.x + 80, G.player.z, Math.random() < 0.5 ? 'bat' : 'whip'));
      }
      spawnWave(G.wave + 1);
    }
  }

  function update(dt) {
    var i;
    G.t += dt;
    if (G.toastT > 0) G.toastT -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) dropCombo();
    }
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.25);
      return;
    }
    G.clock += dt;
    if (G.invuln > 0 && G.mode !== 'title') G.invuln -= dt;
    if (G.mode === 'title') demoThink();
    if (G.mode === 'title' || playing()) {
      updatePlayer(dt);
      updateAtk(dt);
      for (i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
      resolveThrows();
      for (i = 0; i < G.weps.length; i++) G.weps[i].bob += dt * 4;
      if (G.hostage) G.hostage.bob += dt;
      updateCam(dt);
      updateWaves(dt);
    }
    updateFx(dt);
    if (G.weps.length > 24) {
      G.weps = G.weps.filter(function (w) { return !w.dead; });
    }
    if (G.ents.length > 40) {
      G.ents = G.ents.filter(function (e) { return !e.dead; });
    }
  }

  function palOf(kind) {
    if (kind === 'whip') {
      return { skin: [236, 178, 150], hair: [48, 24, 28], shirt: [220, 48, 120], pants: [32, 16, 28], boot: [40, 20, 28], hairS: 'long', accent: MAG };
    }
    if (kind === 'brute') {
      return { skin: [196, 140, 96], hair: [20, 16, 16], shirt: [52, 54, 60], pants: [28, 30, 36], boot: [18, 16, 14], hairS: 'bald', accent: HOT };
    }
    if (kind === 'boss') {
      return { skin: [176, 122, 84], hair: [16, 12, 12], shirt: [22, 20, 26], pants: [16, 14, 18], boot: [14, 12, 12], hairS: 'slick', accent: HOT2 };
    }
    if (kind === 'marian') {
      return { skin: [240, 190, 160], hair: [210, 70, 90], shirt: [255, 120, 170], pants: [220, 80, 130], boot: [180, 80, 90], hairS: 'long', accent: GOLD };
    }
    if (kind === 'hero') {
      return { skin: SKIN, hair: [255, 214, 96], shirt: [36, 92, 210], pants: [28, 40, 72], boot: [32, 28, 28], hairS: 'hero', accent: HOT };
    }
    return { skin: [214, 158, 112], hair: [28, 22, 24], shirt: [180, 36, 40], pants: [48, 58, 92], boot: [24, 20, 20], hairS: 'mohawk', accent: GOLD };
  }

  function drawSky() {
    var g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (G.theme === 'factory') {
      g.addColorStop(0, '#1a0c10');
      g.addColorStop(0.55, '#12080c');
      g.addColorStop(1, '#2a120c');
    } else if (G.theme === 'lair') {
      g.addColorStop(0, '#100814');
      g.addColorStop(0.55, '#0c0610');
      g.addColorStop(1, '#1a0a0c');
    } else {
      g.addColorStop(0, '#180814');
      g.addColorStop(0.45, '#14080c');
      g.addColorStop(1, '#24100a');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
  }

  function drawBuildings() {
    var x0 = ((G.camX * 0.35) | 0);
    var i, hsh, bx, bw, bh, by, k, wy, neon, nx;
    for (i = -1; i < 12; i++) {
      hsh = hash2((i + (x0 / 90 | 0)) * 17 + (G.theme === 'lair' ? 3 : 1));
      bx = ox + ((i * 90) - (G.camX * 0.35 % 90)) * scale;
      bw = (70 + hsh * 40) * scale;
      bh = (90 + hsh * 80) * scale;
      by = oy + (GY - 86 - hsh * 40) * scale - bh;
      ctx.fillStyle = G.theme === 'factory' ? '#1a1014' : G.theme === 'lair' ? '#140c18' : '#1a0c12';
      ctx.fillRect(bx, by, bw, bh + 80 * scale);
      ctx.fillStyle = rgba(HOT, 0.08 + hsh * 0.08);
      ctx.fillRect(bx, by, bw, 3 * scale);
      for (k = 0; k < 6; k++) {
        wy = by + (12 + k * 16) * scale;
        if (hash2(i * 31 + k + (x0 | 0)) > 0.45) {
          ctx.fillStyle = hash2(i * 9 + k) > 0.6 ? rgba(GOLD, 0.35) : rgba(CYN, 0.22);
          ctx.fillRect(bx + 8 * scale, wy, 8 * scale, 6 * scale);
          ctx.fillRect(bx + 22 * scale, wy, 8 * scale, 6 * scale);
        }
      }
      if (hsh > 0.62) {
        neon = hsh > 0.8 ? MAG : HOT;
        nx = bx + 10 * scale;
        ctx.fillStyle = rgba(neon, 0.55 + Math.sin(G.clock * 6 + i) * 0.15);
        ctx.fillRect(nx, by + 18 * scale, bw * 0.55, 6 * scale);
      }
    }
  }

  function drawGround() {
    var y = sy(GY);
    var g = ctx.createLinearGradient(0, y - 40 * scale, 0, oy + VH * scale);
    g.addColorStop(0, '#3a2218');
    g.addColorStop(0.35, '#24140e');
    g.addColorStop(1, '#120806');
    ctx.fillStyle = g;
    ctx.fillRect(ox, y - 8 * scale, VW * scale, oy + VH * scale - (y - 8 * scale));
    ctx.fillStyle = rgba(HOT, 0.35);
    ctx.fillRect(ox, y - 10 * scale, VW * scale, 2.2 * scale);
    ctx.fillStyle = rgba(GOLD, 0.18);
    ctx.fillRect(ox, y - 8 * scale, VW * scale, 1.2 * scale);
    var i, px, dash;
    ctx.strokeStyle = rgba(WHT, 0.07);
    ctx.lineWidth = 1;
    for (i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(ox, sy(GY - 8 - i * 10));
      ctx.lineTo(ox + VW * scale, sy(GY - 8 - i * 10));
      ctx.stroke();
    }
    dash = ((G.camX / 36) | 0);
    for (i = -1; i < 22; i++) {
      px = sx((i + dash) * 36);
      ctx.fillStyle = rgba(GOLD, 0.12);
      ctx.fillRect(px, y - 4 * scale, 16 * scale, 2 * scale);
    }
  }

  function drawProps() {
    var i, hsh, px, pz, kind, x, y, s;
    s = scale;
    for (i = 0; i < 28; i++) {
      hsh = hash2(i * 47 + (G.theme === 'factory' ? 2 : G.theme === 'lair' ? 5 : 0));
      px = 80 + i * 78 + hsh * 40;
      if (px < G.camX - 40 || px > G.camX + VW + 40) continue;
      pz = 8 + hsh * 10;
      x = sx(px);
      y = sy(feetY(pz, 0));
      kind = (hsh * 5) | 0;
      if (kind === 0) {
        ctx.fillStyle = '#2a1810';
        ctx.fillRect(x - 10 * s, y - 16 * s, 20 * s, 16 * s);
        ctx.fillStyle = rgba(HOT, 0.4);
        ctx.fillRect(x - 10 * s, y - 16 * s, 20 * s, 2 * s);
      } else if (kind === 1) {
        ctx.fillStyle = '#3a2418';
        ctx.fillRect(x - 7 * s, y - 14 * s, 14 * s, 14 * s);
        ctx.strokeStyle = rgba(BRN, 0.7);
        ctx.strokeRect(x - 7 * s, y - 14 * s, 14 * s, 14 * s);
      } else if (kind === 2) {
        ctx.fillStyle = '#6a6e74';
        ctx.fillRect(x - 3 * s, y - 22 * s, 6 * s, 22 * s);
        ctx.fillStyle = rgba(CYN, 0.35);
        ctx.beginPath();
        ctx.arc(x, y - 24 * s, 5 * s, 0, TAU);
        ctx.fill();
      } else if (G.theme === 'lair') {
        ctx.fillStyle = rgba(HOT, 0.45);
        ctx.beginPath();
        ctx.moveTo(x, y - 26 * s);
        ctx.lineTo(x + 5 * s, y - 12 * s);
        ctx.lineTo(x - 5 * s, y - 12 * s);
        ctx.fill();
        ctx.fillStyle = '#2a1a12';
        ctx.fillRect(x - 3 * s, y - 12 * s, 6 * s, 12 * s);
      }
    }
  }

  function drawShadow(e, sc) {
    var x = sx(e.x);
    var y = sy(feetY(e.z, 0));
    var a = 0.32 * (e.h > 0 ? 0.55 : 1);
    ctx.fillStyle = 'rgba(0,0,0,' + a + ')';
    ctx.beginPath();
    ctx.ellipse(x, y + 2 * scale, 11 * scale * sc, 4.2 * scale * sc, 0, 0, TAU);
    ctx.fill();
  }

  function drawFighter(e, kind, blink) {
    if (blink && ((G.t * 18) | 0) % 2 === 0) return;
    var pal = palOf(kind);
    var sc = (e.scale || 1) * scale;
    var face = e.face || 1;
    var act = e.act || 'idle';
    var bob = (act === 'walk' || act === 'charge') ? Math.sin(e.run || G.clock * 8) : Math.sin(G.clock * 3) * 0.4;
    var sq = e.squash || 1;
    var x = sx(e.x);
    var y = sy(toY(e));
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(face, sq);
    if (act === 'down' || act === 'fly') {
      ctx.rotate(-0.5);
      ctx.translate(0, 8 * sc);
    }
    var leg = (act === 'walk' || act === 'charge') ? Math.sin(e.run || 0) * 5 * sc : (act === 'jump' || act === 'jkick' ? -4 * sc : 0);
    var kickLeg = act === 'kick' || act === 'round' || act === 'jkick' ? 14 * sc : 0;
    ctx.strokeStyle = rgba(pal.pants, 0.95);
    ctx.lineWidth = 3.1 * sc;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3.2 * sc, -9 * sc);
    ctx.lineTo(-4 * sc - (act === 'kick' ? 0 : leg), kickLeg && act !== 'jkick' ? -2 * sc : 0);
    ctx.moveTo(3.2 * sc, -9 * sc);
    ctx.lineTo(4 * sc + (kickLeg ? kickLeg : leg), kickLeg ? -6 * sc : 0);
    ctx.stroke();
    ctx.fillStyle = rgba(pal.boot, 1);
    ctx.fillRect(-6 * sc - (act === 'kick' ? 0 : leg), -1.5 * sc, 5 * sc, 3 * sc);
    ctx.fillRect(2 * sc + (kickLeg ? kickLeg : leg), kickLeg ? -8 * sc : -1.5 * sc, 5 * sc, 3 * sc);

    ctx.fillStyle = rgba(pal.shirt, 0.98);
    ctx.beginPath();
    ctx.moveTo(-7.2 * sc, -10 * sc + bob);
    ctx.lineTo(7.2 * sc, -11 * sc + bob);
    ctx.lineTo(5.4 * sc, -24 * sc + bob);
    ctx.lineTo(-5.4 * sc, -23 * sc + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(pal.accent, 0.85);
    ctx.fillRect(-5.5 * sc, -14 * sc + bob, 11 * sc, 2 * sc);

    var punch = act === 'punch' || act === 'upper' || act === 'bat' ? 16 * sc : 0;
    var armY = act === 'upper' ? -28 * sc : -18 * sc;
    ctx.strokeStyle = rgba(pal.skin, 0.95);
    ctx.lineWidth = 2.4 * sc;
    ctx.beginPath();
    ctx.moveTo(-5 * sc, -20 * sc + bob);
    ctx.lineTo(-10 * sc, (act === 'kick' ? -12 : -12) * sc + bob);
    ctx.moveTo(5 * sc, -20 * sc + bob);
    ctx.lineTo(6 * sc + punch, armY + bob);
    ctx.stroke();
    ctx.fillStyle = rgba(pal.skin, 1);
    ctx.beginPath();
    ctx.arc(6 * sc + punch, armY + bob, 2.3 * sc, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-10 * sc, -12 * sc + bob, 2.1 * sc, 0, TAU);
    ctx.fill();

    if (act === 'bat' || (kind === 'hero' && G.wep === 'bat' && (act === 'idle' || act === 'walk'))) {
      ctx.save();
      ctx.translate(6 * sc + punch, armY + bob);
      ctx.rotate(act === 'bat' ? -0.9 : -0.5);
      ctx.fillStyle = rgba(BRN, 1);
      ctx.fillRect(0, -2 * sc, 22 * sc, 3.2 * sc);
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(18 * sc, -2.4 * sc, 4 * sc, 4 * sc);
      ctx.restore();
    }
    if (act === 'whip' || (kind === 'hero' && G.wep === 'whip' && act === 'whip')) {
      ctx.strokeStyle = rgba(MAG, 0.9);
      ctx.lineWidth = 1.6 * sc;
      ctx.beginPath();
      ctx.moveTo(6 * sc + punch, armY + bob);
      ctx.quadraticCurveTo(28 * sc, -30 * sc + bob, 52 * sc, -10 * sc + Math.sin(G.clock * 20) * 6 * sc);
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(52 * sc, -10 * sc, 2 * sc, 0, TAU);
      ctx.fill();
    }
    if (kind === 'whip' && act === 'whip') {
      ctx.strokeStyle = rgba(GOLD, 0.85);
      ctx.lineWidth = 1.5 * sc;
      ctx.beginPath();
      ctx.moveTo(6 * sc, -18 * sc + bob);
      ctx.quadraticCurveTo(30 * sc, -34 * sc, 56 * sc, -8 * sc);
      ctx.stroke();
    }

    ctx.fillStyle = rgba(pal.skin, 1);
    ctx.beginPath();
    ctx.arc(0, -29 * sc + bob, 5.4 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(pal.hair, 1);
    if (pal.hairS === 'mohawk') {
      ctx.beginPath();
      ctx.moveTo(-1.4 * sc, -34 * sc + bob);
      ctx.lineTo(0, -42 * sc + bob);
      ctx.lineTo(1.4 * sc, -34 * sc + bob);
      ctx.fill();
    } else if (pal.hairS === 'long') {
      ctx.beginPath();
      ctx.ellipse(0, -30 * sc + bob, 5.8 * sc, 4.2 * sc, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(-5 * sc, -28 * sc + bob, 4 * sc, 12 * sc);
    } else if (pal.hairS === 'bald') {
      ctx.fillStyle = rgba(pal.skin, 1);
    } else if (pal.hairS === 'slick') {
      ctx.beginPath();
      ctx.ellipse(0.6 * sc, -31 * sc + bob, 5.6 * sc, 3.4 * sc, 0.2, 0, TAU);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(0.4 * sc, -31.5 * sc + bob, 5.6 * sc, 3.6 * sc, 0.15, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#1a1010';
    ctx.fillRect(1.6 * sc, -30 * sc + bob, 1.5 * sc, 1.5 * sc);

    if (e.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.35);
      ctx.fillRect(-10 * sc, -42 * sc, 22 * sc, 44 * sc);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();

    if (e.max && e.hp < e.max && e.hp > 0 && !e.dead) {
      var bw = 22 * scale * (e.scale || 1);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(x - bw / 2, sy(toY(e) - 46 * (e.scale || 1)), bw, 3.2 * scale);
      ctx.fillStyle = rgba(e.hp / e.max < 0.34 ? MAG : LEAF, 0.9);
      ctx.fillRect(x - bw / 2, sy(toY(e) - 46 * (e.scale || 1)), bw * (e.hp / e.max), 3.2 * scale);
    }
  }

  function drawWep(w) {
    if (w.dead) return;
    var x = sx(w.x);
    var y = sy(feetY(w.z, 0) - 8 - Math.sin(w.bob) * 3);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.5);
    if (w.kind === 'bat') {
      ctx.fillStyle = rgba(BRN, 1);
      ctx.fillRect(-2 * scale, -12 * scale, 4 * scale, 24 * scale);
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.fillRect(-2.4 * scale, 8 * scale, 4.8 * scale, 4 * scale);
    } else {
      ctx.strokeStyle = rgba(MAG, 0.9);
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      ctx.moveTo(0, 10 * scale);
      ctx.quadraticCurveTo(8 * scale, -4 * scale, 0, -16 * scale);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(sx(w.x), sy(feetY(w.z, 0)), 8 * scale, 3 * scale, 0, 0, TAU);
    ctx.fill();
  }

  function drawHostage(h) {
    if (!h) return;
    var dummy = { x: h.x, z: h.z, h: 0, face: h.face, act: h.free ? 'idle' : 'stun', run: h.bob * 2, scale: 0.94 };
    if (!h.free) {
      ctx.strokeStyle = rgba(GOLD, 0.7);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(h.x - 8), sy(feetY(h.z, 0) - 20));
      ctx.lineTo(sx(h.x + 8), sy(feetY(h.z, 0) - 12));
      ctx.stroke();
    }
    drawFighter(dummy, 'marian', false);
  }

  function drawTrails() {
    var i, o, a, x, y, s;
    s = scale;
    for (i = 0; i < trails.length; i++) {
      o = trails[i];
      a = 1 - o.t / o.life;
      x = sx(o.x);
      y = sy(o.y);
      ctx.save();
      ctx.globalAlpha = 0.55 * a;
      ctx.strokeStyle = o.kind === 'whip' ? rgba(MAG, 1) : o.kind === 'bat' ? rgba(BRN, 1) : rgba(HOT, 1);
      ctx.lineWidth = (o.kind === 'whip' ? 2.2 : 3.4) * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + o.face * 6 * s, y - 4 * s);
      ctx.quadraticCurveTo(
        x + o.face * (18 + a * 10) * s, y - 22 * s,
        x + o.face * (o.kind === 'whip' ? 56 : 34) * s, y + (o.kind === 'kick' || o.kind === 'round' ? 8 : -6) * s
      );
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawFx() {
    var i, o, a;
    for (i = 0; i < rings.length; i++) {
      o = rings[i];
      a = 1 - o.t / 0.32;
      ctx.strokeStyle = rgba(o.rgb, 0.7 * a);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.rad + o.t * 70) * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < sparks.length; i++) {
      o = sparks[i];
      a = 1 - o.t / 0.22;
      ctx.fillStyle = rgba(o.rgb, 0.7 * a);
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.rad * a) * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(WHT, 0.8 * a);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(o.x) - o.rad * a * scale, sy(o.y));
      ctx.lineTo(sx(o.x) + o.rad * a * scale, sy(o.y));
      ctx.moveTo(sx(o.x), sy(o.y) - o.rad * a * scale);
      ctx.lineTo(sx(o.x), sy(o.y) + o.rad * a * scale);
      ctx.stroke();
    }
    for (i = 0; i < particles.length; i++) {
      o = particles[i];
      a = o.life / o.max;
      ctx.fillStyle = rgba(o.rgb, 0.85 * a);
      ctx.fillRect(sx(o.x), sy(o.y), o.r * scale, o.r * scale);
    }
    for (i = 0; i < floats.length; i++) {
      o = floats[i];
      a = 1 - o.t / o.life;
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(o.rgb, 1);
      ctx.font = 'bold ' + (o.size * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(o.text, sx(o.x), sy(o.y));
      ctx.globalAlpha = 1;
    }
  }

  function drawGate() {
    if (isWave()) return;
    var gx, x, y;
    if (G.stage < 3) {
      gx = G.levelW - 36;
      x = sx(gx);
      y = sy(GY - 80);
      ctx.fillStyle = rgba(HOT, 0.18);
      ctx.fillRect(x, y, 10 * scale, 90 * scale);
      ctx.fillStyle = rgba(GOLD, 0.45);
      ctx.fillRect(x, y, 10 * scale, 3 * scale);
    } else {
      var bossAlive = false, i;
      for (i = 0; i < G.ents.length; i++) {
        if (G.ents[i].kind === 'boss' && !G.ents[i].dead) bossAlive = true;
      }
      if (bossAlive) {
        gx = G.levelW - 160;
        x = sx(gx);
        ctx.fillStyle = rgba(MAG, 0.22 + Math.sin(G.clock * 5) * 0.08);
        ctx.fillRect(x, sy(GY - 110), 14 * scale, 120 * scale);
      }
    }
  }

  function draw() {
    var list, i, e, blink;
    dpr = dpr || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0c0502';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    if (!REDUCE && G.shake > 0) {
      ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake * 0.7);
    }
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();

    drawSky();
    drawBuildings();
    drawGround();
    drawProps();
    drawGate();
    drawTrails();

    list = [];
    for (i = 0; i < G.weps.length; i++) {
      if (!G.weps[i].dead) list.push({ z: G.weps[i].z - 1, kind: 'wep', o: G.weps[i] });
    }
    if (G.hostage) list.push({ z: G.hostage.z, kind: 'host', o: G.hostage });
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      list.push({ z: e.z, kind: 'ent', o: e });
    }
    if (G.player) list.push({ z: G.player.z, kind: 'hero', o: G.player });
    list.sort(function (a, b) { return b.z - a.z; });

    for (i = 0; i < list.length; i++) {
      e = list[i];
      if (e.kind === 'wep') {
        drawShadow({ x: e.o.x, z: e.o.z, h: 0 }, 0.7);
        drawWep(e.o);
      } else if (e.kind === 'host') {
        drawShadow(e.o, 0.9);
        drawHostage(e.o);
      } else if (e.kind === 'ent') {
        drawShadow(e.o, e.o.scale || 1);
        drawFighter(e.o, e.o.kind, false);
      } else {
        blink = playing() && G.invuln > 0 && G.deadT <= 0;
        drawShadow(e.o, 1);
        drawFighter(e.o, 'hero', blink);
      }
    }

    drawFx();
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
    ctx.restore();
  }

  function resize() {
    if (!stageEl || !canvas) return;
    var rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
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
    var punch = k === 'z' || k === 'Z' || k === 'j' || k === 'J';
    var kickK = k === 'x' || k === 'X' || k === 'k' || k === 'K';
    var jump = space || k === 'c' || k === 'C';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (jump) keys.jump = down;

    if (down && (isMove || space || punch || kickK || k === 'Enter')) e.preventDefault();
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
    if (k === '1' && G.mode === 'title') {
      startGame('street');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('wave');
      return;
    }
    if (overlayOpen()) {
      if (space || k === 'Enter' || punch) primaryAction();
      return;
    }
    if (punch) {
      if (playing() || G.mode === 'title') doPunch();
      return;
    }
    if (kickK) {
      if (playing() || G.mode === 'title') doKick();
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
    hold(document.getElementById('btn-up'), function () { keys.u = true; }, function () { keys.u = false; });
    hold(document.getElementById('btn-down'), function () { keys.d = true; }, function () { keys.d = false; });
    hold(document.getElementById('btn-jump'), function () { keys.jump = true; }, function () { keys.jump = false; });
    hold(document.getElementById('btn-punch'), function () {
      if (overlayOpen()) { primaryAction(); return; }
      if (playing()) doPunch();
    }, null);
    hold(document.getElementById('btn-kick'), function () {
      if (overlayOpen()) return;
      if (playing()) doKick();
    }, null);
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen()) return;
      if (playing()) doPunch();
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
  initMute();
  goTitle();
  resize();
  bindPointer();
  bindPad();

  if (btnStreet) {
    btnStreet.addEventListener('click', function () {
      audio.ensure();
      startGame('street');
    });
  }
  if (btnWave) {
    btnWave.addEventListener('click', function () {
      audio.ensure();
      startGame('wave');
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
      if (G.mode === 'win' && !isWave()) startGame('wave');
      else goTitle();
    });
  }
  if (modeStreet) {
    modeStreet.addEventListener('click', function () {
      audio.ensure();
      startGame('street');
    });
  }
  if (modeWave) {
    modeWave.addEventListener('click', function () {
      audio.ensure();
      startGame('wave');
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
      keys.u = false;
      keys.d = false;
      keys.jump = false;
    }
  });

  requestAnimationFrame(frame);
})();
