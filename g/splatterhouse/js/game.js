'use strict';

/* 血屋 — Splatterhouse arcade lite. Mask + cleaver, stagger then finish. No CDN. Distinct from 魔堡 / 制裁. */

(function () {
  const VW = 640;
  const VH = 360;
  const GY = 322;
  const MY = 246;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 16000;
  const HP_MAX = 10;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const AIR = 0.9;
  const JUMP_V = 478;
  const GRAV = 1380;
  const MAX_FALL = 620;
  const COYOTE = 0.08;
  const BUFFER = 0.12;
  const INVULN = 1.25;
  const INVULN_TIDE = 1.0;
  const DIE_T = 0.82;
  const WALK = 186;
  const PW = 16;
  const PH = 28;
  const SLASH = { reach: 48, t: 0.2, h0: 0.045, h1: 0.145, knock: 92, stop: 0.048, dmg: 1 };
  const BEST_KEY = 'playbox-splatterhouse-best';
  const MUTE_KEY = 'playbox-splatterhouse-mute';
  const AUTO_SPEED_KEY = 'playbox-splatterhouse-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 0.52, 0.78, 1, 3.4];
  const OPS = '方向 / D 走 · ↑ 跳 · 空格挥斩 · A 自动 · R 重开 · M 静音';

  const MAG = [255, 61, 120];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 32, 48];
  const HOT2 = [255, 106, 98];
  const WHT = [244, 240, 232];
  const MASK = [248, 244, 236];
  const SKIN = [214, 160, 128];
  const STEEL = [200, 208, 220];
  const CRIM = [196, 28, 36];
  const BONE = [220, 208, 186];
  const ROT = [92, 140, 78];
  const PUR = [140, 72, 180];
  const ORG = [255, 138, 40];

  const KINDS = {
    dead: { hp: 2, spd: 62, dmg: 2, score: 160, w: 16, h: 26, stagger: true },
    bat: { hp: 1, spd: 118, dmg: 1, score: 140, w: 16, h: 12, fly: true, stagger: false },
    hang: { hp: 2, spd: 54, dmg: 2, score: 200, w: 14, h: 24, stagger: true, hang: true },
    crawl: { hp: 3, spd: 78, dmg: 2, score: 280, w: 22, h: 14, stagger: true },
    glass: { hp: 3, spd: 96, dmg: 2, score: 240, w: 16, h: 26, stagger: true },
    polter: { hp: 22, spd: 70, dmg: 3, score: 4000, w: 36, h: 36, fly: true, boss: true, stagger: false },
    saw: { hp: 30, spd: 64, dmg: 3, score: 5200, w: 28, h: 44, boss: true, stagger: false },
    chaos: { hp: 38, spd: 58, dmg: 4, score: 7200, w: 42, h: 48, boss: true, stagger: false }
  };

  const SCORE = { hit: 40, heart: 80, stage: 2000, win: 8000 };

  const STAGES = [
    {
      name: '西馆', boss: '怨灵', bossKind: 'polter', w: 2200, theme: 'hall',
      ground: [[0, 520], [600, 280], [960, 360], [1400, 800]],
      plats: [[240, MY, 150], [700, MY, 150], [1160, MY, 140], [1760, MY, 160]],
      ents: [
        [280, GY, 'dead'], [420, GY, 'dead'], [360, MY, 'bat'],
        [680, GY, 'dead'], [820, GY, 'dead'], [760, MY, 'hang'],
        [1080, GY, 'dead'], [1220, GY, 'dead'], [1180, MY, 'bat'],
        [1560, GY, 'dead'], [1680, GY, 'crawl'], [1840, GY, 'dead']
      ],
      drops: [[460, GY, 'heart'], [1180, MY, 'heart'], [1720, GY, 'heart']]
    },
    {
      name: '地窟', boss: '锯汉', bossKind: 'saw', w: 2360, theme: 'crypt',
      ground: [[0, 460], [548, 300], [936, 320], [1348, 280], [1720, 640]],
      plats: [[180, MY, 150], [620, MY, 160], [1040, MY, 150], [1480, MY, 160], [1960, MY, 150]],
      ents: [
        [240, GY, 'dead'], [380, GY, 'crawl'], [220, MY, 'hang'],
        [640, GY, 'dead'], [780, GY, 'dead'], [700, MY, 'bat'],
        [1080, GY, 'crawl'], [1200, GY, 'dead'], [1100, MY, 'hang'],
        [1480, GY, 'dead'], [1600, GY, 'glass'], [1540, MY, 'bat'],
        [1880, GY, 'crawl'], [2000, GY, 'dead'], [2080, GY, 'hang']
      ],
      drops: [[300, MY, 'heart'], [1040, MY, 'heart'], [1640, GY, 'heart'], [1960, MY, 'heart']]
    },
    {
      name: '祭堂', boss: '混沌', bossKind: 'chaos', w: 2480, theme: 'altar',
      ground: [[0, 420], [512, 280], [888, 300], [1284, 280], [1660, 300], [2048, 432]],
      plats: [[140, MY, 140], [540, MY, 150], [960, MY, 150], [1380, MY, 160], [1800, MY, 150], [2160, MY, 140]],
      ents: [
        [220, GY, 'dead'], [360, GY, 'glass'], [180, MY, 'bat'],
        [600, GY, 'crawl'], [740, GY, 'dead'], [680, MY, 'hang'],
        [1000, GY, 'glass'], [1140, GY, 'crawl'], [1020, MY, 'bat'],
        [1420, GY, 'dead'], [1540, GY, 'glass'], [1480, MY, 'hang'],
        [1780, GY, 'crawl'], [1900, GY, 'dead'], [1840, MY, 'bat'],
        [2140, GY, 'glass'], [2240, GY, 'crawl']
      ],
      drops: [[240, MY, 'heart'], [960, MY, 'heart'], [1480, GY, 'heart'], [1800, MY, 'heart'], [2160, MY, 'heart']]
    }
  ];

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
  function airDist() {
    return WALK * AIR * (2 * JUMP_V / GRAV);
  }
  function comboMul(n) {
    return 1 + Math.min(4, Math.max(0, Math.floor(((n | 0) - 1) / 2)));
  }
  function spdMul(tide, stage) {
    return (tide ? 1.28 : 1) * (1 + Math.max(0, stage - 1) * 0.08);
  }
  function kindHp(kind, tide) {
    const base = KINDS[kind] ? KINDS[kind].hp : 2;
    if (!tide || !KINDS[kind] || !KINDS[kind].boss) return tide && KINDS[kind] && !KINDS[kind].fly ? Math.max(base, Math.round(base * 1.0)) : base;
    return Math.max(base, Math.round(base * 1.18));
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
    return !!(KINDS[k] && KINDS[k].boss);
  }
  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (HP_MAX < 8) throw new Error('hp');
    if (BEST_KEY !== 'playbox-splatterhouse-best') throw new Error('best key');
    if (AUTO_SPEED_KEY !== 'playbox-splatterhouse-auto-speed') throw new Error('auto key');
    if (AUTO_SCALE[3] !== 1 || AUTO_SCALE[4] <= AUTO_SCALE[3]) throw new Error('auto scale');
    if (AUTO_SCALE[1] >= AUTO_SCALE[2] || AUTO_SCALE[2] >= AUTO_SCALE[3]) throw new Error('auto scale order');
    if (SPEED_LABELS[3] !== '快' || SPEED_LABELS[4] !== '极快') throw new Error('speed labels');
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(3) !== 2) throw new Error('combo 3');
    if (comboMul(9) !== 5) throw new Error('combo 9');
    const h = jumpHeight();
    if (h < 70 || h > 90) throw new Error('jump height ' + h);
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('tide faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (!KINDS.dead.stagger || KINDS.bat.stagger) throw new Error('stagger');
    if (KINDS.dead.hp < 2) throw new Error('dead multi');
    if (KINDS.crawl.hp < 3) throw new Error('crawl multi');
    if (KINDS.polter.hp >= KINDS.saw.hp || KINDS.saw.hp >= KINDS.chaos.hp) throw new Error('boss hp');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].bossKind !== 'polter' || STAGES[1].bossKind !== 'saw' || STAGES[2].bossKind !== 'chaos') throw new Error('bosses');
    if (SLASH.reach < 40 || SLASH.t > 0.28) throw new Error('slash');
    {
      const slashTop = GY - 70;
      const slashBot = GY - 2;
      const polterTop = (GY - 52) - KINDS.polter.h;
      const polterBot = GY - 52;
      if (slashTop >= polterBot || slashBot <= polterTop) throw new Error('slash misses polter');
    }
    const air = airDist();
    let i, s, g, hasDead, hasPit, hasBoss, gap;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length || !s.ents.length) throw new Error('stage ' + s.name);
      hasDead = false;
      hasPit = false;
      hasBoss = !!s.bossKind;
      s.ents.forEach(function (e) {
        if (e[2] === 'dead') hasDead = true;
      });
      for (g = 0; g < s.ground.length - 1; g++) {
        gap = s.ground[g + 1][0] - (s.ground[g][0] + s.ground[g][1]);
        if (gap > 20) hasPit = true;
        if (gap < 48) throw new Error('pit tiny ' + s.name + ' ' + gap);
        if (gap > air - 14) throw new Error('pit wide ' + s.name + ' ' + gap + '>' + air);
      }
      if (!hasDead) throw new Error('ents ' + s.name);
      if (!hasPit) throw new Error('pits ' + s.name);
      if (!hasBoss) throw new Error('boss ' + s.name);
      if (!s.drops.length) throw new Error('drops ' + s.name);
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
  const wepLabel = document.getElementById('wep-label');
  const hpBar = document.getElementById('hp-bar');
  const bossWrap = document.getElementById('boss-wrap');
  const bossBar = document.getElementById('boss-bar');
  const bossName = document.getElementById('boss-name');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const chainPop = document.getElementById('chain-pop');
  const hintEl = document.getElementById('hint');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const modeRun = document.getElementById('mode-run');
  const modeTide = document.getElementById('mode-tide');
  const btnRun = document.getElementById('btn-run');
  const btnTide = document.getElementById('btn-tide');

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
  const drips = [];
  const trails = [];
  const mist = [];
  const keys = { l: false, r: false, u: false, slash: false };
  const demo = { l: false, r: false, u: false, slash: false };
  const autoIn = { l: false, r: false, u: false, slash: false };
  let autoOn = false;
  let autoSpeed = 3;
  let autoOvWait = 0;
  let autoStuck = 0;
  let autoLastX = 0;
  let autoLastY = 0;
  let autoWalkDir = 1;
  let autoBackT = 0;

  const G = {
    mode: 'title',
    kind: 'run',
    stage: 1,
    levelW: 2200,
    theme: 'hall',
    lives: LIVES,
    hp: HP_MAX,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    maxCombo: 0,
    mult: 1,
    player: null,
    plats: [],
    ground: [],
    ents: [],
    drops: [],
    shots: [],
    boss: null,
    camX: 0,
    camY: 0,
    t: 0,
    clock: 0,
    stop: 0,
    shake: 0,
    punch: 1,
    flash: 0,
    flashRgb: WHT,
    invuln: 0,
    deadT: 0,
    slashT: 0,
    slashHit: false,
    slashBuf: 0,
    jumpBuf: 0,
    hitIds: {},
    checkX: 70,
    checkY: GY,
    clearT: 0,
    lock: 0,
    nextLife: LIFE_EVERY,
    why: '',
    toastT: 0,
    arena: false
  };

  function isTide() {
    return G.kind === 'tide';
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
  function autoPlaying() {
    return autoOn && G.mode === 'play';
  }
  function inL() {
    if (autoPlaying()) return autoIn.l;
    return G.mode === 'title' ? demo.l : (overlayOpen() ? false : keys.l);
  }
  function inR() {
    if (autoPlaying()) return autoIn.r;
    return G.mode === 'title' ? demo.r : (overlayOpen() ? false : keys.r);
  }
  function inU() {
    if (autoPlaying()) return autoIn.u;
    return G.mode === 'title' ? demo.u : (overlayOpen() ? false : keys.u);
  }
  function slashHeld() {
    if (autoPlaying()) return autoIn.slash;
    return G.mode === 'title' ? demo.slash : (overlayOpen() ? false : keys.slash);
  }
  function sx(x) {
    return ox + (x - G.camX) * scale;
  }
  function sy(y) {
    return oy + (y - G.camY) * scale;
  }
  function invulnTime() {
    return isTide() ? INVULN_TIDE : INVULN;
  }
  function onScreen(x, pad) {
    return x > G.camX - (pad || 40) && x < G.camX + VW + (pad || 40);
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
        this.master.gain.value = this.muted ? 0 : 0.34;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.34;
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
    whoosh() {
      this.ensure();
      this.noise(0.05, 0.038, 1400);
      this.beep(420, 0.07, 'sawtooth', 0.04, 120);
    },
    stagger() {
      this.ensure();
      this.noise(0.07, 0.05, 420);
      this.beep(140, 0.1, 'square', 0.05, 60);
      this.beep(90, 0.14, 'sawtooth', 0.03, 44);
    },
    splat() {
      this.ensure();
      this.noise(0.11, 0.062, 280);
      this.beep(180, 0.12, 'sawtooth', 0.048, 52);
      this.beep(70, 0.18, 'triangle', 0.036, 36);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.04, 0.04, 900);
      this.beep(480 * lift, 0.055, 'square', 0.044, 180);
    },
    hop() {
      this.ensure();
      this.beep(260, 0.065, 'square', 0.04, 580);
    },
    land() {
      this.ensure();
      this.noise(0.04, 0.024, 480);
      this.beep(130, 0.05, 'triangle', 0.02, 70);
    },
    hurt() {
      this.ensure();
      this.noise(0.09, 0.05, 360);
      this.beep(170, 0.14, 'sawtooth', 0.048, 60);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.055, 300);
      this.beep(240, 0.22, 'sawtooth', 0.05, 58);
      this.beep(110, 0.34, 'sine', 0.045, 38);
    },
    heart() {
      this.ensure();
      this.beep(620, 0.07, 'square', 0.04, 880);
      this.beep(880, 0.1, 'triangle', 0.035, 1240);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    boss() {
      this.ensure();
      this.beep(110, 0.18, 'sawtooth', 0.052, 64);
      this.beep(70, 0.28, 'square', 0.04, 46);
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
    drop() {
      this.ensure();
      this.noise(0.08, 0.04, 500);
      this.beep(90, 0.1, 'triangle', 0.03, 50);
    },
    spit() {
      this.ensure();
      this.noise(0.05, 0.036, 700);
      this.beep(220, 0.08, 'sawtooth', 0.03, 90);
    }
  };

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
    const t = isTide();
    if (modeRun) modeRun.setAttribute('aria-pressed', t ? 'false' : 'true');
    if (modeTide) modeTide.setAttribute('aria-pressed', t ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = (isTide() ? '尸潮 ' : '') + spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isTide() ? '尸潮' : '血屋';
      tagLabel.classList.toggle('warn', isTide());
      tagLabel.classList.toggle('hot', !isTide() && G.stage >= 3);
    }
    if (wepLabel) wepLabel.textContent = '斩斧';
    if (hpBar) {
      const r = clamp(G.hp / HP_MAX, 0, 1);
      hpBar.style.transform = 'scaleX(' + r + ')';
      hpBar.classList.toggle('low', r <= 0.34);
    }
    const b = G.boss;
    if (bossWrap) {
      const show = !!(b && b.active && !b.dead);
      bossWrap.hidden = !show;
      if (show) {
        if (bossName) bossName.textContent = spec.boss;
        if (bossBar) bossBar.style.transform = 'scaleX(' + clamp(b.hp / b.max, 0, 1) + ')';
      }
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (autoOn) {
      if (G.mode === 'title') setHint('自动托管 · 即将开局 · A 停下', 'hot');
      else if (G.mode === 'lose') setHint('自动仍开着 · 即将再开 · A 停下', 'warn');
      else if (G.mode === 'win') setHint('自动仍开着 · 即将再开 · A 停下', 'hot');
      else if (G.boss && G.boss.active && !G.boss.dead) setHint('托管中 · 头目 ' + spec.boss + ' · A 停下', 'hot');
      else setHint(isTide() ? '托管中 · 尸潮挥斩 · A 停下' : '托管中 · 血屋挥斩 · A 停下', 'hot');
    } else if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 第一刀打趴，再补一刀', 'warn');
    else if (G.mode === 'win') setHint('血屋已清 · R 再来一局', 'hot');
    else if (G.hp <= 3) setHint('体力将尽 · 空格挥斩 · 跳过深坑', 'warn');
    else if (G.lives === 1) setHint('最后一命 · 跳过深坑 · 空格挥斩', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · ' + spec.boss, 'hot');
    else setHint('往右走 · 空格挥斩 · 第一刀打趴再补刀 · 跳过深坑 · A 自动', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'SPLAT';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.innerHTML = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '尸潮' : '换模式';
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
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'win-flash', 'slash');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'win-flash', 'slash');
      }
    }, 420);
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
        g: spec.g == null ? 520 : spec.g
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

  function gore(x, y, face, power, kill) {
    const p = power || 1;
    const dir = face || 1;
    emit(10 + (p * 12) | 0, {
      x: x, y: y, j: 7 + p * 6,
      vx0: -40 + dir * 80, vx1: 80 + dir * 220,
      vy0: -340 * p, vy1: -20,
      life: 0.34 + p * 0.18, r0: 1.2, r1: 3.4 + p,
      rgb: kill ? MAG : HOT, g: 640
    });
    emit(4 + (p * 4) | 0, {
      x: x, y: y, j: 5,
      vx0: -120, vx1: 120, vy0: -180, vy1: 40,
      life: 0.22, r0: 1, r1: 2.2, rgb: CYN, g: 200
    });
    if (kill) {
      emit(6, {
        x: x, y: y + 6, j: 8,
        vx0: -60, vx1: 60, vy0: -40, vy1: 80,
        life: 0.5, r0: 2, r1: 5, rgb: HOT, g: 280
      });
      drips.push({ x: x, y: GY - 2, t: 0, life: 1.4, w: 10 + p * 8, rgb: MAG });
      capArr(drips, 18);
    }
    popSpark(x, y, kill ? MAG : HOT, 10 + p * 12);
    screenFlash(kill ? MAG : HOT, 0.12 + p * 0.1);
  }

  function swingTrail(x, y, face) {
    trails.push({ x: x, y: y, face: face, t: 0, life: 0.16 });
    capArr(trails, 18);
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

  function makePlayer(x, y) {
    return {
      x: x, y: y, vx: 0, vy: 0, face: 1,
      w: PW, h: PH,
      grounded: true, coyote: 0,
      squash: 1, run: 0
    };
  }

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }

  function makeEnt(x, y, kind) {
    const k = KINDS[kind] || KINDS.dead;
    const hp = kindHp(kind, isTide());
    const fly = !!k.fly;
    const hang = !!k.hang;
    return {
      id: uid++,
      x: x, y: hang ? MY - 8 : y,
      vx: 0, vy: 0, face: -1,
      kind: kind,
      hp: hp, max: hp,
      spd: k.spd * spdMul(isTide(), G.stage),
      dmg: k.dmg,
      w: k.w, h: k.h,
      stagger: !!k.stagger,
      fly: fly,
      hang: hang,
      hanging: hang,
      drop: hang,
      grounded: !fly && !hang,
      dead: false,
      deadT: 0,
      down: false,
      downT: 0,
      getup: 0,
      hurtT: 0,
      flash: 0,
      t: rand(0, 2),
      think: rand(0.1, 0.6),
      fire: rand(0.6, 1.6),
      homeY: hang ? MY - 8 : y,
      homeX: x,
      active: !k.boss,
      state: hang ? 'hang' : 'idle',
      hitN: 0,
      squash: 1,
      run: rand(0, 6),
      scale: k.boss ? 1.2 : 1
    };
  }

  function makeBoss(spec) {
    const kind = spec.bossKind;
    const e = makeEnt(spec.w - 180, GY, kind);
    e.active = false;
    e.state = 'wait';
    e.name = spec.boss;
    e.scale = kind === 'chaos' ? 1.45 : kind === 'saw' ? 1.32 : 1.2;
    e.hp = kindHp(kind, isTide());
    e.max = e.hp;
    if (kind === 'polter') {
      e.y = GY - 52;
      e.homeY = GY - 52;
      e.grounded = false;
    }
    return e;
  }

  function makeDrop(x, y, kind) {
    return { x: x, y: y - 12, kind: kind || 'heart', taken: false, bob: rand(0, TAU) };
  }

  function seedMist() {
    mist.length = 0;
    let i;
    for (i = 0; i < 10; i++) {
      mist.push({
        x: rand(0, 900),
        y: rand(40, 240),
        r: rand(18, 38),
        a: rand(0.02, 0.055),
        vx: rand(6, 16)
      });
    }
  }

  function clearFx() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    drips.length = 0;
    trails.length = 0;
    G.shots = [];
  }

  function groundAt(x) {
    let i, g;
    for (i = 0; i < G.ground.length; i++) {
      g = G.ground[i];
      if (x >= g[0] - 2 && x <= g[0] + g[1] + 2) return GY;
    }
    return null;
  }

  function platAt(x, y, vy) {
    let i, p, top;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (p.base) continue;
      if (x < p.x - 4 || x > p.x + p.w + 4) continue;
      top = p.y;
      if (y <= top + 8 && y >= top - 14 && vy >= 0) return top;
    }
    return null;
  }

  function loadStage(n, demoMode) {
    const spec = STAGES[clamp(n, 1, STAGES.length) - 1];
    let i, e, extra;
    G.stage = n;
    G.theme = spec.theme;
    G.levelW = spec.w;
    G.ground = spec.ground.slice();
    G.plats = [];
    G.ents = [];
    G.drops = [];
    G.shots = [];
    G.boss = null;
    G.arena = false;
    G.lock = 0;
    G.camX = 0;
    G.camY = 0;
    G.player = makePlayer(72, GY);
    G.slashT = 0;
    G.slashHit = false;
    G.slashBuf = 0;
    G.jumpBuf = 0;
    G.hitIds = {};
    G.deadT = 0;
    G.clearT = 0;
    G.checkX = 72;
    G.checkY = GY;
    for (i = 0; i < spec.ground.length; i++) {
      e = spec.ground[i];
      G.plats.push(makePlat(e[0], GY, e[1], true));
    }
    for (i = 0; i < spec.plats.length; i++) {
      e = spec.plats[i];
      G.plats.push(makePlat(e[0], e[1], e[2], false));
    }
    if (!demoMode) {
      for (i = 0; i < spec.ents.length; i++) {
        e = spec.ents[i];
        G.ents.push(makeEnt(e[0], e[1], e[2]));
      }
      if (isTide()) {
        extra = spec.ents.filter(function (x) { return x[2] === 'dead'; });
        for (i = 0; i < extra.length; i++) {
          e = extra[i];
          G.ents.push(makeEnt(e[0] + 36 + (i % 3) * 18, e[1], 'dead'));
        }
      }
      G.boss = makeBoss(spec);
      G.ents.push(G.boss);
      for (i = 0; i < spec.drops.length; i++) {
        e = spec.drops[i];
        G.drops.push(makeDrop(e[0], e[1], e[2]));
      }
    } else {
      G.ents.push(makeEnt(420, GY, 'dead'));
      G.ents.push(makeEnt(560, GY, 'dead'));
      G.ents.push(makeEnt(820, GY, 'dead'));
      G.drops.push(makeDrop(500, GY, 'heart'));
    }
    seedMist();
  }

  function startGame(kind) {
    G.kind = kind === 'tide' ? 'tide' : 'run';
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
    G.invuln = 0.4;
    G.punch = 1;
    clearFx();
    loadStage(1, false);
    autoStuck = 0;
    autoBackT = 0;
    autoWalkDir = 1;
    autoOvWait = 0;
    autoLastX = G.player ? G.player.x : 72;
    autoLastY = G.player ? G.player.y : GY;
    hideOverlay();
    audio.start();
    toast(isTide() ? '尸潮' : '西馆', false, !isTide());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'run';
    G.stage = 1;
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.why = '';
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.invuln = 9;
    G.deadT = 0;
    G.clearT = 0;
    clearFx();
    loadStage(1, true);
    G.invuln = 9;
    showOverlay('title', '血屋', '戴面具，挥斩斧。第一刀打趴，再补一刀。<br />坑和空血丢命。西馆、地窟、祭堂，尽头头目。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('run');
    else startGame(G.kind);
  }

  function winGame() {
    G.mode = 'win';
    addScore(SCORE.win * G.mult);
    audio.win();
    kick(5, 'win-flash');
    screenFlash(GOLD, 0.45);
    const lead = '面具还在。斩了 ' + G.maxCombo + ' 连。' + (isTide() ? '尸潮平了。' : '血屋已清。');
    showOverlay('win', isTide() ? '尸潮平了' : '血屋已清', lead);
    if (ovMenu) ovMenu.textContent = isTide() ? '换模式' : '尸潮';
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    audio.lose();
    kick(7, 'die');
    const why = G.why === 'pit' ? '坠入深渊了' : '被撕开了';
    showOverlay('lose', why, '分数 ' + G.score + ' · 最高连击 ×' + G.maxCombo);
    syncHud();
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      winGame();
      return;
    }
    const keepScore = G.score;
    const keepLives = G.lives;
    const keepHp = Math.min(HP_MAX, G.hp + 3);
    const cleared = G.stage;
    loadStage(G.stage + 1, false);
    G.score = keepScore;
    G.lives = keepLives;
    G.hp = keepHp;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.invuln = 0.6;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    addScore(SCORE.stage * cleared);
    syncHud();
  }

  function respawn() {
    G.hp = HP_MAX;
    G.deadT = 0;
    G.invuln = invulnTime();
    G.slashT = 0;
    G.slashBuf = 0;
    if (G.player) {
      G.player.x = G.checkX;
      G.player.y = G.checkY;
      G.player.vx = 0;
      G.player.vy = 0;
      G.player.grounded = true;
    }
    G.camX = clamp(G.checkX - 120, 0, Math.max(0, G.levelW - VW));
    autoStuck = 0;
    autoBackT = 0;
    syncHud();
  }

  function killPlayer(why) {
    if (G.deadT > 0 || G.mode !== 'play') return;
    G.why = why || 'hit';
    G.lives -= 1;
    G.deadT = DIE_T;
    G.hp = 0;
    G.combo = 0;
    G.mult = 1;
    G.slashT = 0;
    audio.death();
    kick(6.4, 'die');
    screenFlash(HOT, 0.5);
    if (G.player) {
      gore(G.player.x, G.player.y - 14, G.player.face, 1.6, true);
      G.player.vy = -180;
    }
    syncHud();
    if (G.lives <= 0) {
      G.deadT = 0.55;
    }
  }

  function hurtPlayer(dmg, src) {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.hp -= dmg;
    G.invuln = invulnTime();
    audio.hurt();
    kick(3.6, 'hit');
    screenFlash(HOT, 0.28);
    if (G.player) {
      G.player.vx = (src && src.x > G.player.x ? -1 : 1) * 180;
      G.player.vy = Math.min(G.player.vy, -140);
      gore(G.player.x, G.player.y - 16, G.player.face, 0.7, false);
    }
    if (G.hp <= 0) killPlayer('hit');
    else syncHud();
  }

  function slashBox() {
    const p = G.player;
    if (!p) return null;
    const reach = SLASH.reach + (G.combo >= 6 ? 8 : 0);
    const x0 = p.face > 0 ? p.x + 4 : p.x - reach;
    return { x: x0, y: p.y - 70, w: reach, h: 68, face: p.face };
  }

  function doSlash() {
    const p = G.player;
    if (!p || G.deadT > 0) return;
    if (G.mode !== 'play' && G.mode !== 'title') return;
    if (G.slashT > 0) {
      if (G.slashT < SLASH.t * 0.45) G.slashBuf = 1;
      return;
    }
    G.slashT = SLASH.t;
    G.slashHit = false;
    G.slashBuf = 0;
    G.hitIds = {};
    audio.whoosh();
    swingTrail(p.x + p.face * 18, p.y - 16, p.face);
    kick(1.4, 'slash');
  }

  function hitEnt(e, box) {
    if (!e || e.dead || G.hitIds[e.id]) return;
    if (isBoss(e.kind) && !e.active) return;
    if (e.hanging) {
      e.hanging = false;
      e.vy = 40;
      e.state = 'drop';
    }
    G.hitIds[e.id] = 1;
    G.slashHit = true;
    const p = G.player;
    const face = p ? p.face : 1;
    const dmg = SLASH.dmg + (G.combo >= 8 ? 1 : 0);
    const hx = e.x;
    const hy = e.y - e.h * 0.45;
    e.flash = 0.12;
    e.hurtT = 0.16;
    e.hitN = 0.18;
    e.face = face > 0 ? -1 : 1;
    if (playing()) bumpCombo();
    addScore(SCORE.hit * G.mult);

    if (e.down) {
      e.hp -= dmg;
      e.downT = Math.max(e.downT, 0.55);
      e.vx = face * (SLASH.knock + 40);
      gore(hx, hy, face, 1.15, e.hp <= 0);
      floatText(hx, hy - 12, e.hp <= 0 ? '斩' : '补', e.hp <= 0 ? GOLD : HOT, e.hp <= 0);
      if (e.hp <= 0) {
        finishEnt(e, true);
      } else {
        audio.hit(G.combo);
        hitStop(0.042);
        kick(2.6, 'hit');
      }
      return;
    }

    e.hp -= dmg;
    e.vx = face * SLASH.knock;
    if (e.stagger && e.hp > 0) {
      e.down = true;
      e.downT = 1.12;
      e.getup = 0;
      e.vy = -90;
      e.grounded = false;
      gore(hx, hy, face, 0.85, false);
      floatText(hx, hy - 10, '趴', MAG, false);
      audio.stagger();
      hitStop(SLASH.stop);
      kick(3.2, 'thump');
      addScore(20 * G.mult);
      return;
    }
    if (e.hp <= 0) {
      gore(hx, hy, face, 1.25, true);
      finishEnt(e, false);
      return;
    }
    gore(hx, hy, face, 0.7, false);
    floatText(hx, hy - 10, String(SCORE.hit * G.mult), GOLD, false);
    audio.hit(G.combo);
    hitStop(isBoss(e.kind) ? 0.062 : 0.036);
    kick(isBoss(e.kind) ? 3.8 : 2.2, isBoss(e.kind) ? 'boom' : 'hit');
    if (isBoss(e.kind)) syncHud();
  }

  function finishEnt(e, wasDown) {
    e.dead = true;
    e.deadT = 0.45;
    e.down = false;
    e.vx = (G.player ? G.player.face : 1) * 160;
    e.vy = -160;
    const k = KINDS[e.kind] || KINDS.dead;
    addScore(k.score * G.mult);
    floatText(e.x, e.y - e.h, '+' + (k.score * G.mult), GOLD, true);
    audio.splat();
    hitStop(wasDown ? 0.072 : 0.058);
    kick(wasDown ? 4.4 : 3.6, 'boom');
    if (isBoss(e.kind)) {
      G.clearT = 1.6;
      audio.boss();
      screenFlash(GOLD, 0.42);
      toast(e.name + ' 倒下', false, true);
      addScore(800 * G.mult);
    }
    syncHud();
  }

  function checkSlash() {
    const box = slashBox();
    if (!box) return;
    const prog = 1 - G.slashT / SLASH.t;
    if (prog < SLASH.h0 / SLASH.t || prog > SLASH.h1 / SLASH.t) return;
    let i, e;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (aabb(box.x, box.y, box.w, box.h, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
        hitEnt(e, box);
      }
    }
  }

  function findBoss() {
    return G.boss && !G.boss.dead ? G.boss : null;
  }

  function nearestThreat() {
    const p = G.player;
    let i, e, best = null, bd = 1e9, d;
    if (!p) return null;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead || e.hanging) continue;
      if (isBoss(e.kind) && !e.active) continue;
      d = Math.abs(e.x - p.x);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  function pitAhead(dir) {
    const p = G.player;
    if (!p) return false;
    const x = p.x + dir * 42;
    return groundAt(x) == null;
  }

  function demoThink() {
    const p = G.player;
    let e, dx;
    if (!p) return;
    demo.l = false;
    demo.r = false;
    demo.u = false;
    demo.slash = false;
    e = nearestThreat();
    if (p.x < 280) demo.r = true;
    if (pitAhead(1) && p.grounded) demo.u = true;
    if (!e) {
      if (p.x < 720) demo.r = true;
      else demo.l = p.x > 860;
      return;
    }
    dx = e.x - p.x;
    if (dx > 0) p.face = 1;
    else p.face = -1;
    if (Math.abs(dx) > 34) {
      if (dx > 0) demo.r = true;
      else demo.l = true;
    }
    if (Math.abs(dx) < 52 && G.slashT <= 0) demo.slash = true;
    if (pitAhead(dx > 0 ? 1 : -1) && p.grounded) demo.u = true;
  }

  function clearAutoKeys() {
    autoIn.l = false;
    autoIn.r = false;
    autoIn.u = false;
    autoIn.slash = false;
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

  function nextPit(x, dir) {
    const out = { dist: 999, width: 0, edge: x, next: null };
    let i, g, cur = null, curI = -1;
    for (i = 0; i < G.ground.length; i++) {
      g = G.ground[i];
      if (x >= g[0] - 2 && x <= g[0] + g[1] + 2) {
        cur = g;
        curI = i;
        break;
      }
    }
    if (!cur) {
      out.dist = 0;
      out.width = 80;
      return out;
    }
    if (dir >= 0) {
      out.edge = cur[0] + cur[1];
      out.dist = out.edge - x;
      if (curI + 1 < G.ground.length) {
        out.next = G.ground[curI + 1];
        out.width = out.next[0] - out.edge;
      }
    } else {
      out.edge = cur[0];
      out.dist = x - out.edge;
      if (curI > 0) {
        out.next = G.ground[curI - 1];
        out.width = out.edge - (out.next[0] + out.next[1]);
      }
    }
    return out;
  }

  function platCovering(x, floorY) {
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (p.base) continue;
      if (Math.abs(p.y - floorY) > 10) continue;
      if (x >= p.x - 2 && x <= p.x + p.w + 2) return p;
    }
    return null;
  }

  function autoShotThreat() {
    const p = G.player;
    let i, s, t;
    if (!p) return null;
    for (i = 0; i < G.shots.length; i++) {
      s = G.shots[i];
      if (s.dead) continue;
      if (Math.abs(s.y - (p.y - 14)) > 32) continue;
      if (s.vx === 0) {
        if (Math.abs(s.x - p.x) < 44) return s;
        continue;
      }
      t = (p.x - s.x) / s.vx;
      if (t < 0 || t > 0.55) continue;
      if (Math.abs(s.x + s.vx * t - p.x) < 22) return s;
    }
    return null;
  }

  function autoFloor(y) {
    return y < (MY + GY) * 0.5 ? MY : GY;
  }

  function autoSameBand(ay, by) {
    return Math.abs(autoFloor(ay) - autoFloor(by)) <= 20;
  }

  function autoPitBetween(a, b) {
    const dir = b >= a ? 1 : -1;
    const pit = nextPit(a, dir);
    if (!pit || pit.width <= 14) return false;
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    return pit.edge > lo - 2 && pit.edge < hi + 2;
  }

  function autoLive(e) {
    return !!(e && !e.dead && e.y < GY + 10 && e.y > 40);
  }

  function autoVertHit(e, p) {
    if (!e || !p) return null;
    const ey0 = e.y - e.h;
    const ey1 = e.y;
    function overlap(py) {
      return py - 70 < ey1 && py - 2 > ey0;
    }
    if (overlap(p.y)) return 'now';
    if (overlap(p.y - jumpHeight() * 0.72)) return 'jump';
    return null;
  }

  function autoPick() {
    const p = G.player;
    let best = null;
    let bestS = -1e9;
    function consider(x, y, score, kind) {
      if (score > bestS) {
        bestS = score;
        best = { x: x, y: y, kind: kind };
      }
    }
    const onPlat = p.y < GY - 24;
    const goX = Math.min(G.levelW - 40, Math.max(p.x + 180, G.camX + VW * 0.68));
    consider(goX, GY, 520, 'go');

    let i, e, d, u, dx, pri;
    if (G.hp <= 5) {
      for (i = 0; i < G.drops.length; i++) {
        u = G.drops[i];
        if (u.taken) continue;
        dx = u.x - p.x;
        if (dx < -70) continue;
        d = hypot(dx, u.y - (p.y - 12));
        if (d > 240) continue;
        if (!autoSameBand(u.y + 12, p.y) && !(G.hp <= 3 && u.y < p.y - 16 && dx > -10 && dx < 90)) continue;
        pri = (G.hp <= 3 ? 880 : 640) - d * 0.5;
        consider(u.x, u.y + 12, pri, 'heart');
      }
    }
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (!autoLive(e)) continue;
      if (isBoss(e.kind) && !e.active) continue;
      dx = e.x - p.x;
      if (dx < 0 && autoPitBetween(p.x, e.x)) continue;
      d = hypot(dx, e.y - p.y);
      if (isBoss(e.kind)) {
        const side = dx >= 0 ? -1 : 1;
        consider(e.x + side * 34, GY, 1400, 'boss');
        continue;
      }
      if (e.hanging) {
        if (!onPlat && dx > -16 && dx < 150) consider(e.x, GY, 700 - Math.abs(dx) * 0.35, 'hang');
        continue;
      }
      if (e.fly) {
        if (dx > -24 && dx < 88 && autoVertHit(e, p)) {
          consider(e.x, p.y, 720 - Math.abs(dx) * 0.4, 'fly');
        }
        continue;
      }
      if (!autoSameBand(e.y, p.y) || Math.abs(e.y - p.y) > 46) continue;
      if (e.down && dx < -70) continue;
      if (!e.down && dx < -48) continue;
      pri = (e.down ? 1260 : 900) - d * 0.5;
      if (dx > 0) pri += 70;
      consider(e.x, e.y, pri, e.down ? 'down' : 'fight');
    }
    if (!best) consider(goX, GY, 50, 'go');
    return best;
  }

  function autoThink() {
    clearAutoKeys();
    if (!autoOn || G.mode !== 'play') return;
    const p = G.player;
    if (!p || G.deadT > 0) return;

    const moved = hypot(p.x - autoLastX, p.y - autoLastY);
    if (moved < 0.7 && p.grounded && G.slashT <= 0) autoStuck += STEP;
    else autoStuck = Math.max(0, autoStuck - STEP * 2);
    autoLastX = p.x;
    autoLastY = p.y;
    if (autoBackT > 0) autoBackT -= STEP;

    const reach = SLASH.reach + (G.combo >= 6 ? 8 : 0);
    const onPlat = p.grounded && p.y < GY - 24;
    const plat = onPlat ? platCovering(p.x, MY) : null;
    const goal = autoPick();
    let seekX = goal.x;
    let wantJump = false;
    let wantFire = false;
    let pitJump = false;
    let hold = false;

    let i, e, adx, dx, vert, close = null, closeD = 1e9;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (!autoLive(e)) continue;
      if (isBoss(e.kind) && !e.active) continue;
      dx = e.x - p.x;
      adx = Math.abs(dx);
      if (adx > reach + 52) continue;
      if (dx < 0 && autoPitBetween(p.x, e.x)) continue;
      vert = autoVertHit(e, p);
      if (e.hanging) {
        if (!onPlat || adx > reach + 6) continue;
      } else if (e.fly) {
        if (adx > reach + 24) continue;
        if (!vert) continue;
      } else if (!isBoss(e.kind) && (!autoSameBand(e.y, p.y) || Math.abs(e.y - p.y) > 46)) {
        continue;
      }
      const d = hypot(dx, e.y - p.y);
      if (d < closeD) {
        closeD = d;
        close = e;
      }
    }

    const shot = autoShotThreat();
    if (shot && G.invuln <= 0 && !onPlat) wantJump = true;

    if (close) {
      dx = close.x - p.x;
      adx = Math.abs(dx);
      vert = autoVertHit(close, p);
      if (dx > 4) p.face = 1;
      else if (dx < -4) p.face = -1;
      const now = vert === 'now' || (onPlat && (close.hanging || close.fly) && adx <= reach + 6);
      if (now && adx <= reach + 6) {
        wantFire = true;
        if (close.fly && !onPlat && p.grounded && adx < 42) wantJump = true;
        if (close.kind === 'polter' && adx < 38) wantJump = true;
        if (close.kind === 'saw' && close.state === 'charge' && adx < 70) {
          wantJump = true;
          autoBackT = Math.max(autoBackT, 0.2);
        }
        if (adx < 14 && !close.down && !close.fly && !isBoss(close.kind)) seekX = p.x + (dx > 0 ? -18 : 18);
        else if (adx > 34) seekX = close.x;
        else {
          seekX = p.x;
          hold = true;
        }
      } else if (close.fly && vert === 'jump' && adx <= reach + 18 && !onPlat) {
        wantJump = true;
        seekX = close.x;
        if (adx <= reach + 8) wantFire = true;
      } else if (!close.hanging && !close.fly && autoSameBand(close.y, p.y) && Math.abs(close.y - p.y) < 42) {
        seekX = close.x;
      } else if (isBoss(close.kind)) {
        seekX = close.x + (dx >= 0 ? -34 : 34);
      }
    }

    if (goal.kind === 'heart' && goal.y < p.y - 20 && !onPlat && G.hp <= 4) {
      const up = platCovering(goal.x, MY) || platCovering(p.x, MY);
      if (up && Math.abs(p.x - (up.x + up.w * 0.5)) < up.w * 0.5 + 8) {
        wantJump = true;
        seekX = up.x + up.w * 0.5;
      }
    }

    if (onPlat && plat) {
      const heartHere = goal.kind === 'heart' && G.hp <= 5
        && goal.x >= plat.x - 4 && goal.x <= plat.x + plat.w + 4;
      if (!heartHere) {
        const end = plat.x + plat.w;
        const fallT = Math.sqrt(2 * Math.max(24, GY - MY) / GRAV);
        const dropLand = end + WALK * fallT + 12;
        const jumpLand = end + airDist() - 6;
        const dropDies = groundAt(end + 8) == null || groundAt(dropLand) == null;
        const jumpOk = groundAt(jumpLand) != null;
        seekX = end + 44;
        hold = false;
        if (!dropDies && close && autoVertHit(close, p) === 'now' && Math.abs(close.x - p.x) <= reach + 6) {
          wantFire = true;
          if (close.x > p.x + 4) p.face = 1;
          else if (close.x < p.x - 4) p.face = -1;
        } else {
          wantFire = false;
        }
        if (dropDies && jumpOk && p.x > end - 8) {
          wantJump = true;
          pitJump = true;
        } else {
          wantJump = false;
        }
      }
    }

    if (autoBackT > 0 && !pitJump) seekX = p.x - 64;

    if (!hold) autoSteer(seekX);
    else {
      autoIn.l = false;
      autoIn.r = false;
    }

    const dir = autoIn.r ? 1 : autoIn.l ? -1 : 1;
    const pit = nextPit(p.x, dir);
    const nearEnd = p.x > G.levelW - 90 || p.x < 36;
    if (!onPlat && pit.width > 14 && pit.dist < 100 && !nearEnd) wantFire = false;
    if (!onPlat && pit.width > 14 && pit.dist < 70 && !nearEnd) {
      if (dir < 0) {
        autoSteer(p.x + 40);
      } else {
        const air = airDist();
        const lead = clamp(air - pit.width - 8, 10, 28);
        if (pit.dist < lead) {
          wantJump = true;
          pitJump = true;
          wantFire = false;
          autoSteer(p.x + 90);
        }
      }
    }

    if (!p.grounded && autoBackT <= 0) {
      autoIn.r = true;
      autoIn.l = false;
      if (groundAt(p.x) == null || groundAt(p.x + 28) == null) {
        wantJump = true;
        pitJump = true;
      }
    }

    if (autoStuck > 0.4) {
      if (onPlat && plat) {
        autoSteer(plat.x + plat.w + 52);
      } else if (pit.width > 14 && pit.dist < 80 && !nearEnd) {
        autoSteer(p.x + 90);
      } else {
        wantJump = true;
        autoSteer(p.x + 100);
      }
    }
    if (autoStuck > 1.1) {
      autoSteer(p.x + 140);
      autoWalkDir = 1;
      autoStuck = 0.2;
      if (!(pit.width > 14 && pit.dist < 80 && !nearEnd)) wantJump = true;
    }

    if (wantJump) autoIn.u = true;
    if (pitJump) wantFire = false;
    if (wantFire) autoIn.slash = true;
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.25 : 0.5)) {
        autoOvWait = 0;
        startGame(G.kind || 'run');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.7 : 1.15)) {
        autoOvWait = 0;
        startGame(G.kind || 'run');
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
    clearAutoKeys();
    keys.l = false;
    keys.r = false;
    keys.u = false;
    keys.slash = false;
    syncAutoUi();
    if (autoOn) {
      audio.ensure();
      if (G.mode === 'title') startGame(G.kind || 'run');
    }
    syncHud();
  }

  function isAutoKey(e) {
    return e.code === 'KeyA' || e.key === 'a' || e.key === 'A';
  }

  function fireBlob(x, y, vx, vy, dmg) {
    G.shots.push({
      x: x, y: y, vx: vx, vy: vy,
      life: 1.6, dmg: dmg || 2, r: 6, dead: false
    });
    capArr(G.shots, 24);
    audio.spit();
  }

  function activateBoss() {
    const b = G.boss;
    if (!b || b.active || b.dead) return;
    b.active = true;
    b.state = 'idle';
    G.arena = true;
    G.lock = 1;
    audio.boss();
    toast(b.name, true, false);
    kick(4, 'boom');
    syncHud();
  }

  function updateBoss(e, dt) {
    const p = G.player;
    if (!e || e.dead || !p) return;
    if (!e.active) {
      if (p.x > G.levelW - 420) activateBoss();
      return;
    }
    e.t += dt;
    e.think -= dt;
    e.fire -= dt;
    const dx = p.x - e.x;
    e.face = dx > 0 ? 1 : -1;
    if (e.kind === 'polter') {
      e.y = e.homeY + Math.sin(e.t * 2.2) * 14;
      e.x += clamp(dx, -1, 1) * e.spd * 0.55 * dt;
      e.x = clamp(e.x, G.levelW - 380, G.levelW - 40);
      if (e.fire <= 0) {
        fireBlob(e.x, e.y, e.face * 160, 40, 2);
        fireBlob(e.x, e.y, e.face * 120, 90, 2);
        e.fire = 1.35;
        e.state = 'spit';
      }
      if (e.think <= 0) {
        e.vx = e.face * 220;
        e.think = 1.8;
        e.state = 'lunge';
      }
      if (e.state === 'lunge') {
        e.x += e.vx * dt;
        e.vx *= 0.92;
      }
    } else if (e.kind === 'saw') {
      if (e.state === 'charge') {
        e.x += e.face * 280 * dt;
        e.run += dt * 18;
        if (e.think <= 0) e.state = 'idle';
      } else if (e.state === 'sweep') {
        e.x += e.face * 40 * dt;
        if (e.think <= 0) e.state = 'idle';
      } else {
        if (Math.abs(dx) > 36) e.x += Math.sign(dx) * e.spd * dt;
        if (e.think <= 0) {
          e.state = Math.abs(dx) > 90 ? 'charge' : 'sweep';
          e.think = e.state === 'charge' ? 0.55 : 0.4;
          audio.whoosh();
        }
      }
      e.x = clamp(e.x, G.levelW - 400, G.levelW - 30);
    } else if (e.kind === 'chaos') {
      e.x = lerp(e.x, G.levelW - 160, 1 - Math.pow(0.2, dt));
      e.y = GY + Math.sin(e.t * 1.6) * 4;
      if (e.fire <= 0) {
        fireBlob(e.x - 10, e.y - 28, -140, -40, 3);
        fireBlob(e.x + 10, e.y - 28, 40, -80, 3);
        fireBlob(e.x, e.y - 20, -90, 20, 3);
        e.fire = 1.55;
        e.state = 'spit';
      }
      if (e.think <= 0) {
        let nBat = 0, i;
        for (i = 0; i < G.ents.length; i++) {
          if (G.ents[i].kind === 'bat' && !G.ents[i].dead) nBat += 1;
        }
        if (nBat < 4) {
          G.ents.push(makeEnt(e.x + rand(-40, 40), MY, 'bat'));
          audio.drop();
        }
        e.think = 2.4;
        e.state = 'summon';
      }
    }
  }

  function updateEnt(e, dt) {
    const p = G.player;
    const k = KINDS[e.kind];
    let gy, plat, dx;
    if (!e || e.dead) {
      if (e && e.dead) {
        e.deadT -= dt;
        e.vy += GRAV * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.vx *= 0.96;
      }
      return;
    }
    if (isBoss(e.kind)) {
      updateBoss(e, dt);
      if (e.flash > 0) e.flash -= dt;
      if (e.hurtT > 0) e.hurtT -= dt;
      if (e.hitN > 0) e.hitN -= dt;
      return;
    }
    e.t += dt;
    e.run += dt * (0.8 + Math.abs(e.vx) * 0.02);
    if (e.flash > 0) e.flash -= dt;
    if (e.hurtT > 0) e.hurtT -= dt;
    if (e.hitN > 0) e.hitN -= dt;

    if (e.hanging) {
      e.y = e.homeY + Math.sin(e.t * 2) * 3;
      if (p && Math.abs(p.x - e.x) < 70 && p.y > e.y - 10) {
        e.hanging = false;
        e.drop = false;
        e.vy = 80;
        e.state = 'drop';
        audio.drop();
      }
      return;
    }

    if (e.down) {
      e.downT -= dt;
      e.vy += GRAV * dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.vx *= 0.9;
      gy = groundAt(e.x);
      if (gy != null && e.y >= gy) {
        e.y = gy;
        e.vy = 0;
        e.grounded = true;
      }
      if (e.downT <= 0) {
        e.down = false;
        e.getup = 0.32;
        e.state = 'getup';
      }
      return;
    }
    if (e.getup > 0) {
      e.getup -= dt;
      return;
    }

    if (e.fly) {
      e.x += (p && p.x > e.x ? 1 : -1) * e.spd * 0.7 * dt;
      e.y = e.homeY + Math.sin(e.t * 3.2 + e.homeX) * 16;
      e.face = p && p.x > e.x ? 1 : -1;
      return;
    }

    gy = groundAt(e.x);
    plat = platAt(e.x, e.y, e.vy);
    if (!e.grounded) {
      e.vy += GRAV * dt;
      e.y += e.vy * dt;
      e.x += e.vx * dt;
      if (plat != null && e.vy >= 0) {
        e.y = plat;
        e.vy = 0;
        e.grounded = true;
      } else if (gy != null && e.y >= gy) {
        e.y = gy;
        e.vy = 0;
        e.grounded = true;
      } else if (e.y > VH + 40) {
        e.dead = true;
        e.deadT = 0;
      }
      return;
    }

    if (p) {
      dx = p.x - e.x;
      e.face = dx > 0 ? 1 : -1;
      if (Math.abs(dx) > 18) {
        const nx = e.x + Math.sign(dx) * e.spd * dt;
        if (groundAt(nx) != null || !e.grounded) e.x = nx;
        else e.vx = 0;
      }
    }
    e.x = clamp(e.x, 20, G.levelW - 20);
  }

  function updateShots(dt) {
    let i, s, p;
    p = G.player;
    for (i = 0; i < G.shots.length; i++) {
      s = G.shots[i];
      if (s.dead) continue;
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 220 * dt;
      if (s.life <= 0 || s.y > GY + 20) s.dead = true;
      if (p && G.deadT <= 0 && G.invuln <= 0 && hypot(s.x - p.x, s.y - (p.y - 14)) < 12) {
        s.dead = true;
        hurtPlayer(s.dmg, s);
      }
    }
    G.shots = G.shots.filter(function (x) { return !x.dead && x.life > -0.2; });
  }

  function updateDrops(dt) {
    const p = G.player;
    let i, d;
    for (i = 0; i < G.drops.length; i++) {
      d = G.drops[i];
      if (d.taken) continue;
      d.bob += dt * 3;
      if (p && G.deadT <= 0 && hypot(d.x - p.x, (d.y) - (p.y - 12)) < 18) {
        d.taken = true;
        G.hp = Math.min(HP_MAX, G.hp + 4);
        addScore(SCORE.heart);
        audio.heart();
        toast('补血', false, true);
        popSpark(d.x, d.y, MAG, 14);
        emit(8, {
          x: d.x, y: d.y, j: 6,
          vx0: -80, vx1: 80, vy0: -180, vy1: -20,
          r0: 1.2, r1: 2.8, life: 0.32, rgb: MAG, g: 200
        });
        syncHud();
      }
    }
  }

  function updateCam(dt) {
    const p = G.player;
    let tx, lockL, lockR;
    if (!p) return;
    if (G.arena && G.boss && !G.boss.dead) {
      lockL = G.levelW - VW;
      lockR = G.levelW - VW;
      tx = lockL;
    } else {
      tx = p.x - VW * 0.38;
    }
    tx = clamp(tx, 0, Math.max(0, G.levelW - VW));
    G.camX = lerp(G.camX, tx, 1 - Math.pow(0.0008, dt));
    G.camY = 0;
  }

  function updatePlayer(dt) {
    const p = G.player;
    let ax, spd, busy, wasGround, gy, plat, wantL, wantR, wantU;
    if (!p) return;
    if (G.deadT > 0) {
      G.deadT -= dt;
      p.vy += GRAV * dt;
      p.y += p.vy * dt;
      p.x += p.vx * dt;
      if (p.y > GY) { p.y = GY; p.vy = 0; }
      if (G.deadT <= 0) {
        if (G.lives <= 0) loseGame();
        else respawn();
      }
      return;
    }

    if (G.slashT > 0) {
      G.slashT -= dt;
      checkSlash();
      if (G.slashT <= 0) {
        G.slashT = 0;
        if (G.slashBuf > 0 || slashHeld()) doSlash();
      }
    } else if (slashHeld() || G.slashBuf > 0) {
      doSlash();
    }

    busy = G.slashT > 0 && p.grounded;
    wantL = inL();
    wantR = inR();
    wantU = inU();
    ax = 0;
    if (wantL && !wantR) ax = -1;
    if (wantR && !wantL) ax = 1;
    if (ax && !busy) p.face = ax;
    spd = WALK * (p.grounded ? 1 : AIR) * (busy ? 0.28 : 1);
    if (ax && !busy) p.vx = ax * spd;
    else p.vx *= p.grounded ? 0.72 : 0.96;
    p.x += p.vx * dt;
    p.x = clamp(p.x, 18, G.levelW - 18);

    if (wantU) G.jumpBuf = BUFFER;
    if (G.jumpBuf > 0) G.jumpBuf -= dt;
    if (p.grounded) p.coyote = COYOTE;
    else p.coyote -= dt;
    if (G.jumpBuf > 0 && p.coyote > 0 && G.slashT <= 0) {
      p.vy = -JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      G.jumpBuf = 0;
      p.squash = 0.78;
      audio.hop();
    }

    wasGround = p.grounded;
    p.grounded = false;
    p.vy = Math.min(MAX_FALL, p.vy + GRAV * dt);
    p.y += p.vy * dt;
    gy = groundAt(p.x);
    plat = platAt(p.x, p.y, p.vy);
    if (plat != null && p.vy >= 0) {
      p.y = plat;
      p.vy = 0;
      p.grounded = true;
    } else if (gy != null && p.y >= gy && p.vy >= -20) {
      p.y = gy;
      p.vy = 0;
      p.grounded = true;
      G.checkX = p.x;
      G.checkY = gy;
    }
    if (p.grounded && !wasGround) {
      p.squash = 1.18;
      audio.land();
    }
    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.0002, dt));
    p.run += Math.abs(p.vx) * dt * 0.045;

    if (p.y > VH + 28) {
      if (G.mode === 'play') killPlayer('pit');
      else {
        p.x = 72;
        p.y = GY;
        p.vx = 0;
        p.vy = 0;
        p.grounded = true;
      }
      return;
    }

    if (G.mode === 'play' && G.invuln <= 0) {
      let i, e;
      for (i = 0; i < G.ents.length; i++) {
        e = G.ents[i];
        if (e.dead || e.down || e.hanging || e.getup > 0) continue;
        if (isBoss(e.kind) && !e.active) continue;
        if (aabb(p.x - 6, p.y - p.h + 6, 12, p.h - 8, e.x - e.w * 0.4, e.y - e.h + 4, e.w * 0.8, e.h - 4)) {
          hurtPlayer(e.dmg, e);
          break;
        }
      }
    }
  }

  function updateFx(dt) {
    let i, o;
    if (G.invuln > 0 && G.mode === 'play') G.invuln -= dt;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.punch !== 1) G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0004, dt));
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
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
      if (rings[i].t > 0.28) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      o = floats[i];
      o.t += dt;
      o.y -= o.vy * dt;
      if (o.t > o.life) floats.splice(i, 1);
    }
    for (i = drips.length - 1; i >= 0; i--) {
      drips[i].t += dt;
      if (drips[i].t > drips[i].life) drips.splice(i, 1);
    }
    for (i = trails.length - 1; i >= 0; i--) {
      trails[i].t += dt;
      if (trails[i].t > trails[i].life) trails.splice(i, 1);
    }
    for (i = 0; i < mist.length; i++) {
      mist[i].x += mist[i].vx * dt;
      if (mist[i].x > G.camX + VW + 40) mist[i].x = G.camX - 40;
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.mode === 'title' || G.mode === 'play') G.clock += dt;
    if (autoOn) tickAutoFlow(dt);
    updateFx(dt);
    if (G.stop > 0 && !(autoOn && autoSpeed >= 4 && G.mode === 'play')) {
      G.stop -= dt;
      return;
    }
    if (autoOn && autoSpeed >= 4) G.stop = 0;
    if (G.clearT > 0) {
      G.clearT -= dt;
      updateCam(dt);
      if (G.clearT <= 0) nextStage();
      return;
    }
    if (!live()) return;
    if (autoOn && G.mode === 'play' && G.deadT <= 0) autoThink();
    if (G.mode === 'title') demoThink();
    updatePlayer(dt);
    for (let i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    if (G.ents.length > 64) {
      G.ents = G.ents.filter(function (e) {
        return !e.dead || e.deadT > 0 || isBoss(e.kind);
      });
    }
    updateShots(dt);
    updateDrops(dt);
    updateCam(dt);
  }

  function drawSky() {
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (G.theme === 'altar') {
      g.addColorStop(0, '#1a0408');
      g.addColorStop(0.5, '#120308');
      g.addColorStop(1, '#080204');
    } else if (G.theme === 'crypt') {
      g.addColorStop(0, '#10060a');
      g.addColorStop(0.55, '#0c0408');
      g.addColorStop(1, '#080204');
    } else {
      g.addColorStop(0, '#180608');
      g.addColorStop(0.5, '#100406');
      g.addColorStop(1, '#0a0204');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const mx = sx(G.camX + VW * 0.78);
    const my = sy(G.camY + 42);
    ctx.fillStyle = rgba(isTide() ? MAG : HOT, isTide() ? 0.78 : 0.55);
    ctx.beginPath();
    ctx.arc(mx, my, (isTide() ? 28 : 22) * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(ORG, 0.22);
    ctx.beginPath();
    ctx.arc(mx - 6 * scale, my - 5 * scale, 8 * scale, 0, TAU);
    ctx.fill();
  }

  function drawBackdrop() {
    const par = G.camX * 0.28;
    const base = sy(GY + 4);
    let i, x, h, w, col;
    for (i = -2; i < 28; i++) {
      x = sx((Math.floor((G.camX + par) / 72) + i) * 72 - par);
      h = (70 + hash2(i + 11 + G.stage * 7) * 110) * scale;
      w = (34 + hash2(i + 4) * 28) * scale;
      col = i % 3 === 0 ? '#1a080c' : (i % 2 ? '#140608' : '#100408');
      ctx.fillStyle = col;
      ctx.fillRect(x, base - h, w, h + 36 * scale);
      if (G.theme === 'hall') {
        ctx.fillStyle = rgba(HOT, 0.16 + hash2(i) * 0.18);
        ctx.fillRect(x + 8 * scale, base - h + 16 * scale, 8 * scale, 12 * scale);
        ctx.fillStyle = rgba(GOLD, 0.1);
        ctx.strokeStyle = rgba(WHT, 0.12);
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 6 * scale, base - h + 12 * scale, 18 * scale, 22 * scale);
      } else if (G.theme === 'crypt') {
        ctx.fillStyle = rgba(BONE, 0.12);
        ctx.fillRect(x + 10 * scale, base - h + 20 * scale, 4 * scale, 28 * scale);
        ctx.beginPath();
        ctx.arc(x + 12 * scale, base - h + 18 * scale, 5 * scale, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = rgba(PUR, 0.16);
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, base - h);
        ctx.lineTo(x + w, base - h + 24 * scale);
        ctx.lineTo(x, base - h + 24 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(HOT, 0.22);
        ctx.beginPath();
        ctx.arc(x + w * 0.5, base - h + 18 * scale, 4 * scale, 0, TAU);
        ctx.fill();
      }
    }
    for (i = 0; i < mist.length; i++) {
      const m = mist[i];
      ctx.fillStyle = rgba(isTide() ? MAG : WHT, m.a * (isTide() ? 1.25 : 1));
      ctx.beginPath();
      ctx.arc(sx(m.x), sy(m.y), m.r * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < 5; i++) {
      x = sx(((Math.floor(G.camX / 220) + i) * 220 + 80) - G.camX * 0.08);
      ctx.strokeStyle = rgba(GOLD, 0.18);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(x, oy + 8 * scale);
      ctx.lineTo(x, sy(70));
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.16);
      ctx.beginPath();
      ctx.arc(x, sy(74), 10 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(ORG, 0.28);
      ctx.beginPath();
      ctx.arc(x, sy(74), 4 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawPits() {
    const y = sy(GY + 8);
    ctx.fillStyle = 'rgba(4, 0, 2, 0.78)';
    ctx.fillRect(sx(G.camX - 10), y, (VW + 20) * scale, 56 * scale);
    ctx.strokeStyle = rgba(HOT, 0.3);
    ctx.lineWidth = 1.3 * scale;
    ctx.beginPath();
    let x, covered;
    for (x = G.camX - 20; x < G.camX + VW + 20; x += 8) {
      const yy = GY + 10 + Math.sin(x * 0.09 + G.clock * 2.8) * 2.2;
      if (x === G.camX - 20) ctx.moveTo(sx(x), sy(yy));
      else ctx.lineTo(sx(x), sy(yy));
    }
    ctx.stroke();
    for (x = G.camX; x < G.camX + VW; x += 16) {
      covered = groundAt(x + 8) != null;
      if (!covered) {
        ctx.fillStyle = rgba(HOT, 0.14 + Math.sin(x * 0.04 + G.clock * 3) * 0.06);
        ctx.fillRect(sx(x), y, 16 * scale, 40 * scale);
        ctx.fillStyle = rgba(MAG, 0.1);
        ctx.fillRect(sx(x + 4), y + 8 * scale, 6 * scale, 18 * scale);
      }
    }
  }

  function drawPlats() {
    const s = scale;
    let i, p, x, y, w, t;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (p.x + p.w < G.camX - 20 || p.x > G.camX + VW + 20) continue;
      x = sx(p.x);
      y = sy(p.y);
      w = p.w * s;
      if (p.base) {
        ctx.fillStyle = '#2a1014';
        ctx.fillRect(x, y, w, 46 * s);
        ctx.fillStyle = '#3a181c';
        ctx.fillRect(x, y, w, 8 * s);
        ctx.fillStyle = rgba(HOT, 0.32);
        ctx.fillRect(x, y, w, 2.2 * s);
        for (t = 8; t < p.w; t += 20) {
          ctx.fillStyle = 'rgba(0,0,0,0.22)';
          ctx.fillRect(sx(p.x + t), y + 12 * s, 9 * s, 16 * s);
        }
      } else {
        ctx.fillStyle = '#241014';
        ctx.fillRect(x, y, w, 10 * s);
        ctx.fillStyle = rgba(GOLD, 0.22);
        ctx.fillRect(x, y, w, 2 * s);
      }
    }
  }

  function drawDrips() {
    let i, d, a;
    for (i = 0; i < drips.length; i++) {
      d = drips[i];
      a = 1 - d.t / d.life;
      ctx.fillStyle = rgba(d.rgb, a * 0.45);
      ctx.beginPath();
      ctx.ellipse(sx(d.x), sy(d.y), d.w * scale, 3.2 * scale, 0, 0, TAU);
      ctx.fill();
    }
  }

  function drawPickup(u) {
    if (u.taken) return;
    if (!onScreen(u.x, 16)) return;
    const bob = Math.sin(G.clock * 4 + u.bob) * 3;
    const x = sx(u.x);
    const y = sy(u.y + bob);
    ctx.fillStyle = rgba(MAG, 0.22);
    ctx.beginPath();
    ctx.arc(x, y, 11 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.moveTo(x, y + 6 * scale);
    ctx.bezierCurveTo(x + 8 * scale, y - 2 * scale, x + 4 * scale, y - 8 * scale, x, y - 3 * scale);
    ctx.bezierCurveTo(x - 4 * scale, y - 8 * scale, x - 8 * scale, y - 2 * scale, x, y + 6 * scale);
    ctx.fill();
  }

  function drawCleaver(s, face, slashT) {
    const prog = slashT > 0 ? 1 - slashT / SLASH.t : 0;
    const ang = slashT > 0 ? lerp(-2.15, 1.15, prog) : -0.55;
    ctx.save();
    ctx.translate(6 * s, -16 * s);
    ctx.rotate(ang * (face > 0 ? 1 : -1));
    ctx.fillStyle = rgba(CRIM, 0.95);
    ctx.fillRect(-3 * s, -3 * s, 18 * s, 5 * s);
    ctx.fillStyle = rgba(STEEL, 0.98);
    ctx.beginPath();
    ctx.moveTo(14 * s, -10 * s);
    ctx.lineTo(30 * s, -8 * s);
    ctx.lineTo(30 * s, 8 * s);
    ctx.lineTo(14 * s, 6 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.55);
    ctx.fillRect(16 * s, -2 * s, 12 * s, 1.6 * s);
    ctx.fillStyle = rgba(WHT, 0.35);
    ctx.fillRect(16 * s, -8 * s, 10 * s, 1.4 * s);
    ctx.restore();
  }

  function drawRick(p) {
    if (!p) return;
    if (G.invuln > 0 && G.mode === 'play' && ((G.t * 22) | 0) % 2 === 0) return;
    const s = scale;
    const x = sx(p.x);
    const y = sy(p.y);
    const face = p.face;
    const sq = p.squash;
    const run = Math.sin(p.run * 10) * (p.grounded && Math.abs(p.vx) > 20 ? 3 : 0);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(face, sq);
    ctx.translate(0, (1 - sq) * 10 * s);

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 2 * s, 10 * s, 3.2 * s, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#221418';
    ctx.fillRect(-6 * s, -12 * s + run, 5 * s, 12 * s);
    ctx.fillRect(1 * s, -12 * s - run, 5 * s, 12 * s);

    ctx.fillStyle = rgba(CRIM, 0.96);
    ctx.fillRect(-7 * s, -26 * s, 14 * s, 15 * s);

    ctx.fillStyle = rgba(SKIN, 0.9);
    ctx.fillRect(-8 * s, -22 * s, 4 * s, 10 * s);
    ctx.fillRect(5 * s, -22 * s, 5 * s, G.slashT > 0 ? 6 * s : 10 * s);

    drawCleaver(s, 1, G.slashT);

    ctx.fillStyle = rgba(MASK, 0.98);
    ctx.beginPath();
    ctx.ellipse(0, -32 * s, 7.4 * s, 8.4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.5);
    ctx.beginPath();
    ctx.ellipse(-2 * s, -35 * s, 3 * s, 2.4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#100404';
    ctx.beginPath();
    ctx.ellipse(-2.6 * s, -32.4 * s, 1.7 * s, 2.1 * s, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(2.6 * s, -32.4 * s, 1.7 * s, 2.1 * s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(HOT, 0.95);
    ctx.lineWidth = 1.4 * s;
    ctx.beginPath();
    ctx.moveTo(-3.2 * s, -27.2 * s);
    ctx.lineTo(3.2 * s, -27.2 * s);
    ctx.stroke();
    ctx.fillStyle = rgba(HOT, 0.8);
    ctx.fillRect(-1 * s, -36.6 * s, 2 * s, 3 * s);

    if (G.slashT > 0) {
      const a = 0.35 * (G.slashT / SLASH.t);
      ctx.strokeStyle = rgba(HOT, a);
      ctx.lineWidth = 3 * s;
      ctx.beginPath();
      ctx.arc(8 * s, -16 * s, 22 * s, -2.2, 1.1);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEnt(e) {
    if (!e || (e.dead && e.deadT <= 0)) return;
    if (!onScreen(e.x, 40)) return;
    const s = scale;
    const x = sx(e.x);
    const y = sy(e.y);
    const flash = e.flash > 0 && ((G.t * 24) | 0) % 2 === 0;
    const face = e.face || -1;
    ctx.save();
    ctx.translate(x, y);
    if (e.down) ctx.rotate(face > 0 ? 1.2 : -1.2);
    ctx.scale(face * (e.scale || 1), e.dead ? 0.85 : 1);

    if (e.hanging) {
      ctx.strokeStyle = rgba(BONE, 0.7);
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.moveTo(0, -e.h * s - 40 * s);
      ctx.lineTo(0, -e.h * s);
      ctx.stroke();
    }

    if (e.kind === 'bat') {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#2a1018';
      const flap = Math.sin(e.t * 10) * 8;
      ctx.beginPath();
      ctx.moveTo(0, -4 * s);
      ctx.lineTo(-14 * s, (-6 - flap) * s);
      ctx.lineTo(-2 * s, -2 * s);
      ctx.lineTo(14 * s, (-6 + flap) * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(BONE, 0.9);
      ctx.beginPath();
      ctx.arc(0, -4 * s, 5 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.fillRect(-3 * s, -5 * s, 2 * s, 2 * s);
      ctx.fillRect(1 * s, -5 * s, 2 * s, 2 * s);
      ctx.restore();
      return;
    }

    if (e.kind === 'crawl') {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(ROT, 0.92);
      ctx.beginPath();
      ctx.ellipse(0, -6 * s, 14 * s, 7 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.beginPath();
      ctx.arc(8 * s, -8 * s, 4 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#100404';
      ctx.fillRect(8 * s, -9 * s, 3 * s, 2 * s);
      ctx.strokeStyle = rgba(ROT, 0.8);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(-10 * s, -4 * s);
      ctx.lineTo(-16 * s, 2 * s);
      ctx.moveTo(4 * s, -2 * s);
      ctx.lineTo(12 * s, 3 * s);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (e.kind === 'polter') {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(BONE, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, -18 * s, 18 * s, 20 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#100404';
      ctx.beginPath();
      ctx.ellipse(-7 * s, -22 * s, 4 * s, 6 * s, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(7 * s, -22 * s, 4 * s, 6 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.ellipse(0, -8 * s, 8 * s, 5 * s, 0, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.35);
      ctx.beginPath();
      ctx.arc(0, -18 * s, 24 * s, 0, TAU);
      ctx.fill();
      ctx.restore();
      return;
    }

    if (e.kind === 'saw') {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#3a2020';
      ctx.fillRect(-10 * s, -36 * s, 20 * s, 24 * s);
      ctx.fillStyle = rgba(SKIN, 0.85);
      ctx.beginPath();
      ctx.arc(0, -42 * s, 8 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#100404';
      ctx.fillRect(-4 * s, -44 * s, 3 * s, 3 * s);
      ctx.fillRect(2 * s, -44 * s, 3 * s, 3 * s);
      ctx.fillStyle = rgba(STEEL, 0.95);
      ctx.save();
      ctx.translate(12 * s, -22 * s);
      ctx.rotate(e.t * (e.state === 'charge' ? 18 : 8));
      ctx.fillRect(-12 * s, -2 * s, 24 * s, 4 * s);
      ctx.fillRect(-2 * s, -12 * s, 4 * s, 24 * s);
      ctx.restore();
      ctx.fillStyle = '#221418';
      ctx.fillRect(-9 * s, -14 * s, 7 * s, 14 * s);
      ctx.fillRect(2 * s, -14 * s, 7 * s, 14 * s);
      ctx.restore();
      return;
    }

    if (e.kind === 'chaos') {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(PUR, 0.92);
      ctx.beginPath();
      ctx.ellipse(0, -22 * s, 20 * s, 24 * s, 0, 0, TAU);
      ctx.fill();
      let t;
      ctx.strokeStyle = rgba(MAG, 0.8);
      ctx.lineWidth = 4 * s;
      for (t = 0; t < 4; t++) {
        ctx.beginPath();
        ctx.moveTo((t - 1.5) * 8 * s, -6 * s);
        ctx.quadraticCurveTo((t - 1.5) * 14 * s, 10 * s + Math.sin(e.t * 4 + t) * 8 * s, (t - 1.5) * 18 * s, 16 * s);
        ctx.stroke();
      }
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.arc(-6 * s, -28 * s, 4 * s, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(6 * s, -28 * s, 4 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#100404';
      ctx.beginPath();
      ctx.arc(-6 * s, -28 * s, 1.6 * s, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(6 * s, -28 * s, 1.6 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.85);
      ctx.beginPath();
      ctx.ellipse(0, -14 * s, 10 * s, 6 * s, 0, 0, Math.PI);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.fillStyle = flash ? rgba(WHT, 0.9) : (e.kind === 'glass' ? rgba(STEEL, 0.85) : rgba(ROT, 0.92));
    ctx.fillRect(-6 * s, -e.h * s + 8 * s, 12 * s, e.h * s - 8 * s);
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : (e.kind === 'glass' ? rgba(WHT, 0.8) : '#3a2420');
    ctx.beginPath();
    ctx.arc(0, -e.h * s + 6 * s, 6 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.fillRect(-3 * s, -e.h * s + 4 * s, 2.2 * s, 2.2 * s);
    ctx.fillRect(1 * s, -e.h * s + 4 * s, 2.2 * s, 2.2 * s);
    ctx.fillStyle = '#100404';
    ctx.fillRect(-3 * s, -e.h * s + 10 * s, 6 * s, 2 * s);
    if (e.kind === 'glass') {
      ctx.strokeStyle = rgba(CYN, 0.5);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-4 * s, -e.h * s);
      ctx.lineTo(3 * s, -e.h * s + 12 * s);
      ctx.stroke();
    }
    if (e.kind === 'hang' && e.hanging) {
      ctx.fillStyle = rgba(HOT, 0.5);
      ctx.fillRect(-2 * s, -e.h * s - 6 * s, 4 * s, 8 * s);
    }
    ctx.restore();
  }

  function drawShot(s) {
    if (s.dead) return;
    const x = sx(s.x);
    const y = sy(s.y);
    ctx.fillStyle = rgba(MAG, 0.85);
    ctx.beginPath();
    ctx.arc(x, y, s.r * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.7);
    ctx.beginPath();
    ctx.arc(x - 1 * scale, y - 1 * scale, 2.4 * scale, 0, TAU);
    ctx.fill();
  }

  function drawFx() {
    let i, o, a;
    for (i = 0; i < trails.length; i++) {
      o = trails[i];
      a = 1 - o.t / o.life;
      ctx.strokeStyle = rgba(HOT, a * 0.7);
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), 16 * scale, o.face > 0 ? -1.2 : 2.2, o.face > 0 ? 0.8 : 4.2);
      ctx.stroke();
    }
    for (i = 0; i < rings.length; i++) {
      o = rings[i];
      a = 1 - o.t / 0.28;
      ctx.strokeStyle = rgba(o.rgb, a * 0.7);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.r + o.t * 70) * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < sparks.length; i++) {
      o = sparks[i];
      a = 1 - o.t / 0.22;
      ctx.fillStyle = rgba(o.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.rad * a) * scale * 0.35, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < particles.length; i++) {
      o = particles[i];
      a = clamp(o.life / o.max, 0, 1);
      ctx.fillStyle = rgba(o.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), o.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (i = 0; i < floats.length; i++) {
      o = floats[i];
      a = 1 - o.t / o.life;
      ctx.fillStyle = rgba(o.rgb, a);
      ctx.font = 'bold ' + (o.size * scale) + 'px sans-serif';
      ctx.fillText(o.text, sx(o.x), sy(o.y));
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#100404';
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
    drawPits();
    drawPlats();
    drawDrips();

    let i;
    for (i = 0; i < G.drops.length; i++) drawPickup(G.drops[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);
    if (G.player && (G.deadT <= 0 || G.mode === 'play')) drawRick(G.player);
    drawFx();

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
    if (G.mode === 'title') startGame('run');
    else if (G.mode === 'win' || G.mode === 'lose') startGame(G.kind);
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
      if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') {
        keys.u = down;
        if (down && live()) G.jumpBuf = BUFFER;
      }
      if (space) {
        keys.slash = down;
        if (down && live()) G.slashBuf = BUFFER;
      }
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
      startGame('run');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('tide');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        if (!space) keys.slash = false;
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
    hold(document.getElementById('btn-jump'), function () { keys.u = true; if (live()) G.jumpBuf = BUFFER; }, function () { keys.u = false; });
    hold(document.getElementById('btn-slash'), function () { keys.slash = true; if (live()) G.slashBuf = BUFFER; }, function () { keys.slash = false; });
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen() || autoOn) return;
      keys.slash = true;
      if (live()) G.slashBuf = BUFFER;
    });
    canvas.addEventListener('pointerup', function () { keys.slash = false; });
    canvas.addEventListener('pointercancel', function () { keys.slash = false; });
    canvas.addEventListener('pointerleave', function () { keys.slash = false; });
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

  if (btnRun) {
    btnRun.addEventListener('click', function () {
      audio.ensure();
      startGame('run');
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
  if (modeRun) {
    modeRun.addEventListener('click', function () {
      audio.ensure();
      startGame('run');
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
      keys.slash = false;
    }
  });

  requestAnimationFrame(frame);
})();
