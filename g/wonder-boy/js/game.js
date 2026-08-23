'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 12000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.32;
  const GY = 320;
  const MY = 248;
  const HY = 176;
  const SKATE_SPD = 268;
  const AIR = 0.88;
  const JUMP_V = 500;
  const GRAV = 1450;
  const MAX_FALL = 560;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const PW = 14;
  const PH = 26;
  const SMASH_T = 0.16;
  const SMASH_CD = 0.24;
  const SMASH_R = 34;
  const HAMMER_SPD = 450;
  const HAMMER_LIFE = 0.72;
  const INVULN = 1.4;
  const DIE_T = 0.82;
  const VIT_MAX = 100;
  const DRAIN_BOY = 4.8;
  const DRAIN_CORE = 8.2;
  const COST_HAMMER = 8;
  const COST_CHARM = 6;
  const COST_LIFE = 10;
  const BEST_KEY = 'playbox-wonder-boy-best';
  const MUTE_KEY = 'playbox-wonder-boy-mute';
  const OPS = '方向键 / WASD 走 · 上 / Z 跳 · 空格砸 · 下掉落 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [232, 255, 106];
  const HOT = [196, 255, 26];
  const HOT2 = [216, 255, 112];
  const WHT = [244, 246, 239];
  const LEAF = [61, 255, 122];
  const SAND = [200, 160, 64];
  const SKIN = [255, 212, 168];
  const PNK = [255, 138, 180];
  const LAVA = [255, 90, 40];
  const WOOD = [168, 112, 48];

  const FRUIT = {
    orange: { vit: 20, score: 100, rgb: [255, 140, 40], name: '橙' },
    banana: { vit: 28, score: 200, rgb: GOLD, name: '蕉' },
    melon: { vit: 42, score: 400, rgb: LEAF, name: '瓜' }
  };

  const SCORE = {
    snail: 140, bee: 180, frog: 220, hog: 260,
    bag: 200, boss: 5000, stage: 1800, shop: 80, smash: 40
  };

  const STAGES = [
    {
      name: '林道', boss: '巨蛙', w: 2320, hp: 10,
      ground: [[0, 500], [580, 500], [1180, 1140]],
      plats: [
        [180, MY, 160], [420, MY, 140], [720, MY, 180],
        [980, MY, 150], [1480, MY, 190], [1880, MY, 160],
        [300, HY, 120], [860, HY, 130], [1600, HY, 140]
      ],
      fruit: [
        [240, GY, 'orange'], [460, MY, 'banana'], [700, GY, 'orange'],
        [1020, MY, 'banana'], [1320, GY, 'orange'], [1540, MY, 'melon'],
        [1960, GY, 'banana']
      ],
      bags: [[360, GY], [880, MY], [1700, GY]],
      shops: [
        [940, GY, 'hammer'], [980, GY, 'charm'], [1020, GY, 'life']
      ],
      ents: [
        [320, GY, 'snail', 40, 480],
        [640, GY, 'snail', 600, 1040],
        [780, MY, 'bee', 720, 900],
        [1080, GY, 'snail', 600, 1060],
        [1380, GY, 'frog', 1220, 1700],
        [1560, GY, 'snail', 1220, 2100],
        [1760, GY, 'bee', 1500, 2000],
        [1920, MY, 'frog', 1880, 2040]
      ]
    },
    {
      name: '溪谷', boss: '岩蜥', w: 2760, hp: 14,
      ground: [[0, 440], [520, 400], [1020, 380], [1520, 1240]],
      plats: [
        [100, MY, 140], [340, MY, 150], [640, MY, 170],
        [940, MY, 160], [1240, MY, 180], [1640, MY, 190],
        [2080, MY, 170], [2420, MY, 150],
        [380, HY, 130], [820, HY, 140], [1380, HY, 150],
        [1860, HY, 160], [2280, HY, 130]
      ],
      fruit: [
        [180, MY, 'orange'], [480, GY, 'banana'], [700, MY, 'orange'],
        [1080, GY, 'banana'], [1300, MY, 'melon'], [1720, GY, 'orange'],
        [1900, HY, 'banana'], [2200, GY, 'orange'], [2480, MY, 'melon']
      ],
      bags: [[260, MY], [960, GY], [1480, MY], [2100, GY]],
      shops: [
        [200, GY, 'life'], [240, GY, 'hammer'], [280, GY, 'charm']
      ],
      ents: [
        [260, GY, 'snail', 20, 420],
        [380, MY, 'frog', 340, 490],
        [600, GY, 'hog', 540, 900],
        [760, MY, 'bee', 640, 840],
        [880, HY, 'bee', 820, 980],
        [1160, GY, 'snail', 1040, 1380],
        [1320, MY, 'frog', 1240, 1420],
        [1460, GY, 'hog', 1040, 1480],
        [1740, GY, 'frog', 1540, 2280],
        [1960, GY, 'snail', 1540, 2480],
        [2140, MY, 'bee', 2080, 2260],
        [2320, GY, 'hog', 1540, 2500],
        [2480, MY, 'frog', 2420, 2580]
      ]
    },
    {
      name: '火岭', boss: '魔王', w: 3180, hp: 20,
      ground: [[0, 400], [480, 360], [920, 380], [1420, 400], [1940, 1240]],
      plats: [
        [80, MY, 130], [280, MY, 150], [540, MY, 160],
        [840, MY, 170], [1160, MY, 180], [1500, MY, 170],
        [1840, MY, 190], [2260, MY, 200], [2660, MY, 180], [2940, MY, 140],
        [300, HY, 120], [700, HY, 140], [1220, HY, 150],
        [1700, HY, 160], [2300, HY, 170], [2760, HY, 140]
      ],
      fruit: [
        [160, MY, 'orange'], [400, GY, 'banana'], [620, MY, 'orange'],
        [960, GY, 'melon'], [1200, MY, 'banana'], [1560, GY, 'orange'],
        [1740, HY, 'banana'], [2080, GY, 'melon'], [2380, MY, 'orange'],
        [2640, GY, 'banana'], [2920, MY, 'melon']
      ],
      bags: [[220, MY], [780, GY], [1340, MY], [1880, GY], [2500, MY]],
      shops: [
        [1080, GY, 'hammer'], [1120, GY, 'charm'], [1160, GY, 'life']
      ],
      ents: [
        [220, GY, 'snail', 20, 380],
        [320, MY, 'frog', 280, 430],
        [540, GY, 'hog', 500, 820],
        [700, MY, 'bee', 540, 720],
        [740, HY, 'bee', 700, 840],
        [1040, GY, 'snail', 940, 1300],
        [1200, MY, 'frog', 1160, 1340],
        [1340, GY, 'hog', 940, 1380],
        [1620, GY, 'frog', 1440, 1820],
        [1740, MY, 'bee', 1500, 1690],
        [1860, GY, 'hog', 1440, 1880],
        [2120, GY, 'frog', 1960, 2780],
        [2340, MY, 'bee', 2260, 2460],
        [2460, GY, 'hog', 1960, 2880],
        [2620, GY, 'frog', 1960, 2880],
        [2780, MY, 'frog', 2660, 2840],
        [2960, GY, 'hog', 1960, 3080]
      ]
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
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function jumpHeight() {
    return (JUMP_V * JUMP_V) / (2 * GRAV);
  }
  function drainRate(core) {
    return core ? DRAIN_CORE : DRAIN_BOY;
  }
  function spdMul(core, stage) {
    return (core ? 1.28 : 1) * (1 + Math.max(0, stage - 1) * 0.08);
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
  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
  function shopCost(item) {
    if (item === 'life') return COST_LIFE;
    if (item === 'charm') return COST_CHARM;
    return COST_HAMMER;
  }
  function shopName(item) {
    if (item === 'life') return '仙命';
    if (item === 'charm') return '护符';
    return '石锤';
  }
  function killScore(kind) {
    if (kind === 'bee') return SCORE.bee;
    if (kind === 'frog' || kind === 'bfrog') return SCORE.frog;
    if (kind === 'hog' || kind === 'bliz') return SCORE.hog;
    return SCORE.snail;
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 areas');
    if (LIVES !== 3) throw new Error('3 lives');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (drainRate(true) <= drainRate(false)) throw new Error('core hungrier');
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('core faster');
    if (HAMMER_SPD * HAMMER_LIFE <= SMASH_R) throw new Error('hammer reach');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (BEST_KEY !== 'playbox-wonder-boy-best') throw new Error('best key');
    if (FRUIT.melon.vit <= FRUIT.orange.vit) throw new Error('melon better');
    if (COST_LIFE <= COST_HAMMER) throw new Error('life costs more');
    let i, s, j, hasSnail, hasBee, hasShop;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length || s.fruit.length < 5) throw new Error('stage goods');
      if (!s.shops || s.shops.length < 3) throw new Error('need shops');
      if (!s.bags || s.bags.length < 2) throw new Error('need bags');
      hasSnail = false;
      hasBee = false;
      hasShop = false;
      for (j = 0; j < s.ents.length; j++) {
        if (s.ents[j][2] === 'snail') hasSnail = true;
        if (s.ents[j][2] === 'bee') hasBee = true;
      }
      for (j = 0; j < s.shops.length; j++) {
        if (s.shops[j][2] === 'hammer') hasShop = true;
      }
      if (!hasSnail || !hasBee) throw new Error('need snails bees');
      if (!hasShop) throw new Error('need hammer shop');
    }
  }

  selfCheck();

  if (typeof document === 'undefined') return;

  const REDUCE = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const ovStart = document.getElementById('ov-start');
  const ovEnd = document.getElementById('ov-end');
  const btnBoy = document.getElementById('btn-boy');
  const btnCore = document.getElementById('btn-core');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeBoy = document.getElementById('mode-boy');
  const modeCore = document.getElementById('mode-core');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const comboBox = document.getElementById('combo-box');
  const comboEl = document.getElementById('combo');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const vitWrap = document.getElementById('vit-wrap');
  const vitBar = document.getElementById('vit-bar');
  const coinLabel = document.getElementById('coin-label');
  const gearLabel = document.getElementById('gear-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const chainPop = document.getElementById('chain-pop');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let toastTok = 0;
  let kickTok = 0;
  let chainTok = 0;
  let vitHotTok = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const demo = { l: false, r: true, u: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];

  const G = {
    mode: 'title',
    kind: 'boy',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 2320,
    plats: [],
    fruit: [],
    bags: [],
    shops: [],
    ents: [],
    hammers: [],
    blobs: [],
    shocks: [],
    player: null,
    boss: null,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    vit: VIT_MAX,
    coins: 0,
    hammer: false,
    charm: false,
    smashT: 0,
    smashCd: 0,
    jumpBuf: 0,
    dropT: 0,
    dropPlat: null,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    toastT: 0,
    nextLife: LIFE_EVERY,
    clearT: 0,
    lock: 0,
    why: '',
    hungry: false,
    beatT: 0,
    sparkT: 0,
    arena: 0,
    checkX: 70,
    checkY: GY
  };

  function isCore() {
    return G.kind === 'core';
  }
  function playing() {
    return G.mode === 'play';
  }
  function inL() {
    return G.mode === 'title' ? demo.l : keys.l;
  }
  function inR() {
    return G.mode === 'title' ? demo.r : keys.r;
  }
  function inU() {
    return G.mode === 'title' ? demo.u : keys.u;
  }
  function inD() {
    return G.mode === 'play' && keys.d;
  }
  function sx(x) {
    return ox + (x - G.camX) * scale;
  }
  function sy(y) {
    return oy + (y - G.camY) * scale;
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.32;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.32;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (err) { /* ignore */ }
    },
    beep(freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
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
    noise(dur, vol, hp) {
      if (!this.ctx || this.muted) return;
      const n = Math.max(0.04, dur);
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, Math.max(1, (sr * n) | 0), sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = hp || 900;
      const g = this.ctx.createGain();
      const t = this.ctx.currentTime;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    hop() {
      this.ensure();
      this.beep(280, 0.06, 'square', 0.045, 620);
    },
    land() {
      this.ensure();
      this.noise(0.04, 0.028, 500);
      this.beep(140, 0.05, 'triangle', 0.025, 80);
    },
    smash() {
      this.ensure();
      this.noise(0.04, 0.038, 1400);
      this.beep(420, 0.07, 'sawtooth', 0.05, 180);
      this.beep(880, 0.05, 'square', 0.028, 360);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.05, 0.044, 800);
      this.beep(520 * lift, 0.09, 'square', 0.052, 200);
      this.beep(780 * lift, 0.07, 'triangle', 0.032, 160);
    },
    fruit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.05);
      this.beep(660 * lift, 0.07, 'square', 0.046, 990 * lift);
      this.beep(1320 * lift, 0.1, 'sine', 0.036, 1760 * lift);
    },
    spark() {
      this.ensure();
      this.noise(0.03, 0.018, 2400);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.055, 320);
      this.beep(280, 0.2, 'sawtooth', 0.05, 70);
      this.beep(140, 0.32, 'sine', 0.045, 42);
    },
    starve() {
      this.ensure();
      this.beep(180, 0.16, 'triangle', 0.045, 70);
      this.beep(90, 0.28, 'sine', 0.05, 40);
    },
    hunger() {
      this.ensure();
      this.beep(140, 0.07, 'sine', 0.03, 90);
    },
    boss() {
      this.ensure();
      this.beep(180, 0.18, 'sawtooth', 0.05, 90);
      this.beep(110, 0.3, 'square', 0.04, 64);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(200, 0.18, 'sawtooth', 0.04, 80);
      this.beep(120, 0.3, 'sine', 0.05, 44);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
    },
    oneup() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.04, 880);
      this.beep(880, 0.12, 'triangle', 0.045, 1320);
    },
    stage() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.12, 'triangle', 0.04, 784);
    },
    slam() {
      this.ensure();
      this.noise(0.1, 0.05, 280);
      this.beep(90, 0.14, 'sawtooth', 0.045, 50);
    },
    shop() {
      this.ensure();
      this.beep(520, 0.08, 'square', 0.04, 780);
      this.beep(780, 0.12, 'triangle', 0.04, 1040);
    },
    noPay() {
      this.ensure();
      this.beep(160, 0.1, 'square', 0.04, 90);
    },
    coin(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.4, combo * 0.04);
      this.beep(880 * lift, 0.06, 'square', 0.04, 1320 * lift);
    },
    charm() {
      this.ensure();
      this.beep(300, 0.08, 'sine', 0.04, 180);
      this.noise(0.08, 0.03, 600);
    }
  };

  function loadBest() {
    try {
      const n = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
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
    const tok = addTok;
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
    const tok = toastTok;
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
    const n = Math.max(LIVES, G.lives);
    while (pips.length < n) {
      const el = document.createElement('span');
      el.className = 'pip';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    while (pips.length > n) {
      const el = pips.pop();
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', i >= G.lives && G.mode !== 'title');
    }
  }

  function syncModes() {
    const core = isCore();
    if (modeBoy) modeBoy.setAttribute('aria-pressed', core ? 'false' : 'true');
    if (modeCore) modeCore.setAttribute('aria-pressed', core ? 'true' : 'false');
  }

  function gearText() {
    if (G.hammer && G.charm) return '锤·符';
    if (G.hammer) return '石锤';
    if (G.charm) return '护符';
    return '';
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = (isCore() ? '核 ' : '') + spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '仙核' : '仙童';
      tagLabel.classList.toggle('warn', isCore());
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (vitBar) vitBar.style.transform = 'scaleX(' + clamp(G.vit / VIT_MAX, 0, 1) + ')';
    if (vitWrap) {
      vitWrap.classList.toggle('warn', playing() && G.vit < 26);
      vitWrap.classList.toggle('hot', G.smashT > 0);
    }
    if (coinLabel) coinLabel.textContent = '币 ' + G.coins;
    if (gearLabel) {
      const g = gearText();
      gearLabel.classList.toggle('hidden', !g);
      gearLabel.classList.toggle('charm', G.charm && !G.hammer);
      if (g) gearLabel.textContent = g;
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞敌、饿倒、坠崖都丢命', 'warn');
    else if (G.mode === 'win') setHint('林道打通 · R 再来一局', 'hot');
    else if (G.vit < 26) setHint('饿了 · 快摘水果续命', 'warn');
    else if (G.lives === 1) setHint('最后一命 · 空格砸击 · 水果续命', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · 滑板砸穿 · 跳过冲击', 'hot');
    else setHint('滑板砸 · 空格近砸 · 店里买装备 · 水果续命', '');
    syncPips();
    syncModes();
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'WBOY';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '仙核' : '换模式';
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus({ preventScroll: true });
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
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
    const c = cls || (mag >= 6 ? 'die' : mag >= 3.4 ? 'boom' : 'hit');
    kickTok += 1;
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'win-flash');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
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
    for (let i = 0; i < n; i++) {
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
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 40);
    capArr(rings, 24);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.95 : 0.68,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? 90 : 72
    });
    capArr(floats, 28);
  }

  function juice(x, y, rgb, power) {
    const p = power || 1;
    emit(8 + (p * 10) | 0, {
      x: x, y: y, j: 6 + p * 5,
      vx0: -200 * p, vx1: 200 * p, vy0: -280 * p, vy1: -20 * p,
      life: 0.28 + p * 0.14, r0: 1, r1: 2.8 + p, rgb: rgb
    });
    popSpark(x, y, rgb, 10 + p * 10);
    screenFlash(rgb, 0.14 + p * 0.1);
    kick(2.1 + p * 2.4);
  }

  function showChain(n) {
    if (!chainPop) return;
    chainPop.textContent = '×' + n;
    chainPop.classList.remove('hidden');
    chainTok += 1;
    const tok = chainTok;
    setTimeout(function () {
      if (tok === chainTok) chainPop.classList.add('hidden');
    }, 700);
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    const prev = G.mult;
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (G.mult > prev) {
      audio.combo(G.mult);
      showChain(G.mult);
    }
    syncHud();
  }

  function makePlat(x, y, w, h, base) {
    return { x: x, y: y, w: w, h: h || 18, base: !!base };
  }

  function makePlayer(x, y) {
    return {
      x: x, y: y, vx: 0, vy: 0, face: 1,
      grounded: true, coyote: COYOTE, run: 0,
      squash: 1, pose: 0, w: PW, h: PH
    };
  }

  function makeEnt(x, y, kind, a, b) {
    const frog = kind === 'frog';
    const bee = kind === 'bee';
    const hog = kind === 'hog';
    return {
      kind: kind, x: x, y: y, baseY: y,
      w: hog ? 28 : bee ? 16 : frog ? 22 : 24,
      h: hog ? 20 : bee ? 14 : frog ? 18 : 16,
      face: 1, vx: 0, vy: 0, grounded: !bee,
      hp: hog ? 2 : 1, a: a, b: b,
      t: rand(0, TAU), hop: rand(0.4, 1.1), charge: 0,
      dead: false, hurt: 0, flying: bee
    };
  }

  function makeBoss(spec) {
    let kind = 'bfrog';
    if (spec.boss === '岩蜥') kind = 'bliz';
    if (spec.boss === '魔王') kind = 'bking';
    const core = isCore();
    const hp = Math.round(spec.hp * (core ? 1.28 : 1));
    return {
      kind: kind, name: spec.boss,
      x: spec.w - 180, y: GY,
      w: kind === 'bfrog' ? 42 : kind === 'bking' ? 50 : 48,
      h: kind === 'bfrog' ? 36 : 32,
      face: -1, vx: 0, vy: 0, grounded: true,
      hp: hp, max: hp, t: 0, atk: 0, phase: 0,
      active: false, dead: false, hurt: 0
    };
  }

  function makeFruit(x, y, kind) {
    return { x: x, y: y - 18, kind: kind, taken: false, t: rand(0, TAU) };
  }

  function makeBag(x, y) {
    return { x: x, y: y, smashed: false, pop: 0 };
  }

  function makeShop(x, y, item) {
    return { x: x, y: y, item: item, sold: false, pop: 0 };
  }

  function landOn(x, y0, y1, skip) {
    let best = null;
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (p === skip) continue;
      if (x < p.x - 4 || x > p.x + p.w + 4) continue;
      if (y0 <= p.y + 2 && y1 >= p.y - 1) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function standAt(x, y) {
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (x < p.x + 6 || x > p.x + p.w - 6) continue;
      if (Math.abs(y - p.y) < 10) return p;
    }
    return null;
  }

  function platUnder(x, y, skip) {
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (p === skip) continue;
      if (x < p.x || x > p.x + p.w) continue;
      if (Math.abs(y - p.y) < 8) return p;
    }
    return null;
  }

  function pitAhead(x, face) {
    const d = face > 0 ? 42 : -42;
    return !standAt(x + d, GY) && !standAt(x + d * 1.6, GY);
  }

  function smashBox() {
    const p = G.player;
    if (!p) return null;
    const r = SMASH_R;
    if (p.face >= 0) return { x: p.x + 6, y: p.y - PH + 2, w: r, h: PH - 4 };
    return { x: p.x - 6 - r, y: p.y - PH + 2, w: r, h: PH - 4 };
  }

  function loadStage(n, keepScore) {
    const spec = STAGES[n - 1];
    G.stage = n;
    G.levelW = spec.w;
    G.arena = spec.w - 520;
    G.plats.length = 0;
    G.fruit.length = 0;
    G.bags.length = 0;
    G.shops.length = 0;
    G.ents.length = 0;
    G.hammers.length = 0;
    G.blobs.length = 0;
    G.shocks.length = 0;
    G.clearT = 0;
    G.lock = 0;
    G.hungry = false;
    G.smashCd = 0;
    G.smashT = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;

    let i, g, e;
    for (i = 0; i < spec.ground.length; i++) {
      g = spec.ground[i];
      G.plats.push(makePlat(g[0], GY, g[1], VH - GY + 48, true));
    }
    for (i = 0; i < spec.plats.length; i++) {
      g = spec.plats[i];
      G.plats.push(makePlat(g[0], g[1], g[2], 14, false));
    }
    for (i = 0; i < spec.fruit.length; i++) {
      g = spec.fruit[i];
      G.fruit.push(makeFruit(g[0], g[1], g[2]));
    }
    for (i = 0; i < spec.bags.length; i++) {
      g = spec.bags[i];
      G.bags.push(makeBag(g[0], g[1]));
    }
    for (i = 0; i < spec.shops.length; i++) {
      g = spec.shops[i];
      G.shops.push(makeShop(g[0], g[1], g[2]));
    }
    for (i = 0; i < spec.ents.length; i++) {
      e = spec.ents[i];
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4]));
    }
    if (isCore()) {
      for (i = 0; i < spec.ents.length; i += 2) {
        e = spec.ents[i];
        const alt = e[2] === 'bee' ? 'snail' : 'bee';
        G.ents.push(makeEnt(e[0] + 54, e[1], alt, e[3], e[4]));
      }
    }
    G.boss = makeBoss(spec);
    G.player = makePlayer(70, GY);
    G.camX = 0;
    G.camY = 0;
    G.vit = VIT_MAX;
    G.invuln = keepScore ? 0.6 : 0;
    G.deadT = 0;
    G.checkX = 70;
    G.checkY = GY;
    if (!keepScore) {
      G.combo = 0;
      G.comboT = 0;
      G.mult = 1;
    }
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'boy';
    G.score = 0;
    G.lives = LIVES;
    G.nextLife = LIFE_EVERY;
    G.combo = 0;
    G.mult = 1;
    G.coins = 0;
    G.hammer = false;
    G.charm = false;
    G.why = '';
    loadStage(1, false);
    G.vit = VIT_MAX;
    showOverlay('title', '仙童', '滑板砸穿林道。空格近砸，店里买石锤远砸、护符挡一次、仙命续命。体力会饿，摘果就回。撞敌丢命。');
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'core' ? 'core' : 'boy';
    G.mode = 'play';
    G.score = 0;
    G.lives = LIVES;
    G.nextLife = LIFE_EVERY;
    G.maxCombo = 0;
    G.coins = isCore() ? 6 : 0;
    G.hammer = false;
    G.charm = false;
    G.why = '';
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isCore() ? '仙核 · 更密更快' : '仙童 · ' + STAGES[0].name, false, !isCore());
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('boy');
    else startGame(G.kind);
  }

  function goLose() {
    G.mode = 'lose';
    saveBest();
    audio.lose();
    kick(8, 'die');
    const why = G.why === 'hunger' ? '饿倒了' : G.why === 'fall' ? '掉下去了' : '被撞到了';
    showOverlay('lose', why, '分数 ' + G.score + ' · 最高 ' + G.best + ' · 连击 ' + G.maxCombo);
    syncHud();
  }

  function goWin() {
    const bonus = 8000 * (isCore() ? 2 : 1);
    addScore(bonus);
    G.mode = 'win';
    saveBest();
    audio.win();
    kick(4, 'win-flash');
    screenFlash(GOLD, 0.45);
    showOverlay('win', isCore() ? '仙核打穿' : '林道打通', '分数 ' + G.score + ' · 最高 ' + G.best + ' · 连击 ' + G.maxCombo);
    if (stageEl) stageEl.classList.add('win-flash');
    syncHud();
  }

  function nextStage() {
    const bonus = SCORE.stage * G.stage * G.mult;
    addScore(bonus);
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    const keepHammer = G.hammer;
    const keepCharm = G.charm;
    const keepCoins = G.coins;
    G.stage += 1;
    loadStage(G.stage, true);
    G.hammer = keepHammer;
    G.charm = keepCharm;
    G.coins = keepCoins;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    syncHud();
  }

  function respawn() {
    G.player = makePlayer(G.checkX, G.checkY);
    G.deadT = 0;
    G.invuln = INVULN;
    G.vit = Math.max(G.vit, 42);
    G.hungry = false;
    G.hammers.length = 0;
    G.blobs.length = 0;
    G.shocks.length = 0;
    G.smashT = 0;
    G.smashCd = 0;
    syncHud();
  }

  function die(why) {
    if (!playing() || G.deadT > 0) return;
    if (why === 'hit' && G.charm) {
      G.charm = false;
      G.invuln = 1.05;
      G.player.vy = -200;
      G.player.vx = -G.player.face * 180;
      juice(G.player.x, G.player.y - 12, MAG, 0.95);
      hitStop(0.045);
      kick(3.4, 'hit');
      audio.charm();
      toast('护符碎了', true, false);
      syncHud();
      return;
    }
    G.why = why;
    G.deadT = DIE_T;
    G.lives -= 1;
    G.player.vy = -220;
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    juice(G.player.x, G.player.y - 12, MAG, 1.4);
    hitStop(0.07);
    kick(6.5, 'die');
    if (why === 'hunger') audio.starve();
    else audio.death();
    syncHud();
  }

  function giveCoins(n, x, y) {
    G.coins += n;
    const sc = (n > 1 ? SCORE.bag : 80) * G.mult;
    addScore(sc);
    floatText(x, y - 12, '+' + n + '币', GOLD, n > 1);
    audio.coin(G.combo);
    syncHud();
  }

  function giveLife(x, y) {
    if (G.lives < LIFE_CAP) G.lives += 1;
    bumpCombo();
    addScore(800 * G.mult);
    floatText(x, y - 14, '1UP', LEAF, true);
    juice(x, y, LEAF, 1.2);
    audio.oneup();
    toast('额外一命', false, true);
    syncHud();
  }

  function giveHammer(x, y) {
    G.hammer = true;
    bumpCombo();
    addScore(400 * G.mult);
    floatText(x, y - 14, '石锤', CYN, true);
    juice(x, y, CYN, 1.15);
    audio.shop();
    toast('石锤 · 砸出飞锤', false, true);
    syncHud();
  }

  function giveCharm(x, y) {
    G.charm = true;
    bumpCombo();
    addScore(300 * G.mult);
    floatText(x, y - 14, '护符', MAG, true);
    juice(x, y, MAG, 1.05);
    audio.shop();
    toast('护符 · 挡一次撞击', false, true);
    syncHud();
  }

  function smashBag(b) {
    if (b.smashed) return;
    b.smashed = true;
    b.pop = 0.2;
    bumpCombo();
    const cx = b.x;
    const cy = b.y - 12;
    juice(cx, cy, GOLD, 1.1);
    hitStop(0.05);
    kick(3.2, 'boom');
    audio.hit(G.combo);
    giveCoins(5, cx, cy);
    G.checkX = b.x;
    G.checkY = b.y;
    syncHud();
  }

  function buyShop(s) {
    if (s.sold) return;
    const cost = shopCost(s.item);
    if (G.coins < cost) {
      audio.noPay();
      toast('钱不够 · ' + cost + ' 币', true, false);
      s.pop = 0.12;
      return;
    }
    if (s.item === 'hammer' && G.hammer) {
      toast('已经有石锤', true, false);
      s.pop = 0.1;
      return;
    }
    if (s.item === 'charm' && G.charm) {
      toast('已经有护符', true, false);
      s.pop = 0.1;
      return;
    }
    G.coins -= cost;
    s.sold = true;
    s.pop = 0.2;
    addScore(SCORE.shop * G.mult);
    audio.shop();
    juice(s.x, s.y - 14, GOLD, 0.9);
    hitStop(0.04);
    if (s.item === 'life') giveLife(s.x, s.y);
    else if (s.item === 'charm') giveCharm(s.x, s.y);
    else giveHammer(s.x, s.y);
    G.checkX = s.x;
    G.checkY = s.y;
    syncHud();
  }

  function fruitPop(f) {
    const spec = FRUIT[f.kind] || FRUIT.orange;
    f.taken = true;
    bumpCombo();
    const sc = spec.score * G.mult;
    addScore(sc);
    G.vit = Math.min(VIT_MAX, G.vit + spec.vit);
    G.hungry = false;
    floatText(f.x, f.y - 10, '+' + sc, spec.rgb, f.kind === 'melon');
    juice(f.x, f.y, spec.rgb, f.kind === 'melon' ? 1.35 : 0.95);
    hitStop(f.kind === 'melon' ? 0.055 : 0.032);
    audio.fruit(G.combo);
    if (vitWrap) {
      vitWrap.classList.remove('hot');
      void vitWrap.offsetWidth;
      vitWrap.classList.add('hot');
      vitHotTok += 1;
      const tok = vitHotTok;
      setTimeout(function () {
        if (tok === vitHotTok && vitWrap) vitWrap.classList.remove('hot');
      }, 280);
    }
    G.checkX = f.x;
    G.checkY = platUnder(f.x, f.y + 18, null) ? f.y + 18 : GY;
    syncHud();
  }

  function hurtEnt(e, fromShot) {
    if (e.dead || e.hurt > 0) return;
    e.hp -= 1;
    e.hurt = 0.08;
    const p = G.player;
    if (e.hp <= 0) {
      e.dead = true;
      bumpCombo();
      const base = e.name ? SCORE.boss : killScore(e.kind);
      const sc = base * G.mult;
      addScore(sc);
      G.coins += e.name ? 3 : 1;
      floatText(e.x, e.y - 24, '+' + sc, e.name ? GOLD : HOT, !!e.name);
      juice(e.x, e.y - 10, e.name ? LAVA : (e.kind.indexOf('frog') >= 0 ? LEAF : e.kind === 'bee' ? GOLD : PNK), e.name ? 1.7 : 1.15);
      hitStop(e.name ? 0.07 : fromShot ? 0.05 : 0.055);
      audio.hit(G.combo);
      if (e.name) {
        G.lock = 0.55;
        G.clearT = 1.15;
        toast(e.name + ' 倒下', false, true);
        screenFlash(GOLD, 0.4);
        kick(5, 'boom');
      }
      syncHud();
    } else {
      e.x += (p && p.x < e.x ? 12 : -12);
      juice(e.x, e.y - 12, GOLD, 0.5);
      hitStop(0.04);
      audio.hit(G.combo);
      floatText(e.x, e.y - 22, '-' + e.hp, GOLD, false);
    }
  }

  function trySmashHits() {
    const box = smashBox();
    if (!box) return;
    let i, e, b, s;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (aabb(box.x, box.y, box.w, box.h, e.x - e.w / 2, e.y - e.h, e.w, e.h)) {
        hurtEnt(e, false);
      }
    }
    if (G.boss && G.boss.active && !G.boss.dead) {
      e = G.boss;
      if (aabb(box.x, box.y, box.w, box.h, e.x - e.w / 2, e.y - e.h, e.w, e.h)) {
        hurtEnt(e, false);
      }
    }
    for (i = 0; i < G.bags.length; i++) {
      b = G.bags[i];
      if (b.smashed) continue;
      if (aabb(box.x, box.y, box.w, box.h, b.x - 10, b.y - 18, 20, 18)) smashBag(b);
    }
    for (i = 0; i < G.shops.length; i++) {
      s = G.shops[i];
      if (aabb(box.x, box.y, box.w, box.h, s.x - 16, s.y - 36, 32, 36)) buyShop(s);
    }
    for (i = G.blobs.length - 1; i >= 0; i--) {
      b = G.blobs[i];
      if (aabb(box.x, box.y, box.w, box.h, b.x - 6, b.y - 6, 12, 12)) {
        juice(b.x, b.y, LEAF, 0.55);
        G.blobs.splice(i, 1);
        bumpCombo();
        addScore(SCORE.smash * G.mult);
      }
    }
  }

  function doSmash() {
    if (!playing() && G.mode !== 'title') return;
    if (G.deadT > 0 || G.lock > 0) return;
    if (G.smashCd > 0) return;
    const p = G.player;
    if (!p) return;
    G.smashCd = SMASH_CD * (G.hammer ? 0.82 : 1);
    G.smashT = SMASH_T;
    p.pose = SMASH_T;
    audio.smash();
    emit(6, {
      x: p.x + p.face * 18, y: p.y - 14, j: 6,
      vx0: p.face * 80, vx1: p.face * 220, vy0: -120, vy1: 40,
      life: 0.18, r0: 1, r1: 2.6, rgb: G.hammer ? SAND : CYN, g: 180
    });
    popSpark(p.x + p.face * 22, p.y - 12, HOT, 12);
    hitStop(0.032);
    kick(1.8, 'thump');
    trySmashHits();
    if (G.hammer) {
      G.hammers.push({
        x: p.x + p.face * 16,
        y: p.y - 16,
        vx: p.face * HAMMER_SPD,
        vy: -30,
        life: HAMMER_LIFE,
        spin: 0,
        face: p.face
      });
    }
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.u = pitAhead(p.x, 1) && p.grounded;
    if (G.smashCd <= 0) {
      let i, e;
      for (i = 0; i < G.ents.length; i++) {
        e = G.ents[i];
        if (e.dead) continue;
        if (e.x > p.x && e.x < p.x + 70 && Math.abs(e.y - p.y) < 40) {
          doSmash();
          break;
        }
      }
    }
    if (p.x > 980) {
      loadStage(1, false);
      G.vit = VIT_MAX;
    }
  }

  function updatePlayer(dt) {
    const p = G.player;
    if (G.deadT > 0) {
      G.deadT -= dt;
      p.vy += GRAV * dt;
      p.y += p.vy * dt * 0.45;
      p.squash = 1.16;
      if (G.deadT <= 0) {
        if (G.lives <= 0) goLose();
        else respawn();
      }
      return;
    }
    if (G.lock > 0) return;

    let ax = 0;
    if (inL()) ax -= 1;
    if (inR()) ax += 1;
    if (ax) p.face = ax;
    const spd = SKATE_SPD * (p.grounded ? 1 : AIR);
    p.vx = ax * spd;
    p.x += p.vx * dt;
    p.x = clamp(p.x, 16, G.levelW - 16);
    if (G.boss && G.boss.active && !G.boss.dead) {
      p.x = clamp(p.x, G.arena + 10, G.levelW - 24);
    }

    if (inU()) G.jumpBuf = BUFFER;
    else G.jumpBuf -= dt;
    if (G.jumpBuf < 0) G.jumpBuf = 0;

    if (p.grounded && inD() && G.dropT <= 0) {
      const under = platUnder(p.x, p.y, null);
      if (under && !under.base) {
        G.dropPlat = under;
        G.dropT = 0.18;
        p.vy = 80;
        p.grounded = false;
      }
    }
    if (G.dropT > 0) G.dropT -= dt;
    else G.dropPlat = null;

    const canJump = p.grounded || p.coyote > 0;
    if (G.jumpBuf > 0 && canJump) {
      p.vy = -JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      G.jumpBuf = 0;
      p.squash = 0.76;
      audio.hop();
      emit(5, {
        x: p.x, y: p.y, j: 8,
        vx0: -70, vx1: 70, vy0: -20, vy1: 40,
        life: 0.2, r0: 1, r1: 2.2, rgb: CYN, g: 200
      });
      hitStop(0.028);
    }
    if (!inU() && p.vy < -80) p.vy *= Math.pow(0.42, dt * 8);

    p.vy += GRAV * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    const y0 = p.y;
    let y1 = p.y + p.vy * dt;
    p.grounded = false;
    if (p.vy >= 0) {
      const plat = landOn(p.x, y0, y1, G.dropPlat);
      if (plat) {
        y1 = plat.y;
        if (p.vy > 220) {
          audio.land();
          p.squash = 0.82;
          emit(6, {
            x: p.x, y: p.y, j: 10,
            vx0: -90, vx1: 90, vy0: -30, vy1: 10,
            life: 0.2, r0: 1, r1: 2.4, rgb: CYN, g: 180
          });
          kick(1.6, 'thump');
        }
        p.vy = 0;
        p.grounded = true;
        p.coyote = COYOTE;
      }
    }
    p.y = y1;
    if (p.grounded) p.coyote = COYOTE;
    else p.coyote -= dt;

    if (p.y > VH + 90) die('fall');

    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    if (ax && p.grounded) p.run += dt * 16;
    else p.run += dt * 3;
    if (p.pose > 0) p.pose -= dt;
    if (G.smashT > 0) G.smashT -= dt;

    G.sparkT -= dt;
    if (p.grounded && Math.abs(p.vx) > 40 && G.sparkT <= 0) {
      G.sparkT = 0.04;
      emit(2, {
        x: p.x - p.face * 10, y: p.y, j: 4,
        vx0: -p.face * 90, vx1: -p.face * 20, vy0: -90, vy1: -10,
        life: 0.22, r0: 1, r1: 2.4, rgb: CYN, g: 80
      });
      if (Math.random() < 0.16) audio.spark();
    }

    let i;
    for (i = 0; i < G.fruit.length; i++) {
      const f = G.fruit[i];
      if (f.taken) continue;
      if (hypot(p.x - f.x, (p.y - 12) - f.y) < 22) fruitPop(f);
    }

    if (playing() && G.invuln <= 0 && G.smashT <= 0) {
      for (i = 0; i < G.ents.length; i++) {
        const e = G.ents[i];
        if (e.dead) continue;
        if (aabb(p.x - PW / 2 + 3, p.y - PH + 4, PW - 6, PH - 6, e.x - e.w / 2, e.y - e.h, e.w, e.h)) {
          die('hit');
          return;
        }
      }
      const b = G.boss;
      if (b && b.active && !b.dead) {
        if (aabb(p.x - PW / 2 + 3, p.y - PH + 4, PW - 6, PH - 6, b.x - b.w / 2, b.y - b.h, b.w, b.h)) {
          die('hit');
          return;
        }
      }
    }
  }

  function updateHammers(dt) {
    let i, a, j, e;
    for (i = G.hammers.length - 1; i >= 0; i--) {
      a = G.hammers[i];
      a.life -= dt;
      a.vy += 220 * dt;
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.spin += dt * 16 * a.face;
      if (a.life <= 0 || a.y > VH + 40) {
        G.hammers.splice(i, 1);
        continue;
      }
      let hit = false;
      for (j = 0; j < G.ents.length; j++) {
        e = G.ents[j];
        if (e.dead) continue;
        if (aabb(a.x - 8, a.y - 8, 16, 16, e.x - e.w / 2, e.y - e.h, e.w, e.h)) {
          hurtEnt(e, true);
          hit = true;
          break;
        }
      }
      if (!hit && G.boss && G.boss.active && !G.boss.dead) {
        e = G.boss;
        if (aabb(a.x - 8, a.y - 8, 16, 16, e.x - e.w / 2, e.y - e.h, e.w, e.h)) {
          hurtEnt(e, true);
          hit = true;
        }
      }
      if (!hit) {
        for (j = 0; j < G.bags.length; j++) {
          const bag = G.bags[j];
          if (bag.smashed) continue;
          if (aabb(a.x - 8, a.y - 8, 16, 16, bag.x - 10, bag.y - 18, 20, 18)) {
            smashBag(bag);
            hit = true;
            break;
          }
        }
      }
      if (hit) {
        emit(8, {
          x: a.x, y: a.y, j: 6,
          vx0: -160, vx1: 160, vy0: -200, vy1: 40,
          life: 0.22, r0: 1, r1: 2.6, rgb: SAND, g: 240
        });
        popSpark(a.x, a.y, GOLD, 12);
        G.hammers.splice(i, 1);
      }
    }
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    const mul = spdMul(isCore(), G.stage);
    const p = G.player;
    e.t += dt;
    if (e.hurt > 0) e.hurt -= dt;

    if (e.kind === 'bee') {
      e.x += e.face * 70 * mul * dt;
      if (e.x < e.a || e.x > e.b) e.face = -e.face;
      e.y = e.baseY - 36 - Math.sin(e.t * 3.2) * 16;
      return;
    }

    if (!e.grounded) {
      e.vy += GRAV * dt;
      const y0 = e.y;
      const y1 = e.y + e.vy * dt;
      const plat = landOn(e.x, y0, y1, null);
      if (plat && e.vy >= 0) {
        e.y = plat.y;
        e.vy = 0;
        e.grounded = true;
      } else e.y = y1;
    }

    if (e.kind === 'snail') {
      const spd = 48 * mul;
      const nx = e.x + e.face * spd * dt;
      if (nx < e.a || nx > e.b || !standAt(nx + e.face * 10, e.y)) e.face = -e.face;
      else e.x = nx;
    } else if (e.kind === 'frog') {
      if (e.grounded) {
        e.hop -= dt;
        if (e.hop <= 0) {
          if (Math.abs(p.x - e.x) < 260) e.face = p.x > e.x ? 1 : -1;
          e.vy = -420;
          e.vx = e.face * 140 * mul;
          e.grounded = false;
          e.hop = rand(0.7, 1.35) / mul;
        }
      } else {
        e.x += e.vx * dt;
        e.x = clamp(e.x, e.a, e.b);
      }
    } else if (e.kind === 'hog') {
      if (e.charge > 0) {
        e.charge -= dt;
        const nx = e.x + e.face * 210 * mul * dt;
        if (nx < e.a || nx > e.b || !standAt(nx + e.face * 10, e.y)) {
          e.face = -e.face;
          e.charge = 0;
        } else e.x = nx;
      } else {
        const spd = 54 * mul;
        const nx = e.x + e.face * spd * dt;
        if (nx < e.a || nx > e.b || !standAt(nx + e.face * 10, e.y)) e.face = -e.face;
        else e.x = nx;
        if (Math.abs(p.y - e.y) < 18 && Math.abs(p.x - e.x) < 160 && (p.x - e.x) * e.face > 0) {
          e.charge = 0.55;
        }
      }
    }
  }

  function spawnBlob(b) {
    G.blobs.push({
      x: b.x + b.face * 16,
      y: b.y - 22,
      vx: b.face * 180,
      vy: -220,
      life: 1.6
    });
  }

  function spawnShock(b) {
    G.shocks.push({
      x: b.x, y: GY, vx: b.face * 220, life: 1.1, w: 28
    });
    audio.slam();
    kick(3.2, 'thump');
    emit(10, {
      x: b.x, y: GY, j: 14,
      vx0: -120, vx1: 120, vy0: -160, vy1: -20,
      life: 0.3, r0: 1.5, r1: 3.4, rgb: LAVA, g: 260
    });
  }

  function spawnFire(b) {
    G.blobs.push({
      x: b.x + b.face * 18,
      y: b.y - 24,
      vx: b.face * 240,
      vy: -80,
      life: 1.4,
      fire: true
    });
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    const p = G.player;
    if (!b.active) {
      if (playing() && p.x > G.arena + 40) {
        b.active = true;
        toast('头目现身 · ' + b.name, false, true);
        audio.boss();
        screenFlash(HOT, 0.3);
        kick(3.4, 'boom');
      }
      return;
    }
    b.t += dt;
    if (b.hurt > 0) b.hurt -= dt;
    b.atk -= dt;
    const mul = spdMul(isCore(), G.stage);
    const low = b.hp / b.max < 0.45;

    if (!b.grounded) {
      b.vy += GRAV * dt;
      const y0 = b.y;
      const y1 = b.y + b.vy * dt;
      const plat = landOn(b.x, y0, y1, null);
      if (plat && b.vy >= 0) {
        b.y = plat.y;
        b.vy = 0;
        b.grounded = true;
        if (b.kind === 'bliz' || b.kind === 'bking') spawnShock(b);
      } else b.y = y1;
    }

    if (b.kind === 'bfrog') {
      if (b.grounded && b.atk <= 0) {
        b.face = p.x > b.x ? 1 : -1;
        b.vy = -520;
        b.vx = b.face * 160 * mul;
        b.grounded = false;
        b.atk = low ? 0.9 : 1.35;
        b.phase += 1;
        if (b.phase % 3 === 0) spawnBlob(b);
      } else if (!b.grounded) {
        b.x += b.vx * dt;
        b.x = clamp(b.x, G.arena + 40, G.levelW - 40);
      }
    } else if (b.kind === 'bliz') {
      const charging = b.atk > 0 && b.phase === 1;
      const spd = (charging ? 220 : 64) * mul;
      if (!charging && b.atk <= 0) {
        b.phase = 1;
        b.atk = low ? 0.65 : 0.5;
        b.face = p.x > b.x ? 1 : -1;
      } else if (charging && b.atk <= 0) {
        b.phase = 0;
        b.atk = low ? 1.0 : 1.5;
        if (b.grounded) {
          b.vy = -360;
          b.grounded = false;
        }
      }
      const nx = b.x + b.face * spd * dt;
      if (nx < G.arena + 40 || nx > G.levelW - 40) b.face = -b.face;
      else b.x = nx;
    } else {
      if (b.grounded && b.atk <= 0) {
        b.face = p.x > b.x ? 1 : -1;
        b.phase += 1;
        if (b.phase % 2 === 0) {
          b.vy = -460;
          b.vx = b.face * 120 * mul;
          b.grounded = false;
          spawnFire(b);
        } else {
          b.vx = b.face * 200 * mul;
          spawnFire(b);
        }
        b.atk = low ? 0.85 : 1.25;
      } else if (b.grounded) {
        const nx = b.x + b.face * 80 * mul * dt;
        if (nx < G.arena + 40 || nx > G.levelW - 40) b.face = -b.face;
        else b.x = nx;
      } else {
        b.x += b.vx * dt;
        b.x = clamp(b.x, G.arena + 40, G.levelW - 40);
      }
    }
  }

  function updateHazards(dt) {
    const p = G.player;
    let i, o;
    for (i = G.blobs.length - 1; i >= 0; i--) {
      o = G.blobs[i];
      o.life -= dt;
      o.vy += (o.fire ? 480 : 620) * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      if (o.life <= 0 || o.y > VH + 20) {
        G.blobs.splice(i, 1);
        continue;
      }
      if (playing() && G.deadT <= 0 && G.invuln <= 0 && G.smashT <= 0 && hypot(p.x - o.x, p.y - 12 - o.y) < 16) {
        die('hit');
        G.blobs.splice(i, 1);
      }
    }
    for (i = G.shocks.length - 1; i >= 0; i--) {
      o = G.shocks[i];
      o.life -= dt;
      o.x += o.vx * dt;
      o.w = lerp(o.w, 46, 1 - Math.pow(0.02, dt));
      if (o.life <= 0) {
        G.shocks.splice(i, 1);
        continue;
      }
      if (playing() && G.deadT <= 0 && G.invuln <= 0 && p.grounded) {
        if (Math.abs(p.x - o.x) < o.w * 0.55 && Math.abs(p.y - o.y) < 10) die('hit');
      }
    }
    for (i = 0; i < G.bags.length; i++) {
      if (G.bags[i].pop > 0) G.bags[i].pop -= dt;
    }
    for (i = 0; i < G.shops.length; i++) {
      if (G.shops[i].pop > 0) G.shops[i].pop -= dt;
    }
  }

  function updateFx(dt) {
    let i, o;
    for (i = particles.length - 1; i >= 0; i--) {
      o = particles[i];
      o.life -= dt;
      o.vy += o.g * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      if (o.life <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.4) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      o = floats[i];
      o.t += dt;
      o.y -= o.vy * dt;
      if (o.t > o.life) floats.splice(i, 1);
    }
  }

  function updateCam(dt) {
    const p = G.player;
    let tx = p.x - VW * 0.32;
    if (G.boss && G.boss.active && !G.boss.dead) tx = G.levelW - VW;
    tx = clamp(tx, 0, Math.max(0, G.levelW - VW));
    G.camX = lerp(G.camX, tx, 1 - Math.pow(0.0008, dt));
    let ty = 0;
    if (p.y < MY - 10) ty = p.y - MY;
    G.camY = lerp(G.camY, clamp(ty, -40, 20), 1 - Math.pow(0.002, dt));
  }

  function update(dt) {
    G.clock += dt;
    if (G.toastT > 0) G.toastT -= dt;
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0004, dt));

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.35);
      return;
    }

    if (G.mode === 'title') demoThink();
    if (G.mode === 'win' || G.mode === 'lose') {
      updateFx(dt);
      return;
    }

    if (G.smashCd > 0) G.smashCd -= dt;
    if (G.invuln > 0) G.invuln -= dt;
    if (G.lock > 0) G.lock -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }

    if (playing() && G.deadT <= 0 && G.lock <= 0) {
      G.vit -= drainRate(isCore()) * dt;
      if (G.vit < 26 && !G.hungry) {
        G.hungry = true;
        toast('饿了', true, false);
      }
      G.beatT -= dt;
      if (G.vit < 26 && G.beatT <= 0) {
        G.beatT = 0.72;
        audio.hunger();
      }
      if (G.vit <= 0) {
        G.vit = 0;
        die('hunger');
      }
    }

    updatePlayer(dt);
    updateHammers(dt);
    let i;
    for (i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    updateBoss(dt);
    updateHazards(dt);
    updateFx(dt);
    updateCam(dt);

    if (G.clearT > 0) {
      G.clearT -= dt;
      if (G.clearT <= 0 && G.lock <= 0) nextStage();
    }

    if (vitBar) vitBar.style.transform = 'scaleX(' + clamp(G.vit / VIT_MAX, 0, 1) + ')';
    if ((G.clock * 8 | 0) !== ((G.clock - dt) * 8 | 0)) syncHud();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (G.stage === 1) {
      g.addColorStop(0, '#102018');
      g.addColorStop(0.5, '#182808');
      g.addColorStop(1, '#141806');
    } else if (G.stage === 2) {
      g.addColorStop(0, '#081418');
      g.addColorStop(0.5, '#0c2018');
      g.addColorStop(1, '#0a160c');
    } else {
      g.addColorStop(0, '#180808');
      g.addColorStop(0.5, '#241008');
      g.addColorStop(1, '#140804');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const sunX = sx(G.camX + VW * 0.78);
    const sunY = sy(46);
    ctx.fillStyle = rgba(GOLD, G.stage === 3 ? 0.28 : 0.5);
    ctx.beginPath();
    ctx.arc(sunX, sunY, 28 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.beginPath();
    ctx.arc(sunX, sunY, 14 * scale, 0, TAU);
    ctx.fill();
  }

  function drawHills() {
    const s = scale;
    let k, x, h;
    ctx.fillStyle = G.stage === 3 ? 'rgba(80, 24, 12, 0.55)' : G.stage === 2 ? 'rgba(10, 42, 28, 0.55)' : 'rgba(22, 48, 12, 0.52)';
    ctx.beginPath();
    ctx.moveTo(ox, oy + VH * s);
    for (k = 0; k <= 12; k++) {
      x = ox + (k / 12) * VW * s;
      h = 70 + hash2(k * 17 + G.stage * 9) * 50;
      ctx.lineTo(x, sy(GY - 40) - h * s * 0.25 + (G.camX * 0.08 % 40));
    }
    ctx.lineTo(ox + VW * s, oy + VH * s);
    ctx.fill();

    const start = ((G.camX * 0.35) / 90 | 0) - 1;
    for (k = start; k < start + 12; k++) {
      x = (k * 90) - (G.camX * 0.35 % 90);
      const px = ox + x * s;
      const base = sy(GY - 8);
      const tall = 48 + hash2(k * 3 + 2) * 36;
      ctx.fillStyle = G.stage === 3 ? rgba(LAVA, 0.18) : rgba(LEAF, G.stage === 2 ? 0.28 : 0.22);
      ctx.beginPath();
      ctx.moveTo(px, base);
      ctx.lineTo(px + 8 * s, base - tall * s);
      ctx.lineTo(px + 16 * s, base);
      ctx.fill();
      ctx.fillStyle = G.stage === 3 ? rgba(HOT, 0.35) : rgba(LEAF, 0.58);
      ctx.beginPath();
      ctx.ellipse(px + 8 * s, base - tall * s, 16 * s, 8 * s, 0, 0, TAU);
      ctx.fill();
    }
  }

  function drawPlats() {
    const s = scale;
    let i, p, x, y, w, h, k, n;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      x = sx(p.x);
      y = sy(p.y);
      w = p.w * s;
      h = p.h * s;
      ctx.fillStyle = p.base ? (G.stage === 3 ? '#2a1008' : '#142008') : '#1a280c';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(p.base ? HOT : GOLD, p.base ? 0.85 : 0.55);
      ctx.fillRect(x, y, w, 2.4 * s);
      ctx.fillStyle = rgba(CYN, 0.18);
      ctx.fillRect(x + 2 * s, y + 2.4 * s, w - 4 * s, 1.1 * s);
      if (p.base) {
        n = Math.max(2, (p.w / 28) | 0);
        for (k = 0; k <= n; k++) {
          ctx.fillStyle = k % 2 ? rgba(HOT, 0.22) : rgba(SAND, 0.28);
          ctx.fillRect(x + (k / n) * w, y, 2 * s, 5 * s);
        }
        if (G.stage === 3) {
          ctx.fillStyle = rgba(LAVA, 0.22 + Math.sin(G.clock * 4 + p.x) * 0.08);
          ctx.fillRect(x, y + h - 8 * s, w, 8 * s);
        }
      }
    }
  }

  function drawFruit(f) {
    if (f.taken) return;
    const bob = Math.sin(G.clock * 4 + f.t) * 3;
    const x = sx(f.x);
    const y = sy(f.y + bob);
    const s = scale;
    const spec = FRUIT[f.kind] || FRUIT.orange;
    ctx.fillStyle = rgba(spec.rgb, 0.18);
    ctx.beginPath();
    ctx.arc(x, y, 11 * s, 0, TAU);
    ctx.fill();
    if (f.kind === 'banana') {
      ctx.strokeStyle = rgba(GOLD, 0.95);
      ctx.lineWidth = 3.2 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(x, y + 1 * s, 6 * s, 0.4, 2.5);
      ctx.stroke();
    } else if (f.kind === 'melon') {
      ctx.fillStyle = rgba(LEAF, 0.95);
      ctx.beginPath();
      ctx.ellipse(x, y, 7.2 * s, 6 * s, 0.2, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(WHT, 0.55);
      ctx.lineWidth = 1.1 * s;
      ctx.beginPath();
      ctx.moveTo(x - 5 * s, y - 2 * s);
      ctx.lineTo(x + 5 * s, y + 2 * s);
      ctx.stroke();
    } else {
      ctx.fillStyle = rgba(spec.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(x, y, 6.2 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(LEAF, 0.9);
      ctx.fillRect(x - 1 * s, y - 9 * s, 2 * s, 4 * s);
    }
  }

  function drawBag(b) {
    if (b.smashed) return;
    const pop = b.pop > 0 ? 1 - b.pop / 0.2 : 1;
    const x = sx(b.x);
    const y = sy(b.y);
    const s = scale * (0.88 + pop * 0.12);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = rgba(WOOD, 0.95);
    ctx.fillRect(-8 * s, -16 * s, 16 * s, 16 * s);
    ctx.strokeStyle = rgba(GOLD, 0.9);
    ctx.lineWidth = 1.4 * s;
    ctx.strokeRect(-8 * s, -16 * s, 16 * s, 16 * s);
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(0, -8 * s, 3.2 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawShop(s) {
    const pop = s.pop > 0 ? 1 + s.pop * 0.4 : 1;
    const x = sx(s.x);
    const y = sy(s.y);
    const sc = scale * pop;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = s.sold ? 'rgba(40,48,20,0.7)' : rgba(WOOD, 0.95);
    ctx.fillRect(-14 * sc, -34 * sc, 28 * sc, 34 * sc);
    ctx.fillStyle = s.sold ? rgba(SAND, 0.4) : rgba(HOT, 0.9);
    ctx.beginPath();
    ctx.moveTo(-16 * sc, -32 * sc);
    ctx.lineTo(0, -48 * sc);
    ctx.lineTo(16 * sc, -32 * sc);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.font = 'bold ' + (9 * sc) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.sold ? '售罄' : shopName(s.item), 0, -16 * sc);
    if (!s.sold) {
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.font = (8 * sc) + 'px sans-serif';
      ctx.fillText(shopCost(s.item) + '币', 0, -4 * sc);
    }
    ctx.restore();
  }

  function drawHammer(a) {
    const x = sx(a.x);
    const y = sy(a.y);
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a.spin);
    ctx.strokeStyle = rgba(SAND, 0.95);
    ctx.lineWidth = 2.4 * s;
    ctx.beginPath();
    ctx.moveTo(-6 * s, 0);
    ctx.lineTo(7 * s, 0);
    ctx.stroke();
    ctx.fillStyle = rgba(HOT2, 0.95);
    ctx.fillRect(4 * s, -6 * s, 9 * s, 12 * s);
    ctx.fillStyle = rgba(CYN, 0.55);
    ctx.fillRect(5 * s, -4 * s, 7 * s, 3 * s);
    ctx.restore();
  }

  function drawSnail(e) {
    const blink = e.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale * (e.name ? 1.7 : 1);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, 1);
    ctx.fillStyle = rgba(PNK, 0.95);
    ctx.beginPath();
    ctx.ellipse(2 * s, -4 * s, 8 * s, 4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(SAND, 0.95);
    ctx.beginPath();
    ctx.arc(-2 * s, -10 * s, 8 * s, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(HOT, 0.85);
    ctx.lineWidth = 1.4 * s;
    ctx.beginPath();
    ctx.arc(-2 * s, -10 * s, 5 * s, 0.4, 3.4);
    ctx.stroke();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.fillRect(6 * s, -8 * s, 2.2 * s, 1.6 * s);
    ctx.restore();
  }

  function drawFrog(e) {
    const blink = e.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale * (e.name ? 1.65 : 1);
    const squat = e.grounded ? 1 : 0.82;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, squat);
    ctx.fillStyle = rgba(LEAF, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -8 * s, 11 * s, 8 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.8);
    ctx.beginPath();
    ctx.ellipse(2 * s, -6 * s, 6 * s, 4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.arc(4 * s, -14 * s, 3.2 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#102018';
    ctx.beginPath();
    ctx.arc(5 * s, -14 * s, 1.4 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBee(e) {
    const blink = e.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    const flap = 0.4 + Math.sin(G.clock * 28) * 0.35;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, 1);
    ctx.fillStyle = rgba(CYN, 0.45);
    ctx.beginPath();
    ctx.ellipse(-2 * s, -10 * s, 7 * s, 3.5 * s * flap, -0.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -4 * s, 7 * s, 5 * s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#102018';
    ctx.lineWidth = 1.4 * s;
    ctx.beginPath();
    ctx.moveTo(-3 * s, -4 * s);
    ctx.lineTo(3 * s, -4 * s);
    ctx.stroke();
    ctx.fillStyle = '#102018';
    ctx.beginPath();
    ctx.arc(4 * s, -6 * s, 1.2 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawHog(e) {
    const blink = e.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale * (e.name ? 1.55 : 1);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, 1);
    ctx.fillStyle = rgba(e.charge > 0 ? LAVA : SAND, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -8 * s, 14 * s, 9 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(PNK, 0.9);
    ctx.beginPath();
    ctx.ellipse(10 * s, -6 * s, 5 * s, 4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.moveTo(6 * s, -14 * s);
    ctx.lineTo(8 * s, -20 * s);
    ctx.lineTo(10 * s, -14 * s);
    ctx.fill();
    ctx.fillStyle = '#1a1008';
    ctx.beginPath();
    ctx.arc(8 * s, -10 * s, 1.5 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawKing(e) {
    const blink = e.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale * 1.7;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, 1);
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -12 * s, 16 * s, 14 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.moveTo(-8 * s, -24 * s);
    ctx.lineTo(0, -34 * s);
    ctx.lineTo(8 * s, -24 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(-10 * s, -18 * s, 20 * s, 4 * s);
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.arc(5 * s, -16 * s, 3.4 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#180810';
    ctx.beginPath();
    ctx.arc(6 * s, -16 * s, 1.5 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBoy(p) {
    const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
    if (blink) return;
    const s = scale;
    const sq = p.squash || 1;
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.scale(p.face, sq);

    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 1.5 * s, 13 * s, 3.2 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(-8 * s, 3 * s, 2.1 * s, 0, TAU);
    ctx.arc(8 * s, 3 * s, 2.1 * s, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(GOLD, 0.55 + Math.sin(G.clock * 24) * 0.25);
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.moveTo(-12 * s, 4 * s);
    ctx.lineTo(-18 * s, 1 * s);
    ctx.moveTo(-10 * s, 5 * s);
    ctx.lineTo(-16 * s, 8 * s);
    ctx.stroke();

    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.moveTo(-7 * s, -10 * s);
    ctx.lineTo(7 * s, -11 * s);
    ctx.lineTo(5 * s, -22 * s);
    ctx.lineTo(-5 * s, -21 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.85);
    ctx.fillRect(-6 * s, -12 * s, 12 * s, 2 * s);
    ctx.fillStyle = rgba(SKIN, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -27 * s, 6.4 * s, 6.6 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -31 * s, 7 * s, 4.2 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1008';
    ctx.beginPath();
    ctx.arc(2.4 * s, -27 * s, 1.3 * s, 0, TAU);
    ctx.fill();

    const smashP = p.pose > 0;
    ctx.strokeStyle = rgba(SKIN, 0.9);
    ctx.lineWidth = 1.8 * s;
    ctx.beginPath();
    ctx.moveTo(2 * s, -18 * s);
    ctx.lineTo(smashP ? 16 * s : 6 * s, smashP ? -16 * s : -14 * s);
    ctx.stroke();

    if (smashP) {
      ctx.strokeStyle = rgba(HOT, 0.8);
      ctx.lineWidth = 2.4 * s;
      ctx.beginPath();
      ctx.arc(10 * s, -12 * s, 14 * s, -0.9, 0.6);
      ctx.stroke();
      ctx.strokeStyle = rgba(CYN, 0.7);
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.arc(10 * s, -12 * s, 18 * s, -0.7, 0.45);
      ctx.stroke();
    }

    if (G.hammer && !smashP) {
      ctx.save();
      ctx.translate(8 * s, -14 * s);
      ctx.rotate(-0.5);
      ctx.strokeStyle = rgba(SAND, 0.95);
      ctx.lineWidth = 1.8 * s;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(8 * s, 0);
      ctx.stroke();
      ctx.fillStyle = rgba(HOT2, 0.95);
      ctx.fillRect(6 * s, -4 * s, 7 * s, 8 * s);
      ctx.restore();
    }

    if (G.charm) {
      ctx.strokeStyle = rgba(MAG, 0.7 + Math.sin(G.clock * 8) * 0.2);
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.arc(0, -16 * s, 16 * s, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBlob(o) {
    const x = sx(o.x);
    const y = sy(o.y);
    const s = scale;
    ctx.fillStyle = rgba(o.fire ? LAVA : LEAF, 0.9);
    ctx.beginPath();
    ctx.arc(x, y, 6 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.5);
    ctx.beginPath();
    ctx.arc(x - 1.5 * s, y - 1.5 * s, 2 * s, 0, TAU);
    ctx.fill();
  }

  function drawShock(o) {
    const x = sx(o.x);
    const y = sy(o.y);
    const s = scale;
    ctx.fillStyle = rgba(LAVA, 0.55);
    ctx.beginPath();
    ctx.ellipse(x, y - 4 * s, o.w * 0.55 * s, 6 * s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(HOT, 0.8);
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(x - o.w * 0.4 * s, y - 10 * s);
    ctx.lineTo(x, y - 22 * s);
    ctx.lineTo(x + o.w * 0.4 * s, y - 10 * s);
    ctx.stroke();
  }

  function drawBossBar() {
    const b = G.boss;
    if (!b || !b.active || b.dead) return;
    const x = ox + 80 * scale;
    const y = oy + 12 * scale;
    const w = (VW - 160) * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.fillRect(x, y, w * clamp(b.hp / b.max, 0, 1), 8 * scale);
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.font = 'bold ' + (11 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.name, ox + VW * 0.5 * scale, y - 3 * scale);
  }

  function drawFx() {
    let i, o, a;
    for (i = 0; i < rings.length; i++) {
      o = rings[i];
      a = 1 - o.t / 0.4;
      ctx.strokeStyle = rgba(o.rgb, 0.55 * a);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.r + o.t * 90) * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < sparks.length; i++) {
      o = sparks[i];
      a = 1 - o.t / 0.28;
      ctx.fillStyle = rgba(o.rgb, 0.55 * a);
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.rad * a) * scale, 0, TAU);
      ctx.fill();
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

  function drawEnt(e) {
    if (e.dead) return;
    if (e.kind === 'frog' || e.kind === 'bfrog') drawFrog(e);
    else if (e.kind === 'bee') drawBee(e);
    else if (e.kind === 'hog' || e.kind === 'bliz') drawHog(e);
    else if (e.kind === 'bking') drawKing(e);
    else drawSnail(e);
  }

  function draw() {
    dpr = dpr || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#080c03';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    const sh = REDUCE ? 0 : G.shake;
    if (sh > 0) {
      ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh * 0.7);
    }
    if (G.punch !== 1 && !REDUCE) {
      ctx.translate(ox + VW * scale * 0.5, oy + VH * scale * 0.5);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-(ox + VW * scale * 0.5), -(oy + VH * scale * 0.5));
    }
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();

    drawSky();
    drawHills();
    drawPlats();

    let i;
    for (i = 0; i < G.shops.length; i++) drawShop(G.shops[i]);
    for (i = 0; i < G.bags.length; i++) drawBag(G.bags[i]);
    for (i = 0; i < G.fruit.length; i++) drawFruit(G.fruit[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    if (G.boss && !G.boss.dead) drawEnt(G.boss);
    for (i = 0; i < G.blobs.length; i++) drawBlob(G.blobs[i]);
    for (i = 0; i < G.shocks.length; i++) drawShock(G.shocks[i]);
    for (i = 0; i < G.hammers.length; i++) drawHammer(G.hammers[i]);
    if (G.player) drawBoy(G.player);
    drawFx();
    drawBossBar();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
    ctx.restore();
  }

  function resize() {
    if (!stageEl || !canvas) return;
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function primaryAction() {
    if (G.mode === 'title') startGame('boy');
    else if (G.mode === 'win' || G.mode === 'lose') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S'
      || k === 'z' || k === 'Z';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const jumpKey = k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up' || k === 'z' || k === 'Z';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (jumpKey) keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;

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
    if (k === '1' && G.mode === 'title') {
      startGame('boy');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('core');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (playing() || G.mode === 'title') doSmash();
    }
  }

  function bindPad() {
    function hold(el, on, off) {
      if (!el) return;
      const down = function (e) {
        e.preventDefault();
        audio.ensure();
        el.classList.add('held');
        on();
      };
      const up = function (e) {
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
    hold(document.getElementById('btn-jump'), function () { keys.u = true; }, function () { keys.u = false; });
    hold(document.getElementById('btn-smash'), function () {
      if (overlayOpen()) { primaryAction(); return; }
      doSmash();
    }, null);
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen()) return;
      doSmash();
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  let acc = 0;
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = now * 0.001;
      return;
    }
    const t = now * 0.001;
    if (!last) last = t;
    let dt = t - last;
    last = t;
    if (dt > 0.05) dt = 0.05;
    G.t += dt;
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 5) {
      update(STEP);
      acc -= STEP;
      n += 1;
    }
    draw();
  }

  function initMute() {
    let m = false;
    try { m = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { m = false; }
    audio.setMuted(m);
  }

  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();
  bindPad();

  if (btnBoy) {
    btnBoy.addEventListener('click', function () {
      audio.ensure();
      startGame('boy');
    });
  }
  if (btnCore) {
    btnCore.addEventListener('click', function () {
      audio.ensure();
      startGame('core');
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
      if (G.mode === 'win') startGame('core');
      else goTitle();
    });
  }
  if (modeBoy) {
    modeBoy.addEventListener('click', function () {
      audio.ensure();
      startGame('boy');
    });
  }
  if (modeCore) {
    modeCore.addEventListener('click', function () {
      audio.ensure();
      startGame('core');
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
    }
  });

  requestAnimationFrame(frame);
})();
