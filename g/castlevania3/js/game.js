'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
  const HP_MAX = 16;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.36;
  const GY = 328;
  const MY = 256;
  const HY = 184;
  const WALK = 132;
  const JUMP_V = 430;
  const GRAV = 1150;
  const MAX_FALL = 520;
  const COYOTE = 0.06;
  const BUFFER = 0.1;
  const PW = 14;
  const PH = 26;
  const WHIP_T = 0.28;
  const SUB_CD = 0.36;
  const INVULN = 1.05;
  const INVULN_CORE = 0.78;
  const DIE_T = 0.82;
  const BEST_KEY = 'playbox-castlevania3-best';
  const MUTE_KEY = 'playbox-castlevania3-mute';
  const OPS = '方向键 / WASD 走跳 · 空格/Z 挥鞭 · X 副武器 · C 换同伴 · R 重开 · M 静音';

  const MAG = [255, 61, 120];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [196, 76, 255];
  const HOT2 = [224, 128, 255];
  const WHT = [246, 243, 239];
  const LEAF = [61, 255, 122];
  const ORG = [255, 154, 58];
  const GRN = [90, 210, 110];
  const STN = [150, 140, 170];
  const BLU = [70, 110, 210];
  const SKIN = [232, 176, 112];
  const CRIM = [180, 24, 48];
  const ICE = [160, 230, 255];
  const FLM = [255, 110, 40];

  const WHIPS = [
    { len: 36, name: '皮鞭' },
    { len: 58, name: '锁链' },
    { len: 82, name: '火鞭' }
  ];
  const SUB_NAME = { knife: '匕首', axe: '飞斧', water: '圣水', watch: '怀表', '': '—' };
  const SUB_COST = { knife: 1, axe: 1, water: 1, watch: 5 };
  const HERO_NAME = { trevor: '特雷', grant: '格兰特', sypha: '西法' };
  const SCORE = {
    zombie: 100, flea: 160, owl: 150, bone: 220, ghost: 200,
    candle: 80, boss: 4500, stage: 2000, whip: 400, meat: 500
  };

  const VILLAGE = {
    name: '瓦村', boss: '木乃伊', w: 2420, hp: 20, theme: 'town',
    ground: [[0, 500], [572, 300], [948, 340], [1360, 1060]],
    plats: [
      [200, MY, 150], [600, MY, 170], [1000, MY, 180], [1480, MY, 180], [1960, MY, 160],
      [280, HY, 120], [860, HY, 140], [1580, HY, 140]
    ],
    lads: [
      [220, MY, GY], [640, HY, MY], [1080, MY, GY], [1520, MY, GY], [1980, HY, MY]
    ],
    walls: [],
    gears: [],
    candles: [
      [150, GY - 30, 'heart'], [280, GY - 30, 'heart'],
      [340, MY - 30, 'whip'], [700, GY - 30, 'heart'],
      [900, HY - 30, 'heart5'], [1120, MY - 30, 'axe'],
      [1240, GY - 30, 'heart'], [1600, MY - 30, 'heart'],
      [1760, GY - 30, 'watch'], [2040, MY - 30, 'potion'], [2220, GY - 30, 'heart']
    ],
    ents: [
      [240, GY, 'zombie', 40, 480],
      [420, GY, 'flea', 40, 500],
      [500, MY, 'owl', 200, 360],
      [700, GY, 'zombie', 590, 850],
      [900, HY, 'owl', 860, 1000],
      [1180, GY, 'flea', 960, 1280],
      [1300, MY, 'owl', 1000, 1180],
      [1600, GY, 'zombie', 1380, 1880],
      [1780, MY, 'bone', 1480, 1660],
      [2060, GY, 'flea', 1380, 2260],
      [2100, MY, 'owl', 1960, 2120]
    ]
  };

  const CLOCK = {
    name: '钟塔', boss: '时钟魔', w: 2700, hp: 26, theme: 'clock',
    ground: [[0, 440], [512, 280], [860, 300], [1232, 320], [1620, 1080]],
    plats: [
      [120, MY, 150], [420, MY, 160], [780, MY, 170], [1160, MY, 170],
      [1540, MY, 180], [2000, MY, 170], [2360, MY, 150],
      [220, HY, 130], [700, HY, 140], [1240, HY, 150], [1820, HY, 140], [2280, HY, 140]
    ],
    lads: [
      [140, MY, GY], [440, HY, MY], [800, MY, GY], [1180, HY, MY],
      [1560, MY, GY], [2020, HY, MY], [2380, MY, GY]
    ],
    walls: [
      [360, HY - 10, GY], [980, HY - 10, GY], [1480, HY - 10, MY], [2140, HY - 10, GY]
    ],
    gears: [
      [300, MY, 90, 46, 1.1, 0],
      [920, HY, 80, 40, 0.9, 1.2],
      [1680, MY, 90, 50, 1.05, 0.4],
      [2200, HY, 80, 36, 1.2, 2]
    ],
    candles: [
      [110, GY - 30, 'heart'], [200, MY - 30, 'heart'],
      [280, HY - 30, 'whip'], [540, MY - 30, 'heart5'],
      [900, GY - 30, 'axe'], [1260, MY - 30, 'heart'],
      [1360, HY - 30, 'heart5'], [1500, GY - 30, 'knife'],
      [1720, MY - 30, 'heart'], [1900, HY - 30, 'watch'],
      [2140, MY - 30, 'potion'], [2520, GY - 30, 'heart']
    ],
    ents: [
      [200, GY, 'flea', 20, 420],
      [380, MY, 'owl', 120, 300],
      [560, HY, 'owl', 220, 360],
      [660, GY, 'flea', 520, 780],
      [980, MY, 'bone', 780, 950],
      [1080, GY, 'zombie', 860, 1180],
      [1280, HY, 'owl', 1240, 1420],
      [1440, MY, 'flea', 1540, 1720],
      [1700, GY, 'bone', 1630, 1920],
      [1880, MY, 'owl', 1840, 2140],
      [2100, GY, 'flea', 2010, 2500],
      [2320, HY, 'owl', 2280, 2420],
      [2480, GY, 'zombie', 2010, 2640]
    ]
  };

  const SHIP = {
    name: '沉船', boss: '船骸', w: 2720, hp: 26, theme: 'ship',
    ground: [[0, 420], [492, 260], [820, 300], [1192, 280], [1540, 320], [1932, 788]],
    plats: [
      [100, MY, 150], [360, MY, 160], [680, MY, 170], [1060, MY, 170],
      [1420, MY, 180], [1800, MY, 170], [2200, MY, 180], [2500, MY, 150],
      [200, HY, 130], [640, HY, 140], [1140, HY, 150], [1660, HY, 140], [2140, HY, 140]
    ],
    lads: [
      [120, MY, GY], [400, HY, MY], [720, MY, GY], [1100, HY, MY],
      [1460, MY, GY], [1840, HY, MY], [2240, MY, GY]
    ],
    walls: [],
    gears: [],
    candles: [
      [120, GY - 30, 'heart'], [180, MY - 30, 'whip'],
      [280, HY - 30, 'heart5'], [760, MY - 30, 'water'],
      [980, GY - 30, 'heart'], [1180, HY - 30, 'axe'],
      [1480, MY - 30, 'heart5'], [1680, GY - 30, 'watch'],
      [2100, HY - 30, 'knife'], [2240, MY - 30, 'heart'],
      [2320, GY - 30, 'potion'], [2580, MY - 30, 'meat']
    ],
    ents: [
      [220, GY, 'ghost', 20, 400],
      [340, MY, 'owl', 100, 260],
      [480, HY, 'ghost', 200, 330],
      [660, GY, 'zombie', 510, 800],
      [900, MY, 'bone', 680, 850],
      [1100, GY, 'ghost', 840, 1180],
      [1280, HY, 'owl', 1100, 1290],
      [1480, MY, 'ghost', 1420, 1600],
      [1760, GY, 'zombie', 1560, 1880],
      [1980, MY, 'bone', 1800, 1970],
      [2160, GY, 'ghost', 1960, 2280],
      [2340, MY, 'owl', 2200, 2380],
      [2520, HY, 'ghost', 2500, 2640]
    ]
  };

  const CASTLE = {
    name: '血堡', boss: '伯爵', w: 3040, hp: 36, theme: 'castle',
    ground: [[0, 400], [472, 260], [800, 300], [1168, 280], [1508, 320], [1900, 300], [2268, 772]],
    plats: [
      [90, MY, 150], [340, MY, 160], [660, MY, 170], [1040, MY, 170],
      [1400, MY, 180], [1780, MY, 170], [2180, MY, 180], [2580, MY, 160],
      [180, HY, 130], [600, HY, 140], [1100, HY, 150], [1580, HY, 140],
      [2060, HY, 150], [2500, HY, 140]
    ],
    lads: [
      [110, MY, GY], [380, HY, MY], [700, MY, GY], [1080, HY, MY],
      [1440, MY, GY], [1820, HY, MY], [2220, MY, GY], [2600, HY, MY]
    ],
    walls: [
      [500, HY - 8, GY], [1320, HY - 8, MY], [2400, HY - 8, GY]
    ],
    gears: [],
    candles: [
      [140, GY - 30, 'heart'], [180, MY - 30, 'whip'],
      [280, HY - 30, 'heart5'], [760, MY - 30, 'axe'],
      [980, GY - 30, 'heart'], [1180, HY - 30, 'watch'],
      [1480, MY - 30, 'heart5'], [1680, GY - 30, 'water'],
      [2100, HY - 30, 'knife'], [2240, MY - 30, 'potion'],
      [2320, GY - 30, 'heart5'], [2640, MY - 30, 'meat'],
      [2800, GY - 30, 'heart']
    ],
    ents: [
      [220, GY, 'zombie', 20, 380],
      [340, MY, 'flea', 90, 250],
      [480, HY, 'owl', 180, 310],
      [640, GY, 'ghost', 500, 780],
      [900, MY, 'bone', 660, 830],
      [1100, GY, 'flea', 820, 1140],
      [1280, HY, 'owl', 1100, 1250],
      [1480, MY, 'ghost', 1400, 1580],
      [1760, GY, 'zombie', 1530, 1880],
      [1980, MY, 'bone', 1780, 1950],
      [2160, GY, 'flea', 1920, 2240],
      [2340, MY, 'owl', 2180, 2360],
      [2520, HY, 'ghost', 2500, 2640],
      [2720, GY, 'flea', 2280, 2980]
    ]
  };

  const ALL = [VILLAGE, CLOCK, SHIP, CASTLE];

  function clamp(n, a, b) {
    return n < a ? a : n > b ? b : n;
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
  function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
  function whipLen(lv) {
    const w = WHIPS[clamp(lv, 1, 3) - 1];
    return w.len;
  }
  function heroWalk() {
    if (G.hero === 'grant') return 148;
    if (G.hero === 'sypha') return 118;
    return WALK;
  }
  function whipDur() {
    if (G.hero === 'grant') return 0.2;
    if (G.hero === 'sypha') return 0.32;
    return WHIP_T;
  }
  function heroReach() {
    if (G.hero === 'sypha') return 54;
    if (G.hero === 'grant') return Math.max(28, whipLen(G.whipLv) * 0.72);
    return whipLen(G.whipLv);
  }

  function specOf() {
    if (G.stage <= 1) return VILLAGE;
    if (G.stage === 2) return G.route === 'ship' ? SHIP : CLOCK;
    return CASTLE;
  }

  function selfCheck() {
    if (LIVES !== 3) throw new Error('3 lives');
    if (HP_MAX !== 16) throw new Error('hp bar');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (WHIPS.length !== 3) throw new Error('3 whips');
    if (WHIPS[0].len >= WHIPS[1].len || WHIPS[1].len >= WHIPS[2].len) throw new Error('whip grow');
    if (WHIPS[2].name !== '火鞭') throw new Error('flame whip');
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('core faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (!SUB_COST.axe || !SUB_COST.watch || !SUB_COST.knife || !SUB_COST.water) throw new Error('subs');
    if (SUB_COST.watch < 2) throw new Error('watch cost');
    if (BEST_KEY !== 'playbox-castlevania3-best') throw new Error('best key');
    if (VILLAGE.name === '城门' || VILLAGE.name === '乔瓦' || VILLAGE.name === '坟岗') {
      throw new Error('distinct stages');
    }
    if (CLOCK.name === SHIP.name) throw new Error('branch names');
    if (CASTLE.boss !== '伯爵') throw new Error('count boss');
    if (VILLAGE.w >= CLOCK.w || CLOCK.w >= CASTLE.w) throw new Error('wider later');
    if (VILLAGE.hp >= CLOCK.hp || CLOCK.hp >= CASTLE.hp) throw new Error('boss hp');
    if (CLOCK.gears.length < 2) throw new Error('gears');
    if (!VILLAGE.lads.length || !CLOCK.lads.length) throw new Error('ladders');
    const air = WALK * (2 * JUMP_V / GRAV);
    let i, s, hasZ, hasPit, g, gap, hasFlea;
    for (i = 0; i < ALL.length; i++) {
      s = ALL[i];
      if (!s.ground.length || !s.ents.length || !s.candles.length || !s.lads.length) {
        throw new Error('stage ' + s.name);
      }
      hasZ = false;
      hasFlea = false;
      hasPit = false;
      s.ents.forEach(function (e) {
        if (e[2] === 'zombie') hasZ = true;
        if (e[2] === 'flea' || e[2] === 'ghost') hasFlea = true;
      });
      for (g = 0; g < s.ground.length - 1; g++) {
        gap = s.ground[g + 1][0] - (s.ground[g][0] + s.ground[g][1]);
        if (gap > 20) hasPit = true;
        if (gap < 48) throw new Error('pit tiny ' + s.name + ' ' + gap);
        if (gap > air - 12) throw new Error('pit wide ' + s.name + ' ' + gap + '>' + (air - 12));
      }
      if (!hasZ || !hasFlea) throw new Error('ents ' + s.name);
      if (!hasPit) throw new Error('pits ' + s.name);
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
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const stageEl = document.getElementById('stage');
  const scoreEl = document.getElementById('score');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const bestEl = document.getElementById('best');
  const comboEl = document.getElementById('combo');
  const comboBox = document.getElementById('combo-box');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const hpLabel = document.getElementById('hp-label');
  const hpBar = document.getElementById('hp-bar');
  const heroLabel = document.getElementById('hero-label');
  const heartLabel = document.getElementById('heart-label');
  const whipLabel = document.getElementById('whip-label');
  const subLabel = document.getElementById('sub-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const chainPop = document.getElementById('chain-pop');
  const hintEl = document.getElementById('hint');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnSwap = document.getElementById('btn-swap');
  const modeRun = document.getElementById('mode-run');
  const modeCore = document.getElementById('mode-core');
  const btnRun = document.getElementById('btn-run');
  const btnCore = document.getElementById('btn-core');

  let W = 640;
  let H = 360;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let uid = 1;
  let addTok = 0;
  let toastTok = 0;
  let kickTok = 0;
  let chainTok = 0;
  let hidden = false;
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const mist = [];
  const rain = [];
  const keys = { l: false, r: false, u: false, d: false, fire: false, sub: false };
  const demo = { l: false, r: true, u: false, fire: false, sub: false };

  const G = {
    mode: 'title',
    kind: 'run',
    stage: 1,
    route: '',
    hero: 'trevor',
    partner: '',
    levelW: 2420,
    lives: LIVES,
    hp: HP_MAX,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    maxCombo: 0,
    mult: 1,
    hearts: 5,
    whipLv: 1,
    sub: '',
    player: null,
    plats: [],
    lads: [],
    walls: [],
    gears: [],
    ents: [],
    shots: [],
    pickups: [],
    candles: [],
    gates: [],
    boss: null,
    camX: 0,
    camY: 0,
    t: 0,
    clock: 0,
    stop: 0,
    timeStop: 0,
    shake: 0,
    punch: 1,
    flash: 0,
    flashRgb: WHT,
    invuln: 0,
    deadT: 0,
    whipT: 0,
    whipHit: {},
    subCd: 0,
    fireEdge: false,
    subEdge: false,
    jumpBuf: 0,
    checkX: 70,
    checkY: GY,
    clearT: 0,
    lock: 0,
    nextLife: LIFE_EVERY,
    why: '',
    toastT: 0,
    owlT: 0.9,
    subFlash: 0,
    fork: false
  };

  function isCore() {
    return G.kind === 'core';
  }
  function playing() {
    return G.mode === 'play';
  }
  function live() {
    return G.mode === 'title' || G.mode === 'play';
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function inL() {
    return G.mode === 'title' ? demo.l : (overlayOpen() ? false : keys.l);
  }
  function inR() {
    return G.mode === 'title' ? demo.r : (overlayOpen() ? false : keys.r);
  }
  function inU() {
    return G.mode === 'title' ? demo.u : (overlayOpen() ? false : keys.u);
  }
  function inD() {
    return G.mode === 'title' ? false : (overlayOpen() ? false : keys.d);
  }
  function fireHeld() {
    return G.mode === 'title' ? demo.fire : (overlayOpen() ? false : keys.fire);
  }
  function subHeld() {
    return G.mode === 'title' ? demo.sub : (overlayOpen() ? false : keys.sub);
  }
  function sx(x) {
    return ox + (x - G.camX) * scale;
  }
  function sy(y) {
    return oy + (y - G.camY) * scale;
  }
  function invulnTime() {
    return isCore() ? INVULN_CORE : INVULN;
  }
  function frozenWorld() {
    return G.timeStop > 0;
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
      this.beep(240, 0.07, 'square', 0.04, 520);
    },
    land() {
      this.ensure();
      this.noise(0.04, 0.026, 420);
      this.beep(130, 0.05, 'triangle', 0.022, 70);
    },
    whip() {
      this.ensure();
      this.noise(0.055, 0.05, 1400);
      this.beep(620, 0.06, 'sawtooth', 0.04, 180);
      this.beep(1400, 0.04, 'square', 0.028, 420);
    },
    ice() {
      this.ensure();
      this.beep(880, 0.07, 'triangle', 0.045, 1400);
      this.beep(1320, 0.1, 'sine', 0.032, 1760);
      this.noise(0.04, 0.03, 1800);
    },
    crack() {
      this.ensure();
      this.noise(0.04, 0.045, 1800);
      this.beep(880, 0.05, 'square', 0.04, 240);
    },
    candle() {
      this.ensure();
      this.beep(980, 0.06, 'square', 0.042, 1480);
      this.noise(0.05, 0.04, 900);
      this.beep(1320, 0.08, 'triangle', 0.03, 1760);
    },
    sub(kind) {
      this.ensure();
      if (kind === 'axe') {
        this.beep(220, 0.1, 'sawtooth', 0.05, 90);
        this.noise(0.06, 0.04, 400);
      } else if (kind === 'water') {
        this.beep(520, 0.08, 'sine', 0.045, 180);
        this.noise(0.07, 0.04, 600);
      } else if (kind === 'watch') {
        this.beep(660, 0.08, 'square', 0.046, 330);
        this.beep(330, 0.16, 'triangle', 0.04, 990);
        this.beep(1320, 0.12, 'sine', 0.03, 1760);
      } else {
        this.beep(1180, 0.05, 'square', 0.042, 480);
        this.noise(0.025, 0.022, 2000);
      }
    },
    ping() {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.05, 990);
      this.beep(990, 0.1, 'triangle', 0.042, 1320);
      this.beep(1320, 0.12, 'sine', 0.03, 1760);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.04, 0.036, 1100);
      this.beep(520 * lift, 0.07, 'square', 0.044, 880 * lift);
    },
    hurt() {
      this.ensure();
      this.noise(0.08, 0.05, 400);
      this.beep(220, 0.12, 'sawtooth', 0.045, 80);
    },
    boom() {
      this.ensure();
      this.noise(0.16, 0.072, 220);
      this.beep(160, 0.18, 'sawtooth', 0.05, 48);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.055, 320);
      this.beep(260, 0.2, 'sawtooth', 0.05, 66);
      this.beep(130, 0.32, 'sine', 0.045, 40);
    },
    boss() {
      this.ensure();
      this.beep(170, 0.2, 'sawtooth', 0.052, 80);
      this.beep(96, 0.32, 'square', 0.042, 58);
    },
    transform() {
      this.ensure();
      this.noise(0.18, 0.07, 180);
      this.beep(220, 0.16, 'sawtooth', 0.05, 90);
      this.beep(110, 0.28, 'sine', 0.045, 48);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(190, 0.18, 'sawtooth', 0.04, 76);
      this.beep(110, 0.3, 'sine', 0.05, 42);
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
    splash() {
      this.ensure();
      this.noise(0.08, 0.04, 280);
      this.beep(180, 0.1, 'sine', 0.03, 70);
    },
    swap() {
      this.ensure();
      this.beep(520, 0.06, 'square', 0.036, 780);
      this.beep(780, 0.08, 'triangle', 0.03, 1040);
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
    const c = isCore();
    if (modeRun) modeRun.setAttribute('aria-pressed', c ? 'false' : 'true');
    if (modeCore) modeCore.setAttribute('aria-pressed', c ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = specOf();
    if (stageLabel) {
      stageLabel.textContent = (isCore() ? '城核 ' : '') + spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '城核' : '魔城3';
      tagLabel.classList.toggle('warn', isCore());
      tagLabel.classList.toggle('hot', !isCore() && G.stage >= 3);
    }
    if (hpLabel) {
      hpLabel.textContent = '血 ' + Math.max(0, G.hp);
      hpLabel.classList.toggle('low', G.hp <= 4 && playing());
    }
    if (hpBar) hpBar.style.transform = 'scaleX(' + clamp(G.hp / HP_MAX, 0, 1) + ')';
    if (heroLabel) {
      heroLabel.textContent = HERO_NAME[G.hero] || '特雷';
      heroLabel.className = 'hero' + (G.hero === 'grant' ? ' grant' : G.hero === 'sypha' ? ' sypha' : '');
    }
    if (heartLabel) heartLabel.textContent = '心 ' + G.hearts;
    if (whipLabel) {
      if (G.hero === 'sypha') {
        whipLabel.textContent = '冰术';
        whipLabel.className = 'whip chain';
      } else if (G.hero === 'grant') {
        whipLabel.textContent = '短刃';
        whipLabel.className = 'whip chain';
      } else {
        const w = WHIPS[clamp(G.whipLv, 1, 3) - 1];
        whipLabel.textContent = w.name;
        whipLabel.className = 'whip' + (G.whipLv === 2 ? ' chain' : G.whipLv >= 3 ? ' flame' : '');
      }
    }
    if (subLabel) {
      subLabel.textContent = '副 ' + (SUB_NAME[G.sub] || '—');
      subLabel.className = 'subw' + (!G.sub ? ' off' : G.sub === 'watch' ? ' watch' : '');
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (btnSwap) btnSwap.classList.toggle('gone', !G.partner);
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 挨打掉血，城核更密更快', 'warn');
    else if (G.mode === 'win') setHint('伯爵三形态已灭 · R 再来一局', 'hot');
    else if (G.fork) setHint('择路 · 左钟塔跟格兰特 · 右沉船跟西法', 'hot');
    else if (G.lives === 1 || G.hp <= 4) setHint('血薄 · 空格/Z 挥鞭 · X 副武器', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · ' + G.boss.name, 'hot');
    else if (G.hero === 'grant') setHint('格兰特可贴墙 · 空中顶墙滑 · 再跳蹬出', '');
    else if (G.hero === 'sypha') setHint('西法冰术冻敌 · X 丢副武器耗心', '');
    else setHint('走跳爬梯 · 空格/Z 挥鞭 · 蜡烛掉心与副武器 · 挨打掉血', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'CV3';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '城核' : '换模式';
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
    const c = cls || (mag >= 6 ? 'die' : mag >= 3.4 ? 'boom' : 'hit');
    kickTok += 1;
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash', 'hurt', 'fork');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash', 'hurt', 'fork');
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
    if (!chainPop || REDUCE) return;
    chainTok += 1;
    const tok = chainTok;
    chainPop.textContent = '×' + n;
    chainPop.classList.remove('hidden');
    chainPop.style.animation = 'none';
    void chainPop.offsetWidth;
    chainPop.style.animation = '';
    setTimeout(function () {
      if (tok === chainTok && chainPop) chainPop.classList.add('hidden');
    }, 700);
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    const prev = G.mult;
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (G.combo >= 2) showChain(G.combo);
    if (G.mult > prev) audio.combo(G.mult);
    syncHud();
  }

  function makePlayer(x, y) {
    return {
      x: x, y: y, vx: 0, vy: 0, face: 1,
      w: PW, h: PH, duck: false,
      grounded: true, coyote: 0,
      squash: 1, run: 0, pose: 0,
      onLad: false, lad: null,
      cling: false, ride: null
    };
  }

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base, gear: null };
  }

  function makeLad(x, y0, y1) {
    return { x: x, y0: y0, y1: y1 };
  }

  function hpOf(kind) {
    if (kind === 'bone') return 3;
    if (kind === 'ghost') return 2;
    if (kind === 'zombie') return 2;
    return 1;
  }

  function makeEnt(x, y, kind, a, b) {
    const hp = hpOf(kind);
    const fly = kind === 'owl' || kind === 'ghost';
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b, base: y, home: x,
      t: rand(0, 2), fire: rand(0.4, 1.4),
      grounded: !fly, dead: false, hitN: 0,
      frozen: 0, state: kind === 'owl' ? 'fly' : 'walk',
      w: kind === 'bone' ? 16 : kind === 'owl' || kind === 'ghost' ? 12 : 14,
      h: kind === 'bone' ? 28 : kind === 'owl' || kind === 'ghost' ? 12 : kind === 'flea' ? 16 : 22
    };
  }

  function makeBoss(spec) {
    const hp = (spec.hp * (isCore() ? 1.22 : 1)) | 0;
    const fly = spec.boss === '时钟魔' || spec.boss === '船骸';
    return {
      id: uid++,
      x: spec.w - 150, y: fly ? GY - 70 : GY, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: spec.boss, name: spec.boss,
      t: 0, fire: 1.1, state: 'wait',
      grounded: !fly, dead: false, active: false,
      hitN: 0, form: 1, swoop: 0,
      w: spec.boss === '伯爵' ? 28 : 36,
      h: spec.boss === '伯爵' ? 46 : 40
    };
  }

  function makeCandle(x, y, drop) {
    return { x: x, y: y, drop: drop || 'heart', broken: false, t: rand(0, 3) };
  }

  function loadStage(n, attract) {
    G.stage = n;
    const spec = specOf();
    G.levelW = spec.w;
    G.plats = [];
    let i, g, p;
    for (i = 0; i < spec.ground.length; i++) {
      g = spec.ground[i];
      G.plats.push(makePlat(g[0], GY, g[1], true));
    }
    for (i = 0; i < spec.plats.length; i++) {
      p = spec.plats[i];
      G.plats.push(makePlat(p[0], p[1], p[2], false));
    }
    G.gears = [];
    for (i = 0; i < spec.gears.length; i++) {
      const gr = spec.gears[i];
      const plat = makePlat(gr[0], gr[1], gr[2], false);
      const gear = { home: gr[0], y: gr[1], w: gr[2], amp: gr[3], spd: gr[4], ph: gr[5], x: gr[0], plat: plat };
      plat.gear = gear;
      G.gears.push(gear);
      G.plats.push(plat);
    }
    G.lads = [];
    for (i = 0; i < spec.lads.length; i++) {
      const l = spec.lads[i];
      G.lads.push(makeLad(l[0], l[1], l[2]));
    }
    G.walls = [];
    for (i = 0; i < spec.walls.length; i++) {
      G.walls.push({ x: spec.walls[i][0], y0: spec.walls[i][1], y1: spec.walls[i][2] });
    }
    G.ents = [];
    for (i = 0; i < spec.ents.length; i++) {
      const e = spec.ents[i];
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4]));
    }
    if (isCore() && !attract) {
      for (i = 0; i < spec.ents.length; i++) {
        if (i % 3 !== 0) continue;
        const e = spec.ents[i];
        if (e[2] === 'bone') continue;
        const extra = e[2] === 'zombie' ? 'flea' : e[2] === 'ghost' ? 'owl' : 'flea';
        G.ents.push(makeEnt(e[0] + 28, e[1], extra, e[3], e[4]));
      }
    }
    G.candles = [];
    G.pickups = [];
    G.gates = [];
    G.fork = false;
    if (!attract) {
      for (i = 0; i < spec.candles.length; i++) {
        const c = spec.candles[i];
        G.candles.push(makeCandle(c[0], c[1], c[2]));
      }
    } else {
      for (i = 0; i < 6; i++) {
        G.candles.push(makeCandle(140 + i * 90, GY - 30, 'heart'));
      }
    }
    G.shots = [];
    G.boss = makeBoss(spec);
    G.checkX = 70;
    G.checkY = GY;
    G.camX = 0;
    G.camY = 0;
    G.whipT = 0;
    G.whipHit = {};
    G.subCd = 0;
    G.owlT = 0.9;
    G.clearT = 0;
    G.lock = 0;
    G.timeStop = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    G.player = makePlayer(70, GY);
  }

  function platUnder(x, y, skip) {
    let best = null;
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (p === skip) continue;
      if (x >= p.x + 2 && x <= p.x + p.w - 2 && y <= p.y + 10 && y >= p.y - 18) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function standAt(x, y) {
    return !!platUnder(x, y, null);
  }

  function landOn(x, y0, y1, skip) {
    let best = null;
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (p === skip) continue;
      if (x < p.x + 3 || x > p.x + p.w - 3) continue;
      if (y0 <= p.y + 2 && y1 >= p.y - 1) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function pitAhead(x, y, dir) {
    return !standAt(x + dir * 28, y);
  }

  function pBox() {
    const p = G.player;
    const h = p.duck ? 14 : p.h;
    return { x: p.x - p.w * 0.45, y: p.y - h, w: p.w * 0.9, h: h };
  }

  function waterY() {
    if (specOf().theme !== 'ship') return GY + 48;
    return GY + 10 + Math.sin(G.clock * 1.35) * 16;
  }

  function whipBox() {
    const p = G.player;
    if (G.whipT <= 0) return null;
    const dur = whipDur();
    const age = 1 - G.whipT / dur;
    if (age < 0.12 || age > 0.88) return null;
    const reach = heroReach() * (age < 0.28 ? (age - 0.12) / 0.16 : 1);
    const y = p.y - (p.duck ? 16 : 42);
    const h = p.duck ? 16 : (G.hero === 'sypha' ? 36 : 30);
    if (p.face > 0) return { x: p.x + 4, y: y, w: reach, h: h };
    return { x: p.x - 4 - reach, y: y, w: reach, h: h };
  }

  function wallNear(x, y, dir) {
    let i, p, faceX;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      faceX = dir > 0 ? p.x : p.x + p.w;
      if (Math.abs(x + dir * 7 - faceX) > 7) continue;
      if (y > p.y - 6 && y - PH < p.y + p.h + 10) return true;
    }
    for (i = 0; i < G.walls.length; i++) {
      const w = G.walls[i];
      if (Math.abs(x + dir * 7 - w.x) > 8) continue;
      if (y > w.y0 - 4 && y < w.y1 + 4) return true;
    }
    return false;
  }

  function spawnPickup(x, y, kind) {
    G.pickups.push({
      x: x, y: y, kind: kind, taken: false, t: 0, vy: -80, life: 9
    });
  }

  function takePickup(u) {
    if (u.taken) return;
    u.taken = true;
    audio.ping();
    kick(2.2, 'pickup');
    screenFlash(GOLD, 0.22);
    popSpark(u.x, u.y, GOLD, 16);
    if (u.kind === 'heart') {
      G.hearts += 1;
      toast('心 +1', false, true);
      floatText(u.x, u.y - 8, '+1', MAG, false);
    } else if (u.kind === 'heart5') {
      G.hearts += 5;
      toast('大心 +5', false, true);
      floatText(u.x, u.y - 8, '+5', MAG, true);
    } else if (u.kind === 'potion') {
      const add = Math.min(6, HP_MAX - G.hp);
      G.hp = Math.min(HP_MAX, G.hp + 6);
      toast(add > 0 ? '药 血 +' + add : '血已满 · 心 +3', false, true);
      if (add <= 0) G.hearts += 3;
      floatText(u.x, u.y - 8, add > 0 ? '+' + add : '+3', MAG, true);
    } else if (u.kind === 'whip') {
      if (G.whipLv < 3) {
        G.whipLv += 1;
        toast(WHIPS[G.whipLv - 1].name, false, true);
        addScore(SCORE.whip * G.mult);
      } else {
        G.hearts += 5;
        toast('鞭已满 · 心 +5', false, true);
      }
    } else if (u.kind === 'knife' || u.kind === 'axe' || u.kind === 'water' || u.kind === 'watch') {
      G.sub = u.kind;
      toast(SUB_NAME[u.kind], false, true);
    } else if (u.kind === 'meat') {
      G.hp = HP_MAX;
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        toast('烤肉 1UP · 血满', false, true);
        audio.oneup();
      } else {
        G.hearts += 8;
        toast('烤肉 血满 心 +8', false, true);
      }
      addScore(SCORE.meat * G.mult);
    }
    emit(10, {
      x: u.x, y: u.y, j: 8,
      vx0: -140, vx1: 140, vy0: -220, vy1: -20,
      life: 0.32, r0: 1.2, r1: 3, rgb: GOLD
    });
    syncHud();
  }

  function breakCandle(c) {
    if (c.broken) return;
    c.broken = true;
    audio.candle();
    hitStop(0.048);
    juice(c.x, c.y, GOLD, 0.85);
    bumpCombo();
    addScore(SCORE.candle * G.mult);
    floatText(c.x, c.y - 10, String(SCORE.candle * G.mult), GOLD, false);
    spawnPickup(c.x, c.y + 6, c.drop);
  }

  function spawnShot(s) {
    s.id = uid++;
    if (!s.hit) s.hit = [];
    G.shots.push(s);
  }

  function tryWhip() {
    if (G.whipT > 0 || G.deadT > 0) return;
    if (G.lock > 0) return;
    G.whipT = whipDur();
    G.whipHit = {};
    G.player.pose = 0.2;
    if (G.hero === 'sypha') audio.ice();
    else audio.whip();
    const p = G.player;
    const rgb = G.hero === 'sypha' ? ICE : G.whipLv >= 3 ? FLM : CYN;
    emit(4, {
      x: p.x + p.face * 16, y: p.y - 16, j: 6,
      vx0: p.face * 40, vx1: p.face * 160, vy0: -40, vy1: 30,
      life: 0.16, r0: 1, r1: 2.2, rgb: rgb, g: 80
    });
  }

  function trySub() {
    if (G.subCd > 0 || G.deadT > 0 || G.lock > 0) return;
    if (!G.sub) {
      if (playing()) toast('没有副武器', true, false);
      return;
    }
    const cost = SUB_COST[G.sub] || 1;
    if (G.hearts < cost) {
      toast('心不足', true, false);
      audio.crack();
      return;
    }
    G.hearts -= cost;
    G.subCd = G.sub === 'watch' ? 1.2 : SUB_CD;
    const p = G.player;
    const kind = G.sub;
    audio.sub(kind);
    G.subFlash = 0.18;
    const rgb = kind === 'axe' ? GOLD : kind === 'water' ? MAG : kind === 'watch' ? CYN : GOLD;
    screenFlash(rgb, 0.28);
    kick(2.4, 'thump');
    emit(8, {
      x: p.x + p.face * 10, y: p.y - 16, j: 6,
      vx0: -80, vx1: 80, vy0: -160, vy1: -20,
      life: 0.24, r0: 1.2, r1: 2.8, rgb: rgb
    });
    if (kind === 'watch') {
      G.timeStop = 2.8;
      toast('时停', false, true);
      screenFlash(ICE, 0.4);
      let i;
      for (i = 0; i < G.ents.length; i++) {
        if (!G.ents[i].dead) G.ents[i].frozen = Math.max(G.ents[i].frozen, 2.8);
      }
      popSpark(p.x, p.y - 18, ICE, 22);
    } else if (kind === 'knife') {
      spawnShot({
        x: p.x + p.face * 10, y: p.y - (p.duck ? 10 : 16),
        vx: p.face * 460, vy: 0,
        from: 'p', kind: 'knife', dmg: 1, pierce: 0,
        life: 0.7, rgb: CYN, hit: []
      });
    } else if (kind === 'axe') {
      spawnShot({
        x: p.x + p.face * 8, y: p.y - 18,
        vx: p.face * 210, vy: -390,
        from: 'p', kind: 'axe', dmg: 2, pierce: 1,
        life: 1.4, rgb: GOLD, hit: [], grav: 780, spin: 0
      });
    } else {
      spawnShot({
        x: p.x + p.face * 8, y: p.y - 14,
        vx: p.face * 90, vy: -40,
        from: 'p', kind: 'flask', dmg: 1, pierce: 0,
        life: 1.4, rgb: MAG, hit: [], grav: 920
      });
    }
    syncHud();
  }

  function trySwap() {
    if (!playing() || !G.partner || G.deadT > 0) return;
    G.hero = G.hero === 'trevor' ? G.partner : 'trevor';
    G.whipT = 0;
    audio.swap();
    toast(HERO_NAME[G.hero] + ' 上场', false, true);
    popSpark(G.player.x, G.player.y - 16, G.hero === 'sypha' ? ICE : G.hero === 'grant' ? CYN : HOT, 16);
    syncHud();
  }

  function loseLife(why) {
    if (G.deadT > 0 || G.mode !== 'play') return;
    G.why = why || 'hit';
    G.deadT = DIE_T;
    G.lives -= 1;
    G.whipT = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.player.onLad = false;
    G.player.cling = false;
    G.player.vy = -180;
    audio.death();
    hitStop(0.072);
    kick(6.2, 'die');
    juice(G.player.x, G.player.y - 12, MAG, 1.3);
    syncHud();
  }

  function hurt(why, dmg, fromX) {
    if (G.deadT > 0 || G.mode !== 'play') return;
    if (why === 'fall') {
      loseLife('fall');
      return;
    }
    if (G.invuln > 0) return;
    const n = dmg || 2;
    G.hp -= n;
    G.invuln = invulnTime();
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    const p = G.player;
    const dir = fromX != null && fromX > p.x ? -1 : 1;
    p.vx = dir * 168;
    p.vy = -210;
    p.grounded = false;
    p.onLad = false;
    p.cling = false;
    p.face = -dir;
    audio.hurt();
    hitStop(0.055);
    kick(4.2, 'hurt');
    juice(p.x, p.y - 12, MAG, 0.9);
    screenFlash(MAG, 0.28);
    floatText(p.x, p.y - 22, '—' + n, MAG, false);
    if (G.hp <= 0) {
      G.hp = 0;
      loseLife(why);
    } else {
      syncHud();
    }
  }

  function respawn() {
    G.invuln = invulnTime();
    G.deadT = 0;
    G.whipT = 0;
    G.hp = HP_MAX;
    G.player = makePlayer(G.checkX, G.checkY);
    G.camX = clamp(G.checkX - VW * 0.4, 0, Math.max(0, G.levelW - VW));
    toast('再起 · 血满', false, true);
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'fall' ? '坠入深渊了' : G.why === 'boss' ? '被伯爵击倒了' : G.why === 'water' ? '沉进海里了' : '血耗尽了';
    showOverlay('lose', '倒下了', why + '  分 ' + G.score + ' · 连击 ' + G.maxCombo);
    syncHud();
  }

  function goWin() {
    G.mode = 'win';
    audio.win();
    kick(4, 'win-flash');
    screenFlash(GOLD, 0.45);
    const path = G.route === 'ship' ? '沉船' : '钟塔';
    const msg = isCore()
      ? '城核平了。分岔与三形态都压下去了。'
      : '魔城3已破。经' + path + '打穿血堡，伯爵三形态倒下。';
    showOverlay('win', isCore() ? '城核平了' : '魔城3已破', msg + '  分 ' + G.score);
    syncHud();
  }

  function spawnFork() {
    G.fork = true;
    G.lock = 0;
    G.gates = [
      { x: G.levelW - 300, y: GY, route: 'clock', partner: 'grant', name: '钟塔' },
      { x: G.levelW - 120, y: GY, route: 'ship', partner: 'sypha', name: '沉船' }
    ];
    toast('择路 · 左钟塔 右沉船', false, true);
    kick(3, 'fork');
    screenFlash(CYN, 0.28);
    syncHud();
  }

  function pickRoute(gate) {
    if (!G.fork) return;
    G.fork = false;
    G.route = gate.route;
    G.partner = gate.partner;
    G.hero = gate.partner;
    audio.ping();
    juice(gate.x, gate.y - 24, gate.route === 'clock' ? CYN : ICE, 1.2);
    toast(gate.partner === 'grant' ? '格兰特入队 · 可贴墙攀' : '西法入队 · 冰术冻敌', false, true);
    G.clearT = 0.9;
    syncHud();
  }

  function nextStage() {
    if (G.stage >= 3) {
      if (!isCore()) addScore(9000);
      goWin();
      return;
    }
    audio.stage();
    G.stage += 1;
    const keep = {
      lives: G.lives, hearts: G.hearts, hp: G.hp,
      whipLv: G.whipLv, sub: G.sub, score: G.score,
      hero: G.hero, partner: G.partner, route: G.route
    };
    toast(specOf().name, false, true);
    loadStage(G.stage, false);
    G.lives = keep.lives;
    G.hearts = keep.hearts;
    G.hp = keep.hp;
    G.whipLv = keep.whipLv;
    G.sub = keep.sub;
    G.score = keep.score;
    G.hero = keep.hero;
    G.partner = keep.partner;
    G.route = keep.route;
    G.invuln = 1.1;
    syncHud();
  }

  function startGame(kind) {
    audio.ensure();
    audio.start();
    G.kind = kind === 'core' ? 'core' : 'run';
    G.mode = 'play';
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.hearts = 5;
    G.whipLv = 1;
    G.sub = '';
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.nextLife = LIFE_EVERY;
    G.invuln = 0.6;
    G.deadT = 0;
    G.why = '';
    G.hero = 'trevor';
    G.partner = '';
    G.route = '';
    G.fork = false;
    loadStage(1, false);
    hideOverlay();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'run';
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.hearts = 5;
    G.whipLv = 2;
    G.sub = 'axe';
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.invuln = 99;
    G.deadT = 0;
    G.hero = 'trevor';
    G.partner = '';
    G.route = '';
    loadStage(1, true);
    showOverlay('title', '魔城3', '瓦村尽头分岔。钟塔跟格兰特爬墙，沉船跟西法冻敌。挨打掉血，不是一碰即死。尽头伯爵三形态。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('run');
    else startGame(G.kind || 'run');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('run');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function tryMountLad(p) {
    if (p.onLad || G.whipT > 0) return;
    let i, l;
    for (i = 0; i < G.lads.length; i++) {
      l = G.lads[i];
      if (Math.abs(p.x - l.x) < 10 && p.y <= l.y1 + 8 && p.y >= l.y0 - 8) {
        if (inU() || inD()) {
          p.onLad = true;
          p.lad = l;
          p.x = l.x;
          p.vx = 0;
          p.vy = 0;
          p.grounded = true;
          p.duck = false;
          p.cling = false;
          return;
        }
      }
    }
  }

  function moveOnLad(p, dt) {
    const l = p.lad;
    if (!l) {
      p.onLad = false;
      return;
    }
    let dir = 0;
    if (inU()) dir -= 1;
    if (inD()) dir += 1;
    if (G.whipT > 0) dir = 0;
    p.y += dir * 110 * dt;
    p.x = l.x;
    p.vx = 0;
    p.vy = 0;
    p.grounded = true;
    if (p.y <= l.y0) {
      p.y = l.y0;
      if (dir < 0) {
        p.onLad = false;
        p.lad = null;
        p.grounded = true;
      }
    }
    if (p.y >= l.y1) {
      p.y = l.y1;
      if (dir > 0) {
        p.onLad = false;
        p.lad = null;
        p.grounded = true;
      }
    }
    if ((inL() || inR()) && inU() && G.jumpBuf > 0) {
      p.onLad = false;
      p.lad = null;
      p.grounded = false;
      p.vy = -JUMP_V;
      p.vx = (inR() ? 1 : -1) * heroWalk();
      p.face = p.vx >= 0 ? 1 : -1;
      G.jumpBuf = 0;
      if (playing()) audio.hop();
    }
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.u = false;
    demo.fire = false;
    if (p.grounded && pitAhead(p.x, p.y, 1)) demo.u = true;
    if (((G.clock * 2) | 0) % 3 === 0 && G.whipT <= 0) demo.fire = true;
    tryMountLad(p);
    if (p.x > 720) {
      G.player = makePlayer(70, GY);
      G.camX = 0;
      G.whipLv = 2;
      let i;
      for (i = 0; i < G.candles.length; i++) G.candles[i].broken = false;
    }
  }

  function updateGears() {
    let i, g, dx;
    const p = G.player;
    for (i = 0; i < G.gears.length; i++) {
      g = G.gears[i];
      const ox = g.x;
      g.x = g.home + Math.sin(G.clock * g.spd + g.ph) * g.amp;
      dx = g.x - ox;
      g.plat.x = g.x;
      if (p && p.grounded && p.ride === g) p.x += dx;
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

    if (inU()) G.jumpBuf = BUFFER;
    else G.jumpBuf -= dt;
    if (G.jumpBuf < 0) G.jumpBuf = 0;

    updateGears();

    if (p.onLad) {
      p.duck = false;
      p.h = PH;
      moveOnLad(p, dt);
    } else {
      tryMountLad(p);
    }

    if (p.onLad) {
      p.h = PH;
      p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    } else {
      let ax = 0;
      if (inL()) ax -= 1;
      if (inR()) ax += 1;
      const whipping = G.whipT > 0;
      p.duck = !!(p.grounded && inD() && !inU());
      p.h = p.duck ? 14 : PH;
      if (p.grounded && ax && !p.duck && !whipping) p.face = ax;

      p.cling = false;
      if (G.hero === 'grant' && !p.grounded && ax && wallNear(p.x, p.y, ax) && p.vy > -40) {
        p.cling = true;
        p.face = ax;
        p.vx = 0;
        p.vy = Math.min(p.vy, 42);
        if (G.jumpBuf > 0) {
          p.cling = false;
          p.face = -ax;
          p.vx = p.face * heroWalk();
          p.vy = -JUMP_V * 0.94;
          G.jumpBuf = 0;
          p.squash = 0.78;
          if (playing()) audio.hop();
          hitStop(0.02);
        }
      }

      if (!p.cling) {
        if (p.grounded) {
          p.vx = (p.duck || whipping) ? 0 : ax * heroWalk();
        } else if (G.hero === 'grant' && ax) {
          p.face = ax;
        }
      }
      p.x += p.vx * dt;
      p.x = clamp(p.x, 16, G.levelW - 16);
      if (G.boss && G.boss.active && !G.boss.dead) {
        const minX = G.levelW - VW + 18;
        if (p.x < minX) p.x = minX;
      }

      const canJump = (p.grounded || p.coyote > 0) && !p.duck && !whipping && !p.cling;
      if (G.jumpBuf > 0 && canJump) {
        p.vy = -JUMP_V;
        p.grounded = false;
        p.coyote = 0;
        G.jumpBuf = 0;
        p.squash = 0.78;
        p.ride = null;
        if (ax) {
          p.face = ax;
          p.vx = ax * heroWalk();
        } else {
          p.vx = 0;
        }
        if (playing()) audio.hop();
        emit(5, {
          x: p.x, y: p.y, j: 8,
          vx0: -60, vx1: 60, vy0: -20, vy1: 40,
          life: 0.22, r0: 1, r1: 2.2, rgb: WHT, g: 200
        });
        hitStop(0.024);
      }

      if (!p.cling) {
        p.vy += GRAV * dt;
        if (p.vy > MAX_FALL) p.vy = MAX_FALL;
      }
      const y0 = p.y;
      let y1 = p.y + p.vy * dt;
      p.grounded = false;
      p.ride = null;
      if (p.vy >= 0) {
        const plat = landOn(p.x, y0, y1, null);
        if (plat) {
          y1 = plat.y;
          if (p.vy > 220 && playing()) {
            audio.land();
            p.squash = 0.82;
            emit(6, {
              x: p.x, y: p.y, j: 10,
              vx0: -80, vx1: 80, vy0: -30, vy1: 10,
              life: 0.2, r0: 1, r1: 2.4, rgb: HOT2, g: 180
            });
            kick(1.6, 'thump');
          }
          p.vy = 0;
          p.grounded = true;
          p.coyote = COYOTE;
          if (plat.gear) p.ride = plat.gear;
        }
      }
      p.y = y1;
      if (p.grounded) p.coyote = COYOTE;
      else p.coyote -= dt;
    }

    if (p.y > VH + 90) hurt('fall', 16);
    if (playing() && specOf().theme === 'ship' && !p.grounded && !p.onLad && p.y > waterY() - 2) {
      hurt('water', 2, p.x);
      p.vy = -280;
    }
    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    if (p.grounded && Math.abs(p.vx) > 20) p.run += dt * 10;
    else p.run += dt * 2;
    if (p.pose > 0) p.pose -= dt;

    if (p.grounded && !p.onLad && p.x > G.checkX + 80) {
      const ck = platUnder(p.x, p.y, null);
      if (ck && ck.base && p.x > ck.x + 36 && p.x < ck.x + ck.w - 36) {
        G.checkX = p.x;
        G.checkY = p.y;
      }
    }

    if (G.whipT > 0) G.whipT -= dt;
    if (G.subCd > 0) G.subCd -= dt;
    if (G.subFlash > 0) G.subFlash -= dt;

    const wantWhip = fireHeld();
    if (wantWhip && !G.fireEdge) tryWhip();
    G.fireEdge = wantWhip;

    const wantSub = subHeld();
    if (wantSub && !G.subEdge) trySub();
    G.subEdge = wantSub;

    resolveWhip();

    let i;
    for (i = 0; i < G.pickups.length; i++) {
      const u = G.pickups[i];
      if (u.taken) continue;
      u.t += dt;
      u.life -= dt;
      u.vy += 420 * dt;
      if (u.vy > 160) u.vy = 160;
      const uy0 = u.y;
      u.y += u.vy * dt;
      const plat = landOn(u.x, uy0, u.y, null);
      if (plat) {
        u.y = plat.y - 10;
        u.vy = 0;
      }
      if (u.life <= 0) u.taken = true;
      if (hypot(p.x - u.x, (p.y - 12) - u.y) < 18) takePickup(u);
    }

    if (G.fork) {
      for (i = 0; i < G.gates.length; i++) {
        const gate = G.gates[i];
        if (Math.abs(p.x - gate.x) < 22 && p.y > GY - 48) {
          pickRoute(gate);
          break;
        }
      }
    }

    if (G.invuln > 0) return;
    const pb = pBox();
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (e.frozen > 0) continue;
      if (overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.45, e.y - e.h, e.w * 0.9, e.h * 0.92)) {
        hurt('hit', e.kind === 'bone' ? 3 : 2, e.x);
        return;
      }
    }
    if (G.boss && !G.boss.dead && G.boss.active) {
      const b = G.boss;
      if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.4, b.y - b.h, b.w * 0.8, b.h * 0.9)) {
        hurt('boss', 3, b.x);
      }
    }
  }

  function hitEnemy(e, dmg, src) {
    if (e.dead) return;
    e.hp -= dmg;
    e.hitN = 0.08;
    if (src === 'ice') e.frozen = Math.max(e.frozen, 1.15);
    const cx = e.x;
    const cy = e.y - e.h * 0.5;
    if (e.hp <= 0) {
      e.dead = true;
      bumpCombo();
      const sc = (SCORE[e.kind] || 100) * G.mult;
      addScore(sc);
      floatText(cx, cy, String(sc), GOLD, e.kind === 'bone');
      audio.hit(G.combo);
      juice(cx, cy, e.kind === 'ghost' ? ICE : e.kind === 'flea' ? ORG : HOT, e.kind === 'bone' ? 1.1 : 0.75);
      hitStop(e.kind === 'bone' ? 0.06 : 0.042);
    } else {
      audio.crack();
      emit(6, {
        x: cx, y: cy, j: 5,
        vx0: -120, vx1: 120, vy0: -180, vy1: -20,
        life: 0.2, r0: 1, r1: 2.4, rgb: src === 'ice' ? ICE : src === 'whip' ? CYN : GOLD
      });
      hitStop(0.034);
    }
  }

  function resolveWhip() {
    const box = whipBox();
    if (!box) return;
    const ice = G.hero === 'sypha';
    const dmg = ice ? 1 : (G.whipLv >= 3 ? 2 : 1);
    const src = ice ? 'ice' : 'whip';
    let i, c, e;
    for (i = 0; i < G.candles.length; i++) {
      c = G.candles[i];
      if (c.broken) continue;
      if (overlap(box.x, box.y, box.w, box.h, c.x - 12, c.y - 20, 24, 34)) breakCandle(c);
    }
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (G.whipHit[e.id]) continue;
      if (overlap(box.x, box.y, box.w, box.h, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
        G.whipHit[e.id] = 1;
        hitEnemy(e, dmg, src);
      }
    }
    if (G.boss && !G.boss.dead && G.boss.active && !G.whipHit[G.boss.id]) {
      const b = G.boss;
      if (overlap(box.x, box.y, box.w, box.h, b.x - b.w * 0.5, b.y - b.h, b.w, b.h)) {
        G.whipHit[b.id] = 1;
        hitBoss(dmg);
      }
    }
  }

  function hitBoss(dmg) {
    const b = G.boss;
    if (!b || b.dead) return;
    b.hp -= dmg;
    b.hitN = 0.1;
    audio.hit(G.combo);
    juice(b.x, b.y - 20, MAG, 1.05);
    hitStop(0.07);
    kick(3.2, 'boom');
    if (b.hp <= 0) {
      if (b.kind === '伯爵' && b.form < 3) {
        b.form += 1;
        if (b.form === 2) {
          b.kind = '化兽';
          b.name = '化兽伯爵';
          b.hp = (20 * (isCore() ? 1.22 : 1)) | 0;
          b.h = 38;
          b.w = 42;
          b.state = 'rush';
          b.y = GY;
          toast('伯爵化兽', false, true);
        } else {
          b.kind = '最终';
          b.name = '最终伯爵';
          b.hp = (16 * (isCore() ? 1.22 : 1)) | 0;
          b.h = 40;
          b.w = 36;
          b.state = 'fly';
          b.y = GY - 80;
          toast('最终形态', false, true);
        }
        b.max = b.hp;
        b.fire = 0.4;
        audio.transform();
        juice(b.x, b.y - 10, HOT, 1.5);
        screenFlash(HOT, 0.4);
        hitStop(0.08);
        syncHud();
        return;
      }
      b.dead = true;
      b.active = false;
      bumpCombo();
      addScore(SCORE.boss * G.mult);
      addScore(SCORE.stage * G.stage);
      floatText(b.x, b.y - 30, String(SCORE.boss * G.mult), GOLD, true);
      audio.boom();
      juice(b.x, b.y - 18, GOLD, 1.6);
      toast(b.name + ' 倒下', false, true);
      G.lock = 0.2;
      if (G.stage === 1) spawnFork();
      else G.clearT = 1.6;
    }
  }

  function onScreen(x, y, pad) {
    const m = pad || 40;
    return x > G.camX - m && x < G.camX + VW + m && y > G.camY - m && y < G.camY + VH + m;
  }

  function spawnOwl() {
    let n = 0;
    let i;
    for (i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].dead && G.ents[i].kind === 'owl') n += 1;
    }
    const cap = isCore() ? 4 : 3;
    if (n >= cap) return;
    const fromL = Math.random() < 0.5;
    const x = fromL ? G.camX - 18 : G.camX + VW + 18;
    const y = 150 + rand(0, 140);
    const e = makeEnt(x, y, 'owl', 0, 0);
    e.face = fromL ? 1 : -1;
    e.base = y;
    G.ents.push(e);
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    if (e.hitN > 0) e.hitN -= dt;
    if (e.frozen > 0) {
      e.frozen -= dt;
      return;
    }
    if (frozenWorld()) return;
    e.t += dt;
    const mul = spdMul(isCore(), G.stage);
    const p = G.player;
    if (e.kind === 'ghost') {
      e.x += e.face * 72 * mul * dt;
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
      e.y = e.base + Math.sin(e.t * 2.6) * 22;
      if (p && Math.abs(p.x - e.x) < 220) e.y += (p.y - 40 - e.y) * 0.4 * dt;
      return;
    }
    if (e.kind === 'owl') {
      if (e.state === 'swoop') {
        e.x += e.face * 160 * mul * dt;
        e.y += e.vy * dt;
        e.vy += 260 * dt;
        if (e.y > GY - 8 || e.swoopT < 0) {
          e.state = 'fly';
          e.base = Math.min(e.y, MY);
          e.vy = 0;
        }
        e.swoopT = (e.swoopT || 0.7) - dt;
        return;
      }
      e.x += (e.face || -1) * 58 * mul * dt;
      if (e.a && e.x < e.a) e.face = 1;
      if (e.b && e.x > e.b) e.face = -1;
      if ((!e.a && !e.b) && (e.x < G.camX - 60 || e.x > G.camX + VW + 60)) e.dead = true;
      e.y = e.base + Math.sin(e.t * 3.1) * 16;
      if (p && Math.abs(p.x - e.x) < 90 && p.y > e.y + 10 && e.fire <= 0) {
        e.state = 'swoop';
        e.vy = 40;
        e.face = p.x < e.x ? -1 : 1;
        e.swoopT = 0.7;
        e.fire = 1.6;
      }
      e.fire -= dt;
      return;
    }
    if (!onScreen(e.x, e.y, 80)) return;
    if (e.kind === 'bone') {
      e.x = e.home;
      e.face = p && p.x < e.x ? -1 : 1;
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0 && p && Math.abs(p.x - e.x) < 280) {
        e.fire = (isCore() ? 1.15 : 1.55) / mul;
        spawnShot({
          x: e.x + e.face * 8, y: e.y - 22,
          vx: e.face * 150, vy: -240,
          from: 'e', kind: 'bone', dmg: 2, pierce: 0,
          life: 1.5, rgb: WHT, hit: [], grav: 680, spin: 0
        });
      }
      return;
    }
    if (e.kind === 'flea') {
      if (e.grounded) {
        e.fire -= dt;
        e.vx = 0;
        if (e.fire <= 0 && p) {
          e.vy = -340;
          e.vx = (p.x < e.x ? -1 : 1) * 150 * mul;
          e.face = e.vx >= 0 ? 1 : -1;
          e.grounded = false;
          e.fire = 0.62;
        }
      } else {
        e.vy += GRAV * dt;
        e.x += e.vx * dt;
        const y0 = e.y;
        e.y += e.vy * dt;
        if (e.vy > 0) {
          const plat = landOn(e.x, y0, e.y, null);
          if (plat) {
            e.y = plat.y;
            e.vy = 0;
            e.vx = 0;
            e.grounded = true;
          }
        }
        if (e.y > VH + 20) e.dead = true;
      }
      return;
    }
    const walk = 30 * mul;
    if (e.x < e.a) e.face = 1;
    if (e.x > e.b) e.face = -1;
    if (!standAt(e.x + e.face * 12, e.y) && standAt(e.x, e.y)) e.face *= -1;
    else e.x += e.face * walk * dt;
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    if (b.hitN > 0) b.hitN -= dt;
    const p = G.player;
    if (!b.active) {
      if (playing() && !G.fork && p.x > G.levelW - 420) {
        b.active = true;
        audio.boss();
        toast(b.name + ' 现身', false, true);
        screenFlash(HOT, 0.32);
        kick(3.4, 'boom');
      }
      return;
    }
    if (frozenWorld()) return;
    b.t += dt;
    const mul = spdMul(isCore(), G.stage);
    const low = b.hp / b.max < 0.42;
    if (b.kind === '木乃伊') {
      b.y = GY;
      if (b.x < G.levelW - 340) b.face = 1;
      if (b.x > G.levelW - 70) b.face = -1;
      b.x += b.face * 46 * mul * dt;
      b.face = p.x < b.x ? -1 : 1;
      b.fire -= dt;
      if (b.fire <= 0 && playing() && G.deadT <= 0) {
        b.fire = (low ? 0.7 : 1.05) / mul;
        spawnShot({
          x: b.x + b.face * 12, y: b.y - 26,
          vx: b.face * 180, vy: 0,
          from: 'e', kind: 'bandage', dmg: 2, pierce: 0,
          life: 1.4, rgb: STN, hit: []
        });
        if (low) {
          spawnShot({
            x: b.x + b.face * 8, y: b.y - 18,
            vx: b.face * 140, vy: -40,
            from: 'e', kind: 'bandage', dmg: 2, pierce: 0,
            life: 1.3, rgb: STN, hit: []
          });
        }
      }
    } else if (b.kind === '时钟魔') {
      b.x = G.levelW - 180 + Math.sin(b.t * 0.9) * 80;
      b.y = GY - 80 + Math.sin(b.t * 1.6) * 26;
      b.face = p.x < b.x ? -1 : 1;
      b.fire -= dt;
      if (b.fire <= 0 && playing() && G.deadT <= 0) {
        b.fire = (low ? 0.62 : 0.95) / mul;
        const n = low ? 3 : 2;
        let i;
        for (i = 0; i < n; i++) {
          spawnShot({
            x: b.x, y: b.y,
            vx: (p.x - b.x) * 0.4 + (i - 1) * 50,
            vy: 70 + i * 30,
            from: 'e', kind: 'gear', dmg: 3, pierce: 0,
            life: 1.5, rgb: GOLD, hit: [], spin: 0
          });
        }
      }
    } else if (b.kind === '船骸') {
      b.x = G.levelW - 170 + Math.sin(b.t * 0.75) * 90;
      b.y = GY - 70 + Math.sin(b.t * 1.4) * 24;
      b.face = p.x < b.x ? -1 : 1;
      b.fire -= dt;
      if (b.fire <= 0 && playing() && G.deadT <= 0) {
        b.fire = (low ? 0.7 : 1.05) / mul;
        spawnShot({
          x: b.x, y: b.y - 8,
          vx: b.face * 160, vy: 50,
          from: 'e', kind: 'spit', dmg: 3, pierce: 0,
          life: 1.4, rgb: ICE, hit: []
        });
        if (low && Math.random() < 0.45) {
          const g = makeEnt(b.x, b.y, 'ghost', G.levelW - 360, G.levelW - 40);
          g.face = b.face;
          G.ents.push(g);
        }
      }
    } else if (b.kind === '化兽') {
      if (b.x < G.levelW - 360) b.face = 1;
      if (b.x > G.levelW - 60) b.face = -1;
      b.x += b.face * (low ? 150 : 110) * mul * dt;
      b.y = GY;
      b.fire -= dt;
      if (b.fire <= 0 && playing() && G.deadT <= 0) {
        b.fire = (low ? 0.85 : 1.2) / mul;
        spawnShot({
          x: b.x + b.face * 14, y: b.y - 18,
          vx: b.face * 220, vy: -40,
          from: 'e', kind: 'fire', dmg: 3, pierce: 0,
          life: 1.1, rgb: ORG, hit: []
        });
      }
    } else if (b.kind === '最终') {
      b.swoop = (b.swoop || 0) + dt;
      if (b.swoop > 2.1) {
        b.x += (p.x - b.x) * 1.8 * dt;
        b.y += (p.y - 20 - b.y) * 1.6 * dt;
        if (b.swoop > 2.8) b.swoop = 0;
      } else {
        b.x = G.levelW - 160 + Math.sin(b.t * 1.1) * 90;
        b.y = GY - 90 + Math.sin(b.t * 2.1) * 24;
      }
      b.face = p.x < b.x ? -1 : 1;
      b.fire -= dt;
      if (b.fire <= 0 && playing() && G.deadT <= 0) {
        b.fire = (low ? 0.5 : 0.78) / mul;
        const n = low ? 5 : 3;
        let i;
        for (i = 0; i < n; i++) {
          const a = -0.55 + i * (1.1 / Math.max(1, n - 1));
          spawnShot({
            x: b.x + b.face * 10, y: b.y - 16,
            vx: Math.cos(a) * b.face * 230,
            vy: Math.sin(a) * 180 - 40,
            from: 'e', kind: 'fire', dmg: 3, pierce: 0,
            life: 1.5, rgb: ORG, hit: []
          });
        }
      }
    } else {
      if (b.state === 'wait' || !b.state) b.state = 'idle';
      b.y = GY;
      b.fire -= dt;
      if (b.fire <= 0 && playing() && G.deadT <= 0) {
        if (b.state === 'idle') {
          b.state = 'tp';
          b.fire = 0.16;
          popSpark(b.x, b.y - 20, MAG, 22);
        } else if (b.state === 'tp') {
          b.x = G.levelW - 80 - rand(40, 260);
          b.face = p.x < b.x ? -1 : 1;
          b.state = 'cast';
          b.fire = 0.22;
          popSpark(b.x, b.y - 20, HOT, 22);
          audio.crack();
        } else {
          const n = low ? 5 : 3;
          let i;
          for (i = 0; i < n; i++) {
            const a = -0.55 + i * (1.1 / Math.max(1, n - 1));
            spawnShot({
              x: b.x + b.face * 10, y: b.y - 26,
              vx: Math.cos(a) * b.face * 230,
              vy: Math.sin(a) * 180 - 40,
              from: 'e', kind: 'fire', dmg: 3, pierce: 0,
              life: 1.5, rgb: ORG, hit: []
            });
          }
          b.state = 'idle';
          b.fire = (low ? 0.65 : 1.05) / mul;
        }
      }
    }
  }

  function shotHits(s, x, y, w, h) {
    const r = s.kind === 'pool' ? 16 : (s.kind === 'axe' || s.kind === 'gear' ? 9 : 5);
    return overlap(s.x - r, s.y - r, r * 2, r * 2, x - w * 0.5, y - h, w, h);
  }

  function updateShots(dt) {
    const p = G.player;
    let i, s, j, e;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      if (frozenWorld() && s.from === 'e') continue;
      s.life -= dt;
      if (s.spin != null) s.spin += dt * 10;
      if (s.kind === 'pool') {
        s.y = s.ground || s.y;
        s.tick = (s.tick || 0) + dt;
        if (s.tick > 0.28) {
          s.tick = 0;
          s.hit = [];
        }
        emit(1, {
          x: s.x, y: s.y - 4, j: 4,
          vx0: -20, vx1: 20, vy0: -50, vy1: -10,
          life: 0.18, r0: 1, r1: 2.2, rgb: MAG, g: 40
        });
      } else {
        if (s.grav) s.vy += s.grav * dt;
        const y0 = s.y;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.kind === 'flask' || s.kind === 'axe' || s.kind === 'bone' || s.kind === 'gear') {
          const plat = s.vy >= 0 ? landOn(s.x, y0, s.y, null) : null;
          if (plat) {
            if (s.kind === 'flask') {
              s.kind = 'pool';
              s.vx = 0;
              s.vy = 0;
              s.grav = 0;
              s.y = plat.y - 2;
              s.ground = plat.y - 2;
              s.life = 1.45;
              s.tick = 0;
              audio.sub('water');
              popSpark(s.x, s.y, MAG, 14);
              continue;
            }
            s.life = 0;
          }
        }
      }
      if (s.life <= 0 || s.x < G.camX - 80 || s.x > G.camX + VW + 80 || s.y > VH + 40 || s.y < -40) {
        G.shots.splice(i, 1);
        continue;
      }
      if (s.from === 'p') {
        for (j = 0; j < G.ents.length; j++) {
          e = G.ents[j];
          if (e.dead) continue;
          if (s.hit.indexOf(e.id) >= 0) continue;
          if (shotHits(s, e.x, e.y, e.w, e.h)) {
            s.hit.push(e.id);
            hitEnemy(e, s.dmg || 1, s.kind);
            if (s.kind === 'pool') continue;
            if (!s.pierce) {
              s.life = 0;
              break;
            }
            s.pierce -= 1;
          }
        }
        if (s.life > 0 && G.boss && G.boss.active && !G.boss.dead) {
          if (s.hit.indexOf(G.boss.id) < 0 && shotHits(s, G.boss.x, G.boss.y, G.boss.w, G.boss.h)) {
            s.hit.push(G.boss.id);
            hitBoss(s.dmg || 1);
            if (s.kind !== 'pool' && !s.pierce) s.life = 0;
            else if (s.pierce) s.pierce -= 1;
          }
        }
      } else if (playing() && G.deadT <= 0 && G.invuln <= 0) {
        const pb = pBox();
        if (shotHits(s, p.x, p.y, p.w, p.h) || overlap(s.x - 4, s.y - 4, 8, 8, pb.x, pb.y, pb.w, pb.h)) {
          s.life = 0;
          hurt('hit', s.dmg || 2, s.x);
        }
      }
    }
  }

  function updateCam(dt) {
    const p = G.player;
    if (!p) return;
    let tx = p.face > 0 ? p.x - VW * 0.36 : p.x - VW * 0.56;
    if ((G.boss && G.boss.active && !G.boss.dead) || G.fork) tx = G.levelW - VW;
    tx = clamp(tx, 0, Math.max(0, G.levelW - VW));
    let ty = 0;
    if (p.y < HY + 30) ty = -36;
    G.camX = lerp(G.camX, tx, 1 - Math.pow(0.0008, dt));
    G.camY = lerp(G.camY, ty, 1 - Math.pow(0.002, dt));
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
    if (mist.length < 18) {
      mist.push({
        x: rand(G.camX - 40, G.camX + VW + 40),
        y: rand(40, 220),
        r: rand(10, 28),
        a: rand(0.03, 0.09),
        vx: rand(-8, 8)
      });
    }
    for (i = mist.length - 1; i >= 0; i--) {
      o = mist[i];
      o.x += o.vx * dt;
      if (o.x < G.camX - 80 || o.x > G.camX + VW + 80) mist.splice(i, 1);
    }
    if (isCore() || specOf().theme === 'ship') {
      if (rain.length < 40) {
        rain.push({
          x: G.camX + rand(-20, VW + 20),
          y: G.camY + rand(-20, VH),
          l: rand(8, 16),
          v: rand(180, 300)
        });
      }
      for (i = rain.length - 1; i >= 0; i--) {
        o = rain[i];
        o.y += o.v * dt;
        o.x += 30 * dt;
        if (o.y > G.camY + VH + 10) {
          o.y = G.camY - 10;
          o.x = G.camX + rand(-20, VW + 20);
        }
      }
    } else if (rain.length) rain.length = 0;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0002, dt));
    if (G.invuln > 0 && playing()) G.invuln -= dt;
    if (G.timeStop > 0) G.timeStop -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
  }

  function update(dt) {
    G.clock += dt;
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    if (G.lock > 0) G.lock = Math.max(0, G.lock - dt);
    if (G.clearT > 0) {
      G.clearT -= dt;
      updateCam(dt);
      updateFx(dt);
      if (G.clearT <= 0) nextStage();
      return;
    }
    if (!live()) {
      updateFx(dt);
      return;
    }
    if (G.mode === 'title') demoThink();
    updatePlayer(dt);
    let i;
    for (i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    updateBoss(dt);
    updateShots(dt);
    if (playing() && G.deadT <= 0 && (G.stage >= 2 || isCore())) {
      const bossOn = G.boss && G.boss.active && !G.boss.dead;
      if (!bossOn && !G.fork) {
        G.owlT -= dt;
        const wait = (G.stage >= 2 ? 1.4 : 1.8) / spdMul(isCore(), G.stage);
        if (G.owlT <= 0) {
          G.owlT = wait + rand(0, 0.4);
          spawnOwl();
        }
      }
    }
    for (i = 0; i < G.candles.length; i++) G.candles[i].t += dt;
    updateCam(dt);
    updateFx(dt);
  }

  function drawSky() {
    const spec = specOf();
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (spec.theme === 'castle') {
      g.addColorStop(0, '#180610');
      g.addColorStop(0.55, '#220814');
      g.addColorStop(1, '#10080c');
    } else if (spec.theme === 'clock') {
      g.addColorStop(0, '#12081c');
      g.addColorStop(0.5, '#1a1028');
      g.addColorStop(1, '#0c0814');
    } else if (spec.theme === 'ship') {
      g.addColorStop(0, '#081018');
      g.addColorStop(0.5, '#0c1422');
      g.addColorStop(1, '#081018');
    } else {
      g.addColorStop(0, '#14081c');
      g.addColorStop(0.5, '#1a0c22');
      g.addColorStop(1, '#0c0816');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const mx = sx(G.camX + VW * 0.78);
    const my = sy(G.camY + 42);
    ctx.fillStyle = rgba(spec.theme === 'castle' ? MAG : GOLD, isCore() ? 0.28 : 0.5);
    ctx.beginPath();
    ctx.arc(mx, my, 20 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.16);
    ctx.beginPath();
    ctx.arc(mx - 6 * scale, my - 4 * scale, 9 * scale, 0, TAU);
    ctx.fill();

    let i;
    for (i = 0; i < 18; i++) {
      const hx = hash2(i + 11 + G.stage);
      const hy = hash2(i + 29);
      ctx.fillStyle = rgba(WHT, 0.18 + hx * 0.35);
      ctx.fillRect(
        sx(G.camX + (hx * VW + G.clock * 3) % VW),
        sy(G.camY + 12 + hy * 90),
        1.4 * scale, 1.4 * scale
      );
    }
  }

  function drawBackdrop() {
    const spec = specOf();
    const par = G.camX * 0.28;
    const base = sy(GY + 6);
    let i, x, h, w, win;
    for (i = -2; i < 26; i++) {
      x = sx((Math.floor((G.camX + par) / 72) + i) * 72 - par);
      h = (70 + hash2(i + 17 + G.stage * 9) * 110) * scale;
      w = (36 + hash2(i + 5) * 22) * scale;
      ctx.fillStyle = spec.theme === 'ship' ? (i % 2 ? '#0c1420' : '#0a1018') : (i % 2 ? '#140818' : '#0e0614');
      ctx.fillRect(x, base - h, w, h + 40 * scale);
      ctx.fillStyle = rgba(spec.theme === 'clock' ? GOLD : MAG, 0.12);
      ctx.fillRect(x, base - h, w, 3 * scale);
      win = hash2(i + 3);
      ctx.fillStyle = win > 0.55 ? rgba(GOLD, 0.32) : rgba(CYN, 0.14);
      ctx.fillRect(x + 8 * scale, base - h + 16 * scale, 6 * scale, 8 * scale);
      ctx.fillRect(x + 20 * scale, base - h + 32 * scale, 6 * scale, 8 * scale);
      if (spec.theme === 'clock') {
        ctx.fillStyle = rgba(GOLD, 0.18);
        ctx.beginPath();
        ctx.arc(x + w * 0.5, base - h - 10 * scale, 8 * scale, 0, TAU);
        ctx.fill();
      }
      if (spec.theme === 'ship') {
        ctx.strokeStyle = rgba(STN, 0.4);
        ctx.lineWidth = 1.4 * scale;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, base - h);
        ctx.lineTo(x + w * 0.5, base - h - 22 * scale);
        ctx.stroke();
      }
    }
    if (spec.theme === 'clock') {
      const px = sx(G.camX + VW * 0.5);
      const py = sy(G.camY + 8);
      const ang = Math.sin(G.clock * 1.05) * 0.55;
      ctx.strokeStyle = rgba(GOLD, 0.35);
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.sin(ang) * 70 * scale, py + Math.cos(ang) * 70 * scale);
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.5);
      ctx.beginPath();
      ctx.arc(px + Math.sin(ang) * 70 * scale, py + Math.cos(ang) * 70 * scale, 6 * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < mist.length; i++) {
      const m = mist[i];
      ctx.fillStyle = rgba(spec.theme === 'ship' ? ICE : HOT2, m.a);
      ctx.beginPath();
      ctx.arc(sx(m.x), sy(m.y), m.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawAbyss() {
    const spec = specOf();
    const bases = G.plats.filter(function (p) { return p.base; });
    const y = sy(GY + 8);
    ctx.fillStyle = rgba(spec.theme === 'ship' ? CYN : MAG, 0.08);
    ctx.fillRect(sx(G.camX - 10), y, (VW + 20) * scale, 50 * scale);
    let x, covered, i;
    const wy = spec.theme === 'ship' ? waterY() : GY + 8;
    for (x = G.camX; x < G.camX + VW; x += 16) {
      covered = false;
      for (i = 0; i < bases.length; i++) {
        if (x >= bases[i].x && x <= bases[i].x + bases[i].w) covered = true;
      }
      if (covered && spec.theme !== 'ship') continue;
      const wave = Math.sin(x * 0.12 + G.clock * 5) * 3;
      ctx.fillStyle = rgba(spec.theme === 'ship' ? CYN : MAG, 0.22 + Math.sin(x * 0.1 + G.clock * 4) * 0.08);
      ctx.fillRect(sx(x), sy(wy + wave), 14 * scale, 14 * scale);
      ctx.fillStyle = rgba(HOT, 0.1);
      ctx.fillRect(sx(x), sy(wy + 8), 14 * scale, 8 * scale);
    }
  }

  function drawPlats() {
    const spec = specOf();
    let i, p, x, y, w, h, k, n;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      x = sx(p.x);
      y = sy(p.y);
      w = p.w * scale;
      h = p.h * scale;
      ctx.fillStyle = p.gear ? '#241428' : p.base ? '#160a22' : '#1a1028';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(p.gear ? GOLD : spec.theme === 'ship' ? CYN : MAG, p.base ? 0.85 : 0.7);
      ctx.fillRect(x, y, w, 2.4 * scale);
      ctx.fillStyle = rgba(GOLD, 0.22);
      ctx.fillRect(x + 2 * scale, y + 2.4 * scale, w - 4 * scale, 1.2 * scale);
      if (p.gear) {
        ctx.strokeStyle = rgba(GOLD, 0.45);
        ctx.lineWidth = 1.2 * scale;
        ctx.beginPath();
        ctx.arc(x + w * 0.5, y + 6 * scale, 7 * scale, 0, TAU);
        ctx.stroke();
      }
      if (p.base) {
        n = Math.max(2, (p.w / 28) | 0);
        for (k = 0; k <= n; k++) {
          ctx.fillStyle = k % 2 ? rgba(MAG, 0.2) : rgba(CYN, 0.1);
          ctx.fillRect(x + (k / n) * w, y, 2 * scale, 6 * scale);
        }
      }
    }
    for (i = 0; i < G.walls.length; i++) {
      const wall = G.walls[i];
      ctx.fillStyle = rgba(STN, 0.45);
      ctx.fillRect(sx(wall.x - 3), sy(wall.y0), 6 * scale, (wall.y1 - wall.y0) * scale);
      ctx.fillStyle = rgba(CYN, 0.35);
      ctx.fillRect(sx(wall.x - 1), sy(wall.y0), 2 * scale, (wall.y1 - wall.y0) * scale);
    }
  }

  function drawLads() {
    let i, l, k, y;
    for (i = 0; i < G.lads.length; i++) {
      l = G.lads[i];
      ctx.strokeStyle = rgba(GOLD, 0.55);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(l.x), sy(l.y0));
      ctx.lineTo(sx(l.x), sy(l.y1));
      ctx.stroke();
      const steps = Math.max(4, ((l.y1 - l.y0) / 12) | 0);
      for (k = 0; k <= steps; k++) {
        y = l.y0 + (k / steps) * (l.y1 - l.y0);
        ctx.fillStyle = rgba(HOT2, 0.75);
        ctx.fillRect(sx(l.x) - 5 * scale, sy(y) - 1.2 * scale, 10 * scale, 2.2 * scale);
      }
    }
  }

  function drawGates() {
    if (!G.fork) return;
    let i;
    for (i = 0; i < G.gates.length; i++) {
      const g = G.gates[i];
      const x = sx(g.x);
      const y = sy(g.y);
      const s = scale;
      const rgb = g.route === 'clock' ? CYN : ICE;
      const pulse = 0.55 + Math.sin(G.clock * 6 + i) * 0.25;
      ctx.fillStyle = rgba(rgb, 0.12 * pulse);
      ctx.beginPath();
      ctx.ellipse(x, y - 28 * s, 22 * s, 32 * s, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(rgb, 0.85);
      ctx.lineWidth = 2.4 * s;
      ctx.beginPath();
      ctx.moveTo(x - 16 * s, y);
      ctx.quadraticCurveTo(x - 16 * s, y - 52 * s, x, y - 56 * s);
      ctx.quadraticCurveTo(x + 16 * s, y - 52 * s, x + 16 * s, y);
      ctx.stroke();
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.font = 'bold ' + (11 * s) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(g.name, x, y - 62 * s);
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.font = 'bold ' + (9 * s) + 'px sans-serif';
      ctx.fillText(g.partner === 'grant' ? '格兰特' : '西法', x, y - 50 * s);
    }
  }

  function drawCandle(c) {
    if (c.broken) return;
    const x = sx(c.x);
    const y = sy(c.y);
    const s = scale;
    const flick = 0.7 + Math.sin(c.t * 9 + c.x) * 0.3;
    ctx.fillStyle = rgba(GOLD, 0.18 * flick);
    ctx.beginPath();
    ctx.arc(x, y - 10 * s, 10 * s * flick, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3a2a14';
    ctx.fillRect(x - 1.4 * s, y - 6 * s, 2.8 * s, 12 * s);
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillRect(x - 3.2 * s, y - 10 * s, 6.4 * s, 6 * s);
    ctx.fillStyle = rgba(ORG, 0.95 * flick);
    ctx.beginPath();
    ctx.ellipse(x, y - 14 * s, 2.2 * s, 4.2 * s * flick, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.beginPath();
    ctx.arc(x, y - 15 * s, 1.1 * s, 0, TAU);
    ctx.fill();
  }

  function drawPickup(u) {
    if (u.taken) return;
    const x = sx(u.x);
    const y = sy(u.y + Math.sin(G.clock * 5 + u.t) * 2);
    const s = scale;
    let rgb = MAG;
    let mark = '心';
    if (u.kind === 'whip') { rgb = GOLD; mark = '鞭'; }
    else if (u.kind === 'knife') { rgb = CYN; mark = '匕'; }
    else if (u.kind === 'axe') { rgb = GOLD; mark = '斧'; }
    else if (u.kind === 'water') { rgb = HOT2; mark = '水'; }
    else if (u.kind === 'watch') { rgb = GOLD; mark = '表'; }
    else if (u.kind === 'meat') { rgb = ORG; mark = '肉'; }
    else if (u.kind === 'potion') { rgb = LEAF; mark = '药'; }
    else if (u.kind === 'heart5') { rgb = MAG; mark = '心'; }
    ctx.fillStyle = rgba(rgb, 0.2);
    ctx.beginPath();
    ctx.arc(x, y, 10 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.fillRect(x - 7 * s, y - 7 * s, 14 * s, 14 * s);
    ctx.strokeStyle = rgba(WHT, 0.65);
    ctx.lineWidth = 1.1 * s;
    ctx.strokeRect(x - 7 * s, y - 7 * s, 14 * s, 14 * s);
    ctx.fillStyle = '#14081c';
    ctx.font = 'bold ' + (9 * s) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mark, x, y + 0.5 * s);
  }

  function drawShot(s) {
    const x = sx(s.x);
    const y = sy(s.y);
    const sc = scale;
    ctx.save();
    ctx.translate(x, y);
    if (s.kind === 'axe' || s.kind === 'gear' || s.kind === 'bone') ctx.rotate(s.spin || G.clock * 8);
    if (s.kind === 'pool') {
      ctx.fillStyle = rgba(MAG, 0.55);
      ctx.beginPath();
      ctx.ellipse(0, 0, 16 * sc, 5 * sc, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT2, 0.8);
      ctx.beginPath();
      ctx.ellipse(0, -6 * sc, 5 * sc, 8 * sc, 0, 0, TAU);
      ctx.fill();
    } else if (s.kind === 'flask') {
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.fillRect(-3 * sc, -5 * sc, 6 * sc, 8 * sc);
      ctx.fillStyle = rgba(CYN, 0.7);
      ctx.fillRect(-2 * sc, -3 * sc, 4 * sc, 4 * sc);
    } else if (s.kind === 'axe') {
      ctx.fillStyle = rgba(s.rgb || GOLD, 0.95);
      ctx.fillRect(-3 * sc, -8 * sc, 6 * sc, 16 * sc);
      ctx.fillRect(-8 * sc, -8 * sc, 16 * sc, 5 * sc);
    } else if (s.kind === 'gear') {
      ctx.strokeStyle = rgba(GOLD, 0.95);
      ctx.lineWidth = 2 * sc;
      ctx.beginPath();
      ctx.arc(0, 0, 7 * sc, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.fillRect(-2 * sc, -8 * sc, 4 * sc, 16 * sc);
      ctx.fillRect(-8 * sc, -2 * sc, 16 * sc, 4 * sc);
    } else if (s.kind === 'fire' || s.kind === 'spit') {
      ctx.fillStyle = rgba(s.rgb || ORG, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 5 * sc, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.beginPath();
      ctx.arc(-1 * sc, -1 * sc, 2 * sc, 0, TAU);
      ctx.fill();
    } else if (s.kind === 'bandage' || s.kind === 'bone') {
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.fillRect(-6 * sc, -2 * sc, 12 * sc, 4 * sc);
      ctx.fillStyle = rgba(STN, 0.8);
      ctx.fillRect(-2 * sc, -2 * sc, 4 * sc, 4 * sc);
    } else {
      ctx.fillStyle = rgba(s.rgb || CYN, 0.95);
      ctx.fillRect(-5 * sc, -1.6 * sc, 11 * sc, 3.2 * sc);
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.fillRect(2 * sc, -0.8 * sc, 4 * sc, 1.6 * sc);
    }
    ctx.restore();
  }

  function drawWhip(p) {
    if (G.whipT <= 0) return;
    const dur = whipDur();
    const age = 1 - G.whipT / dur;
    const reach = heroReach() * (age < 0.22 ? age / 0.22 : age > 0.85 ? (1 - age) / 0.15 : 1);
    const y = p.y - (p.duck ? 10 : 26);
    const x0 = p.x + p.face * 8;
    const x1 = p.x + p.face * (8 + reach);
    ctx.save();
    if (G.hero === 'sypha') {
      ctx.strokeStyle = rgba(ICE, 0.92);
      ctx.lineWidth = 4.2 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx(x0), sy(y));
      ctx.lineTo(sx(x1), sy(y - 4));
      ctx.stroke();
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.beginPath();
      ctx.arc(sx(x1), sy(y - 4), 4 * scale, 0, TAU);
      ctx.fill();
    } else {
      const rgb = G.whipLv >= 3 && G.hero === 'trevor' ? FLM : G.hero === 'grant' ? CYN : (G.whipLv === 2 ? CYN : ORG);
      ctx.strokeStyle = rgba(rgb, 0.95);
      ctx.lineWidth = (G.whipLv >= 2 || G.hero === 'grant' ? 2.4 : 1.8) * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx(x0), sy(y));
      const sag = Math.sin(age * Math.PI) * 6;
      ctx.quadraticCurveTo(sx((x0 + x1) * 0.5), sy(y + sag), sx(x1), sy(y));
      ctx.stroke();
      if (G.whipLv >= 3 && G.hero === 'trevor') {
        ctx.fillStyle = rgba(FLM, 0.95);
        ctx.beginPath();
        ctx.arc(sx(x1), sy(y), 4.4 * scale, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(GOLD, 0.85);
        ctx.beginPath();
        ctx.arc(sx(x1 - p.face), sy(y - 1), 2 * scale, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = rgba(WHT, 0.7);
        ctx.beginPath();
        ctx.arc(sx(x1), sy(y), 2.2 * scale, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawHero(p, opt) {
    if (opt.blink && ((G.t * 18) | 0) % 2 === 0) return;
    const s = scale;
    const sq = opt.squash || 1;
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.scale(p.face, sq);
    const duck = opt.duck;
    const bodyH = duck ? 11 : 15;
    const leg = Math.sin(opt.run || 0) * (duck ? 1 : 5) * s;
    const coat = G.hero === 'grant' ? CYN : G.hero === 'sypha' ? GOLD : CRIM;
    const tunic = G.hero === 'grant' ? [40, 90, 140] : G.hero === 'sypha' ? [180, 160, 255] : HOT;
    ctx.fillStyle = rgba(coat, 0.75);
    ctx.beginPath();
    ctx.moveTo(-2 * s, -bodyH * s);
    ctx.lineTo(-12 * s, (-bodyH + 4) * s);
    ctx.lineTo(-6 * s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(BLU, 0.95);
    ctx.lineWidth = 2.1 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3 * s, -6 * s);
    ctx.lineTo(-4 * s + (opt.grounded ? -leg : 2 * s), 0);
    ctx.moveTo(3 * s, -6 * s);
    ctx.lineTo(4 * s + (opt.grounded ? leg : -2 * s), 0);
    ctx.stroke();
    ctx.fillStyle = rgba(tunic, 0.95);
    ctx.fillRect(-6.2 * s, -bodyH * s - 5 * s, 12.4 * s, bodyH * s);
    ctx.fillStyle = rgba(GOLD, 0.55);
    ctx.fillRect(-6.2 * s, -bodyH * s - 5 * s, 12.4 * s, 2 * s);
    ctx.fillStyle = rgba(SKIN, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -(bodyH + 11) * s, 5.2 * s, 5.4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = G.hero === 'sypha' ? rgba(GOLD, 0.95) : '#5a3010';
    ctx.fillRect(-5 * s, -(bodyH + 14) * s, 10 * s, G.hero === 'sypha' ? 4 * s : 2.4 * s);
    if (G.hero === 'grant') {
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.fillRect(-5.4 * s, -(bodyH + 13.2) * s, 10.8 * s, 2 * s);
    }
    ctx.fillStyle = '#1a0a14';
    ctx.fillRect(1.2 * s, -(bodyH + 12.4) * s, 3.2 * s, 1.6 * s);
    const whipOn = G.whipT > 0;
    ctx.strokeStyle = rgba(WHT, 0.9);
    ctx.lineWidth = 1.8 * s;
    ctx.beginPath();
    ctx.moveTo(3 * s, -(bodyH + 1) * s);
    ctx.lineTo((whipOn ? 14 : 8) * s, -(bodyH + (whipOn ? 2 : 1)) * s);
    ctx.stroke();
    if (p.cling) {
      ctx.strokeStyle = rgba(CYN, 0.8);
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.moveTo(6 * s, -10 * s);
      ctx.lineTo(10 * s, -4 * s);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEnt(e) {
    if (e.dead) return;
    if (e.hitN > 0 && ((G.t * 30) | 0) % 2 === 0) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, 1);
    if (e.frozen > 0) ctx.globalAlpha = 0.7;
    if (e.kind === 'ghost') {
      ctx.globalAlpha = 0.7;
      const wob = Math.sin(e.t * 6) * 2;
      ctx.fillStyle = rgba(ICE, 0.85);
      ctx.beginPath();
      ctx.ellipse(0, (-10 + wob) * s, 7 * s, 10 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.arc(-2 * s, (-12 + wob) * s, 1.6 * s, 0, TAU);
      ctx.fill();
    } else if (e.kind === 'owl') {
      const flap = Math.sin(e.t * 12) * 5;
      ctx.fillStyle = rgba(ORG, 0.92);
      ctx.beginPath();
      ctx.ellipse(0, -6 * s, 5 * s, 4 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(FLM, 0.8);
      ctx.beginPath();
      ctx.moveTo(0, -6 * s);
      ctx.lineTo(-12 * s, (-8 - flap) * s);
      ctx.lineTo(-2 * s, -4 * s);
      ctx.moveTo(0, -6 * s);
      ctx.lineTo(12 * s, (-8 + flap) * s);
      ctx.lineTo(2 * s, -4 * s);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(1 * s, -7 * s, 3 * s, 2 * s);
    } else if (e.kind === 'bone') {
      ctx.fillStyle = rgba(WHT, 0.92);
      ctx.fillRect(-6 * s, -24 * s, 12 * s, 10 * s);
      ctx.fillRect(-5 * s, -14 * s, 10 * s, 10 * s);
      ctx.fillRect(-4 * s, -4 * s, 8 * s, 4 * s);
      ctx.fillStyle = '#14081c';
      ctx.fillRect(-3 * s, -21 * s, 2.4 * s, 2.4 * s);
      ctx.fillRect(1 * s, -21 * s, 2.4 * s, 2.4 * s);
    } else if (e.kind === 'flea') {
      const hop = e.grounded ? 0 : -4;
      ctx.fillStyle = rgba(ORG, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, (-8 + hop) * s, 7 * s, 6 * s, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(STN, 0.9);
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.moveTo(-4 * s, (-4 + hop) * s);
      ctx.lineTo(-8 * s, hop * s);
      ctx.moveTo(4 * s, (-4 + hop) * s);
      ctx.lineTo(8 * s, hop * s);
      ctx.stroke();
      ctx.fillStyle = rgba(MAG, 0.8);
      ctx.fillRect(-2 * s, (-9 + hop) * s, 2 * s, 2 * s);
    } else {
      const wob = Math.sin(e.t * 4) * 2 * s;
      ctx.fillStyle = rgba(STN, 0.7);
      ctx.fillRect(-6 * s + wob * 0.2, -16 * s, 12 * s, 16 * s);
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.beginPath();
      ctx.arc(wob * 0.15, -20 * s, 5 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.7);
      ctx.fillRect(-2 * s, -21 * s, 2 * s, 2 * s);
    }
    if (e.frozen > 0) {
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = rgba(ICE, 0.95);
      ctx.lineWidth = 1.6 * s;
      ctx.strokeRect(-8 * s, -e.h * s, 16 * s, e.h * s);
    }
    ctx.restore();
  }

  function drawBoss() {
    const b = G.boss;
    if (!b || b.dead) return;
    const a = b.active ? 1 : 0.4;
    const x = sx(b.x);
    const y = sy(b.y);
    const s = scale;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x, y);
    ctx.scale(b.face, 1);
    if (b.hitN > 0) ctx.globalAlpha = a * 0.55;
    if (b.kind === '时钟魔') {
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(0, -16 * s, 18 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#1a1020';
      ctx.beginPath();
      ctx.arc(0, -16 * s, 12 * s, 0, TAU);
      ctx.fill();
      const ang = G.clock * 2;
      ctx.strokeStyle = rgba(GOLD, 0.95);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(0, -16 * s);
      ctx.lineTo(Math.cos(ang) * 10 * s, -16 * s + Math.sin(ang) * 10 * s);
      ctx.stroke();
      ctx.fillStyle = rgba(MAG, 0.8);
      ctx.fillRect(-4 * s, -4 * s, 8 * s, 8 * s);
    } else if (b.kind === '船骸') {
      const flap = Math.sin(G.clock * 5) * 8;
      ctx.fillStyle = rgba(ICE, 0.85);
      ctx.beginPath();
      ctx.ellipse(0, -14 * s, 16 * s, 18 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.5);
      ctx.fillRect(-18 * s, (-20 + flap) * s, 8 * s, 20 * s);
      ctx.fillRect(10 * s, (-18 - flap) * s, 8 * s, 20 * s);
      ctx.fillStyle = '#14081c';
      ctx.fillRect(-6 * s, -20 * s, 4 * s, 4 * s);
    } else if (b.kind === '化兽') {
      ctx.fillStyle = rgba(CRIM, 0.95);
      ctx.fillRect(-14 * s, -28 * s, 28 * s, 24 * s);
      ctx.fillStyle = rgba(ORG, 0.9);
      ctx.beginPath();
      ctx.ellipse(0, -36 * s, 12 * s, 10 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.fillRect(6 * s, -40 * s, 8 * s, 4 * s);
      ctx.fillRect(-16 * s, -18 * s, 8 * s, 4 * s);
    } else if (b.kind === '最终') {
      const flap = Math.sin(G.clock * 9) * 12;
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.moveTo(0, -8 * s);
      ctx.lineTo(-32 * s, (-16 - flap) * s);
      ctx.lineTo(-8 * s, 6 * s);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -8 * s);
      ctx.lineTo(32 * s, (-16 + flap) * s);
      ctx.lineTo(8 * s, 6 * s);
      ctx.fill();
      ctx.fillStyle = rgba(CRIM, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, -6 * s, 12 * s, 9 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.moveTo(-6 * s, -16 * s);
      ctx.lineTo(0, -28 * s);
      ctx.lineTo(6 * s, -16 * s);
      ctx.fill();
    } else if (b.kind === '木乃伊') {
      ctx.fillStyle = rgba(STN, 0.95);
      ctx.fillRect(-10 * s, -34 * s, 20 * s, 30 * s);
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.fillRect(-10 * s, -28 * s, 20 * s, 3 * s);
      ctx.fillRect(-10 * s, -18 * s, 20 * s, 3 * s);
      ctx.fillStyle = rgba(STN, 0.95);
      ctx.beginPath();
      ctx.arc(0, -40 * s, 8 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.7);
      ctx.fillRect(-3 * s, -42 * s, 2 * s, 2 * s);
    } else {
      ctx.fillStyle = rgba(HOT, 0.92);
      ctx.beginPath();
      ctx.moveTo(-4 * s, -8 * s);
      ctx.lineTo(-22 * s, -18 * s);
      ctx.lineTo(-10 * s, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1a0818';
      ctx.fillRect(-10 * s, -36 * s, 20 * s, 28 * s);
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.fillRect(-10 * s, -36 * s, 20 * s, 4 * s);
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.arc(0, -44 * s, 8 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.moveTo(-7 * s, -50 * s);
      ctx.lineTo(0, -60 * s);
      ctx.lineTo(7 * s, -50 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#140814';
      ctx.fillRect(1 * s, -46 * s, 4 * s, 3 * s);
    }
    ctx.restore();
  }

  function drawBossBar() {
    const b = G.boss;
    if (!b || !b.active || b.dead) return;
    const x = ox + 80 * scale;
    const y = oy + 12 * scale;
    const w = (VW - 160) * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.fillRect(x, y, w * clamp(b.hp / b.max, 0, 1), 8 * scale);
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.font = 'bold ' + (11 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const tag = b.form === 2 ? ' Ⅱ' : b.form === 3 ? ' Ⅲ' : '';
    ctx.fillText(b.name + tag, ox + VW * 0.5 * scale, y - 3 * scale);
  }

  function drawPlayerHp() {
    if (!playing() && G.mode !== 'title') return;
    const x = ox + 12 * scale;
    const y = oy + (VH - 18) * scale;
    const w = 96 * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, 7 * scale);
    ctx.fillStyle = rgba(G.hp <= 4 ? MAG : GOLD, 0.9);
    ctx.fillRect(x, y, w * clamp(G.hp / HP_MAX, 0, 1), 7 * scale);
    ctx.strokeStyle = rgba(MAG, 0.55);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, 7 * scale);
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
    if (isCore() || specOf().theme === 'ship') {
      ctx.strokeStyle = specOf().theme === 'ship' ? 'rgba(160,220,255,0.22)' : 'rgba(180,160,255,0.22)';
      ctx.lineWidth = 1;
      for (i = 0; i < rain.length; i++) {
        o = rain[i];
        ctx.beginPath();
        ctx.moveTo(sx(o.x), sy(o.y));
        ctx.lineTo(sx(o.x + 3), sy(o.y + o.l));
        ctx.stroke();
      }
    }
    if (G.subFlash > 0) {
      ctx.fillStyle = rgba(CYN, G.subFlash * 0.45);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
    if (G.timeStop > 0) {
      ctx.fillStyle = rgba(ICE, 0.08 + Math.sin(G.clock * 8) * 0.04);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
  }

  function draw() {
    dpr = dpr || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#080310';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    const sh = REDUCE ? 0 : G.shake;
    if (sh > 0) {
      ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh * 0.7);
    }
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();

    drawSky();
    drawBackdrop();
    drawAbyss();
    drawPlats();
    drawLads();
    drawGates();

    let i;
    for (i = 0; i < G.candles.length; i++) drawCandle(G.candles[i]);
    for (i = 0; i < G.pickups.length; i++) drawPickup(G.pickups[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBoss();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);

    const p = G.player;
    if (p && G.deadT <= 0) {
      const blink = playing() && G.invuln > 0;
      drawHero(p, {
        run: p.run, grounded: p.grounded && !p.onLad,
        squash: p.squash, duck: p.duck, blink: blink
      });
      drawWhip(p);
    }

    drawFx();
    drawBossBar();
    drawPlayerHp();

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

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const whipk = space || k === 'z' || k === 'Z';
    const subk = k === 'x' || k === 'X';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (whipk) keys.fire = down;
    if (subk) keys.sub = down;

    if (down && (isMove || whipk || subk || k === 'Enter' || k === 'c' || k === 'C')) e.preventDefault();
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
    if (k === 'c' || k === 'C') {
      audio.ensure();
      trySwap();
      return;
    }
    if (k === '1' && G.mode === 'title') {
      startGame('run');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('core');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        if (!space) keys.fire = false;
        return;
      }
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
    hold(document.getElementById('btn-down'), function () { keys.d = true; }, function () { keys.d = false; });
    hold(document.getElementById('btn-whip'), function () { keys.fire = true; }, function () { keys.fire = false; });
    hold(document.getElementById('btn-sub'), function () { keys.sub = true; }, function () { keys.sub = false; });
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen()) return;
      keys.fire = true;
    });
    canvas.addEventListener('pointerup', function () { keys.fire = false; });
    canvas.addEventListener('pointercancel', function () { keys.fire = false; });
    canvas.addEventListener('pointerleave', function () { keys.fire = false; });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    canvas.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
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

  if (btnRun) {
    btnRun.addEventListener('click', function () {
      audio.ensure();
      startGame('run');
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
  if (modeRun) {
    modeRun.addEventListener('click', function () {
      audio.ensure();
      startGame('run');
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
  if (btnSwap) {
    btnSwap.addEventListener('click', function () {
      audio.ensure();
      trySwap();
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
      keys.sub = false;
    }
  });

  requestAnimationFrame(frame);
})();
