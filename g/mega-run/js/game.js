'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const HP = 28;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.25;
  const GY = 328;
  const MY = 256;
  const HY = 184;
  const WALK = 188;
  const AIR = 1;
  const JUMP_V = 500;
  const GRAV = 1450;
  const MAX_FALL = 580;
  const COYOTE = 0.08;
  const BUFFER = 0.12;
  const PW = 16;
  const PH = 24;
  const SLIDE_T = 0.36;
  const SLIDE_SPD = 340;
  const INVULN = 1.15;
  const SPAWN_I = 1.4;
  const DIE_T = 0.85;
  const CHARGE1 = 0.4;
  const CHARGE2 = 0.95;
  const BEST_KEY = 'playbox-mega-run-best';
  const MUTE_KEY = 'playbox-mega-run-mute';
  const OPS = 'WASD / 方向键 走跳滑 · 空格射击按住充能 · 1-4 换武器 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [25, 200, 255];
  const HOT2 = [90, 224, 255];
  const WHT = [232, 246, 255];
  const LEAF = [61, 255, 122];
  const ORG = [255, 122, 50];
  const ICE = [184, 240, 255];
  const BLU = [40, 110, 190];
  const PNK = [255, 120, 200];

  const WPN_ORDER = ['buster', 'volt', 'blaze', 'frost'];
  const WPN_KEY = { '1': 'buster', '2': 'volt', '3': 'blaze', '4': 'frost' };
  const WEAPONS = {
    buster: { name: '标准', cd: 0.11, max: 3, spd: 430, dmg: 1, cost: 0, rgb: CYN, charge: true },
    volt: { name: '电弧', cd: 0.22, max: 2, spd: 300, dmg: 2, cost: 2, rgb: GOLD, bounce: 4 },
    blaze: { name: '炎心', cd: 0.26, max: 2, spd: 250, dmg: 2, cost: 2, rgb: ORG, arc: 1 },
    frost: { name: '霜刺', cd: 0.2, max: 3, spd: 340, dmg: 2, cost: 1, rgb: ICE, freeze: 1.35 }
  };

  const SCORE = {
    met: 100, flyer: 150, turret: 200, walker: 120,
    boss: 5000, stage: 2500, steal: 1200, core: 8000, clear: 10000
  };

  const MASTERS = [
    { id: 'volt', name: '电弧', en: 'VOLT', weak: 'frost', rgb: GOLD, hp: 28 },
    { id: 'blaze', name: '炎心', en: 'BLAZE', weak: 'volt', rgb: ORG, hp: 28 },
    { id: 'frost', name: '霜刺', en: 'FROST', weak: 'blaze', rgb: ICE, hp: 28 }
  ];

  const STAGES = {
    volt: {
      id: 'volt', name: '电弧', boss: 'volt', w: 1860, hp: 28, theme: 'volt',
      ground: [[0, 500], [580, 240], [900, 320], [1320, 540]],
      plats: [
        [160, MY, 140], [380, MY, 130], [680, MY, 150],
        [1040, MY, 150], [1480, MY, 170], [1680, MY, 110],
        [220, HY, 110], [760, HY, 120], [1180, HY, 140], [1540, HY, 110]
      ],
      ents: [
        [240, GY, 'met'], [420, GY, 'walker', 80, 480],
        [460, MY, 'turret'], [720, GY, 'met'],
        [820, 140, 'flyer', 760, 980], [1080, GY, 'walker', 920, 1180],
        [1120, MY, 'met'], [1280, HY, 'turret'],
        [1400, GY, 'met'], [1520, MY, 'walker', 1480, 1640],
        [700, GY, 'spike', 36], [1240, GY, 'spike', 40]
      ],
      drops: [[980, MY, 'hp'], [1600, MY, 'hp']]
    },
    blaze: {
      id: 'blaze', name: '炎心', boss: 'blaze', w: 1940, hp: 28, theme: 'blaze',
      ground: [[0, 460], [540, 220], [860, 300], [1280, 280], [1660, 280]],
      plats: [
        [140, MY, 130], [360, MY, 140], [640, MY, 160],
        [980, MY, 150], [1360, MY, 160], [1720, MY, 140],
        [200, HY, 100], [700, HY, 130], [1140, HY, 130], [1580, HY, 120]
      ],
      ents: [
        [220, GY, 'walker', 40, 420], [400, MY, 'met'],
        [500, GY, 'jet'], [780, GY, 'met'],
        [840, 130, 'flyer', 780, 1020], [1040, MY, 'turret'],
        [1180, GY, 'walker', 900, 1140], [1320, MY, 'met'],
        [1400, GY, 'jet'], [1500, HY, 'turret'],
        [1720, GY, 'walker', 1680, 1900], [620, GY, 'spike', 32]
      ],
      drops: [[1100, HY, 'hp'], [1500, MY, 'en']]
    },
    frost: {
      id: 'frost', name: '霜刺', boss: 'frost', w: 1900, hp: 28, theme: 'frost',
      ground: [[0, 480], [560, 260], [920, 300], [1340, 560]],
      plats: [
        [180, MY, 140], [420, MY, 120], [700, MY, 160],
        [1060, MY, 150], [1460, MY, 180], [1720, MY, 100],
        [260, HY, 110], [800, HY, 130], [1220, HY, 140], [1600, HY, 110]
      ],
      ents: [
        [260, GY, 'met'], [400, GY, 'walker', 60, 500],
        [480, MY, 'turret'], [740, GY, 'met'],
        [860, 128, 'flyer', 800, 1040], [1100, GY, 'walker', 940, 1200],
        [1140, MY, 'met'], [1300, HY, 'turret'],
        [1480, GY, 'met'], [1640, MY, 'walker', 1480, 1720],
        [660, GY, 'spike', 40], [1260, GY, 'spike', 36]
      ],
      drops: [[1000, MY, 'hp'], [1580, HY, 'en']]
    }
  };

  const FORT = [
    {
      id: 'gate', name: '外廊', boss: '', w: 2040, hp: 0, theme: 'fort',
      ground: [[0, 420], [500, 260], [860, 320], [1280, 280], [1680, 360]],
      plats: [
        [120, MY, 140], [340, MY, 140], [620, MY, 150],
        [960, MY, 160], [1380, MY, 170], [1780, MY, 150],
        [220, HY, 110], [720, HY, 130], [1180, HY, 140], [1640, HY, 120]
      ],
      ents: [
        [220, GY, 'walker', 40, 400], [380, MY, 'met'], [480, GY, 'turret'],
        [700, GY, 'jet'], [820, 140, 'flyer', 760, 1000],
        [1040, GY, 'walker', 900, 1160], [1120, MY, 'met'],
        [1260, HY, 'turret'], [1440, GY, 'met'], [1500, GY, 'jet'],
        [1700, MY, 'walker', 1680, 1840], [1860, GY, 'turret'],
        [600, GY, 'spike', 36], [1220, GY, 'spike', 40]
      ],
      drops: [[900, MY, 'volt'], [1400, HY, 'hp'], [1760, MY, 'blaze']]
    },
    {
      id: 'hall', name: '闸心', boss: '', w: 2160, hp: 0, theme: 'hall',
      ground: [[0, 380], [460, 240], [800, 280], [1180, 260], [1560, 240], [1920, 240]],
      plats: [
        [100, MY, 130], [320, MY, 140], [580, MY, 150],
        [920, MY, 150], [1280, MY, 160], [1680, MY, 170], [1960, MY, 120],
        [180, HY, 100], [680, HY, 130], [1100, HY, 140], [1520, HY, 130], [1880, HY, 110]
      ],
      ents: [
        [200, GY, 'met'], [360, MY, 'turret'], [500, GY, 'jet'],
        [640, 128, 'flyer', 580, 820], [860, GY, 'walker', 820, 1040],
        [980, MY, 'met'], [1140, GY, 'jet'], [1240, HY, 'turret'],
        [1400, GY, 'walker', 1220, 1440], [1480, MY, 'met'],
        [1620, 120, 'flyer', 1560, 1800], [1760, GY, 'jet'],
        [1880, MY, 'turret'], [2000, GY, 'walker', 1940, 2140],
        [720, GY, 'spike', 40], [1340, GY, 'spike', 44], [1840, GY, 'spike', 36]
      ],
      drops: [[1000, HY, 'frost'], [1600, MY, 'hp'], [1900, HY, 'en']]
    },
    {
      id: 'core', name: '芯核', boss: 'core', w: 720, hp: 40, theme: 'core',
      ground: [[0, 720]],
      plats: [
        [80, MY, 120], [260, MY, 140], [460, MY, 130],
        [160, HY, 100], [400, HY, 110]
      ],
      ents: [[180, GY, 'met'], [540, GY, 'turret']],
      drops: [[320, MY, 'hp']]
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
  function spdMul() {
    if (G.kind !== 'fort') return 1;
    return 1.28 * (1 + Math.max(0, G.fortIdx) * 0.07);
  }
  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }
  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function selfCheck() {
    if (MASTERS.length !== 3) throw new Error('3 masters');
    if (MASTERS[0].id === MASTERS[1].id) throw new Error('unique masters');
    if (!WEAPONS.buster.charge) throw new Error('charge');
    if (!WEAPONS.volt.bounce || !WEAPONS.blaze.arc || !WEAPONS.frost.freeze) throw new Error('weapons');
    if (WEAPONS.volt.name === WEAPONS.blaze.name) throw new Error('wpn names');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    if (LIVES !== 3) throw new Error('3 lives');
    if (HP !== 28) throw new Error('28 hp');
    if (BEST_KEY !== 'playbox-mega-run-best') throw new Error('best key');
    if (spdMulFort(1) <= spdMulFort(0)) throw new Error('fort faster');
    if (FORT.length !== 3) throw new Error('3 fort');
    if (!STAGES.volt || !STAGES.blaze || !STAGES.frost) throw new Error('stages');
    if (STAGES.volt.boss === STAGES.blaze.boss) throw new Error('boss unique');
    if (CHARGE2 <= CHARGE1) throw new Error('charge levels');
    if (SLIDE_SPD <= WALK) throw new Error('slide faster');
    let i;
    for (i = 0; i < MASTERS.length; i++) {
      if (!STAGES[MASTERS[i].id].ents.length) throw new Error('empty ' + MASTERS[i].id);
    }
  }
  function spdMulFort(idx) {
    return 1.28 * (1 + Math.max(0, idx) * 0.07);
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
  const btnSelect = document.getElementById('btn-select');
  const btnFort = document.getElementById('btn-fort');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeSelect = document.getElementById('mode-select');
  const modeFort = document.getElementById('mode-fort');
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
  const hpLabel = document.getElementById('hp-label');
  const gunLabel = document.getElementById('gun-label');
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
  let firePrev = false;
  let chargeHum = 0;

  const keys = { l: false, r: false, u: false, d: false, fire: false };
  const demo = { l: false, r: true, u: false, d: false, fire: true, t: 0, phase: 0 };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const mist = [];

  const G = {
    mode: 'title',
    kind: 'select',
    t: 0,
    clock: 0,
    camX: 0,
    camY: 0,
    levelW: 1860,
    plats: [],
    ents: [],
    shots: [],
    eshots: [],
    pickups: [],
    player: null,
    boss: null,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    weapon: 'buster',
    unlocked: { buster: true, volt: false, blaze: false, frost: false },
    energy: { volt: 28, blaze: 28, frost: 28 },
    beaten: { volt: false, blaze: false, frost: false },
    fireCd: 0,
    checkX: 70,
    checkY: GY,
    jumpBuf: 0,
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
    muzzle: 0,
    theme: 'volt',
    doorX: 1400,
    lockCam: false,
    sel: 0,
    fortIdx: 0,
    getT: 0,
    getName: '',
    chargeFlash: 0,
    spec: null
  };

  function isFort() {
    return G.kind === 'fort';
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
    return G.mode === 'title' ? demo.d : keys.d;
  }
  function fireHeld() {
    return G.mode === 'title' ? demo.fire : keys.fire;
  }

  function sx(x) {
    return ox + (x - G.camX) * scale;
  }
  function sy(y) {
    return oy + (y - G.camY) * scale;
  }
  function hx(x) {
    return ox + x * scale;
  }
  function hy(y) {
    return oy + y * scale;
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
      this.beep(300, 0.06, 'square', 0.045, 680);
    },
    land() {
      this.ensure();
      this.noise(0.04, 0.026, 480);
      this.beep(150, 0.05, 'triangle', 0.024, 80);
    },
    slide() {
      this.ensure();
      this.noise(0.08, 0.04, 600);
      this.beep(220, 0.1, 'sawtooth', 0.03, 90);
    },
    shot(kind, lv) {
      this.ensure();
      if (lv >= 2) {
        this.beep(220, 0.12, 'sawtooth', 0.06, 90);
        this.beep(880, 0.1, 'square', 0.05, 220);
        this.noise(0.08, 0.05, 400);
      } else if (lv >= 1) {
        this.beep(520, 0.08, 'square', 0.05, 180);
        this.noise(0.04, 0.03, 900);
      } else if (kind === 'volt') {
        this.beep(980, 0.07, 'square', 0.045, 420);
        this.beep(1480, 0.06, 'triangle', 0.03, 220);
      } else if (kind === 'blaze') {
        this.noise(0.09, 0.05, 280);
        this.beep(240, 0.1, 'sawtooth', 0.042, 90);
      } else if (kind === 'frost') {
        this.beep(1320, 0.07, 'sine', 0.04, 880);
        this.beep(1760, 0.08, 'triangle', 0.03, 2200);
      } else {
        this.beep(920, 0.045, 'square', 0.042, 360);
        this.noise(0.018, 0.018, 1800);
      }
    },
    chargeTick(lv) {
      this.ensure();
      const f = 420 + lv * 380;
      this.beep(f, 0.05, 'square', 0.028, f + 80);
    },
    chargeFull() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.045, 1320);
      this.beep(990, 0.12, 'triangle', 0.04, 1760);
    },
    ping() {
      this.ensure();
      this.beep(720, 0.06, 'square', 0.045, 1100);
      this.beep(1100, 0.09, 'triangle', 0.035, 1540);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.035, 0.034, 1100);
      this.beep(540 * lift, 0.06, 'square', 0.042, 900 * lift);
    },
    boom() {
      this.ensure();
      this.noise(0.16, 0.07, 220);
      this.beep(170, 0.18, 'sawtooth', 0.05, 50);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    hurt() {
      this.ensure();
      this.noise(0.08, 0.05, 400);
      this.beep(320, 0.14, 'sawtooth', 0.05, 90);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.06, 280);
      this.beep(260, 0.22, 'sawtooth', 0.05, 60);
      this.beep(120, 0.34, 'sine', 0.045, 40);
    },
    boss() {
      this.ensure();
      this.beep(160, 0.2, 'sawtooth', 0.05, 80);
      this.beep(100, 0.32, 'square', 0.04, 55);
    },
    steal() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.05, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(784, 0.16, 'sine', 0.05, 1046);
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
    empty() {
      this.ensure();
      this.beep(180, 0.08, 'square', 0.03, 90);
    },
    freeze() {
      this.ensure();
      this.beep(1480, 0.08, 'sine', 0.04, 880);
      this.noise(0.05, 0.025, 1400);
    },
    clink() {
      this.ensure();
      this.beep(240, 0.04, 'square', 0.03, 160);
    }
  };

  function loadBest() {
    let n = 0;
    try { n = parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0; } catch (err) { n = 0; }
    G.best = n;
    if (bestEl) bestEl.textContent = String(n);
  }

  function saveBest() {
    if (G.score > G.best) {
      G.best = G.score;
      try { localStorage.setItem(BEST_KEY, String(G.best)); } catch (err) { /* ignore */ }
      if (bestEl) bestEl.textContent = String(G.best);
    }
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden', 'end');
    overlay.setAttribute('aria-hidden', 'false');
    if (kind !== 'title') overlay.classList.add('end');
    if (panel) {
      panel.classList.toggle('win', kind === 'win');
      panel.classList.toggle('lose', kind === 'lose');
    }
    if (ovKicker) ovKicker.textContent = kind === 'win' ? 'CLEAR' : kind === 'lose' ? 'DOWN' : 'MEGA';
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.innerHTML = lead;
    if (ovOps) ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '要塞' : '换模式';
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
    if (REDUCE || G.mode === 'title' || G.mode === 'select') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag, cls) {
    if (REDUCE || G.mode === 'title' || G.mode === 'select') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.007));
    if (!stageEl) return;
    const c = cls || (mag >= 6 ? 'die' : mag >= 3.4 ? 'boom' : 'hit');
    kickTok += 1;
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash', 'charge');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash', 'charge');
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

  function toast(msg, cls) {
    if (!toastEl) return;
    toastTok += 1;
    const tok = toastTok;
    toastEl.textContent = msg;
    toastEl.className = 'toast' + (cls ? ' ' + cls : '');
    setTimeout(function () {
      if (tok === toastTok && toastEl) toastEl.classList.add('hidden');
    }, 1400);
  }

  function popScore(n) {
    if (!scoreAdd) return;
    addTok += 1;
    const tok = addTok;
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + n;
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    setTimeout(function () {
      if (tok === addTok && scoreAdd) scoreAdd.hidden = true;
    }, 700);
  }

  function addScore(base, x, y, rgb) {
    const n = (base * G.mult) | 0;
    G.score += n;
    saveBest();
    if (G.score >= G.nextLife) {
      G.nextLife += LIFE_EVERY;
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        audio.oneup();
        toast('1UP', 'gold');
        screenFlash(GOLD, 0.35);
      }
    }
    popScore(n);
    if (x != null) floatText(x, y, '+' + n, rgb || GOLD, n >= 400);
    if (scoreEl) scoreEl.textContent = String(G.score);
    syncHud();
    return n;
  }

  function wpnRgb() {
    return (WEAPONS[G.weapon] && WEAPONS[G.weapon].rgb) || CYN;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.mult > 1);
    const spec = G.spec;
    if (stageLabel) {
      if (G.mode === 'select') stageLabel.textContent = '选关';
      else stageLabel.textContent = spec ? spec.name : '电弧';
      stageLabel.classList.toggle('hot', !!(G.boss && G.boss.active && !G.boss.dead));
    }
    if (tagLabel) {
      tagLabel.textContent = G.kind === 'fort' ? '要塞' : '选关';
      tagLabel.classList.toggle('warn', G.kind === 'fort');
    }
    const hp = G.player ? G.player.hp : HP;
    if (hpLabel) {
      hpLabel.textContent = 'HP ' + Math.max(0, hp);
      hpLabel.classList.toggle('low', hp <= 8);
    }
    if (gunLabel) {
      const w = WEAPONS[G.weapon];
      gunLabel.textContent = w ? w.name : '标准';
      gunLabel.className = 'gun ' + G.weapon + (G.player && G.player.charge >= CHARGE2 ? ' hot' : '');
    }
    if (pipsEl) {
      if (!pips.length) {
        let i;
        for (i = 0; i < LIFE_CAP; i++) {
          const el = document.createElement('span');
          el.className = 'pip';
          pipsEl.appendChild(el);
          pips.push(el);
        }
      }
      let i;
      for (i = 0; i < pips.length; i++) {
        pips[i].className = 'pip' + (i < G.lives ? ' on' : '') + (i < LIVES && i >= G.lives ? ' gone' : '');
        pips[i].style.display = i < Math.max(LIVES, G.lives) ? '' : 'none';
      }
    }
    if (modeSelect) modeSelect.setAttribute('aria-pressed', G.kind !== 'fort' ? 'true' : 'false');
    if (modeFort) modeFort.setAttribute('aria-pressed', G.kind === 'fort' ? 'true' : 'false');
    if (hintEl) {
      if (G.mode === 'select') hintEl.textContent = '← → 选择首领 · 空格进入 · 击败后夺走武器';
      else if (G.boss && G.boss.active && !G.boss.dead) hintEl.textContent = '首领战 · 弱点武器更痛 · 充能弹打脸';
      else hintEl.textContent = '走跳 · 空格射击按住充能 · 1-4 换武器 · 滑铲过低缝 · 血格打空丢命';
    }
  }

  function makePlayer(x, y) {
    return {
      x: x, y: y, vx: 0, vy: 0, face: 1,
      w: PW, h: PH, sliding: false, slideT: 0,
      grounded: true, coyote: 0,
      squash: 1, run: 0, pose: 0,
      hp: HP, charge: 0, charged: false
    };
  }

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }

  function hpOf(kind) {
    if (kind === 'turret') return 2;
    if (kind === 'walker') return 2;
    if (kind === 'spike' || kind === 'jet') return 99;
    return 1;
  }

  function makeEnt(row) {
    const kind = row[2];
    const hp = hpOf(kind);
    return {
      id: uid++,
      x: row[0], y: row[1], vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: row[3] || 0, b: row[4] || 0,
      t: rand(0, 1.2), fire: rand(0.2, 1),
      grounded: kind !== 'flyer',
      dead: false, hitN: 0, shut: true, on: false,
      frozen: 0,
      w: kind === 'spike' ? (row[3] || 28) : (kind === 'jet' ? 16 : 14),
      h: kind === 'spike' ? 12 : (kind === 'flyer' ? 12 : 18)
    };
  }

  function makeBoss(spec) {
    if (!spec.boss) return null;
    const hp = (spec.hp * (isFort() ? 1.22 : 1)) | 0;
    const master = MASTERS.filter(function (m) { return m.id === spec.boss; })[0];
    return {
      id: uid++,
      x: spec.w - 120, y: GY, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: spec.boss,
      t: 0, cd: 0.8, st: 'wait', stT: 1.1,
      grounded: true, dead: false, active: false,
      hitN: 0, intro: 1.15, alpha: 1,
      w: spec.boss === 'core' ? 46 : 34,
      h: spec.boss === 'core' ? 46 : 40,
      name: spec.name,
      weak: master ? master.weak : 'buster',
      rgb: master ? master.rgb : MAG,
      didJump: false, slammed: false, warped: false, shots: 0
    };
  }

  function makePickup(d) {
    return { x: d[0], y: d[1] - 18, kind: d[2], taken: false, t: 0 };
  }

  function seedMist() {
    mist.length = 0;
    let i;
    for (i = 0; i < 36; i++) {
      mist.push({
        x: rand(0, 2400), y: rand(20, 300),
        s: rand(1.2, 3.4), v: rand(8, 28), a: rand(0.04, 0.14)
      });
    }
  }

  function loadStage(spec, attract) {
    G.spec = spec;
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
    G.ents = [];
    for (i = 0; i < spec.ents.length; i++) G.ents.push(makeEnt(spec.ents[i]));
    if (isFort() && !attract && spec.id !== 'core') {
      for (i = 0; i < spec.ents.length; i++) {
        if (i % 3 !== 0) continue;
        const e = spec.ents[i];
        if (e[2] === 'spike' || e[2] === 'jet' || e[2] === 'turret') continue;
        G.ents.push(makeEnt([e[0] + 42, e[1], e[2], e[3], e[4]]));
      }
    }
    G.pickups = [];
    if (!attract) {
      for (i = 0; i < spec.drops.length; i++) G.pickups.push(makePickup(spec.drops[i]));
    }
    G.shots = [];
    G.eshots = [];
    G.boss = attract ? null : makeBoss(spec);
    G.doorX = spec.boss && !attract ? spec.w - VW + 36 : spec.w + 999;
    G.lockCam = false;
    G.checkX = 70;
    G.checkY = GY;
    G.player = makePlayer(70, GY);
    G.camX = 0;
    G.camY = 0;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = attract ? 99 : 0.5;
    G.lock = 0;
    G.jumpBuf = 0;
    G.muzzle = 0;
    G.getT = 0;
    if (G.player) G.player.hp = HP;
    if (!attract) {
      particles.length = 0;
      sparks.length = 0;
      rings.length = 0;
      floats.length = 0;
    }
    seedMist();
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

  function pitAhead(x, y, dir) {
    const nx = x + dir * 46;
    return !platUnder(nx, y, null);
  }

  function arenaL() {
    return Math.max(16, G.levelW - VW + 22);
  }
  function arenaR() {
    return G.levelW - 28;
  }

  function countMine(kind, charged) {
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (!s.mine) continue;
      if (s.kind !== kind) continue;
      if (charged) {
        if (s.lv > 0) n += 1;
      } else if (s.lv === 0) n += 1;
    }
    return n;
  }

  function setWeapon(id) {
    if (!WEAPONS[id]) return;
    if (!G.unlocked[id]) {
      toast('尚未夺取', 'warn');
      audio.empty();
      return;
    }
    if (G.weapon === id) return;
    G.weapon = id;
    if (G.player) G.player.charge = 0;
    audio.ping();
    toast(WEAPONS[id].name, id === 'buster' ? '' : 'gold');
    syncHud();
  }

  function cycleWeapon() {
    let i = WPN_ORDER.indexOf(G.weapon);
    let k;
    for (k = 0; k < WPN_ORDER.length; k++) {
      i = (i + 1) % WPN_ORDER.length;
      if (G.unlocked[WPN_ORDER[i]]) {
        setWeapon(WPN_ORDER[i]);
        return;
      }
    }
  }

  function spawnShot(opt) {
    G.shots.push({
      x: opt.x, y: opt.y, vx: opt.vx, vy: opt.vy,
      kind: opt.kind, rgb: opt.rgb, dmg: opt.dmg,
      mine: !!opt.mine, lv: opt.lv || 0,
      life: opt.life || 0.9, bounce: opt.bounce || 0,
      g: opt.g || 0, pierce: opt.pierce || 0,
      freeze: opt.freeze || 0, r: opt.r || 3.2,
      dead: false
    });
    capArr(G.shots, 80);
  }

  function tryShoot(lv) {
    const p = G.player;
    if (!p || G.deadT > 0 || G.lock > 0) return false;
    const kind = lv > 0 ? 'buster' : G.weapon;
    const w = WEAPONS[kind];
    if (!w) return false;
    if (G.fireCd > 0 && lv === 0) return false;
    if (kind !== 'buster') {
      if ((G.energy[kind] || 0) < w.cost) {
        if (G.fireCd <= 0) {
          audio.empty();
          toast(w.name + '能量不足', 'warn');
          G.fireCd = 0.45;
        }
        return false;
      }
    }
    const max = lv > 0 ? 1 : w.max;
    if (countMine(kind, lv > 0) >= max) return false;
    if (kind !== 'buster') G.energy[kind] -= w.cost;
    const face = p.face;
    const y = p.y - (p.sliding ? 8 : 14);
    const x = p.x + face * 12;
    let vx = face * w.spd;
    let vy = 0;
    let g = 0;
    let bounce = 0;
    let dmg = w.dmg;
    let r = 3.2;
    let pierce = 0;
    let life = 0.85;
    if (lv >= 2) {
      dmg = 4; r = 7.2; pierce = 2; life = 1.1; vx = face * 480;
    } else if (lv >= 1) {
      dmg = 2; r = 5.2; pierce = 1; life = 0.95; vx = face * 450;
    }
    if (w.arc && lv === 0) {
      vy = -220; g = 780; life = 1.4;
    }
    if (w.bounce && lv === 0) bounce = w.bounce;
    spawnShot({
      x: x, y: y, vx: vx, vy: vy, kind: kind, rgb: lv >= 2 ? WHT : w.rgb,
      dmg: dmg, mine: true, lv: lv, life: life, bounce: bounce, g: g,
      pierce: pierce, freeze: w.freeze || 0, r: r
    });
    G.fireCd = w.cd;
    G.muzzle = 0.08;
    p.pose = 0.12;
    audio.shot(kind, lv);
    emit(lv >= 2 ? 12 : 5, {
      x: x, y: y, j: 4,
      vx0: face * 40, vx1: face * 180, vy0: -70, vy1: 70,
      life: 0.18 + lv * 0.08, r0: 1, r1: 2.4 + lv, rgb: w.rgb, g: 80
    });
    if (lv >= 2) {
      screenFlash(CYN, 0.32);
      hitStop(0.045);
      kick(3.2, 'charge');
      popSpark(x, y, WHT, 18);
    } else if (lv >= 1) {
      hitStop(0.03);
      kick(1.6, 'hit');
    }
    syncHud();
    return true;
  }

  function bossShot(b, vx, vy, kind, rgb, dmg) {
    spawnShot({
      x: b.x, y: b.y - b.h * 0.45, vx: vx, vy: vy,
      kind: kind || 'bolt', rgb: rgb || b.rgb, dmg: dmg || 2,
      mine: false, life: 2.2, r: kind === 'wave' ? 6 : 4.2, g: kind === 'fire' ? 420 : 0
    });
  }

  function enemyShot(e, vx, vy, dmg) {
    spawnShot({
      x: e.x, y: e.y - e.h * 0.5, vx: vx, vy: vy,
      kind: 'pellet', rgb: MAG, dmg: dmg || 2,
      mine: false, life: 1.6, r: 3
    });
  }

  function explode(x, y, rgb, power) {
    juice(x, y, rgb, power);
    audio.boom();
    hitStop(0.04 + power * 0.03);
  }

  function killEnt(e) {
    if (e.dead) return;
    e.dead = true;
    const sc = SCORE[e.kind] || 100;
    if (playing()) {
      bumpCombo();
      addScore(sc, e.x, e.y - 20, wpnRgb());
      hitStop(0.055);
    }
    explode(e.x, e.y - 10, wpnRgb(), 0.9);
  }

  function hitEnt(e, s) {
    if (e.dead || e.kind === 'spike' || e.kind === 'jet') return false;
    if (e.kind === 'met' && e.shut) {
      audio.clink();
      return true;
    }
    if (e.frozen > 0 && s.kind !== 'blaze') {
      e.hp -= s.dmg;
    } else {
      e.hp -= s.dmg;
    }
    e.hitN = 0.08;
    if (s.freeze && e.kind !== 'turret') {
      e.frozen = s.freeze;
      audio.freeze();
    }
    audio.hit(G.combo);
    if (playing()) bumpCombo();
    emit(6, {
      x: e.x, y: e.y - 10, j: 6,
      vx0: -120, vx1: 120, vy0: -160, vy1: 20,
      life: 0.22, r0: 1, r1: 2.4, rgb: s.rgb, g: 200
    });
    if (playing()) hitStop(s.lv >= 2 ? 0.07 : 0.038);
    if (e.hp <= 0) killEnt(e);
    return true;
  }

  function hitBoss(b, s) {
    if (!b.active || b.dead || b.intro > 0) return false;
    if (b.st === 'teleport' && b.alpha < 0.7) return false;
    let dmg = s.dmg;
    if (s.kind === b.weak) dmg *= 2;
    if (b.kind === 'core' && s.lv >= 2) dmg += 2;
    b.hp -= dmg;
    b.hitN = 0.1;
    bumpCombo();
    audio.hit(G.combo);
    hitStop(s.lv >= 2 ? 0.08 : 0.055);
    kick(3.6, 'boom');
    emit(10, {
      x: s.x, y: s.y, j: 8,
      vx0: -180, vx1: 180, vy0: -220, vy1: 40,
      life: 0.28, r0: 1.2, r1: 3.2, rgb: s.rgb
    });
    floatText(b.x, b.y - b.h - 8, dmg >= s.dmg * 2 ? '弱点!' : '-' + dmg, dmg >= s.dmg * 2 ? GOLD : s.rgb, dmg >= s.dmg * 2);
    if (b.hp <= 0) {
      b.hp = 0;
      b.dead = true;
      onBossDown(b);
    }
    return true;
  }

  function onBossDown(b) {
    explode(b.x, b.y - 20, b.rgb, 2.2);
    screenFlash(b.rgb, 0.55);
    hitStop(0.08);
    kick(7, 'die');
    addScore(b.kind === 'core' ? SCORE.core : SCORE.boss, b.x, b.y - 40, GOLD);
    if (b.kind === 'volt' || b.kind === 'blaze' || b.kind === 'frost') {
      G.beaten[b.kind] = true;
      G.unlocked[b.kind] = true;
      G.energy[b.kind] = 28;
      G.getT = 1.7;
      G.lock = 1.7;
      G.getName = WEAPONS[b.kind].name;
      G.weapon = b.kind;
      if (G.player) G.player.hp = HP;
      audio.steal();
      toast('夺取' + G.getName, 'gold');
      addScore(SCORE.steal, b.x, b.y - 60, GOLD);
    } else {
      G.getT = 1.4;
      G.lock = 1.4;
      G.getName = '';
      audio.win();
    }
    syncHud();
  }

  function afterGet() {
    addScore(SCORE.stage, G.player.x, G.player.y - 40, CYN);
    if (G.kind === 'select') {
      const all = G.beaten.volt && G.beaten.blaze && G.beaten.frost;
      if (G.spec && G.spec.boss === 'core') {
        goWin();
        return;
      }
      if (all) {
        toast('要塞开闸', 'gold');
        loadStage(FORT[2], false);
        G.mode = 'play';
        hideOverlay();
        if (G.player) G.player.hp = HP;
        syncHud();
        return;
      }
      goSelect();
      return;
    }
    G.fortIdx += 1;
    if (G.fortIdx >= FORT.length) goWin();
    else {
      loadStage(FORT[G.fortIdx], false);
      toast(FORT[G.fortIdx].name, '');
    }
  }

  function playerBox() {
    const p = G.player;
    if (p.sliding) return { x: p.x - 10, y: p.y - 10, w: 20, h: 10 };
    return { x: p.x - 7, y: p.y - 22, w: 14, h: 22 };
  }

  function hurt(n, why, srcX) {
    if (!playing() || G.deadT > 0 || G.invuln > 0 || G.lock > 0) return;
    const p = G.player;
    p.hp -= n;
    if (p.hp < 0) p.hp = 0;
    const dir = srcX == null ? -p.face : (p.x < srcX ? -1 : 1);
    p.vx = dir * 160;
    p.vy = -180;
    p.grounded = false;
    p.sliding = false;
    p.charge = 0;
    audio.hurt();
    kick(4.2, 'hit');
    hitStop(0.055);
    screenFlash(MAG, 0.32);
    emit(10, {
      x: p.x, y: p.y - 12, j: 8,
      vx0: -140, vx1: 140, vy0: -200, vy1: 20,
      life: 0.28, r0: 1, r1: 2.8, rgb: MAG
    });
    syncHud();
    if (p.hp <= 0) die(why);
    else G.invuln = INVULN;
  }

  function die(why) {
    if (G.deadT > 0 || !playing()) return;
    if (G.invuln > 0 && why !== 'fall') return;
    G.why = why;
    G.lives -= 1;
    G.deadT = DIE_T;
    G.player.charge = 0;
    G.player.sliding = false;
    audio.death();
    explode(G.player.x, G.player.y - 12, HOT, 1.6);
    kick(6.5, 'die');
    hitStop(0.08);
    screenFlash(HOT, 0.4);
    syncHud();
  }

  function respawn() {
    G.player = makePlayer(G.checkX, G.checkY);
    G.player.hp = HP;
    G.invuln = SPAWN_I;
    G.deadT = 0;
    G.shots = [];
    G.eshots = [];
    G.weapon = G.weapon;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const map = { hit: '被击中了', fall: '坠入深渊了', spike: '触上刺了', jet: '被烧到了' };
    const why = map[G.why] || '被击中了';
    showOverlay('lose', why, '分数 ' + G.score + ' · 连击最高 ×' + G.maxCombo + '<br />R 重开同一模式');
    syncHud();
  }

  function goWin() {
    G.mode = 'win';
    addScore(SCORE.clear, G.player ? G.player.x : 320, 120, GOLD);
    audio.win();
    kick(2, 'win-flash');
    screenFlash(GOLD, 0.4);
    const msg = G.kind === 'fort' ? '要塞捣毁了' : '芯核瓦解了';
    showOverlay('win', msg, '分数 ' + G.score + ' · 连击最高 ×' + G.maxCombo + '<br />首领倒下，武器在手');
    syncHud();
  }

  function resetRun(kind) {
    G.kind = kind;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    G.weapon = 'buster';
    G.unlocked = { buster: true, volt: false, blaze: false, frost: false };
    G.energy = { volt: 28, blaze: 28, frost: 28 };
    G.beaten = { volt: false, blaze: false, frost: false };
    G.nextLife = LIFE_EVERY;
    G.fortIdx = 0;
    G.sel = 0;
  }

  function goSelect() {
    G.mode = 'select';
    G.kind = 'select';
    hideOverlay();
    G.shots = [];
    G.lockCam = false;
    G.camX = 0;
    G.camY = 0;
    G.lock = 0;
    G.getT = 0;
    let i;
    for (i = 0; i < MASTERS.length; i++) {
      if (!G.beaten[MASTERS[i].id]) {
        G.sel = i;
        break;
      }
    }
    syncHud();
  }

  function enterMaster(i) {
    const m = MASTERS[i];
    if (!m) return;
    if (G.beaten[m.id]) {
      toast('已经击败', 'gold');
      audio.empty();
      return;
    }
    audio.start();
    hideOverlay();
    G.mode = 'play';
    G.kind = 'select';
    keys.fire = false;
    firePrev = true;
    loadStage(STAGES[m.id], false);
    toast(m.name + ' · ' + m.en, '');
  }

  function startGame(kind) {
    audio.ensure();
    resetRun(kind);
    hideOverlay();
    if (kind === 'fort') {
      G.mode = 'play';
      loadStage(FORT[0], false);
      toast('要塞 · 外廊', '');
    } else {
      goSelect();
    }
    audio.start();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'select';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.weapon = 'buster';
    loadStage(STAGES.volt, true);
    G.invuln = 99;
    showOverlay('title', '洛克', '侧向跑跳，空格射击，按住充能。<br />击败首领，夺走武器，冲进要塞。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('select');
    else startGame(G.kind || 'select');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('select');
    else if (G.mode === 'select') enterMaster(G.sel);
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function demoThink(dt) {
    const p = G.player;
    if (!p) return;
    demo.t += dt;
    demo.r = true;
    demo.l = false;
    demo.d = false;
    demo.u = pitAhead(p.x, p.y, 1) && p.grounded;
    if (demo.phase === 0) {
      demo.fire = demo.t < 0.16;
      if (demo.t > 0.55) { demo.phase = 1; demo.t = 0; }
    } else {
      demo.fire = true;
      if (p.charge > 1.05) {
        tryShoot(2);
        p.charge = 0;
        demo.phase = 0;
        demo.t = 0;
        demo.fire = false;
      }
    }
    if (p.x > G.levelW - 280) {
      G.player = makePlayer(70, GY);
      G.camX = 0;
      G.weapon = 'buster';
    }
  }

  function updateSelect(dt) {
    G.clock += dt;
  }

  function updatePlayer(dt) {
    const p = G.player;
    if (!p) return;
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

    const wantSlide = p.grounded && inD() && !p.sliding && (ax !== 0 || Math.abs(p.vx) > 20);
    if (wantSlide) {
      p.sliding = true;
      p.slideT = SLIDE_T;
      p.face = ax || p.face;
      if (playing()) audio.slide();
      emit(8, {
        x: p.x, y: p.y, j: 6,
        vx0: -p.face * 40, vx1: -p.face * 160, vy0: -20, vy1: 30,
        life: 0.22, r0: 1, r1: 2.4, rgb: CYN, g: 180
      });
      hitStop(0.028);
      kick(1.4, 'thump');
    }
    if (p.sliding) {
      p.slideT -= dt;
      p.h = 12;
      p.vx = p.face * SLIDE_SPD;
      p.x += p.vx * dt;
      if (p.slideT <= 0 || inU()) p.sliding = false;
    } else {
      p.h = PH;
      const spd = WALK * (p.grounded ? 1 : AIR);
      p.vx = ax * spd;
      p.x += p.vx * dt;
    }

    p.x = clamp(p.x, 16, G.levelW - 16);
    if (G.boss && G.boss.active && !G.boss.dead) {
      if (p.x < arenaL()) p.x = arenaL();
    }

    if (inU() && !p.sliding) G.jumpBuf = BUFFER;
    else G.jumpBuf -= dt;
    if (G.jumpBuf < 0) G.jumpBuf = 0;

    const canJump = (p.grounded || p.coyote > 0) && !p.sliding;
    if (G.jumpBuf > 0 && canJump) {
      p.vy = -JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      G.jumpBuf = 0;
      p.squash = 0.78;
      p.sliding = false;
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

    if (p.y > VH + 90) die('fall');

    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    if (ax && p.grounded && !p.sliding) p.run += dt * 10;
    else p.run += dt * 2;
    if (p.pose > 0) p.pose -= dt;

    if (p.grounded && p.x > G.checkX + 80) {
      const ck = platUnder(p.x, p.y, null);
      if (ck && ck.base && p.x > ck.x + 36 && p.x < ck.x + ck.w - 36) {
        G.checkX = p.x;
        G.checkY = p.y;
      }
    }

    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;

    const held = fireHeld();
    const pressed = held && !firePrev;
    const released = !held && firePrev;

    if (G.weapon === 'buster') {
      if (pressed) tryShoot(0);
      if (held) {
        p.charge += dt;
        if (p.charge > 2.4) p.charge = 2.4;
        if (p.charge > 0.18 && playing()) {
          chargeHum += dt;
          if (chargeHum > 0.12) {
            chargeHum = 0;
            audio.chargeTick(Math.min(1, p.charge / CHARGE2));
          }
          if (Math.random() < dt * 14) {
            emit(1, {
              x: p.x, y: p.y - 14, j: 12,
              vx0: -30, vx1: 30, vy0: -40, vy1: 20,
              life: 0.28, r0: 1, r1: 2.2,
              rgb: p.charge >= CHARGE2 ? WHT : CYN, g: -40
            });
          }
        }
        if (p.charge >= CHARGE2 && !p.charged) {
          p.charged = true;
          G.chargeFlash = 0.5;
          if (playing()) {
            audio.chargeFull();
            toast('充能完毕', '');
            kick(2.2, 'charge');
            screenFlash(CYN, 0.22);
          }
        }
      }
      if (released) {
        if (p.charge >= CHARGE2) tryShoot(2);
        else if (p.charge >= CHARGE1) tryShoot(1);
        p.charge = 0;
        p.charged = false;
      }
      if (!held) {
        p.charge = 0;
        p.charged = false;
      }
    } else {
      p.charge = 0;
      p.charged = false;
      if (held) tryShoot(0);
    }

    if (G.mode === 'title' && p.charge > 1.05) {
      tryShoot(2);
      p.charge = 0;
      p.charged = false;
    }

    let i;
    for (i = 0; i < G.pickups.length; i++) {
      const u = G.pickups[i];
      if (u.taken) continue;
      u.t += dt;
      if (hypot(p.x - u.x, (p.y - 12) - u.y) < 18) takePickup(u);
    }

    if (G.boss && !G.boss.active && !G.boss.dead && p.x > G.doorX) {
      G.boss.active = true;
      G.lockCam = true;
      toast(G.boss.name + ' 现身', 'gold');
      audio.boss();
      kick(3, 'boom');
      screenFlash(G.boss.rgb, 0.3);
    }

    if (playing() && !G.boss && G.getT <= 0 && G.lock <= 0 && p.x > G.levelW - 70) {
      G.getT = 1.05;
      G.lock = 1.05;
      G.getName = '';
      toast('闸门打开', 'gold');
      audio.steal();
      kick(2.2, 'win-flash');
      screenFlash(CYN, 0.28);
    }
  }

  function takePickup(u) {
    u.taken = true;
    if (u.kind === 'hp') {
      G.player.hp = Math.min(HP, G.player.hp + 10);
      toast('能量+', 'gold');
      audio.ping();
    } else if (u.kind === 'en') {
      const k = G.weapon === 'buster' ? 'volt' : G.weapon;
      if (k !== 'buster') G.energy[k] = Math.min(28, (G.energy[k] || 0) + 8);
      toast('武器能量+', '');
      audio.ping();
    } else if (WEAPONS[u.kind]) {
      G.unlocked[u.kind] = true;
      G.energy[u.kind] = 28;
      G.weapon = u.kind;
      toast('获得' + WEAPONS[u.kind].name, 'gold');
      audio.steal();
      addScore(400, u.x, u.y, WEAPONS[u.kind].rgb);
    }
    juice(u.x, u.y, GOLD, 0.8);
    kick(2.4, 'pickup');
    syncHud();
  }

  function pickVolt(b) {
    const opts = ['walk', 'shoot', 'jumpshot', 'teleport', 'slam'];
    let st = opts[(Math.random() * opts.length) | 0];
    if (st === b.st) st = opts[(opts.indexOf(st) + 1) % opts.length];
    b.st = st;
    b.stT = st === 'walk' ? 0.65 : st === 'slam' ? 0.55 : 0.85;
    b.didJump = false;
    b.slammed = false;
    b.warped = false;
    b.shots = 0;
    b.cd = 0.12;
    b.alpha = 1;
  }

  function pickBlaze(b) {
    const opts = ['wait', 'arc', 'dash', 'rain', 'wave'];
    let st = opts[(Math.random() * opts.length) | 0];
    if (st === b.st) st = opts[(opts.indexOf(st) + 1) % opts.length];
    b.st = st;
    b.stT = st === 'dash' ? 0.7 : 0.9;
    b.didJump = false;
    b.shots = 0;
    b.cd = 0.1;
  }

  function pickFrost(b) {
    const opts = ['wait', 'slide', 'shard', 'icicle', 'wall'];
    let st = opts[(Math.random() * opts.length) | 0];
    if (st === b.st) st = opts[(opts.indexOf(st) + 1) % opts.length];
    b.st = st;
    b.stT = st === 'slide' ? 0.7 : 0.85;
    b.didJump = false;
    b.shots = 0;
    b.cd = 0.1;
  }

  function pickCore(b) {
    const opts = ['closed', 'open', 'spray', 'beam', 'orbs'];
    let st = opts[(Math.random() * opts.length) | 0];
    if (st === b.st) st = opts[(opts.indexOf(st) + 1) % opts.length];
    if (b.hp < b.max * 0.45 && Math.random() < 0.4) st = 'spray';
    b.st = st;
    b.stT = st === 'closed' ? 0.7 : 1.05;
    b.shots = 0;
    b.cd = 0.15;
  }

  function aiVolt(b, dt) {
    const p = G.player;
    b.stT -= dt;
    if (b.st === 'wait') {
      if (b.stT <= 0) pickVolt(b);
    } else if (b.st === 'walk') {
      b.face = p.x > b.x ? 1 : -1;
      b.x += b.face * 90 * dt;
      if (b.stT <= 0) pickVolt(b);
    } else if (b.st === 'shoot') {
      b.face = p.x > b.x ? 1 : -1;
      if (b.cd <= 0) {
        bossShot(b, b.face * 300, 0, 'bolt', GOLD, 2);
        audio.shot('volt', 0);
        b.cd = 0.2;
        b.shots += 1;
        if (b.shots >= 3) pickVolt(b);
      }
    } else if (b.st === 'jumpshot') {
      if (!b.didJump) { b.vy = -490; b.didJump = true; b.grounded = false; }
      if (b.vy > 40 && b.shots === 0) {
        bossShot(b, -150, 210, 'bolt', GOLD, 2);
        bossShot(b, 0, 240, 'bolt', GOLD, 2);
        bossShot(b, 150, 210, 'bolt', GOLD, 2);
        audio.shot('volt', 1);
        b.shots = 1;
      }
      if (b.grounded && b.didJump) pickVolt(b);
    } else if (b.st === 'teleport') {
      if (!b.warped) {
        b.alpha = Math.max(0, b.alpha - dt * 3.5);
        if (b.alpha <= 0) {
          b.x = clamp(p.x + (Math.random() < 0.5 ? 100 : -100), arenaL() + 20, arenaR() - 20);
          b.y = GY;
          b.warped = true;
          popSpark(b.x, b.y - 20, GOLD, 20);
        }
      } else {
        b.alpha = Math.min(1, b.alpha + dt * 3.5);
        if (b.alpha >= 1) pickVolt(b);
      }
    } else if (b.st === 'slam') {
      if (!b.didJump) { b.vy = -530; b.didJump = true; b.grounded = false; }
      if (b.vy > 60) b.vy = 640;
      if (b.grounded && b.didJump && !b.slammed) {
        b.slammed = true;
        bossShot(b, -220, 0, 'wave', GOLD, 3);
        bossShot(b, 220, 0, 'wave', GOLD, 3);
        kick(5, 'boom');
        audio.boom();
        emit(16, {
          x: b.x, y: b.y, j: 18,
          vx0: -260, vx1: 260, vy0: -200, vy1: -20,
          life: 0.4, r0: 1.5, r1: 3.5, rgb: GOLD
        });
        b.stT = 0.35;
      }
      if (b.slammed && b.stT <= 0) pickVolt(b);
    }
  }

  function aiBlaze(b, dt) {
    const p = G.player;
    b.stT -= dt;
    if (b.st === 'wait') {
      b.face = p.x > b.x ? 1 : -1;
      if (b.stT <= 0) pickBlaze(b);
    } else if (b.st === 'arc') {
      b.face = p.x > b.x ? 1 : -1;
      if (!b.didJump) { b.vy = -420; b.didJump = true; }
      if (b.cd <= 0 && b.shots < 2) {
        bossShot(b, b.face * 180, -120, 'fire', ORG, 2);
        audio.shot('blaze', 0);
        b.cd = 0.22;
        b.shots += 1;
      }
      if (b.grounded && b.didJump && b.shots >= 2) pickBlaze(b);
    } else if (b.st === 'dash') {
      if (b.shots === 0) { b.face = p.x > b.x ? 1 : -1; b.shots = 1; }
      b.x += b.face * 280 * dt;
      if (Math.random() < dt * 18) {
        emit(2, {
          x: b.x, y: b.y - 10, j: 6,
          vx0: -b.face * 40, vx1: -b.face * 120, vy0: -40, vy1: 10,
          life: 0.28, r0: 1.4, r1: 3, rgb: ORG, g: 80
        });
      }
      if (b.x < arenaL() || b.x > arenaR() || b.stT <= 0) pickBlaze(b);
    } else if (b.st === 'rain') {
      if (!b.didJump) { b.vy = -500; b.didJump = true; }
      if (b.vy > -40 && b.shots < 5 && b.cd <= 0) {
        bossShot(b, rand(-80, 80), 80, 'fire', ORG, 2);
        audio.shot('blaze', 0);
        b.shots += 1;
        b.cd = 0.12;
      }
      if (b.grounded && b.didJump) pickBlaze(b);
    } else if (b.st === 'wave') {
      if (b.shots === 0 && b.grounded) {
        bossShot(b, -200, 0, 'wave', ORG, 3);
        bossShot(b, 200, 0, 'wave', ORG, 3);
        audio.shot('blaze', 1);
        kick(3.2, 'thump');
        b.shots = 1;
        b.stT = 0.45;
      }
      if (b.stT <= 0) pickBlaze(b);
    }
  }

  function aiFrost(b, dt) {
    const p = G.player;
    b.stT -= dt;
    if (b.st === 'wait') {
      b.face = p.x > b.x ? 1 : -1;
      if (b.stT <= 0) pickFrost(b);
    } else if (b.st === 'slide') {
      if (b.shots === 0) { b.face = p.x > b.x ? 1 : -1; b.shots = 1; }
      b.x += b.face * 300 * dt;
      b.h = 22;
      if (b.x < arenaL() || b.x > arenaR() || b.stT <= 0) {
        b.h = 40;
        pickFrost(b);
      }
    } else if (b.st === 'shard') {
      b.face = p.x > b.x ? 1 : -1;
      if (b.cd <= 0 && b.shots < 3) {
        const ang = -0.25 + b.shots * 0.25;
        bossShot(b, b.face * 280 * Math.cos(ang), 280 * Math.sin(ang), 'ice', ICE, 2);
        audio.shot('frost', 0);
        b.cd = 0.16;
        b.shots += 1;
      }
      if (b.shots >= 3 && b.stT <= 0.2) pickFrost(b);
    } else if (b.st === 'icicle') {
      if (!b.didJump) { b.vy = -470; b.didJump = true; }
      if (b.vy > 20 && b.shots === 0) {
        bossShot(b, -40, 260, 'ice', ICE, 2);
        bossShot(b, 40, 260, 'ice', ICE, 2);
        bossShot(b, 0, 280, 'ice', ICE, 2);
        audio.shot('frost', 1);
        b.shots = 1;
      }
      if (b.grounded && b.didJump) pickFrost(b);
    } else if (b.st === 'wall') {
      if (b.shots === 0) {
        b.face = p.x > b.x ? 1 : -1;
        spawnShot({
          x: b.x + b.face * 20, y: b.y - 18, vx: b.face * 140, vy: 0,
          kind: 'ice', rgb: ICE, dmg: 3, mine: false, life: 2.4, r: 8
        });
        audio.shot('frost', 1);
        b.shots = 1;
      }
      if (b.stT <= 0) pickFrost(b);
    }
  }

  function aiCore(b, dt) {
    const p = G.player;
    b.stT -= dt;
    b.x = lerp(b.x, G.levelW - 110, 1 - Math.pow(0.02, dt));
    b.y = GY - 8 + Math.sin(G.clock * 1.4) * 10;
    b.grounded = true;
    b.vy = 0;
    if (b.st === 'closed') {
      if (b.stT <= 0) pickCore(b);
    } else if (b.st === 'open') {
      if (b.cd <= 0) {
        const dx = p.x - b.x;
        const dy = (p.y - 14) - (b.y - 20);
        const len = Math.max(40, hypot(dx, dy));
        bossShot(b, dx / len * 260, dy / len * 260, 'bolt', MAG, 2);
        audio.shot('buster', 1);
        b.cd = b.hp < b.max * 0.5 ? 0.32 : 0.48;
      }
      if (b.stT <= 0) pickCore(b);
    } else if (b.st === 'spray') {
      if (b.cd <= 0 && b.shots < 8) {
        const a = (b.shots / 8) * TAU;
        bossShot(b, Math.cos(a) * 220, Math.sin(a) * 220, 'bolt', PNK, 2);
        b.shots += 1;
        b.cd = 0.08;
        audio.shot('volt', 0);
      }
      if (b.shots >= 8 && b.stT <= 0.2) pickCore(b);
    } else if (b.st === 'beam') {
      if (b.shots === 0) {
        bossShot(b, -420, 0, 'wave', CYN, 3);
        audio.shot('buster', 2);
        b.shots = 1;
      }
      if (b.stT <= 0) pickCore(b);
    } else if (b.st === 'orbs') {
      if (b.cd <= 0 && b.shots < 3) {
        bossShot(b, -160, -80 + b.shots * 80, 'fire', ORG, 2);
        bossShot(b, -160, -80 + b.shots * 80, 'ice', ICE, 2);
        b.shots += 1;
        b.cd = 0.2;
        audio.shot('blaze', 0);
      }
      if (b.stT <= 0) pickCore(b);
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead || !b.active) return;
    const mul = spdMul();
    if (b.intro > 0) {
      b.intro -= dt;
      b.x = lerp(b.x, G.levelW - 130, 1 - Math.pow(0.04, dt));
      if (b.intro <= 0) {
        if (b.kind === 'volt') pickVolt(b);
        else if (b.kind === 'blaze') pickBlaze(b);
        else if (b.kind === 'frost') pickFrost(b);
        else pickCore(b);
      }
      return;
    }
    b.t += dt;
    b.cd -= dt * mul;
    if (b.hitN > 0) b.hitN -= dt;
    if (b.kind === 'volt') aiVolt(b, dt * mul);
    else if (b.kind === 'blaze') aiBlaze(b, dt * mul);
    else if (b.kind === 'frost') aiFrost(b, dt * mul);
    else aiCore(b, dt * mul);

    if (b.kind !== 'core') {
      b.vy += GRAV * dt;
      if (b.vy > MAX_FALL) b.vy = MAX_FALL;
      const y0 = b.y;
      let y1 = b.y + b.vy * dt;
      b.grounded = false;
      if (b.vy >= 0) {
        const plat = landOn(b.x, y0, y1, null);
        if (plat) {
          y1 = plat.y;
          b.vy = 0;
          b.grounded = true;
        }
      }
      b.y = y1;
      b.x = clamp(b.x, arenaL(), arenaR());
    }

    const pb = playerBox();
    if (playing() && G.deadT <= 0 && b.alpha > 0.6) {
      if (aabb(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.4, b.y - b.h, b.w * 0.8, b.h)) {
        hurt(4, 'hit', b.x);
      }
    }
  }

  function onScreen(x) {
    return x > G.camX - 60 && x < G.camX + VW + 60;
  }

  function updateEnts(dt) {
    const mul = spdMul();
    const p = G.player;
    const pb = playerBox();
    let i;
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (e.hitN > 0) e.hitN -= dt;
      if (e.frozen > 0) {
        e.frozen -= dt;
        if (playing() && aabb(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
          hurt(2, 'hit', e.x);
        }
        continue;
      }
      e.t += dt * mul;
      e.fire -= dt * mul;
      if (e.kind === 'spike') {
        if (playing() && aabb(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.5, e.y - 12, e.w, 14)) {
          hurt(28, 'spike', e.x);
        }
        continue;
      }
      if (e.kind === 'jet') {
        const per = 1.6;
        e.on = (e.t % per) < 0.7;
        if (e.on && playing() && aabb(pb.x, pb.y, pb.w, pb.h, e.x - 8, e.y - 46, 16, 46)) {
          hurt(3, 'jet', e.x);
        }
        continue;
      }
      if (!onScreen(e.x) && !(G.boss && G.boss.active)) continue;
      if (e.kind === 'met') {
        e.shut = (e.t % 2.1) > 0.7;
        if (!e.shut && e.fire <= 0 && p) {
          e.face = p.x > e.x ? 1 : -1;
          enemyShot(e, e.face * 220, 0, 2);
          e.fire = 0.9;
        }
      } else if (e.kind === 'flyer') {
        if (e.homeY == null) e.homeY = e.y;
        const x0 = e.a || e.x;
        const x1 = e.b || e.x + 80;
        e.x = (x0 + x1) * 0.5 + Math.sin(e.t * 1.4) * (Math.abs(x1 - x0) * 0.5);
        e.y = e.homeY + Math.sin(e.t * 2.2) * 14;
        if (e.fire <= 0 && p && Math.abs(e.x - p.x) < 220) {
          enemyShot(e, 0, 180, 2);
          e.fire = 1.4;
        }
      } else if (e.kind === 'turret') {
        if (e.fire <= 0 && p && onScreen(e.x)) {
          const dx = p.x - e.x;
          const dy = (p.y - 14) - (e.y - 10);
          const len = Math.max(30, hypot(dx, dy));
          enemyShot(e, dx / len * 240, dy / len * 240, 2);
          e.fire = 1.25;
        }
      } else if (e.kind === 'walker') {
        if (!e.vx) e.vx = 70;
        e.x += e.vx * dt * mul;
        const left = e.a || e.x - 40;
        const right = e.b || e.x + 40;
        if (e.x < left) { e.x = left; e.vx = Math.abs(e.vx); e.face = 1; }
        if (e.x > right) { e.x = right; e.vx = -Math.abs(e.vx || 70); e.face = -1; }
        if (!platUnder(e.x + (e.vx > 0 ? 8 : -8), e.y, null)) e.vx *= -1;
      }

      if (playing() && G.deadT <= 0) {
        if (aabb(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.45, e.y - e.h, e.w * 0.9, e.h)) {
          hurt(3, 'hit', e.x);
        }
      }
    }
  }

  function updateShots(dt) {
    const p = G.player;
    const pb = p ? playerBox() : { x: 0, y: 0, w: 0, h: 0 };
    let i, j;
    for (i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (s.dead) {
        G.shots.splice(i, 1);
        continue;
      }
      if (s.g) s.vy += s.g * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.bounce > 0 && s.vy > 0) {
        const plat = landOn(s.x, s.y - 4, s.y + 4, null);
        if (plat) {
          s.y = plat.y - 4;
          s.vy *= -0.78;
          s.bounce -= 1;
          emit(3, {
            x: s.x, y: s.y, j: 4,
            vx0: -40, vx1: 40, vy0: -80, vy1: -10,
            life: 0.16, r0: 1, r1: 2, rgb: s.rgb, g: 100
          });
        }
      }
      if (s.life <= 0 || s.x < G.camX - 40 || s.x > G.camX + VW + 40 || s.y < -40 || s.y > VH + 60) {
        if (s.kind === 'blaze' && s.mine) {
          emit(8, {
            x: s.x, y: s.y, j: 8,
            vx0: -100, vx1: 100, vy0: -140, vy1: 20,
            life: 0.28, r0: 1.4, r1: 3.2, rgb: ORG
          });
        }
        G.shots.splice(i, 1);
        continue;
      }

      if (s.mine) {
        let hit = false;
        for (j = 0; j < G.ents.length; j++) {
          const e = G.ents[j];
          if (e.dead || e.kind === 'spike' || e.kind === 'jet') continue;
          if (hypot(s.x - e.x, s.y - (e.y - e.h * 0.5)) < 10 + s.r) {
            if (hitEnt(e, s)) {
              hit = true;
              if (s.pierce > 0) s.pierce -= 1;
              else s.dead = true;
              break;
            }
          }
        }
        if (!hit && G.boss && !G.boss.dead && G.boss.active) {
          const b = G.boss;
          if (hypot(s.x - b.x, s.y - (b.y - b.h * 0.5)) < b.w * 0.45 + s.r) {
            if (hitBoss(b, s)) {
              if (s.pierce > 0) s.pierce -= 1;
              else s.dead = true;
            }
          }
        }
      } else if (playing() && G.deadT <= 0) {
        if (aabb(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2, pb.x, pb.y, pb.w, pb.h)) {
          hurt(s.dmg, 'hit', s.x);
          s.dead = true;
        }
      }
    }
  }

  function updateFx(dt) {
    let i;
    for (i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (q.life <= 0) particles.splice(i, 1);
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
      const f = floats[i];
      f.t += dt;
      f.y -= f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (i = 0; i < mist.length; i++) {
      mist[i].x -= mist[i].v * dt;
      if (mist[i].x < G.camX - 40) mist[i].x = G.camX + VW + rand(20, 200);
    }
  }

  function updateCam(dt) {
    const p = G.player;
    if (!p) return;
    let tx = p.x - VW * 0.38;
    if (G.lockCam) tx = G.levelW - VW;
    tx = clamp(tx, 0, Math.max(0, G.levelW - VW));
    let ty = p.y - 250;
    ty = clamp(ty, 0, 40);
    const k = 1 - Math.pow(0.0008, dt);
    G.camX = lerp(G.camX, tx, k);
    G.camY = lerp(G.camY, ty, k);
  }

  function update(dt) {
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    G.t += dt;
    G.clock += dt;
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0002, dt));
    if (G.chargeFlash > 0) G.chargeFlash -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    if (G.lock > 0) G.lock -= dt;
    if (G.getT > 0) {
      G.getT -= dt;
      if (G.player) {
        emit(2, {
          x: G.player.x, y: G.player.y - 16, j: 16,
          vx0: -40, vx1: 40, vy0: -80, vy1: 10,
          life: 0.4, r0: 1.2, r1: 2.8, rgb: GOLD, g: 40
        });
      }
      if (G.getT <= 0) afterGet();
    }
    if (G.invuln > 0 && G.mode === 'play') G.invuln -= dt;

    if (G.mode === 'select') {
      updateSelect(dt);
      updateFx(dt);
      return;
    }
    if (!live() && G.mode !== 'lose' && G.mode !== 'win') return;
    if (G.mode === 'title') demoThink(dt);
    if (overlayOpen() && G.mode !== 'title') {
      updateFx(dt);
      return;
    }
    if (live()) {
      updatePlayer(dt);
      if (G.lock <= 0 && G.deadT <= 0) {
        updateEnts(dt);
        updateBoss(dt);
      }
      updateShots(dt);
      updateCam(dt);
    }
    updateFx(dt);
    firePrev = fireHeld();
  }

  function themeRgb() {
    if (G.theme === 'blaze' || G.theme === 'hall') return ORG;
    if (G.theme === 'frost') return ICE;
    if (G.theme === 'core') return MAG;
    if (G.theme === 'fort') return HOT;
    return GOLD;
  }

  function drawBg() {
    const rgb = themeRgb();
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (G.theme === 'blaze') {
      g.addColorStop(0, '#1a0806');
      g.addColorStop(1, '#2a1008');
    } else if (G.theme === 'frost') {
      g.addColorStop(0, '#07141c');
      g.addColorStop(1, '#0a1c28');
    } else if (G.theme === 'core') {
      g.addColorStop(0, '#100618');
      g.addColorStop(1, '#080410');
    } else if (G.theme === 'fort' || G.theme === 'hall') {
      g.addColorStop(0, '#081018');
      g.addColorStop(1, '#0c1420');
    } else {
      g.addColorStop(0, '#06141c');
      g.addColorStop(1, '#082028');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    ctx.strokeStyle = rgba(rgb, 0.07);
    ctx.lineWidth = 1;
    let gx;
    for (gx = ((G.camX / 48) | 0) * 48; gx < G.camX + VW + 48; gx += 48) {
      ctx.beginPath();
      ctx.moveTo(sx(gx), oy);
      ctx.lineTo(sx(gx), oy + VH * scale);
      ctx.stroke();
    }
    let i;
    for (i = 0; i < mist.length; i++) {
      const m = mist[i];
      ctx.fillStyle = rgba(rgb, m.a);
      ctx.beginPath();
      ctx.arc(sx(m.x), sy(m.y), m.s * scale, 0, TAU);
      ctx.fill();
    }
    if (G.lockCam) {
      ctx.fillStyle = rgba(MAG, 0.18 + Math.sin(G.clock * 8) * 0.08);
      ctx.fillRect(sx(G.levelW - VW), oy, 6 * scale, VH * scale);
    }
  }

  function drawPlats() {
    const rgb = themeRgb();
    let i;
    for (i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      const x = sx(p.x);
      const y = sy(p.y);
      const w = p.w * scale;
      const h = p.h * scale;
      ctx.fillStyle = p.base ? '#0c1820' : '#121c28';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(rgb, p.base ? 0.85 : 0.7);
      ctx.fillRect(x, y, w, 2.4 * scale);
      ctx.fillStyle = rgba(WHT, 0.16);
      ctx.fillRect(x + 2 * scale, y + 2.4 * scale, w - 4 * scale, 1.2 * scale);
      if (p.base) {
        const n = Math.max(2, (p.w / 32) | 0);
        let k;
        for (k = 0; k <= n; k++) {
          ctx.fillStyle = k % 2 ? rgba(rgb, 0.18) : rgba(HOT, 0.1);
          ctx.fillRect(x + (k / n) * w, y, 2 * scale, 6 * scale);
        }
      }
    }
    const doorX = G.boss ? G.levelW - 48 : G.levelW - 28;
    const dx = sx(doorX);
    const pulse = 0.45 + Math.sin(G.clock * 5) * 0.2;
    ctx.fillStyle = rgba(G.boss && G.boss.active ? MAG : CYN, pulse);
    ctx.fillRect(dx, sy(GY - 78), 10 * scale, 78 * scale);
    ctx.fillStyle = rgba(WHT, 0.35);
    ctx.fillRect(dx + 3 * scale, sy(GY - 70), 4 * scale, 24 * scale);
  }

  function drawShot(s) {
    const x = sx(s.x);
    const y = sy(s.y);
    ctx.save();
    ctx.translate(x, y);
    if (s.lv >= 2) {
      ctx.fillStyle = rgba(CYN, 0.28);
      ctx.beginPath();
      ctx.arc(0, 0, 12 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 7 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.beginPath();
      ctx.arc(-s.vx * 0.01 * scale, 0, 4 * scale, 0, TAU);
      ctx.fill();
    } else if (s.kind === 'blaze' || s.kind === 'fire') {
      ctx.fillStyle = rgba(ORG, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, s.r * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(-1 * scale, -1 * scale, s.r * 0.45 * scale, 0, TAU);
      ctx.fill();
    } else if (s.kind === 'frost' || s.kind === 'ice') {
      ctx.fillStyle = rgba(ICE, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -s.r * 1.4 * scale);
      ctx.lineTo(s.r * scale, 0);
      ctx.lineTo(0, s.r * 1.4 * scale);
      ctx.lineTo(-s.r * scale, 0);
      ctx.closePath();
      ctx.fill();
    } else if (s.kind === 'wave') {
      ctx.fillStyle = rgba(s.rgb, 0.9);
      ctx.fillRect(-8 * scale, -3 * scale, 16 * scale, 6 * scale);
    } else {
      ctx.fillStyle = rgba(s.rgb || GOLD, 0.95);
      ctx.fillRect(-4 * scale, -2 * scale, 9 * scale, 4 * scale);
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.fillRect(1 * scale, -1 * scale, 4 * scale, 2 * scale);
    }
    ctx.restore();
  }

  function drawPickup(u) {
    if (u.taken) return;
    const bob = Math.sin(G.clock * 4 + u.t) * 3;
    const x = sx(u.x);
    const y = sy(u.y + bob);
    let rgb = GOLD;
    let ch = 'E';
    if (u.kind === 'hp') { rgb = LEAF; ch = '+'; }
    else if (u.kind === 'en') { rgb = CYN; ch = 'W'; }
    else if (WEAPONS[u.kind]) { rgb = WEAPONS[u.kind].rgb; ch = WEAPONS[u.kind].name.charAt(0); }
    ctx.fillStyle = rgba(rgb, 0.18);
    ctx.beginPath();
    ctx.arc(x, y, 12 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.fillRect(x - 7 * scale, y - 7 * scale, 14 * scale, 14 * scale);
    ctx.strokeStyle = rgba(WHT, 0.7);
    ctx.lineWidth = 1.2 * scale;
    ctx.strokeRect(x - 7 * scale, y - 7 * scale, 14 * scale, 14 * scale);
    ctx.fillStyle = '#041018';
    ctx.font = 'bold ' + (10 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch, x, y + 0.5 * scale);
  }

  function drawMega(p, opt) {
    if (opt.blink && ((G.t * 18) | 0) % 2 === 0) return;
    const s = scale * (opt.size || 1);
    const sq = opt.squash || 1;
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.scale(p.face, sq);
    const slide = opt.slide;
    const leg = Math.sin(opt.run || 0) * (slide ? 1 : 5) * s;
    if (slide) {
      ctx.fillStyle = rgba(BLU, 0.95);
      ctx.fillRect(-12 * s, -10 * s, 22 * s, 10 * s);
      ctx.fillStyle = rgba(HOT, 0.95);
      ctx.beginPath();
      ctx.ellipse(6 * s, -10 * s, 6 * s, 5.4 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#041018';
      ctx.fillRect(6 * s, -11.4 * s, 5 * s, 2.2 * s);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(10 * s, -8 * s, 10 * s, 2.4 * s);
    } else {
      ctx.strokeStyle = rgba(BLU, 0.95);
      ctx.lineWidth = 2.2 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-3 * s, -6 * s);
      ctx.lineTo(-4 * s + (opt.grounded ? -leg : 2 * s), 0);
      ctx.moveTo(3 * s, -6 * s);
      ctx.lineTo(4 * s + (opt.grounded ? leg : -2 * s), 0);
      ctx.stroke();
      ctx.fillStyle = rgba(BLU, 0.95);
      ctx.fillRect(-6.4 * s, -22 * s, 12.8 * s, 16 * s);
      ctx.fillStyle = rgba(HOT, 0.35);
      ctx.fillRect(-6.4 * s, -22 * s, 12.8 * s, 2 * s);
      ctx.fillStyle = rgba(HOT, 0.98);
      ctx.beginPath();
      ctx.ellipse(0, -28 * s, 7.2 * s, 7.4 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.55);
      ctx.beginPath();
      ctx.ellipse(0, -30.4 * s, 4.2 * s, 2.2 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#041018';
      ctx.fillRect(0.6 * s, -29.2 * s, 6.4 * s, 2.4 * s);
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fillRect(5 * s, -16 * s, 12 * s, 3.2 * s);
      if (opt.muzzle) {
        ctx.fillStyle = rgba(WHT, 0.95);
        ctx.beginPath();
        ctx.arc(18 * s, -14.4 * s, 4.4 * s, 0, TAU);
        ctx.fill();
      }
    }
    if (opt.charge > CHARGE1) {
      const a = 0.18 + (opt.charge >= CHARGE2 ? 0.22 + Math.sin(G.clock * 22) * 0.12 : 0.08);
      ctx.fillStyle = rgba(opt.charge >= CHARGE2 ? WHT : CYN, a);
      ctx.beginPath();
      ctx.arc(0, -16 * s, (14 + opt.charge * 4) * s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEnt(e) {
    if (e.dead) return;
    if (e.hitN > 0 && ((G.t * 30) | 0) % 2 === 0) return;
    const x = sx(e.x);
    const y = sy(e.y);
    if (e.kind === 'spike') {
      ctx.fillStyle = rgba(MAG, 0.9);
      const n = Math.max(2, (e.w / 8) | 0);
      let k;
      for (k = 0; k < n; k++) {
        const px = x - (e.w * 0.5 - 4 - k * 8) * scale;
        ctx.beginPath();
        ctx.moveTo(px - 5 * scale, y);
        ctx.lineTo(px, y - 12 * scale);
        ctx.lineTo(px + 5 * scale, y);
        ctx.fill();
      }
      return;
    }
    if (e.kind === 'jet') {
      ctx.fillStyle = '#2a1810';
      ctx.fillRect(x - 8 * scale, y - 8 * scale, 16 * scale, 8 * scale);
      if (e.on) {
        ctx.fillStyle = rgba(ORG, 0.55 + Math.sin(G.clock * 20) * 0.2);
        ctx.fillRect(x - 6 * scale, y - 48 * scale, 12 * scale, 42 * scale);
        ctx.fillStyle = rgba(GOLD, 0.8);
        ctx.fillRect(x - 3 * scale, y - 44 * scale, 6 * scale, 36 * scale);
      }
      return;
    }
    if (e.kind === 'flyer') {
      ctx.fillStyle = rgba(PNK, 0.95);
      ctx.beginPath();
      ctx.ellipse(x, y - 6 * scale, 8 * scale, 5 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(ICE, 0.7);
      const flap = Math.sin(G.clock * 12) * 5;
      ctx.fillRect(x - 14 * scale, y - (8 + flap) * scale, 8 * scale, 3 * scale);
      ctx.fillRect(x + 6 * scale, y - (8 - flap) * scale, 8 * scale, 3 * scale);
      return;
    }
    if (e.kind === 'turret') {
      ctx.fillStyle = '#243038';
      ctx.fillRect(x - 10 * scale, y - 16 * scale, 20 * scale, 16 * scale);
      ctx.fillStyle = rgba(HOT, 0.85);
      ctx.fillRect(x - 10 * scale, y - 16 * scale, 20 * scale, 3 * scale);
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.fillRect(x + 4 * scale, y - 12 * scale, 12 * scale, 4 * scale);
      return;
    }
    if (e.kind === 'walker') {
      ctx.fillStyle = rgba(LEAF, 0.9);
      ctx.fillRect(x - 8 * scale, y - 18 * scale, 16 * scale, 18 * scale);
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.fillRect(x - 5 * scale, y - 14 * scale, 6 * scale, 4 * scale);
      return;
    }
    ctx.fillStyle = rgba(e.shut ? BLU : GOLD, 0.95);
    ctx.beginPath();
    ctx.ellipse(x, y - (e.shut ? 8 : 12) * scale, 9 * scale, (e.shut ? 8 : 10) * scale, 0, 0, TAU);
    ctx.fill();
    if (!e.shut) {
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.fillRect(x + 2 * scale, y - 12 * scale, 8 * scale, 3 * scale);
    }
    if (e.frozen > 0) {
      ctx.strokeStyle = rgba(ICE, 0.85);
      ctx.lineWidth = 2 * scale;
      ctx.strokeRect(x - 12 * scale, y - 22 * scale, 24 * scale, 22 * scale);
    }
  }

  function drawBoss() {
    const b = G.boss;
    if (!b || b.dead || (!b.active && G.mode !== 'title')) return;
    if (b.hitN > 0 && ((G.t * 28) | 0) % 2 === 0) return;
    const x = sx(b.x);
    const y = sy(b.y);
    ctx.save();
    ctx.globalAlpha = b.alpha == null ? 1 : b.alpha;
    if (b.kind === 'volt') {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fillRect(x - 16 * scale, y - 38 * scale, 32 * scale, 38 * scale);
      ctx.fillStyle = '#1a1408';
      ctx.fillRect(x - 6 * scale, y - 30 * scale, 14 * scale, 6 * scale);
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.fillRect(x - 2 * scale, y - 48 * scale, 4 * scale, 12 * scale);
      ctx.beginPath();
      ctx.arc(x, y - 50 * scale, 4 * scale, 0, TAU);
      ctx.fill();
    } else if (b.kind === 'blaze') {
      ctx.fillStyle = rgba(ORG, 0.95);
      ctx.fillRect(x - 17 * scale, y - 36 * scale, 34 * scale, 36 * scale);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.moveTo(x - 10 * scale, y - 36 * scale);
      ctx.lineTo(x, y - 54 * scale);
      ctx.lineTo(x + 10 * scale, y - 36 * scale);
      ctx.fill();
      ctx.fillStyle = '#180808';
      ctx.fillRect(x - 5 * scale, y - 26 * scale, 14 * scale, 5 * scale);
    } else if (b.kind === 'frost') {
      ctx.fillStyle = rgba(ICE, 0.95);
      ctx.beginPath();
      ctx.moveTo(x, y - 48 * scale);
      ctx.lineTo(x + 18 * scale, y - 18 * scale);
      ctx.lineTo(x + 10 * scale, y);
      ctx.lineTo(x - 10 * scale, y);
      ctx.lineTo(x - 18 * scale, y - 18 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#082028';
      ctx.fillRect(x - 5 * scale, y - 28 * scale, 12 * scale, 5 * scale);
    } else {
      const open = b.st !== 'closed';
      ctx.fillStyle = rgba(MAG, 0.92);
      ctx.beginPath();
      ctx.arc(x, y - 24 * scale, 26 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, open ? 0.95 : 0.35);
      ctx.beginPath();
      ctx.arc(x - 6 * scale, y - 26 * scale, open ? 10 * scale : 4 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      if (open) {
        ctx.beginPath();
        ctx.arc(x - 4 * scale, y - 26 * scale, 4 * scale, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawFx() {
    let i;
    for (i = 0; i < particles.length; i++) {
      const q = particles[i];
      ctx.fillStyle = rgba(q.rgb, Math.max(0, q.life / q.max));
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, 1 - r.t / 0.4);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 70) * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      ctx.fillStyle = rgba(s.rgb, 1 - s.t / 0.28);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.rad * (1 - s.t / 0.28)) * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.globalAlpha = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = 'bold ' + (f.size * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
      ctx.globalAlpha = 1;
    }
  }

  function drawBars() {
    const p = G.player;
    const hp = p ? Math.max(0, p.hp) : 0;
    const x = 16;
    const y0 = 292;
    ctx.textBaseline = 'alphabetic';
    let i;
    ctx.fillStyle = 'rgba(4,16,24,0.55)';
    ctx.fillRect(hx(x - 4), hy(y0 - 28 * 5 + 2), 16 * scale, 28 * 5 * scale + 8 * scale);
    const hpRgb = hp <= 8 ? MAG : hp <= 16 ? GOLD : LEAF;
    for (i = 0; i < 28; i++) {
      const y = y0 - i * 5;
      ctx.fillStyle = i < hp ? rgba(hpRgb, 0.95) : 'rgba(20,40,52,0.7)';
      ctx.fillRect(hx(x), hy(y), 8 * scale, 4 * scale);
    }
    ctx.fillStyle = rgba(WHT, 0.7);
    ctx.font = 'bold ' + (8 * scale) + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('HP', hx(x - 1), hy(y0 + 14));

    if (G.weapon !== 'buster') {
      const en = G.energy[G.weapon] || 0;
      const rgb = wpnRgb();
      const x2 = 30;
      ctx.fillStyle = 'rgba(4,16,24,0.55)';
      ctx.fillRect(hx(x2 - 4), hy(y0 - 28 * 5 + 2), 16 * scale, 28 * 5 * scale + 8 * scale);
      for (i = 0; i < 28; i++) {
        const y = y0 - i * 5;
        ctx.fillStyle = i < en ? rgba(rgb, 0.95) : 'rgba(20,40,52,0.7)';
        ctx.fillRect(hx(x2), hy(y), 8 * scale, 4 * scale);
      }
      ctx.fillStyle = rgba(rgb, 0.85);
      ctx.fillText('W', hx(x2), hy(y0 + 14));
    }

    if (G.boss && G.boss.active && !G.boss.dead) {
      const b = G.boss;
      const bw = 220;
      const bx = (VW - bw) * 0.5;
      const by = 18;
      ctx.fillStyle = 'rgba(4,16,24,0.7)';
      ctx.fillRect(hx(bx), hy(by), bw * scale, 10 * scale);
      ctx.fillStyle = rgba(b.rgb, 0.95);
      ctx.fillRect(hx(bx), hy(by), bw * (Math.max(0, b.hp) / b.max) * scale, 10 * scale);
      ctx.strokeStyle = rgba(WHT, 0.45);
      ctx.lineWidth = 1;
      ctx.strokeRect(hx(bx), hy(by), bw * scale, 10 * scale);
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.font = 'bold ' + (9 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.name, hx(VW * 0.5), hy(by - 4));
    }

    const ids = WPN_ORDER;
    ctx.font = 'bold ' + (8 * scale) + 'px sans-serif';
    ctx.textAlign = 'right';
    for (i = 0; i < ids.length; i++) {
      const id = ids[i];
      const on = G.weapon === id;
      const have = G.unlocked[id];
      ctx.fillStyle = have ? rgba(on ? WEAPONS[id].rgb : WHT, on ? 0.95 : 0.45) : 'rgba(80,100,110,0.35)';
      ctx.fillText((i + 1) + ' ' + WEAPONS[id].name, hx(VW - 12), hy(VH - 14 - (3 - i) * 11));
    }
  }

  function drawSelect() {
    ctx.fillStyle = '#06141c';
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
    ctx.fillStyle = rgba(HOT, 0.08);
    let gx;
    for (gx = 0; gx < VW; gx += 32) {
      ctx.fillRect(hx(gx), oy, 1 * scale, VH * scale);
    }
    ctx.fillStyle = rgba(WHT, 0.92);
    ctx.font = 'bold ' + (18 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('选择首领', hx(VW * 0.5), hy(54));
    ctx.font = (11 * scale) + 'px sans-serif';
    ctx.fillStyle = rgba(HOT2, 0.8);
    ctx.fillText('击败后夺取武器  ·  全灭进入要塞', hx(VW * 0.5), hy(76));
    let i;
    for (i = 0; i < MASTERS.length; i++) {
      const m = MASTERS[i];
      const cx = 140 + i * 180;
      const cy = 188;
      const on = G.sel === i;
      const done = G.beaten[m.id];
      ctx.fillStyle = rgba(m.rgb, on ? 0.22 : 0.08);
      ctx.beginPath();
      ctx.arc(hx(cx), hy(cy), 54 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(done ? LEAF : m.rgb, on ? 1 : 0.55);
      ctx.lineWidth = (on ? 3 : 1.4) * scale;
      ctx.stroke();
      ctx.fillStyle = rgba(m.rgb, done ? 0.35 : 0.95);
      ctx.beginPath();
      ctx.arc(hx(cx), hy(cy - 6), 22 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#041018';
      ctx.fillRect(hx(cx - 8), hy(cy - 10), 18 * scale, 6 * scale);
      ctx.fillStyle = rgba(WHT, 0.92);
      ctx.font = 'bold ' + (14 * scale) + 'px sans-serif';
      ctx.fillText(m.name, hx(cx), hy(cy + 36));
      ctx.font = (9 * scale) + 'px sans-serif';
      ctx.fillStyle = rgba(m.rgb, 0.8);
      ctx.fillText(done ? '已击败' : m.en, hx(cx), hy(cy + 52));
      if (done) {
        ctx.fillStyle = rgba(LEAF, 0.95);
        ctx.font = 'bold ' + (16 * scale) + 'px sans-serif';
        ctx.fillText('✓', hx(cx), hy(cy - 6));
      }
      if (on && !REDUCE) {
        ctx.strokeStyle = rgba(WHT, 0.35 + Math.sin(G.clock * 6) * 0.2);
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.arc(hx(cx), hy(cy), (54 + Math.sin(G.clock * 5) * 3) * scale, 0, TAU);
        ctx.stroke();
      }
    }
    ctx.fillStyle = rgba(WHT, 0.55);
    ctx.font = (10 * scale) + 'px sans-serif';
    ctx.fillText('← → 选择   空格 / Enter 进入   1 电弧  2 炎心  3 霜刺', hx(VW * 0.5), hy(328));
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#030c12';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = rand(-G.shake, G.shake);
      shy = rand(-G.shake * 0.6, G.shake * 0.6);
    }
    ctx.translate(shx, shy);
    const punch = G.punch || 1;
    if (punch !== 1) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(punch, punch);
      ctx.translate(-W * 0.5, -H * 0.5);
    }
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();

    if (G.mode === 'select') {
      drawSelect();
      ctx.restore();
      return;
    }

    drawBg();
    drawPlats();
    let i;
    for (i = 0; i < G.pickups.length; i++) drawPickup(G.pickups[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBoss();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);

    if (G.player && G.deadT <= 0) {
      drawMega(G.player, {
        run: G.player.run,
        grounded: G.player.grounded,
        squash: G.player.squash,
        slide: G.player.sliding,
        muzzle: G.muzzle > 0,
        charge: G.player.charge,
        blink: G.invuln > 0 && G.mode === 'play'
      });
    }

    drawFx();
    drawBars();

    if (G.getT > 0 && G.getName) {
      ctx.fillStyle = rgba(GOLD, 0.12);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.font = 'bold ' + (22 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('获得武器  ' + G.getName, hx(VW * 0.5), hy(130));
    }

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

  function pointerVirt(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left - ox) / scale,
      y: (e.clientY - r.top - oy) / scale
    };
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (space) keys.fire = down;

    if (down && (isMove || space || k === 'Enter' || (k >= '1' && k <= '9'))) e.preventDefault();
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
    if (G.mode === 'select') {
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
        G.sel = (G.sel + MASTERS.length - 1) % MASTERS.length;
        audio.ping();
        syncHud();
        return;
      }
      if (k === 'ArrowRight' || k === 'd' || k === 'D') {
        G.sel = (G.sel + 1) % MASTERS.length;
        audio.ping();
        syncHud();
        return;
      }
      if (k === '1') { enterMaster(0); return; }
      if (k === '2') { enterMaster(1); return; }
      if (k === '3') { enterMaster(2); return; }
      if (space || k === 'Enter') { enterMaster(G.sel); return; }
    }
    if (k === '1' && G.mode === 'title') {
      startGame('select');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('fort');
      return;
    }
    if (playing() && WPN_KEY[k]) {
      setWeapon(WPN_KEY[k]);
      return;
    }
    if (playing() && k >= '5' && k <= '9') {
      toast('尚未夺取', 'warn');
      audio.empty();
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
    hold(document.getElementById('btn-slide'), function () { keys.d = true; }, function () { keys.d = false; });
    hold(document.getElementById('btn-fire'), function () { keys.fire = true; }, function () { keys.fire = false; });
    const wpn = document.getElementById('btn-wpn');
    if (wpn) {
      wpn.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        audio.ensure();
        if (G.mode === 'select') enterMaster(G.sel);
        else cycleWeapon();
      });
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (G.mode === 'select') {
        const v = pointerVirt(e);
        let i;
        for (i = 0; i < MASTERS.length; i++) {
          const cx = 140 + i * 180;
          const cy = 188;
          if (hypot(v.x - cx, v.y - cy) < 58) {
            G.sel = i;
            enterMaster(i);
            return;
          }
        }
        return;
      }
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

  if (btnSelect) {
    btnSelect.addEventListener('click', function () {
      audio.ensure();
      startGame('select');
    });
  }
  if (btnFort) {
    btnFort.addEventListener('click', function () {
      audio.ensure();
      startGame('fort');
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
      if (G.mode === 'win') startGame('fort');
      else goTitle();
    });
  }
  if (modeSelect) {
    modeSelect.addEventListener('click', function () {
      audio.ensure();
      startGame('select');
    });
  }
  if (modeFort) {
    modeFort.addEventListener('click', function () {
      audio.ensure();
      startGame('fort');
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
    }
  });

  requestAnimationFrame(frame);
})();
