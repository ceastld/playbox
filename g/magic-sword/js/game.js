'use strict';

/* 魔剑 — Magic Sword arcade lite. Side-scroll tower climb, long sword, rescue companion. No CDN. Distinct from 圆桌 / 柳巫. */

(function () {
  const VW = 640;
  const VH = 360;
  const GY = 320;
  const MY = 248;
  const HY = 176;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const HP_MAX = 12;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const AIR = 0.52;
  const JUMP_V = 410;
  const GRAV = 1100;
  const MAX_FALL = 560;
  const COYOTE = 0.08;
  const BUFFER = 0.11;
  const INVULN = 1.22;
  const DIE_T = 0.8;
  const WALK = 152;
  const CLIMB = 96;
  const PW = 14;
  const PH = 26;
  const BEST_KEY = 'playbox-magic-sword-best';
  const MUTE_KEY = 'playbox-magic-sword-mute';
  const AUTO_SPEED_KEY = 'playbox-magic-sword-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 0.52, 0.78, 1, 3.4];
  const OPS = '方向 / D 走 · 上跳/爬梯 · 空格挥剑 · A 自动 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 74, 20];
  const HOT2 = [255, 138, 58];
  const WHT = [246, 238, 230];
  const LEAF = [61, 255, 122];
  const SKIN = [232, 192, 144];
  const CRIM = [176, 36, 28];
  const DARK = [42, 22, 18];
  const STN = [92, 70, 58];
  const BONE = [220, 208, 186];
  const BLK = [22, 16, 18];
  const PUR = [140, 72, 180];

  const WEPS = {
    iron: { id: 'iron', name: '铁剑', reach: 48, dmg: 1, t: 0.20, h0: 0.04, h1: 0.14, knock: 72, stop: 0.042 },
    flame: { id: 'flame', name: '焰剑', reach: 64, dmg: 2, t: 0.22, h0: 0.045, h1: 0.15, knock: 96, stop: 0.056 },
    magic: { id: 'magic', name: '魔剑', reach: 80, dmg: 3, t: 0.24, h0: 0.05, h1: 0.16, knock: 120, stop: 0.072 }
  };
  const WEP_ORDER = ['iron', 'flame', 'magic'];

  const KINDS = {
    imp: { hp: 2, spd: 78, dmg: 1, score: 120, w: 14, h: 18, hop: true },
    skel: { hp: 3, spd: 88, dmg: 1, score: 180, w: 14, h: 26, melee: true },
    knight: { hp: 5, spd: 64, dmg: 2, score: 280, w: 18, h: 30, melee: true },
    bat: { hp: 1, spd: 128, dmg: 1, score: 140, w: 16, h: 12, fly: true },
    eye: { hp: 3, spd: 46, dmg: 2, score: 200, w: 16, h: 16, fly: true, shoot: true }
  };

  const COMPS = {
    hunt: { id: 'hunt', name: '女猎', hp: 6, cd: 0.70, dmg: 1, spd: 390, rgb: LEAF, shot: 'arrow' },
    mage: { id: 'mage', name: '法师', hp: 5, cd: 0.84, dmg: 2, spd: 310, rgb: CYN, shot: 'bolt' }
  };

  const BOSSES = {
    石魔: { hp: 16, score: 3600, w: 36, h: 46, dmg: 2 },
    双首: { hp: 22, score: 4200, w: 40, h: 48, dmg: 2 },
    骨王: { hp: 26, score: 4800, w: 32, h: 52, dmg: 2 },
    魔龙: { hp: 32, score: 6400, w: 48, h: 42, dmg: 3 }
  };

  const SCORE = {
    hit: 40, cage: 200, potion: 80, blade: 100, gold: 60,
    floor: 2000, wave: 500, win: 8000
  };

  const FLOORS = [
    {
      name: '底层', boss: '石魔', w: 2040, hp: 16, theme: 'base',
      ground: [[0, 540], [620, 380], [1120, 920]],
      plats: [
        [280, MY, 170], [720, MY, 180], [1180, MY, 160], [1580, MY, 170],
        [420, HY, 120], [980, HY, 130]
      ],
      ladders: [
        [300, GY, MY], [740, GY, MY], [1200, GY, MY], [1600, GY, MY],
        [440, MY, HY], [1000, MY, HY]
      ],
      drops: [[220, GY, 'potion'], [860, MY, 'blade'], [1400, GY, 'gold'], [1680, MY, 'potion']],
      cage: [960, GY, 'hunt'],
      ents: [
        [260, GY, 'imp', 40, 500],
        [420, GY, 'skel', 80, 540],
        [500, MY, 'bat', 280, 450],
        [760, GY, 'imp', 640, 980],
        [900, GY, 'skel', 640, 1000],
        [1100, MY, 'bat', 720, 900],
        [1280, GY, 'imp', 1140, 1600],
        [1460, GY, 'skel', 1140, 1700],
        [1540, MY, 'imp', 1580, 1740]
      ]
    },
    {
      name: '回廊', boss: '双首', w: 2200, hp: 22, theme: 'hall',
      ground: [[0, 480], [560, 300], [980, 360], [1460, 740]],
      plats: [
        [180, MY, 160], [520, MY, 170], [900, MY, 180], [1320, MY, 170], [1760, MY, 160],
        [300, HY, 130], [780, HY, 140], [1480, HY, 140]
      ],
      ladders: [
        [200, GY, MY], [540, GY, MY], [920, GY, MY], [1340, GY, MY], [1780, GY, MY],
        [320, MY, HY], [800, MY, HY], [1500, MY, HY]
      ],
      drops: [[240, MY, 'potion'], [700, GY, 'gold'], [1100, MY, 'blade'], [1640, GY, 'potion']],
      cage: [1080, GY, 'mage'],
      ents: [
        [240, GY, 'skel', 20, 450],
        [400, GY, 'knight', 40, 480],
        [360, MY, 'bat', 180, 340],
        [680, GY, 'skel', 580, 860],
        [820, GY, 'knight', 580, 880],
        [980, MY, 'bat', 900, 1080],
        [1180, GY, 'skel', 1000, 1400],
        [1360, GY, 'knight', 1480, 1760],
        [1400, MY, 'eye', 1320, 1490],
        [1680, GY, 'skel', 1480, 1980],
        [1840, MY, 'bat', 1760, 1920]
      ]
    },
    {
      name: '祭坛', boss: '骨王', w: 2320, hp: 26, theme: 'altar',
      ground: [[0, 440], [520, 300], [940, 340], [1400, 320], [1860, 460]],
      plats: [
        [140, MY, 150], [460, MY, 160], [820, MY, 170], [1200, MY, 170],
        [1580, MY, 180], [1980, MY, 160],
        [240, HY, 130], [700, HY, 140], [1260, HY, 140], [1720, HY, 140]
      ],
      ladders: [
        [160, GY, MY], [480, GY, MY], [840, GY, MY], [1220, GY, MY], [1600, GY, MY], [2000, GY, MY],
        [260, MY, HY], [720, MY, HY], [1280, MY, HY], [1740, MY, HY]
      ],
      drops: [[200, MY, 'potion'], [760, GY, 'blade'], [1340, HY, 'gold'], [1800, MY, 'potion']],
      cage: [1520, GY, 'hunt'],
      ents: [
        [220, GY, 'knight', 20, 400],
        [380, GY, 'skel', 20, 420],
        [300, MY, 'eye', 140, 290],
        [620, GY, 'imp', 540, 820],
        [760, GY, 'knight', 540, 840],
        [900, MY, 'bat', 820, 990],
        [1100, GY, 'skel', 960, 1280],
        [1280, GY, 'knight', 1400, 1680],
        [1320, HY, 'eye', 1260, 1400],
        [1540, MY, 'bat', 1580, 1760],
        [1720, GY, 'knight', 1880, 2200],
        [1960, GY, 'skel', 1880, 2260],
        [2040, MY, 'eye', 1980, 2140]
      ]
    },
    {
      name: '塔巅', boss: '魔龙', w: 2440, hp: 32, theme: 'peak',
      ground: [[0, 420], [500, 280], [900, 320], [1360, 300], [1800, 340], [2260, 180]],
      plats: [
        [120, MY, 150], [420, MY, 160], [760, MY, 170], [1120, MY, 170],
        [1480, MY, 180], [1860, MY, 170], [2200, MY, 150],
        [220, HY, 130], [640, HY, 140], [1180, HY, 150], [1640, HY, 140], [2040, HY, 140]
      ],
      ladders: [
        [140, GY, MY], [440, GY, MY], [780, GY, MY], [1140, GY, MY], [1500, GY, MY], [1880, GY, MY],
        [240, MY, HY], [660, MY, HY], [1200, MY, HY], [1660, MY, HY], [2060, MY, HY]
      ],
      drops: [[180, MY, 'potion'], [680, GY, 'blade'], [1280, HY, 'potion'], [1760, MY, 'gold'], [2100, GY, 'potion']],
      cage: [1700, GY, 'mage'],
      ents: [
        [240, GY, 'knight', 20, 380],
        [380, GY, 'skel', 20, 400],
        [280, MY, 'eye', 120, 270],
        [580, GY, 'imp', 520, 760],
        [720, GY, 'knight', 520, 780],
        [880, MY, 'bat', 760, 930],
        [1040, GY, 'skel', 920, 1220],
        [1200, GY, 'knight', 920, 1240],
        [1240, HY, 'eye', 1180, 1330],
        [1440, GY, 'skel', 1380, 1660],
        [1600, GY, 'knight', 1380, 1680],
        [1700, MY, 'bat', 1480, 1660],
        [1900, GY, 'knight', 1820, 2140],
        [2040, GY, 'skel', 1820, 2140],
        [2120, HY, 'eye', 2040, 2180],
        [2280, MY, 'knight', 2200, 2350]
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
  function comboMul(n) {
    return 1 + Math.min(4, Math.max(0, Math.floor(((n | 0) - 1) / 2)));
  }
  function jumpHeight() {
    return (JUMP_V * JUMP_V) / (2 * GRAV);
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
  function wepRank(id) {
    const i = WEP_ORDER.indexOf(id);
    return i < 0 ? 0 : i;
  }
  function nextWep(id) {
    const i = wepRank(id);
    return WEP_ORDER[Math.min(WEP_ORDER.length - 1, i + 1)];
  }
  function kindHp(kind, wave) {
    const base = KINDS[kind] ? KINDS[kind].hp : 3;
    if (!wave) return base;
    return Math.max(2, Math.round(base * (1 + Math.max(0, wave - 1) * 0.08)));
  }
  function waveCount(n) {
    return Math.min(16, 5 + ((n * 0.85) | 0));
  }
  function spdMul(tide, stage) {
    return (tide ? 1.22 : 1) * (1 + Math.max(0, stage - 1) * 0.06);
  }

  function selfCheck() {
    if (FLOORS.length !== 4) throw new Error('4 floors');
    if (LIVES !== 3) throw new Error('3 lives');
    if (HP_MAX < 10) throw new Error('hp');
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(3) !== 2) throw new Error('combo 3');
    if (comboMul(9) !== 5) throw new Error('combo 9');
    if (BEST_KEY !== 'playbox-magic-sword-best') throw new Error('best key');
    if (AUTO_SPEED_KEY !== 'playbox-magic-sword-auto-speed') throw new Error('auto key');
    if (AUTO_SCALE[3] !== 1 || AUTO_SCALE[4] <= AUTO_SCALE[3]) throw new Error('auto scale');
    if (AUTO_SCALE[1] >= AUTO_SCALE[2] || AUTO_SCALE[2] >= AUTO_SCALE[3]) throw new Error('auto scale order');
    if (SPEED_LABELS[3] !== '快' || SPEED_LABELS[4] !== '极快') throw new Error('speed labels');
    if (WEPS.iron.reach >= WEPS.flame.reach) throw new Error('iron reach');
    if (WEPS.flame.reach >= WEPS.magic.reach) throw new Error('flame reach');
    if (WEPS.magic.reach < 72) throw new Error('long sword');
    if (WEPS.magic.dmg < 3) throw new Error('magic dmg');
    const h = jumpHeight();
    if (h < 70 || h > 90) throw new Error('jump height ' + h);
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    if (FLOORS[0].boss !== '石魔' || FLOORS[3].boss !== '魔龙') throw new Error('bosses');
    if (FLOORS[0].w >= FLOORS[1].w || FLOORS[2].w >= FLOORS[3].w) throw new Error('wider later');
    if (!COMPS.hunt || !COMPS.mage) throw new Error('companions');
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('tide faster');
    if (waveCount(1) < 5 || waveCount(30) > 16) throw new Error('wave cap');
    if (KINDS.knight.hp <= KINDS.imp.hp) throw new Error('knight hp');
    if (!KINDS.bat.fly || KINDS.skel.fly) throw new Error('fly flags');
    let i, s;
    for (i = 0; i < FLOORS.length; i++) {
      s = FLOORS[i];
      if (!s.ground.length || !s.ents.length || !s.ladders.length || !s.cage) {
        throw new Error('floor ' + s.name);
      }
      if (s.ladders[0].length !== 3) throw new Error('vertical ladders');
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
  const btnClimb = document.getElementById('btn-climb');
  const btnTide = document.getElementById('btn-tide');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeClimb = document.getElementById('mode-climb');
  const modeTide = document.getElementById('mode-tide');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const comboBox = document.getElementById('combo-box');
  const comboEl = document.getElementById('combo');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const wepLabel = document.getElementById('wep-label');
  const compLabel = document.getElementById('comp-label');
  const hpBar = document.getElementById('hp-bar');
  const bossWrap = document.getElementById('boss-wrap');
  const bossBar = document.getElementById('boss-bar');
  const bossName = document.getElementById('boss-name');
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
  let uid = 1;

  const keys = { l: false, r: false, u: false, d: false, fire: false };
  const demo = { l: false, r: true, u: false, d: false, fire: false };
  const autoIn = { l: false, r: false, u: false, d: false, fire: false };
  let autoOn = false;
  let autoSpeed = 3;
  let autoOvWait = 0;
  let autoStuck = 0;
  let autoLastX = 0;
  let autoLastY = 0;
  let autoWalkDir = 1;
  let autoBackT = 0;
  let autoFireFlip = false;
  let autoGoalX = 80;
  let autoGoalY = GY;
  let autoLadDir = 0;
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const embers = [];

  const G = {
    mode: 'title',
    kind: 'climb',
    t: 0,
    clock: 0,
    stage: 1,
    wave: 1,
    camX: 0,
    camY: 0,
    levelW: 2040,
    theme: 'base',
    plats: [],
    ladders: [],
    ents: [],
    shots: [],
    pickups: [],
    cages: [],
    player: null,
    comp: null,
    boss: null,
    lives: LIVES,
    hp: HP_MAX,
    wep: 'iron',
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    chainN: 0,
    chainT: 0,
    atkT: 0,
    atkHit: {},
    fireEdge: false,
    jumpBuf: 0,
    deadT: 0,
    invuln: 0,
    knockT: 0,
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
    checkX: 70,
    checkY: GY,
    waveT: 0,
    trans: 0
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
  function autoPlaying() {
    return autoOn && G.mode === 'play';
  }
  function inL() {
    if (autoPlaying()) return autoIn.l;
    return G.mode === 'title' ? demo.l : keys.l;
  }
  function inR() {
    if (autoPlaying()) return autoIn.r;
    return G.mode === 'title' ? demo.r : keys.r;
  }
  function inU() {
    if (autoPlaying()) return autoIn.u;
    return G.mode === 'title' ? demo.u : keys.u;
  }
  function inD() {
    if (autoPlaying()) return autoIn.d;
    return G.mode === 'title' ? demo.d : keys.d;
  }
  function fireHeld() {
    if (autoPlaying()) return autoIn.fire;
    return G.mode === 'title' ? demo.fire : keys.fire;
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
      this.beep(240, 0.07, 'square', 0.04, 520);
    },
    land() {
      this.ensure();
      this.noise(0.04, 0.026, 420);
      this.beep(130, 0.05, 'triangle', 0.022, 70);
    },
    slash(wep) {
      this.ensure();
      this.noise(0.05, 0.048, 1200);
      if (wep === 'magic') {
        this.beep(280, 0.1, 'sawtooth', 0.05, 90);
        this.beep(880, 0.08, 'triangle', 0.04, 1320);
        this.beep(440, 0.12, 'sine', 0.03, 220);
      } else if (wep === 'flame') {
        this.noise(0.07, 0.04, 600);
        this.beep(520, 0.08, 'sawtooth', 0.045, 180);
        this.beep(980, 0.05, 'square', 0.03, 420);
      } else {
        this.beep(720, 0.06, 'square', 0.044, 220);
        this.beep(480, 0.05, 'triangle', 0.028, 160);
      }
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.04, 0.036, 1100);
      this.beep(520 * lift, 0.07, 'square', 0.044, 880 * lift);
    },
    crack() {
      this.ensure();
      this.noise(0.04, 0.04, 1600);
      this.beep(840, 0.05, 'square', 0.036, 240);
    },
    hurt() {
      this.ensure();
      this.noise(0.1, 0.055, 380);
      this.beep(320, 0.12, 'sawtooth', 0.05, 90);
    },
    cage() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1176);
      this.noise(0.06, 0.03, 800);
    },
    ping() {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.05, 990);
      this.beep(990, 0.1, 'triangle', 0.042, 1320);
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
    boss() {
      this.ensure();
      this.beep(180, 0.18, 'sawtooth', 0.05, 90);
      this.beep(110, 0.3, 'square', 0.04, 64);
    },
    boom() {
      this.ensure();
      this.noise(0.14, 0.07, 240);
      this.beep(180, 0.16, 'sawtooth', 0.05, 55);
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
    climb() {
      this.ensure();
      this.beep(330, 0.06, 'square', 0.03, 440);
    },
    arrow() {
      this.ensure();
      this.beep(1180, 0.05, 'square', 0.036, 480);
      this.noise(0.025, 0.02, 2000);
    },
    bolt() {
      this.ensure();
      this.beep(620, 0.08, 'sine', 0.04, 180);
      this.beep(980, 0.06, 'triangle', 0.03, 1400);
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

  function loadAutoSpeed() {
    try {
      const n = parseInt(localStorage.getItem(AUTO_SPEED_KEY) || '3', 10);
      if (!isFinite(n) || n < 1 || n > 4) return 3;
      return n;
    } catch (err) {
      return 3;
    }
  }
  function saveAutoSpeed(n) {
    try { localStorage.setItem(AUTO_SPEED_KEY, String(n)); } catch (err) { /* ignore */ }
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
    const t = isTide();
    if (modeClimb) modeClimb.setAttribute('aria-pressed', t ? 'false' : 'true');
    if (modeTide) modeTide.setAttribute('aria-pressed', t ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (hpBar) hpBar.style.transform = 'scaleX(' + clamp(G.hp / HP_MAX, 0, 1) + ')';
    const spec = FLOORS[clamp(G.stage, 1, FLOORS.length) - 1];
    if (stageLabel) {
      if (isTide()) stageLabel.textContent = '潮 ' + G.wave;
      else stageLabel.textContent = spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 4 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isTide() ? '魔潮' : '闯塔';
      tagLabel.classList.toggle('warn', isTide());
      tagLabel.classList.toggle('hot', !isTide() && G.stage >= 3);
    }
    if (wepLabel) {
      const w = WEPS[G.wep] || WEPS.iron;
      wepLabel.textContent = w.name;
      wepLabel.className = 'wep' + (G.wep === 'flame' ? ' flame' : G.wep === 'magic' ? ' magic' : ' iron');
    }
    if (compLabel) {
      if (G.comp && G.comp.hp > 0) {
        const c = COMPS[G.comp.kind];
        compLabel.textContent = '同伴 ' + (c ? c.name : '');
        compLabel.className = 'comp' + (G.comp.kind === 'mage' ? ' mage' : '');
      } else {
        compLabel.textContent = '同伴 —';
        compLabel.className = 'comp off';
      }
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (bossWrap) {
      const show = !!(G.boss && G.boss.active && !G.boss.dead && playing());
      bossWrap.hidden = !show;
      if (show) {
        if (bossName) bossName.textContent = G.boss.name;
        if (bossBar) bossBar.style.transform = 'scaleX(' + clamp(G.boss.hp / G.boss.max, 0, 1) + ')';
      }
    }
    if (autoOn) {
      if (G.mode === 'title') setHint('自动托管 · 即将开局 · A 停下', 'hot');
      else if (G.mode === 'lose') setHint('自动仍开着 · 即将再开 · A 停下', 'warn');
      else if (G.mode === 'win') setHint('自动仍开着 · 即将再开 · A 停下', 'hot');
      else if (G.boss && G.boss.active && !G.boss.dead) setHint('托管中 · 头目 ' + G.boss.name + ' · A 停下', 'hot');
      else setHint(isTide() ? '托管中 · 魔潮挥剑 · A 停下' : '托管中 · 闯塔挥剑爬梯 · A 停下', 'hot');
    } else if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 体力打空扣命，魔潮更密更快', 'warn');
    else if (G.mode === 'win') setHint('魔塔已破 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 空格长斩 · 上键跳/爬梯', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · ' + G.boss.name, 'hot');
    else setHint('往右走、往上爬 · 空格长斩 · 劈笼救同伴 · A 自动', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'SWORD';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '魔潮' : '换模式';
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus({ preventScroll: true });
  }

  function hitStop(sec) {
    if (REDUCE || G.mode === 'title') return;
    if (autoOn && autoSpeed >= 4) return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag, cls) {
    if (REDUCE || G.mode === 'title') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.007));
    if (!stageEl) return;
    const c = cls || (mag >= 6 ? 'die' : mag >= 3.4 ? 'boom' : 'hit');
    kickTok += 1;
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash');
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
    G.mult = comboMul(G.combo);
    if (G.combo >= 2) showChain(G.combo);
    if (G.mult > prev) audio.combo(G.mult);
    syncHud();
  }

  function slashSpec() {
    const w = WEPS[G.wep] || WEPS.iron;
    const chain = Math.min(3, Math.max(1, G.chainN));
    const extra = chain >= 3 ? 14 : 0;
    return {
      reach: w.reach + extra,
      dmg: w.dmg + (chain >= 3 ? 1 : 0),
      t: w.t + (chain >= 3 ? 0.03 : 0),
      h0: w.h0,
      h1: w.h1,
      knock: w.knock + (chain >= 3 ? 40 : 0),
      stop: w.stop + (chain >= 3 ? 0.016 : 0),
      chain: chain
    };
  }

  function makePlayer(x, y) {
    return {
      x: x, y: y, vx: 0, vy: 0, face: 1,
      w: PW, h: PH,
      grounded: true, coyote: 0,
      squash: 1, run: 0, pose: 0,
      onLad: false, lad: null
    };
  }

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }

  function makeLad(x, bot, top) {
    return { x: x, bot: bot, top: top };
  }

  function makeEnt(x, y, kind, a, b, wave) {
    const k = KINDS[kind] || KINDS.imp;
    const hp = kindHp(kind, wave || 0);
    const fly = !!k.fly;
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b, base: y,
      t: rand(0, 2), fire: rand(0.5, 1.6),
      grounded: !fly, dead: false, hitN: 0,
      w: k.w, h: k.h, hopT: rand(0.2, 0.8)
    };
  }

  function makeBoss(name, x, wave) {
    const spec = BOSSES[name] || BOSSES.石魔;
    const mul = isTide() ? 1 + Math.max(0, (wave || 1) - 1) * 0.05 : 1;
    const hp = Math.round(spec.hp * mul * (isTide() ? 1.12 : 1));
    return {
      id: uid++,
      x: x, y: GY, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: name, name: name,
      t: 0, fire: 1.2, state: 'wait',
      grounded: true, dead: false, active: false,
      hitN: 0, w: spec.w, h: spec.h, dmg: spec.dmg, flyY: GY
    };
  }

  function makeCage(x, y, kind) {
    return { x: x, y: y, kind: kind || 'hunt', broken: false, t: rand(0, 2) };
  }

  function makeComp(kind, x, y) {
    const c = COMPS[kind] || COMPS.hunt;
    return {
      kind: kind, x: x, y: y, vx: 0, vy: 0, face: 1,
      hp: c.hp, max: c.hp, cd: 0.3,
      grounded: true, w: 12, h: 22, hitN: 0, t: 0, invuln: 0.4
    };
  }

  function seedEmbers() {
    embers.length = 0;
    const n = REDUCE ? 8 : 22;
    for (let i = 0; i < n; i++) {
      embers.push({
        x: rand(0, VW), y: rand(0, VH),
        vy: rand(-28, -10), r: rand(0.8, 2.2),
        a: rand(0.15, 0.45), ph: rand(0, TAU)
      });
    }
  }

  function loadFloor(n, attract) {
    const spec = FLOORS[clamp(n, 1, FLOORS.length) - 1];
    G.stage = n;
    G.levelW = spec.w;
    G.theme = spec.theme;
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
    G.ladders = [];
    for (i = 0; i < spec.ladders.length; i++) {
      const L = spec.ladders[i];
      G.ladders.push(makeLad(L[0], L[1], L[2]));
    }
    G.ents = [];
    const wave = isTide() ? G.wave : 0;
    for (i = 0; i < spec.ents.length; i++) {
      const e = spec.ents[i];
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4], wave));
    }
    if (isTide() && !attract) {
      for (i = 0; i < spec.ents.length; i++) {
        if (i % 2 !== 0) continue;
        const e = spec.ents[i];
        const extra = e[2] === 'knight' ? 'skel' : e[2] === 'skel' ? 'imp' : 'bat';
        G.ents.push(makeEnt(e[0] + 28, e[1], extra, e[3], e[4], wave));
      }
    }
    G.pickups = [];
    G.cages = [];
    if (!attract) {
      for (i = 0; i < spec.drops.length; i++) {
        const d = spec.drops[i];
        spawnPickup(d[0], d[1] - 12, d[2], true);
      }
      if (spec.cage) G.cages.push(makeCage(spec.cage[0], spec.cage[1], spec.cage[2]));
    }
    G.shots = [];
    G.boss = makeBoss(spec.boss, spec.w - 150, G.wave);
    G.checkX = 70;
    G.checkY = GY;
    G.camX = 0;
    G.camY = 0;
    G.atkT = 0;
    G.atkHit = {};
    G.knockT = 0;
    G.clearT = 0;
    G.lock = 0;
    G.trans = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    seedEmbers();
    G.player = makePlayer(70, GY);
    if (G.comp && G.comp.hp > 0) {
      G.comp.x = 48;
      G.comp.y = GY;
      G.comp.vx = 0;
      G.comp.vy = 0;
    }
  }

  function loadTideArena() {
    G.stage = 1;
    G.levelW = 2000;
    G.theme = 'base';
    G.plats = [
      makePlat(0, GY, 2000, true),
      makePlat(180, MY, 180, false),
      makePlat(520, MY, 200, false),
      makePlat(920, MY, 180, false),
      makePlat(1320, MY, 200, false),
      makePlat(1700, MY, 160, false),
      makePlat(360, HY, 140, false),
      makePlat(860, HY, 150, false),
      makePlat(1480, HY, 140, false)
    ];
    G.ladders = [
      makeLad(200, GY, MY), makeLad(540, GY, MY), makeLad(940, GY, MY),
      makeLad(1340, GY, MY), makeLad(1720, GY, MY),
      makeLad(380, MY, HY), makeLad(880, MY, HY), makeLad(1500, MY, HY)
    ];
    G.ents = [];
    G.pickups = [];
    G.cages = [];
    G.shots = [];
    G.boss = null;
    G.checkX = 70;
    G.checkY = GY;
    G.camX = 0;
    G.camY = 0;
    G.atkT = 0;
    G.atkHit = {};
    G.knockT = 0;
    G.clearT = 0;
    G.lock = 0;
    G.waveT = 0.4;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    seedEmbers();
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

  function findLadder(x, y, dir) {
    let i, L;
    for (i = 0; i < G.ladders.length; i++) {
      L = G.ladders[i];
      if (Math.abs(x - L.x) > 10) continue;
      if (dir > 0) {
        if (y > L.top + 4 && y <= L.bot + 12) return L;
      } else {
        if (y < L.bot - 4 && y >= L.top - 12) return L;
      }
    }
    return null;
  }

  function pBox() {
    const p = G.player;
    return { x: p.x - p.w * 0.45, y: p.y - p.h, w: p.w * 0.9, h: p.h };
  }

  function slashBox() {
    const p = G.player;
    if (G.atkT <= 0) return null;
    const spec = slashSpec();
    const age = 1 - G.atkT / spec.t;
    if (age < spec.h0 || age > spec.h1 + 0.04) return null;
    const grow = age < spec.h0 + 0.04 ? (age - spec.h0) / 0.04 : 1;
    const reach = spec.reach * clamp(grow, 0.2, 1);
    const y = p.y - 22;
    const h = 28;
    if (p.face > 0) return { x: p.x + 6, y: y, w: reach, h: h };
    return { x: p.x - 6 - reach, y: y, w: reach, h: h };
  }

  function spawnPickup(x, y, kind, grounded) {
    G.pickups.push({
      x: x, y: y, kind: kind, taken: false, t: 0,
      vy: grounded ? 0 : -90, life: grounded ? 99 : 9
    });
  }

  function spawnShot(s) {
    s.id = uid++;
    if (!s.hit) s.hit = [];
    G.shots.push(s);
  }

  function takePickup(u) {
    if (u.taken) return;
    u.taken = true;
    audio.ping();
    kick(2.2, 'pickup');
    screenFlash(GOLD, 0.22);
    popSpark(u.x, u.y, GOLD, 16);
    if (u.kind === 'potion') {
      G.hp = Math.min(HP_MAX, G.hp + 5);
      toast('药 +5', false, true);
      addScore(SCORE.potion * G.mult);
      floatText(u.x, u.y - 8, '+5', MAG, false);
    } else if (u.kind === 'blade') {
      const nxt = nextWep(G.wep);
      if (nxt !== G.wep) {
        G.wep = nxt;
        toast(WEPS[G.wep].name, false, true);
      } else {
        G.hp = Math.min(HP_MAX, G.hp + 3);
        toast('剑已满 · 体 +3', false, true);
      }
      addScore(SCORE.blade * G.mult);
    } else if (u.kind === 'gold') {
      addScore(SCORE.gold * G.mult);
      floatText(u.x, u.y - 8, String(SCORE.gold * G.mult), GOLD, false);
    }
    emit(10, {
      x: u.x, y: u.y, j: 8,
      vx0: -140, vx1: 140, vy0: -220, vy1: -20,
      life: 0.32, r0: 1.2, r1: 3, rgb: GOLD
    });
    syncHud();
  }

  function rescue(cage) {
    if (cage.broken) return;
    cage.broken = true;
    audio.cage();
    hitStop(0.055);
    juice(cage.x, cage.y - 16, GOLD, 1.1);
    bumpCombo();
    addScore(SCORE.cage * G.mult);
    floatText(cage.x, cage.y - 18, '救出', GOLD, true);
    G.comp = makeComp(cage.kind, cage.x, cage.y);
    const c = COMPS[cage.kind];
    toast('救出' + (c ? c.name : '同伴'), false, true);
    syncHud();
  }

  function trySlash() {
    if (G.atkT > 0 || G.knockT > 0 || G.deadT > 0) return;
    if (G.lock > 0) return;
    if (G.chainT > 0) G.chainN += 1;
    else G.chainN = 1;
    if (G.chainN > 3) G.chainN = 1;
    const spec = slashSpec();
    G.atkT = spec.t;
    G.atkHit = {};
    G.chainT = 0.42;
    G.player.pose = 0.2;
    audio.slash(G.wep);
    const p = G.player;
    const rgb = G.wep === 'magic' ? GOLD : G.wep === 'flame' ? HOT2 : WHT;
    emit(6, {
      x: p.x + p.face * 18, y: p.y - 16, j: 7,
      vx0: p.face * 60, vx1: p.face * 220, vy0: -50, vy1: 40,
      life: 0.18, r0: 1, r1: 2.6, rgb: rgb, g: 60
    });
    if (spec.chain >= 3) {
      screenFlash(rgb, 0.18);
      kick(2.4, 'thump');
    }
  }

  function hitEnemy(e, dmg, knock) {
    if (e.dead) return;
    e.hp -= dmg;
    e.hitN = 0.09;
    e.face = G.player && e.x < G.player.x ? 1 : -1;
    e.vx = (G.player && e.x >= G.player.x ? 1 : -1) * (knock || 80);
    const cx = e.x;
    const cy = e.y - e.h * 0.5;
    const rgb = G.wep === 'magic' ? GOLD : HOT2;
    if (e.hp <= 0) {
      e.dead = true;
      bumpCombo();
      const sc = ((KINDS[e.kind] && KINDS[e.kind].score) || 100) * G.mult;
      addScore(sc);
      floatText(cx, cy, String(sc), GOLD, e.kind === 'knight');
      audio.hit(G.combo);
      juice(cx, cy, rgb, e.kind === 'knight' ? 1.15 : 0.8);
      hitStop(e.kind === 'knight' ? 0.062 : 0.044);
      if (Math.random() < 0.12) spawnPickup(e.x, e.y - 10, Math.random() < 0.5 ? 'gold' : 'potion', false);
    } else {
      audio.crack();
      addScore(SCORE.hit * G.mult);
      emit(7, {
        x: cx, y: cy, j: 5,
        vx0: -140, vx1: 140, vy0: -200, vy1: -20,
        life: 0.22, r0: 1, r1: 2.6, rgb: rgb
      });
      popSpark(cx, cy, rgb, 12);
      hitStop(0.036);
    }
  }

  function hitBoss(dmg) {
    const b = G.boss;
    if (!b || b.dead || !b.active) return;
    b.hp -= dmg;
    b.hitN = 0.1;
    const cx = b.x;
    const cy = b.y - b.h * 0.5;
    const spec = slashSpec();
    if (b.hp <= 0) {
      b.hp = 0;
      b.dead = true;
      b.active = false;
      bumpCombo();
      const sc = ((BOSSES[b.name] && BOSSES[b.name].score) || 3600) * G.mult;
      addScore(sc);
      floatText(cx, cy, String(sc), GOLD, true);
      audio.boom();
      juice(cx, cy, GOLD, 1.8);
      hitStop(0.078);
      screenFlash(GOLD, 0.5);
      kick(7, 'boom');
      spawnPickup(b.x, b.y - 16, 'potion', false);
      spawnPickup(b.x + 18, b.y - 16, G.wep === 'magic' ? 'gold' : 'blade', false);
      toast(b.name + ' 倒下', false, true);
      syncHud();
    } else {
      audio.hit(G.combo);
      addScore(SCORE.hit * G.mult);
      juice(cx, cy, HOT2, 0.9);
      hitStop(spec.stop);
      syncHud();
    }
  }

  function resolveSlash() {
    const box = slashBox();
    if (!box) return;
    const spec = slashSpec();
    let i, e, c;
    for (i = 0; i < G.cages.length; i++) {
      c = G.cages[i];
      if (c.broken) continue;
      if (overlap(box.x, box.y, box.w, box.h, c.x - 14, c.y - 34, 28, 36)) rescue(c);
    }
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (G.atkHit[e.id]) continue;
      if (overlap(box.x, box.y, box.w, box.h, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
        G.atkHit[e.id] = 1;
        hitEnemy(e, spec.dmg, spec.knock);
      }
    }
    if (G.boss && !G.boss.dead && G.boss.active && !G.atkHit[G.boss.id]) {
      const b = G.boss;
      if (overlap(box.x, box.y, box.w, box.h, b.x - b.w * 0.5, b.y - b.h, b.w, b.h)) {
        G.atkHit[b.id] = 1;
        hitBoss(spec.dmg);
      }
    }
  }

  function hurt(fromX, dmg, why) {
    if (!playing() || G.invuln > 0 || G.deadT > 0) return;
    G.hp -= dmg;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.invuln = INVULN;
    G.knockT = 0.22;
    const p = G.player;
    p.face = fromX < p.x ? -1 : 1;
    p.vx = (p.x < fromX ? -1 : 1) * 180;
    p.vy = -140;
    p.onLad = false;
    audio.hurt();
    kick(4.2, 'die');
    screenFlash(MAG, 0.32);
    emit(12, {
      x: p.x, y: p.y - 12, j: 8,
      vx0: -160, vx1: 160, vy0: -220, vy1: -20,
      life: 0.32, r0: 1.2, r1: 3.2, rgb: MAG
    });
    if (G.hp <= 0) {
      G.hp = 0;
      die(why || 'hit');
    }
    syncHud();
  }

  function die(why) {
    if (G.deadT > 0) return;
    G.why = why || 'hit';
    G.deadT = DIE_T;
    G.lives -= 1;
    G.atkT = 0;
    G.combo = 0;
    G.mult = 1;
    audio.death();
    kick(6.5, 'die');
    screenFlash(MAG, 0.5);
    const p = G.player;
    emit(18, {
      x: p.x, y: p.y - 10, j: 12,
      vx0: -220, vx1: 220, vy0: -280, vy1: 20,
      life: 0.45, r0: 1.4, r1: 4, rgb: HOT
    });
    syncHud();
  }

  function respawn() {
    G.hp = HP_MAX;
    G.deadT = 0;
    G.invuln = INVULN;
    G.knockT = 0;
    G.atkT = 0;
    G.player = makePlayer(G.checkX, G.checkY);
    G.player.face = 1;
    toast('再起', true, false);
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'fall' ? '坠入魔塔深渊了' : '体力耗尽了';
    showOverlay('lose', '倒下了', why + '  分 ' + G.score + ' · 连击最高 ×' + Math.max(1, G.maxCombo) + '。R 重开。');
    syncHud();
  }

  function goWin() {
    G.mode = 'win';
    addScore(SCORE.win);
    audio.win();
    kick(5, 'win-flash');
    screenFlash(GOLD, 0.55);
    showOverlay('win', '塔巅已破', '魔龙倒下，魔剑归鞘。分 ' + G.score + ' · 连击最高 ×' + Math.max(1, G.maxCombo) + '。');
    syncHud();
  }

  function canAdvance() {
    if (isTide()) return false;
    if (!G.boss) return true;
    return !!G.boss.dead;
  }

  function nextFloor() {
    if (G.stage >= FLOORS.length) {
      addScore(SCORE.floor * G.stage);
      goWin();
      return;
    }
    const keepComp = G.comp && G.comp.hp > 0 ? G.comp : null;
    G.stage += 1;
    addScore(SCORE.floor * G.stage);
    audio.stage();
    toast('升上' + FLOORS[G.stage - 1].name, false, true);
    screenFlash(GOLD, 0.4);
    kick(3.2, 'pickup');
    loadFloor(G.stage, false);
    G.comp = keepComp;
    if (G.comp) {
      G.comp.x = 48;
      G.comp.y = GY;
    }
    G.hp = Math.min(HP_MAX, G.hp + 3);
    G.invuln = 0.6;
    syncHud();
  }

  function tideKinds(wave) {
    const pool = ['imp', 'skel', 'bat'];
    if (wave >= 2) pool.push('knight');
    if (wave >= 3) pool.push('eye');
    if (wave >= 5) pool.push('knight');
    return pool;
  }

  function spawnTideWave() {
    const n = waveCount(G.wave);
    const pool = tideKinds(G.wave);
    const cam = G.camX;
    let i, kind, side, x, y, platY;
    for (i = 0; i < n; i++) {
      kind = pool[(hash2(G.wave * 17 + i) * pool.length) | 0];
      side = hash2(G.wave * 31 + i * 3) > 0.5 ? 1 : -1;
      x = side > 0 ? cam + VW + 20 + (i % 5) * 36 : cam - 30 - (i % 5) * 36;
      x = clamp(x, 40, G.levelW - 40);
      platY = GY;
      if (hash2(i + G.wave * 9) > 0.72) platY = MY;
      y = platY;
      G.ents.push(makeEnt(x, y, kind, Math.max(20, x - 180), Math.min(G.levelW - 20, x + 180), G.wave));
    }
    if (G.wave % 3 === 0 && (!G.comp || G.comp.hp <= 0)) {
      const ck = G.wave % 6 === 0 ? 'mage' : 'hunt';
      G.cages.push(makeCage(clamp(cam + 280, 200, G.levelW - 200), GY, ck));
    }
    if (G.wave % 4 === 0) {
      const names = ['石魔', '双首', '骨王', '魔龙'];
      const nm = names[((G.wave / 4) | 0) % 4];
      G.boss = makeBoss(nm, clamp(cam + VW - 80, 400, G.levelW - 80), G.wave);
      G.boss.active = true;
      G.boss.state = 'fight';
      toast(nm + ' 降临', true, false);
      audio.boss();
    } else {
      toast('第 ' + G.wave + ' 潮', false, true);
    }
    spawnPickup(clamp(cam + 220, 80, G.levelW - 80), GY - 12, G.wave % 2 === 0 ? 'potion' : 'gold', true);
    if (G.wave % 5 === 0) spawnPickup(clamp(cam + 340, 80, G.levelW - 80), MY - 12, 'blade', true);
    G.waveT = 1.2;
    syncHud();
  }

  function tryMountLad(p) {
    if (p.onLad) return;
    if (G.atkT > 0) return;
    let L = null;
    if (inU()) L = findLadder(p.x, p.y, 1);
    else if (inD() && p.grounded) L = findLadder(p.x, p.y, -1);
    if (!L) return;
    p.onLad = true;
    p.lad = L;
    p.x = L.x;
    p.vx = 0;
    p.vy = 0;
    p.grounded = false;
    if (playing()) audio.climb();
  }

  function moveOnLad(p, dt) {
    const L = p.lad;
    if (!L) {
      p.onLad = false;
      return;
    }
    p.x = L.x;
    p.vx = 0;
    let vy = 0;
    if (inU()) vy -= CLIMB;
    if (inD()) vy += CLIMB;
    p.y += vy * dt;
    if (p.y >= L.bot) {
      p.y = L.bot;
      if (inD() || !inU()) {
        p.onLad = false;
        p.lad = null;
        p.grounded = true;
        p.vy = 0;
      }
    }
    if (p.y <= L.top) {
      p.y = L.top;
      p.onLad = false;
      p.lad = null;
      p.grounded = true;
      p.vy = 0;
    }
    if (G.jumpBuf > 0 && (inL() || inR())) {
      p.onLad = false;
      p.lad = null;
      p.vy = -JUMP_V * 0.86;
      p.grounded = false;
      G.jumpBuf = 0;
      if (inL()) { p.face = -1; p.vx = -WALK; }
      if (inR()) { p.face = 1; p.vx = WALK; }
      if (playing()) audio.hop();
    }
    p.coyote = 0;
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

    if (G.knockT > 0) {
      G.knockT -= dt;
      p.onLad = false;
      p.x += p.vx * dt;
      p.x = clamp(p.x, 16, G.levelW - 16);
      p.vy += GRAV * dt;
      if (p.vy > MAX_FALL) p.vy = MAX_FALL;
      const y0 = p.y;
      let y1 = p.y + p.vy * dt;
      p.grounded = false;
      if (p.vy >= 0) {
        const plat = landOn(p.x, y0, y1, null);
        if (plat) {
          y1 = plat.y;
          p.vy = 0;
          p.grounded = true;
          p.vx *= 0.55;
        }
      }
      p.y = y1;
      if (p.y > VH + 90) die('fall');
      p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
      return;
    }

    if (p.onLad) moveOnLad(p, dt);
    else tryMountLad(p);

    if (p.onLad) {
      p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    } else {
      let ax = 0;
      if (inL()) ax -= 1;
      if (inR()) ax += 1;
      const slashing = G.atkT > 0;
      if (ax && !(slashing && p.grounded && Math.abs(p.vx) < 8)) p.face = ax || p.face;
      if (p.grounded) {
        p.vx = ax * WALK * (slashing ? AIR : 1);
        if (ax) p.face = ax;
      } else if (ax) {
        p.vx = lerp(p.vx, ax * WALK, 1 - Math.pow(0.12, dt));
        p.face = ax;
      }
      p.x += p.vx * dt;
      p.x = clamp(p.x, 16, G.levelW - 16);
      if (G.boss && G.boss.active && !G.boss.dead && !isTide()) {
        const minX = G.levelW - VW + 18;
        if (p.x < minX) p.x = minX;
      }

      const canJump = (p.grounded || p.coyote > 0);
      if (G.jumpBuf > 0 && canJump) {
        p.vy = -JUMP_V;
        p.grounded = false;
        p.coyote = 0;
        G.jumpBuf = 0;
        p.squash = 0.78;
        if (ax) {
          p.face = ax;
          p.vx = ax * WALK;
        }
        if (playing()) audio.hop();
        emit(5, {
          x: p.x, y: p.y, j: 8,
          vx0: -60, vx1: 60, vy0: -20, vy1: 40,
          life: 0.22, r0: 1, r1: 2.2, rgb: WHT, g: 200
        });
        hitStop(0.022);
      }

      p.vy += GRAV * dt;
      if (p.vy > MAX_FALL) p.vy = MAX_FALL;
      const y0 = p.y;
      let y1 = p.y + p.vy * dt;
      p.grounded = false;
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
        }
      }
      p.y = y1;
      if (p.grounded) p.coyote = COYOTE;
      else p.coyote -= dt;
    }

    if (p.y > VH + 90) die('fall');
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

    if (G.atkT > 0) G.atkT -= dt;
    if (G.chainT > 0) G.chainT -= dt;

    const want = fireHeld();
    if (want && !G.fireEdge) trySlash();
    G.fireEdge = want;
    resolveSlash();

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

    if (!isTide() && p.grounded && p.x > G.levelW - 78) {
      if (canAdvance()) {
        nextFloor();
        return;
      }
      if (G.boss && !G.boss.dead && G.toastT <= 0) toast('先击败头目', true, false);
    }

    if (G.invuln > 0) return;
    const pb = pBox();
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.45, e.y - e.h, e.w * 0.9, e.h * 0.92)) {
        const k = KINDS[e.kind];
        hurt(e.x, k && k.dmg ? k.dmg : 1, 'hit');
        return;
      }
    }
    if (G.boss && !G.boss.dead && G.boss.active) {
      const b = G.boss;
      if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.4, b.y - b.h, b.w * 0.8, b.h * 0.9)) {
        hurt(b.x, b.dmg || 2, 'boss');
      }
    }
  }

  function nearestEnemy(x, y, range) {
    let best = null;
    let bestD = range;
    let i, e, d;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      d = hypot(e.x - x, (e.y - e.h * 0.5) - y);
      if (d < bestD) { bestD = d; best = e; }
    }
    if (G.boss && G.boss.active && !G.boss.dead) {
      d = hypot(G.boss.x - x, (G.boss.y - G.boss.h * 0.5) - y);
      if (d < bestD) { bestD = d; best = G.boss; }
    }
    return best;
  }

  function updateComp(dt) {
    const c = G.comp;
    if (!c || c.hp <= 0) {
      G.comp = null;
      return;
    }
    const p = G.player;
    if (!p || G.deadT > 0) return;
    c.t += dt;
    if (c.hitN > 0) c.hitN -= dt;
    if (c.invuln > 0) c.invuln -= dt;
    const tx = p.x - p.face * 36;
    const dx = tx - c.x;
    if (Math.abs(dx) > 6) {
      c.vx = (dx > 0 ? 1 : -1) * Math.min(190, Math.abs(dx) * 4);
      c.face = dx > 0 ? 1 : -1;
    } else c.vx = 0;
    c.x += c.vx * dt;
    c.x = clamp(c.x, 16, G.levelW - 16);
    c.vy += GRAV * dt;
    if (c.vy > MAX_FALL) c.vy = MAX_FALL;
    const y0 = c.y;
    let y1 = c.y + c.vy * dt;
    c.grounded = false;
    if (c.vy >= 0) {
      const plat = landOn(c.x, y0, y1, null);
      if (plat) {
        y1 = plat.y;
        c.vy = 0;
        c.grounded = true;
      }
    }
    c.y = y1;
    if (c.grounded && p.y < c.y - 40 && Math.abs(p.x - c.x) < 80) {
      c.vy = -JUMP_V * 0.9;
      c.grounded = false;
    }
    if (c.y > VH + 80) {
      c.x = p.x;
      c.y = p.y;
      c.vy = 0;
    }

    const spec = COMPS[c.kind];
    if (c.cd > 0) c.cd -= dt;
    const tgt = nearestEnemy(c.x, c.y - 12, 220);
    if (tgt && c.cd <= 0 && playing()) {
      c.cd = spec.cd;
      c.face = tgt.x >= c.x ? 1 : -1;
      const rgb = spec.rgb;
      spawnShot({
        x: c.x + c.face * 10, y: c.y - 14,
        vx: c.face * spec.spd, vy: (tgt.y - tgt.h * 0.5 - (c.y - 14)) * 0.8,
        from: 'c', kind: spec.shot, dmg: spec.dmg, pierce: 0,
        life: 0.9, rgb: rgb, hit: []
      });
      if (spec.shot === 'arrow') audio.arrow();
      else audio.bolt();
      emit(4, {
        x: c.x + c.face * 10, y: c.y - 14, j: 4,
        vx0: c.face * 40, vx1: c.face * 120, vy0: -30, vy1: 20,
        life: 0.16, r0: 1, r1: 2, rgb: rgb, g: 40
      });
    }

    if (c.invuln > 0) return;
    let i, e;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (hypot(e.x - c.x, e.y - c.y) < 16) {
        c.hp -= 1;
        c.hitN = 0.2;
        c.invuln = 0.85;
        e.vx = (e.x < c.x ? -1 : 1) * 80;
        if (c.hp <= 0) {
          c.hp = 0;
          juice(c.x, c.y - 10, spec.rgb, 0.7);
          toast(spec.name + ' 倒下了', true, false);
          G.comp = null;
          syncHud();
          return;
        }
        break;
      }
    }
  }

  function updateEnts(dt) {
    const p = G.player;
    const mul = spdMul(isTide(), isTide() ? G.wave : G.stage);
    let i, e, k;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (e.hitN > 0) e.hitN -= dt;
      e.t += dt;
      k = KINDS[e.kind] || KINDS.imp;
      if (k.fly) {
        const chase = p ? (p.x - e.x) : 0;
        const toward = chase >= 0 ? 1 : -1;
        e.x += Math.sin(e.t * 1.4 + e.id) * 22 * dt;
        e.x += toward * k.spd * 0.5 * dt * mul;
        e.x = clamp(e.x, 16, G.levelW - 16);
        e.y = e.base + Math.sin(e.t * 2.2 + e.id) * 16;
        e.face = toward;
        if (k.shoot) {
          e.fire -= dt;
          if (e.fire <= 0 && p && playing() && Math.abs(e.x - p.x) < 280) {
            e.fire = rand(1.3, 2.1);
            const dx = p.x - e.x;
            const dy = (p.y - 14) - (e.y - 6);
            const len = Math.max(0.001, hypot(dx, dy));
            spawnShot({
              x: e.x, y: e.y - 4,
              vx: (dx / len) * 160, vy: (dy / len) * 160,
              from: 'e', kind: 'orb', dmg: 1, pierce: 0,
              life: 1.6, rgb: PUR, hit: []
            });
          }
        }
      } else {
        if (e.kind === 'imp') {
          e.hopT -= dt;
          if (e.grounded && e.hopT <= 0) {
            e.vy = -220;
            e.grounded = false;
            e.hopT = rand(0.7, 1.3);
            e.face = p && p.x > e.x ? 1 : -1;
            e.vx = e.face * k.spd * mul;
          }
        } else {
          if (p && Math.abs(p.x - e.x) < 220) {
            e.face = p.x > e.x ? 1 : -1;
            e.vx = e.face * k.spd * mul;
          } else {
            if (e.x < e.a) e.face = 1;
            if (e.x > e.b) e.face = -1;
            e.vx = e.face * k.spd * 0.7 * mul;
          }
        }
        e.x += e.vx * dt;
        e.x = clamp(e.x, 12, G.levelW - 12);
        e.vy += GRAV * dt;
        if (e.vy > MAX_FALL) e.vy = MAX_FALL;
        const y0 = e.y;
        let y1 = e.y + e.vy * dt;
        e.grounded = false;
        if (e.vy >= 0) {
          const plat = landOn(e.x, y0, y1, null);
          if (plat) {
            y1 = plat.y;
            e.vy = 0;
            e.grounded = true;
          }
        }
        e.y = y1;
        if (e.y > VH + 80) e.dead = true;
      }
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    const p = G.player;
    if (!b.active) {
      if (p && p.x > G.levelW - VW + 40) {
        b.active = true;
        b.state = 'fight';
        audio.boss();
        toast(b.name, true, false);
        kick(3.5, 'boom');
        syncHud();
      }
      return;
    }
    if (b.hitN > 0) b.hitN -= dt;
    b.t += dt;
    b.fire -= dt;
    const mul = spdMul(isTide(), isTide() ? G.wave : G.stage);

    if (b.kind === '魔龙') {
      b.flyY = GY - 70 + Math.sin(b.t * 1.3) * 28;
      b.y = lerp(b.y, b.flyY, 1 - Math.pow(0.08, dt));
      const tx = p ? p.x + 140 : b.x;
      b.x += clamp(tx - b.x, -80, 80) * dt * 0.9;
      b.x = clamp(b.x, G.camX + 80, Math.min(G.levelW - 40, G.camX + VW - 40));
      b.face = p && p.x < b.x ? -1 : 1;
      if (b.fire <= 0 && playing()) {
        b.fire = b.hp < b.max * 0.4 ? 0.7 : 1.15;
        let n;
        for (n = 0; n < 3; n++) {
          spawnShot({
            x: b.x + b.face * 18, y: b.y - 18,
            vx: b.face * (180 + n * 20), vy: -40 + n * 50,
            from: 'e', kind: 'fire', dmg: 1, pierce: 0,
            life: 1.4, rgb: HOT, hit: []
          });
        }
        audio.crack();
      }
      return;
    }

    if (p) b.face = p.x < b.x ? -1 : 1;
    const spd = (b.kind === '石魔' ? 46 : b.kind === '骨王' ? 58 : 70) * mul;
    if (p && Math.abs(p.x - b.x) > 40) b.vx = b.face * spd;
    else b.vx = 0;
    b.x += b.vx * dt;
    b.x = clamp(b.x, 40, G.levelW - 40);
    b.vy += GRAV * dt;
    if (b.vy > MAX_FALL) b.vy = MAX_FALL;
    const y0 = b.y;
    let y1 = b.y + b.vy * dt;
    if (b.vy >= 0) {
      const plat = landOn(b.x, y0, y1, null);
      if (plat) {
        y1 = plat.y;
        b.vy = 0;
      }
    }
    b.y = y1;

    if (b.fire <= 0 && playing()) {
      if (b.kind === '石魔') {
        b.fire = 1.5;
        b.vy = -220;
        spawnShot({
          x: b.x + b.face * 20, y: b.y - 8,
          vx: b.face * 220, vy: 0,
          from: 'e', kind: 'shock', dmg: 1, pierce: 1,
          life: 0.9, rgb: STN, hit: [], grav: 0
        });
        kick(2.8, 'thump');
        audio.boom();
      } else if (b.kind === '双首') {
        b.fire = 1.15;
        spawnShot({
          x: b.x - 10, y: b.y - 28, vx: -160, vy: -40,
          from: 'e', kind: 'fire', dmg: 1, pierce: 0, life: 1.4, rgb: HOT, hit: []
        });
        spawnShot({
          x: b.x + 10, y: b.y - 28, vx: 160, vy: -40,
          from: 'e', kind: 'fire', dmg: 1, pierce: 0, life: 1.4, rgb: HOT, hit: []
        });
        if (p) {
          const dx = p.x - b.x;
          const dy = (p.y - 14) - (b.y - 24);
          const len = Math.max(0.001, hypot(dx, dy));
          spawnShot({
            x: b.x, y: b.y - 24, vx: (dx / len) * 190, vy: (dy / len) * 190,
            from: 'e', kind: 'fire', dmg: 1, pierce: 0, life: 1.3, rgb: HOT2, hit: []
          });
        }
        audio.crack();
      } else if (b.kind === '骨王') {
        b.fire = 2.1;
        const kind = Math.random() > 0.5 ? 'skel' : 'imp';
        G.ents.push(makeEnt(b.x + b.face * -40, b.y, kind, b.x - 160, b.x + 160, isTide() ? G.wave : 0));
        toast('召兵', true, false);
        audio.boss();
      }
    }
  }

  function updateShots(dt) {
    const p = G.player;
    let i, s, j, e;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      s.life -= dt;
      if (s.grav) s.vy += s.grav * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0 || s.x < G.camX - 40 || s.x > G.camX + VW + 40) {
        G.shots.splice(i, 1);
        continue;
      }
      if (s.from === 'e') {
        if (!playing() || G.invuln > 0 || G.deadT > 0) continue;
        const pb = pBox();
        if (overlap(s.x - 5, s.y - 5, 10, 10, pb.x, pb.y, pb.w, pb.h)) {
          G.shots.splice(i, 1);
          hurt(s.x, s.dmg || 1, 'shot');
        }
      } else {
        for (j = 0; j < G.ents.length; j++) {
          e = G.ents[j];
          if (e.dead) continue;
          if (s.hit.indexOf(e.id) >= 0) continue;
          if (overlap(s.x - 6, s.y - 6, 12, 12, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
            s.hit.push(e.id);
            hitEnemy(e, s.dmg || 1, 50);
            if (!s.pierce) {
              G.shots.splice(i, 1);
              break;
            }
          }
        }
        if (!G.shots[i]) continue;
        if (G.boss && G.boss.active && !G.boss.dead && s.hit.indexOf(G.boss.id) < 0) {
          const b = G.boss;
          if (overlap(s.x - 6, s.y - 6, 12, 12, b.x - b.w * 0.5, b.y - b.h, b.w, b.h)) {
            s.hit.push(b.id);
            hitBoss(s.dmg || 1);
            if (!s.pierce) G.shots.splice(i, 1);
          }
        }
      }
    }
  }

  function updateFx(dt) {
    let i, p;
    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.32) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y -= f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (i = 0; i < embers.length; i++) {
      const e = embers[i];
      e.y += e.vy * dt;
      e.x += Math.sin(G.clock * 1.4 + e.ph) * 8 * dt;
      e.ph += dt;
      if (e.y < -8) {
        e.y = VH + 8;
        e.x = rand(0, VW);
      }
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0008, dt));
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    if (G.invuln > 0) G.invuln -= dt;
    if (G.toastT > 0) G.toastT -= dt;
  }

  function updateCam(dt) {
    const p = G.player;
    if (!p) return;
    let tx = p.x - VW * 0.38;
    if (G.boss && G.boss.active && !G.boss.dead && !isTide()) {
      tx = G.levelW - VW;
    }
    tx = clamp(tx, 0, Math.max(0, G.levelW - VW));
    G.camX = lerp(G.camX, tx, 1 - Math.pow(0.0006, dt));
    G.camY = 0;
  }

  function snapFloor(y) {
    if (y < (HY + MY) * 0.5) return HY;
    if (y < (MY + GY) * 0.5) return MY;
    return GY;
  }

  function platCovering(x, floorY) {
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (Math.abs(p.y - floorY) > 10) continue;
      if (x >= p.x + 3 && x <= p.x + p.w - 3) return p;
    }
    return null;
  }

  function nextPit(x, floorY, dir) {
    const plat = platCovering(x, floorY);
    const out = { edge: x, width: 0, next: null, dist: 99 };
    if (!plat) return out;
    const edge = dir > 0 ? plat.x + plat.w : plat.x;
    out.edge = edge;
    out.dist = dir > 0 ? edge - x : x - edge;
    let i, p, best = null, bestD = 1e9, gap;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (Math.abs(p.y - floorY) > 10) continue;
      if (p === plat) continue;
      if (dir > 0) {
        if (p.x + p.w <= edge + 2) continue;
        gap = p.x - edge;
        if (gap < bestD) { bestD = gap; best = p; }
      } else {
        if (p.x >= edge - 2) continue;
        gap = edge - (p.x + p.w);
        if (gap < bestD) { bestD = gap; best = p; }
      }
    }
    out.next = best;
    if (best) out.width = Math.max(0, bestD);
    else out.width = dir > 0 ? Math.max(0, G.levelW - edge) : Math.max(0, edge);
    return out;
  }

  function bestLadder(x, fromY, up) {
    const plat = platCovering(x, fromY);
    let i, L, d, best = null, bestD = 1e9;
    for (i = 0; i < G.ladders.length; i++) {
      L = G.ladders[i];
      if (up) {
        if (Math.abs(L.bot - fromY) > 14) continue;
      } else if (Math.abs(L.top - fromY) > 14) continue;
      if (plat && (L.x < plat.x - 4 || L.x > plat.x + plat.w + 4)) continue;
      d = Math.abs(L.x - x);
      if (d < bestD) { bestD = d; best = L; }
    }
    return best;
  }

  function climbAid(x, floorY, dir) {
    let i, L, dx, best = null, bestD = 1e9;
    for (i = 0; i < G.ladders.length; i++) {
      L = G.ladders[i];
      if (L.top >= floorY - 8) continue;
      dx = L.x - x;
      if (dir > 0 && dx < -24) continue;
      if (dir < 0 && dx > 24) continue;
      if (Math.abs(dx) > 170) continue;
      if (Math.abs(dx) < bestD) {
        bestD = Math.abs(dx);
        best = L;
      }
    }
    return best;
  }

  function platAboveAt(x, floorY) {
    const upY = floorY <= HY + 8 ? null : floorY <= MY + 8 ? HY : MY;
    if (!upY) return null;
    return platCovering(x, upY);
  }

  function clearAutoKeys() {
    autoIn.l = false;
    autoIn.r = false;
    autoIn.u = false;
    autoIn.d = false;
    autoIn.fire = false;
  }

  function autoSteer(tx) {
    autoIn.l = false;
    autoIn.r = false;
    const dx = tx - G.player.x;
    if (dx > 6) {
      autoIn.r = true;
      autoWalkDir = 1;
    } else if (dx < -6) {
      autoIn.l = true;
      autoWalkDir = -1;
    }
  }

  function autoPulseFire() {
    autoFireFlip = !autoFireFlip;
    if (autoFireFlip) autoIn.fire = true;
  }

  function wepReach() {
    const w = WEPS[G.wep] || WEPS.iron;
    return w.reach + (G.chainN >= 3 ? 14 : 0);
  }

  function autoShotThreat() {
    const p = G.player;
    let i, s, t, hx;
    for (i = 0; i < G.shots.length; i++) {
      s = G.shots[i];
      if (s.from !== 'e') continue;
      if (Math.abs(s.y - (p.y - 12)) > 28) continue;
      if (s.vx === 0) {
        if (Math.abs(s.x - p.x) < 46) return s;
        continue;
      }
      t = (p.x - s.x) / s.vx;
      if (t < 0 || t > 0.55) continue;
      hx = s.x + s.vx * t;
      if (Math.abs(hx - p.x) < 22) return s;
    }
    return null;
  }

  function autoPick() {
    const p = G.player;
    const tide = isTide();
    let best = null;
    let bestS = -1e9;
    function consider(x, y, score, kind) {
      if (score > bestS) {
        bestS = score;
        best = { x: x, y: y, kind: kind };
      }
    }

    let i, u, e, d, pri, dx;
    for (i = 0; i < G.pickups.length; i++) {
      u = G.pickups[i];
      if (u.taken) continue;
      d = hypot(u.x - p.x, u.y - (p.y - 12));
      pri = u.kind === 'blade' && G.wep !== 'magic' ? 920
        : u.kind === 'potion' && G.hp <= 7 ? 960
        : u.kind === 'potion' ? 420
        : u.kind === 'gold' ? 280
        : 240;
      if (u.x < p.x - 90 && !tide) pri -= 240;
      pri -= d * 0.42;
      consider(u.x, u.y + 10, pri, 'loot');
    }
    for (i = 0; i < G.cages.length; i++) {
      u = G.cages[i];
      if (u.broken) continue;
      d = hypot(u.x - p.x, u.y - p.y);
      pri = 880 - d * 0.35;
      if (u.x < p.x - 70 && !tide) pri -= 160;
      consider(u.x, u.y, pri, 'cage');
    }
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      dx = e.x - p.x;
      if (dx < -140 && !tide) continue;
      d = hypot(dx, e.y - p.y);
      pri = (tide ? 760 : 540) - d * 0.55;
      if (dx > 0) pri += 50;
      if (KINDS[e.kind] && KINDS[e.kind].fly) {
        pri -= 80;
        consider(e.x, p.y, pri, 'fight');
      } else {
        consider(e.x, e.y, pri, 'fight');
      }
    }
    if (G.boss && G.boss.active && !G.boss.dead) {
      const reach = wepReach();
      const side = p.x < G.boss.x ? -1 : 1;
      consider(G.boss.x + side * (reach * 0.72), G.boss.y, 1100, 'boss');
    }
    if (!tide) {
      if (canAdvance()) consider(G.levelW - 48, GY, 980, 'exit');
      else consider(G.levelW - 70, GY, 160, 'go');
    } else if (!best) {
      consider(clamp(G.camX + VW * 0.45, 80, G.levelW - 80), GY, 80, 'go');
    }
    if (!best) consider(Math.min(G.levelW - 40, p.x + 180), GY, 50, 'go');
    return best;
  }

  function autoThink() {
    clearAutoKeys();
    if (!autoOn || G.mode !== 'play') return;
    const p = G.player;
    if (!p || G.deadT > 0 || G.lock > 0) return;

    const moved = hypot(p.x - autoLastX, p.y - autoLastY);
    if (moved < 3.2 && (p.grounded || p.onLad)) autoStuck += STEP;
    else if (moved > 8) autoStuck = 0;
    autoLastX = p.x;
    autoLastY = p.y;
    if (autoBackT > 0) autoBackT -= STEP;

    const floorY = snapFloor(p.y);
    const reach = wepReach();
    const goal = autoPick();
    autoGoalX = goal.x;
    autoGoalY = goal.y;
    const tfloor = snapFloor(goal.y);
    let seekX = goal.x;
    let wantUp = false;
    let wantDn = false;
    let wantJump = false;
    let wantFire = false;

    if (p.onLad) {
      const L = p.lad;
      if (!autoLadDir) {
        if (tfloor < floorY - 6 || (L && autoGoalY <= L.top + 18)) autoLadDir = -1;
        else if (tfloor > floorY + 6 || (L && autoGoalY >= L.bot - 18)) autoLadDir = 1;
        else autoLadDir = autoGoalY < p.y ? -1 : 1;
      }
      if (autoLadDir < 0) autoIn.u = true;
      else autoIn.d = true;
      if (autoStuck > 0.9) {
        autoIn.u = true;
        autoIn.d = false;
        autoSteer(p.x + (autoWalkDir >= 0 ? 40 : -40));
      }
      return;
    }
    autoLadDir = 0;

    const shot = autoShotThreat();
    if (shot && G.invuln <= 0) {
      wantJump = true;
      autoSteer(p.x + (shot.x >= p.x ? -48 : 48));
    }

    let i, e, dx, dy, adx, close = null, closeD = 1e9;
    function markClose(ex, ey, kind) {
      dy = ey - p.y;
      adx = Math.abs(ex - p.x);
      if (adx > reach + 46) return;
      if (Math.abs(dy) > 58 && ey < p.y - 50) return;
      const d = hypot(ex - p.x, dy);
      if (d < closeD) {
        closeD = d;
        close = { x: ex, y: ey, kind: kind, dx: ex - p.x, dy: dy, adx: adx };
      }
    }
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (!e.dead) markClose(e.x, e.y, 'e');
    }
    for (i = 0; i < G.cages.length; i++) {
      e = G.cages[i];
      if (!e.broken) markClose(e.x, e.y, 'c');
    }
    if (G.boss && G.boss.active && !G.boss.dead) markClose(G.boss.x, G.boss.y, 'b');

    if (close) {
      const flyish = close.y < p.y - 28;
      if (close.adx <= reach + 8 && Math.abs(close.dy) < 46) {
        wantFire = true;
        if (close.dx > 4) autoSteer(p.x + 10);
        else if (close.dx < -4) autoSteer(p.x - 10);
        if (close.adx < 20 && close.kind !== 'c') {
          autoSteer(p.x + (close.dx > 0 ? -40 : 40));
        }
        if (flyish || (close.kind === 'b' && G.boss && G.boss.kind === '魔龙')) wantJump = true;
      } else if (close.adx <= reach + 36 && Math.abs(close.dy) < 52) {
        autoSteer(close.x);
        if (flyish) wantJump = true;
      }
    }

    if (autoBackT > 0) {
      seekX = p.x - autoWalkDir * 70;
    } else if (tfloor < floorY - 10) {
      const above = platAboveAt(p.x, floorY);
      const L = bestLadder(p.x, floorY, true);
      if (above && Math.abs((above.x + above.w * 0.5) - p.x) < above.w * 0.45 + 8) {
        wantJump = true;
        seekX = above.x + above.w * 0.5;
      } else if (L) {
        seekX = L.x;
        if (Math.abs(p.x - L.x) <= 9) wantUp = true;
      } else {
        wantJump = true;
        seekX = goal.x;
      }
    } else if (tfloor > floorY + 10) {
      const L = bestLadder(p.x, floorY, false);
      const pitDown = !platCovering(p.x + autoWalkDir * 18, GY) && floorY < GY - 8;
      if (L && Math.abs(L.x - p.x) < 220) {
        seekX = L.x;
        if (Math.abs(p.x - L.x) <= 9) wantDn = true;
      } else if (!pitDown) {
        seekX = goal.x;
      } else if (L) {
        seekX = L.x;
      }
    } else {
      seekX = goal.x;
    }

    if (!autoIn.l && !autoIn.r) autoSteer(seekX);

    const dir = autoIn.r ? 1 : autoIn.l ? -1 : autoWalkDir;
    const pit = nextPit(p.x, floorY, dir);
    const nearEnd = (dir > 0 && p.x > G.levelW - 90) || (dir < 0 && p.x < 40);
    const seekOff = dir > 0 ? seekX > pit.edge + 10 : seekX < pit.edge - 10;
    if (pit.width > 14 && pit.dist < 34 && seekOff && !nearEnd && !(dir > 0 && !pit.next && p.x > G.levelW - 120)) {
      if (pit.width <= 102) {
        wantJump = true;
      } else {
        const aid = climbAid(p.x, floorY, dir);
        const L = bestLadder(p.x, floorY, true) || bestLadder(p.x, floorY, false);
        const above = platAboveAt(p.x - dir * 16, floorY) || platAboveAt(p.x, floorY);
        if (aid && Math.abs(aid.x - p.x) < 160) {
          autoSteer(aid.x);
          wantJump = true;
          wantUp = true;
        } else if (above) {
          autoSteer(above.x + above.w * 0.45);
          wantJump = true;
        } else if (L) {
          autoSteer(L.x);
          if (Math.abs(p.x - L.x) <= 9) {
            if (Math.abs(L.bot - floorY) <= 14) wantUp = true;
            else wantDn = true;
          }
        } else {
          autoSteer(p.x - dir * 54);
        }
      }
    }

    if (autoStuck > 0.55) wantJump = true;
    if (autoStuck > 1.15) {
      const L = bestLadder(p.x, floorY, true) || bestLadder(p.x, floorY, false);
      if (L) {
        autoSteer(L.x);
        if (Math.abs(p.x - L.x) <= 9) wantUp = true;
      } else wantJump = true;
    }
    if (autoStuck > 1.9) {
      autoBackT = 0.38;
      autoStuck = 0;
      autoWalkDir *= -1;
    }

    if (wantDn && !wantUp) autoIn.d = true;
    else if (wantUp || wantJump) autoIn.u = true;
    if (wantFire) autoPulseFire();

    if (p.grounded && platAboveAt(p.x, floorY) && tfloor < floorY - 4 && !wantDn) {
      autoIn.u = true;
      autoIn.d = false;
    }
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.25 : 0.5)) {
        autoOvWait = 0;
        startGame(G.kind || 'climb');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.7 : 1.15)) {
        autoOvWait = 0;
        startGame(G.kind || 'climb');
      }
    }
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    if (speedEl) speedEl.value = String(autoSpeed);
    if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
    if (speedEl) {
      speedEl.title = SPEED_LABELS[autoSpeed];
      speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
    }
  }

  function autoScale() {
    if (!autoOn || G.mode !== 'play') return 1;
    return AUTO_SCALE[autoSpeed] || 1;
  }

  function setAutoSpeed(n) {
    n = parseInt(n, 10);
    if (!isFinite(n) || n < 1 || n > 4) n = 3;
    autoSpeed = n;
    saveAutoSpeed(autoSpeed);
    syncSpeedUi();
  }

  function toggleAuto() {
    autoOn = !autoOn;
    autoOvWait = 0;
    autoStuck = 0;
    autoBackT = 0;
    autoFireFlip = false;
    autoLadDir = 0;
    clearAutoKeys();
    keys.l = false;
    keys.r = false;
    keys.u = false;
    keys.d = false;
    keys.fire = false;
    syncAutoUi();
    if (autoOn) {
      audio.ensure();
      if (G.mode === 'title') startGame(G.kind || 'climb');
    }
    syncHud();
  }

  function isAutoKey(e) {
    return e.code === 'KeyA' || e.key === 'a' || e.key === 'A';
  }

  function updateDemo(dt) {
    const p = G.player;
    if (!p) return;
    demo.r = true;
    demo.l = false;
    demo.d = false;
    if (p.x > 520) {
      p.x = 70;
      G.camX = 0;
    }
    demo.u = (G.clock % 2.6) < 0.18 && p.grounded;
    demo.fire = (G.clock % 0.9) < 0.12;
    const L = findLadder(p.x, p.y, 1);
    if (L && p.grounded && (G.clock % 5) < 1.2) demo.u = true;
  }

  function liveEnts() {
    let n = 0;
    let i;
    for (i = 0; i < G.ents.length; i++) if (!G.ents[i].dead) n += 1;
    return n;
  }

  function updateTide(dt) {
    if (!isTide() || !playing()) return;
    if (G.boss && G.boss.active && !G.boss.dead) return;
    if (liveEnts() > 0) return;
    G.waveT -= dt;
    if (G.waveT > 0) return;
    G.wave += 1;
    addScore(SCORE.wave * G.wave);
    G.waveT = 1.15;
    spawnTideWave();
  }

  function update(dt) {
    G.clock += dt;
    if (autoOn) tickAutoFlow(dt);
    if (G.stop > 0 && !(autoOn && autoSpeed >= 4 && G.mode === 'play')) {
      G.stop -= dt;
      updateFx(dt * 0.25);
      return;
    }
    if (autoOn && autoSpeed >= 4) G.stop = 0;
    if (G.mode === 'title') updateDemo(dt);
    if (autoOn && G.mode === 'play' && G.deadT <= 0) autoThink();
    if (G.mode === 'title' || G.mode === 'play') {
      G.t += dt;
      updatePlayer(dt);
      updateComp(dt);
      updateEnts(dt);
      updateBoss(dt);
      updateShots(dt);
      updateTide(dt);
      updateCam(dt);
    }
    updateFx(dt);
  }

  function rr(x, y, w, h) {
    ctx.fillRect(sx(x), sy(y), w * scale, h * scale);
  }

  function disc(x, y, r) {
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), r * scale, 0, TAU);
    ctx.fill();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (G.theme === 'peak') {
      g.addColorStop(0, '#2a100c');
      g.addColorStop(0.55, '#140806');
      g.addColorStop(1, '#0a0404');
    } else if (G.theme === 'altar') {
      g.addColorStop(0, '#241018');
      g.addColorStop(0.55, '#14080c');
      g.addColorStop(1, '#0c0406');
    } else if (G.theme === 'hall') {
      g.addColorStop(0, '#1c1010');
      g.addColorStop(0.55, '#120808');
      g.addColorStop(1, '#0a0404');
    } else {
      g.addColorStop(0, '#1c0c08');
      g.addColorStop(0.55, '#120806');
      g.addColorStop(1, '#0a0404');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
  }

  function drawBackdrop() {
    const cam = G.camX;
    let x, i;
    ctx.fillStyle = 'rgba(40, 18, 14, 0.55)';
    for (i = 0; i < 8; i++) {
      x = ((i * 220 - cam * 0.25) % (VW + 220)) - 40;
      ctx.fillRect(ox + x * scale, oy + 40 * scale, 28 * scale, 240 * scale);
      ctx.fillStyle = rgba(HOT, 0.06);
      ctx.fillRect(ox + (x + 8) * scale, oy + 70 * scale, 12 * scale, 22 * scale);
      ctx.fillStyle = 'rgba(40, 18, 14, 0.55)';
    }
    for (i = 0; i < embers.length; i++) {
      const e = embers[i];
      ctx.fillStyle = rgba(HOT2, e.a);
      disc(G.camX + e.x, e.y, e.r);
    }
    const torch = [180, 520, 860, 1200, 1540, 1880, 2220];
    for (i = 0; i < torch.length; i++) {
      x = torch[i];
      if (x < cam - 20 || x > cam + VW + 20) continue;
      const flick = 0.7 + Math.sin(G.clock * 9 + i) * 0.2;
      ctx.fillStyle = rgba(HOT, 0.18 * flick);
      disc(x, 210, 22);
      ctx.fillStyle = rgba(GOLD, 0.55 * flick);
      disc(x, 214, 4);
      ctx.fillStyle = '#3a2218';
      rr(x - 2, 218, 4, 18);
    }
  }

  function drawPlats() {
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (p.x + p.w < G.camX - 8 || p.x > G.camX + VW + 8) continue;
      if (p.base) {
        ctx.fillStyle = '#2a1812';
        rr(p.x, p.y, p.w, 80);
        ctx.fillStyle = '#3c2418';
        rr(p.x, p.y, p.w, 8);
        ctx.fillStyle = rgba(HOT, 0.18);
        rr(p.x, p.y, p.w, 2);
        ctx.fillStyle = '#1a0e0a';
        let bx;
        for (bx = p.x; bx < p.x + p.w; bx += 18) {
          rr(bx + 2, p.y + 14, 14, 8);
        }
      } else {
        ctx.fillStyle = '#3a261c';
        rr(p.x, p.y, p.w, 8);
        ctx.fillStyle = rgba(HOT2, 0.22);
        rr(p.x, p.y, p.w, 2);
        ctx.fillStyle = '#221410';
        rr(p.x + 2, p.y + 8, p.w - 4, 4);
      }
    }
  }

  function drawLadders() {
    let i, L, y;
    for (i = 0; i < G.ladders.length; i++) {
      L = G.ladders[i];
      if (L.x < G.camX - 12 || L.x > G.camX + VW + 12) continue;
      ctx.fillStyle = '#6a4030';
      rr(L.x - 6, L.top, 2, L.bot - L.top);
      rr(L.x + 4, L.top, 2, L.bot - L.top);
      ctx.fillStyle = '#c07040';
      for (y = L.top + 6; y < L.bot; y += 10) rr(L.x - 6, y, 12, 2);
    }
  }

  function drawPortal() {
    if (isTide()) return;
    const x = G.levelW - 52;
    const on = canAdvance();
    const pulse = 0.5 + Math.sin(G.clock * 5) * 0.3;
    ctx.fillStyle = rgba(on ? GOLD : STN, on ? 0.22 * pulse : 0.12);
    rr(x - 18, HY - 20, 48, GY - HY + 28);
    ctx.fillStyle = rgba(on ? HOT : DARK, on ? 0.55 : 0.35);
    rr(x - 10, HY, 32, GY - HY);
    if (on) {
      ctx.fillStyle = rgba(GOLD, 0.35 * pulse);
      disc(x + 6, HY + 30, 10);
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.font = 'bold ' + Math.max(10, 11 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('上', sx(x + 6), sy(HY + 20));
    }
  }

  function drawCage(c) {
    if (c.broken) return;
    const bob = Math.sin(G.clock * 2 + c.t) * 2;
    ctx.fillStyle = rgba(GOLD, 0.2);
    rr(c.x - 14, c.y - 36 + bob, 28, 36);
    ctx.strokeStyle = rgba(GOLD, 0.8);
    ctx.lineWidth = 1.4 * scale;
    ctx.strokeRect(sx(c.x - 14), sy(c.y - 36 + bob), 28 * scale, 36 * scale);
    ctx.beginPath();
    ctx.moveTo(sx(c.x - 14), sy(c.y - 36 + bob));
    ctx.lineTo(sx(c.x + 14), sy(c.y + bob));
    ctx.moveTo(sx(c.x + 14), sy(c.y - 36 + bob));
    ctx.lineTo(sx(c.x - 14), sy(c.y + bob));
    ctx.stroke();
    const spec = COMPS[c.kind];
    ctx.fillStyle = rgba(spec.rgb, 0.9);
    disc(c.x, c.y - 24 + bob, 3.4);
    ctx.fillStyle = rgba(spec.rgb, 0.7);
    rr(c.x - 3, c.y - 20 + bob, 6, 10);
  }

  function drawPickup(u) {
    if (u.taken) return;
    const bob = Math.sin(G.clock * 6 + u.t) * 2;
    const y = u.y + bob;
    if (u.kind === 'potion') {
      ctx.fillStyle = rgba(MAG, 0.9);
      rr(u.x - 4, y - 8, 8, 10);
      ctx.fillStyle = rgba(WHT, 0.7);
      disc(u.x, y - 10, 3);
    } else if (u.kind === 'blade') {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.save();
      ctx.translate(sx(u.x), sy(y));
      ctx.rotate(-0.6);
      ctx.fillRect(-2 * scale, -12 * scale, 4 * scale, 22 * scale);
      ctx.restore();
      ctx.fillStyle = rgba(HOT, 0.8);
      disc(u.x, y + 8, 2.4);
    } else {
      ctx.fillStyle = rgba(GOLD, 0.95);
      disc(u.x, y, 5);
      ctx.fillStyle = rgba(HOT2, 0.8);
      disc(u.x, y, 2.4);
    }
  }

  function drawEnt(e) {
    if (e.dead) return;
    const hit = e.hitN > 0;
    const x = e.x;
    const y = e.y;
    ctx.save();
    if (hit) ctx.globalAlpha = 0.55 + Math.sin(G.clock * 40) * 0.3;
    if (e.kind === 'bat') {
      ctx.fillStyle = rgba(PUR, 0.9);
      const flap = Math.sin(G.clock * 14) * 6;
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(y - 6));
      ctx.lineTo(sx(x - 12), sy(y - 6 - flap));
      ctx.lineTo(sx(x - 2), sy(y - 2));
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(y - 6));
      ctx.lineTo(sx(x + 12), sy(y - 6 - flap));
      ctx.lineTo(sx(x + 2), sy(y - 2));
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      disc(x, y - 4, 3);
    } else if (e.kind === 'eye') {
      ctx.fillStyle = rgba(PUR, 0.85);
      disc(x, y - 8, 9);
      ctx.fillStyle = rgba(HOT, 0.95);
      disc(x, y - 8, 4);
      ctx.fillStyle = '#120406';
      disc(x + e.face * 1.5, y - 8, 2);
    } else if (e.kind === 'imp') {
      ctx.fillStyle = rgba(HOT, 0.95);
      rr(x - 6, y - 16, 12, 14);
      ctx.fillStyle = rgba(HOT2, 0.95);
      disc(x, y - 18, 5);
      ctx.fillStyle = '#3a0c08';
      rr(x - 6, y - 24, 3, 6);
      rr(x + 3, y - 24, 3, 6);
      ctx.fillStyle = rgba(GOLD, 0.9);
      disc(x - 2, y - 18, 1.2);
      disc(x + 2, y - 18, 1.2);
    } else if (e.kind === 'skel') {
      ctx.fillStyle = rgba(BONE, 0.95);
      rr(x - 5, y - 22, 10, 16);
      disc(x, y - 26, 5);
      ctx.fillStyle = '#1a1010';
      disc(x - 2, y - 27, 1.2);
      disc(x + 2, y - 27, 1.2);
      ctx.fillStyle = rgba(STN, 0.9);
      rr(x + e.face * 6, y - 16, e.face * 10, 2);
    } else {
      ctx.fillStyle = '#2a2428';
      rr(x - 8, y - 26, 16, 20);
      ctx.fillStyle = '#3a3438';
      disc(x, y - 30, 6);
      ctx.fillStyle = rgba(CRIM, 0.95);
      rr(x - 2, y - 36, 4, 6);
      ctx.fillStyle = rgba(HOT, 0.8);
      rr(x + e.face * 8, y - 18, e.face * 16, 3);
    }
    ctx.restore();
  }

  function drawBoss() {
    const b = G.boss;
    if (!b || b.dead) return;
    if (!b.active && b.x < G.camX - 40) return;
    const hit = b.hitN > 0;
    ctx.save();
    if (hit) ctx.globalAlpha = 0.6;
    if (b.kind === '石魔') {
      ctx.fillStyle = '#5a4638';
      rr(b.x - 16, b.y - 42, 32, 42);
      ctx.fillStyle = '#6a5648';
      rr(b.x - 18, b.y - 52, 36, 14);
      ctx.fillStyle = rgba(HOT, 0.7);
      disc(b.x - 6, b.y - 46, 3);
      disc(b.x + 6, b.y - 46, 3);
    } else if (b.kind === '双首') {
      ctx.fillStyle = '#4a2030';
      rr(b.x - 16, b.y - 32, 32, 32);
      ctx.fillStyle = '#6a2840';
      disc(b.x - 12, b.y - 42, 10);
      disc(b.x + 12, b.y - 42, 10);
      ctx.fillStyle = rgba(HOT, 0.9);
      disc(b.x - 12, b.y - 42, 3);
      disc(b.x + 12, b.y - 42, 3);
    } else if (b.kind === '骨王') {
      ctx.fillStyle = rgba(BONE, 0.95);
      rr(b.x - 10, b.y - 40, 20, 40);
      disc(b.x, b.y - 50, 8);
      ctx.fillStyle = '#1a1010';
      disc(b.x - 3, b.y - 51, 1.6);
      disc(b.x + 3, b.y - 51, 1.6);
      ctx.fillStyle = rgba(GOLD, 0.85);
      rr(b.x - 8, b.y - 60, 16, 6);
    } else {
      ctx.fillStyle = '#6a2018';
      ctx.beginPath();
      ctx.ellipse(sx(b.x), sy(b.y - 18), 26 * scale, 14 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#8a3020';
      disc(b.x + b.face * 22, b.y - 22, 10);
      ctx.fillStyle = rgba(GOLD, 0.8);
      disc(b.x + b.face * 26, b.y - 24, 3);
      const wing = Math.sin(G.clock * 6) * 8;
      ctx.fillStyle = 'rgba(80, 20, 16, 0.7)';
      ctx.beginPath();
      ctx.moveTo(sx(b.x), sy(b.y - 20));
      ctx.lineTo(sx(b.x - 28), sy(b.y - 36 - wing));
      ctx.lineTo(sx(b.x - 8), sy(b.y - 8));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSword(p) {
    const spec = slashSpec();
    const wep = WEPS[G.wep] || WEPS.iron;
    const rgb = G.wep === 'magic' ? GOLD : G.wep === 'flame' ? HOT2 : WHT;
    const hx = p.x + p.face * 4;
    const hy = p.y - 14;
    ctx.save();
    ctx.lineCap = 'round';
    if (G.atkT > 0) {
      const age = 1 - G.atkT / spec.t;
      const a0 = p.face > 0 ? -1.15 : Math.PI + 1.15;
      const a1 = p.face > 0 ? 0.95 : Math.PI - 0.95;
      const ang = lerp(a0, a1, Math.min(1, age / 0.72));
      const reach = spec.reach;
      const tx = hx + Math.cos(ang) * reach;
      const ty = hy + Math.sin(ang) * reach;
      ctx.strokeStyle = rgba(rgb, 0.28);
      ctx.lineWidth = 10 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(hx), sy(hy));
      ctx.lineTo(sx(tx), sy(ty));
      ctx.stroke();
      ctx.strokeStyle = rgba(rgb, 0.95);
      ctx.lineWidth = 3.2 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(hx), sy(hy));
      ctx.lineTo(sx(tx), sy(ty));
      ctx.stroke();
      ctx.fillStyle = rgba(WHT, 0.9);
      disc(tx, ty, 3.2);
      if (age > spec.h0 && age < spec.h1 + 0.08) {
        ctx.strokeStyle = rgba(rgb, 0.35);
        ctx.lineWidth = 14 * scale;
        ctx.beginPath();
        ctx.arc(sx(hx), sy(hy), reach * 0.72 * scale, Math.min(a0, ang), Math.max(a0, ang));
        ctx.stroke();
      }
    } else {
      const ang = p.face > 0 ? 0.42 : Math.PI - 0.42;
      const reach = wep.reach * 0.72;
      const tx = hx + Math.cos(ang) * reach;
      const ty = hy + Math.sin(ang) * reach;
      ctx.strokeStyle = rgba(rgb, 0.95);
      ctx.lineWidth = 2.8 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(hx), sy(hy));
      ctx.lineTo(sx(tx), sy(ty));
      ctx.stroke();
      ctx.fillStyle = rgba(HOT, 0.9);
      disc(hx, hy, 2.2);
      ctx.fillStyle = rgba(rgb, 0.85);
      disc(tx, ty, 2.4);
    }
    ctx.restore();
  }

  function drawHero(p, opt) {
    const blink = opt.blink && ((G.clock * 18) | 0) % 2 === 0;
    if (blink) return;
    const sq = opt.squash || 1;
    const x = p.x;
    const y = p.y;
    const f = p.face;
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.scale(scale * f, scale * sq);
    ctx.fillStyle = rgba(CRIM, 0.85);
    ctx.beginPath();
    ctx.moveTo(-2, -22);
    ctx.lineTo(-12, -6);
    ctx.lineTo(-4, -8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c43a28';
    ctx.fillRect(-6, -22, 12, 16);
    ctx.fillStyle = '#8a2418';
    ctx.fillRect(-6, -8, 5, 8);
    ctx.fillRect(1, -8, 5, 8);
    ctx.fillStyle = rgba(SKIN, 1);
    ctx.beginPath();
    ctx.arc(0, -26, 5.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#4a1c14';
    ctx.fillRect(-5.4, -32, 10.8, 5);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(-1.4, -34, 2.8, 4);
    ctx.fillStyle = '#1a0c08';
    ctx.fillRect(-3.2, -27, 2.4, 1.4);
    ctx.restore();
    drawSword(p);
  }

  function drawComp() {
    const c = G.comp;
    if (!c || c.hp <= 0) return;
    const spec = COMPS[c.kind];
    const blink = c.hitN > 0 && ((G.clock * 20) | 0) % 2 === 0;
    if (blink) return;
    ctx.fillStyle = rgba(spec.rgb, 0.95);
    rr(c.x - 5, c.y - 18, 10, 14);
    ctx.fillStyle = rgba(SKIN, 1);
    disc(c.x, c.y - 22, 4);
    if (c.kind === 'hunt') {
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      ctx.arc(sx(c.x + c.face * 6), sy(c.y - 14), 6 * scale, -0.8, 0.8);
      ctx.stroke();
    } else {
      ctx.fillStyle = rgba(CYN, 0.9);
      rr(c.x + c.face * 4, c.y - 20, c.face * 3, 14);
      disc(c.x + c.face * 7, c.y - 22, 2.4);
    }
  }

  function drawShot(s) {
    ctx.fillStyle = rgba(s.rgb || HOT, 0.95);
    if (s.kind === 'arrow') {
      ctx.save();
      ctx.translate(sx(s.x), sy(s.y));
      ctx.rotate(Math.atan2(s.vy, s.vx));
      ctx.fillRect(-6 * scale, -1.2 * scale, 12 * scale, 2.4 * scale);
      ctx.restore();
    } else if (s.kind === 'shock') {
      ctx.fillStyle = rgba(STN, 0.7);
      rr(s.x - 14, s.y - 6, 28, 10);
    } else {
      disc(s.x, s.y, s.kind === 'fire' ? 5 : 4);
      ctx.fillStyle = rgba(WHT, 0.6);
      disc(s.x, s.y, 1.6);
    }
  }

  function drawFx() {
    let i, p, s, r, f, a;
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      disc(p.x, p.y, p.r);
    }
    for (i = 0; i < sparks.length; i++) {
      s = sparks[i];
      a = 1 - s.t / 0.28;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.4 * scale;
      const rad = s.rad * (0.4 + s.t * 4);
      let k;
      for (k = 0; k < 4; k++) {
        const ang = k * Math.PI * 0.5 + 0.4;
        ctx.beginPath();
        ctx.moveTo(sx(s.x + Math.cos(ang) * 2), sy(s.y + Math.sin(ang) * 2));
        ctx.lineTo(sx(s.x + Math.cos(ang) * rad), sy(s.y + Math.sin(ang) * rad));
        ctx.stroke();
      }
    }
    for (i = 0; i < rings.length; i++) {
      r = rings[i];
      a = 1 - r.t / 0.32;
      ctx.strokeStyle = rgba(r.rgb, a * 0.7);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 70) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (i = 0; i < floats.length; i++) {
      f = floats[i];
      a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.font = 'bold ' + Math.max(11, f.size * scale) + 'px sans-serif';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function draw() {
    dpr = dpr || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#100604';
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
    drawPlats();
    drawLadders();
    drawPortal();

    let i;
    for (i = 0; i < G.cages.length; i++) drawCage(G.cages[i]);
    for (i = 0; i < G.pickups.length; i++) drawPickup(G.pickups[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBoss();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);
    drawComp();

    const p = G.player;
    if (p && G.deadT <= 0) {
      const blink = playing() && G.invuln > 0;
      drawHero(p, {
        run: p.run, grounded: p.grounded && !p.onLad,
        squash: p.squash, blink: blink
      });
    }

    drawFx();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
    ctx.restore();
  }

  function startGame(kind) {
    G.kind = kind === 'tide' ? 'tide' : 'climb';
    G.mode = 'play';
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.wep = 'iron';
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    G.chainN = 0;
    G.nextLife = LIFE_EVERY;
    G.invuln = 0.4;
    G.deadT = 0;
    G.comp = null;
    G.wave = 0;
    G.why = '';
    audio.start();
    hideOverlay();
    autoStuck = 0;
    autoBackT = 0;
    autoWalkDir = 1;
    autoLadDir = 0;
    autoLastX = 70;
    autoLastY = GY;
    autoOvWait = 0;
    clearAutoKeys();
    if (isTide()) {
      loadTideArena();
      G.wave = 1;
      spawnTideWave();
    } else {
      loadFloor(1, false);
    }
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'climb';
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.wep = 'iron';
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.comp = null;
    G.wave = 1;
    G.invuln = 0;
    G.deadT = 0;
    loadFloor(1, true);
    demo.r = true;
    demo.l = false;
    demo.u = false;
    demo.fire = false;
    showOverlay('title', '魔剑', '往右走、往上爬魔塔。长剑横扫，救出同伴并肩作战。小鬼、骑士、每层头目。体力打空扣一命。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('climb');
    else startGame(G.kind);
  }

  function primaryAction() {
    if (G.mode === 'title') startGame('climb');
    else if (G.mode === 'win' || G.mode === 'lose') startGame(G.kind);
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
    if (isAutoKey(e)) {
      if (down && !e.repeat) {
        audio.ensure();
        toggleAuto();
      }
      e.preventDefault();
      return;
    }
    if (e.target === speedEl) return;

    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';

    if (!autoOn) {
      if (k === 'ArrowLeft' || k === 'Left') keys.l = down;
      if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
      if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
      if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
      if (space) keys.fire = down;
    } else if (down && (isMove || space)) {
      e.preventDefault();
    }

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
      startGame('climb');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('tide');
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
        if (autoOn) return;
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
    hold(document.getElementById('btn-slash'), function () { keys.fire = true; }, function () { keys.fire = false; });
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen() || autoOn) return;
      keys.fire = true;
    });
    canvas.addEventListener('pointerup', function () { keys.fire = false; });
    canvas.addEventListener('pointercancel', function () { keys.fire = false; });
    canvas.addEventListener('pointerleave', function () { keys.fire = false; });
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
    const turbo = autoOn && autoSpeed >= 4 && G.mode === 'play';
    if (G.stop > 0 && !turbo) {
      G.stop -= dt;
      updateFx(dt * 0.25);
      if (autoOn && G.mode !== 'play') tickAutoFlow(dt);
      draw();
      return;
    }
    if (turbo) G.stop = 0;
    acc += dt * autoScale();
    let n = 0;
    const maxSteps = turbo ? 16 : 5;
    while (acc >= STEP && n < maxSteps) {
      update(STEP);
      acc -= STEP;
      n += 1;
    }
    if (acc > STEP * 4) acc = 0;
    draw();
  }

  function initMute() {
    let m = false;
    try { m = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { m = false; }
    audio.setMuted(m);
  }

  loadBest();
  initMute();
  autoSpeed = loadAutoSpeed();
  syncSpeedUi();
  syncAutoUi();
  goTitle();
  resize();
  bindPointer();
  bindPad();

  if (btnClimb) {
    btnClimb.addEventListener('click', function () {
      audio.ensure();
      startGame('climb');
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
      if (G.mode === 'win') startGame('tide');
      else goTitle();
    });
  }
  if (modeClimb) {
    modeClimb.addEventListener('click', function () {
      audio.ensure();
      startGame('climb');
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
  if (btnAuto) {
    btnAuto.addEventListener('click', function () {
      audio.ensure();
      toggleAuto();
    });
  }
  if (speedEl) {
    speedEl.addEventListener('input', function () { setAutoSpeed(parseInt(speedEl.value, 10)); });
    speedEl.addEventListener('change', function () { setAutoSpeed(parseInt(speedEl.value, 10)); });
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
    }
  });

  requestAnimationFrame(frame);
})();
