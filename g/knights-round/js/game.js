'use strict';

/* 圆桌 — Knights of the Round arcade lite. Mounted / on-foot side-scroll brawler. No CDN. Distinct from 神龟. */

(function () {
  var VW = 640;
  var VH = 360;
  var GY = 318;
  var LIVES = 3;
  var LIFE_CAP = 6;
  var LIFE_EVERY = 20000;
  var HP_MAX = 16;
  var HORSE_MAX = 8;
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
  var WALK = 176;
  var GALLOP = 248;
  var BEST_KEY = 'playbox-knights-round-best';
  var MUTE_KEY = 'playbox-knights-round-mute';
  var OPS = '方向 / WASD 走 · 上跳 · 空格挥剑 · R 重开 · M 静音';

  var MAG = [255, 61, 184];
  var CYN = [0, 240, 255];
  var GOLD = [255, 227, 107];
  var HOT = [255, 180, 0];
  var HOT2 = [255, 210, 74];
  var WHT = [246, 240, 228];
  var SKIN = [232, 192, 144];
  var CREAM = [240, 228, 208];
  var BRN = [122, 74, 42];
  var DBRN = [58, 36, 22];
  var STEEL = [168, 176, 188];
  var RED = [200, 48, 42];
  var BLK = [22, 16, 14];
  var PINE = [36, 58, 32];
  var STONE = [72, 62, 52];

  var WEPS = {
    short: { id: 'short', name: '短剑', reach: 32, dmg: 1, t: 0.20, h0: 0.04, h1: 0.13, knock: 64, stop: 0.042 },
    knight: { id: 'knight', name: '骑士剑', reach: 44, dmg: 2, t: 0.22, h0: 0.05, h1: 0.14, knock: 86, stop: 0.052 },
    holy: { id: 'holy', name: '圣剑', reach: 58, dmg: 3, t: 0.24, h0: 0.05, h1: 0.16, knock: 110, stop: 0.068 }
  };
  var WEP_ORDER = ['short', 'knight', 'holy'];

  var KINDS = {
    bandit: { hp: 3, horse: 0, name: '匪徒', spd: 92, dmg: 2, score: 160, reach: 24, w: 16, h: 28, scale: 1, coat: BRN, mane: DBRN, armor: [90, 58, 36], helm: DBRN },
    rider: { hp: 3, horse: 3, name: '骑匪', spd: 150, dmg: 2, score: 240, reach: 30, w: 18, h: 28, scale: 1, coat: [92, 62, 38], mane: [40, 24, 16], armor: [96, 62, 40], helm: DBRN },
    knight: { hp: 5, horse: 0, name: '骑士', spd: 78, dmg: 2, score: 240, reach: 32, w: 18, h: 30, scale: 1.06, coat: [70, 70, 78], mane: BLK, armor: STEEL, helm: STEEL },
    mountk: { hp: 5, horse: 4, name: '铁骑', spd: 138, dmg: 3, score: 320, reach: 34, w: 20, h: 30, scale: 1.08, coat: [48, 42, 46], mane: BLK, armor: [120, 128, 140], helm: STEEL },
    black: { hp: 14, horse: 8, name: '黑骑', spd: 124, dmg: 3, score: 3200, reach: 36, w: 22, h: 34, scale: 1.22, coat: [18, 16, 16], mane: RED, armor: [28, 24, 26], helm: [18, 16, 18] },
    ironk: { hp: 26, horse: 0, name: '铁甲', spd: 70, dmg: 3, score: 4000, reach: 38, w: 24, h: 40, scale: 1.34, coat: STEEL, mane: BLK, armor: [96, 100, 110], helm: [80, 84, 92] },
    lion: { hp: 20, horse: 10, name: '金狮', spd: 108, dmg: 4, score: 6000, reach: 42, w: 26, h: 42, scale: 1.48, coat: [210, 180, 96], mane: [180, 80, 28], armor: GOLD, helm: HOT }
  };

  var SCORE = {
    hit: 40, knock: 80, med: 120, barrel: 80, sword: 80, horse: 80, stage: 1500, wave: 600
  };

  var STAGES = [
    {
      name: '村道', w: 2320, theme: 'village',
      ents: [
        [340, 'bandit'], [500, 'bandit'], [680, 'rider'], [860, 'bandit'],
        [1040, 'rider'], [1220, 'bandit'], [1400, 'knight'], [1580, 'bandit'], [1760, 'rider']
      ],
      barrels: [420, 900, 1480],
      meds: [720, 1280],
      swords: [1080],
      horses: [640],
      boss: ['black', 2040]
    },
    {
      name: '林道', w: 2480, theme: 'forest',
      ents: [
        [300, 'bandit'], [460, 'rider'], [620, 'knight'], [800, 'mountk'],
        [980, 'bandit'], [1160, 'rider'], [1340, 'knight'], [1520, 'mountk'],
        [1700, 'knight'], [1880, 'rider']
      ],
      barrels: [400, 1000, 1600],
      meds: [800, 1500],
      swords: [1180],
      horses: [560],
      boss: ['ironk', 2200]
    },
    {
      name: '王城', w: 2200, theme: 'castle',
      ents: [
        [280, 'knight'], [420, 'mountk'], [580, 'rider'], [740, 'knight'],
        [920, 'mountk'], [1100, 'knight'], [1280, 'mountk'], [1460, 'knight'], [1620, 'mountk']
      ],
      barrels: [500, 1180],
      meds: [680, 1380],
      swords: [980],
      horses: [360],
      boss: ['lion', 1920]
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
  function kindHorse(kind, wave) {
    var base = KINDS[kind] ? KINDS[kind].horse : 0;
    if (!base) return 0;
    if (!wave) return base;
    return Math.max(2, Math.round(base * (1 + Math.max(0, wave - 1) * 0.06)));
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
    return k === 'black' || k === 'ironk' || k === 'lion';
  }
  function startsMounted(k) {
    return !!(KINDS[k] && KINDS[k].horse > 0);
  }
  function jumpH() {
    return (JUMP_V * JUMP_V) / (2 * GRAV);
  }
  function wepName(id) {
    return WEPS[id] ? WEPS[id].name : '短剑';
  }
  function wepRank(id) {
    var i = WEP_ORDER.indexOf(id);
    return i < 0 ? 0 : i;
  }
  function nextWep(id) {
    var i = wepRank(id);
    return WEP_ORDER[Math.min(WEP_ORDER.length - 1, i + 1)];
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (HP_MAX < 12) throw new Error('hp');
    if (HORSE_MAX < 6) throw new Error('horse');
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(3) !== 2) throw new Error('combo 3');
    if (comboMul(9) !== 5) throw new Error('combo 9');
    if (BEST_KEY !== 'playbox-knights-round-best') throw new Error('best key');
    if (WEPS.short.reach >= WEPS.knight.reach) throw new Error('short reach');
    if (WEPS.knight.reach >= WEPS.holy.reach) throw new Error('holy reach');
    if (WEPS.holy.dmg < 3) throw new Error('holy dmg');
    if (kindHp('bandit', 0) !== 3) throw new Error('bandit hp');
    if (kindHorse('rider', 0) !== 3) throw new Error('rider horse');
    if (kindHorse('bandit', 0) !== 0) throw new Error('bandit foot');
    if (kindHp('lion', 1) <= kindHp('bandit', 1)) throw new Error('boss hp');
    if (waveCount(1) < 4 || waveCount(20) > 14) throw new Error('wave cap');
    if (jumpH() < 50) throw new Error('jump');
    if (!STAGES[0].boss || STAGES[0].boss[0] !== 'black') throw new Error('black');
    if (!STAGES[1].boss || STAGES[1].boss[0] !== 'ironk') throw new Error('ironk');
    if (!STAGES[2].boss || STAGES[2].boss[0] !== 'lion') throw new Error('lion');
    if (STAGES[0].w >= STAGES[1].w) throw new Error('wider later');
    if (KINDS.rider.score !== 240) throw new Error('rider score');
    var i, s, hasRide;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ents.length) throw new Error('ents');
      if (s.w < 1800) throw new Error('short stage');
      if (!s.barrels.length) throw new Error('barrels');
      hasRide = s.ents.some(function (e) { return startsMounted(e[1]); });
      if (!hasRide && i === 0) throw new Error('need rider');
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
  var btnMelee = document.getElementById('btn-melee');
  var ovAgain = document.getElementById('ov-again');
  var ovMenu = document.getElementById('ov-menu');
  var modeQuest = document.getElementById('mode-quest');
  var modeMelee = document.getElementById('mode-melee');
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
  var horseWrap = document.getElementById('horse-wrap');
  var horseBar = document.getElementById('horse-bar');
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
  var hooves = [];

  var G = {
    mode: 'title',
    kind: 'quest',
    t: 0,
    clock: 0,
    stage: 1,
    wave: 1,
    camX: 0,
    camY: 0,
    levelW: 2320,
    theme: 'village',
    ents: [],
    barrels: [],
    drops: [],
    player: null,
    lives: LIVES,
    hp: HP_MAX,
    horse: HORSE_MAX,
    mounted: true,
    wep: 'short',
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

  function isMelee() {
    return G.kind === 'melee';
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

  function slashSpec() {
    var w = WEPS[G.wep] || WEPS.short;
    var chain = Math.min(3, Math.max(1, G.chainN));
    var extra = chain >= 3 ? 8 : 0;
    var mount = G.mounted ? 10 : 0;
    return {
      reach: w.reach + extra + mount,
      dmg: w.dmg + (chain >= 3 ? 1 : 0),
      t: w.t + (G.atkAir ? 0.02 : 0),
      h0: w.h0,
      h1: w.h1,
      knock: w.knock + (G.mounted ? 36 : 0) + (chain >= 3 ? 48 : 0),
      stop: w.stop + (chain >= 3 ? 0.016 : 0) + (G.mounted ? 0.008 : 0),
      down: chain >= 3 || G.atkAir
    };
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
      this.noise(0.04, 0.03, 1800);
      this.beep(420, 0.06, 'sawtooth', 0.036, 150);
    },
    slashHit: function (combo, down, wep) {
      this.ensure();
      var lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.04, 0.042, wep === 'holy' ? 1400 : 1100);
      this.beep((down ? 180 : 280) * lift, 0.07, 'square', 0.05, 90);
      if (wep === 'holy') this.beep(880 * lift, 0.08, 'triangle', 0.032, 1320);
      else if (wep === 'knight') this.beep(620 * lift, 0.05, 'triangle', 0.026, 220);
      else this.beep(540 * lift, 0.045, 'triangle', 0.022, 200);
    },
    knockOff: function () {
      this.ensure();
      this.noise(0.1, 0.055, 280);
      this.beep(160, 0.14, 'sawtooth', 0.05, 60);
      this.beep(420, 0.16, 'square', 0.03, 180);
    },
    mount: function () {
      this.ensure();
      this.beep(180, 0.06, 'square', 0.04, 90);
      this.beep(240, 0.08, 'triangle', 0.03, 120);
    },
    hoof: function () {
      this.ensure();
      this.noise(0.03, 0.02, 400);
      this.beep(90, 0.04, 'triangle', 0.018, 50);
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
    barrel: function () {
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
    var w = isMelee();
    if (modeQuest) modeQuest.setAttribute('aria-pressed', w ? 'false' : 'true');
    if (modeMelee) modeMelee.setAttribute('aria-pressed', w ? 'true' : 'false');
  }
  function syncWep() {
    if (!wepLabel) return;
    wepLabel.textContent = wepName(G.wep);
    wepLabel.className = 'wep ' + (G.wep || 'short');
  }
  function syncHorse() {
    if (!horseWrap) return;
    horseWrap.hidden = !G.mounted;
    if (horseBar) {
      horseBar.style.transform = 'scaleX(' + clamp(G.horse / HORSE_MAX, 0, 1) + ')';
      horseBar.classList.toggle('low', G.mounted && G.horse / HORSE_MAX <= 0.34);
    }
  }
  function syncBoss() {
    var b = findBoss();
    if (!bossWrap) return;
    if (!b || G.mode === 'title') {
      bossWrap.hidden = true;
      return;
    }
    bossWrap.hidden = false;
    if (bossName) bossName.textContent = KINDS[b.kind] ? KINDS[b.kind].name : '头目';
    if (bossBar) {
      var max = b.max + (b.horseMax || 0);
      var cur = Math.max(0, b.hp) + (b.mounted ? Math.max(0, b.horseHp) : 0);
      bossBar.style.transform = 'scaleX(' + clamp(cur / Math.max(1, max), 0, 1) + ')';
    }
  }
  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 3);
    if (stageLabel) {
      if (isMelee()) stageLabel.textContent = '潮 ' + G.wave;
      else stageLabel.textContent = (STAGES[G.stage - 1] || STAGES[0]).name;
      stageLabel.classList.toggle('hot', isMelee() ? G.wave >= 5 : G.stage >= 3);
    }
    if (tagLabel) {
      tagLabel.textContent = isMelee() ? '乱战' : '征途';
      tagLabel.classList.toggle('warn', isMelee());
      tagLabel.classList.toggle('hot', !isMelee() && G.stage >= 3);
    }
    if (hpBar) {
      var r = G.hp / HP_MAX;
      hpBar.style.transform = 'scaleX(' + clamp(r, 0, 1) + ')';
      hpBar.classList.toggle('low', r <= 0.34);
    }
    syncWep();
    syncHorse();
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'TABLE';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' && !isMelee() ? '乱战' : '换模式';
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
  function swingTrail(x, y, face, reach) {
    trails.push({ x: x, y: y, face: face, t: 0, life: 0.16, reach: reach || 32 });
    capArr(trails, 18);
  }
  function fleeHorse(x, face, coat) {
    hooves.push({ x: x, y: GY, vx: face * 220, t: 0, life: 0.7, coat: coat || CREAM, run: 0 });
    capArr(hooves, 8);
  }

  function makePlayer(x) {
    return {
      x: x, y: GY, vx: 0, vy: 0, face: 1,
      grounded: true, coyote: 0, run: 0, squash: 1,
      act: 'idle', scale: 1
    };
  }
  function makeEnt(x, kind, wave) {
    var spec = KINDS[kind] || KINDS.bandit;
    var horse = kindHorse(kind, wave);
    return {
      x: x, y: GY, vx: 0, vy: 0,
      face: x > (G.player ? G.player.x : 200) ? -1 : 1,
      kind: kind,
      hp: kindHp(kind, wave),
      max: kindHp(kind, wave),
      horseHp: horse,
      horseMax: horse,
      mounted: horse > 0,
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
      summonT: rand(1.8, 3.4),
      remountT: 0
    };
  }
  function makeBarrel(x) {
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
    hooves.length = 0;
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
    G.barrels = [];
    G.drops = [];
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
      for (i = 0; i < spec.barrels.length; i++) G.barrels.push(makeBarrel(spec.barrels[i]));
      for (i = 0; i < spec.meds.length; i++) G.drops.push(makeDrop(spec.meds[i], 'med'));
      for (i = 0; i < spec.swords.length; i++) G.drops.push(makeDrop(spec.swords[i], 'sword'));
      for (i = 0; i < spec.horses.length; i++) G.drops.push(makeDrop(spec.horses[i], 'horse'));
    } else {
      G.ents.push(makeEnt(420, 'bandit', 0));
      G.ents.push(makeEnt(640, 'rider', 0));
      G.ents.push(makeEnt(920, 'knight', 0));
      G.barrels.push(makeBarrel(300));
      G.drops.push(makeDrop(520, 'sword'));
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
      if (n >= 12 && n % 12 === 0 && i === 0) kind = 'lion';
      else if (n >= 8 && n % 8 === 0 && i === 0) kind = 'ironk';
      else if (n >= 4 && n % 4 === 0 && i === 0) kind = 'black';
      else if (n >= 2 && i % 4 === 2) kind = 'mountk';
      else if (n >= 2 && i % 3 === 1) kind = 'rider';
      else if (i % 5 === 3) kind = 'knight';
      else kind = 'bandit';
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
    G.kind = kind === 'melee' ? 'melee' : 'quest';
    G.mode = 'play';
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.horse = HORSE_MAX;
    G.mounted = true;
    G.wep = 'short';
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
    if (isMelee()) {
      G.theme = 'village';
      G.levelW = 2000;
      G.ents = [];
      G.barrels = [makeBarrel(360), makeBarrel(900), makeBarrel(1500)];
      G.drops = [makeDrop(640, 'med'), makeDrop(1180, 'sword'), makeDrop(420, 'horse')];
      G.player = makePlayer(280);
      G.camX = 0;
      G.stage = 1;
      spawnWave(1);
    } else {
      loadStage(1, false);
    }
    hideOverlay();
    audio.start();
    toast(isMelee() ? '乱战' : STAGES[0].name, false, !isMelee());
    setHint(isMelee() ? '一潮接一潮 · 骑手更密 · 连击清场' : '往右砍 · 先打下马 · 捡剑升级 · 打到金狮', '');
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'quest';
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.horse = HORSE_MAX;
    G.mounted = true;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.wep = 'short';
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.invuln = 0;
    G.deadT = 0;
    G.why = '';
    clearFx();
    loadStage(1, true);
    G.mounted = true;
    G.horse = HORSE_MAX;
    showOverlay('title', '圆桌', '往右骑马挥剑。先把骑手打下马，再下马近身。匪徒、骑士、头目。捡剑升级，体力打空扣一命。');
    setHint('往右骑马砍 · 先打下马再近身 · 捡剑升级 · 上键跳', '');
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
    var why = G.why === 'life' ? '体力见底，倒在征途上。' : '被打下马再也起不来。';
    showOverlay('lose', '倒了', why + ' 分数 ' + G.score + ' · 最高连击 ' + G.maxCombo);
    setHint('R 立刻重开', 'warn');
    syncHud();
  }
  function goWin() {
    G.mode = 'win';
    audio.win();
    kick(2, 'win-flash');
    screenFlash(GOLD, 0.5);
    showOverlay('win', '圆桌聚', '村道到王城，圣剑入鞘。分数 ' + G.score + ' · 最高连击 ' + G.maxCombo);
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
    G.mounted = false;
    G.horse = 0;
    if (p) {
      p.y = GY;
      p.vy = 0;
      p.act = 'idle';
      p.squash = 1.2;
    }
    dropCombo();
    syncHud();
  }

  function dismountPlayer(fromX) {
    var p = G.player;
    if (!G.mounted) return;
    G.mounted = false;
    G.horse = 0;
    fleeHorse((p ? p.x : 0) - 20, fromX > (p ? p.x : 0) ? -1 : 1, CREAM);
    toast('落马', true, false);
    audio.knockOff();
    kick(5, 'boom');
    screenFlash(MAG, 0.28);
    if (p) {
      p.vy = -180;
      p.grounded = false;
      p.act = 'hurt';
    }
    syncHorse();
  }

  function mountPlayer() {
    if (G.mounted) {
      G.horse = HORSE_MAX;
      audio.mount();
      toast('换骑', false, true);
      syncHorse();
      return;
    }
    G.mounted = true;
    G.horse = HORSE_MAX;
    audio.mount();
    toast('上马', false, true);
    popRing(G.player ? G.player.x : 0, GY - 20, CREAM, 20);
    syncHorse();
  }

  function hurtPlayer(dmg, fromX, knock, why) {
    if (G.invuln > 0 || G.deadT > 0 || G.mode === 'title') return;
    var p = G.player;
    if (G.mounted) {
      G.horse -= Math.max(1, dmg);
      G.hurtT = 0.22;
      G.invuln = 0.55;
      if (p) {
        p.vx = (p.x < fromX ? -1 : 1) * (knock || 120) * 0.7;
        p.act = 'hurt';
      }
      audio.hurt();
      kick(3.2, 'hit');
      emit(8, {
        x: p.x, y: p.y - 22, j: 8,
        vx0: -80, vx1: 80, vy0: -180, vy1: -20,
        r0: 1.2, r1: 3, life: 0.32, rgb: CREAM
      });
      if (G.horse <= 0) {
        G.invuln = 0.85;
        dismountPlayer(fromX);
      }
      syncHorse();
      return;
    }
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

  function grabSword() {
    var next = nextWep(G.wep);
    if (next === G.wep) {
      audio.pickup();
      toast(wepName(G.wep) + ' 已满', false, true);
      addScore(SCORE.sword);
      syncWep();
      return;
    }
    G.wep = next;
    audio.pickup();
    toast(wepName(G.wep), false, next === 'holy');
    addScore(SCORE.sword);
    syncWep();
  }

  function spawnDrop(x, kind) {
    G.drops.push(makeDrop(x, kind));
  }

  function knockOffEnt(e, face) {
    var spec = KINDS[e.kind] || KINDS.bandit;
    e.mounted = false;
    e.horseHp = 0;
    e.stunT = 0.55;
    e.vy = -240;
    e.vx = face * 160;
    e.act = 'hurt';
    e.spd = Math.max(70, spec.spd * 0.62);
    fleeHorse(e.x - face * 18, -face, spec.coat);
    audio.knockOff();
    hitStop(0.07);
    kick(4.8, 'boom');
    popRing(e.x, e.y - 18, GOLD, 28);
    bumpCombo();
    var pts = Math.round(SCORE.knock * G.mult);
    addScore(pts);
    popFloat(e.x, e.y - 40, '落马 +' + pts, GOLD);
    emit(16, {
      x: e.x, y: e.y - 18, j: 12,
      vx0: -200, vx1: 200, vy0: -280, vy1: -20,
      r0: 1.6, r1: 4.2, life: 0.5, rgb: spec.coat
    });
    if (Math.random() < 0.38) spawnDrop(e.x, 'horse');
    if (e.kind === 'black' || e.kind === 'lion') e.remountT = 5.2;
    syncBoss();
  }

  function killEnt(e, face) {
    e.dead = true;
    e.deadT = 0.55;
    e.vy = -220;
    e.vx = (face || 1) * 120;
    if (e.mounted) {
      e.mounted = false;
      fleeHorse(e.x, -face, (KINDS[e.kind] || KINDS.bandit).coat);
    }
    popRing(e.x, e.y - 16, HOT, 26);
    var ks = Math.round((KINDS[e.kind] ? KINDS[e.kind].score : 160) * G.mult);
    addScore(ks);
    popFloat(e.x, e.y - 36, '+' + ks, isBoss(e.kind) ? GOLD : HOT);
    if ((e.kind === 'knight' || e.kind === 'mountk') && Math.random() < 0.22) spawnDrop(e.x, 'sword');
    if (isBoss(e.kind)) {
      spawnDrop(e.x, 'med');
      spawnDrop(e.x + 18, 'sword');
      screenFlash(GOLD, 0.45);
      kick(6, 'boom');
      toast((KINDS[e.kind] ? KINDS[e.kind].name : '头目') + '倒了', false, true);
      audio.boss();
    }
  }

  function damageEnt(e, dmg, face, knock, stop, down, rgb) {
    if (e.dead || e.hurtT > 0.1) return false;
    var hx = e.x;
    var hy = e.y - (e.h * 0.45) - (e.mounted ? 16 : 0);
    if (e.mounted) {
      e.horseHp -= dmg;
      e.hurtT = 0.12;
      e.stunT = down ? 0.28 : 0.12;
      e.flash = 0.12;
      e.face = -face;
      e.vx = face * knock * 0.55;
      bumpCombo();
      hitStop(stop);
      kick(down ? 3.8 : 2.4, down ? 'boom' : 'hit');
      audio.slashHit(G.combo, down, G.wep);
      emit(down ? 12 : 8, {
        x: hx, y: hy, j: 10,
        vx0: face * 40, vx1: face * 220, vy0: -240, vy1: -20,
        r0: 1.5, r1: 3.8, life: 0.42, rgb: rgb || GOLD
      });
      popSpark(hx, hy, rgb || GOLD, down ? 22 : 14);
      var pts = Math.round(SCORE.hit * G.mult * (down ? 1.4 : 1));
      addScore(pts);
      popFloat(hx, hy - 10, '+' + pts, GOLD);
      if (e.horseHp <= 0) knockOffEnt(e, face);
      syncBoss();
      return true;
    }
    e.hp -= dmg;
    e.hurtT = 0.14;
    e.stunT = down ? 0.42 : 0.2;
    e.flash = 0.12;
    e.face = -face;
    e.vx = face * knock;
    if (down || knock > 80) e.vy = -160;
    e.act = 'hurt';
    bumpCombo();
    hitStop(stop);
    kick(down ? 4.4 : 2.6, down ? 'boom' : 'hit');
    audio.slashHit(G.combo, down, G.wep);
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
    var pts2 = Math.round(SCORE.hit * G.mult * (down ? 1.4 : 1));
    addScore(pts2);
    popFloat(hx, hy - 10, '+' + pts2, GOLD);
    if (e.hp <= 0) killEnt(e, face);
    syncBoss();
    return true;
  }

  function hitEntMelee(e, spec, p) {
    if (e.dead || e.hurtT > 0.12) return false;
    var dx = (e.x - p.x) * p.face;
    var reach = spec.reach + 10;
    var ph = G.mounted ? 28 : 14;
    var eh = e.mounted ? e.h * 0.5 + 16 : e.h * 0.5;
    if (dx < 8 || dx > reach) return false;
    if (Math.abs((p.y - ph) - (e.y - eh)) > 32 + (G.atkAir ? 18 : 0) + (G.mounted || e.mounted ? 12 : 0)) return false;
    return damageEnt(e, spec.dmg, p.face, spec.knock, spec.stop, spec.down, G.wep === 'holy' ? GOLD : HOT);
  }

  function smashBarrel(c, face) {
    var r;
    c.dead = true;
    c.deadT = 0.4;
    bumpCombo();
    audio.barrel();
    hitStop(0.04);
    kick(2.2, 'thump');
    emit(12, {
      x: c.x, y: GY - 14, j: 8,
      vx0: -160, vx1: 160, vy0: -280, vy1: -40,
      r0: 1.6, r1: 4, life: 0.45, rgb: BRN
    });
    addScore(Math.round(SCORE.barrel * G.mult));
    r = hash2((c.x * 17) | 0);
    if (r > 0.62) spawnDrop(c.x, 'sword');
    else if (r > 0.38) spawnDrop(c.x, 'horse');
    else if (r > 0.16) spawnDrop(c.x, 'med');
    if (face) c.deadT = 0.4;
  }

  function hitBarrels(spec, p) {
    var i, c, dx;
    for (i = 0; i < G.barrels.length; i++) {
      c = G.barrels[i];
      if (c.dead) continue;
      dx = (c.x - p.x) * p.face;
      if (dx < 4 || dx > spec.reach + 8) continue;
      if (Math.abs(p.y - GY) > 42) continue;
      smashBarrel(c, p.face);
      G.atkHit = true;
    }
  }

  function tryHit() {
    var p = G.player;
    if (!p || G.atkHit) return;
    var spec = slashSpec();
    var i, e, any = false;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (hitEntMelee(e, spec, p)) any = true;
    }
    hitBarrels(spec, p);
    if (any) G.atkHit = true;
  }

  function doSlash() {
    if (G.deadT > 0) return;
    if (G.mode !== 'play' && G.mode !== 'title') return;
    if (G.atkT > 0) {
      var spec = slashSpec();
      if (G.atkT < spec.t * 0.5) G.atkBuf = 1;
      return;
    }
    startSlash();
  }
  function startSlash() {
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
    var spec = slashSpec();
    G.atkT = spec.t;
    G.atkHit = false;
    G.atkBuf = 0;
    p.act = G.atkAir ? 'air' : 'atk';
    audio.whoosh();
    swingTrail(p.x, p.y - (G.mounted ? 28 : 18), p.face, spec.reach);
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
      return;
    }
    dx = e.x - p.x;
    if (e.mounted && Math.abs(dx) < 90 && p.grounded && Math.random() > 0.7) demo.jump = true;
    if (Math.abs(dx) > 30) {
      if (dx > 0) demo.r = true;
      else demo.l = true;
    } else if (G.atkT <= 0) {
      doSlash();
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

    if (G.atkT > 0) {
      spec = slashSpec();
      G.atkT -= dt;
      if (!G.atkHit && G.atkT <= spec.t - spec.h0 && G.atkT >= spec.t - spec.h1) tryHit();
      if (G.atkT <= 0) {
        G.atkT = 0;
        if (G.atkBuf > 0 && p.grounded) {
          G.atkBuf = 0;
          startSlash();
        } else {
          p.act = 'idle';
          if (p.grounded) G.airAtk = false;
        }
      }
    }

    busy = G.atkT > 0 && G.atkT > slashSpec().t * 0.28 && p.grounded && G.hurtT <= 0;
    ax = 0;
    if (!busy) {
      if (inL()) ax -= 1;
      if (inR()) ax += 1;
    }
    if (ax) p.face = ax;
    spd = (G.mounted ? GALLOP : WALK) * (p.grounded ? 1 : AIR);
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
        if (G.mounted) audio.hoof();
      }
      p.vy = 0;
      p.grounded = true;
      G.atkAir = false;
      if (p.act === 'air') p.act = 'idle';
    } else {
      p.grounded = false;
    }

    if (ax && p.grounded && G.atkT <= 0) {
      p.run += dt * (G.mounted ? 14 : 10);
      p.act = 'run';
    } else if (G.atkT <= 0 && p.act !== 'hurt' && p.grounded) {
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
    var dx, want, spd;
    if (!p) return;
    dx = p.x - e.x;
    want = (Math.abs(dx) > (distKeep || 28)) ? (dx > 0 ? 1 : -1) : 0;
    e.face = dx > 0 ? 1 : -1;
    spd = e.mounted ? e.spd : e.spd * (startsMounted(e.kind) ? 0.62 : 1);
    e.vx = want * spd;
    e.x += e.vx * dt;
    e.act = want ? 'run' : 'idle';
    e.run += dt * (e.mounted ? 12 : 8);
  }

  function meleeHitPlayer(e) {
    var p = G.player;
    var reach;
    if (!p || e.atkHit) return;
    reach = (e.mounted ? 28 : 18) + (e.reach ? e.reach * 0.15 : 0);
    if (Math.abs(e.x + e.face * 16 - p.x) < reach && Math.abs(e.y - p.y) < (e.mounted || G.mounted ? 36 : 28)) {
      e.atkHit = true;
      hurtPlayer(e.dmg, e.x, e.mounted ? 180 : 150, e.kind);
    }
  }

  function updateBandit(e, dt) {
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

  function updateRider(e, dt) {
    var p = G.player;
    var adx;
    if (!p) return;
    if (!e.mounted) {
      updateBandit(e, dt);
      return;
    }
    adx = Math.abs(p.x - e.x);
    if (e.act === 'charge') {
      e.atkT -= dt;
      e.x += e.vx * dt;
      if (!e.atkHit && Math.abs(e.x - p.x) < 30 && p.y >= GY - 28) {
        e.atkHit = true;
        hurtPlayer(e.dmg, e.x, 200, e.kind);
      }
      if (e.atkT <= 0) { e.act = 'idle'; e.cd = 0.9; e.vx = 0; }
      return;
    }
    if (e.act === 'atk') {
      e.atkT -= dt;
      if (e.atkT < 0.2 && e.atkT > 0.08) meleeHitPlayer(e);
      if (e.atkT <= 0) { e.act = 'idle'; e.cd = 0.45; }
      return;
    }
    if (adx < 40 && e.cd <= 0) {
      e.act = 'atk';
      e.atkT = 0.32;
      e.atkHit = false;
      facePlayer(e);
      return;
    }
    if (adx > 70 && adx < 280 && e.cd <= 0) {
      e.act = 'charge';
      e.atkT = 0.48;
      e.atkHit = false;
      facePlayer(e);
      e.vx = e.face * (e.spd + 80);
      audio.charge();
      return;
    }
    walkToward(e, dt, 36);
  }

  function updateKnight(e, dt) {
    var p = G.player;
    if (e.act === 'atk') {
      e.atkT -= dt;
      if (e.atkT < 0.24 && e.atkT > 0.1) meleeHitPlayer(e);
      if (e.atkT <= 0) { e.act = 'idle'; e.cd = 0.55; }
      return;
    }
    if (p && Math.abs(p.x - e.x) < 36 && e.cd <= 0 && Math.abs(p.y - e.y) < 32) {
      e.act = 'atk';
      e.atkT = 0.4;
      e.atkHit = false;
      facePlayer(e);
      audio.whoosh();
      return;
    }
    walkToward(e, dt, 30);
  }

  function updateBlack(e, dt) {
    var p = G.player;
    var adx;
    if (!p) return;
    if (e.mounted) {
      updateRider(e, dt);
      return;
    }
    if (e.remountT > 0) {
      e.remountT -= dt;
      if (e.remountT <= 0 && e.stunT <= 0) {
        e.mounted = true;
        e.horseHp = Math.max(4, (e.horseMax * 0.6) | 0);
        audio.mount();
        popRing(e.x, GY - 18, BLK, 18);
      }
    }
    adx = Math.abs(p.x - e.x);
    if (e.act === 'atk') {
      e.atkT -= dt;
      if (e.atkT < 0.22 && e.atkT > 0.08) meleeHitPlayer(e);
      if (e.atkT <= 0) { e.act = 'idle'; e.cd = 0.5; }
      return;
    }
    if (adx < 38 && e.cd <= 0) {
      e.act = 'atk';
      e.atkT = 0.38;
      e.atkHit = false;
      facePlayer(e);
      return;
    }
    walkToward(e, dt, 32);
  }

  function updateIron(e, dt) {
    var p = G.player;
    var adx;
    if (!p) return;
    adx = Math.abs(p.x - e.x);
    if (e.act === 'wind') {
      e.atkT -= dt;
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
      if (!e.atkHit && p && Math.abs(e.x - p.x) < 28 && p.y >= GY - 22) {
        e.atkHit = true;
        hurtPlayer(e.dmg, e.x, 220, 'ironk');
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

  function updateLion(e, dt) {
    var p = G.player;
    var adx, minion;
    if (!p) return;
    if (e.mounted) {
      updateRider(e, dt);
      e.summonT -= dt;
      return;
    }
    adx = Math.abs(p.x - e.x);
    e.summonT -= dt;
    if (e.act === 'slam') {
      e.atkT -= dt;
      if (!e.atkHit && e.atkT < 0.22 && e.atkT > 0.08) {
        e.atkHit = true;
        if (p && Math.abs(p.x - e.x) < 54 && p.y >= GY - 16) {
          hurtPlayer(e.dmg, e.x, 240, 'lion');
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
      minion = makeEnt(e.x - e.face * 70, Math.random() > 0.5 ? 'rider' : 'bandit', isMelee() ? G.wave : 0);
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
    if (e.kind === 'rider' || e.kind === 'mountk') updateRider(e, dt);
    else if (e.kind === 'knight') updateKnight(e, dt);
    else if (e.kind === 'black') updateBlack(e, dt);
    else if (e.kind === 'ironk') updateIron(e, dt);
    else if (e.kind === 'lion') updateLion(e, dt);
    else updateBandit(e, dt);

    e.vy += GRAV * dt;
    e.y += e.vy * dt;
    if (e.y > GY) { e.y = GY; e.vy = 0; e.grounded = true; }
    e.x = clamp(e.x, 16, G.levelW - 16);
    e.squash = lerp(e.squash || 1, 1, 1 - Math.pow(0.0002, dt));
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
        } else if (d.kind === 'horse') {
          mountPlayer();
          addScore(SCORE.horse);
          popFloat(d.x, d.y - 12, '上马', CREAM);
        } else {
          grabSword();
          popFloat(d.x, d.y - 12, wepName(G.wep), GOLD);
        }
        popSpark(d.x, d.y, GOLD, 14);
      }
    }
  }

  function updateBarrels(dt) {
    var i, c;
    for (i = 0; i < G.barrels.length; i++) {
      c = G.barrels[i];
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
    for (i = hooves.length - 1; i >= 0; i--) {
      s = hooves[i];
      s.t += dt;
      s.x += s.vx * dt;
      s.run += dt * 16;
      s.vx *= Math.max(0, 1 - 1.2 * dt);
      if (s.t > s.life) hooves.splice(i, 1);
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
    if (isMelee()) {
      addScore(Math.round(SCORE.wave * G.wave * G.mult));
      toast('清了', false, true);
    } else {
      addScore(Math.round(SCORE.stage * G.stage * G.mult));
      toast((STAGES[G.stage - 1] || STAGES[0]).name + ' 清了', false, true);
      audio.stage();
    }
  }

  function advanceClear() {
    var keepHp, keepWep, keepHorse, keepMount;
    if (isMelee()) {
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
    keepHorse = G.horse;
    keepMount = G.mounted;
    loadStage(G.stage + 1, false);
    G.hp = keepHp;
    G.wep = keepWep;
    G.horse = keepHorse;
    G.mounted = keepMount;
    G.invuln = 0.55;
    G.clearT = 0;
    toast(STAGES[G.stage - 1].name, false, true);
    setHint(G.stage === 3 ? '王城 · 金狮会召骑手' : '林道 · 铁甲会冲撞', G.stage === 3 ? 'hot' : '');
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
      updateDrops(dt);
      updateBarrels(dt);
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
        G.ents.push(makeEnt(clamp((G.player ? G.player.x : 200) + 360, 80, G.levelW - 80), 'rider', 0));
      }
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
    if (G.theme === 'forest') {
      g.addColorStop(0, '#08140c');
      g.addColorStop(0.55, '#10180e');
      g.addColorStop(1, '#1a1810');
    } else if (G.theme === 'castle') {
      g.addColorStop(0, '#140c10');
      g.addColorStop(0.5, '#1c1014');
      g.addColorStop(1, '#241410');
    } else {
      g.addColorStop(0, '#1a1008');
      g.addColorStop(0.5, '#20140c');
      g.addColorStop(1, '#28180e');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    ctx.fillStyle = 'rgba(255,227,107,0.16)';
    ctx.beginPath();
    ctx.arc(sx(G.camX + 520), sy(48), 22 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,227,107,0.55)';
    ctx.beginPath();
    ctx.arc(sx(G.camX + 520), sy(48), 8 * scale, 0, TAU);
    ctx.fill();
    for (i = 0; i < 18; i++) {
      tw = hash2(i * 19 + (G.theme === 'castle' ? 3 : 1));
      px = ((i * 137 + G.camX * 0.12) % (VW + 40)) - 20;
      py = 18 + tw * 90;
      ctx.fillStyle = rgba(WHT, 0.1 + tw * 0.18);
      ctx.fillRect(ox + px * scale, oy + py * scale, 1.4 * scale, 1.4 * scale);
    }
  }

  function drawVillage() {
    var b, x, w, h, start, end, wy, wx, lit, signs, sign;
    start = ((G.camX / 70) | 0) - 1;
    end = start + 16;
    signs = ['酒馆', '铁铺', '马厩'];
    for (b = start; b < end; b++) {
      x = b * 70;
      w = 50 + hash2(b * 3) * 16;
      h = 70 + hash2(b * 7) * 50;
      ctx.fillStyle = b % 2 === 0 ? '#3a2414' : '#2e1c10';
      ctx.fillRect(sx(x), sy(GY - 8 - h), w * scale, (h + 10) * scale);
      ctx.fillStyle = '#5a3020';
      ctx.beginPath();
      ctx.moveTo(sx(x - 6), sy(GY - 8 - h));
      ctx.lineTo(sx(x + w * 0.5), sy(GY - 8 - h - 18));
      ctx.lineTo(sx(x + w + 6), sy(GY - 8 - h));
      ctx.closePath();
      ctx.fill();
      for (wy = 14; wy < h - 16; wy += 16) {
        for (wx = 8; wx < w - 10; wx += 14) {
          lit = hash2(b * 31 + wy + wx) > 0.5;
          ctx.fillStyle = lit ? rgba(GOLD, 0.42) : 'rgba(8,4,4,0.7)';
          ctx.fillRect(sx(x + wx), sy(GY - h + wy), 7 * scale, 8 * scale);
        }
      }
      if (hash2(b * 11) > 0.68) {
        sign = signs[b % signs.length];
        ctx.fillStyle = rgba(HOT, 0.7);
        ctx.font = '700 ' + (7 * scale) + 'px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(sign, sx(x + 8), sy(GY - h + 12));
      }
    }
  }

  function drawForest() {
    var b, x, h, start, end;
    start = ((G.camX / 46) | 0) - 1;
    end = start + 22;
    for (b = start; b < end; b++) {
      x = b * 46;
      h = 90 + hash2(b * 5) * 80;
      ctx.fillStyle = hash2(b) > 0.5 ? '#1a2814' : '#142010';
      ctx.beginPath();
      ctx.moveTo(sx(x + 8), sy(GY - 6));
      ctx.lineTo(sx(x + 22), sy(GY - 6 - h));
      ctx.lineTo(sx(x + 36), sy(GY - 6));
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(PINE, 0.85);
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(GY - 20 - h * 0.25));
      ctx.lineTo(sx(x + 22), sy(GY - 28 - h));
      ctx.lineTo(sx(x + 44), sy(GY - 20 - h * 0.25));
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#3a2a18';
      ctx.fillRect(sx(x + 18), sy(GY - 8 - 18), 8 * scale, 18 * scale);
    }
  }

  function drawCastle() {
    var b, x, w, h, start, end, mer, i;
    start = ((G.camX / 80) | 0) - 1;
    end = start + 14;
    for (b = start; b < end; b++) {
      x = b * 80;
      w = 68 + hash2(b) * 10;
      h = 110 + hash2(b * 3) * 70;
      ctx.fillStyle = b % 2 === 0 ? '#3a322c' : '#322a26';
      ctx.fillRect(sx(x), sy(GY - 8 - h), w * scale, (h + 10) * scale);
      ctx.fillStyle = '#4a4038';
      for (i = 0; i < 5; i++) {
        mer = x + 4 + i * (w / 5);
        ctx.fillRect(sx(mer), sy(GY - 8 - h - 10), 8 * scale, 12 * scale);
      }
      ctx.fillStyle = rgba(RED, 0.55);
      ctx.fillRect(sx(x + w * 0.42), sy(GY - h - 36), 3 * scale, 28 * scale);
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.beginPath();
      ctx.moveTo(sx(x + w * 0.42 + 3), sy(GY - h - 36));
      ctx.lineTo(sx(x + w * 0.42 + 16), sy(GY - h - 28));
      ctx.lineTo(sx(x + w * 0.42 + 3), sy(GY - h - 20));
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(sx(x + w * 0.38), sy(GY - 40), 14 * scale, 32 * scale);
    }
  }

  function drawScenery() {
    if (G.theme === 'forest') drawForest();
    else if (G.theme === 'castle') drawCastle();
    else drawVillage();
  }

  function drawGround() {
    var g, i, x;
    g = ctx.createLinearGradient(0, sy(GY - 6), 0, sy(VH));
    if (G.theme === 'forest') {
      g.addColorStop(0, '#243018');
      g.addColorStop(0.4, '#18180e');
      g.addColorStop(1, '#0c0c08');
    } else if (G.theme === 'castle') {
      g.addColorStop(0, '#3a3028');
      g.addColorStop(1, '#18100c');
    } else {
      g.addColorStop(0, '#3a2818');
      g.addColorStop(0.4, '#22180e');
      g.addColorStop(1, '#120c08');
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
  }

  function drawBarrel(c) {
    if (c.dead && c.deadT <= 0) return;
    var x = sx(c.x);
    var y = sy(GY);
    var a = c.dead ? clamp(c.deadT / 0.4, 0, 1) : 1;
    ctx.save();
    ctx.globalAlpha = a;
    if (c.dead) ctx.translate(0, (1 - a) * 8 * scale);
    ctx.fillStyle = '#6a4224';
    fillRound(x - 9 * scale, y - 20 * scale, 18 * scale, 20 * scale, 4 * scale);
    ctx.fillStyle = '#8a5a30';
    ctx.fillRect(x - 9 * scale, y - 16 * scale, 18 * scale, 3 * scale);
    ctx.fillRect(x - 9 * scale, y - 8 * scale, 18 * scale, 3 * scale);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(x - 1 * scale, y - 18 * scale, 2 * scale, 16 * scale);
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
    } else if (d.kind === 'horse') {
      ctx.fillStyle = rgba(CREAM, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, 0, 8 * scale, 4.2 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(BRN, 0.9);
      ctx.fillRect(5 * scale, -3 * scale, 4 * scale, 3 * scale);
    } else {
      ctx.fillStyle = rgba(G.wep === 'holy' ? GOLD : STEEL, 1);
      ctx.save();
      ctx.rotate(-0.5);
      ctx.fillRect(-1.4 * scale, -11 * scale, 2.8 * scale, 14 * scale);
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fillRect(-3.2 * scale, 1 * scale, 6.4 * scale, 2.4 * scale);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawShadow(x, y, sc) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(GY + 1), 12 * scale * (sc || 1), 3.4 * scale, 0, 0, TAU);
    ctx.fill();
  }

  function drawHorse(sc, coat, mane, run, bob) {
    var lift = function (ph) {
      return Math.max(0, Math.sin(run + ph) * 4.2);
    };
    bob = bob || 0;
    ctx.fillStyle = rgba(coat, 1);
    ctx.fillRect(-11 * sc, (-5 + bob) * sc, 3 * sc, (11 - lift(0)) * sc);
    ctx.fillRect(-4 * sc, (-5 + bob) * sc, 3 * sc, (11 - lift(1.6)) * sc);
    ctx.fillRect(3 * sc, (-5 + bob) * sc, 3 * sc, (11 - lift(3.1)) * sc);
    ctx.fillRect(9 * sc, (-5 + bob) * sc, 3 * sc, (11 - lift(4.6)) * sc);
    ctx.beginPath();
    ctx.ellipse(0, (-12 + bob) * sc, 13 * sc, 6.4 * sc, 0, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(11 * sc, (-16 + bob) * sc);
    ctx.rotate(-0.55);
    ctx.fillRect(0, -2 * sc, 8 * sc, 4.6 * sc);
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(18 * sc, (-22 + bob) * sc, 5.2 * sc, 3.2 * sc, -0.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(mane, 1);
    ctx.fillRect(8 * sc, (-24 + bob) * sc, 2.6 * sc, 10 * sc);
    ctx.fillRect(-16 * sc, (-16 + bob) * sc, 5 * sc, 2.2 * sc);
    ctx.fillStyle = '#140804';
    ctx.beginPath();
    ctx.arc(20 * sc, (-23 + bob) * sc, 0.9 * sc, 0, TAU);
    ctx.fill();
  }

  function drawSword(sc, wep, swinging) {
    var len = wep === 'holy' ? 22 : wep === 'knight' ? 16 : 11;
    if (swinging) len += 4;
    ctx.save();
    ctx.translate(7 * sc, -18 * sc);
    if (swinging) ctx.rotate(-0.85);
    ctx.fillStyle = rgba(wep === 'holy' ? GOLD : STEEL, 1);
    ctx.fillRect(0, -2 * sc, len * sc, 2.4 * sc);
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.fillRect(-2 * sc, -3.4 * sc, 4 * sc, 5.2 * sc);
    if (wep === 'holy') {
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.beginPath();
      ctx.arc(len * sc, -0.8 * sc, 2.4 * sc, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawKnightBody(sc, armor, helm, skin, plume, swinging, wep) {
    ctx.fillStyle = rgba(armor, 1);
    fillRound(-6 * sc, -22 * sc, 12 * sc, 16 * sc, 2 * sc);
    ctx.fillStyle = rgba(skin, 1);
    ctx.beginPath();
    ctx.arc(0, -26 * sc, 4.4 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(helm, 1);
    fillRound(-4.6 * sc, -31 * sc, 9.2 * sc, 6.4 * sc, 2 * sc);
    ctx.fillRect(-4.4 * sc, -26.6 * sc, 8.8 * sc, 2.2 * sc);
    if (plume) {
      ctx.fillStyle = rgba(plume, 0.95);
      ctx.beginPath();
      ctx.moveTo(-1 * sc, -31 * sc);
      ctx.lineTo(0.6 * sc, -38 * sc);
      ctx.lineTo(2.4 * sc, -31 * sc);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = rgba(armor, 1);
    fillRound(-8 * sc, -20 * sc, 4 * sc, 6 * sc, 1 * sc);
    fillRound(4 * sc, -20 * sc, 4 * sc, 6 * sc, 1 * sc);
    ctx.fillStyle = rgba(DBRN, 1);
    fillRound(-5.4 * sc, -8 * sc, 4.2 * sc, 8 * sc, 1 * sc);
    fillRound(1.2 * sc, -8 * sc, 4.2 * sc, 8 * sc, 1 * sc);
    drawSword(sc, wep || 'short', swinging);
  }

  function drawArthur(p, ghost) {
    var sc = scale * (p.squash || 1);
    var bob = G.mounted ? Math.sin(p.run) * 1.4 : 0;
    var swinging = p.act === 'atk' || p.act === 'air';
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.scale(p.face, 1);
    if (ghost) ctx.globalAlpha = 0.42;
    if (p.act === 'down') ctx.rotate(0.6);
    if (G.mounted) {
      drawHorse(sc, CREAM, [180, 140, 90], p.run, bob);
      ctx.translate(0, (-16 + bob) * sc);
    }
    ctx.fillStyle = rgba(RED, 0.85);
    ctx.beginPath();
    ctx.moveTo(-2 * sc, -20 * sc);
    ctx.quadraticCurveTo(-16 * sc, -8 * sc, -10 * sc, 2 * sc);
    ctx.lineTo(2 * sc, -14 * sc);
    ctx.closePath();
    ctx.fill();
    drawKnightBody(sc, GOLD, HOT, SKIN, RED, swinging, G.wep);
    ctx.restore();
  }

  function drawEnt(e) {
    if (e.dead && e.deadT <= 0) return;
    var spec = KINDS[e.kind] || KINDS.bandit;
    var sc = scale * (e.scale || 1) * (e.squash || 1);
    var bob = e.mounted ? Math.sin(e.run) * 1.2 : 0;
    var swinging = e.act === 'atk' || e.act === 'air';
    var a = e.dead ? clamp(e.deadT / 0.55, 0, 1) : 1;
    var wep = isBoss(e.kind) ? 'knight' : 'short';
    drawShadow(e.x, e.y, e.mounted ? 1.35 : (e.scale || 1));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(sx(e.x), sy(e.y));
    ctx.scale(e.face, 1);
    if (e.flash > 0) ctx.globalAlpha = a * 0.55;
    if (e.act === 'down' || (e.dead && e.deadT < 0.35)) ctx.rotate(0.55);
    if (e.mounted) {
      drawHorse(sc, spec.coat, spec.mane, e.run, bob);
      ctx.translate(0, (-16 + bob) * sc);
    }
    drawKnightBody(sc, spec.armor, spec.helm, SKIN, e.kind === 'black' ? RED : (e.kind === 'lion' ? HOT : null), swinging, wep);
    if (e.kind === 'lion') {
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.arc(0, -28 * sc, 6.2 * sc, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(0, -27 * sc, 3.6 * sc, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    if (e.mounted && !e.dead) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(sx(e.x - 10), sy(e.y - (e.mounted ? 56 : 40)), 20 * scale, 3 * scale);
      ctx.fillStyle = rgba(CREAM, 0.85);
      ctx.fillRect(sx(e.x - 10), sy(e.y - (e.mounted ? 56 : 40)), 20 * scale * clamp(e.horseHp / Math.max(1, e.horseMax), 0, 1), 3 * scale);
    }
  }

  function drawTrails() {
    var i, t, a;
    for (i = 0; i < trails.length; i++) {
      t = trails[i];
      a = 1 - t.t / t.life;
      ctx.strokeStyle = rgba(G.wep === 'holy' ? GOLD : STEEL, 0.5 * a);
      ctx.lineWidth = (G.wep === 'holy' ? 3.4 : 2.6) * scale;
      ctx.beginPath();
      ctx.arc(sx(t.x + t.face * 16), sy(t.y), (10 + t.t * (t.reach || 32)) * scale, t.face > 0 ? -0.9 : 2.2, t.face > 0 ? 0.7 : 3.8);
      ctx.stroke();
    }
  }

  function drawHooves() {
    var i, h, a;
    for (i = 0; i < hooves.length; i++) {
      h = hooves[i];
      a = 1 - h.t / h.life;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(sx(h.x), sy(h.y));
      ctx.scale(h.vx >= 0 ? 1 : -1, 1);
      drawHorse(scale * 0.92, h.coat, DBRN, h.run, 0);
      ctx.restore();
    }
  }

  function drawFx() {
    var i, p, s, r, f, a;
    drawHooves();
    drawTrails();
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
      ctx.strokeStyle = rgba(s.rgb, 0.85 * a);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.rad * (0.4 + s.t * 4)) * scale, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx(s.x - 8), sy(s.y));
      ctx.lineTo(sx(s.x + 8), sy(s.y));
      ctx.moveTo(sx(s.x), sy(s.y - 8));
      ctx.lineTo(sx(s.x), sy(s.y + 8));
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

  function draw() {
    var i, p, shx = 0, shy = 0;
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#120a04';
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
    drawScenery();
    drawGround();
    for (i = 0; i < G.barrels.length; i++) drawBarrel(G.barrels[i]);
    for (i = 0; i < G.drops.length; i++) drawDrop(G.drops[i]);
    G.ents.sort(function (a, b) { return a.y - b.y; });
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    p = G.player;
    if (p) {
      drawShadow(p.x, p.y, G.mounted ? 1.4 : 1);
      drawArthur(p, G.invuln > 0 && G.mode !== 'title' && ((G.t * 16) | 0) % 2 === 0);
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
      if (k === '2' && G.mode === 'title') startGame('melee');
      return;
    }
    if (space) {
      if (playing() || G.mode === 'title') doSlash();
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
      if (playing()) doSlash();
    }, null);
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen()) return;
      if (playing()) doSlash();
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
  if (btnMelee) {
    btnMelee.addEventListener('click', function () {
      audio.ensure();
      startGame('melee');
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
      if (G.mode === 'win' && !isMelee()) startGame('melee');
      else goTitle();
    });
  }
  if (modeQuest) {
    modeQuest.addEventListener('click', function () {
      audio.ensure();
      startGame('quest');
    });
  }
  if (modeMelee) {
    modeMelee.addEventListener('click', function () {
      audio.ensure();
      startGame('melee');
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
