'use strict';

/* 金弹3 — Metal Slug 3 remake.
   Branching routes + slug tank, Shift/Z grenade, crash = lose a life.
   Distinct from 金弹 (camel/flyer, 沙门/南港), 合金 (HP + tank eject). */

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.35;
  const GY = 328;
  const MY = 256;
  const HY = 184;
  const DY = 400;
  const WATER_Y = 300;
  const WALK = 224;
  const AIR = 0.9;
  const JUMP_V = 500;
  const GRAV = 1450;
  const MAX_FALL = 580;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const PW = 14;
  const PH = 26;
  const INVULN = 1.2;
  const DIE_T = 0.82;
  const NADE_MAX = 20;
  const NADE_STAGE = 8;
  const NADE_CORE = 6;
  const BEST_KEY = 'playbox-metalslug3-best';
  const MUTE_KEY = 'playbox-metalslug3-mute';
  const OPS = '方向 / WASD 走跳 · 空格开火 · Shift/Z 手雷 · 铁蛞 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 148, 24];
  const HOT2 = [255, 192, 64];
  const WHT = [246, 236, 220];
  const LEAF = [61, 255, 122];
  const ORG = [255, 168, 64];
  const SKIN = [244, 214, 176];
  const SAND = [200, 150, 70];
  const NAVY = [36, 72, 140];
  const KHAKI = [196, 148, 58];
  const RUST = [168, 72, 36];
  const OLIVE = [72, 96, 48];
  const WRAP = [216, 196, 148];
  const MOSS = [48, 92, 64];
  const ICE = [160, 210, 230];

  const GUN_NAME = { pistol: '手枪', H: '机枪', S: '散弹', slug: '铁蛞' };
  const WEAPONS = {
    pistol: { cd: 0.15, max: 4, spd: 560, dmg: 1, pierce: 0, life: 0.7, rgb: GOLD, grav: 0 },
    H: { cd: 0.068, max: 9, spd: 640, dmg: 1, pierce: 0, life: 0.52, rgb: HOT2, grav: 0 },
    S: { cd: 0.36, max: 9, spd: 430, dmg: 2, pierce: 0, life: 0.3, rgb: GOLD, grav: 0 },
    slug: { cd: 0.2, max: 5, spd: 500, dmg: 2, pierce: 1, life: 0.72, rgb: HOT, grav: 0 }
  };

  const SCORE = {
    grunt: 100, slash: 150, turret: 250, mortar: 200,
    copter: 200, frog: 150, truck: 250, crate: 80,
    mummy: 180, zombie: 160, crab: 140, yeti: 220,
    boss: 5000, stage: 2000
  };

  const STAGES = [
    {
      name: '沙墓', boss: '沙闸', theme: 'sand', w: 2580, hp: 0,
      forkX: 820, highName: '沙道', lowName: '陵道',
      ground: [[0, 780], [1720, 860]],
      lows: [[780, 940]],
      water: null,
      plats: [
        [160, MY, 140], [420, MY, 150],
        [820, MY, 190], [1080, MY, 200], [1340, MY, 180], [1560, MY, 140],
        [500, HY, 110], [960, HY, 130], [1280, HY, 120],
        [1640, 360, 140],
        [1880, MY, 150], [2200, MY, 140],
        [2040, HY, 120]
      ],
      ents: [
        [260, GY, 'grunt', 40, 520],
        [430, GY, 'slash', 80, 540],
        [520, MY, 'turret', 0, 0],
        [760, GY, 'grunt', 700, 800],
        [920, MY, 'slash', 820, 1240],
        [1100, MY, 'grunt', 1080, 1280],
        [1240, HY, 'mortar', 0, 0],
        [960, DY, 'mummy', 860, 1400],
        [1120, DY, 'mummy', 900, 1500],
        [1280, DY, 'turret', 0, 0],
        [1480, DY, 'mummy', 1200, 1640],
        [1860, GY, 'slash', 1760, 2200],
        [2040, GY, 'turret', 0, 0],
        [2180, MY, 'grunt', 1880, 2340],
        [2320, GY, 'slash', 2000, 2460]
      ],
      rides: [[480, GY, 'slug']],
      crates: [[700, GY, 'nade'], [1180, MY, 'H'], [1400, DY, 'S']],
      drops: [[1020, HY, 'H'], [2100, MY, 'nade']]
    },
    {
      name: '沼岸', boss: '沼闸', theme: 'swamp', w: 2720, hp: 0,
      forkX: 700, highName: '沼岸', lowName: '潜道',
      ground: [[0, 640], [1880, 840]],
      lows: [[640, 1240]],
      water: [[640, 1240]],
      plats: [
        [120, MY, 130], [380, MY, 140],
        [700, MY, 170], [960, MY, 180], [1240, MY, 170], [1520, MY, 150],
        [280, HY, 110], [880, HY, 130], [1360, HY, 140],
        [1760, 360, 140],
        [2040, MY, 160], [2360, MY, 140],
        [2200, HY, 120]
      ],
      ents: [
        [220, GY, 'zombie', 20, 500],
        [400, GY, 'slash', 80, 560],
        [520, MY, 'frog', 380, 620],
        [760, MY, 'zombie', 700, 1100],
        [980, MY, 'turret', 0, 0],
        [1180, HY, 'copter', 1080, 1420],
        [820, DY, 'crab', 700, 1200],
        [1020, DY, 'crab', 760, 1500],
        [1280, DY, 'crab', 900, 1700],
        [1480, DY, 'turret', 0, 0],
        [1640, MY, 'zombie', 1520, 1760],
        [1980, GY, 'slash', 1880, 2360],
        [2140, GY, 'frog', 1960, 2400],
        [2280, MY, 'zombie', 2040, 2500],
        [2460, GY, 'mortar', 0, 0]
      ],
      rides: [[420, GY, 'slug']],
      crates: [[580, GY, 'nade'], [1100, MY, 'S'], [1600, DY, 'H']],
      drops: [[1320, HY, 'S'], [2280, MY, 'nade']]
    },
    {
      name: '雪谷', boss: '木星坦', theme: 'snow', w: 2140, hp: 56,
      forkX: 0, highName: '', lowName: '',
      ground: [[0, 460], [560, 380], [1060, 1080]],
      lows: [],
      water: null,
      plats: [
        [80, MY, 130], [320, MY, 150], [620, MY, 160],
        [980, MY, 170], [1360, MY, 180], [1720, MY, 150],
        [220, HY, 120], [720, HY, 140], [1220, HY, 150], [1580, HY, 140]
      ],
      ents: [
        [200, GY, 'grunt', 20, 400],
        [340, MY, 'yeti', 80, 520],
        [480, GY, 'slash', 420, 720],
        [640, HY, 'copter', 560, 820],
        [820, GY, 'truck', 760, 1000],
        [980, GY, 'yeti', 920, 1280],
        [1140, MY, 'turret', 0, 0],
        [1280, GY, 'slash', 1100, 1540],
        [1440, HY, 'copter', 1280, 1640],
        [1600, MY, 'yeti', 1480, 1760]
      ],
      rides: [[460, GY, 'slug']],
      crates: [[700, GY, 'H'], [1240, MY, 'S']],
      drops: [[1080, HY, 'H']]
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
  function spdMul(core, stage) {
    return (core ? 1.26 : 1) * (1 + Math.max(0, stage - 1) * 0.08);
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
  function norm8(dx, dy) {
    if (!dx && !dy) return { dx: 1, dy: 0 };
    const len = Math.sqrt(dx * dx + dy * dy);
    return { dx: dx / len, dy: dy / len };
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    if (DY <= GY || DY - GY > 90) throw new Error('dungeon floor');
    if (jumpHeight() <= DY - GY) throw new Error('can climb out of dungeon');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('core faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (NADE_CORE >= NADE_STAGE) throw new Error('core fewer nades');
    if (!WEAPONS.H || WEAPONS.H.cd >= WEAPONS.pistol.cd) throw new Error('heavy gun');
    if (!WEAPONS.S || WEAPONS.S.dmg < 2) throw new Error('shotgun');
    if (!WEAPONS.slug) throw new Error('slug gun');
    if (BEST_KEY !== 'playbox-metalslug3-best') throw new Error('best key');
    if (STAGES[0].name !== '沙墓' || STAGES[1].name !== '沼岸' || STAGES[2].name !== '雪谷') {
      throw new Error('stage names');
    }
    if (!STAGES[0].forkX || !STAGES[1].forkX) throw new Error('routes');
    if (!STAGES[0].lows || !STAGES[0].lows.length) throw new Error('tomb route');
    if (!STAGES[1].water || !STAGES[1].water.length) throw new Error('swim route');
    if (STAGES[2].theme !== 'snow' || STAGES[2].hp < 40) throw new Error('tank boss');
    if (!STAGES[0].rides.length || STAGES[0].rides[0][2] !== 'slug') throw new Error('slug');
    let i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length || !s.ents.length) throw new Error('stage ' + s.name);
      if (!s.rides.length) throw new Error('ride ' + s.name);
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
  const btnStage = document.getElementById('btn-stage');
  const btnCore = document.getElementById('btn-core');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeStage = document.getElementById('mode-stage');
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
  const routeLabel = document.getElementById('route-label');
  const nadeLabel = document.getElementById('nade-label');
  const gunLabel = document.getElementById('gun-label');
  const rideLabel = document.getElementById('ride-label');
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

  const keys = { l: false, r: false, u: false, d: false, fire: false, nade: false };
  const demo = { l: false, r: true, u: false, fire: true, nade: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const mist = [];

  const G = {
    mode: 'title',
    kind: 'stage',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 2580,
    plats: [],
    ents: [],
    shots: [],
    nades: [],
    pickups: [],
    rides: [],
    waters: [],
    player: null,
    boss: null,
    lives: LIVES,
    nadeAmmo: NADE_STAGE,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    weapon: 'pistol',
    ride: '',
    route: '',
    fireCd: 0,
    nadeCd: 0,
    checkX: 70,
    checkY: GY,
    jumpBuf: 0,
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
    muzzle: 0,
    wet: false
  };

  function isCore() {
    return G.kind === 'core';
  }
  function playing() {
    return G.mode === 'play';
  }
  function live() {
    return G.mode === 'play' || G.mode === 'title';
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
  function fireHeld() {
    return G.mode === 'title' ? demo.fire : keys.fire;
  }
  function nadeHeld() {
    return G.mode === 'title' ? demo.nade : keys.nade;
  }
  function nadeStart() {
    return isCore() ? NADE_CORE : NADE_STAGE;
  }
  function riding() {
    return G.ride === 'slug';
  }

  function sx(x) {
    return ox + (x - G.camX) * scale;
  }
  function sy(y) {
    return oy + (y - G.camY) * scale;
  }

  function specNow() {
    return STAGES[G.stage - 1] || STAGES[0];
  }

  function inWaterAt(x, y) {
    for (let i = 0; i < G.waters.length; i++) {
      const w = G.waters[i];
      if (x >= w.x && x <= w.x + w.w && y > WATER_Y - 6) return true;
    }
    return false;
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
    splash() {
      this.ensure();
      this.noise(0.08, 0.04, 280);
      this.beep(220, 0.09, 'sine', 0.03, 90);
    },
    shot(kind) {
      this.ensure();
      if (kind === 'H') {
        this.beep(980, 0.03, 'square', 0.036, 420);
        this.noise(0.018, 0.02, 1600);
      } else if (kind === 'S') {
        this.noise(0.08, 0.055, 320);
        this.beep(180, 0.1, 'sawtooth', 0.045, 70);
      } else if (kind === 'slug') {
        this.beep(160, 0.11, 'square', 0.05, 70);
        this.noise(0.07, 0.04, 220);
      } else if (kind === 'nade') {
        this.beep(240, 0.08, 'square', 0.04, 90);
        this.noise(0.05, 0.03, 400);
      } else {
        this.beep(880, 0.045, 'square', 0.04, 360);
        this.noise(0.02, 0.02, 1800);
      }
    },
    ping() {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.05, 990);
      this.beep(990, 0.1, 'triangle', 0.042, 1320);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.04, 0.036, 1100);
      this.beep(520 * lift, 0.07, 'square', 0.044, 880 * lift);
    },
    boom() {
      this.ensure();
      this.noise(0.14, 0.07, 240);
      this.beep(180, 0.16, 'sawtooth', 0.05, 55);
    },
    crash() {
      this.ensure();
      this.noise(0.2, 0.085, 160);
      this.beep(110, 0.26, 'sawtooth', 0.065, 40);
      this.beep(70, 0.32, 'sine', 0.05, 32);
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
    mount() {
      this.ensure();
      this.beep(196, 0.08, 'square', 0.04, 392);
      this.beep(392, 0.12, 'triangle', 0.04, 784);
      this.noise(0.06, 0.03, 200);
    },
    route() {
      this.ensure();
      this.beep(330, 0.08, 'square', 0.04, 520);
      this.beep(520, 0.12, 'triangle', 0.035, 780);
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
    if (modeStage) modeStage.setAttribute('aria-pressed', c ? 'false' : 'true');
    if (modeCore) modeCore.setAttribute('aria-pressed', c ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = specNow();
    if (stageLabel) {
      stageLabel.textContent = (isCore() ? '弹核 ' : '') + spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '弹核' : '金弹3';
      tagLabel.classList.toggle('warn', isCore());
      tagLabel.classList.toggle('hot', !isCore() && G.stage >= 3);
    }
    if (routeLabel) {
      const rn = G.route === 'low' ? spec.lowName : G.route === 'high' ? spec.highName : '';
      routeLabel.hidden = !rn;
      routeLabel.textContent = rn;
      routeLabel.classList.toggle('low', G.route === 'low');
    }
    if (nadeLabel) {
      nadeLabel.textContent = '雷 ' + G.nadeAmmo;
      nadeLabel.classList.toggle('low', G.nadeAmmo <= 2);
    }
    const gun = riding() ? 'slug' : G.weapon;
    if (gunLabel) {
      gunLabel.textContent = GUN_NAME[gun] || '手枪';
      gunLabel.className = 'gun' + (gun === 'H' ? ' heavy' : gun === 'S' ? ' shot' : gun === 'slug' ? ' hot' : '');
    }
    if (rideLabel) {
      rideLabel.hidden = !riding();
      rideLabel.textContent = '铁蛞';
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞上即死，载具撞毁丢命', 'warn');
    else if (G.mode === 'win') setHint('木星坦拆了 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · Shift/Z 丢雷', 'warn');
    else if (G.ride === 'slug') setHint('铁蛞 · 跳更沉 · 炮管双伤 · 撞毁丢命', 'hot');
    else if (G.wet) setHint('潜道 · ↑↓ 游 · 空格开火', 'hot');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · ' + spec.boss, 'hot');
    else setHint('走跳开火 · Shift/Z 手雷 · 分路 · 走过上车', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'MSL3';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.innerHTML = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '弹核' : '换模式';
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
      squash: 1, run: 0, pose: 0
    };
  }

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }

  function hpOf(kind) {
    if (kind === 'turret') return 4;
    if (kind === 'mortar') return 3;
    if (kind === 'truck') return 4;
    if (kind === 'crate') return 2;
    if (kind === 'copter') return 1;
    if (kind === 'mummy') return 2;
    if (kind === 'crab') return 2;
    if (kind === 'yeti') return 3;
    return 1;
  }

  function makeEnt(x, y, kind, a, b, extra) {
    const hp = hpOf(kind);
    const w = kind === 'truck' ? 28 : kind === 'turret' || kind === 'mortar' ? 18
      : kind === 'crate' ? 16 : kind === 'yeti' ? 18 : kind === 'crab' ? 16 : 14;
    const h = kind === 'truck' ? 18 : kind === 'turret' || kind === 'mortar' ? 18
      : kind === 'copter' ? 12 : kind === 'crate' ? 16 : kind === 'crab' ? 12
        : kind === 'yeti' ? 28 : 24;
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b,
      t: rand(0, 1), fire: rand(0.3, 1.1),
      grounded: kind !== 'copter',
      dead: false, hitN: 0, w: w, h: h,
      drop: extra || (kind === 'crate' ? 'nade' : null)
    };
  }

  function makeBoss(spec) {
    const hp = spec.hp > 0 ? ((spec.hp * (isCore() ? 1.24 : 1)) | 0) : 0;
    return {
      id: uid++,
      x: spec.w - 160, y: GY, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: spec.boss,
      t: 0, fire: 1.2, state: 'wait',
      grounded: true, dead: false, active: false,
      hitN: 0, w: 72, h: 56, name: spec.boss
    };
  }

  function loadStage(n, attract) {
    const spec = STAGES[clamp(n, 1, STAGES.length) - 1];
    G.stage = n;
    G.levelW = isCore() ? (spec.w * 0.92) | 0 : spec.w;
    G.plats = [];
    let i, g, p;
    const stretch = G.levelW / spec.w;
    for (i = 0; i < spec.ground.length; i++) {
      g = spec.ground[i];
      G.plats.push(makePlat(g[0] * stretch, GY, g[1] * stretch, true));
    }
    if (spec.lows) {
      for (i = 0; i < spec.lows.length; i++) {
        g = spec.lows[i];
        G.plats.push(makePlat(g[0] * stretch, DY, g[1] * stretch, true));
      }
    }
    for (i = 0; i < spec.plats.length; i++) {
      p = spec.plats[i];
      G.plats.push(makePlat(p[0] * stretch, p[1], p[2] * (isCore() ? 0.94 : 1), false));
    }
    if (isCore()) {
      for (i = 0; i < spec.plats.length; i++) {
        if (i % 2) continue;
        p = spec.plats[i];
        const yy = p[1] === HY ? MY : HY;
        G.plats.push(makePlat(p[0] * stretch + 70, yy, 88, false));
      }
    }
    G.waters = [];
    if (spec.water) {
      for (i = 0; i < spec.water.length; i++) {
        const wt = spec.water[i];
        G.waters.push({ x: wt[0] * stretch, w: wt[1] * stretch });
      }
    }
    G.ents = [];
    for (i = 0; i < spec.ents.length; i++) {
      const e = spec.ents[i];
      G.ents.push(makeEnt(e[0] * stretch, e[1], e[2], e[3] * stretch, e[4] * stretch));
    }
    if (isCore() && !attract) {
      for (i = 0; i < spec.ents.length; i++) {
        if (i % 3 !== 0) continue;
        const e = spec.ents[i];
        if (e[2] === 'turret' || e[2] === 'mortar' || e[2] === 'copter' || e[2] === 'truck') continue;
        G.ents.push(makeEnt(e[0] * stretch + 42, e[1], e[2], e[3] * stretch, e[4] * stretch));
      }
    }
    if (spec.crates) {
      for (i = 0; i < spec.crates.length; i++) {
        const c = spec.crates[i];
        G.ents.push(makeEnt(c[0] * stretch, c[1], 'crate', 0, 0, c[2]));
      }
    }
    G.rides = [];
    for (i = 0; i < spec.rides.length; i++) {
      const sl = spec.rides[i];
      G.rides.push({ x: sl[0] * stretch, y: sl[1], kind: sl[2], taken: false, t: 0 });
    }
    G.pickups = [];
    if (!attract) {
      for (i = 0; i < spec.drops.length; i++) {
        const d = spec.drops[i];
        G.pickups.push({ x: d[0] * stretch, y: d[1] - 20, kind: d[2], taken: false, t: 0 });
      }
    }
    G.shots = [];
    G.nades = [];
    G.boss = makeBoss({
      name: spec.boss, boss: spec.boss, w: G.levelW, hp: spec.hp
    });
    G.checkX = 70;
    G.checkY = GY;
    G.player = makePlayer(70, GY);
    G.ride = '';
    G.route = '';
    G.wet = false;
    G.camX = 0;
    G.camY = 0;
    G.fireCd = 0;
    G.nadeCd = 0;
    G.deadT = 0;
    G.invuln = attract ? 99 : 0.45;
    G.clearT = 0;
    G.lock = 0;
    G.dropPlat = null;
    G.jumpBuf = 0;
    G.muzzle = 0;
    if (!attract) {
      particles.length = 0;
      sparks.length = 0;
      rings.length = 0;
      floats.length = 0;
    }
    syncHud();
  }

  function platUnder(x, fy, ignore) {
    let best = null;
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      if (p === ignore) continue;
      if (x < p.x + 3 || x > p.x + p.w - 3) continue;
      if (fy >= p.y - 3 && fy <= p.y + 8) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function landOn(x, y0, y1, ignore) {
    let best = null;
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      if (p === ignore) continue;
      if (x < p.x + 4 || x > p.x + p.w - 4) continue;
      if (y0 <= p.y + 2 && y1 >= p.y) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function standAt(x, y) {
    return !!platUnder(x, y, null);
  }

  function pitAhead(x, y, face) {
    return standAt(x, y) && !standAt(x + face * 36, y);
  }

  function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function pBox() {
    const p = G.player;
    if (G.ride === 'slug') {
      return { x: p.x - 22, y: p.y - 26, w: 44, h: 26 };
    }
    const h = p.duck ? 14 : p.h;
    return { x: p.x - p.w * 0.42, y: p.y - h, w: p.w * 0.84, h: h * 0.92 };
  }

  function getAim(p) {
    let dx = 0;
    let dy = 0;
    if (inL()) dx -= 1;
    if (inR()) dx += 1;
    if (G.wet && !riding()) {
      if (!dx) dx = p.face;
      if (inU()) dy -= 0.35;
      if (inD()) dy += 0.25;
      return norm8(dx, dy);
    }
    if (p.grounded) {
      if (p.duck && !riding()) {
        dy = 0;
        if (!dx) dx = p.face;
      } else if (inU() && !riding()) {
        dy = -1;
      }
    } else if (!riding()) {
      if (inU()) dy -= 1;
      if (inD()) dy += 1;
    }
    if (!dx && !dy) dx = p.face;
    return norm8(dx, dy);
  }

  function countShots(from) {
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) {
      if (G.shots[i].from === from && G.shots[i].life > 0) n += 1;
    }
    return n;
  }

  function spawnShot(s) {
    s.id = uid++;
    s.hit = s.hit || [];
    G.shots.push(s);
    if (G.shots.length > 96) {
      for (let i = 0; i < G.shots.length && G.shots.length > 80; i++) {
        if (G.shots[i].from === 'e') {
          G.shots.splice(i, 1);
          i -= 1;
        }
      }
    }
    capArr(G.shots, 96);
  }

  function fireOne(kind, x, y, dx, dy, extra) {
    const wpn = WEAPONS[kind] || WEAPONS.pistol;
    const n = norm8(dx, dy);
    const s = {
      x: x, y: y,
      vx: n.dx * wpn.spd,
      vy: n.dy * wpn.spd,
      from: 'p',
      kind: kind,
      dmg: wpn.dmg,
      pierce: wpn.pierce,
      life: wpn.life,
      rgb: wpn.rgb,
      hit: [],
      grav: wpn.grav || 0,
      bounces: 0
    };
    if (extra) {
      for (const k in extra) s[k] = extra[k];
    }
    spawnShot(s);
    return s;
  }

  function tryShoot() {
    if (G.deadT > 0 || G.lock > 0) return;
    if (!(playing() || G.mode === 'title')) return;
    if (G.fireCd > 0) return;
    const kind = riding() ? 'slug' : G.weapon;
    const wpn = WEAPONS[kind] || WEAPONS.pistol;
    if (countShots('p') >= wpn.max) return;
    const p = G.player;
    const aim = getAim(p);
    const ox0 = p.x + aim.dx * (G.ride === 'slug' ? 24 : 16);
    const oy0 = p.y - (G.ride === 'slug' ? 14 : (p.duck ? 11 : 18)) + aim.dy * 6;
    if (kind === 'S') {
      fireOne('S', ox0, oy0, aim.dx, aim.dy);
      fireOne('S', ox0, oy0, aim.dx - 0.22, aim.dy - 0.28);
      fireOne('S', ox0, oy0, aim.dx + 0.18, aim.dy + 0.24);
    } else if (kind === 'slug') {
      fireOne('slug', ox0, oy0, aim.dx, aim.dy);
      fireOne('slug', ox0, oy0 - 5, aim.dx, aim.dy - 0.12);
    } else {
      fireOne(kind, ox0, oy0, aim.dx, aim.dy);
    }
    G.fireCd = wpn.cd;
    G.muzzle = 0.05;
    p.pose = 0.1;
    if (playing()) audio.shot(kind);
    emit(kind === 'S' ? 8 : kind === 'slug' ? 7 : 4, {
      x: ox0, y: oy0, j: 4,
      vx0: aim.dx * 40, vx1: aim.dx * 180,
      vy0: aim.dy * 80 - 40, vy1: aim.dy * 80 + 40,
      life: kind === 'S' ? 0.2 : 0.16, r0: 1, r1: kind === 'slug' ? 3.2 : 2.2,
      rgb: wpn.rgb, g: 80
    });
  }

  function throwNade() {
    if (G.deadT > 0 || G.lock > 0) return;
    if (!playing() && G.mode !== 'title') return;
    if (G.nadeCd > 0) return;
    if (G.nadeAmmo <= 0 && playing()) {
      toast('没雷了', true, false);
      G.nadeCd = 0.35;
      return;
    }
    const p = G.player;
    const face = p.face;
    const wet = G.wet;
    G.nades.push({
      x: p.x + face * 10,
      y: p.y - (G.ride === 'slug' ? 16 : (p.duck ? 12 : 18)),
      vx: wet ? face * 90 : face * (G.ride === 'slug' ? 210 : 190),
      vy: wet ? -40 : (G.ride === 'slug' ? -220 : -280),
      life: 0.62,
      from: 'p',
      rgb: GOLD
    });
    if (playing()) {
      G.nadeAmmo = Math.max(0, G.nadeAmmo - 1);
      audio.shot('nade');
      syncHud();
    }
    G.nadeCd = 0.42;
    emit(4, {
      x: p.x + face * 10, y: p.y - 16, j: 3,
      vx0: face * 20, vx1: face * 80, vy0: -60, vy1: -10,
      life: 0.16, r0: 1, r1: 2, rgb: GOLD, g: 120
    });
  }

  function enemyShoot(e, dx, dy, spd, kind) {
    const n = norm8(dx, dy);
    spawnShot({
      x: e.x + n.dx * 10,
      y: e.y - e.h * 0.55 + n.dy * 6,
      vx: n.dx * spd,
      vy: n.dy * spd,
      from: 'e',
      kind: kind || 'e',
      dmg: 1,
      pierce: 0,
      life: 1.35,
      rgb: MAG,
      hit: []
    });
  }

  function giveGun(kind) {
    if (kind === 'H') {
      G.weapon = 'H';
      audio.ping();
      toast('机枪', false, true);
      kick(2.4, 'pickup');
      screenFlash(HOT, 0.28);
    } else if (kind === 'S') {
      G.weapon = 'S';
      audio.ping();
      toast('散弹', false, true);
      kick(2.4, 'pickup');
      screenFlash(CYN, 0.28);
    } else {
      G.nadeAmmo = Math.min(NADE_MAX, G.nadeAmmo + (isCore() ? 3 : 4));
      audio.ping();
      toast('手雷 +', false, true);
    }
    syncHud();
  }

  function spawnPickup(x, y, kind) {
    G.pickups.push({ x: x, y: y, kind: kind, taken: false, t: 0 });
  }

  function takePickup(u) {
    if (u.taken) return;
    u.taken = true;
    giveGun(u.kind);
    juice(u.x, u.y, GOLD, 0.9);
    const name = u.kind === 'H' ? '机枪' : u.kind === 'S' ? '散弹' : '手雷';
    floatText(u.x, u.y - 18, name, GOLD, true);
  }

  function boomAt(x, y, power, rgb) {
    const p = power || 1;
    emit(12 + (p * 14) | 0, {
      x: x, y: y, j: 8 + p * 8,
      vx0: -260 * p, vx1: 260 * p, vy0: -340 * p, vy1: 40 * p,
      life: 0.34 + p * 0.16, r0: 1.4, r1: 3.4 + p, rgb: rgb || ORG
    });
    popSpark(x, y, rgb || HOT, 14 + p * 12);
    screenFlash(rgb || HOT, 0.16 + p * 0.12);
    kick(2.8 + p * 3.2, p >= 1.4 ? 'boom' : 'hit');
    if (playing()) audio.boom();
    hitStop(0.045 + p * 0.025);
  }

  function explode(x, y, r, dmg, from) {
    boomAt(x, y, 1.15, from === 'p' ? GOLD : ORG);
    let i, e;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (hypot(e.x - x, (e.y - e.h * 0.5) - y) < r) hurtEnt(e, dmg);
    }
    if (G.boss && !G.boss.dead && G.boss.active && G.boss.max > 0) {
      e = G.boss;
      if (hypot(e.x - x, (e.y - e.h * 0.5) - y) < r + 14) {
        e.hp -= dmg;
        e.hitN = 0.08;
        if (e.hp <= 0) killBoss();
      }
    }
    if (from !== 'p' && playing() && G.deadT <= 0 && G.invuln <= 0) {
      const pb = pBox();
      const cx = pb.x + pb.w * 0.5;
      const cy = pb.y + pb.h * 0.5;
      if (hypot(cx - x, cy - y) < r * 0.85) die(riding() ? 'crash' : 'shot');
    }
  }

  function killEnt(e) {
    if (e.dead) return;
    e.dead = true;
    bumpCombo();
    const base = SCORE[e.kind] || SCORE.grunt;
    const sc = base * G.mult;
    addScore(sc);
    floatText(e.x, e.y - 22, '+' + sc, e.kind === 'crate' ? GOLD : HOT2, e.kind === 'crate');
    juice(e.x, e.y - 10, e.kind === 'turret' || e.kind === 'truck' ? ORG : HOT, e.kind === 'truck' ? 1.3 : 0.85);
    audio.hit(G.combo);
    hitStop(e.kind === 'turret' || e.kind === 'truck' ? 0.055 : 0.038);
    if (e.kind === 'turret' || e.kind === 'truck' || e.kind === 'mortar') boomAt(e.x, e.y - 8, 1.1, ORG);
    if (e.kind === 'crate') spawnPickup(e.x, e.y - 18, e.drop || 'nade');
  }

  function hurtEnt(e, dmg) {
    if (!e || e.dead) return false;
    if (e.hitN > 0 && e.kind !== 'turret' && e.kind !== 'mortar' && e.kind !== 'crate' && e.kind !== 'truck' && e.kind !== 'yeti') return false;
    e.hp -= dmg;
    e.hitN = 0.06;
    emit(4, {
      x: e.x, y: e.y - 12, j: 5,
      vx0: -80, vx1: 80, vy0: -160, vy1: -20,
      life: 0.16, r0: 1, r1: 2, rgb: WHT, g: 200
    });
    if (e.hp <= 0) {
      killEnt(e);
      return true;
    }
    return false;
  }

  function killBoss() {
    const e = G.boss;
    if (!e || e.dead) return;
    e.dead = true;
    e.active = false;
    bumpCombo();
    const sc = SCORE.boss * G.mult;
    addScore(sc);
    addScore(SCORE.stage * G.stage);
    floatText(e.x, e.y - 40, '+' + sc, GOLD, true);
    boomAt(e.x, e.y - 20, 1.9, GOLD);
    juice(e.x, e.y - 16, HOT, 1.7);
    hitStop(0.08);
    toast(e.name + ' 击破', false, true);
    G.lock = 0.2;
    G.clearT = 2.05;
  }

  function mountRide(sl) {
    if (riding() || sl.taken || G.deadT > 0) return;
    sl.taken = true;
    G.ride = sl.kind;
    G.player.duck = false;
    G.player.h = PH;
    audio.mount();
    toast('铁蛞 · 炮管双伤', false, true);
    kick(2.6, 'pickup');
    screenFlash(HOT, 0.28);
    juice(sl.x, sl.y - 10, HOT, 1.0);
    floatText(sl.x, sl.y - 24, 'SLUG', GOLD, true);
    syncHud();
  }

  function markRoute() {
    const spec = specNow();
    if (!spec.forkX || G.route || G.mode !== 'play') return;
    const p = G.player;
    const fx = spec.forkX * (G.levelW / spec.w);
    if (p.x < fx) return;
    G.route = p.y > GY + 18 ? 'low' : 'high';
    const name = G.route === 'low' ? spec.lowName : spec.highName;
    if (name) {
      toast(name, false, true);
      audio.route();
      floatText(p.x, p.y - 36, name, G.route === 'low' ? MAG : CYN, true);
      syncHud();
    }
  }

  function die(why) {
    if (!playing() || G.deadT > 0) return;
    const wasRide = riding();
    G.why = why || 'hit';
    if (wasRide && why !== 'fall') G.why = 'crash';
    G.deadT = DIE_T;
    G.lives -= 1;
    G.weapon = 'pistol';
    G.ride = '';
    G.combo = 0;
    G.mult = 1;
    G.player.vy = -180;
    boomAt(G.player.x, G.player.y - 16, wasRide ? 1.8 : 1.35, wasRide ? ORG : MAG);
    if (wasRide) audio.crash();
    else audio.death();
    hitStop(wasRide ? 0.078 : 0.072);
    kick(7, 'die');
    screenFlash(wasRide ? ORG : MAG, 0.45);
    if (wasRide) floatText(G.player.x, G.player.y - 30, '撞毁', ORG, true);
    syncHud();
  }

  function respawn() {
    G.player = makePlayer(G.checkX, G.checkY);
    G.weapon = 'pistol';
    G.ride = '';
    G.invuln = INVULN;
    G.deadT = 0;
    G.fireCd = 0.1;
    G.wet = inWaterAt(G.checkX, G.checkY);
    toast('重生', true, false);
    syncHud();
  }

  function loseWhy() {
    if (G.why === 'fall') return '坠入坑里了';
    if (G.why === 'touch') return '撞上了';
    if (G.why === 'crash') return '载具撞毁了';
    if (G.why === 'shot') return '中弹了';
    return '被击中了';
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '被击中了', loseWhy() + '。连击 ×' + G.maxCombo + ' · ' + G.score + ' 分');
    syncHud();
  }

  function goWin() {
    const bonus = isCore() ? 6000 : 8000;
    addScore(bonus);
    G.mode = 'win';
    audio.win();
    kick(4, 'win-flash');
    screenFlash(GOLD, 0.4);
    showOverlay('win', isCore() ? '弹核清场' : '木星坦拆了',
      (isCore() ? '弹核打穿三关。' : '金弹3打穿木星坦。') + G.score + ' 分 · 连击 ×' + G.maxCombo);
    syncHud();
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    const keepW = G.weapon;
    const keepN = G.nadeAmmo;
    loadStage(G.stage + 1, false);
    G.weapon = keepW;
    G.nadeAmmo = keepN;
    G.ride = '';
    G.invuln = 1.1;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    syncHud();
  }

  function startGame(kind) {
    G.mode = 'play';
    G.kind = kind === 'core' ? 'core' : 'stage';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.weapon = 'pistol';
    G.nadeAmmo = nadeStart();
    G.ride = '';
    G.route = '';
    G.nextLife = LIFE_EVERY;
    G.why = '';
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isCore() ? '弹核' : STAGES[0].name, false, !isCore());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'stage';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    G.weapon = 'pistol';
    G.nadeAmmo = NADE_STAGE;
    G.ride = '';
    G.route = '';
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '金弹3', '侧向跑跳开火。沙墓分沙道 / 陵道，沼岸分沼岸 / 潜道。<br />开铁蛞、丢雷，打到木星坦。撞上即死。载具撞毁丢一条命。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('stage');
    else startGame(G.kind || 'stage');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('stage');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.fire = true;
    demo.nade = ((G.clock * 2) | 0) % 7 === 0 && G.nadeCd <= 0;
    demo.u = pitAhead(p.x, p.y, 1) && p.grounded;
    if (p.x > G.levelW - 280 || p.y > GY + 40) {
      G.player = makePlayer(70, GY);
      G.camX = 0;
      G.camY = 0;
      G.ride = '';
      G.weapon = 'pistol';
      G.route = '';
      G.wet = false;
    }
  }

  function updatePlayer(dt) {
    const p = G.player;
    if (G.deadT > 0) {
      G.deadT -= dt;
      p.vy += GRAV * dt;
      p.y += p.vy * dt * 0.4;
      p.squash = 1.15;
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

    const wet = inWaterAt(p.x, p.y - 8);
    if (wet !== G.wet) {
      G.wet = wet;
      if (wet && playing()) {
        audio.splash();
        emit(10, {
          x: p.x, y: WATER_Y, j: 10,
          vx0: -80, vx1: 80, vy0: -120, vy1: -10,
          life: 0.28, r0: 1.4, r1: 3.2, rgb: CYN, g: 80
        });
        kick(1.8, 'thump');
      }
      syncHud();
    }

    p.duck = !!(p.grounded && inD() && !inU() && !riding() && !wet);
    p.h = p.duck ? 14 : PH;
    const walk = G.ride === 'slug' ? 168 : (wet ? 138 : WALK);
    const spd = walk * (p.grounded ? (p.duck ? 0.55 : 1) : (wet ? 1 : AIR));
    p.vx = (p.duck ? 0 : ax * spd);
    if (!p.duck) p.x += p.vx * dt;
    p.x = clamp(p.x, 18, G.levelW - 18);
    if (G.boss && G.boss.active && !G.boss.dead && G.boss.max > 0) {
      const minX = G.levelW - VW + 18;
      if (p.x < minX) p.x = minX;
    }

    if (wet) {
      if (inU()) G.jumpBuf = BUFFER;
      else G.jumpBuf -= dt;
      if (G.jumpBuf < 0) G.jumpBuf = 0;
      let ay = 0;
      if (inU()) ay -= 1;
      if (inD()) ay += 1;
      const sink = G.ride === 'slug' ? 0.55 : 0.18;
      p.vy += GRAV * sink * dt;
      p.vy += ay * (G.ride === 'slug' ? 280 : 520) * dt;
      p.vy = clamp(p.vy, G.ride === 'slug' ? -140 : -210, G.ride === 'slug' ? 240 : 170);
      const y0 = p.y;
      let y1 = p.y + p.vy * dt;
      p.grounded = false;
      const plat = landOn(p.x, y0, y1, G.dropPlat);
      if (plat && p.vy >= -20) {
        y1 = plat.y;
        p.vy = 0;
        p.grounded = true;
        p.coyote = COYOTE;
      }
      if (y1 < WATER_Y - 10 && ay < 0) {
        p.vy = G.ride === 'slug' ? -JUMP_V * 0.62 : -JUMP_V * 0.88;
      }
      p.y = y1;
      if (p.grounded) p.coyote = COYOTE;
      else p.coyote -= dt;
      p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
      p.run += dt * 8;
      if (p.pose > 0) p.pose -= dt;
    } else {
      if (inU() && !p.duck) G.jumpBuf = BUFFER;
      else G.jumpBuf -= dt;
      if (G.jumpBuf < 0) G.jumpBuf = 0;

      const canJump = (p.grounded || p.coyote > 0) && !p.duck;
      if (G.jumpBuf > 0 && canJump) {
        p.vy = G.ride === 'slug' ? -JUMP_V * 0.82 : -JUMP_V;
        p.grounded = false;
        p.coyote = 0;
        G.jumpBuf = 0;
        p.squash = 0.78;
        if (playing()) audio.hop();
        emit(5, {
          x: p.x, y: p.y, j: 8,
          vx0: -60, vx1: 60, vy0: -20, vy1: 40,
          life: 0.22, r0: 1, r1: 2.2, rgb: WHT, g: 200
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
      p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
      if (ax && p.grounded && !p.duck) p.run += dt * (G.ride === 'slug' ? 8 : 10);
      else p.run += dt * 2;
      if (p.pose > 0) p.pose -= dt;
    }

    if (p.y > DY + 90) die('fall');

    if (p.grounded && p.x > G.checkX + 80) {
      const ck = platUnder(p.x, p.y, null);
      if (ck && ck.base && p.x > ck.x + 36 && p.x < ck.x + ck.w - 36) {
        G.checkX = p.x;
        G.checkY = p.y;
      }
    }

    markRoute();

    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.nadeCd > 0) G.nadeCd -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;

    if (fireHeld()) tryShoot();
    if (nadeHeld() && G.nadeCd <= 0) throwNade();

    let i;
    for (i = 0; i < G.pickups.length; i++) {
      const u = G.pickups[i];
      if (u.taken) continue;
      u.t += dt;
      if (hypot(p.x - u.x, (p.y - 14) - u.y) < 22) takePickup(u);
    }
    if (!riding()) {
      for (i = 0; i < G.rides.length; i++) {
        const sl = G.rides[i];
        if (sl.taken) continue;
        sl.t += dt;
        if (hypot(p.x - sl.x, p.y - sl.y) < 26) mountRide(sl);
      }
    }

    if (G.invuln > 0) return;

    const pb = pBox();
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (e.kind === 'copter' || e.kind === 'crate') continue;
      if (overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.45, e.y - e.h, e.w * 0.9, e.h * 0.92)) {
        die(e.kind === 'truck' || riding() ? 'crash' : 'touch');
        return;
      }
    }
    if (G.boss && !G.boss.dead && G.boss.active && G.boss.max > 0) {
      const b = G.boss;
      if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.45, b.y - b.h, b.w * 0.9, b.h * 0.9)) {
        die(riding() ? 'crash' : 'touch');
      }
    }
  }

  function onScreen(x, y, pad) {
    const m = pad || 40;
    return x > G.camX - m && x < G.camX + VW + m && y > G.camY - m && y < G.camY + VH + m;
  }

  function aimAtPlayer(e) {
    const p = G.player;
    return { dx: p.x - e.x, dy: (p.y - 16) - (e.y - e.h * 0.5) };
  }

  function walkEnt(e, dt, mul, baseWalk, chase) {
    const p = G.player;
    const walk = baseWalk * mul;
    if (chase && Math.abs(p.x - e.x) < 240 && playing()) {
      e.face = p.x < e.x ? -1 : 1;
    } else {
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
    }
    const step = walk * dt;
    if (!standAt(e.x + e.face * 14, e.y) && standAt(e.x, e.y)) e.face *= -1;
    else e.x += e.face * step;
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    if (e.hitN > 0) e.hitN -= dt;
    e.t += dt;
    const mul = spdMul(isCore(), G.stage);
    const p = G.player;
    if (!onScreen(e.x, e.y, 80) && e.kind !== 'copter') return;

    if (e.kind === 'crate') return;

    if (e.kind === 'copter') {
      e.x += (e.face || -1) * 52 * mul * dt;
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
      e.y = HY - 28 + Math.sin(e.t * 2.4) * 16;
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0) {
        e.fire = (isCore() ? 1.05 : 1.45) / mul;
        enemyShoot(e, 0, 1, 220, 'e');
      }
      return;
    }

    if (e.kind === 'turret' || e.kind === 'mortar') {
      e.face = p.x < e.x ? -1 : 1;
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0 && Math.abs(p.x - e.x) < 360) {
        const aim = aimAtPlayer(e);
        if (e.kind === 'turret') {
          e.fire = (isCore() ? 0.78 : 1.05) / mul;
          enemyShoot(e, aim.dx, aim.dy, 250, 'e');
        } else {
          e.fire = (isCore() ? 1.25 : 1.7) / mul;
          spawnShot({
            x: e.x, y: e.y - 16,
            vx: e.face * 150,
            vy: -260,
            from: 'e', kind: 'bomb', dmg: 1, pierce: 0,
            life: 1.6, rgb: ORG, hit: [], grav: 520
          });
        }
      }
      return;
    }

    if (e.kind === 'frog') {
      if (e.grounded && e.fire <= 0) {
        e.vy = -420;
        e.grounded = false;
        e.fire = (isCore() ? 1.1 : 1.5) / mul;
      }
      e.fire -= dt;
      e.vy += GRAV * dt;
      const y0 = e.y;
      const y1 = e.y + e.vy * dt;
      const plat = e.vy >= 0 ? landOn(e.x, y0, y1, null) : null;
      if (plat) {
        e.y = plat.y;
        e.vy = 0;
        e.grounded = true;
      } else {
        e.y = y1;
        e.grounded = false;
      }
      e.face = p.x < e.x ? -1 : 1;
      if (!standAt(e.x + e.face * 10, e.y) && standAt(e.x, e.y) && e.grounded) e.face *= -1;
      else if (e.grounded) e.x += e.face * 36 * mul * dt;
      return;
    }

    if (e.kind === 'mummy') {
      walkEnt(e, dt, mul, 32, false);
      e.fire -= dt;
      if (playing() && G.deadT <= 0 && e.fire <= 0 && Math.abs(p.x - e.x) < 300) {
        e.fire = (isCore() ? 1.2 : 1.7) / mul;
        e.face = p.x < e.x ? -1 : 1;
        spawnShot({
          x: e.x, y: e.y - 16,
          vx: e.face * 130,
          vy: -220,
          from: 'e', kind: 'bomb', dmg: 1, pierce: 0,
          life: 1.5, rgb: WRAP, hit: [], grav: 480
        });
      }
      return;
    }

    if (e.kind === 'zombie') {
      walkEnt(e, dt, mul, Math.abs(p.x - e.x) < 180 ? 86 : 44, true);
      return;
    }

    if (e.kind === 'crab') {
      walkEnt(e, dt, mul, 70, true);
      e.fire -= dt;
      if (playing() && G.deadT <= 0 && e.fire <= 0 && Math.abs(p.x - e.x) < 220) {
        e.fire = (isCore() ? 1.15 : 1.6) / mul;
        enemyShoot(e, e.face, -0.2, 200, 'e');
      }
      return;
    }

    if (e.kind === 'yeti') {
      walkEnt(e, dt, mul, Math.abs(p.x - e.x) < 200 ? 96 : 54, true);
      e.fire -= dt;
      if (playing() && G.deadT <= 0 && e.fire <= 0 && Math.abs(p.x - e.x) < 260) {
        e.fire = (isCore() ? 1.3 : 1.8) / mul;
        spawnShot({
          x: e.x, y: e.y - 18,
          vx: e.face * 160,
          vy: -40,
          from: 'e', kind: 'bomb', dmg: 1, pierce: 0,
          life: 1.2, rgb: ICE, hit: []
        });
      }
      return;
    }

    const walk = (e.kind === 'slash' ? 102 : e.kind === 'truck' ? 78 : 48) * mul;
    if ((e.kind === 'slash' || e.kind === 'truck') && Math.abs(p.x - e.x) < 240 && playing()) {
      e.face = p.x < e.x ? -1 : 1;
    } else {
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
    }
    const step = walk * (e.kind === 'slash' && Math.abs(p.x - e.x) < 220 ? 1.4 : 1) * dt;
    if (!standAt(e.x + e.face * 14, e.y) && standAt(e.x, e.y)) e.face *= -1;
    else e.x += e.face * step;
    e.fire -= dt;
    if (playing() && G.deadT <= 0 && e.fire <= 0) {
      if (e.kind === 'grunt' && Math.abs(p.x - e.x) < 280 && Math.abs(p.y - e.y) < 50) {
        e.fire = (isCore() ? 1.05 : 1.5) / mul;
        e.face = p.x < e.x ? -1 : 1;
        enemyShoot(e, e.face, 0, 260, 'e');
      } else if (e.kind === 'truck' && Math.abs(p.x - e.x) < 300) {
        e.fire = (isCore() ? 1.2 : 1.7) / mul;
        enemyShoot(e, e.face, -0.15, 240, 'e');
      } else e.fire = 0.35;
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead || b.max <= 0) return;
    if (b.hitN > 0) b.hitN -= dt;
    const p = G.player;
    if (!b.active) {
      if (playing() && p.x > G.levelW - 420) {
        b.active = true;
        audio.boss();
        toast(b.name + ' 现身', false, true);
        screenFlash(HOT, 0.3);
        kick(3.2, 'boom');
      }
      return;
    }
    b.t += dt;
    const mul = spdMul(isCore(), G.stage);
    const low = b.hp / b.max < 0.45;
    b.x = G.levelW - 176 + Math.sin(b.t * 0.5) * 40;
    b.y = GY;
    b.fire -= dt;
    if (b.fire <= 0 && playing() && G.deadT <= 0) {
      b.fire = (low ? 0.38 : 0.64) / mul;
      const high = ((b.t * 2.2) | 0) % 2 === 0;
      spawnShot({
        x: b.x - 32, y: b.y - (high ? 44 : 18),
        vx: -320, vy: high ? -28 : 14,
        from: 'e', kind: 'cannon', dmg: 1, pierce: 0,
        life: 1.5, rgb: ORG, hit: []
      });
      enemyShoot(b, p.x - b.x, (p.y - 16) - (b.y - 24), 240, 'e');
      if (low || isCore()) {
        spawnShot({
          x: b.x - 16, y: b.y - 20,
          vx: -150, vy: -300,
          from: 'e', kind: 'bomb', dmg: 1, pierce: 0,
          life: 1.7, rgb: MAG, hit: [], grav: 520
        });
        if (low) {
          const n = isCore() ? 8 : 6;
          let i;
          for (i = 0; i < n; i++) {
            const a = Math.PI + i * (Math.PI / (n - 1)) * 0.7 - 0.35;
            spawnShot({
              x: b.x - 22, y: b.y - 30,
              vx: Math.cos(a) * 220,
              vy: Math.sin(a) * 220,
              from: 'e', kind: 'e', dmg: 1, pierce: 0,
              life: 1.5, rgb: MAG, hit: []
            });
          }
        }
      }
    }
  }

  function updateNades(dt) {
    let i, n, j, e;
    for (i = G.nades.length - 1; i >= 0; i--) {
      n = G.nades[i];
      n.life -= dt;
      const wet = inWaterAt(n.x, n.y);
      n.vy += (wet ? 220 : 780) * dt;
      n.x += n.vx * dt;
      const y0 = n.y;
      const y1 = n.y + n.vy * dt;
      let boom = n.life <= 0;
      const plat = landOn(n.x, y0, y1, null);
      if (plat) {
        n.y = plat.y - 4;
        boom = true;
      } else n.y = y1;
      if (!boom && n.from === 'p') {
        for (j = 0; j < G.ents.length; j++) {
          e = G.ents[j];
          if (e.dead) continue;
          if (hypot(e.x - n.x, (e.y - e.h * 0.5) - n.y) < 16) {
            boom = true;
            break;
          }
        }
        if (!boom && G.boss && G.boss.active && !G.boss.dead && G.boss.max > 0) {
          if (hypot(G.boss.x - n.x, (G.boss.y - 20) - n.y) < 28) boom = true;
        }
      }
      if (boom) {
        explode(n.x, n.y, n.from === 'p' ? 46 : 38, n.from === 'p' ? 3 : 1, n.from);
        G.nades.splice(i, 1);
      } else if (!onScreen(n.x, n.y, 80)) {
        G.nades.splice(i, 1);
      }
    }
  }

  function shotHits(s, x, y, w, h) {
    const r = s.kind === 'cannon' || s.kind === 'slug' || s.kind === 'S' ? 9 : 5;
    return overlap(s.x - r, s.y - r, r * 2, r * 2, x - w * 0.5, y - h, w, h);
  }

  function updateShots(dt) {
    let i, s, j, e;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      s.life -= dt;
      if (s.grav) s.vy += s.grav * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if ((s.kind === 'H' || s.kind === 'slug') && playing()) {
        emit(1, {
          x: s.x, y: s.y, j: 2,
          vx0: -16, vx1: 16, vy0: -16, vy1: 10,
          life: 0.1, r0: 1.2, r1: s.kind === 'slug' ? 2.8 : 1.8,
          rgb: s.rgb, g: 40
        });
      }
      if (s.life <= 0 || !onScreen(s.x, s.y, 80)) {
        G.shots.splice(i, 1);
        continue;
      }

      if (s.from === 'p') {
        let hit = false;
        for (j = 0; j < G.ents.length; j++) {
          e = G.ents[j];
          if (e.dead) continue;
          if (s.hit.indexOf(e.id) >= 0) continue;
          if (shotHits(s, e.x, e.y, e.w, e.h)) {
            s.hit.push(e.id);
            hurtEnt(e, s.dmg);
            hit = true;
            hitStop(0.032);
            if (!s.pierce) break;
            s.pierce -= 1;
            if (s.pierce < 0) break;
          }
        }
        if (!hit && G.boss && !G.boss.dead && G.boss.active && G.boss.max > 0 && s.hit.indexOf(G.boss.id) < 0) {
          e = G.boss;
          if (shotHits(s, e.x, e.y, e.w + 10, e.h + 6)) {
            s.hit.push(e.id);
            e.hp -= s.dmg;
            e.hitN = 0.07;
            audio.hit(G.combo);
            emit(6, {
              x: s.x, y: s.y, j: 6,
              vx0: -120, vx1: 120, vy0: -180, vy1: -20,
              life: 0.2, r0: 1, r1: 2.6, rgb: GOLD, g: 200
            });
            hitStop(0.04);
            hit = true;
            if (e.hp <= 0) killBoss();
          }
        }
        if (hit && !s.pierce) {
          G.shots.splice(i, 1);
          continue;
        }
      } else if (playing() && G.deadT <= 0 && G.invuln <= 0) {
        const pb = pBox();
        const r = s.kind === 'bomb' || s.kind === 'cannon' ? 8 : 4.5;
        if (overlap(s.x - r, s.y - r, r * 2, r * 2, pb.x, pb.y, pb.w, pb.h)) {
          G.shots.splice(i, 1);
          die(riding() ? 'crash' : 'shot');
        }
      }
    }
  }

  function updateRides(dt) {
    for (let i = 0; i < G.rides.length; i++) G.rides[i].t += dt;
  }

  function updateFx(dt) {
    if (G.invuln > 0 && G.mode === 'play') G.invuln -= dt;
    if (G.lock > 0) G.lock -= dt;
    if (G.toastT > 0) G.toastT -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    if (G.flash > 0) G.flash -= dt * 2.4;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0008, dt));

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

    const need = REDUCE ? 8 : 22;
    if (mist.length < need) {
      mist.push({
        x: G.camX + rand(-20, VW + 40),
        y: G.camY + rand(40, VH),
        v: rand(8, 22),
        r: rand(10, 26),
        a: rand(0.03, 0.08)
      });
    }
    for (i = mist.length - 1; i >= 0; i--) {
      o = mist[i];
      o.x += o.v * dt;
      if (o.x > G.camX + VW + 50) {
        o.x = G.camX - 30;
        o.y = G.camY + rand(40, VH);
      }
    }
  }

  function updateCam(dt) {
    const p = G.player;
    let tx = p.x - VW * 0.36;
    if (G.boss && G.boss.active && !G.boss.dead && G.boss.max > 0) {
      tx = G.levelW - VW;
    }
    tx = clamp(tx, 0, Math.max(0, G.levelW - VW));
    let ty = p.y - VH * 0.68;
    ty = clamp(ty, -80, DY - VH + 48);
    const k = 1 - Math.pow(0.0008, dt);
    G.camX = lerp(G.camX, tx, k);
    G.camY = lerp(G.camY, ty, k * 0.85);
  }

  function maybeClearRun() {
    if (!playing() || G.clearT > 0) return;
    if (G.boss && G.boss.max > 0 && !G.boss.dead) return;
    if (G.stage < STAGES.length) {
      const p = G.player;
      if (p && p.x > G.levelW - 90 && (p.grounded || G.wet)) {
        addScore(SCORE.stage * G.stage);
        toast(STAGES[G.stage - 1].name + ' 打穿', false, true);
        G.clearT = 1.45;
        G.lock = 0.2;
        audio.stage();
        kick(2.8, 'win-flash');
      }
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.mode === 'title' || G.mode === 'play') G.clock += dt;
    updateFx(dt);
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    if (G.clearT > 0) {
      G.clearT -= dt;
      updateCam(dt);
      if (G.clearT <= 0) nextStage();
      return;
    }
    if (!live()) return;
    if (G.mode === 'title') demoThink();
    updatePlayer(dt);
    updateRides(dt);
    for (let i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    updateBoss(dt);
    updateShots(dt);
    updateNades(dt);
    maybeClearRun();
    updateCam(dt);
  }

  function drawSky() {
    const spec = specNow();
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (spec.theme === 'snow') {
      g.addColorStop(0, '#101820');
      g.addColorStop(0.5, '#141c24');
      g.addColorStop(1, '#1a1410');
    } else if (spec.theme === 'swamp') {
      g.addColorStop(0, '#0c1814');
      g.addColorStop(0.5, '#101810');
      g.addColorStop(1, '#14180c');
    } else {
      g.addColorStop(0, '#241408');
      g.addColorStop(0.5, '#2a180c');
      g.addColorStop(1, '#321c10');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const mx = sx(G.camX + VW * 0.78);
    const my = sy(G.camY + 48);
    ctx.fillStyle = rgba(spec.theme === 'snow' ? ICE : GOLD, spec.theme === 'swamp' ? 0.28 : 0.58);
    ctx.beginPath();
    ctx.arc(mx, my, 24 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(spec.theme === 'snow' ? CYN : HOT, 0.26);
    ctx.beginPath();
    ctx.arc(mx, my, 36 * scale, 0, TAU);
    ctx.fill();
  }

  function drawBackdrop() {
    const spec = specNow();
    const par = G.camX * 0.32;
    const base = sy(GY + 6);
    let i, x, h, w;
    for (i = -2; i < 24; i++) {
      x = sx((Math.floor((G.camX + par) / 64) + i) * 64 - par);
      h = (30 + hash2(i + 17 + G.stage * 9) * 90) * scale;
      w = (28 + hash2(i + 5) * 26) * scale;
      if (spec.theme === 'snow') {
        ctx.fillStyle = i % 3 === 0 ? '#182028' : '#141820';
        ctx.beginPath();
        ctx.moveTo(x, base);
        ctx.lineTo(x + w * 0.5, base - h);
        ctx.lineTo(x + w, base);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(ICE, 0.22);
        ctx.beginPath();
        ctx.moveTo(x + w * 0.2, base);
        ctx.lineTo(x + w * 0.5, base - h * 0.55);
        ctx.lineTo(x + w * 0.8, base);
        ctx.closePath();
        ctx.fill();
      } else if (spec.theme === 'swamp') {
        ctx.fillStyle = i % 2 ? '#102014' : '#0c1810';
        ctx.fillRect(x, base - h * 0.55, w * 1.05, h * 0.55 + 40 * scale);
        ctx.fillStyle = rgba(LEAF, 0.18);
        ctx.beginPath();
        ctx.arc(x + w * 0.4, base - h * 0.55, 10 * scale, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(MOSS, 0.5);
        ctx.fillRect(x + 4 * scale, base - 18 * scale, 3 * scale, 18 * scale);
      } else {
        ctx.fillStyle = i % 2 ? '#2a1c10' : '#24180c';
        ctx.beginPath();
        ctx.moveTo(x, base);
        ctx.lineTo(x + w * 0.5, base - h);
        ctx.lineTo(x + w, base);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(HOT, 0.18);
        ctx.beginPath();
        ctx.moveTo(x + w * 0.18, base);
        ctx.lineTo(x + w * 0.5, base - h * 0.55);
        ctx.lineTo(x + w * 0.82, base);
        ctx.closePath();
        ctx.fill();
        if (i % 4 === 0) {
          ctx.fillStyle = '#1a1008';
          ctx.fillRect(x + w * 0.3, base - h * 0.35, w * 0.38, h * 0.35);
          ctx.fillStyle = rgba(GOLD, 0.18);
          ctx.fillRect(x + w * 0.42, base - h * 0.28, 5 * scale, 7 * scale);
        }
      }
    }
    for (i = 0; i < mist.length; i++) {
      const m = mist[i];
      ctx.fillStyle = rgba(spec.theme === 'sand' ? SAND : spec.theme === 'swamp' ? MOSS : ICE, m.a);
      ctx.beginPath();
      ctx.arc(sx(m.x), sy(m.y), m.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawWater() {
    if (!G.waters.length) return;
    for (let i = 0; i < G.waters.length; i++) {
      const w = G.waters[i];
      const x = sx(w.x);
      const y = sy(WATER_Y);
      const ww = w.w * scale;
      const hh = (DY - WATER_Y + 48) * scale;
      const g = ctx.createLinearGradient(x, y, x, y + hh);
      g.addColorStop(0, 'rgba(0, 180, 200, 0.28)');
      g.addColorStop(1, 'rgba(8, 40, 56, 0.55)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, ww, hh);
      ctx.strokeStyle = rgba(CYN, 0.45 + Math.sin(G.clock * 3) * 0.12);
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k <= 12; k++) {
        ctx.lineTo(x + (k / 12) * ww, y + Math.sin(G.clock * 4 + k) * 3 * scale);
      }
      ctx.stroke();
    }
  }

  function drawPit() {
    const bases = G.plats.filter(function (p) { return p.base; });
    const spec = specNow();
    const y = sy(GY + 10);
    ctx.fillStyle = spec.theme === 'swamp' ? 'rgba(16,40,28,0.35)' : spec.theme === 'snow' ? 'rgba(20,32,48,0.3)' : rgba(SAND, 0.14);
    ctx.fillRect(sx(G.camX - 10), y, (VW + 20) * scale, 50 * scale);
    ctx.fillStyle = rgba(HOT, 0.08);
    let x, covered, lowed;
    for (x = G.camX; x < G.camX + VW; x += 18) {
      covered = false;
      lowed = false;
      for (let i = 0; i < bases.length; i++) {
        if (x >= bases[i].x && x <= bases[i].x + bases[i].w) {
          if (bases[i].y <= GY + 4) covered = true;
          else lowed = true;
        }
      }
      if (covered) continue;
      if (lowed) {
        ctx.fillStyle = spec.theme === 'swamp' ? rgba(CYN, 0.1) : rgba(GOLD, 0.12);
        ctx.fillRect(sx(x), sy(GY + 2), 14 * scale, 10 * scale);
      } else {
        ctx.fillStyle = rgba(HOT, 0.16);
        ctx.fillRect(sx(x), sy(GY + 4), 14 * scale, 8 * scale);
      }
    }
  }

  function drawPlats() {
    const spec = specNow();
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      const x = sx(p.x);
      const y = sy(p.y);
      const w = p.w * scale;
      const h = p.h * scale;
      const tomb = p.base && p.y > GY + 20;
      ctx.fillStyle = p.base
        ? (tomb ? (spec.theme === 'swamp' ? '#102018' : '#1c140c')
          : (spec.theme === 'snow' ? '#182028' : spec.theme === 'swamp' ? '#141810' : '#2a2010'))
        : '#24180c';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(tomb ? (spec.theme === 'swamp' ? CYN : GOLD) : (p.base ? (spec.theme === 'snow' ? ICE : SAND) : HOT), p.base ? 0.85 : 0.7);
      ctx.fillRect(x, y, w, 2.4 * scale);
      ctx.fillStyle = rgba(spec.theme === 'snow' ? ICE : GOLD, 0.22);
      ctx.fillRect(x + 2 * scale, y + 2.4 * scale, w - 4 * scale, 1.2 * scale);
      if (p.base) {
        const n = Math.max(2, (p.w / 28) | 0);
        for (let k = 0; k <= n; k++) {
          ctx.fillStyle = k % 2 ? rgba(HOT, 0.2) : rgba(tomb ? WRAP : SAND, 0.3);
          ctx.fillRect(x + (k / n) * w, y, 2 * scale, 5 * scale);
        }
      }
    }
  }

  function drawForkSign() {
    const spec = specNow();
    if (!spec.forkX || spec.highName === '') return;
    const fx = spec.forkX * (G.levelW / spec.w);
    if (fx < G.camX - 40 || fx > G.camX + VW + 40) return;
    const x = sx(fx);
    const y = sy(GY - 64);
    ctx.fillStyle = rgba(HOT, 0.85);
    ctx.fillRect(x - 3 * scale, y, 6 * scale, 48 * scale);
    ctx.fillStyle = rgba(GOLD, 0.92);
    ctx.fillRect(x - 28 * scale, y - 22 * scale, 56 * scale, 24 * scale);
    ctx.fillStyle = '#140806';
    ctx.font = 'bold ' + (9 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(spec.highName + '↑  ' + spec.lowName + '↓', x, y - 10 * scale);
  }

  function drawShot(s) {
    const x = sx(s.x);
    const y = sy(s.y);
    ctx.save();
    ctx.translate(x, y);
    const a = Math.atan2(s.vy, s.vx);
    ctx.rotate(a);
    if (s.kind === 'slug') {
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.ellipse(0, 0, 8 * scale, 3.6 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.ellipse(2 * scale, 0, 4 * scale, 2 * scale, 0, 0, TAU);
      ctx.fill();
    } else if (s.kind === 'S') {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 3.6 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.beginPath();
      ctx.arc(1 * scale, -0.6 * scale, 1.4 * scale, 0, TAU);
      ctx.fill();
    } else if (s.kind === 'cannon' || s.kind === 'bomb') {
      ctx.fillStyle = rgba(s.rgb || ORG, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, (s.kind === 'cannon' ? 5.6 : 4.4) * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(-1 * scale, -1 * scale, 2.2 * scale, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(s.rgb || GOLD, 0.95);
      ctx.fillRect(-3.5 * scale, -1.6 * scale, 10 * scale, 3.2 * scale);
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.fillRect(1 * scale, -0.8 * scale, 5 * scale, 1.6 * scale);
    }
    ctx.restore();
  }

  function drawNade(n) {
    const x = sx(n.x);
    const y = sy(n.y);
    ctx.fillStyle = rgba(n.rgb || GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(x, y, 4.4 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.fillRect(x - 1.2 * scale, y - 7 * scale, 2.4 * scale, 3.2 * scale);
    ctx.fillStyle = rgba(WHT, 0.7);
    ctx.beginPath();
    ctx.arc(x - 1.2 * scale, y - 1.2 * scale, 1.4 * scale, 0, TAU);
    ctx.fill();
  }

  function drawPickup(u) {
    if (u.taken) return;
    const bob = Math.sin(G.clock * 4 + u.t) * 3;
    const x = sx(u.x);
    const y = sy(u.y + bob);
    const rgb = u.kind === 'H' ? HOT : u.kind === 'S' ? CYN : GOLD;
    const label = u.kind === 'H' ? 'H' : u.kind === 'S' ? 'S' : 'C';
    ctx.fillStyle = rgba(rgb, 0.18);
    ctx.beginPath();
    ctx.arc(x, y, 12 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.fillRect(x - 8 * scale, y - 8 * scale, 16 * scale, 16 * scale);
    ctx.strokeStyle = rgba(WHT, 0.7);
    ctx.lineWidth = 1.2 * scale;
    ctx.strokeRect(x - 8 * scale, y - 8 * scale, 16 * scale, 16 * scale);
    ctx.fillStyle = '#140806';
    ctx.font = 'bold ' + (11 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y + 0.5 * scale);
  }

  function drawSoldier(p, rgb, opt) {
    if (opt.blink && ((G.t * 18) | 0) % 2 === 0) return;
    const s = scale * (opt.size || 1);
    const sq = opt.squash || 1;
    const duck = opt.duck;
    const aim = opt.aim || { dx: p.face, dy: 0 };
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.scale(p.face, sq);
    const leg = Math.sin(opt.run || 0) * (duck ? 1 : 5) * s;
    const bodyH = duck ? 12 : 16;
    ctx.strokeStyle = rgba(opt.leg || NAVY, 0.95);
    ctx.lineWidth = 2.2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3 * s, -6 * s);
    ctx.lineTo(-4 * s + (opt.grounded ? -leg : 2 * s), 0);
    ctx.moveTo(3 * s, -6 * s);
    ctx.lineTo(4 * s + (opt.grounded ? leg : -2 * s), 0);
    ctx.stroke();
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.fillRect(-6.2 * s, -bodyH * s - 6 * s, 12.4 * s, bodyH * s);
    ctx.fillStyle = rgba(GOLD, 0.4);
    ctx.fillRect(-6.2 * s, -bodyH * s - 6 * s, 12.4 * s, 2 * s);
    ctx.fillStyle = rgba(opt.headRgb || SKIN, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -(bodyH + 12) * s, 5.2 * s, 5.4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(opt.helm || KHAKI, 0.95);
    ctx.fillRect(-5.6 * s, -(bodyH + 16) * s, 11.2 * s, 4.2 * s);
    if (opt.scarf) {
      ctx.strokeStyle = rgba(MAG, 0.95);
      ctx.lineWidth = 1.6 * s;
      ctx.beginPath();
      ctx.moveTo(-5 * s, -(bodyH + 8) * s);
      ctx.lineTo(-10 * s, -(bodyH + 2) * s);
      ctx.stroke();
    }
    const ldx = aim.dx * p.face;
    const ldy = aim.dy;
    ctx.strokeStyle = rgba(WHT, 0.9);
    ctx.lineWidth = 1.8 * s;
    ctx.beginPath();
    ctx.moveTo(2 * s, -(bodyH + 2) * s);
    ctx.lineTo((2 + ldx * 11) * s, (-(bodyH + 2) + ldy * 11) * s);
    ctx.stroke();
    ctx.strokeStyle = rgba(HOT, 0.95);
    ctx.lineWidth = 2.4 * s;
    ctx.beginPath();
    ctx.moveTo((2 + ldx * 8) * s, (-(bodyH + 2) + ldy * 8) * s);
    ctx.lineTo((2 + ldx * 18) * s, (-(bodyH + 2) + ldy * 18) * s);
    ctx.stroke();
    if (opt.muzzle) {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc((2 + ldx * 20) * s, (-(bodyH + 2) + ldy * 20) * s, 4.2 * s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSlug(x, y, face, opt) {
    const s = scale;
    const flash = opt.hit && ((G.t * 24) | 0) % 2 === 0;
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.scale(face, 1);
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(OLIVE, 0.96);
    ctx.fillRect(-20 * s, -20 * s, 40 * s, 14 * s);
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.fillRect(-20 * s, -24 * s, 40 * s, 4 * s);
    ctx.fillStyle = rgba(SAND, 0.95);
    ctx.fillRect(4 * s, -18 * s, 22 * s, 5 * s);
    ctx.fillStyle = '#1a140c';
    const bob = Math.sin(opt.run || 0) * 1.1;
    let k;
    for (k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.arc((-14 + k * 10) * s, (-4 + (k % 2 ? bob : -bob)) * s, 5 * s, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = rgba(HOT2, 0.5);
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.moveTo(-18 * s, -4 * s);
    ctx.lineTo(16 * s, -4 * s);
    ctx.stroke();
    if (opt.head) {
      ctx.fillStyle = rgba(SKIN, 0.95);
      ctx.beginPath();
      ctx.arc(-4 * s, -28 * s, 4 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(KHAKI, 0.95);
      ctx.fillRect(-8 * s, -33 * s, 8 * s, 3 * s);
      ctx.strokeStyle = rgba(MAG, 0.9);
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.moveTo(-8 * s, -24 * s);
      ctx.lineTo(-14 * s, -20 * s);
      ctx.stroke();
    }
    if (opt.muzzle) {
      ctx.fillStyle = rgba(HOT, 0.95);
      ctx.beginPath();
      ctx.arc(26 * s, -16 * s, 5 * s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRideParked(sl) {
    if (sl.taken) return;
    const bob = Math.sin(G.clock * 3 + sl.t) * 1.2;
    drawSlug(sl.x, sl.y + bob, 1, { run: sl.t * 2, head: false, muzzle: false, hit: false });
    ctx.fillStyle = rgba(HOT, 0.7 + Math.sin(G.clock * 6) * 0.2);
    ctx.font = 'bold ' + (9 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('铁蛞', sx(sl.x), sy(sl.y - 36));
  }

  function drawEnt(e) {
    if (e.dead) return;
    if (e.hitN > 0 && ((G.t * 30) | 0) % 2 === 0) return;
    const x = sx(e.x);
    const y = sy(e.y);
    if (e.kind === 'crate') {
      ctx.fillStyle = rgba(SAND, 0.95);
      ctx.fillRect(x - 9 * scale, y - 16 * scale, 18 * scale, 16 * scale);
      ctx.strokeStyle = rgba(GOLD, 0.7);
      ctx.lineWidth = 1.2 * scale;
      ctx.strokeRect(x - 9 * scale, y - 16 * scale, 18 * scale, 16 * scale);
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.fillRect(x - 8 * scale, y - 10 * scale, 16 * scale, 2 * scale);
      return;
    }
    if (e.kind === 'turret' || e.kind === 'mortar') {
      ctx.fillStyle = '#2a2010';
      ctx.fillRect(x - 10 * scale, y - 14 * scale, 20 * scale, 14 * scale);
      ctx.fillStyle = rgba(SAND, 0.85);
      ctx.fillRect(x - 12 * scale, y - 6 * scale, 24 * scale, 6 * scale);
      ctx.fillStyle = rgba(HOT, 0.85);
      ctx.fillRect(x - 10 * scale, y - 16 * scale, 20 * scale, 2.2 * scale);
      ctx.fillStyle = '#6a7080';
      const a = Math.atan2((G.player.y - 16) - (e.y - 10), G.player.x - e.x);
      ctx.save();
      ctx.translate(x, y - 10 * scale);
      ctx.rotate(a);
      ctx.fillRect(0, -2 * scale, 16 * scale, 4 * scale);
      ctx.restore();
      return;
    }
    if (e.kind === 'copter') {
      ctx.fillStyle = rgba(OLIVE, 0.95);
      ctx.beginPath();
      ctx.ellipse(x, y - 6 * scale, 12 * scale, 5 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.fillRect(x - 4 * scale, y - 8 * scale, 14 * scale, 2.4 * scale);
      ctx.fillStyle = rgba(CYN, 0.5);
      ctx.fillRect(x - 2 * scale, y - 10 * scale, 5 * scale, 3 * scale);
      return;
    }
    if (e.kind === 'truck') {
      ctx.fillStyle = rgba(RUST, 0.95);
      ctx.fillRect(x - 16 * scale, y - 16 * scale, 32 * scale, 12 * scale);
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.fillRect(x - 16 * scale, y - 18 * scale, 32 * scale, 2.2 * scale);
      ctx.fillStyle = '#1a140c';
      ctx.beginPath();
      ctx.arc(x - 10 * scale, y - 2 * scale, 4.2 * scale, 0, TAU);
      ctx.arc(x + 10 * scale, y - 2 * scale, 4.2 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.4);
      ctx.fillRect(x + (e.face > 0 ? 4 : -10) * scale, y - 14 * scale, 8 * scale, 4 * scale);
      return;
    }
    if (e.kind === 'crab') {
      ctx.fillStyle = rgba(RUST, 0.95);
      ctx.beginPath();
      ctx.ellipse(x, y - 6 * scale, 10 * scale, 5 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(HOT2, 0.85);
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      ctx.moveTo(x - 10 * scale, y - 6 * scale);
      ctx.lineTo(x - 16 * scale, y - 12 * scale);
      ctx.moveTo(x + 10 * scale, y - 6 * scale);
      ctx.lineTo(x + 16 * scale, y - 12 * scale);
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.beginPath();
      ctx.arc(x - 4 * scale, y - 8 * scale, 1.6 * scale, 0, TAU);
      ctx.arc(x + 4 * scale, y - 8 * scale, 1.6 * scale, 0, TAU);
      ctx.fill();
      return;
    }
    let rgb = OLIVE;
    let helm = OLIVE;
    let headRgb = SKIN;
    if (e.kind === 'slash') rgb = HOT2;
    else if (e.kind === 'frog') rgb = LEAF;
    else if (e.kind === 'mummy') {
      rgb = WRAP;
      helm = SAND;
      headRgb = WRAP;
    } else if (e.kind === 'zombie') {
      rgb = MOSS;
      helm = OLIVE;
      headRgb = LEAF;
    } else if (e.kind === 'yeti') {
      rgb = ICE;
      helm = WHT;
      headRgb = WHT;
    }
    drawSoldier(e, rgb, {
      run: e.t * 8, grounded: e.grounded, squash: 1,
      duck: false, aim: { dx: e.face, dy: 0 }, size: e.kind === 'yeti' ? 1.08 : 0.92,
      helm: helm, headRgb: headRgb, leg: e.kind === 'yeti' ? WHT : NAVY
    });
  }

  function drawBoss() {
    const b = G.boss;
    if (!b || b.dead || b.max <= 0) return;
    if (!b.active && G.mode !== 'title') {
      if (b.x < G.camX - 20 || b.x > G.camX + VW + 40) return;
    }
    const x = sx(b.x);
    const y = sy(b.y);
    const flash = b.hitN > 0 && ((G.t * 24) | 0) % 2 === 0;
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#241810';
    ctx.fillRect(x - 46 * scale, y - 50 * scale, 92 * scale, 38 * scale);
    ctx.fillStyle = rgba(HOT, 0.92);
    ctx.fillRect(x - 46 * scale, y - 56 * scale, 92 * scale, 6 * scale);
    ctx.fillStyle = rgba(ICE, 0.35);
    ctx.fillRect(x - 20 * scale, y - 48 * scale, 40 * scale, 8 * scale);
    ctx.fillStyle = '#141008';
    let k;
    const spin = G.clock * 6;
    for (k = 0; k < 6; k++) {
      ctx.beginPath();
      ctx.arc(x + (-32 + k * 13) * scale, y - 6 * scale, 8 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(HOT2, 0.45);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(x + (-32 + k * 13) * scale, y - 6 * scale, 4 * scale, spin, spin + 2);
      ctx.stroke();
    }
    ctx.fillStyle = rgba(SAND, 0.95);
    ctx.fillRect(x - 60 * scale, y - 36 * scale, 32 * scale, 8 * scale);
    ctx.fillStyle = rgba(GOLD, 0.8 + Math.sin(G.clock * 8) * 0.15);
    ctx.fillRect(x - 12 * scale, y - 44 * scale, 18 * scale, 12 * scale);
    ctx.fillStyle = rgba(MAG, 0.7);
    ctx.fillRect(x - 36 * scale, y - 24 * scale, 16 * scale, 5 * scale);
    ctx.fillRect(x + 10 * scale, y - 24 * scale, 16 * scale, 5 * scale);
  }

  function drawBossBar() {
    const b = G.boss;
    if (!b || !b.active || b.dead || !playing() || b.max <= 0) return;
    const x = ox + 80 * scale;
    const y = oy + 12 * scale;
    const w = (VW - 160) * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.fillRect(x, y, w * clamp(b.hp / b.max, 0, 1), 8 * scale);
    ctx.strokeStyle = rgba(GOLD, 0.5);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.font = (10 * scale) + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(b.name, x, y - 3 * scale);
  }

  function drawFx() {
    let i, o;
    for (i = 0; i < rings.length; i++) {
      o = rings[i];
      const k = o.t / 0.4;
      ctx.strokeStyle = rgba(o.rgb, 1 - k);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.r + k * 22) * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < sparks.length; i++) {
      o = sparks[i];
      const k = 1 - o.t / 0.28;
      ctx.fillStyle = rgba(o.rgb, k);
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.rad * k * 0.4) * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < particles.length; i++) {
      o = particles[i];
      ctx.fillStyle = rgba(o.rgb, clamp(o.life / o.max, 0, 1));
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), o.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (i = 0; i < floats.length; i++) {
      o = floats[i];
      const a = 1 - o.t / o.life;
      ctx.fillStyle = rgba(o.rgb, a);
      ctx.font = 'bold ' + (o.size * scale) + 'px sans-serif';
      ctx.fillText(o.text, sx(o.x), sy(o.y));
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#140806';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    const shx = G.shake && !REDUCE ? (hash2((G.t * 80) | 0) - 0.5) * G.shake : 0;
    const shy = G.shake && !REDUCE ? (hash2((G.t * 80 + 9) | 0) - 0.5) * G.shake : 0;
    ctx.translate(shx, shy);
    if (G.punch !== 1 && !REDUCE) {
      const cx = ox + VW * scale * 0.5;
      const cy = oy + VH * scale * 0.5;
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }

    drawSky();
    drawBackdrop();
    drawPit();
    drawWater();
    drawPlats();
    drawForkSign();

    let i;
    for (i = 0; i < G.rides.length; i++) drawRideParked(G.rides[i]);
    for (i = 0; i < G.pickups.length; i++) drawPickup(G.pickups[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBoss();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);
    for (i = 0; i < G.nades.length; i++) drawNade(G.nades[i]);

    if (G.player && G.deadT <= 0) {
      const blink = G.invuln > 0 && G.mode === 'play';
      const hit = blink && ((G.t * 18) | 0) % 2 === 0;
      if (G.ride === 'slug') {
        drawSlug(G.player.x, G.player.y, G.player.face, {
          run: G.player.run, head: true, muzzle: G.muzzle > 0, hit: hit
        });
      } else {
        drawSoldier(G.player, NAVY, {
          run: G.player.run,
          grounded: G.player.grounded,
          squash: G.player.squash,
          duck: G.player.duck,
          aim: getAim(G.player),
          muzzle: G.muzzle > 0,
          blink: blink,
          scarf: true,
          helm: KHAKI
        });
      }
    }

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

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const nadeKey = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (space) keys.fire = down;
    if (nadeKey) keys.nade = down;

    if (down && (isMove || space || nadeKey || k === 'Enter')) e.preventDefault();
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
      startGame('stage');
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
    hold(document.getElementById('btn-duck'), function () { keys.d = true; }, function () { keys.d = false; });
    hold(document.getElementById('btn-fire'), function () { keys.fire = true; }, function () { keys.fire = false; });
    hold(document.getElementById('btn-nade'), function () { keys.nade = true; }, function () { keys.nade = false; });
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

  if (btnStage) {
    btnStage.addEventListener('click', function () {
      audio.ensure();
      startGame('stage');
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
  if (modeStage) {
    modeStage.addEventListener('click', function () {
      audio.ensure();
      startGame('stage');
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
      keys.nade = false;
    }
  });

  requestAnimationFrame(frame);
})();
