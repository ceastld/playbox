'use strict';

/* 战斧 — Golden Axe lite. No CDN. */

(function () {
  var VW = 640;
  var VH = 360;
  var GY = 318;
  var ZS = 0.72;
  var ZMIN = 6;
  var ZMAX = 90;
  var LIVES = 3;
  var LIFE_CAP = 6;
  var LIFE_EVERY = 18000;
  var HP_MAX = 12;
  var HP_MEAT = 4;
  var MAGIC_MAX = 6;
  var MAGIC_START = 2;
  var MAGIC_COST = 1;
  var MAGIC_DMG = 4;
  var MAGIC_T = 0.62;
  var STEP = 1 / 60;
  var TAU = Math.PI * 2;
  var COMBO_WIN = 1.55;
  var WALK = 172;
  var WALK_Z = 98;
  var AIR = 0.88;
  var JUMP_V = 430;
  var GRAV = 1280;
  var MAX_FALL = 620;
  var INVULN = 0.92;
  var DIE_T = 0.85;
  var BEST_KEY = 'playbox-axe-war-best';
  var MUTE_KEY = 'playbox-axe-war-mute';
  var OPS = '方向 / WASD 走 · 空格跳 · Z 斧连击 · C 魔法 · R 重开 · M 静音';

  var MAG = [255, 61, 184];
  var CYN = [0, 240, 255];
  var GOLD = [255, 227, 107];
  var HOT = [255, 122, 20];
  var HOT2 = [255, 176, 72];
  var WHT = [246, 241, 234];
  var LEAF = [61, 255, 122];
  var BRN = [196, 122, 52];
  var SKIN = [232, 176, 132];
  var STEEL = [188, 196, 208];
  var PUR = [168, 92, 255];

  var SCORE = {
    slash: 50, sweep: 80, smash: 120, ram: 100, flame: 110, magic: 90,
    thief: 180, knight: 320, rider: 400, boss: 5000,
    stage: 2000, wave: 800, gold: 250, pickup: 40
  };

  var KINDS = {
    thief: { hp: 3, name: '盗贼', spd: 118, dmg: 1, score: 'thief', scale: 0.88, reach: 24, think: 0.55 },
    knight: { hp: 6, name: '骑士', spd: 72, dmg: 2, score: 'knight', scale: 1.06, reach: 34, think: 0.78 },
    rider: { hp: 5, name: '骑手', spd: 96, dmg: 2, score: 'rider', scale: 1.0, reach: 36, think: 0.7 },
    boss: { hp: 24, name: '死刃', spd: 68, dmg: 3, score: 'boss', scale: 1.38, reach: 44, think: 0.48 }
  };

  var STAGES = [
    {
      name: '荒原', w: 2100, theme: 'waste',
      ents: [
        [340, 28, 'thief'], [500, 58, 'thief'], [680, 36, 'knight'],
        [900, 22, 'thief'], [1080, 50, 'knight'], [1280, 34, 'rider', 'chicken'],
        [1500, 62, 'thief'], [1680, 30, 'knight']
      ],
      drops: [[620, 40, 'meat'], [1180, 26, 'pot'], [1560, 48, 'gold']],
      boss: null
    },
    {
      name: '村寨', w: 2320, theme: 'village',
      ents: [
        [300, 24, 'thief'], [460, 56, 'knight'], [640, 32, 'thief'],
        [820, 44, 'rider', 'chicken'], [1040, 20, 'knight'], [1220, 60, 'thief'],
        [1400, 36, 'knight'], [1580, 52, 'rider', 'drake'], [1760, 28, 'thief'],
        [1940, 48, 'knight']
      ],
      drops: [[700, 38, 'pot'], [1120, 50, 'meat'], [1480, 22, 'gold'], [1880, 40, 'pot']],
      boss: null
    },
    {
      name: '王座', w: 2200, theme: 'castle',
      ents: [
        [280, 30, 'knight'], [460, 58, 'thief'], [640, 24, 'knight'],
        [840, 46, 'rider', 'drake'], [1040, 32, 'knight'], [1220, 62, 'thief'],
        [1400, 28, 'knight'], [1560, 50, 'knight']
      ],
      drops: [[520, 40, 'pot'], [960, 28, 'meat'], [1320, 54, 'pot']],
      boss: [1780, 40]
    }
  ];

  var ATK = {
    slash: { t: 0.22, h0: 0.04, h1: 0.13, dmg: 1, reach: 36, knock: 52, stun: 0.22, down: false, stop: 0.045, pose: 'slash' },
    sweep: { t: 0.26, h0: 0.05, h1: 0.16, dmg: 2, reach: 40, knock: 72, stun: 0.26, down: false, stop: 0.055, pose: 'sweep' },
    smash: { t: 0.36, h0: 0.10, h1: 0.22, dmg: 3, reach: 38, knock: 118, stun: 0.12, down: true, stop: 0.075, pose: 'smash' },
    air:   { t: 0.30, h0: 0.04, h1: 0.22, dmg: 2, reach: 34, knock: 86, stun: 0.14, down: true, stop: 0.06, pose: 'air' },
    ram:   { t: 0.28, h0: 0.06, h1: 0.18, dmg: 2, reach: 44, knock: 96, stun: 0.14, down: true, stop: 0.06, pose: 'ram' },
    flame: { t: 0.34, h0: 0.08, h1: 0.24, dmg: 3, reach: 58, knock: 70, stun: 0.2, down: false, stop: 0.055, pose: 'flame' }
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
  function axeChain(n) {
    if (n <= 1) return 'slash';
    if (n === 2) return 'sweep';
    return 'smash';
  }
  function mountName(k) {
    if (k === 'chicken') return '鸡腿兽';
    if (k === 'drake') return '火蜥';
    return '徒步';
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
  function jumpHeight() {
    return (JUMP_V * JUMP_V) / (2 * GRAV);
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (HP_MAX < 10) throw new Error('hp');
    if (MAGIC_MAX < 4 || MAGIC_START < 1) throw new Error('magic');
    if (MAGIC_COST !== 1) throw new Error('magic cost');
    if (MAGIC_DMG < 3) throw new Error('magic dmg');
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(3) !== 2) throw new Error('combo 3');
    if (comboMul(9) !== 5) throw new Error('combo 9');
    if (axeChain(1) !== 'slash' || axeChain(2) !== 'sweep' || axeChain(3) !== 'smash') throw new Error('axe chain');
    if (mountName('chicken') !== '鸡腿兽' || mountName(null) !== '徒步') throw new Error('mount name');
    if (kindHp('thief', 0) !== 3) throw new Error('thief hp');
    if (kindHp('boss', 1) <= kindHp('knight', 1)) throw new Error('boss hp');
    if (KINDS.thief.spd <= KINDS.knight.spd) throw new Error('thief faster');
    if (waveCount(1) < 2 || waveCount(20) > 8) throw new Error('wave cap');
    if (BEST_KEY !== 'playbox-axe-war-best') throw new Error('best key');
    if (ATK.smash.down !== true || ATK.slash.down !== false) throw new Error('knockdown');
    if (ATK.flame.reach <= ATK.ram.reach) throw new Error('flame longer');
    if (STAGES[2].boss == null || STAGES[0].boss) throw new Error('final boss');
    if (STAGES[0].w >= STAGES[1].w) throw new Error('wider later');
    if (jumpHeight() < 50) throw new Error('jump');
    if (!KINDS.thief || !KINDS.knight || !KINDS.boss) throw new Error('kinds');
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
  var btnQuest = document.getElementById('btn-quest');
  var btnArena = document.getElementById('btn-arena');
  var ovAgain = document.getElementById('ov-again');
  var ovMenu = document.getElementById('ov-menu');
  var modeQuest = document.getElementById('mode-quest');
  var modeArena = document.getElementById('mode-arena');
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
  var mountLabel = document.getElementById('mount-label');
  var hpBar = document.getElementById('hp-bar');
  var pipsEl = document.getElementById('pips');
  var mpipsEl = document.getElementById('mpips');
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
  var demo = { l: false, r: true, u: false, d: false, jump: false, axe: false };
  var pips = [];
  var mpips = [];
  var particles = [];
  var sparks = [];
  var rings = [];
  var floats = [];
  var trails = [];
  var bolts = [];

  var G = {
    mode: 'title',
    kind: 'quest',
    t: 0,
    clock: 0,
    stage: 1,
    wave: 1,
    camX: 0,
    camY: 0,
    levelW: 2100,
    theme: 'waste',
    ents: [],
    drops: [],
    beasts: [],
    player: null,
    lives: LIVES,
    hp: HP_MAX,
    magic: MAGIC_START,
    mount: null,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    chainN: 0,
    atk: null,
    atkT: 0,
    atkHit: false,
    atkBuf: 0,
    jumpBuf: 0,
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
    magicT: 0,
    magicCd: 0,
    waveT: 0,
    waveLeft: 0,
    spawnQ: []
  };

  function isArena() {
    return G.kind === 'arena';
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
  function onScreen(x) {
    return x > G.camX - 40 && x < G.camX + VW + 40;
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
      this.noise(0.05, 0.036, 1400);
      this.beep(420, 0.07, 'sawtooth', 0.04, 160);
    },
    axe: function (combo) {
      this.ensure();
      var lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.045, 0.042, 800);
      this.beep(240 * lift, 0.08, 'square', 0.052, 90);
      this.beep(620 * lift, 0.05, 'triangle', 0.03, 220);
    },
    smash: function () {
      this.ensure();
      this.noise(0.08, 0.055, 420);
      this.beep(140, 0.12, 'sawtooth', 0.055, 55);
      this.beep(380, 0.07, 'square', 0.035, 140);
    },
    ram: function () {
      this.ensure();
      this.noise(0.07, 0.05, 380);
      this.beep(160, 0.1, 'square', 0.05, 70);
    },
    flame: function () {
      this.ensure();
      this.noise(0.1, 0.05, 280);
      this.beep(220, 0.12, 'sawtooth', 0.048, 90);
      this.beep(540, 0.08, 'triangle', 0.03, 180);
    },
    magic: function () {
      this.ensure();
      this.beep(220, 0.08, 'sawtooth', 0.05, 880);
      this.beep(440, 0.14, 'square', 0.045, 1320);
      this.noise(0.18, 0.06, 240);
      this.beep(110, 0.22, 'sine', 0.05, 48);
    },
    empty: function () {
      this.ensure();
      this.beep(180, 0.08, 'square', 0.03, 90);
    },
    roar: function () {
      this.ensure();
      this.noise(0.16, 0.06, 180);
      this.beep(90, 0.22, 'sawtooth', 0.06, 42);
      this.beep(180, 0.14, 'square', 0.04, 70);
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
    steal: function () {
      this.ensure();
      this.beep(320, 0.08, 'square', 0.04, 160);
      this.noise(0.06, 0.03, 900);
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
  function syncMagic() {
    if (!mpipsEl) return;
    var n = MAGIC_MAX;
    var el, i;
    while (mpips.length < n) {
      el = document.createElement('span');
      el.className = 'mpip';
      mpipsEl.appendChild(el);
      mpips.push(el);
    }
    while (mpips.length > n) {
      el = mpips.pop();
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    for (i = 0; i < mpips.length; i++) {
      mpips[i].classList.toggle('on', i < G.magic);
      mpips[i].classList.toggle('gone', i >= G.magic && G.mode !== 'title');
    }
  }
  function syncModes() {
    var a = isArena();
    if (modeQuest) modeQuest.setAttribute('aria-pressed', a ? 'false' : 'true');
    if (modeArena) modeArena.setAttribute('aria-pressed', a ? 'true' : 'false');
  }
  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 3);
    if (stageLabel) {
      if (isArena()) stageLabel.textContent = '波 ' + G.wave;
      else stageLabel.textContent = (STAGES[G.stage - 1] || STAGES[0]).name;
      stageLabel.classList.toggle('hot', isArena() ? G.wave >= 5 : G.stage >= 3);
    }
    if (tagLabel) {
      tagLabel.textContent = isArena() ? '角斗' : '远征';
      tagLabel.classList.toggle('warn', isArena());
      tagLabel.classList.toggle('hot', !isArena() && G.stage >= 3);
    }
    if (mountLabel) {
      mountLabel.textContent = mountName(G.mount);
      mountLabel.classList.toggle('empty', !G.mount);
      mountLabel.classList.toggle('hot', G.mount === 'chicken');
      mountLabel.classList.toggle('drake', G.mount === 'drake');
    }
    if (hpBar) {
      var r = G.hp / HP_MAX;
      hpBar.style.transform = 'scaleX(' + clamp(r, 0, 1) + ')';
      hpBar.classList.toggle('low', r <= 0.34);
    }
    syncPips();
    syncMagic();
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'AXE';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' && !isArena() ? '角斗' : '换模式';
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
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'win-flash', 'magic');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    var tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'win-flash', 'magic');
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
      x: x, y: y, z: z, face: face, kind: kind || 'slash', t: 0, life: 0.16
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
  function makeEnt(x, z, kind, wave, mount) {
    var spec = KINDS[kind] || KINDS.thief;
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
      mount: mount || null,
      loot: null
    };
  }
  function makeDrop(x, z, kind) {
    return { x: x, z: z, kind: kind, bob: rand(0, TAU), dead: false, stolen: false };
  }
  function makeBeast(x, z, kind) {
    return {
      x: x, z: z, h: 0, vx: 0, vz: 0,
      kind: kind || 'chicken',
      face: 1,
      run: rand(0, 4),
      life: 9,
      dead: false,
      flee: false
    };
  }

  function clearFx() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    trails.length = 0;
    bolts.length = 0;
  }

  function loadStage(n, demoMode) {
    var spec = STAGES[clamp(n, 1, STAGES.length) - 1];
    var i, e;
    G.stage = n;
    G.theme = spec.theme;
    G.levelW = spec.w;
    G.ents = [];
    G.drops = [];
    G.beasts = [];
    G.camX = 0;
    G.camY = 0;
    G.player = makePlayer(72, 36);
    G.atk = null;
    G.atkT = 0;
    G.atkHit = false;
    G.atkBuf = 0;
    G.airAtk = false;
    G.deadT = 0;
    G.lock = 0;
    G.chainN = 0;
    G.magicT = 0;
    if (!demoMode) {
      for (i = 0; i < spec.ents.length; i++) {
        e = spec.ents[i];
        G.ents.push(makeEnt(e[0], e[1], e[2], 0, e[3] || null));
      }
      if (spec.boss) G.ents.push(makeEnt(spec.boss[0], spec.boss[1], 'boss', 0));
      for (i = 0; i < spec.drops.length; i++) {
        e = spec.drops[i];
        G.drops.push(makeDrop(e[0], e[1], e[2]));
      }
    } else {
      G.ents.push(makeEnt(420, 30, 'thief', 0));
      G.ents.push(makeEnt(640, 52, 'knight', 0));
      G.ents.push(makeEnt(860, 28, 'rider', 0, 'chicken'));
      G.drops.push(makeDrop(520, 40, 'meat'));
    }
  }

  function spawnWave(n) {
    var count = waveCount(n);
    var i, kind, side, x, z, mount;
    G.wave = n;
    G.waveLeft = count;
    G.waveT = 0.55;
    G.spawnQ = [];
    for (i = 0; i < count; i++) {
      mount = null;
      if (n >= 5 && n % 5 === 0 && i === 0) kind = 'boss';
      else if (n >= 3 && i % 3 === 0) {
        kind = 'rider';
        mount = i % 2 === 0 ? 'chicken' : 'drake';
      } else if (n >= 2 && i % 2 === 1) kind = 'knight';
      else kind = 'thief';
      side = i % 2 === 0 ? 1 : -1;
      x = G.player.x + side * rand(260, 400);
      z = rand(ZMIN + 8, ZMAX - 10);
      G.spawnQ.push({ t: 0.15 * i, kind: kind, x: x, z: z, mount: mount });
    }
    toast('第 ' + n + ' 波', false, n % 5 === 0);
    audio.wave();
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'arena' ? 'arena' : 'quest';
    G.mode = 'play';
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.magic = MAGIC_START;
    G.mount = null;
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
    G.invuln = 0.4;
    G.wave = 1;
    G.atk = null;
    G.atkT = 0;
    G.atkHit = false;
    G.atkBuf = 0;
    G.deadT = 0;
    G.chainN = 0;
    G.magicT = 0;
    G.magicCd = 0;
    clearFx();
    if (isArena()) {
      G.theme = 'arena';
      G.levelW = 960;
      G.ents = [];
      G.drops = [makeDrop(420, 40, 'meat'), makeDrop(620, 56, 'pot')];
      G.beasts = [];
      G.player = makePlayer(320, 40);
      G.camX = 0;
      G.stage = 1;
      spawnWave(1);
    } else {
      loadStage(1, false);
    }
    hideOverlay();
    audio.start();
    toast(isArena() ? '角斗' : STAGES[0].name, false, !isArena());
    setHint(isArena() ? '一波接一波 · 挥斧连击 · 抢坐骑' : '打到尽头 · 挥斧连击 · 王座有头目', '');
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'quest';
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.magic = MAGIC_START;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    G.mount = null;
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '战斧', '马上挥斧，清一波再打头目。魔法清屏，抢坐骑，摔下来会掉骑。');
    setHint('走跳挥斧 · C 魔法清屏 · 抢坐骑 · 血空丢命', '');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('quest');
    else startGame(G.kind || 'quest');
  }
  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('quest');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    kick(7, 'die');
    var why = G.why === 'life' ? '体力见底，倒在沙上。' : '被砍倒了。';
    showOverlay('lose', '倒了', why + ' 分数 ' + G.score + ' · 最高连击 ' + G.maxCombo);
    setHint('R 立刻重开', 'warn');
    syncHud();
  }
  function goWin() {
    G.mode = 'win';
    audio.win();
    kick(2, 'win-flash');
    screenFlash(GOLD, 0.5);
    var msg = isArena()
      ? '撑到第 ' + G.wave + ' 波。分数 ' + G.score
      : '砍翻死刃。分数 ' + G.score + ' · 最高连击 ' + G.maxCombo;
    showOverlay('win', isArena() ? '角斗不熄' : '王座拿下', msg);
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

  function knockOff(e) {
    if (!e.mount) return;
    var b = makeBeast(e.x - e.face * 20, e.z, e.mount);
    b.face = e.face;
    G.beasts.push(b);
    e.mount = null;
    if (e.kind === 'rider') {
      e.kind = 'knight';
      e.spd = KINDS.knight.spd;
      e.scale = KINDS.knight.scale;
      e.reach = KINDS.knight.reach;
    }
    popRing(b.x, feetY(b.z, 0), GOLD, 20);
    audio.roar();
    toast('摔下坐骑', false, true);
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
    if (e.mount && (down || e.hp <= 0)) {
      knockOff(e);
      if (e.hp <= 0) e.hp = 1;
      e.downT = 0.7;
      e.vh = 80;
      e.h = Math.max(e.h, 8);
      e.act = 'down';
    } else if (down || e.hp <= 0) {
      e.downT = e.hp <= 0 ? 0.55 : 0.72;
      e.stunT = 0;
      e.vh = 90;
      e.h = Math.max(e.h, 8);
      e.act = 'down';
    } else {
      e.stunT = stun;
    }
    bumpCombo();
    var ptsKey = (G.atk && SCORE[G.atk]) ? G.atk : (dmg >= 3 ? 'smash' : dmg >= 2 ? 'sweep' : 'slash');
    var pts = Math.round((SCORE[ptsKey] || 50) * G.mult);
    addScore(pts);
    popFloat(e.x, toY(e) - 34, '+' + pts, GOLD);
    popSpark(e.x + src.face * 10, toY(e) - 18, G.combo >= 5 ? GOLD : HOT, 14 + dmg * 3);
    emit(8 + dmg * 2, {
      x: e.x + src.face * 8, y: toY(e) - 16, j: 8,
      vx0: src.face * 40, vx1: src.face * 220, vy0: -180, vy1: 40,
      life: 0.32, r0: 1.2, r1: 3.2, rgb: G.combo >= 4 ? GOLD : HOT2, g: 380
    });
    if (e.hp <= 0 && e.deadT <= 0 && !e.mount) {
      e.deadT = 0.55;
      var base = SCORE[KINDS[e.kind] ? KINDS[e.kind].score : 'thief'] || 180;
      var bonus = Math.round(base * G.mult);
      addScore(bonus);
      popFloat(e.x, toY(e) - 50, KINDS[e.kind] ? KINDS[e.kind].name : 'KO', CYN);
      if (e.loot) {
        G.drops.push(makeDrop(e.x, e.z, e.loot));
        e.loot = null;
      } else if (hash2((e.x * 11) | 0) > 0.72) {
        G.drops.push(makeDrop(e.x, e.z, hash2((e.z * 7) | 0) > 0.5 ? 'gold' : 'meat'));
      }
      if (isArena()) G.waveLeft = Math.max(0, G.waveLeft - 1);
    }
    return true;
  }

  function dismount(hit) {
    var p = G.player;
    if (!G.mount) return false;
    var b = makeBeast(p.x - p.face * 22, p.z, G.mount);
    b.flee = true;
    b.face = -p.face;
    b.vx = -p.face * 160;
    b.life = 1.6;
    G.beasts.push(b);
    G.mount = null;
    toast('摔下来了', true, false);
    audio.roar();
    kick(3.4, 'thump');
    popRing(p.x, toY(p), GOLD, 18);
    syncHud();
    if (hit) {
      G.invuln = Math.max(G.invuln, 0.55);
      p.hurtT = 0.18;
      p.act = 'hurt';
    }
    return true;
  }

  function hurtPlayer(dmg, from) {
    if (!playing() || G.invuln > 0 || G.deadT > 0) return;
    var p = G.player;
    if (G.mount) {
      dismount(true);
      return;
    }
    G.hp -= dmg;
    if (G.hp < 0) G.hp = 0;
    G.invuln = INVULN;
    p.hurtT = 0.22;
    p.act = 'hurt';
    p.vx = (from && from.x < p.x ? 1 : -1) * 140;
    G.atk = null;
    G.atkT = 0;
    dropCombo();
    audio.hurt();
    kick(4.2, 'hit');
    screenFlash(MAG, 0.32);
    emit(10, {
      x: p.x, y: toY(p) - 16, j: 10,
      vx0: -160, vx1: 160, vy0: -160, vy1: 20,
      life: 0.28, r0: 1.4, r1: 3, rgb: MAG, g: 360
    });
    syncHud();
    if (G.hp <= 0) loseLife();
  }

  function loseLife() {
    G.lives -= 1;
    G.deadT = DIE_T;
    G.hp = 0;
    G.mount = null;
    G.player.act = 'down';
    G.player.vh = 60;
    G.why = 'life';
    audio.death();
    kick(6.5, 'die');
    syncPips();
    syncHud();
    toast(G.lives > 0 ? '再来' : '倒了', true, false);
  }

  function respawn() {
    var p = G.player;
    G.hp = HP_MAX;
    G.deadT = 0;
    G.invuln = 1.35;
    G.atk = null;
    G.atkT = 0;
    G.mount = null;
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
    if (p.hurtT > 0 || G.deadT > 0 || G.magicT > 0) return;
    G.atk = name;
    G.atkT = spec.t;
    G.atkHit = false;
    p.act = spec.pose;
    magnetZ(p, spec.reach);
    swingTrail(p.x, toY(p) - 18, p.z, p.face, name);
    if (name === 'ram') {
      audio.ram();
      emit(8, {
        x: p.x + p.face * 22, y: toY(p) - 10, j: 10,
        vx0: p.face * 40, vx1: p.face * 240, vy0: -40, vy1: 40,
        life: 0.22, r0: 1.2, r1: 2.8, rgb: BRN, g: 260
      });
    } else if (name === 'flame') {
      audio.flame();
      emit(12, {
        x: p.x + p.face * 28, y: toY(p) - 14, j: 14,
        vx0: p.face * 80, vx1: p.face * 320, vy0: -80, vy1: 40,
        life: 0.28, r0: 1.2, r1: 3.2, rgb: HOT, g: 220
      });
    } else if (name === 'smash' || name === 'air') {
      audio.whoosh();
    } else {
      audio.whoosh();
    }
  }

  function doAxe() {
    var p = G.player;
    if (!playing() && G.mode !== 'title') return;
    if (G.deadT > 0 || p.hurtT > 0 || G.magicT > 0) return;
    if (!p.grounded) {
      if (G.airAtk) return;
      G.airAtk = true;
      beginAtk('air');
      return;
    }
    if (G.atk) { G.atkBuf = 'axe'; return; }
    if (G.mount === 'drake') {
      beginAtk('flame');
      return;
    }
    if (G.mount === 'chicken') {
      beginAtk('ram');
      return;
    }
    if (G.comboT <= 0) G.chainN = 0;
    G.chainN += 1;
    beginAtk(axeChain(G.chainN));
    if (G.chainN >= 3) G.chainN = 0;
  }

  function doMagic() {
    var p, i, e, hit, dmg;
    if (!playing() && G.mode !== 'title') return;
    if (G.mode === 'title') return;
    if (G.deadT > 0 || G.magicT > 0 || G.magicCd > 0) return;
    if (G.magic < MAGIC_COST) {
      toast('魔法空了', true, false);
      audio.empty();
      return;
    }
    G.magic -= MAGIC_COST;
    G.magicT = MAGIC_T;
    G.magicCd = 0.7;
    G.atk = null;
    G.atkT = 0;
    p = G.player;
    p.act = 'magic';
    audio.magic();
    hitStop(0.08);
    kick(6.2, 'magic');
    screenFlash(HOT, 0.72);
    popRing(p.x, toY(p) - 10, CYN, 36);
    for (i = 0; i < 7; i++) {
      bolts.push({
        x: G.camX + 40 + i * 86 + rand(-12, 12),
        y: GY - 140,
        t: 0,
        life: 0.42 + i * 0.02,
        face: i % 2 === 0 ? 1 : -1
      });
    }
    emit(28, {
      x: p.x, y: toY(p) - 20, j: 80,
      vx0: -220, vx1: 220, vy0: -280, vy1: 40,
      life: 0.5, r0: 1.6, r1: 4.2, rgb: HOT, g: 240
    });
    emit(16, {
      x: p.x, y: toY(p) - 8, j: 60,
      vx0: -160, vx1: 160, vy0: -200, vy1: 20,
      life: 0.4, r0: 1.2, r1: 3, rgb: GOLD, g: 200
    });
    hit = 0;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead || e.deadT > 0) continue;
      if (!onScreen(e.x)) continue;
      dmg = e.kind === 'boss' ? Math.max(2, MAGIC_DMG - 2) : MAGIC_DMG;
      if (hitEnemy(e, dmg, 90, 0.2, true, { face: e.x >= p.x ? 1 : -1, x: p.x })) {
        hit += 1;
        addScore(Math.round(SCORE.magic * G.mult));
      }
    }
    toast(hit ? '魔法 · 清场' : '魔法', false, true);
    syncHud();
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
      if (G.atk === 'smash' || G.atk === 'air') audio.smash();
      else if (G.atk === 'ram') audio.ram();
      else if (G.atk === 'flame') audio.flame();
      else audio.axe(G.combo);
    }
  }

  function tryMount() {
    var p = G.player;
    var i, b;
    if (G.mount || !p.grounded || G.deadT > 0 || p.hurtT > 0) return;
    for (i = 0; i < G.beasts.length; i++) {
      b = G.beasts[i];
      if (b.dead || b.flee) continue;
      if (Math.abs(b.x - p.x) < 20 && Math.abs(b.z - p.z) < 16) {
        G.mount = b.kind;
        b.dead = true;
        audio.roar();
        toast('骑上了' + mountName(G.mount), false, true);
        kick(2.6, 'thump');
        screenFlash(GOLD, 0.28);
        popRing(p.x, toY(p), GOLD, 22);
        emit(12, {
          x: p.x, y: toY(p) - 8, j: 14,
          vx0: -80, vx1: 80, vy0: -120, vy1: 20,
          life: 0.3, r0: 1.4, r1: 3.2, rgb: GOLD, g: 260
        });
        syncHud();
        return;
      }
    }
  }

  function pickupDrops() {
    var p = G.player;
    var i, d;
    if (!p.grounded) return;
    for (i = 0; i < G.drops.length; i++) {
      d = G.drops[i];
      if (d.dead) continue;
      if (Math.abs(d.x - p.x) < 16 && Math.abs(d.z - p.z) < 14) {
        d.dead = true;
        audio.pickup();
        if (d.kind === 'meat') {
          G.hp = Math.min(HP_MAX, G.hp + HP_MEAT);
          toast('烤肉 +体力', false, true);
        } else if (d.kind === 'pot') {
          G.magic = Math.min(MAGIC_MAX, G.magic + 1);
          toast('魔法壶', false, true);
        } else {
          addScore(SCORE.gold);
          toast('金币', false, true);
        }
        addScore(SCORE.pickup);
        popRing(d.x, feetY(d.z, 0), d.kind === 'pot' ? CYN : GOLD, 16);
        syncHud();
      }
    }
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    var hp = G.hp;
    var mag = G.magic;
    var mnt = G.mount;
    loadStage(G.stage + 1, false);
    G.hp = hp;
    G.magic = mag;
    G.mount = mnt;
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
    if (e && Math.abs(e.x - p.x) < 52 && Math.abs(e.z - p.z) < 18) {
      if (((G.clock * 4) | 0) % 3 === 0) doAxe();
    }
    if (p.x > 980) {
      G.player = makePlayer(72, 36);
      G.camX = 0;
      G.mount = null;
      G.ents = [
        makeEnt(420, 30, 'thief', 0),
        makeEnt(640, 52, 'knight', 0),
        makeEnt(860, 28, 'rider', 0, 'chicken')
      ];
    }
  }

  function updatePlayer(dt) {
    var p = G.player;
    var ax, az, spd, canJump, mul, bossAlive, bi, be;
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
    if (G.magicT > 0) {
      G.magicT -= dt;
      p.act = 'magic';
      p.vx = 0;
      return;
    }
    if (p.hurtT > 0) {
      p.hurtT -= dt;
      p.x += p.vx * dt;
      p.vx *= Math.pow(0.08, dt);
      p.x = clamp(p.x, 18, G.levelW - 18);
      return;
    }

    ax = 0;
    az = 0;
    if (inL()) ax -= 1;
    if (inR()) ax += 1;
    if (inU()) az += 1;
    if (inD()) az -= 1;
    if (ax) p.face = ax > 0 ? 1 : -1;
    mul = G.mount ? 1.28 : 1;
    spd = WALK * mul * (p.grounded ? 1 : AIR);
    if (G.atk) spd *= 0.28;
    p.vx = ax * spd;
    p.vz = az * WALK_Z * mul * (p.grounded ? 1 : 0.7);
    p.x += p.vx * dt;
    p.z += p.vz * dt;
    p.x = clamp(p.x, 18, G.levelW - 18);
    p.z = clamp(p.z, ZMIN, ZMAX);

    if (!isArena() && G.stage === 3) {
      bossAlive = false;
      for (bi = 0; bi < G.ents.length; bi++) {
        be = G.ents[bi];
        if (be.kind === 'boss' && !be.dead && be.deadT <= 0) bossAlive = true;
      }
      if (bossAlive && p.x > G.levelW - 170) {
        p.x = G.levelW - 170;
        if (playing() && G.toastT <= 0) toast('先打倒死刃', true, false);
      }
    }

    if (inJump()) G.jumpBuf = 0.12;
    else G.jumpBuf -= dt;
    if (G.jumpBuf < 0) G.jumpBuf = 0;

    canJump = p.grounded || p.coyote > 0;
    if (G.jumpBuf > 0 && canJump && !G.atk) {
      p.vh = JUMP_V * (G.mount ? 1.08 : 1);
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

    tryMount();
    pickupDrops();

    if (!isArena() && G.stage === 3) {
      bossAlive = false;
      for (bi = 0; bi < G.ents.length; bi++) {
        be = G.ents[bi];
        if (be.kind === 'boss' && !be.dead && be.deadT <= 0) bossAlive = true;
      }
      if (!bossAlive && p.x > G.levelW - 70) {
        addScore(Math.round(SCORE.stage * 3 * G.mult));
        goWin();
      }
    } else if (!isArena() && G.stage < 3 && p.x > G.levelW - 70) {
      nextStage();
    }
  }

  function updateAtk(dt) {
    if (!G.atk) {
      var buf = G.atkBuf;
      G.atkBuf = 0;
      if (buf === 'axe') doAxe();
      return;
    }
    G.atkT -= dt;
    resolveHits();
    if (G.atkT <= 0) {
      G.atk = null;
      G.atkHit = false;
    }
  }

  function nearestDrop(x, z, lim) {
    var best = null, bd = lim * lim, i, d, dist;
    for (i = 0; i < G.drops.length; i++) {
      d = G.drops[i];
      if (d.dead) continue;
      dist = (d.x - x) * (d.x - x) + (d.z - z) * (d.z - z) * 2;
      if (dist < bd) { bd = dist; best = d; }
    }
    return best;
  }

  function updateEnt(e, dt) {
    var p = G.player;
    var spec = KINDS[e.kind] || KINDS.thief;
    var dx, dz, dist, want, speed, loot;
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
      e.act = 'down';
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
    speed = spec.spd * (isArena() ? 1 + Math.min(0.55, (G.wave - 1) * 0.05) : 1);
    if (e.mount) speed *= 1.18;

    if (e.kind === 'thief') {
      loot = nearestDrop(e.x, e.z, 90);
      if (loot && !e.loot) {
        e.face = loot.x >= e.x ? 1 : -1;
        e.act = 'walk';
        e.x += Math.sign(loot.x - e.x) * speed * 1.15 * dt;
        e.z += clamp(loot.z - e.z, -1, 1) * speed * 0.7 * dt;
        e.z = clamp(e.z, ZMIN, ZMAX);
        e.run += dt * 12;
        if (Math.abs(loot.x - e.x) < 12 && Math.abs(loot.z - e.z) < 12) {
          loot.dead = true;
          e.loot = loot.kind;
          audio.steal();
          toast('被偷了', true, false);
          popFloat(e.x, toY(e) - 28, '偷', MAG);
        }
        return;
      }
      if (e.loot && dist < 70) {
        e.act = 'walk';
        e.x += -Math.sign(dx || 1) * speed * 1.2 * dt;
        e.run += dt * 12;
        e.x = clamp(e.x, 18, G.levelW - 18);
        return;
      }
    }

    want = 'chase';
    if (e.kind === 'thief' && dist < 80 && dist > 40) want = 'flank';
    if (e.kind === 'knight' && dist > 90 && dist < 170 && e.cd <= 0) want = 'charge';
    if (e.mount && dist < 50 && e.cd <= 0) want = 'attack';
    if (e.kind === 'boss' && dist < 56 && e.cd <= 0) want = 'attack';

    if (want === 'charge') {
      e.act = 'charge';
      e.vx = e.face * speed * 2.1;
      e.x += e.vx * dt;
      e.z += clamp(dz, -1, 1) * 40 * dt;
      e.run += dt * 14;
      if (dist < 34 && zOk(e, p)) {
        e.atkT = 0.32;
        e.atkHit = false;
        e.act = 'slash';
        e.cd = 1.05;
        audio.whoosh();
      }
      return;
    }

    if (dist > 30 || !zOk(e, p)) {
      e.act = 'walk';
      e.x += Math.sign(dx) * speed * dt;
      e.z += clamp(dz, -1, 1) * spec.spd * 0.7 * dt;
      e.z = clamp(e.z, ZMIN, ZMAX);
      e.run += dt * 8;
      return;
    }

    if (e.cd <= 0) {
      e.atkT = e.kind === 'boss' ? 0.38 : 0.3;
      e.atkHit = false;
      e.act = e.mount ? 'ram' : (e.kind === 'boss' && Math.random() < 0.45 ? 'smash' : 'slash');
      e.cd = spec.think + rand(0, 0.35);
      audio.whoosh();
      swingTrail(e.x, toY(e) - 16, e.z, e.face, e.act);
    } else {
      e.act = 'idle';
      e.run += dt * 3;
    }
  }

  function updateBeasts(dt) {
    var i, b;
    for (i = 0; i < G.beasts.length; i++) {
      b = G.beasts[i];
      if (b.dead) continue;
      b.run += dt * 8;
      b.life -= dt;
      if (b.flee) {
        b.x += (b.face || 1) * 180 * dt;
        if (b.life <= 0 || b.x < -40 || b.x > G.levelW + 40) b.dead = true;
      } else {
        b.x += Math.sin(b.run * 0.4) * 18 * dt;
        if (b.life <= 0) {
          b.flee = true;
          b.life = 1.4;
          b.face = b.x > G.player.x ? 1 : -1;
        }
      }
      b.z = clamp(b.z, ZMIN, ZMAX);
    }
  }

  function updateCam(dt) {
    var p = G.player;
    var target = p.x - VW * 0.38 + p.face * 36;
    if (isArena()) target = p.x - VW * 0.42;
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
    for (i = bolts.length - 1; i >= 0; i--) {
      bolts[i].t += dt;
      if (bolts[i].t > bolts[i].life) bolts.splice(i, 1);
    }
  }

  function updateWaves(dt) {
    var i, s, e;
    if (!isArena() || !playing()) return;
    G.waveT -= dt;
    for (i = G.spawnQ.length - 1; i >= 0; i--) {
      s = G.spawnQ[i];
      s.t -= dt;
      if (s.t <= 0) {
        e = makeEnt(clamp(s.x, 40, G.levelW - 40), s.z, s.kind, G.wave, s.mount || null);
        G.ents.push(e);
        popRing(e.x, feetY(e.z, 0), HOT, 18);
        G.spawnQ.splice(i, 1);
      }
    }
    if (G.spawnQ.length === 0 && G.waveLeft <= 0 && G.waveT <= 0) {
      addScore(Math.round(SCORE.wave * G.wave * G.mult));
      if (G.wave % 3 === 0) {
        G.drops.push(makeDrop(G.player.x + 60, G.player.z, G.wave % 6 === 0 ? 'pot' : 'meat'));
      }
      spawnWave(G.wave + 1);
    }
  }

  function update(dt) {
    var i;
    G.t += dt;
    if (G.toastT > 0) G.toastT -= dt;
    if (G.magicCd > 0) G.magicCd -= dt;
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
      updateBeasts(dt);
      for (i = 0; i < G.drops.length; i++) G.drops[i].bob += dt * 4;
      updateCam(dt);
      updateWaves(dt);
    }
    updateFx(dt);
    if (G.drops.length > 24) G.drops = G.drops.filter(function (d) { return !d.dead; });
    if (G.ents.length > 40) G.ents = G.ents.filter(function (e) { return !e.dead; });
    if (G.beasts.length > 12) G.beasts = G.beasts.filter(function (b) { return !b.dead; });
  }

  function palOf(kind) {
    if (kind === 'thief') {
      return { skin: [214, 168, 118], hair: [28, 18, 16], shirt: [36, 110, 52], pants: [28, 48, 32], boot: [24, 18, 14], hairS: 'mohawk', accent: LEAF };
    }
    if (kind === 'knight' || kind === 'rider') {
      return { skin: [210, 164, 118], hair: [40, 28, 24], shirt: [168, 176, 188], pants: [48, 28, 28], boot: [28, 22, 20], hairS: 'helm', accent: HOT };
    }
    if (kind === 'boss') {
      return { skin: [176, 122, 84], hair: [16, 12, 12], shirt: [42, 28, 28], pants: [22, 16, 16], boot: [14, 12, 12], hairS: 'horn', accent: HOT2 };
    }
    return { skin: SKIN, hair: [255, 214, 96], shirt: [156, 92, 40], pants: [36, 64, 140], boot: [32, 24, 20], hairS: 'hero', accent: HOT };
  }

  function drawSky() {
    var g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (G.theme === 'village') {
      g.addColorStop(0, '#24140c');
      g.addColorStop(0.5, '#1a0e08');
      g.addColorStop(1, '#2a1408');
    } else if (G.theme === 'castle' || G.theme === 'arena') {
      g.addColorStop(0, '#140810');
      g.addColorStop(0.5, '#10060c');
      g.addColorStop(1, '#1c0a0a');
    } else {
      g.addColorStop(0, '#2a1808');
      g.addColorStop(0.45, '#1c1006');
      g.addColorStop(1, '#3a1c08');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
    ctx.fillStyle = rgba(GOLD, 0.18 + Math.sin(G.clock * 0.6) * 0.04);
    ctx.beginPath();
    ctx.arc(ox + (VW - 70) * scale, oy + 48 * scale, 22 * scale, 0, TAU);
    ctx.fill();
  }

  function drawBackdrop() {
    var x0 = ((G.camX * 0.32) | 0);
    var i, hsh, bx, bw, bh, by, k;
    for (i = -1; i < 12; i++) {
      hsh = hash2((i + (x0 / 88 | 0)) * 17 + (G.theme === 'castle' ? 5 : G.theme === 'village' ? 2 : 0));
      bx = ox + ((i * 88) - (G.camX * 0.32 % 88)) * scale;
      bw = (64 + hsh * 42) * scale;
      bh = (70 + hsh * 90) * scale;
      by = oy + (GY - 80 - hsh * 36) * scale - bh;
      if (G.theme === 'castle' || G.theme === 'arena') {
        ctx.fillStyle = '#1a1014';
        ctx.fillRect(bx, by, bw, bh + 80 * scale);
        ctx.fillStyle = rgba(HOT, 0.12);
        ctx.fillRect(bx, by, bw, 4 * scale);
        for (k = 0; k < 5; k++) {
          if (hash2(i * 31 + k) > 0.5) {
            ctx.fillStyle = rgba(GOLD, 0.22);
            ctx.fillRect(bx + 10 * scale, by + (14 + k * 16) * scale, 7 * scale, 8 * scale);
          }
        }
      } else if (G.theme === 'village') {
        ctx.fillStyle = '#24140c';
        ctx.fillRect(bx + 8 * scale, by + 20 * scale, bw * 0.7, bh);
        ctx.fillStyle = rgba(HOT, 0.45);
        ctx.beginPath();
        ctx.moveTo(bx + 4 * scale, by + 22 * scale);
        ctx.lineTo(bx + 8 * scale + bw * 0.35, by);
        ctx.lineTo(bx + 12 * scale + bw * 0.7, by + 22 * scale);
        ctx.fill();
      } else {
        ctx.fillStyle = rgba(BRN, 0.28 + hsh * 0.12);
        ctx.beginPath();
        ctx.moveTo(bx, oy + (GY - 40) * scale);
        ctx.lineTo(bx + bw * 0.5, by + 30 * scale);
        ctx.lineTo(bx + bw, oy + (GY - 40) * scale);
        ctx.fill();
      }
    }
  }

  function drawGround() {
    var y = sy(GY);
    var g = ctx.createLinearGradient(0, y - 40 * scale, 0, oy + VH * scale);
    if (G.theme === 'castle' || G.theme === 'arena') {
      g.addColorStop(0, '#3a221c');
      g.addColorStop(0.4, '#20120e');
      g.addColorStop(1, '#100808');
    } else {
      g.addColorStop(0, '#4a2c14');
      g.addColorStop(0.4, '#2a180c');
      g.addColorStop(1, '#140a06');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, y - 8 * scale, VW * scale, oy + VH * scale - (y - 8 * scale));
    ctx.fillStyle = rgba(HOT, 0.38);
    ctx.fillRect(ox, y - 10 * scale, VW * scale, 2.2 * scale);
    ctx.fillStyle = rgba(GOLD, 0.16);
    ctx.fillRect(ox, y - 8 * scale, VW * scale, 1.2 * scale);
    var i, px, dash;
    ctx.strokeStyle = rgba(WHT, 0.06);
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
      ctx.fillStyle = rgba(GOLD, 0.1);
      ctx.fillRect(px, y - 4 * scale, 16 * scale, 2 * scale);
    }
  }

  function drawProps() {
    var i, hsh, px, pz, kind, x, y, s;
    s = scale;
    for (i = 0; i < 26; i++) {
      hsh = hash2(i * 47 + (G.theme === 'castle' ? 4 : G.theme === 'village' ? 2 : 0));
      px = 70 + i * 82 + hsh * 36;
      if (px < G.camX - 40 || px > G.camX + VW + 40) continue;
      pz = 8 + hsh * 10;
      x = sx(px);
      y = sy(feetY(pz, 0));
      kind = (hsh * 5) | 0;
      if (kind === 0) {
        ctx.fillStyle = '#2a1810';
        ctx.fillRect(x - 9 * s, y - 14 * s, 18 * s, 14 * s);
        ctx.fillStyle = rgba(HOT, 0.4);
        ctx.fillRect(x - 9 * s, y - 14 * s, 18 * s, 2 * s);
      } else if (kind === 1) {
        ctx.fillStyle = rgba(BRN, 0.7);
        ctx.beginPath();
        ctx.moveTo(x, y - 22 * s);
        ctx.lineTo(x + 6 * s, y);
        ctx.lineTo(x - 6 * s, y);
        ctx.fill();
      } else if (kind === 2 && G.theme === 'castle') {
        ctx.fillStyle = '#3a2a28';
        ctx.fillRect(x - 4 * s, y - 28 * s, 8 * s, 28 * s);
        ctx.fillStyle = rgba(HOT, 0.35);
        ctx.fillRect(x - 4 * s, y - 28 * s, 8 * s, 3 * s);
      } else {
        ctx.fillStyle = rgba(GOLD, 0.12);
        ctx.beginPath();
        ctx.ellipse(x, y - 2 * s, 10 * s, 3 * s, 0, 0, TAU);
        ctx.fill();
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

  function drawAxe(sc, bob, act, punch) {
    var ang = act === 'smash' ? -1.15 : act === 'sweep' ? -0.35 : act === 'slash' ? -0.85 : act === 'air' ? 0.9 : -0.55;
    ctx.save();
    ctx.translate(6 * sc + punch, (act === 'smash' ? -30 : -18) * sc + bob);
    ctx.rotate(ang);
    ctx.fillStyle = rgba(BRN, 1);
    ctx.fillRect(0, -1.6 * sc, 18 * sc, 3.2 * sc);
    ctx.fillStyle = rgba(STEEL, 1);
    ctx.beginPath();
    ctx.moveTo(16 * sc, -7 * sc);
    ctx.lineTo(26 * sc, 0);
    ctx.lineTo(16 * sc, 7 * sc);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.7);
    ctx.fillRect(14 * sc, -2 * sc, 3 * sc, 4 * sc);
    ctx.restore();
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
    var sit = (kind === 'hero' && G.mount) || (e.mount) ? 14 * sc : 0;
    ctx.save();
    ctx.translate(x, y - sit);
    ctx.scale(face, sq);
    if (act === 'down') {
      ctx.rotate(-0.5);
      ctx.translate(0, 8 * sc);
    }
    var leg = (act === 'walk' || act === 'charge') ? Math.sin(e.run || 0) * 5 * sc : (act === 'jump' || act === 'air' ? -4 * sc : 0);
    ctx.strokeStyle = rgba(pal.pants, 0.95);
    ctx.lineWidth = 3.1 * sc;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3.2 * sc, -9 * sc);
    ctx.lineTo(-4 * sc - leg, 0);
    ctx.moveTo(3.2 * sc, -9 * sc);
    ctx.lineTo(4 * sc + leg, 0);
    ctx.stroke();
    ctx.fillStyle = rgba(pal.boot, 1);
    ctx.fillRect(-6 * sc - leg, -1.5 * sc, 5 * sc, 3 * sc);
    ctx.fillRect(2 * sc + leg, -1.5 * sc, 5 * sc, 3 * sc);

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

    var punch = (act === 'slash' || act === 'sweep' || act === 'smash' || act === 'air' || act === 'ram') ? 14 * sc : 0;
    var armY = act === 'smash' ? -30 * sc : act === 'magic' ? -32 * sc : -18 * sc;
    ctx.strokeStyle = rgba(pal.skin, 0.95);
    ctx.lineWidth = 2.4 * sc;
    ctx.beginPath();
    ctx.moveTo(-5 * sc, -20 * sc + bob);
    ctx.lineTo(-10 * sc, -12 * sc + bob);
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

    if (kind === 'hero' || act === 'slash' || act === 'sweep' || act === 'smash' || act === 'air') {
      drawAxe(sc, bob, act, punch);
    } else if (kind === 'knight' || kind === 'rider' || kind === 'boss') {
      ctx.save();
      ctx.translate(6 * sc + punch, armY + bob);
      ctx.rotate(act === 'smash' ? -1.0 : -0.6);
      ctx.fillStyle = rgba(STEEL, 1);
      ctx.fillRect(0, -1.4 * sc, (kind === 'boss' ? 22 : 16) * sc, 2.8 * sc);
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.fillRect((kind === 'boss' ? 16 : 12) * sc, -3.2 * sc, 6 * sc, 6.4 * sc);
      ctx.restore();
    } else if (kind === 'thief') {
      ctx.strokeStyle = rgba(STEEL, 0.9);
      ctx.lineWidth = 1.4 * sc;
      ctx.beginPath();
      ctx.moveTo(6 * sc + punch, armY + bob);
      ctx.lineTo(18 * sc + punch, armY - 4 * sc + bob);
      ctx.stroke();
    }

    if (act === 'flame') {
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.beginPath();
      ctx.moveTo(10 * sc, -18 * sc + bob);
      ctx.lineTo(48 * sc, -22 * sc + bob);
      ctx.lineTo(46 * sc, -8 * sc + bob);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.beginPath();
      ctx.moveTo(12 * sc, -16 * sc + bob);
      ctx.lineTo(40 * sc, -18 * sc + bob);
      ctx.lineTo(38 * sc, -10 * sc + bob);
      ctx.fill();
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
    } else if (pal.hairS === 'helm') {
      ctx.fillStyle = rgba(STEEL, 1);
      ctx.beginPath();
      ctx.ellipse(0, -30 * sc + bob, 6 * sc, 4.4 * sc, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.85);
      ctx.fillRect(-1 * sc, -36 * sc + bob, 2 * sc, 6 * sc);
    } else if (pal.hairS === 'horn') {
      ctx.fillStyle = rgba([40, 28, 28], 1);
      ctx.beginPath();
      ctx.ellipse(0, -30 * sc + bob, 6.2 * sc, 4.6 * sc, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(STEEL, 1);
      ctx.beginPath();
      ctx.moveTo(-4 * sc, -34 * sc + bob);
      ctx.lineTo(-8 * sc, -44 * sc + bob);
      ctx.lineTo(-1 * sc, -34 * sc + bob);
      ctx.moveTo(4 * sc, -34 * sc + bob);
      ctx.lineTo(8 * sc, -44 * sc + bob);
      ctx.lineTo(1 * sc, -34 * sc + bob);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(0.4 * sc, -31.5 * sc + bob, 5.6 * sc, 3.6 * sc, 0.15, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#1a1010';
    ctx.fillRect(1.6 * sc, -30 * sc + bob, 1.5 * sc, 1.5 * sc);

    if (act === 'magic') {
      ctx.strokeStyle = rgba(CYN, 0.8);
      ctx.lineWidth = 1.6 * sc;
      ctx.beginPath();
      ctx.arc(0, -18 * sc, 16 * sc + Math.sin(G.clock * 18) * 3 * sc, 0, TAU);
      ctx.stroke();
    }

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
      ctx.fillRect(x - bw / 2, sy(toY(e) - 46 * (e.scale || 1) - (sit ? 14 : 0)), bw, 3.2 * scale);
      ctx.fillStyle = rgba(e.hp / e.max < 0.34 ? MAG : LEAF, 0.9);
      ctx.fillRect(x - bw / 2, sy(toY(e) - 46 * (e.scale || 1) - (sit ? 14 : 0)), bw * (e.hp / e.max), 3.2 * scale);
    }
  }

  function drawBeast(b, rider) {
    var sc = scale * (b.kind === 'drake' ? 1.08 : 1);
    var x = sx(b.x);
    var y = sy(feetY(b.z, b.h || 0));
    var bob = Math.sin((b.run || G.clock * 6)) * 2 * sc;
    var face = b.face || 1;
    var body = b.kind === 'drake' ? [48, 140, 72] : [176, 110, 48];
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(face, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 2 * sc, 16 * sc, 5 * sc, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(body, 0.95);
    ctx.lineWidth = 4.2 * sc;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6 * sc, -6 * sc + bob);
    ctx.lineTo(-8 * sc, 2 * sc);
    ctx.moveTo(6 * sc, -6 * sc + bob);
    ctx.lineTo(8 * sc, 2 * sc);
    ctx.stroke();
    ctx.fillStyle = rgba(body, 1);
    ctx.beginPath();
    ctx.ellipse(0, -12 * sc + bob, b.kind === 'drake' ? 16 * sc : 13 * sc, 9 * sc, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(b.kind === 'drake' ? [36, 90, 48] : [140, 84, 36], 1);
    ctx.beginPath();
    ctx.ellipse(12 * sc, -16 * sc + bob, 6 * sc, 5 * sc, 0.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.beginPath();
    ctx.moveTo(16 * sc, -16 * sc + bob);
    ctx.lineTo(22 * sc, -14 * sc + bob);
    ctx.lineTo(16 * sc, -12 * sc + bob);
    ctx.fill();
    ctx.fillStyle = '#1a1010';
    ctx.fillRect(13 * sc, -18 * sc + bob, 1.6 * sc, 1.6 * sc);
    if (b.kind === 'drake') {
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.fillRect(-16 * sc, -14 * sc + bob, 6 * sc, 3 * sc);
    }
    ctx.restore();
    if (rider) drawFighter(rider, rider.kind === 'rider' ? 'knight' : rider.kind, false);
  }

  function drawDrop(d) {
    if (d.dead) return;
    var x = sx(d.x);
    var y = sy(feetY(d.z, 0) - 8 - Math.sin(d.bob) * 3);
    ctx.save();
    ctx.translate(x, y);
    if (d.kind === 'meat') {
      ctx.fillStyle = rgba(HOT, 1);
      ctx.beginPath();
      ctx.ellipse(0, 0, 7 * scale, 5 * scale, 0.3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(BRN, 1);
      ctx.fillRect(-1 * scale, -8 * scale, 2 * scale, 8 * scale);
    } else if (d.kind === 'pot') {
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -9 * scale);
      ctx.lineTo(5 * scale, -2 * scale);
      ctx.lineTo(3.4 * scale, 6 * scale);
      ctx.lineTo(-3.4 * scale, 6 * scale);
      ctx.lineTo(-5 * scale, -2 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.5);
      ctx.fillRect(-1.4 * scale, -4 * scale, 1.6 * scale, 4 * scale);
    } else {
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.beginPath();
      ctx.arc(0, 0, 6 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(BRN, 0.8);
      ctx.font = 'bold ' + (7 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', 0, 2.5 * scale);
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(sx(d.x), sy(feetY(d.z, 0)), 8 * scale, 3 * scale, 0, 0, TAU);
    ctx.fill();
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
      ctx.strokeStyle = o.kind === 'flame' ? rgba(HOT, 1) : o.kind === 'ram' ? rgba(BRN, 1) : rgba(STEEL, 1);
      ctx.lineWidth = (o.kind === 'flame' ? 3.6 : 3.2) * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + o.face * 6 * s, y - 4 * s);
      ctx.quadraticCurveTo(
        x + o.face * (20 + a * 10) * s, y - (o.kind === 'smash' ? 34 : 18) * s,
        x + o.face * (o.kind === 'flame' ? 56 : 36) * s, y + (o.kind === 'smash' ? 8 : -4) * s
      );
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawBolts() {
    var i, o, a, x0, y0, x1, k;
    for (i = 0; i < bolts.length; i++) {
      o = bolts[i];
      a = 1 - o.t / o.life;
      x0 = sx(o.x);
      y0 = sy(o.y);
      x1 = sx(o.x + o.face * 8);
      ctx.save();
      ctx.globalAlpha = 0.75 * a;
      ctx.strokeStyle = rgba(HOT, 1);
      ctx.lineWidth = 3.2 * scale;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      for (k = 1; k < 6; k++) {
        ctx.lineTo(x0 + (k % 2 === 0 ? 8 : -8) * scale, y0 + k * 22 * scale);
      }
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
      ctx.fillStyle = rgba(CYN, 0.45 * a);
      ctx.beginPath();
      ctx.arc(x1, sy(GY - 20), 10 * scale * a, 0, TAU);
      ctx.fill();
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
    if (isArena()) return;
    var gx, x, y, bossAlive, i;
    if (G.stage < 3) {
      gx = G.levelW - 36;
      x = sx(gx);
      y = sy(GY - 80);
      ctx.fillStyle = rgba(HOT, 0.18);
      ctx.fillRect(x, y, 10 * scale, 90 * scale);
      ctx.fillStyle = rgba(GOLD, 0.45);
      ctx.fillRect(x, y, 10 * scale, 3 * scale);
    } else {
      bossAlive = false;
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
    var list, i, e, blink, dummy;
    dpr = dpr || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0c0602';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    if (!REDUCE && G.shake > 0) {
      ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake * 0.7);
    }
    if (!REDUCE && G.punch !== 1) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-W * 0.5, -H * 0.5);
    }
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();

    drawSky();
    drawBackdrop();
    drawGround();
    drawProps();
    drawGate();
    drawTrails();
    drawBolts();

    list = [];
    for (i = 0; i < G.drops.length; i++) {
      if (!G.drops[i].dead) list.push({ z: G.drops[i].z - 1, kind: 'drop', o: G.drops[i] });
    }
    for (i = 0; i < G.beasts.length; i++) {
      if (!G.beasts[i].dead) list.push({ z: G.beasts[i].z, kind: 'beast', o: G.beasts[i] });
    }
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      list.push({ z: e.z, kind: 'ent', o: e });
    }
    if (G.player) list.push({ z: G.player.z, kind: 'hero', o: G.player });
    list.sort(function (a, b) { return b.z - a.z; });

    for (i = 0; i < list.length; i++) {
      e = list[i];
      if (e.kind === 'drop') {
        drawDrop(e.o);
      } else if (e.kind === 'beast') {
        drawBeast(e.o, null);
      } else if (e.kind === 'ent') {
        if (e.o.mount) {
          dummy = { x: e.o.x, z: e.o.z, h: 0, kind: e.o.mount, face: e.o.face, run: e.o.run };
          drawBeast(dummy, e.o);
        } else {
          drawShadow(e.o, e.o.scale || 1);
          drawFighter(e.o, e.o.kind, false);
        }
      } else {
        blink = playing() && G.invuln > 0 && G.deadT <= 0;
        if (G.mount) {
          dummy = { x: e.o.x, z: e.o.z, h: e.o.h, kind: G.mount, face: e.o.face, run: e.o.run };
          drawBeast(dummy, null);
          drawFighter(e.o, 'hero', blink);
        } else {
          drawShadow(e.o, 1);
          drawFighter(e.o, 'hero', blink);
        }
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
    var axe = k === 'z' || k === 'Z' || k === 'j' || k === 'J';
    var mag = k === 'c' || k === 'C';
    var jump = space;

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (jump) keys.jump = down;

    if (down && (isMove || space || axe || mag || k === 'Enter')) e.preventDefault();
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
      startGame('quest');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('arena');
      return;
    }
    if (overlayOpen()) {
      if (space || k === 'Enter' || axe) primaryAction();
      return;
    }
    if (axe) {
      if (playing() || G.mode === 'title') doAxe();
      return;
    }
    if (mag) {
      if (playing()) doMagic();
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
    hold(document.getElementById('btn-axe'), function () {
      if (overlayOpen()) { primaryAction(); return; }
      if (playing()) doAxe();
    }, null);
    hold(document.getElementById('btn-magic'), function () {
      if (overlayOpen()) return;
      if (playing()) doMagic();
    }, null);
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen()) return;
      if (playing()) doAxe();
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

  if (btnQuest) {
    btnQuest.addEventListener('click', function () {
      audio.ensure();
      startGame('quest');
    });
  }
  if (btnArena) {
    btnArena.addEventListener('click', function () {
      audio.ensure();
      startGame('arena');
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
      if (G.mode === 'win' && !isArena()) startGame('arena');
      else goTitle();
    });
  }
  if (modeQuest) {
    modeQuest.addEventListener('click', function () {
      audio.ensure();
      startGame('quest');
    });
  }
  if (modeArena) {
    modeArena.addEventListener('click', function () {
      audio.ensure();
      startGame('arena');
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
    if (!hidden) last = 0;
  });
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = keys.jump = false;
  });

  requestAnimationFrame(frame);
})();
