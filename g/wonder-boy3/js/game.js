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
  const SKATE_SPD = 248;
  const AIR = 0.88;
  const JUMP_V = 500;
  const GRAV = 1450;
  const MAX_FALL = 560;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const PW = 14;
  const PH = 26;
  const INVULN = 1.4;
  const DIE_T = 0.82;
  const VIT_MAX = 100;
  const DRAIN_ISLE = 4.6;
  const DRAIN_CORE = 7.8;
  const SCROLL_ISLE = 104;
  const SCROLL_CORE = 128;
  const SHOT_SPD = 460;
  const SHOT_LIFE = 0.72;
  const SHOT_CD = [0, 0.22, 0.12, 0.16];
  const GUN_MAX = 3;
  const BEST_KEY = 'playbox-wonder-boy3-best';
  const MUTE_KEY = 'playbox-wonder-boy3-mute';
  const OPS = '方向键 / WASD 走 · Shift / 上 跳 · 空格 / Z 射 · 下掉落 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [232, 255, 106];
  const HOT = [198, 255, 42];
  const HOT2 = [220, 255, 120];
  const WHT = [240, 246, 239];
  const LEAF = [61, 255, 154];
  const SAND = [200, 160, 64];
  const SKIN = [255, 224, 176];
  const PNK = [255, 138, 180];
  const LAVA = [255, 106, 50];
  const WOOD = [168, 112, 48];
  const BAT = [144, 160, 200];
  const SLIME = [90, 220, 140];

  const FRUIT = {
    orange: { vit: 20, score: 100, rgb: [255, 140, 40], name: '橙' },
    banana: { vit: 28, score: 200, rgb: GOLD, name: '蕉' },
    melon: { vit: 42, score: 400, rgb: LEAF, name: '瓜' }
  };

  const SCORE = {
    slime: 140, bat: 180, bone: 220, spike: 200, bird: 240,
    chest: 200, orb: 300, boss: 5000, stage: 1800, shot: 40
  };

  const GUN_NAME = ['', '单炎', '连炎', '扇炎'];

  const STAGES = [
    {
      name: '洞窟', boss: '蝠王', w: 2760, hp: 12,
      ground: [[0, 460], [540, 400], [1020, 380], [1500, 420], [2040, 720]],
      plats: [
        [160, MY, 140], [400, MY, 130], [700, MY, 150], [1180, MY, 160],
        [1680, MY, 170], [2140, MY, 160],
        [280, HY, 110], [860, HY, 120], [1380, HY, 130], [1900, HY, 140]
      ],
      fruit: [
        [220, GY, 'orange'], [440, MY, 'banana'], [760, GY, 'orange'],
        [1240, MY, 'banana'], [1640, GY, 'melon'], [1820, MY, 'orange'],
        [2180, GY, 'banana']
      ],
      orbs: [[360, MY], [1100, GY], [1760, HY]],
      chests: [[640, GY], [1320, MY], [1960, GY]],
      ents: [
        [280, GY, 'slime', 20, 440],
        [420, MY, 'bat', 400, 530],
        [660, GY, 'slime', 540, 920],
        [800, GY, 'bone', 540, 920],
        [900, HY, 'bat', 860, 980],
        [1160, GY, 'slime', 1020, 1380],
        [1220, MY, 'bat', 1180, 1340],
        [1340, GY, 'bone', 1020, 1380],
        [1640, GY, 'slime', 1500, 1900],
        [1740, MY, 'bat', 1680, 1850],
        [1840, GY, 'bone', 1500, 1900],
        [2140, GY, 'spike', 2040, 2500]
      ]
    },
    {
      name: '瀑谷', boss: '水蟒', w: 3280, hp: 16,
      ground: [[0, 400], [500, 360], [980, 340], [1460, 380], [1980, 360], [2480, 800]],
      plats: [
        [120, MY, 140], [360, MY, 150], [640, MY, 160], [1100, MY, 170],
        [1580, MY, 180], [2100, MY, 170], [2620, MY, 160],
        [240, HY, 120], [720, HY, 130], [1280, HY, 140], [1760, HY, 150],
        [2280, HY, 140], [2760, HY, 130]
      ],
      fruit: [
        [180, MY, 'orange'], [420, GY, 'banana'], [700, MY, 'orange'],
        [1160, GY, 'banana'], [1400, MY, 'melon'], [1720, GY, 'orange'],
        [1920, HY, 'banana'], [2220, GY, 'orange'], [2580, MY, 'melon']
      ],
      orbs: [[300, HY], [1220, MY], [2040, GY], [2700, HY]],
      chests: [[560, GY], [1520, MY], [2340, GY]],
      ents: [
        [240, GY, 'slime', 20, 380],
        [380, MY, 'bat', 360, 510],
        [580, GY, 'bone', 500, 840],
        [700, MY, 'bird', 640, 800],
        [760, HY, 'bat', 720, 850],
        [1120, GY, 'slime', 980, 1320],
        [1200, MY, 'bat', 1100, 1270],
        [1300, GY, 'spike', 980, 1320],
        [1600, GY, 'bone', 1460, 1840],
        [1680, MY, 'bird', 1580, 1760],
        [1800, GY, 'slime', 1460, 1840],
        [2140, GY, 'spike', 1980, 2320],
        [2220, MY, 'bat', 2100, 2270],
        [2380, GY, 'bone', 1980, 2460],
        [2600, GY, 'bird', 2480, 3000],
        [2720, MY, 'bat', 2620, 2780]
      ]
    },
    {
      name: '魔巢', boss: '巢龙', w: 3840, hp: 22,
      ground: [[0, 380], [480, 340], [940, 360], [1420, 340], [1900, 380], [2420, 360], [2920, 920]],
      plats: [
        [80, MY, 130], [280, MY, 150], [560, MY, 160], [860, MY, 170],
        [1200, MY, 180], [1560, MY, 170], [1960, MY, 190], [2380, MY, 180],
        [2800, MY, 200], [3260, MY, 160],
        [200, HY, 120], [640, HY, 130], [1080, HY, 140], [1520, HY, 150],
        [2040, HY, 160], [2540, HY, 150], [3100, HY, 140]
      ],
      fruit: [
        [160, MY, 'orange'], [400, GY, 'banana'], [640, MY, 'orange'],
        [980, GY, 'melon'], [1260, MY, 'banana'], [1600, GY, 'orange'],
        [1800, HY, 'banana'], [2140, GY, 'melon'], [2460, MY, 'orange'],
        [2760, GY, 'banana'], [3180, MY, 'melon']
      ],
      orbs: [[240, HY], [920, MY], [1680, GY], [2320, HY], [3040, MY]],
      chests: [[520, GY], [1380, MY], [2080, GY], [2880, MY]],
      ents: [
        [220, GY, 'slime', 20, 360],
        [300, MY, 'bat', 280, 430],
        [540, GY, 'bone', 480, 800],
        [620, MY, 'bird', 560, 720],
        [700, HY, 'bat', 640, 770],
        [1040, GY, 'spike', 940, 1280],
        [1140, MY, 'bat', 1080, 1220],
        [1240, GY, 'bone', 940, 1280],
        [1500, GY, 'slime', 1420, 1760],
        [1600, MY, 'bird', 1560, 1730],
        [1720, GY, 'spike', 1420, 1760],
        [2000, GY, 'bone', 1900, 2280],
        [2100, MY, 'bat', 1960, 2150],
        [2200, GY, 'bird', 1900, 2280],
        [2500, GY, 'spike', 2420, 2760],
        [2580, MY, 'bat', 2380, 2560],
        [2680, GY, 'bone', 2420, 2760],
        [3000, GY, 'bird', 2920, 3600],
        [3120, MY, 'bat', 2800, 3000],
        [3300, GY, 'spike', 2920, 3700],
        [3380, MY, 'bone', 3260, 3420]
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
    return core ? DRAIN_CORE : DRAIN_ISLE;
  }
  function scrollSpd(core, stage) {
    const base = core ? SCROLL_CORE : SCROLL_ISLE;
    return base * (1 + Math.max(0, stage - 1) * 0.08);
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
  function killScore(kind) {
    if (kind === 'bat') return SCORE.bat;
    if (kind === 'bone') return SCORE.bone;
    if (kind === 'spike') return SCORE.spike;
    if (kind === 'bird') return SCORE.bird;
    return SCORE.slime;
  }
  function gunName(lv) {
    return GUN_NAME[clamp(lv | 0, 1, GUN_MAX)];
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (drainRate(true) <= drainRate(false)) throw new Error('core hungrier');
    if (scrollSpd(true, 1) <= scrollSpd(false, 1)) throw new Error('core faster scroll');
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('core faster');
    if (SHOT_SPD * SHOT_LIFE < 280) throw new Error('shot reach');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (BEST_KEY !== 'playbox-wonder-boy3-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-wonder-boy3-mute') throw new Error('mute key');
    if (FRUIT.melon.vit <= FRUIT.orange.vit) throw new Error('melon better');
    if (GUN_MAX !== 3) throw new Error('3 gun levels');
    if (SHOT_CD[2] >= SHOT_CD[1]) throw new Error('rapid faster');
    let i, s, j, hasSlime, hasBat, hasOrb, hasChest, hasPit;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length || s.fruit.length < 5) throw new Error('stage goods');
      if (!s.orbs || s.orbs.length < 3) throw new Error('need orbs');
      if (!s.chests || s.chests.length < 2) throw new Error('need chests');
      hasSlime = false;
      hasBat = false;
      hasOrb = s.orbs.length > 0;
      hasChest = s.chests.length > 0;
      hasPit = false;
      for (j = 1; j < s.ground.length; j++) {
        if (s.ground[j][0] > s.ground[j - 1][0] + s.ground[j - 1][1] + 20) hasPit = true;
      }
      for (j = 0; j < s.ents.length; j++) {
        if (s.ents[j][2] === 'slime') hasSlime = true;
        if (s.ents[j][2] === 'bat') hasBat = true;
      }
      if (!hasSlime || !hasBat) throw new Error('need slime bats');
      if (!hasOrb || !hasChest) throw new Error('need orbs chests');
      if (!hasPit) throw new Error('need pits');
    }
    if (STAGES[1].ents.length <= STAGES[0].ents.length) throw new Error('denser later');
    if (STAGES[0].name === '林道' || STAGES[0].name === '圣山') throw new Error('own stages');
    if (STAGES[0].boss === '巨蛙' || STAGES[0].boss === '石灵') throw new Error('own bosses');
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
  const btnIsle = document.getElementById('btn-isle');
  const btnCore = document.getElementById('btn-core');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeIsle = document.getElementById('mode-isle');
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
  const gunLabel = document.getElementById('gun-label');
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
  let ptrFire = false;

  const keys = { l: false, r: false, u: false, d: false, fire: false };
  const demo = { l: false, r: true, u: false, fire: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];

  const G = {
    mode: 'title',
    kind: 'isle',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 2760,
    plats: [],
    fruit: [],
    orbs: [],
    chests: [],
    ents: [],
    shots: [],
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
    gun: 1,
    charm: false,
    fireCd: 0,
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
    sparkT: 0,
    muzzle: 0,
    arena: 0,
    checkX: 160,
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
  function wantFire() {
    if (G.mode === 'title') return demo.fire;
    if (!playing()) return false;
    return keys.fire || ptrFire;
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
    shot() {
      this.ensure();
      this.beep(620, 0.05, 'square', 0.042, 280);
      this.beep(980, 0.04, 'sawtooth', 0.022, 420);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.05, 0.044, 800);
      this.beep(520 * lift, 0.09, 'square', 0.052, 200);
      this.beep(780 * lift, 0.07, 'triangle', 0.032, 160);
    },
    explode() {
      this.ensure();
      this.noise(0.09, 0.05, 400);
      this.beep(220, 0.12, 'sawtooth', 0.045, 70);
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
    gun() {
      this.ensure();
      this.beep(520, 0.08, 'square', 0.04, 780);
      this.beep(780, 0.12, 'triangle', 0.04, 1040);
      this.beep(1040, 0.14, 'sine', 0.035, 1560);
    },
    charm() {
      this.ensure();
      this.beep(300, 0.08, 'sine', 0.04, 180);
      this.noise(0.08, 0.03, 600);
    },
    crush() {
      this.ensure();
      this.noise(0.12, 0.05, 180);
      this.beep(90, 0.18, 'sawtooth', 0.045, 40);
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
    if (modeIsle) modeIsle.setAttribute('aria-pressed', core ? 'false' : 'true');
    if (modeCore) modeCore.setAttribute('aria-pressed', core ? 'true' : 'false');
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
      tagLabel.textContent = isCore() ? '童核' : '仙童3';
      tagLabel.classList.toggle('warn', isCore());
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (vitBar) vitBar.style.transform = 'scaleX(' + clamp(G.vit / VIT_MAX, 0, 1) + ')';
    if (vitWrap) {
      vitWrap.classList.toggle('warn', playing() && G.vit < 26);
      vitWrap.classList.toggle('hot', G.muzzle > 0);
    }
    if (gunLabel) {
      gunLabel.textContent = gunName(G.gun);
      gunLabel.classList.toggle('lv3', G.gun >= 3);
    }
    if (gearLabel) {
      gearLabel.classList.toggle('hidden', !G.charm);
      gearLabel.classList.toggle('charm', G.charm);
      if (G.charm) gearLabel.textContent = '护焰';
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞敌、饿倒、坠崖、被卷走都丢命', 'warn');
    else if (G.mode === 'win') setHint('魔巢打通 · R 再来一局', 'hot');
    else if (G.vit < 26) setHint('饿了 · 快摘水果续命', 'warn');
    else if (G.lives === 1) setHint('最后一命 · 空格射炎 · 水果续命', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · 炎弹打穿 · 跳过冲击', 'hot');
    else setHint('滑板射 · 空格炎弹 · Shift 跳 · 火晶升炎 · 水果续命', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'WB3';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '童核' : '换模式';
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
    const bat = kind === 'bat';
    const bird = kind === 'bird';
    const bone = kind === 'bone';
    const spike = kind === 'spike';
    return {
      kind: kind, x: x, y: y, baseY: y,
      w: spike ? 18 : bird ? 20 : bat ? 16 : bone ? 16 : 22,
      h: spike ? 18 : bird ? 14 : bat ? 12 : bone ? 22 : 16,
      face: 1, vx: 0, vy: 0, grounded: !bat && !bird,
      hp: spike ? 2 : 1, a: a, b: b,
      t: rand(0, TAU), hop: rand(0.4, 1.1), charge: 0,
      dead: false, hurt: 0, flying: bat || bird
    };
  }

  function makeBoss(spec) {
    let kind = 'bbat';
    if (spec.boss === '水蟒') kind = 'bsnake';
    if (spec.boss === '巢龙') kind = 'bdrag';
    const core = isCore();
    const hp = Math.round(spec.hp * (core ? 1.28 : 1));
    return {
      kind: kind, name: spec.boss,
      x: spec.w - 180, y: kind === 'bbat' ? HY + 24 : GY,
      w: kind === 'bsnake' ? 56 : kind === 'bdrag' ? 52 : 40,
      h: kind === 'bsnake' ? 28 : kind === 'bdrag' ? 36 : 30,
      face: -1, vx: 0, vy: 0, grounded: kind !== 'bbat',
      hp: hp, max: hp, t: 0, atk: 0, phase: 0,
      active: false, dead: false, hurt: 0, flying: kind === 'bbat'
    };
  }

  function makeFruit(x, y, kind) {
    return { x: x, y: y - 18, kind: kind, taken: false, t: rand(0, TAU) };
  }

  function makeOrb(x, y) {
    return { x: x, y: y - 22, taken: false, t: rand(0, TAU) };
  }

  function makeChest(x, y) {
    return { x: x, y: y, smashed: false, pop: 0 };
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

  function loadStage(n, keepScore) {
    const spec = STAGES[n - 1];
    G.stage = n;
    G.levelW = spec.w;
    G.arena = spec.w - 520;
    G.plats.length = 0;
    G.fruit.length = 0;
    G.orbs.length = 0;
    G.chests.length = 0;
    G.ents.length = 0;
    G.shots.length = 0;
    G.blobs.length = 0;
    G.shocks.length = 0;
    G.clearT = 0;
    G.lock = 0;
    G.hungry = false;
    G.fireCd = 0;
    G.muzzle = 0;
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
    for (i = 0; i < spec.orbs.length; i++) {
      g = spec.orbs[i];
      G.orbs.push(makeOrb(g[0], g[1]));
    }
    for (i = 0; i < spec.chests.length; i++) {
      g = spec.chests[i];
      G.chests.push(makeChest(g[0], g[1]));
    }
    for (i = 0; i < spec.ents.length; i++) {
      e = spec.ents[i];
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4]));
    }
    if (isCore()) {
      for (i = 0; i < spec.ents.length; i += 2) {
        e = spec.ents[i];
        const alt = e[2] === 'bat' ? 'slime' : e[2] === 'bird' ? 'bat' : 'bat';
        G.ents.push(makeEnt(e[0] + 54, e[1] === GY ? MY : e[1], alt, e[3], e[4]));
      }
    }
    G.boss = makeBoss(spec);
    G.player = makePlayer(200, GY);
    G.camX = 0;
    G.camY = 0;
    G.vit = VIT_MAX;
    G.invuln = keepScore ? 0.6 : 0;
    G.deadT = 0;
    G.checkX = 200;
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
    G.kind = 'isle';
    G.score = 0;
    G.lives = LIVES;
    G.nextLife = LIFE_EVERY;
    G.combo = 0;
    G.mult = 1;
    G.gun = 2;
    G.charm = false;
    G.why = '';
    loadStage(1, false);
    G.vit = VIT_MAX;
    showOverlay('title', '仙童3', '滑板冲进魔巢。空格射炎弹，Shift 起跳。镜头一直往右推，撞敌、坠崖、饿倒、被卷走都丢命。摘果续力，捡火晶升炎。');
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'core' ? 'core' : 'isle';
    G.mode = 'play';
    G.score = 0;
    G.lives = LIVES;
    G.nextLife = LIFE_EVERY;
    G.maxCombo = 0;
    G.gun = isCore() ? 2 : 1;
    G.charm = isCore();
    G.why = '';
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isCore() ? '童核 · 更密更快' : '仙童3 · ' + STAGES[0].name, false, !isCore());
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('isle');
    else startGame(G.kind);
  }

  function goLose() {
    G.mode = 'lose';
    saveBest();
    audio.lose();
    kick(8, 'die');
    const why = G.why === 'hunger' ? '饿倒了'
      : G.why === 'fall' ? '掉下去了'
        : G.why === 'crush' ? '被卷走了' : '被撞到了';
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
    showOverlay('win', isCore() ? '童核打穿' : '魔巢打通', '分数 ' + G.score + ' · 最高 ' + G.best + ' · 连击 ' + G.maxCombo);
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
    const keepGun = G.gun;
    const keepCharm = G.charm;
    G.stage += 1;
    loadStage(G.stage, true);
    G.gun = keepGun;
    G.charm = keepCharm;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    syncHud();
  }

  function respawn() {
    const cx = Math.max(G.checkX, G.camX + 180);
    const cy = standAt(cx, G.checkY) ? G.checkY : (standAt(cx, GY) ? GY : G.checkY);
    G.player = makePlayer(clamp(cx, G.camX + 80, G.camX + VW - 80), cy);
    G.deadT = 0;
    G.invuln = INVULN;
    G.vit = Math.max(G.vit, 42);
    G.hungry = false;
    G.blobs.length = 0;
    G.shocks.length = 0;
    G.shots.length = 0;
    G.fireCd = 0;
    G.muzzle = 0;
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
      toast('护焰碎了', true, false);
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
    else if (why === 'crush') audio.crush();
    else audio.death();
    syncHud();
  }

  function giveGun(x, y) {
    if (G.gun < GUN_MAX) G.gun += 1;
    bumpCombo();
    addScore(SCORE.orb * G.mult);
    floatText(x, y - 14, gunName(G.gun), LAVA, true);
    juice(x, y, LAVA, 1.2);
    audio.gun();
    toast(gunName(G.gun), false, true);
    syncHud();
  }

  function giveCharm(x, y) {
    G.charm = true;
    bumpCombo();
    addScore(300 * G.mult);
    floatText(x, y - 14, '护焰', MAG, true);
    juice(x, y, MAG, 1.05);
    audio.gun();
    toast('护焰 · 挡一次撞击', false, true);
    syncHud();
  }

  function smashChest(b) {
    if (b.smashed) return;
    b.smashed = true;
    b.pop = 0.2;
    bumpCombo();
    const cx = b.x;
    const cy = b.y - 12;
    juice(cx, cy, GOLD, 1.1);
    hitStop(0.05);
    kick(3.2, 'boom');
    audio.explode();
    addScore(SCORE.chest * G.mult);
    const roll = Math.random();
    if (roll < 0.42) giveGun(cx, cy);
    else if (roll < 0.7) giveCharm(cx, cy);
    else {
      G.vit = Math.min(VIT_MAX, G.vit + 28);
      floatText(cx, cy - 12, '+蕉', GOLD, false);
      audio.fruit(G.combo);
    }
    G.checkX = b.x;
    G.checkY = b.y;
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

  function orbPop(o) {
    o.taken = true;
    giveGun(o.x, o.y);
    G.checkX = o.x;
    G.checkY = platUnder(o.x, o.y + 22, null) ? o.y + 22 : GY;
  }

  function hurtEnt(e, fromShot) {
    if (e.dead || e.hurt > 0) return;
    e.hp -= 1;
    e.hurt = 0.08;
    if (e.hp <= 0) {
      e.dead = true;
      bumpCombo();
      const base = e.name ? SCORE.boss : killScore(e.kind);
      const sc = base * G.mult;
      addScore(sc);
      floatText(e.x, e.y - 24, '+' + sc, e.name ? GOLD : HOT, !!e.name);
      const rgb = e.name ? LAVA
        : e.kind === 'bat' ? BAT
          : e.kind === 'bird' ? LAVA
            : e.kind === 'bone' ? WHT
              : e.kind === 'spike' ? MAG : SLIME;
      juice(e.x, e.y - 10, rgb, e.name ? 1.7 : 1.15);
      hitStop(e.name ? 0.07 : fromShot ? 0.048 : 0.055);
      audio.hit(G.combo);
      if (e.name) {
        G.lock = 0.55;
        G.clearT = 1.15;
        toast(e.name + ' 倒下', false, true);
        screenFlash(GOLD, 0.4);
        kick(5, 'boom');
        audio.explode();
      }
      syncHud();
    } else {
      e.x += 10;
      juice(e.x, e.y - 12, GOLD, 0.5);
      hitStop(0.04);
      audio.hit(G.combo);
      floatText(e.x, e.y - 22, '-' + e.hp, GOLD, false);
    }
  }

  function spawnShot(x, y, vx, vy) {
    G.shots.push({
      x: x, y: y, vx: vx, vy: vy,
      life: SHOT_LIFE, r: G.gun >= 3 ? 5 : 4.2
    });
    capArr(G.shots, 28);
  }

  function doShoot() {
    if (!playing() && G.mode !== 'title') return;
    if (G.deadT > 0 || G.lock > 0) return;
    if (G.fireCd > 0) return;
    const p = G.player;
    if (!p) return;
    const lv = clamp(G.gun, 1, GUN_MAX);
    G.fireCd = SHOT_CD[lv];
    G.muzzle = 0.08;
    p.pose = 0.1;
    const oxp = p.x + p.face * 16;
    const oyp = p.y - 16;
    audio.shot();
    emit(4, {
      x: oxp, y: oyp, j: 4,
      vx0: p.face * 60, vx1: p.face * 180, vy0: -40, vy1: 40,
      life: 0.14, r0: 1, r1: 2.2, rgb: LAVA, g: 80
    });
    popSpark(oxp, oyp, HOT, 8);
    if (lv >= 3) {
      spawnShot(oxp, oyp, p.face * SHOT_SPD, -110);
      spawnShot(oxp, oyp, p.face * SHOT_SPD, 0);
      spawnShot(oxp, oyp, p.face * SHOT_SPD, 110);
    } else {
      spawnShot(oxp, oyp, p.face * SHOT_SPD, lv >= 2 ? rand(-18, 18) : 0);
    }
  }

  function spawnBlob(b, fire) {
    const p = G.player;
    const dir = p && p.x > b.x ? 1 : -1;
    G.blobs.push({
      x: b.x + dir * 16,
      y: b.y - b.h * 0.5,
      vx: dir * (fire ? 220 : 180),
      vy: fire ? -80 : -40,
      life: 1.6,
      fire: !!fire
    });
    capArr(G.blobs, 18);
  }

  function spawnRing(b) {
    G.blobs.push({
      x: b.x, y: b.y + 8, vx: 0, vy: 80, life: 1.8, fire: false, ring: true
    });
    capArr(G.blobs, 18);
  }

  function spawnShock(b) {
    G.shocks.push({ x: b.x, y: GY, vx: 0, w: 18, life: 0.42 });
    audio.crush();
    kick(3.2, 'thump');
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.u = pitAhead(p.x, 1) && p.grounded;
    demo.fire = false;
    let i, e;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (e.x > p.x && e.x < p.x + 220 && Math.abs(e.y - p.y) < 70) {
        demo.fire = true;
        break;
      }
    }
    if (G.boss && G.boss.active && !G.boss.dead) demo.fire = true;
    if (p.x > 1180) {
      loadStage(1, false);
      G.vit = VIT_MAX;
      G.gun = 2;
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
    if (G.mode === 'win' || G.mode === 'lose') return;

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
    } else {
      p.x = Math.min(p.x, G.camX + VW - 28);
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
        life: 0.2, r0: 1, r1: 2.2, rgb: MAG, g: 200
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
            life: 0.2, r0: 1, r1: 2.4, rgb: MAG, g: 180
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

    if (p.y > VH + 90) {
      if (playing()) die('fall');
      else {
        loadStage(1, false);
        G.vit = VIT_MAX;
        G.gun = 2;
      }
      return;
    }

    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    if (ax && p.grounded) p.run += dt * 16;
    else p.run += dt * 3;
    if (p.pose > 0) p.pose -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (wantFire()) doShoot();

    G.sparkT -= dt;
    if (p.grounded && (Math.abs(p.vx) > 40 || G.camX > 4) && G.sparkT <= 0) {
      G.sparkT = 0.04;
      emit(2, {
        x: p.x - p.face * 10, y: p.y, j: 4,
        vx0: -p.face * 90, vx1: -p.face * 20, vy0: -90, vy1: -10,
        life: 0.22, r0: 1, r1: 2.4, rgb: MAG, g: 80
      });
      if (Math.random() < 0.16) audio.spark();
    }

    let i;
    for (i = 0; i < G.fruit.length; i++) {
      const f = G.fruit[i];
      if (f.taken) continue;
      if (hypot(p.x - f.x, (p.y - 12) - f.y) < 22) fruitPop(f);
    }
    for (i = 0; i < G.orbs.length; i++) {
      const o = G.orbs[i];
      if (o.taken) continue;
      if (hypot(p.x - o.x, (p.y - 12) - o.y) < 20) orbPop(o);
    }

    if (playing() && G.invuln <= 0) {
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

  function updateShots(dt) {
    let i, a, j, e, c;
    for (i = G.shots.length - 1; i >= 0; i--) {
      a = G.shots[i];
      a.life -= dt;
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      if (a.life <= 0 || a.x < G.camX - 20 || a.x > G.camX + VW + 40 || a.y < -20 || a.y > VH + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (j = 0; j < G.ents.length; j++) {
        e = G.ents[j];
        if (e.dead) continue;
        if (aabb(a.x - 4, a.y - 4, 8, 8, e.x - e.w / 2, e.y - e.h, e.w, e.h)) {
          hurtEnt(e, true);
          hit = true;
          break;
        }
      }
      if (!hit && G.boss && G.boss.active && !G.boss.dead) {
        e = G.boss;
        if (aabb(a.x - 4, a.y - 4, 8, 8, e.x - e.w / 2, e.y - e.h, e.w, e.h)) {
          hurtEnt(e, true);
          hit = true;
        }
      }
      if (!hit) {
        for (j = 0; j < G.chests.length; j++) {
          c = G.chests[j];
          if (c.smashed) continue;
          if (aabb(a.x - 4, a.y - 4, 8, 8, c.x - 10, c.y - 18, 20, 18)) {
            smashChest(c);
            hit = true;
            break;
          }
        }
      }
      if (!hit) {
        for (j = G.blobs.length - 1; j >= 0; j--) {
          const o = G.blobs[j];
          if (hypot(a.x - o.x, a.y - o.y) < 12) {
            juice(o.x, o.y, o.fire ? LAVA : LEAF, 0.55);
            G.blobs.splice(j, 1);
            bumpCombo();
            addScore(SCORE.shot * G.mult);
            hit = true;
            break;
          }
        }
      }
      if (hit) {
        emit(6, {
          x: a.x, y: a.y, j: 5,
          vx0: -80, vx1: 80, vy0: -120, vy1: 20,
          life: 0.18, r0: 1, r1: 2.4, rgb: LAVA, g: 200
        });
        G.shots.splice(i, 1);
      }
    }
  }

  function updateEnts(dt) {
    const mul = spdMul(isCore(), G.stage);
    const p = G.player;
    let i, e, nx;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (e.hurt > 0) e.hurt -= dt;
      e.t += dt;
      if (e.kind === 'bat') {
        e.x += Math.sin(e.t * 1.6) * 28 * mul * dt * 8;
        e.y = e.baseY - 10 + Math.sin(e.t * 2.4 + e.a) * 16;
        e.face = Math.sin(e.t * 1.6) >= 0 ? 1 : -1;
        e.x = clamp(e.x, e.a, e.b);
      } else if (e.kind === 'bird') {
        if (e.charge <= 0 && p && Math.abs(p.x - e.x) < 160 && p.x > G.camX - 20) {
          e.charge = 1.1;
          e.vx = (p.x > e.x ? 1 : -1) * 70;
          e.vy = 40;
        }
        if (e.charge > 0) {
          e.charge -= dt;
          e.x += e.vx * mul * dt;
          e.y += (220 * mul) * dt;
          if (e.y > e.baseY + 8) {
            e.y = e.baseY;
            e.vy = 0;
            e.charge = -0.4;
          }
        } else {
          e.charge += dt * 0.2;
          e.x += Math.sin(e.t * 1.2) * 40 * mul * dt;
          e.y = e.baseY + Math.sin(e.t * 3) * 8;
        }
        e.face = (p && p.x > e.x) ? 1 : -1;
      } else if (e.kind === 'bone') {
        e.hop -= dt;
        if (e.grounded && e.hop <= 0) {
          e.vy = -340;
          e.grounded = false;
          e.face = (p && p.x > e.x) ? 1 : -1;
          e.vx = e.face * 90 * mul;
          e.hop = rand(0.7, 1.3);
        }
        if (!e.grounded) {
          e.vy += GRAV * dt;
          e.x += e.vx * dt;
          const y0 = e.y;
          const y1 = e.y + e.vy * dt;
          const plat = landOn(e.x, y0, y1, null);
          if (plat && e.vy >= 0) {
            e.y = plat.y;
            e.vy = 0;
            e.grounded = true;
          } else e.y = y1;
        }
        e.x = clamp(e.x, e.a, e.b);
      } else if (e.kind === 'spike') {
        if (!e.vx) e.vx = 70 * mul;
        nx = e.x + e.vx * dt;
        if (nx < e.a || nx > e.b || !standAt(nx, GY)) e.vx *= -1;
        else e.x = nx;
        e.face = e.vx >= 0 ? 1 : -1;
        e.y = e.baseY + Math.abs(Math.sin(e.t * 8)) * 4;
      } else {
        if (!e.vx) e.vx = 42 * mul;
        nx = e.x + e.vx * dt;
        if (nx < e.a || nx > e.b || !standAt(nx, e.y)) e.vx *= -1;
        else e.x = nx;
        e.face = e.vx >= 0 ? 1 : -1;
      }
    }
    for (i = 0; i < G.chests.length; i++) {
      if (G.chests[i].pop > 0) G.chests[i].pop -= dt;
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    const p = G.player;
    if (!b || b.dead) return;
    if (!b.active) {
      if (G.camX >= G.arena - 8 || (p && p.x >= G.arena + 40)) {
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

    if (!b.flying && !b.grounded) {
      b.vy += GRAV * dt;
      const y0 = b.y;
      const y1 = b.y + b.vy * dt;
      const plat = landOn(b.x, y0, y1, null);
      if (plat && b.vy >= 0) {
        b.y = plat.y;
        b.vy = 0;
        b.grounded = true;
        if (b.kind === 'bdrag') spawnShock(b);
      } else b.y = y1;
    }

    if (b.kind === 'bbat') {
      b.y = HY + 20 + Math.sin(b.t * 2.1) * 28;
      if (b.atk <= 0) {
        b.phase += 1;
        b.face = p && p.x > b.x ? 1 : -1;
        if (b.phase % 2 === 0) {
          b.vx = b.face * 220 * mul;
          b.atk = low ? 0.7 : 1.0;
          spawnRing(b);
        } else {
          b.vx = b.face * 90 * mul;
          b.atk = low ? 0.85 : 1.2;
          spawnBlob(b, false);
        }
      }
      b.x += b.vx * dt;
      if (b.x < G.arena + 50 || b.x > G.levelW - 50) {
        b.face = -b.face;
        b.vx = -b.vx;
        b.x = clamp(b.x, G.arena + 50, G.levelW - 50);
      }
    } else if (b.kind === 'bsnake') {
      if (b.grounded && b.atk <= 0) {
        b.face = p && p.x > b.x ? 1 : -1;
        b.phase += 1;
        if (b.phase % 3 === 0) {
          b.vy = -420;
          b.vx = b.face * 180 * mul;
          b.grounded = false;
          spawnBlob(b, false);
        } else if (b.phase % 3 === 1) {
          b.vx = b.face * 260 * mul;
          spawnBlob(b, false);
        } else {
          b.vx = b.face * 80 * mul;
          spawnBlob(b, false);
        }
        b.atk = low ? 0.75 : 1.1;
      } else if (b.grounded) {
        const nx = b.x + b.face * 70 * mul * dt;
        if (nx < G.arena + 40 || nx > G.levelW - 40) b.face = -b.face;
        else b.x = nx;
      } else {
        b.x += b.vx * dt;
        b.x = clamp(b.x, G.arena + 40, G.levelW - 40);
      }
    } else {
      if (b.grounded && b.atk <= 0) {
        b.face = p && p.x > b.x ? 1 : -1;
        b.phase += 1;
        if (b.phase % 2 === 0) {
          b.vy = -460;
          b.vx = b.face * 120 * mul;
          b.grounded = false;
          spawnBlob(b, true);
        } else {
          b.vx = b.face * 200 * mul;
          spawnBlob(b, true);
        }
        b.atk = low ? 0.8 : 1.2;
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
      o.vy += (o.ring ? 280 : o.fire ? 480 : 520) * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      if (o.life <= 0 || o.y > VH + 20) {
        G.blobs.splice(i, 1);
        continue;
      }
      if (playing() && G.deadT <= 0 && G.invuln <= 0 && hypot(p.x - o.x, p.y - 12 - o.y) < 16) {
        die('hit');
        G.blobs.splice(i, 1);
      }
    }
    for (i = G.shocks.length - 1; i >= 0; i--) {
      o = G.shocks[i];
      o.life -= dt;
      o.w = lerp(o.w, 52, 1 - Math.pow(0.02, dt));
      if (o.life <= 0) {
        G.shocks.splice(i, 1);
        continue;
      }
      if (playing() && G.deadT <= 0 && G.invuln <= 0 && p.grounded) {
        if (Math.abs(p.x - o.x) < o.w * 0.55 && Math.abs(p.y - o.y) < 10) die('hit');
      }
    }
  }

  function updateCamera(dt) {
    const p = G.player;
    const bossLock = G.boss && G.boss.active && !G.boss.dead;
    if (bossLock) {
      G.camX = lerp(G.camX, G.arena, 1 - Math.pow(0.04, dt));
      G.camX = clamp(G.camX, 0, G.levelW - VW);
    } else if ((playing() || G.mode === 'title') && G.deadT <= 0 && G.lock <= 0 && G.clearT <= 0) {
      G.camX += scrollSpd(isCore(), G.stage) * dt;
      G.camX = clamp(G.camX, 0, Math.max(0, G.levelW - VW));
    }
    if (p && G.deadT <= 0 && !bossLock) {
      if (p.x < G.camX - 20) die('crush');
    }
    const wantY = p && p.y < MY - 10 ? -28 : 0;
    G.camY = lerp(G.camY, wantY, 1 - Math.pow(0.08, dt));
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
      if (sparks[i].t > 0.22) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.32) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      o = floats[i];
      o.t += dt;
      o.y -= o.vy * dt;
      if (o.t > o.life) floats.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.pow(0.002, dt));
  }

  function update(dt) {
    G.clock += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.35);
      return;
    }
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
    if (G.mode === 'title') demoThink();
    updatePlayer(dt);
    updateShots(dt);
    updateEnts(dt);
    updateBoss(dt);
    updateHazards(dt);
    updateCamera(dt);
    updateFx(dt);

    if (playing() && G.deadT <= 0 && G.lock <= 0 && G.clearT <= 0) {
      G.vit -= drainRate(isCore()) * dt;
      if (G.vit < 26 && !G.hungry) {
        G.hungry = true;
        toast('饿了', true, false);
        audio.hunger();
      }
      if (G.vit <= 0) {
        G.vit = 0;
        die('hunger');
      }
    }
    if (G.clearT > 0) {
      G.clearT -= dt;
      if (G.clearT <= 0) nextStage();
    }
    if ((G.clock * 8 | 0) !== ((G.clock - dt) * 8 | 0)) syncHud();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (G.stage === 1) {
      g.addColorStop(0, '#0c2018');
      g.addColorStop(0.55, '#102414');
      g.addColorStop(1, '#0a1810');
    } else if (G.stage === 2) {
      g.addColorStop(0, '#082018');
      g.addColorStop(0.55, '#0a2820');
      g.addColorStop(1, '#081810');
    } else {
      g.addColorStop(0, '#201008');
      g.addColorStop(0.55, '#24140c');
      g.addColorStop(1, '#140804');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const sunX = sx(G.camX + VW * 0.78);
    const sunY = sy(42);
    ctx.fillStyle = rgba(G.stage === 3 ? LAVA : GOLD, G.stage === 3 ? 0.32 : 0.48);
    ctx.beginPath();
    ctx.arc(sunX, sunY, 26 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.beginPath();
    ctx.arc(sunX, sunY, 13 * scale, 0, TAU);
    ctx.fill();
  }

  function drawHills() {
    const s = scale;
    let k, x, h;
    ctx.fillStyle = G.stage === 3 ? 'rgba(80, 28, 12, 0.55)' : G.stage === 2 ? 'rgba(8, 48, 36, 0.55)' : 'rgba(16, 48, 28, 0.52)';
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
      ctx.fillStyle = G.stage === 3 ? rgba(LAVA, 0.2) : rgba(LEAF, G.stage === 2 ? 0.3 : 0.24);
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
      ctx.fillStyle = p.base ? (G.stage === 3 ? '#2a1208' : '#102418') : '#163022';
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
        } else if (G.stage === 2) {
          ctx.fillStyle = rgba(CYN, 0.12 + Math.sin(G.clock * 3 + p.x) * 0.05);
          ctx.fillRect(x, y + h - 6 * s, w, 6 * s);
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

  function drawOrb(o) {
    if (o.taken) return;
    const bob = Math.sin(G.clock * 5 + o.t) * 4;
    const x = sx(o.x);
    const y = sy(o.y + bob);
    const s = scale;
    ctx.fillStyle = rgba(LAVA, 0.22);
    ctx.beginPath();
    ctx.arc(x, y, 12 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(LAVA, 0.95);
    ctx.beginPath();
    ctx.arc(x, y, 5.4 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.beginPath();
    ctx.arc(x - 1.4 * s, y - 1.6 * s, 2 * s, 0, TAU);
    ctx.fill();
  }

  function drawChest(b) {
    if (b.smashed) return;
    const pop = b.pop > 0 ? 1 - b.pop / 0.2 : 1;
    const x = sx(b.x);
    const y = sy(b.y);
    const s = scale * (0.88 + pop * 0.12);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = rgba(WOOD, 0.95);
    ctx.fillRect(-8 * s, -16 * s, 16 * s, 16 * s);
    ctx.strokeStyle = rgba(LAVA, 0.9);
    ctx.lineWidth = 1.4 * s;
    ctx.strokeRect(-8 * s, -16 * s, 16 * s, 16 * s);
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(0, -8 * s, 3.2 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawShot(a) {
    const x = sx(a.x);
    const y = sy(a.y);
    const s = scale;
    ctx.fillStyle = rgba(LAVA, 0.28);
    ctx.beginPath();
    ctx.arc(x, y, (a.r + 4) * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.arc(x, y, a.r * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.85);
    ctx.beginPath();
    ctx.arc(x - 1 * s, y - 1 * s, 1.6 * s, 0, TAU);
    ctx.fill();
  }

  function drawSlime(e) {
    const blink = e.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, 1);
    ctx.fillStyle = rgba(SLIME, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -7 * s, 11 * s, 8 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(3 * s, -10 * s, 2.2 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#102010';
    ctx.beginPath();
    ctx.arc(3.6 * s, -10 * s, 1.1 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBat(e) {
    const blink = e.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale * (e.name ? 1.8 : 1);
    const flap = Math.sin(G.clock * 14 + e.t) * 0.55;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, 1);
    ctx.fillStyle = rgba(BAT, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 0, 7 * s, 5 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.7);
    ctx.beginPath();
    ctx.moveTo(-2 * s, 0);
    ctx.lineTo(-16 * s, -8 * s * (0.6 + flap));
    ctx.lineTo(-8 * s, 2 * s);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(2 * s, 0);
    ctx.lineTo(16 * s, -8 * s * (0.6 + flap));
    ctx.lineTo(8 * s, 2 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.beginPath();
    ctx.arc(3 * s, -1 * s, 1.2 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBone(e) {
    const blink = e.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    const squat = e.grounded ? 1 : 0.86;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, squat);
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.fillRect(-3 * s, -18 * s, 6 * s, 12 * s);
    ctx.beginPath();
    ctx.arc(0, -22 * s, 5 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#102010';
    ctx.fillRect(1 * s, -24 * s, 2.2 * s, 2 * s);
    ctx.fillStyle = rgba(HOT, 0.8);
    ctx.fillRect(-4 * s, -8 * s, 8 * s, 2 * s);
    ctx.restore();
  }

  function drawSpike(e) {
    const blink = e.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.beginPath();
    ctx.moveTo(0, -16 * s);
    ctx.lineTo(9 * s, -4 * s);
    ctx.lineTo(6 * s, 0);
    ctx.lineTo(-6 * s, 0);
    ctx.lineTo(-9 * s, -4 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.7);
    ctx.beginPath();
    ctx.moveTo(0, -12 * s);
    ctx.lineTo(3 * s, -4 * s);
    ctx.lineTo(-3 * s, -4 * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawBird(e) {
    const blink = e.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    const flap = Math.sin(G.clock * 16) * 5;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, 1);
    ctx.fillStyle = rgba(LAVA, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 0, 9 * s, 5 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.8);
    ctx.beginPath();
    ctx.ellipse(-2 * s, -flap * 0.3 * s, 8 * s, 3 * s, -0.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.moveTo(8 * s, 0);
    ctx.lineTo(14 * s, 2 * s);
    ctx.lineTo(8 * s, 3 * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawEnt(e) {
    if (e.dead) return;
    if (e.kind === 'bat') drawBat(e);
    else if (e.kind === 'bone') drawBone(e);
    else if (e.kind === 'spike') drawSpike(e);
    else if (e.kind === 'bird') drawBird(e);
    else drawSlime(e);
  }

  function drawBoss(b) {
    if (!b || !b.active || b.dead) return;
    const blink = b.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    if (b.kind === 'bbat') {
      drawBat(b);
      return;
    }
    const x = sx(b.x);
    const y = sy(b.y);
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(b.face, 1);
    if (b.kind === 'bsnake') {
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, -10 * s, 26 * s, 10 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(LEAF, 0.7);
      ctx.beginPath();
      ctx.ellipse(-10 * s, -12 * s, 10 * s, 7 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.beginPath();
      ctx.arc(16 * s, -14 * s, 4 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.beginPath();
      ctx.arc(17 * s, -14 * s, 1.6 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.moveTo(24 * s, -10 * s);
      ctx.lineTo(34 * s, -8 * s);
      ctx.lineTo(24 * s, -6 * s);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(LAVA, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, -16 * s, 22 * s, 16 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.beginPath();
      ctx.moveTo(-6 * s, -28 * s);
      ctx.lineTo(0, -40 * s);
      ctx.lineTo(6 * s, -28 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(8 * s, -20 * s, 3.4 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.5);
      ctx.beginPath();
      ctx.ellipse(4 * s, -12 * s, 8 * s, 5 * s, 0, 0, TAU);
      ctx.fill();
    }
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

    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 1.5 * s, 13 * s, 3.2 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(-8 * s, 3 * s, 2.1 * s, 0, TAU);
    ctx.arc(8 * s, 3 * s, 2.1 * s, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(HOT, 0.55 + Math.sin(G.clock * 24) * 0.25);
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.moveTo(-12 * s, 4 * s);
    ctx.lineTo(-18 * s, 1 * s);
    ctx.moveTo(-10 * s, 5 * s);
    ctx.lineTo(-16 * s, 8 * s);
    ctx.stroke();

    ctx.fillStyle = rgba(CYN, 0.95);
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
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -31 * s, 7 * s, 4.2 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1008';
    ctx.beginPath();
    ctx.arc(2.4 * s, -27 * s, 1.3 * s, 0, TAU);
    ctx.fill();

    const shootP = p.pose > 0 || G.muzzle > 0;
    ctx.strokeStyle = rgba(SKIN, 0.9);
    ctx.lineWidth = 1.8 * s;
    ctx.beginPath();
    ctx.moveTo(2 * s, -18 * s);
    ctx.lineTo(shootP ? 14 * s : 6 * s, shootP ? -16 * s : -14 * s);
    ctx.stroke();

    if (shootP) {
      ctx.fillStyle = rgba(LAVA, 0.95);
      ctx.fillRect(10 * s, -18 * s, 10 * s, 3 * s);
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.arc(20 * s, -16.5 * s, 2.4 * s, 0, TAU);
      ctx.fill();
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
    if (o.ring) {
      ctx.strokeStyle = rgba(CYN, 0.85);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(x, y, 8 * s, 0, TAU);
      ctx.stroke();
      return;
    }
    ctx.fillStyle = rgba(o.fire ? LAVA : CYN, 0.9);
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
    ctx.font = 'bold ' + (10 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.name, x + w * 0.5, y - 4 * scale);
  }

  function drawFx() {
    const s = scale;
    let i, o, a;
    for (i = 0; i < rings.length; i++) {
      o = rings[i];
      a = 1 - o.t / 0.32;
      ctx.strokeStyle = rgba(o.rgb, 0.55 * a);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.r + o.t * 70) * s, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < sparks.length; i++) {
      o = sparks[i];
      a = 1 - o.t / 0.22;
      ctx.fillStyle = rgba(o.rgb, 0.35 * a);
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), o.rad * a * s, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < particles.length; i++) {
      o = particles[i];
      a = clamp(o.life / o.max, 0, 1);
      ctx.fillStyle = rgba(o.rgb, 0.85 * a);
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), o.r * s, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < floats.length; i++) {
      o = floats[i];
      a = 1 - o.t / o.life;
      ctx.fillStyle = rgba(o.rgb, 0.95 * a);
      ctx.font = 'bold ' + (o.size * s) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(o.text, sx(o.x), sy(o.y));
    }
  }

  function draw() {
    ctx.fillStyle = '#06100a';
    ctx.fillRect(0, 0, W, H);
    const shx = (!REDUCE && G.shake > 0) ? (Math.random() - 0.5) * G.shake : 0;
    const shy = (!REDUCE && G.shake > 0) ? (Math.random() - 0.5) * G.shake : 0;
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();
    ctx.translate(shx, shy);
    if (G.punch !== 1) {
      ctx.translate(ox + VW * scale * 0.5, oy + VH * scale * 0.5);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-(ox + VW * scale * 0.5), -(oy + VH * scale * 0.5));
    }
    drawSky();
    drawHills();
    drawPlats();
    let i;
    for (i = 0; i < G.fruit.length; i++) drawFruit(G.fruit[i]);
    for (i = 0; i < G.orbs.length; i++) drawOrb(G.orbs[i]);
    for (i = 0; i < G.chests.length; i++) drawChest(G.chests[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    for (i = 0; i < G.blobs.length; i++) drawBlob(G.blobs[i]);
    for (i = 0; i < G.shocks.length; i++) drawShock(G.shocks[i]);
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);
    if (G.boss) drawBoss(G.boss);
    if (G.player) drawBoy(G.player);
    drawFx();
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
    ctx.restore();
    drawBossBar();
  }

  function resize() {
    const wrap = canvas.parentElement;
    const rw = wrap ? wrap.clientWidth : window.innerWidth;
    const rh = wrap ? wrap.clientHeight : window.innerHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, rw);
    H = Math.max(1, rh);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function primaryAction() {
    if (G.mode === 'title') startGame('isle');
    else if (G.mode === 'win' || G.mode === 'lose') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S'
      || k === 'z' || k === 'Z' || k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const jumpKey = k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up'
      || k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight';
    const fireKey = space || k === 'z' || k === 'Z';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (jumpKey) keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (fireKey) keys.fire = down;

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
      startGame('isle');
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
    }
    if ((k === 'z' || k === 'Z') && overlayOpen()) {
      primaryAction();
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
    hold(document.getElementById('btn-fire'), function () {
      if (overlayOpen()) { primaryAction(); return; }
      keys.fire = true;
      doShoot();
    }, function () { keys.fire = false; });
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen()) return;
      ptrFire = true;
      doShoot();
    });
    canvas.addEventListener('pointerup', function () { ptrFire = false; });
    canvas.addEventListener('pointercancel', function () { ptrFire = false; });
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

  if (btnIsle) {
    btnIsle.addEventListener('click', function () {
      audio.ensure();
      startGame('isle');
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
  if (modeIsle) {
    modeIsle.addEventListener('click', function () {
      audio.ensure();
      startGame('isle');
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
      keys.fire = false;
      ptrFire = false;
    }
  });

  requestAnimationFrame(frame);
})();
