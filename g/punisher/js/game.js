'use strict';

/* 制裁 — Punisher arcade lite. Side-scroll gun brawler. No CDN. Distinct from 神龟 / 街霸. */

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
  var COMBO_WIN = 1.4;
  var AIR = 0.9;
  var JUMP_V = 410;
  var GRAV = 1350;
  var MAX_FALL = 640;
  var COYOTE = 0.09;
  var BUFFER = 0.12;
  var INVULN = 1.35;
  var DIE_T = 0.82;
  var WALK = 184;
  var BEST_KEY = 'playbox-punisher-best';
  var MUTE_KEY = 'playbox-punisher-mute';
  var OPS = '方向 / WASD 走 · 上跳 · 空格拳打或开枪 · R 重开 · M 静音';

  var MAG = [255, 61, 120];
  var CYN = [0, 240, 255];
  var GOLD = [255, 227, 107];
  var HOT = [255, 48, 18];
  var HOT2 = [255, 110, 80];
  var WHT = [244, 236, 228];
  var SKIN = [214, 168, 128];
  var LEATH = [22, 16, 18];
  var SKULL = [244, 240, 232];
  var STEEL = [154, 164, 174];
  var ORG = [255, 138, 24];
  var BRN = [122, 74, 42];
  var PUR = [160, 72, 180];

  var WEPS = {
    fist: { id: 'fist', name: '拳头', ammo: 0 },
    pistol: { id: 'pistol', name: '手枪', ammo: 12, dmg: 2, cd: 0.20, spd: 540, n: 1, spread: 0, knock: 42, stop: 0.036 },
    shotgun: { id: 'shotgun', name: '霰弹', ammo: 6, dmg: 3, cd: 0.38, spd: 460, n: 3, spread: 0.16, knock: 110, stop: 0.068 }
  };

  var PUNCH = [
    { reach: 28, dmg: 1, t: 0.18, h0: 0.04, h1: 0.12, knock: 52, stop: 0.042, down: false },
    { reach: 32, dmg: 2, t: 0.22, h0: 0.05, h1: 0.14, knock: 74, stop: 0.052, down: false },
    { reach: 36, dmg: 2, t: 0.28, h0: 0.06, h1: 0.18, knock: 118, stop: 0.068, down: true }
  ];
  var AIR_KICK = { reach: 30, dmg: 2, t: 0.22, h0: 0.04, h1: 0.14, knock: 86, stop: 0.05, down: true };

  var KINDS = {
    thug: { hp: 3, name: '暴徒', spd: 92, dmg: 2, score: 160, reach: 26, w: 16, h: 28, scale: 1 },
    gunner: { hp: 3, name: '枪手', spd: 68, dmg: 2, score: 240, reach: 20, w: 16, h: 28, scale: 1 },
    car: { hp: 8, name: '飞车', spd: 210, dmg: 3, score: 500, reach: 36, w: 48, h: 22, scale: 1 },
    jigsaw: { hp: 22, name: '裂脸', spd: 78, dmg: 3, score: 3200, reach: 34, w: 20, h: 34, scale: 1.18 },
    iron: { hp: 26, name: '铁卫', spd: 70, dmg: 3, score: 4000, reach: 36, w: 24, h: 40, scale: 1.32 },
    king: { hp: 34, name: '金王', spd: 56, dmg: 4, score: 6000, reach: 42, w: 28, h: 44, scale: 1.48 }
  };

  var SCORE = {
    hit: 40, med: 120, crate: 80, gun: 80, stage: 1500, wave: 600
  };

  var STAGES = [
    {
      name: '夜巷', w: 2320, theme: 'alley',
      ents: [
        [340, 'thug'], [500, 'thug'], [680, 'gunner'], [860, 'thug'],
        [980, 'car'], [1140, 'thug'], [1320, 'gunner'], [1500, 'thug'], [1680, 'thug']
      ],
      crates: [420, 900, 1480],
      meds: [720, 1280],
      boss: ['jigsaw', 2040]
    },
    {
      name: '码头', w: 2480, theme: 'docks',
      ents: [
        [300, 'thug'], [460, 'gunner'], [620, 'thug'], [740, 'car'],
        [920, 'gunner'], [1100, 'thug'], [1280, 'car'], [1460, 'gunner'],
        [1640, 'thug'], [1820, 'gunner']
      ],
      crates: [400, 1000, 1600],
      meds: [800, 1500],
      boss: ['iron', 2200]
    },
    {
      name: '金库', w: 2200, theme: 'vault',
      ents: [
        [280, 'gunner'], [420, 'thug'], [580, 'gunner'], [720, 'car'],
        [900, 'gunner'], [1080, 'thug'], [1240, 'gunner'], [1400, 'car'], [1560, 'gunner']
      ],
      crates: [500, 1180],
      meds: [680, 1380],
      boss: ['king', 1920]
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
  function isBoss(k) {
    return k === 'jigsaw' || k === 'iron' || k === 'king';
  }
  function jumpH() {
    return (JUMP_V * JUMP_V) / (2 * GRAV);
  }
  function wepName(id) {
    return WEPS[id] ? WEPS[id].name : '拳头';
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (HP_MAX < 12) throw new Error('hp');
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(3) !== 2) throw new Error('combo 3');
    if (comboMul(9) !== 5) throw new Error('combo 9');
    if (BEST_KEY !== 'playbox-punisher-best') throw new Error('best key');
    if (WEPS.pistol.ammo !== 12 || WEPS.shotgun.ammo !== 6) throw new Error('ammo');
    if (WEPS.shotgun.n !== 3) throw new Error('pellets');
    if (kindHp('thug', 0) !== 3) throw new Error('thug hp');
    if (kindHp('car', 0) !== 8) throw new Error('car hp');
    if (kindHp('king', 1) <= kindHp('gunner', 1)) throw new Error('boss hp');
    if (waveCount(1) < 4 || waveCount(20) > 14) throw new Error('wave cap');
    if (jumpH() < 50) throw new Error('jump');
    if (!STAGES[0].boss || STAGES[0].boss[0] !== 'jigsaw') throw new Error('jigsaw');
    if (!STAGES[1].boss || STAGES[1].boss[0] !== 'iron') throw new Error('iron');
    if (!STAGES[2].boss || STAGES[2].boss[0] !== 'king') throw new Error('king');
    if (STAGES[0].w >= STAGES[1].w) throw new Error('wider later');
    if (KINDS.car.score !== 500) throw new Error('car score');
    var i, s, hasCar;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ents.length) throw new Error('ents');
      if (s.w < 1800) throw new Error('short stage');
      if (!s.crates.length) throw new Error('crates');
      hasCar = s.ents.some(function (e) { return e[1] === 'car'; });
      if (!hasCar) throw new Error('need car');
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
  var btnClash = document.getElementById('btn-clash');
  var ovAgain = document.getElementById('ov-again');
  var ovMenu = document.getElementById('ov-menu');
  var modeStreet = document.getElementById('mode-street');
  var modeClash = document.getElementById('mode-clash');
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
  var bossWrap = document.getElementById('boss-wrap');
  var bossBar = document.getElementById('boss-bar');
  var bossName = document.getElementById('boss-name');
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

  var keys = { l: false, r: false, jump: false, atk: false };
  var demo = { l: false, r: true, jump: false };
  var pips = [];
  var particles = [];
  var sparks = [];
  var rings = [];
  var floats = [];
  var trails = [];
  var muzzles = [];
  var casings = [];

  var G = {
    mode: 'title',
    kind: 'street',
    t: 0,
    clock: 0,
    stage: 1,
    wave: 1,
    camX: 0,
    camY: 0,
    levelW: 2320,
    theme: 'alley',
    ents: [],
    crates: [],
    drops: [],
    bullets: [],
    player: null,
    lives: LIVES,
    hp: HP_MAX,
    wep: 'fist',
    ammo: 0,
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
    airAtk: false,
    shootCd: 0,
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
    lockR: 0
  };

  function isClash() {
    return G.kind === 'clash';
  }
  function playing() {
    return G.mode === 'play';
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function inL() { return G.mode === 'title' ? demo.l : keys.l; }
  function inR() { return G.mode === 'title' ? demo.r : keys.r; }
  function inJump() { return G.mode === 'title' ? demo.jump : keys.jump; }
  function sx(x) { return ox + (x - G.camX) * scale; }
  function sy(y) { return oy + (y - G.camY) * scale; }
  function armed() {
    return (G.wep === 'pistol' || G.wep === 'shotgun') && G.ammo > 0;
  }
  function punchSpec() {
    if (G.atkAir) return AIR_KICK;
    return PUNCH[Math.min(2, Math.max(0, G.chainN - 1))] || PUNCH[0];
  }

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
    punchHit: function (combo, down) {
      this.ensure();
      var lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.045, 0.044, 900);
      this.beep((down ? 160 : 240) * lift, 0.07, 'square', 0.05, 80);
      this.beep(520 * lift, 0.05, 'triangle', 0.028, 180);
    },
    pistol: function () {
      this.ensure();
      this.noise(0.045, 0.05, 1800);
      this.beep(280, 0.05, 'square', 0.048, 70);
      this.beep(880, 0.03, 'triangle', 0.02, 220);
    },
    shotgun: function () {
      this.ensure();
      this.noise(0.09, 0.07, 400);
      this.beep(90, 0.1, 'sawtooth', 0.055, 40);
      this.beep(180, 0.06, 'square', 0.03, 60);
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
    pickup: function () {
      this.ensure();
      this.beep(520, 0.06, 'square', 0.04, 880);
      this.beep(880, 0.1, 'triangle', 0.035, 1320);
    },
    med: function () {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.04, 990);
      this.beep(990, 0.1, 'triangle', 0.035, 1320);
    },
    crate: function () {
      this.ensure();
      this.noise(0.08, 0.046, 600);
      this.beep(200, 0.1, 'square', 0.036, 70);
    },
    carHit: function () {
      this.ensure();
      this.noise(0.1, 0.05, 280);
      this.beep(110, 0.12, 'sawtooth', 0.04, 50);
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
    charge: function () {
      this.ensure();
      this.noise(0.12, 0.05, 280);
      this.beep(90, 0.18, 'sawtooth', 0.05, 50);
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
    var w = isClash();
    if (modeStreet) modeStreet.setAttribute('aria-pressed', w ? 'false' : 'true');
    if (modeClash) modeClash.setAttribute('aria-pressed', w ? 'true' : 'false');
  }
  function syncWep() {
    if (!wepLabel) return;
    var low = armed() && G.ammo <= 2;
    if (!armed()) {
      wepLabel.textContent = '拳头';
      wepLabel.className = 'wep fist';
    } else {
      wepLabel.textContent = wepName(G.wep) + '·' + G.ammo;
      wepLabel.className = 'wep ' + G.wep + (low ? ' low' : '');
    }
  }
  function syncBoss() {
    var b = findBoss();
    var onScreen;
    if (!bossWrap) return;
    onScreen = b && (G.arena || (b.x > G.camX - 30 && b.x < G.camX + VW + 50));
    if (!b || G.mode === 'title' || !onScreen) {
      bossWrap.hidden = true;
      return;
    }
    bossWrap.hidden = false;
    if (bossName) bossName.textContent = KINDS[b.kind] ? KINDS[b.kind].name : '头目';
    if (bossBar) {
      bossBar.style.transform = 'scaleX(' + clamp(b.hp / b.max, 0, 1) + ')';
    }
  }
  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 3);
    if (stageLabel) {
      if (isClash()) stageLabel.textContent = '潮 ' + G.wave;
      else stageLabel.textContent = (STAGES[G.stage - 1] || STAGES[0]).name;
      stageLabel.classList.toggle('hot', isClash() ? G.wave >= 5 : G.stage >= 3);
    }
    if (tagLabel) {
      tagLabel.textContent = isClash() ? '火并' : '扫街';
      tagLabel.classList.toggle('warn', isClash());
      tagLabel.classList.toggle('hot', !isClash() && G.stage >= 3);
    }
    if (hpBar) {
      var r = G.hp / HP_MAX;
      hpBar.style.transform = 'scaleX(' + clamp(r, 0, 1) + ')';
      hpBar.classList.toggle('low', r <= 0.34);
    }
    syncWep();
    syncPips();
    syncModes();
    syncBoss();
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'PUNI';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' && !isClash() ? '火并' : '换模式';
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
  function swingTrail(x, y, face) {
    trails.push({ x: x, y: y, face: face, t: 0, life: 0.16 });
    capArr(trails, 18);
  }
  function popMuzzle(x, y, face, kind) {
    muzzles.push({ x: x, y: y, face: face, kind: kind || 'pistol', t: 0, life: kind === 'shotgun' ? 0.1 : 0.07 });
    capArr(muzzles, 16);
  }

  function makePlayer(x) {
    return {
      x: x, y: GY, vx: 0, vy: 0, face: 1,
      grounded: true, coyote: 0, run: 0, squash: 1,
      act: 'idle', scale: 1
    };
  }
  function makeEnt(x, kind, wave) {
    var spec = KINDS[kind] || KINDS.thug;
    return {
      x: x, y: GY, vx: 0, vy: 0,
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
      act: kind === 'car' ? 'drive' : 'idle',
      atkT: 0,
      atkHit: false,
      stunT: 0,
      hurtT: 0,
      deadT: 0,
      dead: false,
      flash: 0,
      run: rand(0, 8),
      cd: rand(0.2, 0.8),
      grounded: true,
      squash: 1,
      summonT: rand(1.6, 3.2)
    };
  }
  function makeCrate(x) {
    return { x: x, hp: 1, dead: false, deadT: 0 };
  }
  function makeDrop(x, kind) {
    return { x: x, y: GY - 10, kind: kind, taken: false, bob: rand(0, TAU) };
  }

  function clearFx() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    trails.length = 0;
    muzzles.length = 0;
    casings.length = 0;
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
    G.drops = [];
    G.bullets = [];
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
    G.shootCd = 0;
    G.deadT = 0;
    G.hurtT = 0;
    G.chainN = 0;
    G.clearT = 0;
    if (!demoMode) {
      for (i = 0; i < spec.ents.length; i++) {
        e = spec.ents[i];
        G.ents.push(makeEnt(e[0], e[1], 0));
      }
      if (spec.boss) G.ents.push(makeEnt(spec.boss[1], spec.boss[0], 0));
      for (i = 0; i < spec.crates.length; i++) G.crates.push(makeCrate(spec.crates[i]));
      for (i = 0; i < spec.meds.length; i++) G.drops.push(makeDrop(spec.meds[i], 'med'));
    } else {
      G.ents.push(makeEnt(420, 'thug', 0));
      G.ents.push(makeEnt(640, 'gunner', 0));
      G.ents.push(makeEnt(920, 'car', 0));
      G.crates.push(makeCrate(300));
      G.drops.push(makeDrop(520, 'pistol'));
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
    for (i = 0; i < count; i++) {
      if (n >= 12 && n % 12 === 0 && i === 0) kind = 'king';
      else if (n >= 8 && n % 8 === 0 && i === 0) kind = 'iron';
      else if (n >= 4 && n % 4 === 0 && i === 0) kind = 'jigsaw';
      else if (n >= 2 && i % 4 === 2) kind = 'car';
      else if (n >= 2 && i % 3 === 1) kind = 'gunner';
      else kind = 'thug';
      side = i % 2 === 0 ? 1 : -1;
      x = (G.player ? G.player.x : 320) + side * rand(300, 480);
      x = clamp(x, 40, G.levelW - 40);
      G.spawnQ.push({ t: 0.12 * i, kind: kind, x: x });
    }
    toast('第 ' + n + ' 潮', false, n % 4 === 0);
    audio.wave();
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'clash' ? 'clash' : 'street';
    G.mode = 'play';
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.wep = 'fist';
    G.ammo = 0;
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
    G.shootCd = 0;
    clearFx();
    if (isClash()) {
      G.theme = 'alley';
      G.levelW = 2000;
      G.ents = [];
      G.crates = [makeCrate(360), makeCrate(900), makeCrate(1500)];
      G.drops = [makeDrop(640, 'med'), makeDrop(1180, 'pistol')];
      G.bullets = [];
      G.player = makePlayer(280);
      G.camX = 0;
      G.stage = 1;
      spawnWave(1);
    } else {
      loadStage(1, false);
    }
    hideOverlay();
    audio.start();
    toast(isClash() ? '火并' : STAGES[0].name, false, !isClash());
    setHint(isClash() ? '一潮接一潮 · 飞车更密 · 连击清场' : '往右打 · 捡枪打空变拳 · 跳过飞车 · 打到金王', '');
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'street';
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.wep = 'fist';
    G.ammo = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.invuln = 0;
    G.deadT = 0;
    G.why = '';
    clearFx();
    loadStage(1, true);
    G.wep = 'fist';
    showOverlay('title', '制裁', '往右清街。拳打、开枪，捡手枪和霰弹直到打空。暴徒、枪手、飞车，打到裂脸和金王。');
    setHint('往右清街 · 空格拳/射 · 捡枪会打空 · 跳过飞车', '');
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
    var why = G.why === 'life' ? '体力见底，倒在街上。' : '被打趴了。';
    showOverlay('lose', '倒了', why + ' 分数 ' + G.score + ' · 最高连击 ' + G.maxCombo);
    setHint('R 立刻重开', 'warn');
    syncHud();
  }
  function goWin() {
    G.mode = 'win';
    audio.win();
    kick(2, 'win-flash');
    screenFlash(GOLD, 0.5);
    showOverlay('win', '清街了', '夜巷到金库，制裁完毕。分数 ' + G.score + ' · 最高连击 ' + G.maxCombo);
    setHint('R 再来一局', 'hot');
    if (stageEl) stageEl.classList.add('win-flash');
    syncHud();
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    var m = comboMul(G.combo);
    if (m > G.mult) {
      G.mult = m;
      popCombo();
      audio.combo(m);
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 3);
  }
  function dropCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    G.chainN = 0;
    if (comboEl) comboEl.textContent = '×1';
    if (comboBox) comboBox.classList.remove('hot');
  }

  function respawn() {
    if (G.lives <= 0) {
      goLose();
      return;
    }
    var p = G.player;
    G.hp = HP_MAX;
    G.deadT = 0;
    G.hurtT = 0;
    G.invuln = INVULN;
    G.atkT = 0;
    G.airAtk = false;
    if (p) {
      p.y = GY;
      p.vy = 0;
      p.act = 'idle';
      p.squash = 1.2;
    }
    dropCombo();
    syncHud();
  }

  function hurtPlayer(dmg, fromX, knock, why) {
    if (G.invuln > 0 || G.deadT > 0 || G.mode === 'title') return;
    var p = G.player;
    G.hp -= dmg;
    G.hurtT = 0.28;
    G.invuln = INVULN;
    if (p) {
      p.vx = (p.x < fromX ? -1 : 1) * (knock || 140);
      p.vy = Math.min(p.vy, -90);
      p.act = 'hurt';
    }
    dropCombo();
    audio.hurt();
    kick(4.2, 'die');
    screenFlash(MAG, 0.35);
    emit(10, {
      x: p.x, y: p.y - 16, j: 8,
      vx0: -80, vx1: 80, vy0: -220, vy1: -40,
      r0: 1.4, r1: 3.4, life: 0.4, rgb: MAG
    });
    G.why = why || 'life';
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
      if (p) {
        p.act = 'down';
        p.vy = -160;
      }
      syncPips();
    }
  }

  function grabWep(id) {
    var spec = WEPS[id];
    if (!spec || !spec.ammo) return;
    G.wep = id;
    G.ammo = spec.ammo;
    audio.pickup();
    toast(spec.name + ' ×' + spec.ammo, false, id === 'shotgun');
    addScore(SCORE.gun);
    syncWep();
  }

  function spawnDrop(x, kind) {
    G.drops.push(makeDrop(x, kind));
  }

  function killEnt(e, face) {
    e.dead = true;
    e.deadT = 0.55;
    e.vy = -220;
    e.vx = (face || 1) * 120;
    popRing(e.x, e.y - 16, HOT, e.kind === 'car' ? 34 : 26);
    var ks = Math.round((KINDS[e.kind] ? KINDS[e.kind].score : 160) * G.mult);
    addScore(ks);
    popFloat(e.x, e.y - 36, '+' + ks, isBoss(e.kind) ? GOLD : HOT);
    if (e.kind === 'gunner' && Math.random() < 0.28) spawnDrop(e.x, 'pistol');
    if (e.kind === 'car' && Math.random() < 0.42) spawnDrop(e.x, 'shotgun');
    if (isBoss(e.kind)) {
      spawnDrop(e.x, 'med');
      screenFlash(GOLD, 0.45);
      kick(6, 'boom');
      toast((KINDS[e.kind] ? KINDS[e.kind].name : '头目') + '倒了', false, true);
      audio.boss();
    }
    if (e.kind === 'car') {
      emit(22, {
        x: e.x, y: e.y - 12, j: 16,
        vx0: -220, vx1: 220, vy0: -320, vy1: -20,
        r0: 2, r1: 5.5, life: 0.55, rgb: ORG
      });
      audio.carHit();
      kick(5, 'boom');
    }
  }

  function damageEnt(e, dmg, face, knock, stop, down, rgb) {
    if (e.dead || e.hurtT > 0.1) return false;
    e.hp -= dmg;
    e.hurtT = 0.14;
    e.stunT = down ? 0.42 : (e.kind === 'car' ? 0.08 : 0.2);
    e.flash = 0.12;
    if (e.kind !== 'car') e.face = -face;
    e.vx = face * (e.kind === 'car' ? knock * 0.25 : knock);
    if ((down || knock > 80) && e.kind !== 'car') e.vy = -160;
    e.act = e.kind === 'car' ? 'drive' : 'hurt';
    bumpCombo();
    hitStop(stop);
    kick(down ? 4.4 : 2.6, down ? 'boom' : 'hit');
    var hx = e.x;
    var hy = e.y - (e.h * 0.45);
    emit(down ? 14 : 9, {
      x: hx, y: hy, j: 10,
      vx0: face * 40, vx1: face * 220, vy0: -240, vy1: -20,
      r0: 1.5, r1: 3.8, life: 0.42, rgb: rgb || HOT
    });
    emit(4, {
      x: hx, y: hy, j: 6,
      vx0: -40, vx1: 40, vy0: -180, vy1: -40,
      r0: 1.2, r1: 2.6, life: 0.3, rgb: GOLD
    });
    popSpark(hx, hy, rgb || HOT, down ? 22 : 14);
    var pts = Math.round(SCORE.hit * G.mult * (down ? 1.4 : 1));
    addScore(pts);
    popFloat(hx, hy - 10, '+' + pts, GOLD);
    if (e.hp <= 0) killEnt(e, face);
    syncBoss();
    return true;
  }

  function hitEntMelee(e, spec, p) {
    if (e.dead || e.hurtT > 0.12) return false;
    var dx = (e.x - p.x) * p.face;
    var reach = spec.reach + (e.kind === 'car' ? 18 : 10);
    if (dx < 8 || dx > reach) return false;
    if (Math.abs((p.y - 14) - (e.y - e.h * 0.5)) > 28 + (G.atkAir ? 18 : 0)) return false;
    audio.punchHit(G.combo, spec.down);
    return damageEnt(e, spec.dmg, p.face, spec.knock, spec.stop, spec.down, SKULL);
  }

  function hitCrates(spec, p) {
    var i, c, dx;
    for (i = 0; i < G.crates.length; i++) {
      c = G.crates[i];
      if (c.dead) continue;
      dx = (c.x - p.x) * p.face;
      if (dx < 4 || dx > spec.reach + 8) continue;
      if (Math.abs(p.y - GY) > 36) continue;
      smashCrate(c, p.face);
      G.atkHit = true;
    }
  }

  function smashCrate(c, face) {
    var r;
    c.dead = true;
    c.deadT = 0.4;
    bumpCombo();
    audio.crate();
    hitStop(0.04);
    kick(2.2, 'thump');
    emit(12, {
      x: c.x, y: GY - 14, j: 8,
      vx0: -160, vx1: 160, vy0: -280, vy1: -40,
      r0: 1.6, r1: 4, life: 0.45, rgb: BRN
    });
    addScore(Math.round(SCORE.crate * G.mult));
    r = hash2((c.x * 17) | 0);
    if (r > 0.72) spawnDrop(c.x, 'shotgun');
    else if (r > 0.42) spawnDrop(c.x, 'pistol');
    else if (r > 0.22) spawnDrop(c.x, 'med');
    if (face) c.deadT = 0.4;
  }

  function tryHit() {
    var p = G.player;
    if (!p || G.atkHit) return;
    var spec = punchSpec();
    var i, e, any = false;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (hitEntMelee(e, spec, p)) any = true;
    }
    hitCrates(spec, p);
    if (any) G.atkHit = true;
  }

  function doPunch() {
    if (G.deadT > 0) return;
    if (G.mode !== 'play' && G.mode !== 'title') return;
    if (G.atkT > 0) {
      var spec = punchSpec();
      if (G.atkT < spec.t * 0.5) G.atkBuf = 1;
      return;
    }
    startPunch();
  }
  function startPunch() {
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
    if (G.chainN > 3) G.chainN = 1;
    var spec = punchSpec();
    G.atkT = spec.t;
    G.atkHit = false;
    G.atkBuf = 0;
    p.act = G.atkAir ? 'kick' : 'atk';
    audio.whoosh();
    swingTrail(p.x, p.y - 18, p.face);
  }

  function fireGun(kind, x, y, face, foe) {
    var spec = WEPS[kind] || WEPS.pistol;
    var n = spec.n || 1;
    var i, ang, spd, b;
    for (i = 0; i < n; i++) {
      ang = n === 1 ? 0 : (i - (n - 1) / 2) * spec.spread;
      spd = spec.spd * (foe ? 0.48 : 1);
      b = {
        x: x, y: y,
        vx: Math.cos(ang) * spd * face,
        vy: Math.sin(ang) * spd,
        foe: !!foe,
        dmg: spec.dmg,
        knock: spec.knock,
        kind: kind,
        life: kind === 'shotgun' ? 0.28 : 0.55,
        dead: false,
        face: face
      };
      G.bullets.push(b);
    }
    capArr(G.bullets, 80);
  }

  function doShoot() {
    var p = G.player;
    var spec, mx, my;
    if (!p || G.deadT > 0) return;
    if (G.mode !== 'play' && G.mode !== 'title') return;
    if (G.shootCd > 0) return;
    if (!armed()) {
      audio.empty();
      G.wep = 'fist';
      G.ammo = 0;
      syncWep();
      doPunch();
      return;
    }
    spec = WEPS[G.wep];
    G.ammo -= 1;
    G.shootCd = spec.cd;
    p.act = 'shoot';
    p.vx += -p.face * (spec.id === 'shotgun' ? 46 : 18);
    mx = p.x + p.face * (spec.id === 'shotgun' ? 22 : 18);
    my = p.y - 22;
    fireGun(spec.id, mx, my, p.face, false);
    popMuzzle(mx, my, p.face, spec.id);
    casings.push({
      x: p.x + p.face * 4, y: my + 2,
      vx: -p.face * rand(40, 90), vy: rand(-180, -80),
      t: 0, life: 0.45, rot: rand(0, TAU)
    });
    capArr(casings, 24);
    if (spec.id === 'shotgun') {
      audio.shotgun();
      hitStop(spec.stop * 0.45);
      kick(3.2, 'boom');
      screenFlash(ORG, 0.22);
      emit(8, {
        x: mx, y: my, j: 4,
        vx0: p.face * 80, vx1: p.face * 260, vy0: -80, vy1: 80,
        r0: 1.4, r1: 3.2, life: 0.22, rgb: GOLD, g: 0
      });
    } else {
      audio.pistol();
      kick(1.6, 'hit');
      emit(4, {
        x: mx, y: my, j: 3,
        vx0: p.face * 60, vx1: p.face * 180, vy0: -40, vy1: 40,
        r0: 1, r1: 2.2, life: 0.16, rgb: GOLD, g: 0
      });
    }
    if (G.ammo <= 0) {
      G.wep = 'fist';
      G.ammo = 0;
      toast('空了', true, false);
      audio.empty();
    }
    syncWep();
  }

  function doAtk() {
    if (armed()) doShoot();
    else doPunch();
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
    var e, dx;
    if (!p) return;
    demo.l = false;
    demo.r = false;
    demo.jump = false;
    e = nearestEnt();
    if (!e) {
      demo.r = p.x < 380;
      demo.l = p.x > 780;
      if (G.drops.length && !G.drops[0].taken && Math.abs(G.drops[0].x - p.x) < 80) {
        if (G.drops[0].x > p.x) demo.r = true;
        else demo.l = true;
      }
      return;
    }
    dx = e.x - p.x;
    if ((e.kind === 'gunner' || e.kind === 'car') && Math.abs(dx) < 210 && p.grounded) demo.jump = true;
    if (armed() && Math.abs(dx) > 40 && Math.abs(dx) < 280) {
      if (dx > 0) p.face = 1;
      else p.face = -1;
      if (G.shootCd <= 0) doShoot();
      if (Math.abs(dx) > 160) {
        if (dx > 0) demo.r = true;
        else demo.l = true;
      }
      return;
    }
    if (Math.abs(dx) > 26) {
      if (dx > 0) demo.r = true;
      else demo.l = true;
    } else if (G.atkT <= 0) {
      doPunch();
    }
  }

  function updatePlayer(dt) {
    var p = G.player;
    var ax, spd, busy, spec, wasGround;
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
    if (G.shootCd > 0) G.shootCd -= dt;
    if (p.act === 'shoot' && G.shootCd <= 0.06) p.act = 'idle';
    if (playing() && armed() && keys.atk && G.shootCd <= 0 && G.hurtT <= 0) doShoot();

    if (G.atkT > 0) {
      spec = punchSpec();
      G.atkT -= dt;
      if (!G.atkHit && G.atkT <= spec.t - spec.h0 && G.atkT >= spec.t - spec.h1) tryHit();
      if (G.atkT <= 0) {
        G.atkT = 0;
        if (G.atkBuf > 0 && p.grounded && !armed()) {
          G.atkBuf = 0;
          startPunch();
        } else {
          p.act = 'idle';
          if (p.grounded) G.airAtk = false;
        }
      }
    }

    busy = G.atkT > 0 && G.atkT > punchSpec().t * 0.28 && p.grounded && G.hurtT <= 0;
    if (p.act === 'shoot' && G.shootCd > 0.08) busy = true;
    ax = 0;
    if (!busy) {
      if (inL()) ax -= 1;
      if (inR()) ax += 1;
    }
    if (ax) p.face = ax;
    spd = WALK * (p.grounded ? 1 : AIR);
    if (G.hurtT > 0) {
      p.vx *= Math.max(0, 1 - 6 * dt);
    } else if (busy) {
      p.vx *= Math.max(0, 1 - 8 * dt);
    } else {
      p.vx = ax * spd;
    }
    p.x += p.vx * dt;
    p.x = clamp(p.x, 18, G.levelW - 18);
    if (G.arena) p.x = clamp(p.x, Math.max(18, G.lockL), Math.min(G.levelW - 18, G.lockR));

    wasGround = p.grounded;
    if (p.grounded) p.coyote = COYOTE;
    else p.coyote -= dt;
    if (inJump()) G.jumpBuf = BUFFER;
    else {
      G.jumpBuf -= dt;
      if (!p.grounded && p.vy < -80) p.vy *= Math.pow(0.42, dt * 8);
    }
    if (G.jumpBuf > 0 && p.coyote > 0 && G.hurtT <= 0 && G.atkT <= 0) {
      p.vy = -JUMP_V;
      p.grounded = false;
      G.jumpBuf = 0;
      p.coyote = 0;
      G.airAtk = false;
      audio.hop();
      p.squash = 0.78;
    }

    p.vy += GRAV * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    p.y += p.vy * dt;
    if (p.y >= GY) {
      p.y = GY;
      if (!wasGround && p.vy > 180) {
        audio.land();
        p.squash = 1.18;
      }
      p.vy = 0;
      p.grounded = true;
      G.atkAir = false;
      if (p.act === 'kick') p.act = 'idle';
    } else {
      p.grounded = false;
    }

    if (ax && p.grounded && G.atkT <= 0 && p.act !== 'shoot') {
      p.run += dt * 10;
      p.act = 'run';
    } else if (G.atkT <= 0 && p.act !== 'shoot' && p.act !== 'hurt' && p.grounded) {
      p.act = 'idle';
      p.run = 0;
    }
    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.0002, dt));
  }

  function facePlayer(e) {
    var p = G.player;
    if (!p) return;
    if (Math.abs(p.x - e.x) > 8) e.face = p.x > e.x ? 1 : -1;
  }

  function walkToward(e, dt, distKeep) {
    var p = G.player;
    var dx, want;
    if (!p) return;
    dx = p.x - e.x;
    want = (Math.abs(dx) > (distKeep || 28)) ? (dx > 0 ? 1 : -1) : 0;
    e.face = dx > 0 ? 1 : -1;
    e.vx = want * e.spd;
    e.x += e.vx * dt;
    e.act = want ? 'run' : 'idle';
    e.run += dt * 8;
  }

  function meleeHitPlayer(e) {
    var p = G.player;
    if (!p || e.atkHit) return;
    if (Math.abs(e.x + e.face * 16 - p.x) < 22 && Math.abs(e.y - p.y) < 28) {
      e.atkHit = true;
      hurtPlayer(e.dmg, e.x, 150, e.kind);
    }
  }

  function updateThug(e, dt) {
    var p = G.player;
    if (e.act === 'atk') {
      e.atkT -= dt;
      if (e.atkT < 0.22 && e.atkT > 0.1) meleeHitPlayer(e);
      if (e.atkT <= 0) { e.act = 'idle'; e.cd = 0.5; }
      return;
    }
    if (p && Math.abs(p.x - e.x) < 32 && e.cd <= 0 && Math.abs(p.y - e.y) < 30) {
      e.act = 'atk';
      e.atkT = 0.34;
      e.atkHit = false;
      facePlayer(e);
      audio.whoosh();
      return;
    }
    walkToward(e, dt, 26);
  }

  function updateGunner(e, dt) {
    var p = G.player;
    var dx, adx;
    if (!p) { e.act = 'idle'; return; }
    dx = p.x - e.x;
    adx = Math.abs(dx);
    e.face = dx > 0 ? 1 : -1;
    if (adx < 110) {
      e.vx = -e.face * e.spd;
      e.x += e.vx * dt;
      e.act = 'run';
    } else if (adx > 240) {
      walkToward(e, dt, 180);
    } else {
      e.vx = 0;
      e.act = 'idle';
      if (e.cd <= 0) {
        fireGun('pistol', e.x + e.face * 16, e.y - 20, e.face, true);
        popMuzzle(e.x + e.face * 16, e.y - 20, e.face, 'pistol');
        audio.pistol();
        e.cd = rand(0.9, 1.4);
        e.act = 'shoot';
      }
    }
  }

  function updateCar(e, dt) {
    var p = G.player;
    if (p && Math.abs(p.x - e.x) > 520 && Math.abs(e.vx) < 24) {
      e.act = 'idle';
      e.face = p.x > e.x ? 1 : -1;
      return;
    }
    e.act = 'drive';
    if (p && Math.abs(e.vx) < 24) e.face = p.x > e.x ? 1 : -1;
    if (Math.abs(e.vx) < 24) e.vx = e.face * e.spd;
    e.x += e.vx * dt;
    e.run += dt * 14;
    if (e.x < 24) { e.face = 1; e.vx = e.spd; }
    if (e.x > G.levelW - 24) { e.face = -1; e.vx = -e.spd; }
    if (p && Math.abs(e.x - p.x) < 30 && p.y >= GY - 14 && !e.dead) {
      hurtPlayer(e.dmg, e.x, 200, 'car');
    }
  }

  function updateJigsaw(e, dt) {
    var p = G.player;
    var adx;
    if (!p) return;
    adx = Math.abs(p.x - e.x);
    facePlayer(e);
    if (e.act === 'atk') {
      e.atkT -= dt;
      if (e.atkT < 0.2 && e.atkT > 0.08) meleeHitPlayer(e);
      if (e.atkT <= 0) { e.act = 'idle'; e.cd = 0.45; }
      return;
    }
    if (e.act === 'shoot') {
      e.atkT -= dt;
      if (e.atkT <= 0) { e.act = 'idle'; e.cd = 0.7; }
      return;
    }
    if (adx < 40 && e.cd <= 0) {
      e.act = 'atk';
      e.atkT = 0.36;
      e.atkHit = false;
      return;
    }
    if (adx > 70 && adx < 220 && e.cd <= 0) {
      fireGun('shotgun', e.x + e.face * 18, e.y - 22, e.face, true);
      popMuzzle(e.x + e.face * 18, e.y - 22, e.face, 'shotgun');
      audio.shotgun();
      e.act = 'shoot';
      e.atkT = 0.32;
      e.cd = 1.1;
      return;
    }
    walkToward(e, dt, 36);
  }

  function updateIron(e, dt) {
    var p = G.player;
    var adx;
    if (!p) return;
    adx = Math.abs(p.x - e.x);
    if (e.act === 'wind') {
      e.atkT -= dt;
      e.flash = 0.2;
      e.face = p.x > e.x ? 1 : -1;
      if (e.atkT <= 0) {
        e.act = 'charge';
        e.atkT = 0.55;
        e.vx = e.face * 280;
        e.atkHit = false;
        audio.charge();
      }
      return;
    }
    if (e.act === 'charge') {
      e.atkT -= dt;
      e.x += e.vx * dt;
      if (!e.atkHit && p && Math.abs(e.x - p.x) < 28 && p.y >= GY - 20) {
        e.atkHit = true;
        hurtPlayer(e.dmg, e.x, 220, 'iron');
      }
      if (e.atkT <= 0) { e.act = 'idle'; e.cd = 1.15; e.vx = 0; }
      return;
    }
    if (e.act === 'atk') {
      e.atkT -= dt;
      if (e.atkT < 0.22 && e.atkT > 0.1) meleeHitPlayer(e);
      if (e.atkT <= 0) { e.act = 'idle'; e.cd = 0.6; }
      return;
    }
    if (adx < 38 && e.cd <= 0) {
      e.act = 'atk';
      e.atkT = 0.38;
      e.atkHit = false;
      facePlayer(e);
      return;
    }
    if (adx < 300 && adx > 70 && e.cd <= 0) {
      e.act = 'wind';
      e.atkT = 0.42;
      return;
    }
    walkToward(e, dt, 40);
  }

  function updateKing(e, dt) {
    var p = G.player;
    var adx, minion;
    if (!p) return;
    adx = Math.abs(p.x - e.x);
    e.summonT -= dt;
    if (e.act === 'slam') {
      e.atkT -= dt;
      if (!e.atkHit && e.atkT < 0.22 && e.atkT > 0.08) {
        e.atkHit = true;
        if (p && Math.abs(p.x - e.x) < 54 && p.y >= GY - 16) {
          hurtPlayer(e.dmg, e.x, 240, 'king');
          kick(5, 'boom');
        }
        emit(16, {
          x: e.x, y: GY - 4, j: 18,
          vx0: -200, vx1: 200, vy0: -220, vy1: -20,
          r0: 2, r1: 4.5, life: 0.4, rgb: GOLD
        });
      }
      if (e.atkT <= 0) { e.act = 'idle'; e.cd = 0.9; }
      return;
    }
    if (e.summonT <= 0 && livingCount() < 6) {
      e.summonT = 4.4;
      minion = makeEnt(e.x - e.face * 70, 'thug', isClash() ? G.wave : 0);
      G.ents.push(minion);
      popRing(minion.x, GY - 18, GOLD, 18);
    }
    if (adx < 48 && e.cd <= 0) {
      e.act = 'slam';
      e.atkT = 0.46;
      e.atkHit = false;
      facePlayer(e);
      audio.charge();
      return;
    }
    walkToward(e, dt, 44);
  }

  function updateEnt(e, dt) {
    if (e.dead) {
      e.deadT -= dt;
      e.vy += GRAV * dt;
      e.y += e.vy * dt;
      e.x += e.vx * dt;
      if (e.y > GY) { e.y = GY; e.vy = 0; e.vx *= 0.86; }
      return;
    }
    if (e.hurtT > 0) e.hurtT -= dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.cd > 0) e.cd -= dt;
    if (e.stunT > 0) {
      e.stunT -= dt;
      e.x += e.vx * dt;
      e.vx *= Math.max(0, 1 - 8 * dt);
      e.vy += GRAV * dt;
      e.y += e.vy * dt;
      if (e.y > GY) { e.y = GY; e.vy = 0; }
      return;
    }
    if (e.kind === 'car') updateCar(e, dt);
    else if (e.kind === 'gunner') updateGunner(e, dt);
    else if (e.kind === 'jigsaw') updateJigsaw(e, dt);
    else if (e.kind === 'iron') updateIron(e, dt);
    else if (e.kind === 'king') updateKing(e, dt);
    else updateThug(e, dt);

    if (e.kind !== 'car') {
      e.vy += GRAV * dt;
      e.y += e.vy * dt;
      if (e.y > GY) { e.y = GY; e.vy = 0; e.grounded = true; }
    }
    e.x = clamp(e.x, 16, G.levelW - 16);
    e.squash = lerp(e.squash || 1, 1, 1 - Math.pow(0.0002, dt));
  }

  function bulletHitsEnt(b, e) {
    var hw = (e.w * 0.5) + 5;
    var hh = (e.h * 0.5) + 4;
    return Math.abs(b.x - e.x) < hw && Math.abs(b.y - (e.y - e.h * 0.5)) < hh;
  }

  function updateBullets(dt) {
    var i, b, j, e, p, hit;
    p = G.player;
    for (i = G.bullets.length - 1; i >= 0; i--) {
      b = G.bullets[i];
      if (b.dead) { G.bullets.splice(i, 1); continue; }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.x < G.camX - 40 || b.x > G.camX + VW + 40) {
        G.bullets.splice(i, 1);
        continue;
      }
      if (b.foe) {
        if (p && G.deadT <= 0 && Math.abs(b.x - p.x) < 10 && Math.abs(b.y - (p.y - 18)) < 12) {
          G.bullets.splice(i, 1);
          hurtPlayer(2, b.x, 120, 'gun');
          popSpark(p.x, p.y - 18, MAG, 12);
        }
      } else {
        hit = false;
        for (j = 0; j < G.ents.length; j++) {
          e = G.ents[j];
          if (e.dead) continue;
          if (bulletHitsEnt(b, e)) {
            audio.punchHit(G.combo, b.kind === 'shotgun');
            damageEnt(e, b.dmg, b.face, b.knock, b.kind === 'shotgun' ? 0.068 : 0.036, b.kind === 'shotgun', b.kind === 'shotgun' ? ORG : CYN);
            hit = true;
            break;
          }
        }
        if (!hit) {
          for (j = 0; j < G.crates.length; j++) {
            e = G.crates[j];
            if (e.dead) continue;
            if (Math.abs(b.x - e.x) < 12 && Math.abs(b.y - (GY - 12)) < 14) {
              smashCrate(e, b.face);
              hit = true;
              break;
            }
          }
        }
        if (hit) G.bullets.splice(i, 1);
      }
    }
  }

  function updateDrops(dt) {
    var i, d, p = G.player;
    for (i = 0; i < G.drops.length; i++) {
      d = G.drops[i];
      if (d.taken) continue;
      d.bob += dt * 4;
      if (!p || G.deadT > 0) continue;
      if (Math.abs(d.x - p.x) < 16 && Math.abs(p.y - GY) < 28) {
        d.taken = true;
        if (d.kind === 'med') {
          G.hp = Math.min(HP_MAX, G.hp + 5);
          addScore(SCORE.med);
          audio.med();
          toast('药包', false, true);
          popFloat(d.x, d.y - 12, '+5', MAG);
          syncHud();
        } else {
          grabWep(d.kind);
          popFloat(d.x, d.y - 12, wepName(d.kind), GOLD);
        }
        popSpark(d.x, d.y, GOLD, 14);
      }
    }
  }

  function updateCrates(dt) {
    var i, c;
    for (i = 0; i < G.crates.length; i++) {
      c = G.crates[i];
      if (c.dead && c.deadT > 0) c.deadT -= dt;
    }
  }

  function updateFx(dt) {
    var i, p, s;
    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      p.life -= dt;
      p.vy += (p.g || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.18) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.32) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      s = floats[i];
      s.t += dt;
      s.y -= 28 * dt;
      if (s.t > s.life) floats.splice(i, 1);
    }
    for (i = trails.length - 1; i >= 0; i--) {
      trails[i].t += dt;
      if (trails[i].t > trails[i].life) trails.splice(i, 1);
    }
    for (i = muzzles.length - 1; i >= 0; i--) {
      muzzles[i].t += dt;
      if (muzzles[i].t > muzzles[i].life) muzzles.splice(i, 1);
    }
    for (i = casings.length - 1; i >= 0; i--) {
      s = casings[i];
      s.t += dt;
      s.vy += 520 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rot += dt * 10;
      if (s.t > s.life) casings.splice(i, 1);
    }
  }

  function updateCamera(dt) {
    var p = G.player;
    var boss = findBoss();
    var target, maxX;
    if (!p) return;
    if (boss && Math.abs(p.x - boss.x) < 380 && G.mode === 'play') {
      if (!G.arena) {
        G.arena = true;
        G.lockL = clamp(boss.x - 300, 0, G.levelW);
        G.lockR = clamp(boss.x + 220, 0, G.levelW);
        audio.boss();
        toast(KINDS[boss.kind].name, false, true);
      }
    } else if (!boss) {
      G.arena = false;
    }
    target = p.x - 180;
    if (G.arena) {
      target = clamp(target, G.lockL, Math.max(G.lockL, G.lockR - VW));
    }
    maxX = Math.max(0, G.levelW - VW);
    target = clamp(target, 0, maxX);
    G.camX = lerp(G.camX, target, 1 - Math.pow(0.0008, dt));
    G.camY = 0;
  }

  function tryClear() {
    if (!playing() || G.clearT > 0 || G.deadT > 0) return;
    if (G.spawnQ.length > 0 || G.waveT > 0) return;
    if (livingCount() > 0) return;
    G.clearT = 1.15;
    if (isClash()) {
      addScore(Math.round(SCORE.wave * G.wave * G.mult));
      toast('清了', false, true);
    } else {
      addScore(Math.round(SCORE.stage * G.stage * G.mult));
      toast((STAGES[G.stage - 1] || STAGES[0]).name + ' 清了', false, true);
      audio.stage();
    }
  }

  function advanceClear() {
    var keepHp, keepWep, keepAmmo;
    if (isClash()) {
      spawnWave(G.wave + 1);
      G.clearT = 0;
      return;
    }
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    keepHp = Math.min(HP_MAX, G.hp + 4);
    keepWep = G.wep;
    keepAmmo = G.ammo;
    loadStage(G.stage + 1, false);
    G.hp = keepHp;
    G.wep = keepWep;
    G.ammo = keepAmmo;
    G.invuln = 0.55;
    G.clearT = 0;
    toast(STAGES[G.stage - 1].name, false, true);
    setHint(G.stage === 3 ? '金库 · 金王砸地召兵' : '码头 · 铁卫会冲撞', G.stage === 3 ? 'hot' : '');
    syncHud();
  }

  function updateSpawns(dt) {
    var i, s, e;
    if (G.waveT > 0) G.waveT -= dt;
    for (i = G.spawnQ.length - 1; i >= 0; i--) {
      s = G.spawnQ[i];
      s.t -= dt;
      if (s.t <= 0 && G.waveT <= 0) {
        e = makeEnt(s.x, s.kind, G.wave);
        G.ents.push(e);
        G.spawnQ.splice(i, 1);
      }
    }
  }

  function pruneDead() {
    var i, e;
    for (i = G.ents.length - 1; i >= 0; i--) {
      e = G.ents[i];
      if (e.dead && e.deadT <= 0) G.ents.splice(i, 1);
    }
  }

  function update(dt) {
    var i;
    G.clock += dt;
    G.t += dt;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0003, dt));
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) dropCombo();
    }
    updateFx(dt);

    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }

    if (G.mode === 'title') demoThink();
    if (G.mode === 'title' || G.mode === 'play') {
      updatePlayer(dt);
      for (i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
      updateBullets(dt);
      updateDrops(dt);
      updateCrates(dt);
      updateCamera(dt);
      if (playing()) {
        updateSpawns(dt);
        tryClear();
        if (G.clearT > 0) {
          G.clearT -= dt;
          if (G.clearT <= 0) advanceClear();
        }
      }
      pruneDead();
      if (G.mode === 'title' && livingCount() === 0) {
        G.ents.push(makeEnt(clamp((G.player ? G.player.x : 200) + 360, 80, G.levelW - 80), 'thug', 0));
      }
      if (playing()) syncBoss();
    }
  }

  function fillRound(x, y, w, h, r) {
    if (w < 1 || h < 1) return;
    r = Math.min(r || 0, w * 0.5, h * 0.5);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
    ctx.fill();
  }

  function drawSky() {
    var g, i, tw, px, py;
    g = ctx.createLinearGradient(0, oy, 0, sy(GY));
    if (G.theme === 'docks') {
      g.addColorStop(0, '#081018');
      g.addColorStop(0.55, '#101820');
      g.addColorStop(1, '#1a1410');
    } else if (G.theme === 'vault') {
      g.addColorStop(0, '#1a100c');
      g.addColorStop(0.5, '#241410');
      g.addColorStop(1, '#2a1810');
    } else {
      g.addColorStop(0, '#180606');
      g.addColorStop(0.5, '#1c0a0a');
      g.addColorStop(1, '#241010');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    if (G.theme !== 'vault') {
      ctx.fillStyle = 'rgba(255,227,107,0.16)';
      ctx.beginPath();
      ctx.arc(sx(G.camX + 520), sy(48), 22 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,227,107,0.55)';
      ctx.beginPath();
      ctx.arc(sx(G.camX + 520), sy(48), 8 * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < 18; i++) {
      tw = hash2(i * 19 + (G.theme === 'vault' ? 3 : 1));
      px = ((i * 137 + G.camX * 0.12) % (VW + 40)) - 20;
      py = 18 + tw * 90;
      ctx.fillStyle = rgba(WHT, 0.1 + tw * 0.18);
      ctx.fillRect(ox + px * scale, oy + py * scale, 1.4 * scale, 1.4 * scale);
    }
  }

  function drawBuildings() {
    var x, w, h, b, wy, wx, lit, sign, signs;
    var start = ((G.camX / 70) | 0) - 1;
    var end = start + 16;
    signs = G.theme === 'docks' ? ['码头', '仓储', '吊机'] : G.theme === 'vault' ? ['金库', '禁地', '金条'] : ['酒吧', '当铺', '通缉'];
    for (b = start; b < end; b++) {
      x = b * 70;
      w = 54 + hash2(b * 3) * 18;
      h = 90 + hash2(b * 7) * 80;
      if (G.theme === 'docks') {
        ctx.fillStyle = b % 3 === 0 ? '#1a2430' : '#141c28';
        fillRound(sx(x), sy(GY - 8 - h), w * scale, (h + 10) * scale, 2 * scale);
        ctx.fillStyle = 'rgba(80,110,130,0.35)';
        ctx.fillRect(sx(x + 8), sy(GY - h + 10), 8 * scale, h * 0.55 * scale);
        if (hash2(b) > 0.6) {
          ctx.strokeStyle = 'rgba(160,180,200,0.35)';
          ctx.lineWidth = 3 * scale;
          ctx.beginPath();
          ctx.moveTo(sx(x + w * 0.5), sy(GY - h - 28));
          ctx.lineTo(sx(x + w * 0.5), sy(GY - h));
          ctx.stroke();
          ctx.fillStyle = rgba(STEEL, 0.45);
          ctx.fillRect(sx(x + w * 0.5 - 16), sy(GY - h - 8), 32 * scale, 4 * scale);
        }
      } else if (G.theme === 'vault') {
        ctx.fillStyle = b % 2 === 0 ? '#2a1c14' : '#321810';
        ctx.fillRect(sx(x), sy(GY - 8 - h), w * scale, (h + 10) * scale);
        ctx.fillStyle = rgba(GOLD, 0.1 + 0.06 * Math.sin(G.clock * 2 + b));
        ctx.fillRect(sx(x + 10), sy(GY - h + 20), (w - 20) * scale, h * 0.7 * scale);
        ctx.fillStyle = 'rgba(220,190,120,0.22)';
        ctx.fillRect(sx(x + w * 0.42), sy(GY - h - 8), 6 * scale, 18 * scale);
      } else {
        ctx.fillStyle = b % 2 === 0 ? '#2a1410' : '#20100e';
        ctx.fillRect(sx(x), sy(GY - 8 - h), w * scale, (h + 10) * scale);
        ctx.fillStyle = 'rgba(255,48,18,0.06)';
        ctx.fillRect(sx(x), sy(GY - 8 - h), 3 * scale, (h + 10) * scale);
        for (wy = 16; wy < h - 20; wy += 16) {
          for (wx = 8; wx < w - 10; wx += 12) {
            lit = hash2(b * 31 + wy + wx) > 0.55;
            ctx.fillStyle = lit
              ? (hash2(b + wx) > 0.7 ? rgba(GOLD, 0.45) : rgba(HOT, 0.32))
              : 'rgba(8,4,4,0.7)';
            ctx.fillRect(sx(x + wx), sy(GY - h + wy), 7 * scale, 8 * scale);
          }
        }
      }
      if (hash2(b * 11) > 0.7) {
        sign = signs[b % signs.length];
        ctx.fillStyle = rgba(hash2(b) > 0.5 ? HOT : CYN, 0.62);
        ctx.font = '700 ' + (7 * scale) + 'px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(sign, sx(x + 8), sy(GY - h + 14));
      }
    }
  }

  function drawGround() {
    var g, i, x;
    g = ctx.createLinearGradient(0, sy(GY - 6), 0, sy(VH));
    if (G.theme === 'docks') {
      g.addColorStop(0, '#2a2418');
      g.addColorStop(0.4, '#181410');
      g.addColorStop(1, '#0c0a08');
    } else if (G.theme === 'vault') {
      g.addColorStop(0, '#3a2418');
      g.addColorStop(1, '#180c08');
    } else {
      g.addColorStop(0, '#2a1814');
      g.addColorStop(0.4, '#1a1010');
      g.addColorStop(1, '#100808');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(G.camX - 20), sy(GY), (VW + 40) * scale, (VH - GY + 20) * scale);
    ctx.fillStyle = rgba(HOT, 0.4);
    ctx.fillRect(sx(G.camX - 20), sy(GY), (VW + 40) * scale, 2 * scale);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    for (i = 0; i < 14; i++) {
      x = ((i * 90 - G.camX * 0.4) % (VW + 80)) + G.camX - 40;
      ctx.fillRect(sx(x), sy(GY + 10), 40 * scale, 3 * scale);
    }
    if (G.theme === 'vault') {
      ctx.fillStyle = rgba(HOT, 0.12);
      ctx.fillRect(sx(G.camX - 20), sy(GY + 6), (VW + 40) * scale, 8 * scale);
    }
    if (G.theme === 'docks') {
      ctx.fillStyle = rgba(CYN, 0.08 + 0.04 * Math.sin(G.clock * 2));
      ctx.beginPath();
      ctx.moveTo(sx(G.camX - 10), sy(VH));
      for (i = 0; i <= 12; i++) {
        ctx.lineTo(sx(G.camX + i * 56), sy(VH - 8 - Math.sin(G.clock * 3 + i) * 3));
      }
      ctx.lineTo(sx(G.camX + VW + 10), sy(VH));
      ctx.fill();
    }
  }

  function drawCrate(c) {
    if (c.dead && c.deadT <= 0) return;
    var x = sx(c.x);
    var y = sy(GY);
    var a = c.dead ? clamp(c.deadT / 0.4, 0, 1) : 1;
    ctx.save();
    ctx.globalAlpha = a;
    if (c.dead) ctx.translate(0, (1 - a) * 8 * scale);
    ctx.fillStyle = '#6a4a28';
    fillRound(x - 10 * scale, y - 18 * scale, 20 * scale, 18 * scale, 2 * scale);
    ctx.fillStyle = '#8a6236';
    ctx.fillRect(x - 10 * scale, y - 18 * scale, 20 * scale, 4 * scale);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(x - 1 * scale, y - 16 * scale, 2 * scale, 14 * scale);
    ctx.fillRect(x - 8 * scale, y - 10 * scale, 16 * scale, 2 * scale);
    ctx.restore();
  }

  function drawDrop(d) {
    if (d.taken) return;
    var x = sx(d.x);
    var y = sy(d.y - Math.sin(d.bob) * 3);
    ctx.save();
    ctx.translate(x, y);
    if (d.kind === 'med') {
      ctx.fillStyle = rgba(HOT, 0.95);
      fillRound(-7 * scale, -6 * scale, 14 * scale, 12 * scale, 2 * scale);
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.fillRect(-1.4 * scale, -4.5 * scale, 2.8 * scale, 9 * scale);
      ctx.fillRect(-4.5 * scale, -1.4 * scale, 9 * scale, 2.8 * scale);
    } else if (d.kind === 'shotgun') {
      ctx.fillStyle = rgba(BRN, 1);
      ctx.fillRect(-10 * scale, -2 * scale, 20 * scale, 4 * scale);
      ctx.fillStyle = rgba(STEEL, 1);
      ctx.fillRect(2 * scale, -3 * scale, 10 * scale, 3 * scale);
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.fillRect(-8 * scale, -3.2 * scale, 4 * scale, 5 * scale);
    } else {
      ctx.fillStyle = rgba(STEEL, 1);
      ctx.fillRect(-8 * scale, -2 * scale, 16 * scale, 3.2 * scale);
      ctx.fillStyle = rgba(LEATH, 1);
      ctx.fillRect(-6 * scale, 0, 6 * scale, 3 * scale);
    }
    ctx.restore();
  }

  function drawShadow(x, y, sc) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(GY + 1), 12 * scale * (sc || 1), 3.4 * scale, 0, 0, TAU);
    ctx.fill();
  }

  function drawSkullEmblem(sc) {
    ctx.fillStyle = rgba(SKULL, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -20 * sc, 5.4 * sc, 6.1 * sc, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#0a0606';
    ctx.beginPath();
    ctx.ellipse(-2.1 * sc, -21.4 * sc, 1.55 * sc, 1.75 * sc, 0, 0, TAU);
    ctx.ellipse(2.1 * sc, -21.4 * sc, 1.55 * sc, 1.75 * sc, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -20 * sc);
    ctx.lineTo(-1.1 * sc, -17.6 * sc);
    ctx.lineTo(1.1 * sc, -17.6 * sc);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#0a0606';
    ctx.fillRect(-2.6 * sc, -16.4 * sc, 1.2 * sc, 1.5 * sc);
    ctx.fillRect(-0.6 * sc, -16.4 * sc, 1.2 * sc, 1.5 * sc);
    ctx.fillRect(1.4 * sc, -16.4 * sc, 1.2 * sc, 1.5 * sc);
  }

  function drawGun(kind, sc, face) {
    var ext = 1;
    ctx.save();
    ctx.translate(8 * sc, -20 * sc);
    if (kind === 'shotgun') {
      ctx.fillStyle = rgba(BRN, 1);
      ctx.fillRect(0, 0, 18 * sc * ext, 3.4 * sc);
      ctx.fillStyle = rgba(STEEL, 1);
      ctx.fillRect(8 * sc, -1.2 * sc, 14 * sc, 2.8 * sc);
      ctx.fillStyle = rgba(LEATH, 1);
      ctx.fillRect(-3 * sc, 1 * sc, 6 * sc, 4 * sc);
    } else {
      ctx.fillStyle = rgba(STEEL, 1);
      ctx.fillRect(0, 0, 14 * sc * ext, 2.6 * sc);
      ctx.fillStyle = rgba(LEATH, 1);
      ctx.fillRect(-2 * sc, 1.4 * sc, 5 * sc, 3.4 * sc);
    }
    ctx.restore();
  }

  function drawFrank(p, blink) {
    var sc = scale * (p.squash || 1);
    var bob = p.act === 'run' ? Math.sin(p.run) * 1.6 : (p.act === 'idle' ? Math.sin(G.clock * 5) * 0.6 : 0);
    var atk = p.act === 'atk' || p.act === 'kick';
    var fistExt = atk ? 1 : 0;
    ctx.save();
    if (blink) ctx.globalAlpha = ((G.t * 16) | 0) % 2 === 0 ? 0.38 : 0.92;
    ctx.translate(sx(p.x), sy(p.y));
    ctx.scale(p.face, 1);
    if (p.act === 'down') ctx.rotate(0.55);
    if (p.act === 'kick') ctx.rotate(-0.35);

    ctx.fillStyle = '#141010';
    fillRound(-6.2 * sc, -9 * sc + bob, 5.2 * sc, 10 * sc, 1 * sc);
    fillRound(1.2 * sc, -9 * sc + bob, 5.2 * sc, 10 * sc, 1 * sc);
    ctx.fillStyle = '#2a1c1c';
    fillRound(-5.8 * sc, -3 * sc + bob, 4.4 * sc, 4 * sc, 0.8 * sc);
    fillRound(1.6 * sc, -3 * sc + bob, 4.4 * sc, 4 * sc, 0.8 * sc);
    ctx.fillStyle = rgba(LEATH, 1);
    fillRound(-8 * sc, -31 * sc + bob, 16 * sc, 23 * sc, 3 * sc);
    ctx.fillStyle = rgba(HOT, 0.28);
    ctx.fillRect(-8 * sc, -31 * sc + bob, 2 * sc, 23 * sc);
    drawSkullEmblem(sc);
    ctx.fillStyle = rgba(SKIN, 1);
    ctx.beginPath();
    ctx.arc(0, -37 * sc + bob, 6.1 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1210';
    ctx.beginPath();
    ctx.ellipse(0.4 * sc, -40.6 * sc + bob, 5.8 * sc, 2.6 * sc, 0, Math.PI, TAU);
    ctx.fill();
    ctx.fillRect(-5.6 * sc, -41 * sc + bob, 11.2 * sc, 2.4 * sc);
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.fillRect(-3.1 * sc, -38.2 * sc + bob, 2.3 * sc, 1.5 * sc);
    ctx.fillRect(0.8 * sc, -38.2 * sc + bob, 2.3 * sc, 1.5 * sc);
    ctx.fillStyle = '#0a0606';
    ctx.fillRect(-2.4 * sc, -38 * sc + bob, 1.1 * sc, 1.2 * sc);
    ctx.fillRect(1.5 * sc, -38 * sc + bob, 1.1 * sc, 1.2 * sc);
    ctx.fillRect(-1.5 * sc, -34.2 * sc + bob, 3 * sc, 0.7 * sc);

    ctx.fillStyle = rgba(SKULL, 0.96);
    fillRound(-10.5 * sc, -24 * sc + bob, 4.2 * sc, 3.3 * sc, 1 * sc);
    if (p.act === 'shoot' && armed()) {
      drawGun(G.wep, sc, p.face);
      fillRound(6 * sc, -24 * sc + bob, 4.2 * sc, 3.3 * sc, 1 * sc);
    } else {
      fillRound((7 + 10 * fistExt) * sc, (-22 - 4 * fistExt) * sc + bob, 4.4 * sc, 3.5 * sc, 1.2 * sc);
      if (atk) {
        ctx.strokeStyle = rgba(WHT, 0.5);
        ctx.lineWidth = 1.4 * sc;
        ctx.beginPath();
        ctx.arc((12 + 8 * fistExt) * sc, (-22 - 4 * fistExt) * sc + bob, 6 * sc, 0, TAU);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawThugBody(e) {
    var sc = scale * e.scale * (e.squash || 1);
    var bob = e.act === 'run' ? Math.sin(e.run) * 1.4 : 0;
    var atk = e.act === 'atk' ? 1 : 0;
    ctx.save();
    ctx.translate(sx(e.x), sy(e.y));
    ctx.scale(e.face, 1);
    if (e.dead) ctx.rotate(0.7);
    ctx.fillStyle = '#3a2418';
    fillRound(-6 * sc, -8 * sc + bob, 5 * sc, 9 * sc, 1 * sc);
    fillRound(1 * sc, -8 * sc + bob, 5 * sc, 9 * sc, 1 * sc);
    ctx.fillStyle = '#4a2820';
    fillRound(-7 * sc, -28 * sc + bob, 14 * sc, 20 * sc, 2 * sc);
    ctx.strokeStyle = rgba(STEEL, 0.7);
    ctx.lineWidth = 1.4 * sc;
    ctx.beginPath();
    ctx.arc(0, -18 * sc + bob, 5 * sc, 0.2, 2.8);
    ctx.stroke();
    ctx.fillStyle = rgba(SKIN, 1);
    ctx.beginPath();
    ctx.arc(0, -34 * sc + bob, 5.6 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1010';
    ctx.beginPath();
    ctx.arc(-2.2 * sc, -34.6 * sc + bob, 1.1 * sc, 0, TAU);
    ctx.arc(2.2 * sc, -34.6 * sc + bob, 1.1 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.fillRect(1.6 * sc, -31.4 * sc + bob, 1.4 * sc, 1.2 * sc);
    ctx.fillStyle = rgba(SKIN, 1);
    fillRound((6 + 8 * atk) * sc, -20 * sc + bob, 3.6 * sc, 3.2 * sc, 1 * sc);
    ctx.restore();
  }

  function drawGunnerBody(e) {
    var sc = scale * e.scale * (e.squash || 1);
    var bob = e.act === 'run' ? Math.sin(e.run) * 1.2 : 0;
    ctx.save();
    ctx.translate(sx(e.x), sy(e.y));
    ctx.scale(e.face, 1);
    if (e.dead) ctx.rotate(0.7);
    ctx.fillStyle = '#2a3038';
    fillRound(-6 * sc, -8 * sc + bob, 5 * sc, 9 * sc, 1 * sc);
    fillRound(1 * sc, -8 * sc + bob, 5 * sc, 9 * sc, 1 * sc);
    ctx.fillStyle = '#243038';
    fillRound(-7 * sc, -28 * sc + bob, 14 * sc, 20 * sc, 2 * sc);
    ctx.fillStyle = '#1a2028';
    fillRound(-8 * sc, -38 * sc + bob, 16 * sc, 4 * sc, 1 * sc);
    ctx.fillStyle = rgba(SKIN, 1);
    ctx.beginPath();
    ctx.arc(0, -32 * sc + bob, 5.2 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(STEEL, 1);
    ctx.fillRect(6 * sc, -22 * sc + bob, 12 * sc, 2.4 * sc);
    ctx.fillStyle = rgba(LEATH, 1);
    ctx.fillRect(4 * sc, -20 * sc + bob, 4 * sc, 3 * sc);
    ctx.restore();
  }

  function drawCar(e) {
    var sc = scale;
    var a = e.dead ? clamp(e.deadT / 0.55, 0, 1) : 1;
    var spin = e.run;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(sx(e.x), sy(e.y));
    ctx.scale(e.face, 1);
    if (e.dead) ctx.rotate(-0.15);
    ctx.fillStyle = '#2a1c14';
    fillRound(-26 * sc, -20 * sc, 52 * sc, 16 * sc, 3 * sc);
    ctx.fillStyle = '#3a2a20';
    fillRound(-8 * sc, -28 * sc, 22 * sc, 10 * sc, 2 * sc);
    ctx.fillStyle = 'rgba(80,140,170,0.45)';
    ctx.fillRect(-4 * sc, -26 * sc, 14 * sc, 6 * sc);
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.fillRect(22 * sc, -16 * sc, 5 * sc, 3 * sc);
    ctx.fillStyle = rgba(HOT, 0.75);
    ctx.fillRect(-26 * sc, -16 * sc, 4 * sc, 3 * sc);
    ctx.fillStyle = '#1a1210';
    ctx.beginPath();
    ctx.arc(-14 * sc, -5 * sc, 5 * sc, 0, TAU);
    ctx.arc(14 * sc, -5 * sc, 5 * sc, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(STEEL, 0.6);
    ctx.lineWidth = 1.2 * sc;
    ctx.beginPath();
    ctx.arc(-14 * sc, -5 * sc, 2.4 * sc, spin, spin + 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawJigsaw(e) {
    var sc = scale * e.scale;
    var bob = e.act === 'run' ? Math.sin(e.run) * 1.2 : 0;
    ctx.save();
    ctx.translate(sx(e.x), sy(e.y));
    ctx.scale(e.face, 1);
    if (e.dead) ctx.rotate(0.55);
    ctx.fillStyle = '#3a2030';
    fillRound(-7 * sc, -9 * sc + bob, 6 * sc, 10 * sc, 1 * sc);
    fillRound(1 * sc, -9 * sc + bob, 6 * sc, 10 * sc, 1 * sc);
    ctx.fillStyle = '#4a2840';
    fillRound(-8 * sc, -32 * sc + bob, 16 * sc, 24 * sc, 3 * sc);
    ctx.fillStyle = rgba(SKIN, 1);
    ctx.beginPath();
    ctx.arc(0, -38 * sc + bob, 6.4 * sc, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(HOT, 0.85);
    ctx.lineWidth = 1.3 * sc;
    ctx.beginPath();
    ctx.moveTo(-4 * sc, -40 * sc + bob);
    ctx.lineTo(4 * sc, -36 * sc + bob);
    ctx.moveTo(2 * sc, -42 * sc + bob);
    ctx.lineTo(-1 * sc, -34 * sc + bob);
    ctx.stroke();
    ctx.fillStyle = '#1a1010';
    ctx.beginPath();
    ctx.arc(-2.4 * sc, -38.6 * sc + bob, 1.2 * sc, 0, TAU);
    ctx.arc(2.6 * sc, -37.6 * sc + bob, 1.4 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(STEEL, 1);
    ctx.fillRect(7 * sc, -24 * sc + bob, 16 * sc, 3.2 * sc);
    ctx.fillStyle = rgba(BRN, 1);
    ctx.fillRect(5 * sc, -22 * sc + bob, 6 * sc, 4 * sc);
    ctx.restore();
  }

  function drawIron(e) {
    var sc = scale * e.scale;
    var bob = e.act === 'run' ? Math.sin(e.run) * 1 : 0;
    var glow = e.act === 'wind' ? 0.5 + 0.4 * Math.sin(G.clock * 16) : 0.15;
    ctx.save();
    ctx.translate(sx(e.x), sy(e.y));
    ctx.scale(e.face, 1);
    if (e.dead) ctx.rotate(0.4);
    ctx.fillStyle = '#2a3038';
    fillRound(-8 * sc, -10 * sc + bob, 7 * sc, 11 * sc, 1 * sc);
    fillRound(1 * sc, -10 * sc + bob, 7 * sc, 11 * sc, 1 * sc);
    ctx.fillStyle = '#3a4450';
    fillRound(-10 * sc, -36 * sc + bob, 20 * sc, 28 * sc, 3 * sc);
    ctx.fillStyle = rgba(CYN, glow);
    fillRound(-6 * sc, -42 * sc + bob, 12 * sc, 8 * sc, 2 * sc);
    ctx.fillStyle = '#1a2028';
    fillRound(-7 * sc, -40 * sc + bob, 14 * sc, 6 * sc, 1 * sc);
    ctx.fillStyle = rgba(CYN, 0.7);
    ctx.fillRect(-4 * sc, -38 * sc + bob, 8 * sc, 2 * sc);
    ctx.restore();
  }

  function drawKing(e) {
    var sc = scale * e.scale;
    var bob = e.act === 'run' ? Math.sin(e.run) * 0.8 : 0;
    ctx.save();
    ctx.translate(sx(e.x), sy(e.y));
    ctx.scale(e.face, 1);
    if (e.dead) ctx.rotate(0.35);
    if (e.act === 'slam') ctx.translate(0, 4 * sc);
    ctx.fillStyle = '#1a1010';
    fillRound(-8 * sc, -10 * sc + bob, 7 * sc, 11 * sc, 1 * sc);
    fillRound(1 * sc, -10 * sc + bob, 7 * sc, 11 * sc, 1 * sc);
    ctx.fillStyle = rgba(SKULL, 0.92);
    fillRound(-11 * sc, -38 * sc + bob, 22 * sc, 30 * sc, 4 * sc);
    ctx.fillStyle = rgba(GOLD, 0.7);
    ctx.fillRect(-11 * sc, -22 * sc + bob, 22 * sc, 3 * sc);
    ctx.fillStyle = rgba(SKIN, 1);
    ctx.beginPath();
    ctx.arc(0, -44 * sc + bob, 7.4 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1010';
    ctx.beginPath();
    ctx.arc(-2.6 * sc, -44.4 * sc + bob, 1.3 * sc, 0, TAU);
    ctx.arc(2.6 * sc, -44.4 * sc + bob, 1.3 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(10 * sc, -40 * sc + bob, 3 * sc, 22 * sc);
    ctx.beginPath();
    ctx.arc(11.5 * sc, -42 * sc + bob, 3.2 * sc, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawEnt(e) {
    if (e.dead && e.deadT <= 0) return;
    var blink = e.flash > 0 && ((G.t * 24) | 0) % 2 === 0;
    drawShadow(e.x, e.y, e.kind === 'car' ? 2.2 : e.scale);
    if (blink) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
    }
    if (e.kind === 'car') drawCar(e);
    else if (e.kind === 'gunner') drawGunnerBody(e);
    else if (e.kind === 'jigsaw') drawJigsaw(e);
    else if (e.kind === 'iron') drawIron(e);
    else if (e.kind === 'king') drawKing(e);
    else drawThugBody(e);
    if (blink) ctx.restore();
    if (isBoss(e.kind) && !e.dead) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(sx(e.x - 16), sy(e.y - e.h - 14), 32 * scale, 3 * scale);
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.fillRect(sx(e.x - 16), sy(e.y - e.h - 14), 32 * scale * clamp(e.hp / e.max, 0, 1), 3 * scale);
    }
  }

  function drawBullet(b) {
    var x = sx(b.x);
    var y = sy(b.y);
    ctx.save();
    if (b.kind === 'shotgun') {
      ctx.fillStyle = rgba(ORG, 0.9);
      ctx.beginPath();
      ctx.arc(x, y, 2.4 * scale, 0, TAU);
      ctx.fill();
    } else {
      ctx.strokeStyle = rgba(b.foe ? MAG : GOLD, 0.9);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - b.face * 10 * scale, y);
      ctx.stroke();
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.beginPath();
      ctx.arc(x, y, 1.6 * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawTrails() {
    var i, t, a;
    for (i = 0; i < trails.length; i++) {
      t = trails[i];
      a = 1 - t.t / t.life;
      ctx.strokeStyle = rgba(SKULL, 0.45 * a);
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.arc(sx(t.x + t.face * 16), sy(t.y), (10 + t.t * 40) * scale, t.face > 0 ? -0.8 : 2.3, t.face > 0 ? 0.6 : 3.7);
      ctx.stroke();
    }
  }

  function drawMuzzles() {
    var i, m, a, len;
    for (i = 0; i < muzzles.length; i++) {
      m = muzzles[i];
      a = 1 - m.t / m.life;
      len = (m.kind === 'shotgun' ? 22 : 12) * a;
      ctx.save();
      ctx.translate(sx(m.x), sy(m.y));
      ctx.fillStyle = rgba(GOLD, 0.9 * a);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(m.face * len * scale, -5 * scale * a);
      ctx.lineTo(m.face * (len + 6) * scale, 0);
      ctx.lineTo(m.face * len * scale, 5 * scale * a);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.8 * a);
      ctx.beginPath();
      ctx.arc(0, 0, (m.kind === 'shotgun' ? 6 : 3.2) * scale * a, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawCasings() {
    var i, c, a;
    for (i = 0; i < casings.length; i++) {
      c = casings[i];
      a = 1 - c.t / c.life;
      ctx.save();
      ctx.translate(sx(c.x), sy(c.y));
      ctx.rotate(c.rot);
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(-2 * scale, -1 * scale, 4 * scale, 2 * scale);
      ctx.restore();
    }
  }

  function drawFx() {
    var i, p, s, r, f, a;
    drawCasings();
    drawTrails();
    drawMuzzles();
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      a = clamp(p.life / (p.max || 0.4), 0, 1);
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
    ctx.fillStyle = rgba(HOT, 0.12 + 0.06 * Math.sin(G.clock * 4));
    ctx.fillRect(sx(x), sy(40), 6 * scale, (GY - 40) * scale);
    ctx.fillStyle = rgba(GOLD, 0.7);
    ctx.font = (9 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('先打倒头目', sx(x + 4), sy(70));
  }

  function drawAmmoHud() {
    var p, i, n, max, x0;
    if (!playing() || !armed()) return;
    p = G.player;
    if (!p) return;
    n = G.ammo;
    max = WEPS[G.wep].ammo;
    x0 = sx(p.x - max * 3);
    for (i = 0; i < max; i++) {
      ctx.fillStyle = i < n ? rgba(G.wep === 'shotgun' ? GOLD : CYN, 0.85) : 'rgba(255,255,255,0.12)';
      ctx.fillRect(x0 + i * 6 * scale, sy(p.y - 52), 4 * scale, 6 * scale);
    }
  }

  function draw() {
    var i, p, shx = 0, shy = 0;
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#140404';
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
    for (i = 0; i < G.drops.length; i++) drawDrop(G.drops[i]);
    G.ents.sort(function (a, b) {
      if (a.kind === 'car' && b.kind !== 'car') return -1;
      if (b.kind === 'car' && a.kind !== 'car') return 1;
      return a.y - b.y;
    });
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    for (i = 0; i < G.bullets.length; i++) drawBullet(G.bullets[i]);
    p = G.player;
    if (p) {
      drawShadow(p.x, p.y, 1);
      drawFrank(p, G.invuln > 0 && G.mode !== 'title');
    }
    drawGate();
    drawFx();
    drawAmmoHud();

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

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (jump) keys.jump = down;
    if (space) keys.atk = down;

    if (down && (isMove || space || k === 'Enter')) e.preventDefault();
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
      if (k === '2' && G.mode === 'title') startGame('clash');
      return;
    }
    if (space) {
      if (playing() || G.mode === 'title') doAtk();
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
  if (btnClash) {
    btnClash.addEventListener('click', function () {
      audio.ensure();
      startGame('clash');
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
      if (G.mode === 'win' && !isClash()) startGame('clash');
      else goTitle();
    });
  }
  if (modeStreet) {
    modeStreet.addEventListener('click', function () {
      audio.ensure();
      startGame('street');
    });
  }
  if (modeClash) {
    modeClash.addEventListener('click', function () {
      audio.ensure();
      startGame('clash');
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
    }
  });

  requestAnimationFrame(frame);
})();
