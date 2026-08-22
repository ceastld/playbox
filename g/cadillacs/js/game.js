'use strict';

/* 恐龙 — Cadillacs and Dinosaurs arcade lite. Side-scroll brawler. No CDN. Distinct from 神龟. */

(function () {
  var VW = 640;
  var VH = 360;
  var GY = 318;
  var LIVES = 3;
  var LIFE_CAP = 6;
  var LIFE_EVERY = 20000;
  var HP_MAX = 16;
  var CAR_HP = 8;
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
  var WALK = 188;
  var BEST_KEY = 'playbox-cadillacs-best';
  var MUTE_KEY = 'playbox-cadillacs-mute';
  var OPS = '方向 / WASD 走 · 上跳 · 空格出拳 · R 重开 · M 静音';

  var MAG = [255, 61, 184];
  var CYN = [0, 240, 255];
  var GOLD = [255, 227, 107];
  var HOT = [255, 122, 26];
  var HOT2 = [255, 178, 74];
  var WHT = [246, 239, 230];
  var SKIN = [232, 176, 132];
  var LEA = [90, 180, 48];
  var SPLAT = [200, 70, 36];
  var OLIVE = [106, 138, 50];
  var OLIVE2 = [72, 98, 36];
  var BELLY = [200, 180, 90];
  var CREAM = [240, 208, 176];
  var PINK = [232, 160, 168];
  var CHROME = [216, 224, 232];
  var LEATHER = [168, 58, 24];
  var JEAN = [58, 90, 136];
  var DUST = [160, 120, 80];
  var LAVA = [255, 70, 24];

  var GUNS = {
    pistol: { id: 'pistol', name: '手枪', ammo: 8, dmg: 2, cd: 0.22, spd: 520 },
    smg: { id: 'smg', name: '冲锋', ammo: 16, dmg: 1, cd: 0.09, spd: 580 }
  };

  var KINDS = {
    thug: { hp: 3, name: '匪徒', spd: 92, dmg: 2, score: 160, reach: 26, w: 16, h: 28, scale: 1 },
    gunner: { hp: 3, name: '枪手', spd: 72, dmg: 2, score: 220, reach: 20, w: 16, h: 28, scale: 1 },
    raptor: { hp: 4, name: '迅猛', spd: 138, dmg: 2, score: 280, reach: 30, w: 26, h: 22, scale: 1 },
    ptero: { hp: 3, name: '翼龙', spd: 118, dmg: 2, score: 240, reach: 22, w: 28, h: 18, scale: 1 },
    alpha: { hp: 22, name: '迅猛王', spd: 124, dmg: 3, score: 3600, reach: 36, w: 32, h: 30, scale: 1.28 },
    trike: { hp: 24, name: '角龙', spd: 58, dmg: 3, score: 4000, reach: 38, w: 36, h: 40, scale: 1.42 },
    rex: { hp: 32, name: '暴龙', spd: 70, dmg: 4, score: 6000, reach: 42, w: 40, h: 56, scale: 1.7 }
  };

  var SCORE = {
    hit: 40, gun: 28, ram: 50, crate: 80, med: 120, gunGet: 100,
    stage: 1500, wave: 600
  };

  var STAGES = [
    {
      name: '废镇', w: 2360, theme: 'town',
      ents: [
        [340, 'thug'], [500, 'thug'], [680, 'raptor'], [860, 'gunner'],
        [1040, 'thug'], [1220, 'raptor'], [1380, 'thug'], [1760, 'gunner'],
        [1920, 'raptor']
      ],
      crates: [420, 980, 1540],
      guns: [[640, 'pistol'], [1280, 'smg']],
      meds: [880, 1700],
      car: [1480, 1960],
      boss: ['trike', 2140]
    },
    {
      name: '密林', w: 2680, theme: 'jungle',
      ents: [
        [320, 'raptor'], [480, 'ptero'], [640, 'thug'], [820, 'raptor'],
        [1020, 'raptor'], [1180, 'ptero'], [1340, 'raptor'], [1480, 'thug'],
        [1680, 'raptor'], [1860, 'ptero'], [2040, 'gunner'], [2180, 'raptor']
      ],
      crates: [400, 1680, 2000],
      guns: [[540, 'smg'], [1840, 'pistol']],
      meds: [760, 2060],
      car: [880, 1520],
      boss: ['alpha', 2420]
    },
    {
      name: '火山', w: 2240, theme: 'volcano',
      ents: [
        [300, 'thug'], [460, 'raptor'], [620, 'gunner'], [800, 'ptero'],
        [980, 'raptor'], [1160, 'thug'], [1340, 'raptor'], [1500, 'ptero'],
        [1680, 'gunner']
      ],
      crates: [520, 1100, 1480],
      guns: [[700, 'smg'], [1320, 'pistol']],
      meds: [900, 1600],
      car: null,
      boss: ['rex', 1960]
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
  function isDino(kind) {
    return kind === 'raptor' || kind === 'ptero' || kind === 'alpha' || kind === 'trike' || kind === 'rex';
  }
  function isBoss(kind) {
    return kind === 'alpha' || kind === 'trike' || kind === 'rex';
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (STAGES[0].name !== '废镇' || STAGES[1].name !== '密林' || STAGES[2].name !== '火山') throw new Error('names');
    if (!STAGES[0].car || !STAGES[1].car || STAGES[2].car) throw new Error('car rides');
    if (STAGES[0].boss[0] !== 'trike' || STAGES[1].boss[0] !== 'alpha' || STAGES[2].boss[0] !== 'rex') throw new Error('bosses');
    if (LIVES !== 3) throw new Error('3 lives');
    if (HP_MAX < 12) throw new Error('hp');
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(3) !== 2) throw new Error('combo 3');
    if (comboMul(9) !== 5) throw new Error('combo 9');
    if (BEST_KEY !== 'playbox-cadillacs-best') throw new Error('best key');
    if (kindHp('thug', 0) !== 3) throw new Error('thug hp');
    if (kindHp('rex', 1) <= kindHp('raptor', 1)) throw new Error('boss hp');
    if (waveCount(1) < 4 || waveCount(20) > 14) throw new Error('wave cap');
    if (jumpH() < 50) throw new Error('jump');
    if (!GUNS.pistol || GUNS.pistol.ammo !== 8 || GUNS.smg.ammo !== 16) throw new Error('guns');
    if (WALK < 160) throw new Error('walk');
    var i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ents.length) throw new Error('ents');
      if (s.w < 2000) throw new Error('short stage');
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
  var btnWaste = document.getElementById('btn-waste');
  var btnTide = document.getElementById('btn-tide');
  var ovAgain = document.getElementById('ov-again');
  var ovMenu = document.getElementById('ov-menu');
  var modeWaste = document.getElementById('mode-waste');
  var modeTide = document.getElementById('mode-tide');
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
  var gunLabel = document.getElementById('gun-label');
  var rideLabel = document.getElementById('ride-label');
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

  var keys = { l: false, r: false, jump: false, atk: false };
  var demo = { l: false, r: true, jump: false };
  var pips = [];
  var particles = [];
  var sparks = [];
  var rings = [];
  var floats = [];
  var trails = [];

  var G = {
    mode: 'title',
    kind: 'waste',
    t: 0,
    clock: 0,
    stage: 1,
    wave: 1,
    camX: 0,
    camY: 0,
    levelW: 2360,
    theme: 'town',
    ents: [],
    crates: [],
    guns: [],
    meds: [],
    bullets: [],
    shots: [],
    car: null,
    inCar: false,
    player: null,
    lives: LIVES,
    hp: HP_MAX,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    chainN: 0,
    gun: null,
    ammo: 0,
    gunCd: 0,
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
    waveLeft: 0,
    spawnQ: [],
    clearT: 0,
    arena: false,
    lockL: 0,
    lockR: 0,
    ramT: 0
  };

  function isTide() {
    return G.kind === 'tide';
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
  function gunSpec() {
    return G.gun && GUNS[G.gun] ? GUNS[G.gun] : null;
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
    hit: function (combo, dino) {
      this.ensure();
      var lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.05, dino ? 0.05 : 0.04, dino ? 420 : 900);
      this.beep((dino ? 140 : 240) * lift, 0.08, 'square', 0.05, 70);
      this.beep(520 * lift, 0.05, 'triangle', 0.028, 180);
    },
    splat: function () {
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
    gun: function (smg) {
      this.ensure();
      this.noise(0.045, smg ? 0.032 : 0.044, smg ? 1600 : 1100);
      this.beep(smg ? 420 : 280, smg ? 0.04 : 0.07, 'square', smg ? 0.03 : 0.045, 80);
    },
    pickup: function () {
      this.ensure();
      this.beep(520, 0.07, 'square', 0.04, 880);
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
    engine: function () {
      this.ensure();
      this.noise(0.12, 0.04, 180);
      this.beep(90, 0.18, 'sawtooth', 0.045, 55);
      this.beep(140, 0.12, 'square', 0.03, 90);
    },
    honk: function () {
      this.ensure();
      this.beep(220, 0.1, 'square', 0.05, 180);
      this.beep(180, 0.12, 'sawtooth', 0.04, 140);
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
    var t = isTide();
    if (modeWaste) modeWaste.setAttribute('aria-pressed', t ? 'false' : 'true');
    if (modeTide) modeTide.setAttribute('aria-pressed', t ? 'true' : 'false');
  }
  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 3);
    if (stageLabel) {
      if (isTide()) stageLabel.textContent = '潮 ' + G.wave;
      else stageLabel.textContent = (STAGES[G.stage - 1] || STAGES[0]).name;
      stageLabel.classList.toggle('hot', isTide() ? G.wave >= 5 : G.stage >= 3);
    }
    if (tagLabel) {
      tagLabel.textContent = isTide() ? '兽潮' : '荒原';
      tagLabel.classList.toggle('warn', isTide());
      tagLabel.classList.toggle('hot', !isTide() && G.stage >= 3);
    }
    if (gunLabel) {
      var gs = gunSpec();
      gunLabel.textContent = gs ? (gs.name + ' ' + G.ammo) : '拳';
      gunLabel.classList.toggle('hot', !!gs);
    }
    if (rideLabel) rideLabel.hidden = !G.inCar;
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'DINO';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' && !isTide() ? '兽潮' : '换模式';
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
    trails.push({ x: x, y: y, face: face, t: 0, life: 0.16, reach: 34 });
    capArr(trails, 18);
  }
  function splatAt(x, y, face, dino, big) {
    var rgb = dino ? LEA : MAG;
    var rgb2 = dino ? SPLAT : GOLD;
    var n = big ? 22 : (dino ? 14 : 9);
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
    if (dino && big) {
      popRing(x, y, LEA, 28);
      audio.splat();
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
    var spec = KINDS[kind] || KINDS.thug;
    var fly = kind === 'ptero';
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
      ramHit: 0
    };
  }
  function makeCar(x, end) {
    return {
      x: x, y: GY, vx: 0, vy: 0, end: end, hp: CAR_HP, max: CAR_HP,
      hopT: 0, used: false, rumble: 0, squash: 1, live: true
    };
  }
  function makeCrate(x) {
    return { x: x, hp: 1, dead: false, deadT: 0 };
  }
  function makeGun(x, type) {
    return { x: x, y: GY - 12, type: type === 'smg' ? 'smg' : 'pistol', taken: false, bob: rand(0, TAU) };
  }
  function makeMed(x) {
    return { x: x, y: GY - 12, taken: false, bob: rand(0, TAU) };
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
    G.guns = [];
    G.meds = [];
    G.bullets = [];
    G.shots = [];
    G.arena = false;
    G.lockL = 0;
    G.lockR = spec.w;
    G.camX = 0;
    G.camY = 0;
    G.player = makePlayer(72);
    G.inCar = false;
    G.car = spec.car ? makeCar(spec.car[0], spec.car[1]) : null;
    G.atkT = 0;
    G.atkHit = false;
    G.atkBuf = 0;
    G.atkAir = false;
    G.airAtk = false;
    G.deadT = 0;
    G.hurtT = 0;
    G.chainN = 0;
    G.clearT = 0;
    G.ramT = 0;
    G.gunCd = 0;
    if (!demoMode) {
      for (i = 0; i < spec.ents.length; i++) {
        e = spec.ents[i];
        G.ents.push(makeEnt(e[0], e[1], 0));
      }
      if (spec.boss) G.ents.push(makeEnt(spec.boss[1], spec.boss[0], 0));
      for (i = 0; i < spec.crates.length; i++) G.crates.push(makeCrate(spec.crates[i]));
      for (i = 0; i < spec.guns.length; i++) G.guns.push(makeGun(spec.guns[i][0], spec.guns[i][1]));
      for (i = 0; i < spec.meds.length; i++) G.meds.push(makeMed(spec.meds[i]));
    } else {
      G.ents.push(makeEnt(420, 'thug', 0));
      G.ents.push(makeEnt(640, 'raptor', 0));
      G.ents.push(makeEnt(860, 'gunner', 0));
      G.crates.push(makeCrate(300));
      G.guns.push(makeGun(520, 'pistol'));
      G.car = makeCar(1080, 1480);
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
      if (n >= 8 && n % 8 === 0 && i === 0) kind = 'rex';
      else if (n >= 4 && n % 4 === 0 && i === 0) kind = 'trike';
      else if (n >= 6 && n % 6 === 0 && i === 1) kind = 'alpha';
      else if (n >= 2 && i % 4 === 2) kind = 'ptero';
      else if (i % 5 === 1) kind = 'gunner';
      else if (i % 2 === 0) kind = 'raptor';
      else kind = 'thug';
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
    G.kind = kind === 'tide' ? 'tide' : 'waste';
    G.mode = 'play';
    G.lives = LIVES;
    G.hp = HP_MAX;
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
    G.gun = null;
    G.ammo = 0;
    G.gunCd = 0;
    G.inCar = false;
    clearFx();
    if (isTide()) {
      G.theme = 'town';
      G.levelW = 2100;
      G.ents = [];
      G.crates = [makeCrate(360), makeCrate(900), makeCrate(1500)];
      G.guns = [makeGun(640, 'pistol'), makeGun(1280, 'smg')];
      G.meds = [makeMed(480), makeMed(1100)];
      G.bullets = [];
      G.shots = [];
      G.car = null;
      G.player = makePlayer(280);
      G.camX = 0;
      G.stage = 1;
      spawnWave(1);
    } else {
      loadStage(1, false);
    }
    hideOverlay();
    audio.start();
    toast(isTide() ? '兽潮' : STAGES[0].name, false, !isTide());
    setHint(isTide() ? '一潮接一潮 · 迅猛更多 · 连击清场' : '往右打 · 捡枪 · 上车兜风 · 打到暴龙', '');
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'waste';
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    G.gun = null;
    G.ammo = 0;
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '恐龙', '向右清场。拳打匪徒与恐龙，地上捡枪，偶遇凯迪拉克兜风。体力打空扣一命，过关见头目。');
    setHint('往右打 · 拳与枪 · 上车兜风 · 打到暴龙', '');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('waste');
    else startGame(G.kind || 'waste');
  }
  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('waste');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    kick(7, 'die');
    var why = G.why === 'life' ? '体力见底，倒在荒原。' : '被撕开了。';
    showOverlay('lose', '倒了', why + ' 分数 ' + G.score + ' · 最高连击 ' + G.maxCombo);
    setHint('R 立刻重开', 'warn');
    syncHud();
  }
  function goWin() {
    G.mode = 'win';
    audio.win();
    kick(2, 'win-flash');
    screenFlash(GOLD, 0.5);
    showOverlay('win', '清场了', '荒原暂时安静。分数 ' + G.score + ' · 最高连击 ' + G.maxCombo);
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
    if (G.inCar) {
      hurtCar(dmg);
      return;
    }
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
  function hurtCar(dmg) {
    var c = G.car;
    if (!c || !G.inCar) return;
    c.hp -= dmg;
    c.rumble = 0.18;
    kick(3.2, 'thump');
    audio.hurt();
    emit(8, {
      x: c.x + 10, y: c.y - 18, j: 8,
      vx0: -90, vx1: 90, vy0: -160, vy1: -20,
      r0: 1.4, r1: 3.2, life: 0.36, rgb: GOLD
    });
    if (c.hp <= 0) {
      c.hp = 0;
      c.live = false;
      toast('车毁了', true, false);
      exitCar(true);
      G.invuln = 0;
      hurtPlayer(2, c.x, 180);
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
    G.inCar = false;
    syncHud();
    toast('再起', false, true);
  }

  function enterCar() {
    var c = G.car;
    var p = G.player;
    if (!c || !p || G.inCar || !c.live) return;
    G.inCar = true;
    c.used = true;
    c.hp = Math.max(c.hp, CAR_HP);
    c.live = true;
    p.grounded = true;
    p.vy = 0;
    p.act = 'sit';
    audio.engine();
    toast('上车', false, true);
    kick(2.4, 'thump');
    screenFlash(PINK, 0.22);
    syncHud();
  }
  function exitCar(wreck) {
    var p = G.player;
    var c = G.car;
    if (!G.inCar) return;
    G.inCar = false;
    if (p) {
      p.vy = wreck ? -160 : -90;
      p.grounded = false;
      p.act = 'jump';
      if (c) p.x = c.x + 18;
    }
    if (c) c.vx = wreck ? 40 : 80;
    if (!wreck) toast('下车', false, false);
    syncHud();
  }

  function atkSpec() {
    var air = G.atkAir;
    var chain = G.chainN;
    var spec = {
      t: 0.18, h0: 0.04, h1: 0.12, dmg: 1, reach: 30,
      knock: 70, stop: 0.042, down: false
    };
    if (air) {
      spec.t = 0.26;
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
    return spec;
  }

  function doAtk() {
    if (G.deadT > 0) return;
    if (G.mode !== 'play' && G.mode !== 'title') return;
    if (G.inCar) {
      if (G.ammo > 0) shoot();
      else ramPulse();
      return;
    }
    if (G.ammo > 0 && G.gunCd <= 0) {
      shoot();
      return;
    }
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
    audio.whoosh();
    swingTrail(p.x, p.y - 18, p.face);
  }
  function shoot() {
    var p = G.player;
    var gs = gunSpec();
    if (!p || !gs || G.ammo <= 0 || G.gunCd > 0) return;
    G.ammo -= 1;
    G.gunCd = gs.cd;
    G.shots.push({
      x: p.x + p.face * (G.inCar ? 28 : 16),
      y: p.y - (G.inCar ? 22 : 18),
      vx: p.face * gs.spd,
      dmg: gs.dmg,
      life: 0.7,
      smg: gs.id === 'smg'
    });
    audio.gun(gs.id === 'smg');
    popSpark(p.x + p.face * 18, p.y - 18, GOLD, 10);
    emit(4, {
      x: p.x + p.face * 16, y: p.y - 18, j: 3,
      vx0: p.face * 40, vx1: p.face * 120, vy0: -40, vy1: 20,
      r0: 1, r1: 2.2, life: 0.18, rgb: GOLD, g: 40
    });
    if (G.ammo <= 0) {
      G.gun = null;
      toast('没弹了', false, false);
      syncHud();
    } else syncHud();
  }
  function ramPulse() {
    if (G.ramT > 0.12) return;
    G.ramT = 0.28;
    audio.honk();
    kick(2.2, 'thump');
    if (G.car) {
      emit(6, {
        x: G.car.x + 36, y: G.car.y - 8, j: 6,
        vx0: 40, vx1: 160, vy0: -80, vy1: -10,
        r0: 1.4, r1: 3, life: 0.3, rgb: DUST, g: 80
      });
    }
  }

  function applyHit(e, opt) {
    if (e.dead || e.hurtT > 0.1) return false;
    var p = G.player;
    var face = opt.face || (p ? p.face : 1);
    var dino = isDino(e.kind);
    e.hp -= opt.dmg;
    e.hurtT = 0.16;
    e.stunT = opt.down ? 0.42 : 0.2;
    e.flash = 0.12;
    e.face = -face;
    e.vx = face * (opt.knock || 80);
    if (opt.down || e.kind === 'ptero') e.vy = -160;
    e.act = 'hurt';
    bumpCombo();
    audio.hit(G.combo, dino);
    hitStop(opt.stop || 0.045);
    kick(opt.down ? 4.4 : (dino ? 3.1 : 2.6), opt.down ? 'boom' : 'hit');
    var hx = e.x - face * 6;
    var hy = e.y - (e.h * 0.45);
    splatAt(hx, hy, face, dino, false);
    var base = opt.pts || SCORE.hit;
    var pts = Math.round(base * G.mult * (opt.down ? 1.4 : 1));
    addScore(pts);
    popFloat(hx, hy - 10, '+' + pts, GOLD);
    if (e.hp <= 0) killEnt(e, face, opt.knock || 80);
    return true;
  }
  function killEnt(e, face, knock) {
    var dino = isDino(e.kind);
    e.dead = true;
    e.deadT = 0.55;
    e.vy = -220;
    e.vx = face * (knock + 80);
    e.act = 'down';
    splatAt(e.x, e.y - e.h * 0.5, face, dino, true);
    var ks = Math.round((KINDS[e.kind] ? KINDS[e.kind].score : 160) * G.mult);
    addScore(ks);
    popFloat(e.x, e.y - 36, '+' + ks, dino ? LEA : HOT);
    if (isBoss(e.kind)) {
      screenFlash(GOLD, 0.45);
      kick(6, 'boom');
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
      stop: spec.stop, down: spec.down, pts: SCORE.hit
    });
  }
  function smashCrate(c, face) {
    if (c.dead) return;
    c.dead = true;
    c.deadT = 0.4;
    audio.crate();
    hitStop(0.04);
    kick(2.2, 'thump');
    emit(12, {
      x: c.x, y: GY - 14, j: 8,
      vx0: -160, vx1: 160, vy0: -280, vy1: -40,
      r0: 1.6, r1: 4, life: 0.45, rgb: DUST
    });
    addScore(Math.round(SCORE.crate * Math.max(1, G.mult)));
    var h = hash2((c.x * 17) | 0);
    if (h > 0.72) G.guns.push(makeGun(c.x, h > 0.88 ? 'smg' : 'pistol'));
    else if (h > 0.48) G.meds.push(makeMed(c.x));
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
      smashCrate(c, p.face);
    }
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

  function demoThink() {
    var p = G.player;
    var e, dx, g, i;
    if (!p) return;
    demo.l = false;
    demo.r = false;
    demo.jump = false;
    if (G.inCar) {
      if (G.ammo > 0 && G.gunCd <= 0) shoot();
      else if (G.ramT <= 0) ramPulse();
      return;
    }
    if (G.car && G.car.live && Math.abs(G.car.x - p.x) < 220 && p.x < G.car.end - 40) {
      if (G.car.x > p.x + 12) demo.r = true;
      else if (G.car.x < p.x - 12) demo.l = true;
      return;
    }
    for (i = 0; i < G.guns.length; i++) {
      g = G.guns[i];
      if (!g.taken && Math.abs(g.x - p.x) < 180 && Math.abs(g.x - p.x) > 16) {
        if (g.x > p.x) demo.r = true;
        else demo.l = true;
        return;
      }
    }
    e = nearestEnt();
    if (!e) {
      demo.r = p.x < 420;
      demo.l = p.x > 780;
      return;
    }
    dx = e.x - p.x;
    if ((e.kind === 'gunner' || e.kind === 'ptero') && Math.abs(dx) < 210 && p.grounded) demo.jump = true;
    if (Math.abs(dx) > 28) {
      if (dx > 0) demo.r = true;
      else demo.l = true;
    } else if (G.atkT <= 0) {
      doAtk();
    }
  }

  function updatePlayer(dt) {
    var p = G.player;
    var ax, spd, busy;
    if (!p) return;
    if (G.gunCd > 0) G.gunCd -= dt;
    if (G.ramT > 0) G.ramT -= dt;
    if (G.inCar) {
      if (G.deadT > 0) {
        G.deadT -= dt;
        if (G.deadT <= 0) respawn();
        return;
      }
      if (G.hurtT > 0) G.hurtT -= dt;
      if (G.invuln > 0 && G.mode !== 'title') G.invuln -= dt;
      p.act = 'sit';
      p.grounded = true;
      p.face = 1;
      return;
    }
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

    if (G.atkT > 0) p.act = G.atkAir ? 'spin' : 'atk';
    else if (!p.grounded) p.act = 'jump';
    else if (G.hurtT > 0) p.act = 'hurt';
    else if (ax) p.act = 'walk';
    else p.act = 'idle';

    if (G.car && G.car.live && !G.inCar && p.grounded && G.deadT <= 0 && G.mode !== 'lose') {
      if (Math.abs(p.x - G.car.x) < 22 && Math.abs(p.y - G.car.y) < 18) enterCar();
    }
  }

  function updateAtk(dt) {
    if (G.inCar) return;
    if (G.atkT <= 0) {
      if (G.atkBuf && G.deadT <= 0) startAtk();
      return;
    }
    var spec = atkSpec();
    var prev = G.atkT;
    G.atkT -= dt;
    if (!G.atkHit && prev > spec.t - spec.h1 && G.atkT <= spec.t - spec.h0) tryHit();
    if (G.atkT <= 0) {
      G.atkT = 0;
      if (G.atkBuf) startAtk();
    }
  }

  function updateCar(dt) {
    var c = G.car;
    var p = G.player;
    var i, e, cr;
    if (!c) return;
    c.squash = lerp(c.squash, 1, 10 * dt);
    if (c.rumble > 0) c.rumble -= dt;
    c.vy += GRAV * dt;
    c.y += c.vy * dt;
    if (c.y >= GY) {
      if (c.vy > 80) c.squash = 1.12;
      c.y = GY;
      c.vy = 0;
    }
    if (!G.inCar) {
      c.vx *= Math.max(0, 1 - 3 * dt);
      c.x += c.vx * dt;
      return;
    }
    if (G.deadT > 0) return;
    if (inJump() && !G.jumpHeld && c.y >= GY - 1) {
      c.vy = -260;
      c.squash = 0.86;
      audio.hop();
    }
    G.jumpHeld = inJump();
    c.vx = lerp(c.vx, 268, Math.min(1, 4 * dt));
    c.x += c.vx * dt;
    if (p) {
      p.x = c.x + 6;
      p.y = c.y - 6;
      p.face = 1;
    }
    if (!REDUCE) {
      emit(1, {
        x: c.x - 18, y: c.y - 4, j: 4,
        vx0: -80, vx1: -20, vy0: -40, vy1: -4,
        r0: 1.2, r1: 2.6, life: 0.28, rgb: DUST, g: 60
      });
    }
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead || e.ramHit > 0) continue;
      if (e.x > c.x - 8 && e.x < c.x + 46 && Math.abs(e.y - c.y) < 28) {
        e.ramHit = 0.4;
        applyHit(e, {
          dmg: 3, knock: 220, face: 1, stop: 0.055, down: true, pts: SCORE.ram
        });
        c.squash = 1.08;
        kick(3.4, 'boom');
      }
    }
    for (i = 0; i < G.crates.length; i++) {
      cr = G.crates[i];
      if (cr.dead) continue;
      if (Math.abs(cr.x - (c.x + 22)) < 22) smashCrate(cr, 1);
    }
    if (c.x >= c.end - 8) exitCar(false);
    c.x = clamp(c.x, 24, G.levelW - 40);
  }

  function overlapPlayer(e) {
    var p = G.player;
    if (!p || G.deadT > 0) return false;
    var hw = G.inCar ? 28 : (e.w * 0.5 + 10);
    if (Math.abs(e.x - p.x) > hw) return false;
    var pTop = p.y - (G.inCar ? 26 : 28);
    var eTop = e.y - e.h;
    return p.y > eTop + 6 && e.y > pTop + 6;
  }

  function updateEnt(e, dt) {
    var p = G.player;
    var dx, dist, want, cap, fly;
    if (e.ramHit > 0) e.ramHit -= dt;
    if (e.dead) {
      e.deadT -= dt;
      e.vy += GRAV * dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.vx *= 0.98;
      if (e.kind !== 'ptero' && e.y > GY) { e.y = GY; e.vy = 0; e.vx *= 0.5; }
      e.act = 'down';
      return;
    }
    if (e.flash > 0) e.flash -= dt;
    if (e.hurtT > 0) e.hurtT -= dt;
    fly = e.kind === 'ptero';
    if (e.stunT > 0) {
      e.stunT -= dt;
      e.vx *= Math.max(0, 1 - 5 * dt);
      e.x += e.vx * dt;
      e.vy += GRAV * dt;
      e.y += e.vy * dt;
      if (!fly && e.y >= GY) { e.y = GY; e.vy = 0; e.grounded = true; }
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
      if ((e.kind === 'trike' || e.kind === 'rex') && e.act === 'charge') {
        e.x += e.face * (e.kind === 'rex' ? 240 : 270) * dt;
        e.x = clamp(e.x, 24, G.levelW - 24);
        if (!e.atkHit && overlapPlayer(e) && Math.abs(p.y - e.y) < 40) {
          e.atkHit = true;
          hurtPlayer(e.dmg, e.x, 200);
        }
        emit(1, {
          x: e.x - e.face * 10, y: GY - 2, j: 4,
          vx0: -e.face * 40, vx1: -e.face * 10, vy0: -40, vy1: -8,
          r0: 1.5, r1: 3.2, life: 0.28, rgb: DUST, g: 80
        });
        if (e.atkT <= 0) { e.act = 'tired'; e.cd = 0.7; }
        return;
      }
      if ((e.kind === 'trike' || e.kind === 'rex') && e.act === 'snort') {
        e.squash = 1 + Math.sin(G.clock * 24) * 0.04;
        if (e.atkT <= 0) {
          e.act = 'charge';
          e.atkT = e.kind === 'rex' ? 0.82 : 0.72;
          e.atkHit = false;
          audio.roar();
        }
        return;
      }
      if ((e.kind === 'raptor' || e.kind === 'alpha') && e.act === 'lunge') {
        e.x += e.face * (e.kind === 'alpha' ? 320 : 290) * dt;
        if (!e.atkHit && overlapPlayer(e) && Math.abs(p.y - e.y) < 28) {
          e.atkHit = true;
          hurtPlayer(e.dmg, e.x, 170);
        }
        if (e.atkT <= 0) { e.act = 'idle'; e.cd = e.kind === 'alpha' ? 0.45 : 0.62; }
        return;
      }
      if (e.kind === 'ptero' && e.act === 'dive') {
        e.x += e.face * 90 * dt;
        e.y += 220 * dt;
        if (!e.atkHit && overlapPlayer(e)) {
          e.atkHit = true;
          hurtPlayer(e.dmg, e.x, 140);
        }
        if (e.y > GY - 18 || e.atkT <= 0) {
          e.act = 'idle';
          e.cd = 0.9;
          e.flyY = GY - 96;
        }
        return;
      }
      if (e.kind === 'gunner' && !e.atkHit && e.atkT < 0.08) {
        e.atkHit = true;
        G.bullets.push({
          x: e.x + e.face * 16,
          y: e.y - 18,
          vx: e.face * 260,
          life: 1.35,
          dmg: 2
        });
        audio.gun(false);
        popSpark(e.x + e.face * 16, e.y - 18, GOLD, 10);
      }
      if (e.kind === 'rex' && e.act === 'stomp' && !e.atkHit && e.atkT < 0.16) {
        e.atkHit = true;
        e.squash = 1.18;
        kick(5, 'boom');
        audio.roar();
        emit(14, {
          x: e.x, y: GY - 4, j: 16,
          vx0: -180, vx1: 180, vy0: -120, vy1: -10,
          r0: 2, r1: 5, life: 0.4, rgb: DUST, g: 90
        });
        if (p.grounded && Math.abs(p.x - e.x) < 78) hurtPlayer(e.dmg, e.x, 220);
      }
      if ((e.kind === 'thug' || e.kind === 'rex') && e.act === 'atk' && !e.atkHit && e.atkT < 0.16 && e.atkT > 0.04) {
        if (overlapPlayer(e) && Math.abs(p.y - e.y) < 28) {
          e.atkHit = true;
          hurtPlayer(e.dmg, e.x, 150);
        }
      }
      if (e.atkT <= 0) e.act = 'idle';
      if (!fly) {
        e.vy += GRAV * dt;
        e.y += e.vy * dt;
        if (e.y >= GY) { e.y = GY; e.vy = 0; e.grounded = true; }
      }
      return;
    }

    if (fly) {
      e.flyY = e.flyY || (GY - 96);
      e.y = lerp(e.y, e.flyY, Math.min(1, 3 * dt));
    } else {
      e.vy += GRAV * dt;
      e.y += e.vy * dt;
      if (e.y >= GY) { e.y = GY; e.vy = 0; e.grounded = true; }
      else e.grounded = false;
    }

    if (G.mode === 'title') {
      want = dist > 40 ? (dx > 0 ? 1 : -1) * e.spd * 0.45 : 0;
      e.x += want * dt;
      e.act = want ? 'walk' : 'idle';
      return;
    }

    if (e.kind === 'gunner') {
      if (dist < 150) e.x -= e.face * e.spd * 0.7 * dt;
      else if (dist > 280) e.x += e.face * e.spd * dt;
      else if (e.cd <= 0 && Math.abs(p.y - e.y) < 80) {
        e.act = 'atk';
        e.atkT = 0.34;
        e.atkHit = false;
        e.cd = rand(1.1, 1.7);
      }
      e.act = e.atkT > 0 ? 'atk' : (dist > 40 ? 'walk' : 'idle');
    } else if (e.kind === 'ptero') {
      if (e.cd <= 0 && dist < 220 && dist > 40) {
        e.act = 'dive';
        e.atkT = 0.55;
        e.atkHit = false;
        e.cd = 1.4;
      } else {
        e.x += e.face * e.spd * 0.85 * dt;
        e.act = 'walk';
      }
    } else if (e.kind === 'raptor' || e.kind === 'alpha') {
      if (dist > e.reach + 8) {
        e.x += e.face * e.spd * dt;
        e.act = 'walk';
      } else if (e.cd <= 0) {
        e.act = 'lunge';
        e.atkT = e.kind === 'alpha' ? 0.42 : 0.34;
        e.atkHit = false;
        e.cd = rand(0.5, 0.9);
      } else e.act = 'idle';
    } else if (e.kind === 'trike') {
      if (e.act === 'tired') {
        if (e.cd <= 0) e.act = 'idle';
      } else if (dist < 260 && e.cd <= 0 && e.grounded) {
        e.act = 'snort';
        e.atkT = 0.48;
        e.cd = 1.6;
        audio.boss();
      } else {
        e.x += e.face * e.spd * dt;
        e.act = 'walk';
      }
    } else if (e.kind === 'rex') {
      if (e.act === 'tired') {
        if (e.cd <= 0) e.act = 'idle';
      } else if (e.cd <= 0 && dist < 90 && p.grounded) {
        if (hash2((G.t * 40 + e.x) | 0) > 0.45) {
          e.act = 'stomp';
          e.atkT = 0.5;
          e.atkHit = false;
          e.cd = 1.5;
        } else {
          e.act = 'atk';
          e.atkT = 0.36;
          e.atkHit = false;
          e.cd = 0.8;
        }
      } else if (dist < 300 && e.cd <= 0 && dist > 100) {
        e.act = 'snort';
        e.atkT = 0.4;
        e.cd = 1.8;
        audio.boss();
      } else {
        e.x += e.face * e.spd * dt;
        e.act = 'walk';
      }
    } else {
      if (dist > e.reach - 2) {
        e.x += e.face * e.spd * dt;
        e.act = 'walk';
      } else if (e.cd <= 0) {
        e.act = 'atk';
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
      b.life -= dt;
      if (b.life <= 0 || b.x < G.camX - 40 || b.x > G.camX + VW + 40) {
        G.bullets.splice(i, 1);
        continue;
      }
      if (!p || G.invuln > 0 || G.deadT > 0 || G.mode === 'title') continue;
      if (Math.abs(b.x - p.x) < (G.inCar ? 22 : 10) && Math.abs(b.y - (p.y - 16)) < 14) {
        G.bullets.splice(i, 1);
        hurtPlayer(b.dmg || 2, b.x - b.vx, 120);
      }
    }
  }
  function updateShots(dt) {
    var i, j, s, e, c;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      s.x += s.vx * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x < G.camX - 40 || s.x > G.camX + VW + 40) {
        G.shots.splice(i, 1);
        continue;
      }
      for (j = 0; j < G.ents.length; j++) {
        e = G.ents[j];
        if (e.dead) continue;
        if (Math.abs(e.x - s.x) < e.w * 0.55 + 6 && Math.abs((e.y - e.h * 0.5) - s.y) < e.h * 0.55 + 6) {
          applyHit(e, {
            dmg: s.dmg, knock: 70, face: s.vx > 0 ? 1 : -1,
            stop: 0.038, down: false, pts: SCORE.gun
          });
          G.shots.splice(i, 1);
          s = null;
          break;
        }
      }
      if (!s) continue;
      for (j = 0; j < G.crates.length; j++) {
        c = G.crates[j];
        if (c.dead) continue;
        if (Math.abs(c.x - s.x) < 12 && Math.abs((GY - 12) - s.y) < 16) {
          smashCrate(c, s.vx > 0 ? 1 : -1);
          G.shots.splice(i, 1);
          break;
        }
      }
    }
  }
  function updatePickups(dt) {
    var i, z, p = G.player, c, gs;
    if (!p) return;
    for (i = 0; i < G.guns.length; i++) {
      z = G.guns[i];
      if (z.taken) continue;
      z.bob += dt * 4;
      if (G.deadT > 0 || G.inCar) continue;
      if (Math.abs(z.x - p.x) < 16 && Math.abs(z.y - (p.y - 10)) < 22) {
        z.taken = true;
        gs = GUNS[z.type] || GUNS.pistol;
        G.gun = gs.id;
        G.ammo = gs.ammo;
        addScore(SCORE.gunGet);
        audio.pickup();
        toast(gs.name, false, true);
        popRing(z.x, z.y, CYN, 16);
        emit(10, {
          x: z.x, y: z.y, j: 6,
          vx0: -80, vx1: 80, vy0: -180, vy1: -20,
          r0: 1.4, r1: 3, life: 0.4, rgb: CYN
        });
        syncHud();
      }
    }
    for (i = 0; i < G.meds.length; i++) {
      z = G.meds[i];
      if (z.taken) continue;
      z.bob += dt * 4;
      if (G.mode === 'title' || G.deadT > 0) continue;
      if (Math.abs(z.x - p.x) < 16 && Math.abs(z.y - (p.y - 10)) < 22) {
        z.taken = true;
        G.hp = Math.min(HP_MAX, G.hp + 5);
        addScore(SCORE.med);
        audio.med();
        toast('急救', false, true);
        popRing(z.x, z.y, GOLD, 18);
        emit(10, {
          x: z.x, y: z.y, j: 6,
          vx0: -80, vx1: 80, vy0: -180, vy1: -20,
          r0: 1.4, r1: 3, life: 0.4, rgb: GOLD
        });
        syncHud();
      }
    }
    for (i = 0; i < G.crates.length; i++) {
      c = G.crates[i];
      if (c.dead && c.deadT > 0) c.deadT -= dt;
    }
  }
  function updateWaves(dt) {
    var i, s;
    if (!isTide() || !playing()) return;
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
    if (isTide()) {
      G.meds.push(makeMed(clamp((G.player ? G.player.x : 400) + 80, 60, G.levelW - 60)));
      if (G.wave % 2 === 0) G.guns.push(makeGun(clamp((G.player ? G.player.x : 400) - 40, 60, G.levelW - 60), G.wave % 4 === 0 ? 'smg' : 'pistol'));
      spawnWave(G.wave + 1);
      G.hp = Math.min(HP_MAX, G.hp + 2);
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
    loadStage(G.stage + 1, false);
    G.invuln = 0.6;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    setHint(G.stage === 2 ? '密林 · 上车兜风，翼龙要跳' : '火山 · 暴龙踩地，跳起再打', G.stage === 3 ? 'hot' : '');
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
        kick(3, 'boom');
        if (G.inCar) exitCar(false);
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
    G.clearT = isTide() ? 0.85 : 1.05;
  }

  function updateCam(dt) {
    var p = G.player;
    var target, maxX;
    if (!p) return;
    target = (G.inCar && G.car ? G.car.x : p.x) - 200;
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
    if (G.mode === 'title') demoThink();
    updatePlayer(dt);
    if ((playing() || G.mode === 'title') && keys.atk && G.ammo > 0 && G.gunCd <= 0 && G.deadT <= 0) shoot();
    updateAtk(dt);
    updateCar(dt);
    for (i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    updateBullets(dt);
    updateShots(dt);
    updatePickups(dt);
    updateWaves(dt);
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
    if (G.theme === 'jungle') {
      g.addColorStop(0, '#24180c');
      g.addColorStop(0.55, '#1a140c');
      g.addColorStop(1, '#3a2410');
    } else if (G.theme === 'volcano') {
      g.addColorStop(0, '#1a0808');
      g.addColorStop(0.5, '#2a0c08');
      g.addColorStop(1, '#4a1808');
    } else {
      g.addColorStop(0, '#2a1408');
      g.addColorStop(0.45, '#3a1c0c');
      g.addColorStop(1, '#6a3414');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    ctx.fillStyle = rgba(HOT, G.theme === 'volcano' ? 0.22 : 0.14);
    ctx.beginPath();
    ctx.arc(sx(G.camX + 520), sy(70), 48 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.18);
    ctx.beginPath();
    ctx.arc(sx(G.camX + 520), sy(70), 22 * scale, 0, TAU);
    ctx.fill();
  }

  function drawMesa(x, y, w, h, rgb) {
    ctx.fillStyle = rgba(rgb, 0.9);
    ctx.beginPath();
    ctx.moveTo(sx(x), sy(y + h));
    ctx.lineTo(sx(x + 8), sy(y));
    ctx.lineTo(sx(x + w - 8), sy(y));
    ctx.lineTo(sx(x + w), sy(y + h));
    ctx.fill();
  }
  function drawCactus(x, h) {
    var sc = scale;
    var px = sx(x);
    var py = sy(GY);
    ctx.fillStyle = '#3a5a28';
    ctx.fillRect(px - 3 * sc, py - h * sc, 6 * sc, h * sc);
    ctx.fillRect(px - 10 * sc, py - h * 0.62 * sc, 8 * sc, 3.2 * sc);
    ctx.fillRect(px - 10 * sc, py - h * 0.62 * sc, 3.2 * sc, 12 * sc);
    ctx.fillRect(px + 3 * sc, py - h * 0.48 * sc, 8 * sc, 3.2 * sc);
    ctx.fillRect(px + 8 * sc, py - h * 0.48 * sc, 3.2 * sc, 10 * sc);
  }
  function drawPalm(x) {
    var sc = scale;
    var px = sx(x);
    var py = sy(GY);
    ctx.fillStyle = '#5a3a18';
    ctx.fillRect(px - 3 * sc, py - 70 * sc, 6 * sc, 70 * sc);
    ctx.strokeStyle = '#4a7a28';
    ctx.lineWidth = 2.4 * sc;
    ctx.beginPath();
    ctx.moveTo(px, py - 68 * sc);
    ctx.quadraticCurveTo(px - 22 * sc, py - 78 * sc, px - 28 * sc, py - 58 * sc);
    ctx.moveTo(px, py - 68 * sc);
    ctx.quadraticCurveTo(px + 22 * sc, py - 80 * sc, px + 30 * sc, py - 56 * sc);
    ctx.moveTo(px, py - 70 * sc);
    ctx.quadraticCurveTo(px - 6 * sc, py - 92 * sc, px - 18 * sc, py - 86 * sc);
    ctx.moveTo(px, py - 70 * sc);
    ctx.quadraticCurveTo(px + 8 * sc, py - 94 * sc, px + 20 * sc, py - 84 * sc);
    ctx.stroke();
  }
  function drawRuin(x, w, h) {
    var px = sx(x);
    var py = sy(GY);
    var sc = scale;
    ctx.fillStyle = '#3a2218';
    ctx.fillRect(px, py - h * sc, w * sc, h * sc);
    ctx.fillStyle = '#2a160e';
    ctx.fillRect(px + 4 * sc, py - h * sc + 8 * sc, 6 * sc, 8 * sc);
    ctx.fillRect(px + w * sc - 12 * sc, py - h * 0.55 * sc, 6 * sc, 8 * sc);
    ctx.fillStyle = rgba(HOT, 0.18);
    ctx.fillRect(px + 4 * sc, py - h * sc + 10 * sc, 4 * sc, 4 * sc);
  }

  function drawDecor() {
    var x0 = G.camX - 40;
    var x1 = G.camX + VW + 80;
    var x, h, n;
    for (n = 0; n < 9; n++) {
      x = ((n * 380 + ((hash2(n + 3) * 80) | 0)) % 3200);
      if (x < x0 - 80 || x > x1 + 80) continue;
      drawMesa(x - G.camX * 0.55, 118 + hash2(n) * 30, 90 + hash2(n + 1) * 70, 90, G.theme === 'volcano' ? [70, 28, 22] : [90, 48, 28]);
    }
    if (G.theme === 'jungle') {
      for (n = 0; n < 18; n++) {
        x = 80 + n * 150 + hash2(n + 20) * 40;
        if (x < x0 || x > x1) continue;
        drawPalm(x);
      }
    } else if (G.theme === 'volcano') {
      ctx.fillStyle = rgba(LAVA, 0.12 + 0.06 * Math.sin(G.clock * 3));
      ctx.fillRect(ox, sy(GY - 8), VW * scale, 8 * scale);
      for (n = 0; n < 12; n++) {
        x = 60 + n * 190 + hash2(n + 7) * 40;
        if (x < x0 || x > x1) continue;
        ctx.fillStyle = '#2a1210';
        ctx.beginPath();
        ctx.moveTo(sx(x), sy(GY));
        ctx.lineTo(sx(x + 18), sy(GY - 22 - hash2(n) * 16));
        ctx.lineTo(sx(x + 34), sy(GY));
        ctx.fill();
      }
    } else {
      for (n = 0; n < 10; n++) {
        x = 90 + n * 230 + hash2(n) * 50;
        if (x < x0 || x > x1) continue;
        h = 28 + hash2(n + 2) * 22;
        drawCactus(x, h);
      }
      for (n = 0; n < 8; n++) {
        x = 160 + n * 280 + hash2(n + 11) * 40;
        if (x < x0 || x > x1) continue;
        drawRuin(x, 28 + hash2(n) * 18, 36 + hash2(n + 1) * 28);
      }
    }
  }

  function drawGround() {
    var g = ctx.createLinearGradient(ox, sy(GY - 8), ox, sy(VH));
    if (G.theme === 'volcano') {
      g.addColorStop(0, '#4a2214');
      g.addColorStop(1, '#1a0806');
    } else if (G.theme === 'jungle') {
      g.addColorStop(0, '#2a3a18');
      g.addColorStop(1, '#12180c');
    } else {
      g.addColorStop(0, '#6a3a18');
      g.addColorStop(1, '#2a140c');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, sy(GY), VW * scale, (VH - GY + G.camY) * scale);
    ctx.fillStyle = G.theme === 'jungle' ? '#3a4a20' : (G.theme === 'volcano' ? '#5a2814' : '#c48a4a');
    ctx.fillRect(ox, sy(GY - 3), VW * scale, 4 * scale);
    var i, x;
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    for (i = 0; i < 24; i++) {
      x = ((i * 48 - ((G.camX * 0.6) | 0)) % (VW + 48));
      ctx.beginPath();
      ctx.moveTo(ox + x * scale, sy(GY + 8));
      ctx.lineTo(ox + (x + 22) * scale, sy(GY + 8));
      ctx.stroke();
    }
    if (G.theme === 'volcano') {
      ctx.fillStyle = rgba(LAVA, 0.55 + 0.2 * Math.sin(G.clock * 5));
      for (i = 0; i < 8; i++) {
        x = (i * 90 + 20 - (G.camX * 0.4) % 90);
        ctx.fillRect(ox + x * scale, sy(GY + 14), 18 * scale, 3 * scale);
      }
    }
  }

  function drawCrate(c) {
    if (c.dead && c.deadT <= 0) return;
    var sc = scale;
    var x = sx(c.x);
    var y = sy(GY);
    var a = c.dead ? clamp(c.deadT / 0.4, 0, 1) : 1;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = '#8a5a28';
    fillRound(x - 10 * sc, y - 18 * sc, 20 * sc, 18 * sc, 2 * sc);
    ctx.strokeStyle = '#c48a4a';
    ctx.lineWidth = 1.4 * sc;
    ctx.strokeRect(x - 9 * sc, y - 17 * sc, 18 * sc, 16 * sc);
    ctx.beginPath();
    ctx.moveTo(x - 9 * sc, y - 9 * sc);
    ctx.lineTo(x + 9 * sc, y - 9 * sc);
    ctx.moveTo(x, y - 17 * sc);
    ctx.lineTo(x, y - 1 * sc);
    ctx.stroke();
    ctx.restore();
  }
  function drawGunItem(z) {
    if (z.taken) return;
    var sc = scale;
    var x = sx(z.x);
    var y = sy(z.y + Math.sin(z.bob) * 3);
    ctx.fillStyle = rgba(CYN, 0.18);
    ctx.beginPath();
    ctx.arc(x, y, 10 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3a2a1c';
    ctx.fillRect(x - 8 * sc, y - 2 * sc, 16 * sc, 3.2 * sc);
    ctx.fillRect(x + 6 * sc, y - 5 * sc, 3 * sc, 6 * sc);
    ctx.fillStyle = z.type === 'smg' ? rgba(CYN, 0.9) : rgba(GOLD, 0.9);
    ctx.fillRect(x - 6 * sc, y - 1.4 * sc, 10 * sc, 1.6 * sc);
  }
  function drawMedItem(z) {
    if (z.taken) return;
    var sc = scale;
    var x = sx(z.x);
    var y = sy(z.y + Math.sin(z.bob) * 3);
    ctx.fillStyle = rgba(GOLD, 0.16);
    ctx.beginPath();
    ctx.arc(x, y, 9 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#f4e8e0';
    fillRound(x - 7 * sc, y - 6 * sc, 14 * sc, 12 * sc, 2 * sc);
    ctx.fillStyle = '#d03030';
    ctx.fillRect(x - 1.4 * sc, y - 4 * sc, 2.8 * sc, 8 * sc);
    ctx.fillRect(x - 4 * sc, y - 1.4 * sc, 8 * sc, 2.8 * sc);
  }

  function drawCar(c) {
    if (!c) return;
    var sc = scale;
    var x = sx(c.x);
    var y = sy(c.y);
    var hop = (c.y < GY ? (GY - c.y) * 0.02 : 0);
    var shake = c.rumble > 0 ? Math.sin(G.t * 50) * 1.4 * sc : 0;
    ctx.save();
    ctx.translate(x + shake, y);
    ctx.scale(1, c.squash || 1);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(8 * sc, 1 * sc, 26 * sc, 4 * sc, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CREAM, 0.98);
    fillRound(-22 * sc, -22 * sc - hop, 52 * sc, 16 * sc, 5 * sc);
    ctx.fillStyle = rgba(PINK, 0.95);
    ctx.beginPath();
    ctx.moveTo(18 * sc, -22 * sc - hop);
    ctx.lineTo(34 * sc, -30 * sc - hop);
    ctx.lineTo(34 * sc, -16 * sc - hop);
    ctx.lineTo(22 * sc, -16 * sc - hop);
    ctx.fill();
    ctx.fillStyle = 'rgba(40, 80, 110, 0.55)';
    fillRound(-8 * sc, -28 * sc - hop, 22 * sc, 8 * sc, 2 * sc);
    ctx.fillStyle = rgba(CHROME, 0.95);
    ctx.fillRect(-24 * sc, -10 * sc, 56 * sc, 3 * sc);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.beginPath();
    ctx.arc(-20 * sc, -14 * sc, 2.4 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1210';
    ctx.beginPath();
    ctx.arc(-12 * sc, -2 * sc, 6 * sc, 0, TAU);
    ctx.arc(16 * sc, -2 * sc, 6 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e8e0d4';
    ctx.beginPath();
    ctx.arc(-12 * sc, -2 * sc, 3.2 * sc, 0, TAU);
    ctx.arc(16 * sc, -2 * sc, 3.2 * sc, 0, TAU);
    ctx.fill();
    if (G.inCar) {
      ctx.fillStyle = rgba(HOT, 0.18 + 0.08 * Math.sin(G.clock * 12));
      ctx.fillRect(28 * sc, -16 * sc, 6 * sc, 3 * sc);
    }
    if (c.hp < c.max && G.inCar) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(-16 * sc, -38 * sc, 32 * sc, 3.2 * sc);
      ctx.fillStyle = rgba(c.hp / c.max < 0.34 ? MAG : HOT, 0.9);
      ctx.fillRect(-16 * sc, -38 * sc, 32 * sc * (c.hp / c.max), 3.2 * sc);
    }
    ctx.restore();
  }

  function drawJack(p, blink) {
    if (blink && ((G.t * 18) | 0) % 2 === 0) return;
    var sc = scale * (p.scale || 1);
    var face = p.face || 1;
    var act = p.act || 'idle';
    var bob = (act === 'walk') ? Math.sin(p.run || 0) * 1.8 * sc : Math.sin(G.clock * 3) * 0.5 * sc;
    var sq = p.squash || 1;
    var x = sx(p.x);
    var y = sy(p.y);
    var atk = act === 'atk' || act === 'spin';
    var sit = act === 'sit' || G.inCar;
    var leg = act === 'walk' ? Math.sin(p.run || 0) * 4.2 * sc : (act === 'jump' || act === 'spin' ? -5 * sc : 0);
    var gs = gunSpec();
    ctx.save();
    ctx.translate(x, y);
    if (act === 'spin') ctx.rotate(G.clock * 16 * face);
    if (act === 'down') { ctx.rotate(-0.55 * face); ctx.translate(0, 6 * sc); }
    if (sit) { ctx.translate(0, 6 * sc); ctx.scale(face, sq * 0.92); }
    else ctx.scale(face, sq);

    ctx.strokeStyle = rgba(JEAN, 0.95);
    ctx.lineWidth = 3.2 * sc;
    ctx.lineCap = 'round';
    if (!sit) {
      ctx.beginPath();
      ctx.moveTo(-3.4 * sc, -8 * sc);
      ctx.lineTo(-5 * sc - leg, 0);
      ctx.moveTo(3.4 * sc, -8 * sc);
      ctx.lineTo(5 * sc + leg, 0);
      ctx.stroke();
      ctx.fillStyle = '#2a1a12';
      ctx.beginPath();
      ctx.ellipse(-5 * sc - leg, 1 * sc, 3.4 * sc, 1.6 * sc, 0, 0, TAU);
      ctx.ellipse(5 * sc + leg, 1 * sc, 3.4 * sc, 1.6 * sc, 0, 0, TAU);
      ctx.fill();
    }

    ctx.fillStyle = rgba(JEAN, 1);
    fillRound(-6 * sc, -14 * sc + bob, 12 * sc, 8 * sc, 2 * sc);
    ctx.fillStyle = rgba(LEATHER, 1);
    fillRound(-7 * sc, -24 * sc + bob, 14 * sc, 12 * sc, 3 * sc);
    ctx.fillStyle = rgba(HOT, 0.35);
    ctx.fillRect(-5 * sc, -16 * sc + bob, 10 * sc, 1.6 * sc);

    ctx.strokeStyle = rgba(SKIN, 0.95);
    ctx.lineWidth = 2.6 * sc;
    ctx.beginPath();
    ctx.moveTo(-5 * sc, -20 * sc + bob);
    ctx.lineTo(-9 * sc, (atk ? -12 : -11) * sc + bob);
    ctx.moveTo(5 * sc, -21 * sc + bob);
    ctx.lineTo(8 * sc + (atk ? 7 * sc : 0), (atk ? -20 : -16) * sc + bob);
    ctx.stroke();
    ctx.fillStyle = rgba(SKIN, 1);
    ctx.beginPath();
    ctx.arc(-9 * sc, -11 * sc + bob, 2.2 * sc, 0, TAU);
    ctx.arc(8 * sc + (atk ? 7 * sc : 0), (atk ? -20 : -16) * sc + bob, 2.3 * sc, 0, TAU);
    ctx.fill();

    if (gs && !atk) {
      ctx.fillStyle = '#2a2218';
      ctx.fillRect(8 * sc, -18 * sc + bob, 12 * sc, 2.6 * sc);
      ctx.fillRect(17 * sc, -20 * sc + bob, 2.4 * sc, 5 * sc);
    } else if (atk) {
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.arc(14 * sc, -18 * sc + bob, 3.4 * sc, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.55);
      ctx.lineWidth = 1.4 * sc;
      ctx.beginPath();
      ctx.arc(14 * sc, -18 * sc + bob, 6.2 * sc, 0, TAU);
      ctx.stroke();
    }

    ctx.fillStyle = rgba(SKIN, 1);
    ctx.beginPath();
    ctx.arc(1 * sc, -30 * sc + bob, 5.4 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3a2214';
    ctx.beginPath();
    ctx.ellipse(1 * sc, -32 * sc + bob, 5.6 * sc, 3.2 * sc, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#f4fff8';
    ctx.beginPath();
    ctx.ellipse(3.2 * sc, -30 * sc + bob, 1.5 * sc, 1.7 * sc, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#102018';
    ctx.beginPath();
    ctx.arc(3.6 * sc, -29.8 * sc + bob, 0.85 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(20,16,12,0.7)';
    ctx.fillRect(2 * sc, -26 * sc + bob, 2.6 * sc, 1.1 * sc);

    if (G.hurtT > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-12 * sc, -40 * sc, 26 * sc, 42 * sc);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawThug(e) {
    var sc = scale * (e.scale || 1);
    var x = sx(e.x);
    var y = sy(e.y);
    var bob = e.act === 'walk' ? Math.sin(e.run || 0) * 1.6 * sc : 0;
    var atk = e.act === 'atk';
    var leg = e.act === 'walk' ? Math.sin(e.run || 0) * 4 * sc : 0;
    var pal = e.kind === 'gunner' ? [72, 48, 40] : [48, 36, 40];
    ctx.save();
    ctx.translate(x, y);
    if (e.act === 'down') { ctx.rotate(-0.5 * (e.face || 1)); ctx.translate(0, 6 * sc); }
    ctx.scale(e.face || 1, e.squash || 1);

    ctx.strokeStyle = '#1a1010';
    ctx.lineWidth = 3 * sc;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3 * sc, -8 * sc);
    ctx.lineTo(-4 * sc - leg, 0);
    ctx.moveTo(3 * sc, -8 * sc);
    ctx.lineTo(4 * sc + leg, 0);
    ctx.stroke();

    ctx.fillStyle = rgba(pal, 0.98);
    fillRound(-7 * sc, -24 * sc + bob, 14 * sc, 16 * sc, 2 * sc);
    ctx.fillStyle = rgba(HOT, 0.45);
    ctx.fillRect(-6 * sc, -18 * sc + bob, 12 * sc, 2 * sc);

    ctx.strokeStyle = rgba(SKIN, 0.95);
    ctx.lineWidth = 2.3 * sc;
    ctx.beginPath();
    ctx.moveTo(-5 * sc, -20 * sc + bob);
    ctx.lineTo(-9 * sc, -12 * sc + bob);
    ctx.moveTo(5 * sc, -20 * sc + bob);
    ctx.lineTo(6 * sc + (atk ? 14 * sc : 0), (atk ? -22 : -16) * sc + bob);
    ctx.stroke();
    if (e.kind === 'gunner') {
      ctx.fillStyle = '#3a2a1c';
      ctx.fillRect(6 * sc + (atk ? 10 * sc : 2 * sc), -20 * sc + bob, 12 * sc, 3 * sc);
      ctx.fillRect(16 * sc + (atk ? 10 * sc : 2 * sc), -22 * sc + bob, 3 * sc, 6 * sc);
    }

    ctx.fillStyle = rgba(SKIN, 1);
    ctx.beginPath();
    ctx.arc(0, -29 * sc + bob, 5.2 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = e.kind === 'gunner' ? '#1a1010' : '#8a2010';
    ctx.beginPath();
    ctx.ellipse(0, -32 * sc + bob, 5.6 * sc, 2.4 * sc, 0, 0, TAU);
    ctx.fill();
    if (e.kind === 'thug') {
      ctx.fillRect(-1.2 * sc, -38 * sc + bob, 2.4 * sc, 6 * sc);
    }
    ctx.fillStyle = '#1a1010';
    ctx.fillRect(1.5 * sc, -30 * sc + bob, 1.4 * sc, 1.4 * sc);
    if (e.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.32);
      ctx.fillRect(-10 * sc, -40 * sc, 22 * sc, 42 * sc);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawRaptor(e) {
    var sc = scale * (e.scale || 1);
    var x = sx(e.x);
    var y = sy(e.y);
    var bob = e.act === 'walk' || e.act === 'lunge' ? Math.sin(e.run || 0) * 1.4 * sc : 0;
    var lunge = e.act === 'lunge';
    var pal = e.kind === 'alpha' ? [150, 70, 28] : OLIVE;
    var pal2 = e.kind === 'alpha' ? [90, 40, 18] : OLIVE2;
    ctx.save();
    ctx.translate(x, y);
    if (e.act === 'down') ctx.rotate(-0.5 * (e.face || 1));
    ctx.scale(e.face || 1, e.squash || 1);
    if (lunge) ctx.rotate(-0.22);

    ctx.strokeStyle = rgba(pal2, 0.95);
    ctx.lineWidth = 2.4 * sc;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(8 * sc, -10 * sc + bob);
    ctx.quadraticCurveTo(22 * sc, -18 * sc + bob, 28 * sc, -8 * sc + bob);
    ctx.stroke();

    ctx.fillStyle = rgba(pal, 1);
    ctx.beginPath();
    ctx.ellipse(-2 * sc, -12 * sc + bob, 12 * sc, 7 * sc, -0.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(BELLY, 0.85);
    ctx.beginPath();
    ctx.ellipse(-1 * sc, -9 * sc + bob, 8 * sc, 4 * sc, -0.2, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = rgba(pal, 0.95);
    ctx.lineWidth = 2.6 * sc;
    ctx.beginPath();
    ctx.moveTo(-6 * sc, -8 * sc);
    ctx.lineTo(-8 * sc, 0);
    ctx.moveTo(4 * sc, -8 * sc);
    ctx.lineTo(2 * sc, 0);
    ctx.stroke();
    ctx.fillStyle = rgba(CHROME, 0.9);
    ctx.beginPath();
    ctx.moveTo(6 * sc, -8 * sc + bob);
    ctx.lineTo(14 * sc, -16 * sc + bob);
    ctx.lineTo(8 * sc, -8 * sc + bob);
    ctx.fill();

    ctx.fillStyle = rgba(pal, 1);
    ctx.beginPath();
    ctx.ellipse(10 * sc, -16 * sc + bob, 7 * sc, 5 * sc, -0.15, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1810';
    ctx.beginPath();
    ctx.arc(13 * sc, -17 * sc + bob, 1.2 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.7);
    ctx.beginPath();
    ctx.moveTo(16 * sc, -16 * sc + bob);
    ctx.lineTo(22 * sc, -14 * sc + bob);
    ctx.lineTo(16 * sc, -13 * sc + bob);
    ctx.fill();
    if (e.kind === 'alpha') {
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.beginPath();
      ctx.moveTo(6 * sc, -20 * sc + bob);
      ctx.lineTo(10 * sc, -26 * sc + bob);
      ctx.lineTo(12 * sc, -18 * sc + bob);
      ctx.fill();
    }
    if (e.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.3);
      ctx.fillRect(-16 * sc, -28 * sc, 40 * sc, 32 * sc);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawPtero(e) {
    var sc = scale * (e.scale || 1);
    var x = sx(e.x);
    var y = sy(e.y);
    var flap = Math.sin(G.clock * (e.act === 'dive' ? 18 : 8)) * 10 * sc;
    ctx.save();
    ctx.translate(x, y);
    if (e.act === 'down') ctx.rotate(0.4);
    if (e.act === 'dive') ctx.rotate(0.5 * (e.face || 1));
    ctx.scale(e.face || 1, e.squash || 1);
    ctx.fillStyle = '#8a5a28';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-22 * sc, -8 * sc + flap, -30 * sc, 4 * sc + flap);
    ctx.quadraticCurveTo(-10 * sc, 2 * sc, 0, 2 * sc);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(22 * sc, -8 * sc - flap, 30 * sc, 4 * sc - flap);
    ctx.quadraticCurveTo(10 * sc, 2 * sc, 0, 2 * sc);
    ctx.fill();
    ctx.fillStyle = '#6a3a18';
    ctx.beginPath();
    ctx.ellipse(0, 2 * sc, 8 * sc, 4.2 * sc, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#c48a4a';
    ctx.beginPath();
    ctx.moveTo(6 * sc, 0);
    ctx.lineTo(16 * sc, -2 * sc);
    ctx.lineTo(6 * sc, 3 * sc);
    ctx.fill();
    ctx.fillStyle = '#1a1010';
    ctx.beginPath();
    ctx.arc(4 * sc, -1 * sc, 1.1 * sc, 0, TAU);
    ctx.fill();
    if (e.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-32 * sc, -16 * sc, 64 * sc, 24 * sc);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawTrike(e) {
    var sc = scale * (e.scale || 1);
    var x = sx(e.x);
    var y = sy(e.y);
    var bob = e.act === 'walk' ? Math.sin(e.run || 0) * 1.2 * sc : 0;
    var charge = e.act === 'charge';
    ctx.save();
    ctx.translate(x, y);
    if (e.act === 'down') ctx.rotate(-0.4 * (e.face || 1));
    ctx.scale(e.face || 1, e.squash || 1);
    if (charge) ctx.rotate(-0.16);
    ctx.fillStyle = '#6a7260';
    ctx.beginPath();
    ctx.ellipse(0, -4 * sc, 14 * sc, 5 * sc, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#7a8468';
    fillRound(-16 * sc, -28 * sc + bob, 32 * sc, 24 * sc, 8 * sc);
    ctx.fillStyle = '#9aa080';
    ctx.beginPath();
    ctx.ellipse(2 * sc, -34 * sc + bob, 10 * sc, 8 * sc, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#d8d4c4';
    ctx.beginPath();
    ctx.moveTo(8 * sc, -36 * sc + bob);
    ctx.lineTo(24 * sc, -40 * sc + bob);
    ctx.lineTo(8 * sc, -30 * sc + bob);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6 * sc, -42 * sc + bob);
    ctx.lineTo(10 * sc, -54 * sc + bob);
    ctx.lineTo(12 * sc, -40 * sc + bob);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-2 * sc, -42 * sc + bob);
    ctx.lineTo(0, -52 * sc + bob);
    ctx.lineTo(4 * sc, -40 * sc + bob);
    ctx.fill();
    ctx.fillStyle = '#1a1810';
    ctx.beginPath();
    ctx.arc(8 * sc, -34 * sc + bob, 1.5 * sc, 0, TAU);
    ctx.fill();
    if (e.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.3);
      ctx.fillRect(-18 * sc, -56 * sc, 42 * sc, 58 * sc);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawRex(e) {
    var sc = scale * (e.scale || 1);
    var x = sx(e.x);
    var y = sy(e.y);
    var bob = e.act === 'walk' ? Math.sin(e.run || 0) * 1.6 * sc : 0;
    var atk = e.act === 'atk' || e.act === 'stomp' || e.act === 'charge';
    ctx.save();
    ctx.translate(x, y);
    if (e.act === 'down') ctx.rotate(-0.4 * (e.face || 1));
    ctx.scale(e.face || 1, e.squash || 1);
    if (e.act === 'charge') ctx.rotate(-0.12);
    ctx.strokeStyle = '#8a3a18';
    ctx.lineWidth = 3 * sc;
    ctx.beginPath();
    ctx.moveTo(-10 * sc, -18 * sc);
    ctx.quadraticCurveTo(-28 * sc, -8 * sc + Math.sin(G.clock * 3) * 4 * sc, -34 * sc, 0);
    ctx.stroke();
    ctx.fillStyle = '#c45a28';
    fillRound(-12 * sc, -40 * sc + bob, 22 * sc, 32 * sc, 6 * sc);
    ctx.fillStyle = '#a44820';
    ctx.beginPath();
    ctx.ellipse(8 * sc, -48 * sc + bob, 12 * sc, 9 * sc, 0.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(BELLY, 0.7);
    ctx.beginPath();
    ctx.ellipse(10 * sc, -46 * sc + bob, 8 * sc, 5 * sc, 0.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1010';
    ctx.beginPath();
    ctx.arc(14 * sc, -50 * sc + bob, 1.6 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e8d8c0';
    ctx.beginPath();
    ctx.moveTo(18 * sc, -48 * sc + bob);
    ctx.lineTo(28 * sc + (atk ? 6 * sc : 0), -46 * sc + bob);
    ctx.lineTo(18 * sc, -42 * sc + bob);
    ctx.fill();
    ctx.strokeStyle = '#c45a28';
    ctx.lineWidth = 2.2 * sc;
    ctx.beginPath();
    ctx.moveTo(0, -32 * sc + bob);
    ctx.lineTo(6 * sc, -24 * sc + bob);
    ctx.moveTo(-2 * sc, -30 * sc + bob);
    ctx.lineTo(-8 * sc, -22 * sc + bob);
    ctx.stroke();
    ctx.strokeStyle = '#8a3a18';
    ctx.lineWidth = 3.4 * sc;
    ctx.beginPath();
    ctx.moveTo(-6 * sc, -10 * sc);
    ctx.lineTo(-8 * sc, 0);
    ctx.moveTo(4 * sc, -10 * sc);
    ctx.lineTo(6 * sc, 0);
    ctx.stroke();
    if (e.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-20 * sc, -62 * sc, 50 * sc, 64 * sc);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawEnt(e) {
    if (e.dead && e.deadT < 0) return;
    if (e.dead && e.deadT < 0.2 && ((G.t * 24) | 0) % 2 === 0) return;
    if (e.kind !== 'ptero') drawShadow(e.x, e.y, (e.scale || 1) * (e.kind === 'rex' ? 1.6 : 1.1));
    if (e.kind === 'raptor' || e.kind === 'alpha') drawRaptor(e);
    else if (e.kind === 'ptero') drawPtero(e);
    else if (e.kind === 'trike') drawTrike(e);
    else if (e.kind === 'rex') drawRex(e);
    else drawThug(e);
    if (e.max && e.hp < e.max && e.hp > 0 && !e.dead) {
      var bw = 22 * scale * (e.scale || 1);
      var by = e.kind === 'ptero' ? e.y - 16 : e.y - 46 * (e.scale || 1);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(sx(e.x) - bw / 2, sy(by), bw, 3.2 * scale);
      ctx.fillStyle = rgba(e.hp / e.max < 0.34 ? MAG : (isDino(e.kind) ? LEA : HOT), 0.9);
      ctx.fillRect(sx(e.x) - bw / 2, sy(by), bw * (e.hp / e.max), 3.2 * scale);
    }
  }

  function drawBullet(b, friend) {
    var x = sx(b.x);
    var y = sy(b.y);
    ctx.fillStyle = rgba(friend ? CYN : GOLD, 0.95);
    ctx.beginPath();
    ctx.ellipse(x, y, (friend ? 6 : 5) * scale, 2 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(friend ? WHT : HOT, 0.5);
    ctx.fillRect(x - (b.vx > 0 ? 10 : 0) * scale, y - 1 * scale, 10 * scale, 2 * scale);
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
      ctx.strokeStyle = rgba(HOT, 0.5 * a);
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
    ctx.fillStyle = '#140804';
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
    drawDecor();
    drawGround();
    for (i = 0; i < G.crates.length; i++) drawCrate(G.crates[i]);
    for (i = 0; i < G.guns.length; i++) drawGunItem(G.guns[i]);
    for (i = 0; i < G.meds.length; i++) drawMedItem(G.meds[i]);
    if (G.car) drawCar(G.car);
    drawTrails();
    G.ents.sort(function (a, b) { return a.y - b.y; });
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    for (i = 0; i < G.bullets.length; i++) drawBullet(G.bullets[i], false);
    for (i = 0; i < G.shots.length; i++) drawBullet(G.shots[i], true);
    p = G.player;
    if (p) {
      if (!G.inCar) drawShadow(p.x, p.y, 1);
      drawJack(p, G.invuln > 0 && G.mode !== 'title' && ((G.t * 16) | 0) % 2 === 0);
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
      if (k === '2' && G.mode === 'title') startGame('tide');
      if (k === '1' && G.mode === 'title') startGame('waste');
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
      keys.atk = true;
      if (playing()) doAtk();
    }, function () { keys.atk = false; });
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

  if (btnWaste) {
    btnWaste.addEventListener('click', function () {
      audio.ensure();
      startGame('waste');
    });
  }
  if (btnTide) {
    btnTide.addEventListener('click', function () {
      audio.ensure();
      startGame('tide');
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
      if (G.mode === 'win' && !isTide()) startGame('tide');
      else goTitle();
    });
  }
  if (modeWaste) {
    modeWaste.addEventListener('click', function () {
      audio.ensure();
      startGame('waste');
    });
  }
  if (modeTide) {
    modeTide.addEventListener('click', function () {
      audio.ensure();
      startGame('tide');
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
