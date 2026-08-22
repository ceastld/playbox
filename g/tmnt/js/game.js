'use strict';

/* 神龟 — TMNT arcade lite. Side-scroll brawler. No CDN. Distinct from 双截 / 街霸. */

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
  var COMBO_WIN = 1.45;
  var AIR = 0.9;
  var JUMP_V = 410;
  var GRAV = 1350;
  var MAX_FALL = 640;
  var COYOTE = 0.09;
  var BUFFER = 0.12;
  var INVULN = 0.95;
  var DIE_T = 0.82;
  var BEST_KEY = 'playbox-tmnt-best';
  var MUTE_KEY = 'playbox-tmnt-mute';
  var TURTLE_KEY = 'playbox-tmnt-turtle';
  var OPS = '方向 / WASD 走 · 上跳 · 空格劈砍 · R 重开 · M 静音';

  var MAG = [255, 61, 184];
  var CYN = [0, 240, 255];
  var GOLD = [255, 227, 107];
  var HOT = [61, 255, 122];
  var HOT2 = [125, 255, 154];
  var WHT = [232, 246, 238];
  var LEAF = [61, 255, 122];
  var PUR = [176, 76, 255];
  var BLU = [61, 122, 255];
  var ORG = [255, 138, 24];
  var RED = [255, 61, 74];
  var BRN = [196, 122, 52];
  var SKIN = [232, 176, 132];
  var SHELL = [46, 122, 58];
  var BELLY = [232, 210, 110];
  var GRN = [56, 176, 78];
  var GRN2 = [38, 138, 58];

  var TURTLES = {
    leo: {
      id: 'leo', name: '蓝棍', wep: '棍', mask: BLU,
      reach: 56, dmg: 2, t: 0.30, h0: 0.07, h1: 0.20,
      knock: 96, stop: 0.062, walk: 176, wepKind: 'staff'
    },
    mikey: {
      id: 'mikey', name: '橙拳', wep: '拳', mask: ORG,
      reach: 28, dmg: 1, t: 0.16, h0: 0.03, h1: 0.10,
      knock: 52, stop: 0.042, walk: 200, wepKind: 'fist'
    },
    raph: {
      id: 'raph', name: '红钗', wep: '钗', mask: RED,
      reach: 38, dmg: 2, t: 0.22, h0: 0.05, h1: 0.14,
      knock: 74, stop: 0.052, walk: 188, wepKind: 'sai'
    },
    don: {
      id: 'don', name: '紫叉', wep: '叉', mask: PUR,
      reach: 50, dmg: 2, t: 0.26, h0: 0.06, h1: 0.17,
      knock: 84, stop: 0.056, walk: 180, wepKind: 'fork'
    }
  };
  var TURTLE_IDS = ['leo', 'mikey', 'raph', 'don'];

  var KINDS = {
    foot: { hp: 3, name: '脚兵', spd: 88, dmg: 2, score: 160, reach: 26, w: 16, h: 28, scale: 1 },
    gun: { hp: 3, name: '枪兵', spd: 72, dmg: 2, score: 240, reach: 20, w: 16, h: 28, scale: 1 },
    rock: { hp: 22, name: '犀甲', spd: 62, dmg: 3, score: 3200, reach: 36, w: 28, h: 42, scale: 1.38 },
    shred: { hp: 28, name: '裂盔', spd: 80, dmg: 3, score: 5000, reach: 38, w: 22, h: 36, scale: 1.22 }
  };

  var SCORE = {
    hit: 40, kill: 1, pizza: 120, can: 80, stage: 1500, wave: 600, boss: 1
  };

  var STAGES = [
    {
      name: '夜街', w: 2280, theme: 'street', holeMax: 2,
      ents: [
        [360, 'foot'], [520, 'foot'], [700, 'gun'], [880, 'foot'],
        [1080, 'foot'], [1260, 'gun'], [1480, 'foot'], [1660, 'foot']
      ],
      holes: [460, 980, 1420],
      pizza: [640, 1180],
      cans: [300, 820, 1580],
      boss: null
    },
    {
      name: '水道', w: 2480, theme: 'sewer', holeMax: 3,
      ents: [
        [320, 'foot'], [480, 'gun'], [640, 'foot'], [820, 'foot'],
        [1020, 'gun'], [1220, 'foot'], [1400, 'foot'], [1580, 'gun'],
        [1760, 'foot']
      ],
      holes: [400, 760, 1140, 1620],
      pizza: [720, 1500],
      cans: [540, 1280, 1900],
      boss: ['rock', 2140]
    },
    {
      name: '巢穴', w: 2160, theme: 'lair', holeMax: 2,
      ents: [
        [300, 'foot'], [460, 'gun'], [620, 'foot'], [820, 'foot'],
        [1040, 'gun'], [1220, 'foot'], [1400, 'gun']
      ],
      holes: [520, 980],
      pizza: [700, 1280],
      cans: [400, 1100],
      boss: ['shred', 1840]
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
    return Math.min(12, 3 + ((n * 0.85) | 0));
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

  function selfCheck() {
    if (TURTLE_IDS.length !== 4) throw new Error('4 turtles');
    if (!TURTLES.leo || !TURTLES.mikey || !TURTLES.raph || !TURTLES.don) throw new Error('turtle ids');
    if (TURTLES.leo.name !== '蓝棍' || TURTLES.mikey.name !== '橙拳') throw new Error('names');
    if (TURTLES.raph.name !== '红钗' || TURTLES.don.name !== '紫叉') throw new Error('names 2');
    if (!(TURTLES.leo.reach > TURTLES.don.reach && TURTLES.don.reach > TURTLES.raph.reach && TURTLES.raph.reach > TURTLES.mikey.reach)) {
      throw new Error('reach order');
    }
    if (TURTLES.mikey.t >= TURTLES.raph.t || TURTLES.leo.t <= TURTLES.don.t) throw new Error('swing time');
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (HP_MAX < 12) throw new Error('hp');
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(3) !== 2) throw new Error('combo 3');
    if (comboMul(9) !== 5) throw new Error('combo 9');
    if (BEST_KEY !== 'playbox-tmnt-best') throw new Error('best key');
    if (kindHp('foot', 0) !== 3) throw new Error('foot hp');
    if (kindHp('rock', 1) <= kindHp('gun', 1)) throw new Error('boss hp');
    if (waveCount(1) < 3 || waveCount(20) > 12) throw new Error('wave cap');
    if (jumpH() < 50) throw new Error('jump');
    if (!STAGES[0].holes.length) throw new Error('holes');
    if (STAGES[0].boss || !STAGES[1].boss || STAGES[1].boss[0] !== 'rock') throw new Error('rock boss');
    if (!STAGES[2].boss || STAGES[2].boss[0] !== 'shred') throw new Error('shred boss');
    if (STAGES[0].w >= STAGES[1].w) throw new Error('wider later');
    var i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ents.length) throw new Error('ents');
      if (s.w < 1800) throw new Error('short stage');
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
  var btnSwarm = document.getElementById('btn-swarm');
  var ovAgain = document.getElementById('ov-again');
  var ovMenu = document.getElementById('ov-menu');
  var modeStreet = document.getElementById('mode-street');
  var modeSwarm = document.getElementById('mode-swarm');
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
  var turtleLabel = document.getElementById('turtle-label');
  var hpBar = document.getElementById('hp-bar');
  var pipsEl = document.getElementById('pips');
  var toastEl = document.getElementById('toast');
  var hintEl = document.getElementById('hint');
  var stageEl = document.getElementById('stage');
  var chainPop = document.getElementById('chain-pop');
  var turtleRow = document.getElementById('turtle-row');

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
    kind: 'street',
    turtle: 'leo',
    t: 0,
    clock: 0,
    stage: 1,
    wave: 1,
    camX: 0,
    camY: 0,
    levelW: 2280,
    theme: 'street',
    ents: [],
    holes: [],
    pizzas: [],
    cans: [],
    bullets: [],
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
    holeMax: 2
  };

  function isSwarm() {
    return G.kind === 'swarm';
  }
  function playing() {
    return G.mode === 'play';
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function turtle() {
    return TURTLES[G.turtle] || TURTLES.leo;
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
    whoosh: function (kind) {
      this.ensure();
      if (kind === 'staff' || kind === 'fork') {
        this.noise(0.06, 0.036, 1400);
        this.beep(240, 0.08, 'sawtooth', 0.04, 110);
      } else if (kind === 'sai') {
        this.noise(0.04, 0.032, 1800);
        this.beep(520, 0.05, 'square', 0.036, 220);
      } else {
        this.noise(0.04, 0.03, 1600);
        this.beep(380, 0.06, 'sawtooth', 0.038, 140);
      }
    },
    hit: function (combo, kind) {
      this.ensure();
      var lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.045, 0.042, kind === 'fist' ? 900 : 700);
      this.beep((kind === 'fist' ? 240 : 180) * lift, 0.07, 'square', 0.05, 80);
      this.beep(520 * lift, 0.05, 'triangle', 0.028, 180);
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
    pizza: function () {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.04, 990);
      this.beep(990, 0.1, 'triangle', 0.035, 1320);
    },
    hole: function () {
      this.ensure();
      this.noise(0.08, 0.04, 400);
      this.beep(140, 0.1, 'sawtooth', 0.032, 70);
    },
    can: function () {
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
    charge: function () {
      this.ensure();
      this.noise(0.12, 0.05, 280);
      this.beep(90, 0.18, 'sawtooth', 0.05, 50);
    },
    star: function () {
      this.ensure();
      this.beep(880, 0.05, 'square', 0.032, 420);
      this.beep(1320, 0.06, 'triangle', 0.026, 660);
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
  function loadTurtle() {
    try {
      var id = localStorage.getItem(TURTLE_KEY);
      if (id && TURTLES[id]) G.turtle = id;
    } catch (err) { /* ignore */ }
  }
  function saveTurtle() {
    try { localStorage.setItem(TURTLE_KEY, G.turtle); } catch (err) { /* ignore */ }
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
    var w = isSwarm();
    if (modeStreet) modeStreet.setAttribute('aria-pressed', w ? 'false' : 'true');
    if (modeSwarm) modeSwarm.setAttribute('aria-pressed', w ? 'true' : 'false');
  }
  function syncTurtles() {
    var id, btn, i;
    for (i = 0; i < TURTLE_IDS.length; i++) {
      id = TURTLE_IDS[i];
      btn = document.getElementById('t-' + id);
      if (btn) btn.setAttribute('aria-pressed', id === G.turtle ? 'true' : 'false');
    }
    if (turtleLabel) {
      turtleLabel.textContent = turtle().name;
      turtleLabel.className = 'turtle ' + G.turtle;
    }
  }
  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 3);
    if (stageLabel) {
      if (isSwarm()) stageLabel.textContent = '潮 ' + G.wave;
      else stageLabel.textContent = (STAGES[G.stage - 1] || STAGES[0]).name;
      stageLabel.classList.toggle('hot', isSwarm() ? G.wave >= 5 : G.stage >= 3);
    }
    if (tagLabel) {
      tagLabel.textContent = isSwarm() ? '鼠潮' : '巷战';
      tagLabel.classList.toggle('warn', isSwarm());
      tagLabel.classList.toggle('hot', !isSwarm() && G.stage >= 3);
    }
    if (hpBar) {
      var r = G.hp / HP_MAX;
      hpBar.style.transform = 'scaleX(' + clamp(r, 0, 1) + ')';
      hpBar.classList.toggle('low', r <= 0.34);
    }
    syncPips();
    syncModes();
    syncTurtles();
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'TMNT';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (turtleRow) turtleRow.style.display = kind === 'title' ? '' : 'none';
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' && !isSwarm() ? '鼠潮' : '换模式';
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
    trails.push({ x: x, y: y, face: face, kind: kind || 'fist', t: 0, life: 0.16, reach: turtle().reach });
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
    var spec = KINDS[kind] || KINDS.foot;
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
      grounded: true,
      squash: 1,
      fromHole: false
    };
  }
  function makeHole(x) {
    return { x: x, cd: rand(0.8, 2.4), open: 0, spawns: 0 };
  }
  function makePizza(x) {
    return { x: x, y: GY - 12, taken: false, bob: rand(0, TAU) };
  }
  function makeCan(x) {
    return { x: x, hp: 1, dead: false, deadT: 0 };
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
  function holesPending() {
    var i, h, max = G.holeMax;
    if (G.arena || isSwarm()) return false;
    for (i = 0; i < G.holes.length; i++) {
      h = G.holes[i];
      if (h.spawns < max) return true;
    }
    return false;
  }
  function findBoss() {
    var i, e;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if ((e.kind === 'rock' || e.kind === 'shred') && !e.dead) return e;
    }
    return null;
  }

  function loadStage(n, demoMode) {
    var spec = STAGES[clamp(n, 1, STAGES.length) - 1];
    var i, e;
    G.stage = n;
    G.theme = spec.theme;
    G.levelW = spec.w;
    G.holeMax = spec.holeMax;
    G.ents = [];
    G.holes = [];
    G.pizzas = [];
    G.cans = [];
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
      for (i = 0; i < spec.holes.length; i++) G.holes.push(makeHole(spec.holes[i]));
      for (i = 0; i < spec.pizza.length; i++) G.pizzas.push(makePizza(spec.pizza[i]));
      for (i = 0; i < spec.cans.length; i++) G.cans.push(makeCan(spec.cans[i]));
    } else {
      G.ents.push(makeEnt(420, 'foot', 0));
      G.ents.push(makeEnt(620, 'gun', 0));
      G.ents.push(makeEnt(840, 'foot', 0));
      G.holes.push(makeHole(540));
      G.pizzas.push(makePizza(500));
      G.cans.push(makeCan(300));
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
    G.holeMax = n >= 5 ? 3 : 2;
    for (i = 0; i < G.holes.length; i++) {
      G.holes[i].spawns = 0;
      G.holes[i].cd = rand(0.4, 1.4);
    }
    for (i = 0; i < count; i++) {
      if (n >= 4 && n % 4 === 0 && i === 0) kind = 'rock';
      else if (n >= 8 && n % 8 === 0 && i === 1) kind = 'shred';
      else if (n >= 2 && i % 3 === 1) kind = 'gun';
      else kind = 'foot';
      side = i % 2 === 0 ? 1 : -1;
      x = (G.player ? G.player.x : 320) + side * rand(300, 460);
      x = clamp(x, 40, G.levelW - 40);
      G.spawnQ.push({ t: 0.12 * i, kind: kind, x: x });
    }
    toast('第 ' + n + ' 潮', false, n % 4 === 0);
    audio.wave();
    syncHud();
  }

  function setTurtle(id) {
    if (!TURTLES[id]) return;
    G.turtle = id;
    saveTurtle();
    syncTurtles();
  }

  function startGame(kind) {
    G.kind = kind === 'swarm' ? 'swarm' : 'street';
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
    clearFx();
    if (isSwarm()) {
      G.theme = 'street';
      G.levelW = 2000;
      G.holeMax = 2;
      G.ents = [];
      G.holes = [makeHole(420), makeHole(820), makeHole(1220), makeHole(1620)];
      G.pizzas = [makePizza(640), makePizza(1100)];
      G.cans = [makeCan(360), makeCan(900), makeCan(1500)];
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
    toast(isSwarm() ? '鼠潮' : STAGES[0].name, false, !isSwarm());
    setHint(isSwarm() ? '一潮接一潮 · 井盖更密 · 连击清场' : '往右打 · 跳开枪子 · 井盖冒兵 · 打到裂盔', '');
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
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '神龟', '侧向巷战。选一只神龟，挥棍拳钗叉清场。井盖冒兵，跳开枪子，打到犀甲和裂盔。');
    setHint('走跳劈 · 井盖冒兵 · 跳开枪子 · 四龟不同射程', '');
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
    showOverlay('win', '清场了', '下水道归你们了。分数 ' + G.score + ' · 最高连击 ' + G.maxCombo);
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
    var t = turtle();
    var air = G.atkAir;
    var chain = G.chainN;
    var spec = {
      t: t.t, h0: t.h0, h1: t.h1, dmg: t.dmg, reach: t.reach,
      knock: t.knock, stop: t.stop, down: false, kind: t.wepKind
    };
    if (air) {
      spec.t = 0.28;
      spec.h0 = 0.04;
      spec.h1 = 0.22;
      spec.reach = t.reach * 0.78;
      spec.dmg = Math.max(1, t.dmg);
      spec.knock = t.knock * 0.85;
      spec.kind = 'spin';
    } else if (t.id === 'mikey') {
      if (chain % 3 === 0) {
        spec.t = 0.28;
        spec.h0 = 0.08;
        spec.h1 = 0.18;
        spec.dmg = 2;
        spec.reach = t.reach + 8;
        spec.knock = 110;
        spec.down = true;
        spec.stop = 0.07;
      }
    } else if (chain >= 3 && chain % 3 === 0) {
      spec.knock += 28;
      spec.dmg += 0;
      spec.down = true;
      spec.stop += 0.012;
    }
    return spec;
  }

  function doAtk() {
    if (G.deadT > 0) return;
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
    audio.whoosh(spec.kind === 'spin' ? turtle().wepKind : spec.kind);
    swingTrail(p.x, p.y - 18, p.face, spec.kind);
  }

  function hitEnt(e, spec, p) {
    if (e.dead || e.hurtT > 0.12) return false;
    var dx = (e.x - p.x) * p.face;
    if (dx < 8 || dx > spec.reach + 10) return false;
    if (Math.abs((p.y - 14) - (e.y - e.h * 0.5)) > 28 + (G.atkAir ? 18 : 0)) return false;
    var dmg = spec.dmg;
    e.hp -= dmg;
    e.hurtT = 0.16;
    e.stunT = spec.down ? 0.42 : 0.22;
    e.flash = 0.12;
    e.face = -p.face;
    e.vx = p.face * spec.knock;
    if (spec.down || G.atkAir) e.vy = -160;
    e.act = 'hurt';
    G.atkHit = true;
    bumpCombo();
    audio.hit(G.combo, spec.kind);
    hitStop(spec.stop);
    kick(spec.down ? 4.4 : 2.6, spec.down ? 'boom' : 'hit');
    var hx = p.x + p.face * (12 + spec.reach * 0.55);
    var hy = p.y - 18;
    var rgb = turtle().mask;
    emit(spec.down ? 14 : 9, {
      x: hx, y: hy, j: 10,
      vx0: p.face * 40, vx1: p.face * 220, vy0: -240, vy1: -20,
      r0: 1.5, r1: 3.8, life: 0.42, rgb: rgb
    });
    emit(4, {
      x: hx, y: hy, j: 6,
      vx0: -40, vx1: 40, vy0: -180, vy1: -40,
      r0: 1.2, r1: 2.6, life: 0.3, rgb: GOLD
    });
    popSpark(hx, hy, rgb, spec.down ? 22 : 14);
    var pts = Math.round(SCORE.hit * G.mult * (spec.down ? 1.4 : 1));
    addScore(pts);
    popFloat(hx, hy - 10, '+' + pts, GOLD);
    if (e.hp <= 0) {
      e.dead = true;
      e.deadT = 0.55;
      e.vy = -220;
      e.vx = p.face * (spec.knock + 80);
      popRing(e.x, e.y - 16, rgb, 26);
      var ks = Math.round((KINDS[e.kind] ? KINDS[e.kind].score : 160) * G.mult);
      addScore(ks);
      popFloat(e.x, e.y - 36, '+' + ks, rgb);
      if (e.kind === 'rock' || e.kind === 'shred') {
        screenFlash(GOLD, 0.45);
        kick(6, 'boom');
        toast(e.kind === 'rock' ? '犀甲倒了' : '裂盔倒了', false, true);
      }
    }
    return true;
  }

  function hitCans(spec, p) {
    var i, c, dx;
    for (i = 0; i < G.cans.length; i++) {
      c = G.cans[i];
      if (c.dead) continue;
      dx = (c.x - p.x) * p.face;
      if (dx < 4 || dx > spec.reach + 8) continue;
      if (Math.abs(p.y - GY) > 36) continue;
      c.dead = true;
      c.deadT = 0.4;
      G.atkHit = true;
      bumpCombo();
      audio.can();
      hitStop(0.04);
      kick(2.2, 'thump');
      emit(12, {
        x: c.x, y: GY - 14, j: 8,
        vx0: -160, vx1: 160, vy0: -280, vy1: -40,
        r0: 1.6, r1: 4, life: 0.45, rgb: BRN
      });
      addScore(Math.round(SCORE.can * G.mult));
      if (hash2((c.x * 17) | 0) > 0.62) G.pizzas.push(makePizza(c.x));
    }
  }

  function tryHit() {
    var p = G.player;
    if (!p || G.atkHit) return;
    var spec = atkSpec();
    var i, e, any = false;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (hitEnt(e, spec, p)) any = true;
    }
    hitCans(spec, p);
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
    var e, dx, spec;
    if (!p) return;
    demo.l = false;
    demo.r = false;
    demo.jump = false;
    e = nearestEnt();
    spec = turtle();
    if (!e) {
      demo.r = p.x < 380;
      demo.l = p.x > 720;
      return;
    }
    dx = e.x - p.x;
    if (e.kind === 'gun' && Math.abs(dx) < 210 && p.grounded) demo.jump = true;
    if (Math.abs(dx) > spec.reach - 6) {
      if (dx > 0) demo.r = true;
      else demo.l = true;
    } else if (G.atkT <= 0) {
      doAtk();
    }
  }

  function updatePlayer(dt) {
    var p = G.player;
    var spec = turtle();
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
        if (G.theme === 'sewer') {
          emit(4, {
            x: p.x, y: GY - 2, j: 6,
            vx0: -40, vx1: 40, vy0: -80, vy1: -10,
            r0: 1.2, r1: 2.4, life: 0.28, rgb: HOT, g: 80
          });
        }
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
  }

  function updateAtk(dt) {
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
    var dx, dist, want, cap;
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
      if (e.kind === 'rock' && e.act === 'charge') {
        e.x += e.face * 280 * dt;
        e.x = clamp(e.x, 24, G.levelW - 24);
        if (!e.atkHit && overlapPlayer(e) && Math.abs(p.y - e.y) < 36) {
          e.atkHit = true;
          hurtPlayer(e.dmg, e.x, 200);
        }
        emit(1, {
          x: e.x - e.face * 10, y: GY - 2, j: 4,
          vx0: -e.face * 40, vx1: -e.face * 10, vy0: -40, vy1: -8,
          r0: 1.5, r1: 3.2, life: 0.28, rgb: [160, 160, 140], g: 80
        });
        if (e.atkT <= 0) { e.act = 'tired'; e.cd = 0.7; }
        return;
      }
      if (e.kind === 'rock' && e.act === 'snort') {
        e.squash = 1 + Math.sin(G.clock * 24) * 0.04;
        if (e.atkT <= 0) {
          e.act = 'charge';
          e.atkT = 0.72;
          e.atkHit = false;
          audio.charge();
        }
        return;
      }
      if (e.kind === 'gun' && !e.atkHit && e.atkT < 0.08) {
        e.atkHit = true;
        G.bullets.push({
          x: e.x + e.face * 16,
          y: e.y - 18,
          vx: e.face * 260,
          life: 1.35,
          dmg: 2
        });
        audio.gun();
        popSpark(e.x + e.face * 16, e.y - 18, GOLD, 10);
      }
      if (e.kind === 'shred' && e.act === 'throw' && !e.atkHit && e.atkT < 0.18) {
        e.atkHit = true;
        G.bullets.push({ x: e.x + e.face * 14, y: e.y - 22, vx: e.face * 220, vy: -40, life: 1.5, dmg: 2, star: true });
        G.bullets.push({ x: e.x + e.face * 14, y: e.y - 18, vx: e.face * 250, vy: 0, life: 1.5, dmg: 2, star: true });
        G.bullets.push({ x: e.x + e.face * 14, y: e.y - 14, vx: e.face * 220, vy: 30, life: 1.5, dmg: 2, star: true });
        audio.star();
      }
      if ((e.kind === 'foot' || e.kind === 'shred') && e.act === 'atk' && !e.atkHit && e.atkT < 0.16 && e.atkT > 0.04) {
        if (overlapPlayer(e) && Math.abs(p.y - e.y) < 24) {
          e.atkHit = true;
          hurtPlayer(e.dmg, e.x, 150);
        }
      }
      if (e.atkT <= 0) e.act = 'idle';
      e.vy += GRAV * dt;
      e.y += e.vy * dt;
      if (e.y >= GY) { e.y = GY; e.vy = 0; e.grounded = true; }
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
    } else if (e.kind === 'rock') {
      if (e.act === 'tired') {
        e.cd -= dt;
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
    } else if (e.kind === 'shred') {
      if (e.cd <= 0 && dist < 320) {
        if (dist > 70 && hash2((G.t * 100 + e.x) | 0) > 0.45) {
          e.act = 'throw';
          e.atkT = 0.4;
          e.atkHit = false;
          e.cd = rand(1.0, 1.6);
        } else if (dist < 50) {
          e.act = 'atk';
          e.atkT = 0.32;
          e.atkHit = false;
          e.cd = 0.7;
        } else {
          e.x += e.face * e.spd * 1.15 * dt;
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

  function updateHoles(dt) {
    var i, h, e, cap, near;
    cap = isSwarm() ? 14 : 10;
    for (i = 0; i < G.holes.length; i++) {
      h = G.holes[i];
      if (h.open > 0) h.open -= dt;
      h.cd -= dt;
      if (G.arena) continue;
      if (h.spawns >= G.holeMax) continue;
      if (h.cd > 0) continue;
      if (livingCount() >= cap) { h.cd = 0.6; continue; }
      near = G.player && Math.abs(G.player.x - h.x) < 560;
      if (!near && !isSwarm()) { h.cd = 0.4; continue; }
      e = makeEnt(h.x, 'foot', isSwarm() ? G.wave : 0);
      e.vy = -300;
      e.grounded = false;
      e.fromHole = true;
      e.face = G.player && G.player.x > h.x ? 1 : -1;
      G.ents.push(e);
      h.spawns += 1;
      h.open = 0.5;
      h.cd = isSwarm() ? rand(1.4, 2.4) : rand(2.6, 4.2);
      audio.hole();
      emit(8, {
        x: h.x, y: GY - 4, j: 8,
        vx0: -70, vx1: 70, vy0: -160, vy1: -20,
        r0: 1.4, r1: 3.2, life: 0.4, rgb: [40, 48, 44]
      });
    }
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
      if (Math.abs(b.x - p.x) < 10 && Math.abs(b.y - (p.y - 16)) < 12) {
        G.bullets.splice(i, 1);
        hurtPlayer(b.dmg || 2, b.x - b.vx, 120);
      }
    }
  }

  function updatePickups(dt) {
    var i, z, p = G.player, c;
    if (!p) return;
    for (i = 0; i < G.pizzas.length; i++) {
      z = G.pizzas[i];
      if (z.taken) continue;
      z.bob += dt * 4;
      if (G.mode === 'title' || G.deadT > 0) continue;
      if (Math.abs(z.x - p.x) < 16 && Math.abs((z.y) - (p.y - 10)) < 22) {
        z.taken = true;
        G.hp = Math.min(HP_MAX, G.hp + 5);
        addScore(SCORE.pizza);
        audio.pizza();
        toast('披萨', false, true);
        popRing(z.x, z.y, GOLD, 18);
        emit(10, {
          x: z.x, y: z.y, j: 6,
          vx0: -80, vx1: 80, vy0: -180, vy1: -20,
          r0: 1.4, r1: 3, life: 0.4, rgb: GOLD
        });
        syncHud();
      }
    }
    for (i = 0; i < G.cans.length; i++) {
      c = G.cans[i];
      if (c.dead && c.deadT > 0) c.deadT -= dt;
    }
  }

  function updateWaves(dt) {
    var i, s;
    if (!isSwarm() || !playing()) return;
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
    if (isSwarm()) {
      G.pizzas.push(makePizza(clamp((G.player ? G.player.x : 400) + 80, 60, G.levelW - 60)));
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
    setHint(G.stage === 2 ? '水道 · 犀甲会冲撞，跳过去再打' : '巢穴 · 裂盔丢星，跳开再近身', G.stage === 3 ? 'hot' : '');
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
        toast(boss.kind === 'rock' ? '犀甲来了' : '裂盔现身', true, false);
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
    if (holesPending()) return;
    G.clearT = isSwarm() ? 0.85 : 1.05;
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
    updateFx(dt);
    if (G.mode === 'title') {
      demoThink();
      updatePlayer(dt);
      updateAtk(dt);
      for (i = G.ents.length - 1; i >= 0; i--) {
        updateEnt(G.ents[i], dt);
        if (G.ents[i].dead && G.ents[i].deadT < 0) G.ents.splice(i, 1);
      }
      updateHoles(dt);
      updateBullets(dt);
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
    for (i = G.ents.length - 1; i >= 0; i--) {
      updateEnt(G.ents[i], dt);
      if (G.ents[i].dead && G.ents[i].deadT < 0) G.ents.splice(i, 1);
    }
    updateHoles(dt);
    updateBullets(dt);
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
    if (G.theme === 'sewer') {
      g.addColorStop(0, '#061410');
      g.addColorStop(0.55, '#0a1c16');
      g.addColorStop(1, '#0c2418');
    } else if (G.theme === 'lair') {
      g.addColorStop(0, '#10080c');
      g.addColorStop(0.5, '#140c12');
      g.addColorStop(1, '#1a1014');
    } else {
      g.addColorStop(0, '#071410');
      g.addColorStop(0.45, '#0a1a14');
      g.addColorStop(1, '#102018');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    if (G.theme === 'street') {
      ctx.fillStyle = 'rgba(255,227,107,0.14)';
      ctx.beginPath();
      ctx.arc(sx(G.camX + 520), sy(48), 22 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,227,107,0.5)';
      ctx.beginPath();
      ctx.arc(sx(G.camX + 520), sy(48), 8 * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < 18; i++) {
      tw = hash2(i * 19 + (G.theme === 'lair' ? 3 : 1));
      px = ((i * 137 + G.camX * 0.12) % (VW + 40)) - 20;
      py = 18 + tw * 90;
      ctx.fillStyle = rgba(WHT, 0.12 + tw * 0.2);
      ctx.fillRect(ox + px * scale, oy + py * scale, 1.4 * scale, 1.4 * scale);
    }
  }

  function drawBuildings() {
    var x, w, h, b, win, wy, wx, lit, sign;
    var start = ((G.camX / 70) | 0) - 1;
    var end = start + 16;
    for (b = start; b < end; b++) {
      x = b * 70;
      w = 54 + hash2(b * 3) * 18;
      h = 90 + hash2(b * 7) * 80;
      if (G.theme === 'sewer') {
        ctx.fillStyle = b % 3 === 0 ? '#143028' : '#10241e';
        fillRound(sx(x), sy(GY - 8 - h), w * scale, (h + 10) * scale, 2 * scale);
        ctx.fillStyle = 'rgba(40,80,60,0.5)';
        ctx.fillRect(sx(x + 8), sy(GY - h + 10), 10 * scale, h * 0.7 * scale);
        if (hash2(b) > 0.55) {
          ctx.strokeStyle = 'rgba(80,120,90,0.55)';
          ctx.lineWidth = 4 * scale;
          ctx.beginPath();
          ctx.arc(sx(x + w * 0.5), sy(GY - 40), 16 * scale, TAU * 0.05, TAU * 0.95);
          ctx.stroke();
        }
      } else if (G.theme === 'lair') {
        ctx.fillStyle = b % 2 === 0 ? '#1c1014' : '#241418';
        ctx.fillRect(sx(x), sy(GY - 8 - h), w * scale, (h + 10) * scale);
        ctx.fillStyle = rgba(RED, 0.12 + 0.08 * Math.sin(G.clock * 2 + b));
        ctx.fillRect(sx(x + 6), sy(GY - h + 16), (w - 12) * scale, 8 * scale);
        ctx.fillStyle = 'rgba(180,190,200,0.18)';
        ctx.fillRect(sx(x + w * 0.45), sy(GY - h - 20), 3 * scale, 28 * scale);
      } else {
        ctx.fillStyle = b % 2 === 0 ? '#12241c' : '#0e1e18';
        ctx.fillRect(sx(x), sy(GY - 8 - h), w * scale, (h + 10) * scale);
        ctx.fillStyle = 'rgba(61,255,122,0.05)';
        ctx.fillRect(sx(x), sy(GY - 8 - h), 3 * scale, (h + 10) * scale);
        for (wy = 16; wy < h - 20; wy += 16) {
          for (wx = 8; wx < w - 10; wx += 12) {
            lit = hash2(b * 31 + wy + wx) > 0.55;
            ctx.fillStyle = lit
              ? (hash2(b + wx) > 0.7 ? rgba(GOLD, 0.45) : rgba(CYN, 0.28))
              : 'rgba(8,16,12,0.7)';
            ctx.fillRect(sx(x + wx), sy(GY - h + wy), 7 * scale, 8 * scale);
          }
        }
        if (hash2(b * 11) > 0.72) {
          sign = hash2(b * 5) > 0.5 ? 'PIZZA' : 'SEWER';
          ctx.fillStyle = rgba(hash2(b) > 0.5 ? MAG : HOT, 0.55);
          ctx.font = (7 * scale) + 'px sans-serif';
          ctx.fillText(sign, sx(x + 8), sy(GY - h + 12));
        }
      }
    }
  }

  function drawGround() {
    var g, i, x;
    g = ctx.createLinearGradient(0, sy(GY - 6), 0, sy(VH));
    if (G.theme === 'sewer') {
      g.addColorStop(0, '#1a3a2a');
      g.addColorStop(0.35, '#10241c');
      g.addColorStop(1, '#081410');
    } else if (G.theme === 'lair') {
      g.addColorStop(0, '#2a181c');
      g.addColorStop(1, '#14080c');
    } else {
      g.addColorStop(0, '#1c2e24');
      g.addColorStop(0.4, '#122018');
      g.addColorStop(1, '#0a1410');
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
    if (G.theme === 'sewer') {
      ctx.fillStyle = rgba(HOT, 0.12 + 0.04 * Math.sin(G.clock * 2));
      ctx.beginPath();
      ctx.moveTo(sx(G.camX - 10), sy(VH));
      for (i = 0; i <= 12; i++) {
        ctx.lineTo(sx(G.camX + i * 56), sy(VH - 10 - Math.sin(G.clock * 3 + i) * 4));
      }
      ctx.lineTo(sx(G.camX + VW + 10), sy(VH));
      ctx.fill();
    }
  }

  function drawHole(h) {
    var x = sx(h.x);
    var y = sy(GY);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.ellipse(x, y - 2 * scale, 16 * scale, 6 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(HOT, 0.25);
    ctx.lineWidth = 1.4 * scale;
    ctx.stroke();
    ctx.fillStyle = '#2a322c';
    ctx.save();
    ctx.translate(x + (h.open > 0 ? 10 * scale : 0), y - 3 * scale);
    ctx.rotate(h.open > 0 ? -0.9 : 0);
    ctx.beginPath();
    ctx.ellipse(0, 0, 15 * scale, 5.5 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,90,80,0.7)';
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  function drawPizza(z) {
    if (z.taken) return;
    var x = sx(z.x);
    var y = sy(z.y - Math.sin(z.bob) * 3);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(0, 0, 7 * scale, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(ORG, 0.9);
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(180,80,40,0.7)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(5 * scale, 3 * scale);
    ctx.moveTo(0, 0);
    ctx.lineTo(-4 * scale, 4 * scale);
    ctx.moveTo(0, 0);
    ctx.lineTo(1 * scale, -6 * scale);
    ctx.stroke();
    ctx.fillStyle = rgba(RED, 0.85);
    ctx.beginPath();
    ctx.arc(2 * scale, -1 * scale, 1.3 * scale, 0, TAU);
    ctx.arc(-2.5 * scale, 1.5 * scale, 1.1 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawCan(c) {
    if (c.dead && c.deadT <= 0) return;
    var x = sx(c.x);
    var y = sy(GY);
    var a = c.dead ? clamp(c.deadT / 0.4, 0, 1) : 1;
    ctx.save();
    ctx.globalAlpha = a;
    if (c.dead) ctx.translate(0, (1 - a) * 8 * scale);
    ctx.fillStyle = '#6a4a28';
    fillRound(x - 8 * scale, y - 20 * scale, 16 * scale, 20 * scale, 2 * scale);
    ctx.fillStyle = '#8a6236';
    ctx.fillRect(x - 8 * scale, y - 20 * scale, 16 * scale, 4 * scale);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x - 2 * scale, y - 16 * scale, 4 * scale, 12 * scale);
    ctx.restore();
  }

  function drawShadow(x, y, sc) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(GY + 1), 12 * scale * (sc || 1), 3.4 * scale, 0, 0, TAU);
    ctx.fill();
  }

  function drawWeapon(kind, sc, atk, bob) {
    var ext = atk ? 1 : 0.4;
    var hx = 7 * sc;
    var hy = -18 * sc + bob;
    ctx.lineCap = 'round';
    if (kind === 'staff') {
      ctx.strokeStyle = rgba(BRN, 1);
      ctx.lineWidth = 2.6 * sc;
      ctx.beginPath();
      ctx.moveTo(hx - 2 * sc, hy + 4 * sc);
      ctx.lineTo(hx + 28 * sc * ext, hy - 10 * sc * ext);
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.beginPath();
      ctx.arc(hx + 28 * sc * ext, hy - 10 * sc * ext, 2 * sc, 0, TAU);
      ctx.fill();
    } else if (kind === 'fork') {
      ctx.strokeStyle = rgba(PUR, 0.95);
      ctx.lineWidth = 2.4 * sc;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + 22 * sc * ext, hy - 8 * sc * ext);
      ctx.stroke();
      ctx.lineWidth = 1.8 * sc;
      ctx.beginPath();
      ctx.moveTo(hx + 16 * sc * ext, hy - 4 * sc * ext);
      ctx.lineTo(hx + 26 * sc * ext, hy - 14 * sc * ext);
      ctx.moveTo(hx + 16 * sc * ext, hy - 4 * sc * ext);
      ctx.lineTo(hx + 26 * sc * ext, hy + 2 * sc * ext);
      ctx.stroke();
    } else if (kind === 'sai') {
      ctx.strokeStyle = rgba(WHT, 0.92);
      ctx.lineWidth = 1.7 * sc;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + 16 * sc * ext, hy - 6 * sc * ext);
      ctx.moveTo(hx - 2 * sc, hy + 6 * sc);
      ctx.lineTo(hx + 12 * sc * ext, hy + 8 * sc);
      ctx.stroke();
      ctx.strokeStyle = rgba(RED, 0.8);
      ctx.lineWidth = 1.2 * sc;
      ctx.beginPath();
      ctx.moveTo(hx + 6 * sc * ext, hy - 2 * sc);
      ctx.lineTo(hx + 10 * sc * ext, hy - 10 * sc * ext);
      ctx.stroke();
    } else {
      ctx.fillStyle = rgba(ORG, atk ? 0.95 : 0.7);
      ctx.beginPath();
      ctx.arc(hx + 10 * sc * ext, hy - 2 * sc, 3.2 * sc, 0, TAU);
      ctx.fill();
      if (atk) {
        ctx.strokeStyle = rgba(GOLD, 0.55);
        ctx.lineWidth = 1.4 * sc;
        ctx.beginPath();
        ctx.arc(hx + 10 * sc * ext, hy - 2 * sc, 6 * sc, 0, TAU);
        ctx.stroke();
      }
    }
  }

  function drawTurtleBody(p, blink) {
    if (blink && ((G.t * 18) | 0) % 2 === 0) return;
    var spec = turtle();
    var sc = scale * (p.scale || 1);
    var face = p.face || 1;
    var act = p.act || 'idle';
    var bob = (act === 'walk') ? Math.sin(p.run || 0) * 1.8 * sc : Math.sin(G.clock * 3) * 0.5 * sc;
    var sq = p.squash || 1;
    var x = sx(p.x);
    var y = sy(p.y);
    var atk = act === 'atk' || act === 'spin';
    var leg = act === 'walk' ? Math.sin(p.run || 0) * 4.2 * sc : (act === 'jump' || act === 'spin' ? -5 * sc : 0);
    ctx.save();
    ctx.translate(x, y);
    if (act === 'spin') ctx.rotate(G.clock * 16 * face);
    if (act === 'down') { ctx.rotate(-0.55 * face); ctx.translate(0, 6 * sc); }
    ctx.scale(face, sq);

    ctx.strokeStyle = rgba(GRN2, 0.95);
    ctx.lineWidth = 3.2 * sc;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3.4 * sc, -8 * sc);
    ctx.lineTo(-5 * sc - leg, 0);
    ctx.moveTo(3.4 * sc, -8 * sc);
    ctx.lineTo(5 * sc + leg, 0);
    ctx.stroke();
    ctx.fillStyle = rgba(GRN, 1);
    ctx.beginPath();
    ctx.ellipse(-5 * sc - leg, 1 * sc, 3.2 * sc, 1.6 * sc, 0, 0, TAU);
    ctx.ellipse(5 * sc + leg, 1 * sc, 3.2 * sc, 1.6 * sc, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(SHELL, 1);
    ctx.beginPath();
    ctx.ellipse(-1 * sc, -16 * sc + bob, 9.2 * sc, 8 * sc, -0.15, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(BELLY, 0.45);
    ctx.lineWidth = 1.1 * sc;
    ctx.beginPath();
    ctx.ellipse(-1 * sc, -16 * sc + bob, 5.5 * sc, 4.8 * sc, -0.15, 0, TAU);
    ctx.stroke();

    ctx.fillStyle = rgba(GRN, 1);
    ctx.beginPath();
    ctx.ellipse(1 * sc, -16 * sc + bob, 7.4 * sc, 8.4 * sc, 0.08, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(BELLY, 0.95);
    ctx.beginPath();
    ctx.ellipse(2.2 * sc, -14 * sc + bob, 4.2 * sc, 6 * sc, 0.1, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(spec.mask, 0.95);
    ctx.fillRect(-5 * sc, -12 * sc + bob, 12 * sc, 2.2 * sc);

    ctx.strokeStyle = rgba(GRN, 0.95);
    ctx.lineWidth = 2.6 * sc;
    ctx.beginPath();
    ctx.moveTo(-5 * sc, -18 * sc + bob);
    ctx.lineTo(-9 * sc, (atk ? -12 : -11) * sc + bob);
    ctx.moveTo(5 * sc, -19 * sc + bob);
    ctx.lineTo(8 * sc + (atk ? 6 * sc : 0), -18 * sc + bob);
    ctx.stroke();
    ctx.fillStyle = rgba(GRN, 1);
    ctx.beginPath();
    ctx.arc(-9 * sc, -11 * sc + bob, 2.1 * sc, 0, TAU);
    ctx.arc(8 * sc + (atk ? 6 * sc : 0), -18 * sc + bob, 2.2 * sc, 0, TAU);
    ctx.fill();
    drawWeapon(spec.wepKind, sc, atk, bob);

    ctx.fillStyle = rgba(GRN, 1);
    ctx.beginPath();
    ctx.arc(1 * sc, -28 * sc + bob, 5.6 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(spec.mask, 1);
    ctx.beginPath();
    ctx.ellipse(1.2 * sc, -28 * sc + bob, 5.8 * sc, 2.4 * sc, 0, 0, TAU);
    ctx.fill();
    ctx.fillRect(-5.4 * sc, -29 * sc + bob, 3 * sc, 7 * sc);
    ctx.fillStyle = '#f4fff8';
    ctx.beginPath();
    ctx.ellipse(3.4 * sc, -28.2 * sc + bob, 1.5 * sc, 1.7 * sc, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#102018';
    ctx.beginPath();
    ctx.arc(3.8 * sc, -28 * sc + bob, 0.85 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(20,40,28,0.7)';
    ctx.fillRect(2.2 * sc, -24.4 * sc + bob, 2.4 * sc, 1.1 * sc);

    if (p.flash > 0 || G.hurtT > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-12 * sc, -40 * sc, 26 * sc, 42 * sc);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawFoot(e) {
    var sc = scale * (e.scale || 1);
    var x = sx(e.x);
    var y = sy(e.y);
    var bob = e.act === 'walk' || e.act === 'charge' ? Math.sin(e.run || 0) * 1.6 * sc : 0;
    var atk = e.act === 'atk' || e.act === 'throw';
    var leg = e.act === 'walk' ? Math.sin(e.run || 0) * 4 * sc : 0;
    var pal = e.kind === 'gun' ? [72, 48, 110] : [96, 52, 150];
    ctx.save();
    ctx.translate(x, y);
    if (e.act === 'down') { ctx.rotate(-0.5 * (e.face || 1)); ctx.translate(0, 6 * sc); }
    ctx.scale(e.face || 1, e.squash || 1);

    ctx.strokeStyle = '#2a1a40';
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
    ctx.fillStyle = rgba(WHT, 0.85);
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
    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.fillRect(-5.2 * sc, -27 * sc + bob, 10.4 * sc, 1.4 * sc);
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

  function drawRock(e) {
    var sc = scale * (e.scale || 1);
    var x = sx(e.x);
    var y = sy(e.y);
    var bob = e.act === 'walk' ? Math.sin(e.run || 0) * 1.2 * sc : 0;
    var charge = e.act === 'charge';
    ctx.save();
    ctx.translate(x, y);
    if (e.act === 'down') ctx.rotate(-0.4 * (e.face || 1));
    ctx.scale(e.face || 1, e.squash || 1);
    if (charge) ctx.rotate(-0.18);

    ctx.fillStyle = '#5a6254';
    ctx.beginPath();
    ctx.ellipse(0, -4 * sc, 10 * sc, 4 * sc, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#7a846c';
    fillRound(-12 * sc, -28 * sc + bob, 26 * sc, 24 * sc, 6 * sc);
    ctx.fillStyle = '#4a5244';
    fillRound(-8 * sc, -22 * sc + bob, 18 * sc, 8 * sc, 2 * sc);
    ctx.fillStyle = '#9aa090';
    ctx.beginPath();
    ctx.moveTo(8 * sc, -30 * sc + bob);
    ctx.lineTo(20 * sc, -26 * sc + bob);
    ctx.lineTo(8 * sc, -22 * sc + bob);
    ctx.fill();
    ctx.fillStyle = '#6e7662';
    ctx.beginPath();
    ctx.ellipse(2 * sc, -34 * sc + bob, 7 * sc, 6 * sc, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1810';
    ctx.beginPath();
    ctx.arc(5 * sc, -34 * sc + bob, 1.4 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(ORG, e.act === 'snort' ? 0.8 : 0.35);
    ctx.beginPath();
    ctx.arc(6 * sc, -30 * sc + bob, 1.2 * sc, 0, TAU);
    ctx.fill();
    if (e.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.3);
      ctx.fillRect(-14 * sc, -42 * sc, 32 * sc, 44 * sc);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawShred(e) {
    var sc = scale * (e.scale || 1);
    var x = sx(e.x);
    var y = sy(e.y);
    var bob = e.act === 'walk' ? Math.sin(e.run || 0) * 1.4 * sc : 0;
    var atk = e.act === 'atk' || e.act === 'throw';
    ctx.save();
    ctx.translate(x, y);
    if (e.act === 'down') ctx.rotate(-0.5 * (e.face || 1));
    ctx.scale(e.face || 1, e.squash || 1);

    ctx.fillStyle = 'rgba(140,20,40,0.8)';
    ctx.beginPath();
    ctx.moveTo(-2 * sc, -18 * sc + bob);
    ctx.quadraticCurveTo(-22 * sc, -8 * sc + Math.sin(G.clock * 4) * 3 * sc, -10 * sc, 0);
    ctx.lineTo(2 * sc, -8 * sc);
    ctx.fill();

    ctx.fillStyle = '#c8d0d8';
    fillRound(-7 * sc, -12 * sc + bob, 16 * sc, 12 * sc, 2 * sc);
    ctx.fillStyle = '#9aa4b0';
    ctx.fillRect(-6 * sc, -18 * sc + bob, 14 * sc, 6 * sc);

    ctx.strokeStyle = '#e8eef4';
    ctx.lineWidth = 2.2 * sc;
    ctx.beginPath();
    ctx.moveTo(-5 * sc, -20 * sc + bob);
    ctx.lineTo(-10 * sc, -10 * sc + bob);
    ctx.moveTo(6 * sc, -20 * sc + bob);
    ctx.lineTo(8 * sc + (atk ? 16 * sc : 4 * sc), (atk ? -26 : -14) * sc + bob);
    ctx.stroke();
    ctx.fillStyle = '#d8e0e8';
    ctx.beginPath();
    ctx.moveTo(8 * sc + (atk ? 14 * sc : 2 * sc), (atk ? -28 : -16) * sc + bob);
    ctx.lineTo(18 * sc + (atk ? 14 * sc : 2 * sc), (atk ? -22 : -10) * sc + bob);
    ctx.lineTo(8 * sc + (atk ? 14 * sc : 2 * sc), (atk ? -18 : -8) * sc + bob);
    ctx.fill();

    ctx.fillStyle = '#d0d8e0';
    ctx.beginPath();
    ctx.moveTo(-6 * sc, -26 * sc + bob);
    ctx.lineTo(0, -38 * sc + bob);
    ctx.lineTo(8 * sc, -26 * sc + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1a1010';
    ctx.fillRect(2 * sc, -30 * sc + bob, 2 * sc, 1.6 * sc);
    ctx.fillStyle = rgba(RED, 0.7);
    ctx.fillRect(-2 * sc, -24 * sc + bob, 8 * sc, 1.4 * sc);

    if (e.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.3);
      ctx.fillRect(-12 * sc, -40 * sc, 26 * sc, 42 * sc);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawEnt(e) {
    var blink = e.hurtT > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (e.dead && e.deadT < 0) return;
    if (e.dead && e.deadT < 0.2 && ((G.t * 24) | 0) % 2 === 0) return;
    drawShadow(e.x, e.y, e.scale || 1);
    if (e.kind === 'rock') drawRock(e);
    else if (e.kind === 'shred') drawShred(e);
    else drawFoot(e);
    if (blink && e.kind !== 'rock' && e.kind !== 'shred') return;
    if (e.max && e.hp < e.max && e.hp > 0 && !e.dead) {
      var bw = 22 * scale * (e.scale || 1);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(sx(e.x) - bw / 2, sy(e.y - 46 * (e.scale || 1)), bw, 3.2 * scale);
      ctx.fillStyle = rgba(e.hp / e.max < 0.34 ? MAG : LEAF, 0.9);
      ctx.fillRect(sx(e.x) - bw / 2, sy(e.y - 46 * (e.scale || 1)), bw * (e.hp / e.max), 3.2 * scale);
    }
  }

  function drawBullet(b) {
    var x = sx(b.x);
    var y = sy(b.y);
    ctx.save();
    if (b.star) {
      ctx.translate(x, y);
      ctx.rotate(G.clock * 10);
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -4.2 * scale);
      ctx.lineTo(1.2 * scale, -1.2 * scale);
      ctx.lineTo(4.2 * scale, 0);
      ctx.lineTo(1.2 * scale, 1.2 * scale);
      ctx.lineTo(0, 4.2 * scale);
      ctx.lineTo(-1.2 * scale, 1.2 * scale);
      ctx.lineTo(-4.2 * scale, 0);
      ctx.lineTo(-1.2 * scale, -1.2 * scale);
      ctx.closePath();
      ctx.fill();
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
      ctx.strokeStyle = rgba(turtle().mask, 0.45 * a);
      ctx.lineWidth = 2.4 * scale;
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
    ctx.fillStyle = '#04140a';
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
    for (i = 0; i < G.holes.length; i++) drawHole(G.holes[i]);
    for (i = 0; i < G.cans.length; i++) drawCan(G.cans[i]);
    for (i = 0; i < G.pizzas.length; i++) drawPizza(G.pizzas[i]);
    drawTrails();
    G.ents.sort(function (a, b) { return a.y - b.y; });
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    for (i = 0; i < G.bullets.length; i++) drawBullet(G.bullets[i]);
    p = G.player;
    if (p) {
      drawShadow(p.x, p.y, 1);
      drawTurtleBody(p, G.invuln > 0 && G.mode !== 'title' && ((G.t * 16) | 0) % 2 === 0);
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
    if (G.mode === 'title') {
      if (k === '1') { setTurtle('leo'); return; }
      if (k === '2') { setTurtle('mikey'); return; }
      if (k === '3') { setTurtle('raph'); return; }
      if (k === '4') { setTurtle('don'); return; }
    }
    if (overlayOpen()) {
      if (space || k === 'Enter') primaryAction();
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

  function bindTurtles() {
    var i, id, btn;
    if (!turtleRow) return;
    turtleRow.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.getAttribute) return;
      id = t.getAttribute('data-id');
      if (!id) return;
      audio.ensure();
      setTurtle(id);
      if (G.mode === 'title' && G.player) G.player.squash = 1.18;
      toast(turtle().name + ' · 射程 ' + turtle().reach, false, true);
    });
    for (i = 0; i < TURTLE_IDS.length; i++) {
      id = TURTLE_IDS[i];
      btn = document.getElementById('t-' + id);
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
  loadTurtle();
  initMute();
  goTitle();
  resize();
  bindPointer();
  bindPad();
  bindTurtles();

  if (btnStreet) {
    btnStreet.addEventListener('click', function () {
      audio.ensure();
      startGame('street');
    });
  }
  if (btnSwarm) {
    btnSwarm.addEventListener('click', function () {
      audio.ensure();
      startGame('swarm');
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
      if (G.mode === 'win' && !isSwarm()) startGame('swarm');
      else goTitle();
    });
  }
  if (modeStreet) {
    modeStreet.addEventListener('click', function () {
      audio.ensure();
      startGame('street');
    });
  }
  if (modeSwarm) {
    modeSwarm.addEventListener('click', function () {
      audio.ensure();
      startGame('swarm');
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
